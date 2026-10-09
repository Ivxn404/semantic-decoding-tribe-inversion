"""Project LeBel 2023 (ds003020) UTS03 responses onto fsaverage5 with TRIBE v2's projector settings.

Chain per story:
  authors' preprocessed responses (n_TR x 95 556 voxels, pycortex 'thick' mask, (z,y,x) order)
  -> 4-D functional volume with voxel->world affine = inv(pycortex 'coord' transform)
     (world = the subject's surface / T1 space; validated: mid-cortex lands 100% in the mask)
  -> MNI152 via ANTs SyN (T1 -> template, applied to the time series)
  -> fsaverage5 by nilearn vol_to_surf: mid-depth mesh, 3 mm ball, linear (TRIBE's settings;
     public fsaverage5 meshes stand in for TRIBE's internal MNI2009c-hybrid meshes)
  -> detrend + z-score per vertex (TRIBE's cleaning). TR stays 2 s; resampling happens at use.
Output: bold_fs5/<story>.npy, float16, shape (n_TR, 20 484), left then right hemisphere.
"""
import os as _os; ROOT = _os.environ.get("PROJECT_ROOT", _os.path.dirname(_os.path.dirname(_os.path.abspath(__file__))))
import json, os, sys, time
import numpy as np, nibabel as nib, h5py, ants
from nilearn import datasets, image
from nilearn.surface import vol_to_surf
from scipy.signal import detrend

L = ROOT + "/data/lebel"; P = f"{L}/pycx"; OUT = f"{L}/bold_fs5"
os.makedirs(OUT, exist_ok=True)
STORIES = sys.argv[1:] or ["wheretheressmoke", "adollshouse", "avatar", "legacy", "souls", "undertheinfluence"]

C = np.array(json.load(open(f"{P}/matrices.xfm"))["coord"])
vox2world = np.linalg.inv(C)
mask = nib.load(f"{P}/mask_thick.nii.gz").get_fdata() > 0
z, y, x = np.where(mask.transpose(2, 1, 0))            # authors' column order
mni2 = image.resample_img(nib.load(f"{P}/mni152_1mm.nii.gz"), target_affine=np.diag([2, 2, 2]),
                          interpolation="continuous", force_resample=True, copy_header=True)
nib.save(mni2, f"{P}/mni152_2mm.nii.gz")
fixed = ants.image_read(f"{P}/mni152_2mm.nii.gz")
fwd = [f"{P}/t1_to_mni_1Warp.nii.gz", f"{P}/t1_to_mni_0GenericAffine.mat"]
fs = datasets.fetch_surf_fsaverage("fsaverage5")


def mid_mesh(hemi):
    pv, pf = nib.load(fs[f"pial_{hemi}"]).darrays[0].data, nib.load(fs[f"pial_{hemi}"]).darrays[1].data
    wv = nib.load(fs[f"white_{hemi}"]).darrays[0].data
    return (0.5 * pv + 0.5 * wv, pf)


meshes = {h: mid_mesh(h) for h in ("left", "right")}
summary = {}
for st in STORIES:
    t0 = time.time()
    f = h5py.File(f"{L}/hf5/{st}.hf5", "r")
    D = np.nan_to_num(f["data"][:]).astype(np.float32)           # (n_TR, 95556); test story: mean of 10 repeats
    nT = D.shape[0]
    vol = np.zeros(mask.shape + (nT,), np.float32)
    vol[x, y, z, :] = D.T
    func = nib.Nifti1Image(vol, vox2world)
    nib.save(func, f"{L}/tmp_func.nii.gz")
    mov = ants.image_read(f"{L}/tmp_func.nii.gz")
    warped = ants.apply_transforms(fixed=fixed, moving=mov, transformlist=fwd, imagetype=3, interpolator="linear")
    ants.image_write(warped, f"{L}/tmp_mni.nii.gz")
    mimg = nib.load(f"{L}/tmp_mni.nii.gz")
    surf = np.vstack([vol_to_surf(mimg, surf_mesh=meshes[h], inner_mesh=fs[f"white_{h}"], radius=3.0,
                                  interpolation="linear", kind="ball") for h in ("left", "right")])  # (20484, nT)
    surf = np.nan_to_num(surf)
    surf = detrend(surf, axis=1)
    surf = (surf - surf.mean(1, keepdims=True)) / (surf.std(1, keepdims=True) + 1e-6)
    np.save(f"{OUT}/{st}.npy", surf.T.astype(np.float16))
    cov = float((np.abs(surf).sum(1) > 0).mean())
    summary[st] = {"n_TR": int(nT), "vertex_coverage": cov}
    print(f"{st:20s} TR={nT:4d}  vertices with signal {cov:.3f}  {time.time() - t0:.0f}s", flush=True)
json.dump(summary, open(f"{OUT}/summary.json", "w"), indent=1)
for p in ("tmp_func.nii.gz", "tmp_mni.nii.gz"):
    if os.path.exists(f"{L}/{p}"): os.remove(f"{L}/{p}")
