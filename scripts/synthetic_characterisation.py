"""Synthetic characterisation of the TRIBE v2 inverse (paper Sections IV-A to IV-E).

A known representation x is pushed through frozen TRIBE v2, y = f(x), and recovered from y alone,
so recovery error is exact. One sub-command per experiment; each writes results/synth_<name>.json.

    python synthetic_characterisation.py dissociation      # IV-A  encoding error vs recovery over step budgets
    python synthetic_characterisation.py inits             # IV-B  8 initialisations x 4 ground truths
    python synthetic_characterisation.py barrier           # IV-C  straight-path barrier between fit-matched blind solutions
    python synthetic_characterisation.py sensitivity       # IV-D  directional sensitivity of d vs 200 random directions
    python synthetic_characterisation.py gain noise extent priors ridge bandwidth manifold   # IV-E (Table IV)
    python synthetic_characterisation.py all

GPU strongly recommended (the original runs used a Colab T4). `--quick` shrinks every budget for a smoke test.
Protocol (as in the paper): T = 32 time steps, H = 1 152; ground truth = smooth trajectory in a random
8-D subspace (eight random directions, each with a cosine time course of 2, 4, ..., 16 cycles per 32-step window) unless stated; Adam lr 5e-2 with cosine annealing; init 0.01*N(0, I), seed 999.
"""
import argparse, json, math, os, sys, time
import numpy as np, torch

HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
from load_tribe import load, make_fwd                       # noqa: E402

T_LEN, H, V = 32, 1152, 20484
OUT = os.environ.get("RESULTS_DIR", os.path.join(HERE, "..", "results"))
DEV = "cuda" if torch.cuda.is_available() else "cpu"


# ------------------------------------------------------------------ building blocks
def make_truth(cycles=2.0, n_basis=8, seed=0, kind="smooth"):
    g = torch.Generator().manual_seed(seed)
    if kind == "white":
        x = torch.randn(T_LEN, H, generator=g)
    else:
        b = torch.randn(n_basis, H, generator=g); b = b / b.norm(dim=1, keepdim=True)
        t = torch.linspace(0, 1, T_LEN).unsqueeze(1)
        f = torch.arange(1, n_basis + 1, dtype=torch.float32) * cycles
        x = torch.cos(2 * math.pi * t * f) @ b
    return (x / x.std()).unsqueeze(0).to(DEV)


def random_mask(n, seed=3):
    g = torch.Generator().manual_seed(seed)
    return torch.randperm(V, generator=g)[:n].to(DEV)


def init_x(kind, truth, seed=999):
    g = torch.Generator().manual_seed(seed)
    r = lambda s: (s * torch.randn(truth.shape, generator=g)).to(DEV)
    return {"gauss_0.01": lambda: r(0.01), "gauss_0.1": lambda: r(0.1), "gauss_1.0": lambda: r(1.0),
            "gauss_5.0": lambda: r(5.0), "uniform": lambda: (torch.rand(truth.shape, generator=g) * 2 - 1).to(DEV),
            "zeros": lambda: torch.zeros_like(truth), "truth_perturbed": lambda: truth + r(0.5),
            "truth+noise": lambda: truth + r(1.0)}[kind]()


def invert(fwd, target, steps, mask=None, x0=None, l2=0.0, smooth=0.0):
    """x-hat = argmin ||f(x) - y||^2 (+ l2 ||x||^2 + smooth ||dx/dt||^2) over the observed vertices."""
    x = (x0 if x0 is not None else init_x("gauss_0.01", target.new_zeros(1, T_LEN, H))).clone().requires_grad_(True)
    opt = torch.optim.Adam([x], lr=5e-2); sch = torch.optim.lr_scheduler.CosineAnnealingLR(opt, T_max=steps)
    for _ in range(steps):
        opt.zero_grad()
        p = fwd(x)
        d = (p - target) if mask is None else (p - target)[:, mask]
        loss = (d ** 2).mean()
        if l2: loss = loss + l2 * (x ** 2).mean()
        if smooth: loss = loss + smooth * ((x[:, 1:] - x[:, :-1]) ** 2).mean()
        loss.backward(); opt.step(); sch.step()
    return x.detach()


def metrics(fwd, xh, x):
    with torch.no_grad():
        cos = torch.nn.functional.cosine_similarity(xh, x, dim=-1).mean().item()
        rel = ((xh - x).norm() / x.norm()).item()
        fx = fwd(x); enc = ((fwd(xh) - fx).norm() / fx.norm()).item()
        mse = ((fwd(xh) - fx) ** 2).mean().item()
        a = torch.nn.functional.normalize(xh[0], dim=-1); b = torch.nn.functional.normalize(x[0], dim=-1)
        S = a @ b.T; retr = ((S.diag()[:, None] > S).float().sum(1) / (T_LEN - 1)).mean().item()
    return {"cosine": cos, "rel_error": rel, "enc_rel_error": enc, "mse": mse, "retrieval": retr}


