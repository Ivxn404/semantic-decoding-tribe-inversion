// Hover explanations for everything on the page, and the project assistant in the corner.
(() => {
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];

// ---------------------------------------------------------------- 1. plain-language explanations
const TIPS = {
  "#heroBrain": "A 3-D model of the brain's outer surface. Each colour shows which input TRIBE v2 reacts to most at that spot: red = words, green = sound, blue = video. Drag to turn it.",
  "#dataBars": "Hours of brain scans in each dataset TRIBE v2 learned from. Longer bar = more data. Click a dataset for details.",
  "#dataCard": "Details of the selected dataset: who was scanned, what they watched or heard, and how much data there is.",
  "#eegBrain": "Left pair: a brain activity pattern as fMRI sees it, sharp and detailed. Right pair: the same pattern as EEG would see it from the scalp, blurred and measured only at the black dots (electrodes).",
  "#eegSeg": "Change how many EEG electrodes are simulated. Even 128 stays far coarser than fMRI.",
  "#eegReasons": "Each card is one reason we used fMRI; the last card is what EEG does better.",
  "#pipeSvg": "How the method works: the stimulus flows left to right through feature extractors into TRIBE v2, which predicts brain activity. We cut in at the red dashed line and adjust only the input there until the prediction matches the target.",
  "#gtStats": "Compares our test stimulus with real story stimuli. Real ones also use only a few directions, like ours, and have the same size; pure noise does not. So our test input is realistic.",
  "#gtTable": "The same experiment with a real stimulus as the hidden answer. The problems we found get worse, not better, so our synthetic test is the cautious case.",
  "#labRun": "Start or pause the search for the hidden input. Several starting guesses run at the same time.",
  "#labReset": "Pick a new hidden input to recover.",
  "#labStatus": "Progress: steps done, how much the prediction error has dropped, and how close each guess is to the true input (1 = perfect).",
  "#chLoss": "How far the predicted brain activity is from the target. Lower is better; each line is one starting guess. It falls about a million-fold.",
  "#chCos": "How close the recovered input is to the true one (1 = identical). It stops improving early while the error keeps falling: a better fit does not mean a better answer.",
  "#hTrue": "The hidden input we are trying to recover (rows = time, columns = input features).",
  "#hRec": "What the search recovered from start 1. The more it looks like the panel above, the better the recovery.",
  "#agree": "How similar the answers from different starts are (1 = identical). Equally good fits with different answers mean the problem has more than one 'solution'.",
  "#chSens": "Grey bars: how strongly the encoder reacts to 200 random nudges of the input. Coloured lines: its reaction along the difference between two answers, and along the actual error. Lines to the left of the bars mean the encoder barely notices those differences, so the data cannot tell the answers apart.",
  "#replayBrain": "A real TRIBE v2 run. Left: the brain activity we aim for. Middle: what the current guess produces. Right: how well each spot is fitted over time (yellow = well, grey = poorly).",
  "#rpPlay": "Play through the logged steps of the real run.",
  "#rpStep": "Drag to move through the optimisation steps of the real run.",
  "#rpTxt": "Current step, median fit quality across the brain (R², 1 = perfect) and how close each start is to the true input.",
  "#rpLoss": "Prediction error of each start on the real model, falling as the search runs.",
  "#rpCos": "Solid lines: how close each guess is to the true input. Dashed: how much the guesses agree with each other. Both stay low even as the fit becomes nearly perfect.",
  "#fTabs": "Five results about the inverse problem, one per tab.",
  "#roiBrain": "The six brain networks we tested, drawn on the cortex. The selected network is highlighted.",
  "#netList": "Each brain network, and how much better (+) or worse (−) it is for recovering the input than random spots of the same size. Click one.",
  "#roiScatter": "Each dot is a network. Across: how strongly the model responds there. Up: how much better than random it is for decoding. Strong response does not mean good decoding.",
  "#lagCh": "Blood-flow responses lag behind what is heard. This shows how well model and scan line up at each delay; best at 4 seconds.",
  "#encCh": "How well TRIBE v2 predicts this person's real scans in each network (higher = better).",
  "#idCh": "Given 20 s of real scan, how often the model picks the right moment out of 194. Chance is 0.5%.",
  "#idSeg": "Measured BOLD: real scanner data. Noise-free oracle: the model's own prediction, i.e. perfect data. The oracle shows the limit comes from the model, not from scanner noise.",
  "#ranks": "Each row is one 100-second piece of the story; each box is one of 45 candidates, best match on the left. Red is the true one: red at the far left means it was identified correctly.",
  "#qr": "Scan to open the project's code and notebooks.",
  "#notesBtn": "Show or hide the presenter's speaking notes (key N).",
};
const CTL = { cK: "How many independent starting guesses to run.", cSpread: "How far apart the starting guesses begin. Wider spread: they end up in more different places.",
  cNoise: "Adds random noise to the brain signal, like a real scanner.", cObs: "How much of the brain is observed. Less brain: less information to recover from.",
  cL2: "A simple preference for small answers (a 'prior'). It shows that generic help does not fix recovery." };
const FIND = { "Dissociation": "Spending more effort keeps lowering the prediction error, but recovery of the input barely moves.",
  "Non-convexity": "Different starting points reach equally good fits that are different answers.",
  "Barrier test": "Walk in a straight line between two answers and the error rises in the middle: a hill between two valleys. So they are separate solutions, not one flat region.",
  "Sensitivity": "The model reacts weakly in exactly the directions where the answers differ, so the data cannot separate them.",
  "Conditioning": "How recovery changes with scale, noise, brain coverage and priors, and how a simple linear decoder compares." };
const KPI = [
  [/^training subjects/, "People whose brain scans were used to train TRIBE v2."],
  [/^training fMRI/, "Total scanning time used for training."],
  [/test only/, "More people TRIBE v2 was tested on without retraining."],
  [/fMRI in all/, "All scanning time across training and testing."],
  [/^subjects$/, "People scanned in this dataset."], [/^sessions$/, "Separate scanning sessions."], [/^fMRI$/, "Hours of brain scans in this dataset."],
  [/repetition time|scanner/, "How often the scanner takes a whole-brain picture, or which scanner was used."],
  [/frozen parameters/, "TRIBE v2's size: 177 million numbers, none of which we change."],
  [/dimensions of x/, "How many numbers describe the stimulus at each time step. This is what we solve for."],
  [/reproduces the release/, "A perfect match: our rebuilt model gives exactly the same predictions as Meta's release, so we are inverting the real thing."],
  [/cosine schedule/, "The optimiser and step size used to search for the input."],
  [/^recovery ·/, "How close this start's answer is to the true input (1 = identical)."],
  [/prediction error reduction/, "How many times smaller the prediction error became during the run."],
  [/lowest agreement/, "The least similar pair of answers (1 = identical). Low means equally good fits disagree."],
  [/flat null space/, "Halfway between two answers the prediction changes more than between the answers themselves: there is a hill between them."],
  [/forward sensitivity/, "How strongly TRIBE v2 responds in this network, compared with the brain average."],
  [/recovery from this network/, "How much of the input comes back using only this network (1 = all of it)."],
  [/random vertices/, "The same, using random brain spots of the same size, for comparison."],
  [/participation ratio/, "How varied the network's responses are. More varied responses carry more information."],
  [/ranked first/, "How many of the 5 story pieces were correctly picked out of 45 candidates."],
  [/^chance/, "What random guessing would score."],
  [/cosine of x̂/, "How close the recovered stimulus is to the true one (1 = identical): very low, so identification works but reconstruction does not."],
  [/rank percentile/, "On average, how near the top the true piece was ranked (100% = always first)."],
];
const BIG = { "28.4×": "How much the prediction error dropped while recovery hardly improved.", "0.817": "How much two equally good answers agree at worst (1 = identical).",
  "4 / 5": "Story pieces correctly identified from real brain scans, even though the reconstruction itself is poor." };

function applyTips() {
  for (const [s, t] of Object.entries(TIPS)) { const el = $(s); if (!el) continue; const host = el.closest(".card") && el.matches("canvas, svg, img, tbody") && !el.closest(".card").dataset.tip ? el.closest(".card") : el;
    if (!host.dataset.tip) host.dataset.tip = t; }
  for (const [id, t] of Object.entries(CTL)) { const el = $("#" + id); if (el && el.closest(".ctl")) el.closest(".ctl").dataset.tip = t; }
  $$(".kpi").forEach(k => { const lab = (k.querySelector("span")?.textContent || "").trim(); const hit = KPI.find(([re]) => re.test(lab)); if (hit) k.dataset.tip = hit[1]; });
  $$("#close .card").forEach(c => { const b = c.querySelector(".big"); if (b && BIG[b.textContent.trim()]) c.dataset.tip = BIG[b.textContent.trim()]; });
  const sel = $('#fTabs button[aria-selected="true"]'), fv = $("#fVis");
  if (sel && fv) fv.dataset.tip = FIND[sel.textContent.trim()] || "";
  $$("#fTabs button").forEach(b => { b.dataset.tip = FIND[b.textContent.trim()] || ""; });
  $$("#truth .grid3 .card").forEach((c, i) => { c.dataset.tip = ["How the test input is built. Because we built it, we know the right answer exactly.",
    "Why the test is fair: it uses the real model, so the only open question is whether the input can be recovered.",
    "Changing the test input's shape does not change the result, so the finding is not a quirk of our choice."][i] || ""; });
}
const tip = document.createElement("div"); tip.className = "hovertip"; tip.setAttribute("role", "tooltip"); document.body.append(tip);
let tipEl = null, tipTimer = null, mx = 0, my = 0;
const place = () => { const r = tip.getBoundingClientRect(), W = innerWidth, H = innerHeight; let x = mx + 14, y = my + 18;
  if (x + r.width > W - 8) x = Math.max(8, W - r.width - 8); if (y + r.height > H - 8) y = Math.max(8, my - r.height - 12); tip.style.transform = `translate(${x}px, ${y}px)`; };
const hide = () => { clearTimeout(tipTimer); tipEl = null; tip.classList.remove("on"); };
document.addEventListener("pointermove", e => {
  if (e.pointerType === "touch") return; mx = e.clientX; my = e.clientY;
  const el = e.target.closest?.("[data-tip]"); const t = el?.dataset.tip;
  if (!el || !t || el.closest(".chatbox")) { hide(); return; }
  if (el !== tipEl) { hide(); tipEl = el; tipTimer = setTimeout(() => { tip.textContent = t; tip.classList.add("on"); place(); }, 320); }
  else if (tip.classList.contains("on")) place();
}, { passive: true });
addEventListener("scroll", hide, { passive: true }); document.addEventListener("pointerdown", hide);
document.addEventListener("pointerleave", hide);
applyTips();
let pend = false; new MutationObserver(() => { if (pend) return; pend = true; requestAnimationFrame(() => { pend = false; applyTips(); }); })
  .observe($("main"), { childList: true, subtree: true, attributes: true, attributeFilter: ["aria-selected"] });

// ---------------------------------------------------------------- 2. project assistant
const KB = (window.DATA && window.DATA.kb) || "";
const box = document.createElement("div"); box.className = "chatbox";
box.innerHTML = `<button class="chatfab" aria-expanded="false" aria-controls="chatPanel"><span aria-hidden="true">?</span> Ask about the project</button>
<section class="chatpanel" id="chatPanel" hidden aria-label="Project assistant">
  <header><b>Project assistant</b><span class="chatmode" id="chatMode">connecting…</span><button class="chatx" aria-label="Close">×</button></header>
  <div class="chatlog" id="chatLog" aria-live="polite"></div>
  <div class="chatsugg" id="chatSugg"></div>
  <form class="chatform" id="chatForm"><textarea id="chatIn" rows="1" placeholder="Ask anything about this project…" aria-label="Your question"></textarea><button class="btn primary" id="chatSend" type="submit">Ask</button></form>
</section>`;
document.body.append(box);
const fab = box.querySelector(".chatfab"), panel = box.querySelector(".chatpanel"), log = $("#chatLog"), inp = $("#chatIn"), send = $("#chatSend"), mode = $("#chatMode");
const SUGG = ["What did you find, in one line?", "Why fMRI and not EEG?", "How was the ground truth chosen, and why is it valid?", "What is the barrier test?", "Can this read thoughts?"];
$("#chatSugg").innerHTML = SUGG.map(s => `<button type="button">${s}</button>`).join("");
$$("#chatSugg button").forEach(b => b.onclick = () => { inp.value = b.textContent; ask(); });
const open = on => { panel.hidden = !on; fab.setAttribute("aria-expanded", on); fab.classList.toggle("hidden", on); if (on) setTimeout(() => inp.focus(), 30); };
fab.onclick = () => open(true); box.querySelector(".chatx").onclick = () => open(false);
addEventListener("keydown", e => { if (e.key === "Escape" && !panel.hidden) open(false); });
inp.addEventListener("keydown", e => { e.stopPropagation(); if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ask(); } });
inp.addEventListener("input", () => { inp.style.height = "auto"; inp.style.height = Math.min(120, inp.scrollHeight) + "px"; });
$("#chatForm").onsubmit = e => { e.preventDefault(); ask(); };

