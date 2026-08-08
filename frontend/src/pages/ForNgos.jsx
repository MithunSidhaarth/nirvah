import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Users2, Radar, Zap, BarChart3, ShieldCheck, FileCheck2, Bell, CheckCircle2,
  ArrowRight, PackagePlus, MapPin, Star, ClipboardList, HandCoins,
} from "lucide-react";
import { PageNav, PageFooter } from "../components/PageChrome";
import Reveal from "../components/Reveal";
import Magnetic from "../components/motion/Magnetic";
import TiltCard from "../components/motion/TiltCard";
import CountUp from "../components/motion/CountUp";
import "../styles/tokens.css";

const fadeUp = {
  hidden: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.2, 0.7, 0.2, 1] } },
};
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };

const BENEFITS = [
  { icon: Radar, title: "Live, local alerts", body: "See donations the second they're listed within your service radius — no refreshing, no waiting for someone to remember to call you." },
  { icon: Zap, title: "One-tap claiming", body: "Claim a listing in a single tap. The giver is notified instantly with your org's verified badge and pickup contact." },
  { icon: BarChart3, title: "Impact you can show", body: "Every delivery rolls into your dashboard automatically — meals served, families reached, ready to hand to funders and board members." },
  { icon: HandCoins, title: "Zero cost, always", body: "No subscription, no per-claim fee, no premium tier. Nirvah is free for verified NGOs, full stop." },
];

const VERIFY_STEPS = [
  { icon: ClipboardList, title: "Apply", body: "Tell us who you are: registration number, service area, categories you can handle." },
  { icon: FileCheck2, title: "We check the paperwork", body: "A real person reviews your registration and ID — usually within one to two business days." },
  { icon: ShieldCheck, title: "You go live, verified", body: "Your badge appears on every claim, so givers always know a legitimate org picked it up." },
  { icon: Bell, title: "Alerts start flowing", body: "The moment you're approved, matching listings in your area start landing in your feed." },
];

const REQUIREMENTS = [
  "A registered nonprofit, trust, or society (or equivalent legal status)",
  "Valid organisational ID or registration certificate",
  "At least one point of contact for pickup coordination",
  "A defined service area you can realistically cover",
];

const TESTIMONIALS = [
  { initials: "MB", quote: "We used to spend hours cold calling donors. Now listings come to us, sorted by distance, the moment they go up.", who: "Michael Brown", role: "Coordinator, Asha Foundation" },
  { initials: "RK", quote: "The verified badge matters more than we expected — givers trust us faster because the app already vouched for us.", who: "Ritu Kapoor", role: "Programme Lead, Lakeview Trust" },
  { initials: "AS", quote: "Our board asks for numbers every quarter. The dashboard basically writes that report for us now.", who: "Arjun Shetty", role: "Director, Whitefield Shelter Network" },
];

