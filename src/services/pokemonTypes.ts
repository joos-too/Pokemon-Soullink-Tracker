import { POKEMON_DATA, POKEMON_TYPE_NAMES } from "@/src/data/pokemon";
import { findPokemonIdByName } from "@/src/services/pokemonSearch";
import type { SupportedLanguage } from "@/src/utils/language";

const TYPE_NAMES: Record<SupportedLanguage, Record<string, string>> = {
  de: POKEMON_TYPE_NAMES.de,
  en: POKEMON_TYPE_NAMES.en,
};

function getResolvedTypeSlugsForGeneration(
  id: number,
  generation?: number | null,
): string[] {
  const pokemon = POKEMON_DATA[id];
  const currentTypes = pokemon?.types ?? [];
  if (typeof generation !== "number") return currentTypes;
  const matchingPastEntry = (pokemon?.pastTypes ?? []).find(
    (entry) => generation <= entry.generation,
  );
  return matchingPastEntry?.types ?? currentTypes;
}

/**
 * Returns the raw type slugs (e.g. ["grass", "poison"]) for a Pokémon id.
 */
export function getPokemonTypeSlugsById(
  id: number,
  generation?: number | null,
): string[] {
  return getResolvedTypeSlugsForGeneration(id, generation);
}

/**
 * Returns the raw type slugs for a Pokemon by its localized display name.
 */
export function getPokemonTypeSlugsForName(
  name: string | undefined | null,
  generation?: number | null,
): string[] {
  const match = findPokemonIdByName(name);
  if (!match) return [];
  return getPokemonTypeSlugsById(match.id, generation);
}

/**
 * Translate a single type slug (e.g. "grass") to a localized name.
 */
export function getLocalizedTypeName(
  slug: string,
  locale: SupportedLanguage,
): string {
  return TYPE_NAMES[locale]?.[slug] ?? slug;
}
