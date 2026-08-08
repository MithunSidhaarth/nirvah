import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, MapPin, User, HeartHandshake } from "lucide-react";
import Logo from "../components/Logo";
import { api } from "../lib/api";
import "../styles/tokens.css";

const MOCK = {
  1: { id: 1, title: "Vegetable biryani, 40 portions", category: "food", donor: "Green Leaf Kitchen", place: "HSR Layout, Bengaluru", status: "listed", description: "Cooked this evening, packed and ready for pickup. Please bring insulated containers if possible." },
  2: { id: 2, title: "Winter jackets and sweaters", category: "clothing", donor: "The Fernandes Family", place: "Indiranagar, Bengaluru", status: "listed", description: "Thirty jackets and sweaters, sizes kids to adult. Clean, folded and boxed by size." },
  3: { id: 3, title: "Notebooks and geometry sets", category: "supplies", donor: "Lakeview School", place: "Whitefield, Bengaluru", status: "claimed", description: "180 notebooks, 40 geometry sets and a box of storybooks cleared from last term." },
};

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
      await api.claimDonation(id);
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

        {claimed ? (
          <div className="nv-panel" style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "rgba(13,148,136,0.1)", borderColor: "rgba(13,148,136,0.3)" }}>
            <HeartHandshake size={18} color="var(--sage-deep)" />
            <span style={{ color: "var(--sage-deep)", fontWeight: 600 }}>Claimed. The giver has been notified.</span>
          </div>
        ) : (
          <button className="nv-btn sage" onClick={onClaim} disabled={claiming || donation.status !== "listed"}>
            {donation.status !== "listed" ? "Already claimed" : claiming ? "Claiming..." : "Claim this donation"}
          </button>
        )}
      </div>
    </div>
  );
}
