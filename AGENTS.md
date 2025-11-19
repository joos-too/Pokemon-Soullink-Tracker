# Agent Handbook

Aktueller Überblick für Coding-Agents, die am Pokémon Soullink Tracker arbeiten.

## Architektur & Hauptfunktionen
- React 19 Single-Page-App mit React Router; Einstieg über `index.tsx`, Hauptlogik in `src/App.tsx`.
- Firebase Realtime Database und Firebase Auth: Benutzer müssen sich einloggen, bevor sie Tracker sehen/verwalten.
- Home-Dashboard zeigt alle Tracker des eingeloggten Users, inkl. Zusammenfassungen (Team, Box, Grab, Fortschritt). Tracker lassen sich erstellen, öffnen und für Owners löschen.
- Tracker-Ansicht verwaltet Team-, Box- und Grab-Paare, Level- und Rivalen-Caps, Regeln, Statistiken sowie optionale Features (Legendary-Zähler, Rivalen-Zensur).
- Spielversionen inkl. Badge-Designs, Level- und Rivalen-Caps sind in `src/data/game-versions.ts` definierte Stammdaten.
- Hintergrundaktualisierung deutscher Pokémon-Namen (`src/services/pokemonSearch.ts`) und Sprite-Zugriff (`src/services/sprites.ts`) nutzen lokale Caches + PokeAPI.

## Projektstruktur (Auszug)
- `src/App.tsx`: Router-Setup, Firebase-Listener, Tracker-Lifecycle, Modale Steuerung.
- `src/components/`: UI-Bausteine
  - Auth (`LoginPage.tsx`, `RegisterPage.tsx`)
  - Dashboard (`HomePage.tsx`, `GameVersionBadge.tsx`)
  - Tracker-UI (`TeamTable.tsx`, `InfoPanel.tsx`, `ClearedRoutes.tsx`, `Graveyard.tsx`, `SettingsPage.tsx`, diverse Modale).
- `src/services/`:
  - `trackers.ts`: CRUD-Operationen auf Realtime DB, Mitgliederverwaltung, Rivalenpräferenzen.
  - `pokemonSearch.ts`: Sofortsuche + Hintergrundrefresh deutscher Namen.
  - `sprites.ts`: Sprite-/Artwork-Auflösung über Namen → IDs.
- `src/data/`: Generierte Datensätze (`pokemon-de.ts`, `pokemon-de-map.ts`, `pokemon-evolutions.ts`, `game-versions.ts`). Änderungen i.d.R. per Script.
- `src/firebaseConfig.ts`: Firebase-Initialisierung, Emulatorkonfiguration basierend auf Vite-Umgebungsvariablen.
- `constants.ts`: Default-Setup (Farben, Regeln, Initialstate-Helfer), legt Standardspielversion fest.
- `types.ts`: Applikationsmodelle (Tracker-Struktur, Rivalen, Stats etc.).
- `public/`: Statische Assets (Logos, Badges, Rival-Sprites, Champion-Sprites).
- `vite.config.ts` / `tsconfig.json`: Vite-Build + Pfadalias `@/*` → Projektwurzel.

## Build-, Dev- & Datenbefehle
- `npm run dev`: Vite Dev-Server (nutzt automatisch Emulatoren).
- `npm run emulators`: Firebase Emulator Suite (Auth + Realtime DB).
- `npm run build`: Production-Build nach `dist/`.
- `npm run preview`: Preview-Server für Build.
- `npm run build:names`: Regeneriert deutsche Pokémon-Namen + Map via PokeAPI (Netzwerkzugriff erforderlich).

## Entwicklungsrichtlinien
- TypeScript + React Hooks; Komponenten funktional halten, Props typisieren (`types.ts` erweitern statt `any`).
- 2 Leerzeichen Einrückung, short & readable Zeilen, Nutzertexte Deutsch.
- Imports über `@/…` Alias; UI-Files in `src/components/` nutzen PascalCase.
- Dark Mode via `<html class="dark">`; `DarkModeToggle` synchronisiert LocalStorage + DOM.
- Firebase: Emulatormodus per `VITE_USE_FIREBASE_EMULATOR=true` (Standard in `.env`). Production benötigt vollständige `VITE_FIREBASE_*` Variablen; ohne Emulator strikte Runtime-Checks.
- Tracker-Daten liegen unter `trackers/{trackerId}/state`. Schema-Änderungen mit Bedacht planen, Migration kommunizieren.
- Namen/Sprite-Caches greifen auf `localStorage` zu; schützende Try/Catch-Blöcke beibehalten, um SSR/Emulator-Kontexte nicht zu brechen.

## Testing & Qualität
- Noch keine Tests eingerichtet; bei Bedarf Vitest + React Testing Library einsetzen (`*.test.tsx` neben Quelle).
- Tests deterministisch halten; Firebase über Emulatoren oder Mocks stubben.
- Vor größeren Änderungen: `npm run dev` + Emulatoren lokal prüfen. UI-Änderungen mit Screenshots im PR dokumentieren.

## Datenpflege & Skripte
- Änderungen in `src/data/` möglichst über vorhandene Skripte erzeugen; im PR vermerken, dass Daten regeneriert wurden.
- `metadata.json` beschreibt App für externe Integrationen - bei Produktänderungen aktualisieren.

## Sicherheit & Konfiguration
- `.env.example` → `.env` für lokale Dev-Umgebung (keine Secrets committed). Production-Werte in `.env.production` pflegen.
- Nur `VITE_*` Variablen ins Frontend exportieren; Secrets bleiben serverseitig.
- Bei neuem Feature-Zugriff via Firebase Auth sicherstellen, dass DB-Regeln (`database.rules.json`) den erwarteten Zugriff erlauben.

