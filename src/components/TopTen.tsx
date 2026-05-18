import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { UserData, GroupData } from '../types';
import { COUNTRY_MAP, COUNTRIES, flagUrl } from '../data/countries';

const POINTS = [12, 10, 8, 7, 6, 5, 4, 3, 2, 1];
const MEDALS = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

interface Props {
  userData: UserData;
}

function calcCollective(memberDataMap: Record<string, UserData>) {
  const tally: Record<string, number> = {};
  COUNTRIES.forEach(c => { tally[c.id] = 0; });
  Object.values(memberDataMap).forEach(u => {
    (u.rankedList ?? []).slice(0, 10).forEach((rc, i) => {
      if (rc?.countryId && tally[rc.countryId] !== undefined) {
        tally[rc.countryId] += POINTS[i] ?? 0;
      }
    });
  });
  return tally;
}

function CollectiveList({ memberDataMap }: { memberDataMap: Record<string, UserData> }) {
  const tally = calcCollective(memberDataMap);
  const top10 = COUNTRIES
    .filter(c => tally[c.id] > 0)
    .sort((a, b) => tally[b.id] - tally[a.id])
    .slice(0, 10);

  if (top10.length === 0) {
    return <p className="hint-text">אין מספיק דירוגים עדיין</p>;
  }

  return (
    <div className="topten-list">
      {top10.map((c, i) => (
        <div key={c.id} className="topten-row">
          <span className="medal">{MEDALS[i]}</span>
          <img src={flagUrl(c.isoCode)} className="flag-img" alt={c.name}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          <span className="country-name">{c.name}</span>
          <span className="topten-pts">{tally[c.id]} נק׳</span>
        </div>
      ))}
    </div>
  );
}

function CollectiveCombined({ allMembers }: { allMembers: Record<string, UserData> }) {
  const tally = calcCollective(allMembers);
  const top10 = COUNTRIES
    .filter(c => tally[c.id] > 0)
    .sort((a, b) => tally[b.id] - tally[a.id])
    .slice(0, 10);

  if (top10.length === 0) {
    return <p className="hint-text">אין מספיק דירוגים עדיין</p>;
  }

  return (
    <div className="topten-list">
      {top10.map((c, i) => (
        <div key={c.id} className="topten-row">
          <span className="medal">{MEDALS[i]}</span>
          <img src={flagUrl(c.isoCode)} className="flag-img" alt={c.name}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          <span className="country-name">{c.name}</span>
          <span className="topten-pts">{tally[c.id]} נק׳</span>
        </div>
      ))}
    </div>
  );
}

function Accordion({ title, children, memberCount }: { title: string; children: React.ReactNode; memberCount?: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="accordion">
      <button className="accordion-header" onClick={() => setOpen(o => !o)}>
        <span className="accordion-title">{title}</span>
        {memberCount !== undefined && <span className="accordion-meta">{memberCount} משתתפים</span>}
        <span className="accordion-arrow">{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="accordion-body">{children}</div>}
    </div>
  );
}

export default function TopTen({ userData }: Props) {
  const top10 = userData.rankedList.slice(0, 10);
  const missing = 10 - top10.length;

  // Load all groups' member data
  const [groupsData, setGroupsData] = useState<
    { code: string; name: string; members: Record<string, UserData> }[]
  >([]);

  useEffect(() => {
    if (!userData.groups.length) return;
    Promise.all(
      userData.groups.map(async code => {
        const groupSnap = await getDoc(doc(db, 'groups', code));
        if (!groupSnap.exists()) return null;
        const gd = groupSnap.data() as GroupData;
        const memberSnaps = await Promise.all(
          gd.members.map(uid => getDoc(doc(db, 'users', uid)))
        );
        const members: Record<string, UserData> = {};
        memberSnaps.forEach(s => { if (s.exists()) members[s.id] = s.data() as UserData; });
        return { code, name: gd.name, members };
      })
    ).then(results => {
      setGroupsData(results.filter(Boolean) as typeof groupsData);
    });
  }, [userData.groups.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  // All unique members across all groups (for combined)
  const allMembers: Record<string, UserData> = {};
  groupsData.forEach(g => Object.assign(allMembers, g.members));

  return (
    <div className="topten-page">
      <h2 className="section-title">🏆 הטופ 10 שלי</h2>
      <p className="hint-text">
        נגזר אוטומטית מהדירוג שלך — הסדר נקבע בלשונית "דירוג"
      </p>

      {missing > 0 && (
        <div className="topten-warning">
          עוד {missing} מדינות לדרג כדי להשלים את הטופ 10
        </div>
      )}

      <div className="topten-list">
        {top10.map((rc, i) => {
          const c = COUNTRY_MAP[rc.countryId];
          return (
            <div key={rc.countryId} className="topten-row">
              <span className="medal">{MEDALS[i]}</span>
              <img
                src={flagUrl(c.isoCode)}
                className="flag-img"
                alt={c.name}
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              <span className="country-name">{c.name}</span>
              <div className="topten-scores">
                {rc.personalScore !== null && (
                  <span className="score-chip personal" title="דירוג אישי">⭐{rc.personalScore}</span>
                )}
                {rc.audienceScore !== null && (
                  <span className="score-chip audience" title="הקהל יאהב">👥{rc.audienceScore}</span>
                )}
                {rc.judgeScore !== null && rc.judgeScore !== undefined && (
                  <span className="score-chip judge" title="השופטים יאהבו">⚖️{rc.judgeScore}</span>
                )}
              </div>
              <span className="topten-pts">{POINTS[i]} נק׳</span>
            </div>
          );
        })}
      </div>

      {top10.length === 10 && (
        <div className="topten-total">
          <span>סה״כ מקסימום שלך: {POINTS.reduce((a, b) => a + b, 0)} נקודות</span>
        </div>
      )}

      {/* Group collective summaries — collapsible */}
      {groupsData.length > 0 && (
        <section className="group-collective-section">
          <h3 className="section-title" style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>🗳️ סיכום קבוצתי</h3>

          {groupsData.map(g => (
            <Accordion
              key={g.code}
              title={g.name}
              memberCount={Object.keys(g.members).length}
            >
              <CollectiveList memberDataMap={g.members} />
            </Accordion>
          ))}

          {groupsData.length > 1 && (
            <Accordion title="🌐 סיכום כל הקבוצות יחד">
              <CollectiveCombined allMembers={allMembers} />
            </Accordion>
          )}
        </section>
      )}
    </div>
  );
}
