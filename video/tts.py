import sys, soundfile as sf, numpy as np
from kokoro_onnx import Kokoro
from script import SCENES
voice = sys.argv[1] if len(sys.argv) > 1 else "af_heart"
speed = float(sys.argv[2]) if len(sys.argv) > 2 else 1.0
k = Kokoro("tts/kokoro-v1.0.onnx", "tts/voices-v1.0.bin")
tot = 0
for sid, text, _ in SCENES:
    a, sr = k.create(text, voice=voice, speed=speed, lang="en-us")
    # trim leading/trailing silence
    nz = np.where(np.abs(a) > 0.01)[0]; a = a[max(0, nz[0] - 800): nz[-1] + 1600]
    sf.write(f"vo/{sid}.wav", a, sr); d = len(a) / sr; tot += d
    print(f"{sid:9s} {d:5.2f}s")
print("total speech", round(tot, 1), "s")
