import { useEffect, useState } from "react";
import "../styles/AdminDashboard.css";

const MONTHLY = [
  { month: "Jan", value: 12 }, { month: "Feb", value: 18 },
  { month: "Mar", value: 9  }, { month: "Apr", value: 24 },
  { month: "May", value: 16 }, { month: "Jun", value: 30 },
  { month: "Jul", value: 22 }, { month: "Aug", value: 14 },
  { month: "Sep", value: 27 }, { month: "Oct", value: 19 },
  { month: "Nov", value: 33 }, { month: "Dec", value: 28 },
];

const MAX = Math.max(...MONTHLY.map((m) => m.value));

function DashboardHome() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/dashboard/admin")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load dashboard stats");
        return res.json();
      })
      .then((data) => setStats(data))
      .catch(() => setError("Failed to load dashboard stats."))
      .finally(() => setLoading(false));
  }, []);

  const STATS = stats
    ? [
        { label: "Total Vendors Registered", value: stats.total_vendors ?? 0 },
        { label: "Total Quotations Submitted", value: stats.total_quotations ?? 0 },
        { label: "Total Accepted Quotations", value: stats.total_accepted_quotations ?? 0 },
        { label: "Total Purchases", value: stats.total_purchases ?? 0 },
      ]
    : [];

  return (
    <div className="dh-wrap">
      {loading && <p className="vm-empty">Loading dashboard...</p>}
      {error && <p className="api-error-inline">{error}</p>}
      {!loading && !error && (
        <>
          <div className="dh-cards">
            {STATS.map(({ label, value }) => (
              <div className="dh-card" key={label}>
                <p className="dh-card-value">{value}</p>
                <p className="dh-card-label">{label}</p>
              </div>
            ))}
          </div>

          <div className="dh-chart-box">
            <h3 className="dh-section-title">Monthly Purchase Summary</h3>
            <div className="dh-chart">
              {MONTHLY.map(({ month, value }) => (
                <div className="dh-bar-group" key={month}>
                  <div className="dh-bar-wrap">
                    <span className="dh-bar-val">{value}</span>
                    <div className="dh-bar" style={{ height: `${(value / MAX) * 180}px` }} />
                  </div>
                  <span className="dh-bar-month">{month}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default DashboardHome;
