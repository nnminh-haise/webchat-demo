import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./LoginPage.css";
import axios from "axios";

const BACKEND_SERVER_URL = "http://localhost:8081";

const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(""); // Correctly use useState for error
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = `${BACKEND_SERVER_URL}/api/v1/auth/signin`;
    const payload = { email, password };
    try {
      const response = await axios.post(url, payload);
      const accessToken = response.data.access_token;
      const userFullname =
        response.data.first_name + " " + response.data.last_name;
      const username = response.data.username;
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("userFullname", userFullname);
      localStorage.setItem("username", username);

      navigate("/chat");
    } catch (error) {
      if (error.response && error.response.status === 401) {
        setError("Invalid email or password");
      } else {
        setError("An error occurred. Please try again.");
      }
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-form">
        <h2>Login</h2>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="text"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <p className="error-message">{error}</p>}
        <button type="submit">Login</button>
        <p>
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </form>
    </div>
  );
};

export default LoginForm;
