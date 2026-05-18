import { UserData } from './types';

const LEAGUE_PTS = [8, 5, 3, 1];
export function leaguePts(rank: number) { return LEAGUE_PTS[Math.min(rank, LEAGUE_PTS.length - 1)]; }

export function calcLinear(user: UserData, actual: string[]): number {
  const n = actual.length;
  const ur: Record<string, number> = {};
  (user.rankedList ?? []).forEach((rc, i) => { ur[rc.countryId] = i; });
  return actual.reduce((s, id, pos) => s + (ur[id] !== undefined ? Math.abs(ur[id] - pos) : n), 0);
}

export function calcSquared(user: UserData, actual: string[]): number {
  const n = actual.length;
  const ur: Record<string, number> = {};
  (user.rankedList ?? []).forEach((rc, i) => { ur[rc.countryId] = i; });
  return actual.reduce((s, id, pos) => {
    const d = ur[id] !== undefined ? Math.abs(ur[id] - pos) : n;
    return s + d * d;
  }, 0);
}

export function calcBulls(user: UserData, actual: string[]): number {
  const ur: Record<string, number> = {};
  (user.rankedList ?? []).forEach((rc, i) => { ur[rc.countryId] = i; });
  const n = actual.length;
  let score = 0;
  actual.forEach((id, pos) => {
    if (ur[id] === pos) {
      if (pos === 0) score += 3;
      else if (pos < 10 || pos === n - 1) score += 2;
      else score += 1;
    }
  });
  return score;
}

// Bucket-based tiers: each country falls into one bucket based on user's guess position.
// Points awarded if the actual result is also in the correct range.
export function calcTiers(user: UserData, actual: string[]): number {
  const actualIdx: Record<string, number> = {};
  actual.forEach((id, i) => { actualIdx[id] = i; });
  let score = 0;
  (user.rankedList ?? []).forEach((rc, userIdx) => {
    const ai = actualIdx[rc.countryId];
    if (ai === undefined) return;
    if (userIdx <= 2) {          // guessed top 3
      if (ai <= 2) score += 3;
    } else if (userIdx <= 4) {   // guessed 4th–5th
      if (ai <= 4) score += 2;
    } else if (userIdx <= 9) {   // guessed 6th–10th
      if (ai <= 9) score += 1;
    } else if (userIdx >= 21) {  // guessed bottom 4 (22nd–25th)
      if (ai >= 21) score += 1;
    }
  });
  return score;
}

export function calcLeague(user: UserData, actual: string[]): number {
  const ur: Record<string, number> = {};
  (user.rankedList ?? []).forEach((rc, i) => { ur[rc.countryId] = i; });
  const n = actual.length;
  let score = 0;
  actual.forEach((id, actualPos) => {
    if (ur[id] === undefined) return;
    const d = Math.abs(ur[id] - actualPos);
    if (d === 0) {
      if (actualPos === 0) score += 50;
      else if (actualPos < 10 || actualPos === n - 1) score += 30;
      else score += 20;
    } else if (d <= 2) score += 10;
    else if (d <= 5) score += 5;
  });
  return score;
}

export interface GrandScore { uid: string; username: string; avatar: string; total: number; }

export function buildGrandScores(users: UserData[], actual: string[]): GrandScore[] {
  if (!actual.length || !users.length) return [];
  const gameSortValues = [
    users.map(u => ({ uid: u.uid, sv: -calcLinear(u, actual) })),
    users.map(u => ({ uid: u.uid, sv: -calcSquared(u, actual) })),
    users.map(u => ({ uid: u.uid, sv: calcBulls(u, actual) })),
    users.map(u => ({ uid: u.uid, sv: calcTiers(u, actual) })),
    users.map(u => ({ uid: u.uid, sv: calcLeague(u, actual) })),
  ];
  const totals: Record<string, number> = {};
  users.forEach(u => { totals[u.uid] = 0; });
  gameSortValues.forEach(rows => {
    const sorted = [...rows].sort((a, b) => b.sv - a.sv);
    let i = 0;
    while (i < sorted.length) {
      let j = i + 1;
      while (j < sorted.length && sorted[j].sv === sorted[i].sv) j++;
      const pts = leaguePts(i);
      for (let k = i; k < j; k++) totals[sorted[k].uid] += pts;
      i = j;
    }
  });
  return users
    .map(u => ({ uid: u.uid, username: u.username, avatar: u.avatar ?? '👤', total: totals[u.uid] ?? 0 }))
    .sort((a, b) => b.total - a.total);
}
