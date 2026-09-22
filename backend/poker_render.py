"""Server-side render of a poker hand replay into animated GIF / MP4 using the
real PPP branded assets (table, cards, chips, avatars, frames, Ethnocentric font)."""
import io
import math
import os
import re
import tempfile

import imageio.v2 as imageio
from PIL import Image, ImageDraw, ImageFont

BRAND = "/app/frontend/public/brand"
FONT_DIR = "/app/frontend/src/fonts"
W, H = 1280, 720
GREEN = (143, 232, 10)
WHITE = (255, 255, 255)

_cache = {}


def _img(path):
    if path not in _cache:
        try:
            _cache[path] = Image.open(path).convert("RGBA")
        except Exception:
            _cache[path] = None
    return _cache[path]


def _font(size, kind="ethno"):
    key = (size, kind)
    if key not in _cache:
        fn = {"ethno": "Ethnocentric-Rg.otf", "bebas": "BebasNeue-Regular.ttf", "inter": "Inter-Variable.ttf"}[kind]
        try:
            _cache[key] = ImageFont.truetype(os.path.join(FONT_DIR, fn), size)
        except Exception:
            _cache[key] = ImageFont.load_default()
    return _cache[key]


def _paste(base, im, cx, cy, w=None, h=None):
    if im is None:
        return
    if w and not h:
        h = int(im.size[1] * (w / im.size[0]))
    if h and not w:
        w = int(im.size[0] * (h / im.size[1]))
    im2 = im.resize((max(1, w), max(1, h)))
    base.alpha_composite(im2, (int(cx - w / 2), int(cy - h / 2)))


def _text(d, cx, cy, txt, font, fill, anchor="mm"):
    d.text((cx, cy), txt, font=font, fill=fill, anchor=anchor)


def _denom(bet):
    try:
        v = float(re.sub(r"[^0-9.]", "", str(bet)) or 0)
    except Exception:
        v = 0
    chosen = 1
    for dd in [1, 5, 25, 100, 1000, 5000]:
        if v >= dd:
            chosen = dd
    return chosen


def _seat(i, n):
    ang = math.pi / 2 + (2 * math.pi * i) / n
    return W * (0.5 + 0.40 * math.cos(ang)), H * (0.47 + 0.33 * math.sin(ang))


def render_frame(frame: dict, deck: str = "fourcolour") -> Image.Image:
    base = Image.new("RGBA", (W, H), (10, 10, 10, 255))
    table = _img(f"{BRAND}/table/table.png")
    if table:
        base.alpha_composite(table.resize((W, H)))
    d = ImageDraw.Draw(base)

    deck = "standard" if deck == "standard" else "fourcolour"
    players = frame.get("players") or []
    n = max(len(players), 2)

    # board + street + pot (centre)
    board = frame.get("board") or []
    cw, ch, gap = 62, 88, 8
    total = len(board) * cw + (len(board) - 1) * gap if board else 0
    bx = W / 2 - total / 2
    by = H * 0.38
    if frame.get("street"):
        _text(d, W / 2, by - 70, str(frame["street"]).upper(), _font(26, "bebas"), GREEN)
    for c in board:
        _paste(base, _img(f"{BRAND}/cards/{deck}/{c}.png"), bx + cw / 2, by, w=cw)
        bx += cw + gap
    if frame.get("pot") is not None:
        py = H * 0.58
        _paste(base, _img(f"{BRAND}/chips/chip-100.png"), W / 2 - 60, py, w=30)
        _text(d, W / 2 - 40, py, f"POT {frame['pot']}", _font(24, "bebas"), WHITE, anchor="lm")

    for p in players:
        px, py = _seat(int(p.get("seat", 0)), n)
        folded = p.get("folded")
        # hole cards above avatar
        cards = p.get("cards") or []
        if not folded and cards:
            hcw = 44
            sx = px - (len(cards) * (hcw - 8))
            for c in cards:
                if p.get("revealed") and c:
                    _paste(base, _img(f"{BRAND}/cards/{deck}/{c}.png"), sx, py - 66, w=hcw)
                else:
                    _paste(base, _img(f"{BRAND}/cards/back.png"), sx, py - 66, w=hcw)
                sx += hcw - 8
        # avatar
        avatar_path = p.get("avatar") or "/brand/avatars/carson.png"
        av = _img("/app/frontend/public" + avatar_path)
        ax, ay = px, py
        _paste(base, av, ax, ay, w=76)
        if p.get("acting"):
            d.ellipse([ax - 40, ay - 40, ax + 40, ay + 40], outline=GREEN, width=3)
        if p.get("dealer"):
            _paste(base, _img(f"{BRAND}/frames/dealer.png"), ax + 30, ay + 26, w=26)
        # name frame + text
        nf = _img(f"{BRAND}/frames/nameframe.png")
        nfw, nfh = 150, 40
        _paste(base, nf, px, py + 56, w=nfw, h=nfh)
        col = (150, 160, 172) if folded else WHITE
        _text(d, px - nfw / 2 + 16, py + 48, str(p.get("name", ""))[:14], _font(15, "bebas"), col, anchor="lm")
        _text(d, px - nfw / 2 + 16, py + 64, str(p.get("stack", "")), _font(13, "inter"), (150, 160, 172) if folded else GREEN, anchor="lm")
        # bet chip toward centre
        bet = p.get("bet")
        if bet and not folded:
            tx = px + (W / 2 - px) * 0.5
            ty = py + (H * 0.47 - py) * 0.5
            _paste(base, _img(f"{BRAND}/chips/chip-{_denom(bet)}.png"), tx - 16, ty, w=26)
            _text(d, tx + 2, ty, str(bet), _font(16, "bebas"), WHITE, anchor="lm")

    # label bar
    label = frame.get("label")
    if label:
        d.rectangle([0, H - 46, W, H], fill=(8, 8, 8, 235))
        d.rectangle([0, H - 46, 7, H], fill=GREEN)
        _text(d, 22, H - 23, str(label), _font(20, "bebas"), WHITE, anchor="lm")
    return base


def _to_np(im):
    import numpy as np
    return np.array(im.convert("RGB"))


def render_media(frames: list, fmt: str = "gif", fps: int = 2, deck: str = "fourcolour") -> bytes:
    imgs = [render_frame(f, deck) for f in frames] or [Image.new("RGB", (W, H), (10, 10, 10))]
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
