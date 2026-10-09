"""Animate the recorded inversion (results/demo_run.json) into an MP4 for the review.
Every frame is drawn from logged values of a real run through frozen TRIBE v2."""
import os as _os; ROOT = _os.environ.get("PROJECT_ROOT", _os.path.dirname(_os.path.dirname(_os.path.abspath(__file__))))
import json, os, subprocess
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

d = json.load(open(ROOT + "/results/demo_run.json"))
F = d["frames"]; tgt = np.array(d["target_v"])
steps = [f["step"] for f in F]; cos = [f["cos"] for f in F]; mse = [f["mse"] for f in F]
tmp = ROOT + "/demo/frames"; os.makedirs(tmp, exist_ok=True)
for p in os.listdir(tmp): os.remove(os.path.join(tmp, p))
INK2, S1, S2 = "#52514e", "#2a78d6", "#eb6834"
last_pred = None
vmin, vmax = np.percentile(tgt, 2), np.percentile(tgt, 98)
for k, f in enumerate(F):
    if f["pred_v"] is not None:
        last_pred = np.array(f["pred_v"])
    fig = plt.figure(figsize=(12.8, 7.2), facecolor="white")
    fig.suptitle("Inverting TRIBE v2: recovering a known semantic representation from predicted fMRI",
                 x=0.03, ha="left", fontsize=17, fontweight="bold")
    fig.text(0.03, 0.905, f"step {f['step']:,} / {steps[-1]:,}   ·   recovery cosine {f['cos']:.3f}   ·   prediction MSE {f['mse']:.2e}",
             fontsize=13, color=INK2)
    ax = fig.add_axes([0.06, 0.52, 0.42, 0.32])
    ax.plot(steps[:k + 1], cos[:k + 1], color=S1, lw=2.2); ax.set_xlim(0, steps[-1]); ax.set_ylim(0, 1)
    ax.set_title("Recovery cosine to ground truth", loc="left", fontsize=12); ax.grid(color="#e6e5e1")
    ax.spines[["top", "right"]].set_visible(False)
    ax = fig.add_axes([0.56, 0.52, 0.40, 0.32])
    ax.semilogy(steps[:k + 1], mse[:k + 1], color=S2, lw=2.2); ax.set_xlim(0, steps[-1])
    ax.set_ylim(min(mse) * 0.7, max(mse) * 1.3)
    ax.set_title("Prediction error (BOLD MSE)", loc="left", fontsize=12); ax.grid(color="#e6e5e1")
    ax.spines[["top", "right"]].set_visible(False)
    ax = fig.add_axes([0.06, 0.08, 0.42, 0.33])
    ax.bar(range(32), f["cos_t"], color=S1); ax.set_ylim(-0.2, 1); ax.set_xlabel("time step of the representation")
    ax.set_title("Per-time-step recovery", loc="left", fontsize=12); ax.spines[["top", "right"]].set_visible(False)
    for j, (img, lab) in enumerate([(tgt, "target BOLD (100 vertices × 25 t)"), (last_pred, "f(x̂): predicted from recovered x̂")]):
        ax = fig.add_axes([0.56 + j * 0.205, 0.08, 0.19, 0.33])
        if img is not None:
            ax.imshow(img, aspect="auto", cmap="RdBu_r", vmin=vmin, vmax=vmax)
        ax.set_xticks([]); ax.set_yticks([]); ax.set_title(lab, fontsize=10)
    fig.savefig(f"{tmp}/f_{k:03d}.png", dpi=100); plt.close(fig)
for extra in range(12):  # hold the last frame
    os.link(f"{tmp}/f_{len(F) - 1:03d}.png", f"{tmp}/f_{len(F) + extra:03d}.png")
out = ROOT + "/demo/demo_inversion.mp4"
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-framerate", "6", "-i", f"{tmp}/f_%03d.png",
                "-c:v", "libx264", "-pix_fmt", "yuv420p", "-vf", "scale=1280:720", out], check=True)
os.system(f"cp {tmp}/f_{len(F) + 11:03d}.png {ROOT}/demo/demo_poster.png")
print("video", out, os.path.getsize(out) // 1024, "KB")
