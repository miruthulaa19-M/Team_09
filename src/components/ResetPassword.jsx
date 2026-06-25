import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../styles/VendorLogin.css";

const passwordRegex = /^(?=.*[a-zA-Z])(?=.*[0-9]).{6,}$/;

function ResetPassword() {
  const navigate = useNavigate();
  const { token } = useParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState("");
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const res = await fetch(`/api/reset-password/${token}`);
        const data = await res.json();
        if (!res.ok) {
          setApiError(data.error);
          setTimeout(() => navigate("/vendor-login"), 3000);
        }
      } catch {
        setApiError("Server unreachable.");
        setTimeout(() => navigate("/vendor-login"), 3000);
      } finally {
        setVerifying(false);
      }
    };
    verifyToken();
  }, [token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess("");
    setApiError("");
    const errs = {};

    if (!password.trim()) {
      errs.password = "Password is required.";
    } else if (!passwordRegex.test(password)) {
      errs.password = "Password must be at least 6 characters with letters and numbers.";
    }

    if (!confirmPassword.trim()) {
      errs.confirmPassword = "Confirm Password is required.";
    } else if (confirmPassword !== password) {
      errs.confirmPassword = "Passwords do not match.";
    }

    setErrors(errs);
    if (Object.values(errs).some(Boolean)) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/reset-password/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setApiError(data.error);
        return;
      }
      setSuccess(data.message);
      setTimeout(() => navigate("/vendor-login"), 2000);
    } catch {
      setApiError("Server unreachable.");
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="vendor-container">
        <div className="vendor-box" style={{ textAlign: "center" }}>
          <p style={{ color: "#FB923C", fontSize: "16px", fontWeight: "600" }}>
            Verifying reset link...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="vendor-container">
      <div className="vendor-box">
        <button className="back-arrow" onClick={() => navigate("/vendor-login")} aria-label="Back">
          &#8592; Back to Login
        </button>

        <h1 className="brand-title">Reset Password</h1>

        {success && <p className="success-message">{success}</p>}
        {apiError && <p className="api-error-message">{apiError}</p>}

        {!apiError && (
          <form onSubmit={handleSubmit} noValidate>
            <div className="input-group">
              <label htmlFor="new-password">New Password</label>
              <input
                id="new-password"
                type="password"
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {errors.password && <span className="error-message">{errors.password}</span>}
            </div>
            <div className="input-group">
              <label htmlFor="confirm-password">Confirm Password</label>
              <input
                id="confirm-password"
                type="password"
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
            </div>
            <button className="submit-btn" type="submit" disabled={loading}>
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default ResetPassword;
