#!/usr/bin/env python3
"""
Genera las imagenes para compartir el Reporte de Impacto de LivLin.

Lee las cifras de js/impacto-datos.js (las mismas que muestra la pagina), asi que al actualizar
los datos basta con volver a correr este script:

    python scripts/generate_og_impacto.py

Salida:
  images/og/og-impacto.jpg                       1200x630  Vista previa de enlaces (WhatsApp, Facebook, LinkedIn, X)
  images/og/{en,da,zh}/og-impacto.jpg            copia, para que cada idioma tenga su imagen
  images/compartir/impacto-instagram-feed.jpg    1080x1350 Publicacion de Instagram (4:5)
  images/compartir/impacto-instagram-cuadrado.jpg 1080x1080 Publicacion cuadrada
  images/compartir/impacto-instagram-story.jpg   1080x1920 Historia / Reel (9:16, con zonas seguras)

Estilo: el mismo de las demas imagenes OG del sitio (foto de fondo, insignia circular con el logo,
titulo en mayusculas Montserrat ExtraBold).
"""
import json
import re
import shutil
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent.parent
PHOTO = ROOT / "images/people/francis_bancal_completo.jpg"
LOGO = ROOT / "images/ui/logo_livlin_with_text_circle.png"
FONT = ROOT / "scripts/fonts/Montserrat-Variable.ttf"
OUT_OG = ROOT / "images/og"
OUT_SHARE = ROOT / "images/compartir"

NAVY = (17, 46, 77)
GREEN = (122, 218, 165)
WHITE = (255, 255, 255)


def font(size, weight=800):
    f = ImageFont.truetype(str(FONT), size)
    try:
        f.set_variation_by_axes([weight])
    except OSError:
        pass
    return f


def cargar_datos():
    t = (ROOT / "js/impacto-datos.js").read_text(encoding="utf-8")
    d = json.loads(t[t.index("{"): t.rindex("}") + 1])
    nf = lambda v: f"{v:,.0f}".replace(",", ".")
    return d, [
        (nf(d["espacios"]), "proyectos\nacompañados"),
        (nf(d["personas_espacios"]), "personas · diagnóstico\ny diseño"),
        (nf(d["personas_impl"]), "personas ·\nimplementación"),
        (f"{d['cultivo']['nuevo_m2']:.1f}".replace(".", ",") + " m²", "de cultivo urbano\nimplementado"),
    ]


def fecha_periodo(d):
    meses = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]
    f = lambda iso: f"{int(iso[8:10])} {meses[int(iso[5:7]) - 1]} {iso[:4]}"
    return f"Primer año · {f(d['periodo']['inicio'])} – {f(d['periodo']['aniversario'])}"


def foto_recortada(w, h, foco_x=0.62, foco_y=0.0):
    """Recorta la foto a w×h llenando el lienzo, con el foco (fracciones) sobre la persona."""
    im = Image.open(PHOTO).convert("RGB")
    esc = max(w / im.width, h / im.height)
    im = im.resize((int(im.width * esc) + 1, int(im.height * esc) + 1), Image.LANCZOS)
    x = int((im.width - w) * foco_x)
    y = int((im.height - h) * foco_y)
    return im.crop((x, y, x + w, y + h))


def degradado(canvas, direccion, inicio, fin, alpha_max=235, color=NAVY, curva=1.4):
    """Superpone un degradado de `color`. direccion: 'abajo' o 'izquierda'. inicio/fin en fracciones."""
    w, h = canvas.size
    mask = Image.new("L", (w, h), 0)
    px = mask.load()
    if direccion == "abajo":
        for y in range(h):
            t = min(max((y / h - inicio) / (fin - inicio), 0), 1)
            a = int(alpha_max * t ** curva)
            for x in range(w):
                px[x, y] = a
    else:
        for x in range(w):
            t = min(max(1 - (x / w - inicio) / (fin - inicio), 0), 1) if x / w >= inicio else 1
            t = min(max(1 - (x / w) / fin, 0), 1)
            a = int(alpha_max * t ** curva)
            for y in range(h):
                px[x, y] = a
    base = Image.new("RGB", (w, h), color)
    return Image.composite(base, canvas, mask)


