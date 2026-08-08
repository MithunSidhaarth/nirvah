import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Sparkles, Users2, MailCheck } from "lucide-react";
import Logo from "../components/Logo";
import { api } from "../lib/api";
import "../styles/tokens.css";
import "../styles/auth.css";

export default function Signup() {
  const [params] = useSearchParams();
  const [role, setRole] = useState(params.get("role") === "ngo" ? "ngo" : "donor");
  const [form, setForm] = useState({ name: "", org: "", email: "", password: "", city: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.signup({ ...form, role });
      setSubmittedEmail(form.email);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submittedEmail) {
    return (
      <div className="nv-app nv-auth">
        <div className="nv-auth-side">
          <Link to="/" className="nv-brand">
            <Logo size={32} />
            Nirvah
          </Link>
          <div>
            <p className="quote font-display">
              "The countdown on perishable listings changed everything for us. We know exactly what needs picking up first."
              <span> Lisa Miller</span>
            </p>
            <div className="who">Volunteer Lead, community kitchen network</div>
          </div>
        </div>
        <div className="nv-auth-form-wrap">
          <div className="nv-auth-card">
            <Link to="/" className="nv-back-link"><ArrowLeft size={15} /> Back to Nirvah</Link>
            <MailCheck size={32} style={{ marginBottom: "0.75rem" }} />
            <h1 className="font-display">Check your email</h1>
            <p className="sub">
              We sent a verification link to <strong>{submittedEmail}</strong>. Open it to activate your
              account, then come back and log in.
            </p>
            <div className="nv-auth-switch">
              Didn't get it? <Link to="/login" state={{ resendFor: submittedEmail }}>Log in to resend it</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="nv-app nv-auth">
      <div className="nv-auth-side">
        <Link to="/" className="nv-brand">
          <Logo size={32} />
          Nirvah
        </Link>
        <div>
          <p className="quote font-display">
            "The countdown on perishable listings changed everything for us. We know exactly what needs picking up first."
            <span> Lisa Miller</span>
          </p>
          <div className="who">Volunteer Lead, community kitchen network</div>
        </div>
        <div style={{ fontSize: "0.8rem", color: "#6FA98D", fontFamily: "IBM Plex Mono, monospace" }}>
          Free for givers and NGOs. No hidden fees, ever.
        </div>
      </div>

      <div className="nv-auth-form-wrap">
        <div className="nv-auth-card">
          <Link to="/" className="nv-back-link"><ArrowLeft size={15} /> Back to Nirvah</Link>
          <h1 className="font-display">Create your account</h1>
          <p className="sub">Join the network in under two minutes. Pick the role that fits you.</p>

          <div className="nv-role-toggle">
            <button type="button" className={`nv-role-btn donor ${role === "donor" ? "active donor" : ""}`} onClick={() => setRole("donor")}>
              <Sparkles size={16} /> I am a giver
            </button>
            <button type="button" className={`nv-role-btn ngo ${role === "ngo" ? "active ngo" : ""}`} onClick={() => setRole("ngo")}>
              <Users2 size={16} /> I am an NGO
            </button>
          </div>

          {error && <div className="nv-auth-error">{error}</div>}

          <form onSubmit={onSubmit}>
            <div className="nv-field">
              <label htmlFor="name">{role === "ngo" ? "Contact name" : "Full name"}</label>
              <input id="name" name="name" value={form.name} onChange={onChange} placeholder="Enter your name" required />
            </div>
            {role === "ngo" && (
              <div className="nv-field">
                <label htmlFor="org">Organisation name</label>
                <input id="org" name="org" value={form.org} onChange={onChange} placeholder="Enter your organisation's name" required />
              </div>
            )}
            <div className="nv-field">
              <label htmlFor="email">Email</label>
              <input id="email" type="email" name="email" value={form.email} onChange={onChange} placeholder="you@example.com" required />
            </div>
            <div className="nv-field">
              <label htmlFor="city">City</label>
              <input id="city" name="city" value={form.city} onChange={onChange} placeholder="Bengaluru" required />
            </div>
            <div className="nv-field">
              <label htmlFor="password">Password</label>
              <input id="password" type="password" name="password" value={form.password} onChange={onChange} placeholder="Choose a password" minLength={8} required />
            </div>
            <button type="submit" className={`nv-btn ${role === "ngo" ? "sage" : "spark"}`} style={{ width: "100%", justifyContent: "center" }} disabled={loading}>
              {loading ? "Creating account..." : "Create free account"}
            </button>
          </form>

          <div className="nv-auth-switch">
            Already on Nirvah? <Link to="/login">Log in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
