import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import VendorSidebar from "../../components/vendor/VendorSidebar";
import VendorNavbar  from "../../components/vendor/VendorNavbar";
import "../../styles/VendorPortal.css";

const BASE = "http://localhost:5000";

function SubmitQuotation() {
  const vendor_id  = localStorage.getItem("vendor_id");
  const { state }  = useLocation();
  const navigate   = useNavigate();

  const req_id       = state?.req_id       || "";
  const product_name = state?.product_name || "";
  const quantity     = state?.quantity     || 0;

  const [unitPrice,         setUnitPrice]         = useState("");
  const [deliveryTimeline,  setDeliveryTimeline]  = useState("");
  const [notes,             setNotes]             = useState("");
  const [loading,           setLoading]           = useState(false);
  const [error,             setError]             = useState("");
  const [success,           setSuccess]           = useState("");

  const totalAmount = unitPrice ? (parseFloat(unitPrice) * parseInt(quantity, 10)).toFixed(2) : "0.00";

  const handleSubmit = e => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!unitPrice || !deliveryTimeline) { setError("Unit Price and Delivery Timeline are required."); return; }

    setLoading(true);
    fetch(`${BASE}/api/quotations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        req_id, vendor_id, product_name,
        unit_price:        parseFloat(unitPrice),
        total_amount:      parseFloat(totalAmount),
        delivery_timeline: deliveryTimeline,
        notes,
      }),
    })
      .then(r => { if (!r.ok) throw new Error("Failed to submit quotation"); return r.json(); })
      .then(() => {
        setSuccess("Quotation submitted successfully!");
        setLoading(false);
        setTimeout(() => navigate("/vendor/my-quotations"), 1500);
      })
      .catch(e => { setError(e.message); setLoading(false); });
  };

  return (
    <div className="vp-shell">
      <VendorSidebar />
      <div className="vp-main">
        <VendorNavbar title="Submit Quotation" />
        <div className="vp-content">
          <div className="vp-page">
            <h3 className="vp-section-title">Submit Quotation</h3>
            {error   && <p className="vp-msg-error">{error}</p>}
            {success && <p className="vp-msg-success">{success}</p>}

            <div className="vp-form-card">
              <form className="vp-form" onSubmit={handleSubmit}>
                <div className="vp-form-row">
                  <div className="vp-field">
                    <label>Product Name</label>
                    <input value={product_name} readOnly />
                  </div>
                  <div className="vp-field">
                    <label>Req Number</label>
                    <input value={req_id ? `REQ-${String(req_id).padStart(4,"0")}` : ""} readOnly />
                  </div>
                  <div className="vp-field">
                    <label>Quantity</label>
                    <input value={quantity} readOnly />
                  </div>
                </div>
                <div className="vp-form-row">
                  <div className="vp-field">
                    <label>Unit Price (₹)</label>
                    <input
                      type="number" min="0" step="0.01"
                      placeholder="Enter unit price"
                      value={unitPrice}
                      onChange={e => setUnitPrice(e.target.value)}
                    />
                  </div>
                  <div className="vp-field">
                    <label>Total Amount (₹)</label>
                    <input value={`₹ ${totalAmount}`} readOnly />
                  </div>
                  <div className="vp-field">
                    <label>Delivery Timeline</label>
                    <input
                      type="text"
                      placeholder="e.g. 7 days"
                      value={deliveryTimeline}
                      onChange={e => setDeliveryTimeline(e.target.value)}
                    />
                  </div>
                </div>
                <div className="vp-field">
                  <label>Notes (Optional)</label>
                  <textarea rows={3} placeholder="Any additional notes..." value={notes} onChange={e => setNotes(e.target.value)} />
                </div>
                <div style={{ display:"flex", gap:"12px" }}>
                  <button className="vp-btn vp-btn-primary" type="submit" disabled={loading}>
                    {loading ? "Submitting..." : "Submit Quotation"}
                  </button>
                  <button className="vp-btn vp-btn-outline" type="button" onClick={() => navigate(-1)}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SubmitQuotation;
