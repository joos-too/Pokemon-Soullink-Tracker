import { GERMAN_POKEMON_NAMES as BASE_GERMAN_NAMES } from '@/src/data/pokemon-de';
import P from '@/src/pokeapi';
import { adoptGermanToIdMapFromLocalStorage } from '@/src/services/sprites';

// In-memory names list used for instant, zero-latency search
let names: string[] = [...BASE_GERMAN_NAMES];

// LocalStorage keys for background refresh
const LS_KEY = 'pokemon-de-names';
const LS_TS_KEY = 'pokemon-de-names-ts';
const LS_MAP_KEY = 'pokemon-de-map';

// Try to adopt cached refreshed names from previous sessions
try {
  const cached = localStorage.getItem(LS_KEY);
  if (cached) {
    const arr = JSON.parse(cached);
    if (Array.isArray(arr) && arr.every((n) => typeof n === 'string')) {
      names = arr;
    }
  }
} catch {}

function saveToLocal(namesArr: string[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(namesArr));
    localStorage.setItem(LS_TS_KEY, String(Date.now()));
  } catch {}
}

// Background refresh of German names (non-blocking). Rebuilds the list from PokeAPI
// and stores it to localStorage. Call once at app start.
export async function initPokemonGermanNamesBackgroundRefresh(maxAgeMs = 7 * 24 * 60 * 60 * 1000) {
  // Skip if recently refreshed
  try {
    const ts = Number(localStorage.getItem(LS_TS_KEY) || '0');
    if (Date.now() - ts < maxAgeMs && names.length > 0) return;
  } catch {}

  // Build fresh list in background
  try {
    const list = await P.getPokemonSpeciesList({ limit: 20000, offset: 0 });
    const results: string[] = [];
    const deToId = new Map<string, number>();
    const items = (list?.results || []) as { name: string; url: string }[];

    // Extract IDs from URLs
    const ids = items
      .map((it) => {
        const m = it.url.match(/\/pokemon-species\/(\d+)\/?$/);
        return m ? Number(m[1]) : null;
      })
      .filter((x): x is number => !!x);

    // Fetch in chunks to avoid hitting rate limits too hard
    const CHUNK = 50;
    for (let i = 0; i < ids.length; i += CHUNK) {
      const slice = ids.slice(i, i + CHUNK);
      const speciesArr = await Promise.all(
        slice.map((id) => P.getPokemonSpeciesByName(id).catch(() => null))
      );
      for (const sp of speciesArr) {
        if (!sp) continue;
        const namesField: Array<{ name: string; language: { name: string } }> = sp.names || [];
        const de = namesField.find((n) => n.language?.name === 'de');
        const en = namesField.find((n) => n.language?.name === 'en');
        const nm = de?.name || en?.name || sp.name;
        if (nm) results.push(nm);
        if (de?.name) deToId.set(String(de.name).toLowerCase(), sp.id);
        else if (sp.name) deToId.set(String(sp.name).toLowerCase(), sp.id);
      }
    }

    // Deduplicate + sort
    const unique = Array.from(new Set(results)).sort((a, b) => a.localeCompare(b, 'de'));
    names = unique;
    saveToLocal(unique);
    try {
      const mapObj = Object.fromEntries(deToId.entries());
      localStorage.setItem(LS_MAP_KEY, JSON.stringify(mapObj));
      adoptGermanToIdMapFromLocalStorage();
    } catch {}
  } catch {
    // Ignore background errors; keep existing list
  }
}

export async function searchGermanPokemonNames(query: string, max = 10): Promise<string[]> {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const res = names.filter((n) => n.toLowerCase().includes(q)).slice(0, max);
  return res;
}
