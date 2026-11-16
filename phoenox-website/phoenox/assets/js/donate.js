import { boot, backend, $, $$, esc, icon, money, fmtDate, imgSrc, avatar, isOpen, sortMissions, friendlyError, queueEmails, dashboardUrl, root, BRAND } from "./app.js";
import { processDonation, GENERAL } from "./donations.js";

const { user, profile } = await boot();

// ── "Where your support goes" tiers (ZAR with approximate USD — illustrative only)
const TIERS = [
  ["R150", "$10", "Could help support warm, nutritious meals, clean hydration, and basic emergency shelter supplies."],
  ["R500", "$30", "Could help support essential safety gear, starter vocational toolkits, or skills training workshops."],
  ["R1,500", "$90", "Could help support vital documentation recovery, legal aid referrals, and advocacy services for displaced families."],
  ["R3,500", "$210", "Could help support transitional accommodation assistance and basic household essentials during recovery."],
];
$("#tiers").innerHTML = TIERS.map(([z, u, t]) => `<div class="tier"><b>${z}<small>/ ${u}</small></b><p>${esc(t)}</p></div>`).join("");

// ── state
const PRESETS = { ZAR: [250, 500, 1000, 2500], USD: [15, 30, 60, 150], EUR: [15, 30, 60, 140] };
const SYM = { ZAR: "R", USD: "$", EUR: "€" };
const st = { freq: "once", cur: "ZAR", amount: 500, method: "card" };
const form = $("#donate-form"), msg = $("#form-msg"), sel = $("#mission"), anon = $("#anon");
const say = (t, type = "error") => { msg.textContent = t; msg.className = "form-msg " + type; msg.hidden = !t; };

// ── missions
let missions = [];
try { missions = sortMissions(await backend.db.list("missions")).filter(isOpen); } catch (e) { console.warn(e); }
sel.innerHTML = `<option value="${GENERAL.id}">General Crisis Fund (Deploy where most urgently needed)</option>` + missions.map((m) => `<option value="${esc(m.id)}">${esc(m.title)}</option>`).join("");
const wanted = new URLSearchParams(location.search).get("mission");
if (wanted) {
  if (missions.some((m) => m.id === wanted)) sel.value = wanted;
  else say("That mission is no longer accepting donations — you can give to another mission or the General Crisis Fund.", "error");
}

// ── signed-in donors: details are already saved
if (user) {
  $("#identity").hidden = true;
  $("#given-as").innerHTML = `<div class="given-as">${avatar(profile, "xs")}<span>Giving as <b>${esc(profile?.name || user.email)}</b><br><small class="muted">Your saved details are used for this gift and it appears in your donation history.</small></span></div>`;
}

// ── amount UI
function drawAmounts() {
  $("#cur-sym").textContent = SYM[st.cur]; $("#m-sym").textContent = SYM[st.cur];
  $("#amounts").innerHTML = PRESETS[st.cur].map((v, i) => `<button type="button" class="amt ${st.amount === v && !$("#custom").value ? "on" : ""}" data-v="${v}">${i === 1 ? '<span class="pop">POPULAR</span>' : ""}${SYM[st.cur]}${v.toLocaleString("en-ZA").replace(/\u00a0/g, ",")}</button>`).join("");
  $$("#currency button").forEach((b) => b.classList.toggle("on", b.dataset.cur === st.cur));
  const amountText = st.amount > 0 ? ` (${money(st.amount, st.cur)}${st.freq === "monthly" ? "/mo" : ""})` : "";
  $("#submit").innerHTML = `${st.freq === "monthly" ? "Record Monthly Pledge" : "Donate (Simulated)"}${amountText} ${icon("arrow-right")}`;
}
$("#amounts").addEventListener("click", (e) => { const b = e.target.closest(".amt"); if (!b) return; st.amount = +b.dataset.v; $("#custom").value = ""; $("#amt-err").textContent = ""; drawAmounts(); });
$("#custom").addEventListener("input", (e) => { const v = Math.floor(+e.target.value); st.amount = v > 0 ? v : 0; $("#amt-err").textContent = ""; drawAmounts(); });
$("#currency").addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; st.cur = b.dataset.cur; if (!$("#custom").value) st.amount = PRESETS[st.cur][1]; drawAmounts(); });
$("#methods").addEventListener("click", (e) => { const b = e.target.closest(".method"); if (!b) return; st.method = b.dataset.m; $$(".method").forEach((x) => x.classList.toggle("on", x === b)); });

// ── frequency & anonymity (anonymous gifts can't be monthly: we need contact details to follow up)
const freqBtns = $$(".seg [data-freq]"), hint = $("#freq-hint");
function setFreq(f) { st.freq = f; freqBtns.forEach((b) => b.classList.toggle("on", b.dataset.freq === f)); $("#monthly-wrap").hidden = f !== "monthly"; drawAmounts(); }
freqBtns.forEach((b) => b.addEventListener("click", () => setFreq(b.dataset.freq)));
anon.addEventListener("change", () => {
  const a = anon.checked;
  $("#contact-fields").hidden = a;
  freqBtns[1].disabled = a; hint.hidden = !a; hint.textContent = "Anonymous gifts can’t be monthly — we need your details to coordinate a recurring intention.";
  if (a && st.freq === "monthly") setFreq("once");
});
drawAmounts();

