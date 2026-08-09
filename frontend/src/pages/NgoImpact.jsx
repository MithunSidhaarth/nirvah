import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  HeartHandshake, UtensilsCrossed, Shirt, BookOpen, PackageSearch,
  ShieldCheck, MapPin, Share2, ArrowRight, Clock3, Users2, CheckCircle2,
} from "lucide-react";
import { PageNav, PageFooter } from "../components/PageChrome";
import Reveal from "../components/Reveal";
import CountUp from "../components/motion/CountUp";
import { api } from "../lib/api";
import "../styles/tokens.css";

/* ---------------------------------------------------------
   Public impact page for a single NGO. Doubles as a trust
   signal for prospective donors and as something an NGO can
   link in their own funding pitches — so it's built to be
   read by someone who has never heard of Nirvah before.
--------------------------------------------------------- */

const MOCK_NGOS = {
  "asha-foundation": {
    name: "Asha Foundation",
    tagline: "Feeding and clothing families across Bengaluru's eastern belt since 2014.",
    verified: true,
    serviceArea: "Whitefield & Koramangala, Bengaluru",
    totals: { delivered: 1840, pickups: 312, donors: 64, avgPickupMin: 22 },
    categories: [
      { key: "food", label: "Food", icon: UtensilsCrossed, share: 58 },
      { key: "clothing", label: "Clothing", icon: Shirt, share: 27 },
      { key: "supplies", label: "Supplies", icon: BookOpen, share: 15 },
    ],
    recent: [
      { text: "40 portions of vegetable biryani delivered to a shelter in Koramangala", when: "Today" },
      { text: "30 winter jackets distributed to families in Whitefield", when: "2 days ago" },
      { text: "180 notebooks handed to Lakeview's after-school programme", when: "5 days ago" },
      { text: "15kg of festival sweets shared across two community kitchens", when: "1 week ago" },
    ],
  },
};

const DEFAULT_NGO = MOCK_NGOS["asha-foundation"];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.2, 0.7, 0.2, 1] } },
};
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };

