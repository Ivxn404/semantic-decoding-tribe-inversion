"""
Final phase: semantic decoding on REAL fMRI (LeBel et al. 2023, OpenNeuro ds003020)
by inversion of frozen TRIBE v2.  Run stage by stage in Colab (GPU) with `model` loaded.

    %run -i realdata_lebel.py --stage fetch      # A. stories, word timings (CPU, minutes)
    %run -i realdata_lebel.py --stage features   # B. candidate x per segment (GPU, LLaMA access)
    # C. BOLD on fsaverage5 -> see SURFACE PROJECTION below (workstation step)
    %run -i realdata_lebel.py --stage decode     # D. invert real BOLD, identify segments, per ROI

EVALUATION (no ground truth exists for real fMRI, so we use identification):
  The measured BOLD of each held-out segment is inverted to x_hat. x_hat is compared with the
  candidate representations of all N segments. Top-1 accuracy has an exact chance level 1/N.
  The same is repeated with ROI-only inversion (recoverability per network) and compared with the
  encoding score per network (predictability), giving the real-data predictable-vs-recoverable test.

SURFACE PROJECTION (stage C):
  TRIBE v2 predicts the fsaverage5 surface (20 484 vertices, left then right). Raw ds003020 BOLD is in
  native space. Project with fMRIPrep:
      fmriprep ds003020 out participant --participant-label UTS03 \
          --output-spaces fsaverage5 --fs-license-file license.txt
  then for each story run save np.load-able arrays  bold/<story>.npy  of shape (n_TR, 20484),
  z-scored per vertex, TR = 2 s, with the first 10 s (blank) removed to align with word onsets.
"""
import argparse, json, math, os, re, sys, urllib.request
import numpy as np

S3 = "https://s3.amazonaws.com/openneuro.org/ds003020"
WORK = os.environ.get("LEBEL_WORK", "/content/lebel")
SUBJECT = "UTS03"
STORIES = ["wheretheressmoke", "adollshouse", "avatar", "legacy", "souls", "undertheinfluence"]
TR = 2.0
SEG_TR = 16          # 32 s segments = 32 TRIBE input steps at 1 Hz after resampling


# ----------------------------------------------------------------------------- A. fetch
def fetch(url, dst):
    if os.path.exists(dst) and os.path.getsize(dst) > 0:
        return dst
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    urllib.request.urlretrieve(url, dst)
    return dst


def parse_textgrid(path):
    """Minimal Praat TextGrid reader (long format) -> list of (start, stop, word) for the word tier."""
    txt = open(path, encoding="utf-8").read()
    bad = {"", "sp", "sil", "{sp}", "{ns}", "{lg}", "{ls}", "{br}", "br", "lg", "ls", "ns",
           "sentence_start", "sentence_end"}
    if txt.lstrip().startswith('"Praat chronological'):
        names = re.findall(r'"IntervalTier" "([^"]*)"', txt)
        widx = 1 + [i for i, n in enumerate(names) if "word" in n.lower()][0]
        out = re.findall(r'^(\d+) ([\d.]+) ([\d.]+)\s*\n"([^"]*)"', txt, flags=re.M)
        return [(float(a), float(b), w.strip()) for t, a, b, w in out
                if int(t) == widx and w.strip().lower() not in bad]
    tiers = re.split(r'item \[\d+\]:', txt)[1:]
    for tier in tiers:
        name = re.search(r'name = "([^"]*)"', tier).group(1).lower()
        if "word" not in name:
            continue
        iv = re.findall(r'xmin = ([\d.]+)\s*xmax = ([\d.]+)\s*text = "([^"]*)"', tier)
        return [(float(a), float(b), w.strip()) for a, b, w in iv if w.strip().lower() not in bad]
    raise ValueError("no word tier in " + path)


def stage_fetch():
    out = {}
    for st in STORIES:
        tg = fetch(f"{S3}/derivatives/TextGrids/{st}.TextGrid", f"{WORK}/textgrids/{st}.TextGrid")
        words = parse_textgrid(tg)
        out[st] = {"n_words": len(words), "duration_s": words[-1][1] if words else 0.0}
        print(f"{st:22s} {len(words):5d} words  {out[st]['duration_s']:.0f} s")
    json.dump(out, open(f"{WORK}/inventory.json", "w"), indent=1)
    print("audio (large, needed for stage B):")
    for st in STORIES:
        print(f"   {S3}/stimuli/{st}.wav")


# ----------------------------------------------------------------------------- B. features
def stage_features():
    """Candidate representation x per 32-s segment, through TRIBE v2's own extractors."""
    import pandas as pd, torch
    m = globals().get("model")
    assert m is not None, "load TribeModel as `model` first"
    net = m._model
    rows = {}
    for st in STORIES:
        wav = fetch(f"{S3}/stimuli/{st}.wav", f"{WORK}/stimuli/{st}.wav")
        words = parse_textgrid(f"{WORK}/textgrids/{st}.TextGrid")
        # events in TRIBE's format: one Audio event + one Word event per word (cf. studies/lebel2023bold.py)
        ev = [dict(start=0.0, type="Audio", filepath=wav, language="english", split="test")]
        ev += [dict(start=a, duration=b - a, type="Word", text=w, language="english", split="test")
               for a, b, w in words]
        df = pd.DataFrame(ev)
        loader = m.data.get_loaders(events=df, split_to_build="all")["all"]
        xs = []
        with torch.no_grad():
            for batch in loader:
                xs.append(net.aggregate_features(batch.to(net.device)).cpu())
        X = torch.cat(xs).numpy()                     # (n_segments, T, 1152)
        np.save(f"{WORK}/x_{st}.npy", X)
        rows[st] = list(X.shape)
        print(st, X.shape)
    json.dump(rows, open(f"{WORK}/features.json", "w"))


