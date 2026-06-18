import { useEffect, useState } from "react";
import axios from "axios";

function Leaderboard({ refreshFlag }) {
  const [data, setData] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const leaderboardResponse = await axios.get("http://localhost:8000/api/leaderboard/");
      setData(leaderboardResponse.data);

      const token = localStorage.getItem("access_token");
      if (token) {
        const userStatsResponse = await axios.get("http://localhost:8000/api/user-stats/", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUserStats(userStatsResponse.data);
        console.log("📊 userStats:", userStatsResponse.data);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [refreshFlag]);

  const getMedal = (index) => {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return "";
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>🏆 Leaderboard</h2>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="styled-table" border="1" cellPadding="10" style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th>#</th>
              <th>Username</th>
              <th>Total Predictions</th>
              <th>Correct Predictions</th>
              <th>User Accuracy (%)</th>
              <th>AI Accuracy (%)</th>
              <th>Better Predictor</th>
            </tr>
          </thead>
          <tbody>
            {data.map((user, index) => {
              const isUserBetter = user.better_predictor === "User";
              const isAIBetter = user.better_predictor === "AI";
              const isEqual = user.better_predictor === "Equal";

              return (
                <tr key={index}>
                  <td style={{ fontWeight: "bold", fontSize: "1.2em" }}>{getMedal(index) || index + 1}</td>
                  <td>{user.username}</td>
                  <td>{user.total}</td>
                  <td>{user.correct}</td>
                  <td style={{ color: isUserBetter ? "green" : "gray" }}>
                    {user.user_accuracy}% {isUserBetter ? "✅" : ""}
                  </td>
                  <td style={{ color: isAIBetter ? "green" : "gray" }}>
                    {user.ai_accuracy}% {isAIBetter ? "✅" : ""}
                  </td>
                  <td style={{ fontWeight: "bold" }}>
                    {isUserBetter && <span style={{ color: "#ffc107" }}>User 🟊</span>}
                    {isAIBetter && <span style={{ color: "#17a2b8" }}>AI 🟊</span>}
                    {isEqual && <span style={{ color: "gray" }}>Equal 🤝</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Leaderboard;
