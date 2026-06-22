"""
simulation.py — Full-tournament simulation engine for World Cup 2026.

Entry point:
    result = simulate_tournament(model, le, final_ratings, feature_names, rankings_df)

Returns a dict that matches the /api/simulate/ JSON contract consumed by the
React frontend (same shape as simulationMock.js).

Design principles:
  - No Django / DRF imports — purely a data-processing module.
  - All ML objects are injected by the caller (views.py) so this module has
    zero side effects at import time.
  - Falls back to a rank-based heuristic when ELO/rank data is unavailable.
"""

from __future__ import annotations
from typing import Optional
import numpy as np
import pandas as pd

from .groups_config import OFFICIAL_GROUPS

# ── ELO name mapping ──────────────────────────────────────────────────────────
# Maps names used in groups_config / FIFA data → keys in final_ratings.
_ELO_NAME_MAP: dict[str, str] = {
    "USA":                    "United States",
    "IR Iran":                "Iran",
    "Korea Republic":         "South Korea",
    "Cape Verde Islands":     "Cape Verde",
    "Congo DR":               "DR Congo",
    "Côte d'Ivoire":          "Ivory Coast",
    "Cote d'Ivoire":          "Ivory Coast",
    "Trinidad & Tobago":      "Trinidad and Tobago",
    "Timor Leste":            "Timor-Leste",
    "St Kitts and Nevis":     "Saint Kitts and Nevis",
}


def _elo_name(team: str) -> str:
    """Translate a team name to its final_ratings key."""
    return _ELO_NAME_MAP.get(team, team)


# ── FIFA ranking name mapping ──────────────────────────────────────────────────
# Maps common/final_ratings names → country_full values in fifa_ranking.csv.
_FIFA_NAME_MAP: dict[str, str] = {
    "South Korea":    "Korea Republic",
    "United States":  "USA",
    "Iran":           "IR Iran",
    "DR Congo":       "Congo DR",
    "Cape Verde":     "Cape Verde Islands",
    "Ivory Coast":    "Côte d'Ivoire",
    "North Macedonia":"North Macedonia",   # same in most CSVs, kept for safety
}


def _fifa_name(team: str) -> str:
    """Translate a team name to its fifa_ranking.csv country_full value."""
    return _FIFA_NAME_MAP.get(team, team)


# ── Confederation strength ─────────────────────────────────────────────────────
# Keys use final_ratings / _elo_name-translated names.
# UEFA=1.0  CONMEBOL=0.85  CONCACAF=0.6  AFC=0.55  CAF=0.5  OFC=0.35
_CONF_STRENGTH: dict[str, float] = {
    # UEFA
    "Spain": 1.0, "France": 1.0, "Germany": 1.0, "England": 1.0,
    "Portugal": 1.0, "Netherlands": 1.0, "Belgium": 1.0, "Croatia": 1.0,
    "Austria": 1.0, "Switzerland": 1.0, "Scotland": 1.0, "Sweden": 1.0,
    "Czech Republic": 1.0, "Slovenia": 1.0, "Ukraine": 1.0, "Turkey": 1.0,
    "Serbia": 1.0, "Norway": 1.0, "Bosnia and Herzegovina": 1.0,
    "Denmark": 1.0, "Poland": 1.0, "Italy": 1.0, "Wales": 1.0,
    "Hungary": 1.0, "Slovakia": 1.0, "Romania": 1.0, "Greece": 1.0,
    "Albania": 1.0, "North Macedonia": 1.0, "Finland": 1.0,
    # CONMEBOL
    "Brazil": 0.85, "Argentina": 0.85, "Colombia": 0.85, "Uruguay": 0.85,
    "Ecuador": 0.85, "Paraguay": 0.85, "Chile": 0.85, "Venezuela": 0.85,
    "Bolivia": 0.85, "Peru": 0.85,
    # CONCACAF
    "Mexico": 0.6, "United States": 0.6, "Canada": 0.6, "Costa Rica": 0.6,
    "Panama": 0.6, "Honduras": 0.6, "Jamaica": 0.6,
    "Trinidad and Tobago": 0.6, "Haiti": 0.6, "Cuba": 0.6,
    "El Salvador": 0.6, "Guatemala": 0.6, "Curaçao": 0.6,
    # AFC
    "Iran": 0.55, "Japan": 0.55, "South Korea": 0.55, "Australia": 0.55,
    "Saudi Arabia": 0.55, "Iraq": 0.55, "Jordan": 0.55, "Uzbekistan": 0.55,
    "Qatar": 0.55, "Bahrain": 0.55, "Indonesia": 0.55, "Thailand": 0.55,
    "China": 0.55, "United Arab Emirates": 0.55, "Oman": 0.55,
    # CAF
    "Morocco": 0.5, "Senegal": 0.5, "Egypt": 0.5, "Ghana": 0.5,
    "Cameroon": 0.5, "DR Congo": 0.5, "Tunisia": 0.5, "Algeria": 0.5,
    "South Africa": 0.5, "Nigeria": 0.5, "Ivory Coast": 0.5,
    "Cape Verde": 0.5, "Mali": 0.5, "Burkina Faso": 0.5,
    # OFC
    "New Zealand": 0.35,
}


