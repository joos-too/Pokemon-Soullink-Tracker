import { GERMAN_TO_ID as PRELOAD_GERMAN_TO_ID } from '@/src/data/pokemon-de-map';

// Static in-memory mapping generated at build time
const germanToId: Record<string, number> = { ...PRELOAD_GERMAN_TO_ID };

// Official artwork (high-res) by numeric id
export function getOfficialArtworkUrlById(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
}

// Classic front sprite by numeric id
export function getSpriteUrlById(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
}

// Resolve official artwork by German name
export function getOfficialArtworkUrlForGermanName(name: string | undefined | null): string | null {
  if (!name) return null;
  const key = String(name).trim().toLowerCase();
  if (!key) return null;
  const id = germanToId[key];
  if (!id) return null;
  return getOfficialArtworkUrlById(id);
}

// Resolve classic sprite by German name
export function getSpriteUrlForGermanName(name: string | undefined | null): string | null {
  if (!name) return null;
  const key = String(name).trim().toLowerCase();
  if (!key) return null;
  const id = germanToId[key];
  if (!id) return null;
  return getSpriteUrlById(id);
}