export default function NgoImpact() {
  const { ngoId } = useParams();
  const [ngo, setNgo] = useState(MOCK_NGOS[ngoId] || DEFAULT_NGO);
  const [copied, setCopied] = useState(false);
  // "demo" (marketing slugs like /impact/asha-foundation, or a numeric id
  // that fails to load), "unverified" (real NGO, hasn't cleared Nirvah's
  // document review yet), "verified" (real NGO, real numbers).
  const [status, setStatus] = useState("demo");
  const [unverifiedName, setUnverifiedName] = useState("");

  useEffect(() => {
    let cancelled = false;
    setNgo(MOCK_NGOS[ngoId] || DEFAULT_NGO);
    setStatus("demo");

    // Real NGOs are keyed by numeric user id; marketing/demo pages use a
    // slug like "asha-foundation", so only hit the API for numeric ids.
    if (/^\d+$/.test(ngoId || "")) {
      (async () => {
        try {
          const res = await api.getNgoImpactSummary(ngoId);
          if (cancelled) return;

          if (!res.verified) {
            setStatus("unverified");
            setUnverifiedName(res.ngo?.org || res.ngo?.name || "This NGO");
            return;
          }

          setStatus("verified");
          setNgo({
            name: res.ngo?.org || res.ngo?.name || "This NGO",
            tagline: "Verified by the Nirvah team. Every number below comes from real, delivered donations.",
            verified: true,
            serviceArea: res.ngo?.city || "Service area not listed",
            categories: [],
            recent: (res.recent || []).map((r) => ({
              text: [r.itemsDelivered, r.location && `in ${r.location}`].filter(Boolean).join(" ") || "A delivery was logged",
              when: new Date(r.createdAt).toLocaleDateString(),
            })),
            statCards: [
              { value: res.stats?.delivered || 0, suffix: "", label: "donations delivered" },
              { value: res.stats?.donors || 0, suffix: "", label: "donors matched with" },
              { value: res.stats?.beneficiaries || 0, suffix: "", label: "people reached" },
            ],
          });
        } catch {
          if (!cancelled) setStatus("demo");
        }
      })();
    }

    return () => { cancelled = true; };
  }, [ngoId]);

  const statCards = ngo.statCards || [
    { value: ngo.totals?.delivered, suffix: "", label: "items delivered, all time" },
    { value: ngo.totals?.pickups, suffix: "", label: "completed pickups" },
    { value: ngo.totals?.donors, suffix: "", label: "donors matched with" },
    { value: ngo.totals?.avgPickupMin, suffix: " min", label: "avg. claim to pickup" },
  ];

  function share() {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: `${ngo.name} on Nirvah`, url }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  }

  if (status === "unverified") {
    return (
      <div className="nv-app" style={{ minHeight: "100vh" }}>
        <PageNav />
        <div style={{ maxWidth: 560, margin: "6rem auto", textAlign: "center", padding: "0 6vw" }}>
          <h1 className="font-display">{unverifiedName}</h1>
          <p className="sub" style={{ marginTop: "0.8rem" }}>
            This NGO has signed up on Nirvah but hasn't completed verification yet. Their impact page
            goes live once the Nirvah team has reviewed their documents.
          </p>
          <Link to="/browse" className="nv-btn spark" style={{ marginTop: "1.4rem" }}>See what's on Nirvah <ArrowRight size={15} /></Link>
        </div>
        <PageFooter />
      </div>
    );
  }

  return (
    <div className="nv-app" style={{ minHeight: "100vh" }}>
      <style>{`
        .ni-hero {
          position: relative; padding: 4.5rem 6vw 5rem; overflow: hidden; text-align: center;
          background: radial-gradient(120% 100% at 50% -10%, var(--char-2) 0%, var(--char) 60%, #06231A 100%);
          color: var(--parchment);
        }
        .ni-hero::after { content: ""; position: absolute; inset: 0; pointer-events: none; background-image: radial-gradient(50% 45% at 15% 10%, rgba(16,185,129,0.2), transparent 60%), radial-gradient(45% 45% at 90% 20%, rgba(52,211,153,0.14), transparent 65%); }
        .ni-hero-inner { position: relative; z-index: 1; max-width: 640px; margin: 0 auto; }
        .ni-badge { display: inline-flex; align-items: center; gap: 6px; font-family: 'IBM Plex Mono', monospace; font-size: 0.72rem; letter-spacing: 0.1em; text-transform: uppercase; color: #5EEAD4; padding: 6px 13px; border: 1px solid rgba(13,148,136,0.4); border-radius: 999px; margin-bottom: 1.2rem; }
        .ni-hero h1 { font-family: 'Fraunces', serif; font-size: clamp(2rem, 4vw, 2.9rem); margin: 0 0 0.8rem; }
        .ni-hero p.tagline { color: #BFE3D3; font-size: 1.02rem; line-height: 1.6; max-width: 520px; margin: 0 auto 1rem; }
        .ni-hero .area { display: inline-flex; align-items: center; gap: 6px; color: #9FD9C2; font-size: 0.88rem; }
        .ni-hero-ctas { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; margin-top: 1.8rem; }

        .ni-stats { max-width: 1000px; margin: -3rem auto 0; position: relative; z-index: 2; display: grid; grid-template-columns: repeat(4,1fr); gap: 1.1rem; padding: 0 6vw; }
        .ni-stat { background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius-md); box-shadow: var(--shadow-soft); padding: 1.4rem; text-align: center; }
        .ni-stat .num { font-family: 'Fraunces', serif; font-size: 1.7rem; color: var(--sage-deep); }
        .ni-stat .lbl { color: var(--ink-soft); font-size: 0.8rem; margin-top: 4px; }

        .ni-section { max-width: 1000px; margin: 0 auto; padding: 5rem 6vw 1rem; }
        .ni-section-head { max-width: 560px; margin: 0 auto 2.6rem; text-align: center; }
        .ni-kicker { font-family: 'IBM Plex Mono', monospace; font-size: 0.75rem; letter-spacing: 0.12em; text-transform: uppercase; color: var(--sage-deep); }
        .ni-section-head h2 { font-family: 'Fraunces', serif; font-size: clamp(1.5rem, 2.6vw, 2rem); margin: 0.5rem 0 0.6rem; }
        .ni-section-head p { color: var(--ink-soft); line-height: 1.6; }

        .ni-cat-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 1.2rem; }
        .ni-cat-card { background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius-md); padding: 1.5rem; box-shadow: var(--shadow-soft); }
        .ni-cat-card .icn { width: 42px; height: 42px; border-radius: 11px; display: grid; place-items: center; background: rgba(13,148,136,0.1); color: var(--sage-deep); margin-bottom: 0.9rem; }
        .ni-cat-card .share { font-family: 'Fraunces', serif; font-size: 1.5rem; color: var(--ink); }
        .ni-cat-bar { height: 6px; border-radius: 999px; background: var(--parchment-2); margin-top: 10px; overflow: hidden; }
        .ni-cat-bar span { display: block; height: 100%; background: linear-gradient(90deg, var(--sage), var(--sage-deep)); border-radius: 999px; }

        .ni-timeline { background: var(--char); color: var(--parchment); border-radius: var(--radius-lg); padding: 2.4rem; }
        .ni-timeline-row { display: flex; gap: 1rem; padding: 0.85rem 0; border-bottom: 1px solid rgba(255,255,255,0.08); align-items: flex-start; }
        .ni-timeline-row:last-child { border-bottom: none; }
        .ni-timeline-row .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--gold); margin-top: 6px; flex-shrink: 0; }
        .ni-timeline-text { font-size: 0.94rem; color: #DCF4E9; line-height: 1.5; flex: 1; }
        .ni-timeline-when { font-family: 'IBM Plex Mono', monospace; font-size: 0.74rem; color: #7FB6A0; white-space: nowrap; }

        .ni-cta { margin: 5rem 6vw 0; border-radius: var(--radius-lg); background: linear-gradient(120deg, #134E43, var(--char)); color: var(--parchment); padding: 3rem; text-align: center; }
        .ni-cta h2 { font-family: 'Fraunces', serif; font-size: clamp(1.4rem, 2.6vw, 1.9rem); margin: 0 0 0.7rem; }
        .ni-cta p { color: #BFE3D3; margin: 0 0 1.4rem; }

        @media (max-width: 900px) { .ni-stats, .ni-cat-grid { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 560px) { .ni-stats, .ni-cat-grid { grid-template-columns: 1fr; } }
      `}</style>

      <PageNav />

      <header className="ni-hero">
        <div className="ni-hero-inner">
          {ngo.verified && <span className="ni-badge"><ShieldCheck size={13} /> Verified NGO on Nirvah</span>}
          <h1>{ngo.name}</h1>
          <p className="tagline">{ngo.tagline}</p>
          <span className="area"><MapPin size={13} /> {ngo.serviceArea}</span>
          <div className="ni-hero-ctas">
            <button className="nv-btn sage" onClick={share} style={{ border: "none" }}>
              <Share2 size={15} /> {copied ? "Link copied" : "Share this page"}
            </button>
            <Link to="/browse" className="nv-btn ghost-dark">See what's available <ArrowRight size={15} /></Link>
          </div>
        </div>
      </header>

      <div className="ni-stats" style={statCards.length !== 4 ? { gridTemplateColumns: `repeat(${statCards.length}, 1fr)` } : undefined}>
        {statCards.map((s) => (
          <Reveal key={s.label} className="ni-stat">
            <div className="num"><CountUp value={s.value} suffix={s.suffix} /></div>
            <div className="lbl">{s.label}</div>
          </Reveal>
        ))}
      </div>

      {ngo.categories.length > 0 && (
        <section className="ni-section">
          <Reveal className="ni-section-head">
            <span className="ni-kicker">What's been delivered</span>
            <h2 className="font-display">A breakdown by category</h2>
            <p>Share of total items delivered by {ngo.name}, across every donation claimed on the network.</p>
          </Reveal>
          <motion.div className="ni-cat-grid" initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={stagger}>
            {ngo.categories.map((c) => (
              <motion.div className="ni-cat-card" key={c.key} variants={fadeUp}>
                <div className="icn"><c.icon size={20} /></div>
                <div className="share">{c.share}%</div>
                <div style={{ color: "var(--ink-soft)", fontSize: "0.88rem", marginTop: 2 }}>{c.label}</div>
                <div className="ni-cat-bar"><span style={{ width: `${c.share}%` }} /></div>
              </motion.div>
            ))}
          </motion.div>
        </section>
      )}

      <section className="ni-section">
        <Reveal className="ni-section-head">
          <span className="ni-kicker">Recently delivered</span>
          <h2 className="font-display">The last few circles closed</h2>
        </Reveal>
        <Reveal className="ni-timeline">
          {ngo.recent.length === 0 && (
            <div className="ni-timeline-text" style={{ padding: "0.6rem 0" }}>Nothing logged yet.</div>
          )}
          {ngo.recent.map((r, i) => (
            <div className="ni-timeline-row" key={`${r.text}-${i}`}>
              <span className="dot" />
              <span className="ni-timeline-text">{r.text}</span>
              <span className="ni-timeline-when">{r.when}</span>
            </div>
          ))}
        </Reveal>
      </section>

      <Reveal className="ni-cta">
        <h2 className="font-display">Have something {ngo.name} could use?</h2>
        <p>List it on Nirvah and organisations like this one can claim it in minutes.</p>
        <Link to="/signup?role=donor" className="nv-btn sage">Start giving <HeartHandshake size={15} /></Link>
      </Reveal>

      <div style={{ height: "5rem" }} />
      <PageFooter />
    </div>
  );
}
