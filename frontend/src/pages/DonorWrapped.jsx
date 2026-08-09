import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Sparkles, PackagePlus, Users2, Zap, UtensilsCrossed, Share2,
  ArrowRight, HeartHandshake, Trophy,
} from "lucide-react";
import DashboardShell from "../components/DashboardShell";
import CountUp from "../components/motion/CountUp";
import { api } from "../lib/api";

/* ---------------------------------------------------------
   A donor's "wrapped" style yearly recap — built to be
   screenshotted and shared, and to turn a one-time giver
   into someone who comes back for the next one.
--------------------------------------------------------- */

const MOCK_WRAPPED = {
  year: 2026,
  itemsGiven: 214,
  listingsPosted: 18,
  ngosMatched: 12,
  avgMatchMinutes: 18,
  topCategory: "Food",
  fastestMatchMinutes: 4,
  streakWeeks: 6,
};

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.96 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6, ease: [0.2, 0.7, 0.2, 1] } },
};
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.12 } } };

export default function DonorWrapped() {
  const [data, setData] = useState(MOCK_WRAPPED);
  const [user, setUser] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [me, dash] = await Promise.all([api.me(), api.donorStats()]);
        if (cancelled) return;
        setUser(me?.user || null);
        if (dash?.stats) {
          setData((d) => ({
            ...d,
            itemsGiven: dash.stats.itemsGiven ?? d.itemsGiven,
            ngosMatched: dash.stats.ngosMatched ?? d.ngosMatched,
            avgMatchMinutes: dash.stats.avgMatchMinutes ?? d.avgMatchMinutes,
          }));
        }
      } catch {
        // Demo data is fine here.
      }
    })();
    return () => { cancelled = true; };
  }, []);

  function share() {
    const text = `I gave ${data.itemsGiven} items through Nirvah this year, matched with ${data.ngosMatched} NGOs. Nothing good should go to waste.`;
    if (navigator.share) {
      navigator.share({ title: "My Nirvah year", text, url: window.location.origin }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  }

  return (
    <DashboardShell role="donor" user={user}>
      <style>{`
        .dw-topbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem; }
        .dw-hero {
          border-radius: var(--radius-lg); padding: 3rem 2.6rem; margin-bottom: 1.6rem; position: relative; overflow: hidden;
          background: radial-gradient(120% 140% at 15% 0%, var(--char-2) 0%, var(--char) 55%, #06231A 100%);
          color: var(--parchment);
        }
        .dw-hero::after { content: ""; position: absolute; inset: 0; pointer-events: none; background-image: radial-gradient(45% 55% at 90% 10%, rgba(52,211,153,0.22), transparent 65%); }
        .dw-hero-inner { position: relative; z-index: 1; max-width: 560px; }
        .dw-eyebrow { display: inline-flex; align-items: center; gap: 7px; font-family: 'IBM Plex Mono', monospace; font-size: 0.72rem; letter-spacing: 0.1em; text-transform: uppercase; color: var(--gold); padding: 6px 12px; border: 1px solid rgba(52,211,153,0.35); border-radius: 999px; margin-bottom: 1.1rem; }
        .dw-hero h1 { font-family: 'Fraunces', serif; font-size: clamp(1.9rem, 3.4vw, 2.6rem); margin: 0 0 0.8rem; line-height: 1.1; }
        .dw-hero p { color: #BFE3D3; font-size: 0.98rem; line-height: 1.6; margin: 0 0 1.6rem; }

        .dw-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.2rem; }
        .dw-card { background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius-md); box-shadow: var(--shadow-soft); padding: 1.8rem; text-align: center; }
        .dw-card .icn { width: 46px; height: 46px; border-radius: 13px; display: grid; place-items: center; background: rgba(16,185,129,0.1); color: var(--spark-deep); margin: 0 auto 1rem; }
        .dw-card .big { font-family: 'Fraunces', serif; font-size: 2.1rem; color: var(--ink); }
        .dw-card .lbl { color: var(--ink-soft); font-size: 0.86rem; margin-top: 6px; }

        .dw-card.wide { grid-column: span 3; text-align: left; display: flex; align-items: center; gap: 1.4rem; background: linear-gradient(135deg, #ECFDF5, #D1FAE5); border-color: rgba(16,185,129,0.25); }
        .dw-card.wide .icn { margin: 0; flex-shrink: 0; }
        .dw-card.wide h3 { font-family: 'Fraunces', serif; font-size: 1.15rem; margin: 0 0 4px; }
        .dw-card.wide p { color: var(--ink-soft); font-size: 0.9rem; margin: 0; line-height: 1.5; }

        @media (max-width: 900px) { .dw-grid { grid-template-columns: 1fr 1fr; } .dw-card.wide { grid-column: span 2; flex-direction: column; text-align: center; } }
        @media (max-width: 600px) { .dw-grid { grid-template-columns: 1fr; } .dw-card.wide { grid-column: span 1; } }
      `}</style>

      <div className="dw-topbar">
        <div>
          <h1 className="font-display" style={{ fontFamily: "Fraunces, serif", fontSize: "1.9rem", margin: "0 0 4px" }}>Your {data.year} in giving</h1>
          <p className="sub" style={{ color: "var(--ink-soft)" }}>Here's the circle you closed this year.</p>
        </div>
        <button className="nv-btn spark" onClick={share} style={{ border: "none" }}>
          <Share2 size={16} /> {copied ? "Copied to share" : "Share your year"}
        </button>
      </div>

      <motion.div className="dw-hero" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
        <div className="dw-hero-inner">
          <span className="dw-eyebrow"><Sparkles size={12} /> {data.year} wrapped</span>
          <h1>You gave {data.itemsGiven} items a second life{user?.name ? `, ${user.name.split(" ")[0]}` : ""}.</h1>
          <p>
            Across {data.listingsPosted} listings this year, your surplus found its way to {data.ngosMatched} different NGOs,
            usually matched in under {data.avgMatchMinutes} minutes. Your fastest match ever took just {data.fastestMatchMinutes} minutes.
          </p>
          <Link to="/dashboard/donor/new" className="nv-btn spark">List another donation <ArrowRight size={15} /></Link>
        </div>
      </motion.div>

      <motion.div className="dw-grid" initial="hidden" animate="show" variants={stagger}>
        <motion.div className="dw-card" variants={cardVariants}>
          <div className="icn"><PackagePlus size={22} /></div>
          <div className="big"><CountUp value={data.listingsPosted} /></div>
          <div className="lbl">donations listed</div>
        </motion.div>
        <motion.div className="dw-card" variants={cardVariants}>
          <div className="icn"><Users2 size={22} /></div>
          <div className="big"><CountUp value={data.ngosMatched} /></div>
          <div className="lbl">NGOs you matched with</div>
        </motion.div>
        <motion.div className="dw-card" variants={cardVariants}>
          <div className="icn"><Zap size={22} /></div>
          <div className="big"><CountUp value={data.avgMatchMinutes} suffix=" min" /></div>
          <div className="lbl">average time to a match</div>
        </motion.div>

        <motion.div className="dw-card wide" variants={cardVariants}>
          <div className="icn"><UtensilsCrossed size={24} /></div>
          <div>
            <h3>{data.topCategory} was your most-given category</h3>
            <p>Most of what you listed this year found its way to someone's table, not a bin.</p>
          </div>
        </motion.div>

        <motion.div className="dw-card wide" variants={cardVariants}>
          <div className="icn"><Trophy size={24} /></div>
          <div>
            <h3>A {data.streakWeeks}-week giving streak</h3>
            <p>You listed something at least once a week for {data.streakWeeks} weeks straight, one of the longest active streaks on the network.</p>
          </div>
        </motion.div>
      </motion.div>

      <div style={{ textAlign: "center", marginTop: "2.4rem", color: "var(--ink-soft)", fontSize: "0.9rem" }}>
        <HeartHandshake size={16} style={{ verticalAlign: "middle", marginRight: 6, color: "var(--spark-deep)" }} />
        Nothing good should go to waste. Here's to next year's circle.
      </div>
    </DashboardShell>
  );
}
