/* Era V · Unit V.12 Conic sections (V.12.01–V.12.11) */
(function (G) {
  const E = G.E5, V = E.V, C = E.C, M = s => E.mx(s);
  const S = (id, name, steps) => E.skill({ id, name, steps });
  const K = E.K;

  /* ================= small helpers ================= */
  const nz = (R, lo, hi) => { let v; do v = R.int(lo, hi); while (v === 0); return v; };
  const gcd = (a, b) => E.gcd(Math.abs(a), Math.abs(b));
  const P = s => E.pt(s);
  // a number as typed ASCII: integer, or a reduced fraction
  const fv = v => { if (Math.abs(v - Math.round(v)) < 1e-9) return String(Math.round(v)); for (let d = 2; d <= 64; d++) { const n = Math.round(v * d); if (Math.abs(n - v * d) < 1e-9) return E.fracStr(n, d); } return String(+v.toFixed(3)); };
  const sqS = n => { const [k, m] = E.surd(1, n); return m === 1 ? String(k) : `${k === 1 ? '' : k}sqrt(${m})`; };
  const isSq = n => n >= 0 && Number.isInteger(Math.sqrt(n));
  const ex = n => isSq(n) ? { ans: Math.sqrt(n) } : { exact: sqS(n), form: 'simplest' };    // √n as a field
  const sq = (v, h) => h === 0 ? `${v}^2` : `(${v}${h > 0 ? '-' : '+'}${fv(Math.abs(h))})^2`;
  const shv = (v, h) => h === 0 ? v : `(${v}${h > 0 ? '-' : '+'}${fv(Math.abs(h))})`;
  const cf = n => n === 1 ? '' : n === -1 ? '-' : fv(n);
  const ov = (num, A) => A === 1 ? num : `${num}/${A}`;          // x^2/9, but x^2 when the denominator is 1
  const par = v => v < 0 ? `(${v})` : String(v);
  const rr = (n, d) => d === 1 ? String(n) : `${n}/${d}`;              // 4/1 shows as 4
  const nt = v => String(v).replace(/^-/, '−');                 // a real minus where tidy won't reach (inside |…|)
  const an = n => /^(8|11|18|80|8\d)$/.test(String(n)) ? 'An' : 'A';
  const pS = (x, y) => `(${fv(x)}, ${fv(y)})`;
  const ptA = (x, y) => [fv(x), fv(y)];
  const pm = (h, c) => h === 0 ? `±${P(c)}` : `${fv(h)} ± ${P(c)}`;
  // h + c and h − c as typed strings (c may be a surd string)
  const addS = (h, c, s) => { if (/^\d+$/.test(c)) return fv(h + s * Number(c)); return h === 0 ? (s > 0 ? c : '-' + c) : `${h}${s > 0 ? '+' : '-'}${c}`; };
  // proof helpers: a two-column table with one reason hidden, numbered lines, step labels, three distinct wrong options
  const tbl = (rows, hide) => `<table class="dt"><tr><th>#</th><th>Statement</th><th>Reason</th></tr>${rows.map((r, i) => `<tr><td>${i + 1}</td><td>${r[0]}</td><td>${i === hide ? '<b>?</b>' : r[1]}</td></tr>`).join('')}</table>`;
  const numbered = lines => `<table class="dt">${lines.map((l, i) => `<tr><th>${i + 1}</th><td>${l}</td></tr>`).join('')}</table>`;
  const STEPS = n => [...Array(n).keys()].map(i => `Step ${i + 1}`);
  const uniq3 = (ok, cands) => [...new Set(cands.filter(x => x !== ok))].slice(0, 3);
  const unitL = O => O && O.units === 'imperial' ? 'ft' : 'm';
  const unitS = O => O && O.units === 'imperial' ? 'in' : 'cm';
  // general-form text from coefficients [A,B,C,D,E,F] of Ax²+Bxy+Cy²+Dx+Ey+F
  const gen = co => { const vars = ['x^2', 'xy', 'y^2', 'x', 'y', '']; let s = '';
    co.forEach((c, i) => { if (!c) return; const a = Math.abs(c), sg = c < 0 ? '-' : (s ? '+' : ''); s += sg + (vars[i] && a === 1 ? '' : a) + vars[i]; });
    return (s || '0') + '=0'; };
  // a line Ax + By = C, reduced, x first
  const lineEq = (A, B, Cv) => { const g = gcd(gcd(A, B), Cv) || 1; A /= g; B /= g; Cv /= g; if (A < 0 || (A === 0 && B < 0)) { A = -A; B = -B; Cv = -Cv; }
    const t = (c, v, first) => c === 0 ? '' : (c < 0 ? '-' : first ? '' : '+') + (Math.abs(c) === 1 ? '' : Math.abs(c)) + v; return `${t(A, 'x', true) + t(B, 'y', !A)}=${Cv}`; };
  // y = (n/d)(x − h) + k as 'y=3x/4+1/2'
  const lineS = (n, d, h, k) => { const g = gcd(n, d); n /= g; d /= g; if (d < 0) { n = -n; d = -d; }
    const sl = (n === 1 ? '' : n === -1 ? '-' : n) + 'x' + (d === 1 ? '' : '/' + d), q = k - n * h / d; return `y=${sl}${q === 0 ? '' : (q > 0 ? '+' : '-') + fv(Math.abs(q))}`; };
  const LAT = r => { const o = []; for (let x = -r; x <= r; x++) { const y = Math.sqrt(r * r - x * x); if (Number.isInteger(y)) { o.push([x, y]); if (y) o.push([x, -y]); } } return o; };
  // lattice points with whole-number distances to the foci (±c, 0)
  const FP = []; for (let c = 1; c <= 12; c++) for (let x = 0; x <= 16; x++) for (let y = 1; y <= 16; y++) {
    const d1 = Math.hypot(x + c, y), d2 = Math.hypot(x - c, y); if (Number.isInteger(d1) && Number.isInteger(d2) && d1 <= 30) FP.push({ c, x, y, d1, d2 }); }
  // (a, b, c) with c² = a² − b², all whole
  const ELL3 = [[5, 4, 3], [5, 3, 4], [10, 8, 6], [10, 6, 8], [13, 12, 5], [13, 5, 12], [17, 15, 8], [17, 8, 15], [25, 24, 7], [25, 7, 24], [15, 12, 9], [15, 9, 12]];
  // (a, b, c) with c² = a² + b², all whole
  const HYP3 = [[3, 4, 5], [4, 3, 5], [6, 8, 10], [8, 6, 10], [5, 12, 13], [12, 5, 13], [8, 15, 17], [15, 8, 17], [9, 12, 15], [12, 9, 15], [7, 24, 25]];

  /* ================= pictures ================= */
  const r2 = x => Math.round(x * 100) / 100;
  // a square coordinate window around box = [xmin, xmax, ymin, ymax]; o: {param, fns, points, segs (dashed), w, labels}
  const plot = (box, o = {}) => {
    let [a, b, c, d] = box; a = Math.floor(a - 1); b = Math.ceil(b + 1); c = Math.floor(c - 1); d = Math.ceil(d + 1);
    if (o.fix) [a, b, c, d] = o.fix;
    const sp = Math.max(b - a, d - c), exx = sp - (b - a), exy = sp - (d - c); a -= Math.floor(exx / 2); b += Math.ceil(exx / 2); c -= Math.floor(exy / 2); d += Math.ceil(exy / 2);
    const W = o.w || 300, ticks = o.ticks || (sp <= 14 ? 1 : sp <= 28 ? 2 : 5);
    // V.graph does not clip parametric curves, so trim each t-range to the part inside the window
    const inW = (F, t) => { const x = F.x(t), y = F.y(t); return x >= a && x <= b && y >= c && y <= d; };
    const edge = (F, tIn, tOut) => { for (let i = 0; i < 40; i++) { const m = (tIn + tOut) / 2; if (inW(F, m)) tIn = m; else tOut = m; } return tIn; };
    const trim = F => { const [t0, t1] = F.t, st = (t1 - t0) / 4000, mid = t0 <= 0 && 0 <= t1 ? 0 : (t0 + t1) / 2; if (!inW(F, mid)) return F;
      let lo = mid, hi = mid; while (lo - st >= t0 && inW(F, lo - st)) lo -= st; if (lo - st >= t0) lo = edge(F, lo, lo - st);
      while (hi + st <= t1 && inW(F, hi + st)) hi += st; if (hi + st <= t1) hi = edge(F, hi, hi + st);
      return Object.assign({}, F, { t: [lo, hi] }); };
    let svg = V.graph({ x: [a, b], y: [c, d], w: W, h: W, ticks, labels: o.labels, fns: o.fns || [], param: (o.param || []).map(trim), points: (o.points || []).map(q => q[2] ? [q[0], q[1], String(q[2]).replace(/-/g, '−'), ...q.slice(3)] : q), vlines: o.vlines || [], hlines: o.hlines || [], label: o.label || 'conic on a coordinate grid' });
    if (o.segs && o.segs.length) { const pad = 18, X = x => r2(pad + (x - a) / (b - a) * (W - 2 * pad)), Y = y => r2(W - pad - (y - c) / (d - c) * (W - 2 * pad));
      const extra = o.segs.map(([x1, y1, x2, y2, col]) => `<line x1="${X(x1)}" y1="${Y(y1)}" x2="${X(x2)}" y2="${Y(y2)}" stroke="${col || C.muted}" stroke-width="1.5" stroke-dasharray="5 4"/>`).join('');
      svg = svg.replace(/<\/g><\/svg>$/, extra + '</g></svg>'); }
    return svg;
  };
  const ellP = (h, k, a, b) => ({ x: t => h + a * Math.cos(t), y: t => k + b * Math.sin(t), t: [0, 2 * Math.PI], color: C.blue });
  const parP = (vert, h, k, p, T) => vert ? { x: t => h + t, y: t => k + t * t / (4 * p), t: [-T, T], color: C.blue } : { x: t => h + t * t / (4 * p), y: t => k + t, t: [-T, T], color: C.blue };
  const hypP = (vert, h, k, a, b, U) => [1, -1].map(s => vert ? { x: u => h + b * Math.sinh(u), y: u => k + s * a * Math.cosh(u), t: [-U, U], color: C.blue } : { x: u => h + s * a * Math.cosh(u), y: u => k + b * Math.sinh(u), t: [-U, U], color: C.blue });
  // parabola picture: vertex window, vertex dot, optional extra points
  const parBox = (vert, h, k, p) => { const T = Math.min(5, Math.sqrt(28 * Math.abs(p))), D = T * T / (4 * Math.abs(p)), s = Math.sign(p);
    return vert ? [h - T, h + T, Math.min(k, k + s * D, k - p), Math.max(k, k + s * D, k - p)] : [Math.min(h, h + s * D, h - p), Math.max(h, h + s * D, h - p), k - T, k + T]; };
  const parPic = (vert, h, k, p, o = {}) => plot(o.fix ? [0, 0, 0, 0] : parBox(vert, h, k, p), { fix: o.fix, w: o.w, param: [parP(vert, h, k, p, 30)], points: o.points || [[h, k, '']], label: 'parabola on a coordinate grid' });
  const ellPic = (h, k, a, b, o = {}) => plot([h - a, h + a, k - b, k + b], { fix: o.fix, w: o.w, param: [ellP(h, k, a, b)], points: o.points || [[h, k, '']], label: 'ellipse on a coordinate grid' });
  const hypPic = (vert, h, k, a, b, o = {}) => { const L = Math.max(a, b) + 3, m = vert ? a / b : b / a;
    const asy = [1, -1].map(s => ({ f: x => k + s * m * (x - h), color: C.muted, dash: true }));
    const U = Math.acosh((L + 4) / a) + 0.3;
    return plot([h - L, h + L, k - L, k + L], { fix: o.fix, w: o.w, param: hypP(vert, h, k, a, b, U), fns: o.noAsy ? [] : asy, points: o.points || [[h, k, '']], segs: o.box ? (() => { const bx = vert ? b : a, by = vert ? a : b; return [[h - bx, k - by, h + bx, k - by], [h + bx, k - by, h + bx, k + by], [h + bx, k + by, h - bx, k + by], [h - bx, k + by, h - bx, k - by]]; })() : [], label: 'hyperbola on a coordinate grid' }); };

  /* ================= V.12.01 Slicing a cone ================= */
  // side view of a double cone (sides at phi° to the horizontal) and a cutting plane at psi° through q
  const coneFig = (phi, psi, q) => {
    const L = 4, rad = K.rad;
    const clip = (P0, d) => { let t0 = -1e9, t1 = 1e9; for (const i of [0, 1]) { if (Math.abs(d[i]) < 1e-9) continue; let a = (-L - P0[i]) / d[i], b = (L - P0[i]) / d[i]; if (a > b) [a, b] = [b, a]; t0 = Math.max(t0, a); t1 = Math.min(t1, b); } return [[P0[0] + d[0] * t0, P0[1] + d[1] * t0], [P0[0] + d[0] * t1, P0[1] + d[1] * t1]]; };
    const g1 = clip([0, 0], [Math.cos(rad(phi)), Math.sin(rad(phi))]), g2 = clip([0, 0], [-Math.cos(rad(phi)), Math.sin(rad(phi))]), pl = clip(q, [Math.cos(rad(psi)), Math.sin(rad(psi))]);
    const top = [[0, 0], g1[1]], bot = [[0, 0], g1[0]];
    if (g1[1][1] < L - 1e-6) top.push([L, L], [-L, L]); top.push(g2[1]);
    if (g1[1][1] < L - 1e-6) bot.push([-L, -L], [L, -L]); bot.push(g2[0]);
    const pts = { A: g1[0], B: g1[1], Cc: g2[0], D: g2[1], U: [0, L], W: [0, -L], Pp: pl[0], Q: pl[1], c1: [-L, -L], c2: [L, L] };
    top.forEach((p, i) => pts['t' + i] = p); bot.forEach((p, i) => pts['b' + i] = p);
    return V.geo({ pts, polys: [[...top.map((_, i) => 't' + i), { fill: C.blue, opacity: 0.1 }], [...bot.map((_, i) => 'b' + i), { fill: C.blue, opacity: 0.1 }]],
      segs: [['A', 'B'], ['Cc', 'D'], ['U', 'W', { dash: true, color: C.muted, width: 1.3 }], ['Pp', 'Q', { color: C.red, width: 3 }]], labels: false, w: 200, pad: 10, label: 'side view of a double cone cut by a plane' });
  };
  const SHAPES = ['circle', 'ellipse', 'parabola', 'hyperbola'];
  const cls = (phi, psi, thru) => thru ? (psi < phi ? 'a single point' : psi === phi ? 'a single line' : 'two crossing lines') : psi === 0 ? 'circle' : psi < phi ? 'ellipse' : psi === phi ? 'parabola' : 'hyperbola';
  const why = (phi, psi, thru) => {
    const rel = psi === 0 ? 'horizontal (at right angles to the axis)' : psi < phi ? `less steep than the sides (${psi}° < ${phi}°)` : psi === phi ? `parallel to a side (both ${phi}°)` : `steeper than the sides (${psi}° > ${phi}°)`;
    if (thru) return `The plane is ${rel} and passes through the vertex, so the cut shrinks to ${cls(phi, psi, true)}.`;
    return `The plane is ${rel}${psi === 0 ? ', so it cuts a circle' : psi < phi ? ', so it cuts one nappe all the way round: an ellipse' : psi === phi ? ', so it cuts one nappe but never closes: a parabola' : ', so it cuts both nappes: a hyperbola'}.`;
  };
  const sideTxt = phi => `The cone's sides make ${phi}° with the horizontal`;
  S('V.12.01', 'Slicing a cone', {
    a: { t: 'circle', g: R => {
      const kind = R.int(0, 2);
      if (kind === 0) { const phi = R.int(7, 15) * 5, c = R.pick([-2, -1.5, -1, 1, 1.5, 2]);
        return E.choice(R, 'A plane cuts a double cone at right angles to its axis, missing the vertex (side view shown). What curve does it cut?', 'circle', ['ellipse', 'parabola', 'hyperbola'],
          'A plane at right angles to the axis meets every side of the cone at the same distance from the vertex, so the cut is a circle.', { visual: coneFig(phi, 0, [0, c]) }); }
      if (kind === 1) { const [a, b] = R.pick([[1, 2], [1, 1], [2, 3], [3, 4], [3, 2], [2, 1], [1, 3], [4, 3], [3, 5]]); let s1, s2; do { s1 = R.int(1, 4); s2 = R.int(1, 8); } while (s1 === s2);
        const u = unitS(R.bool() ? null : { units: 'imperial' });
        return E.num(`A cone has its vertex at the top and a vertical axis. A horizontal plane ${b * s1} ${u} below the vertex cuts a circle of radius ${a * s1} ${u}. What is the radius of the circle cut ${b * s2} ${u} below the vertex?`, [{ label: 'radius =', ans: a * s2 }],
          `Horizontal cuts give similar triangles, so radius ÷ depth stays ${a * s1} ÷ ${b * s1} = ${fv(a / b)}: r = ${fv(a / b)} × ${b * s2} = ${a * s2} ${u}.`); }
      const n = R.pick([1, 4, 9, 2, 3, 5]), h = nz(R, -6, 6), r2v = n * h * h;
      return E.num(`The double cone ${M(`x^2+y^2=${n === 1 ? '' : n}z^2`)} is cut by the plane ${M(`z=${h}`)}. What is the radius of the circle?${isSq(r2v) ? '' : ' Give an exact answer.'}`, [Object.assign({ label: 'radius =' }, ex(r2v))],
        `Put z = ${h}: ${M(`x^2+y^2=${r2v}`)}, a circle with r = √${r2v} = ${P(isSq(r2v) ? String(Math.sqrt(r2v)) : sqS(r2v))}.`); } },
    b: { t: 'ellipse', g: R => {
      const kind = R.int(0, 2), phi = R.int(8, 15) * 5;
      if (kind === 0) { const psi = R.bool(0.2) ? 0 : R.int(2, phi / 5 - 2) * 5, c = R.pick([-1.5, -1, -0.5, 0.5, 1, 1.5]);
        return E.choice(R, `${sideTxt(phi)}. A plane at ${psi}° to the horizontal cuts it, missing the vertex (side view shown). What curve does it cut?`, cls(phi, psi, false), SHAPES.filter(s => s !== cls(phi, psi, false)), why(phi, psi, false), { visual: coneFig(phi, psi, [0, c]) }); }
      if (kind === 1) { const psi = R.int(1, phi / 5 - 1) * 5, psi2 = R.int(phi / 5 + 1, 18) * 5;
        return E.choice(R, `${sideTxt(phi)}. A plane misses the vertex. At which angle to the horizontal does it cut an ellipse that is not a circle?`, `${psi}°`, ['0°', `${phi}°`, `${psi2}°`],
          `An ellipse needs a tilt between 0° (a circle) and the sides' ${phi}° (a parabola). ${psi2}° is steeper than the sides, which gives a hyperbola.`); }
      const T = [['An ellipse is cut when the plane crosses one nappe all the way round.', 1, 'A tilt less steep than the sides cuts every side of one nappe, so the curve closes up.'],
        ['A circle is the special ellipse cut by a plane at right angles to the axis.', 1, 'With no tilt, every point of the cut is the same distance from the axis.'],
        ['Tilting the plane more, while staying less steep than the sides, makes the ellipse longer.', 1, 'The far end of the cut slides further down the cone, so the ellipse stretches.'],
        ['An ellipse is cut when the plane meets both nappes.', 0, 'Meeting both nappes needs a plane steeper than the sides, and that gives a hyperbola.'],
        ['An ellipse is cut when the plane is parallel to a side of the cone.', 0, 'Parallel to a side, the cut never closes: that is a parabola.'],
        ['A tilted plane through the vertex cuts an ellipse.', 0, 'Through the vertex the cut is degenerate: a point, one line or two lines.']];
      const want = R.bool(), [s, , w] = R.pick(T.filter(t => !!t[1] === want));
      return E.tf(`${sideTxt(phi)}. True or false? ${s}`, want, w); } },
    c: { t: 'parabola', g: R => {
      const kind = R.int(0, 2), phi = R.int(8, 13) * 5;
      if (kind === 0) { const psi = R.bool(0.55) ? phi : phi + R.pick([-15, -10, 10, 15]), c = R.pick([-1.5, -1, -0.5, 0.5, 1, 1.5]);
        return E.choice(R, `${sideTxt(phi)}. A plane at ${psi}° to the horizontal cuts it, missing the vertex (side view shown). What curve does it cut?`, cls(phi, psi, false), SHAPES.filter(s => s !== cls(phi, psi, false)), why(phi, psi, false), { visual: coneFig(phi, psi, [0, c]) }); }
      if (kind === 1) { const byAxis = R.bool(), al = R.int(4, 14) * 5;
        return byAxis ? E.num(`A double cone's sides make ${al}° with its vertical axis. At what angle to the horizontal must a plane (missing the vertex) be tilted to cut a parabola?`, [{ label: 'angle =', ans: 90 - al }], `A parabola needs the plane parallel to a side. The sides make ${al}° with the vertical, so ${90 - al}° with the horizontal.`)
          : E.num(`${sideTxt(al)}. At what angle to the horizontal must a plane (missing the vertex) be tilted to cut a parabola?`, [{ label: 'angle =', ans: al }], `A parabola needs the plane parallel to a side, so it must also make ${al}° with the horizontal.`); }
      const T = [['A parabola has no asymptotes.', 1, 'Its arms keep bending; they never straighten toward lines.'], ['A plane parallel to one side of the cone cuts a parabola.', 1, 'It cuts one nappe but runs alongside the opposite side, so the curve never closes.'],
        ['A parabola lies on just one nappe of the cone.', 1, 'Being parallel to a side, the plane never reaches the other nappe.'], ['A parabola is one branch of a hyperbola.', 0, 'Hyperbola arms straighten toward asymptote lines; a parabola\'s never do.'],
        ["A parabola's arms get closer and closer to two straight lines.", 0, 'That describes a hyperbola. A parabola has no asymptotes.'], ['A plane parallel to a side of the cone meets both nappes.', 0, 'It meets only one nappe; a plane must be steeper than the sides to reach both.']];
      const want = R.bool(), [s, , w] = R.pick(T.filter(t => !!t[1] === want));
      return E.tf(`${sideTxt(phi)}. True or false? ${s}`, want, w); } },
    d: { t: 'hyperbola and degenerate cases', g: R => {
      const phi = R.int(7, 12) * 5, kind = R.int(0, 1), thru = R.bool(0.5);
      const psi = thru ? R.pick([0, R.int(1, phi / 5 - 1) * 5, phi, R.int(phi / 5 + 1, 18) * 5, R.int(phi / 5 + 1, 18) * 5]) : R.int(phi / 5 + 1, 18) * 5;
      const right = cls(phi, psi, thru), pool = ['hyperbola', 'parabola', 'ellipse', 'a single point', 'a single line', 'two crossing lines'].filter(s => s !== right);
      const wrong = thru ? ['hyperbola', ...R.sample(pool.filter(s => s !== 'hyperbola'), 2)] : ['parabola', 'two crossing lines', R.pick(['ellipse', 'a single line'])];
      if (kind === 0) { const q = thru ? [0, 0] : psi === 90 ? [R.pick([-1, -0.5, 0.5, 1]), 0] : [0, R.pick([-1, -0.5, 0.5, 1])];
        return E.choice(R, `${sideTxt(phi)}. A plane at ${psi}° to the horizontal cuts it${thru ? ' through the vertex' : ', missing the vertex'} (side view shown). What does it cut?`, right, wrong, why(phi, psi, thru), { visual: coneFig(phi, psi, q) }); }
      return E.choice(R, `${sideTxt(phi)}. A plane at ${psi}° to the horizontal ${thru ? 'passes through the vertex' : 'misses the vertex'}. What is the intersection?`, right, wrong, why(phi, psi, thru)); } },
  });

  /* ================= V.12.02 Parabola as focus & directrix ================= */
  // vertical: (x − h)² = 4p(y − k); horizontal: (y − k)² = 4p(x − h)
  const parEq = (vert, h, k, p) => vert ? `${sq('x', h)}=${cf(4 * p)}${shv('y', k)}` : `${sq('y', k)}=${cf(4 * p)}${shv('x', h)}`;
  const focus = (vert, h, k, p) => vert ? [h, k + p] : [h + p, k];
  const dirEq = (vert, h, k, p) => vert ? `y=${fv(k - p)}` : `x=${fv(h - p)}`;
  const opens = (vert, p) => vert ? (p > 0 ? 'up' : 'down') : (p > 0 ? 'right' : 'left');
  const PV = [1, 2, 3, -1, -2, -3, 1 / 2, -1 / 2, 3 / 2, -3 / 2];
  const parWhy = (vert, h, k, p) => `4p = ${fv(4 * p)}, so p = ${P(fv(p))}. The vertex is ${pS(h, k)} and it opens ${opens(vert, p)}, so the focus is ${pS(...focus(vert, h, k, p))} and the directrix is ${P(dirEq(vert, h, k, p))}, ${fv(Math.abs(p))} on the other side of the vertex.`;
  S('V.12.02', 'Parabola as focus & directrix', {
    a: { t: 'the definition', g: R => {
      const kind = R.int(0, 2);
      if (kind === 0) { const p = R.int(1, 6), d = p + R.int(1, 12), vert = R.bool(), sgn = R.pick([1, -1]);
        if (R.bool(0.35)) { const dd = R.int(4, 40) / 2; return E.num(`A parabola has focus F and directrix ℓ. A point P on it is ${dd} units from F. How far is P from ℓ?`, [{ label: 'distance =', ans: dd }], `Every point of a parabola is equally far from the focus and the directrix, so P is ${dd} from ℓ too.`); }
        const eq = vert ? `x^2=${cf(4 * p * sgn)}y` : `y^2=${cf(4 * p * sgn)}x`, v = vert ? 'y' : 'x';
        return E.num(`A point P on ${M(eq)} is ${d} units from the focus. What is its ${v}-coordinate?`, [{ label: `${v} =`, ans: sgn * (d - p) }],
          `Here p = ${sgn * p}: the focus is ${vert ? pS(0, sgn * p) : pS(sgn * p, 0)} and the directrix is ${M(`${v}=${-sgn * p}`)}. P is also ${d} from the directrix, so |${v} ${sgn > 0 ? '+' : '−'} ${p}| = ${d} on the curve's side: ${v} = ${sgn * (d - p)}.`); }
      if (kind === 1) { const h = R.int(-4, 4), k = R.int(-4, 4), p = R.pick([1, 2, -1, -2]), t = nz(R, -3, 3), on = R.bool(), dl = on ? 0 : R.pick([-2, -1, 1, 2]);
        const x0 = h + 2 * p * t, y0 = k + p * t * t + dl, dx = x0 - h, dy = y0 - k - p, f2 = dx * dx + dy * dy, dL = Math.abs(y0 - k + p);
        return E.choiceFixed(`A parabola has focus ${pS(h, k + p)} and directrix ${M(`y=${k - p}`)}. Is ${pS(x0, y0)} on it?`, ['Yes', 'No'], on ? 0 : 1,
          `Distance to the focus: √(${Math.abs(dx)}² + ${Math.abs(dy)}²) = √${f2}${isSq(f2) ? ' = ' + Math.sqrt(f2) : ''}. Distance to the directrix: |${nt(y0)} − ${par(k - p).replace('-', '−')}| = ${dL}. ${on ? 'They are equal, so yes.' : `${dL}² = ${dL * dL} ≠ ${f2}, so no.`}`); }
      const a = R.int(-6, 6), b = R.int(-6, 6); let d; do d = R.int(-7, 7); while (d === b); const vert = R.bool();
      return vert ? E.num(`A parabola has focus ${pS(a, b)} and directrix ${M(`y=${d}`)}. Find its vertex.`, [{ label: 'vertex', point: ptA(a, (b + d) / 2) }], `The vertex is the point of the curve halfway between the focus and the directrix: x = ${a}, y = (${b} + ${d})/2 = ${P(fv((b + d) / 2))}.`.replace(/\+ -/g, '− '))
        : E.num(`A parabola has focus ${pS(b, a)} and directrix ${M(`x=${d}`)}. Find its vertex.`, [{ label: 'vertex', point: ptA((b + d) / 2, a) }], `The vertex is halfway between the focus and the directrix: x = (${b} + ${d})/2 = ${P(fv((b + d) / 2))}, y = ${a}.`.replace(/\+ -/g, '− ')); } },
    b: { t: 'derive the equation', g: R => {
      const kind = R.int(0, 2), p = R.pick([1, 2, 3, 4, 5, -1, -2, -3]), vert = R.bool();
      if (kind === 0) { const u = vert ? 'y' : 'x', w = vert ? 'x' : 'y', in1 = `${u}${p > 0 ? '+' : '-'}${Math.abs(p)}`, sqU = sq(u, p), sqW = `${w}^2`, ex1 = E.poly([1, -2 * p, p * p], u), ex2 = E.poly([1, 2 * p, p * p], u);
        const lines = [`P(x, y) is as far from F${vert ? pS(0, p) : pS(p, 0)} as from the line ${M(`${u}=${-p}`)}`,
          M(vert ? `sqrt(${sqW}+${sqU})=|${in1}|` : `sqrt(${sqU}+${sqW})=|${in1}|`), M(vert ? `${sqW}+${sqU}=(${in1})^2` : `${sqU}+${sqW}=(${in1})^2`),
          M(vert ? `${sqW}+${ex1}=${ex2}` : `${ex1}+${sqW}=${ex2}`), M(`${w}^2=${4 * p}${u}`)];
        return K.orderQ(R, `Put the steps in order to find the parabola with focus ${vert ? pS(0, p) : pS(p, 0)} and directrix ${M(`${u}=${-p}`)}.`, lines, [[], [0], [1], [2], [3]],
          `Set the two distances equal, square both sides, expand, and cancel ${u}² and ${p * p}: ${P(`${w}^2=${4 * p}${u}`)}.`); }
      if (kind === 1) { const h = R.int(-5, 5), k = R.int(-5, 5), [fx, fy] = focus(vert, h, k, p);
        return E.num(`A parabola has focus ${pS(fx, fy)} and directrix ${M(dirEq(vert, h, k, p))}. Write its equation.`, [{ eqn: parEq(vert, h, k, p) }],
          `The vertex is halfway between them, at ${pS(h, k)}, and p = ${p} (from vertex to focus). So ${P(parEq(vert, h, k, p))}.`); }
      const eq = (a, v1, v2) => `${v1}^2=${cf(a)}${v2}`, rt = vert ? eq(4 * p, 'x', 'y') : eq(4 * p, 'y', 'x');
      return E.choice(R, `Setting the distance to F${vert ? pS(0, p) : pS(p, 0)} equal to the distance to the line ${M(vert ? `y=${-p}` : `x=${-p}`)}, then simplifying, gives which equation?`, M(rt),
        [M(vert ? eq(2 * p, 'x', 'y') : eq(2 * p, 'y', 'x')), M(vert ? eq(p, 'x', 'y') : eq(p, 'y', 'x')), M(vert ? eq(4 * p, 'y', 'x') : eq(4 * p, 'x', 'y'))],
        `Squaring both distances and cancelling leaves ${P(rt)}: the coefficient is 4p = ${4 * p}, and the squared variable is the one along the directrix.`); } },
    c: { t: 'find focus and directrix', g: R => {
      const vert = R.bool(), h = R.int(-5, 5), k = R.int(-5, 5), p = R.pick(PV), eq = parEq(vert, h, k, p);
      return E.num(`Find the focus and the directrix of ${M(eq)}.`, [{ label: 'focus', point: ptA(...focus(vert, h, k, p)) }, { label: 'directrix', eqn: dirEq(vert, h, k, p) }], parWhy(vert, h, k, p)); } },
    d: { t: 'the value of p', g: R => {
      const kind = R.int(0, 3), vert = R.bool(), h = R.int(-5, 5), k = R.int(-5, 5);
      if (kind === 0) { const p = R.pick(PV), n = 4 * Math.abs(p), sgn = p < 0 ? '-' : '', tail = v => v ? (v > 0 ? '+' : '') + v : '';
        // solved for y (or x): y = (x − h)²/(4p) + k, so 4p must be read off the denominator
        const eq = vert ? `y=${sgn}${sq('x', h)}/${n}${tail(k)}` : `x=${sgn}${sq('y', k)}/${n}${tail(h)}`;
        return E.num(`What is the value of p for ${M(eq)}?`, [{ label: 'p =', ans: p }], `Rearrange to ${P(parEq(vert, h, k, p))}, the form ${vert ? '(x − h)² = 4p(y − k)' : '(y − k)² = 4p(x − h)'}: 4p = ${fv(4 * p)}, so p = ${P(fv(p))}. ${p > 0 ? 'Positive' : 'Negative'}, so it opens ${opens(vert, p)}.`); }
      if (kind === 1) { const p = R.pick([1, 2, 3, 4, 5, -1, -2, -3, -4]), eq = parEq(vert, h, k, p);
        return E.num(`How far is the focus of ${M(eq)} from its directrix?`, [{ label: 'distance =', ans: 2 * Math.abs(p) }], `4p = ${4 * p}, so p = ${p}: the focus is ${Math.abs(p)} from the vertex and the directrix is ${Math.abs(p)} on the other side. They are ${2 * Math.abs(p)} apart, not ${Math.abs(p)}.`); }
      if (kind === 2) { const d = R.int(1, 10), s = R.pick([1, -1]), p = s * d / 2, eq = parEq(vert, h, k, p);
        return E.num(`A parabola has vertex ${pS(h, k)} and opens ${opens(vert, p)}. Its focus is ${d} units from its directrix. Write its equation.`, [{ eqn: eq }], `The vertex is halfway, so p = ${P(fv(p))} (${p > 0 ? 'positive' : 'negative'} for ${opens(vert, p)}) and 4p = ${fv(4 * p)}: ${P(eq)}.`); }
      const p = R.pick([1, 2, 3, 4, 5, 6, -1, -2, -3, -4, -5, -6]), [fx, fy] = focus(vert, h, k, p);
      return E.num(`A parabola has vertex ${pS(h, k)} and focus ${pS(fx, fy)}. What is p? (p is negative when it opens ${vert ? 'down' : 'left'}.)`, [{ label: 'p =', ans: p }], `The focus is ${Math.abs(p)} ${vert ? (p > 0 ? 'above' : 'below') : (p > 0 ? 'right of' : 'left of')} the vertex, so p = ${p}.`); } },
    e: { t: 'the focal distance shortcut', g: R => {
      if (R.bool(0.6)) { const vert = R.bool(), h = R.int(-5, 5), k = R.int(-5, 5), p = R.pick([1, 2, 3, -1, -2, -3]), t = nz(R, -3, 3), eq = parEq(vert, h, k, p);
        const u = vert ? h + 2 * p * t : k + 2 * p * t, other = vert ? k + p * t * t : h + p * t * t, d = Math.abs(p) * (t * t + 1);
        return E.num(`The point of ${M(eq)} with ${vert ? 'x' : 'y'} = ${u} is how far from the focus?`, [{ label: 'distance =', ans: d }],
          `On the curve, ${vert ? 'y' : 'x'} = ${other}. Distance to the focus equals distance to the directrix ${P(dirEq(vert, h, k, p))}: |${nt(other)} − ${par(fv((vert ? k : h) - p)).replace('-', '−')}| = ${d}. No square root needed.`); }
      const n = R.pick([2, 4, 6, 8, 12, 16]), b = R.int(-3, 3), c = R.int(-6, 6), s = R.pick([1, -1]), hh = -s * n * b / 2, kk = c - s * n * b * b / 4;
      const eq = `y=${s < 0 ? '-' : ''}x^2/${n}${b ? (b > 0 ? '+' : '-') + (Math.abs(b) === 1 ? '' : Math.abs(b)) + 'x' : ''}${c ? (c > 0 ? '+' : '') + c : ''}`;
      return E.num(`The latus rectum is the chord through the focus parallel to the directrix. How long is it for ${M(eq)}?`, [{ label: 'length =', ans: n }],
        `Multiply by ${s * n} and complete the square: ${P(`${sq('x', hh)}=${s * n}${shv('y', kk)}`)}. So |4p| = ${n}, and the latus rectum is |4p| = ${n} long (its ends are 2|p| either side of the focus).`); } },
    f: { t: 'focal chords', g: R => {
      if (R.bool()) { const p = R.int(1, 6), vert = R.bool(), sg = R.pick([1, -1]); let a; do a = R.int(p + 1, 4 * p + 6); while (false);
        const eq = vert ? `x^2=${cf(4 * p * sg)}y` : `y^2=${cf(4 * p * sg)}x`, n = a * p, d = a - p, g = gcd(n, d);
        return E.num(`A chord of ${M(eq)} passes through the focus. One end is ${a} from the focus. How far is the other end from the focus?`, [{ label: 'distance =', frac: [n / g, d / g], form: 'any' }],
          `About the focus, the curve is r = 2p/(1 − cos θ) with p = ${p}. The other end is at θ + 180°, so 1/r₁ + 1/r₂ = (1 − cos θ + 1 + cos θ)/(2p) = 1/p. Then 1/r₂ = 1/${p} − 1/${a} = ${E.fracStr(d, n)}, so r₂ = ${E.fracStr(n, d)}.`); }
      const p = R.int(1, 6), m = R.pick([1, 2, 3, -1, -2, -3, 1 / 2, -1 / 2]), L = 4 * p * (1 + m * m), mx = Number.isInteger(m) ? `${cf(m)}x` : `(${fv(m)})x`, A = 4 * p * m, sy = 4 * p * m * m + 2 * p;
      return E.num(`A chord of ${M(`x^2=${4 * p}y`)} passes through the focus and has slope ${P(fv(m))}. How long is it?`, [{ label: 'length =', ans: L }],
        `The focus is (0, ${p}), so the chord is y = ${P(mx)} + ${p}. Substituting: x² ${A < 0 ? '+' : '−'} ${P(fv(Math.abs(A)))}x − ${4 * p * p} = 0, so x₁ + x₂ = ${P(fv(A))} and y₁ + y₂ = ${P(fv(m))}(x₁ + x₂) + ${2 * p} = ${P(fv(sy))}. Each end's distance to the focus equals its distance to the directrix, y + ${p}, so the length is ${P(fv(sy))} + ${2 * p} = ${L}.`); } },
  });

  /* ================= V.12.03 Parabola equations ================= */
  S('V.12.03', 'Parabola equations', {
    a: { t: 'vertical opening', g: R => {
      const h = R.int(-6, 6), k = R.int(-6, 6), p = R.pick(PV), eq = parEq(true, h, k, p), kind = R.int(0, 3);
      if (kind === 0) return E.num(`What is the vertex of ${M(eq)}?`, [{ label: 'vertex', point: ptA(h, k) }], `Match (x − h)² = 4p(y − k): h = ${h}, k = ${k}. The signs inside flip, so the vertex is ${pS(h, k)}.`);
      if (kind === 1) { const q = R.bool() ? Math.abs(p) : -Math.abs(p), e2 = parEq(true, h, k, q);
        return E.choiceFixed(`Does ${M(e2)} open up or down?`, ['up', 'down'], q > 0 ? 0 : 1, `x is squared, so it opens up or down. 4p = ${fv(4 * q)} is ${q > 0 ? 'positive: up' : 'negative: down'}.`); }
      if (kind === 2) return E.num(`Find the focus of ${M(eq)}.`, [{ label: 'focus', point: ptA(...focus(true, h, k, p)) }], parWhy(true, h, k, p));
      return E.num(`Find the directrix of ${M(eq)}.`, [{ label: 'directrix', eqn: dirEq(true, h, k, p) }], parWhy(true, h, k, p)); } },
    b: { t: 'horizontal opening', g: R => {
      const h = R.int(-6, 6), k = R.int(-6, 6), p = R.pick(PV), eq = parEq(false, h, k, p), kind = R.int(0, 3);
      if (kind === 0) { const q = R.bool() ? Math.abs(p) : -Math.abs(p), e2 = parEq(false, h, k, q);
        return E.choiceFixed(`Which way does ${M(e2)} open?`, ['up', 'down', 'left', 'right'], q > 0 ? 3 : 2, `y is squared, so x depends on y²: it opens sideways. 4p = ${fv(4 * q)} is ${q > 0 ? 'positive: right' : 'negative: left'}.`); }
      if (kind === 1) return E.num(`What is the vertex of ${M(eq)}?`, [{ label: 'vertex', point: ptA(h, k) }], `Match (y − k)² = 4p(x − h): k = ${k}, h = ${h}. Careful with order: the vertex is (h, k) = ${pS(h, k)}.`);
      if (kind === 2) return E.num(`Find the focus of ${M(eq)}.`, [{ label: 'focus', point: ptA(...focus(false, h, k, p)) }], parWhy(false, h, k, p));
      return E.num(`Find the directrix of ${M(eq)}.`, [{ label: 'directrix', eqn: dirEq(false, h, k, p) }], parWhy(false, h, k, p)); } },
    c: { t: 'write from features', g: R => {
      const vert = R.bool(), h = R.int(-6, 6), k = R.int(-6, 6), kind = R.int(0, 3);
      if (kind === 3) { const p = R.pick([1, 2, 3, -1, -2, -3]), t = nz(R, -3, 3), x0 = vert ? h + 2 * p * t : h + p * t * t, y0 = vert ? k + p * t * t : k + 2 * p * t, eq = parEq(vert, h, k, p);
        return E.num(`A parabola has vertex ${pS(h, k)}, opens ${vert ? 'up or down' : 'left or right'}, and passes through ${pS(x0, y0)}. Write its equation.`, [{ eqn: eq }],
          `${vert ? `(${x0} − ${h})² = 4p(${y0} − ${k})` : `(${y0} − ${k})² = 4p(${x0} − ${h})`}: ${(2 * p * t) ** 2} = 4p · ${p * t * t}, so 4p = ${4 * p}: ${P(eq)}.`.replace(/− -/g, '+ ')); }
      const p = R.pick(PV), eq = parEq(vert, h, k, p), F = focus(vert, h, k, p), D = dirEq(vert, h, k, p);
      if (kind === 0) return E.num(`Write the equation of the parabola with vertex ${pS(h, k)} and focus ${pS(...F)}.`, [{ eqn: eq }], `The focus is ${P(fv(Math.abs(p)))} ${vert ? (p > 0 ? 'above' : 'below') : (p > 0 ? 'right of' : 'left of')} the vertex, so p = ${P(fv(p))} and 4p = ${fv(4 * p)}: ${P(eq)}.`);
      if (kind === 1) return E.num(`Write the equation of the parabola with focus ${pS(...F)} and directrix ${M(D)}.`, [{ eqn: eq }], `The vertex is halfway between them: ${pS(h, k)}. p = ${P(fv(p))} (vertex to focus), so 4p = ${fv(4 * p)}: ${P(eq)}.`);
      return E.num(`Write the equation of the parabola with vertex ${pS(h, k)} and directrix ${M(D)}.`, [{ eqn: eq }], `The directrix is ${P(fv(Math.abs(p)))} from the vertex, and the focus is the same distance on the other side, so p = ${P(fv(p))} and 4p = ${fv(4 * p)}: ${P(eq)}.`); } },
    d: { t: 'graph', g: R => {
      if (R.bool()) { let vert, h, k, p, alts;
        do { vert = R.bool(); h = R.int(-3, 3); k = R.int(-3, 3); p = R.pick([1 / 2, 1, 2, -1 / 2, -1, -2]);
          alts = [[vert, h, k, -p], [!vert, h, k, p], (h || k) ? [vert, -h, -k, p] : [vert, h + R.pick([-3, 3]), k, p]]; } while (false);
        const fix = [-8, 8, -8, 8], pic = a => parPic(a[0], a[1], a[2], a[3], { fix, w: 210 });
        return E.choice(R, `Which graph shows ${M(parEq(vert, h, k, p))}?`, pic([vert, h, k, p]), alts.map(pic),
          `Vertex ${pS(h, k)}; ${vert ? 'x' : 'y'} is squared and 4p = ${fv(4 * p)}, so it opens ${opens(vert, p)}.`); }
      const vert = R.bool(), h = R.int(-4, 4), k = R.int(-4, 4), p = R.pick([1, 2, -1, -2, 1 / 2, -1 / 2]), t = R.pick(Math.abs(p) === 1 / 2 ? [2, -2] : [1, -1]);
      const x0 = vert ? h + 2 * p * t : h + p * t * t, y0 = vert ? k + p * t * t : k + 2 * p * t, eq = parEq(vert, h, k, p);
      return E.num('Write the equation of the parabola shown.', [{ eqn: eq }],
        `The vertex is ${pS(h, k)}. Put ${pS(x0, y0)} into ${vert ? '(x − h)² = 4p(y − k)' : '(y − k)² = 4p(x − h)'}: ${(2 * p * t) ** 2} = 4p · ${fv(p * t * t)}, so 4p = ${fv(4 * p)}: ${P(eq)}.`,
        { visual: parPic(vert, h, k, p, { points: [[h, k, pS(h, k)], [x0, y0, pS(x0, y0)]] }) }); } },
  });

  /* ================= V.12.04 Ellipse definition ================= */
  S('V.12.04', 'Ellipse definition', {
    a: { t: 'sum of distances to foci', g: R => {
      const kind = R.int(0, 4);
      if (kind >= 3) { // proof: the constant sum is the major axis, read off at a vertex
        const [a, , c] = R.pick(ELL3), vert = R.bool(), neg = R.bool(), at = v => vert ? pS(0, v) : pS(v, 0), near = neg ? 'F₁' : 'F₂', far = neg ? 'F₂' : 'F₁';
        const head = `An ellipse has foci F₁${at(-c)} and F₂${at(c)} and a vertex V${at(neg ? -a : a)}. Every point P on it has PF₁ + PF₂ = k, for one constant k.`;
        const L = ['Every point P on the ellipse has PF₁ + PF₂ = k (given).', 'V is on the ellipse, so VF₁ + VF₂ = k.', `V${far} = ${a} + ${c} = ${a + c}`, `V${near} = ${a} − ${c} = ${a - c}`, `So k = VF₁ + VF₂ = ${2 * a}, the length of the major axis.`];
        const why = `V is ${a} from the center and the foci are ${c} from it, so V is ${a + c} from ${far} and ${a - c} from ${near}. These add to ${2 * a} = 2 × ${a}, the full length of the major axis.`;
        if (kind === 3) return K.orderQ(R, `${head} Put the steps in order to show that k is the length of the major axis.`, L, [[], [0], [], [], []], `${why} The two distance lines can come in any order.`, { fixed: 1 });
        const j = R.pick([2, 3, 4]), ok = [`V${far} = ${a + c}`, `V${near} = ${a - c}`, `k = ${2 * a}`][j - 2];
        const cands = [[`V${far} = ${a - c}`, `V${far} = ${a}`, `V${far} = ${2 * c}`, `V${far} = ${c}`], [`V${near} = ${a + c}`, `V${near} = ${a}`, `V${near} = ${c}`, `V${near} = ${2 * c}`], [`k = ${2 * c}`, `k = ${a + c}`, `k = ${a}`, `k = ${4 * a}`]][j - 2];
        return E.choice(R, `${head} This proof shows that k is the length of the major axis. Which statement belongs in line ${j + 1}?${numbered(L.map((l, i) => i === j ? '<b>?</b>' : l))}`, ok, uniq3(ok, cands), why); }
      if (kind === 0) { const [a, b, c] = R.pick(ELL3), d = R.int(a - c + 1, a + c - 1);
        return E.num(`An ellipse has major axis ${2 * a} long and foci F₁ and F₂ that are ${2 * c} apart. P is on the ellipse and PF₁ = ${d}. Find PF₂.`, [{ label: 'PF₂ =', ans: 2 * a - d }], `PF₁ + PF₂ is always the major axis, ${2 * a} (not the ${2 * c} between the foci): PF₂ = ${2 * a} − ${d} = ${2 * a - d}.`); }
      if (kind === 1) { const [a, b, c] = R.pick(ELL3.filter(t => t[0] <= 17)), vert = R.bool(), d = R.int(a - c + 1, a + c - 1);
        const eq = vert ? ellEq(0, 0, b * b, a * a) : ellEq(0, 0, a * a, b * b);
        return E.num(`P is on ${M(eq)} and is ${d} from one focus. How far is P from the other focus?`, [{ label: 'distance =', ans: 2 * a - d }], `a² = ${a * a} is the larger denominator, so a = ${a} and the distances add to 2a = ${2 * a}: ${2 * a} − ${d} = ${2 * a - d}.`); }
      const f = R.pick(FP.filter(q => q.d1 <= 26)), sx = R.pick([1, -1]), sy = R.pick([1, -1]), h = R.int(-4, 4), k = R.int(-4, 4);
      return E.num(`An ellipse has foci ${pS(h - f.c, k)} and ${pS(h + f.c, k)} and passes through ${pS(h + sx * f.x, k + sy * f.y)}. What is the constant sum of distances from any point on it to the foci?`, [{ label: 'sum =', ans: f.d1 + f.d2 }],
        `From the point, the foci are ${f.x + f.c} and ${Math.abs(f.x - f.c)} across and ${f.y} up or down: √(${f.x + f.c}² + ${f.y}²) = ${f.d1} and √(${Math.abs(f.x - f.c)}² + ${f.y}²) = ${f.d2}. Every point of the ellipse has the same sum: ${f.d1 + f.d2}.`); } },
    b: { t: 'string-and-pins drawing', g: R => {
      const kind = R.int(0, 2), u = R.bool() ? 'cm' : 'in';
      if (kind === 0) { const [a, b, c] = R.pick(ELL3), s = R.pick([1, 2]);
        return E.num(`Two pins are ${2 * c * s / 2} ${u} apart. The ends of a ${2 * a * s / 2} ${u} string are tied to the pins, and a pencil keeps the string tight as it traces an ellipse. How long are the major and minor axes?`, [{ label: 'major axis =', ans: a * s }, { label: 'minor axis =', ans: b * s }],
          `PF₁ + PF₂ is always the string's length, so the major axis is ${a * s}. Half of it, ${a * s / 2}, and half the pin gap, ${c * s / 2}, give the semi-minor axis √(${a * s / 2}² − ${c * s / 2}²) = ${b * s / 2}, so the minor axis is ${b * s}.`); }
      if (kind === 1) { const [a, b, c] = R.pick(ELL3);
        return E.num(`You want to draw an ellipse ${2 * a} ${u} long and ${2 * b} ${u} wide with two pins and a string tied to them. How far apart should the pins be, and how long should the string be?`, [{ label: 'pin gap =', ans: 2 * c }, { label: 'string =', ans: 2 * a }],
          `The string is the major axis, ${2 * a}. The pins are the foci: c = √(${a}² − ${b}²) = ${c}, so they are ${2 * c} apart.`); }
      const L = R.int(6, 30), g = R.int(2, L - 2), tight = R.bool(), side = R.int(1, L - 1);
      if (tight) return E.num(`${an(L)} ${L} ${u} string is tied to two pins ${g} ${u} apart. The pencil is at the top of the ellipse, straight above the middle of the pins. How far is it from each pin?`, [{ label: 'distance =', ans: L / 2 }], `At the top the two parts of the string are equal, and they add to ${L}: each is ${L / 2}.`);
      return E.num(`${an(L)} ${L} ${u} string is tied to two pins. While the pencil traces the ellipse, the string from the pencil to one pin is ${side} ${u}. How long is the other part?`, [{ label: 'length =', ans: L - side }], `The two parts always add to the string's length: ${L} − ${side} = ${L - side}.`); } },
    c: { t: 'major and minor axes', g: R => {
      const kind = R.int(0, 2), h = R.int(-6, 6), k = R.int(-6, 6); let a, b; do { a = R.int(2, 9); b = R.int(1, 8); } while (b >= a);
      const vert = R.bool(), eq = vert ? ellEq(h, k, b * b, a * a) : ellEq(h, k, a * a, b * b);
      if (kind === 0) return E.num(`How long are the major and minor axes of ${M(eq)}?`, [{ label: 'major axis =', ans: 2 * a }, { label: 'minor axis =', ans: 2 * b }], `The larger denominator is a² = ${a * a} and the smaller is b² = ${b * b}. The major axis is 2a = ${2 * a}, the minor axis 2b = ${2 * b}.`);
      if (kind === 1) { const hi = R.bool(), lab = vert ? (hi ? 'upper' : 'lower') : (hi ? 'right' : 'left'), s = hi ? 1 : -1;
        return E.num(`Find the ${lab} end of the major axis of ${M(eq)}.`, [{ label: 'vertex', point: vert ? ptA(h, k + s * a) : ptA(h + s * a, k) }], `The center is ${pS(h, k)}. The larger denominator ${a * a} is under ${vert ? 'y' : 'x'}, so the major axis is ${vert ? 'vertical' : 'horizontal'}, with a = ${a}: ${vert ? pS(h, k + s * a) : pS(h + s * a, k)}.`); }
      const hi = R.bool(), lab = vert ? (hi ? 'right' : 'left') : (hi ? 'upper' : 'lower'), s = hi ? 1 : -1;
      return E.num(`Find the ${lab} end of the minor axis of ${M(eq)}.`, [{ label: 'co-vertex', point: vert ? ptA(h + s * b, k) : ptA(h, k + s * b) }], `The center is ${pS(h, k)}. The major axis is ${vert ? 'vertical' : 'horizontal'} (${a * a} under ${vert ? 'y' : 'x'}), so the minor axis is ${vert ? 'horizontal' : 'vertical'}, with b = ${b}: ${vert ? pS(h + s * b, k) : pS(h, k + s * b)}.`); } },
    d: { t: 'eccentricity', g: R => {
      const kind = R.int(0, 3);
      if (kind === 0) { const [a, b, c] = R.pick(ELL3), s = R.pick([1, 2, 3]);
        return E.num(`An ellipse has semi-major axis ${a * s} and its foci are ${c * s} from the center. Find its eccentricity. Give an exact answer.`, [{ label: 'e =', exact: E.fracStr(c, a), form: 'simplest' }], `e = c/a = ${c * s}/${a * s} = ${E.fracStr(c, a)}.`); }
      if (kind === 1) { let a, b; do { a = R.int(2, 9); b = R.int(1, 8); } while (b >= a); const vert = R.bool(), eq = vert ? ellEq(0, 0, b * b, a * a) : ellEq(0, 0, a * a, b * b), e = E.surdStr(0, 1, a * a - b * b, a);
        return E.num(`Find the eccentricity of ${M(eq)}. Give an exact answer.`, [{ label: 'e =', exact: e, form: 'simplest' }], `a = ${a}, b = ${b}, so c = √(${a * a} − ${b * b}) = ${P(sqS(a * a - b * b))} and e = c/a = ${P(e)}.`); }
      if (kind === 2) { const pool = [[5, 4], [5, 3], [5, 2], [5, 1], [4, 3], [4, 1], [6, 5], [6, 2], [3, 2], [3, 1], [7, 6], [7, 2]], four = R.sample(pool, 4), es = four.map(([a, b]) => b / a), best = es.indexOf(Math.max(...es));
        if (es.filter(v => v === es[best]).length > 1) return E.num(`Find the eccentricity of ${M('x^2/25+y^2/16=1')}. Give an exact answer.`, [{ label: 'e =', exact: '3/5', form: 'simplest' }], 'c = √(25 − 16) = 3, so e = c/a = 3/5.');
        const eqs = four.map(([a, b]) => M(ellEq(0, 0, a * a, b * b)));
        return E.choice(R, 'Which ellipse is closest to a circle?', eqs[best], eqs.filter((_, i) => i !== best), `The closer b/a is to 1, the smaller e = c/a and the rounder the ellipse. Here b/a = ${four[best][1]}/${four[best][0]} is the largest.`); }
      const [a, b, c] = R.pick(ELL3), s = R.pick([1, 2]), askB = R.bool();
      return E.num(`An ellipse has eccentricity ${E.fracStr(c, a)} and semi-major axis ${a * s}. Find ${askB ? 'its semi-minor axis b' : 'the distance c from its center to a focus'}.`, [{ label: askB ? 'b =' : 'c =', ans: askB ? b * s : c * s }],
        `c = ea = ${E.fracStr(c, a)} × ${a * s} = ${c * s}.${askB ? ` Then b = √(${a * s}² − ${c * s}²) = ${b * s}.` : ''}`); } },
  });
  function ellEq(h, k, A, B) { return `${ov(sq('x', h), A)}+${ov(sq('y', k), B)}=1`; }

  /* ================= V.12.05 Ellipse equations & graphs ================= */
  const pickAB = (R, max = 6) => { let a, b; do { a = R.int(2, max); b = R.int(1, max - 1); } while (b >= a); return [a, b]; };
  S('V.12.05', 'Ellipse equations & graphs', {
    a: { t: 'standard form', g: R => {
      const h = R.int(-6, 6), k = R.int(-6, 6), [a, b] = pickAB(R, 9), vert = R.bool(), eq = vert ? ellEq(h, k, b * b, a * a) : ellEq(h, k, a * a, b * b), kind = R.int(0, 1);
      if (kind === 0) return E.num(`Write the equation of the ellipse with center ${pS(h, k)}, a ${vert ? 'vertical' : 'horizontal'} major axis of length ${2 * a} and a minor axis of length ${2 * b}.`, [{ eqn: eq }], `a = ${a}, b = ${b}. The major axis is ${vert ? 'vertical' : 'horizontal'}, so a² = ${a * a} goes under the ${vert ? 'y' : 'x'} term: ${P(eq)}.`);
      const V1 = vert ? [[h, k + a], [h, k - a]] : [[h + a, k], [h - a, k]], C1 = vert ? [[h + b, k], [h - b, k]] : [[h, k + b], [h, k - b]];
      return E.num(`An ellipse has vertices ${pS(...V1[0])} and ${pS(...V1[1])}, and co-vertices ${pS(...C1[0])} and ${pS(...C1[1])}. Write its equation.`, [{ eqn: eq }], `The center is the midpoint, ${pS(h, k)}. The vertices are ${a} from it and the co-vertices ${b}, so ${P(eq)}.`); } },
    b: { t: 'horizontal vs vertical', g: R => {
      const h = R.int(-5, 5), k = R.int(-5, 5), [a, b] = pickAB(R, 9), vert = R.bool(), A = vert ? b * b : a * a, B = vert ? a * a : b * b, yFirst = R.bool(0.4);
      const eq = yFirst ? `${ov(sq('y', k), B)}+${ov(sq('x', h), A)}=1` : ellEq(h, k, A, B);
      if (R.bool(0.6)) return E.choiceFixed(`Is the major axis of ${M(eq)} horizontal or vertical?`, ['horizontal', 'vertical'], vert ? 1 : 0, `The larger denominator, ${a * a}, is under ${vert ? 'y' : 'x'}${yFirst ? ' (whichever term is written first)' : ''}, so the ellipse is ${vert ? 'tall: vertical' : 'wide: horizontal'}.`);
      return E.num(`How wide and how tall is the ellipse ${M(eq)}?`, [{ label: 'width =', ans: 2 * Math.sqrt(A) }, { label: 'height =', ans: 2 * Math.sqrt(B) }], `Under x is ${A}, so it reaches ${Math.sqrt(A)} left and right: width ${2 * Math.sqrt(A)}. Under y is ${B}: height ${2 * Math.sqrt(B)}.`); } },
    c: { t: 'graph from equation', g: R => {
      const h = R.int(-3, 3), k = R.int(-3, 3), [a, b] = pickAB(R, 5), vert = R.bool(), ax = vert ? b : a, ay = vert ? a : b, eq = ellEq(h, k, ax * ax, ay * ay);
      const fix = [-9, 9, -9, 9], pic = (hh, kk, x, y) => ellPic(hh, kk, x, y, { fix, w: 210 });
      const sqd = [h, k, Math.min(ax * ax, 8), Math.min(ay * ay, 8)], alts = [[h, k, ay, ax], (h || k) ? [-h, -k, ax, ay] : [h + 2, k - 1, ax, ay], (sqd[2] === ax && sqd[3] === ay) || (sqd[2] === ay && sqd[3] === ax) ? [h, k, ax + 1, ay + 1] : sqd];
      return E.choice(R, `Which graph shows ${M(eq)}?`, pic(h, k, ax, ay), alts.map(q => pic(...q)),
        `Center ${pS(h, k)}. Under x is ${ax * ax}, so it reaches ${ax} left and right; under y is ${ay * ay}, so ${ay} up and down.`); } },
    d: { t: 'write from graph', g: R => {
      const h = R.int(-4, 4), k = R.int(-4, 4), [a, b] = pickAB(R, 6), vert = R.bool(), ax = vert ? b : a, ay = vert ? a : b, eq = ellEq(h, k, ax * ax, ay * ay);
      return E.num('Write the equation of the ellipse shown.', [{ eqn: eq }], `The center is ${pS(h, k)}. It reaches ${ax} left and right and ${ay} up and down, so ${P(eq)}.`,
        { visual: ellPic(h, k, ax, ay, { points: [[h, k, pS(h, k)], [h + ax, k, ''], [h, k + ay, '']] }) }); } },
  });

  /* ================= V.12.06 Ellipse foci ================= */
  const fociF = (vert, h, k, cS) => vert ? [{ label: 'lower focus', point: [fv(h), addS(k, cS, -1)] }, { label: 'upper focus', point: [fv(h), addS(k, cS, 1)] }] : [{ label: 'left focus', point: [addS(h, cS, -1), fv(k)] }, { label: 'right focus', point: [addS(h, cS, 1), fv(k)] }];
  // ellipse at the origin with O, both foci and a minor-axis end B marked, and the focal triangle drawn
  const ellProofFig = (a, b, c, vert) => { const X = (x, y) => vert ? [y, x] : [x, y], Bp = X(0, b), F1 = X(-c, 0), F2 = X(c, 0);
    return plot(vert ? [-b, b, -a, a] : [-a, a, -b, b], { param: [vert ? ellP(0, 0, b, a) : ellP(0, 0, a, b)], points: [[0, 0, 'O'], [...F1, 'F₁'], [...F2, 'F₂'], [...Bp, 'B']],
      segs: [[0, 0, ...Bp], [0, 0, ...F2], [...Bp, ...F1, C.red], [...Bp, ...F2, C.red]], label: 'ellipse with its foci and the end of the minor axis' }); };
  S('V.12.06', 'Ellipse foci', {
    a: { t: 'c² = a² − b²', g: R => {
      const kind = R.int(0, 4);
      if (kind >= 3) { // proof of c² = a² − b² from the minor-axis end B
        const [a, b, c] = R.pick(ELL3.filter(t => t[0] <= 17)), vert = R.bool(), vis = ellProofFig(a, b, c, vert);
        const rows = [[`PF₁ + PF₂ = ${2 * a} for every point P on the ellipse`, 'definition of an ellipse'], ['BF₁ = BF₂', 'B is on the perpendicular bisector of F₁F₂'], [`BF₁ + BF₂ = ${2 * a}`, 'B is on the ellipse'],
          [`BF₂ = ${a}`, 'lines 2 and 3'], ['OB² + OF₂² = BF₂²', 'Pythagorean theorem'], [`${b}² + c² = ${a}², so c = ${c}`, 'substitution']];
        const head = `An ellipse with center O has a = ${a} and b = ${b}. B is an end of the minor axis, and the foci F₁ and F₂ are each c from O.`;
        if (kind === 3) return K.orderQ(R, `${head} Put the steps in order to show that c² = a² − b².`, rows.map(r => `${r[0]} <i>(${r[1]})</i>`), [[], [], [0], [1, 2], [], []],
          `B is equally far from both foci and its two distances add to ${2 * a}, so BF₂ = a = ${a}. Right triangle OBF₂ then gives b² + c² = a², so c = √(${a * a} − ${b * b}) = ${c}. The equal-distance line and the Pythagoras line can come anywhere before they are used.`, { fixed: 1, visual: vis });
        const j = R.pick([1, 2, 4]), W = { 1: ['B is on the ellipse', 'Pythagorean theorem', 'B is the midpoint of F₁F₂'], 2: ['B is on the perpendicular bisector of F₁F₂', 'Pythagorean theorem', 'BF₁ = BF₂'], 4: ['converse of the Pythagorean theorem', 'B is on the ellipse', 'B is on the perpendicular bisector of F₁F₂'] }[j];
        return E.choice(R, `${head} What is the missing reason in this proof that c² = a² − b²?${tbl(rows, j)}`, rows[j][1], W,
          { 1: 'The minor axis is the perpendicular bisector of F₁F₂, so B is equally far from both foci. (O, not B, is the midpoint of F₁F₂.)', 2: `B is a point of the ellipse, so its two distances add to the constant 2a = ${2 * a}.`, 4: '∠BOF₂ = 90°, so the Pythagorean theorem gives the sides. The converse goes the other way, from side lengths to a right angle.' }[j], { visual: vis }); }
      if (kind === 0) { const nice = R.bool(0.6); let a, b; if (nice) [a, b] = R.pick(ELL3); else [a, b] = pickAB(R, 9);
        const vert = R.bool(), eq = vert ? ellEq(0, 0, b * b, a * a) : ellEq(0, 0, a * a, b * b), c2 = a * a - b * b;
        return E.num(`Find c, the distance from the center to each focus, for ${M(eq)}.${isSq(c2) ? '' : ' Give an exact answer.'}`, [Object.assign({ label: 'c =' }, ex(c2))], `c² = a² − b² = ${a * a} − ${b * b} = ${c2}, so c = ${P(isSq(c2) ? String(Math.sqrt(c2)) : sqS(c2))}. (Not a² + b²: the foci are inside, so c < a.)`); }
      if (kind === 1) { const [a, b, c] = R.pick(ELL3); return E.num(`An ellipse has semi-major axis ${a} and its foci are ${c} from the center. Find the semi-minor axis b.`, [{ label: 'b =', ans: b }], `c² = a² − b², so b² = ${a * a} − ${c * c} = ${b * b} and b = ${b}.`); }
      const [a, b, c] = R.pick(ELL3), wrong = sqS(a * a + b * b);
      return E.choice(R, `An ellipse has a = ${a} and b = ${b}. How far is each focus from the center?`, String(c), [P(wrong), String(a + b), String(a - b)].filter(s => s !== String(c)), `c² = a² − b² = ${a * a - b * b}, so c = ${c}. Adding the squares would put the foci outside the ellipse.`); } },
    b: { t: 'find the foci', g: R => {
      const h = R.int(-6, 6), k = R.int(-6, 6), vert = R.bool(), nice = R.bool(0.65); let a, b; if (nice) [a, b] = R.pick(ELL3.filter(t => t[0] <= 17)); else [a, b] = pickAB(R, 8);
      const c2 = a * a - b * b, cS = isSq(c2) ? String(Math.sqrt(c2)) : sqS(c2), eq = vert ? ellEq(h, k, b * b, a * a) : ellEq(h, k, a * a, b * b);
      return E.num(`Find the foci of ${M(eq)}.${isSq(c2) ? '' : ' Give exact answers.'}`, fociF(vert, h, k, cS),
        `Center ${pS(h, k)}; the major axis is ${vert ? 'vertical' : 'horizontal'} (${a * a} under ${vert ? 'y' : 'x'}). c² = ${a * a} − ${b * b} = ${c2}, so the foci are ${vert ? `(${h}, ${pm(k, cS)})` : `(${pm(h, cS)}, ${k})`}.`); } },
    c: { t: 'whispering galleries', g: R => {
      const [a, b, c] = R.pick(ELL3), s = R.pick([1, 2]), u = unitL(R.bool() ? { units: 'imperial' } : null), kind = R.int(0, 2), L = 2 * a * s, W = 2 * b * s;
      if (kind === 0) return E.num(`An elliptical whispering gallery is ${L} ${u} long and ${W} ${u} wide. Two people stand at the foci so they can hear each other whisper. How far apart are they?`, [{ label: 'distance =', ans: 2 * c * s }], `a = ${a * s}, b = ${b * s}, so c = √(${a * s}² − ${b * s}²) = ${c * s}. The foci are 2c = ${2 * c * s} ${u} apart.`);
      if (kind === 1) return E.num(`An elliptical whispering gallery is ${L} ${u} long and ${W} ${u} wide. How far from the nearest end wall should you stand to be at a focus?`, [{ label: 'distance =', ans: (a - c) * s }], `c = √(${a * s}² − ${b * s}²) = ${c * s}. The end wall is a = ${a * s} from the center, so stand ${a * s} − ${c * s} = ${(a - c) * s} ${u} from it.`);
      return E.num(`In an elliptical room ${L} ${u} long, the two foci are ${2 * c * s} ${u} apart. How wide is the room?`, [{ label: 'width =', ans: W }], `a = ${a * s}, c = ${c * s}, so b = √(${a * s}² − ${c * s}²) = ${b * s} and the width is ${W} ${u}.`); } },
    d: { t: 'planet orbits', g: R => {
      const kind = R.int(0, 2);
      if (kind === 0) { let q, Q; do { q = R.int(2, 40) * 5; Q = q + R.int(1, 30) * 5; } while (false); const g = gcd(Q - q, Q + q);
        return E.num(`An object orbits a star on an ellipse with the star at one focus. Its closest distance is ${q} million km and its farthest is ${Q} million km. Find the eccentricity. Give an exact answer.`, [{ label: 'e =', exact: E.fracStr(Q - q, Q + q), form: 'simplest' }],
          `Closest = a − c and farthest = a + c, so 2a = ${q + Q} and 2c = ${Q - q}. e = c/a = ${Q - q}/${Q + q} = ${E.fracStr(Q - q, Q + q)}.`); }
      if (kind === 1) { const a = R.int(2, 30) * 10, e = R.pick([0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.25, 0.05, 0.15]), far = R.bool();
        return E.num(`A comet's orbit is an ellipse with the Sun at a focus, semi-major axis ${a} million km and eccentricity ${e}. Find its ${far ? 'farthest' : 'closest'} distance from the Sun.`, [{ label: 'distance =', ans: +(a * (1 + (far ? 1 : -1) * e)).toFixed(3) }],
          `c = ea = ${e} × ${a} = ${+(a * e).toFixed(3)}. The ${far ? 'farthest point is a + c' : 'closest point is a − c'} = ${+(a * (1 + (far ? 1 : -1) * e)).toFixed(3)} million km.`); }
      const q = R.int(1, 30) * 2, Q = q + R.int(1, 20) * 2;
      return E.num(`A satellite's orbit has the planet's center at a focus. Its closest distance is ${q} thousand km and its farthest ${Q} thousand km. How far is the planet's center from the center of the ellipse?`, [{ label: 'c =', ans: (Q - q) / 2 }], `a − c = ${q} and a + c = ${Q}. Subtract: 2c = ${Q - q}, so c = ${(Q - q) / 2} thousand km.`); } },
    e: { t: 'run it backwards: foci and a point', g: R => {
      const f = R.pick(FP.filter(q => (q.d1 + q.d2) % 2 === 0 && q.d1 + q.d2 <= 36)), a = (f.d1 + f.d2) / 2, b2 = a * a - f.c * f.c, h = R.int(-4, 4), k = R.int(-4, 4), vert = R.bool(), sx = R.pick([1, -1]), sy = R.pick([1, -1]);
      const px = vert ? h + sy * f.y : h + sx * f.x, py = vert ? k + sx * f.x : k + sy * f.y, eq = vert ? ellEq(h, k, b2, a * a) : ellEq(h, k, a * a, b2);
      const F1 = vert ? pS(h, k - f.c) : pS(h - f.c, k), F2 = vert ? pS(h, k + f.c) : pS(h + f.c, k);
      return E.num(`An ellipse has foci ${F1} and ${F2} and passes through ${pS(px, py)}. Write its equation.`, [{ eqn: eq }],
        `The point is ${f.d1} and ${f.d2} from the foci, so 2a = ${f.d1 + f.d2} and a = ${a}. The center is ${pS(h, k)} and c = ${f.c}, so b² = ${a * a} − ${f.c * f.c} = ${b2}: ${P(eq)}.`); } },
    f: { t: 'the focal triangle', g: R => {
      let a, b, c2, ang; do { a = R.int(3, 10); b = R.int(1, a - 1); c2 = a * a - b * b; ang = R.pick([90, 60]); } while (ang === 90 ? c2 < b * b : 4 * c2 < a * a);
      const vert = R.bool(), eq = vert ? ellEq(0, 0, b * b, a * a) : ellEq(0, 0, a * a, b * b);
      if (ang === 90) { const prod = R.bool(0.3);
        return E.num(`P is a point on ${M(eq)} with foci F₁ and F₂, and ∠F₁PF₂ = 90°. Find ${prod ? 'PF₁ · PF₂' : 'the area of triangle F₁PF₂'}.`, [{ label: prod ? 'PF₁ · PF₂ =' : 'area =', ans: prod ? 2 * b * b : b * b }],
          `Let PF₁ = m, PF₂ = n. Then m + n = 2a = ${2 * a} and m² + n² = (2c)² = ${4 * c2}. Squaring the first: 2mn = ${4 * a * a} − ${4 * c2} = ${4 * b * b}, so mn = ${2 * b * b}${prod ? '' : ` and the area is mn/2 = ${b * b} (always b²)`}.`); }
      const ar = E.surdStr(0, b * b, 3, 3);
      return E.num(`P is a point on ${M(eq)} with foci F₁ and F₂, and ∠F₁PF₂ = 60°. Find the area of triangle F₁PF₂. Give an exact answer.`, [{ label: 'area =', exact: ar, form: 'simplest' }],
        `With m + n = ${2 * a} and the law of cosines (2c)² = m² + n² − mn: ${4 * c2} = (m + n)² − 3mn = ${4 * a * a} − 3mn, so mn = ${E.fracStr(4 * b * b, 3)}. Area = ½ · mn · sin 60° = ${P(ar)}.`); } },
  });

  /* ================= V.12.07 Hyperbola definition ================= */
  const hypEq = (vert, h, k, A, B) => vert ? `${ov(sq('y', k), A)}-${ov(sq('x', h), B)}=1` : `${ov(sq('x', h), A)}-${ov(sq('y', k), B)}=1`;
  S('V.12.07', 'Hyperbola definition', {
    a: { t: 'difference of distances', g: R => {
      const kind = R.int(0, 2);
      if (kind === 0) { const [a, b, c] = R.pick(HYP3), d = R.int(c + a, c + a + 15);
        return E.num(`A hyperbola has foci F₁ and F₂, ${2 * c} apart, and its vertices are ${2 * a} apart. P is on the branch nearer F₂, and PF₁ = ${d}. Find PF₂.`, [{ label: 'PF₂ =', ans: d - 2 * a }], `On a hyperbola the distances differ by 2a = ${2 * a} (the vertex gap, not the focus gap). P is nearer F₂, so PF₂ = ${d} − ${2 * a} = ${d - 2 * a}.`); }
      if (kind === 1) { const [a, b, c] = R.pick(HYP3.filter(t => t[0] <= 12)), d = R.int(c + a, c + a + 12);
        return E.num(`P is on the right branch of ${M(hypEq(false, 0, 0, a * a, b * b))}, and it is ${d} from the left focus. How far is it from the right focus?`, [{ label: 'distance =', ans: d - 2 * a }], `a = ${a}, so the distances differ by 2a = ${2 * a}. The right branch is nearer the right focus: ${d} − ${2 * a} = ${d - 2 * a}.`); }
      const f = R.pick(FP.filter(q => q.d1 !== q.d2)), sx = R.pick([1, -1]), sy = R.pick([1, -1]), h = R.int(-4, 4), k = R.int(-4, 4);
      return E.num(`A hyperbola has foci ${pS(h - f.c, k)} and ${pS(h + f.c, k)} and passes through ${pS(h + sx * f.x, k + sy * f.y)}. What is the constant difference of distances from a point on it to the foci?`, [{ label: 'difference =', ans: Math.abs(f.d1 - f.d2) }],
        `The point is ${f.d1} from one focus and ${f.d2} from the other. Every point of the hyperbola has the same difference: ${Math.max(f.d1, f.d2)} − ${Math.min(f.d1, f.d2)} = ${Math.abs(f.d1 - f.d2)}.`); } },
    b: { t: 'transverse and conjugate axes', g: R => {
      const h = R.int(-6, 6), k = R.int(-6, 6), a = R.int(1, 9), b = R.int(1, 9), vert = R.bool(), eq = hypEq(vert, h, k, a * a, b * b), kind = R.int(0, 2);
      if (kind === 0) return E.num(`How long are the transverse and conjugate axes of ${M(eq)}?`, [{ label: 'transverse =', ans: 2 * a }, { label: 'conjugate =', ans: 2 * b }], `The positive term's denominator is a² = ${a * a}, so the transverse axis is 2a = ${2 * a}. The other is b² = ${b * b}: conjugate axis 2b = ${2 * b}. (Size doesn't decide; the sign does.)`);
      if (kind === 1) return E.choiceFixed(`Is the transverse axis of ${M(eq)} horizontal or vertical?`, ['horizontal', 'vertical'], vert ? 1 : 0, `The positive term is the ${vert ? 'y' : 'x'} term, so the branches open ${vert ? 'up and down: vertical' : 'left and right: horizontal'}, whichever denominator is bigger.`);
      const hi = R.bool(), lab = vert ? (hi ? 'upper' : 'lower') : (hi ? 'right' : 'left'), s = hi ? 1 : -1;
      return E.num(`Find the ${lab} vertex of ${M(eq)}.`, [{ label: 'vertex', point: vert ? ptA(h, k + s * a) : ptA(h + s * a, k) }], `Center ${pS(h, k)}. The ${vert ? 'y' : 'x'} term is positive, so the vertices are a = ${a} ${vert ? 'above and below' : 'left and right of'} it: ${vert ? pS(h, k + s * a) : pS(h + s * a, k)}.`); } },
    c: { t: 'c² = a² + b²', g: R => {
      const kind = R.int(0, 2);
      if (kind === 0) { const nice = R.bool(0.6); let a, b; if (nice) [a, b] = R.pick(HYP3); else { a = R.int(1, 8); b = R.int(1, 8); }
        const vert = R.bool(), eq = hypEq(vert, 0, 0, a * a, b * b), c2 = a * a + b * b;
        return E.num(`Find c, the distance from the center to each focus, for ${M(eq)}.${isSq(c2) ? '' : ' Give an exact answer.'}`, [Object.assign({ label: 'c =' }, ex(c2))], `c² = a² + b² = ${a * a} + ${b * b} = ${c2}, so c = ${P(isSq(c2) ? String(Math.sqrt(c2)) : sqS(c2))}. (Not a² − b²: the foci are beyond the vertices, so c > a.)`); }
      if (kind === 1) { const [a, b, c] = R.pick(HYP3); return E.num(`A hyperbola has vertices ${a} from its center and foci ${c} from its center. Find b.`, [{ label: 'b =', ans: b }], `c² = a² + b², so b² = ${c * c} − ${a * a} = ${b * b} and b = ${b}.`); }
      const [a, b, c] = R.pick(HYP3), w = a * a - b * b;
      return E.choice(R, `A hyperbola has a = ${a} and b = ${b}. How far is each focus from the center?`, String(c), [w > 0 ? P(sqS(w)) : String(Math.abs(a - b) || a + b + 1), String(a + b), String(Math.max(a, b))].filter(s => s !== String(c)), `c² = a² + b² = ${c * c}, so c = ${c}, larger than a = ${a}, as it must be.`); } },
    d: { t: 'find the foci', g: R => {
      const h = R.int(-6, 6), k = R.int(-6, 6), vert = R.bool(), nice = R.bool(0.65); let a, b; if (nice) [a, b] = R.pick(HYP3.filter(t => t[2] <= 17)); else { a = R.int(1, 7); b = R.int(1, 7); }
      const c2 = a * a + b * b, cS = isSq(c2) ? String(Math.sqrt(c2)) : sqS(c2), eq = hypEq(vert, h, k, a * a, b * b);
      return E.num(`Find the foci of ${M(eq)}.${isSq(c2) ? '' : ' Give exact answers.'}`, fociF(vert, h, k, cS),
        `Center ${pS(h, k)}; the ${vert ? 'y' : 'x'} term is positive, so the foci are on a ${vert ? 'vertical' : 'horizontal'} line. c² = ${a * a} + ${b * b} = ${c2}, so the foci are ${vert ? `(${h}, ${pm(k, cS)})` : `(${pm(h, cS)}, ${k})`}.`); } },
  });

  /* ================= V.12.08 Hyperbola graphs ================= */
  const asym = (vert, h, k, a, b) => { const n = vert ? a : b, d = vert ? b : a; return [lineS(n, d, h, k), lineS(-n, d, h, k)]; };
  S('V.12.08', 'Hyperbola graphs', {
    a: { t: 'standard form', g: R => {
      const h = R.int(-6, 6), k = R.int(-6, 6), vert = R.bool(), kind = R.int(0, 1);
      if (kind === 0) { const a = R.int(1, 8), b = R.int(1, 8), eq = hypEq(vert, h, k, a * a, b * b), V1 = vert ? [[h, k + a], [h, k - a]] : [[h + a, k], [h - a, k]];
        return E.num(`A hyperbola has vertices ${pS(...V1[0])} and ${pS(...V1[1])}, and b = ${b}. Write its equation.`, [{ eqn: eq }], `The center is the midpoint ${pS(h, k)} and a = ${a}. The vertices are ${vert ? 'one above the other, so y comes first' : 'side by side, so x comes first'}: ${P(eq)}.`); }
      const [a, b, c] = R.pick(HYP3.filter(t => t[2] <= 15)), eq = hypEq(vert, h, k, a * a, b * b);
      return E.num(`A hyperbola has center ${pS(h, k)}, a vertex at ${vert ? pS(h, k + a) : pS(h + a, k)} and a focus at ${vert ? pS(h, k + c) : pS(h + c, k)}. Write its equation.`, [{ eqn: eq }], `a = ${a}, c = ${c}, so b² = c² − a² = ${c * c} − ${a * a} = ${b * b}: ${P(eq)}.`); } },
    b: { t: 'the central box', g: R => {
      const h = R.int(-5, 5), k = R.int(-5, 5), a = R.int(1, 8), b = R.int(1, 8), vert = R.bool(), eq = hypEq(vert, h, k, a * a, b * b), kind = R.pick([0, 1, 2, 3, 3]), bx = vert ? b : a, by = vert ? a : b;
      if (kind === 3) { // proof: the box corners are as far from the center as the foci
        const [a0, b0, c0] = R.pick(HYP3.filter(t => t[2] <= 17)), e0 = hypEq(vert, 0, 0, a0 * a0, b0 * b0), cx = vert ? b0 : a0, cy = vert ? a0 : b0, sx = R.pick([1, -1]), sy = R.pick([1, -1]);
        const L = [`${M(e0)} has a = ${a0} and b = ${b0}, and its foci are c from the center O, where c² = a² + b² (given).`, `One corner of the central box is ${pS(sx * cx, sy * cy)}.`, `That corner is √(${cx}² + ${cy}²) = ${c0} from O.`, `Each focus is c = √(${a0 * a0} + ${b0 * b0}) = ${c0} from O.`, `So every corner of the box is as far from O as the foci: the corners lie on the circle through the foci.`];
        return K.orderQ(R, `Put the steps in order to show that the corners of the central box of ${M(e0)} are as far from the center as the foci.`, L, [[], [], [1], [], []],
          `The box reaches ${cx} across and ${cy} up, so a corner is √(${cx * cx} + ${cy * cy}) = ${c0} from O; the foci are c = √(a² + b²) = ${c0} from O. The corner lines and the focus line can come in either order.`, { fixed: 1 }); }
      if (kind === 0) return E.num(`The central box of ${M(eq)} is centered on its center, reaching to the vertices one way and b the other way. How wide and how tall is it?`, [{ label: 'width =', ans: 2 * bx }, { label: 'height =', ans: 2 * by }], `a = ${a} runs ${vert ? 'up and down' : 'left and right'} (the positive term) and b = ${b} runs the other way. So the box is ${2 * bx} wide and ${2 * by} tall.`);
      if (kind === 1) { const sx = R.pick([1, -1]), sy = R.pick([1, -1]), lab = `${sy > 0 ? 'upper' : 'lower'}-${sx > 0 ? 'right' : 'left'}`;
        return E.num(`Find the ${lab} corner of the central box of ${M(eq)}.`, [{ label: 'corner', point: ptA(h + sx * bx, k + sy * by) }], `Center ${pS(h, k)}. The box reaches ${bx} left and right and ${by} up and down, so the corner is ${pS(h + sx * bx, k + sy * by)}. The asymptotes run through the corners.`); }
      const c2 = a * a + b * b;
      return E.num(`How long is a diagonal of the central box of ${M(eq)}?${isSq(c2) ? '' : ' Give an exact answer.'}`, [Object.assign({ label: 'diagonal =' }, ex(4 * c2))], `The box is ${2 * bx} by ${2 * by}, so its diagonal is √(${2 * bx}² + ${2 * by}²) = 2√(a² + b²) = 2c = ${P(isSq(4 * c2) ? String(2 * Math.sqrt(c2)) : sqS(4 * c2))}: the same as the distance between the foci.`); } },
    c: { t: 'asymptotes', g: R => {
      const h = R.int(-5, 5), k = R.int(-5, 5), vert = R.bool(); let a, b; do { a = R.int(1, 6); b = R.int(1, 6); } while (false);
      const eq = hypEq(vert, h, k, a * a, b * b), [up, dn] = asym(vert, h, k, a, b), m = vert ? E.fracStr(a, b) : E.fracStr(b, a);
      if (a !== b && R.bool(0.3)) { const [n, d] = vert ? [a, b] : [b, a], opts = [];
        [n + '/' + d, d + '/' + n, n * n + '/' + d * d, 2 * n + '/' + d, n + '/' + 2 * d, String(a * b)].map(f => `±${E.fracStr(...f.split('/').map(Number).concat(f.includes('/') ? [] : [1]))}`).forEach(o => { if (!opts.includes(o)) opts.push(o); });
        return E.choice(R, `What are the slopes of the asymptotes of ${M(eq)}?`, P(opts[0]), opts.slice(1, 4).map(P), `${vert ? 'y' : 'x'} comes first, so the slopes are ${vert ? `±(a/b) = ±${rr(a, b)}` : `±(b/a) = ±${rr(b, a)}`}${gcd(a, b) > 1 && (vert ? b : a) !== 1 ? ' = ±' + m : ''}: rise over run across the central box.`); }
      return E.num(`Find the asymptotes of ${M(eq)}.`, [{ label: 'positive slope', eqn: up }, { label: 'negative slope', eqn: dn }],
        `Through the center ${pS(h, k)} with slopes ±${vert ? `a/b = ±${rr(a, b)}` : `b/a = ±${rr(b, a)}`} (${vert ? 'y' : 'x'} comes first): ${P(up)} and ${P(dn)}.`); } },
    d: { t: 'graph and write', g: R => {
      const h = R.int(-3, 3), k = R.int(-3, 3), vert = R.bool(), a = R.int(1, 4), b = R.int(1, 4), eq = hypEq(vert, h, k, a * a, b * b);
      if (R.bool()) { const vx = vert ? [h, k + a] : [h + a, k], bx = vert ? b : a, by = vert ? a : b, cn = vert ? [h + bx, k - by] : [h - bx, k + by];   // a box corner away from the labelled vertex
        return E.num('Write the equation of the hyperbola shown. The dashed box has its corners on the asymptotes.', [{ eqn: eq }],
          `Center ${pS(h, k)}; the vertices are ${a} ${vert ? 'above and below' : 'left and right'}, so a = ${a}, and the box gives b = ${b}. Branches open ${vert ? 'up and down, so y comes first' : 'left and right, so x comes first'}: ${P(eq)}.`,
          { visual: hypPic(vert, h, k, a, b, { box: true, points: [[h, k, ''], [vx[0], vx[1], pS(...vx)], cn.concat(pS(...cn))] }) }); }
      const others = [hypEq(!vert, h, k, a * a, b * b), a !== b ? hypEq(vert, h, k, b * b, a * a) : hypEq(vert, h, k, a * a, (b + 1) * (b + 1)), vert ? `${ov(sq('y', k), a * a)}+${ov(sq('x', h), b * b)}=1` : `${ov(sq('x', h), a * a)}+${ov(sq('y', k), b * b)}=1`];
      return E.choice(R, 'Which equation matches the graph? (Dashed lines are asymptotes.)', M(eq), others.map(M),
        `Center ${pS(h, k)}, branches open ${vert ? 'up and down (y first)' : 'left and right (x first)'}, vertices ${a} from the center, asymptote slopes ±${vert ? rr(a, b) : rr(b, a)}: ${P(eq)}.`,
        { visual: hypPic(vert, h, k, a, b, { points: [[h, k, ''], vert ? [h, k + a, pS(h, k + a)] : [h + a, k, pS(h + a, k)]] }) }); } },
  });

  /* ================= V.12.09 Classify conics ================= */
  // expanded general form of a conic in standard position. type: 'circle' | 'ellipse' | 'hyperbola' | 'parabola'
  const conicCo = (type, o) => { const { h, k, a, b, vert, p, N } = o;
    if (type === 'parabola') return vert ? [1, 0, 0, -2 * h, -4 * p, h * h + 4 * p * k] : [0, 0, 1, -4 * p, -2 * k, k * k + 4 * p * h];
    let A = b * b, Cc = a * a; if (type === 'circle') { A = 1; Cc = 1; } if (type === 'hyperbola') { if (vert) A = -A; else Cc = -Cc; }
    const rhs = N !== undefined ? N : (type === 'circle' ? a * a : type === 'hyperbola' ? (vert ? a * a * b * b : a * a * b * b) : a * a * b * b);
    return [A, 0, Cc, -2 * A * h, -2 * Cc * k, A * h * h + Cc * k * k - rhs]; };
  const red = (co, flip) => { const g = co.reduce((g, c) => gcd(g, c), 0) || 1; return co.map(c => c / g * (flip ? -1 : 1)); };
  const stdText = (type, o) => { const { h, k, a, b, vert, p } = o;
    if (type === 'parabola') return parEq(vert, h, k, p);
    if (type === 'circle') return `${sq('x', h)}+${sq('y', k)}=${a * a}`;
    if (type === 'ellipse') return ellEq(h, k, a * a, b * b);
    return vert ? hypEq(true, h, k, b * b, a * a).replace(/^/, '') : hypEq(false, h, k, a * a, b * b); };
  const randConic = (R, type) => { let a, b; do { a = R.int(1, 5); b = R.int(1, 5); } while (type === 'ellipse' && a === b);
    return { h: R.int(-5, 5), k: R.int(-5, 5), a, b, vert: R.bool(), p: R.pick([1, 2, 3, -1, -2, -3, 1 / 2, -1 / 2]) }; };
  S('V.12.09', 'Classify conics', {
    a: { t: 'complete the square', g: R => {
      const type = R.pick(['ellipse', 'hyperbola', 'parabola', 'circle']), o = randConic(R, type); if (type === 'parabola') o.p = R.pick([1, 2, 3, -1, -2, -3]);
      if (type === 'hyperbola') { o.vert = false; }
      const co = red(conicCo(type, o), R.bool(0.2)), eq = gen(co), std = stdText(type, o), what = type === 'parabola' ? 'vertex' : 'center';
      return E.num(`Complete the square to find the ${what} of the ${type} ${M(eq)}.`, [{ label: what, point: ptA(o.h, o.k) }], `Group the x terms and the y terms and complete each square: ${P(std)}. The ${what} is ${pS(o.h, o.k)}.`); } },
    b: { t: 'signs of x² and y² terms', g: R => {
      const i = R.int(0, 3), type = SHAPES[i], o = randConic(R, type), co = red(conicCo(type, o), R.bool(0.3)), eq = gen(co);
      const sg = type === 'circle' ? `x² and y² have the same coefficient (${co[0]})` : type === 'ellipse' ? `x² and y² have the same sign but different coefficients (${co[0]} and ${co[2]})` : type === 'hyperbola' ? `x² and y² have opposite signs (${co[0]} and ${co[2]})` : `only one of x² and y² appears`;
      return E.choiceFixed(`Which conic is ${M(eq)}? (It is not degenerate.)`, SHAPES, i, `Here ${sg}, so it is a${type === 'ellipse' ? 'n' : ''} ${type}.`); } },
    c: { t: 'discriminant B² − 4AC', g: R => {
      const kind = R.int(0, 1), want = R.int(0, 2); let A, B, Cc, D, Ee, F, ok;
      do { ok = true; D = R.int(-6, 6); Ee = R.int(-6, 6); F = R.int(-9, 9);
        if (want === 1) { const s = R.pick([1, -1]), m = R.int(1, 3), n = R.int(1, 3); A = s * m * m; Cc = s * n * n; B = R.pick([1, -1]) * 2 * s * m * n; if (D * n * Math.sign(B) * s === Ee * m || (D === 0 && Ee === 0)) ok = false; }
        else { A = nz(R, -5, 5); Cc = nz(R, -5, 5); B = nz(R, -6, 6); const disc = B * B - 4 * A * Cc; if (want === 0 ? disc >= 0 : disc <= 0) ok = false;
          if (ok) { const det = 4 * A * Cc - B * B, x0 = (B * Ee - 2 * Cc * D) / det, y0 = (B * D - 2 * A * Ee) / det, Fp = F + (D * x0 + Ee * y0) / 2; if (Math.abs(Fp) < 1e-9 || (want === 0 && Fp * A >= 0)) ok = false; } } } while (!ok);
      const co = [A, B, Cc, D, Ee, F], eq = gen(co), disc = B * B - 4 * A * Cc, name = ['ellipse', 'parabola', 'hyperbola'][want];
      const work = `B² − 4AC = ${B < 0 ? `(${B})` : B}² − 4(${A})(${Cc}) = ${disc}`;
      if (kind === 0) return E.num(`For ${M(eq)}, find the discriminant ${M('B^2-4AC')}.`, [{ label: 'B² − 4AC =', ans: disc }], `A = ${A}, B = ${B}, C = ${Cc}: ${work}, so it is ${name === 'ellipse' ? 'an' : 'a'} ${name}.`);
      return E.choiceFixed(`Use ${M('B^2-4AC')} to classify ${M(eq)}. (It is a non-degenerate conic.)`, ['ellipse', 'parabola', 'hyperbola'], want, `${work}, which is ${disc < 0 ? 'negative: ellipse' : disc === 0 ? 'zero: parabola' : 'positive: hyperbola'}.`); } },
    d: { t: 'name and graph', g: R => {
      if (R.bool()) { const NAMES = ['circle', 'ellipse', 'hyperbola', 'a single point', 'two crossing lines', 'no points at all'], j = R.int(0, 5);
        const base = ['circle', 'ellipse', 'hyperbola', 'circle', 'hyperbola', R.pick(['circle', 'ellipse'])][j], o = randConic(R, base);
        const full = base === 'circle' ? o.a * o.a : o.a * o.a * o.b * o.b, N = j < 3 ? full : j === 5 ? -R.int(1, 9) * (base === 'circle' ? 1 : o.b * o.b) : 0;
        const co = red(conicCo(base, Object.assign({}, o, { vert: false, N })), false), eq = gen(co), A = base === 'circle' ? 1 : o.b * o.b, Cc = base === 'circle' ? 1 : (base === 'hyperbola' ? -o.a * o.a : o.a * o.a);
        const lhs = `${A === 1 ? '' : A}${sq('x', o.h)}${Cc < 0 ? '-' : '+'}${Math.abs(Cc) === 1 ? '' : Math.abs(Cc)}${sq('y', o.k)}`;
        const right = NAMES[j], wrong = R.sample(NAMES.filter(s => s !== right), 3);
        const tail = j < 3 ? `a ${right}` : j === 3 ? `only (${o.h}, ${o.k}) works (both squares must be 0): a single point` : j === 4 ? `the difference of squares factors into two lines through ${pS(o.h, o.k)}` : 'a sum of squares can\'t be negative: no points at all';
        return E.choice(R, `What is the graph of ${M(eq)}?`, right, wrong, `Complete the squares: ${P(`${lhs}=${N}`)}. ${j < 3 ? 'So it is ' + tail.replace('a ellipse', 'an ellipse') + '.' : tail[0].toUpperCase() + tail.slice(1) + '.'}`); }
      const type = R.pick(SHAPES), o = randConic(R, type); o.h = R.int(-3, 3); o.k = R.int(-3, 3); o.a = R.int(1, 4); o.b = R.int(1, 4); if (o.a === o.b) o.b = o.a === 4 ? 2 : o.a + 1; if (type === 'parabola') o.p = R.pick([1 / 2, 1, -1 / 2, -1]);
      const fix = [-9, 9, -9, 9], w = 210;
      const pic = t => t === 'parabola' ? parPic(o.vert, o.h, o.k, o.p, { fix, w }) : t === 'circle' ? ellPic(o.h, o.k, o.a, o.a, { fix, w }) : t === 'ellipse' ? ellPic(o.h, o.k, o.a, o.b, { fix, w }) : hypPic(o.vert, o.h, o.k, o.vert ? o.b : o.a, o.vert ? o.a : o.b, { fix, w, noAsy: true });
      const co = red(conicCo(type, o), false), eq = gen(co);
      return E.choice(R, `Name the conic ${M(eq)}, then pick its graph.`, pic(type), SHAPES.filter(t => t !== type).map(pic),
        `Completing the square gives ${P(stdText(type, o))}: a${type === 'ellipse' ? 'n' : ''} ${type} ${type === 'parabola' ? 'with vertex' : 'centered at'} ${pS(o.h, o.k)}.`); } },
  });

  /* ================= V.12.10 Conics in the world ================= */
  const dishes = []; for (let r = 2; r <= 60; r++) for (let p = 1; p <= 60; p++) { const d = r * r / (4 * p); if (Math.abs(d * 100 - Math.round(d * 100)) < 1e-9 && d >= 0.5 && d < r) dishes.push([r, p, d]); }
  S('V.12.10', 'Conics in the world', {
    a: { t: 'satellite dishes', g: (R, O) => {
      const u = unitS(O), [r, p, d] = R.pick(dishes), kind = R.int(0, 1);
      if (kind === 0) return E.num(`A satellite dish is a parabola in cross-section, ${2 * r} ${u} across and ${d} ${u} deep. How far from the vertex should the receiver go?`, [{ label: 'distance =', ans: p }],
        `Put the vertex at the origin: x² = 4py passes through (${r}, ${d}), so ${r * r} = 4p · ${d} and p = ${p}. The receiver goes at the focus, ${p} ${u} from the vertex, not at the rim's depth.`);
      return E.num(`A dish ${2 * r} ${u} across has its receiver at the focus, ${p} ${u} from the vertex. How deep is the dish?`, [{ label: 'depth =', ans: d }], `x² = 4(${p})y = ${4 * p}y. At the rim x = ${r}: y = ${r * r}/${4 * p} = ${d} ${u}.`); } },
    b: { t: 'headlights', g: (R, O) => {
      const u = unitS(O), kind = R.int(0, 2);
      if (kind === 0) { const p = R.int(1, 9); return E.num(`A headlight reflector is a parabola in cross-section, with the bulb ${p} ${u} from the vertex so the light leaves in a parallel beam. Put the vertex at the origin, opening up. Write the cross-section's equation.`, [{ eqn: `x^2=${4 * p}y` }], `Parallel beams need the bulb at the focus, so p = ${p}: x² = 4py = ${4 * p}y.`); }
      const [r, p, d] = R.pick(dishes.filter(q => q[0] <= 20 && 2 * q[1] <= q[0]));   // a deep bowl: the bulb sits inside it
      if (kind === 1) return E.num(`A headlight reflector is ${2 * r} ${u} wide and ${d} ${u} deep. Where should the bulb go? Give its distance from the vertex.`, [{ label: 'distance =', ans: p }], `The bulb goes at the focus. x² = 4py through (${r}, ${d}): ${r * r} = 4p · ${d}, so p = ${p} ${u}.`);
      return E.choice(R, `Why is a headlight bulb placed at the focus of its parabolic reflector, ${p} ${u} from the vertex?`, 'Light from the focus reflects off a parabola into parallel rays', ['Light from the focus reflects back to the focus', `The bulb should sit level with the rim, ${d} ${u} from the vertex`, 'Light from the focus spreads out evenly in all directions'],
        'A parabola reflects every ray from its focus parallel to its axis, which makes a straight beam. (Ellipses send light from one focus to the other.)'); } },
    c: { t: 'orbits', g: R => {
      const kind = R.int(0, 2);
      if (kind === 0) { const a = R.int(5, 40) * 10, e = R.pick([0.1, 0.2, 0.3, 0.4, 0.5, 0.05, 0.25]);
        return E.num(`A planet's orbit has semi-major axis ${a} million km and eccentricity ${e}, with its star at a focus. How far is the star from the center of the orbit?`, [{ label: 'distance =', ans: +(a * e).toFixed(3) }], `e = c/a, so c = ea = ${e} × ${a} = ${+(a * e).toFixed(3)} million km.`); }
      if (kind === 1) { const q = R.int(1, 20) * 5, Q = q + R.int(1, 20) * 5;
        return E.num(`A comet comes within ${q} million km of the Sun and travels as far as ${Q} million km away. Find the semi-major axis of its orbit.`, [{ label: 'a =', ans: (q + Q) / 2 }], `The closest and farthest points are the ends of the major axis, so 2a = ${q} + ${Q} = ${q + Q} and a = ${(q + Q) / 2} million km.`); }
      const [a, b, c] = R.pick(ELL3), s = R.pick([1, 2, 4]);
      return E.num(`An orbit is an ellipse with major axis ${2 * a * s} and minor axis ${2 * b * s} (in millions of km), with the star at a focus. What is the orbit's closest distance to the star?`, [{ label: 'closest =', ans: (a - c) * s }], `a = ${a * s}, b = ${b * s}, so c = √(${a * s}² − ${b * s}²) = ${c * s}. Closest = a − c = ${(a - c) * s} million km.`); } },
    d: { t: 'LORAN navigation', g: R => {
      let c, a; do { c = R.int(2, 10) * 30; a = R.int(1, 2 * c / 30 - 1) * 15; } while (a >= c);
      const dt = +(2 * a / 300).toFixed(3), kind = R.int(0, 2), b2 = c * c - a * a;
      const intro = `Stations A and B are ${2 * c} km apart. Radio signals travel 300 km per millisecond. A ship receives B's signal ${dt} ms before A's (both sent at once).`;
      if (kind === 0) return E.num(`${intro} How much farther is the ship from A than from B?`, [{ label: 'difference =', ans: 2 * a }], `Distance difference = speed × time difference = 300 × ${dt} = ${2 * a} km. The ship is on a hyperbola with foci A and B.`);
      if (kind === 1) return E.num(`${intro} Put A at (−${c}, 0) and B at (${c}, 0). Write the equation of the hyperbola the ship is on (both branches).`, [{ eqn: `x^2/${a * a}-y^2/${b2}=1` }],
        `2a = 300 × ${dt} = ${2 * a}, so a = ${a}. c = ${c}, so b² = ${c * c} − ${a * a} = ${b2}: ${P(`x^2/${a * a}-y^2/${b2}=1`)}. (The ship is on the branch nearer B.)`);
      return E.num(`${intro} The ship is on the straight line between the stations. How far is it from B?`, [{ label: 'distance =', ans: c - a }], `Between the stations, d(A) + d(B) = ${2 * c} and d(A) − d(B) = 300 × ${dt} = ${2 * a}. So d(B) = (${2 * c} − ${2 * a})/2 = ${c - a} km: a vertex of the hyperbola.`); } },
  });

  /* ================= V.12.11 Systems with conics ================= */
  const term = (c, v, first) => c === 0 ? '' : (c < 0 ? '-' : first ? '' : '+') + (Math.abs(c) === 1 && v ? '' : Math.abs(c)) + v;
  const quadEq = (m, n, rhs) => `${term(m, 'x^2', true)}${term(n, 'y^2', !m)}=${rhs}`;
  const QN = ['first', 'second', 'third', 'fourth'], QS = [[1, 1], [-1, 1], [-1, -1], [1, -1]];
  S('V.12.11', 'Systems with conics', {
    a: { t: 'line and conic', g: R => {
      if (R.bool()) { let r1, r2; do { r1 = R.int(-6, 6); r2 = R.int(-6, 6); } while (r1 === r2); const m = R.int(-4, 4), q = R.int(-8, 8), b = m - (r1 + r2), c = q + r1 * r2;
        const par = `y=${E.poly([1, b, c])}`, ln = `y=${E.poly([m, q])}`, pts = R.bool(0.4), lo = Math.min(r1, r2), hi = Math.max(r1, r2);
        const ex2 = `Set them equal: ${P(`${E.poly([1, b - m, c - q])}=0`)}, which factors as ${P(`${E.lin(lo)}${E.lin(hi)}=0`)}: x = ${lo} or x = ${hi}.`;
        if (pts) return E.num(`Find the points where the line ${M(ln)} meets the parabola ${M(par)}.`, [{ label: 'left point', point: ptA(lo, m * lo + q) }, { label: 'right point', point: ptA(hi, m * hi + q) }], `${ex2} The line gives y = ${m * lo + q} and y = ${m * hi + q}.`);
        return E.num(`Find the x-coordinates where the line ${M(ln)} meets the parabola ${M(par)}.`, [{ label: 'x =', set: [String(r1), String(r2)] }], ex2); }
      const r = R.pick([5, 10, 13]), [P1, P2] = R.sample(LAT(r), 2);
      const A = P2[1] - P1[1], B = P1[0] - P2[0], ln = lineEq(A, B, A * P1[0] + B * P1[1]), byX = P1[0] !== P2[0], [L1, L2] = byX ? (P1[0] < P2[0] ? [P1, P2] : [P2, P1]) : (P1[1] < P2[1] ? [P1, P2] : [P2, P1]);
      return E.num(`Find the points where the line ${M(ln)} meets the circle ${M(`x^2+y^2=${r * r}`)}.`, [{ label: byX ? 'left point' : 'lower point', point: ptA(...L1) }, { label: byX ? 'right point' : 'upper point', point: ptA(...L2) }],
        `${byX ? 'Solve the line for y' : 'The line fixes x'} and substitute into the circle. ${byX ? `The quadratic in x has roots ${L1[0]} and ${L2[0]}` : `Then y² = ${L1[1] * L1[1]}, so y = ±${Math.abs(L1[1])}`}, giving ${pS(...L1)} and ${pS(...L2)}. Both check in ${P(`x^2+y^2=${r * r}`)} and in ${P(ln)}.`); } },
    b: { t: 'two conics', g: R => { const kind = R.int(0, 2);
      if (kind === 0) { const PAIRS = [[[1, 1], [1, -1]], [[1, 4], [1, 1]], [[4, 1], [1, 1]], [[1, 1], [2, -1]], [[9, 1], [1, 1]], [[1, 2], [1, -1]], [[1, 1], [1, -4]], [[2, 1], [1, -1]]];
        let m1, n1, m2, n2, u, v; do { [[m1, n1], [m2, n2]] = R.pick(PAIRS); u = R.int(1, 5); v = R.int(1, 5); } while (m1 * u * u + n1 * v * v === 0 || m2 * u * u + n2 * v * v === 0); const q = R.int(0, 3), [sx, sy] = QS[q];
        const e1 = quadEq(m1, n1, m1 * u * u + n1 * v * v), e2 = quadEq(m2, n2, m2 * u * u + n2 * v * v);
        return E.num(`Find the intersection point of ${M(e1)} and ${M(e2)} in the ${QN[q]} quadrant.`, [{ label: 'point', point: ptA(sx * u, sy * v) }],
          `Treat x² and y² as the unknowns and eliminate one: x² = ${u * u} and y² = ${v * v}. So x = ±${u}, y = ±${v}, and the ${QN[q]}-quadrant point is ${pS(sx * u, sy * v)}.`); }
      const u = R.int(1, 6), w = u + R.int(1, 8), N = w - u, R2 = u * w, nN = N === 1 ? '' : N, yv = N * u, ys = isSq(yv) ? String(Math.sqrt(yv)) : P(sqS(yv));
      if (kind === 1) return E.num(`Find the x-coordinates of all intersection points of ${M(`x^2+y^2=${R2}`)} and ${M(`y^2=${nN}x`)}.`, [{ label: 'x =', set: [String(u)] }],
        `Substitute y² = ${nN}x: ${P(`${E.poly([1, N, -R2])}=0`)}, so (x − ${u})(x + ${w}) = 0. But x = −${w} would make y² = ${-N * w}, which is impossible, so only x = ${u} (two points, y = ±${ys}).`);
      // find the broken step in a worked solution
      const L = [`Substitute ${M(`y^2=${nN}x`)} into the circle: ${M(`x^2+${nN}x=${R2}`)}.`, `So ${M(`${E.poly([1, N, -R2])}=0`)}, which factors as (x − ${u})(x + ${w}) = 0.`, `x = ${u} gives y² = ${yv}, so y = ±${ys}.`,
        `x = −${w} gives y² = −${N * w}, which no real y satisfies, so it is rejected.`, 'So the curves meet at exactly 2 points.'];
      const BAD = { 0: [`Substitute ${M(`y^2=${nN}x`)} into the circle: ${M(`x^2-${nN}x=${R2}`)}.`, `replacing y² by ${nN}x gives x² + ${nN}x = ${R2}; the sign does not change`],
        1: [`So ${M(`${E.poly([1, N, -R2])}=0`)}, which factors as (x + ${u})(x − ${w}) = 0.`, `(x + ${u})(x − ${w}) expands to ${P(E.poly([1, -N, -R2]))}, with the wrong middle sign. The factors are (x − ${u})(x + ${w})`],
        2: [`x = ${u} gives y² = ${yv}, so y = ±${yv}.`, `y² = ${yv} means y = ±${ys}, not ±${yv}`], 4: ['So the curves meet at exactly 1 point.', `x = ${u} gives two values of y, ±${ys}, so there are 2 points`] };
      const j = R.pick(yv > 1 ? [0, 1, 2, 4] : [0, 1, 4]); L[j] = BAD[j][0];
      return E.choiceFixed(`Someone finds where ${M(`x^2+y^2=${R2}`)} and ${M(`y^2=${nN}x`)} meet. Exactly one step is wrong. Which step is it?${numbered(L)}`, STEPS(5), j, `Step ${j + 1} is wrong: ${BAD[j][1]}.`); } },
    c: { t: 'substitution or elimination', g: R => {
      const kind = R.int(0, 2);
      if (kind === 0) { let r1, r2; do { r1 = nz(R, -7, 7); r2 = nz(R, -7, 7); } while (r1 === r2 || r1 + r2 === 0); const s = r1 + r2, k = r1 * r2;
        return E.num(`Solve the system ${M(`xy=${k}`)} and ${M(`x+y=${s}`)}. Give the x-values.`, [{ label: 'x =', set: [String(r1), String(r2)] }], `Substitute y = ${s} − x: x(${s} − x) = ${k}, so ${P(`${E.poly([1, -s, k])}=0`)} and x = ${r1} or x = ${r2}.`.replace(/\(− /, '(−').replace(/ − -/g, ' + ')); }
      if (kind === 1) { let t, k, R2, ys; do { t = R.int(-5, 5); k = R.int(-6, 6); R2 = t * (t + 1) - k; ys = [t, -1 - t].filter(y => y >= k); } while (R2 <= 0 || !ys.length || t === -1 - t);
        const par = `y=${E.poly([1, 0, k])}`, rej = [t, -1 - t].filter(y => y < k);
        return E.num(`Find the y-coordinates of all intersection points of ${M(par)} and ${M(`x^2+y^2=${R2}`)}.`, [{ label: 'y =', set: ys.map(String) }],
          `Substitute x² = ${k ? `y ${k < 0 ? '+' : '−'} ${Math.abs(k)}` : 'y'}: ${P(`${E.poly([1, 1, -(k + R2)], 'y')}=0`)}, so y = ${t} or y = ${-1 - t}. ${rej.length ? `But y = ${rej[0]} gives x² = ${rej[0] - k} < 0, so it is rejected. ` : ''}Keep y = ${ys.join(' and y = ')}.`); }
      const r = R.pick([5, 10, 13]); let x0, y0, a; do { [x0, y0] = R.pick(LAT(r)); a = nz(R, -6, 6); } while (y0 === 0 || x0 === a);
      const R2 = (x0 - a) ** 2 + y0 * y0, ay = Math.abs(y0);
      return E.num(`Find the intersection points of ${M(`x^2+y^2=${r * r}`)} and ${M(`${sq('x', a)}+y^2=${R2}`)}.`, [{ label: 'lower point', point: ptA(x0, -ay) }, { label: 'upper point', point: ptA(x0, ay) }],
        `Subtract the equations to eliminate y²: ${2 * a}x − ${a * a} = ${r * r - R2}, so x = ${x0}. Then y² = ${r * r} − ${x0 * x0} = ${ay * ay} and y = ±${ay}.`.replace(/ − -/g, ' + ')); } },
    d: { t: 'count intersections', g: R => {
      const kind = R.int(0, 2), n = R.int(0, 2);
      if (kind === 0) { const h = R.int(-5, 5), k = R.int(-5, 5), r = R.int(2, 6), dist = n === 2 ? R.int(0, r - 1) : n === 1 ? r : r + R.int(1, 3), s = R.pick([1, -1]), t = R.int(0, 2);
        const circ = `${sq('x', h)}+${sq('y', k)}=${r * r}`, ln = t === 0 ? `y=${k + s * dist}` : t === 1 ? `x=${h + s * dist}` : lineEq(3, 4, 3 * h + 4 * k + s * 5 * dist), cnt = n;
        return E.num(`How many points do ${M(circ)} and ${M(ln)} have in common?`, [{ label: 'points =', ans: cnt }],
          `The center ${pS(h, k)} is ${dist} from the line${t === 2 ? ` (|3(${nt(h)}) + 4(${nt(k)}) − (${nt(3 * h + 4 * k + s * 5 * dist)})|/5 = ${dist})` : ''}, and r = ${r}. ${dist < r ? 'Closer than r: it cuts the circle twice.' : dist === r ? 'Exactly r: tangent, one point.' : 'Farther than r: no points.'}`); }
      if (kind === 1) { const a = R.int(4, 8), b = R.int(2, a - 2), cs = R.int(0, 4), r = [R.int(1, b - 1), b, R.int(b + 1, a - 1), a, a + R.int(1, 3)][cs], cnt = [0, 2, 4, 2, 0][cs], vert = R.bool();
        const ell = vert ? ellEq(0, 0, b * b, a * a) : ellEq(0, 0, a * a, b * b);
        return E.num(`How many points do the ellipse ${M(ell)} and the circle ${M(`x^2+y^2=${r * r}`)} have in common?`, [{ label: 'points =', ans: cnt }],
          `Both are centered at the origin. Points of the ellipse are between ${b} and ${a} from the center; the circle has radius ${r}. ${[`${r} < ${b}: the circle is inside, no points.`, 'It touches the ends of the minor axis: 2 points.', `${b} < ${r} < ${a}: it crosses the ellipse once in each quadrant, 4 points.`, 'It touches the ends of the major axis: 2 points.', `${r} > ${a}: the circle is outside, no points.`][cs]}`); }
      // y = x² + bx + k against y = mx + q: x² + s·x + t = 0 with s = b − m, t = k − q
      const cnt = 2 - n; let s0; do s0 = R.int(-6, 6); while (cnt === 1 && (s0 % 2 || s0 === 0));
      const t = cnt === 1 ? s0 * s0 / 4 : cnt === 2 ? Math.floor(s0 * s0 / 4) - R.int(s0 % 2 ? 0 : 1, 8) : Math.floor(s0 * s0 / 4) + R.int(1, 8);
      const m = R.int(-4, 4), b = m + s0, k = R.int(-6, 6), q = k - t, D = s0 * s0 - 4 * t;
      return E.num(`How many points do ${M(`y=${E.poly([1, b, k])}`)} and ${M(`y=${E.poly([m, q])}`)} have in common?`, [{ label: 'points =', ans: cnt }],
        `Set them equal: ${P(`${E.poly([1, s0, t])}=0`)}. Its discriminant is ${s0 * s0} − 4(${t}) = ${D}: ${D > 0 ? 'positive, 2 points' : D === 0 ? 'zero, 1 point (tangent)' : 'negative, no points'}.`.replace(/4\(-(\d+)\)/, '4(−$1)')); } },
    e: { t: 'find k for tangency', g: R => {
      const kind = R.int(0, 2);
      if (kind === 0) { const m = R.int(-4, 4), b = R.int(-5, 5), c = R.int(-6, 6), num = 4 * c - (b - m) ** 2, g = gcd(num, 4);
        return E.num(`For what value of k is the line ${M(`y=${E.poly([m, 0]).replace(/^0$/, '')}${m ? '+' : ''}k`)} tangent to ${M(`y=${E.poly([1, b, c])}`)}?`, [{ label: 'k =', frac: [num / g, 4 / g], form: 'any' }],
          `Set them equal: x² ${b - m >= 0 ? '+' : '−'} ${Math.abs(b - m) === 1 ? '' : Math.abs(b - m)}x + (${c} − k) = 0. Tangent means one root, so the discriminant is 0: ${(b - m) ** 2} − 4(${c} − k) = 0, giving k = ${E.fracStr(num, 4)}.`.replace(/ \+ 0x/, '')); }
      const m = nz(R, -3, 3);
      if (kind === 1) { const r = R.int(1, 6), s = E.surdStr(0, r, 1 + m * m);
        return E.num(`Find every value of k for which ${M(`y=${E.poly([m, 0])}+k`)} is tangent to ${M(`x^2+y^2=${r * r}`)}. Give exact answers.`, [{ label: 'k =', set: [s, '-' + s] }],
          `Tangent means the distance from the center to the line equals the radius: |k|/√(1 + ${m * m}) = ${r}, so k² = ${r * r} × ${1 + m * m} = ${r * r * (1 + m * m)} and k = ±${P(s)}.`); }
      let a, b; do { a = R.int(1, 5); b = R.int(1, 5); } while (a === b); const k2 = a * a * m * m + b * b, s = sqS(k2);
      return E.num(`Find every value of k for which ${M(`y=${E.poly([m, 0])}+k`)} is tangent to ${M(ellEq(0, 0, a * a, b * b))}.${isSq(k2) ? '' : ' Give exact answers.'}`, [{ label: 'k =', set: [s, '-' + s] }],
        `Substitute and clear fractions: ${b * b + a * a * m * m}x² + ${2 * a * a * m}kx + ${a * a}(k² − ${b * b}) = 0. A double root needs discriminant 0, which simplifies to k² = a²m² + b² = ${a * a * m * m} + ${b * b} = ${k2}: k = ±${P(s)}.`.replace(/\+ -/g, '− ')); } },
    f: { t: 'a parameter decides the count', g: R => {
      if (R.bool()) { const C0 = R.pick([[1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [1, 2], [1, 3], [1, 4], [2, 3], [3, 2], [6, 1]]), cv = C0[0] / C0[1], lim = E.fracStr(C0[1], 2 * C0[0]), three = R.bool();
        const cs = C0[1] === 1 ? `${C0[0] === 1 ? '' : C0[0]}x^2` : `${C0[0] === 1 ? '' : C0[0]}x^2/${C0[1]}`;
        return E.num(`For which positive values of a do ${M(`x^2+y^2=a^2`)} and ${M(`y=${cs}-a`)} meet in exactly ${three ? 'three points' : 'one point'}?`, [{ label: 'a:', interval: three ? `(${lim},inf)` : `(0,${lim}]` }],
          `Substitute x² = ${C0[1] === 1 ? (C0[0] === 1 ? 'y + a' : '(y + a)') : C0[1] + '(y + a)'}${C0[0] === 1 ? '' : '/' + C0[0]} into the circle${C0[0] === 1 ? '' : ` and multiply by ${C0[0]}`}: ${C0[0] === 1 ? '' : C0[0]}y² + ${C0[1] === 1 ? '' : C0[1]}y + ${C0[1] === 1 ? '' : C0[1]}a − ${C0[0] === 1 ? '' : C0[0]}a² = 0, which factors as (y + a)(${C0[0] === 1 ? '' : C0[0]}y − ${C0[0] === 1 ? '' : C0[0]}a + ${C0[1]}) = 0. So y = −a (the point (0, −a)) or y = a − ${P(fv(1 / cv))}. The second gives two more points only when it is above −a: a > ${P(lim)}. So three points for a > ${P(lim)} and one point for 0 < a ≤ ${P(lim)}.`); }
      let a, b; do { a = R.int(1, 6); b = R.int(1, 6); } while (a === b && R.bool(0.7)); const A = a * a, B = b * b, sl = E.fracStr(b, a), never = R.bool(0.4), iA = A === 1 ? '1' : `1/${A}`;
      return E.num(`For which values of k does the line ${M('y=kx')} ${never ? 'miss' : 'meet'} the hyperbola ${M(hypEq(false, 0, 0, A, B))}?`, [{ label: 'k:', interval: never ? `(-inf,-${sl}]U[${sl},inf)` : `(-${sl},${sl})` }],
        `Substitute y = kx: x²(${iA} − k²${B === 1 ? '' : '/' + B}) = 1, which has solutions only when ${iA} − k²${B === 1 ? '' : '/' + B} > 0, that is k² < ${E.fracStr(B, A)}, |k| < ${P(sl)}. The lines through the center ${never ? 'miss it when they are at least as steep as the asymptotes' : 'meet it when they are less steep than the asymptotes'}: ${never ? `k ≤ −${P(sl)} or k ≥ ${P(sl)}` : `−${P(sl)} < k < ${P(sl)}`}.`); } },
  });
})(typeof window !== 'undefined' ? window : globalThis);
