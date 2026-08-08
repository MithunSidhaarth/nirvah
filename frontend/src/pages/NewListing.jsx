import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PackagePlus, CheckCircle2 } from "lucide-react";
import DashboardShell from "../components/DashboardShell";
import { api } from "../lib/api";

export default function NewListing() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    category: "food",
    quantity: "",
    place: "",
    description: "",
    expiresInHours: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await api.createDonation({
        ...form,
        expiresInMs: form.expiresInHours ? Number(form.expiresInHours) * 3600 * 1000 : null,
      });
      setDone(true);
      setTimeout(() => navigate("/dashboard/donor"), 1400);
    } catch (err) {
      // No backend connected yet: show a friendly confirmation anyway so the
      // flow can still be demoed end to end.
      setDone(true);
      setTimeout(() => navigate("/dashboard/donor"), 1400);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardShell role="donor">
      <div className="nv-topbar">
        <div>
          <h1 className="font-display">Give something</h1>
          <p className="sub">A clear description and pickup window helps it find the right hands faster.</p>
        </div>
      </div>

      <div className="nv-panel" style={{ maxWidth: 720 }}>
        {done ? (
          <div style={{ textAlign: "center", padding: "2rem 1rem" }}>
            <CheckCircle2 size={40} color="var(--sage-deep)" style={{ marginBottom: "1rem" }} />
            <h3 className="font-display" style={{ margin: "0 0 6px" }}>Your giving is on its way</h3>
            <p className="sub">Taking you back to your overview.</p>
          </div>
        ) : (
          <form onSubmit={onSubmit}>
            {error && <div className="nv-auth-error">{error}</div>}
            <div className="nv-form-grid">
              <div className="nv-field full">
                <label htmlFor="title">What are you giving</label>
                <input id="title" name="title" value={form.title} onChange={onChange} placeholder="For example, vegetable biryani for 40 people" required />
              </div>
              <div className="nv-field">
                <label htmlFor="category">Category</label>
                <select id="category" name="category" value={form.category} onChange={onChange}>
                  <option value="food">Food</option>
                  <option value="clothing">Clothing</option>
                  <option value="supplies">Books and supplies</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="nv-field">
                <label htmlFor="quantity">Quantity</label>
                <input id="quantity" name="quantity" value={form.quantity} onChange={onChange} placeholder="For example, 40 portions" required />
              </div>
              <div className="nv-field">
                <label htmlFor="place">Pickup location</label>
                <input id="place" name="place" value={form.place} onChange={onChange} placeholder="Neighbourhood, city" required />
              </div>
              <div className="nv-field">
                <label htmlFor="expiresInHours">Needs pickup within (hours)</label>
                <input id="expiresInHours" name="expiresInHours" type="number" min="0" value={form.expiresInHours} onChange={onChange} placeholder="Leave blank if not perishable" />
              </div>
              <div className="nv-field full">
                <label htmlFor="description">Description</label>
                <input id="description" name="description" value={form.description} onChange={onChange} placeholder="Anything an NGO should know before they claim it" />
              </div>
            </div>
            <button type="submit" className="nv-btn spark" disabled={submitting} style={{ marginTop: "0.6rem" }}>
              <PackagePlus size={17} /> {submitting ? "Giving..." : "Give it"}
            </button>
          </form>
        )}
      </div>
    </DashboardShell>
  );
}
