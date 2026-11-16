// Volunteer dashboard: profile skills & availability, available missions, application pipeline, history.
import { backend, requireRole, mountShell, $, $$, esc, icon, fmtDate, imgSrc, isOpen, missionState, sortMissions, avatar, toast, confirmBox, todayISO, timeAgo, friendlyError, root } from "./app.js";
import { loadMyApps, openApplyModal, applyBlock } from "./apply.js";
import { isoDate } from "./seed.js";

const session = await requireRole(["volunteer"]);
if (!session) throw new Error("redirecting");
const { user } = session;
let profile = session.profile;
session.profile = profile;
const main = await mountShell(session, { active: "overview" });

const SKILL_SUGGESTIONS = ["First Aid Level 1", "First Aid Level 3", "Trauma Counselling", "Crisis De-escalation", "Food Preparation & Hygiene", "Carpentry & Trades",
  "Sewing & Tailoring", "Spanish & English Translation", "isiZulu / Sesotho Translation", "Legal Aid Support", "Driving (Code 10)", "Child Care", "Tutoring", "IT & Coding", "Social Work"];
const AVAIL = ["Weekday Evenings", "Saturday Mornings", "Sunday On-call Rapid Response"];

let missions = [], apps = [];
const mById = () => Object.fromEntries(missions.map((m) => [m.id, m]));

async function load() {
  [missions, apps] = await Promise.all([backend.db.list("missions"), loadMyApps(user.uid)]);
  apps.sort((a, b) => String(a.date).localeCompare(String(b.date)));
}

const dayLabel = (iso) => {
  if (iso === todayISO()) return "Today";
  if (iso === isoDate(1)) return "Tomorrow";
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("en-ZA", { weekday: "long", day: "2-digit", month: "short" });
};
const statusPill = (s) => ({
  pending: `<span class="pill pill-pending"><i class="dot"></i>Pending Review</span>`,
  accepted: `<span class="pill pill-accepted"><i class="dot"></i>Accepted</span>`,
  declined: `<span class="pill pill-declined"><i class="dot"></i>Declined</span>`,
  withdrawn: `<span class="pill pill-muted"><i class="dot"></i>Withdrawn</span>`,
}[s] || `<span class="pill pill-muted">${esc(s || "Unknown")}</span>`);

