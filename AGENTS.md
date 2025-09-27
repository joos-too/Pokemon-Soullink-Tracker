# Repository Guidelines

## Project Structure & Module Organization
- `src/`: App code (`App.tsx`) and UI in `src/components/`.
- `src/services/`: App services (e.g. `pokemonSearch.ts`, `sprites.ts`) incl. background refresh and localStorage caching.
- `src/data/`: Generated data files used for instant search and lookups (`pokemon-de.ts`, `pokemon-de-map.ts`, `pokemon-evolutions.ts`).
- `src/pokeapi.ts`: Shared PokeAPI client instance.
- `index.tsx`: React entry; applies dark mode class before mount.
- `index.html`: Vite HTML shell; Tailwind via CDN with `darkMode: 'class'`.
- `index.css`: Minimal global styles.
- `public/`: Static assets (e.g. favicon, logo).
- `constants.ts` and `types.ts`: shared constants and TypeScript models.
- `src/firebaseConfig.ts`: Firebase init (DB + Auth). Uses Vite env and connects to local emulators in dev or when `VITE_USE_FIREBASE_EMULATOR=true`.
- `vite.config.ts` and `tsconfig.json`: build and path aliases (`@/*` → project root).

## Build, Test, and Development Commands
- `npm install`: install dependencies.
- `npm run dev`: start Vite dev server with HMR.
- `npm run emulators`: start Firebase emulators (Realtime DB + Auth).
- `npm run build`: production build to `dist/`.
- `npm run preview`: preview the production build locally.
- `npm run build:names`: regenerate German Pokémon data from PokeAPI; writes to `src/data/` (requires network).

## Coding Style & Naming Conventions
- TypeScript + React function components (React 19); prefer hooks.
- Indentation: 2 spaces; keep lines focused and readable.
- Naming: `PascalCase` for components/files in `src/components/`, `camelCase` for vars/props, UPPER_SNAKE for constants when appropriate.
- User facing text in German.
- Dark mode: toggled via `class="dark"` on `<html>`; see `index.tsx`.
- Imports: use alias `@` for absolute paths (examples: `import TeamTable from '@/src/components/TeamTable'`, `import { INITIAL_STATE } from '@/constants'`, `import type { AppState } from '@/types'`).
- Types: avoid `any`; extend interfaces in `types.ts` where feasible.

## Testing Guidelines
- No automated tests configured yet. If adding tests, prefer Vitest + React Testing Library.
- Suggested naming: mirror source file, e.g., `src/components/TeamTable.test.tsx`.
- Keep tests deterministic; mock Firebase where needed.

## Commit & Pull Request Guidelines
- Commits: short, imperative summaries (e.g., `fix login flow`, `add graveyard modal`).
- Scope changes logically; one topic per commit.
- PRs: include a clear description, screenshots/GIFs for UI changes, and steps to validate (`npm run dev` or `npm run preview`). Link related issues.
- Update docs when changing env, scripts, or public behavior.
 - When regenerating data in `src/data/`, include a note and diff summary.

## Security & Configuration Tips
- Environments:
  - Local dev: copy `.env.example` → `.env`. Uses Firebase emulators by default (`VITE_USE_FIREBASE_EMULATOR=true` or `vite` dev mode). Minimal values required.
  - Production: copy `.env.production.example` → `.env.production` and set all `VITE_FIREBASE_*` values. Do not set emulator flags.
- Runtime validation: in production (non-emulator), the app throws if required `VITE_FIREBASE_*` vars are missing.
- Never commit secrets; `.env*` files are git-ignored.
- Only expose variables with `VITE_` prefix (Vite client behavior).

## Architecture Overview
- Single-page React app with Firebase Realtime Database and Auth.
- State shape in `types.ts`; initial data and colors in `constants.ts`.
- Firebase config connects to local emulators in dev; production uses real project via env.
- Reads/writes app state at DB root; be cautious with breaking schema changes.
- Pokémon names & assets:
  - Preloaded German names and id map in `src/data/` for instant search.
  - Background refresh from PokeAPI updates localStorage (non-blocking).
  - Sprites/artwork loaded from PokeAPI sprite repository URLs.

