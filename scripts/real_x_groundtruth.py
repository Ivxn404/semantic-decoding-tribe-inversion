"""Answer to 'is the synthetic ground truth representative?': repeat the uniqueness / barrier / sensitivity
tests with a REAL stimulus representation as ground truth.
x* = 32 steps (16 s) of the aggregated TRIBE v2 representation of a LeBel story (audio slot from w2v-BERT,
as produced by TRIBE v2's own feature pipeline); y = f(x*) through the frozen model, so recovery error is still exact.
Statistics of real vs synthetic x are also written (effective dimensionality, variance in 8 PCs, lag-1 autocorrelation)."""
import os as _os; ROOT = _os.environ.get("PROJECT_ROOT", _os.path.dirname(_os.path.dirname(_os.path.abspath(__file__))))
import glob, json, time, numpy as np, torch
import torch.nn.functional as F
from load_tribe import load, make_fwd
from synthetic_characterisation import make_truth, init_x
torch.set_num_threads(int(_os.environ.get("THREADS", "2")))
FEATS = _os.environ.get("REAL_X_DIR", ROOT + "/data/real_x")
STEPS = int(_os.environ.get("STEPS", "3000")); H = 1152


def stats(x):
    xc = x - x.mean(0); ev = np.linalg.svd(xc, compute_uv=False) ** 2
    lag = [np.corrcoef(xc[:-1, j], xc[1:, j])[0, 1] for j in range(x.shape[1]) if xc[:-1, j].std() > 1e-6 and xc[1:, j].std() > 1e-6]
    return {"participation_ratio": float(ev.sum() ** 2 / (ev ** 2).sum()), "var_top8": float(ev[:8].sum() / ev.sum()), "lag1": float(np.mean(lag))}


files = sorted(glob.glob(FEATS + "/*.npz")); X = np.concatenate([np.load(f)["x"] for f in files])
slot = slice(384, 768)                                   # the audio slot is the one filled for these stories
wins = [s[k:k + 32] for s in X for k in range(0, 169, 32)]
real_stats = [stats(w[:, slot]) for w in wins]
synth_stats = [stats(make_truth(seed=g)[0].cpu().numpy()) for g in range(4)]
out = {"real_windows": len(wins),
       "real": {k: [float(np.mean([r[k] for r in real_stats])), float(np.std([r[k] for r in real_stats]))] for k in real_stats[0]},
       "synthetic_default": {k: float(np.mean([r[k] for r in synth_stats])) for k in synth_stats[0]},
       "synthetic_white": {k: float(np.mean([stats(make_truth(seed=g, kind="white")[0].cpu().numpy())[k] for g in range(4)])) for k in synth_stats[0]},
       "synthetic_by_cycles": {str(c): stats(make_truth(cycles=c, seed=0)[0].cpu().numpy()) for c in [0.25, 0.5, 1, 2, 4, 8, 16]}}
print(json.dumps(out, indent=1), flush=True)

# ---- inversion with a real ground truth
net, _ = load(); fwd = make_fwd(net)
i0 = int(_os.environ.get("WINDOW", "0"))
xs = torch.tensor(wins[i0], dtype=torch.float32).unsqueeze(0)            # 1 x 32 x 1152, real
with torch.no_grad():
    y = fwd(xs)
names = ["gauss_0.01", "gauss_1.0", "uniform", "truth_perturbed"]
x0 = torch.cat([init_x(k, xs).cpu() for k in names])
x = x0.clone().requires_grad_(True); K = len(names)
opt = torch.optim.Adam([x], lr=5e-2); sch = torch.optim.lr_scheduler.CosineAnnealingLR(opt, T_max=STEPS); t0 = time.time()
for i in range(STEPS):
    opt.zero_grad(); ((fwd(x) - y) ** 2).mean(dim=(1, 2)).sum().backward(); opt.step(); sch.step()
    if (i + 1) % 250 == 0: print(f"step {i+1}/{STEPS} · {(time.time()-t0)/60:.1f} min", flush=True)
x = x.detach()
with torch.no_grad():
    mse = lambda z: ((fwd(z) - y) ** 2).mean().item()
    per = {n: {"mse": mse(x[k:k+1]), "cosine_all": F.cosine_similarity(x[k], xs[0], dim=-1).mean().item(),
               "cosine_audio_slot": F.cosine_similarity(x[k, :, slot], xs[0, :, slot], dim=-1).mean().item()} for k, n in enumerate(names)}
    blind = names[:3]; S = {n: x[k:k+1] for k, n in enumerate(names)}
    path = np.linspace(0, 1, 21); pairs = {}
    for a in range(3):
        for b in range(a + 1, 3):
            e = [mse(S[blind[a]] + s * (S[blind[b]] - S[blind[a]])) for s in path]
            pairs[f"{blind[a]}|{blind[b]}"] = {"cos": F.cosine_similarity(S[blind[a]], S[blind[b]], dim=-1).mean().item(), "peak": max(e[1:-1]) / max(e[0], e[-1]), "errors": e}
    a0 = min(blind, key=lambda n: per[n]["mse"])
    e2 = [mse(S[a0] + s * (S["truth_perturbed"] - S[a0])) for s in path]
    pa, pb = min(pairs, key=lambda k: pairs[k]["cos"]).split("|"); x1 = S[pa]; eps = 1e-2 * x1.norm().item(); f1 = fwd(x1)
    g = torch.Generator().manual_seed(11); sv = lambda v: ((fwd(x1 + eps * v / v.norm()) - f1).norm() / eps).item()
    rnd = np.array([sv(torch.randn(x1.shape, generator=g)) for _ in range(200)])
out["inversion"] = {"window": i0, "steps": STEPS, "per_start": per, "pairs": pairs,
                    "blind_to_truth": {"from": a0, "peak": max(e2[1:-1]) / max(e2[0], e2[-1]), "errors": e2},
                    "sensitivity": {"pair": [pa, pb], "ratio_median_over_d": float(np.median(rnd) / sv(S[pb] - x1)), "ratio_median_over_error": float(np.median(rnd) / sv(x1 - xs))}}
json.dump(out, open(ROOT + "/results/real_x_groundtruth.json", "w"), indent=1)
print(json.dumps({k: v for k, v in out["inversion"].items() if k != "pairs"}, indent=1, default=str)[:3000]); print("DONE")
