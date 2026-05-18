import { useState } from 'react';

type AboutTab = 'tech' | 'why';

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
              <li>🌐 <strong>RTL-first</strong> — עיצוב CSS ייעודי לעברית ומובייל, direction: rtl לאורך כל האפליקציה</li>
              <li>📊 <strong>5 scoring algorithms</strong> — חישובי ניקוד מגוונים: linear, squared, bulls-eye, tiers, league</li>
              <li>🔒 <strong>Admin freeze</strong> — נעילת דירוגים ברגע שהתוצאות יוצאות, דרך Firestore config document</li>
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
              <li>📱 UX שמאפשר לדרג 25 מדינות בקלות בזמן שהן מופיעות — drag-and-drop מהיר ו-collapse לניהול מקום</li>
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
    </div>
  );
}
