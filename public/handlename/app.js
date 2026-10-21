const defaultPlatforms = [
  { name: "Instagram", pattern: "https://www.instagram.com/{handle}/", weight: 96, type: "social" },
  { name: "TikTok", pattern: "https://www.tiktok.com/@{handle}", weight: 95, type: "social" },
  { name: "X / Twitter", pattern: "https://x.com/{handle}", weight: 94, type: "social" },
  { name: "Facebook", pattern: "https://www.facebook.com/{handle}", weight: 88, type: "social" },
  { name: "Threads", pattern: "https://www.threads.net/@{handle}", weight: 88, type: "social" },
  { name: "YouTube", pattern: "https://www.youtube.com/@{handle}", weight: 90, type: "video" },
  { name: "Reddit", pattern: "https://www.reddit.com/user/{handle}/", weight: 86, type: "forum" },
  { name: "GitHub", pattern: "https://github.com/{handle}", weight: 82, type: "technical" },
  { name: "Pinterest", pattern: "https://www.pinterest.com/{handle}/", weight: 78, type: "social" },
  { name: "Medium", pattern: "https://medium.com/@{handle}", weight: 74, type: "publishing" },
  { name: "Linktree", pattern: "https://linktr.ee/{handle}", weight: 84, type: "link hub" },
  { name: "SoundCloud", pattern: "https://soundcloud.com/{handle}", weight: 68, type: "audio" },
  { name: "Twitch", pattern: "https://www.twitch.tv/{handle}", weight: 72, type: "streaming" },
  { name: "Cash App", pattern: "https://cash.app/${handle}", weight: 65, type: "payment" },
  { name: "Venmo", pattern: "https://account.venmo.com/u/{handle}", weight: 64, type: "payment" },
  { name: "Meetup web search", pattern: "https://www.google.com/search?q=site%3Ameetup.com+%22{handle}%22", weight: 62, type: "meetup" }
];

const osintTools = [
  {
    name: "WhatsMyName",
    url: "https://whatsmyname.app/",
    note: "Fast public username checks across a large site catalog."
  },
  {
    name: "Sherlock",
    url: "https://github.com/sherlock-project/sherlock",
    note: "Open-source username search engine that can run inside our future back-end."
  },
  {
    name: "Maigret",
    url: "https://github.com/soxoj/maigret",
    note: "Advanced open-source username OSINT with profile metadata extraction."
  },
  {
    name: "Namechk",
    url: "https://namechk.com/",
    note: "Username and domain availability sweep."
  },
  {
    name: "KnowEm",
    url: "https://knowem.com/checkusernames.php",
    note: "Brand and username availability checks."
  },
  {
    name: "Social Searcher",
    url: "https://www.social-searcher.com/",
    note: "Public social mentions and web references."
  },
  {
    name: "Internet Archive",
    url: "https://web.archive.org/",
    note: "Historical pages, older bios, abandoned profiles, and archived mentions."
  }
];

const state = {
  scan: null,
  platforms: loadPlatforms()
};

const els = {
  form: document.querySelector("#searchForm"),
  clearBtn: document.querySelector("#clearBtn"),
  adminToggle: document.querySelector("#adminToggle"),
  adminPanel: document.querySelector("#adminPanel"),
  platformForm: document.querySelector("#platformForm"),
  platformName: document.querySelector("#platformName"),
  platformUrl: document.querySelector("#platformUrl"),
  profilesList: document.querySelector("#profilesList"),
  mentionsList: document.querySelector("#mentionsList"),
  toolsList: document.querySelector("#toolsList"),
  reportOutput: document.querySelector("#reportOutput"),
  copyReport: document.querySelector("#copyReport"),
  downloadReport: document.querySelector("#downloadReport")
};

function loadPlatforms() {
  const saved = localStorage.getItem("handlehunt.platforms");
  if (!saved) return defaultPlatforms;
  try {
    return JSON.parse(saved);
  } catch {
    return defaultPlatforms;
  }
}

function savePlatforms() {
  localStorage.setItem("handlehunt.platforms", JSON.stringify(state.platforms));
}

