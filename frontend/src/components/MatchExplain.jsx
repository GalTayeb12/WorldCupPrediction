import { useEffect } from "react";
import { countryToISO } from "../utils/countryToISO";
import "../styles/MatchExplain.css";

// ─── Mock features engine ─────────────────────────────────────────────────────
// Generates plausible feature data until the real model (T2.x) provides them.

const FIFA_RANK = {
  Argentina: 1, France: 2, England: 4, Brazil: 6, Netherlands: 7,
  Portugal: 9, Spain: 8, Belgium: 3, Germany: 12, Italy: 11,
  Croatia: 10, Denmark: 18, Japan: 17, USA: 13, Mexico: 14,
  Morocco: 13, Senegal: 20, South_Korea: 22, Australia: 25,
  Colombia: 19, Uruguay: 20, Ecuador: 30, Poland: 28, Switzerland: 21,
  Turkey: 38, Ukraine: 22, Serbia: 33, Slovakia: 44, Nigeria: 40,
  Egypt: 34, Iran: 21, Tunisia: 30, Cameroon: 43, Ghana: 61,
  Chile: 32, Canada: 48, Algeria: 35, Bolivia: 85, Paraguay: 62,
  "South Korea": 22, "Saudi Arabia": 56, Qatar: 58, Iraq: 63, Jordan: 87,
  "Ivory Coast": 45, "S. Africa": 67, "Burkina F.": 60,
};

function getRank(team) { return FIFA_RANK[team] ?? 50; }

// Last-5-match form strings (seeded by team)
const FORM_SEEDS = {
  France: "WWWDW", Argentina: "WWDWW", Brazil: "WWWLW", Spain: "WWWDW",
  England: "WWDWW", Portugal: "WDWWW", Germany: "WWDLW", Italy: "WDWWL",
  Netherlands: "WWDWL", Denmark: "WWDWL", Japan: "WDWWL", Croatia: "WDWDW",
  USA: "WDWLW", Colombia: "WDWDL", Uruguay: "DWWLW", Senegal: "WDLWW",
  Morocco: "WDWLW", Nigeria: "LWWDW", Egypt: "WDWLW", Turkey: "DWWLW",
  Mexico: "WDLLW", Chile: "DWLWW", Ecuador: "LDDWW", Australia: "DLLWW",
};

function getForm(team) { return FORM_SEEDS[team] ?? "WDLWD"; }

function formScore(f) {
  return [...f].reduce((s, c) => s + (c === "W" ? 3 : c === "D" ? 1 : 0), 0);
}

// Render form string as coloured spans (done in component, helper returns array)
function parseForm(form) {
  return [...form].map((c) => ({
    char: c,
    cls: c === "W" ? "w" : c === "D" ? "d" : "l",
  }));
}

function getMockFeatures(home, away) {
  const hr = getRank(home);
  const ar = getRank(away);
  const hf = getForm(home);
  const af = getForm(away);
  return {
    ranking_home:  hr,
    ranking_away:  ar,
    ranking_diff:  ar - hr,           // positive → home ranked better
    form_home:     hf,
    form_away:     af,
    form_diff:     formScore(hf) - formScore(af),
    xg_home:       parseFloat((1.2 + (ar - hr) * 0.03).toFixed(2)),
    xg_away:       parseFloat((1.0 - (ar - hr) * 0.03).toFixed(2)),
    h2h_home_wins: Math.max(0, 3 + Math.round((ar - hr) / 15)),
    h2h_draws:     2,
    h2h_away_wins: Math.max(0, 3 - Math.round((ar - hr) / 15)),
  };
}

function buildExplanation(match, feat) {
  const fav = match.p_home >= match.p_away ? match.home : match.away;
  const parts = [];
  if (Math.abs(feat.ranking_diff) >= 5)
    parts.push(`a ${Math.abs(feat.ranking_diff)}-place FIFA ranking advantage`);
  if (Math.abs(feat.form_diff) >= 3)
    parts.push(`stronger recent form`);
  if (Math.abs(feat.xg_home - feat.xg_away) >= 0.3)
    parts.push(`higher expected goals (xG)`);
  if (parts.length === 0) parts.push("a slight overall edge per the model");
  return `${fav} is favored based on ${parts.join(" and ")}.`;
}

// ─── Flag component ───────────────────────────────────────────────────────────

function Flag({ team }) {
  const iso = countryToISO(team);
  if (!iso) return <span className="explain-flag-placeholder" aria-hidden="true" />;
  return <span className={`fi fi-${iso}`} role="img" aria-label={team} />;
}

// ─── Probability bar ──────────────────────────────────────────────────────────