def insignia(canvas, x, y, d):
    logo = Image.open(LOGO).convert("RGBA").resize((d, d), Image.LANCZOS)
    # sombra suave para que la insignia blanca se vea también sobre cielo claro
    sombra = Image.new("L", canvas.size, 0)
    ImageDraw.Draw(sombra).ellipse((x - 2, y + 6, x + d + 2, y + d + 10), fill=110)
    sombra = sombra.filter(ImageFilter.GaussianBlur(10))
    canvas.paste(Image.new("RGB", canvas.size, (8, 20, 34)), (0, 0), sombra)
    canvas.paste(logo, (x, y), logo)


def pill(draw, x, y, texto, f, pad=(22, 11), fondo=(255, 255, 255, 235), color=NAVY):
    tw = draw.textlength(texto, font=f)
    asc, desc = f.getmetrics()
    w, h = int(tw + pad[0] * 2), asc + desc + pad[1] * 2
    draw.rounded_rectangle((x, y, x + w, y + h), radius=h // 2, fill=fondo)
    draw.text((x + pad[0], y + pad[1]), texto, font=f, fill=color)
    return w, h


def tarjeta_metrica(canvas, x, y, w, h, numero, etiqueta, fn, fl, radio=22, alpha=170):
    capa = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(capa)
    d.rounded_rectangle((x, y, x + w, y + h), radius=radio, fill=(*NAVY, alpha), outline=(255, 255, 255, 70), width=2)
    canvas.paste(Image.alpha_composite(canvas.convert("RGBA"), capa).convert("RGB"))
    dr = ImageDraw.Draw(canvas)
    pad = int(h * 0.12)
    dr.text((x + pad + 4, y + pad - 2), numero, font=fn, fill=GREEN)
    asc, desc = fn.getmetrics()
    dr.multiline_text((x + pad + 4, y + pad + asc + 6), etiqueta, font=fl, fill=WHITE, spacing=3)


def titulo(draw, x, y, lineas, f, interlineado=1.08, color=WHITE):
    asc, desc = f.getmetrics()
    lh = int((asc + desc) * interlineado)
    for i, l in enumerate(lineas):
        draw.text((x, y + i * lh), l, font=f, fill=color)
    return y + lh * len(lineas)


# ---------------------------------------------------------------- 1200x630 (vista previa de enlaces)
def og(d, metricas):
    W, H = 1200, 630
    c = foto_recortada(W, H, 0.62, 0.0)
    c = degradado(c, "izquierda", 0, 0.78, 215, curva=1.1)
    c = degradado(c, "abajo", 0.35, 1.0, 235)
    insignia(c, 44, 38, 150)
    dr = ImageDraw.Draw(c, "RGBA")
    f = font(22, 700)
    tw = dr.textlength(fecha_periodo(d), font=f)
    pill(dr, int(W - 44 - tw - 44), 52, fecha_periodo(d), f)
    titulo(dr, 48, 232, ["REPORTE DE", "IMPACTO"], font(88))
    mw, mh, gap, y = 265, 132, 17, H - 44 - 132
    for i, (n, e) in enumerate(metricas):
        tarjeta_metrica(c, 44 + i * (mw + gap), y, mw, mh, n, e, font(50), font(18, 600))
    return c


# ---------------------------------------------------------------- Instagram feed 4:5 (1080x1350)
def feed(d, metricas, W=1080, H=1350):
    foto_h = 600
    c = Image.new("RGB", (W, H), NAVY)
    c.paste(foto_recortada(W, foto_h, 0.62, 0.0), (0, 0))
    fade = Image.new("L", (W, foto_h), 0)
    px = fade.load()
    for y in range(foto_h):
        t = max((y / foto_h - 0.5) / 0.5, 0)
        v = int(255 * min(t, 1) ** 1.3)
        for x in range(W):
            px[x, y] = v
    c.paste(Image.new("RGB", (W, foto_h), NAVY), (0, 0), fade)
    insignia(c, 48, 44, 190)
    dr = ImageDraw.Draw(c, "RGBA")
    f = font(28, 700)
    tw = dr.textlength(fecha_periodo(d), font=f)
    pill(dr, int(W - 48 - tw - 44), 64, fecha_periodo(d), f)
    y = titulo(dr, 56, 520, ["REPORTE DE", "IMPACTO"], font(104), 1.04)
    dr.text((58, y + 6), "Un año ayudando a la naturaleza a sanar", font=font(32, 600), fill=(210, 224, 234))
    gap, mh = 20, 190
    mw = (W - 56 * 2 - gap) // 2
    top = y + 76
    for i, (n, e) in enumerate(metricas):
        tarjeta_metrica(c, 56 + (i % 2) * (mw + gap), top + (i // 2) * (mh + gap), mw, mh, n, e, font(66), font(25, 600), radio=26, alpha=150)
    ImageDraw.Draw(c).text((W // 2, H - 44), "livlin.cl/impacto", font=font(30, 700), fill=GREEN, anchor="mm")
    return c


# ---------------------------------------------------------------- Instagram cuadrado (1080x1080)
def cuadrado(d, metricas, W=1080, H=1080):
    c = foto_recortada(W, H, 0.62, 0.0)
    c = degradado(c, "abajo", 0.22, 0.78, 245, curva=1.15)
    insignia(c, 44, 40, 160)
    dr = ImageDraw.Draw(c, "RGBA")
    f = font(26, 700)
    tw = dr.textlength(fecha_periodo(d), font=f)
    pill(dr, int(W - 44 - tw - 44), 56, fecha_periodo(d), f)
    y = titulo(dr, 50, 372, ["REPORTE DE", "IMPACTO"], font(96), 1.04)
    gap, mh = 18, 140
    mw = (W - 50 * 2 - gap) // 2
    top = y + 34
    for i, (n, e) in enumerate(metricas):
        tarjeta_metrica(c, 50 + (i % 2) * (mw + gap), top + (i // 2) * (mh + gap), mw, mh, n, e.replace(chr(10), " "), font(52), font(22, 600), radio=24, alpha=150)
    ImageDraw.Draw(c).text((W // 2, H - 34), "livlin.cl/impacto", font=font(28, 700), fill=GREEN, anchor="mm")
    return c


# ---------------------------------------------------------------- Historia / Reel 9:16 (1080x1920)
def story(d, metricas, W=1080, H=1920):
    c = foto_recortada(W, H, 0.64, 0.0)
    c = degradado(c, "abajo", 0.30, 0.80, 245, curva=1.2)
    insignia(c, 48, 250, 210)  # fuera de la zona superior de la interfaz de Instagram
    dr = ImageDraw.Draw(c, "RGBA")
    pill(dr, 48, 490, fecha_periodo(d), font(30, 700))
    y = titulo(dr, 52, 880, ["REPORTE DE", "IMPACTO"], font(120), 1.03)
    gap, mh = 20, 200
    mw = (W - 52 * 2 - gap) // 2
    top = y + 40
    for i, (n, e) in enumerate(metricas):
        tarjeta_metrica(c, 52 + (i % 2) * (mw + gap), top + (i // 2) * (mh + gap), mw, mh, n, e, font(70), font(27, 600), radio=28, alpha=150)
    ImageDraw.Draw(c).text((W // 2, top + 2 * mh + gap + 70), "livlin.cl/impacto", font=font(36, 700), fill=GREEN, anchor="mm")
    return c


def guardar(img, ruta, calidad=84):
    ruta.parent.mkdir(parents=True, exist_ok=True)
    img.save(ruta, "JPEG", quality=calidad, optimize=True, progressive=True)
    print(f"{ruta.relative_to(ROOT)}  {img.size[0]}x{img.size[1]}  {ruta.stat().st_size // 1024} KB")


def main():
    d, metricas = cargar_datos()
    img = og(d, metricas)
    guardar(img, OUT_OG / "og-impacto.jpg", 82)
    for sub in ("en", "da", "zh"):
        (OUT_OG / sub).mkdir(parents=True, exist_ok=True)
        shutil.copyfile(OUT_OG / "og-impacto.jpg", OUT_OG / sub / "og-impacto.jpg")
    guardar(feed(d, metricas), OUT_SHARE / "impacto-instagram-feed.jpg")
    guardar(cuadrado(d, metricas), OUT_SHARE / "impacto-instagram-cuadrado.jpg")
    guardar(story(d, metricas), OUT_SHARE / "impacto-instagram-story.jpg")


if __name__ == "__main__":
    main()
