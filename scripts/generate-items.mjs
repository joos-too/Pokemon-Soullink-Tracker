/**
 * generate-items.mjs
 *
 * Fetches every item from PokeAPI (excluding "key" and "mail" pockets),
 * matches them against the local Itemlists/json/ files to determine the
 * earliest game version each item appeared in, then fetches the properly
 * cased English and German names from the API.
 *
 * Output format per item:
 *   { slug, de, en, version }
 *
 * Usage:  node scripts/generate-items.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const jsonDir = path.join(__dirname, "itemlists-source", "json");
const outPath = path.join(__dirname, "..", "src", "data", "items.ts");

// ---------------------------------------------------------------------------
// 1. Version-ordered JSON files  (earliest first)
// ---------------------------------------------------------------------------
const VERSION_FILES = [
  { file: "Gen1 RBY (Red, Blue & Yellow).json", version: "RBY" },
  { file: "Gen2 GS (Gold & Silver).json", version: "GS" },
  { file: "Gen2 C (Crystal).json", version: "C" },
  { file: "Gen3 RUSA (Ruby & Sapphire).json", version: "RUSA" },
  { file: "Gen3 FRLG (FireRed & LeafGreen).json", version: "FRLG" },
  { file: "Gen3 EM (Emerald).json", version: "EM" },
  { file: "Gen4 DP (Diamond & Pearl).json", version: "DP" },
  { file: "Gen4 PT (Platinum).json", version: "PT" },
  { file: "Gen4 HGSS (HeartGold & SoulSilver).json", version: "HGSS" },
  { file: "Gen5 BW (Black & White).json", version: "BW" },
  { file: "Gen5 B2W2 (Black 2 & White 2).json", version: "B2W2" },
  { file: "Gen6 XY (X & Y).json", version: "XY" },
  { file: "Gen6 ORAS (Omega Ruby & Alpha Sapphire).json", version: "ORAS" },
];

// Gen 7+ files — used only to distinguish "post-Gen6" from "truly unmatched"
const POST_GEN6_FILES = [
  { file: "Gen7 SM (Sun & Moon).json", version: "SM" },
  { file: "Gen7 USUM (Ultra Sun & Ultra Moon).json", version: "USUM" },
  {
    file: "Gen7 LGPLGE (Let's Go, Pikachu! & Let's Go, Eevee!).json",
    version: "LGPLGE",
  },
  { file: "Gen8 SWSH (Sword & Shield).json", version: "SWSH" },
  {
    file: "Gen8 BDSP (Brilliant Diamond & Shining Pearl).json",
    version: "BDSP",
  },
  { file: "Gen8 PLA (Pokémon Legends Arceus).json", version: "PLA" },
  { file: "Gen9 SCVI (Scarlet & Violet).json", version: "SCVI" },
  { file: "Gen9 PLZA (Pokémon Legends Z-A).json", version: "PLZA" },
];

// ---------------------------------------------------------------------------
// 2. Manual overrides for known mismatches between PokeAPI slugs and
//    the English names in the Itemlists (lowercase).
//    Key = PokeAPI slug, Value = en name (lowercase) as it appears in the JSONs.
// ---------------------------------------------------------------------------
const MANUAL_OVERRIDES = {
  "paralyze-heal": "parlyz heal",
  "x-attack": "x attack",
  "x-defense": "x defense",
  "x-sp-atk": "x sp. atk",
  "x-sp-def": "x sp. def",
  "x-speed": "x speed",
  "x-accuracy": "x accuracy",
  "poke-ball": "poké ball",
  "great-ball": "great ball",
  "ultra-ball": "ultra ball",
  "master-ball": "master ball",
  // Add more overrides here as needed after reviewing items-unmatched.json
};

// Excluded pockets
const EXCLUDED_POCKETS = new Set(["key", "mail"]);

// Excluded slugs — bogus or duplicate PokeAPI entries
const EXCLUDED_SLUGS = new Set(["lapoke-ball"]);

// ---------------------------------------------------------------------------
// 3. Helpers
// ---------------------------------------------------------------------------

/** Normalize an English item name to a PokeAPI-style slug */
function toSlug(en) {
  return en
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .replace(/[^a-z0-9]+/g, "-") // non-alphanum → hyphen
    .replace(/^-|-$/g, ""); // trim leading/trailing hyphens
}

/** Collapse a slug/name to only alphanumeric chars (no hyphens/spaces) */
function toCollapsed(s) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

/** Fetch JSON with basic retry */
async function fetchJson(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      return await res.json();
    } catch (err) {
      if (i === retries - 1) throw err;
      console.warn(`  Retry ${i + 1} for ${url}`);
      await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
    }
  }
}

