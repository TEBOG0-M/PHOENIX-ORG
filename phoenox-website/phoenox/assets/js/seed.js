// Sample content: used to fill the local demo, and by the manager's "Load sample missions" button.

const pad = (n) => String(n).padStart(2, "0");
export const isoDate = (offsetDays = 0) => {
  const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + offsetDays);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const nowIso = (offsetDays = 0) => new Date(Date.now() + offsetDays * 864e5).toISOString();

/** The four missions from the design, plus one finished mission, with dates relative to today. */
export function sampleMissions() {
  return [
    { key: "hearth", title: "Hearth & Haven: Winter Shelter", sector: "Emergency Shelter & Respite",
      summary: "Emergency warmth, night shelter beds, hot nutritious meals and health checks for displaced persons surviving sub-zero night temperatures across the urban district.",
      image: "assets/img/winter-relief.jpg", featured: true, startDate: isoDate(-30), endDate: isoDate(120), cadence: "Night Watch (20:00 – 04:00)",
      location: "Metropolitan Transit Concourse & District 4 Shelter", volunteersNeeded: 20, fundingTarget: 250000, raised: 185000, enrolled: 12, status: "ongoing" },
    { key: "newdawn", title: "New Dawn: Survivors Vocational Workshop", sector: "Vocational Training & Livelihoods",
      summary: "Practical tailoring, carpentry, coding and culinary skills training for survivors of exploitation seeking certified skills, self-reliance and financial independence.",
      image: "assets/img/m-newdawn.jpg", startDate: isoDate(-60), endDate: isoDate(200), cadence: "Day Shift (09:00 – 17:00)",
      location: "PHOENOX Empowerment Center & Trades Hub", volunteersNeeded: 10, fundingTarget: 150000, raised: 92000, enrolled: 6, status: "ongoing" },
    { key: "legal", title: "Sanctuary Legal & Identity Clinic", sector: "Legal & Identity Support",
      summary: "Assisting undocumented refugees, asylum seekers and displaced individuals in securing vital legal identification, birth certificates and basic civic protections.",
      image: "assets/img/m-legal.jpg", startDate: isoDate(-10), endDate: isoDate(300), cadence: "Clinic Hours (09:00 – 14:00)",
      location: "Central Human Rights Chambers & Mobile Units", volunteersNeeded: 6, fundingTarget: 100000, raised: 64000, enrolled: 4, status: "started" },
    { key: "pathways", title: "Pathways Home: Transitional Housing Support", sector: "Housing & Reintegration",
      summary: "Rental deposit assistance, guarantor support and dedicated transitional housing placement for families exiting short-term shelters into stable permanent homes.",
      image: "assets/img/m-pathways.jpg", startDate: isoDate(-20), endDate: isoDate(150), cadence: "Flexible (by appointment)",
      location: "Greater Metro Community Housing Cooperatives", volunteersNeeded: 8, fundingTarget: 300000, raised: 210000, enrolled: 3, status: "ongoing" },
    { key: "flood", title: "Emergency Flash Flood Relief", sector: "Disaster Response",
      summary: "Rapid deployment of blankets, clean water and temporary shelter for families displaced by the coastal basin floods. This mission has concluded.",
      image: "assets/img/m-shelter.jpg", startDate: isoDate(-70), endDate: isoDate(-20), cadence: "Rapid Response",
      location: "Coastal Basin", volunteersNeeded: 15, fundingTarget: 180000, raised: 179400, enrolled: 15, status: "ended" },
  ];
}

