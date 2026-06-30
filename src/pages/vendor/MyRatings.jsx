import { useState, useEffect } from "react";
import VendorSidebar from "../../components/vendor/VendorSidebar";
import VendorNavbar  from "../../components/vendor/VendorNavbar";
import "../../styles/VendorPortal.css";

const BASE = "http://localhost:5000";

function Stars({ count }) {
  return (
    <div className="vp-stars">
      {[1,2,3,4,5].map(s => (
        <span key={s} className={`vp-star${s <= count ? " on" : ""}`}>★</span>
      ))}
    </div>
  );
}

function MyRatings() {
  const vendor_id = localStorage.getItem("vendor_id");
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    fetch(`${BASE}/api/ratings/vendor/${vendor_id}`)
      .then(r => { if (!r.ok) throw new Error("Failed to load ratings"); return r.json(); })
      .then(d => { setData(d); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [vendor_id]);

  return (
    <div className="vp-shell">
      <VendorSidebar />
      <div className="vp-main">
        <VendorNavbar title="My Ratings" />
        <div className="vp-content">
          <div className="vp-page">
            <h3 className="vp-section-title">My Ratings</h3>
            {loading && <p className="vp-loading">Loading...</p>}
            {error   && <p className="vp-msg-error">{error}</p>}

            {!loading && !error && data && (
              <>
                <div className="vp-form-card" style={{ display:"flex", alignItems:"center", gap:"32px", flexWrap:"wrap" }}>
                  <div>
                    <p style={{ fontSize:"13px", fontWeight:700, color:"#9CA3AF", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:"8px" }}>
                      Overall Rating
                    </p>
                    <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
                      <Stars count={Math.round(parseFloat(data.overall_rating || 0))} />
                      <span style={{ fontSize:"28px", fontWeight:800, color:"#1E3A8A" }}>
                        {data.overall_rating ? parseFloat(data.overall_rating).toFixed(1) : "N/A"}
                      </span>
                    </div>
                  </div>
                  <div style={{ color:"#6B7280", fontSize:"14px" }}>
                    Based on {data.ratings?.length || 0} rating{data.ratings?.length !== 1 ? "s" : ""}
                  </div>
                </div>

                <div className="vp-table-wrap">
                  <table className="vp-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Product Name</th>
                        <th>Rating</th>
                        <th>Admin Comments</th>
                        <th>Rated On</th>
                      </tr>
                    </thead>
                    <tbody>
                      {!data.ratings || data.ratings.length === 0 ? (
                        <tr><td colSpan={5} className="vp-empty">No ratings received yet.</td></tr>
                      ) : data.ratings.map((r, i) => (
                        <tr key={r.id || i}>
                          <td>{i + 1}</td>
                          <td>{r.product_name}</td>
                          <td><Stars count={r.stars} /></td>
                          <td>{r.comments || "—"}</td>
                          <td>{r.rated_at ? new Date(r.rated_at).toLocaleDateString() : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MyRatings;
