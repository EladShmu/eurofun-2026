import { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { doc, onSnapshot, setDoc, getDoc, updateDoc, arrayRemove, arrayUnion, deleteField } from 'firebase/firestore';
import { auth, db } from './firebase';
import { UserData, GroupData, GlobalConfig } from './types';
import AuthPage from './components/AuthPage';
import GroupSetup from './components/GroupSetup';
import MainPage from './components/MainPage';
import TopTen from './components/TopTen';
import LiveView from './components/LiveView';
import Leaderboard from './components/Leaderboard';
import Instructions from './components/Instructions';
import Onboarding from './components/Onboarding';
import ProfilePage from './components/ProfilePage';
import AboutPage from './components/AboutPage';
import AdminPage from './components/AdminPage';
import TruthTable from './components/TruthTable';

type MainTab = 'main' | 'topten' | 'competition' | 'truth' | 'profile' | 'about' | 'instructions' | 'admin';
type GroupTab = 'live' | 'leaderboard';

export default function App() {
  const [authLoading, setAuthLoading] = useState(true);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [userData, setUserDataState] = useState<UserData | null>(null);
  const [selectedGroupCode, setSelectedGroupCode] = useState<string | null>(null);
  const [groupData, setGroupData] = useState<GroupData | null>(null);
  const [memberDataMap, setMemberDataMap] = useState<Record<string, UserData>>({});
  const [groupNames, setGroupNames] = useState<Record<string, string>>({});
  const [mainTab, setMainTab] = useState<MainTab>('main');
  const [groupTab, setGroupTab] = useState<GroupTab>('live');
  const [showGroupSetup, setShowGroupSetup] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [globalConfig, setGlobalConfig] = useState<GlobalConfig | null>(null);

  // Invite link params (read once on mount)
  const [inviteCode] = useState(() => new URLSearchParams(window.location.search).get('join'));
  const [invitePassword] = useState(() => new URLSearchParams(window.location.search).get('pw'));

  // Auth listener
  useEffect(() => {
    return onAuthStateChanged(auth, user => {
      setAuthUser(user);
      setAuthLoading(false);
      if (!user) {
        setUserDataState(null);
        setGroupData(null);
        setMemberDataMap({});
        setIsSuperAdmin(false);
      }
    });
  }, []);

  // Super-admin check
  useEffect(() => {
    if (!authUser) return;
    getDoc(doc(db, 'admins', authUser.uid)).then(snap => setIsSuperAdmin(snap.exists()));
  }, [authUser]);

  // Global config listener (freeze flag + actual results)
  useEffect(() => {
    return onSnapshot(doc(db, 'config', 'main'), snap => {
      setGlobalConfig(snap.exists() ? snap.data() as GlobalConfig : null);
    });
  }, []);

  // User data listener
  useEffect(() => {
    if (!authUser) return;
    return onSnapshot(doc(db, 'users', authUser.uid), snap => {
      if (snap.exists()) {
        const data = snap.data() as UserData;
        setUserDataState(data);
        setSelectedGroupCode(prev => prev ?? (data.groups[0] ?? null));
      }
    });
  }, [authUser]);

  // Load group names for toggle display
  useEffect(() => {
    if (!userData?.groups?.length) return;
    userData.groups.forEach(async code => {
      if (groupNames[code]) return;
      const snap = await getDoc(doc(db, 'groups', code));
      if (snap.exists()) {
        const data = snap.data() as GroupData;
        setGroupNames(prev => ({ ...prev, [code]: data.name }));
      }
    });
  }, [userData?.groups?.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  // Selected group listener
  useEffect(() => {
    if (!selectedGroupCode) return;
    setGroupData(null);
    setMemberDataMap({});
    return onSnapshot(doc(db, 'groups', selectedGroupCode), snap => {
      if (snap.exists()) {
        const data = snap.data() as GroupData;
        setGroupData(data);
        setGroupNames(prev => ({ ...prev, [selectedGroupCode]: data.name }));
      }
    });
  }, [selectedGroupCode]);

  // Member data listeners (one per member)
  useEffect(() => {
    if (!groupData?.members?.length) return;
    const unsubs = groupData.members.map(uid =>
      onSnapshot(doc(db, 'users', uid), snap => {
        if (snap.exists()) {
          setMemberDataMap(prev => ({ ...prev, [uid]: snap.data() as UserData }));
        }
      })
    );
    return () => unsubs.forEach(u => u());
  }, [groupData?.members?.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-join GLOBAL group for all users
  useEffect(() => {
    if (!authUser || !userData || !userData.onboardingComplete) return;
    if (userData.groups.includes('GLOBAL')) return;
    const join = async () => {
      const globalRef = doc(db, 'groups', 'GLOBAL');
      const snap = await getDoc(globalRef);
      if (!snap.exists()) {
        await setDoc(globalRef, {
          name: 'GLOBAL',
          nameLower: 'global',
          code: 'GLOBAL',
          isOpen: true,
          password: '',
          createdBy: 'system',
          createdAt: Date.now(),
          members: [authUser.uid],
          memberNames: { [authUser.uid]: userData.username },
          actualResults: [],
        });
      } else {
        await updateDoc(globalRef, {
          members: arrayUnion(authUser.uid),
          [`memberNames.${authUser.uid}`]: userData.username,
        });
      }
      handleSetUserData(prev => ({ ...prev, groups: [...prev.groups, 'GLOBAL'] }));
    };
    join();
  }, [authUser?.uid, userData?.onboardingComplete]); // eslint-disable-line react-hooks/exhaustive-deps

  // Write user data to Firestore (debounced via useCallback)
  const saveUserData = useCallback((next: UserData) => {
    if (!authUser) return;
    setDoc(doc(db, 'users', authUser.uid), next, { merge: true });
  }, [authUser]);

  function handleSetUserData(updater: UserData | ((prev: UserData) => UserData)) {
    setUserDataState(prev => {
      if (!prev) return prev;
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveUserData(next);
      return next;
    });
  }

  function handleAvatarUpdate(url: string) {
    handleSetUserData(prev => ({ ...prev, avatar: url }));
  }

  function handleGroupJoined(code: string) {
    setSelectedGroupCode(code);
    setShowGroupSetup(false);
    setMainTab('competition');
    if (inviteCode) window.history.replaceState({}, '', '/');
  }

  function selectGroup(code: string) {
    setSelectedGroupCode(code);
    setGroupTab('live');
  }

  async function leaveGroup(code: string) {
    if (!authUser || !userData) return;
    if (!window.confirm(`לעזוב את הקבוצה?`)) return;
    await updateDoc(doc(db, 'groups', code), {
      members: arrayRemove(authUser.uid),
      [`memberNames.${authUser.uid}`]: deleteField(),
    });
    handleSetUserData(prev => ({ ...prev, groups: prev.groups.filter(g => g !== code) }));
    if (selectedGroupCode === code) {
      const remaining = userData.groups.filter(g => g !== code);
      setSelectedGroupCode(remaining[0] ?? null);
    }
  }

  // ── Loading ──
  if (authLoading) {
    return <div className="loading-screen"><span>🎤</span></div>;
  }

  // ── Not logged in ──
  if (!authUser) {
    return <AuthPage inviteCode={inviteCode} invitePassword={invitePassword} />;
  }

  // ── Logged in, user doc loading ──
  if (!userData) {
    return <div className="loading-screen"><span>⏳</span></div>;
  }

  // ── Onboarding (new user) ──
  if (!userData.onboardingComplete) {
    return (
      <Onboarding
        uid={authUser.uid}
        username={userData.username}
        onComplete={() => { /* Firestore update handled inside Onboarding */ }}
      />
    );
  }

  // ── Adding a group ──
  if (showGroupSetup) {
    return (
      <GroupSetup
        uid={authUser.uid}
        username={userData.username}
        onJoined={handleGroupJoined}
        onBack={() => setShowGroupSetup(false)}
      />
    );
  }

  // ── Invite link auto-join ──
  if (inviteCode && invitePassword && !userData.groups.includes(inviteCode)) {
    return (
      <GroupSetup
        uid={authUser.uid}
        username={userData.username}
        onJoined={handleGroupJoined}
        initialInvite={{ code: inviteCode, password: invitePassword }}
      />
    );
  }

  const frozen = globalConfig?.rankingFrozen ?? false;
  const actualResults = globalConfig?.actualResults ?? [];

  const avatarDisplay = (userData.avatar ?? '').startsWith('http')
    ? <img src={userData.avatar} className="header-avatar-img" alt="avatar" />
    : <span>{userData.avatar ?? '👤'}</span>;

  return (
    <div className="app">
      <header className="app-header">
        <span className="logo">🎤 EuroFun</span>
        <nav>
          <button className={mainTab === 'main' ? 'active' : ''} onClick={() => setMainTab('main')}>דירוג</button>
          <button className={mainTab === 'topten' ? 'active' : ''} onClick={() => setMainTab('topten')}>טופ 10</button>
          <button className={mainTab === 'competition' ? 'active' : ''} onClick={() => setMainTab('competition')}>תחרות</button>
          <button className={mainTab === 'truth' ? 'active' : ''} onClick={() => setMainTab('truth')}>📋 אמת</button>
          <button className={mainTab === 'instructions' ? 'active' : ''} onClick={() => setMainTab('instructions')}>❓</button>
          <button className={mainTab === 'about' ? 'active' : ''} onClick={() => setMainTab('about')}>ℹ️</button>
        </nav>
        <div className="header-right">
          {isSuperAdmin && (
            <button
              className={`admin-header-btn ${mainTab === 'admin' ? 'active' : ''}`}
              onClick={() => setMainTab('admin')}
              title="פאנל אדמין"
            >
              ⚙️
            </button>
          )}
          <button
            className={`avatar-header-btn ${mainTab === 'profile' ? 'active' : ''}`}
            onClick={() => setMainTab('profile')}
            title={userData.username}
          >
            {avatarDisplay}
          </button>
          <button className="logout-btn" onClick={() => signOut(auth)} title="התנתק">⇦</button>
        </div>
      </header>

      <main>
        {mainTab === 'main' && (
          <MainPage userData={userData} setUserData={handleSetUserData} frozen={frozen} />
        )}

        {mainTab === 'topten' && (
          <TopTen userData={userData} />
        )}

        {mainTab === 'competition' && (
          <div className="group-tab-content">
            {userData.groups.length === 0 && (
              <div className="welcome-banner">
                <div className="welcome-banner-icon">🎤</div>
                <h2>ברוכים הבאים ל-EuroFun!</h2>
                <p>צרו קבוצה עם חברים כדי להתחיל לשחק.</p>
                <button className="group-btn primary" onClick={() => setShowGroupSetup(true)}>
                  + צור / הצטרף לקבוצה
                </button>
              </div>
            )}

            {userData.groups.length > 0 && (
              <>
                {userData.groups.length > 1 && (
                  <div className="group-selector">
                    {userData.groups.map(code => (
                      <button
                        key={code}
                        className={`group-chip ${code === selectedGroupCode ? 'active' : ''}`}
                        onClick={() => selectGroup(code)}
                      >
                        {groupNames[code] ?? code}
                      </button>
                    ))}
                  </div>
                )}

                {groupData && (
                  <div className="group-name-bar">
                    <span className="group-title-name">{groupData.name}</span>
                    <div className="group-name-bar-right">
                      {groupData.isOpen
                        ? <span className="group-open-badge">🔓 פתוחה</span>
                        : <span className="group-password-small">🔐 קוד: {groupData.password}</span>
                      }
                      <button
                        className="leave-group-btn"
                        onClick={() => leaveGroup(selectedGroupCode!)}
                        title="עזוב קבוצה"
                      >🚪 עזוב</button>
                    </div>
                  </div>
                )}

                <div className="lb-tabs">
                  <button className={groupTab === 'live' ? 'active' : ''} onClick={() => setGroupTab('live')}>
                    🔴 RANKING
                  </button>
                  <button className={groupTab === 'leaderboard' ? 'active' : ''} onClick={() => setGroupTab('leaderboard')}>
                    📊 BOARDS
                  </button>
                </div>

                {groupData ? (
                  <>
                    {groupTab === 'live' && (
                      <LiveView
                        groupData={groupData}
                        memberDataMap={memberDataMap}
                        myUid={authUser.uid}
                      />
                    )}
                    {groupTab === 'leaderboard' && (
                      <Leaderboard
                        memberDataMap={memberDataMap}
                        myUid={authUser.uid}
                        actualResults={actualResults}
                      />
                    )}
                  </>
                ) : (
                  <p className="empty-hint">טוען קבוצה...</p>
                )}

                <button className="add-group-btn" onClick={() => setShowGroupSetup(true)}>
                  + הצטרף / צור קבוצה נוספת
                </button>
              </>
            )}
          </div>
        )}

        {mainTab === 'profile' && (
          <ProfilePage
            userData={userData}
            actualResults={actualResults}
            onAvatarUpdate={handleAvatarUpdate}
            onNavigateAbout={() => setMainTab('about')}
          />
        )}

        {mainTab === 'truth' && (
          <TruthTable globalConfig={globalConfig} userData={userData} />
        )}

        {mainTab === 'about' && <AboutPage />}

        {mainTab === 'instructions' && <Instructions />}

        {mainTab === 'admin' && isSuperAdmin && (
          <AdminPage globalConfig={globalConfig} />
        )}
      </main>
    </div>
  );
}
