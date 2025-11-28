import React, { useEffect, useMemo, useRef, useState } from "react";
import { searchLocations } from "@/src/services/locationSearch";
import { focusRingInputClasses } from "@/src/styles/focusRing";
import { useTranslation } from "react-i18next";
import { normalizeLanguage } from "@/src/utils/language";

interface LocationSuggestionInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  isOpen: boolean;
  gameVersionId?: string;
  placeholder?: string;
}

const LocationSuggestionInput: React.FC<LocationSuggestionInputProps> = ({
  label,
  value,
  onChange,
  isOpen,
  gameVersionId,
  placeholder,
}) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const searchSeq = useRef(0);
  const { t, i18n } = useTranslation();
  const language = useMemo(
    () => normalizeLanguage(i18n.language),
    [i18n.language],
  );

  useEffect(() => {
    if (!isOpen) {
      setSuggestions([]);
      setLoading(false);
      setOpen(false);
      setActiveIndex(-1);
      return;
    }
    if (!focused) {
      setSuggestions([]);
      setLoading(false);
      setOpen(false);
      setActiveIndex(-1);
      return;
    }
    const seq = ++searchSeq.current;
    const term = value.trim();
    if (term.length < 2) {
      setSuggestions([]);
      setLoading(false);
      setOpen(false);
      setActiveIndex(-1);
      return;
    }
    setLoading(true);
    setOpen(true);
    const timer = setTimeout(async () => {
      const res = await searchLocations(term, 1000, {
        locale: language,
        gameVersionId,
      });
      if (seq === searchSeq.current) {
        setSuggestions(res);
        setLoading(false);
        setOpen(res.length > 0);
        setActiveIndex(res.length ? 0 : -1);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [value, focused, isOpen, language, gameVersionId]);

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Tab") {
      setOpen(false);
      return;
    }
    if (!open || loading || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex(
        (prev) => (prev - 1 + suggestions.length) % suggestions.length,
      );
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      onChange(suggestions[activeIndex]);
      setOpen(false);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div>
      <label
        htmlFor="route"
        className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1"
      >
        {label} <span className="text-red-500">*</span>
      </label>
      <div className="relative">
        <input
          id="route"
          type="text"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() =>
            setTimeout(() => {
              setFocused(false);
              setOpen(false);
            }, 150)
          }
          onKeyDown={handleKeyDown}
          className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${focusRingInputClasses}`}
          placeholder={placeholder || t("common.routePlaceholder")}
          required
          aria-expanded={open}
        />
        {open && suggestions.length > 0 && (
          <div className="absolute z-10 mt-1 w-full max-h-56 overflow-auto rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg">
            {loading && (
              <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                {t("modals.common.loadingSuggestions")}
              </div>
            )}
            {!loading &&
              suggestions.map((s, idx) => (
                <div
                  key={`${s}-${idx}`}
                  role="option"
                  aria-selected={idx === activeIndex}
                  tabIndex={-1}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onChange(s);
                    setOpen(false);
                  }}
                  className={`block w-full text-left px-3 py-2 text-sm text-gray-900 dark:text-gray-100 hover:bg-indigo-50 dark:hover:bg-gray-700 ${idx === activeIndex ? "bg-indigo-100 dark:bg-gray-700" : ""}`}
                >
                  {s}
                </div>
              ))}
            {!loading && suggestions.length === 0 && (
              <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                {t("modals.common.noMatches")}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationSuggestionInput;
