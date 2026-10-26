# Synthesises each phrase, joins phrases per scene with natural pauses, and records phrase start times.
import sys, json, soundfile as sf, numpy as np
from kokoro_onnx import Kokoro
from script import SCENES
voice = sys.argv[1] if len(sys.argv) > 1 else "af_heart"; speed = float(sys.argv[2]) if len(sys.argv) > 2 else 1.08
k = Kokoro("tts/kokoro-v1.0.onnx", "tts/voices-v1.0.bin")
cues = {}; tot = 0
for sid, phrases in SCENES:
    parts, starts, ends, t = [], [], [], 0.0
    for i, (spoken, cap) in enumerate(phrases):
        a, sr = k.create(spoken, voice=voice, speed=speed, lang="en-us")
        nz = np.where(np.abs(a) > 0.01)[0]; a = a[max(0, nz[0] - 600): nz[-1] + 1200]
        if i: gap = 0.34 if phrases[i - 1][0].rstrip().endswith(('.', '?', ':')) else 0.16; parts.append(np.zeros(int(gap * sr), np.float32)); t += gap
        starts.append(round(t, 3)); parts.append(a.astype(np.float32)); t += len(a) / sr; ends.append(round(t, 3))
    y = np.concatenate(parts); sf.write(f"vo/{sid}.wav", y, sr); tot += t
    cues[sid] = {"starts": starts, "ends": ends, "caps": [c for _, c in phrases], "dur": round(t, 3)}
    print(f"{sid:9s} {t:5.2f}s  phrases at {starts}")
json.dump(cues, open("cues.json", "w"), indent=1); print("total speech", round(tot, 1))
