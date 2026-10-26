# Project summary (authoritative; if a later section disagrees, this summary wins)

Title: Conditioning and Non-Convexity of Semantic Decoding by Inversion of Deep Brain Encoding Models.
Course: VIT Vellore, Project-I (BECE497J), B.Tech Electronics and Communication Engineering (specialisation in Biomedical Engineering), School of Electronics Engineering (SENSE).
Team: Abhranil Sarkar (23BML0077) and Tanisha Choudhuri (23BML0081), joint first authors. Guide: Dr. Sharmila Nageswaran (SENSE). Final review: 29 October 2026.
Repository: github.com/Ivxn404/semantic-decoding-tribe-inversion (code, results as JSON, two Colab notebooks: Live_Demo.ipynb and Verification_Tests.ipynb).
Outputs: IEEE-format manuscript, final report (46 pages), A3 poster, final slide deck, this interactive demo.
Cost: zero compute cost (free Colab T4 GPU and a laptop CPU); only printing.

## The question in one line
Brain encoding models such as Meta's TRIBE v2 predict fMRI responses very accurately. Everyone assumes that a good forward model can simply be run backwards to read out what a person heard or saw (decoding). We test that assumption by inverting TRIBE v2 and measuring how much of the stimulus representation comes back.

## Plain-language answer
A model can predict brain activity almost perfectly and still not let you recover the meaning. Prediction error falls about a million-fold but recovery stops near cosine 0.93-0.94; different starting points reach equally good fits that are different answers (non-convex, separate minima); the leftover error hides in directions the model barely responds to. On real fMRI you can identify which moment was heard, but you cannot reconstruct the representation.

## What TRIBE v2 is
Meta FAIR's tri-modal brain encoder (d'Ascoli et al., 2026). 177.21 million parameters. Input: text, audio and video features (from LLaMA 3.2, Wav2Vec-BERT and V-JEPA 2), aggregated into x with 32 time steps x 1,152 dimensions (three slots of 384: text | audio | video), 16 s per window. Output: predicted fMRI at 20,484 cortical vertices (fsaverage5) x 100 output steps.
Training data (Review II question 1): four public 3T datasets, 25 training subjects, 451.6 h of fMRI in 2,618 sessions; tested without retraining on 695 further subjects (1,117.7 h in all, 720 subjects). Datasets: CNeuroMod/Algonauts (4 people watching Friends and films, about 269 h), BOLD Moments (10 people, 3-s clips), LeBel 2023 (8 people listening to podcast stories), Wen (3 people, movie clips). Passive viewing/listening, healthy adults, no task.

## Method
The public pipeline is not differentiable end to end (speech synthesis, transcription and the three large feature extractors). The input enters the network at exactly one point, after aggregation into x. We re-enter there, freeze all 177 M weights and optimise only x: x-hat = argmin ||f(x) - y||^2. Our re-entry reproduces the released predictions exactly (r = 1.0000). Optimiser: Adam, learning rate 5e-2, cosine schedule, 16,000 to 32,000 steps; several random starts (initialisations). Recovery is measured as the cosine between x-hat and the true x (1 = identical).

## Why fMRI and not EEG (Review II question 2)
1. Spatial detail: about 2-3 mm resolution at 20,484 cortical vertices, against 32-128 scalp electrodes blurred over centimetres by the skull.
2. A model to invert: TRIBE v2 exists for fMRI; no open naturalistic EEG encoder of this scale exists.
3. One inverse, not two: EEG first needs source localisation, itself an ill-posed inverse problem.
4. Measured gap: the same typing decoder reaches 32% character error from MEG but 67% from EEG (Levy et al., 2025).
5. Open data: LeBel 2023 gives 85.8 h of story-listening fMRI; the open simultaneous EEG-fMRI dataset has no sustained speech.
Trade-off: EEG is cheaper, faster (milliseconds) and wearable, which matters for a product, not for measuring invertibility. The method transfers to EEG once an EEG encoder of this size exists.

## The synthetic ground truth (asked at review: how was it framed and why is it valid?)
Construction: x is built in TRIBE v2's own input space: 8 random unit directions in the 1,152-dimensional space, each with its own cosine time course (frequencies 2, 4, ..., 16 cycles per 32-step window), summed and scaled to unit standard deviation. Four seeds (ground truths 0-3); white noise as an off-manifold control. y = f(x) is computed with the real frozen model; x is then recovered from y alone.
Why it is correct: it is the standard known-answer test for inverse problems. We chose x, so the recovery error is exact, and the operator is the released model (r = 1.0000), so nothing about the brain is assumed.
Why it is representative: real story representations are also low-dimensional: participation ratio 4.9 +/- 2.1 for real stimuli (270 windows) vs 7.8 for ours and 30.2 for white noise; 84% of real variance lies in the top 8 directions; real scale s.d. 1.10 vs 1.00. White noise recovers like the structured truth (0.947 vs 0.942); a 64-fold change in speed of change leaves recovery 0.836-0.858 (no trend); results replicate over 4 seeds (agreement 0.894 +/- 0.003).
Direct check with a real stimulus as ground truth (16 s of the held-out story "wheretheressmoke", audio slot, 3,000 steps on CPU, not fully converged): recovery from blind starts 0.43-0.60 (a near-truth start reached 0.95), agreement between blind starts 0.19-0.56, barriers 11-21x between blind solutions, a deeper minimum near the truth with 2.8x lower error and a 54x barrier. Same picture, stronger: the synthetic truth is the conservative case. The sensitivity probe was inconclusive on real x because those fits had not converged.

