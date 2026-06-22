import { useState } from "react";
import axios from "axios";
import API_URL from "../utils/api";
import "../styles/MatchPredictor.css";

// All 48 teams from OFFICIAL_GROUPS, alphabetically sorted
const ALL_TEAMS = [
  "Algeria", "Argentina", "Australia", "Austria",
  "Belgium", "Bosnia and Herzegovina", "Brazil",
  "Canada", "Cape Verde", "Colombia", "Croatia", "Cuba", "Curaçao",
  "Czech Republic",
  "DR Congo",
  "Ecuador", "Egypt", "England",
  "France",
  "Germany", "Ghana",
  "Haiti",
  "Iran", "Iraq",
  "Japan", "Jordan",
  "Mexico", "Morocco",
  "Netherlands", "New Zealand", "Norway",
  "Panama", "Paraguay", "Portugal",
  "Qatar",
  "Saudi Arabia", "Scotland", "Senegal", "Slovenia", "South Africa",
  "South Korea", "Spain", "Sweden", "Switzerland",
  "Tunisia", "Turkey",
  "United States", "Uruguay", "Uzbekistan",
];

const OUTCOME_CONFIG = [
  { key: "home",  label: "Home Win", color: "var(--color-primary)" },
  { key: "draw",  label: "Draw",     color: "var(--color-text-muted)" },
  { key: "away",  label: "Away Win", color: "var(--color-gold)" },
];

function ProbBar({ label, pct, color }) {
  return (
    <div className="mp-bar-row">
      <span className="mp-bar-label">{label}</span>
      <div className="mp-bar-track">
        <div
          className="mp-bar-fill"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="mp-bar-pct">{pct}%</span>
    </div>
  );
}

function buildShareText(home, away, result, probs) {
  // Derive winner label and confidence from the prediction
  let winner, confidence;
  if (result.prediction === "Draw") {
    winner     = "a Draw";
    confidence = Math.round(probs.draw * 100);
  } else if (result.prediction.includes(home)) {
    winner     = home;
    confidence = Math.round(probs.home * 100);
  } else {
    winner     = away;
    confidence = Math.round(probs.away * 100);
  }
  return `⚽ ${home} vs ${away} — AI predicts ${winner} with ${confidence}% confidence. Check it yourself 🔮 worldcup-ai.vercel.app`;
}

export default function MatchPredictor() {
  const [home, setHome]         = useState("");
  const [away, setAway]         = useState("");
  const [result, setResult]     = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied]     = useState(false);

  const canPredict = home && away && home !== away;

  const predict = async () => {
    setResult(null);
    setError(null);
    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const { data } = await axios.post(
        `${API_URL}/api/predict/`,
        { home_team: home, away_team: away },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.error ?? "Prediction failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const probs = result?.probabilities ?? null;

  return (
    <section className="mp-section">
      <h2 className="mp-title">Match Predictor</h2>
      <p className="mp-subtitle">Select two teams and get instant win probabilities</p>

      <div className="mp-controls">
        <div className="mp-team-row">
          <select
            className="mp-select"
            value={home}
            onChange={(e) => { setHome(e.target.value); setResult(null); }}
          >
            <option value="">Home team…</option>
            {ALL_TEAMS.filter((t) => t !== away).map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          <span className="mp-vs">vs</span>

          <select
            className="mp-select"
            value={away}
            onChange={(e) => { setAway(e.target.value); setResult(null); }}
          >
            <option value="">Away team…</option>
            {ALL_TEAMS.filter((t) => t !== home).map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <button
          className="mp-btn"
          onClick={predict}
          disabled={!canPredict || loading}
        >
          {loading
            ? <><span className="mp-spinner" /> Predicting…</>
            : "Predict"}
        </button>
      </div>

      {error && <p className="mp-error">{error}</p>}

      {probs && (
        <div className="mp-result">
          <div className="mp-matchup">
            <span className="mp-matchup-team">{home}</span>
            <span className="mp-matchup-sep">vs</span>
            <span className="mp-matchup-team">{away}</span>
          </div>

          <div className="mp-bars">
            {OUTCOME_CONFIG.map(({ key, label, color }) => (
              <ProbBar
                key={key}
                label={key === "home" ? `${home} win` : key === "away" ? `${away} win` : label}
                pct={Math.round(probs[key] * 100)}
                color={color}
              />
            ))}
          </div>

          <p className="mp-verdict">
            Prediction: <strong>{result.prediction}</strong>
          </p>

          {/* Share trigger */}
          <button
            className="mp-share-btn"
            onClick={() => { setShowShare((s) => !s); setCopied(false); }}
          >
            🔮 I already know who wins
          </button>

          {/* Share card */}
          {showShare && (() => {
            const shareText = buildShareText(home, away, result, probs);
            return (
              <div className="mp-share-card">
                <p className="mp-share-card__text">{shareText}</p>
                <div className="mp-share-actions">
                  <button
                    className="mp-share-action-btn"
                    onClick={() => {
                      navigator.clipboard.writeText(shareText).then(() => {
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      });
                    }}
                  >
                    {copied ? "✅ Copied!" : "📋 Copy Text"}
                  </button>
                  <button
                    className="mp-share-action-btn mp-share-action-btn--x"
                    onClick={() =>
                      window.open(
                        "https://twitter.com/intent/tweet?text=" +
                          encodeURIComponent(shareText),
                        "_blank",
                        "noopener,noreferrer",
                      )
                    }
                  >
                    𝕏 Share on X
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </section>
  );
}
