// ─────────────────────────────────────────────────────────────
//  PHOENOX — data layer
//  One small API, two engines:
//    • Firebase (Auth + Firestore)  – the real thing
//    • Local demo (localStorage)    – works offline, for demos & testing
//  Every page talks to `backend` only, so neither engine leaks into the UI.
// ─────────────────────────────────────────────────────────────
import { firebaseConfig, MODE } from "./config.js";
import { seedLocal } from "./seed.js";

const FB_VERSION = "11.0.2";
const FB = `https://www.gstatic.com/firebasejs/${FB_VERSION}/`;

/** Sentinel for atomic counters: db.update("missions", id, { raised: inc(500) }) */
export const inc = (n) => ({ __inc: n });
const isInc = (v) => v && typeof v === "object" && "__inc" in v;

const withTimeout = (p, ms, label) =>
  Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error(label + " timed out")), ms))]);

// ───────────────────────── Firebase engine
async function createFirebaseEngine() {
  const [appM, authM, fsM] = await withTimeout(
    Promise.all([import(FB + "firebase-app.js"), import(FB + "firebase-auth.js"), import(FB + "firebase-firestore.js")]),
    8000, "Firebase SDK");
  if (!firebaseConfig.apiKey || firebaseConfig.apiKey.startsWith("YOUR")) throw new Error("Firebase not configured");

  const app = appM.initializeApp(firebaseConfig);
  const auth = authM.getAuth(app);
  const fs = fsM.getFirestore(app);
  const mapUser = (u) => (u ? { uid: u.uid, email: u.email, displayName: u.displayName || "", photoURL: u.photoURL || "", providerId: u.providerData?.[0]?.providerId || "password" } : null);

  // Wait for the initial auth state so pages know if someone is signed in.
  await new Promise((res) => { const off = authM.onAuthStateChanged(auth, () => { off(); res(); }); });

  const prep = (data) => {
    const out = {};
    for (const [k, v] of Object.entries(data)) out[k] = isInc(v) ? fsM.increment(v.__inc) : v;
    return out;
  };
  const strip = (snap) => ({ id: snap.id, ...snap.data() });

  return {
    mode: "firebase",
    auth: {
      current: () => mapUser(auth.currentUser),
      onChange: (cb) => authM.onAuthStateChanged(auth, (u) => cb(mapUser(u))),
      async signUp(email, pw, name) {
        const c = await authM.createUserWithEmailAndPassword(auth, email, pw);
        if (name) await authM.updateProfile(c.user, { displayName: name });
        return mapUser(c.user);
      },
      async signIn(email, pw) { return mapUser((await authM.signInWithEmailAndPassword(auth, email, pw)).user); },
      async google() { return mapUser((await authM.signInWithPopup(auth, new authM.GoogleAuthProvider())).user); },
      reset: (email) => authM.sendPasswordResetEmail(auth, email),
      signOut: () => authM.signOut(auth),
      updateName: (name) => authM.updateProfile(auth.currentUser, { displayName: name }),
    },
    db: {
      async get(col, id) { const s = await fsM.getDoc(fsM.doc(fs, col, id)); return s.exists() ? strip(s) : null; },
      async set(col, id, data, merge = false) { await fsM.setDoc(fsM.doc(fs, col, id), prep(data), { merge }); return id; },
      async add(col, data) { return (await fsM.addDoc(fsM.collection(fs, col), prep(data))).id; },
      async update(col, id, patch) { await fsM.updateDoc(fsM.doc(fs, col, id), prep(patch)); },
      async withdrawApplication(applicationId, uid, withdrawnAt) {
        return fsM.runTransaction(fs, async (transaction) => {
          const appRef = fsM.doc(fs, "applications", applicationId);
          const snap = await transaction.get(appRef);

          if (!snap.exists()) throw new Error("Application not found.");

          const application = snap.data();

          if (application.uid !== uid) {
            throw new Error("You cannot withdraw someone else's application.");
          }

          if (application.status !== "pending") {
            throw new Error("Only pending applications can be withdrawn.");
          }

          transaction.update(appRef, {
            status: "withdrawn",
            withdrawnAt,
            updatedAt: withdrawnAt
          });
        });
      },
      async acceptApplication(applicationId, missionId, today, decidedAt) {
        return fsM.runTransaction(fs, async (transaction) => {
          const appRef = fsM.doc(fs, "applications", applicationId);
          const missionRef = fsM.doc(fs, "missions", missionId);

          const [appSnap, missionSnap] = await Promise.all([
            transaction.get(appRef),
            transaction.get(missionRef)
          ]);

          if (!appSnap.exists()) throw new Error("Application not found.");
          if (!missionSnap.exists()) throw new Error("Mission not found.");

          const application = appSnap.data();
          const mission = missionSnap.data();

          if (application.missionId !== missionId) {
            throw new Error("This application does not belong to that mission.");
          }

          if (application.status !== "pending") {
            throw new Error("This application has already been reviewed.");
          }

          if (!["started", "ongoing"].includes(mission.status || "ongoing")
              || (mission.endDate && mission.endDate < today)) {
            throw new Error("This mission is closed.");
          }

          if (application.date < today) {
            throw new Error("This volunteer shift date has already passed.");
          }

          if (application.date < mission.startDate || application.date > mission.endDate) {
            throw new Error("The requested shift is outside the mission dates.");
          }

          const enrolled = Number(mission.enrolled) || 0;
          const capacity = Number(mission.volunteersNeeded) || 0;

          if (capacity < 1 || enrolled >= capacity) {
            throw new Error("This mission is full. Raise the volunteer capacity first.");
          }

          transaction.update(appRef, {
            status: "accepted",
            decidedAt
          });

          transaction.update(missionRef, {
            enrolled: enrolled + 1
          });

          return { enrolled: enrolled + 1 };
        });
      },
      async remove(col, id) { await fsM.deleteDoc(fsM.doc(fs, col, id)); },
      async list(col, where = []) {
        const q = fsM.query(fsM.collection(fs, col), ...where.map(([f, op, v]) => fsM.where(f, op, v)));
        return (await fsM.getDocs(q)).docs.map(strip);
      },
    },
  };
}

