import { backend, requireRole, mountShell, hydrateIcons, $, $$, esc, icon, money, fmtDate, imgSrc, isOpen, sortMissions, avatar, openModal, toast, timeAgo, root, friendlyError, toZAR } from "./app.js";

const session = await requireRole(["donor"]);
if (!session) throw new Error("redirecting");
const { user, profile } = session;
const main = await mountShell(session, { active: "overview" });

let missions = [], donations = [], pledges = [], notes = [];
const byId = () => Object.fromEntries(missions.map((m) => [m.id, m]));

async function load() {
  missions = await backend.db.list("missions");
  [donations, pledges] = await Promise.all([backend.db.list("donations", [["uid", "==", user.uid]]), backend.db.list("pledges", [["uid", "==", user.uid]])]);
  const [a, b, c] = await Promise.all([
    backend.db.list("notifications", [["audience", "==", "donor"]]),
    backend.db.list("notifications", [["audience", "==", "all"]]),
    backend.db.list("notifications", [["toUid", "==", user.uid]])
  ]);

  notes = [...new Map(
    [...a, ...b, ...c].map((n) => [n.id, n])
  ).values()]
    .sort((x, y) => String(y.createdAt).localeCompare(String(x.createdAt)))
    .slice(0, 5);
  donations.sort((x, y) => String(y.createdAt).localeCompare(String(x.createdAt)));
}

const typeLabel = (d) => (
  d.anonymous
    ? "Anonymous Once-Off Intention"
    : d.type === "monthly"
      ? "Monthly Intention"
      : "Once-Off Intention"
);

function render() {
  const intentions = donations.filter((d) => d.status === "completed" || d.status === "successful");
  const total = intentions.reduce((s, d) => s + (Number(d.amountZAR) || 0), 0);

  const supported = new Set(
    intentions
      .filter((d) => d.missionId && d.missionId !== "general")
      .map((d) => d.missionId)
  ).size;

  const monthlyIntentions = pledges.filter(
    (p) => p.status !== "cancelled"
  ).length;

  const activePledges = pledges.filter(
    (p) => p.status !== "cancelled"
  );
  const open = sortMissions(missions).filter(isOpen);
  const mById = byId();

  main.innerHTML = `
  <section class="welcome"><div>
      <h1>Welcome back, ${esc(profile.name)}</h1>
      <div class="life-chip">${icon("heart-handshake")}<span>Total donated (demo): <b>${money(total)}</b><br><small>${intentions.length} gift${intentions.length === 1 ? "" : "s"} completed · thank you</small></span></div></div>
    <a class="btn btn-deep btn-lg" href="${root}pages/donate.html">${icon("plus-circle")} Make a Contribution</a></section>

  <section class="stats">
    <div class="stat edge"><small>Total donated (demo)</small><span class="ic">${icon("banknote")}</span><b>${money(total)}</b><p>Completed simulated transactions</p></div>
    <div class="stat edge"><small>Missions selected</small><span class="ic">${icon("compass")}</span><b>${supported} Initiative${supported === 1 ? "" : "s"}</b><p>Selected across your intentions</p></div>
    <div class="stat edge"><small>Monthly intentions</small><span class="ic">${icon("users")}</span><b>${monthlyIntentions} <span>${monthlyIntentions === 1 ? "Intention" : "Intentions"}</span></b><p>No automatic payments are made</p></div>
  </section>

  <section class="panel" id="missions-panel"><div class="panel-head"><div><small>Where your gift can go next</small><h2>Missions open for support</h2></div><a class="link-arrow" href="${root}pages/missions.html">All missions →</a></div>
    ${open.length ? `<div class="cards-3" style="grid-template-columns:repeat(auto-fill,minmax(260px,1fr))">${open.map((m) => `<article class="card news-card" style="cursor:default"><img src="${imgSrc(m.image)}" alt="" loading="lazy"><div class="b">
        <h3 style="font-size:1.05rem">${esc(m.title)}</h3>
        <div class="small muted">
          ${Number(m.fundingTarget) > 0
            ? `Funding target: <b>${money(m.fundingTarget)}</b>`
            : "Funding target not specified"}
          <p style="margin-top:6px">
            Contribution intentions do not represent funds received.
          </p>
        </div>
        <div style="display:flex;gap:8px;margin-top:auto"><a class="btn btn-deep btn-sm" style="flex:1" href="${root}pages/donate.html?mission=${encodeURIComponent(m.id)}">Give once-off</a><a class="btn btn-soft btn-sm" style="flex:1" href="${root}pages/donate.html?mission=${encodeURIComponent(m.id)}&freq=monthly">Monthly</a></div></div></article>`).join("")}</div>`
      : `<div class="empty">${icon("compass")}<h3>No open missions right now</h3><p>You can still give to the General Crisis Fund.</p><a class="btn btn-deep btn-sm" href="${root}pages/donate.html">Give to the Crisis Fund</a></div>`}</section>

  <div class="two-col">
    <div class="col">
      <section class="panel"><div class="panel-head"><div><small>Pledge intentions</small><h2>My Monthly Intentions</h2></div>${activePledges.length ? `<span class="pill pill-active"><i class="dot"></i>Monthly intention</span>` : ""}</div>
        ${activePledges.length ? activePledges.map((p) => {
          return `<div class="pledge"><div class="l"><span class="ico">${icon(p.missionId === "general" ? "heart" : "home")}</span><div><h3>${money(p.amount, p.currency)} / month</h3><div class="m">${esc(p.missionTitle)}</div><small>No automatic payments are made</small></div></div>
            <div class="r"><span class="pill pill-pending"><i class="dot"></i>Pledge (no auto-debit)</span></div>
            <div class="pledge-acts" style="width:100%;margin:0"><button class="btn btn-soft btn-xs" data-act="modify" data-id="${p.id}">${icon("pencil")} Modify Amount</button></div></div>`;
        }).join("") : `<div class="empty">${icon("refresh")}<h3>No monthly pledges yet</h3><p>A monthly contribution intention lets our team know your plans. No automatic payments are made.</p><a class="btn btn-deep btn-sm" href="${root}pages/donate.html?freq=monthly">Start a monthly intention</a></div>`}
      </section>

      <section class="panel flush"><div class="panel-head"><div><small>Intention records</small><h2>Contribution Intention History</h2></div><button class="btn btn-ghost btn-xs" id="csv" ${donations.length ? "" : "disabled"} aria-label="Download history as CSV">${icon("download")} CSV</button></div>
        <div class="callout tbl-note" style="margin-top:20px">${icon("info")}<span><b>Intention ledger:</b> entries listed reflect contribution intentions recorded for simulation and demonstration. No automatic payments are made.</span></div>
        ${donations.length ? `<div class="tbl-wrap" style="margin-top:20px"><table class="tbl"><thead><tr><th>Date</th><th>Mission selected</th><th>Amount</th><th>Type</th><th>Status</th></tr></thead><tbody>
          ${[...donations].sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt))).map((d) => {
            const statusLabels = {
              pending: "Pledged",
              completed: "Completed (demo)",
              successful: "Completed (demo)",
              cancelled: "Cancelled",
              declined: "Declined",
              withdrawn: "Withdrawn"
            };

            const status = statusLabels[d.status] || "Pledged";

            return `<tr>
              <td class="nowrap">${fmtDate(d.createdAt)}</td>
              <td><b>${esc(d.missionTitle || "General Crisis Fund")}</b></td>
              <td class="nowrap"><b>${money(d.amount, d.currency)}</b><span class="cur">${esc(d.currency || "")}</span></td>
              <td><span class="pill pill-muted">${typeLabel(d)}</span></td>
              <td><span class="pill ${d.status === "pending" ? "pill-pending" : "pill-active"}"><i class="dot"></i>${status}</span>${d.reference ? `<br><small class="muted">${esc(d.reference)}</small>` : ""}</td>
            </tr>`;
          }).join("")}</tbody></table></div>`
          : `<div class="empty" style="margin:24px 30px 30px">${icon("banknote")}<h3>No contribution intentions yet</h3><p>Your contribution intentions will appear here once submitted.</p></div>`}</section>
    </div>
    <div class="col"><section class="panel"><div class="panel-head" style="margin-bottom:6px"><div><small><span class="dot" style="vertical-align:middle;margin-right:6px"></span>Field dispatches</small></div><span class="small muted">Direct feed</span></div>
        <h2 style="margin:6px 0 18px;font-size:1.3rem">Mission Impact Updates</h2>
        ${notes.length ? notes.map((n) => { const m = mById[n.missionId]; return `<div class="feed-item"><div class="top"><span class="pill pill-active">${esc(n.title)}</span><span>${timeAgo(n.createdAt)}</span></div><p>${esc(n.body)}</p>${m ? `<div class="loc">${icon("map-pin")} ${esc(m.location || m.title)}</div>` : ""}</div>`; }).join("") : `<p class="muted small">Updates from the missions you support will appear here.</p>`}
      </section></div>
  </div>`;
  hydrateIcons(main);
  wire();
}

