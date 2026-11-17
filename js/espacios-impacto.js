/**
 * espacios-impacto.js — LivLin · «Explora nuestro trabajo»
 * Muestra, con datos del Reporte de Impacto (js/impacto-datos.js), una franja de métricas
 * y un ejemplo por tipo de espacio. Solo información pública y general:
 * sin nombres de familias, sin direcciones, solo comunas.
 * Se actualiza solo al regenerar impacto-datos.js (ver borrador_impacto/generar_datos.py).
 */
(function () {
  'use strict';
  var R = window.REPORTE;
  if (!R) return;

  var nf = function (v) { return Number(v).toLocaleString('es-CL', { maximumFractionDigits: 0 }); };
  var nf1 = function (v) { return Number(v).toLocaleString('es-CL', { minimumFractionDigits: 1, maximumFractionDigits: 1 }); };
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  // ---- Franja de métricas
  var m = document.getElementById('casosMetrics');
  if (m) {
    var items = [
      [R.espacios, 'proyectos acompañados'],
      [nf(R.personas_espacios), 'personas impactadas · diagnóstico y diseño'],
      [nf(R.personas_impl), 'personas impactadas · implementación'],
      [nf1(R.cultivo.nuevo_m2) + ' m²', 'de cultivo agroecológico urbano implementado']
    ];
    m.innerHTML = items.map(function (i) {
      return '<div class="casos-metric"><b>' + esc(i[0]) + '</b><span>' + esc(i[1]) + '</span></div>';
    }).join('');
  }

  // ---- Un ejemplo por tipo de espacio
  var GRUPOS = [
    { id: 'casas', nombre: 'Casas con patio o jardín', tipos: ['Casa con patio/jardín'],
      img: 'images/casos_reales/publico/hogar_parron.jpg', pos: 'center',
      texto: 'Patios familiares que pasan del diagnóstico a la acción con huerta agroecológica: compostaje, bancales autorregantes y estructuras que dan sombra natural.' },
    { id: 'deptos', nombre: 'Departamentos con terraza', tipos: ['Departamento con terraza'],
      img: 'images/casos_reales/publico/depto_vermicompostera.jpg', pos: 'center',
      texto: 'Terrazas y balcones donde se compostan los residuos y se cultivan alimentos agroecológicos en espacios reducidos, con riego eficiente.' },
    { id: 'comunitarios', nombre: 'Centros y huertos comunitarios', tipos: ['Centro comunitario', 'Huerto comunitario'],
      img: 'images/cecosf/huerta-hoy.webp', pos: 'center',
      texto: 'Espacios de encuentro que suman huerta agroecológica, compostera y talleres, con participación de las personas que los usan.' },
    { id: 'organizaciones', nombre: 'Organizaciones y negocios', tipos: ['Organización o institución'],
      img: 'images/casos_reales/01_rendebu/01_antes_despues_muroverde.png', pos: 'center',
      texto: 'Negocios y organizaciones que integran alimentos agroecológicos a su identidad y a la mirada de quienes los visitan.' },
    { id: 'escuelas', nombre: 'Escuelas', tipos: ['Escuela / jardín infantil'],
      img: 'images/casos_reales/05_Escuela/01_lms.png', pos: 'center',
      texto: 'Diseño de huertas pedagógicas con lectura del sol y del suelo, listado de siembra por estación y material educativo.' },
    { id: 'comunidades', nombre: 'Edificios, comunidades y terrenos', tipos: ['Comunidad / copropiedad', 'Terreno urbano en recuperación', 'Ecobarrio / terreno subdividido'],
      img: 'images/casos_reales/07_Edificio_Nova/01_nova.png', pos: 'center',
      texto: 'Áreas comunes y terrenos poco usados que se activan para cultivar, compartir saberes y fortalecer el vínculo entre vecinos.' }
  ];

  // ---- Filtro de casos (Hogares / Organizaciones / Educación / Internacional)
  var filterBtns = document.querySelectorAll('.casos-filter-btn');
  var casoCards = document.querySelectorAll('.caso-card');
  filterBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      filterBtns.forEach(function (b) { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
      btn.classList.add('active'); btn.setAttribute('aria-selected', 'true');
      var cat = btn.dataset.cat;
      casoCards.forEach(function (card) { card.style.display = (cat === 'todos' || card.dataset.cat === cat) ? 'flex' : 'none'; });
    });
  });

  var cont = document.getElementById('espaciosEj');
  if (!cont) return;
  var lista = R.lista_espacios || [];
  var html = GRUPOS.map(function (g) {
    var es = lista.filter(function (e) { return g.tipos.indexOf(e.tipo) !== -1; });
    if (!es.length) return '';
    var impl = es.filter(function (e) { return e.implementa; }).length;
    var comunas = Array.from(new Set(es.map(function (e) { return e.comuna; }))).sort();
    var tag = impl ? (impl + ' de ' + es.length + ' con implementación') : 'En etapa de diagnóstico y diseño';
    return '<article class="espacio-ej">' +
      '<div class="espacio-ej-img"><img loading="lazy" src="' + esc(g.img) + '" alt="' + esc(g.nombre) + '" style="object-position:' + g.pos + '"></div>' +
      '<div class="espacio-ej-body">' +
        '<span class="espacio-ej-n">' + es.length + ' espacio' + (es.length > 1 ? 's' : '') + '</span>' +
        '<h3>' + esc(g.nombre) + '</h3>' +
        '<p>' + esc(g.texto) + '</p>' +
        '<div class="espacio-ej-meta"><span class="espacio-ej-tag">' + esc(tag) + '</span>' +
        '<span class="espacio-ej-com">' + esc(comunas.join(' · ')) + '</span></div>' +
      '</div></article>';
  }).join('');
  cont.innerHTML = html;
})();
