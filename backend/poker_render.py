"""Server-side render of a poker hand replay into animated GIF / MP4 (branded)."""
import io
import math
import os

import imageio.v2 as imageio
import reportlab
from PIL import Image, ImageDraw, ImageFont

FONT_DIR = os.path.join(os.path.dirname(reportlab.__file__), "fonts")
W, H = 960, 540
BG = (13, 13, 13)
GREEN = (158, 230, 15)
FELT = (13, 64, 34)
FELT_EDGE = (26, 92, 54)
WHITE = (255, 255, 255)
GREY = (150, 160, 172)
PANEL = (22, 24, 32)

SUIT_COLORS = {"s": (17, 24, 39), "h": (220, 38, 38), "d": (37, 99, 235), "c": (16, 132, 90)}


def _font(size, bold=False):
    name = "VeraBd.ttf" if bold else "Vera.ttf"
    try:
        return ImageFont.truetype(os.path.join(FONT_DIR, name), size)
    except Exception:
        return ImageFont.load_default()


def _center_text(d, xy, text, font, fill):
    b = d.textbbox((0, 0), text, font=font)
    d.text((xy[0] - (b[2] - b[0]) / 2, xy[1] - (b[3] - b[1]) / 2), text, font=font, fill=fill)


def _suit_shape(d, cx, cy, s, color):
    if s == "d":
        d.polygon([(cx, cy - 8), (cx + 6, cy), (cx, cy + 8), (cx - 6, cy)], fill=color)
    elif s == "h":
        d.ellipse([cx - 6, cy - 6, cx, cy], fill=color)
        d.ellipse([cx, cy - 6, cx + 6, cy], fill=color)
        d.polygon([(cx - 6, cy - 2), (cx + 6, cy - 2), (cx, cy + 8)], fill=color)
    elif s == "s":
        d.polygon([(cx, cy - 8), (cx + 6, cy + 2), (cx - 6, cy + 2)], fill=color)
        d.ellipse([cx - 6, cy - 2, cx, cy + 4], fill=color)
        d.ellipse([cx, cy - 2, cx + 6, cy + 4], fill=color)
        d.rectangle([cx - 1, cy + 2, cx + 1, cy + 8], fill=color)
    else:  # clubs
        d.ellipse([cx - 6, cy - 3, cx, cy + 3], fill=color)
        d.ellipse([cx, cy - 3, cx + 6, cy + 3], fill=color)
        d.ellipse([cx - 3, cy - 8, cx + 3, cy - 2], fill=color)
        d.rectangle([cx - 1, cy, cx + 1, cy + 8], fill=color)


def _draw_card(d, x, y, card, w=42, h=60, face_up=True):
    if not face_up or not card:
        d.rounded_rectangle([x, y, x + w, y + h], radius=6, fill=(24, 40, 22), outline=GREEN, width=2)
        for i in range(4):
            d.line([(x + 4 + i * 10, y + 4), (x + 4 + i * 10 + 6, y + h - 4)], fill=GREEN, width=1)
        return
    rank = card[:-1].upper().replace("10", "T")
    suit = card[-1].lower()
    color = SUIT_COLORS.get(suit, (17, 24, 39))
    d.rounded_rectangle([x, y, x + w, y + h], radius=6, fill=(245, 247, 250), outline=(200, 205, 210), width=1)
    d.text((x + 4, y + 2), rank, font=_font(18, True), fill=color)
    _suit_shape(d, x + w / 2, y + h - 16, suit, color)


def _chip(d, cx, cy, r=8):
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=GREEN, outline=(13, 13, 13), width=2)
    d.ellipse([cx - r + 3, cy - r + 3, cx + r - 3, cy + r - 3], outline=(13, 13, 13), width=1)


def _seat_pos(i, n):
    # angle around ellipse, seat 0 at bottom center (hero), going clockwise
    ang = math.pi / 2 + (2 * math.pi * i / n)
    rx, ry = 340, 175
    cx, cy = W / 2, H / 2 + 10
    return cx + rx * math.cos(ang), cy + ry * math.sin(ang)


