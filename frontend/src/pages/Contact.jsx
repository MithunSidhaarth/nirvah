import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Mail, Phone, MapPin, Send, CheckCircle2, MessageCircle, Building2,
  Handshake, LifeBuoy, ArrowRight, Clock3,
} from "lucide-react";
import { PageNav, PageFooter } from "../components/PageChrome";
import Reveal from "../components/Reveal";
import Magnetic from "../components/motion/Magnetic";
import { api } from "../lib/api";
import "../styles/tokens.css";
import "../styles/auth.css";

const fadeUp = {
  hidden: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.2, 0.7, 0.2, 1] } },
};
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };

const CONTACT_CARDS = [
  { icon: Mail, title: "Email", value: "hello.nirvah@gmail.com", href: "mailto:hello.nirvah@gmail.com", note: "Best for detailed questions — usually a reply within a few hours." },
  { icon: Phone, title: "Phone", value: "+91 76192 49879", href: "tel:+917619249879", note: "Weekdays, 10am – 6pm IST, for anything time-sensitive." },
  { icon: MapPin, title: "Based in", value: "Bengaluru, India", href: null, note: "Serving givers and NGOs across the city and beyond." },
];

const REASONS = [
  { icon: Handshake, label: "Partnership or press" },
  { icon: Building2, label: "NGO registration help" },
  { icon: LifeBuoy, label: "Report an issue" },
  { icon: MessageCircle, label: "General question" },
];

