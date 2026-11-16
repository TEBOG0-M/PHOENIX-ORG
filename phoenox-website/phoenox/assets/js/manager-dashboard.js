// Manager dashboard: totals, mission management (create / edit / end / reopen), volunteer applications, broadcasts.
import { backend, requireRole, mountShell, $, $$, esc, icon, money, fmtDate, imgSrc, pct, isOpen, missionState, sortMissions, statePill, avatar, openModal, confirmBox, toast, notify, queueEmails, timeAgo, todayISO, fileToDataURL, friendlyError, root } from "./app.js";
import { sampleMissions } from "./seed.js";

const session = await requireRole(["manager"]);
if (!session) throw new Error("redirecting");
const { user, profile } = session;
const main = await mountShell(session, { active: "overview" });

const SECTORS = ["Emergency Shelter & Respite", "Vocational Training & Livelihoods", "Legal & Identity Support", "Housing & Reintegration", "Health & Trauma Care", "Outreach & Welfare Search", "Disaster Response"];
const CADENCES = ["Night Watch (20:00 – 04:00)", "Day Shift (09:00 – 17:00)", "Clinic Hours (09:00 – 14:00)", "Flexible (by appointment)", "Rapid Response"];
const STATUSES = [["started", "Started"], ["ongoing", "Ongoing"], ["ended", "Ended"]];
const SECTOR_ICON = { "Emergency Shelter & Respite": "bed", "Vocational Training & Livelihoods": "wrench", "Legal & Identity Support": "scale", "Housing & Reintegration": "home" };

let missions = [], users = [], donations = [], apps = [], filter = "all";
const mById = () => Object.fromEntries(missions.map((m) => [m.id, m]));
const siteLink = () => new URL(root + "pages/missions.html", location.href).href;

async function load() {
  [missions, users, donations, apps] = await Promise.all([backend.db.list("missions"), backend.db.list("users"), backend.db.list("donations"), backend.db.list("applications")]);
}

function stats() {
  const volunteers = users.filter((u) => u.role === "volunteer").length;
  const intentions = donations.filter((d) => d.status === "completed" || d.status === "successful");

  const donorIds = new Set(
    users
      .filter((u) => u.role === "donor")
      .map((u) => "u:" + u.id)
  );

  intentions.forEach((d) => {
    if (d.uid) {
      donorIds.add("u:" + d.uid);
    } else if (!d.anonymous && d.email) {
      donorIds.add("e:" + d.email.toLowerCase());
    }
  });

  return {
    volunteers,
    donors: donorIds.size,
    anon: intentions.filter((d) => d.anonymous).length,
    funds: intentions.reduce(
      (sum, d) => sum + (Number(d.amountZAR) || 0),
      0
    ),
    gifts: intentions.length
  };
}

