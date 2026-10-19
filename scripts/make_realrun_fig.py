"""Figure of the recorded multi-start TRIBE v2 inversion (results/demo_brain_run.json, scripts/demo_brain_run.py)."""
import os as _os; ROOT = _os.environ.get("PROJECT_ROOT", _os.path.dirname(_os.path.dirname(_os.path.abspath(__file__))))
import json, os, numpy as np, matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
INK2, MUTED, GRID = "#52514e", "#8a8984", "#e6e5e1"; C = ["#2a78d6", "#eb6834", "#1baf7a"]
plt.rcParams.update({"font.family": "DejaVu Sans", "font.size": 13, "axes.edgecolor": MUTED, "axes.labelcolor": INK2, "xtick.color": INK2, "ytick.color": INK2,
    "axes.spines.top": False, "axes.spines.right": False, "axes.grid": True, "grid.color": GRID, "axes.titlesize": 15, "axes.titleweight": "bold",
    "axes.titlelocation": "left", "legend.frameon": False, "savefig.dpi": 200, "lines.linewidth": 2.2})
J = json.load(open(ROOT + "/results/demo_brain_run.json")); L = J["log"]; st = [l["step"] for l in L]
z = np.load(ROOT + "/results/demo_brain_maps.npz"); r2 = [float(np.median(r.astype(float))) for r in z["r"]]
fig, ax = plt.subplots(1, 3, figsize=(16, 4.4))
for k, n in enumerate(J["inits"]):
    ax[0].semilogy(st, [l["mse"][k] for l in L], color=C[k], label=n); ax[1].plot(st, [l["cos"][k] for l in L], color=C[k], label=n)
ax[1].plot(st, [min(l["pair"]) for l in L], color=MUTED, ls="--", label="lowest agreement between starts")
ax[2].plot(z["steps"], r2, color=C[0], marker="o")
ax[0].set_title("Prediction error"); ax[1].set_title("Recovery of x and agreement"); ax[2].set_title("Median per-vertex R² of the fit")
ax[1].set_ylim(0, 1); ax[2].set_ylim(0.6, 1.0); ax[0].legend(fontsize=10); ax[1].legend(fontsize=10, loc="upper left")
for a in ax: a.set_xlabel("Adam step")
fig.tight_layout(); fig.savefig(os.environ.get("FIGOUT", ROOT + "/figures") + "/fig_realrun_multistart.png"); print("saved")