export default function ForNgos() {
  return (
    <div className="nv-app" style={{ minHeight: "100vh" }}>
      <style>{`
        .fn-hero {
          position: relative; padding: 5.5rem 6vw 6.5rem; overflow: hidden;
          background: radial-gradient(120% 100% at 80% -10%, #134E43 0%, var(--char) 55%, #06231A 100%);
          color: var(--parchment); display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 3rem; align-items: center;
        }
        .fn-hero::after { content: ""; position: absolute; inset: 0; pointer-events: none; background-image: radial-gradient(50% 50% at 85% 15%, rgba(13,148,136,0.28), transparent 60%); }
        .fn-hero-copy { position: relative; z-index: 1; }
        .fn-eyebrow { display: inline-flex; align-items: center; gap: 8px; font-family: 'IBM Plex Mono', monospace; font-size: 0.75rem; letter-spacing: 0.12em; text-transform: uppercase; color: #5EEAD4; padding: 7px 14px; border: 1px solid rgba(13,148,136,0.45); border-radius: 999px; margin-bottom: 1.4rem; }
        .fn-hero h1 { font-family: 'Fraunces', serif; font-size: clamp(2.1rem, 4vw, 3.2rem); line-height: 1.1; margin: 0 0 1.1rem; }
        .fn-hero h1 em { color: #5EEAD4; font-style: italic; }
        .fn-hero p.lede { color: #BFE3D3; font-size: 1.05rem; max-width: 480px; margin: 0 0 2rem; line-height: 1.6; }
        .fn-hero-ctas { display: flex; gap: 12px; flex-wrap: wrap; }

        .fn-mock { position: relative; z-index: 1; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.14); border-radius: var(--radius-lg); backdrop-filter: blur(18px); overflow: hidden; }
        .fn-mock-chrome { display: flex; align-items: center; gap: 8px; padding: 0.9rem 1.1rem; border-bottom: 1px solid rgba(255,255,255,0.1); }
        .fn-mock-chrome .dot { width: 9px; height: 9px; border-radius: 50%; }
        .fn-mock-chrome .r { background: #F87171; } .fn-mock-chrome .y { background: #FBBF24; } .fn-mock-chrome .g { background: #34D399; }
        .fn-mock-chrome .lbl { margin-left: 8px; font-family: 'IBM Plex Mono', monospace; font-size: 0.72rem; color: #9FD9C2; }
        .fn-mock-body { padding: 1.2rem; display: grid; gap: 0.8rem; }
        .fn-mock-row { display: flex; align-items: center; gap: 10px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 0.8rem 1rem; }
        .fn-mock-row .ic { width: 32px; height: 32px; border-radius: 9px; display: grid; place-items: center; background: rgba(52,211,153,0.18); color: #5EEAD4; flex-shrink: 0; }
        .fn-mock-row .txt { font-size: 0.84rem; color: #DCF4E9; flex: 1; }
        .fn-mock-row .tag { font-family: 'IBM Plex Mono', monospace; font-size: 0.68rem; padding: 3px 9px; border-radius: 999px; background: rgba(52,211,153,0.2); color: #6EE7B7; white-space: nowrap; }
        .fn-mock-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem; padding: 0 1.2rem 1.2rem; }
        .fn-mock-stat { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 0.9rem; }
        .fn-mock-stat .n { font-family: 'IBM Plex Mono', monospace; font-size: 1.3rem; color: #fff; }
        .fn-mock-stat .l { font-size: 0.72rem; color: #9FD9C2; margin-top: 2px; }

        .fn-section { max-width: 1120px; margin: 0 auto; padding: 6rem 6vw 1rem; }
        .fn-section-head { max-width: 620px; margin: 0 auto 3rem; text-align: center; }
        .fn-kicker { font-family: 'IBM Plex Mono', monospace; font-size: 0.75rem; letter-spacing: 0.12em; text-transform: uppercase; color: var(--sage-deep); }
        .fn-section-head h2 { font-family: 'Fraunces', serif; font-size: clamp(1.7rem, 3vw, 2.3rem); margin: 0.6rem 0 0.8rem; }
        .fn-section-head p { color: var(--ink-soft); line-height: 1.6; }

        .fn-benefit-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 1.2rem; }
        .fn-benefit-card { padding: 1.7rem; border-radius: var(--radius-md); background: var(--surface); border: 1px solid var(--line); box-shadow: var(--shadow-soft); }
        .fn-benefit-card .icn { width: 46px; height: 46px; border-radius: 12px; display: grid; place-items: center; background: rgba(13,148,136,0.12); color: var(--sage-deep); margin-bottom: 1rem; }
        .fn-benefit-card h4 { font-family: 'Fraunces', serif; font-size: 1.02rem; margin: 0 0 6px; }
        .fn-benefit-card p { color: var(--ink-soft); font-size: 0.88rem; line-height: 1.55; margin: 0; }

        .fn-verify-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 1.2rem; position: relative; }
        .fn-verify-connector { position: absolute; top: 44px; left: 8%; right: 8%; height: 2px; background: var(--line); z-index: 0; }
        .fn-verify-card { position: relative; z-index: 1; text-align: center; }
        .fn-verify-icon { width: 64px; height: 64px; border-radius: 50%; background: var(--surface); border: 2px solid var(--sage); display: grid; place-items: center; color: var(--sage-deep); margin: 0 auto 1rem; }
        .fn-verify-card h4 { font-family: 'Fraunces', serif; font-size: 1rem; margin: 0 0 6px; }
        .fn-verify-card p { color: var(--ink-soft); font-size: 0.86rem; line-height: 1.5; margin: 0; }

        .fn-req-panel { background: var(--parchment-2); border-radius: var(--radius-lg); padding: 2.2rem 2.4rem; display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; align-items: center; }
        .fn-req-panel h3 { font-family: 'Fraunces', serif; font-size: 1.3rem; margin: 0 0 0.6rem; }
        .fn-req-panel > p { color: var(--ink-soft); font-size: 0.92rem; line-height: 1.6; margin: 0; }
        .fn-req-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.7rem; }
        .fn-req-list li { display: flex; gap: 10px; align-items: flex-start; font-size: 0.92rem; color: var(--ink); }
        .fn-req-list svg { color: var(--sage-deep); flex-shrink: 0; margin-top: 2px; }

        .fn-notes-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 1.4rem; }
        .fn-note { background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius-md); padding: 1.6rem; box-shadow: var(--shadow-soft); }
        .fn-note .stars { color: var(--gold); display: flex; gap: 2px; margin-bottom: 0.8rem; }
        .fn-note .quote { font-size: 0.94rem; line-height: 1.6; color: var(--ink); margin: 0 0 1rem; }
        .fn-note .who { display: flex; align-items: center; gap: 10px; }
        .fn-note .avatar { width: 34px; height: 34px; border-radius: 50%; background: linear-gradient(135deg, var(--sage), var(--sage-deep)); color: #fff; display: grid; place-items: center; font-size: 0.78rem; font-weight: 700; }
        .fn-note .name { font-size: 0.88rem; font-weight: 600; }
        .fn-note .role { font-size: 0.78rem; color: var(--ink-soft); }

        .fn-cta { margin: 6rem 6vw 0; border-radius: var(--radius-lg); background: linear-gradient(120deg, #134E43, var(--char)); color: var(--parchment); padding: 3.4rem 3rem; text-align: center; }
        .fn-cta h2 { font-family: 'Fraunces', serif; font-size: clamp(1.6rem, 2.8vw, 2.1rem); margin: 0 0 0.8rem; }
        .fn-cta p { color: #BFE3D3; margin: 0 0 1.6rem; }

        @media (max-width: 980px) {
          .fn-hero { grid-template-columns: 1fr; padding-top: 3.5rem; }
          .fn-benefit-grid, .fn-notes-grid, .fn-req-panel { grid-template-columns: 1fr 1fr; }
          .fn-req-panel { grid-template-columns: 1fr; }
          .fn-verify-grid { grid-template-columns: 1fr 1fr; }
          .fn-verify-connector { display: none; }
        }
        @media (max-width: 640px) {
          .fn-benefit-grid, .fn-notes-grid, .fn-verify-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <PageNav active="For NGOs" />

      {/* HERO */}
      <header className="fn-hero">
        <div className="fn-hero-copy">
          <span className="fn-eyebrow"><Users2 size={13} /> Built for verified organisations</span>
          <h1>Stop chasing leads. Let <em>donations come to you.</em></h1>
          <p className="lede">
            A live, local feed of surplus food, clothing and supplies — filtered to your
            service area, ranked by urgency, claimable in one tap. Free, forever, for every
            verified NGO on the network.
          </p>
          <div className="fn-hero-ctas">
            <Magnetic strength={0.3}><Link to="/signup?role=ngo" className="nv-btn sage">Register your NGO <ArrowRight size={16} /></Link></Magnetic>
            <Magnetic strength={0.3}><Link to="/how-it-works" className="nv-btn ghost-dark">See how matching works</Link></Magnetic>
          </div>
        </div>

        <motion.div className="fn-mock" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }}>
          <div className="fn-mock-chrome">
            <span className="dot r" /><span className="dot y" /><span className="dot g" />
            <span className="lbl">nirvah.org / ngo dashboard</span>
          </div>
          <div className="fn-mock-body">
            {[
              { icon: PackagePlus, text: "40 meals listed, 2.1 km away", tag: "New" },
              { icon: MapPin, text: "Winter coats claimed by your team", tag: "Claimed" },
              { icon: CheckCircle2, text: "Notebooks delivered to Lakeview", tag: "Done" },
            ].map((r) => (
              <div className="fn-mock-row" key={r.text}>
                <span className="ic"><r.icon size={16} /></span>
                <span className="txt">{r.text}</span>
                <span className="tag">{r.tag}</span>
              </div>
            ))}
          </div>
          <div className="fn-mock-stats">
            <div className="fn-mock-stat"><div className="n">128</div><div className="l">delivered this month</div></div>
            <div className="fn-mock-stat"><div className="n">6 min</div><div className="l">avg. claim-to-pickup</div></div>
          </div>
        </motion.div>
      </header>

      {/* BENEFITS */}
      <section className="fn-section">
        <Reveal className="fn-section-head">
          <span className="fn-kicker">Why NGOs choose Nirvah</span>
          <h2 className="font-display">Everything to help you deliver faster</h2>
        </Reveal>
        <motion.div className="fn-benefit-grid" initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.15 }} variants={stagger}>
          {BENEFITS.map((b) => (
            <motion.div key={b.title} variants={fadeUp}>
              <TiltCard className="fn-benefit-card" maxTilt={5}>
                <div className="icn"><b.icon size={22} /></div>
                <h4>{b.title}</h4>
                <p>{b.body}</p>
              </TiltCard>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* VERIFICATION PROCESS */}
      <section className="fn-section">
        <Reveal className="fn-section-head">
          <span className="fn-kicker">Getting started</span>
          <h2 className="font-display">Verification takes a couple of days, not weeks</h2>
          <p>One-time, thorough, and worth it — the badge is what makes givers trust a claim.</p>
        </Reveal>
        <motion.div className="fn-verify-grid" initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.15 }} variants={stagger}>
          <div className="fn-verify-connector" aria-hidden="true" />
          {VERIFY_STEPS.map((s) => (
            <motion.div className="fn-verify-card" key={s.title} variants={fadeUp}>
              <div className="fn-verify-icon"><s.icon size={24} /></div>
              <h4>{s.title}</h4>
              <p>{s.body}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* REQUIREMENTS */}
      <section className="fn-section">
        <Reveal className="fn-req-panel">
          <div>
            <h3 className="font-display">What you'll need to apply</h3>
            <p>Nothing exotic — if you're a functioning registered organisation, you likely already have all of this on hand.</p>
          </div>
          <ul className="fn-req-list">
            {REQUIREMENTS.map((r) => (
              <li key={r}><CheckCircle2 size={17} /> <span>{r}</span></li>
            ))}
          </ul>
        </Reveal>
      </section>

      {/* STATS */}
      <section className="fn-section">
        <Reveal className="fn-section-head">
          <span className="fn-kicker">The network, right now</span>
          <h2 className="font-display">You'd be joining a network already moving</h2>
        </Reveal>
        <motion.div className="fn-benefit-grid" style={{ gridTemplateColumns: "repeat(3,1fr)" }} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.15 }} variants={stagger}>
          {[
            { value: 340, suffix: "+", label: "verified NGOs already on Nirvah" },
            { value: 18, suffix: " min", label: "average time to a claim" },
            { value: 96, suffix: "%", label: "of listings claimed before they expire" },
          ].map((s) => (
            <motion.div className="fn-benefit-card" key={s.label} variants={fadeUp} style={{ textAlign: "center" }}>
              <div className="font-display" style={{ fontSize: "1.9rem", color: "var(--sage-deep)" }}>
                <CountUp value={s.value} suffix={s.suffix} />
              </div>
              <p style={{ marginTop: 6 }}>{s.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* TESTIMONIALS */}
      <section className="fn-section">
        <Reveal className="fn-section-head">
          <span className="fn-kicker">From coordinators like you</span>
          <h2 className="font-display">What NGOs on Nirvah say</h2>
        </Reveal>
        <motion.div className="fn-notes-grid" initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.15 }} variants={stagger}>
          {TESTIMONIALS.map((t) => (
            <motion.div className="fn-note" key={t.who} variants={fadeUp}>
              <div className="stars">{Array.from({ length: 5 }).map((_, i) => <Star key={i} size={14} fill="currentColor" />)}</div>
              <p className="quote">"{t.quote}"</p>
              <div className="who">
                <div className="avatar">{t.initials}</div>
                <div>
                  <div className="name">{t.who}</div>
                  <div className="role">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* CTA */}
      <Reveal className="fn-cta">
        <h2 className="font-display">Bring your organisation onto the network</h2>
        <p>Verification usually clears in one to two business days. No cost, ever.</p>
        <Magnetic strength={0.3}><Link to="/signup?role=ngo" className="nv-btn sage">Register your NGO <ArrowRight size={16} /></Link></Magnetic>
      </Reveal>

      <div style={{ height: "5rem" }} />
      <PageFooter />
    </div>
  );
}
