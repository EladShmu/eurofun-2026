import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Replace with your Firebase project config
// Go to: https://console.firebase.google.com -> your project -> Project Settings -> Your apps -> Web app
const firebaseConfig = {
  apiKey: "AIzaSyB8ylah7SkTO5jnohTL8SaRNbq5t13VA88",
  authDomain: "eurofun-2026.firebaseapp.com",
  projectId: "eurofun-2026",
  storageBucket: "eurofun-2026.firebasestorage.app",
  messagingSenderId: "708770550960",
  appId: "1:708770550960:web:0c1f334a6e0faba7971775",
  measurementId: "G-TVBQXBRTHC"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
