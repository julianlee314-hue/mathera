/* Era V · Unit V.11 Coordinate geometry (V.11.01–V.11.09) */
(function (G) {
  const E = G.E5, V = E.V, C = E.C, K = E.K, M = s => E.mx(s);
  const S = (id, name, steps) => E.skill({ id, name, steps });

  /* ================= number and line helpers ================= */
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
  const nz = (R, lo, hi) => { let v; do v = R.int(lo, hi); while (v === 0); return v; };
  const fr = (n, d = 1) => { if (d < 0) { n = -n; d = -d; } const k = gcd(n, d) || 1; return [n / k + 0, d / k]; };
  const RV = v => Array.isArray(v) ? v : [v, 1];
  const fs = m => { m = RV(m); return m[1] === 1 ? String(m[0]) : `${m[0]}/${m[1]}`; };
  const radd = (a, b) => { a = RV(a); b = RV(b); return fr(a[0] * b[1] + b[0] * a[1], a[1] * b[1]); };
  const rmul = (a, b) => { a = RV(a); b = RV(b); return fr(a[0] * b[0], a[1] * b[1]); };
  const recipNeg = m => { m = RV(m); return fr(-m[1], m[0]); };
  const cx = (m, v) => { const [n, d] = RV(m); if (!n) return ''; if (d === 1) return n === 1 ? v : n === -1 ? '-' + v : n + v; return `${n}/${d}${v}`; };
  const tm = (c, v) => v ? cx(c, v) : (RV(c)[0] ? fs(c) : '');
  const tsum = arr => { let s = ''; for (const t of arr) if (t) s += s && !t.startsWith('-') ? '+' + t : t; return s || '0'; };
  const sh = (v, n) => n === 0 ? v : n > 0 ? `${v}-${n}` : `${v}+${-n}`;
  const si = (m, b) => 'y=' + tsum([tm(m, 'x'), tm(b)]);
  const ps = (m, x1, y1) => { const [n, d] = RV(m); let r;
    if (x1 === 0) r = cx(m, 'x') || '0';
    else { const inner = `(${sh('x', x1)})`; r = d === 1 ? (n === 1 ? sh('x', x1) : n === -1 ? '-' + inner : n + inner) : `${n}/${d}${inner}`; }
    return `${sh('y', y1)}=${r}`; };
  const std = (A, B, Cc) => `${tsum([tm(A, 'x'), tm(B, 'y')])}=${Cc}`;
  const zf = (a, b, c) => `${tsum([tm(a, 'x'), tm(b, 'y'), tm(c)])}=0`;
  const P = (x, y) => `(${x}, ${y})`, pp = p => P(p[0] + 0, p[1] + 0), par = n => n < 0 ? `(${n})` : String(n);
  const mS = m => m === null ? 'undefined' : RV(m)[1] === 1 ? String(RV(m)[0]) : M(fs(m));
  const sf = m => { m = RV(m); return m[1] === 1 ? { ans: m[0] } : { frac: [m[0], m[1]] }; };
  const rt = n => E.surdStr(0, 1, n, 1);
  const sq = n => Math.round(Math.sqrt(n)) ** 2 === n;
  const f0 = n => String(n + 0);
  const rot = u => [-u[1] + 0, u[0]], vadd = (a, b) => [a[0] + b[0], a[1] + b[1]], vsub = (a, b) => [a[0] - b[0], a[1] - b[1]], vmul = (a, k) => [a[0] * k, a[1] * k];
  const vcr = (a, b) => a[0] * b[1] - a[1] * b[0], vdot = (a, b) => a[0] * b[0] + a[1] * b[1], d2 = (A, B) => (A[0] - B[0]) ** 2 + (A[1] - B[1]) ** 2;
  const inR = (pts, L = 8) => pts.every(p => Math.abs(p[0]) <= L && Math.abs(p[1]) <= L);
  const same = (A, B) => A[0] === B[0] && A[1] === B[1];
  const slopeOf = (A, B) => B[0] === A[0] ? null : fr(B[1] - A[1], B[0] - A[0]);
  const siOf = (m, X) => si(m, radd(X[1], rmul(m, -X[0])));
  const lineEq = (A, B) => A[0] === B[0] ? `x=${A[0]}` : A[1] === B[1] ? `y=${A[1]}` : ps(slopeOf(A, B), A[0], A[1]);
  const lineSI = (A, B) => A[0] === B[0] ? `x=${A[0]}` : siOf(slopeOf(A, B), A);
  // line through X perpendicular to AB
  const perpEq = (X, A, B) => A[1] === B[1] ? `x=${X[0]}` : A[0] === B[0] ? `y=${X[1]}` : ps(recipNeg(slopeOf(A, B)), X[0], X[1]);
  const perpSI = (X, A, B) => A[1] === B[1] ? `x=${X[0]}` : A[0] === B[0] ? `y=${X[1]}` : siOf(recipNeg(slopeOf(A, B)), X);
  const tw2 = pts => pts.reduce((s, p, i) => { const q = pts[(i + 1) % pts.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0);   // twice the signed area
  const turn = (A, B, Q) => vcr(vsub(B, A), vsub(Q, B));
  const convex = pts => { let sg = 0; for (let i = 0; i < pts.length; i++) { const c = turn(pts[i], pts[(i + 1) % pts.length], pts[(i + 2) % pts.length]); if (!c) return false; if (!sg) sg = Math.sign(c); else if (Math.sign(c) !== sg) return false; } return true; };
  const distinct = pts => new Set(pts.map(p => p.join())).size === pts.length;
  const nameP = (n, p) => `${n}${pp(p)}`;
  const list = (ns, pts) => { const t = ns.map((n, i) => nameP(n, pts[i])); return t.slice(0, -1).join(', ') + ' and ' + t[t.length - 1]; };
  const QN = ['ABCD', 'PQRS', 'JKLM', 'WXYZ', 'EFGH', 'KLMN', 'DEFG', 'RSTU'];
  // integer-length lattice vectors, and groups of equal-length vectors
  const VI = [], VA = [], LEN = {};
  for (let a = -12; a <= 12; a++) for (let b = -12; b <= 12; b++) { const n = a * a + b * b; if (!n) continue; if (sq(n)) { VA.push([a, b]); if (a && b) VI.push([a, b]); } if (Math.abs(a) <= 7 && Math.abs(b) <= 7 && a && b) (LEN[n] = LEN[n] || []).push([a, b]); }
  const LENK = Object.keys(LEN).filter(n => LEN[n].length >= 8).map(Number);
  // lattice points on circles x² + y² = r², by parity class (so midpoints stay whole)
  const CIRC = [25, 50, 65, 85].map(r2 => { const out = []; for (let a = -10; a <= 10; a++) for (let b = -10; b <= 10; b++) if (a * a + b * b === r2) out.push([a, b]); return { r2, cls: [0, 1, 2, 3].map(c => out.filter(v => ((v[0] & 1) * 2 + (v[1] & 1)) === c)).filter(c => c.length >= 3) }; });
  const circTri = (R, o = {}) => { for (;;) { const ci = R.pick(o.r2 ? CIRC.filter(c => o.r2.includes(c.r2)) : CIRC), cl = R.pick(ci.cls), vs = R.sample(cl, 3), O = [R.int(-2, 2), R.int(-2, 2)];
    if (vs.some((v, i) => vs.some((w, j) => i < j && v[0] === -w[0] && v[1] === -w[1]))) continue;             // no right angle
    const T = vs.map(v => vadd(O, v)); if (Math.abs(tw2(T)) < 16) continue; return { O, T, r2: ci.r2, vs }; } };

  /* ================= the coordinate figure: V.graph grid + segments, dots and readable labels ================= */
  const r2f = x => Math.round(x * 100) / 100;
  const plane = o => {
    const Pt = o.pts, all = Object.values(Pt).concat(o.extra || []), mg = o.margin ?? 1.6;
    const xs = all.map(p => p[0]).concat([0]), ys = all.map(p => p[1]).concat([0]);
    const x0 = Math.floor(Math.min(...xs) - mg), x1 = Math.ceil(Math.max(...xs) + mg), y0 = Math.floor(Math.min(...ys) - mg), y1 = Math.ceil(Math.max(...ys) + mg);
    const xsp = x1 - x0, ysp = y1 - y0; let W = o.w || 300, cell = (W - 36) / xsp, H = ysp * cell + 36;
    if (H > 330) { cell = (330 - 36) / ysp; H = 330; W = xsp * cell + 36; }
    W = Math.round(W); H = Math.round(H);
    const X = x => 18 + (x - x0) / xsp * (W - 36), Y = y => H - 18 - (y - y0) / ysp * (H - 36), T = p => [r2f(X(p[0])), r2f(Y(p[1]))], at = k => typeof k === 'string' ? Pt[k] : k;
    const g = V.graph({ x: [x0, x1], y: [y0, y1], w: W, h: H, ticks: Math.max(xsp, ysp) > 14 ? 2 : 1, labels: o.nums !== false, fns: o.fns, vlines: o.vlines, hlines: o.hlines, label: o.label || 'coordinate figure' });
    let b = '';
    (o.polys || []).forEach(pl => { b += `<polygon points="${pl.map(k => T(at(k)).join(',')).join(' ')}" fill="${C.blue}" fill-opacity="0.13" stroke="none"/>`; });
    (o.segs || []).forEach(([a, c, op = {}]) => { const A = T(at(a)), B = T(at(c));
      b += `<line x1="${A[0]}" y1="${A[1]}" x2="${B[0]}" y2="${B[1]}" stroke="${op.color || (op.dash ? C.muted : C.blue)}" stroke-width="${op.dash ? 1.8 : 2.6}" ${op.dash ? 'stroke-dasharray="6 5"' : ''} stroke-linecap="round"/>`; });
    (o.right || []).forEach(([p, v, q]) => { const B = T(at(v)), u1 = K.unit(K.sub(T(at(p)), B)), u2 = K.unit(K.sub(T(at(q)), B)), s = 11;
      b += `<path d="M${r2f(B[0] + u1[0] * s)} ${r2f(B[1] + u1[1] * s)} L${r2f(B[0] + (u1[0] + u2[0]) * s)} ${r2f(B[1] + (u1[1] + u2[1]) * s)} L${r2f(B[0] + u2[0] * s)} ${r2f(B[1] + u2[1] * s)}" fill="none" stroke="${C.ink}" stroke-width="1.5"/>`; });
    const vis = Object.keys(Pt).filter(k => k[0] !== '_'), ref = (o.center ? [o.center] : Object.values(Pt)).map(T), cen = [ref.reduce((s, p) => s + p[0], 0) / ref.length, ref.reduce((s, p) => s + p[1], 0) / ref.length];
    vis.forEach(k => { const p = T(Pt[k]); b += V.dot(p[0], p[1], 4.5, C.red); });
    vis.forEach(k => { const p = T(Pt[k]), lab = (o.lab && o.lab[k]) || k; let d = o.dir && o.dir[k] ? [o.dir[k][0], -o.dir[k][1]] : K.sub(p, cen); if (Math.hypot(d[0], d[1]) < 1) d = [1, -1];
      const u = K.unit(d), z = 14, hw = K.TW(lab, z) / 2, off = 9 + hw * Math.abs(u[0]) + z * 0.6 * Math.abs(u[1]);
      b += V.text(r2f(p[0] + u[0] * off), r2f(p[1] + u[1] * off), lab, { size: z, weight: 700, fill: C.ink }).replace('<text ', '<text paint-order="stroke" stroke="#fff" stroke-width="3.5" stroke-linejoin="round" '); });
    return g.replace(/<\/g><\/svg>$/, b + '</g></svg>');
  };
  const polyFig = (ns, pts, o = {}) => { const p = {}; ns.forEach((n, i) => p[n] = pts[i]); return plane(Object.assign({ pts: p, segs: ns.map((n, i) => [n, ns[(i + 1) % ns.length]]), polys: [ns] }, o)); };
  const twoCol = (rows, hide) => `<table class="dt"><tr><th>#</th><th>Statement</th><th>Reason</th></tr>${rows.map((r, i) => `<tr><td>${i + 1}</td><td>${r[0]}</td><td>${i === hide ? '<b>?</b>' : r[1]}</td></tr>`).join('')}</table>`;
  // a short proof as an ordering or a pick-the-reason question. L = [[statement, reason, deps, wrong reasons]], line 0 is the Given
  const proofQ = (R, head, L, explain, o = {}) => { const vis = o.visual ? { visual: o.visual } : {};
    if (R.bool(o.pOrder ?? 0.5)) return K.orderQ(R, `${head} Put the steps of the proof in order.`, L.map(l => `${l[0]} (${l[1]})`), L.map(l => l[2]), explain, Object.assign({ fixed: 1 }, vis));
    const k = R.pick(L.map((l, i) => i).filter(i => L[i][3]));
    return E.choice(R, `${head} What is the reason for step ${k + 1}?${twoCol(L.map(l => [l[0], l[1]]), k)}`, L[k][1], L[k][3], `The reason for step ${k + 1} is: ${L[k][1]}. ${explain}`, vis); };

  /* ================= V.11.01 Distance formula ================= */
  const TRI = [[3, 4, 5], [4, 3, 5], [6, 8, 10], [8, 6, 10], [5, 12, 13], [12, 5, 13]];
  const legsPair = (R, lim, tri = TRI) => { let a, b, c, A, B; do { [a, b, c] = R.pick(tri); A = [R.int(-lim, lim), R.int(-lim, lim)]; B = [A[0] + R.pick([1, -1]) * a, A[1] + R.pick([1, -1]) * b]; } while (!inR([A, B], lim)); return { A, B, a, b, c }; };
  const dxs = (A, B, k) => `${mn(B[k])} − ${par(A[k])}`;
  const mn = n => String(n).replace('-', '−');   // a true minus sign right after a bar or bracket
  S('V.11.01', 'Distance formula', {
    a: { t: 'derive from Pythagoras', g: R => { const [p, q] = K.lets(R, 2), { A, B, a, b, c } = legsPair(R, 7, TRI.slice(0, 4).concat(R.bool(0.3) ? TRI.slice(4) : []));
      const vis = plane({ pts: { [p]: A, [q]: B, _c: [B[0], A[1]] }, segs: [[p, '_c', { dash: 1 }], ['_c', q, { dash: 1 }], [p, q]], right: [[p, '_c', q]], label: 'segment with its right triangle' });
      if (R.bool(0.35)) { const WR = ['the midpoint formula', 'the slope formula', 'lines with equal slopes are parallel'];
        const hz = 'a horizontal length is the change in x', vt = 'a vertical length is the change in y', py = 'the Pythagorean theorem, with the right angle at the corner', sb = 'substitute the two legs', rt0 = 'take the positive square root, since a length is positive';
        if (R.bool(0.45)) { const L = [['Given: P(x₁, y₁) and Q(x₂, y₂), and C(x₂, y₁) is the corner of a right triangle with horizontal leg PC and vertical leg CQ', 'Given', []],
            ['PC = |x₂ − x₁|', hz, [0], [vt, ...WR.slice(0, 2)]], ['CQ = |y₂ − y₁|', vt, [0], [hz, ...WR.slice(0, 2)]], ['PQ² = PC² + CQ²', py, [0], [WR[0], 'the converse of the Pythagorean theorem', hz]],
            ['PQ² = (x₂ − x₁)² + (y₂ − y₁)²', `${sb}; squaring removes the absolute value bars`, [1, 2, 3], [py, WR[1], rt0]], ['PQ = √((x₂ − x₁)² + (y₂ − y₁)²)', rt0, [], [py, 'square both sides', WR[0]]]];
          return proofQ(R, 'Derive the distance formula from the Pythagorean theorem.', L, 'Find the two legs, apply Pythagoras, substitute, then take the positive root. The two legs and the Pythagoras line do not depend on each other, so they can come in any order.'); }
        const cn = K.lets(R, 3).find(l => l !== p && l !== q), vis2 = plane({ pts: { [p]: A, [q]: B, [cn]: [B[0], A[1]] }, segs: [[p, cn, { dash: 1 }], [cn, q, { dash: 1 }], [p, q]], right: [[p, cn, q]], label: 'segment with its right triangle' });
        const L = [[`Given: ${p}${pp(A)} and ${q}${pp(B)}, with the right angle at ${cn}${pp([B[0], A[1]])}`, 'Given', []],
          [`${p}${cn} = |${dxs(A, B, 0)}| = ${a}`, hz, [0], [vt, ...WR.slice(0, 2)]], [`${cn}${q} = |${dxs(A, B, 1)}| = ${b}`, vt, [0], [hz, ...WR.slice(0, 2)]],
          [`${p}${q}² = ${p}${cn}² + ${cn}${q}²`, py, [0], [WR[0], 'the converse of the Pythagorean theorem', hz]], [`${p}${q}² = ${a}² + ${b}² = ${c * c}`, sb, [1, 2, 3], [py, WR[1], rt0]], [`${p}${q} = ${c}`, rt0, [], [py, 'square both sides', WR[0]]]];
        return proofQ(R, `Prove that ${p}${q} = ${c}.`, L, `Legs ${a} and ${b}, then Pythagoras: ${p}${q} = √(${a}² + ${b}²) = ${c}. The two legs and the Pythagoras line can come in any order.`, { visual: vis2 }); }
      if (R.bool(0.6)) return E.num(`${p}${pp(A)} and ${q}${pp(B)} are the ends of the slanted side of a right triangle with one horizontal and one vertical leg. Find both legs, then ${p}${q}.`,
        [{ label: 'horizontal leg =', ans: a }, { label: 'vertical leg =', ans: b }, { label: `${p}${q} =`, ans: c }],
        `Horizontal leg |${dxs(A, B, 0)}| = ${a}, vertical leg |${dxs(A, B, 1)}| = ${b}. By Pythagoras ${p}${q}² = ${a}² + ${b}² = ${c * c}, so ${p}${q} = ${c}, not ${a} + ${b} = ${a + b}.`, { visual: vis });
      const dx = dxs(A, B, 0), dy = dxs(A, B, 1);
      const wr = [M(`(${dx})+(${dy})`), M(`sqrt((${dx})+(${dy}))`), M(`(${dx})^2+(${dy})^2`), M(`sqrt((${B[0]}+${par(A[0])})^2+(${B[1]}+${par(A[1])})^2)`)];
      return E.choice(R, `Which expression gives the distance ${p}${q}?`, M(`sqrt((${dx})^2+(${dy})^2)`), R.sample(wr, 3),
        `The legs are the differences ${a} and ${b}. Pythagoras: ${p}${q} = √(${a}² + ${b}²) = ${c}. Square, add, then take the root.`, { visual: vis }); } },
    b: { t: 'apply', g: R => { const [p, q] = K.lets(R, 2), org = R.bool(0.2); let { A, B, a, b, c } = legsPair(R, 9);
      if (org) { A = [0, 0]; B = [R.pick([1, -1]) * a, R.pick([1, -1]) * b]; }
      const work = `${M(`sqrt((${dxs(A, B, 0)})^2+(${dxs(A, B, 1)})^2)=sqrt(${a * a}+${b * b})=sqrt(${c * c})=${c}`)}`;
      return E.num(org ? `How far is the point ${q}${pp(B)} from the origin?` : `Find the distance between ${p}${pp(A)} and ${q}${pp(B)}.`, [{ label: 'distance =', ans: c }],
        `${work}. Square, add, then take the root: it is not ${a} + ${b} = ${a + b}.`); } },
    c: { t: 'find a missing coordinate', g: R => { const [p, q] = K.lets(R, 2), { A, B, a, b, c } = legsPair(R, 8), vy = R.bool();
      const known = vy ? 0 : 1, kn = vy ? b : a, base = A[1 - known], k1 = base + kn, k2 = base - kn;
      const Bt = vy ? P(B[0], 'k') : P('k', B[1]), kk = sh('k', base);
      const sqs = vy ? `(${dxs(A, B, 0)})^2+(${kk})^2=${c}^2` : `(${kk})^2+(${dxs(A, B, 1)})^2=${c}^2`;
      return E.num(`The distance from ${p}${pp(A)} to ${q}${Bt} is ${c}. Find all possible values of k.`, [{ label: 'k =', set: [String(k1), String(k2)] }],
        `${M(sqs)}, so ${M(`(${kk})^2=${kn * kn}`)}. Then ${M(`${kk}=${kn}`)} or ${M(`${kk}=${-kn}`)}, so k = ${k1} or ${k2}.`); } },
    d: { t: 'exact radical answers', g: R => { const [p, q] = K.lets(R, 2); let dx, dy, s, A, B;
      do { dx = nz(R, -9, 9); dy = nz(R, -9, 9); s = dx * dx + dy * dy; A = [R.int(-9, 9), R.int(-9, 9)]; B = [A[0] + dx, A[1] + dy]; } while (sq(s) || !inR([A, B], 9) || (rt(s) === `sqrt(${s})` && R.bool(0.5)));
      const [k, r] = E.surd(1, s), ans = rt(s);
      return E.num(`Find the distance between ${p}${pp(A)} and ${q}${pp(B)}. Give an exact answer in simplest radical form.`, [{ label: 'distance =', exact: ans, form: 'simplest' }],
        `√(${Math.abs(dx)}² + ${Math.abs(dy)}²) = √${s}${k > 1 ? ` = √(${k * k} × ${r}) = ${E.pt(ans)}` : ', which does not simplify'}.`); } },
  });

  /* ================= V.11.02 Midpoint formula ================= */
  const twoPts = (R, lim) => { let A, B; do { A = [R.int(-lim, lim), R.int(-lim, lim)]; B = [R.int(-lim, lim), R.int(-lim, lim)]; } while (A[0] === B[0] || A[1] === B[1]); return [A, B]; };
  const avgTxt = (a, b) => `(${a} + ${par(b)}) ÷ 2 = ${f0((a + b) / 2)}`;
  S('V.11.02', 'Midpoint formula', {
    a: { t: 'average the coordinates', g: R => { const [p, q] = K.lets(R, 2), [A, B] = twoPts(R, 9), m = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];
      if (R.bool()) return E.num(`Find the midpoint of ${p}${pp(A)} and ${q}${pp(B)} by averaging the coordinates.`, [{ label: 'x =', ans: m[0] }, { label: 'y =', ans: m[1] }],
        `x = ${avgTxt(A[0], B[0])} and y = ${avgTxt(A[1], B[1])}. The midpoint is ${P(f0(m[0]), f0(m[1]))}.`);
      const right = P(f0(m[0]), f0(m[1])), wr = [P(f0((B[0] - A[0]) / 2), f0((B[1] - A[1]) / 2)), P(A[0] + B[0], A[1] + B[1]), P(f0(m[1]), f0(m[0])), P(f0((A[0] - B[0]) / 2), f0((A[1] - B[1]) / 2))];
      return E.choice(R, `What is the midpoint of ${p}${pp(A)} and ${q}${pp(B)}?`, right, wr,
        `Add each pair of coordinates and halve: x = ${avgTxt(A[0], B[0])}, y = ${avgTxt(A[1], B[1])}. The midpoint adds; it doesn't subtract.`); } },
    b: { t: 'apply', g: R => { const [p, q] = K.lets(R, 2), [A, B] = twoPts(R, 12), m = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];
      return E.num(`Find the midpoint of the segment from ${p}${pp(A)} to ${q}${pp(B)}.`, [{ point: [f0(m[0]), f0(m[1])] }],
        `${M(`M=((x_1+x_2)/2,(y_1+y_2)/2)`.replace(/_/g, ''))}: x = ${avgTxt(A[0], B[0])}, y = ${avgTxt(A[1], B[1])}. So M = ${P(f0(m[0]), f0(m[1]))}.`); } },
    c: { t: 'find an endpoint', g: R => { const [p, q, mm] = K.lets(R, 3), [A, B] = twoPts(R, 10), m = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];
      return E.num(`${mm}${P(f0(m[0]), f0(m[1]))} is the midpoint of ${p}${q}, and ${p} is ${pp(A)}. Find ${q}.`, [{ point: [String(B[0]), String(B[1])] }],
        `${mm} is halfway, so ${q} = 2${mm} − ${p}: x = 2 × ${par(f0(m[0]))} − ${par(A[0])} = ${B[0]}, y = 2 × ${par(f0(m[1]))} − ${par(A[1])} = ${B[1]}. So ${q} is ${pp(B)}.`); } },
    d: { t: 'center of a circle from a diameter', g: R => { const [p, q] = K.lets(R, 2); let A, B, s;
      do { [A, B] = twoPts(R, 9); s = d2(A, B); } while (sq(s) && R.bool(0.4));
      const m = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2], r = E.surdStr(0, 1, s, 2);
      return E.num(`${p}${pp(A)} and ${q}${pp(B)} are the ends of a diameter of a circle. Find its center and its radius. Give the radius exactly.`,
        [{ label: 'center', point: [f0(m[0]), f0(m[1])] }, { label: 'radius =', exact: r, form: 'simplest' }],
        `The center is the midpoint of the diameter: ${P(f0(m[0]), f0(m[1]))}. The diameter is √(${Math.abs(B[0] - A[0])}² + ${Math.abs(B[1] - A[1])}²) = √${s}, so the radius is half of that: ${E.pt(r)}.`); } },
  });

  /* ================= V.11.03 Partition a segment ================= */
  const coprimePair = (R, hi) => { let a, b; do { a = R.int(1, hi); b = R.int(1, hi); } while (a === b || gcd(a, b) !== 1); return [a, b]; };
  const stepVec = (R, n, lim) => { let u; do u = [R.int(-3, 3), R.int(-3, 3)]; while ((!u[0] && !u[1]) || Math.abs(u[0]) * n > lim || Math.abs(u[1]) * n > lim); return u; };
  S('V.11.03', 'Partition a segment', {
    a: { t: 'ratio a : b', g: R => { const [p, q, x] = K.lets(R, 3), [a, b] = coprimePair(R, 7), n = a + b, mode = R.int(0, 2);
      const head = `Point ${x} lies on ${p}${q} with ${p}${x} : ${x}${q} = ${a} : ${b}.`, why = `The ratio ${a} : ${b} cuts ${p}${q} into ${a} + ${b} = ${n} equal parts, and ${p}${x} is ${a} of them`;
      if (mode === 0) return E.num(`${head} What fraction of the way from ${p} to ${q} is ${x}?`, [{ frac: [a, n] }], `${why}: ${a}/${n} of the way, not ${a}/${b}.`);
      if (mode === 1) { const k = R.int(2, 6), L = n * k;
        return E.num(`${head} If ${p}${q} = ${L}, find ${p}${x}.`, [{ label: `${p}${x} =`, ans: a * k }], `${why}. Each part is ${L} ÷ ${n} = ${k}, so ${p}${x} = ${a} × ${k} = ${a * k}.`); }
      return E.choice(R, `${head} How far along ${p}${q} is ${x}, as a fraction of the whole segment?`, M(`${a}/${n}`), [M(fs(fr(a, b))), M(`${b}/${n}`), M(fs(fr(b, a)))],
        `${why}: ${a}/${n} of the way. (${a}/${b} compares the two parts with each other, not with the whole.)`); } },
    b: { t: 'fraction of the way', g: R => { const [p, q] = K.lets(R, 2), d = R.pick([2, 3, 4, 5]); let n; do n = R.int(1, d - 1); while (gcd(n, d) !== 1);
      let A, u; do { u = stepVec(R, d, 12); A = [R.int(-9, 9), R.int(-9, 9)]; } while (!inR([A, vadd(A, vmul(u, d))], 10));
      const B = vadd(A, vmul(u, d)), X = vadd(A, vmul(u, n));
      return E.num(`Find the point that is ${M(`${n}/${d}`)} of the way from ${p}${pp(A)} to ${q}${pp(B)}.`, [{ point: [String(X[0]), String(X[1])] }],
        `The move from ${p} to ${q} is ${P(u[0] * d, u[1] * d)}. ${n}/${d} of it is ${P(u[0] * n, u[1] * n)}, and ${pp(A)} + ${P(u[0] * n, u[1] * n)} = ${pp(X)}.`); } },
    c: { t: 'formula', g: R => { const [p, q, x] = K.lets(R, 3), [a, b] = coprimePair(R, 5), n = a + b;
      let A, u; do { u = stepVec(R, n, 14); A = [R.int(-9, 9), R.int(-9, 9)]; } while (!inR([A, vadd(A, vmul(u, n))], 10));
      const B = vadd(A, vmul(u, n)), X = vadd(A, vmul(u, a));
      return E.num(`${p}${pp(A)} and ${q}${pp(B)} are the ends of a segment. Point ${x} lies on it with ${p}${x} : ${x}${q} = ${a} : ${b}. Find ${x}.`, [{ point: [String(X[0]), String(X[1])] }],
        `Go t = ${a}/${n} of the way: x = ${A[0]} + ${a}/${n} × (${dxs(A, B, 0)}) = ${X[0]}, y = ${A[1]} + ${a}/${n} × (${dxs(A, B, 1)}) = ${X[1]}. So ${x} is ${pp(X)}.`); } },
    d: { t: 'check on a graph', g: R => { const [p, q, x] = K.lets(R, 3); let a, b; do [a, b] = coprimePair(R, 5); while (a + b > 7);
      const n = a + b; let A, u; do { u = stepVec(R, n, 12); A = [R.int(-7, 7), R.int(-7, 7)]; } while (!u[0] || !u[1] || !inR([A, vadd(A, vmul(u, n))], 7));
      const B = vadd(A, vmul(u, n)), X = vadd(A, vmul(u, a)), vis = plane({ pts: { [p]: A, [q]: B, [x]: X }, segs: [[p, q]], dir: { [x]: u[0] > 0 ? [-u[1], u[0]] : [u[1], -u[0]] }, label: 'a point on a segment' });   // the middle label sits beside the segment, not on it
      const why = `Each grid step along the segment moves ${pp(u)}. From ${p} to ${x} is ${a} step${a > 1 ? 's' : ''} and from ${x} to ${q} is ${b}, so ${p}${x} : ${x}${q} = ${a} : ${b}`;
      if (R.bool()) return E.choice(R, `In what ratio does ${x} divide ${p}${q}? Give ${p}${x} : ${x}${q}.`, `${a} : ${b}`, [`${b} : ${a}`, `${a} : ${n}`, `${b} : ${n}`], `${why}.`, { visual: vis });
      const yes = R.bool(), claim = yes ? `${a} : ${b}` : R.pick([`${b} : ${a}`, `${a} : ${n}`]);
      return E.choiceFixed(`Is ${p}${x} : ${x}${q} = ${claim}?`, ['Yes', 'No'], yes ? 0 : 1, `${why}.${yes ? '' : ` ${claim === `${a} : ${n}` ? `${a} : ${n} compares ${p}${x} with the whole segment.` : 'The parts are in the wrong order.'}`}`, { visual: vis }); } },
  });

  /* ================= V.11.04 Slope criteria ================= */
  const trap = R => { for (;;) { const u = [nz(R, -3, 3), R.int(-3, 3)], w = [nz(R, -3, 3), nz(R, -4, 4)], k1 = R.int(1, 3), k2 = R.int(1, 3), A = [R.int(-6, 4), R.int(-6, 4)];
    if (k1 === k2 || !vcr(u, w)) continue; const B = vadd(A, vmul(u, k1)), D = vadd(A, w), Cc = vadd(D, vmul(u, k2)), Q = [A, B, Cc, D];
    if (!inR(Q, 7) || Cc[0] === B[0] || !convex(Q)) continue; return Q; } };
  const fatTrap = R => { let Q; do Q = trap(R); while (Math.abs(tw2(Q)) < 16); return Q; };   // proofs: no sliver-thin trapezoids
  const pgram = R => { for (;;) { const u = [nz(R, -4, 4), R.int(-3, 3)], w = [nz(R, -3, 3), nz(R, -4, 4)], A = [R.int(-6, 4), R.int(-6, 4)];
    if (Math.abs(vcr(u, w)) < 4) continue; const Q = [A, vadd(A, u), vadd(vadd(A, u), w), vadd(A, w)]; if (!inR(Q, 7) || !convex(Q)) continue; return Q; } };
  const randPoly = (R, n, lo = 3, hi = 6, lim = 8) => { for (;;) { const c = [R.int(-2, 2), R.int(-2, 2)], base = R.int(0, 359), pts = [];
    for (let i = 0; i < n; i++) { const th = (base + i * 360 / n + R.int(-18, 18)) * Math.PI / 180, r = R.int(lo, hi); pts.push([Math.round(c[0] + r * Math.cos(th)) + 0, Math.round(c[1] + r * Math.sin(th)) + 0]); }
    if (distinct(pts) && convex(pts) && inR(pts, lim) && Math.abs(tw2(pts)) >= 16) return R.bool() ? pts : pts.reverse(); } };
  const parl = (A, B, Cc, D) => vcr(vsub(B, A), vsub(D, Cc)) === 0;
  S('V.11.04', 'Slope criteria', {
    a: { t: 'prove parallel sides', g: R => { const N = R.pick(QN).split('');
      if (R.bool(0.4)) { const Q = fatTrap(R), [A, B, Cc, D] = Q, AB = N[0] + N[1], DC = N[3] + N[2], AD = N[0] + N[3], BC = N[1] + N[2], nm = N.join('');
        const L = [[`Given: ${list(N, Q)}`, R_.given, []], [`Slope ${AB} = slope ${DC} = ${mS(slopeOf(A, B))}`, R_.slope, [0], [R_.mid, R_.dist, R_.par[0]]],
          [`${AB} ∥ ${DC}`, R_.par[0], [1], R_.par.slice(1)], [`Slope ${AD} = ${mS(slopeOf(A, D))} and slope ${BC} = ${mS(slopeOf(B, Cc))}`, R_.slope, [0], [R_.mid, R_.dist, R_.par[0]]],
          [`${AD} is not parallel to ${BC}`, 'lines with different slopes are not parallel', [3], ['lines whose slopes multiply to −1 are not parallel', 'segments of different lengths are not parallel', R_.mid]],
          [`${nm} is a trapezoid`, 'a quadrilateral with exactly one pair of parallel sides is a trapezoid', [], ['a quadrilateral with two pairs of parallel sides is a trapezoid', 'a quadrilateral with perpendicular diagonals is a trapezoid', R_.par[0]]]];
        return proofQ(R, `Prove that ${nm} with ${list(N, Q)} is a trapezoid.`, L, `Equal slopes give one pair of parallel sides and different slopes show the other pair is not parallel. The two slope lines can come in either order, each before the line that uses it.`, { visual: polyFig(N, Q, { label: 'a trapezoid' }) }); }
      if (R.bool(0.45)) { const Q = trap(R), vis = polyFig(N, Q, { label: 'a trapezoid' }), mAB = slopeOf(Q[0], Q[1]), mDC = slopeOf(Q[3], Q[2]);
        return E.num(`Quadrilateral ${N.join('')} has ${list(N, Q)}. Find the slopes of ${N[0]}${N[1]} and ${N[3]}${N[2]} to show that they are parallel.`, [{ label: `slope ${N[0]}${N[1]} =`, ...sf(mAB) }, { label: `slope ${N[3]}${N[2]} =`, ...sf(mDC) }],
          `Slope ${N[0]}${N[1]} = (${dxs(Q[0], Q[1], 1)}) ÷ (${dxs(Q[0], Q[1], 0)}) = ${mS(mAB)} and slope ${N[3]}${N[2]} = (${dxs(Q[3], Q[2], 1)}) ÷ (${dxs(Q[3], Q[2], 0)}) = ${mS(mDC)}. Equal slopes, so ${N[0]}${N[1]} ∥ ${N[3]}${N[2]}.`, { visual: vis }); }
      const kind = R.int(0, 3); let Q;
      if (kind === 0) Q = trap(R); else if (kind === 1) { const T = trap(R); Q = [T[1], T[2], T[3], T[0]]; } else if (kind === 2) Q = pgram(R);
      else do Q = randPoly(R, 4, 3, 6, 7); while (parl(...Q) || parl(Q[1], Q[2], Q[0], Q[3]) || Q.some((p, i) => p[0] === Q[(i + 1) % 4][0]));
      const [A, B, Cc, D] = Q, s = (X, Y) => mS(slopeOf(X, Y)), ab = N[0] + N[1], dc = N[3] + N[2], ad = N[0] + N[3], bc = N[1] + N[2];
      const opts = [`only ${ab} ∥ ${dc}`, `only ${ad} ∥ ${bc}`, 'both pairs', 'neither pair'];
      return E.choiceFixed(`Quadrilateral ${N.join('')} has ${list(N, Q)}. Which pairs of opposite sides are parallel?`, opts, kind,
        `Slopes: ${ab} ${s(A, B)}, ${dc} ${s(D, Cc)}, ${ad} ${s(A, D)}, ${bc} ${s(B, Cc)}. Equal slopes mean parallel sides, so the answer is ${opts[kind]}.`, { visual: polyFig(N, Q, { label: 'a quadrilateral' }) }); } },
    b: { t: 'prove perpendicular sides', g: R => { const [na, nb, nc] = K.trio(R); let u, A, B, Cc, yes, kind;
      if (R.bool(0.4)) { let u, P1, P2, P3; do { u = [nz(R, -4, 4), nz(R, -4, 4)]; P2 = [R.int(-6, 6), R.int(-6, 6)]; P1 = vadd(P2, vmul(u, R.int(1, 2))); P3 = vadd(P2, vmul(rot(u), R.pick([1, -1]) * R.int(1, 2))); }
        while (Math.abs(u[0]) === Math.abs(u[1]) || !inR([P1, P2, P3], 8));
        const m1 = slopeOf(P2, P1), m2 = slopeOf(P2, P3), ab = na + nb, bc = nb + nc, T = [P1, P2, P3], pz = m => RV(m)[0] < 0 ? `(${mS(m)})` : mS(m);
        const L = [[`Given: ${list([na, nb, nc], T)}`, R_.given, []], [`Slope ${ab} = ${mS(m1)}`, R_.slope, [0], [R_.mid, R_.dist, R_.perp[0]]], [`Slope ${bc} = ${mS(m2)}`, R_.slope, [0], [R_.mid, R_.dist, R_.perp[0]]],
          [`${mS(m1)} × ${pz(m2)} = −1`, 'multiply the two slopes', [1, 2], [R_.slope, R_.dist, R_.par[0]]], [`${ab} ⊥ ${bc}`, R_.perp[0], [3], R_.perp.slice(1)],
          [`∠${nb} = 90°, so triangle ${na}${nb}${nc} is a right triangle`, 'perpendicular lines meet at right angles', [], ['the converse of the Pythagorean theorem', 'two sides of equal length make a right angle', R_.par[0]]]];
        return proofQ(R, `Prove that triangle ${na}${nb}${nc} with ${list([na, nb, nc], T)} has a right angle at ${nb}.`, L, `The slopes of ${ab} and ${bc} multiply to −1, so the sides are perpendicular and ∠${nb} = 90°. The two slope lines can come in either order.`,
          { visual: plane({ pts: { [na]: P1, [nb]: P2, [nc]: P3 }, segs: [[na, nb], [nb, nc], [nc, na]], polys: [[na, nb, nc]], label: 'a triangle' }) }); }
      do { u = [nz(R, -4, 4), nz(R, -4, 4)]; const k1 = R.int(1, 2), k2 = R.int(1, 2); B = [R.int(-6, 6), R.int(-6, 6)]; A = vadd(B, vmul(u, k1)); yes = R.bool(); kind = R.int(0, 1);
        const w = yes ? vmul(rot(u), R.pick([1, -1])) : kind ? [u[0], -u[1]] : [u[1], u[0]]; Cc = vadd(B, vmul(w, k2)); }
      while (Math.abs(u[0]) === Math.abs(u[1]) || !inR([A, B, Cc], 8) || !vcr(vsub(A, B), vsub(Cc, B)));
      const m1 = slopeOf(B, A), m2 = slopeOf(B, Cc), prod = rmul(m1, m2), ab = na + nb, bc = nb + nc;
      if (R.bool(0.35)) { const BB = B, w = vmul(rot(u), R.pick([1, 2])), CC = vadd(BB, w); if (inR([CC], 9)) { const mm2 = slopeOf(BB, CC);
        return E.num(`Triangle ${na}${nb}${nc} has ${list([na, nb, nc], [A, BB, CC])}. Find the slopes of ${ab} and ${bc} to show that ∠${nb} is a right angle.`, [{ label: `slope ${ab} =`, ...sf(m1) }, { label: `slope ${bc} =`, ...sf(mm2) }],
          `Slope ${ab} = ${mS(m1)} and slope ${bc} = ${mS(mm2)}. Their product is −1, so ${ab} ⊥ ${bc} and ∠${nb} = 90°.`, { visual: plane({ pts: { [na]: A, [nb]: BB, [nc]: CC }, segs: [[na, nb], [nb, nc], [nc, na]], right: [[na, nb, nc]], polys: [[na, nb, nc]], label: 'a right triangle' }) }); } }
      return E.choiceFixed(`Triangle ${na}${nb}${nc} has ${list([na, nb, nc], [A, B, Cc])}. Is ${ab} ⊥ ${bc}?`, ['Yes', 'No'], yes ? 0 : 1,
        `Slope ${ab} = ${mS(m1)}, slope ${bc} = ${mS(m2)}, and their product is ${mS(prod)}. ${yes ? 'A product of −1 means perpendicular.' : `That is not −1, so they are not perpendicular.${kind ? ' Negating a slope is not enough: perpendicular slopes are negative reciprocals.' : ' Flipping a slope is not enough: you must also change its sign.'}`}`); } },
    c: { t: 'find a missing vertex', g: R => { const N = R.pick(QN).split(''), kind = R.int(0, 2); let Q;
      for (;;) { const A = [R.int(-6, 6), R.int(-6, 6)], u = [nz(R, -4, 4), R.int(-4, 4)]; let v;
        if (kind === 0) v = [R.int(-4, 4), nz(R, -4, 4)]; else if (kind === 1) v = vmul(rot(u), R.pick([1, -1]) * 2); else v = vmul(rot(u), R.pick([1, -1]));
        if (!vcr(u, v)) continue; Q = [A, vadd(A, u), vadd(vadd(A, u), v), vadd(A, v)]; if (inR(Q, 8)) break; }
      const h = R.int(0, 3), o = (h + 2) % 4, n1 = (h + 1) % 4, n3 = (h + 3) % 4, X = Q[h], shape = ['parallelogram', 'rectangle', 'square'][kind];
      const givenI = [0, 1, 2, 3].filter(i => i !== h), pts = {}; givenI.forEach(i => pts[N[i]] = Q[i]);
      const vis = plane({ pts, segs: [[N[o], N[n1]], [N[o], N[n3]]], label: `three corners of a ${shape}` });
      return E.num(`${shape[0].toUpperCase() + shape.slice(1)} ${N.join('')} has ${list(givenI.map(i => N[i]), givenI.map(i => Q[i]))}. Find ${N[h]}.`, [{ point: [String(X[0]), String(X[1])] }],
        `${kind ? `A ${shape} is a parallelogram, and in` : 'In'} a parallelogram the diagonals share a midpoint, so ${N[h]} + ${N[o]} = ${N[n1]} + ${N[n3]}. ${N[h]} = ${N[n1]} + ${N[n3]} − ${N[o]} = ${P(`${Q[n1][0]} + ${par(Q[n3][0])} - ${par(Q[o][0])}`, `${Q[n1][1]} + ${par(Q[n3][1])} - ${par(Q[o][1])}`)} = ${pp(X)}.`, { visual: vis }); } },
    d: { t: 'right angle tests', g: R => { const ns = K.trio(R), which = R.int(0, 3); let T;
      const ok = T => inR(T, 8) && distinct(T) && T.every((p, i) => { const q = T[(i + 1) % 3]; return p[0] !== q[0] && p[1] !== q[1]; }) && Math.abs(tw2(T)) >= 6;
      const rightAt = T => [0, 1, 2].filter(i => vdot(vsub(T[(i + 1) % 3], T[i]), vsub(T[(i + 2) % 3], T[i])) === 0);
      do { if (which < 3) { const u = [nz(R, -4, 4), nz(R, -4, 4)], Vv = [R.int(-5, 5), R.int(-5, 5)], p1 = vadd(Vv, vmul(u, R.int(1, 2))), p2 = vadd(Vv, vmul(rot(u), R.pick([1, -1]) * R.int(1, 2)));
          T = []; T[which] = Vv; const oth = R.bool() ? [p1, p2] : [p2, p1]; T[(which + 1) % 3] = oth[0]; T[(which + 2) % 3] = oth[1]; }
        else if (R.bool(0.5)) { const u = [nz(R, -4, 4), nz(R, -4, 4)], Vv = [R.int(-5, 5), R.int(-5, 5)], wi = R.int(0, 2); T = []; T[wi] = Vv; T[(wi + 1) % 3] = vadd(Vv, u); T[(wi + 2) % 3] = vadd(Vv, vmul([u[0], -u[1]], R.int(1, 2))); }
        else T = [0, 1, 2].map(() => [R.int(-7, 7), R.int(-7, 7)]); }
      while (!ok(T) || (which < 3 ? rightAt(T).length !== 1 : rightAt(T).length !== 0));
      const s = (i, j) => slopeOf(T[i], T[j]), sides = [[0, 1], [1, 2], [2, 0]].map(([i, j]) => `${ns[i]}${ns[j]} ${mS(s(i, j))}`).join(', ');
      return E.choiceFixed(`Triangle ${ns.join('')} has ${list(ns, T)}. Which angle is a right angle?`, ns.map(n => '∠' + n).concat(['no right angle']), which,
        `Slopes: ${sides}. ${which < 3 ? `At ${ns[which]}: ${mS(s(which, (which + 1) % 3))} × ${RV(s(which, (which + 2) % 3))[0] < 0 ? `(${mS(s(which, (which + 2) % 3))})` : mS(s(which, (which + 2) % 3))} = −1, so ∠${ns[which]} = 90°.` : 'No two slopes multiply to −1 (negatives like 2 and −2 do not count), so there is no right angle.'}`); } },
  });

  /* ================= V.11.05 Special lines ================= */
  const randTriL = (R, lim = 7, par2 = false) => { for (;;) { const T = [0, 1, 2].map(() => [R.int(-lim, lim), R.int(-lim, lim)]); if (par2) { T[2] = [T[1][0] + 2 * R.int(-4, 4), T[1][1] + 2 * R.int(-4, 4)]; if (!inR([T[2]], lim)) continue; }
    if (distinct(T) && Math.abs(tw2(T)) >= 12) return T; } };
  const triFig = (ns, T, o = {}) => plane(Object.assign({ pts: { [ns[0]]: T[0], [ns[1]]: T[1], [ns[2]]: T[2] }, segs: [[ns[0], ns[1]], [ns[1], ns[2]], [ns[2], ns[0]]], polys: [ns] }, o));
  const eqTxt = (eq, siq) => eq === siq ? M(eq) : `${M(eq)}, which is ${M(siq)}`;
  const altWhy = (ns, T, i) => { const j = (i + 1) % 3, k = (i + 2) % 3, A = T[j], B = T[k], side = ns[j] + ns[k];
    if (A[1] === B[1]) return `${side} is horizontal, so the altitude from ${ns[i]} is the vertical line ${M(perpEq(T[i], A, B))}`;
    if (A[0] === B[0]) return `${side} is vertical, so the altitude from ${ns[i]} is the horizontal line ${M(perpEq(T[i], A, B))}`;
    return `${side} has slope ${mS(slopeOf(A, B))}, so the altitude from ${ns[i]} has slope ${mS(recipNeg(slopeOf(A, B)))}: ${eqTxt(perpEq(T[i], A, B), perpSI(T[i], A, B))}`; };
  const pbWhy = (n1, n2, A, B) => { const m = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];
    if (A[1] === B[1]) return `${n1}${n2} is horizontal, so its perpendicular bisector is the vertical line through ${pp(m)}: ${M(perpEq(m, A, B))}`;
    if (A[0] === B[0]) return `${n1}${n2} is vertical, so its perpendicular bisector is the horizontal line through ${pp(m)}: ${M(perpEq(m, A, B))}`;
    return `${n1}${n2} has midpoint ${pp(m)} and slope ${mS(slopeOf(A, B))}, so its perpendicular bisector is ${eqTxt(perpEq(m, A, B), perpSI(m, A, B))}`; };
  const ortho = (T, O) => { const H = vsub(vadd(vadd(T[0], T[1]), T[2]), vmul(O, 2)); if (vdot(vsub(H, T[0]), vsub(T[2], T[1])) || vdot(vsub(H, T[1]), vsub(T[2], T[0]))) throw new Error('orthocenter check'); return H; };
  S('V.11.05', 'Special lines', {
    a: { t: 'perpendicular bisector equation', g: R => { const [p, q] = K.lets(R, 2), m = [R.int(-4, 4), R.int(-4, 4)], ax = R.bool(0.15); let u;
      if (ax) u = R.bool() ? [nz(R, -4, 4), 0] : [0, nz(R, -4, 4)]; else u = [nz(R, -4, 4), nz(R, -4, 4)];
      const A = vsub(m, u), B = vadd(m, u), vis = plane({ pts: { [p]: A, [q]: B }, segs: [[p, q]], label: 'a segment' });
      return E.num(`Find an equation of the perpendicular bisector of ${p}${q}, where ${p} is ${pp(A)} and ${q} is ${pp(B)}.`, [{ eqn: perpEq(m, A, B) }],
        `${pbWhy(p, q, A, B)}. It passes through the midpoint at a right angle to ${p}${q}.`, { visual: vis }); } },
    b: { t: 'altitude equation', g: R => { const ns = K.trio(R), T = randTriL(R, 6), i = R.int(0, 2), j = (i + 1) % 3, k = (i + 2) % 3;
      return E.num(`Triangle ${ns.join('')} has ${list(ns, T)}. Find an equation of the altitude from ${ns[i]}.`, [{ eqn: perpEq(T[i], T[j], T[k]) }],
        `The altitude goes through ${ns[i]} and meets ${ns[j]}${ns[k]} at a right angle. ${altWhy(ns, T, i)}.`, { visual: triFig(ns, T, { label: 'a triangle' }) }); } },
    c: { t: 'median equation', g: R => { const ns = K.trio(R), i = R.int(0, 2), j = (i + 1) % 3, k = (i + 2) % 3; let T, m;
      do { T = []; m = [R.int(-5, 5), R.int(-5, 5)]; const h = [R.int(-4, 4), R.int(-4, 4)]; T[j] = vadd(m, h); T[k] = vsub(m, h); T[i] = [R.int(-7, 7), R.int(-7, 7)]; }
      while (!inR(T, 8) || !distinct(T) || Math.abs(tw2(T)) < 12);
      const eq = lineEq(T[i], m), siq = lineSI(T[i], m);
      return E.num(`Triangle ${ns.join('')} has ${list(ns, T)}. Find an equation of the median from ${ns[i]}.`, [{ eqn: eq }],
        `The median joins ${ns[i]} to the midpoint of ${ns[j]}${ns[k]}, which is ${pp(m)}. ${T[i][0] === m[0] ? `Both have x = ${m[0]}, so it is ${M(eq)}` : `Slope ${mS(slopeOf(T[i], m))}: ${eqTxt(eq, siq)}`}. It need not be perpendicular to ${ns[j]}${ns[k]}.`, { visual: triFig(ns, T, { label: 'a triangle' }) }); } },
    d: { t: 'find where they meet', g: R => { const ns = K.trio(R);
      if (R.bool()) { let T; do T = randTriL(R, 7); while ((T[0][0] + T[1][0] + T[2][0]) % 3 || (T[0][1] + T[1][1] + T[2][1]) % 3);
        const Gc = [(T[0][0] + T[1][0] + T[2][0]) / 3, (T[0][1] + T[1][1] + T[2][1]) / 3];
        return E.num(`Triangle ${ns.join('')} has ${list(ns, T)}. Find the point where its three medians meet.`, [{ point: [String(Gc[0]), String(Gc[1])] }],
          `The medians meet at the centroid, the average of the vertices: x = (${T[0][0]} + ${par(T[1][0])} + ${par(T[2][0])}) ÷ 3 = ${Gc[0]}, y = (${T[0][1]} + ${par(T[1][1])} + ${par(T[2][1])}) ÷ 3 = ${Gc[1]}.`, { visual: triFig(ns, T, { label: 'a triangle' }) }); }
      let c, H; do { c = circTri(R); H = ortho(c.T, c.O); } while (!inR([H], 12) || !inR(c.T, 11));
      const T = c.T, [i, j] = R.sample([0, 1, 2], 2);
      return E.num(`Triangle ${ns.join('')} has ${list(ns, T)}. Find the point where its three altitudes meet.`, [{ point: [String(H[0]), String(H[1])] }],
        `${altWhy(ns, T, i)}. ${altWhy(ns, T, j)}. Solving these two together gives ${pp(H)}, and the third altitude passes through it too.`, { visual: triFig(ns, T, { label: 'a triangle', extra: [H] }) }); } },
    e: { t: 'the point equidistant from three points', g: R => { const ns = K.trio(R);
      if (R.bool(0.6)) { let c; do c = circTri(R); while (!inR(c.T, 11));
        const T = c.T, O = c.O, r = rt(c.r2);
        return E.num(`Find the point that is the same distance from ${list(ns, T)}, and that distance. Give the distance exactly.`, [{ label: 'point', point: [String(O[0]), String(O[1])] }, { label: 'distance =', exact: r, form: 'simplest' }],
          `The point lies on every perpendicular bisector. ${pbWhy(ns[0], ns[1], T[0], T[1])}. ${pbWhy(ns[1], ns[2], T[1], T[2])}. They meet at ${pp(O)}, and its distance to ${ns[0]} is √${c.r2}${r === `sqrt(${c.r2})` ? '' : ' = ' + E.pt(r)}.`, { visual: triFig(ns, T, { label: 'a triangle', extra: [O] }) }); }
      const onX = R.bool(); let t, v1, v2, A, B;
      do { t = R.int(-5, 5); const n = R.pick([5, 10, 13, 17, 25]), vs = []; for (let a = -5; a <= 5; a++) for (let b = -5; b <= 5; b++) if (a * a + b * b === n) vs.push([a, b]); [v1, v2] = R.sample(vs, 2);
        const Tp = onX ? [t, 0] : [0, t]; A = vadd(Tp, v1); B = vadd(Tp, v2); }
      while ((onX ? A[0] === B[0] : A[1] === B[1]) || (onX ? A[1] === 0 && B[1] === 0 : A[0] === 0 && B[0] === 0) || !inR([A, B], 9) || (A[0] === -B[0] && A[1] === -B[1] && false));
      const [p, q] = K.lets(R, 2), k = onX ? 0 : 1, ans = onX ? [t, 0] : [0, t], coef = 2 * (B[k] - A[k]), rhs = (B[0] ** 2 + B[1] ** 2) - (A[0] ** 2 + A[1] ** 2), v = onX ? 'x' : 'y';
      return E.num(`Find the point on the ${v}-axis that is the same distance from ${p}${pp(A)} and ${q}${pp(B)}.`, [{ point: [String(ans[0]), String(ans[1])] }],
        `Call it ${onX ? P('t', 0) : P(0, 't')} and set the squared distances equal. The t² terms cancel, leaving ${M(`${coef}t=${rhs}`)}, so t = ${t}. (It is where the perpendicular bisector of ${p}${q} meets the ${v}-axis.)`); } },
    f: { t: 'centers without the triangle', g: R => { const ns = K.trio(R), kind = R.int(0, 2);
      if (kind === 0) { let T; do { const par0 = [R.int(0, 1), R.int(0, 1)]; T = [0, 1, 2].map(() => [par0[0] + 2 * R.int(-4, 4), par0[1] + 2 * R.int(-4, 4)]); } while (!distinct(T) || Math.abs(tw2(T)) < 16 || !inR(T, 9));
        const mid = (i, j) => [(T[i][0] + T[j][0]) / 2, (T[i][1] + T[j][1]) / 2], Mx = [mid(1, 2), mid(2, 0), mid(0, 1)], lt = K.lets(R, 6).filter(l => !ns.includes(l)).slice(0, 3), w = R.int(0, 2);
        const a = (w + 1) % 3, b = (w + 2) % 3;   // the vertex w sits between the midpoints of its two sides
        return E.num(`In triangle ${ns.join('')}, the midpoint of ${ns[1]}${ns[2]} is ${lt[0]}${pp(Mx[0])}, the midpoint of ${ns[2]}${ns[0]} is ${lt[1]}${pp(Mx[1])}, and the midpoint of ${ns[0]}${ns[1]} is ${lt[2]}${pp(Mx[2])}. Find ${ns[w]}.`,
          [{ point: [String(T[w][0]), String(T[w][1])] }],
          `Each midsegment is parallel to a side and half as long, so ${ns[w]}, ${lt[b]}, ${lt[w]}, ${lt[a]} form a parallelogram. Opposite corners add to the same point: ${ns[w]} = ${lt[a]} + ${lt[b]} − ${lt[w]} = ${pp(T[w])}.`); }
      if (kind === 1) { let c, Gc, H; do { c = circTri(R); const s = vadd(vadd(c.T[0], c.T[1]), c.T[2]); Gc = [s[0] / 3, s[1] / 3]; H = s.map((x, i) => x - 2 * c.O[i]); } while (!Number.isInteger(Gc[0]) || !Number.isInteger(Gc[1]) || !inR([H], 14) || same(Gc, c.O));
        ortho(c.T, c.O);
        return E.num(`Triangle ${ns.join('')} has circumcenter O${pp(c.O)} and centroid G${pp(Gc)}. Find its orthocenter H.`, [{ point: [String(H[0]), String(H[1])] }],
          `O, G and H lie on the Euler line, with G between them and HG = 2 · GO. So H = O + 3(G − O) = 3G − 2O = ${pp(H)}.`); }
      let T, w; do { const u = [nz(R, -4, 4), nz(R, -4, 4)], Vv = [R.int(-5, 5), R.int(-5, 5)]; w = R.int(0, 2); T = []; T[w] = Vv; T[(w + 1) % 3] = vadd(Vv, vmul(u, R.int(1, 2))); T[(w + 2) % 3] = vadd(Vv, vmul(rot(u), R.pick([1, -1]) * R.int(1, 2))); }
      while (!inR(T, 8));
      const j = (w + 1) % 3, k = (w + 2) % 3;
      return E.num(`Find the point where the three altitudes of triangle ${ns.join('')} meet, given ${list(ns, T)}.`, [{ point: [String(T[w][0]), String(T[w][1])] }],
        `Slope ${ns[w]}${ns[j]} = ${mS(slopeOf(T[w], T[j]))} and slope ${ns[w]}${ns[k]} = ${mS(slopeOf(T[w], T[k]))} multiply to −1, so ∠${ns[w]} = 90°. Each leg is the altitude to the other leg, so all three altitudes meet at ${ns[w]}${pp(T[w])}.`); } },
  });

  /* ================= V.11.06 Perimeter & area on the plane ================= */
  const lenTxt = (A, B) => { const s = d2(A, B); return A[0] === B[0] || A[1] === B[1] ? String(Math.sqrt(s)) : sq(s) ? `√${s} = ${Math.sqrt(s)}` : `√${s}${rt(s) === `sqrt(${s})` ? '' : ' = ' + E.pt(rt(s))}`; };
  const exactSum = sqs => { let ip = 0; const rad = {}; sqs.forEach(s => { const [k, r] = E.surd(1, s); if (r === 1) ip += k; else rad[r] = (rad[r] || 0) + k; });
    const parts = []; if (ip) parts.push(String(ip)); Object.keys(rad).map(Number).sort((a, b) => a - b).forEach(r => parts.push(`${rad[r] === 1 ? '' : rad[r]}sqrt(${r})`)); return parts.join('+'); };
  const cornerTxt = (a, b) => `½ × ${a} × ${b} = ${f0(a * b / 2)}`;
  S('V.11.06', 'Perimeter & area on the plane', {
    a: { t: 'perimeter with distances', g: R => { const ns = K.trio(R);
      if (R.bool(0.55)) { let T; do { const v1 = R.pick(VA), v2 = R.pick(VA), v3 = vadd(v1, v2), A = [R.int(-7, 7), R.int(-7, 7)]; T = [A, vadd(A, v1), vadd(A, v3)]; if (!sq(v3[0] ** 2 + v3[1] ** 2) || !vcr(v1, v2)) T = null; } while (!T || !inR(T, 9) || Math.abs(tw2(T)) < 12);
        const L = [[0, 1], [1, 2], [2, 0]].map(([i, j]) => Math.sqrt(d2(T[i], T[j]))), per = L[0] + L[1] + L[2];
        return E.num(`Find the perimeter of triangle ${ns.join('')} with ${list(ns, T)}.`, [{ label: 'perimeter =', ans: per }],
          `${[[0, 1], [1, 2], [2, 0]].map(([i, j]) => `${ns[i]}${ns[j]} = ${lenTxt(T[i], T[j])}`).join(', ')}. Perimeter = ${L.join(' + ')} = ${per}.`, { visual: triFig(ns, T, { label: 'a triangle' }) }); }
      const quad = R.bool(0.4), N = quad ? R.pick(QN).split('') : ns; let Q;
      do Q = quad ? randPoly(R, 4, 3, 5, 7) : randTriL(R, 6); while (Q.map((p, i) => d2(p, Q[(i + 1) % Q.length])).every(sq));
      const sqs = Q.map((p, i) => d2(p, Q[(i + 1) % Q.length])), ans = exactSum(sqs);
      return E.num(`Find the perimeter of ${quad ? 'quadrilateral' : 'triangle'} ${N.join('')} with ${list(N, Q)}. Give an exact answer.`, [{ label: 'perimeter =', exact: ans }],
        `${Q.map((p, i) => `${N[i]}${N[(i + 1) % Q.length]} = ${lenTxt(p, Q[(i + 1) % Q.length])}`).join(', ')}. Add them, combining like radicals: ${E.pt(ans)}.`, { visual: polyFig(N, Q, { label: 'a polygon' }) }); } },
    b: { t: 'area by enclosing box', g: R => { const ns = K.trio(R); let T, w, h, p, q;
      do { w = R.int(3, 8); h = R.int(3, 8); p = R.int(0, h - 1); q = R.int(0, w - 1); T = [[0, 0], [w, p], [q, h]]; } while (p === 0 && q === 0);
      const fx = R.pick([1, -1]), fy = R.pick([1, -1]), swp = R.bool(), tr = [R.int(-3, 3), R.int(-3, 3)];
      const map = pt => { let [x, y] = pt; x *= fx; y *= fy; if (swp) [x, y] = [y, x]; return [x + tr[0] + 0, y + tr[1] + 0]; };
      const Tm = R.shuffle(T.map(map)), xs = Tm.map(t => t[0]), ys = Tm.map(t => t[1]), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys), W = x1 - x0, H = y1 - y0;
      const pieces = [[w, p], [h - p, w - q], [q, h]].filter(([a, b]) => a && b), sub = pieces.reduce((s, [a, b]) => s + a * b / 2, 0), area = w * h - sub;
      const pts = { [ns[0]]: Tm[0], [ns[1]]: Tm[1], [ns[2]]: Tm[2], _1: [x0, y0], _2: [x1, y0], _3: [x1, y1], _4: [x0, y1] };
      const vis = plane({ pts, segs: [['_1', '_2', { dash: 1 }], ['_2', '_3', { dash: 1 }], ['_3', '_4', { dash: 1 }], ['_4', '_1', { dash: 1 }], [ns[0], ns[1]], [ns[1], ns[2]], [ns[2], ns[0]]], polys: [ns], center: [(x0 + x1) / 2, (y0 + y1) / 2], label: 'a triangle in a box' });
      return E.num(`Find the area of triangle ${ns.join('')} with ${list(ns, Tm)}. Use the box drawn around it.`, [{ label: 'area =', ans: area }],
        `The box is ${W} by ${H}, area ${W * H}. Subtract the ${['', 'one', 'two', 'three'][pieces.length]} corner right triangle${pieces.length > 1 ? 's' : ''}: ${pieces.map(([a, b]) => cornerTxt(a, b)).join(', ')}. Area = ${W * H} − ${f0(sub)} = ${f0(area)}.`, { visual: vis }); } },
    c: { t: 'shoelace formula', g: R => { const n = R.bool(0.3) ? 5 : 4, N = n === 4 ? R.pick(QN).split('') : R.pick(['ABCDE', 'PQRST', 'JKLMN', 'VWXYZ']).split(''), Q = randPoly(R, n, 3, 6, 8);
      const terms = Q.map((p, i) => { const q = Q[(i + 1) % n]; return p[0] * q[1] - q[0] * p[1]; }), s = terms.reduce((a, b) => a + b, 0);
      return E.num(`Use the shoelace formula to find the area of ${n === 4 ? 'quadrilateral' : 'pentagon'} ${N.join('')} with ${list(N, Q)} (listed in order around the shape).`, [{ label: 'area =', ans: Math.abs(s) / 2 }],
        `Sum ${M('x_1y_2-x_2y_1'.replace(/_/g, ''))} around the shape: ${terms.map(par).join(' + ')} = ${s}. Area = |${mn(s)}| ÷ 2 = ${f0(Math.abs(s) / 2)}.`, { visual: polyFig(N, Q, { label: 'a polygon' }) }); } },
    d: { t: 'compare methods', g: R => {
      if (R.bool()) { const N = R.pick(QN).split(''); let Q, bad, good;
        do { Q = randPoly(R, 4, 3, 6, 7); good = Math.abs(tw2(Q)) / 2; bad = Math.abs(tw2([Q[0], Q[2], Q[1], Q[3]])) / 2; } while (bad === good);
        const nm = R.pick(['Kai', 'Mia', 'Leo', 'Ana', 'Sam', 'Zoe']);
        return E.num(`Quadrilateral ${N.join('')} has ${list(N, Q)}. ${nm} uses the shoelace formula with the vertices in the order ${N[0]}, ${N[2]}, ${N[1]}, ${N[3]} and gets ${f0(bad)}. Find the true area.`, [{ label: 'area =', ans: good }],
          `${N[0]}, ${N[2]}, ${N[1]}, ${N[3]} jumps across the shape, so the formula gives a wrong value. In order around the shape (${N.join(', ')}) the sum is ${tw2(Q)}, so the area is ${f0(good)}.`, { visual: polyFig(N, Q, { label: 'a quadrilateral' }) }); }
      const L = R.pick(['ABCDE', 'PQRST', 'JKLMN', 'VWXYZ', 'FGHJK']).split(''), Q = randPoly(R, 5, 3, 6, 7), nmz = R.shuffle(L.slice()), ord = [0, 1, 2, 3, 4].map(i => nmz[i]);
      const start = R.int(0, 4), dirn = R.bool() ? 1 : -1, around = [0, 1, 2, 3, 4].map(k => ord[((start + dirn * k) % 5 + 5) % 5]);
      const isCyc = arr => { const s = arr.map(c => ord.indexOf(c)), d = ((s[1] - s[0]) % 5 + 5) % 5; if (d !== 1 && d !== 4) return false; return s.every((x, k) => x === ((s[0] + (d === 1 ? k : -k)) % 5 + 5) % 5); };
      const wrong = []; let guard = 0; while (wrong.length < 3 && guard++ < 200) { const c = [around[0], ...R.shuffle(around.slice(1))]; if (!isCyc(c) && !wrong.some(w => w.join() === c.join())) wrong.push(c); }
      const pts = {}; ord.forEach((n, i) => pts[n] = Q[i]);
      const vis = plane({ pts, segs: ord.map((n, i) => [n, ord[(i + 1) % 5]]), polys: [ord], label: 'a pentagon' });
      return E.choice(R, 'Which list of vertices can go straight into the shoelace formula for this pentagon?', around.join(', '), wrong.map(w => w.join(', ')),
        `The shoelace formula needs the vertices in order around the shape, either way round: ${around.join(', ')}. The other lists jump across the pentagon and give a wrong area.`, { visual: vis }); } },
    e: { t: 'run it backwards: find k from the area', g: R => { const ns = K.trio(R); let A, B, c, alpha, beta, k1, k2, onY, S2;
      do { A = [R.int(-6, 6), R.int(-6, 6)]; B = [R.int(-6, 6), R.int(-6, 6)]; c = R.int(-6, 6); onY = R.bool();
        const crs = k => { const Cc = onY ? [c, k] : [k, c]; return vcr(vsub(B, A), vsub(Cc, A)); }; beta = crs(0); alpha = crs(1) - beta;
        k1 = R.int(-8, 8); S2 = Math.abs(alpha * k1 + beta); k2 = alpha ? (-(alpha * k1 + beta) - beta) / alpha : 0; }
      while (same(A, B) || !alpha || !S2 || !Number.isInteger(k2) || k1 === k2 || Math.abs(k2) > 12 || S2 < 4);
      const Ct = onY ? P(c, 'k') : P('k', c), ex = tsum([tm(alpha, 'k'), tm(beta)]);
      return E.num(`Triangle ${ns.join('')} has ${nameP(ns[0], A)}, ${nameP(ns[1], B)} and ${ns[2]}${Ct}. Its area is ${f0(S2 / 2)}. Find all possible values of k.`, [{ label: 'k =', set: [String(k1), String(k2)] }],
        `The shoelace formula gives area ${M(`1/2|${ex}|`)}. So ${M(`|${ex}|=${S2}`)}: ${M(`${ex}=${S2}`)} or ${M(`${ex}=${-S2}`)}, giving k = ${k1 < k2 ? k1 : k2} or ${k1 < k2 ? k2 : k1}.`.replace(/\+-/g, '-')); } },
    f: { t: 'count the hidden points, or a diamond', g: R => {
      if (R.bool()) { const ns = K.trio(R); let T, A2, Bd, I;
        do { T = randTriL(R, 7); A2 = Math.abs(tw2(T)); Bd = [0, 1, 2].reduce((s, i) => s + gcd(T[(i + 1) % 3][0] - T[i][0], T[(i + 1) % 3][1] - T[i][1]), 0); I = (A2 - Bd + 2) / 2; } while (I < 3 || I > 40 || Bd < 4);
        return E.num(`How many points with whole-number coordinates lie strictly inside the triangle with vertices ${pp(T[0])}, ${pp(T[1])} and ${pp(T[2])}?`, [{ ans: I }],
          `Shoelace: area = ${f0(A2 / 2)}. The boundary has ${Bd} lattice points (each side holds gcd(|Δx|, |Δy|) of them, counting one end). Pick's theorem, area = I + B/2 − 1, gives I = ${f0(A2 / 2)} − ${f0(Bd / 2)} + 1 = ${I}.`); }
      const a = R.int(1, 6), b = R.int(1, 6), g = R.pick([1, 1, 2]), h = R.int(-4, 4), k = R.int(-4, 4), Pc = b * g, Qc = a * g, Rr = a * b * g;
      if (a === 1 && b === 1 && g === 1 && R.bool(0.5)) return E.num(`Find the area of the region ${M(`|${sh('x', h)}|+|${sh('y', k)}|<=2`)}.`, [{ label: 'area =', ans: 8 }],
        `It is a square standing on a corner, with vertices ${P(h + 2, k)}, ${P(h - 2, k)}, ${P(h, k + 2)} and ${P(h, k - 2)}. Its diagonals are 4 and 4, so the area is ½ × 4 × 4 = 8.`);
      const ineq = `${Pc === 1 ? '' : Pc}|${sh('x', h)}|+${Qc === 1 ? '' : Qc}|${sh('y', k)}|<=${Rr}`;
      return E.num(`Find the area of the region ${M(ineq)}.`, [{ label: 'area =', ans: 2 * a * b }],
        `It is a rhombus centered at ${P(h, k)}: setting y = ${k} gives x = ${h} ± ${a}, and setting x = ${h} gives y = ${k} ± ${b}. The diagonals are ${2 * a} and ${2 * b}, so the area is ½ × ${2 * a} × ${2 * b} = ${2 * a * b}.`); } },
  });

  /* ================= V.11.07 Point-to-line distance ================= */
  const SLP = [1, -1, 2, -2, 3, -3, [1, 2], [-1, 2], [2, 3], [-2, 3], [3, 2], [-3, 2], [1, 3], [-1, 3], [3, 4], [-3, 4]].map(RV);
  const AB = [[1, 1], [1, 2], [2, 1], [1, 3], [3, 1], [2, 3], [3, 2], [3, 4], [4, 3], [5, 12], [12, 5], [1, 4], [4, 1]];
  const lineForm = (R, a, b, c, allowSI = true) => { const f = R.int(0, allowSI && b === -1 ? 2 : 1);   // a x + b y + c = 0, shown three ways
    if (f === 0) return { txt: zf(a, b, c), a, b, c };
    if (f === 1) { const g = a < 0 ? -1 : 1; return { txt: std(g * a, g * b, -g * c), a, b, c }; }
    return { txt: si(a, c), a, b, c, si: true }; };
  const distEx = (N, s) => E.surdStr(0, Math.abs(N), s, s);
  S('V.11.07', 'Point-to-line distance', {
    a: { t: 'drop a perpendicular', g: R => { const pn = K.lets(R, 1)[0], P0 = [R.int(-8, 8), R.int(-8, 8)];
      if (R.bool(0.4)) { const vert = R.bool(); let c; do c = R.int(-8, 8); while (c === P0[vert ? 0 : 1]); const eq = (vert ? 'x=' : 'y=') + c, d = Math.abs(P0[vert ? 0 : 1] - c);
        const vis = plane({ pts: { [pn]: P0 }, extra: [vert ? [c, P0[1]] : [P0[0], c]], [vert ? 'vlines' : 'hlines']: [vert ? { x: c, color: C.blue, dash: false } : { y: c, color: C.blue, dash: false }], label: 'a point and a line' });
        return E.num(`How far is ${pn}${pp(P0)} from the line ${M(eq)}?`, [{ label: 'distance =', ans: d }],
          `The perpendicular from ${pn} to a ${vert ? 'vertical' : 'horizontal'} line is ${vert ? 'horizontal' : 'vertical'}, so the distance is the difference in ${vert ? 'x' : 'y'}: |${mn(P0[vert ? 0 : 1])} − ${par(c)}| = ${d}.`, { visual: vis }); }
      let m, b; do { m = R.pick(SLP); b = R.int(-6, 6); } while (radd(rmul(m, P0[0]), b)[0] === P0[1] * radd(rmul(m, P0[0]), b)[1]);
      const pm = recipNeg(m);
      return E.num(`Write an equation of the line through ${pn}${pp(P0)} perpendicular to ${M(si(m, b))}. (This is the perpendicular dropped from ${pn} to the line.)`, [{ eqn: ps(pm, P0[0], P0[1]) }],
        `The line has slope ${mS(m)}, so the perpendicular has slope ${mS(pm)}, the negative reciprocal. Through ${pp(P0)}: ${eqTxt(ps(pm, P0[0], P0[1]), siOf(pm, P0))}.`); } },
    b: { t: 'find the foot', g: R => { const pn = K.lets(R, 1)[0]; let m, F, P0, b, t;
      do { m = R.pick(SLP); b = R.int(-5, 5); const j = R.int(-3, 3); F = [m[1] * j, m[0] * j + b]; t = nz(R, -2, 2); P0 = vadd(F, vmul([-m[0], m[1]], t)); } while (!inR([F, P0], 9));
      const s = m[0] * m[0] + m[1] * m[1], dist = E.surdStr(0, Math.abs(t), s, 1), pm = recipNeg(m), [A, B, Cc] = [-m[0], m[1], m[1] * b], g = A < 0 ? -1 : 1;
      const line = R.bool() ? si(m, b) : std(g * A, g * B, g * Cc);
      const vis = plane({ pts: { [pn]: P0 }, extra: [F], fns: [{ f: x => m[0] / m[1] * x + b, color: C.blue }], label: 'a point and a line' });
      return E.num(`Find the foot of the perpendicular from ${pn}${pp(P0)} to the line ${M(line)}, and the distance from ${pn} to the line. Give the distance exactly.`,
        [{ label: 'foot', point: [String(F[0]), String(F[1])] }, { label: 'distance =', exact: dist, form: 'simplest' }],
        `The perpendicular through ${pn} has slope ${mS(pm)}: ${M(ps(pm, P0[0], P0[1]))}. Solving it with the line gives the foot ${pp(F)}, and ${pn} to the foot is √(${Math.abs(P0[0] - F[0])}² + ${Math.abs(P0[1] - F[1])}²) = ${E.pt(dist)}.`, { visual: vis }); } },
    c: { t: 'the formula', g: R => { const pn = K.lets(R, 1)[0]; let a, b, c, P0, N, L;
      do { if (R.bool(0.3)) { a = nz(R, -5, 5); b = -1; } else { [a, b] = R.pick(AB); a *= R.pick([1, -1]); b *= R.pick([1, -1]); } c = R.int(-9, 9); P0 = [R.int(-7, 7), R.int(-7, 7)]; N = a * P0[0] + b * P0[1] + c; } while (!N);
      L = lineForm(R, a, b, c); const s = a * a + b * b, ans = distEx(N, s);
      return E.num(`Find the distance from ${pn}${pp(P0)} to the line ${M(L.txt)}. Give an exact answer.`, [{ label: 'distance =', exact: ans, form: 'simplest' }],
        `${L.txt === zf(a, b, c) ? 'With' : `Write it as ${M(zf(a, b, c))}:`} a = ${a}, b = ${b}, c = ${c}. d = |${mn(a)} × ${par(P0[0])} + ${par(b)} × ${par(P0[1])} + ${par(c)}| ÷ √(${par(a)}² + ${par(b)}²) = ${Math.abs(N)} ÷ √${s} = ${E.pt(ans)}.`); } },
    d: { t: 'distance between parallel lines', g: R => { let a, b, c1, c2, si_ = R.bool(0.3);
      if (si_) { a = nz(R, -4, 4); b = -1; } else { [a, b] = R.pick(AB); a *= R.pick([1, -1]); b *= R.pick([1, -1]); if (a < 0) { a = -a; b = -b; } }
      do { c1 = R.int(-9, 9); c2 = R.int(-9, 9); } while (c1 === c2);
      const s = a * a + b * b, ans = distEx(c1 - c2, s);
      if (si_) return E.num(`Find the distance between the parallel lines ${M(si(a, c1))} and ${M(si(a, c2))}. Give an exact answer.`, [{ label: 'distance =', exact: ans, form: 'simplest' }],
        `Write them as ${M(zf(a, -1, c1))} and ${M(zf(a, -1, c2))} (so b = −1, not 1). d = |${mn(c1)} − ${par(c2)}| ÷ √(${par(a)}² + (−1)²) = ${Math.abs(c1 - c2)} ÷ √${s} = ${E.pt(ans)}.`);
      const k = R.pick([1, 1, 2, 3]), e1 = std(a, b, -c1), e2 = k === 1 ? zf(a, b, c2) : zf(k * a, k * b, k * c2);
      return E.num(`Find the distance between the parallel lines ${M(e1)} and ${M(e2)}. Give an exact answer.`, [{ label: 'distance =', exact: ans, form: 'simplest' }],
        `Match the x- and y-coefficients first: ${M(zf(a, b, c1))} and ${M(zf(a, b, c2))}${k > 1 ? ` (divide the second by ${k})` : ''}. d = |${mn(c1)} − ${par(c2)}| ÷ √(${par(a)}² + ${par(b)}²) = ${Math.abs(c1 - c2)} ÷ √${s} = ${E.pt(ans)}.`); } },
    e: { t: 'run it backwards: find k', g: R => { const pn = K.lets(R, 1)[0], T3 = [[3, 4, 5], [4, 3, 5], [5, 12, 13], [12, 5, 13], [6, 8, 10], [8, 6, 10]];
      let [a, b, s] = R.pick(T3); a *= R.pick([1, -1]); b *= R.pick([1, -1]); let d = R.int(1, 4);
      if (R.bool()) { const P0 = [R.int(-6, 6), R.int(-6, 6)], N0 = a * P0[0] + b * P0[1], k1 = -N0 + s * d, k2 = -N0 - s * d;
        return E.num(`The distance from ${pn}${pp(P0)} to the line ${M(`${tsum([tm(a, 'x'), tm(b, 'y')])}+k=0`)} is ${d}. Find all possible values of k.`, [{ label: 'k =', set: [String(k1), String(k2)] }],
          `${M(`|${N0}+k|/sqrt(${a * a}+${b * b})=${d}`.replace('+-', '-'))}, and √${s * s} = ${s}, so ${M(`|${N0}+k|=${s * d}`)}: k = ${k1} or ${k2}.`); }
      while ((2 * s * d) % a) { [a, b, s] = R.pick(T3); a *= R.pick([1, -1]); b *= R.pick([1, -1]); d = R.int(1, 4); }   // both k must be whole: a | 2sd
      let c, y0, k1, k2; do { c = R.int(-12, 12); y0 = R.int(-6, 6); k1 = (s * d - b * y0 - c) / a; k2 = (-s * d - b * y0 - c) / a; } while (!Number.isInteger(k1) || !Number.isInteger(k2) || Math.abs(k1) > 15 || Math.abs(k2) > 15);
      const ex = tsum([tm(a, 'k'), tm(b * y0 + c)]);
      return E.num(`The point ${pn}${P('k', y0)} is ${d} units from the line ${M(zf(a, b, c))}. Find all possible values of k.`, [{ label: 'k =', set: [f0(k1), f0(k2)] }],
        `${M(`|${ex}|/sqrt(${a * a}+${b * b})=${d}`)}, and √${s * s} = ${s}, so ${M(`${ex}=${s * d}`)} or ${M(`${ex}=${-s * d}`)}: k = ${f0(Math.min(k1, k2))} or ${f0(Math.max(k1, k2))}.`); } },
    f: { t: 'a square or a circle between parallel lines', g: R => {
      if (R.bool()) { let a, b, c1, c2, txt;
        if (R.bool()) { const m = R.pick([1, -1, 2, -2, 3, -3, [1, 2], [-1, 2], [3, 2], [-3, 2]].map(RV)); a = -m[0]; b = m[1]; do { c1 = R.int(-8, 8); c2 = R.int(-8, 8); } while (c1 === c2);
          txt = [si(m, c1), si(m, c2)]; c1 *= m[1]; c2 *= m[1]; }
        else { [a, b] = R.pick(AB); b *= R.pick([1, -1]); do { c1 = R.int(-12, 12); c2 = R.int(-12, 12); } while (c1 === c2); txt = [std(a, b, c1), std(a, b, c2)]; }
        const s = a * a + b * b, ar = fr((c1 - c2) ** 2, s);
        return E.num(`A square has two of its sides on the lines ${M(txt[0])} and ${M(txt[1])}. Find its area.`, [{ label: 'area =', ...sf(ar) }],
          `The side is the distance between the lines, ${M(`|${c1}-${par(c2)}|/sqrt(${s})`)}. Squaring removes the root: area = ${(c1 - c2) ** 2}/${s}${ar[1] === s ? '' : ' = ' + fs(ar)}.`); }
      const T3 = [[3, 4, 5], [4, 3, 5], [5, 12, 13], [12, 5, 13]]; let [a, b, s] = R.pick(T3); b *= R.pick([1, -1]);
      const ax = R.int(0, 2), t = nz(R, -4, 4), Cc = ax === 0 ? [0, t] : ax === 1 ? [t, 0] : [t, t]; if (ax === 2 && a + b === 0) b = -b;
      const r = R.int(1, 4), N = a * Cc[0] + b * Cc[1], c1 = N + s * r, c2 = N - s * r, where = ['y-axis', 'x-axis', 'line y = x'][ax];
      return E.num(`A circle touches both lines ${M(std(a, b, c1))} and ${M(std(a, b, c2))}, and its center lies on the ${where}. Find its center and radius.`, [{ label: 'center', point: [String(Cc[0]), String(Cc[1])] }, { label: 'radius =', ans: r }],
        `The center is halfway between the lines, on ${M(std(a, b, N))}; on the ${where} that gives ${pp(Cc)}. The radius is half the gap: |${c1} − ${par(c2)}| ÷ (2 × √${s * s}) = ${2 * s * r} ÷ ${2 * s} = ${r}.`); } },
  });

  /* ================= V.11.08 Classify by coordinates ================= */
  const pickEq = R => { for (;;) { const n = R.pick(LENK), vs = LEN[n]; const [u, v] = R.sample(vs, 2); if (vcr(u, v) && vdot(u, v)) return [u, v]; } };
  const sqList = (ns, Q) => Q.map((p, i) => `${ns[i]}${ns[(i + 1) % Q.length]}² = ${d2(p, Q[(i + 1) % Q.length])}`).join(', ');
  const pgOf = (A, u, v) => [A, vadd(A, u), vadd(vadd(A, u), v), vadd(A, v)];
  const R_ = {
    slope: 'slope formula', mid: 'midpoint formula', dist: 'distance formula', given: 'Given',
    par: ['lines with equal slopes are parallel', 'lines whose slopes multiply to −1 are parallel', 'segments of equal length are parallel', 'midpoint formula'],
    pgS: ['both pairs of opposite sides parallel make a parallelogram', 'one pair of parallel sides makes a parallelogram', 'perpendicular diagonals make a parallelogram', 'a right angle makes a parallelogram'],
    pgD: ['diagonals that bisect each other make a parallelogram', 'congruent diagonals make a parallelogram', 'perpendicular diagonals make a parallelogram', 'one pair of parallel sides makes a parallelogram'],
    perp: ['lines whose slopes multiply to −1 are perpendicular', 'lines with equal slopes are perpendicular', 'lines with opposite slopes are perpendicular', 'segments of equal length are perpendicular'],
    rect: ['a parallelogram with a right angle is a rectangle', 'a parallelogram with two congruent consecutive sides is a rectangle', 'a parallelogram with perpendicular diagonals is a rectangle', 'a quadrilateral with one right angle is a rectangle'],
    rhom: ['a parallelogram with two congruent consecutive sides is a rhombus', 'a parallelogram with a right angle is a rhombus', 'a parallelogram with congruent diagonals is a rhombus', 'a quadrilateral with two congruent sides is a rhombus'],
    rectD: ['a parallelogram with congruent diagonals is a rectangle', 'a parallelogram with perpendicular diagonals is a rectangle', 'a parallelogram with two congruent consecutive sides is a rectangle', 'diagonals that bisect each other make a rectangle'],
    sq: ['a rectangle with perpendicular diagonals is a square', 'a rectangle with congruent diagonals is a square', 'a rhombus with perpendicular diagonals is a square', 'a parallelogram with perpendicular diagonals is a square'],
  };
  S('V.11.08', 'Classify by coordinates', {
    a: { t: 'triangle types', g: R => { const ns = K.trio(R), kind = R.int(0, 3); let T;
      const ok = T => inR(T, 8) && Math.abs(tw2(T)) >= 6;
      do { const A = [R.int(-5, 5), R.int(-5, 5)], u = [nz(R, -4, 4), R.int(-4, 4)];
        if (kind === 0) T = [A, vadd(A, u), vadd(A, rot(u))];
        else if (kind === 1) { const [p, q] = pickEq(R); T = [A, vadd(A, p), vadd(A, q)]; }
        else if (kind === 2) T = [A, vadd(A, u), vadd(A, vmul(rot(u), R.pick([2, -2, 3])))];
        else T = [A, vadd(A, [R.int(-6, 6), R.int(-6, 6)]), vadd(A, [R.int(-6, 6), R.int(-6, 6)])];
        if (T && kind === 2 && R.bool()) T = [T[1], T[0], T[2]];
        if (T) { const r = R.int(0, 2); T = [T[r], T[(r + 1) % 3], T[(r + 2) % 3]]; } }
      while (!ok(T) || (() => { const s = [d2(T[0], T[1]), d2(T[1], T[2]), d2(T[2], T[0])], iso = new Set(s).size < 3, rt_ = [0, 1, 2].some(i => vdot(vsub(T[(i + 1) % 3], T[i]), vsub(T[(i + 2) % 3], T[i])) === 0); return (iso ? 0 : 2) + (rt_ ? 0 : 1) !== kind; })());
      const s = [d2(T[0], T[1]), d2(T[1], T[2]), d2(T[2], T[0])], ri = [0, 1, 2].find(i => vdot(vsub(T[(i + 1) % 3], T[i]), vsub(T[(i + 2) % 3], T[i])) === 0);
      const sides = [[0, 1], [1, 2], [2, 0]], hyp = ri === undefined ? -1 : sides.findIndex(([i, j]) => i !== ri && j !== ri), legs = sides.map((x, k) => k).filter(k => k !== hyp);
      const iso = new Set(s).size < 3;
      return E.choiceFixed(`Classify triangle ${ns.join('')} with ${list(ns, T)}.`, ['isosceles and right', 'isosceles, not right', 'scalene and right', 'scalene, not right'], kind,
        `${sqList(ns, T)}. ${iso ? 'Two are equal, so it is isosceles.' : 'All three differ, so it is scalene.'} ${ri !== undefined ? `${s[legs[0]]} + ${s[legs[1]]} = ${s[hyp]}, so by the converse of Pythagoras ∠${ns[ri]} = 90°.` : 'No two squares add to the third, so there is no right angle.'}`); } },
    b: { t: 'parallelogram test', g: R => { const N = R.pick(QN).split(''), yes = R.bool(); let Q;
      if (R.bool(0.35)) { let Q; do Q = yes ? pgram(R) : fatTrap(R); while (Math.abs(tw2(Q)) < 16 || vdot(vsub(Q[1], Q[0]), vsub(Q[3], Q[0])) === 0); const [A, B, Cc, D] = Q, AB = N[0] + N[1], DC = N[3] + N[2], AD = N[0] + N[3], BC = N[1] + N[2], nm = N.join(''), m1 = mS(slopeOf(A, B));
        const opts = [`${nm} is a parallelogram, because both pairs of opposite sides are parallel`, `${nm} is not a parallelogram, because only one pair of opposite sides is parallel`,
          `${nm} is a parallelogram, because one pair of opposite sides is parallel`, `${nm} is a rectangle, because its opposite sides have equal slopes`];
        return E.choice(R, `Quadrilateral ${nm} has ${list(N, Q)}. Its slopes are: ${AB} and ${DC}, ${m1}; ${AD}, ${mS(slopeOf(A, D))}; ${BC}, ${mS(slopeOf(B, Cc))}. Which conclusion follows?`, opts[yes ? 0 : 1], [opts[yes ? 1 : 0], opts[2], opts[3]],
          yes ? `${AB} ∥ ${DC} and ${AD} ∥ ${BC} (equal slopes), so both pairs of opposite sides are parallel: a parallelogram. Equal slopes say nothing about right angles, so "rectangle" does not follow.`
            : `${AB} ∥ ${DC}, but ${AD} and ${BC} have different slopes, so they are not parallel. With only one pair of parallel sides it is not a parallelogram.`, { visual: polyFig(N, Q, { label: 'a quadrilateral' }) }); }
      do { Q = pgram(R); if (!yes) { const i = R.int(0, 3); Q[i] = vadd(Q[i], R.pick([[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1]])); } } while (!inR(Q, 8) || !convex(Q) || (!yes && Q[0][0] + Q[2][0] === Q[1][0] + Q[3][0] && Q[0][1] + Q[2][1] === Q[1][1] + Q[3][1]));
      const m1 = [(Q[0][0] + Q[2][0]) / 2, (Q[0][1] + Q[2][1]) / 2], m2 = [(Q[1][0] + Q[3][0]) / 2, (Q[1][1] + Q[3][1]) / 2];
      return E.choiceFixed(`Is ${N.join('')} with ${list(N, Q)} a parallelogram?`, ['Yes', 'No'], yes ? 0 : 1,
        `Midpoint of ${N[0]}${N[2]} = ${P(f0(m1[0]), f0(m1[1]))}, midpoint of ${N[1]}${N[3]} = ${P(f0(m2[0]), f0(m2[1]))}. ${yes ? 'The diagonals bisect each other, so it is a parallelogram.' : 'Different midpoints: the diagonals do not bisect each other, so it is not a parallelogram.'}`, { visual: polyFig(N, Q, { label: 'a quadrilateral' }) }); } },
    c: { t: 'rectangle, rhombus, square tests', g: R => { const N = R.pick(QN).split(''), kind = R.int(0, 3); let Q, u, v;
      do { const A = [R.int(-5, 5), R.int(-5, 5)]; u = [nz(R, -4, 4), nz(R, -4, 4)];
        if (kind === 0) v = vmul(rot(u), R.pick([2, -2]));
        else if (kind === 1) [u, v] = pickEq(R);
        else if (kind === 2) v = vmul(rot(u), R.pick([1, -1]));
        else v = [nz(R, -5, 5), nz(R, -5, 5)];
        Q = pgOf(A, u, v); }
      while (!inR(Q, 8) || !vcr(u, v) || !u[0] || !u[1] || !v[0] || !v[1] || (kind === 3 && (vdot(u, v) === 0 || vdot(u, u) === vdot(v, v))));
      const opts = ['rectangle, not a square', 'rhombus, not a square', 'square', 'neither: just a parallelogram'];
      const eqS = vdot(u, u) === vdot(v, v), rtA = vdot(u, v) === 0, mu = slopeOf([0, 0], u), mv = slopeOf([0, 0], v);
      return E.choiceFixed(`${N.join('')} is a parallelogram with ${list(N, Q)}. What is the most specific name for it?`, opts, kind,
        `${N[0]}${N[1]}² = ${vdot(u, u)} and ${N[0]}${N[3]}² = ${vdot(v, v)}: ${eqS ? 'equal' : 'not equal'}. Slopes ${mS(mu)} and ${mS(mv)} multiply to ${mS(rmul(mu, mv))}: ${rtA ? 'a right angle' : 'no right angle'}. ${kind === 1 ? 'Equal sides without a right angle make a rhombus, not a square.' : kind === 2 ? 'Equal sides and a right angle: a square.' : kind === 0 ? 'A right angle without equal sides: a rectangle.' : 'Neither test passes.'}`, { visual: polyFig(N, Q, { label: 'a parallelogram' }) }); } },
    d: { t: 'write the argument', g: R => { const N = R.pick(QN).split(''), [A_, B_, C_, D_] = N, kind = R.int(0, 3); let Q, u, v;
      do { const A = [R.int(-5, 5), R.int(-5, 5)]; u = [nz(R, -4, 4), nz(R, -4, 4)];
        if (kind === 0) v = [nz(R, -4, 4), nz(R, -4, 4)]; else if (kind === 1) [u, v] = pickEq(R); else if (kind === 2) v = vmul(rot(u), R.pick([2, -2])); else v = vmul(rot(u), R.pick([1, -1]));
        Q = pgOf(A, u, v); }
      while (!inR(Q, 8) || !vcr(u, v) || !u[0] || !u[1] || !v[0] || !v[1] || (kind === 0 && (vdot(u, v) === 0 || vdot(u, u) === vdot(v, v))) || (kind === 3 && (u[0] === u[1] || u[0] === -u[1])));
      const g = `${list(N, Q)}`, s1 = mS(slopeOf([0, 0], u)), s2 = mS(slopeOf([0, 0], v)), mid = P(f0((Q[0][0] + Q[2][0]) / 2), f0((Q[0][1] + Q[2][1]) / 2));
      const AB = A_ + B_, DC = D_ + C_, AD = A_ + D_, BC = B_ + C_, AC = A_ + C_, BD = B_ + D_;
      let L, goal;   // [statement, reason, deps, wrong reasons]
      if (kind === 0) { goal = 'a parallelogram'; L = [[`${g}`, R_.given, []], [`Slope ${AB} = slope ${DC} = ${s1}`, R_.slope, [0]], [`Slope ${AD} = slope ${BC} = ${s2}`, R_.slope, [0]],
        [`${AB} ∥ ${DC}`, R_.par[0], [1], R_.par.slice(1)], [`${AD} ∥ ${BC}`, R_.par[0], [2], R_.par.slice(1)], [`${N.join('')} is a parallelogram`, R_.pgS[0], [], R_.pgS.slice(1)]]; }
      else if (kind === 1) { goal = 'a rhombus'; const k = vdot(u, u); L = [[`${g}`, R_.given, []], [`Midpoint of ${AC} = ${mid}`, R_.mid, [0]], [`Midpoint of ${BD} = ${mid}`, R_.mid, [0]],
        [`${N.join('')} is a parallelogram`, R_.pgD[0], [1, 2], R_.pgD.slice(1)], [`${AB} = ${AD} = ${E.pt(rt(k))}`, R_.dist, [0]], [`${N.join('')} is a rhombus`, R_.rhom[0], [], R_.rhom.slice(1)]]; }
      else if (kind === 2) { goal = 'a rectangle'; L = [[`${g}`, R_.given, []], [`Slope ${AB} = slope ${DC} = ${s1}`, R_.slope, [0]], [`Slope ${AD} = slope ${BC} = ${s2}`, R_.slope, [0]],
        [`${N.join('')} is a parallelogram`, R_.pgS[0], [1, 2], R_.pgS.slice(1)], [`${AB} ⊥ ${AD}, since ${s1} × ${s2} = −1`, R_.perp[0], [1, 2], R_.perp.slice(1)], [`${N.join('')} is a rectangle`, R_.rect[0], [], R_.rect.slice(1)]]; }
      else { goal = 'a square'; const dAC = vadd(u, v), dBD = vsub(v, u), k = vdot(dAC, dAC);
        L = [[`${g}`, R_.given, []], [`Midpoint of ${AC} = midpoint of ${BD} = ${mid}`, R_.mid, [0]], [`${N.join('')} is a parallelogram`, R_.pgD[0], [1], R_.pgD.slice(1)],
          [`${AC} = ${BD} = ${E.pt(rt(k))}`, R_.dist, [0]], [`${N.join('')} is a rectangle`, R_.rectD[0], [2, 3], R_.rectD.slice(1)],
          [`${AC} ⊥ ${BD}, since ${mS(slopeOf([0, 0], dAC))} × ${mS(slopeOf([0, 0], dBD))} = −1`, R_.perp[0], [0], R_.perp.slice(1)], [`${N.join('')} is a square`, R_.sq[0], [], R_.sq.slice(1)]]; }
      L[0][0] = `Given: ${L[0][0]}`;
      const head = `Prove that ${N.join('')} with ${g} is ${goal}.`, vis = { visual: polyFig(N, Q, { label: 'a quadrilateral' }) };
      if (R.bool(0.55)) return K.orderQ(R, `${head} Put the steps of the proof in order.`, L.map(l => `${l[0]} (${l[1]})`), L.map(l => l[2]),
        `Each step must come after the steps it uses, and the proof ends with ${N.join('')} being ${goal}.`, Object.assign({ fixed: 1 }, vis));
      const cand = L.map((l, i) => i).filter(i => L[i][3]), k = R.pick(cand);
      return E.choice(R, `${head} What is the reason for step ${k + 1}?${twoCol(L.map(l => [l[0], l[1]]), k)}`, L[k][1], L[k][3], `Step ${k + 1} holds because ${L[k][1]}.`, vis); } },
  });

  /* ================= V.11.09 Coordinate proofs of triangles ================= */
  const LS = [['a', 'b', 'c'], ['p', 'q', 'r'], ['m', 'n', 'k'], ['u', 'v', 'w'], ['h', 'j', 't']];
  const Pv = (x, y) => `(${M(x)}, ${M(y)})`;
  const svgLab = s => s.replace(/-/g, '−');
  S('V.11.09', 'Coordinate proofs of triangles', {
    a: { t: 'place with variables', g: R => { const [a, b, c] = R.pick(LS), ns = K.trio(R), kind = R.int(0, 4);
      const tri = (P1, P2, P3) => `${ns[0]}${Pv(...P1)}, ${ns[1]}${Pv(...P2)}, ${ns[2]}${Pv(...P3)}`;
      const O = ['0', '0'], X = (s) => [s, '0'], Yp = s => ['0', s];
      const SH = [
        ['any triangle', tri(O, X(a), [b, c]), [tri(O, X(a), Yp(b)), tri(O, ['4', '0'], ['1', '3']), tri(['-' + a, '0'], X(a), Yp(b))], `Two free letters for ${ns[2]} let it sit anywhere. The other choices force a right angle, an isosceles shape, or one particular triangle.`],
        ['right triangle', tri(O, X(a), Yp(b)), [tri(O, X(a), Yp(a)), tri(O, ['6', '0'], ['0', '8']), tri(O, X(a), [b, c])], `The legs lie on the axes with independent lengths ${a} and ${b}. Equal letters force an isosceles triangle, and (${b}, ${c}) need not make a right angle.`],
        ['isosceles triangle', tri(['-' + a, '0'], X(a), Yp(b)), [tri(O, X(a), [b, c]), tri(['-3', '0'], ['3', '0'], ['0', '5']), tri(['-' + a, '0'], X(a), Yp(a))], `A point on the y-axis is the same distance from (−${a}, 0) and (${a}, 0), for any height ${b}. Height ${a} would force a right angle.`],
        ['right isosceles triangle', tri(O, X(a), Yp(a)), [tri(O, X(a), Yp(b)), tri(O, ['5', '0'], ['0', '5']), tri(['-' + a, '0'], X(a), Yp(b))], `Both legs lie on the axes with the same letter ${a}, so they are equal for every size. Different letters lose the equal legs.`],
        ['right triangle with the right angle at ' + ns[0], tri(O, X(a), Yp(b)), [tri(O, X(a), [a, b]), tri(O, X(a), [b, c]), tri(O, ['3', '0'], ['0', '4'])], `The legs from ${ns[0]} run along the axes, so ∠${ns[0]} = 90° for any ${a} and ${b}. Putting ${ns[2]} at (${a}, ${b}) moves the right angle to ${ns[1]}.`],
      ];
      const [shape, right, wrong, why] = SH[kind];
      return E.choice(R, `To prove a fact about ${shape === 'any triangle' ? 'any triangle' : 'every ' + shape} ${ns.join('')}, which placement should you use?`, right, wrong, `${why} Numbers prove the fact for one triangle only; a general proof needs letters.`); } },
    b: { t: 'midsegment proof', g: R => { const [a, b, c] = R.pick(LS), ns = K.trio(R), [A, B, Cn] = ns, lt = K.lets(R, 8).filter(l => !ns.includes(l)), [Mn, Nn] = lt, mode = R.int(0, 2);
      const given = `${A}${Pv('0', '0')}, ${B}${Pv('2' + a, '0')}, ${Cn}${Pv('2' + b, '2' + c)}`, na = R.int(2, 3), nb = R.pick([0.5, 1, 1.5]), nc = R.pick([1.5, 2, 2.5]);
      const vis = plane({ pts: { [A]: [0, 0], [B]: [2 * na, 0], [Cn]: [2 * nb, 2 * nc], [Mn]: [nb, nc], [Nn]: [na + nb, nc] }, segs: [[A, B], [B, Cn], [Cn, A], [Mn, Nn, { color: C.red }]], nums: false, margin: 2.6,
        lab: { [A]: `${A}(0, 0)`, [B]: `${B}(2${a}, 0)`, [Cn]: `${Cn}(2${b}, 2${c})` }, label: 'a triangle with a midsegment' });
      const head = `Triangle ${ns.join('')} has ${given}. ${Mn} is the midpoint of ${A}${Cn} and ${Nn} is the midpoint of ${B}${Cn}.`;
      if (mode === 0) { const which = R.bool(); return E.num(`${head} Find the coordinates of ${which ? Nn : Mn}.`, which ? [{ label: 'x =', expr: `${a}+${b}` }, { label: 'y =', expr: c }] : [{ label: 'x =', expr: b }, { label: 'y =', expr: c }],
        `Average the endpoints: ${which ? `${Nn} = ((2${a} + 2${b}) ÷ 2, (0 + 2${c}) ÷ 2) = (${a} + ${b}, ${c})` : `${Mn} = ((0 + 2${b}) ÷ 2, (0 + 2${c}) ÷ 2) = (${b}, ${c})`}. Using 2${a}, 2${b}, 2${c} keeps fractions away.`, { visual: vis }); }
      if (mode === 1) return E.num(`${head} Find the slope of ${Mn}${Nn} and its length.`, [{ label: 'slope =', ans: 0 }, { label: 'length =', expr: a }],
        `${Mn} = (${b}, ${c}) and ${Nn} = (${a} + ${b}, ${c}) have the same y, so the slope is 0, like ${A}${B}: ${Mn}${Nn} ∥ ${A}${B}. Its length is (${a} + ${b}) − ${b} = ${a}, half of ${A}${B} = 2${a}.`, { visual: vis });
      const L = [[`Given: ${given}; ${Mn}, ${Nn} are the midpoints of ${A}${Cn}, ${B}${Cn}`, []], [`${Mn} = ${Pv(b, c)} (midpoint formula)`, [0]], [`${Nn} = ${Pv(a + '+' + b, c)} (midpoint formula)`, [0]],
        [`Slope ${Mn}${Nn} = 0 = slope ${A}${B}, so ${Mn}${Nn} ∥ ${A}${B}`, [1, 2]], [`${Mn}${Nn} = ${M(a)} and ${A}${B} = ${M('2' + a)} (distance formula)`, [1, 2]], [`${Mn}${Nn} ∥ ${A}${B} and ${Mn}${Nn} = ½ ${A}${B}`, []]];
      return K.orderQ(R, `Prove the midsegment theorem for triangle ${ns.join('')}: put the steps in order.`, L.map(l => l[0]), L.map(l => l[1]), 'Find both midpoints first; slope and length both use them, and the conclusion comes last.', { fixed: 1, visual: vis }); } },
    c: { t: 'isosceles proof', g: R => { const [a, b] = R.pick(LS), ns = K.trio(R), [A, B, Cn] = ns, mode = R.int(0, 3);
      const na = R.int(2, 4), nbv = R.int(3, 5);
      if (mode === 0) { const vis = plane({ pts: { [A]: [-na, 0], [B]: [na, 0], [Cn]: [0, nbv] }, segs: [[A, B], [B, Cn], [Cn, A]], nums: false, margin: 2.6, dir: { [A]: [-0.4, -1], [B]: [0.4, -1] }, lab: { [A]: svgLab(`${A}(-${a}, 0)`), [B]: `${B}(${a}, 0)`, [Cn]: `${Cn}(0, ${b})` }, label: 'an isosceles triangle' });
        return E.num(`Triangle ${ns.join('')} has ${A}${Pv('-' + a, '0')}, ${B}${Pv(a, '0')} and ${Cn}${Pv('0', b)}. Find ${Cn}${A} and ${Cn}${B}.`, [{ label: `${Cn}${A} =`, expr: `sqrt(${a}^2+${b}^2)` }, { label: `${Cn}${B} =`, expr: `sqrt(${a}^2+${b}^2)` }],
          `${Cn}${A} = √((0 + ${a})² + (${b} − 0)²) = √(${a}² + ${b}²) and ${Cn}${B} = √((0 − ${a})² + (${b} − 0)²) = √(${a}² + ${b}²). They are equal for every ${a} and ${b}, so the triangle is isosceles.`, { visual: vis }); }
      const lt = K.lets(R, 8).filter(l => !ns.includes(l)), [Mn, Nn] = lt;
      const given = `${A}${Pv('-2' + a, '0')}, ${B}${Pv('2' + a, '0')}, ${Cn}${Pv('0', '2' + b)}`, len = `sqrt(9${a}^2+${b}^2)`;
      const vis = plane({ pts: { [A]: [-2 * na, 0], [B]: [2 * na, 0], [Cn]: [0, 2 * nbv], [Mn]: [-na, nbv], [Nn]: [na, nbv] }, segs: [[A, B], [B, Cn], [Cn, A], [B, Mn, { color: C.red }], [A, Nn, { color: C.red }]], nums: false, margin: 3.2, dir: { [A]: [-0.4, -1], [B]: [0.4, -1] },
        lab: { [A]: svgLab(`${A}(-2${a}, 0)`), [B]: `${B}(2${a}, 0)`, [Cn]: `${Cn}(0, 2${b})` }, label: 'an isosceles triangle with two medians' });
      const head = `Isosceles triangle ${ns.join('')} has ${given}. ${Mn} is the midpoint of ${Cn}${A} and ${Nn} is the midpoint of ${Cn}${B}.`;
      if (mode === 1) return E.num(`${head} Find the length of the median ${B}${Mn}.`, [{ label: `${B}${Mn} =`, expr: len }],
        `${Mn} = (−${a}, ${b}), so ${B}${Mn} = √((2${a} + ${a})² + (0 − ${b})²) = √(9${a}² + ${b}²). The median ${A}${Nn} works out the same, so the medians to the legs are equal.`, { visual: vis });
      if (mode === 2) return E.choice(R, `${head} Which statement is true for every such triangle?`, `${B}${Mn} = ${A}${Nn}`, [`${B}${Mn} ⊥ ${A}${Nn}`, `${B}${Mn} = ${A}${B}`, `${B}${Mn} ∥ ${A}${Cn}`],
        `${Mn} = (−${a}, ${b}) and ${Nn} = (${a}, ${b}), so ${B}${Mn} = ${A}${Nn} = √(9${a}² + ${b}²) for all ${a} and ${b}. The other statements hold only for special values, if ever.`, { visual: vis });
      const L = [[`Given: ${given}`, []], [`${Mn} = ${Pv('-' + a, b)} (midpoint of ${Cn}${A})`, [0]], [`${Nn} = ${Pv(a, b)} (midpoint of ${Cn}${B})`, [0]],
        [`${B}${Mn} = ${M(len)} (distance formula)`, [1]], [`${A}${Nn} = ${M(len)} (distance formula)`, [2]], [`${B}${Mn} = ${A}${Nn}: the medians to the legs are congruent`, []]];
      return K.orderQ(R, `Prove that the medians to the legs of an isosceles triangle are congruent: put the steps in order.`, L.map(l => l[0]), L.map(l => l[1]), 'Each length needs its midpoint first; the two lengths are then compared.', { fixed: 1, visual: vis }); } },
    d: { t: 'centroid proof', g: R => { const [a, b, c] = R.pick(LS), ns = K.trio(R), [A, B, Cn] = ns, mode = R.int(0, 2);
      const given = `${A}${Pv('0', '0')}, ${B}${Pv('6' + a, '0')}, ${Cn}${Pv('6' + b, '6' + c)}`, gx = `2${a}+2${b}`, gy = `2${c}`;
      const na = R.int(1, 2) * 0.5 + 0.5, nb = R.pick([0.25, 0.5, 0.75]), nc = R.pick([0.5, 0.75]), sc = 6;
      const Gp = [(sc * na + sc * nb) / 3, sc * nc / 3];
      const head = `Triangle ${ns.join('')} has ${given}.`;
      if (mode === 0) { const vis = plane({ pts: { [A]: [0, 0], [B]: [sc * na, 0], [Cn]: [sc * nb, sc * nc], G: Gp }, segs: [[A, B], [B, Cn], [Cn, A]], nums: false, margin: 2.6, lab: { [A]: `${A}(0, 0)`, [B]: `${B}(6${a}, 0)`, [Cn]: `${Cn}(6${b}, 6${c})` }, label: 'a triangle and its centroid' });
        return E.num(`${head} Find its centroid G, the average of the three vertices.`, [{ label: 'x =', expr: gx }, { label: 'y =', expr: gy }],
          `G = ((0 + 6${a} + 6${b}) ÷ 3, (0 + 0 + 6${c}) ÷ 3) = (2${a} + 2${b}, 2${c}). The 6s keep every coordinate free of fractions.`, { visual: vis }); }
      const meds = [[Cn, `${A}${B}`, `(3${a}, 0)`], [A, `${B}${Cn}`, `(3${a} + 3${b}, 3${c})`], [B, `${A}${Cn}`, `(3${b}, 3${c})`]], md = R.pick(meds);
      const vis = plane({ pts: { [A]: [0, 0], [B]: [sc * na, 0], [Cn]: [sc * nb, sc * nc] }, segs: [[A, B], [B, Cn], [Cn, A]], nums: false, margin: 2.6, lab: { [A]: `${A}(0, 0)`, [B]: `${B}(6${a}, 0)`, [Cn]: `${Cn}(6${b}, 6${c})` }, label: 'a triangle' });
      if (mode === 1) return E.num(`${head} The midpoint of ${md[1]} is ${md[2]}. Find the point ⅔ of the way from ${md[0]} to that midpoint.`, [{ label: 'x =', expr: gx }, { label: 'y =', expr: gy }],
        `Start at ${md[0]} and add ⅔ of the move to the midpoint: the result is (2${a} + 2${b}, 2${c}). That is the centroid, so the centroid lies ⅔ of the way along this median.`, { visual: vis });
      const L = [[`Given: ${given}`, []], [`G = ${Pv(gx, gy)} (average of the vertices)`, [0]], [`The midpoint of ${A}${B} is ${Pv('3' + a, '0')}`, [0]], [`⅔ of the way from ${Cn} to ${Pv('3' + a, '0')} is ${Pv(gx, gy)}`, [2]],
        [`The midpoint of ${B}${Cn} is ${Pv(`3${a}+3${b}`, '3' + c)}`, [0]], [`⅔ of the way from ${A} to ${Pv(`3${a}+3${b}`, '3' + c)} is ${Pv(gx, gy)}`, [4]], [`G lies ⅔ of the way along both medians`, []]];
      return K.orderQ(R, `Prove that the centroid G of triangle ${ns.join('')} lies ⅔ of the way along its medians: put the steps in order.`, L.map(l => l[0]), L.map(l => l[1]), 'Each ⅔-point needs its midpoint first; the conclusion compares both with G.', { fixed: 1, visual: vis }); } },
  });
})(typeof window !== 'undefined' ? window : globalThis);
