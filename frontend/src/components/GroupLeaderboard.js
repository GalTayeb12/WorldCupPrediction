import { useEffect, useState } from "react";
import axios from "axios";

function GroupLeaderboard() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGroupData = async () => {
      try {
        const response = await axios.get("http://localhost:8000/api/group-leaderboard/");
        setGroups(response.data);
      } catch (error) {
        console.error("Error loading group leaderboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGroupData();
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h2>👥 Group Leaderboard</h2>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="styled-table" border="1" cellPadding="10" style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th>#</th>
              <th>Group Name</th>
              <th>Total Predictions</th>
              <th>Correct Predictions</th>
              <th>Accuracy (%)</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((group, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>{group.group}</td>
                <td>{group.total}</td>
                <td>{group.correct}</td>
                <td>{group.accuracy}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default GroupLeaderboard;