import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import VendorSidebar from "../../components/vendor/VendorSidebar";
import VendorNavbar  from "../../components/vendor/VendorNavbar";
import "../../styles/VendorPortal.css";

const BASE = "http://localhost:5000";

function Requirements() {
  const vendor_id = localStorage.getItem("vendor_id");
  const navigate  = useNavigate();
  const [reqs,    setReqs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    fetch(`${BASE}/api/requirements/vendor/${vendor_id}`)
      .then(r => { if (!r.ok) throw new Error("Failed to load requirements"); return r.json(); })
      .then(d => { setReqs(d); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [vendor_id]);

  const handleSubmitQuote = (req) => {
    navigate("/vendor/submit-quotation", {
      state: { req_id: req.id, product_name: req.product_name, quantity: req.quantity },
    });
  };

  return (
    <div className="vp-shell">
      <VendorSidebar />
      <div className="vp-main">
        <VendorNavbar title="Requirements" />
        <div className="vp-content">
          <div className="vp-page">
            <h3 className="vp-section-title">Open Requirements</h3>
            {loading && <p className="vp-loading">Loading...</p>}
            {error   && <p className="vp-msg-error">{error}</p>}
            {!loading && !error && (
              <div className="vp-table-wrap">
                <table className="vp-table">
                  <thead>
                    <tr>
                      <th>Req No.</th>
                      <th>Product Name</th>
                      <th>Quantity</th>
                      <th>Delivery Date</th>
                      <th>Last Date to Submit</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reqs.length === 0 ? (
                      <tr><td colSpan={7} className="vp-empty">No requirements found.</td></tr>
                    ) : reqs.map(r => (
                      <tr key={r.id}>
                        <td>REQ-{String(r.id).padStart(4, "0")}</td>
                        <td>{r.product_name}</td>
                        <td>{r.quantity}</td>
                        <td>{r.delivery_date}</td>
                        <td>{r.last_date}</td>
                        <td>
                          <span className={`vp-badge-status badge-${(r.status || "pending").toLowerCase()}`}>
                            {r.status || "Open"}
                          </span>
                        </td>
                        <td>
                          <button
                            className="vp-btn vp-btn-primary vp-btn-sm"
                            onClick={() => handleSubmitQuote(r)}
                          >
                            Submit Quote
                          </button>
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

export default Requirements;
