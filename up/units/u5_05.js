/* Era V · Unit V.5 Similarity (V.5.01–V.5.12) */
(function (G) {
  const E = G.E5, V = E.V, C = E.C, M = s => E.mx(s), K = E.K;
  const S = (id, name, steps) => E.skill({ id, name, steps });
  const { dist, lerp, add, sub, mul, unit, polar, rad, foot, bySides, byAngles, xform, spin, lets, trio, rnF, renamePts, fig, triMarks, pairPts, pairFig, randTri } = K;

  /* ================= small helpers ================= */
  const gcd = (a, b) => b ? gcd(b, a % b) : Math.abs(a);
  const fs = (n, d) => E.fracStr(n, d);
  const cl = x => +(+x).toFixed(9);
  const ok3 = x => Math.abs(Math.round(x * 1000) - x * 1000) < 1e-6;
  const nf = x => String(+(+x).toFixed(3));                         // tidy number text
  const big = x => Number(x).toLocaleString('en-US');
  const deg = n => `${n}°`;
  const nm3 = L => ({ A: L[0], B: L[1], C: L[2] });
  const KEYS = ['BC', 'CA', 'AB'];                                    // bySides(a = BC, b = CA, c = AB)
  // math with point names: letter pairs get brackets so AD/AB is a fraction of segments
  const mm = s => M(String(s).replace(/(?<![A-Za-z])([A-Z]{2,})(?![a-z])/g, '($1)'));
  const mt = s => String(s).replace(/\{([^}]*)\}/g, (_, x) => mm(x));
  const plainMath = s => String(s).replace(/\{([^}]*)\}/g, (_, x) => x.replace(/=/g, ' = '));
  const frM = (n, d) => M(`${n}/${d}`);
  const kTxt = (n, d) => d === 1 ? String(n) : fs(n, d);
  const lin = (a, b) => `${a === 1 ? '' : a}x${b ? (b > 0 ? ' + ' + b : ' − ' + -b) : ''}`;   // 3x + 5 for labels
  const linM = (a, b) => `${a === 1 ? '' : a}x${b ? (b > 0 ? '+' + b : b) : ''}`;             // for M()
  const sortN = a => a.slice().sort((x, y) => x - y);
  const triOK = L => { const s = sortN(L); return new Set(L).size === 3 && s[0] + s[1] > s[2] * 1.18 && s[0] >= s[2] * 0.42; };
  const baseTri = (R, lo = 2, hi = 7) => { let L; do L = [R.int(lo, hi), R.int(lo, hi), R.int(lo, hi)]; while (!triOK(L)); return L; };
  const apart = (a, d) => a.every((x, i) => a.every((y, j) => i === j || Math.abs(x - y) >= d));
  const unitsOf = O => (O && O.units === 'imperial') ? 'ft' : 'm';

  // two triangles side by side, each spun its own way; m = [ticks, angle marks, labels]
  const pairOf = (R, T1, T2, m1, m2, lab) => { const L = lets(R, 6), n1 = nm3(L), n2 = nm3(L.slice(3)), P = pairPts(R, T1, T2, n1, n2);
    return { L, n1, n2, vis: pairFig(P, n1, n2, m1, m2, lab || 'two triangles') }; };
  const SIMMARK = { A: 1, B: 2 };
  // a similar pair: small sides S1 (drawn), the other scaled by k; labs keyed BC/CA/AB and A/B/C
  const simFig = (R, S1, k, labs1, labs2, marks = SIMMARK) => pairOf(R, bySides(...S1), xform(bySides(...S1), 0, false, k), [{}, marks, labs1], [{}, marks, labs2], 'two similar triangles');
  // any two figures side by side (generalizes pairPts to any point sets)
  const side2 = (R, T1, T2, map1, map2, noSpin) => {
    const a = noSpin ? T1 : spin(R, T1), b = noSpin ? T2 : spin(R, T2), bb = t => { const v = Object.values(t); return [Math.min(...v.map(p => p[0])), Math.max(...v.map(p => p[0])), Math.min(...v.map(p => p[1])), Math.max(...v.map(p => p[1]))]; };
    const [ax0, ax1, ay0, ay1] = bb(a), [bx0, bx1, by0, by1] = bb(b), gap = 0.45 * Math.max(ax1 - ax0, ay1 - ay0, bx1 - bx0, by1 - by0);
    const dx = ax1 + gap - bx0, dy = (ay0 + ay1) / 2 - (by0 + by1) / 2, P = {};
    for (const k in a) P[map1[k]] = a[k]; for (const k in b) P[map2[k]] = [b[k][0] + dx, b[k][1] + dy]; return P;
  };
  // relabel + spin + draw a figure config with canonical letters
  const prep = (R, cfg) => {
    const names = Object.keys(cfg.pts).filter(k => k[0] !== '_'), Ls = lets(R, names.length), map = {}; names.forEach((k, i) => map[k] = Ls[i]);
    const m = k => k[0] === '_' ? k : map[k], P = renamePts(cfg.noSpin ? cfg.pts : spin(R, cfg.pts), map);
    const vis = fig({ pts: P, segs: (cfg.segs || []).map(([a, b, op]) => [m(a), m(b), op && op.ref ? Object.assign({}, op, { ref: m(op.ref) }) : op]), angles: (cfg.angles || []).map(([a, v, b, l, op]) => [m(a), m(v), m(b), l, op]),
      arrows: (cfg.arrows || []).map(([a, b, n, t]) => [m(a), m(b), n, t]), text: (cfg.text || []).map(([k, s, op]) => [P[m(k)], s, op]), w: cfg.w || 280, label: cfg.label || 'figure' });
    return { rn: rnK(map), vis, map, P };
  };
  // rename point letters but keep theorem names such as AA and SAS
  const rnK = map => { const f = rnF(map); return s => { const keep = []; const t = String(s).replace(/(?<![A-Za-z])(AA|SAS|SSS|SSA|ASA|AAS|CPCTC)(?![A-Za-z])/g, w => { keep.push(w); return `\u0001${keep.length - 1}\u0002`; }); return f(t).replace(/\u0001(\d+)\u0002/g, (_, i) => keep[+i]); }; };
  // a convex quadrilateral ABCD (counterclockwise) from its angles, with AB = a and BC = b
  const quadByAngles = (an, a, b) => {
    const h = [0, 180 - an[1], 360 - an[1] - an[2], 540 - an[1] - an[2] - an[3]], A = [0, 0], B = polar(a, h[0]), Cc = add(B, polar(b, h[1]));
    const u2 = polar(1, h[2]), u3 = polar(1, h[3]), det = u2[0] * u3[1] - u2[1] * u3[0];
    const c = (-Cc[0] * u3[1] + Cc[1] * u3[0]) / det, d = (-u2[0] * Cc[1] + u2[1] * Cc[0]) / det;
    return { A, B, C: Cc, D: add(Cc, mul(u2, c)), c, d };
  };
  const quadArea = q => { const P = [q.A, q.B, q.C, q.D]; return Math.abs(P.reduce((z, p, i) => z + p[0] * P[(i + 1) % 4][1] - P[(i + 1) % 4][0] * p[1], 0)) / 2; };
  const randQuad = R => { let an, q, a, b;
    do { an = [R.int(13, 25) * 5, R.int(13, 25) * 5, R.int(13, 25) * 5]; an.push(360 - an[0] - an[1] - an[2]); a = R.int(35, 60) / 10; b = R.int(35, 60) / 10;
      q = an[3] >= 65 && an[3] <= 125 && apart(an, 10) ? quadByAngles(an, a, b) : null; }
    while (!q || Math.min(a, b, q.c, q.d) < 0.62 * Math.max(a, b, q.c, q.d) || quadArea(q) < 0.052 * (a + b + q.c + q.d) ** 2);
    return { an, pts: { A: q.A, B: q.B, C: q.C, D: q.D } }; };
  const QK = ['A', 'B', 'C', 'D'];
  const quadSegs = (n, labs = {}) => [[0, 1], [1, 2], [2, 3], [3, 0]].map(([i, j]) => [n[QK[i]], n[QK[j]], { lab: labs[QK[i] + QK[j]] }]);
  const quadAngs = (n, labs = {}, right = {}) => QK.map((k, i) => (labs[k] || right[k]) ? [n[QK[(i + 3) % 4]], n[k], n[QK[(i + 1) % 4]], labs[k] || '', right[k] ? { right: true } : { max: 30 }] : null).filter(Boolean);

  /* ================= proofs: configs with canonical letters ================= */
  const WHY = {
    'corresponding angles': 'parallel lines make congruent corresponding angles', 'alternate interior angles': 'parallel lines make congruent alternate interior angles',
    'vertical angles': 'vertical angles are congruent', 'reflexive property': 'the two triangles share this angle, and every angle is congruent to itself',
    'all right angles are congruent': 'perpendicular lines make right angles, and all right angles are congruent', 'AA similarity': 'two pairs of angles are congruent',
    'SAS similarity': 'two pairs of sides are in the same ratio and the angles between them are congruent', 'SSS similarity': 'all three pairs of sides are in the same ratio',
    'corresponding sides of similar triangles are proportional': 'the triangles are already proved similar, so matching sides are in the same ratio',
    'corresponding angles of similar triangles are congruent': 'the triangles are already proved similar, so matching angles are congruent',
    'converse of corresponding angles': 'congruent corresponding angles make the lines parallel', 'converse of alternate interior angles': 'congruent alternate interior angles make the lines parallel',
    'midsegment theorem': 'a segment joining the midpoints of two sides is half as long as the third side', 'parallel postulate': 'through a point not on a line there is exactly one line parallel to it',
    'converse of the isosceles triangle theorem': 'sides opposite congruent angles are congruent', 'triangle proportionality theorem': 'a line parallel to one side of a triangle splits the other two sides proportionally',
    'substitution': 'equal quantities can replace each other', 'definition of angle bisector': 'a bisector splits an angle into two congruent angles', 'division': 'it divides the given lengths',
    'segment addition': 'the two pieces make up the whole segment', 'AA similarity (a shared angle and a right angle)': 'the triangles share an acute angle and both have a right angle',
  };
  const circ = 'that is the theorem being proved, so using it is circular';
  const PW = {
    'corresponding angles': [['alternate interior angles'], ['vertical angles'], ['reflexive property']],
    'alternate interior angles': [['corresponding angles'], ['vertical angles'], ['same-side interior angles']],
    'vertical angles': [['alternate interior angles'], ['reflexive property'], ['corresponding angles']],
    'reflexive property': [['vertical angles'], ['corresponding angles'], ['definition of angle bisector']],
    'all right angles are congruent': [['vertical angles'], ['reflexive property'], ['corresponding angles']],
    'AA similarity': [['SAS similarity'], ['SSS similarity'], ['ASA congruence', 'two pairs of congruent angles prove the triangles similar (AA), not congruent; congruence would need a pair of equal sides too']],
    'SAS similarity': [['SSS similarity'], ['AA similarity'], ['SAS congruence', 'the sides are in the same ratio, not equal, so the triangles are similar by SAS similarity, not congruent']],
    'SSS similarity': [['SAS similarity'], ['AA similarity'], ['SSS congruence', 'the sides are in the same ratio, not equal, so the triangles are similar by SSS similarity, not congruent']],
    'corresponding sides of similar triangles are proportional': [['corresponding angles of similar triangles are congruent'], ['CPCTC', 'CPCTC needs congruent triangles, and these are only similar']],
    'corresponding angles of similar triangles are congruent': [['corresponding sides of similar triangles are proportional'], ['CPCTC', 'CPCTC needs congruent triangles, and these are only similar'], ['vertical angles']],
    'converse of corresponding angles': [['corresponding angles', 'that theorem starts from parallel lines; here the angles prove the lines parallel, which is its converse'], ['vertical angles']],
    'converse of alternate interior angles': [['alternate interior angles', 'that theorem starts from parallel lines; here the angles prove the lines parallel, which is its converse'], ['vertical angles']],
    'midsegment theorem': [['definition of midpoint', 'a midpoint only halves the side it lies on; the midsegment theorem compares the segment with the third side'], ['reflexive property']],
    'triangle proportionality theorem': [['angle bisector theorem', circ], ['midsegment theorem']],
    'converse of the isosceles triangle theorem': [['isosceles triangle theorem', 'that theorem goes from equal sides to equal angles; here equal angles give equal sides, which is its converse'], ['definition of angle bisector']],
    'parallel postulate': [['corresponding angles']],
    'AA similarity (a shared angle and a right angle)': [['SAS similarity'], ['SSS similarity']],
  };
  const POOL5 = ['reflexive property', 'vertical angles', 'corresponding angles', 'alternate interior angles', 'all right angles are congruent', 'AA similarity', 'SAS similarity', 'SSS similarity', 'given'];
  const SIMR = ['AA similarity', 'SAS similarity', 'SSS similarity'];
  const tbl = rows => `<table class="dt"><tr><th>#</th><th>Statement</th><th>Reason</th></tr>${rows.map((r, i) => `<tr><td>${i + 1}</td><td>${r[0]}</td><td>${r[1]}</td></tr>`).join('')}</table>`;
  const simTrue = (pts, t1, t2) => { const r = [[0, 1], [1, 2], [0, 2]].map(([i, j]) => dist(pts[t2[i]], pts[t2[j]]) / dist(pts[t1[i]], pts[t1[j]])); return Math.abs(r[0] - r[1]) < 1e-6 && Math.abs(r[1] - r[2]) < 1e-6; };
  const PERMS = [[0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
  const proofQ = (R, cfg, mode) => {
    const { rn, vis } = prep(R, cfg), L = cfg.lines.map(([st, rs, dp]) => [rn(st), rs, dp || []]), n = L.length, ng = L.filter(l => l[1] === 'given').length;
    const show = s => mt(s), head = `${cfg.note ? rn(cfg.note) + ' ' : ''}Given: ${L.slice(0, ng).map(l => show(l[0])).join('; ')}. Prove: ${show(cfg.prove ? rn(cfg.prove) : L[n - 1][0])}.`;
    const simI = L.findIndex(l => SIMR.includes(l[1]) || l[1].startsWith('AA similarity'));
    if (mode === 'order') return K.orderQ(R, `${head} Put the steps of the proof in order.`, L.map(l => `${show(l[0])} <i>(${l[1]})</i>`), L.map(l => l[2]),
      `Each step comes after the steps it uses. ${L.slice(ng).filter(l => l[2].length).slice(-2).map(l => `${plainMath(l[0])} uses ${l[2].map(d => plainMath(L[d][0]).replace(/^Draw (\w+) .*$/, 'the new line $1')).join(' and ')}`).join('; ')}.`, { fixed: ng, visual: vis });
    if (mode === 'reason') {
      const cand = L.map((l, i) => i).filter(i => i >= ng && !(cfg.noAsk || []).includes(i) && L[i][1] !== 'division' && L[i][1] !== 'substitution'), k = R.pick(cand), [st, rs] = L[k];
      const ok = x => x !== rs && !(x === 'given') && !(x.startsWith('corresponding') && x.includes('similar') && (simI < 0 || k <= simI));
      const w1 = R.shuffle((PW[rs] || []).map(x => x[0]).filter(ok)).slice(0, 3), rest = R.shuffle((cfg.pool || POOL5).filter(x => ok(x) && !w1.includes(x)));
      return E.choice(R, `${head} What is the reason for step ${k + 1}?${tbl(L.map((l, i) => [show(l[0]), i === k ? '<b>?</b>' : l[1]]))}`, rs, [...w1, ...rest].slice(0, 3),
        `Step ${k + 1}, ${plainMath(st)}, holds because ${WHY[rs]} (${rs}).`, { visual: vis });
    }
    const bads = [];
    L.forEach(([st, rs], i) => {
      if (rs === 'given' || rs === 'division' || rs === 'substitution' || (cfg.noAsk || []).includes(i)) return;
      (PW[rs] || []).forEach(([w, why]) => { if (w === 'CPCTC' || w === 'same-side interior angles') { if (!why) return; }
        bads.push({ i, rs: w, why: why ? `${plainMath(st)} cannot use the ${w}: ${why}` : `${plainMath(st)} holds because ${WHY[rs]} (${rs}); the reason “${w}” does not give it` }); });
      if (i === simI && cfg.tri) { const [t1, t2] = cfg.tri, ok = PERMS.filter(p => !simTrue(cfg.pts, t1, p.map(j => t2[j]).join(''))), p = ok.length ? R.pick(ok) : null;
        if (p) bads.push({ i, st: rn(`△${t1} ∼ △${p.map(j => t2[j]).join('')}`), why: `the letters must pair matching vertices (${[0, 1, 2].map(j => rn(t1[j]) + '↔' + rn(t2[j])).join(', ')}), so it should read ${st}` }); }
    });
    const b = R.pick(bads), rows = L.map((l, i) => i === b.i ? [show(b.st || l[0]), b.rs || l[1]] : [show(l[0]), l[1]]), all = L.map((l, i) => i).filter(i => i >= ng && i !== b.i);
    const idx = [b.i, ...R.sample(all, Math.min(5, all.length))].sort((x, y) => x - y);
    return E.choiceFixed(`${head} Exactly one step has a mistake. Which step is it?${tbl(rows)}`, idx.map(i => `Step ${i + 1}`), idx.indexOf(b.i), `Step ${b.i + 1} is wrong: ${b.why}.`, { visual: vis });
  };
  const mode3 = R => R.pick(['order', 'order', 'reason', 'broken']);
  const corrS = 'corresponding sides of similar triangles are proportional', corrA = 'corresponding angles of similar triangles are congruent';
  // nested triangle: apex A, D on AB and E on AC at the same fraction (DE ∥ BC)
  const nestPts = (R, t) => { const T = randTri(R).t, tt = t || R.int(38, 62) / 100; return { ...T, D: lerp(T.A, T.B, tt), E: lerp(T.A, T.C, tt) }; };
  const nestSegs = [['A', 'D'], ['D', 'B'], ['A', 'E'], ['E', 'C'], ['B', 'C'], ['D', 'E']];
  const bowPts = R => { const k = R.int(6, 14) / 10, a = polar(R.int(18, 26) / 10, R.int(15, 40)), b = polar(R.int(18, 26) / 10, -R.int(15, 40)); return { A: mul(a, -1), B: mul(b, -1), C: [0, 0], D: mul(b, k), E: mul(a, k) }; };
  const AA_CFG = [
    R => { const sec = R.bool() ? ['∠AED ≅ ∠ACB', 'corresponding angles', [0]] : ['∠DAE ≅ ∠BAC', 'reflexive property'];
      const lines = [['DE ∥ BC', 'given'], ['∠ADE ≅ ∠ABC', 'corresponding angles', [0]], sec, ['△ADE ∼ △ABC', 'AA similarity', [1, 2]]];
      if (R.bool()) lines.push(['{AD/AB=DE/BC}', corrS, [3]]);
      return { pts: nestPts(R), segs: nestSegs, arrows: [['D', 'E', 1], ['B', 'C', 1]], lines, tri: ['ADE', 'ABC'], label: 'triangle with a segment parallel to its base' }; },
    R => { const fst = R.bool() ? ['∠BAC ≅ ∠DEC', 'alternate interior angles', [0]] : ['∠ABC ≅ ∠EDC', 'alternate interior angles', [0]];
      const lines = [['AB ∥ DE', 'given'], fst, ['∠ACB ≅ ∠ECD', 'vertical angles'], ['△ABC ∼ △EDC', 'AA similarity', [1, 2]]];
      if (R.bool()) lines.push(['{AC/EC=BC/DC}', corrS, [3]]);
      return { pts: bowPts(R), segs: [['A', 'B'], ['D', 'E'], ['A', 'C'], ['C', 'E'], ['B', 'C'], ['C', 'D']], arrows: [['A', 'B', 1], ['E', 'D', 1]], lines, tri: ['ABC', 'EDC'], label: 'two triangles meeting at a point' }; },
    R => { let T; do T = randTri(R); while (T.A > 80 || T.B > 80 || T.C > 80); const P = T.t, D = foot(P.B, P.A, P.C), Ee = foot(P.C, P.A, P.B);
      const lines = [['BD ⟂ AC', 'given'], ['CE ⟂ AB', 'given'], ['∠ADB ≅ ∠AEC', 'all right angles are congruent', [0, 1]], ['∠BAD ≅ ∠CAE', 'reflexive property'], ['△ABD ∼ △ACE', 'AA similarity', [2, 3]]];
      if (R.bool()) lines.push(['{AB/AC=AD/AE}', corrS, [4]]);
      return { pts: { ...P, D, E: Ee }, segs: [['A', 'E'], ['E', 'B'], ['B', 'C'], ['A', 'D'], ['D', 'C'], ['B', 'D'], ['C', 'E']], angles: [['A', 'D', 'B', '', { right: true }], ['A', 'E', 'C', '', { right: true }]], lines, tri: ['ABD', 'ACE'], label: 'triangle with two altitudes' }; },
    R => { const b = R.int(40, 52) / 10, c = R.int(40, 52) / 10, al = R.int(45, 75), t = R.int(45, 70) / 100 * Math.min(b / c, c / b), A = [0, 0], B = [c, 0], Cc = polar(b, al);
      const lines = [['∠ADE ≅ ∠ACB', 'given'], ['∠DAE ≅ ∠CAB', 'reflexive property'], ['△ADE ∼ △ACB', 'AA similarity', [0, 1]]];
      if (R.bool()) lines.push(['{AD/AC=DE/CB}', corrS, [2]]);
      return { pts: { A, B, C: Cc, D: lerp(A, B, t * b / c), E: lerp(A, Cc, t * c / b) }, segs: nestSegs, angles: [['A', 'D', 'E', '', { n: 1 }], ['A', 'C', 'B', '', { n: 1 }]], lines, tri: ['ADE', 'ACB'], label: 'triangle with a segment across it' }; },
  ];

  /* ================= V.5.01 Proportions in figures ================= */
  const PHI = (1 + Math.sqrt(5)) / 2;
  S('V.5.01', 'Proportions in figures', {
    a: { t: 'set up a proportion', g: R => {
      let S1, m1, m2; do { S1 = baseTri(R); m1 = R.int(1, 3); m2 = R.int(2, 5); } while (m1 === m2 || Math.max(m1, m2) > 2.5 * Math.min(m1, m2));
      const T = [S1.map(v => v * m1), S1.map(v => v * m2)], xi = R.int(0, 1), oi = 1 - xi, i = R.int(0, 2), j = (i + R.int(1, 2)) % 3, k3 = 3 - i - j, show3 = R.bool(0.4);
      const p2 = T[oi][i], q1 = T[xi][j], q2 = T[oi][j], x = T[xi][i];
      const lab = t => { const o = {}; o[KEYS[i]] = t === xi ? 'x' : String(T[t][i]); o[KEYS[j]] = String(T[t][j]); if (show3) o[KEYS[k3]] = String(T[t][k3]); return o; };
      const { vis } = simFig(R, S1, m2 / m1, lab(0), lab(1));
      return E.choice(R, 'The triangles are similar, and matching angles have matching marks. Which proportion gives x?', M(`x/${p2}=${q1}/${q2}`), [M(`x/${p2}=${q2}/${q1}`), M(`x/${q2}=${q1}/${p2}`), M(`${p2}/x=${q1}/${q2}`)],
        `x matches ${p2}, and ${q1} matches ${q2}. Keep the same triangle on top on both sides: ${M(`x/${p2}=${q1}/${q2}`)}, so x = ${x}.`, { visual: vis }); } },
    b: { t: 'cross multiply', g: R => {
      let p, q, r, s; do { p = R.int(1, 9); q = R.int(2, 12); r = R.int(1, 6); s = R.int(2, 8); } while (gcd(p, q) !== 1 || p === q || r === s || p * s > 60 || q * s > 60);
      const v = [p * r, q * r, p * s, q * s], h = R.int(0, 3); let ex = R.bool(0.35) ? R.pick([-4, -3, -2, -1, 1, 2, 3, 5]) : 0; if (v[h] - ex <= 0) ex = 0;
      const t = v.map((n, i) => i === h ? (ex ? `(x${ex > 0 ? '+' : ''}${ex})` : 'x') : String(n)), pr = 3 - h, oth = h === 0 || h === 3 ? [v[1], v[2]] : [v[0], v[3]];
      const tx = ex ? lin(1, ex) : 'x', xv = v[h] - ex;
      return E.num(`Solve ${M(`${t[0]}/${t[1]}=${t[2]}/${t[3]}`)}.`, [{ label: 'x =', ans: xv }],
        `Cross multiply: ${v[pr]}${ex ? '(' + tx + ')' : 'x'} = ${oth[0]} × ${oth[1]} = ${oth[0] * oth[1]}, so ${tx} = ${oth[0] * oth[1]} ÷ ${v[pr]} = ${v[h]}${ex ? ` and x = ${xv}` : ''}.`); } },
    c: { t: 'extended ratios', g: R => { const kind = R.int(0, 3);
      const pick3 = (test) => { let a; do a = [R.int(1, 9), R.int(1, 9), R.int(1, 9)]; while (new Set(a).size < 3 || !test(a)); return a; };
      const which = R.int(0, 2), W = ['smallest', 'middle', 'largest'][which];
      if (kind === 0) { const a = pick3(a => 180 % (a[0] + a[1] + a[2]) === 0 && Math.max(...a) * 180 / (a[0] + a[1] + a[2]) < 150 && Math.min(...a) * 180 / (a[0] + a[1] + a[2]) >= 10), sm = a[0] + a[1] + a[2], k = 180 / sm, ans = sortN(a)[which] * k;
        return E.num(`The angles of a triangle are in the ratio ${a.join(' : ')}. Find the ${W.replace('middle', 'middle-sized')} angle.`, [{ ans }], `Write the angles as ${a.map(v => (v === 1 ? '' : v) + 'x').join(', ')}. Then ${sm}x = 180°, so x = ${k}° and the angle is ${sortN(a)[which]} × ${k}° = ${ans}°.`); }
      if (kind === 1) { const a = pick3(a => triOK(a)), sm = a[0] + a[1] + a[2], m = R.int(2, 9), ans = sortN(a)[which] * m, n = trio(R);
        return E.num(`The sides of △${n.join('')} are in the ratio ${a.join(' : ')}, and its perimeter is ${sm * m}. Find its ${W.replace('smallest', 'shortest').replace('largest', 'longest').replace('middle', 'middle-length')} side.`, [{ ans }],
          `Write the sides as ${a.map(v => (v === 1 ? '' : v) + 'x').join(', ')}. Then ${sm}x = ${sm * m}, so x = ${m} and the side is ${sortN(a)[which]} × ${m} = ${ans}.`); }
      if (kind === 2) { const a = [R.int(1, 7), R.int(1, 7), R.int(1, 7)], sm = a[0] + a[1] + a[2], m = R.int(2, 8), L = lets(R, 4), ask = R.int(0, 2);
        const P = { [L[0]]: [0, 0], [L[1]]: [a[0], 0], [L[2]]: [a[0] + a[1], 0], [L[3]]: [sm, 0] };
        const nm = [L[1] + L[2], L[0] + L[2], L[1] + L[3]][ask], ans = [a[1], a[0] + a[1], a[1] + a[2]][ask] * m;
        return E.num(`Points ${L[1]} and ${L[2]} lie on ${L[0]}${L[3]} with ${L[0]}${L[1]} : ${L[1]}${L[2]} : ${L[2]}${L[3]} = ${a.join(' : ')}. If ${L[0]}${L[3]} = ${sm * m}, find ${nm}.`, [{ label: nm + ' =', ans }],
          `The parts are ${a.map(v => (v === 1 ? '' : v) + 'x').join(', ')} with ${sm}x = ${sm * m}, so x = ${m}. ${nm} = ${[a[1], a[0] + a[1], a[1] + a[2]][ask]}x = ${ans}.`, { visual: fig({ pts: P, segs: [[L[0], L[1]], [L[1], L[2]], [L[2], L[3]]], w: 300, label: 'segment split into three parts' }) }); }
      const a = sortN(pick3(a => triOK(a))), m = R.int(2, 6), kn = R.int(0, 2), ka = (kn + R.int(1, 2)) % 3, NM = ['shortest', 'middle', 'longest'];
      return E.num(`The sides of a triangle are in the ratio ${a.join(' : ')}. A similar triangle has its ${NM[kn]} side equal to ${a[kn] * m}. Find its ${NM[ka]} side.`, [{ ans: a[ka] * m }],
        `Similar triangles keep the ratio ${a.join(' : ')}. ${a[kn]}x = ${a[kn] * m} gives x = ${m}, so the ${NM[ka]} side is ${a[ka]} × ${m} = ${a[ka] * m}.`); } },
    d: { t: 'golden ratio', g: R => { const kind = R.int(0, 3);
      if (kind <= 1) { const s = R.int(3, 24), Lg = R.int(5, 40), a = kind === 0 ? s : Lg / PHI, b = kind === 0 ? s * PHI : Lg, L = lets(R, 4);
        const P = { [L[0]]: [0, 0], [L[1]]: [b, 0], [L[2]]: [b, a], [L[3]]: [0, a], _p: [a, 0], _q: [a, a] }, vis = fig({ pts: spin(R, P), segs: [[L[0], L[1], { lab: kind ? String(Lg) : '?' }], [L[1], L[2], { lab: kind ? '?' : String(s) }], [L[2], L[3]], [L[3], L[0]], ['_p', '_q', { dash: true }]], angles: [[L[3], L[0], L[1], '', { right: true }], [L[0], L[1], L[2], '', { right: true }]], label: 'golden rectangle' });
        if (kind === 0) return E.num(`${L[0]}${L[1]}${L[2]}${L[3]} is a golden rectangle: long side ÷ short side = φ ≈ 1.618. The short side is ${s}. Find the long side to 1 decimal place.`, [{ ans: s * PHI, dp: 1 }], `Long side = ${s} × φ ≈ ${s} × 1.618 ≈ ${(s * PHI).toFixed(1)}.`, { visual: vis });
        return E.num(`${L[0]}${L[1]}${L[2]}${L[3]} is a golden rectangle: long side ÷ short side = φ ≈ 1.618. The long side is ${Lg}. Find the short side to 1 decimal place.`, [{ ans: Lg / PHI, dp: 1 }], `Short side = ${Lg} ÷ φ ≈ ${Lg} ÷ 1.618 ≈ ${(Lg / PHI).toFixed(1)}.`, { visual: vis }); }
      if (kind === 2) { const Lg = R.int(2, 12), L = lets(R, 3), ans = E.surdStr(-Lg, Lg, 5, 2), x = Lg / PHI;
        const vis = fig({ pts: { [L[0]]: [0, 0], [L[2]]: [x, 0], [L[1]]: [Lg, 0] }, segs: [[L[0], L[2], { lab: 'x' }], [L[2], L[1]]], w: 300, label: 'segment cut in the golden ratio' });
        return E.num(`${L[2]} cuts ${L[0]}${L[1]} = ${Lg} in the golden ratio: ${mm(`${L[0]}${L[1]}/${L[0]}${L[2]}=${L[0]}${L[2]}/${L[2]}${L[1]}`)}. Find x = ${L[0]}${L[2]} exactly.`, [{ label: 'x =', exact: ans }],
          `${M(`${Lg}/x=x/(${Lg}-x)`)} gives x² = ${Lg}(${Lg} − x), so x² + ${Lg}x − ${Lg * Lg} = 0. The positive root is x = ${E.pt(ans)} ≈ ${x.toFixed(2)}.`, { visual: vis }); }
      const F = R.pick([[5, 8], [8, 13], [13, 21], [21, 34], [34, 55]]), m = F[0] < 13 ? R.int(1, 3) : 1, a = F[0] * m, b = F[1] * m;
      const opts = []; for (const f of R.shuffle([1.2, 1.25, 1.33, 1.4, 1.8, 1.9, 2, 2.2, 2.5])) { const c = Math.round(a * f); if (Math.abs(c / a - PHI) > 0.13 && c !== b && !opts.includes(c)) opts.push(c); if (opts.length === 3) break; }
      const RT = x => `${a} by ${x}`;
      return E.choice(R, `Which rectangle is closest to a golden rectangle (long side ÷ short side ≈ 1.618)?`, RT(b), opts.map(RT), `${b} ÷ ${a} ≈ ${(b / a).toFixed(3)}, very close to φ ≈ 1.618. The others give ${opts.map(c => (c / a).toFixed(2)).join(', ')}.`); } },
  });

  /* ================= V.5.02 Similar polygons ================= */
  const quadPair = (R, k, labs1, labs2, right) => { const q = randQuad(R), L = lets(R, 8), n1 = {}, n2 = {}; QK.forEach((c, i) => { n1[c] = L[i]; n2[c] = L[4 + i]; });
    const P = side2(R, q.pts, xform(q.pts, 0, false, k), n1, n2); return { q, L, n1, n2, P }; };
  S('V.5.02', 'Similar polygons', {
    a: { t: 'equal angles', g: R => {
      const q = randQuad(R), L = lets(R, 8), n1 = {}, n2 = {}; QK.forEach((c, i) => { n1[c] = L[i]; n2[c] = L[4 + i]; });
      const P = side2(R, q.pts, xform(q.pts, 0, false, R.pick([0.8, 0.85, 1.2, 1.25])), n1, n2), t = R.int(0, 3), hard = R.bool(0.45), rot = R.int(0, 3);
      const lab1 = {}, lab2 = {}; QK.forEach((c, i) => { if (!(hard && i === t)) lab1[c] = deg(q.an[i]); }); lab2[QK[t]] = '?';
      if (!hard) { const o = R.pick([0, 1, 2, 3].filter(i => i !== t)); lab2[QK[o]] = deg(q.an[o]); Object.keys(lab1).forEach(c => { if (c !== QK[t] && R.bool(0.5)) delete lab1[c]; }); }
      const st = `${[0, 1, 2, 3].map(i => n1[QK[(i + rot) % 4]]).join('')} ∼ ${[0, 1, 2, 3].map(i => n2[QK[(i + rot) % 4]]).join('')}`;
      const vis = fig({ pts: P, segs: [...quadSegs(n1), ...quadSegs(n2)], angles: [...quadAngs(n1, lab1), ...quadAngs(n2, lab2)], w: 420, label: 'two similar quadrilaterals' }), tg = n2[QK[t]], ans = q.an[t];
      const others = [0, 1, 2, 3].filter(i => i !== t);
      return E.num(`${st}. Find ∠${tg}.`, [{ label: `∠${tg} =`, ans }], hard ? `∠${tg} matches ∠${n1[QK[t]]}. The angles of a quadrilateral add to 360°, so ∠${n1[QK[t]]} = 360° − ${others.map(i => q.an[i] + '°').join(' − ')} = ${ans}°.` : `In the statement ${tg} sits in the same place as ${n1[QK[t]]}, and matching angles of similar polygons are equal: ∠${tg} = ∠${n1[QK[t]]} = ${ans}°.`, { visual: vis }); } },
    b: { t: 'proportional sides', g: R => {
      let d1, d2; do { d1 = R.int(1, 4); d2 = R.int(1, 4); } while (d1 === d2 || Math.max(d1, d2) > 2 * Math.min(d1, d2));
      if (R.bool(0.3)) { const S1 = baseTri(R), T = [S1.map(v => v * d1), S1.map(v => v * d2)], i = R.int(0, 2), j = (i + R.int(1, 2)) % 3, xi = R.int(0, 1);
        const lab = t => { const o = {}; KEYS.forEach((s, z) => o[s] = String(T[t][z])); if (t === xi) { o[KEYS[i]] = 'x'; KEYS.forEach((s, z) => { if (z !== i && z !== j) delete o[s]; }); } return o; };
        const { L, vis } = simFig(R, S1, d2 / d1, lab(0), lab(1)), nmT = t => L.slice(3 * t, 3 * t + 3).join('');
        return E.num(`△${nmT(0)} ∼ △${nmT(1)}. Find x.`, [{ label: 'x =', ans: T[xi][i] }], `The scale factor from △${nmT(1 - xi)} to △${nmT(xi)} is ${T[xi][j]}/${T[1 - xi][j]} = ${kTxt(T[xi][j], T[1 - xi][j])}, so x = ${T[1 - xi][i]} × ${kTxt(T[xi][j], T[1 - xi][j])} = ${T[xi][i]}.`, { visual: vis }); }
      const [dx, h] = R.pick([[3, 4], [4, 3], [6, 8], [8, 6], [5, 12], [3, 4]]), a = R.int(2, 6), b = a + dx, sl = Math.hypot(dx, h);
      const base = { AB: b, BC: sl, CD: a, DA: h }, T = [d1, d2].map(d => { const o = {}; for (const s in base) o[s] = base[s] * d; return o; });
      const pts = { A: [0, 0], B: [b, 0], C: [a, h], D: [0, h] }, L = lets(R, 8), n1 = {}, n2 = {}; QK.forEach((c, i) => { n1[c] = L[i]; n2[c] = L[4 + i]; });
      const P = side2(R, pts, xform(pts, 0, false, d2 / d1), n1, n2), sides = ['AB', 'BC', 'CD', 'DA'], xi = R.int(0, 1), ask = R.pick(sides), known = R.pick(sides.filter(s => s !== ask));
      const lab = t => { const o = {}; sides.forEach(s => { if (t !== xi || s === known) o[s] = String(T[t][s]); }); if (t === xi) o[ask] = 'x'; return o; };
      const ns = [n1, n2], nmQ = t => QK.map(c => ns[t][c]).join(''), sn = (t, s) => ns[t][s[0]] + ns[t][s[1]];
      const vis = fig({ pts: P, segs: [...quadSegs(n1, lab(0)), ...quadSegs(n2, lab(1))], angles: [...quadAngs(n1, {}, { A: 1, D: 1 }), ...quadAngs(n2, {}, { A: 1, D: 1 })], w: 370, label: 'two similar trapezoids' });
      const kk = kTxt(T[xi][known], T[1 - xi][known]);
      return E.num(`${nmQ(0)} ∼ ${nmQ(1)}. Find x.`, [{ label: 'x =', ans: T[xi][ask] }], `${sn(xi, known)} matches ${sn(1 - xi, known)}, so the scale factor is ${T[xi][known]}/${T[1 - xi][known]} = ${kk}. Then x = ${sn(1 - xi, ask)} × ${kk} = ${T[1 - xi][ask]} × ${kk} = ${T[xi][ask]}.`, { visual: vis }); } },
    c: { t: 'similarity statements', g: R => {
      const q = randQuad(R), L = lets(R, 8), sg = R.shuffle([0, 1, 2, 3]), n1 = {}, n2 = {}; QK.forEach((c, i) => { n1[c] = L[i]; n2[c] = L[4 + sg[i]]; });
      const P = side2(R, q.pts, xform(q.pts, 0, false, R.pick([0.8, 0.85, 1.2, 1.25])), n1, n2), lab = {}; QK.forEach((c, i) => lab[c] = deg(q.an[i]));
      const vis = fig({ pts: P, segs: [...quadSegs(n1), ...quadSegs(n2)], angles: [...quadAngs(n1, lab), ...quadAngs(n2, lab)], w: 420, label: 'two similar quadrilaterals' });
      const first = QK.map(c => n1[c]).join(''), img = QK.map(c => n2[c]);
      if (R.bool(0.35)) { const i = R.int(0, 3), j = (i + 1) % 4, sd = (a, b) => img[a] + img[b];
        return E.choice(R, `The quadrilaterals are similar; matching angles are equal. Which side matches ${n1[QK[i]]}${n1[QK[j]]}?`, sd(i, j), [sd(j, (j + 1) % 4), sd((i + 3) % 4, i), sd((j + 1) % 4, (j + 2) % 4)],
          `${n1[QK[i]]} (${q.an[i]}°) matches ${img[i]}, and ${n1[QK[j]]} (${q.an[j]}°) matches ${img[j]}, so ${n1[QK[i]]}${n1[QK[j]]} matches ${img[i]}${img[j]}.`, { visual: vis }); }
      const right = `${first} ∼ ${img.join('')}`, alt = [[1, 2, 3, 0], [3, 2, 1, 0], [0, 3, 2, 1], [2, 3, 0, 1], [1, 0, 3, 2]].map(p => `${first} ∼ ${p.map(i => img[i]).join('')}`);
      const alpha = `${first} ∼ ${L.slice(4).join('')}`, wrong = R.shuffle(alt).filter(s => s !== right); if (alpha !== right) wrong.unshift(alpha);
      return E.choice(R, 'The quadrilaterals are similar. Which similarity statement is correct?', right, wrong.slice(0, 3), `Pair the vertices by equal angles: ${QK.map((c, i) => `${n1[c]}↔${img[i]} (${q.an[i]}°)`).join(', ')}. In that order: ${right}.`, { visual: vis }); } },
    d: { t: 'test two polygons', g: R => {
      if (R.bool(0.35)) { const truth = R.bool();
        const T = ['Any two squares are similar.', 'Any two equilateral triangles are similar.', 'Any two regular hexagons are similar.', 'Any two regular pentagons are similar.', 'Any two isosceles right triangles are similar.', 'Any two regular octagons are similar.'];
        const F = ['Any two rectangles are similar.', 'Any two rhombuses are similar.', 'Any two isosceles triangles are similar.', 'Any two right triangles are similar.', 'Any two parallelograms are similar.', 'Any two trapezoids are similar.'];
        const WT = ['their angles are all 90° and their sides are all in the same ratio', 'their angles are all 60° and their sides are all in the same ratio', 'their angles are all 120° and their sides are all in the same ratio', 'their angles are all 108° and their sides are all in the same ratio', 'their angles are always 45°, 45° and 90°', 'their angles are all 135° and their sides are all in the same ratio'];
        const WF = ['a 2 × 3 and a 3 × 4 rectangle have equal angles, but 3/2 ≠ 4/3', 'a square and a thin rhombus have equal sides but different angles', 'the angles can differ: 40°, 70°, 70° and 80°, 50°, 50°', 'the acute angles can differ: 30°–60° and 40°–50°', 'both the angles and the side ratio can change', 'the angles and the side ratios can change'];
        const i = R.int(0, 5); return E.tf(`True or false? ${(truth ? T : F)[i]}`, truth, truth ? `True: ${WT[i]}.` : `False: ${WF[i]}.`); }
      const yes = R.bool(); let w1, h1, w2, h2, why;
      do { w1 = R.int(2, 9); h1 = R.int(2, 9); } while (w1 === h1);
      if (yes) { let n, d; do { d = R.int(1, 3); n = R.int(1, 4); } while (n === d || w1 % d || h1 % d); w2 = w1 / d * n; h2 = h1 / d * n; if (R.bool(0.3)) [w2, h2] = [h2, w2]; }
      else if (R.bool()) { const c = R.int(1, 4); w2 = w1 + c; h2 = h1 + c; why = `adding ${c} to both sides is not scaling`; }
      else { do { w2 = w1 * R.int(2, 3); h2 = h1 + R.int(1, 4) * R.pick([1, 2]); } while (w2 * h1 === h2 * w1 || w2 * w1 === h2 * h1); }
      const [s1, l1] = sortN([w1, h1]), [s2, l2] = sortN([w2, h2]);
      const L = lets(R, 8), rect = (w, h) => ({ A: [0, 0], B: [w, 0], C: [w, h], D: [0, h] }), n1 = {}, n2 = {}; QK.forEach((c, i) => { n1[c] = L[i]; n2[c] = L[4 + i]; });
      const P = side2(R, rect(w1, h1), rect(w2, h2), n1, n2, true);
      const vis = fig({ pts: P, segs: [...quadSegs(n1, { AB: String(w1), BC: String(h1) }), ...quadSegs(n2, { AB: String(w2), BC: String(h2) })], angles: [...quadAngs(n1, {}, { A: 1 }), ...quadAngs(n2, {}, { A: 1 })], w: 340, label: 'two rectangles' });
      const ok = s1 * l2 === s2 * l1;
      return E.tf('Are the two rectangles similar?', ok, ok ? `Match short with short and long with long: ${s2}/${s1} = ${l2}/${l1} = ${kTxt(s2, s1)}. The angles are all 90°, so they are similar.` : `Short to short is ${s2}/${s1} = ${nf(s2 / s1)}, but long to long is ${l2}/${l1} = ${nf(l2 / l1)}${why ? ` (${why})` : ''}. Equal angles are not enough, so they are not similar.`, { choices: ['Yes', 'No'], visual: vis }); } },
  });

  /* ================= V.5.03 Scale factor ================= */
  const KLIST = [[1, 2], [1, 3], [2, 3], [3, 2], [2, 1], [5, 2], [3, 1], [3, 4], [4, 3], [1, 4], [5, 3], [3, 5], [2, 5], [5, 4], [4, 5]];
  const kShow = (R, n, d) => d === 1 ? String(n) : ([2, 4, 5].includes(d) && R.bool()) ? nf(n / d) : frM(n, d);
  S('V.5.03', 'Scale factor', {
    a: { t: 'find it', g: R => {
      let S1, m1, m2; do { S1 = baseTri(R); m1 = R.int(1, 5); m2 = R.int(1, 5); } while (m1 === m2 || Math.max(m1, m2) > 2.5 * Math.min(m1, m2));
      const i = R.int(0, 2), j = (i + R.int(1, 2)) % 3, lab = m => { const o = {}; o[KEYS[i]] = String(S1[i] * m); if (R.bool(0.6)) o[KEYS[j]] = String(S1[j] * m); return o; };
      const l1 = lab(m1), l2 = {}; for (const s in l1) l2[s] = String(S1[KEYS.indexOf(s)] * m2);
      const { L, vis } = simFig(R, S1, m2 / m1, l1, l2), o = L.slice(0, 3).join(''), nw = L.slice(3).join(''), g = gcd(m2, m1);
      return E.num(`△${nw} is a scaled copy of △${o}. Find the scale factor from △${o} to △${nw}.`, [{ label: 'k =', frac: [m2 / g, m1 / g], form: 'any' }],
        `k = new ÷ original = ${S1[i] * m2} ÷ ${S1[i] * m1} = ${kTxt(m2, m1)}. ${m2 > m1 ? 'It is more than 1: an enlargement.' : 'It is less than 1: a reduction.'}`, { visual: vis }); } },
    b: { t: 'find a missing side', g: R => {
      const [n, d] = R.pick(KLIST), S1 = baseTri(R), O = S1.map(v => v * d), N = S1.map(v => v * n), back = R.bool(0.4), i = R.int(0, 2);
      const lab1 = {}, lab2 = {}; KEYS.forEach((s, z) => { lab1[s] = String(O[z]); lab2[s] = String(N[z]); });
      if (back) KEYS.forEach((s, z) => { if (z !== i) delete lab1[s]; else lab1[s] = 'x'; }); else KEYS.forEach((s, z) => { if (z !== i) delete lab2[s]; else lab2[s] = 'x'; });
      const { L, vis } = simFig(R, S1, n / d, lab1, lab2), o = L.slice(0, 3).join(''), nw = L.slice(3).join(''), kk = kShow(R, n, d);
      if (back) return E.num(`△${o} is scaled by k = ${kk} to make △${nw}. Find x.`, [{ label: 'x =', ans: O[i] }], `new = k × original, so original = new ÷ k: x = ${N[i]} ÷ ${kTxt(n, d)} = ${O[i]}.`, { visual: vis });
      return E.num(`△${o} is scaled by k = ${kk} to make △${nw}. Find x.`, [{ label: 'x =', ans: N[i] }], `new = k × original: x = ${kTxt(n, d)} × ${O[i]} = ${N[i]}.`, { visual: vis }); } },
    c: { t: 'enlargements vs reductions', g: R => {
      const t = R.int(0, 2), OPT = ['an enlargement', 'a reduction', 'neither: the same size'], form = t === 2 ? 1 : R.int(0, 2); let n, d;
      if (t === 2) { n = d = 1; } else { do { n = R.int(1, 15); d = R.int(1, 15); } while (n === d || gcd(n, d) !== 1 || (t === 0) !== (n > d)); }
      const u = R.pick(['cm', 'in', 'mm']), m = t === 2 ? R.int(2, 40) : R.int(1, 4), on = d * m, nn = n * m;
      const prompt = form === 0 ? `A figure is scaled by k = ${[1, 2, 4, 5, 10].includes(d) ? nf(n / d) : frM(n, d)}. Is this an enlargement, a reduction, or neither?` :
        form === 2 ? `A scale factor is k = ${frM(n, d)}. Is this an enlargement, a reduction, or neither?` :
        `A side of ${R.pick(['a photo', 'a triangle', 'a logo', 'a floor plan'])} is ${on} ${u} long; on the copy it is ${nn} ${u}. Is the copy an enlargement, a reduction, or neither?`;
      const k = n / d, kt = form === 1 ? `${nn}/${on}${gcd(nn, on) > 1 ? ' = ' + kTxt(n, d) : ''}` : kTxt(n, d);
      return E.choiceFixed(prompt, OPT, t, `k = ${kt}, which is ${k > 1 ? 'more than 1, so the copy is bigger' : k < 1 ? 'less than 1, so the copy is smaller' : 'exactly 1, so the copy is the same size (congruent)'}.`); } },
    d: { t: 'maps and models', g: (R, O) => { const kind = R.int(0, 3), imp = unitsOf(O) === 'ft';
      if (kind === 0) { const Sc = R.pick([10000, 20000, 25000, 50000, 100000, 200000, 250000]); let dcm; do dcm = R.int(3, 24) / 2; while (!ok3(dcm * Sc / 100000)); const km = cl(dcm * Sc / 100000);
        return E.num(`A map has scale 1 : ${big(Sc)}. Two towns are ${nf(dcm)} cm apart on the map. How far apart are they in real life, in km?`, [{ label: 'distance =', ans: km }], `Real = ${nf(dcm)} × ${big(Sc)} = ${big(dcm * Sc)} cm = ${nf(km)} km (100,000 cm = 1 km).`); }
      if (kind === 1) { const Sc = R.pick([20000, 25000, 50000, 100000, 200000]); let dcm; do dcm = R.int(2, 20) / 2; while (!ok3(dcm * Sc / 100000)); const km = cl(dcm * Sc / 100000);
        return E.num(`A map has scale 1 : ${big(Sc)}. A trail is ${nf(km)} km long. How long is it on the map, in cm?`, [{ label: 'map length =', ans: dcm }], `${nf(km)} km = ${big(km * 100000)} cm. Divide by ${big(Sc)}: ${nf(dcm)} cm.`); }
      if (kind === 2) { const n = R.pick([10, 12, 18, 20, 24, 25, 32, 48, 50, 72, 100]), back = R.bool(); let mod; do mod = R.int(4, 60) / 2; while (!ok3(mod * n / 100)); const real = cl(mod * n / 100);
        const thing = R.pick(['car', 'train engine', 'boat', 'plane', 'bus']);
        if (back) return E.num(`A model ${thing} is built at a scale of 1 : ${n}. The real ${thing} is ${nf(real)} m long. How long is the model, in cm?`, [{ label: 'model =', ans: mod }], `${nf(real)} m = ${nf(real * 100)} cm, and ${nf(real * 100)} ÷ ${n} = ${nf(mod)} cm.`);
        return E.num(`A model ${thing} is built at a scale of 1 : ${n}. The model is ${nf(mod)} cm long. How long is the real ${thing}, in m?`, [{ label: 'real =', ans: real }], `Real = ${nf(mod)} × ${n} = ${nf(mod * n)} cm = ${nf(real)} m.`); }
      if (imp) { const f = R.pick([2, 4, 5, 8, 10, 16, 20]), back = R.bool(); let p; do p = R.int(2, 30) / 4; while (!ok3(p * f)); const real = cl(p * f);
        if (back) return E.num(`On a floor plan, 1 inch represents ${f} feet. A wall is ${nf(real)} feet long. How long is it on the plan, in inches?`, [{ label: 'plan =', ans: p }], `${nf(real)} ÷ ${f} = ${nf(p)} inches.`);
        return E.num(`On a floor plan, 1 inch represents ${f} feet. A room is ${nf(p)} inches long on the plan. How long is the real room, in feet?`, [{ label: 'room =', ans: real }], `${nf(p)} × ${f} = ${nf(real)} feet.`); }
      const r = R.pick([0.5, 2, 2.5, 4, 5, 0.25]), back = R.bool(); let p; do p = R.int(2, 30) / 2; while (!ok3(p * r)); const real = cl(p * r);
      if (back) return E.num(`On a scale drawing, 1 cm represents ${nf(r)} m. A garden is ${nf(real)} m long. How long is it on the drawing, in cm?`, [{ label: 'drawing =', ans: p }], `${nf(real)} ÷ ${nf(r)} = ${nf(p)} cm.`);
      return E.num(`On a scale drawing, 1 cm represents ${nf(r)} m. A garden is ${nf(p)} cm long on the drawing. How long is the real garden, in m?`, [{ label: 'garden =', ans: real }], `${nf(p)} × ${nf(r)} = ${nf(real)} m.`); } },
  });

  /* ================= V.5.04 AA similarity ================= */
  const angTri = R => { let a; do { a = [R.int(30, 95), R.int(30, 95)]; a.push(180 - a[0] - a[1]); } while (a[2] < 25 || !apart(a, 8)); return a; };
  const triOfAngles = a => byAngles(a[1], a[2], 5);
  const angLabs = (a, idx) => { const o = {}; idx.forEach(i => o['ABC'[i]] = deg(a[i])); return o; };
  const angLab = (a, b) => b ? `(${lin(a, b)})°` : `${lin(a, b)}°`;
  // nested triangle with integer labels; kind 'par' (DE ∥ BC) or 'anti' (∠ADE = ∠ACB)
  const nestNums = (R, kind) => {
    if (kind === 'par') { let q, p, S1; do { q = R.int(3, 6); p = R.int(1, q - 1); S1 = baseTri(R, 2, 6); } while (p / q < 0.3 || p / q > 0.75);
      const [w, v, u] = S1, T = bySides(q * w, q * v, q * u);
      return { q, p, pts: { ...T, D: lerp(T.A, T.B, p / q), E: lerp(T.A, T.C, p / q) }, len: { AD: p * u, DB: (q - p) * u, AB: q * u, AE: p * v, EC: (q - p) * v, AC: q * v, DE: p * w, BC: q * w } }; }
    let q, p, S1; do { q = R.int(2, 6); p = R.int(1, q - 1); S1 = baseTri(R, 3, 7); } while (p * S1[1] >= 0.9 * q * S1[2] || p * S1[2] >= 0.9 * q * S1[1] || p / q < 0.3);
    const [al, be, ga] = S1, T = bySides(q * al, q * be, q * ga);
    return { q, p, pts: { ...T, D: lerp(T.A, T.B, p * be / (q * ga)), E: lerp(T.A, T.C, p * ga / (q * be)) }, len: { AD: p * be, AE: p * ga, DE: p * al, AB: q * ga, AC: q * be, BC: q * al } };
  };
  S('V.5.04', 'AA similarity', {
    a: { t: 'the postulate', g: R => {
      const yes = R.bool(), A1 = angTri(R); let A2 = A1.slice();
      if (!yes) do { const d = R.pick([-1, 1]) * R.int(5, 15), i = R.int(0, 2), j = (i + R.int(1, 2)) % 3; A2 = A1.slice(); A2[i] += d; A2[j] -= d; } while (A2.some(v => v < 22) || !apart(A2, 6) || sortN(A2).join() === sortN(A1).join());
      const s1 = R.sample([0, 1, 2], 2), s2 = R.sample([0, 1, 2], 2);
      const { vis } = pairOf(R, triOfAngles(A1), xform(triOfAngles(A2), 0, false, R.pick([0.65, 0.75, 1.35, 1.5])), [{}, {}, angLabs(A1, s1)], [{}, {}, angLabs(A2, s2)]);
      const th = (A, s) => { const m = [0, 1, 2].find(i => !s.includes(i)); return `${A[m]}°`; };
      return E.tf('Are the two triangles similar?', yes, `The missing angles are 180° − ${s1.map(i => A1[i] + '°').join(' − ')} = ${th(A1, s1)} and 180° − ${s2.map(i => A2[i] + '°').join(' − ')} = ${th(A2, s2)}. ` +
        (yes ? `Both triangles have angles ${sortN(A1).join('°, ')}°, so two pairs match: similar by AA.` : `The angles are ${sortN(A1).join('°, ')}° and ${sortN(A2).join('°, ')}°. There are not two matching pairs, so they are not similar.`), { choices: ['Yes', 'No'], visual: vis }); } },
    b: { t: 'find the angles', g: R => {
      const a = angTri(R), p = R.shuffle([0, 1, 2]), T = triOfAngles(a), kind = R.int(0, 2), t = R.int(0, 2), K3 = 'ABC';
      const lab1 = {}, lab2 = {}; let ans, why, prompt;
      const L = lets(R, 6), n1 = nm3(L), n2 = nm3(L.slice(3)), P = pairPts(R, T, xform(T, 0, false, R.pick([0.6, 0.7, 1.4, 1.6])), n1, n2);
      const st = `△${p.map(i => L[i]).join('')} ∼ △${p.map(i => L[3 + i]).join('')}`;
      if (kind === 0) { lab1[K3[t]] = deg(a[t]); const o = (t + 1) % 3; if (R.bool()) lab1[K3[o]] = deg(a[o]); else lab2[K3[o]] = deg(a[o]); lab2[K3[t]] = '?'; ans = a[t];
        why = `${L[3 + t]} matches ${L[t]} (same place in the statement), so ∠${L[3 + t]} = ∠${L[t]} = ${a[t]}°.`; prompt = `${st}. Find ∠${L[3 + t]}.`; }
      else if (kind === 1) { const o = [0, 1, 2].filter(i => i !== t); lab1[K3[o[0]]] = deg(a[o[0]]); lab2[K3[o[1]]] = deg(a[o[1]]); lab2[K3[t]] = '?'; ans = a[t];
        why = `∠${L[3 + o[0]]} = ∠${L[o[0]]} = ${a[o[0]]}°, so ∠${L[3 + t]} = 180° − ${a[o[0]]}° − ${a[o[1]]}° = ${ans}°.`; prompt = `${st}. Find ∠${L[3 + t]}.`; }
      else { let x, c, b; do { x = R.int(5, 30); c = R.pick([2, 3, 4, 5]); b = a[t] - c * x; } while (b === 0 || Math.abs(b) > 60); lab1[K3[t]] = deg(a[t]); lab2[K3[t]] = angLab(c, b); ans = x;
        why = `∠${L[3 + t]} matches ∠${L[t]}, so ${M(linM(c, b) + '=' + a[t])} and x = ${x}.`; prompt = `${st}. Find x.`; }
      const vis = pairFig(P, n1, n2, [{}, {}, lab1], [{}, {}, lab2], 'two similar triangles');
      return E.num(prompt, [kind === 2 ? { label: 'x =', ans } : { label: `∠${L[3 + t]} =`, ans }], why, { visual: vis }); } },
    c: { t: 'nested triangles', g: R => {
      const kind = R.bool(0.6) ? 'par' : 'anti', N = nestNums(R, kind), Ln = N.len;
      if (kind === 'par') { const ask = R.int(0, 3), labs = {};
        const set = [['AD', 'DB', 'DE', 'BC'], ['AD', 'DB', 'BC', 'DE'], ['AE', 'EC', 'DE', 'BC'], ['AD', 'DE', 'BC', 'DB']][ask], tg = set[3]; set.slice(0, 3).forEach(s => labs[s] = String(Ln[s])); labs[tg] = 'x';
        const cfg = { pts: N.pts, segs: nestSegs.map(([a, b]) => [a, b, { lab: labs[a + b] }]), arrows: [['D', 'E', 1], ['B', 'C', 1]], label: 'triangle with a segment parallel to its base' };
        const { rn, vis } = prep(R, cfg), whole = ask === 2 ? ['AE', 'AC', 'EC'] : ['AD', 'AB', 'DB'];
        const why = ask === 3 ? `△ADE ∼ △ABC (AA), so AB/AD = BC/DE = ${Ln.BC}/${Ln.DE}. AB = ${Ln.AD} × ${Ln.BC}/${Ln.DE} = ${Ln.AB}, so x = DB = ${Ln.AB} − ${Ln.AD} = ${Ln.DB}.`
          : `DE ∥ BC, so △ADE ∼ △ABC (AA, corresponding angles). Use the whole side: ${whole[1]} = ${Ln[whole[0]]} + ${Ln[whole[2]]} = ${Ln[whole[1]]}, and DE/BC = ${whole[0]}/${whole[1]} = ${Ln[whole[0]]}/${Ln[whole[1]]}, so x = ${tg === 'BC' ? `${Ln.DE} × ${Ln[whole[1]]}/${Ln[whole[0]]}` : `${Ln.BC} × ${Ln[whole[0]]}/${Ln[whole[1]]}`} = ${Ln[tg]}.`;
        return E.num(`${rn('DE ∥ BC')}. Find x.`, [{ label: 'x =', ans: Ln[tg] }], rn(why), { visual: vis }); }
      const ask = R.int(0, 2), set = [['AB', 'AC', 'AD', 'AE'], ['BC', 'AC', 'AD', 'DE'], ['AE', 'AB', 'AC', 'AD']][ask], tg = set[3], labs = {}; set.slice(0, 3).forEach(s => labs[s] = String(Ln[s])); labs[tg] = 'x';
      const segs = [['A', 'D'], ['D', 'B'], ['A', 'E'], ['E', 'C'], ['B', 'C'], ['D', 'E']].map(([a, b]) => [a, b, { lab: labs[a + b] }]);
      if (labs.AB) { segs.splice(0, 2, ['A', 'B', { lab: labs.AB }], ['A', 'D', { lab: labs.AD, side: -1 }]); }
      if (labs.AC) { const i = segs.findIndex(s => s[0] === 'A' && s[1] === 'E'); segs.splice(i, 2, ['A', 'C', { lab: labs.AC }], ['A', 'E', { lab: labs.AE, side: -1 }]); }
      const cfg = { pts: N.pts, segs, angles: [['A', 'D', 'E', '', { n: 1 }], ['A', 'C', 'B', '', { n: 1 }]], label: 'triangle with a segment across it' }, { rn, vis } = prep(R, cfg);
      const rat = ask === 0 ? `AD/AC = AE/AB, so x = ${Ln.AD} × ${Ln.AB}/${Ln.AC} = ${Ln.AE}` : ask === 1 ? `DE/CB = AD/AC, so x = ${Ln.BC} × ${Ln.AD}/${Ln.AC} = ${Ln.DE}` : `AD/AC = AE/AB, so x = ${Ln.AC} × ${Ln.AE}/${Ln.AB} = ${Ln.AD}`;
      return E.num(`${rn('∠ADE = ∠ACB')} (marked). Find x.`, [{ label: 'x =', ans: Ln[tg] }], rn(`The triangles share ∠A and ∠ADE = ∠ACB, so △ADE ∼ △ACB (AA). D matches C, so AD pairs with AC: ${rat}.`), { visual: vis }); } },
    d: { t: 'proof', g: R => proofQ(R, R.pick(AA_CFG)(R), mode3(R)) },
    e: { t: 'find the hidden similar pair', g: R => {
      let m, n, g, AB, AD, AC, cand;
      do { [m, n] = R.pick([[1, 2], [2, 3], [3, 4], [2, 5], [3, 5], [4, 5], [1, 3]]); g = R.int(1, 3); AB = g * m * n; AD = g * m * m; AC = g * n * n;
        cand = []; for (let z = n; z < AB + AC; z += n) if (z > (AC - AB) * 1.3 && z < (AC + AB) * 0.8 && z !== AB && z !== AC) cand.push(z); }
      while (!cand.length || AC > 40 || AB < 4);
      const BC = R.pick(cand);
      const T = bySides(BC, AC, AB), pts = { ...T, D: lerp(T.A, T.C, AD / AC) }, ask = R.int(0, 2), labs = { AB: String(AB), AC: String(AC) };
      if (ask === 2) labs.BC = String(BC);
      const segs = [['A', 'B', { lab: labs.AB }], ['B', 'C', { lab: labs.BC }], ['A', 'C'], ['A', 'D', ask === 0 ? { lab: 'x', ref: 'B', side: -1 } : {}], ['D', 'C', ask === 1 ? { lab: 'x', ref: 'B', side: -1 } : {}], ['B', 'D', ask === 2 ? { lab: 'x' } : {}]];
      const { rn, vis } = prep(R, { pts, segs, angles: [['A', 'B', 'D', '', { n: 1 }], ['A', 'C', 'B', '', { n: 1 }]], label: 'triangle with a cevian' });
      const ans = [AD, AC - AD, BC * m / n][ask], tgt = ['AD', 'DC', 'BD'][ask];
      const why = `△ABD and △ACB share ∠A, and ∠ABD = ∠ACB, so △ABD ∼ △ACB (AA). ` + (ask === 2 ? `So BD/CB = AB/AC: x = ${BC} × ${AB}/${AC} = ${ans}.` : `So AB/AC = AD/AB, which gives AD = AB²/AC = ${AB * AB}/${AC} = ${AD}${ask === 1 ? `, and x = DC = ${AC} − ${AD} = ${ans}` : ''}.`);
      return E.num(`${rn('D lies on AC with ∠ABD = ∠ACB')} (marked), and ${rn('AC')} = ${AC}. Find x = ${rn(tgt)}.`, [{ label: 'x =', ans }], rn(why), { visual: vis }); } },
    f: { t: 'a hidden pair of similar triangles', g: R => { const kind = R.int(0, 2);
      if (kind === 0) { let a, b; do { a = R.int(2, 15); b = R.int(2, 15); } while (a === b || Math.max(a, b) > 3 * Math.min(a, b)); const d = R.int(4, 20), x = d * a / (a + b), h = a * b / (a + b), g = gcd(a * b, a + b);
        const pts = { _a0: [0, 0], _a1: [0, a], _b0: [d, 0], _b1: [d, b], _x: [x, h], _f: [x, 0] }, sc = Math.max(a, b, d) / 6, P = {}; for (const k in pts) P[k] = mul(pts[k], 1 / sc);
        const vis = fig({ pts: P, segs: [['_a0', '_b0', { lab: String(d) }], ['_a0', '_a1', { lab: String(a), side: -1 }], ['_b0', '_b1', { lab: String(b), side: -1 }], ['_a1', '_b0'], ['_b1', '_a0'], ['_x', '_f', { dash: true, lab: 'h' }]], angles: [['_a1', '_a0', '_b0', '', { right: true }], ['_a0', '_b0', '_b1', '', { right: true }]], label: 'two poles with crossing wires' });
        return E.num(`Two upright poles, ${a} m and ${b} m tall, stand ${d} m apart. A wire runs from the top of each pole to the foot of the other. How high above the ground do the wires cross?`, [{ label: 'h =', frac: [a * b / g, (a + b) / g], form: 'any' }],
          `Let the crossing point split the ground into u and v. Similar triangles give h/${a} = v/${d} and h/${b} = u/${d}. Adding: h/${a} + h/${b} = (u + v)/${d} = 1, so h = ${a} × ${b}/(${a} + ${b}) = ${kTxt(a * b / g, (a + b) / g)} m. The distance ${d} m does not matter!`, { visual: vis }); }
      if (kind === 1) { let a, b; do { a = R.int(3, 16); b = R.int(3, 16); } while (a === b || Math.max(a, b) > 2.5 * Math.min(a, b)); const s = a * b / (a + b), g = gcd(a * b, a + b), L = lets(R, 3);
        const pts = { [L[2]]: [0, 0], [L[0]]: [0, a], [L[1]]: [b, 0], _s1: [s, 0], _s2: [s, s], _s3: [0, s] };
        const vis = fig({ pts: spin(R, pts), segs: [[L[2], L[0], { lab: String(a) }], [L[2], L[1], { lab: String(b) }], [L[0], L[1]], ['_s1', '_s2'], ['_s2', '_s3']], polys: [[L[2], '_s1', '_s2', '_s3', { fill: '#dbeafe' }]], angles: [[L[0], L[2], L[1], '', { right: true }]], label: 'square inside a right triangle' });
        return E.num(`A square sits in the right angle of a right triangle with legs ${a} and ${b}, with its far corner on the hypotenuse. Find the side of the square.`, [{ label: 'side =', frac: [a * b / g, (a + b) / g], form: 'any' }],
          `The small triangle above the square is similar to the whole one: (${a} − s)/s = ${a}/${b}. So ${b}(${a} − s) = ${a}s, giving s = ${a} × ${b}/(${a} + ${b}) = ${kTxt(a * b / g, (a + b) / g)}.`, { visual: vis }); }
      const [p0, q0, r0] = R.pick([[3, 4, 5], [3, 4, 5], [4, 3, 5], [5, 12, 13]]), gm = p0 + q0 > 10 ? 1 : R.int(1, 5), a = p0 * gm, b = q0 * gm, c = r0 * gm, num = a * b * c, den = c * c + a * b, g = gcd(num, den), h = a * b / c, s = num / den, L = lets(R, 3);
      const fA = b * b / c, pts = { [L[0]]: [0, 0], [L[1]]: [c, 0], [L[2]]: [fA, h], _s1: [s * fA / h, 0], _s2: [s * fA / h, s], _s3: [s * fA / h + s, s], _s4: [s * fA / h + s, 0] };
      const vis = fig({ pts: spin(R, pts), segs: [[L[0], L[1], { lab: String(c) }], [L[0], L[2], { lab: String(b) }], [L[1], L[2], { lab: String(a) }], ['_s1', '_s2'], ['_s2', '_s3'], ['_s3', '_s4']], polys: [['_s1', '_s2', '_s3', '_s4', { fill: '#dbeafe' }]], angles: [[L[0], L[2], L[1], '', { right: true }]], label: 'square on the hypotenuse' });
      return E.num(`A square stands on the hypotenuse of a right triangle with sides ${a}, ${b} and ${c}; its top corners touch the legs. Find the side of the square.`, [{ label: 'side =', frac: [num / g, den / g], form: 'any' }],
        `The altitude to the hypotenuse is h = ${a} × ${b}/${c} = ${kTxt(a * b / gcd(a * b, c), c / gcd(a * b, c))}. The triangle above the square is similar to the whole: s/${c} = (h − s)/h, so s = ${c}h/(${c} + h) = ${kTxt(num / g, den / g)}.`, { visual: vis }); } },
  });

  /* ================= V.5.05 SSS similarity ================= */
  const sssPair = (R, sim) => { let S1, m1, m2; do { S1 = baseTri(R, 2, 7); m1 = R.int(1, 4); m2 = R.int(1, 4); } while (m1 === m2); return { S1, A: S1.map(v => v * m1), B: S1.map(v => v * m2), m1, m2 }; };
  const sideLab = L => ({ BC: String(L[0]), CA: String(L[1]), AB: String(L[2]) });
  const SSS_CFG = [
    R => { const { S1, A, B, m1, m2 } = sssPair(R), P1 = bySides(...S1), P2r = xform(P1, rad(R.int(0, 71) * 5), R.bool(), m2 / m1);
      const ext = P => { const v = Object.values(P), xs = v.map(p => p[0]), ys = v.map(p => p[1]); return [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)]; }, e1 = ext(P1), e2 = ext(P2r);
      const gap = 0.6 * Math.max(e1[1] - e1[0], e1[3] - e1[2], e2[1] - e2[0], e2[3] - e2[2]), sh = e1[1] + gap - e2[0], dy = (e1[2] + e1[3] - e2[2] - e2[3]) / 2, P2 = {}; for (const k in P2r) P2[k] = [P2r[k][0] + sh, P2r[k][1] + dy];
      const pts = { A: P1.A, B: P1.B, C: P1.C, D: P2.A, E: P2.B, F: P2.C }, k = kTxt(m2, m1), r = (x, y) => `${x}/${y}=${k}`;
      const lines = [[`AB = ${A[2]}, BC = ${A[0]}, CA = ${A[1]}`, 'given'], [`DE = ${B[2]}, EF = ${B[0]}, FD = ${B[1]}`, 'given'], [`{DE/AB=${r(B[2], A[2])}}`, 'division', [0, 1]], [`{EF/BC=${r(B[0], A[0])}}`, 'division', [0, 1]], [`{FD/CA=${r(B[1], A[1])}}`, 'division', [0, 1]], ['△ABC ∼ △DEF', 'SSS similarity', [2, 3, 4]]];
      if (R.bool()) lines.push([R.pick(['∠ABC ≅ ∠DEF', '∠BCA ≅ ∠EFD', '∠CAB ≅ ∠FDE']), corrA, [5]]);
      return { pts, segs: [['A', 'B', { lab: String(A[2]) }], ['B', 'C', { lab: String(A[0]) }], ['C', 'A', { lab: String(A[1]) }], ['D', 'E', { lab: String(B[2]) }], ['E', 'F', { lab: String(B[0]) }], ['F', 'D', { lab: String(B[1]) }]], lines, tri: ['ABC', 'DEF'], w: 340, label: 'two triangles with side lengths' }; },
    R => { const T = randTri(R).t, M_ = mul(add(T.A, T.B), 0.5), N_ = mul(add(T.A, T.C), 0.5), P_ = mul(add(T.B, T.C), 0.5);
      const lines = [['M, N and P are the midpoints of AB, AC and BC', 'given'], ['{MN/BC=1/2}', 'midsegment theorem', [0]], ['{NP/BA=1/2}', 'midsegment theorem', [0]], ['{PM/CA=1/2}', 'midsegment theorem', [0]], ['△MNP ∼ △CBA', 'SSS similarity', [1, 2, 3]]];
      if (R.bool()) lines.push(['∠MNP ≅ ∠CBA', corrA, [4]]);
      return { pts: { ...T, M: M_, N: N_, P: P_ }, segs: [['A', 'M', { ticks: 1 }], ['M', 'B', { ticks: 1 }], ['A', 'N', { ticks: 2 }], ['N', 'C', { ticks: 2 }], ['B', 'P', { ticks: 3 }], ['P', 'C', { ticks: 3 }], ['M', 'N'], ['N', 'P'], ['P', 'M']], lines, tri: ['MNP', 'CBA'], label: 'triangle with its midsegment triangle' }; },
  ];
  S('V.5.05', 'SSS similarity', {
    a: { t: 'three ratios equal', g: R => {
      const { A, B } = sssPair(R), L = lets(R, 6); let Bw; do Bw = R.shuffle(B); while (Bw.every((v, i) => sortN(B).indexOf(v) === sortN(A).indexOf(A[i])));
      const sa = sortN(A), sb = sortN(B), str = pr => pr.map(([x, y]) => M(`${x}/${y}`)).join(', ');
      const right = str(sa.map((v, i) => [v, sb[i]])), written = str(A.map((v, i) => [v, Bw[i]]));
      const others = [[2, 1, 0], [1, 0, 2], [0, 2, 1], [1, 2, 0], [2, 0, 1]].map(p => str(sa.map((v, i) => [v, sb[p[i]]]))).filter(s => s !== right && s !== written);
      return E.choice(R, `△${L[0]}${L[1]}${L[2]} has sides ${L[0]}${L[1]} = ${A[0]}, ${L[1]}${L[2]} = ${A[1]}, ${L[2]}${L[0]} = ${A[2]}. △${L[3]}${L[4]}${L[5]} has sides ${L[3]}${L[4]} = ${Bw[0]}, ${L[4]}${L[5]} = ${Bw[1]}, ${L[5]}${L[3]} = ${Bw[2]}. Which three ratios should you compare to test SSS similarity?`,
        right, [written, ...R.shuffle(others)].filter(s => s !== right).slice(0, 3), `Sort both lists and pair shortest with shortest, middle with middle, longest with longest: ${sa.map((v, i) => `${v}/${sb[i]}`).join(', ')}. They all equal ${kTxt(sa[0], sb[0])}, so the triangles are similar.`); } },
    b: { t: 'test', g: R => {
      const yes = R.bool(), { S1, A } = sssPair(R); let B, how = 0;
      if (yes) { const g0 = gcd(A[0], gcd(A[1], A[2])), mm2 = R.pick([1, 2, 3, 4, 5].filter(z => z !== g0)); B = R.shuffle(A.map(v => v / g0 * mm2)); }
      else { const c = R.int(1, 4); how = R.int(0, 1); const mlt = R.pick([2, 3]); do { B = how ? A.map(v => v + c) : A.map(v => v * mlt); if (!how) { const j = R.int(0, 2); B[j] += R.pick([-2, -1, 1, 2]); } B = R.shuffle(B); }
        while (!triOK(B) || sortN(B)[0] * sortN(A)[1] === sortN(B)[1] * sortN(A)[0] && sortN(B)[1] * sortN(A)[2] === sortN(B)[2] * sortN(A)[1]); }
      const sa = sortN(A), sb = sortN(B), ok = sa[0] * sb[1] === sa[1] * sb[0] && sa[1] * sb[2] === sa[2] * sb[1];
      const { vis } = pairOf(R, bySides(...A), bySides(...B), [{}, {}, sideLab(A)], [{}, {}, sideLab(B)]);
      return E.tf('Are the triangles similar by SSS?', ok, `Sorted: ${sa.join(', ')} and ${sb.join(', ')}. The ratios are ${sb.map((v, i) => `${v}/${sa[i]}`).join(', ')}` + (ok ? `, all equal to ${kTxt(sb[0] / gcd(sb[0], sa[0]), sa[0] / gcd(sb[0], sa[0]))}, so yes.` : ` = ${sb.map((v, i) => nf(v / sa[i])).join(', ')}. They are not all equal, so no${how ? ' (adding the same amount to each side does not keep the shape)' : ''}.`), { choices: ['Yes', 'No'], visual: vis }); } },
    c: { t: 'find the scale factor', g: R => {
      const { S1, A, B, m1, m2 } = sssPair(R), g = gcd(m1, m2), L = lets(R, 6);
      if (R.bool(0.6)) { const { L: Lp, vis } = pairOf(R, bySides(...A), bySides(...B), [{}, {}, sideLab(A)], [{}, {}, sideLab(B)]), o = Lp.slice(0, 3).join(''), nw = Lp.slice(3).join('');
        return E.num(`The triangles are similar by SSS. Find the scale factor from △${o} to △${nw}.`, [{ label: 'k =', frac: [m2 / g, m1 / g], form: 'any' }], `Pair the sides by size: ${sortN(B).map((v, i) => `${v}/${sortN(A)[i]}`).join(' = ')} = ${kTxt(m2 / g, m1 / g)}.`, { visual: vis }); }
      const w = R.int(0, 2), NM = ['shortest', 'middle', 'longest'], sa = sortN(A), sb = sortN(B), labA = {}, idx = A.indexOf(sa[w]); KEYS.forEach((s, i) => labA[s] = i === idx ? 'x' : String(A[i]));
      const { L: Lp, vis } = pairOf(R, bySides(...A), bySides(...B), [{}, {}, labA], [{}, {}, sideLab(B)]), j = (w + 1) % 3;
      return E.num(`The triangles are similar, and x is the ${NM[w]} side of △${Lp.slice(0, 3).join('')}. Find x.`, [{ label: 'x =', ans: sa[w] }], `Pair by size. ${sa[j]} matches ${sb[j]}, so the scale factor is ${kTxt(m1 / g, m2 / g)}, and x = ${sb[w]} × ${kTxt(m1 / g, m2 / g)} = ${sa[w]}.`, { visual: vis }); } },
    d: { t: 'proof', g: R => proofQ(R, R.pick(SSS_CFG)(R), mode3(R)) },
  });

  /* ================= V.5.06 SAS similarity ================= */
  const sasTri = (b, c, al) => ({ A: [0, 0], B: [c, 0], C: polar(b, al) });           // AB = c, AC = b, ∠A = al
  const SAS_CFG = [
    R => { let p, q, u, v; do { q = R.int(3, 6); p = R.int(1, q - 1); u = R.int(2, 6); v = R.int(2, 6); } while (u === v || Math.max(u, v) > 2 * Math.min(u, v) || p / q < 0.3 || p / q > 0.75);
      const T = sasTri(q * v, q * u, R.int(45, 80)), pts = { ...T, D: lerp(T.A, T.B, p / q), E: lerp(T.A, T.C, p / q) };
      const lines = [[`AD = ${p * u}, AB = ${q * u}`, 'given'], [`AE = ${p * v}, AC = ${q * v}`, 'given'], [`{AD/AB=AE/AC=${kTxt(p / gcd(p, q), q / gcd(p, q))}}`, 'division', [0, 1]], ['∠DAE ≅ ∠BAC', 'reflexive property'], ['△ADE ∼ △ABC', 'SAS similarity', [2, 3]]];
      if (R.bool(0.6)) { lines.push(['∠ADE ≅ ∠ABC', corrA, [4]]); if (R.bool()) lines.push(['DE ∥ BC', 'converse of corresponding angles', [5]]); }
      return { pts, segs: [['A', 'D', { lab: String(p * u) }], ['D', 'B'], ['A', 'E', { lab: String(p * v) }], ['E', 'C'], ['B', 'C'], ['D', 'E']], lines, tri: ['ADE', 'ABC'], label: 'triangle with a segment across it' }; },
    R => { let a1, b1, n, d; do { a1 = R.int(2, 6); b1 = R.int(2, 6); [n, d] = R.pick([[1, 2], [2, 3], [3, 2], [2, 1], [3, 4], [4, 3]]); } while (a1 === b1 || a1 % d || b1 % d);
      const a2 = a1 / d * n, b2 = b1 / d * n, t1 = R.int(15, 45), t2 = -R.int(15, 45), sc = 1 / Math.max(a1, b1, a2, b2) * 3;
      const pts = { C: [0, 0], A: polar(a1 * sc, 180 + t1), E: polar(a2 * sc, t1), B: polar(b1 * sc, 180 + t2), D: polar(b2 * sc, t2) }, k = kTxt(n, d);
      const lines = [[`AC = ${a1}, EC = ${a2}`, 'given'], [`BC = ${b1}, DC = ${b2}`, 'given'], [`{EC/AC=DC/BC=${k}}`, 'division', [0, 1]], ['∠ACB ≅ ∠ECD', 'vertical angles'], ['△ACB ∼ △ECD', 'SAS similarity', [2, 3]]];
      if (R.bool(0.6)) { lines.push(['∠CAB ≅ ∠CED', corrA, [4]]); if (R.bool()) lines.push(['AB ∥ DE', 'converse of alternate interior angles', [5]]); }
      return { pts, segs: [['A', 'C', { lab: String(a1) }], ['C', 'E', { lab: String(a2) }], ['B', 'C', { lab: String(b1) }], ['C', 'D', { lab: String(b2) }], ['A', 'B'], ['D', 'E']], lines, tri: ['ACB', 'ECD'], label: 'two triangles meeting at a point' }; },
  ];
  S('V.5.06', 'SAS similarity', {
    a: { t: 'two ratios and the included angle', g: R => {
      let S1, m1, m2; do { S1 = baseTri(R); m1 = R.int(1, 3); m2 = R.int(2, 5); } while (m1 === m2 || Math.max(m1, m2) > 2.5 * Math.min(m1, m2));
      const sn = (n, s) => n[s[0]] + n[s[1]], an = (n, k) => { const [p, q] = 'ABC'.replace(k, '').split(''); return `∠${n[p]}${n[k]}${n[q]}`; };
      if (R.bool()) { const labs = m => ({ AB: String(S1[2] * m), CA: String(S1[1] * m) }), { n1, n2, vis } = simFig(R, S1, m2 / m1, labs(m1), labs(m2), {});
        return E.choice(R, `${sn(n2, 'AB')}/${sn(n1, 'AB')} = ${sn(n2, 'AC')}/${sn(n1, 'AC')} = ${kTxt(m2 / gcd(m1, m2), m1 / gcd(m1, m2))}. Which pair of angles must be congruent to prove the triangles similar by SAS?`, `${an(n1, 'A')} ≅ ${an(n2, 'A')}`,
          [`${an(n1, 'B')} ≅ ${an(n2, 'B')}`, `${an(n1, 'C')} ≅ ${an(n2, 'C')}`, `${an(n1, 'A')} ≅ ${an(n2, 'B')}`], `SAS needs the angle between the two proportional sides: the sides meet at ${n1.A} and ${n2.A}, so ${an(n1, 'A')} ≅ ${an(n2, 'A')}. Any other angle is not included (SSA).`, { visual: vis }); }
      const labs = m => ({ AB: String(S1[2] * m) }), { n1, n2, vis } = simFig(R, S1, m2 / m1, labs(m1), labs(m2), { A: 1 }), r = `${sn(n2, 'AB')}/${sn(n1, 'AB')}`;
      const f = (s, t) => mm(`${n2[s[0]]}${n2[s[1]]}/${n1[t[0]]}${n1[t[1]]}=${n2.A}${n2.B}/${n1.A}${n1.B}`);
      return E.choice(R, `${an(n1, 'A')} ≅ ${an(n2, 'A')} (marked), and ${sn(n1, 'AB')} = ${S1[2] * m1}, ${sn(n2, 'AB')} = ${S1[2] * m2}. Which other fact completes SAS similarity?`, f('AC', 'AC'), [f('BC', 'BC'), f('AC', 'BC'), f('BC', 'AC')],
        `The marked angles are at ${n1.A} and ${n2.A}, so the two sides must be the ones that form those angles: ${sn(n1, 'AB')} with ${sn(n2, 'AB')} and ${sn(n1, 'AC')} with ${sn(n2, 'AC')}, in the same ratio.`, { visual: vis }); } },
    b: { t: 'test', g: R => {
      const yes = R.bool(), kind = yes ? 0 : R.int(1, 3); let b, c, al, k, b2, c2, al2, mark = 'A', T1, T2, why;
      do { b = R.int(3, 9); c = R.int(3, 9); al = R.int(7, 22) * 5; [k] = [R.pick([[1, 2], [3, 2], [2, 1], [5, 2], [2, 3], [3, 1], [4, 3]])]; } while (b === c || b % k[1] || c % k[1]);
      c2 = c / k[1] * k[0]; b2 = b / k[1] * k[0]; al2 = al;
      if (kind === 1) { do b2 = b / k[1] * k[0] + R.pick([-2, -1, 1, 2]); while (b2 < 2 || b2 * c === c2 * b); why = `${c2}/${c} = ${nf(c2 / c)} but ${b2}/${b} = ${nf(b2 / b)}: the sides are not in the same ratio`; }
      if (kind === 3) { al2 = al + R.pick([-1, 1]) * R.int(2, 4) * 5; if (al2 < 30 || al2 > 120) al2 = al + (al < 75 ? 15 : -15); why = `the sides are in proportion, but the included angles differ (${al}° and ${al2}°)`; }
      if (kind === 2) { if (b < c) { [b, c] = [c, b]; b2 = b / k[1] * k[0]; c2 = c / k[1] * k[0]; } let be, x; do { be = R.int(7, 16) * 5; const s = Math.sin(rad(be)); x = c * Math.cos(rad(be)) + Math.sqrt(Math.max(0, b * b - c * c * s * s)); } while (b <= c * Math.sin(rad(be)) + 0.5 || x < 2);
        T1 = { A: polar(c, be), B: [0, 0], C: [x, 0] }; T2 = xform(T1, 0, false, k[0] / k[1]); mark = 'B'; al = be; al2 = be; why = `the marked angle is not between the two proportional sides (SSA), so SAS does not apply`; }
      if (!T1) { T1 = sasTri(b, c, al); T2 = sasTri(b2, c2, al2); }
      const lab = (bb, cc, aa) => ({ AB: String(cc), CA: String(bb), [mark]: deg(aa) });
      const { n1, n2, vis } = pairOf(R, T1, T2, [{}, {}, lab(b, c, al)], [{}, {}, lab(b2, c2, al2)]);
      if (yes) why = `${c2}/${c} = ${b2}/${b} = ${kTxt(k[0], k[1])}, and the ${al}° angles are between those sides`;
      return E.tf('Do the marked parts prove the triangles similar by SAS?', yes, `${yes ? 'Yes' : 'No'}: ${why}.`, { choices: ['Yes', 'No'], visual: vis }); } },
    c: { t: 'solve for x', g: R => {
      if (R.bool(0.55)) { let p, q, u, v, w; do { q = R.int(3, 6); p = R.int(1, q - 1); u = R.int(2, 6); v = R.int(2, 6); w = R.int(2, 6); } while (u === v || Math.max(u, v) > 2 * Math.min(u, v) || p / q < 0.3 || p / q > 0.75 || !triOK([q * w, q * v, q * u]));
        const Ln = { AD: p * u, DB: (q - p) * u, AE: p * v, EC: (q - p) * v, DE: p * w, BC: q * w }, T = bySides(q * w, q * v, q * u), pts = { ...T, D: lerp(T.A, T.B, p / q), E: lerp(T.A, T.C, p / q) };
        const tg = R.pick(['AE', 'EC', 'DE', 'BC', 'DB']), val = Ln[tg]; let a = R.pick([1, 1, 2, 3]); if (val - a < 1) a = 1; const xm = Math.max(1, Math.floor((val - 1) / a)), x = R.int(Math.min(2, xm), xm), bb = val - a * x, labX = a === 1 && bb === 0 ? 'x' : lin(a, bb);
        const known = { AE: ['AD', 'DB', 'EC'], EC: ['AD', 'DB', 'AE'], DE: ['AD', 'DB', 'BC'], BC: ['AD', 'DB', 'DE'], DB: ['AD', 'AE', 'EC'] }[tg], labs = {}; known.forEach(s => labs[s] = String(Ln[s])); labs[tg] = labX;
        const { rn, vis } = prep(R, { pts, segs: nestSegs.map(([s, t]) => [s, t, { lab: labs[s + t] }]), angles: [['D', 'A', 'E', '', { n: 1 }]], label: 'triangle with a segment across it' });
        const rel = { AE: `AD/AB = AE/AC: ${Ln.AD}/${Ln.AD + Ln.DB} = AE/(AE + ${Ln.EC}), so AE = ${Ln.AE}`, EC: `AD/AB = AE/AC: ${Ln.AD}/${Ln.AD + Ln.DB} = ${Ln.AE}/AC, so AC = ${Ln.AE + Ln.EC} and EC = ${Ln.EC}`,
          DE: `DE/BC = AD/AB = ${Ln.AD}/${Ln.AD + Ln.DB}, so DE = ${Ln.DE}`, BC: `BC/DE = AB/AD = ${Ln.AD + Ln.DB}/${Ln.AD}, so BC = ${Ln.BC}`, DB: `AB/AD = AC/AE = ${Ln.AE + Ln.EC}/${Ln.AE}, so AB = ${Ln.AD + Ln.DB} and DB = ${Ln.DB}` }[tg];
        return E.num(`${rn('△ADE ∼ △ABC')} by SAS similarity. Find x.`, [{ label: 'x =', ans: x }], rn(`Use whole sides, not pieces. ${rel}${labX === 'x' ? '.' : `, so ${labX} = ${val} and x = ${x}.`}`), { visual: vis }); }
      let b1, c1, n, d; do { b1 = R.int(3, 12); c1 = R.int(3, 12); [n, d] = R.pick([[1, 2], [2, 3], [3, 2], [2, 1], [3, 4], [4, 3], [5, 2], [2, 5], [5, 3]]); } while (b1 === c1 || b1 % d || c1 % d);
      const b2 = b1 / d * n, c2 = c1 / d * n, al = R.int(7, 22) * 5, x = b2;
      const { L, vis } = pairOf(R, sasTri(b1, c1, al), sasTri(b2, c2, al), [{}, { A: 1 }, { AB: String(c1), CA: String(b1), A: deg(al) }], [{}, { A: 1 }, { AB: String(c2), CA: 'x', A: deg(al) }]);
      return E.num(`Find x so that △${L[0]}${L[1]}${L[2]} ∼ △${L[3]}${L[4]}${L[5]} by SAS similarity.`, [{ label: 'x =', ans: x }], `The ${al}° angles are included, so the sides around them must be in one ratio: ${L[3]}${L[4]}/${L[0]}${L[1]} = ${c2}/${c1} = ${kTxt(n, d)}, so x = ${b1} × ${kTxt(n, d)} = ${x}.`, { visual: vis }); } },
    d: { t: 'proof', g: R => proofQ(R, R.pick(SAS_CFG)(R), mode3(R)) },
  });

  /* ================= V.5.07 Triangle proportionality ================= */
  const tpNums = R => { let p, r, m, n; do { p = R.int(1, 6); r = R.int(1, 6); m = R.int(1, 4); n = R.int(1, 4); } while (p === r && m === n || Math.max(m, n) > 2 * Math.min(m, n) || Math.max(p, r) > 2.4 * Math.min(p, r) || p * m < 2 || r * n < 2 || (p + r) * Math.max(m, n) > 30);
    return { p, r, m, n, v: { AD: p * m, DB: r * m, AE: p * n, EC: r * n } }; };
  const tpPts = (AB, AC, AE, al) => { const A = [0, 0], B = polar(AB, 0), Cc = polar(AC, al); return { A, B, C: Cc }; };
  S('V.5.07', 'Triangle proportionality', {
    a: { t: 'parallel line splits sides proportionally', g: R => {
      if (R.bool(0.35)) return proofQ(R, { pts: nestPts(R), segs: nestSegs, arrows: [['D', 'E', 1], ['B', 'C', 1]], tri: ['ADE', 'ABC'], label: 'triangle with a segment parallel to its base',
        lines: [['DE ∥ BC', 'given'], ['∠ADE ≅ ∠ABC', 'corresponding angles', [0]], ['∠DAE ≅ ∠BAC', 'reflexive property'], ['△ADE ∼ △ABC', 'AA similarity', [1, 2]], ['{AB/AD=AC/AE}', corrS, [3]], ['{DB/AD=EC/AE}', 'segment addition', [4]]] }, mode3(R));
      const N = tpNums(R), v = N.v, AB = v.AD + v.DB, AC = v.AE + v.EC, T = tpPts(AB, AC, 0, R.int(45, 80)), pts = { ...T, D: lerp(T.A, T.B, v.AD / AB), E: lerp(T.A, T.C, v.AE / AC) };
      if (R.bool(0.3)) { const { rn, vis } = prep(R, { pts, segs: nestSegs.map(([a, b]) => [a, b]), arrows: [['D', 'E', 1], ['B', 'C', 1]], label: 'triangle with a segment parallel to its base' });
        const right = R.pick(['AD/DB=AE/EC', 'AD/AB=AE/AC', 'DB/AB=EC/AC', 'DE/BC=AD/AB']), wrong = R.sample(['DE/BC=AD/DB', 'AD/DB=EC/AE', 'AD/AB=AE/EC', 'DE/BC=AE/EC', 'DB/AD=AE/EC'], 3);
        return E.choice(R, `${rn('DE ∥ BC')}. Which proportion must be true?`, mm(rn(right)), wrong.map(w => mm(rn(w))), rn(`The parallel line splits the sides proportionally (AD/DB = AE/EC), and △ADE ∼ △ABC gives AD/AB = AE/AC = DE/BC. DE/BC compares with whole sides, never with pieces.`), { visual: vis }); }
      const tg = R.pick(['AD', 'DB', 'AE', 'EC']), labs = {}; for (const s in v) labs[s] = s === tg ? 'x' : String(v[s]);
      const { rn, vis } = prep(R, { pts, segs: nestSegs.map(([a, b]) => [a, b, { lab: labs[a + b] }]), arrows: [['D', 'E', 1], ['B', 'C', 1]], label: 'triangle with a segment parallel to its base' });
      const lhs = tg === 'AD' || tg === 'DB' ? ['AE', 'EC'] : ['AD', 'DB'], rhs = tg === 'AD' || tg === 'DB' ? ['AD', 'DB'] : ['AE', 'EC'], o = rhs.find(s => s !== tg);
      return E.num(`${rn('DE ∥ BC')}. Find x.`, [{ label: 'x =', ans: v[tg] }], rn(`The line parallel to BC splits the sides proportionally: ${rhs[0]}/${rhs[1]} = ${lhs[0]}/${lhs[1]} = ${v[lhs[0]]}/${v[lhs[1]]}. With ${o} = ${v[o]}, x = ${v[tg]}.`), { visual: vis }); } },
    b: { t: 'its converse', g: R => {
      const yes = R.bool(), N = tpNums(R), v = Object.assign({}, N.v);
      if (!yes) { do v.EC = N.v.EC + R.pick([-2, -1, 1, 2, 3]); while (v.EC < 1 || v.AD * v.EC === v.DB * v.AE); }
      const AB = v.AD + v.DB, AC = v.AE + v.EC, T = tpPts(AB, AC, 0, R.int(45, 80)), pts = { ...T, D: lerp(T.A, T.B, v.AD / AB), E: lerp(T.A, T.C, v.AE / AC) };
      const { rn, vis } = prep(R, { pts, segs: nestSegs.map(([a, b]) => [a, b, { lab: v[a + b] !== undefined ? String(v[a + b]) : undefined }]), label: 'triangle with a segment across it' });
      const r1 = kTxt(v.AD / gcd(v.AD, v.DB), v.DB / gcd(v.AD, v.DB)), r2 = kTxt(v.AE / gcd(v.AE, v.EC), v.EC / gcd(v.AE, v.EC));
      return E.tf(rn('Is DE parallel to BC?'), yes, rn(`AD/DB = ${v.AD}/${v.DB} = ${r1} and AE/EC = ${v.AE}/${v.EC} = ${r2}. ${yes ? 'The ratios are equal, so by the converse DE ∥ BC.' : 'The ratios differ, so DE is not parallel to BC.'}`), { choices: ['Yes', 'No'], visual: vis }); } },
    c: { t: 'three parallel lines', g: R => {
      let p, r, m, n; do { p = R.int(2, 7); r = R.int(2, 7); m = R.int(2, 5); n = R.int(2, 5); } while (p === r || m === n || Math.max(m, n) / Math.min(m, n) > 1.34 || Math.max(p, r) > 2.5 * Math.min(p, r));
      const a = p * m, b = r * m, c = p * n, d = r * n; let s1, s2; if (m >= n) { s2 = R.int(88, 100) / 100; s1 = s2 * n / m; } else { s1 = R.int(88, 100) / 100; s2 = s1 * m / n; }
      const H1 = a * s1, H2 = b * s1, c1 = -Math.sqrt(1 - s1 * s1) / s1, c2 = Math.sqrt(1 - s2 * s2) / s2, G = 1.0 * (H1 + H2), ys = [0, H1, H1 + H2];
      const X1 = y => y * c1, X2 = y => G + y * c2, lo = Math.min(X1(H1 + H2), 0) - 1.2, hi = Math.max(X2(H1 + H2), G) + 1.2, pts = {};
      ys.forEach((y, i) => { pts['_l' + i] = [lo, y]; pts['_r' + i] = [hi, y]; }); ['A', 'B', 'C'].forEach((k, i) => pts[k] = [X1(ys[i]), ys[i]]); ['D', 'E', 'F'].forEach((k, i) => pts[k] = [X2(ys[i]), ys[i]]);
      const tg = R.pick(['AB', 'BC', 'DE', 'EF']), val = { AB: a, BC: b, DE: c, EF: d }, labs = {}; for (const s in val) labs[s] = s === tg ? 'x' : String(val[s]);
      const { rn, vis } = prep(R, { noSpin: true, pts: xform(pts, rad(R.int(-6, 6) * 5), R.bool()), segs: [['_l0', '_r0'], ['_l1', '_r1'], ['_l2', '_r2'], ['A', 'B', { lab: labs.AB, ref: 'E' }], ['B', 'C', { lab: labs.BC, ref: 'E' }], ['D', 'E', { lab: labs.DE, ref: 'B' }], ['E', 'F', { lab: labs.EF, ref: 'B' }]], arrows: [['_l0', '_r0', 1, 0.06], ['_l1', '_r1', 1, 0.06], ['_l2', '_r2', 1, 0.06]], w: 300, label: 'three parallel lines cut by two transversals' });
      const sh = q => q === tg ? 'x' : String(val[q]);
      return E.num('The three lines marked with arrows are parallel. Find x.', [{ label: 'x =', ans: val[tg] }], rn(`Parallel lines cut transversals proportionally: AB/BC = DE/EF, so ${sh('AB')}/${sh('BC')} = ${sh('DE')}/${sh('EF')} and x = ${val[tg]}.`), { visual: vis }); } },
    d: { t: 'solve for x', g: R => {
      const S4 = ['AD', 'DB', 'AE', 'EC']; let N, x, ex, A, B;
      do { N = tpNums(R); x = R.int(2, 9); const pairs = [['AD'], ['DB'], ['AE'], ['EC'], ['AD', 'DB'], ['AE', 'EC'], ['AD', 'AE'], ['DB', 'EC']], use = R.pick(pairs); ex = {};
        S4.forEach(s => { if (use.includes(s)) { const a = R.int(1, 3), b = N.v[s] - a * x; ex[s] = [a, b]; } else ex[s] = [0, N.v[s]]; });
        A = ex.AD[0] * ex.EC[0] - ex.DB[0] * ex.AE[0]; B = ex.AD[0] * ex.EC[1] + ex.AD[1] * ex.EC[0] - ex.DB[0] * ex.AE[1] - ex.DB[1] * ex.AE[0]; }
      while (A !== 0 || B === 0);
      const v = N.v, AB = v.AD + v.DB, AC = v.AE + v.EC, T = tpPts(AB, AC, 0, R.int(45, 80)), pts = { ...T, D: lerp(T.A, T.B, v.AD / AB), E: lerp(T.A, T.C, v.AE / AC) };
      const lab = s => ex[s][0] ? (ex[s][0] === 1 && ex[s][1] === 0 ? 'x' : lin(ex[s][0], ex[s][1])) : String(ex[s][1]), labs = {}; S4.forEach(s => labs[s] = lab(s));
      const { rn, vis } = prep(R, { pts, segs: nestSegs.map(([a, b]) => [a, b, { lab: labs[a + b] }]), arrows: [['D', 'E', 1], ['B', 'C', 1]], label: 'triangle with a segment parallel to its base' });
      const P = s => ex[s][0] ? `(${labs[s]})` : labs[s];
      return E.num(`${rn('DE ∥ BC')}. Find x.`, [{ label: 'x =', ans: x }], rn(`AD/DB = AE/EC. Cross multiply: ${P('AD')} × ${P('EC')} = ${P('DB')} × ${P('AE')}, which gives x = ${x}. Check: ${v.AD}/${v.DB} = ${v.AE}/${v.EC}.`), { visual: vis }); } },
  });

  /* ================= V.5.08 Angle bisector theorem ================= */
  const bisPts = (a, b, c) => { const T = bySides(a, b, c); return { ...T, D: lerp(T.B, T.C, c / (b + c)) }; };
  const bisAngs = [['B', 'A', 'D', '', { n: 1, tick: true }], ['D', 'A', 'C', '', { n: 1, tick: true }]];
  const BIS_POOL = ['corresponding angles', 'alternate interior angles', 'vertical angles', 'definition of angle bisector', 'triangle proportionality theorem', 'converse of the isosceles triangle theorem', 'isosceles triangle theorem', 'parallel postulate', 'angle bisector theorem', 'reflexive property'];
  S('V.5.08', 'Angle bisector theorem', {
    a: { t: 'the ratio of the split', g: R => {
      if (R.bool(0.3)) { const yes = R.bool(); let a, b, c; do { a = R.int(4, 14); b = R.int(4, 12); c = yes ? b : R.int(4, 12); } while (!yes && b === c || a >= b + c - 1 || b >= a + c - 1 || c >= a + b - 1);
        const { rn, vis } = prep(R, { pts: bisPts(a, b, c), segs: [['A', 'B', { lab: String(c) }], ['A', 'C', { lab: String(b) }], ['B', 'D'], ['D', 'C'], ['A', 'D']], angles: bisAngs, label: 'triangle with an angle bisector' });
        return E.tf(rn('AD bisects ∠BAC. Is D the midpoint of BC?'), yes, rn(yes ? `BD/DC = AB/AC = ${c}/${b} = 1, so BD = DC: yes. (This happens only because AB = AC.)` : `BD/DC = AB/AC = ${c}/${b}, not 1, so D is not the midpoint. The bisector is not the median.`), { choices: ['Yes', 'No'], visual: vis }); }
      let a, b, c; do { a = R.int(4, 14); b = R.int(3, 12); c = R.int(3, 12); } while (b === c || a >= b + c - 1 || b >= a + c - 1 || c >= a + b - 1);
      const flip = R.bool(), g = gcd(b, c), { rn, vis } = prep(R, { pts: bisPts(a, b, c), segs: [['A', 'B', { lab: String(c) }], ['A', 'C', { lab: String(b) }], ['B', 'D'], ['D', 'C'], ['A', 'D']], angles: bisAngs, label: 'triangle with an angle bisector' });
      return E.num(rn(`AD bisects ∠BAC. Find ${flip ? 'DC/BD' : 'BD/DC'}.`), [{ label: rn(flip ? 'DC/BD =' : 'BD/DC ='), frac: flip ? [b / g, c / g] : [c / g, b / g], form: 'any' }],
        rn(`The bisector splits BC in the ratio of the other two sides: BD/DC = AB/AC = ${c}/${b}${flip ? `, so DC/BD = ${kTxt(b / g, c / g)}` : g > 1 ? ' = ' + kTxt(c / g, b / g) : ''}.`), { visual: vis }); } },
    b: { t: 'solve for a segment', g: R => {
      let be, ga, s, t; do { be = R.int(1, 7); ga = R.int(1, 7); s = R.int(1, 4); t = R.int(1, 4); } while (be === ga || gcd(be, ga) > 1 || Math.max(be, ga) > 3 * Math.min(be, ga) || Math.abs(be - ga) * s >= (be + ga) * t || (be + ga) * t >= (be + ga) * s || be * s < 3 || ga * s < 3);
      const AB = ga * s, AC = be * s, BD = ga * t, DC = be * t, BC = BD + DC, kind = R.int(0, 3), labs = {};
      const tg = ['BD', 'DC', 'AC', 'AB'][kind]; if (kind < 2) { labs.AB = AB; labs.AC = AC; labs.BC = BC; } else { labs.BD = BD; labs.DC = DC; labs[kind === 2 ? 'AB' : 'AC'] = kind === 2 ? AB : AC; }
      labs[tg] = 'x'; const segs = kind < 2 ? [['A', 'B', { lab: String(labs.AB) }], ['A', 'C', { lab: String(labs.AC) }], ['B', 'D', tg === 'BD' ? { lab: 'x', side: -1 } : {}], ['D', 'C', tg === 'DC' ? { lab: 'x', side: -1 } : {}], ['A', 'D']] : [['A', 'B', { lab: String(labs.AB) }], ['A', 'C', { lab: String(labs.AC) }], ['B', 'D', { lab: String(BD) }], ['D', 'C', { lab: String(DC) }], ['A', 'D']];
      const { rn, vis } = prep(R, { pts: bisPts(BC, AC, AB), segs, angles: bisAngs, label: 'triangle with an angle bisector' }), ans = { BD, DC, AC, AB }[tg];
      const why = kind < 2 ? `BD/DC = AB/AC = ${AB}/${AC}${s > 1 ? ` = ${ga}/${be}` : ''}, so BC = ${BC} splits into ${ga} + ${be} = ${ga + be} equal parts of ${t}: BD = ${BD} and DC = ${DC}.` : kind === 2 ? `BD/DC = AB/AC: ${BD}/${DC} = ${AB}/AC, so AC = ${AB} × ${DC}/${BD} = ${AC}.` : `BD/DC = AB/AC: ${BD}/${DC} = AB/${AC}, so AB = ${AC} × ${BD}/${DC} = ${AB}.`;
      return E.num(rn(`AD bisects ∠BAC${kind < 2 ? ` and BC = ${BC}` : ''}. Find x.`), [{ label: 'x =', ans }], rn(why), { visual: vis }); } },
    c: { t: 'prove it', g: R => { let a, b, c; do { a = R.int(5, 9); b = R.int(4, 8); c = R.int(4, 9); } while (Math.abs(b - c) < 2 || a >= b + c - 2 || b >= a + c - 2 || c >= a + b - 2);
      const P = bisPts(a, b, c), Ee = add(P.A, mul(unit(sub(P.A, P.B)), b));
      const cfg = { pts: { ...P, E: Ee }, segs: [['B', 'A'], ['A', 'E', { dash: true }], ['A', 'C'], ['B', 'D'], ['D', 'C'], ['A', 'D'], ['C', 'E', { dash: true }]], arrows: [['A', 'D', 1], ['E', 'C', 1]], angles: bisAngs, pool: BIS_POOL, label: 'triangle with an angle bisector and a parallel line',
        lines: [['AD bisects ∠BAC', 'given'], ['Draw CE ∥ DA, meeting BA extended at E', 'parallel postulate'], ['∠BAD ≅ ∠AEC', 'corresponding angles', [1]], ['∠DAC ≅ ∠ACE', 'alternate interior angles', [1]],
          ['∠AEC ≅ ∠ACE', 'substitution', [0, 2, 3]], ['AE = AC', 'converse of the isosceles triangle theorem', [4]], ['{BD/DC=BA/AE}', 'triangle proportionality theorem', [1]], ['{BD/DC=BA/AC}', 'substitution', [5, 6]]] };
      return proofQ(R, cfg, R.pick(['order', 'order', 'reason', 'reason', 'broken'])); } },
    d: { t: 'with coordinates', g: R => {
      const VEC = [[3, 4], [4, 3], [5, 12], [12, 5], [6, 8], [8, 6], [0, 5], [5, 0], [0, 10], [10, 0], [8, 15], [15, 8], [9, 12], [12, 9], [0, 3], [3, 0], [0, 4], [4, 0]];
      const sg = (R, v) => [v[0] * R.pick([1, -1]), v[1] * R.pick([1, -1])], den = (n, d) => d / gcd(n, d);
      let A, B, Cc, u, v, c, b, D;
      do { A = [R.int(-4, 4), R.int(-4, 4)]; u = sg(R, R.pick(VEC)); v = sg(R, R.pick(VEC)); c = Math.hypot(...u); b = Math.hypot(...v); B = add(A, u); Cc = add(A, v);
        const cr = u[0] * v[1] - u[1] * v[0], ang = Math.acos((u[0] * v[0] + u[1] * v[1]) / (b * c)) * 180 / Math.PI; D = null;
        if (Math.abs(cr) > 1e-9 && ang > 35 && ang < 140 && [...B, ...Cc].every(z => Math.abs(z) <= 12) && b !== c * 1.0001) D = [0, 1].map(i => [b * B[i] + c * Cc[i], b + c]); }
      while (!D || D.some(([n, d]) => den(n, d) > 4));
      const Ds = D.map(([n, d]) => fs(n, d)), L = trio(R), xs = [A[0], B[0], Cc[0]], ys = [A[1], B[1], Cc[1]], x0 = Math.min(...xs, 0) - 1, x1 = Math.max(...xs, 0) + 1, y0 = Math.min(...ys, 0) - 1, y1 = Math.max(...ys, 0) + 1, Sz = Math.max(x1 - x0, y1 - y0);
      const seg = (P, Q, col) => ({ x: t => P[0] + (Q[0] - P[0]) * t, y: t => P[1] + (Q[1] - P[1]) * t, t: [0, 1], color: col || C.blue });
      const vis = V.graph({ x: [x0, x0 + Sz], y: [y0, y0 + Sz], w: 280, h: 280, ticks: 1, labels: false, param: [seg(A, B), seg(B, Cc), seg(Cc, A)], points: [[A[0], A[1], L[0]], [B[0], B[1], L[1]], [Cc[0], Cc[1], L[2]]], label: 'triangle on a coordinate grid' });
      return E.num(`${L[0]}(${A.join(', ')}), ${L[1]}(${B.join(', ')}) and ${L[2]}(${Cc.join(', ')}). The bisector of ∠${L[0]} meets ${L[1]}${L[2]} at D. Find D.`, [{ label: 'D =', point: Ds }],
        `${L[0]}${L[1]} = ${c} and ${L[0]}${L[2]} = ${b}, so ${L[1]}D : D${L[2]} = ${c} : ${b}. D is ${kTxt(c / gcd(c, b + c), (b + c) / gcd(c, b + c))} of the way from ${L[1]} to ${L[2]}: D = (${Ds.join(', ')}).`, { visual: vis }); } },
  });

  /* ================= V.5.09 Similar right triangles ================= */
  // right △ABC (right angle at C) with altitude CD; AD = m, DB = n
  const rtPts = (m, n) => ({ A: [0, 0], B: [m + n, 0], D: [m, 0], C: [m, Math.sqrt(m * n)] });
  const rtPtsA = al => { const P = { A: [0, 0], B: [6, 0], C: polar(6 * Math.cos(rad(al)), al) }; P.D = foot(P.C, P.A, P.B); return P; };
  const rtSegs = (labs = {}) => [['A', 'D', { lab: labs.AD }], ['D', 'B', { lab: labs.DB }], ['A', 'C', { lab: labs.AC }], ['C', 'B', { lab: labs.BC }], ['C', 'D', { lab: labs.CD }]];
  const rtRight = [['A', 'C', 'B', '', { right: true }], ['C', 'D', 'B', '', { right: true }]];
  // altitude h with integer pieces m·n = h² (m ≠ 1, m ≠ n, pieces not too lopsided)
  const hmn = (R, hi, rmax) => { let h, ds; do { h = R.int(2, hi); ds = []; for (let m = 2; m < h * h; m++) if ((h * h) % m === 0 && m !== h && Math.max(m, h * h / m) <= rmax * Math.min(m, h * h / m)) ds.push(m); } while (!ds.length); const m = R.pick(ds); return [h, m, h * h / m]; };
  const sq = N => { const [a, b] = E.surd(1, N); return b === 1 ? String(a) : `${a === 1 ? '' : a}sqrt(${b})`; };
  const PYPOOL = ['SAS similarity', 'corresponding sides of similar triangles are proportional', 'segment addition', 'addition property of equality', 'reflexive property', 'vertical angles', 'corresponding angles of similar triangles are congruent'];
  WHY['addition property of equality'] = 'adding the two equations side by side keeps them equal';
  PW['segment addition'] = [['reflexive property'], ['definition of midpoint', 'D need not be the midpoint of the hypotenuse; the two pieces simply add up to it']];
  S('V.5.09', 'Similar right triangles', {
    a: { t: 'altitude to the hypotenuse', g: R => {
      let al; do al = R.int(22, 68); while (Math.abs(al - 45) < 7); const kind = R.int(0, 2), pts = rtPtsA(al);
      if (kind === 0) { const { rn, vis } = prep(R, { pts, segs: rtSegs(), angles: rtRight, label: 'right triangle with the altitude to its hypotenuse' });
        return E.choice(R, rn('CD is the altitude to the hypotenuse of right △ABC. Which angle is equal to ∠A?'), rn('∠BCD'), [rn('∠ACD'), rn('∠B'), rn('∠ACB')], rn('∠A and ∠BCD both add with ∠B to 90° (in △ABC and in △CBD), so ∠BCD = ∠A. ∠ACD equals ∠B instead.'), { visual: vis }); }
      const ask = R.pick(kind === 1 ? ['BCD', 'ACD', 'B'] : ['A', 'ACD']), giv = kind === 1 ? ['C', 'A', 'B', deg(al)] : ['B', 'C', 'D', deg(al)];
      const tgA = { BCD: ['B', 'C', 'D'], ACD: ['A', 'C', 'D'], B: ['A', 'B', 'C'], A: ['C', 'A', 'B'] }[ask], ans = ask === 'BCD' || ask === 'A' ? al : 90 - al;
      const { rn, vis } = prep(R, { pts, segs: rtSegs(), angles: [...rtRight, giv, [...tgA, '?']], label: 'right triangle with the altitude to its hypotenuse' });
      const nm = s => s.length === 1 ? '∠' + s : '∠' + s, gnm = kind === 1 ? '∠A' : '∠BCD';
      return E.num(rn(`CD is the altitude to the hypotenuse of right △ABC, and ${gnm} = ${al}°. Find ${nm(ask)}.`), [{ label: rn(nm(ask) + ' ='), ans }],
        rn(ans === al ? `∠A and ∠BCD are both 90° − ∠B, so they are equal: ${nm(ask)} = ${al}°.` : `${nm(ask)} is the complement of ${gnm}: 90° − ${al}° = ${ans}°.`), { visual: vis }); } },
    b: { t: 'three similar triangles', g: R => {
      let al; do al = R.int(25, 65); while (Math.abs(al - 45) < 8);
      const T = [['A', 'B', 'C'], ['A', 'C', 'D'], ['C', 'B', 'D']], [i, j] = R.pick([[0, 1], [0, 2], [1, 2], [1, 0], [2, 0], [2, 1]]), pi = R.shuffle([0, 1, 2]);
      const st = (t, p) => '△' + p.map(k => t[k]).join(''), right = `${st(T[i], pi)} ∼ ${st(T[j], pi)}`;
      const wrong = R.shuffle([[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]].filter(s => s.join() !== pi.join()).map(s => `${st(T[i], pi)} ∼ ${st(T[j], s)}`)).slice(0, 3);
      const { rn, vis } = prep(R, { pts: rtPtsA(al), segs: rtSegs(), angles: rtRight, label: 'right triangle with the altitude to its hypotenuse' });
      return E.choice(R, rn('CD is the altitude to the hypotenuse of right △ABC. Which similarity statement is correct?'), rn(right), wrong.map(rn),
        rn(`Match the right angles and the equal acute angles: ${pi.map(k => `${T[i][k]}↔${T[j][k]}`).join(', ')}. (∠A = ∠BCD and ∠B = ∠ACD.)`), { visual: vis }); } },
    c: { t: 'geometric mean', g: R => { const kind = R.int(0, 2);
      if (kind === 2) { const [h, m, n] = hmn(R, 12, 6);
        const swap = R.bool(), labs = swap ? { DB: String(m), AD: 'x', CD: String(h) } : { AD: String(m), DB: 'x', CD: String(h) }, pts = swap ? rtPts(n, m) : rtPts(m, n);
        const { rn, vis } = prep(R, { pts, segs: rtSegs(labs), angles: rtRight, label: 'right triangle with the altitude to its hypotenuse' });
        return E.num('The altitude to the hypotenuse is drawn. Find x.', [{ label: 'x =', ans: n }], `The altitude is the geometric mean of the two pieces: ${h}² = ${m} × x, so x = ${h * h}/${m} = ${n}.`, { visual: vis }); }
      let m, n; do { m = R.int(1, 16); n = R.int(1, 16); } while (m === n || Math.max(m, n) > 5 * Math.min(m, n));
      if (kind === 0) { const { rn, vis } = prep(R, { pts: rtPts(m, n), segs: rtSegs({ AD: String(m), DB: String(n), CD: 'x' }), angles: rtRight, label: 'right triangle with the altitude to its hypotenuse' }), ans = sq(m * n);
        return E.num('The altitude to the hypotenuse is drawn. Find x exactly.', [{ label: 'x =', exact: ans, form: 'simplest' }], `x is the geometric mean of the pieces, not their average: x² = ${m} × ${n} = ${m * n}, so x = ${E.pt(ans)}.`, { visual: vis }); }
      const leg = R.bool(), labs = { AD: String(m), DB: String(n) }; labs[leg ? 'AC' : 'BC'] = 'x'; const ans = sq(leg ? m * (m + n) : n * (m + n));
      const { rn, vis } = prep(R, { pts: rtPts(m, n), segs: rtSegs(labs), angles: rtRight, label: 'right triangle with the altitude to its hypotenuse' });
      return E.num('The altitude to the hypotenuse is drawn. Find x exactly.', [{ label: 'x =', exact: ans, form: 'simplest' }], `A leg is the geometric mean of the hypotenuse and the piece next to it: x² = ${leg ? m : n} × ${m + n} = ${(leg ? m : n) * (m + n)}, so x = ${E.pt(ans)}.`, { visual: vis }); } },
    d: { t: 'prove Pythagoras with similarity', g: R => { let al; do al = R.int(28, 62); while (Math.abs(al - 45) < 6);
      const AA2 = 'AA similarity (a shared angle and a right angle)';
      const cfg = { pts: rtPtsA(al), segs: [['A', 'D', { lab: 'q' }], ['D', 'B', { lab: 'p' }], ['A', 'C', { lab: 'b' }], ['C', 'B', { lab: 'a' }], ['C', 'D'], ['A', 'B', { lab: 'c', side: -1, at: 0.5 }]], angles: rtRight, pool: PYPOOL, noAsk: [5], tri: ['CBD', 'ABC'],
        note: 'In right △ABC, a = BC, b = AC, c = AB, and the altitude CD splits AB into p = BD and q = AD.', prove: '{a^2+b^2=c^2}', label: 'right triangle with the altitude to its hypotenuse',
        lines: [['∠ACB = 90° and CD ⟂ AB', 'given'], ['△CBD ∼ △ABC', AA2, [0]], ['△ACD ∼ △ABC', AA2, [0]], ['{a/c=p/a}, so a² = cp', corrS, [1]], ['{b/c=q/b}, so b² = cq', corrS, [2]],
          ['a² + b² = cp + cq = c(p + q)', 'addition property of equality', [3, 4]], ['p + q = c', 'segment addition'], ['a² + b² = c · c = c²', 'substitution', [5, 6]]] };
      cfg.segs = cfg.segs.filter(s => !(s[0] === 'A' && s[1] === 'B'));
      return proofQ(R, cfg, R.pick(['order', 'order', 'reason', 'broken'])); } },
    e: { t: 'combine with Pythagoras', g: R => {
      if (R.bool(0.35)) { const [h, m, n] = hmn(R, 10, 5);
        const ans = sq(m * (m + n)), { rn, vis } = prep(R, { pts: rtPts(m, n), segs: rtSegs({ AD: String(m), CD: String(h), AC: 'x' }), angles: rtRight, label: 'right triangle with the altitude to its hypotenuse' });
        return E.num('The altitude to the hypotenuse is drawn. Find x exactly.', [{ label: 'x =', exact: ans, form: 'simplest' }], `First the other piece: ${h}² = ${m} × DB gives DB = ${n}, so the hypotenuse is ${m + n}. Then x² = ${m} × ${m + n} = ${m * (m + n)}, so x = ${E.pt(ans)}.`.replace('DB', rn('DB')).replace('DB', rn('DB')), { visual: vis }); }
      const [p0, q0, r0] = R.pick([[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29], [9, 40, 41]]), g = r0 < 20 ? R.int(1, 3) : 1, sw = R.bool();
      const a = (sw ? q0 : p0) * g, b = (sw ? p0 : q0) * g, c = r0 * g, ask = R.pick(['DB', 'AD', 'CD']), num = { DB: a * a, AD: b * b, CD: a * b }[ask], gg = gcd(num, c);
      const pts = { A: [0, 0], B: [c, 0], C: [b * b / c, a * b / c] }; pts.D = [b * b / c, 0];
      const labs = { BC: String(a), AC: String(b) }; labs[ask] = 'x'; const { rn, vis } = prep(R, { pts, segs: rtSegs(labs), angles: rtRight, label: 'right triangle with the altitude to its hypotenuse' });
      const why = ask === 'CD' ? `AB = √(${a}² + ${b}²) = ${c}. Twice the area is ${a} × ${b} = ${c} × x, so x = ${kTxt(num / gg, c / gg)}.` : `AB = √(${a}² + ${b}²) = ${c}. The leg ${ask === 'DB' ? a : b} is the geometric mean of ${c} and x: ${ask === 'DB' ? a : b}² = ${c}x, so x = ${num}/${c} = ${kTxt(num / gg, c / gg)}.`;
      return E.num('The altitude to the hypotenuse is drawn. Find x.', [{ label: 'x =', frac: [num / gg, c / gg], form: 'any' }], why, { visual: vis }); } },
    f: { t: 'pieces from a clever identity', g: R => {
      if (R.bool()) { const [d, h2, c] = R.pick([[5, 12, 13], [3, 4, 5], [9, 12, 15], [7, 24, 25], [6, 8, 10], [12, 16, 20], [15, 20, 25], [9, 40, 41], [21, 20, 29], [10, 24, 26], [15, 36, 39], [20, 48, 52]]), h = h2 / 2, longB = R.bool();
        const p = (c - d) / 2, q = (c + d) / 2, pts = longB ? rtPts(p, q) : rtPts(q, p), { rn, vis } = prep(R, { pts, segs: rtSegs({ CD: String(h) }), angles: rtRight, label: 'right triangle with the altitude to its hypotenuse' });
        return E.num(rn(`In right △ABC the altitude CD to the hypotenuse is ${h}, and ${longB ? 'DB' : 'AD'} is ${d} longer than ${longB ? 'AD' : 'DB'}. Find AB.`), [{ label: rn('AB ='), ans: c }],
          `Call the pieces u and v. Then uv = ${h}² = ${h * h} and v − u = ${d}. So (u + v)² = (v − u)² + 4uv = ${d * d} + ${4 * h * h} = ${c * c}, and the hypotenuse is ${c}.`, { visual: vis }); }
      const [m, n] = R.pick([[1, 2], [1, 3], [2, 3], [3, 4], [2, 5], [1, 4], [3, 5], [4, 5]]), c = R.int(4, 30), ask = R.pick(['DB', 'AD']), s = m * m + n * n, num = c * (ask === 'DB' ? m * m : n * n), g = gcd(num, s);
      const pts = rtPts(c * n * n / s, c * m * m / s), { rn, vis } = prep(R, { pts, segs: rtSegs({ DB: ask === 'DB' ? 'x' : undefined, AD: ask === 'AD' ? 'x' : undefined }), angles: rtRight, label: 'right triangle with the altitude to its hypotenuse' });
      return E.num(rn(`In right △ABC, AB = ${c} and the legs are in the ratio BC : AC = ${m} : ${n}. The altitude CD is drawn to AB. Find x = ${ask}.`), [{ label: 'x =', frac: [num / g, s / g], form: 'any' }],
        rn(`BC² = AB · DB and AC² = AB · AD, so DB : AD = BC² : AC² = ${m * m} : ${n * n}. Split ${c} in that ratio: ${ask} = ${c} × ${ask === 'DB' ? m * m : n * n}/${s} = ${kTxt(num / g, s / g)}.`), { visual: vis }); } },
  });

  /* ================= V.5.10 Perimeter & area ratios ================= */
  const SHAPES = ['triangles', 'pentagons', 'rectangles', 'hexagons', 'trapezoids', 'kites', 'parallelograms'];
  const kPair = R => { let n, d; do { n = R.int(1, 6); d = R.int(1, 6); } while (n === d || gcd(n, d) > 1); return [n, d]; };
  const sqU = O => unitsOf(O) === 'ft' ? 'in²' : 'cm²', lnU = O => unitsOf(O) === 'ft' ? 'in' : 'cm';
  S('V.5.10', 'Perimeter & area ratios', {
    a: { t: 'perimeter ratio = k', g: R => {
      let S1, m1, m2; do { S1 = baseTri(R); m1 = R.int(1, 4); m2 = R.int(1, 5); } while (m1 === m2 || Math.max(m1, m2) > 2.5 * Math.min(m1, m2)); const i = R.int(0, 2), P1 = (S1[0] + S1[1] + S1[2]) * m1, P2 = P1 / m1 * m2, g = gcd(m1, m2);
      const { L, vis } = simFig(R, S1, m2 / m1, { [KEYS[i]]: String(S1[i] * m1) }, { [KEYS[i]]: String(S1[i] * m2) }), o = L.slice(0, 3).join(''), nw = L.slice(3).join('');
      if (R.bool(0.3)) return E.num(`The triangles are similar. Find the ratio perimeter of △${nw} ÷ perimeter of △${o}.`, [{ frac: [m2 / g, m1 / g], form: 'any' }], `Perimeters scale by k, the same as sides: k = ${S1[i] * m2}/${S1[i] * m1} = ${kTxt(m2 / g, m1 / g)}.`, { visual: vis });
      const fwd = R.bool();
      return E.num(`The triangles are similar. The perimeter of △${fwd ? o : nw} is ${fwd ? P1 : P2}. Find the perimeter of △${fwd ? nw : o}.`, [{ ans: fwd ? P2 : P1 }], `k = ${fwd ? S1[i] * m2 : S1[i] * m1}/${fwd ? S1[i] * m1 : S1[i] * m2} = ${fwd ? kTxt(m2 / g, m1 / g) : kTxt(m1 / g, m2 / g)}, and perimeters scale by k: ${fwd ? P1 : P2} × ${fwd ? kTxt(m2 / g, m1 / g) : kTxt(m1 / g, m2 / g)} = ${fwd ? P2 : P1}.`, { visual: vis }); } },
    b: { t: 'area ratio = k²', g: (R, O) => {
      const [n, d] = kPair(R), t = R.int(1, 9), A1 = t * d * d, A2 = t * n * n, sh = R.pick(SHAPES), j = R.int(1, 4), U = sqU(O), give = R.bool();
      const kt = give ? `matching sides ${d * j} ${lnU(O)} and ${n * j} ${lnU(O)}` : `a scale factor of ${frM(n, d)} from the first to the second`;
      return E.num(`Two similar ${sh} have ${kt}. The first has area ${A1} ${U}. Find the area of the second.`, [{ ans: A2 }], `k = ${kTxt(n, d)}, so areas scale by k² = ${kTxt(n * n, d * d)}: ${A1} × ${kTxt(n * n, d * d)} = ${A2} ${U}. Not just × k: area grows in two directions.`); } },
    c: { t: 'find k from areas', g: (R, O) => {
      const [n, d] = kPair(R), t = R.int(1, 6), A1 = t * d * d, A2 = t * n * n, sh = R.pick(SHAPES), U = sqU(O);
      if (R.bool()) return E.num(`Two similar ${sh} have areas ${A1} ${U} and ${A2} ${U}. Find the scale factor from the first to the second.`, [{ label: 'k =', frac: [n, d], form: 'any' }], `Area ratio = ${A2}/${A1}${t > 1 ? ' = ' + kTxt(n * n, d * d) : ''} = k², so k = √(${kTxt(n * n, d * d)}) = ${kTxt(n, d)}.`);
      const j = R.int(1, 4);
      return E.num(`Two similar ${sh} have areas ${A1} ${U} and ${A2} ${U}. A side of the first is ${d * j} ${lnU(O)}. Find the matching side of the second.`, [{ ans: n * j }], `k² = ${A2}/${A1}${t > 1 ? ' = ' + kTxt(n * n, d * d) : ''}, so k = ${kTxt(n, d)} and the side is ${d * j} × ${kTxt(n, d)} = ${n * j} ${lnU(O)}.`); } },
    d: { t: 'word problems', g: (R, O) => { const kind = R.int(0, 4), imp = unitsOf(O) === 'ft';
      if (kind === 0) { const [n, d] = R.pick([[3, 2], [2, 1], [5, 2], [5, 4], [3, 1], [7, 2]]), c = R.int(2, 12) * d * d, cost = c * n * n / (d * d);
        return E.num(`The glass for a small picture frame costs $${c}. A similar frame is ${nf(n / d)} times as long and as wide. Glass costs the same per square ${imp ? 'inch' : 'centimeter'}. What does its glass cost?`, [{ label: 'cost = $', ans: cost }], `Area scales by k² = ${nf(n / d)}² = ${ok3(n * n / (d * d)) ? nf(n * n / (d * d)) : kTxt(n * n, d * d)}, so $${c} × ${ok3(n * n / (d * d)) ? nf(n * n / (d * d)) : kTxt(n * n, d * d)} = $${cost}.`); }
      if (kind === 1) { let D1, D2; do { D1 = R.pick([6, 8, 9, 10, 12]); D2 = R.pick([10, 12, 14, 15, 16, 18, 20]); } while (D2 <= D1); const g = gcd(D2 * D2, D1 * D1);
        return E.num(`How many times as much pizza is in a ${D2}-inch pizza as in a ${D1}-inch pizza (same thickness)?`, [{ frac: [D2 * D2 / g, D1 * D1 / g], form: 'any' }], `The pizzas are similar with k = ${D2}/${D1}. Area scales by k²: ${D2 * D2}/${D1 * D1} = ${kTxt(D2 * D2 / g, D1 * D1 / g)} ≈ ${(D2 * D2 / (D1 * D1)).toFixed(2)}.`); }
      if (kind === 2) { const s = R.pick([2, 3, 4, 5, 10]), a = R.int(2, 30) / 2, real = cl(a * s * s);
        return E.num(`On a map, 1 cm represents ${s} km. A lake covers ${nf(a)} cm² on the map. What is its real area in km²?`, [{ label: 'area =', ans: real }], `1 cm² on the map is ${s} km × ${s} km = ${s * s} km², so ${nf(a)} × ${s * s} = ${nf(real)} km².`); }
      if (kind === 3) { const k = R.pick([2, 3, 4, 1.5, 2.5]), Lt = R.int(1, 8) / 2, need = cl(Lt * k * k);
        return E.num(`A mural uses ${nf(Lt)} liters of paint. A similar mural is ${nf(k)} times as tall and as wide. How many liters will it need?`, [{ label: 'paint =', ans: need }], `Paint covers area, which scales by k² = ${nf(k * k)}: ${nf(Lt)} × ${nf(k * k)} = ${nf(need)} liters.`); }
      const k = R.pick([2, 3, 4, 1.5, 2.5]), f = R.int(2, 20) * 10, sod = R.int(2, 20) * 10, fence = R.bool();
      return E.num(`A garden's fence costs $${f} and its sod costs $${sod}. A similar garden has every length multiplied by ${nf(k)}. What does its ${fence ? 'fence' : 'sod'} cost?`, [{ label: 'cost = $', ans: cl(fence ? f * k : sod * k * k) }], fence ? `A fence runs along the perimeter, which scales by k: $${f} × ${nf(k)} = $${nf(f * k)}.` : `Sod covers the area, which scales by k² = ${nf(k * k)}: $${sod} × ${nf(k * k)} = $${nf(sod * k * k)}.`); } },
    e: { t: 'a parallel cut: triangle and trapezoid', g: R => {
      let m, n; do { m = R.int(1, 5); n = R.int(1, 5); } while (gcd(m, n) > 1 || m + n > 8); const t = R.int(1, 6), tot = (m + n) * (m + n) * t, sm = m * m * t, tr = tot - sm, kind = R.int(0, 3);
      const T = randTri(R).t, pts = { ...T, D: lerp(T.A, T.B, m / (m + n)), E: lerp(T.A, T.C, m / (m + n)) };
      const { rn, vis } = prep(R, { pts, segs: [['A', 'D', { lab: String(m) }], ['D', 'B', { lab: String(n) }], ['A', 'E'], ['E', 'C'], ['B', 'C'], ['D', 'E']], arrows: [['D', 'E', 1], ['B', 'C', 1]], label: 'triangle cut by a line parallel to its base' });
      const giv = [`△ABC has area ${tot}`, `△ABC has area ${tot}`, `the trapezoid DBCE has area ${tr}`, `△ADE has area ${sm}`][kind], ask = ['the trapezoid DBCE', '△ADE', '△ABC', 'the trapezoid DBCE'][kind], ans = [tr, sm, tot, tr][kind];
      return E.num(rn(`DE ∥ BC and ${giv}. Find the area of ${ask}. (Not drawn to scale.)`), [{ ans }],
        rn(`△ADE ∼ △ABC with k = AD/AB = ${m}/${m + n}, so their areas are in the ratio ${m * m} : ${(m + n) * (m + n)}. The trapezoid is the rest: ${(m + n) * (m + n)} − ${m * m} = ${(m + n) * (m + n) - m * m} parts. One part is ${t}, so the answer is ${ans}.`), { visual: vis }); } },
    f: { t: 'areas hiding in a figure', g: R => {
      if (R.bool()) { let a, b; do { a = R.int(1, 7); b = R.int(2, 9); } while (a >= b); const kind = R.int(0, 2), u = R.int(8, 12) / 10, sx = R.int(-5, 15) / 10, h = R.int(28, 40) / 10;
        const A = [0, 0], B = [b * u, 0], D = [sx, h], Cc = [sx + a * u, h], O_ = lerp(A, Cc, b / (a + b)), cen = (...P) => [P.reduce((s, p) => s + p[0], 0) / P.length, P.reduce((s, p) => s + p[1], 0) / P.length];
        const po = P => add(O_, mul(sub(P, O_), 1.12)), pts = { A, B, C: Cc, D, O: O_, _t1: po(cen(A, B, O_)), _t2: po(cen(D, Cc, O_)), _t3: po(cen(A, O_, D)), _t4: po(cen(B, Cc, O_)) };
        const tx = kind === 0 ? [['_t1', String(b * b)], ['_t2', String(a * a)]] : kind === 1 ? [['_t1', String(b * b)], ['_t2', String(a * a)], ['_t3', '?']] : [['_t1', String(b * b)], ['_t3', String(a * b)], ['_t2', '?']];
        const { rn, vis } = prep(R, { pts, segs: [['A', 'B'], ['B', 'C'], ['C', 'D'], ['D', 'A'], ['A', 'O'], ['O', 'C'], ['B', 'O'], ['O', 'D']], arrows: [['A', 'B', 1, 0.22], ['D', 'C', 1, 0.22]], text: tx.map(([k, s]) => [k, s, { fill: C.blue }]), w: 300, label: 'trapezoid with its diagonals' });
        const q = [`△ABO and △CDO have areas ${b * b} and ${a * a}. Find the area of the whole trapezoid.`, `△ABO and △CDO have areas ${b * b} and ${a * a}. Find the area of △AOD.`, `△ABO has area ${b * b} and △AOD has area ${a * b}. Find the area of △CDO.`][kind];
        return E.num(rn(`ABCD is a trapezoid with AB ∥ DC, and its diagonals meet at O. ${q}`), [{ ans: [(a + b) * (a + b), a * b, a * a][kind] }],
          rn(`△CDO ∼ △ABO (AA), with ratio ${kind === 2 ? `DO/BO = ${a * b}/${b * b} = ${kTxt(a, b)} (△AOD and △AOB share a height)` : `√(${a * a}/${b * b}) = ${kTxt(a, b)}`}. So DO/BO = ${kTxt(a, b)} and △AOD = ${b * b} × ${kTxt(a, b)} = ${a * b}; △BOC is the same. ${kind === 0 ? `Total: ${b * b} + ${a * a} + 2 × ${a * b} = ${(a + b) * (a + b)}.` : kind === 2 ? `△CDO = ${a * b} × ${kTxt(a, b)} = ${a * a}.` : ''}`).trim(), { visual: vis }); }
      let a, b, c; do { a = R.int(1, 6); b = R.int(1, 6); c = R.int(1, 6); } while (new Set([a, b, c]).size < 2); const s = a + b + c, u = a / s, v = b / s, w = c / s, T = randTri(R).t, missing = R.bool(0.35);
      const P = add(add(mul(T.A, u), mul(T.B, v)), mul(T.C, w)), pa = [add(P, mul(sub(T.B, T.A), u)), add(P, mul(sub(T.C, T.A), u))], pb = [add(P, mul(sub(T.A, T.B), v)), add(P, mul(sub(T.C, T.B), v))], pc = [add(P, mul(sub(T.A, T.C), w)), add(P, mul(sub(T.B, T.C), w))];
      const cen = (...Q) => [Q.reduce((z, p) => z + p[0], 0) / 3, Q.reduce((z, p) => z + p[1], 0) / 3];
      const pts = { ...T, _P: P, _a1: pa[0], _a2: pa[1], _b1: pb[0], _b2: pb[1], _c1: pc[0], _c2: pc[1], _ta: cen(P, ...pa), _tb: cen(P, ...pb), _tc: cen(P, ...pc) };
      const tx = [['_ta', missing ? '?' : String(a * a)], ['_tb', String(b * b)], ['_tc', String(c * c)]];
      const { vis } = prep(R, { pts, segs: [['A', 'B'], ['B', 'C'], ['C', 'A'], ['_P', '_a1'], ['_P', '_a2'], ['_P', '_b1'], ['_P', '_b2'], ['_P', '_c1'], ['_P', '_c2']], polys: [], text: tx.map(([k, s2]) => [k, s2, { fill: C.blue, size: 13 }]), w: 300, label: 'triangle with lines through an inside point parallel to its sides' });
      if (missing) return E.num(`Through a point inside a triangle of area ${s * s}, lines are drawn parallel to the sides. Two of the small corner-free triangles have areas ${b * b} and ${c * c}. Find the area of the third (marked ?).`, [{ ans: a * a }],
        `Each small triangle is similar to the big one, with ratio √(its area ÷ ${s * s}). Their bases together fill one side, so the ratios add to 1: √x/${s} + ${b}/${s} + ${c}/${s} = 1, so √x = ${a} and x = ${a * a}.`, { visual: vis });
      return E.num(`Through a point inside a triangle, lines are drawn parallel to the three sides. The three small triangles that touch the point have areas ${a * a}, ${b * b} and ${c * c}. Find the area of the whole triangle.`, [{ ans: s * s }],
        `Each small triangle is similar to the whole, with ratio √(its area/T). Their bases together fill one side of the big triangle, so √${a * a} + √${b * b} + √${c * c} = √T: √T = ${s} and T = ${s * s}.`, { visual: vis }); } },
  });

  /* ================= V.5.11 Volume ratios ================= */
  const SOLIDS = [['cylinders', 'heights'], ['cones', 'radii'], ['square pyramids', 'heights'], ['cubes', 'edges'], ['spheres', 'radii'], ['rectangular prisms', 'lengths'], ['statues', 'heights']];
  const cuU = O => unitsOf(O) === 'ft' ? 'in³' : 'cm³';
  const kPair3 = R => { let n, d; do { n = R.int(1, 5); d = R.int(1, 5); } while (n === d || gcd(n, d) > 1 || n * d > 12); return [n, d]; };
  S('V.5.11', 'Volume ratios', {
    a: { t: 'volume ratio = k³', g: (R, O) => {
      const [n, d] = kPair3(R), t = R.int(1, 6), j = R.int(1, 4), [sol, dim] = R.pick(SOLIDS), V1 = t * d ** 3, V2 = t * n ** 3, U = cuU(O);
      return E.num(`Two similar ${sol} have ${dim} ${d * j} ${lnU(O)} and ${n * j} ${lnU(O)}. The first has volume ${V1} ${U}. Find the volume of the second.`, [{ ans: V2 }], `k = ${n * j}/${d * j} = ${kTxt(n, d)}, and volume scales by k³ = ${kTxt(n ** 3, d ** 3)}: ${V1} × ${kTxt(n ** 3, d ** 3)} = ${V2} ${U}.`); } },
    b: { t: 'surface area = k²', g: (R, O) => {
      const [n, d] = kPair3(R), t = R.int(1, 9), j = R.int(1, 4), [sol, dim] = R.pick(SOLIDS), A1 = t * d * d, A2 = t * n * n, U = sqU(O);
      if (R.bool(0.3)) { const V1 = R.int(1, 5) * d ** 3; return E.num(`Two similar ${sol} have ${dim} ${d * j} ${lnU(O)} and ${n * j} ${lnU(O)}. The first has surface area ${A1} ${U} and volume ${V1} ${cuU(O)}. Find the surface area of the second.`, [{ ans: A2 }], `Surface area is an area, so it scales by k² = (${kTxt(n, d)})² = ${kTxt(n * n, d * d)}: ${A1} × ${kTxt(n * n, d * d)} = ${A2} ${U}. The volume is not needed.`); }
      return E.num(`Two similar ${sol} have ${dim} ${d * j} ${lnU(O)} and ${n * j} ${lnU(O)}. The first has surface area ${A1} ${U}. Find the surface area of the second.`, [{ ans: A2 }], `k = ${kTxt(n, d)}, and surface area scales by k² = ${kTxt(n * n, d * d)}: ${A1} × ${kTxt(n * n, d * d)} = ${A2} ${U}.`); } },
    c: { t: 'find k from volumes', g: (R, O) => {
      const [n, d] = kPair3(R), t = R.int(1, 4), V1 = t * d ** 3, V2 = t * n ** 3, [sol] = R.pick(SOLIDS), U = cuU(O), kind = R.int(0, 2);
      if (kind === 0) return E.num(`Two similar ${sol} have volumes ${V1} ${U} and ${V2} ${U}. Find the scale factor from the first to the second.`, [{ label: 'k =', frac: [n, d], form: 'any' }], `${V2}/${V1}${t > 1 ? ' = ' + kTxt(n ** 3, d ** 3) : ''} = k³, so k = ∛(${kTxt(n ** 3, d ** 3)}) = ${kTxt(n, d)}.`);
      if (kind === 1) return E.num(`Two similar ${sol} have volumes ${V1} ${U} and ${V2} ${U}. Find the ratio of their surface areas (second ÷ first).`, [{ frac: [n * n, d * d], form: 'any' }], `k³ = ${kTxt(n ** 3, d ** 3)}, so k = ${kTxt(n, d)} and the surface areas are in the ratio k² = ${kTxt(n * n, d * d)}.`);
      const j = R.int(1, 5);
      return E.num(`Two similar ${sol} have volumes ${V1} ${U} and ${V2} ${U}. The first is ${d * j} ${lnU(O)} tall. How tall is the second?`, [{ ans: n * j }], `k³ = ${V2}/${V1}${t > 1 ? ' = ' + kTxt(n ** 3, d ** 3) : ''}, so k = ${kTxt(n, d)} and the height is ${d * j} × ${kTxt(n, d)} = ${n * j} ${lnU(O)}.`); } },
    d: { t: "why giants can't exist", g: R => {
      const k = R.int(2, 12), q = R.int(0, 4), [who, base] = R.pick([['giant', 'a real person'], ['giant ant', 'a real ant'], ['giant spider', 'a real spider'], ['giant horse', 'a real horse']]);
      const Q = [['its weight', k ** 3, `Weight follows volume, which scales by k³ = ${k}³ = ${k ** 3}.`], ['the cross-section area of its bones (their strength)', k * k, `A cross-section is an area, so it scales by k² = ${k}² = ${k * k}.`],
        ['the pressure on its bones (weight per square unit of bone)', k, `Weight grows by ${k}³ = ${k ** 3} but bone area only by ${k}² = ${k * k}, so pressure grows by ${k ** 3}/${k * k} = ${k}. That is why bones would snap.`], ['its skin area', k * k, `Skin is a surface, so it scales by k² = ${k * k}.`]];
      if (q === 4) return E.num(`A ${who} has the same shape as ${base} but is ${k} times as tall. Its surface area ÷ volume is what fraction of the original's?`, [{ frac: [1, k], form: 'any' }], `Surface area scales by ${k}² and volume by ${k}³, so their ratio scales by ${k}²/${k}³ = 1/${k}. A giant has far less skin for its bulk, so it cannot cool down well.`);
      const [what, ans, why] = Q[q];
      return E.num(`A ${who} has exactly the same shape as ${base} but is ${k} times as tall. How many times as great is ${what}?`, [{ ans }], why); } },
  });

  /* ================= V.5.12 Indirect measurement ================= */
  const THINGS = ['tree', 'flagpole', 'building', 'lamp post', 'tower', 'statue'];
  const NDS = ' (Not drawn to scale.)', tiny = (h, H) => h < 0.3 * H;
  const shadowFig = (h0, s0, H, S, labs) => { const h = Math.max(h0, 0.3 * H), s = s0 * h / h0, sc = 6 / Math.max(H, S + s + 2, h); const g = 0.7 * Math.max(s, 1);
    const P = { _p0: [0, 0], _p1: [0, h], _p2: [s, 0], _t0: [s + g, 0], _t1: [s + g, H], _t2: [s + g + S, 0] }, Q = {}; for (const k in P) Q[k] = mul(P[k], sc);
    return fig({ pts: Q, center: mul([s + g / 2, Math.min(h, H) / 2], sc), segs: [['_p0', '_p1', { lab: labs.h }], ['_p0', '_p2', { lab: labs.s }], ['_p1', '_p2', { dash: true }], ['_t0', '_t1', { lab: labs.H }], ['_t0', '_t2', { lab: labs.S }], ['_t1', '_t2', { dash: true }]],
      angles: [['_p1', '_p0', '_p2', '', { right: true }], ['_t1', '_t0', '_t2', '', { right: true }]], w: 300, label: 'a person and a tall object with their shadows' }); };
  const shadowNums = (R, O) => { const imp = unitsOf(O) === 'ft'; let h, s, S, H, r;
    do { h = imp ? R.pick([5, 5.5, 6, 6.5]) : R.pick([1.5, 1.6, 1.7, 1.8, 1.75, 1.65]); r = R.pick([[1, 2], [3, 2], [2, 1], [5, 4], [4, 5], [3, 4], [6, 5], [5, 2], [2, 3]]); s = cl(h * r[0] / r[1]); S = (imp ? R.int(4, 40) * 2 : R.int(4, 40)) * r[0] / (r[1] > 3 ? 1 : 1); S = cl(S); H = cl(S * r[1] / r[0]); }
    while (!ok3(s) || !ok3(H) || !ok3(S) || H < 3 * h || H > 60 * (imp ? 3 : 1));
    return { h, s, S, H, r, u: imp ? 'ft' : 'm' }; };
  S('V.5.12', 'Indirect measurement', {
    a: { t: 'shadows', g: (R, O) => {
      const { h, s, S: Sh, H, u } = shadowNums(R, O), th = R.pick(THINGS), ask = R.int(0, 2) === 0 ? 'S' : 'H', labs = { h: `${nf(h)} ${u}`, s: `${nf(s)} ${u}`, H: ask === 'H' ? 'x' : `${nf(H)} ${u}`, S: ask === 'S' ? 'x' : `${nf(Sh)} ${u}` };
      const vis = shadowFig(h, s, H, Sh, labs), nds = tiny(h, H) ? NDS : '';
      if (ask === 'S') return E.num(`A ${nf(h)} ${u} person casts a ${nf(s)} ${u} shadow. At the same time a ${nf(H)} ${u} ${th} casts a shadow x long. Find x.${nds}`, [{ label: 'x =', ans: Sh }], `height/shadow is the same for both: ${nf(h)}/${nf(s)} = ${nf(H)}/x, so x = ${nf(H)} × ${nf(s)}/${nf(h)} = ${nf(Sh)} ${u}.`, { visual: vis });
      return E.num(`A ${nf(h)} ${u} person casts a ${nf(s)} ${u} shadow. At the same time a ${th} casts a ${nf(Sh)} ${u} shadow. How tall is the ${th}?${nds}`, [{ label: 'height =', ans: H }], `The sun's rays make similar triangles: height/shadow = ${nf(h)}/${nf(s)} = x/${nf(Sh)}, so x = ${nf(Sh)} × ${nf(h)}/${nf(s)} = ${nf(H)} ${u}.`, { visual: vis }); } },
    b: { t: 'mirrors', g: (R, O) => {
      const imp = unitsOf(O) === 'ft', u = imp ? 'ft' : 'm'; let e, d1, d2, H;
      do { e = imp ? R.pick([4.5, 5, 5.5, 6]) : R.pick([1.4, 1.5, 1.6, 1.8, 1.2]); d1 = imp ? R.int(3, 10) : R.int(4, 20) / 2; d2 = imp ? R.int(10, 80) : R.int(5, 60); H = cl(e * d2 / d1); } while (!ok3(H) || H < 2 * e || H > (imp ? 150 : 50));
      const ask = R.pick(['H', 'H', 'd2']), ep = Math.max(e, 0.3 * H), dp = d1 * ep / e, nds = tiny(e, H) ? NDS : '', sc = 6 / Math.max(dp + d2, H), P = { _p0: [0, 0], _p1: [0, ep], M: [dp, 0], _b0: [dp + d2, 0], _b1: [dp + d2, H] }, Q = {}; for (const k in P) Q[k] = mul(P[k], sc);
      const labs = { e: `${nf(e)} ${u}`, d1: `${nf(d1)} ${u}`, d2: ask === 'd2' ? 'x' : `${nf(d2)} ${u}`, H: ask === 'H' ? 'x' : `${nf(H)} ${u}` };
      const vis = fig({ pts: Q, center: mul([dp, Math.min(ep, H) / 2], sc), segs: [['_p0', '_p1', { lab: labs.e }], ['_p0', 'M', { lab: labs.d1 }], ['M', '_b0', { lab: labs.d2 }], ['_b0', '_b1', { lab: labs.H }], ['_p1', 'M', { dash: true }], ['M', '_b1', { dash: true }]],
        angles: [['_p1', 'M', '_p0', '', { n: 1 }], ['_b1', 'M', '_b0', '', { n: 1 }], ['_p1', '_p0', 'M', '', { right: true }], ['M', '_b0', '_b1', '', { right: true }]], w: 300, label: 'a mirror on the ground reflecting the top of a building' });
      if (ask === 'd2') return E.num(`A mirror M lies on the ground ${nf(d1)} ${u} from a person whose eyes are ${nf(e)} ${u} high. How far from a ${nf(H)} ${u} building must the mirror be for the person to see its top in it?${nds}`, [{ label: 'x =', ans: d2 }], `Light reflects at equal angles, so the triangles are similar: ${nf(e)}/${nf(d1)} = ${nf(H)}/x, so x = ${nf(H)} × ${nf(d1)}/${nf(e)} = ${nf(d2)} ${u}.`, { visual: vis });
      return E.num(`A person sees the top of a building in a mirror M on the ground. Their eyes are ${nf(e)} ${u} high, they stand ${nf(d1)} ${u} from the mirror, and the mirror is ${nf(d2)} ${u} from the building. How tall is the building?${nds}`, [{ label: 'height =', ans: H }], `The angles at the mirror are equal, so the right triangles are similar: x/${nf(d2)} = ${nf(e)}/${nf(d1)}, so x = ${nf(d2)} × ${nf(e)}/${nf(d1)} = ${nf(H)} ${u}.`, { visual: vis }); } },
    c: { t: 'across a river', g: (R, O) => {
      const u = unitsOf(O); let n, d, a, j; do { [n, d] = R.pick([[1, 2], [2, 3], [3, 2], [3, 4], [4, 3], [5, 2], [2, 5], [5, 3], [3, 5], [5, 4], [4, 5]]); a = d * R.int(2, 12); j = R.int(2, 8); } while (a * n / d < 6 || a > 60);
      const b = d * j, c = n * j, w = cl(a * n / d), pts = { P: [0, w], Q: [0, 0], C: [a, 0], D: [a + b, 0], E: [a + b, -c] };
      const { rn, vis } = prep(R, { pts, segs: [['P', 'Q', { lab: 'x', dash: true }], ['Q', 'C', { lab: `${a}` }], ['C', 'D', { lab: `${b}` }], ['D', 'E', { lab: `${c}` }], ['P', 'C'], ['C', 'E']], angles: [['P', 'Q', 'C', '', { right: true }], ['C', 'D', 'E', '', { right: true }]], label: 'measuring across a river with two right triangles' });
      return E.num(rn(`To measure the river width x = PQ, a surveyor marks C and D along the bank and walks from D at a right angle to E, where P, C and E line up. QC = ${a} ${u}, CD = ${b} ${u}, DE = ${c} ${u}. Find x.`), [{ label: 'x =', ans: w }],
        rn(`△PQC ∼ △EDC: right angles at Q and D, and vertical angles at C. So PQ/ED = QC/DC: x/${c} = ${a}/${b}, so x = ${c} × ${a}/${b} = ${nf(w)} ${u}.`), { visual: vis }); } },
    d: { t: 'check the answer is sensible', g: (R, O) => {
      const { h, s, S: Sh, H, r, u } = shadowNums(R, O), th = R.pick(THINGS), rt = kTxt(r[1], r[0]), f = x => `${+x.toFixed(2)} ${u}`;
      const W = [h * s / Sh, Sh * s / h, Sh], opts = []; W.forEach(x => { if (Math.abs(x - H) > 0.05 && !opts.some(y => Math.abs(y - x) < 0.05)) opts.push(x); });
      const nm = R.pick(['Ava', 'Ben', 'Kai', 'Mia', 'Leo', 'Zoe']), longer = s > h;
      return E.choice(R, `${nm} is ${nf(h)} ${u} tall and casts a ${nf(s)} ${u} shadow. At the same moment a ${th} casts a ${nf(Sh)} ${u} shadow. Which answer for the ${th}'s height makes sense?${tiny(h, H) ? NDS : ''}`, f(H), opts.map(f),
        `${nm}'s shadow is ${longer ? 'longer' : 'shorter'} than ${nm} (height ÷ shadow = ${nf(h)}/${nf(s)} = ${rt}), so the ${th} must be ${longer ? 'shorter' : 'taller'} than its shadow, with the same ratio: ${rt} × ${nf(Sh)} = ${nf(H)} ${u}. ${f(h * s / Sh)} is shorter than a person, and ${f(Sh * s / h)} or ${f(Sh)} break the shadow pattern.`, { visual: shadowFig(h, s, H, Sh, { h: `${nf(h)} ${u}`, s: `${nf(s)} ${u}`, S: `${nf(Sh)} ${u}`, H: '?' }) }); } },
  });
})(typeof window !== 'undefined' ? window : globalThis);
