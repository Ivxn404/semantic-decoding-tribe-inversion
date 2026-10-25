(() => {
const D = window.DATA;
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const isDark = () => { const c = css("--bg"); const m = c.match(/#(..)(..)(..)/); if (!m) return false; return (parseInt(m[1], 16) + parseInt(m[2], 16) + parseInt(m[3], 16)) / 3 < 100; };
const fmt = (v, d = 3) => Number(v).toFixed(d);
const sci = v => { const e = Math.floor(Math.log10(Math.abs(v))); const m = v / Math.pow(10, e); return `${m.toFixed(2)}×10${sup(e)}`; };
const sup = e => String(e).split("").map(c => "⁰¹²³⁴⁵⁶⁷⁸⁹"["0123456789".indexOf(c)] || (c === "-" ? "⁻" : c)).join("");
const startColors = () => [1, 2, 3, 4, 5, 6].map(i => css(`--s${i}`));
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const WARM = []; window.__prewarmed = new Set();

// ---------------------------------------------------------------- nav, keys, notes
const scenes = $$(".scene");
const nav = $("#nav");
scenes.forEach((s, i) => { const a = document.createElement("a"); a.href = "#" + s.id; a.textContent = `${i + 1} ${s.dataset.name}`; nav.append(a); });
const links = $$("#nav a");
let current = 0;
// keep the active tab visible by scrolling the tab strip only (scrollIntoView would also nudge the page mid-scroll)
const showTab = l => { const nl = nav.scrollLeft, a = l.offsetLeft - nav.offsetLeft, w = nav.clientWidth;
  if (a < nl) nav.scrollTo({ left: a - 8 }); else if (a + l.offsetWidth > nl + w) nav.scrollTo({ left: a + l.offsetWidth - w + 8 }); };
const spy = new IntersectionObserver(es => { es.forEach(e => { if (!e.isIntersecting) return; const i = scenes.indexOf(e.target); if (i === current && links[i].classList.contains("on")) return;
  current = i; links.forEach((l, k) => l.classList.toggle("on", k === i)); showTab(links[i]); }); }, { rootMargin: "-45% 0px -50% 0px" });
scenes.forEach(s => spy.observe(s));
const go = i => { i = Math.max(0, Math.min(scenes.length - 1, i)); scenes[i].scrollIntoView({ behavior: reduced ? "auto" : "smooth" }); };
const notesBtn = $("#notesBtn");
const setNotes = on => { document.body.classList.toggle("shownotes", on); notesBtn.setAttribute("aria-pressed", on); try { localStorage.setItem("notes", on ? "1" : "0"); } catch (e) {} };
notesBtn.onclick = () => setNotes(!document.body.classList.contains("shownotes"));
try { if (localStorage.getItem("notes") === "1") setNotes(true); } catch (e) {}
addEventListener("keydown", e => {
  if (e.target.closest("input, select, textarea")) return;
  if (e.key === "ArrowRight" || e.key === "PageDown") { e.preventDefault(); go(current + 1); }
  else if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); go(current - 1); }
  else if (e.key === "n" || e.key === "N") setNotes(!document.body.classList.contains("shownotes"));
  else if (e.key === " " && scenes[current].id === "lab") { e.preventDefault(); $("#labRun").click(); }
});

// ---------------------------------------------------------------- canvas chart helper
function chart(cv, o) {
  const dpr = Math.min(2, devicePixelRatio || 1), W = cv.clientWidth, H = cv.clientHeight; if (!W) return;
  cv.width = W * dpr; cv.height = H * dpr; const g = cv.getContext("2d"); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
  const L = 52, R = 12, T = 10, B = 30, pw = W - L - R, ph = H - T - B;
  const tx = o.ylog ? v => Math.log10(Math.max(v, 1e-30)) : v => v;
  let xmin = o.xmin ?? Infinity, xmax = o.xmax ?? -Infinity, ymin = o.ymin ?? Infinity, ymax = o.ymax ?? -Infinity;
  for (const s of o.series) for (let i = 0; i < s.y.length; i++) { if (o.xmin === undefined) xmin = Math.min(xmin, s.x[i]); if (o.xmax === undefined) xmax = Math.max(xmax, s.x[i]);
    const y = tx(s.y[i]); if (!isFinite(y)) continue; if (o.ymin === undefined) ymin = Math.min(ymin, y); if (o.ymax === undefined) ymax = Math.max(ymax, y); }
  if (o.ylog) { if (o.ymin !== undefined) ymin = tx(o.ymin); if (o.ymax !== undefined) ymax = tx(o.ymax); ymin = Math.floor(ymin); ymax = Math.ceil(ymax); }
  if (!isFinite(xmin)) { xmin = 0; xmax = 1; } if (!isFinite(ymin)) { ymin = 0; ymax = 1; } if (ymax === ymin) ymax = ymin + 1; if (xmax === xmin) xmax = xmin + 1;
  const X = v => L + (v - xmin) / (xmax - xmin) * pw, Y = v => T + ph - (tx(v) - ymin) / (ymax - ymin) * ph;
  g.font = `11px ${css("--mono")}`; g.fillStyle = css("--muted"); g.strokeStyle = css("--grid"); g.lineWidth = 1;
  const yt = o.ylog ? Array.from({ length: ymax - ymin + 1 }, (_, i) => ymin + i).filter((v, i, a) => a.length < 8 || i % 2 === 0) : niceTicks(ymin, ymax, 4);
  g.textAlign = "right"; g.textBaseline = "middle";
  for (const v of yt) { const yy = T + ph - (v - ymin) / (ymax - ymin) * ph; g.beginPath(); g.moveTo(L, yy); g.lineTo(L + pw, yy); g.stroke(); g.fillText(o.ylog ? `10${sup(v)}` : (o.yfmt ? o.yfmt(v) : +v.toFixed(2)), L - 6, yy); }
  g.textAlign = "center"; g.textBaseline = "top";
  for (const v of (o.xticks || niceTicks(xmin, xmax, 5))) { const xx = X(v); g.fillText(o.xfmt ? o.xfmt(v) : +v.toFixed(2), xx, T + ph + 6); }
  if (o.xlabel) { g.textAlign = "right"; g.fillText(o.xlabel, L + pw, T + ph + 18); }
  for (const h of (o.hlines || [])) { g.save(); g.setLineDash([4, 4]); g.strokeStyle = h.color || css("--muted"); g.beginPath(); g.moveTo(L, Y(h.y)); g.lineTo(L + pw, Y(h.y)); g.stroke(); g.restore();
    if (h.label) { const yy = Y(h.y), top = yy < T + 14; g.textAlign = "left"; g.textBaseline = top ? "top" : "bottom"; g.fillStyle = h.color || css("--muted"); g.fillText(h.label, L + 4, top ? yy + 3 : yy - 2); } }
  for (const s of o.series) { g.save(); g.strokeStyle = s.color; g.fillStyle = s.color; g.lineWidth = s.width || 2; if (s.dash) g.setLineDash(s.dash);
    if (s.bars) { const bw = pw / s.y.length * 0.7; s.y.forEach((v, i) => { const x0 = X(s.x[i]) - bw / 2; g.fillStyle = s.colors ? s.colors[i] : s.color; g.fillRect(x0, Y(v), bw, Y(o.ylog ? Math.pow(10, ymin) : Math.max(ymin, 0)) - Y(v)); }); }
    else { g.beginPath(); let started = false; s.y.forEach((v, i) => { const yy = Y(v); if (!isFinite(yy)) return; if (!started) { g.moveTo(X(s.x[i]), yy); started = true; } else g.lineTo(X(s.x[i]), yy); }); g.stroke();
      if (s.dots) s.y.forEach((v, i) => { g.beginPath(); g.arc(X(s.x[i]), Y(v), 3.5, 0, 7); g.fill(); });
      if (s.end && s.y.length) { const i = s.y.length - 1; g.beginPath(); g.arc(X(s.x[i]), Y(s.y[i]), 3.5, 0, 7); g.fill(); } }
    g.restore(); }
  if (o.labels) { g.font = `11px ${css("--body")}`; g.fillStyle = css("--ink"); g.textAlign = "center"; g.textBaseline = "bottom"; o.labels.forEach(l => g.fillText(l.t, X(l.x), Y(l.y) - 5)); }
  return { X, Y };
}
function niceTicks(a, b, n) { const span = b - a, step0 = span / n, mag = Math.pow(10, Math.floor(Math.log10(step0))); const step = [1, 2, 2.5, 5, 10].map(m => m * mag).find(s => s >= step0) || mag * 10;
  const out = []; for (let v = Math.ceil(a / step) * step; v <= b + 1e-9; v += step) out.push(+v.toFixed(10)); return out; }

// ---------------------------------------------------------------- brains
const brains = {};
const visible = new Set();
const vis = new IntersectionObserver(es => es.forEach(e => e.isIntersecting ? visible.add(e.target.id) : visible.delete(e.target.id)));
function mkBrain(id, opts) { const cv = document.getElementById(id); const b = Brain.create(cv, opts); if (b) { brains[id] = b; vis.observe(cv); } return b; }
let shareSm = null;
const shareColors = () => { const m = Brain.mesh(), c = Brain.base(isDark());
  if (!shareSm) shareSm = [m.share.text, m.share.audio, m.share.video].map(a => Brain.smooth(Float32Array.from(a), 3));
  const ch = shareSm, lo = [0, 1, 2].map(k => pct(ch[k], 3)), hi = [0, 1, 2].map(k => pct(ch[k], 97));
  const COL = [[0.88, 0.19, 0.19], [0.18, 0.62, 0.27], [0.11, 0.49, 0.84]];
  for (let i = 0; i < m.NV; i++) { const v = [0, 1, 2].map(k => Math.max(0, Math.min(1, (ch[k][i] - lo[k]) / (hi[k] - lo[k]))));
    let d = 0; for (let k = 1; k < 3; k++) if (v[k] > v[d]) d = k; const second = Math.max(...v.filter((_, k) => k !== d));
    const a = Math.min(0.92, 0.2 + 1.6 * (v[d] - second) + 0.35 * v[d]); for (let k = 0; k < 3; k++) c[i * 3 + k] = c[i * 3 + k] * (1 - a) + COL[d][k] * a; }
  return c; };
function pct(a, p) { const s = Float32Array.from(a).sort(); return s[Math.floor(s.length * p / 100)]; }

// hero
const hero = mkBrain("heroBrain", { direct: true });
function paintHero() { if (hero) hero.setPanels([{ colors: shareColors(), x: 0, y: 0, w: 1, h: 1, layout: "orbit" }]); }
paintHero();
let lastT = 0;
let scrolling = 0; addEventListener("scroll", () => { scrolling = performance.now(); }, { passive: true });
function heroLoop(t) { if (hero && visible.has("heroBrain") && !reduced && !document.hidden && t - scrolling > 600) { hero.rot.yaw += (t - lastT) * 0.00025; hero.draw(); } lastT = t; requestAnimationFrame(heroLoop); }
requestAnimationFrame(heroLoop);
if (hero) { let drag = null; const cv = $("#heroBrain");
  cv.addEventListener("pointerdown", e => { drag = [e.clientX, e.clientY]; cv.setPointerCapture(e.pointerId); });
  cv.addEventListener("pointermove", e => { if (!drag) return; hero.rot.yaw += (e.clientX - drag[0]) * 0.01; hero.rot.pitch = Math.max(-1.2, Math.min(1.2, hero.rot.pitch + (e.clientY - drag[1]) * 0.01)); drag = [e.clientX, e.clientY]; hero.draw(); });
  cv.addEventListener("pointerup", () => drag = null); }

// ---------------------------------------------------------------- data scene
const DS = [
  { n: "CNeuroMod / Algonauts 2025", role: "train", subj: 4, sess: 1408, h: 268.7, tr: "1.49 s", what: "Watched the sitcom Friends (seasons 1–6) and four feature films: video, audio and dialogue together.", cite: "Gifford et al., 2025" },
  { n: "BOLD Moments", role: "train", subj: 10, sess: 520, h: 61.9, tr: "1.75 s", what: "Watched 1 102 three-second video clips of everyday events; 102 test clips repeated 10 times.", cite: "Lahner et al., 2024" },
  { n: "LeBel et al. 2023", role: "train", subj: 8, sess: 432, h: 85.8, tr: "2.0 s", what: "Listened to spoken autobiographical stories from podcasts (82 stories for three subjects). Our real-data subject UTS03 is one of these eight.", cite: "LeBel et al., 2023" },
  { n: "Wen et al. 2018", role: "train", subj: 3, sess: 258, h: 35.2, tr: "2.0 s", what: "Watched natural movie clips in 8-minute segments; test segments repeated 10 times.", cite: "Wen et al., 2018" },
  { n: "NNDb", role: "test", subj: 86, sess: null, h: 160.6, tr: "3T", what: "Watched full-length feature films. Used only to test TRIBE v2, never to train it.", cite: "Aliko et al., 2020" },
  { n: "Le Petit Prince", role: "test", subj: 112, sess: null, h: 180.2, tr: "3T", what: "Listened to the audiobook of Le Petit Prince. Test only.", cite: "Li et al., 2022" },
  { n: "Narratives", role: "test", subj: 321, sess: null, h: 146.6, tr: "3T", what: "Listened to spoken stories. Test only.", cite: "Nastase et al., 2021" },
  { n: "HCP 7T", role: "test", subj: 176, sess: null, h: 178.7, tr: "7T", what: "Watched movie clips in a 7-tesla scanner. Test only.", cite: "Van Essen et al., 2013" },
];
let dsSel = 2;
function drawData() {
  const svg = $("#dataBars"), W = 640, rowH = 34, top = 36, L = 200, maxH = 280, sc = (W - L - 130) / maxH;
  let h = `<text x="0" y="16" class="small">TRAINING · 451.6 h, 25 subjects</text><text x="0" y="${top + 4 * rowH + 26}" class="small">EVALUATION ONLY · 666.1 h, 695 subjects</text>`;
  DS.forEach((d, i) => { const y = top + i * rowH + (i >= 4 ? 34 : 0); const col = d.role === "train" ? "var(--accent)" : "var(--muted)"; const on = i === dsSel;
    h += `<g class="dsrow" data-i="${i}" style="cursor:pointer" tabindex="0" role="button" aria-label="${d.n}">
      <rect x="0" y="${y - 4}" width="${W}" height="${rowH - 4}" rx="6" fill="${on ? "var(--chip)" : "transparent"}"/>
      <text x="8" y="${y + 16}" style="font-size:13px;font-weight:${on ? 600 : 400}">${d.n}</text>
      <rect x="${L}" y="${y + 3}" width="${Math.max(2, d.h * sc)}" height="18" rx="3" fill="${col}" opacity="${on ? 1 : 0.75}"/>
      <text x="${L + d.h * sc + 8}" y="${y + 16}" class="small">${d.h} h · ${d.subj} subj</text></g>`; });
  svg.innerHTML = h;
  svg.querySelectorAll(".dsrow").forEach(g => { const f = () => { dsSel = +g.dataset.i; drawData(); }; g.onclick = f; g.onkeydown = e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); f(); } }; });
  const d = DS[dsSel];
  $("#dataCard").innerHTML = `<span class="eyebrow">${d.role === "train" ? "Training set" : "Evaluation set (never trained on)"}</span><h3 style="font-size:1.35rem">${d.n}</h3>
    <p>${d.what}</p>
    <div class="kpis"><div class="kpi"><b>${d.subj}</b><span>subjects</span></div>${d.sess ? `<div class="kpi"><b>${d.sess.toLocaleString("en-IN")}</b><span>sessions</span></div>` : ""}<div class="kpi"><b>${d.h} h</b><span>fMRI</span></div><div class="kpi"><b>${d.tr}</b><span>${d.sess ? "repetition time" : "scanner"}</span></div></div>
    <p class="muted" style="font-size:.84rem">Source: ${d.cite}; counts from Table 1 of the TRIBE v2 paper (d'Ascoli et al., 2026). All passive viewing or listening, no task.</p>`;
}
drawData();

