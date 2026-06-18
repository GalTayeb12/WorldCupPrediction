import { useState } from "react";
import SimulatorHero from "./SimulatorHero";
import Bracket from "./Bracket";
import MatchExplain from "./MatchExplain";
import SIMULATION_MOCK from "../mock/simulationMock";

const MODEL_ACCURACY = "54%"; // placeholder — יוחלף כשהמודל החדש מוכן

function OracleScreen() {
  const [simulation, setSimulation]       = useState(null);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState(null);
  const [selectedMatch, setSelectedMatch] = useState(null); // T1.6 — MatchExplain

  const runSimulation = async () => {
    setLoading(true);
    setError(null);
    setSelectedMatch(null);

    // TODO T3.1 — החלף ב-POST /api/simulate/ אמיתי
    await new Promise((res) => setTimeout(res, 1400));
    setSimulation(SIMULATION_MOCK);

    setLoading(false);
  };

  const champion       = simulation?.champion?.team ?? null;
  const winProbability = simulation?.champion?.win_probability
    ? `${Math.round(simulation.champion.win_probability * 100)}%`
    : null;

  return (
    <div>
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
