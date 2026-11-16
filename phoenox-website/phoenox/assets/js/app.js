// ─────────────────────────────────────────────────────────────
//  PHOENOX — shared UI helpers (header, footer, dashboard shell, modals, mission rules)
// ─────────────────────────────────────────────────────────────
import { BRAND, FX, CURRENCY_SYMBOL } from "./config.js";
import { backend } from "./backend.js";
import { isoDate } from "./seed.js";

export { backend, BRAND };
export const root = document.body.dataset.root || "";
export const page = document.body.dataset.page || "";

// ───────────── tiny helpers
export const $ = (sel, el = document) => el.querySelector(sel);
export const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export const todayISO = () => isoDate(0);
export const initials = (name) => (name || "?").replace(/^(Dr\.?|Mr\.?|Ms\.?|Mrs\.?)\s+/i, "").split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

export function money(amount, currency = "ZAR", opts = {}) {
  const sym = CURRENCY_SYMBOL[currency] || currency + " ";
  const n = Number(amount) || 0;
  // Comma grouping (R250,000) to match the design.
  const txt = n.toLocaleString("en-US", { maximumFractionDigits: opts.decimals ?? 0, minimumFractionDigits: opts.decimals ?? 0 });
  return sym + txt;
}
export const toZAR = (amount, currency) => Math.round((Number(amount) || 0) * (FX[currency] || 1));
export function compactMoney(n) { n = Number(n) || 0; return n >= 1000 ? "R" + (n / 1000).toLocaleString("en-US", { maximumFractionDigits: 1 }) + "k" : "R" + n; }

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export function fmtDate(v, withYear = true) {
  if (!v) return "—";
  const d = typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? new Date(v + "T12:00:00") : new Date(v);
  if (isNaN(d)) return "—";
  return `${String(d.getDate()).padStart(2, "0")} ${MONTHS[d.getMonth()]}${withYear ? " " + d.getFullYear() : ""}`;
}
export function timeAgo(v) {
  const s = (Date.now() - new Date(v).getTime()) / 1000;
  if (isNaN(s)) return "";
  if (s < 3600) return Math.max(1, Math.round(s / 60)) + "m ago";
  if (s < 86400) return Math.round(s / 3600) + "h ago";
  if (s < 86400 * 7) return Math.round(s / 86400) + "d ago";
  return fmtDate(v);
}
export const imgSrc = (p) => (!p ? root + "assets/img/winter-relief.jpg" : /^(data:|https?:|blob:)/.test(p) ? p : root + p);
export const nl2br = (s) => esc(s).replace(/\n/g, "<br>");

// ───────────── icons (Lucide-style, stroke currentColor)
const P = {
  check: '<path d="M20 6 9 17l-5-5"/>',
  "check-circle": '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
  heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
  "heart-handshake": '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/><path d="M12 5 9.04 7.96a2.17 2.17 0 0 0 0 3.08c.82.82 2.13.85 3 .07l2.07-1.9a2.82 2.82 0 0 1 3.79 0l2.96 2.66"/>',
  shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
  "shield-check": '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
  zap: '<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
  calendar: '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>',
  "map-pin": '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  lock: '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
  at: '<circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8"/>',
  key: '<path d="m21 2-9.6 9.6"/><circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-3 3"/>',
  eye: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
  "eye-off": '<path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.53 13.53 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/>',
  "arrow-right": '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  "arrow-up-right": '<path d="M7 7h10v10"/><path d="M7 17 17 7"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
  "log-out": '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/>',
  dashboard: '<rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>',
  clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
  "plus-circle": '<circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  pencil: '<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>',
  briefcase: '<path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/><rect width="20" height="14" x="2" y="6" rx="2"/>',
  banknote: '<rect width="20" height="12" x="2" y="6" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/>',
  home: '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  scale: '<path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>',
  globe: '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
  wrench: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
  bed: '<path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/>',
  pause: '<rect x="14" y="4" width="4" height="16" rx="1"/><rect x="6" y="4" width="4" height="16" rx="1"/>',
  play: '<polygon points="6 3 20 12 6 21 6 3"/>',
  card: '<rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/>',
  landmark: '<line x1="3" x2="21" y1="22" y2="22"/><line x1="6" x2="6" y1="18" y2="11"/><line x1="10" x2="10" y1="18" y2="11"/><line x1="14" x2="14" y1="18" y2="11"/><line x1="18" x2="18" y1="18" y2="11"/><polygon points="12 2 20 7 4 7"/>',
  qr: '<rect width="5" height="5" x="3" y="3" rx="1"/><rect width="5" height="5" x="16" y="3" rx="1"/><rect width="5" height="5" x="3" y="16" rx="1"/><path d="M21 16h-3a2 2 0 0 0-2 2v3"/><path d="M21 21v.01"/><path d="M12 7v3a2 2 0 0 1-2 2H7"/><path d="M3 12h.01"/><path d="M12 3h.01"/><path d="M12 16v.01"/><path d="M16 12h1"/><path d="M21 12v.01"/><path d="M12 21v-1"/>',
  megaphone: '<path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
  chevron: '<path d="m6 9 6 6 6-6"/>',
  compass: '<circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>',
  ban: '<circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/>',
  graduation: '<path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>',
  hourglass: '<path d="M5 22h14"/><path d="M5 2h14"/><path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"/><path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"/>',
  list: '<rect width="8" height="4" x="8" y="2" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/>',
  phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>',
  refresh: '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
  image: '<rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>',
  trash: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  award: '<circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>',
  star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
  newspaper: '<path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6Z"/>',
};
export const icon = (name, cls = "") => `<svg class="i ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[name] || P.info}</svg>`;

// ───────────── friendly errors
const ERR = {
  "auth/invalid-credential": "Incorrect email or password.",
  "auth/wrong-password": "Incorrect email or password.",
  "auth/user-not-found": "Incorrect email or password.",
  "auth/invalid-email": "Enter a valid email address.",
  "auth/user-disabled": "This account has been disabled.",
  "auth/email-already-in-use": "An account with this email already exists. Try signing in.",
  "auth/weak-password": "Choose a stronger password (at least 8 characters).",
  "auth/too-many-requests": "Too many attempts. Please wait a few minutes and try again.",
  "auth/network-request-failed": "Network error. Check your connection and try again.",
  "auth/popup-closed-by-user": "The Google sign-in window was closed before finishing.",
  "auth/popup-blocked": "Your browser blocked the sign-in popup. Allow popups and try again.",
  "auth/account-exists-with-different-credential": "That email is registered with a different sign-in method.",
  "permission-denied": "You don't have permission to do that. Check your Firestore security rules.",
};
export const friendlyError = (e) => ERR[e?.code] || (e?.code === "permission-denied" ? ERR["permission-denied"] : "Something went wrong. Please try again.");

// ───────────── session & profiles
// Regular members have no dashboard, so they go to the home page (sending them to a dashboard would loop).
export const dashboardUrl = (role) => role === "member" ? `${root}index.html` : `${root}pages/${role === "manager" ? "manager" : role === "volunteer" ? "volunteer" : "donor"}-dashboard.html`;

export async function getSession() {
  const user = backend.auth.current();
  if (!user) return { user: null, profile: null };
  let profile = null;
  try { profile = await backend.db.get("users", user.uid); } catch (e) { console.warn("Could not read profile", e); } // never let this break the page
  return { user, profile };
}
export async function createProfile(user, role, extra = {}) {
  const profile = {
    uid: user.uid, role, name: extra.name || user.displayName || (user.email || "").split("@")[0], email: user.email || "",
    phone: "", address: "", bio: "", callSign: "", skills: [], availability: [], createdAt: new Date().toISOString(), ...extra,
  };
  await backend.db.set("users", user.uid, profile);
  return { id: user.uid, ...profile };
}
/** Guard for dashboard pages. Redirects if signed out or wrong role. */
export async function requireRole(roles) {
  const s = await getSession();
  if (!s.user) { location.replace(`${root}pages/login.html?next=${encodeURIComponent(location.pathname.split("/").slice(-2).join("/"))}`); return null; }
  if (!s.profile) s.profile = await createProfile(s.user, "donor");
  if (roles && !roles.includes(s.profile.role)) { location.replace(dashboardUrl(s.profile.role)); return null; }
  return s;
}
export function safeNext(fallback) {
  const n = new URLSearchParams(location.search).get("next");
  if (n && /^(pages\/)?[a-z-]+\.html(\?.*)?$/.test(n)) return root + (n.startsWith("pages/") ? n : "pages/" + n);
  return fallback;
}

// ───────────── mission rules
export function missionState(m) {
  if (m.status === "ended") return "ended";
  if (m.endDate && m.endDate < todayISO()) return "closed"; // date expired → archived to history, never reopened
  return m.status || "ongoing";
}
export const isOpen = (m) => ["started", "ongoing"].includes(missionState(m));
export const STATE_LABEL = { started: "Started", ongoing: "Ongoing", ended: "Ended", closed: "Closed · Archived" };
export const statePill = (m) => { const s = missionState(m); return `<span class="pill pill-${s}"><i class="dot"></i>${STATE_LABEL[s]}</span>`; };
export const pct = (a, b) => (b > 0 ? Math.max(0, Math.min(100, Math.round((a / b) * 100))) : 0);
export const sortMissions = (list) => [...list].sort((a, b) => (isOpen(b) - isOpen(a)) || String(b.startDate).localeCompare(String(a.startDate)));

// ───────────── toast & modal
export function toast(msg, type = "ok") {
  let box = $("#toasts"); if (!box) { box = document.createElement("div"); box.id = "toasts"; document.body.append(box); }
  const t = document.createElement("div"); t.className = "toast toast-" + type; t.setAttribute("role", "status");
  t.innerHTML = `${icon(type === "err" ? "info" : "check-circle")}<span>${esc(msg)}</span>`;
  box.append(t); setTimeout(() => t.classList.add("out"), 3800); setTimeout(() => t.remove(), 4300);
}
export function openModal({ title, subtitle = "", body = "", footer = "", wide = false, dark = true }) {
  const back = document.createElement("div"); back.className = "modal-back";
  back.innerHTML = `<div class="modal ${wide ? "modal-wide" : ""}" role="dialog" aria-modal="true" aria-label="${esc(title)}">
    <header class="modal-head ${dark ? "" : "plain"}"><div><h2>${esc(title)}</h2>${subtitle ? `<p>${esc(subtitle)}</p>` : ""}</div>
      <button class="modal-x" type="button" aria-label="Close">${icon("x")}</button></header>
    <div class="modal-body">${body}</div>${footer ? `<footer class="modal-foot">${footer}</footer>` : ""}</div>`;
  document.body.append(back); document.body.classList.add("no-scroll");
  const close = () => { back.remove(); document.body.classList.remove("no-scroll"); document.removeEventListener("keydown", onKey); };
  const onKey = (e) => { if (e.key === "Escape") close(); };
  document.addEventListener("keydown", onKey);
  back.addEventListener("click", (e) => { if (e.target === back) close(); });
  $(".modal-x", back).addEventListener("click", close);
  setTimeout(() => $("input,select,textarea,button:not(.modal-x)", back)?.focus(), 30);
  return { el: back, close };
}
export function confirmBox(message, okLabel = "Confirm") {
  return new Promise((resolve) => {
    const m = openModal({ title: "Please confirm", body: `<p class="muted">${esc(message)}</p>`, dark: false,
      footer: `<button class="btn btn-ghost" data-no>Cancel</button><button class="btn btn-primary" data-yes>${esc(okLabel)}</button>` });
    $("[data-no]", m.el).onclick = () => { m.close(); resolve(false); };
    $("[data-yes]", m.el).onclick = () => { m.close(); resolve(true); };
  });
}

// ───────────── brand mark
export const logoMark = (cls = "") => `<img class="logo-mark ${cls}" src="${root}assets/logo.svg" alt="" width="40" height="40">`;
const brandLockup = (sub) => `<a class="brand" href="${root}index.html" aria-label="${BRAND.name} home">${logoMark()}<span class="brand-txt"><b>${BRAND.name}</b><small>${sub}</small></span></a>`;

// ───────────── public header / footer
const NAV = [
  ["home", "Home", "index.html"], ["about", "Our Mission", "pages/about.html"], ["missions", "Missions", "pages/missions.html"],
  ["news", "News & Updates", "pages/news.html"], ["volunteer", "Volunteer", "pages/volunteer.html"], ["contact", "Contact", "pages/contact.html"],
];

function demoBanner() {
  if (backend.mode !== "demo") return;
  const b = document.createElement("div"); b.className = "demo-banner";
  b.innerHTML = `${icon("info")}<span><b>Demo mode</b> — ${backend.fellBack ? "Firebase couldn't be reached, so data is saved in this browser only." : "data is saved in this browser only."}
    Try <code>manager@phoenox.demo</code>, <code>donor@phoenox.demo</code> or <code>volunteer@phoenox.demo</code> · password <code>Demo@1234</code></span>`;
  document.body.prepend(b);
}

export async function renderChrome() {
  demoBanner();
  // Draw the header & footer straight away (signed-out state) so they always appear,
  // then upgrade the Sign In link once we know who is signed in.
  let user = null, profile = null;
  const h = $("#site-header");
  if (h) {
    h.innerHTML = `<header class="site-header"><div class="wrap nav-row">
      ${brandLockup("RESTORING DIGNITY. REBUILDING LIVES.")}
      <button class="menu-toggle" type="button" aria-label="Open navigation menu" aria-expanded="false" aria-controls="main-nav"><span></span><span></span><span></span></button>
      <nav class="main-nav" id="main-nav" aria-label="Main">
        <div class="nav-links">${NAV.map(([k, l, href]) => `<a href="${root}${href}" class="${page === k ? "active" : ""}" ${page === k ? 'aria-current="page"' : ""}>${l}</a>`).join("")}</div>
        <div class="nav-actions">
          ${user ? `<a class="nav-signin" href="${dashboardUrl(profile?.role)}">${icon("dashboard")} My Dashboard</a>` : `<a class="nav-signin ${page === "login" ? "active" : ""}" href="${root}pages/login.html">Sign In</a>`}
          <a class="btn btn-primary btn-sm" href="${root}pages/donate.html">Donate</a>
        </div></nav></div></header>`;
    const btn = $(".menu-toggle", h), nav = $(".main-nav", h);
    btn.addEventListener("click", () => { const open = btn.getAttribute("aria-expanded") === "true"; btn.setAttribute("aria-expanded", String(!open)); nav.classList.toggle("open", !open); });
  }
  const f = $("#site-footer");
  if (f) {
    f.innerHTML = `<footer class="site-footer"><div class="wrap">
      <div class="footer-grid">
        <div class="footer-about">
          <a class="brand brand-light" href="${root}index.html">${logoMark("sm")}<b>${BRAND.name}</b></a>
          <p>An international humanitarian initiative dedicated to crisis intervention, emergency relief, and compassionate restoration for displaced families and resilient communities.</p>
          <blockquote class="motto">“${BRAND.motto}”</blockquote>
        </div>
        <div><h3>Explore</h3><a href="${root}index.html">Home Overview</a><a href="${root}pages/about.html">Our Heritage &amp; Values</a><a href="${root}pages/missions.html">Active Deployment Missions</a><a href="${root}pages/news.html">Press &amp; Field Dispatch</a></div>
        <div><h3>Get Involved</h3><a href="${root}pages/volunteer.html">Volunteer Application</a><a href="${root}pages/donate.html">Emergency Giving Fund</a><a href="${root}pages/contact.html">Contact Outreach Team</a></div>
      </div>
      <div class="footer-bottom"><p>Student Demo Platform — Designed strictly for academic, simulation, and demonstration purposes. No real money is processed — all payments are simulated.</p>
        <p>© 2026 ${BRAND.owner}. All rights reserved. ${BRAND.org} is owned by ${BRAND.owner}. · <a href="${root}pages/privacy.html">Privacy</a></p></div></div></footer>`;
  }
  try {
    ({ user, profile } = await Promise.race([getSession(), new Promise((res) => setTimeout(() => res({ user: null, profile: null }), 6000))]));
  } catch (e) { console.warn(e); }
  const link = $(".nav-signin", h || document);
  if (user && link) {
    const member = profile?.role === "member";
    link.outerHTML = `<a class="nav-signin" href="${member ? root + "pages/account.html" : dashboardUrl(profile?.role)}">${icon(member ? "user" : "dashboard")} ${member ? "My Account" : "My Dashboard"}</a>`;
  }
  return { user, profile };
}

