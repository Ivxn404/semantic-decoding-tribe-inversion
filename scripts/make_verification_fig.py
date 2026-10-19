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
DD = json.load(open(f"{V}/testD.json")) if os.path.exists(f"{V}/testD.json") else {}
INITS = list(A["per_init"]); M = np.array(A["pairwise_all"])
ALLP = [(v["errors"], M[INITS.index(k.split("|")[0]), INITS.index(k.split("|")[1])], v["peak_over_worse_end"]) for k, v in B["path"]["pairs"].items()]
for g in DD.values(): ALLP += [(x["errors"], x["cos"], x["peak"]) for x in g["pairs"].values()]
TRUTHP = [A["path_blind_to_truth"]] + [g["path_blind_to_truth"] for g in DD.values()]
NGT = 1 + len(DD)
s = np.array(B["path"]["s"]); fig, ax = plt.subplots(1, 2, figsize=(13, 4.6), gridspec_kw={"width_ratios": [1.25, 1]})
peaks = [p for _, c, p in ALLP if c < 0.99]
for e, c, p in ALLP:
    ax[0].semilogy(s, e, color=S1 if c < 0.99 else MUTED, alpha=0.3 if c < 0.99 else 0.5, lw=1.4)
ax[0].plot([], [], color=S1, lw=2, alpha=0.7, label=f"{len(peaks)} pairs of distinct blind fits: peak {np.median(peaks):.1f}× ({min(peaks):.1f}–{max(peaks):.1f}×)")
ax[0].plot([], [], color=MUTED, lw=2, label=f"{len(ALLP) - len(peaks)} near-identical pairs (agreement ≥ 0.99): same minimum")
tp = [t.get("peak_over_worse_end", t.get("peak")) for t in TRUTHP]
for i, t in enumerate(TRUTHP):
    ax[0].semilogy(s, t["errors"], color=S2, lw=2.6, label=f"blind → near-truth: peak {np.mean(tp):.1f} ± {np.std(tp, ddof=1):.1f}×" if i == 0 else None)
ax[0].legend(loc="lower center", fontsize=10, bbox_to_anchor=(0.5, -0.02))
ax[0].set_xlabel("position on the straight line between two solutions"); ax[0].set_ylabel("prediction error vs target")
ax[0].set_title(f"Straight paths rise between solutions ({NGT} ground truths)")
pt = A["path_blind_to_truth"]
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
ax[1].set_title("A worse minimum (ground truth 0)"); ax[1].set_ylim(0.58, 1.0)
fig.tight_layout(); out = os.environ.get("FIGOUT", ROOT + "/figures"); fig.savefig(f"{out}/fig_barrier_verified.png"); print("saved")

# single-panel version for the poster
fig, a = plt.subplots(figsize=(8.0, 4.2))
for e, c, p in ALLP:
    a.semilogy(s, e, color=S1 if c < 0.99 else MUTED, alpha=0.3 if c < 0.99 else 0.5, lw=1.5)
for t in TRUTHP: a.semilogy(s, t["errors"], color=S2, lw=2.8)
a.plot([], [], color=S1, lw=2.4, label=f"{len(peaks)} pairs of distinct blind fits: peak {np.median(peaks):.1f}×")
a.plot([], [], color=S2, lw=2.8, label=f"blind → near-truth minimum: {np.mean(tp):.1f}×")
a.legend(loc="lower center", fontsize=12); a.set_xlabel("position on the straight line between two solutions"); a.set_ylabel("prediction error")
a.set_title(f"Barriers between equally good solutions ({NGT} truths)"); fig.tight_layout(); fig.savefig(f"{out}/fig_barrier_path.png"); print("saved poster panel")
