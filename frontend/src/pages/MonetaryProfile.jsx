import React, { useEffect, useRef, useState } from "react";
import { Landmark, QrCode, ShieldAlert, ExternalLink } from "lucide-react";
import DashboardShell from "../components/DashboardShell";
import { api } from "../lib/api";

const EMPTY_FORM = {
  cause: "",
  fundUseNote: "",
  orgAddress: "",
  bankAccountName: "",
  bankAccountNumber: "",
  bankIfsc: "",
  bankName: "",
  upiId: "",
};

export default function MonetaryProfile() {
  const [user, setUser] = useState(null);
  const [verified, setVerified] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [accepts, setAccepts] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingQr, setUploadingQr] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [me, monetary] = await Promise.all([api.me(), api.getMyMonetaryProfile()]);
        if (cancelled) return;
        setUser(me?.user || null);
        const m = monetary?.monetary || {};
        setVerified(m.verificationStatus === "verified");
        setForm({
          cause: m.cause || "",
          fundUseNote: m.fundUseNote || "",
          orgAddress: m.orgAddress || "",
          bankAccountName: m.bankAccountName || "",
          bankAccountNumber: m.bankAccountNumber || "",
          bankIfsc: m.bankIfsc || "",
          bankName: m.bankName || "",
          upiId: m.upiId || "",
        });
        setAccepts(!!m.acceptsMonetaryDonations);
        setQrCodeUrl(m.qrCodeUrl || null);
      } catch {
        // No live backend yet — leave the form blank so the NGO can still
        // see what the page looks like before wiring is done.
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      await api.updateMyMonetaryProfile({ ...form, acceptsMonetaryDonations: accepts });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err?.message || "Couldn't save right now. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const onQrSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingQr(true);
    setError("");
    try {
      const res = await api.uploadMyQrCode(file);
      setQrCodeUrl(res?.monetary?.qrCodeUrl || null);
    } catch (err) {
      setError(err?.message || "Couldn't upload the QR code. Please try again.");
    } finally {
      setUploadingQr(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <DashboardShell role="ngo" user={user}>
      <div className="nv-topbar">
        <div>
          <h1 className="font-display">Accept money donations</h1>
          <p className="sub">
            Fill this in and turn it on to appear on Nirvah's public <a href="/donate-money" target="_blank" rel="noreferrer">donate page <ExternalLink size={12} style={{ display: "inline" }} /></a>.
            Only verified NGOs are ever listed there.
          </p>
        </div>
      </div>

      {!verified && (
        <div className="nv-panel" style={{ marginBottom: "1.4rem", display: "flex", gap: "0.8rem", alignItems: "flex-start", background: "rgba(217,119,6,0.08)", borderColor: "rgba(217,119,6,0.3)" }}>
          <ShieldAlert size={18} color="#B45309" style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ fontSize: "0.88rem", color: "var(--ink-soft)" }}>
            You can fill this in now, but it only goes live on the public donate page once your NGO
            verification is complete.
          </div>
        </div>
      )}

      <form onSubmit={onSave} className="nv-panel" style={{ display: "grid", gap: "1.1rem", maxWidth: 640 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: "0.92rem", fontWeight: 600 }}>
          <input type="checkbox" checked={accepts} onChange={(e) => setAccepts(e.target.checked)} />
          Show us on the public donate page
        </label>

        <div className="nv-field">
          <label htmlFor="cause">Cause (shown at the top of your card)</label>
          <input id="cause" name="cause" value={form.cause} onChange={onChange} placeholder="e.g. Daily meals for shelter families in Bengaluru" maxLength={300} />
        </div>

        <div className="nv-field">
          <label htmlFor="fundUseNote">Where the donation goes</label>
          <textarea id="fundUseNote" name="fundUseNote" value={form.fundUseNote} onChange={onChange} rows={3} placeholder="Explain in plain terms what a donor's money is used for." maxLength={1000} />
        </div>

        <div className="nv-field">
          <label htmlFor="orgAddress">Registered address</label>
          <input id="orgAddress" name="orgAddress" value={form.orgAddress} onChange={onChange} placeholder="Street, area, city, PIN" maxLength={500} />
        </div>

        <h2 style={{ margin: "0.4rem 0 0", display: "flex", alignItems: "center", gap: 8 }}><Landmark size={18} /> Bank & UPI details</h2>

        <div className="nv-field">
          <label htmlFor="upiId">UPI ID</label>
          <input id="upiId" name="upiId" value={form.upiId} onChange={onChange} placeholder="yourngo@upi" maxLength={100} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div className="nv-field">
            <label htmlFor="bankAccountName">Account name</label>
            <input id="bankAccountName" name="bankAccountName" value={form.bankAccountName} onChange={onChange} maxLength={200} />
          </div>
          <div className="nv-field">
            <label htmlFor="bankName">Bank name</label>
            <input id="bankName" name="bankName" value={form.bankName} onChange={onChange} maxLength={200} />
          </div>
          <div className="nv-field">
            <label htmlFor="bankAccountNumber">Account number</label>
            <input id="bankAccountNumber" name="bankAccountNumber" value={form.bankAccountNumber} onChange={onChange} maxLength={50} />
          </div>
          <div className="nv-field">
            <label htmlFor="bankIfsc">IFSC</label>
            <input id="bankIfsc" name="bankIfsc" value={form.bankIfsc} onChange={onChange} maxLength={20} />
          </div>
        </div>

        <div className="nv-field">
          <label htmlFor="qrUpload"><QrCode size={14} style={{ display: "inline", marginRight: 4 }} /> Payment QR code</label>
          {qrCodeUrl && <img src={qrCodeUrl} alt="Your payment QR code" style={{ width: 110, height: 110, objectFit: "contain", background: "#fff", borderRadius: 10, border: "1px solid var(--line)", display: "block", marginBottom: 8 }} />}
          <input id="qrUpload" ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={onQrSelected} disabled={uploadingQr} />
          {uploadingQr && <p className="sub" style={{ marginTop: 6 }}>Uploading…</p>}
        </div>

        {error && <p style={{ color: "#B91C1C", fontSize: "0.88rem" }}>{error}</p>}
        {saved && <p style={{ color: "var(--sage-deep)", fontSize: "0.88rem" }}>Saved.</p>}

        <button type="submit" className="nv-btn sage" disabled={saving} style={{ justifySelf: "start" }}>
          {saving ? "Saving..." : "Save details"}
        </button>
      </form>
    </DashboardShell>
  );
}
