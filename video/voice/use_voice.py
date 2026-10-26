# Turns Tanisha's cleaned recording into per-scene voice tracks, phrase cues and word timings for the video.
import json, re, sys, difflib, numpy as np, soundfile as sf
sys.path.insert(0, '/home/claude/work/vid2')
from script import SCENES
V = '/home/claude/work/vid2'
# captions follow what she actually said
SAID = {"but for a deep foundation encoder, this had never been tested.": "but for a deep foundation encoder, this has never been tested.",
        "against a known ground truth.": "against the known ground truth.",
        "On the real model, the brain-wide fit reaches R² ≈ 0.99,": "On the real model, the brain-wide fit reaches an R² of 0.99,",
        "On real fMRI, 4 of 5 story segments are identified among 45,": "On real fMRI, 4 of 5 story segments are identified amongst 45,"}
y, sr = sf.read('clean2.wav')
AL = json.load(open('align.json')); W = json.load(open('asr.json'))['words']
# 10-ms activity map
hop = int(0.01 * sr); db = np.array([20 * np.log10(np.sqrt(np.mean(y[i:i + hop] ** 2)) + 1e-9) for i in range(0, len(y) - hop, hop)])
thr = np.percentile(db, 10) + 14; act = db > thr
for _ in range(2):   # close tiny holes (< 80 ms) inside words
    k = 0
    while k < len(act):
        if not act[k]:
            j = k
            while j < len(act) and not act[j]: j += 1
            if j - k < 8 and k > 0: act[k:j] = True
            k = j
        else: k += 1
on = [k / 100 for k in range(1, len(act)) if act[k] and not act[k - 1]]
off = [k / 100 for k in range(1, len(act)) if not act[k] and act[k - 1]]
def pause_before(t):
    prev = [o for o in off if o <= t]; return t - prev[-1] if prev else 9
def snap_start(t, first=False):
    c = [o for o in on if -0.35 <= o - t <= (1.3 if first else 0.65)]
    return max(c, key=pause_before) if c else t
def snap_end(t, nxt):
    c = [o for o in off if -0.25 <= o - t <= 0.9 and o <= nxt - 0.05]
    return min(c, key=lambda o: abs(o - t - 0.1)) if c else t
ph = []
for p in AL: ph.append(dict(p))
for i, p in enumerate(ph):
    p['s'] = snap_start(p['start'], i == 0)
for i, p in enumerate(ph):
    nxt = ph[i + 1]['s'] if i + 1 < len(ph) else len(y) / sr
    p['e'] = snap_end(p['end'], nxt)
# word timings for each caption word, from the ASR words aligned to the caption text
norm = lambda s: re.sub(r'[^a-z0-9]', '', s.lower().replace('²', ' squared'))
A = [(norm(t), w[0], w[1]) for w in W for t in w[2].replace('-', ' ').split() if norm(t)]
for p in ph:
    p['cap'] = SAID.get(p['cap'], p['cap'])
C = [(norm(t.replace('R²', 'Rsquared')), pi, wi) for pi, p in enumerate(ph) for wi, t in enumerate(p['cap'].split())]
sm = difflib.SequenceMatcher(a=[c[0] for c in C], b=[a[0] for a in A], autojunk=False)
wt = {}
for blk in sm.get_matching_blocks():
    for k in range(blk.size): wt[C[blk.a + k][1:]] = (A[blk.b + k][1], A[blk.b + k][2])
cues = {}; k = 0
for sid, phrases in SCENES:
    P = ph[k:k + len(phrases)]; k += len(phrases)
    s0 = max(0.0, P[0]['s'] - 0.08)
    nxt_s = ph[k]['s'] if k < len(ph) else len(y) / sr
    # scene ends where the long pause before the next scene begins (the last offset followed by >= 0.4 s of silence)
    cand = [o for o in off if P[-1]['e'] - 0.3 <= o <= nxt_s - 0.1 and (min([n for n in on if n > o], default=9e9) - o) >= 0.4]
    end_t = cand[0] if cand else P[-1]['e']
    P[-1]['e'] = max(P[-1]['e'], end_t)
    s1 = min(len(y) / sr, end_t + 0.22)
    seg = y[int(s0 * sr): int(s1 * sr)].copy(); f = int(0.02 * sr); seg[:f] *= np.linspace(0, 1, f); seg[-f:] *= np.linspace(1, 0, f)
    sf.write(f'{V}/vo/{sid}.wav', seg.astype(np.float32), sr)
    words = []
    for pi_local, p in enumerate(P):
        pi = ph.index(p); ws = p['cap'].split(); tl = []
        for wi in range(len(ws)): tl.append(wt.get((pi, wi)))
        # fill unmatched words by interpolation inside the phrase span, clamp to it
        known = [(i, t) for i, t in enumerate(tl) if t]; S, E = p['s'], p['e']
        for i in range(len(ws)):
            if tl[i] is None:
                lo = max([kk for kk in known if kk[0] < i], default=(-1, (S, S)), key=lambda x: x[0]); hi = min([kk for kk in known if kk[0] > i], default=(len(ws), (E, E)), key=lambda x: x[0])
                a = lo[1][1]; b = hi[1][0]; n = hi[0] - lo[0]; tl[i] = (a + (b - a) * (i - lo[0] - 1) / max(1, n - 1), a + (b - a) * (i - lo[0]) / max(1, n - 1))
        tl = [(max(S, min(a, E)), max(S, min(b, E))) for a, b in tl]
        words.append([(round(a - s0, 3), round(b - s0, 3)) for a, b in tl])
    cues[sid] = {"starts": [round(p['s'] - s0, 3) for p in P], "ends": [round(p['e'] - s0, 3) for p in P], "caps": [p['cap'] for p in P],
                 "words": words, "dur": round(s1 - s0, 3), "src": [round(s0, 2), round(s1, 2)]}
    print(f"{sid:9s} {s0:6.2f}-{s1:6.2f} ({s1 - s0:5.2f}s) phrases at {cues[sid]['starts']}")
json.dump(cues, open(f'{V}/cues.json', 'w'), indent=1)
print('speech total', round(sum(c['dur'] for c in cues.values()), 1))
