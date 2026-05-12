# Contributing

Contributions are welcome! This guide covers how to set up the project locally, the architecture, and the conventions we follow.

---

## Prerequisites

- [Node.js + npm](https://nodejs.org/) (LTS recommended)
- [Git](https://git-scm.com/)
- [Java 21+](https://www.oracle.com/java/technologies/downloads/#java21) (required for Firebase Emulators)

---

## Local Development Setup

```bash
# 1. Clone the repository
git clone https://github.com/joos-too/pokemon-soullink-tracker.git
cd pokemon-soullink-tracker

# 2. Install dependencies
npm install

# 3. Set up environment
cp .env.example .env     # defaults are fine for emulator mode

# 4. Install Firebase CLI (once)
npm install -g firebase-tools

# 5. Start Firebase Emulators
npm run emulators

# 6. In a second terminal — start the dev server
npm run dev
```

### Automatic Test Data Seeding

When running with emulators, the app automatically seeds:

- **Test user:** `test@example.com` / `testpassword123`
- **Sample tracker:** pre-populated team, box, and graveyard
- Seeding is idempotent — safe across hot reloads.

---

## Production Deployment

```bash
# 1. Clone at the desired release tag
git clone --branch v1.2.0 https://github.com/joos-too/pokemon-soullink-tracker.git
cd pokemon-soullink-tracker

# 2. Create .env.production with your Firebase project credentials
#    (see Environment Setup below)

# 3. Install & build
npm install
npm run build

# 4. Serve the dist/ folder with any static host (nginx, Vercel, Netlify …)
```

---

## Environment & Firebase Setup

The project supports two modes:

### Local development (Firebase Emulators)

```env
VITE_FIREBASE_PROJECT_ID=soullink-tracker-d6d9a
VITE_USE_FIREBASE_EMULATOR=true
VITE_FIREBASE_EMULATOR_HOST=localhost
VITE_FIREBASE_AUTH_EMULATOR_PORT=9099
VITE_FIREBASE_DB_EMULATOR_PORT=9000
```

### Production (real Firebase project)

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_DATABASE_URL=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

> Do **not** set `VITE_USE_FIREBASE_EMULATOR` in production. The app validates these variables at runtime and throws a helpful error if any are missing.

---

## Available Commands

| Command                    | Description                              |
| -------------------------- | ---------------------------------------- |
| `npm install`              | Install dependencies                     |
| `npm run dev`              | Start the Vite dev server                |
| `npm run emulators`        | Start Firebase emulators                 |
| `npm run build`            | Create a production build                |
| `npm run preview`          | Preview the production build             |
| `npm run prettier`         | Format the entire repo                   |
| `npm run prettier:check`   | Check formatting (CI-friendly)           |
| `npm run generate-pokemon` | Regenerate Pokémon datasets from PokéAPI |

---

## Architecture & Technical Details

### Project Structure

```
├── index.tsx              # App entry point
├── types.ts               # Shared domain types
├── src/
│   ├── App.tsx            # Routing, auth, tracker lifecycle, modals
│   ├── firebaseConfig.ts  # Firebase init + emulator wiring
│   ├── i18n.ts            # i18next setup (EN / DE)
│   ├── components/        # UI components (pages, modals, widgets, pickers …)
│   ├── services/          # Firebase access, search, sprites, tracker/ruleset ops
│   ├── data/              # Generated & static data (game versions, Pokémon, types …)
│   └── locales/           # Translation dictionaries (de.ts, en.ts)
├── public/
│   ├── badge-sprites/     # Official gym badge images (gen1 – gen6)
│   ├── champ-sprites/     # Champion character art
│   ├── elite4-sprites/    # Elite Four character art
│   ├── rival-sprites/     # Rival character art
│   ├── fossil-sprites/    # Fossil item images
│   └── stone-sprites/     # Evolution stone images
└── scripts/               # Data generation scripts (PokeAPI → TypeScript)
```

### Data Model (Firebase Realtime Database)

| Path                            | Description                                                                          |
| ------------------------------- | ------------------------------------------------------------------------------------ |
| `trackers/{trackerId}/meta`     | Tracker metadata: title, players, game version, members, guests, public flag         |
| `trackers/{trackerId}/state`    | Runtime state: team, box, graveyard, rules, level/rival caps, stats, fossils, stones |
| `userTrackers/{userId}`         | Membership index — maps a user to all trackers they belong to                        |
| `users/{userId}`                | User profile                                                                         |
| `userEmails/{encodedEmail}`     | Email → UID reverse lookup (for the invite system)                                   |
| `rulesets/{userId}/{rulesetId}` | User-owned custom rulesets                                                           |

### How Sprites Are Stored & Resolved

- **Static assets** (badges, rivals, Elite Four, champions, fossils, stones) are checked into `public/` and served directly by the web server.
- **Pokémon sprites** are loaded at runtime from the [PokeAPI sprite repository](https://github.com/PokeAPI/sprites) on GitHub (`raw.githubusercontent.com`).
- A **service worker** (`public/pokeapi-js-wrapper-sw.js`) intercepts these requests and caches them in the browser's Cache Storage for offline access and faster repeat loads.
- Sprite helpers in `src/services/sprites.ts` resolve the correct URL based on Pokémon ID, shiny state, generation sprite preference, and mega stone display style.

### Pokémon Data Pipeline

The app ships pre-generated TypeScript datasets so it works fully offline after initial load:

| File                             | Contents                                  |
| -------------------------------- | ----------------------------------------- |
| `src/data/pokemon-en.ts`         | English Pokémon names (all gens up to 6)  |
| `src/data/pokemon-de.ts`         | German Pokémon names                      |
| `src/data/pokemon-map.ts`        | ID → name lookup map                      |
| `src/data/pokemon-evolutions.ts` | Evolution chains with generation metadata |
| `src/data/pokemon-types.ts`      | Type data for filtering and display       |

To regenerate from [PokéAPI](https://pokeapi.co/):

```bash
npm run generate-pokemon
```

---

## Coding Conventions

- **Functional React components** with typed props.
- Extend `types.ts` or local interfaces instead of introducing `any`.
- Use the `@/` alias for imports from the project root.
- Keep data-fetching and Firebase mutation logic in `src/services/` rather than inside UI components.
- Reuse existing helpers for sanitizing player names, rules, tags, and state shape.
- Preserve read-only behavior for public trackers and guest users.

---

## Localization

The UI supports **English** and **German**.

- Prefer translation keys over inline user-facing strings.
- When adding or changing UI copy, update both `src/locales/de.ts` and `src/locales/en.ts`.
- Keep labels, button text, and validation messages aligned across both locales.

---

## Code Formatting

Prettier is configured for the project. Husky runs Prettier automatically as a pre-commit hook.

```bash
# Format everything
npm run prettier

# Check formatting (CI-friendly)
npm run prettier:check
```

---

## Firebase Database Rules

Rules are defined in `database.rules.json` and auto-loaded by the emulators.

To deploy to a live project:

```bash
npx firebase login
npx firebase use <your-project-id>
npx firebase deploy --only database
```

---

## Submitting Changes

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/amazing-feature`).
3. Make your changes.
4. Ensure `npm run build` passes.
5. Ensure `npm run prettier:check` passes.
6. Commit your changes and push the branch.
7. Open a Pull Request.

---

Thank you for contributing!
