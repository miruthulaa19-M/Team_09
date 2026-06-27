import { useState, useEffect } from "react";
import "../../styles/AdminDashboard.css";

function VendorList() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  const fetchVendors = async () => {
    try {
      const res  = await fetch("/api/vendors");
      const data = await res.json();
      setVendors(Array.isArray(data) ? data : []);
    } catch {
      setError("Failed to load vendors.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchVendors(); }, []);

  const updateStatus = async (id, status) => {
    try {
      const res = await fetch(`/api/vendors/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      await fetchVendors();
    } catch (e) {
      setError(e.message || "Failed to update vendor status.");
    }
  };

  if (loading) return <div className="vm-empty">Loading vendors...</div>;

  return (
    <div className="vm-wrap">
      <div className="vm-toolbar">
        <h3 className="dh-section-title">Vendor List</h3>
      </div>

      {error && <p className="api-error-inline">{error}</p>}

      <div className="vm-table-wrap">
        <table className="vm-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Vendor Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Company</th>
              <th>Category</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {vendors.length === 0 ? (
              <tr><td colSpan={8} className="vm-empty">No vendors registered yet.</td></tr>
            ) : vendors.map((v, i) => (
              <tr key={v.id}>
                <td>{i + 1}</td>
                <td>{v.vendor_name}</td>
                <td>{v.email}</td>
                <td>{v.contact}</td>
                <td>{v.company_name}</td>
                <td>{v.category || "—"}</td>
                <td>
                  <span className={`vm-badge ${
                    v.status === "approved" ? "badge-accepted" :
                    v.status === "rejected" ? "badge-rejected" : "badge-pending"
                  }`}>
                    {v.status ?? "pending"}
                  </span>
                </td>
                <td>
                  {(!v.status || v.status === "pending") && (
                    <div className="vm-actions">
                      <button className="vm-btn-accept" onClick={() => updateStatus(v.id, "approved")}>Approve</button>
                      <button className="vm-btn-reject" onClick={() => updateStatus(v.id, "rejected")}>Reject</button>
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

export default VendorList;
