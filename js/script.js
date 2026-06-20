/**
 * script.js v4 — Livlin · funciones globales para todas las páginas
 */
(function () {
  'use strict';

  // --- Navbar: transparente en el tope, sólido al hacer scroll ---
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
    navLinks.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        toggle.classList.remove('active');
        navLinks.classList.remove('active');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // --- Fade-in — progressive enhancement ---
  // Primero marcamos como visibles los elementos YA en el viewport,
  // LUEGO activamos el sistema de ocultamiento. Así el contenido
  // nunca queda invisible si JS es lento o falla.
  var fadeItems = Array.from(document.querySelectorAll('.fade-in'));
  if (!fadeItems.length) return;

  var vh = window.innerHeight || document.documentElement.clientHeight;

  // Marcar visibles los que ya están en pantalla
  fadeItems.forEach(function (el) {
    var rect = el.getBoundingClientRect();
    if (rect.top < vh + 80) {
      el.classList.add('visible');
    }
  });

  // Ahora sí activar ocultamiento para los que vienen al hacer scroll
  document.documentElement.classList.add('js-ready');

  // Observar los que aún no son visibles
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
