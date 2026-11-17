#!/usr/bin/env python3
"""
Reemplaza las páginas antiguas en inglés, danés y chino (/en, /da, /zh) por redirecciones a la versión en español.
El sitio se publica solo en español (ver IDIOMAS_ACTIVOS en i18n.config.mjs); así los enlaces viejos no se rompen
y los buscadores no ven contenido duplicado y mezclado de idiomas.

    python scripts/redirecciones_idiomas.py
"""
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PLANTILLA = """<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LivLin</title>
  <meta name="robots" content="noindex, follow">
  <link rel="canonical" href="https://www.livlin.cl/{ruta}">
  <meta http-equiv="refresh" content="0; url=/{ruta}">
  <script>location.replace("/{ruta}" + location.search + location.hash);</script>
</head>
<body>
  <p>El sitio de LivLin está disponible en español: <a href="/{ruta}">continuar</a>.</p>
</body>
</html>
"""


def main():
    n = 0
    for lang in ("en", "da", "zh"):
        base = ROOT / lang
        if not base.exists():
            continue
        for f in base.rglob("*.html"):
            ruta = f.relative_to(base).as_posix()
            f.write_text(PLANTILLA.format(ruta=ruta), encoding="utf-8", newline="\n")
            n += 1
        shutil.rmtree(ROOT / "images" / "og" / lang, ignore_errors=True)
    print(f"{n} redirecciones escritas")


if __name__ == "__main__":
    main()
