// i18n.js - LivLin multilingual system

document.addEventListener("DOMContentLoaded", () => {
  const langSelect = document.getElementById("lang-switcher");
  const defaultLang = detectLanguage();
  loadLanguage(defaultLang);

  langSelect.value = defaultLang;
  langSelect.addEventListener("change", (e) => {
    const selectedLang = e.target.value;
    loadLanguage(selectedLang);
    localStorage.setItem("lang", selectedLang);
  });
});

function detectLanguage() {
  const saved = localStorage.getItem("lang");
  if (saved) return saved;
  const browserLang = navigator.language.slice(0, 2);
  const supported = ["es", "en", "zh", "dk"];
  return supported.includes(browserLang) ? browserLang : "es";
}

async function loadLanguage(lang) {
  try {
    const response = await fetch(`lang/${lang}.json`);
    if (!response.ok) throw new Error("Language file not found");
    const translations = await response.json();
    applyTranslations(translations);
  } catch (error) {
    console.error("Error loading language:", error);
  }
}

function applyTranslations(translations) {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    const text = getNestedTranslation(translations, key);
    if (text) el.innerHTML = text;
  });
}

function getNestedTranslation(obj, key) {
  return key.split(".").reduce((o, i) => (o ? o[i] : null), obj);
}
