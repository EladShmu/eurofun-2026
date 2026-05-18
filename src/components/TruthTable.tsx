import { useState } from 'react';
import { UserData, GlobalConfig } from '../types';
import { COUNTRY_MAP, flagUrl } from '../data/countries';

interface Props {
  globalConfig: GlobalConfig | null;
  userData: UserData;
}

function FlagSm({ isoCode, name }: { isoCode: string; name: string }) {
  return (
    <img src={flagUrl(isoCode)} className="flag-img-sm" alt={name}
      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
  );
}

export default function TruthTable({ globalConfig, userData }: Props) {
  const [showMyRanking, setShowMyRanking] = useState(true);

  const actualResults = globalConfig?.actualResults ?? [];
  const actualScores = globalConfig?.actualScores ?? {};

  const maxTotal = actualResults.reduce((max, id) => {
    const s = actualScores[id];
    const t = s ? (s.jury ?? 0) + (s.audience ?? 0) : 0;
    return Math.max(max, t);
  }, 0);

  return (
    <div className="truth-table-page">
      <div className="truth-table-header">
        <h2 className="section-title" style={{ margin: 0 }}>📋 טבלת אמת</h2>
        <button className="truth-toggle-btn" onClick={() => setShowMyRanking(v => !v)}>
          {showMyRanking ? '▲ הסתר דירוג שלי' : '▼ הצג דירוג שלי'}
        </button>
      </div>

      {!actualResults.length ? (
        <div className="game-placeholder">
          <p>⏳</p>
          <p className="hint-text">טבלת האמת תוצג לאחר שהאדמין יזין תוצאות</p>
        </div>
      ) : (
        <div className={`truth-table-content ${showMyRanking ? 'with-user' : ''}`}>
          {/* Actual results column */}
          <div className="truth-col">
            <div className="truth-col-header">🏆 תוצאות אמת</div>
            {actualResults.map((id, i) => {
              const c = COUNTRY_MAP[id];
              if (!c) return null;
              const score = actualScores[id];
              const total = score ? (score.jury ?? 0) + (score.audience ?? 0) : null;
              const barPct = (total && maxTotal > 0) ? (total / maxTotal) * 100 : 0;
              return (
                <div key={id} className="truth-row">
                  <span className="truth-rank">#{i + 1}</span>
                  <FlagSm isoCode={c.isoCode} name={c.name} />
                  <span className="truth-country">{c.name}</span>
                  {total != null && total > 0 && (
                    <div className="truth-bar-wrap">
                      <div className="truth-bar" style={{ width: `${barPct}%` }} />
                    </div>
                  )}
                  {total != null && total > 0 && <span className="truth-score">{total}</span>}
                </div>
              );
            })}
          </div>

          {/* User ranking column */}
          {showMyRanking && (
            <div className="truth-col">
              <div className="truth-col-header">📋 הדירוג שלי</div>
              {(userData.rankedList ?? []).length === 0 ? (
                <p className="hint-text" style={{ padding: '0.5rem' }}>עדיין לא דירגת מדינות</p>
              ) : (
                (userData.rankedList ?? []).map((rc, i) => {
                  const c = COUNTRY_MAP[rc.countryId];
                  if (!c) return null;
                  return (
                    <div key={rc.countryId} className="truth-row">
                      <span className="truth-rank">#{i + 1}</span>
                      <FlagSm isoCode={c.isoCode} name={c.name} />
                      <span className="truth-country">{c.name}</span>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
