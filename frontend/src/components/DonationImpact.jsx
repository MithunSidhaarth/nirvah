import React, { useEffect, useState } from "react";
import { Sparkles, Users, MapPin, Package, ImagePlus } from "lucide-react";
import { api } from "../lib/api";

function formatWhen(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

// What actually happened once a donation was delivered: how many people it
// reached, where, and photo proof. Anyone can read these back; only the
// claiming NGO can log one, and only once the donation has reached
// `delivered` or `acknowledged`.
export default function DonationImpact({ donationId, canLog, onLogged }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const [beneficiaryCount, setBeneficiaryCount] = useState("");
  const [location, setLocation] = useState("");
  const [itemsDelivered, setItemsDelivered] = useState("");
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .getDonationImpact(donationId)
      .then((data) => { if (!cancelled) setRecords(data?.impact || []); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [donationId]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await api.logDonationImpact(donationId, {
        beneficiaryCount, location, itemsDelivered, notes, photos,
      });
      if (res?.impact) {
        setRecords((list) => [res.impact, ...list]);
        setBeneficiaryCount(""); setLocation(""); setItemsDelivered(""); setNotes(""); setPhotos([]);
        setShowForm(false);
        onLogged?.(res.impact);
      }
    } catch (err) {
      setSubmitError(err?.message || "That didn't save. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="nv-impact-panel">
      <div className="nv-journey-head">
        <Sparkles size={17} color="var(--spark-deep)" />
        <h2>What it made possible</h2>
      </div>
      <p className="nv-journey-sub">The claiming NGO's report on where this donation ended up and who it reached.</p>

      {loading ? (
        <p className="nv-vault-empty">Loading impact…</p>
      ) : records.length === 0 ? (
        <p className="nv-vault-empty">No impact report yet.</p>
      ) : (
        <div className="nv-impact-list">
          {records.map((r) => (
            <div key={r.id} className="nv-impact-record">
              <div className="nv-impact-record-meta">
                {r.beneficiaryCount != null && <span><Users size={13} /> {r.beneficiaryCount} people reached</span>}
                {r.location && <span><MapPin size={13} /> {r.location}</span>}
                {r.itemsDelivered && <span><Package size={13} /> {r.itemsDelivered}</span>}
              </div>
              {r.notes && <p className="nv-impact-record-notes">{r.notes}</p>}
              {Array.isArray(r.photos) && r.photos.length > 0 && (
                <div className="nv-impact-photos">
                  {r.photos.map((url) => (
                    <a key={url} href={url} target="_blank" rel="noreferrer">
                      <img src={url} alt="Impact proof" />
                    </a>
                  ))}
                </div>
              )}
              <div className="nv-impact-record-when">{formatWhen(r.createdAt)}</div>
            </div>
          ))}
        </div>
      )}

      {canLog && !showForm && (
        <button className="nv-btn sage sm" style={{ marginTop: "1rem" }} onClick={() => setShowForm(true)}>
          Log impact for this donation
        </button>
      )}

      {canLog && showForm && (
        <form className="nv-impact-form" onSubmit={onSubmit}>
          <div className="nv-form-grid">
            <div className="nv-field">
              <label>People reached</label>
              <input
                type="number" min="0" placeholder="e.g. 40"
                value={beneficiaryCount} onChange={(e) => setBeneficiaryCount(e.target.value)}
              />
            </div>
            <div className="nv-field">
              <label>Location</label>
              <input
                type="text" placeholder="e.g. Wadala shelter home"
                value={location} onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <div className="nv-field full">
              <label>Items delivered</label>
              <input
                type="text" placeholder="e.g. 40 meals, 12 blankets"
                value={itemsDelivered} onChange={(e) => setItemsDelivered(e.target.value)}
              />
            </div>
            <div className="nv-field full">
              <label>Notes</label>
              <textarea
                rows={3} placeholder="Anything worth telling the giver"
                value={notes} onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            <div className="nv-field full">
              <label><ImagePlus size={14} style={{ verticalAlign: "-2px" }} /> Photos (up to 5)</label>
              <input
                type="file" accept="image/jpeg,image/png,image/webp" multiple
                onChange={(e) => setPhotos(Array.from(e.target.files || []).slice(0, 5))}
              />
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.8rem", alignItems: "center" }}>
            <button className="nv-btn sage sm" type="submit" disabled={submitting}>
              {submitting ? "Saving…" : "Save impact report"}
            </button>
            <button className="nv-btn ghost-light sm" type="button" onClick={() => setShowForm(false)}>
              Cancel
            </button>
          </div>
          {submitError && <div className="nv-detail-error">{submitError}</div>}
        </form>
      )}
    </div>
  );
}
