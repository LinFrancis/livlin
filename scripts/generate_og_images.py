#!/usr/bin/env python3
"""
Genera las imagenes Open Graph (OG) de livlin.cl para todos los idiomas.

El diseno replica las imagenes en espanol ya publicadas en images/og/*.jpg:
foto de fondo (images/people/francis_bancal_completo.jpg), degrade oscuro
abajo-izquierda para legibilidad, badge circular blanco con el logo arriba
a la izquierda, y titulo en mayusculas en Montserrat ExtraBold blanco
abajo a la izquierda.

Uso:
    python scripts/generate_og_images.py
"""

import json
import textwrap
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
BACKGROUND_PATH = ROOT / "images/people/francis_bancal_completo.jpg"
LOGO_PATH = ROOT / "images/ui/logo_livlin_with_text_circle.png"
FONT_LATIN_PATH = ROOT / "scripts/fonts/Montserrat-Variable.ttf"
FONT_CJK_PATH = ROOT / "scripts/fonts/NotoSansSC-Variable.ttf"
OG_DIR = ROOT / "images/og"

CANVAS_SIZE = (1200, 630)
BADGE_DIAMETER = 210
BADGE_MARGIN = 40
TEXT_MARGIN_X = 44
TEXT_MARGIN_BOTTOM = 46
TEXT_MAX_WIDTH = 760
LINE_SPACING = 1.12
FONT_SIZE_MAX = 78
FONT_SIZE_MIN = 40

# code usado para nombrar la carpeta de imagenes de cada idioma
LANG_DIRS = {
    "es": None,      # se queda en images/og/, no se toca
    "en": "en",
    "da": "da",
    "zh-CN": "zh",
}

# Paginas a generar: slug de salida -> clave(s) de texto en espanol.
# Para la mayoria de paginas el texto es el og:title sin el sufijo " · Livlin".
# La home usa el H1 de la pagina, que viene en dos lineas separadas.
PAGES = {
    "home": {"lines": ["SANAR", "NATURALEZA"]},
    "servicios": {"title": "Nuestros Servicios · Livlin"},
    "contacto": {"title": "Contacto · Conversemos tu proyecto · Livlin"},
    "conversacion-orientacion": {"title": "Conversación de Orientación Previa (Gratis) · Livlin"},
    "diseno-regenerativo": {"title": "Nutre tu Presente y Futuro · Diseño Regenerativo · Livlin"},
    "educacion-ambiental": {"title": "La Naturaleza se Comunica a Través de Patrones · Educación Ambiental · Livlin"},
    "facilitacion-organizacional": {"title": "Metodologías Participativas al Servicio de Propósitos Comunes · Facilitación Organizacional · Livlin"},
    "huerto-urbano": {"title": "Hagamos tu Huerta Realidad · Huerto Urbano · Livlin"},
    "monitoreo": {"title": "Monitoreo, Evaluación y Aprendizaje (MEL) · Livlin"},
    "soluciones-digitales": {"title": "Desarrollo de Soluciones Digitales · Livlin"},
    "visita-diagnostica": {"title": "Visita Diagnóstica + Habilitación Básica MEL · Livlin"},
}

SUFFIX = " · Livlin"


def load_locale(lang_code):
    if lang_code == "es":
        return {}
    path = ROOT / f"locales/{lang_code}.json"
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def translate(dictionary, spanish_text):
    return dictionary.get(spanish_text, spanish_text)


def lines_for_page(slug, page, lang_code, dictionary):
    """Devuelve la lista de lineas de texto (ya traducidas) para una pagina/idioma."""
    if "lines" in page:
        return [translate(dictionary, line) for line in page["lines"]]
    title = page["title"]
    if title.endswith(SUFFIX):
        title = title[: -len(SUFFIX)]
    translated = translate(dictionary, page["title"])
    if translated.endswith(SUFFIX):
        translated = translated[: -len(SUFFIX)]
    elif translated == page["title"]:
        # sin traduccion encontrada: usar el titulo en espanol ya sin sufijo
        translated = title
    return [translated]


def is_cjk(lang_code):
    return lang_code == "zh-CN"


def font_for(lang_code, size, weight=800):
    path = FONT_CJK_PATH if is_cjk(lang_code) else FONT_LATIN_PATH
    font = ImageFont.truetype(str(path), size)
    try:
        font.set_variation_by_axes([weight])
    except OSError:
        pass
    return font


