import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/VendorLogin.css";

const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;

function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email.trim()) {
      setError("Email is required.");
      return;
    }
    if (!emailRegex.test(email)) {
      setError("Email must be a valid @gmail.com address.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      setSuccess(data.message);
      setEmail("");
    } catch {
      setError("Server unreachable. Please make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="vendor-container">
      <div className="vendor-box">
        <button className="back-arrow" onClick={() => navigate("/vendor-login")} aria-label="Back">
          &#8592; Back to Login
        </button>

        <h1 className="brand-title">Forgot Password</h1>

        {success && <p className="success-message">{success}</p>}
        {error && <p className="api-error-message">{error}</p>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="input-group">
            <label htmlFor="forgot-email">Registered Email</label>
            <input
              id="forgot-email"
              type="email"
              placeholder="example@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <button className="submit-btn" type="submit" disabled={loading}>
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ForgotPassword;
