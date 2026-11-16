import { boot, backend, $, friendlyError, notify, BRAND } from "./app.js";
const { user, profile } = await boot();
const form = $("#contact-form"), msg = $("#form-msg");
if (user) { $("#name").value = profile?.name || user.displayName || ""; $("#email").value = user.email || ""; }
const say = (t, type) => { msg.textContent = t; msg.className = "form-msg " + type; msg.hidden = !t; };
form.addEventListener("submit", async (e) => {
  e.preventDefault(); say("", "");
  const v = (id) => $("#" + id).value.trim();
  if (v("name").length < 2) return say("Please enter your name.", "error");
  if (!/^\S+@\S+\.\S+$/.test(v("email"))) return say("Please enter a valid email address.", "error");
  if (v("message").length < 10) return say("Please write a few words so we can help — at least 10 characters.", "error");
  const btn = form.querySelector("button[type=submit]"); btn.disabled = true;
  try {
    await backend.db.add("messages", { name: v("name"), email: v("email"), subject: v("subject"), message: v("message"), uid: user?.uid || null, createdAt: new Date().toISOString() });
    // Deliver to the owner's inbox (FormSubmit: first message triggers a one-time activation email).
    fetch("https://formsubmit.co/ajax/" + BRAND.inbox, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ name: v("name"), email: v("email"), subject: "[PHOENOX] " + (v("subject") || "New message"), message: v("message"), _replyto: v("email"), _captcha: "false" }) }).catch((e) => console.warn("email relay", e));
    notify({ audience: "manager", title: "New contact message", body: `${v("name")}: ${v("message").slice(0, 120)}` }).catch(() => {});
    form.reset(); say("Thank you — your message is with our outreach team. We'll reply by email.", "success");
  } catch (err) { console.error(err); say(friendlyError(err), "error"); }
  finally { btn.disabled = false; }
});
