import { countryToISO } from "../utils/countryToISO";
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

// ─── ChampionCard helpers ─────────────────────────────────────────────────────

const ROUND_SHORT = {
  round_of_32: "R32",
  round_of_16: "R16",
  quarter:     "QF",
  semi:        "SF",
  final:       "Final",
};

/** Trace every match the champion won, return [{round, opponent}] */
function buildPath(champion, knockout) {
  return Object.entries(ROUND_SHORT).reduce((path, [key, label]) => {
    const matches = key === "final" ? [knockout[key]] : (knockout[key] ?? []);
    const match   = matches.find((m) => m?.winner === champion);
    if (!match) return path;
    const opponent = match.winner === match.home ? match.away : match.home;
    return [...path, { round: label, opponent }];
  }, []);
}

// ─── TitleOddsTable ───────────────────────────────────────────────────────────

function TitleOddsTable({ odds }) {
  const rows = odds.filter((o) => o.probability > 0.02);
  if (rows.length === 0) return null;

  return (
    <div className="title-odds">
      <div className="title-odds__header">Title Odds</div>
      <table className="title-odds__table">
        <tbody>
          {rows.map(({ team, probability }) => {
            const iso = countryToISO(team);
            return (
              <tr key={team} className="title-odds__row">
                <td className="title-odds__flag">
                  {iso && <span className={`fi fi-${iso}`} aria-label={team} />}
                </td>
                <td className="title-odds__name">{team}</td>
                <td className="title-odds__pct">{Math.round(probability * 100)}%</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── ChampionCard ─────────────────────────────────────────────────────────────

function ChampionCard({ championshipOdds, knockout }) {
  // Source of truth: whoever won the bracket final.
  const champion = knockout?.final?.winner;
  if (!champion) return null;

  const iso       = countryToISO(champion);
  const path      = buildPath(champion, knockout);
  // MC probability for this specific champion (may differ from odds[0]).
  const oddsEntry = (championshipOdds ?? []).find((o) => o.team === champion);
  const winPct    = oddsEntry ? `${Math.round(oddsEntry.probability * 100)}%` : null;

  return (
    <div className="champion-col">
      <div className="champion-col__label">🏆 Champion</div>

      <div className="champion-col__body">
        <div className="champion-card">
          <span className="champion-card__trophy" aria-hidden="true">🏆</span>

          {iso
            ? <span className={`fi fi-${iso}`} role="img" aria-label={champion} />
            : <span className="champion-card__flag-placeholder" />
          }

          <span className="champion-card__name">{champion}</span>
          <span className="champion-card__subtitle">Predicted Champion</span>

          {winPct && <span className="champion-card__prob">{winPct} to win</span>}

          {path.length > 0 && (
            <>
              <hr className="champion-card__divider" />
              <span className="champion-card__path-title">Path to the title</span>
              <ol className="champion-card__path">
                {path.map(({ round, opponent }) => (
                  <li key={round} className="champion-card__path-row">
                    <span className="champion-card__path-round">{round}</span>
                    <span className="champion-card__path-opponent">def. {opponent}</span>
                  </li>
                ))}
              </ol>
            </>
          )}
        </div>

        <TitleOddsTable odds={championshipOdds} />
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
 *   groups            {Array}    — 12 group objects from /api/simulate/
 *   knockout          {Object}   — { round_of_32, round_of_16, quarter, semi, third_place, final }
 *   champion          {string}   — champion team name (used only to gate render)
 *   championshipOdds  {Array}    — [{ team, probability }, ...] from Monte Carlo
 *   onMatchClick      {Function} — called with match object on KnockoutMatch click
 */
function Bracket({ groups, knockout, champion, championshipOdds, onMatchClick }) {
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

          {/* ── Champion card — 6th column ─────────────────── */}
          {knockout?.final?.winner && (
            <ChampionCard
              championshipOdds={championshipOdds}
              knockout={knockout}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default Bracket;
