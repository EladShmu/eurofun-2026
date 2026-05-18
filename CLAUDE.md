# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start Vite dev server
npm run build        # TypeScript compile + Vite build → dist/
firebase deploy      # Deploy to Firebase Hosting (eurofun-2026.web.app)
firebase deploy --only hosting  # Hosting only (skip functions/rules)
```

## Architecture

**Stack:** Vite + React 18 + TypeScript, Firebase (Auth + Firestore + Hosting), @dnd-kit for drag-and-drop.

**Firebase project:** `eurofun-2026` — deployed at https://eurofun-2026.web.app

### Firestore data model

```
users/{uid}
  uid, username, rankedList: RankedCountry[], pool: string[], groups: string[], lastUpdated

groups/{code}
  name, nameLower, code, createdBy, createdAt, members: string[], memberNames: Record<string,string>, actualResults: string[]
```

The user's `rankedList` is **global** — shared across all groups. Groups only store member UIDs. `nameLower` enables case-insensitive name search.

### Auth pattern

Firebase Email/Password auth uses `${username}@eurofun.local` as the internal email — users only see/type a plain username. Requires **Email/Password provider enabled** in Firebase Console → Authentication.

### Real-time sync (App.tsx)

Three nested `onSnapshot` listeners:
1. `users/{uid}` → own user data
2. `groups/{selectedGroupCode}` → group metadata
3. Per-member `users/{uid}` for each UID in `group.members`

### Eurovision scoring

`POINTS = [12,10,8,7,6,5,4,3,2,1]` applied to `rankedList.slice(0,10)`.

Prediction scoring: `d = |userPos - actualPos|; score = max(0, 10-d) + (d===0 ? 5 : 0)`. Max 150 points.

### Countries data

`src/data/countries.ts` — 25 Eurovision 2026 Grand Final countries with Hebrew names, ISO codes, and `performanceOrder` (1–25, Denmark→Austria). `flagUrl(isoCode)` returns `https://flagcdn.com/32x24/{isoCode}.png`.

### UI

Hebrew RTL (`direction: rtl`). All styles in `src/index.css` with CSS custom properties. Mobile-first dark theme.
