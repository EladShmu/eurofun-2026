import { useState, useEffect } from 'react';
import { collection, doc, getDocs, query, setDoc, updateDoc, arrayUnion, where, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { GroupData } from '../types';

interface Props {
  uid: string;
  username: string;
  onJoined: (code: string) => void;
  onBack?: () => void;
  initialInvite?: { code: string; password: string };
}

function generateCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function generatePassword() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

type Mode = 'choose' | 'create' | 'join' | 'created';

export default function GroupSetup({ uid, username, onJoined, onBack, initialInvite }: Props) {
  const [mode, setMode] = useState<Mode>('choose');
  const [groupName, setGroupName] = useState('');
  const [isOpenGroup, setIsOpenGroup] = useState(false);
  const [createdCode, setCreatedCode] = useState('');
  const [createdName, setCreatedName] = useState('');
  const [createdPassword, setCreatedPassword] = useState('');
  const [createdIsOpen, setCreatedIsOpen] = useState(false);
  const [conflict, setConflict] = useState<{ existing: string; suggested: string } | null>(null);
  const [joinTab, setJoinTab] = useState<'search' | 'code'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GroupData[]>([]);
  const [pendingJoinGroup, setPendingJoinGroup] = useState<GroupData | null>(null);
  const [passwordInput, setPasswordInput] = useState(initialInvite?.password ?? '');
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function findSuggestedName(baseName: string): Promise<{ taken: boolean; suggestion: string }> {
    const q = query(collection(db, 'groups'), where('nameLower', '==', baseName.toLowerCase()));
    const snap = await getDocs(q);
    if (snap.empty) return { taken: false, suggestion: baseName };
    let n = 2;
    while (true) {
      const candidate = `${baseName}(${n})`;
      const q2 = query(collection(db, 'groups'), where('nameLower', '==', candidate.toLowerCase()));
      const snap2 = await getDocs(q2);
      if (snap2.empty) return { taken: true, suggestion: candidate };
      n++;
    }
  }

  async function doCreate(nameToUse: string, open: boolean) {
    const code = generateCode();
    const password = open ? '' : generatePassword();
    await setDoc(doc(db, 'groups', code), {
      name: nameToUse,
      nameLower: nameToUse.toLowerCase(),
      code,
      password,
      isOpen: open,
      createdBy: uid,
      createdAt: Date.now(),
      members: [uid],
      memberNames: { [uid]: username },
      actualResults: [],
    } satisfies GroupData);
    await updateDoc(doc(db, 'users', uid), { groups: arrayUnion(code) });
    return { code, password, isOpen: open };
  }

  async function handleCreate() {
    if (!groupName.trim()) return;
    setLoading(true);
    setError('');
    setConflict(null);
    try {
      const { taken, suggestion } = await findSuggestedName(groupName.trim());
      if (taken) {
        setConflict({ existing: groupName.trim(), suggested: suggestion });
        setLoading(false);
        return;
      }
      const { code, password, isOpen: open } = await doCreate(groupName.trim(), isOpenGroup);
      setCreatedCode(code);
      setCreatedName(groupName.trim());
      setCreatedPassword(password);
      setCreatedIsOpen(open);
      setMode('created');
    } catch (e) {
      setError('שגיאה: ' + String(e));
    } finally {
      setLoading(false);
    }
  }

  async function handleAcceptSuggestion() {
    if (!conflict) return;
    setLoading(true);
    try {
      const { code, password, isOpen: open } = await doCreate(conflict.suggested, isOpenGroup);
      setCreatedCode(code);
      setCreatedName(conflict.suggested);
      setCreatedPassword(password);
      setCreatedIsOpen(open);
      setConflict(null);
      setMode('created');
    } catch (e) {
      setError('שגיאה: ' + String(e));
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch() {
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, 'groups'),
        where('nameLower', '>=', searchQuery.toLowerCase()),
        where('nameLower', '<=', searchQuery.toLowerCase() + '')
      );
      const snap = await getDocs(q);
      setSearchResults(snap.docs.map(d => d.data() as GroupData));
    } finally {
      setLoading(false);
    }
  }

  async function joinGroup(code: string, expectedPassword?: string) {
    setLoading(true);
    setError('');
    try {
      const groupRef = doc(db, 'groups', code);
      const snap = await getDoc(groupRef);
      if (!snap.exists()) {
        setError('קבוצה לא נמצאה.');
        return;
      }
      const groupData = snap.data() as GroupData;

      if (!groupData.isOpen && expectedPassword !== undefined && groupData.password !== expectedPassword) {
        setError('סיסמה שגויה.');
        setLoading(false);
        return;
      }

      if (groupData.members.includes(uid)) {
        onJoined(code);
        return;
      }
      await updateDoc(groupRef, {
        members: arrayUnion(uid),
        [`memberNames.${uid}`]: username,
      });
      await updateDoc(doc(db, 'users', uid), { groups: arrayUnion(code) });
      onJoined(code);
    } catch (e) {
      setError('שגיאה: ' + String(e));
    } finally {
      setLoading(false);
    }
  }

  function handlePasswordJoin() {
    if (!pendingJoinGroup) return;
    joinGroup(pendingJoinGroup.code, passwordInput);
  }

  // Auto-join via invite link
  useEffect(() => {
    if (initialInvite) {
      joinGroup(initialInvite.code, initialInvite.password);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function copyInviteLink() {
    const url = `${window.location.origin}/?join=${createdCode}&pw=${createdPassword}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // ── Choose ──
  if (mode === 'choose') {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="login-logo">🎤</div>
          <h1>EuroFun 2026</h1>
          <p>שלום {username}! בחר אפשרות:</p>
          <button className="group-btn primary" onClick={() => setMode('create')}>🆕 צור קבוצה חדשה</button>
          <button className="group-btn secondary" onClick={() => setMode('join')}>🔗 הצטרף לקבוצה קיימת</button>
          {onBack && (
            <button className="group-btn secondary" onClick={onBack}>← חזרה</button>
          )}
        </div>
      </div>
    );
  }

  // ── Create ──
  if (mode === 'create') {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="login-logo">🆕</div>
          <h1>צור קבוצה</h1>

          {conflict ? (
            <div className="conflict-box">
              <p>הקבוצה <strong>"{conflict.existing}"</strong> כבר קיימת.</p>
              <p>רוצה לקרוא לה <strong>"{conflict.suggested}"</strong>?</p>
              <button className="group-btn primary" onClick={handleAcceptSuggestion} disabled={loading}>
                {loading ? '...' : `כן, "${conflict.suggested}"`}
              </button>
              <button className="group-btn secondary" onClick={() => setConflict(null)}>
                לא, אבחר שם אחר
              </button>
            </div>
          ) : (
            <>
              <input
                type="text"
                placeholder="שם הקבוצה..."
                value={groupName}
                onChange={e => setGroupName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                autoFocus
              />
              <div className="group-type-toggle">
                <button
                  className={!isOpenGroup ? 'active' : ''}
                  onClick={() => setIsOpenGroup(false)}
                  type="button"
                >🔐 מוגנת בקוד</button>
                <button
                  className={isOpenGroup ? 'active' : ''}
                  onClick={() => setIsOpenGroup(true)}
                  type="button"
                >🔓 פתוחה לכולם</button>
              </div>
              <p className="hint-text" style={{ fontSize: '0.8rem', marginTop: 0 }}>
                {isOpenGroup ? 'כל אחד יוכל להצטרף חופשית' : 'הצטרפות דורשת קוד 4 ספרות'}
              </p>
              {error && <p className="auth-error">{error}</p>}
              <button className="group-btn primary" onClick={handleCreate} disabled={loading || !groupName.trim()}>
                {loading ? '...' : 'צור →'}
              </button>
              <button className="group-btn secondary" onClick={() => setMode('choose')}>← חזרה</button>
            </>
          )}
        </div>
      </div>
    );
  }

  // ── Created ──
  if (mode === 'created') {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="login-logo">🎉</div>
          <h1>"{createdName}" נוצרה!</h1>

          {createdIsOpen ? (
            <p>קבוצה פתוחה — כל אחד יוכל להצטרף דרך חיפוש שם.</p>
          ) : (
            <>
              <p>שלח לחברים את הקוד או לינק הצטרפות:</p>
              <div className="group-password-display">
                <span className="password-label">קוד הצטרפות</span>
                <span className="group-password">{createdPassword}</span>
              </div>
              <button className="group-btn secondary" onClick={copyInviteLink}>
                {copied ? '✓ לינק הועתק!' : '📋 העתק לינק הצטרפות'}
              </button>
            </>
          )}

          <button className="group-btn primary" onClick={() => onJoined(createdCode)}>כניסה לקבוצה →</button>
        </div>
      </div>
    );
  }

  // ── Join ── (password entry for selected group)
  if (pendingJoinGroup) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="login-logo">🔐</div>
          <h1>{pendingJoinGroup.name}</h1>
          <p>הזן סיסמה להצטרפות:</p>
          <input
            type="number"
            placeholder="סיסמה (4 ספרות)"
            value={passwordInput}
            onChange={e => setPasswordInput(e.target.value.slice(0, 6))}
            onKeyDown={e => e.key === 'Enter' && handlePasswordJoin()}
            className="password-join-input"
            autoFocus
          />
          {error && <p className="auth-error">{error}</p>}
          <button className="group-btn primary" onClick={handlePasswordJoin}
            disabled={loading || passwordInput.length !== 6}>
            {loading ? '...' : 'הצטרף →'}
          </button>
          <button className="group-btn secondary" onClick={() => { setPendingJoinGroup(null); setPasswordInput(''); setError(''); }}>
            ← חזרה
          </button>
        </div>
      </div>
    );
  }

  // ── Join ──
  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">🔗</div>
        <h1>הצטרף לקבוצה</h1>

        <div className="auth-toggle">
          <button className={joinTab === 'search' ? 'active' : ''} onClick={() => { setJoinTab('search'); setError(''); }}>חיפוש שם</button>
          <button className={joinTab === 'code' ? 'active' : ''} onClick={() => { setJoinTab('code'); setError(''); }}>הכנס קוד</button>
        </div>

        {joinTab === 'search' ? (
          <>
            <div className="search-row">
              <input
                type="text"
                placeholder="שם הקבוצה..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
              />
              <button className="search-btn" onClick={handleSearch} disabled={loading || !searchQuery.trim()}>
                🔍
              </button>
            </div>
            {searchResults.length > 0 && (
              <div className="search-results">
                {searchResults.map(g => (
                  <div key={g.code} className="search-result-row">
                    <span className="result-name">{g.isOpen ? '🔓' : '🔒'} {g.name}</span>
                    <span className="result-members">{g.members.length} חברים</span>
                    <button className="join-btn" onClick={() => {
                      if (g.isOpen) { joinGroup(g.code); }
                      else { setPendingJoinGroup(g); setError(''); }
                    }} disabled={loading}>
                      הצטרף
                    </button>
                  </div>
                ))}
              </div>
            )}
            {searchResults.length === 0 && searchQuery && !loading && (
              <p className="hint-text">לא נמצאו קבוצות. נסה חיפוש אחר.</p>
            )}
          </>
        ) : (
          <>
            <input
              type="text"
              placeholder="קוד קבוצה (6 תווים)"
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && joinGroup(joinCode.trim())}
              maxLength={6}
              style={{ letterSpacing: '0.2em', textAlign: 'center', fontWeight: 700 }}
              autoFocus
            />
            <button className="group-btn primary" onClick={() => joinGroup(joinCode.trim())} disabled={loading || joinCode.trim().length < 6}>
              {loading ? '...' : 'הצטרף →'}
            </button>
          </>
        )}

        {error && <p className="auth-error">{error}</p>}
        <button className="group-btn secondary" onClick={() => setMode('choose')}>← חזרה</button>
      </div>
    </div>
  );
}
