import {GERMAN_POKEMON_NAMES as BASE_GERMAN_NAMES} from '@/src/data/pokemon-de';

interface SearchOptions {
  maxGeneration?: number;
}

type PokemonNameEntry = {
  name: string;
  id: number;
  generation: number;
  lower: string;
};

// Static in-memory list used for instant search
const names: PokemonNameEntry[] = BASE_GERMAN_NAMES.map((entry) => ({
  ...entry,
  lower: entry.name.toLowerCase(),
}));

export async function searchGermanPokemonNames(query: string, max = 10, options: SearchOptions = {}): Promise<string[]> {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const {maxGeneration} = options;
  const filtered = names
    .filter((entry) => entry.lower.includes(q) && (typeof maxGeneration !== 'number' || entry.generation <= maxGeneration))
    .slice(0, max)
    .map((entry) => entry.name);
  return filtered;
}
