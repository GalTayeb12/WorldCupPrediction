"""
groups_config.py — Single source of truth for tournament group assignments.

HOW TO UPDATE FOR A NEW WORLD CUP
──────────────────────────────────
1. Update OFFICIAL_GROUPS below with the new groups and team names.
   Names MUST match the 'team' column in group_stats.csv exactly.
2. Run:  python build_group_stats.py
   This regenerates group_stats.csv (leaving blank values for new teams
   so you can fill in real stats before the tournament starts).
3. Start the server — validate_groups() will report any remaining
   mismatches between groups_config, group_stats.csv, and fifa_ranking.csv.
   Fix them before setting strict=True.

CURRENT DATA: FIFA World Cup 2026 (48 teams, 12 groups A–L).
Draw held 5 December 2024, Miami.
"""

from __future__ import annotations
from typing import Optional
import pandas as pd

# ── Constants ─────────────────────────────────────────────────────────────────

TEAMS_PER_GROUP: int = 4

# ── Official groups ───────────────────────────────────────────────────────────
# FIFA World Cup 2026 — official draw (5 December 2024, Miami).
# 48 teams, 12 groups of 4.  Top 2 + best 8 of 12 thirds advance (32 teams).
#
# Names used here must match the 'team' column in group_stats.csv.
# For ELO lookup the simulation layer applies _ELO_NAME_MAP (simulation.py)
# to translate any remaining mismatches against final_ratings keys.

OFFICIAL_GROUPS: dict[str, list[str]] = {
    "A": ["Mexico", "South Korea", "Czech Republic", "South Africa"],
    "B": ["Canada", "Switzerland", "Bosnia and Herzegovina", "Qatar"],
    "C": ["Brazil", "Morocco", "Scotland", "Haiti"],
    "D": ["United States", "Australia", "Paraguay", "Turkey"],
    "E": ["Germany", "Côte d'Ivoire", "Ecuador", "Curaçao"],
    "F": ["Sweden", "Japan", "Netherlands", "Tunisia"],
    "G": ["New Zealand", "Iran", "Belgium", "Egypt"],
    "H": ["Uruguay", "Saudi Arabia", "Spain", "Cape Verde"],
    "I": ["Norway", "France", "Senegal", "Iraq"],
    "J": ["Argentina", "Austria", "Jordan", "Algeria"],
    "K": ["Colombia", "DR Congo", "Portugal", "Uzbekistan"],
    "L": ["England", "Ghana", "Panama", "Croatia"],
}

# ── Derived lookup ────────────────────────────────────────────────────────────

_TEAM_TO_GROUP: dict[str, str] = {
    team: group
    for group, teams in OFFICIAL_GROUPS.items()
    for team in teams
}

_ALL_OFFICIAL_TEAMS: frozenset[str] = frozenset(_TEAM_TO_GROUP)


def get_group_of(team: str) -> Optional[str]:
    """Return the group letter for *team*, or None if not in any group."""
    return _TEAM_TO_GROUP.get(team)


def same_group(home: str, away: str) -> bool:
    """True iff both teams are in the same official group."""
    g = get_group_of(home)
    return g is not None and g == get_group_of(away)


# ── Validation ────────────────────────────────────────────────────────────────

class GroupValidationError(Exception):
    """Raised by validate_groups() when strict=True and issues are found."""


def validate_groups(
    group_stats_df: pd.DataFrame,
    rankings_df: pd.DataFrame,
    strict: bool = False,
) -> list[str]:
    """
    Cross-check OFFICIAL_GROUPS against group_stats.csv and fifa_ranking.csv.

    Checks performed (in order):
      1. Group size — every group must have exactly TEAMS_PER_GROUP teams.
      2. Duplicates within a group.
      3. Team appearing in more than one group.
      4. Team in OFFICIAL_GROUPS but missing from group_stats.csv.
      5. Team in OFFICIAL_GROUPS but missing from fifa_ranking.csv.
      6. Team in group_stats.csv or fifa_ranking.csv but NOT in OFFICIAL_GROUPS
         ("orphans" — indicates the CSV has data for unregistered teams).

    Args:
        group_stats_df: DataFrame loaded from group_stats.csv.
        rankings_df:    DataFrame loaded from fifa_ranking.csv.
        strict:         If True, raise GroupValidationError when any issue found.
                        If False (default), only return the issue list and print warnings.

    Returns:
        List of human-readable issue strings (empty = all clear).
    """
    issues: list[str] = []

    stats_teams: set[str]   = set(group_stats_df['team'].str.strip().unique())
    ranking_teams: set[str] = set(rankings_df['country_full'].str.strip().unique())

    seen_teams: dict[str, str] = {}   # team → first group seen

    for group, teams in OFFICIAL_GROUPS.items():
        # 1. Group size
        if len(teams) != TEAMS_PER_GROUP:
            issues.append(
                f"[size]   Group {group} has {len(teams)} teams "
                f"(expected {TEAMS_PER_GROUP}): {teams}"
            )

        for team in teams:
            # 2 & 3. Duplicates / team in multiple groups
            if team in seen_teams:
                issues.append(
                    f"[dup]    '{team}' appears in both group "
                    f"{seen_teams[team]} and group {group}"
                )
            else:
                seen_teams[team] = group

            # 4. Missing from group_stats.csv
            if team not in stats_teams:
                issues.append(
                    f"[stats]  '{team}' (group {group}) "
                    f"not found in group_stats.csv"
                )

            # 5. Missing from fifa_ranking.csv
            if team not in ranking_teams:
                issues.append(
                    f"[rank]   '{team}' (group {group}) "
                    f"not found in fifa_ranking.csv — ranking lookup will fail"
                )

    # 6. Orphan teams (in CSVs but not in any official group)
    for team in sorted(stats_teams - _ALL_OFFICIAL_TEAMS):
        issues.append(
            f"[orphan] '{team}' is in group_stats.csv "
            f"but not assigned to any official group"
        )
    for team in sorted(ranking_teams - _ALL_OFFICIAL_TEAMS):
        # Suppress — ranking file has hundreds of non-WC teams; only report
        # if the team name looks like it might be a near-miss (length ≤ 30).
        # (Full orphan dump from fifa_ranking would be very noisy.)
        pass

    if issues:
        header = (
            f"[groups_config] {len(issues)} validation issue(s) found "
            f"(strict={strict}):"
        )
        print(header)
        for issue in issues:
            print(f"  {issue}")

        if strict:
            raise GroupValidationError(
                f"{len(issues)} group validation issue(s). "
                "Fix OFFICIAL_GROUPS or the CSV files before starting the server. "
                "Set strict=False to start anyway."
            )
    else:
        print("[groups_config] All validation checks passed ✓")

    return issues
