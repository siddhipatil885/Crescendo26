import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import hi from './locales/hi.json';
import mr from './locales/mr.json';
import ta from './locales/ta.json';
import te from './locales/te.json';

export const LANGUAGE_STORAGE_KEY = 'civix_language';

export const LANGUAGE_OPTIONS = [
  { code: 'en', shortLabel: 'EN', label: 'English' },
  { code: 'hi', shortLabel: 'HI', label: 'हिंदी' },
  { code: 'mr', shortLabel: 'MR', label: 'मराठी' },
  { code: 'ta', shortLabel: 'TA', label: 'தமிழ்' },
  { code: 'te', shortLabel: 'TE', label: 'తెలుగు' },
];

const resources = {
  en: { translation: en },
  hi: { translation: hi },
  mr: { translation: mr },
  ta: { translation: ta },
  te: { translation: te },
};

const detectionOptions = {
  order: ['localStorage', 'navigator', 'htmlTag'],
  caches: ['localStorage'],
  lookupLocalStorage: LANGUAGE_STORAGE_KEY,
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: LANGUAGE_OPTIONS.map((language) => language.code),
    load: 'languageOnly',
    nonExplicitSupportedLngs: true,
    defaultNS: 'translation',
    detection: detectionOptions,
    interpolation: {
      escapeValue: false,
    },
    returnNull: false,
  });

export default i18n;
