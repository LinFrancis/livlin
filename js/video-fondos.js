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
