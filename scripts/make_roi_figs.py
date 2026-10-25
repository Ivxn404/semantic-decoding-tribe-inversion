"""Figures for the regional inversion, from results/roi_inversion.json (computed locally on the
frozen TRIBE v2 checkpoint). Run after roi_inversion.py finishes."""
import os as _os; ROOT = _os.environ.get("PROJECT_ROOT", _os.path.dirname(_os.path.dirname(_os.path.abspath(__file__))))
import json, os
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

R = ROOT + "/results"
OUT = os.environ.get("FIGOUT", ROOT + "/figures")
INK, INK2, MUTED, GRID = "#0b0b0b", "#52514e", "#8a8984", "#e6e5e1"
S1, S2, S3 = "#2a78d6", "#eb6834", "#1baf7a"
plt.rcParams.update({"font.size": 13, "axes.spines.top": False, "axes.spines.right": False,
                     "axes.grid": True, "grid.color": GRID, "axes.axisbelow": True, "axes.edgecolor": MUTED,
                     "axes.labelcolor": INK2, "xtick.color": INK2, "ytick.color": INK2, "legend.frameon": False})

d = json.load(open(f"{R}/roi_inversion.json"))
rows = {r["name"]: r for r in d["rows"]}
sens = json.load(open(f"{R}/roi_sensitivity.json"))["rois"]
order = ["Language (L)", "Language homologue (R)", "Auditory", "Default mode", "Visual", "Somatomotor"]

# ---- paired bars: ROI vs size-matched random
fig, ax = plt.subplots(figsize=(11.5, 4.9))
xs = np.arange(len(order)); w = 0.36
roi = [rows[n]["cosine"] for n in order]
rnd = [rows[f"Random |{n}|"]["cosine"] for n in order]
ax.bar(xs - w / 2, roi, w - 0.03, color=S1, label="anatomical ROI")
ax.bar(xs + w / 2, rnd, w - 0.03, color=MUTED, label="random vertices, same count")
for n, rep in [("Language (L)", "Random |Language (L)| rep"), ("Auditory", "Random |Auditory| rep")]:
    i = order.index(n)
    ax.plot(i + w / 2, rows[rep]["cosine"], "D", color=INK, ms=7, label="random replicate (2nd seed)" if n == "Language (L)" else None)
for i, (a, b) in enumerate(zip(roi, rnd)):
    ax.text(i - w / 2, a + 0.015, f"{a:.2f}", ha="center", fontsize=11, color=INK)
    ax.text(i + w / 2 + 0.02, b + 0.035, f"{b:.2f}", ha="center", fontsize=11, color=INK2)
anchor = rows["Whole cortex"]["cosine"]
ax.axhline(anchor, color=S2, ls="--", lw=1.4)
ax.text(-0.45, anchor + 0.015, f"whole cortex, same budget: {anchor:.3f}", color=S2, ha="left", fontsize=11)
ax.set_xticks(xs)
ax.set_xticklabels([f"{n}\n({rows[n]['n_vertices']:,} v)" for n in order], fontsize=11)
ax.set_ylabel("Recovery cosine"); ax.set_ylim(0, 1.12)
ax.legend(loc="upper center", ncol=3, fontsize=11, bbox_to_anchor=(0.5, 1.13))
fig.tight_layout(); fig.savefig(f"{OUT}/fig_roi_recovery.png", dpi=200, facecolor="white"); plt.close(fig)

# ---- per-slot recovery (text/audio/video) for ROIs
fig, ax = plt.subplots(figsize=(11.5, 4.6))
for j, (k, c) in enumerate([("text", S1), ("audio", S2), ("video", S3)]):
    v = [rows[n][f"cosine_{k}"] - rows[f"Random |{n}|"][f"cosine_{k}"] for n in order]
    ax.bar(xs + (j - 1) * 0.26, v, 0.23, color=c, label=f"{k}-derived dimensions")
