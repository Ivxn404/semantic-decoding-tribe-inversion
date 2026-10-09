import os as _os; ROOT = _os.environ.get("PROJECT_ROOT", _os.path.dirname(_os.path.dirname(_os.path.abspath(__file__))))
import json, numpy as np
R=ROOT + "/results"
s=np.load(f"{R}/sensitivity_maps.npz"); tot=s["text"]+s["audio"]+s["video"]
share={k:s[k]/tot for k in ("text","audio","video")}
meta=json.load(open(f"{R}/roi_sensitivity.json"))
rng=np.random.default_rng(0); out={}
for roi,v in meta["roi_vertices"].items():
    v=np.array(v); row={}
    for k in share:
        obs=share[k][v].mean()
        null=np.array([share[k][rng.choice(20484,len(v),replace=False)].mean() for _ in range(2000)])
        row[k]={"obs":float(obs),"null_mean":float(null.mean()),"z":float((obs-null.mean())/null.std()),
                "p_upper":float((null>=obs).mean())}
    row["total_sens_ratio_to_cortex"]=float(tot[v].mean()/tot.mean())
    out[roi]=row
    print(f"{roi:24s} text z={row['text']['z']:+6.1f}  audio z={row['audio']['z']:+6.1f}  video z={row['video']['z']:+6.1f}  total×{row['total_sens_ratio_to_cortex']:.2f}")
json.dump(out,open(f"{R}/roi_share_stats.json","w"),indent=1)
