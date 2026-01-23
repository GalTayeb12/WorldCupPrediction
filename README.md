# WorldCupPrediction ⚽🤖

WorldCupPrediction is a full-stack **AI-based World Cup match outcome simulator**.  
Users can register, log in, predict match results, compare their predictions against a machine-learning model, and view global and group leaderboards.

This project is designed as a **simulation platform** and does not require real-time match updates.

---

## 🚀 Main Features
- User registration & authentication using JWT
- Match outcome prediction (Home Win / Draw / Away Win)
- Save user predictions
- Compare user accuracy vs AI model accuracy
- Global leaderboard
- Group-based leaderboard
- User profile page

---

## 🧠 Machine Learning Model & Data
The backend uses a pre-trained ML model to predict match outcomes based on:
- FIFA rankings
- Group statistics (goals, wins, losses, goal difference, etc.)

The model outputs a predicted result for a given match and is intended for **educational and analytical purposes**.

---

## 🏗️ Tech Stack

### Backend
- Django
- Django REST Framework
- SimpleJWT (access & refresh tokens)
- Pandas
- Joblib
- CORS headers

### Frontend
- React
- Axios
- React Router


---

## 🔌 API Endpoints

Authentication:
- `POST /api/register/` – Register a new user
- `POST /api/login/` – Obtain JWT tokens
- `POST /api/refresh/` – Refresh access token

Predictions:
- `POST /api/predict/` – Predict match outcome
- `POST /api/save/` – Save prediction (authenticated)

User & Leaderboards:
- `GET /api/my_predictions/` – User prediction history
- `GET /api/leaderboard/` – Global leaderboard
- `GET /api/group-leaderboard/` – Group leaderboard
- `GET /api/user/profile/` – User profile data

---

## 🖥️ Running the Project Locally

### Backend (Django)
#```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate
# Mac/Linux: source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver


# 🔒 Notes

Do not commit .env files, virtual environments, or node_modules
Large model files should be handled via Git LFS or external storage
This project is intended for learning, experimentation, and demonstration

# 📜 License

This project is provided for educational and demo purposes only.