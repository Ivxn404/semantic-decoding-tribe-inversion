"""Apply the validated sampler to every story: (n_TR, 95556) -> (n_TR, 20484), detrend + z-score (TRIBE cleaning).
Downloads the authors' preprocessed responses for UTS03 from OpenNeuro if they are not there yet."""
import os as _os; ROOT = _os.environ.get("PROJECT_ROOT", _os.path.dirname(_os.path.dirname(_os.path.abspath(__file__))))
import json, os, numpy as np, h5py, scipy.sparse as sp
from scipy.signal import detrend
from lebel_features import fetch, S3, STORIES

L = os.environ.get("LEBEL_WORK", ROOT + "/data/lebel")
S = sp.load_npz(f"{L}/pycx/sampler.npz"); os.makedirs(f"{L}/bold_fs5", exist_ok=True)
summ = {}
for st in STORIES:
    if os.path.exists(f"{L}/bold_fs5/{st}.npy"):
        print("cached", st); continue
    h = fetch(f"{S3}/derivatives/preprocessed_data/UTS03/{st}.hf5", f"{L}/hf5/{st}.hf5")
    D = np.nan_to_num(h5py.File(h, "r")["data"][:]).astype(np.float32)
    B = detrend((S @ D.T).T, axis=0)
    B = (B - B.mean(0)) / (B.std(0) + 1e-6)
    np.save(f"{L}/bold_fs5/{st}.npy", B.astype(np.float16))
    summ[st] = {"n_TR": int(B.shape[0]), "TR_s": 2.0, "note": "mean of 10 repeats" if st == "wheretheressmoke" else "single presentation"}
    print(st, B.shape, flush=True)
json.dump(summ, open(f"{L}/bold_fs5/summary.json", "w"), indent=1)
