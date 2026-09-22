"""Branded deck exporters: PPTX (python-pptx) and PDF (reportlab)."""
import io

from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR

from reportlab.pdfgen import canvas
from reportlab.lib.colors import Color

DARK = RGBColor(0x0D, 0x0D, 0x0D)
PANEL = RGBColor(0x16, 0x18, 0x20)
GREEN = RGBColor(0x9E, 0xE6, 0x0F)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
GREY = RGBColor(0xB4, 0xBC, 0xC8)

SW, SH = Inches(13.333), Inches(7.5)


def _bg(slide, color=DARK):
    slide.background.fill.solid()
    slide.background.fill.fore_color.rgb = color


def _box(slide, l, t, w, h, fill=None, line=None, line_w=1.5):
    from pptx.enum.shapes import MSO_SHAPE
    shp = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, l, t, w, h)
    if fill is None:
        shp.fill.background()
    else:
        shp.fill.solid()
        shp.fill.fore_color.rgb = fill
    if line is None:
        shp.line.fill.background()
    else:
        shp.line.color.rgb = line
        shp.line.width = Pt(line_w)
    shp.shadow.inherit = False
    return shp


def _text(slide, l, t, w, h, runs, align=PP_ALIGN.LEFT, anchor=MSO_ANCHOR.TOP, spacing=1.0):
    tb = slide.shapes.add_textbox(l, t, w, h)
    tf = tb.text_frame
    tf.word_wrap = True
    tf.vertical_anchor = anchor
    first = True
    for line in runs:
        p = tf.paragraphs[0] if first else tf.add_paragraph()
        first = False
        p.alignment = align
        p.line_spacing = spacing
        txt, size, color, bold, caps = line
        r = p.add_run()
        r.text = txt.upper() if caps else txt
        r.font.size = Pt(size)
        r.font.color.rgb = color
        r.font.bold = bold
        r.font.name = "Arial"
    return tb


def _logo(slide):
    tb = slide.shapes.add_textbox(Inches(0.4), Inches(6.95), Inches(5), Inches(0.4))
    p = tb.text_frame.paragraphs[0]
    for t, c in [("PRACTICAL POKER ", WHITE), ("+", GREEN)]:
        r = p.add_run(); r.text = t; r.font.size = Pt(12); r.font.bold = True; r.font.color.rgb = c; r.font.name = "Arial"


def _bar(slide, t):
    _box(slide, Inches(0.4), t, Inches(0.18), Inches(0.55), fill=GREEN)


