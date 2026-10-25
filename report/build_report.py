import copy, re, sys
import docx
from docx.shared import Pt, Inches, RGBColor, Emu
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_LINE_SPACING, WD_BREAK
from docx.enum.style import WD_STYLE_TYPE
from docx.enum.section import WD_SECTION
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

sys.path.insert(0, "/home/claude/work/report_final")
from content import TITLE, EXEC_SUMMARY, ACK, ABBR, SYMBOLS, BODY, APPENDIX
from refs import REFS

TPL = "/tmp/claude-0/tpl/report.docx"
OUT = "/home/claude/work/report_final/Report_Sarkar_Choudhuri_Project1_raw.docx"
FONT = "Times New Roman"
PROG = "Electronics and Communication Engineering (specialisation in Biomedical Engineering)"
GUIDE = "Dr. Sharmila Nageswaran"
SCHOOL = "School of Electronics Engineering (SENSE)"

d = docx.Document(TPL)
st0 = d.styles
P = d.paragraphs
body = d.element.body


# ---------------------------------------------------------------- helpers
def clean_rpr(r):
    rpr = r._r.find(qn("w:rPr"))
    if rpr is None:
        return
    for tag in ("w:highlight", "w:shd", "w:color"):
        for e in rpr.findall(qn(tag)):
            rpr.remove(e)


def set_text(p, text):
    runs = p.runs
    if not runs:
        p.add_run(text)
        return
    runs[0].text = text
    clean_rpr(runs[0])
    for r in runs[1:]:
        r._r.getparent().remove(r._r)


# ---------------------------------------------------------------- front matter
set_text(P[0], TITLE)
set_text(P[8], PROG)
names = P[13]
set_text(names, "ABHRANIL SARKAR (23BML0077)")
second = copy.deepcopy(names._p)
names._p.addnext(second)
from docx.text.paragraph import Paragraph
set_text(Paragraph(second, names._parent), "TANISHA CHOUDHURI (23BML0081)")
set_text(P[14], "")
set_text(P[16], "Under the guidance of " + GUIDE)
set_text(P[17], SCHOOL + ", VIT, Vellore.")
set_text(P[23], "October, 2026")
set_text(P[27], f"We hereby declare that the thesis entitled “{TITLE}” submitted by us, for the award of the degree of Bachelor of Technology in "
                f"{PROG} to VIT is a record of bonafide work carried out by us under the supervision of {GUIDE}.")
P[27].alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
set_text(P[28], "We further declare that the work reported in this thesis has not been submitted previously to this institute or anywhere for the consideration of the degree/diploma.")
set_text(P[55], "Signature of the Candidates")
set_text(P[59], f"This is to certify that the thesis entitled “{TITLE}” submitted by Abhranil Sarkar (23BML0077) and Tanisha Choudhuri (23BML0081), "
                f"{SCHOOL}, VIT, for the award of the degree of Bachelor of Technology in {PROG}, is a record of bonafide work carried out by them under my "
                f"supervision during the period July 2026 to October 2026, as per the VIT code of academic and research ethics.")
P[59].alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
set_text(P[144], "Abhranil Sarkar          Tanisha Choudhuri")
for p in (names, Paragraph(second, names._parent), P[16], P[17]):
    p.paragraph_format.left_indent = Inches(0); p.paragraph_format.right_indent = Inches(0)
    p.paragraph_format.first_line_indent = Inches(0)
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
P[14]._p.getparent().remove(P[14]._p)
# keep front-matter headings out of the TOC: restyle as Normal with the same look
SZ = {"Heading 1": 18, "Heading 2": 16, "Heading 3": 14}
for p in P[:150]:
    if p.style is not None and p.style.name in SZ and p._p.getparent() is not None:
        sz = SZ[p.style.name] if p.style.name != "Heading 2" or "NAME" not in p.text else 12
        txt_sz = Pt(12) if p in (names,) else Pt(SZ[p.style.name])
        p.style = st0["Normal"]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        for r in p.runs:
            r.bold = True; r.font.size = txt_sz; r.font.name = FONT
pn = Paragraph(second, names._parent); pn.style = st0["Normal"]
for r in pn.runs: r.bold = True; r.font.size = Pt(12); r.font.name = FONT

# acknowledgements: replace spacer paragraphs 89.. with text, keep some spacers
spacers = [P[i] for i in range(89, 144) if not P[i].text.strip()]
anchor = P[88]
for t in reversed(ACK):
    np_ = copy.deepcopy(P[28]._p)
    anchor._p.addnext(np_)
    para = Paragraph(np_, anchor._parent)
    set_text(para, t)
    para.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    pf = para.paragraph_format
    pf.line_spacing = 1.5
    pf.space_after = Pt(10)
    pf.first_line_indent = Inches(0.5)