function cleanHandle(value) {
  return value.trim().replace(/^@+/, "").replace(/\s+/g, "");
}

function encodeQuery(value) {
  return encodeURIComponent(value.trim());
}

function profileUrl(pattern, handle) {
  return pattern.replaceAll("{handle}", encodeURIComponent(handle));
}

function confidenceLabel(score) {
  if (score >= 85) return "High profile lead";
  if (score >= 70) return "Useful profile lead";
  return "Possible lead";
}

function buildMentionQueries({ handle, name, city, alias }) {
  const exact = `"${handle}"`;
  const atHandle = `"@${handle}"`;
  const namePart = name ? `"${name}"` : "";
  const cityPart = city ? `"${city}"` : "";
  const aliases = alias
    .split(",")
    .map((item) => cleanHandle(item))
    .filter(Boolean);

  const rawQueries = [
    `${exact}`,
    `${atHandle}`,
    `${exact} ${cityPart}`,
    `${exact} ${namePart}`,
    `${atHandle} Instagram OR TikTok OR Snapchat`,
    `${exact} dating OR meetup OR event OR group`,
    `${exact} scam OR review OR complaint OR seller`,
    `site:reddit.com ${exact}`,
    `site:tiktok.com ${exact}`,
    `site:instagram.com ${exact}`,
    `site:facebook.com ${exact}`,
    `site:youtube.com ${exact}`,
    `site:github.com ${exact}`,
    `site:meetup.com ${exact}`,
    `site:eventbrite.com ${exact}`,
    ...aliases.map((item) => `"${item}" "${handle}"`)
  ].filter((query) => query.replaceAll('"', "").trim().length > 0);

  return [...new Set(rawQueries)].map((query, index) => ({
    id: `mention-${index + 1}`,
    query: query.trim(),
    google: `https://www.google.com/search?q=${encodeQuery(query)}`,
    bing: `https://www.bing.com/search?q=${encodeQuery(query)}`,
    brave: `https://search.brave.com/search?q=${encodeQuery(query)}`,
    type: query.includes("site:") ? "site search" : "web mention"
  }));
}

function runScan(input) {
  const handle = cleanHandle(input.handle);
  const name = input.name.trim();
  const city = input.city.trim();
  const alias = input.alias.trim();

  const profiles = state.platforms.map((platform, index) => {
    const score = Math.min(99, platform.weight + (city ? 2 : 0) + (name ? 2 : 0));
    return {
      id: `profile-${index + 1}`,
      platform: platform.name,
      url: profileUrl(platform.pattern, handle),
      score,
      type: platform.type,
      status: "Needs verification",
      reason: confidenceLabel(score)
    };
  });

  const mentions = buildMentionQueries({ handle, name, city, alias });
  const tools = osintTools.map((tool) => ({
    ...tool,
    searchTip: `Search for ${handle}${alias ? ` plus ${alias}` : ""}`
  }));

  return {
    createdAt: new Date().toISOString(),
    search: { handle, name, city, alias },
    totals: {
      profiles: profiles.length,
      mentions: mentions.length,
      tools: tools.length,
      highValue: profiles.filter((item) => item.score >= 85).length
    },
    profiles,
    mentions,
    tools,
    nextBackendSteps: [
      "Add a server-side checker for HTTP status, redirects, and profile-title extraction.",
      "Run Sherlock and Maigret in a background job for broader username coverage.",
      "Connect Google/Bing/Brave APIs for real mention result ingestion.",
      "Add PDF export, Stripe paid reports, and admin-only source editing."
    ]
  };
}

