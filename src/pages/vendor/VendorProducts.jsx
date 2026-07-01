import { useState, useEffect } from "react";
import VendorSidebar from "../../components/vendor/VendorSidebar";
import VendorNavbar  from "../../components/vendor/VendorNavbar";
import "../../styles/VendorPortal.css";
import API_BASE from "../../api";
const CATEGORIES = ["💻 Electronics", "🪑 Furniture", "🖨️ Office Supplies"];
const EMPTY = { category: "", product_name: "", description: "" };

function VendorProducts() {
  const vendor_id = localStorage.getItem("vendor_id");
  const [products, setProducts] = useState([]);
  const [form,     setForm]     = useState({ ...EMPTY });
  const [editId,   setEditId]   = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [success,  setSuccess]  = useState("");

  const load = () => {
    setLoading(true);
    fetch(`${API_BASE}/api/vendor-products/${vendor_id}`)
      .then(r => { if (!r.ok) throw new Error("Failed to load products"); return r.json(); })
      .then(d => { setProducts(d); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  };

  useEffect(load, [vendor_id]);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = e => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!form.category || !form.product_name) { setError("Category and Product Name are required."); return; }

    const url    = editId ? `${API_BASE}/api/vendor-products/${editId}` : `${API_BASE}/api/vendor-products`;
    const method = editId ? "PUT" : "POST";
    const body   = editId ? form : { ...form, vendor_id };

    fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      .then(r => { if (!r.ok) throw new Error("Failed to save product"); return r.json(); })
      .then(() => {
        setSuccess(editId ? "Product updated." : "Product added.");
        setForm({ ...EMPTY });
        setEditId(null);
        load();
        setTimeout(() => setSuccess(""), 3000);
      })
      .catch(e => setError(e.message));
  };

  const handleEdit = p => { setForm({ category: p.category, product_name: p.product_name, description: p.description || "" }); setEditId(p.id); };

  const handleDelete = id => {
    if (!window.confirm("Delete this product?")) return;
    fetch(`${API_BASE}/api/vendor-products/${id}`, { method: "DELETE" })
      .then(r => { if (!r.ok) throw new Error("Delete failed"); return r.json(); })
      .then(() => { setSuccess("Product deleted."); load(); setTimeout(() => setSuccess(""), 3000); })
      .catch(e => setError(e.message));
  };

  return (
    <div className="vp-shell">
      <VendorSidebar />
      <div className="vp-main">
        <VendorNavbar title="My Products" />
        <div className="vp-content">
          <div className="vp-page">
            {error   && <p className="vp-msg-error">{error}</p>}
            {success && <p className="vp-msg-success">{success}</p>}

            <div className="vp-form-card">
              <h3 className="vp-section-title" style={{ marginBottom:"18px" }}>
                {editId ? "Edit Product" : "Add Product"}
              </h3>
              <form className="vp-form" onSubmit={handleSubmit}>
                <div className="vp-form-row">
                  <div className="vp-field">
                    <label>Category</label>
                    <select name="category" value={form.category} onChange={handleChange}>
                      <option value="">Select category</option>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="vp-field">
                    <label>Product Name</label>
                    <input name="product_name" placeholder="Enter product name" value={form.product_name} onChange={handleChange} />
                  </div>
                </div>
                <div className="vp-field">
                  <label>Description</label>
                  <textarea name="description" rows={3} placeholder="Optional description" value={form.description} onChange={handleChange} />
                </div>
                <div style={{ display:"flex", gap:"12px" }}>
                  <button className="vp-btn vp-btn-primary" type="submit">{editId ? "Update" : "Add Product"}</button>
                  {editId && (
                    <button className="vp-btn vp-btn-outline" type="button" onClick={() => { setForm({ ...EMPTY }); setEditId(null); }}>
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div className="vp-table-wrap">
              <table className="vp-table">
                <thead>
                  <tr>
                    <th>#</th><th>Category</th><th>Product Name</th><th>Description</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={5} className="vp-empty">Loading...</td></tr>
                  ) : products.length === 0 ? (
                    <tr><td colSpan={5} className="vp-empty">No products added yet.</td></tr>
                  ) : products.map((p, i) => (
                    <tr key={p.id}>
                      <td>{i + 1}</td>
                      <td>{p.category}</td>
                      <td>{p.product_name}</td>
                      <td>{p.description || "—"}</td>
                      <td>
                        <div style={{ display:"flex", gap:"8px" }}>
                          <button className="vp-btn vp-btn-outline vp-btn-sm" onClick={() => handleEdit(p)}>Edit</button>
                          <button className="vp-btn vp-btn-danger  vp-btn-sm" onClick={() => handleDelete(p.id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VendorProducts;
