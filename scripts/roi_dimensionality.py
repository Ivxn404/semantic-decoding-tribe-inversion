"""Effective dimensionality of each ROI's response to the semantic representation.

Response matrix R_roi (K x [n_vertices * T']) = finite-difference responses of the ROI to K random
unit directions in x around the ground truth. Participation ratio PR = (sum s^2)^2 / sum s^4 over its
singular values s: how many independent directions of x the region can distinguish. Also reports
gain (mean response norm per vertex). Compared against the same size-matched random vertex sets used
in roi_inversion.py. Forward passes only.
"""
import os as _os; ROOT = _os.environ.get("PROJECT_ROOT", _os.path.dirname(_os.path.dirname(_os.path.abspath(__file__))))
import json, math
import numpy as np, torch
from load_tribe import load, make_fwd
from roi_defs import load_rois
from roi_inversion import make_truth, random_mask

torch.set_num_threads(2)
R = ROOT + "/results"
K = 128


def main():
    net, _ = load(); fwd = make_fwd(net); H = 1152
    x0 = make_truth(H, seed=0); eps = 0.01 * x0.norm()
    g = torch.Generator().manual_seed(2024)
    with torch.no_grad():
        y0 = fwd(x0)[0]
        resp = []
        for i in range(0, K, 16):
            d = torch.randn(16, 32, H, generator=g); d = d / d.flatten(1).norm(dim=1).view(-1, 1, 1)
            resp.append(((fwd(x0 + eps * d) - y0) / eps))
        resp = torch.cat(resp)                       # (K, V, T')
    rois = load_rois()
    sets = {n: v for n, v in rois.items()}
    for n, v in rois.items():
        sets[f"Random |{n}|"] = random_mask(len(v), 3)
    sets["Whole cortex"] = np.arange(20484)
    out = {}
    for n, v in sets.items():
        M = resp[:, torch.as_tensor(v)].reshape(K, -1).double()
        s = torch.linalg.svdvals(M)
        lam = s ** 2
        pr = float(lam.sum() ** 2 / (lam ** 2).sum())
        top1 = float(lam[0] / lam.sum())
        gain = float(M.norm(dim=1).mean() / math.sqrt(len(v)))
        out[n] = {"n_vertices": int(len(v)), "participation_ratio": pr, "top1_variance_share": top1, "gain_per_vertex": gain}
        print(f"{n:34s} n={len(v):5d}  PR={pr:6.2f}  top1={top1:.3f}  gain/vertex={gain:.3e}")
    json.dump({"K": K, "rows": out}, open(f"{R}/roi_dimensionality.json", "w"), indent=1)


if __name__ == "__main__":
    main()
