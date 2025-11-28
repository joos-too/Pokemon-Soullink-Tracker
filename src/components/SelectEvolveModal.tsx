import React, { useEffect, useMemo, useState } from "react";
import P from "@/src/pokeapi";
import { EVOLUTIONS_DE, EVOLUTIONS_EN } from "@/src/data/pokemon-evolutions";
import { POKEMON_ID_TO_GENERATION } from "@/src/data/pokemon-map";
import {
  getOfficialArtworkUrlById,
  getSpriteUrlById,
} from "@/src/services/sprites";
import {
  findPokemonIdByName,
  getPokemonNameById,
} from "@/src/services/pokemonSearch";
import type { PokemonLink } from "@/types";
import { useTranslation } from "react-i18next";
import {
  normalizeLanguage,
  type SupportedLanguage,
} from "@/src/utils/language";

interface SelectEvolveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (playerIndex: number, newName: string, newId: number) => void;
  pair: PokemonLink | null;
  playerLabels: string[];
  maxGeneration?: number;
  gameVersionId?: string;
  generationSpritePath?: string | null;
  useSpritesEverywhere?: boolean;
}

interface EvoInfo {
  id: number;
  name: string; // German name if available, otherwise fallback from API
  methods: string[];
  artworkUrl?: string | null;
}

const EVOLUTION_TABLES: Record<
  SupportedLanguage,
  Record<number, { id: number; methods: string[] }[]>
> = {
  de: EVOLUTIONS_DE,
  en: EVOLUTIONS_EN,
};

function mergeLocationMethods(
  methods: string[] | undefined,
  locationPrefix: string,
): string[] {
  if (!methods || methods.length === 0) return [];
  const locations: string[] = [];
  const others: string[] = [];
  methods.forEach((method) => {
    if (method.startsWith(locationPrefix)) {
      locations.push(method.slice(locationPrefix.length));
    } else {
      others.push(method);
    }
  });
  const withoutPlainLevelUp =
    locations.length > 0
      ? others.filter((method) => method !== "Level-Up")
      : others;
  if (locations.length === 0) return withoutPlainLevelUp;
  if (locations.length === 1)
    return [...withoutPlainLevelUp, `${locationPrefix}${locations[0]}`];
  return [...withoutPlainLevelUp, `${locationPrefix}${locations.join(", ")}`];
}

interface MethodGenerationRule {
  methods: string[];
  minGeneration?: number;
  maxGeneration?: number;
}

const METHOD_GENERATION_RULES: Record<number, MethodGenerationRule[]> = {
  28: [
    {
      methods: ["Item: Eisstein", "Item: Ice Stone"],
      minGeneration: 7,
    },
  ],
  38: [
    {
      methods: ["Item: Eisstein", "Item: Ice Stone"],
      minGeneration: 7,
    },
  ],
  20: [
    {
      methods: [
        "Level-Up - Level 20, Tageszeit: Nacht",
        "Level-Up - Level 20, Time of day: Night",
      ],
      minGeneration: 7,
    },
  ],
  700: [
    {
      methods: [
        "Level-Up - Freundschaft ≥ 160, Kennt Attacke vom Typ Fee",
        "Level-Up - Friendship ≥ 160, Knows move of type Fairy",
      ],
      minGeneration: 8,
    },
  ],
  80: [
    {
      methods: ["Item: Galarnuss-Reif", "Item: Galarica Cuff"],
      minGeneration: 7,
    },
  ],
  199: [
    {
      methods: ["Item: Galarnuss-Kranz", "Item: Galarica Wreath"],
      minGeneration: 7,
    },
  ],
};

const LOCATION_METHOD_VERSION_RULES: Record<string, string[]> = {
  "Level-Up - Ort: Kraterberg": ["gen4_dp", "gen4_pt"],
  "Level-Up - Location: Mt. Coronet": ["gen4_dp", "gen4_pt"],
  "Level-Up - Ort: Elektrolithhöhle": ["gen5_sw", "gen5_s2w2"],
  "Level-Up - Location: Chargestone Cave": ["gen5_sw", "gen5_s2w2"],
  "Level-Up - Ort: Route 13": ["gen6_xy"],
  "Level-Up - Location: Route 13": ["gen6_xy"],
  "Level-Up - Ort: Ewigenwald": ["gen5_sw", "gen5_s2w2"],
  "Level-Up - Location: Pinwheel Forest": ["gen5_sw", "gen5_s2w2"],
  "Level-Up - Ort: Ewigwald": ["gen4_dp", "gen4_pt"],
  "Level-Up - Location: Eterna Forest": ["gen4_dp", "gen4_pt"],
  "Level-Up - Ort: Route 20": ["gen6_xy"],
  "Level-Up - Location: Route 20": ["gen6_xy"],
  "Level-Up - Ort: Route 217": ["gen4_dp", "gen4_pt"],
  "Level-Up - Location: Route 217": ["gen4_dp", "gen4_pt"],
  "Level-Up - Ort: Wendelberg": ["gen5_sw", "gen5_s2w2"],
  "Level-Up - Location: Twist Mountain": ["gen5_sw", "gen5_s2w2"],
  "Level-Up - Ort: Frosthöhle": ["gen6_xy"],
  "Level-Up - Location: Frost Cavern": ["gen6_xy"],
};

