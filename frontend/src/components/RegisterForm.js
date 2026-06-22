import { useState } from "react";
import axios from "axios";
import API_URL from "../utils/api";
import { useNavigate } from "react-router-dom";
import "../styles/AuthForms.css";

function RegisterForm() {
  const [username,        setUsername]        = useState("");
  const [fullName,        setFullName]        = useState("");
  const [email,           setEmail]           = useState("");
  const [password,        setPassword]        = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [favoriteTeam,    setFavoriteTeam]    = useState("");
  const [error,           setError]           = useState("");
  const [loading,         setLoading]         = useState(false);
  const [showSuccess,     setShowSuccess]     = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setShowSuccess(false);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API_URL}/api/register/", {
        username,
        password,
        email,
        full_name:     fullName,
        favorite_team: favoriteTeam,
        // group_name removed (CHANGES_v3)
      });

      setShowSuccess(true);
      setTimeout(() => {
        navigate("/login", {
          state: { successMessage: "Registration successful! Please sign in." },
        });
      }, 2000);
    } catch (err) {
      const data = err.response?.data;
      // DRF returns field errors as arrays; flatten to a readable string
      if (data && typeof data === "object") {
        const messages = Object.entries(data)
          .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(" ") : msgs}`)
          .join(" · ");
        setError(messages);
      } else {
        setError("Registration failed. Please try again.");
      }
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
        <p className="auth-hero__sub">Join thousands of fans predicting the tournament</p>
      </div>

      {/* ── Form card ── */}
      <div className="auth-card-wrap">
      <div className="auth-card">

        {/* Header */}
        <div className="auth-header">
          <div className="auth-icon" aria-hidden="true">⚽</div>
          <h1 className="auth-title">Create account</h1>
          <p className="auth-subtitle">Join World Cup Oracle and track your predictions</p>
        </div>

        {showSuccess && (
          <div className="auth-success">🎉 Registration successful! Redirecting…</div>
        )}

        {/* Form */}
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <input
            className="form-input"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
          />
          <input
            className="form-input"
            placeholder="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            autoComplete="name"
            required
          />
          <input
            className="form-input"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
          <input
            className="form-input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
          <input
            className="form-input"
            type="password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
          <input
            className="form-input"
            placeholder="Favorite team (optional)"
            value={favoriteTeam}
            onChange={(e) => setFavoriteTeam(e.target.value)}
          />

          <button className="auth-submit" type="submit" disabled={loading || showSuccess}>
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        {error && <p className="auth-error">{error}</p>}

        {/* Footer */}
        <p className="auth-footer">
          Already have an account?{" "}
          <button className="auth-link-btn" onClick={() => navigate("/login")}>
            Sign in
          </button>
        </p>

      </div>
      </div>  {/* auth-card-wrap */}
    </div>
  );
}

export default RegisterForm;
