import { useState } from "react";
import axios from "axios";
import { useAuth } from "./AuthContext";

function PredictionForm({ token, onPredictionSaved }) {
  const [homeTeam, setHomeTeam] = useState("");
  const [awayTeam, setAwayTeam] = useState("");
  const [userPrediction, setUserPrediction] = useState("");
  const [prediction, setPrediction] = useState(null);
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { isAuthenticated, refreshAccessToken } = useAuth();

  const predictionOptions = {
    home: "Home Win",
    away: "Away Win",
    draw: "Draw",
  };

  const handlePredict = async (e) => {
    e.preventDefault();
    setLoading(true);
    setPrediction(null);
    setDetails(null);
    setError(null);

    try {
      const response = await axios.post("http://localhost:8000/api/predict/", {
        home_team: homeTeam,
        away_team: awayTeam,
      });

      setPrediction(response.data.prediction);
      setDetails(response.data.features);

      if (token) {
        try {
          const saveRes = await axios.post(
            "http://localhost:8000/api/save/",
            {
              features: {
                home_team: homeTeam,
                away_team: awayTeam,
                user_prediction: predictionOptions[userPrediction],
              },
            },
            {
              headers: {
                Authorization: `Bearer ${token.trim()}`,
              },
            }
          );
          console.log("✅ Save Response:", saveRes.data);
          if (onPredictionSaved) onPredictionSaved();
        } catch (saveError) {
          if (saveError.response?.status === 401) {
            try {
              const newToken = await refreshAccessToken();
              if (newToken) {
                const saveRetryRes = await axios.post(
                  "http://localhost:8000/api/save/",
                  {
                    features: {
                      home_team: homeTeam,
                      away_team: awayTeam,
                      user_prediction: predictionOptions[userPrediction],
                    },
                  },
                  {
                    headers: {
                      Authorization: `Bearer ${newToken}`,
                    },
                  }
                );
                console.log("✅ Save Retry Response:", saveRetryRes.data);
                if (onPredictionSaved) onPredictionSaved();
              }
            } catch (refreshError) {
              setError("Session expired. Please login again.");
            }
          }
        }
      } else {
        console.warn("⚠️ No token provided. Save request skipped.");
      }
    } catch (error) {
      setError("Error predicting result");
    }

    setLoading(false);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Predict Match Result</h2>
      <form onSubmit={handlePredict}>
        <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginTop: "15px" }}>
        <input
          type="text"
          placeholder="Home Team"
          value={homeTeam}
          onChange={(e) => setHomeTeam(e.target.value)}
          required
          style={{ marginRight: "10px", padding: "8px" }}
        />

        <input
          type="text"
          placeholder="Away Team"
          value={awayTeam}
          onChange={(e) => setAwayTeam(e.target.value)}
          required
          style={{ marginRight: "10px", padding: "8px" }}
        />

        <select
          value={userPrediction}
          onChange={(e) => setUserPrediction(e.target.value)}
          required
          style={{ marginRight: "10px", padding: "8px" }}
        >
          <option value="">Select Prediction</option>
          <option value="home">Home Win</option>
          <option value="draw">Draw</option>
          <option value="away">Away Win</option>
        </select>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "8px 15px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px"
          }}
        >
          {loading ? "Predicting..." : "Predict"}
        </button>
        </div>
      </form>

      {error && (
        <div style={{ color: "red", marginTop: "20px" }}>
          <strong>{error}</strong>
        </div>
      )}

      {prediction && (
        <div style={{ marginTop: "20px" }}>
          <strong>Prediction:</strong> {prediction}
          {userPrediction && (
            <div style={{ marginTop: "5px" }}>
              <strong>Your Prediction:</strong> {predictionOptions[userPrediction]}
            </div>
          )}
        </div>
      )}

      {details && (
        <div style={{ marginTop: "20px", fontSize: "14px" }}>
          <h4>📊 Prediction Details:</h4>
          <ul>
            <li>🏟️ Home Rank: {details.home_rank}</li>
            <li>🏟️ Away Rank: {details.away_rank}</li>
            <li>📈 Rank Difference: {details.rank_diff}</li>
            <li>⚽ XG Diff: {details.xg_diff}</li>
            <li>🥅 Goals Scored Diff: {details.goals_scored_diff}</li>
            <li>🛡️ Goal Diff: {details.goal_diff}</li>
            <li>🏆 Wins Diff: {details.wins_diff}</li>
            <li>🚫 XGA Diff: {details.xga_diff}</li>
          </ul>
        </div>
      )}
    </div>
  );
}

export default PredictionForm;