function render() {
  const s = stats(), byId = mById();
  const list = sortMissions(missions), shown = filter === "active" ? list.filter(isOpen) : list;
  const pending = apps
    .filter((a) => a.status === "pending")
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  const first = (profile.name || "").split(" ")[0] || "Manager";

  main.innerHTML = `
  <section class="welcome dark"><div><h1>Operations &amp; Management Command</h1><p>Welcome back, <b>${esc(profile.name)}</b></p>
    <div class="acts"><button class="btn btn-gold" id="create">${icon("plus")} Create New Mission</button><button class="btn btn-outline-light" id="broadcast">${icon("megaphone")} Broadcast Notice</button></div></div></section>

  <section class="stats" style="grid-template-columns:repeat(auto-fit,minmax(200px,1fr))">
    <div class="stat"><small>Volunteers</small><span class="ic">${icon("users")}</span><b>${s.volunteers.toLocaleString("en-ZA")}</b><p>Registered volunteer accounts</p></div>
    <div class="stat"><small>Donors</small><span class="ic gold">${icon("heart-handshake")}</span><b>${s.donors.toLocaleString("en-ZA")}</b><p>${s.anon ? `Plus ${s.anon} anonymous gift${s.anon === 1 ? "" : "s"}` : "Registered &amp; named donors"}</p></div>
    <div class="stat"><small>Total donations (demo)</small><span class="ic">${icon("banknote")}</span><b class="gold">${money(s.funds)}</b><p>${s.gifts} completed simulated transaction${s.gifts === 1 ? "" : "s"} · ZAR converted at fixed rates</p></div>
    <div class="stat"><small>Missions</small><span class="ic">${icon("compass")}</span><b>${missions.length}</b><p>${missions.filter(isOpen).length} accepting volunteers &amp; gifts</p></div>
  </section>

  <section><div class="mgr-head"><div><h2>Mission Management &amp; Dispatch Control</h2><p>Changing a mission's status or details updates the volunteer and donor dashboards immediately.</p></div>
      <div class="tabs" role="tablist"><button class="${filter === "all" ? "on" : ""}" data-tab="all">All (${list.length})</button><button class="${filter === "active" ? "on" : ""}" data-tab="active">Active (${list.filter(isOpen).length})</button></div></div>
    <div class="callout" style="margin:18px 0;background:var(--gold-soft);border-color:#f3dca3;color:var(--amber-ink)">${icon("info")}<span><b>Autonomous safeguard:</b> when a mission is set to <b>Ended</b>, volunteer applications close and donations are disabled for it. Setting it back to Started or Ongoing reopens it. Missions whose end date has passed are archived permanently.</span></div>
    <div class="panel flush">${shown.length ? `<div class="tbl-wrap"><table class="tbl mtable"><thead><tr><th>Mission name</th><th>Timeline</th><th>Enrolled volunteers</th><th>Funding progress</th><th>Status</th><th></th></tr></thead><tbody>
      ${shown.map((m) => { const closed = missionState(m) === "closed", ended = m.status === "ended"; return `<tr>
        <td class="name"><div class="mrow"><img class="thumb" src="${imgSrc(m.image)}" alt="" loading="lazy"><div><b>${esc(m.title)}</b><small>${esc(m.sector || "")}${m.location ? " · " + esc(m.location) : ""}</small></div></div></td>
        <td class="nowrap">${fmtDate(m.startDate, false)} – ${fmtDate(m.endDate)}</td>
        <td><div class="mini-bar"><div class="t"><span>${m.enrolled || 0} / ${m.volunteersNeeded || 0}</span><span class="muted">${pct(m.enrolled, m.volunteersNeeded)}%</span></div><div class="bar"><i style="width:${pct(m.enrolled, m.volunteersNeeded)}%"></i></div></div></td>
        <td><div class="mini-bar"><div class="t"><span>${money(m.raised)}</span><span class="muted">of ${money(m.fundingTarget)}</span></div><div class="bar gold"><i style="width:${pct(m.raised, m.fundingTarget)}%"></i></div></div></td>
        <td>${statePill(m)}</td>
        <td class="nowrap">${closed ? `<span class="muted small">${icon("lock")} Archived</span>` : `<button class="btn btn-soft btn-xs" data-edit="${m.id}">${icon("pencil")} Edit</button> <button class="btn ${ended ? "btn-deep" : "btn-ghost"} btn-xs" data-toggle="${m.id}">${ended ? "Reopen" : "End mission"}</button>`}</td></tr>`; }).join("")}</tbody></table></div>`
      : `<div class="empty" style="margin:30px">${icon("compass")}<h3>${missions.length ? "No active missions" : "No missions yet"}</h3><p>${missions.length ? "Switch to “All” to see every mission." : "Create your first mission, or load the four sample missions from the design to try the dashboards."}</p>
        ${missions.length ? "" : `<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap"><button class="btn btn-deep btn-sm" id="empty-create">${icon("plus")} Create a mission</button><button class="btn btn-soft btn-sm" id="seed">Load sample missions</button></div>`}</div>`}</div></section>

  <section><h2 class="sec-title" id="queue-title">Pending Volunteer Applications <span class="count-pill" ${pending.length ? "" : "hidden"}>${pending.length} pending</span></h2><div style="height:16px"></div>
    ${pending.length ? `<div class="queue">${pending.map((a) => {
      const m = byId[a.missionId];
      const ended = !m || !isOpen(m);
      const full = m && (m.enrolled || 0) >= (m.volunteersNeeded || Infinity);
      const expired = a.date < todayISO();
      return `<article class="queue-item">
      <div class="top">${avatar({ name: a.name }, "")}<div><h4>${esc(a.name)}</h4><div class="req">Requested: ${esc(a.missionTitle)}</div></div><span class="when">Applied ${timeAgo(a.createdAt)}</span></div>
      <div class="shift">Shift day: ${fmtDate(a.date)}${a.email ? ` · ${esc(a.email)}` : ""}${a.phone ? ` · ${esc(a.phone)}` : ""}</div>
      ${a.note ? `<p class="small muted" style="margin:0 0 12px">“${esc(a.note)}”</p>` : ""}
      <div class="chips">${(a.skills || []).length ? a.skills.map((k) => `<span class="chip">${esc(k)}</span>`).join("") : `<span class="muted small">No skills listed</span>`}</div>
      <div class="acts"><button class="btn btn-danger-soft btn-sm" data-decide="declined" data-id="${a.id}">Decline</button><button class="btn btn-deep btn-sm" data-decide="accepted" data-id="${a.id}" ${ended || full || expired ? "disabled" : ""}>Accept Application</button>
        ${ended
          ? `<span class="small muted" style="align-self:center">Mission closed</span>`
          : full
            ? `<span class="small muted" style="align-self:center">Mission is full</span>`
            : expired
              ? `<span class="small muted" style="align-self:center">Requested shift date has passed</span>`
              : ""}</div></article>`;
    }).join("")}</div>`
      : `<div class="empty">${icon("check-circle")}<h3>You're all caught up</h3><p>New volunteer applications will appear here and in your notifications.</p></div>`}
  </section>`;
  wire();
}

// ───────── announcements (in-app notification + queued email to every volunteer and donor)
async function announce({ title, body, audience = "everyone", missionId }) {
  const targets = users.filter((u) => (audience === "everyone" ? ["volunteer", "donor"].includes(u.role) : u.role === audience));
  const text = `${body}\n\nView it here: ${siteLink()}`;
  if (audience === "everyone") { await notify({ audience: "volunteer", title, body, missionId }); await notify({ audience: "donor", title, body, missionId }); }
  else await notify({ audience, title, body, missionId });
  const sent = await queueEmails(targets.map((u) => u.email), title, text);
  return sent;
}
const emailNote = (n) => `${n} email${n === 1 ? "" : "s"} queued${backend.mode === "demo" ? " (demo mode: nothing is actually sent)" : ""}.`;

// ───────── mission editor
function openMissionModal(m) {
  const editing = !!m; const today = todayISO();
  const opts = (list, cur) => (list.includes(cur) || !cur ? list : [cur, ...list]).map((v) => `<option value="${esc(v)}" ${v === cur ? "selected" : ""}>${esc(v)}</option>`).join("");
  let image = m?.image || "";
  const modal = openModal({
    title: editing ? "Edit Mission" : "Deploy New Humanitarian Mission", subtitle: editing ? "Changes appear on the volunteer and donor dashboards straight away." : "Define mission parameters, volunteer quota, and funding targets.", wide: true, dark: true,
    body: `<form id="mm" novalidate><div class="form-msg error" id="mm-err" hidden role="alert"></div>
      <h3 class="modal-sec">${icon("briefcase")} 1. Mission identification &amp; core details</h3>
      <div class="row-2"><div class="field"><label for="mm-title">Mission name <span class="req">*</span></label><input class="control" id="mm-title" maxlength="90" value="${esc(m?.title || "")}" placeholder="e.g. Project Dawn: Winter Shelter Expansion"></div>
        <div class="field"><label for="mm-sector">Sector category <span class="req">*</span></label><select class="control" id="mm-sector">${opts(SECTORS, m?.sector || SECTORS[0])}</select></div></div>
      <div class="field"><label for="mm-summary">Description <span class="req">*</span> <small>(shown to volunteers and donors)</small></label><textarea class="control" id="mm-summary" rows="3" maxlength="500" placeholder="What is this mission, who does it help, and what will volunteers do?">${esc(m?.summary || "")}</textarea></div>

      <h3 class="modal-sec">${icon("map-pin")} 2. Timeline &amp; location</h3>
      <div class="row-3"><div class="field"><label for="mm-start">Start date <span class="req">*</span></label><input class="control" type="date" id="mm-start" value="${m?.startDate || today}"></div>
        <div class="field"><label for="mm-end">End date <span class="req">*</span></label><input class="control" type="date" id="mm-end" value="${m?.endDate || ""}"></div>
        <div class="field"><label for="mm-cad">Shift cadence</label><select class="control" id="mm-cad">${opts(CADENCES, m?.cadence || CADENCES[1])}</select></div></div>
      <div class="field"><label for="mm-loc">Deployment hub / location</label><input class="control" id="mm-loc" maxlength="120" value="${esc(m?.location || "")}" placeholder="e.g. Zone 3 Emergency Heating Corridor"></div>

      <h3 class="modal-sec">${icon("users")} 3. Volunteers, funding &amp; status</h3>
      <div class="row-3"><div class="field"><label for="mm-vol">Volunteers required <span class="req">*</span></label><input class="control" type="number" id="mm-vol" min="1" max="10000" step="1" value="${m?.volunteersNeeded || ""}" placeholder="20"></div>
        <div class="field"><label for="mm-fund">Funding required (ZAR) <span class="req">*</span></label><input class="control" type="number" id="mm-fund" min="1" max="100000000" step="1" value="${m?.fundingTarget || ""}" placeholder="250000"></div>
        <div class="field"><label for="mm-status">Status <span class="req">*</span></label><select class="control" id="mm-status">${STATUSES.map(([v, l]) => `<option value="${v}" ${(m?.status || "started") === v ? "selected" : ""}>${l}</option>`).join("")}</select></div></div>
      <div class="field"><label>Mission picture</label><div class="img-drop"><div id="mm-prev">${image ? `<img src="${imgSrc(image)}" alt="Mission picture preview">` : `<div class="ph">${icon("image")}</div>`}</div>
        <div><input type="file" id="mm-file" accept="image/*" style="display:none"><button type="button" class="btn btn-soft btn-sm" id="mm-pick">${icon("image")} ${image ? "Replace picture" : "Upload picture"}</button> ${image ? `<button type="button" class="btn btn-ghost btn-xs" id="mm-clear">Remove</button>` : ""}<p class="hint" style="margin:8px 0 0">JPG or PNG. It's resized automatically.</p></div></div></div>
      <label class="check" style="display:flex;gap:10px;align-items:flex-start;margin:6px 0 14px"><input type="checkbox" id="mm-feature" ${m?.featured ? "checked" : ""} style="margin-top:4px"><span><b>Feature on the homepage</b><br><small class="muted">Shows this mission in the large “Active Humanitarian Mission” spotlight. Only one mission can be featured.</small></span></label>
      <label class="check" style="display:flex;gap:10px;align-items:flex-start;margin-top:6px"><input type="checkbox" id="mm-notify" checked style="margin-top:4px"><span><b>Notify volunteers &amp; donors</b><br><small class="muted">Sends an in-app notification and queues an email to every volunteer and donor.</small></span></label>
    </form>`,
    footer: `<button class="btn btn-ghost" type="button" data-x>Cancel</button><button class="btn btn-deep" type="button" id="mm-save">${editing ? "Save changes" : "Deploy mission"}</button>`,
  });
  const el = modal.el, err = $("#mm-err", el), g = (id) => $("#" + id, el);
  $("[data-x]", el).onclick = modal.close;
  const fail = (t) => { err.textContent = t; err.hidden = false; err.scrollIntoView({ block: "nearest" }); };
  const refreshImg = () => { $("#mm-prev", el).innerHTML = image ? `<img src="${imgSrc(image)}" alt="Mission picture preview">` : `<div class="ph">${icon("image")}</div>`; };
  g("mm-pick").onclick = () => g("mm-file").click();
  g("mm-file").onchange = async (e) => { try { image = await fileToDataURL(e.target.files[0], 1000, 0.78); refreshImg(); } catch (x) { fail(x.message); } };
  $("#mm-clear", el)?.addEventListener("click", () => { image = ""; refreshImg(); });

  g("mm-save").onclick = async () => {
    err.hidden = true;
    const v = { title: g("mm-title").value.trim(), sector: g("mm-sector").value, summary: g("mm-summary").value.trim(), startDate: g("mm-start").value, endDate: g("mm-end").value,
      cadence: g("mm-cad").value, location: g("mm-loc").value.trim(), volunteersNeeded: Math.floor(+g("mm-vol").value), fundingTarget: Math.floor(+g("mm-fund").value), status: g("mm-status").value };
    if (v.title.length < 3) return fail("Give the mission a name (at least 3 characters).");
    if (v.summary.length < 20) return fail("Add a short description (at least 20 characters).");
    if (!v.startDate || !v.endDate) return fail("Choose both a start and an end date.");
    if (v.endDate < v.startDate) return fail("The end date can't be before the start date.");
    if (v.endDate < today) return fail("The end date can't be in the past. A mission whose dates have passed closes permanently.");
    if (!(v.volunteersNeeded >= 1)) return fail("Enter how many volunteers are required (1 or more).");
    if (!(v.fundingTarget >= 1)) return fail("Enter the funding required in rand (1 or more).");
    if (editing && v.volunteersNeeded < (m.enrolled || 0)) return fail(`${m.enrolled} volunteers are already accepted, so the requirement can't be lower than that.`);
    if (!STATUSES.some(([k]) => k === v.status)) return fail("Choose a status.");
    const btn = g("mm-save"); btn.disabled = true; btn.textContent = "Saving…";
    try {
      const rec = { ...v, image, featured: g("mm-feature").checked, updatedAt: new Date().toISOString() };
      let id = m?.id;
      if (editing) await backend.db.update("missions", id, rec);
      else id = await backend.db.add("missions", { ...rec, raised: 0, enrolled: 0, createdAt: rec.updatedAt, createdBy: user.uid });
      if (rec.featured) for (const o of missions.filter((x) => x.featured && x.id !== id)) await backend.db.update("missions", o.id, { featured: false }); // one spotlight at a time
      let msg = editing ? "Mission updated." : "Mission published to volunteers and donors.";
      if (g("mm-notify").checked) {
        const verb = !editing ? "New mission" : v.status === "ended" && m.status !== "ended" ? "Mission ended" : "Mission update";
        const body = !editing ? `${v.title} is now open: ${v.summary}` : v.status === "ended" ? `${v.title} has ended and is no longer accepting volunteers or donations.` : `${v.title} has been updated. Dates: ${fmtDate(v.startDate)} – ${fmtDate(v.endDate)}.`;
        try { msg += " " + emailNote(await announce({ title: `${verb}: ${v.title}`, body, missionId: id })); } catch (e) { console.warn(e); msg += " (Notifications could not be sent.)"; }
      }
      modal.close(); toast(msg); await load(); render();
    } catch (e) { console.error(e); btn.disabled = false; btn.textContent = editing ? "Save changes" : "Deploy mission"; fail(friendlyError(e)); }
  };
}

