"""All figures are plotted from numbers logged in the Colab runs (results.json / console logs)
or computed locally from the frozen TRIBE v2 checkpoint. Nothing is simulated or invented."""
import os as _os; ROOT = _os.environ.get("PROJECT_ROOT", _os.path.dirname(_os.path.dirname(_os.path.abspath(__file__))))
import json, os
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

OUT = os.environ.get("FIGOUT", ROOT + "/figures")
os.makedirs(OUT, exist_ok=True)

INK, INK2, MUTED, GRID = "#0b0b0b", "#52514e", "#8a8984", "#e6e5e1"
S1, S2, S3 = "#2a78d6", "#eb6834", "#1baf7a"   # validated categorical slots 1-3

plt.rcParams.update({
    "font.family": "DejaVu Sans", "font.size": 13, "axes.edgecolor": MUTED,
    "axes.labelcolor": INK2, "xtick.color": INK2, "ytick.color": INK2,
    "axes.spines.top": False, "axes.spines.right": False, "axes.grid": True,
    "grid.color": GRID, "grid.linewidth": 0.8, "axes.axisbelow": True,
    "axes.titlesize": 15, "axes.titleweight": "bold", "axes.titlecolor": INK,
    "axes.titlelocation": "left", "legend.frameon": False, "savefig.dpi": 200,
    "lines.linewidth": 2.2, "lines.markersize": 7,
})


def save(fig, name):
    if os.environ.get("FIGOUT") and len(fig.axes) == 1:
        fig.axes[0].set_title("")
    fig.tight_layout()
    fig.savefig(f"{OUT}/{name}.png", facecolor="white")
    plt.close(fig)


# ---------------------------------------------------------------- 1 dissociation
steps = [250, 500, 1000, 2000, 4000, 8000, 16000, 32000]
enc = [7.5456e-02, 6.0430e-02, 5.0975e-02, 4.0726e-02, 2.7329e-02, 1.3798e-02, 5.6489e-03, 2.6577e-03]
rec = [0.0505, 0.1081, 0.2374, 0.4529, 0.6708, 0.8362, 0.9282, 0.9436]

fig, ax = plt.subplots(figsize=(8.6, 5.2))
ax.plot(enc, rec, "-o", color=S1)
ax.set_xscale("log"); ax.invert_xaxis()
from matplotlib.ticker import NullFormatter, FixedLocator
ax.xaxis.set_minor_formatter(NullFormatter())
ax.xaxis.set_major_locator(FixedLocator([5e-2, 2e-2, 1e-2, 5e-3, 2.5e-3]))
ax.set_xticklabels(["0.05", "0.02", "0.01", "0.005", "0.0025"])
ax.set_xlim(9e-2, 2.2e-3)
ax.set_xlabel("Encoding relative error  (lower = better forward fit)  →")
ax.set_ylabel("Recovery cosine to ground truth")
ax.set_ylim(0, 1.02)
for s, e, r in zip(steps, enc, rec):
    if s in (250, 2000, 8000, 32000):
        ax.annotate(f"{s:,} steps", (e, r), textcoords="offset points", xytext=(10, -4) if s != 32000 else (-30, -24),
                    fontsize=11, color=INK2)
ax.annotate("last 2.1× drop in encoding error\nbuys +0.015 recovery",
            xy=(3.4e-3, 0.94), xytext=(1.6e-2, 0.30), fontsize=11, color=INK,
            arrowprops=dict(arrowstyle="->", color=MUTED))
ax.set_title("Encoding accuracy saturates as a predictor of decoding")
save(fig, "fig_dissociation")

# ---------------------------------------------------------------- 2 first run vs converged
fig, ax = plt.subplots(figsize=(6.4, 4.6))
ax.bar(["500 steps\n(first run)", "8 000", "16 000", "32 000"], [0.2383, 0.8362, 0.9282, 0.9436],
       color=[MUTED, S1, S1, S1], width=0.62)
for i, v in enumerate([0.2383, 0.8362, 0.9282, 0.9436]):
    ax.text(i, v + 0.02, f"{v:.3f}", ha="center", color=INK, fontsize=12)
ax.set_ylim(0, 1.05); ax.set_ylabel("Recovery cosine")
ax.set_title("The first result was an optimisation artefact")
save(fig, "fig_first_vs_converged")

# ---------------------------------------------------------------- 3 noise
noise = [0.0, 0.01, 0.05, 0.1, 0.25, 0.5, 1.0]
ncos = [0.8362, 0.8359, 0.8293, 0.8096, 0.7036, 0.5163, 0.2975]
nret = [0.986, 0.988, 0.991, 0.988, 0.990, 0.987, 0.988]
nrel = [0.5516, 0.5519, 0.5592, 0.5823, 0.7260, 1.1109, 2.0620]
fig, axs = plt.subplots(1, 2, figsize=(11.5, 4.6))
ax = axs[0]
ax.plot(noise, ncos, "-o", color=S1, label="recovery cosine")
ax.plot(noise, nret, "-s", color=S2, label="retrieval (moment-level)")
ax.set_ylim(0, 1.05); ax.set_xlabel("Added noise (fraction of BOLD std)"); ax.set_ylabel("Score")
ax.legend(loc="lower left"); ax.set_title("Graceful, monotone degradation")
ax = axs[1]
ax.plot(noise, nrel, "-o", color=S3)
ax.set_xlabel("Added noise (fraction of BOLD std)"); ax.set_ylabel("Relative error ‖x̂−x‖/‖x‖")
ax.set_title("Magnitude degrades 3.7× faster")
save(fig, "fig_noise")

