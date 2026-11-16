/* Pestañas de «Plan maestro en acción» (Inicio): Huerta, Jardín medicinal, Compostera. */
(function () {
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.cx-tabs [role="tab"]'));
  if (!tabs.length) return;
  function activar(t, foco) {
    tabs.forEach(function (b) {
      var on = b === t;
      b.setAttribute('aria-selected', on ? 'true' : 'false');
      b.tabIndex = on ? 0 : -1;
      var p = document.getElementById(b.getAttribute('aria-controls'));
      if (p) p.hidden = !on;
    });
    if (foco) t.focus();
  }
  tabs.forEach(function (b, i) {
    b.addEventListener('click', function () { activar(b, false); });
    b.addEventListener('keydown', function (e) {
      var j = e.key === 'ArrowRight' ? (i + 1) % tabs.length : e.key === 'ArrowLeft' ? (i - 1 + tabs.length) % tabs.length : -1;
      if (j >= 0) { e.preventDefault(); activar(tabs[j], true); }
    });
  });
})();
