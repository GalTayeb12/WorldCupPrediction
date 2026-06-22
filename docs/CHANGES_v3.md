# עדכון מוצר v3 — החזרת המשתמשים + תחזית משחק בודד

> **חשוב:** מסמך זה גובר על חלקים ב-`WorldCup_Oracle_Spec.md`, `TASKS.md` ו-`COMPONENTS.md` שמדברים על "הורדת מערכת המשתמשים מה-UI" או "מחיקת ההתחברות". אותם חלקים בטלים. קרא מסמך זה לצד האחרים.

## מה השתנה

ההחלטה הקודמת (סימולטור ציבורי בלבד, בלי משתמשים) **בוטלה**. המוצר כולל עכשיו שני חלקים:

### חלק 1 — הסימולטור (ציבורי, בלי התחברות)
- לחיצת כפתור → עץ מונדיאל 48 קבוצות מלא. בדיוק כפי שתואר ב-Spec.

### חלק 2 — תחזית משחק בודד (דורש התחברות)
- משתמש מחובר מכניס 2 קבוצות → המודל מחזיר מי ינצח.
- הניחוש **נשמר בהיסטוריה של הפרופיל** — פנקס אישי של "מה המודל חזה".
- **אין השוואה לתוצאות אמת.** ההיסטוריה שומרת רק את תחזית המודל + התאריך + הקבוצות. זה כלי תזכורת למשתמש, לא מעקב דיוק.

## מה נשאר בקוד (לא מוחקים)
- התחברות, הרשמה, JWT, פרופיל, היסטוריית ניחושים.
- מודלים: `User`, `UserProfile` (שם + קבוצה אהובה), והיסטוריית ניחושים.

## מה יורד (מוחקים מה-UI ומהבאק)
- `leaderboard` ו-`group-leaderboard` — אין יותר תחרות בין משתמשים.
- כל לוגיקת ההשוואה user-vs-AI.
- הבאג `actual_result = predicted_label` — נמחק יחד עם ה-leaderboard.
- מודל `UserPrediction` משתנה: השדות `actual_result`, `user_prediction`, `correct_prediction` יורדים. נשארים: `user`, `home_team`, `away_team`, `predicted_result`, `created_at`.

## הרשאות (auth) — מי צריך להתחבר
| פעולה | endpoint | התחברות |
|--------|----------|----------|
| הרצת סימולציה | `POST /api/simulate/` | ❌ ציבורי |
| תחזית משחק בודד | `POST /api/predict/` | ✅ **דורש התחברות** (שינוי! היום זה ציבורי) |
| שמירת ניחוש | `POST /api/save/` | ✅ |
| היסטוריית ניחושים | `GET /api/my_predictions/` | ✅ |
| פרופיל | `GET /api/user/profile/` | ✅ |
| הרשמה / לוגין / refresh | קיים | ❌ |

## שינוי ב-save_prediction (תיקון הבאג)
הקוד הישן שמר `actual_result = predicted_label` (זייף דיוק). הפונקציה החדשה פשוט שומרת את תחזית המודל:
```
UserPrediction.objects.create(
    user=user,
    home_team=home,
    away_team=away,
    predicted_result=predicted_label,
)
```
בלי `actual_result`, בלי `correct_prediction`, בלי השוואה.

## עדכון מבנה ה-UI (גובר על COMPONENTS.md)
```
App
├── (route ציבורי) "/"          → OracleScreen (הסימולטור)
├── (route) "/predict"           → SingleMatchPredict (דורש התחברות)
├── (route) "/profile"           → Profile + PredictionHistory (דורש התחברות)
├── (route) "/login"             → LoginForm
└── (route) "/register"          → RegisterForm
```
- ניווט עליון: לוגו → בית (סימולטור). אם מחובר: "תחזית משחק", "הפרופיל שלי", "Logout". אם לא: "התחבר".
- הסימולטור נגיש לכולם. לחיצה על "תחזית משחק" כשלא מחובר → הפניה ל-login.

## קומפוננטות חדשות (בנוסף ל-COMPONENTS.md)
- `SingleMatchPredict.jsx` — טופס 2 קבוצות + תוצאת המודל + כפתור "שמור לפרופיל".
- `PredictionHistory.jsx` — טבלת הניחושים השמורים (תאריך, בית, חוץ, תחזית).
- שמור/שדרג את הקיימים: `LoginForm`, `RegisterForm`, `UserProfile`, `AuthContext`.

## עדכון תוכנית העבודה (TASKS)
- **בטל** את T2.4 (הורדת auth מה-UI) ואת הוראת המחיקה.
- **השאר** את שלב 1 (עיצוב) כפי שהוא — tokens, hero, bracket לא תלויים בזה.
- **הוסף** אחרי שלב העיצוב:
  - בניית `SingleMatchPredict` + עיצוב מחדש שלו לפי tokens.
  - בניית `PredictionHistory`.
  - הגדרת `predict` כ-`IsAuthenticated`.
  - מחיקת leaderboard/group-leaderboard + תיקון save + migration.
  - עיצוב מחדש של LoginForm/RegisterForm/UserProfile לפי שפת העיצוב החדשה.

---

# עדכון v3.1 — כל המערכת דורשת התחברות (גובר על v3 למעלה)

**תיקון:** ההבחנה בין "סימולטור ציבורי" ל"תחזית מוגנת" בוטלה. **כל המערכת מאחורי login** — כולל הסימולטור.

## הרשאות מתוקנות
| פעולה | endpoint | התחברות |
|--------|----------|----------|
| הרצת סימולציה | `POST /api/simulate/` | ✅ **דורש התחברות** (שונה מ-v3) |
| תחזית משחק בודד | `POST /api/predict/` | ✅ |
| שמירת ניחוש | `POST /api/save/` | ✅ |
| היסטוריה | `GET /api/my_predictions/` | ✅ |
| פרופיל | `GET /api/user/profile/` | ✅ |
| הרשמה / לוגין / refresh | קיים | ❌ (אלה ה-endpoints היחידים הציבוריים) |

## מבנה UI מתוקן
- **אין route ציבורי.** מבנה ה-`App.js` הקיים (ניתוב ל-`/login` כשאין טוקן) נשאר — הוא הבסיס הנכון.
- כל ה-routes (`/` הסימולטור, `/predict`, `/profile`) עטופים בבדיקת token.
- ה-`useEffect` שבודק טוקן מול הבאק — **נשאר** (לא מסירים).

## פיתוח
- כל המערכת דורשת התחברות → בזמן פיתוח מריצים את הבאק במקביל לפרונט (זו התנהגות מכוונת, לא באג):
  - טרמינל 1 (שורש): `python manage.py runserver`
  - טרמינל 2 (frontend): `npm start`
