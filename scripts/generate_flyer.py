#!/usr/bin/env python3
"""
Genera el flyer de LivLin (10 x 14 cm, una cara, 300 dpi, sin sangrado).

    images/flyers/flyer-10x14.jpg

Objetivo: invitar a la conversacion de orientacion gratuita (20 min, online).
Foto sin filtros arriba, servicios disponibles y, al final, la invitacion:
"Conversemos tu idea" con QR a WhatsApp + WhatsApp, correo, web e Instagram. Blanco = sin tinta (papel).

Uso:
    pip install pillow segno
    python scripts/generate_flyer.py
"""

import sys
import tempfile
from pathlib import Path

import segno
from PIL import Image, ImageDraw

sys.path.insert(0, str(Path(__file__).resolve().parent))
from generate_tarjetas import (  # noqa: E402
    DPI, LOGO_CIRCLE, NAVY, PHOTO, ROOT, TEAL_DARK, WHITE,
    SERVICES, draw_text, font, mm, render_icon, text_w,
)

OUT_DIR = ROOT / "images/flyers"
W_MM, H_MM = 100, 140
BOOKING_URL = "https://wa.me/56971657358"
WHATSAPP = "+56 9 7165 7358"
MAIL = "francis@livlin.cl"
WEB = "www.livlin.cl"
IG = "@livlin.cl"
SOFT = (84, 104, 125)  # texto secundario
TEAL_BG = (232, 244, 245)
PHOTO_MM = 30
FLYER_SERVICES = [
    ("compass", "Diseñamos", "Espacios y proyectos regenerativos"),
    ("sprout", "Cultivamos", "Huertos urbanos y educativos"),
    ("leaf", "Enseñamos", "Educación ambiental participativa"),
    ("users", "Facilitamos", "Procesos para organizaciones y comunidades"),
    ("bar-chart-2", "Mejoramos", "Monitoreo, evaluación y aprendizaje"),
    ("laptop", "Desarrollamos", "Soluciones digitales a medida"),
]


def hexc(c):
    return "#%02x%02x%02x" % c


def wa_icon(color_hex, size):
    """Icono simple de WhatsApp (burbuja + telefono) dibujado con SVG."""
    import subprocess
    svg = (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%s" '
        'stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'
        '<path d="M3 21l1.65-4.8A8.5 8.5 0 1 1 8 19.4z"/>'
        '<path d="M9 10c.3 1.9 2.1 3.7 4 4l1.4-1.2 2 .9c-.3 1.1-1.3 1.7-2.4 1.6C10.7 15 8.4 12.600 8 10c-.1-1 .5-2 1.600-2.300l.9 2z"/>'
        '</svg>' % color_hex
    )
    with tempfile.TemporaryDirectory() as td:
        sp, pp = Path(td) / "w.svg", Path(td) / "w.png"
        sp.write_text(svg, encoding="utf-8")
        subprocess.run(["rsvg-convert", "-w", str(size), "-h", str(size), "-o", str(pp), str(sp)], check=True)
        return Image.open(pp).convert("RGBA")


def wrap(draw, text, f, max_w):
    words, lines, cur = text.split(), [], ""
    for w in words:
        t = (cur + " " + w).strip()
        if draw.textlength(t, font=f) <= max_w or not cur:
            cur = t
        else:
            lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def rrect(draw, box, r, fill):
    draw.rounded_rectangle(box, radius=r, fill=fill)


