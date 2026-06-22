import OracleScreen from "./OracleScreen";
import "../styles/Home.css";

function HomePage() {
  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <div className="home-hero">
        <p className="home-hero__eyebrow">AI · Machine Learning · Monte Carlo</p>
        <h1 className="home-hero__title">World Cup 2026 · AI Predictor</h1>
        <p className="home-hero__sub">Powered by XGBoost + Monte Carlo Simulation</p>
      </div>

      {/* ── Tournament simulator (includes Match Predictor) ───── */}
      <div className="home-body">
        <OracleScreen />
      </div>
    </div>
  );
}

export default HomePage;
