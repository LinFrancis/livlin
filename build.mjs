// ============================================================
// LivLin · Generador estático multilingüe (sin dependencias)
// ------------------------------------------------------------
//   node build.mjs extract   → recorre /src y vuelca el catálogo
//                              de strings ES a locales/_catalog.json
//   node build.mjs           → genera el sitio (es→raíz, en→/en, …)
//                              + sitemap.xml
// ------------------------------------------------------------
// No traduce: <script>, <style>, contenido SVG, números/símbolos.
// Atributos traducibles: placeholder, title, alt, aria-label y
//   content de meta description / og:* / twitter:*.
// Reescribe: rutas de assets a root-absolutas, enlaces .html al
//   prefijo de idioma, url() en estilos, <html lang>, canonical,
//   hreflang, Open Graph y el selector de idioma.
// ============================================================

import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { site, languages, baseLang, urlFor, absUrlFor } from './i18n.config.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = join(__dirname, 'src');
const OUT = __dirname;
const mode = process.argv[2] === 'extract' ? 'extract' : 'build';

// ---------- utilidades de archivos ----------
function listHtml(dir, baseRel = '') {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const rel = baseRel ? `${baseRel}/${name}` : name;
    if (statSync(full).isDirectory()) out.push(...listHtml(full, rel));
    else if (name.endsWith('.html')) out.push(rel);
  }
  return out;
}

// ---------- normalización de texto ----------
function norm(s) {
  return s.replace(/\s+/g, ' ').trim();
}
const HAS_LETTER = /\p{L}/u;
function translatable(core) {
  return core.length > 0 && HAS_LETTER.test(core);
}

