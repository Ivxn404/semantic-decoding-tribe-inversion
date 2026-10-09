// Shared theme, layouts and helpers for the Review II and Review III decks.
const fs = require("fs");
const path = require("path");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");

const A = path.join(__dirname, "assets");
const AD = path.join(__dirname, "assets_deck");

const THEME = {
  name: "Semantic Decoding",
  headFontFace: "Cambria",
  bodyFontFace: "Calibri",
  colors: {
    dk1: "0B0B0B", lt1: "FFFFFF", dk2: "13243B", lt2: "EEF3F9",
    accent1: "2A78D6", accent2: "EB6834", accent3: "1BAF7A", accent4: "4A3AA7",
    accent5: "EDA100", accent6: "52514E", hlink: "2A78D6", folHlink: "4A3AA7",
  },
};
const HEX = {
  ink: "0B0B0B", ink2: "52514E", muted: "8A8984", navy: "13243B", tint: "EEF3F9",
  blue: "2A78D6", orange: "EB6834", aqua: "1BAF7A", violet: "4A3AA7", gold: "EDA100",
  line: "D5DCE6", white: "FFFFFF", paleBlue: "DCE9FA", paleOrange: "FCE4D9", paleAqua: "D9F2E8",
};

function pngSize(file) {
  const b = fs.readFileSync(file);
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}

async function iconPng(IconComp, color = "#FFFFFF", size = 256) {
  const svg = ReactDOMServer.renderToStaticMarkup(
    React.createElement(IconComp, { color, size: String(size) }));
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + buf.toString("base64");
}

function defineLayouts(pres, footerText) {
  const C = pres.SchemeColor;
  pres.defineSlideMaster({
    title: "Title", background: { color: HEX.navy },
    objects: [
      { placeholder: { options: { name: "title", type: "title", x: 0.7, y: 1.9, w: 11.9, h: 1.9,
        fontFace: THEME.headFontFace, fontSize: 40, bold: true, color: "FFFFFF", valign: "bottom", align: "left" }, text: "" } },
      { placeholder: { options: { name: "body", type: "body", x: 0.7, y: 4.0, w: 11.9, h: 2.6,
        fontFace: THEME.bodyFontFace, fontSize: 18, color: "CADCF2", valign: "top" }, text: "" } },
    ],
  });
  pres.defineSlideMaster({
    title: "Section", background: { color: HEX.navy },
    objects: [
      { placeholder: { options: { name: "title", type: "title", x: 0.7, y: 2.7, w: 11.9, h: 1.2,
        fontFace: THEME.headFontFace, fontSize: 40, bold: true, color: "FFFFFF", valign: "bottom", align: "left" }, text: "" } },
      { placeholder: { options: { name: "body", type: "body", x: 0.7, y: 4.05, w: 11.9, h: 1.4,
        fontFace: THEME.bodyFontFace, fontSize: 18, color: "CADCF2", valign: "top" }, text: "" } },
    ],
    slideNumber: { x: 12.3, y: 7.0, w: 0.6, h: 0.3, fontSize: 10, color: "8FA6C4", fontFace: THEME.bodyFontFace },
  });
  pres.defineSlideMaster({
    title: "Content", background: { color: "FFFFFF" },
    margin: [0.5, 0.5, 0.6, 0.5],
    objects: [
      { placeholder: { options: { name: "title", type: "title", x: 0.5, y: 0.3, w: 12.3, h: 0.85,
        fontFace: THEME.headFontFace, fontSize: 30, bold: true, color: HEX.navy, valign: "middle", align: "left", margin: 0 }, text: "" } },
      { text: { text: footerText, options: { x: 0.5, y: 7.05, w: 10, h: 0.3, fontSize: 10,
        color: HEX.muted, fontFace: THEME.bodyFontFace, margin: 0 } } },
    ],
    slideNumber: { x: 12.3, y: 7.05, w: 0.6, h: 0.3, fontSize: 10, color: HEX.muted, fontFace: THEME.bodyFontFace, align: "right" },
  });
  return C;
}

// ---------- composition helpers (all take a slide) ----------
function txt(slide, text, o) {
  slide.addText(text, Object.assign({ isTextBox: true, fontFace: THEME.bodyFontFace, fontSize: 16,
    color: HEX.ink, valign: "top", margin: 0 }, o));
}