for sp in spacers[:-8]:
    sp._p.getparent().remove(sp._p)

# executive summary
set_text(P[148], EXEC_SUMMARY)
P[148].alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
P[148].paragraph_format.line_spacing = 1.5
P[149]._p.getparent().remove(P[149]._p)

# drop template body after the executive-summary section break
sect_par = None
for e in body:
    if e.tag == qn("w:p") and e.find(".//" + qn("w:sectPr")) is not None and "Executive Summary" in "".join(
            x.text or "" for x in e.itersiblings(preceding=True) if False):
        pass
# locate: the sectPr paragraph that follows the Executive Summary heading
seen = False
for e in list(body):
    txt = "".join(t.text or "" for t in e.iter(qn("w:t")))
    if "Executive Summary" in txt:
        seen = True
    if seen and e.find(".//" + qn("w:sectPr")) is not None and e.tag == qn("w:p"):
        sect_par = e
        break
remove = False
for e in list(body):
    if remove and e.tag != qn("w:sectPr"):
        body.remove(e)
    if e is sect_par:
        remove = True

# ---------------------------------------------------------------- styles
st = d.styles


def mkstyle(name, size=10, align=WD_ALIGN_PARAGRAPH.CENTER, before=4, after=10, italic=False, bold=False):
    s = st.add_style(name, WD_STYLE_TYPE.PARAGRAPH)
    s.base_style = st["Normal"]
    s.font.name = FONT
    s.font.size = Pt(size)
    s.font.italic = italic
    s.font.bold = bold
    s.paragraph_format.alignment = align
    s.paragraph_format.space_before = Pt(before)
    s.paragraph_format.space_after = Pt(after)
    s.paragraph_format.line_spacing = 1.0
    return s


mkstyle("Figure Caption", before=4, after=12)
tc = mkstyle("Table Caption", before=10, after=4)
tc.paragraph_format.keep_with_next = True
for nm, sz, al in (("Heading 1", 16, WD_ALIGN_PARAGRAPH.CENTER), ("Heading 2", 14, WD_ALIGN_PARAGRAPH.LEFT), ("Heading 3", 12, WD_ALIGN_PARAGRAPH.LEFT)):
    s = st[nm]
    s.font.name = FONT
    s.font.size = Pt(sz)
    s.font.bold = True
    s.font.color.rgb = RGBColor(0, 0, 0)
    rpr = s.element.get_or_add_rPr()
    rf = rpr.find(qn("w:rFonts"))
    if rf is None:
        rf = OxmlElement("w:rFonts"); rpr.append(rf)
    for a in ("w:ascii", "w:hAnsi", "w:cs", "w:eastAsia"):
        rf.set(qn(a), FONT)
    s.paragraph_format.alignment = al
    s.paragraph_format.space_before = Pt(18 if nm == "Heading 1" else 12)
    s.paragraph_format.space_after = Pt(12 if nm == "Heading 1" else 6)
    s.paragraph_format.keep_with_next = True
    s.paragraph_format.left_indent = Inches(0)
    s.paragraph_format.first_line_indent = Inches(0)
for nm in ("toc 1", "toc 2", "toc 3"):
    s = st[nm]
    s.font.name = FONT
    s.font.size = Pt(12)
    s.font.bold = nm == "toc 1"
    s.paragraph_format.space_before = Pt(4)
    s.paragraph_format.space_after = Pt(2)

# ---------------------------------------------------------------- citations
order = {}


def cite_keys(text):
    for m in re.finditer(r"\[@([^\]]+)\]", text):
        for k in m.group(1).split(","):
            k = k.strip()
            if k not in REFS:
                raise KeyError(k)
            if k not in order:
                order[k] = len(order) + 1


def resolve(text):
    return re.sub(r"\[@([^\]]+)\]", lambda m: ", ".join(f"[{order[k.strip()]}]" for k in m.group(1).split(",")), text)


def walk(blocks):
    for b in blocks:
        if b[0] in ("p", "eq", "h1", "h2", "h3"):
            cite_keys(b[1])
        elif b[0] in ("bul", "num"):
            for t in b[1]:
                cite_keys(t)
        elif b[0] == "tab":
            cite_keys(b[1])
            for row in b[3]:
                for c in row:
                    cite_keys(c)


walk(BODY)
walk(APPENDIX)


# ---------------------------------------------------------------- writers
def runs_md(p, text, size=12, bold=False):
    text = resolve(text)
    for i, part in enumerate(re.split(r"\*\*", text)):
        if not part:
            continue
        r = p.add_run(part)
        r.font.name = FONT
        r.font.size = Pt(size)
        r.bold = bold or (i % 2 == 1)


