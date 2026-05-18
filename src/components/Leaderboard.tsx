import { useState } from 'react';
import { UserData } from '../types';
import { COUNTRY_MAP, flagUrl } from '../data/countries';
import {
  leaguePts, calcLinear, calcSquared, calcBulls, calcTiers, calcLeague,
  buildGrandScores,
} from '../scoring';

type GameTab = 'linear' | 'squared' | 'bulls' | 'tiers' | 'league' | 'grand';

const GAME_TABS: { key: GameTab; label: string; title: string; desc: string }[] = [
  {
    key: 'linear',
    label: '📐 לא משקרת',
    title: 'הטבלה לא משקרת',
    desc: 'לכל מדינה שדירגת מחושב ההפרש המוחלט בין המיקום שנתת לה לבין המיקום האמיתי שלה. ניחשת מקום 3, יצאה מקום 7 → עונש 4. הציון הסופי הוא סכום כל ההפרשים — ככל שנמוך יותר, כך ניחשת טוב יותר. הנמוך ביותר מנצח.',
  },
  {
    key: 'squared',
    label: '💥 ריסוק',
    title: 'מבחן הריסוק',
    desc: 'כמו "לא משקרת" אבל כל הפרש מועלה בריבוע. הפרש של 2 = עונש 4, הפרש של 5 = עונש 25! טעות קטנה נסלחת, שגיאה גדולה אחת יכולה לרסק הכל. הנמוך ביותר מנצח.',
  },
  {
    key: 'bulls',
    label: '🎯 צלף',
    title: 'הצלף הכירורגי',
    desc: 'נקודות רק כשניחשת בדיוק את המיקום — לא קרוב, בדיוק! מקום 1 = 3 נק׳ | מקומות 2–10 ומקום אחרון (25) = 2 נק׳ | מקומות 11–24 = 1 נק׳. הגבוה ביותר מנצח.',
  },
  {
    key: 'tiers',
    label: '📊 טרנדים',
    title: 'צייד הטרנדים',
    desc: 'לא צריך לנחש מקום מדויק — מספיק לנחש את ה"סל" הנכון: שמת מדינה במקום 1–3 ושם היא גם גמרה → 3 נק׳ | שמת במקום 4–5 וגמרה בטופ 5 → 2 נק׳ | שמת במקום 6–10 וגמרה בטופ 10 → 1 נק׳ | שמת במקום 22–25 וגם גמרה שם → 1 נק׳. הגבוה ביותר מנצח.',
  },
  {
    key: 'league',
    label: '🏅 ליגה',
    title: 'אלוף הליגה',
    desc: 'ניקוד מדורג לפי הקרבה למיקום האמיתי: בול מקום 1 = 50 נק׳ | בול מקום 2–10 ואחרון (25) = 30 נק׳ | בול מקום 11–24 = 20 נק׳ | מרחק 1–2 מקומות = 10 נק׳ | מרחק 3–5 מקומות = 5 נק׳ | מרחק מעל 5 = 0. הגבוה ביותר מנצח.',
  },
  {
    key: 'grand',
    label: '🏆 אלוף',
    title: 'אלוף כל הטורנירים',
    desc: 'מדד-על שמשלב את כל 5 המשחקים! כל שחקן מקבל נקודות לפי מיקומו בכל משחק: מקום 1 = 8 נק׳ | מקום 2 = 5 נק׳ | מקום 3 = 3 נק׳ | מקום 4+ = 1 נק׳ | תיקו → אותו ניקוד לשניהם. סכום הנקודות מ-5 המשחקים קובע את האלוף. הגבוה ביותר מנצח.',
  },
];

const PLACE_ICONS = ['🏆', '🥈', '🥉'];

// ── Breakdown component ────────────────────────────────────────────────────────

interface GameRow { uid: string; username: string; avatar: string; sortValue: number; display: string; }

function FlagImg({ isoCode, name }: { isoCode: string; name: string }) {
  return (
    <img src={flagUrl(isoCode)} className="flag-img-xs" alt={name}
      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
  );
}

