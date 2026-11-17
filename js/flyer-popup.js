/* Pop up del flyer al entrar a la página de inicio (una vez por visita).
   El flyer y su creación están guardados aparte: "06 Pagina Web/Tarjeta y Flyer LivLin". */
(function () {
  var KEY = 'livlin_flyer_visto';
  try { if (sessionStorage.getItem(KEY)) return; } catch (e) { /* sin almacenamiento: se muestra */ }

  var base = (document.currentScript && document.currentScript.src) ? document.currentScript.src.replace(/js\/flyer-popup\.js.*$/, '') : '';
  var previo = null;

  var css = document.createElement('style');
  css.textContent =
    '.fp-fondo{position:fixed;inset:0;z-index:100000;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(17,46,77,.72);opacity:0;transition:opacity .25s}' +
    '.fp-fondo.fp-on{opacity:1}' +
    '.fp-caja{position:relative;max-width:min(92vw,520px);max-height:92vh;animation:fp-sube .3s ease}' +
    '.fp-caja img{display:block;max-width:100%;max-height:88vh;width:auto;height:auto;border-radius:10px;box-shadow:0 12px 40px rgba(0,0,0,.4);background:#fff}' +
    '.fp-x{position:absolute;top:-14px;right:-14px;width:40px;height:40px;border:0;border-radius:50%;background:#fff;color:#112E4D;font-size:26px;line-height:1;cursor:pointer;box-shadow:0 2px 10px rgba(0,0,0,.35)}' +
    '.fp-x:hover,.fp-x:focus-visible{background:#FF37D5;color:#fff;outline:2px solid #fff}' +
    '@keyframes fp-sube{from{transform:translateY(14px) scale(.97)}to{transform:none}}' +
    '@media (prefers-reduced-motion:reduce){.fp-fondo{transition:none}.fp-caja{animation:none}}';
  document.head.appendChild(css);

  function cerrar() {
    document.removeEventListener('keydown', teclas);
    var f = document.getElementById('fp-fondo');
    if (f) f.remove();
    document.documentElement.style.overflow = '';
    try { sessionStorage.setItem(KEY, '1'); } catch (e) {}
    if (previo && previo.focus) previo.focus();
  }
  function teclas(e) {
    if (e.key === 'Escape') cerrar();
    else if (e.key === 'Tab') { e.preventDefault(); var b = document.querySelector('.fp-x'); if (b) b.focus(); }
  }
  function abrir() {
    previo = document.activeElement;
    var f = document.createElement('div');
    f.id = 'fp-fondo'; f.className = 'fp-fondo'; f.setAttribute('role', 'dialog'); f.setAttribute('aria-modal', 'true'); f.setAttribute('aria-label', 'Flyer de LivLin');
    f.innerHTML = '<div class="fp-caja"><button type="button" class="fp-x" aria-label="Cerrar">×</button>' +
      '<img src="' + base + 'images/contacto/flyer-livlin-10x14.jpg" width="900" height="1260" alt="Flyer de LivLin: Conversemos tu idea. Asesoría gratuita online de 20 minutos. WhatsApp +56 9 7165 7358, francis@livlin.cl, www.livlin.cl, @livlin.cl"></div>';
    f.addEventListener('click', function (e) { if (e.target === f || e.target.className === 'fp-x') cerrar(); });
    document.body.appendChild(f);
    document.documentElement.style.overflow = 'hidden';
    document.addEventListener('keydown', teclas);
    requestAnimationFrame(function () { f.classList.add('fp-on'); f.querySelector('.fp-x').focus(); });
  }

  // Solo en pantallas grandes (en celular tapaba toda la portada) y sin interrumpir la primera lectura:
  // aparece a los 15 segundos o cuando la persona ya recorrió casi la mitad de la página, lo que ocurra primero.
  if (window.innerWidth <= 760) return;
  var img = new Image();
  var listo = false, mostrado = false;
  function mostrar() {
    if (mostrado || !listo) return;
    mostrado = true;
    window.removeEventListener('scroll', alScroll);
    abrir();
  }
  function alScroll() {
    var h = document.documentElement.scrollHeight - window.innerHeight;
    if (h > 0 && window.scrollY / h > 0.45) mostrar();
  }
  img.onload = function () { listo = true; setTimeout(mostrar, 15000); alScroll(); };
  window.addEventListener('scroll', alScroll, { passive: true });
  img.src = base + 'images/contacto/flyer-livlin-10x14.jpg';
})();
