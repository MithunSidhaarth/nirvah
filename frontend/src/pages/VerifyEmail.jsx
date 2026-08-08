import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import Logo from "../components/Logo";
import { api } from "../lib/api";
import "../styles/tokens.css";
import "../styles/auth.css";

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [status, setStatus] = useState("checking"); // checking | success | error

  useEffect(() => {
    if (!token) {
      setStatus("error");
      return;
    }
    api
      .verifyEmail(token)
      .then(() => setStatus("success"))
      .catch(() => setStatus("error"));
  }, [token]);

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
          <Link to="/" className="nv-back-link"><ArrowLeft size={15} /> Back to Nirvah</Link>

          {status === "checking" && (
            <>
              <h1 className="font-display">Verifying your email...</h1>
              <p className="sub">One moment.</p>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle2 size={32} style={{ marginBottom: "0.75rem", color: "var(--spark-deep)" }} />
              <h1 className="font-display">Email verified</h1>
              <p className="sub">Your account is ready. You can log in now.</p>
              <Link to="/login" className="nv-btn spark" style={{ width: "100%", justifyContent: "center" }}>
                Log in
              </Link>
            </>
          )}

          {status === "error" && (
            <>
              <XCircle size={32} style={{ marginBottom: "0.75rem", color: "var(--spark-deep)" }} />
              <h1 className="font-display">Link invalid or expired</h1>
              <p className="sub">
                This verification link no longer works. Log in and we'll let you send a new one.
              </p>
              <Link to="/login" className="nv-btn spark" style={{ width: "100%", justifyContent: "center" }}>
                Go to login
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
