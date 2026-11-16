// Volunteer applications: one mission per calendar day, dates must sit inside the mission window.
import { backend, openModal, toast, esc, $, icon, fmtDate, todayISO, isOpen, notify, friendlyError } from "./app.js";

export const loadMyApps = (uid) => backend.db.list("applications", [["uid", "==", uid]]);

/** A day is "taken" if the volunteer already has a pending or accepted application on it. */
export const takenDates = (apps) => new Map(
  apps
    .filter((a) => ["pending", "accepted"].includes(a.status))
    .map((a) => [a.date, a])
);
export const conflictFor = (apps, mission, date) => {
  const hit = takenDates(apps).get(date);
  return hit ? hit : null;
};
/** Earliest day a volunteer could still book on this mission (today or later, inside the window, not already taken). */
export function nextFreeDate(apps, m) {
  const taken = takenDates(apps);
  const d = new Date((m.startDate > todayISO() ? m.startDate : todayISO()) + "T12:00:00");
  for (let i = 0; i < 400; i++) {
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    if (iso > m.endDate) return null;
    if (!taken.has(iso)) return iso;
    d.setDate(d.getDate() + 1);
  }
  return null;
}
/** Whether the mission could accept an application at all (open, not full, a free day exists). */
export function applyBlock(m, apps) {
  if (!isOpen(m)) return "This mission is closed.";
  if ((m.enrolled || 0) >= (m.volunteersNeeded || Infinity)) return "All volunteer places are filled.";
  if (!nextFreeDate(apps, m)) return "You have no free days left in this mission's window.";
  return "";
}

export function openApplyModal({ mission: m, session, apps, onDone }) {
  const { user, profile } = session;
  const min = m.startDate > todayISO() ? m.startDate : todayISO();
  const first = nextFreeDate(apps, m) || min;
  const modal = openModal({
    title: "Apply for a shift", subtitle: m.title, dark: false,
    body: `<form id="apply-form" novalidate>
      <div class="form-msg error" id="ap-err" hidden></div>
      <p class="muted small">Mission runs <b>${fmtDate(m.startDate)} – ${fmtDate(m.endDate)}</b>${m.cadence ? ` · ${esc(m.cadence)}` : ""}${m.location ? ` · ${esc(m.location)}` : ""}.</p>
      <div class="field"><label for="ap-date">Which day will you serve? <span class="req">*</span></label><input id="ap-date" type="date" min="${min}" max="${m.endDate}" value="${first}" required>
        <p class="hint">You can only hold one mission per calendar day. Days you already have a pending or accepted application are unavailable.</p></div>
      <div class="field"><label for="ap-note">Note to the coordinator <small>(optional)</small></label><textarea id="ap-note" maxlength="500" placeholder="Anything we should know — relevant experience, transport, languages…"></textarea></div>
      <div class="callout"><i data-i="info"></i><span>Your skills (${(profile.skills || []).length ? esc(profile.skills.slice(0, 3).join(", ")) + ((profile.skills || []).length > 3 ? "…" : "") : "none added yet"}) are shared with the coordinator. You can edit them in your dashboard.</span></div>
    </form>`.replace('<i data-i="info"></i>', icon("info")),
    footer: `<button class="btn btn-ghost" type="button" data-x>Cancel</button><button class="btn btn-primary" type="button" id="ap-go">Submit application</button>`,
  });
  const err = $("#ap-err", modal.el), go = $("#ap-go", modal.el);
  $("[data-x]", modal.el).onclick = modal.close;
  const fail = (t) => { err.textContent = t; err.hidden = false; };
  go.onclick = async () => {
    err.hidden = true;
    const date = $("#ap-date", modal.el).value;
    if (!date) return fail("Please choose a day.");
    if (date < min || date > m.endDate) return fail(`Choose a day between ${fmtDate(min)} and ${fmtDate(m.endDate)}.`);
    go.disabled = true; go.textContent = "Submitting…";
    try {
      // Refresh the mission and applications before submitting.
      const freshMission = await backend.db.get("missions", m.id);

      if (!freshMission) {
        go.disabled = false;
        go.textContent = "Submit application";
        return fail("This mission could no longer be found.");
      }

      // Check the latest mission status and dates.
      if (!isOpen(freshMission)) {
        go.disabled = false;
        go.textContent = "Submit application";
        return fail("This mission is no longer accepting applications.");
      }

      const freshMin = freshMission.startDate > todayISO()
        ? freshMission.startDate
        : todayISO();

      if (date < freshMin || date > freshMission.endDate) {
        go.disabled = false;
        go.textContent = "Submit application";
        return fail("This date is no longer available for this mission.");
      }

      // Refresh the volunteer's applications.
      const fresh = await loadMyApps(user.uid);

      // Check the latest capacity and availability.
      const blocked = applyBlock(freshMission, fresh);

      if (blocked) {
        go.disabled = false;
        go.textContent = "Submit application";
        return fail(blocked);
      }

      // Check whether the selected day has already been taken.
      const again = conflictFor(fresh, freshMission, date);

      if (again) {
        go.disabled = false;
        go.textContent = "Submit application";
        return fail(
          `You already have “${again.missionTitle}” on ${fmtDate(date)}.`
        );
      }

      const rec = {
        missionId: freshMission.id,
        missionTitle: freshMission.title,
        uid: user.uid,
        name: profile.name,
        email: profile.email || user.email,
        phone: profile.phone || "",
        skills: profile.skills || [],
        note: $("#ap-note", modal.el).value.trim(),
        date,
        status: "pending",
        createdAt: new Date().toISOString(),
        decidedAt: null
      };

      const id = await backend.db.add("applications", rec);

      await notify({
        audience: "manager",
        title: "New volunteer application",
        body: `${profile.name} applied for “${freshMission.title}” on ${fmtDate(date)}.`,
        missionId: freshMission.id
      }).catch(() => {});

      modal.close();
      toast("Application submitted — you'll be notified when it's reviewed.");
      onDone?.({ id, ...rec });
    } catch (e) { console.error(e); go.disabled = false; go.textContent = "Submit application"; fail(friendlyError(e)); }
  };
  return modal;
}
