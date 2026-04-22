/**
 * generate-items.mjs
 *
 * Fetches every item from PokeAPI (excluding "key" and "mail" pockets),
 * matches them against the local Itemlists/json/ files to determine the
 * earliest game version each item appeared in and its German name,
 * then writes a single merged JSON to src/data/items.json.
 *
 * Usage:  node scripts/generate-items.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const jsonDir = path.join(__dirname, "..", "Itemlists", "json");
const outPath = path.join(__dirname, "..", "src", "data", "items.json");

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
// 2. Manual slug overrides for known mismatches between PokeAPI slugs and
//    the English names in the Itemlists.
//    Key = PokeAPI slug, Value = en name (lowercase) as it appears in the JSONs.
// ---------------------------------------------------------------------------
const SLUG_TO_EN_OVERRIDE = {
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
  // Add more overrides here as needed after reviewing unmatched.json
};

// Excluded pockets
const EXCLUDED_POCKETS = new Set(["key", "mail"]);

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
// 4. Build local lookup map  slug → { de, en, version }
// ---------------------------------------------------------------------------
function buildLocalMap() {
  // Maps slug → { de, en, version }   (first occurrence wins)
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
      if (!map.has(slug)) {
        map.set(slug, { de: item.de, en: item.en, version });
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
      if (!localMap.has(slug)) {
        set.add(slug);
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
      itemSlugs.add(item.name); // slug
    }
  }
  console.log(`  ${itemSlugs.size} unique items from PokeAPI\n`);

  // --- Match & fetch missing German names ---
  const results = [];
  const unmatched = [];
  let i = 0;

  for (const slug of itemSlugs) {
    i++;
    if (i % 100 === 0) console.log(`  Processing ${i}/${itemSlugs.size} ...`);

    // Check override first
    const overrideEn = SLUG_TO_EN_OVERRIDE[slug];
    const lookupSlug = overrideEn ? toSlug(overrideEn) : slug;
    const local = localMap.get(lookupSlug);

    if (local) {
      results.push({ de: local.de, en: local.en, version: local.version });
    } else {
      // Fetch from API for German name fallback
      try {
        const itemData = await fetchJson(
          `https://pokeapi.co/api/v2/item/${slug}/`,
        );
        const deName =
          itemData.names
            .find((n) => n.language.name === "de")
            ?.name?.toLowerCase() ?? slug;
        const enName =
          itemData.names
            .find((n) => n.language.name === "en")
            ?.name?.toLowerCase() ?? slug;

        // Try matching the official English name as slug too
        const altSlug = toSlug(enName);
        const altLocal = localMap.get(altSlug);

        if (altLocal) {
          results.push({
            de: altLocal.de,
            en: altLocal.en,
            version: altLocal.version,
          });
        } else {
          // No local version info — mark as unmatched
          results.push({ de: deName, en: enName, version: "unknown" });
          unmatched.push({ slug, en: enName, de: deName });
        }
      } catch {
        results.push({ de: slug, en: slug, version: "unknown" });
        unmatched.push({ slug, en: slug, de: slug });
      }
    }
  }

  // Remove items that couldn't be matched (i.e. not in any Gen 1–6 list)
  const filtered = results.filter((r) => r.version !== "unknown");

  // Sort alphabetically by English name
  filtered.sort((a, b) => a.en.localeCompare(b.en));

  // --- Write output ---
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(filtered, null, 2), "utf-8");
  console.log(
    `\n✅ Wrote ${filtered.length} items to ${outPath} (filtered from ${results.length} API items)`,
  );

  if (unmatched.length > 0) {
    // Separate post-Gen6 items from truly unmatched ones
    const postGen6Items = [];
    const trulyUnmatched = [];

    for (const item of unmatched) {
      if (postGen6Slugs.has(item.slug) || postGen6Slugs.has(toSlug(item.en))) {
        postGen6Items.push(item);
      } else {
        trulyUnmatched.push(item);
      }
    }

    const dataDir = path.join(__dirname, "..", "src", "data");

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
          `\n    Add overrides to SLUG_TO_EN_OVERRIDE in this script and re-run.`,
      );
    } else {
      console.log("🎉 All non-Gen7+ items matched to a version!");
    }
  } else {
    console.log("🎉 All items matched to a version!");
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
