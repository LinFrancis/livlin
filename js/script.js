/**
 * script.js v5 — Livlin · funciones globales para todas las páginas
 *  - Navbar scroll sync
 *  - Burger menu
 *  - Fade-in (progressive enhancement)
 *  - LivlinLightbox: visor de imágenes luminoso, agrupado por contexto
 */

/* ============================================================
   1. NAV + BURGER + FADE-IN
============================================================ */
(function () {
  'use strict';

  // --- Navbar: clase al hacer scroll ---
  const nav = document.querySelector('.navbar');
  if (nav) {
    function syncNav() {
      if (window.scrollY < 80) {
        nav.classList.add('is-top');
        nav.classList.remove('scrolled');
      } else {
        nav.classList.remove('is-top');
        nav.classList.add('scrolled');
      }
    }
    window.addEventListener('scroll', syncNav, { passive: true });
    syncNav();
  }

  // --- Burger menu (nav móvil) ---
  const toggle   = document.querySelector('.nav-toggle');
  const navLinks = document.getElementById('primary-nav');
  if (toggle && navLinks) {
    toggle.addEventListener('click', () => {
      const open = toggle.classList.toggle('active');
      navLinks.classList.toggle('active', open);
      toggle.setAttribute('aria-expanded', String(open));
    });

    // En móvil, el enlace padre de un dropdown despliega el submenú en vez de navegar
    navLinks.querySelectorAll('.nav-item-dropdown > a').forEach(a => {
      a.addEventListener('click', (e) => {
        if (window.innerWidth <= 900) {
          e.preventDefault();
          a.parentElement.classList.toggle('active');
        }
      });
    });

    // Cerrar el menú móvil al hacer click en cualquier enlace
    // (excepto el padre del dropdown, que solo despliega en móvil)
    navLinks.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        if (a.parentElement.classList.contains('nav-item-dropdown') && window.innerWidth <= 900) return;
        toggle.classList.remove('active');
        navLinks.classList.remove('active');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // --- Fade-in — progressive enhancement ---
  var fadeItems = Array.from(document.querySelectorAll('.fade-in'));
  if (!fadeItems.length) return;

  var vh = window.innerHeight || document.documentElement.clientHeight;
  fadeItems.forEach(function (el) {
    var rect = el.getBoundingClientRect();
    if (rect.top < vh + 80) el.classList.add('visible');
  });

  document.documentElement.classList.add('js-ready');

  var remaining = fadeItems.filter(function (el) {
    return !el.classList.contains('visible');
  });
  if (!remaining.length) return;

  if (!('IntersectionObserver' in window)) {
    remaining.forEach(function (el) { el.classList.add('visible'); });
    return;
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.05, rootMargin: '0px 0px -20px 0px' });

  remaining.forEach(function (el) { io.observe(el); });
})();


