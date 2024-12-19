// modules/firebase.js
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";

// Firebase configuration
const firebaseConfig = {
  apiKey: "",
  authDomain: ".firebaseapp.com",
  databaseURL:
    "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get the database reference
const db = getDatabase(app);
const auth = getAuth(app);

export { db, auth };
