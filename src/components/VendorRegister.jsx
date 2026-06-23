import React from "react";
import { Link } from "react-router-dom";
import "../styles/VendorRegister.css";

function VendorRegister() {
  return (
    <div className="register-container">
      <div className="register-box">
        <h1>Vendor Registration</h1>

        <label>Company Name</label>
        <input
          type="text"
          placeholder="Enter Company Name"
        />

        <label>Vendor Name</label>
        <input
          type="text"
          placeholder="Enter Vendor Name"
        />

        <label>Vendor Phone Number</label>
        <input
          type="tel"
          placeholder="91XXXXXXXXXX"
        />

        <label>Email</label>
        <input
          type="email"
          placeholder="example@gmail.com"
        />

        <label>Password</label>
        <input
          type="password"
          placeholder="Enter Password"
        />

        <label>Confirm Password</label>
        <input
          type="password"
          placeholder="Confirm Password"
        />

        <button className="register-btn">
          Register
        </button>

        <p className="login-link">
          Already have an account?{" "}
          <Link to="/vendor-login">
            Click Here
          </Link>
        </p>
      </div>
    </div>
  );
}

export default VendorRegister;