def body_par(text, align=WD_ALIGN_PARAGRAPH.JUSTIFY, indent=0.0, hanging=None, after=8, size=12):
    p = d.add_paragraph(style="Normal")
    pf = p.paragraph_format
    pf.alignment = align
    pf.line_spacing = 1.5
    pf.space_after = Pt(after)
    pf.space_before = Pt(0)
    if indent:
        pf.left_indent = Inches(indent)
    if hanging:
        pf.first_line_indent = Inches(-hanging)
    runs_md(p, text, size=size)
    return p


def add_field(p, instr, placeholder="Right-click and choose Update Field."):
    def fc(t):
        r = OxmlElement("w:r"); f = OxmlElement("w:fldChar"); f.set(qn("w:fldCharType"), t)
        if t == "begin":
            f.set(qn("w:dirty"), "true")
        r.append(f); return r
    p._p.append(fc("begin"))
    r = OxmlElement("w:r"); it = OxmlElement("w:instrText"); it.set(qn("xml:space"), "preserve"); it.text = f" {instr} "; r.append(it); p._p.append(r)
    p._p.append(fc("separate"))
    r = OxmlElement("w:r"); t = OxmlElement("w:t"); t.text = placeholder; r.append(t); p._p.append(r)
    p._p.append(fc("end"))


def prelim_heading(text, page_break=True):
    p = d.add_paragraph(style="Normal")
    if page_break:
        p.paragraph_format.page_break_before = True
    p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_after = Pt(18)
    r = p.add_run(text); r.bold = True; r.font.size = Pt(16); r.font.name = FONT
    return p


def set_cell_borders(tbl):
    tblPr = tbl._tbl.tblPr
    b = OxmlElement("w:tblBorders")
    for edge in ("top", "left", "bottom", "right", "insideH", "insideV"):
        e = OxmlElement(f"w:{edge}"); e.set(qn("w:val"), "single"); e.set(qn("w:sz"), "4"); e.set(qn("w:color"), "000000"); b.append(e)
    tblPr.append(b)


def shade(cell, hexcol):
    tcPr = cell._tc.get_or_add_tcPr()
    s = OxmlElement("w:shd"); s.set(qn("w:val"), "clear"); s.set(qn("w:color"), "auto"); s.set(qn("w:fill"), hexcol); tcPr.append(s)


def add_table(header, rows, widths, size=10, bold_last=False):
    t = d.add_table(rows=1 + len(rows), cols=len(header))
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    t.autofit = False
    set_cell_borders(t)
    for ri, row in enumerate([header] + rows):
        tr = t.rows[ri]._tr
        trPr = tr.get_or_add_trPr()
        cs = OxmlElement("w:cantSplit"); trPr.append(cs)
        if ri == 0:
            th = OxmlElement("w:tblHeader"); trPr.append(th)
        for ci, val in enumerate(row):
            c = t.cell(ri, ci)
            c.width = Inches(widths[ci])
            p = c.paragraphs[0]
            p.paragraph_format.space_after = Pt(1)
            p.paragraph_format.space_before = Pt(1)
            p.paragraph_format.line_spacing = 1.0
            if ri == 0 or len(header) > 3 and ci > 0 or val in ("●", "○"):
                p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER if (ri == 0 or ci > 0) else WD_ALIGN_PARAGRAPH.LEFT
            bold = ri == 0 or (bold_last and ri == len(rows))
            runs_md(p, val, size=size, bold=bold)
            if ri == 0:
                shade(c, "D9D9D9")
    # grid widths
    grid = t._tbl.tblGrid
    for gi, gc in enumerate(grid.findall(qn("w:gridCol"))):
        gc.set(qn("w:w"), str(int(widths[gi] * 1440)))
    return t


counters = {"fig": 0, "tab": 0}
chap = ["0"]
captions = {"fig": [], "tab": []}


def emit(blocks):
    for b in blocks:
        kind = b[0]
        if kind == "h1":
            m = re.match(r"(\d+)\.", b[1])
            chap[0] = m.group(1) if m else "A"
            counters["fig"] = counters["tab"] = 0
            h = d.add_paragraph(b[1], style="Heading 1")
            h.paragraph_format.page_break_before = True
        elif kind == "h2":
            d.add_paragraph(resolve(b[1]), style="Heading 2")
        elif kind == "h3":
            d.add_paragraph(resolve(b[1]), style="Heading 3")
        elif kind == "p":
            body_par(b[1])
        elif kind == "eq":
            p = body_par(b[1], align=WD_ALIGN_PARAGRAPH.CENTER)
            for r in p.runs:
                r.italic = True
        elif kind in ("bul", "num"):
            for i, t in enumerate(b[1]):
                mark = "•" if kind == "bul" else f"{i + 1}."
                body_par(f"{mark}\t{t}", indent=0.35, hanging=0.3, after=4)
        elif kind == "fig":
            _, path, cap, w = b
            counters["fig"] += 1
            p = d.add_paragraph(style="Normal")
            p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p.paragraph_format.keep_with_next = True
            p.paragraph_format.space_before = Pt(6)
            p.add_run().add_picture(path, width=Inches(w))
            label = f"Figure {chap[0]}.{counters['fig']}"
            c = d.add_paragraph(style="Figure Caption")
            runs_md(c, f"{label}: {cap}", size=10)
            captions["fig"].append(label)
        elif kind == "tab":
            _, cap, header, rows, widths = b
            counters["tab"] += 1
            label = f"Table {chap[0]}.{counters['tab']}"
            c = d.add_paragraph(style="Table Caption")
            runs_md(c, f"{label}: {cap}", size=10)
            last_total = rows and any(w in rows[-1][0] for w in ("total", "Total", "This work", "Mean"))
            add_table(header, rows, widths, bold_last=last_total)
            sp = d.add_paragraph(style="Normal"); sp.paragraph_format.space_after = Pt(4)
            sp.paragraph_format.line_spacing = 1.0


