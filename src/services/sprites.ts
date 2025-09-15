import { GERMAN_TO_ID as PRELOAD_GERMAN_TO_ID } from '@/src/data/pokemon-de-map';

// In-memory mapping; may be replaced by refreshed map from localStorage
let germanToId: Record<string, number> = { ...PRELOAD_GERMAN_TO_ID };

const LS_MAP_KEY = 'pokemon-de-map';

try {
  const cached = localStorage.getItem(LS_MAP_KEY);
  if (cached) {
    const obj = JSON.parse(cached);
    if (obj && typeof obj === 'object') {
      germanToId = obj as Record<string, number>;
    }
  }
} catch {}

export function adoptGermanToIdMapFromLocalStorage() {
  try {
    const cached = localStorage.getItem(LS_MAP_KEY);
    if (!cached) return;
    const obj = JSON.parse(cached);
    if (obj && typeof obj === 'object') germanToId = obj as Record<string, number>;
  } catch {}
}

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