ax.axhline(0, color=INK2, lw=1)
ax.set_xticks(xs); ax.set_xticklabels([n.replace(" (", "\n(") for n in order], fontsize=11)
ax.set_ylabel("ROI − matched random (cosine)")
ax.set_ylim(-0.16, 0.16); ax.legend(loc="upper left", ncol=3, fontsize=11)
fig.tight_layout(); fig.savefig(f"{OUT}/fig_roi_slots.png", dpi=200, facecolor="white"); plt.close(fig)

# ---- predictable vs recoverable
fig, ax = plt.subplots(figsize=(7.6, 5.2))
cols = ["#2a78d6", "#1baf7a", "#eb6834", "#e87ba4", "#eda100", "#4a3aa7"]
for n, c in zip(order, cols):
    sx = sens[n]["sens_text"] + sens[n]["sens_audio"] + sens[n]["sens_video"]
    sx /= (sens["Whole cortex"]["sens_text"] + sens["Whole cortex"]["sens_audio"] + sens["Whole cortex"]["sens_video"])
    dy = rows[n]["cosine"] - rows[f"Random |{n}|"]["cosine"]
    ax.plot(sx, dy, "o", color=c, ms=12)
    off = {"Auditory": (10, 6), "Language homologue (R)": (-40, -22), "Default mode": (8, 6), "Language (L)": (-20, 10),
           "Visual": (-55, 8), "Somatomotor": (10, -4)}[n]
    ax.annotate(n, (sx, dy), textcoords="offset points", xytext=off, fontsize=11, color=INK2)
ax.axhline(0, color=INK2, lw=1); ax.axvline(1, color=INK2, lw=1, ls=":")
ax.set_xlabel("Forward sensitivity of ROI (× cortex mean)")
ax.set_ylabel("Recoverability advantage over matched random")
fig.tight_layout(); fig.savefig(f"{OUT}/fig_roi_pred_vs_rec.png", dpi=200, facecolor="white"); plt.close(fig)
print("roi figures written")

# ---- response dimensionality: ROI vs matched random
dim = json.load(open(f"{R}/roi_dimensionality.json"))["rows"]
fig, axs = plt.subplots(1, 2, figsize=(12.0, 4.6))
ax = axs[0]
ax.bar(xs - w / 2, [dim[n]["participation_ratio"] for n in order], w - 0.03, color=S1, label="anatomical ROI")
ax.bar(xs + w / 2, [dim[f"Random |{n}|"]["participation_ratio"] for n in order], w - 0.03, color=MUTED, label="matched random")
ax.set_xticks(xs); ax.set_xticklabels([n.split(" (")[0].replace("Language homologue", "Lang. hom.").replace("Language", "Language")
                                      + (" (L)" if n == "Language (L)" else " (R)" if "homologue" in n else "") for n in order], fontsize=10, rotation=20)
ax.set_ylabel("Participation ratio (effective dims)"); ax.legend(fontsize=10, loc="upper left")
ax.set_title("Response diversity", loc="left", fontweight="bold", fontsize=14)
ax = axs[1]
cols = ["#2a78d6", "#1baf7a", "#eb6834", "#e87ba4", "#eda100", "#4a3aa7"]
for n, c in zip(order, cols):
    dp = dim[n]["participation_ratio"] - dim[f"Random |{n}|"]["participation_ratio"]
    dc = rows[n]["cosine"] - rows[f"Random |{n}|"]["cosine"]
    ax.plot(dp, dc, "o", color=c, ms=12)
    off = {"Auditory": (8, -14), "Language (L)": (8, 6), "Language homologue (R)": (-60, 9), "Default mode": (-30, -16),
           "Visual": (9, -4), "Somatomotor": (-80, -4)}[n]
    ax.annotate(n, (dp, dc), textcoords="offset points", xytext=off, fontsize=10, color=INK2)
ax.axhline(0, color=INK2, lw=1); ax.axvline(0, color=INK2, lw=1, ls=":")
ax.set_xlabel("Δ participation ratio (ROI − matched)"); ax.set_ylabel("Δ recovery cosine (ROI − matched)")
ax.set_title("Diversity vs recoverability", loc="left", fontweight="bold", fontsize=14)
fig.tight_layout(); fig.savefig(f"{OUT}/fig_roi_dim.png", dpi=200, facecolor="white"); plt.close(fig)
print("dim figure written")
