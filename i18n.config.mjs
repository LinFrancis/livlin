// ============================================================
// LivLin · Configuración de internacionalización (i18n)
// ------------------------------------------------------------
// Para AGREGAR UN IDIOMA en el futuro:
//   1. Añade una entrada a `languages` (code, dir, label, htmlLang, ogLocale).
//   2. Crea locales/<code>.json con las traducciones (ES → idioma).
//   3. Corre `npm run build`.
// No es necesario tocar build.mjs ni el HTML fuente.
// ============================================================

export const site = {
  domain: 'https://www.livlin.cl',
  defaultLang: 'es',
};

// El primer idioma (es) es el idioma BASE: su texto se toma tal cual del
// HTML fuente en /src y se publica en la raíz del sitio.
export const languages = [
  {
    code: 'es',
    dir: '',            // raíz del sitio
    label: 'Español',
    shortLabel: 'ES',
    htmlLang: 'es',
    ogLocale: 'es_CL',
    hreflang: 'es',
    base: false,        // marcará el idioma base más abajo
  },
  {
    code: 'en',
    dir: 'en',
    label: 'English',
    shortLabel: 'EN',
    htmlLang: 'en',
    ogLocale: 'en_US',
    hreflang: 'en',
  },
  {
    code: 'da',
    dir: 'da',
    label: 'Dansk',
    shortLabel: 'DA',
    htmlLang: 'da',
    ogLocale: 'da_DK',
    hreflang: 'da',
  },
  {
    code: 'zh-CN',
    dir: 'zh',
    label: '简体中文',
    shortLabel: '中文',
    htmlLang: 'zh-Hans',
    ogLocale: 'zh_CN',
    hreflang: 'zh-Hans',
  },
];

// El idioma base es el primero (es).
languages[0].base = true;

export const baseLang = languages[0];

// Devuelve la URL pública de una página fuente para un idioma dado.
// pageRel: ruta relativa dentro de /src, ej. "index.html" o "servicios/monitoreo.html".
export function urlFor(lang, pageRel) {
  const clean = pageRel.replace(/\\/g, '/');
  const prefix = lang.dir ? `/${lang.dir}` : '';
  return `${prefix}/${clean}`;
}

export function absUrlFor(lang, pageRel) {
  return site.domain + urlFor(lang, pageRel);
}
