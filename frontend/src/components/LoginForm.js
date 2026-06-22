import { useState } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/AuthForms.css";

function LoginForm({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const successMessage = location.state?.successMessage;

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await axios.post("http://localhost:8000/api/login/", {
        username,
        password,
      });

      const { access, refresh } = response.data;
      localStorage.setItem("access_token", access);
      localStorage.setItem("refresh_token", refresh);

      onLogin(access);
      navigate("/");
    } catch (err) {
      console.error("Login error:", err.response?.data || err.message);
      setError(
        err.response?.status === 401
          ? "Invalid username or password."
          : "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">

      {/* ── Branding hero ── */}
      <div className="auth-hero">
        <div className="auth-hero__icon" aria-hidden="true">⚽</div>
        <h1 className="auth-hero__title">World Cup 2026 · AI Predictor</h1>
        <p className="auth-hero__sub">Predict the future of the beautiful game</p>
      </div>

      {/* ── Form card ── */}
      <div className="auth-card-wrap">
      <div className="auth-card">

        {/* Header */}
        <div className="auth-header">
          <div className="auth-icon" aria-hidden="true">🏆</div>
          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-subtitle">Sign in to access World Cup Oracle</p>
        </div>

        {/* Post-registration success */}
        {successMessage && (
          <div className="auth-success">🎉 {successMessage}</div>
        )}

        {/* Form */}
        <form className="auth-form" onSubmit={handleLogin} noValidate>
          <input
            className="form-input"
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
          />
          <input
            className="form-input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        {error && <p className="auth-error">{error}</p>}

        {/* Footer */}
        <p className="auth-footer">
          Don&apos;t have an account?{" "}
          <button className="auth-link-btn" onClick={() => navigate("/register")}>
            Create one
          </button>
        </p>

      </div>
      </div>  {/* auth-card-wrap */}
    </div>
  );
}

export default LoginForm;
