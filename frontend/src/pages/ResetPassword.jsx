import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Logo from "../components/Logo";
import { api } from "../lib/api";
import "../styles/tokens.css";
import "../styles/auth.css";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("This reset link is missing its token. Request a new one.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await api.resetPassword(token, password);
      setDone(true);
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

          {done ? (
            <>
              <h1 className="font-display">Password updated</h1>
              <p className="sub">You can log in with your new password now.</p>
              <button
                className="nv-btn spark"
                style={{ width: "100%", justifyContent: "center" }}
                onClick={() => navigate("/login")}
              >
                Go to login
              </button>
            </>
          ) : (
            <>
              <h1 className="font-display">Choose a new password</h1>
              <p className="sub">Make it at least 8 characters.</p>

              {error && <div className="nv-auth-error">{error}</div>}

              <form onSubmit={onSubmit}>
                <div className="nv-field">
                  <label htmlFor="password">New password</label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={8}
                    required
                  />
                </div>
                <div className="nv-field">
                  <label htmlFor="confirm">Confirm password</label>
                  <input
                    id="confirm"
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    minLength={8}
                    required
                  />
                </div>
                <button type="submit" className="nv-btn spark" style={{ width: "100%", justifyContent: "center" }} disabled={loading}>
                  {loading ? "Updating..." : "Update password"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