def _conf_strength(team: str) -> float:
    """Return confederation strength coefficient (uses ELO-translated team name)."""
    return _CONF_STRENGTH.get(team, 0.5)   # default → CAF level


# ── Group-stage goal model (per match, for display only) ──────────────────────
# Win  → 2–0  (GF+2, GA+0, GD+2)
# Draw → 1–1  (GF+1, GA+1, GD+0)
# Loss → 0–2  (GF+0, GA+2, GD-2)
_GOALS_FOR  = {'Home Win': (2, 0), 'Away Win': (0, 2), 'Draw': (1, 1)}
_POINTS_MAP = {'Home Win': (3, 0), 'Away Win': (0, 3), 'Draw': (1, 1)}


# ─────────────────────────────────────────────────────────────────────────────
# Internal helpers
# ─────────────────────────────────────────────────────────────────────────────

def _get_rank(team: str, rankings_df: pd.DataFrame) -> Optional[float]:
    df = rankings_df[rankings_df['country_full'] == _fifa_name(team)]
    if df.empty:
        return None
    return float(df.sort_values('rank_date', ascending=False).iloc[0]['rank'])


def _get_fifa_stats(team: str, rankings_df: pd.DataFrame) -> tuple[int, float]:
    """Return (rank, total_points) using the most recent entry; defaults (50, 0.0)."""
    df = rankings_df[rankings_df['country_full'] == _fifa_name(team)]
    if df.empty:
        return 50, 0.0
    row = df.sort_values('rank_date', ascending=False).iloc[0]
    return int(row['rank']), float(row['total_points'])


