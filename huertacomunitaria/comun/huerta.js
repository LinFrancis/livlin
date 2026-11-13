/* Manual vivo de huerta comunitaria · comportamiento de las páginas (sin dependencias).
   - Visor 3D: el modelo se carga solo al tocar «Ver en 3D» (así la página abre rápido en el celular) y solo hay uno abierto a la vez. */
(function () {
  "use strict";

  function hayWebGL() {
    try { var c = document.createElement("canvas"); return !!(window.WebGLRenderingContext && (c.getContext("webgl") || c.getContext("experimental-webgl"))); }
    catch (e) { return false; }
  }

  var abierto = null;   // tarjeta 3D con el visor encendido

  function urlVisor(base, escena, titulo) {
    return base + "?escena=" + encodeURIComponent(escena) + "&titulo=" + encodeURIComponent(titulo || "");
  }

  function apagar(tarjeta) {
    var marco = tarjeta.querySelector(".h3d-marco"), f = marco.querySelector("iframe");
    if (f) f.remove();
    var b = marco.querySelector(".h3d-abrir"), p = marco.querySelector(".h3d-poster");
    if (b) b.hidden = false; if (p) p.hidden = false;
  }

  function encender(tarjeta, boton) {
    if (abierto && abierto !== tarjeta) apagar(abierto);
    abierto = tarjeta;
    var base = tarjeta.getAttribute("data-visor"), marco = tarjeta.querySelector(".h3d-marco");
    var f = marco.querySelector("iframe");
    var url = urlVisor(base, boton.getAttribute("data-escena"), boton.getAttribute("data-titulo"));
    tarjeta.querySelectorAll(".h3d-vistas button").forEach(function (b) { b.setAttribute("aria-pressed", b === boton ? "true" : "false"); });
    var full = tarjeta.querySelector(".h3d-full"); if (full) { full.href = url; full.hidden = false; }
    if (!hayWebGL()) { marco.insertAdjacentHTML("beforeend", '<p style="padding:20px">Tu navegador no puede mostrar el modelo 3D. Mira las fotos y los dibujos de esta página.</p>'); return; }
    if (!f) {
      f = document.createElement("iframe");
      f.title = "Modelo 3D interactivo: " + (boton.getAttribute("data-titulo") || "");
      f.setAttribute("allowfullscreen", "");
      marco.appendChild(f);
    }
    var b2 = marco.querySelector(".h3d-abrir"), p = marco.querySelector(".h3d-poster");
    if (b2) b2.hidden = true; if (p) p.hidden = true;
    f.src = url;
  }

  document.querySelectorAll(".h3d").forEach(function (tarjeta) {
    var botones = tarjeta.querySelectorAll(".h3d-vistas button");
    botones.forEach(function (b) { b.addEventListener("click", function () { encender(tarjeta, b); }); });
    var abrir = tarjeta.querySelector(".h3d-abrir");
    if (abrir) abrir.addEventListener("click", function () { encender(tarjeta, botones[0]); });
  });

  // Modelos 3D ilustrativos: el visor se enciende cuando el modelo está cerca de la pantalla y se apaga cuando queda lejos (así el celular no se carga con muchos a la vez)
  var vivos = document.querySelectorAll("iframe[data-i3d]");
  if (vivos.length && hayWebGL() && "IntersectionObserver" in window) {
    var obs = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        var f = e.target;
        if (e.isIntersecting) {
          if (!f.getAttribute("src")) {
            f.classList.remove("listo");
            f.setAttribute("src", f.getAttribute("data-i3d"));
            var n = 0, t = setInterval(function () {      // el visor se muestra cuando ya está listo (así no se ven sus botones al cargar)
              n++;
              try { if (f.contentDocument && f.contentDocument.documentElement.getAttribute("data-listo") === "1") { f.classList.add("listo"); clearInterval(t); } } catch (err) { f.classList.add("listo"); clearInterval(t); }
              if (n > 60) { f.classList.add("listo"); clearInterval(t); }
            }, 150);
          }
        } else if (f.getAttribute("src")) { f.removeAttribute("src"); f.classList.remove("listo"); }
      });
    }, { rootMargin: "250px 0px" });
    vivos.forEach(function (f) { obs.observe(f); });
  }
})();
