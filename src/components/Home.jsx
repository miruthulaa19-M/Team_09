import { useNavigate } from "react-router-dom";
import "../styles/Home.css";

function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <div className="home-box">
        <h1 className="home-logo">Vendor Portal</h1>
        <p className="home-subtitle">Vendor Management System</p>

        <button
          className="home-btn home-btn-primary"
          onClick={() => navigate("/admin-login")}
        >
          Admin Login
        </button>

        <button
          className="home-btn home-btn-secondary"
          onClick={() => navigate("/vendor-login")}
        >
          Vendor Login
        </button>
      </div>
    </div>
  );
}

export default Home;