def wrap_lines(draw, lines, lang_code, max_width):
    """Envuelve cada linea logica al ancho maximo, probando tamanos de fuente
    decrecientes hasta que todo el bloque de texto quepa."""
    for size in range(FONT_SIZE_MAX, FONT_SIZE_MIN - 1, -2):
        font = font_for(lang_code, size)
        wrapped = []
        ok = True
        for line in lines:
            line = line.upper() if not is_cjk(lang_code) else line
            if is_cjk(lang_code):
                # sin espacios: envolver por caracteres
                wrapped_line = _wrap_cjk(draw, line, font, max_width)
            else:
                wrapped_line = _wrap_words(draw, line, font, max_width)
            if wrapped_line is None:
                ok = False
                break
            wrapped.extend(wrapped_line)
        if ok and len(wrapped) <= 3:
            return wrapped, font, size
    return wrapped, font, size


def _wrap_words(draw, text, font, max_width):
    words = text.split()
    lines = []
    current = ""
    for word in words:
        candidate = f"{current} {word}".strip()
        if draw.textlength(candidate, font=font) <= max_width or not current:
            current = candidate
        else:
            lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def _wrap_cjk(draw, text, font, max_width):
    lines = []
    current = ""
    for ch in text:
        candidate = current + ch
        if draw.textlength(candidate, font=font) <= max_width or not current:
            current = candidate
        else:
            lines.append(current)
            current = ch
    if current:
        lines.append(current)
    return lines


def build_canvas(background):
    bg = background.convert("RGB")
    bg_ratio = bg.width / bg.height
    target_ratio = CANVAS_SIZE[0] / CANVAS_SIZE[1]
    if bg_ratio > target_ratio:
        new_height = CANVAS_SIZE[1]
        new_width = int(new_height * bg_ratio)
    else:
        new_width = CANVAS_SIZE[0]
        new_height = int(new_width / bg_ratio)
    bg = bg.resize((new_width, new_height), Image.LANCZOS)
    left = (new_width - CANVAS_SIZE[0]) // 2
    # anclar arriba: recortar el sobrante solo abajo para conservar el aire
    # original de la foto (evita cortar la parte de arriba, ej. el pelo)
    top = 0
    bg = bg.crop((left, top, left + CANVAS_SIZE[0], top + CANVAS_SIZE[1]))

    overlay = Image.new("L", CANVAS_SIZE, 0)
    odraw = ImageDraw.Draw(overlay)
    for y in range(CANVAS_SIZE[1]):
        # mas oscuro abajo, transparente arriba
        alpha = int(150 * (y / CANVAS_SIZE[1]) ** 1.6)
        odraw.line([(0, y), (CANVAS_SIZE[0], y)], fill=alpha)
    dark = Image.new("RGB", CANVAS_SIZE, (10, 20, 15))
    bg = Image.composite(dark, bg, overlay)
    return bg


def paste_badge(canvas, logo):
    badge = logo.convert("RGBA").resize((BADGE_DIAMETER, BADGE_DIAMETER), Image.LANCZOS)
    canvas.paste(badge, (BADGE_MARGIN, BADGE_MARGIN), badge)


def draw_title(canvas, lines, font, lang_code):
    draw = ImageDraw.Draw(canvas)
    ascent, descent = font.getmetrics()
    line_height = int((ascent + descent) * LINE_SPACING)
    total_height = line_height * len(lines)
    y = CANVAS_SIZE[1] - TEXT_MARGIN_BOTTOM - total_height
    for line in lines:
        draw.text((TEXT_MARGIN_X, y), line, font=font, fill=(255, 255, 255))
        y += line_height


def generate(slug, page, lang_code, dictionary):
    background = Image.open(BACKGROUND_PATH)
    logo = Image.open(LOGO_PATH)
    canvas = build_canvas(background)
    paste_badge(canvas, logo)

    draw = ImageDraw.Draw(canvas)
    lines = lines_for_page(slug, page, lang_code, dictionary)
    wrapped, font, size = wrap_lines(draw, lines, lang_code, TEXT_MAX_WIDTH)
    draw_title(canvas, wrapped, font, lang_code)

    subdir = LANG_DIRS[lang_code]
    out_dir = OG_DIR if subdir is None else OG_DIR / subdir
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / f"og-{slug}.jpg"
    canvas.save(out_path, "JPEG", quality=85, optimize=True)
    print(f"{out_path.relative_to(ROOT)}  ({out_path.stat().st_size // 1024} KB)")


def main():
    for lang_code in ("en", "da", "zh-CN"):
        dictionary = load_locale(lang_code)
        for slug, page in PAGES.items():
            generate(slug, page, lang_code, dictionary)


if __name__ == "__main__":
    main()
