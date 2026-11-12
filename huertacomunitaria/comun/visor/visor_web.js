/* Adaptador del visor 3D de la plataforma de diseño para la web (página estática, sin Streamlit).
   Se inyecta al final de visor.html. Lee ?escena=<json>&titulo=<texto>, simplifica los controles para público general y
   le entrega la escena al visor con el mismo mensaje que usa Streamlit ("streamlit:render"). */
(function () {
  "use strict";
  var q = new URLSearchParams(location.search);
  var escenaUrl = q.get("escena");
  if (!escenaUrl) return;
  var id = function (x) { return document.getElementById(x); };
  document.documentElement.classList.add("web");

  // Textos más simples (el visor original está pensado para quien diseña)
  function simplificar() {
    var set = function (x, t) { var e = id(x); if (e) e.textContent = t; };
    set("b_leyenda", "☰ Partes"); set("b_todo", "⌂ Ver todo"); set("b_mostrar", "👁 Mostrar todo");
    var cab = document.querySelector("#cap_cab b"); if (cab) cab.textContent = "Partes";
    var q2 = id("cap_q"); if (q2) q2.placeholder = "Buscar una pieza…";
    var ay = id("ayuda");
    if (ay) ay.textContent = "Un dedo (o el mouse) gira el modelo · dos dedos (o la rueda) acercan y alejan · toca una pieza para ver su nombre y su medida · «Partes» deja ver u ocultar cada pieza.";
    var d = id("r_despiece"); if (d && d.parentNode && d.parentNode.firstChild) d.parentNode.firstChild.nodeValue = "Separar piezas ";
    var c = id("s_corte"); if (c && c.parentNode) c.parentNode.classList.add("corte");
  }
  simplificar();

  // En pantallas angostas (celular) la cámara se aleja más para que el modelo entre completo
  var vistaOriginal = window.vista;
  if (typeof vistaOriginal === "function") {
    window.vista = function (k) {
      vistaOriginal(k);
      var asp = (typeof camera !== "undefined" && camera.aspect) || 1.6;
      if (asp < 1.2) { cam.r *= Math.min(2.2, 1.2 / Math.max(asp, 0.45)); dibujar(true); }
    };
  }

  function altura() {
    var extra = 0;
    ["barra", "barra2", "ayuda"].forEach(function (x) { var e = id(x); if (e && e.offsetParent !== null) extra += e.offsetHeight; });
    return Math.max(300, window.innerHeight - extra - 26);
  }

  // al girar el celular o cambiar el tamaño de la ventana, el visor vuelve a ocupar el alto del marco
  var pendiente = null;
  window.addEventListener("resize", function () {
    clearTimeout(pendiente);
    pendiente = setTimeout(function () { if (typeof altoBase !== "undefined") { altoBase = altura(); fijarAlto(); dibujar(true); } }, 150);
  });

  function aviso(t) { var ay = id("ayuda"); if (ay) { ay.textContent = t; ay.style.color = "#a33"; } }

  fetch(escenaUrl).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }).then(function (escena) {
    window.postMessage({ type: "streamlit:render", args: {
      escena: escena, titulo: q.get("titulo") || "", altura: altura(), catalogo: {}, clave: "web_" + escenaUrl,
      lat: -33.46, sync: null, suelo: false, fondo: "#ffffff", version: VERSION_JS } }, "*");
  }).catch(function () { aviso("No se pudo cargar el modelo 3D. Revisa tu conexión y vuelve a intentarlo."); });
})();