def render_frame(frame: dict) -> Image.Image:
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    # hex-ish subtle dots
    for yy in range(0, H, 26):
        for xx in range(0, W, 26):
            d.point((xx, yy), fill=(28, 30, 26))

    cx, cy = W / 2, H / 2 + 10
    d.ellipse([cx - 355, cy - 190, cx + 355, cy + 190], fill=FELT_EDGE)
    d.ellipse([cx - 345, cy - 180, cx + 345, cy + 180], fill=FELT, outline=GREEN, width=3)

    # brand
    lf = _font(15, True)
    d.text((28, 18), "PRACTICAL POKER ", font=lf, fill=WHITE)
    wpp = d.textlength("PRACTICAL POKER ", font=lf)
    d.text((28 + wpp, 18), "+", font=lf, fill=GREEN)

    # street + pot
    if frame.get("street"):
        _center_text(d, (cx, cy - 70), str(frame["street"]).upper(), _font(15, True), GREEN)
    board = frame.get("board") or []
    bw, gap = 42, 8
    total = len(board) * bw + (len(board) - 1) * gap if board else 0
    bx = cx - total / 2
    for c in board:
        _draw_card(d, bx, cy - 30, c)
        bx += bw + gap
    if frame.get("pot"):
        _chip(d, cx - 26, cy + 52, 9)
        d.text((cx - 12, cy + 44), f"POT  {frame['pot']}", font=_font(15, True), fill=WHITE)

    players = frame.get("players") or []
    n = max(len(players), 2)
    for p in players:
        px, py = _seat_pos(int(p.get("seat", 0)), n)
        folded = p.get("folded")
        acting = p.get("acting")
        box_w, box_h = 120, 46
        bx0, by0 = px - box_w / 2, py - box_h / 2
        outline = GREEN if acting else (60, 66, 76)
        fill = (20, 22, 30) if not folded else (16, 16, 18)
        d.rounded_rectangle([bx0, by0, bx0 + box_w, by0 + box_h], radius=8, fill=fill, outline=outline, width=2 if acting else 1)
        name = str(p.get("name", ""))[:14]
        d.text((bx0 + 10, by0 + 6), name, font=_font(13, True), fill=WHITE if not folded else GREY)
        d.text((bx0 + 10, by0 + 25), str(p.get("stack", "")), font=_font(12), fill=GREEN if not folded else GREY)
        if p.get("dealer"):
            d.ellipse([bx0 + box_w - 20, by0 - 8, bx0 + box_w, by0 + 12], fill=WHITE)
            _center_text(d, (bx0 + box_w - 10, by0 + 2), "D", _font(11, True), (13, 13, 13))

        # hole cards above box
        cards = p.get("cards") or []
        hero = p.get("hero")
        if not folded and cards:
            cw = 30
            startx = px - (len(cards) * (cw + 4) - 4) / 2
            for c in cards:
                _draw_card(d, startx, by0 - 46, c, w=cw, h=42, face_up=bool(hero and c))
                startx += cw + 4
        # bet toward center
        bet = p.get("bet")
        if bet and not folded:
            tx = px + (cx - px) * 0.3
            ty = py + (cy - py) * 0.3
            _chip(d, tx - 12, ty, 8)
            d.text((tx, ty - 7), str(bet), font=_font(12, True), fill=WHITE)

    # action label bar
    label = frame.get("label")
    if label:
        d.rectangle([0, H - 42, W, H], fill=PANEL)
        d.rectangle([0, H - 42, 6, H], fill=GREEN)
        d.text((20, H - 30), str(label), font=_font(16, True), fill=WHITE)
    return img


def render_media(frames: list, fmt: str = "gif", fps: int = 2) -> bytes:
    import tempfile
    imgs = [render_frame(f) for f in frames] or [Image.new("RGB", (W, H), BG)]
    arrays = [_to_np(im) for im in imgs]
    if fmt == "mp4":
        with tempfile.NamedTemporaryFile(suffix=".mp4", delete=True) as tf:
            imageio.mimwrite(tf.name, arrays, format="FFMPEG", fps=fps, codec="libx264",
                             pixelformat="yuv420p", macro_block_size=None)
            with open(tf.name, "rb") as fh:
                return fh.read()
    buf = io.BytesIO()
    imageio.mimwrite(buf, arrays, format="GIF", duration=1.0 / fps, loop=0)
    return buf.getvalue()


def _to_np(im):
    import numpy as np
    return np.array(im.convert("RGB"))
