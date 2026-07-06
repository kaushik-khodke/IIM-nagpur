import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Keep English static so the app never fails to load its default UI
import enCommon from '../locales/en/common.json';
import enAuth from '../locales/en/auth.json';
import enDashboard from '../locales/en/dashboard.json';
import enPages from '../locales/en/pages.json';
import enMessages from '../locales/en/messages.json';
import enValidation from '../locales/en/validation.json';
import enStatic from '../locales/en/static.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    ns: ['common', 'auth', 'dashboard', 'pages', 'messages', 'validation', 'static'],
    defaultNS: 'common',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
  });

// Add static English fallback immediately
i18n.addResourceBundle('en', 'common', enCommon, true, true);
i18n.addResourceBundle('en', 'auth', enAuth, true, true);
i18n.addResourceBundle('en', 'dashboard', enDashboard, true, true);
i18n.addResourceBundle('en', 'pages', enPages, true, true);
i18n.addResourceBundle('en', 'messages', enMessages, true, true);
i18n.addResourceBundle('en', 'validation', enValidation, true, true);
i18n.addResourceBundle('en', 'static', enStatic, true, true);

// Guard to prevent infinite recursion/loop when emitting languageChanged
let isFetchingOverrides = false;

// Function to fetch all database overrides for a given language in a single call and deep-merge them
const loadLanguageOverrides = async (lng: string) => {
  if (isFetchingOverrides || !lng) return;
  isFetchingOverrides = true;
  
  try {
    // Map regional codes like 'en-IN' or 'en-US' to base language 'en'
    const baseLng = lng.split('-')[0];
    
    // Resolve absolute URL manually since i18n/config is imported before window.fetch is overridden in main.tsx
    const backendUrl = import.meta.env.VITE_BACKEND_URL || "";
    const base = backendUrl.endsWith("/") ? backendUrl.slice(0, -1) : backendUrl;
    const url = `${base}/api/translations/${baseLng}`;

    const res = await fetch(url);
    if (res.ok) {
      const overrides = await res.json();
      Object.keys(overrides).forEach(ns => {
        // Deep-merge into the base language bundle
        i18n.addResourceBundle(baseLng, ns, overrides[ns], true, true);
        
        // Also merge into the active regional language bundle (e.g. 'en-IN') so it takes effect immediately
        if (baseLng !== lng) {
          i18n.addResourceBundle(lng, ns, overrides[ns], true, true);
        }
      });
      
      // Force react-i18next components to immediately re-render with the new translations
      i18n.emit('languageChanged', lng);
    }
  } catch (err) {
    console.error('Failed to load database translation overrides:', err);
  } finally {
    isFetchingOverrides = false;
  }
};

// Load overrides initially for current detected language
if (i18n.language) {
  loadLanguageOverrides(i18n.language);
}

// Automatically fetch and apply overrides whenever language changes
i18n.on('languageChanged', (lng) => {
  if (lng) {
    loadLanguageOverrides(lng);
  }
});

export default i18n;
