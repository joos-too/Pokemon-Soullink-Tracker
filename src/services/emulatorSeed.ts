/**
 * Emulator Seeding Service
 *
 * This module provides functionality to automatically seed the Firebase emulator
 * with test data when running in development mode. This allows developers to
 * quickly start development and testing without manually creating users and trackers.
 *
 * Features:
 * - Creates a test user with predefined credentials
 * - Seeds a sample tracker with team, box, and graveyard data
 * - Prevents duplicate seeding on hot reloads
 * - Checks for existing data before seeding
 */

import { auth, db } from "@/src/firebaseConfig";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { get, ref, update } from "firebase/database";
import { createInitialState } from "@/constants";

// Test user credentials for emulator mode
const TEST_USER_EMAIL = "test@example.com";
const TEST_USER_PASSWORD = "testpassword123";

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
    }>;
    checkedLevelCaps: number[]; // Array of level cap indices to mark as done
  },
): Promise<Record<string, any>> {
  const now = Date.now();
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

  // Update stats to show progress
  const deathCount = config.graveyardPokemon.length;
  initialState.stats.deaths = config.playerNames.map(() => deathCount);
  initialState.stats.sumDeaths = config.playerNames.map(() => deathCount);

  // Mark specified level caps as done
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

/**
 * Creates sample tracker data for the test user
 */
async function createSampleTrackerData(userId: string): Promise<void> {
  const now = Date.now();

  // Create Gen 5 tracker
  const gen5Updates = await createTracker(userId, {
    title: "Test Tracker - Gen 5 Sample",
    gameVersionId: "gen5_sw",
    playerNames: ["Spieler 1", "Spieler 2"],
    teamPokemon: [
      {
        id: 1,
        route: "Route 1",
        members: [
          { name: "Pikachu", nickname: "Sparky" },
          { name: "Evoli", nickname: "Flausch" },
        ],
      },
      {
        id: 2,
        route: "Route 2",
        members: [
          { name: "Glumanda", nickname: "Flame" },
          { name: "Schiggy", nickname: "Splash" },
        ],
      },
    ],
    boxPokemon: [
      {
        id: 3,
        route: "Route 3",
        members: [
          { name: "Bisasam", nickname: "Grün" },
          { name: "Taubsi", nickname: "Wings" },
        ],
      },
    ],
    graveyardPokemon: [
      {
        id: 4,
        route: "Arena 1",
        members: [
          { name: "Rattfratz", nickname: "Speed" },
          { name: "Tauboga", nickname: "Flyer" },
        ],
      },
    ],
    checkedLevelCaps: [0], // Mark first level cap as done
  });

  // Create Gen 1 Red/Blue tracker
  const gen1Updates = await createTracker(userId, {
    title: "Test Tracker - Gen 1 Rot/Blau",
    gameVersionId: "gen1_rb",
    playerNames: ["Ash", "Gary"],
    teamPokemon: [
      {
        id: 1,
        route: "Route 1",
        members: [
          { name: "Taubsi", nickname: "Pidgy" },
          { name: "Rattfratz", nickname: "Ratty" },
        ],
      },
      {
        id: 2,
        route: "Route 2",
        members: [
          { name: "Raupy", nickname: "Wurm" },
          { name: "Hornliu", nickname: "Stinger" },
        ],
      },
      {
        id: 3,
        route: "Vertania-Wald",
        members: [
          { name: "Pikachu", nickname: "Blitz" },
          { name: "Sandan", nickname: "Sandy" },
        ],
      },
    ],
    boxPokemon: [
      {
        id: 4,
        route: "Route 3",
        members: [
          { name: "Smettbo", nickname: "Butterfly" },
          { name: "Kokuna", nickname: "Kokon" },
        ],
      },
    ],
    graveyardPokemon: [
      {
        id: 5,
        route: "Marmoria City",
        members: [
          { name: "Tauboga", nickname: "Wings" },
          { name: "Rattikarl", nickname: "Speedy" },
        ],
      },
    ],
    checkedLevelCaps: [0, 1, 2], // Mark first three level caps as done
  });

  // Combine all updates
  const allUpdates: Record<string, any> = {
    ...gen5Updates,
    ...gen1Updates,
    [`users/${userId}`]: {
      uid: userId,
      email: TEST_USER_EMAIL,
      emailLowerCase: TEST_USER_EMAIL.toLowerCase(),
      createdAt: now,
      lastLoginAt: now,
    },
    [`userEmails/test_example_com`]: {
      uid: userId,
      email: TEST_USER_EMAIL,
      emailLowerCase: TEST_USER_EMAIL.toLowerCase(),
      updatedAt: now,
    },
  };

  await update(ref(db), allUpdates);
  console.log(
    "Sample tracker data created successfully (Gen 5 and Gen 1 trackers)",
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

/**
 * Resets the seeding flag for testing purposes
 */
export function resetSeedingFlag(): void {
  seedingAttempted = false;
}
