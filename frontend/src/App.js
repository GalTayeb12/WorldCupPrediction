import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";

import HomePage    from "./components/HomePage";
import LoginForm    from "./components/LoginForm";
import RegisterForm from "./components/RegisterForm";
import UserProfile  from "./components/UserProfile";
import AboutModel   from "./components/AboutModel";
import Navbar       from "./components/Navbar";
import { AuthProvider } from "./components/AuthContext";
import "./styles/App.css";

// ── Token refresh ─────────────────────────────────────────────────────────────
const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem("refresh_token");
  if (!refreshToken) return null;
  try {
    const response = await axios.post("http://localhost:8000/api/refresh/", {
      refresh: refreshToken,
    });
    const newToken = response.data.access;
    localStorage.setItem("access_token", newToken);
    return newToken;
  } catch {
    return null;
  }
};

// ── Authenticated layout (navbar + page) ──────────────────────────────────────
function AuthLayout({ onLogout, children }) {
  return (
    <>
      <Navbar onLogout={onLogout} />
      <main className="page-content">{children}</main>
    </>
  );
}

// ── Route tree ────────────────────────────────────────────────────────────────
function AppContent({ token, onLogin, onLogout }) {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login"    element={<LoginForm onLogin={onLogin} />} />
      <Route path="/register" element={<RegisterForm />} />
      <Route path="/about"    element={<AboutModel />} />

      {/* Protected — main */}
      <Route
        path="/"
        element={
          token ? (
            <AuthLayout onLogout={onLogout}>
              <HomePage />
            </AuthLayout>
          ) : (
            <Navigate to="/login" />
          )
        }
      />

      {/* Protected — profile */}
      <Route
        path="/profile"
        element={
          token ? (
            <AuthLayout onLogout={onLogout}>
              <UserProfile token={token} />
            </AuthLayout>
          ) : (
            <Navigate to="/login" />
          )
        }
      />
    </Routes>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────
function App() {
  const [token, setToken] = useState(localStorage.getItem("access_token") || null);

  useEffect(() => {
    const checkToken = async () => {
      const access = localStorage.getItem("access_token");
      if (!access) return;
      try {
        await axios.get("http://localhost:8000/api/user/profile/", {
          headers: { Authorization: `Bearer ${access}` },
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
        <AppContent token={token} onLogin={handleLogin} onLogout={handleLogout} />
      </Router>
    </AuthProvider>
  );
}

export default App;
