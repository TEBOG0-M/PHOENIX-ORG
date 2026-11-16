# PHOENOX — Humanitarian Initiative Website

> "God hasn't forsaken you, so we won't either."

An **academic nonprofit website concept** supporting refugees, displaced people, homeless individuals and survivors of trafficking or exploitation. Values: safety, dignity, recovery, independence, purpose.

**© 2026 PTVOX Software. All rights reserved.** Developed by Phungo Tshiredo · tshiredo15@gmail.com · +27 81 353 3786

> ⚠️ **Simulation notice:** This is a school project. No real payment gateway exists, no real money is collected, and PHOENOX is not a registered organisation. All donations are clearly marked as **simulated (DEMO)**.

## Features
- Roles: **Member**, **Volunteer**, **Donor**, **Manager** (manager accounts are created manually, never via public registration).
- Missions with funding bars and volunteer capacity; managers create/edit/end/reopen them.
- Volunteer applications with manager approval and history.
- **Simulated donations:** once-off gifts become `completed` demo transactions (reference, original amount + currency, fixed exchange rate, ZAR total, timestamp). They update the donor history, manager totals and the public mission progress bars. Monthly gifts are stored as **pending pledges** (no automatic debit).
- **In-app notifications (bell icon):** new mission → volunteers & donors; donation/pledge/application/contact message → managers; donor gets their own receipt notice.
- Contact form saves to Firestore **and** emails the site owner (via FormSubmit).

## Tech
Static HTML + modular JavaScript · Firebase Auth + Firestore · local demo mode (`?demo=1`) · GitHub Actions CI/CD → GitHub Pages.

## Setup
1. Copy your Firebase web config into `phoenox/assets/js/config.js` (already filled in).
2. Firebase console → **Authentication**: enable Email/Password (+ Google if wanted).
3. Firebase console → **Firestore → Rules**: paste the contents of `firestore.rules` → **Publish**.
4. Create a manager: register normally, then in Firestore `users/<uid>` set `role` to `manager`.
5. Run locally: `cd phoenox && python3 -m http.server 8000` → http://localhost:8000
6. Contact form email: send one test message and click the activation link FormSubmit emails to tshiredo15@gmail.com (one-time).
7. Deploy: push to `main`; in GitHub → Settings → Pages → Source = **GitHub Actions**.

## Pipeline (`.github/workflows/ci.yml`)
Validate (JS syntax check, required files, no payment secrets) → Deploy to GitHub Pages on `main`.

## Fixed exchange rates (`config.js`)
`ZAR 1 · USD 18 · EUR 20` — every donation stores the rate used.

## Known limitations
- No real payments; monthly pledges never debit.
- Mission `raised` is incremented from the browser, restricted by Firestore rules to increase-only on open missions. A production system should use a Cloud Function.
- Queued `mail` records need Firebase's "Trigger Email" extension to send; FormSubmit covers the contact form only.
- Mission images are stored as data URLs in Firestore.

## Test checklist
Register member/volunteer/donor · manager login · create mission (donor & volunteer get notification) · volunteer applies (manager notified) · accept application · donate once-off (donor history, manager total, mission bar all rise; manager notified) · monthly pledge stays pending · end mission blocks gifts · mobile layout · console clean.

## Ownership
All rights reserved. © 2026 PTVOX Software.
