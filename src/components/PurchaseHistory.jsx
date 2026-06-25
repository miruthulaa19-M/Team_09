import { useVendors } from "../context/VendorContext";
import "../styles/AdminDashboard.css";

function PurchaseHistory() {
  const { vendors } = useVendors();
  const accepted    = vendors.filter((v) => v.status.startsWith("Accepted"));
  const grandQty    = accepted.reduce((s, r) => s + r.qty,   0);
  const grandTotal  = accepted.reduce((s, r) => s + r.total, 0);

  return (
    <div className="ph-wrap">
      <h3 className="dh-section-title">Purchase History</h3>
      <div className="vm-table-wrap">
        <table className="vm-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Company Name</th>
              <th>Product Name</th>
              <th>Total Quantity</th>
              <th>Total Price (₹)</th>
            </tr>
          </thead>
          <tbody>
            {accepted.length === 0 ? (
              <tr>
                <td colSpan={5} className="vm-empty">
                  No accepted purchases yet.
                </td>
              </tr>
            ) : (
              <>
                {accepted.map((r, i) => (
                  <tr key={r.id}>
                    <td>{i + 1}</td>
                    <td>{r.company}</td>
                    <td>{r.product}</td>
                    <td>{r.qty}</td>
                    <td>₹{r.total.toLocaleString()}</td>
                  </tr>
                ))}
                <tr className="ph-total-row">
                  <td colSpan={3}>Grand Total</td>
                  <td>{grandQty}</td>
                  <td>₹{grandTotal.toLocaleString()}</td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default PurchaseHistory;
