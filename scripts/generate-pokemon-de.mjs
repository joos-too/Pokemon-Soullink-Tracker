#!/usr/bin/env node
import { Pokedex } from 'pokeapi-js-wrapper';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outNamesPath = path.resolve(__dirname, '../src/data/pokemon-de.ts');
const outMapPath = path.resolve(__dirname, '../src/data/pokemon-de-map.ts');
const outEvoPath = path.resolve(__dirname, '../src/data/pokemon-evolutions.ts');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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

function formatSlugName(slug) {
  if (!slug || typeof slug !== 'string') return '';
  return slug
    .split(/[-\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
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
        withRetry(() => P.getItemByName(slug), 5, 800).catch(() => null)
      )
    );
    items.forEach((item, idx) => {
      const slug = slice[idx];
      if (!slug) return;
      const names = item?.names || [];
      const de = names.find((n) => n.language?.name === 'de');
      const en = names.find((n) => n.language?.name === 'en');
      result.set(slug, de?.name || en?.name || formatSlugName(slug));
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
        withRetry(() => P.getMoveByName(slug), 5, 800).catch(() => null)
      )
    );
    moves.forEach((move, idx) => {
      const slug = slice[idx];
      if (!slug) return;
      const names = move?.names || [];
      const de = names.find((n) => n.language?.name === 'de');
      const en = names.find((n) => n.language?.name === 'en');
      result.set(slug, de?.name || en?.name || formatSlugName(slug));
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
        withRetry(() => P.getTypeByName(slug), 5, 800).catch(() => null)
      )
    );
    types.forEach((type, idx) => {
      const slug = slice[idx];
      if (!slug) return;
      const names = type?.names || [];
      const de = names.find((n) => n.language?.name === 'de');
      const en = names.find((n) => n.language?.name === 'en');
      result.set(slug, de?.name || en?.name || formatSlugName(slug));
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
        withRetry(() => P.getLocationByName(slug), 5, 800).catch(() => null)
      )
    );
    locations.forEach((loc, idx) => {
      const slug = slice[idx];
      if (!slug) return;
      const names = loc?.names || [];
      const de = names.find((n) => n.language?.name === 'de');
      const en = names.find((n) => n.language?.name === 'en');
      result.set(slug, de?.name || en?.name || formatSlugName(slug));
    });
  }
  return result;
}

function describeEvolutionDetail(detail, translators = {}) {
  if (!detail) return 'Bedingung unbekannt';
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

  if (typeof detail.min_level === 'number') add(`Level ${detail.min_level}`);
  if (typeof detail.min_happiness === 'number') add(`Freundschaft ≥ ${detail.min_happiness}`);
  if (typeof detail.min_affection === 'number') add(`Zuneigung ≥ ${detail.min_affection}`);
  if (typeof detail.min_beauty === 'number') add(`Schönheit ≥ ${detail.min_beauty}`);
  if (detail.time_of_day) {
    const map = { day: 'Tag', night: 'Nacht', dusk: 'Abend' };
    const key = detail.time_of_day.trim().toLowerCase();
    add(`Tageszeit: ${map[key] || formatSlugName(detail.time_of_day)}`);
  }
  if (detail.needs_overworld_rain) add('Regen in der Oberwelt');
  if (typeof detail.gender === 'number') {
    if (detail.gender === 1) add('Nur weiblich');
    else if (detail.gender === 2) add('Nur männlich');
  }
  if (detail.held_item?.name) add(`Trägt ${translateItem(detail.held_item.name)}`);
  if (detail.known_move?.name) add(`Kennt ${translateMove(detail.known_move.name)}`);
  if (detail.known_move_type?.name) add(`Attackentyp ${translateType(detail.known_move_type.name)}`);
  if (detail.location?.name) add(`Ort: ${translateLocation(detail.location.name)}`);
  if (detail.party_species?.name) add(`Team: ${translateSpecies(detail.party_species.name)}`);
  if (detail.party_type?.name) add(`Team-Typ: ${translateType(detail.party_type.name)}`);
  if (typeof detail.relative_physical_stats === 'number') {
    if (detail.relative_physical_stats === -1) add('Angriff < Verteidigung');
    else if (detail.relative_physical_stats === 0) add('Angriff = Verteidigung');
    else if (detail.relative_physical_stats === 1) add('Angriff > Verteidigung');
  }
  if (detail.turn_upside_down) add('Konsole umdrehen');
  let base = '';
  const trigger = detail.trigger?.name || '';
  switch (trigger) {
    case 'level-up':
      base = 'Level-Up';
      break;
    case 'trade':
      base = detail.trade_species?.name
        ? `Tausch mit ${translateSpecies(detail.trade_species.name)}`
        : 'Tausch';
      break;
    case 'use-item':
      base = detail.item?.name ? `Item: ${translateItem(detail.item.name)}` : 'Item verwenden';
      break;
    case 'shed':
      base = 'Spezial: Shedinja';
      break;
    case 'other':
      base = 'Spezial';
      break;
    default:
      base = trigger ? formatSlugName(trigger) : 'Spezial';
  }
  if (!base) base = 'Spezial';
  if (extras.length === 0 && base.startsWith('Item:') && !detail.item?.name) {
    extras.push('Unbekannte Bedingung');
  }
  return extras.length ? `${base} – ${extras.join(', ')}` : base;
}

