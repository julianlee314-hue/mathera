/* Era V · Unit V.9 Trig functions (V.9.01–V.9.15) */
(function (G) {
  const E = G.E5, V = E.V, C = E.C, M = s => E.mx(s), K = E.K;
  // bare " < " / " > " in plain text are escaped so they can never be read as the start of a tag
  const esc = t => typeof t === 'string' ? t.replace(/ < /g, ' &lt; ').replace(/ > /g, ' &gt; ') : t;
  const S = (id, name, steps) => { for (const k of Object.keys(steps)) { const g = steps[k].g; steps[k].g = (R, O) => { const q = g(R, O); q.prompt = esc(q.prompt); q.explain = esc(q.explain); if (q.choices) q.choices = q.choices.map(c => c.startsWith('<svg') ? c : esc(c)); if (q.items) q.items = q.items.map(esc); return q; }; } return E.skill({ id, name, steps }); };
  const PI = Math.PI, r2 = K.r2, rad = K.rad;
  const YN = { choices: ['Yes', 'No'] };
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
  const mod = (a, n) => ((a % n) + n) % n;
  const fr = (n, d = 1) => E.fracStr(n, d);
  const pt = s => E.pt(s);
  const X = (exact, label) => label ? { exact, label } : { exact };
  const co = a => a === 1 ? '' : a === -1 ? '-' : String(a);
  const cf = (p, q) => q === 1 ? co(p) : `${p < 0 ? '-' : ''}${Math.abs(p)}/${q}`;          // coefficient before a function
  const sg = v => v < 0 ? '-' : '+';
  const signed = v => v === 0 ? '' : v > 0 ? '+' + v : String(v);                            // +3 / -3 / ''
  const QN = ['Quadrant I', 'Quadrant II', 'Quadrant III', 'Quadrant IV'];
  const ptM = (a, b) => `(${M(a)}, ${M(b)})`;
  const list = a => a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1];

  /* ---------- short proofs: L = [[statement, reason, deps, wrong reasons]], line 0 is the Given ---------- */
  const twoCol = (rows, hide) => `<table class="dt"><tr><th>#</th><th>Statement</th><th>Reason</th></tr>${rows.map((r, i) => `<tr><td>${i + 1}</td><td>${r[0]}</td><td>${i === hide ? '<b>?</b>' : r[1]}</td></tr>`).join('')}</table>`;
  const proofQ = (R, head, L, explain, o = {}) => { const vis = o.visual ? { visual: o.visual } : {};
    if (R.bool(o.pOrder ?? 0.5)) return K.orderQ(R, `${head} Put the steps of the proof in order.`, L.map(l => `${l[0]} (${l[1]})`), L.map(l => l[2]), explain, Object.assign({ fixed: 1 }, vis));
    const k = R.pick(L.map((l, i) => i).filter(i => L[i][3]));
    return E.choice(R, `${head} What is the reason for step ${k + 1}?${twoCol(L, k)}`, L[k][1], L[k][3], `The reason for step ${k + 1} is: ${L[k][1]}. ${explain}`, vis); };
  const stepTbl = (rows, blank) => `<table class="dt">${rows.map((r, i) => `<tr><th>Step ${i + 1}</th><td>${i === blank ? '<b>?</b>' : r}</td></tr>`).join('')}</table>`;
  const brokenQ = (prompt, rows, bad, why) => E.choiceFixed(`${prompt} Exactly one step is wrong. Which one?${stepTbl(rows)}`, rows.map((r, i) => `Step ${i + 1}`), bad, why);
  const negS = s => s === '0' ? '0' : s[0] === '-' ? s.slice(1) : '-' + s;

  /* ---------- multiples of π ---------- */
  const piS = (n, d = 1) => { if (d < 0) { n = -n; d = -d; } const g = gcd(n, d) || 1; n /= g; d /= g; if (n === 0) return '0';
    const s = (n < 0 ? '-' : '') + (Math.abs(n) === 1 ? '' : Math.abs(n)) + 'pi'; return d === 1 ? s : s + '/' + d; };
  const toPi = (v, dmax = 144) => { for (let d = 1; d <= dmax; d++) { const n = Math.round(v / PI * d); if (Math.abs(n * PI / d - v) < 1e-9) { const g = gcd(n, d) || 1; return [n / g, d / g]; } } return null; };
  const piOf = v => { const q = toPi(v); if (!q) throw new Error('not a nice multiple of pi: ' + v); return piS(q[0], q[1]); };
  const piTxt = v => { const q = toPi(v, 48); return q ? pt(piS(q[0], q[1])) : String(r2(v)); };
  const dPi = d => piS(d, 180);

  /* ---------- exact special values: [n, d, r] means n·√r / d ---------- */
  const SINR = { 0: [0, 1, 1], 30: [1, 2, 1], 45: [1, 2, 2], 60: [1, 2, 3], 90: [1, 1, 1] };
  const TANR = { 0: [0, 1, 1], 30: [1, 3, 3], 45: [1, 1, 1], 60: [1, 1, 3] };
  const refOf = d => { const m = mod(d, 360); return m <= 90 ? m : m <= 180 ? 180 - m : m <= 270 ? m - 180 : 360 - m; };
  const sgn = x => Math.abs(x) < 1e-9 ? 0 : Math.sign(x);
  const tv = (fn, deg) => { const rf = refOf(deg), a = rad(deg);
    if (fn === 'sin') { const [n, d, r] = SINR[rf]; return [n * sgn(Math.sin(a)), d, r]; }
    if (fn === 'cos') { const [n, d, r] = SINR[90 - rf]; return [n * sgn(Math.cos(a)), d, r]; }
    if (rf === 90) return null; const [n, d, r] = TANR[rf]; return [n * sgn(Math.sin(a)) * sgn(Math.cos(a)), d, r]; };
  const vs = v => { if (!v) return null; let [n, d, r] = v; if (n === 0) return '0'; const g = gcd(n, d); n /= g; d /= g;
    if (r === 1) return fr(n, d); return `${n < 0 ? '-' : ''}${Math.abs(n) === 1 ? '' : Math.abs(n)}sqrt(${r})${d === 1 ? '' : '/' + d}`; };
  const tvS = (fn, deg) => vs(tv(fn, deg));
  const recip = v => { const [n, d, r] = v; return E.surdStr(0, d * Math.sign(n), r, Math.abs(n) * r); };
  const simp = ([n, d, r]) => { if (r === 4) { n *= 2; r = 1; } if (r === 9) { n *= 3; r = 1; } const g = gcd(n, d) || 1; return [n / g, d / g, r]; };
  const vmul = (a, b) => simp([a[0] * b[0], a[1] * b[1], a[2] * b[2]]);
  // sum of terms [n,d,r] → exact string
  const vsum = terms => { const m = {}; terms.forEach(([n, d, r]) => { const [N, D] = m[r] || [0, 1]; m[r] = [N * d + n * D, D * d]; });
    let s = ''; Object.keys(m).map(Number).sort((a, b) => a - b).forEach(r => { const t = vs([m[r][0], m[r][1], r]); if (t === '0') return; s += s && t[0] !== '-' ? '+' + t : t; }); return s || '0'; };
  // lengths k√m and ratios of them
  const lenOf = n2 => E.surd(1, n2);                               // √n2 → [k, m]
  const ratio = (A, B, s = 1) => E.surdStr(0, s * A[0], A[1] * B[1], B[0] * B[1]);
  const lenS = (A, s = 1) => E.surdStr(0, s * A[0], A[1], 1);
  const TRIP = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29], [12, 35, 37], [9, 40, 41]];
  const SPEC = [30, 45, 60, 120, 135, 150, 210, 225, 240, 300, 315, 330];

  /* ---------- drawing ---------- */
  const halo = s => s.replace('<text ', '<text paint-order="stroke" stroke="#fff" stroke-width="3.2" stroke-linejoin="round" ');
  const lab = (x, y, s, o = {}) => halo(V.text(r2(x), r2(y), String(s).replace(/-/g, '−'), { size: o.size || 12, fill: o.fill || C.muted, anchor: o.anchor, weight: o.weight || 500 }));
  const tw = (s, z) => String(s).length * z * 0.55;
  // V.graph with extra drawing in the same coordinates
  const plot = (o, extra) => { const svg = V.graph(o), [x0, x1] = o.x, [y0, y1] = o.y, W = o.w, H = o.h, pad = 18;
    const Xf = x => r2(pad + (x - x0) / (x1 - x0) * (W - 2 * pad)), Yf = y => r2(H - pad - (y - y0) / (y1 - y0) * (H - 2 * pad));
    return svg.replace(/<\/g><\/svg>$/, extra(Xf, Yf) + '</g></svg>'); };
  const arrowHead = (P1, P0, col, z = 10) => { const dx = P1[0] - P0[0], dy = P1[1] - P0[1], L = Math.hypot(dx, dy) || 1, u = [dx / L, dy / L], n = [-u[1], u[0]], hw = z * 0.6;
    const b = [P1[0] - z * u[0], P1[1] - z * u[1]]; return `<path d="M${r2(b[0] + hw * n[0])} ${r2(b[1] + hw * n[1])} L${r2(P1[0])} ${r2(P1[1])} L${r2(b[0] - hw * n[0])} ${r2(b[1] - hw * n[1])}" fill="none" stroke="${col}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`; };
  // an angle th (degrees) from vertex v, initial side at direction s0; blue initial side, red terminal side, amber rotation arc
  const angFig = (th, o = {}) => {
    const w = o.w || 230, ext = o.ext || 1.5, v = o.v || [0, 0], s0 = o.s0 || 0, L = o.L || 1.25;
    const t0 = rad(s0), t1 = rad(s0 + th), rr = t => (o.r || 0.3) + 0.12 * Math.abs(t - t0) / (2 * PI), at = t => [v[0] + rr(t) * Math.cos(t), v[1] + rr(t) * Math.sin(t)];
    const param = []; if (o.circle) param.push({ x: t => Math.cos(t), y: t => Math.sin(t), t: [0, 2 * PI], color: C.ink });
    const arc = th && o.arc !== false; if (arc) param.push({ x: t => at(t)[0], y: t => at(t)[1], t: [t0, t1], color: C.amber });
    return plot({ x: [-ext, ext], y: [-ext, ext], w, h: w, labels: false, grid: false, param, label: o.label || 'angle in standard position' }, (Xf, Yf) => {
      const S2 = p => [Xf(p[0]), Yf(p[1])], ray = (t, col, len) => `<line x1="${Xf(v[0])}" y1="${Yf(v[1])}" x2="${Xf(v[0] + len * Math.cos(t))}" y2="${Yf(v[1] + len * Math.sin(t))}" stroke="${col}" stroke-width="3" stroke-linecap="round"/>`;
      let s = '';
      if (o.tri) { const P = [Math.cos(t1), Math.sin(t1)]; s += `<line x1="${Xf(P[0])}" y1="${Yf(P[1])}" x2="${Xf(P[0])}" y2="${Yf(0)}" stroke="${C.teal}" stroke-width="2.4" stroke-dasharray="5 4"/>`; }
      s += ray(t0, C.blue, o.circle ? 1 : L) + ray(t1, C.red, o.circle ? 1 : L);
      if (arc) { const sgd = Math.sign(th), arcPx = rr(t1) * Math.abs(t1 - t0) * (w - 36) / (2 * ext); s += arrowHead(S2(at(t1)), S2(at(t1 - sgd * Math.min(0.35, Math.abs(t1 - t0) / 2))), C.amber, Math.max(6, Math.min(11, arcPx * 0.45))); }
      if (o.axes !== false) s += lab(Xf(ext) - 7, Yf(0) - 10, 'x', { size: 12 }) + lab(Xf(0) - 10, Yf(ext) + 8, 'y', { size: 12 });
      (o.pts || []).forEach(([x, y, t]) => { const [sx, sy] = S2([x, y]); s += V.dot(sx, sy, 4.5, C.ink);
        if (t) { const hw = tw(t, 13) / 2, ux = Math.cos(Math.atan2(y, x)), uy = Math.sin(Math.atan2(y, x)), end = o.labEnd;
          const lx = Math.min(w - hw - 3, Math.max(hw + 3, end ? sx : sx + ux * (hw * Math.abs(ux) + 10))), ly = Math.min(w - 10, Math.max(10, end ? sy + (y >= 0 ? -15 : 15) : sy - uy * 15));
          s += lab(lx, ly, t, { size: 13, fill: C.ink, weight: 700 }); } });
      return s; });
  };
  const ucFig = (thDeg, o = {}) => angFig(thDeg, { circle: true, ext: 1.4, w: o.w || 220, pts: [[Math.cos(rad(thDeg)), Math.sin(rad(thDeg)), o.label ?? 'P']], tri: o.tri, arc: o.arc, label: 'unit circle' });
  // trig graph: x labels as multiples of π (or numbers), y labels as numbers (or π)
  const tg = o => {
    const w = o.w || 320, h = o.h || 190, [x0, x1] = o.x, [y0, y1] = o.y, xs = o.xs, ys = o.ys || 1, xl = o.xl || 1, yl = o.yl || 1;
    return plot({ x: o.x, y: o.y, w, h, ticks: xs, yticks: ys, labels: false, fns: o.fns || [], vlines: o.vlines, hlines: o.hlines, label: o.label || 'graph' }, (Xf, Yf) => {
      let s = ''; const ax = (y0 <= 0 && y1 >= 0) ? Yf(0) : h - 18, ay = (x0 <= 0 && x1 >= 0) ? Xf(0) : 18;
      for (let k = Math.ceil(x0 / xs - 1e-9); k * xs <= x1 + 1e-9; k++) { const v = k * xs; if (k === 0 || k % xl || v <= x0 + xs * 0.4 || v >= x1 - xs * 0.3) continue;
        s += lab(Xf(v), Math.min(h - 7, ax + 12), o.xnum ? String(r2(v)) : piTxt(v), { size: 11 }); }
      for (let k = Math.ceil(y0 / ys - 1e-9); k * ys <= y1 + 1e-9; k++) { const v = k * ys; if (k === 0 || k % yl || v <= y0 + ys * 0.3 || v >= y1 - ys * 0.3) continue;
        s += lab(Math.max(12, ay - 5), Yf(v), o.ypi ? piTxt(v) : String(r2(v)), { size: 11, anchor: 'end' }); }
      (o.dots || []).forEach(([x, y, t, open]) => { s += open === true ? `<circle cx="${Xf(x)}" cy="${Yf(y)}" r="4.5" fill="#fff" stroke="${C.ink}" stroke-width="2"/>` : V.dot(Xf(x), Yf(y), 4.5, C.red);
        if (t) { const hw = tw(t, 12) / 2, left = open === 'left', cx = Xf(x) + (left ? -(hw + 6) : hw + 6); s += lab(Math.min(w - hw - 3, Math.max(hw + 3, cx)), Math.max(10, Math.min(h - 10, Yf(y) - 13)), t, { size: 12, fill: C.ink, weight: 600 }); } });
      return s; });
  };

  /* ---------- trig-function strings ---------- */
  // B = {p, q, pi}: the coefficient p/q (times π if pi)
  const Bval = B => B.p / B.q * (B.pi ? PI : 1);
  const argS = B => { const x = B.pi ? 'pix' : 'x'; return B.q === 1 ? (B.p === 1 ? x : `${B.p}${x}`) : (B.p === 1 ? `${x}/${B.q}` : `${B.p}${x}/${B.q}`); };
  const perS = B => B.pi ? fr(2 * B.q, B.p) : piS(2 * B.q, B.p);
  const perT = B => B.pi ? `2/${B.p === 1 && B.q === 1 ? '1' : pt(fr(B.p, B.q))}` : `2π/${B.q === 1 ? B.p : '(' + B.p + '/' + B.q + ')'}`;
  const BS = [{ p: 1, q: 1 }, { p: 2, q: 1 }, { p: 3, q: 1 }, { p: 4, q: 1 }, { p: 1, q: 2 }, { p: 1, q: 3 }, { p: 2, q: 3 }, { p: 3, q: 2 }, { p: 1, q: 1, pi: true }, { p: 1, q: 2, pi: true }, { p: 2, q: 1, pi: true }];

  /* ================= V.9.01 Standard position ================= */
  const DIRS = ['along the positive x-axis', 'along the positive y-axis', 'along the negative x-axis', 'along the negative y-axis'];
  const DIRW = ['pointing right', 'pointing straight up', 'pointing left', 'pointing straight down'];
  const TURNS = [[1, 4, 'a quarter turn'], [1, 2, 'half a turn'], [3, 4, 'three quarters of a turn'], [1, 8, 'an eighth of a turn'], [3, 8, 'three eighths of a turn'], [1, 3, 'a third of a turn'],
    [2, 3, 'two thirds of a turn'], [1, 6, 'a sixth of a turn'], [5, 6, 'five sixths of a turn'], [1, 12, 'a twelfth of a turn'], [5, 12, 'five twelfths of a turn'], [1, 1, 'one full turn']];
  S('V.9.01', 'Standard position', {
    a: { t: 'initial and terminal sides', g: R => {
      if (R.bool(0.6)) { let th; do th = R.int(2, 34) * 10; while (th % 90 === 0);
        const op = { w: 150, L: 1.1, ext: 1.45, axes: false }, good = angFig(th, op);
        const bad = [angFig(th, { ...op, s0: 90 }), angFig(th, { ...op, s0: 180 }), angFig(th, { ...op, v: [0.45, -0.4], L: 0.9 })];
        return E.choice(R, `In each picture the blue ray is the initial side and the red ray is the terminal side. Which picture shows ${th}° in standard position?`, good, bad,
          'Standard position needs the vertex at the origin and the initial side along the positive x-axis. One picture starts on the y-axis, one on the negative x-axis, and one has its vertex away from the origin.'); }
      const th = R.int(1, 17) * 10 + R.pick([0, 5]), truth = R.bool();
      const T = [['An angle in standard position has its vertex at the origin.', 'That is part of the definition: vertex at the origin, initial side on the positive x-axis.'],
        ['The initial side of an angle in standard position lies along the positive x-axis.', 'Every angle in standard position starts from the positive x-axis.'],
        [`In standard position, ${th}° turns counterclockwise from the positive x-axis.`, 'Positive angles turn counterclockwise.'],
        [`In standard position, −${th}° turns clockwise from the positive x-axis.`, 'Negative angles turn clockwise.'],
        ['All angles in standard position share the same initial side.', 'They all start on the positive x-axis; only the terminal sides differ.'],
        [`The terminal side of ${th}° is where the rotation stops.`, 'The rotation starts on the initial side and ends on the terminal side.']];
      const F = [['An angle in standard position has its initial side along the positive y-axis.', 'The initial side lies along the positive x-axis.'],
        [`In standard position, ${th}° turns clockwise from the positive x-axis.`, 'Positive angles turn counterclockwise; clockwise turns are negative.'],
        [`In standard position, −${th}° turns counterclockwise from the positive x-axis.`, 'A negative angle turns clockwise.'],
        ['An angle is in standard position whenever its initial side is horizontal, wherever its vertex is.', 'The vertex must be at the origin, and the initial side must be the positive x-axis.'],
        [`The initial side of ${th}° is where the rotation stops.`, 'The rotation stops on the terminal side; it starts on the initial side.']];
      const [st, why] = R.pick(truth ? T : F);
      return E.tf(`True or false? ${st}`, truth, why); } },
    b: { t: 'positive and negative rotation', g: R => { const k = R.int(0, 2);
      if (k === 0) { const th = R.pick([90, 180, 270, 360, -90, -180, -270, -360]), d = mod(th, 360) / 90, n = Math.abs(th) / 90;
        return E.choiceFixed(`Where does the terminal side of ${th}° in standard position lie?`, DIRS, d, `${th > 0 ? 'A positive angle turns counterclockwise' : 'A negative angle turns clockwise'}: ${n} quarter turn${n > 1 ? 's' : ''} from the positive x-axis ends ${DIRW[d]}.`); }
      if (k === 1) { const m = R.int(1, 7), s = R.pick([1, -1]), th = s * 45 * m;
        return E.num('The arrow shows the rotation from the blue initial side. What is the angle, in degrees?', [{ label: 'angle =', ans: th }],
          `The arrow turns ${45 * m}° ${s > 0 ? 'counterclockwise, so the angle is positive' : 'clockwise, so the angle is negative'}: ${th}°.`, { visual: angFig(th) }); }
      const [n, d, name] = R.pick(TURNS), s = R.pick([1, -1]), th = s * 360 * n / d;
      return E.num(`An angle in standard position turns ${name} ${s > 0 ? 'counterclockwise' : 'clockwise'}. What is its measure in degrees?`, [{ label: 'angle =', ans: th }],
        `${n === d ? '' : `${n}/${d} × `}360° = ${360 * n / d}°, and it is ${s > 0 ? 'positive because it turns counterclockwise' : 'negative because it turns clockwise'}: ${th}°.`); } },
    c: { t: 'more than 360°', g: R => {
      if (R.bool()) { const n = R.int(1, 2), m = R.int(1, 7), s = R.pick([1, -1]), th = s * (360 * n + 45 * m);
        return E.num('The arrow shows the rotation from the blue initial side. What is the angle, in degrees?', [{ label: 'angle =', ans: th }],
          `The arrow makes ${n} full turn${n > 1 ? 's' : ''} (${360 * n}°) and then ${45 * m}° more, ${s > 0 ? 'counterclockwise' : 'clockwise'}: ${s > 0 ? `${360 * n} + ${45 * m} = ${th}` : `−(${360 * n} + ${45 * m}) = ${th}`}°.`, { visual: angFig(th) }); }
      const n = R.int(1, 4), phi = R.int(1, 71) * 5, s = R.pick([1, -1]), th = s * (360 * n + phi);
      return E.num(`An angle of ${th}° is in standard position. How many complete turns does it make, and how many more degrees does it turn after them?`, [{ label: 'complete turns', ans: n }, { label: 'degrees more', ans: phi }],
        `${Math.abs(th)} = ${n} × 360 + ${phi}, so it makes ${n} full turn${n > 1 ? 's' : ''} and then ${phi}° more${s < 0 ? ', all clockwise because the angle is negative' : ''}.`); } },
    d: { t: 'quadrant of an angle', g: R => { const q = R.int(0, 3), k = R.int(0, 2); let txt, why;
      if (k === 0) { const phi = 90 * q + R.int(1, 17) * 5, n = R.pick([-3, -2, -1, 1, 2]), th = phi + 360 * n;
        txt = `${th}°`; why = `${th}° ${n > 0 ? '−' : '+'} ${360 * Math.abs(n)}° = ${phi}°, which is between ${90 * q}° and ${90 * q + 90}°.`; }
      else if (k === 1) { const d = R.pick([3, 4, 5, 6, 8]), cand = []; for (let n = 1; n < 2 * d; n++) if (n * 2 > q * d && n * 2 < (q + 1) * d) cand.push(n);
        const n0 = R.pick(cand), m = R.pick([-1, 0, 0, 1]), num = n0 + 2 * m * d, s = piS(num, d);
        txt = M(s); why = `${m ? `${pt(s)} is coterminal with ${pt(piS(n0, d))}, which` : `${pt(s)}`} is between ${pt(piS(q, 2))} and ${pt(piS(q + 1, 2))}.`; }
      else { const cand = []; for (let k2 = -12; k2 <= 12; k2++) { if (!k2) continue; const r = mod(k2, 2 * PI), off = mod(r, PI / 2); if (Math.floor(r / (PI / 2)) === q && off > 0.12 && off < PI / 2 - 0.12) cand.push(k2); }
        const kk = R.pick(cand), r = mod(kk, 2 * PI), turns = Math.round((kk - r) / (2 * PI));
        txt = `${kk} radians`; why = `${turns ? `${turns > 0 ? 'Subtract' : 'Add'} ${Math.abs(turns)} full turn${Math.abs(turns) > 1 ? 's' : ''} of 2π ≈ 6.28: ${kk} rad ends where ${r.toFixed(2)} rad does. ` : ''}Since ${(q * PI / 2).toFixed(2)} &lt; ${r.toFixed(2)} &lt; ${((q + 1) * PI / 2).toFixed(2)} (that is, between ${q ? pt(piS(q, 2)) : '0'} and ${pt(piS(q + 1, 2))}), the angle is in ${QN[q]}.`; }
      return E.choiceFixed(`In which quadrant is the terminal side of ${txt}?`, QN, q, k === 2 ? why : `${why} So it is in ${QN[q]}.`); } },
  });

  /* ================= V.9.02 Coterminal angles ================= */
  const degAng = R => { let th; do th = R.int(1, 35) * 10 + R.pick([0, 5]); while (th % 90 === 0 || th >= 360); return th; };
  const radAng = R => { const d = R.pick([3, 4, 6]); let n; do n = R.int(1, 2 * d - 1); while ((2 * n) % d === 0); return [n, d]; };
  S('V.9.02', 'Coterminal angles', {
    a: { t: 'add or subtract 360°', g: R => { const th = degAng(R);
      if (R.bool(0.55)) { const up = R.bool(), ans = up ? th + 360 : th - 360, half = R.pick([th + 180, th - 180]);
        const rest = R.sample([-th, 360 - th, th + 90, 180 - th, th - 90].filter(v => mod(v - th, 360) !== 0 && v !== half), 2);
        return E.choice(R, `Which angle is coterminal with ${th}°?`, `${ans}°`, [half, ...rest].map(v => `${v}°`),
          `Coterminal angles differ by whole turns: ${th}° ${up ? '+' : '−'} 360° = ${ans}°. ${half}° is only half a turn away from ${th}°, so it points the opposite way.`); }
      const up = R.bool();
      return E.num(`Find the angle coterminal with ${th}° that lies ${up ? 'between 360° and 720°' : 'between −360° and 0°'}.`, [{ label: 'angle =', ans: up ? th + 360 : th - 360 }],
        `${up ? 'Add' : 'Subtract'} one full turn: ${th}° ${up ? '+' : '−'} 360° = ${up ? th + 360 : th - 360}°.`); } },
    b: { t: 'in radians 2π', g: R => { const [n, d] = radAng(R), t = piS(n, d);
      if (R.bool(0.55)) { const up = R.bool(), ans = piS(up ? n + 2 * d : n - 2 * d, d), half = piS(n + d, d);
        const rest = R.sample([piS(-n, d), piS(2 * d - n, d), piS(2 * n + d, 2 * d), piS(n, 2 * d)].filter(s => s !== half && s !== ans && s !== t), 2);
        return E.choice(R, `Which angle is coterminal with ${M(t)}?`, M(ans), [half, ...rest].map(M),
          `A full turn is 2π: ${pt(t)} ${up ? '+' : '−'} 2π = ${pt(ans)}. Adding π is only half a turn, which points the opposite way.`); }
      const up = R.bool(), ans = piS(up ? n + 2 * d : n - 2 * d, d);
      return E.num(`Find the angle coterminal with ${M(t)} that lies between ${up ? `${M('2pi')} and ${M('4pi')}` : `${M('-2pi')} and 0`}. Give an exact answer.`, [X(ans, 'angle =')],
        `${up ? 'Add' : 'Subtract'} one full turn of 2π: ${pt(t)} ${up ? '+' : '−'} 2π = ${pt(ans)}.`); } },
    c: { t: 'find the smallest positive', g: R => {
      if (R.bool()) { const phi = R.int(1, 71) * 5, n = R.pick([2, 3, 4, -1, -2, -3]), th = phi + 360 * n;
        return E.num(`Find the smallest positive angle coterminal with ${th}°.`, [{ label: 'angle =', ans: phi }], `${n > 0 ? 'Subtract' : 'Add'} ${Math.abs(n)} full turn${Math.abs(n) > 1 ? 's' : ''}: ${th}° ${n > 0 ? '−' : '+'} ${360 * Math.abs(n)}° = ${phi}°, which is between 0° and 360°.`); }
      const d = R.pick([3, 4, 6, 5]); let n0; do n0 = R.int(1, 2 * d - 1); while (n0 === d); const m = R.pick([1, 2, -1, -2]), t = piS(n0 + 2 * m * d, d), ans = piS(n0, d);
      return E.num(`Find the smallest positive angle coterminal with ${M(t)}. Give an exact answer.`, [X(ans, 'angle =')],
        `${m > 0 ? 'Subtract' : 'Add'} ${Math.abs(m)} full turn${Math.abs(m) > 1 ? 's' : ''} of 2π: ${pt(t)} ${m > 0 ? '−' : '+'} ${pt(piS(2 * Math.abs(m)))} = ${pt(ans)}, which is between 0 and 2π.`); } },
    d: { t: 'general form', g: R => { const k = R.int(0, 2);
      if (k === 0) { if (R.bool()) { const th = degAng(R);
          return E.choice(R, `Which expression gives every angle coterminal with ${th}°? (k is any integer.)`, `${th}° + 360°k`, [`${th}° + 180°k`, `360°k − ${th}°`, `${th + 180}° + 360°k`],
            `Coterminal angles differ by whole turns, so they are ${th}° plus any whole number of 360° turns. Steps of 180° would also include angles pointing the opposite way.`); }
        const [n, d] = radAng(R), t = piS(n, d);
        return E.choice(R, `Which expression gives every angle coterminal with ${M(t)}? (k is any integer.)`, M(`${t}+2pik`), [M(`${t}+pik`), M(`2pik-${t}`), M(`${piS(n + d, d)}+2pik`)],
          `In radians a whole turn is 2π, so the coterminal angles are ${pt(t)} + 2πk. Steps of π would include angles pointing the opposite way.`); }
      if (k === 1) { const yes = R.f() < 0.5, a = R.int(-35, 35) * 10; let b;
        if (yes) { let kk; do kk = R.int(-4, 4); while (!kk); b = a + 360 * kk; } else { const opt = R.int(0, 2); b = opt === 0 ? a + 180 * R.pick([-3, -1, 1, 3]) : opt === 1 ? a + 360 * R.int(1, 3) + R.pick([90, -90, 60]) : -a; if (mod(b - a, 360) === 0) b = a + 180; }
        const diff = b - a;
        return E.tf(`Are ${a}° and ${b}° coterminal?`, yes, `${b}° − (${a}°) = ${diff}°, ${yes ? `which is ${diff / 360} whole turn${Math.abs(diff) === 360 ? '' : 's'} of 360°, so they are coterminal.` : `which is not a multiple of 360°, so they are not coterminal${mod(diff, 360) === 180 ? ' (they point in opposite directions)' : ''}.`}`, YN); }
      const th = degAng(R), L = -R.int(3, 12) * 100 - R.pick([0, 50]), U = R.int(3, 12) * 100 + R.pick([0, 50]), vals = [];
      for (let kk = -10; kk <= 10; kk++) { const v = th + 360 * kk; if (v > L && v < U) vals.push(v); }
      return E.num(`How many angles coterminal with ${th}° lie strictly between ${L}° and ${U}°?`, [{ ans: vals.length }], `They are ${th}° + 360°k: ${list(vals.map(v => v + '°'))}. That is ${vals.length}.`); } },
  });

  /* ================= V.9.03 Unit circle definition ================= */
  const uPt = R => { const [a, b, c] = R.pick(TRIP), sw = R.bool(), sx = R.pick([1, -1]), sy = R.pick([1, -1]), x = sx * (sw ? b : a), y = sy * (sw ? a : b);
    return { x, y, c, xs: fr(x, c), ys: fr(y, c), deg: Math.atan2(y, x) * 180 / PI }; };
  S('V.9.03', 'Unit circle definition', {
    a: { t: 'cos as x, sin as y', g: R => { const P = uPt(R), f = R.pick(['sin', 'cos']), ans = f === 'cos' ? P.xs : P.ys;
      return E.num(`The point P = ${ptM(P.xs, P.ys)} is on the unit circle at angle θ. Find ${f} θ.`, [X(ans, `${f} θ =`)],
        `On the unit circle, cos θ is the x-coordinate and sin θ is the y-coordinate, so ${f} θ = ${f === 'cos' ? 'x' : 'y'} = ${pt(ans)} (not the ${f === 'cos' ? 'y' : 'x'}-coordinate).`, { visual: ucFig(P.deg) }); } },
    b: { t: 'tan as y/x', g: R => { const P = uPt(R), ans = fr(P.y, P.x);
      return E.num(`The point P = ${ptM(P.xs, P.ys)} is on the unit circle at angle θ. Find tan θ.`, [X(ans, 'tan θ =')],
        `tan θ = y/x = (${pt(P.ys)}) ÷ (${pt(P.xs)}) = ${pt(ans)}; the denominators of ${P.c} cancel.`, { visual: ucFig(P.deg) }); } },
    c: { t: 'why it extends right-triangle trig', g: R => {
      if (R.bool(0.4)) { const th = R.int(20, 70), cs = R.bool(), f = cs ? 'cos' : 'sin', c = cs ? 'x' : 'y';
        const legH = 'the horizontal leg runs from the origin to the x-coordinate of P', legV = 'the vertical leg rises from the x-axis to the y-coordinate of P';
        const dCos = 'cosine is adjacent ÷ hypotenuse in a right triangle', dSin = 'sine is opposite ÷ hypotenuse in a right triangle';
        const L = [['Given: P(x, y) is on the unit circle at the acute angle θ, and Q is where the vertical dashed line from P meets the x-axis', 'Given', []],
          ['∠OQP = 90°', 'a vertical line is perpendicular to the x-axis', [0], ['every radius of the unit circle has length 1', 'the angles of a triangle add to 180°', 'θ is acute']],
          ['OP = 1', 'every radius of the unit circle has length 1', [0], ['the Pythagorean theorem', 'a vertical line is perpendicular to the x-axis', 'P is above the x-axis']],
          [cs ? 'OQ = x' : 'QP = y', cs ? legH : legV, [0], ['the Pythagorean theorem', 'every radius of the unit circle has length 1', cs ? legV : legH]],
          [`${f} θ = ${cs ? 'OQ/OP = x/1 = x' : 'QP/OP = y/1 = y'}`, cs ? dCos : dSin, [], [cs ? dSin : dCos, 'tangent is opposite ÷ adjacent in a right triangle', 'the Pythagorean theorem']]];
        return proofQ(R, `O is the origin. Prove that for an acute angle θ, ${f} θ is the ${c}-coordinate of P.`, L,
          `Triangle OQP has a right angle at Q and hypotenuse OP = 1, and its ${cs ? 'horizontal' : 'vertical'} leg is ${c}. So the right-triangle ${cs ? 'cosine' : 'sine'} is ${c}/1 = ${c}: the two definitions agree.`, { visual: ucFig(th, { tri: true }) }); }
      const k = R.int(0, 3);
      if (k === 0) { const th = R.int(20, 70), f = R.pick(['sin', 'cos']);
        return E.choice(R, `P is on the unit circle at an acute angle θ = ${th}°. The dashed line drops from P to the x-axis, making a right triangle with hypotenuse OP = 1. Which length equals ${f} θ?`,
          f === 'sin' ? 'the vertical leg, which is the y-coordinate of P' : 'the horizontal leg, which is the x-coordinate of P', [f === 'sin' ? 'the horizontal leg, which is the x-coordinate of P' : 'the vertical leg, which is the y-coordinate of P', 'the hypotenuse OP', 'the arc from (1, 0) to P'],
          `${f} θ = ${f === 'sin' ? 'opposite' : 'adjacent'}/hypotenuse = ${f === 'sin' ? 'opposite' : 'adjacent'}/1, which is the ${f === 'sin' ? 'vertical leg, the y-coordinate' : 'horizontal leg, the x-coordinate'} of P. That is why the unit-circle definition agrees with right-triangle trig.`, { visual: ucFig(th, { tri: true }) }); }
      if (k === 1) { let th; do th = R.int(19, 35) * 10 + R.pick([0, 5]); while (th % 90 === 0 || th % 30 === 0 && R.bool(0.5)); const f = R.pick(['sine', 'cosine']);
        return E.choice(R, `No right triangle has a ${th}° angle, so opposite/hypotenuse can't define its ${f}. How does the unit circle define the ${f} of ${th}°?`,
          `as the ${f === 'sine' ? 'y' : 'x'}-coordinate of the point at ${th}° on the unit circle`, [`as the ${f === 'sine' ? 'x' : 'y'}-coordinate of the point at ${th}° on the unit circle`, `as the ${f} of ${th - 90}°`, `it is left undefined for angles over 90°`],
          `The point at angle θ on the unit circle is (cos θ, sin θ) for every angle, so the ${f} of ${th}° is that point's ${f === 'sine' ? 'y' : 'x'}-coordinate. For acute angles this matches the triangle ratios.`, { visual: ucFig(th) }); }
      if (k === 2) { const a = R.pick([0, 90, 180, 270]), f = R.pick(['sin', 'cos']), P = [Math.round(Math.cos(rad(a))), Math.round(Math.sin(rad(a)))], v = f === 'cos' ? P[0] : P[1], truth = R.bool();
        const wrong = (f === 'cos' ? P[1] : P[0]) !== v ? (f === 'cos' ? P[1] : P[0]) : (v === 0 ? 1 : 0), shown = truth ? v : wrong;
        return E.tf(`The point at ${a}° on the unit circle is (${P[0]}, ${P[1]}). True or false: ${f} ${a}° = ${shown}.`, truth,
          `${f} ${a}° is the ${f === 'cos' ? 'x' : 'y'}-coordinate, ${v}${truth ? '.' : `, not ${shown}.`}`, { visual: ucFig(a, { arc: a !== 0 }) }); }
      const th = R.int(15, 75), f = R.pick(['sin', 'cos']);
      return E.choice(R, `For θ = ${th}°, P = (cos θ, sin θ) on the unit circle. In the right triangle under P the hypotenuse is 1. What does ${f === 'sin' ? 'opposite' : 'adjacent'} ÷ hypotenuse equal?`,
        `the ${f === 'sin' ? 'y' : 'x'}-coordinate of P`, [`the ${f === 'sin' ? 'x' : 'y'}-coordinate of P`, 'the slope of OP', 'the distance OP'],
        `Dividing by a hypotenuse of 1 changes nothing, so ${f === 'sin' ? 'opposite' : 'adjacent'} ÷ 1 is the ${f === 'sin' ? 'height (y-coordinate)' : 'run (x-coordinate)'} of P: ${f} θ.`, { visual: ucFig(th, { tri: true }) }); } },
    d: { t: 'points on the circle', g: R => { const k = R.int(0, 2);
      if (k === 0) { const q = R.int(0, 3), sx = q === 0 || q === 3 ? 1 : -1, sy = q < 2 ? 1 : -1, givX = R.bool(); let p, d, other;
        if (R.bool()) { const [a, b, c] = R.pick(TRIP); p = a; d = c; other = fr((givX ? sy : sx) * b, c); if (R.bool()) { p = b; other = fr((givX ? sy : sx) * a, c); } }
        else { do { d = R.int(3, 9); p = R.int(1, d - 1); } while (Number.isInteger(Math.sqrt(d * d - p * p)) || gcd(p, d) > 1); other = E.surdStr(0, givX ? sy : sx, d * d - p * p, d); }
        const given = fr((givX ? sx : sy) * p, d), gn = givX ? 'x' : 'y', on = givX ? 'y' : 'x';
        return E.num(`P is on the unit circle in ${QN[q]}, and its ${gn}-coordinate is ${M(given)}. Find its ${on}-coordinate exactly.`, [X(other, `${on} =`)],
          `x² + y² = 1, so ${on}² = 1 − ${pt(fr(p * p, d * d))} = ${pt(fr(d * d - p * p, d * d))}. In ${QN[q]} ${on} is ${(givX ? sy : sx) > 0 ? 'positive' : 'negative'}, so ${on} = ${pt(other)}.`); }
      if (k === 1) { const P = uPt(R), T = R.pick([['−θ', [1, -1, 0]], ['180° − θ', [-1, 1, 0]], ['180° + θ', [-1, -1, 0]], ['360° − θ', [1, -1, 0]], ['90° − θ', [1, 1, 1]]]);
        const [sx, sy, swp] = T[1], ans = swp ? [P.ys, P.xs] : [fr(sx * P.x, P.c), fr(sy * P.y, P.c)];
        const why = { '−θ': 'reflects P in the x-axis, so y changes sign', '180° − θ': 'reflects P in the y-axis, so x changes sign', '180° + θ': 'turns P half way round, so both coordinates change sign', '360° − θ': 'is coterminal with −θ: a reflection in the x-axis, so y changes sign', '90° − θ': 'reflects P in the line y = x, so the coordinates swap' }[T[0]];
        return E.num(`The point at angle θ on the unit circle is ${ptM(P.xs, P.ys)}. Find the point at angle ${T[0]}.`, [{ point: ans }], `The angle ${T[0]} ${why}: (${pt(ans[0])}, ${pt(ans[1])}).`); }
      const yes = R.bool(); let A, B;
      if (yes) { if (R.bool()) { const P = uPt(R); A = [P.x, P.c, 1]; B = [P.y, P.c, 1]; } else { const d0 = R.pick([30, 45, 60, 120, 135, 150, 210, 240, 300, 315, 330]); A = tv('cos', d0); B = tv('sin', d0); } }
      else { const o = R.int(0, 3); if (o === 0) { const [a, b, c] = R.pick(TRIP); A = [a, c, 1]; B = [b, c + R.pick([-1, 1]), 1]; } else if (o === 1) { const p = R.int(1, 4), d = R.int(p + 1, 7); A = [p, d, 1]; B = [p, d, 1]; }
        else if (o === 2) { [A, B] = R.shuffle([[1, 2, 3], [1, 2, 2]]); } else { const p = R.int(1, 3), d = R.int(p + 2, 8); A = [p, d, 1]; B = [d - p, d, 1]; } }
      if (R.bool()) A = [-A[0], A[1], A[2]]; if (R.bool()) B = [-B[0], B[1], B[2]];
      const sqF = v => [v[0] * v[0] * v[2], v[1] * v[1]], [n1, d1] = sqF(A), [n2, d2] = sqF(B), tot = fr(n1 * d2 + n2 * d1, d1 * d2), on = tot === '1';
      return E.tf(`Is ${ptM(vs(A), vs(B))} on the unit circle?`, on, `Check x² + y²: ${pt(fr(n1, d1))} + ${pt(fr(n2, d2))} = ${pt(tot)}${on ? ', so yes, it is on the unit circle.' : ', not 1, so no.'}`, YN); } },
  });

  /* ================= V.9.04 Special angles ================= */
  const FN3 = ['sin', 'cos', 'tan'];
  const angTxt = (deg, radian) => radian ? M(dPi(deg)) : `${deg}°`;
  const angPt = (deg, radian) => radian ? pt(dPi(deg)) : `${deg}°`;
  S('V.9.04', 'Special angles', {
    a: { t: '30°, 45°, 60° points', g: R => { const d0 = R.pick([30, 45, 60]), radn = R.bool(0.4);
      if (R.bool(0.25)) { const c = vs(tv('cos', d0)), s = vs(tv('sin', d0)), opts = [['1/2', 'sqrt(3)/2'], ['sqrt(3)/2', '1/2'], ['sqrt(2)/2', 'sqrt(2)/2'], ['1', 'sqrt(3)']];
        const ch = o => `(${pt(o[0])}, ${pt(o[1])})`, right = ch([c, s]), wrongs = opts.filter(o => ch(o) !== right).map(ch);
        return E.choice(R, `Which point is at ${angTxt(d0, radn)} on the unit circle?`, right, wrongs, `The point is (cos ${angPt(d0, radn)}, sin ${angPt(d0, radn)}) = ${right}${d0 !== 45 ? '. Watch the order: cosine (x) comes first.' : '.'}`, { visual: ucFig(d0) }); }
      const f = R.pick(FN3), ans = tvS(f, d0);
      return E.num(`Find the exact value of ${f} ${angTxt(d0, radn)}.`, [X(ans, `${f} =`)],
        `From the 30°-60°-90° and 45°-45°-90° triangles: sin 30° = 1/2, sin 45° = √2/2, sin 60° = √3/2, and the cosines run the other way. ${f} ${angPt(d0, radn)} = ${pt(ans)}.`); } },
    b: { t: 'the axes', g: R => { const d0 = R.pick([0, 90, 180, 270, 360, -90, -180, 450]), radn = R.bool(0.5), f = R.pick(FN3), P = [Math.round(Math.cos(rad(d0))), Math.round(Math.sin(rad(d0)))];
      const head = `The point at ${angPt(d0, radn)} on the unit circle is (${P[0]}, ${P[1]}).`;
      if (f === 'tan') { const und = P[0] === 0, v = und ? 3 : P[1] / P[0] === 0 ? 1 : P[1] / P[0] === 1 ? 2 : 0;
        return E.choiceFixed(`What is tan ${angTxt(d0, radn)}?`, ['−1', '0', '1', 'undefined'], v, `${head} tan = y/x = ${P[1]}/${P[0]}${und ? ', and dividing by 0 is undefined.' : ` = ${P[1] / P[0] + 0}.`}`); }
      const v = f === 'cos' ? P[0] : P[1];
      return E.num(`Find ${f} ${angTxt(d0, radn)}.`, [{ label: `${f} =`, ans: v }], `${head} ${f} is the ${f === 'cos' ? 'x' : 'y'}-coordinate: ${v}.`); } },
    c: { t: 'fill the whole circle', g: R => { const d0 = R.pick(SPEC.filter(x => x > 90)), f = R.pick(FN3), ans = tvS(f, d0), rf = refOf(d0), q = Math.floor(d0 / 90);
      return E.num(`Find the exact value of ${f} ${d0}°.`, [X(ans, `${f} ${d0}° =`)],
        `${d0}° is in ${QN[q]} with reference angle ${rf}°, so ${f} ${d0}° = ${ans[0] === '-' ? '−' : ''}${f} ${rf}° = ${pt(ans)} (${f} is ${ans[0] === '-' ? 'negative' : 'positive'} in ${QN[q]}).`, { visual: ucFig(d0) }); } },
    d: { t: 'common angles by heart, in degrees and radians', g: R => {
      if (R.bool(0.3)) { const d0 = R.pick(SPEC), f = R.pick(FN3), right = tvS(f, d0), truth = R.bool(); let shown = right;
        if (!truth) { const opts = [tvS(f === 'sin' ? 'cos' : f === 'cos' ? 'sin' : 'tan', f === 'tan' ? 90 - refOf(d0) : d0), right[0] === '-' ? right.slice(1) : '-' + right]; if (d0 % 60 === 0 && f === 'sin') opts.push(tvS('sin', d0 / 2) === '1/2' ? '1' : null);
          shown = R.pick(opts.filter(o => o && o !== right && Math.abs(E.value(o)[0] - E.value(right)[0]) > 1e-9)); }
        return E.tf(`True or false: ${M(`${f}(${dPi(d0)})=${shown}`)}`, truth, `${pt(dPi(d0))} = ${d0}°, and ${f} ${d0}° = ${pt(right)}${truth ? '.' : `, not ${pt(shown)}.`}`); }
      const d0 = R.pick(SPEC), shift = R.pick([0, 0, -360, 360]), deg = d0 + shift, f = R.pick(FN3), ans = tvS(f, deg), rf = refOf(deg), q = Math.floor(mod(deg, 360) / 90);
      return E.num(`Find the exact value of ${M(`${f}(${dPi(deg)})`)}.`, [X(ans, `${f} =`)],
        `${pt(dPi(deg))} = ${deg}°${shift ? `, coterminal with ${d0}°` : ''}: ${QN[q]}, reference angle ${rf}° = ${pt(dPi(rf))}. So the value is ${pt(ans)}.`); } },
    e: { t: 'several special angles in one expression', g: R => {
      const A = () => R.pick(SPEC), F = () => R.pick(FN3);
      let expr, terms, parts;
      if (R.bool()) { const f = F(), g = F(), a = A(), b = A(), c1 = R.int(1, 4), c2 = R.int(1, 3) * R.pick([1, -1]);
        const v1 = tv(f, a), v2 = tv(g, b), s1 = vmul(v1, v1), s2 = vmul(v2, v2);
        expr = `${co(c1)}(${f}(${dPi(a)}))^2${c2 < 0 ? '-' : '+'}${co(Math.abs(c2))}(${g}(${dPi(b)}))^2`;
        terms = [[c1 * s1[0], s1[1], s1[2]], [c2 * s2[0], s2[1], s2[2]]]; parts = [[f, a, v1], [g, b, v2]]; }
      else { const f = F(), g = F(), h = F(), a = A(), b = A(), c = A(), k = R.int(1, 3) * R.pick([1, 1, -1]), m = R.pick([1, -1]);
        const v1 = tv(f, a), v2 = tv(g, b), v3 = tv(h, c), p = vmul(v1, v2);
        expr = `${co(k)}${f}(${dPi(a)})${g}(${dPi(b)})${m < 0 ? '-' : '+'}${h}(${dPi(c)})`;
        terms = [[k * p[0], p[1], p[2]], [m * v3[0], v3[1], v3[2]]]; parts = [[f, a, v1], [g, b, v2], [h, c, v3]]; }
      const ans = vsum(terms), chk = E.value(expr), av = E.value(ans);
      if (!chk || !av || Math.abs(chk[0] - av[0]) > 1e-9) throw new Error('V.9.04.e mismatch ' + expr + ' = ' + ans);
      const seen = new Set(), vals = parts.filter(([f, a]) => !seen.has(f + a) && seen.add(f + a)).map(([f, a, v]) => `${f}(${pt(dPi(a))}) = ${pt(vs(v))}`);
      return E.num(`Find the exact value of ${M(expr)}.`, [X(ans, 'value =')], `${vals.join(', ')}. Substituting gives ${pt(ans)}.`); } },
    f: { t: 'pair up the terms', g: R => { const k = R.int(0, 9);
      if (k <= 3) { const s = R.pick([1, 2, 3, 5, 6, 9, 10, 15, 18]), cand = []; for (let a = 0; a < 45; a++) if ((90 - 2 * a) % s === 0 && (90 - 2 * a) / s >= 3) cand.push(a);
        const a = R.pick(cand), b = 90 - a, n = (b - a) / s + 1, f = R.pick(['sin', 'cos']);
        return E.num(`Find the exact value of ${f}²${a}° + ${f}²${a + s}° + ${f}²${a + 2 * s}° + ⋯ + ${f}²${b}°, where the angles go up by ${s}°.`, [X(fr(n, 2), 'sum =')],
          `${f}²(90° − x) = ${f === 'sin' ? 'cos' : 'sin'}²x, so ${f}²x + ${f}²(90° − x) = 1. Pair the first term with the last, the second with the second-to-last, and so on${n % 2 ? `; the middle term is ${f}²45° = 1/2` : ''}. There are ${n} terms, so the sum is ${pt(fr(n, 2))}.`); }
      if (k <= 5) { const s = R.pick([2, 3, 5, 6, 9, 10, 15, 18, 30]), n = 90 / s;
        return E.num(`Find the exact value of sin²0° + sin²${s}° + sin²${2 * s}° + ⋯ + sin²180°, where the angles go up by ${s}°.`, [X(String(n), 'sum =')],
          `From 0° to 90° there are ${n + 1} terms, and pairing sin²x with sin²(90° − x) = cos²x gives ${pt(fr(n + 1, 2))}. Since sin(180° − x) = sin x, the terms from 90° to 180° repeat these, sharing sin²90° = 1. Total: 2 × ${pt(fr(n + 1, 2))} − 1 = ${n}.`); }
      if (k <= 7) { const s = R.pick([1, 2, 3, 5, 6, 9, 10, 15]), cand = []; for (let a = 1; a < 45; a++) if ((90 - 2 * a) % s === 0 && (90 - 2 * a) / s >= 3) cand.push(a); const a = R.pick(cand), b = 90 - a;
        return E.num(`Find the exact value of tan ${a}° · tan ${a + s}° · tan ${a + 2 * s}° · ⋯ · tan ${b}°, where the angles go up by ${s}°.`, [X('1', 'product =')],
          `tan(90° − x) = cos x / sin x = 1/tan x, so tan x · tan(90° − x) = 1. Pair the first factor with the last, and so on${((b - a) / s) % 2 === 0 ? '; the middle factor is tan 45° = 1' : ''}. The product is 1.`); }
      if (k === 8) { const s = R.pick([5, 6, 9, 10, 12, 15, 18, 20, 30]), cand = []; for (let a = 0; a < 90; a++) if ((180 - 2 * a) % s === 0 && (180 - 2 * a) / s >= 3) cand.push(a); const a = R.pick(cand), b = 180 - a;
        return E.num(`Find the exact value of cos ${a}° + cos ${a + s}° + cos ${a + 2 * s}° + ⋯ + cos ${b}°, where the angles go up by ${s}°.`, [X('0', 'sum =')],
          `cos(180° − x) = −cos x, so the first and last terms cancel, the second and second-to-last cancel, and so on${((b - a) / s) % 2 === 0 ? '; the middle term is cos 90° = 0' : ''}. The sum is 0.`); }
      const s = R.pick([5, 6, 9, 10, 12, 15, 18, 20, 30, 36, 40, 45]), cand = []; for (let a = 0; a < 180; a++) if ((360 - 2 * a) % s === 0 && (360 - 2 * a) / s >= 3) cand.push(a); const a = R.pick(cand), b = 360 - a;
      return E.num(`Find the exact value of sin ${a}° + sin ${a + s}° + sin ${a + 2 * s}° + ⋯ + sin ${b}°, where the angles go up by ${s}°.`, [X('0', 'sum =')],
        `sin(360° − x) = −sin x, so the first and last terms cancel, the second and second-to-last cancel, and so on${((b - a) / s) % 2 === 0 ? '; the middle term is sin 180° = 0' : ''}. The sum is 0.`); } },
  });

  /* ================= V.9.05 Reference angles ================= */
  const quadDeg = (R, q) => { let th; do th = 90 * q + R.int(1, 17) * 5; while (th % 90 === 0); return th; };
  const refWhy = th => { const m = mod(th, 360), q = Math.floor(m / 90); return [`${m}° − 0° = ${m}°`, `180° − ${m}° = ${180 - m}°`, `${m}° − 180° = ${m - 180}°`, `360° − ${m}° = ${360 - m}°`][q]; };
  S('V.9.05', 'Reference angles', {
    a: { t: 'find in each quadrant', g: R => { const q = R.int(0, 3), th = quadDeg(R, q), ref = refOf(th);
      return E.num(`Find the reference angle of ${th}°.`, [{ label: 'reference angle =', ans: ref }],
        q === 0 ? `${th}° is in Quadrant I, so it is already the acute angle to the x-axis: ${ref}°.` : `${th}° is in ${QN[q]}. Measure to the x-axis: ${refWhy(th)}.${ref !== 45 ? ` (Not ${90 - ref}°: that is the angle to the y-axis.)` : ''}`, { visual: angFig(th) }); } },
    b: { t: 'in radians', g: R => { const d = R.pick([3, 4, 6, 5, 8, 12]); let n; do n = R.int(1, 2 * d - 1); while ((2 * n) % d === 0 || gcd(n, d) > 1 && R.bool(0.5));
      const t = n / d, q = Math.floor(t * 2), rn = q === 0 ? n : q === 1 ? d - n : q === 2 ? n - d : 2 * d - n, ans = piS(rn, d);
      const how = [`${pt(piS(n, d))} is already acute`, `π − ${pt(piS(n, d))} = ${pt(ans)}`, `${pt(piS(n, d))} − π = ${pt(ans)}`, `2π − ${pt(piS(n, d))} = ${pt(ans)}`][q];
      return E.num(`Find the reference angle of ${M(piS(n, d))}. Give an exact answer.`, [X(ans, 'reference angle =')], `${pt(piS(n, d))} is in ${QN[q]}, so measure to the x-axis: ${how}.`, { visual: angFig(t * 180) }); } },
    c: { t: 'use to evaluate', g: R => { const d0 = R.pick(SPEC.filter(x => x > 90)), rf = refOf(d0), q = Math.floor(d0 / 90);
      if (R.bool(0.4)) { const f = R.pick(FN3), fN = { sin: 'sine', cos: 'cosine', tan: 'tangent' }[f], ans = tvS(f, d0), ng = ans[0] === '-', wq = R.pick([0, 1, 2, 3].filter(z => z !== q)), [xs, ys] = xySign(q);
        let bad = R.int(0, 3); if (bad === 1 && rf === 45) bad = R.pick([0, 2, 3]);
        const sg = n => n ? '−' : '';
        const rows = [`${d0}° is in ${QN[bad === 0 ? wq : q]}.`, `Its reference angle is ${bad === 1 ? 90 - rf : rf}°.`, `${fN[0].toUpperCase() + fN.slice(1)} is ${ng !== (bad === 2) ? 'negative' : 'positive'} in ${QN[q]}.`,
          `So ${f} ${d0}° = ${sg(ng !== (bad === 3))}${f} ${rf}° = ${pt(bad === 3 ? negS(ans) : ans)}.`];
        const why = [`Step 1 is wrong: ${d0}° is between ${90 * q}° and ${90 * q + 90}°, so it is in ${QN[q]}, not ${QN[wq]}.`,
          `Step 2 is wrong: the reference angle is measured to the x-axis, ${refWhy(d0)}. ${90 - rf}° is the angle to the y-axis.`,
          `Step 3 is wrong: in ${QN[q]} x is ${xs} and y is ${ys}, so ${fN} is ${ng ? 'negative' : 'positive'} there.`,
          `Step 4 is wrong: Step 3 says ${fN} is ${ng ? 'negative' : 'positive'} there, so ${f} ${d0}° = ${sg(ng)}${f} ${rf}° = ${pt(ans)}, not ${pt(negS(ans))}.`][bad];
        return brokenQ(`A student uses the reference angle to evaluate ${f} ${d0}°.`, rows, bad, why); }
      if (R.bool(0.45) && rf !== 45) { const f = R.pick(['sin', 'cos']), v = tv(f, d0), s = v[0] < 0 ? '−' : '', o = s ? '' : '−', g = f;
        return E.choice(R, `Which is equal to ${f} ${d0}°?`, `${s}${f} ${rf}°`, [`${o}${g} ${rf}°`, `${s}${g} ${90 - rf}°`, `${o}${g} ${90 - rf}°`],
          `${d0}° is in ${QN[q]} with reference angle ${rf}° (measured to the x-axis, not ${90 - rf}°). ${f} is ${s ? 'negative' : 'positive'} there, so ${f} ${d0}° = ${s}${f} ${rf}°.`, { visual: angFig(d0) }); }
      const f = R.pick(FN3), ans = tvS(f, d0);
      return E.num(`Use the reference angle to find the exact value of ${f} ${d0}°.`, [X(ans, `${f} ${d0}° =`)],
        `Reference angle ${rf}°; ${f} is ${ans[0] === '-' ? 'negative' : 'positive'} in ${QN[q]}. ${f} ${rf}° = ${pt(tvS(f, rf))}, so ${f} ${d0}° = ${pt(ans)}.`); } },
    d: { t: 'negative angles', g: R => {
      if (R.bool(0.7)) { let th; do th = -R.int(1, 143) * 5; while (th % 90 === 0); const m = mod(th, 360), q = Math.floor(m / 90), ref = refOf(th);
        return E.num(`Find the reference angle of ${th}°.`, [{ label: 'reference angle =', ans: ref }],
          `${th}° is coterminal with ${th}° + ${m - th}° = ${m}°, in ${QN[q]}. Reference angle: ${refWhy(m)}.`, { visual: angFig(th) }); }
      const d = R.pick([3, 4, 6]); let n; do n = R.int(1, 2 * d - 1); while ((2 * n) % d === 0); const t = -n / d, pos = 2 * d - n, q = Math.floor(pos * 2 / d), rn = q === 0 ? pos : q === 1 ? d - pos : q === 2 ? pos - d : 2 * d - pos, ans = piS(rn, d);
      return E.num(`Find the reference angle of ${M(piS(-n, d))}. Give an exact answer.`, [X(ans, 'reference angle =')],
        `Add 2π: ${pt(piS(-n, d))} + 2π = ${pt(piS(pos, d))}, in ${QN[q]}. The acute angle to the x-axis is ${pt(ans)}.`, { visual: angFig(t * 180) }); } },
  });

  /* ================= V.9.06 Signs by quadrant ================= */
  const POS = { sin: [1, 1, 0, 0], cos: [1, 0, 0, 1], tan: [1, 0, 1, 0] };
  const xySign = q => [q === 0 || q === 3 ? 'positive' : 'negative', q < 2 ? 'positive' : 'negative'];
  const ASTC = ['All three (sin, cos, tan) are positive', 'Only sine is positive', 'Only tangent is positive', 'Only cosine is positive'];
  S('V.9.06', 'Signs by quadrant', {
    a: { t: 'which are positive where', g: R => { const f = R.pick(FN3), q = R.int(0, 3), pos = POS[f][q], [xs, ys] = xySign(q);
      const why = `In ${QN[q]}, x is ${xs} and y is ${ys}. ${f} θ = ${f === 'sin' ? 'y/r' : f === 'cos' ? 'x/r' : 'y/x'} (r is always positive), so it is ${pos ? 'positive' : 'negative'}.`;
      if (R.bool()) return E.choiceFixed(`θ is in ${QN[q]}. Is ${f} θ positive or negative?`, ['positive', 'negative'], pos ? 0 : 1, why);
      const th = quadDeg(R, q) + R.pick([0, 0, 360, -360]);
      return E.choiceFixed(`Is ${th < 0 ? `${f}(${th}°)` : `${f} ${th}°`} positive or negative?`, ['positive', 'negative'], pos ? 0 : 1, `${th}° ends in ${QN[q]}. ${why}`); } },
    b: { t: 'a memory trick', g: R => { const k = R.int(0, 3), q = R.int(0, 3), L = 'ASTC'[q], W = ['All', 'Students', 'Take', 'Calculus'][q];
      const why = `“All Students Take Calculus” goes counterclockwise from Quadrant I: All in I, Sine in II, Tangent in III, Cosine in IV.`;
      if (k === 0) return E.choiceFixed(`In the memory trick “All Students Take Calculus”, the word for ${QN[q]} is “${W}”. What does it tell you?`, ASTC, q, why);
      if (k === 1 && R.bool(0.6)) { const th = quadDeg(R, q) + R.pick([0, 0, 360, -360]);
        return E.choiceFixed(`θ = ${th}°. Using “All Students Take Calculus”, which ratios of θ are positive?`, ASTC, q, `${th}° ends in ${QN[q]}. ${why}`); }
      if (k === 1) return E.choiceFixed(`Using “All Students Take Calculus”, which ratios are positive in ${QN[q]}?`, ASTC, q, why);
      if (k === 2) return E.choiceFixed(`In which quadrant ${q === 0 ? 'are sine, cosine and tangent all positive' : `is only ${['', 'sine', 'tangent', 'cosine'][q]} positive`}?`, QN, q, why);
      const f = ['', 'sin', 'tan', 'cos'][q || R.int(1, 3)], qq = { sin: 1, tan: 2, cos: 3 }[f], [xs, ys] = xySign(qq);
      return E.choice(R, `Why is only ${f} positive in ${QN[qq]}?`, `There x is ${xs} and y is ${ys}, so only ${f === 'sin' ? 'y/r' : f === 'cos' ? 'x/r' : 'y/x'} is positive`,
        [`There x is ${xs === 'positive' ? 'negative' : 'positive'} and y is ${ys === 'positive' ? 'negative' : 'positive'}, so only ${f === 'sin' ? 'y/r' : f === 'cos' ? 'x/r' : 'y/x'} is positive`, `Because the angle itself is negative there`, `Because r is negative there`],
        `${f} θ = ${f === 'sin' ? 'y/r' : f === 'cos' ? 'x/r' : 'y/x'}, and r is always positive. In ${QN[qq]} x is ${xs} and y is ${ys}, so ${f} is positive and the other two are negative. (That is the “${['Students', 'Take', 'Calculus'][qq - 1]}” in the trick.)`); } },
    c: { t: 'find a quadrant from signs', g: R => { const q = R.int(0, 3), pair = R.pick([['sin', 'cos'], ['sin', 'tan'], ['cos', 'tan']]), words = R.bool();
      const cond = f => words ? `${f} θ is ${POS[f][q] ? 'positive' : 'negative'}` : `${f} θ ${POS[f][q] ? '&gt;' : '&lt;'} 0`;
      const [xs, ys] = xySign(q);
      return E.choiceFixed(`${cond(pair[0])} and ${cond(pair[1])}. In which quadrant is θ?`, QN, q,
        `${pair.map(f => `${f} θ ${POS[f][q] ? 'positive' : 'negative'}: ${[0, 1, 2, 3].filter(z => POS[f][z] === POS[f][q]).map(z => 'I II III IV'.split(' ')[z]).join(' or ')}`).join('; ')}. Both hold only in ${QN[q]} (x ${xs}, y ${ys}).`); } },
    d: { t: 'find all ratios from one', g: R => { const q = R.int(0, 3), sx = q === 0 || q === 3 ? 1 : -1, sy = q < 2 ? 1 : -1, kind = R.int(0, 2); let x2, y2, r2v;
      if (R.bool(0.35)) { const gc = R.bool(), gn = gc ? 'x' : 'y', on = gc ? 'y' : 'x', sg = gc ? sx : sy, so = gc ? sy : sx, bad = R.int(0, 3); let p, d;
        if (R.bool()) { const [a, b, c] = R.pick(TRIP); p = R.pick([a, b]); d = c; } else do { d = R.int(3, 9); p = R.int(1, d - 1); } while (Number.isInteger(Math.sqrt(d * d - p * p)) || gcd(p, d) > 1);
        const o2 = d * d - p * p, OL = lenOf(o2), PL = [p, 1], DL = [d, 1], XL = gc ? PL : OL, YL = gc ? OL : PL;
        const v = { sin: ratio(YL, DL, sy), cos: ratio(XL, DL, sx), tan: ratio(YL, XL, sx * sy) }, flipT = ratio(XL, YL, sx * sy), gf = gc ? 'cos' : 'sin', of = gc ? 'sin' : 'cos';
        const oS = lenS(OL, so), oW = lenS(OL, -so), sgW = s => s > 0 ? 'positive' : 'negative';
        const rows = [`On the terminal side take ${bad === 0 ? on : gn} = ${sg * p} and r = ${d}, since ${gf} θ = ${bad === 0 ? on : gn}/r.`,
          `${on}² = r² ${bad === 1 ? '+' : '−'} ${gn}² = ${d * d} ${bad === 1 ? '+' : '−'} ${p * p} = ${bad === 1 ? d * d + p * p : o2}.`,
          `${on} = ${pt(bad === 2 ? oW : oS)}, because ${on} is ${sgW(bad === 2 ? -so : so)} in ${QN[q]}.`,
          `So ${of} θ = ${pt(v[of])} and tan θ = ${pt(bad === 3 ? flipT : v.tan)}.`];
        const why = [`Step 1 is wrong: ${gf} θ = ${gn}/r, so ${sg * p} is the ${gn}-coordinate, not ${on}.`,
          `Step 2 is wrong: x² + y² = r², so ${on}² = r² − ${gn}² = ${d * d} − ${p * p} = ${o2}.`,
          `Step 3 is wrong: in ${QN[q]} ${on} is ${sgW(so)}, so ${on} = ${pt(oS)}.`,
          `Step 4 is wrong: tan θ = y/x = ${pt(v.tan)}, not x/y.`][bad];
        return brokenQ(`${M(`${gf} θ=${fr(sg * p, d)}`)} and θ is in ${QN[q]}. A student finds the other two ratios.`, rows, bad, why); }
      if (kind === 0) { const [a, b, c] = R.pick(TRIP); [x2, y2] = R.bool() ? [a * a, b * b] : [b * b, a * a]; r2v = c * c; }
      else if (kind === 1) { let p, d; do { d = R.int(3, 9); p = R.int(1, d - 1); } while (Number.isInteger(Math.sqrt(d * d - p * p)) || gcd(p, d) > 1); r2v = d * d; if (R.bool()) { y2 = p * p; x2 = d * d - p * p; } else { x2 = p * p; y2 = d * d - p * p; } }
      else { let p, d; do { p = R.int(1, 7); d = R.int(1, 7); } while (gcd(p, d) > 1 || Number.isInteger(Math.sqrt(p * p + d * d))); y2 = p * p; x2 = d * d; r2v = p * p + d * d; }
      const Xl = lenOf(x2), Yl = lenOf(y2), Rl = lenOf(r2v), val = { sin: ratio(Yl, Rl, sy), cos: ratio(Xl, Rl, sx), tan: ratio(Yl, Xl, sx * sy) };
      const given = kind === 2 ? 'tan' : R.pick(kind === 1 ? (y2 < x2 || R.bool() ? ['sin'] : ['cos']) : ['sin', 'cos', 'tan']), others = FN3.filter(f => f !== given);
      return E.num(`${given} θ = ${M(val[given])} and θ is in ${QN[q]}. Find the other two ratios exactly.`, others.map(f => X(val[f], `${f} θ =`)),
        `Use a point on the terminal side with x = ${pt(lenS(Xl, sx))}, y = ${pt(lenS(Yl, sy))}, r = ${pt(lenS(Rl))}: then x² + y² = r², and in ${QN[q]} x is ${sx > 0 ? 'positive' : 'negative'}, y is ${sy > 0 ? 'positive' : 'negative'}. So ${others.map(f => `${f} θ = ${pt(val[f])}`).join(' and ')}.`); } },
  });

  /* ================= V.9.07 Trig of any angle ================= */
  const ptFig = (x, y) => { const L = Math.hypot(x, y), d = Math.atan2(y, x) * 180 / PI; return angFig(d, { pts: [[1.15 * x / L, 1.15 * y / L, `(${x}, ${y})`]], ext: 1.6, L: 1.15, w: 240, labEnd: true }); };
  const RAT = (f, x, y, r) => f === 'sin' ? [y, r] : f === 'cos' ? [x, r] : [y, x];
  const trPt = R => { const [a, b, c] = R.pick(TRIP.slice(0, 4)), k = R.pick([1, 1, 2, 3]), sw = R.bool(), x = R.pick([1, -1]) * k * (sw ? b : a), y = R.pick([1, -1]) * k * (sw ? a : b); return { x, y, r: k * c }; };
  S('V.9.07', 'Trig of any angle', {
    a: { t: 'from a point (x, y)', g: R => { const P = trPt(R), f = R.pick(FN3), [n, d] = RAT(f, P.x, P.y, P.r), ans = fr(n, d);
      return E.num(`The point (${P.x}, ${P.y}) is on the terminal side of θ, ${P.r} units from the origin. Find ${f} θ.`, [X(ans, `${f} θ =`)],
        `With x = ${P.x}, y = ${P.y}, r = ${P.r}: ${f} θ = ${f === 'sin' ? 'y/r' : f === 'cos' ? 'x/r' : 'y/x'} = ${n}/${d < 0 ? `(${d})` : d}${ans === fr(n, 1) + '/' + d ? '' : ` = ${pt(ans)}`}.`, { visual: ptFig(P.x, P.y) }); } },
    b: { t: 'r = √(x² + y²)', g: R => { const P = trPt(R), f = R.pick(['sin', 'cos']), [n, d] = RAT(f, P.x, P.y, P.r), ans = fr(n, d);
      return E.num(`The point (${P.x}, ${P.y}) is on the terminal side of θ. Find r and ${f} θ.`, [{ label: 'r =', ans: P.r }, X(ans, `${f} θ =`)],
        `r = √((${P.x})² + (${P.y})²) = √${P.r * P.r} = ${P.r}. r is a distance, so it is positive even when x and y are negative. ${f} θ = ${f === 'sin' ? 'y/r' : 'x/r'} = ${n}/${P.r}${ans === `${n}/${P.r}` ? '' : ` = ${pt(ans)}`}.`, { visual: ptFig(P.x, P.y) }); } },
    c: { t: 'exact values', g: R => { let x, y; do { x = R.int(-6, 6); y = R.int(-6, 6); } while (!x || !y || Number.isInteger(Math.sqrt(x * x + y * y)));
      const n2 = x * x + y * y, Rl = lenOf(n2), rt = Rl[0] > 1 ? `(${pt(lenS(Rl))})` : pt(lenS(Rl)), s = ratio([Math.abs(y), 1], Rl, Math.sign(y)), c = ratio([Math.abs(x), 1], Rl, Math.sign(x));
      return E.num(`The point (${x}, ${y}) is on the terminal side of θ. Find the exact values of sin θ and cos θ.`, [X(s, 'sin θ ='), X(c, 'cos θ =')],
        `r = √(${x * x} + ${y * y}) = ${pt(lenS(Rl))}. sin θ = ${y}/${rt} = ${pt(s)} and cos θ = ${x}/${rt} = ${pt(c)} (rationalized).`, { visual: ptFig(x, y) }); } },
    d: { t: 'undefined values', g: R => { const onY = R.bool(), k = R.int(1, 9) * R.pick([1, -1]), x = onY ? 0 : k, y = onY ? k : 0, kind = R.int(0, 2), deg = onY ? (k > 0 ? 90 : 270) : (k > 0 ? 0 : 180);
      const head = `The point (${x}, ${y}) is on the terminal side of θ.`, rr = Math.abs(k);
      if (kind === 0) return E.choiceFixed(`${head} What is tan θ?`, ['−1', '0', '1', 'undefined'], onY ? 3 : 1, onY ? `tan θ = y/x = ${y}/0, and division by 0 is undefined. (The terminal side is vertical.)` : `tan θ = y/x = 0/${x} = 0.`, { visual: ptFig(x, y) });
      if (kind === 1) { const f = R.pick(['sin', 'cos']), v = f === 'sin' ? y / rr : x / rr;
        return E.num(`${head} Find ${f} θ.`, [{ label: `${f} θ =`, ans: v }], `r = ${rr}, so ${f} θ = ${f === 'sin' ? `y/r = ${y}/${rr}` : `x/r = ${x}/${rr}`} = ${v}.`, { visual: ptFig(x, y) }); }
      return E.choiceFixed(`${head} Which of sin θ, cos θ and tan θ is undefined?`, ['sin θ', 'cos θ', 'tan θ', 'none of them'], onY ? 2 : 3,
        onY ? `x = 0, so tan θ = y/x divides by 0 and is undefined. sin θ = ${y / rr} and cos θ = 0 are fine.` : `r = ${rr} is never 0 and x = ${x} ≠ 0, so all three exist: sin θ = 0, cos θ = ${x / rr}, tan θ = 0. (θ = ${deg}°.)`); } },
  });

  /* ================= V.9.08 Graph sine & cosine ================= */
  const AX = [[1, 0], [0, 1], [-1, 0], [0, -1]];
  const sinG = (fns, a, o = {}) => tg({ x: [a - 0.35, a + 2 * PI + 0.25], y: [-1.6, 1.6], xs: PI / 2, xl: o.xl || 1, w: o.w || 320, h: o.h || 170, fns, dots: o.dots, label: o.label || 'graph' });
  S('V.9.08', 'Graph sine & cosine', {
    a: { t: 'from the unit circle', g: R => {
      if (R.bool(0.6)) { const j = R.int(0, 3), f = R.pick(['sin', 'cos']), degs = R.bool(), from = degs ? `${90 * j}°` : (j ? M(piS(j, 2)) : '0'), to = degs ? `${90 * j + 90}°` : M(piS(j + 1, 2));
        const P0 = AX[j], P1 = AX[(j + 1) % 4], i = f === 'cos' ? 0 : 1, up = P1[i] > P0[i];
        return E.choiceFixed(`As θ goes from ${from} to ${to}, the point (cos θ, sin θ) moves a quarter of the way around the unit circle. Does ${f} θ increase or decrease?`, ['increases', 'decreases'], up ? 0 : 1,
          `The point moves from (${P0[0]}, ${P0[1]}) to (${P1[0]}, ${P1[1]}), so its ${i ? 'y' : 'x'}-coordinate, ${f} θ, goes from ${P0[i]} to ${P1[i]}: it ${up ? 'increases' : 'decreases'}. That is the shape of the ${f === 'sin' ? 'sine' : 'cosine'} graph there.`); }
      const k = R.int(-4, 8), f = R.pick(['sin', 'cos']), P = AX[mod(k, 4)], v = f === 'cos' ? P[0] : P[1];
      return E.num(`On the graph of ${M(`y=${f}(x)`)}, what is the height at ${M('x=' + piS(k, 2))}? Use the unit circle.`, [{ label: 'y =', ans: v }],
        `The point at ${pt(piS(k, 2))} on the unit circle is (${P[0]}, ${P[1]}). ${f} is its ${f === 'cos' ? 'x' : 'y'}-coordinate, so y = ${v}.`, { visual: ucFig(k * 90, { arc: k !== 0 }) }); } },
    b: { t: 'key points', g: R => { const f = R.pick(['sin', 'cos']), a = R.pick([0, 0, -PI]), F = f === 'sin' ? Math.sin : Math.cos, k0 = Math.round(a / (PI / 2));
      const keys = []; for (let k = k0; k <= k0 + 4; k++) keys.push([k, Math.round(F(k * PI / 2))]);
      const vis = sinG([{ f: F }], a), dom = `${a ? pt(piS(-1)) : '0'} ≤ x ≤ ${a ? 'π' : '2π'}`, kind = R.int(0, 3);
      if (kind === 0) { const [k, v] = R.pick(keys);
        return E.num(`Use the graph of ${M(`y=${f}(x)`)}. What is y at ${M('x=' + piS(k, 2))}?`, [{ label: 'y =', ans: v }], `${f}(${pt(piS(k, 2))}) = ${v}. The key points of one period are ${keys.map(([kk, vv]) => `(${pt(piS(kk, 2))}, ${vv})`).join(', ')}.`, { visual: vis }); }
      const want = [0, 1, -1][kind - 1], xs = keys.filter(z => z[1] === want).map(z => piS(z[0], 2)), what = ['cross the x-axis', 'reach its maximum, 1', 'reach its minimum, −1'][kind - 1];
      return E.num(`For ${dom}, at which x does ${M(`y=${f}(x)`)} ${what}? Give exact answers.`, [{ label: 'x =', set: xs }], `Reading the key points, y = ${want} at x = ${list(xs.map(pt))}.`, { visual: vis }); } },
    c: { t: 'one full period', g: R => { const a = R.pick([0, -PI, -PI / 2]), aS = piOf(a), bS = piOf(a + 2 * PI), f = R.pick(['sin', 'cos']);
      if (R.bool(0.6)) { const C4 = { sin: Math.sin, cos: Math.cos, '-sin': x => -Math.sin(x), '-cos': x => -Math.cos(x) }, g = k => sinG([{ f: C4[k] }], a, { w: 180, h: 110, xl: 2, label: 'graph choice' });
        const keyX = [a, a + PI / 2, a + PI], F = C4[f];
        return E.choice(R, `Which graph shows one full period of ${M(`y=${f}(x)`)} for ${M(`${aS}<=x<=${bS}`)}?`, g(f), Object.keys(C4).filter(k => k !== f).map(g),
          `Check key points: y = ${f} x is ${keyX.map(x => `${Math.round(F(x)) + 0} at x = ${pt(piOf(x))}`).join(', ')}. Only one graph passes through all of them.`); }
      const what = R.pick(['x-intercepts', 'maximum points', 'minimum points']), want = what[0] === 'x' ? 0 : what[1] === 'a' ? 1 : -1, F = f === 'sin' ? Math.sin : Math.cos, hits = [];
      for (let k = -8; k <= 8; k++) { const x = k * PI / 2; if (x >= a - 1e-9 && x <= a + 2 * PI + 1e-9 && Math.round(F(x)) === want) hits.push(piS(k, 2)); }
      return E.num(`How many ${what} does ${M(`y=${f}(x)`)} have for ${M(`${aS}<=x<=${bS}`)}?`, [{ ans: hits.length }], `On this interval y = ${want} at x = ${list(hits.map(pt))}: ${hits.length} point${hits.length === 1 ? '' : 's'}${hits.length === 3 ? ' (both ends count)' : ''}.`); } },
    d: { t: 'how they relate', g: R => { const k = R.int(0, 4);
      if (k >= 3) { const G0 = ['Given: the point at angle θ on the unit circle is (cos θ, sin θ)', 'Given', []];
        if (R.bool()) { const L = [G0,
            ['Reflecting the point at θ in the line y = x gives the point at π/2 − θ', 'the reflection swaps the angle to the x-axis with the angle to the y-axis', [0], ['a quarter turn adds π/2 to the angle', 'cos is an even function', 'sin is the y-coordinate']],
            ['The point at π/2 − θ is (sin θ, cos θ)', 'reflecting in y = x swaps the coordinates', [1], ['a quarter turn sends (a, b) to (−b, a)', 'cos is an even function', 'sin is the y-coordinate']],
            [M('cos(π/2-θ)=sin θ'), 'cos is the x-coordinate', [2], ['sin is the y-coordinate', 'cos is an even function', 'tan = y/x']],
            [M('cos(θ-π/2)=cos(π/2-θ)'), 'cos is even: cos(−u) = cos u', [0], ['cos is the x-coordinate', 'sin is odd: sin(−u) = −sin u', 'reflecting in y = x swaps the coordinates']],
            [`So ${M('sin θ=cos(θ-π/2)')} for every θ`, 'both equations above equal cos(π/2 − θ)', [], ['cos is the x-coordinate', 'a quarter turn adds π/2 to the angle', 'sin is odd: sin(−u) = −sin u']]];
          return proofQ(R, `Prove that ${M('sin θ=cos(θ-π/2)')} for every θ, so the sine graph is the cosine graph shifted right π/2.`, L,
            'The reflection in y = x gives cos(π/2 − θ) = sin θ, and cos(θ − π/2) = cos(π/2 − θ) because cosine is even. The evenness line does not depend on the reflection lines, so it can come anywhere before the end.'); }
        const L = [G0,
          ['Adding π/2 to the angle turns the point a quarter turn counterclockwise', 'an angle in standard position measures rotation', [0], ['reflecting in y = x swaps the coordinates', 'cos is an even function', 'sin is the y-coordinate']],
          ['A quarter turn counterclockwise sends (a, b) to (−b, a)', 'rotation by 90° about the origin', [0], ['reflection in the line y = x', 'reflection in the x-axis', 'cos is an even function']],
          ['The point at θ + π/2 is (−sin θ, cos θ)', 'apply the quarter turn to (cos θ, sin θ)', [1, 2], ['reflecting in y = x swaps the coordinates', 'cos is an even function', 'sin is odd: sin(−u) = −sin u']],
          [`${M('sin(θ+π/2)=cos θ')}, so the cosine graph is the sine graph shifted left π/2`, 'sin is the y-coordinate', [], ['cos is the x-coordinate', 'cos is an even function', 'tan = y/x']]];
        return proofQ(R, `Prove that ${M('sin(θ+π/2)=cos θ')} for every θ.`, L,
          'Adding π/2 is a quarter turn, which sends (cos θ, sin θ) to (−sin θ, cos θ); the y-coordinate of the new point is cos θ. The two facts about the quarter turn can come in either order.'); }
      if (k === 0) { const toCos = R.bool();
        return E.choice(R, toCos ? `The graph of ${M('y=cos(x)')} is the graph of ${M('y=sin(x)')} shifted…` : `The graph of ${M('y=sin(x)')} is the graph of ${M('y=cos(x)')} shifted…`, toCos ? 'left π/2' : 'right π/2', [toCos ? 'right π/2' : 'left π/2', 'left π', 'up 1'],
          toCos ? 'Sine starts at 0 and cosine starts at 1; sine reaches 1 at π/2, so sliding it left π/2 puts that peak at 0: cos x = sin(x + π/2).' : 'Cosine peaks at x = 0 and sine peaks at x = π/2, so sine is cosine moved right π/2: sin x = cos(x − π/2).'); }
      if (k === 1) { const truth = R.bool(), c = truth ? R.pick([[1, 2], [5, 2], [-3, 2], [9, 2], [-7, 2]]) : R.pick([[-1, 2], [3, 2], [1, 1], [-1, 1], [2, 1], [1, 4], [-5, 2]]), cs = piS(c[0], c[1]), form = R.bool(), diff = piS(2 * c[0] - c[1], 2 * c[1]);
        const st = form ? `cos(x)=sin(x${c[0] < 0 ? '' : '+'}${cs})` : `sin(x)=cos(x${c[0] < 0 ? '+' + cs.slice(1) : '-' + cs})`;
        return E.tf(`True or false: ${M(st)} for every x.`, truth, `${form ? 'sin(x + c) = cos x' : 'cos(x − c) = sin x'} exactly when c differs from π/2 by whole turns of 2π. Here ${pt(cs)} − π/2 = ${pt(diff)}, ${truth ? 'a multiple of 2π, so it is true' : 'not a multiple of 2π, so it is false'}.`); }
      const neg = R.bool(), win = R.bool(), sol = neg ? (win ? ['3pi/4', '7pi/4'] : ['-pi/4', '3pi/4']) : (win ? ['pi/4', '5pi/4'] : ['-3pi/4', 'pi/4']);
      return E.num(`For ${win ? '0 ≤ x ≤ 2π' : '−π ≤ x ≤ π'}, where do the graphs of ${M('y=sin(x)')} and ${M(neg ? 'y=-cos(x)' : 'y=cos(x)')} cross? Give exact answers.`, [{ label: 'x =', set: sol }],
        `They cross where sin x = ${neg ? '−' : ''}cos x, so the point on the unit circle has y = ${neg ? '−x' : 'x'}: angles ${list(sol.map(pt))}, where both are ${neg ? 'equal in size with opposite signs' : 'equal'}.`, { visual: sinG([{ f: Math.sin }, { f: neg ? x => -Math.cos(x) : Math.cos, color: C.red }], win ? 0 : -PI) }); } },
  });

  /* ================= V.9.09 Amplitude & period ================= */
  const AMPS = [[1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [1, 2], [3, 2], [5, 2], [2, 3]];
  const sinFn = (A, B, f = 'sin', C0 = 0, D = 0) => x => A * (f === 'sin' ? Math.sin : Math.cos)(Bval(B) * (x - C0)) + D;
  S('V.9.09', 'Amplitude & period', {
    a: { t: 'A in A sin(Bx)', g: R => { const [p, q] = R.pick(AMPS), s = R.pick([1, -1]), B = R.pick(BS.slice(0, 8)), f = R.pick(['sin', 'cos']), eq = `y=${cf(s * p, q)}${f}(${argS(B)})`;
      if (R.bool(0.3)) { const mx = R.bool();
        return E.num(`What is the ${mx ? 'maximum' : 'minimum'} value of ${M(eq)}?`, [X(fr(mx ? p : -p, q), mx ? 'maximum =' : 'minimum =')], `The amplitude is |${pt(fr(s * p, q))}| = ${pt(fr(p, q))}, so y runs from ${pt(fr(-p, q))} to ${pt(fr(p, q))}.`); }
      return E.num(`What is the amplitude of ${M(eq)}?`, [X(fr(p, q), 'amplitude =')], `The amplitude is |A| = |${pt(fr(s * p, q))}| = ${pt(fr(p, q))}${s < 0 ? '. The minus sign flips the graph but does not change the height of the waves' : ''}. B changes only the period.`); } },
    b: { t: 'period 2π/B', g: R => { const B = R.pick(BS), [p, q] = R.pick(AMPS), f = R.pick(['sin', 'cos']), eq = `y=${cf(R.pick([1, -1]) * p, q)}${f}(${argS(B)})`, ans = perS(B);
      return E.num(`What is the period of ${M(eq)}? Give an exact answer.`, [X(ans, 'period =')], `Period = 2π/B = ${perT(B)}${perT(B) === pt(ans) ? '' : ` = ${pt(ans)}`}${B.p === 1 && B.q === 1 && !B.pi ? '' : `, not 2π × B`}. A bigger B squeezes more waves into the same space.`); } },
    c: { t: 'graph', g: R => { const B = R.pick([{ p: 2, q: 1 }, { p: 1, q: 2 }, { p: 3, q: 1 }]), A = R.int(1, 3) * R.pick([1, -1]), f = R.pick(['sin', 'cos']), Pv = 2 * PI / Bval(B), span = Math.max(2 * PI, Pv);
      const ym = 4.6, G0 = (AA, BB, ff, o = {}) => tg({ x: [-0.4, span + 0.3], y: [-ym, ym], xs: span > 7 ? PI : PI / 2, xl: span > 7 ? 1 : 2, ys: 1, yl: 2, w: o.w || 190, h: o.h || 140, fns: [{ f: sinFn(AA, BB, ff) }], label: o.label || 'graph choice' });
      const eq = `y=${co(A)}${f}(${argS(B)})`;
      if (R.bool(0.6)) { const inv = { p: B.q, q: B.p }, Aw = A > 0 ? (A === 3 ? 1 : A + 1) : (A === -3 ? -1 : A - 1);
        return E.choice(R, `Which graph shows ${M(eq)}?`, G0(A, B, f), [G0(A, inv, f), G0(Aw, B, f), G0(A, B, f === 'sin' ? 'cos' : 'sin')],
          `Amplitude |${A}| = ${Math.abs(A)}, so y runs from ${-Math.abs(A)} to ${Math.abs(A)}; period 2π/B = ${pt(perS(B))}; and ${f === 'sin' ? `sine starts at 0 at x = 0, going ${A > 0 ? 'up' : 'down'}` : `cosine starts at ${A} at x = 0`}.`); }
      return E.num(`The graph shows ${M(`y=A${f}(Bx)`)} with A ${A > 0 ? '&gt;' : '&lt;'} 0 and B &gt; 0. Find the amplitude and the period.`, [{ label: 'amplitude =', ans: Math.abs(A) }, X(perS(B), 'period =')],
        `The graph rises to ${Math.abs(A)} and falls to ${-Math.abs(A)}, so the amplitude is ${Math.abs(A)}. One full wave takes ${pt(perS(B))} along the x-axis, so that is the period.`, { visual: G0(A, B, f, { w: 320, h: 200, label: 'graph' }) }); } },
    d: { t: 'write from a graph', g: R => { const B = R.pick([{ p: 1, q: 1 }, { p: 2, q: 1 }, { p: 1, q: 2 }, { p: 3, q: 1 }, { p: 4, q: 1 }]), A = R.int(1, 4) * R.pick([1, -1]), f = R.pick(['sin', 'cos']), Pv = 2 * PI / Bval(B);
      const span = Math.max(2 * PI, Pv), xs = Pv / 4, top = f === 'sin' ? (A > 0 ? Pv / 4 : 3 * Pv / 4) : (A > 0 ? 0 : Pv / 2), ans = `${co(A)}${f}(${argS(B)})`;
      const vis = tg({ x: [-0.45, span + 0.3], y: [-Math.abs(A) - 1, Math.abs(A) + 1], xs, xl: xs < PI / 4 + 1e-9 ? 2 : 1, ys: 1, w: 330, h: 210, fns: [{ f: sinFn(A, B, f) }], dots: [[top, Math.abs(A), `(${top ? piTxt(top) : '0'}, ${Math.abs(A)})`]] });
      return E.num(`The graph is ${M(`y=A${f}(Bx)`)} with B &gt; 0. Write its equation.`, [{ label: 'y =', expr: ans }],
        `The waves reach ${Math.abs(A)} and ${-Math.abs(A)}, and ${f === 'sin' ? `the graph leaves 0 going ${A > 0 ? 'up' : 'down'}` : `at x = 0 it is at its ${A > 0 ? 'maximum' : 'minimum'}`}, so A = ${A}. One period is ${pt(perS(B))}, so B = 2π ÷ ${/[/]/.test(perS(B)) ? `(${pt(perS(B))})` : pt(perS(B))} = ${pt(fr(B.p, B.q))}. y = ${pt(ans)}.`, { visual: vis }); } },
    e: { t: 'count the solutions on an interval', g: R => { const B = R.int(1, 5), A = R.int(1, 4) * R.pick([1, -1]), f = R.pick(['sin', 'cos']), kind = R.pick(['mid', 'mid', 'zero', 'top', 'bot', 'out']);
      let c, n, why; const a = Math.abs(A), u = `${B === 1 ? '' : B}x`;
      if (kind === 'out') { c = (a + R.int(1, 3)) * R.pick([1, -1]); n = 0; why = `${f}(${u}) would have to be ${pt(fr(c, A))}, outside [−1, 1], so there are none.`; }
      else if (kind === 'mid') { let k; do k = R.int(-(2 * a - 1), 2 * a - 1); while (k === 0); c = k / 2; n = 2 * B; why = `${f}(${u}) = ${pt(fr(k, 2 * A))}, strictly between −1 and 1 and not 0. Each period of ${f}(${u}) hits that value twice, and x from 0 to 2π covers ${B} period${B > 1 ? 's' : ''}: ${2 * B} solutions.`; }
      else if (kind === 'zero') { c = 0; n = f === 'sin' ? 2 * B + 1 : 2 * B; why = f === 'sin' ? `sin(${u}) = 0 when ${u} = kπ, so x = ${B === 1 ? 'kπ' : `kπ/${B}`} for k = 0, 1, …, ${2 * B}: ${2 * B + 1} solutions, counting both ends.` : `cos(${u}) = 0 when ${u} = π/2 + kπ, so x = ${B === 1 ? 'π/2 + kπ' : `(π/2 + kπ)/${B}`} for k = 0, …, ${2 * B - 1}: ${2 * B} solutions.`; }
      else { const top = kind === 'top'; c = top ? a : -a; const one = c / A; n = f === 'cos' && one === 1 ? B + 1 : B;
        why = `${f}(${u}) = ${one}, which happens once per period${f === 'cos' && one === 1 ? `, at x = ${B === 1 ? '2πk' : `k·${pt(piS(2, B))}`} for k = 0, …, ${B} (both ends count): ${B + 1} solutions` : `: ${B} solution${B > 1 ? 's' : ''} on ${B} period${B > 1 ? 's' : ''}`}.`; }
      return E.num(`How many solutions does ${M(`${co(A)}${f}(${u})=${fr(Math.round(c * 2), 2)}`)} have for ${M('0<=x<=2pi')}?`, [{ ans: n }], why); } },
    f: { t: 'the period of a sum', g: R => { const RAT2 = [[1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1], [1, 2], [3, 2], [1, 3], [2, 3], [4, 3], [3, 4], [5, 2], [5, 3]];
      let a, b, c3 = null; do { a = R.pick(RAT2); b = R.pick(RAT2); } while (a[0] * b[1] === b[0] * a[1]);
      if (R.bool(0.25)) { do c3 = R.pick(RAT2); while (c3[0] * a[1] === a[0] * c3[1] || c3[0] * b[1] === b[0] * c3[1]); }
      const fs = [a, b, c3].filter(Boolean), Q = fs.reduce((l, [, q]) => l * q / gcd(l, q), 1), ms = fs.map(([p, q]) => p * Q / q), g = ms.reduce((x, y) => gcd(x, y)), per = piS(2 * Q, g);
      const nm = ['sin', 'cos', R.pick(['sin', 'cos'])], arg = ([p, q]) => argS({ p, q }), expr = 'y=' + fs.map((z, i) => `${i ? '+' : ''}${R.bool(0.2) ? 2 : ''}${nm[i]}(${arg(z)})`).join('');
      const pers = fs.map(([p, q]) => pt(piS(2 * q, p)));
      return E.num(`What is the period of ${M(expr)}, the smallest positive T with y(x + T) = y(x) for all x? Give an exact answer.`, [X(per, 'period =')],
        `The terms have periods ${list(pers)}. The sum repeats when every term does at once, which first happens at the least common multiple of these: ${pt(per)}.`); } },
  });

  /* ================= V.9.10 Phase & vertical shift ================= */
  const CS = [[1, 6], [1, 4], [1, 3], [1, 2], [2, 3]];
  const inner = (B, Cn, Cd) => { const c = piS(Cn, Cd), xm = Cn === 0 ? 'x' : Cn > 0 ? `x-${c}` : `x+${c.replace('-', '')}`; return B.p === 1 && B.q === 1 ? xm : B.q === 1 ? `${B.p}(${xm})` : `(${xm})/${B.q}`; };
  const wrap = a => /\(/.test(a) ? `(${a})` : a;
  const shTxt = (n, d) => `${pt(piS(Math.abs(n), d))} to the ${n > 0 ? 'right' : 'left'}`;
  S('V.9.10', 'Phase & vertical shift', {
    a: { t: 'horizontal shift', g: R => { const [n, d] = R.pick(CS), s = R.pick([1, -1]), f = R.pick(['sin', 'cos']), B = R.pick([{ p: 1, q: 1 }, { p: 1, q: 1 }, { p: 2, q: 1 }, { p: 3, q: 1 }, { p: 1, q: 2 }]);
      const eq = `y=${f}(${wrap(inner(B, s * n, d))})`, right = shTxt(s * n, d), Bv = B.p / B.q, alt = Bv === 1 ? shTxt(s * n, 2 * d) : shTxt(s * n * B.p, d * B.q);
      return E.choice(R, `How is the graph of ${M(eq)} shifted from ${M(`y=${f}(${argS(B)})`)}?`, right, [shTxt(-s * n, d), alt, `${pt(piS(n, d))} ${s > 0 ? 'down' : 'up'}`],
        `In the form ${f}(B(x − C)), the shift is C. Here ${pt(`${f}(${inner(B, s * n, d)})`)} has C = ${pt(piS(s * n, d))}, so the graph moves ${right}${Bv !== 1 ? ` (the factor ${pt(fr(B.p, B.q))} outside the bracket does not change the shift)` : ''}.`); } },
    b: { t: 'midline', g: R => { const [p, q] = R.pick(AMPS.slice(0, 6)), s = R.pick([1, -1]), B = R.pick(BS.slice(0, 6)), D = R.pick([-4, -3, -2, -1, 1, 2, 3, 4, 5]), f = R.pick(['sin', 'cos']);
      const eq = `y=${cf(s * p, q)}${f}(${argS(B)})${signed(D)}`, A = p / q;
      return E.num(`For ${M(eq)}, find the midline and the maximum and minimum values.`, [{ label: 'midline: y =', ans: D }, X(fr(D * q + p, q), 'maximum ='), X(fr(D * q - p, q), 'minimum =')],
        `The midline is y = D = ${D}. The amplitude is ${pt(fr(p, q))}, so y goes from ${D} − ${pt(fr(p, q))} = ${pt(fr(D * q - p, q))} up to ${D} + ${pt(fr(p, q))} = ${pt(fr(D * q + p, q))}${s < 0 ? ' (the minus sign flips the wave, but the max and min stay the same)' : ''}.`); } },
    c: { t: 'graph a full transformation', g: R => { const B = R.pick([2, 3]), [cn, cd] = R.pick([[1, 2], [1, 3], [2, 3], [1, 1], [1, 4], [3, 4]]), s = R.pick([1, -1]), A = R.int(1, 4) * R.pick([1, 1, -1]), D = R.int(-3, 3), f = R.pick(['sin', 'cos']);
      const c = piS(cn, cd), sh = piS(s * cn, cd * B), eq = `y=${co(A)}${f}(${B}x${s > 0 ? '-' : '+'}${c})${signed(D)}`, k = R.int(0, 2);
      if (k === 0) return E.choice(R, `How is the graph of ${M(eq)} shifted sideways from ${M(`y=${co(A)}${f}(${B}x)${signed(D)}`)}?`, shTxt(s * cn, cd * B), [shTxt(s * cn, cd), shTxt(-s * cn, cd * B), shTxt(-s * cn, cd)],
        `Factor out B first: ${B}x ${s > 0 ? '−' : '+'} ${pt(c)} = ${B}(x ${s > 0 ? '−' : '+'} ${pt(piS(cn, cd * B))}), so the shift is ${shTxt(s * cn, cd * B)}, not ${pt(c)}.`);
      if (k === 1) return E.num(`For ${M(eq)}, find the amplitude, the period, and the phase shift (positive means right, negative means left). Give exact answers.`, [{ label: 'amplitude =', ans: Math.abs(A) }, X(piS(2, B), 'period ='), X(sh, 'phase shift =')],
        `Amplitude |${A}| = ${Math.abs(A)}; period 2π/${B} = ${pt(piS(2, B))}. Factor out ${B}: ${B}(x ${s > 0 ? '−' : '+'} ${pt(piS(cn, cd * B))}), so the phase shift is ${pt(sh)}.`);
      const st = piS(s * cn, cd * B), en = piS(s * cn * 1 + 2 * cd, cd * B);
      return E.num(`One cycle of ${M(eq)} starts where the inside of the bracket is 0 and ends where it is 2π. Find where that cycle starts and ends. Give exact answers.`, [X(st, 'starts at x ='), X(en, 'ends at x =')],
        `${B}x ${s > 0 ? '−' : '+'} ${pt(c)} = 0 gives x = ${pt(st)}; ${B}x ${s > 0 ? '−' : '+'} ${pt(c)} = 2π gives x = ${pt(en)}. That is one period, ${pt(piS(2, B))}, long.`); } },
    d: { t: 'write from a graph', g: R => { const B = R.pick([{ p: 1, q: 1 }, { p: 2, q: 1 }, { p: 1, q: 2 }]), Pv = 2 * PI / Bval(B), A = R.int(1, 3), D = R.int(-2, 2);
      const step = B.p === 2 ? R.pick([[1, 8], [1, 4], [1, 6]]) : B.q === 2 ? R.pick([[1, 2], [1, 1], [1, 3], [2, 3]]) : R.pick([[1, 4], [1, 3], [1, 6], [1, 2]]), C0 = step[0] * PI / step[1];
      const ans = `${co(A)}sin(${inner(B, step[0], step[1])})${signed(D)}`, top = C0 + Pv / 4;
      const vis = tg({ x: [-Pv / 4 - 0.2, 7 * Pv / 4 + 0.2], y: [Math.min(D - A, 0) - 1, Math.max(D + A, 0) + 1], xs: Pv / 4, ys: 1, w: 340, h: 220, fns: [{ f: sinFn(A, B, 'sin', C0, D) }], hlines: [{ y: D }],
        dots: [[C0, D, `(${piTxt(C0)}, ${D})`, 'left'], [top, D + A, `(${piTxt(top)}, ${D + A})`]] });
      return E.num(`The graph is ${M('y=Asin((B(x-C)))+D')} with A &gt; 0, B &gt; 0. The dashed line is the midline, and a cycle starts at the first marked point. Write its equation.`, [{ label: 'y =', expr: ans }],
        `Midline y = ${D}, so D = ${D}; the max is ${D + A}, so A = ${A}. The quarter period from start to peak is ${pt(piOf(Pv / 4))}, so the period is ${pt(perS(B))} and B = ${pt(fr(B.p, B.q))}. The cycle starts at x = ${piTxt(C0)}, so C = ${piTxt(C0)}: y = ${pt(ans)}.`, { visual: vis }); } },
    e: { t: 'rewrite as a shifted sine', g: R => { const B = R.pick([{ p: 1, q: 1 }, { p: 2, q: 1 }, { p: 3, q: 1 }, { p: 1, q: 2 }]), Bv = Bval(B), Pv = 2 * PI / Bv, A = R.int(1, 4), D = R.int(-3, 3), [cn, cd] = R.pick([[1, 6], [1, 4], [1, 3], [1, 2], [2, 3], [3, 4], [5, 6]]);
      const C0 = cn * PI / cd * (B.q === 2 ? 2 : 1) / (B.p === 1 ? 1 : B.p), cos = R.bool(), Cs = piOf(C0), h = mod(C0 - (cos ? Pv / 4 : Pv / 2), Pv), hs = piOf(h);
      [0.4, 1.3, 2.9].forEach(x => { const g = (cos ? A * Math.cos(Bv * (x - C0)) : -A * Math.sin(Bv * (x - C0))), w = A * Math.sin(Bv * (x - h)); if (Math.abs(g - w) > 1e-9) throw new Error('V.9.10.e check'); });
      const given = `y=${cos ? co(A) : co(-A)}${cos ? 'cos' : 'sin'}(${wrap(inner(B, ...toPi(C0)))})${signed(D)}`;
      return E.num(`Write ${M(given)} as ${M(`y=${co(A)}sin(${wrap(inner(B, 1, 1).replace('pi', 'h'))})${signed(D)}`)}. Find the smallest h ≥ 0. Give an exact answer.`, [X(hs, 'h =')],
        `${cos ? 'cos u = sin(u + π/2)' : '−sin u = sin(u + π)'}, a shift left by ${cos ? 'a quarter' : 'half a'} period, ${pt(piOf(cos ? Pv / 4 : Pv / 2))}. So h = ${pt(Cs)} − ${pt(piOf(cos ? Pv / 4 : Pv / 2))}${h > C0 - (cos ? Pv / 4 : Pv / 2) + 1e-9 ? ` = ${pt(piOf(C0 - (cos ? Pv / 4 : Pv / 2)))}; add one period, ${pt(piOf(Pv))}, to make it ≥ 0: h = ${pt(hs)}` : ` = ${pt(hs)}`}.`); } },
    f: { t: 'every shift that fits', g: R => { const B = R.int(2, 6), tgt = R.int(0, 3), left = R.bool(), names = [`sin(${B}x)`, `-sin(${B}x)`, `cos(${B}x)`, `-cos(${B}x)`];
      const ph = [0, PI, PI / 2, -PI / 2][tgt], TF = [x => Math.sin(B * x), x => -Math.sin(B * x), x => Math.cos(B * x), x => -Math.cos(B * x)][tgt];                          // sin(Bx + ph) equals the target
      // right shift: sin(Bx − BC) → −BC ≡ ph; left shift: BC ≡ ph (mod 2π)
      const C0 = mod((left ? ph : -ph) / B, 2 * PI / B), Cs = []; for (let k = 0; k < B; k++) { const c = C0 + 2 * PI * k / B; if (c > 1e-9 && c < 2 * PI - 1e-9) Cs.push(c); }
      Cs.forEach(c => [0.3, 1.1, 2.7].forEach(x => { if (Math.abs(Math.sin(B * (left ? x + c : x - c)) - TF(x)) > 1e-9) throw new Error('V.9.10.f check'); }));
      const sum = Cs.reduce((a, b) => a + b, 0), shifted = left ? `y=sin((${B}(x+C)))` : `y=sin((${B}(x-C)))`;
      return E.num(`For how many values of C with ${M('0<C<2pi')} is the graph of ${M(shifted)} the same as the graph of ${M('y=' + names[tgt])}? Find the sum of all such C. Give an exact answer.`, [{ label: 'how many', ans: Cs.length }, X(piOf(sum), 'sum =')],
        `sin(${B}x ${left ? '+' : '−'} ${B}C) matches ${pt(names[tgt])} when ${left ? '' : '−'}${B}C = ${ph ? pt(piS(...toPi(ph))) + ' + ' : ''}2πk. So C = ${C0 ? pt(piOf(C0)) + ' + ' : ''}k·${pt(piS(2, B))}: ${list(Cs.map(c => pt(piOf(c))))}. Their sum is ${pt(piOf(sum))}.`); } },
  });

  /* ================= V.9.11 Periodic models ================= */
  const clock = h => { const H = Math.floor(h), m = Math.round((h - H) * 60); return `${H % 12 || 12}:${String(m).padStart(2, '0')} ${H % 24 < 12 ? 'a.m.' : 'p.m.'}`; };
  S('V.9.11', 'Periodic models', {
    a: { t: 'tides', g: R => { const Ht = R.int(28, 62), Lt = R.int(2, 22), H = Ht / 10, L = Lt / 10, per = R.pick([12, 12.4]), t1 = R.int(0, 9) + R.pick([0, 0.5]), amp = (Ht - Lt) / 20, mid = (Ht + Lt) / 20, half = per / 2;
      const flds = R.sample([{ label: 'amplitude (m) =', ans: amp }, { label: 'midline (m) =', ans: mid }, { label: 'period (hours) =', ans: per }], 2);
      return E.num(`A high tide of ${H} m comes at ${clock(t1)}, and the next low tide, ${L} m, at ${clock(t1 + half)} Model the depth with a sine curve. Find the ${flds.map(f => f.label.split(' ')[0]).join(' and the ')}.`, flds,
        `Midline = (${H} + ${L}) ÷ 2 = ${mid} m. Amplitude = (${H} − ${L}) ÷ 2 = ${amp} m: half the range, not the maximum. High to low is half a period, ${half} h, so the period is ${per} h.`); } },
    b: { t: 'Ferris wheels', g: R => { const dia = R.int(5, 30) * 4, low = R.int(1, 5), T = R.pick([4, 5, 6, 8, 10, 12, 15, 20, 30]), A = dia / 2, D = low + A, k = R.int(0, 2);
      const hd = T => `A Ferris wheel is ${dia} m across, its lowest seat is ${low} m above the ground, and it turns once every ${T} minutes. A rider gets on at the bottom.`, head = hd(T);
      if (k === 0) return E.num(`${head} Model the height as ${M('h(t)=D-Acos(Bt)')}, with t in minutes. Find A, D and B. Give B exactly.`, [{ label: 'A =', ans: A }, { label: 'D =', ans: D }, X(piS(2, T), 'B =')],
        `A is the radius, ${A} m. D is the height of the center, ${low} + ${A} = ${D} m. B = 2π/period = 2π/${T} = ${pt(piS(2, T))}. The minus sign starts the rider at the bottom.`);
      if (k === 1) { const [n, d, why] = R.pick([[1, 4, 'level with the center'], [1, 2, 'at the top'], [3, 4, 'level with the center again'], [1, 6, 'a sixth of the way round'], [1, 3, 'a third of the way round'], [2, 3, 'two thirds of the way round'], [5, 6, 'five sixths of the way round']]);
        const T2 = R.pick([4, 5, 6, 8, 10, 12, 15, 20, 30].filter(z => (z * n) % d === 0)), t = T2 * n / d, c2 = Math.round(Math.cos(2 * PI * n / d) * 2), h = D - A * c2 / 2;
        return E.num(`${hd(T2)} How high is the rider after ${t} minutes?`, [{ label: 'height (m) =', ans: h }], `${t} min is ${n}/${d} of a turn, ${why}. h = ${D} − ${A}·cos(${pt(piS(2 * n, d))}) = ${D} − ${A} × (${pt(fr(c2, 2))}) = ${h} m.`); }
      return E.num(`${head} What is the greatest height, and how many minutes after boarding is it first reached?`, [{ label: 'height (m) =', ans: D + A }, { label: 'time (min) =', ans: T / 2 }],
        `The top is ${dia} m above the lowest seat: ${low} + ${dia} = ${D + A} m. It is half a turn from the bottom, ${T} ÷ 2 = ${T / 2} minutes.`); } },
    c: { t: 'daylight hours', g: R => { const Mx = R.int(26, 37) / 2, mn = R.int(12, 21) / 2, A = (Mx - mn) / 2, D = (Mx + mn) / 2, k = R.int(0, 2);
      const head = `In one city the longest day (day 172) has ${Mx} hours of daylight and the shortest (day 355) has ${mn} hours. Model daylight as ${M('y=Asin((B(t-80)))+D')}, t in days.`;
      if (k === 0) return E.num(`${head} Find A, D and B. Give B exactly.`, [{ label: 'A =', ans: A }, { label: 'D =', ans: D }, X('2pi/365', 'B =')], `D = (${Mx} + ${mn}) ÷ 2 = ${D}; A = (${Mx} − ${mn}) ÷ 2 = ${A}; one cycle is a year, so B = 2π/365.`);
      if (k === 1) return E.num(`${head} How many hours of daylight does the model give for day 80, the spring equinox?`, [{ label: 'hours =', ans: D }], `At t = 80 the sine is sin 0 = 0, so y = D = (${Mx} + ${mn}) ÷ 2 = ${D} hours.`);
      const t = R.pick([80 + 365 / 4, 80 + 365 / 2, 80 + 3 * 365 / 4]), f = (t - 80) / 365, v = D + A * Math.round(Math.sin(2 * PI * f));
      return E.num(`${head} What does the model give for day ${t}?`, [{ label: 'hours =', ans: v }], `t − 80 = ${t - 80} = ${f === 0.25 ? 'a quarter' : f === 0.5 ? 'half' : 'three quarters'} of 365, so the sine is sin(${pt(piS(f * 4, 2))}) = ${Math.round(Math.sin(2 * PI * f))}: y = ${D} ${Math.round(Math.sin(2 * PI * f)) < 0 ? '−' : '+'} ${Math.round(Math.sin(2 * PI * f)) ? A : 0} = ${v} hours.`); } },
    d: { t: 'fit a model to data', g: R => { const P = R.pick([4, 8, 12, 16, 20, 24]), q4 = P / 4, A = R.int(1, 6), D = R.int(A + 1, 12), j = R.int(0, 3), C0 = j * q4, n = R.pick([5, 6, 7]), ts = [...Array(n).keys()].map(i => i * q4);
      const ys = ts.map(t => D + A * Math.round(Math.sin(2 * PI * (t - C0) / P))), tbl = `<table class="dt"><tr><th>t</th>${ts.map(t => `<td>${t}</td>`).join('')}</tr><tr><th>y</th>${ys.map(y => `<td>${y}</td>`).join('')}</tr></table>`;
      const Bs = piS(2, P), ans = `${co(A)}sin(${C0 ? `pi(t-${C0})/${P / 2}` : `pit/${P / 2}`})+${D}`;
      if (R.bool(0.4)) return E.num(`The data follow one sine wave ${M('y=Asin((B(t-C)))+D')} with A &gt; 0. Find A, B and D. Give B exactly.${tbl}`, [{ label: 'A =', ans: A }, X(Bs, 'B ='), { label: 'D =', ans: D }],
        `Max ${D + A}, min ${D - A}: D = ${D} (the middle) and A = ${A} (half the range). Max to next max is ${P}, so B = 2π/${P} = ${pt(Bs)}.`);
      return E.num(`The data follow one sine wave. Write a model ${M('y=Asin((B(t-C)))+D')} with A &gt; 0.${tbl}`, [{ label: 'y =', expr: ans }],
        `D = (${D + A} + ${D - A}) ÷ 2 = ${D}, A = ${A}, period ${P} so B = ${pt(Bs)}. The wave crosses the midline going up at t = ${C0}, so C = ${C0}: y = ${pt(ans)}. (Any equivalent form, such as a different C one period away, is also right.)`); } },
  });

  /* ================= V.9.12 Graph tangent ================= */
  const tanG = (o = {}) => tg({ x: o.x || [-PI - 0.3, 2 * PI + 0.3], y: [-4, 4], xs: PI / 2, ys: 1, yl: 2, w: o.w || 330, h: o.h || 200, fns: [{ f: o.f || Math.tan }], vlines: o.vlines, dots: o.dots, label: 'tangent graph' });
  S('V.9.12', 'Graph tangent', {
    a: { t: 'asymptotes', g: R => { const k = R.int(0, 2);
      if (k === 0) { const a = R.int(-2, 1), L = R.int(2, 3), xs = []; for (let m = -8; m <= 8; m++) { const v = (2 * m + 1) / 2; if (v > a && v < a + L) xs.push(piS(2 * m + 1, 2)); }
        return E.num(`List the vertical asymptotes of ${M('y=tan(x)')} for ${M(`${piS(a)}<=x<=${piS(a + L)}`)}. Give exact answers.`, [{ label: 'x =', set: xs }],
          `tan x = sin x / cos x has an asymptote wherever cos x = 0: x = π/2 + kπ. In this interval: ${list(xs.map(pt))}.`, { visual: tanG() }); }
      if (k === 1) return E.choice(R, `${R.pick(['Where', 'At which x-values'])} does ${M('y=tan(x)')} have vertical asymptotes?`, `where ${M('cos(x)=0')}`, [`where ${M('sin(x)=0')}`, `where ${M('tan(x)=0')}`, `where ${M('cos(x)=1')}`],
        'tan x = sin x / cos x, so it blows up where the denominator cos x is 0. Where sin x = 0, tan x is just 0.');
      const truth = R.bool(), dd = truth ? 2 : R.pick([1, 4]), num = truth ? 2 * R.int(-3, 3) + 1 : (dd === 1 ? R.int(-2, 3) : R.pick([1, 3, 5, -1, -3, 7]));
      const xv = piS(num, dd), isA = Math.abs(mod(num / dd - 0.5, 1)) < 1e-9;
      return E.tf(`Does ${M('y=tan(x)')} have a vertical asymptote at ${M('x=' + xv)}?`, isA, `Asymptotes are at π/2 + kπ, where cos x = 0. cos(${pt(xv)}) ${isA ? '= 0, so yes' : `≠ 0, so no: tan(${pt(xv)}) = ${Math.round(Math.tan(num / dd * PI)) + 0}`}.`, YN); } },
    b: { t: 'period π', g: R => {
      if (R.bool(0.65)) { const B = R.pick([{ p: 2, q: 1 }, { p: 3, q: 1 }, { p: 4, q: 1 }, { p: 1, q: 2 }, { p: 1, q: 3 }, { p: 2, q: 3 }, { p: 3, q: 2 }, { p: 1, q: 1, pi: true }, { p: 1, q: 4 }]), A = R.int(1, 4) * R.pick([1, -1]);
        const ans = B.pi ? fr(B.q, B.p) : piS(B.q, B.p);
        return E.num(`What is the period of ${M(`y=${co(A)}tan(${argS(B)})`)}? Give an exact answer.`, [X(ans, 'period =')], `tan repeats every π, so tan(Bx) repeats every π/B = ${pt(ans)}. (Not 2π/B: that is for sine and cosine.)`); }
      const truth = R.bool(), c = truth ? R.pick([[1, 1], [2, 1], [-1, 1], [3, 1], [-2, 1]]) : R.pick([[1, 2], [3, 2], [-1, 2], [1, 4], [1, 3]]), cs = piS(...c);
      return E.tf(`True or false: ${M(`tan(x${c[0] < 0 ? '' : '+'}${cs})=tan(x)`)} for every x where both sides are defined.`, truth, `tan has period π, so the shift must be a whole number of π's. ${pt(cs)} ${truth ? 'is' : 'is not'} a multiple of π.`); } },
    c: { t: 'key points', g: R => {
      if (R.bool(0.55)) { const want = R.int(0, 3), r4 = [3, 0, 1, 2][want], cand = []; for (let k = -3; k <= 8; k++) if (mod(k, 4) === r4) cand.push(k); const k = R.pick(cand), xv = piS(k, 4);
        return E.choiceFixed(`What is ${M(`tan(${xv})`)}?`, ['−1', '0', '1', 'undefined'], want, want === 3 ? `cos(${pt(xv)}) = 0, so tan is undefined there: an asymptote.` : k === mod(k, 4) ? `Use the unit circle: tan(${pt(xv)}) = ${['−1', '0', '1'][want]}.` : `tan repeats every π, so tan(${pt(xv)}) = tan(${pt(piS(mod(k, 4), 4))}) = ${['−1', '0', '1'][want]}.`, { visual: tanG() }); }
      const d0 = R.pick([30, 60, 120, 150, 210, 240, 300, 330, -30, -60]), ans = tvS('tan', d0);
      return E.num(`Find the exact value of ${M(`tan(${dPi(d0)})`)}.`, [X(ans, 'tan =')], `Reference angle ${refOf(d0)}°, and tan is ${ans[0] === '-' ? 'negative' : 'positive'} in that quadrant: ${pt(ans)}.`); } },
    d: { t: 'transformations', g: R => { const B = R.pick([{ p: 1, q: 2 }, { p: 2, q: 1 }, { p: 3, q: 1 }, { p: 1, q: 3 }, { p: 1, q: 1 }]), A = R.int(1, 3) * R.pick([1, -1]), D = R.int(-3, 3), Bv = B.p / B.q;
      const eq = `y=${co(A)}tan(${argS(B)})${signed(D)}`, per = piS(B.q, B.p), asy = piS(B.q, 2 * B.p), at = piS(B.q, 4 * B.p);
      const F = [X(per, 'period ='), X(asy, 'first asymptote right of 0: x ='), { label: `y at x = ${pt(at)} is`, ans: A + D }], pick = R.sample([0, 1, 2], 2).sort();
      return E.num(`For ${M(eq)}, find the ${pick.map(i => ['period', 'first vertical asymptote to the right of x = 0', `value of y at x = ${pt(at)}`][i]).join(' and the ')}. Give exact answers.`, pick.map(i => F[i]),
        `Period π/B = ${pt(per)}. Asymptotes where ${pt(argS(B))} = π/2, so x = ${pt(asy)}. At x = ${pt(at)}, ${pt(argS(B))} = π/4 and tan(π/4) = 1, so y = ${A} × 1${D ? ` ${D < 0 ? '−' : '+'} ${Math.abs(D)}` : ''} = ${A + D}.`,
        { visual: tg({ x: [-0.15 * PI * B.q / B.p, 2 * PI * B.q / B.p * 1.04], y: [D - 5, D + 5], xs: B.q / B.p * PI / 4, xl: 2, ys: 1, yl: 2, w: 330, h: 210, fns: [{ f: x => A * Math.tan(Bv * x) + D }] }) }); } },
  });

  /* ================= V.9.13 Reciprocal function graphs ================= */
  const REC = { csc: 'sin', sec: 'cos', cot: 'tan' };
  const recVal = (g, deg) => { const v = tv(REC[g], deg); if (g === 'cot') { if (!v) return '0'; if (v[0] === 0) return null; } else if (!v || v[0] === 0) return null; return recip(v); };
  const recAsy = (g, a, L) => { const xs = []; for (let m = -12; m <= 12; m++) { const v = g === 'sec' ? (2 * m + 1) / 2 : m; if (v > a + 1e-9 && v < a + L - 1e-9) xs.push(g === 'sec' ? piS(2 * m + 1, 2) : piS(m)); } return xs; };
  const recStep = g => ({
    a: { g: R => { const k = R.int(0, 2), part = REC[g];
      if (k === 0) { let d0; do d0 = R.pick([...SPEC, 90, 270, 0, 180]); while (recVal(g, d0) === null); const ans = recVal(g, d0), base = tvS(part, d0);
        return E.num(`Find the exact value of ${M(`${g}(${dPi(d0)})`)}.`, [X(ans, `${g} =`)], base === null ? `tan(${pt(dPi(d0))}) does not exist, so use cot x = cos x / sin x instead: cos(${pt(dPi(d0))}) = 0, so cot(${pt(dPi(d0))}) = 0.` : `${g} x = 1/${part} x. ${part}(${pt(dPi(d0))}) = ${pt(base)}, so ${g}(${pt(dPi(d0))}) = ${pt(ans)}.`); }
      if (k === 1) { const a = R.int(-2, 0), L = R.int(2, 3), xs = recAsy(g, a, L);
        return E.num(`List the vertical asymptotes of ${M(`y=${g}(x)`)} for ${M(`${piS(a)}<x<${piS(a + L)}`)}. Give exact answers.`, [{ label: 'x =', set: xs }],
          `${g} x has an asymptote wherever ${g === 'cot' ? 'tan x = 0, that is where sin x = 0' : part + ' x = 0'}: ${g === 'sec' ? 'x = π/2 + kπ' : 'x = kπ'}. In this interval: ${list(xs.map(pt))}.`, { visual: recG(g) }); }
      if (g === 'cot') { const a = R.int(-1, 0), xs = recAsy('sec', a, 2);
        return E.num(`Find the x-intercepts of ${M('y=cot(x)')} for ${M(`${piS(a)}<x<${piS(a + 2)}`)}. Give exact answers.`, [{ label: 'x =', set: xs }], `cot x = cos x / sin x is 0 where cos x = 0 (and sin x ≠ 0): x = π/2 + kπ. Here: ${list(xs.map(pt))}. (These are where tan x has its asymptotes.)`, { visual: recG(g) }); }
      const top = R.bool(), f = g === 'csc' ? Math.sin : Math.cos, xs = []; for (let k = -4; k <= 8; k++) { const x = k * PI / 2; if (x > -PI - 1e-9 && x < 2 * PI + 1e-9 && Math.round(f(x)) === (top ? 1 : -1)) xs.push(k); }
      const k2 = R.pick(xs), xv = piS(k2, 2);
      return E.num(`At ${M('x=' + xv)}, ${M(`${part}(x)=${top ? 1 : -1}`)}. What is ${M(`${g}(x)`)} there?`, [{ label: `${g} =`, ans: top ? 1 : -1 }],
        `${g} x = 1/${part} x = 1/(${top ? 1 : -1}) = ${top ? 1 : -1}. Where ${part} has a ${top ? 'peak' : 'trough'}, ${g} has a matching ${top ? 'lowest point of an upward' : 'highest point of a downward'} U.`, { visual: recG(g) }); } },
  });
  const recG = g => { const F = { csc: x => 1 / Math.sin(x), sec: x => 1 / Math.cos(x), cot: x => 1 / Math.tan(x) }[g], P = { csc: Math.sin, sec: Math.cos, cot: Math.tan }[g];
    return tg({ x: [-PI - 0.3, 2 * PI + 0.3], y: [-4, 4], xs: PI / 2, ys: 1, yl: 2, w: 330, h: 200, fns: [{ f: P, color: C.line, dash: true }, { f: F, color: C.blue }], label: `graph of ${g}` }); };
  S('V.9.13', 'Reciprocal function graphs', {
    a: { t: 'csc from sin', g: recStep('csc').a.g },
    b: { t: 'sec from cos', g: recStep('sec').a.g },
    c: { t: 'cot from tan', g: recStep('cot').a.g },
    d: { t: 'asymptotes and ranges', g: R => {
      if (R.bool(0.35)) { const g = R.pick(['csc', 'sec']), r = REC[g], nm = { csc: 'cosecant', sec: 'secant' }[g], rn = { sin: 'sine', cos: 'cosine' }[r], o = r === 'sin' ? 'cos' : 'sin';
        const L = [[`Given: x is in the domain of ${g}, so ${r} x ≠ 0`, 'Given', []],
          [`${M(`-1<=${r} x<=1`)}, so |${r} x| is positive and at most 1`, `the range of ${rn} is [−1, 1]`, [0], [`the definition of ${nm}`, 'the Pythagorean identity', `${g} has period 2π`]],
          [`|${g} x| = 1/|${r} x|`, `${g} x = 1/${r} x`, [0], [`the range of ${rn} is [−1, 1]`, `${g} x = 1/${o} x`, 'the Pythagorean identity']],
          [`|${g} x| ≥ 1`, '1 divided by a positive number at most 1 is at least 1', [1, 2], [`the range of ${rn} is [−1, 1]`, 'dividing by a smaller number gives a smaller result', `${g} x = 1/${r} x`]],
          [`${g} x is never strictly between −1 and 1, so its range is (−∞, −1] ∪ [1, ∞)`, 'a number with absolute value at least 1 is ≤ −1 or ≥ 1', [], ['the range of a reciprocal is the reciprocal of the range', `${g} has asymptotes where ${r} x = 0`, `the range of ${rn} is [−1, 1]`]]];
        return proofQ(R, `Prove that the range of ${M(`y=${g}(x)`)} is (−∞, −1] ∪ [1, ∞).`, L,
          `|${r} x| is at most 1, so its reciprocal |${g} x| is at least 1. The range fact and the definition can come in either order.`); }
      const k = R.int(0, 2);
      if (k === 0) { const g = R.pick(['csc', 'sec', 'sec', 'csc', 'cot']), A = R.int(1, 4) * R.pick([1, -1]), D = R.int(-3, 3), eq = `y=${co(A)}${g}(x)${signed(D)}`;
        if (g === 'cot') return E.num(`What is the range of ${M(eq)}? Answer in interval notation.`, [{ interval: '(-inf,inf)' }], 'cot x takes every real value between each pair of asymptotes, so stretching and shifting it still gives all real numbers: (−∞, ∞).');
        const lo = D - Math.abs(A), hi = D + Math.abs(A), iv = `(-inf,${lo}]U[${hi},inf)`;
        return E.num(`What is the range of ${M(eq)}? Answer in interval notation.`, [{ interval: iv }],
          `${g} x is never between −1 and 1: its range is (−∞, −1] ∪ [1, ∞). Multiplying by ${A} and adding ${D} moves the gap to (${lo}, ${hi}), so the range is ${pt(iv)}.`); }
      if (k === 1) { const g = R.pick(['csc', 'sec', 'cot']), B = R.pick([{ p: 2, q: 1 }, { p: 3, q: 1 }, { p: 1, q: 2 }, { p: 4, q: 1 }, { p: 1, q: 3 }, { p: 3, q: 2 }]), off = g === 'sec' ? 1 : 0, hi = B.p / B.q >= 2 ? 1 : 2;
        // asymptotes where B·x = kπ (csc, cot) or π/2 + kπ (sec), for 0 ≤ x ≤ hi·π
        const xs = []; for (let k2 = 0; k2 < 40; k2++) { const n = (2 * k2 + off) * B.q, d = 2 * B.p; if (n / d <= hi + 1e-9) xs.push(piS(n, d)); }
        const zero = g === 'sec' ? 'cos' : 'sin', inner = pt(argS(B)), lim = hi === 1 ? 'π' : '2π';
        return E.num(`List the vertical asymptotes of ${M(`y=${g}(${argS(B)})`)} for ${M(`0<=x<=${hi === 1 ? 'pi' : '2pi'}`)}. Give exact answers.`, [{ label: 'x =', set: xs }],
          `${g} has an asymptote wherever ${zero} = 0, so where ${inner} = ${g === 'sec' ? 'π/2 + kπ' : 'kπ'}. Dividing by ${pt(fr(B.p, B.q))} and keeping 0 ≤ x ≤ ${lim}: x = ${list(xs.map(pt))}.`); }
      const truth = R.bool(), d0 = R.pick([30, 45, 60]), g = R.pick(['csc', 'sec']);
      const T = [[`${g} x = 1/${REC[g]} x`, `That is the definition of ${g}.`], [`${g}(${pt(dPi(d0))}) = ${pt(recVal(g, d0))}`, `${REC[g]}(${pt(dPi(d0))}) = ${pt(tvS(REC[g], d0))}, and its reciprocal is ${pt(recVal(g, d0))}.`], [`${g} x is never between −1 and 1`, `${REC[g]} x is between −1 and 1, so its reciprocal is at least 1 in size.`], [`${g} x has an asymptote wherever ${REC[g]} x = 0`, `Dividing 1 by 0 is undefined there.`]];
      const F = [[`${g} x means the same as ${REC[g]}⁻¹ x`, `${g} x = 1/${REC[g]} x is a number; ${REC[g]}⁻¹ x = arc${REC[g]} x is an angle. They are different.`], [`${g}(${pt(dPi(d0))}) = ${pt(tvS(REC[g], 90 - d0) === tvS(REC[g], d0) ? '1' : tvS(REC[g], d0))}`, `That is ${REC[g]}(${pt(dPi(d0))}) itself (or the wrong value). The reciprocal is ${pt(recVal(g, d0))}.`], [`${g} x can equal 1/2`, `|${REC[g]} x| ≤ 1, so |${g} x| ≥ 1; it can never be 1/2.`], [`${g} x has an asymptote wherever ${REC[g]} x = 1`, `Where ${REC[g]} x = 1, ${g} x = 1. Asymptotes are where ${REC[g]} x = 0.`]];
      const [st, why] = R.pick(truth ? T : F);
      return E.tf(`True or false: ${st}.`, truth, why); } },
  });

  /* ================= V.9.14 Inverse trig functions ================= */
  const DOMS = { sin: '[-pi/2,pi/2]', cos: '[0,pi]', tan: '(-pi/2,pi/2)' };
  const ivT = s => pt(s).replace(/,/g, ', ');
  const IVAL = { sin: ['0', '1/2', 'sqrt(2)/2', 'sqrt(3)/2', '1'], cos: ['0', '1/2', 'sqrt(2)/2', 'sqrt(3)/2', '1'], tan: ['0', 'sqrt(3)/3', '1', 'sqrt(3)'] };
  const ARC = { sin: Math.asin, cos: Math.acos, tan: Math.atan };
  const invG = (key, o = {}) => { const F = { sin: Math.asin, cos: Math.acos, tan: Math.atan, cot: x => PI / 2 - Math.atan(x), nsin: x => -Math.asin(x) }[key];
    return tg({ x: [-2.6, 2.6], y: [-2.3, 4], xs: 1, xnum: true, ys: PI / 2, ypi: true, w: o.w || 220, h: o.h || 180, fns: [{ f: F }], dots: o.dots, label: o.label || 'graph choice' }); };
  S('V.9.14', 'Inverse trig functions', {
    a: { t: 'restricted domains', g: R => { const tr = R.f() < 0.5, k = R.int(0, 2), f = R.pick(FN3);
      if (k === 0) { const pool = ['[-pi/2,pi/2]', '[0,pi]', '(-pi/2,pi/2)', '[0,2pi]', '[0,pi/2]', '(0,pi)'].filter(s => s !== DOMS[f]);
        return E.choice(R, `To define arc${f}, ${f} x is restricted to an interval where it takes each value once. Which interval?`, ivT(DOMS[f]), R.sample(pool, 3).map(ivT),
          `${f} x is one-to-one on ${ivT(DOMS[f])}${f === 'tan' ? ' (open, since the ends are asymptotes)' : ''}, and still takes every value it can there. That interval becomes the range of arc${f}.`); }
      if (k === 1) { const truth = tr, g = f === 'tan' && !truth ? R.pick(['sin', 'cos']) : f; let v;
        if (g === 'tan') { v = R.pick(['-5', '3/2', '12', '-0.4', '2', '-7/3', '100']); return E.tf(`Is ${M(`arctan(${v})`)} defined?`, true, 'arctan accepts every real number, because tan x takes every real value on (−π/2, π/2).', YN); }
        v = truth ? R.pick(['1/2', '-0.8', '1', '-1', '0.3', '-2/3', '0', '3/4']) : R.pick(['3/2', '-1.2', '2', '-5/4', '1.01', '-3', '4/3']);
        return E.tf(`Is ${M(`arc${g}(${v})`)} defined?`, truth, truth ? `${pt(v)} is in [−1, 1], the set of values ${g} x takes, so it is defined.` : `${g} x never leaves [−1, 1], and ${pt(v)} is outside it, so it is undefined.`, YN); }
      return E.choice(R, `Why must ${f} x be restricted before it has an inverse?`, `Without it, each value of ${f} x comes from many angles, so the inverse would not be a function`,
        [`Because ${f} x is undefined outside the interval`, `Because the inverse would give answers in degrees`, `Because ${f} x is negative outside the interval`], `${f} x repeats, so for example ${f === 'tan' ? 'tan 0 = tan π = 0' : f === 'sin' ? 'sin(π/6) = sin(5π/6) = 1/2' : 'cos(π/3) = cos(−π/3) = 1/2'}. Keeping one stretch where each value appears once makes the inverse a function.`); } },
    b: { t: 'ranges of arcsin, arccos, arctan', g: R => { const f = R.pick(FN3);
      if (R.bool(0.4)) { const pool = ['[-pi/2,pi/2]', '[0,pi]', '(-pi/2,pi/2)', '[-1,1]', '[0,2pi]'].filter(s => s !== DOMS[f]);
        return E.choice(R, `What is the range of ${M(`y=arc${f}(x)`)}?`, ivT(DOMS[f]), R.sample(pool, 3).map(ivT), `arc${f} returns angles in ${ivT(DOMS[f])}, the interval ${f} x was restricted to.${f === 'cos' ? ' That is why arccos of a negative number is an obtuse angle, not a negative one.' : ''}`); }
      const truth = R.bool(); let n, d; const ok = v => f === 'sin' ? v >= -0.5 && v <= 0.5 : f === 'cos' ? v >= 0 && v <= 1 : v > -0.5 && v < 0.5;
      do { d = R.pick([2, 3, 4, 6]); n = R.int(-2 * d, 2 * d); } while (ok(n / d) !== truth || n === 0 && R.bool(0.7));
      return E.tf(`Could ${M(`arc${f}(x)`)} equal ${M(piS(n, d))} for some x?`, truth, `arc${f} only gives angles in ${ivT(DOMS[f])}. ${pt(piS(n, d))} is ${truth ? 'inside' : 'outside'} that interval, so ${truth ? 'yes' : 'no'}.`, YN); } },
    c: { t: 'evaluate exactly', g: R => { const f = R.pick(FN3), v0 = R.pick(IVAL[f]), v = v0 !== '0' && R.bool(0.55) ? '-' + v0 : v0, ans = piOf(ARC[f](E.value(v)[0]));
      return E.num(`Find ${M(`arc${f}(${v})`)} exactly, in radians.`, [X(ans, `arc${f} =`)],
        `arc${f} gives the angle in ${ivT(DOMS[f])} whose ${f} is ${pt(v)}: ${f}(${pt(ans)}) = ${pt(v)}.${f === 'cos' && v[0] === '-' ? ` It is ${pt(ans)}, not ${pt(piOf(-Math.acos(-E.value(v)[0])))}, because arccos never gives negative angles.` : ''}`); } },
    d: { t: 'graphs', g: R => { const k = R.int(0, 2), f = R.pick(FN3);
      if (k === 0) { const keys = { sin: 'sin', cos: 'cos', tan: 'tan' }, others = ['sin', 'cos', 'tan', 'cot', 'nsin'].filter(x => x !== f);
        return E.choice(R, `Which graph is ${M(`y=arc${f}(x)`)}?`, invG(keys[f]), R.sample(others, 3).map(o => invG(o)),
          f === 'tan' ? 'arctan is defined for every x, rises through the origin, and levels off toward y = ±π/2.' : f === 'sin' ? 'arcsin runs only from x = −1 to 1, rising from (−1, −π/2) through the origin to (1, π/2).' : 'arccos runs only from x = −1 to 1, falling from (−1, π) to (1, 0); it is never negative.'); }
      if (k === 1 && R.bool(0.5)) { const v0 = R.pick(IVAL[f].slice(1)), v = R.bool() ? '-' + v0 : v0, y = piOf(ARC[f](E.value(v)[0])), ch = (a, b) => `(${pt(a)}, ${pt(b)})`;
        const wy = f === 'cos' ? piOf(-ARC[f](E.value(v)[0]) ) : piOf(ARC[f](E.value(v)[0]) + PI), alt = piOf(ARC[f](-E.value(v)[0]));
        return E.choice(R, `Which point is on the graph of ${M(`y=arc${f}(x)`)}?`, ch(v, y), [ch(y, v), ch(v, wy), ch(v, alt)].filter(c => c !== ch(v, y)),
          `arc${f}(${pt(v)}) = ${pt(y)}, the angle in ${ivT(DOMS[f])} whose ${f} is ${pt(v)}. So (${pt(v)}, ${pt(y)}) is on the graph; swapping the coordinates gives a point of y = ${f} x instead.`); }
      if (k === 1 && f !== 'tan') { const right = R.bool(), P = f === 'sin' ? (right ? ['1', 'pi/2'] : ['-1', '-pi/2']) : (right ? ['1', '0'] : ['-1', 'pi']);
        return E.num(`The graph of ${M(`y=arc${f}(x)`)} is a curve with two endpoints. Find the ${right ? 'right' : 'left'} endpoint. Give an exact answer.`, [{ point: P }],
          `The domain is [−1, 1], so the ${right ? 'right' : 'left'} end is at x = ${P[0]}, where arc${f}(${P[0]}) = ${pt(P[1])}: (${P[0]}, ${pt(P[1])}).`, { visual: invG(f, { w: 260, h: 200, label: 'graph' }) }); }
      return E.num(`What are the horizontal asymptotes of ${M('y=arctan(x)')}? Give the y-values exactly.`, [{ label: 'y =', set: ['pi/2', '-pi/2'] }], 'tan x shoots off to ±∞ at x = ±π/2, so arctan x approaches π/2 as x → ∞ and −π/2 as x → −∞, never reaching them.', { visual: invG('tan', { w: 260, h: 200, label: 'graph' }) }); } },
  });

  /* ================= V.9.15 Inverse trig compositions ================= */
  const RNG = { sin: '[−π/2, π/2]', cos: '[0, π]', tan: '(−π/2, π/2)' };
  S('V.9.15', 'Inverse trig compositions', {
    a: { t: 'sin(arcsin x)', g: R => { const f = R.pick(FN3);
      if (f !== 'tan' && R.bool(0.25)) { const [a, , c] = R.pick(TRIP.slice(0, 4)), v = fr(R.pick([1, -1]) * c, a);
        return E.choice(R, `What is ${M(`${f}(arc${f}(${v}))`)}?`, 'undefined', [pt(v), pt(fr(a, c)), '1'], `arc${f} only accepts inputs in [−1, 1], and ${pt(v)} is outside, so arc${f}(${pt(v)}) does not exist and neither does the whole expression.`); }
      let v; if (f === 'tan') { const p = R.int(1, 15), q = R.pick([1, 1, 2, 3, 4, 5]); v = fr(R.pick([1, -1]) * p, q); } else { let p, q; do { q = R.int(2, 9); p = R.int(1, q - 1); } while (gcd(p, q) > 1); v = fr(R.pick([1, -1]) * p, q); }
      return E.num(`Find ${M(`${f}(arc${f}(${v}))`)}.`, [X(v, 'value =')], `arc${f}(${pt(v)}) is an angle whose ${f} is ${pt(v)}${f === 'tan' ? ' (arctan accepts any number)' : ` (it exists because ${pt(v)} is in [−1, 1])`}. Taking ${f} of it gives back ${pt(v)}.`); } },
    b: { t: 'arcsin(sin x) traps', g: R => {
      if (R.bool(0.4)) { const f = R.pick(FN3), F = { sin: Math.sin, cos: Math.cos, tan: Math.tan }[f], d = R.pick([3, 4, 5, 6, 7, 8, 9, 10, 12]); let n;
        const inR = t => f === 'sin' ? Math.abs(t) <= 0.5 : f === 'cos' ? t >= 0 && t <= 1 : Math.abs(t) < 0.5;
        do n = R.int(-2 * d, 3 * d); while (n === 0 || inR(n / d) || Math.abs(F(n * PI / d)) < 1e-9 || (f === 'tan' && Math.abs(Math.cos(n * PI / d)) < 1e-9));
        const tv0 = n * PI / d, a = ARC[f](F(tv0)), t = piS(n, d), ans = piOf(a), y0 = F(tv0);
        const cand = [-a, PI - a, a + PI, PI / 2 - a, a - PI / 2, -tv0, tv0 + PI / 2].filter(X => Math.abs(F(X) - y0) > 1e-6 && Math.abs(Math.cos(X)) + (f === 'tan' ? 0 : 1) > 1e-9).map(piOf);
        const dA = [...new Set(cand)].filter(s => s !== ans), wrongR = { sin: '[0, π]', cos: '[−π/2, π/2]', tan: '[0, π]' }[f];
        const rows = [M(`${f}(${t})=${f}(${ans})`), `${pt(ans)} is in ${RNG[f]}, the range of arc${f}`, `So ${M(`arc${f}(${f}(${t}))=${ans}`)}`], blank = R.int(0, 1);
        const wrong = blank === 0 ? R.sample(dA, 3).map(s => M(`${f}(${t})=${f}(${s})`)) : [`${pt(t)} is in ${RNG[f]}, the range of arc${f}`, `${pt(ans)} is in ${wrongR}, the range of arc${f}`, `${M(`arc${f}(${f}(x))=x`)} for every x`];
        return E.choice(R, `Complete the proof that ${M(`arc${f}(${f}(${t}))=${ans}`)}. Which statement belongs in the blank step?${stepTbl(rows, blank)}`, rows[blank], wrong,
          `${f}(${pt(t)}) = ${f}(${pt(ans)}) because ${f === 'tan' ? 'tan repeats every π' : 'the angles have the same reference angle and the same sign'}, and ${pt(ans)} lies in ${RNG[f]}, so arc${f} returns ${pt(ans)}. ${pt(t)} itself is outside that range.`); }
      const f = R.pick(FN3), d = R.pick([3, 4, 5, 6, 7, 8, 9, 10, 12]); let n;
      const inR = t => f === 'sin' ? Math.abs(t) <= 0.5 : f === 'cos' ? t >= 0 && t <= 1 : Math.abs(t) < 0.5, keep = R.bool(0.2);
      do n = R.int(-2 * d, 3 * d); while (n === 0 || (f === 'tan' && Math.abs(mod(n / d, 1) - 0.5) < 1e-9) || inR(n / d) !== keep);
      const t = piS(n, d), val = ARC[f]({ sin: Math.sin, cos: Math.cos, tan: Math.tan }[f](n * PI / d)), ans = piOf(val);
      return E.num(`Find ${M(`arc${f}(${f}(${t}))`)} exactly.`, [X(ans, 'value =')],
        keep ? `${pt(t)} is already in ${RNG[f]}, the range of arc${f}, so arc${f} undoes ${f}: the answer is ${pt(t)}.` : `arc${f} must give an angle in ${RNG[f]}, and ${pt(t)} is not in it. ${f}(${pt(t)}) = ${f}(${pt(ans)}), and ${pt(ans)} is in ${RNG[f]}, so the answer is ${pt(ans)}, not ${pt(t)}.`); } },
    c: { t: 'triangle method', g: R => { const inn = R.pick(FN3), out = R.pick(FN3.filter(f => f !== inn)), s = R.pick([1, -1]); let p, q;
      if (R.bool(0.6)) { const [a, b, c] = R.pick(TRIP.slice(0, 5)); if (inn === 'tan') [p, q] = R.bool() ? [a, b] : [b, a]; else [p, q] = [R.pick([a, b]), c]; }
      else { do { q = R.int(2, 7); p = R.int(1, inn === 'tan' ? 7 : q - 1); } while (gcd(p, q) > 1 || (inn !== 'tan' && Number.isInteger(Math.sqrt(q * q - p * p))) || (inn === 'tan' && Number.isInteger(Math.sqrt(q * q + p * p)))); }
      let opp, adj, hyp;
      if (inn === 'sin') { opp = [s * p, 1]; hyp = [q, 1]; adj = lenOf(q * q - p * p); } else if (inn === 'cos') { adj = [s * p, 1]; hyp = [q, 1]; opp = lenOf(q * q - p * p); } else { opp = [s * p, 1]; adj = [q, 1]; hyp = lenOf(q * q + p * p); }
      const sgnOf = L => Math.sign(L[0]), abs = L => [Math.abs(L[0]), L[1]], [N, Dn] = out === 'sin' ? [opp, hyp] : out === 'cos' ? [adj, hyp] : [opp, adj];
      const ans = ratio(abs(N), abs(Dn), sgnOf(N) * sgnOf(Dn)), v = fr(s * p, q), num = E.value(`${out}(arc${inn}(${v}))`);
      if (!num || Math.abs(num[0] - E.value(ans)[0]) > 1e-9) throw new Error('V.9.15.c mismatch');
      const side = L => pt(lenS(abs(L), sgnOf(L)));
      return E.num(`Find the exact value of ${M(`${out}(arc${inn}(${v}))`)}.`, [X(ans, 'value =')],
        `Let θ = arc${inn}(${pt(v)}), so θ is in ${RNG[inn]}${s < 0 ? (inn === 'cos' ? ' (Quadrant II, since the cosine is negative)' : ' (Quadrant IV, since the value is negative)') : ''}. Draw a triangle with opposite ${side(opp)}, adjacent ${side(adj)}, hypotenuse ${side(hyp)}. Then ${out} θ = ${pt(ans)}.`); } },
    d: { t: 'algebraic expressions', g: R => { const a = R.int(1, 5), xa = a === 1 ? 'x' : `x/${a}`, k = R.int(0, 5), a2 = a * a, dv = a === 1 ? '' : `/${a}`;
      const T = [['sin', 'cos', `sqrt(${a2}-x^2)${dv}`, `adjacent x, hypotenuse ${a}, so opposite √(${a2} − x²)`], ['cos', 'sin', `sqrt(${a2}-x^2)${dv}`, `opposite x, hypotenuse ${a}, so adjacent √(${a2} − x²)`],
        ['tan', 'sin', `x/sqrt(${a2}-x^2)`, `opposite x, hypotenuse ${a}, so adjacent √(${a2} − x²)`], ['tan', 'cos', `sqrt(${a2}-x^2)/x`, `adjacent x, hypotenuse ${a}, so opposite √(${a2} − x²)`],
        ['sin', 'tan', `x/sqrt(x^2+${a2})`, `opposite x, adjacent ${a}, so hypotenuse √(x² + ${a2})`], ['cos', 'tan', `${a}/sqrt(x^2+${a2})`, `opposite x, adjacent ${a}, so hypotenuse √(x² + ${a2})`]][k];
      const ans = T[2];
      if (R.bool(0.4)) { const [out, inn] = T, [gv, third] = T[3].split(', so '), DEF = { sin: 'sin = opposite ÷ hypotenuse', cos: 'cos = adjacent ÷ hypotenuse', tan: 'tan = opposite ÷ adjacent' };
        const L = [[`Given: θ = arc${inn}(${pt(xa)}), so ${inn} θ = ${pt(xa)}`, 'Given', []],
          [`θ lies in ${RNG[inn]}`, `the range of arc${inn}`, [0], [`the domain of ${inn}`, 'the Pythagorean theorem', DEF[inn]]],
          [`Draw a right triangle with ${gv.replace(/(opposite|adjacent)(?= )/g, '$1 side').replace(', ', ' and ')}`, DEF[inn], [0], FN3.filter(f => f !== inn).map(f => DEF[f]).concat(['the Pythagorean theorem'])],
          [`Its ${third.replace(/^(\w+) /, '$1 side is ')}`, 'the Pythagorean theorem', [2], [DEF[inn], `the range of arc${inn}`, 'the angles of a triangle add to 180°']],
          [`${out}(arc${inn}(${pt(xa)})) = ${pt(ans)}, with the right sign because θ lies in ${RNG[inn]}`, DEF[out], [], FN3.filter(f => f !== out).map(f => DEF[f]).concat([`the range of arc${inn}`])]];
        return proofQ(R, `Prove that ${M(`${out}(arc${inn}(${xa}))=${ans}`)}.`, L,
          `Name the angle, build the triangle from ${inn} θ, find the third side by Pythagoras, then read off ${out} θ. The range of arc${inn} does not depend on the triangle steps, so that line can come anywhere before the end.`); }
      return E.num(`Write ${M(`${T[0]}(arc${T[1]}(${xa}))`)} as an algebraic expression in x (no trig functions).`, [{ label: '=', expr: ans }],
        `Let θ = arc${T[1]}(${pt(xa)}). Draw a right triangle with ${T[3]}. Read off ${T[0]} θ = ${pt(ans)}. The signs work for every x in the domain because θ lies in ${RNG[T[1]]}.`); } },
    e: { t: 'mixed pairs', g: R => { const d = R.pick([5, 7, 8, 9, 10, 12]), form = R.int(0, 1); let n; do n = R.int(-2 * d, 3 * d); while (n === 0 || 2 * n === d);
      const t = piS(n, d), val = form === 0 ? Math.asin(Math.cos(n * PI / d)) : Math.acos(Math.sin(n * PI / d)), ans = piOf(val), w = piS(d - 2 * n, 2 * d);
      return E.num(`Find ${M(form === 0 ? `arcsin(cos(${t}))` : `arccos(sin(${t}))`)} exactly.`, [X(ans, 'value =')],
        form === 0 ? `cos(${pt(t)}) = sin(π/2 − ${n < 0 ? `(${pt(t)})` : pt(t)}) = sin(${pt(w)}). The angle in [−π/2, π/2] with that same sine is ${pt(ans)}, so that is the answer.`
          : `sin(${pt(t)}) = cos(π/2 − ${n < 0 ? `(${pt(t)})` : pt(t)}) = cos(${pt(w)}). The angle in [0, π] with that same cosine is ${pt(ans)}, so that is the answer.`); } },
    f: { t: 'find every solution', g: R => { const kind = R.int(0, 3); let a, b, eq, sol, why;
      const cx = (c, neg) => `${neg ? '-' : ''}${c === 1 ? '' : c}x`;
      if (kind === 0) { do { a = R.int(2, 6); b = R.int(1, 5); } while (b >= a || gcd(a, b) > 1 && R.bool(0.5)); const s = E.surdStr(0, 1, a * a - b * b, a * b), sN = E.surdStr(0, -1, a * a - b * b, a * b);
        eq = `arctan(${cx(a)})=arcsin(${cx(b)})`; sol = ['0', s, sN];
        why = `x = 0 works. Otherwise take tan of both sides: ${a}x = ${pt(cx(b))}/√(1 − ${co(b * b)}x²), so √(1 − ${co(b * b)}x²) = ${pt(fr(b, a))} and x² = ${pt(fr(a * a - b * b, a * a * b * b))}. Both signs work, because both sides are odd functions: x = 0, ±${pt(s)}.`; }
      else if (kind === 1) { do { a = R.int(1, 5); b = R.int(a, 6); } while (gcd(a, b) > 1 && R.bool(0.5)); eq = `arctan(${cx(a)})=arcsin(${cx(b)})`; sol = ['0'];
        why = `x = 0 works. For x ≠ 0, taking tan gives √(1 − ${co(b * b)}x²) = ${pt(fr(b, a))}${a === b ? ' = 1, which forces x = 0' : `, but a square root of something at most 1 can't exceed 1`}. So x = 0 is the only solution.`; }
      else if (kind === 2) { a = R.int(1, 5); b = R.int(1, 5); const n2 = a * a + b * b; eq = `arcsin(${cx(a)})=arccos(${cx(b)})`; sol = [E.surdStr(0, 1, n2, n2)];
        why = `arccos is never negative, so x ≥ 0 and both angles are in [0, π/2]. Take sin: ${a === 1 ? '' : a}x = √(1 − ${b * b === 1 ? '' : b * b}x²), so ${n2}x² = 1 and x = ${pt(sol[0])} (the negative root is rejected).`; }
      else { a = R.int(1, 5); b = R.int(1, 5); eq = `arcsin(${cx(a)})=arccos(${cx(b, true)})`; sol = [];
        why = `arccos is never negative, so we need x ≥ 0. Then arcsin(${pt(cx(a))}) ≤ π/2 while arccos(${pt(cx(b, true))}) ≥ π/2, so both would have to equal π/2: that needs ${pt(cx(a))} = 1 and x = 0 at once. No solution.`; }
      return E.num(`Find every real x with ${M(eq)}. Give exact answers, or type "no solution".`, [{ label: 'x =', set: sol }], why); } },
  });
})(typeof window !== 'undefined' ? window : globalThis);
