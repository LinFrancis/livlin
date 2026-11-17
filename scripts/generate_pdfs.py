#!/usr/bin/env python3
"""PDF de imprenta (600 dpi, tamano exacto, sin sangrado) de tarjeta (4 tamanos) y flyer."""
import os, sys, io
os.environ["LIVLIN_DPI"] = "600"
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
import img2pdf
import generate_tarjetas as gt
import generate_flyer as gf

def to_pdf(img, path, w_mm, h_mm, title):
    buf = io.BytesIO(); img.save(buf, "PNG", dpi=(gt.DPI, gt.DPI)); 
    lay = img2pdf.get_layout_fun((img2pdf.mm_to_pt(w_mm), img2pdf.mm_to_pt(h_mm)))
    path.write_bytes(img2pdf.convert(buf.getvalue(), layout_fun=lay, title=title, author="LivLin"))
    print(path.name, img.size, path.stat().st_size // 1024, "KB")

def main():
    assert gt.DPI == 600
    for w, h in gt.SIZES_MM:
        img, _ = gt.build_mural(w, h)
        to_pdf(img.convert("RGB"), gt.OUT_DIR / f"tarjeta-livlin-{w}x{h}.pdf", w, h, f"Tarjeta LivLin {w}x{h} mm")
    to_pdf(gf.build(), gf.OUT_DIR / "flyer-livlin-10x14.pdf", 100, 140, "Flyer LivLin 10x14 cm")

if __name__ == "__main__":
    main()
