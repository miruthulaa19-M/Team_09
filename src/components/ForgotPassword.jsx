import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "../styles/Login.css";

const emailRegex    = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
const passwordRegex = /^(?=.*[a-zA-Z])(?=.*[0-9]).{6,}$/;

function ForgotPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const role = searchParams.get("role") || "vendor";

  const [step, setStep]             = useState("email");
  const [email, setEmail]           = useState("");
  const [emailError, setEmailError] = useState("");
  const [password, setPassword]     = useState("");
  const [confirm, setConfirm]       = useState("");
  const [pwErrors, setPwErrors]     = useState({});
  const [success, setSuccess]       = useState("");
  const [apiError, setApiError]     = useState("");
  const [loading, setLoading]       = useState(false);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setEmailError(""); setApiError("");
    if (!email.trim()) { setEmailError("Email is required."); return; }
    if (!emailRegex.test(email)) { setEmailError("Email must be a valid @gmail.com address."); return; }
    setLoading(true);
    try {
      const res  = await fetch("/api/check-email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, role }) });
      const data = await res.json();
      if (!res.ok) { setApiError(data.error); return; }
      setStep("reset");
    } catch { setApiError("Server unreachable. Please make sure the backend is running."); }
    finally { setLoading(false); }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setApiError(""); setSuccess("");
    const errs = {};
    if (!password.trim()) errs.password = "Password is required.";
    else if (!passwordRegex.test(password)) errs.password = "At least 6 characters with letters and numbers.";
    if (!confirm.trim()) errs.confirm = "Please confirm your password.";
    else if (confirm !== password) errs.confirm = "Passwords do not match.";
    setPwErrors(errs);
    if (Object.keys(errs).length) return;
    setLoading(true);
    try {
      const res  = await fetch("/api/reset-password-direct", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password, role }) });
      const data = await res.json();
      if (!res.ok) { setApiError(data.error); return; }
      setSuccess("Password updated successfully! Redirecting to login...");
      setTimeout(() => navigate(role === "admin" ? "/admin-login" : "/vendor-login"), 1800);
    } catch { setApiError("Server unreachable. Please make sure the backend is running."); }
    finally { setLoading(false); }
  };

  return (
    <div className="lp-container">
      <div className="lp-left">
        <div className="lp-brand">
          <div className="lp-brand-icon">🔑</div>
          <div className="lp-brand-name">
            {role === "admin" ? "Admin Portal" : "Vendor Portal"}
            <span>Vendor Management System</span>
          </div>
        </div>
        <h2 className="lp-hero-title">Reset Your Password</h2>
        <p className="lp-hero-sub">Enter your registered email to verify your account, then set a new password securely.</p>
        <div className="lp-features">
          <div className="lp-feature"><span className="lp-feature-icon">✅</span><div className="lp-feature-text">Verify Email<span>Confirm your registered email</span></div></div>
          <div className="lp-feature"><span className="lp-feature-icon">🔒</span><div className="lp-feature-text">Set New Password<span>Choose a strong new password</span></div></div>
          <div className="lp-feature"><span className="lp-feature-icon">⚡</span><div className="lp-feature-text">Instant Update<span>No email link required</span></div></div>
        </div>
      </div>

      <div className="lp-right">
        <button className="lp-back" onClick={() => step === "reset" ? setStep("email") : navigate(role === "admin" ? "/admin-login" : "/vendor-login")}>
          &larr; {step === "reset" ? "Back" : "Back to Login"}
        </button>

        <h1 className="lp-title">Forgot Password</h1>
        <p className="lp-subtitle">{step === "email" ? "Enter your registered email to continue" : `Setting new password for ${email}`}</p>

        {success  && <p className="lp-success">{success}</p>}
        {apiError && <p className="lp-api-error">{apiError}</p>}

        {step === "email" ? (
          <form onSubmit={handleEmailSubmit} noValidate>
            <div className="lp-field">
              <label htmlFor="forgot-email">Registered Email</label>
              <input id="forgot-email" type="email" placeholder="example@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              {emailError && <span className="lp-error">{emailError}</span>}
            </div>
            <button className="lp-btn" type="submit" disabled={loading}>{loading ? "Checking..." : "Continue"}</button>
          </form>
        ) : (
          <form onSubmit={handleResetSubmit} noValidate>
            <div className="lp-field">
              <label htmlFor="new-password">New Password</label>
              <input id="new-password" type="password" placeholder="Enter new password" value={password} onChange={(e) => setPassword(e.target.value)} />
              {pwErrors.password && <span className="lp-error">{pwErrors.password}</span>}
            </div>
            <div className="lp-field">
              <label htmlFor="confirm-password">Confirm Password</label>
              <input id="confirm-password" type="password" placeholder="Re-enter new password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
              {pwErrors.confirm && <span className="lp-error">{pwErrors.confirm}</span>}
            </div>
            <button className="lp-btn" type="submit" disabled={loading}>{loading ? "Updating..." : "Update Password"}</button>
          </form>
        )}
      </div>
    </div>
  );
}

export default ForgotPassword;
