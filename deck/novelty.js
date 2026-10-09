// "Novelty, with evidence" slides shared by the Review II and Review III decks.
const K = require("./common");
const { HEX, txt, card, badge, table } = K;

const Y = { text: "●", options: { align: "center", color: HEX.navy, bold: true, fontSize: 18 } };
const N = { text: "○", options: { align: "center", color: HEX.muted, fontSize: 18 } };
const YB = { text: "●", options: { align: "center", color: HEX.orange, bold: true, fontSize: 18, fill: { color: "FFF4C2" } } };

// r: citation numbers {kay, gardner, tang, tribe2, bladon, benchetrit}
// claims: [[contribution, evidence, status], ...]
function addNovelty(S, sec, r, claims, searchDate = "9 October 2026") {
  // ---- 1  comparison matrix
  let s = S(sec);
  s.addText("Proof of novelty I: prior-art comparison", { placeholder: "title" });
  table(s, ["Closest prior work", "Nonlinear deep encoder", "Optimises encoder input", "Tests uniqueness / conditioning", "Region-wise recoverability"], [
    [`Kay et al., Nature 2008 [${r.kay}]`, N, N, N, N],
    [`Gardner & Liu, eNeuro 2019 [${r.gardner}]`, N, Y, Y, N],
    [`Tang et al., Nat. Neurosci. 2023 [${r.tang}]`, N, Y, N, Y],
    [`d'Ascoli et al., TRIBE v2, 2026 [${r.tribe2}]`, Y, N, N, N],
    [`Bladon & Bent, arXiv May 2026 [${r.bladon}]`, Y, Y, N, N],
    [`Benchetrit et al., arXiv Jun 2026 [${r.benchetrit}]`, Y, N, N, N],
    [{ text: "This work", options: { bold: true, fill: { color: "FFF4C2" } } }, YB, YB, YB, YB],
  ], { x: 0.5, y: 1.3, w: 12.3, colW: [4.3, 2.0, 2.0, 2.0, 2.0], fontSize: 14.5, rowH: 0.5 });
  card(s, 0.5, 5.4, 12.3, 1.45, HEX.navy);
  txt(s, [{ text: "Only this work fills all four columns.  ", options: { bold: true, color: "FFC9A8" } },
    { text: `The closest result, Gardner & Liu [${r.gardner}], proves that a linear inverted encoding model recovers the stimulus only up to an invertible linear transform. We ask the same question of a 177 M-parameter nonlinear encoder, where no closed-form answer exists, and answer it empirically with exact ground truth.`, options: { color: "FFFFFF" } }],
    { x: 0.75, y: 5.5, w: 11.8, h: 1.25, fontSize: 15, valign: "middle" });
  s.addNotes("● = the paper does this; ○ = it does not. Tang 2023 optimises over word sequences (beam search scored by a linear encoder on GPT features) and compares cortical networks, so it gets two marks; its encoder is linear in the LM features, and it never asks whether the answer is unique. Gardner & Liu is the theoretical ancestor of our question, for linear models only. If a reviewer names another paper, ask which column it fills; none we found fills the third column for a deep encoder.");

  // ---- 2  search protocol + closest TRIBE v2 work
  s = S(sec);
  s.addText("Proof of novelty II: search protocol and the closest TRIBE v2 work", { placeholder: "title" });
  card(s, 0.5, 1.35, 5.6, 5.45, HEX.tint);
  txt(s, "Search protocol", { x: 0.75, y: 1.5, w: 5.1, h: 0.45, fontSize: 19, bold: true, color: HEX.navy, fontFace: K.THEME.headFontFace });
  txt(s, [
    { text: "Date: ", options: { bold: true } }, { text: `${searchDate}`, options: { breakLine: true } },
    { text: "Sources: ", options: { bold: true } }, { text: "arXiv, Google Scholar, general web", options: { breakLine: true } },
    { text: "Queries: ", options: { bold: true } }, { text: "\"TRIBE v2\"; invert / inversion / identifiability / conditioning / non-convex + \"brain encoding model\" / \"fMRI encoder\"", options: { breakLine: true } },
    { text: "Inclusion: ", options: { bold: true } }, { text: "any work that inverts, optimises the input of, or analyses the identifiability of a brain encoding model", options: { breakLine: true } },
    { text: "Result: ", options: { bold: true } }, { text: "two TRIBE v2 follow-ups (right). Neither tests whether the inverse is unique or how it is conditioned.", options: {} },
  ], { x: 0.75, y: 2.05, w: 5.15, h: 4.6, fontSize: 14.5, paraSpaceAfter: 8 });
  const tw = [
    [`Bladon & Bent, May 2026 [${r.bladon}]`, "Feature visualisation: optimises inputs to maximise a region's predicted response and recovers known cortical selectivity.",
      "Asks what a region prefers. Does not ask whether the input can be recovered, or whether the answer is unique."],
    [`Benchetrit et al., June 2026 [${r.benchetrit}]`, "Uses TRIBE v2 forwards to synthesise fMRI that augments training of a brain-to-image decoder.",
      "The encoder is only run forwards; its inverse is never analysed."],
  ];
  tw.forEach(([h, what, gap], i) => {
    const y = 1.35 + i * 2.8;
    card(s, 6.35, y, 6.45, 2.6, i ? "F6F8FB" : HEX.paleBlue);
    txt(s, h, { x: 6.6, y: y + 0.12, w: 6.0, h: 0.42, fontSize: 16, bold: true, color: HEX.navy });
    txt(s, [{ text: "What it does: ", options: { bold: true } }, { text: what, options: { breakLine: true } },
      { text: "Difference: ", options: { bold: true, color: HEX.orange } }, { text: gap }],
      { x: 6.6, y: y + 0.6, w: 6.0, h: 1.9, fontSize: 14.5, paraSpaceAfter: 6 });
  });
  s.addNotes("This is the evidence behind the word 'first'. Say it carefully: 'we found no published inverse or identifiability analysis of a deep foundation encoder as of 9 October 2026', not 'nobody has ever done this'. Both TRIBE v2 follow-ups are from 2026 and are the closest possible competitors; neither touches uniqueness or conditioning.");

  // ---- 3  claims ledger
  s = S(sec);
  s.addText("Novel contributions, each with its evidence", { placeholder: "title" });
  table(s, ["#", "Contribution", "Evidence", "Status"], claims.map((c, i) => [
    { text: String(i + 1), options: { bold: true, align: "center", color: HEX.navy } }, c[0], c[1],
    { text: c[2], options: { bold: true, color: c[2] === "Shown" ? HEX.aqua : HEX.gold } }]),
    { x: 0.5, y: 1.3, w: 12.3, colW: [0.5, 4.6, 5.8, 1.4], fontSize: 14, rowH: 0.78 });
  s.addNotes("Each claim is paired with the number that supports it, so a reviewer can challenge the evidence rather than the wording. Status 'Shown' means the evidence is on a slide in this deck.");
}

module.exports = { addNovelty };
