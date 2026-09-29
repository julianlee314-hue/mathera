/* Mathera — zoomable universe prototype */
(() => {
  const ROMAN = ["I","II","III","IV","V","VI","VII"];
  const STATE_FILL = {
    seed: "#8a93a8",
    growing: "#9dce7a",
    proven: "#2f7a3a",
    thirsty: "#d4a017",
    withered: "#8b5a3c",
    inferred: "transparent",
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

  let CUR = null;
  let ERAS = [];
  let stepLabels = { a: "See it", b: "Name it", c: "Hold it", d: "Use it" };

  const nav = {
    view: "universe", // universe | world | skill
    eraId: "solve",
    domainIdx: null,
    skillId: null,
    // camera for world map
    cam: { x: 0, y: 0, k: 1 },
    target: null, // {x,y,k} animated
    layout: null, // computed positions for current era
  };

  const VW = 1200, VH = 780;

  function eraById(id) { return ERAS.find(e => e.id === id); }

  function counts(era) {
    let proven = 0, total = 0, growing = 0, seed = 0, inferred = 0;
    for (const d of era.domains) {
      for (const s of d.skills) {
        total++;
        if (s.state === "proven") proven++;
        else if (s.state === "growing") growing++;
        else if (s.state === "seed") seed++;
        else if (s.state === "inferred") inferred++;
      }
    }
    return { proven, total, growing, seed, inferred };
  }

  function toast(msg) {
    const t = document.getElementById("toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove("show"), 1600);
  }

  /* ───────── Layout engines per metaphor ───────── */
  function layoutWorld(era) {
    const domains = era.domains;
    const n = domains.length;
    const clusters = [];
    const skills = [];

    if (era.metaphor === "tree" || era.metaphor === "grove") {
      // First Grove — living canopy, not a game homage
      const trunkX = 600, ys = [];
      for (let i = 0; i < n; i++) ys.push(720 - i * (600 / Math.max(n - 1, 1)));
      domains.forEach((d, i) => {
        const isLeft = i % 2 === 0;
        const cx = isLeft ? 300 : 900;
        const cy = ys[i];
        const r = 75 + Math.sqrt(d.skills.length) * 14;
        clusters.push({
          i, cx, cy, r,
          labelX: isLeft ? 150 : 1050,
          labelAnchor: isLeft ? "end" : "start",
          limb: isLeft ? "left" : "right",
        });
        placeInCluster(d, i, cx, cy, r * 0.72, skills, "leaf");
      });
      return { kind: "grove", trunkX, clusters, skills, bg: "grove" };
    }

    if (era.metaphor === "city") {
      // Forge City — districts on a ring around the central forge plaza
      const n = domains.length;
      domains.forEach((d, i) => {
        const ang = -Math.PI / 2 + (i / n) * Math.PI * 2;
        const rad = 250;
        const cx = 600 + Math.cos(ang) * rad;
        const cy = 400 + Math.sin(ang) * rad * 0.85;
        const r = 62 + Math.sqrt(d.skills.length) * 9;
        clusters.push({ i, cx, cy, r, ang });
        placeInCluster(d, i, cx, cy, r * 0.68, skills, "stone");
      });
      return { kind: "city", clusters, skills, bg: "city", plaza: { x: 600, y: 400 } };
    }

    if (era.metaphor === "bridges") {
      domains.forEach((d, i) => {
        const t = n === 1 ? 0.5 : i / (n - 1);
        const cx = 140 + t * 920;
        const cy = 390 + Math.sin(t * Math.PI) * -120;
        clusters.push({ i, cx, cy, r: 75 });
        placeInCluster(d, i, cx, cy, 65, skills, "bridge");
      });
      return { kind: "bridges", clusters, skills, bg: "bridges" };
    }

    if (era.metaphor === "mountains") {
      // peaks along a range
      domains.forEach((d, i) => {
        const t = n === 1 ? 0.5 : i / (n - 1);
        const cx = 100 + t * 1000;
        // vary peak heights
        const peak = 180 + Math.sin(i * 1.7) * 40 + (i % 3) * 30;
        const cy = peak + 80;
        const r = 55 + Math.sqrt(d.skills.length) * 10;
        clusters.push({ i, cx, cy, r, peakY: peak - 40 });
        placeAlongRidge(d, i, cx, cy, r, skills);
      });
      return { kind: "mountains", clusters, skills, bg: "mountains" };
    }

    if (era.metaphor === "palace") {
      // wings in a grid / arcade
      const cols = Math.ceil(Math.sqrt(n));
      domains.forEach((d, i) => {
        const col = i % cols, row = Math.floor(i / cols);
        const cx = 160 + col * (920 / Math.max(cols - 1, 1));
        const cy = 160 + row * (520 / Math.max(Math.ceil(n / cols) - 1, 1));
        clusters.push({ i, cx, cy, r: 70 + d.skills.length });
        placeInCluster(d, i, cx, cy, 55 + d.skills.length * 0.6, skills, "stone");
      });
      return { kind: "palace", clusters, skills, bg: "palace" };
    }

    if (era.metaphor === "ocean") {
      domains.forEach((d, i) => {
        const t = n === 1 ? 0.5 : i / (n - 1);
        const cx = 120 + t * 960;
        const cy = 280 + Math.sin(i * 1.3 + 0.4) * 160 + (i % 2) * 40;
        const r = 60 + Math.sqrt(d.skills.length) * 12;
        clusters.push({ i, cx, cy, r });
        placeInCluster(d, i, cx, cy, r * 0.75, skills, "buoy");
      });
      return { kind: "ocean", clusters, skills, bg: "ocean" };
    }

    // cosmos — constellations
    domains.forEach((d, i) => {
      const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
      const ring = 180 + (i % 3) * 70;
      const cx = 600 + Math.cos(angle) * ring * 1.35;
      const cy = 390 + Math.sin(angle) * ring * 0.95;
      const r = 50 + Math.sqrt(d.skills.length) * 10;
      clusters.push({ i, cx, cy, r });
      placeConstellation(d, i, cx, cy, r, skills);
    });
    return { kind: "cosmos", clusters, skills, bg: "cosmos" };
  }

  function placeInCluster(d, di, cx, cy, radius, out, shape) {
    const m = d.skills.length;
    d.skills.forEach((s, k) => {
      const a = (k / m) * Math.PI * 2 - Math.PI / 2;
      const rad = radius * (0.35 + 0.55 * ((k % 5) / 5));
      const spiral = radius * (0.25 + 0.7 * (k / Math.max(m - 1, 1)));
      const use = shape === "branch" ? spiral : rad;
      const x = cx + Math.cos(a) * use;
      const y = cy + Math.sin(a) * use * (shape === "road" ? 0.7 : 1);
      out.push({ skill: s, di, x, y, shape });
    });
  }

  function placeAlongRidge(d, di, cx, cy, r, out) {
    const m = d.skills.length;
    d.skills.forEach((s, k) => {
      const t = m === 1 ? 0.5 : k / (m - 1);
      const x = cx + (t - 0.5) * r * 1.8;
      const y = cy - Math.sin(t * Math.PI) * r * 0.55 + (k % 2 ? 8 : -8);
      out.push({ skill: s, di, x, y, shape: "camp" });
    });
  }

  function placeConstellation(d, di, cx, cy, r, out) {
    const m = d.skills.length;
    d.skills.forEach((s, k) => {
      const a = (k / m) * Math.PI * 2 + di;
      const rad = r * (0.3 + 0.6 * ((k * 37) % 10) / 10);
      out.push({ skill: s, di, x: cx + Math.cos(a) * rad, y: cy + Math.sin(a) * rad, shape: "star" });
    });
  }

  /* ───────── Views ───────── */
  function setView(v) {
    nav.view = v;
    document.getElementById("viewUniverse").classList.toggle("hide", v !== "universe");
    document.getElementById("viewWorld").classList.toggle("show", v === "world");
    document.getElementById("viewSkill").classList.toggle("show", v === "skill");
    document.getElementById("navMap").classList.toggle("on", v === "universe");
    document.body.dataset.view = v;
    renderCrumb();
    renderContinue();
  }

  function renderCrumb() {
    const el = document.getElementById("crumb");
    const parts = [`<button type="button" data-go="universe">◎</button>`];
    if (nav.view !== "universe") {
      const era = eraById(nav.eraId);
      parts.push(`<span class="sep">/</span><button type="button" data-go="world">${era.name}</button>`);
    }
    if (nav.domainIdx != null && (nav.view === "world" || nav.view === "skill")) {
      const era = eraById(nav.eraId);
      const dom = era.domains[nav.domainIdx];
      if (dom) parts.push(`<span class="sep">/</span><button type="button" data-go="domain">${dom.id}</button>`);
    }
    if (nav.view === "skill" && nav.skillId) {
      parts.push(`<span class="sep">/</span><span>${nav.skillId}</span>`);
    }
    el.innerHTML = parts.join("");
    el.querySelectorAll("[data-go]").forEach(b => {
      b.onclick = () => {
        const g = b.dataset.go;
        if (g === "universe") { setView("universe"); renderUniverse(); }
        if (g === "world") { openWorld(nav.eraId, { reset: true }); }
        if (g === "domain") { zoomToDomain(nav.domainIdx); setView("world"); }
      };
    });
  }

  function renderUniverse() {
    const root = document.getElementById("worlds");
    root.innerHTML = ERAS.map(e => {
      const c = counts(e);
      const pct = c.total ? Math.round((c.proven / c.total) * 100) : 0;
      return `<button type="button" class="world ${e.unlock ? "" : "locked"}" data-id="${e.id}">
        <div class="orb ${e.id}">${ORB_SVG[e.id]}${e.unlock ? "" : `<span class="lock">🔒</span>`}</div>
        <div class="w-roman">${e.romanLabel}</div>
        <div class="w-name">${e.name}</div>
        <div class="w-bar"><i style="width:${Math.max(pct, e.unlock ? 4 : 0)}%"></i></div>
        <div class="w-frac">${e.unlock ? `${c.proven}/${c.total}` : "locked"}</div>
      </button>`;
    }).join("");
    root.querySelectorAll(".world").forEach(w => {
      w.onclick = () => {
        const era = eraById(w.dataset.id);
        if (!era.unlock) { toast("Still beyond the horizon"); return; }
        openWorld(era.id, { reset: true });
      };
    });
  }

  function openWorld(eraId, { reset } = {}) {
    nav.eraId = eraId;
    if (reset) {
      nav.domainIdx = null;
      nav.skillId = null;
      nav.cam = { x: 0, y: 0, k: 1 };
      nav.target = null;
    }
    const era = eraById(eraId);
    nav.layout = layoutWorld(era);
    setView("world");
    renderWorldChrome(era);
    renderMap();
    renderTopicSheet();
    bindMapInteract();
  }


  function renderTopicSheet() {
    const sheet = document.getElementById("topicSheet");
    if (!sheet) return;
    const era = eraById(nav.eraId);
    if (nav.domainIdx == null) {
      sheet.classList.remove("show");
      return;
    }
    const di = nav.domainIdx;
    const dom = era.domains[di];
    const proven = dom.skills.filter(s => s.state === "proven").length;
    sheet.classList.add("show");
    document.getElementById("topicTitle").textContent =
      `${dom.id} · ${dom.name.toUpperCase()}`;
    document.getElementById("topicFrac").textContent =
      `${proven} of ${dom.skills.length} proven`;
    const tabs = document.getElementById("topicTabs");
    tabs.innerHTML = era.domains.map((d, i) =>
      `<button type="button" class="${i === di ? "on" : ""}" data-di="${i}">${d.id}</button>`
    ).join("");
    tabs.querySelectorAll("button").forEach(b => {
      b.onclick = () => zoomToDomain(+b.dataset.di);
    });
    const rows = document.getElementById("topicRows");
    rows.innerHTML = dom.skills.map(s => {
      const tag = s.state === "growing" && s.step
        ? `Growing · ${s.step}`
        : (s.state || "inferred");
      const shortId = s.id.includes(".") ? s.id.split(".").slice(1).join(".") : s.id;
      // prefer 1.01 style from screenshots when id is II.1.01 → 1.01
      const parts = s.id.split(".");
      const code = parts.length >= 3 ? `${parts[1]}.${parts[2]}` : shortId;
      return `<button type="button" class="topic-row" data-sid="${s.id}">
        <span class="dot ${s.state}"></span>
        <span><span class="code">${code}</span><span class="title">${s.title}</span></span>
        <span class="tag ${s.state}">${tag}</span>
      </button>`;
    }).join("");
    rows.querySelectorAll(".topic-row").forEach(b => {
      b.onclick = () => openSkill(nav.eraId, di, b.dataset.sid);
    });
  }

  function renderWorldChrome(era) {
    const c = counts(era);
    document.getElementById("worldTitle").textContent = era.name;
    document.getElementById("worldMeta").textContent = `${era.romanLabel} · ${c.total} skills · ${era.tagline}`;
    document.getElementById("worldStage").dataset.metaphor = era.metaphor;
    const pills = document.getElementById("domainPills");
    pills.innerHTML = era.domains.map((d, i) =>
      `<button type="button" class="dpill ${nav.domainIdx === i ? "on" : ""}" data-di="${i}">${d.id}</button>`
    ).join("");
    pills.querySelectorAll(".dpill").forEach(b => {
      b.onclick = () => zoomToDomain(+b.dataset.di);
    });
  }

  function camTransform() {
    const { x, y, k } = nav.cam;
    // zoom about viewport center
    const cx = VW / 2, cy = VH / 2;
    return `translate(${cx} ${cy}) scale(${k}) translate(${-cx + x} ${-cy + y})`;
  }

  function renderMap() {
    const era = eraById(nav.eraId);
    const L = nav.layout;
    const svg = document.getElementById("mapSvg");
    const zoomed = nav.domainIdx != null && nav.cam.k > 1.5;

    let decor = "";
    if (L.kind === "grove" || L.kind === "tree") {
      // First Grove — soft canopy, curved limbs, moss root (Mathera original)
      decor = `
        <defs>
          <radialGradient id="canopy" cx="50%" cy="35%" r="60%">
            <stop offset="0%" stop-color="#6bcf8e" stop-opacity=".35"/>
            <stop offset="55%" stop-color="#2d6b45" stop-opacity=".18"/>
            <stop offset="100%" stop-color="#0e1610" stop-opacity="0"/>
          </radialGradient>
          <linearGradient id="bark" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#a67c52"/>
            <stop offset="100%" stop-color="#5a3d24"/>
          </linearGradient>
        </defs>
        <ellipse cx="${L.trunkX}" cy="200" rx="340" ry="160" fill="url(#canopy)"/>
        <ellipse cx="${L.trunkX}" cy="160" rx="220" ry="110" fill="url(#canopy)" opacity=".7"/>
        <path d="M${L.trunkX - 22} 720 C ${L.trunkX - 28} 480, ${L.trunkX - 16} 260, ${L.trunkX} 120
                 C ${L.trunkX + 16} 260, ${L.trunkX + 28} 480, ${L.trunkX + 22} 720 Z"
              fill="url(#bark)" opacity=".95"/>
        <ellipse cx="${L.trunkX}" cy="735" rx="70" ry="18" fill="#3d5c3a" opacity=".45"/>
        <ellipse cx="${L.trunkX}" cy="738" rx="110" ry="22" fill="#2a3f28" opacity=".25"/>
        <text x="${L.trunkX}" y="95" text-anchor="middle" fill="rgba(180,220,180,.45)" font-family="Fraunces,Georgia,serif" font-size="18" letter-spacing="3">FIRST GROVE</text>
      `;
      L.clusters.forEach(cl => {
        const midX = (L.trunkX + cl.cx) / 2;
        const lift = cl.limb === "left" ? -40 : -40;
        const active = nav.domainIdx === cl.i;
        const stroke = active ? "#5dca7a" : "#7a9a5a";
        decor += `<path d="M${L.trunkX} ${cl.cy} Q ${midX} ${cl.cy + lift} ${cl.cx} ${cl.cy}"
          fill="none" stroke="${stroke}" stroke-width="${active ? 8 : 5.5}" stroke-linecap="round" opacity=".9"/>`;
        decor += `<circle cx="${cl.cx}" cy="${cl.cy}" r="${cl.r * 0.95}" fill="rgba(74,180,110,${active ? 0.12 : 0.05})" stroke="rgba(120,200,140,${active ? 0.45 : 0.18})" stroke-width="1.5"/>`;
      });
    } else if (L.kind === "mountains") {
      let ridge = "";
      L.clusters.forEach((cl, i) => {
        ridge += `${i ? "L" : "M"}${cl.cx - cl.r},${VH - 40} L${cl.cx},${cl.peakY} L${cl.cx + cl.r},${VH - 40} `;
      });
      decor = `<path d="${ridge}" fill="rgba(180,200,220,.08)" stroke="rgba(220,230,245,.25)" stroke-width="2"/>`;
      L.clusters.forEach(cl => {
        decor += `<path d="M${cl.cx - cl.r * 0.9},${VH - 40} L${cl.cx},${cl.peakY} L${cl.cx + cl.r * 0.9},${VH - 40}" fill="rgba(140,160,190,.12)" stroke="rgba(230,235,245,.35)" stroke-width="1.5"/>`;
      });
    } else if (L.kind === "ocean") {
      decor = `<path d="M0 500 Q300 460 600 520 T1200 500 L1200 780 L0 780 Z" fill="rgba(40,120,140,.15)"/>
        <path d="M0 560 Q400 520 800 580 T1200 560" fill="none" stroke="rgba(94,200,216,.25)" stroke-width="2"/>`;
      L.clusters.forEach(cl => {
        decor += `<ellipse cx="${cl.cx}" cy="${cl.cy}" rx="${cl.r * 1.1}" ry="${cl.r * 0.7}" fill="rgba(60,140,160,.12)" stroke="rgba(94,200,216,.3)" stroke-width="1.5"/>`;
      });
    } else if (L.kind === "palace") {
      L.clusters.forEach(cl => {
        decor += `<rect x="${cl.cx - cl.r}" y="${cl.cy - cl.r * 0.7}" width="${cl.r * 2}" height="${cl.r * 1.4}" rx="8" fill="rgba(240,230,200,.06)" stroke="rgba(240,230,200,.28)" stroke-width="1.5"/>`;
      });
    } else if (L.kind === "cosmos") {
      L.clusters.forEach(cl => {
        const pts = L.skills.filter(s => s.di === cl.i);
        if (pts.length > 1) {
          let d = `M${pts[0].x},${pts[0].y}`;
          for (let i = 1; i < pts.length; i++) d += ` L${pts[i].x},${pts[i].y}`;
          decor += `<path d="${d}" fill="none" stroke="rgba(196,160,255,.22)" stroke-width="1"/>`;
        }
      });
    } else if (L.kind === "city") {
      // Forge City — plaza, curved arteries, district blocks, forge glow
      decor += `
        <defs>
          <radialGradient id="forgeGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#e8a050" stop-opacity=".28"/>
            <stop offset="55%" stop-color="#c45a2a" stop-opacity=".1"/>
            <stop offset="100%" stop-color="#0e1016" stop-opacity="0"/>
          </radialGradient>
          <linearGradient id="road" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="rgba(196,165,116,0)"/>
            <stop offset="50%" stop-color="rgba(196,165,116,.35)"/>
            <stop offset="100%" stop-color="rgba(196,165,116,0)"/>
          </linearGradient>
        </defs>
        <ellipse cx="600" cy="400" rx="220" ry="160" fill="url(#forgeGlow)"/>
        <circle cx="600" cy="400" r="42" fill="rgba(232,160,80,.12)" stroke="rgba(232,190,120,.35)" stroke-width="2"/>
        <circle cx="600" cy="400" r="18" fill="rgba(255,180,90,.25)"/>
        <text x="600" y="36" text-anchor="middle" fill="rgba(220,190,140,.45)" font-family="Fraunces,Georgia,serif" font-size="18" letter-spacing="4">FORGE CITY</text>
        <text x="600" y="404" text-anchor="middle" fill="rgba(255,210,150,.4)" font-size="10" font-family="ui-monospace,monospace">plaza</text>
      `;
      // curved arteries from plaza to each district
      L.clusters.forEach(cl => {
        const active = nav.domainIdx === cl.i;
        const mx = (600 + cl.cx) / 2 + (cl.cy < 400 ? -40 : 40);
        const my = (400 + cl.cy) / 2 + (cl.cx < 600 ? 50 : -50);
        decor += `<path d="M600 400 Q ${mx} ${my} ${cl.cx} ${cl.cy}" fill="none"
          stroke="rgba(196,165,116,${active ? 0.55 : 0.22})" stroke-width="${active ? 7 : 4}" stroke-linecap="round"/>`;
        decor += `<path d="M600 400 Q ${mx} ${my} ${cl.cx} ${cl.cy}" fill="none"
          stroke="rgba(255,220,160,${active ? 0.35 : 0.1})" stroke-width="1.5" stroke-dasharray="4 8"/>`;
      });
      // district blocks with stepped roofs / chimneys
      L.clusters.forEach(cl => {
        const active = nav.domainIdx === cl.i;
        const w = cl.r * 2.2, h = cl.r * 1.6;
        const x0 = cl.cx - w/2, y0 = cl.cy - h/2;
        decor += `<rect x="${x0}" y="${y0}" width="${w}" height="${h}" rx="12"
          fill="rgba(40,36,48,${active ? 0.55 : 0.35})" stroke="rgba(232,210,160,${active ? 0.65 : 0.28})" stroke-width="${active ? 2.2 : 1.2}"/>`;
        // skyline silhouette
        const roofs = [
          [0.12, 0.35], [0.32, 0.55], [0.52, 0.28], [0.72, 0.48], [0.88, 0.22]
        ];
        roofs.forEach(([fx, fh], ri) => {
          const bx = x0 + w * fx - 8;
          const bh = h * fh;
          const by = y0 - bh + 6;
          decor += `<rect x="${bx}" y="${by}" width="16" height="${bh}" rx="2"
            fill="rgba(196,165,116,${active ? 0.22 : 0.1})" stroke="rgba(232,210,160,${active ? 0.4 : 0.18})" stroke-width="1"/>`;
          if (ri % 2 === 0) {
            decor += `<rect x="${bx + 5}" y="${by - 10}" width="5" height="10" fill="rgba(180,100,60,${active ? 0.5 : 0.25})"/>`;
          }
        });
        // street lamps as tiny ticks around edge when zoomed
        if (active) {
          for (let a = 0; a < 8; a++) {
            const ang = (a / 8) * Math.PI * 2;
            const lx = cl.cx + Math.cos(ang) * (cl.r + 8);
            const ly = cl.cy + Math.sin(ang) * (cl.r * 0.75 + 6);
            decor += `<circle cx="${lx}" cy="${ly}" r="2.2" fill="rgba(255,200,120,.55)"/>`;
          }
        }
      });
    } else if (L.kind === "bridges") {
      // Bridge Isles — mist water, arched spans between islet domains
      decor += `
        <defs>
          <linearGradient id="mist" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="rgba(120,160,220,.05)"/>
            <stop offset="100%" stop-color="rgba(40,70,120,.2)"/>
          </linearGradient>
        </defs>
        <rect x="0" y="480" width="1200" height="300" fill="url(#mist)"/>
        <path d="M0 560 Q200 520 400 560 T800 560 T1200 560" fill="none" stroke="rgba(155,183,255,.2)" stroke-width="2"/>
        <text x="600" y="40" text-anchor="middle" fill="rgba(180,200,255,.4)" font-family="Fraunces,Georgia,serif" font-size="18" letter-spacing="3">BRIDGE ISLES</text>
      `;
      let path = "";
      L.clusters.forEach((cl, i) => { path += `${i ? "L" : "M"}${cl.cx},${cl.cy} `; });
      decor += `<path d="${path}" fill="none" stroke="rgba(155,183,255,.45)" stroke-width="3.5" stroke-dasharray="10 7"/>`;
      L.clusters.forEach((cl, i) => {
        const active = nav.domainIdx === cl.i;
        decor += `<ellipse cx="${cl.cx}" cy="${cl.cy + cl.r * 0.55}" rx="${cl.r * 1.15}" ry="${cl.r * 0.35}"
          fill="rgba(60,90,140,${active ? 0.35 : 0.18})" stroke="rgba(155,183,255,${active ? 0.5 : 0.22})" stroke-width="1.5"/>`;
        // arch bridge silhouette toward next
        if (i < L.clusters.length - 1) {
          const n = L.clusters[i + 1];
          const mx = (cl.cx + n.cx) / 2;
          const my = Math.min(cl.cy, n.cy) - 40;
          decor += `<path d="M${cl.cx} ${cl.cy} Q ${mx} ${my} ${n.cx} ${n.cy}" fill="none"
            stroke="rgba(200,210,255,${active || nav.domainIdx === n.i ? 0.55 : 0.25})" stroke-width="2.5"/>`;
        }
      });
    }

    // cluster hit areas + labels
    let clusterLayer = "";
    L.clusters.forEach(cl => {
      const d = era.domains[cl.i];
      const active = nav.domainIdx === cl.i;
      const showLabel = !zoomed || active;
      clusterLayer += `<g class="cluster ${active ? "on" : ""}" data-di="${cl.i}">
        <circle class="cluster-hit" cx="${cl.cx}" cy="${cl.cy}" r="${cl.r + 18}" fill="rgba(255,255,255,${active ? 0.06 : 0.02})" stroke="rgba(255,255,255,${active ? 0.35 : 0.08})" stroke-width="${active ? 2 : 1}"/>
        ${showLabel ? `<text class="cluster-label" x="${cl.cx}" y="${cl.cy - cl.r - 14}" text-anchor="middle">${d.id}</text>
        <text class="cluster-name" x="${cl.cx}" y="${cl.cy - cl.r + 2}" text-anchor="middle">${d.name}</text>` : ""}
      </g>`;
    });

    // skills
    let skillLayer = "";
    L.skills.forEach((p, idx) => {
      const s = p.skill;
      const activeDom = nav.domainIdx == null || nav.domainIdx === p.di;
      const big = zoomed && nav.domainIdx === p.di;
      const r = big ? 7 : 3.2;
      const fill = s.state === "inferred" ? "none" : STATE_FILL[s.state] || STATE_FILL.seed;
      const stroke = s.state === "inferred" ? "#8fbf8a" : "rgba(0,0,0,.25)";
      const dash = s.state === "inferred" ? "stroke-dasharray=\"2 2\"" : "";
      const label = big
        ? `<text class="skill-label" x="${p.x}" y="${p.y - 12}" text-anchor="middle">${s.id.split(".").slice(-1)[0]} · ${escapeXml(truncate(s.title, 22))}</text>`
        : "";
      // a–d ticks when big
      let ticks = "";
      if (big) {
        ["a","b","c","d"].forEach((st, ti) => {
          const tx = p.x - 9 + ti * 6;
          const ty = p.y + 14;
          const done = s.state === "proven" || (s.state === "growing" && s.step && st < s.step);
          ticks += `<circle cx="${tx}" cy="${ty}" r="2" fill="${done ? "#9dce7a" : "rgba(255,255,255,.25)"}"/>`;
        });
      }
      skillLayer += `<g class="sknode ${activeDom ? "" : "dim"}" data-di="${p.di}" data-sid="${s.id}" transform="translate(0,0)">
        <circle class="skhit" cx="${p.x}" cy="${p.y}" r="${big ? 16 : 8}" fill="transparent"/>
        <circle cx="${p.x}" cy="${p.y}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="1.2" ${dash}/>
        ${label}${ticks}
      </g>`;
    });

    svg.innerHTML = `
      <defs>
        <radialGradient id="glow" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stop-color="rgba(110,168,255,.12)"/>
          <stop offset="100%" stop-color="rgba(0,0,0,0)"/>
        </radialGradient>
      </defs>
      <rect width="${VW}" height="${VH}" fill="url(#glow)"/>
      <g id="cam" transform="${camTransform()}">
        <g class="decor">${decor}</g>
        <g class="clusters">${clusterLayer}</g>
        <g class="skills">${skillLayer}</g>
      </g>`;

    // bind clicks
    svg.querySelectorAll(".cluster").forEach(g => {
      g.addEventListener("click", e => {
        e.stopPropagation();
        zoomToDomain(+g.dataset.di);
      });
    });
    svg.querySelectorAll(".sknode").forEach(g => {
      g.addEventListener("click", e => {
        e.stopPropagation();
        const di = +g.dataset.di;
        const sid = g.dataset.sid;
        if (nav.domainIdx !== di || nav.cam.k < 1.8) {
          zoomToDomain(di, () => openSkill(nav.eraId, di, sid));
        } else {
          openSkill(nav.eraId, di, sid);
        }
      });
    });
  }

  function truncate(s, n) { return s.length > n ? s.slice(0, n - 1) + "…" : s; }
  function escapeXml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&apos;" }[c]));
  }

  function zoomToDomain(di, after) {
    nav.domainIdx = di;
    const cl = nav.layout.clusters[di];
    if (!cl) return;
    // center cluster & zoom
    const k = 2.6;
    nav.target = {
      x: VW / 2 - cl.cx,
      y: VH / 2 - cl.cy,
      k,
    };
    animateCam(() => {
      renderWorldChrome(eraById(nav.eraId));
      renderMap();
      renderTopicSheet();
      if (after) after();
    });
    renderWorldChrome(eraById(nav.eraId));
    renderTopicSheet();
    renderCrumb();
  }

  function zoomOut() {
    if (nav.view === "skill") {
      setView("world");
      renderMap();
      renderTopicSheet();
      return;
    }
    if (nav.domainIdx != null) {
      nav.domainIdx = null;
      nav.target = { x: 0, y: 0, k: 1 };
      animateCam(() => {
        renderWorldChrome(eraById(nav.eraId));
        renderMap();
        renderTopicSheet();
      });
      renderTopicSheet();
      renderCrumb();
      return;
    }
    setView("universe");
    renderUniverse();
  }

  function animateCam(done) {
    const start = { ...nav.cam };
    const end = nav.target || nav.cam;
    const t0 = performance.now();
    const dur = 420;
    function frame(t) {
      const u = Math.min(1, (t - t0) / dur);
      const e = 1 - Math.pow(1 - u, 3);
      nav.cam.x = start.x + (end.x - start.x) * e;
      nav.cam.y = start.y + (end.y - start.y) * e;
      nav.cam.k = start.k + (end.k - start.k) * e;
      const cam = document.getElementById("cam");
      if (cam) cam.setAttribute("transform", camTransform());
      if (u < 1) requestAnimationFrame(frame);
      else {
        nav.cam = { ...end };
        nav.target = null;
        if (done) done();
      }
    }
    requestAnimationFrame(frame);
  }

  let mapBound = false;
  function bindMapInteract() {
    const stage = document.getElementById("worldStage");
    if (mapBound) return;
    mapBound = true;
    let dragging = false, lx = 0, ly = 0;

    stage.addEventListener("wheel", e => {
      if (nav.view !== "world") return;
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
      const nk = Math.min(5, Math.max(0.6, nav.cam.k * factor));
      nav.cam.k = nk;
      const cam = document.getElementById("cam");
      if (cam) cam.setAttribute("transform", camTransform());
      if ((nav.domainIdx != null && nk < 1.4) || (nav.domainIdx == null && nk > 2)) {
        // soft update labels when crossing thresholds
        renderMap();
      }
    }, { passive: false });

    stage.addEventListener("pointerdown", e => {
      if (nav.view !== "world") return;
      if (e.target.closest(".sknode, .cluster")) return;
      dragging = true;
      lx = e.clientX; ly = e.clientY;
      stage.setPointerCapture(e.pointerId);
      stage.classList.add("panning");
    });
    stage.addEventListener("pointermove", e => {
      if (!dragging) return;
      const dx = (e.clientX - lx) / nav.cam.k;
      const dy = (e.clientY - ly) / nav.cam.k;
      lx = e.clientX; ly = e.clientY;
      nav.cam.x += dx;
      nav.cam.y += dy;
      const cam = document.getElementById("cam");
      if (cam) cam.setAttribute("transform", camTransform());
    });
    stage.addEventListener("pointerup", () => {
      dragging = false;
      stage.classList.remove("panning");
    });
    stage.addEventListener("dblclick", e => {
      e.preventDefault();
      zoomOut();
    });

    window.addEventListener("keydown", e => {
      if (e.key === "Escape") zoomOut();
    });
  }

  function openSkill(eraId, domainIdx, skillId) {
    nav.eraId = eraId;
    nav.domainIdx = domainIdx;
    nav.skillId = skillId;
    setView("skill");
    const era = eraById(eraId);
    const dom = era.domains[domainIdx];
    const skill = dom.skills.find(s => s.id === skillId);
    document.getElementById("skillTitle").textContent = skill.title;
    document.getElementById("skillMeta").textContent = `${dom.id} · ${skill.id} · ${skill.state}${skill.step ? " · step " + skill.step : ""}`;
    document.getElementById("skillArt").innerHTML = ORB_SVG[era.id];
    const stepsEl = document.getElementById("skillSteps");
    stepsEl.innerHTML = (skill.steps || ["a","b","c","d"]).map(st => {
      const lab = stepLabels[st] || st;
      const on = skill.state === "proven" || (skill.state === "growing" && skill.step && st <= skill.step) || skill.state === "seed" && st === "a";
      return `<div class="step ${on ? "on" : ""}"><span class="sl">${st}</span><span>${lab}</span></div>`;
    }).join("");
    document.getElementById("playBtn").onclick = () => toast("Practice desk arrives next");
    document.getElementById("backWorld").onclick = () => {
      setView("world");
      renderMap();
    };
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
          if (s.state === "seed") return { era: era.id, domainIdx: di, skill: s };
        }
      }
    }
    return null;
  }

  function renderContinue() {
    const n = nextSkill();
    const hint = document.getElementById("nextHint");
    const btn = document.getElementById("continueBtn");
    if (!n) { hint.textContent = ""; return; }
    hint.textContent = `Next · ${n.skill.title}${n.skill.step ? ", step " + n.skill.step : ""}`;
    btn.onclick = () => {
      if (nav.view === "skill" && nav.skillId === n.skill.id) {
        toast("Practice desk arrives next");
        return;
      }
      openWorld(n.era, { reset: true });
      zoomToDomain(n.domainIdx, () => openSkill(n.era, n.domainIdx, n.skill.id));
    };
  }

  /* ───────── Boot ───────── */
  async function boot() {
    const res = await fetch("curriculum.json");
    CUR = await res.json();
    ERAS = CUR.eras;
    if (CUR.stepLabels) stepLabels = CUR.stepLabels;

    document.getElementById("navMap").onclick = () => { setView("universe"); renderUniverse(); };
    document.getElementById("navId").onclick = () => toast("ID card — soon");
    document.getElementById("navRules").onclick = () => toast("House rules — soon");
    document.getElementById("zoomOutBtn").onclick = () => zoomOut();

    renderUniverse();
    renderContinue();
    setView("universe");
  }

  boot().catch(err => {
    console.error(err);
    document.body.innerHTML = `<p style="padding:2rem;color:#fff">Failed to load curriculum.json</p>`;
  });
})();
