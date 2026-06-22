# World Cup Oracle — מפרט קומפוננטות (Frontend)

> מסמך זה מתאר את קומפוננטות ה-React של ה-Oracle: props, state, ומבנה. נועד למסירה ל-Claude Code יחד עם `TASKS.md` ו-`WorldCup_Oracle_Spec.md`.
> מחליף את הקומפוננטות הישנות (PredictionForm, Leaderboard, GroupLeaderboard, PredictionTable וכו') בתצוגה ממוקדת אחת.

---

## עץ הקומפוננטות

```
App
└── OracleScreen            ← המסך הראשי היחיד
    ├── SimulatorHero        ← כותרת + כפתור Run + stat cards
    ├── Bracket              ← 12 בתים + שלבי נוקאאוט
    │   ├── GroupCard ×12     ← בית בודד (4 קבוצות + מי עלה)
    │   └── KnockoutMatch ×N  ← משחק בודד בנוקאאוט (clickable)
    └── MatchExplain         ← פאנל "למה" (נפתח בלחיצה על משחק)
```

---

## שפת עיצוב (tokens.css)

צור `frontend/src/styles/tokens.css` עם המשתנים הבאים, וייבא ב-`index.css`:

```css
:root {
  --color-primary: #0F6E56;        /* ירוק דשא — צבע פעולה ראשי */
  --color-primary-light: #E1F5EE;  /* רקע מנצח ב-bracket */
  --color-gold: #BA7517;           /* גמר + גביע בלבד */
  --color-gold-light: #FAEEDA;
  --color-bg: #F8F9FA;
  --color-surface: #FFFFFF;
  --color-text: #1A1A1A;
  --color-text-muted: #6B7280;
  --color-border: #E5E7EB;
  --radius-md: 8px;
  --radius-lg: 12px;
  --font-display: 'Poppins', 'Segoe UI', sans-serif;  /* כותרות */
  --font-body: 'Inter', 'Segoe UI', sans-serif;       /* גוף */
}
```

חוקי שימוש: כחול `#007bff` הישן יורד לגמרי. זהב רק לגמר/גביע. ירוק לפעולות ולמנצחים. שני משקלי פונט בלבד (400, 500/600 לכותרות).

---

## 1. OracleScreen
**קובץ:** `components/OracleScreen.jsx`
**תפקיד:** מחזיק את ה-state של הסימולציה ומרכיב את שלוש הקומפוננטות.

**State:**
| state | טיפוס | תיאור |
|-------|-------|--------|
| `simulation` | object \| null | תוצאת `/api/simulate/` (ראה חוזה ב-Spec 7.3) |
| `loading` | bool | בזמן הרצת הסימולציה |
| `error` | string \| null | שגיאת רשת/שרת |
| `selectedMatch` | object \| null | המשחק שנלחץ (פותח את MatchExplain) |

**לוגיקה:**
- `runSimulation()` — `POST` ל-`http://localhost:8000/api/simulate/`, מעדכן `simulation`/`loading`/`error`.
- מעביר `onMatchClick={setSelectedMatch}` ל-Bracket.
- מרנדר MatchExplain רק כש-`selectedMatch !== null`.

---

## 2. SimulatorHero
**קובץ:** `components/SimulatorHero.jsx`
**Props:** `{ champion, winProbability, modelAccuracy, loading, onRun }`

**מבנה:**
- badge: "World Cup 2026 · 48 teams"
- כותרת: "World Cup Oracle" (font-display)
- תת-כותרת קצרה
- כפתור גדול ירוק "Run simulation" → קורא ל-`onRun`. במצב `loading` מציג ספינר + "Simulating…".
- שלושה stat cards: אלוף חזוי (`champion`), הסתברות (`winProbability`), דיוק מודל (`modelAccuracy`). מוצגים רק אחרי שיש תוצאה.

---

## 3. Bracket
**קובץ:** `components/Bracket.jsx`
**Props:** `{ groups, knockout, onMatchClick }`

**מבנה:**
- אזור 1 — שלב הבתים: grid של 12 `GroupCard` (3-4 בשורה, responsive).
- אזור 2 — נוקאאוט: עמודות לפי שלב (R32 → R16 → QF → SF → Final), כל משחק הוא `KnockoutMatch`.
- הגמר מודגש במסגרת זהב.

### 3a. GroupCard
**Props:** `{ name, standings }` (standings = מערך של {team, points, gd, rank_in_group, qualified})
- כותרת: "Group A"
- 4 שורות קבוצות, ממוינות. שתי הראשונות (qualified="winner"/"runner_up") מודגשות ירוק; שלישית שעלתה (best third) — סימון זהב קטן; רביעית דהויה.
- דגל (flag-icons) + שם + נקודות.

### 3b. KnockoutMatch
**Props:** `{ match, onClick }` (match = {home, away, winner, p_home, p_away})
- שתי שורות: home / away. המנצח רקע ירוק בהיר, המפסיד דהוי.
- אחוז ההסתברות לצד כל קבוצה.
- `onClick={() => onClick(match)}` — פותח את MatchExplain.
- hover: הדגשה קלה + cursor pointer.

---

## 4. MatchExplain
**קובץ:** `components/MatchExplain.jsx`
**Props:** `{ match, onClose }`

**מבנה (פאנל/מודאל):**
- כותרת: "Home vs Away" + דגלים.
- שלושה ברים: הסתברות Home Win / Draw / Away Win.
- רשימת הפיצ'רים שהשפיעו: הפרש דירוג פיפ"א, xG, צורה אחרונה, head-to-head (מגיע מ-`match.features` או endpoint נפרד).
- משפט הסבר בשפה פשוטה.
- כפתור סגירה → `onClose`.

> הערה: אם הסימולציה לא מחזירה features מפורטים לכל משחק, אפשר בשלב ראשון להציג רק הסתברויות, ולהשאיר את הפיצ'רים כ-TODO עד שהמודל החדש יספק אותם.

---

## 5. דגלים (flag-icons)
- `npm i flag-icons`, ייבא `import 'flag-icons/css/flag-icons.min.css'` ב-`index.js`.
- util `countryToISO(name)` → קוד דו-אותיות (למשל "Brazil" → "br"). שימוש: `<span className="fi fi-br" />`.
- צור מילון מיפוי לשמות שמופיעים בדאטה. שמות לא ידועים → placeholder אפור.

---

## ניקוי (מה יורד מה-UI)
הסר מ-`App.js` את הראוטים והרינדור של: LoginForm, RegisterForm, UserProfile, Leaderboard, GroupLeaderboard, PredictionTable, PredictionForm.
**אל תמחק את קבצי הקומפוננטות ולא את קוד הבאק שלהן** — רק נתק מה-UI. ה-router יכול להישאר עם route ראשי יחיד ל-OracleScreen.

---

## סדר בנייה מומלץ (תואם TASKS.md שלב 1)
1. tokens.css (T1.1)
2. ניקוי App.js + route יחיד (T2.4)
3. SimulatorHero עם mock data (T1.3)
4. flag-icons util (T1.4)
5. GroupCard + Bracket + KnockoutMatch עם mock data (T1.5)
6. MatchExplain (T1.6)
7. חיבור ל-/api/simulate/ אמיתי (T3.1)
