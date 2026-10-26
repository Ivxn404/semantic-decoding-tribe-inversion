# Original ambient pad (Am-F-C-G), generated here so the video carries no third-party music.
import numpy as np, soundfile as sf, json
sr = 48000; T = json.load(open('plan.json'))['total'] + 1.0; n = int(sr * T); t = np.arange(n) / sr
hz = lambda m: 440 * 2 ** ((m - 69) / 12)
prog = [[57, 60, 64, 69], [53, 57, 60, 65], [48, 55, 60, 64], [55, 59, 62, 67]]; seg = 5.5
out = np.zeros(n); rng = np.random.default_rng(3)
for i in range(int(T / seg) + 1):
    ch = prog[i % 4]; a = int(i * seg * sr); b = min(n, int((i * seg + seg + 2.5) * sr))
    if a >= n: break
    tt = t[a:b] - t[a]; env = np.minimum(1, tt / 2.2) * np.exp(-np.maximum(0, tt - seg) / 0.9)
    for m in ch:
        for det, amp in ((0, 1.0), (0.12, 0.5), (-0.1, 0.5)):
            ph = rng.uniform(0, 2 * np.pi); f = hz(m) + det
            out[a:b] += amp * env * (np.sin(2 * np.pi * f * tt + ph) + 0.18 * np.sin(2 * np.pi * 2 * f * tt + ph))
    out[a:b] += 0.9 * env * np.sin(2 * np.pi * hz(ch[0] - 12) * tt)
out *= 1 + 0.08 * np.sin(2 * np.pi * 0.11 * t); out += np.sin(2 * np.pi * hz(81) * t) * 0.06 * (0.5 + 0.5 * np.sin(2 * np.pi * 0.07 * t))
y = np.zeros_like(out); k = 0.12
for i in range(1, n): y[i] = y[i - 1] + k * (out[i] - y[i - 1])
y /= np.max(np.abs(y)) + 1e-9; y *= np.minimum(1, t / 2.5) * np.minimum(1, (T - t) / 3.5) * 0.9
sf.write('music.wav', np.stack([y, np.roll(y, int(0.012 * sr))], 1), sr); print('music', round(T, 1))
