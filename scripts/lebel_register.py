"""Register UTS03's T1 (pycortex anatomical) to the MNI152 template with ANTs SyN."""
import os as _os; ROOT = _os.environ.get("PROJECT_ROOT", _os.path.dirname(_os.path.dirname(_os.path.abspath(__file__))))
import ants, nibabel as nib, numpy as np
from nilearn import datasets
W = ROOT + "/data/lebel/pycx"
mni = datasets.load_mni152_template(resolution=1)
nib.save(mni, f"{W}/mni152_1mm.nii.gz")
raw = nib.load(f"{W}/raw.nii.gz"); bm = nib.load(f"{W}/brainmask.nii.gz")
brain = nib.Nifti1Image(raw.get_fdata() * (bm.get_fdata() > 0), raw.affine)
nib.save(brain, f"{W}/t1_brain.nii.gz")
fixed = ants.image_read(f"{W}/mni152_1mm.nii.gz"); moving = ants.image_read(f"{W}/t1_brain.nii.gz")
reg = ants.registration(fixed=fixed, moving=moving, type_of_transform="SyN", outprefix=f"{W}/t1_to_mni_")
warped = reg["warpedmovout"]; ants.image_write(warped, f"{W}/t1_in_mni.nii.gz")
a = fixed.numpy(); b = warped.numpy(); m = a > a.mean()
print("fwd", reg["fwdtransforms"]); print("inv", reg["invtransforms"])
print("template-vs-warped T1 correlation in brain:", round(float(np.corrcoef(a[m], b[m])[0, 1]), 3))