function wire() {
  $("#csv")?.addEventListener("click", () => {
    const rows = [
      ["Date", "Mission", "Intended Amount", "Currency", "Intended Amount (ZAR)", "Type", "Record Status"],
      ...donations.map((d) => [
        String(d.createdAt || "").slice(0, 10),
        d.missionTitle || "General Crisis Fund",
        d.amount,
        d.currency,
        d.amountZAR,
        typeLabel(d),
        d.status || "pending"
      ])
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = "phoenox-donation-history.csv"; a.click(); URL.revokeObjectURL(a.href);
  });
  $$("[data-act]", main).forEach((b) => b.addEventListener("click", async () => {
    const p = pledges.find((x) => x.id === b.dataset.id); if (!p) return;
    if (b.dataset.act === "modify") return modify(p);
  }));
}

function modify(p) {
  const m = openModal({ title: "Modify monthly amount", subtitle: p.missionTitle, dark: false,
    body: `<div class="form-msg error" id="m-err" hidden></div><div class="field"><label for="m-amt">New monthly amount (${p.currency})</label><input id="m-amt" type="number" min="1" step="1" value="${p.amount}"><p class="hint">Updates your recorded monthly intention amount. No automatic payments are made.</p></div>`,
    footer: `<button class="btn btn-ghost" data-x>Cancel</button><button class="btn btn-primary" id="m-go">Save amount</button>` });
  $("[data-x]", m.el).onclick = m.close;
  $("#m-go", m.el).onclick = async () => {
    const v = Math.floor(+$("#m-amt", m.el).value);
    if (!(v > 0) || v > 1000000) { const e = $("#m-err", m.el); e.textContent = "Enter an amount between 1 and 1,000,000."; e.hidden = false; return; }
    try { await backend.db.update("pledges", p.id, { amount: v, amountZAR: toZAR(v, p.currency) }); m.close(); toast("Monthly amount updated."); await load(); render(); } catch (e) { toast(friendlyError(e), "err"); }
  };
}

try { await load(); render(); } catch (e) { console.error(e); main.innerHTML = `<div class="empty">${icon("info")}<h3>We couldn't load your dashboard</h3><p>${esc(friendlyError(e))}</p></div>`; }