# ---------------------------------------------------------------- 4 extent
nv = [50, 100, 500, 2000, 8000, 20484]
ecos = [0.1000, 0.1827, 0.5267, 0.7765, 0.8252, 0.8362]
fig, ax = plt.subplots(figsize=(8.6, 4.8))
ax.plot(nv, ecos, "-o", color=S1)
ax.set_xscale("log"); ax.set_ylim(0, 1.0)
ax.set_xlabel("Cortical vertices observed (random subset, log scale)")
ax.set_ylabel("Recovery cosine")
ax.axvline(2000, color=MUTED, ls="--", lw=1.2)
ax.text(2150, 0.12, "≈10% of cortex\nrecovers 93% of the\nfull-cortex score", color=INK2, fontsize=11)
for x, y in zip(nv, ecos):
    ax.text(x, y + 0.035, f"{y:.2f}", ha="center", fontsize=11, color=INK)
ax.set_title("Recovery saturates at ~2 000 of 20 484 vertices")
save(fig, "fig_extent")

# ---------------------------------------------------------------- 5 priors
l2 = [0, 1e-5, 1e-4, 1e-3, 1e-2]; l2c = [0.5267, 0.5583, 0.4819, 0.2467, 0.0874]
sm = [0, 1e-4, 1e-3, 1e-2, 1e-1]; smc = [0.5267, 0.2844, 0.0765, 0.0102, 0.0008]
fig, ax = plt.subplots(figsize=(8.6, 4.8))
xl = ["none", "1e-5", "1e-4", "1e-3", "1e-2", "1e-1"]
ax.plot([0, 1, 2, 3, 4], l2c, "-o", color=S1, label="ℓ2 penalty")
ax.plot([0, 2, 3, 4, 5], smc, "-s", color=S2, label="temporal smoothness")
ax.set_xticks(range(6)); ax.set_xticklabels(xl)
ax.set_xlabel("Regularisation weight λ  (500-vertex underdetermined regime)")
ax.set_ylabel("Recovery cosine"); ax.set_ylim(0, 0.65); ax.legend(loc="upper right")
ax.annotate("only gain: +0.032", (1, 0.5583), textcoords="offset points", xytext=(10, 8), color=INK2, fontsize=11)
ax.set_title("Generic priors hurt; smoothness is catastrophic")
save(fig, "fig_priors")

# ---------------------------------------------------------------- 6 bandwidth (null)
cyc = [0.25, 0.5, 1, 2, 4, 8, 16]; bc = [0.8580, 0.8490, 0.8551, 0.8362, 0.8424, 0.8402, 0.8380]
fig, ax = plt.subplots(figsize=(8.0, 4.4))
ax.plot(cyc, bc, "-o", color=S1); ax.set_xscale("log", base=2)
ax.set_ylim(0, 1.0); ax.set_xlabel("Rate of semantic change (cycles per trajectory)")
ax.set_ylabel("Recovery cosine")
ax.set_title("Null result: no bandwidth dependence across 64×")
ax.text(0.27, 0.25, "Cause: temporal_smoothing = None in the release —\nno haemodynamic filter exists in the differentiable path",
        color=INK2, fontsize=11)
save(fig, "fig_bandwidth")

# ---------------------------------------------------------------- 7 non-convexity replication
truths = ["truth 0", "truth 1", "truth 2", "truth 3"]
mins = [0.8068, 0.8151, 0.8257, 0.8186]; means = [0.8928, 0.8934, 0.9007, 0.8996]
to_truth = {"gauss 0.01": [0.9181, 0.9138, 0.9230, 0.9233],
            "gauss 1.0": [0.8917, 0.8937, 0.8957, 0.9007],
            "uniform": [0.9068, 0.9068, 0.9189, 0.9163],
            "truth+noise": [0.8812, 0.8803, 0.8872, 0.8804]}
fits = {"gauss 0.01": [3.581e-07, 3.793e-07, 3.282e-07, 3.146e-07],
        "gauss 1.0": [3.763e-07, 3.715e-07, 3.748e-07, 3.459e-07],
        "uniform": [3.514e-07, 3.645e-07, 3.105e-07, 3.125e-07],
        "truth+noise": [3.801e-07, 4.047e-07, 3.680e-07, 3.617e-07]}