def _slide_pptx(prs, s):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    layout = s.get("layout", "bullets")
    title = s.get("title", "")
    if layout == "title":
        _bg(slide)
        _text(slide, Inches(0.9), Inches(2.6), Inches(11.5), Inches(2),
              [(title or "Untitled", 54, WHITE, True, True)], anchor=MSO_ANCHOR.MIDDLE)
        if s.get("subtitle"):
            _text(slide, Inches(0.95), Inches(4.4), Inches(11), Inches(1),
                  [(s["subtitle"], 24, GREEN, True, True)])
    elif layout == "section":
        _bg(slide)
        if s.get("label"):
            _text(slide, Inches(0.95), Inches(2.4), Inches(6), Inches(0.6),
                  [(s["label"], 18, GREEN, True, True)])
        _text(slide, Inches(0.9), Inches(3.0), Inches(11.5), Inches(2),
              [(title, 46, WHITE, True, True)])
    elif layout == "quote":
        _bg(slide)
        _text(slide, Inches(1.2), Inches(2.2), Inches(11), Inches(3),
              [('"' + s.get("quote", "") + '"', 34, WHITE, True, False)], anchor=MSO_ANCHOR.MIDDLE)
        if s.get("author"):
            _text(slide, Inches(1.2), Inches(5.2), Inches(11), Inches(0.7),
                  [("— " + s["author"], 20, GREEN, True, True)])
    else:
        _bg(slide)
        _bar(slide, Inches(0.85))
        _text(slide, Inches(0.75), Inches(0.8), Inches(11.5), Inches(1),
              [(title, 34, WHITE, True, True)])
        top = Inches(2.1)
        if layout == "bullets" or layout == "takeaways":
            items = s.get("bullets") if layout == "bullets" else s.get("points")
            runs = [("▸  " + str(b), 20, WHITE, False, False) for b in (items or [])]
            _text(slide, Inches(0.9), top, Inches(11.5), Inches(4.8), runs, spacing=1.35)
        elif layout == "two_column":
            _box(slide, Inches(0.75), top, Inches(5.7), Inches(4.3), fill=PANEL, line=GREEN)
            _box(slide, Inches(6.85), top, Inches(5.7), Inches(4.3), fill=PANEL, line=GREEN)
            _text(slide, Inches(1.0), Inches(2.35), Inches(5.2), Inches(0.6), [(s.get("leftHeading", ""), 20, GREEN, True, True)])
            _text(slide, Inches(1.0), Inches(3.0), Inches(5.2), Inches(3.3), [(s.get("leftBody", ""), 16, WHITE, False, False)], spacing=1.25)
            _text(slide, Inches(7.1), Inches(2.35), Inches(5.2), Inches(0.6), [(s.get("rightHeading", ""), 20, GREEN, True, True)])
            _text(slide, Inches(7.1), Inches(3.0), Inches(5.2), Inches(3.3), [(s.get("rightBody", ""), 16, WHITE, False, False)], spacing=1.25)
        elif layout == "subheader_box":
            _box(slide, Inches(0.75), top, Inches(11.8), Inches(1.1), fill=GREEN)
            _text(slide, Inches(1.0), Inches(2.25), Inches(11.3), Inches(0.8), [(s.get("subHeader", ""), 22, DARK, True, True)], anchor=MSO_ANCHOR.MIDDLE)
            _text(slide, Inches(0.9), Inches(3.5), Inches(11.5), Inches(3.3), [(s.get("body", ""), 20, WHITE, False, False)], spacing=1.3)
        elif layout == "stats":
            stats = s.get("stats") or []
            n = max(1, len(stats))
            gap = Inches(0.3)
            total = Inches(11.8)
            bw = Emu(int((total - gap * (n - 1)) / n)) if n else total
            x = Inches(0.75)
            for st in stats:
                _box(slide, x, Inches(2.4), bw, Inches(2.6), fill=PANEL, line=GREEN)
                _text(slide, x, Inches(2.9), bw, Inches(1.0), [(str(st.get("value", "")), 40, GREEN, True, False)], align=PP_ALIGN.CENTER)
                _text(slide, x, Inches(4.0), bw, Inches(0.9), [(str(st.get("label", "")), 15, WHITE, False, True)], align=PP_ALIGN.CENTER)
                x = Emu(int(x + bw + gap))
        elif layout == "table_felt":
            from pptx.enum.shapes import MSO_SHAPE
            felt = slide.shapes.add_shape(MSO_SHAPE.OVAL, Inches(1.6), Inches(2.2), Inches(10), Inches(4.6))
            felt.fill.solid(); felt.fill.fore_color.rgb = RGBColor(0x0D, 0x40, 0x22)
            felt.line.color.rgb = GREEN; felt.line.width = Pt(3); felt.shadow.inherit = False
            _text(slide, Inches(2.6), Inches(3.6), Inches(8), Inches(2), [(s.get("body", ""), 20, WHITE, False, False)], align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE, spacing=1.3)
        elif layout == "image_text":
            _box(slide, Inches(8.3), top, Inches(4.2), Inches(4.3), fill=PANEL, line=GREEN)
            _text(slide, Inches(8.3), Inches(3.9), Inches(4.2), Inches(0.8), [((s.get("motif") or "chips").upper(), 24, GREEN, True, True)], align=PP_ALIGN.CENTER)
            _text(slide, Inches(0.9), top, Inches(7.0), Inches(4.3), [(s.get("body", ""), 20, WHITE, False, False)], spacing=1.3)
        else:
            _text(slide, Inches(0.9), top, Inches(11.5), Inches(4.5), [(s.get("body", ""), 20, WHITE, False, False)], spacing=1.3)
    _logo(slide)


def build_pptx(deck_title: str, slides: list) -> bytes:
    prs = Presentation()
    prs.slide_width = SW
    prs.slide_height = SH
    for s in slides:
        _slide_pptx(prs, s)
    buf = io.BytesIO()
    prs.save(buf)
    return buf.getvalue()


# ---------------- PDF ----------------
PW, PH = 960, 540
c_dark = Color(13 / 255, 13 / 255, 13 / 255)
c_green = Color(158 / 255, 230 / 255, 15 / 255)
c_white = Color(1, 1, 1)
c_panel = Color(22 / 255, 24 / 255, 32 / 255)
c_felt = Color(13 / 255, 64 / 255, 34 / 255)


