import { useState } from 'react';
import { UserData, GroupData } from '../types';
import { COUNTRY_MAP, COUNTRIES, flagUrl } from '../data/countries';

const POINTS = [12, 10, 8, 7, 6, 5, 4, 3, 2, 1];

type ViewMode = 'top5' | 'top10' | 'top25';

interface Props {
  groupData: GroupData;
  memberDataMap: Record<string, UserData>;
  myUid: string;
}

function calcCollective(members: UserData[]) {
  const tally: Record<string, number> = {};
  COUNTRIES.forEach(c => { tally[c.id] = 0; });
  members.forEach(u => {
    (u.rankedList ?? []).slice(0, 10).forEach((rc, i) => {
      if (rc?.countryId && tally[rc.countryId] !== undefined) {
        tally[rc.countryId] += POINTS[i] ?? 0;
      }
    });
  });
  return COUNTRIES
    .filter(c => tally[c.id] > 0)
    .sort((a, b) => tally[b.id] - tally[a.id])
    .map(c => ({ countryId: c.id, pts: tally[c.id] }));
}

export default function LiveView({ groupData, memberDataMap, myUid }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>('top10');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function toggle(key: string) {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const members = groupData.members
    .map(uid => memberDataMap[uid])
    .filter(Boolean);

  const topN = viewMode === 'top5' ? 5 : viewMode === 'top10' ? 10 : 25;
  const collectiveRanking = calcCollective(members);

  if (members.length === 0) {
    return (
      <div className="liveview-page">
        <p className="empty-hint">ממתינים לחברים... 👀</p>
      </div>
    );
  }

  return (
    <div className="liveview-page">
      <div className="liveview-header">
        <p className="hint-text">{members.length} משתתפים • מתעדכן בזמן אמת</p>
        <div className="view-mode-toggle">
          {(['top5', 'top10', 'top25'] as const).map(m => (
            <button
              key={m}
              className={viewMode === m ? 'active' : ''}
              onClick={() => setViewMode(m)}
            >
              {m === 'top5' ? 'TOP 5' : m === 'top10' ? 'TOP 10' : 'TOP 25'}
            </button>
          ))}
        </div>
      </div>

      <div className="liveview-users">
        {members.map(u => {
          const isMe = u.uid === myUid;
          const isOpen = expanded.has(u.uid);
          const entries = (u.rankedList ?? []).slice(0, topN);
          return (
            <div key={u.uid} className={`liveview-user-card ${isMe ? 'me' : ''}`}>
              <div className="liveview-user-header liveview-toggle" onClick={() => toggle(u.uid)}>
                <span className="liveview-username">
                  <span className="liveview-avatar">{u.avatar ?? '👤'}</span>
                  {isMe && ' ⭐'} {u.username}
                </span>
                <span className="liveview-header-right">
                  <span className="liveview-count">{(u.rankedList ?? []).length} מדורגות</span>
                  <span className="liveview-arrow">{isOpen ? '▲' : '▼'}</span>
                </span>
              </div>

              {isOpen && (
                entries.length === 0 ? (
                  <p className="not-voted">עוד לא התחיל לדרג...</p>
                ) : (
                  <ol className="liveview-list">
                    {entries.map((rc, i) => {
                      const c = COUNTRY_MAP[rc.countryId];
                      if (!c) return null;
                      return (
                        <li key={rc.countryId} className="liveview-entry">
                          <span className="liveview-rank">#{i + 1}</span>
                          <img
                            src={flagUrl(c.isoCode)}
                            className="flag-img-sm"
                            alt={c.name}
                            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                          <span className="liveview-country">{c.name}</span>
                          {rc.description && (
                            <span className="liveview-desc">— {rc.description}</span>
                          )}
                          {i < POINTS.length && (
                            <span className="liveview-pts">+{POINTS[i]}</span>
                          )}
                        </li>
                      );
                    })}
                  </ol>
                )
              )}
            </div>
          );
        })}

        {/* Collective card — always last */}
        {collectiveRanking.length > 0 && (() => {
          const isOpen = expanded.has('collective');
          return (
            <div className="liveview-user-card collective">
              <div className="liveview-user-header liveview-toggle" onClick={() => toggle('collective')}>
                <span className="liveview-username">🌐 קולקטיבי</span>
                <span className="liveview-header-right">
                  <span className="liveview-count">סיכום קבוצה</span>
                  <span className="liveview-arrow">{isOpen ? '▲' : '▼'}</span>
                </span>
              </div>
              {isOpen && (
                <ol className="liveview-list">
                  {collectiveRanking.slice(0, topN).map((entry, i) => {
                    const c = COUNTRY_MAP[entry.countryId];
                    if (!c) return null;
                    return (
                      <li key={entry.countryId} className="liveview-entry">
                        <span className="liveview-rank">#{i + 1}</span>
                        <img
                          src={flagUrl(c.isoCode)}
                          className="flag-img-sm"
                          alt={c.name}
                          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                        <span className="liveview-country">{c.name}</span>
                        <span className="liveview-pts">{entry.pts} נק׳</span>
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
