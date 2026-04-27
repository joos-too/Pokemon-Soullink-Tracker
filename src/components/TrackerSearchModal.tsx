import React, { useEffect, useId, useMemo, useState } from "react";
import type { FossilEntry, PokemonLink, StoneEntry } from "@/types";
import { useTranslation } from "react-i18next";
import { useFocusTrap } from "@/src/hooks/useFocusTrap";
import {
  focusRingClasses,
  focusRingInputClasses,
} from "@/src/styles/focusRing";
import { getSpriteUrlForPokemonName } from "@/src/services/sprites";
import {
  getPokemonFamilyIdsMatchingQuery,
  getPokemonIdFromName,
} from "@/src/services/pokemonSearch";
import { FOSSILS, STONES, MEGA_STONES } from "@/src/services/init";
import { getItemName, getItemSpriteUrl } from "@/src/services/itemSearch";
import { normalizeLanguage } from "@/src/utils/language";

type SearchMode = "pokemon" | "routes" | "items";
type PokemonSectionKey = "team" | "box" | "graveyard";
type ItemCategory = "fossils" | "stones" | "megaStones" | "items";

const ROUTE_NUMBER_REGEX = /\broute[\s-]*(\d+)\b/i;

const parseRouteNumber = (value: string): number | null => {
  if (!value) return null;
  const match = ROUTE_NUMBER_REGEX.exec(value.trim());
  if (!match) return null;
  const routeNumber = Number(match[1]);
  return Number.isFinite(routeNumber) ? routeNumber : null;
};

const compareRoutes = (a: string, b: string): number => {
  const aRoute = parseRouteNumber(a);
  const bRoute = parseRouteNumber(b);
  if (aRoute !== null && bRoute !== null) {
    if (aRoute !== bRoute) return aRoute - bRoute;
  }
  const aLower = a.toLowerCase();
  const bLower = b.toLowerCase();
  if (aLower < bLower) return -1;
  if (aLower > bLower) return 1;
  return 0;
};

interface TrackerSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerNames: string[];
  playerColors: string[];
  team: PokemonLink[];
  box: PokemonLink[];
  graveyard: PokemonLink[];
  routes: string[];
  fossils: FossilEntry[][];
  stones: StoneEntry[][];
  generationSpritePath?: string | null;
}

interface PokemonSection {
  key: PokemonSectionKey;
  title: string;
  pairs: PokemonLink[];
}

const SEARCH_MODE_BUTTON_CLASS =
  "px-3 py-2 rounded-md text-sm font-semibold transition-colors";

interface ItemRow {
  category: ItemCategory;
  id: string;
  name: string;
  spriteUrl: string;
  playerIndex: number;
  status: string;
  location: string;
  pixelated: boolean;
}

const MEGA_STONE_IDS = new Set(MEGA_STONES.map((m) => m.id));

