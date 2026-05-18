export default function Instructions() {
  return (
    <div className="instructions-page">
      <h2 className="section-title">📖 הוראות המשחק</h2>

      <div className="instructions-section">
        <h3>🎤 איך משחקים?</h3>
        <ol>
          <li>תוך כדי הגמר — לחץ על מדינה מרשימת "ממתינות" כדי להוסיף אותה לדירוג שלך.</li>
          <li>גרור את המדינות לסדר הדירוג האישי שלך (הכי טוב למעלה).</li>
          <li>לכל מדינה אפשר להוסיף תיאור ההופעה, הערות, וציוני 1-10.</li>
          <li>הדירוג שלך מסונכרן בזמן אמת לכל הקבוצה.</li>
        </ol>
      </div>

      <div className="instructions-section">
        <h3>🏆 מערכת הניקוד — הצבעה קולקטיבית</h3>
        <p>10 המדינות הראשונות בדירוג שלך מקבלות נקודות Eurovision:</p>
        <div className="points-table">
          {[['🥇 מקום 1', '12'], ['🥈 מקום 2', '10'], ['🥉 מקום 3', '8'],
            ['4️⃣ מקום 4', '7'], ['5️⃣ מקום 5', '6'], ['6️⃣ מקום 6', '5'],
            ['7️⃣ מקום 7', '4'], ['8️⃣ מקום 8', '3'], ['9️⃣ מקום 9', '2'], ['🔟 מקום 10', '1'],
          ].map(([place, pts]) => (
            <div key={place} className="points-row">
              <span>{place}</span>
              <span className="pts-badge">{pts} נק׳</span>
            </div>
          ))}
        </div>
        <p>המדינה שאוספת הכי הרבה נקודות מכל המשתתפים — מנצחת!</p>
      </div>

      <div className="instructions-section">
        <h3>🔮 תחרות הניבוי (אחרי הגמר)</h3>
        <p>אחרי שיודעים את התוצאות האמיתיות, מחשבים מי ניבא הכי טוב:</p>
        <div className="formula-box">
          <p><strong>לכל מדינה שהכנסת לטופ 10 שגם הגיעה לטופ 10 האמיתי:</strong></p>
          <ul>
            <li>הפרש = |המקום שלך − המקום האמיתי|</li>
            <li>נקודות = max(0, 10 − הפרש)</li>
            <li>בונוס = +5 אם בול מדויק (הפרש = 0)</li>
          </ul>
          <p className="formula-example">
            דוגמה: שמת ישראל במקום 3, הם סיימו 3 → 10 + 5 = <strong>15 נקודות</strong><br />
            שמת שוודיה במקום 1, הם סיימו 4 → הפרש 3 → <strong>7 נקודות</strong><br />
            שמת יוון במקום 5, הם סיימו 11 → לא בטופ 10 → <strong>0 נקודות</strong>
          </p>
          <p><strong>מקסימום: 150 נקודות</strong> (10 ניחושים מדויקים)</p>
        </div>
      </div>

      <div className="instructions-section">
        <h3>👥 קבוצות</h3>
        <ul>
          <li>אפשר להיות בכמה קבוצות — הדירוג שלך משותף בכולן.</li>
          <li>לכל קבוצה יש שם + קוד סודי לשיתוף.</li>
          <li>ב-Live View רואים את הטופ 5 של כולם בזמן אמת.</li>
          <li>מנהל הקבוצה מזין את התוצאות האמיתיות אחרי הגמר.</li>
        </ul>
      </div>
    </div>
  );
}
