# 🎤 EuroFun 2026

A real-time Eurovision Song Contest prediction game for friend groups — built in 3 days under a hard deadline.

**Live:** [eurofun-2026.web.app](https://eurofun-2026.web.app)

---

## What is it?

Instead of watching Eurovision passively, everyone in the group ranks countries in real-time during the broadcast. After the final results are announced, five different scoring algorithms determine who predicted best — and everyone wins *something*.

Built from a university tradition of doing this on paper with a top-5 list and a different format every year. This version makes it persistent, competitive, and actually comparable.

---

## Features

- **Real-time group rankings** — see your friends' picks update live as they rank countries
- **Drag-and-drop ranking** — reorder 25 countries on mobile during the show
- **5 scoring algorithms** — Linear distance, Squared penalty, Bulls-eye, Tier matching, League points
- **Group management** — create groups, share invite links, join via WhatsApp link
- **Admin panel** — freeze rankings when results start, input actual results
- **Truth table** — side-by-side comparison of actual results vs. your predictions with score bar chart
- **RTL / Hebrew UI** — designed for Israeli users on mobile

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript |
| Build | Vite |
| Backend | Firebase Firestore (real-time DB) |
| Auth | Firebase Authentication |
| Hosting | Firebase Hosting |
| Drag & Drop | @dnd-kit |
| Styling | Plain CSS, mobile-first RTL |

---

## Architecture Highlights

**Real-time sync** — Nested `onSnapshot` listeners: one per group member. Every ranking change propagates to all group members within seconds without any polling.

**Auth pattern** — Users sign up with just a username. Internally, Firebase Auth uses `username@eurofun.local` as the email — the user never sees it.

**Global ranking** — A user's ranked list is stored once on their profile and shared across all groups they belong to. Groups store only member UIDs.

**Admin freeze** — A single Firestore document (`config/main.rankingFrozen`) locks all editing instantly across all clients when the real results start coming in.

**Scoring** — All 5 algorithms run client-side on the actual results array. Unranked countries receive maximum-distance penalty to prevent partial rankers from gaining an unfair advantage.

---

## Data Model

```
users/{uid}
  uid, username, rankedList: RankedCountry[], pool: string[], groups: string[]

groups/{code}
  name, code, members: string[], memberNames: Record<string,string>, actualResults: string[]

config/main
  rankingFrozen: boolean, actualResults: string[], actualScores: Record<string, Score>
```

---

## Running Locally

```bash
npm install
npm run dev
```

Requires a Firebase project. Create `src/firebase.ts` with your config:

```ts
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const app = initializeApp({ /* your firebase config */ });
export const db = getFirestore(app);
export const auth = getAuth(app);
```

Enable **Email/Password** provider in Firebase Console → Authentication.

---

## Deployment

```bash
npm run build
firebase deploy --only hosting
```

---

## Scoring Algorithms

| Game | Description | Winner |
|------|-------------|--------|
| **Linear** | Sum of absolute position differences | Lowest score |
| **Squared** | Sum of squared differences — punishes big misses harder | Lowest score |
| **Bulls-eye** | Points only for exact position matches | Highest score |
| **Tiers** | Points for guessing the right bracket (top 3 / top 5 / top 10) | Highest score |
| **League** | Sliding scale by proximity — exact match scores 50, ±2 scores 10 | Highest score |

A **Grand Total** combines all five: each user gets rank points (8/5/3/1) per game, summed across all games.

---

## V2 Ideas (Eurovision 2027)

- Semi-final support (SF1 + SF2 phases)
- Song name, artist, and YouTube link per country
- PWA — installable on mobile with push notifications
- Bottom navigation bar for one-handed use
- Group chat
- Trivia / Over-Under side bets
- "You Are The Country" — vote like a Eurovision jury

---

*Built by [Elad Shmulevich](https://github.com/EladShmu)*
