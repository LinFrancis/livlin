import './styles.css'; import {dictionaries as D} from './i18n.js'; const $=s=>document.querySelector(s); const $$=s=>[...document.querySelectorAll(s)];
const langSel=$('#lang'); const cur=localStorage.getItem('lang')||'es'; if(langSel) langSel.value=cur;
function t(lang){const d=D[lang]||D.es; $$('[data-i18n]').forEach(el=>{const k=el.getAttribute('data-i18n'); if(d[k]) el.textContent=d[k];}); document.documentElement.lang=lang; localStorage.setItem('lang',lang);}
langSel&&langSel.addEventListener('change',e=>t(e.target.value)); t(cur);