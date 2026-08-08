import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Logo from "../components/Logo";
import { api, setToken } from "../lib/api";
import "../styles/tokens.css";
import "../styles/auth.css";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: location.state?.resendFor || "", password: "" });
  const [error, setError] = useState("");
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setNeedsVerification(false);
    setResendMessage("");
    setLoading(true);
    try {
      const data = await api.login(form);
      setToken(data.token);
      navigate(data.user?.role === "ngo" ? "/dashboard/ngo" : "/dashboard/donor");
    } catch (err) {
      if (err.code === "EMAIL_NOT_VERIFIED") setNeedsVerification(true);
      setError(err.message || "Could not log you in. Please check your details.");
    } finally {
      setLoading(false);
    }
  };

  const onResend = async () => {
    setResendMessage("Sending...");
    try {
      await api.resendVerification(form.email);
      setResendMessage("Verification email sent. Check your inbox.");
    } catch (err) {
      setResendMessage(err.message || "Could not resend the email. Please try again.");
    }
  };

  return (
    <div className="nv-app nv-auth">
      <div className="nv-auth-side">
        <Link to="/" className="nv-brand">
          <Logo size={32} />
          Nirvah
        </Link>
        <div>
          <p className="quote font-display">
            "We used to spend hours cold calling donors. Now listings come to us the moment they go up."
            <span> Michael Brown</span>
          </p>
          <div className="who">NGO Coordinator, Asha Foundation</div>
        </div>
        <div style={{ fontSize: "0.8rem", color: "#6FA98D", fontFamily: "IBM Plex Mono, monospace" }}>
          Free for givers and NGOs. No hidden fees, ever.
        </div>
      </div>

      <div className="nv-auth-form-wrap">
        <div className="nv-auth-card">
          <Link to="/" className="nv-back-link"><ArrowLeft size={15} /> Back to Nirvah</Link>
          <h1 className="font-display">Welcome back</h1>
          <p className="sub">Log in to keep the circle going.</p>

          {error && (
            <div className="nv-auth-error">
              {error}
              {needsVerification && (
                <div style={{ marginTop: "0.5rem" }}>
                  <button type="button" className="nv-link-btn" onClick={onResend}>
                    Resend verification email
                  </button>
                </div>
              )}
            </div>
          )}
          {resendMessage && <div className="nv-auth-note">{resendMessage}</div>}

          <form onSubmit={onSubmit}>
            <div className="nv-field">
              <label htmlFor="email">Email</label>
              <input id="email" type="email" name="email" value={form.email} onChange={onChange} placeholder="you@example.com" required />
            </div>
            <div className="nv-field">
              <label htmlFor="password">Password</label>
              <input id="password" type="password" name="password" value={form.password} onChange={onChange} placeholder="Your password" required />
              <div style={{ marginTop: "0.4rem" }}>
                <Link to="/forgot-password" className="nv-inline-link">Forgot password?</Link>
              </div>
            </div>
            <button type="submit" className="nv-btn spark" style={{ width: "100%", justifyContent: "center" }} disabled={loading}>
              {loading ? "Logging in..." : "Log in"}
            </button>
          </form>

          <div className="nv-auth-switch">
            New to Nirvah? <Link to="/signup">Create a free account</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
