import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft, MapPin, User, HeartHandshake, Gift, Handshake, Truck,
  PackageCheck, BadgeCheck, ClipboardCheck, FileCheck2, CircleCheck, Sparkles, HandHelping,
} from "lucide-react";
import Logo from "../components/Logo";
import DonationVault from "../components/DonationVault";
import DonationImpact from "../components/DonationImpact";
import { api } from "../lib/api";
import "../styles/tokens.css";

const MOCK = {
  1: {
    id: 1, title: "Vegetable biryani, 40 portions", category: "food", donor: "Green Leaf Kitchen",
    place: "HSR Layout, Bengaluru", status: "listed",
    description: "Cooked this evening, packed and ready for pickup. Please bring insulated containers if possible.",
    createdAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    donorId: null, ngoId: null, ngo: null,
    claimedAt: null, acceptedAt: null, pickupAt: null, deliveredAt: null,
    acknowledgedAt: null, impactRecordedAt: null, documentationCompleteAt: null, closedAt: null,
  },
  2: {
    id: 2, title: "Winter jackets and sweaters", category: "clothing", donor: "The Fernandes Family",
    place: "Indiranagar, Bengaluru", status: "listed",
    description: "Thirty jackets and sweaters, sizes kids to adult. Clean, folded and boxed by size.",
    createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    donorId: null, ngoId: null, ngo: null,
    claimedAt: null, acceptedAt: null, pickupAt: null, deliveredAt: null,
    acknowledgedAt: null, impactRecordedAt: null, documentationCompleteAt: null, closedAt: null,
  },
  3: {
    id: 3, title: "Notebooks and geometry sets", category: "supplies", donor: "Lakeview School",
    place: "Whitefield, Bengaluru", status: "delivered",
    description: "180 notebooks, 40 geometry sets and a box of storybooks cleared from last term.",
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    donorId: null, ngoId: null, ngo: "Asha Foundation",
    claimedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    acceptedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    pickupAt: new Date(Date.now() - 1.5 * 86400000).toISOString(),
    deliveredAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    acknowledgedAt: null, impactRecordedAt: null, documentationCompleteAt: null, closedAt: null,
  },
};

const LOGISTICS_LABEL = {
  donor_drop: "The giver will drop this off",
  ngo_pickup: "The NGO will pick this up",
};
const LOGISTICS_SET_BY_LABEL = { donor: "the giver", ngo: "the claiming NGO" };

