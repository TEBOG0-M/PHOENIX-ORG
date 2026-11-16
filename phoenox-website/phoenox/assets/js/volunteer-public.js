import { boot, backend, $, esc, icon, imgSrc, fmtDate, isOpen, sortMissions, root } from "./app.js";
const { profile } = await boot();
const box = $("#vol-missions");
try {
  const list = sortMissions(await backend.db.list("missions")).filter(isOpen).filter((m) => (m.enrolled || 0) < (m.volunteersNeeded || 0));
  box.innerHTML = list.length ? list.slice(0, 6).map((m) => `<article class="card news-card" style="cursor:default">
      <img src="${imgSrc(m.image)}" alt="" loading="lazy"><div class="b">
      <div class="meta">${icon("calendar")} ${fmtDate(m.startDate, false)} – ${fmtDate(m.endDate)}</div>
      <h3>${esc(m.title)}</h3><p>${esc((m.summary || "").slice(0, 120))}…</p>
      <p class="small"><b>${Math.max(0, (m.volunteersNeeded || 0) - (m.enrolled || 0))}</b> volunteer places open</p>
      <a class="link-arrow" style="margin-top:auto" href="${root}pages/${profile?.role === "volunteer" ? "volunteer-dashboard" : "missions"}.html#${esc(m.id)}">${profile?.role === "volunteer" ? "Apply in my dashboard" : "View mission"} →</a></div></article>`).join("")
    : `<div class="empty" style="grid-column:1/-1">${icon("heart-handshake")}<h3>All current missions are fully staffed</h3><p>New volunteer places open whenever a manager launches a mission — create an account to be notified.</p></div>`;
} catch (e) { box.innerHTML = `<div class="empty" style="grid-column:1/-1">${icon("info")}<h3>Missions couldn't be loaded</h3></div>`; }
