/* Era V · Unit V.4 Polygons (V.4.01–V.4.09) */
(function (G) {
  const E = G.E5, V = E.V, C = E.C, M = s => E.mx(s), K = E.K;
  const S = (id, name, steps) => E.skill({ id, name, steps });
  const { rad, dist, lerp, mid, add, sub, mul, unit, polar, ang3, xform, spin, POOL, lets, rnF, renamePts, fig, orderQ } = K;

  /* ================= small helpers ================= */
  const deg = n => `${n}°`;
  const YN = { choices: ['Yes', 'No'] };
  const yn = (prompt, yes, explain, extra = {}) => E.tf(prompt, yes, explain, Object.assign({}, YN, extra));
  const PNAME = { 3: 'triangle', 4: 'quadrilateral', 5: 'pentagon', 6: 'hexagon', 7: 'heptagon', 8: 'octagon', 9: 'nonagon', 10: 'decagon', 12: 'dodecagon' };
  const nName = n => PNAME[n] || `${n}-gon`;
  const an = w => (/^[aeiou]/i.test(w) || /^(8|11|18|8\d)(\D|$)/.test(w)) ? 'an' : 'a';
  const regName = n => n === 3 ? 'equilateral triangle' : n === 4 ? 'square' : 'regular ' + nName(n);
  const aN = n => `${an(nName(n))} ${nName(n)}`;
  const lin = (p, q) => `${p === 1 ? '' : p}x${q ? (q > 0 ? ' + ' + q : ' − ' + -q) : ''}`;       // label text 3x + 5
  const linM = (p, q) => `${p === 1 ? '' : p}x${q ? (q > 0 ? '+' + q : q) : ''}`;               // M() text 3x+5
  const aT = e => `(${M(linM(...e))})°`;                                                      // (3x+5)° in a prompt
  const angLab = (p, q) => q ? `(${lin(p, q)})°` : `${lin(p, q)}°`;
  // an expression px + q worth `val` at x; two of them with different p
  const exAt = (R, val, x, hi = 5) => { for (let t = 0; t < 60; t++) { const p = R.int(1, hi), q = val - p * x; if (q !== 0 && Math.abs(q) <= 45) return [p, q]; } return [1, val - x]; };
  const exPair = (R, val, x, hi = 5) => { const A = exAt(R, val, x, hi); for (let t = 0; t < 60; t++) { const B = exAt(R, val, x, hi); if (B[0] !== A[0]) return R.bool() ? [A, B] : [B, A]; } return [A, [A[0] + 1, val - (A[0] + 1) * x]]; };
  const sumTxt = (e1, e2, rhs) => `${M(`(${linM(...e1)})+(${linM(...e2)})=${rhs}`)}, so ${M(linM(e1[0] + e2[0], e1[1] + e2[1]) + '=' + rhs)}`;
  const solveTxt = (A, B, rhs) => `${M(linM(...A) + '=' + (B ? linM(...B) : rhs))}`;
  const loop = ns => ns.map((a, i) => [a, ns[(i + 1) % ns.length]]);
  const consec = (R, n) => { const st = ['A', 'A', 'P', 'J', 'K', 'D', 'L'].map(c => POOL.indexOf(c)).filter(i => i + n <= POOL.length), i = R.pick(st); return POOL.slice(i, i + n); };
  const sumPts = ps => ps.reduce((s, p) => add(s, p), [0, 0]);
  const avgPt = ps => mul(sumPts(ps), 1 / ps.length);

  /* ================= polygons ================= */
  const reg = (n, r = 1, rot = 0) => Array.from({ length: n }, (_, k) => polar(r, rot + 360 * k / n));
  // a convex (cyclic) polygon whose arcs are even degrees, so every interior angle is a whole number
  const cyc = (R, n) => {
    const lo = 2 * Math.ceil(0.3 * 360 / n), hi = 2 * Math.floor(0.72 * 360 / n); let g;
    do { g = Array.from({ length: n - 1 }, () => 2 * R.int(lo / 2, hi / 2)); g.push(360 - g.reduce((s, v) => s + v, 0)); } while (g[n - 1] < lo || g[n - 1] > hi);
    const th = [R.int(0, 71) * 5]; for (let i = 1; i < n; i++) th.push(th[i - 1] + g[i - 1]);
    const pts = th.map(t => polar(1, t)), ext = pts.map((p, i) => (g[(i + n - 1) % n] + g[i]) / 2);
    return { pts, ext, int: ext.map(e => 180 - e) };
  };
  const polyFig = (names, pts, o = {}) => { const P = {}; names.forEach((k, i) => P[k] = pts[i]); Object.assign(P, o.more || {});
    return fig({ pts: P, segs: loop(names).map(([a, b]) => [a, b]).concat(o.segs || []), angles: o.angles, polys: o.polys, text: o.text, w: o.w || 260, label: o.label || 'polygon' }); };
  const REGN = [3, 4, 5, 6, 8, 9, 10, 12, 15, 18, 20, 24, 30, 36];               // regular polygons with whole-degree angles
  const intA = n => 180 - 360 / n;

  /* ================= quadrilaterals (canonical A, B, C, D counterclockwise; E = where the diagonals meet) ================= */
  const QSETS = ['ABCD', 'ABCD', 'PQRS', 'JKLM', 'WXYZ', 'EFGH', 'KLMN', 'RSTU', 'DEFG', 'LMNP'];
  const qmap = (R, withE) => { const L = R.bool(0.8) ? R.pick(QSETS).split('') : lets(R, 4), m = { A: L[0], B: L[1], C: L[2], D: L[3] }; if (withE) m.E = R.pick(POOL.filter(c => !L.includes(c))); return m; };
  const gram = (p, q, al) => { const D = polar(q, al); return { A: [0, 0], B: [p, 0], C: [p + D[0], D[1]], D }; };      // AB = p, AD = q, ∠A = al
  const byDiag = (ae, ec, be, ed, phi) => ({ A: polar(ae, 180), B: polar(be, 180 + phi), C: polar(ec, 0), D: polar(ed, phi), E: [0, 0] });
  const isoTrap = (b1, b2, th) => { const off = (b1 - b2) / 2, h = off * Math.tan(rad(th)); return { A: [0, 0], B: [b1, 0], C: [b1 - off, h], D: [off, h] }; };
  const trap = (b1, b2, h, s) => ({ A: [0, 0], B: [b1, 0], C: [s + b2, h], D: [s, h] });
  const kiteP = (ae, ce, be) => ({ A: [0, ae], B: [-be, 0], C: [0, -ce], D: [be, 0], E: [0, 0] });
  const rectP = (w, h) => ({ A: [0, 0], B: [w, 0], C: [w, h], D: [0, h] });
  // o: {lab:{AB:'5'}, tk:{AB:1}, dash:['AC'], diag:'E' | 'AC' | 'AC,BD', segs:[['A','_x']], skip:['BC'], arr:[[a,b,n,t]], ang:[[p,v,q,label,op]], polys, text:[['_t','s']], fixed, w}
  const qfig = (R, P0, map, o = {}) => {
    const mm = k => k[0] === '_' ? k : (map[k] || k), P = renamePts(o.fixed ? P0 : spin(R, P0), new Proxy(map, { get: (t, k) => t[k] || k }));
    const side = s => { const [a, b] = Array.isArray(s) ? s : [s[0], s.slice(1)], k1 = a + b, k2 = b + a, tk = o.tk || {}, lb = o.lab || {};
      return [mm(a), mm(b), { ticks: tk[k1] || tk[k2], lab: lb[k1] ?? lb[k2], dash: (o.dash || []).includes(k1) || (o.dash || []).includes(k2) }]; };
    const segs = ['AB', 'BC', 'CD', 'DA'].filter(s => !(o.skip || []).includes(s)).map(side);
    if (o.diag === 'E') segs.push(...['AE', 'EC', 'BE', 'ED'].map(side)); else if (o.diag) segs.push(...o.diag.split(',').map(side));
    (o.segs || []).forEach(s => segs.push(side(s)));
    return fig({ pts: P, segs, angles: (o.ang || []).map(([p, v, q, l, op]) => [mm(p), mm(v), mm(q), l, op]), arrows: (o.arr || []).map(([a, b, n, t]) => [mm(a), mm(b), n, t]),
      polys: o.polys && o.polys.map(pl => pl.map(x => typeof x === 'string' ? mm(x) : x)), text: o.text && o.text.map(([k, s, op]) => [P[mm(k)], s, op]), w: o.w || 270, label: o.label || 'quadrilateral' });
  };
  const ARR2 = [['A', 'B', 1], ['D', 'C', 1], ['A', 'D', 2], ['B', 'C', 2]];
  const randAl = R => R.bool() ? R.int(52, 76) : R.int(104, 128);
  const qn = map => map.A + map.B + map.C + map.D;

  /* ================= V.4.01 Interior angle sums ================= */
  // convex polygons whose angles form an arithmetic sequence, where the quadratic for n has two whole roots and only the smaller works
  const APS = []; for (let s = 60; s < 180; s++) for (let d = 2; d <= 30; d++) { const B = 2 * s - d - 360, disc = B * B - 2880 * d; if (disc <= 0) continue; const q = Math.round(Math.sqrt(disc)); if (q * q !== disc) continue;
    const n1 = (-B - q) / (2 * d), n2 = (-B + q) / (2 * d), ok = n => s + (n - 1) * d < 180; if (Number.isInteger(n1) && Number.isInteger(n2) && n1 >= 4 && n2 <= 50 && ok(n1) && !ok(n2)) APS.push([s, d, n1, n2]); }
  // two regular polygons on either side of a shared side, whose gap at a shared vertex is between 20° and 170°
  const PAIRS = []; [3, 4, 5, 6, 8, 9, 10, 12].forEach(a => [3, 4, 5, 6, 8, 9, 10, 12].forEach(b => { const gap = 360 - intA(a) - intA(b); if (a <= b && gap > 20 && gap < 170) PAIRS.push([a, b, gap]); }));
  S('V.4.01', 'Interior angle sums', {
    a: { t: 'split into triangles', g: R => { const kind = R.int(0, 2);
      if (kind === 2) { const t = R.int(2, 10), n = t + 2;
        return E.num(`The diagonals from one vertex split a polygon into ${t} triangles. How many sides does the polygon have?`, [{ label: 'sides =', ans: n }], `A polygon with n sides splits into n − 2 triangles from one vertex, so n − 2 = ${t} and n = ${n}.`); }
      const n = R.int(4, 10), { pts } = cyc(R, n), L = lets(R, 1)[0], names = [L, ...Array.from({ length: n - 1 }, (_, i) => '_' + i)];
      const diags = []; for (let j = 2; j <= n - 2; j++) diags.push([L, names[j], { dash: true }]);
      const vis = polyFig(names, pts, { segs: diags, label: `${nName(n)} split into triangles` });
      if (kind === 0) return E.num(`The dashed diagonals from ${L} split this ${nName(n)} into triangles. How many triangles are there?`, [{ label: 'triangles =', ans: n - 2 }],
        `${n} sides give ${n} − 2 = ${n - 2} triangles: the two sides at ${L} are not diagonals, so only ${n - 3} diagonals can be drawn from ${L}.`, { visual: vis });
      return E.num(`The dashed diagonals from ${L} split this ${nName(n)} into triangles. Use them to find the sum of its interior angles.`, [{ label: 'sum =', ans: (n - 2) * 180 }],
        `There are ${n} − 2 = ${n - 2} triangles (not ${n}), and their angles make up exactly the polygon's angles: ${n - 2} × 180° = ${(n - 2) * 180}°.`, { visual: vis }); } },
    b: { t: '(n − 2)·180°', g: R => {
      if (R.bool(0.45)) { const n = R.int(5, 22);
        return E.num(`Find the sum of the interior angles of ${aN(n)}.`, [{ label: 'sum =', ans: (n - 2) * 180 }], `(n − 2)·180° = (${n} − 2) × 180° = ${(n - 2) * 180}°. Use n − 2, not n: ${n} × 180° would be too big.`); }
      const n = R.int(4, 6), poly = cyc(R, n), names = consec(R, n), miss = R.int(0, n - 1), x = poly.int[miss];
      const angles = names.map((v, i) => [names[(i + n - 1) % n], v, names[(i + 1) % n], i === miss ? 'x°' : deg(poly.int[i])]);
      const others = poly.int.filter((_, i) => i !== miss), tot = (n - 2) * 180;
      return E.num(`Find x in ${an(nName(n))} ${nName(n)} ${names.join('')}.`, [{ label: 'x =', ans: x }], `The angles add to (${n} − 2) × 180° = ${tot}°, so x = ${tot} − ${others.join(' − ')} = ${x}.`,
        { visual: polyFig(names, poly.pts, { angles, w: 270, label: nName(n) + ' with its angles' }) }); } },
    c: { t: 'one angle of a regular polygon', g: R => { const kind = R.int(0, 2);
      if (kind === 0) { const n = R.pick(REGN.slice(2)), named = R.bool() && PNAME[n];
        return E.num(`Find the size of each interior angle of a regular ${named ? nName(n) : n + '-gon'}.`, [{ label: 'angle =', ans: intA(n) }], `The angles add to (${n} − 2) × 180° = ${(n - 2) * 180}°, shared equally by ${n} angles: ${(n - 2) * 180}° ÷ ${n} = ${intA(n)}°.`); }
      if (kind === 1) { const n = R.pick(REGN.slice(3)), tot = (n - 2) * 180;
        return E.num(`The interior angles of a regular polygon add to ${tot}°. How big is each angle?`, [{ label: 'angle =', ans: intA(n) }], `${tot} = (n − 2) × 180 gives n = ${n} angles, all equal: ${tot}° ÷ ${n} = ${intA(n)}°.`); }
      const n = R.pick([5, 6, 8, 9, 10, 12]), names = n <= 8 ? consec(R, n) : Array.from({ length: n }, (_, i) => '_' + i), k = R.int(0, n - 1);
      const pts = reg(n, 1, R.int(0, 71) * 5), v = n <= 8 ? names[k] : null;
      const vis = polyFig(names, pts, { angles: [[names[(k + n - 1) % n], names[k], names[(k + 1) % n], 'x°']], label: 'regular ' + nName(n) });
      return E.num(`The ${nName(n)} is regular. Find x.`, [{ label: 'x =', ans: intA(n) }], `The ${n} equal angles add to (${n} − 2) × 180° = ${(n - 2) * 180}°, so x = ${(n - 2) * 180} ÷ ${n} = ${intA(n)}.`, { visual: vis }); } },
    d: { t: 'find n from an angle', g: R => { const kind = R.int(0, 2);
      if (kind === 0) { const n = R.pick(REGN), I = intA(n);
        return E.num(`Each interior angle of a regular polygon is ${I}°. How many sides does it have?`, [{ label: 'n =', ans: n }], `Each exterior angle is 180° − ${I}° = ${360 / n}°, and n of them make 360°, so n = 360 ÷ ${360 / n} = ${n}. (Or solve (n − 2)·180 = ${I}n.)`); }
      if (kind === 1) { const n = R.int(5, 26), tot = (n - 2) * 180;
        return E.num(`The interior angles of a polygon add to ${tot}°. How many sides does it have?`, [{ label: 'n =', ans: n }], `(n − 2) × 180 = ${tot}, so n − 2 = ${n - 2} and n = ${n}.`); }
      const yes = R.bool(); let X;
      if (yes) X = intA(R.pick(REGN.filter(n => n >= 5))); else do X = R.int(100, 178); while (360 % (180 - X) === 0);
      const e = 180 - X;
      return yn(`Can a regular polygon have interior angles of ${X}°?`, yes, yes ? `Yes: each exterior angle would be 180° − ${X}° = ${e}°, and 360 ÷ ${e} = ${360 / e} is a whole number, so ${an(regName(360 / e))} ${regName(360 / e)} works.` : `No: each exterior angle would be 180° − ${X}° = ${e}°, but 360 ÷ ${e} is not a whole number, so no number of sides works.`); } },
    e: { t: 'two regular polygons share a side', g: R => { const pr = R.pick(PAIRS), sw = R.bool(), n1 = sw ? pr[1] : pr[0], n2 = sw ? pr[0] : pr[1], gap = pr[2], I1 = intA(n1), I2 = intA(n2);
      const walk = (st, h0, n) => { const ps = [st]; let p = st; for (let k = 0; k < n - 1; k++) { p = add(p, polar(1, h0 + k * 360 / n)); ps.push(p); } return ps; };
      const top = walk([0, 0], 0, n1), bot = walk([1, 0], 180, n2);                   // top: V, W, …, P ; bottom: W, V, Q, …
      const L = lets(R, 4), [Vn, Wn, Pn, Qn] = L, pts = { [Vn]: [0, 0], [Wn]: [1, 0], [Pn]: top[n1 - 1], [Qn]: bot[2] };
      top.slice(2, n1 - 1).forEach((p, i) => pts['_t' + i] = p); bot.slice(3).forEach((p, i) => pts['_b' + i] = p);
      const tn = [Vn, Wn, ...top.slice(2, n1 - 1).map((_, i) => '_t' + i), Pn], bn = [Wn, Vn, Qn, ...bot.slice(3).map((_, i) => '_b' + i)];
      const base = (180 - gap) / 2, askBase = Number.isInteger(base) && R.bool(0.55), P2 = xform(pts, rad(R.int(0, 71) * 5), R.bool());
      const segs = [...loop(tn), ...loop(bn).filter(([a, b]) => !(a === Vn && b === Wn) && !(a === Wn && b === Vn))].map(([a, b]) => [a, b]);
      if (askBase) segs.push([Pn, Qn, { dash: true }]);
      const vis = fig({ pts: P2, segs, angles: [askBase ? [Vn, Pn, Qn, 'x°'] : [Pn, Vn, Qn, 'x°']], w: 300, label: `${regName(n1)} and ${regName(n2)} sharing a side` });
      const both = n1 === n2 ? `Two ${regName(n1)}s share` : `${an(regName(n1)) === 'an' ? 'An' : 'A'} ${regName(n1)} and ${an(regName(n2))} ${regName(n2)} share`;
      if (askBase) return E.num(`${both} side ${Vn}${Wn}. Find x.`, [{ label: 'x =', ans: base }], `At ${Vn}: ∠${Pn}${Vn}${Qn} = 360° − ${I1}° − ${I2}° = ${gap}°. ${Vn}${Pn} = ${Vn}${Wn} = ${Vn}${Qn}, so △${Pn}${Vn}${Qn} is isosceles and x = (180 − ${gap}) ÷ 2 = ${base}.`, { visual: vis });
      return E.num(`${both} side ${Vn}${Wn}. Find x.`, [{ label: 'x =', ans: gap }], `The angles around ${Vn} add to 360°: ${I1}° (${n1 === 4 ? 'square' : nName(n1)}) + ${I2}° (${n2 === 4 ? 'square' : nName(n2)}) + x° = 360°, so x = ${gap}.`, { visual: vis }); } },
    f: { t: 'angles in arithmetic sequence', g: R => { const [s, d, n1, n2] = R.pick(APS), big = s + (n1 - 1) * d, askN = R.bool(0.6);
      const ex = `The angles add to n·${s} + ${d}·n(n − 1)/2 = (n − 2)·180, which gives n = ${n1} or n = ${n2}. With ${n2} sides the largest angle would be ${s} + ${n2 - 1}·${d} = ${s + (n2 - 1) * d}°, too big for a convex polygon, so n = ${n1}`;
      return E.num(`The interior angles of a convex polygon form an arithmetic sequence. The smallest is ${s}° and each angle is ${d}° more than the one before. ${askN ? 'How many sides does the polygon have?' : 'Find the largest angle.'}`,
        [askN ? { label: 'n =', ans: n1 } : { label: 'largest angle =', ans: big }], askN ? ex + '.' : `${ex}, and the largest angle is ${s} + ${n1 - 1}·${d} = ${big}°.`); } },
  });

  /* ================= V.4.02 Exterior angle sum ================= */
  const extFig = (poly, labs, o = {}) => { const n = poly.pts.length, names = poly.pts.map((_, i) => '_v' + i), more = {}, segs = [], angles = [];
    poly.pts.forEach((p, i) => { if (labs[i] === null) return; const prev = poly.pts[(i + n - 1) % n]; more['_x' + i] = add(p, mul(unit(sub(p, prev)), 0.5)); segs.push(['_v' + i, '_x' + i, { width: 1.6 }]); angles.push(['_x' + i, '_v' + i, '_v' + ((i + 1) % n), labs[i]]); });
    (o.int || []).forEach(([i, l]) => angles.push(['_v' + ((i + n - 1) % n), '_v' + i, '_v' + ((i + 1) % n), l, { color: C.blue }]));
    return polyFig(names, poly.pts, { more, segs, angles, w: 280, label: 'polygon with exterior angles' }); };
  const KPAIR = [1, 2, 3, 4, 5, 8, 9, 11, 14, 17];
  // why the exterior angles add to 360°: linear pairs minus the interior sum (a short two-column proof), and the walking-around argument (ordering)
  const extSumQ = R => { const n = R.int(5, 12), tot = n * 180, ins = (n - 2) * 180;
    const L = [['Each interior angle and its exterior angle add to 180°', 'linear pair postulate', []], [`All ${n} interior and exterior angles together add to ${n} × 180° = ${tot}°`, 'addition property of equality', [0]],
      [`The ${n} interior angles add to (${n} − 2) × 180° = ${ins}°`, 'polygon angle sum theorem', []], [`The ${n} exterior angles add to ${tot}° − ${ins}° = 360°`, 'subtraction property of equality', [1, 2]]];
    return pfQ(R, { head: `Prove that the exterior angles of a convex ${nName(n)}, one at each vertex, add to 360°.`, L, ng: 0, ordEx: `The total of all ${n} pairs needs the 180° for each pair, and the last step takes the interior sum, ${ins}°, away from that total. The interior sum can be found at any point before that.` }, R.pick(['order', 'reason', 'reason', 'broken'])); };
  const walkQ = R => { const n = R.int(5, 12), nm = nName(n);
    return orderQ(R, `Why do the exterior angles of a convex ${nm} add to 360°? Put the steps of the walking-around explanation in order.`,
      [`Start at one corner of the ${nm} and walk along a side.`, `At each corner you turn through that corner's exterior angle.`, 'After walking all the way around, you face the way you started.', 'So your total turning is one full turn: 360°.', 'So the exterior angles add to 360°.'],
      [[], [0], [0], [2], [1, 3]], `Facing the starting direction again is what makes the total turning one full turn, and each turn is an exterior angle, so together they show the exterior angles add to 360°. The line about each turn can go anywhere before the last line.`, { fixed: 1 }); };
  S('V.4.02', 'Exterior angle sum', {
    a: { t: 'always 360°', g: R => { if (R.bool(0.35)) return extSumQ(R);
      if (R.bool(0.4)) { const n = R.int(5, 15);
        return E.choice(R, `What is the sum of the exterior angles of a convex ${nName(n)}, one at each vertex?`, '360°', [`${(n - 2) * 180}°`, `${n * 180}°`, `${n * 360}°`],
          `The exterior angles of every convex polygon add to 360°, whatever the number of sides. ${(n - 2) * 180}° is the interior sum.`); }
      const n = R.int(4, 6), poly = cyc(R, n), miss = R.int(0, n - 1), labs = poly.ext.map((e, i) => i === miss ? 'x°' : deg(e)), others = poly.ext.filter((_, i) => i !== miss);
      return E.num(`One exterior angle is drawn at each vertex of this ${nName(n)}. Find x.`, [{ label: 'x =', ans: poly.ext[miss] }], `Exterior angles add to 360°, so x = 360 − ${others.join(' − ')} = ${poly.ext[miss]}.`, { visual: extFig(poly, labs) }); } },
    b: { t: 'walking-around explanation', g: R => { if (R.bool(0.3)) return walkQ(R);
      const kind = R.int(0, 2);
      if (kind === 0) { const n = R.int(4, 7), poly = cyc(R, n), turns = poly.ext.slice(0, n - 1), who = R.pick(['Sam', 'Ana', 'Kofi', 'Mei', 'Leo', 'Ravi']);
        return E.num(`${who} walks once around a park shaped like a convex ${nName(n)}, turning left at each corner. The first ${n - 1} turns are ${turns.map(deg).join(', ')}. How big is the last turn?`, [{ label: 'last turn =', ans: poly.ext[n - 1] }],
          `Back at the start, ${who} faces the same way as at first: one full turn, 360°. So the last turn is 360 − ${turns.join(' − ')} = ${poly.ext[n - 1]}°.`); }
      if (kind === 1) { const n = R.int(5, 20);
        return E.num(`A robot drives once around a convex ${nName(n)}, turning at every corner, and ends up facing the way it started. How many degrees did it turn in total?`, [{ label: 'total turn =', ans: 360 }],
          `Ending up facing the starting direction means exactly one full turn: 360°. Each turn is one exterior angle, so the exterior angles add to 360°.`); }
      const n = R.int(5, 12);
      return E.choice(R, `Why do the exterior angles of a convex ${nName(n)} add to 360°?`, 'Walking around it, you turn by each exterior angle and end up facing the way you started: one full turn.',
        [`Each exterior angle is 360° ÷ ${n}.`, 'The exterior angles add to the same total as the interior angles.', 'Each exterior angle and its interior angle add to 360°.'],
        `Each turn at a corner is an exterior angle, and a full trip around turns you exactly once: 360°. The angles need not be equal, and an exterior angle plus its interior angle is 180°, not 360°.`); } },
    c: { t: 'one exterior angle', g: R => { const kind = R.int(0, 2);
      if (kind === 0) { const n = R.pick([3, 4, 5, 6, 8, 9, 10, 12, 15, 18, 20, 24, 30, 36, 40, 45, 60, 72]), named = R.bool() && PNAME[n];
        return E.num(`Find the size of each exterior angle of a regular ${named ? nName(n) : n + '-gon'}.`, [{ label: 'exterior angle =', ans: 360 / n }], `The ${n} equal exterior angles share 360°: 360° ÷ ${n} = ${360 / n}°.`); }
      if (kind === 1) { const n = R.int(4, 6), poly = cyc(R, n), k = R.int(0, n - 1), labs = poly.ext.map((_, i) => i === k ? 'x°' : null);
        return E.num(`Find the exterior angle x.`, [{ label: 'x =', ans: poly.ext[k] }], `An exterior angle and its interior angle make a straight line: x = 180 − ${poly.int[k]} = ${poly.ext[k]}.`, { visual: extFig(poly, labs, { int: [[k, deg(poly.int[k])]] }) }); }
      const n = R.pick([5, 6, 8, 9, 10, 12]), I = intA(n);
      return E.num(`Each interior angle of a regular polygon is ${I}°. Find each exterior angle.`, [{ label: 'exterior angle =', ans: 180 - I }], `Interior and exterior angles at a vertex add to 180°: 180° − ${I}° = ${180 - I}°.`); } },
    d: { t: 'find n', g: R => { const kind = R.int(0, 2);
      if (kind === 0) { const n = R.pick([5, 6, 8, 9, 10, 12, 15, 18, 20, 24, 30, 36, 40, 45, 60, 72, 90]);
        return E.num(`Each exterior angle of a regular polygon is ${360 / n}°. How many sides does it have?`, [{ label: 'n =', ans: n }], `The exterior angles add to 360°, so n = 360 ÷ ${360 / n} = ${n}.`); }
      if (kind === 1) { const n = R.pick(REGN.filter(v => v >= 5)), I = intA(n);
        return E.num(`Each interior angle of a regular polygon is ${I}°. Use the exterior angles to find the number of sides.`, [{ label: 'n =', ans: n }], `Each exterior angle is 180° − ${I}° = ${360 / n}°, so n = 360 ÷ ${360 / n} = ${n}.`); }
      const k = R.pick(KPAIR.slice(1)), e = 180 / (k + 1), n = 360 / e, way = R.bool();
      const FR = { 2: 'half', 3: 'one third', 4: 'one quarter', 5: 'one fifth', 8: 'one eighth', 9: 'one ninth', 11: 'one eleventh', 14: 'one fourteenth', 17: 'one seventeenth' };
      return E.num(way ? `In a regular polygon, each interior angle is ${k} times each exterior angle. How many sides does it have?` : `In a regular polygon, each exterior angle is ${FR[k]} of each interior angle. How many sides does it have?`,
        [{ label: 'n =', ans: n }], `Exterior e and interior ${k}e add to 180°, so ${k + 1}e = 180 and e = ${e}°. Then n = 360 ÷ ${e} = ${n}.`); } },
  });

  /* ================= V.4.03 Parallelogram properties ================= */
  const WHY4 = { 'definition of parallelogram': 'a parallelogram is a quadrilateral with both pairs of opposite sides parallel', 'reflexive property': 'every segment is congruent to itself',
    'alternate interior angles': 'parallel lines cut by a transversal make congruent alternate interior angles', 'vertical angles': 'vertical angles are congruent',
    'opposite sides of a parallelogram are congruent': 'that is already proved for every parallelogram', ASA: 'two angles and the side between them match', AAS: 'two angles and a side not between them match',
    CPCTC: 'corresponding parts of congruent triangles are congruent' };
  const WRONG4 = { 'definition of parallelogram': ['opposite sides of a parallelogram are congruent', 'alternate interior angles', 'reflexive property'], 'reflexive property': ['definition of midpoint', 'vertical angles', 'alternate interior angles'],
    'alternate interior angles': ['corresponding angles', 'vertical angles', 'same-side interior angles'], 'vertical angles': ['alternate interior angles', 'linear pair', 'reflexive property'],
    'opposite sides of a parallelogram are congruent': ['definition of parallelogram', 'reflexive property', 'alternate interior angles'], ASA: ['SAS', 'AAS', 'SSA'], AAS: ['ASA', 'SAS', 'SSA'], CPCTC: ['ASA', 'definition of parallelogram', 'reflexive property'] };
  const PROOFS = [
    { diag: 'AC', arr: ARR2, targets: ['AB ≅ CD', 'BC ≅ DA', '∠B ≅ ∠D'], lines: [['ABCD is a parallelogram', 'given', []], ['AB ∥ DC and AD ∥ BC', 'definition of parallelogram', [0]], ['AC ≅ CA', 'reflexive property', []],
      ['∠BAC ≅ ∠DCA', 'alternate interior angles', [1]], ['∠BCA ≅ ∠DAC', 'alternate interior angles', [1]], ['△ABC ≅ △CDA', 'ASA', [2, 3, 4]]] },
    { diag: 'E', arr: [['A', 'B', 1], ['D', 'C', 1]], targets: ['AE ≅ CE', 'BE ≅ DE'], lines: [['ABCD is a parallelogram with diagonals meeting at E', 'given', []], ['AB ∥ DC', 'definition of parallelogram', [0]], ['AB ≅ DC', 'opposite sides of a parallelogram are congruent', [0]],
      ['∠BAE ≅ ∠DCE', 'alternate interior angles', [1]], ['∠ABE ≅ ∠CDE', 'alternate interior angles', [1]], ['△ABE ≅ △CDE', 'ASA', [2, 3, 4]]] },
    { diag: 'E', arr: [['A', 'B', 1], ['D', 'C', 1]], targets: ['AE ≅ CE', 'BE ≅ DE'], lines: [['ABCD is a parallelogram with diagonals meeting at E', 'given', []], ['AB ∥ DC', 'definition of parallelogram', [0]], ['AB ≅ DC', 'opposite sides of a parallelogram are congruent', [0]],
      ['∠BAE ≅ ∠DCE', 'alternate interior angles', [1]], ['∠AEB ≅ ∠CED', 'vertical angles', []], ['△ABE ≅ △CDE', 'AAS', [2, 3, 4]]] },
  ];
  const table = rows => `<table class="dt"><tr><th>#</th><th>Statement</th><th>Reason</th></tr>${rows.map((r, i) => `<tr><td>${i + 1}</td><td>${r[0]}</td><td>${r[1]}</td></tr>`).join('')}</table>`;
  const gramProof = (R, mode) => {
    const pf = R.pick(PROOFS), map = qmap(R, pf.diag === 'E'), rn = rnF(map), tg = R.pick(pf.targets);
    let p, q; do { p = R.int(30, 46) / 10; q = R.int(20, 34) / 10; } while (Math.abs(p - q) < 0.6);
    const P0 = gram(p, q, randAl(R)); if (pf.diag === 'E') P0.E = mid(P0.A, P0.C);
    const vis = qfig(R, P0, map, { diag: pf.diag, arr: pf.arr, label: 'parallelogram proof figure' });
    const L = [...pf.lines, [tg, 'CPCTC', [pf.lines.length - 1]]].map(([st, rs, dp]) => [rn(st), rs, dp]), n = L.length;
    const head = `Given: ${L[0][0]}. Prove: ${L[n - 1][0]}.`;
    if (mode === 'order') return orderQ(R, `${head} Put the steps of the proof in order.`, L.map(l => `${l[0]} (${l[1]})`), L.map(l => l[2]),
      `Each step must come after the steps it uses: the alternate interior angles need the parallel sides, ${L[n - 2][1]} needs the three matching parts, and CPCTC comes last.`, { fixed: 1, visual: vis });
    if (mode === 'reason') { const k = R.int(1, n - 1), [st, rs] = L[k];
      return E.choice(R, `${head} What is the reason for step ${k + 1}?${table(L.map((l, i) => [l[0], i === k ? '<b>?</b>' : l[1]]))}`, rs, WRONG4[rs], `Step ${k + 1}: ${st} because ${WHY4[rs]} (${rs}).`, { visual: vis }); }
    const k = R.int(1, n - 1), [st, rs] = L[k], w = R.pick(WRONG4[rs]);
    return E.choiceFixed(`${head} Exactly one step has the wrong reason. Which step is it?${table(L.map((l, i) => [l[0], i === k ? w : l[1]]))}`, L.slice(1).map((_, i) => `Step ${i + 2}`), k - 1,
      `Step ${k + 1} is wrong: ${st} is not justified by "${w}". It holds because ${WHY4[rs]} (${rs}).`, { visual: vis });
  };
  /* ----- more short proofs: reasons, their wrong neighbors, one generic question builder ----- */
  Object.assign(WHY4, { given: 'it is given', 'definition of segment bisector': 'a segment bisector cuts a segment into two congruent parts', SAS: 'two pairs of sides and the angles between them match', SSS: 'three pairs of sides match',
    'converse of alternate interior angles': 'congruent alternate interior angles make the lines parallel', 'definition of rectangle': 'a rectangle is a parallelogram with four right angles',
    'all right angles are congruent': 'every right angle measures 90°', 'definition of rhombus': 'a rhombus is a quadrilateral with four congruent sides',
    'diagonals of a parallelogram bisect each other': 'a rhombus is a parallelogram, and the diagonals of every parallelogram bisect each other',
    'congruent angles in a linear pair are right angles': 'two congruent angles that add to 180° are 90° each, so the lines are perpendicular', 'definition of angle bisector': 'a ray that splits an angle into two congruent angles bisects it',
    'linear pair postulate': 'an interior angle and its exterior angle form a linear pair, so they add to 180°', 'addition property of equality': 'adding the equations, one for each vertex, adds up the 180°s',
    'polygon angle sum theorem': 'the interior angles of an n-gon add to (n − 2) × 180°', 'subtraction property of equality': 'taking the interior angles away from the total leaves the exterior angles' });
  Object.assign(WRONG4, { 'definition of segment bisector': ['reflexive property', 'vertical angles', 'CPCTC'], SAS: ['SSS', 'ASA', 'SSA'], SSS: ['SAS', 'ASA', 'AAS'],
    'converse of alternate interior angles': ['alternate interior angles', 'vertical angles', 'CPCTC'], 'definition of rectangle': ['definition of rhombus', 'all right angles are congruent', 'reflexive property'],
    'all right angles are congruent': ['vertical angles', 'alternate interior angles', 'reflexive property'], 'definition of rhombus': ['definition of rectangle', 'opposite sides of a parallelogram are congruent', 'reflexive property'],
    'diagonals of a parallelogram bisect each other': ['definition of rhombus', 'reflexive property', 'vertical angles'], 'congruent angles in a linear pair are right angles': ['vertical angles', 'CPCTC', 'definition of rhombus'],
    'definition of angle bisector': ['CPCTC', 'reflexive property', 'vertical angles'], 'linear pair postulate': ['vertical angles', 'polygon angle sum theorem', 'alternate interior angles'],
    'addition property of equality': ['subtraction property of equality', 'linear pair postulate', 'polygon angle sum theorem'], 'polygon angle sum theorem': ['linear pair postulate', 'exterior angle sum theorem', 'addition property of equality'],
    'subtraction property of equality': ['addition property of equality', 'polygon angle sum theorem', 'exterior angle sum theorem'] });
  // o: {head, L:[[statement, reason, deps]], ng (number of Givens, kept first), vis, ordEx}
  const pfQ = (R, o, mode) => { const L = o.L, n = L.length, ng = o.ng || 0, extra = o.vis ? { visual: o.vis } : {};
    if (mode === 'order') return orderQ(R, `${o.head} Put the steps of the proof in order.`, L.map(l => `${l[0]} (${l[1]})`), L.map(l => l[2] || []),
      o.ordEx || 'Each step must come after the steps it uses: the triangles are congruent only once all three pairs of parts are in place, and CPCTC and what follows from it come after that.', Object.assign({ fixed: ng }, extra));
    const k = R.int(ng, n - 1), [st, rs] = L[k];
    if (mode === 'reason') return E.choice(R, `${o.head} What is the reason for step ${k + 1}?${table(L.map((l, i) => [l[0], i === k ? '<b>?</b>' : l[1]]))}`, rs, WRONG4[rs], `Step ${k + 1}: ${st} because ${WHY4[rs]} (${rs}).`, extra);
    const w = R.pick(WRONG4[rs]);
    return E.choiceFixed(`${o.head} Exactly one step has the wrong reason. Which step is it?${table(L.map((l, i) => [l[0], i === k ? w : l[1]]))}`, L.slice(ng).map((_, i) => `Step ${i + ng + 1}`), k - ng,
      `Step ${k + 1} is wrong: ${st} is not justified by "${w}". It holds because ${WHY4[rs]} (${rs}).`, extra); };
  // a quadrilateral proof in canonical letters A, B, C, D (E where the diagonals meet), relabeled per question
  const quadPf = (R, d, mode) => { const rn = rnF(d.map), L = d.lines.map(([st, rs, dp]) => [rn(st), rs, dp || []]), ng = L.filter(l => l[1] === 'given').length;
    return pfQ(R, { head: `${d.note ? rn(d.note) + ' ' : ''}Given: ${L.slice(0, ng).map(l => l[0]).join('; ')}. Prove: ${L[L.length - 1][0]}.`, L, ng, vis: qfig(R, d.P0, d.map, Object.assign({ label: 'quadrilateral proof figure' }, d.fo)) }, mode); };
  const mode4 = R => R.pick(['order', 'order', 'reason', 'broken']);
  const sideP = R => { let p, q; do { p = R.int(30, 46) / 10; q = R.int(20, 34) / 10; } while (Math.abs(p - q) < 0.6); return [p, q]; };
  // V.4.04: one pair of opposite sides both parallel and congruent
  const onePairPf = R => { const [p, q] = sideP(R);
    return { map: qmap(R), P0: gram(p, q, randAl(R)), fo: { diag: 'AC', arr: [['A', 'B', 1], ['D', 'C', 1]], tk: { AB: 1, DC: 1 } },
      lines: [['AB ∥ DC', 'given'], ['AB ≅ DC', 'given'], ['∠BAC ≅ ∠DCA', 'alternate interior angles', [0]], ['AC ≅ CA', 'reflexive property'], ['△BAC ≅ △DCA', 'SAS', [1, 2, 3]], ['∠BCA ≅ ∠DAC', 'CPCTC', [4]], ['AD ∥ BC', 'converse of alternate interior angles', [5]]] }; };
  // V.4.04: diagonals that bisect each other
  const bisectPf = R => { let ae, be; do { ae = R.int(4, 14); be = R.int(3, 12); } while (Math.abs(ae - be) < 2 || ae > 2 * be || be > 2 * ae);
    const other = R.bool(), par = R.bool(0.6), [t1, t2, va, cp, concl] = other ? ['△AED', '△CEB', '∠AED ≅ ∠CEB', '∠DAE ≅ ∠BCE', par ? 'AD ∥ BC' : 'AD ≅ CB'] : ['△ABE', '△CDE', '∠AEB ≅ ∠CED', '∠BAE ≅ ∠DCE', par ? 'AB ∥ DC' : 'AB ≅ CD'];
    const lines = [['AC and BD bisect each other at E', 'given'], ['AE ≅ CE', 'definition of segment bisector', [0]], ['BE ≅ DE', 'definition of segment bisector', [0]], [va, 'vertical angles'], [`${t1} ≅ ${t2}`, 'SAS', [1, 2, 3]]];
    if (par) lines.push([cp, 'CPCTC', [4]], [concl, 'converse of alternate interior angles', [5]]); else lines.push([concl, 'CPCTC', [4]]);
    return { map: qmap(R, true), P0: byDiag(ae, ae, be, be, R.bool() ? R.int(45, 75) : R.int(105, 135)), fo: { diag: 'E', tk: { AE: 1, EC: 1, BE: 2, ED: 2 } }, lines }; };
  // V.4.05: rectangle diagonals, rhombus diagonals
  const rectPf = R => { const P0 = rectD(R, R.int(8, 12) / 2);
    return { map: qmap(R), P0, fo: { diag: 'AC,BD', ang: [['D', 'A', 'B', '', { right: true }], ['A', 'B', 'C', '', { right: true }], ['B', 'C', 'D', '', { right: true }], ['C', 'D', 'A', '', { right: true }]] },
      lines: [['ABCD is a rectangle', 'given'], ['∠DAB and ∠CBA are right angles', 'definition of rectangle', [0]], ['∠DAB ≅ ∠CBA', 'all right angles are congruent', [1]], ['AD ≅ BC', 'opposite sides of a parallelogram are congruent', [0]],
        ['AB ≅ BA', 'reflexive property'], ['△DAB ≅ △CBA', 'SAS', [2, 3, 4]], ['DB ≅ CA', 'CPCTC', [5]]] }; };
  const rhombPf = R => { let th; do th = R.int(25, 65); while (Math.abs(th - 45) < 7); const P0 = byDiag(Math.sin(rad(th)) * 3, Math.sin(rad(th)) * 3, Math.cos(rad(th)) * 3, Math.cos(rad(th)) * 3, 90);
    return { map: qmap(R, true), P0, fo: { diag: 'E', tk: { AB: 1, BC: 1, CD: 1, DA: 1 } },
      lines: [['ABCD is a rhombus with diagonals meeting at E', 'given'], ['AB ≅ AD', 'definition of rhombus', [0]], ['BE ≅ DE', 'diagonals of a parallelogram bisect each other', [0]], ['AE ≅ AE', 'reflexive property'],
        ['△ABE ≅ △ADE', 'SSS', [1, 2, 3]], ['∠AEB ≅ ∠AED', 'CPCTC', [4]], ['AC ⟂ BD', 'congruent angles in a linear pair are right angles', [5]]] }; };
  // V.4.06: a kite's diagonal
  const kitePf = R => { const P0 = kiteP(R.int(22, 32) / 10, R.int(10, 16) / 10, R.int(12, 18) / 10); delete P0.E; const bis = R.bool();
    const lines = [['AB ≅ AD', 'given'], ['CB ≅ CD', 'given'], ['AC ≅ AC', 'reflexive property'], ['△ABC ≅ △ADC', 'SSS', [0, 1, 2]]];
    if (bis) lines.push(['∠BAC ≅ ∠DAC', 'CPCTC', [3]], ['AC bisects ∠BAD', 'definition of angle bisector', [4]]); else lines.push(['∠ABC ≅ ∠ADC', 'CPCTC', [3]]);
    return { map: qmap(R), P0, note: 'ABCD is a kite.', fo: { diag: 'AC', tk: { AB: 1, AD: 1, CB: 2, CD: 2 } }, lines }; };

  S('V.4.03', 'Parallelogram properties', {
    a: { t: 'opposite sides', g: R => { const map = qmap(R), [A, B, Cc, D] = [map.A, map.B, map.C, map.D], kind = R.int(0, 2), nm = qn(map);
      let p, q; do { p = R.int(4, 16); q = R.int(4, 16); } while (Math.abs(p - q) < 2);
      if (kind === 0) { const askCD = R.bool(), vis = qfig(R, gram(p, q, randAl(R)), map, { arr: ARR2, lab: { AB: String(p), AD: String(q), [askCD ? 'CD' : 'BC']: '?' } });
        return E.num(`${nm} is a parallelogram. Find ${askCD ? Cc + D : B + Cc}.`, [{ label: (askCD ? Cc + D : B + Cc) + ' =', ans: askCD ? p : q }], `Opposite sides of a parallelogram are congruent, so ${askCD ? `${Cc}${D} = ${A}${B} = ${p}` : `${B}${Cc} = ${A}${D} = ${q}`}.`, { visual: vis }); }
      if (kind === 1) { const vis = qfig(R, gram(p, q, randAl(R)), map, { arr: ARR2, lab: { AB: String(p), AD: '?' } });
        return E.num(`Parallelogram ${nm} has perimeter ${2 * (p + q)}. Find ${A}${D}.`, [{ label: A + D + ' =', ans: q }], `Opposite sides are equal, so the perimeter is 2(${A}${B} + ${A}${D}): ${2 * (p + q)} = 2(${p} + ${A}${D}), so ${A}${D} = ${p + q} − ${p} = ${q}.`, { visual: vis }); }
      const x = R.int(2, 9), [e1, e2] = exPair(R, p, x), vis = qfig(R, gram(p, q, randAl(R)), map, { arr: ARR2, lab: { AB: lin(...e1), CD: lin(...e2) } }), askS = R.bool(0.35);
      return E.num(`${nm} is a parallelogram. Find ${askS ? A + B : 'x'}.`, [askS ? { label: A + B + ' =', ans: p } : { label: 'x =', ans: x }], `Opposite sides are congruent: ${solveTxt(e1, e2)}, so x = ${x}${askS ? ` and ${A}${B} = ${p}` : ''}.`, { visual: vis }); } },
    b: { t: 'opposite angles', g: R => { const map = qmap(R), [A, B, Cc, D] = [map.A, map.B, map.C, map.D], kind = R.int(0, 2), nm = qn(map), al = randAl(R), P0 = gram(R.int(30, 44) / 10, R.int(20, 30) / 10, al);
      const AN = { A: ['D', 'A', 'B'], B: ['A', 'B', 'C'], C: ['B', 'C', 'D'], D: ['C', 'D', 'A'] }, ang = (k, l) => [...AN[k], l];
      if (kind === 0) { const ask = R.pick(['B', 'C', 'C', 'D']), val = ask === 'C' ? al : 180 - al, vis = qfig(R, P0, map, { arr: ARR2, ang: [ang('A', deg(al)), ang(ask, '?')] });
        return E.num(`${nm} is a parallelogram. Find ∠${map[ask]}.`, [{ label: `∠${map[ask]} =`, ans: val }], ask === 'C' ? `Opposite angles of a parallelogram are congruent: ∠${Cc} = ∠${A} = ${al}°.` : `Consecutive angles of a parallelogram are supplementary: ∠${map[ask]} = 180° − ${al}° = ${val}°.`, { visual: vis }); }
      const x = R.int(5, 25);
      if (kind === 1) { const [e1, e2] = exPair(R, al, x), vis = qfig(R, P0, map, { arr: ARR2, ang: [ang('A', angLab(...e1)), ang('C', angLab(...e2))] }), askA = R.bool(0.35);
        return E.num(`${nm} is a parallelogram. Find ${askA ? '∠' + B : 'x'}.`, [askA ? { label: `∠${B} =`, ans: 180 - al } : { label: 'x =', ans: x }], `Opposite angles are congruent: ${solveTxt(e1, e2)}, so x = ${x}${askA ? `. Then ∠${A} = ${al}° and ∠${B} = 180° − ${al}° = ${180 - al}°` : ''}.`, { visual: vis }); }
      let e1, e2; do { e1 = exAt(R, al, x); e2 = exAt(R, 180 - al, x); } while (e1[0] === e2[0] && e1[1] === e2[1]);
      const vis = qfig(R, P0, map, { arr: ARR2, ang: [ang('A', angLab(...e1)), ang('B', angLab(...e2))] });
      return E.num(`${nm} is a parallelogram. Find x.`, [{ label: 'x =', ans: x }], `Consecutive angles are supplementary: ${sumTxt(e1, e2, 180)}, so x = ${x}.`, { visual: vis }); } },
    c: { t: 'diagonals bisect', g: R => { const map = qmap(R, true), [A, B, Cc, D, Ee] = [map.A, map.B, map.C, map.D, map.E], kind = R.int(0, 2), nm = qn(map);
      let ae, be; do { ae = R.int(4, 14); be = R.int(3, 12); } while (Math.abs(ae - be) < 2 || ae > 2 * be || be > 2 * ae);
      const phi = R.bool() ? R.int(40, 70) : R.int(110, 140), P0 = byDiag(ae, ae, be, be, phi), arr = ARR2, pre = `${nm} is a parallelogram whose diagonals meet at ${Ee}.`;
      if (kind === 0) { const useA = R.bool(), h = useA ? ae : be, whole = useA ? A + Cc : B + D, part = useA ? R.pick([A + Ee, Ee + Cc]) : R.pick([B + Ee, Ee + D]);
        const vis = qfig(R, P0, map, { diag: 'E', arr, tk: { AE: 1, EC: 1, BE: 2, ED: 2 }, lab: { [part[0] === Ee ? part[1] + Ee : part]: '?' } });
        return E.num(`${pre} ${whole} = ${2 * h}. Find ${part}.`, [{ label: part + ' =', ans: h }], `The diagonals of a parallelogram bisect each other, so ${part} = ${2 * h} ÷ 2 = ${h}.`, { visual: vis }); }
      if (kind === 1) { const x = R.int(2, 9), useA = R.bool(), h = useA ? ae : be, [e1, e2] = exPair(R, h, x), k1 = useA ? 'AE' : 'BE', k2 = useA ? 'EC' : 'ED', askW = R.bool(0.35), whole = useA ? A + Cc : B + D;
        const vis = qfig(R, P0, map, { diag: 'E', arr, lab: { [k1]: lin(...e1), [k2]: lin(...e2) } });
        return E.num(`${pre} Find ${askW ? whole : 'x'}.`, [askW ? { label: whole + ' =', ans: 2 * h } : { label: 'x =', ans: x }], `${Ee} is the midpoint of ${whole}: ${solveTxt(e1, e2)}, so x = ${x}${askW ? `. Each half is ${h}, so ${whole} = ${2 * h}` : ''}.`, { visual: vis }); }
      const vis = qfig(R, P0, map, { diag: 'E', arr }), ok = R.bool() ? `${A}${Ee} ≅ ${Ee}${Cc}` : `${B}${Ee} ≅ ${Ee}${D}`;
      return E.choice(R, `${pre} Which statement must be true?`, ok, [`${A}${Cc} ≅ ${B}${D}`, `${A}${Ee} ≅ ${B}${Ee}`, `${A}${Cc} ⟂ ${B}${D}`],
        `The diagonals of a parallelogram bisect each other, so ${ok}. They are usually not congruent (only in a rectangle) and not perpendicular (only in a rhombus).`, { visual: vis }); } },
    d: { t: 'prove a property', g: R => gramProof(R, R.pick(['order', 'order', 'reason', 'broken'])) },
    e: { t: 'an angle bisector makes an isosceles triangle', g: R => { const map = qmap(R, true), [A, B, Cc, D, Ee] = [map.A, map.B, map.C, map.D, map.E], kind = R.int(0, 2), nm = qn(map);
      let p, q; do { p = R.int(3, 12); q = R.int(5, 18); } while (q - p < 2 || q - p > 9);
      let al = kind === 2 ? 2 * R.int(26, 62) : randAl(R); if (al === 90) al = 88;
      const P0 = gram(p, q, al); P0.E = add(P0.B, mul(unit(sub(P0.C, P0.B)), p));
      const ang = [['B', 'A', 'E', '', { n: 1, tick: true }], ['E', 'A', 'D', '', { n: 1, tick: true }]], pre = `${nm} is a parallelogram and ${A}${Ee} bisects ∠${D}${A}${B}.`;
      if (kind === 0) { const vis = qfig(R, P0, map, { skip: ['BC'], segs: ['BE', 'EC', 'AE'], arr: [['A', 'B', 1], ['D', 'C', 1]], ang, lab: { AB: String(p), AD: String(q), EC: '?' } });
        return E.num(`${pre} Find ${Ee}${Cc}.`, [{ label: Ee + Cc + ' =', ans: q - p }], `${A}${D} ∥ ${B}${Cc}, so ∠${D}${A}${Ee} = ∠${A}${Ee}${B} (alternate interior). So ∠${B}${A}${Ee} = ∠${A}${Ee}${B} and △${A}${B}${Ee} is isosceles: ${B}${Ee} = ${A}${B} = ${p}. Then ${Ee}${Cc} = ${q} − ${p} = ${q - p}.`, { visual: vis }); }
      if (kind === 1) { const vis = qfig(R, P0, map, { skip: ['BC'], segs: ['BE', 'EC', 'AE'], arr: [['A', 'B', 1], ['D', 'C', 1]], ang, lab: { AB: String(p), EC: String(q - p) } });
        return E.num(`${pre} Find the perimeter of ${nm}.`, [{ label: 'perimeter =', ans: 2 * (p + q) }], `Alternate interior angles make ∠${B}${A}${Ee} = ∠${A}${Ee}${B}, so ${B}${Ee} = ${A}${B} = ${p}. Then ${B}${Cc} = ${p} + ${q - p} = ${q} and the perimeter is 2(${p} + ${q}) = ${2 * (p + q)}.`, { visual: vis }); }
      const vis = qfig(R, P0, map, { skip: ['BC'], segs: ['BE', 'EC', 'AE'], arr: [['A', 'B', 1], ['D', 'C', 1]], ang: [...ang, ['A', 'B', 'E', deg(180 - al)], ['A', 'E', 'B', 'x°']] });
      return E.num(`${pre} Find x.`, [{ label: 'x =', ans: al / 2 }], `∠${D}${A}${B} = 180° − ${180 - al}° = ${al}°, so each half is ${al / 2}°. ${A}${D} ∥ ${B}${Cc} makes x° = ∠${D}${A}${Ee} = ${al / 2}° (alternate interior angles).`, { visual: vis }); } },
    f: { t: 'bisectors and areas in a parallelogram', g: R => { const map = qmap(R, true), [A, B, Cc, D, Ee] = [map.A, map.B, map.C, map.D, map.E], nm = qn(map);
      if (R.bool()) { const p = R.int(3, 15), P0 = gram(p, 2 * p, randAl(R)); P0.E = mid(P0.B, P0.C); const kind = R.int(0, 2);
        const vis = qfig(R, P0, map, { segs: ['AE', 'DE'], arr: [['A', 'B', 1], ['D', 'C', 1]], ang: [['B', 'A', 'E', '', { n: 1 }], ['E', 'A', 'D', '', { n: 1 }], ['A', 'D', 'E', '', { n: 2 }], ['E', 'D', 'C', '', { n: 2 }]], lab: kind === 0 ? { AB: String(p) } : {} });
        const pre = `In parallelogram ${nm}, the bisectors of ∠${A} and ∠${D} meet at ${Ee}, a point on ${B}${Cc}.`, why = `∠${D}${A}${Ee} = ∠${A}${Ee}${B} (alternate interior), so △${A}${B}${Ee} is isosceles and ${B}${Ee} = ${A}${B}. Likewise ${Cc}${Ee} = ${Cc}${D} = ${A}${B}, so ${B}${Cc} = 2·${A}${B}`;
        if (kind === 0) return E.num(`${pre} ${A}${B} = ${p}. Find the perimeter of ${nm}.`, [{ label: 'perimeter =', ans: 6 * p }], `${why} = ${2 * p}. The perimeter is 2(${p} + ${2 * p}) = ${6 * p}.`, { visual: vis });
        const askAB = kind === 1;
        return E.num(`${pre} The perimeter of ${nm} is ${6 * p}. Find ${askAB ? A + B : B + Cc}.`, [{ label: (askAB ? A + B : B + Cc) + ' =', ans: askAB ? p : 2 * p }], `${why}. So the perimeter is 2(${A}${B} + 2·${A}${B}) = 6·${A}${B} = ${6 * p}, giving ${A}${B} = ${p}${askAB ? '' : ` and ${B}${Cc} = ${2 * p}`}.`, { visual: vis }); }
      let x, y; do { x = R.int(6, 40); y = R.int(6, 40); } while (x === y || Math.min(x, y) / Math.max(x, y) < 0.6);
      const T = 2 * (x + y), b = 6, h = 4, s = R.int(-15, 15) / 10, fy = x / (x + y), py = fy * h, xl = s * fy, px = xl + (0.3 + 0.4 * R.f()) * b;
      const P0 = { A: [0, 0], B: [b, 0], C: [b + s, h], D: [s, h], E: [px, py] };
      P0._t1 = lerp(mid(P0.A, P0.B), P0.E, 0.3); P0._t2 = lerp(mid(P0.C, P0.D), P0.E, 0.3);
      const ask = R.int(0, 1), vis = qfig(R, P0, map, { segs: ['EA', 'EB', 'EC', 'ED'], polys: [['A', 'B', 'E', { fill: C.blue, opacity: 0.25 }], ['C', 'D', 'E', { fill: C.blue, opacity: 0.25 }]], text: [['_t1', String(x)], ['_t2', ask ? String(y) : '?']], label: 'parallelogram with a point inside' });
      if (ask === 0) return E.num(`${Ee} is a point inside parallelogram ${nm}, whose area is ${T}. △${Ee}${A}${B} has area ${x}. Find the area of △${Ee}${Cc}${D}.`, [{ label: 'area =', ans: y }],
        `△${Ee}${A}${B} and △${Ee}${Cc}${D} have equal bases ${A}${B} = ${Cc}${D}, and their heights add up to the parallelogram's height, so together they make half its area: ${T} ÷ 2 − ${x} = ${y}.`, { visual: vis });
      return E.num(`${Ee} is a point inside parallelogram ${nm}. The areas of △${Ee}${A}${B} and △${Ee}${Cc}${D} are ${x} and ${y}. Find the area of ${nm}.`, [{ label: 'area =', ans: T }],
        `The two triangles have equal bases ${A}${B} = ${Cc}${D} and heights that add up to the parallelogram's height, so together they are half its area: 2 × (${x} + ${y}) = ${T}.`, { visual: vis }); } },
  });

  /* ================= V.4.04 Proving parallelograms ================= */
  const MARKNOTE = 'Arrows mark parallel sides and ticks mark congruent sides.';
  const coordQuad = R => { let A, B, Cc; do { A = [R.int(-6, 2), R.int(-6, 2)]; B = [A[0] + R.int(2, 7), A[1] + R.int(-3, 3)]; Cc = [B[0] + R.int(-4, 3), B[1] + R.int(2, 6)]; }
    while (Math.abs((B[0] - A[0]) * (Cc[1] - A[1]) - (B[1] - A[1]) * (Cc[0] - A[0])) < 8 || Math.abs(A[0] + Cc[0] - B[0]) > 8 || Math.abs(A[1] + Cc[1] - B[1]) > 8);
    return [A, B, Cc, [A[0] + Cc[0] - B[0], A[1] + Cc[1] - B[1]]]; };
  const gridFig = (pts, names, closed = true, extra = []) => { const all = pts.concat(extra.map(e => e[0])), xs = all.map(p => p[0]).concat(0), ys = all.map(p => p[1]).concat(0);
    const S0 = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) + 2, x0 = Math.min(...xs) - 1, y0 = Math.min(...ys) - 1, n = pts.length;
    const segs = (closed ? pts.map((p, i) => [p, pts[(i + 1) % n]]) : pts.slice(1).map((p, i) => [pts[i], p])).map(([P, Q]) => ({ x: t => P[0] + (Q[0] - P[0]) * t, y: t => P[1] + (Q[1] - P[1]) * t, t: [0, 1], color: C.blue }));
    return V.graph({ x: [x0, x0 + S0], y: [y0, y0 + S0], w: 280, h: 280, ticks: 1, labels: false, param: segs, points: pts.map((p, i) => [p[0], p[1], names[i]]).concat(extra.map(e => [e[0][0], e[0][1], e[1]])), label: 'quadrilateral on a coordinate grid' }); };
  const ptTxt = p => `(${p[0]}, ${p[1]})`;
  const pw = v => v < 0 ? `(${v})` : String(v);
  const convex = ps => { const n = ps.length, s = ps.map((p, i) => { const q = ps[(i + 1) % n], r = ps[(i + 2) % n]; return Math.sign((q[0] - p[0]) * (r[1] - q[1]) - (q[1] - p[1]) * (r[0] - q[0])); }); return s.every(v => v === s[0] && v !== 0); };
  S('V.4.04', 'Proving parallelograms', {
    a: { t: 'both pairs of sides', g: R => { const map = qmap(R), [A, B, Cc, D] = [map.A, map.B, map.C, map.D], nm = qn(map);
      if (R.bool(0.65)) { const yes = R.bool(); let P0, lab, why;
        if (yes) { let p, q; do { p = R.int(4, 14); q = R.int(4, 14); } while (Math.abs(p - q) < 2); P0 = gram(p, q, randAl(R)); lab = { AB: String(p), BC: String(q), CD: String(p), DA: String(q) };
          why = `Yes: both pairs of opposite sides are congruent (${A}${B} = ${Cc}${D} = ${p} and ${B}${Cc} = ${D}${A} = ${q}), so ${nm} is a parallelogram.`; }
        else if (R.bool()) { let p, q; do { p = R.int(4, 12); q = R.int(5, 15); } while (Math.abs(p - q) < 3); const be = Math.min(p, q) * R.int(45, 75) / 100;
          P0 = kiteP(Math.sqrt(p * p - be * be), Math.sqrt(q * q - be * be), be); delete P0.E; lab = { AB: String(p), AD: String(p), CB: String(q), CD: String(q) };
          why = `No: the congruent sides are next to each other (${A}${B} = ${A}${D} and ${Cc}${B} = ${Cc}${D}), not opposite. This shape is a kite.`; }
        else { let b1, b2, l; do { b1 = R.int(8, 16); b2 = R.int(3, 12); l = R.int(4, 10); } while (b1 - b2 < 3 || (b1 - b2) / 2 >= l * 0.85 || l === b1 || l === b2);
          const off = (b1 - b2) / 2; P0 = { A: [0, 0], B: [b1, 0], C: [b1 - off, Math.sqrt(l * l - off * off)], D: [off, Math.sqrt(l * l - off * off)] }; lab = { AB: String(b1), BC: String(l), CD: String(b2), DA: String(l) };
          why = `No: only one pair of opposite sides is congruent (${B}${Cc} = ${D}${A} = ${l}), while ${A}${B} = ${b1} and ${Cc}${D} = ${b2} differ. This shape is an isosceles trapezoid.`; }
        return yn(`Do these side lengths prove that ${nm} is a parallelogram?`, yes, why, { visual: qfig(R, P0, map, { lab }) }); }
      let p, q; do { p = R.int(5, 16); q = R.int(4, 14); } while (Math.abs(p - q) < 2);
      const x = R.int(2, 9), [e1, e2] = exPair(R, p, x), vis = qfig(R, gram(p, q, randAl(R)), map, { lab: { AB: lin(...e1), CD: lin(...e2), BC: String(q), DA: String(q) } });
      return E.num(`For what value of x is ${nm} a parallelogram?`, [{ label: 'x =', ans: x }], `${B}${Cc} = ${D}${A} already, so we need the other pair equal too: ${solveTxt(e1, e2)}, so x = ${x}.`, { visual: vis }); } },
    b: { t: 'one pair parallel and congruent', g: R => { if (R.bool(0.35)) return quadPf(R, onePairPf(R), mode4(R));
      const map = qmap(R), [A, B, Cc, D] = [map.A, map.B, map.C, map.D], nm = qn(map);
      if (R.bool(0.35)) { const ok = R.pick([`${A}${B} ≅ ${D}${Cc}`, `${A}${D} ∥ ${B}${Cc}`]);
        return E.choice(R, `In quadrilateral ${nm}, ${A}${B} ∥ ${D}${Cc}. Which extra fact proves that ${nm} is a parallelogram?`, ok, [`${A}${D} ≅ ${B}${Cc}`, `${A}${Cc} ≅ ${B}${D}`, `∠${A} ≅ ∠${B}`],
          `${ok.includes('∥') ? 'Two pairs of parallel sides is the definition of a parallelogram.' : 'One pair of sides that is both parallel and congruent proves a parallelogram.'} The other facts all hold in an isosceles trapezoid, which is not a parallelogram.`); }
      const yes = R.bool(), kind = yes ? R.pick(['pc', 'pp']) : R.pick(['pl', 'p1']); let P0, o;
      if (yes) { let p, q; do { p = R.int(30, 46) / 10; q = R.int(20, 32) / 10; } while (Math.abs(p - q) < 0.6); P0 = gram(p, q, randAl(R));
        o = kind === 'pc' ? { arr: [['A', 'B', 1], ['D', 'C', 1]], tk: { AB: 1, DC: 1 } } : { arr: ARR2 }; }
      else if (kind === 'pl') { P0 = isoTrap(R.int(40, 52) / 10, R.int(18, 30) / 10, R.int(55, 72)); o = { arr: [['A', 'B', 1], ['D', 'C', 1]], tk: { AD: 1, BC: 1 } }; }
      else { P0 = trap(R.int(40, 52) / 10, R.int(18, 30) / 10, R.int(18, 28) / 10, R.int(-4, 16) / 10); o = { arr: [['A', 'B', 1], ['D', 'C', 1]] }; }
      const why = { pc: `Yes: ${A}${B} is both parallel and congruent to ${D}${Cc}, and one such pair is enough.`, pp: `Yes: both pairs of opposite sides are parallel, which is the definition of a parallelogram.`,
        pl: `No: ${A}${B} ∥ ${D}${Cc}, but the congruent pair is the other pair of sides. An isosceles trapezoid fits these marks, as drawn.`, p1: `No: one pair of parallel sides alone could be a trapezoid, as drawn. You need both pairs, or one pair parallel and congruent.` }[kind];
      return yn(`${MARKNOTE} Using only the marked facts, can you conclude that ${nm} is a parallelogram?`, yes, why, { visual: qfig(R, P0, map, o) }); } },
    c: { t: 'diagonals bisect', g: R => { if (R.bool(0.35)) return quadPf(R, bisectPf(R), mode4(R));
      const map = qmap(R, true), [A, B, Cc, D, Ee] = [map.A, map.B, map.C, map.D, map.E], nm = qn(map), kind = R.int(0, 2), phi = R.bool() ? R.int(45, 75) : R.int(105, 135), pre = `The diagonals of ${nm} meet at ${Ee}.`;
      if (kind === 0) { let ae, be; do { ae = R.int(4, 14); be = R.int(3, 12); } while (Math.abs(ae - be) < 2 || ae > 2 * be || be > 2 * ae);
        const x = R.int(2, 9), y = R.int(2, 9), [a1, a2] = exPair(R, ae, x), [b1, b2] = exPair(R, be, y), ly = ([p, q]) => lin(p, q).replace('x', 'y');
        const vis = qfig(R, byDiag(ae, ae, be, be, phi), map, { diag: 'E', lab: { AE: lin(...a1), EC: lin(...a2), BE: ly(b1), ED: ly(b2) } });
        return E.num(`${pre} Find x and y so that ${nm} is a parallelogram.`, [{ label: 'x =', ans: x }, { label: 'y =', ans: y }],
          `The diagonals must bisect each other: ${solveTxt(a1, a2)} gives x = ${x}, and ${M(linM(...b1).replace('x', 'y') + '=' + linM(...b2).replace('x', 'y'))} gives y = ${y}.`, { visual: vis }); }
      if (kind === 1) { const yes = R.bool(); let ae, ec, be, ed;
        do { ae = R.int(3, 12); be = R.int(3, 12); ec = yes ? ae : ae + R.pick([-3, -2, 2, 3]); ed = yes ? be : R.bool() ? be : be + R.pick([-3, -2, 2, 3]); } while (ec < 2 || ed < 2 || Math.abs(ae - be) < 2 || Math.max(ae, ec) > 2 * Math.min(be, ed) || Math.max(be, ed) > 2 * Math.min(ae, ec));
        const vis = qfig(R, byDiag(ae, ec, be, ed, phi), map, { diag: 'E', lab: { AE: String(ae), EC: String(ec), BE: String(be), ED: String(ed) } });
        return yn(`${pre} Is ${nm} a parallelogram?`, yes, yes ? `Yes: ${Ee} is the midpoint of both diagonals (${ae} = ${ec} and ${be} = ${ed}), so the diagonals bisect each other.` : `No: ${ae === ec ? `${B}${Ee} = ${be} but ${Ee}${D} = ${ed}` : `${A}${Ee} = ${ae} but ${Ee}${Cc} = ${ec}`}, so the diagonals do not bisect each other.`, { visual: vis }); }
      const ok = R.pick([`${A}${Cc} and ${B}${D} bisect each other`, `${Ee} is the midpoint of both ${A}${Cc} and ${B}${D}`]);
      return E.choice(R, `${pre} Which fact proves that ${nm} is a parallelogram?`, ok, [`${A}${Cc} ≅ ${B}${D}`, `${A}${Cc} ⟂ ${B}${D}`, `${A}${Cc} bisects ${B}${D}`],
        `Diagonals that bisect each other prove a parallelogram. If only one diagonal is bisected you could have a kite, and congruent or perpendicular diagonals alone prove nothing.`); } },
    d: { t: 'on the coordinate plane', g: R => { const [A, B, Cc, D] = coordQuad(R), nm = R.pick(QSETS).split(''), kind = R.int(0, 2), pre = `${nm[0]}${ptTxt(A)}, ${nm[1]}${ptTxt(B)}, ${nm[2]}${ptTxt(Cc)}`;
      if (kind === 0) return E.num(`${pre}. Find ${nm[3]} so that ${nm.join('')} is a parallelogram.`, [{ label: nm[3] + ' =', point: D.map(String) }],
        `The diagonals must share a midpoint, so ${nm[3]} = ${nm[0]} + ${nm[2]} − ${nm[1]} = (${A[0]} + ${pw(Cc[0])} − ${pw(B[0])}, ${A[1]} + ${pw(Cc[1])} − ${pw(B[1])}) = ${ptTxt(D)}.`, { visual: gridFig([A, B, Cc], nm.slice(0, 3), false) });
      if (kind === 1) { const yes = R.bool(); let D2 = D; if (!yes) for (const s of R.shuffle([[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1]])) { D2 = add(D, s); if (convex([A, B, Cc, D2])) break; }
        const m1 = mid(A, Cc), m2 = mid(B, D2);
        return yn(`Is ${nm.join('')} with ${pre} and ${nm[3]}${ptTxt(D2)} a parallelogram?`, yes, `The midpoint of ${nm[0]}${nm[2]} is ${ptTxt(m1)} and the midpoint of ${nm[1]}${nm[3]} is ${ptTxt(m2)}. ${yes ? 'They match, so the diagonals bisect each other: yes.' : 'They differ, so the diagonals do not bisect each other: no.'}`, { visual: gridFig([A, B, Cc, D2], nm) }); }
      const m = mid(A, Cc);
      return E.num(`${pre}, ${nm[3]}${ptTxt(D)}. Find the midpoints of ${nm[0]}${nm[2]} and ${nm[1]}${nm[3]}.`, [{ label: `midpoint of ${nm[0]}${nm[2]} =`, point: m.map(String) }, { label: `midpoint of ${nm[1]}${nm[3]} =`, point: m.map(String) }],
        `Average the coordinates: both midpoints are ${ptTxt(m)}. The diagonals bisect each other, so ${nm.join('')} is a parallelogram.`, { visual: gridFig([A, B, Cc, D], nm) }); } },
  });

  /* ================= V.4.05 Rectangles, rhombi, squares ================= */
  const TRIPLES = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [9, 12, 15], [8, 15, 17], [12, 16, 20], [7, 24, 25], [15, 20, 25], [10, 24, 26], [20, 21, 29], [18, 24, 30], [16, 30, 34], [21, 28, 35], [12, 35, 37], [15, 36, 39], [24, 32, 40], [9, 40, 41]];
  const rectD = (R, d) => { const th = R.bool() ? R.int(26, 38) : R.int(52, 64); return rectP(d * Math.cos(rad(th)), d * Math.sin(rad(th))); };
  const DIAGTF = [
    ['rectangle', 'congruent', true, 'every rectangle has congruent diagonals'], ['rectangle', 'perpendicular', false, 'only a square, a special rectangle, has perpendicular diagonals'], ['rectangle', 'angle', false, 'only when the rectangle is a square'],
    ['rhombus', 'congruent', false, 'only a square, a special rhombus, has congruent diagonals'], ['rhombus', 'perpendicular', true, 'every rhombus has perpendicular diagonals'], ['rhombus', 'angle', true, 'the diagonals of a rhombus bisect its angles'],
    ['square', 'congruent', true, 'a square is a rectangle'], ['square', 'perpendicular', true, 'a square is a rhombus'], ['square', 'angle', true, 'a square is a rhombus'],
    ['parallelogram', 'congruent', false, 'only rectangles do'], ['parallelogram', 'perpendicular', false, 'only rhombi do'], ['parallelogram', 'bisect', true, 'the diagonals of every parallelogram bisect each other'] ];
  const DPH = { congruent: 'are congruent', perpendicular: 'are perpendicular', angle: 'bisect its angles', bisect: 'bisect each other' };
  S('V.4.05', 'Rectangles, rhombi, squares', {
    a: { t: 'rectangle diagonals congruent', g: R => { if (R.bool(0.35)) return quadPf(R, rectPf(R), mode4(R));
      const map = qmap(R, true), [A, B, Cc, D, Ee] = [map.A, map.B, map.C, map.D, map.E], nm = qn(map), kind = R.int(0, 2), pre = `${nm} is a rectangle whose diagonals meet at ${Ee}.`;
      const rt = { ang: [['D', 'A', 'B', '', { right: true }], ['A', 'B', 'C', '', { right: true }], ['B', 'C', 'D', '', { right: true }], ['C', 'D', 'A', '', { right: true }]] };
      if (kind === 0) { const h = R.int(3, 15), give = R.pick([A + Cc, Ee + Cc]), ask = R.pick([B + D, B + Ee, Ee + D].filter(s => s.length === 2)), val = ask === B + D ? 2 * h : h, gv = give === A + Cc ? 2 * h : h;
        const P0 = rectD(R, 2 * h); P0.E = mid(P0.A, P0.C);
        return E.num(`${pre} ${give} = ${gv}. Find ${ask}.`, [{ label: ask + ' =', ans: val }], `A rectangle's diagonals are congruent and bisect each other, so all four halves are ${h} and each diagonal is ${2 * h}: ${ask} = ${val}.`, { visual: qfig(R, P0, map, { diag: 'E', ...rt }) }); }
      const x = R.int(2, 9);
      if (kind === 1) { const d = R.int(8, 30), [e1, e2] = exPair(R, d, x), P0 = rectD(R, d), askD = R.bool(0.35);
        return E.num(`${nm} is a rectangle with ${A}${Cc} = ${M(linM(...e1))} and ${B}${D} = ${M(linM(...e2))}. Find ${askD ? A + Cc : 'x'}.`, [askD ? { label: A + Cc + ' =', ans: d } : { label: 'x =', ans: x }],
          `The diagonals of a rectangle are congruent: ${solveTxt(e1, e2)}, so x = ${x}${askD ? ` and ${A}${Cc} = ${d}` : ''}.`, { visual: qfig(R, P0, map, { diag: 'AC,BD', ...rt }) }); }
      const h = R.int(4, 16), [e1, e2] = exPair(R, h, x), P0 = rectD(R, 2 * h); P0.E = mid(P0.A, P0.C); const k2 = R.pick(['BE', 'ED']), askD = R.bool(0.35);
      return E.num(`${pre} Find ${askD ? B + D : 'x'}.`, [askD ? { label: B + D + ' =', ans: 2 * h } : { label: 'x =', ans: x }],
        `The diagonals are congruent and bisect each other, so ${A}${Ee} = ${k2 === 'BE' ? B + Ee : Ee + D}: ${solveTxt(e1, e2)}, so x = ${x}${askD ? `. Each half is ${h}, so ${B}${D} = ${2 * h}` : ''}.`, { visual: qfig(R, P0, map, { diag: 'E', lab: { AE: lin(...e1), [k2]: lin(...e2) }, ...rt }) }); } },
    b: { t: 'rhombus diagonals perpendicular', g: R => { if (R.bool(0.35)) return quadPf(R, rhombPf(R), mode4(R));
      const map = qmap(R, true), [A, B, Cc, D, Ee] = [map.A, map.B, map.C, map.D, map.E], nm = qn(map), kind = R.int(0, 2), pre = `${nm} is a rhombus whose diagonals meet at ${Ee}.`;
      if (kind === 0) { const t = R.pick(TRIPLES.filter(t => t[2] <= 30)), sw = R.bool(), ae = sw ? t[1] : t[0], be = sw ? t[0] : t[1], askP = R.bool(0.35);
        const vis = qfig(R, byDiag(ae, ae, be, be, 90), map, { diag: 'E', ang: [['B', 'E', 'C', '', { right: true }]] });
        return E.num(`${pre} ${A}${Cc} = ${2 * ae} and ${B}${D} = ${2 * be}. Find ${askP ? 'the perimeter' : 'the side length'}.`, [askP ? { label: 'perimeter =', ans: 4 * t[2] } : { label: 'side =', ans: t[2] }],
          `The diagonals bisect each other at right angles, so △${A}${Ee}${B} is right with legs ${ae} and ${be}: side = √(${ae}² + ${be}²) = ${t[2]}${askP ? `, and the perimeter is 4 × ${t[2]} = ${4 * t[2]}` : ''}.`, { visual: vis }); }
      let th; do th = R.int(22, 68); while (Math.abs(th - 45) < 6);
      const P0 = byDiag(Math.sin(rad(th)), Math.sin(rad(th)), Math.cos(rad(th)), Math.cos(rad(th)), 90), askAC = kind === 1;
      const vis = qfig(R, P0, map, { diag: 'E', ang: [['A', 'B', 'E', deg(th)], askAC ? ['B', 'A', 'E', '?'] : ['A', 'B', 'C', '', { r: 46 }]] });
      return E.num(`${pre} ∠${A}${B}${D} = ${th}°. Find ∠${askAC ? B + A + Cc : A + B + Cc}.`, [{ label: `∠${askAC ? B + A + Cc : A + B + Cc} =`, ans: askAC ? 90 - th : 2 * th }],
        askAC ? `The diagonals are perpendicular, so △${A}${Ee}${B} has a right angle at ${Ee}: ∠${B}${A}${Cc} = 90° − ${th}° = ${90 - th}°.` : `A rhombus's diagonals bisect its angles, so ∠${A}${B}${Cc} = 2 × ${th}° = ${2 * th}°.`, { visual: vis }); } },
    c: { t: 'square has both', g: R => { const kind = R.int(0, 2);
      if (kind === 0) { const want = R.bool(), it = R.pick(DIAGTF.filter(d => d[2] === want));
        return E.tf(`True or false: the diagonals of every ${it[0]} ${DPH[it[1]]}.`, want, `${want ? 'True' : 'False'}: ${it[3]}.`); }
      if (kind === 1) { const map = qmap(R, true), [A, B, Cc, D] = [map.A, map.B, map.C, map.D], nm = qn(map), s = R.int(2, 15), P0 = rectP(s, s), sub2 = R.int(0, 2);
        if (sub2 === 2) P0.E = mid(P0.A, P0.C); const rt = [['D', 'A', 'B', '', { right: true }], ['A', 'B', 'C', '', { right: true }], ['B', 'C', 'D', '', { right: true }], ['C', 'D', 'A', '', { right: true }]];
        if (sub2 === 0) return E.num(`${nm} is a square with side ${s}. Find the exact length of diagonal ${A}${Cc}.`, [{ label: A + Cc + ' =', exact: `${s}sqrt(2)` }],
          `${A}${Cc} is the hypotenuse of a right isosceles triangle with legs ${s}: √(${s}² + ${s}²) = ${s}√2.`, { visual: qfig(R, P0, map, { diag: 'AC', ang: rt, lab: { AB: String(s) } }) });
        if (sub2 === 1) return E.num(`${nm} is a square with diagonal ${M(`${s}sqrt(2)`)}. Find its side length.`, [{ label: 'side =', ans: s }], `A square's diagonal is side × √2, so the side is ${s}√2 ÷ √2 = ${s}.`, { visual: qfig(R, P0, map, { diag: 'BD', ang: rt }) });
        const askP = R.bool();
        return E.num(`${nm} is a square whose diagonals meet at ${map.E}. Find ∠${askP ? A + map.E + B : B + A + Cc}.`, [{ label: `∠${askP ? A + map.E + B : B + A + Cc} =`, ans: askP ? 90 : 45 }],
          askP ? `A square is a rhombus, so its diagonals are perpendicular: 90°.` : `A square is a rhombus, so diagonal ${A}${Cc} bisects the 90° angle at ${A}: 45°.`, { visual: qfig(R, P0, map, { diag: 'E', ang: [askP ? ['A', 'E', 'B', '?'] : ['B', 'A', 'C', '?']] }) }); }
      const vsRect = R.bool(), ok = R.pick(vsRect ? ['perpendicular diagonals', 'diagonals that bisect its angles', 'four congruent sides'] : ['congruent diagonals', 'four right angles']);
      return E.choice(R, `Which property does every square have that a ${vsRect ? 'rectangle' : 'rhombus'} might not?`, ok, vsRect ? ['congruent diagonals', 'diagonals that bisect each other', 'four right angles'] : ['perpendicular diagonals', 'diagonals that bisect its angles', 'four congruent sides'],
        `A square is both a rectangle and a rhombus. Every ${vsRect ? 'rectangle already has congruent diagonals that bisect each other and four right angles' : 'rhombus already has perpendicular diagonals that bisect its angles and four congruent sides'}, but only a square is sure to have ${ok}.`); } },
    d: { t: 'solve for x', g: R => { const map = qmap(R, true), [A, B, Cc, D, Ee] = [map.A, map.B, map.C, map.D, map.E], nm = qn(map), kind = R.int(0, 3), x = R.int(3, 14);
      if (kind === 0) { let th; do th = R.int(24, 66); while (Math.abs(th - 45) < 6); const [e1, e2] = exPair(R, th, x), P0 = byDiag(Math.sin(rad(th)), Math.sin(rad(th)), Math.cos(rad(th)), Math.cos(rad(th)), 90);
        delete P0.E; const vis = qfig(R, P0, map, { diag: 'AC,BD', ang: [['A', 'B', 'D', '1'], ['D', 'B', 'C', '2']] }), askB = R.bool(0.35);
        return E.num(`${nm} is a rhombus with ∠1 = ${aT(e1)} and ∠2 = ${aT(e2)}. Find ${askB ? '∠' + A + B + Cc : 'x'}.`, [askB ? { label: `∠${A}${B}${Cc} =`, ans: 2 * th } : { label: 'x =', ans: x }], `Diagonal ${B}${D} bisects ∠${A}${B}${Cc}: ${solveTxt(e1, e2)}, so x = ${x}${askB ? `. Each half is ${th}°, so ∠${A}${B}${Cc} = ${2 * th}°` : ''}.`, { visual: vis }); }
      if (kind === 1) { const e1 = exAt(R, 90, x, 7), ae = R.int(25, 40) / 10, be = R.int(15, 24) / 10;
        return E.num(`${nm} is a rhombus whose diagonals meet at ${Ee}, and ∠${A}${Ee}${B} = ${aT(e1)}. Find x.`, [{ label: 'x =', ans: x }], `The diagonals of a rhombus are perpendicular, so ${solveTxt(e1, null, 90)} and x = ${x}.`, { visual: qfig(R, byDiag(ae, ae, be, be, 90), map, { diag: 'E', ang: [['A', 'E', 'B', '', { color: C.red }]] }) }); }
      if (kind === 2) { let a1; do a1 = R.int(24, 66); while (Math.abs(a1 - 45) < 6); let e1, e2; do { e1 = exAt(R, a1, x); e2 = exAt(R, 90 - a1, x); } while (e1[0] === e2[0] && e1[1] === e2[1]);
        const P0 = rectP(Math.cos(rad(a1)) * 4, Math.sin(rad(a1)) * 4), vis = qfig(R, P0, map, { diag: 'AC', ang: [['B', 'A', 'C', '1'], ['C', 'A', 'D', '2'], ['A', 'B', 'C', '', { right: true }]] });
        return E.num(`${nm} is a rectangle with ∠1 = ${aT(e1)} and ∠2 = ${aT(e2)}. Find x.`, [{ label: 'x =', ans: x }], `The angle at ${A} is a right angle: ${sumTxt(e1, e2, 90)}, so x = ${x}.`, { visual: vis }); }
      const e1 = exAt(R, 45, x, 4), P0 = rectP(3, 3);
      return E.num(`${nm} is a square with ∠${A}${B}${D} = ${aT(e1)}. Find x.`, [{ label: 'x =', ans: x }], `A square's diagonal bisects its right angles, so ${solveTxt(e1, null, 45)} and x = ${x}.`, { visual: qfig(R, P0, map, { diag: 'BD', ang: [['A', 'B', 'D', ''], ['D', 'A', 'B', '', { right: true }], ['B', 'C', 'D', '', { right: true }]] }) }); } },
  });

  /* ================= V.4.06 Trapezoids & kites ================= */
  const KITES = []; TRIPLES.forEach(t => TRIPLES.forEach(u => { for (const [i, j] of [[0, 0], [0, 1], [1, 0], [1, 1]]) if (t[i] === u[j] && t !== u && t[2] <= 30 && u[2] <= 30) KITES.push({ be: t[i], ae: t[1 - i], ab: t[2], ce: u[1 - j], cb: u[2] }); }));
  S('V.4.06', 'Trapezoids & kites', {
    a: { t: 'isosceles trapezoid properties', g: R => { const map = qmap(R), [A, B, Cc, D] = [map.A, map.B, map.C, map.D], nm = qn(map), kind = R.int(0, 2), pre = `${nm} is an isosceles trapezoid with ${A}${B} ∥ ${D}${Cc}.`;
      const AN = { A: ['D', 'A', 'B'], B: ['A', 'B', 'C'], C: ['B', 'C', 'D'], D: ['C', 'D', 'A'] }, o0 = { arr: [['A', 'B', 1], ['D', 'C', 1]], tk: { AD: 1, BC: 1 } };
      if (kind === 0) { const th = R.int(50, 78), ask = R.pick(['B', 'C', 'D']), val = ask === 'B' ? th : 180 - th, P0 = isoTrap(R.int(40, 52) / 10, R.int(16, 28) / 10, th);
        return E.num(`${pre} Find ∠${map[ask]}.`, [{ label: `∠${map[ask]} =`, ans: val }], ask === 'B' ? `Base angles of an isosceles trapezoid are congruent: ∠${B} = ∠${A} = ${th}°.` : `∠${map[ask]} and ${ask === 'D' ? '∠' + A : '∠' + B} are same-side interior angles between the parallel sides, and ∠${B} = ∠${A}: ∠${map[ask]} = 180° − ${th}° = ${val}°.`,
          { visual: qfig(R, P0, map, { ...o0, ang: [[...AN.A, deg(th)], [...AN[ask], '?']] }) }); }
      if (kind === 1) { const x = R.int(2, 9), d = R.int(8, 30), [e1, e2] = exPair(R, d, x), P0 = isoTrap(R.int(40, 52) / 10, R.int(16, 28) / 10, R.int(55, 72));
        return E.num(`${pre} Its diagonals are ${A}${Cc} = ${M(linM(...e1))} and ${B}${D} = ${M(linM(...e2))}. Find x.`, [{ label: 'x =', ans: x }], `The diagonals of an isosceles trapezoid are congruent: ${solveTxt(e1, e2)}, so x = ${x}.`, { visual: qfig(R, P0, map, { ...o0, diag: 'AC,BD' }) }); }
      const ok = R.pick([`${A}${Cc} ≅ ${B}${D}`, `∠${A} ≅ ∠${B}`, `∠${D} ≅ ∠${Cc}`]);
      return E.choice(R, `${pre} Which statement must be true?`, ok, [`${A}${B} ≅ ${D}${Cc}`, `${A}${Cc} ⟂ ${B}${D}`, `∠${A} ≅ ∠${Cc}`],
        `In an isosceles trapezoid the base angles are congruent and the diagonals are congruent. The bases have different lengths, the diagonals are not perpendicular in general, and ∠${A} and ∠${Cc} are supplementary, not congruent.`); } },
    b: { t: 'trapezoid midsegment', g: R => { const map = qmap(R, true), [A, B, Cc, D] = [map.A, map.B, map.C, map.D], nm = qn(map), L2 = R.sample(POOL.filter(c => !Object.values(map).includes(c)), 2), Mn = L2[0], Nn = L2[1];
      let b1, b2; do { b1 = R.int(6, 30); b2 = R.int(3, 24); } while (b1 - b2 < 3 || b2 < 0.3 * b1 || (b1 + b2) % 2 && R.bool(0.6));
      const h = (b1 + b2) / 2 * R.int(50, 75) / 100, s = (b1 - b2) * R.int(20, 80) / 100, P0 = trap(b1, b2, h, s); P0.M = mid(P0.A, P0.D); P0.N = mid(P0.B, P0.C);
      const mp = { ...map, M: Mn, N: Nn }, m = (b1 + b2) / 2, askM = R.bool(0.55), pre = `${nm} is a trapezoid with bases ${A}${B} and ${D}${Cc}. ${Mn} and ${Nn} are the midpoints of ${A}${D} and ${B}${Cc}.`;
      const vis = qfig(R, P0, mp, { skip: ['DA', 'BC'], segs: ['AM', 'MD', 'BN', 'NC', 'MN'], tk: { AM: 1, MD: 1, BN: 2, NC: 2 }, arr: [['A', 'B', 1], ['D', 'C', 1]], lab: askM ? { AB: String(b1), DC: String(b2), MN: '?' } : { AB: String(b1), DC: '?', MN: String(m) } });
      if (askM) return E.num(`${pre} Find ${Mn}${Nn}.`, [{ label: Mn + Nn + ' =', ans: m }], `The midsegment is the average of the bases: (${b1} + ${b2}) ÷ 2 = ${m}. It is not half of one base.`, { visual: vis });
      return E.num(`${pre} Find ${D}${Cc}.`, [{ label: D + Cc + ' =', ans: b2 }], `${Mn}${Nn} = (${A}${B} + ${D}${Cc}) ÷ 2, so ${D}${Cc} = 2 × ${m} − ${b1} = ${b2}.`, { visual: vis }); } },
    c: { t: 'kite diagonals', g: R => { if (R.bool(0.35)) return quadPf(R, kitePf(R), mode4(R));
      const map = qmap(R, true), [A, B, Cc, D, Ee] = [map.A, map.B, map.C, map.D, map.E], nm = qn(map), kind = R.int(0, 2), pre = `${nm} is a kite with ${A}${B} = ${A}${D} and ${Cc}${B} = ${Cc}${D}. Its diagonals meet at ${Ee}.`;
      if (kind === 0) { const k = R.pick(KITES), askA = R.bool(), sc = k.ab > 20 || k.cb > 20 ? 1 : R.pick([1, 1, 2]), ae = k.ae * sc, ce = k.ce * sc, be = k.be * sc;
        const vis = qfig(R, kiteP(ae, ce, be), map, { diag: 'E', tk: { AB: 1, AD: 1, CB: 2, CD: 2 }, lab: askA ? { AE: String(ae), BE: String(be) } : { CE: String(ce), ED: String(be) }, ang: [['A', 'E', 'B', '', { right: true }]] });
        const side = askA ? A + B : Cc + D, val = (askA ? k.ab : k.cb) * sc;
        return E.num(`${pre} Find ${side}.`, [{ label: side + ' =', ans: val }], `A kite's diagonals are perpendicular, so △${askA ? A + Ee + B : Cc + Ee + D} is right: ${side} = √(${askA ? ae : ce}² + ${be}²) = ${val}.`, { visual: vis }); }
      if (kind === 1) { let al, ga; do { al = 2 * R.int(20, 55); ga = 2 * R.int(20, 55); } while (Math.abs(al - ga) < 16 || al + ga > 200 || (360 - al - ga) % 2);
        const P0 = kiteP(1 / Math.tan(rad(al / 2)), 1 / Math.tan(rad(ga / 2)), 1), ask = R.pick(['B', 'D']), bv = (360 - al - ga) / 2; delete P0.E;
        const vis = qfig(R, P0, map, { tk: { AB: 1, AD: 1, CB: 2, CD: 2 }, ang: [['D', 'A', 'B', deg(al)], ['B', 'C', 'D', deg(ga)], ask === 'B' ? ['A', 'B', 'C', '?'] : ['C', 'D', 'A', '?']] });
        return E.num(`${nm} is a kite with ${A}${B} = ${A}${D} and ${Cc}${B} = ${Cc}${D}. Find ∠${map[ask]}.`, [{ label: `∠${map[ask]} =`, ans: bv }], `The angles between the unequal sides, ∠${B} and ∠${D}, are congruent, and all four add to 360°: (360 − ${al} − ${ga}) ÷ 2 = ${bv}°.`, { visual: vis }); }
      let th; do th = R.int(18, 60); while (Math.abs(th - 45) < 5);
      const P0 = kiteP(1 / Math.tan(rad(th)), R.int(5, 9) / 10, 1);
      return E.num(`${pre} ∠${B}${A}${Cc} = ${th}°. Find ∠${A}${B}${D}.`, [{ label: `∠${A}${B}${D} =`, ans: 90 - th }], `The diagonals of a kite are perpendicular, so △${A}${Ee}${B} has a right angle at ${Ee}: ∠${A}${B}${D} = 90° − ${th}° = ${90 - th}°.`,
        { visual: qfig(R, P0, map, { diag: 'E', tk: { AB: 1, AD: 1, CB: 2, CD: 2 }, ang: [['B', 'A', 'E', deg(th)], ['A', 'B', 'E', '?']] }) }); } },
    d: { t: 'solve for x', g: R => { const map = qmap(R, true), [A, B, Cc, D, Ee] = [map.A, map.B, map.C, map.D, map.E], nm = qn(map), kind = R.int(0, 3), x = R.int(2, 12);
      if (kind === 0) { let b1, b2, e1, e2, em; do { b1 = R.int(8, 34); b2 = R.int(3, 26); } while (b1 - b2 < 3 || b2 < 0.3 * b1 || (b1 + b2) % 2);
        do { e1 = exAt(R, b1, x, 4); e2 = exAt(R, b2, x, 4); em = exAt(R, (b1 + b2) / 2, x, 4); } while (2 * em[0] === e1[0] + e2[0]);
        const L2 = R.sample(POOL.filter(c => !Object.values(map).includes(c)), 2), mp = { ...map, M: L2[0], N: L2[1] }, P0 = trap(b1, b2, (b1 + b2) * 0.4, (b1 - b2) * R.int(25, 75) / 100); P0.M = mid(P0.A, P0.D); P0.N = mid(P0.B, P0.C);
        const vis = qfig(R, P0, mp, { skip: ['DA', 'BC'], segs: ['AM', 'MD', 'BN', 'NC', 'MN'], tk: { AM: 1, MD: 1, BN: 2, NC: 2 }, arr: [['A', 'B', 1], ['D', 'C', 1]], lab: { AB: lin(...e1), DC: lin(...e2), MN: lin(...em) } });
        return E.num(`${nm} is a trapezoid and ${mp.M}${mp.N} is its midsegment. Find x.`, [{ label: 'x =', ans: x }], `The midsegment is the average of the bases: ${M(`2(${linM(...em)})=${linM(...e1)}+${e2[0] === 1 ? '' : e2[0]}x${e2[1] > 0 ? '+' + e2[1] : e2[1]}`)}, so x = ${x}.`, { visual: vis }); }
      if (kind === 1) { const th = R.int(50, 78), supp = R.bool(), AN = { A: ['D', 'A', 'B'], B: ['A', 'B', 'C'], D: ['C', 'D', 'A'] }, P0 = isoTrap(R.int(40, 52) / 10, R.int(16, 28) / 10, th);
        let e1, e2; if (supp) do { e1 = exAt(R, th, x); e2 = exAt(R, 180 - th, x); } while (e1[0] === e2[0] && e1[1] === e2[1]); else [e1, e2] = exPair(R, th, x);
        const vis = qfig(R, P0, map, { arr: [['A', 'B', 1], ['D', 'C', 1]], tk: { AD: 1, BC: 1 }, ang: [[...AN.A, angLab(...e1)], [...AN[supp ? 'D' : 'B'], angLab(...e2)]] });
        return E.num(`${nm} is an isosceles trapezoid with ${A}${B} ∥ ${D}${Cc}. Find x.`, [{ label: 'x =', ans: x }], supp ? `∠${A} and ∠${D} are same-side interior angles between the parallel sides: ${sumTxt(e1, e2, 180)}, so x = ${x}.` : `Base angles of an isosceles trapezoid are congruent: ${solveTxt(e1, e2)}, so x = ${x}.`, { visual: vis }); }
      if (kind === 2) { let al, ga; do { al = 2 * R.int(20, 55); ga = 2 * R.int(20, 55); } while (Math.abs(al - ga) < 16 || al + ga > 200); const bv = (360 - al - ga) / 2;
        const [e1, e2] = exPair(R, bv, x), P0 = kiteP(1 / Math.tan(rad(al / 2)), 1 / Math.tan(rad(ga / 2)), 1); delete P0.E;
        const vis = qfig(R, P0, map, { tk: { AB: 1, AD: 1, CB: 2, CD: 2 }, ang: [['A', 'B', 'C', '', { n: 1 }], ['C', 'D', 'A', '', { n: 1 }]] });
        return E.num(`${nm} is a kite with ${A}${B} = ${A}${D} and ${Cc}${B} = ${Cc}${D}, ∠${B} = ${aT(e1)} and ∠${D} = ${aT(e2)}. Find x.`, [{ label: 'x =', ans: x }], `In a kite the angles between the unequal sides are congruent: ${solveTxt(e1, e2)}, so x = ${x}.`, { visual: vis }); }
      const e1 = exAt(R, 90, x, 7), P0 = kiteP(R.int(18, 30) / 10, R.int(8, 14) / 10, R.int(10, 16) / 10);
      return E.num(`${nm} is a kite whose diagonals meet at ${Ee}, and ∠${B}${Ee}${Cc} = ${aT(e1)}. Find x.`, [{ label: 'x =', ans: x }], `A kite's diagonals are perpendicular: ${solveTxt(e1, null, 90)}, so x = ${x}.`, { visual: qfig(R, P0, map, { diag: 'E', tk: { AB: 1, AD: 1, CB: 2, CD: 2 }, ang: [['B', 'E', 'C', '']] }) }); } },
  });

  /* ================= V.4.07 Quadrilateral family tree ================= */
  const UP = { square: ['rectangle', 'rhombus', 'parallelogram', 'quadrilateral'], rectangle: ['parallelogram', 'quadrilateral'], rhombus: ['parallelogram', 'quadrilateral'], parallelogram: ['quadrilateral'], quadrilateral: [] };
  const DEF = { parallelogram: 'both pairs of opposite sides parallel', rectangle: 'four right angles', rhombus: 'four congruent sides', square: 'four right angles and four congruent sides', quadrilateral: 'four sides' };
  const NOT = { rectangle: 'a 3 by 5 rectangle does not have four congruent sides', rhombus: 'a rhombus with 60° and 120° angles has no right angles', parallelogram: 'a slanted parallelogram with sides 3 and 5 has no right angles and unequal sides', quadrilateral: 'a quadrilateral with no parallel sides is none of the special shapes' };
  const SH = ['square', 'rectangle', 'rhombus', 'parallelogram', 'quadrilateral'];
  const ASN = [
    ['congruent diagonals', { parallelogram: ['S', 'only when it is a rectangle'], rectangle: ['A', 'every rectangle has congruent diagonals'], rhombus: ['S', 'only when it is a square'], square: ['A', 'a square is a rectangle'], kite: ['S', 'some kites do, but most do not'] }],
    ['perpendicular diagonals', { parallelogram: ['S', 'only when it is a rhombus'], rectangle: ['S', 'only when it is a square'], rhombus: ['A', 'every rhombus has perpendicular diagonals'], square: ['A', 'a square is a rhombus'], kite: ['A', 'every kite has perpendicular diagonals'] }],
    ['four right angles', { parallelogram: ['S', 'only when it is a rectangle'], rectangle: ['A', 'that is what makes it a rectangle'], rhombus: ['S', 'only when it is a square'], square: ['A', 'a square is a rectangle'] }],
    ['four congruent sides', { parallelogram: ['S', 'only when it is a rhombus'], rectangle: ['S', 'only when it is a square'], rhombus: ['A', 'that is what makes it a rhombus'], square: ['A', 'a square is a rhombus'] }],
    ['diagonals that bisect each other', { parallelogram: ['A', 'this is true of every parallelogram'], rectangle: ['A', 'a rectangle is a parallelogram'], rhombus: ['A', 'a rhombus is a parallelogram'], square: ['A', 'a square is a parallelogram'] }],
    ['exactly one pair of parallel sides', { parallelogram: ['N', 'it has two pairs of parallel sides'], rectangle: ['N', 'it is a parallelogram, with two pairs of parallel sides'], rhombus: ['N', 'it is a parallelogram, with two pairs of parallel sides'], square: ['N', 'it is a parallelogram, with two pairs of parallel sides'], kite: ['N', 'a kite with one pair of parallel sides has two pairs: it is a rhombus'] }],
    ['exactly three right angles', Object.fromEntries(['parallelogram', 'rectangle', 'rhombus', 'square', 'kite'].map(s => [s, ['N', 'if three angles are 90°, the fourth is 360° − 270° = 90° too']]))],
    ['an obtuse angle', { parallelogram: ['S', 'it does unless it is a rectangle'], rectangle: ['N', 'all of its angles are 90°'], rhombus: ['S', 'it does unless it is a square'], square: ['N', 'all of its angles are 90°'] }],
    ['exactly two right angles', { parallelogram: ['N', 'one right angle makes all four angles right'], rectangle: ['N', 'it has four right angles'], rhombus: ['N', 'one right angle makes all four angles right'], square: ['N', 'it has four right angles'], kite: ['S', 'its two congruent opposite angles can both be 90°, but they usually are not'] }],
    ['angles that add to 360°', Object.fromEntries(['parallelogram', 'rectangle', 'rhombus', 'square', 'kite'].map(s => [s, ['A', 'the angles of every quadrilateral add to 360°']]))],
  ];
  const ASW = { A: 'always', S: 'sometimes', N: 'never' };
  const MINC = [
    ['parallelogram', 'rectangle', ['one right angle', 'congruent diagonals'], ['perpendicular diagonals', 'two consecutive sides congruent', 'opposite angles congruent', 'diagonals that bisect each other']],
    ['parallelogram', 'rhombus', ['perpendicular diagonals', 'two consecutive sides congruent', 'a diagonal that bisects one of its angles'], ['one right angle', 'congruent diagonals', 'opposite sides congruent', 'diagonals that bisect each other']],
    ['rectangle', 'square', ['two consecutive sides congruent', 'perpendicular diagonals'], ['congruent diagonals', 'opposite sides parallel', 'one right angle', 'diagonals that bisect each other']],
    ['rhombus', 'square', ['one right angle', 'congruent diagonals'], ['perpendicular diagonals', 'four congruent sides', 'diagonals that bisect each other', 'opposite angles congruent']],
    ['quadrilateral', 'parallelogram', ['both pairs of opposite sides congruent', 'diagonals that bisect each other', 'one pair of opposite sides both parallel and congruent'], ['one pair of parallel sides', 'congruent diagonals', 'perpendicular diagonals', 'one pair of opposite sides congruent']] ];
  const FACTS = [
    [['diagonals that bisect each other'], 'parallelogram'], [['diagonals that bisect each other', 'congruent diagonals'], 'rectangle'], [['diagonals that bisect each other', 'perpendicular diagonals'], 'rhombus'],
    [['diagonals that bisect each other', 'congruent diagonals', 'perpendicular diagonals'], 'square'], [['both pairs of opposite sides parallel', 'one right angle'], 'rectangle'], [['four congruent sides'], 'rhombus'],
    [['four congruent sides', 'one right angle'], 'square'], [['four congruent sides', 'congruent diagonals'], 'square'], [['both pairs of opposite sides congruent'], 'parallelogram'],
    [['one pair of opposite sides parallel and congruent', 'perpendicular diagonals'], 'rhombus'], [['four right angles'], 'rectangle'], [['four right angles', 'perpendicular diagonals'], 'square'],
    [['one pair of opposite sides parallel and congruent', 'one right angle'], 'rectangle'], [['both pairs of opposite angles congruent'], 'parallelogram'], [['four right angles', 'two consecutive sides congruent'], 'square'] ];
  const WHYF = { parallelogram: 'That proves a parallelogram, but nothing forces right angles or equal sides.', rectangle: 'These facts give a parallelogram with a right angle (or with congruent diagonals), which is a rectangle; nothing forces equal sides.',
    rhombus: 'These facts give a parallelogram with equal sides (or with perpendicular diagonals), which is a rhombus; nothing forces right angles.', square: 'It is both a rectangle and a rhombus, so it is a square.' };
  const slopeT = (dy, dx) => dx === 0 ? 'undefined' : E.pt(E.fracStr(dy, dx));
  S('V.4.07', 'Quadrilateral family tree', {
    a: { t: 'the hierarchy', g: R => {
      if (R.bool(0.6)) { const want = R.bool(); let X, Y; do { X = R.pick(SH); Y = R.pick(SH); } while (X === Y || UP[X].includes(Y) !== want);
        return E.tf(`True or false: every ${X} is ${an(Y)} ${Y}.`, want, want ? `True: every ${X} has ${DEF[Y]}, so it is ${an(Y)} ${Y}.` : `False: ${NOT[X]}, so it is not ${an(Y)} ${Y}.`); }
      const X = R.pick(['rectangle', 'rhombus']), ok = R.pick(UP[X]), bad = { rectangle: ['square', 'rhombus', 'kite'], rhombus: ['square', 'rectangle', 'isosceles trapezoid'] }[X];
      return E.choice(R, `Every ${X} is also which of these?`, ok, bad,
        `A ${X} sits below the ${UP[X].join(' and the ')} in the family tree, so it is ${an(ok)} ${ok}. It is not always ${bad.slice(0, 2).map(b => an(b) + ' ' + b).join(' or ')}.`); } },
    b: { t: 'always, sometimes, never', g: R => { const want = R.pick(['A', 'S', 'N']), opts = [];
      ASN.forEach(([ph, t]) => Object.entries(t).forEach(([sh, [a, w]]) => { if (a === want) opts.push([ph, sh, w]); }));
      if (want === 'S' && R.bool(0.3)) { const pr = R.pick([['rectangle', 'rhombus', 'exactly when it is a square'], ['rhombus', 'square', 'only when its angles are right angles'], ['parallelogram', 'rectangle', 'only when its angles are right angles'], ['rhombus', 'rectangle', 'exactly when it is a square'], ['parallelogram', 'rhombus', 'only when its sides are all congruent']]);
        return E.choiceFixed(`Fill in the blank: ${an(pr[0]).replace(/^a/, 'A')} ${pr[0]} is ___ ${an(pr[1])} ${pr[1]}.`, ['always', 'sometimes', 'never'], 1, `Sometimes: ${an(pr[0])} ${pr[0]} is ${an(pr[1])} ${pr[1]} ${pr[2]}, but not in general.`); }
      if (want === 'A' && R.bool(0.3)) { const X = R.pick(['square', 'rectangle', 'rhombus']), Y = R.pick(UP[X]);
        return E.choiceFixed(`Fill in the blank: ${an(X).replace(/^a/, 'A')} ${X} is ___ ${an(Y)} ${Y}.`, ['always', 'sometimes', 'never'], 0, `Always: every ${X} has ${DEF[Y]}.`); }
      const [ph, sh, w] = R.pick(opts);
      return E.choiceFixed(`Fill in the blank: ${an(sh).replace(/^a/, 'A')} ${sh} ___ has ${ph}.`, ['always', 'sometimes', 'never'], 'ASN'.indexOf(want), `${ASW[want][0].toUpperCase() + ASW[want].slice(1)}: ${w}.`); } },
    c: { t: 'minimum conditions', g: R => { const [from, to, good, bad] = R.pick(MINC), ok = R.pick(good);
      return E.choice(R, `Which one extra fact is enough to make ${from === 'quadrilateral' ? 'a quadrilateral' : an(from) + ' ' + from} ${an(to)} ${to}?`, ok, R.sample(bad, 3),
        `${ok[0].toUpperCase() + ok.slice(1)}: that one fact makes ${an(from)} ${from} ${an(to)} ${to}. ${from === 'quadrilateral' ? 'One pair of parallel sides, or one congruent pair alone, could be a trapezoid or a kite.' : `The other facts are already true of every ${from}, or point to a different shape.`}`); } },
    d: { t: 'classify from facts', g: R => { const NAMES4 = ['parallelogram', 'rectangle', 'rhombus', 'square'];
      if (R.bool(0.55)) { const [fs, ans] = R.pick(FACTS);
        return E.choice(R, `A quadrilateral has ${fs.length > 1 ? fs.slice(0, -1).join(', ') + ' and ' + fs[fs.length - 1] : fs[0]}. What is the most specific name for it?`, ans, NAMES4.filter(n => n !== ans), WHYF[ans]); }
      const cls = R.pick(NAMES4); let u, v, P0;
      do { u = [R.int(-4, 4), R.int(-4, 4)]; const k = R.pick([2, 3]);
        v = cls === 'square' ? [-u[1], u[0]] : cls === 'rectangle' ? [-u[1] * k, u[0] * k] : cls === 'rhombus' ? (R.bool() ? [u[1], u[0]] : [u[0], -u[1]]) : [R.int(-4, 4), R.int(1, 5)];
        P0 = [R.int(-5, 2), R.int(-5, 0)]; }
      while (u[0] * v[1] - u[1] * v[0] < 0.4 * Math.hypot(...u) * Math.hypot(...v) || u[0] * u[0] + u[1] * u[1] < 5 || (cls !== 'square' && cls !== 'rectangle' && Math.abs(u[0] * v[0] + u[1] * v[1]) < 0.26 * Math.hypot(...u) * Math.hypot(...v)) || (cls === 'parallelogram' && (u[0] * v[0] + u[1] * v[1] === 0 || u[0] ** 2 + u[1] ** 2 === v[0] ** 2 + v[1] ** 2)) || (cls === 'rhombus' && u[0] * v[0] + u[1] * v[1] === 0) || Math.max(...[add(P0, u), add(add(P0, u), v), add(P0, v)].flat().map(Math.abs)) > 9);
      const pts = [P0, add(P0, u), add(add(P0, u), v), add(P0, v)], nm = R.pick(QSETS).split(''), l1 = u[0] ** 2 + u[1] ** 2, l2 = v[0] ** 2 + v[1] ** 2, perp = u[0] * v[0] + u[1] * v[1] === 0;
      const rt = q => Number.isInteger(Math.sqrt(q)) ? String(Math.sqrt(q)) : E.pt(E.surdStr(0, 1, q)), sl = (a, b) => slopeT(a, b) === 'undefined' ? 'undefined (vertical)' : slopeT(a, b);
      const ex = `Opposite sides are parallel and congruent, so it is a parallelogram. ${nm[0]}${nm[1]} = ${rt(l1)} and ${nm[1]}${nm[2]} = ${rt(l2)} (${l1 === l2 ? 'equal' : 'not equal'}); their slopes, ${sl(u[1], u[0])} and ${sl(v[1], v[0])}, ${perp ? 'show a right angle' : 'show no right angle'}. So it is ${an(cls)} ${cls}.`;
      return E.choiceFixed(`${nm.map((c, i) => c + ptTxt(pts[i])).join(', ')}. What is the most specific name for ${nm.join('')}?`, NAMES4, NAMES4.indexOf(cls), ex, { visual: gridFig(pts, nm) }); } },
  });

  /* ================= V.4.08 Regular polygon area ================= */
  const regFig = (R, n, o = {}) => { const rot = R.int(0, 71) * 5, V0 = reg(n, 1, rot), L3 = lets(R, 3), [An, Bn, Mn] = o.names ? L3 : ['_a', '_b', '_m'], P = { O: [0, 0], [An]: V0[0], [Bn]: V0[1], [Mn]: mid(V0[0], V0[1]) }, names = [An, Bn];
    for (let k = 2; k < n; k++) { P['_' + k] = V0[k]; names.push('_' + k); }
    const segs = loop(names).map(([a, b]) => [a, b, a === An && b === Bn && o.side ? { lab: o.side } : {}]);
    segs.push(['O', Mn, o.apo !== undefined ? { lab: o.apo, ref: An } : {}]); if (o.radius !== false) segs.push(['O', An, o.rad !== undefined ? { lab: o.rad, ref: Bn } : {}]); if (o.both) segs.push(['O', Bn]);
    const angles = [['O', Mn, Bn, '', { right: true }]]; if (o.cent) angles.push([An, 'O', Bn, o.cent]);
    return { vis: fig({ pts: P, segs, angles, w: 260, label: regName(n) + ' with its apothem' }), An, Bn, Mn }; };
  const apo = (n, s) => s / (2 * Math.tan(Math.PI / n));
  const r1 = v => Math.round(v * 10) / 10;
  S('V.4.08', 'Regular polygon area', {
    a: { t: 'apothem', g: R => { const kind = R.int(0, 2);
      if (kind === 0) { const n = R.int(5, 8), askR = R.bool(0.35), f = regFig(R, n, { both: true, names: true }), [A, B, Mm] = [f.An, f.Bn, f.Mn];
        return E.choice(R, `O is the center of the regular ${nName(n)} and ${Mm} is the midpoint of side ${A}${B}. Which segment is ${askR ? 'a radius' : 'an apothem'}?`, askR ? `O${A}` : `O${Mm}`, askR ? [`O${Mm}`, `${A}${B}`, `${A}${Mm}`] : [`O${A}`, `${A}${B}`, `${A}${Mm}`],
          askR ? `A radius joins the center to a vertex: O${A}. O${Mm}, to the middle of a side, is the apothem.` : `The apothem joins the center to the midpoint of a side, meeting it at a right angle: O${Mm}. O${A} goes to a corner, so it is a radius.`, { visual: f.vis }); }
      if (kind === 1) { const n = R.pick([5, 6, 8, 9, 10, 12, 15, 18, 20]), f = regFig(R, Math.min(n, 12), { cent: '?', both: true, radius: true, names: true });
        return E.num(`Find the central angle ∠${f.An}O${f.Bn} of a regular ${nName(n)}.`, [{ label: 'angle =', ans: 360 / n }], `The ${n} central angles fill the full turn around O: 360° ÷ ${n} = ${360 / n}°.`, n <= 12 ? { visual: f.vis } : {}); }
      const sq = R.bool(0.4);
      if (sq) { const s = 2 * R.int(1, 10), f = regFig(R, 4, { side: String(s), apo: '?' });
        return E.num(`The square has side ${s}. Find its apothem.`, [{ label: 'apothem =', ans: s / 2 }], `The apothem runs from the center to the middle of a side, half the width of the square: ${s} ÷ 2 = ${s / 2}.`, { visual: f.vis }); }
      const s = 2 * R.int(1, 12), f = regFig(R, 6, { rad: String(s), apo: '?' });
      return E.num(`The regular hexagon has radius ${s}. Find the exact length of its apothem.`, [{ label: 'apothem =', exact: `${s / 2}sqrt(3)`.replace(/^1sqrt/, 'sqrt') }],
        `A regular hexagon is six equilateral triangles of side ${s}. The apothem is the height of one: √(${s}² − ${s / 2}²) = ${s / 2 === 1 ? '' : s / 2}√3.`, { visual: f.vis }); } },
    b: { t: 'A = ½·apothem·perimeter', g: R => { const n = R.pick([5, 6, 7, 8, 9, 10, 12]), s = R.int(2, 16), a = r1(apo(n, s)), P = n * s, A = r2x(0.5 * a * P), kind = R.int(0, 2);
      const f = regFig(R, Math.min(n, 12), { side: String(s), apo: String(a), radius: false });
      if (kind === 0) return E.num(`A regular ${nName(n)} has side ${s} and apothem ${a}. Find its area.`, [{ label: 'area =', ans: A }], `Perimeter = ${n} × ${s} = ${P}. Area = ½ × apothem × perimeter = ½ × ${a} × ${P} = ${A}. Use the apothem, not the radius.`, { visual: f.vis });
      if (kind === 1) { const f2 = regFig(R, n, { side: String(s), apo: '?', radius: false });
        return E.num(`A regular ${nName(n)} has side ${s} and area ${A}. Find its apothem.`, [{ label: 'apothem =', ans: a }], `Perimeter = ${n} × ${s} = ${P}, and ${A} = ½ × apothem × ${P}, so apothem = 2 × ${A} ÷ ${P} = ${a}.`, { visual: f2.vis }); }
      const f3 = regFig(R, n, { side: '?', apo: String(a), radius: false });
      return E.num(`A regular ${nName(n)} has apothem ${a} and area ${A}. Find its side length.`, [{ label: 'side =', ans: s }], `${A} = ½ × ${a} × perimeter, so the perimeter is 2 × ${A} ÷ ${a} = ${P}, and each of the ${n} sides is ${P} ÷ ${n} = ${s}.`, { visual: f3.vis }); } },
    c: { t: 'find the apothem with trig', g: R => { const n = R.pick([5, 7, 8, 9, 10, 12]), kind = R.int(0, 2), h = 180 / n, hT = Number.isInteger(h) ? String(h) : (Math.round(h * 100) / 100).toFixed(2);
      if (kind === 2) { const r = R.int(3, 20), a = r * Math.cos(Math.PI / n), f = regFig(R, n, { rad: String(r), apo: '?' });
        return E.num(`A regular ${nName(n)} has radius ${r}. Find its apothem to 2 decimal places.`, [{ label: 'apothem =', ans: Math.round(a * 100) / 100, dp: 2 }],
          `The radius, apothem and half a side make a right triangle with angle 360° ÷ ${2 * n} ${Number.isInteger(h) ? "=" : "≈"} ${hT}° at the center: apothem = ${r} cos ${hT}° ≈ ${a.toFixed(2)}.`, { visual: f.vis }); }
      const s = R.int(2, 20), a = apo(n, s), area = 0.5 * a * n * s, f = regFig(R, n, { side: String(s), apo: kind ? undefined : '?', radius: false });
      if (kind === 0) return E.num(`A regular ${nName(n)} has side ${s}. Find its apothem to 2 decimal places.`, [{ label: 'apothem =', ans: Math.round(a * 100) / 100, dp: 2 }],
        `The apothem splits the central angle 360° ÷ ${n} in half, ${Number.isInteger(h) ? "" : "about "}${hT}°, and meets the side at its midpoint: tan ${hT}° = ${s / 2} ÷ apothem, so apothem = ${s / 2} ÷ tan ${hT}° ≈ ${a.toFixed(2)}.`, { visual: f.vis });
      return E.num(`A regular ${nName(n)} has side ${s}. Find its area to 1 decimal place. (Round only at the end.)`, [{ label: 'area =', ans: Math.round(area * 10) / 10, dp: 1 }],
        `Apothem = ${s / 2} ÷ tan ${hT}° ≈ ${a.toFixed(3)}. Area = ½ × ${a.toFixed(3)} × ${n * s} ≈ ${area.toFixed(1)}.`, { visual: f.vis }); } },
    d: { t: 'approach the circle', g: R => { const kind = R.int(0, 2), r = R.int(3, 10);
      if (kind === 1) { const per = R.bool();
        return E.choice(R, `A regular polygon is drawn inside a circle of radius ${r}, with its vertices on the circle. As the number of sides grows, its ${per ? 'perimeter' : 'area'} gets closer and closer to what?`,
          per ? `${2 * r}π` : `${r * r}π`, per ? [`${r * r}π`, `${2 * r}`, `${4 * r}`] : [`${2 * r}π`, `${r * r}`, `${2 * r * r}`],
          per ? `The sides hug the circle more and more closely, so the perimeter approaches the circumference 2πr = ${2 * r}π.` : `The apothem approaches the radius and the perimeter approaches 2πr, so ½ × apothem × perimeter approaches ½ × r × 2πr = πr² = ${r * r}π.`); }
      const n = R.pick([12, 20, 24, 30, 36, 60, 90, 100, 180, 360]);
      if (kind === 0) { const A = 0.5 * n * r * r * Math.sin(2 * Math.PI / n);
        return E.num(`A regular ${n}-gon has its vertices on a circle of radius ${r}. Find its area to 2 decimal places.`, [{ label: 'area =', ans: Math.round(A * 100) / 100, dp: 2 }],
          `It is ${n} isosceles triangles with sides ${r}, ${r} and apex angle ${r2x(360 / n)}°: area = ${n} × ½ × ${r}² × sin ${r2x(360 / n)}° ≈ ${A.toFixed(2)}. Compare πr² ≈ ${(Math.PI * r * r).toFixed(2)}.`); }
      const Pm = 2 * n * r * Math.sin(Math.PI / n);
      return E.num(`A regular ${n}-gon has its vertices on a circle of radius ${r}. Find its perimeter to 2 decimal places.`, [{ label: 'perimeter =', ans: Math.round(Pm * 100) / 100, dp: 2 }],
        `Each side is 2 × ${r} × sin ${r2x(180 / n)}°, so the perimeter is ${2 * n * r} sin ${r2x(180 / n)}° ≈ ${Pm.toFixed(2)}, close to the circumference ${2 * r}π ≈ ${(2 * Math.PI * r).toFixed(2)}.`); } },
    e: { t: 'exact areas of special polygons', g: R => { const kind = R.int(0, 3);
      if (kind === 0) { const s = R.int(2, 12), f = regFig(R, 6, { side: String(s), radius: false });
        return E.num(`Find the exact area of a regular hexagon with side ${s}.`, [{ label: 'area =', exact: E.surdStr(0, 3 * s * s, 3, 2) }], `It is six equilateral triangles of side ${s}, each with area (√3/4)·${s}²: 6 × (√3/4) × ${s * s} = ${E.pt(E.surdStr(0, 3 * s * s, 3, 2))}.`, { visual: f.vis }); }
      if (kind === 1) { const a = R.int(1, 9), f = regFig(R, 3, { apo: String(a), radius: false });
        return E.num(`An equilateral triangle has apothem ${a}. Find its exact area.`, [{ label: 'area =', exact: `${3 * a * a}sqrt(3)` }], `The apothem and half a side make a right triangle with a 60° angle at the center: half a side = ${a}·tan 60° = ${a === 1 ? '' : a}√3, so the perimeter is ${6 * a}√3 and the area = ½ × ${a} × ${6 * a}√3 = ${3 * a * a}√3.`, { visual: f.vis }); }
      if (kind === 2) { const r = R.int(2, 15), f = regFig(R, 4, { rad: String(r) });
        return E.num(`A square has radius ${r} (center to corner). Find its area.`, [{ label: 'area =', ans: 2 * r * r }], `The diagonals are ${2 * r} and perpendicular, so the square is four right triangles with legs ${r}: 4 × ½ × ${r}² = ${2 * r * r}. (Or side = ${r}√2, area = ${2 * r * r}.)`, { visual: f.vis }); }
      const a = R.int(2, 10), f = regFig(R, 6, { apo: `${a}√3`, radius: false });
      return E.num(`A regular hexagon has apothem ${M(`${a}sqrt(3)`)}. Find its exact area.`, [{ label: 'area =', exact: `${6 * a * a}sqrt(3)` }], `The apothem is the height of an equilateral triangle, side × √3/2, so the side is ${2 * a}. Area = ½ × ${a}√3 × (6 × ${2 * a}) = ${6 * a * a}√3.`, { visual: f.vis }); } },
    f: { t: 'shaded regions in regular polygons', g: R => {
      const HEX = [[[0, 1, 2], 1, 6], [[0, 2, 4], 1, 2], [[0, 1, 3, 4], 2, 3], [[0, 2, 3], 1, 3], [[0, 1, 2, 3], 1, 2], ['inner', 1, 3], ['star', 2, 3], ['pt', 1, 2]];
      const k = R.int(2, 10), fr = (n, d) => E.pt(E.fracStr(n, d));
      if (R.bool(0.2)) { const H = 8 * k, V0 = reg(8, 1, 22.5 + R.int(0, 7) * 45), L = consec(R, 8), P = { _o: [0, 0] }; L.forEach((c, i) => P[c] = V0[i]); const tri = R.bool(0.4);
        const sh = tri ? [L[0], L[1], L[4]] : [L[0], L[1], L[4], L[5]], ans = tri ? H / 4 : H / 2;
        return E.num(`The regular octagon ${L.join('')} has area ${H}. Find the area of ${tri ? '△' + sh.join('') : 'rectangle ' + sh.join('')}.`, [{ label: 'area =', ans }],
          `Join the center O: the octagon is 8 congruent triangles with 45° at O. Rectangle ${L[0]}${L[1]}${L[4]}${L[5]} is △O${L[0]}${L[1]}, △O${L[1]}${L[4]}, △O${L[4]}${L[5]} and △O${L[5]}${L[0]}; the two with 135° at O have the same area as the others, since sin 135° = sin 45°. So the rectangle is 4/8 of ${H} = ${H / 2}${tri ? `, and diagonal ${L[0]}${L[4]} halves it: ${ans}` : ''}.`,
          { visual: fig({ pts: P, segs: loop(L).map(([a, b]) => [a, b]).concat(tri ? [[L[1], L[4]], [L[4], L[0]]] : [[L[1], L[4]], [L[5], L[0]]]), polys: [[...sh, { fill: C.blue, opacity: 0.3 }]], w: 260, label: 'regular octagon with a shaded region' }) }); }
      const H = 12 * k, it = R.pick(HEX), rot = R.int(0, 11) * 5, V0 = reg(6, 1, rot), L = consec(R, 6), P = { _o: [0, 0] }; L.forEach((c, i) => P[c] = V0[i]);
      const ans = H * it[1] / it[2], segs = loop(L).map(([a, b]) => [a, b]); let polys, name, why;
      if (Array.isArray(it[0])) { const sh = it[0].map(i => L[i]), [a, b, c, d] = L; polys = [[...sh, { fill: C.blue, opacity: 0.3 }]]; loop(sh).forEach(([u, v]) => segs.push([u, v]));
        name = sh.length === 3 ? '△' + sh.join('') : (it[0].join() === '0,1,3,4' ? 'rectangle ' : 'quadrilateral ') + sh.join('');
        why = { '0,1,2': `With center O, ${a}${b}${c}O is a rhombus made of two of the six equilateral triangles that form the hexagon. Diagonal ${a}${c} cuts it in half, so △${a}${b}${c} is 1/6 of ${H} = ${ans}.`,
          '0,2,4': `△${sh.join('')} and the three corner triangles fill the hexagon, and each corner triangle is 1/6 of it (like △${a}${b}${c}). So △${sh.join('')} is 1 − 3/6 = 1/2 of ${H} = ${ans}.`,
          '0,1,3,4': `Cutting off the two corner triangles at ${c} and ${L[5]}, each 1/6 of the hexagon, leaves the rectangle: 1 − 2/6 = 2/3 of ${H} = ${ans}.`,
          '0,2,3': `The center O lies on ${a}${d} and splits △${sh.join('')} into △${a}O${c} and △O${c}${d}. △O${c}${d} is one of the six central triangles, and △${a}O${c} (two radii with 120° between them) has the same area, since sin 120° = sin 60°. So the area is 2/6 of ${H} = ${ans}.`,
          '0,1,2,3': `${a}${d} passes through the center, so it splits the hexagon into two congruent halves: ${H} ÷ 2 = ${ans}.` }[it[0].join()]; }
      else if (it[0] === 'inner' || it[0] === 'star') { const I0 = reg(6, 1 / Math.sqrt(3), rot + 30); I0.forEach((q, i) => P['_i' + i] = q);
        segs.push([L[0], L[2]], [L[2], L[4]], [L[4], L[0]], [L[1], L[3]], [L[3], L[5]], [L[5], L[1]]);
        polys = it[0] === 'inner' ? [[...I0.map((_, i) => '_i' + i), { fill: C.blue, opacity: 0.35 }]] : [[...L.flatMap((c, i) => [c, '_i' + i]), { fill: C.blue, opacity: 0.3 }]];
        const t1 = `△${L[0]}${L[2]}${L[4]}`, t2 = `△${L[1]}${L[3]}${L[5]}`;
        name = it[0] === 'inner' ? `the small hexagon where ${t1} and ${t2} overlap` : `the six-pointed star formed by ${t1} and ${t2}`;
        why = `The lines cut ${t1} into 9 small congruent equilateral triangles: 6 make the inner hexagon and 3 are star points. ${t1} is half the hexagon, so each small triangle is ${H / 2} ÷ 9 = ${fr(H, 18)}. ${it[0] === 'inner' ? `The inner hexagon is 6 of them: ${ans}.` : `The star is 6 + 6 = 12 of them: ${ans}.`}`; }
      else { const Pp = add(mul(V0[0], R.int(-30, 30) / 100), mul(V0[2], R.int(-30, 30) / 100)), Pn = R.pick(POOL.filter(c => !L.includes(c)));
        P[Pn] = Pp; L.forEach(c => segs.push([Pn, c])); polys = [0, 2, 4].map(i => [Pn, L[i], L[i + 1], { fill: C.blue, opacity: 0.3 }]);
        name = `the three shaded triangles △${Pn}${L[0]}${L[1]}, △${Pn}${L[2]}${L[3]} and △${Pn}${L[4]}${L[5]} together`;
        why = `Extend ${L[0]}${L[1]}, ${L[2]}${L[3]} and ${L[4]}${L[5]}: they form an equilateral triangle, and from any point inside it the distances to its sides add up to its height. So ½ × side × (sum of distances) is the same wherever ${Pn} is. At the center it is 3 of the 6 central triangles: ${H} ÷ 2 = ${ans}.`; }
      return E.num(`The regular hexagon ${L.join('')} has area ${H}. Find the area of ${name}.`, [{ label: 'area =', ans }], why, { visual: fig({ pts: P, segs, polys, w: 260, label: 'regular hexagon with a shaded region' }) }); } },
  });
  function r2x(v) { return Math.round(v * 1000) / 1000; }

  /* ================= V.4.09 Coordinate proofs ================= */
  const VARS = [['a', 'b', 'c'], ['a', 'b', 'c'], ['p', 'q', 'r'], ['m', 'n', 'k'], ['u', 'v', 'w']];
  const rv = (s, vs) => String(s).replace(/[abc]/g, ch => vs['abc'.indexOf(ch)]);                 // math strings only
  const fv = (s, vs) => String(s).replace(/\{([abc])\}/g, (_, ch) => vs['abc'.indexOf(ch)]);       // prose with {a} slots
  const cTxt = (s, vs) => rv(s, vs).replace(/-/g, '−').replace(/\+/g, ' + ');
  // draw the letter figure with sample numbers for a, b, c
  const drawCoord = (pts, names, sample) => { const ev = s => { const [a, b, c] = sample; return Function('a', 'b', 'c', `return ${s.replace(/(\d)([abc(])/g, '$1*$2')};`)(a, b, c); };
    const P = pts.map(([x, y]) => [ev(x), ev(y)]), xs = P.map(p => p[0]).concat(0), ys = P.map(p => p[1]).concat(0), x0 = Math.min(...xs) - 1, x1 = Math.max(...xs) + 1, y0 = Math.min(...ys) - 1, y1 = Math.max(...ys) + 1, Sz = Math.max(x1 - x0, y1 - y0);
    const segs = P.map((p, i) => [p, P[(i + 1) % P.length]]).map(([A, B]) => ({ x: t => A[0] + (B[0] - A[0]) * t, y: t => A[1] + (B[1] - A[1]) * t, t: [0, 1], color: C.blue }));
    return V.graph({ x: [x0, x0 + Sz], y: [y0, y0 + Sz], w: 260, h: 260, grid: false, labels: false, param: segs, points: P.map((p, i) => [p[0], p[1], names[i]]), label: 'figure placed on the axes' }); };
  const CT = {
    gram: { shape: 'parallelogram', pts: [['0', '0'], ['a', '0'], ['a+b', 'c'], ['b', 'c']], sample: [5, 2, 3] },
    rect: { shape: 'rectangle', pts: [['0', '0'], ['a', '0'], ['a', 'b'], ['0', 'b']], sample: [5, 3, 0] },
    square: { shape: 'square', pts: [['0', '0'], ['a', '0'], ['a', 'a'], ['0', 'a']], sample: [4, 0, 0] },
    rhombus: { shape: 'rhombus', pts: [['0', '0'], ['a', '0'], ['a+b', 'c'], ['b', 'c']], sample: [5, 3, 4], note: ', where {a}² = {b}² + {c}²' },
    tri: { shape: 'triangle', pts: [['0', '0'], ['2a', '0'], ['2b', '2c']], sample: [3, 1, 2] },
    rtri: { shape: 'right triangle', pts: [['0', '0'], ['2a', '0'], ['0', '2b']], sample: [3, 2, 0] },
    iso: { shape: 'isosceles triangle', pts: [['-a', '0'], ['a', '0'], ['0', 'b']], sample: [3, 4, 0] },
    itrap: { shape: 'isosceles trapezoid', pts: [['-a', '0'], ['a', '0'], ['b', 'c'], ['-b', 'c']], sample: [4, 2, 3] },
    kite: { shape: 'kite', pts: [['0', 'a'], ['-b', '0'], ['0', '-c'], ['b', '0']], sample: [2, 3, 4] } };
  const setup = (R, key) => { const t = CT[key], vs = R.pick(VARS), org = t.pts[0].join() === '0,0', nm = R.pick((t.pts.length === 3 ? ['ABC', 'PQR', 'OAB', 'XYZ', 'JKL'] : ['OABC', 'ABCD', 'PQRS', 'KLMN', 'WXYZ']).filter(x => org || x[0] !== 'O')).split('');
    const list = nm.map((c, i) => `${c}(${cTxt(t.pts[i][0], vs)}, ${cTxt(t.pts[i][1], vs)})`).join(', ');
    return { t, vs, nm, vis: drawCoord(t.pts, nm, t.sample), pre: `${an(t.shape) === 'an' ? 'An' : 'A'} ${t.shape} has vertices ${list}${t.note ? fv(t.note, vs) : ''}.` }; };
  // "show it is a rhombus" by distances: complete the proof (a missing length) or name what it proves
  const rhombusDistQ = R => { let p, q, A, u, v, pts; do { p = R.pick([-1, 1]) * R.int(1, 5); q = R.pick([-1, 1]) * R.int(1, 5); u = [p, q]; v = R.bool() ? [q, p] : [p, -q]; A = [R.int(-8, 4), R.int(-8, 4)];
      pts = [A, add(A, u), add(add(A, u), v), add(A, v)]; } while (Math.abs(p) === Math.abs(q) || pts.flat().some(c => Math.abs(c) > 9) || Math.abs(u[0] * v[1] - u[1] * v[0]) < 6);
    const nm = R.pick(QSETS).split(''), n2 = p * p + q * q, sTxt = E.pt(E.surdStr(0, 1, n2)), sides = [0, 1, 2, 3].map(i => [nm[i] + nm[(i + 1) % 4], pts[i], pts[(i + 1) % 4]]);
    const row = ([sg, P, Q]) => `${sg} = √(${(Q[0] - P[0]) ** 2} + ${(Q[1] - P[1]) ** 2}) = ${sTxt}`, vis = gridFig(pts, nm), pre = `${nm.map((c, i) => c + ptTxt(pts[i])).join(', ')}. A student shows that ${nm.join('')} is a rhombus.`;
    if (R.bool(0.6)) { const k = R.int(0, 3), [sg, P, Q] = sides[k], dx = Math.abs(Q[0] - P[0]), dy = Math.abs(Q[1] - P[1]), rows = sides.map((sd, i) => [i === k ? `${sg} = <b>?</b>` : row(sd), 'distance formula']);
      rows.push([`${nm.join('')} is a rhombus`, 'all four sides are congruent']);
      return E.choice(R, `${pre} Which length completes the proof?${table(rows)}`, sTxt, [String(n2), String(dx + dy), String(Math.abs(dx - dy))], `${sg} = √(${dx}² + ${dy}²) = ${sTxt === '√' + n2 ? sTxt : '√' + n2 + ' = ' + sTxt}, the same as the other three sides, so all four sides are congruent.`, { visual: vis }); }
    const rows = sides.map(sd => [row(sd), 'distance formula']);
    return E.choice(R, `${pre.replace(' A student shows that ' + nm.join('') + ' is a rhombus.', '')} What do these steps prove?${table(rows)}`, `${nm.join('')} is a rhombus`, [`${nm.join('')} is a square`, `${nm.join('')} is a rectangle`, `${nm.join('')} is a kite but not a parallelogram`],
      `All four sides are ${sTxt}, so ${nm.join('')} is a rhombus. Equal sides alone do not give a right angle, so the steps do not show a square or a rectangle.`, { visual: vis }); };
  // a coordinate proof that diagonals bisect: put the steps in order
  const bisectOrderQ = R => { const key = R.pick(['gram', 'rect', 'rhombus', 'kite']), s = setup(R, key), { vs, nm } = s, pt = (x, y) => `(${E.pt(rv(x, vs))}, ${E.pt(rv(y, vs))})`;
    if (key === 'kite') { const AC = nm[0] + nm[2], BD = nm[1] + nm[3];
      return orderQ(R, `${s.pre} Put the steps of a coordinate proof that ${AC} bisects ${BD} in order.`, [`The midpoint of ${BD} is (0, 0) (midpoint formula)`, `${AC} lies on the y-axis, through (0, 0) (both ${nm[0]} and ${nm[2]} have x = 0)`,
        `The midpoint of ${BD} lies on ${AC} (the two facts together)`, `So ${AC} bisects ${BD} (definition of bisect)`], [[], [], [0, 1], [2]], `The first two facts can come in either order; the midpoint is on ${AC} only once both are known.`, { fixed: 0, visual: s.vis }); }
    const m = key === 'rect' ? ['a/2', 'b/2'] : ['(a+b)/2', 'c/2'], d1 = nm[0] + nm[2], d2 = nm[1] + nm[3], M0 = pt(...m);
    return orderQ(R, `${s.pre} Put the steps of a coordinate proof that the diagonals bisect each other in order.`, [`The midpoint of ${d1} is ${M0} (midpoint formula)`, `The midpoint of ${d2} is ${M0} (midpoint formula)`,
      `${d1} and ${d2} have the same midpoint (the two results match)`, 'So the diagonals bisect each other (definition of bisect)'], [[], [], [0, 1], [2]], `Either midpoint can be found first; comparing them needs both, and the conclusion comes last.`, { fixed: 0, visual: s.vis }); };
  S('V.4.09', 'Coordinate proofs', {
    a: { t: 'place figures smartly', g: R => { const kind = R.int(0, 2), vs = R.pick(VARS), cv = s => cTxt(s, vs);
      if (kind === 0) { const T = R.pick([
          ['rectangle', ['(0, 0)', '(a, 0)', '(a, b)'], '(0, b)', ['(b, 0)', '(b, a)', '(0, a)'], 'it sits straight above the origin, level with the third vertex'],
          ['square', ['(0, 0)', '(a, 0)', '(a, a)'], '(0, a)', ['(0, -a)', '(-a, a)', '(2a, a)'], 'it sits {a} units straight above the origin'],
          ['parallelogram', ['(0, 0)', '(a, 0)', '(a+b, c)'], '(b, c)', ['(a-b, c)', '(b-a, c)', '(c, b)'], 'the top side must be parallel to the bottom side and just as long, {a} units, so subtract {a} from the x-coordinate'],
          ['parallelogram', ['(0, 0)', '(a, 0)', '(b, c)'], '(a+b, c)', ['(a-b, c)', '(b-a, c)', '(a, c)'], 'the top side must be parallel to the bottom side and just as long, so add {a} to the x-coordinate'],
          ['isosceles trapezoid', ['(-a, 0)', '(a, 0)', '(b, c)'], '(-b, c)', ['(b, -c)', '(-a, c)', '(a-b, c)'], 'the figure is symmetric about the y-axis, so reflect the third vertex in it'],
          ['rhombus', ['(0, 0)', '(a, 0)', '(a+b, c)'], '(b, c)', ['(a, c)', '(b-a, c)', '(c, b)'], 'a rhombus is a parallelogram, so the top side is the bottom side moved up: subtract {a} from the x-coordinate']]);
        const nm = R.pick(['ABCD', 'OPQR', 'PQRS', 'KLMN']).split('');
        return E.choice(R, `Three vertices of ${an(T[0])} ${T[0]} are ${nm[0]}${cv(T[1][0])}, ${nm[1]}${cv(T[1][1])} and ${nm[2]}${cv(T[1][2])}, in order. What is the fourth vertex ${nm[3]}?`, cv(T[2]), T[3].map(cv), `${nm[3]} = ${cv(T[2])}: ${fv(T[4], vs)}.`); }
      if (kind === 1) { const T = R.pick([
          ['rectangle', '(0, 0), (a, 0), (a, b), (0, b)', ['(0, 0), (4, 0), (4, 3), (0, 3)', '(1, 2), (a, 2), (a, b), (1, b)', '(0, 0), (a, 0), (a, a), (0, a)']],
          ['square', '(0, 0), (a, 0), (a, a), (0, a)', ['(0, 0), (5, 0), (5, 5), (0, 5)', '(0, 0), (a, 0), (a, b), (0, b)', '(1, 1), (a, 1), (a, a), (1, a)']],
          ['right triangle', '(0, 0), (a, 0), (0, b)', ['(0, 0), (3, 0), (0, 4)', '(1, 1), (a, 1), (1, b)', '(0, 0), (a, 0), (a, a)']],
          ['parallelogram', '(0, 0), (a, 0), (a+b, c), (b, c)', ['(0, 0), (5, 0), (7, 3), (2, 3)', '(0, 0), (a, 0), (a, c), (0, c)', '(1, 1), (a, 1), (a+b, c), (b, c)']]]);
        return E.choice(R, `Which placement is best for proving a fact about every ${T[0]}?`, cv(T[1]), T[2].map(cv), `Use letters, so the proof covers every ${T[0]}, and put a vertex at the origin with a side on an axis to keep the algebra short: ${cv(T[1])}. Specific numbers prove only one case, and the wrong shape proves nothing about this one.`); }
      const yes = R.bool(), F = R.pick([['rectangle', 'the diagonals are congruent', '(0, 0), (4, 0), (4, 3), (0, 3)', '(0, 0), (a, 0), (a, b), (0, b)', 'both diagonals have length 5', 'both diagonals have length √({a}² + {b}²)'],
        ['parallelogram', 'the diagonals bisect each other', '(0, 0), (6, 0), (8, 4), (2, 4)', '(0, 0), (a, 0), (a+b, c), (b, c)', 'both diagonals have midpoint (4, 2)', 'both diagonals have midpoint (({a} + {b})/2, {c}/2)'],
        ['square', 'the diagonals are perpendicular', '(0, 0), (3, 0), (3, 3), (0, 3)', '(0, 0), (a, 0), (a, a), (0, a)', 'the diagonal slopes are 1 and −1', 'the diagonal slopes are 1 and −1']]);
      const who = R.pick(['Maya', 'Tom', 'Aisha', 'Jun', 'Lena']);
      return yn(`${who} wants to prove that in every ${F[0]}, ${F[1]}. ${who} uses the ${F[0]} ${cv(yes ? F[3] : F[2])} and finds that ${fv(yes ? F[5] : F[4], vs)}. Is this a proof for every ${F[0]}?`, yes,
        yes ? `Yes: the letters can stand for any ${F[0]}, so the result holds for all of them.` : `No: it checks just one ${F[0]}. With letters, like ${cv(F[3])}, the same work would cover every ${F[0]}.`); } },
    b: { t: 'slope for parallel and perpendicular', g: R => {
      const T = R.pick([
        ['gram', 1, 2, 'c/b', 0, 3, 'c/b', 'The slopes are equal, so these opposite sides are parallel'],
        ['gram', 0, 1, '0', 3, 2, '0', 'Both slopes are 0, so these opposite sides are parallel'],
        ['rect', 0, 2, 'b/a', 1, 3, '-b/a', 'Their product is −{b}²/{a}², which is −1 only when {a} = {b}, so the diagonals of a rectangle are perpendicular only for a square'],
        ['square', 0, 2, '1', 1, 3, '-1', 'The slopes multiply to −1, so the diagonals of every square are perpendicular'],
        ['rhombus', 0, 2, 'c/(a+b)', 1, 3, 'c/(b-a)', 'Their product is {c}²/({b}² − {a}²) = {c}²/(−{c}²) = −1, so the diagonals of every rhombus are perpendicular'],
        ['tri', 'M', 'N', '0', 0, 1, '0', 'Both slopes are 0, so the midsegment is parallel to the third side']]);
      const s = setup(R, T[0]), { vs, nm } = s; let pre = s.pre, seg1, seg2;
      if (T[0] === 'tri') { pre += ` M(${cTxt('b', vs)}, ${cTxt('c', vs)}) and N(${cTxt('a+b', vs)}, ${cTxt('c', vs)}) are the midpoints of ${nm[0]}${nm[2]} and ${nm[1]}${nm[2]}.`; seg1 = 'MN'; seg2 = nm[0] + nm[1]; }
      else { seg1 = nm[T[1]] + nm[T[2]]; seg2 = nm[T[4]] + nm[T[5]]; }
      return E.num(`${pre} Find the slopes of ${seg1} and ${seg2}.`, [{ label: `slope of ${seg1} =`, expr: rv(T[3], vs) }, { label: `slope of ${seg2} =`, expr: rv(T[6], vs) }],
        `${T[0] === 'tri' ? `M = (${cTxt('b', vs)}, ${cTxt('c', vs)}) and N = (${cTxt('a+b', vs)}, ${cTxt('c', vs)}). ` : ''}Slope = rise ÷ run: ${seg1} has slope ${E.pt(rv(T[3], vs))} and ${seg2} has slope ${E.pt(rv(T[6], vs))}. ${fv(T[7], vs)}.`, { visual: s.vis }); } },
    c: { t: 'distance for congruent sides', g: R => { if (R.bool(0.35)) return rhombusDistQ(R);
      const T = R.pick([
        ['rect', [0, 2], 'sqrt(a^2+b^2)', [1, 3], 'the diagonals of every rectangle are congruent'],
        ['iso', [0, 2], 'sqrt(a^2+b^2)', [1, 2], 'the two legs are congruent'],
        ['itrap', [0, 2], 'sqrt((a+b)^2+c^2)', [1, 3], 'the diagonals of an isosceles trapezoid are congruent'],
        ['gram', [0, 3], 'sqrt(b^2+c^2)', [1, 2], 'opposite sides of a parallelogram are congruent'],
        ['kite', [0, 1], 'sqrt(a^2+b^2)', [0, 3], 'the two sides at the top vertex are congruent'],
        ['kite', [2, 1], 'sqrt(b^2+c^2)', [2, 3], 'the two sides at the bottom vertex are congruent']]);
      const s = setup(R, T[0]), { vs, nm } = s, sg = ij => nm[ij[0]] + nm[ij[1]], L = E.pt(rv(T[2], vs));
      if (R.bool(0.4)) return E.num(`${s.pre} Find the length of ${sg(T[1])}.`, [{ label: sg(T[1]) + ' =', expr: rv(T[2], vs) }], `Distance formula: ${sg(T[1])} = ${L}. The same work for ${sg(T[3])} gives ${L} too, so ${T[4]}.`, { visual: s.vis });
      return E.num(`${s.pre} Find the lengths of ${sg(T[1])} and ${sg(T[3])}.`, [{ label: sg(T[1]) + ' =', expr: rv(T[2], vs) }, { label: sg(T[3]) + ' =', expr: rv(T[2], vs) }],
        `Distance formula: ${sg(T[1])} = ${L} and ${sg(T[3])} = ${L}. They are equal, so ${T[4]}.`, { visual: s.vis }); } },
    d: { t: 'midpoint for bisecting', g: R => { if (R.bool(0.35)) return bisectOrderQ(R);
      const T = R.pick([
        ['gram', [0, 2], ['(a+b)/2', 'c/2'], [1, 3], 'Both diagonals have this midpoint, so they bisect each other'],
        ['rect', [0, 2], ['a/2', 'b/2'], [1, 3], 'Both diagonals have this midpoint, so they bisect each other'],
        ['rhombus', [1, 3], ['(a+b)/2', 'c/2'], [0, 2], 'Both diagonals have this midpoint, so they bisect each other'],
        ['rtri', [1, 2], ['a', 'b'], null, 'This point is √({a}² + {b}²) from all three vertices: the midpoint of the hypotenuse is equally far from every vertex'],
        ['kite', [1, 3], ['0', '0'], null, 'This midpoint lies on the other diagonal (the y-axis), so that diagonal bisects this one'],
        ['tri', [0, 2], ['b', 'c'], null, 'The midpoint of {S} is ({a} + {b}, {c}), so the segment joining the two midpoints has slope 0: it is parallel to {T}, the side on the x-axis']]);
      const s = setup(R, T[0]), { vs, nm } = s, sg = ij => nm[ij[0]] + nm[ij[1]];
      return E.num(`${s.pre} Find the midpoint of ${sg(T[1])}.`, [{ label: 'x =', expr: rv(T[2][0], vs) }, { label: 'y =', expr: rv(T[2][1], vs) }],
        `Average the coordinates: (${E.pt(rv(T[2][0], vs))}, ${E.pt(rv(T[2][1], vs))}).${T[3] ? ` ${sg(T[3])} gives the same point.` : ''} ${fv(T[4], vs).replace('{S}', nm[1] + nm[2]).replace('{T}', nm[0] + nm[1])}.`, { visual: s.vis }); } },
  });
})(typeof window !== 'undefined' ? window : globalThis);
