import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/AdminLogin.css";

const emailRegex    = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
const passwordRegex = /^(?=.*[a-zA-Z])(?=.*[0-9]).{6,}$/;

const emptyLogin    = { email: "", password: "" };
const emptyRegister = { email: "", password: "", confirmPassword: "" };

function validateLogin({ email, password }) {
  return {
    email: !email.trim() ? "This field is required"
      : !emailRegex.test(email) ? "Email must end with @gmail.com" : "",
    password: !password.trim() ? "This field is required"
      : !passwordRegex.test(password) ? "Password must be at least 6 characters with letters and numbers" : "",
  };
}

function validateRegister({ email, password, confirmPassword }) {
  return {
    email: !email.trim() ? "This field is required"
      : !emailRegex.test(email) ? "Email must end with @gmail.com" : "",
    password: !password.trim() ? "This field is required"
      : !passwordRegex.test(password) ? "Password must be at least 6 characters with letters and numbers" : "",
    confirmPassword: !confirmPassword.trim() ? "This field is required"
      : confirmPassword !== password ? "Passwords do not match" : "",
  };
}

function AdminLogin() {
  const navigate = useNavigate();
  const [tab, setTab]                   = useState("register");
  const [loginValues, setLoginValues]   = useState(emptyLogin);
  const [regValues, setRegValues]       = useState(emptyRegister);
  const [loginErrors, setLoginErrors]   = useState({});
  const [regErrors, setRegErrors]       = useState({});
  const [success, setSuccess]           = useState("");
  const [apiError, setApiError]         = useState("");
  const [loading, setLoading]           = useState(false);

  const switchTab = (t) => {
    setTab(t);
    setSuccess("");
    setApiError("");
    setLoginErrors({});
    setRegErrors({});
  };

  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginValues((v) => ({ ...v, [name]: value }));
  };

  const handleRegChange = (e) => {
    const { name, value } = e.target;
    setRegValues((v) => ({ ...v, [name]: value }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setSuccess(""); setApiError("");
    const errs = validateLogin(loginValues);
    setLoginErrors(errs);
    if (Object.values(errs).some(Boolean)) return;

    setLoading(true);
    try {
      const res  = await fetch("/api/admin-login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginValues),
      });
      const data = await res.json();
      if (!res.ok) { setApiError(data.error); return; }
      setSuccess(data.message);
      setTimeout(() => navigate("/admin-dashboard"), 800);
    } catch {
      setApiError("Server unreachable. Please make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setSuccess(""); setApiError("");
    const errs = validateRegister(regValues);
    setRegErrors(errs);
    if (Object.values(errs).some(Boolean)) return;

    setLoading(true);
    try {
      const res  = await fetch("/api/admin-register", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: regValues.email, password: regValues.password }),
      });
      const data = await res.json();
      if (!res.ok) { setApiError(data.error); return; }
      setSuccess(data.message);
      setRegValues(emptyRegister);
    } catch {
      setApiError("Server unreachable. Please make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-container">
      <div className="admin-box">
        <button className="back-arrow" onClick={() => navigate("/")} aria-label="Back">
          &#8592; Back
        </button>

        <h1 className="brand-title">Vendor Portal</h1>

        <div className="tab-bar">
          <button
            className={`tab-btn${tab === "register" ? " tab-active" : ""}`}
            onClick={() => switchTab("register")} type="button"
          >
            Sign Up
          </button>
          <button
            className={`tab-btn${tab === "login" ? " tab-active" : ""}`}
            onClick={() => switchTab("login")} type="button"
          >
            Sign In
          </button>
        </div>

        {success  && <p className="success-message">{success}</p>}
        {apiError && <p className="api-error-message">{apiError}</p>}

        {tab === "login" ? (
          <form onSubmit={handleLogin} noValidate>
            <div className="input-group">
              <label htmlFor="admin-email">Email</label>
              <input id="admin-email" name="email" type="email"
                placeholder="example@gmail.com"
                value={loginValues.email} onChange={handleLoginChange} />
              {loginErrors.email && <span className="error-message">{loginErrors.email}</span>}
            </div>
            <div className="input-group">
              <label htmlFor="admin-password">Password</label>
              <input id="admin-password" name="password" type="password"
                placeholder="Enter Password"
                value={loginValues.password} onChange={handleLoginChange} />
              {loginErrors.password && <span className="error-message">{loginErrors.password}</span>}
            </div>
            <div className="forgot"><span onClick={() => navigate("/forgot-password?role=admin")} style={{cursor:"pointer"}}>Forgot Password?</span></div>
            <button className="signup-btn" type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} noValidate>
            <div className="input-group">
              <label htmlFor="reg-email">Email</label>
              <input id="reg-email" name="email" type="email"
                placeholder="example@gmail.com"
                value={regValues.email} onChange={handleRegChange} />
              {regErrors.email && <span className="error-message">{regErrors.email}</span>}
            </div>
            <div className="input-group">
              <label htmlFor="reg-password">Password</label>
              <input id="reg-password" name="password" type="password"
                placeholder="Enter Password"
                value={regValues.password} onChange={handleRegChange} />
              {regErrors.password && <span className="error-message">{regErrors.password}</span>}
            </div>
            <div className="input-group">
              <label htmlFor="reg-confirm">Confirm Password</label>
              <input id="reg-confirm" name="confirmPassword" type="password"
                placeholder="Re-enter Password"
                value={regValues.confirmPassword} onChange={handleRegChange} />
              {regErrors.confirmPassword && <span className="error-message">{regErrors.confirmPassword}</span>}
            </div>
            <button className="signup-btn" type="submit" disabled={loading}>
              {loading ? "Registering..." : "Sign Up"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default AdminLogin;
