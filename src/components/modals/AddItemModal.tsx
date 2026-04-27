import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { STONES, MEGA_STONES } from "@/src/data/special-items.ts";
import { FiX, FiInfo } from "react-icons/fi";
import ToggleSwitch from "@/src/components/toggles/ToggleSwitch";
import LocationSuggestionInput from "../inputs/LocationSuggestionInput.tsx";
import Tooltip from "@/src/components/other/Tooltip.tsx";
import { useFocusTrap } from "@/src/hooks/useFocusTrap.ts";
import {
  focusRingCardClasses,
  focusRingClasses,
  focusRingInputClasses,
} from "@/src/styles/focusRing.ts";
import {
  searchItems,
  type ItemSearchResult,
  getItemSpriteUrl,
  getItemName,
} from "@/src/services/itemSearch";
import { getSpriteUrlById } from "@/src/services/sprites";
import { normalizeLanguage } from "@/src/utils/language";

interface AddStoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (stoneId: string, location: string, inBag: boolean) => void;
  maxGeneration: number;
  gameVersionId?: string;
  generationSpritePath?: string | null;
  megaStoneSpriteStyle?: "item" | "pokemon";
  onMegaStoneSpriteStyleToggle?: (usePokemon: boolean) => void;
}

type Tab = "stones" | "items" | "mega";

