# Pokémon Soullink Tracker

## Environment & Firebase Setup

Create a `.env` file in the project root with your Firebase config:

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_DATABASE_URL=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

You can copy `.env.example` to `.env` and fill in values. Vite automatically exposes variables prefixed with `VITE_` to the client.

You can get these values from your Firebase project's settings. Auth with password and email and real-time database is needed for the project.

## Build Setup
**Prerequisites:**  [Node.js + npm](https://nodejs.org/en/download/) and [git](https://git-scm.com/downloads) installed

### Run Locally

1. Clone the [repository](https://github.com/joos-too/pokemon-soullink-tracker.git)
2. Configure the environment as described above.
3. Install dependencies:
   `npm install`
4. Run the app:
   `npm run dev`

### Deploy

1. Clone the repository at the desired release tag:
    `git clone --branch v1.0.0 https://github.com/joos-too/pokemon-soullink-tracker.git`
2. Configure the environment as described above.
3. Install dependencies:
   `npm install`
4. Build the app:
   `npm run build`
5. (When not on the server: zip the `dist` folder and upload it to your web server. Unzip it in a new directory.)
6. Make the `index.html` available via a web server e.g. nginx