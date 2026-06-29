import { useEffect, useState } from "react";
import "../styles/AdminDashboard.css";

function StarRatingPopup({ vendorName, onSubmit, onClose }) {
  const [hovered, setHovered] = useState(0);
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
          <button className="vm-btn-submit" disabled={!selected} onClick={() => onSubmit(selected)}>Submit</button>
        </div>
      </div>
    </div>
  );
}

function VendorManagement() {
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState("");
  const [popup, setPopup] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = () => {
    fetch("/api/quotations")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load quotations");
        return res.json();
      })
      .then((data) => setRecords(Array.isArray(data) ? data : []))
      .catch(() => setError("Failed to load quotations."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = records.filter((v) => {
    const q = search.toLowerCase();
    return (
      (v.company_name || "").toLowerCase().includes(q) ||
      (v.vendor_name || "").toLowerCase().includes(q) ||
      (v.product_name || "").toLowerCase().includes(q)
    );
  });

  const handleAccept = (id, company) => setPopup({ id, company });

  const handleReject = async (id) => {
    try {
      const res = await fetch(`/api/quotations/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Rejected" }),
      });
      if (!res.ok) throw new Error("Failed to reject quotation");
      load();
    } catch {
      setError("Failed to reject quotation.");
    }
  };

  const handleRatingSubmit = async (stars) => {
    try {
      const res = await fetch(`/api/quotations/${popup.id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Accepted", rating: stars, comments: "" }),
      });
      if (!res.ok) throw new Error("Failed to accept quotation");
      setPopup(null);
      load();
    } catch {
      setError("Failed to accept quotation.");
    }
  };

  return (
    <div className="vm-wrap">
      {popup && (
        <StarRatingPopup vendorName={popup.company} onSubmit={handleRatingSubmit} onClose={() => setPopup(null)} />
      )}

      <div className="vm-toolbar">
        <h3 className="dh-section-title">Vendor Management</h3>
        <input className="vm-search" type="text" placeholder="Search by vendor or product..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {error && <p className="api-error-inline">{error}</p>}
      {loading && <p className="vm-empty">Loading quotations...</p>}

      <div className="vm-table-wrap">
        <table className="vm-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Vendor</th>
              <th>Product</th>
              <th>Amount (₹)</th>
              <th>Delivery</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="vm-empty">No records found.</td></tr>
            ) : filtered.map((v, i) => (
              <tr key={v.id}>
                <td>{i + 1}</td>
                <td>{v.company_name || v.vendor_name}</td>
                <td>{v.product_name}</td>
                <td>₹{parseFloat(v.total_amount || 0).toLocaleString()}</td>
                <td>{v.delivery_timeline || "—"}</td>
                <td>
                  <span className={`vm-badge ${v.status === "Accepted" ? "badge-accepted" : v.status === "Rejected" ? "badge-rejected" : "badge-pending"}`}>
                    {v.status || "Pending"}
                  </span>
                </td>
                <td>
                  {(!v.status || v.status === "Pending") && (
                    <div className="vm-actions">
                      <button className="vm-btn-accept" onClick={() => handleAccept(v.id, v.company_name || v.vendor_name)}>Accept</button>
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
