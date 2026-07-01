import { useEffect, useState } from "react";
import "../styles/AdminDashboard.css";
import API_BASE from "../api";

const COLORS = ["#1E3A8A","#3B82F6","#10B981","#F59E0B","#EF4444","#8B5CF6","#EC4899","#06B6D4"];

function Stars({ count }) {
  if (!count) return <span style={{ color: "#9CA3AF", fontSize: 12 }}>—</span>;
  return (
    <span style={{ display: "inline-flex", gap: 1 }}>
      {[1,2,3,4,5].map(s => (
        <span key={s} style={{ fontSize: 14, color: s <= count ? "#F59E0B" : "#E5E7EB" }}>★</span>
      ))}
    </span>
  );
}

function PieChart({ data }) {
  if (!data.length) return null;

  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return null;

  let cumAngle = -90;
  const cx = 80, cy = 80, r = 68;

  const slices = data.map((d, i) => {
    const angle = (d.value / total) * 360;
    const start = cumAngle;
    cumAngle += angle;
    const end = cumAngle;

    const toRad = deg => (deg * Math.PI) / 180;
    const x1 = cx + r * Math.cos(toRad(start));
    const y1 = cy + r * Math.sin(toRad(start));
    const x2 = cx + r * Math.cos(toRad(end));
    const y2 = cy + r * Math.sin(toRad(end));
    const large = angle > 180 ? 1 : 0;

    return { ...d, path: `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2} Z`, color: COLORS[i % COLORS.length] };
  });

  return (
    <div className="ph-chart-card">
      <p className="ph-chart-title">Monthly Purchase by Category</p>
      <div className="ph-chart-inner">
        <svg width="160" height="160" viewBox="0 0 160 160">
          {slices.map((s, i) => (
            <path key={i} d={s.path} fill={s.color} stroke="#fff" strokeWidth="2">
              <title>{s.label}: ₹{s.value.toLocaleString()}</title>
            </path>
          ))}
          <circle cx={cx} cy={cy} r="36" fill="#fff" />
          <text x={cx} y={cy - 6} textAnchor="middle" fontSize="10" fontWeight="700" fill="#374151">Total</text>
          <text x={cx} y={cy + 10} textAnchor="middle" fontSize="9" fill="#6B7280">₹{(total/1000).toFixed(0)}k</text>
        </svg>

        <div className="ph-legend">
          {slices.map((s, i) => (
            <div key={i} className="ph-legend-item">
              <span className="ph-legend-dot" style={{ background: s.color }} />
              <span className="ph-legend-label">{s.label}</span>
              <span className="ph-legend-val">₹{s.value.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PurchaseHistory() {
  const [records, setRecords] = useState([]);
  const [search, setSearch]   = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  const load = (q = "") => {
    const query = q ? `?search=${encodeURIComponent(q)}` : "";
    fetch(`${API_BASE}/api/purchase-history${query}`)
      .then(res => { if (!res.ok) throw new Error(); return res.json(); })
      .then(data => setRecords(Array.isArray(data) ? data : []))
      .catch(() => setError("Failed to load purchase history."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = search
    ? records.filter(r =>
        (r.company_name || "").toLowerCase().includes(search.toLowerCase()) ||
        (r.product_name || "").toLowerCase().includes(search.toLowerCase()) ||
        (r.vendor_name  || "").toLowerCase().includes(search.toLowerCase())
      )
    : records;

  // Build pie chart data from today's month
  const now = new Date();
  const thisMonth = records.filter(r => {
    if (!r.purchase_date) return false;
    const d = new Date(r.purchase_date);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });

  const categoryMap = {};
  thisMonth.forEach(r => {
    const cat = r.vendor_category || "Other";
    categoryMap[cat] = (categoryMap[cat] || 0) + Number(r.total_price || 0);
  });
  const pieData = Object.entries(categoryMap).map(([label, value]) => ({ label, value }));

  // Use all records for pie if no this-month data
  if (!pieData.length) {
    records.forEach(r => {
      const cat = r.vendor_category || "Other";
      categoryMap[cat] = (categoryMap[cat] || 0) + Number(r.total_price || 0);
    });
    Object.entries(categoryMap).forEach(([label, value]) => pieData.push({ label, value }));
  }

  const grandTotal = filtered.reduce((s, r) => s + Number(r.total_price || 0), 0);

  return (
    <div className="ph-wrap">
      <div className="vm-toolbar">
        <h3 className="dh-section-title">Purchase History</h3>
        <input
          className="vm-search"
          type="text"
          placeholder="Search vendor or product..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {error   && <p className="api-error-inline">{error}</p>}
      {loading && <p className="vm-empty">Loading purchase history...</p>}

      {!loading && !error && (
        <div className="ph-layout">
          <div className="ph-table-col">
            <div className="vm-table-wrap">
              <table className="vm-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Vendor</th>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Total (₹)</th>
                    <th>PO Number</th>
                    <th>Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={7} className="vm-empty">No purchase records found.</td></tr>
                  ) : (
                    <>
                      {filtered.map((r, i) => (
                        <tr key={r.id || i}>
                          <td>{i + 1}</td>
                          <td>{r.company_name || r.vendor_company_name || "—"}</td>
                          <td>{r.product_name}</td>
                          <td>{r.total_quantity}</td>
                          <td>₹{Number(r.total_price || 0).toLocaleString()}</td>
                          <td>{r.po_number || "—"}</td>
                          <td><Stars count={r.rating_stars} /></td>
                        </tr>
                      ))}
                      <tr className="ph-total-row">
                        <td colSpan={4} style={{ fontWeight: 700 }}>Grand Total</td>
                        <td style={{ fontWeight: 700 }}>₹{grandTotal.toLocaleString()}</td>
                        <td colSpan={2} />
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="ph-chart-col">
            <PieChart data={pieData} />
          </div>
        </div>
      )}
    </div>
  );
}

export default PurchaseHistory;
