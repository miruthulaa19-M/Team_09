import { useState, useEffect } from "react";
import "../../styles/AdminDashboard.css";

const CATEGORIES = ["💻 Electronics", "🪑 Furniture", "🖨️ Office Supplies"];
const EMPTY_FORM  = { companyName: "", productName: "", category: "", quantity: "", amount: "", dateOfOrder: "" };
const API_BASE    = "http://localhost:5000/api/purchase-orders";

function PurchaseOrders() {
  const [orders,   setOrders]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form,     setForm]     = useState(EMPTY_FORM);
  const [error,    setError]    = useState("");
  const [success,  setSuccess]  = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchOrders = async () => {
    try {
      const res = await fetch(API_BASE);
      if (!res.ok) {
        const text = await res.text();
        console.error("GET /api/purchase-orders error:", text);
        throw new Error(`Server error ${res.status}`);
      }
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      setError("Failed to load purchase orders: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");

    const { companyName, productName, category, quantity, amount, dateOfOrder } = form;
    if (!companyName || !productName || !category || !quantity || !amount || !dateOfOrder)
      return setError("All fields are required.");

    setSubmitting(true);
    try {
      const res = await fetch(API_BASE, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(form),
      });

      // Always read body as text first — safe regardless of content-type
      const text = await res.text();

      if (!res.ok) {
        console.error("POST /api/purchase-orders server response:", text);
        let msg = "Failed to create purchase order.";
        try { msg = JSON.parse(text).error || msg; } catch { /* server sent HTML */ }
        throw new Error(msg);
      }

      // At this point response is guaranteed JSON
      const data = JSON.parse(text);
      console.log("✅ Purchase order created:", data);

      setSuccess("Purchase order created successfully.");
      setForm(EMPTY_FORM);
      setShowForm(false);
      // Refresh table immediately
      await fetchOrders();
    } catch (err) {
      setError(err.message || "Failed to create purchase order.");
    } finally {
      setSubmitting(false);
    }
  };

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

      {showForm && (
        <div className="po-form-card">
          <h4 className="po-form-title">New Purchase Order</h4>
          <form className="po-form" onSubmit={handleSubmit}>

            <div className="po-form-row">
              <div className="po-field">
                <label>Company Name</label>
                <input
                  name="companyName"
                  value={form.companyName}
                  onChange={handleChange}
                  placeholder="Company name"
                />
              </div>
              <div className="po-field">
                <label>Product Name</label>
                <input
                  name="productName"
                  value={form.productName}
                  onChange={handleChange}
                  placeholder="Product name"
                />
              </div>
            </div>

            <div className="po-form-row">
              <div className="po-field">
                <label>Category</label>
                <select name="category" value={form.category} onChange={handleChange}>
                  <option value="">— Select category —</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="po-field">
                <label>Quantity</label>
                <input
                  name="quantity"
                  type="number"
                  min="1"
                  value={form.quantity}
                  onChange={handleChange}
                  placeholder="Qty"
                />
              </div>
            </div>

            <div className="po-form-row">
              <div className="po-field">
                <label>Amount (₹)</label>
                <input
                  name="amount"
                  type="number"
                  min="0"
                  value={form.amount}
                  onChange={handleChange}
                  placeholder="Total amount"
                />
              </div>
              <div className="po-field">
                <label>Date of Order</label>
                <input
                  name="dateOfOrder"
                  type="date"
                  value={form.dateOfOrder}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="vm-actions" style={{ marginTop: "12px" }}>
              <button type="button" className="vm-btn-cancel" onClick={() => { setShowForm(false); setError(""); }}>
                Cancel
              </button>
              <button type="submit" className="vm-btn-submit" disabled={submitting}>
                {submitting ? "Creating..." : "Create PO"}
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
              <th>PO Number</th>
              <th>Company Name</th>
              <th>Product Name</th>
              <th>Category</th>
              <th>Quantity</th>
              <th>Amount (₹)</th>
              <th>Date of Order</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr><td colSpan={8} className="vm-empty">No purchase orders yet.</td></tr>
            ) : orders.map((o, i) => (
              <tr key={o.id}>
                <td>{i + 1}</td>
                <td className="po-number">PO-{String(o.id).padStart(4, "0")}</td>
                <td>{o.companyName}</td>
                <td>{o.productName}</td>
                <td>{o.category}</td>
                <td>{o.quantity}</td>
                <td>₹{Number(o.amount).toLocaleString()}</td>
                <td>{o.dateOfOrder ? new Date(o.dateOfOrder).toLocaleDateString("en-IN") : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default PurchaseOrders;
