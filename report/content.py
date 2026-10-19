"""Body of the Project-I final report. Markup: **bold**, [@key] or [@a,b] citations.
Blocks: ("h1", text) chapter (new page) · ("h2", text) · ("h3", text) · ("p", text) · ("bul", [items]) · ("num", [items])
("fig", file, caption, width_in) · ("tab", caption, header, rows, col_widths_in) · ("eq", text)"""
import os
_R = os.path.dirname(os.path.abspath(__file__))
F = os.path.join(os.path.dirname(_R), "figures") + "/"
A = os.path.join(_R, "assets") + "/"

TITLE = "Conditioning and Non-Convexity of Semantic Decoding by Inversion of Deep Brain Encoding Models"

EXEC_SUMMARY = (
    "Brain encoding models now predict fMRI responses to natural stimuli with high accuracy, and decoding meaning from brain activity is often assumed "
    "to follow. This project tests that assumption directly by inverting TRIBE v2, Meta's open-weight 177-million-parameter trimodal brain encoder, "
    "by gradient descent on its 1 152-dimensional stimulus representation. A differentiable entry point after feature aggregation was identified, "
    "and the inverse was characterised with exact synthetic ground truth and then on real fMRI from a held-out story (LeBel et al., 2023). "
    "Encoding error fell 28.4-fold while recovery saturated at cosine 0.944. Equally good fits from different starting points disagreed "
    "(minimum pairwise cosine 0.817), and forward-only tests showed barriers between solutions rather than a null space: the inverse is non-convex "
    "and its errors lie in the operator's least-sensitive directions. Across six cortical networks, the most responsive (visual) was the hardest to "
    "decode from and the least responsive (somatomotor) the easiest. On real fMRI, inversion identified the heard segment in 4 of 5 cases among 45 "
    "(chance 2.2%) while recovering little of the representation (cosine 0.02). Encoding accuracy does not certify decoding: recoverability must be measured."
)

ACK = [
    "We express our sincere gratitude to our guide, Dr. Sharmila Nageswaran, Associate Professor, School of Electronics Engineering (SENSE), VIT Vellore, for her guidance, encouragement and critical feedback at every stage of this project.",
    "We thank the Dean and the Head of the Department, School of Electronics Engineering, and the members of the review panels for their suggestions, which shaped the final form of this work, in particular the questions on the data behind the TRIBE v2 model and on the choice of fMRI over EEG.",
    "We thank Meta FAIR for releasing the TRIBE v2 model and code openly, the authors of the LeBel et al. natural-language fMRI dataset for making their data public on OpenNeuro, and the developers of the open-source tools on which this work depends.",
    "Finally, we thank our families and friends for their constant support.",
]

ABBR = [
    ("BCI", "Brain–Computer Interface"), ("BIDS", "Brain Imaging Data Structure"), ("BOLD", "Blood-Oxygen-Level-Dependent (signal)"),
    ("CER", "Character Error Rate"), ("CNeuroMod", "Courtois Project on Neuronal Modelling"), ("DMN", "Default Mode Network"),
    ("EEG", "Electroencephalography"), ("FAIR", "Findable, Accessible, Interoperable, Reusable"), ("fMRI", "functional Magnetic Resonance Imaging"),
    ("GPU", "Graphics Processing Unit"), ("HCP", "Human Connectome Project"), ("HRF", "Haemodynamic Response Function"),
    ("IEM", "Inverted Encoding Model"), ("LLM", "Large Language Model"), ("MEG", "Magnetoencephalography"),
    ("MNI", "Montreal Neurological Institute (template space)"), ("MSE", "Mean Squared Error"), ("PR", "Participation Ratio"),
    ("ROI", "Region of Interest"), ("SDG", "Sustainable Development Goal"), ("TR", "Repetition Time"),
    ("TRIBE", "TRImodal Brain Encoder"), ("WK / WP", "Knowledge profile / Problem attribute (Washington Accord)"),
]

SYMBOLS = [
    ("x", "Aggregated stimulus representation, x ∈ ℝ^(T×H), T = 32 (synthetic) or 200 (real), H = 1 152"),
    ("x̂", "Representation recovered by inversion"),
    ("f(·)", "Frozen TRIBE v2 forward operator from x to predicted fMRI"),
    ("y", "Observed or target cortical response, y ∈ ℝ^(V×T′), V = 20 484, T′ = 100"),
    ("d", "Difference between two fit-matched solutions"),
    ("s(v)", "Directional sensitivity of f along unit direction v"),
    ("ε", "Finite-difference step size"),
    ("λ", "Regularisation weight"),
    ("r", "Pearson correlation coefficient"),
    ("α", "Gain (rescaling) factor applied to x"),
]

