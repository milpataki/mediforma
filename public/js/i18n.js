'use strict';

/**
 * Internationalisation bootstrap — i18next + HTTP backend + browser detector.
 *
 * Detection priority (first match wins):
 *   1. localStorage   — persists the user's explicit choice across visits
 *   2. navigator      — browser / OS / keyboard language  (navigator.languages)
 *   3. htmlTag        — <html lang="…"> fallback
 *
 * Supported languages: en, hu
 * Fallback:            en
 */

const SUPPORTED_LANGS = ['en', 'hu'];
const LS_KEY = 'mediforma-lang';

// ── Initialise ──────────────────────────────────────────────────────────────
i18next
  .use(i18nextHttpBackend)
  .use(i18nextBrowserLanguageDetector)
  .init({
    fallbackLng: 'en',
    supportedLngs: SUPPORTED_LANGS,
    load: 'languageOnly',           // strip region: 'hu-HU' → 'hu'
    nonExplicitSupportedLngs: true, // 'en-US' satisfies 'en'
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: LS_KEY,
    },
    backend: {
      loadPath: '/locales/{{lng}}/translation.json',
    },
    interpolation: {
      escapeValue: false,
    },
  })
  .then(() => {
    applyTranslations();
    syncLangSelector();
    document.documentElement.lang = i18next.language;
  });

// ── DOM update ───────────────────────────────────────────────────────────────
function applyTranslations() {
  // Text nodes (safe — no HTML interpreted)
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = i18next.t(el.dataset.i18n);
  });

  // Nodes that intentionally contain markup (e.g. hero title with <br>, <em>)
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    el.innerHTML = i18next.t(el.dataset.i18nHtml);
  });

  // Input / textarea placeholder attributes
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = i18next.t(el.dataset.i18nPlaceholder);
  });

  // aria-label attributes
  document.querySelectorAll('[data-i18n-aria]').forEach(el => {
    el.setAttribute('aria-label', i18next.t(el.dataset.i18nAria));
  });
}

// ── Language switcher ────────────────────────────────────────────────────────
const LANG_META = {
  en: { flag: '🇬🇧', code: 'EN' },
  hu: { flag: '🇭🇺', code: 'HU' },
};

function syncLangSelector() {
  const current = i18next.language;
  const meta = LANG_META[current] ?? LANG_META.en;

  const dropdown = document.getElementById('lang-dropdown');
  if (!dropdown) return;

  const flag = dropdown.querySelector('.lang-dropdown__flag');
  const code = dropdown.querySelector('.lang-dropdown__code');
  if (flag) flag.textContent = meta.flag;
  if (code) code.textContent = meta.code;

  dropdown.querySelectorAll('.lang-option').forEach(opt => {
    opt.setAttribute('aria-selected', String(opt.dataset.lang === current));
  });
}

async function changeLanguage(lang) {
  if (!SUPPORTED_LANGS.includes(lang)) return;
  await i18next.changeLanguage(lang);
  document.documentElement.lang = lang;
  applyTranslations();
  syncLangSelector();
}

// ── Dropdown open / close ────────────────────────────────────────────────────
function openDropdown() {
  const dropdown = document.getElementById('lang-dropdown');
  if (!dropdown) return;
  dropdown.classList.add('open');
  dropdown.querySelector('.lang-dropdown__toggle')?.setAttribute('aria-expanded', 'true');
}

function closeDropdown() {
  const dropdown = document.getElementById('lang-dropdown');
  if (!dropdown) return;
  dropdown.classList.remove('open');
  dropdown.querySelector('.lang-dropdown__toggle')?.setAttribute('aria-expanded', 'false');
}

document.addEventListener('click', e => {
  if (e.target.closest('.lang-dropdown__toggle')) {
    const isOpen = document.getElementById('lang-dropdown')?.classList.contains('open');
    isOpen ? closeDropdown() : openDropdown();
    return;
  }

  const option = e.target.closest('.lang-option');
  if (option?.dataset.lang) {
    changeLanguage(option.dataset.lang);
    closeDropdown();
    return;
  }

  // Click outside → close
  if (!e.target.closest('#lang-dropdown')) {
    closeDropdown();
  }
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeDropdown();
});
