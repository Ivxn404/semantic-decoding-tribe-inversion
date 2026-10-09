"""Real-data evaluation of TRIBE v2 inversion on LeBel et al. 2023 (subject UTS03, fsaverage5).

Needs  bold_fs5/<story>.npy          (n_TR, 20484)  from lebel_apply.py
       feats_<tag>/<story>.npz       x, pred, start_s from lebel_features.py
Held-out story: wheretheressmoke (mean of 10 repeats; not in TRIBE's training set).
Every choice that could be tuned (lag, vertex set) is fitted on the five other stories only.

    python lebel_eval.py --tag audio --steps 600        # CPU, ~1 h
    python lebel_eval.py --tag audio_text --steps 2000  # Colab GPU

Stages
  1 lag      align model output (1 Hz) with BOLD rows (TR 2 s) by scanning the offset
  2 encode   per-vertex Pearson r on every story; ROI means; split-half noise ceiling on the held-out story
  3 ident    forward identification: which 20 s window of all stories produced this held-out BOLD window?
  4 invert   the project's method on real fMRI: invert held-out BOLD segments to x-hat, then identify x-hat
             among all stories' true representations; an 'oracle' run inverts the model's own
             prediction with the same budget to give the ceiling for that budget
"""
import os as _os; ROOT = _os.environ.get("PROJECT_ROOT", _os.path.dirname(_os.path.dirname(_os.path.abspath(__file__))))
import argparse, json, os, sys, time
import numpy as np, h5py, scipy.sparse as sp
from scipy.signal import detrend

HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
STORIES = ["wheretheressmoke", "adollshouse", "avatar", "legacy", "souls", "undertheinfluence"]
TEST, TR = "wheretheressmoke", 2.0


def zs(a, ax=0):
    return (a - a.mean(ax, keepdims=True)) / (a.std(ax, keepdims=True) + 1e-8)


def continuous_pred(npz):
    """Average overlapping 100-s segments into one 1-Hz prediction (t_s, 20484)."""
    P, S = npz["pred"].astype(np.float32), npz["start_s"]
    n = int(np.ceil(S.max())) + P.shape[2]
    acc = np.zeros((n, P.shape[1]), np.float32); cnt = np.zeros(n)
    for k, s0 in enumerate(S):
        i0 = int(round(s0)); acc[i0:i0 + P.shape[2]] += P[k].T; cnt[i0:i0 + P.shape[2]] += 1
    ok = cnt > 0
    acc[ok] /= cnt[ok, None]
    return acc, ok


def aligned(B, Pc, ok, lag):
    """Rows i of BOLD paired with prediction at t = TR*(i + lag) seconds."""
    t = (TR * (np.arange(len(B)) + lag)).astype(int)
    v = (t >= 0) & (t < len(Pc)); v[v] &= ok[t[v]]
    return B[v], Pc[t[v]], np.where(v)[0]


