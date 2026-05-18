import { useState } from 'react';

type AboutTab = 'tech' | 'why' | 'future';

const TECH_ITEMS = [
  {
    icon: '⚛️',
    title: 'React 18 + TypeScript',
    short: 'ממשק משתמש מודרני עם type safety מלא',
    detail: 'React 18 מספק Concurrent Rendering ו-automatic batching לביצועים מהירים. TypeScript מוסיף type safety מלא — כל prop, state ו-Firestore document מוגדרים בצורה מפורשת, מה שמונע באגים כבר בזמן כתיבת הקוד ולא בזמן ריצה. הקומפוננטות מחולקות לפי אחריות: MainPage, LiveView, Leaderboard, TruthTable וכד\'.',
  },
  {
    icon: '🔥',
    title: 'Firebase (Auth + Firestore + Hosting)',
    short: 'Backend מלא ללא שרת — sync בזמן אמת',
    detail: 'Firebase Auth מנהל הרשמה/כניסה דרך Email/Password. הטריק: המשתמש מקליד רק שם משתמש, והאפליקציה בונה כתובת אימייל פנימית (username@eurofun.local) שהמשתמש אף פעם לא רואה. Firestore מאחסן את כל הנתונים ב-real-time: כל שינוי בדירוג של משתמש אחד מגיע לכולם תוך שניות דרך onSnapshot listeners. Firebase Hosting מגיש את הקבצים הסטטיים מ-CDN גלובלי.',
  },
  {
    icon: '⚡',
    title: 'Vite',
    short: 'Build tool מהיר עם hot reload מיידי',
    detail: 'Vite משתמש ב-ES modules בזמן פיתוח — במקום לבנד את כל הקוד, הוא מגיש כל קובץ בנפרד. התוצאה: hot reload שלוקח פחות מ-100ms. בזמן build לפרודקשן, Vite משתמש ב-Rollup ליצירת bundle מינימלי ומאופטם. כל השינויים בפרויקט הזה נבדקו ב-under 2 שניות.',
  },
  {
    icon: '🖱️',
    title: '@dnd-kit',
    short: 'Drag-and-drop עם תמיכה מלאה ב-touch',
    detail: '@dnd-kit היא ספריית drag-and-drop מודרנית שתוכננה לאקססיביליות ומובייל. בניגוד לספריות ישנות יותר (react-dnd, react-beautiful-dnd), היא תומכת ב-Pointer Events ו-Touch Events באופן מובנה — חיוני לאפליקציה שמיועדת לשימוש בנייד. כל כרטיס מדינה בדירוג ניתן לגרור עם האצבע, עם activation delay של 200ms למניעת drag אקסידנטלי בזמן גלילה.',
  },
];

