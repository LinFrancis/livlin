// Código compartido por los visores 3D (componentes/visor_3d y componentes/editor_3d).
// ESTE es el original: `python tools/sync_comun3d.py` lo copia a cada componente (cada uno se sirve desde su propia carpeta),
// y tests/test_js.py comprueba que las copias sean idénticas.
const Comun3D = (() => {
  let semilla = 7;
  const fijarSemilla = (n) => { semilla = n; };
  const azar = () => { semilla = (semilla * 16807) % 2147483647; return (semilla - 1) / 2147483646; };
  const lienzo = (n) => { const c = document.createElement("canvas"); c.width = c.height = n; return c; };
  function comoTextura(c, repetir = true) { const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 8; if (repetir) t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; }

  // textura de madera hecha por código (veta, anillos, nudos y grano); la `variante` cambia el tono y la veta
  function texMadera(variante) {
    const n = 512, c = lienzo(n), g = c.getContext("2d"); g.fillStyle = ["#e9dcc6", "#e4d2b6", "#eddfca"][variante % 3]; g.fillRect(0, 0, n, n);
    for (let y = 0; y < n; y += 1) { const o = Math.sin(y * 0.11 + variante) * 0.5 + Math.sin(y * 0.037 + 1.3) * 0.7 + Math.sin(y * 0.29) * 0.18; g.fillStyle = `rgba(110,70,35,${(0.05 + 0.11 * Math.max(0, o)).toFixed(3)})`; g.fillRect(0, y, n, 1); }
    for (let k = 0; k < 150; k++) { const y0 = azar() * n, amp = 1 + azar() * 4, f = 0.01 + azar() * 0.03, ph = azar() * 6.28; g.strokeStyle = `rgba(95,58,28,${(0.05 + azar() * 0.13).toFixed(3)})`; g.lineWidth = 0.6 + azar() * 1.1; g.beginPath(); for (let x = 0; x <= n; x += 8) { const y = y0 + Math.sin(x * f + ph) * amp; x === 0 ? g.moveTo(x, y) : g.lineTo(x, y); } g.stroke(); }
    for (let k = 0; k < 2; k++) { const x = 60 + azar() * (n - 120), y = 60 + azar() * (n - 120), rx = 10 + azar() * 12; for (let r = 4; r > 0; r--) { g.strokeStyle = `rgba(80,45,20,${0.10 + 0.05 * r})`; g.lineWidth = 1.4; g.beginPath(); g.ellipse(x, y, rx * r / 2.2, rx * r / 5, 0, 0, 6.283); g.stroke(); } }
    for (let k = 0; k < 2500; k++) { g.fillStyle = `rgba(${azar() > 0.5 ? "255,250,240" : "70,40,15"},${(azar() * 0.06).toFixed(3)})`; g.fillRect(azar() * n, azar() * n, 1 + azar() * 2, 1); }
    return comoTextura(c);
  }

  // la veta corre a lo largo de la pieza
  function uvMadera(g) {
    g.computeBoundingBox(); const bb = g.boundingBox, d = [bb.max.x - bb.min.x, bb.max.y - bb.min.y, bb.max.z - bb.min.z], L = d.indexOf(Math.max(...d));
    const pos = g.attributes.position, nor = g.attributes.normal, uv = new Float32Array(pos.count * 2);
    for (let v = 0; v < pos.count; v++) {
      const p = [pos.getX(v), pos.getY(v), pos.getZ(v)], n = [Math.abs(nor.getX(v)), Math.abs(nor.getY(v)), Math.abs(nor.getZ(v))], dom = n.indexOf(Math.max(...n)); let u, w;
      if (dom === L) { const o = [0, 1, 2].filter((a) => a !== L); u = p[o[0]]; w = p[o[1]]; } else { const o = [0, 1, 2].filter((a) => a !== L && a !== dom)[0]; u = p[L]; w = p[o]; }
      uv[v * 2] = u / 300; uv[v * 2 + 1] = w / 300;
    }
    g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  }

  // cámara orbital: posición según ángulos y radio, y desplazamiento en el plano de la pantalla
  function posCam(camera, cam) {
    const s = Math.sin(cam.phi), c = Math.cos(cam.phi);
    camera.position.set(cam.t.x + cam.r * s * Math.cos(cam.theta), cam.t.y + cam.r * s * Math.sin(cam.theta), cam.t.z + cam.r * c); camera.lookAt(cam.t);
  }
  function panear(cam, camera, dx, dy) {
    const k = cam.r * 0.0016, der = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0), arr = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1);
    cam.t.addScaledVector(der, -dx * k).addScaledVector(arr, dy * k);
  }

  // pellizco con dos dedos para acercar o alejar: `alPellizcar(razon)` recibe distancia_anterior / distancia_nueva (menor que 1 = acercar)
  function tactil(canvas, alPellizcar) {
    const p = new Map(); let d0 = 0, activo = false, pell = false;
    const dist = () => { const [a, b] = [...p.values()]; return Math.hypot(a[0] - b[0], a[1] - b[1]); };
    canvas.addEventListener("pointerdown", (e) => { if (!p.size) pell = false; p.set(e.pointerId, [e.clientX, e.clientY]); if (p.size === 2) { activo = pell = true; d0 = dist(); } });
    canvas.addEventListener("pointermove", (e) => { if (!p.has(e.pointerId)) return; p.set(e.pointerId, [e.clientX, e.clientY]); if (p.size === 2 && d0 > 0) { const d = dist(); if (d > 0) alPellizcar(d0 / d); d0 = d; } });
    const fin = (e) => { p.delete(e.pointerId); if (p.size < 2) d0 = 0; if (!p.size) activo = false; };
    canvas.addEventListener("pointerup", fin); canvas.addEventListener("pointercancel", fin);
    return { activo: () => activo, huboPellizco: () => pell };
  }

  return { fijarSemilla, azar, lienzo, comoTextura, texMadera, uvMadera, posCam, panear, tactil };
})();
