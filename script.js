// ===============================
// 1) CONFIG / HELPERS
// ===============================
const DATA_URL = "data/projects.json";

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

function showToast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.style.display = "block";
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => (t.style.display = "none"), 2200);
}

function openModal(title, html) {
  $("#modalTitle").textContent = title;
  $("#modalBody").innerHTML = html;
  $("#modalOverlay").style.display = "flex";
  $("#modalOverlay").setAttribute("aria-hidden", "false");
}

function closeModal() {
  $("#modalOverlay").style.display = "none";
  $("#modalOverlay").setAttribute("aria-hidden", "true");
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast("Copied ✅");
  } catch {
    showToast("Copy failed (browser blocked).");
  }
}

// ===============================
// 2) NAVIGATION (PAGES)
// ===============================
function setActivePage(pageKey) {
  $$(".page").forEach((p) => p.classList.remove("active"));
  const pageEl = $(`#page-${pageKey}`);
  if (pageEl) pageEl.classList.add("active");

  $$(".navBtn").forEach((b) => b.classList.remove("active"));
  const navBtn = $(`.navBtn[data-page="${pageKey}"]`);
  if (navBtn) navBtn.classList.add("active");

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function bindNavigation() {
  // sidebar buttons
  $$(".navBtn").forEach((b) => {
    b.addEventListener("click", () => setActivePage(b.dataset.page));
  });

  // brand click -> home
  $("#brandHome").addEventListener("click", () => setActivePage("home"));
  $("#brandHome").addEventListener("keydown", (e) => {
    if (e.key === "Enter") setActivePage("home");
  });

  // Home hero button
  $("#btnExploreProjects").addEventListener("click", () => setActivePage("projects"));
}

// ===============================
// 3) THEME
// ===============================
function setTheme(mode) {
  if (mode === "light") document.body.classList.add("light");
  else document.body.classList.remove("light");
  localStorage.setItem("theme", mode);
}

function toggleTheme() {
  const isLight = document.body.classList.contains("light");
  setTheme(isLight ? "dark" : "light");
  showToast(isLight ? "Dark mode 🌙" : "Light mode ☀️");
}

// ===============================
// 4) PROJECT CARD RENDERING
// ===============================
function renderProjectCard(p) {
  const safePreview = p.previewImage && p.previewImage.trim().length > 0;
  const githubOk = p.githubUrl && p.githubUrl.trim().length > 0;
  const openOk = p.openUrl && p.openUrl.trim().length > 0;

  const tagsHtml = (p.tags || []).map(t => `<span class="tag">${t}</span>`).join("");

  const previewBtn = safePreview
    ? `<button class="btn" data-action="preview" data-img="${p.previewImage}" data-title="${escapeHtml(p.title)}">Preview</button>`
    : `<button class="btn" disabled title="No preview yet">Preview</button>`;

  const githubBtn = githubOk
    ? `<button class="btn ghost" data-action="github" data-url="${p.githubUrl}">GitHub</button>`
    : `<button class="btn ghost" disabled title="Add githubUrl in projects.json">GitHub</button>`;

  const openBtn = openOk
    ? `<button class="btn ghost" data-action="open" data-url="${p.openUrl}">Open</button>`
    : `<button class="btn ghost" disabled title="Add openUrl in projects.json">Open</button>`;

  const highlights = (p.highlights || []).slice(0, 3).map(h => `<li>${escapeHtml(h)}</li>`).join("");

  return `
    <div class="projectCard hoverPop" data-search="${normalizeForSearch(p)}">
      <div class="projectTitle">${escapeHtml(p.title)}</div>
      <div class="projectSub">${escapeHtml(p.subtitle || "")}</div>
      <div class="projectDesc">${escapeHtml(p.description || "")}</div>

      ${highlights ? `<ul class="list compact" style="margin-top:10px;">${highlights}</ul>` : ""}

      <div class="row" style="margin-top:10px;">
        ${previewBtn}
        ${githubBtn}
        ${openBtn}
      </div>

      <div class="tagRow">${tagsHtml}</div>
    </div>
  `;
}

function escapeHtml(str) {
  return String(str || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizeForSearch(p) {
  const all = [
    p.title, p.subtitle, p.description,
    ...(p.tags || []),
    ...(p.highlights || [])
  ].filter(Boolean).join(" ");
  return all.toLowerCase();
}

// ===============================
// 5) FEATURED PROJECT ON HOME
// ===============================
function setFeatured(featuredProject) {
  $("#featuredTitle").textContent = `⭐ Featured Project — ${featuredProject.title}`;
  $("#featuredDesc").textContent = featuredProject.description || "";

  const img = $("#featuredImg");
  img.src = featuredProject.previewImage || "";
  img.style.display = featuredProject.previewImage ? "block" : "none";

  const hl = $("#featuredHighlights");
  hl.innerHTML = "";
  (featuredProject.highlights || []).slice(0, 3).forEach((h) => {
    const li = document.createElement("li");
    li.textContent = h;
    hl.appendChild(li);
  });

  $("#btnFeaturedPreview").onclick = () => {
    if (!featuredProject.previewImage) return showToast("No preview image set.");
    openModal("Preview", `<img src="${featuredProject.previewImage}" style="width:100%; border-radius:14px; border:1px solid var(--border);" />`);
  };

  $("#btnFeaturedGitHub").onclick = () => {
    if (!featuredProject.githubUrl) return showToast("No GitHub link set.");
    window.open(featuredProject.githubUrl, "_blank");
  };

  $("#btnFeaturedOpen").onclick = () => {
    if (!featuredProject.openUrl) return showToast("No project link set.");
    window.open(featuredProject.openUrl, "_blank");
  };

  // click image -> preview
  img.onclick = () => {
    if (!featuredProject.previewImage) return;
    openModal("Preview", `<img src="${featuredProject.previewImage}" style="width:100%; border-radius:14px; border:1px solid var(--border);" />`);
  };
}

// ===============================
// 6) SKILLS RENDER
// ===============================
function renderSkills(skills) {
  const wrap = $("#skillChips");
  wrap.innerHTML = "";

  skills.forEach((s) => {
    const btn = document.createElement("button");
    btn.className = "skillChip";
    btn.textContent = s.name;
    btn.addEventListener("click", () => {
      $("#skillInfo").textContent = s.text;
      showToast(`Skill: ${s.name}`);
    });
    wrap.appendChild(btn);
  });
}

// ===============================
// 7) COLLAPSIBLE SECTIONS (Projects page)
// ===============================
function bindCollapsibles() {
  $$("[data-toggle]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.toggle;
      const body = document.getElementById(id);
      const isOpen = body.style.display !== "none";
      body.style.display = isOpen ? "none" : "block";
      btn.querySelector(".chev").textContent = isOpen ? "▸" : "▾";
    });
  });
}

