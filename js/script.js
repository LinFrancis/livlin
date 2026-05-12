/* ==========================================================
   LIVLIN · script.js
   Multilingüe (?lang=en) - Mobile menu - Fade-in - Smooth scroll
   ========================================================== */

(function () {
  'use strict';

  /* ---------- 1. Multilingüe ---------- */
  const params = new URLSearchParams(window.location.search);
  const currentLang = params.get('lang') === 'en' ? 'en' : 'es';
  document.documentElement.lang = currentLang;

  function applyLanguage(lang) {
    document.querySelectorAll('[data-es]').forEach(el => {
      const text = el.getAttribute('data-' + lang);
      if (text !== null) el.innerHTML = text;
    });
    document.querySelectorAll('[data-es-attr]').forEach(el => {
      const attrs = el.getAttribute('data-' + lang + '-attr');
      if (!attrs) return;
      attrs.split('|').forEach(pair => {
        const [name, value] = pair.split('=');
        if (name && value !== undefined) el.setAttribute(name.trim(), value.trim());
      });
    });
    // Update document title if data attribute is present
    const titleEl = document.querySelector('title');
    if (titleEl && titleEl.getAttribute('data-' + lang)) {
      document.title = titleEl.getAttribute('data-' + lang);
    }
    // Update active button
    document.querySelectorAll('.lang-switch button').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });
  }

  function switchLanguage(lang) {
    const url = new URL(window.location);
    if (lang === 'en') {
      url.searchParams.set('lang', 'en');
    } else {
      url.searchParams.delete('lang');
    }
    window.history.replaceState({}, '', url);
    applyLanguage(lang);
  }

  document.addEventListener('DOMContentLoaded', () => {
    applyLanguage(currentLang);

    // Bind language switcher buttons
    document.querySelectorAll('.lang-switch button').forEach(btn => {
      btn.addEventListener('click', () => {
        switchLanguage(btn.dataset.lang);
      });
    });
  });

  /* ---------- 2. Sticky navbar shadow ---------- */
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    const onScroll = () => {
      navbar.classList.toggle('scrolled', window.scrollY > 16);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------- 3. Mobile menu ---------- */
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      navToggle.classList.toggle('active');
      navLinks.classList.toggle('active');
    });
    navLinks.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        navToggle.classList.remove('active');
        navLinks.classList.remove('active');
      });
    });
  }

  /* ---------- 4. Fade-in on scroll ---------- */
  const observerOptions = {
    threshold: 0.05,
    rootMargin: '0px 0px -20px 0px'
  };

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  function initFadeIn() {
    const fadeElements = document.querySelectorAll('.fade-in');
    fadeElements.forEach(el => {
      // If already in viewport, show immediately
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        el.classList.add('visible');
      } else {
        observer.observe(el);
      }
    });
  }

  // Initialize after a small delay to ensure layout is stable
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(initFadeIn, 100);
      setTimeout(() => document.querySelectorAll('.fade-in').forEach(el => el.classList.add('visible')), 800);
    });
  } else {
    setTimeout(initFadeIn, 100);
    setTimeout(() => document.querySelectorAll('.fade-in').forEach(el => el.classList.add('visible')), 800);
  }

  /* ---------- 5. Smooth scroll for anchor links ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const href = link.getAttribute('href');
      if (href === '#' || href.length < 2) return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        const top = target.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  /* ---------- 6. Año actual en footer ---------- */
  const yearEl = document.querySelector('[data-year]');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- 7. FAQ Accordion ---------- */
  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const isOpen = item.classList.contains('open');
      
      // Close all other FAQ items in the same list
      const list = item.closest('.faq-list');
      if (list) {
        list.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
      }
      
      if (!isOpen) item.classList.add('open');
    });
  });

  /* ---------- 8. Dropdown interaction ---------- */
  const dropdownToggles = document.querySelectorAll('.nav-item-dropdown > a');
  
  dropdownToggles.forEach(toggle => {
    toggle.addEventListener('click', (e) => {
      // Si estamos en mobile o tablet, el primer click abre el menú, no navega
      if (window.innerWidth <= 900) {
        const parent = toggle.parentElement;
        const menu = toggle.nextElementSibling;
        
        if (!parent.classList.contains('active')) {
          e.preventDefault();
          e.stopPropagation();
          
          // Cerrar otros
          document.querySelectorAll('.nav-item-dropdown').forEach(item => {
            if (item !== parent) item.classList.remove('active');
          });
          
          parent.classList.add('active');
        }
      }
    });
  });

  // Cerrar menú mobile al hacer click fuera
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.nav-item-dropdown')) {
      document.querySelectorAll('.nav-item-dropdown').forEach(item => {
        item.classList.remove('active');
      });
    }
  });

  /* ---------- 9. Image Lightbox ---------- */
  (function initLightbox() {
    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'lightbox-overlay';
    overlay.innerHTML = '<button class="lightbox-close" aria-label="Close">✕</button><img src="" alt="">';
    document.body.appendChild(overlay);

    const overlayImg = overlay.querySelector('img');
    const closeBtn = overlay.querySelector('.lightbox-close');

    function openLightbox(src, alt) {
      overlayImg.src = src;
      overlayImg.alt = alt || '';
      requestAnimationFrame(() => overlay.classList.add('active'));
      document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    }

    // Click on images to open
    const selectors = [
      '.tool-img-grid img',
      '.tool-mockup img',
      '.feature-image img',
      '.browser-mockup img',
      '.mel-example-card img',
      '.tool-featured-visual img',
      '.page-hero-image img',
      '.mockup img',
      'img[data-lightbox]'
    ];

    document.querySelectorAll(selectors.join(',')).forEach(img => {
      img.style.cursor = 'zoom-in';
      img.addEventListener('click', (e) => {
        e.stopPropagation();
        openLightbox(img.src, img.alt);
      });
    });

    // Close handlers
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay || e.target === closeBtn) closeLightbox();
    });
    closeBtn.addEventListener('click', closeLightbox);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeLightbox();
    });
  })();

  /* ---------- 10. Image Carousels ---------- */
  function initCarousels() {
    document.querySelectorAll('.carousel').forEach(carousel => {
      const track = carousel.querySelector('.carousel-track');
      const slides = carousel.querySelectorAll('.carousel-slide');
      const dotsWrap = carousel.querySelector('.carousel-dots');
      const prevBtn = carousel.querySelector('.carousel-arrow.prev');
      const nextBtn = carousel.querySelector('.carousel-arrow.next');
      if (!track || slides.length === 0) return;

      let current = 0;
      const total = slides.length;

      function goTo(index) {
        current = (index + total) % total;
        track.style.transform = 'translateX(-' + (current * 100) + '%)';
        if (dotsWrap) {
          dotsWrap.querySelectorAll('.carousel-dot').forEach((d, i) => {
            d.classList.toggle('active', i === current);
          });
        }
      }

      if (prevBtn) prevBtn.addEventListener('click', () => goTo(current - 1));
      if (nextBtn) nextBtn.addEventListener('click', () => goTo(current + 1));

      if (dotsWrap) {
        dotsWrap.querySelectorAll('.carousel-dot').forEach((dot, i) => {
          dot.addEventListener('click', () => goTo(i));
        });
      }

      // Touch/swipe support
      let startX = 0;
      let isDragging = false;
      track.addEventListener('touchstart', e => { startX = e.touches[0].clientX; isDragging = true; }, { passive: true });
      track.addEventListener('touchend', e => {
        if (!isDragging) return;
        isDragging = false;
        const diff = startX - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 40) {
          diff > 0 ? goTo(current + 1) : goTo(current - 1);
        }
      }, { passive: true });

      // Keyboard support
      carousel.setAttribute('tabindex', '0');
      carousel.addEventListener('keydown', e => {
        if (e.key === 'ArrowLeft') goTo(current - 1);
        if (e.key === 'ArrowRight') goTo(current + 1);
      });

      goTo(0);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCarousels);
  } else {
    initCarousels();
  }

  /* ---------- 11. Floating WhatsApp Button ---------- */
  (function injectWhatsApp() {
    var phone = '56967971910';
    var msg = encodeURIComponent('Hola Livlin, quiero más información sobre sus servicios.');
    var url = 'https://wa.me/' + phone + '?text=' + msg;

    var a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener';
    a.className = 'whatsapp-float';
    a.setAttribute('aria-label', 'Contactar por WhatsApp');
    a.innerHTML = '<span class="wa-pulse"></span><svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><path d="M16.004 2.667c-7.364 0-13.337 5.973-13.337 13.333 0 2.347.613 4.64 1.78 6.667L2.667 29.333l6.86-1.8A13.28 13.28 0 0016.004 29.333c7.36 0 13.329-5.973 13.329-13.333S23.364 2.667 16.004 2.667zm0 24.001a10.62 10.62 0 01-5.42-1.487l-.387-.233-4.067 1.067 1.08-3.96-.253-.4A10.58 10.58 0 015.333 16c0-5.88 4.787-10.667 10.671-10.667S26.667 10.12 26.667 16 21.888 26.668 16.004 26.668zm5.853-7.987c-.32-.16-1.893-.933-2.187-1.04-.293-.107-.507-.16-.72.16s-.827 1.04-1.013 1.253c-.187.213-.373.24-.693.08-.32-.16-1.353-.5-2.573-1.593-.953-.853-1.6-1.907-1.787-2.227-.187-.32-.02-.493.14-.653.147-.147.32-.387.48-.573.16-.187.213-.32.32-.533.107-.213.053-.4-.027-.56-.08-.16-.72-1.733-.987-2.373-.26-.627-.527-.54-.72-.547h-.613c-.213 0-.56.08-.853.4-.293.32-1.12 1.093-1.12 2.667s1.147 3.093 1.307 3.307c.16.213 2.253 3.44 5.46 4.827.76.333 1.36.527 1.827.673.767.24 1.467.207 2.02.127.613-.093 1.893-.773 2.16-1.52.267-.747.267-1.387.187-1.52-.08-.133-.293-.213-.613-.373z"/></svg>';

    document.body.appendChild(a);
  })();

})();
