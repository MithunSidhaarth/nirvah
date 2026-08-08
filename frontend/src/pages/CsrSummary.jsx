import React, { useEffect, useState } from "react";
import { Building2, Users, Paperclip, ShieldAlert } from "lucide-react";
import DashboardShell from "../components/DashboardShell";
import { api } from "../lib/api";

function formatWhen(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export default function CsrSummary() {
  const [user, setUser] = useState(null);
  const [donations, setDonations] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notEligible, setNotEligible] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await api.me();
        if (cancelled) return;
        setUser(me?.user || null);
        const data = await api.getCsrSummary();
        if (cancelled) return;
        setDonations(data?.donations || []);
        setSummary(data?.summary || null);
      } catch (err) {
        if (cancelled) return;
        if (err?.message?.toLowerCase().includes("csr reporting")) {
          setNotEligible(true);
        } else {
          setError(err?.message || "Couldn't load your CSR summary.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <DashboardShell role="ngo" user={user}>
      <div className="nv-topbar">
        <div>
          <h1>CSR summary</h1>
          <p className="sub">Donations you've received, grouped for the report you hand back to corporate donors.</p>
        </div>
      </div>

      {loading ? (
        <div className="nv-panel"><p className="nv-vault-empty">Loading…</p></div>
      ) : notEligible ? (
        <div className="nv-panel">
          <div className="nv-empty">
            <div className="ic"><ShieldAlert size={22} /></div>
            <h3>Not eligible yet</h3>
            <p>CSR reporting unlocks once your NGO is verified with an 80G number on file. Submit or update your details from your profile.</p>
          </div>
        </div>
      ) : error ? (
        <div className="nv-panel"><p className="nv-vault-empty">{error}</p></div>
      ) : (
        <>
          <div className="nv-ring-grid">
            <div className="nv-ring-card">
              <Building2 size={22} color="var(--spark-deep)" />
              <div>
                <div className="nv-ring-num">{summary?.totalDonations ?? 0}</div>
                <div className="nv-ring-label">Delivered donations</div>
              </div>
            </div>
            <div className="nv-ring-card">
              <Users size={22} color="var(--sage-deep)" />
              <div>
                <div className="nv-ring-num">{summary?.uniqueDonors ?? 0}</div>
                <div className="nv-ring-label">Unique donors</div>
              </div>
            </div>
            <div className="nv-ring-card">
              <Paperclip size={22} color="var(--gold)" />
              <div>
                <div className="nv-ring-num">{summary?.withCsrEvidence ?? 0}</div>
                <div className="nv-ring-label">With CSR evidence attached</div>
              </div>
            </div>
          </div>

          {summary?.byCategory && Object.keys(summary.byCategory).length > 0 && (
            <div className="nv-panel" style={{ marginBottom: "1.6rem" }}>
              <h2>By category</h2>
              <div style={{ display: "flex", gap: "0.8rem", flexWrap: "wrap" }}>
                {Object.entries(summary.byCategory).map(([cat, count]) => (
                  <span key={cat} className="nv-pill sage">{cat}: {count}</span>
                ))}
              </div>
            </div>
          )}

          <div className="nv-panel">
            <h2>Donations</h2>
            {donations.length === 0 ? (
              <div className="nv-empty">
                <div className="ic"><Building2 size={22} /></div>
                <h3>Nothing delivered yet</h3>
                <p>Once you've claimed and received a donation, it'll show up here.</p>
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
                      <span>{d.donorName || "Anonymous donor"}</span>
                      <span className="nv-pill sage" style={{ padding: "2px 9px", fontSize: "0.7rem" }}>{d.category}</span>
                      {d.hasImpactRecord && <span className="nv-doc-status approved">Impact logged</span>}
                    </div>
                    {d.csrEvidence.length > 0 && (
                      <div style={{ display: "flex", gap: "0.7rem", flexWrap: "wrap", marginTop: 8 }}>
                        {d.csrEvidence.map((doc) => (
                          <a key={doc.id} href={doc.fileUrl} target="_blank" rel="noreferrer" className="nv-vault-item-name">
                            <Paperclip size={13} /> {doc.fileName || "CSR evidence"}
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
