/* Era V · Unit V.2 Lines & angles (V.2.01–V.2.06) */
(function (G) {
  const E = G.E5, V = E.V, C = E.C, M = s => E.mx(s), K = E.K;
  const S = (id, name, steps) => E.skill({ id, name, steps });
  const { rad, add, sub, mul, polar } = K;

  /* ================= small text helpers ================= */
  const deg = n => `${n}°`;
  const nf = v => String(+(+v).toFixed(3));
  const pn = v => v < 0 ? `(${nf(v)})` : nf(v);
  const lin = (a, b, v = 'x') => `${a === 1 ? '' : a}${v}${b ? (b > 0 ? ' + ' + b : ' − ' + -b) : ''}`;        // label text 3x + 5
  const linM = (a, b, v = 'x') => `${a === 1 ? '' : a}${v}${b ? (b > 0 ? '+' + b : b) : ''}`;                 // M() text 3x+5
  const sd = (a, b) => a ? linM(a, b) : String(b);
  const angLab = (a, b) => !a ? deg(b) : b ? `(${lin(a, b)})°` : `${lin(a, b)}°`;
  const segLab = (a, b) => a ? lin(a, b) : String(b);
  // ax + b worth val at x, with a picked from as
  const expr = (R, val, x, as = [1, 2, 3, 4, 5], lim = 60) => { for (let k = 0; k < 40; k++) { const a = R.pick(as), b = val - a * x; if (Math.abs(b) <= lim) return [a, b]; } return [1, val - x]; };
  const exprNot = (R, val, x, bad, as, lim) => { for (let k = 0; k < 40; k++) { const e = expr(R, val, x, as, lim); if (e[0] !== bad) return e; } return [bad === 1 ? 2 : 1, val - (bad === 1 ? 2 : 1) * x]; };
  const evalTxt = (a, b, x, val) => `${a === 1 ? x : `${a}(${x})`}${b ? (b > 0 ? ' + ' + b : ' − ' + -b) : ''} = ${val}`;
  // a1x + b1 = a2x + b2 → x
  const solveTxt = (a1, b1, a2, b2, x) => { let A = a1 - a2, B = b2 - b1; if (A < 0) { A = -A; B = -B; } return `${M(sd(a1, b1) + '=' + sd(a2, b2))}, so ${A === 1 ? '' : M(`${A}x=${B}`) + ' and '}x = ${x}`; };
  // (a1x + b1) + (a2x + b2) = T → x
  const par = (a, b) => a && b ? `(${linM(a, b)})` : sd(a, b);
  const sumTxt = (a1, b1, a2, b2, T, x) => `${M(`${par(a1, b1)}+${par(a2, b2)}=${T}`)}, so ${M(`${sd(a1 + a2, b1 + b2)}=${T}`)} and x = ${x}`;
  const kk = c => c === 1 ? 'k' : c === 0.5 ? '½k' : nf(c) + 'k';
  const joinAnd = a => a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1];

  /* ================= figure helpers ================= */
  const NUM = { size: 14, weight: 700, fill: C.blue }, LN = { size: 15, weight: 700 };
  // turn a wide figure at most ±40° (or a half turn more), maybe reflected, so it stays wide
  const spinW = (R, pts) => K.xform(pts, rad(R.int(-8, 8) * 5 + (R.bool() ? 180 : 0)), R.bool());
  const scOf = (P, W) => { const v = Object.values(P), xs = v.map(p => p[0]), ys = v.map(p => p[1]); return (W - 60) / Math.max(1e-9, Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)); };
  // a spot inside angle p-v-q for a short label (an angle number), far enough out to fit between the arms
  const inAng = (P, v, p, q, sc, px = 15) => { const O = P[v], a1 = Math.atan2(P[p][1] - O[1], P[p][0] - O[0]), a2 = Math.atan2(P[q][1] - O[1], P[q][0] - O[0]);
    let d = a2 - a1; while (d <= -Math.PI) d += 2 * Math.PI; while (d > Math.PI) d -= 2 * Math.PI;
    const m = a1 + d / 2, r = Math.max(px, 10 / Math.sin(Math.abs(d) / 2)) / sc; return [O[0] + r * Math.cos(m), O[1] + r * Math.sin(m)]; };

  // points on one line at positions ts; labs[i] = {lab, ticks} for the piece from point i to point i+1.
  // Point letters go on one side of the line, lengths on the other.
  const lineFig = (R, names, ts, labs = []) => {
    const ph = R.int(-8, 8) * 5, w = polar(1, ph), rev = R.bool(), lo = ts[0], hi = ts[ts.length - 1], k = 6 / (hi - lo), P = {};
    names.forEach((nm, i) => P[nm] = mul(w, (rev ? hi - ts[i] : ts[i] - lo) * k));
    const s = mul([-w[1], w[0]], R.bool() ? 1 : -1), segs = [];
    names.slice(1, -1).forEach((nm, i) => { P['_q' + i] = add(P[nm], mul(s, -0.35)); segs.push([nm, '_q' + i, { color: 'none' }]); });   // invisible: pushes letters to the far side
    P._r = add(mul(w, 3), mul(s, 0.3));
    names.slice(1).forEach((nm, i) => segs.push([names[i], nm, Object.assign({ ref: '_r' }, labs[i] || {})]));
    return K.fig({ pts: P, segs, w: 300, label: 'points on a line' });
  };
  // rays from vertex v: rays [[name, direction°, segOpts]], arcs [[p, q, label, opts]]
  const fan = (R, v, rays, arcs = [], o = {}) => { const P = { [v]: [0, 0] }; rays.forEach(([nm, d]) => { P[nm] = polar(o.len || 3, d); });
    const Q = K.spin(R, P);
    return K.fig({ pts: Q, segs: rays.map(([nm, , op]) => [v, nm, op || {}]), angles: arcs.map(([p, q, lab, op]) => [p, v, q, lab, Object.assign(lab && lab.length > 4 ? { max: 95 } : {}, op || {})]), w: o.w || 260, label: o.label || 'rays from one point' }); };
  // two lines crossing; angles 1–4 go around from the first line. o: {gap, nums, arcs:{k:lab}, right:[k], names}
  const cross = (R, o) => {
    const g = o.gap, W = o.w || 250, L = 2.6, P = { _O: [0, 0], _a: polar(L, 0), _b: polar(L, g), _c: polar(L, 180), _d: polar(L, g + 180) };
    if (o.names) { P._na = polar(L + 0.45, 0); P._nb = polar(L + 0.45, g); }
    const Q = K.spin(R, P), sc = scOf(Q, W), tri = k => [['_a', '_O', '_b'], ['_b', '_O', '_c'], ['_c', '_O', '_d'], ['_d', '_O', '_a']][k - 1], right = o.right || [];
    const text = (o.nums === true ? [1, 2, 3, 4] : o.nums || []).map(k => { const [p, v, q] = tri(k); return [inAng(Q, v, p, q, sc, right.includes(k) ? 30 : 15), String(k), NUM]; });
    if (o.names) text.push([Q._na, o.names[0], LN], [Q._nb, o.names[1], LN]);
    const angles = Object.entries(o.arcs || {}).map(([k, lab]) => { const [p, v, q] = tri(+k); return [p, v, q, lab]; });
    right.forEach(k => { const [p, v, q] = tri(k); angles.push([p, v, q, '', { right: true }]); });
    return K.fig({ pts: Q, segs: [['_a', '_c'], ['_b', '_d']], angles, text, w: W, label: o.label || 'two intersecting lines' });
  };
  const cmeas = (g, k) => k % 2 ? g : 180 - g;
  // lines cut by a transversal t. Line i (top to bottom) has direction psi[i]; t makes th° with a horizontal line.
  // Angle k at line i = floor((k−1)/4): 1st top-left, 2nd top-right, 3rd bottom-left, 4th bottom-right.
  // o: {th, psi, nums, arcs:{k:lab}, aop:{k:opts}, right:[k], par:[i], names, t}
  const trans = (R, o) => {
    const psi = o.psi || [0, 0], n = psi.length, th = o.th, gap = o.gap || (n > 2 ? 2.5 : 3), W = o.w || (n > 2 ? 330 : 310), u = polar(1, th), P = {};
    psi.forEach((ps, i) => { const y = ((n - 1) / 2 - i) * gap, X = mul(u, y / Math.sin(rad(th))), w = polar(1, ps), L = n > 2 ? 2.6 : 3.1;
      P['_X' + i] = X; P['_r' + i] = add(X, mul(w, L)); P['_l' + i] = sub(X, mul(w, L)); P['_n' + i] = add(X, mul(w, L + 0.45)); });
    const ov = n > 2 ? 1.3 : 1.8; P._tu = add(P._X0, mul(u, ov)); P._td = sub(P['_X' + (n - 1)], mul(u, ov));
    const busy = ks => Object.keys(o.arcs || {}).filter(k => ks.includes(+k)).length;   // name t at the quieter end
    P._nt = busy([1, 2]) > busy([4 * n - 1, 4 * n]) ? sub(P._td, mul(u, 0.42)) : add(P._tu, mul(u, 0.42));
    const Q = spinW(R, P), sc = scOf(Q, W), right = o.right || [];
    const up = i => i ? '_X' + (i - 1) : '_tu', dn = i => i < n - 1 ? '_X' + (i + 1) : '_td';
    const tri = k => { const i = Math.floor((k - 1) / 4), X = '_X' + i; return [[up(i), X, '_l' + i], ['_r' + i, X, up(i)], ['_l' + i, X, dn(i)], [dn(i), X, '_r' + i]][(k - 1) % 4]; };
    const text = (o.names || ['ℓ', 'm', 'n']).slice(0, n).map((s, i) => [Q['_n' + i], s, LN]);
    if (o.t !== false) text.push([Q._nt, o.t || 't', LN]);
    (o.nums === true ? [...Array(4 * n).keys()].map(i => i + 1) : o.nums || []).forEach(k => { const [p, v, q] = tri(k); text.push([inAng(Q, v, p, q, sc, right.includes(k) ? 30 : 15), String(k), NUM]); });
    const angles = Object.entries(o.arcs || {}).map(([k, lab]) => { const [p, v, q] = tri(+k); return [p, v, q, lab, Object.assign(lab.length > 4 ? { max: 95 } : {}, (o.aop || {})[k] || {})]; });
    right.forEach(k => { const [p, v, q] = tri(k); angles.push([p, v, q, '', { right: true }]); });
    const segs = psi.map((_, i) => ['_l' + i, '_r' + i]).concat([['_tu', '_td']]);
    const arrows = (o.par || []).map(i => ['_l' + i, '_r' + i, 1, 0.8]);
    return K.fig({ pts: Q, segs, angles, arrows, text, w: W, label: o.label || 'lines cut by a transversal' });
  };
  const tmeas = (th, psi, k) => { const ps = psi[Math.floor((k - 1) / 4)] || 0, j = (k - 1) % 4; return j === 1 || j === 2 ? th - ps : 180 - th + ps; };
  const pickTh = R => R.bool() ? R.int(45, 75) : R.int(105, 135);
  const NAMES2 = [['ℓ', 'm'], ['p', 'q'], ['a', 'b'], ['j', 'k']], NAMES3 = [['a', 'b', 'c'], ['p', 'q', 'r'], ['ℓ', 'm', 'n']];
  const PAIRS = { corr: [[1, 5], [2, 6], [3, 7], [4, 8]], altInt: [[3, 6], [4, 5]], altExt: [[1, 8], [2, 7]], ssInt: [[3, 5], [4, 6]], ssExt: [[1, 7], [2, 8]] };
  const RELN = { corr: 'corresponding angles', altInt: 'alternate interior angles', altExt: 'alternate exterior angles', ssInt: 'same-side interior angles', ssExt: 'same-side exterior angles' };
  const EQUAL = { corr: true, altInt: true, altExt: true, ssInt: false, ssExt: false };
  // relation between local positions j1 (upper line) and j2 (lower line): 0 TL, 1 TR, 2 BL, 3 BR
  const relOf = (j1, j2) => j1 === j2 ? 'corr' : (j1 === 2 && j2 === 1) || (j1 === 3 && j2 === 0) ? 'altInt' : (j1 === 0 && j2 === 3) || (j1 === 1 && j2 === 2) ? 'altExt' : (j1 === 2 && j2 === 0) || (j1 === 3 && j2 === 1) ? 'ssInt' : (j1 === 0 && j2 === 2) || (j1 === 1 && j2 === 3) ? 'ssExt' : null;

  /* ================= proofs ================= */
  const RS = { G: 'given', LP: 'linear pair postulate', SUB: 'substitution', SUBT: 'subtraction property of equality', VA: 'vertical angles theorem', DS: 'definition of supplementary angles',
    DC: 'definition of complementary angles', CS: 'congruent supplements theorem', CC: 'congruent complements theorem', CA: 'corresponding angles postulate', AI: 'alternate interior angles theorem',
    AE: 'alternate exterior angles theorem', SSI: 'same-side interior angles theorem', CCA: 'converse of the corresponding angles postulate', CAI: 'converse of the alternate interior angles theorem',
    CAE: 'converse of the alternate exterior angles theorem', CSS: 'converse of the same-side interior angles theorem', TR: 'transitive property', DCA: 'definition of congruent angles',
    DPL: 'definition of perpendicular lines', DRA: 'definition of right angle', ARC: 'all right angles are congruent', AAP: 'angle addition postulate', DIV: 'division property of equality' };
  const WHY = { [RS.LP]: 'two angles that form a linear pair are supplementary', [RS.SUB]: 'equal measures can replace each other', [RS.SUBT]: 'the same measure is subtracted from both sides',
    [RS.VA]: 'vertical angles are congruent', [RS.DS]: 'supplementary angles add to 180°', [RS.DC]: 'complementary angles add to 90°',
    [RS.CS]: 'angles supplementary to the same angle (or to congruent angles) are congruent', [RS.CC]: 'angles complementary to the same angle (or to congruent angles) are congruent',
    [RS.CA]: 'parallel lines make congruent corresponding angles', [RS.CCA]: 'congruent corresponding angles make the lines parallel', [RS.TR]: 'two angles congruent to the same angle are congruent to each other',
    [RS.DCA]: 'angles with equal measures are congruent', [RS.DPL]: 'perpendicular lines meet at right angles, and lines that meet at a right angle are perpendicular',
    [RS.DRA]: 'a right angle is exactly an angle of 90°', [RS.ARC]: 'every right angle measures 90°', [RS.AAP]: 'the two smaller angles add up to the whole angle', [RS.DIV]: 'both sides are divided by the same number' };
  const SYN = { [RS.SUB]: [RS.TR], [RS.TR]: [RS.SUB], [RS.LP]: [RS.DS], [RS.DS]: [RS.LP], [RS.DPL]: [RS.DRA], [RS.DRA]: [RS.DPL, RS.ARC], [RS.ARC]: [RS.DRA] };
  const POOL = [RS.LP, RS.VA, RS.SUB, RS.SUBT, RS.DS, RS.DC, RS.CS, RS.CC, RS.CA, RS.AI, RS.TR, RS.DCA, RS.AAP];
  const tbl = rows => `<table class="dt"><tr><th>#</th><th>Statement</th><th>Reason</th></tr>${rows.map((r, i) => `<tr><td>${i + 1}</td><td>${r[0]}</td><td>${r[1]}</td></tr>`).join('')}</table>`;
  // wrong reasons, each with why it is wrong for that line
  const wVA = (a, b) => [[RS.LP, `${a} and ${b} are opposite each other, not side by side, so they are vertical angles, not a linear pair`], [RS.CA, `${a} and ${b} share a vertex, and corresponding angles sit at two different crossings`], [RS.DS, `nothing says ${a} and ${b} add to 180°; they are vertical angles`]];
  const wLP = (a, b) => [[RS.VA, `${a} and ${b} sit side by side along a line, a linear pair; vertical angles are opposite each other`], [RS.DC, 'complementary angles add to 90°, not 180°'], [RS.CA, `${a} and ${b} share a vertex, so they cannot be corresponding angles`]];
  const wCA = (a, b) => [[RS.AI, `${a} and ${b} are in matching positions at the two crossings, so they are corresponding angles, not alternate interior angles`], [RS.VA, `${a} and ${b} are at different crossings, so they are not vertical angles`], [RS.CCA, 'the converse proves lines parallel; here the lines are given parallel, so the postulate itself applies']];
  // pf = {lines:[[st, reason, deps, wrongs]], prove, vis, bad:[[i, statement, why]]}
  const proofQ = (R, pf, mode) => {
    const L = pf.lines, n = L.length, ng = L.filter(l => l[1] === RS.G).length, extra = pf.vis ? { visual: pf.vis } : {};
    const head = `${pf.note ? pf.note + ' ' : ''}Given: ${L.slice(0, ng).map(l => l[0]).join('; ')}. Prove: ${pf.prove}.`;
    if (mode === 'order') return K.orderQ(R, `${head} Put the steps of the proof in order.`, L.map(l => `${l[0]} (${l[1]})`), L.map(l => l[2] || []),
      `Each step comes after the steps it uses. ${L.slice(ng).filter(l => (l[2] || []).length).slice(-2).map(l => `${l[0]} uses ${joinAnd(l[2].map(d => L[d][0]))}`).join('; ')}.`, Object.assign({ fixed: ng }, extra));
    const cand = L.map((l, i) => i).filter(i => i >= ng);
    if (mode === 'reason') {
      const k = R.pick(cand), [st, rs] = L[k], own = (L[k][3] || []).map(w => w[0]).filter(w => w !== rs), ex = new Set([rs, ...(SYN[rs] || []), ...own, ...(pf.ok || [])]);
      const wrong = R.shuffle(own).slice(0, 3); R.shuffle(POOL.filter(p => !ex.has(p))).forEach(p => { if (wrong.length < 3) wrong.push(p); });
      return E.choice(R, `${head} What is the reason for step ${k + 1}?${tbl(L.map((l, i) => [l[0], i === k ? '<b>?</b>' : l[1]]))}`, rs, wrong, `Step ${k + 1}, ${st}, holds because ${WHY[rs]} (${rs}).`, extra);
    }
    const opts = []; cand.forEach(i => (L[i][3] || []).forEach(([w, why]) => opts.push({ i, rs: w, why: `${why}. The reason should be the ${L[i][1]}` })));
    (pf.bad || []).filter(([i]) => !L.some(l => (l[2] || []).includes(i))).forEach(([i, st, why]) => opts.push({ i, st, why }));   // never break a line a later step relies on
    const b = R.pick(opts), rows = L.map((l, i) => i === b.i ? [b.st || l[0], b.rs || l[1]] : [l[0], l[1]]), idx = L.map((l, i) => i).filter(i => n <= 6 || i >= ng);
    return E.choiceFixed(`${head} Exactly one step has a mistake. Which step is it?${tbl(rows)}`, idx.map(i => `Step ${i + 1}`), idx.indexOf(b.i), `Step ${b.i + 1} is wrong: ${b.why}.`, extra);
  };
  const mode3 = (R, w = [2, 1, 1]) => { const t = R.int(1, w[0] + w[1] + w[2]); return t <= w[0] ? 'order' : t <= w[0] + w[1] ? 'reason' : 'broken'; };
  Object.assign(RS, { DM: 'definition of midpoint', SAP: 'segment addition postulate', DAB: 'definition of angle bisector', CLT: 'combining like terms', ADD: 'addition property of equality' });
  Object.assign(WHY, { [RS.DM]: 'a midpoint splits a segment into two equal parts', [RS.SAP]: 'the two pieces of a segment add up to the whole segment', [RS.DAB]: 'a bisector splits an angle into two equal angles',
    [RS.CLT]: 'like terms are added together', [RS.ADD]: 'the same number is added to both sides', [RS.G]: 'it is given' });
  // short proof: a midpoint (or an angle bisector) makes the whole twice a half, or a half equal to half the whole
  const segHalf = (R, L, vis) => { const [A, Mn, B] = L, useA = R.bool(), X = useA ? A + Mn : Mn + B, half = R.bool(0.4);
    const lines = [[`${Mn} is the midpoint of ${A}${B}`, RS.G],
      [`${A}${Mn} = ${Mn}${B}`, RS.DM, [0], [[RS.SAP, 'segment addition gives a sum of pieces; the two equal halves come from the midpoint'], [RS.DAB, `there is no angle here; ${Mn} is the midpoint of a segment`], [RS.SUB, 'nothing is replaced; this is what a midpoint means']]],
      [`${A}${Mn} + ${Mn}${B} = ${A}${B}`, RS.SAP, [], [[RS.DM, 'a midpoint gives two equal halves, not a sum'], [RS.SUB, 'nothing is replaced; the two pieces simply make up the whole segment'], [RS.CLT, 'no like terms are combined; the pieces make up the whole']]],
      [`${X} + ${X} = ${A}${B}`, RS.SUB, [1, 2], [[RS.SAP, `the sum was written in step 3; here ${useA ? Mn + B : A + Mn} is replaced by the equal length ${X}`], [RS.CLT, 'nothing is combined yet; one half replaces the other'], [RS.DM, `the midpoint gave the equal halves in step 2; this step puts ${X} in place of its equal`]]],
      [`2 · ${X} = ${A}${B}`, RS.CLT, [3], [[RS.SUB, `nothing is replaced; ${X} + ${X} is simply 2 · ${X}`], [RS.DIV, 'nothing is divided in this step'], [RS.SAP, 'no segment is split into pieces here']]]];
    if (half) lines.push([`${X} = ½ · ${A}${B}`, RS.DIV, [4], [[RS.SUBT, 'the 2 is a factor, so both sides are divided by 2, not reduced by subtracting'], [RS.CLT, 'no like terms are combined; both sides are divided by 2'], [RS.SUB, 'nothing is replaced; both sides are divided by 2']]]);
    return { prove: lines[lines.length - 1][0], vis, lines }; };
  const angHalf = (R, L, vis) => { const [A, Bv, D, Cn] = L, an = (x, y) => `∠${x}${Bv}${y}`, useA = R.bool(), X = useA ? an(A, D) : an(D, Cn), half = R.bool(0.4);
    const lines = [[`Ray ${Bv}${D} bisects ${an(A, Cn)}`, RS.G],
      [`m${an(A, D)} = m${an(D, Cn)}`, RS.DAB, [0], [[RS.AAP, 'angle addition gives a sum of parts; the two equal halves come from the bisector'], [RS.DM, 'a midpoint splits a segment; here a ray splits an angle'], [RS.VA, 'the two halves sit side by side, so they are not vertical angles']]],
      [`m${an(A, D)} + m${an(D, Cn)} = m${an(A, Cn)}`, RS.AAP, [], [[RS.DAB, 'the bisector gives two equal halves, not a sum'], [RS.LP, `the parts make up ${an(A, Cn)}, not a straight angle`], [RS.SUB, 'nothing is replaced; the two parts simply make up the whole angle']]],
      [`m${X} + m${X} = m${an(A, Cn)}`, RS.SUB, [1, 2], [[RS.AAP, `the sum was written in step 3; here one half is replaced by the equal measure m${X}`], [RS.CLT, 'nothing is combined yet; one half replaces the other'], [RS.DAB, `the bisector gave the equal halves in step 2; this step puts m${X} in place of its equal`]]],
      [`2 · m${X} = m${an(A, Cn)}`, RS.CLT, [3], [[RS.SUB, `nothing is replaced; m${X} + m${X} is simply 2 · m${X}`], [RS.DIV, 'nothing is divided in this step'], [RS.AAP, 'no angle is split into parts here']]]];
    if (half) lines.push([`m${X} = ½ · m${an(A, Cn)}`, RS.DIV, [4], [[RS.SUBT, 'the 2 is a factor, so both sides are divided by 2, not reduced by subtracting'], [RS.CLT, 'no like terms are combined; both sides are divided by 2'], [RS.SUB, 'nothing is replaced; both sides are divided by 2']]]);
    return { prove: lines[lines.length - 1][0], vis, lines }; };
  // the algebra after "these two expressions are equal" (or "this expression is T"), each line with its reason
  const sgnTerm = v => v > 0 ? `${v}` : `${-v}`;
  const solveLines = (a1, b1, a2, b2, x, dep) => { const out = [], wS = k => [[RS.ADD, `${k} was subtracted from both sides, not added`], [RS.DIV, 'nothing is divided in this step'], [RS.SUB, 'nothing is replaced; the same term is taken from both sides']],
      wA = k => [[RS.SUBT, `${k} was added to both sides, not subtracted`], [RS.DIV, 'nothing is divided in this step'], [RS.SUB, 'nothing is replaced; the same number is added to both sides']],
      wD = [[RS.SUBT, 'the coefficient is a factor, so both sides are divided by it'], [RS.ADD, 'nothing is added; both sides are divided by the coefficient'], [RS.SUB, 'nothing is replaced; both sides are divided by the coefficient']];
    let d = dep; const push = (st, rs, w) => { out.push([st, rs, [d], w]); d++; };
    let A, B;   // reach A·x = B (or B = A·x)
    if (a2 === 0) { A = a1; B = b2 - b1; if (b1) push(M(`${A === 1 ? '' : A}x=${B}`), b1 > 0 ? RS.SUBT : RS.ADD, b1 > 0 ? wS(sgnTerm(b1)) : wA(sgnTerm(b1))); }
    else if (a1 > a2) { A = a1 - a2; push(M(`${sd(A, b1)}=${b2}`), RS.SUBT, wS(`${a2 === 1 ? '' : a2}x`)); B = b2 - b1; if (b1) push(M(`${A === 1 ? '' : A}x=${B}`), b1 > 0 ? RS.SUBT : RS.ADD, b1 > 0 ? wS(sgnTerm(b1)) : wA(sgnTerm(b1))); }
    else { A = a2 - a1; push(M(`${b1}=${sd(A, b2)}`), RS.SUBT, wS(`${a1 === 1 ? '' : a1}x`)); B = b1 - b2; if (b2) push(M(`${B}=${A === 1 ? '' : A}x`), b2 > 0 ? RS.SUBT : RS.ADD, b2 > 0 ? wS(sgnTerm(b2)) : wA(sgnTerm(b2))); }
    if (A !== 1) push(M(`x=${x}`), RS.DIV, wD);
    return out; };
  const algMid = (R, L, a1, b1, a2, b2, x, vis) => { const [A, Mn, B] = L;
    const lines = [[`${Mn} is the midpoint of ${A}${B}`, RS.G],
      [`${A}${Mn} = ${Mn}${B}`, RS.DM, [0], [[RS.SAP, 'segment addition gives a sum of pieces; the equal halves come from the midpoint'], [RS.SUB, 'nothing is replaced yet; this is what a midpoint means'], [RS.DAB, `there is no angle here; ${Mn} is the midpoint of a segment`]]],
      [M(`${sd(a1, b1)}=${sd(a2, b2)}`), RS.SUB, [1], [[RS.DM, `the midpoint gave ${A}${Mn} = ${Mn}${B} in step 2; this step puts the expressions in place of the lengths`], [RS.SUBT, 'nothing is subtracted yet'], [RS.CLT, 'nothing is combined; the expressions replace the lengths']]],
      ...solveLines(a1, b1, a2, b2, x, 2)];
    return { prove: `x = ${x}`, vis, lines }; };
  const algLP = (R, an, Cn, D, A, a1, b1, a2, b2, x, vis) => { const S0 = a1 + a2, T0 = b1 + b2;
    const lines = [[`${an(Cn, D)} and ${an(D, A)} form a linear pair`, RS.G],
      [`m${an(Cn, D)} + m${an(D, A)} = 180°`, RS.LP, [0], wLP(an(Cn, D), an(D, A))],
      [M(`${par(a1, b1)}+${par(a2, b2)}=180`), RS.SUB, [1], [[RS.LP, 'the linear pair gave the sum of 180° in step 2; this step puts the expressions in place of the angle measures'], [RS.SUBT, 'nothing is subtracted yet'], [RS.CLT, 'nothing is combined yet; the expressions replace the angle measures']]],
      [M(`${sd(S0, T0)}=180`), RS.CLT, [2], [[RS.SUB, 'nothing is replaced; the x-terms and the numbers are added together'], [RS.ADD, 'nothing is added to both sides; like terms on one side are added together'], [RS.DIV, 'nothing is divided in this step']]],
      ...solveLines(S0, T0, 0, 180, x, 3)];
    return { prove: `x = ${x}`, vis, lines }; };

  /* ================= V.2.01 Segments & midpoints ================= */
  const half = (R, lo, hi) => R.bool(0.25) ? R.int(lo, hi) + 0.5 : R.int(lo, hi);
  S('V.2.01', 'Segments & midpoints', {
    a: { t: 'segment addition postulate', g: R => { const kind = R.pick([0, 0, 1, 1, 2, 3]), [A, B, Cn, D] = K.lets(R, 4);
      if (kind === 2) { let p, q; do { p = R.int(2, 9); q = R.int(2, 9); } while (Math.abs(p - q) < 2);
        const vis = lineFig(R, [A, B, Cn], [0, p, p + q]);
        return E.choice(R, `${B} is between ${A} and ${Cn}. Which equation must be true?`, `${A}${B} + ${B}${Cn} = ${A}${Cn}`, [`${A}${B} + ${A}${Cn} = ${B}${Cn}`, `${A}${Cn} + ${B}${Cn} = ${A}${B}`, `${A}${B} = ${B}${Cn}`],
          `The two pieces ${A}${B} and ${B}${Cn} make up the whole segment ${A}${Cn} (segment addition). ${A}${Cn} is the longest of the three.`, { visual: vis }); }
      if (kind === 3) { let p, q, r; do { p = R.int(2, 9); q = R.int(2, 9); r = R.int(2, 9); } while (p === q && q === r);
        const vis = lineFig(R, [A, B, Cn, D], [0, p, p + q, p + q + r], [{ lab: String(p) }, { lab: '?' }, { lab: String(r) }]);
        return E.num(`The points lie on a line in the order ${A}, ${B}, ${Cn}, ${D}, and ${A}${D} = ${p + q + r}. Find ${B}${Cn}.`, [{ label: `${B}${Cn} =`, ans: q }], `${A}${B} + ${B}${Cn} + ${Cn}${D} = ${A}${D}, so ${p} + ${B}${Cn} + ${r} = ${p + q + r} and ${B}${Cn} = ${q}.`, { visual: vis }); }
      const p = half(R, 2, 12), q = half(R, 2, 12);
      if (kind === 0) { const vis = lineFig(R, [A, B, Cn], [0, p, p + q], [{ lab: nf(p) }, { lab: nf(q) }]);
        return E.num(`${B} is between ${A} and ${Cn}. Find ${A}${Cn}.`, [{ label: `${A}${Cn} =`, ans: p + q }], `Segment addition: ${A}${Cn} = ${A}${B} + ${B}${Cn} = ${nf(p)} + ${nf(q)} = ${nf(p + q)}.`, { visual: vis }); }
      const askB = R.bool(), vis = lineFig(R, [A, B, Cn], [0, p, p + q], askB ? [{ lab: nf(p) }, { lab: '?' }] : [{ lab: '?' }, { lab: nf(q) }]), T = p + q;
      return E.num(`${B} is between ${A} and ${Cn}, and ${A}${Cn} = ${nf(T)}. Find ${askB ? B + Cn : A + B}.`, [{ label: `${askB ? B + Cn : A + B} =`, ans: askB ? q : p }],
        `${A}${B} + ${B}${Cn} = ${A}${Cn}, so ${askB ? `${nf(p)} + ${B}${Cn} = ${nf(T)} and ${B}${Cn} = ${nf(T)} − ${nf(p)} = ${nf(q)}` : `${A}${B} + ${nf(q)} = ${nf(T)} and ${A}${B} = ${nf(T)} − ${nf(q)} = ${nf(p)}`}.`, { visual: vis }); } },
    b: { t: 'midpoint definition', g: R => { const kind = R.pick([0, 0, 1, 2]), [A, Mn, B] = K.lets(R, 3);
      if (R.bool(0.35)) return proofQ(R, segHalf(R, [A, Mn, B], lineFig(R, [A, Mn, B], [0, 1, 2], [{ ticks: 1 }, { ticks: 1 }])), mode3(R));
      if (kind === 2) { const TRUE = [`${A}${Mn} = ${Mn}${B}`, `${A}${B} = 2 · ${A}${Mn}`, `${A}${B} = 2 · ${Mn}${B}`, `${Mn}${B} = ½ · ${A}${B}`, `${A}${Mn} + ${Mn}${B} = ${A}${B}`];
        const FALSE = [`${A}${Mn} = ${A}${B}`, `${Mn}${B} = ${A}${B}`, `${A}${Mn} = 2 · ${A}${B}`, `${A}${B} = ½ · ${A}${Mn}`, `${Mn}${B} = 2 · ${A}${Mn}`, `${A}${Mn} + ${A}${B} = ${Mn}${B}`];
        const vis = lineFig(R, [A, Mn, B], [0, 1, 2], [{ ticks: 1 }, { ticks: 1 }]);
        return E.choice(R, `${Mn} is the midpoint of ${A}${B}. Which statement must be true?`, R.pick(TRUE), R.sample(FALSE, 3), `A midpoint splits ${A}${B} into two equal halves: ${A}${Mn} = ${Mn}${B}, and each half is half of ${A}${B}.`, { visual: vis }); }
      if (kind === 0) { const p = half(R, 3, 15), first = R.bool(), vis = lineFig(R, [A, Mn, B], [0, p, 2 * p], first ? [{ ticks: 1, lab: nf(p) }, { ticks: 1 }] : [{ ticks: 1 }, { ticks: 1, lab: nf(p) }]);
        return E.num(`${Mn} is the midpoint of ${A}${B}, and ${first ? A + Mn : Mn + B} = ${nf(p)}. Find ${A}${B}.`, [{ label: `${A}${B} =`, ans: 2 * p }], `A midpoint splits ${A}${B} into two equal halves, so ${A}${B} = 2 × ${nf(p)} = ${nf(2 * p)}, not ${nf(p)}.`, { visual: vis }); }
      const T = R.int(6, 36), ask = R.bool() ? A + Mn : Mn + B, vis = lineFig(R, [A, Mn, B], [0, T / 2, T], [{ ticks: 1 }, { ticks: 1 }]);
      return E.num(`${Mn} is the midpoint of ${A}${B}, and ${A}${B} = ${T}. Find ${ask}.`, [{ label: `${ask} =`, ans: T / 2 }], `The midpoint makes two equal halves, so ${ask} = ${T} ÷ 2 = ${nf(T / 2)}.`, { visual: vis }); } },
    c: { t: 'solve for x', g: R => { const kind = R.int(0, 2), [A, Mn, B] = K.lets(R, 3), x = R.int(2, 12);
      if (R.bool(0.3)) { let v, a1, b1, a2, b2; do { v = R.int(6, 30); [a1, b1] = expr(R, v, x, [1, 2, 3, 4, 5], 40); [a2, b2] = exprNot(R, v, x, a1, [1, 2, 3, 4, 5, 6], 40); } while (!b1 || !b2 || a1 === a2);
        const vis = lineFig(R, [A, Mn, B], [0, v, 2 * v], [{ ticks: 1, lab: lin(a1, b1) }, { ticks: 1, lab: lin(a2, b2) }]);
        return proofQ(R, algMid(R, [A, Mn, B], a1, b1, a2, b2, x, vis), R.pick(['reason', 'reason', 'broken'])); }
      if (kind === 0) { const v = R.int(6, 30), [a1, b1] = expr(R, v, x, [1, 2, 3, 4, 5], 40), [a2, b2] = exprNot(R, v, x, a1, [1, 2, 3, 4, 5, 6], 40), ask = R.pick(['x', 'x', 'AB', 'AM']);
        const vis = lineFig(R, [A, Mn, B], [0, v, 2 * v], [{ ticks: 1, lab: lin(a1, b1) }, { ticks: 1, lab: lin(a2, b2) }]), base = `${A}${Mn} = ${Mn}${B}, so ${solveTxt(a1, b1, a2, b2, x)}`;
        if (ask === 'x') return E.num(`${Mn} is the midpoint of ${A}${B}. Find x.`, [{ label: 'x =', ans: x }], `${base}.`, { visual: vis });
        if (ask === 'AM') return E.num(`${Mn} is the midpoint of ${A}${B}. Find ${A}${Mn}.`, [{ label: `${A}${Mn} =`, ans: v }], `${base}. Then ${A}${Mn} = ${evalTxt(a1, b1, x, v)}.`, { visual: vis });
        return E.num(`${Mn} is the midpoint of ${A}${B}. Find ${A}${B}.`, [{ label: `${A}${B} =`, ans: 2 * v }], `${base}. Then ${A}${Mn} = ${evalTxt(a1, b1, x, v)}, and ${A}${B} is twice that: ${2 * v}.`, { visual: vis }); }
      if (kind === 1) { const [P, Q, Rn] = [A, Mn, B]; let p, q; do { p = R.int(5, 30); q = R.int(5, 30); } while (p === q);
        const [a1, b1] = expr(R, p, x, [1, 2, 3, 4], 30), [a2, b2] = expr(R, q, x, [1, 2, 3, 4], 30), T = p + q, ask = R.pick(['x', 'x', 'p', 'q']);
        const vis = lineFig(R, [P, Q, Rn], [0, p, T], [{ lab: lin(a1, b1) }, { lab: lin(a2, b2) }]), base = `${P}${Q} + ${Q}${Rn} = ${P}${Rn}, so ${sumTxt(a1, b1, a2, b2, T, x)}`;
        if (ask === 'x') return E.num(`${Q} is between ${P} and ${Rn}, and ${P}${Rn} = ${T}. Find x.`, [{ label: 'x =', ans: x }], `${base}.`, { visual: vis });
        const nm = ask === 'p' ? P + Q : Q + Rn, val = ask === 'p' ? p : q, [a, b] = ask === 'p' ? [a1, b1] : [a2, b2];
        return E.num(`${Q} is between ${P} and ${Rn}, and ${P}${Rn} = ${T}. Find ${nm}.`, [{ label: `${nm} =`, ans: val }], `${base}. Then ${nm} = ${evalTxt(a, b, x, val)}.`, { visual: vis }); }
      let v, a1, b1, a2, b2; do { v = R.int(5, 24); [a2, b2] = expr(R, v, x, [1, 2, 3], 30); [a1, b1] = expr(R, 2 * v, x, [1, 2, 3, 4, 5, 7], 40); } while (a1 === 2 * a2);
      const ask = R.pick(['x', 'x', 'AB']), vis = lineFig(R, [A, Mn, B], [0, v, 2 * v], [{ ticks: 1, lab: lin(a2, b2) }, { ticks: 1 }]);
      const base = `${A}${B} = 2 · ${A}${Mn}, so ${M(`${sd(a1, b1)}=2(${linM(a2, b2)})`)}, which gives ${solveTxt(a1, b1, 2 * a2, 2 * b2, x).replace(/^.*?, so /, '')}`;
      if (ask === 'x') return E.num(`${Mn} is the midpoint of ${A}${B}, and ${A}${B} = ${M(sd(a1, b1))}. Find x.`, [{ label: 'x =', ans: x }], `${base}.`, { visual: vis });
      return E.num(`${Mn} is the midpoint of ${A}${B}, and ${A}${B} = ${M(sd(a1, b1))}. Find ${A}${B}.`, [{ label: `${A}${B} =`, ans: 2 * v }], `${base}. So ${A}${B} = ${evalTxt(a1, b1, x, 2 * v)}.`, { visual: vis }); } },
    d: { t: 'midpoint formula link', g: R => { const kind = R.int(0, 3), [A, B, Mn] = K.lets(R, 3), pt = (x, y) => `(${nf(x)}, ${nf(y)})`;
      const gr = pts => V.graph({ x: [-10, 10], y: [-10, 10], w: 250, ticks: 2, labels: false, points: pts, label: 'points on a coordinate grid' });
      if (kind === 0) { let x1, y1, x2, y2; do { x1 = R.int(-9, 9); y1 = R.int(-9, 9); x2 = R.int(-9, 9); y2 = R.int(-9, 9); } while (Math.abs(x1 - x2) + Math.abs(y1 - y2) < 5);
        const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
        return E.num(`Find the midpoint of ${A}${B}, where ${A}${pt(x1, y1)} and ${B}${pt(x2, y2)}.`, [{ point: [nf(mx), nf(my)] }], `Average the coordinates: ((${x1} + ${pn(x2)})/2, (${y1} + ${pn(y2)})/2) = ${pt(mx, my)}.`, { visual: gr([[x1, y1, A], [x2, y2, B]]) }); }
      if (kind === 1) { let x1, y1, mx, my; do { x1 = R.int(-8, 8); y1 = R.int(-8, 8); mx = R.int(-6, 6); my = R.int(-6, 6); } while (Math.abs(x1 - mx) + Math.abs(y1 - my) < 3 || Math.abs(2 * mx - x1) > 14 || Math.abs(2 * my - y1) > 14);
        const bx = 2 * mx - x1, by = 2 * my - y1;
        return E.num(`${Mn}${pt(mx, my)} is the midpoint of ${A}${B}, and ${A}${pt(x1, y1)}. Find ${B}.`, [{ point: [String(bx), String(by)] }], `${Mn} is halfway, so ${B} is as far past ${Mn} as ${A} is before it: (2·${pn(mx)} − ${pn(x1)}, 2·${pn(my)} − ${pn(y1)}) = ${pt(bx, by)}.`); }
      if (kind === 2) { const [a, b, c] = R.pick([[3, 4, 5], [4, 3, 5], [5, 12, 13], [12, 5, 13], [6, 8, 10], [8, 6, 10]]), sx = R.pick([1, -1]), sy = R.pick([1, -1]);
        let x1, y1; do { x1 = R.int(-12, 12); y1 = R.int(-12, 12); } while (Math.abs(x1 + 2 * a * sx) > 14 || Math.abs(y1 + 2 * b * sy) > 14);
        const x2 = x1 + 2 * a * sx, y2 = y1 + 2 * b * sy, mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
        return E.num(`${Mn} is the midpoint of ${A}${B}, where ${A}${pt(x1, y1)} and ${B}${pt(x2, y2)}. Find ${A}${Mn}.`, [{ label: `${A}${Mn} =`, ans: c }],
          `${Mn} = ${pt(mx, my)}, so ${A}${Mn} = √(${a}² + ${b}²) = ${c}. Check: ${A}${B} = ${2 * c}, and the midpoint makes ${A}${Mn} half of it.`); }
      let mx, my, x1, y2, x2, y1; do { mx = R.int(-6, 6); my = R.int(-6, 6); x2 = R.int(-9, 9); y1 = R.int(-9, 9); x1 = 2 * mx - x2; y2 = 2 * my - y1; } while (Math.abs(x1) > 12 || Math.abs(y2) > 12 || x1 === x2 || y1 === y2);
      return E.num(`${Mn}${pt(mx, my)} is the midpoint of ${A}(x, ${y1}) and ${B}(${x2}, y). Find x and y.`, [{ label: 'x =', ans: x1 }, { label: 'y =', ans: y2 }],
        `The midpoint averages the coordinates: (x + ${x2})/2 = ${mx} gives x = ${2 * mx} − ${pn(x2)} = ${x1}, and (${y1} + y)/2 = ${my} gives y = ${2 * my} − ${pn(y1)} = ${y2}.`); } },
  });

  /* ================= V.2.02 Angles & bisectors ================= */
  const two = (R, lo, hi, gap = 10, maxSum = 165) => { let p, q; do { p = R.int(lo, hi); q = R.int(lo, hi); } while (p + q > maxSum || Math.abs(p - q) < gap); return [p, q]; };
  S('V.2.02', 'Angles & bisectors', {
    a: { t: 'angle addition postulate', g: R => { const kind = R.pick([0, 0, 1, 1, 2]), [A, Bv, D, Cn] = K.lets(R, 4), [p, q] = two(R, 24, 80), an = (x, y) => `∠${x}${Bv}${y}`;
      const rays = [[A, 0], [D, p], [Cn, p + q]];
      if (kind === 2) return E.choice(R, `Ray ${Bv}${D} is inside ${an(A, Cn)}. Which equation must be true?`, `m${an(A, D)} + m${an(D, Cn)} = m${an(A, Cn)}`, [`m${an(A, D)} + m${an(A, Cn)} = m${an(D, Cn)}`, `m${an(A, Cn)} + m${an(D, Cn)} = m${an(A, D)}`, `m${an(A, D)} = m${an(D, Cn)}`],
        `The two smaller angles fill the whole angle (angle addition): m${an(A, D)} + m${an(D, Cn)} = m${an(A, Cn)}. The ray is not a bisector, so the parts need not be equal.`, { visual: fan(R, Bv, rays) });
      if (kind === 0) return E.num(`Find m${an(A, Cn)}.`, [{ label: `m${an(A, Cn)} =`, ans: p + q }], `Angle addition: m${an(A, Cn)} = ${p}° + ${q}° = ${p + q}°.`, { visual: fan(R, Bv, rays, [[A, D, deg(p)], [D, Cn, deg(q)]]) });
      const askQ = R.bool(), T = p + q;
      return E.num(`m${an(A, Cn)} = ${T}°. Find m${askQ ? an(D, Cn) : an(A, D)}.`, [{ label: `m${askQ ? an(D, Cn) : an(A, D)} =`, ans: askQ ? q : p }], `The parts add to the whole: ${T}° − ${askQ ? p : q}° = ${askQ ? q : p}°.`,
        { visual: fan(R, Bv, rays, askQ ? [[A, D, deg(p)], [D, Cn, '?']] : [[A, D, '?'], [D, Cn, deg(q)]]) }); } },
    b: { t: 'bisector definition', g: R => { const kind = R.pick([0, 0, 1, 2]), [A, Bv, D, Cn] = K.lets(R, 4), p = R.int(20, 78), an = (x, y) => `∠${x}${Bv}${y}`, rays = [[A, 0], [D, p], [Cn, 2 * p]];
      const tk = lab => ({ n: 1, tick: true }), pre = `Ray ${Bv}${D} bisects ${an(A, Cn)}.`;
      if (R.bool(0.35)) return proofQ(R, angHalf(R, [A, Bv, D, Cn], fan(R, Bv, rays, [[A, D, '', tk()], [D, Cn, '', tk()]])), mode3(R));
      if (kind === 2) { const TRUE = [`m${an(A, D)} = m${an(D, Cn)}`, `m${an(A, Cn)} = 2 · m${an(A, D)}`, `m${an(D, Cn)} = ½ · m${an(A, Cn)}`], FALSE = [`m${an(A, D)} = m${an(A, Cn)}`, `m${an(D, Cn)} = 2 · m${an(A, Cn)}`, `m${an(A, Cn)} = ½ · m${an(A, D)}`, `m${an(A, D)} + m${an(D, Cn)} = 180°`];
        return E.choice(R, `${pre} Which statement must be true?`, R.pick(TRUE), R.sample(FALSE, 3), `A bisector cuts ${an(A, Cn)} into two equal halves, so m${an(A, D)} = m${an(D, Cn)}, and each is half of m${an(A, Cn)}.`, { visual: fan(R, Bv, rays, [[A, D, '', tk()], [D, Cn, '', tk()]]) }); }
      if (kind === 0) { const first = R.bool(), half1 = first ? an(A, D) : an(D, Cn);
        return E.num(`${pre} m${half1} = ${p}°. Find m${an(A, Cn)}.`, [{ label: `m${an(A, Cn)} =`, ans: 2 * p }], `The bisector makes two equal halves, so the whole angle is 2 × ${p}° = ${2 * p}°, not ${p}°.`,
          { visual: fan(R, Bv, rays, [[A, D, first ? deg(p) : '', tk()], [D, Cn, first ? '' : deg(p), tk()]]) }); }
      const first = R.bool(), half1 = first ? an(A, D) : an(D, Cn);
      return E.num(`${pre} m${an(A, Cn)} = ${2 * p}°. Find m${half1}.`, [{ label: `m${half1} =`, ans: p }], `Each half of a bisected angle is half the whole: ${2 * p}° ÷ 2 = ${p}°.`, { visual: fan(R, Bv, rays, [[A, D, first ? '?' : '', tk()], [D, Cn, first ? '' : '?', tk()]]) }); } },
    c: { t: 'solve for x', g: R => { const kind = R.int(0, 2), [A, Bv, D, Cn] = K.lets(R, 4), an = (x, y) => `∠${x}${Bv}${y}`, x = R.int(3, 16), tk = { n: 1, tick: true };
      if (kind === 0) { const v = R.int(30, 78), [a1, b1] = expr(R, v, x, [1, 2, 3, 4, 5], 50), [a2, b2] = exprNot(R, v, x, a1, [1, 2, 3, 4, 5, 6], 50), ask = R.pick(['x', 'x', 'whole', 'half']);
        const vis = fan(R, Bv, [[A, 0], [D, v], [Cn, 2 * v]], [[A, D, angLab(a1, b1), tk], [D, Cn, angLab(a2, b2), tk]]), base = `A bisector makes equal halves, so ${solveTxt(a1, b1, a2, b2, x)}`, pre = `Ray ${Bv}${D} bisects ${an(A, Cn)}.`;
        if (ask === 'x') return E.num(`${pre} Find x.`, [{ label: 'x =', ans: x }], `${base}.`, { visual: vis });
        if (ask === 'half') return E.num(`${pre} Find m${an(A, D)}.`, [{ label: `m${an(A, D)} =`, ans: v }], `${base}. Then m${an(A, D)} = ${evalTxt(a1, b1, x, v)}°.`, { visual: vis });
        return E.num(`${pre} Find m${an(A, Cn)}.`, [{ label: `m${an(A, Cn)} =`, ans: 2 * v }], `${base}. Each half is ${evalTxt(a1, b1, x, v)}°, so the whole angle is ${2 * v}°.`, { visual: vis }); }
      if (kind === 1) { const [p, q] = two(R, 32, 90), [a1, b1] = expr(R, p, x, [1, 2, 3, 4], 40), [a2, b2] = expr(R, q, x, [1, 2, 3, 4], 40), T = p + q, ask = R.pick(['x', 'x', 'p', 'q']);
        const vis = fan(R, Bv, [[A, 0], [D, p], [Cn, T]], [[A, D, angLab(a1, b1)], [D, Cn, angLab(a2, b2)]]), base = `Angle addition: ${sumTxt(a1, b1, a2, b2, T, x)}`, pre = `m${an(A, Cn)} = ${T}°.`;
        if (ask === 'x') return E.num(`${pre} Find x.`, [{ label: 'x =', ans: x }], `${base}.`, { visual: vis });
        const nm = ask === 'p' ? an(A, D) : an(D, Cn), val = ask === 'p' ? p : q, [a, b] = ask === 'p' ? [a1, b1] : [a2, b2];
        return E.num(`${pre} Find m${nm}.`, [{ label: `m${nm} =`, ans: val }], `${base}. Then m${nm} = ${evalTxt(a, b, x, val)}°.`, { visual: vis }); }
      let v, a1, b1, a2, b2; do { v = R.int(30, 78); [a2, b2] = expr(R, v, x, [1, 2, 3], 40); [a1, b1] = expr(R, 2 * v, x, [1, 2, 3, 4, 5, 7], 60); } while (a1 === 2 * a2);
      const vis = fan(R, Bv, [[A, 0], [D, v], [Cn, 2 * v]], [[A, D, angLab(a2, b2), tk], [D, Cn, '', tk]]), ask = R.pick(['x', 'x', 'whole']);
      const base = `The whole is twice a half: ${M(`${sd(a1, b1)}=2(${linM(a2, b2)})`)}, which gives ${solveTxt(a1, b1, 2 * a2, 2 * b2, x).replace(/^.*?, so /, '')}`, pre = `Ray ${Bv}${D} bisects ${an(A, Cn)}, and m${an(A, Cn)} = ${angLab(a1, b1)}.`;
      if (ask === 'x') return E.num(`${pre} Find x.`, [{ label: 'x =', ans: x }], `${base}.`, { visual: vis });
      return E.num(`${pre} Find m${an(A, Cn)}.`, [{ label: `m${an(A, Cn)} =`, ans: 2 * v }], `${base}. So m${an(A, Cn)} = ${evalTxt(a1, b1, x, 2 * v)}°.`, { visual: vis }); } },
    d: { t: 'linear pair postulate', g: R => { const kind = R.pick([0, 1, 1, 2, 3]), [A, Bv, Cn, D, Ee] = K.lets(R, 5), an = (x, y) => `∠${x}${Bv}${y}`, pre = `${A}, ${Bv} and ${Cn} lie on a line.`;
      if (R.bool(0.3)) { let p, x, a1, b1, a2, b2; do { p = R.int(25, 155); x = R.int(5, 25); [a1, b1] = expr(R, p, x, [1, 2, 3, 4, 5], 60); [a2, b2] = expr(R, 180 - p, x, [1, 2, 3, 4, 5], 60); } while (Math.abs(p - 90) < 8 || b1 + b2 === 0);
        const vis = fan(R, Bv, [[Cn, 0], [D, p], [A, 180]], [[Cn, D, angLab(a1, b1)], [D, A, angLab(a2, b2)]]);
        return proofQ(R, algLP(R, an, Cn, D, A, a1, b1, a2, b2, x, vis), R.pick(['reason', 'reason', 'broken'])); }
      if (kind === 3) { let p, q; do { p = R.int(22, 90); q = R.int(22, 90); } while (180 - p - q < 22);
        const vis = fan(R, Bv, [[Cn, 0], [D, p], [Ee, p + q], [A, 180]], [[Cn, D, deg(p)], [D, Ee, deg(q)], [Ee, A, '?']]);
        return E.num(`${pre} Find m${an(Ee, A)}.`, [{ label: `m${an(Ee, A)} =`, ans: 180 - p - q }], `The three angles fill the straight angle ${an(A, Cn)}, which is 180°: ${180}° − ${p}° − ${q}° = ${180 - p - q}°.`, { visual: vis }); }
      let p; do p = R.int(25, 155); while (Math.abs(p - 90) < 8);
      if (kind === 0) { const vis = fan(R, Bv, [[Cn, 0], [D, p], [A, 180]], [[Cn, D, deg(p)], [D, A, '?']]);
        return E.num(`${pre} Find m${an(D, A)}.`, [{ label: `m${an(D, A)} =`, ans: 180 - p }], `${an(Cn, D)} and ${an(D, A)} form a linear pair, so they are supplementary: 180° − ${p}° = ${180 - p}°.`, { visual: vis }); }
      if (kind === 2) { let q, k, c; do { q = R.int(20, 70); k = R.pick([2, 3, 4]); c = 180 - q - k * q; } while (c === 0 || Math.abs(c) > 40 || k * q + c < 25 || Math.abs(k * q + c - q) < 10);
        const big = k * q + c, vis = fan(R, Bv, [[Cn, 0], [D, q], [A, 180]], [[Cn, D, ''], [D, A, '']]), more = c > 0 ? `${c}° more than` : `${-c}° less than`;
        return E.num(`${pre} m${an(D, A)} is ${more} ${k} times m${an(Cn, D)}. Find m${an(D, A)}.`, [{ label: `m${an(D, A)} =`, ans: big }],
          `Let m${an(Cn, D)} = x. The linear pair adds to 180°: ${M(`x+${k}x${c > 0 ? '+' + c : c}=180`)}, so ${M(`${k + 1}x=${180 - c}`)}, x = ${q} and m${an(D, A)} = ${k}(${q}) ${c > 0 ? '+' : '−'} ${Math.abs(c)} = ${big}°.`, { visual: vis }); }
      const x = R.int(5, 25), [a1, b1] = expr(R, p, x, [1, 2, 3, 4, 5], 60), [a2, b2] = expr(R, 180 - p, x, [1, 2, 3, 4, 5], 60), ask = R.pick(['x', 'x', 'p']);
      const vis = fan(R, Bv, [[Cn, 0], [D, p], [A, 180]], [[Cn, D, angLab(a1, b1)], [D, A, angLab(a2, b2)]]), base = `A linear pair adds to 180°: ${sumTxt(a1, b1, a2, b2, 180, x)}`;
      if (ask === 'x') return E.num(`${pre} Find x.`, [{ label: 'x =', ans: x }], `${base}.`, { visual: vis });
      return E.num(`${pre} Find m${an(Cn, D)}.`, [{ label: `m${an(Cn, D)} =`, ans: p }], `${base}. Then m${an(Cn, D)} = ${evalTxt(a1, b1, x, p)}°.`, { visual: vis }); } },
    e: { t: 'a bisector and one more ray', g: R => { const kind = R.int(0, 2), [O, A, Mn, Cn, B, N] = K.lets(R, 6), an = (x, y) => `∠${x}${O}${y}`, tk = { n: 1, tick: true }, dsh = { dash: true };
      if (kind < 2) { let h, c; do { h = R.int(30, 80); c = R.int(10, h - 10); } while ((kind === 0 && (h - c) < 8));
        const vis = fan(R, O, [[A, 0], [Mn, h, dsh], [Cn, 2 * h - c], [B, 2 * h]], [[A, Mn, '', tk], [Mn, B, '', tk]], { w: 270 });
        const pre = `Ray ${O}${Mn} bisects ${an(A, B)}, and ray ${O}${Cn} lies between ${O}${Mn} and ${O}${B}.`;
        if (kind === 0) return E.num(`${pre} m${an(A, Cn)} = ${2 * h - c}° and m${an(Cn, B)} = ${c}°. Find m${an(Mn, Cn)}.`, [{ label: `m${an(Mn, Cn)} =`, ans: h - c }],
          `m${an(A, B)} = ${2 * h - c}° + ${c}° = ${2 * h}°, so each half is ${h}°. Then m${an(Mn, Cn)} = m${an(Mn, B)} − m${an(Cn, B)} = ${h}° − ${c}° = ${h - c}°.`, { visual: vis });
        return E.num(`${pre} m${an(A, B)} = ${2 * h}° and m${an(Mn, Cn)} = ${h - c}°. Find m${an(Cn, B)}.`, [{ label: `m${an(Cn, B)} =`, ans: c }],
          `Each half of ${an(A, B)} is ${h}°, so m${an(Cn, B)} = m${an(Mn, B)} − m${an(Mn, Cn)} = ${h}° − ${h - c}° = ${c}°.`, { visual: vis }); }
      let k; do k = R.int(18, 72); while (k === 45);
      const vis = fan(R, O, [[B, 0], [N, 90 - k, dsh], [Cn, 180 - 2 * k], [Mn, 180 - k, dsh], [A, 180]], [[Cn, Mn, '', tk], [Mn, A, '', tk], [B, N, '', { n: 2 }], [N, Cn, '', { n: 2 }]], { w: 280 }), askB = R.bool();
      return E.num(`${A}, ${O} and ${B} lie on a line. Ray ${O}${Mn} bisects ${an(A, Cn)} and ray ${O}${N} bisects ${an(Cn, B)}. If m${an(Mn, Cn)} = ${k}°, find m${askB ? an(B, N) : an(Mn, N)}.`, [{ label: `m${askB ? an(B, N) : an(Mn, N)} =`, ans: askB ? 90 - k : 90 }],
        askB ? `m${an(A, Cn)} = 2 × ${k}° = ${2 * k}°, so m${an(Cn, B)} = 180° − ${2 * k}° = ${180 - 2 * k}° and its half, ${an(B, N)}, is ${90 - k}°.`
          : `m${an(Cn, N)} = ½ m${an(Cn, B)} = ½(180° − ${2 * k}°) = ${90 - k}°, so m${an(Mn, N)} = ${k}° + ${90 - k}° = 90°. Bisectors of a linear pair are always perpendicular.`, { visual: vis }); } },
    f: { t: 'two bisectors in a fan', g: R => { const kind = R.int(0, 3), [O, A, B, Cn, D, Mn, N] = K.lets(R, 7), an = (x, y) => `∠${x}${O}${y}`;
      let a, b, c, rr = null, k = 0;
      if (kind === 3) { do { rr = [R.int(1, 5), R.int(1, 5), R.int(1, 5)]; k = R.int(4, 20); [a, b, c] = rr.map(r => r * k); } while ((rr[0] + rr[2]) % 2 && k % 2 || rr[0] === rr[1] && rr[1] === rr[2] || Math.min(a, b, c) < 16 || a + b + c > 170 || ((rr[0] + 2 * rr[1] + rr[2]) * k) % 2); }
      else do { a = R.int(16, 80); b = R.int(16, 70); c = R.int(16, 80); } while ((a + c) % 2 || a + b + c > 170 || a + b + c < 80);
      const mon = a / 2 + b + c / 2, dsh = { dash: true }, tk1 = { n: 1, tick: true }, tk2 = { n: 2 };
      const vis = fan(R, O, [[A, 0], [Mn, a / 2, dsh], [B, a], [Cn, a + b], [N, a + b + c / 2, dsh], [D, a + b + c]], [[A, Mn, '', tk1], [Mn, B, '', tk1], [Cn, N, '', tk2], [N, D, '', tk2]], { w: 290 });
      const pre = `Rays ${O}${A}, ${O}${B}, ${O}${Cn}, ${O}${D} are in order. Ray ${O}${Mn} bisects ${an(A, B)} and ray ${O}${N} bisects ${an(Cn, D)}.`, key = `m${an(Mn, N)} = ½m${an(A, B)} + m${an(B, Cn)} + ½m${an(Cn, D)}`;
      if (kind === 0) return E.num(`${pre} m${an(A, Cn)} = ${a + b}° and m${an(B, D)} = ${b + c}°. Find m${an(Mn, N)}.`, [{ label: `m${an(Mn, N)} =`, ans: mon }],
        `${key} = ½(m${an(A, B)} + m${an(B, Cn)}) + ½(m${an(B, Cn)} + m${an(Cn, D)}) = ½(${a + b}° + ${b + c}°) = ${mon}°.`, { visual: vis });
      if (kind === 1) return E.num(`${pre} m${an(A, D)} = ${a + b + c}° and m${an(B, Cn)} = ${b}°. Find m${an(Mn, N)}.`, [{ label: `m${an(Mn, N)} =`, ans: mon }],
        `${key} = ½(m${an(A, B)} + m${an(B, Cn)} + m${an(Cn, D)}) + ½m${an(B, Cn)} = ½(${a + b + c}° + ${b}°) = ${mon}°.`, { visual: vis });
      if (kind === 2) return E.num(`${pre} m${an(Mn, N)} = ${mon}° and m${an(B, Cn)} = ${b}°. Find m${an(A, D)}.`, [{ label: `m${an(A, D)} =`, ans: a + b + c }],
        `${key}, so 2m${an(Mn, N)} = m${an(A, D)} + m${an(B, Cn)}. Then m${an(A, D)} = 2(${mon}°) − ${b}° = ${a + b + c}°.`, { visual: vis });
      return E.num(`${pre} m${an(A, B)} : m${an(B, Cn)} : m${an(Cn, D)} = ${rr.join(' : ')}, and m${an(Mn, N)} = ${mon}°. Find m${an(A, D)}.`, [{ label: `m${an(A, D)} =`, ans: a + b + c }],
        `Write the angles as ${rr.map(kk).join(', ')}. Then m${an(Mn, N)} = ${kk(rr[0] / 2)} + ${kk(rr[1])} + ${kk(rr[2] / 2)} = ${kk(rr[0] / 2 + rr[1] + rr[2] / 2)} = ${mon}°, so k = ${k} and m${an(A, D)} = ${kk(rr[0] + rr[1] + rr[2])} = ${a + b + c}°.`, { visual: vis }); } },
  });

  /* ================= V.2.03 Angle pair theorems ================= */
  const pickGap = R => { let g; do g = R.int(35, 145); while (Math.abs(g - 90) < 12); return g; };
  const circ = 'that is the theorem being proved, so using it here is circular';
  const vaProof = R => { const g = pickGap(R), [a, b] = R.shuffle(R.pick([[1, 3], [2, 4]])), m = R.pick(a % 2 ? [2, 4] : [1, 3]), A = `∠${a}`, B = `∠${b}`, Mm = `∠${m}`;
    return { prove: `${A} ≅ ${B}`, vis: cross(R, { gap: g, nums: true }), lines: [
      [`${A} and ${B} are vertical angles`, RS.G],
      [`m${A} + m${Mm} = 180°`, RS.LP, [], wLP(A, Mm)],
      [`m${Mm} + m${B} = 180°`, RS.LP, [], wLP(Mm, B)],
      [`m${A} + m${Mm} = m${Mm} + m${B}`, RS.SUB, [1, 2], [[RS.SUBT, `nothing is subtracted yet; both sums equal 180°, so they equal each other`], [RS.VA, circ], [RS.DS, `this step sets two sums equal; it does not say any angles add to 180°`]]],
      [`m${A} = m${B}`, RS.SUBT, [3], [[RS.VA, circ], [RS.LP, `no linear pair is used here; m${Mm} is taken away from both sides`], [RS.SUB, `nothing is replaced; m${Mm} is subtracted from both sides`]]],
      [`${A} ≅ ${B}`, RS.DCA, [4], [[RS.VA, circ], [RS.CS, `no supplements are compared in this step; equal measures mean congruent angles`], [RS.SUBT, `the subtraction was done in the step before; this step turns equal measures into congruent angles`]]]],
      bad: [[1, `m${A} + m${B} = 180°`, `${A} and ${B} are opposite each other, not side by side, so they do not form a linear pair; ${A} and ${Mm} do`]] }; };
  // congruent supplements / complements of the same angle (abstract)
  const csProof = (R, T) => { const nums = R.sample([1, 2, 3, 4, 5, 6, 7, 8], 3), [a, b, c] = nums.map(k => `∠${k}`), sup = T === 180, word = sup ? 'supplementary' : 'complementary', D = sup ? RS.DS : RS.DC, TH = sup ? RS.CS : RS.CC;
    const wD = [[sup ? RS.LP : RS.AAP, sup ? 'nothing says the angles form a linear pair; they are given as supplementary' : 'no angle is split into parts here; the angles are given as complementary'], [sup ? RS.DC : RS.DS, sup ? 'complementary angles add to 90°, not 180°' : 'supplementary angles add to 180°, not 90°'], [RS.VA, 'no vertical angles appear in this proof']];
    return { prove: `${a} ≅ ${c}`, lines: [[`${a} and ${b} are ${word}`, RS.G], [`${c} and ${b} are ${word}`, RS.G],
      [`m${a} + m${b} = ${T}°`, D, [0], wD], [`m${c} + m${b} = ${T}°`, D, [1], wD],
      [`m${a} + m${b} = m${c} + m${b}`, RS.SUB, [2, 3], [[RS.SUBT, 'nothing is subtracted yet; both sums equal the same number, so they equal each other'], [TH, circ], [RS.DCA, 'no angles are being called congruent in this step']]],
      [`m${a} = m${c}`, RS.SUBT, [4], [[TH, circ], [RS.SUB, `nothing is replaced; m${b} is subtracted from both sides`], [RS.VA, 'no vertical angles appear in this proof']]],
      [`${a} ≅ ${c}`, RS.DCA, [5], [[TH, circ], [RS.VA, `${a} and ${c} are not vertical angles; their measures were just shown equal`], [RS.SUBT, 'the subtraction was the step before; equal measures make congruent angles']]]],
      bad: [[4, `m${a} + m${c} = ${T}°`, `${a} and ${c} were never shown ${word}; the two sums each equal ${T}°, so m${a} + m${b} = m${c} + m${b}`]] }; };
  // figure: two right angles ∠ABC and ∠DBE that overlap in ∠DBC
  const overlap = (R, p, labs) => { const [A, Bv, D, Cn, Ee] = K.lets(R, 5); return { L: [A, Bv, D, Cn, Ee], vis: fan(R, Bv, [[A, 0], [D, p], [Cn, 90], [Ee, 90 + p]], labs ? labs([A, Bv, D, Cn, Ee]) : [], { w: 260 }) }; };
  const TFSUP = (a, b, c) => ({ T: [[`If ${a} and ${b} are each supplementary to ${c}, then ${a} ≅ ${b}.`, 'Both equal 180° minus the same angle (congruent supplements theorem).'],
      [`If ${a} ≅ ${b} and ${c} is supplementary to ${a}, then ${c} is supplementary to ${b}.`, `${b} has the same measure as ${a}, so it adds with ${c} to 180° too.`],
      [`If ${a} and ${b} are supplementary and ${a} ≅ ${b}, then each is a right angle.`, 'Two equal angles that add to 180° are 90° each.']],
    F: [[`If ${a} and ${b} are each supplementary to ${c}, then ${a} and ${b} are supplementary.`, `They are congruent, not supplementary: with ${c} = 50°, both are 130°.`],
      [`If ${a} and ${b} are supplementary, then ${a} ≅ ${b}.`, 'Supplementary angles can differ, like 70° and 110°.'],
      [`Two supplementary angles must form a linear pair.`, 'Supplementary angles only need to add to 180°; they can be far apart.']] });
  const TFCOMP = (a, b, c) => ({ T: [[`If ${a} and ${b} are each complementary to ${c}, then ${a} ≅ ${b}.`, 'Both equal 90° minus the same angle (congruent complements theorem).'],
      [`If ${a} ≅ ${b} and ${c} is complementary to ${a}, then ${c} is complementary to ${b}.`, `${b} has the same measure as ${a}, so it adds with ${c} to 90° too.`],
      [`If ${a} and ${b} are complementary, then both are acute.`, 'Two positive angles that add to 90° are each less than 90°.']],
    F: [[`If ${a} and ${b} are each complementary to ${c}, then ${a} and ${b} are complementary.`, `They are congruent, not complementary: with ${c} = 30°, both are 60°.`],
      [`If ${a} and ${b} are complementary, then ${a} ≅ ${b}.`, 'Complementary angles can differ, like 20° and 70°.'],
      [`Two complementary angles must share a side.`, 'Complementary angles only need to add to 90°; they can be apart.']] });
  const pairNum = (R, T) => { const sup = T === 180, word = sup ? 'supplementary' : 'complementary'; let v; do v = sup ? R.int(30, 150) : R.int(15, 75); while (Math.abs(v - T / 2) < 6);
    const x = R.int(4, 20), [a1, b1] = expr(R, v, x, [1, 2, 3, 4, 5], 50), [a2, b2] = exprNot(R, v, x, a1, [2, 3, 4, 5, 6], 50), [p, q, r] = R.sample([1, 2, 3, 4, 5, 6, 7, 8], 3), askX = R.bool(0.35);
    const pre = `∠${p} and ∠${q} are both ${word} to ∠${r}. m∠${p} = ${angLab(a1, b1)} and m∠${q} = ${angLab(a2, b2)}.`, base = `Angles ${word} to the same angle are congruent, so ${solveTxt(a1, b1, a2, b2, x)}`;
    if (askX) return E.num(`${pre} Find x.`, [{ label: 'x =', ans: x }], `${base}.`);
    return E.num(`${pre} Find m∠${r}.`, [{ label: `m∠${r} =`, ans: T - v }], `${base}. So m∠${p} = ${evalTxt(a1, b1, x, v)}° and m∠${r} = ${T}° − ${v}° = ${T - v}°.`); };
  const pairChoice = (R, T) => { const word = T === 180 ? 'supplementary' : 'complementary', other = T === 180 ? 'complementary' : 'supplementary', [p, q, r, s] = R.sample([1, 2, 3, 4, 5, 6, 7, 8], 4).map(k => `∠${k}`);
    if (R.bool()) return E.choice(R, `${p} and ${q} are ${word}, and ${r} and ${q} are ${word}. Which must be true?`, `${p} ≅ ${r}`, [`${p} and ${r} are ${word}`, `${p} ≅ ${q}`, `${p} and ${r} are ${other}`],
      `${p} and ${r} are both ${T}° minus m${q}, so ${p} ≅ ${r} (congruent ${T === 180 ? 'supplements' : 'complements'} theorem).`);
    return E.choice(R, `${p} and ${q} are ${word}, ${r} and ${s} are ${word}, and ${q} ≅ ${s}. Which must be true?`, `${p} ≅ ${r}`, [`${p} ≅ ${q}`, `${p} and ${r} are ${word}`, `${r} ≅ ${s}`],
      `${p} = ${T}° − m${q} and ${r} = ${T}° − m${s}. Since m${q} = m${s}, ${p} ≅ ${r}: angles ${word} to congruent angles are congruent.`); };
  const tfPair = (R, set) => { const L = R.pick([['∠A', '∠B', '∠C'], ['∠P', '∠Q', '∠R'], ['∠1', '∠2', '∠3'], ['∠X', '∠Y', '∠Z']]), S0 = set(...L), t = R.bool(), [st, why] = R.pick(t ? S0.T : S0.F);
    return E.tf(`True or false? ${st}`, t, why); };
  S('V.2.03', 'Angle pair theorems', {
    a: { t: 'vertical angles theorem proof', g: R => {
      if (R.bool(0.3)) { const g = pickGap(R), k = R.int(1, 4), j = R.pick([1, 2, 3, 4].filter(z => z !== k)), v = cmeas(g, k), ans = cmeas(g, j), vert = Math.abs(j - k) === 2;
        return E.num(`Two lines cross. Find m∠${j}.`, [{ label: `m∠${j} =`, ans }], vert ? `∠${j} is opposite the ${v}° angle across the crossing, so they are vertical angles and congruent: ${ans}°.` : `∠${j} sits beside the ${v}° angle on a line, a linear pair, so it is 180° − ${v}° = ${ans}°. Side-by-side angles are supplementary, not equal.`,
          { visual: cross(R, { gap: g, nums: [1, 2, 3, 4].filter(z => z !== k), arcs: { [k]: deg(v) } }) }); }
      return proofQ(R, vaProof(R), mode3(R)); } },
    b: { t: 'congruent supplements', g: R => { const t = R.int(1, 10);
      if (t <= 3) return pairNum(R, 180); if (t <= 5) return pairChoice(R, 180); if (t <= 8) return proofQ(R, csProof(R, 180), R.pick(['order', 'order', 'reason', 'broken'])); return tfPair(R, TFSUP); } },
    c: { t: 'congruent complements', g: R => { const t = R.int(1, 12);
      if (t <= 3) { let p; do p = R.int(18, 72); while (Math.abs(p - 45) < 6); const askMid = R.bool(0.35);
        const { L, vis } = overlap(R, p, ([A, Bv, D, Cn, Ee]) => askMid ? [[A, D, deg(p)], [D, Cn, '?']] : [[A, D, deg(p)], [Cn, Ee, '?']]), [A, Bv, D, Cn, Ee] = L;
        if (askMid) return E.num(`∠${A}${Bv}${Cn} and ∠${D}${Bv}${Ee} are right angles. Find m∠${D}${Bv}${Cn}.`, [{ label: `m∠${D}${Bv}${Cn} =`, ans: 90 - p }], `∠${A}${Bv}${D} and ∠${D}${Bv}${Cn} make up the right angle ∠${A}${Bv}${Cn}, so m∠${D}${Bv}${Cn} = 90° − ${p}° = ${90 - p}°.`, { visual: vis });
        return E.num(`∠${A}${Bv}${Cn} and ∠${D}${Bv}${Ee} are right angles. Find m∠${Cn}${Bv}${Ee}.`, [{ label: `m∠${Cn}${Bv}${Ee} =`, ans: p }], `∠${A}${Bv}${D} and ∠${Cn}${Bv}${Ee} are both complementary to ∠${D}${Bv}${Cn}, so they are congruent: ${p}°.`, { visual: vis }); }
      if (t <= 6) return pairNum(R, 90); if (t <= 7) return pairChoice(R, 90); if (t <= 10) return proofQ(R, csProof(R, 90), R.pick(['order', 'order', 'reason', 'broken'])); return tfPair(R, TFCOMP); } },
    d: { t: 'use them in proofs', g: R => { const kind = R.int(0, 2), th = pickTh(R), [n0, n1] = R.pick(NAMES2);
      let pf;
      if (kind === 0) pf = { prove: '∠4 ≅ ∠5', vis: trans(R, { th, nums: true, names: [n0, n1] }), lines: [
        ['∠3 and ∠5 are supplementary', RS.G],
        ['∠1 and ∠3 are supplementary', RS.LP, [], wLP('∠1', '∠3')],
        ['∠1 ≅ ∠5', RS.CS, [0, 1], [[RS.CA, `the lines are not given parallel, so the corresponding angles postulate cannot be used`], [RS.VA, '∠1 and ∠5 are at different crossings, so they are not vertical angles'], [RS.CC, 'the angles are supplementary (180°), not complementary (90°)']]],
        ['∠1 ≅ ∠4', RS.VA, [], wVA('∠1', '∠4')],
        ['∠4 ≅ ∠5', RS.TR, [2, 3], [[RS.AI, 'the lines are not given parallel, so the alternate interior angles theorem cannot be used'], [RS.VA, '∠4 and ∠5 are at different crossings'], [RS.CS, 'this step chains two congruences, ∠4 ≅ ∠1 and ∠1 ≅ ∠5']]]],
        bad: [[3, '∠1 ≅ ∠2', '∠1 and ∠2 sit side by side, a linear pair, so they are supplementary, not vertical; ∠1 and ∠4 are vertical']] };
      else if (kind === 1) pf = { prove: '∠3 ≅ ∠7', vis: trans(R, { th, nums: true, names: [n0, n1] }), lines: [
        ['∠1 ≅ ∠5', RS.G],
        ['∠1 and ∠3 are supplementary', RS.LP, [], wLP('∠1', '∠3')],
        ['∠5 and ∠7 are supplementary', RS.LP, [], wLP('∠5', '∠7')],
        ['∠3 ≅ ∠7', RS.CS, [0, 1, 2], [[RS.CA, 'the lines are not given parallel, so the corresponding angles postulate cannot be used'], [RS.VA, '∠3 and ∠7 are at different crossings'], [RS.CC, 'the angles are supplementary (180°), not complementary (90°)']]]],
        bad: [[2, '∠5 and ∠8 are supplementary', '∠5 and ∠8 are opposite each other (vertical), so they are congruent, not a linear pair; ∠5 and ∠7 are the linear pair']] };
      else { const p = R.int(22, 68), { L, vis } = overlap(R, p), [A, Bv, D, Cn, Ee] = L, an = (x, y) => `∠${x}${Bv}${y}`;
        pf = { prove: `${an(A, D)} ≅ ${an(Cn, Ee)}`, vis, lines: [
          [`${an(A, Cn)} and ${an(D, Ee)} are right angles`, RS.G],
          [`m${an(A, Cn)} = 90° and m${an(D, Ee)} = 90°`, RS.DRA, [0], [[RS.ARC, 'that compares two right angles; this step gives each one its measure'], [RS.DC, 'no complementary angles are known yet'], [RS.AAP, 'nothing is split into parts here']]],
          [`m${an(A, D)} + m${an(D, Cn)} = m${an(A, Cn)}`, RS.AAP, [], [[RS.LP, 'the two angles fill a right angle, not a straight line'], [RS.DC, 'this step splits an angle into parts; it does not use the 90° yet'], [RS.VA, 'no vertical angles appear here']]],
          [`m${an(D, Cn)} + m${an(Cn, Ee)} = m${an(D, Ee)}`, RS.AAP, [], [[RS.LP, 'the two angles fill a right angle, not a straight line'], [RS.DC, 'this step splits an angle into parts; it does not use the 90° yet'], [RS.VA, 'no vertical angles appear here']]],
          [`${an(A, D)} and ${an(D, Cn)} are complementary`, RS.DC, [1, 2], [[RS.DS, 'the angles add to 90°, not 180°'], [RS.LP, 'they fill a right angle, not a straight line'], [RS.CC, 'that theorem gives congruent angles, not a sum']]],
          [`${an(Cn, Ee)} and ${an(D, Cn)} are complementary`, RS.DC, [1, 3], [[RS.DS, 'the angles add to 90°, not 180°'], [RS.LP, 'they fill a right angle, not a straight line'], [RS.CC, 'that theorem gives congruent angles, not a sum']]],
          [`${an(A, D)} ≅ ${an(Cn, Ee)}`, RS.CC, [4, 5], [[RS.CS, 'the angles are complementary (90°), not supplementary (180°)'], [RS.VA, `${an(A, D)} and ${an(Cn, Ee)} are not opposite each other across a crossing`], [RS.ARC, 'these angles are not right angles']]]] }; }
      return proofQ(R, pf, mode3(R, [2, 2, 2])); } },
  });

  /* ================= V.2.04 Parallel line theorems ================= */
  const pairFrom = (R, types) => { const ty = R.pick(types), pr = R.pick(PAIRS[ty]); return { ty, k1: pr[0], k2: pr[1] }; };
  // the alternate-interior proof, through a corresponding pair and a vertical pair
  const ALT = [{ p: [3, 6], c: [2, 6], v: [2, 3], ty: 'altInt', bv: [2, 4] }, { p: [3, 6], c: [3, 7], v: [7, 6], ty: 'altInt', bv: [7, 8] }, { p: [4, 5], c: [1, 5], v: [1, 4], ty: 'altInt', bv: [1, 3] },
    { p: [4, 5], c: [4, 8], v: [8, 5], ty: 'altInt', bv: [8, 7] }, { p: [1, 8], c: [1, 5], v: [5, 8], ty: 'altExt', bv: [5, 6] }, { p: [2, 7], c: [2, 6], v: [6, 7], ty: 'altExt', bv: [6, 5] }];
  const altCfg = R => { const c = R.pick(ALT), th = pickTh(R), [n0, n1] = R.pick(NAMES2), [p0, p1] = c.p.map(k => `∠${k}`), [c0, c1] = c.c.map(k => `∠${k}`), [v0, v1] = c.v.map(k => `∠${k}`), TH = c.ty === 'altInt' ? RS.AI : RS.AE;
    return { prove: `${p0} ≅ ${p1}`, vis: trans(R, { th, nums: true, par: [0, 1], names: [n0, n1] }), lines: [
      [`${n0} ∥ ${n1}`, RS.G], [`${c0} ≅ ${c1}`, RS.CA, [0], wCA(c0, c1)], [`${v0} ≅ ${v1}`, RS.VA, [], wVA(v0, v1)],
      [`${p0} ≅ ${p1}`, RS.TR, [1, 2], [[TH, circ], [RS.VA, `${p0} and ${p1} are at different crossings, so they are not vertical angles`], [RS.CA, `${p0} and ${p1} are not in matching positions, so they are not corresponding angles`]]]],
      bad: [[2, `∠${c.bv[0]} ≅ ∠${c.bv[1]}`, `∠${c.bv[0]} and ∠${c.bv[1]} sit side by side, a linear pair, so they are supplementary, not vertical angles`]] }; };
  const SS = [{ p: [3, 5], c: [1, 5], lp: [1, 3], s: [5, 3] }, { p: [4, 6], c: [2, 6], lp: [2, 4], s: [6, 4] }, { p: [3, 5], c: [3, 7], lp: [5, 7], s: [5, 3] }, { p: [4, 6], c: [4, 8], lp: [6, 8], s: [6, 4] }];
  const ssCfg = R => { const c = R.pick(SS), th = pickTh(R), [n0, n1] = R.pick(NAMES2), A = k => `∠${k}`, [p0, p1] = c.p.map(A), [c0, c1] = c.c.map(A), [l0, l1] = c.lp.map(A), [s0, s1] = c.s.map(A);
    return { prove: `${p0} and ${p1} are supplementary`, vis: trans(R, { th, nums: true, par: [0, 1], names: [n0, n1] }), lines: [
      [`${n0} ∥ ${n1}`, RS.G], [`${c0} ≅ ${c1}`, RS.CA, [0], wCA(c0, c1)], [`m${l0} + m${l1} = 180°`, RS.LP, [], wLP(l0, l1)],
      [`m${s0} + m${s1} = 180°`, RS.SUB, [1, 2], [[RS.LP, `${s0} and ${s1} are at different crossings, so they are not a linear pair`], [RS.SSI, circ], [RS.SUBT, 'nothing is subtracted; one angle replaces its congruent partner in the sum']]],
      [`${p0} and ${p1} are supplementary`, RS.DS, [3], [[RS.LP, `${p0} and ${p1} are at different crossings, so they are not a linear pair`], [RS.DC, 'complementary angles add to 90°, not 180°'], [RS.CS, 'that theorem gives congruent angles, not a sum of 180°']]]] }; };
  const parNum = (R, ty, k1, k2) => { const th = pickTh(R), [n0, n1] = R.pick(NAMES2), v = tmeas(th, [0, 0], k1), ans = tmeas(th, [0, 0], k2), useX = R.bool();
    return E.num(`${n0} ∥ ${n1}. Find ${useX ? 'x' : 'the angle marked ?'}.`, [{ label: useX ? 'x =' : '? =', ans }], EQUAL[ty] ? `The angles are ${RELN[ty]}, and parallel lines make them congruent: ${ans}°.` : `The angles are ${RELN[ty]}, and parallel lines make them supplementary: 180° − ${v}° = ${ans}°.`,
      { visual: trans(R, { th, arcs: { [k1]: deg(v), [k2]: useX ? 'x°' : '?' }, par: [0, 1], names: [n0, n1] }) }); };
  // ℓ, m with a bent path between them (P between) or a point outside them
  const lineEnds = (P, ys, x0, x1) => { ys.forEach(([nm, y]) => { P['_' + nm + '1'] = [x0, y]; P['_' + nm + '2'] = [x1, y]; P['_' + nm + 'n'] = [x1 + 0.4, y]; }); };
  S('V.2.04', 'Parallel line theorems', {
    a: { t: 'corresponding angles postulate', g: R => { const kind = R.pick([0, 1, 1, 2]);
      if (kind === 0) { const th = pickTh(R), [n0, n1] = R.pick(NAMES2), k = R.int(1, 8), top = k <= 4, j = (k - 1) % 4, base = top ? 0 : 4, oth = top ? 4 : 0, ans = oth + j + 1;
        const vert = base + (3 - j) + 1, lin = base + [1, 0, 3, 2][j] + 1, alt = oth + [3, 2, 1, 0][j] + 1, ss = oth + [2, 3, 0, 1][j] + 1;
        return E.choice(R, `${n0} ∥ ${n1}. Which angle corresponds to ∠${k}?`, `∠${ans}`, R.sample([vert, lin, alt, ss].map(z => `∠${z}`), 3),
          `Corresponding angles sit in the same position at each crossing: on the same side of the transversal and the same side of their line. So ∠${k} corresponds to ∠${ans}.`,
          { visual: trans(R, { th, nums: true, par: [0, 1], names: [n0, n1] }) }); }
      const { k1, k2 } = pairFrom(R, ['corr']), [a, b] = R.shuffle([k1, k2]);
      if (kind === 1) return parNum(R, 'corr', a, b);
      const th = pickTh(R), [n0, n1] = R.pick(NAMES2), j = (b - 1) % 4, nb = (b <= 4 ? 0 : 4) + [1, 0, 3, 2][j] + 1, v = tmeas(th, [0, 0], a), ans = 180 - v;
      return E.num(`${n0} ∥ ${n1}. Find x.`, [{ label: 'x =', ans }], `The angle corresponding to the ${v}° angle is also ${v}°, and it forms a linear pair with x°, so x = 180 − ${v} = ${ans}.`,
        { visual: trans(R, { th, arcs: { [a]: deg(v), [nb]: 'x°' }, par: [0, 1], names: [n0, n1] }) }); } },
    b: { t: 'prove alternate interior', g: R => { if (R.bool(0.2)) { const { ty, k1, k2 } = pairFrom(R, ['altInt', 'altInt', 'altExt']); return parNum(R, ty, ...R.shuffle([k1, k2])); } return proofQ(R, altCfg(R), mode3(R)); } },
    c: { t: 'prove same-side interior', g: R => { if (R.bool(0.2)) { const { ty, k1, k2 } = pairFrom(R, ['ssInt', 'ssInt', 'ssExt']); return parNum(R, ty, ...R.shuffle([k1, k2])); } return proofQ(R, ssCfg(R), mode3(R)); } },
    d: { t: 'solve for x', g: R => { const { ty, k1, k2 } = pairFrom(R, ['corr', 'altInt', 'altExt', 'ssInt', 'ssExt', 'corr', 'altInt', 'ssInt']), th = pickTh(R), [n0, n1] = R.pick(NAMES2);
      const m1 = tmeas(th, [0, 0], k1), m2 = tmeas(th, [0, 0], k2), x = R.int(4, 25), eq = EQUAL[ty], [a1, b1] = expr(R, m1, x, [1, 2, 3, 4, 5], 70);
      const [a2, b2] = R.bool(0.25) ? [0, m2] : eq ? exprNot(R, m2, x, a1, [1, 2, 3, 4, 5, 6], 70) : expr(R, m2, x, [1, 2, 3, 4, 5], 70), askA = R.bool(0.35);
      const base = eq ? `The angles are ${RELN[ty]}, so they are congruent: ${solveTxt(a1, b1, a2, b2, x)}` : `The angles are ${RELN[ty]}, so they are supplementary: ${sumTxt(a1, b1, a2, b2, 180, x)}`;
      const vis = trans(R, { th, arcs: { [k1]: angLab(a1, b1), [k2]: angLab(a2, b2) }, par: [0, 1], names: [n0, n1] });
      if (!askA) return E.num(`${n0} ∥ ${n1}. Find x.`, [{ label: 'x =', ans: x }], `${base}.`, { visual: vis });
      return E.num(`${n0} ∥ ${n1}. Find the measure of the angle marked ${angLab(a1, b1)}.`, [{ label: 'angle =', ans: m1 }], `${base}. The angle is ${evalTxt(a1, b1, x, m1)}°.`, { visual: vis }); } },
    e: { t: 'draw your own parallel', g: R => { const [Ln, Mn] = R.pick(NAMES2), [A, B, P] = K.lets(R, 3);
      if (R.bool()) { let a, b; do { a = R.int(20, 70); b = R.int(20, 70); } while (a + b < 60 || a + b > 140 || a === b);
        const d1 = R.int(25, 34) / 10, d2 = R.int(25, 34) / 10, Ap = polar(d1, 180 - a), Bp = polar(d2, 180 + b), pts = { [A]: Ap, [B]: Bp, [P]: [0, 0] };
        lineEnds(pts, [['l', Ap[1]], ['m', Bp[1]]], Math.min(Ap[0], Bp[0]) - 1, 1.2);
        const Q = spinW(R, pts), askA = R.bool();
        const vis = K.fig({ pts: Q, segs: [['_l1', '_l2'], ['_m1', '_m2'], [A, P], [B, P]], arrows: [['_l1', '_l2', 1, 0.25], ['_m1', '_m2', 1, 0.25]],
          angles: [['_l2', A, P, askA ? 'y°' : deg(a)], ['_m2', B, P, askA ? deg(b) : 'y°'], [A, P, B, deg(a + b)]], text: [[Q._ln, Ln, LN], [Q._mn, Mn, LN]], w: 280, label: 'two parallel lines with a bent path between them' });
        return E.num(`${Ln} ∥ ${Mn}. Find y.`, [{ label: 'y =', ans: askA ? a : b }], `Draw a line through ${P} parallel to ${Ln} (and so to ${Mn}). It splits the ${a + b}° angle into two alternate interior angles, one equal to each marked angle, so y = ${a + b} − ${askA ? b : a} = ${askA ? a : b}.`, { visual: vis }); }
      let al, be; do { al = R.int(18, 45); be = R.int(al + 20, 78); } while (be - al > 50);
      const h = 2.2, H = 2.2, Pp = [0, h], Ap = [h / Math.tan(rad(al)), 0], Bp = [(h + H) / Math.tan(rad(be)), -H], pts = { [P]: Pp, [A]: Ap, [B]: Bp };
      lineEnds(pts, [['l', 0], ['m', -H]], -1.3, Math.max(Ap[0], Bp[0]) + 1.2);
      const Q = spinW(R, pts), ask = R.pick(['x', 'x', 'b']);
      const vis = K.fig({ pts: Q, segs: [['_l1', '_l2'], ['_m1', '_m2'], [P, A], [P, B]], arrows: [['_l1', '_l2', 1, 0.82], ['_m1', '_m2', 1, 0.82]],
        angles: [['_l1', A, P, deg(al)], ['_m1', B, P, ask === 'b' ? 'y°' : deg(be)], [A, P, B, ask === 'b' ? deg(be - al) : 'x°', be - al < 36 ? { out: true } : {}]], text: [[Q._ln, Ln, LN], [Q._mn, Mn, LN]], w: 290, label: 'a point outside two parallel lines' });
      if (ask === 'x') return E.num(`${Ln} ∥ ${Mn}. Find x.`, [{ label: 'x =', ans: be - al }], `Draw a line through ${P} parallel to ${Ln}. By alternate interior angles it makes ${al}° with ${P}${A} and ${be}° with ${P}${B} (on the same side), so x = ${be} − ${al} = ${be - al}.`, { visual: vis });
      return E.num(`${Ln} ∥ ${Mn}. Find y.`, [{ label: 'y =', ans: be }], `Draw a line through ${P} parallel to ${Ln}. It makes ${al}° with ${P}${A} and y° with ${P}${B} (alternate interior angles), and the ${be - al}° angle at ${P} is the difference: y − ${al} = ${be - al}, so y = ${be}.`, { visual: vis }); } },
    f: { t: 'a zigzag between parallels', g: R => { const [Ln, Mn] = R.pick(NAMES2), [A, P, Qn, B] = K.lets(R, 4);
      let t1, t2, t3; do { t1 = R.int(25, 70); t2 = R.int(25, 70); t3 = R.int(25, 70); } while (t1 + t2 > 150 || t2 + t3 > 150 || Math.abs(t1 - t3) < 6);
      const d = 1.6, ct = t => d / Math.tan(rad(t)), Ap = [0, 3 * d], Pp = [ct(t1), 2 * d], Qp = [ct(t1) - ct(t2), d], Bp = [ct(t1) - ct(t2) + ct(t3), 0], pts = { [A]: Ap, [P]: Pp, [Qn]: Qp, [B]: Bp };
      const xs = [0, Pp[0], Qp[0], Bp[0]]; lineEnds(pts, [['l', 3 * d], ['m', 0]], Math.min(...xs) - 1.3, Math.max(...xs) + 1.3);
      const S2 = spinW(R, pts), miss = R.int(0, 3), obA = R.bool(0.4) && miss !== 0, vals = [t1, t1 + t2, t2 + t3, t3], given = vals.map((v, i) => i === miss ? 'x°' : deg(i === 0 && obA ? 180 - v : v));
      const vis = K.fig({ pts: S2, segs: [['_l1', '_l2'], ['_m1', '_m2'], [A, P], [P, Qn], [Qn, B]], arrows: [['_l1', '_l2', 1, 0.9], ['_m1', '_m2', 1, 0.9]],
        angles: [[obA ? '_l1' : '_l2', A, P, given[0]], [A, P, Qn, given[1]], [P, Qn, B, given[2]], ['_m1', B, Qn, given[3]]], text: [[S2._ln, Ln, LN], [S2._mn, Mn, LN]], w: 320, label: 'a zigzag path between two parallel lines' });
      const nm = [`at ${A}`, `at ${P}`, `at ${Qn}`, `at ${B}`], [a, p, q, b] = vals, ans = vals[miss];
      const rule = `Draw a parallel through ${P} and through ${Qn}. Each bend splits into two alternate interior angles, which shows that the angles pointing one way add up to the angles pointing the other way: (angle at ${A}) + (angle at ${Qn}) = (angle at ${P}) + (angle at ${B})`;
      const fix = obA ? ` The ${180 - a}° angle at ${A} is on the far side, so the angle we need there is 180° − ${180 - a}° = ${a}°.` : '';
      const eqn = [`x = ${p} + ${b} − ${q} = ${a}`, `${a} + ${q} = x + ${b}, so x = ${p}`, `${a} + x = ${p} + ${b}, so x = ${q}`, `${a} + ${q} = ${p} + x, so x = ${b}`][miss];
      return E.num(`${Ln} ∥ ${Mn}. Find x, the angle ${nm[miss]}.`, [{ label: 'x =', ans }], `${rule}.${fix} So ${eqn}.`, { visual: vis }); } },
  });

  /* ================= V.2.05 Proving lines parallel ================= */
  const CONV = { corr: RS.CCA, altInt: RS.CAI, altExt: RS.CAE, ssInt: RS.CSS };
  const pcfgs = [
    { g: '∠2 ≅ ∠7', v: ['∠2', '∠3'], t: '∠3 ≅ ∠7', ok: [RS.CAE], bv: '∠2 ≅ ∠4' },
    { g: '∠1 ≅ ∠8', v: ['∠1', '∠4'], t: '∠4 ≅ ∠8', ok: [RS.CAE], bv: '∠1 ≅ ∠3' },
    { g: '∠3 ≅ ∠6', v: ['∠2', '∠3'], t: '∠2 ≅ ∠6', ok: [RS.CAI], bv: '∠3 ≅ ∠4' },
    { g: '∠4 ≅ ∠5', v: ['∠1', '∠4'], t: '∠1 ≅ ∠5', ok: [RS.CAI], bv: '∠4 ≅ ∠2' },
    { g: '∠3 and ∠5 are supplementary', lp: ['∠1', '∠3'], t: '∠1 ≅ ∠5', ok: [RS.CSS] },
    { g: '∠4 and ∠6 are supplementary', lp: ['∠2', '∠4'], t: '∠2 ≅ ∠6', ok: [RS.CSS] }];
  const parProof = R => { const c = R.pick(pcfgs), th = pickTh(R), [n0, n1] = R.pick(NAMES2), concl = `${n0} ∥ ${n1}`, tp = c.t.split(' ≅ ');
    const last = [concl, RS.CCA, [2], [[RS.CA, `the corresponding angles postulate starts from parallel lines. Here the lines are what we are proving parallel, so we need its converse`], [RS.TR, 'the transitive property links congruent angles; by itself it never makes lines parallel'], [c.ok[0] === RS.CAI ? RS.CAE : RS.CAI, `${tp[0]} and ${tp[1]} are corresponding angles, so it is the converse of the corresponding angles postulate`]]];
    const second = c.v ? [`${c.v[0]} ≅ ${c.v[1]}`, RS.VA, [], wVA(c.v[0], c.v[1])] : [`${c.lp[0]} and ${c.lp[1]} are supplementary`, RS.LP, [], wLP(c.lp[0], c.lp[1])];
    const third = c.v ? [c.t, RS.TR, [0, 1], [[RS.CA, `that postulate needs parallel lines, and ${n0} ∥ ${n1} is what we are trying to prove`], [RS.VA, `${tp[0]} and ${tp[1]} are at different crossings`], [RS.LP, `${tp[0]} and ${tp[1]} are at different crossings, so they are not a linear pair`]]]
      : [c.t, RS.CS, [0, 1], [[RS.CA, `that postulate needs parallel lines, and ${n0} ∥ ${n1} is what we are trying to prove`], [RS.VA, `${tp[0]} and ${tp[1]} are at different crossings`], [RS.CC, 'the angles are supplementary, not complementary']]];
    return { prove: concl, ok: c.ok, vis: trans(R, { th, nums: true, names: [n0, n1] }), lines: [[c.g, RS.G], second, third, last], bad: c.bv ? [[1, c.bv, `${c.bv.split(' ≅ ').join(' and ')} sit side by side, a linear pair, so they are supplementary, not vertical`]] : [] }; };
  const FACTS = { vert: [['∠1', '∠4'], ['∠2', '∠3'], ['∠5', '∠8'], ['∠6', '∠7']], lin: [['∠1', '∠2'], ['∠3', '∠4'], ['∠5', '∠7'], ['∠6', '∠8']], ssEq: [['∠3', '∠5'], ['∠4', '∠6']], corrSup: [['∠1', '∠5'], ['∠2', '∠6'], ['∠3', '∠7']], altSup: [['∠3', '∠6'], ['∠4', '∠5']] };
  const TFPAR = (a, b, c, d) => ({ T: [[`If ${a} ∥ ${b} and ${b} ∥ ${c}, then ${a} ∥ ${c}.`, 'Lines parallel to the same line are parallel to each other.'], [`If ${a} ∥ ${b} and ${a} ∥ ${c}, then ${b} ∥ ${c}.`, `${b} and ${c} are both parallel to ${a}, so they are parallel to each other.`],
      [`If ${a} ∥ ${b}, ${b} ∥ ${c} and ${c} ∥ ${d}, then ${a} ∥ ${d}.`, 'Parallel is transitive, so the chain carries through.'], [`If ${a} ∥ ${b} and ${b} ⟂ ${c}, then ${a} ⟂ ${c}.`, `A line perpendicular to one of two parallel lines is perpendicular to the other.`]],
    F: [[`If ${a} ∥ ${b} and ${b} ∥ ${c}, then ${a} ⟂ ${c}.`, `${a} and ${c} are both parallel to ${b}, so ${a} ∥ ${c}; they never meet at all.`], [`If ${a} ∥ ${b} and ${c} ∥ ${d}, then ${a} ∥ ${c}.`, 'The two pairs have nothing linking them: two parallel rails can cross two other rails.'],
      [`If ${a} ⟂ ${b} and ${b} ⟂ ${c}, then ${a} ⟂ ${c}.`, `In a plane, two lines perpendicular to the same line are parallel, so ${a} ∥ ${c}.`], [`If ${a} ∥ ${b} and ${b} ∥ ${c}, then ${a} and ${c} must meet.`, `${a} ∥ ${c} by transitivity, so they never meet.`]] });
  S('V.2.05', 'Proving lines parallel', {
    a: { t: 'converses of the angle theorems', g: R => { const { ty, k1, k2 } = pairFrom(R, ['corr', 'altInt', 'altExt', 'ssInt']), th = pickTh(R), [n0, n1] = R.pick(NAMES2);
      if (R.bool(0.55)) { const yes = R.bool(), ps = yes ? 0 : R.pick([-1, 1]) * R.int(6, 14), v1 = tmeas(th, [0, ps], k1), v2 = tmeas(th, [0, ps], k2), eq = EQUAL[ty];
        const vis = trans(R, { th, psi: [0, ps], arcs: { [k1]: deg(v1), [k2]: deg(v2) }, names: [n0, n1] });
        const why = yes ? (eq ? `The marked angles are ${RELN[ty]} and both measure ${v1}°, so ${n0} ∥ ${n1} by the ${CONV[ty]}.` : `The marked angles are same-side interior angles, and ${v1}° + ${v2}° = 180°, so ${n0} ∥ ${n1} by the ${CONV[ty]}.`)
          : (eq ? `The marked angles are ${RELN[ty]}; for parallel lines they would be equal, but ${v1}° ≠ ${v2}°. So ${n0} is not parallel to ${n1}.` : `The marked angles are same-side interior angles; for parallel lines they would add to 180°, but ${v1}° + ${v2}° = ${v1 + v2}°. So ${n0} is not parallel to ${n1}.`);
        return E.tf(`Is ${n0} ∥ ${n1}?`, yes, why, { choices: ['Yes', 'No'], visual: vis }); }
      const m1 = tmeas(th, [0, 0], k1), m2 = tmeas(th, [0, 0], k2), x = R.int(4, 25), eq = EQUAL[ty], [a1, b1] = expr(R, m1, x, [1, 2, 3, 4, 5], 70), [a2, b2] = eq ? exprNot(R, m2, x, a1, [1, 2, 3, 4, 5, 6], 70) : expr(R, m2, x, [1, 2, 3, 4, 5], 70);
      return E.num(`Find x so that ${n0} ∥ ${n1}.`, [{ label: 'x =', ans: x }], `The angles are ${RELN[ty]}. The lines are parallel when they are ${eq ? 'congruent' : 'supplementary'} (${CONV[ty]}): ${eq ? solveTxt(a1, b1, a2, b2, x) : sumTxt(a1, b1, a2, b2, 180, x)}.`,
        { visual: trans(R, { th, arcs: { [k1]: angLab(a1, b1), [k2]: angLab(a2, b2) }, names: [n0, n1] }) }); } },
    b: { t: 'choose which to use', g: R => { const th = pickTh(R), [n0, n1] = R.pick(NAMES2);
      if (R.bool()) { const TYS = ['corr', 'altInt', 'altExt', 'ssInt'], i = R.int(0, 3), ty = TYS[i], [k1, k2] = R.pick(PAIRS[ty]), v1 = tmeas(th, [0, 0], k1), v2 = tmeas(th, [0, 0], k2), lab = R.bool() || ty === 'ssInt';
        const vis = trans(R, { th, arcs: lab ? { [k1]: deg(v1), [k2]: deg(v2) } : { [k1]: '', [k2]: '' }, aop: lab ? {} : { [k1]: { n: 2 }, [k2]: { n: 2 } }, names: [n0, n1] });
        return E.choiceFixed(`Which theorem proves ${n0} ∥ ${n1} from the marked angles?`, TYS.map(t => CONV[t]), i, `The marked angles are ${RELN[ty]}${EQUAL[ty] ? ' and they are congruent' : ` and they add to ${v1}° + ${v2}° = 180°`}, so the ${CONV[ty]} applies.`, { visual: vis }); }
      const ty = R.pick(['corr', 'altInt', 'altExt', 'ssInt']), [k1, k2] = R.pick(PAIRS[ty]), right = EQUAL[ty] ? `∠${k1} ≅ ∠${k2}` : `m∠${k1} + m∠${k2} = 180°`;
      const pool = [...R.sample(FACTS.vert, 1).map(([a, b]) => `${a} ≅ ${b}`), ...R.sample(FACTS.lin, 1).map(([a, b]) => `m${a} + m${b} = 180°`), ...R.sample(FACTS.ssEq, 1).map(([a, b]) => `${a} ≅ ${b}`), ...R.sample(FACTS.corrSup, 1).map(([a, b]) => `m${a} + m${b} = 180°`), ...R.sample(FACTS.altSup, 1).map(([a, b]) => `m${a} + m${b} = 180°`)];
      return E.choice(R, `Which fact alone would prove ${n0} ∥ ${n1}?`, right, R.sample(pool, 3), `∠${k1} and ∠${k2} are ${RELN[ty]}; when they are ${EQUAL[ty] ? 'congruent' : 'supplementary'} the lines are parallel (${CONV[ty]}). Vertical angles and linear pairs are congruent or supplementary for any two lines, so they prove nothing.`,
        { visual: trans(R, { th, nums: true, names: [n0, n1] }) }); } },
    c: { t: 'two-column proof', g: R => proofQ(R, parProof(R), mode3(R, [2, 2, 2])) },
    d: { t: 'transitivity of parallels', g: R => { const kind = R.pick([0, 1, 1, 2, 2]), nm = R.pick(NAMES3);
      if (kind === 0) { const L = R.pick([['a', 'b', 'c', 'd'], ['p', 'q', 'r', 's'], ['j', 'k', 'ℓ', 'm']]), set = TFPAR(...L), t = R.bool(), [st, why] = R.pick(t ? set.T : set.F); return E.tf(`All lines are in one plane. True or false? ${st}`, t, why); }
      const th = pickTh(R), j = R.int(0, 3);
      if (kind === 1) { const cs = R.pick(['all', 'ab', 'bc', 'ac', 'none']), s = () => R.pick([-1, 1]) * R.int(6, 12); let p1, p2;
        if (cs === 'all') { p1 = 0; p2 = 0; } else if (cs === 'ab') { p1 = 0; p2 = s(); } else if (cs === 'bc') { p1 = s(); p2 = p1; } else if (cs === 'ac') { p1 = s(); p2 = 0; } else { do { p1 = s(); p2 = s(); } while (p1 === p2); }
        const psi = [0, p1, p2], vals = [0, 1, 2].map(i => tmeas(th, psi, 4 * i + j + 1)), arcs = {}; vals.forEach((v, i) => arcs[4 * i + j + 1] = deg(v));
        const [a, b, c] = nm, OPT = { ab: `${a} ∥ ${b} only`, bc: `${b} ∥ ${c} only`, ac: `${a} ∥ ${c} only`, all: 'all three are parallel', none: 'no two are parallel' };
        const why = { all: `All three corresponding angles are ${vals[0]}°, so ${a} ∥ ${b} and ${b} ∥ ${c}, and then ${a} ∥ ${c} too.`, none: `The corresponding angles ${vals.join('°, ')}° are all different, so no two lines are parallel.` }[cs]
          || `The corresponding angles are ${vals.join('°, ')}°. Only ${OPT[cs].replace(' ∥ ', ' and ').replace(' only', '')} have equal corresponding angles, so only ${OPT[cs].replace(' only', '')}; the third line crosses both.`;
        return E.choice(R, 'Which lines are parallel?', OPT[cs], R.sample(Object.keys(OPT).filter(k => k !== cs).map(k => OPT[k]), 3), why, { visual: trans(R, { th, psi, arcs, names: nm }) }); }
      let j2, ty; do { j2 = R.int(2, 3); ty = relOf(j, j2); } while (!ty);
      const v = tmeas(th, [0, 0, 0], j + 1), m2 = tmeas(th, [0, 0, 0], 8 + j2 + 1), x = R.int(4, 25), [a2, b2] = expr(R, m2, x, [1, 2, 3, 4, 5], 70), [a, b, c] = nm;
      return E.num(`${a} ∥ ${b} and ${b} ∥ ${c}. Find x.`, [{ label: 'x =', ans: x }], `${a} ∥ ${c}, since both are parallel to ${b}. The marked angles are ${RELN[ty]} for ${a} and ${c}, so they are ${EQUAL[ty] ? 'congruent' : 'supplementary'}: ${EQUAL[ty] ? solveTxt(a2, b2, 0, v, x) : sumTxt(a2, b2, 0, v, 180, x)}.`,
        { visual: trans(R, { th, psi: [0, 0, 0], arcs: { [j + 1]: deg(v), [8 + j2 + 1]: angLab(a2, b2) }, names: nm }) }); } },
  });

  /* ================= V.2.06 Perpendicular lines ================= */
  const TFRIGHT = [[true, 'Perpendicular lines form four right angles.', 'One right angle forces the others: its linear pairs are 90° and so is its vertical angle.'],
    [true, 'If two angles form a linear pair and are congruent, each is a right angle.', 'Two equal angles adding to 180° are 90° each.'],
    [true, 'All right angles are congruent.', 'Every right angle measures 90°.'],
    [true, 'If two lines meet to form one right angle, the lines are perpendicular.', 'That is the definition of perpendicular lines.'],
    [false, 'Any two complementary angles together form a right angle.', 'They add to 90°, but they only form a right angle if they are adjacent; they can be far apart.'],
    [false, 'An angle of 91° is a right angle.', 'A right angle is exactly 90°; 91° is obtuse.'],
    [false, 'Two perpendicular lines can form a 60° angle.', 'Perpendicular lines make only 90° angles.'],
    [false, 'If two lines meet, the four angles are right angles.', 'Only perpendicular lines make right angles; most crossings make two acute and two obtuse angles.']];
  const perpCfg = (R, kind) => { const th = 90, [n0, n1] = R.pick(NAMES2);
    if (kind === 0) return { prove: `t ⟂ ${n1}`, vis: trans(R, { th, nums: [2, 6], right: [4], par: [0, 1], names: [n0, n1] }), lines: [
      [`${n0} ∥ ${n1}`, RS.G], [`t ⟂ ${n0}`, RS.G],
      ['∠2 is a right angle', RS.DPL, [1], [[RS.ARC, 'no two right angles are compared here'], [RS.CA, 'this step uses t ⟂ ' + n0 + ', not the parallel lines'], [RS.LP, 'a linear pair gives a sum of 180°, not a right angle']]],
      ['m∠2 = 90°', RS.DRA, [2], [[RS.LP, 'no linear pair is used here'], [RS.CA, 'this step only gives ∠2 its measure'], [RS.SUB, 'nothing is replaced; a right angle measures 90° by definition']]],
      ['∠2 ≅ ∠6', RS.CA, [0], wCA('∠2', '∠6')],
      ['m∠6 = 90°', RS.SUB, [3, 4], [[RS.DRA, '∠6 is not yet known to be a right angle; its measure comes from ∠2 ≅ ∠6'], [RS.VA, '∠2 and ∠6 are at different crossings'], [RS.LP, 'no linear pair is used here']]],
      ['∠6 is a right angle', RS.DRA, [5], [[RS.CA, 'that gave ∠2 ≅ ∠6 earlier; a 90° angle is right by definition'], [RS.VA, 'no vertical angles appear here'], [RS.ARC, 'that theorem goes the other way: it says right angles are congruent']]],
      [`t ⟂ ${n1}`, RS.DPL, [6], [[RS.CCA, 'that converse proves lines parallel, not perpendicular'], [RS.CA, `that postulate gives congruent angles, not perpendicular lines`], [RS.TR, 'the transitive property links congruences; perpendicular lines come from a right angle']]]] };
    if (kind === 1) return { prove: `${n0} ∥ ${n1}`, vis: trans(R, { th, nums: [2, 6], right: [4, 8], names: [n0, n1] }), lines: [
      [`${n0} ⟂ t`, RS.G], [`${n1} ⟂ t`, RS.G],
      ['∠2 is a right angle', RS.DPL, [0], [[RS.ARC, 'no two right angles are compared yet'], [RS.CA, `the lines are not known to be parallel`], [RS.LP, 'a linear pair gives a sum of 180°, not a right angle']]],
      ['∠6 is a right angle', RS.DPL, [1], [[RS.ARC, 'no two right angles are compared yet'], [RS.CA, `the lines are not known to be parallel, so corresponding angles cannot be used`], [RS.VA, '∠2 and ∠6 are at different crossings']]],
      ['∠2 ≅ ∠6', RS.ARC, [2, 3], [[RS.CA, `that postulate needs ${n0} ∥ ${n1}, which is what we are proving`], [RS.VA, '∠2 and ∠6 are at different crossings'], [RS.DPL, 'perpendicular lines give right angles; it is a theorem that right angles are congruent']]],
      [`${n0} ∥ ${n1}`, RS.CCA, [4], [[RS.CA, 'the postulate starts from parallel lines; to prove lines parallel you need its converse'], [RS.DPL, 'the lines are parallel, not perpendicular'], [RS.CAI, '∠2 and ∠6 are corresponding angles, not alternate interior angles']]]] };
    if (kind === 2) return { prove: `${n0} ⟂ t`, vis: cross(R, { gap: 90, nums: [1, 2], names: [n0, 't'] }), note: '∠1 and ∠2 form a linear pair.', lines: [
      ['∠1 ≅ ∠2', RS.G],
      ['m∠1 + m∠2 = 180°', RS.LP, [], wLP('∠1', '∠2')],
      ['2 · m∠1 = 180°', RS.SUB, [0, 1], [[RS.DIV, 'nothing is divided yet; m∠1 replaces m∠2 because they are equal'], [RS.VA, '∠1 and ∠2 are side by side, not vertical'], [RS.DRA, '∠1 is not yet known to be a right angle']]],
      ['m∠1 = 90°', RS.DIV, [2], [[RS.SUB, 'nothing is replaced; both sides are divided by 2'], [RS.DRA, 'the right angle comes from the 90°, in the next step'], [RS.SUBT, 'the 2 is a factor, so you divide, not subtract']]],
      ['∠1 is a right angle', RS.DRA, [3], [[RS.DPL, `${n0} ⟂ t is not known yet; it is what we are proving`], [RS.LP, 'a linear pair gives a sum of 180°, not a right angle'], [RS.CS, 'no angles are being shown congruent here']]],
      [`${n0} ⟂ t`, RS.DPL, [4], [[RS.DRA, 'that definition is about 90° angles, not about lines; lines meeting at a right angle are perpendicular by definition'], [RS.LP, 'a linear pair does not by itself make lines perpendicular'], [RS.CCA, 'that converse proves lines parallel, not perpendicular']]]],
      bad: [[1, 'm∠1 + m∠2 = 90°', 'a linear pair adds to 180°, not 90°']] };
    return { prove: '∠2 is a right angle', vis: cross(R, { gap: 90, nums: [1, 2], right: [1], names: [n0, 't'] }), lines: [
      [`${n0} ⟂ t`, RS.G],
      ['∠1 is a right angle', RS.DPL, [0], [[RS.LP, 'a linear pair gives a sum of 180°, not a right angle'], [RS.ARC, 'no two right angles are compared here'], [RS.VA, 'no vertical pair is used here']]],
      ['m∠1 = 90°', RS.DRA, [1], [[RS.LP, 'no linear pair is used here'], [RS.SUB, 'nothing is replaced; a right angle measures 90° by definition'], [RS.VA, 'no vertical pair is used here']]],
      ['m∠1 + m∠2 = 180°', RS.LP, [], wLP('∠1', '∠2')],
      ['90° + m∠2 = 180°', RS.SUB, [2, 3], [[RS.SUBT, 'nothing is subtracted yet; 90° replaces m∠1'], [RS.DRA, '∠2 is not yet known to be a right angle'], [RS.VA, '∠1 and ∠2 are side by side, not vertical']]],
      ['m∠2 = 90°', RS.SUBT, [4], [[RS.SUB, 'nothing is replaced; 90° is subtracted from both sides'], [RS.VA, '∠1 and ∠2 are side by side, not vertical'], [RS.DIV, 'nothing is divided; 90° is subtracted from both sides']]],
      ['∠2 is a right angle', RS.DRA, [5], [[RS.DPL, 'perpendicularity was used for ∠1; ∠2 is right because it measures 90°'], [RS.VA, '∠1 and ∠2 are side by side, not vertical'], [RS.LP, 'the linear pair gave the sum; a 90° angle is right by definition']]]] }; };
  const stdForm = (a, b, c) => `${a === 1 ? '' : a}x${b < 0 ? '-' : '+'}${Math.abs(b) === 1 ? '' : Math.abs(b)}y=${c}`;
  S('V.2.06', 'Perpendicular lines', {
    a: { t: 'right angle definitions', g: R => { const kind = R.pick([0, 0, 1, 2]);
      if (kind === 1) { const t = R.bool(), [, st, why] = R.pick(TFRIGHT.filter(r => r[0] === t)); return E.tf(`True or false? ${st}`, t, why); }
      if (kind === 2) { const [n0] = R.pick(NAMES2), k = R.int(1, 4), j = R.pick([1, 2, 3, 4].filter(z => z !== k)), x = R.int(4, 25), [a, b] = expr(R, 90, x, [2, 3, 4, 5, 6], 70);
        return E.num(`${n0} ⟂ t. Find x.`, [{ label: 'x =', ans: x }], `Perpendicular lines make four right angles, so ${solveTxt(a, b, 0, 90, x)}.`, { visual: cross(R, { gap: 90, right: [k], arcs: { [j]: angLab(a, b) }, names: [n0, 't'] }) }); }
      const [A, O, B, Cn, A2, C2] = K.lets(R, 6); let p; do p = R.int(28, 62); while (Math.abs(p - 45) < 6);
      const x = R.int(3, 15), [a1, b1] = expr(R, p, x, [1, 2, 3, 4], 40), [a2, b2] = expr(R, 90 - p, x, [1, 2, 3, 4], 40), P = { [O]: [0, 0], [A]: [3, 0], [Cn]: [0, 3], [B]: polar(3, p), [A2]: [-3, 0], [C2]: [0, -3] }, Q = K.spin(R, P), askX = R.bool(0.6);
      const vis = K.fig({ pts: Q, segs: [[A2, A], [C2, Cn], [O, B]], angles: [[A, O, B, angLab(a1, b1), { max: 95 }], [B, O, Cn, angLab(a2, b2), { max: 95 }], [A2, O, C2, '', { right: true }]], w: 290, label: 'perpendicular lines with a ray between them' });
      const pre = `Lines ${A}${A2} and ${Cn}${C2} are perpendicular.`, base = `∠${A}${O}${Cn} is a right angle, so its parts add to 90°: ${sumTxt(a1, b1, a2, b2, 90, x)}`;
      if (askX) return E.num(`${pre} Find x.`, [{ label: 'x =', ans: x }], `${base}.`, { visual: vis });
      return E.num(`${pre} Find m∠${A}${O}${B}.`, [{ label: `m∠${A}${O}${B} =`, ans: p }], `${base}. So m∠${A}${O}${B} = ${evalTxt(a1, b1, x, p)}°.`, { visual: vis }); } },
    b: { t: 'perpendicular transversal theorem', g: R => { const kind = R.pick([0, 0, 1, 2, 3]), [n0, n1] = R.pick(NAMES2);
      if (kind === 3) { const T = [[`${n0} ∥ ${n1} and t ⟂ ${n0}, so t ⟂ ${n1}.`, 'A line perpendicular to one of two parallel lines is perpendicular to the other (perpendicular transversal theorem).'], [`${n0} ⟂ t and ${n1} ⟂ t, so ${n0} ∥ ${n1}.`, 'In a plane, two lines perpendicular to the same line are parallel.'], [`t ⟂ ${n0} and ${n0} ∥ ${n1}, so ${n1} ⟂ t.`, 'The perpendicular transversal theorem: t makes right angles with both parallel lines.']];
        const F = [[`${n0} ⟂ t and ${n1} ⟂ t, so ${n0} ⟂ ${n1}.`, `${n0} and ${n1} are both perpendicular to t, so they are parallel, not perpendicular.`], [`${n0} ∥ ${n1} and t ⟂ ${n0}, so t ∥ ${n1}.`, `t crosses ${n0}, so it must cross ${n1} too, at a right angle.`], [`${n0} ∥ ${n1} and t crosses both, so t ⟂ ${n1}.`, 'Only a transversal perpendicular to one of the parallel lines is perpendicular to the other; most transversals are slanted.']];
        const t = R.bool(), [st, why] = R.pick(t ? T : F); return E.tf(`All lines are in one plane. True or false? ${st}`, t, why); }
      const rk = R.pick([1, 2, 3, 4]);
      if (kind === 2) return E.choice(R, `${n0} ⟂ t and ${n1} ⟂ t. Which must be true?`, `${n0} ∥ ${n1}`, [`${n0} ⟂ ${n1}`, `t ∥ ${n1}`, `${n0} and ${n1} meet on t`], `The corresponding right angles are congruent, so ${n0} ∥ ${n1} by the converse of the corresponding angles postulate: two lines perpendicular to the same line are parallel.`,
        { visual: trans(R, { th: 90, right: [rk, 4 + R.pick([1, 2, 3, 4])], names: [n0, n1] }) });
      if (kind === 1) return E.choice(R, `${n0} ∥ ${n1} and t ⟂ ${n0}. Which must be true?`, `t ⟂ ${n1}`, [`t ∥ ${n1}`, `${n0} ⟂ ${n1}`, `t ∥ ${n0}`], `The right angle at ${n0} has a corresponding angle at ${n1}, which is also 90°. So t ⟂ ${n1} (perpendicular transversal theorem).`,
        { visual: trans(R, { th: 90, right: [rk], par: [0, 1], names: [n0, n1] }) });
      const k = R.pick([5, 6, 7, 8]), x = R.int(4, 25), [a, b] = expr(R, 90, x, [2, 3, 4, 5, 6], 70);
      return E.num(`${n0} ∥ ${n1} and t ⟂ ${n0}. Find x.`, [{ label: 'x =', ans: x }], `A line perpendicular to one of two parallel lines is perpendicular to the other, so every angle at ${n1} is 90°: ${solveTxt(a, b, 0, 90, x)}.`,
        { visual: trans(R, { th: 90, right: [rk], arcs: { [k]: angLab(a, b) }, par: [0, 1], names: [n0, n1] }) }); } },
    c: { t: 'distance from a point to a line', g: R => { const kind = R.pick([0, 1, 1, 2]);
      const gr = (fns, vl, pts) => V.graph({ x: [-10, 10], y: [-10, 10], w: 250, ticks: 2, labels: false, fns, vlines: vl, points: pts, label: 'a point and a line on a grid' });
      if (kind === 0) { const hz = R.bool(); let x0, y0, c; do { x0 = R.int(-8, 8); y0 = R.int(-8, 8); c = R.int(-8, 8); } while (Math.abs((hz ? y0 : x0) - c) < 2);
        const d = Math.abs((hz ? y0 : x0) - c), s = R.pick([3, 4, -3, -4]), other = hz ? `(${x0 + s}, ${c})` : `(${c}, ${y0 + s})`, far = Math.hypot(s, d);
        return E.num(`Find the distance from P(${x0}, ${y0}) to the line ${M(hz ? `y=${c}` : `x=${c}`)}.`, [{ label: 'distance =', ans: d }],
          `The distance runs along the perpendicular, straight ${hz ? (y0 > c ? 'down' : 'up') : (x0 > c ? 'left' : 'right')} to ${hz ? `(${x0}, ${c})` : `(${c}, ${y0})`}: |${hz ? y0 : x0} − ${pn(c)}| = ${d}. Any other point, like ${other}, is farther (${Number.isInteger(far) ? far : '≈ ' + far.toFixed(1)}).`,
          { visual: gr(hz ? [{ f: () => c, color: C.blue }] : [], hz ? [] : [{ x: c, dash: false, color: C.blue }], [[x0, y0, 'P']]) }); }
      const [a, b] = R.pick([[1, 1], [1, -1], [1, 2], [2, 1], [1, -2], [2, -1], [3, 4], [4, 3], [3, -4], [4, -3]]), n2 = a * a + b * b, big = n2 === 25;
      let F, k, P; do { F = [R.int(-5, 5), R.int(-5, 5)]; k = big ? R.pick([1, -1]) : R.pick([1, -1, 2, -2]); P = [F[0] + k * a, F[1] + k * b]; } while (Math.abs(P[0]) > 9 || Math.abs(P[1]) > 9);
      const c = a * F[0] + b * F[1], line = M(stdForm(a, b, c)), gfx = gr([{ f: x => (c - a * x) / b, color: C.blue }], [], [[P[0], P[1], 'P']]), K2 = Math.abs(k);
      if (kind === 2) return E.num(`Find the point on the line ${line} closest to P(${P[0]}, ${P[1]}).`, [{ point: [String(F[0]), String(F[1])] }],
        `The closest point is the foot of the perpendicular. The perpendicular has direction (${a}, ${b}), and P ${k > 0 ? '−' : '+'} ${K2 === 1 ? '' : K2}(${a}, ${b}) = (${F[0]}, ${F[1]}), which is on the line: ${a}(${F[0]}) ${b < 0 ? '−' : '+'} ${Math.abs(b)}(${F[1]}) = ${c}.`, { visual: gfx });
      const dist = big ? 5 * K2 : null, ex = big ? null : (K2 === 1 ? `sqrt(${n2})` : `${K2}sqrt(${n2})`);
      return E.num(`Find the exact distance from P(${P[0]}, ${P[1]}) to the line ${line}.`, [big ? { label: 'distance =', ans: dist } : { label: 'distance =', exact: ex, form: 'simplest' }],
        `Use the perpendicular: the foot is F(${F[0]}, ${F[1]}) on the line, and PF goes along (${a}, ${b}), the line's normal. PF = ${K2 === 1 ? '' : K2}√(${a}² + ${pn(b)}²) = ${big ? dist : E.pt(ex)}.`, { visual: gfx }); } },
    d: { t: 'proofs with perpendiculars', g: R => proofQ(R, perpCfg(R, R.int(0, 3)), mode3(R, [2, 2, 2])) },
  });
})(typeof window !== 'undefined' ? window : globalThis);
