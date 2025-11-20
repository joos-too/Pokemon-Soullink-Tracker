import {LOCATION_SUGGESTIONS} from '@/src/data/location-suggestions';
import {SupportedLanguage} from '@/src/utils/language';

const DEFAULT_GAME_VERSION_ID = 'gen5_sw';

interface SearchOptions {
    locale?: SupportedLanguage;
    gameVersionId?: string;
}

interface LocationEntry {
    name: string;
    slug: string;
    lower: string;
    region: string | null;
}

const DEFAULT_LOCATION_LOCALE: SupportedLanguage = 'en';

const ROUTE_NUMBER_NAME_REGEX = /\broute[\s-]*(\d+)\b/i;
const ROUTE_NUMBER_SLUG_REGEX = /route-(\d+)/i;

const SEA_ROUTE_PREFIX_REGEX = /^Sea\s+(?=Route\b)/i;

const normalizeRouteDisplayName = (name: string): string => name.replace(SEA_ROUTE_PREFIX_REGEX, '');

const VERSION_REGION_MAP: Record<string, string[]> = {
    gen1_rb: ['kanto'],
    gen1_g: ['kanto'],
    gen3_frbg: ['kanto'],
    gen2_gs: ['johto', 'kanto'],
    gen2_k: ['johto', 'kanto'],
    gen4_hgss: ['johto', 'kanto'],
    gen3_rusa: ['hoenn'],
    gen3_sm: ['hoenn'],
    gen6_oras: ['hoenn'],
    gen5_sw: ['unova'],
    gen5_s2w2: ['unova'],
    gen6_xy: ['kalos'],
    gen4_dp: ['sinnoh'],
    gen4_pt: ['sinnoh'],
};

const getRegionsForVersion = (versionId?: string): Set<string> => {
    const key = versionId && VERSION_REGION_MAP[versionId] ? versionId : DEFAULT_GAME_VERSION_ID;
    const regions = VERSION_REGION_MAP[key] || [];
    return new Set(regions.map((region) => region.toLowerCase()));
};

const parseRouteNumberFromName = (name: string): number | null => {
    if (!name) return null;
    const match = ROUTE_NUMBER_NAME_REGEX.exec(name);
    if (!match) return null;
    const value = Number(match[1]);
    return Number.isFinite(value) ? value : null;
};

const parseRouteNumberFromSlug = (slug: string): number | null => {
    if (!slug) return null;
    const match = ROUTE_NUMBER_SLUG_REGEX.exec(slug);
    if (!match) return null;
    const value = Number(match[1]);
    return Number.isFinite(value) ? value : null;
};

const getRouteNumberForEntry = (entry: LocationEntry): number | null => parseRouteNumberFromName(entry.name) ?? parseRouteNumberFromSlug(entry.slug);

const buildEntries = (items: { name: string; slug: string; region: string }[]): LocationEntry[] =>
    items.map((entry) => {
        const normalizedName = normalizeRouteDisplayName(entry.name);
        return {
            ...entry,
            name: normalizedName,
            lower: normalizedName.toLowerCase(),
        };
    });

const staticEntries = buildEntries((LOCATION_SUGGESTIONS.en || []).map((entry) => ({
    ...entry,
})));

const LOCATION_LISTS: Record<SupportedLanguage, LocationEntry[]> = {
    en: staticEntries,
    de: staticEntries,
};

export async function searchLocations(
    query: string,
    max = 10,
    options: SearchOptions = {},
): Promise<string[]> {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    const {locale = 'en', gameVersionId} = options;
    const allowedRegions = getRegionsForVersion(gameVersionId);
    if (!allowedRegions.size) return [];
    const fallbackList = LOCATION_LISTS[DEFAULT_LOCATION_LOCALE] ?? [];
    const list = LOCATION_LISTS[locale]?.length ? LOCATION_LISTS[locale] : fallbackList;
    const localeForCompare = DEFAULT_LOCATION_LOCALE;
    const filtered = list.filter((entry) => {
        const matchesTerm = entry.lower.includes(q);
        if (!matchesTerm) return false;
        if (!entry.region || !allowedRegions.has(entry.region)) return false;
        return getRouteNumberForEntry(entry) !== null;

    });
    filtered.sort((a, b) => {
        const aRoute = getRouteNumberForEntry(a);
        const bRoute = getRouteNumberForEntry(b);
        if (aRoute !== null && bRoute !== null) {
            if (aRoute !== bRoute) return aRoute - bRoute;
            const nameCompare = a.name.localeCompare(b.name, localeForCompare, {sensitivity: 'base'});
            if (nameCompare !== 0) return nameCompare;
            return a.slug.localeCompare(b.slug);
        }
        return a.name.localeCompare(b.name, localeForCompare, {sensitivity: 'base'});
    });
    const unique: LocationEntry[] = [];
    const seenNames = new Set<string>();
    filtered.forEach((entry) => {
        const normalized = entry.name.toLowerCase();
        if (!seenNames.has(normalized)) {
            seenNames.add(normalized);
            unique.push(entry);
        }
    });
    return unique.slice(0, max).map((entry) => entry.name);
}
