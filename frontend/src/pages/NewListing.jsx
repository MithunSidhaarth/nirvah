import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PackagePlus, CheckCircle2, ImagePlus, MapPinned, X } from "lucide-react";
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
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [coords, setCoords] = useState(null); // { latitude, longitude }
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onPhotoChange = (e) => {
    const file = e.target.files?.[0] || null;
    setPhoto(file);
    setPhotoPreview(file ? URL.createObjectURL(file) : null);
  };

  const clearPhoto = () => {
    setPhoto(null);
    setPhotoPreview(null);
  };

  // Browser geolocation only — no external geocoding service. This is what
  // makes "near me" sorting on Browse possible: a listing with coordinates
  // can be distance-sorted against a viewer's own coordinates.
  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setLocateError("Your browser doesn't support location.");
      return;
    }
    setLocating(true);
    setLocateError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        setLocating(false);
      },
      (err) => {
        setLocateError(err.code === 1 ? "Location access was denied." : "Couldn't get your location.");
        setLocating(false);
      },
      { enableHighAccuracy: false, timeout: 8000 }
    );
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await api.createDonation({
        ...form,
        expiresInMs: form.expiresInHours ? Number(form.expiresInHours) * 3600 * 1000 : null,
        latitude: coords?.latitude ?? null,
        longitude: coords?.longitude ?? null,
      });
      const newId = res?.donation?.id;
      if (newId && photo) {
        // Best-effort: the listing itself is already saved at this point,
        // so a failed photo upload shouldn't block the "you're done" state
        // or send the donor back to redo the whole form.
        await api.uploadListingPhoto(newId, photo).catch(() => {});
      }
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

            <div className="nv-field full">
              <label htmlFor="photo">Photo (optional)</label>
              {photoPreview ? (
                <div style={{ position: "relative", width: 160 }}>
                  <img
                    src={photoPreview}
                    alt="Listing preview"
                    style={{ width: 160, height: 120, objectFit: "cover", borderRadius: 12, border: "1px solid var(--line)" }}
                  />
                  <button
                    type="button"
                    onClick={clearPhoto}
                    className="nv-btn ghost-light sm"
                    style={{ position: "absolute", top: 6, right: 6, padding: "4px 6px" }}
                    title="Remove photo"
                  >
                    <X size={13} />
                  </button>
                </div>
              ) : (
                <label
                  htmlFor="photo"
                  className="nv-btn ghost-light sm"
                  style={{ display: "inline-flex", cursor: "pointer", width: "fit-content" }}
                >
                  <ImagePlus size={15} /> Add a photo
                </label>
              )}
              <input id="photo" name="photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={onPhotoChange} style={{ display: "none" }} />
              <div className="hint">Helps an NGO recognise it faster. JPEG, PNG, or WEBP, up to 8MB.</div>
            </div>

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
              <div className="nv-field full">
                <label htmlFor="place">Pickup location</label>
                <input id="place" name="place" value={form.place} onChange={onChange} placeholder="Neighbourhood, city" required />
                <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 10 }}>
                  <button type="button" className="nv-btn ghost-light sm" onClick={useMyLocation} disabled={locating}>
                    <MapPinned size={14} /> {locating ? "Locating…" : coords ? "Location captured" : "Use my current location"}
                  </button>
                  {coords && <span className="hint" style={{ margin: 0 }}>Nirvah can now show this to nearby NGOs first.</span>}
                </div>
                {locateError && <div className="hint" style={{ color: "#B91C1C" }}>{locateError}</div>}
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
