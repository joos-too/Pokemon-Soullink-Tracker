import { GERMAN_POKEMON_NAMES } from "@/src/data/pokemon-de";
import { ENGLISH_POKEMON_NAMES } from "@/src/data/pokemon-en";
import { GERMAN_TO_ID, ENGLISH_TO_ID } from "@/src/data/pokemon-map";

export type WikiId = "pokewiki" | "bulbapedia" | "pokemondb";

export interface Wiki {
  id: WikiId;
  name: string;
  language: "de" | "en";
  baseUrl: string;
  buildUrl: (pokemonName: string) => string;
}

// Build ID → localized name lookups once at module load
const ID_TO_GERMAN: Record<number, string> = Object.fromEntries(
  GERMAN_POKEMON_NAMES.map((e) => [e.id, e.name]),
);

const ID_TO_ENGLISH: Record<number, string> = Object.fromEntries(
  ENGLISH_POKEMON_NAMES.map((e) => [e.id, e.name]),
);

export const WIKIS: Wiki[] = [
  {
    id: "pokewiki",
    name: "PokéWiki",
    language: "de",
    baseUrl: "https://www.pokewiki.de",
    buildUrl: (name) => `https://www.pokewiki.de/${encodeURIComponent(name)}`,
  },
  {
    id: "bulbapedia",
    name: "Bulbapedia",
    language: "en",
    baseUrl: "https://bulbapedia.bulbagarden.net",
    buildUrl: (name) =>
      `https://bulbapedia.bulbagarden.net/wiki/${encodeURIComponent(name)}_(Pok%C3%A9mon)`,
  },
  {
    id: "pokemondb",
    name: "PokémonDB",
    language: "en",
    baseUrl: "https://pokemondb.net",
    buildUrl: (name) =>
      `https://pokemondb.net/pokedex/${encodeURIComponent(name.toLowerCase())}`,
  },
];

/** Default wiki when the app is displayed in German */
export const DEFAULT_WIKI_DE: WikiId = "pokewiki";

/** Default wiki when the app is displayed in English */
export const DEFAULT_WIKI_EN: WikiId = "bulbapedia";

/**
 * Resolve a Pokemon name (German or English) to its national-dex ID.
 * The lookup is case-insensitive.
 */
function resolveId(name: string): number | undefined {
  const lower = name.toLowerCase();
  const fromGerman = GERMAN_TO_ID[lower];
  if (fromGerman !== undefined) return fromGerman;
  const fromEnglish = ENGLISH_TO_ID[lower];
  if (fromEnglish !== undefined) return fromEnglish;
  return undefined;
}

/**
 * Build the wiki URL for a given Pokemon name and wiki.
 * The name may be in German or English – the correct localized name for
 * the target wiki is resolved automatically via the existing data mappings.
 * Returns null when the Pokemon cannot be found in the data.
 */
export function getWikiUrl(pokemonName: string, wikiId: WikiId): string | null {
  if (!pokemonName?.trim()) return null;
  const wiki = WIKIS.find((w) => w.id === wikiId);
  if (!wiki) return null;

  const id = resolveId(pokemonName);
  if (id === undefined) return null;

  const targetName =
    wiki.language === "de" ? ID_TO_GERMAN[id] : ID_TO_ENGLISH[id];
  if (!targetName) return null;

  return wiki.buildUrl(targetName);
}
