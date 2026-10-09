"""Regional inversion: recover the semantic representation from ONE anatomical ROI only,
versus a size-matched random vertex set, through frozen TRIBE v2.

All problems share ground truth (seed 0), initialisation (seed 999, 0.01*randn) and the
8000-step Adam + cosine schedule used in the Colab extent sweep, so numbers are directly
comparable to it. Problems are solved jointly in one batch; with per-problem mean losses
summed, Adam's elementwise update makes this identical to solving them separately.
Checkpoints every 500 steps; rerun to resume.
"""
import os as _os; ROOT = _os.environ.get("PROJECT_ROOT", _os.path.dirname(_os.path.dirname(_os.path.abspath(__file__))))
import json, math, os, time
import numpy as np
import torch

from load_tribe import load, make_fwd
from roi_defs import load_rois

torch.set_num_threads(2)
STEPS = 8000
T_LEN = 32
OUT = ROOT + "/results"
CKPT = f"{OUT}/roi_inversion_ckpt.pt"
SLOTS = {"text": slice(0, 384), "audio": slice(384, 768), "video": slice(768, 1152)}


def make_truth(H, cycles=2.0, n_basis=8, seed=0):
    g = torch.Generator().manual_seed(seed)
    b = torch.randn(n_basis, H, generator=g)
    b = b / b.norm(dim=1, keepdim=True)
    t = torch.linspace(0, 1, T_LEN).unsqueeze(1)
    f = torch.arange(1, n_basis + 1, dtype=torch.float32) * cycles
    x = torch.cos(2 * math.pi * t * f) @ b
    return (x / x.std()).unsqueeze(0)


def random_mask(n, seed):
    # identical scheme to the Colab extent sweep: randperm(V, seed+3)[:n] with seed 0 -> 3
    g = torch.Generator().manual_seed(seed)
    return torch.randperm(20484, generator=g)[:n].numpy()


def build_problems():
    rois = load_rois()
    probs = [("Whole cortex", "anchor", np.arange(20484))]
    for name, v in rois.items():
        probs.append((name, "roi", v))
    for name, v in rois.items():
        probs.append((f"Random |{name}|", "control_s3", random_mask(len(v), 3)))
    for name in ["Language (L)", "Auditory"]:
        probs.append((f"Random |{name}| rep", "control_s4", random_mask(len(rois[name]), 4)))
    return probs


def cos_slot(a, b, sl=slice(None)):
    return torch.nn.functional.cosine_similarity(a[:, sl], b[:, sl], dim=1).mean().item()


def main():
    net, _ = load()
    fwd = make_fwd(net)
    H = net.low_rank_head.in_features
    probs = build_problems()
    B = len(probs)
    truth = make_truth(H, seed=0)
    with torch.no_grad():
        target = fwd(truth)                                   # (1, V, T')
    W = torch.zeros(B, 20484)
    for i, (_, _, v) in enumerate(probs):
        W[i, torch.as_tensor(v)] = 1.0
    denom = W.sum(1) * target.shape[2]                        # entries per problem

    g = torch.Generator().manual_seed(999)
    x_init = (0.01 * torch.randn(1, T_LEN, H, generator=g)).repeat(B, 1, 1)
    x = x_init.clone().requires_grad_(True)
    opt = torch.optim.Adam([x], lr=5e-2)
    sched = torch.optim.lr_scheduler.CosineAnnealingLR(opt, T_max=STEPS)
    start = 0
    if os.path.exists(CKPT):
        ck = torch.load(CKPT)
        x.data.copy_(ck["x"]); opt.load_state_dict(ck["opt"]); sched.load_state_dict(ck["sched"])
        start = ck["step"]
        print(f"resumed at step {start}", flush=True)

    t0 = time.time()
    for step in range(start, STEPS):
        opt.zero_grad()
        pred = fwd(x)                                         # (B, V, T')
        err = (pred - target).pow(2).sum(2)                   # (B, V)
        per = (err * W).sum(1) / denom                        # per-problem masked MSE
        per.sum().backward()
        opt.step(); sched.step()
        if (step + 1) % 100 == 0:
            el = time.time() - t0
            eta = el / (step + 1 - start) * (STEPS - step - 1) / 60
            print(f"step {step + 1:5d}  mean mse {per.mean().item():.3e}  eta {eta:.0f} min", flush=True)
        if (step + 1) % 500 == 0:
            torch.save({"x": x.detach(), "opt": opt.state_dict(), "sched": sched.state_dict(),
                        "step": step + 1}, CKPT)

    xr = x.detach()
    with torch.no_grad():
        pred = fwd(xr)
    tr = truth[0]
    rows = []
    for i, (name, kind, v) in enumerate(probs):
        r = xr[i]
        row = {"name": name, "kind": kind, "n_vertices": int(len(v)),
               "fit_mse_on_roi": float(((pred[i, torch.as_tensor(v)] - target[0, torch.as_tensor(v)]) ** 2).mean()),
               "enc_rel_err_whole_cortex": float((pred[i] - target[0]).norm() / target[0].norm()),
               "cosine": cos_slot(r, tr),
               "rel_err": float((r - tr).norm() / tr.norm())}
        for s, sl in SLOTS.items():
            row[f"cosine_{s}"] = cos_slot(r, tr, sl)
        rows.append(row)
        print(f"{name:34s} n={row['n_vertices']:5d} cos {row['cosine']:.4f}  text {row['cosine_text']:.4f}  "
              f"audio {row['cosine_audio']:.4f}  video {row['cosine_video']:.4f}  "
              f"wholeEnc {row['enc_rel_err_whole_cortex']:.3e}", flush=True)
    json.dump({"steps": STEPS, "truth_seed": 0, "init": "0.01*randn seed 999", "rows": rows},
              open(f"{OUT}/roi_inversion.json", "w"), indent=1)
    torch.save(xr, f"{OUT}/roi_solutions.pt")
    print(f"DONE in {(time.time() - t0) / 60:.1f} min", flush=True)


if __name__ == "__main__":
    main()
