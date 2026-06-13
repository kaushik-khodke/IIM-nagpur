import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enCommon from './locales/en/common.json';
import enAuth from './locales/en/auth.json';
import enDashboard from './locales/en/dashboard.json';
import enPages from './locales/en/pages.json';
import enMessages from './locales/en/messages.json';
import enValidation from './locales/en/validation.json';
import enStatic from './locales/en/static.json';

import hiCommon from './locales/hi/common.json';
import hiAuth from './locales/hi/auth.json';
import hiDashboard from './locales/hi/dashboard.json';
import hiPages from './locales/hi/pages.json';
import hiMessages from './locales/hi/messages.json';
import hiValidation from './locales/hi/validation.json';
import hiStatic from './locales/hi/static.json';

import mrCommon from './locales/mr/common.json';
import mrAuth from './locales/mr/auth.json';
import mrDashboard from './locales/mr/dashboard.json';
import mrPages from './locales/mr/pages.json';
import mrMessages from './locales/mr/messages.json';
import mrValidation from './locales/mr/validation.json';
import mrStatic from './locales/mr/static.json';

const resources = {
  en: {
    common: enCommon,
    auth: enAuth,
    dashboard: enDashboard,
    pages: enPages,
    messages: enMessages,
    validation: enValidation,
    static: enStatic,
  },
  hi: {
    common: hiCommon,
    auth: hiAuth,
    dashboard: hiDashboard,
    pages: hiPages,
    messages: hiMessages,
    validation: hiValidation,
    static: hiStatic,
  },
  mr: {
    common: mrCommon,
    auth: mrAuth,
    dashboard: mrDashboard,
    pages: mrPages,
    messages: mrMessages,
    validation: mrValidation,
    static: mrStatic,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    ns: ['common'],
    defaultNS: 'common',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
  });

export default i18n;