def vertex_r(a, b):
    return (zs(a) * zs(b)).mean(0)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--work", default=os.environ.get("LEBEL_WORK", ROOT + "/data/lebel"))
    ap.add_argument("--tag", default="audio")
    ap.add_argument("--steps", type=int, default=600)
    ap.add_argument("--win", type=int, default=10, help="identification window in TRs")
    ap.add_argument("--nvert", type=int, default=2000)
    ap.add_argument("--weights", default=ROOT + "/weights")
    ap.add_argument("--skip_invert", action="store_true")
    ap.add_argument("--regional", action="store_true", help="stage 5: per-network inversion over all segments")
    ap.add_argument("--reg_steps", type=int, default=1000)
    a = ap.parse_args()
    os.environ.setdefault("TRIBE_WEIGHTS", a.weights)
    W = a.work; out = {"tag": a.tag, "held_out": TEST}
    from roi_defs import load_rois
    rois = dict(load_rois())

    F = {s: np.load(f"{W}/feats_{a.tag}/{s}.npz") for s in STORIES}
    B = {s: np.load(f"{W}/bold_fs5/{s}.npy").astype(np.float32) for s in STORIES}
    PC = {s: continuous_pred(F[s]) for s in STORIES}
    train = [s for s in STORIES if s != TEST]

    # ---------------------------------------------------------------- 1 lag
    lags = list(range(-5, 26))
    curve = []
    for L in lags:
        rs = [vertex_r(*aligned(B[s], *PC[s], L)[:2]).mean() for s in train]
        curve.append(float(np.mean(rs)))
    lag = lags[int(np.argmax(curve))]
    out["lag"] = {"lags_TR": lags, "mean_r_train": curve, "best_TR": lag, "best_s": lag * TR}
    print(f"[lag] best offset {lag} TR ({lag * TR:.0f} s), train mean r {max(curve):.4f}", flush=True)

    # ---------------------------------------------------------------- 2 encode
    R = {s: vertex_r(*aligned(B[s], *PC[s], lag)[:2]) for s in STORIES}
    rtrain = np.mean([R[s] for s in train], 0)
    top = np.argsort(-rtrain)[:a.nvert]                      # chosen on training stories only
    enc = {}
    for s in STORIES:
        enc[s] = {"whole_cortex": float(R[s].mean()), f"top{a.nvert}_by_train": float(R[s][top].mean()),
                  **{k: float(R[s][v].mean()) for k, v in rois.items()}}
    out["encoding_r"] = enc
    # split-half noise ceiling for the held-out story (repeats projected with the same sampler)
    try:
        Smat = sp.load_npz(f"{W}/pycx/sampler.npz")
        with h5py.File(f"{W}/hf5/{TEST}.hf5", "r") as f:
            reps = [zs(detrend((Smat @ np.nan_to_num(f["individual_repeats"][k]).T).T, axis=0)) for k in range(10)]
        h1, h2 = np.mean(reps[0::2], 0), np.mean(reps[1::2], 0)
        rh = vertex_r(h1, h2); rc = np.clip(2 * rh / (1 + rh), 1e-3, 1)   # Spearman-Brown to 10 repeats
        ceil = np.sqrt(rc)
        Rt = R[TEST]
        out["noise_ceiling"] = {"median_split_half_r": float(np.median(rh)), f"top{a.nvert}_ceiling": float(ceil[top].mean()),
                                f"top{a.nvert}_normalised_r": float((Rt[top] / ceil[top]).mean())}
        del reps
        print(f"[ceiling] {out['noise_ceiling']}", flush=True)
    except Exception as e:
        print("[ceiling] skipped:", e)
    print(f"[encode] held-out r: whole {enc[TEST]['whole_cortex']:.4f}  top{a.nvert} {enc[TEST][f'top{a.nvert}_by_train']:.4f}", flush=True)

    # ---------------------------------------------------------------- 3 forward identification
    def windows(s):
        b, p, _ = aligned(B[s], *PC[s], lag)
        n = len(b) // a.win
        return [(b[i * a.win:(i + 1) * a.win], p[i * a.win:(i + 1) * a.win]) for i in range(n)]
    allw = {s: windows(s) for s in STORIES}
    cand_p = np.stack([p for s in STORIES for _, p in allw[s]])        # (N, win, V)
    test_idx = np.arange(len(allw[TEST]))                              # TEST is first in STORIES
    ident = {}
    for name, verts in [(f"top{a.nvert}", top)] + list(rois.items()):
        C = zs(cand_p[:, :, verts].reshape(len(cand_p), -1), 1)
        ranks = []
        for i in test_idx:
            q = zs(allw[TEST][i][0][:, verts].reshape(-1), 0)
            sims = C @ q / len(q)
            ranks.append(int((sims > sims[i]).sum()))
        ranks = np.array(ranks)
        ident[name] = {"top1": float((ranks == 0).mean()), "top5": float((ranks < 5).mean()),
                       "rank_percentile": float(1 - ranks.mean() / (len(cand_p) - 1)),
                       "chance_top1": 1 / len(cand_p), "n_queries": len(ranks), "n_candidates": len(cand_p)}
    out["identification_forward"] = ident
    print(f"[ident] {a.win * TR:.0f}-s windows, {len(cand_p)} candidates: top{a.nvert} top-1 {ident[f'top{a.nvert}']['top1']:.3f} "
          f"(chance {1 / len(cand_p):.3f}), rank pct {ident[f'top{a.nvert}']['rank_percentile']:.3f}", flush=True)
    json.dump(out, open(f"{W}/realdata_{a.tag}.json", "w"), indent=1)
    if a.skip_invert:
        return

    # ---------------------------------------------------------------- 4 inversion on real fMRI
    import torch
    torch.manual_seed(0)
    from load_tribe import load, make_fwd
    dev = "cuda" if torch.cuda.is_available() else "cpu"
    net, _ = load(); net = net.to(dev); fwd = make_fwd(net)
    X = {s: F[s]["x"].astype(np.float32) for s in STORIES}
    cands = np.concatenate([X[s] for s in STORIES])                    # (N, T, 1152)
    free = cands.reshape(-1, cands.shape[-1]).std(0) > 1e-6            # dims the used modalities fill
    fixed_val = torch.as_tensor(cands.reshape(-1, cands.shape[-1]).mean(0)).to(dev)
    with torch.no_grad():
        chk = fwd(torch.as_tensor(X[TEST][:1]).to(dev)).cpu().numpy()[0]
    out["forward_check_r"] = float(np.corrcoef(chk.ravel(), F[TEST]["pred"][0].astype(np.float32).ravel())[0, 1])
    print(f"[invert] forward reproduces saved prediction: r = {out['forward_check_r']:.4f}; free dims {int(free.sum())}", flush=True)

    Tout = F[TEST]["pred"].shape[2]
    offs = np.cumsum([0] + [len(X[s]) for s in STORIES])[:-1]; OFF = dict(zip(STORIES, offs))

    def targets(story, verts):
        """BOLD of `story` on `verts`, aligned to each 100-s model segment at 1 Hz (BOLD row = t/TR - lag)."""
        Bs, S0 = B[story], F[story]["start_s"]
        tt = np.arange(len(Bs) * 2) / 2.0
        b1 = np.stack([np.interp(tt, np.arange(len(Bs)), Bs[:, v]) for v in verts], 1)
        Ys, ks = [], []
        for k in range(len(S0)):
            idx = np.round(((S0[k] + np.arange(Tout)) / TR - lag) * 2).astype(int)
            valid = (idx >= 0) & (idx < len(b1))
            if valid.mean() < 0.9:
                continue
            y = np.zeros((len(verts), Tout), np.float32); y[:, valid] = b1[idx[valid]].T
            Ys.append(y); ks.append(k)
        return np.stack(Ys), np.array(ks)

    freet = torch.as_tensor(free).to(dev)

    def corr_loss(pred, tgt):
        p = pred - pred.mean(-1, keepdim=True); t = tgt - tgt.mean(-1, keepdim=True)
        r = (p * t).sum(-1) / (p.norm(dim=-1) * t.norm(dim=-1) + 1e-8)
        return (1 - r).mean(-1)                                        # (batch,)

    def invert(tg, verts, steps, batch=16):
        """Invert targets tg (n, |verts|, Tout) observing only `verts`; returns x-hat and final 1 - r."""
        vt = torch.as_tensor(verts).to(dev); outs, losses = [], []
        for b0 in range(0, len(tg), batch):
            tb = torch.as_tensor(tg[b0:b0 + batch]).to(dev)
            n, T, H = len(tb), cands.shape[1], cands.shape[2]
            g = torch.Generator().manual_seed(999)
            z = (0.01 * torch.randn(n, T, H, generator=g)).to(dev).requires_grad_(True)
            opt = torch.optim.Adam([z], lr=5e-2); sch = torch.optim.lr_scheduler.CosineAnnealingLR(opt, T_max=steps)
            for it in range(steps):
                opt.zero_grad()
                loss = corr_loss(fwd(torch.where(freet, z, fixed_val))[:, vt], tb)
                loss.sum().backward(); opt.step(); sch.step()
                if it % 250 == 0 or it == steps - 1:
                    print(f"   batch {b0 // batch} step {it:5d}  1-r {loss.detach().mean():.4f}", flush=True)
            outs.append(torch.where(freet, z, fixed_val).detach().cpu().numpy()); losses.append(float(loss.detach().mean()))
        return np.concatenate(outs), float(np.mean(losses))

    def ident_x(xh, true_idx):
        c = cands[:, :, free]; q = xh[:, :, free]
        nrm = lambda u: u / (np.linalg.norm(u, axis=-1, keepdims=True) + 1e-8)
        sims = np.einsum("itd,jtd->ij", nrm(q), nrm(c)) / q.shape[1]   # (queries, N)
        ranks = np.array([(sims[i] > sims[i, true_idx[i]]).sum() for i in range(len(q))])
        own = np.array([sims[i, true_idx[i]] for i in range(len(q))])
        return {"top1": float((ranks == 0).mean()), "top3": float((ranks < 3).mean()),
                "rank_percentile": float(1 - ranks.mean() / (len(c) - 1)), "chance_top1": 1 / len(c),
                "cos_to_true_x": float(own.mean()), "ranks": ranks.tolist(), "n_candidates": len(c)}

    t0 = time.time()
    Y, keep = targets(TEST, top)
    xr, lr_ = invert(Y, top, a.steps); res_real = ident_x(xr, keep + OFF[TEST]); res_real["final_1_minus_r"] = lr_
    print(f"[invert] real BOLD: {res_real}  ({time.time() - t0:.0f}s)", flush=True)
    orc = F[TEST]["pred"][keep][:, top].astype(np.float32)
    xo, lo_ = invert(orc, top, a.steps); res_or = ident_x(xo, keep + OFF[TEST]); res_or["final_1_minus_r"] = lo_
    print(f"[invert] oracle (model's own prediction): {res_or}", flush=True)
    out["inversion_identification"] = {"steps": a.steps, "observed_vertices": a.nvert, "segment_s": Tout,
                                       "n_queries": int(len(keep)), "real_bold": res_real, "oracle_prediction": res_or}
    json.dump(out, open(f"{W}/realdata_{a.tag}.json", "w"), indent=1)
    print("saved", f"{W}/realdata_{a.tag}.json", flush=True)
    if not a.regional:
        return

    # ---------------------------------------------------------------- 5 regional recoverability on real fMRI
    # Every segment of every story is a query (the held-out story stays held out for lag and vertex choice;
    # the other five were seen by TRIBE v2 in training, so this stage is secondary to stage 4).
    prev = f"{W}/realdata_{a.tag}_regional.json"
    reg = json.load(open(prev)) if os.path.exists(prev) else {}            # resume after a disconnect
    ekey = lambda n: f"top{a.nvert}_by_train" if n.startswith("Top") else n
    for name, verts in [(f"Top {a.nvert} (train-selected)", top)] + list(rois.items()):
        if name in reg:
            print("cached", name); continue
        t0 = time.time(); Ys, idx = [], []
        for s in STORIES:
            y, k = targets(s, verts); Ys.append(y); idx.append(k + OFF[s])
        Ys, idx = np.concatenate(Ys), np.concatenate(idx)
        xh, l_ = invert(Ys, verts, a.reg_steps)
        res = ident_x(xh, idx); res.pop("ranks")
        reg[name] = {**res, "final_1_minus_r": l_, "n_vertices": int(len(verts)), "n_queries": int(len(idx)),
                     "encoding_r_heldout": out["encoding_r"][TEST][ekey(name)],
                     "encoding_r_all": float(np.mean([out["encoding_r"][s][ekey(name)] for s in STORIES]))}
        out["regional_inversion"] = reg; json.dump(reg, open(prev, "w"), indent=1)
        json.dump(out, open(f"{W}/realdata_{a.tag}.json", "w"), indent=1)
        print(f"[regional] {name}: top-1 {res['top1']:.3f} (chance {res['chance_top1']:.3f}), rank pct {res['rank_percentile']:.3f}, "
              f"cos {res['cos_to_true_x']:.3f}, encoding r {reg[name]['encoding_r_all']:.3f}  ({time.time() - t0:.0f}s)", flush=True)
    print("saved", f"{W}/realdata_{a.tag}.json")

if __name__ == "__main__":
    main()
