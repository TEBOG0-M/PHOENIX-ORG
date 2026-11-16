// Donations & monthly pledges.
// PAYMENTS ARE SIMULATED: no real money moves. A once-off gift is recorded as a
// "completed" DEMO transaction (simulated: true) so every dashboard and mission
// progress bar reflects it. Monthly gifts stay as pending pledges (no recurring provider).
import { backend, inc } from "./backend.js";
import { toZAR, notify } from "./app.js";
import { FX } from "./config.js";

export const GENERAL = { id: "general", title: "General Crisis Fund" };
export const isCompleted = (d) => d.status === "completed" || d.status === "successful";

/** Human-friendly demo transaction reference, e.g. PHX-K3J9-2M4Q */
const makeRef = () => {
  const r = () => Math.random().toString(36).slice(2, 6).toUpperCase();
  return `PHX-${r()}-${r()}`;
};

/** Add one calendar month to an ISO date, clamping to the end of shorter months. */
export function addMonth(iso, day) {
  const d = new Date(iso + "T12:00:00"); const want = day || d.getDate();
  d.setDate(1); d.setMonth(d.getMonth() + 1);
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(); d.setDate(Math.min(want, last));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * input: { uid?, anonymous, name, email, phone, missionId, missionTitle, amount, monthlyAmount?, currency, type: "once"|"monthly", method }
 */
export async function processDonation(input) {
  const anonymousOnceOff = input.anonymous === true && input.type === "once";
  if (!input.uid && !anonymousOnceOff) throw new Error("Please sign in with a donor account. Only anonymous once-off contributions can be made without an account.");
  if (input.anonymous && input.type === "monthly") throw new Error("Anonymous contributions can only be once-off.");

  const amount = Number(input.amount);
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("Please enter a valid contribution amount.");

  const now = new Date().toISOString();
  const rate = FX[input.currency] || 1;
  const amountZAR = toZAR(amount, input.currency);
  const missionId = input.missionId || GENERAL.id;
  const missionTitle = input.missionTitle || GENERAL.title;
  const reference = makeRef();
  const once = input.type === "once";
  let pledgeId = input.pledgeId || null;

  // Monthly: a pledge (intention) only — no automatic debit exists.
  if (input.type === "monthly" && !pledgeId) {
    const monthlyAmount = Number(input.monthlyAmount || amount);
    if (!Number.isFinite(monthlyAmount) || monthlyAmount <= 0) throw new Error("Please enter a valid monthly contribution amount.");
    pledgeId = await backend.db.add("pledges", {
      uid: input.uid, name: input.name || "", email: input.email || "",
      missionId, missionTitle, amount: monthlyAmount, currency: input.currency,
      amountZAR: toZAR(monthlyAmount, input.currency), status: "pending", createdAt: now,
    });
  }

  const id = await backend.db.add("donations", {
    uid: input.uid || null,
    anonymous: anonymousOnceOff,
    name: anonymousOnceOff ? "Anonymous" : (input.name || ""),
    email: anonymousOnceOff ? "" : (input.email || ""),
    phone: anonymousOnceOff ? "" : (input.phone || ""),
    missionId, missionTitle, amount, currency: input.currency, amountZAR,
    exchangeRate: rate, type: input.type, method: input.method || "",
    reference, simulated: true,
    status: once ? "completed" : "pending",
    completedAt: once ? now : null,
    pledgeId, createdAt: now,
  });

  // Once-off: push the money into the mission's funding bar (everyone sees it).
  if (once && missionId !== GENERAL.id) {
    try { await backend.db.update("missions", missionId, { raised: inc(amountZAR) }); }
    catch (e) { console.warn("mission progress not updated", e); }
  }

  // Notify the manager team (and confirm to the donor in-app).
  const who = anonymousOnceOff ? "An anonymous donor" : (input.name || "A donor");
  const R = (n) => "R" + Number(n).toLocaleString("en-ZA");
  await notify({
    audience: "manager",
    title: once ? "New simulated donation" : "New monthly pledge",
    body: `${who} ${once ? "gave" : "pledged"} ${input.currency} ${amount.toLocaleString("en-ZA")} (${R(amountZAR)}) to ${missionTitle}. Ref ${reference}.`,
    missionId: missionId === GENERAL.id ? null : missionId,
  }).catch((e) => console.warn("notify manager", e));
  if (input.uid) {
    await notify({
      toUid: input.uid,
      title: once ? "Donation received (demo)" : "Monthly pledge recorded",
      body: `${once ? "Your simulated gift" : "Your pledge"} of ${R(amountZAR)} to ${missionTitle} was recorded. Ref ${reference}. No real money was collected.`,
      missionId: missionId === GENERAL.id ? null : missionId,
    }).catch(() => {});
  }

  return { id, pledgeId, amountZAR, reference, rate, status: once ? "completed" : "pending" };
}

/** Recurring payments are not implemented (no payment provider). */
export async function runDuePledges() { return 0; }
