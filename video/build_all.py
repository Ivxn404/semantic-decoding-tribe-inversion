# Rebuilds the video from vo/*.wav + cues.json: demo clips, captions, mix and encode.
# (Slide frames are rendered first with: node frames.js title problem method results1 results2 close)
import json, subprocess, glob, re
P = json.load(open('plan.json')); S = P['scenes']; xf = P['xf']; total = P['total']; C = json.load(open('cues.json'))
SC = {s['id']: s for s in S}
run = lambda a: subprocess.run(a, check=True)

# ---- slide clips from frames
for sid in ["title", "problem", "method", "results1", "results2", "close"]:
    run(["ffmpeg", "-v", "error", "-y", "-framerate", "25", "-i", f"frames/{sid}/%05d.jpg", "-c:v", "libx264", "-preset", "medium", "-crf", "16", "-pix_fmt", "yuv420p", f"clips/{sid}.mp4"])

# ---- lab: run ends as "Yet recovery stalls" begins; push in on the agreement matrix for "disagree"
L = glob.glob('raw_lab/*.webm')[0]; R = glob.glob('raw_real/*.webm')[0]
s = SC['lab']; D = s['D']; p2 = s['lead'] + s['starts'][1]; p3 = s['lead'] + s['starts'][2]
runT = p2 + 0.25; hold = D - runT; f = (52.4 - 9.0) / runT; t0 = p3 - runT - 0.15
Z = 1920 / 1040; X = 690 * 2; Y = 470 * 2
e = f"(1-pow(1-clip((on/25-{t0:.3f})/0.9\\,0\\,1)\\,3))"
zp = f"scale=3840:2160,zoompan=z='1+({Z:.4f}-1)*{e}':x='{X}*{e}':y='{Y}*{e}':d=1:s=1920x1080:fps=25"
fc = (f"[0:v]trim=9.0:52.4,setpts=(PTS-STARTPTS)/{f:.4f},fps=25[a];"
      f"[0:v]trim=52.4:{min(57.0, 52.4 + hold + 0.2):.3f},setpts=PTS-STARTPTS,fps=25,{zp},tpad=stop_mode=clone:stop_duration=2[b];[a][b]concat=n=2:v=1[o]")
run(["ffmpeg", "-v", "error", "-y", "-i", L, "-filter_complex", fc, "-map", "[o]", "-t", f"{D:.3f}", "-c:v", "libx264", "-crf", "16", "-preset", "medium", "-pix_fmt", "yuv420p", "clips/lab.mp4"])
# ---- real: highlight R² while it is said, then the recovery numbers
s = SC['real']; D = s['D']; p2 = s['lead'] + s['starts'][1]; cr = C['real']
ws = cr['caps'][0].split(); a1 = s['lead'] + (cr['words'][0][ws.index('R²')][0] - 0.15 if 'words' in cr and 'R²' in ws else min(2.6, s['starts'][1] - 0.8))
f2 = (20.6 - 10.0) / D
box = lambda x, w, a, b: f"drawbox=x={x}:y=852:w={w}:h=52:color=0xD9501F@0.95:t=5:enable='between(t,{a:.2f},{b:.2f})'"
run(["ffmpeg", "-v", "error", "-y", "-i", R, "-vf", f"trim=10.0:20.6,setpts=(PTS-STARTPTS)/{f2:.4f},fps=25,{box(1228, 262, a1, p2)},{box(1494, 328, p2, D)}", "-t", f"{D:.3f}", "-c:v", "libx264", "-crf", "16", "-preset", "medium", "-pix_fmt", "yuv420p", "clips/real.mp4"])

