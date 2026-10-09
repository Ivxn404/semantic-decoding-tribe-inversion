"""Forward sensitivity of every cortical vertex to perturbations confined to each
modality slot of the aggregated representation x = [text | audio | video] (384 dims each).

For unit direction v inside one slot, s_v = |f(x + e v) - f(x)| / e per vertex (RMS over time).
Averaged over K random directions per slot. Forward passes only; no optimisation.
"""
import os as _os; ROOT = _os.environ.get("PROJECT_ROOT", _os.path.dirname(_os.path.dirname(_os.path.abspath(__file__))))
import json, math, time
import numpy as np
import torch

from load_tribe import load, make_fwd
from roi_defs import load_rois

torch.set_num_threads(2)
OUT = ROOT + "/results"
K = 16          # random directions per slot
T_LEN = 32
SLOTS = {"text": slice(0, 384), "audio": slice(384, 768), "video": slice(768, 1152)}


def make_truth(H, cycles=2.0, n_basis=8, seed=0):
    g = torch.Generator().manual_seed(seed)
    b = torch.randn(n_basis, H, generator=g)
    b = b / b.norm(dim=1, keepdim=True)
    t = torch.linspace(0, 1, T_LEN).unsqueeze(1)
    f = torch.arange(1, n_basis + 1, dtype=torch.float32) * cycles
    x = torch.cos(2 * math.pi * t * f) @ b
    return (x / x.std()).unsqueeze(0)


def main():
    net, _ = load()
    fwd = make_fwd(net)
    H = net.low_rank_head.in_features
    x0 = make_truth(H, seed=0)
    eps = 0.01 * x0.norm()
    with torch.no_grad():
        y0 = fwd(x0)                                   # (1, V, T')
    g = torch.Generator().manual_seed(77)
    sens = {}
    for name, sl in SLOTS.items():
        d = torch.zeros(K, T_LEN, H)
        d[:, :, sl] = torch.randn(K, T_LEN, sl.stop - sl.start, generator=g)
        d = d / d.flatten(1).norm(dim=1).view(K, 1, 1)
        with torch.no_grad():
            y = fwd(x0 + eps * d)                      # (K, V, T')
        s = ((y - y0).pow(2).mean(dim=2).sqrt() / eps)  # (K, V)
        sens[name] = s.mean(0).numpy()
        print(f"slot {name:5s}: mean per-vertex sensitivity {sens[name].mean():.4e}")

    rois = load_rois()
    allv = np.arange(20484)
    table = {}
    for roi, verts in list(rois.items()) + [("Whole cortex", allv)]:
        row = {"n_vertices": int(len(verts))}
        for name in SLOTS:
            row[f"sens_{name}"] = float(sens[name][verts].mean())
        tot = sum(row[f"sens_{n}"] for n in SLOTS)
        for name in SLOTS:
            row[f"share_{name}"] = row[f"sens_{name}"] / tot
        table[roi] = row
        print(f"{roi:24s} n={row['n_vertices']:5d}  text {row['sens_text']:.3e}  "
              f"audio {row['sens_audio']:.3e}  video {row['sens_video']:.3e}  "
              f"| shares T/A/V {row['share_text']:.2f}/{row['share_audio']:.2f}/{row['share_video']:.2f}")

    np.savez(f"{OUT}/sensitivity_maps.npz", **sens)
    json.dump({"K": K, "eps_rel": 0.01, "rois": table,
               "roi_vertices": {k: v.tolist() for k, v in rois.items()}},
              open(f"{OUT}/roi_sensitivity.json", "w"), indent=1)
    print("saved")


if __name__ == "__main__":
    t = time.time()
    main()
    print(f"{(time.time() - t) / 60:.1f} min")
