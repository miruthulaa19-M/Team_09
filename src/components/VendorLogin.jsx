import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/VendorLogin.css";

const emailRegex    = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
const passwordRegex = /^(?=.*[a-zA-Z])(?=.*[0-9]).{6,}$/;
const phoneRegex    = /^\d{10}$/;

const emptyReg   = { companyName: "", vendorName: "", contact: "", email: "", password: "", confirmPassword: "", category: "", products: [] };
const emptyLogin = { email: "", password: "" };

function required(val) {
  return !val.trim() ? "This field is required" : "";
}

function validateReg(v) {
  return {
    companyName:     required(v.companyName),
    vendorName:      required(v.vendorName),
    contact:         !v.contact.trim() ? "This field is required"
                     : !phoneRegex.test(v.contact) ? "Contact number must be exactly 10 digits" : "",
    email:           !v.email.trim() ? "This field is required"
                     : !emailRegex.test(v.email) ? "Email must end with @gmail.com" : "",
    password:        !v.password.trim() ? "This field is required"
                     : !passwordRegex.test(v.password) ? "Password must be at least 6 characters with letters and numbers" : "",
    confirmPassword: !v.confirmPassword.trim() ? "This field is required"
                     : v.confirmPassword !== v.password ? "Passwords do not match" : "",
    category:        !v.category ? "Please select a category" : "",
  };
}

function validateLogin(v) {
  return {
    email:    !v.email.trim() ? "This field is required"
              : !emailRegex.test(v.email) ? "Email must end with @gmail.com" : "",
    password: !v.password.trim() ? "This field is required"
              : !passwordRegex.test(v.password) ? "Password must be at least 6 characters with letters and numbers" : "",
  };
}

