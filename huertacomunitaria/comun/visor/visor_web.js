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
  // Modo ilustrativo (sin botones): solo el modelo, girando solo, sin medidas ni herrajes. Parámetros: vista (persp|frente|lado|planta), zoom, giro=0 (quieto), fondo (color), medidas=1
  var ilus = q.get("modo") === "ilustrativo";
  if (ilus) document.documentElement.classList.add("ilus");

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
    if (ilus) return window.innerHeight;
    return Math.max(300, window.innerHeight - extra - 26);
  }

  // al girar el celular o cambiar el tamaño de la ventana, el visor vuelve a ocupar el alto del marco
  var pendiente = null;
  window.addEventListener("resize", function () {
    clearTimeout(pendiente);
    pendiente = setTimeout(function () { if (typeof altoBase !== "undefined") { altoBase = altura(); fijarAlto(); dibujar(true); } }, 150);
  });

  function aviso(t) { var ay = id("ayuda"); if (ay) { ay.textContent = t; ay.style.color = "#a33"; } }

  function ilustrar() {
    var intentos = 0;
    var t = setInterval(function () {
      intentos++;
      if (typeof objetos === "undefined" || !objetos.length) { if (intentos > 80) clearInterval(t); return; }
      clearInterval(t);
      objetos.forEach(function (o) { var c = o.userData && o.userData.cat; if (c === "herrajes" || c === "medidas") o.visible = false; });
      if (!q.get("medidas")) { mostrarCotas = false; if (typeof cotas !== "undefined" && cotas) cotas.visible = false; }
      document.body.classList.add("ilus");
      window.vista(q.get("vista") || "persp");
      if (typeof encuadrarVisible === "function") encuadrarVisible();
      setTimeout(function () {
        cam.r *= parseFloat(q.get("zoom") || "1");
        giro = q.get("giro") !== "0";
        dibujar(true);
        document.documentElement.setAttribute("data-listo", "1");
      }, 1300);
    }, 100);
  }

  fetch(escenaUrl).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }).then(function (escena) {
    window.postMessage({ type: "streamlit:render", args: {
      escena: escena, titulo: q.get("titulo") || "", altura: altura(), catalogo: {}, clave: "web_" + escenaUrl,
      lat: -33.46, sync: null, suelo: false, fondo: q.get("fondo") ? "#" + q.get("fondo") : "#ffffff", version: VERSION_JS } }, "*");
    if (ilus) ilustrar();
  }).catch(function () { aviso("No se pudo cargar el modelo 3D. Revisa tu conexión y vuelve a intentarlo."); });
})();