// ===============================
// 8) SEARCH
// ===============================
function applySearch(query) {
  const q = (query || "").trim().toLowerCase();

  // Search inside project cards only (Projects page)
  const cards = $$("#page-projects .projectCard");
  cards.forEach((c) => {
    const hay = c.getAttribute("data-search") || "";
    const match = !q || hay.includes(q);
    c.style.display = match ? "block" : "none";
  });
}

// ===============================
// 9) CONTACT / HELP / BUTTONS
// ===============================
function bindTopButtons(profile) {
  $("#themeBtn").addEventListener("click", toggleTheme);

  $("#helpBtn").addEventListener("click", () => {
    openModal("Help", `
      <ul class="list compact">
        <li>Projects auto-load from <code>data/projects.json</code></li>
        <li>To add a new Excel project: add a new object under <b>projects.excel</b></li>
        <li>To add a new SQL project: add a new object under <b>projects.sql</b></li>
      </ul>
    `);
  });

  const contact = () => {
    openModal("Contact", `
      <p class="muted">Open my profiles:</p>
      <div class="row">
        <button class="btn" onclick="window.open('${profile.links.linkedin}','_blank')">LinkedIn</button>
        <button class="btn ghost" onclick="window.open('${profile.links.github}','_blank')">GitHub</button>
      </div>
      <div style="margin-top:10px;">
        <button class="btn ghost" onclick="navigator.clipboard.writeText('${profile.links.linkedin}')">Copy LinkedIn</button>
        <button class="btn ghost" onclick="navigator.clipboard.writeText('${profile.links.github}')">Copy GitHub</button>
      </div>
    `);
  };

  $("#contactBtn").addEventListener("click", contact);
  $("#openContactBtn2").addEventListener("click", contact);

  $("#btnOpenLinkedIn").addEventListener("click", () => window.open(profile.links.linkedin, "_blank"));
  $("#btnOpenGitHub").addEventListener("click", () => window.open(profile.links.github, "_blank"));

  $("#downloadResumeBtn").addEventListener("click", () => {
    showToast("Add resume.pdf later and link it.");
  });

  $("#scrollTopBtn").addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

  $("#copyAboutBtn").addEventListener("click", () => copyText(profile.summary));

  $("#clearSearchBtn").addEventListener("click", () => {
    $("#searchInput").value = "";
    applySearch("");
    showToast("Search cleared");
  });

  $("#searchInput").addEventListener("input", (e) => applySearch(e.target.value));
}

