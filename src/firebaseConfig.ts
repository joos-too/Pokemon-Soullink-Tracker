// Import the functions you need from the SDKs you need
import {initializeApp, type FirebaseOptions} from "firebase/app";
import {getDatabase, connectDatabaseEmulator} from "firebase/database";
import {getAuth, connectAuthEmulator} from "firebase/auth";

// Read Firebase config from Vite env
const apiKey = import.meta.env.VITE_FIREBASE_API_KEY as string | undefined;
const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined;
const databaseURL = import.meta.env.VITE_FIREBASE_DATABASE_URL as string | undefined;
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined;
const storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined;
const messagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined;
const appId = import.meta.env.VITE_FIREBASE_APP_ID as string | undefined;

// Emulator env toggles (optional). Vite injects import.meta.env.MODE and DEV.
const USE_EMULATORS = (import.meta.env.VITE_USE_FIREBASE_EMULATOR as string | undefined)?.toLowerCase() === 'true' || import.meta.env.DEV;
const EMULATOR_HOST = import.meta.env.VITE_FIREBASE_EMULATOR_HOST as string | undefined;
const AUTH_EMULATOR_PORT = Number(import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_PORT ?? 9099);
const DB_EMULATOR_PORT = Number(import.meta.env.VITE_FIREBASE_DB_EMULATOR_PORT ?? 9000);

// Validate required env vars for production only
if (!USE_EMULATORS && (!apiKey || !authDomain || !databaseURL || !projectId || !storageBucket || !messagingSenderId || !appId)) {
    throw new Error(
        "Missing one or more required Firebase env vars for production. Please set VITE_FIREBASE_* in your .env file as described in README.md."
    );
}

// Firebase configuration
// In emulator mode, Firebase Web SDK still requires a valid-looking config object.
const firebaseConfig: FirebaseOptions = USE_EMULATORS ? {
    apiKey: apiKey || "not-an-api-key",
    authDomain: EMULATOR_HOST,
    databaseURL: `http://${EMULATOR_HOST}:${DB_EMULATOR_PORT}/?ns=${projectId}`,
    projectId: projectId,
    storageBucket: storageBucket || "demo.app",
    messagingSenderId: messagingSenderId || "0",
    appId: appId || "demo:app",
} : {
    apiKey: apiKey!,
    authDomain: authDomain!,
    databaseURL: databaseURL!,
    projectId: projectId!,
    storageBucket: storageBucket!,
    messagingSenderId: messagingSenderId!,
    appId: appId!,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

// Connect to emulators when running locally (dev or explicit flag)
if (USE_EMULATORS) {
    const host = EMULATOR_HOST;
    try {
        connectDatabaseEmulator(db, host, DB_EMULATOR_PORT);
    } catch {}
    try {
        connectAuthEmulator(auth, `http://${host}:${AUTH_EMULATOR_PORT}`);
    } catch {}
}

export {db, auth};