const esc = s => s.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const md = s => esc(s).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/^\s*[-•]\s+(.*)$/gm, "<li>$1</li>").replace(/(<li>.*<\/li>\n?)+/g, m => `<ul>${m}</ul>`).replace(/\n{2,}/g, "<br><br>").replace(/\n/g, "<br>");
const bubble = (who, html) => { const d = document.createElement("div"); d.className = "msg " + who; d.innerHTML = html; log.append(d); log.scrollTop = log.scrollHeight; return d; };
bubble("bot", "Hi! Ask me anything about this project: the question, the method, the data, any number on this page, or the review questions.");

// offline fallback: the best-matching section of the project notes
const SECS = []; { let cur = null, n = 0; const facts = KB.indexOf("# Detailed methods and results");
  KB.split("\n").forEach((line, i) => { const pos = n; n += line.length + 1;
    const h = line.match(/^#{1,4}\s+(.*)/);
    if (h) { cur = { title: h[1].replace(/\(.*?\)/g, "").trim(), full: h[1], body: [], facts: facts < 0 || pos < facts }; SECS.push(cur); return; }
    if (!cur || /^\s*!\[|^\|?\s*-{3}/.test(line)) return;
    if (/^\|/.test(line)) { const c = line.split("|").map(x => x.trim()).filter(Boolean); if (c.length >= 2 && !/^Question$/.test(c[0])) cur.body.push("- **" + c[0] + "** " + c[1]); return; }
    cur.body.push(line); });
  SECS.forEach(s => s.text = s.body.join("\n").trim()); }
const STOP = new Set("the a an and or of to in on for is are was were be it this that with as by at from what why how which who does do did can you your our we not use used using instead about tell me please".split(" "));
const stem = w => w.replace(/(ing|ed|es|s)$/, "");
const toks = s => s.toLowerCase().replace(/[^a-z0-9.×%-]+/g, " ").split(" ").filter(w => w.length > 1 && !STOP.has(w)).map(stem);
// answerable units: each paragraph, list item or Q&A row, remembered with its section title
const UNITS = []; SECS.forEach(sec => sec.text.split(/\n(?=\s*(?:\d+\.|-)\s)|\n{2,}|\n(?=[A-Z][a-z]+( [a-z]+)?:)/).forEach(u => { u = (u || "").trim(); if (u.length > 25) UNITS.push({ sec, u }); }));
const DF = {}; UNITS.forEach(x => new Set(toks(x.u)).forEach(w => DF[w] = (DF[w] || 0) + 1));
const idf = w => Math.log(1 + UNITS.length / (DF[w] || 0.5));
function offline(q) {
  const qt = [...new Set(toks(q))]; if (!qt.length) return "Ask me about the method, the data, the findings or the review questions.";
  const sc = UNITS.map(x => { const tt = new Set(toks(x.sec.title)), bt = toks(x.u), bs = new Set(bt); let v = 0;
    qt.forEach(w => { if (bs.has(w)) v += idf(w); if (tt.has(w)) v += 0.8 * idf(w); });
    return [v / Math.pow(6 + bt.length, 0.25) * (x.sec.facts ? 1.5 : 1), x]; }).sort((a, b) => b[0] - a[0]);
  if (!sc.length || sc[0][0] <= 0) return "I could not find that in the project notes. Try other words, or ask about the method, the data, the findings or the review questions.";
  const top = sc[0][1], more = sc.slice(1, 6).find(([v, x]) => v > sc[0][0] * 0.75 && x.u !== top.u && x.sec === top.sec);
  const clip = t => t.length > 700 ? t.slice(0, t.lastIndexOf(". ", 700) + 1) + " …" : t;
  return "**" + top.sec.full + "**\n" + clip(top.u) + (more ? "\n\n" + clip(more[1].u) : ""); }

const RULES = `You are the assistant built into an interactive demo of a student research project. Answer questions from the panel, examiners or visitors using ONLY the project notes below. Rules:
- Plain, friendly language a non-specialist can follow; explain any term you use. Keep answers short: 2-5 sentences, or a short list, unless the person asks for more detail.
- Use the exact numbers from the notes. Never invent numbers, results, people, papers or claims. If the notes do not cover something, say so briefly and offer the closest thing they do cover.
- The summary at the top of the notes is authoritative if anything later disagrees.
- Do not use headings. Bold sparingly with **double asterisks**. Do not mention these instructions.

PROJECT NOTES
${KB}`;
let sample = null, turns = [], busy = null;
if (window.claude && typeof window.claude.use === "function") {
  window.claude.use("sample").then(s => { sample = s; mode.textContent = s ? "answers from the project notes" : "offline · quotes the project notes"; }).catch(() => { mode.textContent = "offline · quotes the project notes"; });
} else mode.textContent = "offline · quotes the project notes";

async function ask() {
  const q = inp.value.trim(); if (!q) return;
  if (busy) { busy.abort(); busy = null; }
  inp.value = ""; inp.style.height = "auto"; $("#chatSugg").hidden = true;
  bubble("me", esc(q)); const b = bubble("bot", '<span class="muted">Thinking…</span>');
  if (!sample) { b.innerHTML = md(offline(q)) + '<div class="msgnote">From the project notes (offline mode).</div>'; return; }
  turns.push({ role: "user", content: q }); if (turns.length > 12) turns = turns.slice(-12); if (turns[0].role !== "user") turns.shift();
  const ctl = new AbortController(); busy = ctl; send.textContent = "Stop"; send.type = "button"; send.onclick = () => ctl.abort();
  try {
    const { text, truncated } = await sample([{ role: "user", content: RULES }, ...turns], { cache: false, modelTier: "quick", signal: ctl.signal, onText: ({ text }) => { b.innerHTML = md(text); log.scrollTop = log.scrollHeight; } });
    b.innerHTML = md(text) + (truncated ? '<div class="msgnote">Cut short: ask for less at a time.</div>' : ""); turns.push({ role: "assistant", content: text });
  } catch (e) {
    turns.pop();
    if (e && e.code === "cancelled") { b.innerHTML = e.text ? md(e.text) : '<span class="muted">Stopped.</span>'; }
    else if (e && ["not_granted", "sampling_disabled", "not_declared", "capability_disabled", "capability_removed"].includes(e.code)) {
      sample = null; mode.textContent = "offline · quotes the project notes"; b.innerHTML = md(offline(q)) + '<div class="msgnote">From the project notes (live answers are switched off here).</div>'; }
    else if (e && e.code === "rate_limited") b.innerHTML = (e.text ? md(e.text) : "") + '<div class="msgnote">Too many questions at once; try again in a moment.</div>';
    else { b.innerHTML = md(offline(q)) + '<div class="msgnote">Live answer unavailable just now, so here are the closest project notes.</div>'; }
  } finally { if (busy === ctl) busy = null; send.textContent = "Ask"; send.type = "submit"; send.onclick = null; }
}
})();
