import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck, MapPin, Landmark, QrCode, Copy, Check, ArrowRight,
  Mail, ExternalLink, HeartHandshake, Upload, ReceiptText, Loader2, X,
} from "lucide-react";
import { PageNav, PageFooter } from "../components/PageChrome";
import Reveal from "../components/Reveal";
import { api } from "../lib/api";
import "../styles/tokens.css";
import "../styles/auth.css";

/* ---------------------------------------------------------
   Public page for money donations. Every NGO listed here is
   verified by the Nirvah team and has opted in to publish
   their own bank/UPI details — Nirvah never touches the
   money itself. See the "How a payment works" note below for
   the proof-of-payment / invoice flow.
--------------------------------------------------------- */

function CopyField({ label, value }) {
  const [copied, setCopied] = useState(false);
  if (!value) return null;

  function copy() {
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className="dm-field">
      <span className="dm-field-label">{label}</span>
      <div className="dm-field-row">
        <span className="dm-field-value">{value}</span>
        <button type="button" className="dm-copy-btn" onClick={copy} aria-label={`Copy ${label}`}>
          {copied ? <Check size={13} /> : <Copy size={13} />}
        </button>
      </div>
    </div>
  );
}

function QrModal({ url, name, onClose }) {
  return (
    <div className="dm-qr-modal-backdrop" onClick={onClose}>
      <div className="dm-qr-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="dm-qr-modal-close" onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>
        <img src={url} alt={`${name} payment QR code`} />
        <p>{name}'s payment QR</p>
      </div>
    </div>
  );
}

function NgoCard({ ngo }) {
  const displayName = ngo.org || ngo.name;
  const [qrOpen, setQrOpen] = useState(false);

  return (
    <Reveal className="dm-card">
      <div className="dm-card-top">
        <div>
          <span className="dm-badge"><ShieldCheck size={12} /> Verified NGO</span>
          <h3>{displayName}</h3>
          {ngo.cause && <p className="dm-cause">{ngo.cause}</p>}
        </div>
        {ngo.qrCodeUrl && (
          <button type="button" className="dm-qr-btn" onClick={() => setQrOpen(true)}>
            <QrCode size={14} /> View QR
          </button>
        )}
      </div>

      {ngo.city && (
        <div className="dm-meta"><MapPin size={13} /> {ngo.orgAddress || ngo.city}</div>
      )}

      {ngo.fundUseNote && (
        <div className="dm-fund-use">
          <span className="dm-fund-use-label">Where your donation goes</span>
          <p>{ngo.fundUseNote}</p>
        </div>
      )}

      <div className="dm-fields">
        <CopyField label="UPI ID" value={ngo.upiId} />
        <CopyField label="Account name" value={ngo.bankAccountName} />
        <CopyField label="Account number" value={ngo.bankAccountNumber} />
        <CopyField label="IFSC" value={ngo.bankIfsc} />
        <CopyField label="Bank" value={ngo.bankName} />
      </div>

      <div className="dm-card-foot">
        {ngo.csrEligible && <span className="dm-tag">80G · CSR eligible</span>}
        <Link to={`/impact/${ngo.userId}`} className="dm-impact-link">
          See their impact page & photos <ArrowRight size={13} />
        </Link>
      </div>

      {qrOpen && <QrModal url={ngo.qrCodeUrl} name={displayName} onClose={() => setQrOpen(false)} />}
    </Reveal>
  );
}

