import type { AppState, Stats } from "@/types.ts";
import { GAME_VERSIONS } from "@/src/data/game-versions.ts";
import { DEFAULT_RULES, DEFAULT_RULESET_ID } from "@/src/data/rulesets.ts";

export const PLAYER1_COLOR = "#cf5930";
export const PLAYER2_COLOR = "#693992";
export const PLAYER3_COLOR = "#2c7b90";
export const PLAYER_COLORS = [PLAYER1_COLOR, PLAYER2_COLOR, PLAYER3_COLOR];

export const MIN_PLAYER_COUNT = 1;
export const MAX_PLAYER_COUNT = 3;

export interface FossilDef {
  id: string;
  gen: number;
  sprite: string;
}

export const FOSSILS: FossilDef[] = [
  { id: "helix-fossil", gen: 1, sprite: "gen1/helix-fossil.png" },
  { id: "dome-fossil", gen: 1, sprite: "gen1/dome-fossil.png" },
  { id: "old-amber", gen: 1, sprite: "gen1/old-amber.png" },
  { id: "root-fossil", gen: 3, sprite: "gen3/root-fossil.png" },
  { id: "claw-fossil", gen: 3, sprite: "gen3/claw-fossil.png" },
  { id: "skull-fossil", gen: 4, sprite: "gen4/skull-fossil.png" },
  { id: "armor-fossil", gen: 4, sprite: "gen4/armor-fossil.png" },
  { id: "cover-fossil", gen: 5, sprite: "gen5/cover-fossil.png" },
  { id: "plume-fossil", gen: 5, sprite: "gen5/plume-fossil.png" },
  { id: "jaw-fossil", gen: 6, sprite: "gen6/jaw-fossil.png" },
  { id: "sail-fossil", gen: 6, sprite: "gen6/sail-fossil.png" },
];

export interface StoneDef {
  id: string;
  gen: number;
  sprite: string;
}

export const STONES: StoneDef[] = [
  { id: "fire-stone", gen: 1, sprite: "gen1/fire-stone.png" },
  { id: "water-stone", gen: 1, sprite: "gen1/water-stone.png" },
  { id: "thunder-stone", gen: 1, sprite: "gen1/thunder-stone.png" },
  { id: "leaf-stone", gen: 1, sprite: "gen1/leaf-stone.png" },
  { id: "moon-stone", gen: 1, sprite: "gen1/moon-stone.png" },
  { id: "sun-stone", gen: 2, sprite: "gen2/sun-stone.png" },
  { id: "shiny-stone", gen: 4, sprite: "gen4/shiny-stone.png" },
  { id: "dusk-stone", gen: 4, sprite: "gen4/dusk-stone.png" },
  { id: "dawn-stone", gen: 4, sprite: "gen4/dawn-stone.png" },
];

export interface MegaStoneDef {
  id: string;
  pokemonId: number;
  version: "XY" | "ORAS";
}

/** Mega stones — id is the item slug, pokemonId is the PokeAPI mega form ID */
export const MEGA_STONES: MegaStoneDef[] = [
  // XY mega stones
  { id: "venusaurite", pokemonId: 10033, version: "XY" },
  { id: "charizardite-x", pokemonId: 10034, version: "XY" },
  { id: "charizardite-y", pokemonId: 10035, version: "XY" },
  { id: "blastoisinite", pokemonId: 10036, version: "XY" },
  { id: "alakazite", pokemonId: 10037, version: "XY" },
  { id: "gengarite", pokemonId: 10038, version: "XY" },
  { id: "kangaskhanite", pokemonId: 10039, version: "XY" },
  { id: "pinsirite", pokemonId: 10040, version: "XY" },
  { id: "gyaradosite", pokemonId: 10041, version: "XY" },
  { id: "aerodactylite", pokemonId: 10042, version: "XY" },
  { id: "mewtwonite-x", pokemonId: 10043, version: "XY" },
  { id: "mewtwonite-y", pokemonId: 10044, version: "XY" },
  { id: "ampharosite", pokemonId: 10045, version: "XY" },
  { id: "scizorite", pokemonId: 10046, version: "XY" },
  { id: "heracronite", pokemonId: 10047, version: "XY" },
  { id: "houndoominite", pokemonId: 10048, version: "XY" },
  { id: "tyranitarite", pokemonId: 10049, version: "XY" },
  { id: "blazikenite", pokemonId: 10050, version: "XY" },
  { id: "gardevoirite", pokemonId: 10051, version: "XY" },
  { id: "mawilite", pokemonId: 10052, version: "XY" },
  { id: "aggronite", pokemonId: 10053, version: "XY" },
  { id: "medichamite", pokemonId: 10054, version: "XY" },
  { id: "manectite", pokemonId: 10055, version: "XY" },
  { id: "banettite", pokemonId: 10056, version: "XY" },
  { id: "absolite", pokemonId: 10057, version: "XY" },
  { id: "garchompite", pokemonId: 10058, version: "XY" },
  { id: "lucarionite", pokemonId: 10059, version: "XY" },
  { id: "abomasite", pokemonId: 10060, version: "XY" },
  // ORAS mega stones
  { id: "beedrillite", pokemonId: 10090, version: "ORAS" },
  { id: "pidgeotite", pokemonId: 10073, version: "ORAS" },
  { id: "slowbronite", pokemonId: 10071, version: "ORAS" },
  { id: "steelixite", pokemonId: 10072, version: "ORAS" },
  { id: "sceptilite", pokemonId: 10065, version: "ORAS" },
  { id: "swampertite", pokemonId: 10064, version: "ORAS" },
  { id: "sablenite", pokemonId: 10066, version: "ORAS" },
  { id: "sharpedonite", pokemonId: 10070, version: "ORAS" },
  { id: "cameruptite", pokemonId: 10087, version: "ORAS" },
  { id: "altarianite", pokemonId: 10067, version: "ORAS" },
  { id: "glalitite", pokemonId: 10074, version: "ORAS" },
  { id: "salamencite", pokemonId: 10089, version: "ORAS" },
  { id: "metagrossite", pokemonId: 10076, version: "ORAS" },
  { id: "latiasite", pokemonId: 10062, version: "ORAS" },
  { id: "latiosite", pokemonId: 10063, version: "ORAS" },
  { id: "lopunnite", pokemonId: 10088, version: "ORAS" },
  { id: "galladite", pokemonId: 10068, version: "ORAS" },
  { id: "audinite", pokemonId: 10069, version: "ORAS" },
  { id: "diancite", pokemonId: 10075, version: "ORAS" },
];

