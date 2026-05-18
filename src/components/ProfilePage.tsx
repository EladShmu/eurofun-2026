import { useState, useEffect } from 'react';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { UserData, GroupData } from '../types';
import { buildGrandScores } from '../scoring';

const ANIMALS = ['🦁', '🐻', '🦊', '🐺', '🐸', '🦋', '🐧', '🐙', '🦄', '🐬', '🦅', '🐼', '🦝', '🐨', '🦩', '🦒', '🦓', '🐘', '🦘', '🦔'];

const TROPHY_ICONS = ['🏆', '🥈', '🥉'];

interface Trophy {
  groupName: string;
  groupCode: string;
  rank: number;
}

interface Props {
  userData: UserData;
  actualResults: string[];
  onAvatarUpdate: (emoji: string) => void;
  onNavigateAbout: () => void;
}

export default function ProfilePage({ userData, actualResults, onAvatarUpdate, onNavigateAbout }: Props) {
  const [picking, setPicking] = useState(false);
  const [trophies, setTrophies] = useState<Trophy[]>([]);
  const [loadingTrophies, setLoadingTrophies] = useState(false);

  useEffect(() => {
    if (!actualResults.length || !userData.groups.length) return;
    setLoadingTrophies(true);

    const fetchTrophies = async () => {
      const result: Trophy[] = [];
      for (const code of userData.groups) {
        const groupSnap = await getDoc(doc(db, 'groups', code));
        if (!groupSnap.exists()) continue;
        const groupData = groupSnap.data() as GroupData;

        const memberDocs = await Promise.all(
          groupData.members.map(uid => getDoc(doc(db, 'users', uid)))
        );
        const members = memberDocs.filter(d => d.exists()).map(d => d.data() as UserData);

        const scores = buildGrandScores(members, actualResults);
        const myIdx = scores.findIndex(s => s.uid === userData.uid);
        if (myIdx >= 0 && myIdx < 3) {
          result.push({ groupName: groupData.name, groupCode: code, rank: myIdx + 1 });
        }
      }
      setTrophies(result);
      setLoadingTrophies(false);
    };

    fetchTrophies();
  }, [userData.groups.join(','), actualResults.join(',')]);  // eslint-disable-line react-hooks/exhaustive-deps

  async function pickAnimal(emoji: string) {
    await updateDoc(doc(db, 'users', userData.uid), { avatar: emoji });
    onAvatarUpdate(emoji);
    setPicking(false);
  }

  return (
    <div className="profile-page">
      <div className="profile-avatar-wrap large">
        <span className="profile-avatar-emoji">{userData.avatar ?? '👤'}</span>
      </div>

      <h2 className="profile-username">{userData.username}</h2>

      <div className="profile-stats">
        <span className="profile-stat">{userData.rankedList.length} מדינות מדורגות</span>
        <span className="profile-stat-sep">·</span>
        <span className="profile-stat">{userData.groups.length} קבוצות</span>
      </div>

      <button className="profile-upload-btn" onClick={() => setPicking(p => !p)}>
        {picking ? '✕ סגור' : '🐾 שנה חיה'}
      </button>

      {picking && (
        <div className="animal-picker">
          {ANIMALS.map(a => (
            <button
              key={a}
              className={`animal-btn ${userData.avatar === a ? 'active' : ''}`}
              onClick={() => pickAnimal(a)}
            >
              {a}
            </button>
          ))}
        </div>
      )}

      {/* Trophies */}
      <div className="profile-trophies-section">
        <h3 className="profile-section-title">🏅 הגביעים שלי</h3>
        {!actualResults.length ? (
          <p className="hint-text">⏳ הגביעים יחושבו אחרי הגמר</p>
        ) : loadingTrophies ? (
          <p className="hint-text">טוען...</p>
        ) : trophies.length === 0 ? (
          <p className="hint-text">עדיין לא השגת גביע — בהצלחה!</p>
        ) : (
          <div className="trophies-list">
            {trophies.map(t => (
              <div key={t.groupCode} className="trophy-row">
                <span className="trophy-icon">{TROPHY_ICONS[t.rank - 1]}</span>
                <span className="trophy-group">{t.groupName}</span>
                <span className="trophy-rank">מקום {t.rank}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <button className="profile-about-btn" onClick={onNavigateAbout}>
        אודות הפרויקט →
      </button>
    </div>
  );
}