// ===============================
// 10) PROJECT BUTTON ACTIONS (event delegation)
// ===============================
function bindProjectActions() {
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;

    const action = btn.dataset.action;

    if (action === "preview") {
      const img = btn.dataset.img;
      const title = btn.dataset.title || "Preview";
      if (!img) return showToast("No preview set.");
      openModal(title, `<img src="${img}" style="width:100%; border-radius:14px; border:1px solid var(--border);" />`);
    }

    if (action === "github" || action === "open") {
      const url = btn.dataset.url;
      if (!url) return showToast("Link not set yet.");
      window.open(url, "_blank");
    }
  });
}

// ===============================
// 11) LOAD DATA + RENDER
// ===============================
async function loadData() {
  const res = await fetch(DATA_URL);
  if (!res.ok) throw new Error("Could not load projects.json");
  return res.json();
}

function renderProfile(profile) {
  $("#profileName").textContent = profile.name || "Your Name";
  $("#profileHeadline").textContent = profile.headline || "Portfolio";
  $("#profileSummary").textContent = profile.summary || "";

  $("#coreSkillsText").textContent = (profile.coreSkills || []).join(" • ");
  $("#currentFocusText").textContent = profile.currentFocus || "Projects";

  // About page
  $("#aboutSummary").textContent = profile.summary || "";
  $("#aboutGitHub").textContent = "GitHub Profile";
  $("#aboutGitHub").href = profile.links.github;

  $("#aboutLinkedIn").textContent = "LinkedIn Profile";
  $("#aboutLinkedIn").href = profile.links.linkedin;
}

function findFeatured(data) {
  const f = data.featured;
  if (!f) return null;
  const list = data.projects?.[f.category] || [];
  return list.find(p => p.id === f.id) || null;
}

function renderProjects(data) {
  const excelWrap = $("#excelProjects");
  const sqlWrap = $("#sqlProjects");

  excelWrap.innerHTML = (data.projects.excel || []).map(renderProjectCard).join("");
  sqlWrap.innerHTML = (data.projects.sql || []).map(renderProjectCard).join("");
}

// ===============================
// 12) INIT
// ===============================
async function init() {
  // year
  $("#year").textContent = new Date().getFullYear();

  // theme
  setTheme(localStorage.getItem("theme") || "dark");

  // modal close
  $("#modalCloseBtn").addEventListener("click", closeModal);
  $("#modalOverlay").addEventListener("click", (e) => {
    if (e.target.id === "modalOverlay") closeModal();
  });

  bindNavigation();
  bindCollapsibles();
  bindProjectActions();

  try {
    const data = await loadData();

    renderProfile(data.profile);
    bindTopButtons(data.profile);

    renderSkills(data.skills || []);
    renderProjects(data);

    const featured = findFeatured(data);
    if (featured) {
      setFeatured(featured);
      $("#featuredText").textContent = featured.subtitle ? "Featured Project" : "Featured";
      $("#featuredImg").src = featured.previewImage || "";
    } else {
      $("#featuredCard").style.display = "none";
    }

    // brand click already works, but toast can be helpful
    $("#brandHome").addEventListener("click", () => showToast("Home"));

  } catch (err) {
    openModal("Error", `<p class="muted">${err.message}</p>
      <p class="muted">Make sure you created <code>data/projects.json</code> and you are running Live Server.</p>`);
  }
}

init();
