#!/usr/bin/env python3
"""
Genera las imagenes de referencia de la tarjeta de presentacion de LivLin
para cada medida estandar, a 300 dpi y a tamano exacto (sin sangrado).

Frente   -> images/tarjetas/frente-<ancho>x<alto>.jpg
            Misma receta que las imagenes OG: foto de fondo
            (images/people/francis_bancal_completo.jpg), degrade oscuro,
            badge circular con el logo arriba a la izquierda y, abajo a la
            izquierda, nombre, servicios y datos de contacto.
            Toda la informacion va al frente; la tarjeta no lleva reverso.
Reverso  -> images/tarjetas/reverso-<ancho>x<alto>.jpg
            Solo servicios y "Sanar naturaleza". Tinta oscura sobre blanco
            (blanco = sin tinta), sirve para todos los papeles.
Mural    -> images/tarjetas/mural-<ancho>x<alto>.jpg
            Version "todo al frente" para dejar la tarjeta en un panel donde no
            se ve el reverso: franja de foto grande a la derecha; a la izquierda logo,
            nombre (protagonista), descripcion, servicios y contacto.
            Tinta oscura sobre blanco (blanco = sin tinta): sirve para todos los papeles.
Kraft    -> images/tarjetas/frente-kraft-<ancho>x<alto>.jpg
            Version solo-tintas para papel kraft (no se imprime blanco):
            la foto se desvanece hacia el papel (aqui, blanco = sin tinta) y los
            textos van en tinta oscura. La pagina la mezcla en "multiplicar"
            sobre la textura kraft.

Uso:
    pip install pillow
    python scripts/generate_tarjetas.py
"""

import os
import subprocess
import tempfile
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
LOGO_TEXT = ROOT / "images/ui/logo_livlin_with_text.png"
PHOTO = ROOT / "images/people/francis_bancal_completo.jpg"
LOGO_CIRCLE = ROOT / "images/ui/logo_livlin_with_text_circle.png"
ICON_DIR = ROOT / "images/icons"
FONT_LATIN = ROOT / "scripts/fonts/Montserrat-Variable.ttf"
FONT_CJK = ROOT / "scripts/fonts/NotoSansSC-Variable.ttf"
OUT_DIR = ROOT / "images/tarjetas"

DPI = int(os.environ.get("LIVLIN_DPI", "300"))
SIZES_MM = [(90, 50), (90, 55), (80, 50), (85, 55)]

# Tintas (mismos colores del sitio)
NAVY = (17, 46, 77)          # --text
TEAL_DARK = (26, 119, 131)   # --teal-dark
GREEN_LIGHT = (122, 218, 165)  # --green-light
WHITE = (255, 255, 255)

# ----------------------------- contenido -----------------------------
NAME = "Francis Mason"
NAME_ZH = "(林高天)"
SERVICE_LINES = ["Servicios para la Sustentabilidad", "y la Regeneración"]
SERVICES = [
    ("compass", "Diseño regenerativo"),
    ("sprout", "Huerto urbano"),
    ("leaf", "Educación ambiental"),
    ("users", "Facilitación organizacional"),
    ("bar-chart-2", "Monitoreo y aprendizaje (MEL)"),
    ("laptop", "Soluciones digitales"),
]
# mismos servicios del flyer: verbo (verde) + descripcion (navy)
SERVICES_V = [
    ("compass", "Diseñamos", "Espacios y proyectos regenerativos"),
    ("sprout", "Cultivamos", "Huertos urbanos y educativos"),
    ("leaf", "Enseñamos", "Educación ambiental participativa"),
    ("users", "Facilitamos", "Procesos para organizaciones y comunidades"),
    ("bar-chart-2", "Mejoramos", "Monitoreo, evaluación y aprendizaje"),
    ("laptop", "Desarrollamos", "Soluciones digitales a medida"),
]
TAGLINE = ["Sanar", "naturaleza"]
CONTACTS = [
    ("phone", "+56 9 7165 7358"),
    ("globe", "www.livlin.cl"),
    ("mail", "francis@livlin.cl"),
    ("instagram", "@livlin.cl"),
]


def crop_logo(logo):
    """Recorta el logo a su contenido real: el PNG trae pixeles casi
    transparentes (alfa bajo) que ensanchan el recorte; se ignoran."""
    alpha = logo.getchannel("A").point(lambda v: 255 if v > 10 else 0)
    return logo.crop(alpha.getbbox())


def mm(v):
    return v * DPI / 25.4


