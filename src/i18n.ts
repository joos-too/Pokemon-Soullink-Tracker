import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { de } from '@/src/locales/de';
import { en } from '@/src/locales/en';

export const LANGUAGE_STORAGE_KEY = 'soullink:language';

const getInitialLanguage = () => {
  if (typeof window === 'undefined') {
    return 'en';
  }
  const stored = window.localStorage?.getItem(LANGUAGE_STORAGE_KEY);
  if (stored === 'de' || stored === 'en') {
    return stored;
  }
  const browser = window.navigator?.language ?? '';
  if (browser.toLowerCase().startsWith('de')) {
    return 'de';
  }
  return 'en';
};

i18n
  .use(initReactI18next)
  .init({
    resources: {
      de: { translation: de },
      en: { translation: en },
    },
    lng: getInitialLanguage(),
    fallbackLng: 'de',
    interpolation: {
      escapeValue: false,
    },
    returnNull: false,
  })
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error('i18n init failed', error);
  });

i18n.on('languageChanged', (lng) => {
  if (typeof window === 'undefined') {
    return;
  }
  if (lng === 'de' || lng === 'en') {
    window.localStorage?.setItem(LANGUAGE_STORAGE_KEY, lng);
  }
});

export default i18n;
