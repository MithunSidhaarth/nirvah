import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Flame, ArrowLeft } from "lucide-react";
import { api, setToken } from "../lib/api";
import "../styles/tokens.css";
import "../styles/auth.css";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await api.login(form);
      setToken(data.token);
      navigate(data.user?.role === "ngo" ? "/dashboard/ngo" : "/dashboard/donor");
    } catch (err) {
      setError(err.message || "Could not log you in. Please check your details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="nv-app nv-auth">
      <div className="nv-auth-side">
        <Link to="/" className="nv-brand">
          <span className="badge"><Flame size={18} strokeWidth={2.4} /></span>
          Nirvah
        </Link>
        <div>
          <p className="quote font-display">
            "We used to spend hours cold calling donors. Now listings come to us the moment they go up."
            <span> Michael Brown</span>
          </p>
          <div className="who">NGO Coordinator, Asha Foundation</div>
        </div>
        <div style={{ fontSize: "0.8rem", color: "#9C8E79", fontFamily: "IBM Plex Mono, monospace" }}>
          Free for givers and NGOs. No hidden fees, ever.
        </div>
      </div>

      <div className="nv-auth-form-wrap">
        <div className="nv-auth-card">
          <Link to="/" className="nv-back-link"><ArrowLeft size={15} /> Back to Nirvah</Link>
          <h1 className="font-display">Welcome back</h1>
          <p className="sub">Log in to keep the circle going.</p>

          {error && <div className="nv-auth-error">{error}</div>}

          <form onSubmit={onSubmit}>
            <div className="nv-field">
              <label htmlFor="email">Email</label>
              <input id="email" type="email" name="email" value={form.email} onChange={onChange} placeholder="you@example.com" required />
            </div>
            <div className="nv-field">
              <label htmlFor="password">Password</label>
              <input id="password" type="password" name="password" value={form.password} onChange={onChange} placeholder="Your password" required />
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
