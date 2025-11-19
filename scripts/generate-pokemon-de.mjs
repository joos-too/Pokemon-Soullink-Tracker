#!/usr/bin/env node
import {Pokedex} from 'pokeapi-js-wrapper';
import {writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outGermanNamesPath = path.resolve(__dirname, '../src/data/pokemon-de.ts');
const outEnglishNamesPath = path.resolve(__dirname, '../src/data/pokemon-en.ts');
const outMapPath = path.resolve(__dirname, '../src/data/pokemon-map.ts');
const outEvoPath = path.resolve(__dirname, '../src/data/pokemon-evolutions.ts');

const API_BASE = 'https://pokeapi.co/api/v2';
const MAX_GENERATION = 6;

const SUPPORTED_LANGUAGES = ['de', 'en'];

const MANUAL_TRANSLATIONS = {
  de: {
    location: {
      'chargestone-cave': 'Elektrolithhöhle',
      'mt-coronet': 'Kraterberg',
      'eterna-forest': 'Ewigwald',
      'pinwheel-forest': 'Ewigenwald',
      'twist-mountain': 'Wendelberg',
    },
    species: {
      shedinja: 'Ninjatom',
    },
    trigger: {
      'three-critical-hits': '3 Kritische Treffer',
    },
    item: {
      'dusk-stone': 'Finsterstein',
      'thunder-stone': 'Donnerstein',
    },
    move: {},
    type: {},
  },
  en: {
    location: {},
    species: {},
    trigger: {
      'three-critical-hits': '3 Critical Hits',
    },
    item: {},
    move: {},
    type: {},
  },
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const SKIPPED_EVOLUTIONS = new Set(['489:490']);

async function withRetry(fn, attempts = 3, delayMs = 500) {
    let lastError;
    for (let i = 0; i < attempts; i++) {
        try {
            return await fn();
        } catch (err) {
            lastError = err;
            if (i < attempts - 1) {
                await sleep(delayMs * (i + 1));
            }
        }
    }
    throw lastError;
}

async function fetchJson(path) {
    const res = await fetch(`${API_BASE}${path}`);
    if (!res.ok) {
        throw new Error(`Failed to fetch ${path}: ${res.status}`);
    }
    return res.json();
}

async function fetchWithFallback(wrapperFn, fallbackPath) {
    try {
        return await withRetry(wrapperFn, 3, 600);
    } catch (err) {
        if (!fallbackPath) throw err;
        try {
            return await withRetry(() => fetchJson(fallbackPath), 3, 800);
        } catch {
            return null;
        }
    }
}

function formatSlugName(slug) {
    if (!slug || typeof slug !== 'string') return '';
    return slug
        .split(/[-\s]+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}

function getManualTranslation(locale, category, key) {
    return MANUAL_TRANSLATIONS?.[locale]?.[category]?.[key] || null;
}

function buildLocalizedRecord(slug, names = [], category) {
    const record = {};
    SUPPORTED_LANGUAGES.forEach((locale) => {
        const manual = getManualTranslation(locale, category, slug);
        if (manual) {
            record[locale] = manual;
            return;
        }
        const preferredLanguageCode = locale === 'en' ? 'en' : 'de';
        const preferred = names.find((n) => n.language?.name === preferredLanguageCode)?.name;
        if (preferred) {
            record[locale] = preferred;
            return;
        }
        if (locale === 'de') {
            const fallbackEn = names.find((n) => n.language?.name === 'en')?.name;
            if (fallbackEn) {
                record[locale] = fallbackEn;
                return;
            }
        }
        record[locale] = formatSlugName(slug);
    });
    return record;
}

function resolveTranslationFromRecord(recordMap, slug, locale, category) {
    if (!slug) return '';
    const manual = getManualTranslation(locale, category, slug);
    if (manual) return manual;
    const record = recordMap.get(slug);
    if (record?.[locale]) return record[locale];
    const fallbackLocale = locale === 'de' ? 'en' : 'de';
    if (record?.[fallbackLocale]) return record[fallbackLocale];
    return formatSlugName(slug);
}

function createTranslators(locale, resources) {
    const {
        itemTranslations,
        moveTranslations,
        typeTranslations,
        locationTranslations,
        speciesSlugToName,
    } = resources;
    return {
        item: (slug) => resolveTranslationFromRecord(itemTranslations, slug, locale, 'item'),
        move: (slug) => resolveTranslationFromRecord(moveTranslations, slug, locale, 'move'),
        type: (slug) => resolveTranslationFromRecord(typeTranslations, slug, locale, 'type'),
        location: (slug) => resolveTranslationFromRecord(locationTranslations, slug, locale, 'location'),
        species: (slug) => {
            if (!slug) return '';
            const manual = getManualTranslation(locale, 'species', slug);
            if (manual) return manual;
            const primary = speciesSlugToName[locale]?.get(slug);
            if (primary) return primary;
            const fallbackLocale = locale === 'de' ? 'en' : 'de';
            const fallback = speciesSlugToName[fallbackLocale]?.get(slug);
            if (fallback) return fallback;
            return formatSlugName(slug);
        },
    };
}

async function loadItemTranslations(P, slugs) {
    const result = new Map();
    if (!slugs || slugs.size === 0) return result;
    const arr = Array.from(slugs);
    const ITEM_CHUNK = 50;
    for (let i = 0; i < arr.length; i += ITEM_CHUNK) {
        const slice = arr.slice(i, i + ITEM_CHUNK);
        const items = await Promise.all(
            slice.map((slug) =>
                fetchWithFallback(() => P.getItemByName(slug), `/item/${slug}`).catch(() => null)
            )
        );
        items.forEach((item, idx) => {
            const slug = slice[idx];
            if (!slug) return;
            const names = item?.names || [];
            result.set(slug, buildLocalizedRecord(slug, names, 'item'));
        });
    }
    return result;
}

async function loadMoveTranslations(P, slugs) {
    const result = new Map();
    if (!slugs || slugs.size === 0) return result;
    const arr = Array.from(slugs);
    const MOVE_CHUNK = 50;
    for (let i = 0; i < arr.length; i += MOVE_CHUNK) {
        const slice = arr.slice(i, i + MOVE_CHUNK);
        const moves = await Promise.all(
            slice.map((slug) =>
                fetchWithFallback(() => P.getMoveByName(slug), `/move/${slug}`).catch(() => null)
            )
        );
        moves.forEach((move, idx) => {
            const slug = slice[idx];
            if (!slug) return;
            const names = move?.names || [];
            result.set(slug, buildLocalizedRecord(slug, names, 'move'));
        });
    }
    return result;
}

async function loadTypeTranslations(P, slugs) {
    const result = new Map();
    if (!slugs || slugs.size === 0) return result;
    const arr = Array.from(slugs);
    const TYPE_CHUNK = 50;
    for (let i = 0; i < arr.length; i += TYPE_CHUNK) {
        const slice = arr.slice(i, i + TYPE_CHUNK);
        const types = await Promise.all(
            slice.map((slug) =>
                fetchWithFallback(() => P.getTypeByName(slug), `/type/${slug}`).catch(() => null)
            )
        );
        types.forEach((type, idx) => {
            const slug = slice[idx];
            if (!slug) return;
            const names = type?.names || [];
            result.set(slug, buildLocalizedRecord(slug, names, 'type'));
        });
    }
    return result;
}

async function loadLocationTranslations(P, slugs) {
    const result = new Map();
    if (!slugs || slugs.size === 0) return result;
    const arr = Array.from(slugs);
    const LOC_CHUNK = 40;
    for (let i = 0; i < arr.length; i += LOC_CHUNK) {
        const slice = arr.slice(i, i + LOC_CHUNK);
        const locations = await Promise.all(
            slice.map((slug) =>
                fetchWithFallback(() => P.getLocationByName(slug), `/location/${slug}`).catch(() => null)
            )
        );
        locations.forEach((loc, idx) => {
            const slug = slice[idx];
            if (!slug) return;
            const names = loc?.names || [];
            result.set(slug, buildLocalizedRecord(slug, names, 'location'));
        });
    }
    return result;
}

const LANGUAGE_TEXT = {
    de: {
        unknownRequirement: 'Bedingung unbekannt',
        unknownCondition: 'Unbekannte Bedingung',
        locationPrefix: 'Level-Up - Ort: ',
        baseLevelUp: 'Level-Up',
        baseTrade: 'Tausch',
        baseTradeWith: (name) => `Tausch mit ${name}`,
        baseUseItem: 'Item verwenden',
        baseItemWithName: (name) => `Item: ${name}`,
        baseSpecial: 'Spezial',
        baseSpecialSpecies: (name) => `Spezial: ${name}`,
        level: (value) => `Level ${value}`,
        friendship: (value) => `Freundschaft ≥ ${value}`,
        affection: (value) => `Zutrauen ≥ ${value}`,
        beauty: (value) => `Schönheit ≥ ${value}`,
        timeOfDayMap: {day: 'Tag', night: 'Nacht', dusk: 'Abend'},
        timeOfDay: (value) => `Tageszeit: ${value}`,
        overworldRain: 'Regen in der Oberwelt',
        genderFemale: 'Nur weiblich',
        genderMale: 'Nur männlich',
        criticalHitsExact: '3 Kritische Treffer',
        criticalHits: (value) => `Kritische Treffer ≥ ${value}`,
        heldItem: (name) => `Trägt ${name}`,
        knownMove: (name) => `Kennt ${name}`,
        knownMoveType: (name) => `Kennt Attacke vom Typ ${name}`,
        location: (name) => `Ort: ${name}`,
        partySpecies: (name) => `Team: ${name}`,
        partyType: (type) => `Pokémon von Typ ${type} im Team`,
        statsLess: 'Angriff < Verteidigung',
        statsEqual: 'Angriff = Verteidigung',
        statsGreater: 'Angriff > Verteidigung',
        upsideDown: 'Konsole umdrehen',
    },
    en: {
        unknownRequirement: 'Requirement unknown',
        unknownCondition: 'Unknown condition',
        locationPrefix: 'Level-Up - Location: ',
        baseLevelUp: 'Level-Up',
        baseTrade: 'Trade',
        baseTradeWith: (name) => `Trade with ${name}`,
        baseUseItem: 'Use item',
        baseItemWithName: (name) => `Item: ${name}`,
        baseSpecial: 'Special',
        baseSpecialSpecies: (name) => `Special: ${name}`,
        level: (value) => `Level ${value}`,
        friendship: (value) => `Friendship ≥ ${value}`,
        affection: (value) => `Affection ≥ ${value}`,
        beauty: (value) => `Beauty ≥ ${value}`,
        timeOfDayMap: {day: 'Day', night: 'Night', dusk: 'Dusk'},
        timeOfDay: (value) => `Time of day: ${value}`,
        overworldRain: 'Overworld rain',
        genderFemale: 'Only female',
        genderMale: 'Only male',
        criticalHitsExact: '3 Critical Hits',
        criticalHits: (value) => `Critical hits ≥ ${value}`,
        heldItem: (name) => `Holds ${name}`,
        knownMove: (name) => `Knows ${name}`,
        knownMoveType: (name) => `Knows move of type ${name}`,
        location: (name) => `Location: ${name}`,
        partySpecies: (name) => `Party: ${name}`,
        partyType: (type) => `Pokémon of type ${type} in party`,
        statsLess: 'Attack < Defense',
        statsEqual: 'Attack = Defense',
        statsGreater: 'Attack > Defense',
        upsideDown: 'Turn console upside down',
    },
};

function describeEvolutionDetail(detail, translators = {}, locale = 'de') {
    const langText = LANGUAGE_TEXT[locale] || LANGUAGE_TEXT.de;
    if (!detail) return langText.unknownRequirement;
    const translateItem = (slug) => {
        if (!slug) return '';
        const fn = translators.item;
        const value = fn ? fn(slug) : null;
        return value || formatSlugName(slug);
    };
    const translateMove = (slug) => {
        if (!slug) return '';
        const fn = translators.move;
        const value = fn ? fn(slug) : null;
        return value || formatSlugName(slug);
    };
    const translateType = (slug) => {
        if (!slug) return '';
        const fn = translators.type;
        const value = fn ? fn(slug) : null;
        return value || formatSlugName(slug);
    };
    const translateLocation = (slug) => {
        if (!slug) return '';
        const fn = translators.location;
        const value = fn ? fn(slug) : null;
        return value || formatSlugName(slug);
    };
    const translateSpecies = (slug) => {
        if (!slug) return '';
        const fn = translators.species;
        const value = fn ? fn(slug) : null;
        return value || formatSlugName(slug);
    };
    const extras = [];
    const add = (value) => {
        if (value && !extras.includes(value)) extras.push(value);
    };

    if (typeof detail.min_level === 'number') add(langText.level(detail.min_level));
    if (typeof detail.min_happiness === 'number') add(langText.friendship(detail.min_happiness));
    if (typeof detail.min_affection === 'number') add(langText.affection(detail.min_affection));
    if (typeof detail.min_beauty === 'number') add(langText.beauty(detail.min_beauty));
    if (detail.time_of_day) {
        const key = detail.time_of_day.trim().toLowerCase();
        const map = langText.timeOfDayMap || {};
        const mapped = map[key] || formatSlugName(detail.time_of_day);
        add(langText.timeOfDay(mapped));
    }
    if (detail.needs_overworld_rain) add(langText.overworldRain);
    if (typeof detail.gender === 'number') {
        if (detail.gender === 1) add(langText.genderFemale);
        else if (detail.gender === 2) add(langText.genderMale);
    }
    if (typeof detail.min_critical_hits === 'number') {
        if (detail.min_critical_hits === 3) add(langText.criticalHitsExact);
        else add(langText.criticalHits(detail.min_critical_hits));
    }
    if (detail.held_item?.name) add(langText.heldItem(translateItem(detail.held_item.name)));
    if (detail.known_move?.name) add(langText.knownMove(translateMove(detail.known_move.name)));
    if (detail.known_move_type?.name) add(langText.knownMoveType(translateType(detail.known_move_type.name)));
    if (detail.location?.name) add(langText.location(translateLocation(detail.location.name)));
    if (detail.party_species?.name) add(langText.partySpecies(translateSpecies(detail.party_species.name)));
    if (detail.party_type?.name) add(langText.partyType(translateType(detail.party_type.name)));
    if (typeof detail.relative_physical_stats === 'number') {
        if (detail.relative_physical_stats === -1) add(langText.statsLess);
        else if (detail.relative_physical_stats === 0) add(langText.statsEqual);
        else if (detail.relative_physical_stats === 1) add(langText.statsGreater);
    }
    if (detail.turn_upside_down) add(langText.upsideDown);
    let base = '';
    const trigger = detail.trigger?.name || '';
    switch (trigger) {
        case 'level-up':
            base = langText.baseLevelUp;
            break;
        case 'trade':
            base = detail.trade_species?.name
                ? langText.baseTradeWith(translateSpecies(detail.trade_species.name))
                : langText.baseTrade;
            break;
        case 'use-item':
            base = detail.item?.name
                ? langText.baseItemWithName(translateItem(detail.item.name))
                : langText.baseUseItem;
            break;
        case 'shed':
            base = langText.baseSpecialSpecies(translateSpecies('shedinja') || formatSlugName('shedinja'));
            break;
        case 'three-critical-hits':
            base = getManualTranslation(locale, 'trigger', trigger) || langText.criticalHitsExact;
            break;
        case 'other':
            base = langText.baseSpecial;
            break;
        default:
            base = trigger
                ? getManualTranslation(locale, 'trigger', trigger) || formatSlugName(trigger)
                : langText.baseSpecial;
    }
    if (!base) base = langText.baseSpecial;
    if (extras.length === 0 && base.startsWith('Item:') && !detail.item?.name) {
        extras.push(langText.unknownCondition);
    }
    return extras.length ? `${base} - ${extras.join(', ')}` : base;
}

async function main() {
    // Disable wrapper caching in Node (localforage has no backend here)
    const P = new Pokedex({timeout: 15000, cache: false});
    console.log('Fetching species list…');
    const list = await withRetry(() => P.getPokemonSpeciesList({limit: 20000, offset: 0}), 5, 800);
    const items = list.results || [];

    const ids = items
        .map((it) => {
            const m = it.url.match(/\/pokemon-species\/(\d+)\/?$/);
            return m ? Number(m[1]) : null;
        })
        .filter((x) => !!x);

    const nameEntriesByLocale = {
        de: new Map(),
        en: new Map(),
    }; // Record<locale, Map<lowerName, { name: string; id: number; generation: number }>>
    const nameToIdByLocale = {
        de: new Map(),
        en: new Map(),
    }; // Record<locale, Map<lowerCaseName, id>>
    const chainIds = new Set();
    const itemSlugs = new Set();
    const moveSlugs = new Set();
    const typeSlugs = new Set();
    const locationSlugs = new Set();
    const speciesSlugToName = {
        de: new Map(),
        en: new Map(),
    };
    const ensureSpeciesEntry = (slug) => {
        if (!slug) return;
        SUPPORTED_LANGUAGES.forEach((locale) => {
            if (!speciesSlugToName[locale].has(slug)) {
                speciesSlugToName[locale].set(slug, formatSlugName(slug));
            }
        });
    };
    const allowedSpeciesIds = new Set();
    const idToGeneration = new Map();
    const CHUNK = 50;
    for (let i = 0; i < ids.length; i += CHUNK) {
        const slice = ids.slice(i, i + CHUNK);
        process.stdout.write(`Fetching ${i + 1}-${Math.min(i + CHUNK, ids.length)} of ${ids.length}\r`);
        const speciesArr = await Promise.all(
            slice.map((id) =>
                withRetry(() => P.getPokemonSpeciesByName(id), 5, 800).catch(() => null)
            )
        );
        for (const sp of speciesArr) {
            if (!sp) continue;
            const genUrl = sp.generation?.url || '';
            const gm = genUrl.match(/\/generation\/(\d+)\/?$/);
            const genNumber = gm ? Number(gm[1]) : Infinity;
            if (!genNumber || genNumber > MAX_GENERATION) continue;
            const namesField = sp.names || [];
            const de = namesField.find((n) => n.language?.name === 'de');
            const en = namesField.find((n) => n.language?.name === 'en');
            const fallbackSlugName = sp.name ? formatSlugName(sp.name) : '';
            const germanName = (de?.name || en?.name || fallbackSlugName || '').trim();
            const englishName = (en?.name || fallbackSlugName || germanName || '').trim();
            const addNameForLocale = (locale, value) => {
                if (!value) return;
                const lower = value.toLowerCase();
                const entries = nameEntriesByLocale[locale];
                if (!entries.has(lower)) {
                    entries.set(lower, {
                        name: value,
                        id: sp.id,
                        generation: genNumber,
                    });
                }
                nameToIdByLocale[locale].set(lower, sp.id);
                if (sp.name) {
                    speciesSlugToName[locale].set(String(sp.name), value);
                }
            };
            addNameForLocale('de', germanName);
            addNameForLocale('en', englishName);
            allowedSpeciesIds.add(sp.id);
            idToGeneration.set(sp.id, genNumber);
            const chainUrl = sp.evolution_chain?.url || '';
            const m2 = chainUrl && chainUrl.match(/\/evolution-chain\/(\d+)\/?$/);
            if (m2) chainIds.add(Number(m2[1]));
        }
    }

    const germanNameList = [...nameEntriesByLocale.de.values()].sort((a, b) => a.name.localeCompare(b.name, 'de'));
    const englishNameList = [...nameEntriesByLocale.en.values()].sort((a, b) => a.name.localeCompare(b.name, 'en'));
    const germanNamesFile = `// Generated by scripts/generate-pokemon-de.mjs\nexport const GERMAN_POKEMON_NAMES: { name: string; id: number; generation: number }[] = ${JSON.stringify(germanNameList, null, 2)};\n`;
    const englishNamesFile = `// Generated by scripts/generate-pokemon-de.mjs\nexport const ENGLISH_POKEMON_NAMES: { name: string; id: number; generation: number }[] = ${JSON.stringify(englishNameList, null, 2)};\n`;
    await writeFile(outGermanNamesPath, germanNamesFile, 'utf8');
    await writeFile(outEnglishNamesPath, englishNamesFile, 'utf8');
    const germanMap = Object.fromEntries([...nameToIdByLocale.de.entries()].sort(([a], [b]) => a.localeCompare(b, 'de')));
    const englishMap = Object.fromEntries([...nameToIdByLocale.en.entries()].sort(([a], [b]) => a.localeCompare(b, 'en')));
    const idToGenerationObj = Object.fromEntries([...idToGeneration.entries()].sort(([a], [b]) => Number(a) - Number(b)));
    const mapFile = `// Generated by scripts/generate-pokemon-de.mjs\nexport const GERMAN_TO_ID: Record<string, number> = ${JSON.stringify(germanMap, null, 2)};\n\nexport const ENGLISH_TO_ID: Record<string, number> = ${JSON.stringify(englishMap, null, 2)};\n\nexport const POKEMON_ID_TO_GENERATION: Record<number, number> = ${JSON.stringify(idToGenerationObj, null, 2)};\n`;
    await writeFile(outMapPath, mapFile, 'utf8');

    // Build evolutions map from evolution chains
    const evoMap = new Map(); // Map<fromId, Map<toId, EvolutionDetail[] | null[]>>
    const chainIdArr = Array.from(chainIds);
    const CHAIN_CHUNK = 30;
    for (let i = 0; i < chainIdArr.length; i += CHAIN_CHUNK) {
        const slice = chainIdArr.slice(i, i + CHAIN_CHUNK);
        process.stdout.write(`Fetching evolution chains ${i + 1}-${Math.min(i + CHAIN_CHUNK, chainIdArr.length)} of ${chainIdArr.length}      \r`);
        const chains = await Promise.all(
            slice.map((cid) =>
                withRetry(() => P.getEvolutionChainById(cid), 5, 800).catch(() => null)
            )
        );
        for (const ch of chains) {
            if (!ch?.chain) continue;
            const walk = (node) => {
                if (!node) return;
                const fromUrl = node.species?.url || '';
                const m = fromUrl.match(/\/pokemon-species\/(\d+)\/?$/);
                const fromId = m ? Number(m[1]) : null;
                const arr = Array.isArray(node.evolves_to) ? node.evolves_to : [];
                for (const child of arr) {
                    const cu = child?.species?.url || '';
                    const cm = cu.match(/\/pokemon-species\/(\d+)\/?$/);
                    const cid2 = cm ? Number(cm[1]) : null;
                    if (fromId && cid2) {
                        const skipKey = `${fromId}:${cid2}`;
                        if (SKIPPED_EVOLUTIONS.has(skipKey)) continue;
                        if (!evoMap.has(fromId)) evoMap.set(fromId, new Map());
                        const targetMap = evoMap.get(fromId);
                        const fromAllowed = allowedSpeciesIds.has(fromId);
                        const toAllowed = cid2 && allowedSpeciesIds.has(cid2);
                        if (fromAllowed && toAllowed) {
                            if (!targetMap.has(cid2)) targetMap.set(cid2, []);
                            const store = targetMap.get(cid2);
                            const details = Array.isArray(child.evolution_details) ? child.evolution_details : [];
                            if (!details.length) {
                                store.push(null);
                            } else {
                                for (const detail of details) {
                                    if (detail?.item?.name) itemSlugs.add(detail.item.name);
                                    if (detail?.held_item?.name) itemSlugs.add(detail.held_item.name);
                                    if (detail?.known_move?.name) moveSlugs.add(detail.known_move.name);
                                    if (detail?.known_move_type?.name) typeSlugs.add(detail.known_move_type.name);
                                    if (detail?.party_type?.name) typeSlugs.add(detail.party_type.name);
                                    if (detail?.location?.name) locationSlugs.add(detail.location.name);
                                    if (detail?.party_species?.name) {
                                        ensureSpeciesEntry(detail.party_species.name);
                                    }
                                    if (detail?.trade_species?.name) {
                                        ensureSpeciesEntry(detail.trade_species.name);
                                    }
                                    store.push(detail || null);
                                }
                            }
                        }
                    }
                }
                for (const child of arr) walk(child);
            };
            walk(ch.chain);
        }
    }
    const [itemTranslations, moveTranslations, typeTranslations, locationTranslations] = await Promise.all([
        loadItemTranslations(P, itemSlugs),
        loadMoveTranslations(P, moveSlugs),
        loadTypeTranslations(P, typeSlugs),
        loadLocationTranslations(P, locationSlugs),
    ]);
    const translatorResources = {
        itemTranslations,
        moveTranslations,
        typeTranslations,
        locationTranslations,
        speciesSlugToName,
    };

    const buildEvolutionTable = (locale) => {
        const translators = createTranslators(locale, translatorResources);
        return Object.fromEntries(
            [...evoMap.entries()]
                .sort(([a], [b]) => Number(a) - Number(b))
                .map(([fromId, toMap]) => [
                    fromId,
                    [...toMap.entries()]
                        .map(([toId, detailList]) => {
                            const methodSet = new Set();
                            const normalized = detailList && detailList.length ? detailList : [null];
                            normalized.forEach((detail) => {
                                const text = describeEvolutionDetail(detail, translators, locale);
                                if (text) methodSet.add(text);
                            });
                            if (!methodSet.size) methodSet.add(LANGUAGE_TEXT[locale]?.unknownRequirement || LANGUAGE_TEXT.de.unknownRequirement);
                            return {
                                id: Number(toId),
                                methods: Array.from(methodSet).sort((a, b) => a.localeCompare(b, locale === 'en' ? 'en' : 'de')),
                            };
                        })
                        .sort((a, b) => a.id - b.id),
                ])
        );
    };

    const evolutionTables = {
        de: buildEvolutionTable('de'),
        en: buildEvolutionTable('en'),
    };
    const evoFile = `// Generated by scripts/generate-pokemon-de.mjs\nexport const EVOLUTIONS_DE: Record<number, { id: number; methods: string[] }[]> = ${JSON.stringify(evolutionTables.de, null, 2)};\n\nexport const EVOLUTIONS_EN: Record<number, { id: number; methods: string[] }[]> = ${JSON.stringify(evolutionTables.en, null, 2)};\n`;
    await writeFile(outEvoPath, evoFile, 'utf8');

    console.log(`\nWrote ${germanNameList.length} German names to ${outGermanNamesPath}`);
    console.log(`Wrote ${englishNameList.length} English names to ${outEnglishNamesPath}`);
    console.log(`Wrote ${Object.keys(germanMap).length + Object.keys(englishMap).length} name mappings to ${outMapPath}`);
    console.log(`Wrote ${Object.keys(evolutionTables.de).length} evolution entries per locale to ${outEvoPath}`);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