function render() {
  const today = todayISO(), byId = mById();
  // A shift that has passed (or whose mission window has closed) is history: read-only, never reopened.
  const isHist = (a) => a.date < today || (byId[a.missionId] && missionState(byId[a.missionId]) === "closed");
  const current = apps.filter((a) => !isHist(a)), history = apps.filter(isHist).sort((a, b) => String(b.date).localeCompare(String(a.date)));
  const deployments = current.filter((a) => a.status === "accepted" && byId[a.missionId] && missionState(byId[a.missionId]) !== "ended");
  const completed = history.filter((a) => a.status === "accepted").length;
  const pending = current.filter((a) => a.status === "pending").length;
  const open = sortMissions(missions).filter(isOpen);
  const first = (profile.callSign || profile.name || "").split(" ")[0];
  const skills = profile.skills || [], avail = profile.availability || [];

  main.innerHTML = `
  <section class="welcome"><div class="who">${avatar(profile, "lg")}<div><h1>Welcome back, ${esc(first)}</h1><span class="sub">${icon("shield-check")} Field Volunteer${completed ? ` · ${completed} mission${completed === 1 ? "" : "s"} completed` : ""}</span></div></div>
    <a class="btn btn-deep btn-lg" href="#available" id="browse">${icon("compass")} Browse Shifts</a></section>
  <div class="callout">${icon("shield")}<span><b>Deployment rule:</b> you can take part in several missions, but only <b>one mission per calendar day</b>. When a mission's dates pass it closes and moves to your history for good. Applications wait for a coordinator to accept or decline.</span></div>

  <section class="stats">
    <div class="stat"><small>Completed missions</small><span class="ic">${icon("check-circle")}</span><b>${String(completed).padStart(2, "0")} <span>missions</span></b></div>
    <div class="stat"><small>Confirmed shifts</small><span class="ic gold">${icon("calendar")}</span><b class="gold">${String(deployments.length).padStart(2, "0")} <span>scheduled</span></b></div>
    <div class="stat"><small>Active applications</small><span class="ic">${icon("hourglass")}</span><b>${String(pending).padStart(2, "0")} <span>waiting for decision</span></b></div>
  </section>

  <div class="two-col">
    <div class="col">
      <section><h2 class="sec-title">Active &amp; Confirmed Deployments</h2><div style="height:16px"></div>
        ${deployments.length ? deployments.map((a) => { const m = byId[a.missionId]; return `<article class="deploy"><div>
            <span class="pill pill-accepted"><i class="dot"></i>Accepted / Confirmed</span><h3>${esc(a.missionTitle)}</h3>
            <div class="meta">${icon("calendar")} ${esc(dayLabel(a.date))}${m.cadence ? ` · ${esc(m.cadence)}` : ""}</div>
            ${m.location ? `<div class="meta g">${icon("map-pin")} ${esc(m.location)}</div>` : ""}
            <div class="role"><b>Sector:</b> ${esc(m.sector || "Field operations")}</div></div>
            <img src="${imgSrc(m.image)}" alt="" loading="lazy"></article>`; }).join("")
          : `<div class="empty">${icon("calendar")}<h3>No confirmed shifts yet</h3><p>Apply for a mission below. Once a coordinator accepts, your shift appears here.</p></div>`}
      </section>

      <section class="panel flush"><div class="panel-head"><div><small>Applications</small><h2>Application Pipeline</h2></div></div>
        ${current.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Mission</th><th>Shift day</th><th>Submitted</th><th>Status</th><th></th></tr></thead><tbody>
          ${current.map((a) => `<tr><td><b>${esc(a.missionTitle)}</b></td><td class="nowrap">${fmtDate(a.date)}</td><td class="nowrap muted">${timeAgo(a.createdAt)}</td>
            <td>${statusPill(a.status)}${a.status === "declined" ? `<small>You can apply for a different day.</small>` : ""}${byId[a.missionId] && missionState(byId[a.missionId]) === "ended" ? `<small>Mission ended by coordinator</small>` : ""}</td>
            <td>${a.status === "pending" ? `<button class="btn btn-ghost btn-xs" data-withdraw="${a.id}">Withdraw</button>` : ""}</td></tr>`).join("")}</tbody></table></div>`
          : `<div class="empty" style="margin:0 30px 30px">${icon("list")}<h3>No applications in progress</h3><p>Missions you apply for will be tracked here until a decision is made.</p></div>`}
      </section>

      <section class="panel flush"><div class="panel-head"><div><small>Closed · archived</small><h2>Mission History</h2></div></div>
        <div class="callout tbl-note" style="margin-top:20px">${icon("lock")}<span>Once a mission's date has passed it is closed and kept here for your records only. It can't be reopened.</span></div>
        ${history.length ? `<div class="tbl-wrap" style="margin-top:20px"><table class="tbl"><thead><tr><th>Mission</th><th>Shift day</th><th>Outcome</th></tr></thead><tbody>
          ${history.map((a) => `<tr><td><b>${esc(a.missionTitle)}</b></td><td class="nowrap">${fmtDate(a.date)}</td><td>${a.status === "accepted"
  ? `<span class="pill pill-successful"><i class="dot"></i>Completed</span>`
  : a.status === "declined"
    ? statusPill("declined")
    : a.status === "withdrawn"
      ? statusPill("withdrawn")
      : `<span class="pill pill-closed"><i class="dot"></i>Closed · not reviewed</span>`}</td></tr>`).join("")}</tbody></table></div>`
          : `<div class="empty" style="margin:20px 30px 30px">${icon("clock")}<h3>Nothing in your history yet</h3><p>Completed and expired missions will be archived here.</p></div>`}
      </section>
    </div>

    <div class="col">
      <section class="panel"><div class="panel-head" style="margin-bottom:10px"><div><h2 class="sm">Credentials &amp; Availability</h2></div><a class="btn btn-soft btn-xs" href="${root}pages/account.html">${icon("pencil")} Edit Profile</a></div>
        <div class="kv"><span>Legal name</span><span>${esc(profile.name || "—")}</span></div>
        <div class="kv"><span>Mobile</span><span>${esc(profile.phone || "Add your number")}</span></div>
        <div class="kv"><span>Operational zone</span><span>${esc(profile.zone || profile.address || "Add your area")}</span></div>
        <div class="kv"><span>Emergency contact</span><span>${esc(profile.emergencyContact || "Not provided")}</span></div>

        <div class="panel-head" style="margin:22px 0 10px;align-items:center"><h3 style="font-size:1rem;font-family:var(--font)">Skill Badges</h3><button class="btn btn-ghost btn-xs" id="add-skill-toggle" type="button">${icon("plus-circle")} Add Skill</button></div>
        <div id="skills">${skills.length ? skills.map((s, i) => `<span class="chip skill-badge">${esc(s)}<button type="button" data-rm="${i}" aria-label="Remove ${esc(s)}">${icon("x")}</button></span>`).join("") : `<p class="muted small">No skills added yet. Skills help coordinators place you where you're most useful.</p>`}</div>
        <form class="skill-edit" id="skill-form" hidden><input class="control" id="skill-in" list="skill-list" maxlength="40" placeholder="e.g. First Aid Level 2" aria-label="New skill" autocomplete="off"><datalist id="skill-list">${SKILL_SUGGESTIONS.map((s) => `<option value="${esc(s)}">`).join("")}</datalist><button class="btn btn-deep btn-sm" type="submit">Add</button></form>

        <h3 style="font-size:1rem;font-family:var(--font);margin:22px 0 10px">Availability Cadence</h3>
        ${AVAIL.map((a) => { const on = avail.includes(a); return `<button type="button" class="avail ${on ? "" : "off"}" data-avail="${esc(a)}" aria-pressed="${on}"><span><i class="dot"></i>${esc(a)}</span><span class="st">${on ? "ACTIVE" : "INACTIVE"}</span></button>`; }).join("")}
      </section>

      <section class="panel" id="available"><div class="panel-head" style="margin-bottom:6px"><div><h2 class="sm">Available Missions</h2></div></div>
        <p class="muted small" style="margin-bottom:16px">Open missions you can apply for. Pick any day inside a mission's dates that you haven't already booked.</p>
        ${open.length ? open.map((m) => {
          const block = applyBlock(m, apps), left = Math.max(0, (m.volunteersNeeded || 0) - (m.enrolled || 0));
          const mine = current.filter((a) => a.missionId === m.id && a.status !== "declined");
          return `<div class="avail-mission ${block ? "lock" : ""}"><div class="top"><h4>${esc(m.title)}</h4><span class="pill ${left ? "pill-gold" : "pill-muted"}">${left ? `${left} slot${left === 1 ? "" : "s"} open` : "Full"}</span></div>
            <p style="margin:6px 0 4px;display:flex;gap:6px;align-items:center;color:var(--teal-deep)">${icon("calendar")} ${fmtDate(m.startDate, false)} – ${fmtDate(m.endDate)}</p>
            <p>${esc(m.sector || "")}${m.cadence ? ` · ${esc(m.cadence)}` : ""}</p>
            <div class="row">${block ? `<span class="bad">${icon("ban")} ${esc(block)}</span><button class="btn btn-ghost btn-xs" disabled>Locked</button>`
              : `<span class="ok">${icon("check-circle")} ${mine.length ? `${mine.length} day${mine.length === 1 ? "" : "s"} booked here` : "No conflict detected"}</span><button class="btn btn-deep btn-xs" data-apply="${m.id}">Apply for Shift</button>`}</div></div>`;
        }).join("") : `<div class="empty">${icon("compass")}<h3>No open missions right now</h3><p>You'll get a notification when a new mission is published.</p></div>`}
      </section>
    </div>
  </div>`;
  wire();
}

async function saveProfile(patch, okMsg) {
  try { await backend.db.update("users", user.uid, patch); profile = { ...profile, ...patch }; session.profile = profile; if (okMsg) toast(okMsg); render(); }
  catch (e) { console.error(e); toast(friendlyError(e), "err"); }
}

function wire() {
  $("#browse").addEventListener("click", (e) => { e.preventDefault(); $("#available").scrollIntoView({ behavior: "smooth", block: "start" }); });

  $("#add-skill-toggle").onclick = () => { const f = $("#skill-form"); f.hidden = !f.hidden; if (!f.hidden) $("#skill-in").focus(); };
  $("#skill-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const v = $("#skill-in").value.trim().replace(/\s+/g, " "), list = profile.skills || [];
    if (v.length < 2) return toast("Enter a skill (at least 2 characters).", "err");
    if (list.some((s) => s.toLowerCase() === v.toLowerCase())) return toast("You've already added that skill.", "err");
    if (list.length >= 20) return toast("You can list up to 20 skills.", "err");
    saveProfile({ skills: [...list, v] }, "Skill added.");
  });
  $$("[data-rm]", main).forEach((b) => b.onclick = () => saveProfile({ skills: (profile.skills || []).filter((_, i) => i !== +b.dataset.rm) }, "Skill removed."));
  $$("[data-avail]", main).forEach((b) => b.onclick = () => {
    const cur = profile.availability || [], k = b.dataset.avail;
    saveProfile({ availability: cur.includes(k) ? cur.filter((x) => x !== k) : [...cur, k] });
  });

  $$("[data-apply]", main).forEach((b) => b.onclick = () => {
    const m = missions.find((x) => x.id === b.dataset.apply); if (!m) return;
    openApplyModal({ mission: m, session: { user, profile }, apps, onDone: async () => { await load(); render(); } });
  });
  $$("[data-withdraw]", main).forEach((b) => b.onclick = async () => {
    const a = apps.find((x) => x.id === b.dataset.withdraw);
    if (!a) return;

    if (!(await confirmBox(
      `Withdraw your application for “${a.missionTitle}” on ${fmtDate(a.date)}?`,
      "Withdraw"
    ))) return;

    b.disabled = true;

    try {
      await backend.db.withdrawApplication(
        a.id,
        user.uid,
        new Date().toISOString()
      );

      toast("Application withdrawn.");
      await load();
      render();
    } catch (e) {
      console.error(e);
      b.disabled = false;
      toast(friendlyError(e), "err");
    }
  });
}

try {
  await load(); render();
  backend.db.update("users", user.uid, { lastActive: new Date().toISOString() }).catch(() => {});
  // ?apply=<missionId> (from the public Missions page) opens the apply form straight away.
  const want = new URLSearchParams(location.search).get("apply");
  if (want) { const m = missions.find((x) => x.id === want); if (m) { const block = applyBlock(m, apps); block ? toast(block, "err") : openApplyModal({ mission: m, session: { user, profile }, apps, onDone: async () => { await load(); render(); } }); } }
} catch (e) { console.error(e); main.innerHTML = `<div class="empty">${icon("info")}<h3>We couldn't load your dashboard</h3><p>${esc(friendlyError(e))}</p></div>`; }