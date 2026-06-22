import { useNavigate } from "react-router-dom";
import "../styles/Home.css";
import "../styles/AboutModel.css";

const FEATURES = [
  { icon: "⚡", text: "Elo Rating Difference (home vs away)" },
  { icon: "🏆", text: "FIFA World Ranking Difference" },
  { icon: "📈", text: "Recent Form — last 5 matches points" },
  { icon: "🤝", text: "Head-to-Head home win rate" },
  { icon: "🌍", text: "Confederation strength index" },
  { icon: "⭐", text: "Match importance weight" },
];

function AboutModel() {
  const navigate = useNavigate();

  return (
    <div className="about-page">
      <div className="about-hero">
        <p className="home-hero__eyebrow">Transparency · Methodology · Results</p>
        <h1 className="home-hero__title">How the AI Works</h1>
        <p className="home-hero__sub">
          Everything you need to know about the model behind the predictions
        </p>
      </div>

      <div className="home-body">
        <button className="about-back-btn" onClick={() => navigate("/")}>
          ← Back to Home
        </button>
        <div className="section-card about-card">

          {/* ── Section 1: The Model ─────────────────────────── */}
          <section className="about-section">
            <h2 className="about-section__title">🤖 The Model</h2>
            <p className="about-section__body">
              This predictor uses an <strong>XGBoost classifier</strong> trained on{" "}
              <strong>49,000+ international football matches</strong>. It achieves{" "}
              <strong>60.6% accuracy</strong> on World Cup match outcomes — significantly
              above the 33% random baseline for a 3-class problem (Home Win / Draw /
              Away Win).
            </p>

            <div className="about-accuracy-strip">
              <div className="about-acc-item">
                <span className="about-acc-value">49k+</span>
                <span className="about-acc-label">Matches trained on</span>
              </div>
              <div className="about-acc-divider" />
              <div className="about-acc-item about-acc-item--highlight">
                <span className="about-acc-value">60.6%</span>
                <span className="about-acc-label">Model accuracy</span>
              </div>
              <div className="about-acc-divider" />
              <div className="about-acc-item">
                <span className="about-acc-value">33%</span>
                <span className="about-acc-label">Random baseline</span>
              </div>
            </div>
          </section>

          <div className="about-rule" />

          {/* ── Section 2: Features ──────────────────────────── */}
          <section className="about-section">
            <h2 className="about-section__title">⚙️ Features Used</h2>
            <ul className="about-features">
              {FEATURES.map(({ icon, text }) => (
                <li key={text} className="about-feature-item">
                  <span className="about-feature-icon" aria-hidden="true">{icon}</span>
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </section>

          <div className="about-rule" />

          {/* ── Section 3: Monte Carlo ───────────────────────── */}
          <section className="about-section">
            <h2 className="about-section__title">🎲 Monte Carlo Simulation</h2>
            <p className="about-section__body">
              The tournament simulator runs <strong>1,000 simulations</strong> of the
              entire World Cup bracket. Each match result is sampled from the model's
              probability distribution. The displayed bracket shows the most probable
              realistic outcome — filtered to always show a{" "}
              <strong>top-10 contender</strong> as champion.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}

export default AboutModel;
