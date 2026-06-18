import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import axios from "axios";

import PredictionForm from "./components/PredictionForm";
import Leaderboard from "./components/Leaderboard";
import PredictionTable from "./components/PredictionTable";
import LoginForm from "./components/LoginForm";
import RegisterForm from "./components/RegisterForm";
import GroupLeaderboard from "./components/GroupLeaderboard";
import UserProfile from "./components/UserProfile";
import { AuthProvider } from "./components/AuthContext";
import "./styles/App.css";

// פונקציה לרענון טוקן
const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem("refresh_token");
  if (!refreshToken) return null;

  try {
    const response = await axios.post("http://localhost:8000/api/refresh/", {
      refresh: refreshToken,
    });

    const newAccessToken = response.data.access;
    localStorage.setItem("access_token", newAccessToken);
    return newAccessToken;
  } catch (err) {
    console.error("🔁 Token refresh failed", err);
    return null;
  }
};

function AppContent({ token, onLogout, onLogin }) {
  const [refreshFlag, setRefreshFlag] = useState(false);
  const navigate = useNavigate();

  return (
    <Routes>
      <Route path="/login" element={<LoginForm onLogin={onLogin} />} />
      <Route path="/register" element={<RegisterForm />} />
      <Route
        path="/profile"
        element={
          token ? (
            <>
              <div className="app-navbar">
                <button className="btn btn-primary" onClick={() => navigate("/")}>
                  ← Back to Home
                </button>
                <button className="btn btn-danger" onClick={onLogout}>
                  Logout
                </button>
              </div>
              <UserProfile token={token} />
            </>
          ) : (
            <Navigate to="/login" />
          )
        }
      />
      <Route
        path="/"
        element={
          token ? (
            <>
              <div className="app-navbar">
                <button className="btn btn-primary" onClick={() => navigate("/profile")}>
                  My Profile
                </button>
                <button className="btn btn-danger" onClick={onLogout}>
                  Logout
                </button>
              </div>

              <PredictionForm token={token} onPredictionSaved={() => setRefreshFlag((prev) => !prev)} />
              <hr />
              <Leaderboard refreshFlag={refreshFlag} />
              <hr />
              <GroupLeaderboard />
              <hr />
              <PredictionTable token={token} refreshFlag={refreshFlag} />
            </>
          ) : (
            <Navigate to="/login" />
          )
        }
      />
    </Routes>
  );
}

function App() {
  const [token, setToken] = useState(localStorage.getItem("access_token") || null);

  useEffect(() => {
    const checkToken = async () => {
      let access = localStorage.getItem("access_token");

      try {
        await axios.get("http://localhost:8000/api/user/profile/", {
          headers: { Authorization: `Bearer ${access}` }
        });
        setToken(access);
      } catch (err) {
        if (err.response?.status === 401) {
          const newToken = await refreshAccessToken();
          if (newToken) {
            setToken(newToken);
          } else {
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
            setToken(null);
          }
        }
      }
    };

    checkToken();
  }, []);

  const handleLogin = (newToken) => {
    localStorage.setItem("access_token", newToken);
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setToken(null);
  };

  return (
    <AuthProvider>
      <Router>
        <div className="container">
          <h1>World Cup AI Simulator</h1>
          <AppContent token={token} onLogin={handleLogin} onLogout={handleLogout} />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
