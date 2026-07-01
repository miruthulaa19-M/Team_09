import { useNavigate } from "react-router-dom";
import "../styles/Home.css";

function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-page">
      <div className="home-circle home-circle-1" />
      <div className="home-circle home-circle-2" />

      <div className="home-content">
        <div className="home-brand">
          <div className="home-brand-icon">🏭</div>
          <div>
            <p className="home-brand-name">Vendor Portal</p>
            <p className="home-brand-sub">Management System</p>
          </div>
        </div>

        <div className="home-cards">
          <button className="home-card home-card-admin" onClick={() => navigate("/admin-login")}>
            <span className="home-card-icon">🛡️</span>
            <p className="home-card-label">Admin Portal</p>
            <p className="home-card-hint">Manage vendors & orders</p>
            <span className="home-card-arrow">→</span>
          </button>

          <button className="home-card home-card-vendor" onClick={() => navigate("/vendor-login")}>
            <span className="home-card-icon">🏭</span>
            <p className="home-card-label">Vendor Portal</p>
            <p className="home-card-hint">Submit quotes & track orders</p>
            <span className="home-card-arrow">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default Home;
