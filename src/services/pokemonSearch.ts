import { GERMAN_POKEMON_NAMES as BASE_GERMAN_NAMES } from '@/src/data/pokemon-de';

// Static in-memory list used for instant search
const names: string[] = [...BASE_GERMAN_NAMES];

export async function searchGermanPokemonNames(query: string, max = 10): Promise<string[]> {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const res = names.filter((n) => n.toLowerCase().includes(q)).slice(0, max);
  return res;
}
