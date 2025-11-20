import { findPokemonIdByName } from '@/src/services/pokemonSearch';

// Map game version IDs to PokeAPI sprite generation paths
export function getGenerationSpritePath(gameVersionId: string): string | null {
  const mapping: Record<string, string> = {
    'gen1_rb': 'versions/generation-i/red-blue',
    'gen1_g': 'versions/generation-i/yellow',
    'gen2_gs': 'versions/generation-ii/gold',
    'gen2_k': 'versions/generation-ii/crystal',
    'gen3_rs': 'versions/generation-iii/ruby-sapphire',
    'gen3_e': 'versions/generation-iii/emerald',
    'gen3_frbg': 'versions/generation-iii/firered-leafgreen',
    'gen4_dp': 'versions/generation-iv/diamond-pearl',
    'gen4_pt': 'versions/generation-iv/platinum',
    'gen4_hgss': 'versions/generation-iv/heartgold-soulsilver',
    'gen5_sw': 'versions/generation-v/black-white',
  };
  return mapping[gameVersionId] || null;
}

// Official artwork (high-res) by numeric id
export function getOfficialArtworkUrlById(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
}

// Classic front sprite by numeric id
export function getSpriteUrlById(id: number, generationPath?: string | null): string {
  if (generationPath) {
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${generationPath}/${id}.png`;
  }
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
}

// Resolve official artwork by localized name
export function getOfficialArtworkUrlForPokemonName(name: string | undefined | null): string | null {
  const match = findPokemonIdByName(name);
  if (!match) return null;
  return getOfficialArtworkUrlById(match.id);
}

// Resolve classic sprite by localized name
export function getSpriteUrlForPokemonName(name: string | undefined | null, generationPath?: string | null): string | null {
  const match = findPokemonIdByName(name);
  if (!match) return null;
  return getSpriteUrlById(match.id, generationPath);
}
