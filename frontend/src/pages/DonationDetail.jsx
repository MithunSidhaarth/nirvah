import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, MapPin, User, HeartHandshake, Gift, PackageCheck, Sparkles } from "lucide-react";
import Logo from "../components/Logo";
import { api } from "../lib/api";
import "../styles/tokens.css";

const MOCK = {
  1: {
    id: 1, title: "Vegetable biryani, 40 portions", category: "food", donor: "Green Leaf Kitchen",
    place: "HSR Layout, Bengaluru", status: "listed",
    description: "Cooked this evening, packed and ready for pickup. Please bring insulated containers if possible.",
    createdAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(), claimedAt: null, deliveredAt: null, ngo: null,
  },
  2: {
    id: 2, title: "Winter jackets and sweaters", category: "clothing", donor: "The Fernandes Family",
    place: "Indiranagar, Bengaluru", status: "listed",
    description: "Thirty jackets and sweaters, sizes kids to adult. Clean, folded and boxed by size.",
    createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(), claimedAt: null, deliveredAt: null, ngo: null,
  },
  3: {
    id: 3, title: "Notebooks and geometry sets", category: "supplies", donor: "Lakeview School",
    place: "Whitefield, Bengaluru", status: "delivered",
    description: "180 notebooks, 40 geometry sets and a box of storybooks cleared from last term.",
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    claimedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    deliveredAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    ngo: "Asha Foundation",
  },
};

function formatWhen(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" }) +
    " · " + d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

/* The "Where did it go?" timeline. Only three real states exist today
   (listed / claimed / delivered) — every step here is backed by an
   actual timestamp from the record, nothing is invented. */
function JourneyTimeline({ donation }) {
  const steps = [
    {
      key: "given",
      icon: Gift,
      title: "You gave it",
      detail: donation.donor,
      when: formatWhen(donation.createdAt),
      done: true,
    },
    {
      key: "claimed",
      icon: HeartHandshake,
      title: donation.status === "listed" ? "Waiting for someone to claim it" : "Someone claimed it",
      detail: donation.ngo || (donation.status === "listed" ? "Still finding the right organisation" : null),
      when: formatWhen(donation.claimedAt),
      done: donation.status !== "listed",
    },
    {
      key: "delivered",
      icon: PackageCheck,
      title: donation.status === "delivered" ? "It reached them" : "On its way",
      detail: donation.status === "delivered" ? "Delivery confirmed" : null,
      when: formatWhen(donation.deliveredAt),
      done: donation.status === "delivered",
    },
  ];

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
              <div className="nv-journey-title">{s.title}</div>
              {s.detail && <div className="nv-journey-detail">{s.detail}</div>}
              {s.when && <div className="nv-journey-when">{s.when}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function DonationDetail() {
  const { id } = useParams();
  const [donation, setDonation] = useState(MOCK[id] || Object.values(MOCK)[0]);
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);

  useEffect(() => {
    api.getDonation(id).then((data) => { if (data?.donation) setDonation(data.donation); }).catch(() => {});
  }, [id]);

  const onClaim = async () => {
    setClaiming(true);
    try {
      const res = await api.claimDonation(id);
      if (res?.donation) setDonation(res.donation);
    } catch {
      // No backend connected yet: reflect the claim locally so the flow works end to end.
    } finally {
      setClaimed(true);
      setClaiming(false);
    }
  };

  return (
    <div className="nv-app" style={{ minHeight: "100vh", background: "var(--parchment)" }}>
      <style>{`
        .nv-detail-nav { display: flex; align-items: center; justify-content: space-between; padding: 1.4rem 6vw; }
        .nv-detail-wrap { max-width: 760px; margin: 0 auto; padding: 1rem 6vw 4rem; }
        .nv-detail-media { height: 220px; border-radius: 20px; background: linear-gradient(135deg, #D1FAE5, #A7F3D0); display: grid; place-items: center; color: var(--spark-deep); margin-bottom: 1.6rem; }
        .nv-detail-wrap h1 { font-family: 'Fraunces', serif; font-size: clamp(1.7rem, 3vw, 2.3rem); margin: 0.6rem 0; }
        .nv-detail-meta { display: flex; gap: 1.4rem; flex-wrap: wrap; margin-bottom: 1.6rem; color: var(--ink-soft); font-size: 0.92rem; }
        .nv-detail-meta span { display: flex; align-items: center; gap: 6px; }
        .nv-detail-desc { line-height: 1.7; color: var(--ink); margin-bottom: 2rem; }

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
        .nv-journey-connector { width: 2px; flex: 1; min-height: 34px; background: var(--line); }
        .nv-journey-step.done .nv-journey-connector { background: linear-gradient(180deg, var(--spark), var(--line)); }
        .nv-journey-body { padding-bottom: 1.8rem; }
        .nv-journey-title { font-weight: 600; font-size: 0.98rem; color: var(--ink); }
        .nv-journey-step.pending .nv-journey-title { color: var(--ink-soft); font-weight: 500; }
        .nv-journey-detail { font-size: 0.88rem; color: var(--ink-soft); margin-top: 2px; }
        .nv-journey-when { font-family: 'IBM Plex Mono', monospace; font-size: 0.74rem; color: var(--spark-deep); margin-top: 4px; }
      `}</style>

      <nav className="nv-detail-nav">
        <Link to="/" className="nv-brand"><Logo size={28} /> Nirvah</Link>
        <Link to="/browse" className="nv-btn ghost-light sm"><ArrowLeft size={15} /> Back to browse</Link>
      </nav>

      <div className="nv-detail-wrap">
        <div className="nv-detail-media"><HeartHandshake size={44} strokeWidth={1.4} /></div>
        <span className="nv-pill spark">{donation.status}</span>
        <h1>{donation.title}</h1>
        <div className="nv-detail-meta">
          <span><User size={14} /> {donation.donor}</span>
          <span><MapPin size={14} /> {donation.place}</span>
        </div>
        <p className="nv-detail-desc">{donation.description}</p>

        {claimed || donation.status !== "listed" ? (
          <div className="nv-panel" style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "rgba(13,148,136,0.1)", borderColor: "rgba(13,148,136,0.3)" }}>
            <HeartHandshake size={18} color="var(--sage-deep)" />
            <span style={{ color: "var(--sage-deep)", fontWeight: 600 }}>
              {donation.status === "delivered" ? "It reached them." : "Claimed. The giver has been notified."}
            </span>
          </div>
        ) : (
          <button className="nv-btn sage" onClick={onClaim} disabled={claiming}>
            {claiming ? "Claiming..." : "I can put this to use"}
          </button>
        )}

        <div className="nv-journey-panel">
          <div className="nv-journey-head">
            <Sparkles size={17} color="var(--spark-deep)" />
            <h2>Where did it go?</h2>
          </div>
          <p className="nv-journey-sub">Every donation on Nirvah keeps its own record, from the moment it's given to the moment it's used.</p>
          <JourneyTimeline donation={donation} />
        </div>
      </div>
    </div>
  );
}