function PaymentProofForm() {
  const [form, setForm] = useState({ donorEmail: "", ngoName: "", note: "" });
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error
  const [error, setError] = useState("");

  function onChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (!file) {
      setError("Please attach a screenshot or photo of your payment.");
      return;
    }
    setStatus("sending");
    setError("");
    try {
      const data = new FormData();
      data.append("donorEmail", form.donorEmail);
      if (form.ngoName) data.append("ngoName", form.ngoName);
      if (form.note) data.append("note", form.note);
      data.append("screenshot", file);
      await api.submitPaymentProof(data);
      setStatus("sent");
    } catch (err) {
      setStatus("error");
      setError(err?.message || "Couldn't submit your proof right now. Please try again.");
    }
  }

  if (status === "sent") {
    return (
      <div className="dm-proof-sent">
        <Check size={22} />
        <div>
          <h3>Got it — thank you</h3>
          <p>We'll check this with the NGO and email your invoice to {form.donorEmail}.</p>
        </div>
      </div>
    );
  }

  return (
    <form className="dm-proof-form" onSubmit={onSubmit}>
      {error && <div className="dm-proof-error">{error}</div>}
      <div className="dm-proof-grid">
        <div className="nv-field">
          <label htmlFor="donorEmail">Your email</label>
          <input
            id="donorEmail" type="email" name="donorEmail" required
            placeholder="you@example.com" value={form.donorEmail} onChange={onChange}
          />
        </div>
        <div className="nv-field">
          <label htmlFor="ngoName">NGO you paid (optional)</label>
          <input
            id="ngoName" name="ngoName" placeholder="e.g. Asha Foundation"
            value={form.ngoName} onChange={onChange}
          />
        </div>
      </div>

      <div className="nv-field">
        <label htmlFor="screenshot">Payment screenshot or photo</label>
        <label className="dm-file-drop" htmlFor="screenshot">
          <Upload size={16} />
          {file ? file.name : "Choose a file — PNG, JPG, WEBP, or PDF"}
        </label>
        <input
          id="screenshot" type="file" accept="image/png,image/jpeg,image/webp,application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] || null)} style={{ display: "none" }}
        />
      </div>

      <div className="nv-field">
        <label htmlFor="note">Note (optional)</label>
        <textarea
          id="note" name="note" rows={2} placeholder="Anything that helps us match this to your payment"
          value={form.note} onChange={onChange}
        />
      </div>

      <button type="submit" className="nv-btn spark" disabled={status === "sending"}>
        {status === "sending" ? (<><Loader2 size={15} className="dm-spin" /> Sending…</>) : (<>Send proof, get my invoice <ReceiptText size={15} /></>)}
      </button>
    </form>
  );
}