function openBroadcast() {
  const modal = openModal({ title: "Broadcast Notice", subtitle: "Send a message to your volunteers, donors, or both.", dark: true,
    body: `<div class="form-msg error" id="bc-err" hidden></div>
      <div class="field"><label for="bc-aud">Send to</label><select class="control" id="bc-aud"><option value="everyone">Everyone (volunteers &amp; donors)</option><option value="volunteer">Volunteers only</option><option value="donor">Donors only</option></select></div>
      <div class="field"><label for="bc-title">Subject <span class="req">*</span></label><input class="control" id="bc-title" maxlength="90" placeholder="e.g. Cold front warning: extra night shifts needed"></div>
      <div class="field"><label for="bc-body">Message <span class="req">*</span></label><textarea class="control" id="bc-body" rows="5" maxlength="800"></textarea></div>`,
    footer: `<button class="btn btn-ghost" data-x>Cancel</button><button class="btn btn-deep" id="bc-go">${icon("megaphone")} Send notice</button>` });
  const el = modal.el; $("[data-x]", el).onclick = modal.close;
  $("#bc-go", el).onclick = async () => {
    const title = $("#bc-title", el).value.trim(), body = $("#bc-body", el).value.trim(), err = $("#bc-err", el);
    if (title.length < 3 || body.length < 10) { err.textContent = "Add a subject and a message (at least 10 characters)."; err.hidden = false; return; }
    const btn = $("#bc-go", el); btn.disabled = true;
    try { const n = await announce({ title, body, audience: $("#bc-aud", el).value }); modal.close(); toast("Notice sent. " + emailNote(n)); }
    catch (e) { btn.disabled = false; err.textContent = friendlyError(e); err.hidden = false; }
  };
}

