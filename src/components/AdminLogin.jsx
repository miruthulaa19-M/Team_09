import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Login.css";

const emailRegex    = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
const passwordRegex = /^(?=.*[a-zA-Z])(?=.*[0-9]).{6,}$/;

const emptyLogin    = { email: "", password: "" };
const emptyRegister = { email: "", password: "", confirmPassword: "" };

function validateLogin({ email, password }) {
  return {
    email:    !email.trim() ? "This field is required" : !emailRegex.test(email) ? "Email must end with @gmail.com" : "",
    password: !password.trim() ? "This field is required" : !passwordRegex.test(password) ? "At least 6 characters with letters and numbers" : "",
  };
}

function validateRegister({ email, password, confirmPassword }) {
  return {
    email:           !email.trim() ? "This field is required" : !emailRegex.test(email) ? "Email must end with @gmail.com" : "",
    password:        !password.trim() ? "This field is required" : !passwordRegex.test(password) ? "At least 6 characters with letters and numbers" : "",
    confirmPassword: !confirmPassword.trim() ? "This field is required" : confirmPassword !== password ? "Passwords do not match" : "",
  };
}

function AdminLogin() {
  const navigate = useNavigate();
  const [tab, setTab]               = useState("register");
  const [loginValues, setLoginValues] = useState(emptyLogin);
  const [regValues, setRegValues]     = useState(emptyRegister);
  const [loginErrors, setLoginErrors] = useState({});
  const [regErrors, setRegErrors]     = useState({});
  const [success, setSuccess]         = useState("");
  const [apiError, setApiError]       = useState("");
  const [loading, setLoading]         = useState(false);

  const switchTab = (t) => { setTab(t); setSuccess(""); setApiError(""); setLoginErrors({}); setRegErrors({}); };
  const handleLoginChange = (e) => { const { name, value } = e.target; setLoginValues(v => ({ ...v, [name]: value })); };
  const handleRegChange   = (e) => { const { name, value } = e.target; setRegValues(v => ({ ...v, [name]: value })); };

  const handleLogin = async (e) => {
    e.preventDefault();
    setSuccess(""); setApiError("");
    const errs = validateLogin(loginValues);
    setLoginErrors(errs);
    if (Object.values(errs).some(Boolean)) return;
    setLoading(true);
    try {
      const res  = await fetch("/api/admin-login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(loginValues) });
      const data = await res.json();
      if (!res.ok) { setApiError(data.error); return; }
      setSuccess(data.message);
      if (data.admin) localStorage.setItem("admin", JSON.stringify(data.admin));
      setTimeout(() => navigate("/admin-dashboard"), 800);
    } catch { setApiError("Server unreachable. Please make sure the backend is running."); }
    finally { setLoading(false); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setSuccess(""); setApiError("");
    const errs = validateRegister(regValues);
    setRegErrors(errs);
    if (Object.values(errs).some(Boolean)) return;
    setLoading(true);
    try {
      const res  = await fetch("/api/admin-register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: regValues.email, password: regValues.password }) });
      const data = await res.json();
      if (!res.ok) { setApiError(data.error); return; }
      setSuccess(data.message);
      setRegValues(emptyRegister);
    } catch { setApiError("Server unreachable. Please make sure the backend is running."); }
    finally { setLoading(false); }
  };

  return (
    <div className="lp-container">
      <div className="lp-left">
        <div className="lp-brand">
          <div className="lp-brand-icon">🛡️</div>
          <div className="lp-brand-name">
            Admin Portal
            <span>Vendor Management System</span>
          </div>
        </div>
        <h2 className="lp-hero-title">Complete Control Over Your Vendor Network</h2>
        <p className="lp-hero-sub">Approve vendors, manage purchase orders, review quotations, and monitor performance — all from one dashboard.</p>
        <div className="lp-features">
          <div className="lp-feature"><span className="lp-feature-icon">🏭</span><div className="lp-feature-text">Vendor Management<span>Approve & track all vendors</span></div></div>
          <div className="lp-feature"><span className="lp-feature-icon">📝</span><div className="lp-feature-text">Quotation Review<span>Accept or reject vendor bids</span></div></div>
          <div className="lp-feature"><span className="lp-feature-icon">📦</span><div className="lp-feature-text">Purchase Orders<span>End-to-end PO tracking</span></div></div>
          <div className="lp-feature"><span className="lp-feature-icon">📊</span><div className="lp-feature-text">Analytics Dashboard<span>Real-time procurement insights</span></div></div>
        </div>
      </div>

      <div className="lp-right">
        <button className="lp-back" onClick={() => navigate("/")}>&larr; Back</button>

        <h1 className="lp-title">{tab === "register" ? "Create Admin" : "Admin Sign In"}</h1>
        <p className="lp-subtitle">{tab === "register" ? "Register a new admin account" : "Sign in to access the admin dashboard"}</p>

        <div className="lp-tabs">
          <button className={`lp-tab${tab === "login"    ? " active" : ""}`} onClick={() => switchTab("login")}    type="button">Sign In</button>
          <button className={`lp-tab${tab === "register" ? " active" : ""}`} onClick={() => switchTab("register")} type="button">Sign Up</button>
        </div>

        {success  && <p className="lp-success">{success}</p>}
        {apiError && <p className="lp-api-error">{apiError}</p>}

        {tab === "login" ? (
          <form onSubmit={handleLogin} noValidate>
            <div className="lp-field">
              <label htmlFor="admin-email">Email</label>
              <input id="admin-email" name="email" type="email" placeholder="example@gmail.com" value={loginValues.email} onChange={handleLoginChange} />
              {loginErrors.email && <span className="lp-error">{loginErrors.email}</span>}
            </div>
            <div className="lp-field">
              <label htmlFor="admin-password">Password</label>
              <input id="admin-password" name="password" type="password" placeholder="Enter Password" value={loginValues.password} onChange={handleLoginChange} />
              {loginErrors.password && <span className="lp-error">{loginErrors.password}</span>}
            </div>
            <div className="lp-forgot">
              <button type="button" onClick={() => navigate("/forgot-password?role=admin")}>Forgot Password?</button>
            </div>
            <button className="lp-btn" type="submit" disabled={loading}>{loading ? "Signing in..." : "Sign In"}</button>
          </form>
        ) : (
          <form onSubmit={handleRegister} noValidate>
            <div className="lp-field">
              <label htmlFor="reg-email">Email</label>
              <input id="reg-email" name="email" type="email" placeholder="example@gmail.com" value={regValues.email} onChange={handleRegChange} />
              {regErrors.email && <span className="lp-error">{regErrors.email}</span>}
            </div>
            <div className="lp-field">
              <label htmlFor="reg-password">Password</label>
              <input id="reg-password" name="password" type="password" placeholder="Enter Password" value={regValues.password} onChange={handleRegChange} />
              {regErrors.password && <span className="lp-error">{regErrors.password}</span>}
            </div>
            <div className="lp-field">
              <label htmlFor="reg-confirm">Confirm Password</label>
              <input id="reg-confirm" name="confirmPassword" type="password" placeholder="Re-enter Password" value={regValues.confirmPassword} onChange={handleRegChange} />
              {regErrors.confirmPassword && <span className="lp-error">{regErrors.confirmPassword}</span>}
            </div>
            <button className="lp-btn" type="submit" disabled={loading}>{loading ? "Registering..." : "Sign Up"}</button>
          </form>
        )}
      </div>
    </div>
  );
}

export default AdminLogin;