export default function DonateMoney() {
  const [ngos, setNgos] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.listDonateNgos();
        if (cancelled) return;
        setNgos(res.ngos || []);
        setStatus("ready");
      } catch {
        if (!cancelled) setStatus("error");
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="nv-app" style={{ minHeight: "100vh" }}>
      <style>{`
        .dm-hero {
          position: relative; padding: 4.5rem 6vw 3.5rem; text-align: center;
          background: radial-gradient(120% 100% at 50% -10%, var(--char-2) 0%, var(--char) 60%, #06231A 100%);
          color: var(--parchment);
        }
        .dm-hero h1 { font-family: 'Fraunces', serif; font-size: clamp(2rem, 4vw, 2.8rem); margin: 0 0 0.8rem; }
        .dm-hero p { color: #BFE3D3; max-width: 560px; margin: 0 auto; line-height: 1.6; }

        .dm-how { max-width: 900px; margin: -2.4rem auto 0; position: relative; z-index: 2; background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius-lg); box-shadow: var(--shadow-soft); padding: 1.6rem 1.8rem; }
        .dm-how h2 { font-family: 'Fraunces', serif; font-size: 1.1rem; margin: 0 0 0.6rem; display: flex; align-items: center; gap: 8px; }
        .dm-how ol { margin: 0; padding-left: 1.2rem; color: var(--ink-soft); line-height: 1.7; font-size: 0.94rem; }

        .dm-section { max-width: 1080px; margin: 0 auto; padding: 4rem 6vw 5rem; }
        .dm-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.4rem; }

        .dm-card { background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius-md); box-shadow: var(--shadow-soft); padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
        .dm-card-top { display: flex; justify-content: space-between; gap: 1rem; align-items: flex-start; }
        .dm-badge { display: inline-flex; align-items: center; gap: 5px; font-family: 'IBM Plex Mono', monospace; font-size: 0.66rem; letter-spacing: 0.08em; text-transform: uppercase; color: var(--sage-deep); background: rgba(13,148,136,0.08); padding: 4px 9px; border-radius: 999px; margin-bottom: 0.5rem; }
        .dm-card h3 { font-family: 'Fraunces', serif; font-size: 1.2rem; margin: 0; }
        .dm-cause { color: var(--ink-soft); font-size: 0.9rem; margin: 0.3rem 0 0; }
        .dm-qr { width: 76px; height: 76px; object-fit: contain; background: #fff; border-radius: 10px; border: 1px solid var(--line); flex-shrink: 0; }
        .dm-qr-btn { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; width: 76px; height: 76px; flex-shrink: 0; background: var(--parchment-2); border: 1px solid var(--line); border-radius: 10px; color: var(--sage-deep); font-size: 0.68rem; font-weight: 600; cursor: pointer; transition: all 0.2s ease; }
        .dm-qr-btn:hover { border-color: var(--sage-deep); background: rgba(13,148,136,0.08); }
        .dm-qr-modal-backdrop { position: fixed; inset: 0; background: rgba(6,35,26,0.72); display: grid; place-items: center; z-index: 200; padding: 1.5rem; }
        .dm-qr-modal { position: relative; background: #fff; border-radius: var(--radius-md); padding: 1.8rem; max-width: 320px; width: 100%; text-align: center; box-shadow: var(--shadow-soft); }
        .dm-qr-modal img { width: 100%; aspect-ratio: 1; object-fit: contain; border-radius: 8px; }
        .dm-qr-modal p { margin: 0.9rem 0 0; font-size: 0.9rem; color: var(--ink-soft); }
        .dm-qr-modal-close { position: absolute; top: 10px; right: 10px; background: var(--parchment-2); border: none; border-radius: 999px; width: 30px; height: 30px; display: grid; place-items: center; cursor: pointer; color: var(--ink); }
        .dm-qr-modal-close:hover { background: var(--line); }

        .dm-meta { display: flex; align-items: center; gap: 6px; color: var(--ink-soft); font-size: 0.84rem; }

        .dm-fund-use { background: var(--parchment-2); border-radius: 10px; padding: 0.8rem 1rem; }
        .dm-fund-use-label { font-family: 'IBM Plex Mono', monospace; font-size: 0.66rem; letter-spacing: 0.08em; text-transform: uppercase; color: var(--sage-deep); }
        .dm-fund-use p { margin: 0.3rem 0 0; font-size: 0.9rem; line-height: 1.5; color: var(--ink); }

        .dm-fields { display: grid; gap: 0.55rem; }
        .dm-field-label { font-size: 0.72rem; color: var(--ink-soft); }
        .dm-field-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; border-bottom: 1px dashed var(--line); padding-bottom: 5px; }
        .dm-field-value { font-family: 'IBM Plex Mono', monospace; font-size: 0.88rem; word-break: break-all; }
        .dm-copy-btn { background: none; border: 1px solid var(--line); border-radius: 7px; padding: 4px 6px; color: var(--ink-soft); flex-shrink: 0; cursor: pointer; }
        .dm-copy-btn:hover { color: var(--sage-deep); border-color: var(--sage-deep); }

        .dm-card-foot { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; padding-top: 0.4rem; border-top: 1px solid var(--line); }
        .dm-tag { font-size: 0.74rem; color: var(--gold); font-weight: 600; }
        .dm-impact-link { font-size: 0.84rem; color: var(--sage-deep); text-decoration: none; display: inline-flex; align-items: center; gap: 4px; font-weight: 600; }

        .dm-empty, .dm-loading { max-width: 480px; margin: 0 auto; text-align: center; color: var(--ink-soft); padding: 2rem 0; }

        .dm-proof-wrap { max-width: 640px; margin: 0 auto 5rem; padding: 0 6vw; }
        .dm-proof-card { background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius-lg); box-shadow: var(--shadow-soft); padding: 2rem; }
        .dm-proof-card h2 { font-family: 'Fraunces', serif; font-size: 1.3rem; margin: 0 0 0.4rem; display: flex; align-items: center; gap: 8px; }
        .dm-proof-card > p { color: var(--ink-soft); font-size: 0.9rem; margin: 0 0 1.4rem; line-height: 1.5; }
        .dm-proof-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 1.2rem; }
        .dm-proof-form textarea { width: 100%; padding: 12px 14px; border-radius: 10px; border: 1px solid var(--line); background: var(--surface); font-family: inherit; font-size: 0.95rem; color: var(--ink); resize: vertical; }
        .dm-proof-form textarea:focus { outline: none; border-color: var(--spark); box-shadow: 0 0 0 3px rgba(16,185,129, 0.15); }
        .dm-file-drop { display: flex; align-items: center; gap: 8px; padding: 12px 14px; border-radius: 10px; border: 1px dashed var(--line); background: var(--parchment-2); font-size: 0.9rem; color: var(--ink-soft); cursor: pointer; transition: border-color 0.2s ease; }
        .dm-file-drop:hover { border-color: var(--spark-deep); color: var(--ink); }
        .dm-proof-error { background: rgba(220,38,38,0.08); border: 1px solid rgba(220,38,38,0.25); color: #B91C1C; padding: 10px 14px; border-radius: 10px; font-size: 0.88rem; margin-bottom: 1rem; }
        .dm-proof-sent { display: flex; align-items: flex-start; gap: 12px; background: rgba(16,185,129,0.08); border: 1px solid rgba(16,185,129,0.3); color: var(--sage-deep); padding: 1.4rem 1.5rem; border-radius: var(--radius-md); }
        .dm-proof-sent h3 { margin: 0 0 4px; font-family: 'Fraunces', serif; }
        .dm-proof-sent p { margin: 0; color: var(--ink-soft); font-size: 0.9rem; }
        .dm-spin { animation: dm-spin 0.9s linear infinite; }
        @keyframes dm-spin { to { transform: rotate(360deg); } }

        @media (max-width: 780px) { .dm-grid { grid-template-columns: 1fr; } .dm-proof-grid { grid-template-columns: 1fr; } }
      `}</style>

      <PageNav active="Donate" />

      <header className="dm-hero">
        <h1>Give money directly to a verified NGO</h1>
        <p>
          Every organisation below has cleared Nirvah's document verification. Pay them
          directly using the bank or UPI details on their card, and use the QR code for a
          faster scan-and-pay.
        </p>
      </header>

      <div className="dm-how">
        <h2><Mail size={17} /> How a payment works</h2>
        <ol>
          <li>Pick an NGO below and pay them directly by bank transfer, UPI, or the QR code shown.</li>
          <li>Send us your payment proof (a screenshot works fine) using the form further down this page.</li>
          <li>We check the payment with the NGO, then email you a valid invoice for your records.</li>
        </ol>
      </div>

      <section className="dm-section">
        {status === "loading" && <p className="dm-loading">Loading verified NGOs…</p>}

        {status === "error" && (
          <p className="dm-empty">Couldn't load the list right now. Please try again shortly.</p>
        )}

        {status === "ready" && ngos.length === 0 && (
          <div className="dm-empty">
            <p>No NGOs have published their monetary donation details yet.</p>
            <Link to="/browse" className="nv-btn spark" style={{ marginTop: "1rem" }}>
              See what's available to donate in kind <ArrowRight size={15} />
            </Link>
          </div>
        )}

        {status === "ready" && ngos.length > 0 && (
          <div className="dm-grid">
            {ngos.map((ngo) => <NgoCard key={ngo.userId} ngo={ngo} />)}
          </div>
        )}
      </section>

      <Reveal className="dm-proof-wrap" as="div">
        <div className="dm-proof-card">
          <h2><ReceiptText size={18} /> Send your payment proof</h2>
          <p>Already paid an NGO above? Send us the screenshot and your email — we'll verify it and email you a proper invoice.</p>
          <PaymentProofForm />
        </div>
      </Reveal>

      <Reveal className="ni-cta" style={{ margin: "0 6vw 5rem", borderRadius: "var(--radius-lg)", background: "linear-gradient(120deg, #134E43, var(--char))", color: "var(--parchment)", padding: "3rem", textAlign: "center" }}>
        <h2 className="font-display">Run a verified NGO?</h2>
        <p style={{ color: "#BFE3D3", margin: "0 0 1.4rem" }}>
          Once your account is verified you can publish your own bank and UPI details from
          your dashboard settings.
        </p>
        <Link to="/for-ngos" className="nv-btn sage">Learn how to register <HeartHandshake size={15} /></Link>
      </Reveal>

      <PageFooter />
    </div>
  );
}