def save(name, obj):
    os.makedirs(OUT, exist_ok=True)
    json.dump(obj, open(f"{OUT}/synth_{name}.json", "w"), indent=1)
    print(f"[{name}] saved", flush=True)


# ------------------------------------------------------------------ experiments
def exp_dissociation(fwd, q):
    x = make_truth(); y = fwd(x).detach(); rows = []
    for s in ([25, 50] if q else [250, 500, 1000, 2000, 4000, 8000, 16000, 32000]):
        m = metrics(fwd, invert(fwd, y, s), x); rows.append({"steps": s, **m}); print(rows[-1], flush=True)
    save("dissociation", rows)


def exp_inits(fwd, q):
    steps = 30 if q else 14000; out = {}
    for gt in range(1 if q else 4):
        x = make_truth(seed=gt); y = fwd(x).detach(); sols = {}
        for k in ["gauss_0.01", "gauss_0.1", "gauss_1.0", "gauss_5.0", "uniform", "zeros", "truth_perturbed", "truth+noise"]:
            xh = invert(fwd, y, steps, x0=init_x(k, x)); sols[k] = (xh, metrics(fwd, xh, x))
        best = min(m["mse"] for _, m in sols.values())
        keep = {k: v for k, v in sols.items() if v[1]["mse"] <= 2 * best}            # fit-matched only
        names = list(keep); pc = []
        for i in range(len(names)):
            for j in range(i + 1, len(names)):
                c = torch.nn.functional.cosine_similarity(keep[names[i]][0], keep[names[j]][0], dim=-1).mean().item()
                pc.append({"a": names[i], "b": names[j], "cos": c})
        out[gt] = {"per_init": {k: v[1] for k, v in sols.items()}, "matched": names, "best_mse": best,
                   "mean_pairwise": float(np.mean([p["cos"] for p in pc])) if pc else None,
                   "min_pair": min(pc, key=lambda p: p["cos"]) if pc else None}
        print(gt, out[gt]["mean_pairwise"], out[gt]["min_pair"], flush=True)
        torch.save({k: v[0].cpu() for k, v in keep.items()}, f"{OUT}/synth_solutions_gt{gt}.pt")
    save("inits", out)


def _two_solutions(fwd, q):
    """Least similar pair among fit-matched solutions that were blind to the truth
    (within 2x of the best blind fit). Corrected 19 Oct 2026: the earlier version searched all eight starts,
    so it could pair an under-converged solution (gauss_5.0) or one started next to the truth."""
    p = f"{OUT}/synth_solutions_gt0.pt"
    if not os.path.exists(p):
        exp_inits(fwd, q)
    sols = {k: v.to(DEV) for k, v in torch.load(p).items()}
    x = make_truth(); y = fwd(x).detach()
    with torch.no_grad():
        fit = {k: ((fwd(v) - y) ** 2).mean().item() for k, v in sols.items() if not k.startswith("truth")}
    best = min(fit.values()); ks = [k for k, m in fit.items() if m <= 2 * best]; pair = (None, 2.0)
    for i in range(len(ks)):
        for j in range(i + 1, len(ks)):
            c = torch.nn.functional.cosine_similarity(sols[ks[i]], sols[ks[j]], dim=-1).mean().item()
            if c < pair[1]: pair = ((ks[i], ks[j]), c)
    (a, b), _ = pair
    return sols[a], sols[b], (a, b)


def exp_barrier(fwd, q):
    x = make_truth(); y = fwd(x).detach(); x1, x2, pair = _two_solutions(fwd, q); d = x2 - x1
    g = torch.Generator().manual_seed(7); rows = []
    with torch.no_grad():
        for s in [0.1, 0.25, 0.5, 1.0]:
            along = ((fwd(x1 + s * d) - y) ** 2).mean().item(); rnd = []
            for _ in range(5 if q else 50):
                r = torch.randn(d.shape, generator=g).to(DEV); r = r / r.norm() * d.norm()
                rnd.append(((fwd(x1 + s * r) - y) ** 2).mean().item())
            rows.append({"scale": s, "mse_along_d": along, "mse_random_median": float(np.median(rnd)),
                         "random_over_d": float(np.median(rnd) / along)}); print(rows[-1], flush=True)
        path = [((fwd(x1 + t * d) - y) ** 2).mean().item() for t in np.linspace(0, 1, 21)]
    save("barrier", {"pair": pair, "rows": rows, "path": path, "path_peak_over_worse_end": max(path[1:-1]) / max(path[0], path[-1])})


def exp_sensitivity(fwd, q):
    x = make_truth(); x1, x2, pair = _two_solutions(fwd, q); g = torch.Generator().manual_seed(11)
    eps = 1e-2 * x1.norm().item()
    def s(v):
        v = v / v.norm()
        with torch.no_grad():
            return ((fwd(x1 + eps * v) - fwd(x1)).norm() / eps).item()
    sd = s(x2 - x1); rnd = [s(torch.randn(x1.shape, generator=g).to(DEV)) for _ in range(20 if q else 200)]
    out = {"pair": pair, "sens_d": sd, "sens_truth": s(x), "random_median": float(np.median(rnd)),
           "random_min": float(min(rnd)), "random_max": float(max(rnd)),
           "ratio_median_over_d": float(np.median(rnd) / sd), "percentile_of_d": float((np.array(rnd) < sd).mean() * 100)}
    print(out, flush=True); save("sensitivity", out)


