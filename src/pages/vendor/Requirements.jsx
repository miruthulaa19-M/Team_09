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
  const [updatingId, setUpdatingId] = useState(null);

  const loadRequirements = () => {
    fetch(`${BASE}/api/requirements/vendor/${vendor_id}`)
      .then(r => { if (!r.ok) throw new Error("Failed to load requirements"); return r.json(); })
      .then(d => { setReqs(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  };

  useEffect(() => {
    if (!vendor_id) {
      setError("Please log in as a vendor to view requirements.");
      setLoading(false);
      return;
    }
    loadRequirements();
  }, [vendor_id]);

  const handleDecision = (req, status) => {
    setUpdatingId(req.id);
    fetch(`${BASE}/api/requirements/${req.id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
      .then(r => { if (!r.ok) throw new Error("Failed to update requirement"); return r.json(); })
      .then(() => {
        loadRequirements();
        if (status === "Accepted") {
          navigate("/vendor/submit-quotation", {
            state: {
              req_id: req.id,
              product_name: req.product_name,
              quantity: req.quantity,
              company_name: localStorage.getItem("company_name") || "",
              vendor_name: localStorage.getItem("vendor_name") || "",
            },
          });
        }
      })
      .catch(e => { setError(e.message); setUpdatingId(null); });
  };

  const handleSubmitQuote = (req) => {
    navigate("/vendor/submit-quotation", {
      state: {
        req_id: req.id,
        product_name: req.product_name,
        quantity: req.quantity,
        company_name: localStorage.getItem("company_name") || "",
        vendor_name: localStorage.getItem("vendor_name") || "",
      },
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
                          {(!r.status || r.status === "Open") ? (
                            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                              <button
                                className="vp-btn vp-btn-primary vp-btn-sm"
                                disabled={updatingId === r.id}
                                onClick={() => handleDecision(r, "Accepted")}
                              >
                                {updatingId === r.id ? "Updating..." : "Accept"}
                              </button>
                              <button
                                className="vp-btn vp-btn-outline vp-btn-sm"
                                disabled={updatingId === r.id}
                                onClick={() => handleDecision(r, "Rejected")}
                              >
                                {updatingId === r.id ? "Updating..." : "Reject"}
                              </button>
                            </div>
                          ) : r.status === "Accepted" ? (
                            <button
                              className="vp-btn vp-btn-primary vp-btn-sm"
                              onClick={() => handleSubmitQuote(r)}
                            >
                              Submit Quote
                            </button>
                          ) : (
                            <span className="vp-badge-status badge-rejected">Rejected</span>
                          )}
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
