/**
 * analitica.js — LivLin · analítica respetuosa de la privacidad (GoatCounter: sin cookies, sin datos personales).
 *
 * ESTADO: preparada, aún inactiva. Para activarla:
 *   1. Crea una cuenta gratuita en https://www.goatcounter.com (elige un código, por ejemplo "livlin").
 *   2. Escribe ese código en CODIGO, aquí abajo, y publica.
 * Mide visitas por página y los clics importantes (WhatsApp, agenda, descargas, resumen del reporte, filtros del gestor de trabajos).
 */
(function () {
  'use strict';
  var CODIGO = ''; // ← código de GoatCounter, ej.: 'livlin'
  if (!CODIGO) return;
  if (navigator.doNotTrack === '1' || window.doNotTrack === '1') return; // respeta «no rastrear»

  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://gc.zgo.at/count.js';
  s.setAttribute('data-goatcounter', 'https://' + CODIGO + '.goatcounter.com/count');
  document.head.appendChild(s);

  function evento(nombre) {
    if (window.goatcounter && window.goatcounter.count) {
      window.goatcounter.count({ path: 'evento/' + nombre, title: nombre, event: true });
    }
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a,button');
    if (!a) return;
    var href = a.getAttribute('href') || '';
    if (/wa\.me/.test(href)) evento('clic-whatsapp');
    else if (/calendly/i.test(a.getAttribute('onclick') || '') || a.classList.contains('calendly-float') || a.classList.contains('hero-btn--main')) evento('clic-agenda');
    else if (/drive\.google|\.pdf/i.test(href)) evento('descarga-recurso');
    else if (/impacto-resumen/.test(href)) evento('ver-resumen-impacto');
    else if (/doi\.org|permacultureprinciples/.test(href)) evento('ver-referencia');
    else if (a.id === 'res-imprimir') evento('imprimir-resumen');
    else if (a.classList.contains('gt-chip') || a.classList.contains('fchip')) evento('uso-filtros');
  });
})();