function ProbBar({ label, pct, variant }) {
  return (
    <div className="prob-bar">
      <span className="prob-bar__label">{label}</span>
      <div className="prob-bar__track">
        <div
          className={`prob-bar__fill prob-bar__fill--${variant}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="prob-bar__value">{pct}%</span>
    </div>
  );
}

// ─── Form pills ───────────────────────────────────────────────────────────────

const FORM_STYLE = {
  w: { background: "var(--color-primary-light)", color: "var(--color-primary)", fontWeight: 600 },
  d: { background: "var(--color-border)",        color: "var(--color-text-muted)" },
  l: { background: "var(--color-danger-light)",  color: "var(--color-danger)" },
};

function FormPills({ form }) {
  return (
    <span style={{ display: "inline-flex", gap: 3 }}>
      {parseForm(form).map(({ char, cls }, i) => (
        <span
          key={i}
          style={{
            ...FORM_STYLE[cls],
            width: 18, height: 18,
            borderRadius: "50%",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 10,
          }}
        >
          {char}
        </span>
      ))}
    </span>
  );
}

// ─── MatchExplain ─────────────────────────────────────────────────────────────

/**
 * Props:
 *   match   { home, away, winner, p_home, p_away }
 *   onClose function
 */
function MatchExplain({ match, onClose }) {
  const { home, away, winner, p_home, p_away } = match;
  const feat = getMockFeatures(home, away);

  // Derive 3-way probabilities: subtract small draw pool from both
  const DRAW_POOL = 0.12;
  const adjHome   = Math.round((p_home - DRAW_POOL / 2) * 100);
  const adjDraw   = Math.round(DRAW_POOL * 100);
  const adjAway   = 100 - adjHome - adjDraw;

  const explanation = buildExplanation(match, feat);

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // Prevent body scroll while modal open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div
      className="explain-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Match explanation: ${home} vs ${away}`}
    >
      {/* Stop clicks inside the panel from bubbling to the overlay */}
      <div className="explain-panel" onClick={(e) => e.stopPropagation()}>

        {/* ── Header ── */}
        <div className="explain-header">
          <div className="explain-teams">
            <div className="explain-team">
              <Flag team={home} />
              <span className={`explain-team__name${winner === home ? " explain-team__name--winner" : ""}`}>
                {home}
              </span>
            </div>
            <span className="explain-vs">vs</span>
            <div className="explain-team">
              <Flag team={away} />
              <span className={`explain-team__name${winner === away ? " explain-team__name--winner" : ""}`}>
                {away}
              </span>
            </div>
          </div>
          <button className="explain-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* ── Body ── */}
        <div className="explain-body">

          {/* Probability bars */}
          <div>
            <div className="prob-section__title">Win Probability</div>
            <div className="prob-bars">
              <ProbBar label={`${home} wins`}  pct={adjHome} variant="home" />
              <ProbBar label="Draw / ET · Pens" pct={adjDraw} variant="draw" />
              <ProbBar label={`${away} wins`}  pct={adjAway} variant="away" />
            </div>
          </div>

          {/* Key features */}
          <div>
            <div className="features-section__title">Key Factors</div>
            <div className="features-list">

              <div className="feature-row">
                <span className="feature-row__icon">🏅</span>
                <span className="feature-row__label">FIFA Ranking</span>
                <span className={`feature-row__value feature-row__value--${feat.ranking_diff > 0 ? "positive" : feat.ranking_diff < 0 ? "negative" : "neutral"}`}>
                  #{feat.ranking_home} vs #{feat.ranking_away}
                  {feat.ranking_diff !== 0 && (
                    <span style={{ fontSize: "var(--text-xs)", marginLeft: 4 }}>
                      ({feat.ranking_diff > 0 ? "+" : ""}{feat.ranking_diff})
                    </span>
                  )}
                </span>
              </div>

              <div className="feature-row">
                <span className="feature-row__icon">📈</span>
                <span className="feature-row__label">Expected Goals (xG)</span>
                <span className="feature-row__value">
                  {feat.xg_home} <span style={{ color: "var(--color-text-muted)" }}>vs</span> {feat.xg_away}
                </span>
              </div>

              <div className="feature-row">
                <span className="feature-row__icon">🔥</span>
                <span className="feature-row__label">Recent Form (last 5)</span>
                <span className="feature-row__value" style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <FormPills form={feat.form_home} />
                  <span style={{ color: "var(--color-text-muted)", fontSize: "var(--text-xs)" }}>vs</span>
                  <FormPills form={feat.form_away} />
                </span>
              </div>

              <div className="feature-row">
                <span className="feature-row__icon">⚔️</span>
                <span className="feature-row__label">Head-to-Head</span>
                <span className="feature-row__value feature-row__value--neutral">
                  {feat.h2h_home_wins}W · {feat.h2h_draws}D · {feat.h2h_away_wins}L
                  <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginLeft: 4 }}>
                    ({home} perspective)
                  </span>
                </span>
              </div>

            </div>
          </div>

          {/* Explanation sentence */}
          <div className="explain-sentence">{explanation}</div>

          <p className="explain-mock-notice">
            ⚠️ Features are illustrative — will be replaced by real model output in T2.x
          </p>

        </div>
      </div>
    </div>
  );
}

export default MatchExplain;