def _predict_match(
    home: str,
    away: str,
    model,
    le,
    final_ratings: dict,
    feature_names: list,
    rankings_df: pd.DataFrame,
    _cache: Optional[dict] = None,
) -> dict:
    """
    Run the ML model for one match using ELO-based features.

    Parameters
    ----------
    _cache : optional shared dict keyed by (home, away).
        When provided, results are read from and written to the cache so
        repeated calls for the same matchup skip the ML inference entirely.

    Returns
    -------
    dict with keys: label ('Home Win' | 'Away Win' | 'Draw'),
                    p_home (float), p_away (float), p_draw (float).
    Falls back to a rank-based heuristic on any error.
    """
    if _cache is not None:
        _key = (home, away)
        if _key in _cache:
            return _cache[_key]

    try:
        home_key = _elo_name(home)
        away_key = _elo_name(away)

        home_elo = float(final_ratings.get(home_key, 1500.0))
        away_elo = float(final_ratings.get(away_key, 1500.0))
        elo_diff = home_elo - away_elo

        home_rank, _ = _get_fifa_stats(home_key, rankings_df)
        away_rank, _ = _get_fifa_stats(away_key, rankings_df)

        features = {
            'elo_diff':          elo_diff,
            'home_elo':          home_elo,
            'away_elo':          away_elo,
            'fifa_rank_diff':    home_rank - away_rank,
            'form_points_diff':  0.0,
            'form_ga_diff':      0.0,
            'h2h_home_winrate':  0.5,
            'streak_diff':       0.0,
            'conf_strength_diff': _conf_strength(home_key) - _conf_strength(away_key),
            'importance':        4,
            'neutral':           1,
        }

        X     = pd.DataFrame([[features[f] for f in feature_names]], columns=feature_names)
        proba = model.predict_proba(X)[0]          # order: le.classes_

        cls_list = list(le.classes_)               # ['away', 'draw', 'home']
        p_away = float(proba[cls_list.index('away')])
        p_draw = float(proba[cls_list.index('draw')])
        p_home = float(proba[cls_list.index('home')])

        # Normalise (should already sum to 1.0, but be safe)
        total  = p_home + p_draw + p_away or 1.0
        p_home /= total
        p_draw /= total
        p_away /= total

        if p_home >= p_away and p_home >= p_draw:
            label = 'Home Win'
        elif p_away >= p_home and p_away >= p_draw:
            label = 'Away Win'
        else:
            label = 'Draw'

        _result = {'label': label,
                   'p_home': round(p_home, 4),
                   'p_away': round(p_away, 4),
                   'p_draw': round(p_draw, 4)}
        if _cache is not None:
            _cache[(home, away)] = _result
        return _result

    except Exception:
        pass  # fall through to heuristic

    # ── Ranking-based fallback ─────────────────────────────────────────────
    home_rank_f = _get_rank(home, rankings_df)
    away_rank_f = _get_rank(away, rankings_df)

    if home_rank_f and away_rank_f:
        rank_diff = float(away_rank_f - home_rank_f)
        p_home = min(0.72, max(0.18, 0.45 + rank_diff * 0.0035))
        p_away = min(0.72, max(0.18, 0.45 - rank_diff * 0.0035))
        p_draw = max(0.10, 1.0 - p_home - p_away)
        total  = p_home + p_draw + p_away
        p_home /= total
        p_draw /= total
        p_away /= total
    else:
        p_home, p_draw, p_away = 0.40, 0.20, 0.40

    if p_home >= p_away and p_home >= p_draw:
        label = 'Home Win'
    elif p_away >= p_home and p_away >= p_draw:
        label = 'Away Win'
    else:
        label = 'Draw'

    _result = {'label': label,
               'p_home': round(p_home, 4),
               'p_away': round(p_away, 4),
               'p_draw': round(p_draw, 4)}
    if _cache is not None:
        _cache[(home, away)] = _result
    return _result


def _knockout_result(home: str, away: str, result: dict) -> tuple[str, float, float]:
    """
    Resolve a knockout match (no draws allowed).
    Samples the winner from (p_home, p_away) so each simulation run is unique.
    Redistributes p_draw proportionally before sampling.
    Returns (winner, p_home_normalised, p_away_normalised).
    """
    p_home = result['p_home']
    p_away = result['p_away']

    # Normalise to 1.0 (absorb draw probability proportionally)
    total  = p_home + p_away or 1.0
    p_home = p_home / total
    p_away = p_away / total

    # Stochastic sample — makes every "Run again" produce a different bracket.
    # Re-normalise in case division above left a tiny float-sum error.
    _p = np.array([p_home, p_away], dtype=np.float64)
    _p /= _p.sum()
    winner = np.random.choice([home, away], p=_p)

    return winner, round(p_home, 4), round(p_away, 4)


# ─────────────────────────────────────────────────────────────────────────────
# Group stage
# ─────────────────────────────────────────────────────────────────────────────

