"""Record a real multi-start inversion through frozen TRIBE v2 for the interactive live demo.
Three initialisations are inverted together (batch of 3) against the same known target (whole cortex, 2400 steps).
Logged every 40 steps: recovery cosine and prediction MSE per start, pairwise cosine between starts.
Logged every 120 steps: start-0 predicted map at output step 50 and per-vertex R² against the target over time.
At the end: a forward-only barrier test between starts 0 and 1 (no optimiser involved)."""
import os as _os; ROOT = _os.environ.get("PROJECT_ROOT", _os.path.dirname(_os.path.dirname(_os.path.abspath(__file__))))
import json, numpy as np, torch
import torch.nn.functional as F
from load_tribe import load, make_fwd
from roi_inversion import make_truth
torch.set_num_threads(int(_os.environ.get("THREADS", "2")))
net, _ = load(); fwd = make_fwd(net); H = 1152; STEPS = int(_os.environ.get("STEPS", "2400")); K = 3
truth = make_truth(H, seed=0)
with torch.no_grad():
    y = fwd(truth)
Y = y.expand(K, -1, -1)
g = torch.Generator().manual_seed(999)
inits = [("Gaussian, s.d. 0.01", 0.01 * torch.randn(1, 32, H, generator=g)),   # the paper's default start
         ("Gaussian, s.d. 1.0", 1.0 * torch.randn(1, 32, H, generator=g)),
         ("Uniform on [-1, 1]", torch.rand(1, 32, H, generator=g) * 2 - 1)]
x = torch.cat([v for _, v in inits]).requires_grad_(True)
opt = torch.optim.Adam([x], lr=5e-2); sch = torch.optim.lr_scheduler.CosineAnnealingLR(opt, T_max=STEPS)


def vr2(p, t):
    """per-vertex coefficient of determination of the prediction over the 100 output steps"""
    return 1 - ((p - t) ** 2).sum(-1) / (((t - t.mean(-1, keepdim=True)) ** 2).sum(-1) + 1e-12)


def flatcos(a, b):
    return F.cosine_similarity(a.reshape(-1), b.reshape(-1), dim=0).item()


log, maps, rmaps, mapsteps = [], [], [], []
for i in range(STEPS + 1):
    if i % 40 == 0:
        with torch.no_grad():
            p = fwd(x)
            cos = [F.cosine_similarity(x[k], truth[0], dim=1).mean().item() for k in range(K)]
            mse = [F.mse_loss(p[k], y[0]).item() for k in range(K)]
            pair = [flatcos(x[a], x[b]) for a, b in ((0, 1), (0, 2), (1, 2))]
            log.append({"step": i, "cos": cos, "mse": mse, "pair": pair,
                        "cos_t": F.cosine_similarity(x[0], truth[0], dim=1).tolist()})
            if i % 120 == 0:
                maps.append(p[0, :, 50].numpy().astype(np.float16))
                rmaps.append(vr2(p[0], y[0]).clamp(-1, 1).numpy().astype(np.float16))
                mapsteps.append(i)
        print(i, [round(c, 3) for c in cos], [f"{m:.2e}" for m in mse], [round(c, 3) for c in pair], flush=True)
    if i == STEPS:
        break
    opt.zero_grad(); l = F.mse_loss(fwd(x), Y) * K; l.backward(); opt.step(); sch.step()

# forward-only barrier test between start 0 and start 1: prediction change along d vs random directions of equal length
with torch.no_grad():
    a, b = x[0:1].detach(), x[1:2].detach(); d = b - a; nd = d.norm(); fa = fwd(a)
    g = torch.Generator().manual_seed(11); rnd = []
    for _ in range(8):
        r = torch.randn(d.shape, generator=g); rnd.append(r / r.norm() * nd)
    barrier = []
    for s in (0.1, 0.25, 0.5, 1.0):
        md = F.mse_loss(fwd(a + s * d), fa).item()
        mr = float(np.median([F.mse_loss(fwd(a + s * r), fa).item() for r in rnd]))
        barrier.append({"scale": s, "mse_d": md, "mse_rand": mr, "ratio": mr / md})
        print("barrier", barrier[-1], flush=True)
np.savez_compressed(ROOT + "/results/demo_brain_maps.npz", pred=np.stack(maps), r=np.stack(rmaps), target=y[0, :, 50].numpy().astype(np.float16),
                    steps=np.array(mapsteps))
json.dump({"inits": [n for n, _ in inits], "log": log, "barrier": barrier, "target_step": 50},
          open(ROOT + "/results/demo_brain_run.json", "w"))
print("DONE")
