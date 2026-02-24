import {
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

/**
 * Returns the raw type slugs (e.g. ["grass", "poison"]) for a Pokémon id.
 */
export function getPokemonTypeSlugsById(id: number): string[] {
  return POKEMON_TYPES[id] ?? [];
}

/**
 * Returns the raw type slugs for a Pokémon by its (localized) display name.
 */
export function getPokemonTypeSlugsForName(
  name: string | undefined | null,
): string[] {
  const match = findPokemonIdByName(name);
  if (!match) return [];
  return getPokemonTypeSlugsById(match.id);
}

/**
 * Translate a single type slug (e.g. "grass") to a localized name (e.g. "Pflanze").
 */
export function getLocalizedTypeName(
  slug: string,
  locale: SupportedLanguage,
): string {
  return TYPE_NAMES[locale]?.[slug] ?? slug;
}

/**
 * Returns localized type names (e.g. ["Pflanze", "Gift"]) for a Pokémon by display name.
 */
export function getPokemonTypeNamesForName(
  name: string | undefined | null,
  locale: SupportedLanguage,
): string[] {
  const slugs = getPokemonTypeSlugsForName(name);
  return slugs.map((s) => getLocalizedTypeName(s, locale));
}