function GameBreakdown({ tab, user, actualResults, games }: {
  tab: GameTab;
  user: UserData;
  actualResults: string[];
  games: Record<string, GameRow[]>;
}) {
  const ur: Record<string, number> = {};
  (user.rankedList ?? []).forEach((rc, i) => { ur[rc.countryId] = i; });
  const n = actualResults.length;

  if (tab === 'grand') {
    const gameKeys: { key: string; label: string }[] = [
      { key: 'linear', label: 'לא משקרת' },
      { key: 'squared', label: 'ריסוק' },
      { key: 'bulls', label: 'צלף' },
      { key: 'tiers', label: 'טרנדים' },
      { key: 'league', label: 'ליגה' },
    ];
    return (
      <div className="breakdown">
        {gameKeys.map(({ key, label }) => {
          const lb = games[key];
          if (!lb) return null;
          const myRow = lb.find(r => r.uid === user.uid);
          if (!myRow) return null;
          const rank = lb.findIndex(r => r.sortValue === myRow.sortValue);
          const pts = leaguePts(rank);
          return (
            <div key={key} className="breakdown-row">
              <span className="breakdown-country">{label}</span>
              <span className="breakdown-pos">מקום #{rank + 1}</span>
              <span className="breakdown-diff good">+{pts} נק׳</span>
            </div>
          );
        })}
      </div>
    );
  }

  if (tab === 'linear' || tab === 'squared') {
    type Row = { id: string; c: NonNullable<typeof COUNTRY_MAP[string]>; userPos: number; actualPos: number; diff: number; sq: number };
    const rows: Row[] = actualResults
      .map((id, actualPos) => {
        const c = COUNTRY_MAP[id];
        if (!c || ur[id] === undefined) return null;
        const diff = Math.abs(ur[id] - actualPos);
        return { id, c, userPos: ur[id], actualPos, diff, sq: diff * diff };
      })
      .filter((r): r is Row => r !== null)
      .sort((a, b) => tab === 'squared' ? b.sq - a.sq : b.diff - a.diff);

    if (!rows.length) return <div className="breakdown"><p className="breakdown-empty">לא דורגו מדינות</p></div>;
    return (
      <div className="breakdown">
        {rows.map(r => {
          const val = tab === 'squared' ? r.sq : r.diff;
          return (
            <div key={r.id} className="breakdown-row">
              <FlagImg isoCode={r.c.isoCode} name={r.c.name} />
              <span className="breakdown-country">{r.c.name}</span>
              <span className="breakdown-pos">שמתי: #{r.userPos + 1} · יצא: #{r.actualPos + 1}</span>
              <span className={`breakdown-diff ${r.diff === 0 ? 'good' : (tab === 'squared' ? r.sq >= 25 : r.diff >= 5) ? 'bad' : ''}`}>
                {r.diff === 0 ? 'בדיוק!' : `מינוס ${val}`}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  if (tab === 'bulls') {
    type Hit = { id: string; c: NonNullable<typeof COUNTRY_MAP[string]>; pos: number; pts: number };
    const hits: Hit[] = actualResults
      .map((id, pos) => {
        const c = COUNTRY_MAP[id];
        if (!c || ur[id] !== pos) return null;
        let pts = 1;
        if (pos === 0) pts = 3;
        else if (pos < 10 || pos === n - 1) pts = 2;
        return { id, c, pos, pts };
      })
      .filter((r): r is Hit => r !== null);

    if (!hits.length) return <div className="breakdown"><p className="breakdown-empty">אין פגיעות מדויקות</p></div>;
    return (
      <div className="breakdown">
        {hits.map(h => (
          <div key={h.id} className="breakdown-row">
            <FlagImg isoCode={h.c.isoCode} name={h.c.name} />
            <span className="breakdown-country">{h.c.name}</span>
            <span className="breakdown-pos">מקום #{h.pos + 1}</span>
            <span className="breakdown-diff good">+{h.pts} נק׳</span>
          </div>
        ))}
      </div>
    );
  }

  if (tab === 'tiers') {
    const actualIdxMap: Record<string, number> = {};
    actualResults.forEach((id, i) => { actualIdxMap[id] = i; });
    type TRow = { id: string; c: NonNullable<typeof COUNTRY_MAP[string]>; userIdx: number; actualIdx: number; pts: number; bucket: string };
    const rows: TRow[] = (user.rankedList ?? [])
      .map((rc, userIdx) => {
        const ai = actualIdxMap[rc.countryId];
        const c = COUNTRY_MAP[rc.countryId];
        if (ai === undefined || !c) return null;
        let pts = 0, bucket = '';
        if (userIdx <= 2) {
          if (ai <= 2) { pts = 3; bucket = 'טופ 3 → טופ 3'; }
        } else if (userIdx <= 4) {
          if (ai <= 4) { pts = 2; bucket = 'מקום 4–5 → טופ 5'; }
        } else if (userIdx <= 9) {
          if (ai <= 9) { pts = 1; bucket = 'טופ 10 → טופ 10'; }
        } else if (userIdx >= 21) {
          if (ai >= 21) { pts = 1; bucket = '5 אחרונות'; }
        }
        if (!pts) return null;
        return { id: rc.countryId, c, userIdx, actualIdx: ai, pts, bucket };
      })
      .filter((r): r is TRow => r !== null)
      .sort((a, b) => b.pts - a.pts);

    if (!rows.length) return <div className="breakdown"><p className="breakdown-empty">אין נקודות טרנדים</p></div>;
    return (
      <div className="breakdown">
        {rows.map(r => (
          <div key={r.id} className="breakdown-row">
            <FlagImg isoCode={r.c.isoCode} name={r.c.name} />
            <span className="breakdown-country">{r.c.name}</span>
            <span className="breakdown-pos">שמתי: #{r.userIdx + 1} · יצא: #{r.actualIdx + 1} · {r.bucket}</span>
            <span className="breakdown-diff good">+{r.pts} נק׳</span>
          </div>
        ))}
      </div>
    );
  }

  if (tab === 'league') {
    type LRow = { id: string; c: NonNullable<typeof COUNTRY_MAP[string]>; pts: number; reason: string; userPos: number; actualPos: number };
    const rows: LRow[] = actualResults
      .map((id, actualPos) => {
        const c = COUNTRY_MAP[id];
        if (!c || ur[id] === undefined) return null;
        const d = Math.abs(ur[id] - actualPos);
        let pts = 0, reason = '';
        if (d === 0) {
          if (actualPos === 0) { pts = 50; reason = 'בול! מקום 1'; }
          else if (actualPos < 10 || actualPos === n - 1) { pts = 30; reason = 'בול!'; }
          else { pts = 20; reason = 'בול!'; }
        } else if (d <= 2) { pts = 10; reason = `מרחק ${d}`; }
        else if (d <= 5) { pts = 5; reason = `מרחק ${d}`; }
        if (!pts) return null;
        return { id, c, pts, reason, userPos: ur[id], actualPos };
      })
      .filter((r): r is LRow => r !== null)
      .sort((a, b) => b.pts - a.pts);

    if (!rows.length) return <div className="breakdown"><p className="breakdown-empty">אין נקודות</p></div>;
    return (
      <div className="breakdown">
        {rows.map(r => (
          <div key={r.id} className="breakdown-row">
            <FlagImg isoCode={r.c.isoCode} name={r.c.name} />
            <span className="breakdown-country">{r.c.name}</span>
            <span className="breakdown-pos">שמתי: #{r.userPos + 1} · יצא: #{r.actualPos + 1} · {r.reason}</span>
            <span className="breakdown-diff good">+{r.pts} נק׳</span>
          </div>
        ))}
      </div>
    );
  }

  return null;
}

// ── Main component ─────────────────────────────────────────────────────────────

interface Props {
  memberDataMap: Record<string, UserData>;
  myUid: string;
  actualResults: string[];
}

export default function Leaderboard({ memberDataMap, myUid, actualResults }: Props) {
  const [gameTab, setGameTab] = useState<GameTab>('linear');
  const [descOpen, setDescOpen] = useState(true);
  const [expandedUids, setExpandedUids] = useState<Set<string>>(new Set());

  function handleTabChange(key: GameTab) {
    setGameTab(key);
    setDescOpen(true);
    setExpandedUids(new Set());
  }

  function toggleExpanded(uid: string) {
    setExpandedUids(prev => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid);
      else next.add(uid);
      return next;
    });
  }

  const users = Object.values(memberDataMap);
  const votedCount = users.filter(u => (u.rankedList?.length ?? 0) >= 10).length;

  function buildGame(tab: Exclude<GameTab, 'grand'>): GameRow[] {
    const rows = users.map(u => {
      let sortValue: number;
      let display: string;
      if (tab === 'linear') {
        const v = calcLinear(u, actualResults);
        sortValue = -v; display = `${v} הפרש`;
      } else if (tab === 'squared') {
        const v = calcSquared(u, actualResults);
        sortValue = -v; display = `${v} ריבועים`;
      } else if (tab === 'bulls') {
        const v = calcBulls(u, actualResults);
        sortValue = v; display = `${v} נק׳`;
      } else if (tab === 'tiers') {
        const v = calcTiers(u, actualResults);
        sortValue = v; display = `${v} נק׳`;
      } else {
        const v = calcLeague(u, actualResults);
        sortValue = v; display = `${v} נק׳`;
      }
      return { uid: u.uid, username: u.username, avatar: u.avatar ?? '👤', sortValue, display };
    });
    return rows.sort((a, b) => b.sortValue - a.sortValue);
  }

  const games = {
    linear:  buildGame('linear'),
    squared: buildGame('squared'),
    bulls:   buildGame('bulls'),
    tiers:   buildGame('tiers'),
    league:  buildGame('league'),
  };

  // Grand total with tie handling
  const grandTotals: Record<string, number> = {};
  users.forEach(u => { grandTotals[u.uid] = 0; });
  (Object.values(games) as GameRow[][]).forEach(leaderboard => {
    let i = 0;
    while (i < leaderboard.length) {
      let j = i + 1;
      while (j < leaderboard.length && leaderboard[j].sortValue === leaderboard[i].sortValue) j++;
      const pts = leaguePts(i);
      for (let k = i; k < j; k++) grandTotals[leaderboard[k].uid] = (grandTotals[leaderboard[k].uid] ?? 0) + pts;
      i = j;
    }
  });

  const grandLeaderboard: GameRow[] = [...users]
    .map(u => ({
      uid: u.uid, username: u.username, avatar: u.avatar ?? '👤',
      sortValue: grandTotals[u.uid] ?? 0,
      display: `${grandTotals[u.uid] ?? 0} נק׳`,
    }))
    .sort((a, b) => b.sortValue - a.sortValue);

  const currentLeaderboard = gameTab === 'grand' ? grandLeaderboard : games[gameTab as keyof typeof games];
  const currentGame = GAME_TABS.find(g => g.key === gameTab)!;

  // Use buildGrandScores to suppress unused-import warning
  void buildGrandScores;

  return (
    <div className="leaderboard-page">
      <p className="hint-text">{users.length} משתתפים • {votedCount} דירגו 10+</p>

      <div className="game-tabs-row">
        {GAME_TABS.map(g => (
          <button key={g.key} className={`game-tab-btn ${gameTab === g.key ? 'active' : ''}`} onClick={() => handleTabChange(g.key)}>
            {g.label}
          </button>
        ))}
      </div>

      <div className="game-info">
        <div className="game-info-header">
          <span className="game-title">{currentGame.title}</span>
          <button className={`game-desc-toggle ${descOpen ? 'open' : ''}`} onClick={() => setDescOpen(v => !v)}>
            {descOpen ? '✕' : 'ℹ️'}
          </button>
        </div>
        {descOpen && <p className="game-desc">{currentGame.desc}</p>}
      </div>

      {!actualResults.length ? (
        <div className="game-placeholder">
          <p>⏳</p>
          <p className="hint-text">ממתינים לתוצאות Eurovision האמיתיות...</p>
        </div>
      ) : (
        <div className="game-leaderboard">
          {currentLeaderboard.map((entry, i) => {
            const isExpanded = expandedUids.has(entry.uid);
            const userData = memberDataMap[entry.uid];
            return (
              <div key={entry.uid}>
                <div
                  className={`game-row ${entry.uid === myUid ? 'me' : ''} ${isExpanded ? 'expanded' : ''}`}
                  onClick={() => toggleExpanded(entry.uid)}
                >
                  <span className="game-place-icon">{i < PLACE_ICONS.length ? PLACE_ICONS[i] : '💩'}</span>
                  <span className="game-avatar">{entry.avatar}</span>
                  <span className="game-username">{entry.uid === myUid ? '⭐ ' : ''}{entry.username}</span>
                  <span className="game-score">{entry.display}</span>
                  <span className="game-row-arrow">{isExpanded ? '▲' : '▼'}</span>
                </div>
                {isExpanded && userData && (
                  <GameBreakdown tab={gameTab} user={userData} actualResults={actualResults} games={games} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
