// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAs6cZDpBKWiASCmkE2EQf0bHRf6S-tqFY",
  authDomain: "toit-s.firebaseapp.com",
  projectId: "toit-s",
  storageBucket: "toit-s.firebasestorage.app",
  messagingSenderId: "501753752554",
  appId: "1:501753752554:web:21df41c99e782443712093",
  measurementId: "G-DYLX4JNR7C"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };
