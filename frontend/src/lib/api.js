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
    throw new Error(message);
  }
  return data;
}

export const api = {
  // ---- auth ----
  signup: (payload) => request("/auth/signup", { method: "POST", body: payload, auth: false }),
  login: (payload) => request("/auth/login", { method: "POST", body: payload, auth: false }),
  me: () => request("/auth/me"),

  // ---- donations ----
  listDonations: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/donations${qs ? `?${qs}` : ""}`, { auth: false });
  },
  getDonation: (id) => request(`/donations/${id}`, { auth: false }),
  createDonation: (payload) => request("/donations", { method: "POST", body: payload }),
  claimDonation: (id) => request(`/donations/${id}/claim`, { method: "POST" }),
  completeDonation: (id) => request(`/donations/${id}/complete`, { method: "POST" }),

  // ---- dashboards ----
  donorStats: () => request("/dashboard/donor"),
  ngoStats: () => request("/dashboard/ngo"),
};
