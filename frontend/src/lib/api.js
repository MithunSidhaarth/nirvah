/**
 * Nirvah API client.
 *
 * Every page imports from here instead of calling fetch directly, so wiring
 * up the real backend later means editing this one file.
 *
 * Set VITE_API_BASE_URL in a .env file (see .env.example) once the backend
 * is deployed. Until then this points at localhost so `npm run dev` in
 * /backend just works out of the box.
 */

const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || "http://localhost:4000/api";

function getToken() {
  return localStorage.getItem("nirvah_token");
}

export function setToken(token) {
  if (token) localStorage.setItem("nirvah_token", token);
  else localStorage.removeItem("nirvah_token");
}

// UI-only convenience: decode the role out of the stored JWT so route
// guards can redirect instantly without waiting on a network round trip.
// This is never trusted for anything security-sensitive — every route that
// matters is enforced server-side (requireAuth / requireRole), same as
// before this existed.
export function isLoggedIn() {
  return !!getToken();
}

export function getStoredRole() {
  const token = getToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.role || null;
  } catch {
    return null;
  }
}

async function request(path, { method = "GET", body, auth = true } = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json() : null;

  if (!res.ok) {
    const message = data?.error || `Request failed with status ${res.status}`;
    const error = new Error(message);
    if (data?.code) error.code = data.code;
    throw error;
  }
  return data;
}

// Same as `request`, but sends a FormData body (file uploads) instead of
// JSON. Never set a Content-Type header by hand here — the browser needs to
// add its own multipart boundary, so leaving it unset is deliberate.
async function requestForm(path, { method = "POST", formData, auth = true } = {}) {
  const headers = {};
  const token = getToken();
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: formData,
  });

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json() : null;

  if (!res.ok) {
    const message = data?.error || `Request failed with status ${res.status}`;
    const error = new Error(message);
    if (data?.code) error.code = data.code;
    throw error;
  }
  return data;
}

