/**
 * simulationMock.js
 * Mock data that mirrors the /api/simulate/ response contract (Spec §7.3).
 * Replace with real API call in T3.1.
 *
 * 48 teams · 12 groups · R32 → R16 → QF → SF → Final
 */

// ─── Groups ──────────────────────────────────────────────────────────────────
// qualified: "winner" | "runner_up" | "best_third" | "eliminated"
// Groups A–H contribute a best_third qualifier (8 total).

const GROUPS = [
  {
    name: "A",
    standings: [
      { team: "USA",    rank_in_group: 1, points: 7, gd:  4, gf: 6, qualified: "winner" },
      { team: "Canada", rank_in_group: 2, points: 5, gd:  1, gf: 3, qualified: "runner_up" },
      { team: "Mexico", rank_in_group: 3, points: 4, gd:  0, gf: 2, qualified: "best_third" },
      { team: "Jamaica",rank_in_group: 4, points: 0, gd: -5, gf: 0, qualified: "eliminated" },
    ],
  },
  {
    name: "B",
    standings: [
      { team: "France",  rank_in_group: 1, points: 9, gd:  6, gf: 8, qualified: "winner" },
      { team: "Senegal", rank_in_group: 2, points: 4, gd:  1, gf: 3, qualified: "runner_up" },
      { team: "Morocco", rank_in_group: 3, points: 3, gd: -1, gf: 2, qualified: "best_third" },
      { team: "Algeria", rank_in_group: 4, points: 1, gd: -6, gf: 1, qualified: "eliminated" },
    ],
  },
  {
    name: "C",
    standings: [
      { team: "Brazil",   rank_in_group: 1, points: 7, gd:  5, gf: 7, qualified: "winner" },
      { team: "Colombia", rank_in_group: 2, points: 5, gd:  2, gf: 4, qualified: "runner_up" },
      { team: "Ecuador",  rank_in_group: 3, points: 4, gd:  0, gf: 3, qualified: "best_third" },
      { team: "Bolivia",  rank_in_group: 4, points: 0, gd: -7, gf: 0, qualified: "eliminated" },
    ],
  },
  {
    name: "D",
    standings: [
      { team: "Argentina", rank_in_group: 1, points: 7, gd:  4, gf: 6, qualified: "winner" },
      { team: "Uruguay",   rank_in_group: 2, points: 4, gd:  0, gf: 3, qualified: "runner_up" },
      { team: "Chile",     rank_in_group: 3, points: 4, gd:  0, gf: 2, qualified: "best_third" },
      { team: "Paraguay",  rank_in_group: 4, points: 1, gd: -4, gf: 1, qualified: "eliminated" },
    ],
  },
  {
    name: "E",
    standings: [
      { team: "Spain",       rank_in_group: 1, points: 9, gd:  7, gf: 9, qualified: "winner" },
      { team: "Germany",     rank_in_group: 2, points: 6, gd:  3, gf: 5, qualified: "runner_up" },
      { team: "Netherlands", rank_in_group: 3, points: 3, gd: -1, gf: 3, qualified: "best_third" },
      { team: "Belgium",     rank_in_group: 4, points: 0, gd: -9, gf: 0, qualified: "eliminated" },
    ],
  },
  {
    name: "F",
    standings: [
      { team: "England",  rank_in_group: 1, points: 7, gd:  4, gf: 6, qualified: "winner" },
      { team: "Portugal", rank_in_group: 2, points: 4, gd:  1, gf: 4, qualified: "runner_up" },
      { team: "Croatia",  rank_in_group: 3, points: 4, gd:  0, gf: 3, qualified: "best_third" },
      { team: "Poland",   rank_in_group: 4, points: 1, gd: -5, gf: 1, qualified: "eliminated" },
    ],
  },
  {
    name: "G",
    standings: [
      { team: "Japan",       rank_in_group: 1, points: 7, gd:  3, gf: 5, qualified: "winner" },
      { team: "South Korea", rank_in_group: 2, points: 5, gd:  1, gf: 3, qualified: "runner_up" },
      { team: "Australia",   rank_in_group: 3, points: 3, gd: -1, gf: 2, qualified: "best_third" },
      { team: "Saudi Arabia",rank_in_group: 4, points: 1, gd: -3, gf: 1, qualified: "eliminated" },
    ],
  },
  {
    name: "H",
    standings: [
      { team: "Italy",       rank_in_group: 1, points: 7, gd:  4, gf: 6, qualified: "winner" },
      { team: "Denmark",     rank_in_group: 2, points: 5, gd:  2, gf: 4, qualified: "runner_up" },
      { team: "Switzerland", rank_in_group: 3, points: 3, gd: -1, gf: 2, qualified: "best_third" },
      { team: "Austria",     rank_in_group: 4, points: 1, gd: -5, gf: 1, qualified: "eliminated" },
    ],
  },
  {
    name: "I",
    standings: [
      { team: "Nigeria",   rank_in_group: 1, points: 7, gd:  3, gf: 5, qualified: "winner" },
      { team: "Cameroon",  rank_in_group: 2, points: 4, gd:  0, gf: 3, qualified: "runner_up" },
      { team: "Ghana",     rank_in_group: 3, points: 3, gd: -1, gf: 2, qualified: "eliminated" },
      { team: "Ivory Coast",rank_in_group: 4, points: 2, gd: -2, gf: 2, qualified: "eliminated" },
    ],
  },
  {
    name: "J",
    standings: [
      { team: "Egypt",    rank_in_group: 1, points: 6, gd:  2, gf: 4, qualified: "winner" },
      { team: "Tunisia",  rank_in_group: 2, points: 5, gd:  1, gf: 3, qualified: "runner_up" },
      { team: "S. Africa",rank_in_group: 3, points: 3, gd: -1, gf: 2, qualified: "eliminated" },
      { team: "Burkina F.",rank_in_group: 4, points: 1, gd: -2, gf: 1, qualified: "eliminated" },
    ],
  },
  {
    name: "K",
    standings: [
      { team: "Iran",       rank_in_group: 1, points: 7, gd:  3, gf: 5, qualified: "winner" },
      { team: "Qatar",      rank_in_group: 2, points: 4, gd:  0, gf: 2, qualified: "runner_up" },
      { team: "Iraq",       rank_in_group: 3, points: 3, gd: -1, gf: 2, qualified: "eliminated" },
      { team: "Jordan",     rank_in_group: 4, points: 2, gd: -2, gf: 1, qualified: "eliminated" },
    ],
  },
  {
    name: "L",
    standings: [
      { team: "Turkey",   rank_in_group: 1, points: 6, gd:  2, gf: 4, qualified: "winner" },
      { team: "Ukraine",  rank_in_group: 2, points: 5, gd:  1, gf: 3, qualified: "runner_up" },
      { team: "Serbia",   rank_in_group: 3, points: 3, gd: -1, gf: 2, qualified: "eliminated" },
      { team: "Slovakia", rank_in_group: 4, points: 1, gd: -2, gf: 1, qualified: "eliminated" },
    ],
  },
];

