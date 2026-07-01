import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import VendorSidebar from "../../components/vendor/VendorSidebar";
import VendorNavbar  from "../../components/vendor/VendorNavbar";
import "../../styles/VendorPortal.css";
import API_BASE from "../../api";

function SubmitQuotation() {
  const vendor_id  = localStorage.getItem("vendor_id");
  const { state }  = useLocation();
  const navigate   = useNavigate();

  const req_id       = state?.req_id       || "";
  const product_name = state?.product_name || "";
  const quantity     = state?.quantity     || 0;
  const company_name = state?.company_name || localStorage.getItem("company_name") || "";
  const vendor_name  = state?.vendor_name || localStorage.getItem("vendor_name") || "";

  const [unitPrice,       setUnitPrice]       = useState("");
  const [deliveryDate,    setDeliveryDate]    = useState("");
  const [notes,           setNotes]           = useState("");
  const [loading,         setLoading]         = useState(false);
  const [error,           setError]           = useState("");
  const [success,         setSuccess]         = useState("");

  const quantityValue = Number(quantity) || 0;
  const totalAmount = unitPrice ? (parseFloat(unitPrice) * quantityValue).toFixed(2) : "0.00";

  const handleSubmit = e => {
    e.preventDefault();
    setError(""); setSuccess("");

    if (!vendor_id) {
      setError("Please log in as a vendor before submitting a quotation.");
      return;
    }

    if (!unitPrice || !deliveryDate) {
      setError("Unit Price and Delivery Date are required.");
      return;
    }

    setLoading(true);
    fetch(`${API_BASE}/api/quotations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        req_id,
        vendor_id,
        product_name,
        company_name,
        vendor_name,
        unit_price: parseFloat(unitPrice),
        total_amount: parseFloat(totalAmount),
        delivery_timeline: deliveryDate,
        notes,
      }),
    })
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(data.error || "Failed to submit quotation");
        return data;
      })
      .then(() => {
        setSuccess("Quotation submitted successfully. It is now pending admin review.");
        setLoading(false);
        setTimeout(() => navigate("/vendor/my-quotations"), 1500);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
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
                    <label>Company Name</label>
                    <input value={company_name} readOnly />
                  </div>
                  <div className="vp-field">
                    <label>Vendor Name</label>
                    <input value={vendor_name} readOnly />
                  </div>
                  <div className="vp-field">
                    <label>Product Name</label>
                    <input value={product_name} readOnly />
                  </div>
                </div>
                <div className="vp-form-row">
                  <div className="vp-field">
                    <label>Req Number</label>
                    <input value={req_id ? `REQ-${String(req_id).padStart(4,"0")}` : ""} readOnly />
                  </div>
                  <div className="vp-field">
                    <label>Quantity</label>
                    <input value={quantity} readOnly />
                  </div>
                  <div className="vp-field">
                    <label>Unit Price (₹)</label>
                    <input
                      type="number" min="0" step="0.01"
                      placeholder="Enter unit price"
                      value={unitPrice}
                      onChange={e => setUnitPrice(e.target.value)}
                    />
                  </div>
                </div>
                <div className="vp-form-row">
                  <div className="vp-field">
                    <label>Total Price (₹)</label>
                    <input value={`₹ ${totalAmount}`} readOnly />
                  </div>
                  <div className="vp-field">
                    <label>Delivery Date</label>
                    <input
                      type="date"
                      value={deliveryDate}
                      onChange={e => setDeliveryDate(e.target.value)}
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
