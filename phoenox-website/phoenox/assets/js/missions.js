import { boot, backend, $, $$, esc, icon, imgSrc, money, pct, fmtDate, isOpen, missionState, statePill, sortMissions, toast, root } from "./app.js";
import { loadMyApps, openApplyModal, applyBlock } from "./apply.js";

const { user, profile } = await boot();
const grid = $("#mission-grid"), note = $("#mc-note");
let missions = [], apps = [], filter = "open";

const load = async () => {
  missions = sortMissions(await backend.db.list("missions"));
  apps = user && profile?.role === "volunteer" ? await loadMyApps(user.uid) : [];
};

function card(m) {
  const open = isOpen(m), state = missionState(m);
  const mine = apps.filter((a) => a.missionId === m.id && a.status !== "declined").sort((a, b) => a.date.localeCompare(b.date));
  const dates = m.startDate && m.endDate ? `${fmtDate(m.startDate)} – ${fmtDate(m.endDate)}` : "";
  return `<article class="mission-card ${open ? "" : "is-closed"}" id="${esc(m.id)}">
    <div class="mc-top">${statePill(m)}<span class="d">${icon("calendar")} ${dates}</span></div>
    <h3>${esc(m.title)}</h3><p>${esc(m.summary)}</p>
    <div class="mc-img"><img src="${imgSrc(m.image)}" alt="" loading="lazy"><span>${icon("map-pin")} ${esc(m.location || "")}</span></div>
    <div class="mc-fund">
      <div class="row"><b>${icon("banknote")} Funding Secured</b><span class="small muted">${pct(m.raised, m.fundingTarget)}%</span></div>
      <div class="bar"><i style="width:${pct(m.raised, m.fundingTarget)}%"></i></div>
      <div class="row"><b>${money(m.raised)} raised</b><span class="small muted">Target: ${money(m.fundingTarget)}</span></div><hr>
      <div class="row"><span class="small">${icon("users")} Volunteers enrolled:</span><span class="v">${m.enrolled || 0} / ${m.volunteersNeeded || 0} registered</span></div>
      ${mine.length ? `<div class="row" style="margin-top:8px"><span class="small muted">Your applications</span><span class="small">${mine.map((a) => `<span class="pill pill-${a.status}" style="margin-left:4px">${fmtDate(a.date, false)} · ${a.status}</span>`).join("")}</span></div>` : ""}
    </div>
    <div class="mc-actions">
      ${open ? `<a class="btn btn-deep" href="${root}pages/donate.html?mission=${encodeURIComponent(m.id)}">${icon("heart")} Support This Mission</a>` : `<span class="btn btn-ghost" aria-disabled="true">${icon("lock")} ${state === "ended" ? "Mission ended" : "Mission closed"}</span>`}
      <button class="btn btn-ghost" type="button" data-apply="${esc(m.id)}" ${open ? "" : "disabled"}>Apply to Volunteer</button>
    </div></article>`;
}

function render() {
  const list = missions.filter((m) => (filter === "open" ? isOpen(m) : !isOpen(m)));
  note.textContent = filter === "closed" ? "Missions whose dates have passed or that have been ended are kept here for the record. They can't be joined or funded." : "";
  grid.innerHTML = list.length ? list.map(card).join("") : `<div class="empty" style="grid-column:1/-1">${icon("compass")}<h3>${filter === "open" ? "No active missions right now" : "No archived missions yet"}</h3><p>${filter === "open" ? "New missions are announced here — and by email to our donors and volunteers." : "Completed missions will appear here."}</p></div>`;
  if (location.hash) document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView({ block: "center" });
}

try { await load(); } catch (e) { console.error(e); grid.innerHTML = `<div class="empty" style="grid-column:1/-1">${icon("info")}<h3>We couldn't load missions</h3><p>Please check your connection and try again.</p></div>`; throw e; }
const hashed = location.hash && missions.find((m) => m.id === decodeURIComponent(location.hash.slice(1)));
if (hashed && !isOpen(hashed)) { filter = "closed"; $$(".tabs button").forEach((b) => b.classList.toggle("on", b.dataset.f === "closed")); }
render();

$$(".tabs button").forEach((b) => b.addEventListener("click", () => { filter = b.dataset.f; $$(".tabs button").forEach((x) => x.classList.toggle("on", x === b)); render(); }));

grid.addEventListener("click", async (e) => {
  const btn = e.target.closest("[data-apply]"); if (!btn) return;
  const m = missions.find((x) => x.id === btn.dataset.apply);
  if (!user) { location.href = `${root}pages/login.html?next=missions.html%23${encodeURIComponent(m.id)}`; return; }
  if (profile?.role !== "volunteer") return toast(profile?.role === "manager" ? "Manager accounts coordinate missions rather than volunteering." : profile?.role === "member" ? "You're signed in as a regular member, which can't volunteer. Register a volunteer account to apply." : "You're signed in with a donor account. Volunteer applications need a volunteer account.", "err");  const block = applyBlock(m, apps); if (block) return toast(block, "err");
  openApplyModal({ mission: m, session: { user, profile }, apps, onDone: async () => { await load(); render(); } });
});