def font(size_px, weight=700, cjk=False):
    f = ImageFont.truetype(str(FONT_CJK if cjk else FONT_LATIN), int(round(size_px)))
    try:
        f.set_variation_by_axes([weight])
    except OSError:
        pass
    return f


def fit_font(draw, text, max_w, size_px, weight, min_ratio=0.7, tracking=0):
    """Reduce el tamano hasta que el texto quepa en max_w (hasta min_ratio)."""
    size = size_px
    while size > size_px * min_ratio:
        f = font(size, weight)
        if text_w(draw, text, f, tracking) <= max_w:
            return f, size
        size -= 1
    return font(size, weight), size


def text_w(draw, text, f, tracking=0):
    if not tracking:
        return draw.textlength(text, font=f)
    return sum(draw.textlength(c, font=f) for c in text) + tracking * (len(text) - 1)


def draw_text(draw, xy, text, f, fill, tracking=0):
    x, y = xy
    if not tracking:
        draw.text((x, y), text, font=f, fill=fill)
        return
    for c in text:
        draw.text((x, y), c, font=f, fill=fill)
        x += draw.textlength(c, font=f) + tracking


# ------------------------------- frente -------------------------------
def build_front(w_mm, h_mm):
    W, H = round(mm(w_mm)), round(mm(h_mm))
    photo = Image.open(PHOTO).convert("RGB")
    scale = W / photo.width
    if photo.height * scale < H:  # por si la proporcion fuera muy alta
        scale = H / photo.height
    photo = photo.resize((round(photo.width * scale), round(photo.height * scale)), Image.LANCZOS)
    left = (photo.width - W) // 2
    canvas = photo.crop((left, 0, left + W, H))  # anclado arriba (igual que las OG)

    # degrade oscuro: abajo (como las OG) + lateral izquierdo para el texto
    alpha = Image.new("L", (W, H), 0)
    px = alpha.load()
    for y in range(H):
        a_bottom = 190 * (y / H) ** 1.5
        for x in range(W):
            a_left = 175 * max(0.0, 1 - x / (W * 0.72)) ** 1.2 * (0.45 + 0.55 * y / H)
            px[x, y] = int(min(225, max(a_bottom, a_left)))
    canvas = Image.composite(Image.new("RGB", (W, H), (10, 20, 15)), canvas, alpha)

    m = max(h_mm * 0.075 * DPI / 25.4, mm(3.6))  # margen

    # badge circular con el logo
    d = round(H * 0.27)
    badge = Image.open(LOGO_CIRCLE).convert("RGBA").resize((d, d), Image.LANCZOS)
    canvas.paste(badge, (round(m), round(m)), badge)

    draw = ImageDraw.Draw(canvas)
    max_w = W * 0.60 - m

    # texto abajo a la izquierda (de abajo hacia arriba)
    max_w = W * 0.64 - m
    y = H - m

    # contactos en cuadricula 2 x 2 (icono + texto, en blanco)
    cols, rows = 2, 2
    cell_w = max_w / cols
    icon_px = round(H * 0.050)
    icon_gap = H * 0.016
    text_max = cell_w - icon_px - icon_gap - H * 0.012
    c_size = H * 0.050
    for _, t in CONTACTS:
        _, sz = fit_font(draw, t, text_max, c_size, 500, min_ratio=0.55)
        c_size = min(c_size, sz)
    f_c = font(c_size, 500)
    asc, desc = f_c.getmetrics()
    line_h = asc + desc
    row_gap = H * 0.022
    y -= rows * line_h + (rows - 1) * row_gap
    for i, (icon, t) in enumerate(CONTACTS):
        r, c = divmod(i, cols)
        x = m + c * cell_w
        yy = y + r * (line_h + row_gap)
        ic = render_icon(icon, "#ffffff", icon_px)
        canvas.paste(ic, (round(x), round(yy + (line_h - icon_px) / 2 + H * 0.004)), ic)
        draw.text((x + icon_px + icon_gap, yy), t, font=f_c, fill=WHITE)
    y -= H * 0.030

    # servicios (2 lineas)
    role_size = H * 0.056
    size = role_size
    for line in SERVICE_LINES:
        _, sz = fit_font(draw, line, max_w, role_size, 500)
        size = min(size, sz)
    f = font(size, 500)
    asc, desc = f.getmetrics()
    for line in reversed(SERVICE_LINES):
        y -= (asc + desc) * 0.98
        draw.text((m, y), line, font=f, fill=WHITE)
        y -= H * 0.004
    y -= H * 0.022

    # nombre + nombre en chino
    f_name, _ = fit_font(draw, NAME, max_w * 0.70, H * 0.112, 800)
    asc, desc = f_name.getmetrics()
    y -= (asc + desc) * 0.92
    draw.text((m, y), NAME, font=f_name, fill=WHITE)
    nw = draw.textlength(NAME, font=f_name)
    f_zh = font(f_name.size * 0.80, 400, cjk=True)
    draw.text((m + nw + H * 0.03, y + f_name.size * 0.10), NAME_ZH, font=f_zh, fill=(235, 245, 238))
    return canvas


