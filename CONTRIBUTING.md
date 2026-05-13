# Contributing

Thanks for your interest in contributing to **Soullink Tracker**! This guide covers everything you need to get up and running - from local setup to submitting a pull request.

## 📋 Prerequisites

- [Node.js](https://nodejs.org/) (LTS) & npm
- [Java 21+](https://www.oracle.com/java/technologies/downloads/#java21) - required by Firebase Emulators

## 🚀 Local Development Setup

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

# 6. In a second terminal - start the dev server
npm run dev
```

### Automatic Test Data Seeding

When running with emulators, the app automatically seeds:

- **Test user:** `test@example.com` / `testpassword123`
- **Sample trackers:** pre-populated team, box, and graveyard etc...

## 🏗 Production Deployment

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

## ⚙️ Environment & Firebase Setup

The project supports two modes:

<details>
<summary><b>Local development (Firebase Emulators)</b></summary>

```env
VITE_FIREBASE_PROJECT_ID=soullink-tracker-d6d9a
VITE_USE_FIREBASE_EMULATOR=true
VITE_FIREBASE_EMULATOR_HOST=localhost
VITE_FIREBASE_AUTH_EMULATOR_PORT=9099
VITE_FIREBASE_DB_EMULATOR_PORT=9000
```

</details>

<details>
<summary><b>Production (real Firebase project)</b></summary>

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

</details>

## 📦 Available Commands

| Command                    | Description                              |
| -------------------------- | ---------------------------------------- |
| `npm run dev`              | Start the Vite dev server                |
| `npm run emulators`        | Start Firebase emulators                 |
| `npm run build`            | Create a production build                |
| `npm run generate-pokemon` | Regenerate Pokémon datasets from PokéAPI |

## 🏛 Architecture

### Project Structure

```
├── index.html / index.tsx            # Entry point
├── types.ts                          # Shared domain types
│
├── src/
│   ├── App.tsx                       # Routing, auth, tracker lifecycle, modals
│   ├── i18n.ts                       # i18next setup (Localization)
│   │
│   ├── components/
│   │   ├── pages/                    # Top-level views (Home, Login, Settings, Ruleset Editor …)
│   │   ├── modals/                   # Dialogs (create tracker, add fossil, evolve, delete …)
│   │   ├── widgets/                  # Tracker panels (team table, graveyard, items, level caps …)
│   │   ├── inputs/                   # Autocomplete inputs (Pokémon, location, item)
│   │   ├── pickers/                  # Game version & ruleset pickers
│   │   ├── badges/                   # Game version & type badge components
│   │   ├── toggles/                  # Dark mode, language, generic toggle
│   │   └── other/                    # Shared UI helpers (tooltips, game images)
│   │
│   ├── data/                         # Generated & static datasets (do not edit by hand)
│   ├── locales/                      # Translation dictionaries (de.ts, en.ts)
│   ├── services/                     # Business logic & Firebase access
│   ├── utils/                        # Helper functions (routes, wiki links, stats)
│
├── public/                           # Static assets (badge / rival / champion / fossil sprites …)
│
└── scripts/                          # Data generation pipeline
    ├── generate-pokemon-de.mjs       # PokéAPI → Pokémon / evolution / location / type data
    ├── generate-items.mjs            # PokéAPI + local lists → version-tagged item data
```

### Data Model (Firebase Realtime Database)

| Path                            | Description                                                                          |
| ------------------------------- | ------------------------------------------------------------------------------------ |
| `trackers/{trackerId}/meta`     | Tracker metadata: title, players, game version, members, guests, public flag         |
| `trackers/{trackerId}/state`    | Runtime state: team, box, graveyard, rules, level/rival caps, stats, fossils, stones |
| `userTrackers/{userId}`         | Membership index - maps a user to all trackers they belong to                        |
| `users/{userId}`                | User profile                                                                         |
| `userEmails/{encodedEmail}`     | Email → UID reverse lookup (for the invite system)                                   |
| `rulesets/{userId}/{rulesetId}` | User-owned custom rulesets                                                           |

### Sprites

- **Static assets** (badges, rivals, Elite Four, champions, fossils, stones) live in `public/` and are served directly.
- **Pokémon sprites** are loaded at runtime from the [PokeAPI sprite repository](https://github.com/PokeAPI/sprites) on GitHub.
- A **service worker** (`public/pokeapi-js-wrapper-sw.js`) caches sprite requests for offline access and faster repeat loads.
- Sprite helpers in `src/services/sprites.ts` resolve the correct URL based on Pokémon ID, shiny state, generation preference, and mega stone display style.

### Pokémon Data Pipeline

The app ships pre-generated TypeScript datasets so it works fully offline after initial load:

| File                               | Contents                                            |
| ---------------------------------- | --------------------------------------------------- |
| `src/data/pokemon-en.ts`           | English Pokémon names with generation metadata      |
| `src/data/pokemon-de.ts`           | German Pokémon names with generation metadata       |
| `src/data/pokemon-map.ts`          | Name → ID lookup maps and ID → generation mapping   |
| `src/data/pokemon-evolutions.ts`   | Evolution chains with localized method descriptions |
| `src/data/pokemon-types.ts`        | Type data per Pokémon (including past-type changes) |
| `src/data/location-suggestions.ts` | Route/location names per region (EN + DE)           |

**`generate-pokemon-de.mjs`** fetches all species, evolution chains, locations, types, items, and moves from [PokéAPI](https://pokeapi.co/) and writes the files above. Every name is resolved in both English and German, with manual overrides for entries the API doesn't translate correctly.

```bash
npm run generate-pokemon
```

### Item Data Pipeline

PokéAPI does not provide version-introduction data for items - you can't tell from the API alone whether an item first appeared in Gen 1 or Gen 5. To solve this we maintain **hand-curated item lists** sourced from [PokéWiki](https://www.pokewiki.de/) in `scripts/itemlists-source/`.

The generation pipeline has two steps:

1. **`convert-itemlists.mjs`** - Parses the raw PokéWiki `.txt` exports into JSON files (one per game version).
2. **`generate-items.mjs`** - Fetches every item from PokéAPI, cross-references it against the local JSON lists to determine the **earliest game version** an item appeared in, then fetches properly cased item-slugs and localized names from PokéAPI.

The result is `src/data/items.ts` - a typed array where every item carries its `slug`, localized names, first `version`, pocket, and categories. This lets the tracker filter items to only those available in the game version the user selected.

```bash
node scripts/convert-itemlists.mjs   # only needed when .txt sources change
node scripts/generate-items.mjs
```

> **Why not just PokéAPI?** The API groups items by pocket and category but has no concept of "this item was introduced in Generation X." The local item lists fill that gap so the autocomplete can show version-accurate results.

## ✍️ Coding Conventions

- **Functional React components** with typed props.
- Extend `types.ts` or local interfaces instead of introducing `any`.
- Use the `@/` alias for imports from the project root.
- Keep data-fetching and Firebase mutation logic in `src/services/`, not in UI components.
- Reuse existing helpers for sanitizing player names, rules, tags, and state shape.
- Preserve read-only behavior for public trackers and guest users.

## 🌍 Localization

The UI supports **English** and **German**.

- Prefer translation keys over inline user-facing strings.
- When adding or changing UI-text-elements, update both `src/locales/en.ts` and `src/locales/de.ts`, as well as more to come in the future.
- Keep labels, button text, and validation messages aligned across both locales.

## 🎨 Code Formatting

Prettier is configured for the project. Husky runs it automatically as a pre-commit hook.

```bash
npm run prettier          # format everything
npm run prettier:check    # check only (CI-friendly)
```

## 🔒 Firebase Database Rules

Rules are defined in `database.rules.json` and auto-loaded by the emulators.

To deploy to a live project:

```bash
npx firebase login
npx firebase use <your-project-id>
npx firebase deploy --only database
```

## 🚢 Submitting Changes

1. **Fork** the repository.
2. **Branch** - `git checkout -b feature/amazing-feature`
3. **Code** - make your changes.
4. **Validate** - ensure `npm run build` and `npm run prettier:check` both pass.
5. **Commit & push** your branch.
6. **Open a Pull Request** - describe what you changed and why.

<p align="center"><b>Thank you for contributing! 🎉</b></p>
