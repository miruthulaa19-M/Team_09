import { useEffect, useState } from "react";
import "../styles/AdminDashboard.css";

function PurchaseHistory() {
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState("");
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () => {
    const query = new URLSearchParams();
    if (search) query.set("search", search);
    if (date) query.set("date", date);

    fetch(`/api/purchase-history?${query.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load purchase history");
        return res.json();
      })
      .then((data) => setRecords(Array.isArray(data) ? data : []))
      .catch(() => setError("Failed to load purchase history."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const grandQty = records.reduce((sum, row) => sum + (Number(row.total_quantity) || 0), 0);
  const grandTotal = records.reduce((sum, row) => sum + (Number(row.total_price) || 0), 0);

  return (
    <div className="ph-wrap">
      <div className="vm-toolbar">
        <h3 className="dh-section-title">Purchase History</h3>
        <div className="vm-actions" style={{ gap: "8px" }}>
          <input className="vm-search" type="text" placeholder="Search vendor or product" value={search} onChange={(e) => setSearch(e.target.value)} />
          <input className="vm-search" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <button className="vm-btn-accept" onClick={load}>Apply</button>
        </div>
      </div>

      {error && <p className="api-error-inline">{error}</p>}
      {loading && <p className="vm-empty">Loading purchase history...</p>}

      <div className="vm-table-wrap">
        <table className="vm-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Vendor</th>
              <th>Product Name</th>
              <th>Total Quantity</th>
              <th>Total Price (₹)</th>
              <th>PO Number</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr><td colSpan={6} className="vm-empty">No accepted purchases yet.</td></tr>
            ) : (
              <>
                {records.map((r, i) => (
                  <tr key={r.id}>
                    <td>{i + 1}</td>
                    <td>{r.company_name}</td>
                    <td>{r.product_name}</td>
                    <td>{r.total_quantity}</td>
                    <td>₹{Number(r.total_price || 0).toLocaleString()}</td>
                    <td>{r.po_number || "—"}</td>
                  </tr>
                ))}
                <tr className="ph-total-row">
                  <td colSpan={3}>Grand Total</td>
                  <td>{grandQty}</td>
                  <td>₹{grandTotal.toLocaleString()}</td>
                  <td />
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default PurchaseHistory;
