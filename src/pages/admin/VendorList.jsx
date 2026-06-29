import { useState, useEffect } from "react";
import "../../styles/AdminDashboard.css";

function VendorList() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

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

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        const res = await fetch("/api/vendors");
        const data = await res.json();
        if (isMounted) {
          setVendors(Array.isArray(data) ? data : []);
        }
      } catch {
        if (isMounted) setError("Failed to load vendors.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    return () => { isMounted = false; };
  }, []);

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

  // derive categories from loaded vendors
  const derivedCategories = Array.from(new Set(vendors.map((v) => v.category || "Uncategorized")));
  const categories = ["All", ...derivedCategories];

  // vendors to display based on selected category
  const displayVendors = selectedCategory === "All"
    ? vendors
    : vendors.filter((v) => (v.category || "Uncategorized") === selectedCategory);

  return (
    <div className="vm-wrap">
      <div className="vm-toolbar">
        <h3 className="dh-section-title">Vendor List</h3>
      </div>

      {error && <p className="api-error-inline">{error}</p>}

      <div className="vm-table-wrap">
        <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: 12 }}>
          <label style={{ margin: 0, fontWeight: 600 }}>Filter by category:</label>
          <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
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
            {displayVendors.length === 0 ? (
              <tr><td colSpan={8} className="vm-empty">No vendors found for this category.</td></tr>
            ) : (
              // If showing all, insert category header rows for easier grouping
              (selectedCategory === "All") ? (
                (() => {
                  const rows = [];
                  let idx = 0;
                  const groups = {};
                  for (const v of displayVendors) {
                    const key = v.category || "Uncategorized";
                    groups[key] = groups[key] || [];
                    groups[key].push(v);
                  }
                  for (const cat of Object.keys(groups)) {
                    rows.push(
                      <tr key={`cat-${cat}`} className="vm-category-row"><td colSpan={8} style={{ fontWeight: 700, background: "#f7f7f7" }}>{cat}</td></tr>
                    );
                    for (const v of groups[cat]) {
                      idx += 1;
                      rows.push(
                        <tr key={v.id}>
                          <td>{idx}</td>
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
                      );
                    }
                  }
                  return rows;
                })()
              ) : (
                displayVendors.map((v, i) => (
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
                ))
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default VendorList;
