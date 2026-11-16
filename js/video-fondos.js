/* Videos de fondo: se cargan y se reproducen solo cuando están a la vista, y se detienen al salir.
   Con «reducir movimiento» o ahorro de datos se ve solo la imagen de portada. */
(function () {
  var videos = Array.prototype.slice.call(document.querySelectorAll('.vfondo video[data-src]'));
  if (!videos.length) return;
  var quieto = (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) ||
               (navigator.connection && navigator.connection.saveData);
  if (quieto || !('IntersectionObserver' in window)) return;

  function reproducir(v) {
    if (getComputedStyle(v).display === 'none') return;
    if (!v.getAttribute('src')) { v.src = v.getAttribute('data-src'); }
    var p = v.play(); if (p && p.catch) p.catch(function () {});
  }
  videos.forEach(function (v) {
    v.muted = true;
    v.addEventListener('ended', function () {            // repite con un fundido suave
      v.classList.add('vfade');
      setTimeout(function () { v.currentTime = 0; reproducir(v); v.classList.remove('vfade'); }, 380);
    });
  });
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      var v = e.target;
      if (e.isIntersecting) reproducir(v); else if (v.getAttribute('src')) v.pause();
    });
  }, { rootMargin: '150px 0px', threshold: 0.05 });
  videos.forEach(function (v) { io.observe(v); });
})();

/* Modelo 3D de fondo (Inicio): se carga al llegar; gira solo; «tocar para girar» activa el mouse o el dedo. */
(function () {
  var cont = document.querySelector('.dim3d-visor');
  if (!cont) return;
  var fr = cont.querySelector('iframe'), btn = cont.querySelector('.dim3d-activar');
  var quieto = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function cargar() { if (fr.getAttribute('src')) return; var u = fr.getAttribute('data-visor'); if (window.innerWidth <= 820) u = u.replace('zoom=0.85', 'zoom=1.15'); fr.src = u + (quieto ? '&giro=0' : '');
    fr.addEventListener('load', function () {            // el visor aparece sobre la imagen fija solo cuando ya dibujó el modelo
      var t0 = Date.now();
      (function esperar() {
        var ok = false; try { ok = fr.contentDocument && fr.contentDocument.documentElement.getAttribute('data-listo') === '1'; } catch (e) {}
        if (ok) { setTimeout(function () { cont.classList.add('listo'); }, 400); }
        else if (Date.now() - t0 < 20000) setTimeout(esperar, 400);
      })();
    }); }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { cargar(); io.disconnect(); } }, { rootMargin: '300px 0px' });
    io.observe(cont);
  } else cargar();
  function salir() { cont.classList.remove('activo'); btn.setAttribute('aria-pressed', 'false'); }
  btn.addEventListener('click', function () { if (cont.classList.contains('activo')) salir(); else { cargar(); cont.classList.add('activo'); btn.setAttribute('aria-pressed', 'true'); } });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') salir(); });
})();
