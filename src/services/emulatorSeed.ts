/**
 * Emulator Seeding Service
 *
 * Seeds the Firebase emulator with test data for local development.
 * Creates a test user and sample trackers with team, box, and graveyard data.
 */

import { auth, db } from "@/src/firebaseConfig";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { get, ref, update } from "firebase/database";
import { createInitialState } from "@/src/services/init.ts";
import { FossilEntry, StoneEntry } from "@/types";

// Test user credentials for emulator mode
const TEST_USER_EMAIL = "test@example.com";
const TEST_USER_PASSWORD = "testpassword123";

const normalizeEmail = (email: string): string => email.trim().toLowerCase();
const encodeEmailKey = (normalizedEmail: string): string =>
  normalizedEmail.replace(/[.#$/\[\]]/g, "_");

// Flag to track if seeding has been attempted (prevents duplicate seeding during hot reloads)
let seedingAttempted = false;

/**
 * Checks if test data already exists in the emulator
 */
async function testDataExists(): Promise<boolean> {
  try {
    // Check if test user has any trackers
    const userTrackersRef = ref(db, "userTrackers");
    const snapshot = await get(userTrackersRef);
    return snapshot.exists() && Object.keys(snapshot.val()).length > 0;
  } catch (error) {
    console.error("Error checking for test data:", error);
    return false;
  }
}

/**
 * Creates or signs in the test user
 */
async function createTestUser(): Promise<string> {
  try {
    // Try to sign in first (user might already exist from previous run)
    const userCredential = await signInWithEmailAndPassword(
      auth,
      TEST_USER_EMAIL,
      TEST_USER_PASSWORD,
    );
    console.log("Test user signed in:", userCredential.user.uid);
    return userCredential.user.uid;
  } catch (signInError: any) {
    // If sign in fails, try to create the user
    if (
      signInError.code === "auth/user-not-found" ||
      signInError.code === "auth/invalid-credential"
    ) {
      try {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          TEST_USER_EMAIL,
          TEST_USER_PASSWORD,
        );
        console.log("Test user created:", userCredential.user.uid);
        return userCredential.user.uid;
      } catch (createError) {
        console.error("Error creating test user:", createError);
        throw createError;
      }
    }
    throw signInError;
  }
}

/**
 * Creates a single tracker with sample data
 */
async function createTracker(
  userId: string,
  config: {
    title: string;
    gameVersionId: string;
    playerNames: string[];
    teamPokemon: Array<{
      id: number;
      route: string;
      members: Array<{ name: string; nickname: string }>;
    }>;
    boxPokemon: Array<{
      id: number;
      route: string;
      members: Array<{ name: string; nickname: string }>;
    }>;
    graveyardPokemon: Array<{
      id: number;
      route: string;
      members: Array<{ name: string; nickname: string }>;
      isLost?: boolean;
    }>;
    checkedLevelCaps: number[];
    checkedRivalCaps: number[];
    rivalCensorEnabled?: boolean;
    revealedRivalCaps?: number[];
    stoneEntries?: StoneEntry[][];
    fossilEntries?: FossilEntry[][];
    createdAt?: number;
    runs?: number;
    best?: number;
    deaths?: number[];
    sumDeaths?: number[];
    legendaryEncounters?: number;
  },
): Promise<Record<string, any>> {
  const now = config.createdAt ?? Date.now();
  const trackerId = `test-tracker-${config.gameVersionId}-${now}`;

  // Create tracker metadata
  const trackerMeta = {
    id: trackerId,
    title: config.title,
    playerNames: config.playerNames,
    createdAt: now,
    createdBy: userId,
    members: {
      [userId]: {
        uid: userId,
        email: TEST_USER_EMAIL,
        role: "owner",
        addedAt: now,
      },
    },
    gameVersionId: config.gameVersionId,
  };

  // Create initial state with sample data
  const initialState = createInitialState(
    config.gameVersionId,
    config.playerNames,
  );

  // Add sample data
  initialState.team = config.teamPokemon;
  initialState.box = config.boxPokemon;
  initialState.graveyard = config.graveyardPokemon;

  // Add fossil data if provided
  if (config.fossilEntries) {
    initialState.fossils = config.fossilEntries;
  }

  if (config.stoneEntries) {
    initialState.stones = config.stoneEntries;
  }

  const deadCount = config.graveyardPokemon.filter((p) => !p.isLost).length;
  const deathsPerPlayer = config.playerNames.map((_, i) => {
    let count = Math.floor(deadCount / config.playerNames.length);
    if (i < deadCount % config.playerNames.length) count++;
    return count;
  });
  initialState.stats.deaths = config.deaths ?? deathsPerPlayer;
  initialState.stats.sumDeaths = config.sumDeaths ?? [
    ...(config.deaths ?? deathsPerPlayer),
  ];

  if (config.runs !== undefined) {
    initialState.stats.runs = config.runs;
  }
  if (config.best !== undefined) {
    initialState.stats.best = config.best;
  }
  if (config.legendaryEncounters !== undefined) {
    initialState.stats.legendaryEncounters = config.legendaryEncounters;
  }

  config.checkedLevelCaps.forEach((index) => {
    if (initialState.levelCaps[index]) {
      initialState.levelCaps[index].done = true;
    }
  });

  // Return updates object for this tracker
  return {
    [`trackers/${trackerId}/meta`]: trackerMeta,
    [`trackers/${trackerId}/state`]: initialState,
    [`userTrackers/${userId}/${trackerId}`]: true,
  };
}

async function createSampleTrackerData(userId: string): Promise<void> {
  const now = Date.now();

  const gen5Updates = await createTracker(userId, {
    title: "Pokémon Black Soullink",
    gameVersionId: "gen5_bw",
    createdAt: new Date("2026-09-18").getTime(),
    playerNames: ["Player 1", "Player 2"],
    teamPokemon: [
      {
        id: 1,
        route: "Route 1",
        members: [
          { name: "Oshawott", nickname: "Otterpop" },
          { name: "Tepig", nickname: "Sizzle" },
        ],
      },
      {
        id: 2,
        route: "Route 2",
        members: [
          { name: "Patrat", nickname: "Scout" },
          { name: "Lillipup", nickname: "Buddy" },
        ],
      },
      {
        id: 3,
        route: "Route 3",
        members: [
          { name: "Blitzle", nickname: "Sparky" },
          { name: "Purrloin", nickname: "Whiskers" },
        ],
      },
    ],
    boxPokemon: [
      {
        id: 4,
        route: "Dreamyard",
        members: [
          { name: "Munna", nickname: "Dreamy" },
          { name: "Pidove", nickname: "Coo" },
        ],
      },
      {
        id: 5,
        route: "Pinwheel Forest",
        members: [
          { name: "Sewaddle", nickname: "Leafy" },
          { name: "Venipede", nickname: "Stinger" },
        ],
      },
      {
        id: 6,
        route: "Old Amber/Skull Fossil",
        members: [
          { name: "Aerodactyl", nickname: "Amber" },
          { name: "Cranidos", nickname: "Rocky" },
        ],
      },
    ],
    graveyardPokemon: [
      {
        id: 7,
        route: "Wellspring Cave",
        members: [
          { name: "Roggenrola", nickname: "Pebble" },
          { name: "Woobat", nickname: "Sonar" },
        ],
      },
      {
        id: 8,
        route: "Cold Storage",
        members: [
          { name: "Vanillite", nickname: "Frosty" },
          { name: "Timburr", nickname: "Lumber" },
        ],
      },
    ],
    runs: 17,
    best: 7,
    deaths: [21, 16],
    sumDeaths: [4, 5],
    legendaryEncounters: 45,
    checkedLevelCaps: [0, 1, 2, 3, 4],
    checkedRivalCaps: [0, 1, 2, 3, 4, 5, 6],
    revealedRivalCaps: [0, 1, 2, 3, 4, 5, 6],
    fossilEntries: [
      [
        {
          fossilId: "cover-fossil",
          location: "Nacrene City",
          inBag: false,
          revived: false,
        },
        { fossilId: "helix-fossil", location: "", inBag: true, revived: false },
        {
          fossilId: "old-amber",
          location: "",
          inBag: true,
          revived: true,
          pokemonName: "Aerodactyl",
        },
      ],
      [
        { fossilId: "plume-fossil", location: "", inBag: true, revived: false },
        {
          fossilId: "dome-fossil",
          location: "Nacrene City",
          inBag: false,
          revived: false,
        },
        {
          fossilId: "skull-fossil",
          location: "",
          inBag: true,
          revived: true,
          pokemonName: "Cranidos",
        },
      ],
    ],
    stoneEntries: [
      [
        {
          stoneId: "fire-stone",
          location: "Nimbasa City",
          inBag: true,
          used: false,
        },
        {
          stoneId: "water-stone",
          location: "Driftveil City",
          inBag: true,
          used: true,
        },
        {
          stoneId: "dusk-stone",
          location: "Mistralton City",
          inBag: false,
          used: false,
        },
      ],
      [
        {
          stoneId: "leaf-stone",
          location: "Castelia City",
          inBag: true,
          used: false,
        },
        {
          stoneId: "thunder-stone",
          location: "Driftveil City",
          inBag: true,
          used: true,
        },
        {
          stoneId: "sun-stone",
          location: "Nacrene City",
          inBag: false,
          used: false,
        },
        {
          stoneId: "moon-stone",
          location: "Icirrus City",
          inBag: true,
          used: false,
        },
      ],
    ],
  });

  const gen1Updates = await createTracker(userId, {
    title: "Pokémon Blue Soullink",
    gameVersionId: "gen1_rb",
    createdAt: new Date("2026-02-27").getTime(),
    playerNames: ["Player 1", "Player 2"],
    teamPokemon: [
      {
        id: 1,
        route: "Route 1",
        members: [
          { name: "Pidgey", nickname: "Gust" },
          { name: "Rattata", nickname: "Ratty" },
        ],
      },
      {
        id: 2,
        route: "Route 2",
        members: [
          { name: "Caterpie", nickname: "Crawler" },
          { name: "Weedle", nickname: "Stinger" },
        ],
      },
      {
        id: 3,
        route: "Viridian Forest",
        members: [
          { name: "Pikachu", nickname: "Sparky" },
          { name: "Sandshrew", nickname: "Sandy" },
        ],
      },
    ],
    boxPokemon: [
      {
        id: 4,
        route: "Route 3",
        members: [
          { name: "Butterfree", nickname: "Flutter" },
          { name: "Kakuna", nickname: "Cocoon" },
        ],
      },
      {
        id: 5,
        route: "Route 4",
        members: [
          { name: "Magikarp", nickname: "Splashy" },
          { name: "Zubat", nickname: "Fang" },
        ],
      },
    ],
    graveyardPokemon: [
      {
        id: 6,
        route: "Mt. Moon",
        members: [
          { name: "Geodude", nickname: "Boulder" },
          { name: "Clefairy", nickname: "Moony" },
        ],
      },
      {
        id: 7,
        route: "Rock Tunnel",
        members: [
          { name: "Machop", nickname: "Flex" },
          { name: "Onix", nickname: "Slither" },
        ],
      },
      {
        id: 8,
        route: "Pokémon Tower",
        members: [
          { name: "Gastly", nickname: "" },
          { name: "Cubone", nickname: "" },
        ],
        isLost: true,
      },
    ],
    runs: 42,
    deaths: [1, 1],
    sumDeaths: [55, 62],
    legendaryEncounters: 132,
    checkedLevelCaps: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    checkedRivalCaps: [0, 1, 2, 3, 4, 5],
    rivalCensorEnabled: false,
    fossilEntries: [
      [
        { fossilId: "old-amber", location: "", inBag: true, revived: false },
        { fossilId: "helix-fossil", location: "", inBag: true, revived: false },
      ],
      [
        { fossilId: "dome-fossil", location: "", inBag: true, revived: false },
        {
          fossilId: "old-amber",
          location: "Pewter City",
          inBag: false,
          revived: false,
        },
      ],
    ],
    stoneEntries: [
      [
        {
          stoneId: "fire-stone",
          location: "Celadon City",
          inBag: true,
          used: true,
        },
        {
          stoneId: "water-stone",
          location: "Celadon City",
          inBag: true,
          used: false,
        },
        {
          stoneId: "thunder-stone",
          location: "Celadon City",
          inBag: true,
          used: true,
        },
        {
          stoneId: "moon-stone",
          location: "Pewter City",
          inBag: true,
          used: false,
        },
      ],
      [
        {
          stoneId: "leaf-stone",
          location: "Celadon City",
          inBag: true,
          used: true,
        },
        {
          stoneId: "fire-stone",
          location: "Cinnabar Island",
          inBag: true,
          used: false,
        },
      ],
    ],
  });

  const gen4Updates = await createTracker(userId, {
    title: "Pokémon Platinum Soullink",
    gameVersionId: "gen4_pt",
    createdAt: new Date("2026-09-13").getTime(),
    playerNames: ["Player 1", "Player 2"],
    teamPokemon: [
      {
        id: 1,
        route: "Route 201",
        members: [
          { name: "Turtwig", nickname: "Leafy" },
          { name: "Chimchar", nickname: "Blaze" },
        ],
      },
      {
        id: 2,
        route: "Route 202",
        members: [
          { name: "Starly", nickname: "Swoosh" },
          { name: "Bidoof", nickname: "Chompy" },
        ],
      },
      {
        id: 3,
        route: "Route 204",
        members: [
          { name: "Shinx", nickname: "Sparky" },
          { name: "Budew", nickname: "Rosie" },
        ],
      },
    ],
    boxPokemon: [
      {
        id: 4,
        route: "Valley Windworks",
        members: [
          { name: "Pachirisu", nickname: "Zippy" },
          { name: "Drifloon", nickname: "Balloon" },
        ],
      },
      {
        id: 5,
        route: "Route 205",
        members: [
          { name: "Bronzor", nickname: "Mirror" },
          { name: "Ponyta", nickname: "Ember" },
        ],
      },
    ],
    graveyardPokemon: [
      {
        id: 6,
        route: "Ravaged Path",
        members: [
          { name: "Kricketot", nickname: "Cricket" },
          { name: "Buneary", nickname: "Hoppy" },
        ],
      },
      {
        id: 7,
        route: "Eterna Forest",
        members: [
          { name: "Burmy", nickname: "Cloak" },
          { name: "Cherubi", nickname: "Cherry" },
        ],
      },
      {
        id: 8,
        route: "Lost Tower",
        members: [
          { name: "Chingling", nickname: "" },
          { name: "Stunky", nickname: "" },
        ],
        isLost: true,
      },
    ],
    runs: 27,
    deaths: [0, 2],
    sumDeaths: [13, 27],
    legendaryEncounters: 95,
    checkedLevelCaps: [0, 1, 2, 3, 4, 5, 6, 7],
    checkedRivalCaps: [0, 1, 2, 3, 4],
    rivalCensorEnabled: false,
    fossilEntries: [
      [
        { fossilId: "skull-fossil", location: "", inBag: true, revived: false },
        { fossilId: "old-amber", location: "", inBag: true, revived: false },
        {
          fossilId: "helix-fossil",
          location: "Oreburgh City",
          inBag: false,
          revived: false,
        },
      ],
      [
        { fossilId: "armor-fossil", location: "", inBag: true, revived: false },
        { fossilId: "dome-fossil", location: "", inBag: true, revived: false },
      ],
    ],
    stoneEntries: [
      [
        {
          stoneId: "fire-stone",
          location: "Veilstone City",
          inBag: true,
          used: false,
        },
        {
          stoneId: "dawn-stone",
          location: "Hearthome City",
          inBag: true,
          used: true,
        },
        {
          stoneId: "shiny-stone",
          location: "Canalave City",
          inBag: false,
          used: false,
        },
        {
          stoneId: "water-stone",
          location: "Solaceon Town",
          inBag: true,
          used: false,
        },
        {
          stoneId: "dusk-stone",
          location: "Eterna City",
          inBag: true,
          used: false,
        },
      ],
      [
        {
          stoneId: "leaf-stone",
          location: "Floaroma Town",
          inBag: true,
          used: false,
        },
        {
          stoneId: "thunder-stone",
          location: "Sunyshore City",
          inBag: true,
          used: true,
        },
        {
          stoneId: "sun-stone",
          location: "Pastoria City",
          inBag: false,
          used: false,
        },
      ],
    ],
  });

  const gen6Updates = await createTracker(userId, {
    title: "Pokémon Alpha Sapphire Soullink",
    gameVersionId: "gen6_oras",
    createdAt: new Date("2025-11-21").getTime(),
    playerNames: ["Player 1", "Player 2"],
    teamPokemon: [
      {
        id: 1,
        route: "Route 101",
        members: [
          { name: "Treecko", nickname: "Gecko" },
          { name: "Torchic", nickname: "Chicky" },
        ],
      },
      {
        id: 2,
        route: "Route 102",
        members: [
          { name: "Zigzagoon", nickname: "Ziggy" },
          { name: "Lotad", nickname: "Lilypad" },
        ],
      },
      {
        id: 3,
        route: "Route 104",
        members: [
          { name: "Taillow", nickname: "Swift" },
          { name: "Wingull", nickname: "Gully" },
        ],
      },
    ],
    boxPokemon: [
      {
        id: 4,
        route: "Petalburg Woods",
        members: [
          { name: "Wurmple", nickname: "Squirmy" },
          { name: "Seedot", nickname: "Acorn" },
        ],
      },
      {
        id: 5,
        route: "Route 116",
        members: [
          { name: "Nosepass", nickname: "Compass" },
          { name: "Whismur", nickname: "Whisper" },
        ],
      },
      {
        id: 6,
        route: "Root Fossil/Claw Fossil",
        members: [
          { name: "Lileep", nickname: "Rooty" },
          { name: "Anorith", nickname: "Claws" },
        ],
      },
    ],
    graveyardPokemon: [
      {
        id: 7,
        route: "Granite Cave",
        members: [
          { name: "Makuhita", nickname: "Sumo" },
          { name: "Aron", nickname: "Ironclad" },
        ],
      },
      {
        id: 8,
        route: "Route 110",
        members: [
          { name: "Electrike", nickname: "Volt" },
          { name: "Gulpin", nickname: "Blob" },
        ],
      },
    ],
    runs: 4,
    best: 5,
    deaths: [1, 1],
    sumDeaths: [7, 10],
    legendaryEncounters: 9,
    checkedLevelCaps: [0, 1, 2],
    checkedRivalCaps: [0, 1],
    revealedRivalCaps: [0, 1],
    fossilEntries: [
      [
        {
          fossilId: "jaw-fossil",
          location: "Rustboro City",
          inBag: false,
          revived: false,
        },
        {
          fossilId: "root-fossil",
          location: "",
          inBag: true,
          revived: true,
          pokemonName: "Lileep",
        },
      ],
      [
        {
          fossilId: "sail-fossil",
          location: "Rustboro City",
          inBag: false,
          revived: false,
        },
        {
          fossilId: "claw-fossil",
          location: "",
          inBag: true,
          revived: true,
          pokemonName: "Anorith",
        },
        {
          fossilId: "cover-fossil",
          location: "Mauville City",
          inBag: false,
          revived: false,
        },
      ],
    ],
    stoneEntries: [
      [
        {
          stoneId: "fire-stone",
          location: "Lavaridge Town",
          inBag: true,
          used: false,
        },
        {
          stoneId: "water-stone",
          location: "Slateport City",
          inBag: true,
          used: true,
        },
        {
          stoneId: "sun-stone",
          location: "Mossdeep City",
          inBag: false,
          used: false,
        },
        {
          stoneId: "item:sceptilite",
          location: "Fortree City",
          inBag: true,
          used: false,
        },
      ],
      [
        {
          stoneId: "leaf-stone",
          location: "Fortree City",
          inBag: true,
          used: false,
        },
        {
          stoneId: "thunder-stone",
          location: "Mauville City",
          inBag: true,
          used: false,
        },
        {
          stoneId: "moon-stone",
          location: "Fallarbor Town",
          inBag: true,
          used: true,
        },
        {
          stoneId: "item:blazikenite",
          location: "Fallarbor Town",
          inBag: true,
          used: false,
        },
        {
          stoneId: "item:altarianite",
          location: "Lilycove City",
          inBag: false,
          used: false,
        },
      ],
    ],
  });

  const allUpdates: Record<string, any> = {
    ...gen5Updates,
    ...gen1Updates,
    ...gen4Updates,
    ...gen6Updates,
    [`users/${userId}`]: {
      uid: userId,
      createdAt: now,
      lastLoginAt: now,
    },
    [`userEmails/${encodeEmailKey(normalizeEmail(TEST_USER_EMAIL))}`]: {
      uid: userId,
      updatedAt: now,
    },
  };

  await update(ref(db), allUpdates);
  console.log(
    "Sample tracker data created successfully (Gen 1, Gen 4, Gen 5, and Gen 6 trackers)",
  );
}

/**
 * Seeds the emulator with test data
 * This function is idempotent and safe to call multiple times
 */
export async function seedEmulatorData(): Promise<void> {
  // Prevent multiple seeding attempts during hot reloads
  if (seedingAttempted) {
    return;
  }

  seedingAttempted = true;

  try {
    // Check if test data already exists
    const dataExists = await testDataExists();
    if (dataExists) {
      console.log("Test data already exists, skipping seeding");
      return;
    }

    console.log("Starting emulator data seeding...");

    // Create test user
    const userId = await createTestUser();

    // Create sample tracker data
    await createSampleTrackerData(userId);

    console.log("Emulator seeding completed successfully");
  } catch (error) {
    console.error("Error seeding emulator data:", error);
    // Reset flag on error so it can be retried
    seedingAttempted = false;
  }
}
