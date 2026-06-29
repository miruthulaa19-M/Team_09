import { useState, useEffect } from "react";
import VendorSidebar from "../../components/vendor/VendorSidebar";
import VendorNavbar  from "../../components/vendor/VendorNavbar";
import "../../styles/VendorPortal.css";

const BASE = "http://localhost:5000";

function VendorDashboard() {
  const vendor_id = localStorage.getItem("vendor_id");
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    fetch(`${BASE}/api/vendor/dashboard/${vendor_id}`)
      .then(r => { if (!r.ok) throw new Error("Failed to load dashboard"); return r.json(); })
      .then(d => { setStats(d); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [vendor_id]);

  const CARDS = stats ? [
    { label: "Total Requirements Received",  value: stats.total_requirements  ?? 0 },
    { label: "Total Quotations Submitted",   value: stats.total_quotations    ?? 0 },
    { label: "Total Accepted",               value: stats.total_accepted      ?? 0 },
    { label: "Total Rejected",               value: stats.total_rejected      ?? 0 },
  ] : [];

  return (
    <div className="vp-shell">
      <VendorSidebar />
      <div className="vp-main">
        <VendorNavbar title="Dashboard" />
        <div className="vp-content">
          <div className="vp-page">
            <h3 className="vp-section-title">Overview</h3>
            {loading && <p className="vp-loading">Loading...</p>}
            {error   && <p className="vp-msg-error">{error}</p>}
            {!loading && !error && (
              <div className="vp-cards">
                {CARDS.map(({ label, value }) => (
                  <div className="vp-card" key={label}>
                    <p className="vp-card-val">{value}</p>
                    <p className="vp-card-label">{label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default VendorDashboard;
