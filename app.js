/* Mathera — painting-first world views (Eras I–IV) */
(() => {
  const TAGS = {
    count: "Things begin here.",
    operate: "Do things to numbers.",
    relate: "See connections.",
    solve: "Find the unknown.",
    prove: "Know it's true.",
    motion: "Understand change.",
    space: "Explore higher worlds.",
  };

  const WORLD_META = {
    count: {
      title: "THE LIVING GROVE",
      bg: "assets/tapestry/living-grove.jpg",
      quote: "To count is to notice that the world is full of things.",
      previewLine: "Build your number sense.",
    },
    operate: {
      title: "FORGE CITY",
      bg: "assets/tapestry/forge-city.jpg",
      quote: "To operate is to shape what numbers can become.",
      previewLine: "Learn to act on numbers.",
    },
    relate: {
      title: "BRIDGE ISLES",
      bg: "assets/tapestry/bridge-isles.jpg",
      quote: "To relate is to see the hidden bridges between things.",
      previewLine: "See how numbers connect.",
    },
    solve: {
      title: "PEAK RANGE",
      bg: "assets/tapestry/peak-range.jpg",
      quote: "To solve is to find what the mountain hides.",
      previewLine: "Hunt for the unknown.",
    },
    prove: {
      title: "PROOF PALACE",
      bg: null,
      quote: "To prove is to know — and know why.",
      previewLine: "Make certainty shine.",
    },
    motion: {
      title: "TIDE SEA",
      bg: null,
      quote: "To understand motion is to read the living tide.",
      previewLine: "Watch how change unfolds.",
    },
    space: {
      title: "STAR VAULT",
      bg: null,
      quote: "To explore space is to walk among higher worlds.",
      previewLine: "Reach beyond the familiar.",
    },
  };

  const ERA_ICONS = {
    count: `<svg viewBox="0 0 24 24" fill="none"><path d="M12 20C12 20 5 15.5 5 10.5C5 7.5 7.2 5.5 9.8 5.5C11.2 5.5 12 6.4 12 6.4S12.8 5.5 14.2 5.5C16.8 5.5 19 7.5 19 10.5C19 15.5 12 20 12 20Z" stroke="currentColor" stroke-width="1.6" fill="rgba(61,155,143,.25)"/></svg>`,
    operate: `<svg viewBox="0 0 24 24" fill="none"><path d="M12 8.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7z" stroke="currentColor" stroke-width="1.5"/><path d="M12 3.5v2M12 18.5v2M3.5 12h2M18.5 12h2M6.1 6.1l1.4 1.4M16.5 16.5l1.4 1.4M6.1 17.9l1.4-1.4M16.5 7.5l1.4-1.4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
    relate: `<svg viewBox="0 0 24 24" fill="none"><path d="M4 16c3-5 6-7 8-7s5 2 8 7" stroke="currentColor" stroke-width="1.5" fill="none"/><circle cx="6" cy="14" r="1.6" fill="currentColor"/><circle cx="12" cy="9.5" r="1.6" fill="currentColor"/><circle cx="18" cy="14" r="1.6" fill="currentColor"/></svg>`,
    solve: `<svg viewBox="0 0 24 24" fill="none"><path d="M3 19L9 8l4 5 4-8 4 14H3z" stroke="currentColor" stroke-width="1.5" fill="rgba(200,210,230,.12)"/></svg>`,
    prove: `<svg viewBox="0 0 24 24" fill="none"><path d="M5 19V10l7-5 7 5v9" stroke="currentColor" stroke-width="1.5"/><rect x="10" y="13" width="4" height="6" fill="currentColor" opacity=".5"/></svg>`,
    motion: `<svg viewBox="0 0 24 24" fill="none"><path d="M3 13c3-3 5 3 8 0s5-3 8 0" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`,
    space: `<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3.2" fill="currentColor" opacity=".55"/><ellipse cx="12" cy="12" rx="9" ry="3.5" stroke="currentColor" stroke-width="1.3" transform="rotate(-24 12 12)"/></svg>`,
  };

  const DOMAIN_ICONS = [
    `<svg viewBox="0 0 16 16" fill="none"><path d="M5 8h6M8 5v6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="8" cy="8" r="5.5" stroke="currentColor" stroke-width="1.2" opacity=".5"/></svg>`,
    `<svg viewBox="0 0 16 16" fill="none"><path d="M3 8h10M5 5L3 8l2 3M11 5l2 3-2 3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    `<svg viewBox="0 0 16 16" fill="none"><rect x="2" y="9" width="4" height="4" rx=".5" stroke="currentColor" stroke-width="1.2"/><rect x="6.5" y="5" width="4" height="8" rx=".5" stroke="currentColor" stroke-width="1.2"/><rect x="11" y="2" width="3" height="11" rx=".5" stroke="currentColor" stroke-width="1.2"/></svg>`,
    `<svg viewBox="0 0 16 16" fill="none"><path d="M4 8h8M8 4v8M3 12h4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>`,
    `<svg viewBox="0 0 16 16" fill="none"><circle cx="4" cy="8" r="1.4" fill="currentColor"/><circle cx="8" cy="4.5" r="1.4" fill="currentColor"/><circle cx="12" cy="8" r="1.4" fill="currentColor"/><circle cx="8" cy="11.5" r="1.4" fill="currentColor"/><path d="M4 8h8M8 4.5v7" stroke="currentColor" stroke-width="1" opacity=".5"/></svg>`,
    `<svg viewBox="0 0 16 16" fill="none"><rect x="2.5" y="2.5" width="5" height="5" stroke="currentColor" stroke-width="1.2"/><circle cx="11.5" cy="5" r="2.5" stroke="currentColor" stroke-width="1.2"/><path d="M3 13.5L5.5 9l2.5 4.5H3z" stroke="currentColor" stroke-width="1.2"/></svg>`,
    `<svg viewBox="0 0 16 16" fill="none"><path d="M8 2l1.5 3.2L13 6l-2.5 2.2L11.2 12 8 10.3 4.8 12l.7-3.8L3 6l3.5-.8L8 2z" stroke="currentColor" stroke-width="1.1"/></svg>`,
  ];

  /* Branch pill positions (% of grove-tree) — per-era scatter over the painting */
  const BRANCH_POS = {
    count: [  /* Living Grove canopy — 7 domains */
      { left: "7%",  top: "16%" },
      { left: "24%", top: "34%" },
      { left: "5%",  top: "52%" },
      { left: "26%", top: "70%" },
      { left: "56%", top: "18%" },
      { left: "60%", top: "42%" },
      { left: "52%", top: "64%" },
    ],
    operate: [  /* Forge City — 10 domains around forge / streets */
      { left: "6%",  top: "14%" },
      { left: "28%", top: "12%" },
      { left: "52%", top: "16%" },
      { left: "8%",  top: "36%" },
      { left: "30%", top: "40%" },
      { left: "55%", top: "38%" },
      { left: "5%",  top: "58%" },
      { left: "27%", top: "62%" },
      { left: "50%", top: "58%" },
      { left: "18%", top: "78%" },
    ],
    relate: [  /* Bridge Isles — 9 domains across islands */
      { left: "5%",  top: "18%" },
      { left: "32%", top: "14%" },
      { left: "58%", top: "20%" },
      { left: "8%",  top: "42%" },
      { left: "36%", top: "40%" },
      { left: "60%", top: "46%" },
      { left: "10%", top: "66%" },
      { left: "34%", top: "68%" },
      { left: "56%", top: "70%" },
    ],
    solve: [  /* Peak Range — 15 domains across mountain tiers */
      { left: "8%",  top: "8%" },
      { left: "28%", top: "6%" },
      { left: "48%", top: "10%" },
      { left: "4%",  top: "24%" },
      { left: "22%", top: "26%" },
      { left: "42%", top: "22%" },
      { left: "58%", top: "28%" },
      { left: "6%",  top: "44%" },
      { left: "26%", top: "46%" },
      { left: "46%", top: "42%" },
      { left: "62%", top: "48%" },
      { left: "10%", top: "64%" },
      { left: "30%", top: "66%" },
      { left: "50%", top: "62%" },
      { left: "20%", top: "80%" },
    ],
  };

  function branchPositions(eraId, n) {
    const base = BRANCH_POS[eraId];
    if (base && base.length) {
      return Array.from({ length: n }, (_, i) => {
        if (base[i]) return base[i];
        const col = i % 4;
        const row = Math.floor(i / 4);
        return { left: `${6 + col * 18}%`, top: `${10 + row * 22}%` };
      });
    }
    return Array.from({ length: n }, (_, i) => {
      const col = i % 4;
      const row = Math.floor(i / 4);
      return { left: `${6 + col * 18}%`, top: `${12 + row * 22}%` };
    });
  }

  const ORB_SVG = {
    count: `<svg viewBox="0 0 48 48" fill="none"><path d="M24 42 V18" stroke="#c4a574" stroke-width="3" stroke-linecap="round"/><path d="M24 22 C14 14, 12 8, 18 6 C22 12, 24 14, 24 14 C24 14, 26 12, 30 6 C36 8, 34 14, 24 22Z" fill="#5dca7a"/><path d="M24 28 C10 24, 8 16, 14 14 C18 20, 24 22, 24 22 C24 22, 30 20, 34 14 C40 16, 38 24, 24 28Z" fill="#3da85c"/></svg>`,
    operate: `<svg viewBox="0 0 48 48" fill="none"><rect x="10" y="22" width="10" height="16" rx="1" fill="#dcc09a"/><rect x="22" y="14" width="12" height="24" rx="1" fill="#c4a574"/><rect x="28" y="8" width="8" height="30" rx="1" fill="#e8d2a8"/></svg>`,
    relate: `<svg viewBox="0 0 48 48" fill="none"><path d="M8 34 C16 20, 32 20, 40 34" stroke="#c8d6ff" stroke-width="2.5" fill="none"/><circle cx="12" cy="30" r="3" fill="#9bb7ff"/><circle cx="24" cy="22" r="3" fill="#9bb7ff"/><circle cx="36" cy="30" r="3" fill="#9bb7ff"/></svg>`,
    solve: `<svg viewBox="0 0 48 48" fill="none"><path d="M6 38 L18 18 L28 28 L42 10 L42 38 Z" fill="#dfe6f2"/></svg>`,
    prove: `<svg viewBox="0 0 48 48" fill="none"><path d="M8 38 V18 L24 8 L40 18 V38 Z" fill="#f0e6c8"/><rect x="20" y="26" width="8" height="12" fill="#c4a868"/></svg>`,
    motion: `<svg viewBox="0 0 48 48" fill="none"><path d="M4 30 C12 24, 20 36, 28 30 S 40 24, 46 30" stroke="#7ad4e4" stroke-width="2.5" fill="none"/></svg>`,
    space: `<svg viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="10" fill="#c4a0ff" opacity=".85"/></svg>`,
  };

  const BG_FALLBACK = {
    count: "linear-gradient(180deg,#1a2a1c,#0a120c)",
    operate: "linear-gradient(180deg,#2a1c10,#0e0a06)",
    relate: "linear-gradient(180deg,#121a2c,#0a101c)",
    solve: "linear-gradient(180deg,#141c2a,#0a1018)",
    prove: "linear-gradient(180deg,#1c1810,#0e0c08)",
    motion: "linear-gradient(180deg,#0a1820,#061018)",
    space: "radial-gradient(ellipse at 50% 40%,#1a1030,#07040f)",
  };

  let ERAS = [];
  let stepLabels = { a: "See it", b: "Try it", c: "Use it", d: "Explain it" };
  const nav = {
    view: "universe", eraId: null, domainIdx: 0, skillId: null,
  };

  const eraById = id => ERAS.find(e => e.id === id);

  function counts(era) {
    let proven = 0, total = 0, growing = 0;
    for (const d of era.domains) for (const s of d.skills) {
      total++; if (s.state === "proven") proven++; else if (s.state === "growing") growing++;
    }
    return { proven, total, growing };
  }

  function toast(msg) {
    const t = document.getElementById("toast");
    t.textContent = msg; t.classList.add("show");
    clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove("show"), 1600);
  }

  function setView(name) {
    nav.view = name;
    document.body.classList.toggle("land", name === "universe");
    document.body.classList.toggle("grove", name === "world");
    const map = { universe: "viewUniverse", world: "viewWorld", skill: "viewSkill" };
    Object.values(map).forEach(id => document.getElementById(id).classList.remove("show"));
    document.getElementById(map[name]).classList.add("show");
    renderContinue();
  }

  function skillCode(id) {
    const p = id.split(".");
    return p.length >= 3 ? `${p[1]}.${p[2]}` : id;
  }

  function domainHeader(dom, idx) {
    const era = eraById(nav.eraId);
    const eraNum = era ? ERAS.indexOf(era) + 1 : 1;
    let domNum = idx + 1;
    if (dom.id) {
      const m = String(dom.id).match(/\.(\d+)$/);
      if (m) domNum = +m[1];
    }
    return `${eraNum}.${domNum} ${dom.name.toUpperCase()}`;
  }

  function shortDomainName(name) {
    return String(name).toUpperCase();
  }

  /* ── Universe landing ── */
  function renderUniverse() {
    nav.eraId = null; nav.domainIdx = 0; nav.skillId = null;
    setView("universe");
    const root = document.getElementById("panels");
    root.innerHTML = ERAS.map(e => {
      return `<button type="button" class="panel ${e.unlock ? "" : "locked"}" data-id="${e.id}">
        ${e.unlock ? "" : '<span class="panel-lock">🔒</span>'}
        <div class="panel-body">
          <div class="panel-name">${e.name.toUpperCase()}</div>
        </div>
      </button>`;
    }).join("");
    root.querySelectorAll(".panel").forEach(p => {
      p.onclick = () => {
        const era = eraById(p.dataset.id);
        if (!era.unlock) { toast("Still beyond the horizon"); return; }
        openWorld(era.id);
      };
    });
  }

  /* ── Era rail ── */
  function renderEraRail() {
    const rail = document.getElementById("eraRail");
    const items = ERAS.map(e => {
      const on = e.id === nav.eraId ? "on" : "";
      const locked = e.unlock ? "" : "locked";
      return `<button type="button" class="era-item ${on} ${locked}" data-id="${e.id}" title="${e.name}">
        <span class="ei">${ERA_ICONS[e.id] || ""}</span>
        <span class="el">${e.romanLabel || ""} ${e.name}</span>
      </button>`;
    }).join("");

    rail.innerHTML = `
      <div class="era-rail-brand">
        <div class="logo">Mathera</div>
        <span class="tag">Explore · Learn · Grow</span>
      </div>
      <div class="era-list">${items}</div>
      <div class="era-rail-foot">
        <button type="button" class="world-map-btn" id="worldMapBtn" title="World Map">
          <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8.5" stroke="currentColor" stroke-width="1.4"/><path d="M12 5v2.5M12 16.5V19M5 12h2.5M16.5 12H19" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path d="M12 12l3.2-4.2 1 3.4-3.5.8z" fill="currentColor"/></svg>
          WORLD MAP
        </button>
        <button type="button" class="settings-stub" title="Settings" id="settingsStub" aria-label="Settings">
          <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.5"/><path d="M12 3.5v2M12 18.5v2M3.5 12h2M18.5 12h2M6.1 6.1l1.4 1.4M16.5 16.5l1.4 1.4M6.1 17.9l1.4-1.4M16.5 7.5l1.4-1.4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
        </button>
      </div>`;

    rail.querySelectorAll(".era-item").forEach(b => {
      b.onclick = () => {
        const era = eraById(b.dataset.id);
        if (!era.unlock) { toast("Still beyond the horizon"); return; }
        openWorld(era.id);
      };
    });
    document.getElementById("worldMapBtn").onclick = () => renderUniverse();
    document.getElementById("settingsStub").onclick = () => toast("Settings coming soon");
  }

  /* ── World / Living Grove ── */
  function openWorld(eraId, opts = {}) {
    const switching = nav.eraId !== eraId;
    nav.eraId = eraId;
    const era = eraById(eraId);
    const meta = WORLD_META[eraId] || {};
    const c = counts(era);

    const shell = document.getElementById("groveShell");
    const bg = meta.bg
      ? `url("${meta.bg}")`
      : (BG_FALLBACK[eraId] || BG_FALLBACK.count);
    shell.style.setProperty("--grove-bg", bg);

    document.getElementById("groveKicker").textContent =
      `ERA ${era.romanLabel || ""} · ${era.name.toUpperCase()}`;
    document.getElementById("groveTitle").textContent =
      meta.title || (era.worldName || era.name).toUpperCase();
    document.getElementById("groveTagline").textContent = TAGS[eraId] || "";
    document.getElementById("groveStatsText").textContent =
      `${c.total} skills · ${era.domains.length} domains`;

    document.getElementById("detailQuote").textContent =
      meta.quote ? `“${meta.quote}”` : "";

    if (switching || opts.reset || nav.domainIdx == null || !era.domains[nav.domainIdx]) {
      nav.domainIdx = 0;
      const dom0 = era.domains[0];
      const prefer = dom0 && dom0.skills.find(s => /\.03$/.test(s.id));
      nav.skillId = prefer ? prefer.id : (dom0 && dom0.skills[0] ? dom0.skills[0].id : null);
    } else if (!nav.skillId || !findSkill(era, nav.skillId)) {
      const dom = era.domains[nav.domainIdx];
      const prefer = dom.skills.find(s => /\.03$/.test(s.id));
      nav.skillId = prefer ? prefer.id : (dom.skills[0] ? dom.skills[0].id : null);
    }

    renderEraRail();
    renderBranches();
    renderDetailPanel();
    setView("world");

    if (window.matchMedia("(max-width:960px)").matches) {
      shell.classList.add("panel-open");
    } else {
      shell.classList.remove("panel-open");
    }
  }

  function renderBranches() {
    const era = eraById(nav.eraId);
    const tree = document.getElementById("groveTree");
    const positions = branchPositions(era.id, era.domains.length);
    const nodes = era.domains.map((d, i) => {
      const pos = positions[i];
      const on = i === nav.domainIdx ? "on" : "";
      const icon = DOMAIN_ICONS[i % DOMAIN_ICONS.length];
      const leaves = d.skills.map(s => {
        const st = s.state || "seed";
        return `<span class="leaf-dot ${st}" title="${s.title}"></span>`;
      }).join("");
      return `<div class="branch-node ${on}" data-di="${i}"
        style="left:${pos.left};top:${pos.top}">
        <button type="button" class="branch-pill" data-di="${i}">
          <span class="bn">${i + 1}</span>
          <span class="bi">${icon}</span>
          <span class="bt">${shortDomainName(d.name)}</span>
        </button>
        <div class="leaf-row" aria-hidden="true">${leaves}</div>
      </div>`;
    }).join("");

    tree.innerHTML = nodes;
    tree.querySelectorAll(".branch-node").forEach(b => {
      b.onclick = () => selectDomain(+b.dataset.di);
    });
  }

  function selectDomain(di) {
    const era = eraById(nav.eraId);
    if (!era.domains[di]) return;
    nav.domainIdx = di;
    const dom = era.domains[di];
    // Keep current skill if still in domain; else first / .03
    const still = dom.skills.find(s => s.id === nav.skillId);
    if (!still) {
      const prefer = dom.skills.find(s => /\.03$/.test(s.id));
      nav.skillId = prefer ? prefer.id : (dom.skills[0] ? dom.skills[0].id : null);
    }
    renderBranches();
    renderDetailPanel();
    document.getElementById("groveShell").classList.add("panel-open");
  }

  function selectSkill(sid) {
    nav.skillId = sid;
    renderDetailPanel();
  }

  function renderDetailPanel() {
    const era = eraById(nav.eraId);
    const di = nav.domainIdx ?? 0;
    const dom = era.domains[di];
    if (!dom) return;
    const meta = WORLD_META[era.id] || {};

    document.getElementById("detailDomainTitle").textContent = domainHeader(dom, di);
    document.getElementById("detailDomainCount").textContent = `${dom.skills.length} skills`;

    // Domain-specific quote only for Counting (domain 0 of count) by default
    const quoteEl = document.getElementById("detailQuote");
    if (era.id === "count" && di === 0) {
      quoteEl.textContent = `“${meta.quote || "To count is to notice that the world is full of things."}”`;
      quoteEl.style.display = "";
    } else if (meta.quote && di === 0) {
      quoteEl.textContent = `“${meta.quote}”`;
      quoteEl.style.display = "";
    } else {
      quoteEl.style.display = "none";
    }

    const list = document.getElementById("skillList");
    list.innerHTML = dom.skills.map(s => {
      const st = s.state || "seed";
      const on = s.id === nav.skillId ? "on" : "";
      return `<button type="button" class="skill-row ${on}" data-sid="${s.id}">
        <span class="leaf ${st}"></span>
        <span class="scode">${skillCode(s.id)}</span>
        <span class="stitle">${s.title}</span>
      </button>`;
    }).join("");
    list.querySelectorAll(".skill-row").forEach(b => {
      b.onclick = () => selectSkill(b.dataset.sid);
    });

    // Scroll selected into view
    const onRow = list.querySelector(".skill-row.on");
    if (onRow) onRow.scrollIntoView({ block: "nearest" });

    renderPreview();
  }

  function renderPreview() {
    const era = eraById(nav.eraId);
    const found = findSkill(era, nav.skillId);
    const meta = WORLD_META[era.id] || {};
    const art = document.getElementById("previewArt");
    const title = document.getElementById("previewTitle");
    const line = document.getElementById("previewLine");
    const btn = document.getElementById("beginBtn");

    if (!found) {
      title.textContent = "Select a skill";
      line.textContent = "";
      art.innerHTML = ORB_SVG[era.id] || "";
      btn.onclick = () => toast("Select a skill first");
      return;
    }
    const s = found.skill;
    title.textContent = `${skillCode(s.id)} ${s.title}`;
    line.textContent = meta.previewLine || "";
    art.innerHTML = ORB_SVG[era.id] || "";
    btn.onclick = () => openSkill(s.id);
  }

  function findSkill(era, sid) {
    if (!sid) return null;
    for (let di = 0; di < era.domains.length; di++) {
      const s = era.domains[di].skills.find(x => x.id === sid);
      if (s) return { skill: s, di };
    }
    return null;
  }

  function openSkill(sid) {
    const era = eraById(nav.eraId);
    const found = findSkill(era, sid);
    if (!found) return;
    nav.domainIdx = found.di; nav.skillId = sid;
    const s = found.skill, dom = era.domains[found.di];
    document.getElementById("skillArt").innerHTML = ORB_SVG[era.id] || "";
    document.getElementById("skillTitle").textContent = s.title;
    document.getElementById("skillMeta").textContent =
      `${dom.id} · ${skillCode(s.id)} · ${s.state || "seed"}${s.step ? " · step " + s.step : ""}`;
    const letters = ["a", "b", "c", "d"];
    const steps = s.steps || letters.map(L => `${L}) ${stepLabels[L]}`);
    document.getElementById("skillSteps").innerHTML = letters.map((L, i) => {
      const on = s.state === "proven" || (s.state === "growing" && s.step && L <= s.step);
      return `<div class="step ${on ? "on" : ""}"><span class="sl">${L}</span>${(steps[i] || "").replace(/^[a-d]\)\s*/i, "")}</div>`;
    }).join("");
    document.getElementById("playBtn").onclick = () => toast("Practice coming soon");
    setView("skill");
  }

  function nextSkill() {
    for (const era of ERAS) {
      if (!era.unlock) continue;
      for (let di = 0; di < era.domains.length; di++)
        for (const s of era.domains[di].skills)
          if (s.state === "growing") return { era: era.id, domainIdx: di, skill: s };
    }
    for (const era of ERAS) {
      if (!era.unlock) continue;
      for (let di = 0; di < era.domains.length; di++)
        for (const s of era.domains[di].skills)
          if (s.state !== "proven") return { era: era.id, domainIdx: di, skill: s };
    }
    return null;
  }

  function renderContinue() {
    const n = nextSkill();
    document.getElementById("nextHint").textContent = n
      ? `${eraById(n.era).romanLabel} · ${n.skill.title}`
      : "Explore freely";
  }

  function wire() {
    document.getElementById("backDomain").onclick = () => {
      if (nav.eraId) openWorld(nav.eraId);
      else renderUniverse();
    };
    document.getElementById("continueBtn").onclick = () => {
      const n = nextSkill();
      if (!n) { renderUniverse(); return; }
      openWorld(n.era);
      selectDomain(n.domainIdx);
      openSkill(n.skill.id);
    };
    document.addEventListener("keydown", e => {
      if (e.key !== "Escape") return;
      if (nav.view === "skill") openWorld(nav.eraId);
      else if (nav.view === "world") renderUniverse();
    });
  }

  async function boot() {
    const res = await fetch("./curriculum.json?v=" + Date.now());
    const data = await res.json();
    ERAS = data.eras;
    if (data.stepLabels) stepLabels = data.stepLabels;
    wire();
    renderUniverse();
  }
  boot().catch(err => { console.error(err); toast("Could not load curriculum"); });
})();
