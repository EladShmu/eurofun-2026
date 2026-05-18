import { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { UserData, GlobalConfig, CountryScore } from '../types';
import { COUNTRIES, COUNTRY_MAP, flagUrl } from '../data/countries';
import { buildGrandScores } from '../scoring';

type AdminTab = 'players' | 'ranking' | 'freeze' | 'results';

interface Props {
  globalConfig: GlobalConfig | null;
}

// Eurovision 2026 Grand Final — official results (jury + televote breakdown)
const ESC2026_RESULTS: { id: string; jury: number; audience: number }[] = [
  { id: 'bulgaria',  jury: 204, audience: 312 },
  { id: 'israel',    jury: 123, audience: 220 },
  { id: 'romania',   jury:  64, audience: 232 },
  { id: 'australia', jury: 165, audience: 122 },
  { id: 'italy',     jury: 134, audience: 147 },
  { id: 'finland',   jury: 141, audience: 138 },
  { id: 'denmark',   jury: 165, audience:  78 },
  { id: 'moldova',   jury:  43, audience: 183 },
  { id: 'ukraine',   jury:  54, audience: 167 },
  { id: 'greece',    jury:  73, audience: 147 },
  { id: 'france',    jury: 144, audience:  14 },
  { id: 'poland',    jury: 133, audience:  17 },
  { id: 'albania',   jury:  60, audience:  85 },
  { id: 'norway',    jury: 115, audience:  19 },
  { id: 'croatia',   jury:  53, audience:  71 },
  { id: 'czechia',   jury: 104, audience:   9 },
  { id: 'serbia',    jury:  38, audience:  52 },
  { id: 'malta',     jury:  81, audience:   8 },
  { id: 'cyprus',    jury:  41, audience:  34 },
  { id: 'sweden',    jury:  35, audience:  16 },
  { id: 'belgium',   jury:  36, audience:   0 },
  { id: 'lithuania', jury:  10, audience:  12 },
  { id: 'germany',   jury:  12, audience:   0 },
  { id: 'austria',   jury:   1, audience:   5 },
  { id: 'uk',        jury:   1, audience:   0 },
];

const AUTO_RESULT_SOURCES = [
  { id: 'eurovisionworld', label: 'Eurovisionworld', url: 'https://eurovisionworld.com/eurovision/2026' },
  { id: 'wikipedia', label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Eurovision_Song_Contest_2026' },
  { id: 'google', label: 'Google', url: 'https://www.google.com/search?q=Eurovision+2026+results' },
];

// ── Main component ────────────────────────────────────────────────────────────

export default function AdminPage({ globalConfig }: Props) {
  const [tab, setTab] = useState<AdminTab>('players');
  const [allUsers, setAllUsers] = useState<UserData[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [savingAuto, setSavingAuto] = useState(false);

  const [scoreInput, setScoreInput] = useState<Record<string, { jury: string; audience: string }>>(() => {
    const init: Record<string, { jury: string; audience: string }> = {};
    COUNTRIES.forEach(c => {
      const ex = globalConfig?.actualScores?.[c.id];
      init[c.id] = {
        jury: ex?.jury !== undefined ? String(ex.jury) : '',
        audience: ex?.audience !== undefined ? String(ex.audience) : '',
      };
    });
    return init;
  });

  // Load users when visiting players or ranking tab
  useEffect(() => {
    if (tab !== 'players' && tab !== 'ranking') return;
    if (allUsers.length > 0) return;
    setLoadingUsers(true);
    getDocs(collection(db, 'users')).then(snap => {
      const users = snap.docs.map(d => d.data() as UserData);
      users.sort((a, b) => (b.rankedList?.length ?? 0) - (a.rankedList?.length ?? 0));
      setAllUsers(users);
      setLoadingUsers(false);
    });
  }, [tab]);

  useEffect(() => {
    const next: Record<string, { jury: string; audience: string }> = {};
    COUNTRIES.forEach(c => {
      const ex = globalConfig?.actualScores?.[c.id];
      next[c.id] = {
        jury: ex?.jury !== undefined ? String(ex.jury) : '',
        audience: ex?.audience !== undefined ? String(ex.audience) : '',
      };
    });
    setScoreInput(next);
  }, [globalConfig?.actualScores]);

  function toggle(uid: string) {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid);
      else next.add(uid);
      return next;
    });
  }

  async function toggleFreeze() {
    const next = !(globalConfig?.rankingFrozen ?? false);
    await setDoc(doc(db, 'config', 'main'), { rankingFrozen: next }, { merge: true });
  }

  async function toggleAutoResults() {
    setSavingAuto(true);
    try {
      const next = !(globalConfig?.autoResultsEnabled ?? false);
      await setDoc(doc(db, 'config', 'main'), {
        autoResultsEnabled: next,
        autoResultsSources: globalConfig?.autoResultsSources?.length
          ? globalConfig.autoResultsSources
          : AUTO_RESULT_SOURCES.map(s => s.id),
        autoResultsStatus: next ? 'idle' : 'idle',
      }, { merge: true });
    } finally {
      setSavingAuto(false);
    }
  }

  async function setAutoSource(sourceId: string, checked: boolean) {
    const current = globalConfig?.autoResultsSources?.length
      ? globalConfig.autoResultsSources
      : AUTO_RESULT_SOURCES.map(s => s.id);
    const next = checked
      ? Array.from(new Set([...current, sourceId]))
      : current.filter(id => id !== sourceId);
    await setDoc(doc(db, 'config', 'main'), { autoResultsSources: next }, { merge: true });
  }

  async function requestAutoRefresh() {
    setSavingAuto(true);
    try {
      await setDoc(doc(db, 'config', 'main'), {
        autoResultsEnabled: true,
        autoResultsSources: globalConfig?.autoResultsSources?.length
          ? globalConfig.autoResultsSources
          : AUTO_RESULT_SOURCES.map(s => s.id),
        autoResultsStatus: 'requested',
        autoResultsLastRequestedAt: Date.now(),
        autoResultsError: '',
      }, { merge: true });
    } finally {
      setSavingAuto(false);
    }
  }

  function getTotal(id: string) {
    const s = scoreInput[id];
    return (parseFloat(s.jury) || 0) + (parseFloat(s.audience) || 0);
  }

  function hasScoreInput(id: string) {
    const s = scoreInput[id];
    return s.jury.trim() !== '' || s.audience.trim() !== '';
  }

  function fillFromResults() {
    const next: Record<string, { jury: string; audience: string }> = {};
    COUNTRIES.forEach(c => { next[c.id] = { jury: '', audience: '' }; });
    ESC2026_RESULTS.forEach(r => { next[r.id] = { jury: String(r.jury), audience: String(r.audience) }; });
    setScoreInput(next);
  }

  function fillRandom() {
    const init: Record<string, { jury: string; audience: string }> = {};
    COUNTRIES.forEach(c => {
      init[c.id] = {
        jury: String(Math.floor(Math.random() * 400)),
        audience: String(Math.floor(Math.random() * 400)),
      };
    });
    setScoreInput(init);
  }

  async function clearAndResetResults() {
    if (!window.confirm('למחוק את כל התוצאות השמורות?')) return;
    setSaving(true);
    try {
      await setDoc(doc(db, 'config', 'main'), {
        actualResults: [],
        actualScores: {},
      }, { merge: true });
    } finally {
      setSaving(false);
    }
  }

  async function saveResults() {
    setSaving(true);
    try {
      const ranked = COUNTRIES
        .map(c => ({ id: c.id, total: getTotal(c.id) }))
        .filter(c => c.total > 0)
        .sort((a, b) => b.total - a.total);
      const scores: Record<string, CountryScore> = {};
      COUNTRIES.forEach(c => {
        const juryValue = scoreInput[c.id].jury.trim();
        const audienceValue = scoreInput[c.id].audience.trim();
        const j = parseFloat(juryValue);
        const a = parseFloat(audienceValue);
        if (juryValue !== '' || audienceValue !== '') {
          scores[c.id] = {};
          if (juryValue !== '' && !isNaN(j)) scores[c.id].jury = j;
          if (audienceValue !== '' && !isNaN(a)) scores[c.id].audience = a;
        }
      });
      await setDoc(doc(db, 'config', 'main'), {
        actualResults: ranked.map(c => c.id),
        actualScores: scores,
      }, { merge: true });
    } finally {
      setSaving(false);
    }
  }

  const frozen = globalConfig?.rankingFrozen ?? false;
  const actualResults = globalConfig?.actualResults ?? [];
  const hasEnteredScores = COUNTRIES.some(c => hasScoreInput(c.id));
  const hasSavedScores = actualResults.length > 0 || Object.keys(globalConfig?.actualScores ?? {}).length > 0;
  const saveDisabled = saving || (!hasEnteredScores && !hasSavedScores);
  const grandScores = buildGrandScores(allUsers, actualResults);
  const PLACE_ICONS = ['🏆', '🥈', '🥉'];
  const autoEnabled = globalConfig?.autoResultsEnabled ?? false;
  const autoSources = globalConfig?.autoResultsSources?.length
    ? globalConfig.autoResultsSources
    : AUTO_RESULT_SOURCES.map(s => s.id);
  const autoStatus = globalConfig?.autoResultsStatus ?? 'idle';

  return (
    <div className="admin-page">
      <h2 className="admin-title">⚙️ פאנל אדמין</h2>

      <div className="lb-tabs admin-tabs">
        <button className={tab === 'players' ? 'active' : ''} onClick={() => setTab('players')}>📊 שחקנים</button>
        <button className={tab === 'ranking' ? 'active' : ''} onClick={() => setTab('ranking')}>🏆 ניקוד</button>
        <button className={tab === 'freeze' ? 'active' : ''} onClick={() => setTab('freeze')}>
          {frozen ? '🔒 קפוא' : '🔓 פתוח'}
        </button>
        <button className={tab === 'results' ? 'active' : ''} onClick={() => setTab('results')}>📋 תוצאות</button>
      </div>

      {/* ── Players ── */}
      {tab === 'players' && (
        <div className="admin-section">
          {loadingUsers ? (
            <p className="hint-text">טוען שחקנים...</p>
          ) : (
            <>
              <p className="hint-text">{allUsers.length} שחקנים רשומים</p>
              {allUsers.map(u => {
                const isOpen = expanded.has(u.uid);
                return (
                  <div key={u.uid} className="admin-player-card">
                    <div className="liveview-user-header liveview-toggle" onClick={() => toggle(u.uid)}>
                      <span className="liveview-username">
                        <span className="liveview-avatar">{u.avatar ?? '👤'}</span>
                        {u.username}
                      </span>
                      <span className="liveview-header-right">
                        <span className="liveview-count">{(u.rankedList ?? []).length} מדורגות</span>
                        <span className="liveview-arrow">{isOpen ? '▲' : '▼'}</span>
                      </span>
                    </div>
                    {isOpen && (
                      <ol className="liveview-list" style={{ marginTop: '0.5rem' }}>
                        {(u.rankedList ?? []).slice(0, 10).map((rc, i) => {
                          const c = COUNTRY_MAP[rc.countryId];
                          if (!c) return null;
                          return (
                            <li key={rc.countryId} className="liveview-entry">
                              <span className="liveview-rank">#{i + 1}</span>
                              <img src={flagUrl(c.isoCode)} className="flag-img-sm" alt={c.name}
                                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                              <span className="liveview-country">{c.name}</span>
                            </li>
                          );
                        })}
                      </ol>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}

      {/* ── Ranking ── */}
      {tab === 'ranking' && (
        <div className="admin-section">
          {loadingUsers ? (
            <p className="hint-text">טוען שחקנים...</p>
          ) : !actualResults.length ? (
            <div className="game-placeholder">
              <p>⏳</p>
              <p className="hint-text">הזן תוצאות אמת קודם כדי לחשב ניקוד</p>
            </div>
          ) : (
            <>
              <p className="hint-text">{allUsers.length} שחקנים • ניקוד F1 מ-5 משחקים (10/7/5/3/1)</p>
              <div className="game-leaderboard">
                {grandScores.map((entry, i) => (
                  <div key={entry.uid} className="game-row">
                    <span className="game-place-icon">{i < PLACE_ICONS.length ? PLACE_ICONS[i] : ''}</span>
                    <span className="game-rank-num">#{i + 1}</span>
                    <span className="game-avatar">{entry.avatar}</span>
                    <span className="game-username">{entry.username}</span>
                    <span className="game-score">{entry.total} נק׳</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Freeze ── */}
      {tab === 'freeze' && (
        <div className="admin-section">
          <div className={`freeze-status ${frozen ? 'frozen' : 'open'}`}>
            {frozen
              ? '🔒 דירוגים קפואים — משתמשים לא יכולים לערוך'
              : '🔓 דירוגים פתוחים — כולם יכולים לערוך'}
          </div>
          <button className={`freeze-btn ${frozen ? 'frozen' : 'open'}`} onClick={toggleFreeze}>
            {frozen ? '🔓 הפשר דירוגים' : '🔒 הקפא דירוגים'}
          </button>
        </div>
      )}

      {/* ── Results ── */}
      {tab === 'results' && (
        <div className="admin-section">
          <div className={`auto-results-panel ${autoEnabled ? 'enabled' : ''}`}>
            <div className="auto-results-main">
              <div>
                <h3>עדכון תוצאות אוטומטי</h3>
                <p className="hint-text">
                  ההגדרה נשמרת בענן ומיועדת ל-Cloud Function שתמשוך תוצאות מהמקורות המאושרים. הזנה ידנית נשארת זמינה תמיד.
                </p>
              </div>
              <button
                type="button"
                className={`switch-btn ${autoEnabled ? 'on' : ''}`}
                onClick={toggleAutoResults}
                disabled={savingAuto}
                aria-pressed={autoEnabled}
              >
                <span />
              </button>
            </div>

            <div className="auto-source-list">
              {AUTO_RESULT_SOURCES.map(source => (
                <label key={source.id} className="auto-source-item">
                  <input
                    type="checkbox"
                    checked={autoSources.includes(source.id)}
                    onChange={e => setAutoSource(source.id, e.target.checked)}
                  />
                  <span>{source.label}</span>
                  <a href={source.url} target="_blank" rel="noreferrer">פתח</a>
                </label>
              ))}
            </div>

            <div className="auto-results-footer">
              <span className={`auto-status ${autoStatus}`}>סטטוס: {autoStatus}</span>
              {globalConfig?.autoResultsLastRequestedAt && (
                <span className="hint-text">
                  בקשה אחרונה: {new Date(globalConfig.autoResultsLastRequestedAt).toLocaleString('he-IL')}
                </span>
              )}
              <button className="group-btn secondary" onClick={requestAutoRefresh} disabled={savingAuto}>
                {savingAuto ? '...' : 'בקש רענון אוטומטי'}
              </button>
            </div>
          </div>

          <div className="score-action-row">
            <button className="group-btn secondary" onClick={fillFromResults}>📥 תוצאות 2026</button>
            <button className="group-btn secondary" onClick={fillRandom}>🎲 מלא אקראי</button>
            <button className="group-btn secondary" onClick={clearAndResetResults} disabled={saving}>🗑️ נקה הכל</button>
          </div>

          <div className="score-input-table">
            <p className="hint-text">הזן ציוני שופטים ו/או קהל — יסודרו אוטומטית לפי סה"כ בשמירה</p>
            <div className="score-table-header">
              <span>מדינה</span><span>שופטים</span><span>קהל</span><span>סה"כ</span>
            </div>
            {[...COUNTRIES].sort((a, b) => getTotal(b.id) - getTotal(a.id) || a.name.localeCompare(b.name, 'he')).map(c => {
              const total = getTotal(c.id);
              const hasInput = hasScoreInput(c.id);
              return (
                <div key={c.id} className={`score-table-row ${hasInput ? 'has-score' : ''}`}>
                  <span className="score-country-name">
                    <img src={flagUrl(c.isoCode)} className="flag-img-sm" alt={c.name}
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    {c.name}
                  </span>
                  <input type="number" className="score-num-input" min="0" placeholder="—"
                    value={scoreInput[c.id].jury}
                    onChange={e => setScoreInput(prev => ({ ...prev, [c.id]: { ...prev[c.id], jury: e.target.value } }))} />
                  <input type="number" className="score-num-input" min="0" placeholder="—"
                    value={scoreInput[c.id].audience}
                    onChange={e => setScoreInput(prev => ({ ...prev, [c.id]: { ...prev[c.id], audience: e.target.value } }))} />
                  <span className={`score-total ${hasInput ? 'active' : ''}`}>{hasInput ? total : '—'}</span>
                </div>
              );
            })}
          </div>

          <button className="group-btn primary" style={{ marginTop: '1rem' }}
            onClick={saveResults} disabled={saveDisabled}>
            {saving ? '...' : '💾 שמור תוצאות'}
          </button>

          {actualResults.length > 0 && (
            <div className="admin-current-results">
              <p className="hint-text">תוצאות שמורות ({actualResults.length} מדינות) — טופ 10:</p>
              <ol className="liveview-list">
                {actualResults.slice(0, 10).map((id, i) => {
                  const c = COUNTRY_MAP[id];
                  if (!c) return null;
                  return (
                    <li key={id} className="liveview-entry">
                      <span className="liveview-rank">#{i + 1}</span>
                      <img src={flagUrl(c.isoCode)} className="flag-img-sm" alt={c.name}
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      <span className="liveview-country">{c.name}</span>
                    </li>
                  );
                })}
              </ol>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
