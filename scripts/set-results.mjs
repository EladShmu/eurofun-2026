// One-time script to set Eurovision 2026 Grand Final results in Firestore
// Run: node scripts/set-results.mjs

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyB8ylah7SkTO5jnohTL8SaRNbq5t13VA88",
  authDomain: "eurofun-2026.firebaseapp.com",
  projectId: "eurofun-2026",
  storageBucket: "eurofun-2026.firebasestorage.app",
  messagingSenderId: "708770550960",
  appId: "1:708770550960:web:0c1f334a6e0faba7971775",
};

// Eurovision 2026 Grand Final – total scores only (entered as jury field)
const RESULTS = [
  { id: 'bulgaria',  total: 516 },
  { id: 'israel',    total: 343 },
  { id: 'romania',   total: 296 },
  { id: 'australia', total: 287 },
  { id: 'italy',     total: 281 },
  { id: 'finland',   total: 279 },
  { id: 'denmark',   total: 243 },
  { id: 'moldova',   total: 226 },
  { id: 'ukraine',   total: 221 },
  { id: 'greece',    total: 220 },
  { id: 'france',    total: 158 },
  { id: 'poland',    total: 150 },
  { id: 'albania',   total: 145 },
  { id: 'norway',    total: 134 },
  { id: 'croatia',   total: 124 },
  { id: 'czechia',   total: 113 },
  { id: 'serbia',    total:  90 },
  { id: 'malta',     total:  89 },
  { id: 'cyprus',    total:  75 },
  { id: 'sweden',    total:  51 },
  { id: 'belgium',   total:  36 },
  { id: 'lithuania', total:  22 },
  { id: 'germany',   total:  12 },
  { id: 'austria',   total:   6 },
  { id: 'uk',        total:   1 },
];

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const actualResults = RESULTS.map(r => r.id);
const actualScores = Object.fromEntries(RESULTS.map(r => [r.id, { jury: r.total }]));

console.log('Writing results to Firestore...');
await setDoc(doc(db, 'config', 'main'), { actualResults, actualScores }, { merge: true });
console.log('Done! Results saved successfully.');
process.exit(0);