const FAQ = [
  { q: "I run an NGO — should I use this form or just register?", a: "If you're ready to go, registering directly is faster — you'll hear back in one to two business days. Use this form only if you have a question first." },
  { q: "How quickly will I hear back?", a: "Email replies typically land within a few hours. Anything marked urgent (a safety issue, a listing gone wrong) gets picked up same-day." },
  { q: "Can I suggest a feature or report a bug?", a: "Yes — that's exactly what the \"Report an issue\" option is for. Screenshots and steps to reproduce help a lot if it's a bug." },
];

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", reason: "General question", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await api.sendContactMessage(form);
      setSubmitted(true);
    } catch (err) {
      setError(err?.message || "Couldn't send your message. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="nv-app" style={{ minHeight: "100vh" }}>
      <style>{`
        .ct-hero {
          padding: 5rem 6vw 4rem; text-align: center;
          background: radial-gradient(120% 100% at 50% -10%, var(--char-2) 0%, var(--char) 60%, #06231A 100%);
          color: var(--parchment);
        }
        .ct-eyebrow { display: inline-flex; align-items: center; gap: 8px; font-family: 'IBM Plex Mono', monospace; font-size: 0.75rem; letter-spacing: 0.12em; text-transform: uppercase; color: var(--gold); padding: 7px 14px; border: 1px solid rgba(52,211,153,0.35); border-radius: 999px; margin-bottom: 1.3rem; }
        .ct-hero h1 { font-family: 'Fraunces', serif; font-size: clamp(2.1rem, 4.4vw, 3.2rem); margin: 0 0 1rem; }
        .ct-hero p { color: #BFE3D3; max-width: 520px; margin: 0 auto; line-height: 1.6; }

        .ct-cards { max-width: 1080px; margin: -3rem auto 0; position: relative; z-index: 2; display: grid; grid-template-columns: repeat(3,1fr); gap: 1.2rem; padding: 0 6vw; }
        .ct-card { background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius-md); box-shadow: var(--shadow-soft); padding: 1.6rem; text-decoration: none; color: var(--ink); display: block; transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .ct-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-deep); }
        .ct-card .icn { width: 42px; height: 42px; border-radius: 11px; display: grid; place-items: center; background: rgba(16,185,129,0.1); color: var(--spark-deep); margin-bottom: 0.9rem; }
        .ct-card h4 { font-family: 'IBM Plex Mono', monospace; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--ink-soft); margin: 0 0 6px; }
        .ct-card .value { font-family: 'Fraunces', serif; font-size: 1.1rem; margin-bottom: 6px; }
        .ct-card .note { font-size: 0.82rem; color: var(--ink-soft); line-height: 1.5; }

        .ct-main { max-width: 1080px; margin: 0 auto; padding: 6rem 6vw 1rem; display: grid; grid-template-columns: 1fr 1fr; gap: 3.5rem; align-items: start; }
        .ct-form-side h2 { font-family: 'Fraunces', serif; font-size: 1.7rem; margin: 0 0 0.6rem; }
        .ct-form-side > p { color: var(--ink-soft); line-height: 1.6; margin: 0 0 1.8rem; }
        .ct-reasons { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 1.4rem; }
        .ct-reason-btn { display: flex; align-items: center; gap: 8px; padding: 11px 14px; border-radius: 10px; border: 1px solid var(--line); background: var(--surface); font-size: 0.85rem; font-weight: 600; color: var(--ink-soft); cursor: pointer; transition: all 0.2s ease; text-align: left; }
        .ct-reason-btn.active { border-color: var(--spark); color: var(--spark-deep); background: rgba(16,185,129,0.08); }
        .ct-success { display: flex; align-items: center; gap: 12px; background: rgba(16,185,129,0.08); border: 1px solid rgba(16,185,129,0.3); color: var(--spark-deep); padding: 1.2rem 1.4rem; border-radius: var(--radius-md); }

        .ct-side-panel { background: var(--char); color: var(--parchment); border-radius: var(--radius-lg); padding: 2.2rem; position: sticky; top: 100px; }
        .ct-side-panel h3 { font-family: 'Fraunces', serif; font-size: 1.25rem; margin: 0 0 1rem; }
        .ct-side-row { display: flex; gap: 12px; align-items: flex-start; padding: 0.9rem 0; border-bottom: 1px solid rgba(255,255,255,0.08); }
        .ct-side-row:last-child { border-bottom: none; }
        .ct-side-row svg { color: var(--gold); flex-shrink: 0; margin-top: 2px; }
        .ct-side-row .t { font-size: 0.9rem; color: #DCF4E9; line-height: 1.5; }

        .ct-faq { max-width: 780px; margin: 6rem auto 0; padding: 0 6vw; }
        .ct-faq-head { text-align: center; margin-bottom: 2.2rem; }
        .ct-faq-head h2 { font-family: 'Fraunces', serif; font-size: clamp(1.5rem, 2.6vw, 2rem); margin: 0.5rem 0 0; }
        .ct-faq-head span { font-family: 'IBM Plex Mono', monospace; font-size: 0.75rem; letter-spacing: 0.12em; text-transform: uppercase; color: var(--sage-deep); }
        .ct-faq-item { background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius-md); padding: 1.2rem 1.5rem; margin-bottom: 12px; }
        .ct-faq-item h4 { font-size: 0.98rem; margin: 0 0 8px; }
        .ct-faq-item p { color: var(--ink-soft); font-size: 0.9rem; line-height: 1.6; margin: 0; }

        @media (max-width: 900px) {
          .ct-cards { grid-template-columns: 1fr; }
          .ct-main { grid-template-columns: 1fr; }
          .ct-side-panel { position: static; }
        }
        @media (max-width: 560px) { .ct-reasons { grid-template-columns: 1fr; } }
      `}</style>

      <PageNav active="Contact" />

      <header className="ct-hero">
        <span className="ct-eyebrow"><MessageCircle size={13} /> We read every message</span>
        <h1>Let's talk</h1>
        <p>Question about listing, claiming, registering your NGO, or something else entirely — this is the fastest way to reach a real person.</p>
      </header>

      <div className="ct-cards">
        {CONTACT_CARDS.map((c) => {
          const Card = c.href ? "a" : "div";
          return (
            <Reveal as={Card} className="ct-card" key={c.title} {...(c.href ? { href: c.href } : {})}>
              <div className="icn"><c.icon size={20} /></div>
              <h4>{c.title}</h4>
              <div className="value">{c.value}</div>
              <div className="note">{c.note}</div>
            </Reveal>
          );
        })}
      </div>

      <div className="ct-main">
        <Reveal className="ct-form-side">
          <h2 className="font-display">Send us a message</h2>
          <p>Fill this in and we'll route it to the right person on the team.</p>

          {submitted ? (
            <div className="ct-success">
              <CheckCircle2 size={22} />
              <div>
                <strong>Message sent.</strong> We'll get back to you at {form.email || "your email"} soon.
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && <div className="nv-auth-error" style={{ marginBottom: "1.2rem" }}>{error}</div>}
              <div className="ct-reasons">
                {REASONS.map((r) => (
                  <button
                    type="button"
                    key={r.label}
                    className={`ct-reason-btn ${form.reason === r.label ? "active" : ""}`}
                    onClick={() => setForm((f) => ({ ...f, reason: r.label }))}
                  >
                    <r.icon size={15} /> {r.label}
                  </button>
                ))}
              </div>

              <div className="nv-field">
                <label htmlFor="name">Your name</label>
                <input id="name" name="name" value={form.name} onChange={handleChange} placeholder="Ananya Rao" required />
              </div>
              <div className="nv-field">
                <label htmlFor="email">Email</label>
                <input id="email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@example.com" required />
              </div>
              <div className="nv-field">
                <label htmlFor="message">Message</label>
                <textarea
                  id="message"
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  placeholder="Tell us what's going on..."
                  required
                  rows={5}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid var(--line)", background: "var(--surface)", fontFamily: "inherit", fontSize: "0.95rem", color: "var(--ink)", resize: "vertical" }}
                />
              </div>

              <Magnetic strength={0.3}>
                <button type="submit" className="nv-btn spark" disabled={submitting} style={{ border: "none", width: "100%", justifyContent: "center" }}>
                  {submitting ? "Sending..." : "Send message"} <Send size={16} />
                </button>
              </Magnetic>
            </form>
          )}
        </Reveal>

        <Reveal delay={0.1} className="ct-side-panel">
          <h3 className="font-display">Before you write in</h3>
          <div className="ct-side-row">
            <Clock3 size={16} />
            <span className="t">Most emails get a reply within a few hours.</span>
          </div>
          <div className="ct-side-row">
            <Building2 size={16} />
            <span className="t">NGO? Registering directly is faster than emailing first — <Link to="/for-ngos" style={{ color: "var(--gold)" }}>see how it works</Link>.</span>
          </div>
          <div className="ct-side-row">
            <LifeBuoy size={16} />
            <span className="t">Something urgent with an active pickup? Call us — it's the fastest path to a person.</span>
          </div>
          <div className="ct-side-row">
            <MapPin size={16} />
            <span className="t">We're based in Bengaluru, but the network runs wherever givers and NGOs sign up.</span>
          </div>
        </Reveal>
      </div>

      <div className="ct-faq">
        <Reveal className="ct-faq-head">
          <span>Quick answers</span>
          <h2 className="font-display">Before you send that message</h2>
        </Reveal>
        {FAQ.map((f) => (
          <Reveal className="ct-faq-item" key={f.q}>
            <h4>{f.q}</h4>
            <p>{f.a}</p>
          </Reveal>
        ))}
      </div>

      <div style={{ height: "5rem" }} />
      <PageFooter />
    </div>
  );
}
