import { SupportedLanguage } from "@/src/utils/language.ts";
import { TFunction } from "i18next";
import { POKEMON_DATA, PokemonDataEntry } from "@/src/data/pokemon";

interface EvolutionMethodRecord {
  slug: string;
  names: Record<SupportedLanguage, string>;
}

const getEvolutionMethodLabels = (
  methods: unknown,
  language: SupportedLanguage,
): string[] => {
  if (!Array.isArray(methods)) return [];
  return (methods as EvolutionMethodRecord[])
    .map(
      (method) => method.names[language] ?? method.names.de ?? method.names.en,
    )
    .filter((method): method is string => !!method);
};

const getEvolutionEntries = (
  pokemon: PokemonDataEntry,
  language: SupportedLanguage,
) =>
  (pokemon.evolutions ?? []).map((entry) => ({
    id: entry.id,
    methods: getEvolutionMethodLabels(entry.methods, language),
  }));

export interface MethodGenerationRule {
  methods: string[];
  minGeneration?: number;
  exactGeneration?: number;
  maxGeneration?: number;
}

const EVOLUTION_TABLES: Record<
  SupportedLanguage,
  Record<number, { id: number; methods: string[] }[]>
> = {
  de: Object.fromEntries(
    Object.entries(POKEMON_DATA).map(([id, pokemon]) => [
      Number(id),
      getEvolutionEntries(pokemon, "de"),
    ]),
  ),
  en: Object.fromEntries(
    Object.entries(POKEMON_DATA).map(([id, pokemon]) => [
      Number(id),
      getEvolutionEntries(pokemon, "en"),
    ]),
  ),
};

// id = pokemon which evolution results in
const METHOD_GENERATION_RULES: Record<number, MethodGenerationRule[]> = {
  20: [
    {
      methods: [
        "Level-Up - Level 20, Tageszeit: Nacht",
        "Level-Up - Level 20, Time of day: Night",
      ],
      minGeneration: 7,
    },
  ],
  28: [
    {
      methods: ["Item: Eisstein", "Item: Ice Stone"],
      minGeneration: 7,
    },
  ],
  38: [
    {
      methods: ["Item: Eisstein", "Item: Ice Stone"],
      minGeneration: 7,
    },
  ],
  53: [
    {
      methods: ["Level-Up - Freundschaft ≥ 160", "Level-Up - Friendship ≥ 160"],
      minGeneration: 7,
    },
  ],
  80: [
    {
      methods: ["Item: Galarnuss-Reif", "Item: Galarica Cuff"],
      minGeneration: 7,
    },
  ],
  105: [
    {
      methods: [
        "Level-Up - Level 28, Tageszeit: Nacht",
        "Level-Up - Level 28, Time of day: Night",
      ],
      minGeneration: 7,
    },
  ],
  199: [
    {
      methods: ["Item: Galarnuss-Kranz", "Item: Galarica Wreath"],
      minGeneration: 7,
    },
  ],
  350: [
    {
      methods: ["Tausch - Trägt Schönschuppe", "Trade - Holds Prism Scale"],
      minGeneration: 5,
    },
  ],
  462: [
    {
      methods: ["Item: Donnerstein", "Item: Thunder Stone"],
      minGeneration: 8,
    },
  ],
  470: [
    {
      methods: ["Item: Blattstein", "Item: Leaf Stone"],
      minGeneration: 8,
    },
  ],
  471: [
    {
      methods: ["Item: Eisstein", "Item: Ice Stone"],
      minGeneration: 8,
    },
  ],
  700: [
    {
      methods: [
        "Level-Up - Freundschaft ≥ 160, Kennt Attacke vom Typ Fee",
        "Level-Up - Friendship ≥ 160, Knows move of type Fairy",
      ],
      minGeneration: 8,
    },
  ],
};