// ───────────────────────── Local demo engine
function createLocalEngine() {
  const K = "phoenox.";
  const read = (k, d) => { try { return JSON.parse(localStorage.getItem(K + k)) ?? d; } catch { return d; } };
  const write = (k, v) => localStorage.setItem(K + k, JSON.stringify(v));
  const rid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
  const listeners = new Set();
  const authErr = (code) => Object.assign(new Error(code), { code });

  const users = () => read("auth.users", {});
  const sessionUser = () => {
    const uid = read("auth.session", null); const u = uid && users()[uid];
    return u ? { uid, email: u.email, displayName: u.name || "", photoURL: "", providerId: u.pw === "" ? "google.com" : "password" } : null;
  };
  const emit = () => listeners.forEach((cb) => cb(sessionUser()));
  const col = (c) => read("db." + c, {});

  const applyPatch = (doc, patch) => {
    const out = { ...doc };
    for (const [k, v] of Object.entries(patch)) out[k] = isInc(v) ? (Number(out[k]) || 0) + v.__inc : v;
    return out;
  };
  const match = (doc, [f, op, v]) => {
    const x = doc[f];
    if (op === "==") return x === v;
    if (op === "in") return v.includes(x);
    if (op === "array-contains") return Array.isArray(x) && x.includes(v);
    return true;
  };

  seedLocal({ read, write, users });

  return {
    mode: "demo",
    auth: {
      current: sessionUser,
      onChange(cb) { listeners.add(cb); setTimeout(() => cb(sessionUser()), 0); return () => listeners.delete(cb); },
      async signUp(email, pw, name) {
        email = email.trim().toLowerCase(); const all = users();
        if (Object.values(all).some((u) => u.email === email)) throw authErr("auth/email-already-in-use");
        const uid = "u_" + rid(); all[uid] = { email, pw, name: name || "" };
        write("auth.users", all); write("auth.session", uid); emit(); return sessionUser();
      },
      async signIn(email, pw) {
        email = email.trim().toLowerCase(); const all = users();
        const hit = Object.entries(all).find(([, u]) => u.email === email && u.pw === pw);
        if (!hit) throw authErr("auth/invalid-credential");
        write("auth.session", hit[0]); emit(); return sessionUser();
      },
      async google() {
        const email = (prompt("Demo mode — enter the Google email you'd like to sign in with:", "guest@gmail.com") || "").trim().toLowerCase();
        if (!email) throw authErr("auth/popup-closed-by-user");
        const all = users(); let uid = Object.keys(all).find((k) => all[k].email === email);
        if (!uid) { uid = "u_" + rid(); all[uid] = { email, pw: "", name: email.split("@")[0] }; write("auth.users", all); }
        write("auth.session", uid); emit(); return sessionUser();
      },
      async reset() { /* demo: nothing to send */ },
      async signOut() { write("auth.session", null); emit(); },
      async updateName(name) { const all = users(); const s = read("auth.session", null); if (all[s]) { all[s].name = name; write("auth.users", all); emit(); } },
    },
    db: {
      async get(c, id) { const d = col(c)[id]; return d ? { id, ...d } : null; },
      async set(c, id, data, merge = false) {
        const all = col(c); const base = merge && all[id] ? all[id] : {};
        all[id] = applyPatch(base, data); write("db." + c, all); return id;
      },
      async add(c, data) { const id = rid(); await this.set(c, id, data); return id; },
      async update(c, id, patch) {
        const all = col(c); if (!all[id]) throw Object.assign(new Error("not-found"), { code: "not-found" });
        all[id] = applyPatch(all[id], patch); write("db." + c, all);
      },
      async withdrawApplication(applicationId, uid, withdrawnAt) {
        const applications = col("applications");
        const application = applications[applicationId];

        if (!application) throw new Error("Application not found.");

        if (application.uid !== uid) {
          throw new Error("You cannot withdraw someone else's application.");
        }

        if (application.status !== "pending") {
          throw new Error("Only pending applications can be withdrawn.");
        }

        applications[applicationId] = {
          ...application,
          status: "withdrawn",
          withdrawnAt,
          updatedAt: withdrawnAt
        };

        write("db.applications", applications);
      },
      async acceptApplication(applicationId, missionId, today, decidedAt) {
        const applications = col("applications");
        const missions = col("missions");

        const application = applications[applicationId];
        const mission = missions[missionId];

        if (!application) throw new Error("Application not found.");
        if (!mission) throw new Error("Mission not found.");

        if (application.missionId !== missionId) {
          throw new Error("This application does not belong to that mission.");
        }

        if (application.status !== "pending") {
          throw new Error("This application has already been reviewed.");
        }

        if (!["started", "ongoing"].includes(mission.status || "ongoing")
            || (mission.endDate && mission.endDate < today)) {
          throw new Error("This mission is closed.");
        }

        if (!application.date || !mission.startDate || !mission.endDate) {
  throw new Error("The mission dates or requested shift date are missing.");
}

if (application.date < today) {
  throw new Error("This volunteer shift date has already passed.");
}

        if (application.date < mission.startDate || application.date > mission.endDate) {
          throw new Error("The requested shift is outside the mission dates.");
        }

        const enrolled = Number(mission.enrolled) || 0;
        const capacity = Number(mission.volunteersNeeded) || 0;

        if (capacity < 1 || enrolled >= capacity) {
          throw new Error("This mission is full. Raise the volunteer capacity first.");
        }

        applications[applicationId] = {
          ...application,
          status: "accepted",
          decidedAt
        };

        missions[missionId] = {
          ...mission,
          enrolled: enrolled + 1
        };

        write("db.applications", applications);
        write("db.missions", missions);

        return { enrolled: enrolled + 1 };
      },
      async remove(c, id) { const all = col(c); delete all[id]; write("db." + c, all); },
      async list(c, where = []) {
        return Object.entries(col(c)).map(([id, d]) => ({ id, ...d })).filter((d) => where.every((w) => match(d, w)));
      },
    },
  };
}

// ───────────────────────── Pick an engine
async function init() {
  const qs = new URLSearchParams(location.search);
  if (qs.has("demo")) { try { localStorage.setItem("phoenox.forceDemo", qs.get("demo") === "0" ? "" : "1"); } catch {} }
  let forceDemo = false; try { forceDemo = !!localStorage.getItem("phoenox.forceDemo"); } catch {}

  if (MODE === "demo" || forceDemo) return createLocalEngine();
  try { return await createFirebaseEngine(); }
  catch (e) {
    if (MODE === "firebase") throw e;
    console.warn("[PHOENOX] Firebase unavailable — using local demo mode.", e);
    const eng = createLocalEngine(); eng.fellBack = true; return eng;
  }
}

export const backend = await init();
