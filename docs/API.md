# World Cup Oracle — תיעוד API

> מתעד את ה-endpoints הקיימים בבאק (Django + DRF). נכון למצב הריפו לפני שינויי ה-Oracle.
> בסיס: `http://localhost:8000/api/`  ·  אימות: JWT (SimpleJWT) דרך header `Authorization: Bearer <access>`.

## אימות (Authentication)

| Method | Path | Auth | תיאור |
|--------|------|------|--------|
| POST | `/api/register/` | — | רישום משתמש. גוף: `username, password, email, full_name, favorite_team, group_name`. יוצר `User` + `UserProfile`. |
| POST | `/api/login/` | — | קבלת טוקני JWT. גוף: `username, password`. מחזיר `access`, `refresh`. |
| POST | `/api/refresh/` | — | רענון access token. גוף: `refresh`. מחזיר `access` חדש. |

## תחזית (Prediction)

| Method | Path | Auth | תיאור |
|--------|------|------|--------|
| POST | `/api/predict/` | — | תחזית למשחק בודד. גוף: `home_team, away_team`. מחזיר `prediction` (Home Win/Draw/Away Win) + `features` (dict הסבר). |
| POST | `/api/save/` | ✓ | שמירת תחזית משתמש. גוף: `features` (כולל `home_team, away_team, user_prediction`). ⚠️ באג: שומר `actual_result = predicted_label` — לתיקון (T2.3). |

## משתמש ולוחות תוצאות (User & Leaderboards)

| Method | Path | Auth | תיאור |
|--------|------|------|--------|
| GET | `/api/my_predictions/` | ✓ | היסטוריית תחזיות המשתמש המחובר. |
| GET | `/api/leaderboard/` | — | לוח תוצאות גלובלי. דיוק user מול AI לכל משתמש. ⚠️ מסתמך על השדה השבור מ-save. |
| GET | `/api/group-leaderboard/` | — | לוח תוצאות לפי קבוצה (`UserProfile.group_name`). |
| GET | `/api/user/profile/` | ✓ | פרטי הפרופיל של המשתמש המחובר. |

## אדמין (Admin)

| Method | Path | Auth | תיאור |
|--------|------|------|--------|
| GET | `/api/admin/users/` | Admin | רשימת כל המשתמשים (IsAdminUser). |
| GET | `/api/users/` | ✓ | כל המשתמשים (id, username, email, date_joined). |

## פיצ'רים שהמודל מקבל (preprocess_input)
סדר הפיצ'רים שנשלחים למודל הקיים (10):
`home_rank, away_rank, rank_diff, xg_diff, goals_scored_diff, goal_diff, wins_diff, xga_diff, rank_ratio, xg_ratio`

> ⚠️ הערה לשיפור המודל: `xg_diff`, `wins_diff` וכו' מגיעים מ-`group_stats.csv` שהם נתוני מונדיאל 2022 עצמו (דליפת נתונים). המודל החדש יחליף את סט הפיצ'רים — לעדכן את החוזה הזה בהתאם.

## Endpoints חדש מתוכנן (Oracle)

| Method | Path | Auth | תיאור |
|--------|------|------|--------|
| POST | `/api/simulate/` | — | **חדש.** מריץ סימולציית מונדיאל 48 מלאה. מחזיר groups, best_thirds, knockout, champion, championship_odds. ראה חוזה מלא בספק סעיף 7.3. |