/** Fetch all pages of a paginated PokeAPI list */
async function fetchAllPages(url) {
  const results = [];
  let next = url;
  while (next) {
    const data = await fetchJson(next);
    results.push(...data.results);
    next = data.next;
  }
  return results;
}

// ---------------------------------------------------------------------------
// 4. Build local lookup maps
// ---------------------------------------------------------------------------

/** slug → version  (first occurrence wins, Gen 1–6 only)
 *  Also registers collapsed forms (no hyphens/spaces) as secondary keys. */
function buildLocalMap() {
  const map = new Map();
  for (const { file, version } of VERSION_FILES) {
    const filePath = path.join(jsonDir, file);
    if (!fs.existsSync(filePath)) {
      console.warn(`  ⚠ Missing ${file}, skipping`);
      continue;
    }
    const items = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    for (const item of items) {
      const slug = toSlug(item.en);
      const collapsed = toCollapsed(item.en);
      if (!map.has(slug)) {
        map.set(slug, version);
      }
      if (!map.has(collapsed)) {
        map.set(collapsed, version);
      }
    }
  }
  return map;
}

/** Build a Set of slugs that appear in Gen 7+ files but NOT in Gen 1–6 */
function buildPostGen6Set(localMap) {
  const set = new Set();
  for (const { file } of POST_GEN6_FILES) {
    const filePath = path.join(jsonDir, file);
    if (!fs.existsSync(filePath)) continue;
    const items = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    for (const item of items) {
      const slug = toSlug(item.en);
      const collapsed = toCollapsed(item.en);
      if (!localMap.has(slug) && !localMap.has(collapsed)) {
        set.add(slug);
        set.add(collapsed);
      }
    }
  }
  return set;
}

