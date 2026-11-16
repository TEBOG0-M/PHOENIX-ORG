// Account page (all roles): view and edit your own details. Email, role and member-since are read-only.
import { backend, requireRole, mountShell, $, esc, icon, fmtDate, avatar, toast, fileToDataURL, friendlyError, dashboardUrl, logout } from "./app.js";

const session = await requireRole(["volunteer", "donor", "manager", "member"]);
if (!session) throw new Error("redirecting");
const { user } = session;
let profile = session.profile;
const main = await mountShell(session, { active: "profile" });

const ROLE = { volunteer: "Volunteer", donor: "Donor", manager: "Manager", member: "Member" };

function render() {
  const role = profile.role, isVol = role === "volunteer";
  const provider = user.providerId === "google.com" ? "Google" : "Email & password";
  main.innerHTML = `
  <section class="profile-card">
    <div class="avwrap">${avatar(profile, "lg")}<label class="cam" title="Change photo" for="photo-in">${icon("pencil")}<span class="sr">Change profile photo</span></label><input id="photo-in" type="file" accept="image/*" style="display:none"></div>
    <div class="info"><h1>${esc(profile.name || user.email)}</h1><span class="pill pill-accepted">${ROLE[role]}</span>
      <div class="meta"><span style="color:var(--teal-deep);font-weight:600">${icon("check-circle")} Active ${ROLE[role].toLowerCase()} account</span>
        <span>${icon("calendar")} Member since ${fmtDate(profile.createdAt)}</span><span>${icon("clock")} Last active: ${profile.lastActive ? new Date(profile.lastActive).toLocaleString("en-ZA", { dateStyle: "medium", timeStyle: "short" }) : "Just now"}</span></div></div>
    <div class="acts">${role === "member" ? `<a class="btn btn-deep" href="${dashboardUrl(role)}">Back to the site ${icon("arrow-up-right")}</a>` : `<a class="btn btn-deep" href="${dashboardUrl(role)}">${ROLE[role]} Dashboard ${icon("arrow-up-right")}</a>`}<button class="btn btn-ghost" id="signout">${icon("log-out")} Sign Out</button></div>
  </section>

  <section class="panel"><form id="prof" novalidate>
    <div class="sec-eyebrow"><div><small>Section 01</small><h2>Personal Identity Dossier</h2></div><span class="enc">${icon("lock")} Visible only to you and PHOENOX coordinators</span></div>
    <div class="form-msg error" id="p-err" hidden role="alert"></div>
    <div class="row-2"><div class="field"><label for="p-name">Full legal name <span class="req">*</span></label><input class="control" id="p-name" maxlength="80" value="${esc(profile.name || "")}" autocomplete="name"></div>
      <div class="field"><label for="p-call">Preferred name <small>(what we call you)</small></label><input class="control" id="p-call" maxlength="40" value="${esc(profile.callSign || "")}"></div></div>
    <div class="field"><label for="p-email">Email account <small>${provider} sign-in</small></label><input class="control" id="p-email" value="${esc(profile.email || user.email || "")}" readonly aria-describedby="email-hint" style="background:var(--cream-2)"><p class="hint" id="email-hint">Your sign-in email can't be edited here. Contact a coordinator to change it.</p></div>
    <div class="row-2"><div class="field"><label for="p-phone">Mobile</label><input class="control" id="p-phone" type="tel" maxlength="24" value="${esc(profile.phone || "")}" placeholder="+27 71 000 0000" autocomplete="tel"></div>
      <div class="field"><label for="p-addr">${isVol ? "Physical address / area" : "Address"}</label><input class="control" id="p-addr" maxlength="120" value="${esc(profile.address || "")}" autocomplete="street-address"></div></div>
    ${isVol ? `<div class="row-2"><div class="field"><label for="p-zone">Operational zone <small>(where you can deploy)</small></label><input class="control" id="p-zone" maxlength="80" value="${esc(profile.zone || "")}" placeholder="e.g. Pretoria Central"></div>
      <div class="field"><label for="p-emg">Emergency contact</label><input class="control" id="p-emg" maxlength="100" value="${esc(profile.emergencyContact || "")}" placeholder="Name, relationship, number"></div></div>` : ""}
    <div class="field"><label for="p-bio">${isVol ? "Professional background &amp; specialised capabilities" : role === "manager" ? "Role &amp; responsibilities" : "About you"} <small>(optional)</small></label><textarea class="control" id="p-bio" rows="4" maxlength="600">${esc(profile.bio || "")}</textarea></div>
    <div class="form-actions"><button type="button" class="cancel" id="p-cancel">Cancel</button><button class="btn btn-deep" type="submit" id="p-save">Save Changes</button></div>
  </form></section>

  <section class="panel"><div class="sec-eyebrow"><div><small>Section 02</small><h2>Sign-in &amp; security</h2></div></div>
    <div class="kv"><span>Account type</span><span>${ROLE[role]}</span></div>
    <div class="kv"><span>Sign-in method</span><span>${provider}</span></div>
    <div class="kv"><span>Member since</span><span>${fmtDate(profile.createdAt)}</span></div>
    ${provider === "Google" ? "" : `<div style="margin-top:18px"><button class="btn btn-soft btn-sm" id="reset" type="button">${icon("mail")} Email me a password-reset link</button></div>`}
  </section>`;
  wire();
}

function wire() {
  $("#signout").onclick = logout;
  $("#p-cancel").onclick = () => render();
  $("#photo-in").onchange = async (e) => {
    const f = e.target.files[0]; if (!f) return;
    try { const photo = await fileToDataURL(f, 320, 0.82); await backend.db.update("users", user.uid, { photo }); profile = { ...profile, photo }; toast("Photo updated."); render(); }
    catch (x) { toast(x.message || friendlyError(x), "err"); }
  };
  $("#reset")?.addEventListener("click", async () => {
    try { await backend.auth.reset(profile.email || user.email); toast("Reset link sent to " + (profile.email || user.email) + "."); } catch (e) { toast(friendlyError(e), "err"); }
  });
  $("#prof").addEventListener("submit", async (e) => {
    e.preventDefault();
    const v = (id) => ($("#" + id)?.value ?? "").trim(), err = $("#p-err");
    const patch = { name: v("p-name"), callSign: v("p-call"), phone: v("p-phone"), address: v("p-addr"), bio: v("p-bio") };
    if (profile.role === "volunteer") { patch.zone = v("p-zone"); patch.emergencyContact = v("p-emg"); }
    err.hidden = true;
    if (patch.name.length < 2) { err.textContent = "Please enter your full name (at least 2 characters)."; err.hidden = false; return; }
    if (patch.phone && !/^[+()\d][\d\s()+-]{6,22}$/.test(patch.phone)) { err.textContent = "That phone number doesn't look right. Use digits, spaces and an optional + prefix."; err.hidden = false; return; }
    const btn = $("#p-save"); btn.disabled = true; btn.textContent = "Saving…";
    try {
      await backend.db.update("users", user.uid, patch);
      if (patch.name !== user.displayName) await backend.auth.updateName(patch.name).catch(() => {});
      profile = { ...profile, ...patch }; toast("Your details have been saved."); render();
      $(".user-chip span")?.replaceChildren(document.createTextNode(patch.name));
    } catch (x) { console.error(x); btn.disabled = false; btn.textContent = "Save Changes"; err.textContent = friendlyError(x); err.hidden = false; }
  });
}

render();