import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  PackagePlus, Radar, HeartHandshake, Camera, MapPinned, Clock3, ShieldCheck,
  Bell, Truck, ClipboardCheck, Users2, Sparkles, ArrowRight, ChevronDown,
  UtensilsCrossed, Shirt, BookOpen, PackageSearch, Star, Zap,
} from "lucide-react";
import { PageNav, PageFooter } from "../components/PageChrome";
import Reveal from "../components/Reveal";
import Magnetic from "../components/motion/Magnetic";
import TiltCard from "../components/motion/TiltCard";
import "../styles/tokens.css";

const fadeUp = {
  hidden: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.2, 0.7, 0.2, 1] } },
};
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };

const GIVER_STEPS = [
  { icon: Camera, tag: "01 · Minutes", title: "List what you have", body: "Snap a photo, choose a category, drop a pin on the map. Perishable food automatically gets an expiry countdown, so an NGO knows exactly how much time they have." },
  { icon: MapPinned, tag: "02 · Instant", title: "Nirvah finds who's nearby", body: "The moment you publish, every verified NGO within range sees it in their live feed, ranked by distance and how urgently they need what you're offering." },
  { icon: Bell, tag: "03 · Usually < 20 min", title: "Someone claims it", body: "You get a notification the instant an NGO claims your listing, with their name, verification badge and a pickup window that works for you." },
  { icon: HeartHandshake, tag: "04 · Closing the loop", title: "Watch the handoff", body: "The NGO marks pickup and delivery as it happens. You see the full circle close: a place, a name, a reason it mattered, not just a form that vanished." },
];

const NGO_STEPS = [
  { icon: ClipboardCheck, tag: "01 · Once", title: "Register & get verified", body: "Submit your registration details and ID. Our team checks every organisation by hand before it goes live, no bots, no fake listings, no wasted trips." },
  { icon: Radar, tag: "02 · Ongoing", title: "Get matched to your area", body: "Set your service radius and the categories you can handle. From then on, relevant listings land straight in your dashboard feed as they're posted." },
  { icon: Zap, tag: "03 · One tap", title: "Claim in a single tap", body: "No calls, no back-and-forth. Claim a listing and the giver is notified immediately with your org's verified badge and your pickup contact." },
  { icon: Truck, tag: "04 · Report back", title: "Deliver and log it", body: "Pick up, deliver, and mark it complete. Every delivery rolls up into your organisation's dashboard, proof of impact you can show your funders." },
];

const MATCHING_FACTORS = [
  { icon: MapPinned, title: "Distance first", body: "Nearby NGOs are surfaced before far ones. Nobody should drive across the city for a box of notebooks." },
  { icon: Clock3, title: "Urgency-weighted", body: "Perishable listings with a tight countdown are pushed to the top of the feed so they don't expire unclaimed." },
  { icon: ShieldCheck, title: "Verified organisations only", body: "Only NGOs that have passed manual verification can claim a listing, so givers always know exactly who's collecting." },
];

const CATEGORIES = [
  { icon: UtensilsCrossed, name: "Perishable food", note: "Auto expiry countdown, cold-chain guidance shown to the claiming NGO." },
  { icon: Shirt, name: "Clothing", note: "Sorted by size range so NGOs can match donations to who actually needs them." },
  { icon: BookOpen, name: "Books & supplies", note: "Great for school terms ending, office cleanouts, and library donations." },
  { icon: PackageSearch, name: "Everything else", note: "Furniture, appliances, medical aids, list it and let the network sort it out." },
];

const FAQ = [
  { q: "Is Nirvah free to use?", a: "Completely. There's no listing fee for givers and no subscription for NGOs. Nirvah is built to remove friction, not add a toll." },
  { q: "How fast does a listing actually get claimed?", a: "It depends on your area and category, but perishable food in a well-covered city tends to move fastest." },
  { q: "What happens if nobody claims my listing in time?", a: "You'll get a nudge before a perishable listing's window closes, and can extend it, re-list it in a wider radius, or pull it down. Your call, always." },
  { q: "How are NGOs verified?", a: "Every NGO submits registration paperwork and ID before their account goes live. Our team reviews it by hand, this isn't a self-certified checkbox." },
  { q: "Can a business or restaurant use this, not just individuals?", a: "Yes, a large share of listings come from restaurants, caterers, schools and offices with recurring surplus. Some even automate it into their closing routine." },
];

function FaqItem({ item, isOpen, onToggle }) {
  return (
    <div className="hiw-faq-item" onClick={onToggle}>
      <div className="hiw-faq-q">
        <span>{item.q}</span>
        <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.25 }}>
          <ChevronDown size={18} />
        </motion.span>
      </div>
      <motion.div
        initial={false}
        animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        style={{ overflow: "hidden" }}
      >
        <p className="hiw-faq-a">{item.a}</p>
      </motion.div>
    </div>
  );
}

