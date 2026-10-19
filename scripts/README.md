# scripts/

Every script runs from this folder (`cd scripts`) and resolves paths relative to the repository root.
Environment overrides: `PROJECT_ROOT`, `TRIBE_WEIGHTS` (default `weights/`), `LEBEL_WORK` (default `data/lebel/`),
`ATLAS_DIR` (default `data/atlas/`), `RESULTS_DIR` (synthetic script only).

## Core

| File | What it does |
|---|---|
| `load_tribe.py` | Builds TRIBE v2 from `weights/config.yaml` + `best.ckpt` without the text pipeline. `make_fwd(net)` returns the forward map re-entered after `aggregate_features`, i.e. `f(x)` for `x` of shape (B, T, 1152). |
| `synthetic_characterisation.py` | All synthetic experiments of manuscript Sections IV-A to IV-E as sub-commands (`dissociation`, `inits`, `barrier`, `sensitivity`, `gain`, `noise`, `extent`, `priors`, `ridge`, `bandwidth`, `manifold`, `all`). `--quick` for a smoke test. |

## Regional analysis (Section IV-F)

| File | What it does |
|---|---|
| `roi_defs.py` | Six disjoint networks on fsaverage5 from the Destrieux atlas, in TRIBE v2's vertex order. |
| `roi_sensitivity.py` | Per-vertex forward sensitivity to perturbations confined to the text, audio and video slots of `x`. Writes `results/roi_sensitivity.json` and `sensitivity_maps.npz`. |
| `roi_share_stats.py` | Each network's modality share against 2 000 random vertex sets (z-scores). |
| `roi_inversion.py` | Inverts from each network's vertices alone vs size-matched random vertex sets (8 000 steps, checkpointed, resumable). |
| `roi_dimensionality.py` | Participation ratio of each network's responses to 128 random input directions. |

## Real fMRI (Section IV-G)

| File | What it does |
|---|---|
| `lebel_register.py` | ANTs SyN registration of UTS03's T1 to MNI152 (one-off; its result is baked into the shipped sampler). |
| `lebel_sampler.py` | Builds the sparse fsaverage5 ← functional-voxel sampling matrix (`data/lebel/pycx/sampler.npz`). |
| `lebel_apply.py` | Downloads UTS03's preprocessed responses from OpenNeuro and projects every story to fsaverage5 (detrend + z-score). |
| `lebel_features.py` | Stimulus representations through TRIBE v2's own extractors (w2v-BERT audio, Llama-3.2-3B text with TextGrid word timings). `--features audio` or `audio text`; `--chunk 30` halves CPU memory. |
| `lebel_eval.py` | Alignment, encoding r with noise ceiling, forward identification, inversion of measured BOLD with an oracle. |
| `lebel_project.py` | Legacy: earlier 4-D-warp projection (memory-hungry; superseded by the sampler). |
| `realdata_lebel.py` | Legacy: first version of the real-data pipeline (Colab, stage by stage). |

## Figures and demo

| File | What it does |
|---|---|
| `make_figures.py` | Synthetic-result figures from the logged Colab numbers. Set `FIGOUT` to change the output folder. |
| `make_roi_figs.py`, `make_brain_figs.py`, `make_topo_grid.py` | Regional figures and cortical maps. |
| `make_realdata_fig.py` | Real-data figure: `python make_realdata_fig.py audio_text`. |
| `demo_run.py` | Records one 2 400-step inversion (cosine and MSE every 40 steps) to `results/demo_run.json`. |
| `make_demo_video.py` | Renders that log into `demo/demo_inversion.mp4` (needs ffmpeg). |
| `demo_brain_run.py` | Records the multi-start inversion replayed by the interactive demo: three starts through frozen TRIBE v2 (2 400 steps), cortical maps and per-vertex R² every 120 steps, and a forward-only ridge test. Writes `results/demo_brain_run.json` and `results/demo_brain_maps.npz`. |
