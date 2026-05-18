import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

const ANIMALS = ['🦁', '🐻', '🦊', '🐺', '🐸', '🦋', '🐧', '🐙', '🦄', '🐬', '🦅', '🐼', '🦝', '🐨', '🦩', '🦒', '🦓', '🐘', '🦘', '🦔'];

function randomAnimal() {
  return ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
}

interface Props {
  uid: string;
  username: string;
  onComplete: () => void;
}

const SLIDES = [
  {
    icon: '🎤',
    title: 'דירוג',
    desc: 'לחץ על מדינה מהרשימה כדי להוסיף אותה לדירוג. גרור את הכרטיסיות לסדר הרצוי, הוסף תיאורים, הערות וציונים (1–10) לכל הופעה.',
  },
  {
    icon: '🏆',
    title: 'טופ 10',
    desc: 'ה-10 מדינות הראשונות שלך מקבלות ניקוד Eurovision (12-1). ראה גם את הטופ הקבוצתי של כל קבוצה שאתה בה.',
  },
  {
    icon: '🎮',
    title: 'תחרות',
    desc: 'צור קבוצה עם חברים או הצטרף לקיימת. ב-RANKING תראה מה כולם מדרגים בזמן אמת. ב-BOARDS — ניבוי, לוח ניצחונות ותוצאות אמת.',
  },
  {
    icon: '🔮',
    title: 'ניבוי',
    desc: 'אחרי הגמר, אדמין הקבוצה מכניס את תוצאות Eurovision האמיתיות. כל חבר מקבל ניקוד לפי מידת הדיוק שלו בניבוי.',
  },
];

export default function Onboarding({ uid, username, onComplete }: Props) {
  const [step, setStep] = useState<'instructions' | 'profile'>('instructions');
  const [slideIndex, setSlideIndex] = useState(0);
  const [animal] = useState(randomAnimal);
  const [saving, setSaving] = useState(false);

  async function handleFinish() {
    setSaving(true);
    await updateDoc(doc(db, 'users', uid), {
      avatar: animal,
      onboardingComplete: true,
    });
    onComplete();
  }

  if (step === 'instructions') {
    const slide = SLIDES[slideIndex];
    const isLast = slideIndex === SLIDES.length - 1;
    return (
      <div className="onboarding-page">
        <div className="onboarding-card">
          <p className="onboarding-welcome">שלום {username}! ברוכים הבאים 🎉</p>
          <div className="onboarding-slide">
            <div className="onboarding-slide-icon">{slide.icon}</div>
            <h2 className="onboarding-slide-title">{slide.title}</h2>
            <p className="onboarding-slide-desc">{slide.desc}</p>
          </div>
          <div className="onboarding-dots">
            {SLIDES.map((_, i) => (
              <span
                key={i}
                className={`onboarding-dot ${i === slideIndex ? 'active' : ''}`}
                onClick={() => setSlideIndex(i)}
              />
            ))}
          </div>
          <div className="onboarding-nav">
            {slideIndex > 0 && (
              <button className="onboarding-btn secondary" onClick={() => setSlideIndex(i => i - 1)}>← הקודם</button>
            )}
            {!isLast ? (
              <button className="onboarding-btn primary" onClick={() => setSlideIndex(i => i + 1)}>הבא →</button>
            ) : (
              <button className="onboarding-btn primary" onClick={() => setStep('profile')}>הבנתי! →</button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="onboarding-page">
      <div className="onboarding-card">
        <h2>הפרופיל שלך</h2>
        <p className="hint-text">זה האימוג'י שיזהה אותך בקבוצה</p>
        <div className="profile-avatar-wrap large">
          <span className="profile-avatar-emoji">{animal}</span>
        </div>
        <p className="onboarding-animal-note">קיבלת חיה אקראית — אפשר לשנות מדף הפרופיל</p>
        <button
          className="onboarding-btn primary"
          onClick={handleFinish}
          disabled={saving}
        >
          {saving ? '...' : 'כניסה לאפליקציה →'}
        </button>
      </div>
    </div>
  );
}
