# World Cup Oracle — משימות ל-Claude Code

> מסמך זה נועד למסירה ל-Claude Code. כל משימה אטומית: מה לעשות, באילו קבצים, ומה התוצאה הצפויה.
> קרא קודם את `WorldCup_Oracle_Spec.md` לקונטקסט המלא. בצע לפי הסדר; אל תדלג שלבים.
> אחרי כל משימה — ודא שהפרויקט עדיין רץ (`npm start` / `python manage.py runserver`) לפני שתמשיך.

---

## שלב 0 — היגיינה והכנה

### T0.1 — להוסיף את הפרונט ל-git
- תיקיית `frontend/` ריקה בריפו (קוד ה-React לא קומיט). ודא שקוד ה-React נכנס ל-git.
- בדוק ש-`.gitignore` מתעלם רק מ-`frontend/node_modules/` ו-`frontend/build/`, לא מ-`frontend/src/`.
- **תוצאה:** `git status` מראה את קבצי ה-src של React כ-tracked.

### T0.2 — לתעד את ה-API הקיים
- צור `docs/API.md` שמתעד את כל ה-endpoints הקיימים (מתוך `predictor/urls.py`).
- **תוצאה:** טבלה של method + path + auth + תיאור.

---

## שלב 1 — עיצוב (עדיפות ראשונה)

### T1.1 — Design tokens
- צור `frontend/src/styles/tokens.css` עם משתני CSS:
  - צבעים: `--color-primary: #0F6E56` (ירוק דשא), `--color-gold: #BA7517` (גמר/גביע בלבד), ניטרלים, רקעים, טקסט.
  - טיפוגרפיה: משפחת פונט, גדלים (h1=30, h2=18, body=16), משקלים (400, 500 בלבד).
  - מרווחים, `--radius-md: 8px`, `--radius-lg: 12px`.
- ייבא ב-`index.css`. החלף את `#007bff` בכל מקום במשתנה.
- **תוצאה:** כל הצבעים מגיעים ממשתנים; אין hex קשיח ב-`App.js`.

### T1.2 — להוציא inline styles מ-App.js
- כל ה-`style={{...}}` ב-`App.js` (הכפתורים) → מחלקות CSS בקובץ ייעודי.
- **תוצאה:** `App.js` בלי inline styles; כפתורים עם class.

### T1.3 — מסך ראשי חדש (Hero)
- צור `frontend/src/components/SimulatorHero.jsx`:
  - כותרת + תת-כותרת + כפתור גדול "Run simulation" (ירוק).
  - badge "World Cup 2026 · 48 teams".
  - 3 stat cards (אלוף חזוי / הסתברות / דיוק) — מוזנים מתוצאת הסימולציה.
- **תוצאה:** המסך הראשי מציג hero במקום טופס + טבלאות.

### T1.4 — דגלים אמיתיים
- התקן `flag-icons` (`npm i flag-icons`), ייבא ה-CSS.
- צור util שממפה שם מדינה → קוד ISO דו-אותיות.
- **תוצאה:** דגלים אמיתיים מופיעים ליד שמות קבוצות.

### T1.5 — קומפוננטת Bracket
- צור `frontend/src/components/Bracket.jsx`:
  - תצוגת בתים (12) + שלבי נוקאאוט (32→16→8→4→final).
  - מנצח מודגש ברקע ירוק בהיר, מפסיד דהוי, אחוז לצד כל קבוצה.
  - הגמר/הגביע בזהב.
  - לחיצה על משחק → callback לפתיחת פאנל הסבר.
- **תוצאה:** bracket מתרנדר מתוך JSON של `/api/simulate/` (בשלב זה אפשר עם mock data).

### T1.6 — פאנל הסבר משחק
- צור `frontend/src/components/MatchExplain.jsx`:
  - מציג הסתברות תוצאה + הפיצ'רים שהשפיעו + משפט הסבר.
- **תוצאה:** לחיצה על משחק פותחת את הפאנל עם הנתונים.

---

## שלב 2 — באק: סימולציה לפורמט 48

### T2.1 — מודול סימולציה
- צור `predictor/simulation.py`:
  - `simulate_group(teams)` — round-robin, דירוג לפי נקודות → הפרש שערים → שערים → h2h.
  - `pick_best_thirds(groups)` — אוסף 12 שלישיות, מדרג, מחזיר 8.
  - `build_round_of_32(winners, runners_up, best_thirds)` — שיבוץ לפי טבלת פיפ"א.
  - `simulate_knockout(matches)` — שלב 32 → ... → גמר.
  - `simulate_tournament()` — מריץ הכל, מחזיר את ה-JSON לפי החוזה בסעיף 7.3 של הספק.
- השתמש ב-`predict_proba` של המודל לכל משחק.
- **תוצאה:** `simulate_tournament()` מחזיר dict מלא ותקין.

### T2.2 — Endpoint
- ב-`predictor/views.py` + `urls.py`: הוסף `POST /api/simulate/` (ללא auth) שקורא ל-`simulate_tournament()`.
- **תוצאה:** `curl -X POST localhost:8000/api/simulate/` מחזיר JSON תקין.

### T2.3 — תיקון באג הדיוק
- הסר `actual_result = predicted_label` מ-`save_prediction`.
- **תוצאה:** הדיוק כבר לא מזויף (גם אם ה-endpoint יורד מה-UI).

### T2.4 — להוריד endpoints מה-UI (לא מהקוד)
- ב-React: הסר את הראוטים/קומפוננטות של login, register, profile, leaderboard, group-leaderboard, predictions מה-UI הראשי.
- השאר את קבצי הבאק שלהם במקום (לא למחוק).
- **תוצאה:** ה-UI מציג רק את הסימולטור; הקוד של ה-auth נשאר בריפו.

---

## שלב 3 — חיבור

### T3.1 — חיבור פרונט לסימולציה
- ב-`SimulatorHero`: כפתור "Run simulation" → קריאת `POST /api/simulate/` → מצב loading → רינדור `Bracket` + stat cards מהתשובה.
- **תוצאה:** לחיצה אחת מריצה את כל הזרימה end-to-end.

### T3.2 — בדיקה
- ודא: המסך נטען, הכפתור עובד, ה-bracket מתמלא, לחיצה על משחק פותחת הסבר.
- **תוצאה:** flow מלא עובד מקומית.

---

## הערות ל-Claude Code
- **אל תיגע במודל עצמו** (`world_cup_model.pkl`) — שיפור המודל מתבצע בנפרד ב-Colab ויחליף את ה-pkl. עבוד מול ה-pkl הקיים בינתיים.
- אם המודל הקיים לא תומך ב-`predict_proba` או דורש פיצ'רים שונים — ציין זאת ועצור, אל תמציא פיצ'רים.
- רשימת 48 הקבוצות + הבתים: אם לא קיימת בפרויקט, השתמש ב-placeholder וסמן TODO.
