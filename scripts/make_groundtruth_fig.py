"""How the synthetic ground truth is built, and how it compares with real stimulus representations (results/real_x_groundtruth.json)."""
import os as _os; ROOT = _os.environ.get("PROJECT_ROOT", _os.path.dirname(_os.path.dirname(_os.path.abspath(__file__))))
import glob, json, os, numpy as np, matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from synthetic_characterisation import make_truth
INK2, MUTED, GRID = "#52514e", "#8a8984", "#e6e5e1"; S1, S2, S3 = "#2a78d6", "#eb6834", "#1baf7a"
plt.rcParams.update({"font.family": "DejaVu Sans", "font.size": 12, "axes.edgecolor": MUTED, "axes.labelcolor": INK2, "xtick.color": INK2, "ytick.color": INK2,
    "axes.spines.top": False, "axes.spines.right": False, "axes.titlesize": 13.5, "axes.titleweight": "bold", "axes.titlelocation": "left", "savefig.dpi": 200})
J = json.load(open(ROOT + "/results/real_x_groundtruth.json"))
X = np.concatenate([np.load(f)["x"] for f in sorted(glob.glob(ROOT + "/data/real_x/*.npz"))])
real = X[38, 32:64, 384:768]   # the window used as real ground truth (wheretheressmoke, 16-32 s)                                   # one 16-s window of a real story (audio slot)
syn = make_truth(seed=0)[0].cpu().numpy()
def proj(x, k=8):                                            # time course along the window's top principal directions
    xc = x - x.mean(0); u, s, vt = np.linalg.svd(xc, full_matrices=False); return (u[:, :k] * s[:k])
fig = plt.figure(figsize=(16, 4.6)); gs = fig.add_gridspec(1, 4, width_ratios=[1, 1, 0.08, 1.35])
for i, (x, t) in enumerate([(syn, "Synthetic ground truth (seed 0)"), (real, "Real representation (LeBel story, audio)")]):
    a = fig.add_subplot(gs[0, i]); p = proj(x); p = p / np.abs(p).max()
    a.imshow(p.T, aspect="auto", cmap="RdBu_r", vmin=-1, vmax=1); a.set_title(t, fontsize=12.5)
    a.set_xlabel("time step (0.5 s)"); a.set_ylabel("principal direction"); a.set_yticks(range(8)); a.set_yticklabels(range(1, 9)); a.grid(False)
a = fig.add_subplot(gs[0, 3])
R, Sd, W = J["real"], J["synthetic_default"], J["synthetic_white"]
labels = ["effective\ndimensions (PR)", "variance in\ntop 8 directions", "lag-1\nautocorrelation"]; keys = ["participation_ratio", "var_top8", "lag1"]
xx = np.arange(3); w = 0.26
def norm(k, v): return v / 30.2 if k == "participation_ratio" else v
for j, (lab, d, c) in enumerate([("synthetic (8-D)", Sd, S1), ("real, 246 windows", R, S3), ("white-noise control", W, MUTED)]):
    vals = [norm(k, d[k][0] if isinstance(d[k], list) else d[k]) for k in keys]
    err = [norm(k, d[k][1]) if isinstance(d[k], list) else 0 for k in keys]
    a.bar(xx + (j - 1) * w, vals, w, yerr=err, color=c, label=lab, capsize=3)
    for i, k in enumerate(keys):
        raw = d[k][0] if isinstance(d[k], list) else d[k]
        a.text(xx[i] + (j - 1) * w, max(vals[i], 0) + 0.04 + err[i], f"{raw:.1f}" if k == "participation_ratio" else f"{raw:.2f}", ha="center", fontsize=9)
a.set_xticks(xx); a.set_xticklabels(labels); a.axhline(0, color=MUTED, lw=0.8); a.set_ylim(-0.25, 1.25); a.set_yticks([])
a.set_title("Real stimuli are low-dimensional too"); a.legend(fontsize=9.5, loc="upper right", frameon=False)
fig.tight_layout(); fig.savefig(os.environ.get("FIGOUT", ROOT + "/figures") + "/fig_groundtruth.png"); print("saved")

# ---- inversion with a real ground truth
I = J["inversion"]; P = I["per_start"]; lab = {"gauss_0.01": "Gaussian 0.01", "gauss_1.0": "Gaussian 1.0", "uniform": "uniform", "truth_perturbed": "near truth\n(control)"}
fig, ax = plt.subplots(1, 2, figsize=(14, 4.4), gridspec_kw={"width_ratios": [1, 1.25]})
names = list(P); xx = np.arange(len(names))
ax[0].bar(xx, [P[n]["cosine_audio_slot"] for n in names], color=[S2 if n.startswith("truth") else S1 for n in names])
for i, n in enumerate(names):
    ax[0].text(i, P[n]["cosine_audio_slot"] + 0.02, f"{P[n]['cosine_audio_slot']:.2f}\nerr {P[n]['mse']*1e6:.1f}e-6", ha="center", fontsize=9.5)
ax[0].set_xticks(xx); ax[0].set_xticklabels([lab[n] for n in names]); ax[0].set_ylim(0, 1.15); ax[0].set_ylabel("recovery cosine (filled audio slot)")
ax[0].set_title("Real truth: partial, start-dependent recovery")
s_ = np.linspace(0, 1, 21)
for k, v in I["pairs"].items(): ax[1].semilogy(s_, v["errors"], color=S1, lw=2, alpha=0.7)
ax[1].semilogy(s_, I["blind_to_truth"]["errors"], color=S2, lw=2.8)
pk = [v["peak"] for v in I["pairs"].values()]
ax[1].plot([], [], color=S1, lw=2, label=f"between blind solutions: peak {min(pk):.0f}–{max(pk):.0f}×")
ax[1].plot([], [], color=S2, lw=2.8, label=f"blind → near-truth: peak {I['blind_to_truth']['peak']:.0f}×")
ax[1].legend(loc="lower center", fontsize=10.5, frameon=False); ax[1].set_xlabel("position on the straight line"); ax[1].set_ylabel("prediction error")
ax[1].set_title("Barriers between solutions, as with synthetic")
fig.tight_layout(); fig.savefig(os.environ.get("FIGOUT", ROOT + "/figures") + "/fig_realx_inversion.png"); print("saved 2")
