/* Era V · Unit V.3 Triangles (V.3.01–V.3.14) — the pilot for the geometry-figure pipeline */
(function (G) {
  const E = G.E5, V = E.V, C = E.C, M = s => E.mx(s);
  const S = (id, name, steps) => E.skill({ id, name, steps });

  /* ================= geometry helpers (model coordinates, y up) ================= */
  const r2 = x => Math.round(x * 100) / 100;
  const rad = d => d * Math.PI / 180, dg = r => r * 180 / Math.PI;
  const dist = (P, Q) => Math.hypot(P[0] - Q[0], P[1] - Q[1]);
  const lerp = (P, Q, t) => [P[0] + (Q[0] - P[0]) * t, P[1] + (Q[1] - P[1]) * t];
  const mid = (P, Q) => lerp(P, Q, 0.5);
  const add = (P, Q) => [P[0] + Q[0], P[1] + Q[1]], sub = (P, Q) => [P[0] - Q[0], P[1] - Q[1]], mul = (P, k) => [P[0] * k, P[1] * k];
  const unit = P => mul(P, 1 / (Math.hypot(P[0], P[1]) || 1));
  const polar = (r, d) => [r * Math.cos(rad(d)), r * Math.sin(rad(d))];
  const ang3 = (P, Q, T) => { let d = Math.abs(Math.atan2(P[1] - Q[1], P[0] - Q[0]) - Math.atan2(T[1] - Q[1], T[0] - Q[0])); if (d > Math.PI) d = 2 * Math.PI - d; return dg(d); };
  const foot = (P, A, B) => { const d = sub(B, A), t = ((P[0] - A[0]) * d[0] + (P[1] - A[1]) * d[1]) / (d[0] * d[0] + d[1] * d[1]); return add(A, mul(d, t)); };
  // triangle from its sides: a = BC, b = CA, c = AB
  const bySides = (a, b, c) => { const x = (a * a + c * c - b * b) / (2 * a); return { A: [x, Math.sqrt(Math.max(0, c * c - x * x))], B: [0, 0], C: [a, 0] }; };
  // triangle from the angles at B and C, with BC = a
  const byAngles = (Bd, Cd, a = 6) => { const c = a * Math.sin(rad(Cd)) / Math.sin(rad(180 - Bd - Cd)); return { A: polar(c, Bd), B: [0, 0], C: [a, 0] }; };
  const circum = (A, B, Q) => { const d = 2 * (A[0] * (B[1] - Q[1]) + B[0] * (Q[1] - A[1]) + Q[0] * (A[1] - B[1])), a2 = A[0] ** 2 + A[1] ** 2, b2 = B[0] ** 2 + B[1] ** 2, c2 = Q[0] ** 2 + Q[1] ** 2;
    return [(a2 * (B[1] - Q[1]) + b2 * (Q[1] - A[1]) + c2 * (A[1] - B[1])) / d, (a2 * (Q[0] - B[0]) + b2 * (A[0] - Q[0]) + c2 * (B[0] - A[0])) / d]; };
  const incen = (A, B, Q) => { const a = dist(B, Q), b = dist(A, Q), c = dist(A, B), s = a + b + c; return [(a * A[0] + b * B[0] + c * Q[0]) / s, (a * A[1] + b * B[1] + c * Q[1]) / s]; };
  const cen3 = (A, B, Q) => [(A[0] + B[0] + Q[0]) / 3, (A[1] + B[1] + Q[1]) / 3];
  // rotate (and maybe reflect) a whole picture, so no figure always sits base-down
  const xform = (pts, th, flip, k = 1) => { const c = Math.cos(th), s = Math.sin(th), o = {}; for (const n in pts) { const x = (flip ? -pts[n][0] : pts[n][0]) * k, y = pts[n][1] * k; o[n] = [x * c - y * s, x * s + y * c]; } return o; };
  const spin = (R, pts) => xform(pts, rad(R.int(0, 71) * 5), R.bool());

  /* ================= letters ================= */
  const POOL = 'ABCDEFGHJKLMNPQRSTUVWXYZ'.split('');
  const lets = (R, k) => R.sample(POOL, k);
  const trio = R => { const s = R.pick(['ABC', 'DEF', 'PQR', 'XYZ', 'JKL', 'LMN', 'RST', 'UVW', '', '', '']); return s ? s.split('') : lets(R, 3); };
  // replace single capital letters (point names) but never letters inside words like "Draw"
  const rnF = map => s => String(s).replace(/(?<![A-Za-z])[A-Z]+(?![a-z])/g, w => [...w].map(ch => map[ch] || ch).join(''));
  const renamePts = (pts, map) => { const o = {}; for (const k in pts) o[k[0] === '_' ? k : map[k]] = pts[k]; return o; };

  /* ================= the figure: V.geo plus labels placed to stay readable =================
     o: {pts, segs:[[a,b,{ticks,dash,lab,side,at}]], angles:[[p,v,q,label,{right,n,r}]], arrows:[[a,b,n,t]], text:[[pt,s]], w, center}
     Points whose name starts with "_" are drawn-to helpers (no dot, no label). */
  const TW = (s, z) => [...String(s)].reduce((w, ch) => w + (/[°.,′ ()]/.test(ch) ? 0.33 : /[A-Z△∠]/.test(ch) ? 0.68 : 0.56), 0) * z;
  const fig = o => {
    const P = o.pts, W = o.w || 280, pad = 30, hidden = k => k[0] === '_';
    const all = Object.values(P).slice();
    const xs = all.map(p => p[0]), ys = all.map(p => p[1]), mnx = Math.min(...xs), mxx = Math.max(...xs), mny = Math.min(...ys), mxy = Math.max(...ys);
    const sc = (W - 2 * pad) / Math.max(1e-9, mxx - mnx, mxy - mny), H = Math.round((mxy - mny) * sc + 2 * pad);
    const T = p => [r2(pad + (p[0] - mnx) * sc), r2(H - pad - (p[1] - mny) * sc)];
    const segs = (o.segs || []).map(([a, b, op = {}]) => [a, b, { ticks: op.ticks, dash: op.dash, color: op.color, width: op.width }]);
    const angs = [], albl = [], boxes = [], ticksA = [];
    (o.angles || []).forEach(([p, v, q, lab, op = {}]) => {
      const B = T(P[v]), a1 = Math.atan2(T(P[p])[1] - B[1], T(P[p])[0] - B[0]), a2 = Math.atan2(T(P[q])[1] - B[1], T(P[q])[0] - B[0]);
      if (op.right) { angs.push([p, v, q, '', { right: true }]); [a1, a2].forEach(a => boxes.push([B[0] + 20 * Math.cos(a), B[1] + 20 * Math.sin(a)])); return; }
      const t = ang3(P[p], P[v], P[q]), base = op.r || (t < 22 ? 40 : t < 40 ? 32 : t < 60 ? 26 : 22), n = op.n || 1;
      for (let i = 0; i < n; i++) angs.push([p, v, q, '', { r: base + 5 * i, color: op.color || C.red }]);
      const rr = base + 5 * (n - 1); let d = a2 - a1; while (d <= -Math.PI) d += 2 * Math.PI; while (d > Math.PI) d -= 2 * Math.PI;
      [a1, a2, a1 + d / 2].forEach(a => boxes.push([B[0] + (rr + 2) * Math.cos(a), B[1] + (rr + 2) * Math.sin(a)]));
      if (op.tick) { const m = a1 + d / 2; ticksA.push(`<line x1="${r2(B[0] + (rr - 5) * Math.cos(m))}" y1="${r2(B[1] + (rr - 5) * Math.sin(m))}" x2="${r2(B[0] + (rr + 5) * Math.cos(m))}" y2="${r2(B[1] + (rr + 5) * Math.sin(m))}" stroke="${op.color || C.red}" stroke-width="2"/>`); }
      if (lab) albl.push({ v, B, m: a1 + d / 2, h: Math.abs(d) / 2, lab, rr, op });
    });
    let body = V.geo({ pts: P, segs, angles: angs, polys: o.polys, labels: false, w: W, pad }).replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
    body += ticksA.join(''); Object.values(P).forEach(p => boxes.push(T(p)));
    const txt = (x, y, s, op = {}) => { const z = op.size || 14, hw = TW(s, z) / 2; boxes.push([x - hw, y - z * 0.62], [x + hw, y + z * 0.62]); body += V.text(r2(x), r2(y), s, { size: z, weight: op.weight || 600, fill: op.fill || C.ink }).replace('<text ', '<text paint-order="stroke" stroke="#fff" stroke-width="3.5" stroke-linejoin="round" '); };
    // distance along direction m that keeps a text box inside a wedge of half-angle h
    const fitWedge = (s, z, m, h, min) => { const hw = TW(s, z) / 2 + 3, hh = z * 0.6, ep = hw * Math.abs(Math.sin(m)) + hh * Math.abs(Math.cos(m)), eu = hw * Math.abs(Math.cos(m)) + hh * Math.abs(Math.sin(m));
      return Math.max(min + eu, eu + ep / Math.tan(Math.max(0.12, Math.min(h, 1.45)))); };
    // parallel arrows
    (o.arrows || []).forEach(([a, b, n = 1, t = 0.5]) => { const A = T(P[a]), B = T(P[b]), u = unit(sub(B, A)), w = [-u[1], u[0]], c = lerp(A, B, t);
      for (let i = 0; i < n; i++) { const tip = add(c, mul(u, 4 + 6 * (i - (n - 1) / 2))), k1 = add(sub(tip, mul(u, 7)), mul(w, 5)), k2 = add(sub(tip, mul(u, 7)), mul(w, -5));
        body += `<path d="M${r2(k1[0])} ${r2(k1[1])} L${r2(tip[0])} ${r2(tip[1])} L${r2(k2[0])} ${r2(k2[1])}" fill="none" stroke="${C.ink}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`; } });
    // angle labels, pushed out along the bisector until they fit between the arms
    const placed = [], hit = (x, y, hw, hh) => placed.some(q => Math.abs(q[0] - x) < q[2] + hw && Math.abs(q[1] - y) < q[3] + hh);
    albl.forEach(a => { const z = 13.5, hw = TW(a.lab, z) / 2, hh = z * 0.6; let d = Math.min(fitWedge(a.lab, z, a.m, a.h, a.rr + 4), a.op.max || a.rr + 34);
      if (a.op.out) d = -(hw * Math.abs(Math.cos(a.m)) + hh * Math.abs(Math.sin(a.m)) + 10);
      for (let i = 0; i < 8 && hit(a.B[0] + d * Math.cos(a.m), a.B[1] + d * Math.sin(a.m), hw, hh); i++) d += a.op.out ? -7 : 7;
      const x = a.B[0] + d * Math.cos(a.m), y = a.B[1] + d * Math.sin(a.m); placed.push([x, y, hw, hh]); txt(x, y, a.lab, { size: z, fill: a.op.color || C.red }); });
    // side labels, on the side away from the figure's middle
    const vis = Object.keys(P).filter(k => !hidden(k)).map(k => T(P[k])), cen = o.center ? T(o.center) : [vis.reduce((s, p) => s + p[0], 0) / vis.length, vis.reduce((s, p) => s + p[1], 0) / vis.length];
    (o.segs || []).forEach(([a, b, op = {}]) => { if (op.lab === undefined) return; const A = T(P[a]), B = T(P[b]), c = lerp(A, B, op.at ?? 0.5), u = unit(sub(B, A)); let n = [-u[1], u[0]];
      const nb = k => new Set((o.segs || []).flatMap(([p, q]) => p === k ? [q] : q === k ? [p] : [])), na = nb(a), third = [...nb(b)].find(k => na.has(k)), ref = op.ref ? T(P[op.ref]) : third ? T(P[third]) : cen;
      if ((ref[0] - c[0]) * n[0] + (ref[1] - c[1]) * n[1] > 0) n = mul(n, -1); if (op.side === -1) n = mul(n, -1);
      const z = 14, off = 7 + (TW(op.lab, z) / 2) * Math.abs(n[0]) + z * 0.55 * Math.abs(n[1]) + (op.ticks ? 3 : 0);
      txt(c[0] + n[0] * off, c[1] + n[1] * off, op.lab, { size: z, fill: op.lcolor || C.ink }); });
    // point labels in the widest gap between the lines that meet there
    Object.keys(P).forEach(k => { if (hidden(k) || (o.hide || []).includes(k)) return; const p = T(P[k]), dirs = [];
      (o.segs || []).forEach(([a, b]) => { const A = T(P[a]), B = T(P[b]);
        if (a === k) dirs.push(Math.atan2(B[1] - p[1], B[0] - p[0])); else if (b === k) dirs.push(Math.atan2(A[1] - p[1], A[0] - p[0]));
        else { const L2 = (B[0] - A[0]) ** 2 + (B[1] - A[1]) ** 2, t = ((p[0] - A[0]) * (B[0] - A[0]) + (p[1] - A[1]) * (B[1] - A[1])) / L2; if (t > 0.001 && t < 0.999 && dist(p, lerp(A, B, t)) < 0.8) dirs.push(Math.atan2(B[1] - p[1], B[0] - p[0]), Math.atan2(A[1] - p[1], A[0] - p[0])); } });
      albl.filter(a => a.v === k).forEach(a => { const q = a.op.out ? a.m + Math.PI : a.m; dirs.push(Math.atan2(Math.sin(q), Math.cos(q))); });
      let m, h = Math.PI;
      if (!dirs.length) m = Math.atan2(p[1] - cen[1], p[0] - cen[0]);
      else { dirs.sort((x, y) => x - y); let best = -1; dirs.forEach((x, i) => { const y = i + 1 < dirs.length ? dirs[i + 1] : dirs[0] + 2 * Math.PI, g = y - x; if (g > best) { best = g; m = x + g / 2; } }); h = best / 2; }
      const d = Math.min(fitWedge(k, 15, m, h, 8), 34);
      body += V.dot(p[0], p[1], 3.2, C.ink); txt(p[0] + d * Math.cos(m), p[1] + d * Math.sin(m), k, { size: 15, weight: 700 }); });
    (o.text || []).forEach(([q, s, op = {}]) => { const p = T(q); txt(p[0], p[1], s, op); });
    const bx = boxes.map(b => b[0]), by = boxes.map(b => b[1]), x0 = Math.min(...bx) - 6, y0 = Math.min(...by) - 6, w = Math.ceil(Math.max(...bx) + 6 - x0), h2 = Math.ceil(Math.max(...by) + 6 - y0);
    return V.svg(w, h2, `<g transform="translate(${r2(-x0)} ${r2(-y0)})">${body}</g>`, o.label || 'triangle figure');
  };
  // a figure for one triangle {A,B,C} with display names n (canonical → letter)
  const triMarks = (n, sides = {}, angs = {}, labs = {}) => ({
    segs: [['A', 'B'], ['B', 'C'], ['C', 'A']].map(([p, q]) => [n[p], n[q], { ticks: sides[p + q] || sides[q + p] || 0, lab: labs[p + q] ?? labs[q + p] }]),
    angles: 'ABC'.split('').filter(k => angs[k] || labs[k]).map(k => { const [p, q] = 'ABC'.replace(k, '').split(''); return [n[p], n[k], n[q], labs[k] || '', angs[k] === 'R' ? { right: true } : { n: angs[k] || 1 }]; }),
  });
  // two triangles side by side, each turned its own way
  const pairPts = (R, T1, T2, n1, n2) => {
    const a = spin(R, T1), b = spin(R, T2), bb = t => { const v = Object.values(t); return [Math.min(...v.map(p => p[0])), Math.max(...v.map(p => p[0])), Math.min(...v.map(p => p[1])), Math.max(...v.map(p => p[1]))]; };
    const [ax0, ax1, ay0, ay1] = bb(a), [bx0, bx1, by0, by1] = bb(b), gap = 0.5 * Math.max(ax1 - ax0, ay1 - ay0, bx1 - bx0, by1 - by0);
    const dx = ax1 + gap - bx0, dy = (ay0 + ay1) / 2 - (by0 + by1) / 2, P = {};
    for (const k of 'ABC') { P[n1[k]] = a[k]; P[n2[k]] = [b[k][0] + dx, b[k][1] + dy]; } return P;
  };
  const pairFig = (P, n1, n2, m1, m2, lab) => { const t1 = triMarks(n1, ...m1), t2 = triMarks(n2, ...m2); return fig({ pts: P, segs: [...t1.segs, ...t2.segs], angles: [...t1.angles, ...t2.angles], w: 340, label: lab || 'two triangles' }); };
  // a random scalene triangle with angles far enough apart to tell by eye
  const randTri = (R, o = {}) => { let A, B, Cc;
    do { if (o.right) { A = R.int(28, 62); B = 90 - A; Cc = 90; } else { A = R.int(38, 86); B = R.int(38, 86); Cc = 180 - A - B; } } while (Cc < 34 || Cc > 100 || Math.abs(A - B) < 8 || Math.abs(B - Cc) < 8 || Math.abs(A - Cc) < 8);
    return { t: byAngles(B, Cc, 5), A, B, C: Cc }; };
  const nameMap = L => ({ A: L[0], B: L[1], C: L[2] });
  const deg = n => `${n}°`;
  const lin = (a, b, v = 'x') => `${a === 1 ? '' : a}${v}${b ? (b > 0 ? ' + ' + b : ' − ' + -b) : ''}`;        // label text 3x + 5
  const linM = (a, b, v = 'x') => `${a === 1 ? '' : a}${v}${b ? (b > 0 ? '+' + b : b) : ''}`;                 // M() text 3x+5
  const angLab = (a, b) => b ? `(${lin(a, b)})°` : `${lin(a, b)}°`;

  /* ================= two-column proofs =================
     A proof config: {pts, segs, angles, arrows, lines:[[statement, reason, deps]], post, tri:['ABC','ADC'], targets:[…]}
     Statements use the canonical letters; each question relabels them. deps point back to earlier lines. */
  const POSTS = ['SSS', 'SAS', 'ASA', 'AAS', 'HL'];
  const WHY = {
    'reflexive property': 'every segment or angle is congruent to itself', 'vertical angles': 'they are vertical angles, opposite each other where two lines cross',
    'alternate interior angles': 'they are alternate interior angles made by the parallel lines', 'definition of midpoint': 'a midpoint splits a segment into two congruent parts',
    'definition of angle bisector': 'a bisector splits an angle into two congruent angles', 'all right angles are congruent': 'perpendicular lines make right angles, and all right angles are congruent',
    'definition of right triangle': 'a triangle with a right angle is a right triangle', 'segment addition': 'the same segment is added to two congruent segments',
    'CPCTC': 'the triangles are already proved congruent, so their corresponding parts are congruent', 'converse of alternate interior angles': 'congruent alternate interior angles make the lines parallel',
    'congruent linear pair angles are right angles': 'two congruent angles that add to 180° are 90° each', 'parallel postulate': 'through a point not on a line there is exactly one parallel line',
    'angles on a straight line': 'the three angles together make a straight angle', 'substitution': 'equal angles can replace each other', 'linear pair': 'the two angles make a straight line',
    'triangle sum theorem': 'the angles of a triangle add to 180°', 'subtraction property': 'the same angle is taken from both sides', 'third angles theorem': 'two angles of one triangle match two of the other, so the third angles match too',
    'every angle has a bisector': 'any angle can be bisected', 'every segment has a midpoint': 'any segment has a midpoint',
    SSS: 'three pairs of sides are congruent', SAS: 'two pairs of sides and the angles between them are congruent', ASA: 'two pairs of angles and the sides between them are congruent',
    AAS: 'two pairs of angles and a pair of sides not between them are congruent', HL: 'they are right triangles with congruent hypotenuses and a pair of congruent legs',
  };
  const PARTS = { SSS: 'three pairs of sides', SAS: 'two pairs of sides with the angle between them', ASA: 'two pairs of angles with the side between them', AAS: 'two pairs of angles and a side not between them', HL: 'the hypotenuses and a pair of legs of right triangles' };
  const circ = th => `that is the theorem being proved, so using it is circular`;
  const WRONG0 = {
    'reflexive property': [['definition of midpoint'], ['vertical angles'], ['CPCTC']], 'vertical angles': [['alternate interior angles'], ['reflexive property'], ['CPCTC']],
    'alternate interior angles': [['vertical angles'], ['corresponding angles'], ['CPCTC']], 'definition of midpoint': [['definition of angle bisector'], ['reflexive property'], ['CPCTC']],
    'definition of angle bisector': [['definition of midpoint'], ['vertical angles'], ['CPCTC']], 'all right angles are congruent': [['vertical angles'], ['definition of angle bisector'], ['CPCTC']],
    'definition of right triangle': [['definition of midpoint'], ['vertical angles']], 'segment addition': [['reflexive property'], ['definition of midpoint']],
    'converse of alternate interior angles': [['vertical angles'], ['alternate interior angles', 'the alternate interior angles theorem needs parallel lines to start with; here congruent alternate interior angles are used to prove the lines parallel, which is its converse']],
    'congruent linear pair angles are right angles': [['vertical angles']], 'parallel postulate': [['triangle sum theorem', circ()]],
    'angles on a straight line': [['triangle sum theorem', circ()], ['vertical angles']], 'substitution': [['triangle sum theorem', circ()]],
    'linear pair': [['vertical angles'], ['exterior angle theorem', circ()]], 'triangle sum theorem': [['exterior angle theorem', circ()], ['linear pair']],
    'subtraction property': [['exterior angle theorem', circ()]], 'third angles theorem': [['vertical angles'], ['CPCTC']],
  };
  const POSTWRONG = { SSS: ['SAS', 'ASA'], SAS: ['ASA', 'SSA', 'SSS'], ASA: ['AAS', 'SAS', 'AAA'], AAS: ['ASA', 'AAA', 'SSA'], HL: ['SSA', 'SAS'] };
  const CPOOL = ['reflexive property', 'vertical angles', 'alternate interior angles', 'definition of midpoint', 'definition of angle bisector', 'all right angles are congruent', 'CPCTC', 'given'];
  const SYN = { 'linear pair': ['angles on a straight line'], 'angles on a straight line': ['linear pair'], 'transitive property': ['substitution'], substitution: ['transitive property'] };
  Object.assign(WHY, { 'definition of congruent angles': 'angles with equal measures are congruent', 'transitive property': 'two lengths equal to the same length are equal to each other',
    'perpendicular bisector theorem': 'every point on the perpendicular bisector of a segment is equally far from its endpoints', 'converse of the perpendicular bisector theorem': 'a point equally far from the endpoints of a segment lies on its perpendicular bisector',
    'angle bisector theorem': 'every point on an angle bisector is equally far from the sides of the angle', 'converse of the angle bisector theorem': 'a point inside an angle that is equally far from its sides lies on its bisector' });
  const linExt = deps => { const n = deps.length, out = [], used = []; const rec = seq => { if (seq.length === n) { out.push(seq.slice()); return; } for (let i = 0; i < n; i++) if (!used[i] && deps[i].every(d => used[d])) { used[i] = 1; seq.push(i); rec(seq); seq.pop(); used[i] = 0; } }; rec([]); return out; };
  const table = rows => `<table class="dt"><tr><th>#</th><th>Statement</th><th>Reason</th></tr>${rows.map((r, i) => `<tr><td>${i + 1}</td><td>${r[0]}</td><td>${r[1]}</td></tr>`).join('')}</table>`;
  const joinAnd = a => a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1];
  // relabel + draw a config; returns {rn, vis, map}
  const prepCfg = (R, cfg) => {
    const names = Object.keys(cfg.pts).filter(k => k[0] !== '_'), L = lets(R, names.length), map = {}; names.forEach((k, i) => map[k] = L[i]);
    const mm = k => k[0] === '_' ? k : map[k], P = renamePts(cfg.fixed ? cfg.pts : spin(R, cfg.pts), map);
    const vis = fig({ pts: P, segs: (cfg.segs || []).map(([a, b, op]) => [mm(a), mm(b), op]), angles: (cfg.angles || []).map(([a, v, b, l, op]) => [mm(a), mm(v), mm(b), l, op]),
      arrows: (cfg.arrows || []).map(([a, b, n, t]) => [mm(a), mm(b), n, t]), w: cfg.w || 280, label: cfg.label || 'proof figure' });
    return { rn: rnF(map), vis, map };
  };
  // is "△XYZ ≅ △UVW" true for the config's canonical coordinates?
  const congTrue = (pts, t1, t2) => [[0, 1], [1, 2], [0, 2]].every(([i, j]) => Math.abs(dist(pts[t1[i]], pts[t1[j]]) - dist(pts[t2[i]], pts[t2[j]])) < 1e-6);
  const PERMS = [[0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
  const proofQ = (R, cfg, mode) => {
    const WRONG = Object.assign({}, WRONG0, cfg.wrong || {});
    const { rn, vis } = prepCfg(R, cfg), lines = cfg.lines.map(([st, rs, dp]) => [rn(st), rs, dp || []]), n = lines.length;
    const givens = lines.filter(l => l[1] === 'given').map(l => l[0]);
    const head = `${cfg.note ? cfg.note + ' ' : ''}${givens.length ? 'Given: ' + givens.join('; ') + '. ' : cfg.given ? 'Given: ' + rn(cfg.given) + '. ' : ''}Prove: ${rn(cfg.prove || cfg.lines[n - 1][0])}.`;
    const cong = lines.findIndex(l => POSTS.includes(l[1]));
    if (mode === 'order') {
      const ng = Math.max(0, lines.findIndex(l => l[1] !== 'given'));   // the Givens stay first, already placed
      const ext = linExt(lines.map(l => l[2])).filter(a => a.slice(0, ng).every((x, i) => x === i)), alts = ext.filter(a => a.some((x, i) => x !== i)), last = lines[n - 1];
      return E.order(R, `${head} Put the steps of the proof in order.`, lines.map(l => `${l[0]} (${l[1]})`),
        `Each step must come after the steps it uses${alts.length ? '; steps that use nothing new may swap' : ''}. The last step, ${last[0]} (${last[1]}), uses ${joinAnd(last[2].map(d => lines[d][0]))}.`, { alts, visual: vis, fixed: ng });
    }
    if (mode === 'reason') {
      const cand = lines.map((l, i) => i).filter(i => !['given', 'every angle has a bisector', 'every segment has a midpoint'].includes(lines[i][1]));
      const k = R.pick(cand), [st, rs, dp] = lines[k];
      let wrong;
      if (POSTS.includes(rs)) wrong = R.sample(['SSS', 'SAS', 'ASA', 'AAS', 'HL', 'SSA', 'AAA'].filter(p => p !== rs && !(cfg.postEx || []).includes(p)), 3);
      else { const ok = x => x !== rs && !(SYN[rs] || []).includes(x) && !(x === 'given' && dp.length) && !(x === 'CPCTC' && (cong < 0 || k > cong));
        const w1 = R.shuffle((WRONG[rs] || []).map(x => x[0]).filter(ok)).slice(0, 2), rest = R.shuffle((cfg.pool || CPOOL).filter(x => ok(x) && !w1.includes(x)));
        wrong = [...w1, ...rest].slice(0, 3); }
      return E.choice(R, `${head} What is the reason for step ${k + 1}?${table(lines.map((l, i) => [l[0], i === k ? '<b>?</b>' : l[1]]))}`, rs, wrong,
        `Step ${k + 1}: ${st} ${POSTS.includes(rs) ? `by ${rs}, because ${WHY[rs]}` : `because ${WHY[rs]} (${rs})`}.`, { visual: vis });
    }
    // find the broken step: change exactly one thing, never a statement a later step relies on
    const bads = [];
    lines.forEach(([st, rs], i) => {
      if (rs === 'given') return;
      if (POSTS.includes(rs)) {
        POSTWRONG[rs].filter(w => !(cfg.postEx || []).includes(w)).forEach(w => bads.push({ i, rs: w, why: w === 'SSA' || w === 'AAA' ? `${w} never proves triangles congruent. The parts listed are ${PARTS[rs]}, so the reason is ${rs}` : `the parts listed are ${PARTS[rs]}, so the reason is ${rs}, not ${w}` }));
        if (cfg.tri && i === n - 1) { const [t1, t2] = cfg.tri, ok = PERMS.filter(p => !congTrue(cfg.pts, t1, p.map(j => t2[j]).join(''))), p = ok.length ? R.pick(ok) : null;
          if (p) bads.push({ i, st: rn(`△${t1} ≅ △${p.map(j => t2[j]).join('')}`), why: `the letters must pair up corresponding vertices (${[0, 1, 2].map(j => rn(t1[j]) + '↔' + rn(t2[j])).join(', ')}), so it should read ${st}` }); }
        return;
      }
      if (rs === 'CPCTC') { bads.push({ i, rs: cfg.post, why: `${cfg.post} proves triangles congruent, not their parts. ${st} follows from the congruent triangles by CPCTC` }); return; }
      (WRONG[rs] || []).forEach(([w, why]) => { if (w === 'CPCTC' && (cong < 0 || i > cong)) return;
        bads.push({ i, rs: w, why: why ? `${st} cannot use the ${w}: ${why}` : w === 'CPCTC' ? `CPCTC can only be used after the triangles are proved congruent. ${st} holds because ${WHY[rs]}` : `${st} holds because ${WHY[rs]}, not by ${w}` }); });
    });
    const b = R.pick(bads), rows = lines.map((l, i) => i === b.i ? [b.st || l[0], b.rs || l[1]] : [l[0], l[1]]);
    const idx = lines.map((l, i) => i).filter(i => n <= 6 || lines[i][1] !== 'given');
    return E.choiceFixed(`${head} Exactly one step has a mistake. Which step is it?${table(rows)}`, idx.map(i => `Step ${i + 1}`), idx.indexOf(b.i), `Step ${b.i + 1} is wrong: ${b.why}.`, { visual: vis });
  };
  const mode3 = R => R.pick(['order', 'reason', 'broken']);

  /* ----- congruence proof configs (canonical letters) ----- */
  const kiteP = R => { const h1 = R.int(20, 34) / 10, h2 = R.int(16, 40) / 10, w = R.int(16, 26) / 10, y0 = R.int(-6, 6) / 10; return { A: [0, h1], B: [-w, y0], C: [0, -h2], D: [w, y0] }; };
  const isoP = (R, foot = 'D') => { const b = R.int(14, 26) / 10, h = R.int(22, 40) / 10; return { A: [0, h], B: [-b, 0], C: [b, 0], [foot]: [0, 0] }; };
  const gramP = R => { const a = R.int(26, 40) / 10, s = R.int(-8, 14) / 10, h = R.int(17, 27) / 10; return { A: [0, 0], B: [a, 0], C: [a + s, h], D: [s, h] }; };
  const bowP = R => { const al = R.int(14, 34), be = -R.int(14, 34), ru = R.int(17, 26) / 10, rv = R.int(17, 26) / 10, u = polar(ru, al), v = polar(rv, be);
    return { A: mul(u, -1), B: mul(v, -1), C: [0, 0], D: v, E: u }; };
  const wedgeP = R => { const ph = R.int(18, 30), p = R.int(30, 40) / 10, k = p * Math.cos(rad(ph)); return { A: [0, 0], B: polar(k, ph), C: polar(k, -ph), P: [p, 0] }; };
  const isoSegs = [['A', 'B'], ['A', 'C'], ['B', 'D'], ['D', 'C'], ['A', 'D']];
  const CFG = {
    SSS: [
      R => ({ post: 'SSS', pts: kiteP(R), segs: [['A', 'B', { ticks: 1 }], ['A', 'D', { ticks: 1 }], ['C', 'B', { ticks: 2 }], ['C', 'D', { ticks: 2 }], ['A', 'C']],
        lines: [['AB ≅ AD', 'given'], ['CB ≅ CD', 'given'], ['AC ≅ AC', 'reflexive property'], ['△ABC ≅ △ADC', 'SSS', [0, 1, 2]]], tri: ['ABC', 'ADC'], targets: ['∠ABC ≅ ∠ADC', '∠BAC ≅ ∠DAC', '∠BCA ≅ ∠DCA'] }),
      R => ({ post: 'SSS', pts: isoP(R, 'M'), segs: [['A', 'B', { ticks: 1 }], ['A', 'C', { ticks: 1 }], ['B', 'M', { ticks: 2 }], ['M', 'C', { ticks: 2 }], ['A', 'M']],
        lines: [['AB ≅ AC', 'given'], ['M is the midpoint of BC', 'given'], ['BM ≅ CM', 'definition of midpoint', [1]], ['AM ≅ AM', 'reflexive property'], ['△ABM ≅ △ACM', 'SSS', [0, 2, 3]]], tri: ['ABM', 'ACM'], targets: ['∠ABM ≅ ∠ACM', '∠BAM ≅ ∠CAM', '∠AMB ≅ ∠AMC'] }),
      R => ({ post: 'SSS', pts: gramP(R), segs: [['A', 'B', { ticks: 1 }], ['C', 'D', { ticks: 1 }], ['A', 'D', { ticks: 2 }], ['B', 'C', { ticks: 2 }], ['B', 'D']],
        lines: [['AB ≅ CD', 'given'], ['AD ≅ CB', 'given'], ['BD ≅ DB', 'reflexive property'], ['△ABD ≅ △CDB', 'SSS', [0, 1, 2]]], tri: ['ABD', 'CDB'], targets: ['∠BAD ≅ ∠DCB', '∠ABD ≅ ∠CDB', '∠ADB ≅ ∠CBD'] }),
    ],
    SAS: [
      R => ({ post: 'SAS', pts: bowP(R), segs: [['A', 'C', { ticks: 1 }], ['C', 'E', { ticks: 1 }], ['B', 'C', { ticks: 2 }], ['C', 'D', { ticks: 2 }], ['A', 'B'], ['D', 'E']],
        lines: [['C is the midpoint of AE and of BD', 'given'], ['AC ≅ EC', 'definition of midpoint', [0]], ['BC ≅ DC', 'definition of midpoint', [0]], ['∠ACB ≅ ∠ECD', 'vertical angles'], ['△ACB ≅ △ECD', 'SAS', [1, 2, 3]]], tri: ['ACB', 'ECD'], targets: ['AB ≅ ED', '∠BAC ≅ ∠DEC', '∠ABC ≅ ∠EDC'] }),
      R => ({ post: 'SAS', pts: isoP(R), segs: [['A', 'B', { ticks: 1 }], ['A', 'C', { ticks: 1 }], ['B', 'D'], ['D', 'C'], ['A', 'D']], angles: [['B', 'A', 'D', '', { n: 1, tick: true }], ['D', 'A', 'C', '', { n: 1, tick: true }]],
        lines: [['AB ≅ AC', 'given'], ['AD bisects ∠BAC', 'given'], ['∠BAD ≅ ∠CAD', 'definition of angle bisector', [1]], ['AD ≅ AD', 'reflexive property'], ['△ABD ≅ △ACD', 'SAS', [0, 2, 3]]], tri: ['ABD', 'ACD'], targets: ['BD ≅ CD', '∠ABD ≅ ∠ACD', '∠ADB ≅ ∠ADC'] }),
      R => ({ post: 'SAS', pts: gramP(R), segs: [['A', 'B', { ticks: 1 }], ['D', 'C', { ticks: 1 }], ['A', 'D'], ['B', 'C'], ['B', 'D']], arrows: [['A', 'B', 1, 0.3], ['D', 'C', 1, 0.3]],
        lines: [['AB ∥ DC', 'given'], ['AB ≅ DC', 'given'], ['∠ABD ≅ ∠CDB', 'alternate interior angles', [0]], ['BD ≅ DB', 'reflexive property'], ['△ABD ≅ △CDB', 'SAS', [1, 2, 3]]], tri: ['ABD', 'CDB'], targets: ['AD ≅ CB', '∠BAD ≅ ∠DCB', '∠ADB ≅ ∠CBD'] }),
      R => { const a = R.int(14, 24) / 10, h = R.int(20, 36) / 10; return { post: 'SAS', pts: { A: [-a, 0], B: [a, 0], M: [0, 0], P: [0, h] }, segs: [['A', 'M', { ticks: 1 }], ['M', 'B', { ticks: 1 }], ['P', 'M'], ['P', 'A'], ['P', 'B']], angles: [['P', 'M', 'B', '', { right: true }]],
        lines: [['PM ⟂ AB', 'given'], ['M is the midpoint of AB', 'given'], ['AM ≅ BM', 'definition of midpoint', [1]], ['∠PMA ≅ ∠PMB', 'all right angles are congruent', [0]], ['PM ≅ PM', 'reflexive property'], ['△PMA ≅ △PMB', 'SAS', [2, 3, 4]]], tri: ['PMA', 'PMB'], targets: ['PA ≅ PB', '∠MPA ≅ ∠MPB', '∠PAM ≅ ∠PBM'] }; },
    ],
    ASA: [
      R => ({ post: 'ASA', pts: bowP(R), segs: [['A', 'B'], ['E', 'D'], ['A', 'C'], ['C', 'E'], ['B', 'C', { ticks: 1 }], ['C', 'D', { ticks: 1 }]], arrows: [['A', 'B', 1], ['E', 'D', 1]],
        lines: [['AB ∥ DE', 'given'], ['C is the midpoint of BD', 'given'], ['∠ABC ≅ ∠EDC', 'alternate interior angles', [0]], ['BC ≅ DC', 'definition of midpoint', [1]], ['∠ACB ≅ ∠ECD', 'vertical angles'], ['△ABC ≅ △EDC', 'ASA', [2, 3, 4]]], tri: ['ABC', 'EDC'], targets: ['AB ≅ ED', 'AC ≅ EC', '∠BAC ≅ ∠DEC'] }),
      R => ({ post: 'ASA', pts: isoP(R), segs: isoSegs, angles: [['B', 'A', 'D', '', { n: 1, tick: true }], ['D', 'A', 'C', '', { n: 1, tick: true }], ['A', 'D', 'B', '', { right: true }]],
        lines: [['AD bisects ∠BAC', 'given'], ['AD ⟂ BC', 'given'], ['∠BAD ≅ ∠CAD', 'definition of angle bisector', [0]], ['AD ≅ AD', 'reflexive property'], ['∠ADB ≅ ∠ADC', 'all right angles are congruent', [1]], ['△ABD ≅ △ACD', 'ASA', [2, 3, 4]]], tri: ['ABD', 'ACD'], targets: ['AB ≅ AC', 'BD ≅ CD', '∠ABD ≅ ∠ACD'] }),
      R => ({ post: 'ASA', pts: gramP(R), segs: [['A', 'B'], ['D', 'C'], ['A', 'D'], ['B', 'C'], ['B', 'D']], arrows: [['A', 'B', 1], ['D', 'C', 1], ['A', 'D', 2], ['B', 'C', 2]],
        lines: [['AB ∥ DC', 'given'], ['AD ∥ BC', 'given'], ['∠ABD ≅ ∠CDB', 'alternate interior angles', [0]], ['BD ≅ DB', 'reflexive property'], ['∠ADB ≅ ∠CBD', 'alternate interior angles', [1]], ['△ABD ≅ △CDB', 'ASA', [2, 3, 4]]], tri: ['ABD', 'CDB'], targets: ['AB ≅ CD', 'AD ≅ CB', '∠BAD ≅ ∠DCB'] }),
    ],
    AAS: [
      R => ({ post: 'AAS', pts: bowP(R), segs: [['A', 'B', { ticks: 1 }], ['E', 'D', { ticks: 1 }], ['A', 'C'], ['C', 'E'], ['B', 'C'], ['C', 'D']], arrows: [['A', 'B', 1, 0.3], ['E', 'D', 1, 0.7]],
        lines: [['AB ∥ DE', 'given'], ['AB ≅ ED', 'given'], ['∠BAC ≅ ∠DEC', 'alternate interior angles', [0]], ['∠ACB ≅ ∠ECD', 'vertical angles'], ['△ABC ≅ △EDC', 'AAS', [1, 2, 3]]], tri: ['ABC', 'EDC'], targets: ['AC ≅ EC', 'BC ≅ DC', '∠ABC ≅ ∠EDC'] }),
      R => ({ post: 'AAS', pts: wedgeP(R), segs: [['A', 'B'], ['A', 'C'], ['P', 'B'], ['P', 'C'], ['A', 'P']], angles: [['B', 'A', 'P', '', { n: 1, tick: true }], ['P', 'A', 'C', '', { n: 1, tick: true }], ['A', 'B', 'P', '', { right: true }], ['A', 'C', 'P', '', { right: true }]],
        lines: [['AP bisects ∠BAC', 'given'], ['PB ⟂ AB and PC ⟂ AC', 'given'], ['∠BAP ≅ ∠CAP', 'definition of angle bisector', [0]], ['∠ABP ≅ ∠ACP', 'all right angles are congruent', [1]], ['AP ≅ AP', 'reflexive property'], ['△ABP ≅ △ACP', 'AAS', [2, 3, 4]]], tri: ['ABP', 'ACP'], targets: ['PB ≅ PC', 'AB ≅ AC', '∠APB ≅ ∠APC'] }),
      R => ({ post: 'AAS', pts: isoP(R), segs: isoSegs, angles: [['A', 'B', 'D', '', { n: 1 }], ['D', 'C', 'A', '', { n: 1 }], ['A', 'D', 'B', '', { right: true }]],
        lines: [['∠B ≅ ∠C', 'given'], ['AD ⟂ BC', 'given'], ['∠ADB ≅ ∠ADC', 'all right angles are congruent', [1]], ['AD ≅ AD', 'reflexive property'], ['△ABD ≅ △ACD', 'AAS', [0, 2, 3]]], tri: ['ABD', 'ACD'], targets: ['AB ≅ AC', 'BD ≅ CD', '∠BAD ≅ ∠CAD'] }),
    ],
    HL: [
      R => ({ post: 'HL', pts: isoP(R), segs: [['A', 'B', { ticks: 1 }], ['A', 'C', { ticks: 1 }], ['B', 'D'], ['D', 'C'], ['A', 'D']], angles: [['A', 'D', 'B', '', { right: true }]],
        lines: [['AB ≅ AC', 'given'], ['AD ⟂ BC', 'given'], ['△ADB and △ADC are right triangles', 'definition of right triangle', [1]], ['AD ≅ AD', 'reflexive property'], ['△ADB ≅ △ADC', 'HL', [0, 2, 3]]], tri: ['ADB', 'ADC'], targets: ['BD ≅ CD', '∠ABD ≅ ∠ACD', '∠BAD ≅ ∠CAD'] }),
      R => { const w = R.int(25, 40) / 10, h = R.int(15, 24) / 10; return { post: 'HL', pts: { A: [0, 0], B: [w, 0], C: [w, h], D: [0, h] }, segs: [['A', 'B', { ticks: 1 }], ['C', 'D', { ticks: 1 }], ['B', 'C'], ['D', 'A'], ['A', 'C']], angles: [['A', 'B', 'C', '', { right: true }], ['C', 'D', 'A', '', { right: true }]],
        lines: [['∠B and ∠D are right angles', 'given'], ['AB ≅ CD', 'given'], ['AC ≅ CA', 'reflexive property'], ['△ABC ≅ △CDA', 'HL', [0, 1, 2]]], tri: ['ABC', 'CDA'], targets: ['BC ≅ DA', '∠BAC ≅ ∠DCA', '∠BCA ≅ ∠DAC'] }; },
      R => ({ post: 'HL', pts: wedgeP(R), segs: [['A', 'B'], ['A', 'C'], ['P', 'B', { ticks: 1 }], ['P', 'C', { ticks: 1 }], ['A', 'P']], angles: [['A', 'B', 'P', '', { right: true }], ['A', 'C', 'P', '', { right: true }]],
        lines: [['PB ⟂ AB and PC ⟂ AC', 'given'], ['PB ≅ PC', 'given'], ['△ABP and △ACP are right triangles', 'definition of right triangle', [0]], ['AP ≅ AP', 'reflexive property'], ['△ABP ≅ △ACP', 'HL', [1, 2, 3]]], tri: ['ABP', 'ACP'], targets: ['AB ≅ AC', '∠BAP ≅ ∠CAP', '∠APB ≅ ∠APC'] }),
    ],
  };
  const cfgOf = (R, post) => R.pick(CFG[post])(R);

  /* ----- pairs of triangles marked for a postulate (T2 honestly different for SSA and AAA) ----- */
  const markPair = (R, kind) => {
    let T1, T2, sides = {}, angs = {};
    if (kind === 'SSA') { const al = R.int(28, 40), c = 5, h = c * Math.sin(rad(al)), bx = c * Math.cos(rad(al)), off = R.int(9, Math.floor((bx - 1.9) * 10)) / 10; T1 = { A: [0, 0], B: polar(c, al), C: [bx + off, 0] }; T2 = { A: [0, 0], B: polar(c, al), C: [bx - off, 0] }; angs = { A: 1 }; sides = { AB: 1, BC: 2 }; }
    else { const rt = kind === 'HL' || kind === 'LL'; T1 = randTri(R, { right: rt }).t; T2 = kind === 'AAA' ? xform(T1, 0, false, R.pick([0.6, 0.65, 1.45, 1.55])) : T1;
      if (rt) angs.C = 'R';
      ({ SSS: () => { sides = { AB: 1, BC: 2, CA: 3 }; }, SAS: () => { sides = { AB: 1, AC: 2 }; angs.A = 1; }, ASA: () => { angs.A = 1; angs.B = 2; sides.AB = 1; }, AAS: () => { angs.A = 1; angs.B = 2; sides[R.pick(['BC', 'CA'])] = 1; },
        HL: () => { sides.AB = 1; sides[R.pick(['AC', 'BC'])] = 2; }, LL: () => { sides.AC = 1; sides.BC = 2; }, AAA: () => { angs.A = 1; angs.B = 2; angs.C = 3; } })[kind](); }
    const L = lets(R, 6), n1 = nameMap(L), n2 = nameMap(L.slice(3)), P = pairPts(R, T1, T2, n1, n2);
    return { vis: pairFig(P, n1, n2, [sides, angs], [sides, angs]), n1, n2, sides, angs, st: `△${L[0]}${L[1]}${L[2]} ≅ △${L[3]}${L[4]}${L[5]}` };
  };
  const PICK6 = ['SSS', 'SAS', 'ASA', 'AAS', 'HL', 'not enough information'];
  const KIND_EXPL = { SSS: 'three pairs of sides are marked, so SSS', SAS: 'two pairs of sides and the angles between them are marked, so SAS', LL: 'the two legs and the right angle between them are marked, so SAS',
    ASA: 'two pairs of angles and the sides between them are marked, so ASA', AAS: 'two pairs of angles and a pair of sides not between them are marked, so AAS', HL: 'right angles, the hypotenuses and one pair of legs are marked, so HL',
    SSA: 'marked angle is not between the marked sides (SSA). Two different triangles fit these marks, as the picture shows, so there is not enough information',
    AAA: 'marks are all on angles (AAA). The triangles have the same shape but different sizes, so there is not enough information' };
  const whichPost = (R, weights) => { const kind = (() => { let t = R.f() * weights.reduce((s, w) => s + w[1], 0); for (const [k, w] of weights) { t -= w; if (t < 0) return k; } return weights[0][0]; })();
    const mp = markPair(R, kind), ans = { SSS: 0, SAS: 1, LL: 1, ASA: 2, AAS: 3, HL: 4, SSA: 5, AAA: 5 }[kind];
    return E.choiceFixed('Which postulate proves the triangles congruent using only the marked parts?', PICK6, ans, `The ${KIND_EXPL[kind]}.`, { visual: mp.vis }); };

  /* ================= V.3.01 Classify triangles ================= */
  const SIDE3 = ['equilateral', 'isosceles (not equilateral)', 'scalene'], ANG3 = ['acute', 'right', 'obtuse'];
  const triGraph = (pts, names, ex) => {
    const xs = pts.map(p => p[0]).concat(0), ys = pts.map(p => p[1]).concat(0), S0 = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) + 2;
    const x0 = Math.min(...xs) - 1, y0 = Math.min(...ys) - 1;
    return V.graph({ x: [x0, x0 + S0], y: [y0, y0 + S0], w: 280, h: 280, ticks: 1, labels: false, param: [0, 1, 2].map(i => [pts[i], pts[(i + 1) % 3], C.blue]).concat(ex ? [[ex[0], ex[1], C.teal]] : []).map(([P, Q, col]) => ({ x: t => P[0] + (Q[0] - P[0]) * t, y: t => P[1] + (Q[1] - P[1]) * t, t: [0, 1], color: col })),
      points: pts.map((p, i) => [p[0], p[1], names[i]]).concat(ex ? [[ex[0][0], ex[0][1], 'M'], [ex[1][0], ex[1][1], 'N']] : []), label: 'triangle on a coordinate grid' });
  };
  const half = (R, lo, hi) => R.bool(0.2) ? R.int(lo, hi) + 0.5 : R.int(lo, hi);
  S('V.3.01', 'Classify triangles', {
    a: { t: 'by sides', g: R => {
      if (R.bool(0.3)) { const truth = R.bool(), s = R.int(3, 12); let p, q; do { p = R.int(3, 12); q = R.int(3, 12); } while (p === q || p >= 2 * q); const r = p + q - 1;
        const T = [['Every equilateral triangle is isosceles.', 'Isosceles means at least two equal sides, and an equilateral triangle has three.'],
          [`A triangle with sides ${s}, ${s} and ${s} is isosceles.`, 'It has at least two equal sides (in fact three), so it is isosceles as well as equilateral.'],
          [`A triangle with sides ${p}, ${q} and ${q} is isosceles.`, `Two sides are equal (${q} and ${q}).`], [`A triangle with sides ${p}, ${q} and ${r} is scalene.`, 'No two sides are equal.']];
        const F = [['Every isosceles triangle is equilateral.', 'Isosceles needs only two equal sides: 5, 5, 8 is isosceles but not equilateral.'],
          [`A triangle with sides ${s}, ${s} and ${s} is scalene.`, 'Scalene means no equal sides; this one has three.'],
          [`A triangle with sides ${p}, ${q} and ${q} is scalene.`, `Two sides are equal (${q} and ${q}), so it is isosceles, not scalene.`], [`A triangle with sides ${p}, ${q} and ${r} is isosceles.`, 'No two sides are equal, so it is scalene.']];
        const [st, why] = R.pick(truth ? T : F); return E.tf(`True or false? ${st}`, truth, why); }
      const type = R.int(0, 2); let L;
      if (type === 0) { const s = half(R, 3, 12); L = [s, s, s]; }
      else if (type === 1) { const s = R.int(4, 12); let b; do b = half(R, Math.ceil(s * 0.5), Math.floor(s * 1.6)); while (b === s); L = R.shuffle([s, s, b]); }
      else { do L = [half(R, 3, 12), half(R, 3, 12), half(R, 3, 12)]; while (new Set(L).size < 3 || Math.max(...L) * 2 >= L[0] + L[1] + L[2] - 1 || Math.min(...L) < Math.max(...L) * 0.35); }
      const n = nameMap(trio(R)), t = spin(R, bySides(L[0], L[1], L[2])), P = renamePts(t, n), eq = (x, y) => x === y ? 1 : 0;
      const tk = { BC: L[0] === L[1] || L[0] === L[2] ? 1 : 0, CA: L[1] === L[0] || L[1] === L[2] ? 1 : 0, AB: L[2] === L[0] || L[2] === L[1] ? 1 : 0 };
      const m = triMarks(n, tk, {}, { BC: String(L[0]), CA: String(L[1]), AB: String(L[2]) });
      return E.choiceFixed('What is the most specific name for this triangle by its sides?', SIDE3, type,
        ['All three sides are equal, so it is equilateral. (It is also isosceles, but equilateral says more.)', `Exactly two sides are equal, so it is isosceles.`, 'No two sides are equal, so it is scalene.'][type], { visual: fig({ pts: P, segs: m.segs, label: 'triangle with side lengths' }) }); } },
    b: { t: 'by angles', g: R => { const type = R.int(0, 2); let an;
      do { if (type === 0) an = [R.int(40, 85), R.int(40, 85)]; else if (type === 1) { const a = R.int(20, 70); an = [90, a]; } else { an = [R.int(100, 140), R.int(15, 50)]; } an.push(180 - an[0] - an[1]); }
      while (an[2] <= 0 || (type === 0 && an[2] >= 90) || an.some(x => x < 12) || (type === 2 && an[2] >= 90));
      an = R.shuffle(an); const hideI = type > 0 && R.bool(0.65) ? an.findIndex(x => x >= 90) : R.int(0, 2);
      const n = nameMap(trio(R)), P = renamePts(spin(R, byAngles(an[1], an[2])), n), labs = {}, am = {};
      'ABC'.split('').forEach((k, i) => { if (i === hideI) return; if (an[i] === 90) am[k] = 'R'; else labs[k] = deg(an[i]); });
      const m = triMarks(n, {}, am, labs), gv = an.filter((_, i) => i !== hideI);
      return E.choiceFixed(`Two angles of △${n.A}${n.B}${n.C} are marked. Classify the triangle by its angles.`, ANG3, type,
        `The third angle is 180° − ${gv[0]}° − ${gv[1]}° = ${an[hideI]}°. ${['All three angles are less than 90°, so it is acute' + (an.every(x => x === 60) ? ' (in fact equiangular)' : ''), 'One angle is exactly 90°, so it is right', 'One angle is more than 90°, so it is obtuse'][type]}.`, { visual: fig({ pts: P, ...m, label: 'triangle with two angles marked' }) }); } },
    c: { t: 'both at once', g: R => {
      const TYPES = ['equilateral (equiangular)', 'acute isosceles', 'right isosceles', 'obtuse isosceles', 'acute scalene', 'right scalene', 'obtuse scalene'], k = R.int(0, 6);
      let an, ticks = {}, am = {}, labs = {};
      if (k === 0) { an = [60, 60, 60]; ticks = { AB: 1, BC: 1, CA: 1 }; }
      else if (k <= 3) { let b; if (k === 1) do b = R.int(50, 80); while (b === 60); else if (k === 2) b = 45; else b = R.int(15, 40); an = [180 - 2 * b, b, b]; ticks = { AB: 1, AC: 1 };
        if (k === 2) am.A = 'R'; else if (R.bool()) labs.A = deg(an[0]); else labs[R.pick(['B', 'C'])] = deg(b); }
      else { do { an = k === 5 ? [90, R.int(20, 70)] : k === 6 ? [R.int(100, 135), R.int(15, 50)] : [R.int(42, 85), R.int(42, 85)]; an.push(180 - an[0] - an[1]); an = R.shuffle(an); }
        while (an.some(x => x < 14) || (k === 4 && an.some(x => x >= 90)) || (k === 6 && an.filter(x => x >= 90).length !== 1) || Math.abs(an[0] - an[1]) < 8 || Math.abs(an[1] - an[2]) < 8 || Math.abs(an[0] - an[2]) < 8);
        const hideI = R.int(0, 2); 'ABC'.split('').forEach((q, i) => { if (i === hideI) return; if (an[i] === 90) am[q] = 'R'; else labs[q] = deg(an[i]); }); }
      const n = nameMap(trio(R)), P = renamePts(spin(R, byAngles(an[1], an[2])), n), m = triMarks(n, ticks, am, labs);
      const why = k === 0 ? 'All three sides are marked equal, so it is equilateral, and every angle is 60°.' :
        `${k <= 3 ? 'Two sides are marked equal, so it is isosceles' : `The angles are ${an.join('°, ')}°, all different, so no two sides are equal: scalene`}. ${k <= 3 ? `Its angles are ${an[0]}°, ${an[1]}° and ${an[2]}°` : 'The largest angle is ' + Math.max(...an) + '°'}, so it is ${k === 1 || k === 4 ? 'acute' : k === 2 || k === 5 ? 'right' : 'obtuse'}.`;
      const near = TYPES.filter((x, i) => i !== k).sort((x, y) => (y.split(' ').some(w => TYPES[k].includes(w)) ? 1 : 0) - (x.split(' ').some(w => TYPES[k].includes(w)) ? 1 : 0));
      return E.choice(R, 'Classify the triangle by its sides and by its angles.', TYPES[k], R.shuffle(near.slice(0, 4)).slice(0, 3), why, { visual: fig({ pts: P, ...m, label: 'triangle with marks' }) }); } },
    d: { t: 'on the coordinate plane', g: R => {
      const NAMES = ['right isosceles', 'acute isosceles', 'obtuse isosceles', 'right scalene', 'acute scalene', 'obtuse scalene'], k = R.int(0, 5);
      const d2 = (P, Q) => (P[0] - Q[0]) ** 2 + (P[1] - Q[1]) ** 2;
      const classify = T => { const s = [d2(T[1], T[2]), d2(T[0], T[2]), d2(T[0], T[1])], so = s.slice().sort((a, b) => a - b); if (so[0] + so[1] === 0) return null;
        const iso = s[0] === s[1] || s[1] === s[2] || s[0] === s[2], ang = so[0] + so[1] === so[2] ? 'right' : so[0] + so[1] > so[2] ? 'acute' : 'obtuse'; return `${ang} ${iso ? 'isosceles' : 'scalene'}`; };
      let T;
      for (;;) { const x0 = R.int(-3, 3), y0 = R.int(-3, 3);
        if (k < 3) { const p = R.int(-3, 3), q = R.int(-3, 3), kk = k === 0 ? R.pick([1, -1]) : k === 1 ? R.pick([2, -2]) : R.pick([0.5, -0.5]); T = [[x0 - p, y0 - q], [x0 + p, y0 + q], [x0 - kk * q, y0 + kk * p]]; }
        else if (k === 3) { const a = R.int(-3, 3), b = R.int(-3, 3), mm = R.pick([2, -2, 3]); T = [[x0, y0], [x0 + a, y0 + b], [x0 - mm * b, y0 + mm * a]]; }
        else T = [[R.int(-5, 5), R.int(-5, 5)], [R.int(-5, 5), R.int(-5, 5)], [R.int(-5, 5), R.int(-5, 5)]];
        const area2 = Math.abs((T[1][0] - T[0][0]) * (T[2][1] - T[0][1]) - (T[2][0] - T[0][0]) * (T[1][1] - T[0][1]));
        if (T.flat().some(v => !Number.isInteger(v) || Math.abs(v) > 6) || area2 < 6 || classify(T) !== NAMES[k]) continue;
        if (T.some((P, i) => T.some((Q, j) => i < j && d2(P, Q) < 5))) continue; break; }
      T = R.shuffle(T); const nm = trio(R), s = [d2(T[0], T[1]), d2(T[1], T[2]), d2(T[2], T[0])], lab = [nm[0] + nm[1], nm[1] + nm[2], nm[2] + nm[0]], so = s.slice().sort((a, b) => a - b);
      const eqPair = s.findIndex((v, i) => s.some((w, j) => j !== i && w === v));
      const why = `${lab.map((l, i) => `${l}² = ${s[i]}`).join(', ')}. ${eqPair >= 0 ? `Two of these are equal, so it is isosceles` : 'No two are equal, so it is scalene'}. The largest, ${so[2]}, is ${so[0] + so[1] === so[2] ? 'equal to' : so[0] + so[1] > so[2] ? 'less than' : 'more than'} ${so[0]} + ${so[1]} = ${so[0] + so[1]}, so the triangle is ${NAMES[k].split(' ')[0]}.`;
      return E.choice(R, `Classify △${nm.join('')} with ${nm.map((c, i) => `${c}(${T[i][0]}, ${T[i][1]})`).join(', ')} by its sides and by its angles.`, NAMES[k], R.sample(NAMES.filter((_, i) => i !== k), 3), why, { visual: triGraph(T, nm) }); } },
  });

  /* ================= V.3.02 Triangle sum proof ================= */
  const TPOOL = ['vertical angles', 'alternate interior angles', 'corresponding angles', 'same-side interior angles', 'angles on a straight line', 'substitution', 'triangle sum theorem', 'parallel postulate', 'reflexive property'];
  // triangle ABC with line DE through A parallel to BC (D on B's side)
  const sumPts = (Bv, Cv) => { const t = byAngles(Bv, Cv, 5), u = unit(sub(t.C, t.B)), L = 2.2; return { ...t, D: sub(t.A, mul(u, L)), E: add(t.A, mul(u, L)) }; };
  const sumCfg = R => { let Bv, Cv; do { Bv = R.int(35, 80); Cv = R.int(35, 80); } while (180 - Bv - Cv < 30);
    return { pts: sumPts(Bv, Cv), segs: [['A', 'B'], ['B', 'C'], ['C', 'A'], ['D', 'E']], arrows: [['D', 'E', 1, 0.2], ['B', 'C', 1]], pool: TPOOL, given: '△ABC', prove: '∠BAC + ∠B + ∠C = 180°',
      lines: [['Draw DE through A, parallel to BC', 'parallel postulate'], ['∠DAB = ∠B', 'alternate interior angles', [0]], ['∠EAC = ∠C', 'alternate interior angles', [0]], ['∠DAB + ∠BAC + ∠EAC = 180°', 'angles on a straight line', [0]], ['∠B + ∠BAC + ∠C = 180°', 'substitution', [1, 2, 3]]], label: 'triangle with a parallel line through a vertex' }; };
  S('V.3.02', 'Triangle sum proof', {
    a: { t: 'draw the parallel line', g: R => { const n = trio(R), i = R.int(0, 2), v = n[i], o1 = n[(i + 1) % 3], o2 = n[(i + 2) % 3], opp = o1 + o2;
      const t = randTri(R).t, keys = ['A', 'B', 'C'], map = { A: n[0], B: n[1], C: n[2] };
      if (R.bool(0.6)) { const P = renamePts(spin(R, t), map);
        return E.choice(R, `To prove that the angles of △${n.join('')} add to 180°, which extra line should you draw?`, `the line through ${v} parallel to ${opp}`,
          [`the line through ${v} perpendicular to ${opp}`, `the bisector of ∠${v}`, `the line through the midpoint of ${v}${o1} parallel to ${opp}`], `A parallel through one vertex to the opposite side puts copies of the other two angles at that vertex, side by side with ∠${v}, along a straight line.`,
          { visual: fig({ pts: P, segs: [[n[0], n[1]], [n[1], n[2]], [n[2], n[0]]], label: 'triangle' }) }); }
      const k = keys[i], ko = keys.filter(x => x !== k), u = unit(sub(t[ko[1]], t[ko[0]])), P0 = { ...t, _d: sub(t[k], mul(u, 2.2)), _e: add(t[k], mul(u, 2.2)) }, P = renamePts(spin(R, P0), map);
      return E.choice(R, `The dashed line through ${v} is parallel to ${opp}. Why does it help prove that the angles of the triangle add to 180°?`, `It makes angles equal to ∠${o1} and ∠${o2} at ${v}, next to ∠${v}, along a straight line.`,
        [`It splits ∠${v} into two equal angles.`, `It makes a right angle with ${opp}.`, `It cuts ${opp} into two equal parts.`], `Alternate interior angles copy ∠${o1} and ∠${o2} to the vertex ${v}. With ∠${v} they fill a straight angle, 180°.`,
        { visual: fig({ pts: P, segs: [[n[0], n[1]], [n[1], n[2]], [n[2], n[0]], ['_d', '_e', { dash: true }]], arrows: [['_d', '_e', 1, 0.15], [map[ko[0]], map[ko[1]], 1]], label: 'triangle with a dashed parallel line' }) }); } },
    b: { t: 'use alternate interior angles', g: R => { let Bv, Cv; do { Bv = R.int(35, 80); Cv = R.int(35, 80); } while (180 - Bv - Cv < 32);
      const L = lets(R, 5), map = { A: L[0], B: L[1], C: L[2], D: L[3], E: L[4] }, P = renamePts(spin(R, sumPts(Bv, Cv)), map), [a, b, c, d, e] = L;
      const vis = fig({ pts: P, segs: [[a, b], [b, c], [c, a], [d, e]], arrows: [[d, e, 1, 0.15], [b, c, 1]], angles: [[d, a, b, '1'], [b, a, c, '2'], [c, a, e, '3'], [a, b, c, deg(Bv)], [a, c, b, deg(Cv)]], label: 'triangle with a parallel line through a vertex' });
      if (R.bool(0.35)) { const one = R.bool(); return E.choice(R, `Line ${d}${e} passes through ${a} and is parallel to ${b}${c}. Why is ∠${one ? 1 : 3} = ∠${one ? b : c}?`, 'alternate interior angles', ['corresponding angles', 'vertical angles', 'same-side interior angles'],
        `${one ? a + b : a + c} is a transversal of the parallel lines, and ∠${one ? 1 : 3} and ∠${one ? b : c} sit on opposite sides of it, between the parallels: alternate interior angles are equal.`, { visual: vis }); }
      const ask = R.int(1, 3), ans = [Bv, 180 - Bv - Cv, Cv][ask - 1];
      return E.num(`Line ${d}${e} passes through ${a} and is parallel to ${b}${c}. Find ∠${ask}.`, [{ label: `∠${ask} =`, ans }],
        ask === 2 ? `Alternate interior angles give ∠1 = ${Bv}° and ∠3 = ${Cv}°. Angles 1, 2 and 3 make a straight line, so ∠2 = 180° − ${Bv}° − ${Cv}° = ${ans}°.` : `∠${ask} and ∠${ask === 1 ? b : c} are alternate interior angles, so ∠${ask} = ${ans}°.`, { visual: vis }); } },
    c: { t: 'write the proof', g: R => proofQ(R, sumCfg(R), R.pick(['order', 'order', 'reason', 'broken'])) },
    d: { t: 'corollaries', g: R => { const n = trio(R), kind = R.int(0, 2);
      if (kind === 0) { const a = R.int(15, 75), rt = R.int(0, 2), ks = 'ABC'.split(''), oth = ks.filter(q => q !== ks[rt]), an = {}; an[ks[rt]] = 90; an[oth[0]] = a; an[oth[1]] = 90 - a;
        const t = byAngles(an.B, an.C), P = renamePts(spin(R, t), nameMap(n)), m = triMarks(nameMap(n), {}, { [ks[rt]]: 'R' }, { [oth[0]]: deg(a) });
        return E.num(`In right △${n.join('')}, ∠${n[ks.indexOf(oth[0])]} = ${a}°. Find ∠${n[ks.indexOf(oth[1])]}.`, [{ ans: 90 - a }], `The acute angles of a right triangle add to 90°: 90° − ${a}° = ${90 - a}°.`, { visual: fig({ pts: P, ...m }) }); }
      if (kind === 1) { let p, q, r; do { [p, q, r] = [R.int(1, 7), R.int(1, 7), R.int(1, 7)]; } while (180 % (p + q + r) || new Set([p, q, r]).size < 3 || Math.max(p, q, r) * 180 / (p + q + r) >= 150 || Math.min(p, q, r) * 180 / (p + q + r) < 12);
        const k = 180 / (p + q + r), big = R.bool(), ans = (big ? Math.max(p, q, r) : Math.min(p, q, r)) * k, labs = { A: `${p === 1 ? '' : p}x`, B: `${q === 1 ? '' : q}x`, C: `${r === 1 ? '' : r}x` };
        const P = renamePts(spin(R, byAngles(q * k, r * k)), nameMap(n)), m = triMarks(nameMap(n), {}, {}, { A: labs.A + '°', B: labs.B + '°', C: labs.C + '°' });
        return E.num(`The angles of the triangle are ${M(labs.A)}°, ${M(labs.B)}° and ${M(labs.C)}°. Find the ${big ? 'largest' : 'smallest'} angle.`, [{ ans }],
          `${p + q + r}x = 180, so x = ${k} and the ${big ? 'largest' : 'smallest'} angle is ${big ? Math.max(p, q, r) : Math.min(p, q, r)} × ${k} = ${ans}°.`, { visual: fig({ pts: P, ...m, label: 'triangle with angles in terms of x' }) }); }
      let x, d, c3; do { x = R.int(20, 70); d = R.int(-25, 40); c3 = 180 - 2 * x - d; } while (d === 0 || x + d < 15 || c3 < 15 || c3 === x || c3 === x + d);
      const P = renamePts(spin(R, byAngles(x + d, c3)), nameMap(n)), m = triMarks(nameMap(n), {}, {}, { A: 'x°', B: `(x ${d > 0 ? '+' : '−'} ${Math.abs(d)})°`, C: deg(c3) });
      return E.num(`Find x.`, [{ label: 'x =', ans: x }], `x + (${linM(1, d)}) + ${c3} = 180, so 2x ${d > 0 ? '+' : '−'} ${Math.abs(d)} = ${180 - c3} and x = ${x}.`, { visual: fig({ pts: P, ...m, label: 'triangle with angle expressions' }) }); } },
    e: { t: 'angle chase: draw your own parallel', g: R => { let a, b; do { a = R.int(20, 70); b = R.int(20, 70); } while (a + b < 60 || a + b > 140 || a === b);
      const d1 = R.int(25, 34) / 10, d2 = R.int(25, 34) / 10, A = polar(d1, 180 - a), B = polar(d2, 180 + b), xr = 1.1, xl = Math.min(A[0], B[0]) - 1;
      const pts = { A, B, P: [0, 0], _l1: [xl, A[1]], _l2: [xr, A[1]], _m1: [xl, B[1]], _m2: [xr, B[1]], _tl: [xr + 0.35, A[1]], _tm: [xr + 0.35, B[1]] };
      const L = lets(R, 3), map = { A: L[0], B: L[1], P: L[2] }, Q = renamePts(spin(R, pts), map), back = R.bool(0.35);
      const vis = fig({ pts: Q, segs: [['_l1', '_l2'], ['_m1', '_m2'], [L[0], L[2]], [L[1], L[2]]], arrows: [['_l1', '_l2', 1, 0.25], ['_m1', '_m2', 1, 0.25]],
        angles: [['_l2', L[0], L[2], deg(a)], ['_m2', L[1], L[2], back ? 'y°' : deg(b)], [L[0], L[2], L[1], back ? deg(a + b) : 'x°']], text: [[Q._tl, 'ℓ', { size: 15, weight: 700 }], [Q._tm, 'm', { size: 15, weight: 700 }]], label: 'two parallel lines with a bent path between them' });
      if (back) return E.num(`Lines ℓ and m are parallel. Find y.`, [{ label: 'y =', ans: b }], `Draw a line through ${L[2]} parallel to ℓ. It splits the ${a + b}° angle into ${a}° (alternate interior with ℓ) and y° (alternate interior with m), so y = ${a + b} − ${a} = ${b}.`, { visual: vis });
      return E.num(`Lines ℓ and m are parallel. Find x.`, [{ label: 'x =', ans: a + b }], `Draw a line through ${L[2]} parallel to ℓ (and so to m). It splits x° into two alternate interior angles, ${a}° and ${b}°, so x = ${a} + ${b} = ${a + b}.`, { visual: vis }); } },
    f: { t: 'the five points of a star', g: R => { let th; do { th = [0, 1, 2, 3].map(() => 2 * R.int(27, 46)); th.push(360 - th.reduce((s, v) => s + v, 0)); } while (th[4] < 54 || th[4] > 92);
      const st = R.int(0, 71) * 5, ph = [st]; for (let i = 0; i < 4; i++) ph.push(ph[i] + th[i]);
      const pts = {}; ph.forEach((p, i) => pts['_' + i] = polar(3, p)); const tip = i => th[(i + 2) % 5] / 2, miss = R.int(0, 4);
      const segs = [0, 1, 2, 3, 4].map(i => ['_' + i, '_' + ((i + 2) % 5)]);
      const angles = [0, 1, 2, 3, 4].map(i => ['_' + ((i + 2) % 5), '_' + i, '_' + ((i + 3) % 5), i === miss ? 'x°' : deg(tip(i)), { max: 54 }]);
      const given = [0, 1, 2, 3, 4].filter(i => i !== miss).map(tip), ans = tip(miss);
      return E.num('Find x, the angle at the fifth point of the star.', [{ label: 'x =', ans }], `The five point angles of any five-pointed star add to 180°: by the exterior angle theorem, two pairs of points add up to two angles of one triangle whose third angle is the fifth point. So x = 180 − ${given.join(' − ')} = ${ans}.`,
        { visual: fig({ pts: xform(pts, 0, R.bool()), segs, angles, w: 290, label: 'five-pointed star' }) }); } },
  });

  /* ================= V.3.03 Exterior angle theorem ================= */
  const extPts = (Bv, Cv) => { const t = byAngles(Bv, Cv, 5); return { ...t, D: add(t.C, mul(unit(sub(t.C, t.B)), 2.6)) }; };
  const EPOOL = ['linear pair', 'triangle sum theorem', 'substitution', 'subtraction property', 'vertical angles', 'alternate interior angles', 'reflexive property', 'exterior angle theorem'];
  const extFig = (R, Bv, Cv, labs) => { const L = lets(R, 4), map = { A: L[0], B: L[1], C: L[2], D: L[3] }, P = renamePts(spin(R, extPts(Bv, Cv)), map), [a, b, c, d] = L;
    return { L, vis: fig({ pts: P, segs: [[a, b], [a, c], [b, c], [c, d]], angles: [labs.A && [b, a, c, labs.A], labs.B && [a, b, c, labs.B], labs.D && [a, c, d, labs.D]].filter(Boolean), label: 'triangle with one side extended' }) }; };
  S('V.3.03', 'Exterior angle theorem', {
    a: { t: 'remote interior angles', g: R => { let Av, Bv; do { Av = R.int(30, 95); Bv = R.int(25, 80); } while (Av + Bv > 150 || Av + Bv < 60);
      const Cv = 180 - Av - Bv, kind = R.int(0, 2);
      if (kind === 0) { const { L, vis } = extFig(R, Bv, Cv, { D: ' ' }), [a, b, c, d] = L;
        return E.choice(R, `∠${a}${c}${d} is an exterior angle of △${a}${b}${c}. Which are its remote interior angles?`, `∠${a} and ∠${b}`, [`∠${a} and ∠${a}${c}${b}`, `∠${b} and ∠${a}${c}${b}`, `∠${a}${c}${b} only`],
          `The remote interior angles are the two angles of the triangle that are not next to the exterior angle: ∠${a} and ∠${b}. ∠${a}${c}${b} is its neighbor; together they make 180°.`, { visual: vis }); }
      if (kind === 1) { const { L, vis } = extFig(R, Bv, Cv, { A: deg(Av), B: deg(Bv), D: 'x°' }), [a, b, c, d] = L;
        return E.num(`Find x.`, [{ label: 'x =', ans: Av + Bv }], `An exterior angle equals the sum of the two remote interior angles: x = ${Av} + ${Bv} = ${Av + Bv}.`, { visual: vis }); }
      const { L, vis } = extFig(R, Bv, Cv, { A: 'x°', B: deg(Bv), D: deg(Av + Bv) });
      return E.num(`Find x.`, [{ label: 'x =', ans: Av }], `The exterior angle is the sum of the remote interior angles: x + ${Bv} = ${Av + Bv}, so x = ${Av}.`, { visual: vis }); } },
    b: { t: 'prove it', g: R => { let Bv, Cv; do { Bv = R.int(30, 70); Cv = R.int(40, 85); } while (180 - Bv - Cv < 35);
      return proofQ(R, { pts: extPts(Bv, Cv), segs: [['A', 'B'], ['A', 'C'], ['B', 'C'], ['C', 'D']], angles: [['A', 'C', 'D', '', { n: 1 }]], pool: EPOOL, given: '△ABC with BC extended to D', prove: '∠ACD = ∠A + ∠B',
        lines: [['∠ACB + ∠ACD = 180°', 'linear pair'], ['∠A + ∠B + ∠ACB = 180°', 'triangle sum theorem'], ['∠A + ∠B + ∠ACB = ∠ACB + ∠ACD', 'substitution', [0, 1]], ['∠A + ∠B = ∠ACD', 'subtraction property', [2]]], label: 'triangle with one side extended' }, R.pick(['order', 'order', 'reason', 'reason', 'broken'])); } },
    c: { t: 'solve for x', g: R => { let x, a, b, c, dd, p, q, Av, Bv;
      do { x = R.int(6, 30); a = R.pick([1, 2, 3]); Av = R.int(25, 90); b = Av - a * x; const plain = R.bool(0.35); c = plain ? 0 : R.pick([1, 2]); Bv = plain ? R.int(25, 80) : R.int(25, 80); dd = Bv - c * x; p = R.pick([2, 3, 4, 5]); q = Av + Bv - p * x; }
      while (p === a + c || Av + Bv > 160 || Av + Bv < 60 || Math.abs(b) > 60 || Math.abs(dd) > 60 || Math.abs(q) > 90 || (c === 0 && dd !== Bv));
      const { vis } = extFig(R, Bv, 180 - Av - Bv, { A: angLab(a, b), B: c ? angLab(c, dd) : deg(Bv), D: angLab(p, q) }), askAng = R.bool(0.35);
      const lhs = linM(p, q), rhs = c ? `${linM(a + c, b + dd)}` : linM(a, b + Bv);
      return E.num(askAng ? 'Find the size of the exterior angle.' : 'Find x.', [askAng ? { label: 'exterior angle =', ans: Av + Bv } : { label: 'x =', ans: x }],
        `Exterior angle = sum of the remote interior angles: ${M(lhs + '=' + rhs)}, so x = ${x}.${askAng ? ` The exterior angle is ${p}(${x}) ${q < 0 ? '−' : '+'} ${Math.abs(q)} = ${Av + Bv}°.` : ''}`, { visual: vis }); } },
    d: { t: 'exterior angle inequality', g: R => { let Av, Bv; do { Av = R.int(25, 95); Bv = R.int(25, 90); } while (Av + Bv > 160 || Av + Bv < 70);
      const Ext = Av + Bv, { L, vis } = extFig(R, Bv, 180 - Ext, { D: deg(Ext) }), [a, b, c, d] = L;
      if (R.bool(0.4)) return E.choice(R, `∠${a}${c}${d} is an exterior angle of △${a}${b}${c}. Which statement must be true?`, `∠${a}${c}${d} > ∠${b}`, [`∠${a}${c}${d} > ∠${a}${c}${b}`, `∠${a}${c}${d} < ∠${a}`, `∠${a} > ∠${b}`],
        `∠${a}${c}${d} = ∠${a} + ∠${b}, and both of those are positive, so it is bigger than each remote interior angle. It need not be bigger than its neighbor ∠${a}${c}${b}.`, { visual: vis });
      const ok = R.bool(), N = ok ? R.int(10, Ext - 5) : R.int(Ext, Ext + 25);
      return E.tf(`∠${a}${c}${d} is an exterior angle of △${a}${b}${c}. Could ∠${R.bool() ? a : b} measure ${N}°?`, ok, ok ? `Yes: it only has to be less than the exterior angle, ${Ext}°, and ${N} < ${Ext}. The other remote angle would be ${Ext - N}°.` : `No: an exterior angle is greater than each remote interior angle, so that angle must be less than ${Ext}°, but ${N} ≥ ${Ext}.`, { choices: ['Yes', 'No'], visual: vis }); } },
  });

  /* ================= shared: pairs of triangles ================= */
  const sdn = (n, s) => n[s[0]] + n[s[1]];                                  // side name
  const agn = (n, k) => { const [p, q] = 'ABC'.replace(k, '').split(''); return `∠${n[p]}${n[k]}${n[q]}`; };   // angle name, three letters
  const pairOf = (R, T1, T2, m1, m2) => { const L = lets(R, 6), n1 = nameMap(L), n2 = nameMap(L.slice(3)), P = pairPts(R, T1, T2 || T1, n1, n2);
    return { L, n1, n2, vis: pairFig(P, n1, n2, m1 || [{}, {}, {}], m2 || m1 || [{}, {}, {}]) }; };
  const intSides = R => { let L; do L = [R.int(4, 13), R.int(4, 13), R.int(4, 13)]; while (new Set(L).size < 3 || Math.max(...L) * 2 >= L[0] + L[1] + L[2] - 1 || Math.min(...L) < Math.max(...L) * 0.4); return L; };
  const sideLabs = L => ({ BC: String(L[0]), CA: String(L[1]), AB: String(L[2]) });   // bySides(a=BC, b=CA, c=AB)

  /* ================= V.3.04 Congruent figures ================= */
  // a short proof of the third angles theorem: two triangles side by side, two pairs of angles marked
  const thirdCfg = R => { const t = randTri(R).t, k = R.pick([0.62, 0.7, 0.8]), t2 = xform(t, rad(R.int(-20, 20)), false, k), pts = { A: t.A, B: t.B, C: t.C };
    const bx = o => { const v = Object.values(o), xs = v.map(p => p[0]), ys = v.map(p => p[1]); return [Math.min(...xs), Math.max(...xs), (Math.min(...ys) + Math.max(...ys)) / 2]; }, b1 = bx(t), b2 = bx(t2), dx = b1[1] + 2.2 - b2[0], dy = b1[2] - b2[2];
    Object.entries(t2).forEach(([kk, p]) => { pts[{ A: 'D', B: 'E', C: 'F' }[kk]] = [p[0] + dx, p[1] + dy]; });
    const tw = ['third angles theorem', circ()];
    return { pts, segs: [['A', 'B'], ['B', 'C'], ['C', 'A'], ['D', 'E'], ['E', 'F'], ['F', 'D']], angles: [['B', 'A', 'C', '', { n: 1 }], ['E', 'D', 'F', '', { n: 1 }], ['A', 'B', 'C', '', { n: 2 }], ['D', 'E', 'F', '', { n: 2 }]],
      note: 'Prove the third angles theorem.', label: 'two triangles with two pairs of angles marked', w: 320,
      pool: ['triangle sum theorem', 'substitution', 'subtraction property', 'definition of congruent angles', 'third angles theorem', 'vertical angles', 'reflexive property', 'exterior angle theorem'],
      wrong: { 'triangle sum theorem': [tw, ['linear pair']], substitution: [tw, ['subtraction property']], 'subtraction property': [tw, ['triangle sum theorem']], 'definition of congruent angles': [tw, ['reflexive property']] },
      lines: [['∠A ≅ ∠D', 'given'], ['∠B ≅ ∠E', 'given'], ['∠A + ∠B + ∠C = 180°', 'triangle sum theorem'], ['∠D + ∠E + ∠F = 180°', 'triangle sum theorem'],
        ['∠D + ∠E + ∠C = ∠D + ∠E + ∠F', 'substitution', [0, 1, 2, 3]], ['∠C = ∠F', 'subtraction property', [4]], ['∠C ≅ ∠F', 'definition of congruent angles', [5]]] }; };
  S('V.3.04', 'Congruent figures', {
    a: { t: 'corresponding parts', g: R => { const T = randTri(R).t, { L, vis } = pairOf(R, T), p = R.shuffle([0, 1, 2]), s1 = p.map(i => L[i]), s2 = p.map(i => L[3 + i]), st = `△${s1.join('')} ≅ △${s2.join('')}`;
      if (R.bool()) { const i = R.int(0, 2), j = (i + 1) % 3, k = (i + 2) % 3;
        return E.choice(R, `${st}. Which side corresponds to ${s1[i]}${s1[j]}?`, s2[i] + s2[j], [s2[j] + s2[k], s2[i] + s2[k]], `Letters in the same positions match: ${s1[i]}↔${s2[i]} and ${s1[j]}↔${s2[j]}, so ${s1[i]}${s1[j]} corresponds to ${s2[i]}${s2[j]}, however the picture is turned.`, { visual: vis }); }
      const i = R.int(0, 2);
      return E.choice(R, `${st}. Which angle is congruent to ∠${s1[i]}?`, `∠${s2[i]}`, [0, 1, 2].filter(j => j !== i).map(j => `∠${s2[j]}`), `${s1[i]} is letter ${i + 1} of the first name and ${s2[i]} is letter ${i + 1} of the second, so ∠${s1[i]} ≅ ∠${s2[i]}.`, { visual: vis }); } },
    b: { t: 'congruence statements', g: R => { const T = randTri(R).t, mk = [{ AB: 1, BC: 2, CA: 3 }, { A: 1, B: 2, C: 3 }], { L, vis } = pairOf(R, T, T, mk), p = R.shuffle([0, 1, 2]);
      const nm = q => `△${p.map(i => L[i]).join('')} ≅ △${p.map(i => L[3 + q[i]]).join('')}`, right = nm([0, 1, 2]);
      return E.choice(R, 'The marks show which parts are congruent. Which congruence statement is correct?', right, R.sample(PERMS, 3).map(nm),
        `Match vertices by their angle marks: ${[0, 1, 2].map(i => L[i] + '↔' + L[3 + i]).join(', ')}. Written in that order: ${right}.`, { visual: vis }); } },
    c: { t: 'order of letters matters', g: R => { const p = R.shuffle([0, 1, 2]);
      if (R.bool(0.3)) { const L = lets(R, 6), truth = R.bool(); let q; do q = R.shuffle([0, 1, 2]); while (q.join() === '0,1,2'); let q2 = q; if (!truth) do q2 = R.shuffle([0, 1, 2]); while (q2.join() === q.join());
        const s = `△${L.slice(0, 3).join('')} ≅ △${L.slice(3).join('')}`, t = `△${q.map(i => L[i]).join('')} ≅ △${q2.map(i => L[3 + i]).join('')}`;
        const j = [0, 1, 2].find(z => q[z] !== q2[z]);
        return E.tf(`${s}. Does it follow that ${t}?`, truth, truth ? `Both names were reordered the same way, so every vertex still sits opposite its partner.` : `The second statement pairs ${L[q[j]]} with ${L[3 + q2[j]]}, but in ${s} the partner of ${L[q[j]]} is ${L[3 + q[j]]}.`, { choices: ['Yes', 'No'] }); }
      if (R.bool()) { const S3 = intSides(R), T = bySides(...S3), i = R.int(0, 2), j = (i + 1) % 3, key = ['A', 'B', 'C'];
        const lab1 = sideLabs(S3), sk = key[p[i]] + key[p[j]], lab2 = { [sk]: '?' };
        const { L, vis } = pairOf(R, T, T, [{}, {}, lab1], [{}, {}, lab2]), s1 = p.map(k => L[k]), s2 = p.map(k => L[3 + k]), val = lab1[sk] ?? lab1[sk[1] + sk[0]];
        return E.num(`△${s1.join('')} ≅ △${s2.join('')}. Find ${s2[i]}${s2[j]}.`, [{ label: `${s2[i]}${s2[j]} =`, ans: +val }], `${s2[i]}${s2[j]} sits in the same letter positions as ${s1[i]}${s1[j]}, so ${s2[i]}${s2[j]} = ${s1[i]}${s1[j]} = ${val}.`, { visual: vis }); }
      const t = randTri(R), an = { A: t.A, B: t.B, C: t.C }, i = R.int(0, 2), key = ['A', 'B', 'C'][p[i]];
      const { L, vis } = pairOf(R, t.t, t.t, [{}, {}, { A: deg(an.A), B: deg(an.B), C: deg(an.C) }], [{}, {}, { [key]: '?' }]), s1 = p.map(k => L[k]), s2 = p.map(k => L[3 + k]);
      return E.num(`△${s1.join('')} ≅ △${s2.join('')}. Find ∠${s2[i]}.`, [{ label: `∠${s2[i]} =`, ans: an[key] }], `∠${s2[i]} corresponds to ∠${s1[i]} (same letter position), so ∠${s2[i]} = ${an[key]}°.`, { visual: vis }); } },
    d: { t: 'third angles theorem', g: R => { if (R.bool(0.4)) return proofQ(R, thirdCfg(R), R.pick(['order', 'order', 'reason', 'broken']));
      const t = randTri(R), k = R.pick([0.6, 0.65, 0.72]), T2 = xform(t.t, 0, false, k), alg = R.bool(0.45);
      let x, a, b; if (alg) do { x = R.int(5, 30); a = R.pick([2, 3, 4, 5]); b = t.C - a * x; } while (Math.abs(b) > 60 || b === 0);
      const { L, vis } = pairOf(R, t.t, T2, [{}, { A: 1, B: 2 }, { A: deg(t.A), B: deg(t.B) }], [{}, { A: 1, B: 2 }, { C: alg ? angLab(a, b) : '?' }]);
      const pre = `∠${L[0]} ≅ ∠${L[3]} and ∠${L[1]} ≅ ∠${L[4]}.`;
      if (alg) return E.num(`${pre} Find x.`, [{ label: 'x =', ans: x }], `∠${L[2]} = 180° − ${t.A}° − ${t.B}° = ${t.C}°. By the third angles theorem ∠${L[5]} = ∠${L[2]}, so ${M(linM(a, b) + '=' + t.C)} and x = ${x}.`, { visual: vis });
      return E.num(`${pre} Find ∠${L[5]}.`, [{ label: `∠${L[5]} =`, ans: t.C }], `∠${L[2]} = 180° − ${t.A}° − ${t.B}° = ${t.C}°. Two pairs of angles match, so the third pair does too: ∠${L[5]} = ${t.C}°, even though the triangles are different sizes.`, { visual: vis }); } },
  });

  /* ================= V.3.05 SSS ================= */
  S('V.3.05', 'SSS', {
    a: { t: 'the postulate', g: R => { const S3 = intSides(R), T = bySides(...S3), lab1 = sideLabs(S3), keys = ['BC', 'CA', 'AB'], miss = R.int(0, 2), kk = R.bool(0.4) ? R.int(1, Math.min(S3[miss] - 1, 6)) : 0;
      const lab2 = {}; keys.forEach((s, i) => lab2[s] = i === miss ? (kk ? `x + ${kk}` : 'x') : lab1[s]);
      const { vis } = pairOf(R, T, T, [{}, {}, lab1], [{}, {}, lab2]), ans = S3[miss] - kk;
      return E.num('The triangles are congruent by SSS. Find x.', [{ label: 'x =', ans }], `SSS pairs up all three sides. Two sides of the second triangle match ${S3.filter((_, i) => i !== miss).join(' and ')}, so the third matches ${S3[miss]}: ${kk ? `x + ${kk} = ${S3[miss]}, so x = ${ans}` : `x = ${ans}`}.`, { visual: vis }); } },
    b: { t: 'mark the diagram', g: R => {
      if (R.bool()) { const i = R.int(0, 2), cfg = CFG.SSS[i](R), { rn, vis } = prepCfg(R, cfg), sh = ['AC', 'AM', 'BD'][i], bad = ['AB ≅ CB', 'AM ≅ BM', 'BD ≅ AB'][i], two = cfg.lines.filter(l => l[1] === 'given').map(l => rn(l[0]));
        return E.choice(R, `Given: ${two.join('; ')}. Which third pair of sides completes SSS for the two triangles?`, `${rn(sh)} ≅ ${rn(sh)} (reflexive property)`, [`${rn(bad)} (reflexive property)`, `${rn(sh)} ≅ ${rn(sh)} (definition of midpoint)`, `${rn(bad)} (given)`],
          `The triangles share side ${rn(sh)}, and every segment is congruent to itself (reflexive property). That is the third pair.`, { visual: vis }); }
      const T = randTri(R).t, mk = [{ AB: 1, BC: 2 }, {}], { n1, n2, vis } = pairOf(R, T, T, mk);
      return E.choice(R, 'Which extra pair of congruent parts would prove the triangles congruent by SSS?', `${sdn(n1, 'CA')} ≅ ${sdn(n2, 'CA')}`, [`${sdn(n1, 'CA')} ≅ ${sdn(n2, 'AB')}`, `${sdn(n1, 'CA')} ≅ ${sdn(n2, 'BC')}`, `${agn(n1, 'B')} ≅ ${agn(n2, 'B')}`],
        `${sdn(n1, 'AB')} ≅ ${sdn(n2, 'AB')} and ${sdn(n1, 'BC')} ≅ ${sdn(n2, 'BC')} are marked, so SSS needs the third sides: ${sdn(n1, 'CA')} ≅ ${sdn(n2, 'CA')}. An angle gives SAS, not SSS.`, { visual: vis }); } },
    c: { t: 'decide if it applies', g: R => { const S3 = intSides(R), yes = R.bool(); let S2;
      if (yes) S2 = R.shuffle(S3); else { const kind = R.int(0, 2);
        if (kind === 2 && S3.every(v => v <= 8)) S2 = R.shuffle(S3.map(v => 2 * v)); else do { S2 = S3.slice(); const j = R.int(0, 2); S2[j] += R.pick([-3, -2, -1, 1, 2, 3]); S2 = R.shuffle(S2); } while (Math.max(...S2) * 2 >= S2[0] + S2[1] + S2[2] || Math.min(...S2) < 2 || S2.slice().sort().join() === S3.slice().sort().join()); }
      const T1 = bySides(...S3), T2 = bySides(...S2), { vis } = pairOf(R, T1, T2, [{}, {}, sideLabs(S3)], [{}, {}, sideLabs(S2)]), a = S3.slice().sort((x, y) => x - y), b = S2.slice().sort((x, y) => x - y);
      return E.tf('Are these triangles congruent by SSS?', yes, yes ? `Sorted, both sets of sides are ${a.join(', ')}. All three pairs match, so SSS applies.` : `Sorted, the sides are ${a.join(', ')} and ${b.join(', ')}. ${a.filter(v => b.includes(v)).length >= 2 ? 'Sharing two lengths is not enough; all three must pair up' : 'The sides do not all pair up'}, so SSS does not apply.`, { choices: ['Yes', 'No'], visual: vis }); } },
    d: { t: 'proof', g: R => proofQ(R, cfgOf(R, 'SSS'), mode3(R)) },
  });

  /* ================= V.3.06 SAS ================= */
  const oneTri = R => { const n = nameMap(trio(R)), t = randTri(R).t, P = renamePts(spin(R, t), n); return { n, vis: fig({ pts: P, segs: triMarks(n).segs }) }; };
  S('V.3.06', 'SAS', {
    a: { t: 'included angle', g: R => { const { n, vis } = oneTri(R), ks = R.shuffle(['A', 'B', 'C']), [v, p, q] = ks;
      if (R.bool()) return E.choice(R, `Which angle is included between sides ${n[p]}${n[v]} and ${n[v]}${n[q]}?`, `∠${n[v]}`, [`∠${n[p]}`, `∠${n[q]}`], `The included angle is where the two sides meet: they share the vertex ${n[v]}, so it is ∠${n[v]}.`, { visual: vis });
      return E.choice(R, `∠${n[v]} is included between which two sides?`, `${n[v]}${n[p]} and ${n[v]}${n[q]}`, [`${n[v]}${n[p]} and ${n[p]}${n[q]}`, `${n[v]}${n[q]} and ${n[p]}${n[q]}`], `The sides that form ∠${n[v]} both end at ${n[v]}: ${n[v]}${n[p]} and ${n[v]}${n[q]}. ${n[p]}${n[q]} is opposite ∠${n[v]}.`, { visual: vis }); } },
    b: { t: 'mark the diagram', g: R => { const T = randTri(R).t;
      if (R.bool()) { const { n1, n2, vis } = pairOf(R, T, T, [{ AB: 1, AC: 2 }, {}]);
        return E.choice(R, 'Which pair of angles must also be congruent to prove the triangles congruent by SAS?', `${agn(n1, 'A')} ≅ ${agn(n2, 'A')}`, [`${agn(n1, 'B')} ≅ ${agn(n2, 'B')}`, `${agn(n1, 'C')} ≅ ${agn(n2, 'C')}`, `${agn(n1, 'A')} ≅ ${agn(n2, 'B')}`],
          `SAS needs the angle between the two marked sides, at ${n1.A} and ${n2.A}. Any other angle gives SSA, which does not prove congruence.`, { visual: vis }); }
      const { n1, n2, vis } = pairOf(R, T, T, [{ AB: 1 }, { A: 1 }]);
      return E.choice(R, 'Which pair of sides must also be congruent to prove the triangles congruent by SAS?', `${sdn(n1, 'AC')} ≅ ${sdn(n2, 'AC')}`, [`${sdn(n1, 'BC')} ≅ ${sdn(n2, 'BC')}`, `${sdn(n1, 'AC')} ≅ ${sdn(n2, 'BC')}`, `${sdn(n1, 'BC')} ≅ ${sdn(n2, 'AC')}`],
        `The marked angle is at ${n1.A}, so the second side must also end at ${n1.A}: ${sdn(n1, 'AC')} ≅ ${sdn(n2, 'AC')}. Then the angle is between the two sides. ${sdn(n1, 'BC')} would give SSA.`, { visual: vis }); } },
    c: { t: 'SSA does not work', g: R => { const h = R.int(3, 8), c = h + R.int(2, 7), kind = R.int(0, 5), a = [R.int(Math.max(1, h - 3), h - 1), R.int(Math.max(1, h - 3), h - 1), h, c + R.int(0, 4), R.int(h + 1, c - 1), R.int(h + 1, c - 1)][kind], ans = a < h ? 0 : a === h || a >= c ? 1 : 2;
      const bx = Math.sqrt(c * c - h * h), L = lets(R, 3), pts = { [L[0]]: [0, 0], [L[1]]: [bx, h], _f: [bx, 0], _r: [Math.max(bx + c, 2 * c) * 1.05, 0] }, P = spin(R, pts);
      const vis = fig({ pts: P, segs: [[L[0], '_r'], [L[0], L[1], { lab: String(c), ref: '_f' }], [L[1], '_f', { dash: true, lab: String(h), ref: L[0] }]], angles: [[L[1], '_f', L[0], '', { right: true }], ['_r', L[0], L[1], '', { n: 1 }]], label: 'an angle with a point on one side' });
      return E.choiceFixed(`∠${L[0]} and side ${L[0]}${L[1]} = ${c} are fixed, and ${L[1]} is ${h} from the other side of the angle (dashed). How many different triangles ${L[0]}${L[1]}${L[2]} have ${L[2]} on that side and ${L[1]}${L[2]} = ${a}?`, ['0', '1', '2'], ans,
        `Swing a circle of radius ${a} around ${L[1]}. ${ans === 0 ? `${a} < ${h}, so it never reaches the side: no triangle.` : a === h ? `${a} equals the distance ${h}, so it just touches the side once: one (right) triangle.` : a >= c ? `${a} ≥ ${c}, so on the side it crosses only once beyond ${L[0]}: one triangle.` : `${h} < ${a} < ${c}, so it crosses the side twice: two different triangles. That is why SSA does not prove congruence.`}`, { visual: vis }); } },
    d: { t: 'proof', g: R => proofQ(R, cfgOf(R, 'SAS'), mode3(R)) },
  });

  /* ================= V.3.07 ASA ================= */
  S('V.3.07', 'ASA', {
    a: { t: 'included side', g: R => { const { n, vis } = oneTri(R), [p, q, r] = R.shuffle(['A', 'B', 'C']);
      if (R.bool()) return E.choice(R, `Which side is included between ∠${n[p]} and ∠${n[q]}?`, n[p] + n[q], [n[p] + n[r], n[q] + n[r]], `The included side joins the two vertices: ${n[p]}${n[q]}.`, { visual: vis });
      return E.choice(R, `Side ${n[p]}${n[q]} is included between which two angles?`, `∠${n[p]} and ∠${n[q]}`, [`∠${n[p]} and ∠${n[r]}`, `∠${n[q]} and ∠${n[r]}`], `${n[p]}${n[q]} runs from ${n[p]} to ${n[q]}, so it lies between ∠${n[p]} and ∠${n[q]}.`, { visual: vis }); } },
    b: { t: 'mark the diagram', g: R => { const T = randTri(R).t;
      if (R.bool()) { const { n1, n2, vis } = pairOf(R, T, T, [{}, { A: 1, B: 2 }]);
        return E.choice(R, 'Which pair of sides must also be congruent to prove the triangles congruent by ASA?', `${sdn(n1, 'AB')} ≅ ${sdn(n2, 'AB')}`, [`${sdn(n1, 'BC')} ≅ ${sdn(n2, 'BC')}`, `${sdn(n1, 'AC')} ≅ ${sdn(n2, 'AC')}`, `${sdn(n1, 'AB')} ≅ ${sdn(n2, 'BC')}`],
          `ASA needs the side that joins the two marked angles: ${sdn(n1, 'AB')} and ${sdn(n2, 'AB')}. Another side pair would be AAS, a different case.`, { visual: vis }); }
      const { n1, n2, vis } = pairOf(R, T, T, [{ AB: 1 }, { A: 1 }]);
      return E.choice(R, 'Which pair of angles must also be congruent to prove the triangles congruent by ASA?', `${agn(n1, 'B')} ≅ ${agn(n2, 'B')}`, [`${agn(n1, 'C')} ≅ ${agn(n2, 'C')}`, `${agn(n1, 'B')} ≅ ${agn(n2, 'C')}`, `${agn(n1, 'C')} ≅ ${agn(n2, 'B')}`],
        `The marked side ${sdn(n1, 'AB')} runs from ${n1.A} to ${n1.B}. With ∠${n1.A} marked, ASA needs the angle at the other end, ${agn(n1, 'B')} ≅ ${agn(n2, 'B')}.`, { visual: vis }); } },
    c: { t: 'decide if it applies', g: R => whichPost(R, [['ASA', 4], ['AAS', 2.5], ['AAA', 2], ['SSA', 1.5]]) },
    d: { t: 'proof', g: R => proofQ(R, cfgOf(R, 'ASA'), mode3(R)) },
  });

  /* ================= V.3.08 AAS ================= */
  const aasCfg = R => { const T = randTri(R).t, n1 = { A: 'A', B: 'B', C: 'C' }, n2 = { A: 'D', B: 'E', C: 'F' }, P = pairPts(R, T, T, n1, n2), t1 = triMarks(n1, { BC: 1 }, { A: 1, B: 2 }), t2 = triMarks(n2, { BC: 1 }, { A: 1, B: 2 });
    return { fixed: true, pts: P, segs: [...t1.segs, ...t2.segs], angles: [...t1.angles, ...t2.angles], w: 340, post: 'ASA', postEx: ['AAS'], note: 'Prove AAS using ASA.', label: 'two triangles',
      lines: [['∠A ≅ ∠D', 'given'], ['∠B ≅ ∠E', 'given'], ['BC ≅ EF', 'given'], ['∠C ≅ ∠F', 'third angles theorem', [0, 1]], ['△ABC ≅ △DEF', 'ASA', [1, 2, 3]]], tri: ['ABC', 'DEF'] }; };
  S('V.3.08', 'AAS', {
    a: { t: 'non-included side', g: R => { const T = randTri(R).t, { n1, n2, vis } = pairOf(R, T, T, [{}, { A: 1, B: 2 }]), s = R.pick(['BC', 'AC']), o = s === 'BC' ? 'AC' : 'BC';
      return E.choice(R, 'Which extra pair of congruent parts would prove the triangles congruent by AAS?', `${sdn(n1, s)} ≅ ${sdn(n2, s)}`, [`${sdn(n1, 'AB')} ≅ ${sdn(n2, 'AB')}`, `${agn(n1, 'C')} ≅ ${agn(n2, 'C')}`, `${sdn(n1, s)} ≅ ${sdn(n2, o)}`],
        `AAS needs a pair of corresponding sides that is not between the marked angles: ${sdn(n1, s)} ≅ ${sdn(n2, s)}. ${sdn(n1, 'AB')} is between them (that would be ASA), and a third angle pair (AAA) proves nothing about size.`, { visual: vis }); } },
    b: { t: 'prove AAS from ASA', g: R => proofQ(R, aasCfg(R), R.pick(['order', 'order', 'reason', 'broken'])) },
    c: { t: 'decide if it applies', g: R => whichPost(R, [['AAS', 4], ['ASA', 2], ['AAA', 2.5], ['SSA', 1.5]]) },
    d: { t: 'proof', g: R => proofQ(R, cfgOf(R, 'AAS'), mode3(R)) },
  });

  /* ================= V.3.09 HL ================= */
  S('V.3.09', 'HL', {
    a: { t: 'right triangles only', g: R => { const yes = R.bool(), kind = yes ? 'HL' : R.pick(['SSA', 'SSA', 'LL']), mp = markPair(R, kind);
      return E.tf('Can HL be used to prove these triangles congruent?', yes, yes ? 'Both are right triangles (square marks), the hypotenuses are marked congruent, and so is one pair of legs: HL applies.' : kind === 'SSA' ? 'These are not right triangles, so HL does not apply. Two sides and a non-included angle (SSA) can fit two different triangles, as here.' : 'The marked sides are the two legs, not a hypotenuse and a leg, so HL does not apply (SAS does).', { choices: ['Yes', 'No'], visual: mp.vis }); } },
    b: { t: 'hypotenuse and leg', g: R => { const T = randTri(R, { right: true }).t;
      if (R.bool(0.3)) { const n = nameMap(trio(R)), P = renamePts(spin(R, T), n), m = triMarks(n, {}, { C: 'R' });
        return E.choice(R, `Which side of △${n.A}${n.B}${n.C} is the hypotenuse?`, n.A + n.B, [n.A + n.C, n.B + n.C], `The hypotenuse is opposite the right angle at ${n.C}: ${n.A}${n.B}. The other two sides are the legs.`, { visual: fig({ pts: P, ...m, label: 'right triangle' }) }); }
      const { n1, n2, vis } = pairOf(R, T, T, [{ AB: 1 }, { C: 'R' }]), s = R.pick(['AC', 'BC']), o = s === 'AC' ? 'BC' : 'AC';
      return E.choice(R, 'Which extra pair of congruent parts would prove the triangles congruent by HL?', `${sdn(n1, s)} ≅ ${sdn(n2, s)}`, [`${sdn(n1, s)} ≅ ${sdn(n2, o)}`, `${sdn(n1, o)} ≅ ${sdn(n2, s)}`, `${agn(n1, 'C')} ≅ ${agn(n2, 'C')}`],
        `The hypotenuses ${sdn(n1, 'AB')} and ${sdn(n2, 'AB')} are marked. HL also needs a pair of corresponding legs, such as ${sdn(n1, s)} ≅ ${sdn(n2, s)}. The right angles are already known.`, { visual: vis }); } },
    c: { t: 'decide if it applies', g: R => whichPost(R, [['HL', 4], ['SSA', 3], ['LL', 1.5], ['AAA', 1.5]]) },
    d: { t: 'proof', g: R => proofQ(R, cfgOf(R, 'HL'), mode3(R)) },
  });

  /* ================= V.3.10 CPCTC proofs ================= */
  const withCPCTC = (cfg, target) => ({ ...cfg, lines: [...cfg.lines, [target, 'CPCTC', [cfg.lines.length - 1]]], prove: target });
  const OVER = [
    R => { const w = R.int(18, 26) / 10, t = R.int(6, 13) / 10, h = R.int(16, 24) / 10; return { post: 'SSS', pts: { A: [-w, 0], B: [w, 0], C: [t, h], D: [-t, h] }, segs: [['A', 'B'], ['A', 'D', { ticks: 1 }], ['B', 'C', { ticks: 1 }], ['A', 'C', { ticks: 2 }], ['B', 'D', { ticks: 2 }]],
      lines: [['AD ≅ BC', 'given'], ['AC ≅ BD', 'given'], ['AB ≅ BA', 'reflexive property'], ['△ABD ≅ △BAC', 'SSS', [0, 1, 2]], ['∠DAB ≅ ∠CBA', 'CPCTC', [3]]], label: 'two overlapping triangles' }; },
    R => { const p = R.int(12, 20) / 10, q = R.int(10, 18) / 10, s = R.int(20, 28) / 10, al = R.int(55, 75), D = [2 * p + q, 0];
      return { post: 'SAS', pts: { A: [0, 0], B: [p, 0], C: [p + q, 0], D, E: polar(s, al), F: [D[0] - s * Math.cos(rad(al)), s * Math.sin(rad(al))] },
        segs: [['A', 'B', { ticks: 1 }], ['B', 'C'], ['C', 'D', { ticks: 1 }], ['E', 'A', { ticks: 2 }], ['F', 'D', { ticks: 2 }], ['E', 'C'], ['F', 'B']], angles: [['E', 'A', 'B', '', { n: 1 }], ['F', 'D', 'C', '', { n: 1 }]],
        lines: [['AB ≅ CD', 'given'], ['∠A ≅ ∠D', 'given'], ['EA ≅ FD', 'given'], ['BC ≅ BC', 'reflexive property'], ['AC ≅ DB', 'segment addition', [0, 3]], ['△EAC ≅ △FDB', 'SAS', [1, 2, 4]], ['EC ≅ FB', 'CPCTC', [5]]], label: 'two overlapping triangles' }; },
    R => { const b = R.int(14, 22) / 10, h = R.int(26, 38) / 10, t = R.int(45, 62) / 100, A = [0, h], B = [-b, 0], Cc = [b, 0];
      return { post: 'SAS', pts: { A, B, C: Cc, D: lerp(A, B, t), E: lerp(A, Cc, t) }, segs: [['A', 'D', { ticks: 1 }], ['D', 'B', { ticks: 2 }], ['A', 'E', { ticks: 1 }], ['E', 'C', { ticks: 2 }], ['B', 'C'], ['B', 'E'], ['C', 'D']],
        lines: [['AD ≅ AE', 'given'], ['DB ≅ EC', 'given'], ['AB ≅ AC', 'segment addition', [0, 1]], ['∠A ≅ ∠A', 'reflexive property'], ['△ABE ≅ △ACD', 'SAS', [0, 2, 3]], ['BE ≅ CD', 'CPCTC', [4]]], label: 'two overlapping triangles' }; },
  ];
  const TWOSTEP = [
    R => { const P = kiteP(R); return { post: 'SSS', pts: { ...P, E: [0, P.B[1]] }, segs: [['A', 'B', { ticks: 1 }], ['A', 'D', { ticks: 1 }], ['C', 'B', { ticks: 2 }], ['C', 'D', { ticks: 2 }], ['A', 'C'], ['B', 'D']],
      lines: [['AB ≅ AD', 'given'], ['CB ≅ CD', 'given'], ['AC ≅ AC', 'reflexive property'], ['△ABC ≅ △ADC', 'SSS', [0, 1, 2]], ['∠BAE ≅ ∠DAE', 'CPCTC', [3]], ['AE ≅ AE', 'reflexive property'], ['△ABE ≅ △ADE', 'SAS', [0, 4, 5]]], tri: ['ABE', 'ADE'] }; },
    R => ({ post: 'SAS', pts: bowP(R), segs: [['A', 'C', { ticks: 1 }], ['C', 'E', { ticks: 1 }], ['B', 'C', { ticks: 2 }], ['C', 'D', { ticks: 2 }], ['A', 'B'], ['D', 'E']],
      lines: [['C is the midpoint of AE and of BD', 'given'], ['AC ≅ EC', 'definition of midpoint', [0]], ['BC ≅ DC', 'definition of midpoint', [0]], ['∠ACB ≅ ∠ECD', 'vertical angles'], ['△ACB ≅ △ECD', 'SAS', [1, 2, 3]], ['∠BAC ≅ ∠DEC', 'CPCTC', [4]], ['AB ∥ DE', 'converse of alternate interior angles', [5]]] }),
    R => ({ post: 'SAS', pts: isoP(R), segs: [['A', 'B', { ticks: 1 }], ['A', 'C', { ticks: 1 }], ['B', 'D'], ['D', 'C'], ['A', 'D']], angles: [['B', 'A', 'D', '', { n: 1, tick: true }], ['D', 'A', 'C', '', { n: 1, tick: true }]],
      lines: [['AB ≅ AC', 'given'], ['AD bisects ∠BAC', 'given'], ['∠BAD ≅ ∠CAD', 'definition of angle bisector', [1]], ['AD ≅ AD', 'reflexive property'], ['△ABD ≅ △ACD', 'SAS', [0, 2, 3]], ['∠ADB ≅ ∠ADC', 'CPCTC', [4]], ['AD ⟂ BC', 'congruent linear pair angles are right angles', [5]]] }),
  ];
  // parts of △t1 ≅ △t2 that do NOT correspond, and are not congruent in the drawing
  const wrongPairs = (pts, t1, t2) => { const out = [], ang = (t, i) => ang3(pts[t[(i + 1) % 3]], pts[t[i]], pts[t[(i + 2) % 3]]), an = (t, i) => `∠${t[(i + 1) % 3]}${t[i]}${t[(i + 2) % 3]}`;
    for (let i = 0; i < 3; i++) for (let m = 0; m < 3; m++) if (m !== i && Math.abs(ang(t1, i) - ang(t2, m)) > 0.5) out.push(`${an(t1, i)} ≅ ${an(t2, m)}`);
    const sd = [[0, 1], [1, 2], [0, 2]]; sd.forEach(([i, j]) => sd.forEach(([k, l]) => { if ((i !== k || j !== l) && Math.abs(dist(pts[t1[i]], pts[t1[j]]) - dist(pts[t2[k]], pts[t2[l]])) > 0.05) out.push(`${t1[i]}${t1[j]} ≅ ${t2[k]}${t2[l]}`); }));
    return out; };
  S('V.3.10', 'CPCTC proofs', {
    a: { t: 'prove triangles congruent first', g: R => { const post = R.pick(POSTS); let cfg; do cfg = cfgOf(R, post); while (!PERMS.some(p => !congTrue(cfg.pts, cfg.tri[0], p.map(j => cfg.tri[1][j]).join(''))));
      const target = R.pick(cfg.targets), { rn, vis } = prepCfg(R, cfg), [t1, t2] = cfg.tri;
      const givens = cfg.lines.filter(l => l[1] === 'given').map(l => rn(l[0])), cong = rn(`△${t1} ≅ △${t2}`), bad = PERMS.filter(p => !congTrue(cfg.pts, t1, p.map(j => t2[j]).join(''))), bo = rn(`△${t1} ≅ △${R.pick(bad).map(j => t2[j]).join('')}`);
      const wp = R.pick(POSTWRONG[post].filter(w => w !== 'SSA' && w !== 'AAA').concat(post === 'HL' ? ['ASA'] : []));
      return E.choice(R, `Given: ${givens.join('; ')}. To prove ${rn(target)}, what should you show first?`, `${cong} by ${post}`, [`${cong} by ${wp}`, `${bo} by ${post}`, `nothing: ${rn(target)} follows from CPCTC right away`],
        `CPCTC only works once the triangles are known to be congruent. First ${cong} by ${post}; then ${rn(target)} by CPCTC.`, { visual: vis }); } },
    b: { t: 'then conclude parts', g: R => { const post = R.pick(POSTS), cfg = cfgOf(R, post), { rn, vis } = prepCfg(R, cfg), [t1, t2] = cfg.tri, cong = rn(`△${t1} ≅ △${t2}`);
      if (R.bool(0.6)) { const target = R.pick(cfg.targets), wr = R.sample(wrongPairs(cfg.pts, t1, t2), 3).map(rn);
        return E.choice(R, `${cong}. Which pair must be congruent by CPCTC?`, rn(target), wr, `Match letters by position in ${cong}: ${[0, 1, 2].map(j => rn(t1[j]) + '↔' + rn(t2[j])).join(', ')}. So ${rn(target)}.`, { visual: vis }); }
      const sd = R.pick([[0, 1], [1, 2], [0, 2]].filter(([i, j]) => new Set([t1[i], t1[j], t2[i], t2[j]]).size > 2)), s1 = rn(t1[sd[0]] + t1[sd[1]]), s2 = rn(t2[sd[0]] + t2[sd[1]]);
      let x, a, b, c, d; do { x = R.int(2, 9); a = R.int(2, 6); c = R.int(2, 7); b = R.int(-6, 12); d = a * x + b - c * x; } while (a === c || a * x + b < 3 || Math.abs(d) > 20 || b === 0 || d === 0);
      return E.num(`${cong}. If ${s1} = ${M(linM(a, b))} and ${s2} = ${M(linM(c, d))}, find x.`, [{ label: 'x =', ans: x }], `${s1} and ${s2} are corresponding sides, so they are congruent (CPCTC): ${M(linM(a, b) + '=' + linM(c, d))} gives x = ${x}.`, { visual: vis }); } },
    c: { t: 'overlapping triangles', g: R => proofQ(R, R.pick(OVER)(R), R.pick(['order', 'order', 'reason', 'broken'])) },
    d: { t: 'two-step proofs', g: R => proofQ(R, R.pick(TWOSTEP)(R), R.pick(['order', 'order', 'reason', 'broken'])) },
  });

  /* ================= V.3.11 Isosceles triangles ================= */
  const isoCfg = R => R.bool() ? { post: 'SAS', pts: isoP(R), segs: [['A', 'B', { ticks: 1 }], ['A', 'C', { ticks: 1 }], ['B', 'D'], ['D', 'C'], ['A', 'D', { dash: true }]], given: 'AB ≅ AC', prove: '∠B ≅ ∠C',
    lines: [['AB ≅ AC', 'given'], ['Draw the bisector AD of ∠BAC', 'every angle has a bisector'], ['∠BAD ≅ ∠CAD', 'definition of angle bisector', [1]], ['AD ≅ AD', 'reflexive property', [1]], ['△ABD ≅ △ACD', 'SAS', [0, 2, 3]], ['∠B ≅ ∠C', 'CPCTC', [4]]] }
    : { post: 'SSS', pts: isoP(R, 'M'), segs: [['A', 'B', { ticks: 1 }], ['A', 'C', { ticks: 1 }], ['B', 'M'], ['M', 'C'], ['A', 'M', { dash: true }]], given: 'AB ≅ AC', prove: '∠B ≅ ∠C',
    lines: [['AB ≅ AC', 'given'], ['Draw M, the midpoint of BC', 'every segment has a midpoint'], ['BM ≅ CM', 'definition of midpoint', [1]], ['AM ≅ AM', 'reflexive property', [1]], ['△ABM ≅ △ACM', 'SSS', [0, 2, 3]], ['∠B ≅ ∠C', 'CPCTC', [4]]] };
  // isosceles triangle, apex A, base angles b; o: {ticks, arcs, labs}
  const isoFig = (R, b, o = {}) => { const n = nameMap(trio(R)), P = renamePts(spin(R, byAngles(b, b)), n), m = triMarks(n, o.ticks === false ? {} : { AB: 1, AC: 1 }, o.arcs || {}, o.labs || {}); return { n, vis: fig({ pts: P, ...m, label: 'isosceles triangle' }) }; };
  // chain: AB = AC, D on AC with BD = BC
  const chainPts = a => { const bb = (180 - a) / 2, t = byAngles(bb, bb, 4), F = foot(t.B, t.A, t.C); return { ...t, D: sub(mul(F, 2), t.C) }; };
  const zigzag = (th, k) => { const u1 = [1, 0], u2 = polar(1, th), P = [[0, 0]]; let Q = [0, 0];
    for (let i = 0; i < k; i++) { const u = i % 2 ? u2 : u1, d = u[0] * Q[0] + u[1] * Q[1], t = d + Math.sqrt(d * d - (Q[0] ** 2 + Q[1] ** 2) + 1); Q = mul(u, t); P.push(Q); } return P; };
  S('V.3.11', 'Isosceles triangles', {
    a: { t: 'base angles theorem', g: R => { if (R.bool(0.35)) return proofQ(R, isoCfg(R), mode3(R));
      const kind = R.int(0, 2);
      if (kind === 0) { const b = R.int(20, 80), { n, vis } = isoFig(R, b, { labs: { B: deg(b), A: '?' } });
        return E.num(`${n.A}${n.B} = ${n.A}${n.C}. Find ∠${n.A}.`, [{ ans: 180 - 2 * b }], `The base angles are opposite the equal sides, so ∠${n.C} = ∠${n.B} = ${b}°. Then ∠${n.A} = 180° − 2(${b}°) = ${180 - 2 * b}°.`, { visual: vis }); }
      if (kind === 1) { const v = 2 * R.int(10, 70), b = (180 - v) / 2, { n, vis } = isoFig(R, b, { labs: { A: deg(v), C: '?' } });
        return E.num(`${n.A}${n.B} = ${n.A}${n.C}. Find ∠${n.C}.`, [{ ans: b }], `The base angles ∠${n.B} and ∠${n.C} are equal and share 180° − ${v}° = ${180 - v}°, so each is ${b}°.`, { visual: vis }); }
      const b = R.int(25, 78), { n, vis } = isoFig(R, b, { labs: { C: deg(b), B: '?' } });
      return E.num(`${n.A}${n.B} = ${n.A}${n.C}. Find ∠${n.B}.`, [{ ans: b }], `${n.A}${n.B} = ${n.A}${n.C}, so the angles opposite them are equal: ∠${n.C} (opposite ${n.A}${n.B}) and ∠${n.B} (opposite ${n.A}${n.C}). ∠${n.B} = ${b}°.`, { visual: vis }); } },
    b: { t: 'its converse', g: R => {
      if (R.bool()) { const b = R.int(30, 75), L = R.int(4, 15), { n, vis } = isoFig(R, b, { ticks: false, labs: { B: deg(b), C: deg(b), AB: String(L), AC: '?' } });
        return E.num(`Find ${n.A}${n.C}.`, [{ label: `${n.A}${n.C} =`, ans: L }], `∠${n.B} = ∠${n.C}, so the sides opposite them are equal (converse of the base angles theorem): ${n.A}${n.C} = ${n.A}${n.B} = ${L}.`, { visual: vis }); }
      let an; do { const b = R.int(25, 75); an = R.shuffle([180 - 2 * b, b, b]); } while (an.some(v => v === 60));
      const nm = trio(R), n = nameMap(nm), P = renamePts(spin(R, byAngles(an[1], an[2])), n), odd = an.findIndex((v, i) => an.indexOf(v) === i && an.lastIndexOf(v) === i), k = 'ABC'[odd];
      const hid = R.pick([0, 1, 2].filter(j => j !== odd)), gv = [0, 1, 2].filter(i => i !== hid), labs = {}; gv.forEach(i => labs['ABC'[i]] = deg(an[i]));
      const eqV = 'ABC'.split('').filter(q => q !== k), right = `${n[k]}${n[eqV[0]]} ≅ ${n[k]}${n[eqV[1]]}`;
      return E.choice(R, `Two angles of △${nm.join('')} are marked. Which two sides are congruent?`, right, [`${n[eqV[0]]}${n[eqV[1]]} ≅ ${n[k]}${n[eqV[0]]}`, `${n[eqV[0]]}${n[eqV[1]]} ≅ ${n[k]}${n[eqV[1]]}`, 'no two sides'],
        `The third angle is ${an[[0, 1, 2].find(i => !gv.includes(i))]}°, so ∠${n[eqV[0]]} = ∠${n[eqV[1]]} = ${an['ABC'.indexOf(eqV[0])]}°. The sides opposite those angles are congruent: ${right}.`, { visual: fig({ pts: P, ...triMarks(n, {}, {}, labs) }) }); } },
    c: { t: 'equilateral means equiangular', g: R => { let x, a, b;
      if (R.bool()) { do { x = R.int(4, 25); a = R.int(2, 5); b = 60 - a * x; } while (Math.abs(b) > 40 || b === 0);
        const n = nameMap(trio(R)), P = renamePts(spin(R, byAngles(60, 60)), n), k = R.pick(['A', 'B', 'C']), m = triMarks(n, { AB: 1, BC: 1, CA: 1 }, {}, { [k]: angLab(a, b) });
        return E.num('Find x.', [{ label: 'x =', ans: x }], `All three sides are equal, so the triangle is equiangular and every angle is 60°: ${M(linM(a, b) + '=60')}, so x = ${x}.`, { visual: fig({ pts: P, ...m }) }); }
      let c, d; do { x = R.int(2, 9); a = R.int(2, 6); c = R.int(1, 5); b = R.int(-8, 10); d = a * x + b - c * x; } while (a === c || a * x + b < 4 || b === 0 || d === 0 || Math.abs(d) > 25);
      const n = nameMap(trio(R)), P = renamePts(spin(R, byAngles(60, 60)), n), ks = R.sample(['AB', 'BC', 'CA'], 2), m = triMarks(n, {}, { A: 1, B: 1, C: 1 }, { [ks[0]]: lin(a, b), [ks[1]]: lin(c, d) }), side = a * x + b, askS = R.bool(0.4);
      return E.num(askS ? 'Find the length of each side.' : 'Find x.', [askS ? { label: 'side =', ans: side } : { label: 'x =', ans: x }], `All three angles are marked equal, so the triangle is equilateral: ${M(linM(a, b) + '=' + linM(c, d))} gives x = ${x}${askS ? `, and each side is ${a}(${x}) ${b < 0 ? '−' : '+'} ${Math.abs(b)} = ${side}` : ''}.`, { visual: fig({ pts: P, ...m }) }); } },
    d: { t: 'solve for x', g: R => { const kind = R.int(0, 2); let x, a, b, c, d;
      if (kind === 0) { let bv; do { x = R.int(4, 25); bv = R.int(25, 80); a = R.int(2, 6); c = R.int(1, 5); b = bv - a * x; d = bv - c * x; } while (a === c || Math.abs(b) > 60 || Math.abs(d) > 60 || b === 0);
        const { vis } = isoFig(R, bv, { labs: { B: angLab(a, b), C: angLab(c, d) } });
        return E.num('Find x.', [{ label: 'x =', ans: x }], `The marked sides are equal, so the base angles are equal: ${M(linM(a, b) + '=' + linM(c, d))}, so x = ${x}.`, { visual: vis }); }
      if (kind === 1) { const bv = R.int(35, 75); do { x = R.int(2, 10); a = R.int(2, 6); c = R.int(1, 5); b = R.int(-8, 12); d = a * x + b - c * x; } while (a === c || a * x + b < 4 || b === 0 || d === 0 || Math.abs(d) > 25);
        const { vis } = isoFig(R, bv, { ticks: false, arcs: { B: 1, C: 1 }, labs: { AB: lin(a, b), AC: lin(c, d) } });
        return E.num('Find x.', [{ label: 'x =', ans: x }], `The base angles are marked equal, so the sides opposite them are equal: ${M(linM(a, b) + '=' + linM(c, d))}, so x = ${x}.`, { visual: vis }); }
      let v, bv; do { x = R.int(5, 25); bv = R.int(25, 75); v = 180 - 2 * bv; a = R.int(1, 4); c = R.int(1, 3); b = v - a * x; d = bv - c * x; } while (a + 2 * c === 0 || Math.abs(b) > 60 || Math.abs(d) > 50 || v < 20 || d === 0);
      const { vis } = isoFig(R, bv, { labs: { A: angLab(a, b), B: angLab(c, d) } });
      return E.num('Find x.', [{ label: 'x =', ans: x }], `The base angles are equal, so ${M(`(${linM(a, b)})+2(${linM(c, d)})=180`)}. That is ${M(linM(a + 2 * c, b + 2 * d) + '=180')}, so x = ${x}.`, { visual: vis }); } },
    e: { t: 'a chain of isosceles triangles', g: R => { const a = 2 * R.int(10, 27), bb = (180 - a) / 2, abd = 90 - 1.5 * a, L = lets(R, 4), map = { A: L[0], B: L[1], C: L[2], D: L[3] }, [A, B, Cc, D] = L;
      const back = R.bool(0.3), ask = back ? 3 : R.int(0, 2), ans = [abd, a, 90 + a / 2, a][ask], P = renamePts(spin(R, chainPts(a)), map);
      const angles = [[B, A, Cc, back ? '?' : deg(a)], [[A, B, D], [D, B, Cc], [A, D, B], null][ask] && [...[[A, B, D], [D, B, Cc], [A, D, B]][ask], '?']].filter(Boolean);
      if (back) angles.push([A, B, D, deg(abd)]);
      const vis = fig({ pts: P, segs: [[A, B, { ticks: 1 }], [A, D], [D, Cc], [B, Cc, { ticks: 2 }], [B, D, { ticks: 2 }]], angles, label: 'isosceles triangle with a second isosceles triangle inside' });
      const chain = `∠${Cc} = ∠${A}${B}${Cc} = ${back ? '(180° − ∠' + A + ')/2' : bb + '°'}. In △${B}${D}${Cc}, ${B}${D} = ${B}${Cc}, so ∠${B}${D}${Cc} = ∠${Cc}${back ? '' : ' = ' + bb + '°'} and ∠${D}${B}${Cc} = 180° − 2∠${Cc} = ∠${A}.`;
      if (back) return E.num(`${A}${B} = ${A}${Cc}, ${B}${D} = ${B}${Cc} and ∠${A}${B}${D} = ${abd}°. Find ∠${A}.`, [{ label: `∠${A} =`, ans: a }], `${chain} So ∠${A}${B}${D} = ∠${A}${B}${Cc} − ∠${D}${B}${Cc} = (180° − ∠${A})/2 − ∠${A} = 90° − 1.5∠${A}. Then 90 − 1.5∠${A} = ${abd}, so ∠${A} = ${a}°.`, { visual: vis });
      const nm = [`∠${A}${B}${D}`, `∠${D}${B}${Cc}`, `∠${A}${D}${B}`][ask];
      return E.num(`${A}${B} = ${A}${Cc}, ${B}${D} = ${B}${Cc} and ∠${A} = ${a}°. Find ${nm}.`, [{ label: `${nm} =`, ans }], `${chain} ${['So ∠' + A + B + D + ' = ' + bb + '° − ' + a + '° = ' + ans + '°.', 'So ∠' + D + B + Cc + ' = ' + a + '°.', '∠' + A + D + B + ' = 180° − ∠' + B + D + Cc + ' = 180° − ' + bb + '° = ' + ans + '°.'][ask]}`, { visual: vis }); } },
    f: { t: 'isosceles chains, competition style', g: R => {
      if (R.bool(0.45)) { const L = lets(R, 4), map = { A: L[0], B: L[1], C: L[2], D: L[3] }, [A, B, Cc, D] = L, P = renamePts(spin(R, chainPts(36)), map), ask = R.int(0, 3);
        const nm = [`∠${A}`, `∠${A}${B}${Cc}`, `∠${D}${B}${Cc}`, `∠${B}${D}${Cc}`][ask], ans = [36, 72, 36, 72][ask];
        const vis = fig({ pts: P, segs: [[A, B], [A, D, { ticks: 2 }], [D, Cc], [B, Cc, { ticks: 2 }], [B, D, { ticks: 2 }]], label: 'isosceles triangle cut into two isosceles triangles' });
        return E.num(`${A}${B} = ${A}${Cc}, and ${D} on ${A}${Cc} makes ${A}${D} = ${B}${D} = ${B}${Cc}. Find ${nm}.`, [{ label: `${nm} =`, ans }], `Let ∠${A} = t. △${A}${B}${D} is isosceles, so ∠${A}${B}${D} = t and the exterior angle ∠${B}${D}${Cc} = 2t. △${B}${D}${Cc} is isosceles, so ∠${Cc} = 2t, and △${A}${B}${Cc} gives ∠${A}${B}${Cc} = 2t too. Then t + 2t + 2t = 180, so t = 36: ∠${A} = 36°, ∠${A}${B}${Cc} = ∠${B}${D}${Cc} = 72°, ∠${D}${B}${Cc} = 36°. ${nm} = ${ans}°.`, { visual: vis }); }
      const th = R.pick([10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 22, 25, 28]), nmax = Math.ceil(90 / th), Z = zigzag(th, 3), far = Math.hypot(...Z[3]) * 1.3;
      const pts = { O: [0, 0], 'P₁': Z[1], 'P₂': Z[2], 'P₃': Z[3], _r1: [far, 0], _r2: polar(far, th) }, P = spin(R, pts);
      const vis = fig({ pts: P, segs: [['O', '_r1'], ['O', '_r2'], ['O', 'P₁', { ticks: 1 }], ['P₁', 'P₂', { ticks: 1 }], ['P₂', 'P₃', { ticks: 1 }]], angles: [['_r1', 'O', '_r2', deg(th), { out: true }]], w: 320, label: 'zigzag of equal segments between two rays' });
      return E.num(`Starting at O, equal segments OP₁ = P₁P₂ = P₂P₃ = … zigzag between the sides of a ${th}° angle, each new point farther from O. What is the largest number of equal segments the zigzag can have?`, [{ ans: nmax }],
        `Each segment makes an isosceles triangle with the one before it. Using exterior angles, their base angles are ${th}°, ${2 * th}°, ${3 * th}°, …, and a base angle must stay below 90°. With n segments the last base angle is ${th}(n − 1)°, so n − 1 < ${r2(90 / th)} and the most is n = ${nmax}.`, { visual: vis }); } },
  });

  /* ================= V.3.12 Triangle inequality ================= */
  const canTri = s => { const t = s.slice().sort((a, b) => a - b); return t[0] + t[1] > t[2]; };
  S('V.3.12', 'Triangle inequality', {
    a: { t: 'sum of two sides beats the third', g: R => { const p = R.int(3, 10), q = p + R.int(1, 8), c = R.int(q - p + 1, q + p - 1);
      const bad = R.shuffle([q + p, q + p + R.int(1, 4), q - p, ...(q - p > 1 ? [R.int(1, q - p - 1)] : []), q + p + R.int(5, 9)]).filter((v, i, a) => a.indexOf(v) === i).slice(0, 3);
      return E.choice(R, `Two sides of a triangle are ${p} and ${q}. Which could be the third side?`, String(c), bad.map(String), `The third side must be more than ${q} − ${p} = ${q - p} and less than ${q} + ${p} = ${q + p}. Only ${c} fits; ${q + p} or ${q - p} would squash the triangle flat.`); } },
    b: { t: 'can these form a triangle', g: R => { const yes = R.bool(); let s;
      do { s = [R.int(2, 15), R.int(2, 15), R.int(2, 20)]; } while (canTri(s) !== yes || (yes && R.bool(0.5) && (() => { const t = s.slice().sort((a, b) => a - b); return t[0] + t[1] - t[2] > 3; })()) || (!yes && R.bool(0.4) && (() => { const t = s.slice().sort((a, b) => a - b); return t[0] + t[1] !== t[2]; })()));
      const t = s.slice().sort((a, b) => a - b);
      return E.tf(`Can ${s[0]}, ${s[1]} and ${s[2]} be the side lengths of a triangle?`, yes, yes ? `Test the two shortest against the longest: ${t[0]} + ${t[1]} = ${t[0] + t[1]} > ${t[2]}. Then every pair beats the third side.` : `Test the two shortest against the longest: ${t[0]} + ${t[1]} = ${t[0] + t[1]}, which is ${t[0] + t[1] === t[2] ? 'not more than' : 'less than'} ${t[2]}. The short sides can't meet${t[0] + t[1] === t[2] ? ' (they would lie flat)' : ''}.`, { choices: ['Yes', 'No'] }); } },
    c: { t: 'range of the third side', g: R => { const p = R.int(2, 12), q = p + R.int(0, 9);
      if (R.bool(0.6)) return E.num(`Two sides of a triangle are ${p} and ${q}. Write the possible lengths x of the third side as an inequality.`, [{ label: 'x:', interval: `(${q - p},${q + p})` }], `The third side is more than the difference and less than the sum: ${M(`${q - p}<x<${q + p}`)}.`);
      return E.num(`Two sides of a triangle are ${p} and ${q}. How many whole-number lengths are possible for the third side?`, [{ ans: 2 * p - 1 }], `${M(`${q - p}<x<${q + p}`)}, so x can be ${q - p + 1}, …, ${q + p - 1}: that is ${2 * p - 1} whole numbers.`); } },
    d: { t: 'biggest angle opposite longest side', g: R => { const n = nameMap(trio(R)), kind = R.int(0, 2);
      if (kind === 0) { const S3 = intSides(R), P = renamePts(spin(R, bySides(...S3)), n), m = triMarks(n, {}, {}, sideLabs(S3)), big = R.bool(0.65), iv = S3.indexOf(big ? Math.max(...S3) : Math.min(...S3)), v = 'ABC'[iv], opp = ['BC', 'CA', 'AB'][iv];
        return E.choice(R, `Which angle of △${n.A}${n.B}${n.C} is the ${big ? 'largest' : 'smallest'}?`, `∠${n[v]}`, 'ABC'.split('').filter(k => k !== v).map(k => `∠${n[k]}`), `The ${big ? 'largest' : 'smallest'} angle is opposite the ${big ? 'longest' : 'shortest'} side, ${sdn(n, opp)} = ${S3[iv]}, so it is ∠${n[v]}.`, { visual: fig({ pts: P, ...m }) }); }
      const t = randTri(R), an = [t.A, t.B, t.C], P = renamePts(spin(R, t.t), n), gv = R.sample([0, 1, 2], 2), labs = {}; gv.forEach(i => labs['ABC'[i]] = deg(an[i]));
      const third = [0, 1, 2].find(i => !gv.includes(i)), m = triMarks(n, {}, {}, labs), opp = ['BC', 'CA', 'AB'].map(s => sdn(n, s)), pre = `The third angle is 180° − ${an[gv[0]]}° − ${an[gv[1]]}° = ${an[third]}°.`;
      if (kind === 1) { const big = R.bool(0.6), iv = an.indexOf(big ? Math.max(...an) : Math.min(...an));
        return E.choice(R, `Which side of △${n.A}${n.B}${n.C} is the ${big ? 'longest' : 'shortest'}?`, opp[iv], opp.filter((_, i) => i !== iv), `${pre} The ${big ? 'longest' : 'shortest'} side is opposite the ${big ? 'largest' : 'smallest'} angle, ∠${n['ABC'[iv]]} = ${an[iv]}°: ${opp[iv]}.`, { visual: fig({ pts: P, ...m }) }); }
      const ord = [0, 1, 2].sort((i, j) => an[i] - an[j]);
      return E.order(R, `Put the sides of △${n.A}${n.B}${n.C} in order from shortest to longest.`, ord.map(i => opp[i]), `${pre} Sides follow their opposite angles: ${ord.map(i => `${opp[i]} (opposite ${an[i]}°)`).join(' < ')}.`, { visual: fig({ pts: P, ...m }) }); } },
    e: { t: 'triangle inequality with a twist', g: R => {
      if (R.bool()) { const a = R.int(2, 9), b = R.int(2 * a, 2 * a + 12), s = R.shuffle([a, b]);
        return E.num(`An isosceles triangle has sides of length ${s[0]} and ${s[1]} (one of them used twice). What is its perimeter?`, [{ ans: 2 * b + a }], `${a}, ${a}, ${b} fails because ${a} + ${a} = ${2 * a} is not more than ${b}. So the sides are ${b}, ${b}, ${a}, and the perimeter is ${2 * b + a}.`); }
      const p = R.int(3, 11), q = p + R.int(1, 8), kind = R.int(0, 2), ok = x => x > q - p && x < q + p && [x % 2 === 0, x > q, x % 3 === 0][kind], xs = []; for (let x = 1; x < q + p; x++) if (ok(x)) xs.push(x);
      const cond = ['an even number', `the longest side`, 'a multiple of 3'][kind], short = ['even', `longer than ${q}`, 'multiples of 3'][kind];
      return E.num(`Two sides of a triangle are ${p} and ${q}. The third side is a whole number and is ${cond}. How many lengths are possible?`, [{ ans: xs.length }], `The third side x satisfies ${M(`${q - p}<x<${q + p}`)}${kind === 1 ? ` and ${M(`x>${q}`)}` : ''}. The ones that are ${short}: ${xs.length ? xs.join(', ') : 'none'}. That is ${xs.length}.`); } },
    f: { t: 'counting integer triangles', g: R => {
      if (R.bool()) { const Pm = R.int(7, 24), by = {}; let tot = 0;
        for (let c = 1; c < Pm; c++) for (let b = 1; b <= c; b++) { const a = Pm - b - c; if (a >= 1 && a <= b && a + b > c) { by[c] = (by[c] || 0) + 1; tot++; } }
        return E.num(`How many different triangles with whole-number side lengths have perimeter ${Pm}? (Triangles with the same three lengths count once.)`, [{ ans: tot }], `Write the sides as a ≤ b ≤ c. Then c < ${Pm}/2 and c ≥ ${Pm}/3. Count by the longest side: ${Object.entries(by).map(([c, k]) => `c = ${c}: ${k}`).join('; ')}. Total ${tot}.`); }
      const nn = R.int(4, 13), by = {}; let tot = 0; for (let b = 1; b <= nn; b++) for (let a = 1; a <= b; a++) if (a + b > nn) { by[b] = (by[b] || 0) + 1; tot++; }
      return E.num(`How many different triangles with whole-number sides have longest side exactly ${nn}? (Triangles with the same three lengths count once.)`, [{ ans: tot }], `Take sides a ≤ b ≤ ${nn} with a + b > ${nn}. Count by b: ${Object.entries(by).map(([b, k]) => `b = ${b}: ${k}`).join('; ')}. Total ${tot}.`); } },
  });

  const pw = v => v < 0 ? `(${v})` : String(v);
  const sl = (dy, dx) => { const f = E.fracStr(dy, dx); return `${dy}/${dx}` === f ? E.pt(f) : `${dy}/${dx} = ${E.pt(f)}`; };
  /* ================= V.3.13 Midsegment theorem ================= */
  const midFig = (R, o = {}) => { const t = o.t || randTri(R).t, L = lets(R, 5), map = { A: L[0], B: L[1], C: L[2], M: L[3], N: L[4] }, [A, B, Cc, Mm, N] = L;
    const P = renamePts(spin(R, { ...t, M: mid(t.A, t.B), N: mid(t.A, t.C) }), map);
    return { L, vis: fig({ pts: P, segs: [[A, Mm, { ticks: 1 }], [Mm, B, { ticks: 1 }], [A, N, { ticks: 2 }], [N, Cc, { ticks: 2 }], [B, Cc, { lab: o.bc }], [Mm, N, { lab: o.mn, ref: A }]], angles: o.angles ? o.angles(L) : [], label: 'triangle with a midsegment' }) }; };
  S('V.3.13', 'Midsegment theorem', {
    a: { t: 'parallel to the third side', g: R => {
      if (R.bool(0.4)) { const { L, vis } = midFig(R), [A, B, Cc, Mm, N] = L;
        return E.choice(R, `${Mm} and ${N} are the midpoints of ${A}${B} and ${A}${Cc}. ${Mm}${N} is parallel to which side?`, B + Cc, [A + B, A + Cc], `A midsegment is parallel to the third side, the one it does not touch: ${B}${Cc}.`, { visual: vis }); }
      const t = randTri(R), atB = R.bool(), val = atB ? t.B : t.C, { L, vis } = midFig(R, { t: t.t, angles: L => atB ? [[L[0], L[3], L[4], deg(val)], [L[0], L[1], L[2], '?']] : [[L[0], L[4], L[3], deg(val)], [L[0], L[2], L[1], '?']] }), [A, B, Cc, Mm, N] = L;
      return E.num(`${Mm} and ${N} are the midpoints of ${A}${B} and ${A}${Cc}. Find ∠${atB ? A + B + Cc : A + Cc + B}.`, [{ ans: val }], `${Mm}${N} ∥ ${B}${Cc}, so ∠${atB ? A + Mm + N : A + N + Mm} and ∠${atB ? A + B + Cc : A + Cc + B} are corresponding angles: both ${val}°.`, { visual: vis }); } },
    b: { t: 'half as long', g: R => { const fromBC = R.bool(0.6), bc = fromBC ? R.int(6, 30) : 2 * R.int(3, 15) + (R.bool(0.3) ? 1 : 0), mn = bc / 2;
      const { L, vis } = midFig(R, { bc: fromBC ? String(bc) : '?', mn: fromBC ? '?' : String(mn) }), [A, B, Cc, Mm, N] = L;
      return E.num(`${Mm} and ${N} are the midpoints of ${A}${B} and ${A}${Cc}. Find ${fromBC ? Mm + N : B + Cc}.`, [{ ans: fromBC ? mn : bc }], `The midsegment is half the side it is parallel to: ${Mm}${N} = ½${B}${Cc}, so ${fromBC ? `${Mm}${N} = ${bc}/2 = ${mn}` : `${B}${Cc} = 2 × ${mn} = ${bc}`}.`, { visual: vis }); } },
    c: { t: 'solve for x', g: R => { let x, a, b, c, d; do { x = R.int(2, 12); a = R.int(1, 4); b = R.int(-5, 12); c = R.int(1, 9); d = 2 * (a * x + b) - c * x; } while (c === 2 * a || a * x + b < 3 || b === 0 || d === 0 || Math.abs(d) > 30);
      const ask = R.int(0, 2), { L, vis } = midFig(R, { bc: lin(c, d), mn: lin(a, b) }), [A, B, Cc, Mm, N] = L, mn = a * x + b;
      return E.num(`${Mm} and ${N} are the midpoints of ${A}${B} and ${A}${Cc}. Find ${['x', Mm + N, B + Cc][ask]}.`, [{ label: ['x', Mm + N, B + Cc][ask] + ' =', ans: [x, mn, 2 * mn][ask] }], `${B}${Cc} = 2·${Mm}${N}: ${M(`${linM(c, d)}=2(${linM(a, b)})`)}, so x = ${x}${ask ? `, ${Mm}${N} = ${mn} and ${B}${Cc} = ${2 * mn}` : ''}.`, { visual: vis }); } },
    d: { t: 'coordinate proof', g: R => { let T; do T = [0, 1, 2].map(() => [2 * R.int(-4, 4), 2 * R.int(-4, 4)]); while (Math.abs((T[1][0] - T[0][0]) * (T[2][1] - T[0][1]) - (T[2][0] - T[0][0]) * (T[1][1] - T[0][1])) < 24 || T[1][0] === T[2][0] || T[0].join() === T[1].join());
      let nm; do nm = trio(R); while (nm.includes('M') || nm.includes('N')); const Mp = mid(T[0], T[1]), Np = mid(T[0], T[2]), kind = R.bool(0.4) ? R.int(3, 4) : R.int(0, 2), pts = `${nm.map((c, i) => `${c}(${T[i][0]}, ${T[i][1]})`).join(', ')}`;
      const pre = `${nm[0]}, ${nm[1]} and ${nm[2]} are ${pts}. M and N are the midpoints of ${nm[0]}${nm[1]} and ${nm[0]}${nm[2]}.`;
      if (kind >= 3) { const YZ = nm[1] + nm[2], d2 = (T[2][0] - T[1][0]) ** 2 + (T[2][1] - T[1][1]) ** 2, ex = q => { const [k, r] = E.surd(1, q); return r === 1 ? String(k) : `${k === 1 ? '' : k}sqrt(${r})`; };
        const s1 = sl(Np[1] - Mp[1], Np[0] - Mp[0]), s2 = sl(T[2][1] - T[1][1], T[2][0] - T[1][0]), Mt = `M = (${Mp[0]}, ${Mp[1]})`, Nt = `N = (${Np[0]}, ${Np[1]})`, vis = triGraph(T, nm, [Mp, Np]);
        if (kind === 3) { const bySlope = R.bool(), L = bySlope ? [`${Mt} (midpoint formula)`, `${Nt} (midpoint formula)`, `slope of MN = ${s1} (slope formula)`, `slope of ${YZ} = ${s2} (slope formula)`, `MN ∥ ${YZ} (equal slopes)`]
            : [`${Mt} (midpoint formula)`, `${Nt} (midpoint formula)`, `MN = ${E.pt(ex(d2 / 4))} (distance formula)`, `${YZ} = ${E.pt(ex(d2))} (distance formula)`, `MN = ½ · ${YZ} (${E.pt(ex(d2))} is twice ${E.pt(ex(d2 / 4))})`];
          return E.K.orderQ(R, `${pre} Put the steps of a coordinate proof that ${bySlope ? `MN ∥ ${YZ}` : `MN = ½ · ${YZ}`} in order.`, L, [[], [], [0, 1], [], [2, 3]],
            `MN can only be measured once M and N are found; the ${YZ} line needs neither, and the conclusion compares the two results.`, { fixed: 0, visual: vis }); }
        const ok = `MN ∥ ${YZ} and MN = ½ · ${YZ}`;
        return E.choice(R, `${pre} A student finds ${Mt}, ${Nt}, slope of MN = slope of ${YZ} = ${E.pt(E.fracStr(Np[1] - Mp[1], Np[0] - Mp[0]))}, MN = ${E.pt(ex(d2 / 4))} and ${YZ} = ${E.pt(ex(d2))}. What do these steps prove?`, ok,
          [`MN ⟂ ${YZ} and MN = ½ · ${YZ}`, `MN ∥ ${YZ} and MN = 2 · ${YZ}`, `MN ∥ ${nm[0]}${nm[1]} and MN = ½ · ${nm[0]}${nm[1]}`],
          `Equal slopes make MN ∥ ${YZ}, and ${E.pt(ex(d2))} is twice ${E.pt(ex(d2 / 4))}, so MN = ½ · ${YZ}: the midsegment theorem for this triangle.`, { visual: vis }); }
      if (kind === 0) return E.num(`${pre} Find M and N.`, [{ label: 'M =', point: Mp.map(String) }, { label: 'N =', point: Np.map(String) }], `Average the coordinates: M = ((${T[0][0]} + ${pw(T[1][0])})/2, (${T[0][1]} + ${pw(T[1][1])})/2) = (${Mp[0]}, ${Mp[1]}) and N = (${Np[0]}, ${Np[1]}).`, { visual: triGraph(T, nm) });
      if (kind === 1) { const s1 = E.fracStr(Np[1] - Mp[1], Np[0] - Mp[0]), s2 = E.fracStr(T[2][1] - T[1][1], T[2][0] - T[1][0]);
        return E.num(`${pre} Find the slopes of MN and ${nm[1]}${nm[2]}.`, [{ label: 'slope of MN =', exact: s1 }, { label: `slope of ${nm[1]}${nm[2]} =`, exact: s2 }], `M = (${Mp[0]}, ${Mp[1]}) and N = (${Np[0]}, ${Np[1]}), so MN has slope ${sl(Np[1] - Mp[1], Np[0] - Mp[0])}. ${nm[1]}${nm[2]} has slope ${sl(T[2][1] - T[1][1], T[2][0] - T[1][0])}. Equal slopes: MN ∥ ${nm[1]}${nm[2]}.`, { visual: triGraph(T, nm, [Mp, Np]) }); }
      const d2 = (T[2][0] - T[1][0]) ** 2 + (T[2][1] - T[1][1]) ** 2, ex = q => { const [k, r] = E.surd(1, q); return r === 1 ? String(k) : `${k === 1 ? '' : k}sqrt(${r})`; };
      return E.num(`${pre} Find ${nm[1]}${nm[2]} and MN exactly.`, [{ label: `${nm[1]}${nm[2]} =`, exact: ex(d2) }, { label: 'MN =', exact: ex(d2 / 4) }], `${nm[1]}${nm[2]} = √${d2} = ${E.pt(ex(d2))}. M = (${Mp[0]}, ${Mp[1]}) and N = (${Np[0]}, ${Np[1]}), so MN = √${d2 / 4} = ${E.pt(ex(d2 / 4))}, exactly half of ${nm[1]}${nm[2]}.`, { visual: triGraph(T, nm, [Mp, Np]) }); } },
  });

  /* ================= V.3.14 Points of concurrency ================= */
  const acute = R => { let t; do t = randTri(R); while (Math.max(t.A, t.B, t.C) > 82); return t; };
  // short proofs that the perpendicular bisectors (or the angle bisectors) of a triangle meet at one point
  const CONC_POOL = ['perpendicular bisector theorem', 'converse of the perpendicular bisector theorem', 'angle bisector theorem', 'converse of the angle bisector theorem', 'transitive property', 'reflexive property', 'definition of midpoint', 'vertical angles', 'given'];
  const circCfg = R => { const T = acute(R).t, Pc = circum(T.A, T.B, T.C), ab = mid(T.A, T.B), bc = mid(T.B, T.C);
    const pts = { A: T.A, B: T.B, C: T.C, P: Pc, _ab: ab, _bc: bc, _x: lerp(ab, Pc, 1.3), _y: lerp(bc, Pc, 1.3) }, blue = { color: C.blue };
    return { pts, segs: [['A', '_ab', { ticks: 1 }], ['_ab', 'B', { ticks: 1 }], ['B', '_bc', { ticks: 2 }], ['_bc', 'C', { ticks: 2 }], ['C', 'A'], ['_ab', '_x', { dash: true }], ['_bc', '_y', { dash: true }], ['P', 'A', blue], ['P', 'B', blue], ['P', 'C', blue]],
      angles: [['P', '_ab', 'B', '', { right: true }], ['P', '_bc', 'C', '', { right: true }]], label: 'triangle with two perpendicular bisectors', note: 'Show that the perpendicular bisectors of a triangle meet at one point.', pool: CONC_POOL,
      wrong: { 'perpendicular bisector theorem': [['converse of the perpendicular bisector theorem', 'the converse starts from equal distances; here the point is known to be on the bisector, so the theorem itself gives the equal distances'], ['angle bisector theorem', 'the point is on perpendicular bisectors of sides, not on angle bisectors'], ['definition of midpoint', 'the point is not a midpoint; it lies on the perpendicular bisector']],
        'transitive property': [['reflexive property', 'the reflexive property says a length equals itself; here two equal lengths are chained'], ['perpendicular bisector theorem', 'the point is not yet known to be on the third perpendicular bisector; that is the conclusion']],
        'converse of the perpendicular bisector theorem': [['perpendicular bisector theorem', 'that theorem starts from a point on the bisector; here the equal distances are known and being on the bisector is the conclusion, which is the converse'], ['transitive property', 'the transitive property chains equal lengths; it does not place a point on a line'], ['angle bisector theorem', 'the equal distances are to the vertices, not to the sides']] },
      lines: [['P is on the perpendicular bisectors of AB and BC', 'given'], ['PA = PB', 'perpendicular bisector theorem', [0]], ['PB = PC', 'perpendicular bisector theorem', [0]], ['PA = PC', 'transitive property', [1, 2]], ['P is on the perpendicular bisector of AC', 'converse of the perpendicular bisector theorem', [3]]] }; };
  const incCfg = R => { let be, ga; do { be = R.int(18, 36); ga = R.int(18, 36); } while (180 - 2 * be - 2 * ga < 36 || be === ga);
    const T = byAngles(2 * be, 2 * ga, 5), Ic = incen(T.A, T.B, T.C), blue = { color: C.blue };
    const pts = { A: T.A, B: T.B, C: T.C, P: Ic, _a: foot(Ic, T.B, T.C), _b: foot(Ic, T.C, T.A), _c: foot(Ic, T.A, T.B), _x: lerp(T.A, Ic, 1.35), _y: lerp(T.B, Ic, 1.35) };
    return { pts, segs: [['A', 'B'], ['B', 'C'], ['C', 'A'], ['A', '_x', { dash: true }], ['B', '_y', { dash: true }], ['P', '_a', blue], ['P', '_b', blue], ['P', '_c', blue]],
      angles: [['B', 'A', 'P', '', { n: 1, tick: true }], ['P', 'A', 'C', '', { n: 1, tick: true }], ['A', 'B', 'P', '', { n: 2 }], ['P', 'B', 'C', '', { n: 2 }], ['P', '_a', 'C', '', { right: true }], ['P', '_b', 'A', '', { right: true }], ['P', '_c', 'B', '', { right: true }]],
      label: 'triangle with two angle bisectors', note: 'Show that the angle bisectors of a triangle meet at one point.', pool: CONC_POOL,
      wrong: { 'angle bisector theorem': [['converse of the angle bisector theorem', 'the converse starts from equal distances; here the point is known to be on the bisector, so the theorem itself gives the equal distances'], ['perpendicular bisector theorem', 'the point is on angle bisectors, not on perpendicular bisectors of the sides'], ['definition of midpoint', 'no midpoint is used here']],
        'transitive property': [['reflexive property', 'the reflexive property says a distance equals itself; here two equal distances are chained'], ['angle bisector theorem', 'the point is not yet known to be on the third bisector; that is the conclusion']],
        'converse of the angle bisector theorem': [['angle bisector theorem', 'that theorem starts from a point on the bisector; here the equal distances are known and being on the bisector is the conclusion, which is the converse'], ['transitive property', 'the transitive property chains equal distances; it does not place a point on a line'], ['perpendicular bisector theorem', 'the equal distances are to the sides, not to the vertices']] },
      lines: [['P is on the bisectors of ∠A and ∠B', 'given'], ['P is equally far from AB and AC', 'angle bisector theorem', [0]], ['P is equally far from BA and BC', 'angle bisector theorem', [0]],
        ['P is equally far from AC and BC', 'transitive property', [1, 2]], ['P is on the bisector of ∠C', 'converse of the angle bisector theorem', [3]]] }; };
  S('V.3.14', 'Points of concurrency', {
    a: { t: 'circumcenter from perpendicular bisectors', g: R => { if (R.bool(0.3)) return proofQ(R, circCfg(R), R.pick(['order', 'order', 'reason', 'broken']));
      const t = acute(R), L = lets(R, 4), [A, B, Cc, O] = L, T = t.t, Oc = circum(T.A, T.B, T.C), kind = R.int(0, 3);
      if (kind === 3) { const n = nameMap(trio(R));
        return E.choice(R, `P is where the perpendicular bisectors of △${n.A}${n.B}${n.C} meet. Which statement is true?`, `P is the same distance from ${n.A}, ${n.B} and ${n.C}.`, [`P is the same distance from the three sides.`, `P is ⅔ of the way from ${n.A} to the midpoint of ${n.B}${n.C}.`, `P always lies inside the triangle.`], 'Every point on a perpendicular bisector is equidistant from the segment’s endpoints, so the circumcenter is equidistant from all three vertices. (It can lie outside an obtuse triangle.)'); }
      let x, a, b, c, d; do { x = R.int(2, 9); a = R.int(2, 6); c = R.int(1, 5); b = R.int(-6, 10); d = a * x + b - c * x; } while (a === c || a * x + b < 4 || b === 0 || d === 0 || Math.abs(d) > 20);
      const val = kind === 0 ? R.int(4, 20) : a * x + b, map = { A, B, C: Cc, O }, pts = { A: T.A, B: T.B, C: T.C, O: Oc, _ab: mid(T.A, T.B), _bc: mid(T.B, T.C), _ca: mid(T.C, T.A) }, P = renamePts(spin(R, pts), map), two = R.sample([A, B, Cc], 2);
      const vis = fig({ pts: P, segs: [[A, '_ab', { ticks: 1 }], ['_ab', B, { ticks: 1 }], [B, '_bc', { ticks: 2 }], ['_bc', Cc, { ticks: 2 }], [Cc, '_ca', { ticks: 3 }], ['_ca', A, { ticks: 3 }], ['_ab', O, { dash: true }], ['_bc', O, { dash: true }], ['_ca', O, { dash: true }],
        [O, two[0], { color: C.blue, lab: kind === 0 ? String(val) : lin(a, b), ref: two[1] }], [O, two[1], { color: C.blue, lab: kind === 0 ? '?' : lin(c, d), ref: two[0] }]], angles: [[O, '_ab', B, '', { right: true }], [O, '_bc', Cc, '', { right: true }], [O, '_ca', A, '', { right: true }]], label: 'triangle with perpendicular bisectors' });
      if (kind === 0) return E.num(`The dashed lines are the perpendicular bisectors of △${A}${B}${Cc}, meeting at ${O}. ${O}${two[0]} = ${val}. Find ${O}${two[1]}.`, [{ ans: val }], `${O} is the circumcenter, equidistant from all three vertices, so ${O}${two[1]} = ${O}${two[0]} = ${val}.`, { visual: vis });
      return E.num(`The dashed lines are the perpendicular bisectors of △${A}${B}${Cc}, meeting at ${O}. Find x.`, [{ label: 'x =', ans: x }], `The circumcenter is equidistant from the vertices: ${M(linM(a, b) + '=' + linM(c, d))}, so x = ${x}.`, { visual: vis }); } },
    b: { t: 'incenter from angle bisectors', g: R => { if (R.bool(0.3)) return proofQ(R, incCfg(R), R.pick(['order', 'order', 'reason', 'broken']));
      let be, ga; do { be = R.int(15, 38); ga = R.int(15, 38); } while (180 - 2 * be - 2 * ga < 30 || be === ga);
      const T = byAngles(2 * be, 2 * ga, 5), Ic = incen(T.A, T.B, T.C), L = lets(R, 4), [A, B, Cc, I] = L, kind = R.int(0, 2), map = { A, B, C: Cc, I };
      const pts = { A: T.A, B: T.B, C: T.C, I: Ic, _a: foot(Ic, T.B, T.C), _b: foot(Ic, T.C, T.A), _c: foot(Ic, T.A, T.B) }, P = renamePts(spin(R, pts), map), r = R.int(3, 12);
      const angles = kind === 2 ? [[I, '_a', B, '', { right: true }], [I, '_b', Cc, '', { right: true }], [I, '_c', A, '', { right: true }]] : [[I, B, Cc, deg(be), { tick: true }], [A, B, I, '', { n: 1, tick: true }], [I, Cc, B, deg(ga), { n: 2 }], [A, Cc, I, '', { n: 2 }], kind === 0 ? [B, A, Cc, '?'] : [B, I, Cc, '?']];
      const segs = [[A, B], [B, Cc], [Cc, A], [A, I, { dash: true }], [B, I, { dash: true }], [Cc, I, { dash: true }], ...(kind === 2 ? [[I, '_a', { color: C.blue, lab: String(r) }], [I, '_b', { color: C.blue, lab: '?' }], [I, '_c', { color: C.blue }]] : [])];
      const vis = fig({ pts: P, segs, angles, label: 'triangle with angle bisectors' }), pre = `The dashed segments bisect the angles of △${A}${B}${Cc} and meet at ${I}.`;
      if (kind === 2) return E.num(`${pre} The distance from ${I} to ${B}${Cc} is ${r}. What is the distance from ${I} to ${Cc}${A}?`, [{ ans: r }], `${I} is the incenter. Each point of an angle bisector is equidistant from the angle’s sides, so ${I} is the same distance, ${r}, from all three sides.`, { visual: vis });
      if (kind === 0) return E.num(`${pre} Find ∠${A}.`, [{ label: `∠${A} =`, ans: 180 - 2 * be - 2 * ga }], `The bisectors halve the angles, so ∠${B} = ${2 * be}° and ∠${Cc} = ${2 * ga}°. Then ∠${A} = 180° − ${2 * be}° − ${2 * ga}° = ${180 - 2 * be - 2 * ga}°.`, { visual: vis });
      return E.num(`${pre} Find ∠${B}${I}${Cc}.`, [{ ans: 180 - be - ga }], `In △${B}${I}${Cc}: ∠${B}${I}${Cc} = 180° − ${be}° − ${ga}° = ${180 - be - ga}°.`, { visual: vis }); } },
    c: { t: 'centroid from medians (2:1)', g: R => { const T = randTri(R).t, Gc = cen3(T.A, T.B, T.C), L = lets(R, 4), [A, B, Cc, Gn] = L, map = { A, B, C: Cc, G: Gn }, kind = R.int(0, 3);
      let x, a, b, k = R.int(2, 12); if (kind === 3) do { x = R.int(2, 10); a = R.int(3, 6); b = 2 * (x + k) - a * x; } while (a === 2 || b === 0 || Math.abs(b) > 30 || 2 * (x + k) <= 0);
      const labAG = [String(3 * k), String(2 * k), '?', lin(a, b)][kind], labGM = ['?', undefined, String(k), lin(1, k)][kind];
      const pts = { A: T.A, B: T.B, C: T.C, G: Gc, _m: mid(T.B, T.C), _n: mid(T.C, T.A), _p: mid(T.A, T.B) }, P = renamePts(spin(R, pts), map);
      const vis = fig({ pts: P, segs: [[A, B], [B, '_m', { ticks: 1 }], ['_m', Cc, { ticks: 1 }], [Cc, '_n', { ticks: 2 }], ['_n', A, { ticks: 2 }], [A, '_p'], ['_p', B], [A, Gn, { color: C.blue, lab: kind === 0 ? undefined : labAG, ref: B }], [Gn, '_m', { color: C.blue, lab: labGM, ref: B }], [B, '_n', { dash: true }], [Cc, '_p', { dash: true }]], label: 'triangle with medians' });
      const pre = `${Gn} is the centroid of △${A}${B}${Cc}, and the blue segment is the median from ${A}.`;
      if (kind === 0) return E.num(`${pre} The median is ${3 * k} long. Find the part from ${Gn} to the midpoint of ${B}${Cc}.`, [{ ans: k }], `The centroid is ⅔ of the way from the vertex: ${A}${Gn} = ${2 * k} and the rest is ${3 * k} − ${2 * k} = ${k}.`, { visual: vis });
      if (kind === 1) return E.num(`${pre} ${A}${Gn} = ${2 * k}. Find the length of the whole median.`, [{ ans: 3 * k }], `${A}${Gn} is ⅔ of the median, so the median is ${2 * k} × 3/2 = ${3 * k}.`, { visual: vis });
      if (kind === 2) return E.num(`${pre} Find ${A}${Gn}.`, [{ label: `${A}${Gn} =`, ans: 2 * k }], `The centroid splits each median 2:1, with the longer part at the vertex: ${A}${Gn} = 2 × ${k} = ${2 * k}.`, { visual: vis });
      return E.num(`${pre} Find x.`, [{ label: 'x =', ans: x }], `${A}${Gn} is twice the other part: ${M(`${linM(a, b)}=2(${linM(1, k)})`)}, so x = ${x}.`, { visual: vis }); } },
    d: { t: 'orthocenter from altitudes', g: R => {
      if (R.bool(0.4)) { const type = R.int(0, 2); let an; do { an = type === 0 ? [R.int(45, 85), R.int(45, 85)] : type === 1 ? [90, R.int(25, 65)] : [R.int(100, 135), R.int(15, 45)]; an.push(180 - an[0] - an[1]); } while (an[2] < 15 || (type === 0 && an[2] >= 90));
        const s = R.shuffle(an), n = nameMap(trio(R)), P = renamePts(spin(R, byAngles(s[1], s[2])), n), m = triMarks(n, {}, s[0] === 90 ? { A: 'R' } : s[1] === 90 ? { B: 'R' } : s[2] === 90 ? { C: 'R' } : {}, Object.fromEntries('ABC'.split('').filter((k, i) => s[i] !== 90).map(k => [k, deg(s['ABC'.indexOf(k)])])));
        return E.choiceFixed(`Where is the orthocenter of this triangle?`, ['inside the triangle', 'at a vertex', 'outside the triangle'], type, ['All angles are acute, so all three altitudes cross inside.', 'In a right triangle the two legs are altitudes, so they meet at the right-angle vertex.', 'In an obtuse triangle the altitudes from the acute vertices fall outside, so they meet outside.'][type], { visual: fig({ pts: P, ...m }) }); }
      let t; do t = randTri(R); while (Math.max(t.A, t.B, t.C) > 76 || Math.min(t.A, t.B, t.C) < 42); const T = t.t, H = sub(add(add(T.A, T.B), T.C), mul(circum(T.A, T.B, T.C), 2)), L = lets(R, 4), [A, B, Cc, Hn] = L, map = { A, B, C: Cc, H: Hn }, kind = R.bool();
      const pts = { A: T.A, B: T.B, C: T.C, H, _a: foot(T.A, T.B, T.C), _b: foot(T.B, T.C, T.A), _c: foot(T.C, T.A, T.B) }, P = renamePts(spin(R, pts), map);
      const vis = fig({ pts: P, segs: [[A, B], [B, Cc], [Cc, A], [A, '_a', { dash: true }], [B, '_b', { dash: true }], [Cc, '_c', { dash: true }]], angles: [[A, '_a', Cc, '', { right: true }], [B, '_b', A, '', { right: true }], [Cc, '_c', B, '', { right: true }], kind ? [B, A, Cc, deg(t.A)] : [A, Cc, B, deg(t.C)], kind ? [B, Hn, Cc, '?'] : [Hn, B, Cc, '?']], label: 'triangle with altitudes' });
      if (kind) return E.num(`The dashed segments are the altitudes of △${A}${B}${Cc}, meeting at ${Hn}. Find ∠${B}${Hn}${Cc}.`, [{ ans: 180 - t.A }], `In the quadrilateral formed by ${A}, the two feet of the altitudes from ${B} and ${Cc}, and ${Hn}, two angles are 90°. So ∠${B}${Hn}${Cc} = 360° − 90° − 90° − ${t.A}° = ${180 - t.A}°.`, { visual: vis });
      return E.num(`The dashed segments are the altitudes of △${A}${B}${Cc}, meeting at ${Hn}. Find ∠${Hn}${B}${Cc}.`, [{ ans: 90 - t.C }], `${B}${Hn} lies along the altitude from ${B}, which meets ${Cc}${A} at 90°. In that right triangle, ∠${Hn}${B}${Cc} = 90° − ∠${Cc} = 90° − ${t.C}° = ${90 - t.C}°.`, { visual: vis }); } },
    e: { t: 'centroid: areas and coordinates', g: R => {
      if (R.bool()) { const S0 = 6 * R.int(3, 20), T = randTri(R).t, L = lets(R, 5), [A, B, Cc, Gn, Mn] = L, kind = R.int(0, 2), Gc = cen3(T.A, T.B, T.C);
        const P = renamePts(spin(R, { A: T.A, B: T.B, C: T.C, G: Gc, M: mid(T.B, T.C), _n: mid(T.C, T.A), _p: mid(T.A, T.B) }), { A, B, C: Cc, G: Gn, M: Mn });
        const shade = [[Gn, B, Cc], [Gn, B, Mn], [A, Gn, B]][kind], ans = [S0 / 3, S0 / 6, S0 / 3][kind];
        const vis = fig({ pts: P, polys: [[...shade, { fill: C.amber, opacity: 0.35 }]], segs: [[A, B], [B, Mn, { ticks: 1 }], [Mn, Cc, { ticks: 1 }], [Cc, A], [A, Mn, { dash: true }], [B, '_n', { dash: true }], [Cc, '_p', { dash: true }]], label: 'triangle with medians and a shaded part' });
        return E.num(`${Gn} is the centroid of △${A}${B}${Cc}, whose area is ${S0}. ${Mn} is the midpoint of ${B}${Cc}. Find the area of △${shade.join('')}.`, [{ ans }], `The three medians cut the triangle into six small triangles of equal area, ${S0}/6 = ${S0 / 6} each. △${shade.join('')} is made of ${kind === 1 ? 'one' : 'two'} of them: ${ans}.`, { visual: vis }); }
      let T; do T = [0, 1, 2].map(() => [R.int(-6, 6), R.int(-6, 6)]); while ((T[0][0] + T[1][0] + T[2][0]) % 3 || (T[0][1] + T[1][1] + T[2][1]) % 3 || Math.abs((T[1][0] - T[0][0]) * (T[2][1] - T[0][1]) - (T[2][0] - T[0][0]) * (T[1][1] - T[0][1])) < 12);
      const Gp = [(T[0][0] + T[1][0] + T[2][0]) / 3, (T[0][1] + T[1][1] + T[2][1]) / 3], nm = trio(R);
      return E.num(`Triangle ${nm.join('')} has ${nm[0]}(${T[0][0]}, ${T[0][1]}) and ${nm[1]}(${T[1][0]}, ${T[1][1]}), and its centroid is G(${Gp[0]}, ${Gp[1]}). Find ${nm[2]}.`, [{ label: `${nm[2]} =`, point: T[2].map(String) }],
        `The centroid is the average of the vertices, so ${nm[2]} = 3G − ${nm[0]} − ${nm[1]} = (${3 * Gp[0]} − ${T[0][0]} − ${T[1][0]}, ${3 * Gp[1]} − ${T[0][1]} − ${T[1][1]}) = (${T[2][0]}, ${T[2][1]}).`.replace(/− -(\d)/g, '+ $1')); } },
    f: { t: 'centers of special triangles', g: R => {
      if (R.bool()) { const [p, q, h] = R.pick([[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15], [12, 16, 20], [7, 24, 25], [20, 21, 29]]), n = nameMap(trio(R)), sw = R.bool(), kind = R.int(0, 2);
        const RT = { A: [sw ? p : q, 0], B: [0, sw ? q : p], C: [0, 0] }, P = renamePts(spin(R, RT), n), m = triMarks(n, {}, { C: 'R' }, { CA: String(sw ? p : q), BC: String(sw ? q : p) });
        const pair = [['its centroid', 'its circumcenter', 6], ['its orthocenter', 'its centroid', 3], ['its orthocenter', 'its circumcenter', 2]][kind], ans = E.fracStr(h, pair[2]);
        return E.num(`A right triangle has legs ${p} and ${q}. Find the distance between ${pair[0]} and ${pair[1]}. Give an exact answer.`, [{ exact: ans }],
          `The hypotenuse is ${h}, and the median from the right angle to its midpoint is ${h}/2. ${['The circumcenter is the midpoint of the hypotenuse, and the centroid is ⅔ of the way along that median, so it is ⅓ of the median from the circumcenter: ⅓ × ' + h + '/2', 'The orthocenter is the right-angle vertex, and the centroid is ⅔ of the way along that median: ⅔ × ' + h + '/2', 'The orthocenter is the right-angle vertex and the circumcenter is the midpoint of the hypotenuse, so the distance is the whole median'][kind]} = ${h}/${pair[2]}${ans !== h + '/' + pair[2] ? ' = ' + E.pt(ans) : ''}.`, { visual: fig({ pts: P, ...m, label: 'right triangle' }) }); }
      let a, b, c2; do { a = R.int(4, 14); b = R.int(4, 14); c2 = (a * a + b * b) / 5; } while (!Number.isInteger(c2) || a === b || Math.sqrt(c2) <= Math.abs(a - b) + 0.3);
      const [k, r0] = E.surd(1, c2), ans = r0 === 1 ? String(k) : `${k === 1 ? '' : k}sqrt(${r0})`, T = bySides(a, b, Math.sqrt(c2)), Gc = cen3(T.A, T.B, T.C), L = lets(R, 6), [A, B, Cc, D, Ee, Gn] = L;
      const P = renamePts(spin(R, { ...T, D: mid(T.B, T.C), E: mid(T.A, T.C), G: Gc }), { A, B, C: Cc, D, E: Ee, G: Gn });
      const vis = fig({ pts: P, segs: [[A, B, { lab: '?', ref: Cc }], [B, D], [D, Cc], [Cc, Ee], [Ee, A], [A, D, { dash: true }], [B, Ee, { dash: true }]], angles: [[A, Gn, B, '', { right: true }]], label: 'triangle with two perpendicular medians' });
      return E.num(`In △${A}${B}${Cc}, the medians ${A}${D} and ${B}${Ee} are perpendicular. ${B}${Cc} = ${a} and ${Cc}${A} = ${b}. Find ${A}${B}. Give an exact answer.`, [{ label: `${A}${B} =`, exact: ans }],
        `Medians meet at the centroid ${Gn}. Let ${Gn}${D} = u and ${Gn}${Ee} = v, so ${A}${Gn} = 2u and ${B}${Gn} = 2v. The right angles at ${Gn} give ${B}${D}² = 4v² + u², ${A}${Ee}² = 4u² + v² and ${A}${B}² = 4u² + 4v². Adding the first two: (${a}² + ${b}²)/4 = 5(u² + v²) = (5/4)${A}${B}², so ${A}${B}² = ${c2} and ${A}${B} = ${E.pt(ans)}.`, { visual: vis }); } },
  });

})(typeof window !== 'undefined' ? window : globalThis);