function wire() {
  $("#create").onclick = () => openMissionModal(null);
  $("#broadcast").onclick = openBroadcast;
  $("#empty-create")?.addEventListener("click", () => openMissionModal(null));
  $("#seed")?.addEventListener("click", async (e) => {
    e.target.disabled = true;
    try { for (const { key, ...m } of sampleMissions()) await backend.db.add("missions", { ...m, createdAt: new Date().toISOString(), createdBy: user.uid }); toast("Sample missions loaded."); await load(); render(); }
    catch (x) { toast(friendlyError(x), "err"); e.target.disabled = false; }
  });
  $$("[data-tab]", main).forEach((b) => b.onclick = () => { filter = b.dataset.tab; render(); });
  $$("[data-edit]", main).forEach((b) => b.onclick = () => openMissionModal(missions.find((m) => m.id === b.dataset.edit)));

  $$("[data-toggle]", main).forEach((b) => b.onclick = async () => {
    const m = missions.find((x) => x.id === b.dataset.toggle); if (!m) return;
    const ending = m.status !== "ended";
    if (!(await confirmBox(ending ? `End “${m.title}”? Volunteers won't be able to apply and donors won't be able to give until you reopen it.` : `Reopen “${m.title}” for volunteers and donors?`, ending ? "End mission" : "Reopen"))) return;
    try {
      await backend.db.update("missions", m.id, { status: ending ? "ended" : "ongoing", updatedAt: new Date().toISOString() });
      let msg = ending ? "Mission ended." : "Mission reopened.";
      try { msg += " " + emailNote(await announce({ title: ending ? `Mission ended: ${m.title}` : `Mission reopened: ${m.title}`, body: ending ? `${m.title} has ended and is no longer accepting volunteers or donations.` : `${m.title} is open again for volunteers and donations.`, missionId: m.id })); } catch (e) { console.warn(e); }
      toast(msg); await load(); render();
    } catch (e) { toast(friendlyError(e), "err"); }
  });

  $$("[data-decide]", main).forEach((b) => b.onclick = async () => {
    const a = apps.find((x) => x.id === b.dataset.id);
    const accept = b.dataset.decide === "accepted";

    if (!a) return;

    if (!accept) {
      if (!(await confirmBox(
        `Decline ${a.name}'s application for ${fmtDate(a.date)}?`,
        "Decline"
      ))) return;
    }

    b.disabled = true;

    try {
      const decidedAt = new Date().toISOString();

      if (accept) {
        await backend.db.acceptApplication(
          a.id,
          a.missionId,
          todayISO(),
          decidedAt
        );
      } else {
        // Refresh the application so an old dashboard cannot overwrite
        // a decision that another manager has already made.
        const latest = await backend.db.get("applications", a.id);

        if (!latest || latest.status !== "pending") {
          throw new Error("This application has already been reviewed.");
        }

        await backend.db.update("applications", a.id, {
          status: "declined",
          decidedAt
        });
      }

      const title = accept
        ? "Application accepted"
        : "Application declined";

      const body = accept
        ? `You're confirmed for “${a.missionTitle}” on ${fmtDate(a.date)}. Thank you for serving.`
        : `Your application for “${a.missionTitle}” on ${fmtDate(a.date)} wasn't accepted this time. You're welcome to apply for another day or mission.`;

      await notify({
        toUid: a.uid,
        title,
        body,
        missionId: a.missionId
      }).catch(() => {});

      if (a.email) {
        await queueEmails([a.email], title, body).catch(() => {});
      }

      toast(accept
        ? `${a.name} accepted.`
        : `${a.name} declined.`
      );

      await load();
      render();

    } catch (e) {
      console.error(e);
      b.disabled = false;
      toast(friendlyError(e), "err");
    }
  });
}

try { await load(); render(); backend.db.update("users", user.uid, { lastActive: new Date().toISOString() }).catch(() => {}); }
catch (e) { console.error(e); main.innerHTML = `<div class="empty">${icon("info")}<h3>We couldn't load the dashboard</h3><p>${esc(friendlyError(e))}</p></div>`; }