import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';

// Keep English static so the app never fails to load its default UI
import enCommon from '../locales/en/common.json';
import enAuth from '../locales/en/auth.json';
import enDashboard from '../locales/en/dashboard.json';
import enPages from '../locales/en/pages.json';
import enMessages from '../locales/en/messages.json';
import enValidation from '../locales/en/validation.json';
import enStatic from '../locales/en/static.json';

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    ns: ['common', 'auth', 'dashboard', 'pages', 'messages', 'validation', 'static'],
    defaultNS: 'common',
    interpolation: {
      escapeValue: false,
    },
    backend: {
      // Dynamic translation overrides from DB
      loadPath: '/api/translations/{{lng}}/{{ns}}',
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

export default i18n;
