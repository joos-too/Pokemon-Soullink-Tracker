// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";

// Read sensitive values from Vite env
const apiKey = import.meta.env.VITE_FIREBASE_API_KEY as string | undefined;
if (!apiKey) {
  throw new Error('Missing VITE_FIREBASE_API_KEY. Define it in your .env file.');
}

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey,
  authDomain: "soullink-tracker-d6d9a.firebaseapp.com",
  databaseURL: "https://soullink-tracker-d6d9a-default-rtdb.europe-west1.firebasedatabase.app/",
  projectId: "soullink-tracker-d6d9a",
  storageBucket: "soullink-tracker-d6d9a.firebasestorage.app",
  messagingSenderId: "1056866798050",
  appId: "1:1056866798050:web:3c4ddef5847a321f6551bb"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app);