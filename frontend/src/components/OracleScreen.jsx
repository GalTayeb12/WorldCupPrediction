import { useState } from "react";
import SimulatorHero from "./SimulatorHero";

// ---------------------------------------------------------------------------
// Mock data — מחליף את /api/simulate/ עד שה-endpoint מוכן (T3.1)
// ---------------------------------------------------------------------------
const MOCK_RESULT = {
  champion: { team: "France", win_probability: 0.18 },
  // TODO: groups, knockout יתווספו ב-T1.5 (Bracket)
};

const MODEL_ACCURACY = "54%"; // placeholder עד שהמודל החדש מוכן

// ---------------------------------------------------------------------------

function OracleScreen() {
  const [simulation, setSimulation] = useState(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);
  // selectedMatch יתווסף ב-T1.6 (MatchExplain)

  const runSimulation = async () => {
    setLoading(true);
    setError(null);

    // TODO T3.1 — החלף ב-POST /api/simulate/ אמיתי
    await new Promise((res) => setTimeout(res, 1400)); // מדמה latency
    setSimulation(MOCK_RESULT);

    setLoading(false);
  };

  const champion      = simulation?.champion?.team ?? null;
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
      {/* TODO T1.5 — <Bracket groups={simulation?.groups} knockout={simulation?.knockout} /> */}
      {/* TODO T1.6 — <MatchExplain match={selectedMatch} onClose={() => setSelectedMatch(null)} /> */}
    </div>
  );
}

export default OracleScreen;
