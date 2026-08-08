import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Logo from "../components/Logo";
import { api } from "../lib/api";
import "../styles/tokens.css";
import "../styles/auth.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="nv-app nv-auth">
      <div className="nv-auth-side">
        <Link to="/" className="nv-brand">
          <Logo size={32} />
          Nirvah
        </Link>
      </div>

      <div className="nv-auth-form-wrap">
        <div className="nv-auth-card">
          <Link to="/login" className="nv-back-link"><ArrowLeft size={15} /> Back to login</Link>
          <h1 className="font-display">Reset your password</h1>
          <p className="sub">Enter the email on your account and we'll send you a reset link.</p>

          {error && <div className="nv-auth-error">{error}</div>}

          {sent ? (
            <div className="nv-auth-note">
              If that email has an account, a reset link is on its way. Check your inbox.
            </div>
          ) : (
            <form onSubmit={onSubmit}>
              <div className="nv-field">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>
              <button type="submit" className="nv-btn spark" style={{ width: "100%", justifyContent: "center" }} disabled={loading}>
                {loading ? "Sending..." : "Send reset link"}
              </button>
            </form>
          )}

          <div className="nv-auth-switch">
            Remembered it? <Link to="/login">Log in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