# ---- captions: one panel per phrase, words fill as they are spoken (real word timings when available)
def ts(x): return f"{int(x // 3600)}:{int(x % 3600 // 60):02d}:{x % 60:05.2f}"
hdr = """[Script Info]
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080
WrapStyle: 0
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Box,Inter Display,52,&HFF000000,&HFF000000,&H2E351C10,&H00000000,-1,0,0,0,100,100,0,0,3,16,0,2,240,240,58,1
Style: Cap,Inter Display,52,&H00FFFFFF,&H00B59C8B,&HFF000000,&H00000000,-1,0,0,0,100,100,0,0,1,0,0,2,240,240,58,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
ev = []
for s in S:
    c = C[s['id']]; base = s['start'] + s['lead']
    for i, cap in enumerate(c['caps']):
        a = base + c['starts'][i]; e_sp = base + c['ends'][i]
        end = base + c['starts'][i + 1] - 0.03 if i + 1 < len(c['caps']) else min(e_sp + 0.6, s['start'] + s['D'] - 0.25)
        words = cap.split(' ')
        if 'words' in c:
            wt = c['words'][i]; T = [base + w[0] for w in wt] + [base + wt[-1][1]]
            lead_k = max(0, round((T[0] - a) * 100)); cs = [max(3, round((T[j + 1] - T[j]) * 100)) for j in range(len(words))]
        else:
            lead_k = 0; tot = sum(len(w) + 2 for w in words); cs = [max(4, round((e_sp - a) * 100 * (len(w) + 2) / tot)) for w in words]
        def col(w): return f"{{\\1c&H5C9AFF&}}{w}{{\\1c&HFFFFFF&}}" if re.search(r'\d', w) or w.strip('.,:') == 'non-convex' else w
        text = (f"{{\\k{lead_k}}}" if lead_k else '') + ' '.join(f"{{\\kf{k}}}{col(w)}" for k, w in zip(cs, words))
        ev.append(f"Dialogue: 0,{ts(a)},{ts(end)},Box,,0,0,0,,{{\\fad(120,100)}}{cap}")
        ev.append(f"Dialogue: 1,{ts(a)},{ts(end)},Cap,,0,0,0,,{{\\fad(120,100)}}{text}")
open('captions.ass', 'w').write(hdr + '\n'.join(ev) + '\n')

# ---- mix and encode
args = ["ffmpeg", "-v", "error", "-y"]
for s in S: args += ["-i", f"clips/{s['id']}.mp4"]
for s in S: args += ["-i", f"vo/{s['id']}.wav"]
args += ["-i", "music.wav"]
n = len(S); fc = [f"[{i}:v]fps=25,format=yuv420p,setpts=PTS-STARTPTS[v{i}]" for i in range(n)]
prev = "v0"
for i in range(1, n): fc.append(f"[{prev}][v{i}]xfade=transition=fade:duration={xf}:offset={S[i]['start']:.3f}[x{i}]"); prev = f"x{i}"
fc.append(f"[{prev}]subtitles=captions.ass,fade=t=out:st={total - 0.8:.3f}:d=0.8[vout]")
for i, s in enumerate(S):
    d = int(round((s['start'] + s['lead']) * 1000)); fc.append(f"[{n + i}:a]aresample=48000,aformat=channel_layouts=stereo,adelay={d}|{d}[a{i}]")
fc.append("".join(f"[a{i}]" for i in range(n)) + f"amix=inputs={n}:normalize=0,loudnorm=I=-16:TP=-2:LRA=9[voice]")
fc.append(f"[voice]apad=whole_dur={total:.3f},asplit=2[vmix][vkey]")
fc.append(f"[{2 * n}:a]volume=0.20[mus]")
fc.append("[mus][vkey]sidechaincompress=threshold=0.03:ratio=6:attack=40:release=600[duck]")
fc.append(f"[vmix][duck]amix=inputs=2:normalize=0:duration=longest,atrim=0:{total:.3f},afade=t=out:st={total - 1.5:.3f}:d=1.5,alimiter=limit=0.89[aout]")
open('filter.txt', 'w').write(";\n".join(fc))
base = args + ["-filter_complex_script", "filter.txt", "-map", "[vout]", "-map", "[aout]", "-c:v", "libx264", "-preset", "slow", "-b:v", "740k", "-passlogfile", "p2"]
run(base + ["-pass", "1", "-an", "-f", "mp4", "/dev/null"])
run(base + ["-pass", "2", "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", "final.mp4"])
print("built", total)