// ─── Best thirds ──────────────────────────────────────────────────────────────
const BEST_THIRDS = [
  { team: "Mexico",      from_group: "A" },
  { team: "Morocco",     from_group: "B" },
  { team: "Ecuador",     from_group: "C" },
  { team: "Chile",       from_group: "D" },
  { team: "Netherlands", from_group: "E" },
  { team: "Croatia",     from_group: "F" },
  { team: "Australia",   from_group: "G" },
  { team: "Switzerland", from_group: "H" },
];

// ─── Knockout ─────────────────────────────────────────────────────────────────
const KNOCKOUT = {
  round_of_32: [
    { home: "USA",         away: "Slovakia",    winner: "USA",         p_home: 0.76, p_away: 0.24 },
    { home: "France",      away: "Ecuador",     winner: "France",      p_home: 0.80, p_away: 0.20 },
    { home: "Brazil",      away: "Tunisia",     winner: "Brazil",      p_home: 0.74, p_away: 0.26 },
    { home: "Argentina",   away: "Qatar",       winner: "Argentina",   p_home: 0.82, p_away: 0.18 },
    { home: "Spain",       away: "Australia",   winner: "Spain",       p_home: 0.73, p_away: 0.27 },
    { home: "England",     away: "Chile",       winner: "England",     p_home: 0.68, p_away: 0.32 },
    { home: "Japan",       away: "Morocco",     winner: "Japan",       p_home: 0.54, p_away: 0.46 },
    { home: "Germany",     away: "Mexico",      winner: "Germany",     p_home: 0.60, p_away: 0.40 },
    { home: "Italy",       away: "Cameroon",    winner: "Italy",       p_home: 0.67, p_away: 0.33 },
    { home: "Denmark",     away: "Iran",        winner: "Denmark",     p_home: 0.62, p_away: 0.38 },
    { home: "Nigeria",     away: "Croatia",     winner: "Nigeria",     p_home: 0.53, p_away: 0.47 },
    { home: "Egypt",       away: "Switzerland", winner: "Egypt",       p_home: 0.51, p_away: 0.49 },
    { home: "Portugal",    away: "Colombia",    winner: "Portugal",    p_home: 0.71, p_away: 0.29 },
    { home: "South Korea", away: "Ukraine",     winner: "South Korea", p_home: 0.55, p_away: 0.45 },
    { home: "Turkey",      away: "Netherlands", winner: "Turkey",      p_home: 0.50, p_away: 0.50 },
    { home: "Senegal",     away: "Uruguay",     winner: "Senegal",     p_home: 0.52, p_away: 0.48 },
  ],
  round_of_16: [
    { home: "USA",         away: "France",      winner: "France",      p_home: 0.35, p_away: 0.65 },
    { home: "Brazil",      away: "Argentina",   winner: "Argentina",   p_home: 0.48, p_away: 0.52 },
    { home: "Spain",       away: "England",     winner: "Spain",       p_home: 0.56, p_away: 0.44 },
    { home: "Japan",       away: "Germany",     winner: "Germany",     p_home: 0.41, p_away: 0.59 },
    { home: "Italy",       away: "Nigeria",     winner: "Italy",       p_home: 0.61, p_away: 0.39 },
    { home: "Denmark",     away: "Egypt",       winner: "Denmark",     p_home: 0.58, p_away: 0.42 },
    { home: "Portugal",    away: "South Korea", winner: "Portugal",    p_home: 0.66, p_away: 0.34 },
    { home: "Turkey",      away: "Senegal",     winner: "Senegal",     p_home: 0.47, p_away: 0.53 },
  ],
  quarter: [
    { home: "France",      away: "Argentina",   winner: "France",      p_home: 0.53, p_away: 0.47 },
    { home: "Spain",       away: "Germany",     winner: "Spain",       p_home: 0.55, p_away: 0.45 },
    { home: "Italy",       away: "Denmark",     winner: "Italy",       p_home: 0.52, p_away: 0.48 },
    { home: "Portugal",    away: "Senegal",     winner: "Portugal",    p_home: 0.62, p_away: 0.38 },
  ],
  semi: [
    { home: "France",   away: "Spain",    winner: "France",   p_home: 0.54, p_away: 0.46 },
    { home: "Italy",    away: "Portugal", winner: "Portugal", p_home: 0.44, p_away: 0.56 },
  ],
  third_place: { home: "Spain", away: "Italy", winner: "Spain", p_home: 0.55, p_away: 0.45 },
  final:       { home: "France", away: "Portugal", winner: "France", p_home: 0.54, p_away: 0.46 },
};

// ─── Full response ────────────────────────────────────────────────────────────
const SIMULATION_MOCK = {
  groups:            GROUPS,
  best_thirds:       BEST_THIRDS,
  knockout:          KNOCKOUT,
  champion:          { team: "France", win_probability: 0.18 },
  championship_odds: [
    { team: "France",    prob: 0.18 },
    { team: "Spain",     prob: 0.14 },
    { team: "Argentina", prob: 0.13 },
    { team: "Portugal",  prob: 0.11 },
    { team: "Brazil",    prob: 0.10 },
    { team: "Germany",   prob: 0.09 },
    { team: "England",   prob: 0.08 },
    { team: "Italy",     prob: 0.07 },
  ],
};

export default SIMULATION_MOCK;