def _run_group_stage(model, le, final_ratings, feature_names, rankings_df, _cache=None) -> list[dict]:
    """
    Run a full round-robin in every group.
    Returns a list of group dicts in the /api/simulate/ contract format.
    """
    group_results = []

    for group_letter, teams in OFFICIAL_GROUPS.items():
        # Accumulate stats for each team in this group
        stats: dict[str, dict] = {
            t: {'team': t, 'points': 0, 'gf': 0, 'ga': 0, 'gd': 0}
            for t in teams
        }

        # Round-robin: C(4,2) = 6 matches
        for i in range(len(teams)):
            for j in range(i + 1, len(teams)):
                home, away = teams[i], teams[j]
                result = _predict_match(
                    home, away, model, le, final_ratings, feature_names, rankings_df,
                    _cache=_cache,
                )
                # Stochastic sample so each run gives a different group table.
                # Re-normalise after rounding so np.random.choice never sees a
                # sum that differs from 1.0 by floating-point error.
                _p = np.array(
                    [result['p_home'], result['p_draw'], result['p_away']],
                    dtype=np.float64,
                )
                _p /= _p.sum()
                label = np.random.choice(['Home Win', 'Draw', 'Away Win'], p=_p)

                h_pts, a_pts = _POINTS_MAP[label]
                h_gf,  a_gf  = _GOALS_FOR[label]
                h_ga,  a_ga  = a_gf, h_gf          # each team's GA = opponent's GF

                stats[home]['points'] += h_pts
                stats[home]['gf']     += h_gf
                stats[home]['ga']     += h_ga
                stats[home]['gd']     += h_gf - h_ga

                stats[away]['points'] += a_pts
                stats[away]['gf']     += a_gf
                stats[away]['ga']     += a_ga
                stats[away]['gd']     += a_gf - a_ga

        # Sort: points → GD → GF
        sorted_teams = sorted(
            stats.values(),
            key=lambda s: (-s['points'], -s['gd'], -s['gf']),
        )

        standings = []
        for rank, team_stats in enumerate(sorted_teams, start=1):
            if rank == 1:
                qualified = 'winner'
            elif rank == 2:
                qualified = 'runner_up'
            elif rank == 3:
                qualified = 'best_third'   # may be promoted; decided later
            else:
                qualified = 'eliminated'

            standings.append({
                'team':         team_stats['team'],
                'rank_in_group': rank,
                'points':       team_stats['points'],
                'gf':           team_stats['gf'],
                'gd':           team_stats['gd'],
                'qualified':    qualified,
            })

        group_results.append({'name': group_letter, 'standings': standings})

    return group_results


# ─────────────────────────────────────────────────────────────────────────────
# Qualifier extraction
# ─────────────────────────────────────────────────────────────────────────────

def _extract_qualifiers(groups: list[dict]) -> tuple[dict, dict, list[dict]]:
    """
    Returns:
        winners     {group_letter → team_name}
        runners_up  {group_letter → team_name}
        best_thirds list[{team, from_group, points, gd, gf}] — top 8 of 12 thirds
    """
    winners:    dict[str, str] = {}
    runners_up: dict[str, str] = {}
    thirds:     list[dict]     = []

    for g in groups:
        name = g['name']
        standings = g['standings']
        winners[name]   = standings[0]['team']
        runners_up[name] = standings[1]['team']
        thirds.append({
            'team':       standings[2]['team'],
            'from_group': name,
            'points':     standings[2]['points'],
            'gd':         standings[2]['gd'],
            'gf':         standings[2]['gf'],
        })

    # 2026 format: best 8 of 12 thirds qualify
    thirds.sort(key=lambda t: (-t['points'], -t['gd'], -t['gf']))
    best_8 = thirds[:8]
    worst_4 = thirds[8:]

    # Mark the 4 non-qualifying thirds as 'eliminated' in the groups list
    non_qual_teams = {t['team'] for t in worst_4}
    for g in groups:
        for row in g['standings']:
            if row['team'] in non_qual_teams:
                row['qualified'] = 'eliminated'

    return winners, runners_up, best_8


# ─────────────────────────────────────────────────────────────────────────────
# Knockout stage
# ─────────────────────────────────────────────────────────────────────────────

def _build_r32_pairs(
    winners: dict[str, str],
    runners_up: dict[str, str],
    best_thirds: list[dict],
) -> list[tuple[str, str]]:
    """
    Produce 16 (home, away) match pairs for the Round of 32.

    Seeding logic (avoids groups meeting again in R32):
      Matches 1-8:  each group winner (A→H) vs one of the 8 best thirds
                    (best third seeded against lowest-ranked winner first)
      Matches 9-12: remaining 4 winners (I→L) vs cross runners-up
      Matches 13-16: cross runner-up pairs
    """
    g = list(OFFICIAL_GROUPS.keys())  # ['A','B','C','D','E','F','G','H','I','J','K','L']
    b3 = [t['team'] for t in best_thirds]  # 8 teams, best first

    pairs = [
        # Group winners A-H vs best thirds (weaker winner gets stronger third)
        (winners[g[0]], b3[7]),   # A1 vs 8th best third
        (winners[g[1]], b3[6]),   # B1 vs 7th best third
        (winners[g[2]], b3[5]),   # C1 vs 6th best third
        (winners[g[3]], b3[4]),   # D1 vs 5th best third
        (winners[g[4]], b3[3]),   # E1 vs 4th best third
        (winners[g[5]], b3[2]),   # F1 vs 3rd best third
        (winners[g[6]], b3[1]),   # G1 vs 2nd best third
        (winners[g[7]], b3[0]),   # H1 vs best third
        # Group winners I-L vs cross runners-up
        (winners[g[8]],  runners_up[g[11]]),  # I1 vs L2
        (winners[g[9]],  runners_up[g[10]]),  # J1 vs K2
        (winners[g[10]], runners_up[g[9]]),   # K1 vs J2
        (winners[g[11]], runners_up[g[8]]),   # L1 vs I2
        # Cross runner-up pairs
        (runners_up[g[0]], runners_up[g[7]]),  # A2 vs H2
        (runners_up[g[1]], runners_up[g[6]]),  # B2 vs G2
        (runners_up[g[2]], runners_up[g[5]]),  # C2 vs F2
        (runners_up[g[3]], runners_up[g[4]]),  # D2 vs E2
    ]
    return pairs


