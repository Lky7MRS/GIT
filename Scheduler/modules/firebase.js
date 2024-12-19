// modules/firebase.js
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from 'firebase/auth';

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAufI82VhZ1yq8FwOEAtg6gwASarTdnzJM",
    authDomain: "scheduler-f2a71.firebaseapp.com",
    databaseURL: "https://scheduler-f2a71-default-rtdb.europe-west1.firebasedatabase.app/", // Add this line
    projectId: "scheduler-f2a71",
    storageBucket: "scheduler-f2a71.firebasestorage.app",
    messagingSenderId: "943615224751",
    appId: "1:943615224751:web:dd07e0a67b2965aafb9d5a"
  };

// Initialize Firebase first
const app = initializeApp(firebaseConfig);

// Then get the database reference
const db = getDatabase(app);
const auth = getAuth(app); // Initialize auth

console.log(firebaseConfig, app, db);

export { db, auth };