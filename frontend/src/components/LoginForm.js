import { useState } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";

function LoginForm({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const successMessage = location.state?.successMessage;

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await axios.post("http://localhost:8000/api/login/", {
        username,
        password,
      });

      const access = response.data.access;
      const refresh = response.data.refresh;

      localStorage.setItem("access_token", access);
      localStorage.setItem("refresh_token", refresh);

      onLogin(access);
      navigate("/");
    } catch (err) {
      console.error("❌ Login error:", err.response?.data || err.message);
      if (err.response?.status === 401) {
        setError("Invalid username or password");
      } else {
        setError("Login failed. Please try again.");
      }
    }
  };

  return (
    <div style={{
      padding: "30px",
      maxWidth: "400px",
      margin: "50px auto",
      background: "#f9f9f9",
      borderRadius: "12px",
      boxShadow: "0 0 10px rgba(0,0,0,0.1)"
    }}>
      <h2 style={{ textAlign: "center", marginBottom: "20px", color: "#333" }}>Login</h2>

      {successMessage && (
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
          🎉 Registration successful! Please log in.
        </div>
      )}

      <form onSubmit={handleLogin}>
        <input
          className="form-input"
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          className="form-input"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
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
          Login
        </button>
      </form>

      {error && <p style={{ color: "red", marginTop: "10px" }}>{error}</p>}

      <p style={{ marginTop: "15px", textAlign: "center" }}>
        Don't have an account?{" "}
        <button
          onClick={() => navigate("/register")}
          style={{
            background: "none",
            border: "none",
            color: "#007bff",
            textDecoration: "underline",
            cursor: "pointer",
            padding: 0,
          }}
        >
          Register here
        </button>
      </p>
    </div>
  );
}

export default LoginForm;