def exp_gain(fwd, q):
    x = make_truth(); y = fwd(x).detach(); floor = metrics(fwd, invert(fwd, y, 50 if q else 8000), x)["mse"]
    with torch.no_grad():
        rows = [{"alpha": a, "mse": ((fwd(a * x) - y) ** 2).mean().item()} for a in [0.5, 0.9, 1.0, 1.1, 2.0]]
    for r in rows: r["times_floor"] = r["mse"] / floor
    print(rows, flush=True); save("gain", {"residual_floor": floor, "rows": rows})


def exp_noise(fwd, q):
    x = make_truth(); y = fwd(x).detach(); g = torch.Generator().manual_seed(5); rows = []
    for f in [0.0, 0.05, 0.1, 0.25, 0.5, 1.0]:
        yn = y + f * y.std() * torch.randn(y.shape, generator=g).to(DEV)
        rows.append({"noise_frac": f, **metrics(fwd, invert(fwd, yn, 50 if q else 8000), x)}); print(rows[-1], flush=True)
    save("noise", rows)


def exp_extent(fwd, q):
    x = make_truth(); y = fwd(x).detach(); rows = []
    for n in [50, 100, 500, 2000, 8000, V]:
        rows.append({"vertices": n, **metrics(fwd, invert(fwd, y, 50 if q else 8000, mask=random_mask(n)), x)}); print(rows[-1], flush=True)
    save("extent", rows)


def exp_priors(fwd, q):
    x = make_truth(); y = fwd(x).detach(); m = random_mask(500); st = 50 if q else 8000; out = {"l2": [], "smooth": []}
    for lam in [0, 1e-5, 1e-4, 1e-3, 1e-2]:
        out["l2"].append({"lambda": lam, **metrics(fwd, invert(fwd, y, st, mask=m, l2=lam), x)})
    for lam in [0, 1e-4, 1e-3, 1e-2, 1e-1]:
        out["smooth"].append({"lambda": lam, **metrics(fwd, invert(fwd, y, st, mask=m, smooth=lam), x)})
    print(out, flush=True); save("priors", out)


def exp_ridge(fwd, q):
    from sklearn.linear_model import Ridge
    n = 40 if q else 300; X, Y = [], []
    with torch.no_grad():
        for s in range(n):
            x = make_truth(seed=1000 + s); X.append(x[0].mean(0).cpu().numpy()); Y.append(fwd(x)[0].mean(1).cpu().numpy())
    X, Y = np.array(X), np.array(Y); k = int(0.8 * n); rows = []
    for a in [1e-2, 1e-1, 1, 10, 100]:
        P = Ridge(alpha=a).fit(Y[:k], X[:k]).predict(Y[k:])
        c = np.mean(np.sum(P * X[k:], 1) / (np.linalg.norm(P, axis=1) * np.linalg.norm(X[k:], axis=1) + 1e-8))
        rows.append({"alpha": a, "test_cosine": float(c)})
    print(rows, flush=True); save("ridge", {"n_train": k, "n_test": n - k, "rows": rows,
                                            "note": "time-averaged target, an easier task than trajectory recovery"})


def exp_bandwidth(fwd, q):
    rows = []
    for c in ([0.5, 4] if q else [0.25, 0.5, 1, 2, 4, 8, 16]):
        x = make_truth(cycles=c); y = fwd(x).detach()
        rows.append({"cycles": c, **metrics(fwd, invert(fwd, y, 50 if q else 8000), x)}); print(rows[-1], flush=True)
    save("bandwidth", rows)


def exp_manifold(fwd, q):
    out = {}
    for kind in ["smooth", "white"]:
        cs = []
        for s in range(1 if q else 3):
            x = make_truth(seed=s, kind=kind); cs.append(metrics(fwd, invert(fwd, fwd(x).detach(), 50 if q else 16000), x)["cosine"])
        out[kind] = {"mean": float(np.mean(cs)), "sd": float(np.std(cs)), "per_seed": cs}
    print(out, flush=True); save("manifold", out)


EXPS = {k[4:]: v for k, v in globals().items() if k.startswith("exp_")}

if __name__ == "__main__":
    ap = argparse.ArgumentParser(); ap.add_argument("experiments", nargs="+", choices=list(EXPS) + ["all"])
    ap.add_argument("--quick", action="store_true", help="tiny budgets, for a smoke test")
    a = ap.parse_args()
    torch.manual_seed(0)
    net, _ = load(); net = net.to(DEV); fwd = make_fwd(net)
    for name in (list(EXPS) if "all" in a.experiments else a.experiments):
        t0 = time.time(); EXPS[name](fwd, a.quick); print(f"{name}: {time.time() - t0:.0f}s", flush=True)