// ───────────── dashboard shell (sidebar + top bar)
export async function mountShell(session, { active = "overview" } = {}) {
  const { profile, user } = session;
  const role = profile.role;
  const items = [["overview", "Overview", dashboardUrl(role), "dashboard"], ["profile", role === "donor" ? "Patron Profile" : role === "manager" ? "Profile" : "My Profile", `${root}pages/account.html`, "user"]].filter((i) => !(role === "member" && i[0] === "overview"));
  const sub = role === "manager" ? "OPERATIONS COMMAND" : "RELIEF COMMAND";
  $("#shell").innerHTML = `
    <aside class="side" id="side">
      <a class="brand" href="${root}index.html">${logoMark()}<span class="brand-txt"><b>${BRAND.name}</b><small>${sub}</small></span></a>
      <nav class="side-nav">${items.map(([k, l, href, ic]) => `<a href="${href}" class="${active === k ? "active" : ""}">${icon(ic)}<span>${l}</span></a>`).join("")}</nav>
      <div class="side-foot">
        <div class="protocol"><b>SANCTUARY PROTOCOL</b><em>“${BRAND.motto}”</em></div>
        <a class="side-link" href="${root}index.html">${icon("globe")} Return to Public Site</a>
      </div></aside>
    <div class="main-col">
      <div class="topbar">
        <button class="side-toggle" type="button" aria-label="Toggle menu" aria-controls="side">${icon("dashboard")}</button>
        <p class="topbar-quote">“${BRAND.motto}”</p>
        <div class="topbar-right"><div class="bell-wrap"><button class="bell" type="button" aria-label="Notifications" aria-expanded="false">${icon("bell")}<i class="bell-dot" hidden></i></button><div class="bell-panel" hidden></div></div>
          <a class="user-chip" href="${root}pages/account.html" title="Account settings">${avatar(profile, "xs")}<span>${esc(profile.name || user.email)}</span></a></div>
      </div>
      <main class="dash" id="main"></main></div>`;
  $(".side-toggle").onclick = () => $("#side").classList.toggle("open");
  mountBell(session);
  return $("#main");
}
export const avatar = (p, size = "") => p?.photo
  ? `<img class="avatar ${size}" src="${imgSrc(p.photo)}" alt="">`
  : `<span class="avatar ${size}" aria-hidden="true">${esc(initials(p?.name))}</span>`;

