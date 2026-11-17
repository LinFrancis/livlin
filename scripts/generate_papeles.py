#!/usr/bin/env python3
"""
Genera las texturas de papel (tiles sin costura de 512 px) que usa el
simulador de tarjetas de la pagina de contacto.

    images/tarjetas/papel-kraft.jpg     kraft reciclado (fibras + motas)
    images/tarjetas/papel-opalina.jpg   opalina lisa (blanco calido, grano fino)
    images/tarjetas/papel-hilada.jpg    opalina hilada (verjurado + corondeles)

Uso:
    python scripts/generate_papeles.py
"""

from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "images/tarjetas"
N = 512
rng = np.random.default_rng(7)


def periodic_noise(sigma):
    """Ruido gaussiano filtrado en frecuencia: tilea sin costuras. Rango ~[-1, 1]."""
    n = rng.standard_normal((N, N))
    f = np.fft.fft2(n)
    fy = np.fft.fftfreq(N)[:, None]
    fx = np.fft.fftfreq(N)[None, :]
    g = np.exp(-(2 * np.pi ** 2) * (sigma ** 2) * (fx ** 2 + fy ** 2))
    out = np.real(np.fft.ifft2(f * g))
    return out / (np.abs(out).max() + 1e-9)


def to_img(rgb):
    return Image.fromarray(np.clip(rgb, 0, 255).astype(np.uint8), "RGB")


def draw_wrapped(draw_fn):
    """Dibuja en un lienzo 3x3 y recorta el centro para que los trazos hagan wrap."""
    big = Image.new("L", (N * 3, N * 3), 0)
    d = ImageDraw.Draw(big)
    draw_fn(d)
    big = big.filter(ImageFilter.GaussianBlur(0.6))
    c = big.crop((N, N, N * 2, N * 2))
    arr = np.asarray(c, dtype=np.float64) / 255.0
    # sumar los bordes envueltos
    ba = np.asarray(big, dtype=np.float64) / 255.0
    out = np.zeros((N, N))
    for dy in range(3):
        for dx in range(3):
            out = np.maximum(out, ba[dy * N:(dy + 1) * N, dx * N:(dx + 1) * N])
    return out


def kraft():
    base = np.array([178, 148, 112], dtype=np.float64)
    lum = (
        1
        + 0.050 * periodic_noise(40)
        + 0.035 * periodic_noise(9)
        + 0.045 * periodic_noise(1.2)
    )
    img = base[None, None, :] * lum[:, :, None]

    def fibers(sign):
        def fn(d):
            for _ in range(900):
                x, y = rng.uniform(0, N * 3), rng.uniform(0, N * 3)
                ang = rng.uniform(0, np.pi)
                ln = rng.uniform(8, 34)
                pts = [(x, y)]
                for i in range(1, 5):
                    ang += rng.normal(0, 0.25)
                    x += np.cos(ang) * ln / 4
                    y += np.sin(ang) * ln / 4
                    pts.append((x, y))
                d.line(pts, fill=int(rng.uniform(90, 200)), width=1)
        return draw_wrapped(fn)

    light = fibers(1)
    dark = fibers(-1)
    img = img * (1 + 0.10 * light[:, :, None]) * (1 - 0.13 * dark[:, :, None])

    # motas oscuras tipicas del papel reciclado
    def specks(d):
        for _ in range(240):
            x, y = rng.uniform(0, N * 3), rng.uniform(0, N * 3)
            r = rng.choice([0.7, 1.0, 1.4, 2.0], p=[0.45, 0.32, 0.18, 0.05])
            d.ellipse([x - r, y - r, x + r, y + r], fill=int(rng.uniform(120, 255)))
    sp = draw_wrapped(specks)
    img = img * (1 - 0.30 * sp[:, :, None]) + np.array([0, 0, 0]) * 0
    return to_img(img)


def opalina():
    base = np.array([246, 242, 232], dtype=np.float64)
    lum = 1 + 0.010 * periodic_noise(30) + 0.018 * periodic_noise(0.9)
    return to_img(base[None, None, :] * lum[:, :, None])


def hilada():
    base = np.array([246, 242, 232], dtype=np.float64)
    lum = 1 + 0.010 * periodic_noise(30) + 0.016 * periodic_noise(0.9)
    # verjurado: lineas horizontales finas cada 4 px, con variacion suave
    y = np.arange(N)[:, None]
    laid = (np.sin(2 * np.pi * y / 4.0) * 0.5 + 0.5)
    laid = laid * (0.75 + 0.25 * periodic_noise(25))
    # corondeles: bandas verticales mas claras/oscuras cada 128 px
    x = np.arange(N)[None, :]
    chain = np.exp(-(((x % 128) - 64) ** 2) / (2 * 1.6 ** 2))
    lum = lum - 0.038 * laid + 0.020 * chain
    return to_img(base[None, None, :] * lum[:, :, None])


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for name, fn in (("kraft", kraft), ("opalina", opalina), ("hilada", hilada)):
        p = OUT / f"papel-{name}.jpg"
        fn().save(p, "JPEG", quality=88, optimize=True)
        print(p.relative_to(ROOT), p.stat().st_size // 1024, "KB")


if __name__ == "__main__":
    main()
