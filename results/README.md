# results/

| File | Produced by | Contents |
|---|---|---|
| `realdata_audio_text.json` | `lebel_eval.py --tag audio_text` (Colab T4) | Final real-fMRI results: lag curve, encoding r per story and network, noise ceiling, forward identification, inversion of measured BOLD and oracle. |
| `realdata_audio.json` | `lebel_eval.py --tag audio` (CPU) | Same, audio features only. |
| `roi_sensitivity.json`, `sensitivity_maps.npz` | `roi_sensitivity.py` | Per-vertex modality sensitivity. |
| `roi_share_stats.json` | `roi_share_stats.py` | Network modality-share z-scores. |
| `roi_inversion.json`, `.log` | `roi_inversion.py` | Regional recovery vs size-matched random sets. |
| `roi_dimensionality.json` | `roi_dimensionality.py` | Participation ratios. |
| `demo_run.json`, `.log` | `demo_run.py` | Logged inversion used for the demo video. |
| `synth_*.json` | `synthetic_characterisation.py` | Written when you run the synthetic experiments; the original Colab numbers are tabulated in `docs/Methods_and_Results.md`. |
