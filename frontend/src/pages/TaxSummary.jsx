import React, { useEffect, useState } from "react";
import { Receipt, ShieldCheck, FileCheck2, Paperclip } from "lucide-react";
import DashboardShell from "../components/DashboardShell";
import { api } from "../lib/api";

function formatWhen(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export default function TaxSummary() {
  const [user, setUser] = useState(null);
  const [donations, setDonations] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await api.me();
        if (cancelled) return;
        setUser(me?.user || null);
        const data = await api.getTaxSummary();
        if (cancelled) return;
        setDonations(data?.donations || []);
        setSummary(data?.summary || null);
      } catch (err) {
        if (!cancelled) setError(err?.message || "Couldn't load your tax summary.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <DashboardShell role="donor" user={user}>
      <div className="nv-topbar">
        <div>
          <h1>Tax summary</h1>
          <p className="sub">Every donation that reached an NGO, and the paperwork attached to it — everything your CA will ask for.</p>
        </div>
      </div>

      {loading ? (
        <div className="nv-panel"><p className="nv-vault-empty">Loading…</p></div>
      ) : error ? (
        <div className="nv-panel"><p className="nv-vault-empty">{error}</p></div>
      ) : (
        <>
          <div className="nv-ring-grid">
            <div className="nv-ring-card">
              <Receipt size={22} color="var(--spark-deep)" />
              <div>
                <div className="nv-ring-num">{summary?.totalDonations ?? 0}</div>
                <div className="nv-ring-label">Delivered donations</div>
              </div>
            </div>
            <div className="nv-ring-card">
              <ShieldCheck size={22} color="var(--sage-deep)" />
              <div>
                <div className="nv-ring-num">{summary?.to80gVerifiedNgos ?? 0}</div>
                <div className="nv-ring-label">To 80G-verified NGOs</div>
              </div>
            </div>
            <div className="nv-ring-card">
              <FileCheck2 size={22} color="var(--gold)" />
              <div>
                <div className="nv-ring-num">{summary?.withTaxDocuments ?? 0}</div>
                <div className="nv-ring-label">With tax documents attached</div>
              </div>
            </div>
          </div>

          <div className="nv-panel">
            <h2>Donations</h2>
            {donations.length === 0 ? (
              <div className="nv-empty">
                <div className="ic"><Receipt size={22} /></div>
                <h3>Nothing delivered yet</h3>
                <p>Once a donation reaches an NGO, it'll show up here.</p>
              </div>
            ) : (
              <ul className="nv-vault-list">
                {donations.map((d) => (
                  <li key={d.donationId} className="nv-vault-item" style={{ flexDirection: "column", alignItems: "stretch" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                      <span className="nv-vault-item-name" style={{ cursor: "default" }}>{d.title}</span>
                      <span className="nv-vault-item-type">{formatWhen(d.deliveredAt || d.closedAt)}</span>
                    </div>
                    <div style={{ display: "flex", gap: "0.8rem", flexWrap: "wrap", marginTop: 6, fontSize: "0.82rem", color: "var(--ink-soft)" }}>
                      <span>{d.ngoName || "NGO"}</span>
                      {d.ngoVerified && d.ngo80gNumber ? (
                        <span className="nv-doc-status approved"><ShieldCheck size={12} /> 80G on file</span>
                      ) : (
                        <span className="nv-doc-status pending">80G not confirmed</span>
                      )}
                    </div>
                    {d.taxDocuments.length > 0 && (
                      <div style={{ display: "flex", gap: "0.7rem", flexWrap: "wrap", marginTop: 8 }}>
                        {d.taxDocuments.map((doc) => (
                          <a key={doc.id} href={doc.fileUrl} target="_blank" rel="noreferrer" className="nv-vault-item-name">
                            <Paperclip size={13} /> {doc.fileName || "tax document"}
                          </a>
                        ))}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </DashboardShell>
  );
}
