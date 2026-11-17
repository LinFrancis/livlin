/**
 * gestor-trabajos.js — LivLin · «Explora nuestro trabajo» como gestor de trabajos realizados.
 * Una sola lista (js/casos.js + proyectos con bitácora propia), con buscador, filtros por tipo de espacio
 * y por servicio, contador y «Ver más». Cada tarjeta abre el visor del sitio (js/script.js).
 * Solo información pública y general: los hogares aparecen sin nombre.
 */
(function () {
  'use strict';
  var casos = (window.LIVLIN_CASOS || []).slice();
  var grid = document.getElementById('gGrid');
  if (!grid) return;

  // Proyectos con ficha propia (bitácora) que no están en casos.js
  casos.push({
    id: 'cecosf', name: 'Huerta comunitaria CECOSF Villa Olímpica', location: 'Ñuñoa',
    cats: ['diseno', 'huerto', 'educacion'], service: 'Huerta Agroecológica · Diseño Regenerativo · Educación Ambiental',
    desc: 'Huerta comunitaria agroecológica en un centro de salud familiar, diseñada junto a la comunidad: camas de cultivo agroecológico, compostera de tres zonas y jardín medicinal. El proyecto tiene su propia bitácora con el plan maestro en 3D, el antes y el después de cada espacio y los turnos de cuidado.',
    images: ['images/cecosf/huerta-hoy.webp', 'images/cecosf/huerta-antes.webp', 'images/cecosf/compostera-hoy.webp', 'images/cecosf/plan-maestro-3d.webp'],
    video: '', href: '/huertacomunitaria/cecosfvillaolimpica/index.html'
  });

  var TIPO_DE = {
    cecosf: 'comunidad', aucca: 'comunidad', escuela: 'comunidad', nova: 'comunidad',
    rendebu: 'org', lavaseco: 'org', sociedadmedica: 'org',
    andrea_felipe: 'hogar', javiera_francis: 'hogar', sylvia_ricardo: 'hogar', cecilia_isidora: 'hogar',
    china: 'internacional',
    'indag-regenerativa': 'digital', 'mapeo-cuencas': 'digital', 'agentes-en-red': 'digital'
  };
  var TIPOS = [
    ['todos', 'Todos'], ['hogar', 'Hogares'], ['org', 'Organizaciones y negocios'],
    ['comunidad', 'Comunidades y educación'], ['internacional', 'Internacional'], ['digital', 'Plataformas y herramientas']
  ];
  var TIPO_NOMBRE = {}; TIPOS.forEach(function (t) { TIPO_NOMBRE[t[0]] = t[1]; });
  var SERVICIOS = [
    ['todos', 'Todos los servicios'], ['diseno', 'Diseño regenerativo'], ['huerto', 'Huerta agroecológica urbana'],
    ['educacion', 'Educación ambiental'], ['mel', 'Monitoreo, evaluación y aprendizaje (MEL)'], ['digital', 'Soluciones digitales']
  ];
  var ORDEN = ['cecosf', 'aucca', 'rendebu', 'javiera_francis', 'lavaseco', 'nova', 'escuela', 'andrea_felipe',
    'sylvia_ricardo', 'cecilia_isidora', 'china', 'sociedadmedica', 'indag-regenerativa', 'mapeo-cuencas', 'agentes-en-red'];
  casos.sort(function (a, b) {
    var i = ORDEN.indexOf(a.id), j = ORDEN.indexOf(b.id);
    return (i < 0 ? 99 : i) - (j < 0 ? 99 : j);
  });
  casos.forEach(function (c) { c.tipo = TIPO_DE[c.id] || 'org'; });

  var PAGINA = 6;
  var st = { tipo: 'todos', serv: 'todos', q: '', mostrar: PAGINA };

  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  function primeraFrase(t) { var m = String(t).match(/^(.*?[.!?])(\s|$)/); return m ? m[1] : t; }

  function filtrados() {
    var q = norm(st.q);
    return casos.filter(function (c) {
      if (st.tipo !== 'todos' && c.tipo !== st.tipo) return false;
      if (st.serv !== 'todos' && c.cats.indexOf(st.serv) === -1) return false;
      if (q && norm([c.name, c.location, c.service, c.desc].join(' ')).indexOf(q) === -1) return false;
      return true;
    });
  }

  function tarjeta(c) {
    var imgs = c.images || [];
    var attrs = 'data-title="' + esc(c.name) + '" data-location="' + esc(c.location) + '" data-desc="' + esc(c.desc) + '" ' +
      'data-service="' + esc(c.service) + '" data-video="' + esc(c.video || '') + '" ' +
      "data-images='" + JSON.stringify(imgs) + "'";
    var media = '<div class="proj-card-media"><img loading="lazy" src="' + esc(imgs[0]) + '" alt="' + esc(c.name) + '">' +
      '<span class="gt-badge">' + esc(TIPO_NOMBRE[c.tipo]) + '</span>' +
      (c.video ? '<span class="proj-card-play" aria-hidden="true">▶ Video</span>' : '') + '</div>';
    var body = '<div class="proj-card-body"><span class="proj-card-loc">' + esc(c.location) + '</span>' +
      '<h3 class="proj-card-title">' + esc(c.name) + '</h3>' +
      '<p class="proj-card-intro">' + esc(primeraFrase(c.desc)) + '</p>' +
      '<span class="gt-serv">' + esc(c.service) + '</span>' +
      '<span class="proj-card-more">' + (c.href ? 'Ver bitácora del proyecto →' : 'Ver proyecto completo →') + '</span></div>';
    if (c.href) return '<a class="proj-card" href="' + esc(c.href) + '">' + media + body + '</a>';
    return '<article class="proj-card caso-clickable" tabindex="0" role="button" aria-label="Ver proyecto ' + esc(c.name) + '" ' + attrs + '>' + media + body + '</article>';
  }

  function contar(tipo) {
    return casos.filter(function (c) { return tipo === 'todos' || c.tipo === tipo; }).length;
  }

  function pintarChips() {
    document.getElementById('gTipos').innerHTML = TIPOS.map(function (t) {
      return '<button type="button" class="gt-chip' + (st.tipo === t[0] ? ' on' : '') + '" data-tipo="' + t[0] + '" aria-pressed="' + (st.tipo === t[0]) + '">' +
        esc(t[1]) + ' <small>' + contar(t[0]) + '</small></button>';
    }).join('');
  }

  function pintar() {
    var lista = filtrados();
    var vis = lista.slice(0, st.mostrar);
    grid.innerHTML = vis.map(tarjeta).join('');
    document.getElementById('gCount').textContent = lista.length
      ? 'Mostrando ' + vis.length + ' de ' + lista.length + ' trabajo' + (lista.length > 1 ? 's' : '')
      : '';
    document.getElementById('gVacio').hidden = lista.length > 0;
    var mas = document.getElementById('gMore');
    var resto = lista.length - vis.length;
    mas.hidden = resto <= 0;
    mas.textContent = 'Ver más trabajos (' + resto + ' más)';
    document.getElementById('gClear').hidden = (st.tipo === 'todos' && st.serv === 'todos' && !st.q);
    pintarChips();
    grid.querySelectorAll('.proj-card[role="button"]').forEach(function (card) {
      card.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); card.click(); } });
    });
  }

  // Controles
  var sel = document.getElementById('gServ');
  sel.innerHTML = SERVICIOS.map(function (s) { return '<option value="' + s[0] + '">' + esc(s[1]) + '</option>'; }).join('');
  sel.addEventListener('change', function () { st.serv = sel.value; st.mostrar = PAGINA; pintar(); });
  document.getElementById('gTipos').addEventListener('click', function (e) {
    var b = e.target.closest('.gt-chip'); if (!b) return;
    st.tipo = b.dataset.tipo; st.mostrar = PAGINA; pintar();
  });
  var inp = document.getElementById('gSearch');
  inp.addEventListener('input', function () { st.q = inp.value; st.mostrar = PAGINA; pintar(); });
  document.getElementById('gMore').addEventListener('click', function () { st.mostrar += PAGINA; pintar(); });
  document.getElementById('gClear').addEventListener('click', function () {
    st = { tipo: 'todos', serv: 'todos', q: '', mostrar: PAGINA }; inp.value = ''; sel.value = 'todos'; pintar();
  });

  // Resumen de la cabecera con datos del reporte (si están cargados)
  var R = window.REPORTE, lead = document.getElementById('gLead');
  if (lead && R) {
    lead.textContent = R.espacios + ' espacios acompañados en el primer año. Aquí puedes explorar ' + casos.length +
      ' trabajos con ficha pública: filtra por tipo de espacio o por servicio, o busca por nombre o comuna. Por privacidad, los hogares se muestran sin nombre y solo con la comuna.';
  }
  pintar();
})();
