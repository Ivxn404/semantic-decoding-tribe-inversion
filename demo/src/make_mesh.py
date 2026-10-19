"""fsaverage5 inflated mesh, sulcal depth, the six networks and TRIBE v2 sensitivity shares, packed for the demo page."""
import os, sys, base64, numpy as np
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.join(ROOT, "scripts"))


def build():
    from nilearn import datasets, surface
    from roi_defs import load_rois
    f = datasets.fetch_surf_fsaverage("fsaverage5")
    P, Fc, S = [], [], []
    for h, off in (("left", 0), ("right", 10242)):
        c, t = surface.load_surf_mesh(f["infl_" + h]); P.append(np.asarray(c, float)); Fc.append(np.asarray(t) + off)
        S.append(np.asarray(surface.load_surf_data(f["sulc_" + h])))
    P, Fc, S = np.concatenate(P), np.concatenate(Fc), np.concatenate(S)
    L, R = P[:10242].copy(), P[10242:].copy(); L[:, 0] -= L[:, 0].max() + 3; R[:, 0] -= R[:, 0].min() - 3
    P = np.concatenate([L, R]); P -= P.mean(0); pos = np.round(P / np.abs(P).max() * 32000).astype(np.int16)
    rois = load_rois(); names = list(rois); lab = np.zeros(20484, np.uint8)
    for i, n in enumerate(names): lab[rois[n]] = i + 1
    z = np.load(os.path.join(ROOT, "results", "sensitivity_maps.npz")); tot = z["text"] + z["audio"] + z["video"]
    q = lambda v, lo, hi: np.clip(np.round((v - lo) / (hi - lo) * 255), 0, 255).astype(np.uint8)
    b = lambda a: base64.b64encode(a.tobytes()).decode()
    lt = np.log10(tot)
    return {"nv": 20484, "nf": int(len(Fc)), "pos": b(pos), "faces": b(Fc.astype(np.uint16)), "sulc": b(q(S, -np.abs(S).max(), np.abs(S).max())),
            "roi": b(lab), "roi_names": names, "share_text": b(q(z["text"] / tot, 0, 1)), "share_audio": b(q(z["audio"] / tot, 0, 1)),
            "share_video": b(q(z["video"] / tot, 0, 1)), "sens_total": b(q(lt, *np.percentile(lt, [1, 99])))}
