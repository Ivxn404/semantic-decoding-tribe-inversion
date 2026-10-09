"""Figure for the real-data validation (LeBel 2023, UTS03): lag, encoding per network, identification."""
import os as _os; ROOT = _os.environ.get("PROJECT_ROOT", _os.path.dirname(_os.path.dirname(_os.path.abspath(__file__))))
import json, sys, numpy as np, matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

tag = sys.argv[1] if len(sys.argv) > 1 else "audio"
r = json.load(open(f"{ROOT}/results/realdata_{tag}.json"))
INK2, S1, S2, GRID = "#52514e", "#2a78d6", "#eb6834", "#e6e5e1"
plt.rcParams.update({"font.family": "DejaVu Sans", "font.size": 12})
fig, ax = plt.subplots(1, 3, figsize=(17, 4.8), gridspec_kw={"width_ratios": [1, 1.15, 1.25]})

L = r["lag"]
ax[0].plot(np.array(L["lags_TR"]) * 2, L["mean_r_train"], color=S1, lw=2.2)
ax[0].axvline(L["best_s"], color=S2, ls="--", lw=1.5)
ax[0].set_xlabel("offset between model time and BOLD row (s)"); ax[0].set_ylabel("mean r, 5 training stories")
ax[0].set_title(f"A  Alignment: peak at {L['best_s']:.0f} s", loc="left", fontweight="bold")

nets = ["Auditory", "Language (L)", "Language homologue (R)", "Default mode", "Somatomotor", "Visual"]
E = r["encoding_r"]; tst = r["held_out"]
v = [E[tst][n] for n in nets]
ax[1].barh(range(len(nets))[::-1], v, color=[S1 if x > 0 else "#b9b8b3" for x in v])
ax[1].set_yticks(range(len(nets))[::-1]); ax[1].set_yticklabels(nets)
ax[1].axvline(0, color=INK2, lw=0.8)
ax[1].set_xlabel("mean Pearson r, held-out story")
ax[1].set_title("B  Encoding accuracy by network", loc="left", fontweight="bold")

I = r["identification_forward"]; k = [x for x in I if x.startswith("top")][0]
labs, vals = ["20 s\ntop 2k", "20 s\nAud.", "20 s\nLang.", "20 s\nVis."], [I[k]["top1"], I["Auditory"]["top1"], I["Language (L)"]["top1"], I["Visual"]["top1"]]
inv = r.get("inversion_identification")
if inv:
    labs.append("100 s\ninversion"); vals.append(inv["real_bold"]["top1"])
cols = [S1] * 4 + ([S2] if inv else [])
ax[2].bar(range(len(vals)), vals, color=cols)
ax[2].axhline(I[k]["chance_top1"], color=INK2, ls=":", lw=1.5)
ax[2].text(len(vals) - 0.5, I[k]["chance_top1"] + 0.005, "chance", ha="right", va="bottom", color=INK2, fontsize=10)
if inv:
    ax[2].axhline(inv["real_bold"]["chance_top1"], color=S2, ls=":", lw=1.2)
ax[2].set_xticks(range(len(vals))); ax[2].set_xticklabels(labs, fontsize=10.5)
ax[2].set_ylabel("top-1 identification accuracy")
ax[2].set_title("C  Identification (top-1)", loc="left", fontweight="bold")
for a in ax:
    a.spines[["top", "right"]].set_visible(False); a.grid(color=GRID, lw=0.8); a.set_axisbelow(True)
fig.tight_layout()
for d in [ROOT + "/figures", ROOT + "/figures"]:
    fig.savefig(f"{d}/fig_realdata_{tag}.png", dpi=110)
print("saved")
