# EuroFun 2026 — הוראות הגדרה

## שלב 1: צור Firebase Project

1. כנס ל-https://console.firebase.google.com
2. לחץ "Add project" → תן שם (למשל `eurofun-2026`)
3. Google Analytics → לא צריך, לחץ "Create project"
4. כשהפרויקט מוכן, לחץ על הסמל `</>` (Web) להוסיף Web App
5. תן שם לאפליקציה (למשל `eurofun`)
6. **סמן** את "Also set up Firebase Hosting"
7. לחץ "Register app"
8. **העתק את ה-firebaseConfig** שמופיע

## שלב 2: הכנס את הקונפיג לאפליקציה

פתח את הקובץ `src/firebase.ts` והחלף את ה-REPLACE_ME בערכים האמיתיים:

```typescript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "eurofun-2026.firebaseapp.com",
  projectId: "eurofun-2026",
  storageBucket: "eurofun-2026.firebasestorage.app",
  messagingSenderId: "123456789",
  appId: "1:123:web:abc123",
};
```

## שלב 3: הגדר Firestore

1. ב-Firebase Console → Firestore Database → "Create database"
2. בחר **"Start in test mode"** (מספיק לערב)
3. בחר region: `europe-west` → לחץ "Enable"

## שלב 4: Deploy

```bash
# התקן Firebase CLI (פעם אחת)
npm install -g firebase-tools

# התחבר לגוגל
firebase login

# אתחל Firebase בפרויקט (בחר את הפרויקט שיצרת)
firebase use --add

# בנה ופרסם
npm run build
firebase deploy
```

זה יתן לך URL בצורת:
`https://eurofun-2026.web.app`

שתף את ה-URL עם החברים! 🎉
