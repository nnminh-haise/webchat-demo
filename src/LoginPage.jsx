import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './LoginPage.css';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Handle login logic here
    
    const authenticationDate = {
      email,
      password
    };
    
    try {
      const response = await fetch('http://localhost:8080/api/v1/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(authenticationDate),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Login successful:', data);

        // Store the JWT token in sessionStorage
        sessionStorage.setItem('jwtToken', data.jwt);

        // Redirect or show success message
        navigate('/chat');
      } else {
        const errorData = await response.json();
        console.error('Login failed:', errorData);
        // Show error message
      }
    }
    catch (error) {
      console.error('Error:', error);
    }

  };

  return (
    <div className="login-container">
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
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
        <button type="submit">Login</button>
      </form>
      <p>
        Don't have an account? <Link to="/register">Sign up</Link>
      </p>
    </div>
  );
};

export default LoginPage;