def _run_round(
    pairs: list[tuple[str, str]],
    model, le, final_ratings, feature_names,
    rankings_df,
    _cache=None,
) -> tuple[list[dict], list[str], list[str]]:
    """
    Play a single knockout round.
    Returns (match_dicts, winners, losers).
    """
    matches: list[dict] = []
    round_winners: list[str] = []
    round_losers:  list[str] = []

    for home, away in pairs:
        result = _predict_match(
            home, away, model, le, final_ratings, feature_names, rankings_df,
            _cache=_cache,
        )
        winner, p_home, p_away = _knockout_result(home, away, result)
        loser  = away if winner == home else home

        matches.append({
            'home':   home,
            'away':   away,
            'winner': winner,
            'p_home': round(p_home, 4),
            'p_away': round(p_away, 4),
        })
        round_winners.append(winner)
        round_losers.append(loser)

    return matches, round_winners, round_losers


def _pair_consecutive(teams: list[str]) -> list[tuple[str, str]]:
    """Pair [a, b, c, d, ...] → [(a,b), (c,d), ...]"""
    return [(teams[i], teams[i + 1]) for i in range(0, len(teams), 2)]


# ─────────────────────────────────────────────────────────────────────────────
# Main entry point
# ─────────────────────────────────────────────────────────────────────────────

def simulate_tournament(
    model,
    le,
    final_ratings: dict,
    feature_names: list,
    rankings_df: pd.DataFrame,
    _cache: Optional[dict] = None,
) -> dict:
    """
    Run a full World Cup 2026 simulation.

    Parameters mirror the new-model objects loaded in views.py.
    Returns the JSON-serialisable dict expected by the React frontend.
    """
    _args = (model, le, final_ratings, feature_names, rankings_df)

    # ── 1. Group stage ────────────────────────────────────────────────────────
    groups = _run_group_stage(*_args, _cache=_cache)

    # ── 2. Qualifiers ─────────────────────────────────────────────────────────
    winners, runners_up, best_thirds = _extract_qualifiers(groups)

    # ── 3. Round of 32 ───────────────────────────────────────────────────────
    r32_pairs                    = _build_r32_pairs(winners, runners_up, best_thirds)
    r32_matches, r32_w, r32_l   = _run_round(r32_pairs, *_args, _cache=_cache)

    # ── 4. Round of 16 ───────────────────────────────────────────────────────
    r16_pairs                    = _pair_consecutive(r32_w)
    r16_matches, r16_w, r16_l   = _run_round(r16_pairs, *_args, _cache=_cache)

    # ── 5. Quarter-finals ─────────────────────────────────────────────────────
    qf_pairs                     = _pair_consecutive(r16_w)
    qf_matches, qf_w, qf_l      = _run_round(qf_pairs, *_args, _cache=_cache)

    # ── 6. Semi-finals ────────────────────────────────────────────────────────
    sf_pairs                     = _pair_consecutive(qf_w)
    sf_matches, sf_w, sf_l      = _run_round(sf_pairs, *_args, _cache=_cache)

    # ── 7. Third-place play-off ───────────────────────────────────────────────
    tp_result  = _predict_match(sf_l[0], sf_l[1], *_args, _cache=_cache)
    tp_winner, tp_ph, tp_pa = _knockout_result(sf_l[0], sf_l[1], tp_result)
    third_place_match = {
        'home':   sf_l[0],
        'away':   sf_l[1],
        'winner': tp_winner,
        'p_home': round(tp_ph, 4),
        'p_away': round(tp_pa, 4),
    }

    # ── 8. Final ──────────────────────────────────────────────────────────────
    final_result  = _predict_match(sf_w[0], sf_w[1], *_args, _cache=_cache)
    fin_winner, fin_ph, fin_pa = _knockout_result(sf_w[0], sf_w[1], final_result)
    final_match = {
        'home':   sf_w[0],
        'away':   sf_w[1],
        'winner': fin_winner,
        'p_home': round(fin_ph, 4),
        'p_away': round(fin_pa, 4),
    }

    # ── 9. Champion win probability (product of knockout win probabilities) ───
    champion = fin_winner
    champion_path_probs: list[float] = []

    all_rounds = (
        list(zip(r32_pairs,  r32_matches))  +
        list(zip(r16_pairs,  r16_matches))  +
        list(zip(qf_pairs,   qf_matches))   +
        list(zip(sf_pairs,   sf_matches))   +
        [((sf_w[0], sf_w[1]), final_match)]
    )
    for (h, a), match in all_rounds:
        if match['winner'] == champion:
            p = match['p_home'] if match['home'] == champion else match['p_away']
            champion_path_probs.append(p)

    win_probability = 1.0
    for p in champion_path_probs:
        win_probability *= p
    win_probability = round(win_probability, 4)

    # ── 10. Assemble response ─────────────────────────────────────────────────
    return {
        'groups':      groups,
        'best_thirds': [{'team': t['team'], 'from_group': t['from_group']} for t in best_thirds],
        'knockout': {
            'round_of_32': r32_matches,
            'round_of_16': r16_matches,
            'quarter':     qf_matches,
            'semi':        sf_matches,
            'third_place': third_place_match,
            'final':       final_match,
        },
        'champion': {
            'team':            champion,
            'win_probability': win_probability,
        },
        'championship_odds': [],   # populated by run_monte_carlo in views.py
    }


