import { useEffect, useState } from "react";
import axios from "axios";

function UserProfile({ token }) {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setError("No token provided.");
      return;
    }

    axios.get("http://localhost:8000/api/user/profile/", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => setProfile(res.data))
      .catch(err => {
        console.error("❌ Failed to load profile:", err);
        setError("Failed to load profile");
      });
  }, [token]);

  if (error) return <p style={{ color: "red", padding: "20px" }}>{error}</p>;
  if (!profile) return <p style={{ padding: "20px" }}>Loading profile...</p>;

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "auto" }}>
      <h2 style={{ textAlign: "center", marginBottom: "30px" }}>👤 My Profile</h2>

      <div style={{
        background: "#fff",
        borderRadius: "10px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        padding: "25px",
        fontSize: "16px",
        lineHeight: "1.8"
      }}>
        <p><strong>🆔 Username:</strong> {profile.username}</p>
        <p><strong>📧 Email:</strong> {profile.email}</p>
        <p><strong>👤 Full Name:</strong> {profile.full_name}</p>
        <p><strong>⚽ Favorite Team:</strong> {profile.favorite_team}</p>
        <p><strong>👥 Group:</strong> {profile.group_name}</p>
        <p><strong>🕓 Joined:</strong> {new Date(profile.date_joined).toLocaleString()}</p>
      </div>
    </div>
  );
}

export default UserProfile;