export const api = {
  // ---- auth ----
  signup: (payload) => request("/auth/signup", { method: "POST", body: payload, auth: false }),
  login: (payload) => request("/auth/login", { method: "POST", body: payload, auth: false }),
  logout: () => request("/auth/logout", { method: "POST" }),
  me: () => request("/auth/me"),
  verifyEmail: (token) => request("/auth/verify-email", { method: "POST", body: { token }, auth: false }),
  resendVerification: (email) => request("/auth/resend-verification", { method: "POST", body: { email }, auth: false }),
  forgotPassword: (email) => request("/auth/forgot-password", { method: "POST", body: { email }, auth: false }),
  resetPassword: (token, password) =>
    request("/auth/reset-password", { method: "POST", body: { token, password }, auth: false }),

  // ---- donations ----
  listDonations: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/donations${qs ? `?${qs}` : ""}`, { auth: false });
  },
  getDonation: (id) => request(`/donations/${id}`, { auth: false }),
  getDonationHistory: (id) => request(`/donations/${id}/history`),
  createDonation: (payload) => request("/donations", { method: "POST", body: payload }),
  uploadListingPhoto: (donationId, file) => {
    const formData = new FormData();
    formData.append("photo", file);
    return requestForm(`/donations/${donationId}/photo`, { formData });
  },
  // payload is optional — only meaningful when the listing doesn't already
  // have a handover preference from the donor. See NewListing.jsx for the
  // donor side and DonationDetail.jsx for this side.
  claimDonation: (id, payload) => request(`/donations/${id}/claim`, { method: "POST", body: payload }),
  acceptDonation: (id) => request(`/donations/${id}/accept`, { method: "POST" }),
  pickupDonation: (id) => request(`/donations/${id}/pickup`, { method: "POST" }),
  completeDonation: (id) => request(`/donations/${id}/complete`, { method: "POST" }),
  acknowledgeDonation: (id) => request(`/donations/${id}/acknowledge`, { method: "POST" }),
  closeDonation: (id) => request(`/donations/${id}/close`, { method: "POST" }),

  // ---- dashboards ----
  donorStats: () => request("/dashboard/donor"),
  ngoStats: () => request("/dashboard/ngo"),

  // ---- my listings / claimed by us ----
  myListings: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/donations/mine${qs ? `?${qs}` : ""}`);
  },
  myClaimed: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/donations/claimed${qs ? `?${qs}` : ""}`);
  },

  // ---- settings ----
  getProfile: () => request("/settings/profile"),
  updateProfile: (payload) => request("/settings/profile", { method: "PATCH", body: payload }),
  changePassword: (payload) => request("/settings/password", { method: "POST", body: payload }),

  // ---- contact ----
  sendContactMessage: (payload) => request("/contact", { method: "POST", body: payload, auth: false }),

  // ---- ngo team ----
  listTeam: () => request("/ngos/me/team"),
  addTeamMember: (payload) => request("/ngos/me/team", { method: "POST", body: payload }),
  removeTeamMember: (id) => request(`/ngos/me/team/${id}`, { method: "DELETE" }),

  // ---- documents (section 9: Vault) ----
  // Documents attached to a specific donation (receipts, delivery proof,
  // tax documents, CSR evidence, etc.) — visible to the giver and the
  // claiming NGO.
  listDonationDocuments: (donationId) => request(`/donations/${donationId}/documents`),
  uploadDonationDocument: (donationId, { type, file }) => {
    const formData = new FormData();
    formData.append("type", type);
    formData.append("file", file);
    return requestForm(`/donations/${donationId}/documents`, { formData });
  },
  // An NGO's own verification documents (registration cert, 12AB, 80G proof).
  listMyNgoDocuments: () => request("/ngos/me/documents"),
  uploadNgoDocument: ({ type, file }) => {
    const formData = new FormData();
    formData.append("type", type);
    formData.append("file", file);
    return requestForm("/ngos/me/documents", { formData });
  },

  // ---- impact (section 12) ----
  // Anyone can read impact records for a donation; only the claiming NGO
  // can log one, and only once the donation has been delivered.
  getDonationImpact: (donationId) => request(`/donations/${donationId}/impact`, { auth: false }),
  logDonationImpact: (donationId, { beneficiaryCount, location, itemsDelivered, notes, photos }) => {
    const formData = new FormData();
    if (beneficiaryCount !== "" && beneficiaryCount != null) formData.append("beneficiaryCount", beneficiaryCount);
    if (location) formData.append("location", location);
    if (itemsDelivered) formData.append("itemsDelivered", itemsDelivered);
    if (notes) formData.append("notes", notes);
    (photos || []).forEach((file) => formData.append("photos", file));
    return requestForm(`/donations/${donationId}/impact`, { formData });
  },

  // ---- tax (section 10) ----
  getTaxSummary: () => request("/donors/me/tax-summary"),

  // ---- csr (section 11) ----
  getCsrSummary: () => request("/ngos/me/csr-summary"),

  // ---- public NGO impact page ----
  getNgoImpactSummary: (ngoId) => request(`/ngos/${ngoId}/impact-summary`, { auth: false }),

  // ---- monetary donations (public donate page + NGO's own profile) ----
  listDonateNgos: () => request("/ngos/donate", { auth: false }),
  getMyMonetaryProfile: () => request("/ngos/me/monetary"),
  updateMyMonetaryProfile: (payload) => request("/ngos/me/monetary", { method: "PATCH", body: payload }),
  uploadMyQrCode: (file) => {
    const formData = new FormData();
    formData.append("qrCode", file);
    return requestForm("/ngos/me/monetary/qr-code", { formData });
  },

  // ---- admin / manager dashboard ----
  // Read-only for both roles. Verify/reject decisions reuse the existing
  // admin-only routes below — a manager calling them gets a 403 from the
  // backend, same as any other role.
  adminStats: () => request("/admin/stats"),
  adminDonations: () => request("/admin/donations"),
  adminPendingNgos: () => request("/ngos/pending"),
  adminNgoDocuments: (ngoId) => request(`/ngos/${ngoId}/documents`),
  verifyNgo: (ngoId, { status, notes }) =>
    request(`/ngos/${ngoId}/verify`, { method: "POST", body: { status, notes } }),
  reviewDocument: (documentId, { status, notes }) =>
    request(`/documents/${documentId}`, { method: "PATCH", body: { status, notes } }),

  // ---- admin: user management (admin-only; a manager gets a 403) ----
  adminListUsers: () => request("/admin/users"),
  adminSetUserRole: (userId, role) =>
    request(`/admin/users/${userId}/role`, { method: "PATCH", body: { role } }),
  adminBanUser: (userId) => request(`/admin/users/${userId}/ban`, { method: "POST" }),
  adminUnbanUser: (userId) => request(`/admin/users/${userId}/unban`, { method: "POST" }),
  adminRemoveUser: (userId) => request(`/admin/users/${userId}`, { method: "DELETE" }),

  // ---- admin: site settings (GET is staff, PATCH is admin-only) ----
  getSiteSettings: () => request("/admin/settings"),
  updateSiteSettings: (payload) => request("/admin/settings", { method: "PATCH", body: payload }),
};