export const sanitizePlayerNames = (names?: string[]): string[] => {
  if (!Array.isArray(names)) {
    return [];
  }
  return names
    .slice(0, MAX_PLAYER_COUNT)
    .map((name) => (typeof name === "string" ? name : ""));
};

export const ensureStatsForPlayers = (
  stats: Stats | undefined,
  playerCount: number,
): Stats => {
  const base = stats ?? {
    runs: 1,
    best: 0,
    top4Items: [],
    deaths: [],
    sumDeaths: [],
    legendaryEncounters: 0,
  };
  const normalizeArray = (values?: number[]) => {
    const arr = Array.isArray(values) ? values.slice(0, playerCount) : [];
    while (arr.length < playerCount) {
      arr.push(0);
    }
    return arr;
  };
  return {
    runs: typeof base.runs === "number" ? base.runs : 1,
    best: typeof base.best === "number" ? base.best : 0,
    top4Items: normalizeArray(base.top4Items),
    deaths: normalizeArray(base.deaths),
    sumDeaths: normalizeArray(base.sumDeaths),
    legendaryEncounters:
      typeof base.legendaryEncounters === "number"
        ? base.legendaryEncounters
        : 0,
  };
};

export const sanitizeRules = (rules?: unknown): string[] => {
  if (!Array.isArray(rules)) return [];
  return rules
    .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
    .filter((entry) => entry.length > 0);
};

export const sanitizeTags = (tags?: unknown): string[] => {
  if (!Array.isArray(tags)) return [];
  const seen = new Set<string>();
  const normalized: string[] = [];
  tags.forEach((tag) => {
    if (typeof tag !== "string") return;
    const cleaned = tag.trim();
    if (!cleaned.length) return;
    const key = cleaned.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    normalized.push(cleaned);
  });
  return normalized;
};

const DEFAULT_GAME_VERSION_ID = "gen5_bw";

const DEFAULT_PLAYER_NAME_SET: string[] = [];

export const INITIAL_STATE: AppState = {
  playerNames: DEFAULT_PLAYER_NAME_SET,
  team: [],
  box: [],
  graveyard: [],
  rules: DEFAULT_RULES,
  rulesetId: DEFAULT_RULESET_ID,
  levelCaps: [],
  rivalCaps: [],
  stats: ensureStatsForPlayers(undefined, DEFAULT_PLAYER_NAME_SET.length),
  legendaryTrackerEnabled: true,
  rivalCensorEnabled: true,
  hardcoreModeEnabled: true,
  infiniteFossilsEnabled: false,
  megaStoneSpriteStyle: "item",
  fossils: [],
  stones: [],
  runStartedAt: Date.now(),
};

export const createInitialState = (
  gameVersionId: string = DEFAULT_GAME_VERSION_ID,
  playerNames?: string[],
  ruleset?: { id?: string; rules?: string[] },
): AppState => {
  const gameVersion =
    GAME_VERSIONS[gameVersionId] || GAME_VERSIONS[DEFAULT_GAME_VERSION_ID];
  const base = JSON.parse(JSON.stringify(INITIAL_STATE)) as AppState;
  const normalizedNames = sanitizePlayerNames(playerNames);
  const normalizedRules = sanitizeRules(
    Array.isArray(ruleset?.rules) ? ruleset?.rules : undefined,
  );

  base.playerNames = normalizedNames;
  base.rules = normalizedRules.length > 0 ? normalizedRules : DEFAULT_RULES;
  base.rulesetId = ruleset?.id || DEFAULT_RULESET_ID;
  base.stats = ensureStatsForPlayers(base.stats, normalizedNames.length);
  base.levelCaps = gameVersion.levelCaps.map((cap) => ({
    ...cap,
    done: false,
  }));
  base.rivalCaps = gameVersion.rivalCaps.map((cap) => ({
    ...cap,
    done: false,
    revealed: false,
  }));
  base.fossils = normalizedNames.map(() => []);
  base.stones = normalizedNames.map(() => []);
  base.runStartedAt = Date.now();
  return base;
};