const AddItemModal: React.FC<AddStoneModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  maxGeneration,
  gameVersionId,
  generationSpritePath,
  megaStoneSpriteStyle = "item",
  onMegaStoneSpriteStyleToggle,
}) => {
  const { t, i18n } = useTranslation();
  const { containerRef } = useFocusTrap(isOpen);
  const [activeTab, setActiveTab] = useState<Tab>("stones");
  const [selectedStoneId, setSelectedStoneId] = useState("");
  const [location, setLocation] = useState("");
  const [inBag, setInBag] = useState(true);

  // Item search state — mirrors EditPairModal's PokemonField pattern
  const [itemQuery, setItemQuery] = useState("");
  const [selectedItemSlug, setSelectedItemSlug] = useState("");
  const [suggestions, setSuggestions] = useState<ItemSearchResult[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const searchSeq = useRef(0);

  const locale = normalizeLanguage(i18n.language);

  const availableStones = useMemo(() => {
    return STONES.filter((s) => s.gen <= maxGeneration);
  }, [maxGeneration]);

  const showMegaTab =
    gameVersionId === "gen6_xy" || gameVersionId === "gen6_oras";

  const availableMegaStones = useMemo(() => {
    if (!showMegaTab) return [];
    if (gameVersionId === "gen6_xy")
      return MEGA_STONES.filter((m) => m.version === "XY");
    return MEGA_STONES; // ORAS gets all (XY + ORAS)
  }, [showMegaTab, gameVersionId]);

  // Debounced item search — same pattern as PokemonField
  useEffect(() => {
    if (!isOpen || !focused) {
      setSuggestions([]);
      setDropdownOpen(false);
      setActiveIndex(-1);
      return;
    }
    const seq = ++searchSeq.current;
    const term = itemQuery.trim();
    if (term.length < 1) {
      setSuggestions([]);
      setDropdownOpen(false);
      setActiveIndex(-1);
      return;
    }
    setDropdownOpen(true);
    const timer = setTimeout(() => {
      const res = searchItems(term, locale, gameVersionId, 20);
      if (seq === searchSeq.current) {
        setSuggestions(res);
        setDropdownOpen(true);
        setActiveIndex(res.length ? 0 : -1);
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [itemQuery, focused, isOpen, locale, gameVersionId]);

  if (!isOpen) return null;

  const spriteUrl = selectedItemSlug
    ? getItemSpriteUrl(selectedItemSlug)
    : null;
  const currentSelection =
    activeTab === "stones"
      ? selectedStoneId
      : activeTab === "mega"
        ? selectedStoneId
        : selectedItemSlug;

  const handleSubmit = (e: React.SubmitEvent) => {
    e.preventDefault();
    if (!currentSelection) return;
    const id =
      activeTab === "stones"
        ? selectedStoneId
        : activeTab === "mega"
          ? `item:${selectedStoneId}`
          : `item:${selectedItemSlug}`;
    onAdd(id, inBag ? "" : location, inBag);
    resetForm();
  };

  const resetForm = () => {
    setSelectedStoneId("");
    setSelectedItemSlug("");
    setItemQuery("");
    setSuggestions([]);
    setDropdownOpen(false);
    setActiveIndex(-1);
    setLocation("");
    setInBag(true);
  };

  const handleClose = () => {
    resetForm();
    setActiveTab("stones");
    onClose();
  };

  const selectItem = (result: ItemSearchResult) => {
    setSelectedItemSlug(result.slug);
    setItemQuery(result.name);
    setDropdownOpen(false);
  };

  const handleItemKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (
    e,
  ) => {
    if (e.key === "Tab") {
      setDropdownOpen(false);
      return;
    }
    if (!dropdownOpen || suggestions.length === 0) return;
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
      selectItem(suggestions[activeIndex]);
    } else if (e.key === "Escape") {
      setDropdownOpen(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold dark:text-gray-100">
            {activeTab === "stones"
              ? t("modals.addStone.title")
              : activeTab === "mega"
                ? t("modals.addStone.megaTitle")
                : t("modals.addStone.itemTitle")}
          </h2>
          <button
            onClick={handleClose}
            className={`text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 rounded-md ${focusRingClasses}`}
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 border-b border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={() => {
              setActiveTab("stones");
              resetForm();
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-t-md transition-colors ${focusRingClasses} ${
              activeTab === "stones"
                ? "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border border-b-0 border-gray-200 dark:border-gray-700"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            }`}
          >
            {t("modals.addStone.tabStones")}
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("items");
              setSelectedStoneId("");
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-t-md transition-colors ${focusRingClasses} ${
              activeTab === "items"
                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-b-0 border-gray-200 dark:border-gray-700"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            }`}
          >
            {t("modals.addStone.tabItems")}
          </button>
          {showMegaTab && (
            <button
              type="button"
              onClick={() => {
                setActiveTab("mega");
                resetForm();
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-t-md transition-colors ${focusRingClasses} ${
                activeTab === "mega"
                  ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-b-0 border-gray-200 dark:border-gray-700"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              {t("modals.addStone.tabMegaStones")}
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {activeTab === "stones" ? (
            /* ── Stone Grid ── */
            <div>
              <div className="flex items-center justify-between mb-2 h-8">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                  {t("modals.addStone.stoneLabel")}
                </label>
              </div>

              {availableStones.length > 0 ? (
                <div className="grid grid-cols-3 gap-2 p-1 max-h-64 overflow-y-auto custom-scrollbar">
                  {availableStones.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelectedStoneId(s.id)}
                      className={`flex flex-col items-center p-2 rounded-md border transition-all ${focusRingCardClasses} ${
                        selectedStoneId === s.id
                          ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                          : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                      }`}
                    >
                      <img
                        src={`/stone-sprites/${s.sprite}`}
                        alt={s.id}
                        className="w-10 h-10 object-contain"
                        style={{ imageRendering: "pixelated" }}
                      />
                      <span className="text-[10px] mt-1 text-center dark:text-gray-200">
                        {t(`stones.${s.id}`)}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-md border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
                  {t("modals.addStone.emptyListExplanation")}
                </div>
              )}
            </div>
          ) : activeTab === "mega" ? (
            /* ── Mega Stone Grid ── */
            <div>
              <div className="flex items-center justify-between mb-2 h-8">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                  {t("modals.addStone.megaStoneLabel")}
                </label>
                {onMegaStoneSpriteStyleToggle && (
                  <div className="flex items-center gap-1.5 scale-75 origin-right">
                    <span className="text-[15px] font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {t("modals.addStone.showPokemon")}
                    </span>
                    <ToggleSwitch
                      id="mega-sprite-toggle"
                      checked={megaStoneSpriteStyle === "pokemon"}
                      onChange={(val) => onMegaStoneSpriteStyleToggle(val)}
                      ariaLabel={t("modals.addStone.showPokemon")}
                    />
                  </div>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2 p-1 max-h-64 overflow-y-auto custom-scrollbar">
                {availableMegaStones.map((m) => {
                  const megaName = getItemName(m.id, locale);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedStoneId(m.id)}
                      className={`flex flex-col items-center p-2 rounded-md border transition-all ${focusRingCardClasses} ${
                        selectedStoneId === m.id
                          ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                          : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                      }`}
                    >
                      <img
                        src={
                          megaStoneSpriteStyle === "pokemon"
                            ? getSpriteUrlById(
                                m.pokemonId,
                                generationSpritePath,
                              )
                            : getItemSpriteUrl(m.id)
                        }
                        alt={megaName}
                        className="w-10 h-10 object-contain"
                        style={
                          megaStoneSpriteStyle !== "pokemon"
                            ? { imageRendering: "pixelated" }
                            : undefined
                        }
                        loading="lazy"
                      />
                      <span className="text-[10px] mt-1 text-center dark:text-gray-200">
                        {megaName}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* ── Item Search — same pattern as PokemonField ── */
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                {t("modals.addStone.itemLabel")}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={itemQuery}
                  onChange={(e) => {
                    setItemQuery(e.target.value);
                    setSelectedItemSlug("");
                  }}
                  onFocus={() => setFocused(true)}
                  onBlur={() =>
                    setTimeout(() => {
                      setFocused(false);
                      setDropdownOpen(false);
                    }, 150)
                  }
                  onKeyDown={handleItemKeyDown}
                  className={`w-full pr-14 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${focusRingInputClasses}`}
                  placeholder={t("modals.addStone.itemSearchPlaceholder")}
                  aria-autocomplete="list"
                  aria-expanded={dropdownOpen}
                />
                {spriteUrl ? (
                  <img
                    src={spriteUrl}
                    alt=""
                    aria-hidden="true"
                    className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none select-none h-10 w-10"
                    style={{ imageRendering: "pixelated" }}
                    loading="lazy"
                  />
                ) : null}
                {dropdownOpen && (
                  <div
                    className="absolute z-10 mt-1 w-full max-h-40 overflow-auto custom-scrollbar rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg"
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    {suggestions.length === 0 &&
                      itemQuery.trim().length >= 1 && (
                        <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                          {t("modals.common.noMatches")}
                        </div>
                      )}
                    {suggestions.map((result, idx) => (
                      <div
                        key={result.slug}
                        role="option"
                        aria-selected={idx === activeIndex}
                        tabIndex={-1}
                        onClick={() => selectItem(result)}
                        className={`flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-gray-900 dark:text-gray-100 hover:bg-indigo-50 dark:hover:bg-gray-700 cursor-pointer ${
                          idx === activeIndex
                            ? "bg-indigo-100 dark:bg-gray-700"
                            : ""
                        }`}
                      >
                        <img
                          src={result.spriteUrl}
                          alt=""
                          className="w-5 h-5 object-contain shrink-0"
                          style={{ imageRendering: "pixelated" }}
                          loading="lazy"
                        />
                        <span>{result.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 py-2">
            <input
              type="checkbox"
              id="stoneInBag"
              checked={inBag}
              onChange={(e) => {
                setInBag(e.target.checked);
                if (e.target.checked) setLocation("");
              }}
              disabled={
                activeTab === "stones" ? availableStones.length === 0 : false
              }
              className="h-4 w-4 accent-green-600 cursor-pointer disabled:cursor-not-allowed"
            />
            <label
              htmlFor="stoneInBag"
              className={`text-sm font-semibold dark:text-gray-200 cursor-pointer ${
                activeTab === "stones" && availableStones.length === 0
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
            >
              {t("modals.addStone.inBagLabel")}
            </label>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                {t("modals.addStone.locationLabel")}{" "}
                <span className="text-red-500">*</span>
              </label>
              <Tooltip
                side="top"
                content={t("modals.addStone.locationTooltip")}
              >
                <span
                  className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 cursor-help"
                  aria-label={t("modals.addStone.locationTooltipLabel")}
                >
                  <FiInfo size={16} />
                </span>
              </Tooltip>
            </div>
            <LocationSuggestionInput
              label=""
              value={inBag ? "" : location}
              onChange={setLocation}
              isOpen={isOpen}
              gameVersionId={gameVersionId}
              disabled={
                inBag ||
                (activeTab === "stones" && availableStones.length === 0)
              }
              placeholder={inBag ? "" : t("common.routePlaceholder")}
            />
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={handleClose}
              className={`px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 ${focusRingClasses}`}
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              disabled={!currentSelection || (!inBag && !location.trim())}
              className={`px-4 py-2 rounded-md font-semibold shadow ${focusRingClasses} ${
                currentSelection && (inBag || location.trim())
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
              }`}
            >
              {t("modals.addStone.submit")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddItemModal;
