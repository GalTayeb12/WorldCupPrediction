import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function RegisterForm() {
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [favoriteTeam, setFavoriteTeam] = useState("");
  const [groupName, setGroupName] = useState("");
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setShowSuccess(false);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      await axios.post("http://localhost:8000/api/register/", {
        username,
        password,
        email,
        full_name: fullName,
        favorite_team: favoriteTeam,
        group_name: groupName,
      });

      setShowSuccess(true); // ✨ הצג הודעה זמנית
      setTimeout(() => {
        navigate("/login");
      }, 2000); // אחרי 2 שניות עבור למסך התחברות
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed");
    }
  };

  return (
    <div style={{
      padding: "30px",
      maxWidth: "450px",
      margin: "50px auto",
      background: "#f9f9f9",
      borderRadius: "12px",
      boxShadow: "0 0 10px rgba(0,0,0,0.1)"
    }}>
      <h2 style={{ textAlign: "center", marginBottom: "20px", color: "#333" }}>Register</h2>

      {showSuccess && (
        <div style={{
          backgroundColor: "#d4edda",
          color: "#155724",
          padding: "10px",
          borderRadius: "6px",
          marginBottom: "15px",
          textAlign: "center",
          fontWeight: "bold",
          boxShadow: "0 0 5px rgba(0,0,0,0.1)"
        }}>
          🎉 Registration successful! Redirecting...
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <input className="form-input" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
        <input className="form-input" placeholder="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        <input className="form-input" placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="form-input" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <input className="form-input" placeholder="Confirm Password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
        <input className="form-input" placeholder="Favorite Team" value={favoriteTeam} onChange={(e) => setFavoriteTeam(e.target.value)} />
        <input className="form-input" placeholder="Group" value={groupName} onChange={(e) => setGroupName(e.target.value)} required />
        <button
          type="submit"
          style={{
            width: "100%",
            padding: "10px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "6px",
            fontWeight: "bold",
            fontSize: "16px",
            marginTop: "10px",
            cursor: "pointer"
          }}
        >
          Register
        </button>
      </form>
      {error && <p style={{ color: "red", marginTop: "10px" }}>{error}</p>}
    </div>
  );
}

export default RegisterForm;
