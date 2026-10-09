"""Build a sparse fsaverage5 <- functional-voxel sampling matrix for UTS03.
For each fsaverage5 vertex: 20 points in a 3 mm ball around the mid-depth vertex (MNI space, nilearn's
ball cloud), mapped MNI -> T1 (ANTs SyN, point transform) -> functional voxels (pycortex coord),
trilinear weights restricted to the cortical mask, averaged. Saves sampler.npz."""
import os as _os; ROOT = _os.environ.get("PROJECT_ROOT", _os.path.dirname(_os.path.dirname(_os.path.abspath(__file__))))
import json, numpy as np, nibabel as nib, ants, pandas as pd, scipy.sparse as sp
from nilearn import datasets
from nilearn.surface.surface import _uniform_ball_cloud
P = ROOT + "/data/lebel/pycx"
import sys
INV = [f"{P}/t1_to_mni_0GenericAffine.mat", f"{P}/t1_to_mni_1InverseWarp.nii.gz"] if "--inv" in sys.argv else [f"{P}/t1_to_mni_1Warp.nii.gz", f"{P}/t1_to_mni_0GenericAffine.mat"]
WHICH = [True, False] if "--inv" in sys.argv else None
C = np.array(json.load(open(f"{P}/matrices.xfm"))["coord"])
mask = nib.load(f"{P}/mask_thick.nii.gz").get_fdata() > 0
z, y, x = np.where(mask.transpose(2, 1, 0))
col = -np.ones(mask.shape, int); col[x, y, z] = np.arange(len(x))
fs = datasets.fetch_surf_fsaverage("fsaverage5")
ball = _uniform_ball_cloud(n_points=20) * 3.0
rows, cols, vals = [], [], []
stats = {}
for hi, h in enumerate(("left", "right")):
    pv = nib.load(fs[f"pial_{h}"]).darrays[0].data; wv = nib.load(fs[f"white_{h}"]).darrays[0].data
    mid = 0.5 * pv + 0.5 * wv                                            # (10242, 3) RAS mm
    pts = (mid[:, None, :] + ball[None]).reshape(-1, 3)
    df = pd.DataFrame({"x": -pts[:, 0], "y": -pts[:, 1], "z": pts[:, 2]})  # RAS -> LPS
    out = ants.apply_transforms_to_points(3, df, INV)
    t1 = np.c_[-out["x"].values, -out["y"].values, out["z"].values]       # LPS -> RAS (T1/surface world)
    v = (C @ np.c_[t1, np.ones(len(t1))].T).T[:, :3]                      # functional voxel coords
    f0 = np.floor(v).astype(int); fr = v - f0
    W = np.zeros((len(v),)); hit = np.zeros(len(v), bool)
    vid = np.repeat(np.arange(len(mid)), len(ball)) + hi * 10242
    for dx in (0, 1):
        for dy in (0, 1):
            for dz in (0, 1):
                ii = f0 + [dx, dy, dz]
                ok = (ii >= 0).all(1) & (ii < np.array(mask.shape)).all(1)
                c = np.full(len(v), -1); c[ok] = col[tuple(ii[ok].T)]
                w = (fr[:, 0] if dx else 1 - fr[:, 0]) * (fr[:, 1] if dy else 1 - fr[:, 1]) * (fr[:, 2] if dz else 1 - fr[:, 2])
                good = c >= 0
                rows.append(vid[good]); cols.append(c[good]); vals.append(w[good]); hit |= good
    stats[h] = float(hit.reshape(len(mid), -1).any(1).mean())
S = sp.csr_matrix((np.concatenate(vals), (np.concatenate(rows), np.concatenate(cols))), shape=(20484, len(x)))
rs = np.asarray(S.sum(1)).ravel(); S = sp.diags(1 / np.maximum(rs, 1e-12)) @ S
sp.save_npz(f"{P}/sampler.npz", S.tocsr())
print("vertices with any cortical-mask sample:", stats, "| nnz", S.nnz)
