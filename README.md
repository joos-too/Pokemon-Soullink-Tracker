# Pokémon Soullink Tracker

## Run locally for development
**Prerequisites:**  [Node.js + npm](https://nodejs.org/en/download/), [git](https://git-scm.com/downloads) and [Java](https://www.oracle.com/java/technologies/downloads/#java21) installed

1. Clone the [repository](https://github.com/joos-too/pokemon-soullink-tracker.git)
2. Install dependencies:
   `npm install`
3. Configure the environment as described below.
4. Run the Firebase emulators:
   `npm run emulators`
5. Run the app:
   `npm run dev`

## Deploy on a web server
**Prerequisites:**  [Node.js + npm](https://nodejs.org/en/download/) and [git](https://git-scm.com/downloads) installed

1. Clone the repository at the desired release tag:
    `git clone --branch v1.2.0 https://github.com/joos-too/pokemon-soullink-tracker.git`
2. Configure the environment as described below.
3. Install dependencies:
   `npm install`
4. Build the app:
   `npm run build`
5. (When not on the server: zip the `dist` folder and upload it to your web server. Unzip it in a new directory.)
6. Make the `index.html` available via a web server e.g. nginx

## Environment & Firebase Setup

This project supports two environment modes with different env files and Firebase setups:

- Local development (default): uses Firebase emulators. Minimal config required.
- Production build/deploy: uses your real Firebase project. Full config required.

### 1. Local development (with Firebase Emulators)

Use the provided .env.example as your base and copy it to .env.
Edit .env if needed (all values have sensible defaults for emulator use).

```
VITE_FIREBASE_PROJECT_ID=soullink-tracker-d6d9a
# When true (automatically when running `vite` in dev), connect SDKs to local emulators
VITE_USE_FIREBASE_EMULATOR=true
# Optional host override (defaults to 127.0.0.1 in dev)
VITE_FIREBASE_EMULATOR_HOST=localhost
# Ports must match firebase.json
VITE_FIREBASE_AUTH_EMULATOR_PORT=9099
VITE_FIREBASE_DB_EMULATOR_PORT=9000
```

Install firebase tools via `npm install -g firebase-tools`

### 2. Production (real Firebase project)

Create a .env.production file using the template:
Fill in the values from your Firebase Console. Realtime Database and Email/Password Auth must be enabled for the project.

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_DATABASE_URL=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

Important:
- Do not set VITE_USE_FIREBASE_EMULATOR in production. The app will validate these variables at runtime and throw a helpful error if missing.
- Vite automatically exposes variables prefixed with VITE_ to the client.

## Autocomplete for German Pokémon names 

- The app ships with a preloaded list file at `src/data/pokemon-de.ts` used for zero‑latency suggestions in search fields.
- To (re)generate this list from PokeAPI, run:

```
npm run build:names
```

This fetches all Pokémon species, extracts the german names and writes them back into `src/data/pokemon-de.ts`.

- At runtime, the app also refreshes this list in the background from time to time and caches it in `localStorage` without blocking the UI.
