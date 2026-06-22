import { useEffect, useState } from "react";
import axios from "axios";
import API_URL from "../utils/api";
import "../styles/UserProfile.css";

// ── helpers ──────────────────────────────────────────────────────────────────

function fmt(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });
}

// ── main component ────────────────────────────────────────────────────────────

function UserProfile({ token }) {
  const [profile,     setProfile]     = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [stats,       setStats]       = useState(null);
  const [histError,   setHistError]   = useState(false);
  const [error,       setError]       = useState("");

  useEffect(() => {
    if (!token) { setError("Not authenticated."); return; }

    const headers = { Authorization: `Bearer ${token}` };

    // Profile
    axios
      .get(API_URL + "/api/user/profile/", { headers })
      .then((r) => setProfile(r.data))
      .catch(() => setError("Failed to load profile."));

    // Prediction history
    axios
      .get(API_URL + "/api/my_predictions/", { headers })
      .then((r) => setPredictions(r.data))
      .catch(() => setHistError(true));

    // Personal stats vs AI
    axios
      .get(API_URL + "/api/user-stats/", { headers })
      .then((r) => setStats(r.data))
      .catch(() => {}); // endpoint may not exist yet — fail silently
  }, [token]);

  if (error)    return <p className="up-error">{error}</p>;
  if (!profile) return <p className="up-loading">Loading…</p>;

  const initial    = (profile.full_name || profile.username || "?")[0].toUpperCase();
  const totalPreds = predictions?.length ?? 0;

  return (
    <div className="up-page">

      {/* ── Profile card ───────────────────────────────────── */}
      <div className="up-card">
        <div className="up-avatar">{initial}</div>

        <div className="up-info">
          <h2 className="up-name">{profile.full_name || profile.username}</h2>
          <p  className="up-username">@{profile.username}</p>

          <div className="up-meta-grid">
            {profile.email && (
              <div className="up-meta-item">
                <span className="up-meta-label">Email</span>
                <span className="up-meta-value">{profile.email}</span>
              </div>
            )}
            {profile.favorite_team && (
              <div className="up-meta-item">
                <span className="up-meta-label">Favorite team</span>
                <span className="up-meta-value">{profile.favorite_team}</span>
              </div>
            )}
            <div className="up-meta-item">
              <span className="up-meta-label">Member since</span>
              <span className="up-meta-value">{fmt(profile.date_joined)}</span>
            </div>
            <div className="up-meta-item">
              <span className="up-meta-label">Predictions made</span>
              <span className="up-meta-value up-meta-value--accent">{totalPreds}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Prediction history ──────────────────────────────── */}
      <section className="up-history">
        <h3 className="up-history-title">📋 My Prediction History</h3>

        {histError && (
          <p className="up-empty" style={{ color: "var(--color-danger)" }}>
            Could not load history.
          </p>
        )}

        {!histError && predictions && predictions.length === 0 && (
          <p className="up-empty">No predictions yet.</p>
        )}

        {!histError && predictions && predictions.length > 0 && (
          <div className="up-table-wrap">
            <table className="styled-table" style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Home Team</th>
                  <th>Away Team</th>
                  <th>AI Prediction</th>
                </tr>
              </thead>
              <tbody>
                {predictions.map((p, i) => (
                  <tr key={i}>
                    <td>{p.date}</td>
                    <td>{p.home_team}</td>
                    <td>{p.away_team}</td>
                    <td style={{ fontWeight: 600 }}>{p.predicted_result}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Personal stats vs AI ────────────────────────────── */}
      {stats && (
        <section className="up-stats-section">
          <h3 className="up-history-title">📊 My Score vs AI</h3>
          <div className="up-stats-grid">
            <div className="up-stat-card">
              <span className="up-stat-value">{stats.total ?? "—"}</span>
              <span className="up-stat-label">Total</span>
            </div>
            <div className="up-stat-card">
              <span className="up-stat-value">{stats.correct ?? "—"}</span>
              <span className="up-stat-label">Correct</span>
            </div>
            <div className="up-stat-card up-stat-card--accent">
              <span className="up-stat-value">
                {stats.user_accuracy != null ? `${stats.user_accuracy}%` : "—"}
              </span>
              <span className="up-stat-label">Accuracy</span>
            </div>
          </div>
        </section>
      )}

    </div>
  );
}

export default UserProfile;