export default function AboutPage() {
  const [tab, setTab] = useState<AboutTab>('tech');
  const [openTech, setOpenTech] = useState<number | null>(null);

  function toggleTech(i: number) {
    setOpenTech(prev => (prev === i ? null : i));
  }

  return (
    <div className="about-page">
      <div className="about-logo">🎤</div>
      <h1 className="about-title">EuroFun 2026</h1>
      <p className="about-subtitle">אפליקציית ניבוי Eurovision לקבוצות</p>

      <div className="about-tabs">
        <button className={tab === 'tech' ? 'active' : ''} onClick={() => setTab('tech')}>
          ⚙️ טכנולוגיה
        </button>
        <button className={tab === 'why' ? 'active' : ''} onClick={() => setTab('why')}>
          💡 הסיפור
        </button>
        <button className={tab === 'future' ? 'active' : ''} onClick={() => setTab('future')}>
          🔮 V2
        </button>
      </div>

      {tab === 'tech' && (
        <div className="about-content">
          <div className="about-section">
            <h3>Stack טכנולוגי — לחץ לפירוט</h3>
            <div className="tech-stack">
              {TECH_ITEMS.map((item, i) => {
                const isOpen = openTech === i;
                return (
                  <div
                    key={i}
                    className={`tech-item tech-toggle ${isOpen ? 'open' : ''}`}
                    onClick={() => toggleTech(i)}
                  >
                    <span className="tech-icon">{item.icon}</span>
                    <div className="tech-body">
                      <strong>{item.title}</strong>
                      <p className="tech-short">{item.short}</p>
                      {isOpen && <p className="tech-detail">{item.detail}</p>}
                    </div>
                    <span className="tech-arrow">{isOpen ? '▲' : '▼'}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="about-section">
            <h3>ארכיטקטורה בולטת</h3>
            <ul>
              <li>🔄 <strong>Real-time sync</strong> — onSnapshot listeners מקוננים לכל חבר קבוצה בו-זמנית</li>
              <li>🔐 <strong>Auth pattern</strong> — שם משתמש פשוט (Firebase Email שקוף מאחורי הקלעים)</li>
              <li>🌐 <strong>RTL-first</strong> — עיצוב CSS ייעודי לעברית ומובייל</li>
              <li>📊 <strong>5 scoring algorithms</strong> — linear, squared, bulls-eye, tiers, league</li>
              <li>🔒 <strong>Admin freeze</strong> — נעילת דירוגים דרך Firestore config document</li>
            </ul>
          </div>
          <a
            className="about-link"
            href="https://eurofun-2026.web.app"
            target="_blank"
            rel="noopener noreferrer"
          >
            🌐 eurofun-2026.web.app
          </a>
        </div>
      )}

      {tab === 'why' && (
        <div className="about-content">
          <div className="about-section">
            <h3>הרעיון</h3>
            <p>EuroFun נולדה ממסורת שהתחילה בזמן האוניברסיטה — כל שנה היינו צופים ב-Eurovision ביחד, מדרגים מדינות על דף נייר, טופ 5 בלבד, ובפורמט שונה כל פעם. לא היה עקביות, לא ניתן להשוות שנים, ואת הנייר זרקנו בסוף.</p>
            <p>עם הטכנולוגיה אפשר לבחון דברים בצורה חכמה יותר — לשמור את כל הנתונים, להשוות בין כולם בזמן אמת, ולתת למשחק חיים אמיתיים. מ-25 מדינות, 5 שיטות ניקוד, וקבוצות עם חברים.</p>
          </div>
          <div className="about-section">
            <h3>ביצוע תחת לחץ</h3>
            <p>האפליקציה נבנתה ב-<strong>3 ימים בלבד</strong> — רעיון מהיר עם ביצוע תחת זמן נוקשה. Eurovision לא מחכה. לא היה זמן לבדוק כל edge case, לכתוב tests, או לדבג לאט — הכל נעשה מהר עם הצורך לעמוד בדדליין קשיח של מועד שידור הגמר.</p>
            <p>התוצאה: אפליקציה עובדת, בזמן, עם real-time sync ו-5 מנגנוני ניקוד — הכל בשלושה ימים.</p>
          </div>
          <div className="about-section">
            <h3>בנוי עם ❤️</h3>
            <p>נבנה על ידי <strong>אלעד שמולביץ</strong> — מסורת ישנה שקיבלה חיים חדשים עם טכנולוגיה מודרנית.</p>
          </div>
        </div>
      )}

      {tab === 'future' && (
        <div className="about-content">
          <div className="about-section">
            <h3>רעיונות ל-EuroFun V2 🚀</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text2)', marginBottom: '0.75rem' }}>
              מה יכלול הגירסה הבאה — Eurovision 2027
            </p>
            <div className="future-list">
              {[
                { n: '01', t: 'הסברים ברורים יותר', d: 'onboarding משופר, טיפים inline, ותיאורים ברורים לכל פיצ\'ר' },
                { n: '02', t: 'פורמט חצאי גמר', d: 'תמיכה בשלבי Semi-Final 1 ו-2 לפני הגמר, עם ניחושי מעבר' },
                { n: '03', t: 'שדרוג UI', d: 'אנימציות, transitions חלקות, design system מקוהרנטי יותר' },
                { n: '04', t: 'שם שיר + אמן + YouTube', d: 'קישור לשיר של כל מדינה ישירות מהדירוג — ללחוץ ולשמוע' },
                { n: '05', t: 'PWA — אפליקציה אמיתית', d: 'התקנה על נייד, push notifications, עבודה עם קישוריות חלשה. מותאם לשימוש בזמן האירוויזיון' },
                { n: '06', t: 'תפריט משופר', d: 'ניווט תחתון (bottom nav) עם אייקונים, קל יותר לשימוש בנייד בזמן הצפייה' },
                { n: '07', t: '"אתה המדינה!"', d: 'כל יוזר מדרג כמו מדינה — 12-10-8-7-6-5-4-3-2-1 לחברים הפייבוריטים שלו. פורמט הצבעה מורחב' },
                { n: '08', t: 'חיפוש קבוצות וחברים', d: 'מנוע חיפוש לקבוצות ציבוריות, הוספת חברים לפי שם משתמש' },
                { n: '09', t: 'צ\'אט מובנה בקבוצה', d: 'תגובות בזמן אמת — "WOW ישראל 🔥" ישירות בתוך האפליקציה' },
                { n: '10', t: 'סדר הופעות קבוע', d: 'סדר המדינות ידוע מראש — הפול מסודר לפי סדר הופעות קבוע, ללא צורך בעריכה ידנית' },
                { n: '11', t: 'התאמה לקהל הישראלי', d: 'ממשק מלא בעברית, מדינות עם הערות על יחסים עם ישראל, ניחוש "מי יצביע לנו?"' },
                { n: '12', t: 'שאלוני טריוויה ו-Under/Over', d: 'מי ייתן לישראל 12 נקודות? כמה נקודות תקבל שוודיה? ניחושים קצרים שמוסיפים כיף לסרק' },
              ].map(item => (
                <div key={item.n} className="future-item">
                  <span className="future-num">{item.n}</span>
                  <div>
                    <strong>{item.t}</strong>
                    <p>{item.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
