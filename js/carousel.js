/**
 * carousel.js — Livlin Carrusel Regenerativo
 * Auto-play, flechas, dots, modal en click
 */
(function () {
  'use strict';

  const track = document.getElementById('carouselTrack');
  if (!track) return;

  const slides = track.querySelectorAll('.carousel-slide');
  const dotsContainer = document.getElementById('carouselDots');
  const prevBtn = document.getElementById('carouselPrev');
  const nextBtn = document.getElementById('carouselNext');

  let current = 0;
  let autoPlayTimer = null;
  const AUTOPLAY_INTERVAL = 5000;

  // Generar dots
  slides.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('aria-label', 'Ir a imagen ' + (i + 1));
    dot.addEventListener('click', () => goTo(i));
    dotsContainer.appendChild(dot);
  });

  function goTo(index) {
    slides[current].classList.remove('active');
    dotsContainer.children[current].classList.remove('active');
    current = (index + slides.length) % slides.length;
    slides[current].classList.add('active');
    dotsContainer.children[current].classList.add('active');
  }

  function next() { goTo(current + 1); }
  function prev() { goTo(current - 1); }

  function startAutoPlay() {
    stopAutoPlay();
    autoPlayTimer = setInterval(next, AUTOPLAY_INTERVAL);
  }

  function stopAutoPlay() {
    if (autoPlayTimer) {
      clearInterval(autoPlayTimer);
      autoPlayTimer = null;
    }
  }

  prevBtn.addEventListener('click', () => { prev(); startAutoPlay(); });
  nextBtn.addEventListener('click', () => { next(); startAutoPlay(); });

  track.addEventListener('mouseenter', stopAutoPlay);
  track.addEventListener('mouseleave', startAutoPlay);

  // Keyboard navigation (desactivado cuando el modal está abierto)
  document.addEventListener('keydown', (e) => {
    if (document.getElementById('modalOverlay')?.classList.contains('open')) return;
    if (e.key === 'ArrowLeft') { prev(); startAutoPlay(); }
    if (e.key === 'ArrowRight') { next(); startAutoPlay(); }
  });

  // Touch swipe
  let touchStartX = 0;
  track.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend', (e) => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) next(); else prev();
      startAutoPlay();
    }
  });

  // Click para abrir modal
  track.addEventListener('click', () => {
    const slideImg = slides[current].querySelector('img');
    const caption = slides[current].querySelector('.carousel-slide-caption');
    if (slideImg && window.livlinModal) {
      window.livlinModal.openSingle(
        slideImg.src,
        slideImg.alt,
        caption ? caption.textContent : '',
        'Diseño Regenerativo'
      );
    }
  });

  startAutoPlay();
})();
