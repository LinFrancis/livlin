// Simple i18n loader using external JSON files (ES/EN/ZH).
// Stores chosen language in localStorage and updates all [data-i18n] elements.
const SUPPORTED = ['es','en','zh'];
const DEFAULT_LANG = localStorage.getItem('lang') || navigator.language.slice(0,2).toLowerCase();
export let currentLang = SUPPORTED.includes(DEFAULT_LANG) ? DEFAULT_LANG : 'es';

let dictionary = {};

export async function loadLang(lang){
  if(!SUPPORTED.includes(lang)) lang = 'es';
  const res = await fetch(`/locales/${lang}.json`);
  dictionary = await res.json();
  currentLang = lang;
  localStorage.setItem('lang', lang);
  translatePage();
}

export function t(key){ return key.split('.').reduce((o,k)=> (o||{})[k], dictionary) || key; }

export function translatePage(){
  document.querySelectorAll('[data-i18n]').forEach(el=>{
    const key = el.getAttribute('data-i18n');
    const val = t(key);
    if(val){
      if(el.tagName === 'INPUT' && el.placeholder !== undefined){
        el.placeholder = val;
      } else {
        el.innerHTML = val;
      }
    }
  });
  // also update title
  const titleKey = document.querySelector('title')?.getAttribute('data-i18n');
  if(titleKey){ document.title = t(titleKey); }
}

export function setupLangSwitcher(){
  const float = document.querySelector('.float-lang');
  if(!float) return;
  const toggle = float.querySelector('.lang-btn[data-role="toggle"]');
  const esBtn = float.querySelector('.lang-btn[data-lang="es"]');
  const enBtn = float.querySelector('.lang-btn[data-lang="en"]');
  const zhBtn = float.querySelector('.lang-btn[data-lang="zh"]');

  toggle?.addEventListener('click', ()=> float.classList.toggle('open'));
  [esBtn,enBtn,zhBtn].forEach(btn => btn?.addEventListener('click', async e=>{
    const lang = e.currentTarget.getAttribute('data-lang');
    await loadLang(lang);
    float.classList.remove('open');
  }));
}

export function setActiveNav(){
  const path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('nav a').forEach(a => {
    const href = a.getAttribute('href');
    if(href && path === href){ a.classList.add('active'); }
  });
}

// Intersection animation
export function observeFadeIns(){
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('fade-in'); io.unobserve(e.target); } });
  }, {threshold:.12});
  document.querySelectorAll('.card, .hero h1, .hero p, section').forEach(el=> io.observe(el));
}