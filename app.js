/* Mathera — Math Garden tapestry */
(() => {
  const PANEL_IMG = [
    "assets/tapestry/era1.jpg",
    "assets/tapestry/era2.jpg",
    "assets/tapestry/era3.jpg",
    "assets/tapestry/era4.jpg",
    "assets/tapestry/era5.jpg",
    "assets/tapestry/era6.jpg",
    "assets/tapestry/era7.jpg",
  ];
  const TAGS = {
    count: "Things begin here.",
    operate: "Do things to numbers.",
    relate: "See connections.",
    solve: "Find the unknown.",
    prove: "Know it's true.",
    motion: "Understand change.",
    space: "Explore higher worlds.",
  };
  const STATE_FILL = {
    seed: "#8a93a8", growing: "#9dce7a", proven: "#2f7a3a",
    thirsty: "#d4a017", withered: "#8b5a3c", inferred: "transparent",
  };
  const ORB_SVG = {
    count: `<svg viewBox="0 0 48 48" fill="none"><path d="M24 42 V18" stroke="#c4a574" stroke-width="3" stroke-linecap="round"/><path d="M24 22 C14 14, 12 8, 18 6 C22 12, 24 14, 24 14 C24 14, 26 12, 30 6 C36 8, 34 14, 24 22Z" fill="#5dca7a"/><path d="M24 28 C10 24, 8 16, 14 14 C18 20, 24 22, 24 22 C24 22, 30 20, 34 14 C40 16, 38 24, 24 28Z" fill="#3da85c"/></svg>`,
    operate: `<svg viewBox="0 0 48 48" fill="none"><rect x="10" y="22" width="10" height="16" rx="1" fill="#dcc09a"/><rect x="22" y="14" width="12" height="24" rx="1" fill="#c4a574"/><rect x="28" y="8" width="8" height="30" rx="1" fill="#e8d2a8"/></svg>`,
    relate: `<svg viewBox="0 0 48 48" fill="none"><path d="M8 34 C16 20, 32 20, 40 34" stroke="#c8d6ff" stroke-width="2.5" fill="none"/><circle cx="12" cy="30" r="3" fill="#9bb7ff"/><circle cx="24" cy="22" r="3" fill="#9bb7ff"/><circle cx="36" cy="30" r="3" fill="#9bb7ff"/></svg>`,
    solve: `<svg viewBox="0 0 48 48" fill="none"><path d="M6 38 L18 18 L28 28 L42 10 L42 38 Z" fill="#dfe6f2"/></svg>`,
    prove: `<svg viewBox="0 0 48 48" fill="none"><path d="M8 38 V18 L24 8 L40 18 V38 Z" fill="#f0e6c8"/><rect x="20" y="26" width="8" height="12" fill="#c4a868"/></svg>`,
    motion: `<svg viewBox="0 0 48 48" fill="none"><path d="M4 30 C12 24, 20 36, 28 30 S 40 24, 46 30" stroke="#7ad4e4" stroke-width="2.5" fill="none"/></svg>`,
    space: `<svg viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="10" fill="#c4a0ff" opacity=".85"/></svg>`,
  };

  let ERAS = [];
  let stepLabels = { a: "See it", b: "Try it", c: "Use it", d: "Explain it" };
  const nav = {
    view: "universe", eraId: null, domainIdx: null, skillId: null,
    cam: { x: 0, y: 0, k: 1 }, target: null, layout: null,
  };
  const VW = 1400, VH = 900;

  const eraById = id => ERAS.find(e => e.id === id);
  function counts(era) {
    let proven = 0, total = 0, growing = 0;
    for (const d of era.domains) for (const s of d.skills) {
      total++; if (s.state === "proven") proven++; else if (s.state === "growing") growing++;
    }
    return { proven, total, growing };
  }
  function domainCounts(dom) {
    let proven = 0, growing = 0;
    for (const s of dom.skills) {
      if (s.state === "proven") proven++; else if (s.state === "growing") growing++;
    }
    return { proven, growing, total: dom.skills.length };
  }
  function toast(msg) {
    const t = document.getElementById("toast");
    t.textContent = msg; t.classList.add("show");
    clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove("show"), 1600);
  }
  function setView(name) {
    nav.view = name;
    document.body.classList.toggle("land", name === "universe");
    const map = { universe: "viewUniverse", world: "viewWorld", domain: "viewDomain", skill: "viewSkill" };
    Object.values(map).forEach(id => document.getElementById(id).classList.remove("show"));
    document.getElementById(map[name]).classList.add("show");
    renderCrumb(); renderContinue();
  }
  function skillCode(id) {
    const p = id.split(".");
    return p.length >= 3 ? `${p[1]}.${p[2]}` : id;
  }

  /* ── layout engines ── */
  function placeInCluster(d, di, cx, cy, r, skills, mode) {
    const n = d.skills.length;
    d.skills.forEach((s, si) => {
      const a = (si / Math.max(n, 1)) * Math.PI * 2 - Math.PI / 2;
      const rr = r * (0.35 + 0.55 * ((si % 5) / 5));
      const x = cx + Math.cos(a) * rr * (mode === "road" ? 1.15 : 1);
      const y = cy + Math.sin(a) * rr * (mode === "road" ? 0.55 : 0.85);
      skills.push({ di, skill: s, x, y, mode });
    });
  }

  function layoutWorld(era) {
    const domains = era.domains, n = domains.length;
    const clusters = [], skills = [];
    const m = era.metaphor;

    if (m === "grove" || m === "tree") {
      const trunkX = 700;
      domains.forEach((d, i) => {
        const ang = -Math.PI / 2 + (i / n) * Math.PI * 2;
        const rad = 280;
        const cx = trunkX + Math.cos(ang) * rad * 1.05;
        const cy = 420 + Math.sin(ang) * rad * 0.78;
        const r = 70 + Math.sqrt(d.skills.length) * 11;
        clusters.push({ i, cx, cy, r, limb: cx < trunkX ? "left" : "right" });
        placeInCluster(d, i, cx, cy, r * 0.75, skills, "leaf");
      });
      return { kind: "grove", trunkX, clusters, skills };
    }
    if (m === "city") {
      domains.forEach((d, i) => {
        const ang = -Math.PI / 2 + (i / n) * Math.PI * 2;
        const cx = 700 + Math.cos(ang) * 300;
        const cy = 450 + Math.sin(ang) * 250;
        const r = 55 + Math.sqrt(d.skills.length) * 9;
        clusters.push({ i, cx, cy, r, ang });
        // skills along radial "roads"
        d.skills.forEach((s, si) => {
          const t = (si + 1) / (d.skills.length + 1);
          const x = 700 + (cx - 700) * t + Math.sin(si) * 12;
          const y = 450 + (cy - 450) * t + Math.cos(si) * 8;
          skills.push({ di: i, skill: s, x, y, mode: "vehicle" });
        });
      });
      return { kind: "city", clusters, skills };
    }
    if (m === "bridges") {
      domains.forEach((d, i) => {
        const t = n === 1 ? 0.5 : i / (n - 1);
        const cx = 120 + t * 1160;
        const cy = 480 + Math.sin(t * Math.PI * 2) * 90;
        const r = 60 + Math.sqrt(d.skills.length) * 8;
        clusters.push({ i, cx, cy, r });
        placeInCluster(d, i, cx, cy, r * 0.7, skills, "span");
      });
      return { kind: "bridges", clusters, skills };
    }
    if (m === "mountains") {
      domains.forEach((d, i) => {
        const t = n === 1 ? 0.5 : i / (n - 1);
        const cx = 140 + t * 1120;
        const peakY = 180 + (i % 3) * 40;
        const cy = peakY + 120;
        const r = 55 + Math.sqrt(d.skills.length) * 8;
        clusters.push({ i, cx, cy, r, peakY });
        placeInCluster(d, i, cx, cy, r * 0.7, skills, "stone");
      });
      return { kind: "mountains", clusters, skills };
    }
    if (m === "palace") {
      const cols = Math.ceil(Math.sqrt(n));
      domains.forEach((d, i) => {
        const col = i % cols, row = Math.floor(i / cols);
        const cx = 220 + col * (1000 / Math.max(cols - 1, 1));
        const cy = 220 + row * (500 / Math.max(Math.ceil(n / cols) - 1, 1));
        const r = 55 + Math.sqrt(d.skills.length) * 8;
        clusters.push({ i, cx, cy, r });
        placeInCluster(d, i, cx, cy, r * 0.65, skills, "tile");
      });
      return { kind: "palace", clusters, skills };
    }
    if (m === "ocean") {
      domains.forEach((d, i) => {
        const ang = (i / n) * Math.PI * 2;
        const cx = 700 + Math.cos(ang) * 320;
        const cy = 450 + Math.sin(ang) * 220;
        const r = 55 + Math.sqrt(d.skills.length) * 8;
        clusters.push({ i, cx, cy, r });
        placeInCluster(d, i, cx, cy, r * 0.7, skills, "boat");
      });
      return { kind: "ocean", clusters, skills };
    }
    // cosmos
    domains.forEach((d, i) => {
      const ang = (i / n) * Math.PI * 2;
      const rad = 180 + (i % 3) * 70;
      const cx = 700 + Math.cos(ang) * rad;
      const cy = 450 + Math.sin(ang) * rad * 0.75;
      const r = 50 + Math.sqrt(d.skills.length) * 7;
      clusters.push({ i, cx, cy, r });
      placeInCluster(d, i, cx, cy, r * 0.7, skills, "star");
    });
    return { kind: "cosmos", clusters, skills };
  }

  function camTransform() {
    const { x, y, k } = nav.cam;
    const cx = VW / 2, cy = VH / 2;
    return `translate(${cx} ${cy}) scale(${k}) translate(${-cx + x} ${-cy + y})`;
  }

  function escapeXml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&apos;" }[c]));
  }
  function truncate(s, n) { return s.length > n ? s.slice(0, n - 1) + "…" : s; }

  function renderMap() {
    const era = eraById(nav.eraId);
    const L = nav.layout;
    const svg = document.getElementById("mapSvg");
    const zoomed = nav.domainIdx != null && nav.cam.k > 1.5;
    let decor = "";

    if (L.kind === "grove") {
      decor = `
        <defs>
          <radialGradient id="canopy" cx="50%" cy="35%" r="60%">
            <stop offset="0%" stop-color="#6bcf8e" stop-opacity=".4"/>
            <stop offset="100%" stop-color="#0e1610" stop-opacity="0"/>
          </radialGradient>
          <linearGradient id="bark" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#a67c52"/><stop offset="100%" stop-color="#5a3d24"/>
          </linearGradient>
        </defs>
        <ellipse cx="${L.trunkX}" cy="260" rx="380" ry="180" fill="url(#canopy)"/>
        <path d="M${L.trunkX - 28} 860 C ${L.trunkX - 34} 520, ${L.trunkX - 18} 280, ${L.trunkX} 140
                 C ${L.trunkX + 18} 280, ${L.trunkX + 34} 520, ${L.trunkX + 28} 860 Z" fill="url(#bark)"/>
        <text x="${L.trunkX}" y="110" text-anchor="middle" fill="rgba(180,220,180,.5)" font-family="Fraunces,Georgia,serif" font-size="22" letter-spacing="4">FIRST GROVE</text>`;
      L.clusters.forEach(cl => {
        const active = nav.domainIdx === cl.i;
        const midX = (L.trunkX + cl.cx) / 2;
        decor += `<path d="M${L.trunkX} 400 Q ${midX} ${(400 + cl.cy) / 2 - 40} ${cl.cx} ${cl.cy}" fill="none" stroke="${active ? "#5dca7a" : "#7a9a5a"}" stroke-width="${active ? 9 : 5}" stroke-linecap="round" opacity=".9"/>`;
        decor += `<ellipse cx="${cl.cx}" cy="${cl.cy}" rx="${cl.r}" ry="${cl.r * 0.85}" fill="rgba(74,180,110,${active ? 0.14 : 0.05})" stroke="rgba(120,200,140,${active ? 0.5 : 0.2})"/>`;
      });
    } else if (L.kind === "city") {
      decor = `<ellipse cx="700" cy="450" rx="90" ry="70" fill="rgba(232,160,80,.2)"/>
        <circle cx="700" cy="450" r="22" fill="rgba(255,180,90,.35)"/>
        <text x="700" y="70" text-anchor="middle" fill="rgba(220,190,140,.45)" font-family="Fraunces,Georgia,serif" font-size="22" letter-spacing="4">FORGE CITY</text>`;
      L.clusters.forEach(cl => {
        const active = nav.domainIdx === cl.i;
        decor += `<path d="M700 450 L${cl.cx} ${cl.cy}" stroke="rgba(196,165,116,${active ? 0.55 : 0.22})" stroke-width="${active ? 8 : 4}"/>`;
        decor += `<rect x="${cl.cx - cl.r}" y="${cl.cy - cl.r * 0.7}" width="${cl.r * 2}" height="${cl.r * 1.4}" rx="10" fill="rgba(40,36,48,${active ? 0.55 : 0.3})" stroke="rgba(232,210,160,${active ? 0.6 : 0.25})"/>`;
      });
    } else if (L.kind === "bridges") {
      decor = `<text x="700" y="60" text-anchor="middle" fill="rgba(180,200,255,.4)" font-family="Fraunces,Georgia,serif" font-size="22" letter-spacing="3">BRIDGE ISLES</text>
        <path d="M0 620 Q350 560 700 620 T1400 620" fill="none" stroke="rgba(155,183,255,.25)" stroke-width="3"/>`;
      L.clusters.forEach((cl, i) => {
        const active = nav.domainIdx === cl.i;
        decor += `<ellipse cx="${cl.cx}" cy="${cl.cy + 30}" rx="${cl.r * 1.2}" ry="${cl.r * 0.4}" fill="rgba(60,90,140,${active ? 0.4 : 0.2})"/>`;
        if (i < L.clusters.length - 1) {
          const n = L.clusters[i + 1];
          decor += `<path d="M${cl.cx} ${cl.cy} Q ${(cl.cx + n.cx) / 2} ${Math.min(cl.cy, n.cy) - 50} ${n.cx} ${n.cy}" fill="none" stroke="rgba(200,210,255,.4)" stroke-width="3"/>`;
        }
      });
    } else if (L.kind === "mountains") {
      L.clusters.forEach(cl => {
        decor += `<path d="M${cl.cx - cl.r * 1.2} 820 L${cl.cx} ${cl.peakY} L${cl.cx + cl.r * 1.2} 820 Z" fill="rgba(180,200,220,.1)" stroke="rgba(220,230,245,.3)"/>`;
      });
      decor += `<text x="700" y="60" text-anchor="middle" fill="rgba(200,210,230,.4)" font-family="Fraunces,Georgia,serif" font-size="22" letter-spacing="3">PEAK RANGE</text>`;
    } else if (L.kind === "palace") {
      decor = `<text x="700" y="60" text-anchor="middle" fill="rgba(240,230,200,.4)" font-family="Fraunces,Georgia,serif" font-size="22" letter-spacing="3">PROOF PALACE</text>`;
      L.clusters.forEach(cl => {
        const active = nav.domainIdx === cl.i;
        decor += `<rect x="${cl.cx - cl.r}" y="${cl.cy - cl.r}" width="${cl.r * 2}" height="${cl.r * 1.6}" rx="6" fill="rgba(240,230,200,${active ? 0.12 : 0.05})" stroke="rgba(240,230,200,${active ? 0.45 : 0.2})"/>`;
      });
    } else if (L.kind === "ocean") {
      decor = `<path d="M0 600 Q400 540 800 620 T1400 600" fill="none" stroke="rgba(94,200,216,.3)" stroke-width="3"/>
        <text x="700" y="60" text-anchor="middle" fill="rgba(160,220,230,.4)" font-family="Fraunces,Georgia,serif" font-size="22" letter-spacing="3">TIDE SEA</text>`;
      L.clusters.forEach(cl => {
        decor += `<ellipse cx="${cl.cx}" cy="${cl.cy}" rx="${cl.r * 1.2}" ry="${cl.r * 0.7}" fill="rgba(60,140,160,.15)" stroke="rgba(94,200,216,.3)"/>`;
      });
    } else {
      decor = `<circle cx="700" cy="450" r="80" fill="rgba(196,160,255,.15)"/>
        <text x="700" y="60" text-anchor="middle" fill="rgba(200,180,255,.4)" font-family="Fraunces,Georgia,serif" font-size="22" letter-spacing="3">STAR VAULT</text>`;
      L.clusters.forEach(cl => {
        decor += `<circle cx="${cl.cx}" cy="${cl.cy}" r="${cl.r}" fill="rgba(196,160,255,.08)" stroke="rgba(196,160,255,.3)"/>`;
      });
    }

    let clusterLayer = "";
    L.clusters.forEach(cl => {
      const d = era.domains[cl.i];
      const active = nav.domainIdx === cl.i;
      const show = !zoomed || active;
      clusterLayer += `<g class="cluster" data-di="${cl.i}">
        <circle cx="${cl.cx}" cy="${cl.cy}" r="${cl.r + 20}" fill="rgba(255,255,255,${active ? 0.06 : 0.02})" stroke="rgba(255,255,255,${active ? 0.35 : 0.08})"/>
        ${show ? `<text x="${cl.cx}" y="${cl.cy - cl.r - 16}" text-anchor="middle" fill="rgba(200,210,230,.85)" font-size="13" font-weight="600" font-family="Inter,sans-serif">${d.id}</text>
        <text x="${cl.cx}" y="${cl.cy - cl.r + 2}" text-anchor="middle" fill="rgba(238,243,255,.8)" font-size="12" font-family="Fraunces,Georgia,serif">${escapeXml(d.name)}</text>` : ""}
      </g>`;
    });

    let skillLayer = "";
    L.skills.forEach(p => {
      const s = p.skill;
      const activeDom = nav.domainIdx == null || nav.domainIdx === p.di;
      const big = zoomed && nav.domainIdx === p.di;
      const r = big ? 7 : (p.mode === "leaf" ? 4.5 : 3.5);
      const fill = s.state === "inferred" ? "none" : (STATE_FILL[s.state] || STATE_FILL.seed);
      const stroke = s.state === "inferred" ? "#8fbf8a" : "rgba(0,0,0,.25)";
      const dash = s.state === "inferred" ? 'stroke-dasharray="2 2"' : "";
      let shape = `<circle cx="${p.x}" cy="${p.y}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="1.1" ${dash}/>`;
      if (p.mode === "leaf" && !big) {
        shape = `<ellipse cx="${p.x}" cy="${p.y}" rx="${r * 1.3}" ry="${r * 0.7}" transform="rotate(${(p.di * 17 + p.x) % 50} ${p.x} ${p.y})" fill="${fill === "none" ? "rgba(120,200,140,.25)" : fill}" stroke="${stroke}" stroke-width="1" ${dash}/>`;
      } else if (p.mode === "vehicle" && !big) {
        shape = `<rect x="${p.x - 5}" y="${p.y - 2.5}" width="10" height="5" rx="1.5" fill="${fill === "none" ? "rgba(196,165,116,.4)" : fill}" stroke="${stroke}" ${dash}/>`;
      } else if (p.mode === "boat" && !big) {
        shape = `<path d="M${p.x - 6} ${p.y} Q ${p.x} ${p.y + 4} ${p.x + 6} ${p.y} Q ${p.x} ${p.y - 3} ${p.x - 6} ${p.y}" fill="${fill === "none" ? "rgba(94,200,216,.35)" : fill}"/>`;
      } else if (p.mode === "star" && !big) {
        shape = `<circle cx="${p.x}" cy="${p.y}" r="${r}" fill="${fill === "none" ? "rgba(196,160,255,.45)" : fill}" stroke="${stroke}" ${dash}/>`;
      }
      const label = big
        ? `<text x="${p.x}" y="${p.y - 12}" text-anchor="middle" fill="#eef3ff" font-size="9" font-family="Inter,sans-serif">${escapeXml(truncate(s.title, 20))}</text>`
        : "";
      skillLayer += `<g class="sknode ${activeDom ? "" : "dim"}" data-di="${p.di}" data-sid="${s.id}">
        <circle cx="${p.x}" cy="${p.y}" r="${big ? 16 : 9}" fill="transparent"/>
        ${shape}${label}
      </g>`;
    });

    svg.innerHTML = `<g id="cam" transform="${camTransform()}">
      <g class="decor">${decor}</g>
      <g class="clusters">${clusterLayer}</g>
      <g class="skills">${skillLayer}</g>
    </g>`;

    svg.querySelectorAll(".cluster").forEach(g => {
      g.addEventListener("click", e => { e.stopPropagation(); zoomToDomain(+g.dataset.di); });
    });
    svg.querySelectorAll(".sknode").forEach(g => {
      g.addEventListener("click", e => {
        e.stopPropagation();
        const di = +g.dataset.di, sid = g.dataset.sid;
        if (nav.domainIdx !== di || nav.cam.k < 1.8) zoomToDomain(di, () => openSkill(sid));
        else openSkill(sid);
      });
    });
  }

  function animateCam(done) {
    const start = { ...nav.cam };
    const end = nav.target || nav.cam;
    const t0 = performance.now(), dur = 480;
    function frame(t) {
      const u = Math.min(1, (t - t0) / dur);
      const e = 1 - Math.pow(1 - u, 3);
      nav.cam.x = start.x + (end.x - start.x) * e;
      nav.cam.y = start.y + (end.y - start.y) * e;
      nav.cam.k = start.k + (end.k - start.k) * e;
      const cam = document.getElementById("cam");
      if (cam) cam.setAttribute("transform", camTransform());
      if (u < 1) requestAnimationFrame(frame);
      else { nav.cam = { ...end }; nav.target = null; if (done) done(); }
    }
    requestAnimationFrame(frame);
  }

  function zoomToDomain(di, after) {
    nav.domainIdx = di;
    const cl = nav.layout.clusters[di];
    if (!cl) return;
    nav.target = { x: VW / 2 - cl.cx, y: VH / 2 - cl.cy, k: 2.5 };
    animateCam(() => { renderMap(); if (after) after(); });
    renderDistrictCards();
    renderCrumb();
  }

  function zoomOutMap() {
    if (nav.domainIdx != null) {
      nav.domainIdx = null;
      nav.target = { x: 0, y: 0, k: 1 };
      animateCam(() => renderMap());
      renderCrumb();
      return;
    }
    renderUniverse();
  }

  let mapBound = false;
  function bindMapInteract() {
    if (mapBound) return;
    mapBound = true;
    const stage = document.getElementById("worldStage");
    stage.addEventListener("wheel", e => {
      e.preventDefault();
      const factor = e.deltaY > 0 ? 0.9 : 1.1;
      nav.cam.k = Math.min(4, Math.max(0.7, nav.cam.k * factor));
      const cam = document.getElementById("cam");
      if (cam) cam.setAttribute("transform", camTransform());
    }, { passive: false });
    let dragging = false, lx = 0, ly = 0;
    stage.addEventListener("pointerdown", e => { dragging = true; lx = e.clientX; ly = e.clientY; stage.classList.add("panning"); stage.setPointerCapture(e.pointerId); });
    stage.addEventListener("pointermove", e => {
      if (!dragging) return;
      const dx = (e.clientX - lx) / nav.cam.k, dy = (e.clientY - ly) / nav.cam.k;
      nav.cam.x += dx; nav.cam.y += dy; lx = e.clientX; ly = e.clientY;
      const cam = document.getElementById("cam");
      if (cam) cam.setAttribute("transform", camTransform());
    });
    stage.addEventListener("pointerup", () => { dragging = false; stage.classList.remove("panning"); });
    stage.addEventListener("dblclick", () => zoomOutMap());
  }

  /* ── views ── */
  function renderUniverse() {
    nav.eraId = null; nav.domainIdx = null; nav.skillId = null;
    setView("universe");
    const root = document.getElementById("panels");
    root.innerHTML = ERAS.map((e, i) => {
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

  function renderDistrictCards() {
    const era = eraById(nav.eraId);
    const root = document.getElementById("districts");
    root.innerHTML = era.domains.map((d, i) => {
      const dc = domainCounts(d);
      return `<button type="button" class="district" data-di="${i}">
        <div class="did">${d.id}</div>
        <div class="dname">${d.name}</div>
        <div class="dmeta">${dc.proven} of ${dc.total} proven · ${dc.total} skills on the painting</div>
      </button>`;
    }).join("");
    root.querySelectorAll(".district").forEach(b => {
      b.onclick = () => openDomain(+b.dataset.di);
    });
  }

  function openWorld(eraId) {
    nav.eraId = eraId; nav.domainIdx = null; nav.skillId = null;
    nav.cam = { x: 0, y: 0, k: 1 }; nav.target = null;
    const era = eraById(eraId);
    nav.layout = layoutWorld(era);
    const m = era.metaphor === "tree" ? "grove" : (era.metaphor || "grove");
    document.getElementById("worldStage").dataset.m = m;
    document.getElementById("worldTitle").textContent = era.worldName || era.name;
    const c = counts(era);
    document.getElementById("worldMeta").textContent =
      `${era.romanLabel} · ${era.name} · ${c.total} skills on the tapestry · ${TAGS[era.id] || ""}`;
    renderDistrictCards();
    setView("world");
    renderMap();
    bindMapInteract();
  }

  function openDomain(di) {
    nav.domainIdx = di; nav.skillId = null;
    const era = eraById(nav.eraId);
    const dom = era.domains[di];
    const dc = domainCounts(dom);
    document.getElementById("topicTitle").textContent = `${dom.id} · ${dom.name.toUpperCase()}`;
    document.getElementById("topicFrac").textContent = `${dc.proven} of ${dc.total} proven`;
    const tabs = document.getElementById("topicTabs");
    tabs.innerHTML = era.domains.map((d, i) =>
      `<button type="button" class="${i === di ? "on" : ""}" data-di="${i}">${d.id}</button>`
    ).join("");
    tabs.querySelectorAll("button").forEach(b => { b.onclick = () => openDomain(+b.dataset.di); });
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
    rows.querySelectorAll(".row").forEach(b => { b.onclick = () => openSkill(b.dataset.sid); });
    // also zoom map if coming from world
    if (nav.layout) {
      const cl = nav.layout.clusters[di];
      if (cl) {
        nav.cam = { x: VW / 2 - cl.cx, y: VH / 2 - cl.cy, k: 2.2 };
      }
    }
    setView("domain");
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

  function renderCrumb() {
    const els = [document.getElementById("crumb"), document.getElementById("crumbDomain")].filter(Boolean);
    const parts = [`<button type="button" data-g="universe">Garden</button>`];
    if (nav.eraId) {
      const era = eraById(nav.eraId);
      parts.push(`<span class="sep">/</span><button type="button" data-g="world">${era.name}</button>`);
    }
    if (nav.eraId && nav.domainIdx != null) {
      parts.push(`<span class="sep">/</span><button type="button" data-g="domain">${eraById(nav.eraId).domains[nav.domainIdx].id}</button>`);
    }
    if (nav.skillId) parts.push(`<span class="sep">/</span><span>${nav.skillId}</span>`);
    els.forEach(el => {
      el.innerHTML = parts.join("");
      el.querySelectorAll("button").forEach(b => {
        b.onclick = () => {
          const g = b.dataset.g;
          if (g === "universe") renderUniverse();
          if (g === "world") openWorld(nav.eraId);
          if (g === "domain") openDomain(nav.domainIdx);
        };
      });
    });
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
    document.getElementById("backUniverse").onclick = () => renderUniverse();
    document.getElementById("zoomOutBtn").onclick = () => zoomOutMap();
    document.getElementById("backWorld").onclick = () => openWorld(nav.eraId);
    document.getElementById("backDomain").onclick = () => openDomain(nav.domainIdx);
    document.getElementById("continueBtn").onclick = () => {
      const n = nextSkill();
      if (!n) { renderUniverse(); return; }
      openWorld(n.era); openDomain(n.domainIdx); openSkill(n.skill.id);
    };
    document.addEventListener("keydown", e => {
      if (e.key !== "Escape") return;
      if (nav.view === "skill") openDomain(nav.domainIdx);
      else if (nav.view === "domain") openWorld(nav.eraId);
      else if (nav.view === "world") zoomOutMap();
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
