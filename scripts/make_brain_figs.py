"""Cortical maps on fsaverage5, computed from the frozen TRIBE v2 checkpoint (roi_sensitivity.py)."""
import os as _os; ROOT = _os.environ.get("PROJECT_ROOT", _os.path.dirname(_os.path.dirname(_os.path.abspath(__file__))))
import json, os
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.colors import ListedColormap
from nilearn import datasets, plotting

OUT = ROOT + "/figures"
R = ROOT + "/results"
fs = datasets.fetch_surf_fsaverage("fsaverage5")
N = 10242

sens = np.load(f"{R}/sensitivity_maps.npz")
tot = sens["text"] + sens["audio"] + sens["video"]
share = {k: sens[k] / tot for k in ("text", "audio", "video")}
meta = json.load(open(f"{R}/roi_sensitivity.json"))


def four_views(data, title, cmap, vmin, vmax, fname, cbar_label, symmetric=False):
    fig, axs = plt.subplots(1, 4, figsize=(15, 3.9), subplot_kw={"projection": "3d"})
    views = [("left", "lateral"), ("left", "medial"), ("right", "lateral"), ("right", "medial")]
    for ax, (hemi, view) in zip(axs, views):
        d = data[:N] if hemi == "left" else data[N:]
        plotting.plot_surf_stat_map(fs[f"infl_{hemi}"], d, hemi=hemi, view=view,
                                    bg_map=fs[f"sulc_{hemi}"], cmap=cmap, vmin=vmin, vmax=vmax,
                                    symmetric_cbar=symmetric, colorbar=False, axes=ax, figure=fig,
                                    threshold=None)
        ax.set_title(f"{hemi} {view}", fontsize=11, color="#52514e")
    sm = plt.cm.ScalarMappable(cmap=cmap, norm=plt.Normalize(vmin=vmin, vmax=vmax))
    cax = fig.add_axes([0.35, 0.13, 0.3, 0.035])
    cb = fig.colorbar(sm, cax=cax, orientation="horizontal")
    cb.set_label(cbar_label, fontsize=11, color="#52514e")
    fig.suptitle(title, fontsize=15, fontweight="bold", x=0.02, ha="left", color="#0b0b0b")
    fig.subplots_adjust(left=0.0, right=1.0, top=0.86, bottom=0.24, wspace=0.0)
    fig.savefig(f"{OUT}/{fname}.png", dpi=170, facecolor="white")
    plt.close(fig)


# total forward sensitivity (sequential)
four_views(tot, "How strongly each vertex responds to a change in the semantic representation",
           "Blues", float(np.percentile(tot, 2)), float(np.percentile(tot, 98)),
           "brain_sensitivity_total", "forward sensitivity (sum over text / audio / video slots)")

# audio-slot share relative to cortex mean (diverging)
for k, lab in [("audio", "audio"), ("video", "video"), ("text", "text")]:
    dev = share[k] - share[k].mean()
    lim = float(np.percentile(np.abs(dev), 98))
    four_views(dev, f"Where the {lab}-derived part of the representation dominates",
               "RdBu_r", -lim, lim, f"brain_share_{lab}",
               f"{lab} share of sensitivity, minus cortex mean", symmetric=True)

# ROI map (categorical)
rois = {k: np.array(v) for k, v in meta["roi_vertices"].items()}
lab = np.zeros(2 * N)
order = list(rois)
for i, k in enumerate(order, start=1):
    lab[rois[k]] = i
cols = ["#2a78d6", "#1baf7a", "#eb6834", "#e87ba4", "#eda100", "#4a3aa7"]
fig, axs = plt.subplots(1, 4, figsize=(15, 3.9), subplot_kw={"projection": "3d"})
for ax, (hemi, view) in zip(axs, [("left", "lateral"), ("left", "medial"), ("right", "lateral"), ("right", "medial")]):
    d = lab[:N] if hemi == "left" else lab[N:]
    plotting.plot_surf_roi(fs[f"infl_{hemi}"], d, hemi=hemi, view=view, bg_map=fs[f"sulc_{hemi}"],
                           cmap=ListedColormap(["#dcdbd6"] + cols), vmin=0, vmax=len(order), axes=ax, figure=fig,
                           colorbar=False)
    ax.set_title(f"{hemi} {view}", fontsize=11, color="#52514e")
handles = [plt.Line2D([0], [0], marker="s", ls="", color=c, ms=12, label=f"{k} ({len(rois[k]):,})")
           for k, c in zip(order, cols)]
fig.legend(handles=handles, loc="lower center", ncol=6, fontsize=11, frameon=False)
fig.suptitle("Six anatomical ROIs (Destrieux atlas, fsaverage5; vertex counts in brackets)",
             fontsize=15, fontweight="bold", x=0.02, ha="left")
fig.subplots_adjust(left=0.0, right=1.0, top=0.86, bottom=0.15, wspace=0.0)
fig.savefig(f"{OUT}/brain_rois.png", dpi=170, facecolor="white")
plt.close(fig)

# per-ROI share bar chart (T/A/V)
names = order + ["Whole cortex"]
fig, ax = plt.subplots(figsize=(10.5, 4.6))
w = 0.26
xs = np.arange(len(names))
for j, (k, c) in enumerate([("text", "#2a78d6"), ("audio", "#eb6834"), ("video", "#1baf7a")]):
    v = [meta["rois"][n][f"share_{k}"] for n in names]
    ax.bar(xs + (j - 1) * w, v, w - 0.03, color=c, label=k)
ax.set_xticks(xs); ax.set_xticklabels([n.replace(" (", "\n(") for n in names], fontsize=11)
ax.set_ylim(0.2, 0.45); ax.set_ylabel("Share of forward sensitivity")
ax.spines[["top", "right"]].set_visible(False); ax.grid(axis="y", color="#e6e5e1"); ax.set_axisbelow(True)
ax.legend(frameon=False, ncol=3, loc="upper left")
ax.set_title("Modality sensitivity per ROI", loc="left", fontweight="bold")
fig.tight_layout(); fig.savefig(f"{OUT}/fig_roi_modality_share.png", dpi=200, facecolor="white"); plt.close(fig)
print("ok")
