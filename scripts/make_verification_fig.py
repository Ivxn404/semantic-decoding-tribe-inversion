"""Figure for the corrected barrier test (results/verification/*.json from notebooks/Verification_Tests.ipynb)."""
import os as _os; ROOT = _os.environ.get("PROJECT_ROOT", _os.path.dirname(_os.path.dirname(_os.path.abspath(__file__))))
import json, os, numpy as np, matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
INK, INK2, MUTED, GRID = "#0b0b0b", "#52514e", "#8a8984", "#e6e5e1"
S1, S2, S3 = "#2a78d6", "#eb6834", "#1baf7a"
plt.rcParams.update({"font.family": "DejaVu Sans", "font.size": 13, "axes.edgecolor": MUTED, "axes.labelcolor": INK2, "xtick.color": INK2, "ytick.color": INK2,
    "axes.spines.top": False, "axes.spines.right": False, "axes.grid": True, "grid.color": GRID, "grid.linewidth": 0.8, "axes.axisbelow": True,
    "axes.titlesize": 15, "axes.titleweight": "bold", "axes.titlecolor": INK, "axes.titlelocation": "left", "legend.frameon": False, "savefig.dpi": 200, "lines.linewidth": 2.2})
V = ROOT + "/results/verification"
A = json.load(open(f"{V}/testA.json"))["0"]; B = json.load(open(f"{V}/testB.json"))["0"]
s = np.array(B["path"]["s"]); fig, ax = plt.subplots(1, 2, figsize=(13, 4.6), gridspec_kw={"width_ratios": [1.25, 1]})
peaks = []
for i, (k, v) in enumerate(B["path"]["pairs"].items()):
    ax[0].semilogy(s, v["errors"], color=S1, alpha=0.35, lw=1.6, label=None); peaks.append(v["peak_over_worse_end"])
ax[0].plot([], [], color=S1, alpha=0.6, lw=2, label=f"10 pairs of equally good blind fits: peak {np.median(peaks):.1f}× (range {min(peaks):.1f}–{max(peaks):.1f}×)")
pt = A["path_blind_to_truth"]; ax[0].semilogy(s, pt["errors"], color=S2, lw=3, marker="o", ms=4, label=f"blind ({pt['from']}) → near-truth solution: peak {pt['peak_over_worse_end']:.1f}×")
ax[0].legend(loc="lower center", fontsize=10.5, bbox_to_anchor=(0.5, -0.02))
ax[0].set_xlabel("position on the straight line between two solutions"); ax[0].set_ylabel("prediction error vs target")
ax[0].set_title("Straight paths rise between solutions")
per = A["per_init"]; blind = [k for k in A["matched"]]
for k in per:
    c = S2 if k.startswith("truth") else (S1 if k in blind else MUTED)
    ax[1].scatter(per[k]["mse"] * 1e7, per[k]["cosine"], s=90, color=c, zorder=3)
lab = {"truth_perturbed": "truth + 0.5 noise", "truth+noise": "truth + 1.0 noise", "gauss_5.0": "Gaussian s.d. 5 (not converged)"}
for k, t in lab.items():
    ax[1].annotate(t, (per[k]["mse"] * 1e7, per[k]["cosine"]), xytext=(8, -4) if k != "gauss_5.0" else (-8, 8), textcoords="offset points", fontsize=10.5, color=INK2, ha="left" if k != "gauss_5.0" else "right")
bx = np.mean([per[k]["mse"] for k in blind]) * 1e7; by = np.mean([per[k]["cosine"] for k in blind])
ax[1].annotate("5 blind starts\n(Gaussian 0.01, 0.1, 1.0,\nuniform, zeros)", (bx, by), xytext=(-12, -58), textcoords="offset points", fontsize=10.5, color=S1, ha="center",
               arrowprops=dict(arrowstyle="-", color=S1, lw=1))
ax[1].set_xscale("log"); ax[1].set_xlabel("final prediction error (×10⁻⁷, log)"); ax[1].set_ylabel("recovery cosine")
ax[1].set_title("Blind starts settle in a worse minimum"); ax[1].set_ylim(0.58, 1.0)
fig.tight_layout(); out = os.environ.get("FIGOUT", ROOT + "/figures"); fig.savefig(f"{out}/fig_barrier_verified.png"); print("saved")

# single-panel version for the poster
fig, a = plt.subplots(figsize=(8.0, 4.2))
for k, v in B["path"]["pairs"].items():
    a.semilogy(s, v["errors"], color=S1, alpha=0.4, lw=1.8)
a.plot([], [], color=S1, lw=2.4, label=f"10 pairs of equal blind fits: peak {np.median(peaks):.1f}× the ends")
a.semilogy(s, pt["errors"], color=S2, lw=3.2, marker="o", ms=4, label=f"blind → near-truth minimum: {pt['peak_over_worse_end']:.1f}×")
a.legend(loc="lower center", fontsize=12); a.set_xlabel("position on the straight line between two solutions"); a.set_ylabel("prediction error")
a.set_title("Barriers between equally good solutions"); fig.tight_layout(); fig.savefig(f"{out}/fig_barrier_path.png"); print("saved poster panel")
