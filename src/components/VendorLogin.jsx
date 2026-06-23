import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/VendorLogin.css";

function VendorLogin() {

  const navigate = useNavigate();

  const handleLogin = () => {

    // Later you can add validation

    navigate("/vendor-dashboard");

  };

  return (

    <div className="login-container">

      <div className="login-box">

        <h1>Vendor Login</h1>

        <div className="input-group">

          <label>Email ID</label>

          <input
            type="email"
            placeholder="Enter Email ID"
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
          className="login-btn"
          onClick={handleLogin}
        >

          Login

        </button>

      </div>

    </div>

  );

}

export default VendorLogin;