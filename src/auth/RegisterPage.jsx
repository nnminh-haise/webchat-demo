import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./RegisterPage.css";
import axios from "axios";

const BACKEND_SERVER_URL = "http://localhost:8081";

const RegisterPage = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      firstName,
      lastName,
      email,
      password,
      gender,
      dateOfBirth,
    };

    const url = `${BACKEND_SERVER_URL}/api/v1/auth/signup`;
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
      if (error.response && error.response.status === 400) {
        const message = error.response.data.message;
        setError(message);
      } else {
        setError("An error occurred. Please try again.");
      }
    }
  };

  return (
    <div className="register-container">
      <h2>Register</h2>
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label htmlFor="firstName">First Name:</label>
          <input
            type="text"
            id="firstName"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
        </div>
        <div className="input-group">
          <label htmlFor="lastName">Last Name:</label>
          <input
            type="text"
            id="lastName"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
        </div>
        <div className="input-group">
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="input-group">
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div className="input-group">
          <label htmlFor="dateOfBirth">Date of Birth:</label>
          <input
            type="date"
            id="dateOfBirth"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
            required
          />
        </div>
        <div className="input-group">
          <label htmlFor="gender">Gender:</label>
          <select
            id="gender"
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            required
          >
            <option value="">Select Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
        <button type="submit">Register</button>
        {error && <p className="error-message">{error}</p>}
      </form>
      <p>
        Already have an account? <Link to="/">Login</Link>
      </p>
    </div>
  );
};

export default RegisterPage;