// ---------------------------------------------------------------------------
// 5. Main
// ---------------------------------------------------------------------------
async function main() {
  console.log("Building local item map from Itemlists/json/ ...");
  const localMap = buildLocalMap();
  console.log(`  ${localMap.size} unique items from local lists`);

  const postGen6Slugs = buildPostGen6Set(localMap);
  console.log(`  ${postGen6Slugs.size} additional slugs in Gen 7+ lists\n`);

  // --- Fetch pockets ---
  console.log("Fetching item pockets from PokeAPI ...");
  const pockets = await fetchAllPages(
    "https://pokeapi.co/api/v2/item-pocket/?limit=100",
  );
  const includedPockets = pockets.filter((p) => !EXCLUDED_POCKETS.has(p.name));
  console.log(
    `  Pockets: ${pockets.map((p) => p.name).join(", ")}` +
      `\n  Using: ${includedPockets.map((p) => p.name).join(", ")}\n`,
  );

  // --- Fetch categories per pocket ---
  const categoryUrls = [];
  for (const pocket of includedPockets) {
    const pocketData = await fetchJson(pocket.url);
    for (const cat of pocketData.categories) {
      categoryUrls.push(cat.url);
    }
  }
  console.log(`  ${categoryUrls.length} categories to fetch\n`);

  // --- Collect item slugs from categories ---
  const itemSlugs = new Set();
  for (const url of categoryUrls) {
    const catData = await fetchJson(url);
    for (const item of catData.items) {
      itemSlugs.add(item.name);
    }
  }
  console.log(`  ${itemSlugs.size} unique items from PokeAPI\n`);

  // --- Match against local map & fetch proper names from API ---
  const VERSION_ORDER = VERSION_FILES.map((v) => v.version);
  const results = [];
  const postGen6Items = [];
  const trulyUnmatched = [];
  const fuzzyMatched = []; // items that needed collapsed matching
  let i = 0;

  for (const slug of itemSlugs) {
    i++;
    if (EXCLUDED_SLUGS.has(slug)) continue;
    if (i % 100 === 0) console.log(`  Processing ${i}/${itemSlugs.size} ...`);

    // Determine version via local map — check both slug and collapsed,
    // pick the earliest version to handle naming inconsistencies across gens
    const overrideEn = MANUAL_OVERRIDES[slug];
    const lookupSlug = overrideEn ? toSlug(overrideEn) : slug;
    const collapsed = toCollapsed(slug);
    let version = null;
    let wasFuzzy = false;

    const slugVersion = localMap.get(lookupSlug) ?? null;
    const collapsedVersion = localMap.get(collapsed) ?? null;

    if (slugVersion && collapsedVersion) {
      // Both matched — pick the earlier one
      const slugIdx = VERSION_ORDER.indexOf(slugVersion);
      const collIdx = VERSION_ORDER.indexOf(collapsedVersion);
      if (collIdx < slugIdx) {
        version = collapsedVersion;
        wasFuzzy = true;
      } else {
        version = slugVersion;
      }
    } else if (slugVersion) {
      version = slugVersion;
    } else if (collapsedVersion) {
      version = collapsedVersion;
      wasFuzzy = true;
    }

    // Fetch the item detail from PokeAPI for properly cased names
    let enName, deName;
    try {
      const itemData = await fetchJson(
        `https://pokeapi.co/api/v2/item/${slug}/`,
      );
      enName =
        itemData.names.find((n) => n.language.name === "en")?.name ?? slug;
      deName =
        itemData.names.find((n) => n.language.name === "de")?.name ?? enName;

      // If not matched yet, try the API's official English name
      if (!version) {
        const altSlug = toSlug(enName.toLowerCase());
        const altCollapsed = toCollapsed(enName.toLowerCase());
        const altSlugV = localMap.get(altSlug) ?? null;
        const altCollV = localMap.get(altCollapsed) ?? null;

        if (altSlugV && altCollV) {
          const si = VERSION_ORDER.indexOf(altSlugV);
          const ci = VERSION_ORDER.indexOf(altCollV);
          if (ci < si) {
            version = altCollV;
            wasFuzzy = true;
          } else {
            version = altSlugV;
          }
        } else if (altSlugV) {
          version = altSlugV;
        } else if (altCollV) {
          version = altCollV;
          wasFuzzy = true;
        }
      }
    } catch {
      enName = slug;
      deName = slug;
    }

    if (version) {
      results.push({ slug, de: deName, en: enName, version });
      if (wasFuzzy) {
        fuzzyMatched.push({ slug, en: enName, de: deName, version });
      }
    } else if (
      postGen6Slugs.has(slug) ||
      postGen6Slugs.has(toCollapsed(slug)) ||
      postGen6Slugs.has(toSlug(enName.toLowerCase())) ||
      postGen6Slugs.has(toCollapsed(enName.toLowerCase()))
    ) {
      postGen6Items.push({ slug, de: deName, en: enName });
    } else {
      trulyUnmatched.push({ slug, de: deName, en: enName });
    }
  }

  // Sort by version (release order), then alphabetically by English name
  results.sort((a, b) => {
    const vA = VERSION_ORDER.indexOf(a.version);
    const vB = VERSION_ORDER.indexOf(b.version);
    if (vA !== vB) return vA - vB;
    return a.en.localeCompare(b.en);
  });

  // --- Write output ---
  const dataDir = path.join(__dirname, "..", "src", "data");
  fs.mkdirSync(dataDir, { recursive: true });

  const tsContent =
    `// Generated by scripts/generate-items.mjs\n` +
    `export const ITEMS: { slug: string; de: string; en: string; version: string }[] = ${JSON.stringify(results, null, 2)};\n`;
  fs.writeFileSync(outPath, tsContent, "utf-8");
  console.log(
    `\n✅ Wrote ${results.length} items to ${outPath} (from ${itemSlugs.size} API items)`,
  );

  if (postGen6Items.length > 0) {
    const postGen6Path = path.join(dataDir, "items-post-gen6.json");
    fs.writeFileSync(
      postGen6Path,
      JSON.stringify(postGen6Items, null, 2),
      "utf-8",
    );
    console.log(
      `  ℹ ${postGen6Items.length} items are Gen 7+ (excluded by design) → ${postGen6Path}`,
    );
  }

  if (trulyUnmatched.length > 0) {
    const unmatchedPath = path.join(dataDir, "items-unmatched.json");
    fs.writeFileSync(
      unmatchedPath,
      JSON.stringify(trulyUnmatched, null, 2),
      "utf-8",
    );
    console.log(
      `  ⚠ ${trulyUnmatched.length} items could not be matched to ANY version.` +
        `\n    Review: ${unmatchedPath}` +
        `\n    Add overrides to MANUAL_OVERRIDES in this script and re-run.`,
    );
  } else {
    console.log("🎉 All non-Gen7+ items matched to a version!");
  }

  if (fuzzyMatched.length > 0) {
    const fuzzyPath = path.join(dataDir, "items-fuzzy-matched.json");
    fs.writeFileSync(fuzzyPath, JSON.stringify(fuzzyMatched, null, 2), "utf-8");
    console.log(
      `  ℹ ${fuzzyMatched.length} items needed collapsed/fuzzy matching → ${fuzzyPath}`,
    );
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
