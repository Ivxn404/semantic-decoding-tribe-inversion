# demo/

| File | What it is |
|---|---|
| `TRIBE_live_demo_offline.html` | The interactive live demo for the final review: ten scenes (question, TRIBE v2 data, why fMRI, method, a live inversion lab, a replay of a real TRIBE v2 run, findings, regions, real fMRI, take-away) with presenter notes (**N**) and keyboard stepping (**← →**). Self-contained; open in Chrome, no internet needed. |
| `DEMO_SCRIPT.md` | Minute-by-minute run-sheet, who says what, likely questions and fall-backs. |
| `demo_inversion.mp4` | One inversion through frozen TRIBE v2 (2 400 steps): recovery cosine and prediction error converging. Every frame is drawn from values logged by `scripts/demo_run.py`. |
| `demo_poster.png` | The final frame of that video. |
| `src/` | Sources of the demo page: `page.html`, `app.js`, `brain.js` (a small WebGL cortex renderer), `toy.js` (the in-browser encoder and Adam), `build.py` (assembles the page). |

The **Real run** scene replays `results/demo_brain_run.json` and `results/demo_brain_maps.npz`, written by `scripts/demo_brain_run.py`: three starts inverted together through frozen TRIBE v2 (2 400 steps, CPU), with cortical maps every 120 steps and a forward-only barrier test at the end.

The **Live lab** scene runs a small stand-in encoder (tanh layer with an ill-conditioned weight spectrum, haemodynamic smoothing, 240 outputs) in the browser so that the panel can change noise, observed cortex, start spread and priors and watch the effect immediately. The real-model version of the same experiment is `notebooks/Live_Demo.ipynb`.

Re-record the video locally: `cd scripts && python demo_run.py && python make_demo_video.py` (needs ffmpeg).
