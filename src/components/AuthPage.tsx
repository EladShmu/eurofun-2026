import { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { COUNTRIES } from '../data/countries';

function toEmail(username: string) {
  return `${username.toLowerCase().trim()}@eurofun.local`;
}

function authErrorMsg(code: string): string {
  switch (code) {
    case 'auth/email-already-in-use': return 'שם משתמש תפוס. בחר שם אחר.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential': return 'שם משתמש או סיסמה שגויים.';
    case 'auth/weak-password': return 'הסיסמה חייבת להכיל לפחות 6 תווים.';
    case 'auth/too-many-requests': return 'יותר מדי ניסיונות. נסה שוב מאוחר יותר.';
    default: return 'שגיאה. נסה שוב.';
  }
}

interface Props {
  inviteCode?: string | null;
  invitePassword?: string | null;
}

export default function AuthPage({ inviteCode }: Props) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignup() {
    if (!username.trim() || password.length < 6) return;
    setLoading(true);
    setError('');
    try {
      const cred = await createUserWithEmailAndPassword(auth, toEmail(username), password);
      await setDoc(doc(db, 'users', cred.user.uid), {
        uid: cred.user.uid,
        username: username.trim(),
        rankedList: [],
        pool: COUNTRIES.map(c => c.id),
        groups: [],
        lastUpdated: Date.now(),
      });
    } catch (e) {
      const code = (e as { code?: string }).code ?? '';
      setError(authErrorMsg(code));
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin() {
    if (!username.trim() || !password) return;
    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, toEmail(username), password);
    } catch (e) {
      const code = (e as { code?: string }).code ?? '';
      setError(authErrorMsg(code));
    } finally {
      setLoading(false);
    }
  }

  function switchMode(m: 'login' | 'signup') {
    setMode(m);
    setError('');
  }

  const canSubmit = username.trim().length > 0 && password.length >= 6 && !loading;

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">🎤</div>
        <h1>EuroFun 2026</h1>
        {inviteCode
          ? <p className="invite-hint">🔗 הוזמנת להצטרף לקבוצה! התחבר כדי לקבל את ההזמנה.</p>
          : <p>אירוויזיון וינה • 16 מאי 2026</p>
        }

        <div className="auth-toggle">
          <button className={mode === 'login' ? 'active' : ''} onClick={() => switchMode('login')}>כניסה</button>
          <button className={mode === 'signup' ? 'active' : ''} onClick={() => switchMode('signup')}>הרשמה</button>
        </div>

        <input
          type="text"
          placeholder="שם משתמש"
          value={username}
          onChange={e => setUsername(e.target.value)}
          autoFocus
          autoComplete="username"
        />
        <input
          type="password"
          placeholder="סיסמה (לפחות 6 תווים)"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && canSubmit && (mode === 'login' ? handleLogin() : handleSignup())}
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
        />

        {error && <p className="auth-error">{error}</p>}

        <button
          onClick={mode === 'login' ? handleLogin : handleSignup}
          disabled={!canSubmit}
        >
          {loading ? '...' : mode === 'login' ? 'כניסה →' : 'הרשמה →'}
        </button>
      </div>
    </div>
  );
}
