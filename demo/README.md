# demo/

* `demo_inversion.mp4` — one inversion through frozen TRIBE v2 (2 400 steps): recovery cosine and prediction error converging, per-time-step recovery, and target vs predicted BOLD. Every frame is drawn from values logged by `scripts/demo_run.py`; nothing is simulated.
* `demo_poster.png` — the final frame.

Live version: open `notebooks/Demo_and_Synthetic.ipynb` in Colab and run Part A.
Re-record locally: `cd scripts && python demo_run.py && python make_demo_video.py` (needs ffmpeg).
