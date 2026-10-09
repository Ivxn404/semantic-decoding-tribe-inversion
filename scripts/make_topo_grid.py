import os as _os; ROOT = _os.environ.get("PROJECT_ROOT", _os.path.dirname(_os.path.dirname(_os.path.abspath(__file__))))
import json, numpy as np, matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from nilearn import datasets, plotting
fs = datasets.fetch_surf_fsaverage("fsaverage5"); N = 10242
s = np.load(ROOT + "/results/sensitivity_maps.npz"); tot = s["text"] + s["audio"] + s["video"]
views = [("left", "lateral"), ("left", "medial"), ("right", "lateral")]
mods = [("text", "Text-derived"), ("audio", "Audio-derived"), ("video", "Video-derived")]
devs = {k: s[k] / tot - (s[k] / tot).mean() for k, _ in mods}
lim = float(max(np.percentile(np.abs(d), 98) for d in devs.values()))
fig, axs = plt.subplots(3, 3, figsize=(11.5, 7.6), subplot_kw={"projection": "3d"})
for r, (k, lab) in enumerate(mods):
    for c, (hemi, view) in enumerate(views):
        d = devs[k][:N] if hemi == "left" else devs[k][N:]
        plotting.plot_surf_stat_map(fs[f"infl_{hemi}"], d, hemi=hemi, view=view, bg_map=fs[f"sulc_{hemi}"],
                                    cmap="RdBu_r", vmin=-lim, vmax=lim, symmetric_cbar=True, colorbar=False,
                                    axes=axs[r, c], figure=fig)
        if r == 0: axs[r, c].set_title(f"{hemi} {view}", fontsize=12, color="#52514e")
    fig.text(0.005, 0.80 - r * 0.285, lab, fontsize=14, fontweight="bold", color="#0b0b0b", rotation=90, va="center")
sm = plt.cm.ScalarMappable(cmap="RdBu_r", norm=plt.Normalize(vmin=-lim, vmax=lim))
cax = fig.add_axes([0.3, 0.08, 0.4, 0.022])
cb = fig.colorbar(sm, cax=cax, orientation="horizontal"); cb.set_label("share of forward sensitivity, minus cortex mean (red = this modality dominates)", fontsize=11, color="#52514e")
fig.subplots_adjust(left=0.03, right=1.0, top=0.95, bottom=0.14, wspace=0.0, hspace=0.0)
for out in [ROOT + "/figures", ROOT + "/figures"]:
    fig.savefig(f"{out}/brain_topography_grid.png", dpi=170, facecolor="white")
print("ok", lim)