async function mountBell({ profile, user }) {
  const wrap = $(".bell-wrap"), btn = $(".bell", wrap), panel = $(".bell-panel", wrap), dot = $(".bell-dot", wrap);
  const seenKey = "phoenox.seen." + user.uid;
  let list = [];
  try {
    const [a, b, c] = await Promise.all([
      backend.db.list("notifications", [["audience", "==", profile.role]]),
      backend.db.list("notifications", [["audience", "==", "all"]]),
      backend.db.list("notifications", [["toUid", "==", user.uid]]),
    ]);
    list = [...a, ...b, ...c].sort((x, y) => String(y.createdAt).localeCompare(String(x.createdAt))).slice(0, 12);
  } catch (e) { console.warn("notifications", e); }
  let seen = ""; try { seen = localStorage.getItem(seenKey) || ""; } catch {}
  const unseen = list.filter((n) => String(n.createdAt) > seen).length;
  dot.hidden = !unseen;
  panel.innerHTML = `<h3>Notifications</h3>` + (list.length ? list.map((n) => `<div class="note"><b>${esc(n.title)}</b><p>${esc(n.body)}</p><small>${timeAgo(n.createdAt)}</small></div>`).join("") : `<p class="muted small">You're all caught up.</p>`);
  btn.onclick = (e) => {
    e.stopPropagation(); const open = panel.hidden; panel.hidden = !open; btn.setAttribute("aria-expanded", String(open));
    if (open) { dot.hidden = true; try { localStorage.setItem(seenKey, new Date().toISOString()); } catch {} }
  };
  document.addEventListener("click", (e) => { if (!wrap.contains(e.target)) { panel.hidden = true; btn.setAttribute("aria-expanded", "false"); } });
}

// ───────────── notifications & email (written to Firestore; the "Trigger Email" extension sends the mail)
export async function notify({ audience, toUid, title, body, missionId }) {
  await backend.db.add("notifications", { audience: audience || null, toUid: toUid || null, title, body, missionId: missionId || null, createdAt: new Date().toISOString() });
}
export async function queueEmails(recipients, subject, text) {
  const uniq = [...new Set(recipients.filter(Boolean))];
  await Promise.all(uniq.map((to) => backend.db.add("mail", {
    to, createdAt: new Date().toISOString(),
    message: { subject, text, html: `<div style="font-family:Arial,sans-serif;max-width:560px"><h2 style="color:#12404c">${esc(BRAND.name)}</h2><p>${esc(text).replace(/\n/g, "<br>")}</p><p style="color:#6b7f85;font-size:13px">“${esc(BRAND.motto)}”</p></div>` },
  }).catch((e) => console.warn("mail", e))));
  return uniq.length;
}

// ───────────── misc UI
export function pwToggle(root_ = document) {
  $$("[data-pw-toggle]", root_).forEach((b) => b.addEventListener("click", () => {
    const input = document.getElementById(b.dataset.pwToggle); const show = input.type === "password";
    input.type = show ? "text" : "password"; b.innerHTML = icon(show ? "eye-off" : "eye"); b.setAttribute("aria-label", show ? "Hide password" : "Show password");
  }));
}
export async function logout() { await backend.auth.signOut(); location.href = root + "index.html"; }

/** Resize an uploaded image in the browser and return a compact JPEG data-URL (keeps Firestore docs small; no paid Storage plan needed). */
export function fileToDataURL(file, maxW = 1000, quality = 0.78) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith("image/")) return reject(new Error("Please choose an image file."));
    const img = new Image(), url = URL.createObjectURL(file);
    img.onload = () => {
      const r = Math.min(1, maxW / img.width), c = document.createElement("canvas");
      c.width = Math.round(img.width * r); c.height = Math.round(img.height * r);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
      resolve(c.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => reject(new Error("That image couldn't be read."));
    img.src = url;
  });
}

/** Replace <i data-i="name"> placeholders with inline SVG icons. */
export function hydrateIcons(scope = document) { $$("[data-i]", scope).forEach((el) => (el.outerHTML = icon(el.dataset.i))); }

/** Standard page boot for public pages. */
export async function boot() { hydrateIcons(); const s = await renderChrome(); pwToggle(); return s; }