def _wrap(c, text, font, size, max_w):
    c.setFont(font, size)
    words = str(text).split()
    lines, cur = [], ""
    for w in words:
        trial = (cur + " " + w).strip()
        if c.stringWidth(trial, font, size) <= max_w:
            cur = trial
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def _pdf_slide(c, s):
    c.setFillColor(c_dark); c.rect(0, 0, PW, PH, fill=1, stroke=0)
    layout = s.get("layout", "bullets")
    title = (s.get("title") or "").upper()

    def logo():
        c.setFont("Helvetica-Bold", 9)
        c.setFillColor(c_white); c.drawString(30, 20, "PRACTICAL POKER ")
        c.setFillColor(c_green); c.drawString(30 + c.stringWidth("PRACTICAL POKER ", "Helvetica-Bold", 9), 20, "+")

    if layout == "title":
        c.setFont("Helvetica-Bold", 40); c.setFillColor(c_white)
        for i, ln in enumerate(_wrap(c, title or "UNTITLED", "Helvetica-Bold", 40, PW - 120)):
            c.drawString(70, 320 - i * 46, ln)
        if s.get("subtitle"):
            c.setFont("Helvetica-Bold", 18); c.setFillColor(c_green)
            c.drawString(72, 250, s["subtitle"].upper())
    elif layout == "section":
        if s.get("label"):
            c.setFont("Helvetica-Bold", 14); c.setFillColor(c_green); c.drawString(72, 330, s["label"].upper())
        c.setFont("Helvetica-Bold", 34); c.setFillColor(c_white)
        for i, ln in enumerate(_wrap(c, title, "Helvetica-Bold", 34, PW - 140)):
            c.drawString(70, 290 - i * 40, ln)
    elif layout == "quote":
        c.setFont("Helvetica-Bold", 26); c.setFillColor(c_white)
        for i, ln in enumerate(_wrap(c, '"' + s.get("quote", "") + '"', "Helvetica-Bold", 26, PW - 160)):
            c.drawString(80, 330 - i * 34, ln)
        if s.get("author"):
            c.setFont("Helvetica-Bold", 16); c.setFillColor(c_green); c.drawString(80, 150, "— " + s["author"].upper())
    else:
        c.setFillColor(c_green); c.rect(30, 470, 12, 40, fill=1, stroke=0)
        c.setFont("Helvetica-Bold", 26); c.setFillColor(c_white)
        c.drawString(55, 478, title[:60])
        y = 430
        if layout in ("bullets", "takeaways"):
            items = s.get("bullets") if layout == "bullets" else s.get("points")
            c.setFont("Helvetica", 16)
            for b in (items or []):
                c.setFillColor(c_green); c.drawString(60, y, "▸")
                c.setFillColor(c_white)
                for ln in _wrap(c, b, "Helvetica", 16, PW - 130):
                    c.drawString(85, y, ln); y -= 26
                y -= 6
        elif layout == "two_column":
            for bx, hd, bd in [(40, "leftHeading", "leftBody"), (490, "rightHeading", "rightBody")]:
                c.setFillColor(c_panel); c.roundRect(bx, 60, 430, 360, 10, fill=1, stroke=0)
                c.setStrokeColor(c_green); c.setLineWidth(1.2); c.roundRect(bx, 60, 430, 360, 10, fill=0, stroke=1)
                c.setFont("Helvetica-Bold", 16); c.setFillColor(c_green); c.drawString(bx + 20, 385, (s.get(hd, "") or "").upper())
                c.setFont("Helvetica", 13); c.setFillColor(c_white)
                yy = 355
                for ln in _wrap(c, s.get(bd, ""), "Helvetica", 13, 390):
                    c.drawString(bx + 20, yy, ln); yy -= 20
        elif layout == "subheader_box":
            c.setFillColor(c_green); c.roundRect(40, 380, PW - 80, 50, 6, fill=1, stroke=0)
            c.setFont("Helvetica-Bold", 16); c.setFillColor(c_dark); c.drawString(58, 397, (s.get("subHeader", "") or "").upper())
            c.setFont("Helvetica", 15); c.setFillColor(c_white)
            yy = 340
            for ln in _wrap(c, s.get("body", ""), "Helvetica", 15, PW - 100):
                c.drawString(55, yy, ln); yy -= 24
        elif layout == "stats":
            stats = s.get("stats") or []
            n = max(1, len(stats)); gap = 20
            bw = (PW - 80 - gap * (n - 1)) / n
            x = 40
            for st in stats:
                c.setFillColor(c_panel); c.roundRect(x, 150, bw, 230, 10, fill=1, stroke=0)
                c.setStrokeColor(c_green); c.roundRect(x, 150, bw, 230, 10, fill=0, stroke=1)
                c.setFont("Helvetica-Bold", 30); c.setFillColor(c_green)
                c.drawCentredString(x + bw / 2, 290, str(st.get("value", "")))
                c.setFont("Helvetica", 12); c.setFillColor(c_white)
                for i, ln in enumerate(_wrap(c, str(st.get("label", "")).upper(), "Helvetica", 12, bw - 20)):
                    c.drawCentredString(x + bw / 2, 240 - i * 16, ln)
                x += bw + gap
        elif layout == "table_felt":
            c.setFillColor(c_felt); c.ellipse(120, 120, PW - 120, 400, fill=1, stroke=0)
            c.setStrokeColor(c_green); c.setLineWidth(2); c.ellipse(120, 120, PW - 120, 400, fill=0, stroke=1)
            c.setFont("Helvetica", 15); c.setFillColor(c_white)
            yy = 300
            for ln in _wrap(c, s.get("body", ""), "Helvetica", 15, 520):
                c.drawCentredString(PW / 2, yy, ln); yy -= 24
        else:
            c.setFont("Helvetica", 16); c.setFillColor(c_white)
            yy = 420
            for ln in _wrap(c, s.get("body", ""), "Helvetica", 16, PW - 120):
                c.drawString(60, yy, ln); yy -= 26
    logo()
    c.showPage()


def build_pdf(deck_title: str, slides: list) -> bytes:
    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=(PW, PH))
    for s in slides:
        _pdf_slide(c, s)
    c.save()
    return buf.getvalue()
