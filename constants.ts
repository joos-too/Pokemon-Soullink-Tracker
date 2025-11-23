import type { AppState, Stats } from "./types";
import { GAME_VERSIONS } from "@/src/data/game-versions";

export const PLAYER1_COLOR = "#cf5930";
export const PLAYER2_COLOR = "#693992";
export const PLAYER3_COLOR = "#2c7b90";
export const PLAYER_COLORS = [PLAYER1_COLOR, PLAYER2_COLOR, PLAYER3_COLOR];

export const MIN_PLAYER_COUNT = 1;
export const MAX_PLAYER_COUNT = 3;

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

export const DEFAULT_RULES: string[] = [
  "Pro Route/Gebiet darf nur das erste Pokémon gefangen werden. Diese Pokémon ist mit dem Pokémon des Partners verbunden.",
  "Pokémon, die bereits gefangen/encountered wurden (oder deren Evolutionsreihe) zählen nicht als Routen Pokémon und dürfen gererolled werden. Es gibt max. 2 weitere Versuche.",
  "Geschenkte/Statische Pokémon & Fossile gelten nicht als Gebietspokémon und dürfen verwendet werden (auch wenn bereits gefangen, auch mit Partner verbunden). Identische Statics & Fossile dürfen nur einmal verwendet werden.",
  "Wenn ein Pokémon beim Fangversuch flieht/stirbt, zählt das Gebiet als verloren. Der Seelenpartner muss freigelassen werden.",
  "Jedes Pokémon erhält einen Spitznamen, den der Seelenpartner auswählt.",
  "Besiegte Pokémon gelten als verstorben und müssen so wie ihr Seelenpartner in eine Grab-Box. (Wenn bereits im Kampf, Verwendung bis zum Ende)",
  "Pokémon, Items, und Trainer sind gerandomized.",
  "Der Bonusshop ist gerandomized, jedes Item darf max. 1 mal gekauft werden.",
  "Das Level-Cap darf nicht überschritten werden (1 Pokémon auf höherem Level, restliche auf niedrigerem). Überlevelte Pokémon sowie ihr Seelenpartner dürfen nicht verwendet werden, bis der Level-Cap wieder ansteigt.",
  "Sonderbonbons dürfen direkt VOR Arenaleiter/Top-4/Champion/Rivalen verwendet werden. Sie dürfen außerdem verwendet werden um Pokémon auf das Level-Cap der letzten Arena zu bringen.",
  "Kampffolge wird auf 'Folgen' gestellt.",
  "Gegenstände im Kampf nur, wenn der Gegner auch einen verwendet. In der Top 4 max. 20 Items außerhalb von Kämpfen",
  "Shiny Pokémon dürfen immer gefangen und nach belieben ausgetauscht werden.",
  "Challenge verloren, wenn das komplette Team eines Spielers besiegt wurde.",
  "Challenge geschafft, wenn der Champ der Region besiegt wurde.",
  "Challenge startet sobald man die ersten Pokébälle erhalten hat.",
  "Kein Googlen während Arena/Top-4/Rivalen/Boss-Kämpfen",
  "Max. 2 legendäre Pokémon pro Team",
];

// Legendary Pokémon organized by generation
const LEGENDARY_POKEMON_BY_GENERATION: Record<number, string[]> = {
  1: ["Arktos", "Zapdos", "Lavados", "Mewtu", "Mew"],
  2: ["Raikou", "Entei", "Suicune", "Lugia", "Ho-Oh", "Celebi"],
  3: [
    "Regirock",
    "Regice",
    "Registeel",
    "Latias",
    "Latios",
    "Kyogre",
    "Groudon",
    "Rayquaza",
    "Jirachi",
    "Deoxys",
  ],
  4: [
    "Selfe",
    "Vesprit",
    "Tobutz",
    "Dialga",
    "Palkia",
    "Heatran",
    "Regigigas",
    "Giratina",
    "Cresselia",
    "Phione",
    "Manaphy",
    "Darkrai",
    "Shaymin",
    "Arceus",
  ],
  5: [
    "Victini",
    "Kobalium",
    "Terrakium",
    "Viridium",
    "Boreos",
    "Voltolos",
    "Reshiram",
    "Zekrom",
    "Demeteros",
    "Kyurem",
    "Keldeo",
    "Meloetta",
    "Genesect",
  ],
  6: ["Xerneas", "Yveltal", "Zygarde", "Diancie", "Hoopa", "Volcanion"],
};

// Filter legendary Pokémon up to and including the specified generation
export const getLegendariesUpToGeneration = (
  maxGeneration: number,
): string[] => {
  const result: string[] = [];
  for (let gen = 1; gen <= Math.min(maxGeneration, 6); gen++) {
    result.push(...(LEGENDARY_POKEMON_BY_GENERATION[gen] || []));
  }
  return result;
};

const DEFAULT_GAME_VERSION_ID = "gen5_sw";

const DEFAULT_PLAYER_NAME_SET: string[] = [];

export const INITIAL_STATE: AppState = {
  playerNames: DEFAULT_PLAYER_NAME_SET,
  team: [],
  box: [],
  graveyard: [],
  rules: DEFAULT_RULES,
  levelCaps: [],
  rivalCaps: [],
  stats: ensureStatsForPlayers(undefined, DEFAULT_PLAYER_NAME_SET.length),
  legendaryTrackerEnabled: true,
  rivalCensorEnabled: true,
  hardcoreModeEnabled: true,
  runStartedAt: Date.now(),
};

export const createInitialState = (
  gameVersionId: string = DEFAULT_GAME_VERSION_ID,
  playerNames?: string[],
): AppState => {
  const gameVersion =
    GAME_VERSIONS[gameVersionId] || GAME_VERSIONS[DEFAULT_GAME_VERSION_ID];
  const base = JSON.parse(JSON.stringify(INITIAL_STATE)) as AppState;
  const normalizedNames = sanitizePlayerNames(playerNames);

  base.playerNames = normalizedNames;
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
  base.runStartedAt = Date.now();
  return base;
};