BODY = [
    # ======================================================================= 1
    ("h1", "1. INTRODUCTION"),
    ("p", "A brain encoding model predicts the brain response that a stimulus evokes; decoding runs the other way, from measured brain activity back to the stimulus. For fifteen years the dominant route to decoding has been through encoding: fit a forward model, then identify or reconstruct the stimulus whose predicted response best matches what was measured [@naselaris2011,kay2008]. Encoding models have since grown from linear maps on hand-built features [@mitchell2008,huth2016] to deep networks trained on hundreds of hours of fMRI, and their accuracy keeps improving with model size and data [@antonello2023,tribev2]."),
    ("p", "Decoding meaning from non-invasive brain recordings matters clinically. Amyotrophic lateral sclerosis, brainstem stroke, locked-in syndrome and severe aphasia can leave comprehension intact while removing speech and writing. A non-invasive decoder would restore a communication channel without neurosurgery. It also raises ethical questions of mental privacy, so the limits of what can be decoded matter as much as the successes."),
    ("p", "This project asks a question that the field has largely skipped: when an encoder becomes very accurate, does it become invertible? A forward model can be highly predictive and still have an inverse that is non-unique or unstable [@hadamard1902,hansen2010]. The question became answerable in 2026, when Meta released TRIBE v2, an open-weight foundation encoder that predicts fMRI at 20 484 cortical locations from video, audio and language [@tribev2]."),
    ("h2", "1.1 Literature Review"),
    ("p", "**Encoding models.** Mitchell et al. predicted fMRI responses to nouns from word co-occurrence statistics [@mitchell2008]; Huth et al. mapped semantic selectivity across the whole cortex during natural speech [@huth2016]; and Antonello et al. showed that encoding accuracy with language-model features rises log-linearly with model size [@antonello2023]. TRIBE won the Algonauts 2025 challenge [@tribe1,gifford2025] and TRIBE v2 extends it to a foundation model trained on 451.6 h of fMRI and evaluated on 1 117.7 h from 720 subjects [@tribev2]."),
    ("p", "**Decoding.** Kay et al. identified which image a person was viewing by comparing measured responses with responses predicted for candidate images [@kay2008]. Tang et al. reconstructed continuous language from fMRI by searching word sequences with a language model and scoring them with an encoder [@tang2023]. With MEG and EEG, contrastive decoders identify perceived speech segments [@defossez2023], and Brain2Qwerty decoded typed sentences with a 32% character error rate from MEG but 67% from EEG with the same architecture [@levy2025]. Shared-subject models reduce the data each subject needs for image reconstruction [@scotti2024]. All of these evaluate decoding by proxies such as rank, retrieval or word error, because the true representation behind real fMRI is unknown."),
    ("p", "**Inverting encoders.** Inverted encoding models reconstruct channel responses from voxel patterns [@brouwer2009]. Gardner and Liu proved that such linear models recover the stimulus only up to an invertible linear transform [@gardner2019]. In computer vision, inverting deep networks from their activations shows which information each layer keeps [@mahendran2015]. Two 2026 follow-ups use TRIBE v2: Bladon and Bent optimise inputs to maximise a region's predicted response (feature visualisation) [@bladon2026], and Benchetrit et al. use TRIBE v2 forwards to synthesise training data for image decoders [@benchetrit2026]."),
    ("tab", "Summary of the literature most relevant to this project", ["Work", "Contribution", "Limitation relevant here"], [
        ["Mitchell et al., 2008", "Linear model predicts fMRI for unseen nouns", "Single words, hand-built features"],
        ["Kay et al., 2008", "Identifies viewed images via predicted responses", "Identification, not recovery"],
        ["Naselaris et al., 2011", "Encoding models as the route to decoding", "Assumes invertibility"],
        ["Huth et al., 2016", "Semantic maps across cortex from natural speech", "Linear; no inverse analysis"],
        ["Antonello et al., 2023", "Encoding accuracy scales with model size", "Scaling shown for encoding only"],
        ["Tang et al., 2023", "Continuous language from fMRI via LM search", "Per-subject decoder; search, not inversion"],
        ["Gardner & Liu, 2019", "Linear IEMs identifiable only up to a transform", "Linear models only"],
        ["Lévy et al., 2025", "Typed sentences from MEG (CER 32%) and EEG (67%)", "Shows EEG's limits for language"],
        ["d'Ascoli et al., 2026 (TRIBE v2)", "Open foundation encoder, 720 subjects", "Encoder only; inverse never studied"],
        ["Bladon & Bent; Benchetrit et al., 2026", "Feature visualisation; synthetic training data", "Neither tests uniqueness of the inverse"],
    ], [1.75, 2.45, 2.0]),
    ("h2", "1.2 Research Gap"),
    ("p", "Encoders keep improving, decoders are trained separately and judged by proxies, and the inverse of a deep encoder has never been characterised: no study measures whether its solution is unique, how it is conditioned, or which parts of cortex carry recoverable information. A literature search on 9 October 2026 (arXiv, Google Scholar, general web; queries combining “TRIBE v2”, invert / inversion / identifiability / conditioning / non-convex and “brain encoding model”) found no published inverse or identifiability analysis of a deep foundation brain encoder. Table 1.2 places the closest work against the four properties this project combines."),
    ("tab", "Novelty: closest prior work against the four properties combined here (● yes, ○ no)", ["Study", "Nonlinear deep encoder", "Optimises encoder input", "Tests uniqueness / conditioning", "Region-wise recoverability"], [
        ["Kay et al., 2008", "○", "○", "○", "○"], ["Gardner & Liu, 2019", "○", "●", "●", "○"], ["Tang et al., 2023", "○", "●", "○", "●"],
        ["TRIBE v2, 2026", "●", "○", "○", "○"], ["Bladon & Bent, 2026", "●", "●", "○", "○"], ["Benchetrit et al., 2026", "●", "○", "○", "○"],
        ["This work", "●", "●", "●", "●"],
    ], [2.2, 1.0, 1.0, 1.1, 1.0]),
    ("h2", "1.3 Problem Statement"),
    ("p", "Characterise semantic decoding from fMRI as the inverse of a frozen, differentiable deep brain encoder (TRIBE v2): measure whether the inverse is unique, how it is conditioned, and where in cortex the stimulus representation is recoverable, first with exact synthetic ground truth and then on real naturalistic fMRI."),
    # ======================================================================= 2
    ("h1", "2. RESEARCH OBJECTIVE"),
    ("num", [
        "Formulate semantic decoding as inversion of a frozen brain encoding operator and locate the point in the TRIBE v2 pipeline where the operator becomes differentiable.",
        "Build a synthetic framework with exact ground truth, so that recovery error is measured exactly rather than through proxies.",
        "Characterise the inverse with respect to optimisation budget, measurement noise, cortical extent, temporal rate of change and regularising priors.",
        "Discriminate the causes of incomplete recovery: information loss (a null space), non-convexity, an optimiser artefact, or unidentifiable gain.",
        "Benchmark gradient inversion against a linear decoder and map recoverability across six anatomical cortical networks.",
        "Validate on real naturalistic fMRI (LeBel et al., 2023) with a held-out story, using text and audio features.",
    ]),
    ("p", "All six objectives were achieved. Their evidence is presented in Chapter 8 and summarised in Chapter 9."),
    # ======================================================================= 3
    ("h1", "3. RELEVANCE OF PROBLEM STATEMENT W.R.T SDG"),
    ("tab", "Mapping to specific SDG targets", ["SDG target", "Link to this project", "Evidence from this project"], [
        ["SDG 3, Target 3.4 (promote mental health and well-being)", "People with ALS, brainstem stroke or locked-in syndrome often keep comprehension but lose speech; non-invasive decoding could restore communication", "Quantitative limits on what fMRI decoding can and cannot recover tell clinicians what to expect"],
        ["SDG 9, Target 9.5 (enhance research, upgrade technological capability)", "Methodological contribution to neural-interface engineering with open models and data", "Fully reproducible pipeline on free compute; public code, results and notebooks"],
        ["SDG 10, Target 10.2 (inclusion irrespective of disability)", "Communication access is a precondition for social and economic inclusion", "Identifies which approaches are worth pursuing for assistive communication"],
    ], [1.8, 2.3, 2.1]),
    ("p", "The scope is stated honestly: this is enabling research, not a deployed assistive device. Its contribution to these targets is evidence about what non-invasive semantic decoding can achieve and what limits it."),
    # ======================================================================= 4
    ("h1", "4. PROPOSED SYSTEM"),
    ("p", "The proposed system treats a published brain encoder as a measurement device whose inverse is to be characterised. Figure 4.1 shows the complete pipeline."),
    ("fig", A + "pipeline.png", "Inversion pipeline: the network is re-entered after feature aggregation; only the representation x is optimised, the network stays frozen", 6.2),
    ("h2", "4.1 Design Approach / Materials & Methods"),
    ("h3", "4.1.1 The forward operator: TRIBE v2"),
    ("p", "TRIBE v2 [@tribev2] maps a multimodal stimulus representation x ∈ ℝ^(T×1152), made of text, audio and video slots of 384 dimensions each sampled at 2 Hz, to a predicted response at V = 20 484 vertices of the fsaverage5 cortical surface [@fischl1999], 100 output steps at 1 Hz. The network has 177.21 M parameters: a transformer encoder (127.47 M), a low-rank head (1 152 → 2 048), a subject-layer predictor (41.97 M) and a temporal pooler. The public release ships a single averaged “unseen subject” layer. All weights are frozen in this work."),
    ("h3", "4.1.2 What TRIBE v2 was trained on"),
    ("p", "Because every conclusion depends on the encoder, it matters what data it learned from. TRIBE v2 was trained on four public datasets totalling 25 healthy adults and 451.6 hours of 3T fMRI, recorded while participants passively watched or listened to naturalistic stimuli with no task (Table 4.1). The figures come from Table 1 of the TRIBE v2 paper [@tribev2] and the study definitions shipped with its code."),
    ("tab", "TRIBE v2 training data: who was scanned and what they were exposed to", ["Dataset", "What participants did in the scanner", "Subjects", "Sessions", "fMRI (h)", "TR (s)"], [
        ["CNeuroMod / Algonauts 2025 [@gifford2025]", "Watched the sitcom Friends (seasons 1–6) and four feature films; video, audio and dialogue", "4", "1 408", "268.7", "1.49"],
        ["BOLD Moments [@lahner2024]", "Watched 1 102 three-second naturalistic video clips (1 000 training clips; 102 test clips repeated 10 times)", "10", "520", "61.9", "1.75"],
        ["LeBel et al. 2023 [@lebel2023]", "Listened to spoken autobiographical stories (podcasts); 82 stories for three subjects, 26–27 for the others", "8", "432", "85.8", "2.0"],
        ["Wen et al. 2018 [@wen2018]", "Watched natural movie clips in 8-minute segments; test segments repeated 10 times", "3", "258", "35.2", "2.0"],
        ["Training total", "All 3T, passive viewing or listening", "25", "2 618", "451.6", "—"],
    ], [1.5, 2.55, 0.6, 0.65, 0.6, 0.5]),
    ("p", "The model was then evaluated, without further training, on four datasets it had never seen (Table 4.2), bringing the total to 720 subjects, 5 094 sessions and 1 117.7 hours of fMRI [@tribev2]."),
    ("tab", "TRIBE v2 evaluation data (never used for training)", ["Dataset", "Stimuli", "Scanner", "Subjects", "fMRI (h)"], [
        ["NNDb (Aliko et al., 2020)", "Full-length films (audio, video, text)", "3T", "86", "160.6"],
        ["Le Petit Prince (Li et al., 2022)", "Audiobook (audio, text)", "3T", "112", "180.2"],
        ["Narratives (Nastase et al., 2021)", "Spoken stories (audio, text)", "3T", "321", "146.6"],
        ["HCP (Van Essen et al., 2013)", "Movie clips (audio, video, text)", "7T", "176", "178.7"],
        ["Evaluation total", "", "", "695", "666.1"],
    ], [2.1, 2.2, 0.7, 0.7, 0.7]),
    ("p", "Two consequences for this project follow. First, our real-data subject (UTS03) is one of the eight LeBel training subjects, but the story we test on, wheretheressmoke, is TRIBE v2's own held-out test split, so the encoder never saw the responses we invert. Second, because the release averages subjects, we invert the population model rather than a subject-specific one."),
    ("h3", "4.1.3 Why fMRI and not EEG"),
    ("p", "EEG is cheaper, portable and has millisecond resolution, so the choice of fMRI needs justification. It rests on five points (Table 4.3). (1) Spatial detail: fMRI resolves millimetre-scale cortical patterns at 20 484 vertices [@logothetis2008], while 32–128 scalp electrodes see a spatially blurred mixture because of volume conduction. (2) A foundation encoder to invert exists only for fMRI; no open whole-brain encoder of naturalistic EEG at comparable scale exists. (3) Decoding through EEG would add a second ill-posed inverse problem, source localisation [@michel2004], in front of the one this project studies. (4) Empirically, the same decoder reaches a 32% character error rate from MEG but 67% from EEG [@levy2025]. (5) Open naturalistic language data with fMRI is plentiful (LeBel: 85.8 h), whereas the open simultaneous EEG–fMRI dataset contains rest, an abstract animation and short movie clips but no sustained speech [@telesford2023]; this ruled out the EEG–fMRI fusion option considered in Report I."),
    ("tab", "fMRI versus EEG for this project", ["Criterion", "fMRI (this work)", "EEG"], [
        ["Spatial detail", "≈2–3 mm voxels; 20 484 cortical vertices", "32–128 scalp channels; centimetre-scale, blurred"],
        ["Foundation encoder to invert", "TRIBE v2: 177 M parameters, 1 117.7 h, 720 subjects", "None at comparable scale"],
        ["Number of inverse problems", "One: response → representation", "Two: scalp → sources (ill-posed) → representation"],
        ["Measured language decoding", "Continuous language from fMRI [@tang2023]", "67% character error vs 32% with MEG [@levy2025]"],
        ["Open naturalistic language data", "LeBel 2023: 8 subjects, 85.8 h", "No open EEG–fMRI set with sustained speech [@telesford2023]"],
        ["Temporal resolution", "1.5–2 s samples, ≈5 s haemodynamic lag (cost)", "Milliseconds (advantage)"],
        ["Cost and portability", "Scanner-bound (cost)", "Wearable, low cost (advantage)"],
    ], [1.6, 2.3, 2.3]),
    ("p", "EEG's advantages matter for a deployed device, not for measuring how invertible an encoder is. The method developed here transfers to EEG once an EEG encoder of comparable scale exists."),
    ("h3", "4.1.4 Inversion method"),
    ("p", "The public TRIBE v2 inference path is not differentiable end to end: stimuli pass through speech synthesis, transcription and frozen feature extractors, and prediction runs under PyTorch's inference mode. Inspection of the forward pass showed that the input batch is consumed at one point only, the aggregation of extractor features into x; everything after it is tensor arithmetic. We therefore take x as the free variable and re-enter the network at that boundary, f(x) = pool(predictor(head(encoder(x)))). Gradients reach every entry of x (‖∂y/∂x‖ = 7.97 × 10³, no zero entries), and re-entering at this boundary reproduces the released model's predictions exactly (r = 1.0000). The representation is recovered by"),
    ("eq", "x̂ = argmin_x ‖f(x) − y‖² + λ R(x)                                        (4.1)"),
    ("p", "using Adam [@kingma2015] with learning rate 5 × 10⁻² and cosine annealing over the step budget, initialisation 0.01·N(0, I), and R an ℓ₂ or temporal-smoothness penalty where tested (λ = 0 otherwise). On real fMRI, where the scale and offset of the measured response are arbitrary, the loss is one minus the Pearson correlation over time, averaged over observed vertices."),
    ("h2", "4.2 Codes and Standards"),
    ("tab", "Standards and frameworks the project follows", ["Standard / framework", "Scope", "How this project aligns"], [
        ["BIDS [@gorgolewski2016]", "Neuroimaging data organisation", "Real data from OpenNeuro ds003020, a BIDS dataset"],
        ["IEEE P2731 [@p2731]", "Unified BCI terminology (functional model)", "Pipeline described as acquisition → features → decoding → output"],
        ["IEEE P2794 (draft)", "Reporting standards for in-vivo neural interface research", "Report states model, data, preprocessing, metrics and failures"],
        ["FAIR principles [@wilkinson2016]", "Findable, accessible, interoperable, reusable research outputs", "Seeded scripts, logged results, public code and notebooks"],
        ["OECD Recommendation [@oecd2019]; UNESCO Recommendation [@unesco2025]", "Responsible innovation and ethics of neurotechnology", "Mental-privacy implications discussed; no new human data collected"],
        ["Licences", "TRIBE v2 (CC BY-NC 4.0), Llama 3.2 licence, OpenNeuro data", "Non-commercial academic use; gated access obtained"],
    ], [1.6, 2.1, 2.5]),
    ("h2", "4.3 Constraints, Alternatives and Tradeoffs"),
    ("p", "Report I compared three solutions: an end-to-end supervised decoder (needs large per-subject training data and gives little insight into why decoding fails), inversion of a pretrained encoder (selected), and a simultaneous EEG–fMRI fusion decoder (blocked by the lack of open simultaneous data with sustained language). The main constraints and the trade-offs taken are listed in Table 4.5."),
    ("tab", "Constraints and the trade-offs adopted", ["Constraint", "Effect", "Trade-off adopted"], [
        ["No local GPU", "Large models cannot run on the team's laptops", "Free Colab T4 for GPU work; CPU for regional analysis; Llama in half precision"],
        ["12 GB RAM / 15 GB GPU on Colab", "Llama-3.2-3B and w2v-BERT cannot be loaded together", "One story per process; audio and text features in separate passes"],
        ["Released pipeline not differentiable", "Raw stimuli cannot be optimised", "Invert the aggregated representation x (one stage after the extractors)"],
        ["No ground truth in real fMRI", "Recovery error cannot be measured directly", "Exact synthetic evaluation, plus identification with a known chance level"],
        ["Only an averaged subject layer released", "No per-subject analysis", "Invert the population model; state as a limitation"],
        ["Synthetic x in a random subspace", "Absolute values may not transfer", "Real-data validation confirms the qualitative pattern"],
    ], [1.7, 2.1, 2.4]),
    # ======================================================================= 5
    ("h1", "5. PROJECT DESCRIPTION"),
    ("p", "The project was carried out in five stages, each building on the previous one."),
    ("h2", "5.1 Instrumentation of the encoder"),
    ("p", "TRIBE v2 was loaded directly from its configuration and checkpoint, bypassing the text-to-speech and transcription pipeline. The forward map was rebuilt from the aggregation boundary (encoder, low-rank head, predictor, pooler), gradient flow to x was verified, and the rebuilt map was checked against the released predictions on real stimuli (r = 1.0000)."),
    ("h2", "5.2 Synthetic evaluation with exact ground truth"),
    ("p", "Ground-truth trajectories (T = 32 time steps) were drawn in a random 8-dimensional subspace of ℝ^1152 with smooth temporal variation (two cosine cycles), or as white noise as an off-manifold control. The target is y = f(x), so recovery error is known exactly. Recovery is the mean per-time-step cosine between x̂ and x; relative error, encoding error and retrieval rank among other time steps are also reported. Directional sensitivity along a unit direction v is a finite-difference probe of the Jacobian:"),
    ("eq", "s(v) = ‖f(x + εv) − f(x)‖ / ε                                                    (5.1)"),
    ("h2", "5.3 Discriminating the causes of incomplete recovery"),
    ("p", "Four explanations were tested, each with a signature that would appear if it were true. (H1) Information loss: fit-matched solutions differ along a null-space direction the operator ignores. (H2) Non-convexity: distinct minima at equal fit, separated by a barrier. (H3) Optimiser artefact: recovery keeps rising with budget. (H4) Unidentifiable gain: a rescaled x gives the same output. Inversions were started from eight initialisation distributions and compared only when within 2× of the best fit, so under-converged runs could not pose as alternative solutions; the analysis was replicated over four ground truths. For two fit-matched solutions with difference d, a null space predicts that moving along d changes f far less than a random direction of the same length at every scale; a barrier predicts the advantage shrinks and reverses. These tests use forward passes only and do not depend on the optimiser."),
    ("h2", "5.4 Regional analysis"),
    ("p", "Six disjoint networks were defined on fsaverage5 from the Destrieux atlas [@destrieux2010] (Figure 8.10): left language network [@fedorenko2024] (1 282 vertices), its right-hemisphere homologue (1 368), auditory cortex (277), default-mode network [@buckner2008] (1 224), visual cortex (1 582) and somatomotor cortex (1 487) as a low-semantic control. For each network we measured forward sensitivity per input modality against 2 000 random vertex sets of equal size, recovery when only that network is observed (8 000 steps) against size-matched random vertex sets with a second random seed as the control spread, and the participation ratio [@gao2017] of its responses to 128 random input directions."),
    ("h2", "5.5 Real-fMRI validation"),
    ("p", "**Data.** Subject UTS03 of the LeBel et al. corpus [@lebel2023] (OpenNeuro ds003020): six stories, 66.6 minutes of speech, 10 363 words, TR 2 s. The held-out story wheretheressmoke is the mean of ten repeats; the other five stories are used for every tuning choice."),
    ("p", "**Surface projection.** The authors' preprocessed responses (95 556 cortical voxels) were mapped to fsaverage5 with TRIBE v2's own projector settings: a 3-mm ball of 20 points around each mid-cortical vertex, trilinear weights inside the cortical mask. Vertices were carried from MNI space to the subject's T1 by an ANTs SyN registration [@avants2008] and into functional voxels by the pycortex transform [@gao2015], giving a sparse 20 484 × 95 556 sampling matrix; the series were then detrended and z-scored. Validation: the left–right homotopic correlation was 0.635 against −0.017 for heterotopic pairs (above 97% of alternative pairings), and a scrambled-vertex control fell to chance."),
    ("p", "**Features and alignment.** Stimulus features came from TRIBE v2's own pipeline with the dataset's word timings: w2v-BERT 2.0 for audio [@chung2021] and Llama-3.2-3B for text [@grattafiori2024], grouped into 100-s segments (45 across six stories). The offset between model time and BOLD was the lag maximising prediction–response correlation on the five training stories; the 2 000 analysis vertices were those best predicted on the training stories."),
    ("p", "**Evaluation.** (i) Encoding accuracy per vertex on the held-out story, against a split-half noise ceiling from the ten repeats. (ii) Forward identification: each 20-s window of held-out BOLD matched to predictions for all 194 windows of the six stories. (iii) Inversion: each held-out 100-s segment inverted from measured BOLD, and x̂ ranked against the true representations of all 45 segments (chance 1/45). (iv) An oracle that inverts the model's own noise-free prediction under the same budget, separating the operator's conditioning from measurement noise."),
    # ======================================================================= 6
    ("h1", "6. HARDWARE/SOFTWARE TOOLS USED"),
    ("tab", "Hardware and software", ["Category", "Tool", "Use in this project"], [
        ["Compute (GPU)", "Google Colab, NVIDIA T4 (15 GB), 12 GB RAM", "Synthetic characterisation; real-data text + audio features and inversion"],
        ["Compute (CPU)", "Linux workstation / cloud CPU", "Regional analysis, surface projection, audio-only real-data run, figures"],
        ["Deep learning", "PyTorch [@paszke2019], HuggingFace Transformers and Hub", "Autograd through the frozen encoder; Llama-3.2-3B and w2v-BERT"],
        ["Encoder", "TRIBE v2 code and weights (Meta FAIR)", "Frozen forward operator"],
        ["Neuroimaging", "nilearn [@abraham2014], nibabel, ANTsPy, pycortex transforms", "Atlas, surfaces, registration, surface projection"],
        ["Scientific Python", "NumPy, SciPy, scikit-learn, h5py, pandas, Matplotlib", "Analysis, ridge baseline, data I/O, figures"],
        ["Data", "OpenNeuro ds003020 (LeBel et al. 2023)", "Real naturalistic fMRI"],
        ["Documentation", "GitHub, Colab notebooks, PowerPoint, Word", "Code release, reproducibility, reviews and reports"],
    ], [1.3, 2.3, 2.6]),
    ("p", "No hardware was built: the project is computational. All code, results and notebooks are public at github.com/Ivxn404/semantic-decoding-tribe-inversion (Appendix A)."),
    # ======================================================================= 7
    ("h1", "7. SCHEDULE AND MILESTONES"),
    ("tab", "Schedule and milestones", ["Stage", "Activity", "Period (2026)", "Outcome"], [
        ["S1", "Literature review and problem formulation", "Aug", "Scoped problem statement (Review I)"],
        ["S2", "Model instrumentation; inversion boundary", "Aug – Sep", "Working differentiable inverse"],
        ["S3", "Synthetic characterisation (budget, noise, extent, priors)", "Sep", "Dissociation and conditioning results"],
        ["S4", "Controls and hypothesis tests", "Sep – Oct", "Non-convexity shown; null space rejected (Review II)"],
        ["S5", "Regional analysis on six networks", "Oct", "Predictable-vs-recoverable dissociation"],
        ["S6", "Real-fMRI validation (LeBel 2023)", "Oct", "Identification on a held-out story (Review III)"],
        ["S7", "Manuscript, report, poster, code release", "Oct", "IEEE-format manuscript; public repository; final review"],
    ], [0.5, 2.6, 1.0, 2.1]),
    ("p", "Reviews: Review I (problem and plan), Review II on 14 October 2026 (40% milestone), Review III (60–70% milestone), and the final review with poster, viva and demonstration on 29 October 2026."),
    # ======================================================================= 8
    ("h1", "8. RESULT ANALYSIS"),
    ("h2", "8.1 Encoding accuracy does not certify decoding"),
    ("p", "Independent inversions at budgets from 250 to 32 000 steps show encoding error falling 28.4-fold while recovery saturates (Figure 8.1, Table 8.1). The final halving of encoding error (5.65 × 10⁻³ → 2.66 × 10⁻³) buys only +0.015 in recovery cosine. Forward accuracy and decodability are separate quantities."),
    ("fig", F + "fig_dissociation.png", "Encoding error against recovery cosine across independent step budgets", 5.6),
    ("tab", "Encoding error and recovery across optimisation budgets", ["Steps", "Encoding relative error", "Recovery cosine"], [
        ["250", "7.546 × 10⁻²", "0.0505"], ["500", "6.043 × 10⁻²", "0.1081"], ["1 000", "5.098 × 10⁻²", "0.2374"], ["2 000", "4.073 × 10⁻²", "0.4529"],
        ["4 000", "2.733 × 10⁻²", "0.6708"], ["8 000", "1.380 × 10⁻²", "0.8362"], ["16 000", "5.649 × 10⁻³", "0.9282"], ["32 000", "2.658 × 10⁻³", "0.9436"],
    ], [1.5, 2.2, 2.0]),
    ("h2", "8.2 Equally good fits give different answers"),
    ("p", "At 16 000 steps, seven of eight initialisations reached matched fit (2.52–2.96 × 10⁻⁷; one was excluded at 3.4× the best fit). Their mean pairwise cosine was 0.927, minimum 0.835, and mean cosine to the truth 0.914. The effect replicated across four ground truths with the same worst pair each time (Figure 8.2, Table 8.2); recovered norm ratios clustered by initialisation to within about 0.01, so distinct solutions are reached systematically, not by chance."),
    ("fig", F + "fig_nonconvex.png", "Agreement among fit-matched solutions across four ground truths (left) and fit versus recovery per initialisation (right)", 6.2),
    ("tab", "Agreement among fit-matched solutions, four ground truths, 14 000 steps", ["Ground truth", "Best fit (MSE)", "Mean pairwise cosine", "Min pairwise cosine"], [
        ["0", "3.51 × 10⁻⁷", "0.893", "0.807"], ["1", "3.65 × 10⁻⁷", "0.893", "0.815"], ["2", "3.11 × 10⁻⁷", "0.901", "0.826"], ["3", "3.13 × 10⁻⁷", "0.900", "0.819"],
        ["Mean ± SD", "", "0.897 ± 0.004", "0.817 ± 0.007"],
    ], [1.3, 1.6, 1.7, 1.7]),
    ("h2", "8.3 Barriers, not a null space"),
    ("p", "Moving a solution along the difference d to another fit-matched solution changed the prediction less than a random direction at small scales (2.6× less at 0.1 of the separation) but more at the full separation (0.6×; Figure 8.3, Table 8.3). A null space would keep d cheap at every scale, so the information-loss hypothesis is rejected: the solutions are distinct minima separated by a barrier. The advantage of d was also local, falling from 2.0× at its own trajectory to 1.0–1.1× at unrelated ground truths."),
    ("fig", F + "fig_nullspace_test.png", "Prediction change along the solution difference d relative to random directions of equal length", 4.8),
    ("tab", "Prediction change along d against random directions", ["Scale (fraction of separation)", "MSE along d", "MSE random (median)", "Random / d"], [
        ["0.10", "9.31 × 10⁻⁷", "2.39 × 10⁻⁶", "2.6×"], ["0.25", "7.75 × 10⁻⁶", "1.52 × 10⁻⁵", "2.0×"], ["0.50", "4.52 × 10⁻⁵", "6.19 × 10⁻⁵", "1.4×"], ["1.00", "3.91 × 10⁻⁴", "2.20 × 10⁻⁴", "0.6×"],
    ], [1.9, 1.4, 1.6, 1.1]),
    ("h2", "8.4 Errors lie in the operator's weakest directions"),
    ("p", "At a recovered solution, sensitivity along d was 9.47 × 10⁻², against a median of 1.77 × 10⁻¹ over 200 random directions (range 1.35–2.51 × 10⁻¹): 1.9× below the median and below every random direction sampled (Figure 8.4). All six pairwise difference directions lay below the median, by 1.4× to 2.4×. The inverse is anisotropically ill-conditioned: the operator responds about half as strongly to the components that inversion fails to recover."),
    ("fig", F + "fig_sensitivity.png", "Directional sensitivity of the operator: solution-difference directions against 200 random directions", 5.4),
    ("h2", "8.5 Further conditioning results"),
    ("p", "Gain is identifiable: only the true scale lies within the optimiser's residual floor, and a 10% rescale already produces 7.5× the floor (Figure 8.5). The inverse degrades smoothly with measurement noise while retrieval stays near 0.99 (Figure 8.6), and about 10% of cortex (2 000 random vertices) carries most of the recoverable signal (Figure 8.7). Generic priors do not help: an ℓ₂ penalty gives at most +0.032 and temporal smoothness destroys recovery (Figure 8.8). A ridge decoder fitted on the same forward model reaches only 0.060, against 0.918 for gradient inversion (Figure 8.9). Table 8.4 collects these results."),
    ("fig", F + "fig_gain.png", "Output change under rescaling of the ground truth relative to the optimiser's noise floor", 4.8),
    ("fig", F + "fig_noise.png", "Recovery, relative error and retrieval against measurement noise", 6.2),
    ("fig", F + "fig_extent.png", "Recovery against the number of observed cortical vertices", 5.2),
    ("fig", F + "fig_priors.png", "Effect of ℓ₂ and temporal-smoothness priors in the under-determined regime (500 vertices)", 5.2),
    ("fig", F + "fig_baseline.png", "Gradient inversion against the best ridge decoder", 4.2),
    ("tab", "Further characterisation of the inverse (whole cortex unless stated)", ["Test", "Result"], [
        ["Gain (rescale x by α)", "Only α = 1 within the residual floor; a 10% rescale gives 7.5× the floor"],
        ["Measurement noise, 0 → 100% of BOLD SD", "Recovery 0.836 → 0.298, monotone; retrieval stays ≈0.99"],
        ["Observed cortex, 50 → 20 484 vertices", "Recovery 0.100 → 0.836; 2 000 random vertices (10%) reach 0.777"],
        ["ℓ₂ prior (500 vertices)", "Best +0.032 at λ = 10⁻⁵, harmful above"],
        ["Temporal-smoothness prior (500 vertices)", "Recovery 0.527 → 0.0008; retrieval to chance"],
        ["Ridge decoder (240 train, 60 test pairs)", "Best test cosine 0.060 vs 0.918 for gradient inversion (time-averaged target: a lower bound)"],
        ["Stimulus manifold", "White noise 0.947 ± 0.004 vs smooth 0.942 ± 0.005"],
        ["Rate of semantic change, 64-fold range", "0.836–0.858, no trend (no haemodynamic operator in the release)"],
        ["Optimiser control (SGD, L-BFGS)", "Did not converge (1.4 × 10⁻⁴, 2.8 × 10⁻⁵ vs 3.5 × 10⁻⁷); reported as a limitation"],
    ], [2.5, 3.7]),
    ("h2", "8.6 Predictable is not recoverable, region by region"),
    ("p", "Forward sensitivity follows anatomy (Figure 8.11): language and default-mode networks are dominated by text-derived dimensions (z = +26.6 to +28.5), auditory cortex by audio (+34.7) and visual cortex by video (+40.7). Recoverability does not follow sensitivity (Figure 8.12, Table 8.5). Observing only its own vertices, visual cortex, the most responsive network (1.60× the cortical mean), recovered 0.125 worse than size-matched random vertices; somatomotor cortex, the least responsive (0.73×), recovered 0.102 better and exceeded the whole cortex at the same budget (0.851 vs 0.836). Both effects are about ten times the control spread (second random seed: 0.0014 and 0.0126). Response diversity explains the extremes: somatomotor alone is more diverse than its control (participation ratio 18.6 vs 15.2), while visual cortex is concentrated (10.3; top direction 27% of variance; Figure 8.14)."),
    ("fig", F + "brain_rois.png", "The six anatomical networks on the inflated fsaverage5 surface", 6.2),
    ("fig", F + "brain_topography_grid.png", "Forward-sensitivity share of the text-, audio- and video-derived dimensions across cortex", 5.4),
    ("fig", F + "fig_roi_recovery.png", "Recovery from each network versus size-matched random vertex sets", 6.2),
    ("fig", F + "fig_roi_pred_vs_rec.png", "Forward sensitivity against recoverability across networks", 4.8),
    ("fig", F + "fig_roi_dim.png", "Participation ratio of each network's responses against size-matched controls", 6.2),
    ("tab", "Network sensitivity and recoverability (synthetic, 8 000 steps)", ["Network", "Vertices", "Sensitivity (× cortex)", "Dominant slot (z)", "Recovery: network", "Recovery: random", "Difference", "PR (network / control)"], [
        ["Somatomotor", "1 487", "0.73", "none", "0.851", "0.748", "+0.102", "18.6 / 15.2"],
        ["Language (L)", "1 282", "1.21", "text +26.6", "0.752", "0.729", "+0.023", "9.7 / 15.0"],
        ["Auditory", "277", "1.29", "audio +34.7", "0.386", "0.371", "+0.015", "10.1 / 15.5"],
        ["Language (R)", "1 368", "1.22", "text +28.5", "0.750", "0.739", "+0.011", "13.5 / 15.1"],
        ["Default mode", "1 224", "1.03", "text +26.9", "0.727", "0.723", "+0.004", "11.9 / 15.0"],
        ["Visual", "1 582", "1.60", "video +40.7", "0.629", "0.754", "−0.125", "10.3 / 15.1"],
    ], [1.05, 0.6, 0.75, 0.85, 0.75, 0.75, 0.7, 0.85]),
    ("h2", "8.7 Real fMRI"),
    ("p", "The alignment offset fitted on the training stories was 4 s with text and audio features. On the held-out story the encoder reached r = 0.478 on the 2 000 vertices chosen from the other stories, 56% of the split-half noise ceiling (0.859), led by auditory (0.405), right-language (0.348) and default-mode (0.348) networks (Figure 8.15, Table 8.6). Adding language features more than doubled encoding accuracy compared with audio alone and nearly tripled forward identification of 20-s windows (58.6% against a chance level of 0.5%)."),
    ("fig", F + "fig_realdata_audio_text.png", "Real fMRI, held-out story: alignment (A), encoding accuracy by network (B) and identification accuracy (C)", 6.3),
    ("tab", "Real-fMRI validation, held-out story wheretheressmoke (UTS03)", ["Measure", "Text + audio", "Audio only", "Chance / ceiling"], [
        ["Encoding r, whole cortex", "0.199", "0.062", "0"],
        ["Encoding r, top 2 000 vertices", "0.478 (56% of ceiling)", "0.273 (32%)", "ceiling 0.859"],
        ["Encoding r, auditory / language L / language R", "0.405 / 0.274 / 0.348", "0.263 / 0.193 / 0.200", "0"],
        ["Encoding r, default mode / somatomotor / visual", "0.348 / 0.164 / 0.176", "0.103 / 0.039 / −0.020", "0"],
        ["Forward identification, 20-s windows, top-1 (top-5)", "58.6% (86.2%)", "20.7% (41.4%)", "0.5% (194 windows)"],
        ["Inversion of measured BOLD, 100-s segments, top-1", "4 / 5 (ranks 0, 0, 6, 0, 0)", "5 / 5", "2.2% (45 segments)"],
        ["Cosine of x̂ to the true x", "0.024", "0.062", "—"],
        ["Oracle: inverting the model's own prediction", "5 / 5, cosine 0.224", "—", "—"],
    ], [2.4, 1.5, 1.3, 1.0]),
    ("p", "Inverting measured BOLD ranked the true segment first in 4 of 5 held-out queries (the fifth ranked seventh of 45), including against the six other segments of the same story, while x̂ kept a cosine of only 0.02 to the truth. The oracle separates two limits: without noise, inversion identifies every segment yet recovers only 0.22 of the representation, so most of the loss is the operator's conditioning, not measurement noise; noise then lowers recovery further while leaving identification largely intact, as in the synthetic noise sweep. On real data, as in simulation, the inverse identifies which moment was heard but does not reconstruct its representation."),
    ("h2", "8.8 Discussion"),
    ("p", "**Identification is robust; reconstruction is not.** Identification needs only the high-sensitivity components that separate one moment from another, and those are the components the operator transmits well; the components it transmits weakly are where recovery fails (Section 8.4). Decoding claims built on identification accuracy should therefore not be read as reconstruction of the underlying representation."),
    ("p", "**Why better encoders need not decode better.** A better fit can come almost entirely from high-sensitivity directions, leaving low-sensitivity ones as ill-determined as before. This is the dissociation of Section 8.1, and it means scaling laws for encoding [@antonello2023] cannot be assumed to carry over to decoding."),
    ("p", "**The limit is geometry, not lost information.** Fit-matched solutions are separate minima, not points on a flat valley, and magnitude is identifiable. Recovery is limited by a non-convex, anisotropically conditioned landscape, which better optimisation, initialisation or priors matched to the operator's weak directions could improve; generic priors do not. For linear inverted encoding models the stimulus is recovered only up to an invertible transform [@gardner2019]; a deep encoder replaces that closed-form ambiguity with a non-convex, direction-dependent one that must be measured, as done here."),
    ("p", "**Limitations.** Synthetic ground truth lies in a random low-dimensional subspace; inversion targets the aggregated representation; all solutions use Adam; the release has no explicit haemodynamic operator and only the averaged subject layer; regional z-scores use a random-vertex null that ignores spatial autocorrelation; and the real-data test covers one subject and five held-out inversion queries. A per-network test on real data needs held-out stories from more subjects, because the other five stories were in TRIBE v2's training set."),
    # ======================================================================= 9
    ("h1", "9. CONCLUSION"),
    ("p", "A near-perfect deep brain encoder does not by itself make meaning recoverable from fMRI. Inverting TRIBE v2 is a non-convex, direction-dependently conditioned problem: it identifies which stimulus was presented, on synthetic and real data alike, but reconstructs only the components the operator transmits well. Recoverability has to be measured, not inferred from predictivity, and it differs across cortex in ways predictivity does not reveal."),
    ("h2", "9.1 Obtained Results"),
    ("bul", [
        "A differentiable re-entry point into TRIBE v2 that reproduces its predictions exactly (r = 1.0000).",
        "Encoding error falls 28.4× while recovery saturates at cosine 0.944: encoding and decoding dissociate.",
        "Fit-matched solutions disagree (minimum pairwise cosine 0.817 ± 0.007 over four ground truths): the inverse is non-convex.",
        "A forward-only barrier test rejects the null-space hypothesis (2.6× at small steps, 0.6× at full separation).",
        "Residual errors lie 1.9× below the median sensitivity of 200 random directions: anisotropic ill-conditioning.",
        "Gain is identifiable; generic priors hurt; gradient inversion beats a linear decoder about 15-fold.",
        "Visual cortex, the most responsive network, is the worst to decode from (−0.125 vs random); somatomotor, the least responsive, the best (+0.102).",
        "Real fMRI, held-out story: encoding r = 0.48 (56% of the noise ceiling); inversion identifies 4 of 5 segments among 45 (chance 2.2%) with cosine 0.02; the noise-free oracle recovers 0.22.",
    ]),
    ("h2", "9.2 Future improvement/work"),
    ("bul", [
        "Real-data inversion across all eight LeBel subjects and a per-network real-data test on genuinely held-out stories.",
        "Optimisers and priors matched to the operator's weak directions; multiple restarts and ensembling over minima.",
        "Inversion of the raw extractor features (one stage earlier) and an explicit haemodynamic model.",
        "Transfer of the method to EEG and MEG encoders as they appear, and spin-permutation tests for the regional statistics.",
    ]),
    ("h2", "9.3 Individual contribution from team members"),
    ("tab", "Individual contributions", ["Member", "Contribution"], [
        ["Abhranil Sarkar (23BML0077)", "Model instrumentation and the differentiable boundary; inversion engine and optimisation; design and execution of the synthetic and control experiments; real-fMRI pipeline (registration, surface projection, features, evaluation); figures, code release, manuscript and reports"],
        ["Tanisha Choudhuri (23BML0081)", "Functional neuroanatomy and definition of the six cortical networks from the Destrieux atlas; curation of the LeBel dataset; interpretation of the regional and real-data findings; contribution to reports, reviews and the poster"],
    ], [1.8, 4.4]),
    # ======================================================================= 10
    ("h1", "10. SOCIAL AND ENVIRONMENTAL IMPACT"),
    ("p", "**Social impact.** The work concerns people who keep comprehension but lose speech, for whom a non-invasive communication channel would be transformative. By measuring what fMRI decoding can and cannot recover, it helps direct effort towards approaches that can work and away from over-promising. It also bears on mental privacy: the finding that a near-perfect encoder identifies stimuli but does not reconstruct their representation is relevant to policy discussions of neural data [@oecd2019,unesco2025]. No new human data were collected; the public data used were released for research with consent obtained by the original studies."),
    ("p", "**Environmental impact.** The project re-used a pretrained model rather than training a new one, which avoids the large energy cost of training a foundation encoder. All computation ran on a single shared cloud GPU and CPUs for a modest number of GPU-hours, and the public release lets others reproduce the results without repeating the experiments from scratch."),
    # ======================================================================= 11
    ("h1", "11. COST ANALYSIS"),
    ("p", "The project is computational and required no hardware purchase. Table 11.1 gives the budget estimated in Report I and the cost actually incurred."),
    ("tab", "Estimated and incurred cost", ["Item", "Estimate in Report I (INR)", "Incurred (INR)", "Remark"], [
        ["Hosted GPU compute (subscription)", "5 500", "0", "Free Colab T4 tier was sufficient"],
        ["Additional on-demand GPU credits", "4 000", "0", "Memory-saving changes avoided paid tiers"],
        ["Cloud storage (≈200 GB)", "1 500", "0", "Free Google Drive quota and local storage"],
        ["Neuroimaging datasets", "0", "0", "Open licence (OpenNeuro)"],
        ["Pretrained encoder weights", "0", "0", "Open-weight, non-commercial licence"],
        ["Documentation and reprographics", "1 500", "As per printing", "Report binding and A3 poster printing"],
        ["Contingency (≈15%)", "2 000", "0", "Not required"],
        ["Total", "14 500", "Printing only", ""],
    ], [2.1, 1.4, 1.2, 1.5]),
    ("p", "Manpower: 580 planned person-hours (330 and 250 hours for the two members), as set out in Report I."),
    # ======================================================================= 12
    ("h1", "12. PROJECT OUTCOME PUBLICATION/PATENT"),
    ("bul", [
        "**Manuscript:** “Predictable Is Not Recoverable: Conditioning and Non-Convexity of Inverting a Foundation Brain Encoding Model”, A. Sarkar*, T. Choudhuri* (joint first authors) and S. Nageswaran; complete in IEEE format and ready for submission to a journal or conference (venue to be decided).",
        "**Open-source release:** github.com/Ivxn404/semantic-decoding-tribe-inversion, with all scripts, logged results, figures, a demonstration video and two Colab notebooks that reproduce the synthetic and real-data analyses.",
        "**Patent:** none filed; the contribution is a scientific characterisation and an open method.",
    ]),
]

