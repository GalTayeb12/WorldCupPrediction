import "../styles/Bracket.css";

// ─── GroupCard ────────────────────────────────────────────────────────────────

function GroupCard({ name, standings }) {
  return (
    <div className="group-card">
      <div className="group-card__header">Group {name}</div>

      {standings.map((row) => {
        const q = row.qualified; // winner | runner_up | best_third | eliminated
        return (
          <div key={row.team} className={`group-card__row group-card__row--${q}`}>
            <span className="group-card__rank">{row.rank_in_group}</span>
            <span className="group-card__name">{row.team}</span>
            <span className="group-card__pts">{row.points}pt · {row.gd > 0 ? "+" : ""}{row.gd}</span>
            {q === "winner"     && <span className="group-card__badge group-card__badge--q">Q</span>}
            {q === "runner_up"  && <span className="group-card__badge group-card__badge--q">Q</span>}
            {q === "best_third" && <span className="group-card__badge group-card__badge--b3">B3</span>}
          </div>
        );
      })}
    </div>
  );
}

// ─── KnockoutMatch ────────────────────────────────────────────────────────────

function KnockoutMatch({ match, onClick, isFinal = false }) {
  const { home, away, winner, p_home, p_away } = match;

  return (
    <div
      className={`k-match${isFinal ? " k-match--final" : ""}`}
      onClick={() => onClick(match)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick(match)}
    >
      <div className={`k-team ${winner === home ? "k-team--winner" : "k-team--loser"}`}>
        <span className="k-team__name">{home}</span>
        <span className="k-team__prob">{Math.round(p_home * 100)}%</span>
      </div>
      <div className={`k-team ${winner === away ? "k-team--winner" : "k-team--loser"}`}>
        <span className="k-team__name">{away}</span>
        <span className="k-team__prob">{Math.round(p_away * 100)}%</span>
      </div>
    </div>
  );
}

// ─── Bracket ──────────────────────────────────────────────────────────────────

const ROUND_LABELS = {
  round_of_32: "Round of 32",
  round_of_16: "Round of 16",
  quarter:     "Quarter-finals",
  semi:        "Semi-finals",
  final:       "Final",
};

const ROUND_ORDER = ["round_of_32", "round_of_16", "quarter", "semi", "final"];

/**
 * Bracket
 * Props:
 *   groups    {Array}    — 12 group objects from /api/simulate/
 *   knockout  {Object}   — { round_of_32, round_of_16, quarter, semi, third_place, final }
 *   onMatchClick {Function} — called with match object when a KnockoutMatch is clicked
 */
function Bracket({ groups, knockout, onMatchClick }) {
  if (!groups || !knockout) return null;

  return (
    <div>
      {/* ── Group stage ──────────────────────────────────────── */}
      <h2 className="bracket__section-title">Group Stage</h2>
      <div className="groups-grid">
        {groups.map((g) => (
          <GroupCard key={g.name} name={g.name} standings={g.standings} />
        ))}
      </div>

      {/* ── Knockout rounds ──────────────────────────────────── */}
      <h2 className="bracket__section-title">Knockout Stage</h2>
      <div className="knockout-scroll">
        <div className="knockout-rounds">
          {ROUND_ORDER.map((roundKey) => {
            const isFinalRound = roundKey === "final";

            // Normalise: "final" in API is a single object, others are arrays
            const matches = isFinalRound
              ? [knockout[roundKey]]
              : knockout[roundKey];

            if (!matches || matches.length === 0) return null;

            return (
              <div key={roundKey} className="knockout-round">
                <div className="round-label">{ROUND_LABELS[roundKey]}</div>
                <div className="round-matches">
                  {matches.map((match, i) => (
                    <KnockoutMatch
                      key={`${roundKey}-${i}`}
                      match={match}
                      onClick={onMatchClick}
                      isFinal={isFinalRound}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default Bracket;
