/**
 * modal.js — Livlin Modal de Galería
 * Abre imágenes en pantalla completa con info
 */
(function () {
  'use strict';

  const overlay = document.getElementById('modalOverlay');
  if (!overlay) return;

  const modalImg = document.getElementById('modalImg');
  const modalTitle = document.getElementById('modalTitle');
  const modalDesc = document.getElementById('modalDesc');
  const modalService = document.getElementById('modalService');
  const closeBtn = document.getElementById('modalClose');
  const prevBtn = document.getElementById('modalPrev');
  const nextBtn = document.getElementById('modalNext');

  // Recolectar todos los items de galería
  let galleryItems = [];
  let currentIndex = 0;
  let activeFilter = 'todos';

  function buildItemList() {
    const filter = activeFilter;
    const all = document.querySelectorAll('.galeria-item');
    galleryItems = [];
    all.forEach((el) => {
      const cat = el.dataset.category;
      if (filter === 'todos' || cat === filter) {
        galleryItems.push({
          src: el.querySelector('img').src,
          alt: el.querySelector('img').alt,
          title: el.dataset.title || '',
          desc: el.dataset.desc || '',
          service: el.dataset.service || ''
        });
      }
    });
  }

  function openModal(index) {
    currentIndex = index;
    const item = galleryItems[currentIndex];
    if (!item) return;
    modalImg.src = item.src;
    modalImg.alt = item.alt;
    modalTitle.textContent = item.title;
    modalDesc.textContent = item.desc;
    modalService.textContent = item.service;
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    modalImg.focus();
  }

  function closeModal() {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  function showPrev() {
    currentIndex = (currentIndex - 1 + galleryItems.length) % galleryItems.length;
    openModal(currentIndex);
  }

  function showNext() {
    currentIndex = (currentIndex + 1) % galleryItems.length;
    openModal(currentIndex);
  }

  // Event listeners
  closeBtn.addEventListener('click', closeModal);
  prevBtn.addEventListener('click', showPrev);
  nextBtn.addEventListener('click', showNext);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (!overlay.classList.contains('open')) return;
    if (e.key === 'Escape') closeModal();
    if (e.key === 'ArrowLeft') showPrev();
    if (e.key === 'ArrowRight') showNext();
  });

  // Touch swipe in modal
  let touchStartX = 0;
  overlay.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; }, { passive: true });
  overlay.addEventListener('touchend', (e) => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) showNext(); else showPrev();
    }
  });

  // Conectar galería items
  function connectGallery() {
    const items = document.querySelectorAll('.galeria-item');
    items.forEach((el) => {
      el.addEventListener('click', () => {
        buildItemList();
        // Encontrar índice en la lista filtrada
        const src = el.querySelector('img').src;
        const idx = galleryItems.findIndex(item => item.src === src);
        if (idx >= 0) openModal(idx);
      });
    });
  }

  // Filtros de galería
  const filterBtns = document.querySelectorAll('.galeria-filter-btn');
  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      activeFilter = btn.dataset.filter;
      filterGallery(activeFilter);
    });
  });

  function filterGallery(filter) {
    const items = document.querySelectorAll('.galeria-item');
    items.forEach((el) => {
      if (filter === 'todos' || el.dataset.category === filter) {
        el.style.display = 'block';
        el.style.animation = 'fadeInUp 0.4s ease forwards';
      } else {
        el.style.display = 'none';
      }
    });
  }

  // Public API para el carrusel
  window.livlinModal = {
    openSingle: function (src, alt, desc, service) {
      modalImg.src = src;
      modalImg.alt = alt;
      modalTitle.textContent = alt;
      modalDesc.textContent = desc;
      modalService.textContent = service;
      overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
      // Ocultar nav en modo single
      prevBtn.style.display = 'none';
      nextBtn.style.display = 'none';
      closeBtn.addEventListener('click', () => {
        prevBtn.style.display = '';
        nextBtn.style.display = '';
      }, { once: true });
    }
  };

  // Init
  document.addEventListener('DOMContentLoaded', connectGallery);
  // También conectar si DOM ya cargó
  if (document.readyState !== 'loading') connectGallery();

})();