const LOCATION_METHOD_VERSION_RULES: Record<string, string[]> = {
  "Level-Up - Ort: Kraterberg": ["gen4_dp", "gen4_pt"],
  "Level-Up - Location: Mt. Coronet": ["gen4_dp", "gen4_pt"],
  "Level-Up - Ort: Elektrolithhöhle": ["gen5_bw", "gen5_b2w2"],
  "Level-Up - Location: Chargestone Cave": ["gen5_bw", "gen5_b2w2"],
  "Level-Up - Ort: Route 13": ["gen6_xy"],
  "Level-Up - Location: Route 13": ["gen6_xy"],
  "Level-Up - Ort: Ewigenwald": ["gen5_bw", "gen5_b2w2"],
  "Level-Up - Location: Pinwheel Forest": ["gen5_bw", "gen5_b2w2"],
  "Level-Up - Ort: Ewigwald": ["gen4_dp", "gen4_pt"],
  "Level-Up - Location: Eterna Forest": ["gen4_dp", "gen4_pt"],
  "Level-Up - Ort: Route 20": ["gen6_xy"],
  "Level-Up - Location: Route 20": ["gen6_xy"],
  "Level-Up - Ort: Route 217": ["gen4_dp", "gen4_pt"],
  "Level-Up - Location: Route 217": ["gen4_dp", "gen4_pt"],
  "Level-Up - Ort: Wendelberg": ["gen5_bw", "gen5_b2w2"],
  "Level-Up - Location: Twist Mountain": ["gen5_bw", "gen5_b2w2"],
  "Level-Up - Ort: Frosthöhle": ["gen6_xy"],
  "Level-Up - Location: Frost Cavern": ["gen6_xy"],
  "Level-Up - Schönheit ≥ 170": [
    "gen3_rusa",
    "gen3_em",
    "gen4_dp",
    "gen4_pt",
    "gen4_hgss",
    "gen6_oras",
  ],
  "Level-Up - Beauty ≥ 170": [
    "gen3_rusa",
    "gen3_em",
    "gen4_dp",
    "gen4_pt",
    "gen4_hgss",
    "gen6_oras",
  ],
};

export function methodAllowedForVersion(
  method: string,
  gameVersionId?: string,
) {
  if (!gameVersionId) return true;
  const allowedVersions = LOCATION_METHOD_VERSION_RULES[method];
  if (!allowedVersions) return true;
  return allowedVersions.includes(gameVersionId);
}

export function filterMethodsForConstraints(
  pokemonId: number,
  methods: string[] | undefined,
  generation?: number | null,
  gameVersionId?: string,
) {
  if (!methods || methods.length === 0) return methods || [];
  let filtered = methods;
  if (typeof generation === "number") {
    const rules = METHOD_GENERATION_RULES[pokemonId];
    if (rules && rules.length) {
      filtered = filtered.filter((method) => {
        const rule = rules.find((r) => r.methods?.includes(method));
        if (!rule) return true;
        if (
          typeof rule.minGeneration === "number" &&
          generation < rule.minGeneration
        )
          return false;
        if (
          typeof rule.maxGeneration === "number" &&
          generation > rule.maxGeneration
        )
          return false;
        if (
          typeof rule.exactGeneration === "number" &&
          generation == rule.exactGeneration
        )
          return false;
        return true;
      });
    }
  }
  if (gameVersionId) {
    filtered = filtered.filter((method) =>
      methodAllowedForVersion(method, gameVersionId),
    );
  }
  return filtered;
}

export function getFilteredEvolutionEntriesForPokemon(
  pokemonId: number,
  language: SupportedLanguage,
  t: TFunction,
  generation?: number | null,
  gameVersionId?: string,
) {
  const evoTable = EVOLUTION_TABLES[language] || EVOLUTION_TABLES.de;
  const evoEntries = evoTable[pokemonId] || [];
  const generationLimit = typeof generation === "number" ? generation : null;
  const filteredEntries =
    generationLimit === null
      ? evoEntries
      : evoEntries.filter((entry) => {
          const gen = POKEMON_DATA[entry.id]?.generation;
          if (typeof gen !== "number") return true;
          return gen <= generationLimit;
        });
  if (filteredEntries.length === 0) return [];
  const defaultUnknown = t("tracker.evolveModal.methodUnknown");
  return filteredEntries
    .map((entry) => {
      const baseMethods =
        entry.methods && entry.methods.length
          ? entry.methods
          : [defaultUnknown];
      const methodsForConstraints = filterMethodsForConstraints(
        entry.id,
        baseMethods,
        generation,
        gameVersionId,
      );
      return {
        id: entry.id,
        methods: methodsForConstraints,
      };
    })
    .filter((entry) => entry.methods.length > 0);
}