# ------------------------------ iconos -------------------------------
def render_icon(name, color_hex, size_px):
    svg = (ICON_DIR / f"{name}.svg").read_text(encoding="utf-8")
    svg = svg.replace("#2d7d6f", color_hex).replace("currentColor", color_hex)
    with tempfile.TemporaryDirectory() as td:
        sp, pp = Path(td) / "i.svg", Path(td) / "i.png"
        sp.write_text(svg, encoding="utf-8")
        subprocess.run(
            ["rsvg-convert", "-w", str(size_px), "-h", str(size_px), "-o", str(pp), str(sp)],
            check=True,
        )
        return Image.open(pp).convert("RGBA")


# ------------------------------ frente kraft ------------------------------
def smoothstep(a, b, x):
    t = min(1.0, max(0.0, (x - a) / (b - a)))
    return t * t * (3 - 2 * t)


def build_front_kraft(w_mm, h_mm):
    """Version para kraft: sin blancos. Tinta oscura sobre papel + foto con
    degrade hacia transparente (el papel asoma por la izquierda)."""
    W, H = round(mm(w_mm)), round(mm(h_mm))
    canvas = Image.new("RGBA", (W, H), (0, 0, 0, 0))

    # foto desplazada a la derecha, anclada arriba
    photo = Image.open(PHOTO).convert("RGB")
    scale = W / photo.width
    if photo.height * scale < H:
        scale = H / photo.height
    photo = photo.resize((round(photo.width * scale), round(photo.height * scale)), Image.LANCZOS)
    off = round(W * 0.14)
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    layer.paste(photo.crop((0, 0, W - off, H)).convert("RGBA"), (off, 0))
    mask = Image.new("L", (W, H), 0)
    mp = mask.load()
    cols = [int(255 * smoothstep(W * 0.46, W * 0.68, x)) for x in range(W)]
    for x in range(W):
        for y in range(H):
            mp[x, y] = cols[x]
    layer.putalpha(Image.composite(layer.getchannel("A"), Image.new("L", (W, H), 0), mask))
    canvas.alpha_composite(layer)

    m = max(h_mm * 0.075 * DPI / 25.4, mm(3.6))
    draw = ImageDraw.Draw(canvas)

    # logo (sin circulo) arriba a la izquierda
    logo = Image.open(LOGO_TEXT).convert("RGBA")
    logo = crop_logo(logo)
    lh = round(H * 0.25)
    logo = logo.resize((round(logo.width * lh / logo.height), lh), Image.LANCZOS)
    canvas.alpha_composite(logo, (round(m), round(m)))

    max_w = W * 0.60 - m
    y = H - m
    cols_n, rows_n = 2, 2
    cell_w = max_w / cols_n
    icon_px = round(H * 0.050)
    icon_gap = H * 0.016
    text_max = cell_w - icon_px - icon_gap - H * 0.012
    c_size = H * 0.050
    for _, t in CONTACTS:
        _, sz = fit_font(draw, t, text_max, c_size, 600, min_ratio=0.55)
        c_size = min(c_size, sz)
    f_c = font(c_size, 600)
    asc, desc = f_c.getmetrics()
    line_h = asc + desc
    row_gap = H * 0.022
    y -= rows_n * line_h + (rows_n - 1) * row_gap
    hex_c = "#%02x%02x%02x" % NAVY
    for i, (icon, t) in enumerate(CONTACTS):
        r, c = divmod(i, cols_n)
        x = m + c * cell_w
        yy = y + r * (line_h + row_gap)
        ic = render_icon(icon, hex_c, icon_px)
        canvas.alpha_composite(ic, (round(x), round(yy + (line_h - icon_px) / 2 + H * 0.004)))
        draw.text((x + icon_px + icon_gap, yy), t, font=f_c, fill=NAVY + (255,))
    y -= H * 0.030

    role_size = H * 0.056
    size = role_size
    for line in SERVICE_LINES:
        _, sz = fit_font(draw, line, max_w, role_size, 600)
        size = min(size, sz)
    f = font(size, 600)
    asc, desc = f.getmetrics()
    for line in reversed(SERVICE_LINES):
        y -= (asc + desc) * 0.98
        draw.text((m, y), line, font=f, fill=NAVY + (255,))
        y -= H * 0.004
    y -= H * 0.022

    f_name, _ = fit_font(draw, NAME, max_w * 0.70, H * 0.112, 800)
    asc, desc = f_name.getmetrics()
    y -= (asc + desc) * 0.92
    draw.text((m, y), NAME, font=f_name, fill=NAVY + (255,))
    nw = draw.textlength(NAME, font=f_name)
    f_zh = font(f_name.size * 0.80, 500, cjk=True)
    draw.text((m + nw + H * 0.03, y + f_name.size * 0.10), NAME_ZH, font=f_zh, fill=TEAL_DARK + (255,))
    return canvas



