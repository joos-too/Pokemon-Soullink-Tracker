import { GERMAN_POKEMON_NAMES } from "@/src/data/pokemon-de";
import { ENGLISH_POKEMON_NAMES } from "@/src/data/pokemon-en";
import { EVOLUTIONS_EN } from "@/src/data/pokemon-evolutions";
import { ENGLISH_TO_ID, GERMAN_TO_ID } from "@/src/data/pokemon-map";
import { SUPPORTED_LANGUAGES, SupportedLanguage } from "@/src/utils/language";

interface SearchOptions {
  maxGeneration?: number;
  locale?: SupportedLanguage;
}

type PokemonNameEntry = {
  name: string;
  id: number;
  generation: number;
  lower: string;
};

const buildEntries = (
  items: { name: string; id: number; generation: number }[],
) =>
  items.map((entry) => ({
    ...entry,
    lower: entry.name.toLowerCase(),
  }));

const NAME_LISTS: Record<SupportedLanguage, PokemonNameEntry[]> = {
  de: buildEntries(GERMAN_POKEMON_NAMES),
  en: buildEntries(ENGLISH_POKEMON_NAMES),
};

const NAME_MAPS: Record<SupportedLanguage, Record<string, number>> = {
  de: GERMAN_TO_ID,
  en: ENGLISH_TO_ID,
};

const ID_TO_NAME: Record<SupportedLanguage, Record<number, string>> = {
  de: GERMAN_POKEMON_NAMES.reduce<Record<number, string>>((acc, entry) => {
    acc[entry.id] = entry.name;
    return acc;
  }, {}),
  en: ENGLISH_POKEMON_NAMES.reduce<Record<number, string>>((acc, entry) => {
    acc[entry.id] = entry.name;
    return acc;
  }, {}),
};

const ALL_NAME_ENTRIES = SUPPORTED_LANGUAGES.reduce<PokemonNameEntry[]>(
  (acc, locale) => acc.concat(NAME_LISTS[locale] || []),
  [],
);

const EVOLUTION_GRAPH = Object.entries(EVOLUTIONS_EN).reduce<
  Record<number, number[]>
>((acc, [sourceId, evolutions]) => {
  const numericSourceId = Number(sourceId);
  evolutions.forEach(({ id }) => {
    acc[numericSourceId] = [...(acc[numericSourceId] || []), id];
    acc[id] = [...(acc[id] || []), numericSourceId];
  });
  return acc;
}, {});

const POKEMON_FAMILY_CACHE = new Map<number, Set<number>>();

export interface PokemonNameMatch {
  id: number;
  language: SupportedLanguage;
}

const MERGED_NAME_TO_ID: Record<string, PokemonNameMatch> = {};
SUPPORTED_LANGUAGES.forEach((locale) => {
  const map = NAME_MAPS[locale];
  Object.entries(map).forEach(([name, id]) => {
    if (!MERGED_NAME_TO_ID[name]) {
      MERGED_NAME_TO_ID[name] = { id, language: locale };
    }
  });
});

export async function searchPokemonNames(
  query: string,
  max = 10,
  options: SearchOptions = {},
): Promise<string[]> {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const { maxGeneration, locale = "de" } = options;
  const list = NAME_LISTS[locale] || NAME_LISTS.de;
  return list
    .filter(
      (entry) =>
        entry.lower.includes(q) &&
        (typeof maxGeneration !== "number" ||
          entry.generation <= maxGeneration),
    )
    .slice(0, max)
    .map((entry) => entry.name);
}

function collectPokemonFamilyIds(id: number): Set<number> {
  const cached = POKEMON_FAMILY_CACHE.get(id);
  if (cached) return cached;

  const visited = new Set<number>();
  const queue = [id];

  while (queue.length > 0) {
    const currentId = queue.shift();
    if (typeof currentId !== "number" || visited.has(currentId)) continue;
    visited.add(currentId);
    (EVOLUTION_GRAPH[currentId] || []).forEach((neighborId) => {
      if (!visited.has(neighborId)) {
        queue.push(neighborId);
      }
    });
  }

  POKEMON_FAMILY_CACHE.set(id, visited);
  return visited;
}

export function getPokemonFamilyIdsMatchingQuery(
  query: string,
  options: SearchOptions = {},
): Set<number> {
  const q = query.trim().toLowerCase();
  if (!q) return new Set<number>();

  const { maxGeneration } = options;
  return ALL_NAME_ENTRIES.reduce<Set<number>>((acc, entry) => {
    if (!entry.lower.includes(q)) return acc;
    if (typeof maxGeneration === "number" && entry.generation > maxGeneration) {
      return acc;
    }
    collectPokemonFamilyIds(entry.id).forEach((familyId) => acc.add(familyId));
    return acc;
  }, new Set<number>());
}

export function findPokemonIdByName(
  name: string | undefined | null,
): PokemonNameMatch | null {
  if (!name) return null;
  const key = name.trim().toLowerCase();
  if (!key) return null;
  return MERGED_NAME_TO_ID[key] || null;
}

export function getPokemonIdFromName(
  name: string | undefined | null,
): number | null {
  const match = findPokemonIdByName(name);
  return match ? match.id : null;
}

export function getPokemonNameById(
  id: number,
  locale: SupportedLanguage,
): string | undefined {
  return ID_TO_NAME[locale]?.[id];
}