// ---------------------------------------------------------------- EEG scene
const eegB = mkBrain("eegBrain");
let eegN = 64;
const eegCache = {};
function eegPattern() { // real TRIBE v2 predicted response if the recorded run is present, else forward sensitivity
  if (D.run && D.run.target) return Brain.b64(D.run.target, Uint8Array); return Brain.mesh().sens; }
function eegMaps(N) {
  if (eegCache[N]) return eegCache[N];
  const m = Brain.mesh(), raw = eegPattern(); const v = Float32Array.from(raw, x => (x - 128) / 127);
  const sm = Brain.smooth(v, 45);
  // candidate electrode sites: outward-facing vertices (not the medial wall)
  const cand = []; for (let i = 0; i < m.NV; i++) { const h = i < 10242 ? 0 : 1, c = m.ctr[h]; const ox = m.pos[i * 3] - c[0], oz = m.pos[i * 3 + 2] - c[2];
    if ((h === 0 ? -ox : ox) > 0.05 || oz > 0.18) cand.push(i); }
  // farthest-point sampling
  const P = i => [m.pos[i * 3], m.pos[i * 3 + 1], m.pos[i * 3 + 2]]; const el = [cand[0]]; const dmin = new Float32Array(cand.length).fill(1e9);
  while (el.length < N) { const p = P(el[el.length - 1]); let best = -1, bi = 0; for (let k = 0; k < cand.length; k++) { const q = P(cand[k]); const d = (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2 + (p[2] - q[2]) ** 2; if (d < dmin[k]) dmin[k] = d; if (dmin[k] > best) { best = dmin[k]; bi = k; } } el.push(cand[bi]); }
  const ev = el.map(i => sm[i]); const out = new Float32Array(m.NV);
  for (let i = 0; i < m.NV; i++) { const p = P(i), h = i < 10242; let ws = 0, s = 0;
    for (let k = 0; k < N; k++) { if ((el[k] < 10242) !== h) continue; const q = P(el[k]); const d = (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2 + (p[2] - q[2]) ** 2; const w = 1 / (d * d + 1e-6); ws += w; s += w * ev[k]; }
    out[i] = s / ws; }
  return (eegCache[N] = { v, out, el });
}
function paintEEG() {
  if (!eegB) return; const { v, out, el } = eegMaps(eegN); const dark = isDark();
  const sc = pct(v.map(Math.abs), 98) || 1, sc2 = pct(out.map(Math.abs), 99.5) || 1;
  const left = Brain.overlay(v, sc, 0.22, dark), right = Brain.overlay(out, sc2, 0.22, dark);
  const m = Brain.mesh(); for (const i of el) { for (const j of [i, ...m.nbr[i]]) { right[j * 3] = right[j * 3 + 1] = right[j * 3 + 2] = dark ? 0.95 : 0.05; } }
  eegB.setPanels([{ colors: left, x: 0, y: 0, w: 0.5, h: 1, layout: "lateral" }, { colors: right, x: 0.5, y: 0, w: 0.5, h: 1, layout: "lateral" }]);
  $("#eegLabel").textContent = `EEG (illustrative) · ${eegN} electrodes`;
}
$$("#eegSeg button").forEach(b => b.onclick = () => { eegN = +b.dataset.n; $$("#eegSeg button").forEach(x => x.setAttribute("aria-pressed", x === b)); paintEEG(); });
const REASONS = [
  ["Spatial detail", "≈2–3 mm voxels at 20 484 cortical vertices, against 32–128 scalp channels blurred over centimetres by volume conduction."],
  ["A model to invert", "TRIBE v2: 177 M parameters trained on 451.6 h. No open naturalistic EEG encoder exists at this scale."],
  ["One inverse, not two", "Decoding through EEG first needs source localisation, itself an ill-posed inverse problem, before ours."],
  ["Measured gap", "The same typing decoder reaches 32% character error from MEG but 67% from EEG (Lévy et al., 2025)."],
  ["Open data", "LeBel 2023 gives 85.8 h of story-listening fMRI. The open simultaneous EEG–fMRI set has no sustained speech."],
  ["What EEG does better", "Millisecond timing, low cost, wearable. These matter for a product; for measuring invertibility they do not. The method transfers once an EEG encoder exists."],
];
$("#eegReasons").innerHTML = REASONS.map((r, i) => `<div class="card stack" style="gap:6px"><span class="eyebrow" style="color:${i === 5 ? "var(--warn)" : "var(--accent)"}">${i === 5 ? "Trade-off" : "Reason " + (i + 1)}</span><h3>${r[0]}</h3><p style="font-size:.92rem">${r[1]}</p></div>`).join("");
// paint lazily when first seen (smoothing takes a moment)
new IntersectionObserver((es, o) => { if (es[0].isIntersecting) { o.disconnect(); if (!window.__prewarmed.has("eegBrain")) { window.__prewarmed.add("eegBrain"); setTimeout(paintEEG, 30); } } }, { rootMargin: "300px" }).observe($("#eegBrain")); WARM.push(["eegBrain", paintEEG]);

// ---------------------------------------------------------------- pipeline svg
(function pipe() {
  const box = (x, y, w, h, t, sub, kind) => { const fill = kind === "nd" ? "var(--chip)" : kind === "x" ? "var(--hot)" : kind === "out" ? "var(--panel)" : "var(--panel)";
    const stroke = kind === "x" ? "var(--hot)" : kind === "frozen" ? "var(--accent)" : "var(--line)"; const tc = kind === "x" ? "#fff" : "var(--ink)";
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="${fill}" stroke="${stroke}" stroke-width="${kind === "frozen" ? 1.5 : 1}" ${kind === "nd" ? 'stroke-dasharray="4 3"' : ""}/>
      <text x="${x + w / 2}" y="${y + h / 2 - 3}" text-anchor="middle" style="font-size:14px;font-weight:600;fill:${tc}">${t}</text><text x="${x + w / 2}" y="${y + h / 2 + 15}" text-anchor="middle" class="small" style="fill:${kind === "x" ? "#fff" : ""}">${sub}</text>`; };
  const arr = (x1, y1, x2, y2, cls = "") => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="var(--muted)" stroke-width="1.5" marker-end="url(#ah)" class="${cls}"/>`;
  let s = `<defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="var(--muted)"/></marker>
    <marker id="ahh" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="var(--hot)"/></marker>
    <style>.flow{stroke-dasharray:6 6;animation:fl 1.2s linear infinite}@keyframes fl{to{stroke-dashoffset:-12}}@media (prefers-reduced-motion: reduce){.flow{animation:none}}</style></defs>`;
  s += `<text x="10" y="22" class="small">NOT DIFFERENTIABLE (skipped)</text><text x="352" y="22" class="small" style="fill:var(--hot)">OPTIMISED</text><text x="520" y="22" class="small" style="fill:var(--accent)">FROZEN TRIBE v2 · 177.21 M PARAMETERS</text>`;
  s += box(10, 40, 140, 64, "Stimulus", "story audio + words", "nd") + box(10, 130, 140, 64, "TTS / ASR", "speech ↔ text", "nd") + box(170, 40, 150, 154, "Extractors", "Llama 3.2 · w2v-BERT · video", "nd");
  s += arr(150, 72, 170, 90) + arr(150, 162, 170, 150);
  s += box(345, 70, 130, 100, "x", "T × 1 152 at 2 Hz", "x");
  s += arr(320, 118, 345, 118) + `<line x1="332" y1="40" x2="332" y2="200" stroke="var(--hot)" stroke-width="2" stroke-dasharray="5 4"/><text x="336" y="214" class="small" style="fill:var(--hot)">re-entry point</text>`;
  s += box(510, 70, 140, 100, "Encoder", "127.47 M params", "frozen") + box(670, 70, 130, 100, "Head", "1 152 → 2 048", "frozen") + box(820, 70, 140, 100, "Subject layer", "41.97 M · avg. subject", "frozen") + box(980, 70, 80, 100, "Pool", "1 Hz", "frozen");
  s += arr(475, 120, 510, 120, "flow") + arr(650, 120, 670, 120, "flow") + arr(800, 120, 820, 120, "flow") + arr(960, 120, 980, 120, "flow") + arr(1060, 120, 1080, 120, "flow");
  s += `<text x="1088" y="112" style="font-size:14px;font-weight:600">f(x)</text><text x="1088" y="130" class="small">20 484 × 100</text>`;
  s += `<path d="M1100,150 C1100,250 420,260 410,178" fill="none" stroke="var(--hot)" stroke-width="2" marker-end="url(#ahh)" class="flow"/>`;
  s += `<text x="760" y="262" text-anchor="middle" style="font-size:13px;fill:var(--hot);font-weight:600">gradient of ‖f(x) − y‖² flows back to x only</text>`;
  s += `<text x="760" y="284" text-anchor="middle" class="small">x̂ = argmin ‖f(x) − y‖² + λR(x)   ·   ‖∂f/∂x‖ = 7.97 × 10³, no zero entries</text>`;
  $("#pipeSvg").innerHTML = s;
})();


// ---------------------------------------------------------------- ground truth validity
function drawGT() {
  const G = D.gt; if (!G) { $("#truth").hidden = true; return; }
  const raw = (d, k) => Array.isArray(d[k]) ? d[k][0] : d[k];
  const f = (d, k, n) => { const v = raw(d, k) ?? 1, sd = Array.isArray(d[k]) ? d[k][1] : null; return v.toFixed(n) + (sd != null && k === "participation_ratio" ? " ± " + sd.toFixed(1) : ""); };
  const S = G.synthetic_default, R = G.real, W = G.synthetic_white;
  $("#gtStats").innerHTML = [["Effective dimensions (participation ratio)", "participation_ratio", 1], ["Variance in top 8 directions", "var_top8", 2], ["Scale (s.d.)", "sd", 2]]
    .map(([l, k, n]) => `<tr><td>${l}</td><td class="num">${f(S, k, n)}</td><td class="num"><b>${f(R, k, n)}</b></td><td class="num">${f(W, k, n)}</td></tr>`).join("");
  $("#gtLegend").textContent = "Real story representations occupy a few directions, like the synthetic truth and unlike white noise; the scale matches.";
  const I = G.inversion, P = I.per_start, blind = ["gauss_0.01", "gauss_1.0", "uniform"];
  const rec = blind.map(n => P[n].cosine_audio_slot), pc = Object.values(I.pairs).map(v => v.cos), pk = Object.values(I.pairs).map(v => v.peak);
  const bb = Math.min(...blind.map(n => P[n].mse));
  const rows = [["Recovery from blind starts", "0.89–0.93 (converged)", `${Math.min(...rec).toFixed(2)}–${Math.max(...rec).toFixed(2)} (${I.steps} steps, CPU)`],
    ["Agreement between blind starts", "0.89–1.00", `${Math.min(...pc).toFixed(2)}–${Math.max(...pc).toFixed(2)}`],
    ["Barrier between blind solutions", "median 4.8×", `${Math.min(...pk).toFixed(0)}–${Math.max(...pk).toFixed(0)}×`],
    ["Deeper minimum near the truth", "4.2× lower error, 8.1× barrier", `${(bb / P.truth_perturbed.mse).toFixed(1)}× lower error, ${I.blind_to_truth.peak.toFixed(0)}× barrier`]];
  $("#gtTable").innerHTML = rows.map(r => `<tr><td>${r[0]}</td><td class="num">${r[1]}</td><td class="num">${r[2]}</td></tr>`).join("");
}
new IntersectionObserver((es, o) => { if (es[0].isIntersecting) { o.disconnect(); if (!window.__prewarmed.has("truth")) { window.__prewarmed.add("truth"); drawGT(); } } }, { rootMargin: "300px" }).observe($("#truth")); WARM.push(["truth", drawGT]);
// ---------------------------------------------------------------- live lab (toy encoder in the browser)
const T = Toy; const STEPS = 2400;
let E = T.makeEncoder({ seed: 1 }), xt = T.makeTruth(E, 5), yClean = T.forward(E, xt).y, lab = null, labRunning = false, labSeed = 5;
const ctl = id => +$(id).value;
const params = () => ({ K: ctl("#cK"), spread: ctl("#cSpread") * 0.005, noise: ctl("#cNoise") / 100, obs: ctl("#cObs") / 100, lam: ctl("#cL2") === 0 ? 0 : Math.pow(10, -6 + 5 * ctl("#cL2") / 100) });
function syncOut() { const p = params(); $("#oK").value = p.K; $("#oSpread").value = p.spread.toFixed(3); $("#oNoise").value = Math.round(p.noise * 100) + "% of signal"; $("#oObs").value = Math.round(p.obs * 100) + "% of " + E.V; $("#oL2").value = p.lam ? p.lam.toExponential(0) : "0"; }
$$(".ctls input").forEach(i => i.addEventListener("input", () => { syncOut(); if (!labRunning) resetLab(); }));
function resetLab() {
  const p = params(), r = T.mulberry(1000 + labSeed);
  let sd = 0; for (const v of yClean) sd += v * v; sd = Math.sqrt(sd / yClean.length);
  const target = Float64Array.from(yClean, v => v + p.noise * sd * T.gauss(r));
  const mask = new Uint8Array(E.V); const idx = [...Array(E.V).keys()].sort(() => r() - 0.5).slice(0, Math.max(4, Math.round(p.obs * E.V))); idx.forEach(i => mask[i] = 1);
  const xs = [], As = []; for (let k = 0; k < p.K; k++) { const rr = T.mulberry(100 + k + labSeed * 17); const x = Float64Array.from({ length: xt.length }, () => (p.spread || 1e-4) * T.gauss(rr)); xs.push(x); As.push(T.makeAdam(x.length)); }
  lab = { p, target, mask, xs, As, step: 0, hist: xs.map(() => ({ s: [], L: [], c: [] })) };
  labRunning = false; $("#labRun").textContent = "Run inversion"; $("#labProbe").disabled = true; $("#sensTxt").textContent = "After a run, probe how strongly the encoder responds along the disagreement between two starts, against 200 random directions.";
  drawLab(); clearSens();
}
function labTick() {
  if (!labRunning) return; const t0 = performance.now();
  while (performance.now() - t0 < 14 && lab.step < STEPS) {
    const lr = 0.03 * 0.5 * (1 + Math.cos(Math.PI * lab.step / STEPS));
    lab.xs.forEach((x, k) => { const g = T.lossGrad(E, x, lab.target, lab.mask, lab.p.lam); T.adamStep(lab.As[k], x, g.gx, lr);
      if (lab.step % 10 === 0) { const h = lab.hist[k]; h.s.push(lab.step); h.L.push(g.L); h.c.push(T.meanCos(E, x, xt)); } });
    lab.step++;
  }
  drawLab();
  if (lab.step >= STEPS) { labRunning = false; $("#labRun").textContent = "Run again"; $("#labProbe").disabled = lab.xs.length < 2; return; }
  requestAnimationFrame(labTick);
}
$("#labRun").onclick = () => { if (labRunning) { labRunning = false; $("#labRun").textContent = "Resume"; return; } if (!lab || lab.step >= STEPS) resetLab(); labRunning = true; $("#labRun").textContent = "Pause"; requestAnimationFrame(labTick); };
$("#labReset").onclick = () => { labSeed++; xt = T.makeTruth(E, labSeed); yClean = T.forward(E, xt).y; resetLab(); };
function drawLab() {
  const col = startColors(), h = lab.hist;
  chart($("#chLoss"), { ylog: true, xmin: 0, xmax: STEPS, series: h.map((s, k) => ({ x: s.s, y: s.L, color: col[k], end: true })), xlabel: "step", xticks: [0, 600, 1200, 1800, 2400] });
  chart($("#chCos"), { ymin: 0, ymax: 1, xmin: 0, xmax: STEPS, series: h.map((s, k) => ({ x: s.s, y: s.c, color: col[k], end: true })), xlabel: "step", xticks: [0, 600, 1200, 1800, 2400], hlines: [{ y: 1, label: "perfect recovery" }] });
  const last = h.map(s => s.L.length ? s.L[s.L.length - 1] : NaN), lc = h.map(s => s.c.length ? s.c[s.c.length - 1] : NaN);
  const L0 = h[0].L[0];
  $("#labStatus").textContent = lab.step ? `step ${lab.step} / ${STEPS} · error ↓ ${L0 && last[0] ? Math.round(L0 / last[0]).toLocaleString("en-IN") : "–"}× · recovery ${lc.filter(isFinite).map(v => v.toFixed(3)).join(" / ")}` : `ready · 0 / ${STEPS} steps`;
  heat($("#hTrue"), xt); heat($("#hRec"), lab.xs[0]);
  // agreement matrix
  const cv = $("#agree"), K = lab.xs.length, dpr = Math.min(2, devicePixelRatio || 1), W = cv.clientWidth; cv.width = W * dpr; cv.height = W * dpr;
  const g = cv.getContext("2d"); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, W); const pad = 26, cs = (W - pad) / K;
  let minC = 1; g.font = `11px ${css("--mono")}`; g.textAlign = "center"; g.textBaseline = "middle";
  for (let a = 0; a < K; a++) { g.fillStyle = col[a]; g.fillRect(pad + a * cs + 2, 4, cs - 4, 8); g.fillRect(4, pad + a * cs + 2, 8, cs - 4);
    for (let b = 0; b < K; b++) { const c = a === b ? 1 : T.flatCos(lab.xs[a], lab.xs[b]); if (a !== b) minC = Math.min(minC, c);
      const t = Math.max(0, c); g.fillStyle = `color-mix(in srgb, var(--accent) ${Math.round(t * 100)}%, var(--panel))`;
      g.fillStyle = mix(css("--panel"), css("--accent"), t); g.fillRect(pad + b * cs + 1, pad + a * cs + 1, cs - 2, cs - 2);
      g.fillStyle = t > 0.55 ? css("--accent-ink") : css("--ink"); if (cs > 34) g.fillText(c.toFixed(2), pad + b * cs + cs / 2, pad + a * cs + cs / 2); } }
  $("#agreeTxt").textContent = K > 1 ? `lowest agreement between two starts: ${minC.toFixed(3)} (1 = identical)` : "add a second start to compare solutions";
}
function mix(a, b, t) { const p = s => s.match(/\w\w/g).map(h => parseInt(h, 16)); const A = p(a.replace("#", "")), B = p(b.replace("#", "")); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(",")})`; }
function heat(cv, x) { const { T: TT, D: DD } = E; const g = cv.getContext("2d"), im = g.createImageData(DD, TT); let mx = 0; for (const v of xt) mx = Math.max(mx, Math.abs(v));
  for (let i = 0; i < TT * DD; i++) { const v = Math.max(-1, Math.min(1, x[i] / mx)); const c = v > 0 ? Brain.hot(v) : [0.12 + 0.2 * (1 + v), 0.35 + 0.3 * (1 + v), 0.95]; const a = Math.abs(v);
    const bg = isDark() ? 0.12 : 0.96; for (let k = 0; k < 3; k++) im.data[i * 4 + k] = 255 * (bg * (1 - a) + c[k] * a); im.data[i * 4 + 3] = 255; }
  g.putImageData(im, 0, 0); cv.style.aspectRatio = `${DD} / ${TT}`; }
function clearSens() { chart($("#chSens"), { series: [], xmin: 0, xmax: 1, ymin: 0, ymax: 1 }); }
$("#labProbe").onclick = () => {
  const x0 = lab.xs[0], x1 = lab.xs[1], n = x0.length, y0 = T.forward(E, x0).y, r = T.mulberry(77);
  const unit = v => { const s = Math.hypot(...v); return v.map(a => a / s); };
  const sens = v => { const eps = 1e-3; const xp = x0.map((a, i) => a + eps * v[i]); const y = T.forward(E, xp).y; let s = 0; for (let i = 0; i < y.length; i++) s += (y[i] - y0[i]) ** 2; return Math.sqrt(s) / eps; };
  const sd = sens(unit(Array.from(x1, (a, i) => a - x0[i]))), se = sens(unit(Array.from(x0, (a, i) => a - xt[i])));
  const rs = []; for (let k = 0; k < 200; k++) rs.push(sens(unit(Array.from({ length: n }, () => T.gauss(r))))); rs.sort((a, b) => a - b);
  const med = rs[100], lo = Math.min(rs[0], sd, se) * 0.9, hi = Math.max(rs[199], sd, se) * 1.05, nb = 24, bins = new Array(nb).fill(0);
  rs.forEach(v => bins[Math.min(nb - 1, Math.floor((v - lo) / (hi - lo) * nb))]++);
  const xs = bins.map((_, i) => lo + (i + 0.5) * (hi - lo) / nb);
  const cv = $("#chSens"); const ax = chart(cv, { xmin: lo, xmax: hi, ymin: 0, series: [{ x: xs, y: bins, bars: true, color: css("--muted") }], xlabel: "sensitivity ‖Δf‖/ε", xfmt: v => v.toFixed(2) });
  const g = cv.getContext("2d"); const mark = (v, c, t, dy) => { g.strokeStyle = c; g.fillStyle = c; g.lineWidth = 2.5; g.beginPath(); g.moveTo(ax.X(v), 10); g.lineTo(ax.X(v), cv.clientHeight - 30); g.stroke(); g.font = `600 11px ${css("--body")}`; g.textAlign = v > (lo + hi) / 2 ? "right" : "left"; g.fillText(t, ax.X(v) + (v > (lo + hi) / 2 ? -5 : 5), 20 + dy); };
  mark(sd, startColors()[1], "start 1 − start 2", 0); mark(se, css("--hot"), "error x̂ − x", 14);
  $("#sensTxt").innerHTML = `Along the disagreement the encoder responds <b>${(med / sd).toFixed(1)}×</b> less than the random median; along the actual error, <b>${(med / se).toFixed(1)}×</b> less. On TRIBE v2 we measured 1.9×.`;
};
syncOut(); resetLab();

// ---------------------------------------------------------------- real-run replay
const rp = D.run; const rpB = mkBrain("replayBrain");
let rpI = 0, rpTimer = null;
function rpDecode() { if (!rp || rp._dec) return; rp._dec = true; rp.predA = rp.pred.map(s => Brain.b64(s, Uint8Array)); rp.rA = rp.r.map(s => Brain.b64(s, Uint8Array)); rp.tA = Brain.b64(rp.target, Uint8Array); }
function paintReplay() {
  if (!rp || !rpB) return; rpDecode(); const dark = isDark(), i = rpI;
  const tv = Float32Array.from(rp.tA, x => (x - 128) / 127), pv = Float32Array.from(rp.predA[i], x => (x - 128) / 127), rv = Float32Array.from(rp.rA[i], x => x / 255 * 2 - 1);
  const sc = pct(tv.map(Math.abs), 98) || 1;
  rpB.setPanels([{ colors: Brain.overlay(tv, sc, 0.25, dark), x: 0, y: 0, w: 1 / 3, h: 1, layout: "lat2" }, { colors: Brain.overlay(pv, sc, 0.25, dark), x: 1 / 3, y: 0, w: 1 / 3, h: 1, layout: "lat2" },
    { colors: Brain.seq(rv, 0, 1, dark, Brain.viridis), x: 2 / 3, y: 0, w: 1 / 3, h: 1, layout: "lat2" }]);
  const st = rp.steps[i]; const k = rp.log.findIndex(l => l.step === st); const L = rp.log.slice(0, k + 1); const col = startColors();
  let medr = Float32Array.from(rv).sort()[rv.length >> 1];
  $("#rpTxt").textContent = `step ${st} / ${rp.log[rp.log.length - 1].step} · median vertex R² ${Math.max(-1, medr).toFixed(2)} · recovery ${L[L.length - 1].cos.map(v => v.toFixed(2)).join(" / ")}`;
  const xs = L.map(l => l.step), xmax = rp.log[rp.log.length - 1].step;
  chart($("#rpLoss"), { ylog: true, xmin: 0, xmax, series: rp.inits.map((n, j) => ({ x: xs, y: L.map(l => l.mse[j]), color: col[j], end: true })), xlabel: "step" });
  chart($("#rpCos"), { ymin: 0, ymax: 1, xmin: 0, xmax, series: [...rp.inits.map((n, j) => ({ x: xs, y: L.map(l => l.cos[j]), color: col[j], end: true })), { x: xs, y: L.map(l => Math.min(...l.pair)), color: css("--muted"), dash: [5, 4], end: true }], xlabel: "step", hlines: [{ y: 1, label: "perfect recovery" }] });
}
function rpKpis() {
  if (!rp) return; const f = rp.log[rp.log.length - 1], f0 = rp.log[0]; const col = startColors();
  let h = rp.inits.map((n, j) => `<div class="kpi"><b style="color:${col[j]}">${f.cos[j].toFixed(3)}</b><span>recovery · ${n}</span></div>`).join("");
  h += `<div class="kpi"><b>${Math.round(f0.mse[0] / f.mse[0]).toLocaleString("en-IN")}×</b><span>prediction error reduction, start 1</span></div>`;
  h += `<div class="kpi"><b>${Math.min(...f.pair).toFixed(3)}</b><span>lowest agreement between starts</span></div>`;
  if (rp.barrier) { const mid = rp.barrier.find(b => b.scale === 0.5), end = rp.barrier.find(b => b.scale === 1.0);
    h += `<div class="kpi"><b>${(mid.mse_d / end.mse_d).toFixed(1)}×</b><span>not a flat null space: halfway between starts 1 and 2 the prediction changes this much more than between the two ends (forward passes only)</span></div>`; }
  $("#rpKpis").innerHTML = h;
  $("#rpLegend") && 0;
}
if (rp) {
  $("#rpStep").max = rp.steps.length - 1; $("#rpStep").value = 0;
  $("#rpStep").oninput = e => { rpI = +e.target.value; paintReplay(); };
  $("#rpPlay").onclick = () => { if (rpTimer) { clearInterval(rpTimer); rpTimer = null; $("#rpPlay").textContent = "Play"; return; }
    if (rpI >= rp.steps.length - 1) rpI = 0; $("#rpPlay").textContent = "Pause";
    rpTimer = setInterval(() => { rpI++; $("#rpStep").value = rpI; paintReplay(); if (rpI >= rp.steps.length - 1) { clearInterval(rpTimer); rpTimer = null; $("#rpPlay").textContent = "Replay"; } }, 450); };
  new IntersectionObserver((es, o) => { if (es[0].isIntersecting) { o.disconnect(); if (!window.__prewarmed.has("replayBrain")) { window.__prewarmed.add("replayBrain"); paintReplay(); } } }, { rootMargin: "300px" }).observe($("#replayBrain")); WARM.push(["replayBrain", paintReplay]);
  rpKpis();
} else { $("#replay").hidden = true; }

// ---------------------------------------------------------------- findings
const FIG = D.figs;
const F = [
  { k: "Dissociation", head: "Encoding accuracy does not certify decoding", big: "28.4×", sub: "lower encoding error, while recovery saturates at 0.944",
    text: "Independent inversions at budgets from 250 to 32 000 steps. The last halving of encoding error (5.65 → 2.66 × 10⁻³) bought only +0.015 in recovery cosine.",
    draw: el => { const steps = [250, 500, 1000, 2000, 4000, 8000, 16000, 32000], err = [7.546e-2, 6.043e-2, 5.098e-2, 4.073e-2, 2.733e-2, 1.380e-2, 5.649e-3, 2.658e-3], rec = [.0505, .1081, .2374, .4529, .6708, .8362, .9282, .9436];
      el.innerHTML = `<canvas class="chart" style="height:300px"></canvas><p class="muted" style="font-size:.82rem">x: encoding relative error (log, falling to the right) · y: recovery cosine · labels: optimisation steps</p>`;
      const xs = err.map(v => -Math.log10(v)); chart(el.firstChild, { ymin: 0, ymax: 1, series: [{ x: xs, y: rec, color: css("--accent"), dots: true }], labels: steps.map((s, i) => ({ x: xs[i], y: rec[i], t: s >= 1000 ? s / 1000 + "k" : s })), xfmt: v => Math.pow(10, -v).toPrecision(1), xticks: [1.2, 1.6, 2, 2.4], hlines: [{ y: 1, label: "perfect" }] }); } },
  { k: "Non-convexity", head: "Equally good fits give different answers", big: "0.817 ± 0.007", sub: "minimum pairwise cosine between fit-matched solutions, four ground truths",
    text: "Eight initialisations; only runs within 2× of the best fit were compared, so slow runs cannot pose as alternative solutions. The same worst pair appeared for every ground truth.", fig: "fig_nonconvex" },
  { k: "Barrier test", head: "Barriers, not a null space", big: "4.8× · 8.1×", sub: "median error rise between distinct equal blind fits · towards a deeper minimum near the truth (4 ground truths)",
    text: "Forward passes only, no optimiser. If two equally good solutions lay in one flat valley (a null space), the error would stay level on the line between them. Over four ground truths it rises for every pair of distinct blind fits (29 of 40 pairs, 2.4–8.2×); near-identical pairs share one minimum. The blind starts end with 4.2× more error than a minimum found from near the truth, 8.1 ± 3.2× barrier away. Re-run 19–20 Oct 2026; an earlier version of this test paired an unconverged solution and is withdrawn.",
    draw: el => { const B = D.barrier; el.innerHTML = `<canvas class="chart" style="height:300px"></canvas><p class="muted" style="font-size:.82rem">blue: distinct blind pairs · grey: near-identical pairs · orange: best blind solution → near-truth solution · 4 ground truths · log scale</p>`;
      const s = B.s; chart(el.firstChild, { ylog: true, xmin: 0, xmax: 1, xfmt: v => v.toFixed(1), xlabel: "position on the straight line", series: [...B.pairs.map(p => ({ x: s, y: p.e, color: p.c < 0.99 ? css("--accent") : css("--muted"), width: 1.2 })), ...B.toTruth.map(e => ({ x: s, y: e, color: css("--hot"), width: 2.6 }))] }); } },
  { k: "Sensitivity", head: "The error hides in the weakest directions", big: "2.15×", sub: "below the median sensitivity of 200 random directions, mean of 4 ground truths (1.9× in the original run shown)",
    text: "At a recovered solution the operator responds about half as strongly along the solution difference as along a typical direction, and below every random direction sampled. All six pairwise differences sit below the median.", fig: "fig_sensitivity" },
  { k: "Conditioning", head: "Gain, noise, extent, priors and a linear baseline", big: "0.918 vs 0.060", sub: "gradient inversion against the best ridge decoder",
    text: "Gain is identifiable (a 10% rescale gives 7.5× the noise floor). Recovery falls smoothly with noise while retrieval stays near 0.99. 2 000 random vertices recover 0.777. An ℓ₂ prior adds at most +0.032 and temporal smoothing destroys recovery.", gallery: ["fig_gain", "fig_noise", "fig_extent", "fig_priors", "fig_baseline"] },
];
let fSel = 0;
function drawF() {
  $("#fTabs").innerHTML = F.map((f, i) => `<button role="tab" aria-selected="${i === fSel}" data-i="${i}">${f.k}</button>`).join("");
  $$("#fTabs button").forEach(b => b.onclick = () => { fSel = +b.dataset.i; drawF(); });
  const f = F[fSel];
  $("#fBody").innerHTML = `<div class="card" id="fVis"></div><div class="stack"><span class="eyebrow">Finding ${fSel + 1} of ${F.length}</span><h3 style="font-size:1.45rem">${f.head}</h3><span class="big">${f.big}</span><p class="muted">${f.sub}</p><p>${f.text}</p><div id="fGal" class="tabs"></div></div>`;
  const el = $("#fVis");
  if (f.draw) f.draw(el);
  else if (f.fig) el.innerHTML = `<img class="figimg" src="data:image/png;base64,${FIG[f.fig]}" alt="${f.head}">`;
  else if (f.gallery) { let g = 0; const show = () => { el.innerHTML = `<img class="figimg" src="data:image/png;base64,${FIG[f.gallery[g]]}" alt="${f.gallery[g]}">`; $$("#fGal button").forEach((b, i) => b.setAttribute("aria-selected", i === g)); };
    $("#fGal").innerHTML = ["Gain", "Noise", "Extent", "Priors", "Ridge baseline"].map((n, i) => `<button aria-selected="false" data-i="${i}">${n}</button>`).join(""); $$("#fGal button").forEach(b => b.onclick = () => { g = +b.dataset.i; show(); }); show(); }
}
drawF();

// ---------------------------------------------------------------- regions
const NETS = [
  { n: "Somatomotor", v: 1487, sens: 0.73, dom: "none", rec: 0.851, rnd: 0.748, diff: 0.102, pr: 18.6, prc: 15.2, rgb: [0.96, 0.62, 0.1] },
  { n: "Language (L)", v: 1282, sens: 1.21, dom: "text +26.6", rec: 0.752, rnd: 0.729, diff: 0.023, pr: 9.7, prc: 15.0, rgb: [0.85, 0.2, 0.2] },
  { n: "Auditory", v: 277, sens: 1.29, dom: "audio +34.7", rec: 0.386, rnd: 0.371, diff: 0.015, pr: 10.1, prc: 15.5, rgb: [0.18, 0.62, 0.27] },
  { n: "Language homologue (R)", v: 1368, sens: 1.22, dom: "text +28.5", rec: 0.750, rnd: 0.739, diff: 0.011, pr: 13.5, prc: 15.1, rgb: [0.9, 0.45, 0.55] },
  { n: "Default mode", v: 1224, sens: 1.03, dom: "text +26.9", rec: 0.727, rnd: 0.723, diff: 0.004, pr: 11.9, prc: 15.0, rgb: [0.48, 0.32, 0.8] },
  { n: "Visual", v: 1582, sens: 1.60, dom: "video +40.7", rec: 0.629, rnd: 0.754, diff: -0.125, pr: 10.3, prc: 15.1, rgb: [0.1, 0.48, 0.85] },
];
const roiB = mkBrain("roiBrain"); let netSel = 5;
const hex = c => "#" + c.map(v => Math.round(v * 255).toString(16).padStart(2, "0")).join("");
function paintROI() {
  const m = Brain.mesh(), dark = isDark(), c = Brain.base(dark);
  for (let i = 0; i < m.NV; i++) { const r = m.roi[i]; if (!r) continue; const name = m.roiNames[r - 1]; const ni = NETS.findIndex(x => x.n === name); if (ni < 0) continue;
    const a = ni === netSel ? 0.95 : 0.28; for (let k = 0; k < 3; k++) c[i * 3 + k] = c[i * 3 + k] * (1 - a) + NETS[ni].rgb[k] * a; }
  if (roiB) roiB.setPanels([{ colors: c, x: 0, y: 0, w: 1, h: 1, layout: "four" }]);
  $("#netList").innerHTML = NETS.map((n, i) => `<button aria-pressed="${i === netSel}" data-i="${i}"><i class="dot" style="background:${hex(n.rgb)}"></i><span>${n.n}</span><span class="mono" style="color:${n.diff >= 0 ? "var(--good)" : "var(--hot)"}">${n.diff >= 0 ? "+" : "−"}${Math.abs(n.diff).toFixed(3)}</span></button>`).join("");
  $$("#netList button").forEach(b => b.onclick = () => { netSel = +b.dataset.i; paintROI(); });
  const n = NETS[netSel];
  $("#netCard").innerHTML = `<div class="kpis"><div class="kpi"><b>${n.sens.toFixed(2)}×</b><span>forward sensitivity vs cortex mean</span></div><div class="kpi"><b>${n.rec.toFixed(3)}</b><span>recovery from this network</span></div><div class="kpi"><b>${n.rnd.toFixed(3)}</b><span>random vertices, same size</span></div><div class="kpi"><b>${n.pr}</b><span>participation ratio (random control ${n.prc})</span></div></div>
    <p style="margin-top:10px;font-size:.92rem">${n.v.toLocaleString("en-IN")} vertices · strongest input: ${n.dom === "none" ? "no single modality" : n.dom.replace(/(\w+) \+/, "$1, z = +")}. ${n.n === "Visual" ? "Most responsive, yet the hardest to decode from: its responses vary along few directions." : n.n === "Somatomotor" ? "Least responsive, yet the easiest: the only network whose responses are more diverse than random vertices." : "Close to random vertices of the same size."}</p>`;
  scatter();
}
function scatter() {
  const svg = $("#roiScatter"), W = 760, H = 300, L = 70, R = 30, T = 20, B = 46; const X = v => L + (v - 0.6) / (1.7 - 0.6) * (W - L - R), Y = v => T + (0.13 - v) / (0.26) * (H - T - B);
  let s = `<line x1="${L}" y1="${Y(0)}" x2="${W - R}" y2="${Y(0)}" stroke="var(--line)" stroke-dasharray="4 4"/><text x="${W - R}" y="${Y(0) - 6}" text-anchor="end" class="small">random vertices of the same size</text>`;
  for (const v of [0.8, 1.0, 1.2, 1.4, 1.6]) s += `<text x="${X(v)}" y="${H - B + 18}" text-anchor="middle" class="small">${v.toFixed(1)}×</text>`;
  for (const v of [-0.1, 0, 0.1]) s += `<text x="${L - 8}" y="${Y(v) + 4}" text-anchor="end" class="small">${v > 0 ? "+" : ""}${v.toFixed(1)}</text>`;
  s += `<text x="${(L + W - R) / 2}" y="${H - 6}" text-anchor="middle" class="small">forward sensitivity (× cortical mean) → more predictable</text><text x="14" y="${(T + H - B) / 2}" transform="rotate(-90 14 ${(T + H - B) / 2})" text-anchor="middle" class="small">recovery advantage</text>`;
  NETS.forEach((n, i) => { const on = i === netSel; s += `<g style="cursor:pointer" data-i="${i}"><circle cx="${X(n.sens)}" cy="${Y(n.diff)}" r="${on ? 11 : 8}" fill="${hex(n.rgb)}" stroke="var(--ink)" stroke-width="${on ? 2 : 0}"/><text x="${X(n.sens) + 14}" y="${Y(n.diff) + 4}" style="font-size:12px;font-weight:${on ? 700 : 400}">${n.n}</text></g>`; });
  svg.innerHTML = s; svg.querySelectorAll("g[data-i]").forEach(g => g.onclick = () => { netSel = +g.dataset.i; paintROI(); });
}
new IntersectionObserver((es, o) => { if (es[0].isIntersecting) { o.disconnect(); if (!window.__prewarmed.has("roiBrain")) { window.__prewarmed.add("roiBrain"); paintROI(); } } }, { rootMargin: "300px" }).observe($("#roiBrain")); WARM.push(["roiBrain", paintROI]);
paintROI();

// ---------------------------------------------------------------- real fMRI
const RD = D.real;
function drawReal() {
  const lag = RD.lag; chart($("#lagCh"), { series: [{ x: lag.lags_TR.map(t => t * 2), y: lag.mean_r_train, color: css("--accent") }], xlabel: "lag (s)", hlines: [{ y: Math.max(...lag.mean_r_train), label: `peak at ${lag.best_s} s` }], yfmt: v => v.toFixed(2) });
  const nets = ["Auditory", "Language homologue (R)", "Default mode", "Language (L)", "Visual", "Somatomotor"], short = ["Aud", "Lang R", "DMN", "Lang L", "Vis", "SomMot"];
  const enc = RD.encoding_r.wheretheressmoke; chart($("#encCh"), { ymin: 0, xmin: 0.4, xmax: 6.6, series: [{ x: [1, 2, 3, 4, 5, 6], y: nets.map(n => enc[n]), bars: true, colors: nets.map(n => hex(NETS.find(x => x.n === n).rgb)) }], xticks: [1, 2, 3, 4, 5, 6], xfmt: v => short[v - 1], yfmt: v => v.toFixed(2) });
  const idf = RD.identification_forward; const order = ["top2000", ...nets]; chart($("#idCh"), { ymin: 0, ymax: 0.7, xmin: 0.4, xmax: 7.6, series: [{ x: [1, 2, 3, 4, 5, 6, 7], y: order.map(n => idf[n].top1), bars: true, colors: order.map((n, i) => i ? hex(NETS.find(x => x.n === n).rgb) : css("--ink")) }], xticks: [1, 2, 3, 4, 5, 6, 7], xfmt: v => ["Top 2k", ...short][v - 1], yfmt: v => Math.round(v * 100) + "%", hlines: [{ y: 0.005, label: "chance" }] });
}
let idKey = "real_bold";
function drawRanks(animate) {
  const r = RD.inversion_identification[idKey]; const N = r.n_candidates;
  $("#ranks").innerHTML = r.ranks.map((rk, q) => `<div class="rankrow"><span class="mono">segment ${q + 1}</span><div class="cands" data-r="${rk}">${Array.from({ length: N }, () => "<i></i>").join("")}</div><span class="pill ${rk === 0 ? "ok" : "no"}">${rk === 0 ? "rank 1" : "rank " + (rk + 1)}</span></div>`).join("");
  $$("#ranks .cands").forEach((c, q) => { const rk = +c.dataset.r, cells = [...c.children];
    if (!animate || reduced) { cells[rk].classList.add("true"); return; }
    let t = 0; const iv = setInterval(() => { cells.forEach(x => x.classList.remove("true")); t++; if (t < 9 + q * 2) cells[Math.floor(Math.random() * N)].classList.add("true"); else { cells[rk].classList.add("true"); clearInterval(iv); } }, 90); });
  $("#idKpis").innerHTML = `<div class="kpi"><b>${Math.round(r.top1 * 5)} / 5</b><span>true segment ranked first</span></div><div class="kpi"><b>${(r.chance_top1 * 100).toFixed(1)}%</b><span>chance (1 in ${N})</span></div><div class="kpi"><b>${r.cos_to_true_x.toFixed(3)}</b><span>cosine of x̂ to the true x</span></div><div class="kpi"><b>${(r.rank_percentile * 100).toFixed(1)}%</b><span>mean rank percentile</span></div>`;
}
$$("#idSeg button").forEach(b => b.onclick = () => { idKey = b.dataset.k; $$("#idSeg button").forEach(x => x.setAttribute("aria-pressed", x === b)); drawRanks(true); });
$("#idPlay").onclick = () => drawRanks(true);
drawRanks(false);
new IntersectionObserver((es, o) => { if (es[0].isIntersecting) { o.disconnect(); if (!window.__prewarmed.has("fmri")) { window.__prewarmed.add("fmri"); drawReal(); } drawRanks(true); } }, { threshold: 0.2 }).observe($("#fmri")); WARM.push(["fmri", drawReal]);

// ---------------------------------------------------------------- close
$("#qr").src = "data:image/png;base64," + D.qr;

// ---------------------------------------------------------------- theme changes and resizes
function repaintAll() { drawGT(); paintHero(); if (eegCache[eegN]) paintEEG(); paintReplay(); paintROI(); drawLab(); drawF(); drawReal(); drawData(); }
matchMedia("(prefers-color-scheme: dark)").addEventListener("change", repaintAll);
new MutationObserver(repaintAll).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
let rz; addEventListener("resize", () => { clearTimeout(rz); rz = setTimeout(() => { drawGT(); drawLab(); drawF(); drawReal(); if (rp) paintReplay(); }, 150); });
// ---------------------------------------------------------------- prepare every scene before it is scrolled to
(() => { const done = window.__prewarmed; let k = 0;
  const next = ms => setTimeout(run, ms);
  const run = () => { if (performance.now() - scrolling < 400) return next(250); // never during a scroll
    const j = WARM[k++]; if (!j) return; if (!done.has(j[0])) { try { j[1](); done.add(j[0]); } catch (e) { console.error("prewarm", j[0], e.message); } } next(120); };
  if (document.readyState === "complete") next(300); else addEventListener("load", () => next(300)); })();
})();