fig, axs = plt.subplots(1, 2, figsize=(12.0, 4.8))
ax = axs[0]
xs = np.arange(4)
ax.plot(xs, means, "o", color=S1, ms=10, label="mean pairwise")
ax.plot(xs, mins, "s", color=S2, ms=10, label="min pairwise")
ax.axhline(np.mean(mins), color=S2, lw=1, ls="--"); ax.axhline(np.mean(means), color=S1, lw=1, ls="--")
ax.set_xticks(xs); ax.set_xticklabels(truths); ax.set_ylim(0.75, 1.0)
ax.set_ylabel("Cosine between fit-matched solutions")
ax.text(1.5, 0.775, "min 0.8165 ± 0.0068   mean 0.8966 ± 0.0036", ha="center", color=INK2, fontsize=11)
ax.legend(loc="upper left"); ax.set_title("Solutions disagree — reproducibly")
ax = axs[1]
cols = [S1, S2, S3, MUTED]
for (k, v), c in zip(fits.items(), cols):
    ax.plot(np.array(v) * 1e7, to_truth[k], "o", color=c, ms=9, label=k)
ax.set_xlabel("Prediction MSE (×10⁻⁷)"); ax.set_ylabel("Cosine to ground truth")
ax.set_xlim(2.9, 4.2); ax.set_ylim(0.86, 0.94)
ax.legend(loc="lower left", fontsize=10, ncol=2); ax.set_title("Same fit, different answers")
save(fig, "fig_nonconvex")

# ---------------------------------------------------------------- 8 null-space perturbation test
scale = ["0.10", "0.25", "0.50", "1.00"]; ratio = [2.6, 2.0, 1.4, 0.6]
fig, ax = plt.subplots(figsize=(7.6, 4.6))
ax.bar(scale, ratio, color=[S1, S1, S1, S2], width=0.6)
ax.axhline(1.0, color=INK2, lw=1.2, ls="--")
for i, v in enumerate(ratio):
    ax.text(i, v + 0.06, f"{v:.1f}×", ha="center", fontsize=12, color=INK)
ax.set_xlabel("Step along d, as a fraction of the gap between two solutions")
ax.set_ylabel("Random-direction MSE ÷ MSE along d")
ax.text(3.35, 1.06, "no privilege", fontsize=10, color=INK2, ha="right")
ax.set_ylim(0, 3.0); ax.set_title("Null-space hypothesis rejected")
save(fig, "fig_nullspace_test")

# ---------------------------------------------------------------- 9 directional sensitivity
pair = {"gauss1.0 | uniform": 7.4251e-02, "gauss0.01 | gauss1.0": 7.7132e-02,
        "uniform | truth+noise": 9.4676e-02, "gauss0.01 | truth+noise": 9.9928e-02,
        "gauss0.01 | uniform": 1.1331e-01, "gauss1.0 | truth+noise": 1.2727e-01}
fig, ax = plt.subplots(figsize=(9.2, 4.6))
ax.axvspan(1.3478e-01, 2.5045e-01, color=GRID, label="200 random directions (min–max)")
ax.axvline(1.7681e-01, color=INK2, lw=1.4, ls="--", label="random median")
ax.axvline(1.9697e-01, color=S3, lw=2, label="along ground truth")
for i, (k, v) in enumerate(pair.items()):
    ax.plot(v, i, "o", color=S2, ms=10)
    ax.text(v - 0.003, i, k, ha="right", va="center", fontsize=10, color=INK2)
ax.set_yticks([]); ax.set_xlim(0.0, 0.27); ax.set_ylim(-0.8, 6.2)
ax.set_xlabel("Directional sensitivity ‖f(x+εv) − f(x)‖ / ε")
ax.legend(loc="upper right", fontsize=10)
ax.set_title("Every solution-difference direction is below all random directions")
save(fig, "fig_sensitivity")

# ---------------------------------------------------------------- 10 gain identifiability
alpha = [0.25, 0.5, 0.75, 0.9, 1.1, 1.25, 1.5, 2.0, 4.0]
relf = [829.63, 361.18, 67.92, 9.24, 7.47, 39.78, 140.50, 587.98, 4278.09]
fig, ax = plt.subplots(figsize=(8.4, 4.6))
ax.plot(alpha, relf, "-o", color=S1); ax.set_yscale("log"); ax.set_xscale("log", base=2)
ax.axhline(1.0, color=S2, lw=1.4, ls="--"); ax.text(0.26, 1.25, "optimiser noise floor", color=S2, fontsize=11)
ax.plot([1.0], [1.0], "D", color=S2, ms=9)
ax.set_xlabel("Rescaling factor α applied to ground truth")
ax.set_ylabel("Output change ÷ noise floor")
ax.set_title("Gain is identifiable: even ±10% is 7–9× above the floor")
save(fig, "fig_gain")

# ---------------------------------------------------------------- 11 linear baseline
fig, ax = plt.subplots(figsize=(6.6, 4.6))
ax.bar(["Ridge decoder\n(best λ = 1e-2)", "Gradient inversion\n(this work)"], [0.0599, 0.9181],
       color=[MUTED, S1], width=0.55)
ax.text(0, 0.0599 + 0.03, "0.060", ha="center", fontsize=13); ax.text(1, 0.9181 + 0.03, "0.918", ha="center", fontsize=13)
ax.set_ylim(0, 1.05); ax.set_ylabel("Test cosine")
ax.set_title("Nonlinear inversion vs linear baseline")
save(fig, "fig_baseline")

print("figures:", sorted(os.listdir(OUT)))
