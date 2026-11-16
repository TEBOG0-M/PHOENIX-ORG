import { boot, backend, $, $$, friendlyError, getSession, createProfile, dashboardUrl, safeNext, root, page } from "./app.js";

await boot();
const form = $("#auth-form"), msg = $("#form-msg"), googleBtn = $("#google-btn");
const show = (text, type = "error") => { msg.textContent = text; msg.className = "form-msg " + type; msg.hidden = !text; if (text) msg.scrollIntoView({ block: "nearest", behavior: "smooth" }); };

async function busy(btn, fn) {
  const label = btn.innerHTML; btn.disabled = true; btn.textContent = "Please wait…"; show("");
  try { await fn(); } catch (e) { console.error(e.code || e); show(friendlyError(e)); } finally { btn.disabled = false; btn.innerHTML = label; }
}
async function landed(defaultRole, extra) {
  const { user, profile } = await getSession();
  const p = profile || (await createProfile(user, defaultRole, extra));
  location.href = safeNext(dashboardUrl(p.role));
}

// Already signed in? Skip the form.
if (page !== "forgot") {
  const { user, profile } = await getSession();
  if (user && profile) location.replace(safeNext(dashboardUrl(profile.role)));
}

// ── register-only UI
const role = () => ($("#neutral")?.checked ? "member" : (document.querySelector('input[name="role"]:checked') || {}).value || "volunteer");
if (page === "register") {
  const pw = $("#password"), rules = { len: (v) => v.length >= 8, up: (v) => /[A-Z]/.test(v), num: (v) => /\d/.test(v), sym: (v) => /[^A-Za-z0-9]/.test(v) };
  const bars = $$("#strength .bars i"), label = $("#strength-label");
  pw.addEventListener("input", () => {
    const v = pw.value; let n = 0;
    for (const [k, f] of Object.entries(rules)) { const ok = f(v); n += ok; $(`[data-r="${k}"]`).classList.toggle("ok", ok); }
    bars.forEach((b, i) => b.classList.toggle("on", i < n)); label.textContent = !v ? "Awaiting input" : ["Too weak", "Weak", "Fair", "Good", "Strong"][n];
  });
  const syncRole = () => { $("#c1-wrap").parentElement.hidden = role() !== "volunteer"; };
  $$('input[name="role"]').forEach((r) => r.addEventListener("change", syncRole)); syncRole();
  // "Just browsing" = regular member: no volunteer/donor dashboard, so the role cards are switched off.
  const neutral = $("#neutral");
  neutral?.addEventListener("change", () => { $$('input[name="role"]').forEach((r) => (r.disabled = neutral.checked)); $(".role-pick").classList.toggle("is-dim", neutral.checked); syncRole(); });
  const pre = new URLSearchParams(location.search).get("role"); if (pre === "donor") { document.querySelector('input[value="donor"]').checked = true; syncRole(); }
}
const consentOK = () => {
  if (role() === "volunteer" && !$("#c1").checked) return "Please consent to identity verification and background checks to register as a volunteer.";
  if (!$("#c2").checked) return "Please agree to the Terms of Humanitarian Conduct & Privacy Notice.";
  return "";
};

// ── Google
googleBtn?.addEventListener("click", () => busy(googleBtn, async () => {
  if (page === "register") { const bad = consentOK(); if (bad) return show(bad); }
  await backend.auth.google();
  await landed(page === "register" ? role() : "donor");
}));

// ── forms
form?.addEventListener("submit", (e) => {
  e.preventDefault();
  const btn = form.querySelector("button[type=submit]"), v = (id) => ($("#" + id)?.value || "").trim(), pw = $("#password")?.value || "";
  if (!/^\S+@\S+\.\S+$/.test(v("email"))) return show("Enter a valid email address.");

  if (page === "login") {
    if (!pw) return show("Enter your password.");
    return busy(btn, async () => { await backend.auth.signIn(v("email"), pw); await landed("donor"); });
  }
  if (page === "forgot") {
    return busy(btn, async () => {
      try { await backend.auth.reset(v("email")); } catch (err) { if (err.code !== "auth/user-not-found") throw err; }
      show("If an account exists for that email, a reset link has been sent. Check your inbox and spam folder.", "success");
    });
  }
  if (page === "register") {
    if (v("name").length < 2) return show("Please enter your full legal name.");
    const digits = v("phone").replace(/\D/g, "");
    if (digits.length < 7 || digits.length > 12) return show("Please enter a valid mobile number.");
    if (pw.length < 8 || !/[A-Z]/.test(pw) || !/\d/.test(pw)) return show("Password must be at least 8 characters with an uppercase letter and a number.");
    if (pw !== $("#confirm").value) return show("Passwords do not match.");
    const bad = consentOK(); if (bad) return show(bad);
    const phone = `${$("#cc").value} ${digits.replace(/^0/, "")}`;
    return busy(btn, async () => {
      const user = await backend.auth.signUp(v("email"), pw, v("name"));
      await createProfile(user, role(), { name: v("name"), phone, consentedAt: new Date().toISOString() });
      location.href = safeNext(dashboardUrl(role()));
    });
  }
});