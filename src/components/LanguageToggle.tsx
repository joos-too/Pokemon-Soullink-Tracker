import React from 'react';
import { useTranslation } from 'react-i18next';
import { focusRingClasses } from '@/src/styles/focusRing';

const languages = [
  { code: 'de', label: 'DE' },
  { code: 'en', label: 'EN' },
];

const normalizeLanguage = (lng?: string) => {
  if (!lng) return 'de';
  if (lng.startsWith('de')) return 'de';
  if (lng.startsWith('en')) return 'en';
  return 'de';
};

interface LanguageToggleProps {
  size?: 'standard' | 'large';
}

const LanguageToggle: React.FC<LanguageToggleProps> = ({ size = 'standard' }) => {
  const { i18n, t } = useTranslation();
  const activeLanguage = normalizeLanguage(i18n.language);

  const handleChange = async (code: string) => {
    if (code === activeLanguage) return;
    try {
      await i18n.changeLanguage(code);
    } catch (error) {
      console.error('Failed to switch language', error);
    }
  };

  return (
      <div
        className="inline-flex rounded-full border border-gray-300 dark:border-gray-600 overflow-hidden"
        role="group"
        aria-label={t('common.languageToggleLabel')}
      >
        {languages.map((language, index) => {
          const isActive = language.code === activeLanguage;
          const roundedClass =
            index === 0
              ? 'rounded-l-full'
              : index === languages.length - 1
                ? 'rounded-r-full'
                : '';
          return (
            <button
              key={language.code}
              type="button"
              onClick={() => handleChange(language.code)}
              className={`${
                size === 'large'
                  ? 'px-4 py-2 text-sm'
                  : 'px-3 py-1 text-xs'
              } font-semibold tracking-[0.2em] ${
                isActive
                  ? 'bg-green-600 text-white'
                  : 'bg-transparent text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
              } ${roundedClass} ${focusRingClasses}`}
            aria-pressed={isActive}
          >
            {language.label}
          </button>
        );
      })}
    </div>
  );
};

export default LanguageToggle;
