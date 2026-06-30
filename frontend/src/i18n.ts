import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import fr from './locales/fr/translation.json';
import en from './locales/en/translation.json';
import ar from './locales/ar/translation.json';

const savedLanguage = localStorage.getItem('lang') || 'fr';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      fr: { translation: fr },
      en: { translation: en },
      ar: { translation: ar },
    },
    lng: savedLanguage,
    fallbackLng: 'fr',
    interpolation: {
      escapeValue: false, // React already escapes
    },
  });

export default i18n;
