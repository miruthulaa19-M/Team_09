import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Home.css";

function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <div className="home-box">

        <h1 className="home-title">
          Vendor Management System
        </h1>

        <button
          className="btn admin-btn"
          onClick={() => navigate("/admin-login")}
        >
          Admin Login
        </button>

        <button
          className="btn vendor-btn"
          onClick={() => navigate("/vendor-register")}
        >
          Vendor Login
        </button>

      </div>
    </div>
  );
}

export default Home;