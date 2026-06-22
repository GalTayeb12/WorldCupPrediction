import { useState } from "react";
import axios from "axios";
import SimulatorHero from "./SimulatorHero";
import Bracket from "./Bracket";
import MatchExplain from "./MatchExplain";
import MatchPredictor from "./MatchPredictor";

const MODEL_ACCURACY = "54%";

function OracleScreen() {
  const [simulation, setSimulation]       = useState(null);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState(null);
  const [selectedMatch, setSelectedMatch] = useState(null);

  const runSimulation = async () => {
    // Reset everything atomically before the request so no stale data leaks
    // between renders while loading.
    setSimulation(null);
    setSelectedMatch(null);
    setError(null);
    setLoading(true);

    try {
      const token    = localStorage.getItem("access_token");
      const response = await axios.post(
        "http://localhost:8000/api/simulate/",
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setSimulation(response.data);   // champion + bracket arrive together
    } catch (err) {
      const msg = err.response?.data?.error ?? "Simulation failed. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const odds      = simulation?.championship_odds ?? [];
  // Champion = whoever won the bracket final (single source of truth).
  const champion  = simulation?.knockout?.final?.winner ?? null;
  // MC win probability for that specific team.
  const oddsEntry = odds.find((o) => o.team === champion);
  const winProbability = oddsEntry
    ? `${Math.round(oddsEntry.probability * 100)}%`
    : simulation?.champion?.win_probability
      ? `${Math.round(simulation.champion.win_probability * 100)}%`
      : null;

  return (
    <div>
      <MatchPredictor />

      <SimulatorHero
        champion={champion}
        winProbability={winProbability}
        modelAccuracy={champion ? MODEL_ACCURACY : null}
        loading={loading}
        error={error}
        onRun={runSimulation}
      />

      <Bracket
        groups={simulation?.groups}
        knockout={simulation?.knockout}
        champion={champion}
        winProbability={winProbability}
        championshipOdds={odds}
        onMatchClick={setSelectedMatch}
      />

      {selectedMatch && (
        <MatchExplain
          match={selectedMatch}
          onClose={() => setSelectedMatch(null)}
        />
      )}
    </div>
  );
}

export default OracleScreen;
