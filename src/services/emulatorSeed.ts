import { auth, db } from '@/src/firebaseConfig';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { ref, get, set } from 'firebase/database';
import { createInitialState } from '@/constants';

// Test user credentials
const TEST_USER_EMAIL = 'test@example.com';
const TEST_USER_PASSWORD = 'testpassword123';

// Flag to track if seeding has been attempted
let seedingAttempted = false;

/**
 * Checks if test data already exists in the emulator
 */
async function testDataExists(): Promise<boolean> {
  try {
    // Check if test user has any trackers
    const userTrackersRef = ref(db, 'userTrackers');
    const snapshot = await get(userTrackersRef);
    return snapshot.exists() && Object.keys(snapshot.val()).length > 0;
  } catch (error) {
    console.error('Error checking for test data:', error);
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
      TEST_USER_PASSWORD
    );
    console.log('Test user signed in:', userCredential.user.uid);
    return userCredential.user.uid;
  } catch (signInError: any) {
    // If sign in fails, try to create the user
    if (signInError.code === 'auth/user-not-found' || signInError.code === 'auth/invalid-credential') {
      try {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          TEST_USER_EMAIL,
          TEST_USER_PASSWORD
        );
        console.log('Test user created:', userCredential.user.uid);
        return userCredential.user.uid;
      } catch (createError) {
        console.error('Error creating test user:', createError);
        throw createError;
      }
    }
    throw signInError;
  }
}

/**
 * Creates sample tracker data for the test user
 */
async function createSampleTrackerData(userId: string): Promise<void> {
  const now = Date.now();
  const trackerId = `test-tracker-${now}`;
  
  // Create tracker metadata
  const trackerMeta = {
    id: trackerId,
    title: 'Test Tracker - Sample Run',
    playerNames: ['Spieler 1', 'Spieler 2'],
    createdAt: now,
    createdBy: userId,
    members: {
      [userId]: {
        uid: userId,
        email: TEST_USER_EMAIL,
        role: 'owner',
        addedAt: now,
      },
    },
    gameVersionId: 'gen5_sw',
  };

  // Create initial state with sample data
  const initialState = createInitialState('gen5_sw', ['Spieler 1', 'Spieler 2']);
  
  // Add some sample team members to demonstrate functionality
  initialState.team = [
    {
      id: 1,
      route: 'Route 1',
      members: [
        { name: 'Pikachu', nickname: 'Sparky' },
        { name: 'Evoli', nickname: 'Flausch' },
      ],
    },
    {
      id: 2,
      route: 'Route 2',
      members: [
        { name: 'Glumanda', nickname: 'Flame' },
        { name: 'Schiggy', nickname: 'Splash' },
      ],
    },
  ];

  // Add some sample box members
  initialState.box = [
    {
      id: 3,
      route: 'Route 3',
      members: [
        { name: 'Bisasam', nickname: 'Grün' },
        { name: 'Taubsi', nickname: 'Wings' },
      ],
    },
  ];

  // Add a sample graveyard entry
  initialState.graveyard = [
    {
      id: 4,
      route: 'Arena 1',
      members: [
        { name: 'Rattfratz', nickname: 'Speed' },
        { name: 'Tauboga', nickname: 'Flyer' },
      ],
    },
  ];

  // Update some stats to show progress
  initialState.stats.deaths = [1, 1];
  initialState.stats.sumDeaths = [1, 1];
  initialState.levelCaps[0].done = true; // Mark first level cap as done

  // Write data to database
  const updates: Record<string, any> = {
    [`trackers/${trackerId}/meta`]: trackerMeta,
    [`trackers/${trackerId}/state`]: initialState,
    [`userTrackers/${userId}/${trackerId}`]: true,
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

  await set(ref(db), updates);
  console.log('Sample tracker data created successfully');
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
      console.log('Test data already exists, skipping seeding');
      return;
    }

    console.log('Starting emulator data seeding...');

    // Create test user
    const userId = await createTestUser();

    // Create sample tracker data
    await createSampleTrackerData(userId);

    console.log('Emulator seeding completed successfully');
  } catch (error) {
    console.error('Error seeding emulator data:', error);
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
