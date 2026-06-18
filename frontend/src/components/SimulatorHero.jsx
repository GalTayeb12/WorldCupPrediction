import "../styles/SimulatorHero.css";

/**
 * SimulatorHero
 * Props:
 *   champion       {string|null}  — שם האלוף החזוי
 *   winProbability {string|null}  — הסתברות זכייה, e.g. "18%"
 *   modelAccuracy  {string|null}  — דיוק המודל, e.g. "54%"
 *   loading        {boolean}      — האם הסימולציה רצה כרגע
 *   error          {string|null}  — שגיאה להצגה
 *   onRun          {function}     — callback ללחיצה על הכפתור
 */
function SimulatorHero({ champion, winProbability, modelAccuracy, loading, error, onRun }) {
  const hasResult = Boolean(champion);

  return (
    <section className="hero">
      <span className="hero-badge">World Cup 2026 &middot; 48 teams</span>

      <h1 className="hero-title">World Cup Oracle</h1>

      <p className="hero-subtitle">
        AI-powered simulation of the full 2026 World Cup — 48 teams, 104 matches, one champion.
      </p>

      <button
        className="hero-btn"
        onClick={onRun}
        disabled={loading}
      >
        {loading ? (
          <>
            <span className="hero-spinner" aria-hidden="true" />
            Simulating&hellip;
          </>
        ) : (
          hasResult ? "Run again" : "Run simulation"
        )}
      </button>

      {error && <p className="hero-error">{error}</p>}

      {hasResult && (
        <div className="stat-cards">
          <div className="stat-card">
            <span className="stat-card__icon">🏆</span>
            <span className="stat-card__value">{champion}</span>
            <span className="stat-card__label">Predicted champion</span>
          </div>

          <div className="stat-card">
            <span className="stat-card__icon">📊</span>
            <span className="stat-card__value">{winProbability}</span>
            <span className="stat-card__label">Win probability</span>
          </div>

          <div className="stat-card">
            <span className="stat-card__icon">🎯</span>
            <span className="stat-card__value">{modelAccuracy}</span>
            <span className="stat-card__label">Model accuracy</span>
          </div>
        </div>
      )}
    </section>
  );
}

export default SimulatorHero;