function methodAllowedForVersion(method: string, gameVersionId?: string) {
  if (!gameVersionId) return true;
  const allowedVersions = LOCATION_METHOD_VERSION_RULES[method];
  if (!allowedVersions) return true;
  return allowedVersions.includes(gameVersionId);
}

function filterMethodsForConstraints(
  pokemonId: number,
  methods: string[] | undefined,
  maxGeneration?: number | null,
  gameVersionId?: string,
) {
  if (!methods || methods.length === 0) return methods || [];
  let filtered = methods;
  if (typeof maxGeneration === "number") {
    const rules = METHOD_GENERATION_RULES[pokemonId];
    if (rules && rules.length) {
      filtered = filtered.filter((method) => {
        const rule = rules.find((r) => r.methods?.includes(method));
        if (!rule) return true;
        if (
          typeof rule.minGeneration === "number" &&
          maxGeneration < rule.minGeneration
        )
          return false;
        if (
          typeof rule.maxGeneration === "number" &&
          maxGeneration > rule.maxGeneration
        )
          return false;
        return true;
      });
    }
  }
  if (gameVersionId) {
    filtered = filtered.filter((method) =>
      methodAllowedForVersion(method, gameVersionId),
    );
  }
  return filtered;
}

function prettyName(raw: string) {
  if (!raw) return raw;
  // fallback slug formatting when localized names are unavailable
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

const SelectEvolveModal: React.FC<SelectEvolveModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  pair,
  playerLabels,
  maxGeneration,
  gameVersionId,
  generationSpritePath,
  useSpritesEverywhere = false,
}) => {
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null);
  const [availableEvos, setAvailableEvos] = useState<EvoInfo[] | null>(null);
  const [selectedEvoId, setSelectedEvoId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const { t, i18n } = useTranslation();
  const language = useMemo(
    () => normalizeLanguage(i18n.language),
    [i18n.language],
  );
  const [nameLanguage, setNameLanguage] = useState<SupportedLanguage>("de");

  useEffect(() => {
    if (isOpen) {
      const autoSelectIndex = playerLabels.length === 1 ? 0 : null;
      setSelectedPlayer(autoSelectIndex);
      setAvailableEvos(null);
      setSelectedEvoId(null);
      setLoading(false);
      setNameLanguage("de");
    }
  }, [isOpen, playerLabels.length]);

  const currentName = useMemo(() => {
    if (!pair || selectedPlayer === null) return "";
    return pair.members?.[selectedPlayer]?.name || "";
  }, [pair, selectedPlayer]);

  // when a player gets selected, compute evolutions
  useEffect(() => {
    async function loadEvos() {
      setAvailableEvos(null);
      setSelectedEvoId(null);
      if (!pair || selectedPlayer === null) return;
      const name = pair.members?.[selectedPlayer]?.name;
      if (!name) {
        setAvailableEvos([]);
        return;
      }
      const match = findPokemonIdByName(name);
      if (!match) {
        setAvailableEvos([]);
        return;
      }
      setNameLanguage(match.language);
      const numericId = match.id;

      const evoTable = EVOLUTION_TABLES[language] || EVOLUTION_TABLES.de;
      const evoEntries = evoTable[numericId] || [];
      const generationLimit =
        typeof maxGeneration === "number" ? maxGeneration : null;
      const filteredEntries =
        generationLimit === null
          ? evoEntries
          : evoEntries.filter((entry) => {
              const gen = POKEMON_ID_TO_GENERATION[entry.id];
              if (typeof gen !== "number") return true;
              return gen <= generationLimit;
            });
      if (filteredEntries.length === 0) {
        setAvailableEvos([]);
        return;
      }

      setLoading(true);
      try {
        const defaultUnknown =
          language === "de" ? "Bedingung unbekannt" : "Requirement unknown";
        const infos: EvoInfo[] = await Promise.all(
          filteredEntries.map(async (entry) => {
            const eid = entry.id;
            const baseMethods =
              entry.methods && entry.methods.length
                ? entry.methods
                : [defaultUnknown];
            const methodsForConstraints = filterMethodsForConstraints(
              eid,
              baseMethods,
              maxGeneration,
              gameVersionId,
            );
            const displayMethods = methodsForConstraints.length
              ? methodsForConstraints
              : [t("tracker.evolveModal.unavailable")];
            try {
              const res = await P.getPokemonByName(String(eid));
              const art =
                res.sprites?.other?.["official-artwork"]?.front_default || null;
              const localizedName =
                getPokemonNameById(eid, language) ||
                getPokemonNameById(eid, nameLanguage) ||
                getPokemonNameById(eid, language === "de" ? "en" : "de") ||
                (res.name ? prettyName(res.name) : String(eid));
              return {
                id: eid,
                name: localizedName,
                artworkUrl: art,
                methods: displayMethods,
              };
            } catch (e) {
              // fallback to constructed artwork url and id-to-german map
              const art = getOfficialArtworkUrlById(eid);
              const localizedName =
                getPokemonNameById(eid, language) ||
                getPokemonNameById(eid, nameLanguage) ||
                getPokemonNameById(eid, language === "de" ? "en" : "de") ||
                String(eid);
              return {
                id: eid,
                name: localizedName,
                artworkUrl: art,
                methods: displayMethods,
              };
            }
          }),
        );
        setAvailableEvos(infos);
      } finally {
        setLoading(false);
      }
    }

    if (selectedPlayer !== null) loadEvos();
  }, [selectedPlayer, pair, maxGeneration, gameVersionId, language]);

  if (!isOpen) return null;

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPlayer === null || selectedEvoId === null) return;
    const targetName =
      getPokemonNameById(selectedEvoId, nameLanguage) ||
      getPokemonNameById(selectedEvoId, language) ||
      getPokemonNameById(selectedEvoId, language === "de" ? "en" : "de") ||
      prettyName(String(selectedEvoId));
    onConfirm(selectedPlayer, targetName, selectedEvoId);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      {/* modal shell: limit overall height and hide overflow so inner area can scroll */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[80vh] overflow-hidden">
        {/* header */}
        <div className="px-6 py-4 flex justify-between items-center border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-bold dark:text-gray-100">
            {t("tracker.evolveModal.title")}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
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

        <form onSubmit={handleConfirm} className="px-6 pb-6">
          {/* scrollable content area; keeps header and footer visible */}
          <div className="overflow-auto max-h-[60vh] pr-2 pt-4">
            {selectedPlayer === null && (
              <div className="mb-4 text-sm text-gray-700 dark:text-gray-300">
                <div className="mb-2">{t("tracker.evolveModal.prompt")}</div>
                {playerLabels.map((label, index) => {
                  const member = pair?.members?.[index];
                  return (
                    <label
                      key={`evolve-player-${index}`}
                      className="flex items-center gap-2 mt-3 cursor-pointer dark:text-gray-200"
                    >
                      <input
                        type="radio"
                        name="which"
                        value={index}
                        checked={selectedPlayer === index}
                        onChange={() => setSelectedPlayer(index)}
                        className="h-4 w-4 accent-green-600"
                      />
                      <div>
                        <div className="font-semibold">{label}</div>
                        <div className="text-sm">
                          {member?.name || "—"}
                          {member?.nickname ? ` (${member.nickname})` : ""}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}

            {selectedPlayer !== null && (
              <div className="mb-4">
                <div className="font-semibold mb-2">
                  {t("tracker.evolveModal.evolveQuestion", {
                    name: currentName,
                  })}
                </div>

                {loading && (
                  <div className="text-sm text-gray-500">
                    {t("tracker.evolveModal.loading")}
                  </div>
                )}

                {!loading && availableEvos && availableEvos.length === 0 && (
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    {t("tracker.evolveModal.noneAvailable")}
                  </div>
                )}

                {!loading && availableEvos && availableEvos.length > 0 && (
                  <div className="space-y-3">
                    {availableEvos.map((ev) => {
                      const locationPrefix =
                        language === "de"
                          ? "Level-Up - Ort: "
                          : "Level-Up - Location: ";
                      const formattedMethods = mergeLocationMethods(
                        ev.methods,
                        locationPrefix,
                      );
                      const methodText = formattedMethods.length
                        ? formattedMethods.join(" · ")
                        : t("tracker.evolveModal.methodUnknown");
                      return (
                        <label
                          key={ev.id}
                          className="flex items-center gap-3 cursor-pointer dark:text-gray-200"
                        >
                          <input
                            type="radio"
                            name="evo"
                            value={ev.id}
                            checked={selectedEvoId === ev.id}
                            onChange={() => setSelectedEvoId(ev.id)}
                            className="h-4 w-4 accent-green-600"
                          />
                          <img
                            src={
                              useSpritesEverywhere
                                ? getSpriteUrlById(
                                    ev.id,
                                    generationSpritePath,
                                  ) ||
                                  ev.artworkUrl ||
                                  getOfficialArtworkUrlById(ev.id)
                                : ev.artworkUrl ||
                                  getOfficialArtworkUrlById(ev.id)
                            }
                            alt=""
                            className="w-16 h-16 object-contain"
                          />
                          <div className="text-sm">
                            <div>{ev.name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {methodText}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* footer buttons (kept visible) */}
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              {t("tracker.evolveModal.buttonCancel")}
            </button>
            <button
              type="submit"
              disabled={selectedPlayer === null || selectedEvoId === null}
              className={`px-4 py-2 rounded-md font-semibold shadow ${selectedEvoId ? "bg-green-600 text-white hover:bg-green-700" : "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"}`}
            >
              {t("tracker.evolveModal.buttonConfirm")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SelectEvolveModal;