APPENDIX = [
    ("h1", "APPENDIX A: CODE AND REPRODUCTION"),
    ("p", "Repository: github.com/Ivxn404/semantic-decoding-tribe-inversion (MIT licence for the code). TRIBE v2 weights and the fMRI data are downloaded from their original sources and are not redistributed."),
    ("tab", "Map from report results to code", ["Result", "Script (scripts/)", "Output"], [
        ["Sections 8.1–8.5 (synthetic)", "synthetic_characterisation.py", "results/synth_*.json (logged numbers: docs/Methods_and_Results.md)"],
        ["Section 8.6 (regional)", "roi_sensitivity.py, roi_share_stats.py, roi_inversion.py, roi_dimensionality.py", "results/roi_*.json"],
        ["Section 8.7 (real fMRI)", "lebel_register.py, lebel_sampler.py, lebel_project.py, lebel_features.py, lebel_apply.py, lebel_eval.py", "results/realdata_audio_text.json"],
        ["Figures", "make_figures.py, make_roi_figs.py, make_brain_figs.py, make_topo_grid.py, make_realdata_fig.py", "figures/"],
        ["Demonstration video", "demo_run.py, make_demo_video.py", "demo/demo_inversion.mp4"],
    ], [1.6, 3.0, 1.6]),
    ("p", "Two Colab notebooks, Demo_and_Synthetic.ipynb and RealData_TextAudio.ipynb in the notebooks folder, run the full analyses on a free T4 GPU, step by step."),
]
