import { useState, useEffect } from "react";
import VendorSidebar from "../../components/vendor/VendorSidebar";
import VendorNavbar  from "../../components/vendor/VendorNavbar";
import "../../styles/VendorPortal.css";

const BASE = "http://localhost:5000";

const READONLY_FIELDS = ["vendor_name", "email", "category"];

const FIELD_LABELS = {
  vendor_name:     "Vendor Name",
  company_name:    "Company Name",
  email:           "Email",
  contact:         "Phone",
  company_address: "Address",
  category:        "Category",
};

function VendorProfile() {
  const vendor_id = localStorage.getItem("vendor_id");
  const [profile,  setProfile]  = useState({});
  const [draft,    setDraft]    = useState({});
  const [editing,  setEditing]  = useState(false);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [success,  setSuccess]  = useState("");

  useEffect(() => {
    fetch(`${BASE}/api/vendors/${vendor_id}`)
      .then(r => {
        if (!r.ok) throw new Error("Failed to load profile");
        return r.json();
      })
      .then(d => { setProfile(d); setDraft(d); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [vendor_id]);

  const handleSave = () => {
    setError(""); setSuccess("");
    fetch(`${BASE}/api/vendors/${vendor_id}`, {
      method:  "PUT",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        company_name:    draft.company_name,
        contact:         draft.contact,
        company_address: draft.company_address,
      }),
    })
      .then(r => { if (!r.ok) throw new Error("Failed to update profile"); return r.json(); })
      .then(() => {
        setProfile({ ...profile, company_name: draft.company_name, contact: draft.contact, company_address: draft.company_address });
        setEditing(false);
        setSuccess("Profile updated successfully.");
        setTimeout(() => setSuccess(""), 3000);
      })
      .catch(e => setError(e.message));
  };

  const displayFields = ["vendor_name", "company_name", "email", "contact", "company_address", "category"];

  return (
    <div className="vp-shell">
      <VendorSidebar />
      <div className="vp-main">
        <VendorNavbar title="My Profile" />
        <div className="vp-content">
          <div className="vp-page">
            <div className="vp-toolbar">
              <h3 className="vp-section-title">Profile</h3>
              {!editing && (
                <button className="vp-btn vp-btn-outline" onClick={() => { setEditing(true); setSuccess(""); }}>
                  Edit Profile
                </button>
              )}
            </div>

            {loading && <p className="vp-loading">Loading...</p>}
            {error   && <p className="vp-msg-error">{error}</p>}
            {success && <p className="vp-msg-success">{success}</p>}

            {!loading && (
              <div className="vp-profile-card">
                <div className="vp-avatar">
                  {(profile.vendor_name || "V").charAt(0).toUpperCase()}
                </div>
                <div className="vp-profile-fields">
                  {displayFields.map((key) => (
                    <div className="vp-pf-row" key={key}>
                      <span className="vp-pf-label">{FIELD_LABELS[key] || key}</span>
                      {editing && !READONLY_FIELDS.includes(key) ? (
                        <input
                          style={{ padding:"10px 13px", border:"1px solid #E5E7EB", borderRadius:"10px", fontFamily:"inherit", fontSize:"14px", background:"#fafaf8", outline:"none", width:"100%" }}
                          value={draft[key] || ""}
                          onChange={e => setDraft(d => ({ ...d, [key]: e.target.value }))}
                        />
                      ) : (
                        <span className="vp-pf-value">{profile[key] || "—"}</span>
                      )}
                    </div>
                  ))}

                  {editing && (
                    <div style={{ display:"flex", gap:"12px", paddingTop:"8px" }}>
                      <button className="vp-btn vp-btn-primary" onClick={handleSave}>Save Changes</button>
                      <button className="vp-btn vp-btn-outline" onClick={() => { setEditing(false); setDraft({ ...profile }); }}>Cancel</button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default VendorProfile;
