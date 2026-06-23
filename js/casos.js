/**
 * casos.js — LivLin · datos de casos reales + render filtrado por servicio
 * Fuente única de verdad (ver CASOS-REALES.md).
 * Uso: <div class="proj-grid" data-casos="diseno" data-base="../"></div>
 *   data-casos: diseno | huerto | educacion | mel | digital | all
 *   data-base:  prefijo de ruta para imágenes ("" en raíz, "../" en /servicios)
 * Cada tarjeta abre la experiencia completa vía la delegación global de script.js.
 */
(function () {
  'use strict';

  var P = [
    {
      id: 'rendebu', name: 'Rende Bú Café', location: 'Providencia',
      cats: ['diseno', 'huerto'], service: 'Diseño Regenerativo · Huerto Urbano',
      desc: 'Transformamos espacios disponibles del café en áreas productivas para el cultivo de alimentos, integrando huertas en patios, macetas y sectores exteriores. Lo que comenzó como una prueba se convirtió en una nueva etapa de inversión e infraestructura para fortalecer el carácter sostenible del proyecto. Hoy clientes y trabajadores conviven diariamente con cultivos comestibles que inspiran nuevas formas de relacionarse con la alimentación y la ciudad.',
      images: ['images/casos_reales/01_rendebu/01_antes_despues_muroverde.png', 'images/casos_reales/01_rendebu/02_antes_despues_terraza.png'],
      video: ''
    },
    {
      id: 'sociedadmedica', name: 'Sociedad Médica SN', location: 'Providencia',
      cats: ['digital'], service: 'Soluciones Digitales · Software a Medida',
      desc: 'Desarrollamos una plataforma digital a medida para centralizar información crítica y facilitar el acceso a datos utilizados en procesos de diagnóstico médico. La solución permitió unificar bases de datos dispersas y fortalecer la gestión de información de la organización mediante una herramienta adaptada a sus necesidades reales.',
      images: ['images/casos_reales/02_sociedadmedica/codificator.png'],
      video: ''
    },
    {
      id: 'aucca', name: 'Aucca Centro Ecopedagógico', location: 'Talagante',
      cats: ['mel', 'digital'], service: 'MEL · Software a Medida · Página Web',
      desc: 'Diseñamos e implementamos herramientas digitales para apoyar la gestión de un centro comunitario dedicado a la agroecología y la educación ambiental. La plataforma permite dar seguimiento a acuerdos, objetivos, finanzas y actividades, fortaleciendo la coordinación interna y la toma de decisiones basada en información actualizada.',
      images: ['images/casos_reales/03_Aucca/01_intranet_inicio.png', 'images/casos_reales/03_Aucca/02_intranet_eventos.png', 'images/casos_reales/03_Aucca/03_intranet_graficos.png'],
      video: ''
    },
    {
      id: 'lavaseco', name: 'Lavaseco Florencia', location: 'Providencia',
      cats: ['huerto'], service: 'Huerto Urbano · Huerta Agroecológica',
      desc: 'Convertimos un espacio exterior subutilizado en una huerta agroecológica visible desde la calle. La experiencia demostró que es posible cultivar alimentos en entornos urbanos altamente transitados, generando bienestar para quienes trabajan en el lugar y despertando la curiosidad de vecinos y clientes que observan el crecimiento de la huerta día a día.',
      images: ['images/casos_reales/04_Lavaseco/01_lavaseco_antes_despues.png'],
      video: 'https://www.instagram.com/p/DY3piY0O94e/'
    },
    {
      id: 'escuela', name: 'Liceo Manuel de Salas', location: 'Ñuñoa',
      cats: ['diseno'], service: 'Diseño Regenerativo',
      desc: 'Tuve la necesidad de contactar a Livlin para partir desde cero un proyecto de huerta para la comunidad del ciclo 2 del Liceo Experimental Manuel de Salas. No sólo obtuve una asesoría integral de suelo y posición del sol detallada, sino que también se logró concretar una visita al espacio y un involucramiento total de Francis con el proyecto: aportando con el diseño de la huerta, listado de siembra según estación, infografía gráfica con fines pedagógicos y apoyo constante de cómo implementar un proyecto como este a gran escala. Nos mostró ejemplos de cómo colegios en Chile y China han logrado integrar el cuidado de la naturaleza y la siembra urbana en espacios comunes. Muchas gracias Livlin por tu sabiduría y profesionalismo y por darle vida a este proyecto en su etapa inicial. ¡Esperemos que pronto te podamos invitar a conocer nuestra huerta!',
      images: ['images/casos_reales/05_Escuela/01_lms.png'],
      video: ''
    },
    {
      id: 'andrea_felipe', name: 'Familia Andrea y Felipe', location: 'San Miguel',
      cats: ['diseno', 'huerto', 'educacion'], service: 'Diseño Regenerativo · Huerto Urbano · Talleres',
      desc: 'Diseñamos e implementamos soluciones para compostar, cultivar alimentos y aprovechar mejor los recursos disponibles en un departamento. A través de talleres personalizados y acompañamiento práctico, la familia incorporó nuevas capacidades para gestionar residuos orgánicos y producir parte de sus alimentos en espacios reducidos.',
      images: ['images/casos_reales/06_Andrea_Felipe/andrea_felipe_antes_despues.png'],
      video: ''
    },
    {
      id: 'nova', name: 'Edificio Nova', location: 'Providencia',
      cats: ['diseno', 'huerto'], service: 'Diseño Regenerativo · Huerto Comunitario',
      desc: 'Activamos espacios comunitarios del edificio para el cultivo de alimentos y el fortalecimiento de los vínculos entre vecinos. La iniciativa permitió transformar áreas poco utilizadas en lugares productivos, compartir plantas y conocimientos, y abrir nuevas conversaciones sobre sustentabilidad y vida comunitaria.',
      images: ['images/casos_reales/07_Edificio_Nova/01_nova.png'],
      video: 'https://www.instagram.com/p/DYzTwbgR7Na/'
    },
    {
      id: 'javiera_francis', name: 'Familia Javiera y Francis', location: 'Providencia',
      cats: ['diseno', 'huerto'], service: 'Diseño Regenerativo · Bancales Autorregantes · Energía Solar',
      desc: 'Diseñamos e implementamos una terraza productiva basada en bancales autorregantes y compostaje integrado. La solución permitió reducir significativamente las necesidades de riego y facilitar el cultivo continuo de alimentos durante todo el año, demostrando que es posible producir alimentos sanos incluso en condiciones urbanas desafiantes.',
      images: ['images/casos_reales/08_Depto_Javiera_Francis/01_collage_01.png', 'images/casos_reales/08_Depto_Javiera_Francis/02_diseno_antes_despues.png', 'images/casos_reales/08_Depto_Javiera_Francis/03_collage_02.png', 'images/casos_reales/08_Depto_Javiera_Francis/04_bancal_l.png'],
      video: 'https://www.instagram.com/p/Cl1Q_f8tKkl/'
    },
    {
      id: 'sylvia_ricardo', name: 'Familia Sylvia y Ricardo', location: 'La Reina',
      cats: ['diseno', 'huerto', 'educacion'], service: 'Diseño Regenerativo · Wicking Bed · Talleres',
      desc: 'Realizamos el diseño regenerativo de la casa pasando por todos los pétalos de la flor de la permacultura. Se instaló una compostera para el manejo de residuos orgánicos del hogar y se construyó un bancal autorregante de riego por capilaridad con hotel de lombrices y ruedas, que funciona también como muro verde y puede moverse para aprovechar la luz del sol en las diferentes estaciones del año.',
      images: ['images/casos_reales/09_Casa_Sylvia_Ricardo/casa_sylvia_ella.png'],
      video: 'https://www.instagram.com/p/DZvBlupRJCl/'
    },
    {
      id: 'cecilia_isidora', name: 'Familia Cecilia e Isidora', location: 'Las Condes',
      cats: ['diseno', 'huerto', 'educacion'], service: 'Diseño Regenerativo · Wicking Bed · Parrón Bioclimático',
      desc: 'Desarrollamos un plan maestro de regeneración para el hogar que incluyó compostaje, producción de alimentos y mejoras bioclimáticas. Entre las acciones implementadas destacan sistemas de cultivo autorregante y una estructura vegetal diseñada para aportar sombra natural y confort térmico durante los meses más cálidos.',
      images: ['images/casos_reales/10_Casa_Cecilia_Isidora/parron_antes_despues.png', 'images/casos_reales/10_Casa_Cecilia_Isidora/personas_casa.png'],
      video: ''
    },
    {
      id: 'mapeo-cuencas', name: 'Mapeo Participativo de Cuencas', location: 'Demo pública',
      cats: ['mel', 'digital'], service: 'MEL · Soluciones Digitales',
      desc: 'Desarrollamos una plataforma colaborativa para analizar territorios de cuenca y conflictos socioambientales. Permite registrar conflictos georreferenciados, visualizar mapas de calor por subcuenca y generar un directorio exportable de actores. Una herramienta concreta para que comunidades y organizaciones territorialicen su monitoreo y aprendizaje.',
      images: ['images/apps/cuencas_part/02_mapeo_cuencas_mapa.png', 'images/apps/cuencas_part/01_mapeo_cuencas_intro.png', 'images/apps/cuencas_part/03_mapeo_cuencas_graficos.png'],
      video: ''
    },
    {
      id: 'agentes-en-red', name: 'Agentes Regenerativos en Red', location: 'Demo pública',
      cats: ['mel', 'digital'], service: 'MEL · Soluciones Digitales',
      desc: 'Construimos un directorio interactivo y mapa global de actores regenerativos que permite conectar y visualizar iniciativas dispersas en un mapa y una red navegable. Incluye análisis de redes con teoría de grafos, perfiles de actores y visualización de conexiones. Una forma de hacer seguimiento a quién está haciendo qué y dónde en el ecosistema regenerativo.',
      images: ['images/apps/reg_red/01_regenerando_red_horizontal.png', 'images/apps/reg_red/02_regenerando_red_horizontal_analisis.png', 'images/apps/reg_red/03_regenerando_perfil_usuario.png', 'images/apps/reg_red/04_regenerando_perfil_mapa.png'],
      video: ''
    },
    {
      id: 'china', name: 'Chengdu Cafe', location: 'Chengdu, China',
      cats: ['educacion', 'huerto'], service: 'Educación Ambiental · Eficiencia Hídrica · Huerto Urbano',
      desc: 'Realizamos un taller para 16 personas en la ciudad de Chengdu, China. Se construyeron dos bancales autorregantes con material reciclado y un sistema de riego por capilaridad con botellas para cultivo urbano. Se habilitó la terraza del segundo piso de un café —sin acceso cercano a agua— como espacio productivo, disminuyendo significativamente la frecuencia de riego. El taller, intergeneracional, favoreció el intercambio y la ecoalfabetización.',
      images: ['images/casos_reales/11_Taller_China/taller_china.jpeg'],
      video: 'https://www.instagram.com/p/DTHWRsSEe7q/'
    }
  ];

  window.LIVLIN_CASOS = P;

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function firstSentence(t) {
    var m = String(t).match(/^(.*?[.!?])(\s|$)/);
    return m ? m[1] : t;
  }

  function cardHTML(p, base) {
    var imgs = p.images.map(function (s) { return base + s; });
    var cover = imgs[0];
    var intro = firstSentence(p.desc);
    var hasVideo = !!p.video;
    return '' +
      '<article class="proj-card caso-clickable" tabindex="0" role="button" ' +
        'aria-label="Ver proyecto ' + esc(p.name) + '" ' +
        'data-title="' + esc(p.name) + '" ' +
        'data-location="' + esc(p.location) + '" ' +
        'data-desc="' + esc(p.desc) + '" ' +
        'data-service="' + esc(p.service) + '" ' +
        'data-video="' + esc(p.video) + '" ' +
        "data-images='" + JSON.stringify(imgs) + "'>" +
        '<div class="proj-card-media">' +
          '<img loading="lazy" src="' + esc(cover) + '" alt="' + esc(p.name) + '">' +
          (hasVideo ? '<span class="proj-card-play" aria-hidden="true">▶ Video</span>' : '') +
        '</div>' +
        '<div class="proj-card-body">' +
          '<span class="proj-card-loc">' + esc(p.location) + '</span>' +
          '<h3 class="proj-card-title">' + esc(p.name) + '</h3>' +
          '<p class="proj-card-intro">' + esc(intro) + '</p>' +
          '<span class="proj-card-more">Ver proyecto completo →</span>' +
        '</div>' +
      '</article>';
  }

  function render() {
    document.querySelectorAll('[data-casos]').forEach(function (cont) {
      var cat = cont.dataset.casos || 'all';
      var base = cont.dataset.base || '';
      var list = P.filter(function (p) { return cat === 'all' || p.cats.indexOf(cat) !== -1; });
      cont.innerHTML = list.map(function (p) { return cardHTML(p, base); }).join('');
    });
    // Soporte de teclado (Enter/Espacio) para tarjetas renderizadas
    document.querySelectorAll('.proj-card[role="button"]').forEach(function (card) {
      card.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); card.click(); }
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
})();
