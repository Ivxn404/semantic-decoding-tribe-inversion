"""Anatomical ROIs on fsaverage5, from the Destrieux atlas, in TRIBE v2's vertex order
(left hemisphere 0..10241, right hemisphere 10242..20483)."""
import os as _os; ROOT = _os.environ.get("PROJECT_ROOT", _os.path.dirname(_os.path.dirname(_os.path.abspath(__file__))))
import numpy as np
from nilearn import datasets

N_HEMI = 10242

NETWORKS = {
    # Fedorenko-style core language network, left (dominant) hemisphere.
    # Angular gyrus is assigned here, not to the DMN, so that ROIs stay disjoint.
    "Language (L)": ("L", ["G_front_inf-Opercular", "G_front_inf-Triangul", "G_front_inf-Orbital",
                           "G_temp_sup-Lateral", "S_temporal_sup", "G_temporal_middle",
                           "Pole_temporal", "G_pariet_inf-Angular"]),
    # Same labels, right hemisphere: tests lateralisation.
    "Language homologue (R)": ("R", ["G_front_inf-Opercular", "G_front_inf-Triangul", "G_front_inf-Orbital",
                                     "G_temp_sup-Lateral", "S_temporal_sup", "G_temporal_middle",
                                     "Pole_temporal", "G_pariet_inf-Angular"]),
    "Auditory": ("LR", ["G_temp_sup-G_T_transv", "S_temporal_transverse", "G_temp_sup-Plan_tempo"]),
    "Default mode": ("LR", ["G_precuneus", "G_cingul-Post-dorsal", "G_cingul-Post-ventral",
                            "G_and_S_cingul-Ant", "S_subparietal"]),
    "Visual": ("LR", ["Pole_occipital", "G_cuneus", "S_calcarine", "G_occipital_middle",
                      "G_occipital_sup", "G_oc-temp_med-Lingual"]),
    "Somatomotor": ("LR", ["G_precentral", "G_postcentral", "S_central"]),
}


def load_rois(data_dir=__import__("os").environ.get("ATLAS_DIR", ROOT + "/data/atlas")):
    d = datasets.fetch_atlas_surf_destrieux(data_dir=data_dir, verbose=0)
    names = [l if isinstance(l, str) else l.decode() for l in d["labels"]]
    idx = {n: i for i, n in enumerate(names)}
    left, right = np.asarray(d["map_left"]), np.asarray(d["map_right"])
    rois = {}
    for net, (hemi, labels) in NETWORKS.items():
        ids = [idx[l] for l in labels]
        parts = []
        if "L" in hemi:
            parts.append(np.where(np.isin(left, ids))[0])
        if "R" in hemi:
            parts.append(np.where(np.isin(right, ids))[0] + N_HEMI)
        rois[net] = np.sort(np.concatenate(parts))
    return rois


if __name__ == "__main__":
    for k, v in load_rois().items():
        print(f"{k:24s} {len(v):5d} vertices")
