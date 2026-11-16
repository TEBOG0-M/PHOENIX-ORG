import { boot, icon, $, $$, esc, backend, imgSrc, money, pct, isOpen, sortMissions, root, BRAND } from "./app.js";

$$("[data-i]").forEach((el) => (el.outerHTML = icon(el.dataset.i)));
await boot();

const box = $("#featured");
try {
  const missions = sortMissions(await backend.db.list("missions")).filter(isOpen);
  // The manager can flag one mission as "featured". Otherwise show the open mission that is least funded so far.
  const m = missions.find((x) => x.featured) || [...missions].sort((a, b) => pct(a.raised, a.fundingTarget) - pct(b.raised, b.fundingTarget))[0];
  if (!m) throw new Error("none");
  const need = Math.max(0, (m.volunteersNeeded || 0) - (m.enrolled || 0));
  box.innerHTML = `<article class="feature-mission">
    <img src="${imgSrc(m.image)}" alt="${esc(m.title)}">
    <div class="feature-body">
      <span class="loc">${icon("map-pin")} ${esc(m.location || "")}</span>
      <h3>${esc(m.title)}</h3>
      <p>${esc(m.summary)}</p>
      <div class="fund-box"><div class="t">Funding Goal: ${money(m.fundingTarget)}</div>
        <div class="bar"><i style="width:${pct(m.raised, m.fundingTarget)}%"></i></div>
        <div class="r"><span>${money(m.raised)} raised to date</span><span>${icon("users")} ${need} Volunteers Needed for shift intake</span></div></div>
      <div class="feature-actions">
        <a class="btn btn-primary" href="${root}pages/donate.html?mission=${encodeURIComponent(m.id)}">Support This Mission (Donate)</a>
        <a class="btn btn-outline-light" href="${root}pages/missions.html#${encodeURIComponent(m.id)}">View Full Mission Details</a>
        <a class="link-arrow" href="${root}pages/volunteer.html">Apply for Shift Intake →</a>
      </div></div></article>`;
} catch (e) {
  box.innerHTML = `<div class="empty">${icon("compass")}<h3>New missions are being prepared</h3><p>Check back soon — or <a href="${root}pages/contact.html">get in touch</a> to hear about upcoming deployments with ${esc(BRAND.name)}.</p></div>`;
}
