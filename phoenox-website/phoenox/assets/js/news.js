import { boot, $, esc, icon, fmtDate, root } from "./app.js";
await boot();

// Demonstration content. Stories about PHOENOX missions are illustrative; research figures cite the linked sources.
const ARTICLES = [
  { id: "winter-beds", cat: "Field dispatch", date: "2026-11-10", img: "assets/img/m-hearth.jpg", title: "Hearth & Haven opens 40 new winter beds ahead of the cold front",
    excerpt: "High-density thermal mattresses were delivered and installed at the transit concourse shelter in time for the first sub-zero week.",
    body: ["When the forecast turned, the Hearth & Haven team did what it does best: moved early. Forty thermal mattresses and sleeping packs were delivered and installed across the District 4 shelter, along with a second hot-meal shift for the night watch.",
      "Every bed is more than a bed. Each new guest is met by a volunteer who learns their name, offers a meal and a basic health check, and stays until they are settled. Safety first; paperwork and plans come after sleep.",
      "Night-watch volunteers are still needed through winter. If you can give an evening, you can apply for a shift from your volunteer dashboard.", ],
    quote: "Nobody should have to earn a warm bed. They only have to arrive.", links: [] },
  { id: "why-we-search", cat: "Explainer", date: "2026-11-03", img: "assets/img/m-legal.jpg", title: "Why we go looking for people instead of waiting for them to find us",
    excerpt: "People who have been exploited rarely walk into an office and ask for help. That is why outreach is the first step of everything we do.",
    body: ["Trafficking and forced criminality do not always look the way people imagine. Many of the people we meet were taken from their homes or countries and made to beg, carry or work for others. When they are no longer useful, they are simply left — often in a country where they know no one and have no documents.",
      "Official figures suggest the problem is growing. The United Nations Office on Drugs and Crime reported a 25% increase in detected trafficking victims worldwide in 2022 compared with 2019, and found that children made up 38% of all victims detected.",
      "Detected victims are only the ones someone managed to find. That is the case for outreach: teams that walk the streets, transit hubs and shelters, build trust slowly, and are there on the day a person is finally ready to accept help."],
    links: [["UNRIC: UNODC Global Report on Trafficking in Persons 2024", "https://unric.org/en/unodc-global-report-on-human-trafficking-25-per-cent-increase-of-detected-victims-and-more-children-being-exploited/"]] },
  { id: "from-alleyway", cat: "Story", date: "2026-10-27", img: "assets/img/hero.jpg", title: "From the alleyway to the outreach van",
    excerpt: "A composite story, drawn from the journeys of many people we walk with, showing what the reciprocal cycle of hope looks like in practice.",
    body: ["“Thabo” — not his real name — was found sleeping behind a taxi rank in the early hours. He had no ID, no phone and no idea how to get home. Over three weeks he slept, ate, saw a nurse and began to talk.",
      "Six months later he was helping to staff the night shelter that had taken him in. Eight months after that he was a paid peer mentor, riding in the outreach van and sitting down beside people who reminded him of himself.",
      "“Only someone who has struggled can understand the pain of another,” the team lead says. “When Thabo sits down on the pavement, people believe him.”"],
    note: "Names and details in this story are composites and have been changed to protect identities.", links: [] },
  { id: "displacement", cat: "Explainer", date: "2026-10-19", img: "assets/img/about.jpg", title: "117.8 million people displaced: what it means for a city shelter",
    excerpt: "UNHCR reports displacement fell for the first time in a decade — but more than 117 million people are still forced from their homes.",
    body: ["UNHCR’s latest Global Trends report puts the number of forcibly displaced people at the end of 2025 at 117.8 million — about one in every 70 people in the world. Displacement fell by roughly 4% in 2025, the first decline in about a decade, but remains 33% higher than five years earlier.",
      "For a city shelter, those figures arrive as individual people: a mother with two children and one bag, a man whose papers were taken, a teenager who has been travelling alone.",
      "That is why our model pairs immediate sanctuary with long-term pathways: legal identity support, housing, vocational training, and — when people are ready — leadership roles on our own teams."],
    links: [["UNHCR Global Trends", "https://www.unhcr.org/global-trends"], ["The Statesman: UNHCR 2026 Global Trends report", "https://www.thestatesman.com/world/unhcr-2026-global-trends-117-million-forcibly-displaced-worldwide-1503604458.html"]] },
  { id: "new-dawn", cat: "Field dispatch", date: "2026-10-08", img: "assets/img/m-newdawn.jpg", title: "New Dawn workshop certifies its latest cohort",
    excerpt: "Tailoring, carpentry and culinary graduates leave with recognised certificates, a starter toolkit and a job-placement partner.",
    body: ["The New Dawn Vocational Workshop certified its latest cohort this month. Graduates leave with a recognised certificate, a starter toolkit and an introduction to a placement partner.",
      "Several graduates have asked to stay on as assistant instructors — the reciprocal cycle of hope in action.",
      "The workshop is still funding-led: every R500 pays for starter carpentry or sewing equipment and 20 certified training hours for one survivor."], links: [] },
  { id: "monthly-giving", cat: "Giving", date: "2026-09-29", img: "assets/img/m-pathways.jpg", title: "What your monthly gift actually does",
    excerpt: "A look at how recurring gifts give shelters the stability to plan — and how you stay in control of every rand.",
    body: ["Emergencies are unpredictable; budgets don’t have to be. Monthly sustainers let our teams plan beds, meals and staffing weeks ahead rather than scrambling after each crisis.",
      "In your donor dashboard you can see every gift, change the monthly amount, or pause a pledge whenever you like. Anonymous gifts are welcome too — they simply can’t be set up as monthly debit orders, because we need contact details to process them.",
      "Every donation made on this demo site is simulated. No real money moves."], links: [] },
];