# ─────────────────────────────────────────────────────────────────────────────
# simulate_and_pick — run n full simulations, return a representative bracket
# ─────────────────────────────────────────────────────────────────────────────

def simulate_and_pick(
    model,
    le,
    final_ratings: dict,
    feature_names: list,
    rankings_df: pd.DataFrame,
    n: int = 1_000,
    top_k: int = 7,
) -> tuple[dict, list[dict]]:
    """
    Run n full stochastic tournament simulations and return a representative
    bracket together with championship odds computed over all n runs.

    Strategy
    --------
    - All n simulations share a single ``_predict_match`` cache so that
      ``model.predict_proba`` is called **at most once per unique (home, away)
      pair** across all iterations — stochasticity comes from ``np.random.choice``
      inside each run, not from the model.
    - After all runs, the champion of each run is tallied → championship odds.
    - The representative bracket is the **first run whose champion appears in
      the top ``top_k`` teams by championship probability**.  This guarantees
      the displayed bracket is always realistic while the odds panel still
      reflects the true distribution (including upsets).

    Returns
    -------
    (representative_result, championship_odds)
      representative_result : full tournament dict (same shape as
                              simulate_tournament output)
      championship_odds     : list of {"team", "probability"} dicts,
                              sorted descending, filtered to > 1 %
    """
    _args  = (model, le, final_ratings, feature_names, rankings_df)
    _cache: dict = {}          # shared across all n runs

    wins: dict[str, int] = {}
    runs: list[tuple[str, dict]] = []   # (champion, full_result)

    for _ in range(n):
        result   = simulate_tournament(*_args, _cache=_cache)
        champion = result['knockout']['final']['winner']
        wins[champion] = wins.get(champion, 0) + 1
        runs.append((champion, result))

    # ── Championship odds ──────────────────────────────────────────────────
    total        = sum(wins.values())
    sorted_teams = sorted(wins.items(), key=lambda x: -x[1])
    championship_odds = [
        {'team': t, 'probability': round(w / total, 4)}
        for t, w in sorted_teams
        if w / total > 0.01
    ]

    # ── Pick representative: first run with champion in Top-k ──────────────
    top_k_teams = {t for t, _ in sorted_teams[:top_k]}
    representative = next(
        (r for champ, r in runs if champ in top_k_teams),
        runs[0][1],    # fallback: use the very first run
    )

    return representative, championship_odds
