# Pokémon Soullink Tracker

Disclaimer: The website is still under development, data loss or bugs are possible.

## Run locally for development

**Prerequisites:** [Node.js + npm](https://nodejs.org/en/download/), [git](https://git-scm.com/downloads) and [Java](https://www.oracle.com/java/technologies/downloads/#java21) installed

1. Clone the [repository](https://github.com/joos-too/pokemon-soullink-tracker.git)
2. Install dependencies:
   `npm install`
3. Configure the environment as described below.
4. Run the Firebase emulators:
   `npm run emulators`
5. Run the app:
   `npm run dev`

## Deploy on a web server

**Prerequisites:** [Node.js + npm](https://nodejs.org/en/download/) and [git](https://git-scm.com/downloads) installed

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

#### Automatic Test Data Seeding

When running in emulator mode (`VITE_USE_FIREBASE_EMULATOR=true`), the application automatically seeds test data on startup:

- **Test User**: `test@example.com` / `testpassword123`
- **Sample Tracker**: Pre-populated with team, box, and graveyard Pokémon
- **Idempotent**: Checks for existing data to prevent duplication during hot reloads

This allows developers to immediately start testing features without manually creating users and trackers. The seeding logic is implemented in `src/services/emulatorSeed.ts` and triggered from `App.tsx` after Firebase initialization.

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
- Vite automatically exposes variables prefixed with VITE\_ to the client.

## Sync Firebase Database Rules via CLI

The Realtime Database rules live in `database.rules.json`. To upload the current rules to a Firebase project:

1. Log into the Firebase CLI (install it globally first if needed):  
   `npx firebase login`
2. Select your Firebase project (skip if already configured in `.firebaserc`):  
   `npx firebase use <your-project-id>`
3. Deploy only the database rules:  
   `npx firebase deploy --only database`

The same `database.rules.json` file is loaded automatically when you run the local emulators via `npm run emulators`.

## Prettier & pre-commit hooks

- Format locally with Prettier: `npx prettier --write .`
- To auto-format before each commit, Husky is configured to run Prettier pre-commit.

### Prettier in your editor

- Enable Prettier in your editor to format on save or via a shortcut for fastest feedback.
- Setup guides for popular editors: https://prettier.io/docs/editors
- If your editor lacks support, use a file watcher to run `prettier --write` on changes.

## Pokémon data cache (names + evolutions)

- The app ships with generated datasets under `src/data/` (`pokemon-de.ts`, `pokemon-en.ts`, `pokemon-map.ts`, `pokemon-evolutions.ts`) that power localized autocomplete and evolution filtering (generation + version-aware).
- To refresh these datasets from PokeAPI, run:

```
npm run generate-pokemon
```

The script fetches all supported Pokémon species and evolution chains (up to Gen 6), translates the names, stores IDs/generation metadata, and persists the evolutions so the app can apply generation/version filters offline.

## Image caching

The app uses a service worker to cache Pokémon sprite images from the PokeAPI GitHub repository. This improves performance by:

- Reducing network requests for frequently viewed Pokémon
- Enabling offline access to previously loaded images
- Speeding up page load times

The service worker (`public/pokeapi-js-wrapper-sw.js`) is automatically registered when the app loads and intercepts requests to `https://raw.githubusercontent.com/PokeAPI/sprites/`. Images are cached in the browser's Cache Storage and served from cache on subsequent requests.
