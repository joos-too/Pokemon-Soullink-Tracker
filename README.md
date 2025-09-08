# Pokémon Soullink Tracker

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Run the app:
   `npm run dev`

## Environment Setup

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
