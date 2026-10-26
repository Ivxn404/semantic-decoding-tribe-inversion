import json
C = json.load(open("cues.json"))
order = ["title", "problem", "method", "lab", "real", "results1", "results2", "close"]
LEAD = {"title": 0.9}; TAIL = {"close": 2.4}; XF = 0.6
plan, t = [], 0
for i, sid in enumerate(order):
    lead = LEAD.get(sid, 0.5); vo = C[sid]["dur"]; D = lead + vo + TAIL.get(sid, 0.8)
    plan.append({"id": sid, "lead": lead, "vo": vo, "D": round(D, 3), "start": round(t, 3), "starts": C[sid]["starts"], "ends": C[sid]["ends"], "caps": C[sid]["caps"]})
    t += D - (XF if i < len(order) - 1 else 0)
json.dump({"xf": XF, "scenes": plan, "total": round(t, 3)}, open("plan.json", "w"), indent=1)
print("total", round(t, 2), [(p["id"], p["D"]) for p in plan])