function formatWhen(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" }) +
    " · " + d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

// The ten-stage lifecycle from the backend (`matched` is skipped — it's
// reserved for automated location-matching, which isn't built yet, so the
// flow goes straight from `listed` to `claimed` same as the API does).
const JOURNEY_STAGES = [
  { key: "listed", icon: Gift, timeKey: "createdAt", title: "You gave it", waitingTitle: "You gave it" },
  { key: "claimed", icon: HeartHandshake, timeKey: "claimedAt", title: "Someone claimed it", waitingTitle: "Waiting for someone to claim it" },
  { key: "accepted", icon: Handshake, timeKey: "acceptedAt", title: "Claim accepted", waitingTitle: "Waiting for the giver to accept" },
  { key: "pickup", icon: Truck, timeKey: "pickupAt", title: "Picked up", waitingTitle: "On its way to pickup" },
  { key: "delivered", icon: PackageCheck, timeKey: "deliveredAt", title: "It reached them", waitingTitle: "Out for delivery" },
  { key: "acknowledged", icon: BadgeCheck, timeKey: "acknowledgedAt", title: "Delivery acknowledged", waitingTitle: "Waiting for the giver to confirm" },
  { key: "impact_recorded", icon: ClipboardCheck, timeKey: "impactRecordedAt", title: "Impact logged", waitingTitle: "Waiting on an impact report" },
  { key: "documentation_complete", icon: FileCheck2, timeKey: "documentationCompleteAt", title: "Paperwork complete", waitingTitle: "Waiting on paperwork" },
  { key: "closed", icon: CircleCheck, timeKey: "closedAt", title: "Circle closed", waitingTitle: "Wrapping up" },
];

function JourneyTimeline({ donation }) {
  const currentIndex = JOURNEY_STAGES.findIndex((s) => s.key === donation.status);
  const steps = JOURNEY_STAGES.map((stage, i) => ({
    ...stage,
    done: currentIndex >= 0 && i <= currentIndex,
    when: formatWhen(donation[stage.timeKey]),
  }));

  return (
    <div className="nv-journey">
      {steps.map((s, i) => {
        const Icon = s.icon;
        return (
          <div className={`nv-journey-step ${s.done ? "done" : "pending"}`} key={s.key}>
            <div className="nv-journey-line">
              <span className="nv-journey-dot"><Icon size={15} /></span>
              {i < steps.length - 1 && <span className="nv-journey-connector" />}
            </div>
            <div className="nv-journey-body">
              <div className="nv-journey-title">{s.done ? s.title : s.waitingTitle}</div>
              {s.when && <div className="nv-journey-when">{s.when}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// One button at a time: whichever move is next in the lifecycle, for
// whichever party (giver or claiming NGO) is allowed to make it. Returns
// null when the viewer isn't the right person for the current stage, or
// there's nothing left to do (closed).
function nextAction({ donation, user }) {
  if (!user) return null;
  const isDonor = donation.donorId != null && user.id === donation.donorId;
  const isClaimingNgo = donation.ngoId != null && user.id === donation.ngoId;

  switch (donation.status) {
    case "listed":
      // When the donor already said how the handover should go, claiming
      // is a single button. When they left it open, DonationDetail renders
      // a two-way choice instead (see needsLogisticsChoice below) so the
      // NGO is the one who ends up stating it.
      if (user.role === "ngo" && !isDonor && donation.logisticsMode) {
        return { label: "I can put this to use", call: (id) => api.claimDonation(id) };
      }
      return null;
    case "claimed":
      if (isDonor) return { label: "Accept this claim", call: (id) => api.acceptDonation(id) };
      return null;
    case "accepted":
      if (isClaimingNgo) return { label: "Mark picked up", call: (id) => api.pickupDonation(id) };
      return null;
    case "pickup":
      if (isClaimingNgo) return { label: "Mark delivered", call: (id) => api.completeDonation(id) };
      return null;
    case "delivered":
      if (isDonor) return { label: "Confirm it reached them", call: (id) => api.acknowledgeDonation(id) };
      return null;
    case "documentation_complete":
      if (isDonor || isClaimingNgo) return { label: "Close this out", call: (id) => api.closeDonation(id) };
      return null;
    default:
      return null;
  }
}

export default function DonationDetail() {
  const { id } = useParams();
  const [donation, setDonation] = useState(MOCK[id] || Object.values(MOCK)[0]);
  const [user, setUser] = useState(null);
  const [acting, setActing] = useState(false);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    api.getDonation(id).then((data) => { if (data?.donation) setDonation(data.donation); }).catch(() => {});
    api.me().then((data) => { if (data?.user) setUser(data.user); }).catch(() => {});
  }, [id]);

  const action = nextAction({ donation, user });
  const isDonor = !!user && donation.donorId != null && user.id === donation.donorId;
  const isClaimingNgo = !!user && donation.ngoId != null && user.id === donation.ngoId;
  const canUploadDocuments = isDonor || isClaimingNgo;
  const canLogImpact = isClaimingNgo && ["delivered", "acknowledged"].includes(donation.status);

  // The donor left handover open at listing time, so the claiming NGO is
  // the one who states it, right as they claim.
  const needsLogisticsChoice =
    donation.status === "listed" && !!user && user.role === "ngo" && !isDonor && !donation.logisticsMode;

  const onAction = async () => {
    if (!action) return;
    setActing(true);
    setActionError("");
    try {
      const res = await action.call(id);
      if (res?.donation) setDonation(res.donation);
    } catch (err) {
      setActionError(err?.message || "That didn't go through. Please try again.");
    } finally {
      setActing(false);
    }
  };

  const onClaimWithLogistics = async (logisticsMode) => {
    setActing(true);
    setActionError("");
    try {
      const res = await api.claimDonation(id, { logisticsMode });
      if (res?.donation) setDonation(res.donation);
    } catch (err) {
      setActionError(err?.message || "That didn't go through. Please try again.");
    } finally {
      setActing(false);
    }
  };

  return (
    <div className="nv-app" style={{ minHeight: "100vh", background: "var(--parchment)" }}>
      <style>{`
        .nv-detail-nav { display: flex; align-items: center; justify-content: space-between; padding: 1.4rem 6vw; }
        .nv-detail-wrap { max-width: 760px; margin: 0 auto; padding: 1rem 6vw 4rem; }
        .nv-detail-media { height: 220px; border-radius: 20px; background: linear-gradient(135deg, #D1FAE5, #A7F3D0); display: grid; place-items: center; color: var(--spark-deep); margin-bottom: 1.6rem; overflow: hidden; }
        .nv-detail-media img { width: 100%; height: 100%; object-fit: cover; }
        .nv-detail-wrap h1 { font-family: 'Fraunces', serif; font-size: clamp(1.7rem, 3vw, 2.3rem); margin: 0.6rem 0; }
        .nv-detail-meta { display: flex; gap: 1.4rem; flex-wrap: wrap; margin-bottom: 1.6rem; color: var(--ink-soft); font-size: 0.92rem; }
        .nv-detail-meta span { display: flex; align-items: center; gap: 6px; }
        .nv-detail-desc { line-height: 1.7; color: var(--ink); margin-bottom: 2rem; }
        .nv-detail-error { color: #B91C1C; font-size: 0.86rem; margin-top: 0.6rem; }

        /* ---------- "where did it go?" journey ---------- */
        .nv-journey-panel { border-top: 1px solid var(--line); margin-top: 2.2rem; padding-top: 2.2rem; }
        .nv-journey-head { display: flex; align-items: center; gap: 9px; margin-bottom: 0.4rem; }
        .nv-journey-head h2 { font-family: 'Fraunces', serif; font-size: 1.3rem; font-weight: 600; margin: 0; }
        .nv-journey-sub { color: var(--ink-soft); font-size: 0.9rem; margin: 0 0 1.6rem; }
        .nv-journey { display: flex; flex-direction: column; }
        .nv-journey-step { display: flex; gap: 1rem; }
        .nv-journey-line { display: flex; flex-direction: column; align-items: center; }
        .nv-journey-dot { width: 34px; height: 34px; border-radius: 50%; display: grid; place-items: center; flex-shrink: 0; background: var(--parchment-2); color: var(--ink-soft); border: 1px solid var(--line); }
        .nv-journey-step.done .nv-journey-dot { background: linear-gradient(145deg, var(--gold), var(--spark-deep)); color: #fff; border-color: transparent; }
        .nv-journey-connector { width: 2px; flex: 1; min-height: 30px; background: var(--line); }
        .nv-journey-step.done .nv-journey-connector { background: linear-gradient(180deg, var(--spark), var(--line)); }
        .nv-journey-body { padding-bottom: 1.3rem; }
        .nv-journey-title { font-weight: 600; font-size: 0.95rem; color: var(--ink); }
        .nv-journey-step.pending .nv-journey-title { color: var(--ink-soft); font-weight: 500; }
        .nv-journey-when { font-family: 'IBM Plex Mono', monospace; font-size: 0.74rem; color: var(--spark-deep); margin-top: 4px; }

        /* ---------- vault (section 9) ---------- */
        .nv-vault-empty { color: var(--ink-soft); font-size: 0.9rem; }
        .nv-vault-list { list-style: none; margin: 0 0 1.2rem; padding: 0; display: flex; flex-direction: column; gap: 0.6rem; }
        .nv-vault-item { display: flex; align-items: center; gap: 0.8rem; flex-wrap: wrap; padding: 0.7rem 0.9rem; border: 1px solid var(--line); border-radius: 12px; background: var(--parchment-2); }
        .nv-vault-item-name { display: flex; align-items: center; gap: 6px; color: var(--ink); font-weight: 600; font-size: 0.88rem; text-decoration: none; }
        .nv-vault-item-name:hover { color: var(--spark-deep); }
        .nv-vault-item-type { font-size: 0.78rem; color: var(--ink-soft); margin-left: auto; }
        .nv-doc-status { display: inline-flex; align-items: center; gap: 4px; font-size: 0.76rem; font-weight: 600; padding: 3px 9px; border-radius: 999px; }
        .nv-doc-status.approved { background: rgba(13,148,136,0.14); color: var(--sage-deep); }
        .nv-doc-status.rejected { background: rgba(220,38,38,0.1); color: #B91C1C; }
        .nv-doc-status.pending { background: rgba(217,119,6,0.12); color: #B45309; }
        .nv-vault-upload { display: flex; flex-wrap: wrap; align-items: center; gap: 0.7rem; padding-top: 0.4rem; }
        .nv-vault-select { border: 1px solid var(--line); border-radius: 10px; padding: 9px 12px; font-size: 0.85rem; font-family: inherit; background: var(--surface); color: var(--ink); }
        .nv-vault-filepick { display: flex; align-items: center; gap: 8px; border: 1px dashed var(--line); border-radius: 10px; padding: 9px 14px; font-size: 0.84rem; color: var(--ink-soft); cursor: pointer; flex: 1; min-width: 220px; }
        .nv-vault-filepick:hover { border-color: var(--spark-deep); color: var(--spark-deep); }

        /* ---------- impact (section 12) ---------- */
        .nv-impact-list { display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1rem; }
        .nv-impact-record { border: 1px solid var(--line); border-radius: 14px; padding: 1rem 1.1rem; background: var(--parchment-2); }
        .nv-impact-record-meta { display: flex; gap: 1.2rem; flex-wrap: wrap; font-size: 0.85rem; color: var(--ink); margin-bottom: 0.5rem; }
        .nv-impact-record-meta span { display: flex; align-items: center; gap: 5px; }
        .nv-impact-record-notes { font-size: 0.88rem; color: var(--ink-soft); line-height: 1.6; margin: 0 0 0.6rem; }
        .nv-impact-photos { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 0.5rem; }
        .nv-impact-photos img { width: 84px; height: 84px; object-fit: cover; border-radius: 10px; border: 1px solid var(--line); }
        .nv-impact-record-when { font-family: 'IBM Plex Mono', monospace; font-size: 0.72rem; color: var(--spark-deep); }
        .nv-impact-form { border-top: 1px solid var(--line); margin-top: 1rem; padding-top: 1rem; }
        .nv-field { margin-bottom: 1.1rem; }
        .nv-field label { display: block; font-size: 0.84rem; font-weight: 600; margin-bottom: 6px; color: var(--ink); }
        .nv-field input, .nv-field textarea {
          width: 100%; border: 1px solid var(--line); border-radius: 10px; padding: 10px 12px;
          font-size: 0.9rem; font-family: inherit; background: var(--surface); color: var(--ink); box-sizing: border-box;
        }
        .nv-field input:focus, .nv-field textarea:focus { outline: none; border-color: var(--spark-deep); }
      `}</style>

      <nav className="nv-detail-nav">
        <Link to="/" className="nv-brand"><Logo size={28} /> Nirvah</Link>
        <Link to="/browse" className="nv-btn ghost-light sm"><ArrowLeft size={15} /> Back to browse</Link>
      </nav>

      <div className="nv-detail-wrap">
        <div className="nv-detail-media">
          {donation.photoUrl ? <img src={donation.photoUrl} alt={donation.title} /> : <HeartHandshake size={44} strokeWidth={1.4} />}
        </div>
        <span className="nv-pill spark">{donation.status}</span>
        <h1>{donation.title}</h1>
        <div className="nv-detail-meta">
          <span><User size={14} /> {donation.donor}</span>
          <span><MapPin size={14} /> {donation.place}{donation.distanceKm != null ? ` · ${donation.distanceKm} km away` : ""}</span>
          {donation.logisticsMode && (
            <span>
              {donation.logisticsMode === "ngo_pickup" ? <Truck size={14} /> : <HandHelping size={14} />}
              {LOGISTICS_LABEL[donation.logisticsMode]}
              {donation.logisticsSetBy ? ` (${LOGISTICS_SET_BY_LABEL[donation.logisticsSetBy]} said so)` : ""}
            </span>
          )}
        </div>
        <p className="nv-detail-desc">{donation.description}</p>
        {donation.logisticsNote && (
          <p className="nv-detail-desc" style={{ marginTop: "-1.4rem", fontStyle: "italic", color: "var(--ink-soft)" }}>
            "{donation.logisticsNote}"
          </p>
        )}

        {donation.status === "closed" ? (
          <div className="nv-panel" style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "rgba(13,148,136,0.1)", borderColor: "rgba(13,148,136,0.3)" }}>
            <CircleCheck size={18} color="var(--sage-deep)" />
            <span style={{ color: "var(--sage-deep)", fontWeight: 600 }}>This circle is closed.</span>
          </div>
        ) : needsLogisticsChoice ? (
          <div>
            <p className="sub" style={{ margin: "0 0 10px" }}>The giver didn't say how they'd like this handed over — you get to call it.</p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button className="nv-btn sage" disabled={acting} onClick={() => onClaimWithLogistics("ngo_pickup")}>
                <Truck size={15} /> {acting ? "Working..." : "We'll pick it up"}
              </button>
              <button className="nv-btn sage" disabled={acting} onClick={() => onClaimWithLogistics("donor_drop")}>
                <HandHelping size={15} /> {acting ? "Working..." : "Ask them to drop it off"}
              </button>
            </div>
            {actionError && <div className="nv-detail-error">{actionError}</div>}
          </div>
        ) : action ? (
          <div>
            <button className="nv-btn sage" onClick={onAction} disabled={acting}>
              {acting ? "Working..." : action.label}
            </button>
            {actionError && <div className="nv-detail-error">{actionError}</div>}
          </div>
        ) : (
          <div className="nv-panel" style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "rgba(13,148,136,0.1)", borderColor: "rgba(13,148,136,0.3)" }}>
            <HeartHandshake size={18} color="var(--sage-deep)" />
            <span style={{ color: "var(--sage-deep)", fontWeight: 600 }}>
              {donation.status === "listed" ? "Looking for the right NGO." : "In progress — nothing for you to do here right now."}
            </span>
          </div>
        )}

        <div className="nv-journey-panel">
          <div className="nv-journey-head">
            <Sparkles size={17} color="var(--spark-deep)" />
            <h2>Where did it go?</h2>
          </div>
          <p className="nv-journey-sub">Every donation on Nirvah keeps its own record, from the moment it's given to the moment it's used.</p>
          <JourneyTimeline donation={donation} />
        </div>

        <div className="nv-journey-panel">
          <DonationVault donationId={id} canUpload={canUploadDocuments} />
        </div>

        <div className="nv-journey-panel">
          <DonationImpact
            donationId={id}
            canLog={canLogImpact}
            onLogged={(impact) => setDonation((d) => ({ ...d, impactRecordedAt: d.impactRecordedAt || impact.createdAt, status: d.status === "acknowledged" || d.status === "delivered" ? "impact_recorded" : d.status }))}
          />
        </div>
      </div>
    </div>
  );
}