/** Fill localStorage on first visit so the demo has believable content. */
export function seedLocal({ read, write }) {
  if (read("seeded", false)) return;
  const authUsers = {
    u_manager: { email: "manager@phoenox.demo", pw: "Demo@1234", name: "Sarah Al-Mansoor" },
    u_donor: { email: "donor@phoenox.demo", pw: "Demo@1234", name: "Marcus Vance" },
    u_volunteer: { email: "volunteer@phoenox.demo", pw: "Demo@1234", name: "Elena Torrez-Mendez" },
  };
  write("auth.users", authUsers);

  const profile = (uid, role, name, extra = {}) => ({
    uid, role, name, email: authUsers[uid]?.email || extra.email || "", phone: "", address: "", bio: "",
    skills: [], availability: [], callSign: name.split(" ")[0], createdAt: nowIso(-120), ...extra,
  });
  const users = {
    u_manager: profile("u_manager", "manager", "Sarah Al-Mansoor", { phone: "+27 82 555 0101", address: "PHOENOX Head Office, Pretoria", bio: "Operations & field coordination lead." }),
    u_donor: profile("u_donor", "donor", "Marcus Vance", { phone: "+27 83 555 0144", address: "Cape Town, Western Cape", callSign: "Marcus" }),
    u_volunteer: profile("u_volunteer", "volunteer", "Elena Torrez-Mendez", {
      phone: "+27 71 892 4110", address: "Pretoria Central Hub", callSign: "Elena", photo: "assets/img/avatar-elena.jpg",
      bio: "Licensed clinical trauma counselor • UN humanitarian logistics certification (Level 3) • Fluent in Spanish, English, conversational French.",
      zone: "Metropolitan District 4 (North & Central)", emergencyContact: "Dr. Carlos Torrez (Brother) · +27 71 555 3912",
      skills: ["First Aid Level 3", "Food Preparation & Hygiene", "Trauma Accompaniment", "Carpentry & Trades", "Spanish & English Translation", "Conflict De-escalation"],
      availability: ["Weekday Evenings", "Saturday Mornings"] }),
    u_s1: profile("u_s1", "volunteer", "Tariq Vance", { email: "tariq@example.org", skills: ["First Aid Level 2", "Crisis De-escalation", "Arabic / English Fluent"] }),
    u_s2: profile("u_s2", "volunteer", "Dr. Naledi Khumalo", { email: "naledi@example.org", skills: ["Trauma Counseling", "Forensic Documentation", "Zulu / Xhosa / English"] }),
    u_s3: profile("u_s3", "volunteer", "Matteo Rossi", { email: "matteo@example.org", skills: ["Carpentry Specialist", "Workshop Safety Lead", "OSHA Certified"] }),
  };
  write("db.users", users);

  const missions = {}; const idOf = {};
  sampleMissions().forEach((m, i) => { const id = "m_" + m.key; idOf[m.key] = id; const { key, ...rest } = m; missions[id] = { ...rest, createdAt: nowIso(-100 + i), createdBy: "u_manager" }; });
  write("db.missions", missions);

  const app = (uid, key, date, status, ago) => ({ missionId: idOf[key], missionTitle: missions[idOf[key]].title, uid, name: users[uid].name, email: users[uid].email,
    skills: users[uid].skills, date, status, createdAt: nowIso(ago), decidedAt: status === "pending" ? null : nowIso(ago + 0.3) });
  write("db.applications", {
    a1: app("u_volunteer", "hearth", isoDate(1), "accepted", -6),
    a2: app("u_volunteer", "legal", isoDate(5), "accepted", -5),
    a3: app("u_volunteer", "newdawn", isoDate(9), "pending", -2),
    a4: app("u_volunteer", "pathways", isoDate(3), "declined", -4),
    a5: app("u_volunteer", "flood", isoDate(-30), "accepted", -45),
    a6: app("u_volunteer", "hearth", isoDate(-12), "accepted", -20),
    a7: app("u_volunteer", "newdawn", isoDate(-8), "accepted", -18),
    a8: app("u_s1", "hearth", isoDate(6), "pending", -0.1),
    a9: app("u_s2", "legal", isoDate(7), "pending", -0.2),
    a10: app("u_s3", "newdawn", isoDate(8), "pending", -0.3),
  });

  // Donor history, then one pooled anonymous record per mission so totals equal each mission's "raised".
  const don = {}; let n = 0;
  const gift = (o) => { don["d" + ++n] = { uid: null, anonymous: false, name: "", email: "", phone: "", method: "card", status: "successful", ...o }; };
  const mk = (key) => ({ missionId: idOf[key], missionTitle: missions[idOf[key]].title });
  const mine = { uid: "u_donor", name: "Marcus Vance", email: "donor@phoenox.demo", phone: "+27 83 555 0144" };
  gift({ ...mine, ...mk("hearth"), amount: 1500, currency: "ZAR", amountZAR: 1500, type: "monthly", pledgeId: "p1", createdAt: nowIso(-62) });
  gift({ ...mine, ...mk("hearth"), amount: 1500, currency: "ZAR", amountZAR: 1500, type: "monthly", pledgeId: "p1", createdAt: nowIso(-32) });
  gift({ ...mine, ...mk("hearth"), amount: 1500, currency: "ZAR", amountZAR: 1500, type: "monthly", pledgeId: "p1", createdAt: nowIso(-2) });
  gift({ ...mine, ...mk("legal"), amount: 3000, currency: "ZAR", amountZAR: 3000, type: "once", createdAt: nowIso(-40), method: "eft" });
  gift({ ...mine, missionId: "general", missionTitle: "General Crisis Fund", amount: 5000, currency: "ZAR", amountZAR: 5000, type: "once", createdAt: nowIso(-75) });
  const mineTotals = { hearth: 4500, legal: 3000 };
  for (const [key, id] of Object.entries(idOf)) {
    const rest = missions[id].raised - (mineTotals[key] || 0);
    if (rest > 0) gift({ ...mk(key), anonymous: true, amount: rest, currency: "ZAR", amountZAR: rest, type: "once", createdAt: nowIso(-80) });
  }
  write("db.donations", don);
  write("db.pledges", { p1: { uid: "u_donor", ...mk("hearth"), amount: 1500, currency: "ZAR", amountZAR: 1500, status: "active", dayOfMonth: 1,
    nextDeduction: isoDate(Math.max(1, 28 - new Date().getDate()) + 3), createdAt: nowIso(-62) } });

  write("db.notifications", {
    n1: { audience: "donor", title: "Hearth & Haven", body: "40 new high-density thermal mattresses delivered and installed ahead of the forecasted cold front.", missionId: idOf.hearth, createdAt: nowIso(-1) },
    n2: { audience: "donor", title: "Sanctuary Legal", body: "3 displaced families successfully received formal documented citizenship notary certificates.", missionId: idOf.legal, createdAt: nowIso(-3) },
    n3: { audience: "volunteer", title: "New shifts open", body: "Hearth & Haven has new night-watch shifts open this week.", missionId: idOf.hearth, createdAt: nowIso(-1) },
  });
  write("seeded", true);
}