function VendorLogin() {
  const navigate = useNavigate();
  const [tab, setTab]               = useState("register");
  const [regValues, setRegValues]   = useState(emptyReg);
  const [loginValues, setLoginValues] = useState(emptyLogin);
  const [regErrors, setRegErrors]   = useState({});
  const [loginErrors, setLoginErrors] = useState({});
  const [success, setSuccess]       = useState("");
  const [apiError, setApiError]     = useState("");
  const [loading, setLoading]       = useState(false);

  const switchTab = (t) => {
    setTab(t);
    setSuccess("");
    setApiError("");
    setRegErrors({});
    setLoginErrors({});
  };

  const handleRegChange   = (e) => { const { name, value } = e.target; setRegValues((v) => ({ ...v, [name]: value })); };
  const handleLoginChange = (e) => { const { name, value } = e.target; setLoginValues((v) => ({ ...v, [name]: value })); };

  const handleRegister = async (e) => {
    e.preventDefault();
    setSuccess("");
    setApiError("");
    const errs = validateReg(regValues);
    setRegErrors(errs);
    if (Object.values(errs).some(Boolean)) return;

    setLoading(true);
    try {
      const res  = await fetch("/api/register", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          companyName: regValues.companyName,
          vendorName:  regValues.vendorName,
          contact:     regValues.contact,
          email:       regValues.email,
          password:    regValues.password,
          category:    regValues.category,
          products:    regValues.products || [],
        }),
      });
      const data = await res.json();
      if (!res.ok) { setApiError(data.error); return; }
      setSuccess(data.message);
      setRegValues(emptyReg);
    } catch {
      setApiError("Server unreachable. Please make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setSuccess("");
    setApiError("");
    const errs = validateLogin(loginValues);
    setLoginErrors(errs);
    if (Object.values(errs).some(Boolean)) return;

    setLoading(true);
    try {
      const res  = await fetch("/api/login", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(loginValues),
      });
      const data = await res.json();
      if (!res.ok) { setApiError(data.error); return; }
      // Save vendor details to localStorage
      localStorage.setItem("vendor_id",    data.vendor.id);
      localStorage.setItem("vendor_name",  data.vendor.vendorName);
      localStorage.setItem("company_name", data.vendor.companyName);
      localStorage.setItem("vendor_email", data.vendor.email);
      // store category and products for quick access
      if (data.vendor.category) localStorage.setItem("vendor_category", data.vendor.category);
      if (data.vendor.products) localStorage.setItem("vendor_products", JSON.stringify(data.vendor.products));
      setSuccess(data.message);
      setTimeout(() => navigate("/vendor/dashboard"), 800);
    } catch {
      setApiError("Server unreachable. Please make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const CATEGORIES = [
    "Electronics",
    "Furniture",
    "Stationery",
    "Computer & IT Equipment",
    "Electrical Supplies",
  ];

  const PRODUCTS_BY_CATEGORY = {
    "Electronics": ["Laptop","Desktop","Printer","Monitor","Keyboard","Mouse"],
    "Furniture": ["Office Chair","Office Table","Cupboard","Shelf","Cabinet"],
    "Stationery": ["Pen","Pencil","Notebook","File","Marker"],
    "Computer & IT Equipment": ["Server","Hard Disk","SSD","RAM","Webcam"],
    "Electrical Supplies": ["LED Bulb","Wire","Cable","Switch","Fan"],
  };

  const regFields = [
    { name: "companyName",     label: "Company Name",     type: "text",     placeholder: "Enter Company Name" },
    { name: "vendorName",      label: "Vendor Name",      type: "text",     placeholder: "Enter Vendor Name" },
    { name: "contact",         label: "Contact Number",   type: "tel",      placeholder: "10-digit number" },
    { name: "email",           label: "Email",            type: "email",    placeholder: "example@gmail.com" },
    { name: "password",        label: "Password",         type: "password", placeholder: "Enter Password" },
    { name: "confirmPassword", label: "Confirm Password", type: "password", placeholder: "Re-enter Password" },
  ];

  return (
    <div className="vendor-container">
      <div className="vendor-box">
        <button className="back-arrow" onClick={() => navigate("/")} aria-label="Back">
          &#8592; Back
        </button>

        <h1 className="brand-title">Vendor Portal</h1>

        <div className="tab-bar">
          <button className={`tab-btn${tab === "register" ? " tab-active" : ""}`} onClick={() => switchTab("register")} type="button">
            New Vendor
          </button>
          <button className={`tab-btn${tab === "login" ? " tab-active" : ""}`} onClick={() => switchTab("login")} type="button">
            Already Registered
          </button>
        </div>

        {success  && <p className="success-message">{success}</p>}
        {apiError && <p className="api-error-message">{apiError}</p>}

        {tab === "register" ? (
          <form onSubmit={handleRegister} noValidate>
            {regFields.map(({ name, label, type, placeholder }) => (
              <div className="input-group" key={name}>
                <label htmlFor={`reg-${name}`}>{label}</label>
                <input
                  id={`reg-${name}`}
                  name={name}
                  type={type}
                  placeholder={placeholder}
                  value={regValues[name]}
                  onChange={handleRegChange}
                />
                {regErrors[name] && <span className="error-message">{regErrors[name]}</span>}
              </div>
            ))}
            <div className="input-group">
              <label htmlFor="reg-category">Category</label>
              <select
                id="reg-category"
                name="category"
                value={regValues.category}
                onChange={(e) => { handleRegChange(e); setRegValues(r => ({ ...r, products: [] })); }}
                className="vl-select"
              >
                <option value="">— Select category —</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              {regErrors.category && <span className="error-message">{regErrors.category}</span>}
            </div>
            {regValues.category && (
              <div className="input-group">
                <label>Products Supplied</label>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {(PRODUCTS_BY_CATEGORY[regValues.category] || []).map((p) => (
                    <label key={p} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input
                        type="checkbox"
                        checked={(regValues.products || []).includes(p)}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setRegValues(r => {
                            const existing = new Set(r.products || []);
                            if (checked) existing.add(p); else existing.delete(p);
                            return { ...r, products: Array.from(existing) };
                          });
                        }}
                      />
                      <span>{p}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            <button className="submit-btn" type="submit" disabled={loading}>
              {loading ? "Registering..." : "Register"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleLogin} noValidate>
            <div className="input-group">
              <label htmlFor="login-email">Email</label>
              <input id="login-email" name="email" type="email" placeholder="example@gmail.com" value={loginValues.email} onChange={handleLoginChange} />
              {loginErrors.email && <span className="error-message">{loginErrors.email}</span>}
            </div>
            <div className="input-group">
              <label htmlFor="login-password">Password</label>
              <input id="login-password" name="password" type="password" placeholder="Enter Password" value={loginValues.password} onChange={handleLoginChange} />
              {loginErrors.password && <span className="error-message">{loginErrors.password}</span>}
            </div>
            <button className="submit-btn" type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </button>
            <div style={{ textAlign: "center", marginTop: "12px" }}>
              <button
                type="button"
                onClick={() => navigate("/forgot-password")}
                style={{
                  background: "none",
                  border: "none",
                  color: "#FB923C",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                  textDecoration: "underline",
                  fontFamily: "inherit"
                }}
              >
                Forgot Password?
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default VendorLogin;
