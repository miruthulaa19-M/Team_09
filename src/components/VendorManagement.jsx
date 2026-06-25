import { useState } from "react";
import { useVendors } from "../context/VendorContext";
import "../styles/AdminDashboard.css";

function StarRatingPopup({ vendorName, onSubmit, onClose }) {
  const [hovered,  setHovered]  = useState(0);
  const [selected, setSelected] = useState(0);

  return (
    <div className="vm-overlay">
      <div className="vm-popup">
        <h3 className="vm-popup-title">Rate Vendor</h3>
        <p className="vm-popup-sub">{vendorName}</p>
        <div className="vm-stars">
          {[1, 2, 3, 4, 5].map((s) => (
            <span
              key={s}
              className={`vm-star${s <= (hovered || selected) ? " filled" : ""}`}
              onMouseEnter={() => setHovered(s)}
              onMouseLeave={() => setHovered(0)}
              onClick={() => setSelected(s)}
            >★</span>
          ))}
        </div>
        <p className="vm-star-label">
          {selected ? `${selected} Star${selected > 1 ? "s" : ""}` : "Select a rating"}
        </p>
        <div className="vm-popup-actions">
          <button className="vm-btn-cancel" onClick={onClose}>Cancel</button>
          <button
            className="vm-btn-submit"
            disabled={!selected}
            onClick={() => onSubmit(selected)}
          >Submit</button>
        </div>
      </div>
    </div>
  );
}

function VendorManagement() {
  const { vendors, setVendors } = useVendors();
  const [search, setSearch]     = useState("");
  const [popup,  setPopup]      = useState(null);

  const filtered = vendors.filter((v) =>
    v.company.toLowerCase().includes(search.toLowerCase()) ||
    v.product.toLowerCase().includes(search.toLowerCase())
  );

  const handleAccept = (id, company) => setPopup({ id, company });

  const handleReject = (id) =>
    setVendors((vs) => vs.map((v) => v.id === id ? { ...v, status: "Rejected" } : v));

  const handleRatingSubmit = (stars) => {
    setVendors((vs) =>
      vs.map((v) => v.id === popup.id ? { ...v, status: `Accepted (${stars} stars)` } : v)
    );
    setPopup(null);
  };

  return (
    <div className="vm-wrap">
      {popup && (
        <StarRatingPopup
          vendorName={popup.company}
          onSubmit={handleRatingSubmit}
          onClose={() => setPopup(null)}
        />
      )}

      <div className="vm-toolbar">
        <h3 className="dh-section-title">Vendor Management</h3>
        <input
          className="vm-search"
          type="text"
          placeholder="Search by company or product..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="vm-table-wrap">
        <table className="vm-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Company Name</th>
              <th>Product Name</th>
              <th>Product Price (₹)</th>
              <th>Total Qty</th>
              <th>Total Price (₹)</th>
              <th>Delivery Date</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={9} className="vm-empty">No records found.</td></tr>
            ) : filtered.map((v, i) => (
              <tr key={v.id}>
                <td>{i + 1}</td>
                <td>{v.company}</td>
                <td>{v.product}</td>
                <td>₹{v.price.toLocaleString()}</td>
                <td>{v.qty}</td>
                <td>₹{v.total.toLocaleString()}</td>
                <td>{v.delivery}</td>
                <td>
                  <span className={`vm-badge ${
                    v.status === "Pending"  ? "badge-pending"  :
                    v.status === "Rejected" ? "badge-rejected" : "badge-accepted"
                  }`}>{v.status}</span>
                </td>
                <td>
                  {v.status === "Pending" && (
                    <div className="vm-actions">
                      <button className="vm-btn-accept" onClick={() => handleAccept(v.id, v.company)}>Accept</button>
                      <button className="vm-btn-reject" onClick={() => handleReject(v.id)}>Reject</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default VendorManagement;
