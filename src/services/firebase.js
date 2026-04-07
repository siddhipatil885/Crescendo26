// Import Firebase core
import { initializeApp } from "firebase/app";

// Import Firestore
import { getFirestore } from "firebase/firestore";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyC9_iyqS-HkAj5_gGZq0lyw4OV2qRd7Ivc",
  authDomain: "civix-8ccf7.firebaseapp.com",
  projectId: "civix-8ccf7",
  storageBucket: "civix-8ccf7.firebasestorage.app",
  messagingSenderId: "292030132635",
  appId: "1:292030132635:web:414140638799cde036b13e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

// Export database
export { db };