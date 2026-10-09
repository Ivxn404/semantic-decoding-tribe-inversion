const pptxgen = require("pptxgenjs");
const { applyTheme } = require("/mnt/skills/public/pptx/scripts/apply_theme.js");
const fa = require("react-icons/fa");
const K = require("./common");
const { addNovelty } = require("./novelty");
const { HEX, txt, bullets, card, badge, iconBadge, stat, figure, caption, table, arrow, box } = K;

const FOOT = "BECE497J Project-I  ·  Review II  ·  A. Sarkar (23BML0077)  ·  T. Choudhuri (23BML0081)";

(async () => {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE";
  pres.author = "Abhranil Sarkar, Tanisha Choudhuri";
  pres.title = "Review II: Conditioning and Non-Convexity of Semantic Decoding";
  pres.theme = { headFontFace: K.THEME.headFontFace, bodyFontFace: K.THEME.bodyFontFace };
  K.defineLayouts(pres, FOOT);

  const I = {};
  for (const [k, comp] of Object.entries({ brain: fa.FaBrain, chair: fa.FaWheelchair, chip: fa.FaMicrochip,
    scale: fa.FaBalanceScale, search: fa.FaSearch, flask: fa.FaFlask, check: fa.FaCheck, chart: fa.FaChartLine,
    lock: fa.FaLock, globe: fa.FaGlobeAsia, users: fa.FaUsers, cogs: fa.FaCogs, db: fa.FaDatabase,
    bulb: fa.FaLightbulb, warn: fa.FaExclamationTriangle, target: fa.FaBullseye, layers: fa.FaLayerGroup,
    hands: fa.FaHandsHelping, industry: fa.FaIndustry, heart: fa.FaHeartbeat }))
    I[k] = await K.iconPng(comp, "#FFFFFF");

  const S = (sec, layout = "Content") => pres.addSlide({ masterName: layout, sectionTitle: sec });

  // =========================================================== 1 TITLE
  pres.addSection({ title: "Opening" });
  let s = S("Opening", "Title");
  s.addText("Conditioning and Non-Convexity of Semantic Decoding by Inversion of Deep Brain Encoding Models", { placeholder: "title" });
  s.addText([
    { text: "Project-I (BECE497J)  ·  Review II  ·  40% milestone", options: { breakLine: true, bold: true, color: "FFFFFF" } },
    { text: "Abhranil Sarkar (23BML0077)   ·   Tanisha Choudhuri (23BML0081)", options: { breakLine: true } },
    { text: "Guide: Dr. Sharmila Nageswaran, Associate Professor, School of Electronics Engineering", options: { breakLine: true } },
    { text: "Panel SBT_PANEL_3  ·  TT501  ·  14 October 2026", options: {} },
  ], { placeholder: "body" });
  s.addNotes("Open with one sentence: we take Meta's open-weight brain encoder, which predicts fMRI from meaning, and run it backwards to measure how much meaning can actually be recovered from brain activity. Then say what Review II covers: literature and gap, objectives, the analytical model, implementation, and preliminary results that already exceed the 40% milestone.");

  // =========================================================== 2 AT A GLANCE
  s = S("Opening");
  s.addText("Where the project stands at Review II", { placeholder: "title" });
  stat(s, 0.6, 1.45, 2.9, "177 M", "parameter brain encoder made differentiable end-to-end from its feature boundary", HEX.blue);
  stat(s, 3.7, 1.45, 2.9, "20 484", "cortical vertices recovered from, on the fsaverage5 surface", HEX.blue);
  stat(s, 6.8, 1.45, 2.9, "28×", "fall in encoding error while decoding recovery saturates", HEX.orange);
  stat(s, 9.9, 1.45, 2.9, "26", "experimental stages logged with exact ground truth", HEX.aqua);
  // progress bar
  txt(s, "Completion against the project plan", { x: 0.6, y: 3.75, w: 8, h: 0.35, fontSize: 15, bold: true, color: HEX.navy });
  const phases = [["Formulation", 1, HEX.aqua], ["Instrumentation", 1, HEX.aqua], ["Core characterisation", 1, HEX.aqua],
    ["Controls & validation", 0.4, HEX.gold], ["Regional analysis", 0.2, HEX.gold], ["Real-data study", 0, HEX.line], ["Write-up", 0, HEX.line]];
  let px = 0.6; const pw = 12.1 / phases.length;
  phases.forEach(([n, f, c]) => {
    s.addShape("rect", { x: px, y: 4.2, w: pw - 0.06, h: 0.42, fill: { color: "E4E8EE" }, line: { color: "E4E8EE" } });
    if (f > 0) s.addShape("rect", { x: px, y: 4.2, w: (pw - 0.06) * f, h: 0.42, fill: { color: c }, line: { color: c } });
    txt(s, n, { x: px, y: 4.7, w: pw - 0.1, h: 0.5, fontSize: 12, color: HEX.ink2 });
    px += pw;
  });
  card(s, 0.6, 5.45, 12.1, 1.35, HEX.tint);
  txt(s, [{ text: "Status: ≈ 45% complete. ", options: { bold: true, color: HEX.navy } },
    { text: "The method, the analytical model and the core synthetic characterisation are finished and reproducible. Controls, regional analysis and the real-data study are scheduled for Review III and the final review." }],
    { x: 0.85, y: 5.6, w: 11.6, h: 1.1, fontSize: 16, valign: "middle" });
  s.addNotes("The 40% requirement is met with margin. Formulation, instrumentation and the core characterisation (convergence, encoding-decoding dissociation, noise, spatial extent, priors, bandwidth) are complete. If asked how 45% is computed: it is the share of planned person-hours in Table-3 of Report I attached to completed activities. Do not over-claim the remaining phases.");

  // =========================================================== SECTION: PROBLEM
  pres.addSection({ title: "Problem" });
  s = S("Problem", "Section");
  s.addText("1  ·  Problem and motivation", { placeholder: "title" });
  s.addText("Why decoding meaning from brain activity matters, and why it is harder than predicting brain activity", { placeholder: "body" });

  // 3 motivation
  s = S("Problem");
  s.addText("An open problem with conflicting interests", { placeholder: "title" });
  const mot = [
    [I.chair, HEX.blue, "Clinical need", "ALS, brainstem stroke, locked-in syndrome and severe aphasia can leave comprehension intact while removing speech and writing. A non-invasive decoder would restore a channel without neurosurgery."],
    [I.chip, HEX.orange, "Engineering goal", "Maximise decoding fidelity from fMRI, a measurement that is slow (seconds), spatially blurred and indirect: it records blood oxygenation, not neurons."],
    [I.lock, HEX.violet, "Ethical constraint", "Neural data is uniquely private. Higher fidelity and stronger mental privacy pull in opposite directions; a system tuned only for accuracy may be clinically or socially unacceptable."],
  ];
  mot.forEach(([ic, c, h, b], i) => {
    const x = 0.6 + i * 4.1;
    card(s, x, 1.5, 3.85, 4.6, HEX.tint);
    iconBadge(s, x + 0.3, 1.8, 0.85, ic, c);
    txt(s, h, { x: x + 0.3, y: 2.85, w: 3.3, h: 0.5, fontSize: 20, bold: true, color: HEX.navy, fontFace: K.THEME.headFontFace });
    txt(s, b, { x: x + 0.3, y: 3.45, w: 3.3, h: 2.5, fontSize: 15, color: HEX.ink });
  });
  txt(s, "This is the open-ended, multi-stakeholder problem the capstone rubric asks for: electronics/signal processing meets biomedicine and ethics.",
    { x: 0.6, y: 6.35, w: 12.1, h: 0.45, fontSize: 14, italic: true, color: HEX.ink2 });
  s.addNotes("Three stakeholders, three objectives that cannot all be maximised at once. This maps to WP2 (conflicting requirements) in Report I. If asked for patient numbers, do not quote figures you cannot source; say the motivation is the existence of a cognitively intact but motor-locked population, documented in the BCI literature (e.g. Willett et al. 2023 for invasive speech BCIs).");

  // 4 encoding vs decoding
  s = S("Problem");
  s.addText("Encoding predicts the brain; decoding inverts it", { placeholder: "title" });
  box(s, 0.7, 1.7, 2.6, 1.2, "Stimulus meaning", "words heard, story context", HEX.navy);
  box(s, 5.35, 1.7, 2.6, 1.2, "Encoding model", "learned from fMRI", HEX.blue);
  box(s, 10.0, 1.7, 2.6, 1.2, "Predicted BOLD", "20 484 vertices", HEX.navy);
  arrow(s, 3.35, 2.3, 5.3, 2.3, HEX.blue, 2.5); arrow(s, 8.0, 2.3, 9.95, 2.3, HEX.blue, 2.5);
  txt(s, "ENCODING  (well studied, highly accurate)", { x: 3.35, y: 1.25, w: 6.6, h: 0.35, fontSize: 13, bold: true, color: HEX.blue, align: "center" });
  arrow(s, 9.95, 3.85, 8.0, 3.85, HEX.orange, 2.5); arrow(s, 5.3, 3.85, 3.35, 3.85, HEX.orange, 2.5);
  box(s, 5.35, 3.25, 2.6, 1.2, "Inverse", "this project", HEX.orange);
  txt(s, "DECODING  (the inverse problem: is it well posed?)", { x: 3.35, y: 4.55, w: 6.6, h: 0.35, fontSize: 13, bold: true, color: HEX.orange, align: "center" });
  card(s, 0.7, 5.2, 11.9, 1.55, HEX.tint);
  txt(s, [{ text: "Key point.  ", options: { bold: true, color: HEX.navy } },
    { text: "A forward model can be highly accurate and still be hard or impossible to invert: accuracy in the forward direction says nothing about conditioning, uniqueness or stability of the inverse (Hadamard's three conditions for a well-posed problem [14]). Nobody has measured these properties for a modern deep brain encoder." }],
    { x: 0.95, y: 5.35, w: 11.4, h: 1.3, fontSize: 16, valign: "middle" });
  s.addNotes("Analogy for non-specialist panel members: blurring a photo is easy; un-blurring it is not, because the blur destroys information. fMRI is a heavy blur of neural activity. The question is not 'can we build a decoder' but 'how much information survives the forward map, and can it be recovered'. Hadamard (1902): a problem is well posed if a solution exists, is unique, and depends continuously on the data.");

  // =========================================================== SECTION: LITERATURE
  pres.addSection({ title: "Literature" });
  s = S("Literature", "Section");
  s.addText("2  ·  Literature survey and research gap", { placeholder: "title" });
  s.addText("Two decades of encoding and decoding, and the question that was skipped", { placeholder: "body" });

  // 5 lit I
  s = S("Literature");
  s.addText("Literature survey I: encoding and decoding with fMRI", { placeholder: "title" });
  table(s, ["Work", "Contribution", "Limitation relevant to us"], [
    ["Mitchell et al., Science 2008 [1]", "Linear model predicts fMRI for unseen nouns from word co-occurrence features", "Single words, hand-built features, linear"],
    ["Kay et al., Nature 2008 [2]", "Identified viewed images by matching measured to predicted responses", "Identification among candidates, not recovery"],
    ["Naselaris et al., NeuroImage 2011 [3]", "Unified framework: encoding models as the route to decoding", "Assumes invertibility; not characterised"],
    ["Huth et al., Nature 2016 [4]", "Voxelwise semantic maps tiling cortex from natural speech", "Linear encoding; no inverse analysis"],
    ["Antonello, Vaidya & Huth, NeurIPS 2023 [5]", "Encoding accuracy scales log-linearly with model size and data", "Scaling shown for encoding only"],
    ["Tang et al., Nat. Neurosci. 2023 [6]", "Continuous language reconstructed from fMRI via LM-guided search", "Decoder trained per subject (~16 h); search, not inversion"],
    ["LeBel et al., Sci. Data 2023 [7]", "Open naturalistic-listening fMRI corpus (8 subjects, ~86 h)", "Our real-data target (final phase)"],
  ], { x: 0.5, y: 1.35, w: 12.3, colW: [3.1, 5.2, 4.0], fontSize: 15, rowH: 0.62 });
  s.addNotes("Arc of the field: from linear features (Mitchell) to identification (Kay) to semantic maps (Huth) to full reconstruction (Tang). Every step improved encoding or trained a separate decoder. Antonello 2023 showed encoding scales with data; nobody checked whether decoding scales the same way. That is exactly what our dissociation experiment measures.");

  // 6 lit II
  s = S("Literature");
  s.addText("Literature survey II: non-invasive decoding and foundation encoders", { placeholder: "title" });
  table(s, ["Work", "Contribution", "Limitation relevant to us"], [
    ["Défossez et al., Nat. Mach. Intell. 2023 [8]", "Contrastive decoding of perceived speech from MEG/EEG", "MEG far stronger than EEG; segment identification"],
    ["Scotti et al. (MindEye2), ICML 2024 [9]", "fMRI-to-image with 1 h of subject data via shared-subject model", "Vision; trained decoder, no operator analysis"],
    ["d'Ascoli et al., Nat. Commun. 2025 [10]", "Single-word decoding across 723 participants (MEG/EEG)", "Word level; accuracy limited by modality"],
    ["Lévy et al. (Brain2Qwerty), Nat. Neurosci. 2026 [11]", "Typed sentences decoded: CER 29% with MEG vs 65% with EEG", "Shows EEG is too weak for language decoding"],
    ["d'Ascoli et al. (TRIBE), ICLR 2026 [12]", "Trimodal encoder; 1st of 263 teams, Algonauts 2025", "Encoding only"],
    ["d'Ascoli et al. (TRIBE v2), 2026 [13]", "Open-weight foundation encoder: 1 117.7 h fMRI, 720 subjects, 20 484 vertices", "Explicitly an encoder; inverse never studied"],
    ["Hansen, SIAM 2010 [14]", "Theory of discrete ill-posed problems: conditioning, regularisation", "Our analytical lens"],
  ], { x: 0.5, y: 1.35, w: 12.3, colW: [3.4, 5.0, 3.9], fontSize: 15, rowH: 0.62 });
  s.addNotes("Brain2Qwerty is the decisive reason we dropped EEG: even Meta, with 35 participants and a purpose-built architecture, gets 65% character error with EEG versus 29% with MEG. TRIBE v2's own paper frames it for in-silico neuroscience and lists decoders separately (Tang, Défossez); it never inverts itself. Weights and code are public (CC BY-NC 4.0), which makes our study possible.");

  // 7 gap
  s = S("Literature");
  s.addText("Research gap", { placeholder: "title" });
  const gaps = [
    [I.chart, HEX.blue, "Encoding keeps improving", "Accuracy scales log-linearly with data with no plateau (Antonello 2023 [5]; TRIBE v2 2026 [13])."],
    [I.search, HEX.orange, "Decoding is studied separately", "Decoders are trained per subject and judged by proxy metrics, because the true stimulus representation behind real fMRI is unknown."],
    [I.warn, HEX.violet, "The inverse is never characterised", "No study measures conditioning, uniqueness or stability of a deep encoder's inverse, or whether encoding gains transfer to decoding. Linear inverted encoding models are identifiable only up to a linear transform [16]; deep encoders have never been tested."],
  ];
  gaps.forEach(([ic, c, h, b], i) => {
    const y = 1.45 + i * 1.32;
    iconBadge(s, 0.7, y + 0.1, 0.8, ic, c);
    txt(s, h, { x: 1.75, y, w: 10.8, h: 0.45, fontSize: 19, bold: true, color: HEX.navy, fontFace: K.THEME.headFontFace });
    txt(s, b, { x: 1.75, y: y + 0.48, w: 10.8, h: 0.75, fontSize: 15 });
  });
  card(s, 0.7, 5.5, 11.9, 1.3, HEX.navy);
  txt(s, [{ text: "Gap.  ", options: { bold: true, color: "FFC9A8" } },
    { text: "Does improving a brain encoding model make meaning more recoverable from fMRI, and if not, what limits the inverse: information loss, non-convexity, or noise?", options: { color: "FFFFFF" } }],
    { x: 0.95, y: 5.6, w: 11.4, h: 1.1, fontSize: 18, valign: "middle" });
  s.addNotes("State the gap in one breath: the field optimises encoders and assumes decoding follows; we test that assumption directly. If challenged ('surely someone has inverted an encoder'): Kay 2008 and many others use encoders for identification among candidates, which is different from recovering the representation and characterising the inverse operator. TRIBE v2's release (March 2026) is recent enough that its inverse has not been characterised.");

  // 8 problem + objectives
  s = S("Literature");
  s.addText("Problem statement and objectives", { placeholder: "title" });
  card(s, 0.6, 1.35, 12.1, 1.05, HEX.tint);
  txt(s, "Characterise semantic decoding from fMRI as the inverse of a frozen, differentiable deep encoder (TRIBE v2), and quantify its conditioning, uniqueness and stability under exact ground truth.",
    { x: 0.85, y: 1.45, w: 11.6, h: 0.85, fontSize: 17, valign: "middle", color: HEX.navy, bold: true });
  const objs = [
    ["O1", "Formulate decoding as inversion and locate the point where the encoder becomes differentiable", "Done", HEX.aqua],
    ["O2", "Build a synthetic framework with exact ground truth for error measurement", "Done", HEX.aqua],
    ["O3", "Characterise the inverse vs. budget, noise, cortical extent and priors", "Done", HEX.aqua],
    ["O4", "Discriminate non-identifiability vs. non-convexity vs. optimiser limits", "In progress", HEX.gold],
    ["O5", "Benchmark against a linear decoder; map recoverability by anatomical region", "In progress", HEX.gold],
    ["O6", "Validate on real naturalistic fMRI (LeBel 2023)", "Planned", HEX.muted],
  ];
  objs.forEach(([id, t, st, c], i) => {
    const y = 2.6 + i * 0.68;
    badge(s, 0.7, y, 0.52, id, HEX.navy, 13);
    txt(s, t, { x: 1.4, y: y + 0.02, w: 9.3, h: 0.5, fontSize: 15, valign: "middle" });
    s.addShape("roundRect", { x: 10.9, y: y + 0.07, w: 1.75, h: 0.4, rectRadius: 0.2, fill: { color: c }, line: { color: c } });
    txt(s, st, { x: 10.9, y: y + 0.07, w: 1.75, h: 0.4, fontSize: 12, bold: true, color: "FFFFFF", align: "center", valign: "middle" });
  });
  s.addNotes("Objectives are measurable: each maps to an experiment and a number. O1-O3 are complete and shown today. O4-O5 are partly run (results at Review III). O6 is the final phase. This slide directly addresses the 'Research problem and objectives' rubric line.");

  // 9 novelty
  s = S("Literature");
  s.addText("What is new in this work: four claims", { placeholder: "title" });
  const nov = [
    [I.target, HEX.blue, "First inverse analysis of a foundation brain encoder", "TRIBE v2 [13] was released for in-silico neuroscience. We treat it as a forward operator and study its inverse; its authors and both 2026 follow-ups [17, 18] did not (proof on the next two slides)."],
    [I.flask, HEX.orange, "Exact evaluation, not proxy metrics", "Synthetic ground truth lets us measure recovery error exactly. Real-data decoders can only score proxies such as retrieval rank."],
    [I.layers, HEX.aqua, "A differentiable entry point into a closed pipeline", "The public pipeline (TTS → Whisper → LLaMA) is not differentiable. We identified the aggregate_features boundary and re-entered the network there."],
    [I.scale, HEX.violet, "Decoder-independent limits", "Results describe the measurement, not one decoder's architecture, so they bound what any decoder built on this encoder can achieve."],
  ];
  nov.forEach(([ic, c, h, b], i) => {
    const x = 0.6 + (i % 2) * 6.15, y = 1.45 + Math.floor(i / 2) * 2.7;
    card(s, x, y, 5.9, 2.45, HEX.tint);
    iconBadge(s, x + 0.3, y + 0.3, 0.75, ic, c);
    txt(s, h, { x: x + 1.25, y: y + 0.25, w: 4.4, h: 0.85, fontSize: 17, bold: true, color: HEX.navy, valign: "middle" });
    txt(s, b, { x: x + 0.3, y: y + 1.15, w: 5.35, h: 1.2, fontSize: 14 });
  });
  s.addNotes("If asked 'what is novel if the model is Meta's?': the model is the instrument, not the contribution. Analogy: characterising a published sensor's transfer function is a contribution even though the sensor was built elsewhere. The aggregate_features finding is practical novelty: it is why gradient inversion is possible at all.");

  addNovelty(S, "Literature", { kay: 2, gardner: 16, tang: 6, tribe2: 13, bladon: 17, benchetrit: 18 }, [
    ["First inverse (uniqueness and conditioning) analysis of a deep foundation brain encoder", "Prior-art matrix and dated search protocol (previous two slides)", "Shown"],
    ["A differentiable re-entry point into the closed TRIBE v2 pipeline", "Gradient reaches every entry of x at the aggregate_features boundary: ‖∂y/∂x‖ = 7.97 × 10³", "Shown"],
    ["Exact, decoder-independent measurement of decodability", "Synthetic ground truth: recovery measured as cosine to the true x, not a proxy rank", "Shown"],
    ["Encoding accuracy and decodability dissociate", "Encoding error falls 28.4×; final halving buys +0.015 recovery", "Shown"],
    ["Cause of incomplete recovery: non-convexity vs. information loss", "Initialisation, perturbation and sensitivity controls running", "Review III"],
  ]);

  // 10 SDG
  s = S("Literature");
  s.addText("Alignment with specific SDG targets", { placeholder: "title" });
  const sdg = [
    [I.heart, "C5192D", "SDG 3 · Target 3.4", "“…promote mental health and well-being.” Restoring communication to cognitively intact, motor-impaired patients (ALS, stroke, locked-in) addresses well-being directly; limits we measure tell clinicians what non-invasive decoding can and cannot deliver."],
    [I.industry, "FD6925", "SDG 9 · Target 9.5", "“Enhance scientific research, upgrade the technological capabilities…” Methodological contribution to neural-interface engineering using open models and open data, reproducible on free compute."],
    [I.hands, "DD1367", "SDG 10 · Target 10.2", "“…empower and promote the social, economic and political inclusion of all, irrespective of… disability…” Communication access is a precondition for inclusion of people with severe motor disability."],
  ];
  sdg.forEach(([ic, c, h, b], i) => {
    const y = 1.4 + i * 1.75;
    iconBadge(s, 0.7, y + 0.15, 0.95, ic, c);
    txt(s, h, { x: 1.95, y, w: 10.6, h: 0.45, fontSize: 19, bold: true, color: HEX.navy, fontFace: K.THEME.headFontFace });
    txt(s, b, { x: 1.95, y: y + 0.5, w: 10.6, h: 1.15, fontSize: 14.5 });
  });
  s.addNotes("Specific targets, not just goals, because the rubric's top band requires 'specific SDG target(s)'. Be honest about the link: this is enabling research, not a deployed device. The well-being link (3.4) is through assistive communication; 9.5 through research capability; 10.2 through disability inclusion. Target texts are quoted from the UN SDG indicator framework.");

  // =========================================================== SECTION: METHOD
  pres.addSection({ title: "Method" });
  s = S("Method", "Section");
  s.addText("3  ·  Methodology and analytical model", { placeholder: "title" });
  s.addText("Block diagram, mathematical formulation, algorithm and implementation", { placeholder: "body" });

  // 11 block diagram
  s = S("Method");
  s.addText("Functional block diagram", { placeholder: "title" });
  txt(s, "REFERENCE PATH  (TRIBE v2 as released — not differentiable before the boundary)", { x: 0.5, y: 1.25, w: 7.6, h: 0.3, fontSize: 12, bold: true, color: HEX.ink2 });
  const top = [["Stimulus", "speech / text", HEX.muted], ["Feature extractors", "LLaMA-3.2-3B · Wav2Vec-BERT · V-JEPA2 (frozen)", HEX.muted],
    ["Projectors", "per modality → 384 d", HEX.muted]];
  top.forEach(([t, sub, c], i) => box(s, 0.5 + i * 2.75, 1.65, 2.45, 1.05, t, sub, c, "FFFFFF", 13));
  for (let i = 0; i < 2; i++) arrow(s, 2.95 + i * 2.75, 2.17, 3.25 + i * 2.75, 2.17);
  // boundary
  s.addShape("rect", { x: 8.65, y: 1.55, w: 0.04, h: 3.2, fill: { color: HEX.orange }, line: { color: HEX.orange } });
  txt(s, "aggregate_features boundary", { x: 8.75, y: 1.2, w: 4.0, h: 0.3, fontSize: 12, color: HEX.orange, bold: true });
  arrow(s, 7.95, 2.17, 9.0, 2.17);
  box(s, 9.0, 1.65, 3.8, 1.05, "Frozen forward operator  f(x)", "Transformer → low-rank head → subject layer → pool", HEX.blue, "FFFFFF", 13);
  txt(s, "OUR PIPELINE  (everything differentiable)", { x: 0.5, y: 3.05, w: 12.3, h: 0.3, fontSize: 12, bold: true, color: HEX.ink2 });
  box(s, 0.5, 3.45, 2.45, 1.15, "Ground-truth generator", "x* ∈ ℝ^(32×1152)", HEX.navy, "FFFFFF", 13);
  box(s, 3.25, 3.45, 2.45, 1.15, "Measurement model", "y = M ⊙ f(x*) + η", HEX.navy, "FFFFFF", 13);
  box(s, 6.0, 3.45, 2.45, 1.15, "Inversion engine", "Adam on x, θ frozen", HEX.orange, "FFFFFF", 13);
  box(s, 9.0, 3.45, 3.8, 1.15, "f(x̂)  via autograd", "∂L/∂x back-propagated to the input", HEX.blue, "FFFFFF", 13);
  arrow(s, 2.95, 4.02, 3.25, 4.02); arrow(s, 5.7, 4.02, 6.0, 4.02);
  arrow(s, 8.45, 3.8, 9.0, 3.8, HEX.orange); arrow(s, 9.0, 4.3, 8.45, 4.3, HEX.orange);
  arrow(s, 10.9, 2.7, 10.9, 3.45, HEX.blue);
  box(s, 0.5, 5.15, 3.8, 1.3, "Experiment controller", "budget · noise η · vertex mask M · prior R · init", HEX.violet, "FFFFFF", 13);
  box(s, 4.6, 5.15, 3.85, 1.3, "Evaluation", "cosine · relative error · retrieval · directional sensitivity", HEX.aqua, "FFFFFF", 13);
  box(s, 9.0, 5.15, 3.8, 1.3, "Results store", "results.json (26 stages) · figures · Drive backup", HEX.navy, "FFFFFF", 13);
  arrow(s, 1.7, 5.15, 1.7, 4.6, HEX.violet); arrow(s, 3.9, 5.15, 3.9, 4.6, HEX.violet);
  arrow(s, 7.2, 4.6, 7.2, 5.15, HEX.orange); arrow(s, 8.45, 5.8, 9.0, 5.8, HEX.muted);
  s.addNotes("Read top to bottom. Top row is TRIBE v2 as Meta ships it: text is converted to speech, transcribed with Whisper, embedded with LLaMA; none of that is differentiable, and the published predict() runs under torch.inference_mode(), which blocks gradients permanently. The orange dashed line is the boundary we found in the source: aggregate_features is the only function that touches the input batch. Everything to its right is tensor arithmetic, so we feed our own x there. Bottom row is our system: generate a known x*, push it through the frozen operator with optional noise and vertex masking, invert by gradient descent on x only, evaluate against x*.");

  // 12 analytical model
  s = S("Method");
  s.addText("Analytical model", { placeholder: "title" });
  card(s, 0.6, 1.35, 6.0, 5.45, HEX.tint);
  txt(s, "Forward operator", { x: 0.85, y: 1.5, w: 5.5, h: 0.4, fontSize: 18, bold: true, color: HEX.navy, fontFace: K.THEME.headFontFace });
  txt(s, [
    { text: "y = f_θ(x) = P ∘ S ∘ L ∘ E (x)", options: { breakLine: true, bold: true, fontFace: "Cambria Math", fontSize: 18 } },
    { text: "x ∈ ℝ^(T×H),  T = 32,  H = 1152", options: { breakLine: true } },
    { text: "y ∈ ℝ^(V×T′),  V = 20 484,  T′ = 100", options: { breakLine: true } },
    { text: "E: 8-layer transformer encoder (127.5 M)", options: { breakLine: true } },
    { text: "L: low-rank head 1152 → 2048", options: { breakLine: true } },
    { text: "S: shared subject layer 2048 → 20 484", options: { breakLine: true } },
    { text: "P: adaptive average pooling to T′", options: { breakLine: true } },
    { text: "θ frozen (177.21 M parameters)", options: {} },
  ], { x: 0.85, y: 2.0, w: 5.5, h: 3.4, fontSize: 15, paraSpaceAfter: 4 });
  txt(s, "Ground truth:  x*_t = Σₖ cos(2π k c t) bₖ ,  k = 1…8,  normalised; c sets the rate of semantic change",
    { x: 0.85, y: 5.55, w: 5.5, h: 1.1, fontSize: 14, color: HEX.ink2 });
  card(s, 6.85, 1.35, 5.85, 2.75, HEX.paleOrange);
  txt(s, "Inverse problem", { x: 7.1, y: 1.5, w: 5.4, h: 0.4, fontSize: 18, bold: true, color: HEX.navy, fontFace: K.THEME.headFontFace });
  txt(s, [
    { text: "x̂ = argminₓ  ‖M ⊙ (f_θ(x) − y)‖² + λ R(x)", options: { breakLine: true, bold: true, fontFace: "Cambria Math", fontSize: 17 } },
    { text: "R(x) = ‖x‖²  (ℓ2)   or   Σₜ ‖xₜ − xₜ₋₁‖²  (smoothness)", options: { breakLine: true } },
    { text: "Linearised: f(x + δ) ≈ f(x) + J δ, so error grows along directions with small singular values of the Jacobian J (ill-conditioning).", options: {} },
  ], { x: 7.1, y: 2.0, w: 5.4, h: 2.0, fontSize: 14, paraSpaceAfter: 5 });
  card(s, 6.85, 4.3, 5.85, 2.5, HEX.paleAqua);
  txt(s, "Metrics", { x: 7.1, y: 4.42, w: 5.4, h: 0.4, fontSize: 18, bold: true, color: HEX.navy, fontFace: K.THEME.headFontFace });
  txt(s, [
    { text: "Recovery:  (1/T) Σₜ cos(x̂ₜ, x*ₜ)", options: { breakLine: true } },
    { text: "Relative error:  ‖x̂ − x*‖ / ‖x*‖", options: { breakLine: true } },
    { text: "Encoding error:  ‖f(x̂) − f(x*)‖ / ‖f(x*)‖", options: { breakLine: true } },
    { text: "Directional sensitivity:  s(v) = ‖f(x+εv) − f(x)‖ / ε", options: {} },
  ], { x: 7.1, y: 4.9, w: 5.4, h: 1.8, fontSize: 14, paraSpaceAfter: 4 });
  s.addNotes("This is the analytical model the rubric asks for. Hadamard well-posedness has three parts and each maps to an experiment: existence (does inversion fit the data: yes, MSE to 1e-7), uniqueness (do different starts agree: tested by initialisation control), stability (does output degrade gracefully with noise: tested by noise sweep). Why cosine: semantic embeddings are compared by direction in NLP; we also report relative error, which captures magnitude, because the two can disagree. M is a 0/1 vertex mask used for the spatial-extent experiment; eta is additive Gaussian noise scaled to the BOLD standard deviation.");

  // 13 forward operator + boundary
  s = S("Method");
  s.addText("The forward operator and where we enter it", { placeholder: "title" });
  table(s, ["Component", "Type", "Parameters"], [
    ["encoder", "Transformer encoder (x-transformers)", "127.47 M"],
    ["predictor", "SubjectLayersModel (shared 'unseen subject' layer)", "41.97 M"],
    ["projectors", "Per-modality MLPs (text 2×3072, audio 2×1024, video 2×1408)", "4.23 M"],
    ["low_rank_head", "Linear 1152 → 2048, no bias", "2.36 M"],
    ["pooler", "AdaptiveAvgPool1d → 100 time points", "—"],
    [{ text: "Total", options: { bold: true } }, "", { text: "177.21 M", options: { bold: true } }],
  ], { x: 0.5, y: 1.35, w: 6.6, colW: [1.6, 3.7, 1.3], fontSize: 12.5 });
  card(s, 7.4, 1.35, 5.4, 5.45, HEX.tint);
  txt(s, "Why inversion needed a new entry point", { x: 7.65, y: 1.5, w: 5.0, h: 0.4, fontSize: 17, bold: true, color: HEX.navy });
  bullets(s, [
    "predict() runs inside torch.inference_mode(): its tensors can never carry gradients",
    "Text is turned into speech (gTTS), re-transcribed (WhisperX) and embedded (LLaMA): non-differentiable",
    "In FmriEncoderModel.forward, aggregate_features(batch) is the only call that reads the batch",
    "We re-implement forward() from that line onward and optimise its output x directly",
    "Verified: ‖∂y/∂x‖ = 7.97 × 10³, every entry non-zero",
  ], { x: 7.65, y: 2.0, w: 4.95, h: 4.6, fontSize: 14 });
  txt(s, "Configuration read from the checkpoint: hidden = 1152, low_rank_head = 2048, modality_dropout = 0.3, temporal_smoothing = None, linear_baseline = False.",
    { x: 0.5, y: 4.55, w: 6.6, h: 1.0, fontSize: 13, color: HEX.ink2 });
  txt(s, "Consequence: x is the aggregated multimodal representation, one stage after raw LLaMA embeddings. Results characterise the operator from that point onward.",
    { x: 0.5, y: 5.6, w: 6.6, h: 1.0, fontSize: 13, color: HEX.ink2, italic: true });
  s.addNotes("These numbers come from inspecting the loaded network, and we have since reproduced them independently on CPU from the raw checkpoint. Likely question: 'so you are not decoding words?' Correct, and deliberately: we decode the representation the encoder actually consumes. Mapping x back to words is a separate, easier step (nearest-neighbour search in embedding space) and is not where the information is lost. temporal_smoothing = None matters later: it explains the bandwidth null result.");

  // 14 algorithm
  s = S("Method");
  s.addText("Algorithm", { placeholder: "title" });
  const steps = ["Generate ground truth x* (seeded)", "Compute target y = M ⊙ f(x*) + η", "Initialise x₀ = 0.01·N(0, I)",
    "Loss L(x) = masked MSE + λR(x)", "∂L/∂x by autograd; θ frozen", "Adam update, cosine-annealed lr", "Score x̂ against x*; log to results.json"];
  steps.forEach((t, i) => {
    const y = 1.4 + i * 0.75;
    badge(s, 0.7, y, 0.52, String(i + 1), i === 4 || i === 5 ? HEX.orange : HEX.blue, 14);
    txt(s, t, { x: 1.4, y: y + 0.03, w: 4.9, h: 0.5, fontSize: 15, valign: "middle" });
    if (i < steps.length - 1) arrow(s, 0.96, y + 0.53, 0.96, y + 0.74, HEX.line, 1.25);
  });
  card(s, 6.6, 1.35, 6.2, 5.45, "F3F4F6");
  txt(s, [
    "x = 0.01 * randn(1, 32, 1152)        # seed 999",
    "x.requires_grad_(True)",
    "opt   = Adam([x], lr=5e-2)",
    "sched = CosineAnnealingLR(opt, T_max=steps)",
    "for i in range(steps):",
    "    opt.zero_grad()",
    "    pred = forward_from_x(x)      # frozen θ",
    "    loss = mse(pred[:, mask], y)",
    "    loss = loss + lam * R(x)",
    "    loss.backward()               # ∂L/∂x",
    "    opt.step(); sched.step()",
    "score(x, x_true)  →  results.json",
  ].join("\n"), { x: 6.85, y: 1.55, w: 5.8, h: 5.1, fontFace: "Courier New", fontSize: 13, color: HEX.ink });
  s.addNotes("Hyperparameters: Adam lr 0.05, cosine annealing over the full budget, budgets from 250 to 64 000 steps. Why Adam: the loss is a 36 864-dimensional non-convex function of x; Adam's per-coordinate scaling handles very different gradient magnitudes across the three modality slots. Why not a trained decoder: training a decoder conflates the decoder's capacity with the operator's invertibility; direct inversion isolates the operator.");

  // 15 implementation
  s = S("Method");
  s.addText("Implementation: tools, platform and status", { placeholder: "title" });
  table(s, ["Layer", "Tools"], [
    ["Model", "TRIBE v2 (open weights, CC BY-NC 4.0), PyTorch, x-transformers, neuralset / neuraltrain"],
    ["Features (reference path)", "LLaMA-3.2-3B (gated, access granted), Wav2Vec-BERT 2.0, V-JEPA2"],
    ["Compute", "Google Colab T4 GPU (16 GB); CPU replication (2 cores) for the regional analysis"],
    ["Neuroimaging", "Nilearn, fsaverage5 surface, Destrieux atlas"],
    ["Analysis", "NumPy, SciPy, Matplotlib; results.json checkpointed to Google Drive"],
  ], { x: 0.5, y: 1.35, w: 7.4, colW: [2.2, 5.2], fontSize: 13 });
  card(s, 8.2, 1.35, 4.6, 5.45, HEX.tint);
  txt(s, "Engineering problems solved", { x: 8.45, y: 1.5, w: 4.2, h: 0.4, fontSize: 17, bold: true, color: HEX.navy });
  bullets(s, [
    "numpy ABI mismatch after install: pinned numpy < 2.1",
    "Package shadowed by repo folder: sys.path fix",
    "WhisperX missing punkt_tab: NLTK data path",
    "torchaudio ABI break: bypassed entirely via the boundary",
    "Runtime resets wiped results: per-condition checkpoints + Drive",
    "Free-GPU quota: experiments staged and resumable",
  ], { x: 8.45, y: 2.0, w: 4.15, h: 4.7, fontSize: 13.5 });
  txt(s, "Development status:  pipeline complete and reproducible  ·  26 stages logged  ·  all figures generated from logged numbers",
    { x: 0.5, y: 4.9, w: 7.4, h: 0.9, fontSize: 14, bold: true, color: HEX.aqua });
  s.addNotes("If asked about reproducibility: every experiment is seeded (ground truth, initialisation, masks, noise), results are written after every condition, and the network has been rebuilt independently on CPU from the raw checkpoint with identical parameter counts. Licence: TRIBE v2 is CC BY-NC 4.0, which permits non-commercial academic research.");

  // =========================================================== SECTION: RESULTS
  pres.addSection({ title: "Results" });
  s = S("Results", "Section");
  s.addText("4  ·  Preliminary results", { placeholder: "title" });
  s.addText("Screenshots, outputs and tabulated measurements from the core characterisation", { placeholder: "body" });

  // 16 screenshots
  s = S("Results");
  s.addText("Evidence: the inverse is computable", { placeholder: "title" });
  const g1 = figure(s, "shot_gradient.png", 0.5, 1.4, 5.2, 3.6);
  caption(s, "Colab output: gradient reaches the input (norm 7 972.6); first 500-step inversion", g1.x, g1.y + g1.h + 0.1, 5.4);
  const g2 = figure(s, "shot_stage2.png", 6.0, 1.4, 6.8, 3.6);
  caption(s, "Colab output: Stage 2 dissociation run (encoding error vs recovery)", g2.x, g2.y + g2.h + 0.1, 6.8);
  card(s, 0.5, 5.75, 12.3, 1.05, HEX.tint);
  txt(s, "Output shape (1, 20 484, 100) confirms we drive the real network: 20 484 fsaverage5 vertices over 100 pooled time points. The verdict line is the make-or-break test for the whole project.",
    { x: 0.75, y: 5.82, w: 11.8, h: 0.9, fontSize: 14.5, valign: "middle" });
  s.addNotes("These are unedited screenshots from our Colab sessions. Left: the first time the gradient flowed (norm 7972) and the first inversion. Right: the Stage 2 run that produced the dissociation curve on the next slides.");

  // 16b demonstration video
  s = S("Results");
  s.addText("Demonstration: a live inversion", { placeholder: "title" });
  const poster = require("fs").readFileSync(require("path").join(K.A, "demo_poster.png")).toString("base64");
  s.addMedia({ type: "video", path: require("path").join(K.A, "demo_inversion.mp4"), x: 0.5, y: 1.3, w: 8.53, h: 4.8,
    cover: "image/png;base64," + poster });
  card(s, 9.3, 1.3, 3.5, 4.8, HEX.tint);
  txt(s, [
    { text: "What to watch", options: { bold: true, color: HEX.navy, fontSize: 17, breakLine: true } },
    { text: "Bottom right: the target BOLD and the BOLD predicted from the recovered representation become almost identical within a few hundred steps.", options: { breakLine: true } },
    { text: " ", options: { breakLine: true } },
    { text: "Top left: the representation itself is still only about half recovered (cosine 0.52 at 2 400 steps).", options: { breakLine: true } },
    { text: " ", options: { breakLine: true } },
    { text: "That gap is the dissociation, visible in real time.", options: { bold: true } },
  ], { x: 9.5, y: 1.45, w: 3.15, h: 4.55, fontSize: 14 });
  caption(s, "Recorded run through frozen TRIBE v2 (CPU, whole cortex, 2 400 steps). Every frame is drawn from logged values.", 0.5, 6.2, 12.3);
  s.addNotes("Click to play (about 13 seconds). This is a short-budget recording for demonstration; with the full 32 000-step budget the same procedure reaches 0.944. The point is the contrast between the two BOLD panels (matching) and the cosine curve (incomplete). If the video does not play on the venue PC, the poster frame shows the final state and the MP4 is supplied separately.");

  // 17 first result artefact
  s = S("Results");
  s.addText("Our first result was wrong, and we caught it", { placeholder: "title" });
  const f1 = figure(s, "fig_first_vs_converged.png", 0.5, 1.35, 5.6, 4.4);
  const f2 = figure(s, "shot_early_sweeps.png", 6.4, 1.35, 3.0, 4.4);
  caption(s, "Early 1 500-step sweeps: everything stuck near 0.35", f2.x - 0.2, f2.y + f2.h + 0.08, 3.6);
  card(s, 9.7, 1.35, 3.1, 4.4, HEX.paleOrange);
  txt(s, [
    { text: "Diagnosis", options: { bold: true, breakLine: true, color: HEX.navy, fontSize: 16 } },
    { text: "At 500 steps cosine was 0.238 and every condition looked flat. Recovery was still climbing: we were measuring the optimiser, not the operator.", options: { breakLine: true } },
    { text: " ", options: { breakLine: true } },
    { text: "Fix", options: { bold: true, breakLine: true, color: HEX.navy, fontSize: 16 } },
    { text: "Find convergence first, then run every condition at a converged budget.", options: {} },
  ], { x: 9.9, y: 1.5, w: 2.75, h: 4.2, fontSize: 13.5 });
  txt(s, "Lesson built into the method: no claim about the operator is accepted until the optimiser has converged.",
    { x: 0.5, y: 6.1, w: 12.3, h: 0.6, fontSize: 15, bold: true, color: HEX.navy });
  s.addNotes("This slide pre-empts the hardest methodological question ('how do you know you are not just measuring your optimiser?'). We fell into exactly that trap, recognised it from the flat curves, and rebuilt the protocol. Convergence: 4000 → 0.77, 8000 → 0.87, 16000 → 0.89, 32000 → 0.89 (plateau), from a single annealed run; independent runs to completion are on the next slide.");

  // 18 dissociation
  s = S("Results");
  s.addText("Encoding accuracy does not predict decoding", { placeholder: "title" });
  figure(s, "fig_dissociation.png", 0.4, 1.3, 7.9, 5.5);
  stat(s, 8.6, 1.4, 4.2, "28.4×", "reduction in encoding error, 250 → 32 000 steps", HEX.blue, 44);
  stat(s, 8.6, 3.05, 4.2, "+0.015", "recovery gained from the final 2.1× drop in encoding error (0.928 → 0.944)", HEX.orange, 44);
  card(s, 8.6, 4.75, 4.2, 2.05, HEX.tint);
  txt(s, "Forward fit and recoverability are different quantities. Past a point, a better-fitting forward model buys almost nothing in decoding.",
    { x: 8.8, y: 4.85, w: 3.85, h: 1.85, fontSize: 14.5, valign: "middle" });
  s.addNotes("Central result. Eight independent inversions, each run to the end of its own cosine schedule. Encoding error falls from 7.55e-2 to 2.66e-3 (28.4x); recovery rises then saturates at 0.944. The last halving of encoding error (5.65e-3 → 2.66e-3) adds only 0.015 to recovery. Implication for the field: scaling encoders (Antonello 2023, TRIBE v2's log-linear scaling) should not be expected to deliver proportional decoding gains.");

  // 19 noise
  s = S("Results");
  s.addText("Stability: the inverse degrades gracefully with noise", { placeholder: "title" });
  figure(s, "fig_noise.png", 0.4, 1.3, 12.5, 4.6);
  card(s, 0.5, 6.0, 12.3, 0.85, HEX.tint);
  txt(s, "No cliff: cosine 0.836 → 0.298 at noise equal to the signal's own standard deviation. Direction and timing survive (retrieval ≈ 0.99 throughout) while magnitude does not (relative error 0.55 → 2.06).",
    { x: 0.75, y: 6.05, w: 11.8, h: 0.75, fontSize: 14, valign: "middle" });
  s.addNotes("Hadamard's stability condition, tested empirically. Graceful monotone decay means the inverse is reasonably well conditioned against additive noise. The split between retrieval and relative error is important: noise mostly corrupts the magnitude of the recovered representation, not which moment it corresponds to. Retrieval here asks whether the recovered vector at time t is closest to the true vector at time t among the other 31 time points.");

  // 20 extent
  s = S("Results");
  s.addText("Ten percent of cortex carries most of the recoverable signal", { placeholder: "title" });
  figure(s, "fig_extent.png", 0.4, 1.3, 7.9, 5.5);
  table(s, ["Vertices", "Cosine", "Enc. error"], [
    ["50", "0.100", "8.69e-2"], ["100", "0.183", "6.44e-2"], ["500", "0.527", "3.82e-2"],
    ["2 000", "0.777", "1.94e-2"], ["8 000", "0.825", "1.48e-2"], ["20 484", "0.836", "1.38e-2"],
  ], { x: 8.6, y: 1.45, w: 4.2, colW: [1.4, 1.3, 1.5], fontSize: 13 });
  card(s, 8.6, 4.55, 4.2, 2.25, HEX.tint);
  txt(s, "Random subsets saturate near 2 000 vertices. This makes the next question well posed: which anatomical 10%? That is the regional analysis (Review III).",
    { x: 8.8, y: 4.65, w: 3.85, h: 2.05, fontSize: 14, valign: "middle" });
  s.addNotes("Vertices sampled uniformly at random (seeded). Below ~500 vertices the problem is genuinely underdetermined. Note that encoding error on the observed vertices is lowest for the smallest subsets, while recovery is worst: fitting a few vertices perfectly says little about the representation.");

  // 21 priors + bandwidth
  s = S("Results");
  s.addText("Generic priors hurt; bandwidth is a structural null", { placeholder: "title" });
  figure(s, "fig_priors.png", 0.4, 1.3, 6.3, 4.4);
  figure(s, "fig_bandwidth.png", 6.8, 1.3, 6.1, 4.4);
  card(s, 0.5, 5.85, 6.0, 1.0, HEX.tint);
  txt(s, "ℓ2 helps only at λ = 1e-5 (+0.032). Smoothness drives cosine to 0.0008 and retrieval to chance (0.499).",
    { x: 0.7, y: 5.9, w: 5.6, h: 0.9, fontSize: 13.5, valign: "middle" });
  card(s, 6.9, 5.85, 5.9, 1.0, HEX.paleOrange);
  txt(s, "Flat across 64× because the release has no haemodynamic filter in the differentiable path (temporal_smoothing = None).",
    { x: 7.1, y: 5.9, w: 5.5, h: 0.9, fontSize: 13.5, valign: "middle" });
  s.addNotes("Priors: tested in the 500-vertex regime where a prior should help most. Neither small norm nor temporal smoothness describes semantic representations under this operator; better priors must come from the structure of language embeddings. Bandwidth: we report this as a null with its cause, not as 'bandwidth does not matter'. The haemodynamic low-pass was learned into the training data, not built as an operator, so this experiment cannot measure HRF bandwidth. Pooling was checked and excluded as the cause (pooled vs unpooled output separation 49.9 vs 28.8).");

  // 22 tabulation
  s = S("Results");
  s.addText("Tabulation of Review II results", { placeholder: "title" });
  table(s, ["Experiment", "Condition range", "Key measurement", "Interpretation"], [
    ["Gradient check", "random x", "‖∂y/∂x‖ = 7.97×10³", "Operator invertible by gradient"],
    ["Convergence", "250 – 64 000 steps", "plateau ≈ 0.89–0.91 (single run)", "Budget ≥ 8 000 needed"],
    ["Dissociation", "8 independent budgets", "enc. error ↓ 28.4×; recovery → 0.944", "Encoding ≠ decoding"],
    ["Stimulus manifold", "white vs smooth", "0.947 ± 0.004 vs 0.942 ± 0.005", "No manifold advantage"],
    ["Noise", "0 – 100% of BOLD std", "0.836 → 0.298, monotone", "Stable, well conditioned"],
    ["Spatial extent", "50 – 20 484 vertices", "saturates ≈ 2 000 (0.777)", "≈10% of cortex suffices"],
    ["ℓ2 prior", "λ 0 – 1e-2 (500 v)", "best +0.032 at 1e-5", "Small-norm prior invalid"],
    ["Smoothness prior", "λ 0 – 1e-1 (500 v)", "0.527 → 0.0008", "Catastrophic"],
    ["Bandwidth", "0.25 – 16 cycles", "0.858 – 0.838 (flat)", "Null: no HRF operator"],
  ], { x: 0.5, y: 1.35, w: 12.3, colW: [2.2, 2.6, 3.9, 3.6], fontSize: 15, rowH: 0.52 });
  s.addNotes("One table the panel can refer back to during viva. Every number is from results.json. Mean ± sd for the manifold comparison is over three seeds.");

  // =========================================================== SECTION: PLAN
  pres.addSection({ title: "Plan" });
  s = S("Plan", "Section");
  s.addText("5  ·  Plan to completion", { placeholder: "title" });
  s.addText("Timeline, division of work and what Review III will show", { placeholder: "body" });

  // 23 timeline
  s = S("Plan");
  s.addText("Timeline", { placeholder: "title" });
  const months = ["Aug", "Sep", "Oct", "Nov", "Dec"];
  const gx = 4.6, gw = 1.62;
  months.forEach((m, i) => txt(s, m, { x: gx + i * gw, y: 1.35, w: gw, h: 0.35, fontSize: 14, bold: true, color: HEX.navy, align: "center" }));
  const rowsG = [
    ["S1 Literature, problem formulation", 0, 0.9, HEX.aqua, "done"],
    ["S2 Instrumentation, inversion boundary", 0.4, 1.3, HEX.aqua, "done"],
    ["S3 Core synthetic characterisation", 0.9, 2.3, HEX.aqua, "done"],
    ["S4 Controls: init, null-space, gain, baseline", 1.8, 2.8, HEX.gold, "running"],
    ["S5 Regional (ROI) analysis", 2.2, 3.1, HEX.gold, "running"],
    ["S6 Real-data study (LeBel 2023)", 2.8, 4.0, HEX.line, "planned"],
    ["S7 Paper and final report", 3.3, 5.0, HEX.line, "planned"],
  ];
  rowsG.forEach(([n, a, b, c, st], i) => {
    const y = 1.85 + i * 0.62;
    txt(s, n, { x: 0.5, y, w: 4.0, h: 0.45, fontSize: 13.5, valign: "middle" });
    s.addShape("rect", { x: gx, y: y + 0.04, w: gw * 5, h: 0.38, fill: { color: "F3F5F8" }, line: { color: "F3F5F8" } });
    s.addShape("roundRect", { x: gx + a * gw, y: y + 0.04, w: (b - a) * gw, h: 0.38, rectRadius: 0.1, fill: { color: c }, line: { color: c } });
  });
  const mark = (pos, label, c) => {
    s.addShape("line", { x: gx + pos * gw, y: 1.75, w: 0.001, h: 4.45, line: { color: c, width: 1.5, dashType: "dash" } });
    txt(s, label, { x: gx + pos * gw - 0.8, y: 6.25, w: 1.6, h: 0.35, fontSize: 12, bold: true, color: c, align: "center" });
  };
  mark(2.45, "Review II", HEX.orange); mark(3.55, "Review III (planned)", HEX.violet);
  [["completed", HEX.aqua], ["in progress", HEX.gold], ["planned", "C9CFD8"]].forEach(([l, c], i) => {
    s.addShape("rect", { x: 0.5 + i * 1.65, y: 6.33, w: 0.25, h: 0.25, fill: { color: c }, line: { color: c } });
    txt(s, l, { x: 0.82 + i * 1.65, y: 6.28, w: 1.3, h: 0.35, fontSize: 12, color: HEX.ink2 });
  });
  s.addNotes("S1-S3 are complete. S4 and S5 are already running (some control experiments have results we will present at Review III). S6 uses the LeBel 2023 corpus (OpenNeuro ds003020), the same corpus TRIBE v2 was trained on, so the encoder is in-distribution. S7 overlaps S6 so the write-up does not wait for the last experiment.");

  // 24 team
  s = S("Plan");
  s.addText("Division of work", { placeholder: "title" });
  [[0.6, "Abhranil Sarkar", "23BML0077", "Computational and machine-learning track", HEX.blue,
    ["Model instrumentation and the differentiable boundary", "Inversion engine, optimisation, experiment design", "Synthetic characterisation and controls", "Quantitative evaluation and figures"]],
   [6.75, "Tanisha Choudhuri", "23BML0081", "Neurobiological track", HEX.aqua,
    ["Functional neuroanatomy and ROI definition (Destrieux atlas)", "Network topology: language, default-mode, auditory, visual", "Real-data curation and preprocessing (LeBel 2023)", "Interpretation of regional findings"]]].forEach(([x, n, r, role, c, items]) => {
    card(s, x, 1.4, 5.95, 5.4, HEX.tint);
    iconBadge(s, x + 0.3, 1.65, 0.85, I.users, c);
    txt(s, n, { x: x + 1.35, y: 1.6, w: 4.4, h: 0.5, fontSize: 21, bold: true, color: HEX.navy, fontFace: K.THEME.headFontFace });
    txt(s, `${r}  ·  ${role}`, { x: x + 1.35, y: 2.1, w: 4.4, h: 0.5, fontSize: 13.5, color: HEX.ink2 });
    bullets(s, items, { x: x + 0.35, y: 2.95, w: 5.3, h: 3.6, fontSize: 17 });
  });
  s.addNotes("Split as declared in Report I. The two tracks meet at the regional analysis: the ROI definitions come from the neurobiology side and the inversion from the computational side. Both members should be ready to explain the whole pipeline at a high level.");

  // 25 summary
  s = S("Plan");
  s.addText("Summary and what Review III will show", { placeholder: "title" });
  card(s, 0.6, 1.35, 6.0, 5.45, HEX.tint);
  txt(s, "Established today", { x: 0.85, y: 1.5, w: 5.5, h: 0.45, fontSize: 19, bold: true, color: HEX.navy, fontFace: K.THEME.headFontFace });
  bullets(s, [
    "A deep brain encoder can be inverted by gradient descent from its feature boundary",
    "Encoding accuracy and decodability dissociate (28× vs +0.015)",
    "The inverse is stable under noise; magnitude is the fragile part",
    "≈10% of cortex carries most recoverable signal",
    "Generic priors fail; bandwidth needs an explicit HRF model",
  ], { x: 0.85, y: 2.05, w: 5.55, h: 4.6, fontSize: 17 });
  card(s, 6.85, 1.35, 5.85, 5.45, HEX.paleOrange);
  txt(s, "Coming at Review III", { x: 7.1, y: 1.5, w: 5.4, h: 0.45, fontSize: 19, bold: true, color: HEX.navy, fontFace: K.THEME.headFontFace });
  bullets(s, [
    "Is incomplete recovery information loss or non-convexity? (initialisation control, replication across ground truths)",
    "Direct test of the null-space hypothesis",
    "Directional sensitivity and gain identifiability",
    "Linear decoder baseline",
    "Regional recoverability by anatomical network",
  ], { x: 7.1, y: 2.05, w: 5.4, h: 4.6, fontSize: 17 });
  s.addNotes("Close on the open question: we know recovery is incomplete; Review III answers why. If pressed for a preview: replicated runs already show that different starting points reach equally good fits but different answers, which points to non-convexity; we are completing the controls before claiming it.");

  // =========================================================== APPENDIX Q&A
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
      txt(sl, a, { x: 0.75, y: y + 0.55, w: 11.8, h: h - 0.6, fontSize: 16 });
    });
    sl.addNotes(note);
  };
  qa("Q: Why fMRI and not EEG? Why not simultaneous EEG–fMRI?", [
    ["Why not EEG?", "Brain2Qwerty (Nat. Neurosci. 2026): the same architecture reaches 29% character error with MEG but 65% with EEG. EEG lacks the spatial resolution to separate semantic regions."],
    ["Why not EEG–fMRI fusion?", "The best open simultaneous dataset (NKI, 22 adults) contains rest, Inscapes and short movie clips, with no sustained language. The approach is data-limited, not method-limited."],
    ["Why TRIBE v2?", "Largest open-weight encoder: trained on 451.6 h, evaluated on 1 117.7 h from 720 subjects, first of 263 teams at Algonauts 2025, and it predicts all 20 484 cortical vertices."],
  ], "Telesford et al., Sci. Data 2023 is the NKI simultaneous EEG-fMRI dataset if they ask for the source.");
  qa("Q: Isn't inverting a model circular? Why synthetic data?", [
    ["Aren't you just inverting Meta's model, not the brain?", "Yes, deliberately. Any model-based decoder on fMRI inherits the forward model's limits. Characterising the operator bounds every decoder built on it, and the operator reproduces classic findings (FFA, PPA, Broca's area) in its own paper."],
    ["Why synthetic ground truth?", "With real fMRI the true representation behind the signal is unknown, so error can only be estimated through proxies. Synthetic ground truth gives exact error. Real data (LeBel 2023) is the final validation step, not the instrument."],
    ["Is synthetic x realistic?", "We compared off-manifold white noise against smooth low-dimensional trajectories: 0.947 vs 0.942. Results do not depend on the stimulus prior."],
  ], "Key phrase: the model is the instrument; the contribution is the characterisation of its inverse.");
  qa("Q: Methodological choices", [
    ["Why cosine similarity?", "Semantic embeddings are compared by direction in NLP. We also report relative error (magnitude) and retrieval (temporal identity), because they can disagree; under noise they do."],
    ["Why gradient descent instead of a trained decoder?", "A trained decoder conflates its own capacity with the operator's invertibility. Direct inversion isolates the operator. A trained (ridge) baseline is reported at Review III."],
    ["Why decode x, not words?", "x is what the encoder consumes. Mapping x to words is a nearest-neighbour lookup and not where information is lost."],
  ], "If asked about Adam's bias: the Review III initialisation and perturbation experiments address this; the perturbation test does not depend on any optimiser.");
  qa("Q: Ethics, privacy and licensing", [
    ["Is this 'mind reading'?", "No subject data is collected. Results show the opposite risk profile: even with a near-perfect forward model, recovery is incomplete and noise-sensitive. Ethics frameworks (OECD 2019; UNESCO 2025) inform the discussion at Review III."],
    ["Consent and data protection?", "Synthetic data contains no personal data. The real-data phase uses a de-identified public corpus (OpenNeuro) released for research."],
    ["Licences?", "TRIBE v2 weights and code: CC BY-NC 4.0 (non-commercial research permitted). LLaMA-3.2: Meta community licence, access granted to the team."],
  ], "UNESCO adopted its Recommendation on the Ethics of Neurotechnology on 12 November 2025; OECD Recommendation on Responsible Innovation in Neurotechnology, 2019.");

  // 26 references
  pres.addSection({ title: "References" });
  s = S("References");
  s.addText("References", { placeholder: "title" });
  txt(s, [
    "[1] T. M. Mitchell et al., “Predicting human brain activity associated with the meanings of nouns,” Science, vol. 320, pp. 1191–1195, 2008.",
    "[2] K. N. Kay, T. Naselaris, R. J. Prenger, J. L. Gallant, “Identifying natural images from human brain activity,” Nature, vol. 452, pp. 352–355, 2008.",
    "[3] T. Naselaris, K. N. Kay, S. Nishimoto, J. L. Gallant, “Encoding and decoding in fMRI,” NeuroImage, vol. 56, no. 2, pp. 400–410, 2011.",
    "[4] A. G. Huth et al., “Natural speech reveals the semantic maps that tile human cerebral cortex,” Nature, vol. 532, pp. 453–458, 2016.",
    "[5] R. Antonello, A. Vaidya, A. G. Huth, “Scaling laws for language encoding models in fMRI,” in Proc. NeurIPS, vol. 36, 2023.",
    "[6] J. Tang, A. LeBel, S. Jain, A. G. Huth, “Semantic reconstruction of continuous language from non-invasive brain recordings,” Nat. Neurosci., vol. 26, pp. 858–866, 2023.",
    "[7] A. LeBel et al., “A natural language fMRI dataset for voxelwise encoding models,” Sci. Data, vol. 10, art. 555, 2023.",
    "[8] A. Défossez, C. Caucheteux, J. Rapin, O. Kabeli, J.-R. King, “Decoding speech perception from non-invasive brain recordings,” Nat. Mach. Intell., vol. 5, pp. 1097–1107, 2023.",
    "[9] P. S. Scotti et al., “MindEye2: Shared-subject models enable fMRI-to-image with 1 hour of data,” in Proc. ICML, 2024.",
    "[10] S. d’Ascoli et al., “Towards decoding individual words from non-invasive brain recordings,” Nat. Commun., vol. 16, art. 10521, 2025.",
    "[11] J. Lévy, M. Zhang, S. Pinet, J. Rapin, H. Banville, S. d’Ascoli, J.-R. King, “Noninvasive decoding of typed sentences from human brain activity,” Nat. Neurosci., 2026.",
    "[12] S. d’Ascoli, J. Rapin, Y. Benchetrit, H. Banville, J.-R. King, “TRIBE: TRImodal Brain Encoder for whole-brain fMRI response prediction,” in Proc. ICLR, 2026.",
    "[13] S. d’Ascoli et al., “A foundation model of vision, audition, and language for in-silico neuroscience,” arXiv:2605.04326, 2026.",
    "[14] P. C. Hansen, Discrete Inverse Problems: Insight and Algorithms. Philadelphia, PA: SIAM, 2010.",
    "[15] D. P. Kingma, J. Ba, “Adam: A method for stochastic optimization,” in Proc. ICLR, 2015.",
    "[16] J. L. Gardner, T. Liu, “Inverted encoding models reconstruct an arbitrary model response, not the stimulus,” eNeuro, vol. 6, no. 2, ENEURO.0363-18.2019, 2019.",
    "[17] Bladon, Bent, “Feature visualization recovers known cortical selectivity from TRIBE v2,” arXiv:2605.13904, 2026.",
    "[18] Y. Benchetrit et al., “Boosting brain-to-image decoding with TRIBE v2 data augmentation,” arXiv:2606.06345, 2026.",
  ].join("\n"), { x: 0.5, y: 1.3, w: 12.3, h: 5.6, fontSize: 12.5, paraSpaceAfter: 3, color: HEX.ink });
  s.addNotes("IEEE format, peer-reviewed sources and three arXiv preprints (TRIBE v2 and its two 2026 follow-ups, needed as novelty evidence). No websites. Placed last so it stays on screen during questions.");

  await pres.writeFile({ fileName: "/home/claude/work/deck/Review2_Sarkar_Choudhuri.pptx" });
  await applyTheme("/home/claude/work/deck/Review2_Sarkar_Choudhuri.pptx", K.THEME);
  console.log("written");
})();
