# Live demo run-sheet · Final review, 29 October 2026

Total: about 12 minutes of demo, plus questions. Two screens: the **interactive demo page** (works offline) and the **Colab live notebook** (real model on a T4 GPU).

## Before you walk in (do this the same morning)

1. Open `demo/TRIBE_live_demo_offline.html` in Chrome on the presenting laptop. It needs no internet; fonts fall back if offline. Press **N** once to check the presenter notes appear, then press N again to hide them.
2. Open `notebooks/Live_Demo.ipynb` in Colab, set **Runtime → T4 GPU**, run **Step 1**, restart the session, and run **Steps 2 and 3**. That leaves the slow installs and the 700 MB weight download done before the panel arrives. Keep the tab open.
3. Have `report/Report_Sarkar_Choudhuri_Project1.pdf` and the printed A3 poster ready as backup.
4. If the Colab GPU is unavailable, the demo page's **Real run** scene replays a run recorded on the real model, so nothing depends on Colab.

## The run

| # | Scene (press → to advance) | Who | Time | Do this | Say this |
|---|---|---|---|---|---|
| 1 | Question | Abhranil | 0:40 | Drag the brain to turn it | Encoders predict fMRI very well; we test whether that lets you read the meaning back. The colours are TRIBE v2's measured sensitivity to text, audio and video. |
| 2 | Data | Tanisha | 0:45 | Click CNeuroMod, then LeBel | Review II question 1: 25 people, 451.6 h for training; 695 more for testing only. UTS03 is a LeBel training subject, but the story we invert is TRIBE v2's own held-out test story. |
| 3 | Why fMRI | Tanisha | 0:50 | Click 32, then 128 electrodes | Review II question 2: detail, an encoder to invert, one inverse instead of two, MEG 32% vs EEG 67% error, open data. EEG wins on cost and speed, which matters for a product, not for this question. |
| 4 | Method | Abhranil | 0:35 | Point at the red dashed line | We found the one point where the input enters, re-entered there and froze all 177 M weights. Reproduces the release exactly. |
| 5 | Live lab | Abhranil | 1:30 | **Space** to run; then **Probe sensitivity**; then raise *Start spread* and run again; then raise *Measurement noise* | Error falls about a million-fold, recovery stops near 0.9: the dissociation. Equal fits, different answers: non-convex. The disagreement sits where the encoder barely responds. |
| 6 | Real run | Abhranil | 1:00 | **Play** | Same experiment on the real model, every frame logged: median vertex R² climbs to 0.995, but recovery stops near 0.5 and the three starts agree only 0.37–0.54. |
| — | Colab | Abhranil | 3:00 | Run **Step 4**, then **5** | The real model, live. Plots update every 50 steps. Barrier test and sensitivity probe use forward passes only. |
| 7 | Findings | Tanisha | 2:00 | One tab each | 28.4× vs +0.015 · 0.817 · barrier 3.8× (7.2× to a deeper minimum) · 2.1× · 0.918 vs 0.060. |
| 8 | Regions | Tanisha | 1:00 | Click Visual, then Somatomotor | Most responsive network is the worst to decode from (−0.125); the least responsive is the best (+0.102). Diversity of responses explains it (PR 18.6 vs 10.3). |
| 9 | Real fMRI | Abhranil | 1:00 | **Rank again**, then switch to *Noise-free oracle* | Encoding at 56% of the noise ceiling; 4 of 5 held-out segments identified among 45, cosine 0.02. Oracle 5 of 5 but only 0.22: the limit is the operator. |
| 10 | Take-away | Both | 0:30 | Leave the QR code on screen | Recoverability has to be measured, not assumed from predictivity. |

## Likely questions and where to point

| Question | Answer in one line | Show |
|---|---|---|
| What data was TRIBE v2 trained on? | Four 3T datasets, 25 subjects, 451.6 h, passive viewing/listening | Scene 2; report Table 4.1 |
| Why not EEG? | Five reasons; EEG adds a second inverse problem | Scene 3; report Section 4.1.3 |
| Is the non-convexity just a bad optimiser? | The barrier test uses forward passes only; recovery also saturates with budget | Scene 7, Barrier tab; Colab Step 5 |
| Is the information simply lost (a null space)? | No: along d the change grows faster than random at full distance | Scene 7, Barrier tab |
| Did TRIBE v2 see your test data? | No: wheretheressmoke is its own held-out test split | Scene 2 note; report Section 4.1.2 |
| Why invert x and not the raw audio? | The released pipeline is not differentiable before aggregation; raw-feature inversion is future work | Scene 4 |
| How much did it cost? | ₹0 compute (free Colab T4 and CPU); printing only | Report Chapter 11 |
| Can this read thoughts? | It identifies which of a known set of moments was heard; it does not reconstruct the representation | Scene 9 |
| What would you do next? | All eight LeBel subjects, per-network real-data test, priors matched to weak directions | Scene 10 |

## If something fails

* **Page brain is blank:** the browser has WebGL off. Use Chrome, or show the figures in Scene 7 and the poster.
* **Colab install error:** skip Colab; Scene 6 is the same experiment recorded on the real model.
* **Colab out of time:** lower `STEPS` in Step 4 to 600; the dissociation is already visible.
