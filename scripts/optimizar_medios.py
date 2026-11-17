#!/usr/bin/env python3
"""
Optimiza las imágenes y los videos que usa el sitio (menos peso, misma calidad visible).

    python scripts/optimizar_medios.py imagenes   # PNG/JPG pesados -> WebP (actualiza las referencias en src, js y css)
    python scripts/optimizar_medios.py videos     # MP4 pesados -> H.264 1280 px, CRF 29 (reemplaza el archivo)

Después de «imagenes» hay que reconstruir: node build.mjs
Los originales no se borran aquí; quedan en el historial de git.
"""
import glob
import json
import os
import re
import subprocess
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
os.chdir(ROOT)
TEXTOS = glob.glob("src/**/*.html", recursive=True) + glob.glob("js/*.js") + glob.glob("css/*.css")
REF = re.compile(r"""(?<![\w\-])(?:\.\./|/)*((?:images|videos)/[^"'()<>\\\n]+?\.(?:png|jpe?g|mp4))""", re.I)
UMBRAL_IMG = 250 * 1024
UMBRAL_VIDEO = 6 * 1024 * 1024
EXCLUIR = ("images/og/", "images/compartir/", "images/icons/", "images/flyers/", "images/tarjetas/")


def referencias():
    refs = {}
    for f in TEXTOS:
        t = open(f, encoding="utf-8", errors="ignore").read()
        for m in REF.finditer(t):
            refs.setdefault(m.group(1), set()).add(f)
    return refs


def archivo(ref):
    return ref.replace("%20", " ")


def imagenes():
    refs = referencias()
    cambios = {}
    ahorro = 0
    for ref in sorted(refs):
        if not ref.lower().endswith((".png", ".jpg", ".jpeg")) or ref.startswith(EXCLUIR):
            continue
        p = archivo(ref)
        if not os.path.exists(p) or os.path.getsize(p) < UMBRAL_IMG:
            continue
        destino = os.path.splitext(p)[0] + ".webp"
        im = Image.open(p)
        maxlado = 700 if "logo_livlin_with_text.png" in p else 2000
        im.thumbnail((maxlado, maxlado), Image.LANCZOS)
        if im.mode not in ("RGB", "RGBA"):
            im = im.convert("RGBA" if "transparency" in im.info else "RGB")
        im.save(destino, "WEBP", quality=82, method=6)
        antes, despues = os.path.getsize(p), os.path.getsize(destino)
        if despues >= antes * 0.9:
            os.remove(destino)
            continue
        nuevo_ref = os.path.splitext(ref)[0] + ".webp"
        cambios[ref] = nuevo_ref
        ahorro += antes - despues
        print(f"{antes // 1024:6d} KB -> {despues // 1024:5d} KB  {p}")
    # reescribir referencias
    for f in TEXTOS:
        t = open(f, encoding="utf-8", errors="ignore", newline="").read()
        o = t
        for ref, nuevo in cambios.items():
            t = t.replace(ref, nuevo)
        if t != o:
            open(f, "w", encoding="utf-8", newline="").write(t)
    json.dump(cambios, open("scripts/_cambios_imagenes.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"\n{len(cambios)} imágenes convertidas, ahorro ~ {ahorro // 1048576} MB")


def videos():
    refs = referencias()
    total = 0
    for ref in sorted(refs):
        if not ref.lower().endswith(".mp4"):
            continue
        p = archivo(ref)
        if not os.path.exists(p) or os.path.getsize(p) < UMBRAL_VIDEO:
            continue
        tmp = p + ".tmp.mp4"
        cmd = ["ffmpeg", "-y", "-loglevel", "error", "-i", p, "-vf", "scale='min(1280,iw)':-2", "-c:v", "libx264",
               "-preset", "veryfast", "-crf", "29", "-pix_fmt", "yuv420p", "-movflags", "+faststart",
               "-c:a", "aac", "-b:a", "96k", tmp]
        subprocess.run(cmd, check=True)
        antes, despues = os.path.getsize(p), os.path.getsize(tmp)
        if despues < antes * 0.75:
            os.replace(tmp, p)
            total += antes - despues
            print(f"{antes // 1048576:4d} MB -> {despues // 1048576:3d} MB  {p}")
        else:
            os.remove(tmp)
            print(f"(sin cambio) {p}")
    print(f"\nahorro en videos ~ {total // 1048576} MB")


if __name__ == "__main__":
    {"imagenes": imagenes, "videos": videos}[sys.argv[1]]()
