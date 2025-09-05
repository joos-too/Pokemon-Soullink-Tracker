// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAAZ6suI45mCkZXABnxsLHAA03_8hbrMPA",
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