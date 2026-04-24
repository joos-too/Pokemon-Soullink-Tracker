import React, { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { searchLocations } from "@/src/services/locationSearch.ts";
import { normalizeLanguage } from "@/src/utils/language.ts";
import SuggestionInput from "@/src/components/inputs/SuggestionInput.tsx";

interface LocationSuggestionInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  isOpen: boolean;
  gameVersionId?: string;
  placeholder?: string;
  disabled?: boolean;
}

const LocationSuggestionInput: React.FC<LocationSuggestionInputProps> = ({
  label,
  value,
  onChange,
  isOpen,
  gameVersionId,
  placeholder,
  disabled = false,
}) => {
  const { t, i18n } = useTranslation();
  const language = useMemo(
    () => normalizeLanguage(i18n.language),
    [i18n.language],
  );
  const fetchSuggestions = useCallback(
    (term: string) =>
      searchLocations(term, 1000, {
        locale: language,
        gameVersionId,
      }),
    [gameVersionId, language],
  );

  return (
    <SuggestionInput
      id="route"
      label={label}
      value={value}
      onChange={onChange}
      fetchSuggestions={fetchSuggestions}
      isOpen={isOpen}
      placeholder={placeholder || t("common.routePlaceholder")}
      disabled={disabled}
    />
  );
};

export default LocationSuggestionInput;
