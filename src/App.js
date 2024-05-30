import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import LoginPage from "./auth/LoginPage";
import RegisterPage from "./auth/RegisterPage";
import ChatPage from "./chat/ChatPage";
import "font-awesome/css/font-awesome.min.css";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/chat" element={<ChatPage />} />
      </Routes>
    </Router>
  );
};

export default App;
