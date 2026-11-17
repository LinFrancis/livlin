/**
 * impacto-resumen.js — LivLin · Resumen de una página del Reporte de Impacto (pensado para postulaciones).
 * Todas las cifras salen de js/impacto-datos.js: al actualizar los datos, la página se actualiza sola.
 */
(function () {
  'use strict';
  var R = window.REPORTE;
  if (!R) return;
  var $ = function (id) { return document.getElementById(id); };
  var nf = function (v, d) { return Number(v).toLocaleString('es-CL', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 }); };
  var MES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  var fecha = function (iso) { var p = iso.split('-'); return +p[2] + ' de ' + MES[+p[1] - 1] + ' de ' + p[0]; };
  var P = R.periodo;

  $('res-periodo').textContent = P.nombre + ' · ' + fecha(P.inicio) + ' al ' + fecha(P.aniversario) + ' · datos al ' + fecha(P.corte);

  $('res-kpis').innerHTML = [
    [R.espacios, 'Proyectos acompañados', R.hogares + ' hogares y ' + R.organizaciones + ' organizaciones'],
    [nf(R.personas_espacios), 'Personas impactadas · diagnóstico y diseño', 'Quienes habitan los espacios acompañados'],
    [nf(R.personas_impl), 'Personas impactadas · implementación', 'Espacios donde ya se construyó o instaló algo'],
    [nf(R.cultivo.nuevo_m2, 1) + ' m²', 'Cultivo agroecológico urbano implementado', 'Camas de cultivo nuevas con LivLin']
  ].map(function (k) { return '<div class="rk"><b>' + k[0] + '</b><span>' + k[1] + '</span><i>' + k[2] + '</i></div>'; }).join('');

  $('res-lineas').innerHTML = R.lineas.map(function (l) {
    return '<li><b>' + l.realizados + '</b><span>' + l.nombre + '</span></li>';
  }).join('');

  var T = R.territorio;
  var comunas = {}; R.lista_espacios.forEach(function (e) { comunas[e.comuna] = 1; });
  $('res-territorio').innerHTML = '<p>' + R.espacios + ' espacios en <b>' + T.cuencas.length + ' cuencas hidrográficas</b>, ' + T.subcuencas.length +
    ' subcuencas y ' + Object.keys(comunas).length + ' comunas de ' + T.regiones.length + ' regiones de Chile, más un taller en Chengdu (China).</p><ul>' +
    T.cuencas.map(function (c) { return '<li><b>' + c.nombre + '</b>: ' + c.espacios + ' espacios (' + c.implementados + ' con implementación)</li>'; }).join('') + '</ul>';

  // Mismo cálculo que el dashboard de la plataforma: puntajes 0-10, promedio de los proyectos con diagnóstico
  var F = R.flor || {};
  var sc = function (v) { return Number(v).toLocaleString('es-CL', { maximumFractionDigits: 2 }); };
  $('res-petalos').innerHTML = R.petalos.map(function (p) {
    var b = function (v, col) { return '<i style="--w:' + Math.min(100, v * 10) + '%;--c:' + col + '"></i><small>' + sc(v) + '</small>'; };
    return '<tr><td><b>' + (p.i + 1) + '</b> ' + p.nombre + '</td><td>' + b(p.ini, '#E1AA36') + '</td><td>' + b(p.act, '#112E4D') + '</td><td>' + b(p.pot, '#239BA7') +
      '</td><td class="num">' + p.acc_impl + '</td></tr>';
  }).join('');
  if ($('res-flor-n')) $('res-flor-n').textContent = F.n + ' proyectos con diagnóstico · promedio de ' + sc(F.erp) + ' (inicial), ' + sc(F.aimp) + ' (actual) y ' + sc(F.hrp) + ' (potencial), de 10';

  var S = R.sistemas;
  $('res-tierra').innerHTML = [
    [nf(S.compost_l), 'litros de capacidad de compostaje'], [nf(S.agua_l), 'litros de agua lluvia'],
    [S.arboles, 'árboles frutales plantados'], [R.talleres, 'talleres · ' + R.asistentes + ' asistentes'], [R.orientaciones, 'asesorías gratuitas online']
  ].map(function (x) { return '<li><b>' + x[0] + '</b><span>' + x[1] + '</span></li>'; }).join('');

  var imp = R.petalos.reduce(function (s, p) { return s + p.acciones_impl; }, 0);
  var pot = R.petalos.reduce(function (s, p) { return s + p.acciones_pot; }, 0);
  $('res-acciones').textContent = nf(imp) + ' acciones regenerativas implementadas, de ' + nf(pot) + ' proyectadas en los planes maestros.';

  $('res-imprimir').addEventListener('click', function () { window.print(); });
})();