# --------------- servicios "verbo + descripcion" (como el flyer) ---------------
def wrap_segs(draw, verb, desc, f, max_w):
    """Envuelve 'verbo descripcion' en lineas; cada palabra lleva su tipo (v/d)."""
    words = [(w, "v") for w in verb.split()] + [(w, "d") for w in desc.split()]
    sp = draw.textlength(" ", font=f)
    lines, cur, cw = [], [], 0.0
    for w, k in words:
        ww = draw.textlength(w, font=f)
        add = ww if not cur else sp + ww
        if cur and cw + add > max_w:
            lines.append(cur)
            cur, cw = [(w, k)], ww
        else:
            cur.append((w, k))
            cw += add
    if cur:
        lines.append(cur)
    return lines


def draw_segs(draw, x, y, line, f, c_verb, c_desc):
    sp = draw.textlength(" ", font=f)
    for i, (w, k) in enumerate(line):
        draw.text((x, y), w, font=f, fill=c_verb if k == "v" else c_desc)
        x += draw.textlength(w, font=f) + sp


# ------------------------------ reverso -------------------------------
def build_back(w_mm, h_mm):
    """Reverso: logo + 'Sanar naturaleza' a la izquierda, servicios a la derecha."""
    W, H = round(mm(w_mm)), round(mm(h_mm))
    canvas = Image.new("RGBA", (W, H), (255, 255, 255, 255))
    draw = ImageDraw.Draw(canvas)
    m = max(h_mm * 0.075 * DPI / 25.4, mm(3.6))

    # columna izquierda
    logo = Image.open(LOGO_TEXT).convert("RGBA")
    logo = crop_logo(logo)
    lh = round(H * 0.25)
    logo = logo.resize((round(logo.width * lh / logo.height), lh), Image.LANCZOS)
    canvas.alpha_composite(logo, (round(m), round(m)))

    left_w = W * 0.37 - m
    size = H * 0.115
    for line in TAGLINE:
        _, sz = fit_font(draw, line, left_w, size, 800, min_ratio=0.6)
        size = min(size, sz)
    f_t = font(size, 800)
    asc, desc = f_t.getmetrics()
    lh_t = (asc + desc) * 0.92
    y = H - m - lh_t * len(TAGLINE)
    for i, line in enumerate(TAGLINE):
        draw.text((m, y + i * lh_t), line, font=f_t, fill=NAVY if i == 0 else TEAL_DARK)

    # separador vertical suave
    sx = round(W * 0.42)
    draw.line([(sx, m), (sx, H - m)], fill=(190, 220, 222), width=max(2, round(H * 0.005)))

    # servicios
    x0 = W * 0.42 + W * 0.045
    max_w = W - m - x0
    icon_px = round(H * 0.062)
    icon_gap = H * 0.028
    text_max = max_w - icon_px - icon_gap
    c_size = H * 0.060
    while c_size > H * 0.035:
        f_c = font(c_size, 600)
        asc, desc = f_c.getmetrics()
        line_h = (asc + desc) * 1.0
        rows = [wrap_segs(draw, v, t, f_c, text_max) for _, v, t in SERVICES_V]
        n = len(SERVICES_V)
        total = sum(len(r) for r in rows) * line_h + (n - 1) * H * 0.03
        if total <= H - 2 * m:
            break
        c_size -= 1
    f_c = font(c_size, 600)
    asc, desc = f_c.getmetrics()
    line_h = asc + desc
    rows = [wrap_segs(draw, v, t, f_c, text_max) for _, v, t in SERVICES_V]
    n = len(rows)
    nl = sum(len(r) for r in rows)
    row_gap = min((H - 2 * m - nl * line_h) / (n - 1), H * 0.07)
    total = nl * line_h + (n - 1) * row_gap
    y = (H - total) / 2
    hex_c = "#%02x%02x%02x" % TEAL_DARK
    for (icon, _, _), lines in zip(SERVICES_V, rows):
        ic = render_icon(icon, hex_c, icon_px)
        canvas.alpha_composite(ic, (round(x0), round(y + (line_h - icon_px) / 2 + H * 0.004)))
        for ln in lines:
            draw_segs(draw, x0 + icon_px + icon_gap, y, ln, f_c, TEAL_DARK, NAVY)
            y += line_h
        y += row_gap
    return canvas.convert("RGB")



