import { GERMAN_POKEMON_NAMES } from '@/src/data/pokemon-de';
import { ENGLISH_POKEMON_NAMES } from '@/src/data/pokemon-en';
import { ENGLISH_TO_ID, GERMAN_TO_ID } from '@/src/data/pokemon-map';
import { SupportedLanguage, SUPPORTED_LANGUAGES } from '@/src/utils/language';

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

const buildEntries = (items: { name: string; id: number; generation: number }[]) =>
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
  options: SearchOptions = {}
): Promise<string[]> {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const { maxGeneration, locale = 'de' } = options;
  const list = NAME_LISTS[locale] || NAME_LISTS.de;
  return list
    .filter((entry) => entry.lower.includes(q) && (typeof maxGeneration !== 'number' || entry.generation <= maxGeneration))
    .slice(0, max)
    .map((entry) => entry.name);
}

export function findPokemonIdByName(name: string | undefined | null): PokemonNameMatch | null {
  if (!name) return null;
  const key = name.trim().toLowerCase();
  if (!key) return null;
  return MERGED_NAME_TO_ID[key] || null;
}

export function getPokemonIdFromName(name: string | undefined | null): number | null {
  const match = findPokemonIdByName(name);
  return match ? match.id : null;
}

export function getPokemonNameById(id: number, locale: SupportedLanguage): string | undefined {
  return ID_TO_NAME[locale]?.[id];
}
