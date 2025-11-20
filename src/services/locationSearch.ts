import { LOCATION_SUGGESTIONS } from '@/src/data/location-suggestions';
import { SupportedLanguage, SUPPORTED_LANGUAGES } from '@/src/utils/language';

interface SearchOptions {
  maxGeneration?: number;
  locale?: SupportedLanguage;
}

interface LocationEntry {
  name: string;
  slug: string;
  generations: number[];
  lower: string;
}

const API_BASE = 'https://pokeapi.co/api/v2';

const formatSlugName = (slug: string): string =>
  slug
    .split(/[-\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const buildEntries = (items: { name: string; slug: string; generations: number[] }[]): LocationEntry[] =>
  items.map((entry) => ({
    ...entry,
    lower: entry.name.toLowerCase(),
  }));

const LOCATION_LISTS: Record<SupportedLanguage, LocationEntry[]> = {
  de: buildEntries(LOCATION_SUGGESTIONS.de || []),
  en: buildEntries(LOCATION_SUGGESTIONS.en || []),
};

SUPPORTED_LANGUAGES.forEach((locale) => {
  if (!LOCATION_LISTS[locale]) {
    LOCATION_LISTS[locale] = LOCATION_LISTS.de;
  }
});

const parseGenerationFromSlug = (genSlug: string | undefined | null): number | null => {
  if (!genSlug) return null;
  const match = /generation-([a-z0-9]+)/i.exec(genSlug);
  if (!match) return null;
  const key = match[1].toLowerCase();
  const roman: Record<string, number> = {
    i: 1,
    ii: 2,
    iii: 3,
    iv: 4,
    v: 5,
    vi: 6,
    vii: 7,
    viii: 8,
    ix: 9,
  };
  if (roman[key]) return roman[key];
  const asNumber = Number(key);
  return Number.isFinite(asNumber) ? asNumber : null;
};

let remoteLoadPromise: Promise<void> | null = null;

const fetchRemoteLocations = async () => {
  try {
    const res = await fetch(`${API_BASE}/location?limit=2000`);
    if (!res.ok) return;
    const json = await res.json();
    const slugs: string[] = Array.isArray(json?.results)
      ? json.results.map((it: any) => it?.name).filter(Boolean)
      : [];
    if (!slugs.length) return;
    const translations = new Map<string, Record<SupportedLanguage, string>>();
    const generations = new Map<string, number[]>();
    const CHUNK = 40;
    for (let i = 0; i < slugs.length; i += CHUNK) {
      const slice = slugs.slice(i, i + CHUNK);
      const details = await Promise.all(
        slice.map(async (slug) => {
          try {
            const detailRes = await fetch(`${API_BASE}/location/${slug}`);
            if (!detailRes.ok) return null;
            return detailRes.json();
          } catch {
            return null;
          }
        }),
      );
      details.forEach((loc, idx) => {
        const slug = slice[idx];
        if (!slug) return;
        const names = Array.isArray(loc?.names) ? loc.names : [];
        const record: Record<SupportedLanguage, string> = {
          de: formatSlugName(slug),
          en: formatSlugName(slug),
        };
        names.forEach((entry: any) => {
          if (entry?.language?.name === 'de' && entry?.name) record.de = entry.name;
          if (entry?.language?.name === 'en' && entry?.name) record.en = entry.name;
        });
        translations.set(slug, record);
        const genSet = new Set<number>();
        const indices = Array.isArray(loc?.game_indices) ? loc.game_indices : [];
        indices.forEach((gi: any) => {
          const parsed = parseGenerationFromSlug(gi?.generation?.name || '');
          if (parsed) genSet.add(parsed);
        });
        const normalized = Array.from(genSet).filter((num) => Number.isFinite(num) && num > 0).sort((a, b) => a - b);
        generations.set(slug, normalized.length ? normalized : [6]);
      });
    }

    const nextLists: Record<SupportedLanguage, LocationEntry[]> = {
      de: [],
      en: [],
    };
    translations.forEach((record, slug) => {
      const gens = generations.get(slug) || [6];
      SUPPORTED_LANGUAGES.forEach((locale) => {
        const name = record[locale] || formatSlugName(slug);
        nextLists[locale].push({ name, slug, generations: gens, lower: name.toLowerCase() });
      });
    });
    SUPPORTED_LANGUAGES.forEach((locale) => {
      if (nextLists[locale].length) {
        nextLists[locale] = nextLists[locale].sort((a, b) => a.name.localeCompare(b.name, locale === 'en' ? 'en' : 'de'));
        LOCATION_LISTS[locale] = nextLists[locale];
      }
    });
  } catch (err) {
    console.error('Failed to load remote locations', err);
  }
};

const ensureLocations = async (locale: SupportedLanguage) => {
  if (LOCATION_LISTS[locale]?.length) return;
  if (!remoteLoadPromise) {
    remoteLoadPromise = fetchRemoteLocations();
  }
  await remoteLoadPromise;
};

export async function searchLocations(
  query: string,
  max = 10,
  options: SearchOptions = {},
): Promise<string[]> {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const { maxGeneration, locale = 'de' } = options;
  await ensureLocations(locale);
  const list = LOCATION_LISTS[locale] || LOCATION_LISTS.de;
  return list
    .filter((entry) => {
      const matchesTerm = entry.lower.includes(q);
      if (!matchesTerm) return false;
      if (typeof maxGeneration !== 'number') return true;
      return entry.generations.some((gen) => gen <= maxGeneration);
    })
    .slice(0, max)
    .map((entry) => entry.name);
}
