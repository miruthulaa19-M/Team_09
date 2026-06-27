import { useState, useEffect } from "react";
import VendorSidebar from "../../components/vendor/VendorSidebar";
import VendorNavbar  from "../../components/vendor/VendorNavbar";
import "../../styles/VendorPortal.css";

const BASE = "http://localhost:5000";

function MyQuotations() {
  const vendor_id = localStorage.getItem("vendor_id");
  const [quotations, setQuotations] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");

  useEffect(() => {
    fetch(`${BASE}/api/quotations/vendor/${vendor_id}`)
      .then(r => { if (!r.ok) throw new Error("Failed to load quotations"); return r.json(); })
      .then(d => { setQuotations(d); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [vendor_id]);

  const badgeClass = s => {
    if (!s) return "badge-pending";
    const l = s.toLowerCase();
    if (l === "accepted") return "badge-accepted";
    if (l === "rejected") return "badge-rejected";
    return "badge-pending";
  };

  return (
    <div className="vp-shell">
      <VendorSidebar />
      <div className="vp-main">
        <VendorNavbar title="My Quotations" />
        <div className="vp-content">
          <div className="vp-page">
            <h3 className="vp-section-title">My Quotations</h3>
            {loading && <p className="vp-loading">Loading...</p>}
            {error   && <p className="vp-msg-error">{error}</p>}
            {!loading && !error && (
              <div className="vp-table-wrap">
                <table className="vp-table">
                  <thead>
                    <tr>
                      <th>Quotation No.</th>
                      <th>Product Name</th>
                      <th>Amount Quoted (₹)</th>
                      <th>Submitted Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quotations.length === 0 ? (
                      <tr><td colSpan={5} className="vp-empty">No quotations submitted yet.</td></tr>
                    ) : quotations.map((q, i) => (
                      <tr key={q.id || i}>
                        <td>QUO-{String(q.id || i + 1).padStart(4, "0")}</td>
                        <td>{q.product_name}</td>
                        <td>₹{parseFloat(q.total_amount || q.total_price || 0).toLocaleString()}</td>
                        <td>{q.submitted_date ? new Date(q.submitted_date).toLocaleDateString() : "—"}</td>
                        <td>
                          <span className={`vp-badge-status ${badgeClass(q.status)}`}>
                            {q.status || "Pending"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MyQuotations;
