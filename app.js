/* Mathera — simple visual menu: Universe → Districts → Topics → Skill */
(() => {
  const STATE_FILL = {
    seed: "#8a93a8", growing: "#9dce7a", proven: "#2f7a3a",
    thirsty: "#d4a017", withered: "#8b5a3c", inferred: "transparent",
  };

  const ORB_SVG = {
    count: `<svg viewBox="0 0 48 48" fill="none"><path d="M24 42 V18" stroke="#c4a574" stroke-width="3" stroke-linecap="round"/><path d="M24 22 C14 14, 12 8, 18 6 C22 12, 24 14, 24 14 C24 14, 26 12, 30 6 C36 8, 34 14, 24 22Z" fill="#5dca7a"/><path d="M24 28 C10 24, 8 16, 14 14 C18 20, 24 22, 24 22 C24 22, 30 20, 34 14 C40 16, 38 24, 24 28Z" fill="#3da85c"/></svg>`,
    operate: `<svg viewBox="0 0 48 48" fill="none"><rect x="10" y="22" width="10" height="16" rx="1" fill="#dcc09a"/><rect x="22" y="14" width="12" height="24" rx="1" fill="#c4a574"/><rect x="28" y="8" width="8" height="30" rx="1" fill="#e8d2a8"/><path d="M8 38 H40" stroke="#8a6a40" stroke-width="2"/></svg>`,
    relate: `<svg viewBox="0 0 48 48" fill="none"><path d="M8 34 C16 20, 32 20, 40 34" stroke="#c8d6ff" stroke-width="2.5" fill="none"/><circle cx="12" cy="30" r="3" fill="#9bb7ff"/><circle cx="24" cy="22" r="3" fill="#9bb7ff"/><circle cx="36" cy="30" r="3" fill="#9bb7ff"/></svg>`,
    solve: `<svg viewBox="0 0 48 48" fill="none"><path d="M6 38 L18 18 L28 28 L42 10 L42 38 Z" fill="#dfe6f2"/><path d="M6 38 L18 18 L28 28 L42 10" stroke="#9aa8c0" stroke-width="1.5" fill="none"/></svg>`,
    prove: `<svg viewBox="0 0 48 48" fill="none"><path d="M8 38 V18 L24 8 L40 18 V38 Z" fill="#f0e6c8"/><rect x="20" y="26" width="8" height="12" fill="#c4a868"/></svg>`,
    motion: `<svg viewBox="0 0 48 48" fill="none"><path d="M4 30 C12 24, 20 36, 28 30 S 40 24, 46 30" stroke="#7ad4e4" stroke-width="2.5" fill="none"/><path d="M4 36 C12 30, 20 42, 28 36 S 40 30, 46 36" stroke="#5ec8d8" stroke-width="2" fill="none" opacity=".7"/><circle cx="18" cy="18" r="5" fill="#a8f0ff" opacity=".8"/></svg>`,
    space: `<svg viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="10" fill="#c4a0ff" opacity=".85"/><ellipse cx="24" cy="24" rx="18" ry="6" stroke="#e0c8ff" stroke-width="1.5" fill="none" transform="rotate(-25 24 24)"/><circle cx="34" cy="12" r="2" fill="#fff"/></svg>`,
  };

  let ERAS = [];
  let stepLabels = { a: "See it", b: "Try it", c: "Use it", d: "Explain it" };

  const nav = {
    view: "universe",
    eraId: null,
    domainIdx: null,
    skillId: null,
  };

  function eraById(id) { return ERAS.find(e => e.id === id); }

  function counts(era) {
    let proven = 0, total = 0, growing = 0;
    for (const d of era.domains) {
      for (const s of d.skills) {
        total++;
        if (s.state === "proven") proven++;
        else if (s.state === "growing") growing++;
      }
    }
    return { proven, total, growing };
  }

  function domainCounts(dom) {
    let proven = 0, growing = 0;
    for (const s of dom.skills) {
      if (s.state === "proven") proven++;
      else if (s.state === "growing") growing++;
    }
    return { proven, growing, total: dom.skills.length };
  }

  function toast(msg) {
    const t = document.getElementById("toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove("show"), 1600);
  }

  function setView(name) {
    nav.view = name;
    const map = { universe: "viewUniverse", world: "viewWorld", domain: "viewDomain", skill: "viewSkill" };
    Object.values(map).forEach(id => document.getElementById(id).classList.remove("show"));
    document.getElementById(map[name]).classList.add("show");
    renderCrumb();
    renderContinue();
  }

  function renderCrumb() {
    const el = document.getElementById("crumb");
    const parts = [];
    parts.push(`<button type="button" data-g="universe">Universe</button>`);
    if (nav.eraId) {
      const era = eraById(nav.eraId);
      parts.push(`<span class="sep">/</span><button type="button" data-g="world">${era.romanLabel} ${era.name}</button>`);
    }
    if (nav.eraId && nav.domainIdx != null) {
      const d = eraById(nav.eraId).domains[nav.domainIdx];
      parts.push(`<span class="sep">/</span><button type="button" data-g="domain">${d.id}</button>`);
    }
    if (nav.skillId) {
      parts.push(`<span class="sep">/</span><span>${nav.skillId}</span>`);
    }
    el.innerHTML = parts.join("");
    el.querySelectorAll("button").forEach(b => {
      b.onclick = () => {
        const g = b.dataset.g;
        if (g === "universe") { nav.eraId = null; nav.domainIdx = null; nav.skillId = null; setView("universe"); renderUniverse(); }
        if (g === "world") { nav.domainIdx = null; nav.skillId = null; openWorld(nav.eraId); }
        if (g === "domain") { nav.skillId = null; openDomain(nav.domainIdx); }
      };
    });
  }

  function renderUniverse() {
    setView("universe");
    const root = document.getElementById("worlds");
    root.innerHTML = ERAS.map(e => {
      const c = counts(e);
      const pct = c.total ? (100 * c.proven / c.total) : 0;
      const place = e.worldName || "";
      return `<button type="button" class="world ${e.unlock ? "" : "locked"}" data-id="${e.id}" style="color:inherit">
        <div class="orb ${e.id}">${ORB_SVG[e.id] || ""}${e.unlock ? "" : '<span class="lock">🔒</span>'}</div>
        <div class="w-roman">${e.romanLabel}</div>
        <div class="w-name">${e.name}</div>
        <div class="w-place">${place}</div>
        <div class="w-bar"><i style="width:${e.unlock ? Math.max(pct, 3) : 0}%;background:currentColor"></i></div>
        <div class="w-frac">${e.unlock ? `${c.proven}/${c.total}` : "locked"}</div>
      </button>`;
    }).join("");
    // re-apply color via data-id on parent — fix: class world already has data-id
    root.querySelectorAll(".world").forEach(w => {
      w.onclick = () => {
        const era = eraById(w.dataset.id);
        if (!era.unlock) { toast("Still beyond the horizon"); return; }
        openWorld(era.id);
      };
    });
  }

  function heroArt(metaphor) {
    if (metaphor === "grove" || metaphor === "tree") {
      return `<defs><radialGradient id="c" cx="50%" cy="30%" r="60%"><stop offset="0%" stop-color="#6bcf8e" stop-opacity=".35"/><stop offset="100%" stop-color="#0e1610" stop-opacity="0"/></radialGradient></defs>
        <ellipse cx="780" cy="40" rx="220" ry="90" fill="url(#c)"/>
        <path d="M780 160 C770 90, 775 50, 780 20 C785 50, 790 90, 785 160 Z" fill="#7a5a38" opacity=".7"/>
        <path d="M40 140 Q200 80 360 130 T700 120" fill="none" stroke="rgba(120,200,140,.25)" stroke-width="3"/>`;
    }
    if (metaphor === "city") {
      return `<ellipse cx="490" cy="90" rx="80" ry="50" fill="rgba(232,160,80,.2)"/>
        <circle cx="490" cy="90" r="14" fill="rgba(255,180,90,.35)"/>
        <rect x="120" y="70" width="40" height="70" fill="rgba(196,165,116,.2)"/><rect x="180" y="50" width="28" height="90" fill="rgba(196,165,116,.25)"/>
        <rect x="720" y="55" width="50" height="85" fill="rgba(196,165,116,.2)"/><rect x="790" y="75" width="35" height="65" fill="rgba(196,165,116,.18)"/>
        <path d="M200 100 Q490 40 780 100" fill="none" stroke="rgba(232,210,160,.3)" stroke-width="2"/>`;
    }
    if (metaphor === "bridges") {
      return `<path d="M0 120 Q160 70 320 120 T640 120 T980 120" fill="none" stroke="rgba(155,183,255,.35)" stroke-width="3"/>
        <ellipse cx="160" cy="115" rx="50" ry="16" fill="rgba(80,110,170,.25)"/>
        <ellipse cx="490" cy="100" rx="55" ry="18" fill="rgba(80,110,170,.3)"/>
        <ellipse cx="820" cy="115" rx="50" ry="16" fill="rgba(80,110,170,.25)"/>
        <path d="M210 110 Q325 55 435 100" fill="none" stroke="rgba(200,210,255,.4)" stroke-width="2.5"/>
        <path d="M545 100 Q670 50 770 112" fill="none" stroke="rgba(200,210,255,.4)" stroke-width="2.5"/>`;
    }
    if (metaphor === "mountains") {
      return `<path d="M40 150 L180 40 L280 110 L420 20 L560 100 L720 30 L940 150 Z" fill="rgba(180,200,220,.12)" stroke="rgba(220,230,245,.3)" stroke-width="1.5"/>`;
    }
    if (metaphor === "palace") {
      return `<rect x="360" y="50" width="260" height="90" rx="6" fill="rgba(240,230,200,.08)" stroke="rgba(240,230,200,.3)"/>
        <path d="M360 50 L490 20 L620 50" fill="none" stroke="rgba(240,230,200,.35)" stroke-width="2"/>`;
    }
    if (metaphor === "ocean") {
      return `<path d="M0 90 Q160 60 320 95 T640 90 T980 100" fill="none" stroke="rgba(94,200,216,.35)" stroke-width="2.5"/>
        <path d="M0 120 Q200 95 400 125 T980 120" fill="none" stroke="rgba(94,200,216,.2)" stroke-width="2"/>
        <circle cx="200" cy="50" r="12" fill="rgba(168,240,255,.25)"/>`;
    }
    // cosmos
    return `<circle cx="700" cy="70" r="36" fill="rgba(196,160,255,.25)"/>
      <ellipse cx="700" cy="70" rx="70" ry="16" fill="none" stroke="rgba(224,200,255,.35)" transform="rotate(-20 700 70)"/>
      <circle cx="180" cy="40" r="2" fill="#fff"/><circle cx="320" cy="90" r="1.5" fill="#fff"/><circle cx="450" cy="35" r="2" fill="#fff"/>`;
  }

  function openWorld(eraId) {
    nav.eraId = eraId;
    nav.domainIdx = null;
    nav.skillId = null;
    const era = eraById(eraId);
    const c = counts(era);
    const m = era.metaphor === "tree" ? "grove" : (era.metaphor || "grove");
    const hero = document.getElementById("worldHero");
    hero.dataset.m = m;
    document.getElementById("heroArt").innerHTML = heroArt(m);
    document.getElementById("worldTitle").textContent = era.worldName || era.name;
    document.getElementById("worldMeta").textContent =
      `${era.romanLabel} · ${era.name} · ${c.total} skills · ${era.tagline || ""}`.trim();

    const root = document.getElementById("districts");
    root.innerHTML = era.domains.map((d, i) => {
      const dc = domainCounts(d);
      const pips = [];
      // show up to 8 status dots sample
      const sample = d.skills.slice(0, 8);
      sample.forEach(s => {
        const cls = s.state === "proven" ? "p" : s.state === "growing" ? "g" : "";
        pips.push(`<i class="${cls}"></i>`);
      });
      return `<button type="button" class="district" data-di="${i}">
        <div class="did">${d.id}</div>
        <div class="dname">${d.name}</div>
        <div class="dmeta">
          <span>${dc.proven} of ${dc.total} proven</span>
          <span class="pip">${pips.join("")}</span>
        </div>
      </button>`;
    }).join("");
    root.querySelectorAll(".district").forEach(b => {
      b.onclick = () => openDomain(+b.dataset.di);
    });
    setView("world");
  }

  function skillCode(id) {
    const parts = id.split(".");
    return parts.length >= 3 ? `${parts[1]}.${parts[2]}` : id;
  }

  function openDomain(di) {
    nav.domainIdx = di;
    nav.skillId = null;
    const era = eraById(nav.eraId);
    const dom = era.domains[di];
    const dc = domainCounts(dom);
    document.getElementById("topicTitle").textContent = `${dom.id} · ${dom.name.toUpperCase()}`;
    document.getElementById("topicFrac").textContent = `${dc.proven} of ${dc.total} proven`;

    const tabs = document.getElementById("topicTabs");
    tabs.innerHTML = era.domains.map((d, i) =>
      `<button type="button" class="${i === di ? "on" : ""}" data-di="${i}">${d.id}</button>`
    ).join("");
    tabs.querySelectorAll("button").forEach(b => {
      b.onclick = () => openDomain(+b.dataset.di);
    });

    const rows = document.getElementById("topicRows");
    rows.innerHTML = dom.skills.map(s => {
      const st = s.state || "seed";
      const tag = st === "growing" && s.step ? `Growing · ${s.step}` : st;
      return `<button type="button" class="row" data-sid="${s.id}">
        <span class="dot ${st}"></span>
        <span><span class="code">${skillCode(s.id)}</span><span class="title">${s.title}</span></span>
        <span class="tag ${st}">${tag}</span>
      </button>`;
    }).join("");
    rows.querySelectorAll(".row").forEach(b => {
      b.onclick = () => openSkill(b.dataset.sid);
    });
    setView("domain");
    // scroll sheet to top
    document.getElementById("topicSheet").scrollTop = 0;
  }

  function findSkill(era, sid) {
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
    nav.domainIdx = found.di;
    nav.skillId = sid;
    const s = found.skill;
    const dom = era.domains[found.di];
    document.getElementById("skillArt").innerHTML = ORB_SVG[era.id] || "";
    document.getElementById("skillTitle").textContent = s.title;
    document.getElementById("skillMeta").textContent =
      `${dom.id} · ${skillCode(s.id)} · ${s.state || "seed"}${s.step ? " · step " + s.step : ""}`;

    const steps = s.steps || ["a) see it", "b) try it", "c) use it", "d) explain it"];
    const letters = ["a", "b", "c", "d"];
    document.getElementById("skillSteps").innerHTML = letters.map((L, i) => {
      const label = steps[i] || `${L}) ${stepLabels[L]}`;
      const on = s.state === "proven" || (s.state === "growing" && s.step && L <= s.step);
      return `<div class="step ${on ? "on" : ""}"><span class="sl">${L}</span>${label.replace(/^[a-d]\)\s*/i, "")}</div>`;
    }).join("");

    document.getElementById("playBtn").onclick = () => toast("Practice coming soon");
    setView("skill");
  }

  function nextSkill() {
    for (const era of ERAS) {
      if (!era.unlock) continue;
      for (let di = 0; di < era.domains.length; di++) {
        for (const s of era.domains[di].skills) {
          if (s.state === "growing") return { era: era.id, domainIdx: di, skill: s };
        }
      }
    }
    for (const era of ERAS) {
      if (!era.unlock) continue;
      for (let di = 0; di < era.domains.length; di++) {
        for (const s of era.domains[di].skills) {
          if (s.state !== "proven") return { era: era.id, domainIdx: di, skill: s };
        }
      }
    }
    return null;
  }

  function renderContinue() {
    const n = nextSkill();
    const hint = document.getElementById("nextHint");
    if (!n) {
      hint.textContent = "All proven — explore freely";
      return;
    }
    const era = eraById(n.era);
    hint.textContent = `${era.romanLabel} · ${n.skill.title}`;
  }

  function wireChrome() {
    document.getElementById("navMap").onclick = () => {
      nav.eraId = null; nav.domainIdx = null; nav.skillId = null;
      renderUniverse();
      document.querySelectorAll(".nav button").forEach(b => b.classList.remove("on"));
      document.getElementById("navMap").classList.add("on");
    };
    document.getElementById("navId").onclick = () => toast("ID card coming soon");
    document.getElementById("navRules").onclick = () => toast("Seed → Growing → Proven");
    document.getElementById("backUniverse").onclick = () => {
      nav.eraId = null; nav.domainIdx = null; nav.skillId = null;
      renderUniverse();
    };
    document.getElementById("backWorld").onclick = () => openWorld(nav.eraId);
    document.getElementById("backDomain").onclick = () => openDomain(nav.domainIdx);
    document.getElementById("continueBtn").onclick = () => {
      const n = nextSkill();
      if (!n) { renderUniverse(); return; }
      openWorld(n.era);
      openDomain(n.domainIdx);
      openSkill(n.skill.id);
    };
    document.addEventListener("keydown", e => {
      if (e.key === "Escape") {
        if (nav.view === "skill") openDomain(nav.domainIdx);
        else if (nav.view === "domain") openWorld(nav.eraId);
        else if (nav.view === "world") { nav.eraId = null; renderUniverse(); }
      }
    });
  }

  async function boot() {
    const res = await fetch("./curriculum.json?v=" + Date.now());
    const data = await res.json();
    ERAS = data.eras;
    if (data.stepLabels) stepLabels = data.stepLabels;
    wireChrome();
    renderUniverse();
    renderContinue();
  }

  boot().catch(err => {
    console.error(err);
    toast("Could not load curriculum");
  });
})();