# ------------------------------- mural -------------------------------
def wrap_lines(draw, text, f, max_w):
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


def build_mural_cfg(w_mm, h_mm, photo_frac):
    """Todo al frente (tarjeta de una sola cara): foto a la derecha; a la
    izquierda logo + nombre, descriptor, los 6 servicios del flyer en dos
    columnas (verbo + descripcion) y los datos de contacto en 2 x 2."""
    W, H = round(mm(w_mm)), round(mm(h_mm))
    canvas = Image.new("RGBA", (W, H), (255, 255, 255, 255))
    draw = ImageDraw.Draw(canvas)
    m = max(h_mm * 0.07 * DPI / 25.4, mm(3.4))

    # --- franja de foto (derecha, alto completo) ---
    sw = round(W * photo_frac)
    photo = Image.open(PHOTO).convert("RGB")
    ph = photo.resize((round(photo.width * H / photo.height), H), Image.LANCZOS)
    cx = round(ph.width * 0.64) - round(sw * 0.50)
    strip = ph.crop((cx, 0, cx + sw, H))
    canvas.paste(strip, (W - sw, 0))

    zone_r = W - sw - m * 0.9
    zone_w = zone_r - m

    # --- logo: insignia circular sobre la foto (como en las imagenes OG), abajo ---
    badge = crop_logo(Image.open(LOGO_CIRCLE).convert("RGBA"))
    bd = round(sw * 0.80)
    badge = badge.resize((bd, bd), Image.LANCZOS)
    canvas.alpha_composite(badge, (W - sw + (sw - bd) // 2, H - round(m * 0.8) - bd))

    # --- nombre: linea propia, arriba a la izquierda ---
    zh = NAME_ZH.strip("()")            # nombre chino sin parentesis, pequeno, junto al nombre
    size = H * 0.10
    while size > H * 0.05:
        f_t = font(size, 800)
        f_zh = font(size * 0.52, 500, cjk=True)
        if draw.textlength(NAME, font=f_t) + size * 0.35 + draw.textlength(zh, font=f_zh) <= zone_w:
            break
        size -= 1
    f_t = font(size, 800)
    f_zh = font(size * 0.52, 500, cjk=True)
    asc, desc = f_t.getmetrics()
    name_h = (asc + desc) * 0.92
    base_y = m - H * 0.01 + asc
    draw.text((m, base_y), NAME, font=f_t, fill=NAVY, anchor="ls")
    draw.text((m + draw.textlength(NAME, font=f_t) + size * 0.35, base_y), zh, font=f_zh, fill=TEAL_DARK, anchor="ls")

    sep_y = m + name_h + H * 0.045
    line_c = (190, 220, 222)
    lw = max(2, round(H * 0.005))
    top = sep_y - H * 0.012                 # el descriptor va sobre la linea separadora
    bottom = H - m
    avail = bottom - top

    hexT = "#%02x%02x%02x" % TEAL_DARK
    gap = W * 0.03
    colw = (zone_w - gap) / 2
    desc_text = " ".join(SERVICE_LINES)

    def layout(S):
        f = font(S, 600)
        a_, d_ = f.getmetrics()
        lh_ = (a_ + d_) * 0.98
        icon = round(S * 1.15)
        ig = S * 0.45
        dsz = S * 1.3                      # descriptor destacado: mas grande y en negrita
        while dsz > S and draw.textlength(desc_text, font=font(dsz, 800)) > zone_w:
            dsz -= 1
        fd = font(dsz, 800)
        da, dd = fd.getmetrics()
        desc_h = (da + dd) * 0.98
        items = [wrap_segs(draw, v, t, f, colw) for _, v, t in SERVICES_V]  # sin iconos
        rows_h = [max(len(items[i]), len(items[i + 1])) * lh_ for i in (0, 2, 4)]
        n_rows_c = (len(CONTACTS) + 1) // 2
        contacts_h = n_rows_c * lh_ + (n_rows_c - 1) * S * 0.3
        need = desc_h + sum(rows_h) + contacts_h
        return f, lh_, icon, ig, fd, desc_h, items, rows_h, contacts_h, need

    S = H * 0.062
    while S > H * 0.035:
        data = layout(S)
        widest = max(draw.textlength(t, font=data[0]) for _, t in CONTACTS)
        desc_ok = draw.textlength(desc_text, font=data[4]) <= zone_w + 1
        if data[9] + 4 * S * 0.5 <= avail and widest <= colw - data[2] - data[3] and desc_ok:
            break
        S -= 1
    f, lh_, icon, ig, fd, desc_h, items, rows_h, contacts_h, need = layout(S)
    free = avail - need
    g = min(free / 4, S * 1.3)           # 4 huecos: descriptor|svc, entre filas (2), svc|contacto
    y = top + (free - 4 * g) / 2

    # descriptor
    draw.text((m, y), desc_text, font=fd, fill=TEAL_DARK)
    y += desc_h + g * 0.5
    draw.line([(m, y), (zone_r, y)], fill=line_c, width=lw)   # separador bajo el descriptor
    y += g * 0.5
    # servicios (2 columnas x 3 filas)
    for r in range(3):
        for c in range(2):
            idx = r * 2 + c
            x = m + c * (colw + gap)
            yy = y
            for ln in items[idx]:
                draw_segs(draw, x, yy, ln, f, TEAL_DARK, NAVY)
                yy += lh_
        y += rows_h[r] + (g if r < 2 else 0)
    y += g * 0.5
    draw.line([(m, y), (zone_r, y)], fill=line_c, width=lw)
    y += g * 0.5
    # contactos 2 x 2
    for i, (ic, t) in enumerate(CONTACTS):
        x = m + (i % 2) * (colw + gap)
        yy = y + (i // 2) * (lh_ + S * 0.3)
        icn = render_icon(ic, hexT, icon)
        canvas.alpha_composite(icn, (round(x), round(yy + (lh_ - icon) / 2 + S * 0.05)))
        draw.text((x + icon + ig, yy), t, font=f, fill=NAVY)
    out = canvas.convert("RGB")
    out.info["font_px"] = S
    return out, S



def build_mural(w_mm, h_mm):
    """Prueba varios anchos de foto y se queda con el de texto mas grande
    (a igual tamano, la foto mas ancha)."""
    best = None
    for frac in (0.27,):
        img, S = build_mural_cfg(w_mm, h_mm, frac)
        if best is None or S > best[1] + 0.5:
            best = (img, S, frac)
    best[0].info["photo_frac"] = best[2]
    return best[0], best[1]


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for w, h in SIZES_MM:
        tag = f"{w}x{h}"
        front = build_front(w, h)
        fp = OUT_DIR / f"frente-{tag}.jpg"
        front.save(fp, "JPEG", quality=90, optimize=True, dpi=(DPI, DPI))
        bp = OUT_DIR / f"reverso-{tag}.jpg"
        build_back(w, h).save(bp, "JPEG", quality=92, optimize=True, dpi=(DPI, DPI))
        mp = OUT_DIR / f"mural-{tag}.jpg"
        mimg, msz = build_mural(w, h)
        mimg.save(mp, "JPEG", quality=92, optimize=True, dpi=(DPI, DPI))
        print(f"   mural {tag}: texto {msz * 72 / DPI:.1f} pt, foto {mimg.info.get('photo_frac')}")
        kraft = build_front_kraft(w, h)
        kp = OUT_DIR / f"frente-kraft-{tag}.jpg"
        flat = Image.new("RGB", kraft.size, (255, 255, 255))
        flat.paste(kraft, (0, 0), kraft)  # blanco = sin tinta
        flat.save(kp, "JPEG", quality=90, optimize=True, dpi=(DPI, DPI))
        print(f"{tag} mm -> {front.size[0]}x{front.size[1]} px  {fp.stat().st_size // 1024} KB / kraft {kp.stat().st_size // 1024} KB")


if __name__ == "__main__":
    main()
