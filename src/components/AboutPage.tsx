import { useState } from 'react';

type AboutTab = 'tech' | 'why' | 'future';

export default function AboutPage() {
  const [tab, setTab] = useState<AboutTab>('tech');

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
            <h3>Stack טכנולוגי</h3>
            <div className="tech-stack">
              <div className="tech-item">
                <span className="tech-icon">⚛️</span>
                <div>
                  <strong>React 18 + TypeScript</strong>
                  <p>ממשק משתמש מודרני עם type safety מלא והיררכיית קומפוננטות נקייה</p>
                </div>
              </div>
              <div className="tech-item">
                <span className="tech-icon">🔥</span>
                <div>
                  <strong>Firebase</strong>
                  <p>Auth + Firestore real-time DB + Hosting — backend מלא ללא שרת. sync בזמן אמת לכל חברי הקבוצה</p>
                </div>
              </div>
              <div className="tech-item">
                <span className="tech-icon">⚡</span>
                <div>
                  <strong>Vite</strong>
                  <p>build tool עם hot reload מיידי ו-bundle מינימלי לפרודקשן</p>
                </div>
              </div>
              <div className="tech-item">
                <span className="tech-icon">🖱️</span>
                <div>
                  <strong>@dnd-kit</strong>
                  <p>drag-and-drop אקססיבלי עם תמיכה מלאה ב-touch למובייל</p>
                </div>
              </div>
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
            <p>EuroFun נבנתה ב-2026 כדי להפוך את הצפייה ב-Eurovision לחוויה קבוצתית אינטראקטיבית. במקום לשבת ולצפות פסיבית, כל אחד מדרג מדינות בזמן אמת תוך כדי השידור, משווה עם חברים — ובסוף הערב רואים מי ניבא הכי טוב!</p>
          </div>
          <div className="about-section">
            <h3>האתגרים שנפתרו</h3>
            <ul>
              <li>📱 UX שמאפשר לדרג 25 מדינות בקלות בזמן שהן מופיעות — drag-and-drop ו-collapse לניהול מקום</li>
              <li>👥 sync בזמן אמת לקבוצות עם כמה משתמשים בו-זמנית, ללא רענון</li>
              <li>🎯 5 שיטות ניקוד שונות — כי כל אחד "מנצח" בקטגוריה אחרת ויש מתח עד הסוף</li>
              <li>🔒 ניהול הרשאות — קפיאת דירוגים בדיוק כשהתוצאות האמיתיות יוצאות</li>
              <li>🔗 הצטרפות לקבוצה דרך invite link — בלחיצה אחת מווטסאפ ישירות לאפליקציה</li>
            </ul>
          </div>
          <div className="about-section">
            <h3>בנוי עם ❤️</h3>
            <p>פרויקט אישי — בנוי מאפס בשבועיים לאירוע ספציפי. מה שהתחיל כסקריפט פשוט הפך לאפליקציה מלאה עם auth, real-time DB, drag-and-drop, ו-5 מנגנוני ניקוד.</p>
          </div>
        </div>
      )}

      {tab === 'future' && (
        <div className="about-content">
          <div className="about-section">
            <h3>רעיונות ל-EuroFun V2 🚀</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text2)', marginBottom: '0.75rem' }}>
              מה תוכן גירסה הבאה — Eurovision 2027
            </p>
            <div className="future-list">
              <div className="future-item">
                <span className="future-num">01</span>
                <div>
                  <strong>הסברים ברורים יותר</strong>
                  <p>onboarding משופר, טיפים inline, ותיאורים ברורים לכל פיצ'ר</p>
                </div>
              </div>
              <div className="future-item">
                <span className="future-num">02</span>
                <div>
                  <strong>פורמט חצאי גמר</strong>
                  <p>תמיכה בשלבי Semi-Final 1 ו-2 לפני הגמר, עם ניחושי מעבר</p>
                </div>
              </div>
              <div className="future-item">
                <span className="future-num">03</span>
                <div>
                  <strong>שדרוג UI</strong>
                  <p>אנימציות, transitions חלקות, design system מקוהרנטי יותר</p>
                </div>
              </div>
              <div className="future-item">
                <span className="future-num">04</span>
                <div>
                  <strong>שם שיר + אמן + YouTube</strong>
                  <p>קישור לשיר של כל מדינה ישירות מהדירוג — ללחוץ ולשמוע</p>
                </div>
              </div>
              <div className="future-item">
                <span className="future-num">05</span>
                <div>
                  <strong>PWA — אפליקציה אמיתית</strong>
                  <p>התקנה על נייד, push notifications, עבודה עם קישוריות חלשה. מותאם לשימוש בזמן האירוויזיון</p>
                </div>
              </div>
              <div className="future-item">
                <span className="future-num">06</span>
                <div>
                  <strong>תפריט משופר</strong>
                  <p>ניווט תחתון (bottom nav) עם אייקונים, קל יותר לשימוש בנייד בזמן הצפייה</p>
                </div>
              </div>
              <div className="future-item">
                <span className="future-num">07</span>
                <div>
                  <strong>"אתה המדינה!"</strong>
                  <p>כל יוזר מדרג כמו מדינה — 12-10-8-7-6-5-4-3-2-1 לחברים הפייבוריטים שלו. פורמט הצבעה מורחב</p>
                </div>
              </div>
              <div className="future-item">
                <span className="future-num">08</span>
                <div>
                  <strong>חיפוש קבוצות וחברים</strong>
                  <p>מנוע חיפוש לקבוצות ציבוריות, הוספת חברים לפי שם משתמש</p>
                </div>
              </div>
              <div className="future-item">
                <span className="future-num">09</span>
                <div>
                  <strong>צ'אט מובנה בקבוצה</strong>
                  <p>תגובות בזמן אמת — "WOW ישראל 🔥" ישירות בתוך האפליקציה</p>
                </div>
              </div>
              <div className="future-item">
                <span className="future-num">10</span>
                <div>
                  <strong>סדר הופעות קבוע</strong>
                  <p>סדר המדינות ידוע מראש — הפול מסודר לפי סדר הופעות קבוע, ללא צורך בעריכה ידנית</p>
                </div>
              </div>
              <div className="future-item">
                <span className="future-num">11</span>
                <div>
                  <strong>התאמה לקהל הישראלי</strong>
                  <p>ממשק מלא בעברית, מדינות עם הערות על יחסים עם ישראל, ניחוש "מי יצביע לנו?"</p>
                </div>
              </div>
              <div className="future-item">
                <span className="future-num">12</span>
                <div>
                  <strong>שאלוני טריוויה ו-Under/Over</strong>
                  <p>מי ייתן לישראל 12 נקודות? כמה נקודות תקבל שוודיה? ניחושים קצרים שמוסיפים כיף לסרק</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