## Five synthetic findings (exact ground truth)
1. Dissociation: encoding error falls 28.4x across budgets of 250 to 32,000 steps while recovery saturates at cosine 0.944; the final halving of error (5.65e-9 to 2.66e-9) buys only +0.015 recovery. Encoding accuracy does not certify decoding.
2. Non-convexity: 7 of 8 initialisations reach matched fit, yet the minimum pairwise cosine between fit-matched solutions is 0.817 +/- 0.007 over four ground truths. Equally good fits give different answers.
3. Barrier test (forward passes only, so it is not an optimiser artefact): on the straight path between two distinct, equally good blind fits, the error rises a median 4.8x in the middle (range 2.4-8.2x; 29 of 40 distinct pairs, 4 ground truths; near-identical pairs show 1.0-2.2x). Towards a deeper minimum near the truth the barrier is 8.1 +/- 3.2x (4.7-12.4x), and blind fits are 4.2 +/- 0.3x worse than near-truth fits. So these are separate minima, not a flat null space. (An earlier version of this test, 2.6x to 0.6x, was withdrawn because it paired an unconverged start.)
4. Sensitivity: the encoder's response along the difference between two solutions is 2.15 +/- 0.17x below the median of 200 random directions (1.68 +/- 0.17x along the actual error); 1.9x on the first ground truth. The error hides where the operator barely responds.
5. Conditioning: gain is identifiable (a 10% rescale gives 7.5x the residual floor); noise from 0 to 100% of BOLD s.d. lowers recovery 0.836 to 0.298 while retrieval stays about 0.99; 2,000 random vertices (10%) reach 0.777; generic priors hurt (l2 adds at most +0.032; temporal smoothness drops 0.527 to 0.0008); gradient inversion reaches 0.918 against 0.060 for the best ridge (linear) decoder, about 15x.

## Regions: predictable is not recoverable
Six anatomical networks (Destrieux atlas). Visual is the most responsive network (1.60x cortical mean sensitivity) yet decodes 0.125 worse than random vertex sets of the same size; somatomotor is the least responsive yet 0.102 better, beating the whole cortex at the same budget. Both are about ten times the control spread. Reason: somatomotor responses are diverse (participation ratio 18.6) while visual responses are concentrated in few directions (10.3).

## Real fMRI (LeBel et al. 2023, subject UTS03, held-out story "wheretheressmoke")
UTS03 is one of the eight LeBel training subjects, but the story we invert is TRIBE v2's own held-out test story, so the model never saw it. Alignment lag 4 s, fitted on five training stories. Encoding: top-2,000 vertices r = 0.478, 56% of the 0.859 noise ceiling, led by auditory and language networks. Forward identification of 20-s windows among 194: 59% correct against 0.5% chance. Inverting measured BOLD: the true 100-s segment ranks first for 4 of 5 held-out segments among 45 candidates (chance 2.2%), yet the recovered x has cosine only 0.02 to the true x. A noise-free oracle (inverting the model's own prediction) gets 5 of 5 but only cosine 0.22: most of the loss is the operator, not the scanner noise. Identification works; reconstruction does not.

## The live demo page
Scenes: Question (rotating brain coloured by sensitivity to text/audio/video), Data, Why fMRI, Method, Ground truth, Live lab (a small in-browser encoder with the same maths: run, change starts/spread/noise/observed cortex/l2 prior; the sensitivity panel fills in automatically after a run), Real run (replay logged from the real model: median vertex R^2 rises to 0.995 while recovery stops near 0.5 and starts agree only 0.37-0.54), Findings, Regions, Real fMRI, Take-away. Keys: left/right arrows move between scenes, N shows presenter notes, Space runs the live lab.

## Limitations and next steps
Limitations: one subject and one story for the real-data test; inversion of x rather than raw audio (the pipeline is not differentiable before aggregation); synthetic truth in the model's input space; CPU budget for the real-x check. Next: all eight LeBel subjects and a per-network real-data test; optimisers and priors matched to the operator's weak directions, restarts and ensembling; inverting raw extractor features with an explicit haemodynamic model; the same test on EEG/MEG encoders once they exist.

## Novelty
A literature search (9 October 2026; arXiv, Google Scholar, web) found no published inverse or identifiability analysis of a deep foundation brain encoder. Closest: Gardner & Liu 2019 (linear inverted encoding models, recovery only up to an invertible linear transform), Tang et al. 2023 (semantic decoding with a linear encoder, no uniqueness test), two 2026 TRIBE v2 follow-ups (Bladon & Bent: feature visualisation; Benchetrit et al.: synthetic fMRI for decoder training) that do not analyse the inverse.
