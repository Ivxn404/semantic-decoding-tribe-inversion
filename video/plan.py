import json, soundfile as sf
from script import SCENES
LEAD = {"title": 0.9}; TAIL = {"close": 2.4}
plan = []
for sid, _, _ in SCENES:
    vo = sf.info(f"vo/{sid}.wav").duration
    lead = LEAD.get(sid, 0.5); D = lead + vo + TAIL.get(sid, 0.9)
    plan.append({"id": sid, "lead": lead, "vo": round(vo, 3), "D": round(D, 3)})
XF = 0.6
t = 0
for i, p in enumerate(plan):
    p["start"] = round(t, 3); t += p["D"] - (XF if i < len(plan) - 1 else 0)
json.dump({"xf": XF, "scenes": plan, "total": round(t, 3)}, open("plan.json", "w"), indent=1)
print(json.dumps(plan)); print("total", round(t, 2))