// ---------- resolución de rutas ----------
function resolvePath(pageDir, rel) {
  if (/^([a-z]+:|\/\/|#|mailto:|tel:|data:)/i.test(rel)) return null; // externo/anchor
  let hash = '', query = '';
  const h = rel.indexOf('#'); if (h >= 0) { hash = rel.slice(h); rel = rel.slice(0, h); }
  const q = rel.indexOf('?'); if (q >= 0) { query = rel.slice(q); rel = rel.slice(0, q); }
  if (rel === '') return { path: pageDir ? '/' + pageDir : '/', query, hash };
  if (rel.startsWith('/')) return { path: rel, query, hash };
  const stack = pageDir ? pageDir.split('/') : [];
  for (const part of rel.split('/')) {
    if (part === '' || part === '.') continue;
    if (part === '..') stack.pop();
    else stack.push(part);
  }
  return { path: '/' + stack.join('/'), query, hash };
}
function isPageLink(path) { return /\.html$/i.test(path); }

function rewriteUrl(value, pageDir, lang) {
  const r = resolvePath(pageDir, value);
  if (!r) return value; // externo / anchor / data
  const prefix = (isPageLink(r.path) && lang.dir) ? `/${lang.dir}` : '';
  return prefix + r.path + r.query + r.hash;
}

function rewriteCssUrls(css, pageDir, lang) {
  return css.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/gi, (m, q, u) => {
    const r = resolvePath(pageDir, u.trim());
    if (!r) return m;
    return `url(${q}${r.path}${r.query}${r.hash}${q})`;
  });
}

// ---------- atributos traducibles ----------
const TRANSLATABLE_ATTRS = new Set(['placeholder', 'title', 'alt', 'aria-label']);
const META_TRANSLATE = new Set(['description', 'og:title', 'og:description', 'twitter:title', 'twitter:description']);
const URL_ATTRS = new Set(['href', 'src', 'poster', 'data-base']);

// parseo de atributos de una etiqueta de apertura
function parseAttrs(tagInner) {
  // tagInner: contenido entre < y > sin la barra final
  const attrs = [];
  const re = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)(\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;
  let m;
  while ((m = re.exec(tagInner))) {
    if (!m[1]) continue;
    const name = m[1];
    let value = null, quote = '"';
    if (m[2]) {
      if (m[4] !== undefined) { value = m[4]; quote = '"'; }
      else if (m[5] !== undefined) { value = m[5]; quote = "'"; }
      else { value = m[6]; quote = ''; }
    }
    attrs.push({ name, value, quote, raw: m[0] });
  }
  return attrs;
}

// ---------- procesamiento principal de un HTML ----------
function processHtml(html, ctx) {
  // ctx: { lang, pageDir, dict, collect }
  const { lang, pageDir, dict, collect } = ctx;
  let out = '';
  let i = 0;
  let svgDepth = 0;
  const len = html.length;

  function tr(coreRaw) {
    const key = norm(coreRaw);
    if (!translatable(key)) return coreRaw;
    if (collect) { collect.add(key); return coreRaw; }
    if (lang.base) return coreRaw;
    const t = dict[key];
    return t == null ? coreRaw : t;
  }

  while (i < len) {
    if (html.startsWith('<!--', i)) {
      const end = html.indexOf('-->', i);
      const stop = end < 0 ? len : end + 3;
      out += html.slice(i, stop); i = stop; continue;
    }
    // bloques script / style: contenido crudo (solo reescribir url() en style)
    const blockM = /^<(script|style)(\s[^>]*)?>/i.exec(html.slice(i));
    if (blockM) {
      const tagName = blockM[1].toLowerCase();
      const openLen = blockM[0].length;
      const closeRe = new RegExp(`</${tagName}\\s*>`, 'i');
      const rest = html.slice(i + openLen);
      const cm = closeRe.exec(rest);
      const contentEnd = cm ? cm.index : rest.length;
      const closeTag = cm ? cm[0] : '';
      let content = rest.slice(0, contentEnd);
      if (tagName === 'style' && !lang.base) content = rewriteCssUrls(content, pageDir, lang);
      else if (tagName === 'style') content = rewriteCssUrls(content, pageDir, lang);
      out += processOpenTag(blockM[0]) + content + closeTag;
      i += openLen + contentEnd + closeTag.length;
      continue;
    }
    if (html[i] === '<') {
      // etiqueta
      let j = i + 1, inQ = null;
      while (j < len) {
        const c = html[j];
        if (inQ) { if (c === inQ) inQ = null; }
        else if (c === '"' || c === "'") inQ = c;
        else if (c === '>') break;
        j++;
      }
      const tag = html.slice(i, j + 1);
      const nameM = /^<\/?\s*([a-zA-Z0-9:-]+)/.exec(tag);
      const tname = nameM ? nameM[1].toLowerCase() : '';
      if (tname === 'svg') { if (tag[1] === '/') svgDepth = Math.max(0, svgDepth - 1); else if (!/\/>$/.test(tag)) svgDepth++; }
      out += (tag[1] === '/' ? tag : processOpenTag(tag));
      i = j + 1; continue;
    }
    // nodo de texto
    let k = html.indexOf('<', i);
    if (k < 0) k = len;
    const textNode = html.slice(i, k);
    if (svgDepth > 0) { out += textNode; }
    else {
      const m = /^(\s*)([\s\S]*?)(\s*)$/.exec(textNode);
      if (m && translatable(norm(m[2]))) out += m[1] + tr(m[2]) + m[3];
      else out += textNode;
    }
    i = k;
  }

  function processOpenTag(tag) {
    if (lang.base && !collect) {
      // idioma base: solo asegurar rutas root-absolutas (assets), sin prefijo
    }
    const closeSelf = /\/>$/.test(tag) ? '/>' : '>';
    const inner = tag.replace(/^<\s*/, '').replace(/\/?>$/, '');
    const nameM = /^([a-zA-Z0-9:-]+)/.exec(inner);
    if (!nameM) return tag;
    const tagName = nameM[1];
    const after = inner.slice(tagName.length);
    const attrs = parseAttrs(after);
    if (attrs.length === 0) return tag;

    // detectar meta name/property para traducción de content
    const metaKey = (() => {
      if (tagName.toLowerCase() !== 'meta') return null;
      const n = attrs.find(a => a.name.toLowerCase() === 'name' || a.name.toLowerCase() === 'property');
      return n && n.value ? n.value.toLowerCase() : null;
    })();

    let rebuilt = '<' + tagName;
    for (const a of attrs) {
      let v = a.value;
      const ln = a.name.toLowerCase();
      if (v != null) {
        // reescritura de URLs
        if (URL_ATTRS.has(ln)) {
          const nv = rewriteUrl(v, pageDir, lang);
          if (nv != null) v = nv;
        } else if (ln === 'style') {
          v = rewriteCssUrls(v, pageDir, lang);
        }
        // traducción de atributos visibles
        if (TRANSLATABLE_ATTRS.has(ln) && translatable(norm(v))) {
          if (collect) collect.add(norm(v));
          else if (!lang.base) { const t = dict[norm(v)]; if (t != null) v = t; }
        }
        if (ln === 'content' && metaKey && META_TRANSLATE.has(metaKey) && translatable(norm(v))) {
          if (collect) collect.add(norm(v));
          else if (!lang.base) { const t = dict[norm(v)]; if (t != null) v = t; }
        }
      }
      if (v == null) rebuilt += ` ${a.name}`;
      else {
        const q = a.quote || '"';
        rebuilt += ` ${a.name}=${q}${v}${q}`;
      }
    }
    rebuilt += (closeSelf === '/>' ? ' />' : '>');
    return rebuilt;
  }

  return out;
}

// ---------- inyección de SEO + selector + runtime ----------
function buildSeoHead(pageRel, lang) {
  const canonical = absUrlFor(lang, pageRel);
  const alts = languages.map(l =>
    `  <link rel="alternate" hreflang="${l.hreflang}" href="${absUrlFor(l, pageRel)}">`
  ).join('\n');
  const xdefault = `  <link rel="alternate" hreflang="x-default" href="${absUrlFor(baseLang, pageRel)}">`;
  return [
    `  <link rel="canonical" href="${canonical}">`,
    alts,
    xdefault,
    `  <meta property="og:url" content="${canonical}">`,
    `  <meta property="og:locale" content="${lang.ogLocale}">`,
    ...languages.filter(l => l.code !== lang.code).map(l =>
      `  <meta property="og:locale:alternate" content="${l.ogLocale}">`),
    `  <meta property="og:type" content="website">`,
    `  <meta property="og:image" content="${site.domain}/images/ui/logo_livlin_with_text.png">`,
  ].join('\n');
}

function buildLangSwitch(pageRel, lang) {
  const items = languages.map(l => {
    const href = urlFor(l, pageRel);
    const active = l.code === lang.code ? ' aria-current="true"' : '';
    return `<li><a href="${href}" hreflang="${l.hreflang}" lang="${l.htmlLang}"${active} data-lang="${l.code}">${l.shortLabel} — ${l.label}</a></li>`;
  }).join('');
  return `<li class="nav-lang" data-lang-switch>\n          <button class="nav-lang-btn" aria-haspopup="listbox" aria-expanded="false">🌐 ${lang.shortLabel}</button>\n          <ul class="nav-lang-dropdown" role="listbox">${items}</ul>\n        </li>`;
}

function injectAll(html, pageRel, lang) {
  // <html lang>
  html = html.replace(/<html[^>]*>/i, `<html lang="${lang.htmlLang}">`);
  // SEO antes de </head>
  const seo = buildSeoHead(pageRel, lang);
  html = html.replace(/<\/head>/i, `${seo}\n</head>`);
  // selector tras el <li> del CTA de contacto
  const sw = buildLangSwitch(pageRel, lang);
  html = html.replace(
    /(<li>\s*<a[^>]*class="[^"]*nav-cta-green[^"]*"[\s\S]*?<\/a>\s*<\/li>)/i,
    `$1\n        ${sw}`
  );
  // globales + runtime antes de </body>
  const globals =
    `<script>window.LIVLIN_LANG=${JSON.stringify(lang.code)};` +
    `window.LIVLIN_LANGS=${JSON.stringify(languages.map(l => ({ code: l.code, dir: l.dir, htmlLang: l.htmlLang, label: l.label })))};</script>`;
  html = html.replace(/<\/body>/i, `  ${globals}\n  <script src="/js/i18n.js" defer></script>\n</body>`);
  return html;
}

// ---------- ejecución ----------
const pages = listHtml(SRC).sort();

if (mode === 'extract') {
  const collect = new Set();
  for (const pageRel of pages) {
    const html = readFileSync(join(SRC, pageRel), 'utf8');
    const pageDir = dirname(pageRel) === '.' ? '' : dirname(pageRel);
    processHtml(html, { lang: baseLang, pageDir, dict: {}, collect });
  }
  const sorted = [...collect].sort((a, b) => a.localeCompare(b, 'es'));
  const catalog = {};
  for (const s of sorted) catalog[s] = s;
  writeFileSync(join(__dirname, 'locales', '_catalog.json'), JSON.stringify(catalog, null, 2) + '\n', 'utf8');
  console.log(`Extraídos ${sorted.length} strings → locales/_catalog.json`);
  process.exit(0);
}

// build
function loadDict(code) {
  const p = join(__dirname, 'locales', `${code}.json`);
  if (!existsSync(p)) return {};
  try { return JSON.parse(readFileSync(p, 'utf8')); } catch (e) { console.error(`Error en ${code}.json:`, e.message); return {}; }
}

let written = 0;
for (const lang of languages) {
  const dict = lang.base ? {} : loadDict(lang.code);
  for (const pageRel of pages) {
    const srcHtml = readFileSync(join(SRC, pageRel), 'utf8');
    const pageDir = dirname(pageRel) === '.' ? '' : dirname(pageRel);
    let html = processHtml(srcHtml, { lang, pageDir, dict, collect: null });
    html = injectAll(html, pageRel, lang);
    const outRel = lang.dir ? join(lang.dir, pageRel) : pageRel;
    const outPath = join(OUT, outRel);
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, html, 'utf8');
    written++;
  }
}

// sitemap.xml con alternates hreflang
const urls = pages.map(pageRel => {
  const alts = languages.map(l =>
    `    <xhtml:link rel="alternate" hreflang="${l.hreflang}" href="${absUrlFor(l, pageRel)}"/>`
  ).join('\n');
  const xd = `    <xhtml:link rel="alternate" hreflang="x-default" href="${absUrlFor(baseLang, pageRel)}"/>`;
  return languages.map(l =>
    `  <url>\n    <loc>${absUrlFor(l, pageRel)}</loc>\n${alts}\n${xd}\n  </url>`
  ).join('\n');
}).join('\n');
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls}\n</urlset>\n`;
writeFileSync(join(OUT, 'sitemap.xml'), sitemap, 'utf8');

// robots.txt
writeFileSync(join(OUT, 'robots.txt'),
  `User-agent: *\nAllow: /\n\nSitemap: ${site.domain}/sitemap.xml\n`, 'utf8');

console.log(`Generadas ${written} páginas en ${languages.length} idiomas. sitemap.xml + robots.txt actualizados.`);
