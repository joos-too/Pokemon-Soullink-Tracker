# Repository Guidelines

## Project Structure & Module Organization
- `src/`: App code (`App.tsx`) and UI in `src/components/`.
- `index.tsx`: React entry; `index.html`: Vite HTML shell.
- `constants.ts` and `types.ts`: shared constants and TypeScript models.
- `src/firebaseConfig.ts`: Firebase init (DB + Auth) using Vite env.
- `vite.config.ts` and `tsconfig.json`: build and path aliases (`@/*` → project root).

## Build, Test, and Development Commands
- `npm install`: install dependencies.
- `npm run dev`: start Vite dev server with HMR.
- `npm run build`: production build to `dist/`.
- `npm run preview`: preview the production build locally.

## Coding Style & Naming Conventions
- TypeScript + React function components; prefer hooks.
- Indentation: 2 spaces; keep lines focused and readable.
- Naming: `PascalCase` for components/files in `src/components/`, `camelCase` for vars/props, UPPER_SNAKE for constants when appropriate.
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

## Security & Configuration Tips
- Environment: copy `.env.example` → `.env` and set `VITE_FIREBASE_API_KEY=...` (required; app throws if missing).
- Never commit secrets; `.env` is git-ignored.
- Only expose variables with `VITE_` prefix (Vite client behavior).

## Architecture Overview
- Single-page React app with Firebase Realtime Database and Auth.
- State shape in `types.ts`; initial data and colors in `constants.ts`.
- Reads/writes app state at DB root; be cautious with breaking schema changes.