# ----------------------------------------------------------------------------- D. decode
def identify(xhat, cands):
    """Rank of the true candidate (index i for xhat[i]) by mean per-time-step cosine."""
    def nrm(a):
        return a / (np.linalg.norm(a, axis=-1, keepdims=True) + 1e-8)
    sims = np.einsum("itd,jtd->ij", nrm(xhat), nrm(cands)) / xhat.shape[1]   # (N, N)
    ranks = (sims > np.diag(sims)[:, None]).sum(1)
    return {"top1": float((ranks == 0).mean()), "top5": float((ranks < 5).mean()),
            "mean_rank_pct": float(1 - ranks.mean() / (len(ranks) - 1)), "chance_top1": 1 / len(ranks)}


def invert_batch(fwd, Y, mask, steps=8000, T=32, H=1152, device="cpu"):
    """Invert measured responses Y (N, V, T') through frozen fwd, observing only `mask` vertices."""
    import torch
    Y = torch.as_tensor(Y, dtype=torch.float32, device=device)
    W = torch.zeros(Y.shape[1], device=device); W[torch.as_tensor(mask, device=device)] = 1.0
    g = torch.Generator().manual_seed(999)
    x = (0.01 * torch.randn(Y.shape[0], T, H, generator=g)).to(device).requires_grad_(True)
    opt = torch.optim.Adam([x], lr=5e-2)
    sch = torch.optim.lr_scheduler.CosineAnnealingLR(opt, T_max=steps)
    for _ in range(steps):
        opt.zero_grad()
        err = ((fwd(x) - Y) ** 2).mean(2)                       # (N, V)
        ((err * W).sum(1) / W.sum()).sum().backward()
        opt.step(); sch.step()
    return x.detach().cpu().numpy()


def encoding_score(pred, Y, mask):
    """Mean Pearson r over masked vertices between predicted and measured responses."""
    p = pred[:, mask].transpose(1, 0, 2).reshape(len(mask), -1)
    y = Y[:, mask].transpose(1, 0, 2).reshape(len(mask), -1)
    p = (p - p.mean(1, keepdims=True)) / (p.std(1, keepdims=True) + 1e-8)
    y = (y - y.mean(1, keepdims=True)) / (y.std(1, keepdims=True) + 1e-8)
    return float((p * y).mean(1).mean())


def stage_decode(steps=8000):
    """Needs x_<story>.npy (stage B) and bold/<story>.npy (stage C) with matching segment counts."""
    import torch
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    from roi_defs import load_rois
    m = globals().get("model")
    net = m._model
    dev = next(net.parameters()).device

    def fwd(x):
        x = net.transformer_forward(x, None).transpose(1, 2)
        x = net.low_rank_head(x.transpose(1, 2)).transpose(1, 2)
        return net.pooler(net.predictor(x, None))

    cands, Ys = [], []
    for st in STORIES:
        X = np.load(f"{WORK}/x_{st}.npy")
        B = np.load(f"{WORK}/bold/{st}.npy")                    # (n_TR, 20484)
        n = min(len(X), len(B) // SEG_TR)
        for i in range(n):
            seg = B[i * SEG_TR:(i + 1) * SEG_TR].T                 # (V, 16) at TR = 2 s
            seg = np.repeat(seg, 100 // SEG_TR + 1, axis=1)[:, :100]  # to TRIBE's 100 output steps
            Ys.append(seg); cands.append(X[i])
    cands, Ys = np.stack(cands), np.stack(Ys)
    print(f"{len(cands)} segments from {len(STORIES)} stories; chance top-1 = {1 / len(cands):.3f}")
    with torch.no_grad():
        pred = torch.cat([fwd(torch.as_tensor(cands[i:i + 8], device=dev)).cpu()
                          for i in range(0, len(cands), 8)]).numpy()
    rois = dict(load_rois()); rois["Whole cortex"] = np.arange(20484)
    res = {}
    for name, mask in rois.items():
        xh = np.concatenate([invert_batch(fwd, Ys[i:i + 8], mask, steps, device=dev)
                             for i in range(0, len(Ys), 8)])
        res[name] = {"encoding_r": encoding_score(pred, Ys, mask), **identify(xh, cands),
                     "n_vertices": int(len(mask))}
        print(name, res[name])
        json.dump(res, open(f"{WORK}/realdata_results.json", "w"), indent=1)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--stage", choices=["fetch", "features", "decode"], required=True)
    ap.add_argument("--steps", type=int, default=8000)
    a = ap.parse_args()
    os.makedirs(WORK, exist_ok=True)
    {"fetch": stage_fetch, "features": stage_features,
     "decode": lambda: stage_decode(a.steps)}[a.stage]()
