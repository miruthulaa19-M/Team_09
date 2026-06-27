import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "../../styles/VendorPortal.css";

const LINKS = [
  { to: "/vendor/dashboard",      label: "Dashboard"      },
  { to: "/vendor/products",       label: "My Products"    },
  { to: "/vendor/requirements",   label: "Requirements"   },
  { to: "/vendor/my-quotations",  label: "My Quotations"  },
  { to: "/vendor/my-orders",      label: "My Orders"      },
  { to: "/vendor/my-ratings",     label: "My Ratings"     },
  { to: "/vendor/profile",        label: "Profile"        },
];

function VendorSidebar() {
  const [open, setOpen] = useState(true);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate("/vendor-login");
  };

  return (
    <aside className={`vp-sidebar${open ? "" : " collapsed"}`}>
      <div className="vp-sb-header">
        {open && <span className="vp-sb-logo">Vendor Portal</span>}
        <button className="vp-hamburger" onClick={() => setOpen(o => !o)} aria-label="Toggle">
          <span /><span /><span />
        </button>
      </div>

      <nav className="vp-nav">
        {LINKS.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `vp-nav-link${isActive ? " active" : ""}`}
            title={!open ? label : undefined}
          >
            <span className="vp-nav-dot" />
            {open && <span className="vp-nav-label">{label}</span>}
          </NavLink>
        ))}
      </nav>

      <button
        className="vp-nav-link vp-sb-logout"
        onClick={handleLogout}
        title={!open ? "Logout" : undefined}
      >
        <span className="vp-nav-dot vp-nav-dot--logout" />
        {open && <span className="vp-nav-label">Logout</span>}
      </button>
    </aside>
  );
}

export default VendorSidebar;
