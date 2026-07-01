import { useEffect, useState } from "react";
import "../styles/AdminDashboard.css";

const DEFAULT = {
  name: "Admin User",
  email: "admin@gmail.com",
  address: "123, Business Park, Chennai, Tamil Nadu - 600001",
  contact: "9876543210",
};

function Profile() {
  const [profile, setProfile] = useState(DEFAULT);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(DEFAULT);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const admin = JSON.parse(localStorage.getItem("admin") || "null");
    if (!admin?.id) {
      setLoading(false);
      return;
    }
    fetch(`/api/admin/profile/${admin.id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load profile");
        return res.json();
      })
      .then((data) => {
        const merged = {
          ...DEFAULT,
          ...Object.fromEntries(Object.entries(data).filter(([, v]) => v != null && v !== "")),
        };
        setProfile(merged);
        setDraft(merged);
      })
      .catch(() => {
        // Fall back to defaults so the page still renders
        setProfile((p) => ({ ...DEFAULT, email: admin.email || DEFAULT.email, ...p }));
        setDraft((p) => ({ ...DEFAULT, email: admin.email || DEFAULT.email, ...p }));
      })
      .finally(() => setLoading(false));
  }, []);

  const handleEdit = () => {
    setDraft({ ...profile });
    setEditing(true);
    setSaved(false);
  };

  const handleCancel = () => setEditing(false);

  const handleSave = async () => {
    const admin = JSON.parse(localStorage.getItem("admin") || "null");
    if (!admin?.id) {
      setProfile({ ...draft });
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      return;
    }
    try {
      const res = await fetch(`/api/admin/profile/${admin.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      if (!res.ok) throw new Error("Failed to update profile");
      setProfile({ ...draft });
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError("Failed to update profile.");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setDraft((d) => ({ ...d, [name]: value }));
  };

  const FIELDS = [
    { key: "name", label: "Name", type: "text" },
    { key: "email", label: "Email", type: "email" },
    { key: "address", label: "Company Address", type: "text" },
    { key: "contact", label: "Contact Number", type: "tel" },
  ];

  if (loading) {
    return <div className="vm-empty">Loading profile...</div>;
  }

  return (
    <div className="pf-wrap">
      <div className="pf-header">
        <div>
          <h3 className="dh-section-title">Admin Profile</h3>
          <p className="pf-intro">Manage your admin contact details and account information.</p>
        </div>
        {!editing && <button className="pf-edit-btn" onClick={handleEdit}>Edit Profile</button>}
      </div>

      {saved && <p className="pf-saved-msg">Profile updated successfully.</p>}
      {error && <p className="api-error-inline">{error}</p>}

      <div className="pf-card">
        <div className="pf-sidebar">
          <div className="pf-avatar">{(profile.name || "A").charAt(0).toUpperCase()}</div>
          <div className="pf-info">
            <h4>{profile.name || "Admin User"}</h4>
            <p className="pf-subtitle">Administrator</p>
            <p className="pf-meta">{profile.email || "No email provided"}</p>
            <p className="pf-meta">{profile.contact || "No contact number"}</p>
          </div>
        </div>

        <div className="pf-details">
          {FIELDS.map(({ key, label, type }) => (
            <div className="pf-row" key={key}>
              <span className="pf-label">{label}</span>
              {editing ? (
                <input
                  className="pf-input"
                  type={type}
                  name={key}
                  value={draft[key] || ""}
                  onChange={handleChange}
                />
              ) : (
                <span className="pf-value">{profile[key] || "—"}</span>
              )}
            </div>
          ))}

          {editing && (
            <div className="pf-edit-actions">
              <button className="vm-btn-cancel" onClick={handleCancel}>Cancel</button>
              <button className="vm-btn-submit" onClick={handleSave}>Save Changes</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile;
