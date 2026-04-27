import { ITEMS } from "@/src/data/items";
import { getItemsForVersion } from "@/src/services/itemFilter";
import { STONES, FOSSILS, MEGA_STONES } from "@/src/services/init";
import type { SupportedLanguage } from "@/src/utils/language";

/** Slugs already covered by the Stones tab */
const STONE_SLUGS = new Set(STONES.map((s) => s.id));

/** Slugs already covered by the Fossils tab */
const FOSSIL_SLUGS = new Set(FOSSILS.map((f) => f.id));

/** Slugs already covered by the Mega Stones tab */
const MEGA_STONE_SLUGS = new Set(MEGA_STONES.map((m) => m.id));

/** Strip diacritics: é→e, ü→u, etc. */
function stripDiacritics(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

interface ItemEntry {
  slug: string;
  de: string;
  en: string;
  version: string;
  normDe: string;
  normEn: string;
}

const ITEM_ENTRIES: ItemEntry[] = ITEMS.map((item) => ({
  ...item,
  normDe: stripDiacritics(item.de.toLowerCase()),
  normEn: stripDiacritics(item.en.toLowerCase()),
}));

export interface ItemSearchResult {
  slug: string;
  name: string;
  spriteUrl: string;
}

/** PokeAPI item sprite URL */
function getSpriteUrl(slug: string): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${slug}.png`;
}

export function searchItems(
  query: string,
  locale: SupportedLanguage = "de",
  gameVersionId?: string,
  max = 10,
): ItemSearchResult[] {
  const q = stripDiacritics(query.trim().toLowerCase());
  if (q.length < 1) return [];

  const allowedSlugs = gameVersionId
    ? new Set(getItemsForVersion(gameVersionId).map((i) => i.slug))
    : null;

  const field = locale === "de" ? "normDe" : "normEn";
  const nameField = locale === "de" ? "de" : "en";

  return ITEM_ENTRIES.filter(
    (entry) =>
      !STONE_SLUGS.has(entry.slug) &&
      !FOSSIL_SLUGS.has(entry.slug) &&
      !MEGA_STONE_SLUGS.has(entry.slug) &&
      entry[field].includes(q) &&
      (!allowedSlugs || allowedSlugs.has(entry.slug)),
  )
    .sort((a, b) => a[nameField].localeCompare(b[nameField]))
    .slice(0, max)
    .map((entry) => ({
      slug: entry.slug,
      name: entry[nameField],
      spriteUrl: getSpriteUrl(entry.slug),
    }));
}

export function getItemName(
  slug: string,
  locale: SupportedLanguage = "de",
): string {
  const item = ITEMS.find((i) => i.slug === slug);
  if (!item) return slug;
  return locale === "de" ? item.de : item.en;
}

export function getItemSpriteUrl(slug: string): string {
  return getSpriteUrl(slug);
}
