import { useState, useEffect } from "react";
import VendorSidebar from "../../components/vendor/VendorSidebar";
import VendorNavbar  from "../../components/vendor/VendorNavbar";
import "../../styles/VendorPortal.css";
import API_BASE from "../../api";

function VendorDashboard() {
  const vendor_id = localStorage.getItem("vendor_id");
  const [stats,   setStats]   = useState(null);
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/api/vendor/dashboard/${vendor_id}`).then(r => { if (!r.ok) throw new Error("Failed to load dashboard"); return r.json(); }),
      fetch(`${API_BASE}/api/purchase-history/vendor/${vendor_id}`).then(r => { if (!r.ok) throw new Error("Failed to load orders"); return r.json(); }),
    ])
      .then(([dashData, orderData]) => {
        setStats(dashData);
        setOrders(orderData);
        setLoading(false);
      })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [vendor_id]);

  const OVERVIEW_CARDS = stats ? [
    { label: "Total Requirements Received", value: stats.total_requirements ?? 0, color: "#1E3A8A" },
    { label: "Total Quotations Submitted",  value: stats.total_quotations    ?? 0, color: "#0369A1" },
    { label: "Total Accepted",              value: stats.total_accepted      ?? 0, color: "#059669" },
    { label: "Total Rejected",              value: stats.total_rejected      ?? 0, color: "#DC2626" },
  ] : [];

  return (
    <div className="vp-shell">
      <VendorSidebar />
      <div className="vp-main">
        <VendorNavbar title="Dashboard" />
        <div className="vp-content">
          <div className="vp-page">
            {loading && <p className="vp-loading">Loading...</p>}
            {error   && <p className="vp-msg-error">{error}</p>}

            {!loading && !error && (
              <>
                <div>
                  <h3 className="vp-section-title">Overview</h3>
                  <div className="vp-cards">
                    {OVERVIEW_CARDS.map(({ label, value, color }) => (
                      <div className="vp-card" key={label} style={{ borderColor: color }}>
                        <p className="vp-card-val" style={{ color }}>{value}</p>
                        <p className="vp-card-label">{label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="vp-section-title">My Order Overview</h3>
                  {orders.length === 0 ? (
                    <div className="vp-order-empty">No orders received yet.</div>
                  ) : (
                    <div className="vp-order-list">
                      {orders.map((o, i) => {
                        const poNumber = o.po_number || `PO-${String(o.id || i + 1).padStart(4, "0")}`;
                        const company  = o.company_name || o.vendor_company_name || "—";
                        const product  = o.product_name || "—";
                        const amount   = parseFloat(o.total_price || 0).toLocaleString("en-IN");
                        const unitPrice = parseFloat(o.unit_price || 0).toLocaleString("en-IN");
                        const delivery = o.delivery_date || o.purchase_date || "—";
                        const date     = o.purchase_date ? new Date(o.purchase_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

                        return (
                          <div className="vp-order-item" key={o.id || i}>
                            <div className="vp-order-item-top">
                              <div className="vp-order-po">
                                <span className="vp-order-po-label">PO Number</span>
                                <span className="vp-order-po-val">{poNumber}</span>
                              </div>
                              <span className="vp-badge-status badge-accepted">Completed</span>
                            </div>

                            <div className="vp-order-item-body">
                              <div className="vp-order-detail">
                                <span className="vp-od-icon">🏢</span>
                                <div>
                                  <p className="vp-od-label">Company</p>
                                  <p className="vp-od-val">{company}</p>
                                </div>
                              </div>
                              <div className="vp-order-detail">
                                <span className="vp-od-icon">📦</span>
                                <div>
                                  <p className="vp-od-label">Product</p>
                                  <p className="vp-od-val">{product}</p>
                                </div>
                              </div>
                              <div className="vp-order-detail">
                                <span className="vp-od-icon">💰</span>
                                <div>
                                  <p className="vp-od-label">Unit Price</p>
                                  <p className="vp-od-val">₹{unitPrice}</p>
                                </div>
                              </div>
                              <div className="vp-order-detail">
                                <span className="vp-od-icon">🧾</span>
                                <div>
                                  <p className="vp-od-label">Total Amount</p>
                                  <p className="vp-od-val vp-od-amount">₹{amount}</p>
                                </div>
                              </div>
                              <div className="vp-order-detail">
                                <span className="vp-od-icon">🚚</span>
                                <div>
                                  <p className="vp-od-label">Delivery Date</p>
                                  <p className="vp-od-val">{delivery}</p>
                                </div>
                              </div>
                              <div className="vp-order-detail">
                                <span className="vp-od-icon">📅</span>
                                <div>
                                  <p className="vp-od-label">Order Date</p>
                                  <p className="vp-od-val">{date}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default VendorDashboard;
