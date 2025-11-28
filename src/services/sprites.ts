import { findPokemonIdByName } from "@/src/services/pokemonSearch";

// Official artwork (high-res) by numeric id
export function getOfficialArtworkUrlById(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
}

// Classic front sprite by numeric id
export function getSpriteUrlById(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
}

// Resolve official artwork by localized name
export function getOfficialArtworkUrlForPokemonName(
  name: string | undefined | null,
): string | null {
  const match = findPokemonIdByName(name);
  if (!match) return null;
  return getOfficialArtworkUrlById(match.id);
}

// Resolve classic sprite by localized name
export function getSpriteUrlForPokemonName(
  name: string | undefined | null,
): string | null {
  const match = findPokemonIdByName(name);
  if (!match) return null;
  return getSpriteUrlById(match.id);
}