// ── submit
form.addEventListener("submit", async (e) => {
  e.preventDefault(); say("");
  if (!(st.amount > 0)) { $("#amt-err").textContent = "Choose or enter an amount."; return; }
  if (st.amount > 1000000) { $("#amt-err").textContent = "For gifts above 1,000,000 please contact us so we can arrange this securely."; return; }
  const isAnon = !user && anon.checked;
  let monthly = st.amount; $("#mon-err").textContent = "";
  if (st.freq === "monthly") { monthly = Math.floor(+$("#monthly-amt").value) || st.amount; if (!(monthly > 0) || monthly > 1000000) { $("#mon-err").textContent = "Enter a monthly amount between 1 and 1,000,000."; return; } }
  const d = { name: user ? profile?.name || user.displayName || "" : $("#d-name").value.trim(), email: user ? user.email : $("#d-email").value.trim(), phone: user ? profile?.phone || "" : $("#d-phone").value.trim() };
  if (!user && !isAnon) {
    if (d.name.length < 2) return say("Please enter your full name, or tick “anonymous”.");
    if (!/^\S+@\S+\.\S+$/.test(d.email)) return say("Please enter a valid email address, or tick “anonymous”.");
    if (d.phone.replace(/\D/g, "").length < 7) return say("Please enter a phone number, or tick “anonymous”.");
  }
  const mission = missions.find((m) => m.id === sel.value);
  if (sel.value !== GENERAL.id && !mission) return say("That mission is closed. Please choose another allocation.");

  const btn = $("#submit"), label = btn.innerHTML; btn.disabled = true; btn.textContent = "Processing simulated payment…";
  try {
    await new Promise((r) => setTimeout(r, 700)); // simulated latency
    const rec = { uid: user?.uid || null, anonymous: isAnon, ...d, missionId: sel.value, missionTitle: mission ? mission.title : GENERAL.title, amount: st.amount, monthlyAmount: monthly, currency: st.cur, type: st.freq, method: st.method };
    const res = await processDonation(rec);
    if (!isAnon && d.email) queueEmails([d.email], `Thank you for your support — ${BRAND.name}`, `Dear ${d.name || "friend"},\n\nThank you for your support. Your ${st.freq === "monthly" ? "monthly " : ""}contribution intention of ${money(st.amount, st.cur)} to ${rec.missionTitle} has been recorded.\nReference: ${res.reference}\n\nThis is an academic demonstration: no real money was collected or deducted.`).catch(() => {});
    showSuccess(rec, res);
  } catch (err) { console.error(err); say(friendlyError(err)); btn.disabled = false; btn.innerHTML = label; }
});

function showSuccess(r, res) {
  const methodLabel = { card: "Card", eft: "Instant EFT", snapscan: "SnapScan" }[r.method];
  $("#console").innerHTML = `<div class="success-box"><div class="tick">${icon("check")}</div><h2>Thank you for your support${r.anonymous ? "" : r.name ? ", " + esc(r.name.split(" ")[0]) : ""}.</h2>
    <p><b>${r.type === "monthly" ? "Monthly pledge recorded" : "Simulated payment completed"}.</b> Your ${r.type === "monthly" ? "monthly pledge (no automatic debit)" : "demo donation"} has been recorded${r.anonymous ? " anonymously" : ""} and is now reflected on the dashboards${r.type === "monthly" ? "" : " and mission progress"}.</p>
    <p class="muted">Academic demonstration — no real money was collected or deducted.</p>
    <div class="receipt">
      <div><span>Reference</span><b>${esc(res.reference)}</b></div>
      <div><span>Status</span><b>${res.status === "completed" ? "Completed (DEMO)" : "Pledged (pending)"}</b></div>
      <div><span>Converted</span><b>R${res.amountZAR.toLocaleString("en-ZA")} @ ${res.rate}</b></div>
      <div><span>Amount</span><b>${money(r.amount, r.currency)}</b></div>
      <div><span>Allocated to</span><b>${esc(r.missionTitle)}</b></div>
      <div><span>Frequency</span><b>${r.type === "monthly" ? "Monthly sustainer" : "Once-off"}</b></div>
      <div><span>Contribution details</span><b>${methodLabel} (preferred method)</b></div>
      ${r.type === "monthly" ? `<div><span>Monthly intention</span><b>${money(r.monthlyAmount, r.currency)} / month (recurring intention)</b></div>` : ""}
      <div><span>Date</span><b>${fmtDate(new Date())}</b></div>
    </div>
    <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">${user ? `<a class="btn btn-deep" href="${dashboardUrl(profile?.role)}">View my dashboard</a>` : `<a class="btn btn-deep" href="${root}pages/register.html">Create an account to track your giving</a>`}<a class="btn btn-ghost" href="${root}pages/donate.html">Make another donation</a></div></div>`;
  $("#console").scrollIntoView({ behavior: "smooth", block: "center" });
}