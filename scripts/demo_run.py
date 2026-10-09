"""Record one real inversion through frozen TRIBE v2 for the demonstration video:
per-timestep cosine to ground truth and prediction MSE every 40 steps (whole cortex, 2400 steps)."""
import os as _os; ROOT = _os.environ.get("PROJECT_ROOT", _os.path.dirname(_os.path.dirname(_os.path.abspath(__file__))))
import json, torch
from load_tribe import load, make_fwd
from roi_inversion import make_truth
torch.set_num_threads(2)
net,_=load(); fwd=make_fwd(net); H=1152; STEPS=2400
truth=make_truth(H, seed=0)
with torch.no_grad(): y=fwd(truth)
g=torch.Generator().manual_seed(999)
x=(0.01*torch.randn(1,32,H,generator=g)).requires_grad_(True)
opt=torch.optim.Adam([x],lr=5e-2); sch=torch.optim.lr_scheduler.CosineAnnealingLR(opt,T_max=STEPS)
frames=[]
for i in range(STEPS+1):
    if i%40==0:
        with torch.no_grad():
            c=torch.nn.functional.cosine_similarity(x[0],truth[0],dim=1)
            frames.append({"step":i,"cos_t":c.tolist(),"cos":c.mean().item(),"mse":torch.nn.functional.mse_loss(fwd(x),y).item(),
                           "pred_v":fwd(x)[0,:400:4,::4].tolist() if i%240==0 else None})
        print(i, round(frames[-1]["cos"],4), flush=True)
    if i==STEPS: break
    opt.zero_grad(); l=torch.nn.functional.mse_loss(fwd(x),y); l.backward(); opt.step(); sch.step()
with torch.no_grad(): tv=y[0,:400:4,::4].tolist()
json.dump({"frames":frames,"target_v":tv},open(ROOT + "/results/demo_run.json","w"))
print("DONE")