const TrackerSearchModal: React.FC<TrackerSearchModalProps> = ({
  isOpen,
  onClose,
  playerNames,
  playerColors,
  team,
  box,
  graveyard,
  routes,
  fossils,
  stones,
  generationSpritePath,
}) => {
  const { t, i18n } = useTranslation();
  const { containerRef } = useFocusTrap(isOpen);
  const titleId = useId();
  const [mode, setMode] = useState<SearchMode>("pokemon");
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setMode("pokemon");
    setQuery("");
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    setQuery("");
  }, [isOpen, mode]);

  const normalizedQuery = query.trim().toLowerCase();
  const matchingFamilyIds = useMemo(
    () =>
      normalizedQuery
        ? getPokemonFamilyIdsMatchingQuery(normalizedQuery)
        : new Set<number>(),
    [normalizedQuery],
  );

  const matchesPokemonQuery = (pair: PokemonLink) => {
    if (!normalizedQuery) {
      return pair.members.some((member) => member?.name?.trim().length);
    }

    return pair.members.some((member) => {
      const name = member?.name || "";
      const nickname = member?.nickname || "";
      if (
        name.toLowerCase().includes(normalizedQuery) ||
        nickname.toLowerCase().includes(normalizedQuery)
      ) {
        return true;
      }

      const pokemonId = getPokemonIdFromName(name);
      return pokemonId !== null && matchingFamilyIds.has(pokemonId);
    });
  };

  const pokemonSections = useMemo<PokemonSection[]>(() => {
    const sections: PokemonSection[] = [
      {
        key: "team",
        title: t("team.teamTitle"),
        pairs: team.filter(matchesPokemonQuery),
      },
      {
        key: "box",
        title: t("team.boxTitle"),
        pairs: box.filter(matchesPokemonQuery),
      },
      {
        key: "graveyard",
        title: t("graveyard.title"),
        pairs: [...graveyard].reverse().filter(matchesPokemonQuery),
      },
    ];

    return sections.filter((section) => section.pairs.length > 0);
  }, [box, graveyard, team, t, matchingFamilyIds, normalizedQuery]);

  const filteredRoutes = useMemo(() => {
    const uniqueRoutes = Array.from(new Set(routes)).sort(compareRoutes);
    if (!normalizedQuery) return uniqueRoutes;
    return uniqueRoutes.filter((route) =>
      route.toLowerCase().includes(normalizedQuery),
    );
  }, [normalizedQuery, routes]);

  const locale = normalizeLanguage(i18n.language);

  const allItems = useMemo<ItemRow[]>(() => {
    const rows: ItemRow[] = [];

    // Fossils
    (fossils ?? []).forEach((playerFossils, pIdx) => {
      (playerFossils ?? []).forEach((entry) => {
        const def = FOSSILS.find((f) => f.id === entry.fossilId);
        const status = entry.revived
          ? entry.pokemonName
            ? `${t("tracker.infoPanel.fossilRevived")}: ${entry.pokemonName}`
            : t("tracker.infoPanel.fossilRevived")
          : entry.inBag
            ? t("tracker.infoPanel.fossilBag")
            : t("tracker.infoPanel.fossilLocation", {
                location: entry.location,
              });
        rows.push({
          category: "fossils",
          id: entry.fossilId,
          name: t(`fossils.${entry.fossilId}`),
          spriteUrl: def ? `/fossil-sprites/${def.sprite}` : "",
          playerIndex: pIdx,
          status,
          location: entry.location,
          pixelated: true,
        });
      });
    });

    // Stones & items
    (stones ?? []).forEach((playerStones, pIdx) => {
      (playerStones ?? []).forEach((entry) => {
        const isCustomItem = entry.stoneId.startsWith("item:");
        const itemSlug = isCustomItem
          ? entry.stoneId.replace("item:", "")
          : null;
        const isMega = itemSlug ? MEGA_STONE_IDS.has(itemSlug) : false;
        const stoneDef = isCustomItem
          ? null
          : STONES.find((s) => s.id === entry.stoneId);

        let category: ItemCategory;
        let name: string;
        let spriteUrl: string;

        if (!isCustomItem && stoneDef) {
          category = "stones";
          name = t(`stones.${entry.stoneId}`);
          spriteUrl = `/stone-sprites/${stoneDef.sprite}`;
        } else if (isMega && itemSlug) {
          category = "megaStones";
          name = getItemName(itemSlug, locale);
          spriteUrl = getItemSpriteUrl(itemSlug);
        } else if (itemSlug) {
          category = "items";
          name = getItemName(itemSlug, locale);
          spriteUrl = getItemSpriteUrl(itemSlug);
        } else {
          category = "items";
          name = entry.stoneId;
          spriteUrl = "";
        }

        const status = entry.used
          ? t("tracker.infoPanel.stoneUsed")
          : entry.inBag
            ? t("tracker.infoPanel.stoneBag")
            : t("tracker.infoPanel.stoneLocation", {
                location: entry.location,
              });

        rows.push({
          category,
          id: entry.stoneId,
          name,
          spriteUrl,
          playerIndex: pIdx,
          status,
          location: entry.location,
          pixelated: true,
        });
      });
    });

    return rows;
  }, [fossils, stones, t, locale]);

  const itemSections = useMemo(() => {
    const categories: { key: ItemCategory; titleKey: string }[] = [
      { key: "fossils", titleKey: "tracker.infoPanel.fossilTracker" },
      { key: "stones", titleKey: "tracker.search.categoryStones" },
      { key: "megaStones", titleKey: "tracker.search.categoryMegaStones" },
      { key: "items", titleKey: "tracker.infoPanel.itemTracker" },
    ];

    return categories
      .map(({ key, titleKey }) => {
        const items = allItems.filter((item) => {
          if (item.category !== key) return false;
          if (!normalizedQuery) return true;
          return (
            item.name.toLowerCase().includes(normalizedQuery) ||
            item.location.toLowerCase().includes(normalizedQuery)
          );
        });
        return { key, title: t(titleKey), items };
      })
      .filter((section) => section.items.length > 0);
  }, [allItems, normalizedQuery, t]);

  const hasPokemonResults = pokemonSections.length > 0;
  const hasRouteResults = filteredRoutes.length > 0;
  const hasItemResults = itemSections.length > 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4 custom-scrollbar">
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-[40rem] max-h-[85vh] overflow-hidden"
      >
        <div className="px-6 py-4 flex justify-between items-center border-b border-gray-100 dark:border-gray-700">
          <h2 id={titleId} className="text-lg font-bold dark:text-gray-100">
            {t("tracker.search.title")}
          </h2>
          <button
            onClick={onClose}
            className={`text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 rounded-md ${focusRingClasses}`}
            aria-label={t("common.close")}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 space-y-4">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setMode("pokemon")}
              className={`${SEARCH_MODE_BUTTON_CLASS} ${
                mode === "pokemon"
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
              } ${focusRingClasses}`}
            >
              {t("tracker.search.modePokemon")}
            </button>
            <button
              type="button"
              onClick={() => setMode("routes")}
              className={`${SEARCH_MODE_BUTTON_CLASS} ${
                mode === "routes"
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
              } ${focusRingClasses}`}
            >
              {t("tracker.search.modeRoutes")}
            </button>
            <button
              type="button"
              onClick={() => setMode("items")}
              className={`${SEARCH_MODE_BUTTON_CLASS} ${
                mode === "items"
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
              } ${focusRingClasses}`}
            >
              {t("tracker.search.modeItems")}
            </button>
          </div>

          <input
            data-autofocus
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("common.searchPlaceholder")}
            aria-label={t("tracker.search.fieldLabel")}
            className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${focusRingInputClasses}`}
          />
        </div>

        <div className="px-6 pb-8 pt-4 overflow-y-auto max-h-[calc(85vh-170px)] custom-scrollbar">
          {mode === "pokemon" ? (
            hasPokemonResults ? (
              <div className="space-y-6 pb-2">
                {pokemonSections.map((section) => (
                  <div key={section.key} className="space-y-3">
                    <h3 className="text-sm font-press-start text-gray-800 dark:text-gray-200">
                      {section.title}
                    </h3>
                    <div className="space-y-3">
                      {section.pairs.map((pair) => (
                        <div
                          key={`${section.key}-${pair.id}`}
                          className="p-2 border border-gray-200 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-xs"
                        >
                          <p className="text-center font-bold text-gray-600 dark:text-gray-300 mb-1">
                            {t("graveyard.areaLabel", {
                              route: pair.route || t("common.unknownRoute"),
                            })}
                          </p>
                          <div
                            className="grid gap-2 justify-items-center"
                            style={{
                              gridTemplateColumns: `repeat(${playerNames.length}, minmax(0, 1fr))`,
                            }}
                          >
                            {playerNames.map((name, index) => {
                              const member = pair.members?.[index] ?? {
                                name: "",
                                nickname: "",
                              };
                              const spriteUrl = getSpriteUrlForPokemonName(
                                member.name,
                                generationSpritePath,
                              );
                              return (
                                <div
                                  key={`${section.key}-${pair.id}-player-${index}`}
                                  className="flex justify-center w-full"
                                >
                                  <div className="inline-flex items-center gap-2 text-left mb-2">
                                    {spriteUrl ? (
                                      <img
                                        src={spriteUrl}
                                        alt={member.name || "Pokemon"}
                                        className="w-16 h-16 -my-3"
                                        loading="lazy"
                                      />
                                    ) : null}
                                    <div className="flex flex-col items-start">
                                      <p
                                        className="font-bold"
                                        style={{
                                          color:
                                            playerColors[index] ?? "#4b5563",
                                        }}
                                      >
                                        {t("graveyard.memberTitle", {
                                          name,
                                          pokemon:
                                            member.name ||
                                            t("graveyard.unknownPokemon"),
                                        })}
                                      </p>
                                      <p className="text-gray-700 dark:text-gray-400">
                                        {t("graveyard.nicknameLabel", {
                                          nickname:
                                            member.nickname ||
                                            t("graveyard.noNickname"),
                                        })}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400 text-sm py-8">
                {normalizedQuery
                  ? t("modals.common.noMatches")
                  : t("tracker.search.emptyPokemon")}
              </p>
            )
          ) : mode === "routes" ? (
            hasRouteResults ? (
              <ul className="grid grid-cols-1 gap-2 pb-2 text-sm text-gray-800 dark:text-gray-200">
                {filteredRoutes.map((route) => (
                  <li
                    key={route}
                    className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md"
                  >
                    {route}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400 text-sm py-8">
                {normalizedQuery
                  ? t("modals.common.noMatches")
                  : t("tracker.search.emptyRoutes")}
              </p>
            )
          ) : hasItemResults ? (
            <div className="space-y-6 pb-2">
              {itemSections.map((section) => (
                <div key={section.key} className="space-y-2">
                  <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">
                    {section.title}
                  </h3>
                  <div className="space-y-1">
                    {section.items.map((item, idx) => (
                      <div
                        key={`${section.key}-${item.id}-${item.playerIndex}-${idx}`}
                        className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md text-xs"
                      >
                        {item.spriteUrl ? (
                          <img
                            src={item.spriteUrl}
                            alt=""
                            className="w-6 h-6 object-contain shrink-0"
                            style={
                              item.pixelated
                                ? { imageRendering: "pixelated" }
                                : undefined
                            }
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-6 h-6 shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <span className="font-bold text-gray-800 dark:text-gray-100">
                            {item.name}
                          </span>
                          <span className="ml-2 text-gray-500 dark:text-gray-400">
                            {item.status}
                          </span>
                        </div>
                        <span
                          className="text-xs font-semibold shrink-0"
                          style={{
                            color: playerColors[item.playerIndex] ?? "#4b5563",
                          }}
                        >
                          {playerNames[item.playerIndex] ?? ""}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400 text-sm py-8">
              {normalizedQuery
                ? t("modals.common.noMatches")
                : t("tracker.search.emptyItems")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrackerSearchModal;
