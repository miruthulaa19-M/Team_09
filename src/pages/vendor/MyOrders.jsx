import { useState, useEffect } from "react";
import VendorSidebar from "../../components/vendor/VendorSidebar";
import VendorNavbar  from "../../components/vendor/VendorNavbar";
import "../../styles/VendorPortal.css";

const BASE = "http://localhost:5000";

function MyOrders() {
  const vendor_id = localStorage.getItem("vendor_id");
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    fetch(`${BASE}/api/purchase-history/vendor/${vendor_id}`)
      .then(r => { if (!r.ok) throw new Error("Failed to load orders"); return r.json(); })
      .then(d => { setOrders(d); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [vendor_id]);

  return (
    <div className="vp-shell">
      <VendorSidebar />
      <div className="vp-main">
        <VendorNavbar title="My Orders" />
        <div className="vp-content">
          <div className="vp-page">
            <h3 className="vp-section-title">My Orders</h3>
            {loading && <p className="vp-loading">Loading...</p>}
            {error   && <p className="vp-msg-error">{error}</p>}
            {!loading && !error && (
              <div className="vp-table-wrap">
                <table className="vp-table">
                  <thead>
                    <tr>
                      <th>PO Number</th>
                      <th>Product Name</th>
                      <th>Quantity</th>
                      <th>Amount (₹)</th>
                      <th>Delivery Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.length === 0 ? (
                      <tr><td colSpan={6} className="vp-empty">No orders yet.</td></tr>
                    ) : orders.map((o, i) => (
                      <tr key={o.id || i}>
                        <td>PO-{String(o.id || i + 1).padStart(4, "0")}</td>
                        <td>{o.product_name}</td>
                        <td>{o.total_quantity ?? o.quantity}</td>
                        <td>₹{parseFloat(o.total_price || o.amount || 0).toLocaleString()}</td>
                        <td>{o.delivery_date || o.purchase_date || "—"}</td>
                        <td>
                          <span className="vp-badge-status badge-accepted">Accepted</span>
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

export default MyOrders;
