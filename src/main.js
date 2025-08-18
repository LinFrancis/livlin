import { dictionaries } from './i18n.js';

let showPinyin = localStorage.getItem('pinyin') === 'true';

function stripPinyin(html) {
  return html.replace(/<span class=['"]pinyin['"]>.*?<\/span>/g, '');
}

function applyLang(lang) {
  const dict = dictionaries[lang] || dictionaries.es;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    let val = dict[key] || '';
    if (lang === 'zh' && !showPinyin) val = stripPinyin(val);
    el.innerHTML = val;
  });
  document.documentElement.lang = (lang === 'zh' ? 'zh-Hans' : lang);
  localStorage.setItem('lang', lang);
  localStorage.setItem('pinyin', showPinyin);
}

document.getElementById('lang')?.addEventListener('change', e => {
  applyLang(e.target.value);
});

document.getElementById('pinyinToggle')?.addEventListener('click', () => {
  showPinyin = !showPinyin;
  applyLang(document.getElementById('lang').value);
});

// init
const savedLang = localStorage.getItem('lang') || 'es';
applyLang(savedLang);
document.getElementById('lang').value = savedLang;