/* ============================================================
   2. LIGHTBOX GLOBAL — fondo claro, navegación por grupo
============================================================ */
window.LivlinLightbox = (function () {
  'use strict';

  var overlay, scrollEl, imgEl, capEl, infoEl, videoEl, prevBtn, nextBtn, closeBtn, counterEl;
  var items = [], idx = 0, meta = null;
  var savedScrollY = 0;

  function build() {
    if (overlay) return;
    overlay = document.createElement('div');
    overlay.className = 'lb-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.innerHTML =
      '<button class="lb-close" aria-label="Cerrar">&#10005;</button>' +
      '<button class="lb-nav lb-prev" aria-label="Anterior">&#8249;</button>' +
      '<button class="lb-nav lb-next" aria-label="Siguiente">&#8250;</button>' +
      '<div class="lb-scroll">' +
        '<div class="lb-stage">' +
          '<img class="lb-img" alt="">' +
          '<div class="lb-caption"></div>' +
          '<div class="lb-video"></div>' +
          '<div class="lb-info"></div>' +
        '</div>' +
      '</div>' +
      '<div class="lb-counter"></div>';
    document.body.appendChild(overlay);

    scrollEl  = overlay.querySelector('.lb-scroll');
    imgEl     = overlay.querySelector('.lb-img');
    capEl     = overlay.querySelector('.lb-caption');
    videoEl   = overlay.querySelector('.lb-video');
    infoEl    = overlay.querySelector('.lb-info');
    counterEl = overlay.querySelector('.lb-counter');
    closeBtn  = overlay.querySelector('.lb-close');
    prevBtn   = overlay.querySelector('.lb-prev');
    nextBtn   = overlay.querySelector('.lb-next');

    closeBtn.addEventListener('click', close);
    prevBtn.addEventListener('click', function (e) { e.stopPropagation(); go(-1); });
    nextBtn.addEventListener('click', function (e) { e.stopPropagation(); go(1); });
    // Cerrar al hacer click en el fondo (overlay o área de scroll vacía), no en el contenido
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay || e.target === scrollEl) close();
    });
    document.addEventListener('keydown', function (e) {
      if (!overlay.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === 'ArrowRight') go(1);
    });

    // swipe en touch (sobre la imagen)
    var sx = 0;
    imgEl.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
    imgEl.addEventListener('touchend', function (e) {
      var diff = sx - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) { diff > 0 ? go(1) : go(-1); }
    }, { passive: true });
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // Convierte una URL de post de Instagram en su iframe embebido
  function instagramEmbed(url) {
    var m = String(url).match(/instagram\.com\/(p|reel|tv)\/([^/?#]+)/i);
    if (!m) return '';
    var src = 'https://www.instagram.com/' + m[1] + '/' + m[2] + '/embed/captioned/';
    return '<iframe src="' + src + '" title="Video del proyecto" loading="lazy" ' +
           'frameborder="0" scrolling="no" allowtransparency="true" allowfullscreen></iframe>';
  }

  function renderImage() {
    var it = items[idx] || {};
    imgEl.src = it.src || '';
    imgEl.style.display = it.src ? 'block' : 'none';
    imgEl.alt = it.caption || (meta && meta.title) || '';
    capEl.textContent = it.caption || '';
    capEl.style.display = it.caption ? 'block' : 'none';

    var multi = items.length > 1;
    prevBtn.style.display = nextBtn.style.display = multi ? 'flex' : 'none';
    counterEl.style.display = multi ? 'block' : 'none';
    counterEl.textContent = (idx + 1) + ' / ' + items.length;
  }

  function renderMeta() {
    // Video embebido (si existe)
    var vhtml = (meta && meta.video) ? instagramEmbed(meta.video) : '';
    videoEl.innerHTML = vhtml;
    videoEl.style.display = vhtml ? 'block' : 'none';

    if (meta && (meta.title || meta.desc)) {
      var html = '';
      if (meta.title)    html += '<h4>' + esc(meta.title) + '</h4>';
      if (meta.location) html += '<span class="lb-loc">' + esc(meta.location) + '</span>';
      if (meta.desc)     html += '<p>' + esc(meta.desc) + '</p>';
      if (meta.tag)      html += '<span class="lb-tag">' + esc(meta.tag) + '</span>';
      infoEl.innerHTML = html;
      infoEl.style.display = 'block';
    } else {
      infoEl.innerHTML = '';
      infoEl.style.display = 'none';
    }
  }

  function go(d) { idx = (idx + d + items.length) % items.length; renderImage(); if (scrollEl) scrollEl.scrollTop = 0; }

  function open(list, start, m) {
    build();
    items = Array.isArray(list) ? list : [];
    idx = start || 0;
    meta = m || null;
    renderImage();
    renderMeta();
    overlay.classList.add('open');
    if (scrollEl) scrollEl.scrollTop = 0;
    // Bloqueo robusto del scroll de fondo (preserva la posición)
    savedScrollY = window.scrollY || window.pageYOffset || 0;
    document.body.style.top = '-' + savedScrollY + 'px';
    document.body.classList.add('lb-lock');
  }

  function close() {
    if (!overlay) return;
    overlay.classList.remove('open');
    document.body.classList.remove('lb-lock');
    document.body.style.top = '';
    window.scrollTo(0, savedScrollY);
    imgEl.src = '';
    videoEl.innerHTML = ''; // detiene la reproducción del video
  }

  return { open: open, close: close };
})();


/* ============================================================
   2b. TARJETAS DE PROYECTO (casos) — abren la experiencia completa
   Delegación global: cualquier .caso-card / .caso-clickable / .proj-card
   con data-* abre el visor con todas sus imágenes, texto y video.
============================================================ */
(function () {
  'use strict';
  function openProject(el) {
    var imgs;
    try { imgs = el.dataset.images ? JSON.parse(el.dataset.images) : null; }
    catch (e) { imgs = null; }
    if (!imgs || !imgs.length) imgs = el.dataset.img ? [el.dataset.img] : [];
    var items = imgs.filter(Boolean).map(function (src) { return { src: src }; });
    if (!window.LivlinLightbox) return;
    window.LivlinLightbox.open(items, 0, {
      title:    el.dataset.title,
      location: el.dataset.location,
      desc:     el.dataset.desc,
      tag:      el.dataset.service,
      video:    el.dataset.video
    });
  }
  document.addEventListener('click', function (e) {
    var el = e.target.closest('.caso-card, .caso-clickable, .proj-card');
    if (el && el.dataset && el.dataset.title) openProject(el);
  });
})();


/* ============================================================
   3. AUTO-WIRING de galerías genéricas
   Cualquier contenedor [data-gallery] agrupa sus <img>.
   Al hacer clic en una imagen, el visor navega SOLO dentro
   de ese grupo (nunca mezcla proyectos distintos).
============================================================ */
(function () {
  'use strict';
  function itemOf(img) {
    return {
      src: img.getAttribute('data-full') || img.src,
      caption: img.getAttribute('data-caption') || ''
    };
  }

  document.addEventListener('DOMContentLoaded', function () {
    // (a) Grupo compartido: las <img> de un mismo contenedor navegan juntas.
    document.querySelectorAll('[data-gallery]').forEach(function (container) {
      var imgs = Array.from(container.querySelectorAll('img'));
      if (!imgs.length) return;
      var items = imgs.map(itemOf);
      imgs.forEach(function (img, i) {
        img.classList.add('is-zoomable');
        img.addEventListener('click', function (e) {
          e.preventDefault();
          window.LivlinLightbox.open(items, i);
        });
      });
    });

    // (b) Solo: cada imagen abre su propio visor (nunca mezcla proyectos).
    document.querySelectorAll('[data-gallery-solo]').forEach(function (container) {
      Array.from(container.querySelectorAll('img')).forEach(function (img) {
        img.classList.add('is-zoomable');
        img.addEventListener('click', function (e) {
          e.preventDefault();
          window.LivlinLightbox.open([itemOf(img)], 0);
        });
      });
    });
  });
})();