const list = $("#news-list"), art = $("#article");
const card = (a) => `<a class="card news-card" href="${root}pages/article.html?id=${a.id}"><img src="${root}${a.img}" alt="" loading="lazy"><div class="b"><div class="meta"><span class="pill pill-muted">${esc(a.cat)}</span>${fmtDate(a.date)}</div><h3>${esc(a.title)}</h3><p>${esc(a.excerpt)}</p><span class="link-arrow" style="margin-top:auto">Read story →</span></div></a>`;

if (list) {
  const [f, ...rest] = ARTICLES;
  list.innerHTML = `<a class="card news-feature news-card" href="${root}pages/article.html?id=${f.id}"><img src="${root}${f.img}" alt=""><div class="b"><div class="meta"><span class="pill pill-gold">Latest</span>${fmtDate(f.date)}</div><h2>${esc(f.title)}</h2><p class="muted">${esc(f.excerpt)}</p><span class="link-arrow">Read story →</span></div></a>
    <div class="news-grid">${rest.map(card).join("")}</div>`;
}
if (art) {
  const a = ARTICLES.find((x) => x.id === new URLSearchParams(location.search).get("id"));
  if (!a) art.innerHTML = `<div class="empty">${icon("newspaper")}<h3>Story not found</h3><p><a href="${root}pages/news.html">Back to all news</a></p></div>`;
  else {
    document.title = `${a.title} — PHOENOX`;
    art.innerHTML = `<a class="link-arrow" href="${root}pages/news.html">← All news &amp; updates</a>
      <h1>${esc(a.title)}</h1><div class="meta"><span class="pill pill-muted">${esc(a.cat)}</span><span>${fmtDate(a.date)}</span></div>
      <img class="cover" src="${root}${a.img}" alt="">
      ${a.body.map((p, i) => `<p>${esc(p)}</p>${i === 0 && a.quote ? `<blockquote>${esc(a.quote)}</blockquote>` : ""}`).join("")}
      ${a.note ? `<p class="small muted"><i>${esc(a.note)}</i></p>` : ""}
      ${a.links.length ? `<h2>Sources</h2><ul>${a.links.map(([t, u]) => `<li><a href="${u}" target="_blank" rel="noopener">${esc(t)}</a></li>`).join("")}</ul>` : ""}
      <div class="cta-band" style="margin-top:40px;padding:34px"><h2 style="font-size:1.5rem;margin-top:0">Be part of the next story.</h2><div class="row"><a class="btn btn-light" href="${root}pages/volunteer.html">Volunteer</a><a class="btn btn-outline-light" href="${root}pages/donate.html">Donate</a></div></div>`;
  }
}
