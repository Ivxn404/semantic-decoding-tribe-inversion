const fs = require("fs");
const pptxgen = require("pptxgenjs");
const { applyTheme } = require("/mnt/skills/public/pptx/scripts/apply_theme.js");
const fa = require("react-icons/fa");
const K = require("./common");
const { addNovelty } = require("./novelty");
const { HEX, txt, bullets, card, badge, iconBadge, stat, figure, caption, table, arrow, box } = K;

const FOOT = "BECE497J Project-I  ·  Review III  ·  A. Sarkar (23BML0077)  ·  T. Choudhuri (23BML0081)";
const R = "/home/claude/work/results";
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
  pres.title = "Review III: Conditioning and Non-Convexity of Semantic Decoding";
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
    { text: "Project-I (BECE497J)  ·  Review III  ·  60–70% milestone", options: { breakLine: true, bold: true, color: "FFFFFF" } },
    { text: "Abhranil Sarkar (23BML0077)   ·   Tanisha Choudhuri (23BML0081)", options: { breakLine: true } },
    { text: "Guide: Dr. Sharmila Nageswaran, Associate Professor, School of Electronics Engineering", options: {} },
  ], { placeholder: "body" });
  s.addNotes("Since Review II we answered the question we left open: why is recovery incomplete? Short answer: not because information is destroyed, but because the inverse problem is non-convex, with errors concentrated in the operator's least-sensitive directions. We also completed the regional analysis on anatomical networks.");

  // ============================================================ STATUS
  s = S("Opening");
  s.addText("Progress since Review II", { placeholder: "title" });
  stat(s, 0.6, 1.4, 2.9, "0.817", "min agreement between fit-matched solutions, 4 ground truths (sd 0.007)", HEX.orange);
  stat(s, 3.7, 1.4, 2.9, "0th", "percentile: solution-difference directions vs 200 random directions", HEX.blue);
  stat(s, 6.8, 1.4, 2.9, "15×", "gradient inversion over a ridge decoder (0.918 vs 0.060)", HEX.aqua);
  stat(s, 9.9, 1.4, 2.9, "6", "anatomical networks mapped and inverted on fsaverage5", HEX.violet);
  txt(s, "Completion against the project plan", { x: 0.6, y: 3.75, w: 8, h: 0.35, fontSize: 15, bold: true, color: HEX.navy });
  const phases = [["Formulation", 1, HEX.aqua], ["Instrumentation", 1, HEX.aqua], ["Core characterisation", 1, HEX.aqua],
    ["Controls & validation", 1, HEX.aqua], ["Regional analysis", 1, HEX.aqua], ["Real-data study", 0.35, HEX.gold], ["Write-up", 0.15, HEX.gold]];
  let px = 0.6; const pw = 12.1 / phases.length;
  phases.forEach(([n, f, c]) => {
    s.addShape("rect", { x: px, y: 4.2, w: pw - 0.06, h: 0.42, fill: { color: "E4E8EE" }, line: { color: "E4E8EE" } });
    s.addShape("rect", { x: px, y: 4.2, w: (pw - 0.06) * f, h: 0.42, fill: { color: c }, line: { color: c } });
    txt(s, n, { x: px, y: 4.7, w: pw - 0.1, h: 0.5, fontSize: 12, color: HEX.ink2 });
    px += pw;
  });
  card(s, 0.6, 5.45, 12.1, 1.35, HEX.tint);
  txt(s, [{ text: "Status: ≈ 68% complete. ", options: { bold: true, color: HEX.navy } },
    { text: "Synthetic characterisation, controls and the regional analysis are finished; real-fMRI validation is under way with first results on a held-out story. Remaining: completing the real-data study and the final report and paper." }],
    { x: 0.85, y: 5.6, w: 11.6, h: 1.1, fontSize: 16, valign: "middle" });
  s.addNotes("≈68% = completed person-hours in Report I Table-3 over 580 (literature, setup, framework, characterisation, regional analysis, part of real data and reporting). Remaining: the rest of the real-data study and the write-up.");

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
    ["O6", "Validate on real naturalistic fMRI (LeBel 2023)", "In progress", HEX.gold],
  ];
  objs.forEach(([id, t, st, c], i) => {
    const y = 2.75 + i * 0.66;
    badge(s, 0.7, y, 0.52, id, HEX.navy, 13);
    txt(s, t, { x: 1.4, y: y + 0.02, w: 9.3, h: 0.5, fontSize: 15.5, valign: "middle" });
    s.addShape("roundRect", { x: 10.9, y: y + 0.07, w: 1.75, h: 0.4, rectRadius: 0.2, fill: { color: c }, line: { color: c } });
    txt(s, st, { x: 10.9, y: y + 0.07, w: 1.75, h: 0.4, fontSize: 12, bold: true, color: "FFFFFF", align: "center", valign: "middle" });
  });
  s.addNotes("Five of six objectives complete. O6 is the real-data validation, deliberately last because synthetic ground truth is the instrument and real data the external check.");

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
    ["Incomplete recovery is non-convexity, not a null space", "Fit-matched solutions disagree (min cosine 0.817 ± 0.007, 4 ground truths); perturbations show barriers", "Shown"],
    ["Error concentrates in the operator's least-sensitive directions", "Solution-difference direction 1.9× below the random median; 0th percentile of 200", "Shown"],
    ["Predictable is not recoverable, region by region", "Visual −0.125, somatomotor +0.102 vs size-matched random sets; ≈10× the control spread", "Shown"],
    ["Nonlinear inversion beats linear decoding", "0.918 vs 0.060 for the best ridge decoder (≈15×)", "Shown"],
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
  s.addNotes("Same core as Review II (top row). Added: the anatomical masks and sensitivity maps from the neurobiology track, the hypothesis-testing layer, and explicit controls for every regional comparison.");

  // hypotheses
  s = S("Method and validation");
  s.addText("Four explanations for incomplete recovery", { placeholder: "title" });
  table(s, ["Hypothesis", "Predicted signature", "Test", "Verdict"], [
    ["H1  Information loss (null space)", "Fit-matched solutions differ along a direction the operator ignores", "Perturb along the difference d vs random directions", { text: "Rejected", options: { bold: true, color: "C0392B" } }],
    ["H2  Non-convexity", "Distinct minima at equal fit, separated by a barrier", "Init control at matched fit; replicate × 4", { text: "Supported", options: { bold: true, color: "138A5E" } }],
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
    ["Under-converged runs posing as alternative solutions", "Only solutions within 2× of best fit compared", "gauss_5.0 excluded (3.4× worse fit)"],
    ["One trajectory being special", "Replicate across 4 independent ground truths", "min pairwise 0.8165 ± 0.0068"],
    ["Inference instead of demonstration", "Direct perturbation test along d", "Ratio 2.6× → 0.6×: H1 rejected"],
    ["ROI size confound", "Random vertex sets of identical size", "Paired comparison per network"],
    ["Random-seed luck in controls", "Second random seed for two networks", `Δ between seeds ≤ ${f3(INTERP.seed_gap_max)}`],
    ["Platform dependence", "Whole-cortex anchor re-run on CPU vs earlier GPU", `${f3(ROW["Whole cortex"].cosine)} vs 0.836 (GPU)`],
  ], { x: 0.5, y: 1.35, w: 12.3, colW: [3.9, 4.6, 3.8], fontSize: 15, rowH: 0.62 });
  s.addNotes("This is the 'with validation' part of the top rubric band for methodology. The CPU anchor is the same ground truth, initialisation and budget as the Stage 6 GPU run; agreement shows results are not a platform artefact.");

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

  // null space rejected
  s = S("Results");
  s.addText("Information-loss hypothesis rejected", { placeholder: "title" });
  figure(s, "fig_nullspace_test.png", 0.4, 1.3, 7.0, 5.3);
  card(s, 7.7, 1.4, 5.1, 5.35, HEX.tint);
  txt(s, [
    { text: "Test", options: { bold: true, color: HEX.navy, fontSize: 17, breakLine: true } },
    { text: "Let d be the difference between two fit-matched solutions. If d lay in a null space, moving along d would barely change the predicted response, at every scale.", options: { breakLine: true } },
    { text: " ", options: { breakLine: true } },
    { text: "Result", options: { bold: true, color: HEX.navy, fontSize: 17, breakLine: true } },
    { text: "Privileged only for small steps (2.6×). At the full separation, moving along d changes the response more than a random direction (0.6×).", options: { breakLine: true } },
    { text: " ", options: { breakLine: true } },
    { text: "Meaning", options: { bold: true, color: HEX.navy, fontSize: 17, breakLine: true } },
    { text: "The two answers are separate minima with a barrier between them, not points on a flat valley. Recovery is limited by optimisation geometry, not destroyed information.", options: {} },
  ], { x: 7.95, y: 1.55, w: 4.65, h: 5.1, fontSize: 14.5 });
  s.addNotes("This is the result that changed the project's framing. We expected a null space and designed the test to confirm it; it falsified it. Locality check: the advantage of d drops from 2.0× at the point where it was found to 1.0-1.1× at two other ground truths. This test uses only forward passes, so it does not depend on any optimiser.");

  // sensitivity
  s = S("Results");
  s.addText("Errors concentrate in the operator's weakest directions", { placeholder: "title" });
  figure(s, "fig_sensitivity.png", 0.4, 1.3, 8.2, 4.6);
  stat(s, 8.95, 1.5, 3.9, "1.9×", "lower sensitivity along d than the random median", HEX.orange, 44);
  stat(s, 8.95, 3.2, 3.9, "6 / 6", "pairwise difference directions below every random direction", HEX.blue, 44);
  card(s, 0.5, 6.0, 12.3, 0.85, HEX.tint);
  txt(s, "Anisotropic ill-conditioning, quantified: what the inverse fails to pin down is exactly what the operator responds to least (s = 0.095 vs random 0.135–0.250).",
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
  ], { x: 0.5, y: 1.35, w: 12.3, colW: [3.0, 3.2, 3.1, 3.0], fontSize: 15, rowH: 0.55 });
  card(s, 0.5, 4.6, 12.3, 2.2, HEX.tint);
  txt(s, "Why this slide exists: the non-convexity claim does not rest on the failed optimiser control. It rests on the perturbation and sensitivity tests (forward passes only) and on replication across four ground truths. A converged second optimiser would strengthen it, and is listed as future work.",
    { x: 0.75, y: 4.7, w: 11.8, h: 2.0, fontSize: 16, valign: "middle" });
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
    [I.times, "C0392B", "Not destroyed information", "No null space: the barrier test rejects it (0.6× at full separation)."],
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
    ["No null space", "Perturbation along d", "0.6× at full separation", "Established"],
    ["Errors in weak directions", "200 random directions", "6/6 below random minimum", "Established"],
    ["Gain identifiable", "Forward rescaling", "±10% → 7–9× floor", "Established"],
    ["Stable under noise", "7 noise levels", "0.836 → 0.298 monotone", "Established"],
    ["≈10% cortex suffices", "6 extents", "0.777 at 2 000 vertices", "Established"],
    ["Beats linear decoding", "Ridge baseline", "0.918 vs 0.060", "Indicative"],
    ["Anatomical topography", "Sensitivity maps, 6 networks", "z +27 to +41 in matching modality", "Established"],
    ["Regional recoverability", "ROI vs matched random", INTERP.table_key, INTERP.table_status],
    ["Real-data decodability", "LeBel 2023, held-out story", "4/5 segments (chance 2.2%), cosine 0.02", "First result"],
  ], { x: 0.5, y: 1.3, w: 12.3, colW: [3.0, 3.4, 3.9, 2.0], fontSize: 13.5, rowH: 0.45 });
  s.addNotes("The ledger the panel can interrogate. 'Established' means replicated or tested against a control; 'Indicative' means the comparison has a stated caveat.");

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

  // ============================================================ REMAINING
  pres.addSection({ title: "Remaining work" });
  s = S("Remaining work", "Section");
  s.addText("Limitations and remaining work", { placeholder: "title" });
  s.addText("Validation on real naturalistic fMRI and the final write-up", { placeholder: "body" });

  s = S("Remaining work");
  s.addText("Limitations", { placeholder: "title" });
  bullets(s, [
    "Synthetic ground truth lives in a random low-dimensional subspace, not real language embeddings; qualitative findings are expected to transfer, absolute values may not.",
    "Inversion targets the aggregated representation x, one stage after raw LLaMA embeddings.",
    "All solutions from Adam; the SGD / L-BFGS control did not converge under the settings tried.",
    "No haemodynamic operator in the released model, so temporal bandwidth limits cannot be measured.",
    "Release ships only the shared 'average subject' layer, so per-subject analysis is not possible with public weights.",
    "Regional z-scores use a random-vertex null that ignores spatial autocorrelation; a spin test is stricter.",
    "Regional inversion uses one ground truth and one budget (8 000 steps, CPU); comparisons are internal to that run, and faster convergence cannot yet be separated from a better optimum.",
    "Real-data test: one subject (UTS03), one held-out story, 5 inversion queries; per-network inversion on real data not yet run.",
  ], { x: 0.6, y: 1.4, w: 12.1, h: 5.4, fontSize: 16 });
  s.addNotes("State limitations before they are raised. None of them affects the central claims (dissociation, non-convexity, rejected null space), which were replicated and tested with optimiser-independent forward passes.");

  // ---- real data (LeBel 2023), results read from lebel/realdata_audio_text.json
  const RD = JSON.parse(fs.readFileSync("../results/realdata_audio_text.json", "utf8"));
  const RI = RD.identification_forward.top2000, RX = RD.inversion_identification;
  s = S("Remaining work");
  s.addText("Real-data validation in progress: first results (LeBel 2023)", { placeholder: "title" });
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
  s.addNotes("Everything tunable (the 6-s alignment offset, the 2 000 vertices) was fitted on the five training stories; wheretheressmoke is held out and is not in TRIBE v2's training set. Text + audio features (LLaMA-3.2-3B and w2v-BERT, TRIBE v2's own pipeline) on a Colab T4, 2 000 inversion steps. Oracle (inverting the model's own prediction, same budget): 5/5 identified, cosine 0.22, so even noise-free inversion recovers little of x. An earlier audio-only CPU run gave the same pattern (5/5, cosine 0.06). The key real-data finding mirrors the synthetic one: identification succeeds while cosine recovery is low, i.e. the inverse pins down which moment was heard but not the full representation. Avatar fails alignment QC (no lag peak) and is kept only as a distractor, which makes identification harder, not easier.");

  // ---- real data, detail 1: encoding across stories and networks
  const RA = JSON.parse(fs.readFileSync("../results/realdata_audio.json", "utf8"));
  const NETS = ["Auditory", "Language (L)", "Language homologue (R)", "Default mode", "Somatomotor", "Visual"];
  const SHORT = { "Auditory": "Aud.", "Language (L)": "Lang. L", "Language homologue (R)": "Lang. R", "Default mode": "DMN", "Somatomotor": "SomMot", "Visual": "Visual" };
  const STO = ["wheretheressmoke", "adollshouse", "avatar", "legacy", "souls", "undertheinfluence"];
  s = S("Remaining work");
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
  s = S("Remaining work");
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

  s = S("Remaining work");
  s.addText("Timeline to completion", { placeholder: "title" });
  const months = ["Aug", "Sep", "Oct", "Nov", "Dec"]; const gx = 4.6, gw = 1.62;
  months.forEach((m, i) => txt(s, m, { x: gx + i * gw, y: 1.35, w: gw, h: 0.35, fontSize: 14, bold: true, color: HEX.navy, align: "center" }));
  [["S1 Literature, formulation", 0, 0.9, HEX.aqua], ["S2 Instrumentation", 0.4, 1.3, HEX.aqua], ["S3 Core characterisation", 0.9, 2.3, HEX.aqua],
   ["S4 Controls and hypothesis tests", 1.8, 2.5, HEX.aqua], ["S5 Regional analysis", 2.2, 2.6, HEX.aqua], ["S6 Real-data study", 2.6, 4.0, HEX.gold],
   ["S7 Paper and final report", 3.3, 5.0, HEX.gold]].forEach(([n, a, b, c], i) => {
    const y = 1.85 + i * 0.62;
    txt(s, n, { x: 0.5, y, w: 4.0, h: 0.45, fontSize: 13.5, valign: "middle" });
    s.addShape("rect", { x: gx, y: y + 0.04, w: gw * 5, h: 0.38, fill: { color: "F3F5F8" }, line: { color: "F3F5F8" } });
    s.addShape("roundRect", { x: gx + a * gw, y: y + 0.04, w: (b - a) * gw, h: 0.38, rectRadius: 0.1, fill: { color: c }, line: { color: c } });
  });
  s.addShape("line", { x: gx + 2.45 * gw, y: 1.75, w: 0.001, h: 4.45, line: { color: HEX.orange, width: 1.5, dashType: "dash" } });
  txt(s, "Review II", { x: gx + 2.45 * gw - 0.8, y: 6.25, w: 1.6, h: 0.35, fontSize: 12, bold: true, color: HEX.orange, align: "center" });
  s.addShape("line", { x: gx + 3.5 * gw, y: 1.75, w: 0.001, h: 4.45, line: { color: HEX.violet, width: 1.5, dashType: "dash" } });
  txt(s, "Review III", { x: gx + 3.5 * gw - 0.8, y: 6.25, w: 1.6, h: 0.35, fontSize: 12, bold: true, color: HEX.violet, align: "center" });
  s.addNotes("S1-S5 complete. S6 runs on Colab GPU with checkpointed stages; S7 drafting has started from the computational methods and results write-up.");

  s = S("Remaining work");
  s.addText("Conclusion", { placeholder: "title" });
  card(s, 0.6, 1.35, 12.1, 1.5, HEX.navy);
  txt(s, "A better brain encoder does not, by itself, make meaning more decodable. The limit is the geometry of the inverse, not lost information.",
    { x: 0.85, y: 1.45, w: 11.6, h: 1.3, fontSize: 20, bold: true, color: "FFFFFF", valign: "middle", fontFace: K.THEME.headFontFace });
  bullets(s, [
    "Encoding error falls 28× while recovery saturates (0.944)",
    "Inverse is non-convex: equal fits disagree at 0.82 cosine, reproducibly; no null space",
    "Disagreement lies in the operator's least-sensitive directions",
    "The operator's topography matches anatomy; regional recoverability measured against matched controls",
    "First real-fMRI result: inverting held-out BOLD identifies the heard moment, yet recovers little of x, as the synthetic analysis predicts",
    "Next: complete the real-data study, then the final report and paper",
  ], { x: 0.85, y: 3.15, w: 11.6, h: 3.6, fontSize: 16 });
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
    ["Couldn't Adam's implicit bias create the different answers?", "The barrier between minima is shown with forward passes only (perturbation test), and the weak-direction result is a Jacobian probe; neither involves an optimiser. Different initialisation distributions reach different minima reproducibly across four ground truths."],
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
    ["Your results are all synthetic. Are they real findings?", "They are exact measurements of a real, published operator. Real fMRI adds subject and measurement noise on top; the noise sweep shows how much that costs. Real-data identification is the final phase."],
    ["Why should a clinician care?", "Because the bottleneck is search, not encoder size: better decoders will come from restarts, ensembling over minima and language-derived priors."],
  ], "Return to the conclusion slide after this one if the discussion drifts.");
  qa("Q: Why fMRI, not EEG? Why TRIBE v2?", [
    ["Why not EEG?", "Brain2Qwerty (Nat. Neurosci. 2026): 29% character error with MEG vs 65% with EEG on the same architecture."],
    ["Why not simultaneous EEG–fMRI?", "The best open simultaneous dataset (NKI, 22 adults) has rest, Inscapes and short movie clips, no sustained language: data-limited, not method-limited."],
    ["Why TRIBE v2?", "Largest open-weight encoder: 451.6 h training, 1 117.7 h evaluation across 720 subjects, all 20 484 cortical vertices, first at Algonauts 2025."],
  ], "Same answers as Review II, kept for continuity.");

  pres.addSection({ title: "References" });
  s = S("References");
  s.addText("References", { placeholder: "title" });
  txt(s, [
    "[1] T. Naselaris, K. N. Kay, S. Nishimoto, J. L. Gallant, “Encoding and decoding in fMRI,” NeuroImage, vol. 56, no. 2, pp. 400–410, 2011.",
    "[2] A. G. Huth et al., “Natural speech reveals the semantic maps that tile human cerebral cortex,” Nature, vol. 532, pp. 453–458, 2016.",
    "[3] R. Antonello, A. Vaidya, A. G. Huth, “Scaling laws for language encoding models in fMRI,” in Proc. NeurIPS, vol. 36, 2023.",
    "[4] J. Tang, A. LeBel, S. Jain, A. G. Huth, “Semantic reconstruction of continuous language from non-invasive brain recordings,” Nat. Neurosci., vol. 26, pp. 858–866, 2023.",
    "[5] A. LeBel et al., “A natural language fMRI dataset for voxelwise encoding models,” Sci. Data, vol. 10, art. 555, 2023.",
    "[6] J. Lévy et al., “Noninvasive decoding of typed sentences from human brain activity,” Nat. Neurosci., 2026.",
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
  ].join("\n"), { x: 0.5, y: 1.3, w: 12.3, h: 5.6, fontSize: 11.5, paraSpaceAfter: 2 });
  s.addNotes("IEEE format. OECD and UNESCO entries are normative instruments, cited as such.");

  await pres.writeFile({ fileName: "/home/claude/work/deck/Review3_Sarkar_Choudhuri.pptx" });
  await applyTheme("/home/claude/work/deck/Review3_Sarkar_Choudhuri.pptx", K.THEME);
  console.log("written");
})();
