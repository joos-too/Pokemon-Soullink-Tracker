import React, { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  getItemSpriteUrl,
  searchItems,
  type ItemSearchResult,
} from "@/src/services/itemSearch";
import { normalizeLanguage } from "@/src/utils/language";
import SuggestionInput from "@/src/components/inputs/SuggestionInput.tsx";

interface ItemSuggestionInputProps {
  label?: React.ReactNode;
  value: string;
  selectedSlug: string;
  onChange: (value: string) => void;
  onSelectedSlugChange: (slug: string) => void;
  isOpen: boolean;
  gameVersionId?: string;
  placeholder?: string;
  showNoMatches?: boolean;
}

const ItemSuggestionInput: React.FC<ItemSuggestionInputProps> = ({
  label,
  value,
  selectedSlug,
  onChange,
  onSelectedSlugChange,
  isOpen,
  gameVersionId,
  placeholder,
  showNoMatches = true,
}) => {
  const { t, i18n } = useTranslation();
  const language = useMemo(
    () => normalizeLanguage(i18n.language),
    [i18n.language],
  );
  const spriteUrl = selectedSlug ? getItemSpriteUrl(selectedSlug) : null;

  const fetchSuggestions = useCallback(
    (term: string) =>
      Promise.resolve(searchItems(term, language, gameVersionId, 20)),
    [gameVersionId, language],
  );

  return (
    <SuggestionInput<ItemSearchResult>
      label={label}
      value={value}
      onChange={(nextValue) => {
        onChange(nextValue);
        onSelectedSlugChange("");
      }}
      fetchSuggestions={fetchSuggestions}
      isOpen={isOpen}
      placeholder={placeholder || t("modals.addStone.itemSearchPlaceholder")}
      minSearchLength={1}
      debounceMs={150}
      inputClassName="pr-14"
      showNoMatches={showNoMatches}
      getSuggestionValue={(suggestion) => suggestion.name}
      getSuggestionKey={(suggestion) => suggestion.slug}
      onSelectSuggestion={(suggestion) => onSelectedSlugChange(suggestion.slug)}
      renderSuggestion={(suggestion) => (
        <div className="flex items-center gap-2">
          <img
            src={suggestion.spriteUrl}
            alt=""
            className="h-5 w-5 shrink-0 object-contain"
            style={{ imageRendering: "pixelated" }}
            loading="lazy"
          />
          <span>{suggestion.name}</span>
        </div>
      )}
      endAdornment={
        spriteUrl ? (
          <img
            src={spriteUrl}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-2 my-auto h-10 w-10 select-none"
            style={{ imageRendering: "pixelated" }}
            loading="lazy"
          />
        ) : null
      }
    />
  );
};

export default ItemSuggestionInput;
