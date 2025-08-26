// src/i18n.js
const SUPPORTED = ['es','en','zh'];
const DEFAULT_LANG = (localStorage.getItem('lang') || navigator.language.slice(0,2)).toLowerCase();
export let currentLang = SUPPORTED.includes(DEFAULT_LANG) ? DEFAULT_LANG : 'es';

let dictionary = {};

function t(key){
  // Búsqueda "a.b.c" en el diccionario
  return key.split('.').reduce((o,k)=> (o && o[k] != null) ? o[k] : null, dictionary) ?? null;
}

export async function loadLang(lang){
  if(!SUPPORTED.includes(lang)) lang = 'es';
  try{
    // IMPORTANTE: ruta relativa para GitHub Pages
    const res = await fetch(`locales/${lang}.json`, {cache:'no-cache'});
    if(!res.ok) throw new Error(`Fetch locales/${lang}.json -> ${res.status}`);
    dictionary = await res.json();
    currentLang = lang;
    localStorage.setItem('lang', lang);
    document.documentElement.lang = lang;
    translatePage();
  }catch(err){
    console.error('i18n loadLang error:', err);
    // Fallback: no rompe la página si falla el JSON
    dictionary = {};
  }
}

function translateTextNodes(){
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const val = t(key);
    if(val != null) el.textContent = val;
  });
}

export function translateAttributes(){
  // Ej: data-i18n-attr="alt:services.s1.img_alt,aria-label:nav.aria_label"
  document.querySelectorAll('[data-i18n-attr]').forEach(el => {
    const spec = el.getAttribute('data-i18n-attr') || '';
    spec.split(',').forEach(pair=>{
      const [attr, keyRaw] = pair.split(':').map(s=> s && s.trim());
      if(!attr || !keyRaw) return;
      const val = t(keyRaw);
      if(val != null) el.setAttribute(attr, val);
    });
  });
}

function translateTitle(){
  const titleEl = document.querySelector('title');
  const key = titleEl?.getAttribute('data-i18n');
  if(key){
    const val = t(key);
    if(val != null) document.title = val;
  }
}

function translatePage(){
  translateTextNodes();
  translateAttributes();
  translateTitle();
}

export function setupLangSwitcher(){
  const float = document.querySelector('.float-lang');
  if(!float) return;
  const toggle = float.querySelector('.lang-btn[data-role="toggle"]');
  const setExpanded = (state)=> toggle && toggle.setAttribute('aria-expanded', String(state));

  toggle?.addEventListener('click', ()=>{
    const open = !float.classList.contains('open');
    float.classList.toggle('open');
    setExpanded(open);
  });

  ['es','en','zh'].forEach(code=>{
    const btn = float.querySelector(`.lang-btn[data-lang="${code}"]`);
    btn?.addEventListener('click', async ()=>{
      await loadLang(code);
      float.classList.remove('open');
      setExpanded(false);
    });
  });
}

export function setActiveNav(){
  const path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('nav a').forEach(a => {
    const href = a.getAttribute('href');
    if(href && path === href){ a.classList.add('active'); }
  });
}

export function observeFadeIns(){
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('fade-in'); io.unobserve(e.target); } });
  }, {threshold:.12});
  document.querySelectorAll('.card, .hero h1, .hero p, section').forEach(el=> io.observe(el));
}