export default function HowItWorks() {
  const [openFaq, setOpenFaq] = useState(0);

  return (
    <div className="nv-app" style={{ minHeight: "100vh" }}>
      <style>{`
        .hiw-hero {
          position: relative; padding: 5.5rem 6vw 6rem; text-align: center; overflow: hidden;
          background: radial-gradient(120% 100% at 50% -10%, var(--char-2) 0%, var(--char) 60%, #06231A 100%);
          color: var(--parchment);
        }
        .hiw-hero::after {
          content: ""; position: absolute; inset: 0; pointer-events: none;
          background-image: radial-gradient(50% 45% at 15% 10%, rgba(16,185,129,0.22), transparent 60%), radial-gradient(45% 45% at 90% 20%, rgba(52,211,153,0.16), transparent 65%);
        }
        .hiw-hero-inner { position: relative; z-index: 1; max-width: 760px; margin: 0 auto; }
        .hiw-eyebrow { display: inline-flex; align-items: center; gap: 8px; font-family: 'IBM Plex Mono', monospace; font-size: 0.75rem; letter-spacing: 0.12em; text-transform: uppercase; color: var(--gold); padding: 7px 14px; border: 1px solid rgba(52,211,153,0.35); border-radius: 999px; margin-bottom: 1.4rem; }
        .hiw-hero h1 { font-family: 'Fraunces', serif; font-size: clamp(2.2rem, 4.6vw, 3.6rem); line-height: 1.08; margin: 0 0 1.1rem; }
        .hiw-hero h1 em { color: var(--gold); font-style: italic; }
        .hiw-hero p.lede { color: #BFE3D3; font-size: 1.08rem; max-width: 560px; margin: 0 auto 2rem; line-height: 1.6; }
        .hiw-hero-ctas { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }


        .hiw-section { max-width: 1120px; margin: 0 auto; padding: 6rem 6vw 1rem; }
        .hiw-section-head { max-width: 620px; margin: 0 auto 3rem; text-align: center; }
        .hiw-kicker { font-family: 'IBM Plex Mono', monospace; font-size: 0.75rem; letter-spacing: 0.12em; text-transform: uppercase; color: var(--sage-deep); }
        .hiw-section-head h2 { font-family: 'Fraunces', serif; font-size: clamp(1.7rem, 3vw, 2.3rem); margin: 0.6rem 0 0.8rem; }
        .hiw-section-head p { color: var(--ink-soft); line-height: 1.6; }

        .hiw-track-toggle { display: flex; justify-content: center; gap: 10px; margin-bottom: 2.6rem; }
        .hiw-toggle-btn { padding: 10px 20px; border-radius: 999px; border: 1px solid var(--line); background: var(--surface); font-weight: 600; font-size: 0.9rem; cursor: pointer; color: var(--ink-soft); display: inline-flex; align-items: center; gap: 8px; transition: all 0.2s ease; }
        .hiw-toggle-btn.active.giver { border-color: var(--spark); color: var(--spark-deep); background: rgba(16,185,129,0.08); }
        .hiw-toggle-btn.active.ngo { border-color: var(--sage); color: var(--sage-deep); background: rgba(13,148,136,0.1); }

        .hiw-timeline { position: relative; display: grid; gap: 1.4rem; }
        .hiw-timeline-line { position: absolute; left: 27px; top: 8px; bottom: 8px; width: 2px; background: linear-gradient(var(--line), var(--line)); }
        .hiw-step { position: relative; display: grid; grid-template-columns: 56px 1fr; gap: 1.2rem; background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius-md); padding: 1.5rem 1.6rem; box-shadow: var(--shadow-soft); }
        .hiw-step-icon { width: 56px; height: 56px; border-radius: 16px; display: grid; place-items: center; background: linear-gradient(135deg, rgba(16,185,129,0.16), rgba(52,211,153,0.1)); color: var(--spark-deep); z-index: 1; }
        .hiw-step.ngo .hiw-step-icon { background: linear-gradient(135deg, rgba(13,148,136,0.18), rgba(17,94,89,0.1)); color: var(--sage-deep); }
        .hiw-step-tag { font-family: 'IBM Plex Mono', monospace; font-size: 0.72rem; letter-spacing: 0.08em; text-transform: uppercase; color: var(--ink-soft); }
        .hiw-step h3 { font-family: 'Fraunces', serif; font-size: 1.2rem; margin: 4px 0 6px; }
        .hiw-step p { color: var(--ink-soft); font-size: 0.94rem; line-height: 1.55; margin: 0; }

        .hiw-match-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 1.4rem; }
        .hiw-match-card { padding: 1.8rem; border-radius: var(--radius-lg); background: var(--surface); border: 1px solid var(--line); position: relative; overflow: hidden; }
        .hiw-match-card .icn { width: 46px; height: 46px; border-radius: 12px; display: grid; place-items: center; background: rgba(16,185,129,0.1); color: var(--spark-deep); margin-bottom: 1rem; }
        .hiw-match-card h4 { font-family: 'Fraunces', serif; font-size: 1.05rem; margin: 0 0 6px; }
        .hiw-match-card p { color: var(--ink-soft); font-size: 0.9rem; line-height: 1.55; margin: 0; }

        .hiw-cat-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 1.2rem; }
        .hiw-cat-card { padding: 1.5rem; border-radius: var(--radius-md); background: var(--parchment-2); border: 1px solid var(--line); }
        .hiw-cat-card .icn { color: var(--sage-deep); margin-bottom: 0.8rem; }
        .hiw-cat-card h5 { font-family: 'Fraunces', serif; font-size: 1rem; margin: 0 0 6px; }
        .hiw-cat-card p { color: var(--ink-soft); font-size: 0.84rem; line-height: 1.5; margin: 0; }

        .hiw-story { background: var(--char); color: var(--parchment); border-radius: var(--radius-lg); padding: 2.6rem; margin-top: 1rem; }
        .hiw-story-row { display: flex; gap: 1rem; padding: 0.9rem 0; border-bottom: 1px solid rgba(255,255,255,0.08); align-items: flex-start; }
        .hiw-story-row:last-child { border-bottom: none; }
        .hiw-story-time { font-family: 'IBM Plex Mono', monospace; font-size: 0.78rem; color: var(--gold); min-width: 64px; }
        .hiw-story-text { font-size: 0.96rem; color: #DCF4E9; line-height: 1.5; }
        .hiw-story-text b { color: #fff; }

        .hiw-faq { max-width: 780px; margin: 0 auto; display: grid; gap: 12px; }
        .hiw-faq-item { background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius-md); padding: 1.2rem 1.5rem; cursor: pointer; }
        .hiw-faq-q { display: flex; justify-content: space-between; align-items: center; font-weight: 600; font-size: 0.98rem; gap: 1rem; }
        .hiw-faq-a { color: var(--ink-soft); font-size: 0.92rem; line-height: 1.6; margin: 0.9rem 0 0; }

        .hiw-cta { margin: 6rem 6vw 0; border-radius: var(--radius-lg); background: linear-gradient(120deg, var(--char-2), var(--char)); color: var(--parchment); padding: 3.4rem 3rem; text-align: center; }
        .hiw-cta h2 { font-family: 'Fraunces', serif; font-size: clamp(1.6rem, 2.8vw, 2.1rem); margin: 0 0 0.8rem; }
        .hiw-cta p { color: #BFE3D3; margin: 0 0 1.6rem; }
        .hiw-cta-row { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }

        @media (max-width: 900px) {
          .hiw-match-grid, .hiw-cat-grid { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 640px) {
          .hiw-match-grid, .hiw-cat-grid { grid-template-columns: 1fr; }
          .hiw-timeline-line { display: none; }
        }
      `}</style>

      <PageNav active="How it works" />

      {/* HERO */}
      <header className="hiw-hero">
        <div className="hiw-hero-inner">
          <span className="hiw-eyebrow"><Sparkles size={13} /> The full circle, step by step</span>
          <h1>From your shelf to <em>their table</em>: exactly how it happens</h1>
          <p className="lede">
            No warehouses, no waiting lists, no cold calls. Here's precisely what happens
            from the moment you list something to the moment it's delivered, for givers
            and for the NGOs who claim it.
          </p>
          <div className="hiw-hero-ctas">
            <Magnetic strength={0.3}><Link to="/signup?role=donor" className="nv-btn spark">List a donation <ArrowRight size={16} /></Link></Magnetic>
            <Magnetic strength={0.3}><Link to="/signup?role=ngo" className="nv-btn ghost-dark">Register your NGO</Link></Magnetic>
          </div>
        </div>
      </header>

      {/* GIVER TRACK */}
      <section className="hiw-section">
        <Reveal className="hiw-section-head">
          <span className="hiw-kicker">Track one</span>
          <h2 className="font-display">If you have something to give</h2>
          <p>Four steps, usually done inside two minutes of actual effort on your end.</p>
        </Reveal>
        <motion.div className="hiw-timeline" initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.1 }} variants={stagger}>
          <div className="hiw-timeline-line" aria-hidden="true" />
          {GIVER_STEPS.map((s) => (
            <motion.div className="hiw-step giver" key={s.title} variants={fadeUp}>
              <div className="hiw-step-icon"><s.icon size={24} /></div>
              <div>
                <span className="hiw-step-tag">{s.tag}</span>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* NGO TRACK */}
      <section className="hiw-section">
        <Reveal className="hiw-section-head">
          <span className="hiw-kicker">Track two</span>
          <h2 className="font-display">If you're claiming and delivering</h2>
          <p>Built so your team spends time delivering, not searching or making calls.</p>
        </Reveal>
        <motion.div className="hiw-timeline" initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.1 }} variants={stagger}>
          <div className="hiw-timeline-line" aria-hidden="true" />
          {NGO_STEPS.map((s) => (
            <motion.div className="hiw-step ngo" key={s.title} variants={fadeUp}>
              <div className="hiw-step-icon"><s.icon size={24} /></div>
              <div>
                <span className="hiw-step-tag">{s.tag}</span>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* MATCHING LOGIC */}
      <section className="hiw-section">
        <Reveal className="hiw-section-head">
          <span className="hiw-kicker">Under the hood</span>
          <h2 className="font-display">How a listing finds the right NGO</h2>
          <p>No manual sorting on either end. The network ranks matches by three signals.</p>
        </Reveal>
        <motion.div className="hiw-match-grid" initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.15 }} variants={stagger}>
          {MATCHING_FACTORS.map((m) => (
            <motion.div key={m.title} variants={fadeUp}>
              <TiltCard className="hiw-match-card" maxTilt={5}>
                <div className="icn"><m.icon size={22} /></div>
                <h4>{m.title}</h4>
                <p>{m.body}</p>
              </TiltCard>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* CATEGORIES */}
      <section className="hiw-section">
        <Reveal className="hiw-section-head">
          <span className="hiw-kicker">What you can list</span>
          <h2 className="font-display">Four categories, one network</h2>
          <p>Every listing is tagged so the right NGOs see it first.</p>
        </Reveal>
        <motion.div className="hiw-cat-grid" initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.15 }} variants={stagger}>
          {CATEGORIES.map((c) => (
            <motion.div className="hiw-cat-card" key={c.name} variants={fadeUp}>
              <div className="icn"><c.icon size={26} strokeWidth={1.6} /></div>
              <h5>{c.name}</h5>
              <p>{c.note}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* LIVE STORY WALKTHROUGH */}
      <section className="hiw-section">
        <Reveal className="hiw-section-head">
          <span className="hiw-kicker">A real example</span>
          <h2 className="font-display">One donation, start to finish</h2>
          <p>Anonymised, but this is a genuinely typical timeline from the network.</p>
        </Reveal>
        <Reveal className="hiw-story">
          {[
            { time: "7:42 PM", text: <>A restaurant kitchen lists <b>40 portions of vegetable biryani</b> in HSR Layout, with a 3-hour expiry window.</> },
            { time: "7:51 PM", text: <>Three verified NGOs within 4 km see it in their live feed, ranked by distance and urgency.</> },
            { time: "7:58 PM", text: <><b>Asha Foundation</b> claims it. The kitchen gets notified instantly with a pickup contact and ETA.</> },
            { time: "8:20 PM", text: <>A volunteer arrives, confirms the handoff, and marks pickup complete in the app.</> },
            { time: "8:47 PM", text: <>Meals are delivered to a shelter in Koramangala. The kitchen sees the full circle close.</> },
          ].map((row) => (
            <div className="hiw-story-row" key={row.time}>
              <span className="hiw-story-time">{row.time}</span>
              <span className="hiw-story-text">{row.text}</span>
            </div>
          ))}
        </Reveal>
      </section>

      {/* FAQ */}
      <section className="hiw-section">
        <Reveal className="hiw-section-head">
          <span className="hiw-kicker">Questions</span>
          <h2 className="font-display">Good to know before you start</h2>
        </Reveal>
        <Reveal className="hiw-faq">
          {FAQ.map((item, i) => (
            <FaqItem key={item.q} item={item} isOpen={openFaq === i} onToggle={() => setOpenFaq(openFaq === i ? -1 : i)} />
          ))}
        </Reveal>
      </section>

      {/* CTA */}
      <Reveal className="hiw-cta">
        <h2 className="font-display">Ready to close a circle of your own?</h2>
        <p>Free for givers and NGOs alike. The next match could start in minutes.</p>
        <div className="hiw-cta-row">
          <Magnetic strength={0.3}><Link to="/signup?role=donor" className="nv-btn spark">Start giving <ArrowRight size={16} /></Link></Magnetic>
          <Magnetic strength={0.3}><Link to="/signup?role=ngo" className="nv-btn sage">Register your NGO <Users2 size={16} /></Link></Magnetic>
        </div>
      </Reveal>

      <div style={{ height: "5rem" }} />
      <PageFooter />
    </div>
  );
}
