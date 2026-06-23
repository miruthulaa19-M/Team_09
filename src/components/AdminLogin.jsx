import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/AdminLogin.css";

function AdminLogin() {

  const navigate = useNavigate();

  const handleLogin = () => {

    // Later you can add validation

    navigate("/admin-dashboard");
  };

  return (

    <div className="admin-container">

      <div className="admin-box">

        <h1>Admin Login</h1>

        <div className="input-group">

          <label>Email</label>

          <input
            type="email"
            placeholder="Enter Email"
          />

        </div>

        <div className="input-group">

          <label>Password</label>

          <input
            type="password"
            placeholder="Enter Password"
          />

        </div>

        <div className="forgot">

          <a href="#">Forgot Password?</a>

        </div>

        <button
          className="signup-btn"
        >
          Sign Up
        </button>

        <p className="signin-text">

          Do you already have an account?

          <span
            onClick={handleLogin}
          >
            Click Here Sign In
          </span>

        </p>

      </div>

    </div>

  );

}

export default AdminLogin;