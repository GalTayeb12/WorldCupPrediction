import { useEffect, useState } from "react";
import axios from "axios";
import API_URL from "../utils/api";

function PredictionTable({ token, refreshFlag }) {
  const [predictions, setPredictions] = useState([]);

  useEffect(() => {
    const fetchPredictions = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/my_predictions/", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setPredictions(response.data);
      } catch (error) {
        console.error("Error fetching predictions:", error);
      }
    };

    fetchPredictions();
  }, [token, refreshFlag]); // ✅ האזהרה נפתרה

  return (
    <div style={{ padding: "20px" }}>
      <h2>My Predictions</h2>
      <table className="styled-table" border="1" cellPadding="10">
        <thead>
          <tr>
            <th>Date</th>
            <th>Home Team</th>
            <th>Away Team</th>
            <th>Prediction</th>
          </tr>
        </thead>
        <tbody>
          {predictions.map((p, index) => (
            <tr key={index}>
              <td>{p.date}</td>
              <td>{p.home_team}</td>
              <td>{p.away_team}</td>
              <td>{p.predicted_result}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default PredictionTable;
