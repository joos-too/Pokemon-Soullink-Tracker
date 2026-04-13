import {
  POKEMON_PAST_TYPES,
  POKEMON_TYPES,
  TYPE_NAMES_DE,
  TYPE_NAMES_EN,
} from "@/src/data/pokemon-types";
import { findPokemonIdByName } from "@/src/services/pokemonSearch";
import type { SupportedLanguage } from "@/src/utils/language";

const TYPE_NAMES: Record<SupportedLanguage, Record<string, string>> = {
  de: TYPE_NAMES_DE,
  en: TYPE_NAMES_EN,
};

function getResolvedTypeSlugsForGeneration(
  id: number,
  generation?: number | null,
): string[] {
  const currentTypes = POKEMON_TYPES[id] ?? [];
  if (typeof generation !== "number") return currentTypes;
  const matchingPastEntry = (POKEMON_PAST_TYPES[id] ?? []).find(
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

/**
 * Returns localized type names for a Pokemon by display name.
 */
export function getPokemonTypeNamesForName(
  name: string | undefined | null,
  locale: SupportedLanguage,
  generation?: number | null,
): string[] {
  const slugs = getPokemonTypeSlugsForName(name, generation);
  return slugs.map((s) => getLocalizedTypeName(s, locale));
}
