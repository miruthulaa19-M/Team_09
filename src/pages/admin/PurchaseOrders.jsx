import { useState, useEffect } from "react";
import "../../styles/AdminDashboard.css";

const CATEGORIES = [
  "Electronics",
  "Furniture",
  "Stationery",
  "Computer & IT Equipment",
  "Electrical Supplies",
];
const UNITS       = ["Pieces", "Boxes", "Kg", "Litres", "Sets", "Units"];

const EMPTY_FORM = {
  category: "", productName: "", quantity: "",
  unit: "", deliveryDate: "", notes: "",
};

const API_PO  = "http://localhost:5000/api/purchase-orders";
const API_VEN = "http://localhost:5000/api/vendors";

function PurchaseOrders() {
  const [orders,     setOrders]     = useState([]);
  const [vendors,    setVendors]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showForm,   setShowForm]   = useState(false);
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [error,      setError]      = useState("");
  const [success,    setSuccess]    = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchOrders = async () => {
    try {
      const res = await fetch(API_PO);
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      setError("Failed to load purchase orders: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchVendors = async () => {
    try {
      const res  = await fetch(API_VEN);
      const data = await res.json();
      setVendors(Array.isArray(data) ? data : []);
    } catch { /* non-critical */ }
  };

  useEffect(() => { fetchOrders(); fetchVendors(); }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const orderSummary = orders.reduce(
    (acc, order) => {
      const status = (order.status || "Pending").toLowerCase();
      acc.total += 1;
      if (status === "accepted") acc.accepted += 1;
      else if (status === "rejected") acc.rejected += 1;
      else acc.pending += 1;
      return acc;
    },
    { total: 0, accepted: 0, rejected: 0, pending: 0 }
  );


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");

    const { category, productName, quantity, unit, deliveryDate } = form;
    if (!category || !productName || !quantity || !unit || !deliveryDate)
      return setError("Category, Product Name, Quantity, Unit and Delivery Date are required.");

    setSubmitting(true);
    try {
      const res  = await fetch(API_PO, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(form),
      });
      const text = await res.text();
      if (!res.ok) {
        let msg = "Failed to create purchase order.";
        try { msg = JSON.parse(text).error || msg; } catch { console.error(text); }
        throw new Error(msg);
      }
      const data = JSON.parse(text);
      setSuccess(`Purchase Order ${data.requestNo} created successfully. Visible to ${data.matchedVendors} matching vendor(s).`);
      setForm(EMPTY_FORM);
      setShowForm(false);
      await fetchOrders();
    } catch (err) {
      setError(err.message || "Failed to create purchase order.");
    } finally {
      setSubmitting(false);
    }
  };

  // Vendors matching the currently selected category (for preview)
  const matchedVendors = form.category
    ? vendors.filter((v) => v.category === form.category && v.status === "approved")
    : [];

  if (loading) return <div className="vm-empty">Loading purchase orders...</div>;

  return (
    <div className="vm-wrap">
      <div className="vm-toolbar">
        <h3 className="dh-section-title">Purchase Orders</h3>
        <button
          className="vm-btn-accept"
          onClick={() => { setShowForm((s) => !s); setError(""); setSuccess(""); }}
        >
          {showForm ? "✕ Close" : "+ Create PO"}
        </button>
      </div>

      {error   && <p className="api-error-inline">{error}</p>}
      {success && <p className="pf-saved-msg">{success}</p>}

      <div className="po-summary-grid">
        <div className="po-summary-card">
          <span className="po-summary-title">Total Purchase Orders</span>
          <span className="po-summary-value">{orderSummary.total}</span>
        </div>
        <div className="po-summary-card">
          <span className="po-summary-title">Pending</span>
          <span className="po-summary-value">{orderSummary.pending}</span>
        </div>
        <div className="po-summary-card">
          <span className="po-summary-title">Accepted</span>
          <span className="po-summary-value">{orderSummary.accepted}</span>
        </div>
        <div className="po-summary-card">
          <span className="po-summary-title">Rejected</span>
          <span className="po-summary-value">{orderSummary.rejected}</span>
        </div>
      </div>

      {showForm && (
        <div className="po-form-card">
          <h4 className="po-form-title">New Purchase Order</h4>
          <form className="po-form" onSubmit={handleSubmit}>

            <div className="po-form-row">
              <div className="po-field">
                <label>Category</label>
                <select name="category" value={form.category} onChange={handleChange}>
                  <option value="">— Select category —</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                {form.category && (
                  <span className="po-vendor-hint">
                    {matchedVendors.length} approved vendor(s) will receive this order
                  </span>
                )}
              </div>
              <div className="po-field">
                <label>Product Name</label>
                <input
                  name="productName" value={form.productName}
                  onChange={handleChange} placeholder="Product name"
                />
              </div>
            </div>

            <div className="po-form-row">
              <div className="po-field">
                <label>Quantity</label>
                <input
                  name="quantity" type="number" min="1"
                  value={form.quantity} onChange={handleChange} placeholder="Qty"
                />
              </div>
              <div className="po-field">
                <label>Unit</label>
                <select name="unit" value={form.unit} onChange={handleChange}>
                  <option value="">— Select unit —</option>
                  {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>

            <div className="po-form-row">
              <div className="po-field">
                <label>Delivery Date</label>
                <input
                  name="deliveryDate" type="date"
                  value={form.deliveryDate} onChange={handleChange}
                />
              </div>
              <div className="po-field po-field-full">
                <label>Notes <span className="po-optional">(optional)</span></label>
                <textarea
                  name="notes" value={form.notes}
                  onChange={handleChange} placeholder="Additional notes..."
                  rows={4}
                />
              </div>
            </div>

            <div className="vm-actions" style={{ marginTop: "16px" }}>
              <button type="button" className="vm-btn-cancel"
                onClick={() => { setShowForm(false); setError(""); }}>
                Cancel
              </button>
              <button type="submit" className="vm-btn-submit" disabled={submitting}>
                {submitting ? "Submitting..." : "Submit PO"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="vm-table-wrap">
        <table className="vm-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Request No</th>
              <th>Category</th>
              <th>Product Name</th>
              <th>Quantity</th>
              <th>Unit</th>
              <th>Delivery Date</th>
              <th>Status</th>
              <th>Date Submitted</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr><td colSpan={9} className="vm-empty">No purchase orders yet.</td></tr>
            ) : orders.map((o, i) => (
              <tr key={o.id}>
                <td>{i + 1}</td>
                <td className="po-number">{o.requestNo || `PO-${String(o.id).padStart(4, "0")}`}</td>
                <td>{o.category}</td>
                <td>{o.productName}</td>
                <td>{o.quantity}</td>
                <td>{o.unit}</td>
                <td>{o.deliveryDate ? new Date(o.deliveryDate).toLocaleDateString("en-IN") : "—"}</td>
                <td>
                  <span className={`vm-badge ${
                    o.status === "Accepted" ? "badge-accepted" :
                    o.status === "Rejected" ? "badge-rejected" : "badge-pending"
                  }`}>{o.status || "Pending"}</span>
                </td>
                <td>{o.dateSubmitted ? new Date(o.dateSubmitted).toLocaleDateString("en-IN") : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default PurchaseOrders;
