const fs = require("fs");
const pptxgen = require("pptxgenjs");
const { applyTheme } = require("/mnt/skills/public/pptx/scripts/apply_theme.js");
const fa = require("react-icons/fa");
const K = require("./common");
const { addNovelty } = require("./novelty");
const { HEX, txt, bullets, card, badge, iconBadge, stat, figure, caption, table, arrow, box } = K;

const FOOT = "BECE497J Project-I  ·  Final Review  ·  A. Sarkar (23BML0077)  ·  T. Choudhuri (23BML0081)";
const R = require("path").join(__dirname, "..", "results");
const roiJ = JSON.parse(fs.readFileSync(`${R}/roi_inversion.json`, "utf8"));
const ROW = Object.fromEntries(roiJ.rows.map(r => [r.name, r]));
const SENS = JSON.parse(fs.readFileSync(`${R}/roi_sensitivity.json`, "utf8")).rois;
const ZS = JSON.parse(fs.readFileSync(`${R}/roi_share_stats.json`, "utf8"));
const ORDER = ["Language (L)", "Language homologue (R)", "Auditory", "Default mode", "Visual", "Somatomotor"];
const f3 = v => v.toFixed(3), f2 = v => v.toFixed(2);
const sg = v => (v >= 0 ? "+" : "−") + Math.abs(v).toFixed(3);
const D = n => ROW[n].cosine - ROW[`Random |${n}|`].cosine;
const INTERP = JSON.parse(fs.readFileSync(`${__dirname}/roi_interpretation.json`, "utf8"));

