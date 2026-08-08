import React, { useEffect, useState } from "react";
import { FileText, UploadCloud, Paperclip, CheckCircle2, XCircle, Clock } from "lucide-react";
import { api } from "../lib/api";

const DOC_TYPES = [
  { value: "donation_receipt", label: "Donation receipt" },
  { value: "payment_record", label: "Payment record" },
  { value: "ngo_acknowledgement", label: "NGO acknowledgement" },
  { value: "delivery_proof", label: "Delivery proof" },
  { value: "impact_proof", label: "Impact proof" },
  { value: "tax_document", label: "Tax document" },
  { value: "csr_evidence", label: "CSR evidence" },
  { value: "other", label: "Other" },
];

function StatusBadge({ status }) {
  if (status === "approved") {
    return <span className="nv-doc-status approved"><CheckCircle2 size={13} /> Approved</span>;
  }
  if (status === "rejected") {
    return <span className="nv-doc-status rejected"><XCircle size={13} /> Rejected</span>;
  }
  return <span className="nv-doc-status pending"><Clock size={13} /> Pending review</span>;
}

// Documents attached to one donation — receipts, delivery proof, tax
// documents, CSR evidence, etc. Visible to the giver and the claiming NGO;
// either party can add to it. This is deliberately scoped to a single
// donation's paper trail — NGO-level verification documents (registration
// certificate, 12AB, 80G) are a separate list, see NgoDocuments.jsx.
export default function DonationVault({ donationId, canUpload }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [type, setType] = useState(DOC_TYPES[0].value);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .listDonationDocuments(donationId)
      .then((data) => { if (!cancelled) setDocuments(data?.documents || []); })
      .catch((err) => { if (!cancelled) setLoadError(err?.message || "Couldn't load documents."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [donationId]);

  const onUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setUploadError("Choose a file first.");
      return;
    }
    setUploading(true);
    setUploadError("");
    try {
      const res = await api.uploadDonationDocument(donationId, { type, file });
      if (res?.document) setDocuments((list) => [res.document, ...list]);
      setFile(null);
      e.target.reset?.();
    } catch (err) {
      setUploadError(err?.message || "That upload didn't go through. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="nv-vault-panel">
      <div className="nv-journey-head">
        <FileText size={17} color="var(--spark-deep)" />
        <h2>The paper trail</h2>
      </div>
      <p className="nv-journey-sub">
        Receipts, delivery proof and anything else worth keeping on record for this donation.
      </p>

      {loading ? (
        <p className="nv-vault-empty">Loading documents…</p>
      ) : loadError ? (
        <p className="nv-vault-empty">{loadError}</p>
      ) : documents.length === 0 ? (
        <p className="nv-vault-empty">Nothing uploaded yet.</p>
      ) : (
        <ul className="nv-vault-list">
          {documents.map((doc) => (
            <li key={doc.id} className="nv-vault-item">
              <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="nv-vault-item-name">
                <Paperclip size={14} /> {doc.fileName || "document"}
              </a>
              <span className="nv-vault-item-type">{DOC_TYPES.find((t) => t.value === doc.type)?.label || doc.type}</span>
              <StatusBadge status={doc.status} />
            </li>
          ))}
        </ul>
      )}

      {canUpload && (
        <form className="nv-vault-upload" onSubmit={onUpload}>
          <select className="nv-vault-select" value={type} onChange={(e) => setType(e.target.value)}>
            {DOC_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <label className="nv-vault-filepick">
            <UploadCloud size={15} />
            {file ? file.name : "Choose file (PDF, JPG, PNG or WEBP, up to 8MB)"}
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              hidden
            />
          </label>
          <button className="nv-btn sage sm" type="submit" disabled={uploading}>
            {uploading ? "Uploading…" : "Add to vault"}
          </button>
          {uploadError && <div className="nv-detail-error">{uploadError}</div>}
        </form>
      )}
    </div>
  );
}
