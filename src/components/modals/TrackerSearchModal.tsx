import React, { useEffect, useId, useMemo, useState } from "react";
import type { PokemonLink } from "@/types.ts";
import { useTranslation } from "react-i18next";
import { useFocusTrap } from "@/src/hooks/useFocusTrap.ts";
import {
  focusRingClasses,
  focusRingInputClasses,
} from "@/src/styles/focusRing.ts";
import { getSpriteUrlForPokemonName } from "@/src/services/sprites.ts";
import {
  getPokemonFamilyIdsMatchingQuery,
  getPokemonIdFromName,
} from "@/src/services/pokemonSearch.ts";
import { compareRoutes } from "@/src/utils/routes.ts";

type SearchMode = "pokemon" | "routes";
type PokemonSectionKey = "team" | "box" | "graveyard";

interface TrackerSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerNames: string[];
  playerColors: string[];
  team: PokemonLink[];
  box: PokemonLink[];
  graveyard: PokemonLink[];
  routes: string[];
  generationSpritePath?: string | null;
}

interface PokemonSection {
  key: PokemonSectionKey;
  title: string;
  pairs: PokemonLink[];
}

const SEARCH_MODE_BUTTON_CLASS =
  "px-3 py-2 rounded-md text-sm font-semibold transition-colors";

const TrackerSearchModal: React.FC<TrackerSearchModalProps> = ({
  isOpen,
  onClose,
  playerNames,
  playerColors,
  team,
  box,
  graveyard,
  routes,
  generationSpritePath,
}) => {
  const { t } = useTranslation();
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

  const hasPokemonResults = pokemonSections.length > 0;
  const hasRouteResults = filteredRoutes.length > 0;

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
          ) : hasRouteResults ? (
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
          )}
        </div>
      </div>
    </div>
  );
};

export default TrackerSearchModal;