function bullets(slide, items, o) {
  const runs = items.map((it, i) => {
    const t = typeof it === "string" ? { text: it } : it;
    return { text: t.text, options: Object.assign({ bullet: t.sub ? { indent: 18 } : { indent: 18 },
      indentLevel: t.sub ? 1 : 0, breakLine: i < items.length - 1, paraSpaceAfter: 6,
      bold: !!t.bold, color: t.color || HEX.ink, fontSize: t.size }, {}) };
  });
  slide.addText(runs, Object.assign({ isTextBox: true, fontFace: THEME.bodyFontFace, fontSize: 16,
    color: HEX.ink, valign: "top", margin: 0 }, o));
}

function card(slide, x, y, w, h, fill = HEX.tint, name) {
  slide.addShape("roundRect", { x, y, w, h, rectRadius: 0.08, fill: { color: fill },
    line: { color: fill }, objectName: name || "card" });
}

function badge(slide, x, y, d, label, fill = HEX.blue, fontSize = 16) {
  slide.addShape("ellipse", { x, y, w: d, h: d, fill: { color: fill }, line: { color: fill } });
  slide.addText(label, { isTextBox: true, x, y, w: d, h: d, align: "center", valign: "middle",
    fontFace: THEME.headFontFace, bold: true, fontSize, color: "FFFFFF", margin: 0 });
}

function iconBadge(slide, x, y, d, data, fill = HEX.blue) {
  slide.addShape("ellipse", { x, y, w: d, h: d, fill: { color: fill }, line: { color: fill } });
  const p = d * 0.24;
  slide.addImage({ data, x: x + p, y: y + p, w: d - 2 * p, h: d - 2 * p });
}

function stat(slide, x, y, w, big, label, color = HEX.blue, bigSize = 40) {
  txt(slide, big, { x, y, w, h: 0.8, fontFace: THEME.headFontFace, fontSize: bigSize, bold: true, color, valign: "bottom" });
  txt(slide, label, { x, y: y + 0.85, w, h: 0.75, fontSize: 13, color: HEX.ink2 });
}

function figure(slide, file, x, y, w, h, align = "center") {
  const f = fs.existsSync(path.join(AD, file)) ? path.join(AD, file) : path.join(A, file);
  const s = pngSize(f);
  const r = Math.min(w / s.w, h / s.h);
  const iw = s.w * r, ih = s.h * r;
  const ix = align === "left" ? x : x + (w - iw) / 2;
  slide.addImage({ path: f, x: ix, y: y + (h - ih) / 2, w: iw, h: ih });
  return { x: ix, y: y + (h - ih) / 2, w: iw, h: ih };
}

function caption(slide, text, x, y, w) {
  txt(slide, text, { x, y, w, h: 0.35, fontSize: 11, color: HEX.muted, italic: true });
}

function table(slide, header, rows, o) {
  const H = header.map(h => ({ text: h, options: { bold: true, color: "FFFFFF", fill: { color: HEX.navy },
    fontFace: THEME.bodyFontFace, fontSize: o.fontSize || 12, valign: "middle" } }));
  const R = rows.map((r, i) => r.map(c => {
    const cell = typeof c === "object" && c !== null ? c : { text: String(c) };
    return { text: cell.text, options: Object.assign({ fontFace: THEME.bodyFontFace, fontSize: o.fontSize || 12,
      color: HEX.ink, fill: { color: i % 2 ? "F6F8FB" : "FFFFFF" }, valign: "middle" }, cell.options || {}) };
  }));
  slide.addTable([H, ...R], Object.assign({ border: { type: "solid", pt: 0.5, color: HEX.line },
    margin: [3, 5, 3, 5] }, o));
}

function arrow(slide, x1, y1, x2, y2, color = HEX.muted, w = 1.75) {
  slide.addShape("line", { x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.abs(x2 - x1) || 0.001,
    h: Math.abs(y2 - y1) || 0.001, flipH: x2 < x1, flipV: y2 < y1,
    line: { color, width: w, endArrowType: "triangle" } });
}

function box(slide, x, y, w, h, title, sub, fill = HEX.blue, textColor = "FFFFFF", titleSize = 14) {
  slide.addShape("roundRect", { x, y, w, h, rectRadius: 0.08, fill: { color: fill }, line: { color: fill } });
  const runs = [{ text: title, options: { bold: true, fontSize: titleSize, color: textColor, breakLine: !!sub } }];
  if (sub) runs.push({ text: sub, options: { fontSize: titleSize - 3, color: textColor } });
  slide.addText(runs, { isTextBox: true, x: x + 0.08, y, w: w - 0.16, h, align: "center", valign: "middle",
    fontFace: THEME.bodyFontFace, margin: 0 });
}

module.exports = { THEME, HEX, A, pngSize, iconPng, defineLayouts, txt, bullets, card, badge, iconBadge,
  stat, figure, caption, table, arrow, box };
