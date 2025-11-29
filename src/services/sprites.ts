import { findPokemonIdByName } from "@/src/services/pokemonSearch";

// Map game version IDs to PokeAPI sprite generation paths
export function getGenerationSpritePath(gameVersionId: string): string | null {
  const mapping: Record<string, string> = {
    // Generation I - using transparent variants
    gen1_rb: "versions/generation-i/red-blue/transparent",
    gen1_g: "versions/generation-i/yellow/transparent",
    // Generation II - using transparent variants
    gen2_gs: "versions/generation-ii/gold/transparent",
    gen2_k: "versions/generation-ii/crystal/transparent",
    // Generation III
    gen3_rusa: "versions/generation-iii/ruby-sapphire",
    gen3_sm: "versions/generation-iii/emerald",
    gen3_frbg: "versions/generation-iii/firered-leafgreen",
    // Generation IV
    gen4_dp: "versions/generation-iv/diamond-pearl",
    gen4_pt: "versions/generation-iv/platinum",
    gen4_hgss: "versions/generation-iv/heartgold-soulsilver",
    // Generation V
    gen5_sw: "versions/generation-v/black-white",
    gen5_s2w2: "versions/generation-v/black-white", // Gen 5 only has black-white sprites
    // Generation VI and later don't have version-specific sprites in PokeAPI
    // They use the modern unified sprites, so return null
  };
  return mapping[gameVersionId] || null;
}

// Known gaps where PokeAPI does not provide a sprite for the requested game,
// so we swap in a nearby generation path (or the default modern sprite).
type GenerationFallbackRule = {
  generationPath: string;
  fallbackPath: string | null;
  maxSupportedId?: number;
  minSupportedId?: number;
  missingIds?: Set<number>;
};

const GENERATION_SPRITE_FALLBACKS: GenerationFallbackRule[] = [
  {
    // PokeAPI only ships Kanto sprites for FR/LG; anything above 151 falls back to Emerald
    generationPath: "versions/generation-iii/firered-leafgreen",
    maxSupportedId: 151,
    fallbackPath: "versions/generation-iii/emerald",
  },
];

function applySpriteGenerationFallback(
  generationPath: string | null | undefined,
  id: number | null,
): string | null {
  if (!generationPath || !id) return generationPath || null;
  const rule = GENERATION_SPRITE_FALLBACKS.find(
    (entry) => entry.generationPath === generationPath,
  );
  if (!rule) return generationPath;

  const outsideMin =
    typeof rule.minSupportedId === "number" && id < rule.minSupportedId;
  const outsideMax =
    typeof rule.maxSupportedId === "number" && id > rule.maxSupportedId;
  const explicitlyMissing = rule.missingIds?.has(id);

  if (outsideMin || outsideMax || explicitlyMissing) return rule.fallbackPath;
  return generationPath;
}

// Official artwork (high-res) by numeric id
export function getOfficialArtworkUrlById(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
}

// Classic front sprite by numeric id
export function getSpriteUrlById(
  id: number,
  generationPath?: string | null,
): string {
  const effectiveGenerationPath = applySpriteGenerationFallback(
    generationPath,
    id,
  );
  if (effectiveGenerationPath) {
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${effectiveGenerationPath}/${id}.png`;
  }
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
}

// Resolve official artwork by localized name
export function getOfficialArtworkUrlForPokemonName(
  name: string | undefined | null,
): string | null {
  const match = findPokemonIdByName(name);
  if (!match) return null;
  return getOfficialArtworkUrlById(match.id);
}

// Resolve classic sprite by localized name
export function getSpriteUrlForPokemonName(
  name: string | undefined | null,
  generationPath?: string | null,
): string | null {
  const match = findPokemonIdByName(name);
  if (!match) return null;
  return getSpriteUrlById(match.id, generationPath);
}