function renderCard(item, kind) {
  if (kind === "profile") {
    return `
      <article class="card">
        <div class="card-head">
          <div>
            <h4>${item.platform}</h4>
            <p>${item.reason}. Browser opens the generated public profile/search URL.</p>
          </div>
          <span class="tag ${item.score >= 85 ? "good" : "warn"}">${item.score}%</span>
        </div>
        <div class="tag-row">
          <span class="tag">${item.type}</span>
          <span class="tag">${item.status}</span>
        </div>
        <a href="${item.url}" target="_blank" rel="noreferrer">Open ${item.platform}</a>
      </article>
    `;
  }

  if (kind === "mention") {
    return `
      <article class="card">
        <div class="card-head">
          <div>
            <h4>${item.query}</h4>
            <p>Use this to catch posts, comments, bios, forums, event pages, and indexed dating/meetup references.</p>
          </div>
          <span class="tag">${item.type}</span>
        </div>
        <div class="tag-row">
          <a href="${item.google}" target="_blank" rel="noreferrer">Google</a>
          <a href="${item.bing}" target="_blank" rel="noreferrer">Bing</a>
          <a href="${item.brave}" target="_blank" rel="noreferrer">Brave</a>
        </div>
      </article>
    `;
  }

  return `
    <article class="card">
      <div class="card-head">
        <div>
          <h4>${item.name}</h4>
          <p>${item.note}</p>
        </div>
        <span class="tag good">free source</span>
      </div>
      <p>${item.searchTip}</p>
      <a href="${item.url}" target="_blank" rel="noreferrer">Open ${item.name}</a>
    </article>
  `;
}

function renderScan(scan) {
  document.querySelector("#profileCount").textContent = scan.totals.profiles;
  document.querySelector("#mentionCount").textContent = scan.totals.mentions;
  document.querySelector("#osintCount").textContent = scan.totals.tools;
  document.querySelector("#scoreCount").textContent = scan.totals.highValue;

  els.profilesList.className = "result-list";
  els.mentionsList.className = "result-list";
  els.toolsList.className = "result-list";
  els.profilesList.innerHTML = scan.profiles.map((item) => renderCard(item, "profile")).join("");
  els.mentionsList.innerHTML = scan.mentions.map((item) => renderCard(item, "mention")).join("");
  els.toolsList.innerHTML = scan.tools.map((item) => renderCard(item, "tool")).join("");
  els.reportOutput.textContent = JSON.stringify(scan, null, 2);
}

function resetScan() {
  state.scan = null;
  els.form.reset();
  document.querySelector("#profileCount").textContent = "0";
  document.querySelector("#mentionCount").textContent = "0";
  document.querySelector("#osintCount").textContent = "0";
  document.querySelector("#scoreCount").textContent = "0";
  els.profilesList.className = "result-list empty-state";
  els.mentionsList.className = "result-list empty-state";
  els.toolsList.className = "result-list empty-state";
  els.profilesList.textContent = "Run a scan to generate profile leads.";
  els.mentionsList.textContent = "Run a scan to generate mention searches.";
  els.toolsList.textContent = "Run a scan to generate OSINT tool links.";
  els.reportOutput.textContent = '{ "status": "No scan yet" }';
}

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((item) => item.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach((item) => item.classList.remove("active"));
    tab.classList.add("active");
    document.querySelector(`#${tab.dataset.tab}`).classList.add("active");
  });
});

els.form.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(els.form).entries());
  state.scan = runScan(data);
  renderScan(state.scan);
});

els.clearBtn.addEventListener("click", resetScan);

els.adminToggle.addEventListener("click", () => {
  els.adminPanel.classList.toggle("hidden");
});

els.platformForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = els.platformName.value.trim();
  const pattern = els.platformUrl.value.trim();
  if (!name || !pattern.includes("{handle}")) return;
  state.platforms.push({ name, pattern, weight: 60, type: "custom" });
  savePlatforms();
  els.platformForm.reset();
  if (state.scan) {
    state.scan = runScan(state.scan.search);
    renderScan(state.scan);
  }
});

els.copyReport.addEventListener("click", async () => {
  await navigator.clipboard.writeText(els.reportOutput.textContent);
  els.copyReport.textContent = "Copied";
  setTimeout(() => {
    els.copyReport.textContent = "Copy report JSON";
  }, 1200);
});

els.downloadReport.addEventListener("click", () => {
  const blob = new Blob([els.reportOutput.textContent], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "handlehunt-report.json";
  link.click();
  URL.revokeObjectURL(url);
});