def build(photo_mm=PHOTO_MM):
    W, H = round(mm(W_MM)), round(mm(H_MM))
    cv = Image.new("RGBA", (W, H), (255, 255, 255, 255))
    d = ImageDraw.Draw(cv)
    m = mm(7)
    maxw = W - 2 * m

    # ---- foto (sin filtros) ----
    ph_h = round(mm(photo_mm))
    photo = Image.open(PHOTO).convert("RGB")
    sc = W / photo.width
    photo = photo.resize((W, round(photo.height * sc)), Image.LANCZOS)
    cv.paste(photo.crop((0, 0, W, ph_h)), (0, 0))
    bd = round(mm(19))
    logo = Image.open(LOGO_CIRCLE).convert("RGBA").resize((bd, bd), Image.LANCZOS)
    cv.paste(logo, (round(mm(4)), round(mm(4))), logo)

    # ---- bloque de invitacion (al final) ----
    head_lines = ("Vive de forma sostenible", "y regenerativa")
    size = 9.0
    while size > 4:
        f_t = font(mm(size), 800)
        if max(d.textlength(l, font=f_t) for l in head_lines) <= maxw:
            break
        size -= 0.1
    # alto del bloque: margen, etiqueta, titulo, aire, QR/contactos, margen (simetrico)
    qr_h = mm(19.4)
    cta_gap = mm(2.6)
    pitch = mm(3.7)
    col_h = 4 * pitch + mm(0.3) + mm(2.2)   # contactos + leyenda
    bh = mm(3.6) + mm(size) * 1.2 + cta_gap + max(qr_h, col_h) + mm(3.6)
    top = H - bh

    # ---- presentacion ----
    y = ph_h + mm(4.6)
    for l in head_lines:
        d.text((m, y), l, font=f_t, fill=TEAL_DARK)
        y += mm(size) * 1.12
    y += mm(1.2)
    f_p = font(mm(2.6), 500)
    desc = "Conecta tu propósito con las oportunidades de tu espacio y vive mejor cada día."
    desc2 = "Cotiza con nosotros, te acompañamos de principio a fin."
    for ln in wrap(d, desc, f_p, maxw):
        d.text((m, y), ln, font=f_p, fill=SOFT)
        y += mm(2.6) * 1.4
    y += mm(0.5)
    d.line((m, y, W - m, y), fill=(190, 214, 217), width=max(1, round(mm(0.2))))  # separador
    y += mm(1.9)
    for ln in wrap(d, desc2, f_p, maxw):
        d.text((m, y), ln, font=f_p, fill=SOFT)
        y += mm(2.6) * 1.4
    y += mm(1.5)

    # ---- servicios ----
    f_v = font(mm(2.55), 600)
    f_d = font(mm(2.6), 600)
    icon_px = round(mm(3.8))
    row_h = mm(5.1)
    for ic_name, verb, dsc in FLYER_SERVICES:
        cv.alpha_composite(render_icon(ic_name, hexc(TEAL_DARK), icon_px), (round(m), round(y - mm(0.5))))
        d.text((m + mm(5.5), y + mm(0.1)), verb, font=f_v, fill=TEAL_DARK)
        vx = m + mm(5.5) + d.textlength(verb, font=f_v) + mm(2.0)
        d.text((vx, y - mm(0.05)), dsc, font=f_d, fill=NAVY)
        assert vx + d.textlength(dsc, font=f_d) <= W - m + 1, dsc
        y += row_h
    assert y <= top - mm(1.0), (y / mm(1), top / mm(1))

    # ---- invitacion ----
    d.rectangle((0, top, W, H), fill=TEAL_DARK)
    f_tag = font(mm(2.1), 800)
    tag = "GRATIS · 20 MIN · ONLINE"
    f_cta = font(mm(size), 800)   # mismo tamano que el titular de arriba
    t_y = top + mm(3.6) - mm(0.8)
    d.text((m, t_y), "Conversemos tu idea", font=f_cta, fill=WHITE)
    # sello redondo al lado del titulo
    t_end = m + d.textlength("Conversemos tu idea", font=f_cta)
    bd2 = mm(13.2)
    bx = t_end + mm(2.4)
    assert bx + bd2 <= W - mm(3.0), "sello no cabe"
    by = max(t_y + mm(size) * 0.66 - bd2 / 2, top + mm(2.0))
    d.ellipse((bx, by, bx + bd2, by + bd2), fill=WHITE)
    f_s = font(mm(2.1), 800)
    for i, ln in enumerate(("GRATIS", "20 MIN", "ONLINE")):
        lw_ = d.textlength(ln, font=f_s)
        d.text((bx + (bd2 - lw_) / 2, by + bd2 / 2 + (i - 1) * mm(2.7) - mm(1.2)), ln, font=f_s, fill=TEAL_DARK)
    cy = top + mm(3.6) + mm(size) * 1.2 + cta_gap

    # QR a WhatsApp
    q = segno.make(BOOKING_URL, error="m", boost_error=False)
    n = len(q.matrix)
    cell = max(1, round(mm(18.5)) // (n + 2))
    side = cell * (n + 2)
    qr = Image.new("RGB", (side, side), WHITE)
    qd = ImageDraw.Draw(qr)
    for r_, row in enumerate(q.matrix):
        for c_, v in enumerate(row):
            if v:
                qd.rectangle(((c_ + 1) * cell, (r_ + 1) * cell, (c_ + 2) * cell - 1, (r_ + 2) * cell - 1), fill=NAVY)
    qx, qy = round(m), round(cy)
    rrect(d, (qx - 2, qy - 2, qx + side + 2, qy + side + 2), round(mm(1.4)), WHITE)
    cv.paste(qr, (qx, qy))

    # contactos
    x0 = qx + side + mm(6)
    f_c = font(mm(2.9), 600)
    icp = round(mm(3.4))
    yy = cy - mm(0.3)
    rows = [("wa", WHATSAPP), ("mail", MAIL), ("globe", WEB), ("instagram", IG)]
    for name, txt in rows:
        ic = wa_icon("#ffffff", icp) if name == "wa" else render_icon(name, "#ffffff", icp)
        cv.alpha_composite(ic, (round(x0), round(yy)))
        d.text((x0 + mm(4.8), yy - mm(0.2)), txt, font=f_c, fill=WHITE)
        yy += pitch
    f_n = font(mm(2.2), 600)
    d.text((x0, yy + mm(0.3)), "Escanea para escribirnos por WhatsApp", font=f_n, fill=(214, 238, 240))
    yy = yy + mm(0.3) + mm(2.2) - mm(3.0)
    assert max(d.textlength(t, font=f_c) + mm(4.8) for _, t in rows) <= W - x0 - m
    assert yy + mm(3.0) <= H - mm(1.2), (yy / mm(1), H / mm(1))

    return cv.convert("RGB")


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    p = OUT_DIR / "flyer-10x14.jpg"
    ph = 46.0
    while True:   # foto lo mas grande posible que deje caber todo
        try:
            img = build(ph)
            break
        except AssertionError:
            ph -= 0.2
            assert ph >= PHOTO_MM, "no cabe"
    print("foto", round(ph, 1), "mm")
    img.save(p, "JPEG", quality=92, optimize=True, dpi=(DPI, DPI))
    print(p.relative_to(ROOT), img.size, p.stat().st_size // 1024, "KB")


if __name__ == "__main__":
    main()
