import "../../styles/VendorPortal.css";

function VendorNavbar({ title }) {
  const name = localStorage.getItem("vendor_name") || "Vendor";

  return (
    <header className="vp-topbar">
      <h2 className="vp-topbar-title">{title}</h2>
      <div className="vp-badge">{name}</div>
    </header>
  );
}

export default VendorNavbar;