async function main() {
  // Disable wrapper caching in Node (localforage has no backend here)
  const P = new Pokedex({ timeout: 15000, cache: false });
  console.log('Fetching species list…');
  const list = await withRetry(() => P.getPokemonSpeciesList({ limit: 20000, offset: 0 }), 5, 800);
  const items = list.results || [];

  const ids = items
    .map((it) => {
      const m = it.url.match(/\/pokemon-species\/(\d+)\/?$/);
      return m ? Number(m[1]) : null;
    })
    .filter((x) => !!x);

  const results = [];
  const deToId = new Map(); // lower-case German name -> species id
  const chainIds = new Set();
  const itemSlugs = new Set();
  const moveSlugs = new Set();
  const typeSlugs = new Set();
  const locationSlugs = new Set();
  const speciesSlugToGerman = new Map();
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
      const namesField = sp.names || [];
      const de = namesField.find((n) => n.language?.name === 'de');
      const en = namesField.find((n) => n.language?.name === 'en');
      const nm = (de?.name || en?.name || sp.name || '').trim();
      if (sp.name && nm) {
        speciesSlugToGerman.set(String(sp.name), nm);
      }
      if (nm) results.push(nm);
      if (de?.name) {
        deToId.set(String(de.name).toLowerCase(), sp.id);
      } else if (sp.name) {
        // fallback: map english to id if no de
        deToId.set(String(sp.name).toLowerCase(), sp.id);
      }
      const chainUrl = sp.evolution_chain?.url || '';
      const m2 = chainUrl && chainUrl.match(/\/evolution-chain\/(\d+)\/?$/);
      if (m2) chainIds.add(Number(m2[1]));
    }
  }

  const unique = Array.from(new Set(results)).sort((a, b) => a.localeCompare(b, 'de'));
  const namesFile = `// Generated by scripts/generate-pokemon-de.mjs\nexport const GERMAN_POKEMON_NAMES: string[] = ${JSON.stringify(unique, null, 2)};\n`;
  await writeFile(outNamesPath, namesFile, 'utf8');
  const obj = Object.fromEntries([...deToId.entries()].sort(([a],[b]) => a.localeCompare(b, 'de')));
  const mapFile = `// Generated by scripts/generate-pokemon-de.mjs\nexport const GERMAN_TO_ID: Record<string, number> = ${JSON.stringify(obj, null, 2)};\n`;
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
            if (!evoMap.has(fromId)) evoMap.set(fromId, new Map());
            const targetMap = evoMap.get(fromId);
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
                if (detail?.party_species?.name && !speciesSlugToGerman.has(detail.party_species.name)) {
                  speciesSlugToGerman.set(detail.party_species.name, formatSlugName(detail.party_species.name));
                }
                if (detail?.trade_species?.name && !speciesSlugToGerman.has(detail.trade_species.name)) {
                  speciesSlugToGerman.set(detail.trade_species.name, formatSlugName(detail.trade_species.name));
                }
                store.push(detail || null);
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
  const translateItemName = (slug) => {
    if (!slug) return '';
    return itemTranslations.get(slug) || formatSlugName(slug);
  };
  const translateMoveName = (slug) => {
    if (!slug) return '';
    return moveTranslations.get(slug) || formatSlugName(slug);
  };
  const translateTypeName = (slug) => {
    if (!slug) return '';
    return typeTranslations.get(slug) || formatSlugName(slug);
  };
  const translateLocationName = (slug) => {
    if (!slug) return '';
    return locationTranslations.get(slug) || formatSlugName(slug);
  };
  const translateSpeciesName = (slug) => {
    if (!slug) return '';
    return speciesSlugToGerman.get(slug) || formatSlugName(slug);
  };
  const translators = {
    item: translateItemName,
    move: translateMoveName,
    type: translateTypeName,
    location: translateLocationName,
    species: translateSpeciesName,
  };

  const evoObj = Object.fromEntries(
    [...evoMap.entries()]
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([fromId, toMap]) => [
        fromId,
        [...toMap.entries()]
          .map(([toId, detailList]) => {
            const methodSet = new Set();
            const normalized = detailList && detailList.length ? detailList : [null];
            normalized.forEach((detail) => {
              const text = describeEvolutionDetail(detail, translators);
              if (text) methodSet.add(text);
            });
            if (!methodSet.size) methodSet.add('Bedingung unbekannt');
            return {
              id: Number(toId),
              methods: Array.from(methodSet).sort((a, b) => a.localeCompare(b, 'de')),
            };
          })
          .sort((a, b) => a.id - b.id),
      ])
  );
  const evoFile = `// Generated by scripts/generate-pokemon-de.mjs\nexport const EVOLUTIONS: Record<number, { id: number; methods: string[] }[]> = ${JSON.stringify(evoObj, null, 2)};\n`;
  await writeFile(outEvoPath, evoFile, 'utf8');

  console.log(`\nWrote ${unique.length} names to ${outNamesPath}`);
  console.log(`Wrote ${Object.keys(obj).length} mappings to ${outMapPath}`);
  console.log(`Wrote ${Object.keys(evoObj).length} evolution entries to ${outEvoPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
