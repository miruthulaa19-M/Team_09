import { useState } from "react";
import "../styles/AdminDashboard.css";

const DEFAULT = {
  name:    "Admin User",
  email:   "admin@gmail.com",
  address: "123, Business Park, Chennai, Tamil Nadu - 600001",
  contact: "9876543210",
};

function Profile() {
  const [profile,  setProfile]  = useState(DEFAULT);
  const [editing,  setEditing]  = useState(false);
  const [draft,    setDraft]    = useState(DEFAULT);
  const [saved,    setSaved]    = useState(false);

  const handleEdit = () => {
    setDraft({ ...profile });
    setEditing(true);
    setSaved(false);
  };

  const handleCancel = () => setEditing(false);

  const handleSave = () => {
    setProfile({ ...draft });
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setDraft((d) => ({ ...d, [name]: value }));
  };

  const FIELDS = [
    { key: "name",    label: "Name",            type: "text"  },
    { key: "email",   label: "Email",            type: "email" },
    { key: "address", label: "Company Address",  type: "text"  },
    { key: "contact", label: "Contact Number",   type: "tel"   },
  ];

  return (
    <div className="pf-wrap">
      <div className="pf-header">
        <h3 className="dh-section-title">Profile</h3>
        {!editing && (
          <button className="pf-edit-btn" onClick={handleEdit}>Edit Profile</button>
        )}
      </div>

      {saved && <p className="pf-saved-msg">Profile updated successfully.</p>}

      <div className="pf-card">
        <div className="pf-avatar">{profile.name.charAt(0).toUpperCase()}</div>

        <div className="pf-details">
          {FIELDS.map(({ key, label, type }) => (
            <div className="pf-row" key={key}>
              <span className="pf-label">{label}</span>
              {editing ? (
                <input
                  className="pf-input"
                  type={type}
                  name={key}
                  value={draft[key]}
                  onChange={handleChange}
                />
              ) : (
                <span className="pf-value">{profile[key]}</span>
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