# ---------------------------------------------------------------- preliminary pages (roman)
prelim_heading("CONTENTS", page_break=False)
add_field(d.add_paragraph(style="Normal"), 'TOC \\o "1-3" \\h \\z \\u')
prelim_heading("LIST OF FIGURES")
add_field(d.add_paragraph(style="Normal"), 'TOC \\h \\z \\t "Figure Caption,1"')
prelim_heading("LIST OF TABLES")
add_field(d.add_paragraph(style="Normal"), 'TOC \\h \\z \\t "Table Caption,1"')
prelim_heading("LIST OF ABBREVIATIONS")
for a, full in ABBR:
    p = d.add_paragraph(style="Normal")
    p.paragraph_format.tab_stops.add_tab_stop(Inches(1.6))
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.line_spacing = 1.5
    r = p.add_run(a); r.bold = True; r.font.size = Pt(12); r.font.name = FONT
    r = p.add_run("\t" + full); r.font.size = Pt(12); r.font.name = FONT
prelim_heading("SYMBOLS AND NOTATIONS")
for a, full in SYMBOLS:
    p = d.add_paragraph(style="Normal")
    p.paragraph_format.tab_stops.add_tab_stop(Inches(1.0))
    p.paragraph_format.left_indent = Inches(1.0)
    p.paragraph_format.first_line_indent = Inches(-1.0)
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.line_spacing = 1.5
    r = p.add_run(a); r.italic = True; r.font.size = Pt(12); r.font.name = FONT
    r = p.add_run("\t" + full); r.font.size = Pt(12); r.font.name = FONT

d.add_section(WD_SECTION.NEW_PAGE)   # prelim section ends here; next section = chapters

# ---------------------------------------------------------------- chapters
emit(BODY)
h = d.add_paragraph("13. REFERENCES", style="Heading 1")
h.paragraph_format.page_break_before = True
for k, n in sorted(order.items(), key=lambda kv: kv[1]):
    p = d.add_paragraph(style="Normal")
    pf = p.paragraph_format
    pf.left_indent = Inches(0.45); pf.first_line_indent = Inches(-0.45)
    pf.tab_stops.add_tab_stop(Inches(0.45))
    pf.space_after = Pt(4); pf.line_spacing = 1.15
    pf.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    r = p.add_run(f"[{n}]\t{REFS[k]}"); r.font.size = Pt(11); r.font.name = FONT
emit(APPENDIX)

# ---------------------------------------------------------------- sections, margins, page numbers
secs = d.sections
pre, main = secs[-2], secs[-1]


def footer_pagenum(sec, fmt, start):
    sec.footer.is_linked_to_previous = False
    fp = sec.footer.paragraphs[0]
    fp.alignment = WD_ALIGN_PARAGRAPH.CENTER
    for r in list(fp.runs):
        r._r.getparent().remove(r._r)
    add_field(fp, "PAGE", "1")
    for r in fp.runs:
        r.font.name = FONT; r.font.size = Pt(11)
    pg = sec._sectPr.find(qn("w:pgNumType"))
    if pg is None:
        pg = OxmlElement("w:pgNumType"); sec._sectPr.append(pg)
    pg.set(qn("w:fmt"), fmt); pg.set(qn("w:start"), str(start))
    sec.bottom_margin = Inches(0.9)
    sec.footer_distance = Inches(0.4)
    sec.top_margin = Inches(0.95)


footer_pagenum(pre, "lowerRoman", 1)
footer_pagenum(main, "decimal", 1)
# the first front sections must not inherit the new footer: give the exec-summary section an empty footer
for s in secs[:-2]:
    pass

d.save(OUT)
print("saved", OUT, "refs cited:", len(order), "figures:", sum(1 for b in BODY if b[0] == "fig"), "tables:", sum(1 for b in BODY + APPENDIX if b[0] == "tab"))
