import React from "react";
import { FiChevronDown } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { focusRingClasses } from "@/src/styles/focusRing";
import { normalizeLanguage } from "@/src/utils/language";

const languages = [
  { code: "de", labelKey: "common.languageNames.de" },
  { code: "en", labelKey: "common.languageNames.en" },
];

const LanguageToggle: React.FC = () => {
  const { i18n, t } = useTranslation();
  const activeLanguage = normalizeLanguage(i18n.language);

  const handleChange = async (code: string) => {
    if (code === activeLanguage) return;
    try {
      await i18n.changeLanguage(code);
    } catch (error) {
      console.error("Failed to switch language", error);
    }
  };

  const fontFamily = "'Roboto', 'Helvetica Neue', Helvetica, Arial, sans-serif";

  return (
    <label className="relative inline-flex w-full max-w-sm">
      <span className="sr-only">{t("common.languageToggleLabel")}</span>
      <select
        aria-label={t("common.languageToggleLabel")}
        value={activeLanguage}
        onChange={(event) => {
          void handleChange(event.target.value);
        }}
        className={`appearance-none w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 font-roboto font-semibold pr-12 text-base px-4 py-2 ${focusRingClasses}`}
        style={{ fontFamily }}
      >
        {languages.map((language) => (
          <option
            key={language.code}
            value={language.code}
            style={{ fontFamily }}
          >
            {t(language.labelKey)}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-500 dark:text-gray-400">
        <FiChevronDown aria-hidden="true" className="text-lg" />
      </span>
    </label>
  );
};

export default LanguageToggle;
