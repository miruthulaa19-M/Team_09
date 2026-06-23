import React from "react";
import "../styles/Dashboard.css";

function AdminDashboard() {
  return (
    <div className="dashboard-container">

      {/* Sidebar */}

      <div className="sidebar">

        <h2>Admin Panel</h2>

        <ul>

          <li>Dashboard</li>

          <li>Vendor Management</li>

          <li>Add Vendor</li>

          <li>View Vendor</li>

          <li>Edit Vendor</li>

          <li>Delete Vendor</li>

          <li>Orders</li>

          <li>Payments</li>

          <li>Reports</li>

          <li>Settings</li>

          <li>Logout</li>

        </ul>

      </div>

      {/* Main Content */}

      <div className="main-content">

        <h1>Admin Dashboard</h1>

        <div className="card-container">

          <div className="card">

            <h2>Total Vendors</h2>

            <p>120</p>

          </div>

          <div className="card">

            <h2>Active Vendors</h2>

            <p>90</p>

          </div>

          <div className="card">

            <h2>Pending Vendors</h2>

            <p>30</p>

          </div>

        </div>

        <div className="recent">

          <h2>Recent Activities</h2>

          <ul>

            <li>Vendor ABC registered successfully.</li>

            <li>Vendor XYZ payment completed.</li>

            <li>New order created.</li>

          </ul>

        </div>

      </div>

    </div>
  );
}

export default AdminDashboard;