(async () => {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE";
  pres.author = "Abhranil Sarkar, Tanisha Choudhuri";
  pres.title = "Final Review: Conditioning and Non-Convexity of Semantic Decoding";
  pres.theme = { headFontFace: K.THEME.headFontFace, bodyFontFace: K.THEME.bodyFontFace };
  K.defineLayouts(pres, FOOT);
  const I = {};
  for (const [k, comp] of Object.entries({ check: fa.FaCheck, times: fa.FaTimes, warn: fa.FaExclamationTriangle,
    db: fa.FaDatabase, lock: fa.FaLock, globe: fa.FaGlobeAsia, file: fa.FaFileAlt, book: fa.FaBook,
    heart: fa.FaHeartbeat, industry: fa.FaIndustry, hands: fa.FaHandsHelping, brain: fa.FaBrain, balance: fa.FaBalanceScale,
    flask: fa.FaFlask, search: fa.FaSearch, map: fa.FaMapMarkedAlt, users: fa.FaUsers }))
    I[k] = await K.iconPng(comp, "#FFFFFF");
  const S = (sec, layout = "Content") => pres.addSlide({ masterName: layout, sectionTitle: sec });
  let s;

  // ============================================================ TITLE
  pres.addSection({ title: "Opening" });
  s = S("Opening", "Title");
  s.addText("Conditioning and Non-Convexity of Semantic Decoding by Inversion of Deep Brain Encoding Models", { placeholder: "title" });
  s.addText([
    { text: "Project-I (BECE497J)  ·  Final Review, Poster and Demonstration  ·  29 October 2026", options: { breakLine: true, bold: true, color: "FFFFFF" } },
    { text: "Abhranil Sarkar (23BML0077)   ·   Tanisha Choudhuri (23BML0081)", options: { breakLine: true } },
    { text: "Guide: Dr. Sharmila Nageswaran, Associate Professor, School of Electronics Engineering", options: {} },
  ], { placeholder: "body" });
  s.addNotes("The complete project in one deck: problem, data, method, every result on synthetic and real fMRI, the verification re-run of 19 October, deliverables, mappings and future work. Backup slides at the end answer the questions we expect.");
  
  // ---- contents
  s = S("Opening");
  s.addText("Contents", { placeholder: "title" });
  [["1", "Problem, motivation and objectives", "why decoding by inversion, the gap, six objectives, literature, novelty"],
   ["2", "Method and validation", "TRIBE v2 and its data, why fMRI, the re-entry point, inversion, synthetic protocol, hypotheses, constraints, tools"],
   ["3", "Results on exact ground truth", "dissociation, non-convexity, verified barriers, weak directions, gain, robustness, linear baseline"],
   ["4", "Regional analysis", "six anatomical networks, topography, predictable vs recoverable, response diversity"],
   ["5", "Real fMRI", "LeBel 2023 pipeline, encoding, identification vs reconstruction, multi-start run on the real model"],
   ["6", "Standards, ethics and SDGs", "BIDS, IEEE P2731 / P2794, FAIR, licences, neuro-ethics, SDG 3.4 / 9.5 / 10.2"],
   ["7", "Outcomes", "deliverables, live demo, schedule, cost, contributions, PO / PSO / WP mapping, impact, limitations, future work"],
  ].forEach(([n, h, b], i) => {
    const y = 1.35 + i * 0.79;
    badge(s, 0.7, y + 0.05, 0.58, n, i % 2 ? HEX.blue : HEX.navy, 16);
    txt(s, h, { x: 1.55, y, w: 4.4, h: 0.68, fontSize: 17, bold: true, color: HEX.navy, valign: "middle", fontFace: K.THEME.headFontFace });
    txt(s, b, { x: 6.0, y, w: 6.8, h: 0.68, fontSize: 13.5, color: HEX.ink2, valign: "middle" });
  });
  s.addNotes("Seven parts. Backup slides with anticipated questions and the full reference list follow the conclusion.");

  // ---- motivation
  s = S("Opening");
  s.addText("Motivation: reading meaning back out of the brain", { placeholder: "title" });
  [[0.5, I.heart, HEX.orange, "Clinical need", "ALS, brainstem stroke, locked-in syndrome and severe aphasia can leave comprehension intact while removing speech and writing. A non-invasive decoder would restore a channel without neurosurgery."],
   [4.65, I.brain, HEX.blue, "Encoders are now very good", "Deep encoding models predict whole-cortex fMRI from video, audio and language, and accuracy keeps rising with model size and data [3, 7]. Decoding is usually assumed to follow."],
   [8.8, I.search, HEX.violet, "The untested step", "A forward model can be highly predictive and still have an inverse that is non-unique or unstable (Hadamard; Hansen [8]). Nobody had measured this for a deep foundation encoder."]].forEach(([x, ic, c, h, b]) => {
    card(s, x, 1.35, 4.0, 4.3, HEX.tint);
    iconBadge(s, x + 0.3, 1.6, 0.8, ic, c);
    txt(s, h, { x: x + 0.3, y: 2.55, w: 3.4, h: 0.6, fontSize: 18, bold: true, color: HEX.navy, fontFace: K.THEME.headFontFace });
    txt(s, b, { x: x + 0.3, y: 3.15, w: 3.4, h: 2.4, fontSize: 14 });
  });
  card(s, 0.5, 5.85, 12.3, 1.0, HEX.navy);
  txt(s, [{ text: "Question.  ", options: { bold: true, color: "FFC9A8" } }, { text: "When an encoder becomes very accurate, does it become invertible? We answer it for Meta's open 177 M-parameter TRIBE v2.", options: { color: "FFFFFF" } }],
    { x: 0.75, y: 5.9, w: 11.8, h: 0.9, fontSize: 16, valign: "middle" });
  s.addNotes("Mental privacy is the other side of the same question: the limits of what can be decoded matter as much as the successes.");


  // ============================================================ STATUS
  s = S("Opening");
  s.addText("Project at a glance: complete", { placeholder: "title" });
  stat(s, 0.6, 1.4, 2.9, "28.4×", "lower encoding error, while recovery saturates at 0.944", HEX.orange);
  stat(s, 3.7, 1.4, 2.9, "3.8×", "error barrier between equally good blind solutions (7.2× to a deeper one)", HEX.blue);
  stat(s, 6.8, 1.4, 2.9, "−0.125", "visual cortex, most responsive, recovers worst vs random vertices", HEX.aqua);
  stat(s, 9.9, 1.4, 2.9, "4 / 5", "held-out real-fMRI segments identified (chance 2.2%), cosine 0.02", HEX.violet);
  txt(s, "Completion against the project plan", { x: 0.6, y: 3.75, w: 8, h: 0.35, fontSize: 15, bold: true, color: HEX.navy });
  const phases = [["Formulation", 1, HEX.aqua], ["Instrumentation", 1, HEX.aqua], ["Core characterisation", 1, HEX.aqua],
    ["Controls & validation", 1, HEX.aqua], ["Regional analysis", 1, HEX.aqua], ["Real-data study", 1, HEX.aqua], ["Write-up and release", 1, HEX.aqua]];
  let px = 0.6; const pw = 12.1 / phases.length;
  phases.forEach(([n, f, c]) => {
    s.addShape("rect", { x: px, y: 4.2, w: pw - 0.06, h: 0.42, fill: { color: "E4E8EE" }, line: { color: "E4E8EE" } });
    s.addShape("rect", { x: px, y: 4.2, w: (pw - 0.06) * f, h: 0.42, fill: { color: c }, line: { color: c } });
    txt(s, n, { x: px, y: 4.7, w: pw - 0.1, h: 0.5, fontSize: 12, color: HEX.ink2 });
    px += pw;
  });
  card(s, 0.6, 5.45, 12.1, 1.35, HEX.tint);
  txt(s, [{ text: "Status: 100% complete. ", options: { bold: true, color: HEX.navy } },
    { text: "All six objectives met. Delivered: IEEE-format manuscript, final report (VIT 2026 format), A3 poster, open GitHub repository with code, logged results, an interactive live demo and four Colab notebooks. Key claims re-verified on the real model on 19 October 2026." }],
    { x: 0.85, y: 5.6, w: 11.6, h: 1.1, fontSize: 16, valign: "middle" });
  s.addNotes("Everything planned in Report I is done: 580 person-hours across seven stages. The four headline numbers each come from a different part of the project: synthetic dissociation, the corrected barrier test, the regional analysis and real fMRI.");

  // ============================================================ RECAP
  s = S("Opening");
  s.addText("Problem, gap and objectives", { placeholder: "title" });
  card(s, 0.6, 1.35, 12.1, 1.15, HEX.navy);
  txt(s, [{ text: "Gap.  ", options: { bold: true, color: "FFC9A8" } },
    { text: "Encoders keep improving [3, 7], but nobody has measured whether that makes meaning more recoverable from fMRI, or what limits the inverse. Linear encoders are invertible only up to a linear transform [18]; deep encoders were never tested.", options: { color: "FFFFFF" } }],
    { x: 0.85, y: 1.45, w: 11.6, h: 0.95, fontSize: 17, valign: "middle" });
  const objs = [
    ["O1", "Formulate decoding as inversion; find the differentiable entry point", "Done", HEX.aqua],
    ["O2", "Synthetic framework with exact ground truth", "Done", HEX.aqua],
    ["O3", "Characterise the inverse vs. budget, noise, extent, priors", "Done", HEX.aqua],
    ["O4", "Discriminate non-identifiability vs. non-convexity vs. optimiser limits", "Done", HEX.aqua],
    ["O5", "Linear baseline; recoverability by anatomical network", "Done", HEX.aqua],
    ["O6", "Validate on real naturalistic fMRI (LeBel 2023)", "Done", HEX.aqua],
  ];
  objs.forEach(([id, t, st, c], i) => {
    const y = 2.75 + i * 0.66;
    badge(s, 0.7, y, 0.52, id, HEX.navy, 13);
    txt(s, t, { x: 1.4, y: y + 0.02, w: 9.3, h: 0.5, fontSize: 15.5, valign: "middle" });
    s.addShape("roundRect", { x: 10.9, y: y + 0.07, w: 1.75, h: 0.4, rectRadius: 0.2, fill: { color: c }, line: { color: c } });
    txt(s, st, { x: 10.9, y: y + 0.07, w: 1.75, h: 0.4, fontSize: 12, bold: true, color: "FFFFFF", align: "center", valign: "middle" });
  });
  s.addNotes("All six objectives complete. O6, the real-data validation, came last on purpose: synthetic ground truth is the instrument, real data the external check.");
  
  s = S("Opening");
  s.addText("Literature review", { placeholder: "title" });
  table(s, ["Work", "Contribution", "Limitation relevant here"], [
    ["Mitchell et al., 2008", "Linear model predicts fMRI for unseen nouns", "Single words, hand-built features"],
    ["Kay et al., 2008 [21]", "Identifies viewed images via predicted responses", "Identification, not recovery"],
    ["Naselaris et al., 2011 [1]", "Encoding models as the route to decoding", "Assumes invertibility"],
    ["Huth et al., 2016 [2]", "Semantic maps across cortex from natural speech", "Linear; no inverse analysis"],
    ["Antonello et al., 2023 [3]", "Encoding accuracy scales with model size", "Scaling shown for encoding only"],
    ["Tang et al., 2023 [4]", "Continuous language from fMRI via LM search", "Per-subject decoder; search, not inversion"],
    ["Gardner & Liu, 2019 [18]", "Linear IEMs identifiable only up to a transform", "Linear models only"],
    ["Lévy et al., 2025 [6]", "Typed sentences from MEG (CER 32%) and EEG (67%)", "Shows EEG's limits for language"],
    ["d'Ascoli et al., 2026, TRIBE v2 [7]", "Open foundation encoder, 720 subjects", "Encoder only; inverse never studied"],
    ["Bladon & Bent; Benchetrit et al., 2026 [19, 20]", "Feature visualisation; synthetic training data", "Neither tests uniqueness of the inverse"],
  ], { x: 0.5, y: 1.3, w: 12.3, colW: [3.6, 4.6, 4.1], fontSize: 13.5, rowH: 0.52 });
  s.addNotes("The arc: encoders went from linear maps on hand-built features to deep foundation models; decoding was always evaluated by proxies (rank, retrieval, word error) because the true representation behind real fMRI is unknown. Inverse analysis existed only for linear models.");


  // ============================================================ LIT ANCHORS
  s = S("Opening");
  s.addText("Objectives anchored to the literature", { placeholder: "title" });
  table(s, ["Prior work", "What it assumed or left open", "What we add"], [
    ["Naselaris et al. 2011 [1]", "Encoding models are the route to decoding", "Measure when that route fails: dissociation of 28× vs +0.015"],
    ["Antonello et al. 2023 [3]; TRIBE v2 2026 [7]", "Encoding accuracy scales log-linearly with data", "Show decoding saturates while encoding error keeps falling"],
    ["Tang et al. 2023 [4]", "Decoding via LM-guided search, per-subject decoder", "Decoder-free inversion; exact error under ground truth"],
    ["Hansen 2010 [8] (inverse problems)", "Ill-posedness via conditioning and null spaces", "Test both on a 177 M-parameter operator: non-convex, not null-space"],
    ["Huth 2016 [2]; Fedorenko 2024 [10]; Buckner 2008 [11]", "Semantic, language and default-mode networks", "Recoverability and modality sensitivity per network"],
    ["Brain2Qwerty 2026 [6]; Défossez 2023 [22]", "Non-invasive decoding limited by modality", "Limits that hold even for a near-perfect fMRI forward model"],
  ], { x: 0.5, y: 1.35, w: 12.3, colW: [3.0, 4.4, 4.9], fontSize: 15, rowH: 0.7 });
  s.addNotes("Rubric line 'objectives well aligned to literature': each row is one prior result, the assumption it made, and the specific measurement we contribute.");

  addNovelty(S, "Opening", { kay: 21, gardner: 18, tang: 4, tribe2: 7, bladon: 19, benchetrit: 20 }, [
    ["First uniqueness and conditioning analysis of a deep foundation brain encoder", "Prior-art matrix and dated search protocol (previous two slides)", "Shown"],
    ["Encoding accuracy and decodability dissociate", "Encoding error falls 28.4×; the final halving buys +0.015 recovery", "Shown"],
    ["Incomplete recovery is non-convexity, not a null space", "Equal fits disagree (min cosine 0.817 ± 0.007, 4 truths); straight paths between them rise 3.8× (7.2× to a deeper minimum)", "Shown"],
    ["Error concentrates in the operator's least-sensitive directions", "Solution difference 2.1× below the random median (1.9× originally); below all 200 random directions", "Shown"],
    ["Predictable is not recoverable, region by region", "Visual −0.125, somatomotor +0.102 vs size-matched random sets; ≈10× the control spread", "Shown"],
    ["Nonlinear inversion beats linear decoding", "0.918 vs 0.060 for the best ridge decoder (≈15×)", "Shown"],
    ["On real fMRI the inverse identifies but does not reconstruct", "Held-out story: 4/5 segments among 45 (chance 2.2%), cosine 0.02; oracle 5/5, 0.22", "Shown"],
  ]);

  // ============================================================ METHOD
  pres.addSection({ title: "Method and validation" });
  s = S("Method and validation", "Section");
  s.addText("Methodology, analytical model and validation", { placeholder: "title" });
  s.addText("How every claim is tested, and what would have falsified it", { placeholder: "body" });

  // block diagram v2
  s = S("Method and validation");
  s.addText("Functional block diagram (final)", { placeholder: "title" });
  box(s, 0.5, 1.45, 2.5, 1.15, "Ground-truth generator", "seeded, 32 × 1152", HEX.navy, "FFFFFF", 13);
  box(s, 3.3, 1.45, 2.5, 1.15, "Frozen operator f(x)", "TRIBE v2, 177.21 M params", HEX.blue, "FFFFFF", 13);
  box(s, 6.1, 1.45, 2.5, 1.15, "Measurement model", "y = M ⊙ f(x*) + η", HEX.navy, "FFFFFF", 13);
  box(s, 8.9, 1.45, 3.9, 1.15, "Inversion engine", "Adam on x, θ frozen, gradients by autograd", HEX.orange, "FFFFFF", 13);
  arrow(s, 3.0, 2.02, 3.3, 2.02); arrow(s, 5.8, 2.02, 6.1, 2.02); arrow(s, 8.6, 2.02, 8.9, 2.02);
  box(s, 0.5, 3.2, 3.8, 1.15, "Anatomical ROI masks", "Destrieux atlas → 6 networks on fsaverage5", HEX.aqua, "FFFFFF", 13);
  box(s, 4.6, 3.2, 3.8, 1.15, "Forward sensitivity maps", "per-vertex response to text / audio / video dims", HEX.aqua, "FFFFFF", 13);
  box(s, 8.9, 3.2, 3.9, 1.15, "Hypothesis tests", "init control · perturbation · sensitivity · gain", HEX.violet, "FFFFFF", 13);
  arrow(s, 2.4, 3.2, 6.6, 2.6, HEX.aqua); arrow(s, 10.85, 2.6, 10.85, 3.2, HEX.orange);
  box(s, 0.5, 4.95, 3.8, 1.15, "Controls", "size-matched random masks · 2nd seed · whole-cortex anchor", HEX.muted, "FFFFFF", 13);
  box(s, 4.6, 4.95, 3.8, 1.15, "Evaluation", "cosine · per-modality cosine · rel. error · retrieval", HEX.aqua, "FFFFFF", 13);
  box(s, 8.9, 4.95, 3.9, 1.15, "Results store", "results.json + ROI json · figures from logged numbers", HEX.navy, "FFFFFF", 13);
  arrow(s, 4.3, 5.52, 4.6, 5.52); arrow(s, 8.4, 5.52, 8.9, 5.52); arrow(s, 10.85, 4.35, 10.85, 4.95, HEX.violet);
  txt(s, "New since Review II: ROI masks, sensitivity maps, hypothesis tests and controls (green / violet / grey).",
    { x: 0.5, y: 6.35, w: 12.3, h: 0.4, fontSize: 13, italic: true, color: HEX.ink2 });
  s.addNotes("Top row: the core loop. Middle: the neurobiology track (anatomical masks, sensitivity maps) and the hypothesis tests. Bottom: controls, evaluation and the results store from which every figure is regenerated.");
  
  s = S("Method and validation");
  s.addText("Where we cut into the network", { placeholder: "title" });
  figure(s, "pipeline.png", 0.5, 1.3, 12.3, 3.5);
  table(s, ["Fact", "Value"], [
    ["Parameters (all frozen)", "177.21 M: encoder 127.47 M, low-rank head 1 152 → 2 048, subject layer 41.97 M, temporal pooler"],
    ["Input we optimise", "x ∈ ℝ^(T × 1 152): text | audio | video slots of 384 each, 2 Hz"],
    ["Output", "20 484 fsaverage5 vertices × 100 steps at 1 Hz"],
    ["Re-entry check", "reproduces the released predictions exactly (r = 1.0000); ‖∂f/∂x‖ = 7.97 × 10³, no zero entries"],
  ], { x: 0.5, y: 4.95, w: 12.3, colW: [3.0, 9.3], fontSize: 13, rowH: 0.42 });
  s.addNotes("The public inference path runs speech synthesis, transcription and frozen extractors under inference mode, so it is not differentiable end to end. The input batch is consumed at one point only, the aggregation of extractor features into x; everything after is tensor arithmetic. We re-enter there: f(x) = pool(predictor(head(encoder(x)))).");

  s = S("Method and validation");
  s.addText("Inversion and the synthetic protocol", { placeholder: "title" });
  card(s, 0.5, 1.35, 12.3, 1.0, HEX.navy);
  txt(s, "x̂ = argmin_x ‖f(x) − y‖² + λ R(x)        ·        s(v) = ‖f(x + εv) − f(x)‖ / ε",
    { x: 0.75, y: 1.4, w: 11.8, h: 0.9, fontSize: 22, color: "FFFFFF", align: "center", valign: "middle", fontFace: K.THEME.headFontFace });
  table(s, ["Setting", "Value"], [
    ["Optimiser", "Adam [17], lr 5 × 10⁻², cosine annealing over the budget; θ frozen, gradients by autograd"],
    ["Initialisation", "0.01·N(0, I), seed 999 (default); eight distributions for the uniqueness study"],
    ["Ground truth", "smooth trajectory in a random 8-D subspace of ℝ^1152, two cosine cycles, T = 32; white noise as off-manifold control"],
    ["Target", "y = f(x), so recovery error is exact; real data: 1 − Pearson r over time (scale-free)"],
    ["Metrics", "mean per-step cosine to x, relative error, encoding error, retrieval rank among time steps"],
    ["Priors tested", "ℓ₂ and temporal smoothness, λ swept; none by default"],
  ], { x: 0.5, y: 2.6, w: 12.3, colW: [2.6, 9.7], fontSize: 13.5, rowH: 0.6 });
  s.addNotes("s(v) is a finite-difference probe of the Jacobian along a unit direction v, used for the sensitivity analysis.");

  s = S("Method and validation");
  s.addText("What TRIBE v2 learned from: its fMRI training data", { placeholder: "title" });
  table(s, ["Dataset (train)", "What participants did in the scanner", "Subjects", "Sessions", "fMRI (h)", "TR (s)"], [
    ["CNeuroMod / Algonauts 2025 [23]", "Watched TV (Friends, seasons 1–6) and 4 feature films: video + audio + dialogue", "4", "1 408", "268.7", "1.49"],
    ["BOLD Moments [24]", "Watched 1 102 three-second naturalistic video clips (1 000 train, 102 test × 10)", "10", "520", "61.9", "1.75"],
    ["LeBel et al. 2023 [5]", "Listened to spoken autobiographical stories (podcasts); 82 stories for 3 subjects", "8", "432", "85.8", "2.0"],
    ["Wen et al. 2018 [25]", "Watched natural movie clips (8-min segments, test segments ×10)", "3", "258", "35.2", "2.0"],
    [{ text: "Training total", options: { bold: true } }, "All 3T; passive viewing / listening, no task", { text: "25", options: { bold: true } }, { text: "2 618", options: { bold: true } }, { text: "451.6", options: { bold: true } }, "—"],
  ], { x: 0.5, y: 1.3, w: 12.3, colW: [2.9, 5.0, 1.0, 1.1, 1.1, 1.2], fontSize: 12.5, rowH: 0.5 });
  card(s, 0.5, 4.75, 6.0, 2.05, HEX.tint);
  txt(s, [{ text: "Evaluation (never trained on). ", options: { bold: true, color: HEX.navy } },
    { text: "NNDb (86 subjects, films), Le Petit Prince (112, audiobook), Narratives (321, spoken stories), HCP 7T (176, movie clips): 695 subjects, 666.1 h. With training: 720 subjects, 5 094 sessions, 1 117.7 h of fMRI [7]." }],
    { x: 0.7, y: 4.85, w: 5.6, h: 1.85, fontSize: 13.5, valign: "middle" });
  card(s, 6.8, 4.75, 6.0, 2.05, HEX.paleOrange);
  txt(s, [{ text: "What this means for us. ", options: { bold: true, color: HEX.navy } },
    { text: "Our real-data subject UTS03 is one of the 8 LeBel training subjects, but our test story (wheretheressmoke) is TRIBE v2's own held-out test split, so the encoder never saw the responses we invert. The released weights use one averaged 'unseen subject' layer, so we invert the population model." }],
    { x: 7.0, y: 4.85, w: 5.6, h: 1.85, fontSize: 13.5, valign: "middle" });
  s.addNotes("Numbers from Table 1 of d'Ascoli et al. 2026 (arXiv 2605.04326) and the study definitions shipped with the TRIBE v2 code (subject IDs and TRs: Algonauts2025 sub-01/02/03/05, BOLD Moments 10 subjects, LeBel UTS01-08, Wen subject1-3). All participants were healthy adults scanned at 3T (HCP at 7T) while passively watching or listening; no task, no button presses. Consent and ethics are those of the original studies; all four training sets are public. Modalities: CNeuroMod has video, audio and text; BOLD Moments video and audio; LeBel audio and text; Wen video only.");

  // ---- why fMRI and not EEG (asked at Review II)
  s = S("Method and validation");
  s.addText("Why fMRI, not EEG", { placeholder: "title" });
  table(s, ["Criterion", "fMRI (this work)", "EEG"], [
    ["Spatial detail", "≈2–3 mm voxels; 20 484 cortical vertices", "32–128 scalp channels, cm-scale, blurred"],
    ["Foundation encoder to invert", "TRIBE v2: 177 M parameters, 1 117.7 h, 720 subjects", "No open whole-brain encoder of naturalistic EEG at this scale"],
    ["Number of inverse problems", "One: response → representation", "Two: scalp → cortical sources (itself ill-posed) → representation"],
    ["Measured language-decoding evidence", "Continuous language reconstructed from fMRI [4]", "Same decoder: 67% character error with EEG vs 32% with MEG [6]"],
    ["Open naturalistic language data", "LeBel 2023: 8 subjects, 85.8 h of stories", "No open simultaneous EEG–fMRI set with sustained speech"],
    [{ text: "Temporal resolution", options: { color: "B03A2E", bold: true } }, { text: "1.5–2 s samples, ≈5 s haemodynamic lag (cost)", options: { color: "B03A2E" } }, "Milliseconds (EEG advantage)"],
    [{ text: "Cost and portability", options: { color: "B03A2E", bold: true } }, { text: "Scanner-bound (cost)", options: { color: "B03A2E" } }, "Wearable, low cost (EEG advantage)"],
  ], { x: 0.5, y: 1.25, w: 12.3, colW: [2.8, 4.5, 5.0], fontSize: 12, rowH: 0.44 });
  card(s, 0.5, 5.85, 12.3, 1.05, HEX.navy);
  txt(s, [{ text: "Decision.  ", options: { bold: true, color: "FFC9A8" } },
    { text: "fMRI is where the question can be answered today: it has the spatial detail, the data and the only deep encoder large enough to invert. EEG's real advantages (speed, cost) matter for a deployed device, not for measuring how invertible an encoder is. The method transfers to EEG once a comparable EEG encoder exists.", options: { color: "FFFFFF" } }],
    { x: 0.75, y: 5.88, w: 11.8, h: 1.0, fontSize: 12.5, valign: "middle" });
  s.addNotes("Answer in one breath: EEG would add a second ill-posed inverse problem (source localisation) on top of the one we study, and no EEG foundation encoder exists to invert. We considered simultaneous EEG-fMRI (Report I, Solution 3): the open NKI simultaneous dataset has rest, Inscapes and short movie clips but no sustained language. Brain2Qwerty numbers are from the arXiv preprint (Lévy et al. 2025). Be honest about the two rows in red: fMRI is slow and expensive, which is why a clinical device would eventually need EEG or MEG; our contribution is to measure the limits first.");

  // hypotheses
  s = S("Method and validation");
  s.addText("Four explanations for incomplete recovery", { placeholder: "title" });
  table(s, ["Hypothesis", "Predicted signature", "Test", "Verdict"], [
    ["H1  Information loss (null space)", "Error stays flat on the line between fit-matched solutions", "Straight-path error profile, forward passes only", { text: "Rejected", options: { bold: true, color: "C0392B" } }],
    ["H2  Non-convexity", "Distinct minima at equal fit, separated by a barrier", "Init control at matched fit (× 4); path rise; near-truth control", { text: "Supported", options: { bold: true, color: "138A5E" } }],
    ["H3  Optimiser artefact (under-convergence)", "Recovery keeps rising with budget", "Convergence curve; fit-matched inclusion", { text: "Controlled", options: { bold: true, color: "138A5E" } }],
    ["H4  Unidentifiable gain", "Rescaled x produces the same output", "Forward-only rescaling test", { text: "Rejected", options: { bold: true, color: "C0392B" } }],
    ["H5  Errors along weak directions", "Difference directions have low Jacobian response", "Directional sensitivity vs 200 random", { text: "Supported", options: { bold: true, color: "138A5E" } }],
  ], { x: 0.5, y: 1.35, w: 12.3, colW: [3.3, 3.6, 3.6, 1.8], fontSize: 15, rowH: 0.85 });
  s.addNotes("Pre-registered style: each hypothesis has a signature that would show up if it were true and a test that could falsify it. Two were rejected by our own experiments, which is the strongest evidence that the method can discriminate.");

  // validation strategy
  s = S("Method and validation");
  s.addText("Validation built into the method", { placeholder: "title" });
  table(s, ["Risk to validity", "Safeguard", "Outcome"], [
    ["Measuring the optimiser, not the operator", "Converge first; independent runs to schedule end", "Plateau ≈ 0.94 by 32 000 steps"],
    ["Under-converged runs posing as alternative solutions", "Only blind solutions within 2× of the best blind fit", "Gaussian s.d. 5 excluded (3.2× worse fit)"],
    ["One trajectory being special", "Replicate across 4 independent ground truths", "min pairwise 0.8165 ± 0.0068"],
    ["Inference instead of demonstration", "Straight-path error between fit-matched solutions", "Rises 1.5–6.0× (median 3.8×): H1 rejected"],
    ["Solutions that were told the answer", "Near-truth starts used only as a control", "Deeper minimum, 4.6× lower error"],
    ["ROI size confound", "Random vertex sets of identical size", "Paired comparison per network"],
    ["Random-seed luck in controls", "Second random seed for two networks", `Δ between seeds ≤ ${f3(INTERP.seed_gap_max)}`],
    ["Platform dependence", "Whole-cortex anchor re-run on CPU vs earlier GPU", `${f3(ROW["Whole cortex"].cosine)} vs 0.836 (GPU)`],
  ], { x: 0.5, y: 1.35, w: 12.3, colW: [3.9, 4.6, 3.8], fontSize: 14, rowH: 0.58 });
  s.addNotes("This is the 'with validation' part of the top rubric band for methodology. The CPU anchor is the same ground truth, initialisation and budget as the Stage 6 GPU run; agreement shows results are not a platform artefact.");

  s = S("Method and validation");
  s.addText("Constraints, alternatives and trade-offs", { placeholder: "title" });
  table(s, ["Constraint", "Effect", "Trade-off adopted"], [
    ["No local GPU", "Large models cannot run on laptops", "Free Colab T4 for GPU work; CPU for regional analysis; Llama in half precision"],
    ["12 GB RAM / 15 GB GPU", "Llama-3.2-3B and w2v-BERT cannot load together", "One story per process; audio and text in separate passes"],
    ["Released pipeline not differentiable", "Raw stimuli cannot be optimised", "Invert the aggregated representation x"],
    ["No ground truth in real fMRI", "Recovery cannot be measured directly", "Exact synthetic evaluation + identification at a known chance level"],
    ["Only an averaged subject layer", "No per-subject analysis", "Invert the population model; stated as a limitation"],
    ["Synthetic x in a random subspace", "Absolute values may not transfer", "Real-data validation confirms the qualitative pattern"],
  ], { x: 0.5, y: 1.3, w: 12.3, colW: [3.1, 3.9, 5.3], fontSize: 13, rowH: 0.52 });
  card(s, 0.5, 5.2, 12.3, 1.6, HEX.tint);
  txt(s, [{ text: "Alternatives from Report I.  ", options: { bold: true, color: HEX.navy } },
    { text: "(1) End-to-end supervised decoder: needs large per-subject data and cannot explain failures. (2) Inversion of a pretrained encoder: selected. (3) Simultaneous EEG–fMRI fusion decoder: blocked, since no open simultaneous dataset contains sustained language." }],
    { x: 0.75, y: 5.3, w: 11.8, h: 1.4, fontSize: 14, valign: "middle" });
  s.addNotes("These are the engineering decisions a reviewer will ask about; each constraint maps to one concrete design choice.");

  s = S("Method and validation");
  s.addText("Hardware and software tools", { placeholder: "title" });
  table(s, ["Category", "Tool", "Use"], [
    ["Compute (GPU)", "Google Colab, NVIDIA T4 (15 GB), 12 GB RAM", "Synthetic characterisation, real-data features and inversion, verification"],
    ["Compute (CPU)", "Linux cloud CPU", "Regional analysis, surface projection, recorded multi-start run, figures"],
    ["Deep learning", "PyTorch, HuggingFace Transformers and Hub", "Autograd through the frozen encoder; Llama-3.2-3B, w2v-BERT 2.0"],
    ["Encoder", "TRIBE v2 code and weights (Meta FAIR, CC BY-NC 4.0)", "Frozen forward operator"],
    ["Neuroimaging", "nilearn, nibabel, ANTsPy, pycortex transforms", "Atlas, surfaces, registration, surface projection"],
    ["Scientific Python", "NumPy, SciPy, scikit-learn, h5py, Matplotlib", "Analysis, ridge baseline, figures"],
    ["Data", "OpenNeuro ds003020 (LeBel et al., 2023)", "Real naturalistic fMRI"],
    ["Delivery", "GitHub, Colab notebooks, WebGL demo page, PowerPoint, Word", "Release, live demo, reviews and report"],
  ], { x: 0.5, y: 1.3, w: 12.3, colW: [2.2, 4.8, 5.3], fontSize: 13, rowH: 0.6 });
  s.addNotes("No hardware was built: the project is computational. Total compute spend was zero rupees.");


  // ---- where the forward model comes from (asked at Review II)
  // ============================================================ RESULTS
  pres.addSection({ title: "Results" });
  s = S("Results", "Section");
  s.addText("Results and interpretation", { placeholder: "title" });
  s.addText("Why recovery is incomplete, and where in cortex meaning is recoverable", { placeholder: "body" });

  // recap dissociation
  s = S("Results");
  s.addText("Recap: encoding and decoding dissociate", { placeholder: "title" });
  figure(s, "fig_dissociation.png", 0.4, 1.3, 6.4, 5.4);
  figure(s, "fig_extent.png", 6.9, 1.3, 6.0, 4.1);
  card(s, 6.95, 5.55, 5.85, 1.25, HEX.tint);
  txt(s, "Encoding error falls 28.4× while recovery saturates at 0.944. Recovery saturates near 2 000 random vertices. Both established at Review II.",
    { x: 7.15, y: 5.6, w: 5.45, h: 1.15, fontSize: 14, valign: "middle" });
  s.addNotes("One-slide recap so the panel has the baseline facts before the new results.");

  // non-convexity
  s = S("Results");
  s.addText("Same fit, different answers: the inverse is non-convex", { placeholder: "title" });
  figure(s, "fig_nonconvex.png", 0.4, 1.3, 12.5, 4.5);
  table(s, ["Ground truth", "Best fit", "Mean pairwise", "Min pairwise", "Worst pair"], [
    ["0", "3.51e-7", "0.8928", "0.8068", "uniform vs truth+noise"], ["1", "3.65e-7", "0.8934", "0.8151", "uniform vs truth+noise"],
    ["2", "3.11e-7", "0.9007", "0.8257", "uniform vs truth+noise"], ["3", "3.13e-7", "0.8996", "0.8186", "uniform vs truth+noise"],
  ], { x: 0.5, y: 5.85, w: 12.3, colW: [1.8, 1.8, 2.2, 2.2, 4.3], fontSize: 12, rowH: 0.24 });
  s.addNotes("Four initialisation distributions, 14 000 steps each, all reach prediction MSE within 3.1-4.0e-7 (fit-matched), yet agree with each other only at 0.82-0.90 cosine. Reproduced across four independent ground truths with sd 0.0068. The same pair disagrees most every time, and recovered norms cluster by initialisation (0.90, 0.99, 0.94, 1.17 in every run): solutions separate along a consistent, structured direction, not randomly.");

  // barrier (verified 19 Oct 2026)
  s = S("Results");
  s.addText("Barriers, not a null space (verified on the real model)", { placeholder: "title" });
  figure(s, "fig_barrier_verified.png", 0.4, 1.25, 12.5, 4.45);
  card(s, 0.5, 5.8, 6.05, 1.05, HEX.tint);
  txt(s, [{ text: "Result. ", options: { bold: true, color: HEX.navy } }, { text: "On the straight line between any two of the five equally good blind fits the error rises 1.5–6.0× (median 3.8×). A flat null space would stay level. Starts near the truth find a minimum with 4.6× lower error, 7.2× barrier away." }],
    { x: 0.7, y: 5.85, w: 5.7, h: 0.95, fontSize: 12.5, valign: "middle" });
  card(s, 6.75, 5.8, 6.05, 1.05, HEX.paleOrange);
  txt(s, [{ text: "Correction. ", options: { bold: true, color: HEX.navy } }, { text: "Our earlier perturbation test (2.6× → 0.6×) paired an unconverged solution (Gaussian s.d. 5). It is withdrawn; the selection rule is fixed and the test was re-run on a T4 on 19 Oct 2026." }],
    { x: 6.95, y: 5.85, w: 5.7, h: 0.95, fontSize: 12.5, valign: "middle" });
  s.addNotes("Verification notebook, ground truth 0, 14 000 steps, eight starts inverted together. Blind fit-matched starts: Gaussian 0.01, 0.1, 1.0, uniform, zeros (3.57-3.90e-7). Error measured against the target at 21 points on each straight line. The rise grows as the pair becomes less similar (cosine 0.999 gives 1.5x, 0.890 gives 4.6x). If asked about the old test: once both endpoints fit the target, moving along d barely changes the prediction compared with a random direction (2.6x, 6.0x, 13x, 258x), so that comparison cannot detect a barrier; the path profile can.");

  s = S("Results");
  s.addText("Blind starts settle in a worse minimum", { placeholder: "title" });
  table(s, ["Start", "Told the truth?", "Final error (×10⁻⁷)", "× best blind", "Recovery cosine"], [
    ["Gaussian, s.d. 0.01", "no", "3.63", "1.02", "0.917"], ["Gaussian, s.d. 0.1", "no", "3.57", "1.00", "0.918"], ["zeros", "no", "3.57", "1.00", "0.918"],
    ["uniform on [−1, 1]", "no", "3.68", "1.03", "0.907"], ["Gaussian, s.d. 1.0", "no", "3.90", "1.09", "0.894"],
    [{ text: "Gaussian, s.d. 5.0", options: { color: HEX.muted } }, { text: "no", options: { color: HEX.muted } }, { text: "11.5 (not converged)", options: { color: HEX.muted } }, { text: "3.23", options: { color: HEX.muted } }, { text: "0.621", options: { color: HEX.muted } }],
    [{ text: "truth + 1.0 noise", options: { color: HEX.orange, bold: true } }, "yes (control)", "1.74", "0.49", "0.951"],
    [{ text: "truth + 0.5 noise", options: { color: HEX.orange, bold: true } }, "yes (control)", "0.77", "0.22", "0.976"],
  ], { x: 0.5, y: 1.3, w: 7.6, colW: [2.1, 1.4, 1.6, 1.1, 1.4], fontSize: 12.5, rowH: 0.5 });
  card(s, 8.4, 1.3, 4.4, 5.5, HEX.tint);
  txt(s, [{ text: "What it means", options: { bold: true, color: HEX.navy, fontSize: 17, breakLine: true } },
    { text: "Every start a real decoder could use (no knowledge of the answer) ends at almost the same error, 3.6–3.9 × 10⁻⁷, and agrees with the others only at 0.89–1.00.", options: { breakLine: true } },
    { text: " ", options: { breakLine: true } },
    { text: "A deeper minimum exists: starting near the truth reaches 4.6× lower error and recovery 0.976.", options: { breakLine: true } },
    { text: " ", options: { breakLine: true } },
    { text: "Between them the error rises 7.2×, so gradient descent cannot slide from one to the other. Better search, not a better encoder, is what decoding needs.", options: {} }],
    { x: 8.6, y: 1.45, w: 4.0, h: 5.2, fontSize: 14 });
  s.addNotes("Numbers from results/verification/testA.json (Colab T4, 19 Oct 2026). The near-truth starts are controls only: they tell us a deeper minimum exists, which a blind decoder cannot reach by local search.");

  // sensitivity
  s = S("Results");
  s.addText("Errors concentrate in the operator's weakest directions", { placeholder: "title" });
  figure(s, "fig_sensitivity.png", 0.4, 1.3, 8.2, 4.6);
  stat(s, 8.95, 1.5, 3.9, "2.1×", "lower sensitivity along d than the random median (corrected pair; 1.9× originally, shown)", HEX.orange, 44);
  stat(s, 8.95, 3.2, 3.9, "9 / 10", "blind pairs below the random median; d below all 200 random directions", HEX.blue, 44);
  card(s, 0.5, 6.0, 12.3, 0.85, HEX.tint);
  txt(s, "Anisotropic ill-conditioning: what the inverse fails to pin down is what the operator responds to least (corrected pair s = 0.081 vs random 0.122–0.239; actual error 1.8× below).",
    { x: 0.75, y: 6.05, w: 11.8, h: 0.75, fontSize: 14.5, valign: "middle" });
  s.addNotes("Directional sensitivity is a finite-difference probe of the Jacobian. All six pairwise difference directions fall 1.4-2.4× below the random median and below the random minimum. So the inverse is not singular (H1 rejected) but it is anisotropic: some directions are weakly constrained, and that is where different minima differ. This links non-convexity to conditioning.");

  // gain + magnitude
  s = S("Results");
  s.addText("Gain is identifiable; error is not a single scale factor", { placeholder: "title" });
  figure(s, "fig_gain.png", 0.4, 1.3, 7.4, 4.6);
  table(s, ["Quantity", "Value"], [
    ["Direction cosine", "0.8362"], ["Mean norm ratio ‖x̂‖/‖x*‖", "0.747 (sd 0.046)"], ["Norm correlation over time", "0.915"],
    ["Relative error, raw", "0.5516"], ["Relative error after optimal rescale", "0.5675"],
  ], { x: 8.1, y: 1.45, w: 4.7, colW: [3.0, 1.7], fontSize: 13.5 });
  card(s, 8.1, 4.4, 4.7, 1.5, HEX.paleOrange);
  txt(s, "Rescaling makes error slightly worse, so the shortfall is not a global gain. Even ±10% scaling is 7–9× above the noise floor.",
    { x: 8.3, y: 4.45, w: 4.3, h: 1.4, fontSize: 14, valign: "middle" });
  card(s, 0.5, 6.05, 12.3, 0.8, HEX.tint);
  txt(s, "Two simple explanations excluded: the decoder is not merely losing the overall magnitude of the representation.",
    { x: 0.75, y: 6.1, w: 11.8, h: 0.7, fontSize: 14.5, valign: "middle" });
  s.addNotes("Forward-only test: scale the ground truth by alpha and compare the output change to the optimiser's residual floor (1.3e-6). Only alpha = 1 sits within the floor; alpha = 0.9 and 1.1 are 9.2× and 7.5× above it. Separately, rescaling the recovered trajectory to the true norm changes relative error from 0.5516 to 0.5675. Both rule out 'gain is unidentifiable'.");

  // robustness
  s = S("Results");
  s.addText("Robustness: noise, observed cortex and priors", { placeholder: "title" });
  figure(s, "fig_noise.png", 0.4, 1.3, 6.3, 2.6);
  figure(s, "fig_extent.png", 6.8, 1.3, 6.0, 2.6);
  figure(s, "fig_priors.png", 0.4, 4.0, 6.3, 2.85);
  table(s, ["Test", "Result"], [
    ["Noise 0 → 100% of BOLD s.d.", "recovery 0.836 → 0.298, monotone; retrieval ≈ 0.99"],
    ["Observed cortex 50 → 20 484", "0.100 → 0.836; 2 000 random vertices reach 0.777"],
    ["ℓ₂ prior", "best +0.032 at λ = 10⁻⁵, harmful above"],
    ["Smoothness prior", "0.527 → 0.0008"],
    ["Stimulus manifold", "white 0.947 vs smooth 0.942"],
    ["Rate of change, 64×", "0.836–0.858, no trend"],
  ], { x: 6.9, y: 4.05, w: 5.9, colW: [2.4, 3.5], fontSize: 11.5, rowH: 0.45 });
  s.addNotes("The inverse degrades gracefully with noise: direction is kept, magnitude is lost (relative error 0.55 to 2.06). About 10% of cortex carries most of the recoverable signal. Generic priors do not help; priors matched to the operator's weak directions are future work.");

  // baseline
  s = S("Results");
  s.addText("Nonlinear inversion vs a linear decoder", { placeholder: "title" });
  figure(s, "fig_baseline.png", 0.4, 1.3, 6.0, 5.4);
  table(s, ["Ridge λ", "Test cosine"], [["1e-2", "0.0599"], ["1e-1", "0.0310"], ["1e0", "0.0205"], ["1e1", "0.0133"], ["1e2", "0.0103"]],
    { x: 6.9, y: 1.45, w: 3.0, colW: [1.4, 1.6], fontSize: 14 });
  card(s, 6.9, 4.1, 5.9, 2.6, HEX.paleOrange);
  txt(s, [{ text: "Caveat stated plainly.  ", options: { bold: true, color: HEX.navy } },
    { text: "Ridge (240 train / 60 test pairs) predicts the time-averaged representation from time-averaged BOLD, a strictly easier target than the time-resolved trajectory inversion recovers. Read 0.060 as a floor; the 15× gap exceeds what the mismatch can explain." }],
    { x: 7.1, y: 4.2, w: 5.5, h: 2.4, fontSize: 14, valign: "middle" });
  s.addNotes("The operator is strongly nonlinear (transformer + pooling), so a linear decoder fitted on the same forward model barely beats chance. This justifies inverting the operator instead of training a linear readout. The comparison is indicative, not exact, and we say so before they do.");

  // what didn't work
  s = S("Results");
  s.addText("What did not work, reported as such", { placeholder: "title" });
  table(s, ["Experiment", "Outcome", "Why", "How we report it"], [
    ["Optimiser control (SGD, L-BFGS)", "Fits 1.4e-4 / 2.8e-5 vs Adam 3.5e-7", "Hyperparameters did not converge", "Invalid control; limitation"],
    ["Bandwidth sweep", "Flat 0.838–0.858 over 64×", "No HRF operator in the release", "Structural null result"],
    ["Stimulus manifold", "0.947 vs 0.942", "Operator indifferent to prior", "Null result"],
    ["Smoothness prior", "0.527 → 0.0008", "Wrong prior for semantics", "Negative result"],
    ["Original barrier test", "Paired an unconverged solution", "Pair chosen among all 8 starts", "Withdrawn; re-run correctly"],
  ], { x: 0.5, y: 1.35, w: 12.3, colW: [3.0, 3.2, 3.1, 3.0], fontSize: 14, rowH: 0.52 });
  card(s, 0.5, 4.75, 12.3, 2.05, HEX.tint);
  txt(s, "Why this slide exists: the non-convexity claim does not rest on the failed optimiser control. It rests on the straight-path barrier and sensitivity tests (forward passes only), the near-truth control and replication across four ground truths. A converged second optimiser would strengthen it, and is listed as future work.",
    { x: 0.75, y: 4.85, w: 11.8, h: 2.0, fontSize: 16, valign: "middle" });
  s.addNotes("Reviewers often look for what was hidden. Showing it first takes the question away. If pressed on Adam's implicit bias: different initialisation distributions reach different minima reproducibly, and the barrier between them is shown with forward passes; neither depends on Adam.");

  // ============================================================ REGIONAL
  pres.addSection({ title: "Regional analysis" });
  s = S("Regional analysis", "Section");
  s.addText("Regional analysis (neurobiology track)", { placeholder: "title" });
  s.addText("Which networks the operator listens to, and where meaning is recoverable", { placeholder: "body" });

  s = S("Regional analysis");
  s.addText("Six anatomical networks on fsaverage5", { placeholder: "title" });
  figure(s, "brain_rois.png", 0.4, 1.3, 12.5, 3.3);
  table(s, ["Network", "Destrieux labels", "Vertices"], [
    ["Language (L)", "IFG opercular/triangular/orbital, STG lateral, STS, MTG, temporal pole, angular gyrus", "1 282"],
    ["Language homologue (R)", "Same labels, right hemisphere (lateralisation test)", "1 368"],
    ["Auditory", "Heschl's gyrus, transverse temporal sulcus, planum temporale", "277"],
    ["Default mode", "Precuneus, posterior cingulate (dorsal, ventral), anterior cingulate, subparietal", "1 224"],
    ["Visual", "Occipital pole, cuneus, calcarine, middle/superior occipital, lingual", "1 582"],
    ["Somatomotor", "Precentral, postcentral gyri, central sulcus (low-semantic control)", "1 487"],
  ], { x: 0.5, y: 4.7, w: 12.3, colW: [2.4, 8.6, 1.3], fontSize: 11.5, rowH: 0.3 });
  s.addNotes("Atlas: Destrieux et al. (NeuroImage 2010), the anatomical parcellation shipped with Nilearn for fsaverage5 (74 labels per hemisphere); TRIBE v2 vertex order is left 0-10241 then right. Network membership follows Fedorenko et al. 2024 (language) and Buckner et al. 2008 (default mode). Angular gyrus is assigned to language only, so ROIs are disjoint. Somatomotor is the control network that should carry little semantic signal.");

  // topography
  s = S("Regional analysis");
  s.addText("The operator's functional topography matches anatomy", { placeholder: "title" });
  figure(s, "brain_topography_grid.png", 0.3, 1.25, 7.9, 5.6);
  const zrow = n => [n, `${ZS[n].text.z >= 0 ? "+" : ""}${ZS[n].text.z.toFixed(1)}`, `${ZS[n].audio.z >= 0 ? "+" : ""}${ZS[n].audio.z.toFixed(1)}`, `${ZS[n].video.z >= 0 ? "+" : ""}${ZS[n].video.z.toFixed(1)}`];
  const zt = ORDER.map(zrow).map(r => r.map((c, j) => {
    const v = parseFloat(c);
    return j > 0 && v > 5 ? { text: c, options: { bold: true, color: "B03A2E" } } : c;
  }));
  table(s, ["Network", "text z", "audio z", "video z"], zt, { x: 8.4, y: 1.35, w: 4.45, colW: [1.75, 0.9, 0.9, 0.9], fontSize: 12 });
  card(s, 8.4, 4.35, 4.45, 2.45, HEX.tint);
  txt(s, "Each network is dominated by the modality it should be: language and default-mode by text-derived dimensions, auditory cortex by audio, visual cortex by video. Somatomotor is least sensitive overall (0.73× cortex mean).",
    { x: 8.6, y: 4.45, w: 4.1, h: 2.3, fontSize: 13.5, valign: "middle" });
  s.addNotes("Per-vertex forward sensitivity to random perturbations confined to each third of x (text-, audio-, video-derived projector outputs), 16 directions per modality, forward passes only. Map shows each modality's share minus its cortical mean. z-scores compare each network's mean share to 2 000 random vertex sets of the same size; these nulls ignore spatial autocorrelation, so treat the z values as effect sizes and the sign pattern as the result. A spin-permutation test is the stricter next step. This is an independent check that the operator we invert is neuroanatomically sensible.");

  // ROI recovery
  s = S("Regional analysis");
  s.addText(INTERP.recovery_title, { placeholder: "title" });
  figure(s, "fig_roi_recovery.png", 0.4, 1.3, 8.3, 4.6);
  table(s, ["Network", "ROI", "Random", "Δ"], ORDER.map(n => [n, f3(ROW[n].cosine), f3(ROW[`Random |${n}|`].cosine), sg(D(n))]),
    { x: 8.95, y: 1.35, w: 3.9, colW: [1.75, 0.7, 0.75, 0.7], fontSize: 11.5 });
  card(s, 0.5, 6.0, 12.3, 0.85, HEX.tint);
  txt(s, INTERP.recovery_takeaway, { x: 0.75, y: 6.05, w: 11.8, h: 0.75, fontSize: 14, valign: "middle" });
  s.addNotes(INTERP.recovery_notes);

  // per modality recovery
  s = S("Regional analysis");
  s.addText(INTERP.slots_title, { placeholder: "title" });
  figure(s, "fig_roi_slots.png", 0.4, 1.3, 8.4, 4.6);
  card(s, 9.05, 1.4, 3.75, 4.5, HEX.tint);
  txt(s, INTERP.slots_body, { x: 9.25, y: 1.5, w: 3.4, h: 4.3, fontSize: 14 });
  card(s, 0.5, 6.0, 12.3, 0.85, HEX.paleOrange);
  txt(s, INTERP.slots_takeaway, { x: 0.75, y: 6.05, w: 11.8, h: 0.75, fontSize: 14, valign: "middle" });
  s.addNotes(INTERP.slots_notes);

  // predictable vs recoverable
  s = S("Regional analysis");
  s.addText(INTERP.pvr_title, { placeholder: "title" });
  figure(s, "fig_roi_pred_vs_rec.png", 0.4, 1.3, 7.2, 5.5);
  card(s, 7.9, 1.4, 4.9, 5.4, HEX.tint);
  txt(s, INTERP.pvr_body, { x: 8.1, y: 1.55, w: 4.5, h: 5.1, fontSize: 14.5 });
  s.addNotes(INTERP.pvr_notes);

  s = S("Regional analysis");
  s.addText("A partial mechanism: response diversity", { placeholder: "title" });
  figure(s, "fig_roi_dim.png", 0.4, 1.3, 12.5, 4.6);
  card(s, 0.5, 6.0, 12.3, 0.85, HEX.tint);
  txt(s, "Somatomotor spans the most independent input directions (PR 18.6 vs 15.2) and recovers best; visual is concentrated (PR 10.3) and recovers worst. Language and auditory are concentrated too but near their controls: diversity explains the extremes only.",
    { x: 0.75, y: 6.05, w: 11.8, h: 0.75, fontSize: 14, valign: "middle" });
  s.addNotes("Participation ratio from the singular values of each region's response to 128 random input directions (forward passes only). Every anatomical network except somatomotor is less diverse than random vertices of the same count, which is expected: anatomically coherent regions respond in correlated ways. A testable prediction follows: whole-cortex decoding should improve if the loss down-weights high-gain, low-diversity regions such as visual cortex.");

  // synthesis
  s = S("Regional analysis");
  s.addText("What limits semantic decoding from fMRI", { placeholder: "title" });
  const lim = [
    [I.times, "C0392B", "Not destroyed information", "No null space: the error rises 3.8× between equal fits, 7.2× towards a deeper minimum."],
    [I.check, "138A5E", "Non-convexity", "Equally good fits disagree at 0.82 cosine, reproducibly; the answer depends on where the search starts."],
    [I.check, "138A5E", "Anisotropic conditioning", "Disagreement lives in directions the operator barely responds to (0th percentile)."],
    [I.check, "138A5E", "Measurement noise", "Graceful loss of direction, steep loss of magnitude (rel. error 0.55 → 2.06)."],
    [I.check, "138A5E", "Where you look", INTERP.synthesis_where],
  ];
  lim.forEach(([ic, c, h, b], i) => {
    const y = 1.4 + i * 1.08;
    iconBadge(s, 0.7, y + 0.08, 0.7, ic, c);
    txt(s, h, { x: 1.65, y, w: 3.8, h: 0.85, fontSize: 18, bold: true, color: HEX.navy, valign: "middle", fontFace: K.THEME.headFontFace });
    txt(s, b, { x: 5.5, y, w: 7.3, h: 0.85, fontSize: 15, valign: "middle" });
  });
  s.addNotes("The one-slide answer to 'so what did you find?'. Encoding accuracy is not the bottleneck; the geometry of the inverse is. Practical consequence: better decoders on fMRI need better search (multiple restarts, priors learned from language structure, ensembling over minima) more than better encoders.");

  // tabulation
  s = S("Regional analysis");
  s.addText("Tabulation of all results", { placeholder: "title" });
  table(s, ["Claim", "Evidence", "Key number", "Status"], [
    ["Encoding ≠ decoding", "8 independent budgets", "28.4× vs +0.015", "Established"],
    ["Inverse is non-convex", "Fit-matched init control, 4 truths", "min pairwise 0.8165 ± 0.0068", "Established"],
    ["No null space", "Straight-path error, 10 blind pairs", "rise 3.8× (1.5–6.0×); 7.2× to deeper", "Verified 19 Oct"],
    ["Errors in weak directions", "200 random directions", "2.1× below median; 9/10 pairs", "Verified 19 Oct"],
    ["Gain identifiable", "Forward rescaling", "±10% → 7–9× floor", "Established"],
    ["Stable under noise", "7 noise levels", "0.836 → 0.298 monotone", "Established"],
    ["≈10% cortex suffices", "6 extents", "0.777 at 2 000 vertices", "Established"],
    ["Beats linear decoding", "Ridge baseline", "0.918 vs 0.060", "Indicative"],
    ["Anatomical topography", "Sensitivity maps, 6 networks", "z +27 to +41 in matching modality", "Established"],
    ["Regional recoverability", "ROI vs matched random", INTERP.table_key, INTERP.table_status],
    ["Real-data decodability", "LeBel 2023, held-out story", "4/5 segments (chance 2.2%), cosine 0.02", "Established"],
    ["Multi-start on the real model", "Recorded CPU run, 3 starts", "R² 0.995, recovery ≤ 0.51, agreement 0.37", "Demonstrated"],
  ], { x: 0.5, y: 1.3, w: 12.3, colW: [3.0, 3.4, 3.9, 2.0], fontSize: 12.5, rowH: 0.41 });
  s.addNotes("The ledger the panel can interrogate. 'Established' means replicated or tested against a control; 'Indicative' means the comparison has a stated caveat.");

  // ============================================================ REMAINING
  pres.addSection({ title: "Real fMRI" });
  s = S("Real fMRI", "Section");
  s.addText("Validation on real naturalistic fMRI", { placeholder: "title" });
  s.addText("LeBel et al. 2023 · subject UTS03 · held-out story wheretheressmoke", { placeholder: "body" });

    s = S("Real fMRI");
  s.addText("Real-fMRI pipeline", { placeholder: "title" });
  table(s, ["Stage", "What was done", "Check"], [
    ["Data", "UTS03, LeBel et al. 2023 (OpenNeuro ds003020): 6 stories, 66.6 min, 10 363 words, TR 2 s; held-out story = mean of 10 repeats", "Held-out story is TRIBE v2's own test split"],
    ["Registration", "MNI → subject T1 by ANTs SyN; T1 → functional voxels by the pycortex transform", "Visual QC of overlays"],
    ["Surface projection", "TRIBE v2 projector settings: 3-mm ball, 20 points per vertex, trilinear in the cortical mask → sparse 20 484 × 95 556 sampler", "Homotopic r 0.635 vs −0.017 heterotopic (> 97% of pairings); scrambled control at chance"],
    ["Features", "w2v-BERT 2.0 audio + Llama-3.2-3B text, TRIBE v2's own pipeline with the dataset's word timings; 45 segments of 100 s", "Forward re-entry r = 1.0000"],
    ["Alignment", "Lag maximising prediction–response r on the 5 training stories", "Peak at 4 s"],
    ["Evaluation", "Encoding r vs split-half ceiling; forward identification of 20-s windows (194); inversion of 100-s segments ranked among 45; noise-free oracle", "Chance 0.5% and 2.2%"],
  ], { x: 0.5, y: 1.3, w: 12.3, colW: [1.9, 6.6, 3.8], fontSize: 12, rowH: 0.78 });
  s.addNotes("Every tuning choice (lag, the 2 000 analysis vertices) was fitted on the five training stories only. The audio-only CPU run gave the same pattern (5/5 identified, cosine 0.06).");


  // ---- real data (LeBel 2023), results read from lebel/realdata_audio_text.json
  const RD = JSON.parse(fs.readFileSync(require("path").join(R, "realdata_audio_text.json"), "utf8"));
  const RI = RD.identification_forward.top2000, RX = RD.inversion_identification;
  s = S("Real fMRI");
  s.addText("Real fMRI: results on the held-out story (LeBel 2023)", { placeholder: "title" });
  const rs = [["OpenNeuro ds003020", "UTS03 · 6 stories · TR 2 s"], ["Surface projection", "validated sampler → fsaverage5"],
    ["Stimulus features", "LLaMA-3.2-3B text + w2v-BERT audio"], ["Inversion", "held-out BOLD → x̂ through frozen f"],
    ["Identification", "rank the true moment among all stories"]];
  rs.forEach(([t, sub], i) => {
    box(s, 0.5 + i * 2.5, 1.3, 2.25, 1.05, t, sub, i === 3 ? HEX.orange : HEX.navy, "FFFFFF", 13);
    if (i < rs.length - 1) arrow(s, 2.75 + i * 2.5, 1.82, 3.0 + i * 2.5, 1.82);
  });
  figure(s, "fig_realdata_audio_text.png", 0.5, 2.5, 12.3, 2.95);
  const kp = [
    [`${(RD.encoding_r.wheretheressmoke.top2000_by_train).toFixed(2)}`, `encoding r, top 2 000 vertices (${(RD.noise_ceiling.top2000_normalised_r * 100).toFixed(0)}% of noise ceiling)`, HEX.blue],
    [`${(RI.top1 * 100).toFixed(0)}%`, `forward identification of 20-s windows, chance ${(RI.chance_top1 * 100).toFixed(1)}% (${RI.n_candidates} windows)`, HEX.blue],
    [RX ? `${RX.real_bold.ranks.filter(r => r === 0).length}/${RX.n_queries}` : "–", RX ? `held-out segments identified by inverting real BOLD, chance ${(RX.real_bold.chance_top1 * 100).toFixed(1)}%` : "inversion pending", HEX.orange],
    [RX ? RX.real_bold.cos_to_true_x.toFixed(2) : "–", "cosine of x̂ to the true x: the moment is identifiable, the representation is not recovered", HEX.violet],
  ];
  kp.forEach(([b, l, c], i) => stat(s, 0.5 + i * 3.1, 5.4, 2.95, b, l, c, 26));
  s.addNotes("Everything tunable (the 4-s alignment offset, the 2 000 vertices) was fitted on the five training stories; wheretheressmoke is held out and is not in TRIBE v2's training set. Text + audio features (LLaMA-3.2-3B and w2v-BERT, TRIBE v2's own pipeline) on a Colab T4, 2 000 inversion steps. Oracle (inverting the model's own prediction, same budget): 5/5 identified, cosine 0.22, so even noise-free inversion recovers little of x. An earlier audio-only CPU run gave the same pattern (5/5, cosine 0.06). The key real-data finding mirrors the synthetic one: identification succeeds while cosine recovery is low, i.e. the inverse pins down which moment was heard but not the full representation. Avatar fails alignment QC (no lag peak) and is kept only as a distractor, which makes identification harder, not easier.");

  // ---- real data, detail 1: encoding across stories and networks
  const RA = JSON.parse(fs.readFileSync(require("path").join(R, "realdata_audio.json"), "utf8"));
  const NETS = ["Auditory", "Language (L)", "Language homologue (R)", "Default mode", "Somatomotor", "Visual"];
  const SHORT = { "Auditory": "Aud.", "Language (L)": "Lang. L", "Language homologue (R)": "Lang. R", "Default mode": "DMN", "Somatomotor": "SomMot", "Visual": "Visual" };
  const STO = ["wheretheressmoke", "adollshouse", "avatar", "legacy", "souls", "undertheinfluence"];
  s = S("Real fMRI");
  s.addText("Real fMRI: prediction accuracy by story and network", { placeholder: "title" });
  table(s, ["Story", "Top 2 000", ...NETS.map(n => SHORT[n]), "Whole"], STO.map(st => {
    const e = RD.encoding_r[st];
    const lab = st === "wheretheressmoke" ? { text: "wheretheressmoke (held out)", options: { bold: true } } : st;
    return [lab, { text: f2(e.top2000_by_train), options: { bold: true } }, ...NETS.map(n => f2(e[n])), f2(e.whole_cortex)];
  }), { x: 0.5, y: 1.3, w: 12.3, colW: [3.0, 1.2, 1.15, 1.15, 1.15, 1.15, 1.15, 1.15, 1.2], fontSize: 13, rowH: 0.42 });
  card(s, 0.5, 4.5, 6.0, 2.3, HEX.tint);
  txt(s, [{ text: "Held out and in-distribution alike. ", options: { bold: true, color: HEX.navy } },
    { text: `On the held-out story the encoder reaches r = ${f2(RD.encoding_r.wheretheressmoke.top2000_by_train)} on the 2 000 vertices chosen from the other stories, ${(RD.noise_ceiling.top2000_normalised_r * 100).toFixed(0)}% of the split-half noise ceiling (${f2(RD.noise_ceiling.top2000_ceiling)}). Auditory, language and default-mode networks lead; visual and somatomotor trail, as expected for spoken stories.` }],
    { x: 0.7, y: 4.6, w: 5.6, h: 2.1, fontSize: 13.5, valign: "middle" });
  card(s, 6.8, 4.5, 6.0, 2.3, HEX.paleOrange);
  txt(s, [{ text: "Adding language features. ", options: { bold: true, color: HEX.navy } },
    { text: `Text + audio vs audio only on the held-out story: top-2 000 r ${f2(RD.encoding_r.wheretheressmoke.top2000_by_train)} vs ${f2(RA.encoding_r.wheretheressmoke.top2000_by_train)}; default mode ${f2(RD.encoding_r.wheretheressmoke["Default mode"])} vs ${f2(RA.encoding_r.wheretheressmoke["Default mode"])}. One story (avatar) shows no clear alignment peak and is kept only as a distractor, which makes identification harder, not easier.` }],
    { x: 7.0, y: 4.6, w: 5.6, h: 2.1, fontSize: 13.5, valign: "middle" });
  s.addNotes("Pearson r between predicted and measured BOLD per vertex, averaged within each network. The alignment offset (4 s) and the 2 000 vertices were fitted on the five training stories only. Noise ceiling from the ten repeats of the held-out story, split-half with Spearman-Brown correction.");

  // ---- real data, detail 2: identification vs reconstruction, with an oracle
  const RO = RX.oracle_prediction;
  s = S("Real fMRI");
  s.addText("Real fMRI: the inverse identifies, but does not reconstruct", { placeholder: "title" });
  table(s, ["Inversion target", "Top-1 identification", "Ranks of the true segment", "Cosine of x̂ to true x", "Fit (1 − r)"], [
    ["Measured BOLD, held-out story", `${RX.real_bold.ranks.filter(r => r === 0).length} / ${RX.n_queries}`, RX.real_bold.ranks.join(", "), f2(RX.real_bold.cos_to_true_x), f2(RX.real_bold.final_1_minus_r)],
    ["Oracle: model's own prediction", `${RO.ranks.filter(r => r === 0).length} / ${RX.n_queries}`, RO.ranks.join(", "), f2(RO.cos_to_true_x), RO.final_1_minus_r.toFixed(4)],
    ["Chance", `${(RX.real_bold.chance_top1 * 100).toFixed(1)}% (1 of ${RX.real_bold.n_candidates})`, "—", "—", "—"],
  ], { x: 0.5, y: 1.35, w: 12.3, colW: [3.4, 2.3, 2.6, 2.2, 1.8], fontSize: 14, rowH: 0.55 });
  card(s, 0.5, 3.75, 12.3, 3.05, HEX.tint);
  txt(s, [
    { text: "Two limits, separated. ", options: { bold: true, color: HEX.navy, breakLine: true } },
    { text: `Without noise (oracle), inversion identifies every segment yet recovers only ${f2(RO.cos_to_true_x)} of the representation: most of the loss is the operator's conditioning, not measurement noise. With real BOLD, recovery drops further to ${f2(RX.real_bold.cos_to_true_x)} while identification survives (${RX.real_bold.ranks.filter(r => r === 0).length}/${RX.n_queries}, ranked against all 45 segments of six stories, including the other six of the same story).`, options: { breakLine: true } },
    { text: " ", options: { breakLine: true } },
    { text: "This is the synthetic result, reproduced on a real brain: under noise, retrieval stayed near 0.99 while cosine fell. Identification needs only the directions the operator transmits well.", options: {} },
  ], { x: 0.75, y: 3.85, w: 11.8, h: 2.85, fontSize: 15 });
  s.addNotes("Each held-out 100-s segment of measured BOLD is inverted through the frozen model (2 000 Adam steps, correlation loss on the 2 000 training-selected vertices, only the filled modality slots optimised). The recovered x-hat is ranked against the true representations of all 45 segments by mean per-time-step cosine. The oracle inverts the model's own noise-free prediction under the same budget.");

  s = S("Real fMRI");
  s.addText("The same experiment on the real model, recorded", { placeholder: "title" });
  figure(s, "fig_realrun_multistart.png", 0.4, 1.3, 12.5, 3.6);
  stat(s, 0.6, 5.0, 2.9, "0.995", "median per-vertex R² of the fit across cortex", HEX.blue, 30);
  stat(s, 3.7, 5.0, 2.9, "0.51", "best recovery of x after 2 400 steps", HEX.orange, 30);
  stat(s, 6.8, 5.0, 2.9, "0.37", "lowest agreement between the three starts", HEX.violet, 30);
  stat(s, 9.9, 5.0, 2.9, "121×", "error reduction, start 1", HEX.aqua, 30);
  s.addNotes("Three starts (Gaussian 0.01, Gaussian 1.0, uniform) inverted together through frozen TRIBE v2 on CPU, every value logged; cortical maps every 120 steps feed the 'Real run' scene of the live demo. The fit becomes near-perfect across cortex while recovery and agreement stay low, the dissociation and non-convexity seen live on the real model.");

  // ============================================================ STANDARDS / SDG / ETHICS
  pres.addSection({ title: "Standards and SDGs" });
  s = S("Standards and SDGs", "Section");
  s.addText("Standards, ethics and SDG justification", { placeholder: "title" });
  s.addText("Where the work sits against data, reporting and neuro-ethics frameworks", { placeholder: "body" });

  s = S("Standards and SDGs");
  s.addText("Alignment with relevant standards", { placeholder: "title" });
  table(s, ["Standard / framework", "Scope", "How this project aligns"], [
    ["BIDS (Gorgolewski et al., 2016)", "Neuroimaging data organisation", "Real-data phase uses OpenNeuro ds003020, a BIDS dataset; derivatives kept in BIDS layout"],
    ["IEEE P2794 (draft, active PAR 2022)", "Reporting standards for in vivo neural interface research", "Report adopts its minimum-reporting approach: model, data, preprocessing, metrics, failures"],
    ["IEEE P2731 working group", "Unified BCI terminology (functional model)", "Block diagram uses its functional decomposition: acquisition → features → decoding → output"],
    ["FAIR principles (Wilkinson et al., 2016)", "Findable, accessible, interoperable, reusable data", "Seeded scripts, results.json, open model and data; figures regenerated from logs"],
    ["Licences: CC BY-NC 4.0; Llama 3.2 licence; CC0", "TRIBE v2; text encoder; OpenNeuro data", "Non-commercial academic use only; gated access obtained"],
    ["Digital Personal Data Protection Act 2023 (India)", "Personal data processing", "No personal data processed: synthetic ground truth; de-identified public corpus"],
  ], { x: 0.5, y: 1.35, w: 12.3, colW: [3.5, 3.5, 5.3], fontSize: 14, rowH: 0.75 });
  s.addNotes("IEEE P2794 is still a draft (active PAR since Dec 2022), so we say 'adopts its approach' rather than 'complies with'. P2731 is a working group whose functional-model paper (IEEE OJEMB 2021) defines BCI terminology. If asked about ISO/IEC medical-device standards (IEC 62304, ISO 14971): those apply to a deployed device; this is pre-device research, and they would apply at a translation stage.");

  s = S("Standards and SDGs");
  s.addText("Neuro-ethics: what our results imply", { placeholder: "title" });
  [[0.6, I.globe, HEX.blue, "OECD Recommendation on Responsible Innovation in Neurotechnology (2019)", "Calls for safety assessment and protection of personal brain data. Our limits are a form of safety assessment: they quantify how much a decoder on fMRI can actually recover."],
   [4.75, I.lock, HEX.violet, "UNESCO Recommendation on the Ethics of Neurotechnology (adopted 12 Nov 2025)", "Treats neural data as uniquely sensitive and requires informed consent and protection against misuse. No new neural data was collected in this project."],
   [8.9, I.balance, HEX.orange, "Implication of our findings", "Even with a near-perfect forward model, recovery is incomplete, depends on initialisation, and degrades with noise. Claims of fMRI 'mind reading' should be read against these limits."]].forEach(([x, ic, c, h, b]) => {
    card(s, x, 1.4, 3.85, 5.4, HEX.tint);
    iconBadge(s, x + 0.3, 1.65, 0.8, ic, c);
    txt(s, h, { x: x + 0.3, y: 2.6, w: 3.3, h: 1.2, fontSize: 15.5, bold: true, color: HEX.navy });
    txt(s, b, { x: x + 0.3, y: 3.85, w: 3.3, h: 2.8, fontSize: 14 });
  });
  s.addNotes("Conflicting interests from Review I (fidelity vs privacy) are addressed here: our contribution measures fidelity limits, which is exactly the evidence privacy frameworks need. UNESCO adoption date: 12 November 2025, General Conference.");

  s = S("Standards and SDGs");
  s.addText("SDG justification, target by target", { placeholder: "title" });
  table(s, ["SDG target", "Link", "Evidence from this project"], [
    ["3.4  promote mental health and well-being", "Assistive communication for cognitively intact, motor-impaired patients", "Limits tell clinicians what non-invasive fMRI decoding can and cannot deliver; non-convexity points to better search, not bigger encoders"],
    ["9.5  enhance scientific research and technological capability", "Method for characterising neural-interface models", "Reusable, open pipeline: differentiable entry into a 177 M-parameter encoder; runs on free compute"],
    ["10.2  inclusion irrespective of disability", "Communication access as a precondition for inclusion", "Regional result guides which cortex a future low-cost or partial-coverage system should target"],
  ], { x: 0.5, y: 1.35, w: 12.3, colW: [3.3, 3.6, 5.4], fontSize: 15, rowH: 0.88 });
  card(s, 0.5, 5.3, 12.3, 1.5, HEX.paleOrange);
  txt(s, "Honest scope: this is enabling research. The SDG contribution is evidence about what is achievable, not a deployed assistive device.",
    { x: 0.75, y: 5.4, w: 11.8, h: 1.3, fontSize: 16, valign: "middle" });
  s.addNotes("Top rubric band asks for clear justification. Each row links a specific target to a specific project output.");

  // ============================================================ OUTCOMES
  pres.addSection({ title: "Outcomes" });
  s = S("Outcomes", "Section");
  s.addText("Outcomes, mappings and impact", { placeholder: "title" });
  s.addText("Deliverables, demonstration, schedule, cost, contributions and programme mapping", { placeholder: "body" });

  s = S("Outcomes");
  s.addText("Deliverables", { placeholder: "title" });
  [["Manuscript", "IEEE-format paper: “Predictable Is Not Recoverable: Conditioning and Non-Convexity of Inverting a Foundation Brain Encoding Model”. A. Sarkar*, T. Choudhuri* (joint first), S. Nageswaran. Ready for submission.", I.file, HEX.navy],
   ["Final report", "43 pages, VIT 2026 Project-I format: 13 chapters, 16 figures, 19 tables, 42 IEEE references, TRIBE v2 data and why-fMRI sections.", I.book, HEX.blue],
   ["A3 poster", "VIT template, every box filled; print-ready A3 PDF.", I.map, HEX.aqua],
   ["Open repository", "github.com/Ivxn404/semantic-decoding-tribe-inversion: all scripts, logged results, figures, demo video, verification results; MIT-licensed code.", I.db, HEX.violet],
   ["Four Colab notebooks", "Demo & synthetic suite · real fMRI (text + audio) · 10-minute live demo on TRIBE v2 · verification tests.", I.flask, HEX.orange],
   ["Interactive live demo", "Ten-scene presenter page: 3-D cortex, in-browser inversion lab, real-run replay, findings, networks, real-fMRI ranking; works offline.", I.brain, HEX.gold]].forEach(([h, b, ic, c], i) => {
    const x = 0.5 + (i % 2) * 6.2, y = 1.3 + Math.floor(i / 2) * 1.85;
    card(s, x, y, 6.0, 1.7, HEX.tint);
    iconBadge(s, x + 0.2, y + 0.45, 0.8, ic, c);
    txt(s, h, { x: x + 1.2, y: y + 0.12, w: 4.6, h: 0.42, fontSize: 16, bold: true, color: HEX.navy });
    txt(s, b, { x: x + 1.2, y: y + 0.55, w: 4.65, h: 1.1, fontSize: 12.5 });
  });
  s.addNotes("Everything is public except the VIT templates and the gated model weights, which are downloaded from their original sources.");

  s = S("Outcomes");
  s.addText("Live demonstration", { placeholder: "title" });
  table(s, ["Scene", "What the panel sees", "Live?"], [
    ["Question", "Rotating cortex coloured by TRIBE v2's measured text / audio / video sensitivity", "interactive"],
    ["Data · Why fMRI", "Clickable training and test datasets; fMRI vs simulated EEG at 32 / 64 / 128 electrodes", "interactive"],
    ["Live lab", "A small encoder inverted in the browser: starts, spread, noise, observed cortex, prior; sensitivity probe", "computed live"],
    ["Real run", "Replay of three starts through frozen TRIBE v2: target, prediction and R² maps on the cortex", "recorded, real"],
    ["Findings · Regions", "Five findings incl. verified barriers; clickable networks with recovery vs random", "interactive"],
    ["Real fMRI", "Lag, encoding and identification charts; held-out segments ranked among 45", "animated, real"],
    ["Colab Live_Demo", "The real 177 M model inverted on a T4 in ≈ 3 min, with ridge test and sensitivity probe", "computed live"],
  ], { x: 0.5, y: 1.3, w: 9.0, colW: [2.0, 5.5, 1.5], fontSize: 12.5, rowH: 0.62 });
  figure(s, "repo_qr.png", 9.8, 1.4, 3.0, 3.0);
  txt(s, "Repository, demo page and notebooks", { x: 9.8, y: 4.5, w: 3.0, h: 0.5, fontSize: 12.5, align: "center", color: HEX.ink2 });
  s.addNotes("Run-sheet: demo/DEMO_SCRIPT.md. Before the panel arrives: open the offline demo page and run Steps 1-3 of the Colab notebook so the weights are loaded.");

  s = S("Outcomes");
  s.addText("Schedule and milestones: complete", { placeholder: "title" });
  const months = ["Aug", "Sep", "Oct"]; const gx = 4.6, gw = 2.7;
  months.forEach((m, i) => txt(s, m, { x: gx + i * gw, y: 1.35, w: gw, h: 0.35, fontSize: 14, bold: true, color: HEX.navy, align: "center" }));
  [["S1 Literature, formulation", 0, 0.7], ["S2 Instrumentation", 0.4, 1.2], ["S3 Core characterisation", 1.0, 1.7],
   ["S4 Controls and hypothesis tests", 1.4, 2.2], ["S5 Regional analysis", 2.0, 2.4], ["S6 Real-fMRI study", 2.2, 2.7],
   ["S7 Paper, report, poster, demo, verification", 2.3, 3.0]].forEach(([n, a, b], i) => {
    const y = 1.85 + i * 0.62;
    txt(s, n, { x: 0.5, y, w: 4.0, h: 0.45, fontSize: 13.5, valign: "middle" });
    s.addShape("rect", { x: gx, y: y + 0.04, w: gw * 3, h: 0.38, fill: { color: "F3F5F8" }, line: { color: "F3F5F8" } });
    s.addShape("roundRect", { x: gx + a * gw, y: y + 0.04, w: (b - a) * gw, h: 0.38, rectRadius: 0.1, fill: { color: HEX.aqua }, line: { color: HEX.aqua } });
  });
  [[2.45, "Review II · 14 Oct", HEX.orange], [2.62, "Review III", HEX.violet], [2.93, "Final · 29 Oct", HEX.navy]].forEach(([p, l, c], i) => {
    s.addShape("line", { x: gx + p * gw, y: 1.75, w: 0.001, h: 4.45, line: { color: c, width: 1.5, dashType: "dash" } });
    txt(s, l, { x: gx + p * gw - 0.85, y: 6.25 + (i % 2) * 0.3, w: 1.7, h: 0.3, fontSize: 11, bold: true, color: c, align: "center" });
  });
  s.addNotes("All seven stages complete. Manpower: 580 planned person-hours (330 Abhranil, 250 Tanisha).");

  s = S("Outcomes");
  s.addText("Cost analysis", { placeholder: "title" });
  table(s, ["Item", "Estimate in Report I (₹)", "Incurred (₹)", "Remark"], [
    ["Hosted GPU compute (subscription)", "5 500", "0", "Free Colab T4 tier was sufficient"],
    ["Additional on-demand GPU credits", "4 000", "0", "Memory-saving changes avoided paid tiers"],
    ["Cloud storage (≈ 200 GB)", "1 500", "0", "Free quotas and local storage"],
    ["Neuroimaging datasets", "0", "0", "Open licence (OpenNeuro)"],
    ["Pretrained encoder weights", "0", "0", "Open-weight, non-commercial licence"],
    ["Documentation and reprographics", "1 500", "printing", "Report binding, A3 poster"],
    ["Contingency (≈ 15%)", "2 000", "0", "Not required"],
    [{ text: "Total", options: { bold: true } }, { text: "14 500", options: { bold: true } }, { text: "printing only", options: { bold: true } }, ""],
  ], { x: 0.5, y: 1.3, w: 12.3, colW: [4.0, 2.6, 2.0, 3.7], fontSize: 14, rowH: 0.55 });
  txt(s, "Manpower: 580 planned person-hours (330 + 250), as in Report I.", { x: 0.5, y: 6.2, w: 12.3, h: 0.4, fontSize: 14, color: HEX.ink2 });

  s = S("Outcomes");
  s.addText("Individual contributions", { placeholder: "title" });
  [[0.5, "Abhranil Sarkar (23BML0077)", "Computational track", ["Model instrumentation; the differentiable re-entry point", "Inversion engine and optimisation", "Synthetic and control experiments; verification tests", "Real-fMRI pipeline: registration, surface projection, features, evaluation", "Figures, code release, live demo, manuscript and reports"], HEX.blue],
   [6.75, "Tanisha Choudhuri (23BML0081)", "Neurobiological track", ["Functional neuroanatomy; six networks from the Destrieux atlas", "Curation of the LeBel dataset", "Interpretation of the regional and real-data findings", "Ethics and SDG framing", "Reports, reviews and the poster"], HEX.violet]].forEach(([x, n, t, items, c]) => {
    card(s, x, 1.35, 6.05, 5.45, HEX.tint);
    txt(s, n, { x: x + 0.3, y: 1.5, w: 5.5, h: 0.5, fontSize: 19, bold: true, color: HEX.navy, fontFace: K.THEME.headFontFace });
    txt(s, t, { x: x + 0.3, y: 2.0, w: 5.5, h: 0.4, fontSize: 14, bold: true, color: c });
    bullets(s, items, { x: x + 0.3, y: 2.55, w: 5.5, h: 4.1, fontSize: 15 });
  });

  s = S("Outcomes");
  s.addText("PO and PSO mapping", { placeholder: "title" });
  table(s, ["Outcome", "Justification from this project"], [
    ["PO1 Engineering knowledge", "Linear algebra, optimisation and inverse-problem theory applied to a 177 M-parameter neural operator"],
    ["PO2 Problem analysis", "Decoding formulated as an ill-posed inverse problem; causes of incomplete recovery separated by falsifiable tests"],
    ["PO3 Design of solutions", "Inversion pipeline, its controls and the real-fMRI surface projection"],
    ["PO4 Investigation", "Controlled experiments with exact ground truth, matched random controls, verification re-run"],
    ["PO5 Modern tools", "PyTorch, TRIBE v2, ANTs, nilearn, GPU (Colab) computing"],
    ["PO6, PO8 Society and ethics", "Mental-privacy and clinical-use implications; licences and data-use terms respected"],
    ["PO9, PO10 Teamwork, communication", "Two-track team; IEEE manuscript, report, poster, reviews, live demo"],
    ["PO11 Project management", "Seven-stage schedule met at ₹0 compute cost"],
    ["PO12 Life-long learning", "Self-taught foundation models and neuroimaging tools"],
    ["PSO2, PSO3", "Analysis and imaging of biosignals (fMRI) with modern computational tools"],
  ], { x: 0.5, y: 1.3, w: 12.3, colW: [3.6, 8.7], fontSize: 13, rowH: 0.52 });

  s = S("Outcomes");
  s.addText("WP and WK mapping (complex engineering problem)", { placeholder: "title" });
  table(s, ["Attribute", "How the project meets it"], [
    ["WP1 Depth of knowledge", "Neuroscience, fMRI physics, deep learning and inverse-problem theory together"],
    ["WP2 Conflicting requirements", "Decoding fidelity vs non-invasive, low-cost acquisition vs mental privacy"],
    ["WP3 Depth of analysis", "No closed-form inverse; non-convexity separated from information loss by forward-only tests"],
    ["WP4 Familiarity of issues", "Slow, noisy, blurred BOLD; no ground truth in real data"],
    ["WP7 Interdependence", "Anatomical ROI definition and computation depend on each other"],
    ["WK3 / WK4", "Signals and systems; inverse problems and conditioning"],
    ["WK5 / WK6", "Design of the inversion and projection pipeline; modern computational tools"],
    ["WK8", "Current research literature (2023–2026 encoders and decoders)"],
  ], { x: 0.5, y: 1.3, w: 12.3, colW: [3.4, 8.9], fontSize: 14, rowH: 0.6 });

  s = S("Outcomes");
  s.addText("Social and environmental impact", { placeholder: "title" });
  card(s, 0.5, 1.35, 6.05, 5.45, HEX.tint);
  txt(s, [{ text: "Social", options: { bold: true, color: HEX.navy, fontSize: 19, breakLine: true } },
    { text: "Concerns people who keep comprehension but lose speech; measuring what fMRI decoding can and cannot recover directs effort towards approaches that can work and away from over-promising.", options: { breakLine: true } },
    { text: " ", options: { breakLine: true } },
    { text: "Mental privacy: a near-perfect encoder identifies which known moment was heard but does not reconstruct the representation, evidence for neural-data policy (OECD 2019, UNESCO 2025). No new human data collected.", options: {} }],
    { x: 0.75, y: 1.5, w: 5.6, h: 5.2, fontSize: 15 });
  card(s, 6.75, 1.35, 6.05, 5.45, HEX.paleAqua);
  txt(s, [{ text: "Environmental", options: { bold: true, color: HEX.navy, fontSize: 19, breakLine: true } },
    { text: "Re-used a pretrained model instead of training a foundation encoder, avoiding its large energy cost.", options: { breakLine: true } },
    { text: " ", options: { breakLine: true } },
    { text: "All computation ran on one shared cloud GPU and CPUs for a modest number of GPU-hours; the public release lets others reproduce results without re-running everything.", options: {} }],
    { x: 7.0, y: 1.5, w: 5.6, h: 5.2, fontSize: 15 });

  s = S("Outcomes");
  s.addText("Limitations", { placeholder: "title" });
  bullets(s, [
    "Synthetic ground truth lives in a random low-dimensional subspace, not real language embeddings; qualitative findings are expected to transfer, absolute values may not.",
    "Inversion targets the aggregated representation x, one stage after raw LLaMA embeddings.",
    "All solutions from Adam; the SGD / L-BFGS control did not converge under the settings tried.",
    "No haemodynamic operator in the released model, so temporal bandwidth limits cannot be measured.",
    "Release ships only the shared 'average subject' layer, so per-subject analysis is not possible with public weights.",
    "Regional z-scores use a random-vertex null that ignores spatial autocorrelation; a spin test is stricter.",
    "Regional inversion uses one ground truth and one budget (8 000 steps, CPU); comparisons are internal to that run, and faster convergence cannot yet be separated from a better optimum.",
    "Real-data test: one subject (UTS03), one held-out story, 5 inversion queries; per-network inversion on real data needs held-out stories from more subjects.",
    "Corrected barrier test so far on one ground truth (four-truth repeat optional); original perturbation test withdrawn.",
  ], { x: 0.6, y: 1.35, w: 12.1, h: 5.5, fontSize: 14.5 });
  s.addNotes("State limitations before they are raised. None of them affects the central claims (dissociation, non-convexity, rejected null space), which were replicated or re-verified with optimiser-independent forward passes.");


  s = S("Outcomes");
  s.addText("Future work", { placeholder: "title" });
  [["Real data at scale", "Inversion across all eight LeBel subjects; per-network real-data test on genuinely held-out stories."],
   ["Better search", "Optimisers and priors matched to the operator's weak directions; restarts and ensembling over minima; loss re-weighting away from high-gain, low-diversity regions."],
   ["Earlier entry point", "Invert the raw extractor features and add an explicit haemodynamic model."],
   ["Stricter statistics", "Barrier test on four ground truths; spin-permutation nulls for regional z-scores; a converged second-order optimiser control."],
   ["Other modalities", "Apply the same identifiability tests to EEG and MEG encoders as they appear."]].forEach(([h, b], i) => {
    const y = 1.35 + i * 1.08;
    badge(s, 0.7, y + 0.12, 0.62, String(i + 1), i % 2 ? HEX.blue : HEX.navy, 16);
    txt(s, h, { x: 1.6, y, w: 3.4, h: 0.85, fontSize: 17, bold: true, color: HEX.navy, valign: "middle", fontFace: K.THEME.headFontFace });
    txt(s, b, { x: 5.1, y, w: 7.7, h: 0.85, fontSize: 14.5, valign: "middle" });
  });

  s = S("Outcomes");
  s.addText("Conclusion", { placeholder: "title" });
  card(s, 0.6, 1.35, 12.1, 1.5, HEX.navy);
  txt(s, "A near-perfect brain encoder does not by itself make meaning recoverable from fMRI. Recoverability has to be measured, not inferred from predictivity.",
    { x: 0.85, y: 1.45, w: 11.6, h: 1.3, fontSize: 20, bold: true, color: "FFFFFF", valign: "middle", fontFace: K.THEME.headFontFace });
  bullets(s, [
    "Encoding error falls 28.4× while recovery saturates at 0.944: accuracy does not certify decoding",
    "Equal fits disagree (0.817) and are separated by barriers (3.8×; 7.2× to a deeper minimum): the inverse is non-convex",
    "What is not recovered lies in the operator's weakest directions (2.1× below random)",
    "Visual cortex, the most responsive, recovers worst (−0.125); somatomotor, the least, best (+0.102)",
    "Real fMRI: 56% of the noise ceiling; 4 of 5 held-out segments identified among 45, yet cosine 0.02",
    "Everything is released: manuscript, report, poster, code, results, live demo and four notebooks",
  ], { x: 0.85, y: 3.15, w: 11.6, h: 3.6, fontSize: 18.5 });
  s.addNotes("Close with the one-sentence finding, then stop.");


  // ============================================================ BACKUP
  pres.addSection({ title: "Backup: anticipated questions" });
  s = S("Backup: anticipated questions", "Section");
  s.addText("Backup  ·  Anticipated questions", { placeholder: "title" });
  s.addText("Slides held in reserve for the viva", { placeholder: "body" });
  const qa = (title, pairs, note) => {
    const sl = S("Backup: anticipated questions");
    sl.addText(title, { placeholder: "title" });
    const n = pairs.length, h = (5.5 - 0.2 * (n - 1)) / n;
    pairs.forEach(([q, a], i) => {
      const y = 1.35 + i * (h + 0.2);
      card(sl, 0.5, y, 12.3, h, i % 2 ? "F6F8FB" : HEX.tint);
      txt(sl, q, { x: 0.75, y: y + 0.1, w: 11.8, h: 0.45, fontSize: 16, bold: true, color: HEX.navy });
      txt(sl, a, { x: 0.75, y: y + 0.55, w: 11.8, h: h - 0.6, fontSize: 15 });
    });
    sl.addNotes(note);
  };
  qa("Q: Is the non-convexity just Adam?", [
    ["Couldn't Adam's implicit bias create the different answers?", "The barrier is shown with forward passes only: the error along the straight line between two equal fits rises 3.8×. The weak-direction result is a Jacobian probe. Neither involves an optimiser. Different initialisation distributions reach different minima reproducibly across four ground truths."],
    ["Then why did SGD and L-BFGS give different answers?", "They never reached comparable fit (1.4e-4 and 2.8e-5 vs 3.5e-7), so they are not valid comparisons. We report the control as failed rather than interpret it."],
    ["What would settle it?", "A tuned second-order method reaching ~1e-7 fit from the same initialisations. Listed as future work."],
  ], "Keep this answer short and calm: the claim rests on optimiser-independent tests.");
  qa("Q: Regional analysis details", [
    ["Why Destrieux and not Glasser or Schaefer?", "Destrieux ships with Nilearn on the same fsaverage5 mesh TRIBE predicts on, with standard anatomical names. Network membership comes from the language (Fedorenko) and default-mode (Buckner) literature. HCP-MMP (Glasser) is a natural robustness check."],
    ["Are the regional differences just ROI size?", "No: every ROI is compared with a random vertex set of exactly the same size, and two networks have a second random seed to bound control variability."],
    ["Why no left-lateralisation of language?", "The release is an average-subject model; TRIBE v2's own paper finds lateralisation in contrasts (sentences vs word lists), not in raw sensitivity. Our homologue result is consistent with bilateral responses to natural speech."],
  ], "If asked for the null of the z-scores: random-vertex sets of the same size, 2 000 draws; a spin test respects spatial autocorrelation and is the stricter next step.");
  qa("Q: The surprising regional result", [
    ["How can 1 487 somatomotor vertices beat the whole cortex (0.851 vs 0.836)?", "With a uniform MSE, the whole-cortex loss is dominated by high-gain, low-diversity regions such as visual cortex, which steer the search badly. Observing only diverse, low-gain vertices removes that pull. It suggests re-weighting the objective, a testable next step."],
    ["Isn't the visual result an artefact of the synthetic video dimensions?", "Visual cortex is worse than its matched control on text- and audio-derived dimensions too (−0.12 and −0.14), so it is not specific to the video third of x."],
    ["Would it hold at convergence?", "Unknown: all regional runs use one 8 000-step budget and one ground truth. Faster convergence and a better optimum cannot yet be separated; we claim relative differences within the run."],
  ], "Values: visual text −0.123, audio −0.139, video −0.115 relative to matched random; somatomotor +0.098, +0.126, +0.085.");
  qa("Q: What does 0.82 cosine mean? Is any of this real?", [
    ["Is 0.82 good or bad?", "It is the agreement between two equally good answers, so it bounds how reproducible a single decoded answer is. It is a property of the inverse, not a score to maximise."],
    ["Your results are all synthetic. Are they real findings?", "They are exact measurements of a real, published operator, and the real-fMRI test on a held-out story shows the same pattern: identification 4/5, cosine 0.02."],
    ["Why should a clinician care?", "Because the bottleneck is search, not encoder size: better decoders will come from restarts, ensembling over minima and language-derived priors."],
  ], "Return to the conclusion slide after this one if the discussion drifts.");
  qa("Q: Why fMRI, not EEG? Why TRIBE v2?", [
    ["Why not EEG?", "Brain2Qwerty (Lévy et al., arXiv 2502.17480): 32% character error with MEG vs 67% with EEG on the same architecture."],
    ["Why not simultaneous EEG–fMRI?", "The best open simultaneous dataset (NKI, 22 adults) has rest, Inscapes and short movie clips, no sustained language: data-limited, not method-limited."],
    ["Why TRIBE v2?", "Largest open-weight encoder: 451.6 h training, 1 117.7 h evaluation across 720 subjects, all 20 484 cortical vertices, first at Algonauts 2025."],
  ], "Same answers as Review II, kept for continuity.");

  qa("Q: Your barrier result changed. Why should we trust it now?", [
    ["What was wrong?", "The original test picked the least similar pair among all eight starts, which included an unconverged one (Gaussian s.d. 5, error 3.2× the best). Its 2.6× → 0.6× numbers are withdrawn."],
    ["What did the re-run do?", "Eight starts for 14 000 steps on a T4; only the five blind starts within 2× were compared; the error was measured at 21 points on each straight line between them. All ten pairs rise (1.5–6.0×, median 3.8×)."],
    ["Does it change the conclusion?", "No, it strengthens it: equal fits are separate minima, and near-truth starts reveal a deeper minimum 7.2× barrier away. The selection rule is fixed in the code and the results are in the repository."],
  ], "Say it plainly: we found and fixed our own error before submission, and the corrected test is cleaner.");

  pres.addSection({ title: "References" });
  s = S("References");
  s.addText("References", { placeholder: "title" });
  txt(s, [
    "[1] T. Naselaris, K. N. Kay, S. Nishimoto, J. L. Gallant, “Encoding and decoding in fMRI,” NeuroImage, vol. 56, no. 2, pp. 400–410, 2011.",
    "[2] A. G. Huth et al., “Natural speech reveals the semantic maps that tile human cerebral cortex,” Nature, vol. 532, pp. 453–458, 2016.",
    "[3] R. Antonello, A. Vaidya, A. G. Huth, “Scaling laws for language encoding models in fMRI,” in Proc. NeurIPS, vol. 36, 2023.",
    "[4] J. Tang, A. LeBel, S. Jain, A. G. Huth, “Semantic reconstruction of continuous language from non-invasive brain recordings,” Nat. Neurosci., vol. 26, pp. 858–866, 2023.",
    "[5] A. LeBel et al., “A natural language fMRI dataset for voxelwise encoding models,” Sci. Data, vol. 10, art. 555, 2023.",
    "[6] J. Lévy, M. Zhang, S. Pinet, J. Rapin, H. Banville, S. d’Ascoli, J.-R. King, “Brain-to-text decoding: A non-invasive approach via typing,” arXiv:2502.17480, 2025.",
    "[7] S. d’Ascoli et al., “A foundation model of vision, audition, and language for in-silico neuroscience,” arXiv:2605.04326, 2026.",
    "[8] P. C. Hansen, Discrete Inverse Problems: Insight and Algorithms. Philadelphia, PA: SIAM, 2010.",
    "[9] C. Destrieux, B. Fischl, A. Dale, E. Halgren, “Automatic parcellation of human cortical gyri and sulci using standard anatomical nomenclature,” NeuroImage, vol. 53, no. 1, pp. 1–15, 2010.",
    "[10] E. Fedorenko, A. A. Ivanova, T. I. Regev, “The language network as a natural kind within the broader landscape of the human brain,” Nat. Rev. Neurosci., vol. 25, pp. 289–312, 2024.",
    "[11] R. L. Buckner, J. R. Andrews-Hanna, D. L. Schacter, “The brain’s default network,” Ann. N.Y. Acad. Sci., vol. 1124, pp. 1–38, 2008.",
    "[12] K. J. Gorgolewski et al., “The brain imaging data structure,” Sci. Data, vol. 3, art. 160044, 2016.",
    "[13] M. D. Wilkinson et al., “The FAIR Guiding Principles for scientific data management and stewardship,” Sci. Data, vol. 3, art. 160018, 2016.",
    "[14] IEEE P2731 Working Group, “A functional model for unifying brain computer interface terminology,” IEEE Open J. Eng. Med. Biol., vol. 2, 2021.",
    "[15] OECD, Recommendation of the Council on Responsible Innovation in Neurotechnology, OECD/LEGAL/0457, 2019.",
    "[16] UNESCO, Recommendation on the Ethics of Neurotechnology, adopted 12 Nov. 2025.",
    "[17] D. P. Kingma, J. Ba, “Adam: A method for stochastic optimization,” in Proc. ICLR, 2015.",
    "[18] J. L. Gardner, T. Liu, “Inverted encoding models reconstruct an arbitrary model response, not the stimulus,” eNeuro, vol. 6, no. 2, ENEURO.0363-18.2019, 2019.",
    "[19] Bladon, Bent, “Feature visualization recovers known cortical selectivity from TRIBE v2,” arXiv:2605.13904, 2026.",
    "[20] Y. Benchetrit et al., “Boosting brain-to-image decoding with TRIBE v2 data augmentation,” arXiv:2606.06345, 2026.",
    "[21] K. N. Kay, T. Naselaris, R. J. Prenger, J. L. Gallant, “Identifying natural images from human brain activity,” Nature, vol. 452, pp. 352–355, 2008.",
    "[22] A. Défossez, C. Caucheteux, J. Rapin, O. Kabeli, J.-R. King, “Decoding speech perception from non-invasive brain recordings,” Nat. Mach. Intell., vol. 5, pp. 1097–1107, 2023.",
    "[23] A. T. Gifford et al., “The Algonauts Project 2025 challenge: How the human brain makes sense of multimodal movies,” arXiv:2501.00504, 2025.",
    "[24] B. Lahner et al., “Modeling short visual events through the BOLD Moments video fMRI dataset and metadata,” Nat. Commun., vol. 15, art. 6241, 2024.",
    "[25] H. Wen, J. Shi, Y. Zhang, K.-H. Lu, J. Cao, Z. Liu, “Neural encoding and decoding with deep learning for dynamic natural vision,” Cereb. Cortex, vol. 28, no. 12, pp. 4136–4160, 2018.",
  ].join("\n"), { x: 0.5, y: 1.3, w: 12.3, h: 5.6, fontSize: 10.5, paraSpaceAfter: 1.5 });
  s = S("References");
  s.addText("References (continued)", { placeholder: "title" });
  txt(s, [
    "[26] T. M. Mitchell et al., “Predicting human brain activity associated with the meanings of nouns,” Science, vol. 320, no. 5880, pp. 1191–1195, 2008.",
    "[27] J. Hadamard, “Sur les problèmes aux dérivées partielles et leur signification physique,” Princeton Univ. Bull., vol. 13, pp. 49–52, 1902.",
    "[28] N. K. Logothetis, “What we can do and what we cannot do with fMRI,” Nature, vol. 453, pp. 869–878, 2008.",
    "[29] C. M. Michel et al., “EEG source imaging,” Clin. Neurophysiol., vol. 115, no. 10, pp. 2195–2222, 2004.",
    "[30] Q. K. Telesford et al., “An open-access dataset of naturalistic viewing using simultaneous EEG-fMRI,” Sci. Data, vol. 10, art. 554, 2023.",
    "[31] G. J. Brouwer, D. J. Heeger, “Decoding and reconstructing color from responses in human visual cortex,” J. Neurosci., vol. 29, no. 44, pp. 13992–14003, 2009.",
    "[32] A. Mahendran, A. Vedaldi, “Understanding deep image representations by inverting them,” in Proc. IEEE CVPR, 2015, pp. 5188–5196.",
    "[33] P. S. Scotti et al., “MindEye2: Shared-subject models enable fMRI-to-image with 1 hour of data,” in Proc. ICML, 2024.",
    "[34] B. Fischl, M. I. Sereno, R. B. H. Tootell, A. M. Dale, “High-resolution intersubject averaging and a coordinate system for the cortical surface,” Hum. Brain Mapp., vol. 8, no. 4, pp. 272–284, 1999.",
    "[35] B. B. Avants, C. L. Epstein, M. Grossman, J. C. Gee, “Symmetric diffeomorphic image registration with cross-correlation,” Med. Image Anal., vol. 12, no. 1, pp. 26–41, 2008.",
    "[36] J. S. Gao, A. G. Huth, M. D. Lescroart, J. L. Gallant, “Pycortex: An interactive surface visualizer for fMRI,” Front. Neuroinform., vol. 9, art. 23, 2015.",
    "[37] Y.-A. Chung et al., “W2v-BERT: Combining contrastive learning and masked language modeling for self-supervised speech pre-training,” in Proc. IEEE ASRU, 2021, pp. 244–250.",
    "[38] A. Grattafiori et al., “The Llama 3 herd of models,” arXiv:2407.21783, 2024.",
    "[39] P. Gao et al., “A theory of multineuronal dimensionality, dynamics and measurement,” bioRxiv 214262, 2017.",
    "[40] A. Paszke et al., “PyTorch: An imperative style, high-performance deep learning library,” in Proc. NeurIPS, vol. 32, 2019.",
    "[41] A. Abraham et al., “Machine learning for neuroimaging with scikit-learn,” Front. Neuroinform., vol. 8, art. 14, 2014.",
  ].join("\n"), { x: 0.5, y: 1.3, w: 12.3, h: 5.6, fontSize: 11, paraSpaceAfter: 2 });
  s.addNotes("IEEE format. OECD and UNESCO entries are normative instruments, cited as such.");

  await pres.writeFile({ fileName: require("path").join(__dirname, "Final_Sarkar_Choudhuri.pptx") });
  await applyTheme(require("path").join(__dirname, "Final_Sarkar_Choudhuri.pptx"), K.THEME);
  console.log("written");
})();
