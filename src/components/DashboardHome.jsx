import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/AdminDashboard.css";
import API_BASE from "../api";

const STAT_META = [
  { key: "total_vendors",              label: "Total Vendors",       icon: "🏢", color: "#3B82F6", bg: "#EFF6FF" },
  { key: "total_quotations",           label: "Quotations",          icon: "📋", color: "#8B5CF6", bg: "#F5F3FF" },
  { key: "total_accepted_quotations",  label: "Accepted Quotations", icon: "✅", color: "#10B981", bg: "#ECFDF5" },
  { key: "total_purchases",            label: "Total Purchases",     icon: "🛒", color: "#F59E0B", bg: "#FFFBEB" },
];

const QUICK = [
  { label: "Vendor Management", icon: "👥", to: "/admin-dashboard/vendor-management" },
  { label: "Purchase History",  icon: "📦", to: "/admin-dashboard/purchase-history"  },
  { label: "Vendor List",       icon: "📄", to: "/admin-dashboard/vendor-list"       },
  { label: "Purchase Orders",   icon: "🧾", to: "/admin-dashboard/purchase-orders"   },
];

function DashboardHome() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API_BASE}/api/dashboard/admin`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(setStats)
      .catch(() => setError("Failed to load dashboard stats."))
      .finally(() => setLoading(false));
  }, []);

  const now = new Date();
  const greeting = now.getHours() < 12 ? "Good morning" : now.getHours() < 17 ? "Good afternoon" : "Good evening";
  const dateStr  = now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  return (
    <div className="dh-wrap">
      {loading && <p className="vm-empty">Loading dashboard...</p>}
      {error   && <p className="api-error-inline">{error}</p>}

      {!loading && !error && (
        <>
          {/* Welcome banner */}
          <div className="dh-banner">
            <div>
              <p className="dh-greeting">{greeting}, Admin 👋</p>
              <p className="dh-date">{dateStr}</p>
            </div>
            <div className="dh-banner-badge">Admin Portal</div>
          </div>

          {/* Stat cards */}
          <div className="dh-cards">
            {STAT_META.map(({ key, label, icon, color, bg }) => (
              <div className="dh-card" key={key} style={{ "--card-color": color, "--card-bg": bg }}>
                <div className="dh-card-icon">{icon}</div>
                <div>
                  <p className="dh-card-value">{stats?.[key] ?? 0}</p>
                  <p className="dh-card-label">{label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Quick actions */}
          <div className="dh-section-header">Quick Actions</div>
          <div className="dh-quick">
            {QUICK.map(({ label, icon, to }) => (
              <button key={to} className="dh-quick-btn" onClick={() => navigate(to)}>
                <span className="dh-quick-icon">{icon}</span>
                <span className="dh-quick-label">{label}</span>
                <span className="dh-quick-arrow">→</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default DashboardHome;
