import { POKEMON_DATA } from "@/src/data/pokemon";
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

const POKEMON_ENTRIES = Object.values(POKEMON_DATA);

const buildEntries = (locale: SupportedLanguage) =>
  POKEMON_ENTRIES.map((entry) => {
    const name = entry.names[locale] || entry.names.de || entry.names.en;
    return {
      name,
      id: entry.id,
      generation: entry.generation,
      lower: name.toLowerCase(),
    };
  }).sort((a, b) => a.name.localeCompare(b.name, locale));

const NAME_LISTS: Record<SupportedLanguage, PokemonNameEntry[]> = {
  de: buildEntries("de"),
  en: buildEntries("en"),
};

const ID_TO_NAME: Record<SupportedLanguage, Record<number, string>> = {
  de: Object.fromEntries(
    POKEMON_ENTRIES.map((entry) => [entry.id, entry.names.de]),
  ),
  en: Object.fromEntries(
    POKEMON_ENTRIES.map((entry) => [entry.id, entry.names.en]),
  ),
};

const ALL_NAME_ENTRIES = SUPPORTED_LANGUAGES.reduce<PokemonNameEntry[]>(
  (acc, locale) => acc.concat(NAME_LISTS[locale] || []),
  [],
);

const EVOLUTION_GRAPH = Object.entries(POKEMON_DATA).reduce<
  Record<number, number[]>
>((acc, [sourceId, pokemon]) => {
  const numericSourceId = Number(sourceId);
  pokemon.evolutions.en.forEach(({ id }) => {
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
  NAME_LISTS[locale].forEach(({ lower, id }) => {
    if (!MERGED_NAME_TO_ID[lower]) {
      MERGED_NAME_TO_ID[lower] = { id, language: locale };
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
  id: number | null | undefined,
  locale: SupportedLanguage,
): string | undefined {
  if (typeof id !== "number") return undefined;
  return ID_TO_NAME[locale]?.[id];
}
