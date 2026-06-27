import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { VendorProvider } from "../context/VendorContext";
import "../styles/AdminDashboard.css";

const NAV = [
  { to: "/admin-dashboard",                     label: "Dashboard"        },
  { to: "/admin-dashboard/vendor-management",   label: "Vendor Management"},
  { to: "/admin-dashboard/purchase-history",    label: "Purchase History" },
  { to: "/admin-dashboard/vendor-list",         label: "Vendor List"      },
  { to: "/admin-dashboard/purchase-orders",     label: "Purchase Orders"  },
  { to: "/admin-dashboard/profile",             label: "Profile"          },
];

function AdminDashboard() {
  const [open, setOpen] = useState(true);
  const navigate        = useNavigate();

  return (
    <VendorProvider>
      <div className="ad-shell">
        {/* ── Sidebar ── */}
        <aside className={`ad-sidebar${open ? "" : " collapsed"}`}>
          <div className="ad-sidebar-header">
            {open && <span className="ad-logo">Vendor Portal</span>}
            <button
              className="ad-hamburger"
              onClick={() => setOpen((o) => !o)}
              aria-label="Toggle menu"
            >
              <span /><span /><span />
            </button>
          </div>

          <nav className="ad-nav">
            {NAV.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/admin-dashboard"}
                className={({ isActive }) => `ad-nav-item${isActive ? " active" : ""}`}
                title={!open ? label : undefined}
              >
                <span className="ad-nav-dot" />
                {open && <span className="ad-nav-label">{label}</span>}
              </NavLink>
            ))}
          </nav>

          <button
            className="ad-nav-item ad-logout"
            onClick={() => navigate("/admin-login")}
            title={!open ? "Logout" : undefined}
          >
            <span className="ad-nav-dot ad-nav-dot--logout" />
            {open && <span className="ad-nav-label">Logout</span>}
          </button>
        </aside>

        {/* ── Main ── */}
        <div className="ad-main">
          <header className="ad-topbar">
            <h2 className="ad-page-title">Admin Dashboard</h2>
            <div className="ad-admin-badge">Admin</div>
          </header>
          <main className="ad-content">
            <Outlet />
          </main>
        </div>
      </div>
    </VendorProvider>
  );
}

export default AdminDashboard;
