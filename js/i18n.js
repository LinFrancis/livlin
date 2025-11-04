// js/i18n.js — module i18n loader for LivLin
// Exports: loadLang(lang), translateAttributes()

let CURRENT_TRANSLATIONS = {};

function getNested(obj, key) {
  return key.split('.').reduce((o, k) => (o && o[k] != null ? o[k] : null), obj);
}

function applyTextTranslations(root = document) {
  root.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    const text = getNested(CURRENT_TRANSLATIONS, key);
    if (text != null) {
      el.innerHTML = text;
    }
  });
}

function applyAttrTranslations(root = document) {
  root.querySelectorAll("[data-i18n-attr]").forEach((el) => {
    // Example: data-i18n-attr="alt:services.s1.img_alt, title:services.s1.img_title"
    const spec = el.getAttribute("data-i18n-attr");
    if (!spec) return;
    spec.split(",").forEach(pair => {
      const [attr, key] = pair.split(":").map(s => s.trim());
      if (!attr || !key) return;
      const val = getNested(CURRENT_TRANSLATIONS, key);
      if (val != null) el.setAttribute(attr, val);
    });
  });
}

// Public: apply both text and attributes
export function translateAttributes() {
  applyTextTranslations();
  applyAttrTranslations();
}

// Public: load a language JSON, store globally, then apply
export async function loadLang(lang) {
  const supported = ["es", "en", "zh", "dk"];
  const safe = supported.includes(lang) ? lang : "es";
  try {
    const res = await fetch(`lang/${safe}.json`, { cache: "no-store" });
    if (!res.ok) throw new Error(`Missing lang file: ${safe}`);
    CURRENT_TRANSLATIONS = await res.json();
  } catch (e) {
    console.error("[i18n] Error loading translations:", e);
    CURRENT_TRANSLATIONS = {};
  }
  translateAttributes();
}

// Optional: expose for debugging
export function getCurrentTranslations() {
  return CURRENT_TRANSLATIONS;
}


function updateLB(){
  const item = galleries[currentGroup][currentIndex];
  lbImg.src = item.src;
  lbImg.alt = item.el?.alt || '';
}
