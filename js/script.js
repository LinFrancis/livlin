/**
 * script.js — Livlin · funciones globales para todas las páginas
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

  // --- Fade-in con IntersectionObserver ---
  const fadeItems = document.querySelectorAll('.fade-in');
  if (!('IntersectionObserver' in window)) {
    fadeItems.forEach(el => el.classList.add('visible'));
  } else {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    fadeItems.forEach(el => io.observe(el));
  }

})();
