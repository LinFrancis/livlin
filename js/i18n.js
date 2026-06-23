// ============================================================
// LivLin · i18n runtime
//   - Detección de idioma del navegador (primera visita)
//   - Persistencia de la preferencia (localStorage)
//   - Prioriza la elección manual sobre el navegador
//   - El selector ya viene renderizado por el build; aquí solo
//     guardamos la preferencia al hacer clic.
// Funciona 100% estático (GitHub Pages). Sin dependencias.
// ============================================================
(function () {
  'use strict';
  var STORE = 'livlin_lang';
  var langs = window.LIVLIN_LANGS || [{ code: 'es', dir: '' }];
  var current = window.LIVLIN_LANG || 'es';
  var codes = langs.map(function (l) { return l.code; });
  var dirByCode = {};
  langs.forEach(function (l) { dirByCode[l.code] = l.dir; });

  // pageRel = ruta de la página sin el prefijo de idioma (ej. "/servicios/x.html")
  function pageRelFromPath(path) {
    var dir = dirByCode[current];
    if (dir) {
      var pfx = '/' + dir;
      if (path === pfx) return '/';
      if (path.indexOf(pfx + '/') === 0) return path.slice(pfx.length);
    }
    return path || '/';
  }

  function urlForLang(code, pageRel) {
    var dir = dirByCode[code] || '';
    var prefix = dir ? '/' + dir : '';
    var rel = pageRel === '/' ? '/' : pageRel;
    return prefix + rel + window.location.search + window.location.hash;
  }

  function detectBrowserLang() {
    var navs = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || ''];
    for (var i = 0; i < navs.length; i++) {
      var l = (navs[i] || '').toLowerCase();
      if (l.indexOf('zh') === 0) return codes.indexOf('zh-CN') >= 0 ? 'zh-CN' : null;
      if (l.indexOf('da') === 0) return codes.indexOf('da') >= 0 ? 'da' : null;
      if (l.indexOf('en') === 0) return codes.indexOf('en') >= 0 ? 'en' : null;
      if (l.indexOf('es') === 0) return 'es';
    }
    return null;
  }

  var pageRel = pageRelFromPath(window.location.pathname);

  // Dropdown compacto: toggle y persistencia de idioma
  var sw = document.querySelector('[data-lang-switch]');
  if (sw) {
    var btn = sw.querySelector('.nav-lang-btn');
    if (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var open = sw.hasAttribute('open');
        if (open) { sw.removeAttribute('open'); btn.setAttribute('aria-expanded', 'false'); }
        else { sw.setAttribute('open', ''); btn.setAttribute('aria-expanded', 'true'); }
      });
    }
    sw.addEventListener('click', function (e) {
      var a = e.target.closest('a[data-lang]');
      if (a) {
        try { localStorage.setItem(STORE, a.getAttribute('data-lang')); } catch (err) {}
        sw.removeAttribute('open');
        if (btn) btn.setAttribute('aria-expanded', 'false');
      }
    });
    document.addEventListener('click', function (e) {
      if (!sw.contains(e.target)) { sw.removeAttribute('open'); if (btn) btn.setAttribute('aria-expanded', 'false'); }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { sw.removeAttribute('open'); if (btn) btn.setAttribute('aria-expanded', 'false'); }
    });
  }

  // Redirección: preferencia guardada (manual) tiene prioridad
  var pref = null;
  try { pref = localStorage.getItem(STORE); } catch (err) {}

  if (pref && codes.indexOf(pref) >= 0) {
    if (pref !== current) { window.location.replace(urlForLang(pref, pageRel)); return; }
  } else {
    // Primera visita: detectar idioma del navegador una sola vez
    var done;
    try { done = sessionStorage.getItem('livlin_autodetect'); } catch (err) {}
    if (!done) {
      try { sessionStorage.setItem('livlin_autodetect', '1'); } catch (err) {}
      var detected = detectBrowserLang() || 'es';
      if (detected !== current) { window.location.replace(urlForLang(detected, pageRel)); return; }
    }
  }
})();
