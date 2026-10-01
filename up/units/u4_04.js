/* Era IV · Unit IV.4 Systems (IV.4.01–IV.4.15) */
(function (G) {
  const E = G.E4, V = E.V, C = E.C, M = s => E.mx(s);
  const S = (id, name, steps) => E.skill({ id, name, steps });
  const nz = (R, lo, hi) => { let v; do v = R.int(lo, hi); while (v === 0); return v; };
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
  const lcm = (a, b) => Math.abs(a * b) / gcd(a, b);
  const pt = (x, y) => `(${x}, ${y})`;
  const fr = (n, d) => E.fracStr(n, d);
  const r2 = v => Math.round(v * 100) / 100;
  // [[coef, body], …] → '2x-3y+1'  (a body of '' is a constant)
  const joinT = ts => { let s = ''; for (const [k, b] of ts) { if (!k) continue; const a = Math.abs(k); s += (k < 0 ? '-' : s ? '+' : '') + (a === 1 && b ? '' : a) + b; } return s || '0'; };
  const L2 = (a, b, c) => `${joinT([[a, 'x'], [b, 'y']])}=${c}`;
  const L3 = (a, b, c, d) => `${joinT([[a, 'x'], [b, 'y'], [c, 'z']])}=${d}`;
  const Y = (m, k) => 'y=' + E.poly([m, k]);
  const sys = (...es) => es.map(e => M(e)).join(' and ');
  // "2(3) − 3(−1) = 9"
  const evT = (cs, vs) => { let s = ''; cs.forEach((c, j) => { if (!c) return; const a = Math.abs(c), body = (a === 1 ? '' : a) + '(' + vs[j] + ')'; s += s ? (c < 0 ? ' − ' : ' + ') + body : (c < 0 ? '−' : '') + body; }); return (s || '0') + ' = ' + cs.reduce((t, c, j) => t + c * vs[j], 0); };
  // "2(3) − 1 = 5"
  const yAt = (m, k, p) => { if (!m) return String(k); const a = Math.abs(m); let s = `${m < 0 ? '−' : ''}${a === 1 ? '' : a}(${p})`; if (k) s += ` ${k < 0 ? '−' : '+'} ${Math.abs(k)}`; return `${s} = ${m * p + k}`; };
  // equation objects that can check a point and explain it
  const EqS = (a, b, c) => ({ a, b, c, s: L2(a, b, c), on: (p, q) => a * p + b * q === c, txt: (p, q) => `${evT([a, b], [p, q])}${a * p + b * q === c ? ' ✓' : `, not ${c} ✗`}` });
  const EqY = (m, k) => ({ a: -m, b: 1, c: k, s: Y(m, k), on: (p, q) => m * p + k === q, txt: (p, q) => `y = ${yAt(m, k, p)}${m * p + k === q ? ' ✓' : `, not ${q} ✗`}` });
  // a random integer system with a unique integer solution
  const sysGen = (R, o = {}) => { const co = o.co || 5, so = o.sol || 6;
    for (;;) { const x = R.int(-so, so), y = R.int(-so, so), a1 = R.int(-co, co), b1 = R.int(-co, co), a2 = R.int(-co, co), b2 = R.int(-co, co);
      if (!a1 || !b1 || !a2 || !b2 || a1 * b2 - a2 * b1 === 0) continue;
      const s = { a1, b1, c1: a1 * x + b1 * y, a2, b2, c2: a2 * x + b2 * y, x, y }; if (!o.pred || o.pred(s)) return s; } };
  // two lines y = m x + k with an integer crossing point
  const twoLines = (R, lim = 3, K = 6) => { for (;;) { const m1 = R.int(-3, 3), m2 = R.int(-3, 3); if (m1 === m2) continue; const x = R.int(-lim, lim), y = R.int(-lim, lim), k1 = y - m1 * x, k2 = y - m2 * x;
    if (Math.abs(k1) <= K && Math.abs(k2) <= K) return { m1, k1, m2, k2, x, y }; } };
  // "3y = 6, so y = 2"  (skips the equation when the coefficient is 1)
  const solv = (k, v, rhs, val) => k === 1 ? `${v} = ${val}` : `${M(joinT([[k, v]]) + '=' + rhs)}, so ${v} = ${val}`;
  // multipliers m1, m2 that cancel coefficients p, q (p·m1 + q·m2 = 0), positive where possible
  const mults = (p, q) => { if (p === -q) return [1, 1]; if (p === q) return [1, -1]; const L = lcm(p, q), m1 = L / Math.abs(p); return [m1, -Math.sign(p) * L / q]; };
  const howTxt = (m1, m2) => m1 === 1 && m2 === 1 ? 'Add the equations' : m1 === 1 && m2 === -1 ? 'Subtract the second equation from the first' : `Multiply ${[m1 !== 1 ? `the first equation by ${m1}` : '', m2 !== 1 ? `the ${m1 !== 1 ? 'second' : 'second equation'} by ${m2}` : ''].filter(Boolean).join(' and ')}, then add`;
  // explanation for solving a 2×2 system by eliminating y
  const elimTxt = s => { const [m1, m2] = mults(s.b1, s.b2), K = s.a1 * m1 + s.a2 * m2, Rr = s.c1 * m1 + s.c2 * m2;
    return `${howTxt(m1, m2)}: ${solv(K, 'x', Rr, s.x)}. Put it into the first: ${solv(s.b1, 'y', s.c1 - s.a1 * s.x, s.y)}.`; };
  const P = v => v < 0 ? `(${v})` : String(v);

  /* ---------- pictures ---------- */
  const gLines = (fs, o = {}) => V.graph({ x: o.x || [-7, 7], y: o.y || [-7, 7], w: o.w || 300, h: o.h || 300, ticks: 1, labels: o.labels, fns: fs.map((f, j) => ({ f, color: [C.blue, C.red, C.teal][j], dash: !!(o.dash && o.dash[j]) })), points: o.points || [], label: o.label || 'lines on a grid' });
  const lf = (m, k) => x => m * x + k;
  const sf = (a, b, c) => x => (c - a * x) / b;
  const small = fs => gLines(fs, { w: 180, h: 180, labels: false, label: 'two lines' });
  const overlay = (svg, win, W, H, items) => { const [x0, x1] = win.x, [y0, y1] = win.y, X = x => 18 + (x - x0) / (x1 - x0) * (W - 36), Yp = y => H - 18 - (y - y0) / (y1 - y0) * (H - 36);
    return svg.replace(/<\/g><\/svg>$/, items.map(([x, y, s]) => V.text(r2(X(x)), r2(Yp(y)), s, { size: 18, weight: 700 })).join('') + '</g></svg>'); };

  /* ---------- inequalities ---------- */
  const FLIP = { '<': '>', '>': '<', '<=': '>=', '>=': '<=' }, TOG = { '<': '<=', '<=': '<', '>': '>=', '>=': '>' };
  const above = op => op[0] === '>', strict = op => op.length === 1;
  const iq = (m, k, op) => 'y' + op + E.poly([m, k]);
  const holds = (op, l, r) => op === '<' ? l < r : op === '<=' ? l <= r : op === '>' ? l > r : l >= r;
  const gIneq = (L, o = {}) => { const lo = x => Math.max(-99, ...L.filter(l => above(l.op)).map(l => l.m * x + l.k)), hi = x => Math.min(99, ...L.filter(l => !above(l.op)).map(l => l.m * x + l.k));
    return V.graph({ x: [-7, 7], y: [-7, 7], w: o.w || 300, h: o.h || 300, ticks: 1, labels: o.labels, shade: o.shade === false ? undefined : { f: x => Math.max(hi(x), lo(x)), g: lo, from: -7, to: 7 },
      fns: L.map((l, j) => ({ f: x => l.m * x + l.k, color: [C.blue, C.red][j], dash: strict(l.op) })), label: o.label || 'graph of inequalities' }); };

  /* ---------- word-problem contexts: two counts, a total count and a total value ---------- */
  const CTX = [
    R => { const w1 = R.int(7, 15), w2 = R.int(3, 6); return { v: ['a', 'c'], names: ['adult tickets', 'child tickets'], w: [w1, w2], money: true, story: (n, T) => `Adult tickets cost $${w1} and child tickets cost $${w2}. A group buys ${n} tickets for $${T}.`, ask: 'How many of each did they buy?', wn: ['the price of one adult ticket', 'the price of one child ticket'], tot: ['the total number of tickets', 'the total cost'], count: 'tickets', val: 'dollars', vq: ['How much did the adult tickets cost altogether?', 'How much did the child tickets cost altogether?'] }; },
    () => ({ v: ['c', 'g'], names: ['chickens', 'goats'], w: [2, 4], story: (n, T) => `A farm has only chickens and goats: ${n} heads and ${T} legs in all.`, ask: 'How many of each animal are there?', wn: ['the legs on one chicken', 'the legs on one goat'], tot: ['the number of heads', 'the number of legs'], count: 'heads', val: 'legs', vq: ['How many legs do the chickens have altogether?', 'How many legs do the goats have altogether?'] }),
    () => ({ v: ['x', 'y'], names: ['2-point baskets', '3-point baskets'], w: [2, 3], story: (n, T) => `A player made ${n} baskets, all 2-pointers or 3-pointers, for ${T} points.`, ask: 'How many of each kind did she make?', wn: ['the points for one 2-pointer', 'the points for one 3-pointer'], tot: ['the number of baskets', 'the number of points'], count: 'baskets', val: 'points', vq: ['How many points came from 2-pointers?', 'How many points came from 3-pointers?'] }),
    R => { const w1 = R.int(1, 3), w2 = R.int(4, 9); return { v: ['p', 'n'], names: ['pens', 'notebooks'], w: [w1, w2], money: true, story: (n, T) => `Pens cost $${w1} and notebooks cost $${w2}. Sam buys ${n} items for $${T}.`, ask: 'How many pens and how many notebooks did he buy?', wn: ['the price of one pen', 'the price of one notebook'], tot: ['the number of items', 'the total cost'], count: 'items', val: 'dollars', vq: ['How much did he spend on pens?', 'How much did he spend on notebooks?'] }; },
    () => ({ v: ['b', 't'], names: ['bicycles', 'tricycles'], w: [2, 3], story: (n, T) => `A rental shop has only bicycles and tricycles: ${n} cycles with ${T} wheels in all.`, ask: 'How many of each are there?', wn: ['the wheels on one bicycle', 'the wheels on one tricycle'], tot: ['the number of cycles', 'the number of wheels'], count: 'cycles', val: 'wheels', vq: ['How many wheels do the bicycles have altogether?', 'How many wheels do the tricycles have altogether?'] }),
  ];
  const ctx = R => { const c = R.pick(CTX)(R), n1 = R.int(2, 14), n2 = R.int(2, 14); return Object.assign(c, { n1, n2, n: n1 + n2, T: c.w[0] * n1 + c.w[1] * n2 }); };
  const ctxEqs = c => [`${c.v[0]}+${c.v[1]}=${c.n}`, `${joinT([[c.w[0], c.v[0]], [c.w[1], c.v[1]]])}=${c.T}`];

  /* IV.4.01 What a solution is */
  S('IV.4.01', 'What a solution is', {
    a: { t: 'check an ordered pair in both equations', g: R => { const s = sysGen(R, { co: 4, sol: 5 }), e1 = EqS(s.a1, s.b1, s.c1), e2 = EqS(s.a2, s.b2, s.c2), yes = R.bool(); let p = s.x, q = s.y;
      if (!yes) { const w = R.int(0, 2); if (w < 2) { const e = w ? e2 : e1, g = gcd(e.a, e.b), t = nz(R, -2, 2); p = s.x + t * e.b / g; q = s.y - t * e.a / g; } else { do { p = s.x + nz(R, -2, 2); q = s.y + R.int(-2, 2); } while (e1.on(p, q) || e2.on(p, q)); } }
      return E.choiceFixed(`Is ${pt(p, q)} a solution of the system ${sys(e1.s, e2.s)}?`, ['Yes', 'No'], yes ? 0 : 1, `First: ${e1.txt(p, q)}. Second: ${e2.txt(p, q)}. ${yes ? 'It works in both, so yes.' : 'A solution must work in both equations, so no.'}`); } },
    b: { t: 'intersection meaning', g: R => {
      if (R.bool()) { const s = sysGen(R, { co: 4, sol: 6 }), P = pt(s.x, s.y);
        return E.choice(R, `The lines ${sys(L2(s.a1, s.b1, s.c1), L2(s.a2, s.b2, s.c2))} cross at ${P}. What does that tell you?`, `${P} makes both equations true`, [`${P} makes only one of the equations true`, `x = ${s.x} and y = ${s.y} are two different solutions`, `The lines have slopes ${s.x} and ${s.y}`], `The crossing point lies on both lines, so ${P} is the one pair that satisfies both equations.`); }
      const L = twoLines(R, 2, 5); let Q, Rr, Sx;
      do { const d = nz(R, -3, 3); Q = [L.x + d, L.m1 * (L.x + d) + L.k1]; } while (Math.abs(Q[1]) > 6);
      do { const d = nz(R, -3, 3); Rr = [L.x + d, L.m2 * (L.x + d) + L.k2]; } while (Math.abs(Rr[1]) > 6 || (Rr[0] === Q[0] && Rr[1] === Q[1]));
      do { Sx = [R.int(-5, 5), R.int(-5, 5)]; } while ([[L.x, L.y], Q, Rr].some(p => Math.hypot(p[0] - Sx[0], p[1] - Sx[1]) < 2) || L.m1 * Sx[0] + L.k1 === Sx[1] || L.m2 * Sx[0] + L.k2 === Sx[1]);
      const roles = R.shuffle([0, 1, 2, 3]), pts = [[L.x, L.y], Q, Rr, Sx], letters = ['A', 'B', 'C', 'D'], ans = roles.indexOf(0);
      const vis = gLines([lf(L.m1, L.k1), lf(L.m2, L.k2)], { points: roles.map((r, j) => [pts[r][0], pts[r][1], letters[j]]) });
      return E.choiceFixed(`The graph shows the system ${sys(Y(L.m1, L.k1), Y(L.m2, L.k2))}. Which labeled point is a solution of the system?`, letters, ans, `Only ${letters[ans]} ${pt(L.x, L.y)} lies on both lines, so only it makes both equations true.`, { visual: vis }); } },
    c: { t: 'in context', g: R => { const c = ctx(R), [v1, v2] = c.v, [w1, w2] = c.w, a = c.n1, k = c.n2, g = gcd(w1, w2);
      const pool = [[a + w2 / g, k - w1 / g], [a - w2 / g, k + w1 / g], [k, a], [a + 1, k - 1], [a - 1, k + 1], [a + 2, k - 2], [a - 2, k + 2]]
        .filter(([p, q]) => p >= 0 && q >= 0 && !(p === a && q === k)).map(([p, q]) => pt(p, q));
      const dis = [...new Set(R.shuffle(pool))].slice(0, 3);
      return E.choice(R, `${c.story(c.n, c.T)} Let ${v1} be the number of ${c.names[0]} and ${v2} the number of ${c.names[1]}. Which (${v1}, ${v2}) fits both facts?`, pt(a, k), dis,
        `${pt(a, k)}: ${a} + ${k} = ${c.n} ${c.count}, and ${w1}(${a}) + ${w2}(${k}) = ${c.T} ${c.val}. Both are true. A pair that fits only one fact is not a solution.`); } },
    d: { t: 'estimate from a graph', g: R => { let m1, m2, k1, k2, dd, xn;
      do { m1 = R.int(-3, 3); m2 = R.int(-3, 3); k1 = R.int(-5, 5); k2 = R.int(-5, 5); dd = m1 - m2; xn = k2 - k1; } while (Math.abs(dd) < 2 || xn % dd === 0 || Math.abs(xn / dd) > 4 || Math.abs(m1 * xn / dd + k1) > 5.5);
      const X = xn / dd, Yv = m1 * X + k1, h = v => Math.round(v * 2) / 2, ex = h(X), ey = h(Yv);
      const pool = [[ey, ex], [-ex, ey], [ex, -ey], [ex + 2, ey], [ex, ey - 2], [ex - 2, ey + 1], [-ey, -ex]].filter(([p, q]) => Math.hypot(p - X, q - Yv) >= 1.2).map(([p, q]) => pt(p, q));
      return E.choice(R, 'The graph shows a system of two lines. Which is the best estimate of its solution?', pt(ex, ey), [...new Set(pool)].slice(0, 3),
        `The lines cross at about ${pt(ex, ey)}. Solving exactly gives ${pt(fr(xn, dd), fr(m1 * xn + k1 * dd, dd))}.`, { visual: gLines([lf(m1, k1), lf(m2, k2)]) }); } },
  });

  /* IV.4.02 Solve by graphing */
  S('IV.4.02', 'Solve by graphing', {
    a: { t: 'graph both lines', g: R => { const L = twoLines(R, 3, 5), right = small([lf(L.m1, L.k1), lf(L.m2, L.k2)]);
      const alts = [[-L.m1, L.k1, L.m2, L.k2], [L.m1, L.k1, L.m2, -L.k2], [L.m1, L.k1 + (L.k1 > 0 ? -3 : 3), L.m2, L.k2], [L.m1, L.k1, -L.m2, L.k2], [L.m1, -L.k1, L.m2, L.k2], [L.m1, L.k1, L.m2, L.k2 + (L.k2 > 0 ? -3 : 3)]];
      const wrong = [...new Set(alts.map(([a, b, c, d]) => small([lf(a, b), lf(c, d)])))].filter(s => s !== right);
      return E.choice(R, `Which graph shows both lines ${sys(Y(L.m1, L.k1), Y(L.m2, L.k2))}?`, right, R.sample(wrong, 3),
        `Each line starts at its y-intercept (${L.k1} and ${L.k2}) and rises by its slope (${L.m1} and ${L.m2}). They cross at ${pt(L.x, L.y)}.`); } },
    b: { t: 'read the intersection', g: R => { const L = twoLines(R, 4, 6), eqOf = (m, k) => R.bool() || !m ? EqY(m, k) : m > 0 ? EqS(m, -1, -k) : EqS(-m, 1, k), e1 = eqOf(L.m1, L.k1), e2 = eqOf(L.m2, L.k2);
      return E.num(`The graph shows ${sys(e1.s, e2.s)}. What is the solution of the system?`, [{ point: [String(L.x), String(L.y)] }], `The lines cross at ${pt(L.x, L.y)}. Check: ${e1.txt(L.x, L.y)}; ${e2.txt(L.x, L.y)}.`, { visual: gLines([lf(L.m1, L.k1), lf(L.m2, L.k2)]) }); } },
    c: { t: 'check it', g: R => { const yes = R.bool(); let m1, m2, k1, k2, p, q, xn, dd;
      if (yes) { const L = twoLines(R, 4, 6); ({ m1, m2, k1, k2 } = L); p = L.x; q = L.y; }
      else { let X, Yv; do { m1 = R.int(-3, 3); m2 = R.int(-3, 3); k1 = R.int(-5, 5); k2 = R.int(-5, 5); dd = m1 - m2; xn = k2 - k1; X = xn / dd; Yv = m1 * X + k1; }
        while (Math.abs(dd) < 3 || xn % dd === 0 || Math.abs(X - Math.round(X)) > 0.34 || Math.abs(Yv - Math.round(Yv)) > 0.4 || Math.abs(X) > 5 || Math.abs(Yv) > 5); p = Math.round(X); q = Math.round(Yv); }
      const e1 = EqY(m1, k1), e2 = EqY(m2, k2);
      return E.choiceFixed(`On the graph, ${sys(e1.s, e2.s)} seem to cross at ${pt(p, q)}. Is ${pt(p, q)} exactly the solution?`, ['Yes', 'No'], yes ? 0 : 1,
        `At x = ${p}: first line ${e1.txt(p, q)}; second line ${e2.txt(p, q)}. ${yes ? 'Both check, so it is exact.' : `It is only close. The exact solution is ${pt(fr(xn, dd), fr(m1 * xn + k1 * dd, dd))}.`}`, { visual: gLines([lf(m1, k1), lf(m2, k2)]) }); } },
    d: { t: 'limits of graphing', g: R => { let a1, b1, c1, a2, b2, c2, det, xn, yn;
      do { a1 = nz(R, -4, 4); b1 = nz(R, -4, 4); a2 = nz(R, -4, 4); b2 = nz(R, -4, 4); c1 = R.int(-9, 9); c2 = R.int(-9, 9); det = a1 * b2 - a2 * b1; xn = c1 * b2 - c2 * b1; yn = a1 * c2 - a2 * c1; }
      while (!det || Math.abs(det) > 12 || (xn % det === 0 && yn % det === 0) || (10 * xn % det === 0 && 10 * yn % det === 0) || Math.abs(xn / det) > 5 || Math.abs(yn / det) > 5);
      const r1 = v => String(Math.round(v * 10) / 10), [m1, m2] = mults(b1, b2), K = a1 * m1 + a2 * m2, Rr = c1 * m1 + c2 * m2;
      if (R.bool(0.65)) { // pick the exact point by checking candidates: only tools taught so far (graph + substitution)
        const X = fr(xn, det), Yv = fr(yn, det), both = (x, y) => Math.abs(a1 * x + b1 * y - c1) < 1e-9 && Math.abs(a2 * x + b2 * y - c2) < 1e-9, est = [Math.round(xn / det * 10) / 10, Math.round(yn / det * 10) / 10];
        const cand = [[est[0], est[1], pt(r1(xn / det), r1(yn / det))], [(xn + 1) / det, (yn * b1 - a1) / (b1 * det), pt(fr(xn + 1, det), fr(yn * b1 - a1, b1 * det))],
          [(xn - 1) / det, (yn * b2 + a2) / (b2 * det), pt(fr(xn - 1, det), fr(yn * b2 + a2, b2 * det))], [yn / det, xn / det, pt(Yv, X)], [(xn + 1) / det, (yn - 1) / det, pt(fr(xn + 1, det), fr(yn - 1, det))]];
        const right = pt(X, Yv), seen = new Set(), wrong = cand.filter(([x, y]) => { const key = x.toFixed(6) + ',' + y.toFixed(6); if (both(x, y) || seen.has(key)) return false; seen.add(key); return true; }).map(c => c[2]).slice(0, 3);
        if (wrong.length === 3) return E.choice(R, `The graph of ${sys(L2(a1, b1, c1), L2(a2, b2, c2))} suggests the lines cross near ${pt(r1(xn / det), r1(yn / det))}. Which point is the exact solution?`, right, wrong,
          `A graph can only show about ${pt(r1(xn / det), r1(yn / det))}, so substitute each choice. Only ${right} makes both equations true; each other choice fails at least one.`, { visual: gLines([sf(a1, b1, c1), sf(a2, b2, c2)]) }); }
      return E.num(`The graph of ${sys(L2(a1, b1, c1), L2(a2, b2, c2))} suggests the lines cross near ${pt(r1(xn / det), r1(yn / det))}. Find the exact solution. Give exact fractions.`, [{ point: [fr(xn, det), fr(yn, det)] }],
        `${howTxt(m1, m2)}: ${solv(K, 'x', Rr, fr(xn, det))}; then y = ${fr(yn, det)}. A graph can only show about ${pt(r1(xn / det), r1(yn / det))}.`, { visual: gLines([sf(a1, b1, c1), sf(a2, b2, c2)]) }); } },
  });

  /* IV.4.03 Substitution */
  S('IV.4.03', 'Substitution', {
    a: { t: 'isolate a variable', g: R => { const s = sysGen(R, { co: 5, sol: 6, pred: s => (Math.abs(s.a1) === 1 || Math.abs(s.b1) === 1) && Math.abs(s.a2) > 1 && Math.abs(s.b2) > 1 });
      const forY = Math.abs(s.b1) === 1 && (Math.abs(s.a1) !== 1 || R.bool()), first = R.bool();
      const tgt = forY ? 'y=' + E.poly([-s.a1 * s.b1, s.c1 * s.b1]) : 'x=' + E.poly([-s.a1 * s.b1, s.a1 * s.c1], 'y');
      const es = [L2(s.a1, s.b1, s.c1), L2(s.a2, s.b2, s.c2)]; if (!first) es.reverse();
      const neg = forY ? s.b1 < 0 : s.a1 < 0;
      return E.num(`In the system ${sys(...es)}, solve the ${first ? 'first' : 'second'} equation for ${forY ? 'y' : 'x'}.`, [{ eqn: tgt, form: 'solved' }],
        `${forY ? 'y' : 'x'} has coefficient ${neg ? '−1' : '1'} there, so move the other term across${neg ? ' and multiply by −1' : ''}: ${M(tgt)}.`); } },
    b: { t: 'substitute', g: R => { const u = R.pick(['x', 'y']), w = u === 'x' ? 'y' : 'x', m = nz(R, -4, 4), k = nz(R, -6, 6), cu = R.pick([2, 3, 4, 5, -2, -3, -4]), cw = nz(R, -5, 5), c = R.int(-15, 15);
      const ex = E.poly([m, k], w), put = (arr) => (u === 'x' ? arr : arr.slice().reverse());
      const other = u === 'x' ? L2(cu, cw, c) : L2(cw, cu, c);
      const right = joinT(put([[cu, `(${ex})`], [cw, w]])) + '=' + c;
      const noBr = joinT(u === 'x' ? [[cu * m, w], [k, ''], [cw, w]] : [[cw, w], [cu * m, w], [k, '']]) + '=' + c;
      const wrongVar = joinT(put([[cu, u], [cw, `(${ex})`]])) + '=' + c;
      return E.choice(R, `In the system ${sys(u + '=' + ex, other)}, substitute into the other equation. Which equation do you get?`, M(right), [M(noBr), M(wrongVar), M(ex + '=' + ex)],
        `Replace ${u} in ${M(other)} with ${M('(' + ex + ')')}, brackets and all: ${M(right)}. Putting it back into ${M(u + '=' + ex)} only gives ${M(ex + '=' + ex)}.`); } },
    c: { t: 'solve and back-substitute', g: R => { let x0, y0, m, k, a, b;
      do { x0 = R.int(-6, 6); y0 = R.int(-6, 6); m = nz(R, -4, 4); a = nz(R, -5, 5); b = nz(R, -5, 5); } while (a + b * m === 0 || Math.abs(y0 - m * x0) > 12);
      const useX = R.bool();
      if (!useX) { k = y0 - m * x0; const c = a * x0 + b * y0, subs = `${joinT([[a, 'x'], [b, `(${E.poly([m, k])})`]])}=${c}`;
        return E.num(`Solve by substitution: ${sys(Y(m, k), L2(a, b, c))}.`, [{ point: [String(x0), String(y0)] }], `Substitute: ${M(subs)}, so ${M(joinT([[a + b * m, 'x']]) + '=' + (c - b * k))} and x = ${x0}. Back-substitute: y = ${yAt(m, k, x0)}.`); }
      k = x0 - m * y0; const c = b * x0 + a * y0, subs = `${joinT([[b, `(${E.poly([m, k], 'y')})`], [a, 'y']])}=${c}`;
      return E.num(`Solve by substitution: ${sys('x=' + E.poly([m, k], 'y'), L2(b, a, c))}.`, [{ point: [String(x0), String(y0)] }], `Substitute: ${M(subs)}, so ${M(joinT([[a + b * m, 'y']]) + '=' + (c - b * k))} and y = ${y0}. Back-substitute: x = ${yAt(m, k, y0).replace(/^(-?)/, '$1')}.`); } },
    d: { t: 'check both equations', g: R => { const s = sysGen(R, { co: 4, sol: 5, pred: s => Math.abs(s.b1) === 1 }), m = -s.a1 * s.b1, k = s.c1 * s.b1, e1 = EqY(m, k), e2 = EqS(s.a2, s.b2, s.c2), kind = R.int(0, 3); let p = s.x, q = s.y;
      if (kind === 0 || kind === 1) { const e = kind === 0 ? e1 : e2, g = gcd(e.a, e.b), t = nz(R, -2, 2); p = s.x + t * e.b / g; q = s.y - t * e.a / g; }
      if (kind === 3) { do { p = s.x + nz(R, -2, 2); q = s.y + R.int(-2, 2); } while (e1.on(p, q) || e2.on(p, q)); }
      return E.choiceFixed(`A student solved ${sys(e1.s, e2.s)} by substitution and got ${pt(p, q)}. Which equations does it satisfy?`, ['the first only', 'the second only', 'both, so it is the solution', 'neither'], kind,
        `First: ${e1.txt(p, q)}. Second: ${e2.txt(p, q)}. ${kind === 2 ? 'It checks in both.' : 'It must check in both to be the solution.'}`); } },
    e: { t: 'clear fractions, then substitute', g: R => { for (;;) { const p = R.int(2, 5), q = R.int(2, 6), sg = R.pick([1, -1]), x0 = p * R.int(-3, 3), y0 = q * R.int(-3, 3), m = nz(R, -3, 3), useY = R.bool();
      if (p === q) continue; const Lm = lcm(p, q), A = Lm / p, B = sg * Lm / q, c = x0 / p + sg * y0 / q, k = useY ? y0 - m * x0 : x0 - m * y0, co = useY ? A + B * m : A * m + B;
      if (Math.abs(k) > 12 || !co) continue;
      const e1 = `x/${p}${sg > 0 ? '+' : '-'}y/${q}=${c}`, e2 = useY ? Y(m, k) : 'x=' + E.poly([m, k], 'y'), rhs = Lm * c - (useY ? B : A) * k;
      return E.num(`Solve ${sys(e1, e2)}.`, [{ point: [String(x0), String(y0)] }],
        `Multiply the first by ${Lm}: ${M(L2(A, B, Lm * c))}. Substitute ${M(e2)}: ${solv(co, useY ? 'x' : 'y', rhs, useY ? x0 : y0)}. Then ${useY ? `y = ${yAt(m, k, x0)}` : `x = ${yAt(m, k, y0)}`}.`); } } },
    f: { t: 'substitute u = 1/x and v = 1/y', g: R => { let u, v, a, b, d, e;
      do { u = nz(R, -4, 4); v = nz(R, -4, 4); a = nz(R, -5, 5); b = nz(R, -5, 5); d = nz(R, -5, 5); e = nz(R, -5, 5); } while (a * e - b * d === 0 || (Math.abs(u) === 1 && Math.abs(v) === 1));
      const c1 = a * u + b * v, c2 = d * u + e * v, eq = (p, q, c) => `${p < 0 ? '-' : ''}${Math.abs(p)}/x${q < 0 ? '-' : '+'}${Math.abs(q)}/y=${c}`;
      return E.num(`Solve ${sys(eq(a, b, c1), eq(d, e, c2))}.`, [{ point: [fr(1, u), fr(1, v)] }],
        `Let u = 1/x and v = 1/y: ${M(joinT([[a, 'u'], [b, 'v']]) + '=' + c1)} and ${M(joinT([[d, 'u'], [e, 'v']]) + '=' + c2)}. These give u = ${u} and v = ${v}, so x = 1/u = ${E.pt(fr(1, u))} and y = 1/v = ${E.pt(fr(1, v))}.`); } },
  });

  /* IV.4.04 Elimination */
  S('IV.4.04', 'Elimination', {
    a: { t: 'line up variables', g: R => { const A = R.bool(0.8) ? R.int(1, 6) : -R.int(1, 5), B = nz(R, -7, 7), Cc = nz(R, -12, 12), f = R.int(0, 3);
      const src = [`${joinT([[B, 'y']])}=${joinT([[Cc, ''], [-A, 'x']])}`, `${joinT([[A, 'x']])}=${joinT([[Cc, ''], [-B, 'y']])}`, `${joinT([[B, 'y'], [A, 'x']])}=${Cc}`, `${joinT([[A, 'x'], [-Cc, '']])}=${joinT([[-B, 'y']])}`][f];
      return E.num(`Line up the variables: write ${M(src)} in the form ${M(joinT([[A, 'x']]) + '+by=c')}. Find b and c.`, [{ label: 'b =', ans: B }, { label: 'c =', ans: Cc }],
        `Move each variable term to the left and the number to the right, changing sign as it crosses: ${M(L2(A, B, Cc))}.`); } },
    b: { t: 'add or subtract to cancel', g: R => { let o1, o2, e, sg, x0, y0; const elY = R.bool();
      do { o1 = nz(R, -6, 6); o2 = nz(R, -6, 6); e = nz(R, -5, 5); sg = R.pick([1, -1]); } while (sg > 0 ? o1 === o2 : o1 === -o2);
      x0 = R.int(-6, 6); y0 = R.int(-6, 6); const kv = elY ? 'x' : 'y', ev = elY ? 'y' : 'x', kept = elY ? x0 : y0, gone = elY ? y0 : x0;
      const c1 = o1 * kept + e * gone, c2 = o2 * kept + sg * e * gone;
      const eq = (ko, ke, c) => elY ? L2(ko, ke, c) : L2(ke, ko, c);
      const K = sg > 0 ? o1 - o2 : o1 + o2, Rc = sg > 0 ? c1 - c2 : c1 + c2, right = joinT([[K, kv]]) + '=' + Rc;
      const cands = sg > 0 ? [eq(o1 + o2, 2 * e, c1 + c2), joinT([[K, kv]]) + '=' + (c1 + c2), joinT([[o1 + o2, kv]]) + '=' + Rc, eq(K, 2 * e, Rc)]
        : [eq(o1 - o2, 2 * e, c1 - c2), joinT([[K, kv]]) + '=' + (c1 - c2), joinT([[o1 - o2, kv]]) + '=' + (c1 - c2), eq(K, 2 * e, Rc)];
      const wrong = [...new Set(cands)].filter(s => s !== right && !/^0=/.test(s)).map(M);
      return E.choice(R, `Add or subtract ${sys(eq(o1, e, c1), eq(o2, sg * e, c2))} to eliminate ${ev}. Which equation do you get?`, M(right), wrong.slice(0, 3),
        `The ${ev}-coefficients are ${sg > 0 ? 'equal, so subtract' : 'opposites, so add'} every term, constants included: ${M(right)}.`); } },
    c: { t: 'solve and back-substitute', g: R => { const s = sysGen(R, { co: 6, sol: 6, pred: s => Math.abs(s.b1) === Math.abs(s.b2) && Math.abs(s.a1) !== Math.abs(s.a2) });
      return E.num(`Solve by elimination: ${sys(L2(s.a1, s.b1, s.c1), L2(s.a2, s.b2, s.c2))}.`, [{ point: [String(s.x), String(s.y)] }], elimTxt(s)); } },
    d: { t: 'check', g: R => { const s = sysGen(R, { co: 6, sol: 6, pred: s => Math.abs(s.b1) === Math.abs(s.b2) || Math.abs(s.a1) === Math.abs(s.a2) }), e1 = EqS(s.a1, s.b1, s.c1), e2 = EqS(s.a2, s.b2, s.c2), yes = R.bool(); let p = s.x, q = s.y;
      if (!yes) { const c = [[s.x, -s.y], [-s.x, s.y], [s.x, s.y + nz(R, -2, 2)], [s.x + nz(R, -2, 2), s.y]].filter(([a, b]) => a !== s.x || b !== s.y); [p, q] = R.pick(c); }
      return E.choiceFixed(`A student used elimination on ${sys(e1.s, e2.s)} and got ${pt(p, q)}. Check it in both equations. Is it right?`, ['Yes', 'No'], yes ? 0 : 1,
        `First: ${e1.txt(p, q)}. Second: ${e2.txt(p, q)}. ${yes ? 'Both check, so it is right.' : 'It fails a check, so it is wrong.'}`); } },
    e: { t: 'tidy up, then eliminate', g: R => { const s = sysGen(R, { co: 6, sol: 6, pred: s => Math.abs(s.b1) === Math.abs(s.b2) && Math.abs(s.a1) !== Math.abs(s.a2) });
      const messy = (a, b, c) => { const f = R.int(0, 3), t = nz(R, -3, 3);
        if (f === 0) return `${joinT([[b, 'y']])}=${joinT([[c, ''], [-a, 'x']])}`;
        if (f === 1) return `${joinT([[a, 'x']])}=${joinT([[c, ''], [-b, 'y']])}`;
        if (f === 2 && a !== t) return `${joinT([[a - t, 'x'], [b, 'y']])}=${joinT([[c, ''], [-t, 'x']])}`;
        return b !== t ? `${joinT([[a, 'x'], [b - t, 'y']])}=${joinT([[c, ''], [-t, 'y']])}` : `${joinT([[b, 'y'], [c === 0 ? 0 : -c, '']])}=${joinT([[-a, 'x']])}`; };
      return E.num(`Solve by elimination: ${sys(messy(s.a1, s.b1, s.c1), messy(s.a2, s.b2, s.c2))}.`, [{ point: [String(s.x), String(s.y)] }],
        `Line up the variables first: ${M(L2(s.a1, s.b1, s.c1))} and ${M(L2(s.a2, s.b2, s.c2))}. ${elimTxt(s)}`); } },
    f: { t: 'add and subtract whole equations', g: R => { let A, B, x0, y0;
      do { A = R.int(11, 40); B = A + nz(R, -9, 9); x0 = R.int(-6, 6); y0 = R.int(-6, 6); } while (x0 === y0 || x0 === -y0);
      const plus = R.bool(), e1 = plus ? L2(A, B, A * x0 + B * y0) : L2(A, -B, A * x0 - B * y0), e2 = plus ? L2(B, A, B * x0 + A * y0) : L2(B, -A, B * x0 - A * y0);
      const S0 = x0 + y0, D0 = x0 - y0, cf = (k, s) => (k === 1 ? '' : k === -1 ? '-' : k) + s, why = plus ? `Add: ${M(`${A + B}(x+y)=${(A + B) * S0}`)}, so x + y = ${S0}. Subtract: ${M(cf(A - B, '(x-y)') + '=' + (A - B) * D0)}, so x − y = ${D0}.`
        : `Add: ${M(`${A + B}(x-y)=${(A + B) * D0}`)}, so x − y = ${D0}. Subtract: ${M(cf(A - B, '(x+y)') + '=' + (A - B) * S0)}, so x + y = ${S0}.`;
      return E.num(`Solve ${sys(e1, e2)}.`, [{ point: [String(x0), String(y0)] }], `The coefficients swap places, so use whole equations. ${why} Then x = ${x0} and y = ${y0}.`); } },
  });

  /* IV.4.05 Elimination with multiplying */
  S('IV.4.05', 'Elimination with multiplying', {
    a: { t: 'multiply one equation', g: R => {
      if (R.bool()) { const b2 = nz(R, -3, 3), k = R.pick([2, 3, 4, -2, -3, -4]), b1 = k * b2, a1 = nz(R, -6, 6), a2 = nz(R, -6, 6), x0 = R.int(-5, 5), y0 = R.int(-5, 5), useY = R.bool();
        const e1 = useY ? L2(a1, b1, a1 * x0 + b1 * y0) : L2(b1, a1, b1 * x0 + a1 * y0), e2 = useY ? L2(a2, b2, a2 * x0 + b2 * y0) : L2(b2, a2, b2 * x0 + a2 * y0), v = useY ? 'y' : 'x';
        return E.num(`In ${sys(e1, e2)}, what should you multiply the second equation by so the ${v}-coefficients become opposites?`, [{ ans: -k }], `${M(joinT([[b2, v]]))} × ${P(-k)} = ${M(joinT([[-k * b2, v]]))}, the opposite of ${M(joinT([[b1, v]]))}.`); }
      const a = nz(R, -6, 6), b = nz(R, -6, 6), c = nz(R, -12, 12), k = R.pick([2, 3, 4, 5, -2, -3]);
      return E.num(`Multiply ${M(L2(a, b, c))} by ${k}. Fill in the boxes: ${M(joinT([[k * a, 'x']]) + '+□y=□')}.`, [{ label: 'y-coefficient =', ans: k * b }, { label: 'right side =', ans: k * c }],
        `Every term gets multiplied, the constant too: ${M(L2(k * a, k * b, k * c))}.`); } },
    b: { t: 'multiply both', g: R => { const [p, q] = R.pick([[2, 3], [3, 4], [2, 5], [4, 6], [3, 5], [4, 5], [5, 6], [3, 8], [6, 8], [4, 10]]), sw = R.bool(), a1 = (sw ? p : q) * R.pick([1, -1]), a2 = (sw ? q : p) * R.pick([1, -1]), L = lcm(a1, a2);
      const b1 = nz(R, -6, 6), b2 = nz(R, -6, 6), x0 = R.int(-5, 5), y0 = R.int(-5, 5), useX = R.bool(), v = useX ? 'x' : 'y';
      const e1 = useX ? L2(a1, b1, a1 * x0 + b1 * y0) : L2(b1, a1, b1 * x0 + a1 * y0), e2 = useX ? L2(a2, b2, a2 * x0 + b2 * y0) : L2(b2, a2, b2 * x0 + a2 * y0);
      return E.num(`To eliminate ${v} from ${sys(e1, e2)}, multiply the first equation by m and the second by n so the ${v}-terms become ${M(L + v)} and ${M(-L + v)}. Find m and n.`, [{ label: 'm =', ans: L / a1 }, { label: 'n =', ans: -L / a2 }],
        `${L} is the least common multiple of ${Math.abs(a1)} and ${Math.abs(a2)}: ${a1} × ${P(L / a1)} = ${L} and ${a2} × ${P(-L / a2)} = ${-L}.`); } },
    c: { t: 'cancel and solve', g: R => { const s = sysGen(R, { co: 6, sol: 5, pred: s => [s.a1, s.b1, s.a2, s.b2].every(v => Math.abs(v) >= 2) && Math.abs(s.a1) !== Math.abs(s.a2) && Math.abs(s.b1) !== Math.abs(s.b2) && lcm(s.b1, s.b2) <= 20 });
      return E.num(`Solve by elimination: ${sys(L2(s.a1, s.b1, s.c1), L2(s.a2, s.b2, s.c2))}.`, [{ point: [String(s.x), String(s.y)] }], elimTxt(s)); } },
    d: { t: 'avoid sign mistakes', g: R => { const kind = R.int(0, 2);
      if (kind === 0) { let a1, a2, b2, c1, c2, k; do { a1 = nz(R, -6, 6); a2 = nz(R, -5, 5); b2 = nz(R, -4, 4); c1 = nz(R, -12, 12); c2 = nz(R, -9, 9); k = R.pick([-2, -3, -4]); } while (a1 + k * a2 === 0 || a1 - k * a2 === 0);
        const b1 = -k * b2, xc = a1 + k * a2, right = M(joinT([[xc, 'x']]) + '=' + (c1 + k * c2));
        return E.choice(R, `In ${sys(L2(a1, b1, c1), L2(a2, b2, c2))}, multiply the second equation by ${k} and add it to the first. Which equation do you get?`, right,
          [M(joinT([[xc, 'x']]) + '=' + (c1 + c2)), M(joinT([[a1 - k * a2, 'x']]) + '=' + (c1 + k * c2)), M(joinT([[xc, 'x']]) + '=' + (c1 - k * c2))],
          `Times ${k}, the second equation is ${M(L2(k * a2, k * b2, k * c2))}: every term changes sign, the constant too. Adding it to the first cancels y: ${right}.`); }
      if (kind === 1) { let a, b, c; do { a = nz(R, -6, 6); b = nz(R, -6, 6); c = nz(R, -10, 10); } while (a > 0 && b > 0 && c > 0); const k = R.pick([-2, -3, -4, -5]);
        return E.choice(R, `Multiply ${M(L2(a, b, c))} by ${k}. Which result is right?`, M(L2(k * a, k * b, k * c)), [M(L2(k * a, -k * b, k * c)), M(L2(k * a, k * b, -k * c)), M(L2(k * a, k * b, c))],
          `Every term, the constant included, is multiplied by ${k}, so every sign flips: ${M(L2(k * a, k * b, k * c))}.`); }
      let a1, a2, b, c1, c2; do { a1 = nz(R, -6, 6); a2 = nz(R, -6, -1); b = nz(R, -6, 6); c1 = nz(R, -12, 12); c2 = nz(R, -12, 12); } while (a1 === a2 || a1 === -a2);
      return E.choice(R, `Subtract ${M(L2(a2, b, c2))} from ${M(L2(a1, b, c1))}. Which result is right?`, M(joinT([[a1 - a2, 'x']]) + '=' + (c1 - c2)), [M(joinT([[a1 + a2, 'x']]) + '=' + (c1 - c2)), M(joinT([[a1 - a2, 'x']]) + '=' + (c1 + c2)), M(L2(a1 - a2, 2 * b, c1 - c2))],
        `Subtract every term: ${a1} − (${a2}) = ${a1 - a2}, the y-terms cancel, and ${c1} − (${c2}) = ${c1 - c2}.`); } },
  });

  /* IV.4.06 Choosing a method */
  S('IV.4.06', 'Choosing a method', {
    a: { t: 'when graphing fits', g: R => { const yes = R.bool(), L = twoLines(R, 3, 5), ys = sys(Y(L.m1, L.k1), Y(L.m2, L.k2)), kind = R.int(0, 2); let sc, why;
      if (yes) { sc = [`You only need a rough idea of where ${ys} meet.`, `You want a quick picture of whether ${ys} cross, and where.`, `A class wants to see the solution of ${ys} as a picture.`][kind]; why = 'A graph shows the crossing point at a glance. Check it in both equations if you need it exact.'; }
      else if (kind !== 1) { let s; do { s = sysGen(R, { co: 5, sol: 3 }); s.c1 += nz(R, -2, 2); } while ((s.c1 * s.b2 - s.c2 * s.b1) % (s.a1 * s.b2 - s.a2 * s.b1) === 0);
        const ss = sys(L2(s.a1, s.b1, s.c1), L2(s.a2, s.b2, s.c2));
        if (kind === 0) { sc = `You need the exact solution of ${ss}, and it has fraction coordinates.`; why = 'A hand-drawn graph only estimates, and it cannot show fractions exactly. Use algebra.'; }
        else { sc = `You need the solution of ${ss} correct to two decimal places.`; why = 'A graph cannot be read to two decimal places. Solve algebraically.'; } }
      else if (kind === 1) { const x0 = R.int(5, 40), y0 = R.int(5, 40), a = R.pick([150, 200, 250, 300]), b = R.pick([350, 400, 450, 500]);
        sc = `You need the exact solution of ${sys(L2(a, b, a * x0 + b * y0), L2(1, 1, x0 + y0))}.`; why = 'Numbers this large make an accurate graph very hard to draw. Solve algebraically.'; }
      return E.choiceFixed(`${sc} Is graphing a good method here?`, ['Yes', 'No'], yes ? 0 : 1, why); } },
    b: { t: 'when substitution fits', g: R => { const yes = R.bool(); let e1, e2, why;
      if (yes) { const kind = R.int(0, 2), s = sysGen(R, { co: 6, pred: s => Math.abs(s.a2) > 1 && Math.abs(s.b2) > 1 && (kind < 2 || Math.abs(s.a1) === 1 || Math.abs(s.b1) === 1) }); e2 = L2(s.a2, s.b2, s.c2);
        if (kind === 0) { const m = R.int(-4, 4), k = s.y - m * s.x; e1 = Y(m, k); why = 'y is already alone, so it can go straight into the other equation.'; }
        else if (kind === 1) { const m = nz(R, -4, 4), k = s.x - m * s.y; e1 = 'x=' + E.poly([m, k], 'y'); why = 'x is already alone, so it can go straight into the other equation.'; }
        else { e1 = L2(s.a1, s.b1, s.c1); why = `${Math.abs(s.b1) === 1 ? 'y' : 'x'} has coefficient ${Math.abs(s.b1) === 1 ? s.b1 : s.a1} in ${M(e1)}, so isolating it gives no fractions.`; } }
      else { const s = sysGen(R, { co: 7, pred: s => [s.a1, s.b1, s.a2, s.b2].every(v => Math.abs(v) >= 2) }); e1 = L2(s.a1, s.b1, s.c1); e2 = L2(s.a2, s.b2, s.c2); why = 'No variable has coefficient 1, so isolating one creates fractions. Substitution still works but is messy; elimination is cleaner.'; }
      const es = R.bool() ? [e1, e2] : [e2, e1];
      return E.choiceFixed(`Is substitution a good fit for ${sys(...es)}?`, ['Yes', 'No'], yes ? 0 : 1, why); } },
    c: { t: 'when elimination fits', g: R => { const yes = R.bool(), s = sysGen(R, { co: 7, pred: s => yes ? (Math.abs(s.a1) === Math.abs(s.a2)) !== (Math.abs(s.b1) === Math.abs(s.b2)) : Math.abs(s.a1) !== Math.abs(s.a2) && Math.abs(s.b1) !== Math.abs(s.b2) });
      const v = Math.abs(s.a1) === Math.abs(s.a2) ? 'x' : 'y', p = v === 'x' ? s.a1 : s.b1, q = v === 'x' ? s.a2 : s.b2;
      return E.choiceFixed(`Can you eliminate a variable from ${sys(L2(s.a1, s.b1, s.c1), L2(s.a2, s.b2, s.c2))} by just adding or subtracting, with no multiplying?`, ['Yes', 'No'], yes ? 0 : 1,
        yes ? `The ${v}-coefficients ${p} and ${q} are ${p === q ? 'equal, so subtract' : 'opposites, so add'}.` : `No pair matches: x has ${s.a1} and ${s.a2}, y has ${s.b1} and ${s.b2}. Multiply first, then eliminate.`); } },
    d: { t: 'justify the choice', g: R => { const kind = R.int(0, 2); let e1, e2, why;
      const reasons = ['A variable is already alone, so substitute it into the other equation.', 'Two coefficients already match or are opposites, so add or subtract to eliminate.', 'No coefficient is 1 and none match, so multiply, then eliminate.', 'Graph it, because a graph always gives the exact answer.'];
      if (kind === 0) { const s = sysGen(R, { co: 6, pred: s => Math.abs(s.a2) > 1 && Math.abs(s.b2) > 1 }), m = nz(R, -4, 4); e1 = Y(m, s.y - m * s.x); e2 = L2(s.a2, s.b2, s.c2); why = `${M(e1)} can go straight into the other equation.`; }
      else if (kind === 1) { const s = sysGen(R, { co: 7, pred: s => [s.a1, s.b1, s.a2, s.b2].every(v => Math.abs(v) >= 2) && Math.abs(s.b1) === Math.abs(s.b2) && Math.abs(s.a1) !== Math.abs(s.a2) }); e1 = L2(s.a1, s.b1, s.c1); e2 = L2(s.a2, s.b2, s.c2); why = `The y-coefficients ${s.b1} and ${s.b2} are ${s.b1 === s.b2 ? 'equal, so subtract' : 'opposites, so add'}.`; }
      else { const s = sysGen(R, { co: 7, pred: s => [s.a1, s.b1, s.a2, s.b2].every(v => Math.abs(v) >= 2) && Math.abs(s.a1) !== Math.abs(s.a2) && Math.abs(s.b1) !== Math.abs(s.b2) }); e1 = L2(s.a1, s.b1, s.c1); e2 = L2(s.a2, s.b2, s.c2); const L = lcm(s.b1, s.b2); why = `For example, multiply by ${L / s.b1} and ${-L / s.b2} so the y-terms become ${L}y and ${-L}y.`; }
      return E.choice(R, `Which is the best reason for how to solve ${sys(e1, e2)}?`, reasons[kind], reasons.filter((_, j) => j !== kind), why); } },
    e: { t: "combine, don't solve", g: R => { for (;;) { const a1 = nz(R, -5, 5), b1 = nz(R, -5, 5), a2 = nz(R, -5, 5), b2 = nz(R, -5, 5), c1 = R.int(-12, 12), c2 = R.int(-12, 12), D = a1 * b2 - a2 * b1;
      if (!D) continue; const xn = c1 * b2 - c2 * b1, yn = a1 * c2 - a2 * c1; if (xn % D === 0 && yn % D === 0) continue;
      const p = R.pick([1, 1, 2, 3]), q = R.pick([1, 2, 3, -1, -2, -3]), tx = p * a1 + q * a2, ty = p * b1 + q * b2;
      if (!tx || !ty || tx * b1 === ty * a1 || tx * b2 === ty * a2 || Math.abs(tx) > 12 || Math.abs(ty) > 12) continue;
      const T = joinT([[tx, 'x'], [ty, 'y']]), val = p * c1 + q * c2, how = `${p === 1 ? '' : p + ' × '}the first ${q > 0 ? '+' : '−'} ${Math.abs(q) === 1 ? '' : Math.abs(q) + ' × '}the second`;
      return E.num(`If ${sys(L2(a1, b1, c1), L2(a2, b2, c2))}, what is the value of ${M(T)}?`, [{ label: E.pt(T) + ' =', ans: val }],
        `Don't solve (x = ${E.pt(fr(xn, D))} and y = ${E.pt(fr(yn, D))} are fractions). Instead ${how} gives ${M(T + '=' + val)} directly.`); } } },
    f: { t: 'factor, then it is linear', g: R => { let k, x0, y0, s, d;
      do { k = R.pick([1, 1, 2, 3]); x0 = R.int(-9, 9); y0 = R.int(-6, 6); s = x0 + k * y0; d = x0 - k * y0; } while (!s || !d || Math.abs(s * d) > 99);
      const kk = k === 1 ? '' : k, giveSum = R.bool(), lin = giveSum ? `x+${kk}y=${s}` : `x-${kk}y=${d}`, quad = `x^2-${k === 1 ? '' : k * k}y^2=${s * d}`, other = giveSum ? `x-${kk}y=${d}` : `x+${kk}y=${s}`;
      const es = R.bool() ? [lin, quad] : [quad, lin];
      return E.num(`Solve ${sys(...es)}.`, [{ point: [String(x0), String(y0)] }],
        `Factor: ${M(`(x+${kk}y)(x-${kk}y)=${s * d}`)}. Since ${M(lin)}, the other factor is ${s * d} ÷ ${P(giveSum ? s : d)} = ${giveSum ? d : s}: ${M(other)}. Now the system is linear: adding or subtracting gives x = ${x0} and y = ${y0}.`); } },
  });

  /* IV.4.07 No or infinite solutions */
  const HOW = ['no solution', 'exactly one solution', 'infinitely many solutions'];
  S('IV.4.07', 'No or infinite solutions', {
    a: { t: 'parallel lines', g: R => { const kind = R.int(0, 2), t = R.pick([2, -2, 3, -1]), stdT = (m, k) => L2(-m * t, t, k * t); let f1, f2, e1, e2, why;
      if (kind === 1) { const L = twoLines(R, 3, 5); f1 = lf(L.m1, L.k1); f2 = lf(L.m2, L.k2); e1 = Y(L.m1, L.k1); e2 = R.bool() ? Y(L.m2, L.k2) : stdT(L.m2, L.k2); why = `The slopes ${L.m1} and ${L.m2} differ, so the lines cross once, at ${pt(L.x, L.y)}.`; }
      else { const m = nz(R, -3, 3), k1 = R.int(-5, 5); let k2 = k1; if (kind === 0) do k2 = R.int(-5, 5); while (k2 === k1);
        f1 = lf(m, k1); f2 = lf(m, k2); e1 = Y(m, k1); e2 = kind === 2 || R.bool() ? stdT(m, k2) : Y(m, k2);
        why = kind === 0 ? `Both have slope ${m} but different y-intercepts (${k1} and ${k2}), so the lines are parallel and never meet.` : `The second equation rearranges to ${M(Y(m, k2))}: the same line, so every point on it is a solution.`; }
      return E.choiceFixed(`The graph shows ${sys(e1, e2)}. How many solutions does the system have?`, HOW, kind, why, { visual: gLines([f1, f2], { dash: [false, kind === 2] }) }); } },
    b: { t: 'same line', g: R => { const a = nz(R, -5, 5), b = nz(R, -5, 5), c = R.int(-9, 9), t = R.pick([2, 3, -1, -2, 4, -3]), yes = R.bool(), par = R.bool(0.7); let a2 = t * a, b2 = t * b, c2 = t * c, why;
      if (yes) why = `Multiply the first by ${t}: ${M(L2(t * a, t * b, t * c))}, exactly the second. Same line.`;
      else if (par) { c2 = t * c + nz(R, -4, 4); why = `Multiplying the first by ${t} gives ${M(L2(t * a, t * b, t * c))}. The left sides match but ${t * c} ≠ ${c2}, so the lines are parallel, not the same.`; }
      else { do b2 = nz(R, -9, 9); while (a * b2 === a2 * b); c2 = R.int(-12, 12); why = `The coefficients are not in proportion (${a} × ${P(t)} = ${a2}, but ${b} × ${P(t)} ≠ ${b2}), so the slopes differ and the lines cross once.`; }
      return E.choiceFixed(`Do ${sys(L2(a, b, c), L2(a2, b2, c2))} describe the same line?`, ['Yes', 'No'], yes ? 0 : 1, why); } },
    c: { t: 'spot them algebraically', g: R => { const kind = [0, 1, 2][R.int(0, 2)]; let e1, e2, why;
      if (kind === 1) { const s = sysGen(R, { co: 5, sol: 5, pred: s => s.x || s.y }); e1 = L2(s.a1, s.b1, s.c1); e2 = L2(s.a2, s.b2, s.c2); why = `Eliminating gives x = ${s.x} and y = ${s.y}: exactly one solution.`; }
      else { const a = nz(R, -5, 5), b = nz(R, -5, 5), c = nz(R, -9, 9), t = R.pick([2, 3, -2, -1, 4]), d = kind === 0 ? nz(R, -5, 5) : 0; e1 = L2(a, b, c); e2 = L2(t * a, t * b, t * c + d);
        why = `Multiply the first by ${P(t)} and subtract it from the second: every variable cancels, leaving ${M('0=' + d)}. ${kind === 0 ? 'That is false, so there is no solution.' : 'That is always true, so every point on the line is a solution, not just (0, 0).'}`; }
      return E.choiceFixed(`Solve ${sys(e1, e2)}. How many solutions are there?`, ['no solution', 'exactly one solution', 'infinitely many solutions', 'only (0, 0)'], kind, why); } },
    d: { t: 'spot them from slopes', g: R => { const a = nz(R, -5, 5), b = nz(R, -5, 5), c = R.int(-9, 9), m = R.pick([2, 3, -2, -1, 4, -3]), none = R.bool(), onX = R.bool(0.35), d = m * c + (none ? nz(R, -5, 5) : 0);
      const e2 = onX ? joinT([[1, 'kx'], [m * b, 'y']]) + '=' + d : joinT([[m * a, 'x'], [1, 'ky']]) + '=' + d, ans = onX ? m * a : m * b;
      return E.num(`For what value of k does the system ${sys(L2(a, b, c), e2)} have ${none ? 'no solution' : 'infinitely many solutions'}?`, [{ label: 'k =', ans }],
        `The lines need the same slope, so the second equation's coefficients must be ${m} times the first's: k = ${m} × ${P(onX ? a : b)} = ${ans}. ${none ? `The constant ${d} ≠ ${m} × ${P(c)}, so the lines are parallel.` : `The constant matches too (${m} × ${P(c)} = ${d}), so it is the same line.`}`); } },
    e: { t: 'find both parameters', g: R => { const p = nz(R, -5, 5), q = nz(R, -5, 5), c = R.int(-9, 9), t = R.pick([2, 3, -2, -1, 4, -3]), inf = R.bool(), onX = R.bool();
      const e2 = onX ? `${joinT([[1, 'ax'], [t * q, 'y']])}=b` : `${joinT([[t * p, 'x'], [1, 'ay']])}=b`, A = onX ? t * p : t * q, known = onX ? [q, t * q, 'y'] : [p, t * p, 'x'];
      const base = `The ${known[2]}-coefficients ${known[0]} and ${known[1]} give the ratio ${t}, so a = ${t} × ${P(onX ? p : q)} = ${A}.`;
      return E.num(`The system ${sys(L2(p, q, c), e2)} has ${inf ? 'infinitely many solutions. Find a and b.' : 'no solution. Find a, and the one value that b cannot be.'}`, [{ label: 'a =', ans: A }, { label: inf ? 'b =' : 'b cannot be', ans: t * c }],
        inf ? `Infinitely many solutions means the same line, so the second equation is ${t} times the first. ${base} And b = ${t} × ${P(c)} = ${t * c}.` : `No solution means parallel lines: the left sides are in proportion but the right sides are not. ${base} If b = ${t} × ${P(c)} = ${t * c}, it would be the same line, so b ≠ ${t * c}.`); } },
    f: { t: 'a parameter everywhere', g: R => { for (;;) { const [p0, q0] = R.pick([[1, 1], [2, 2], [1, 4], [4, 1], [3, 3], [1, 9], [9, 1], [2, 8], [8, 2], [4, 4]]), sp = R.pick([1, -1]), p = sp * p0, q = sp * q0, m = Math.round(Math.sqrt(p0 * q0));
      const al = R.pick([0, 1, 2, -1]), be = nz(R, -8, 8), mixed = R.bool(0.75); let s;
      if (mixed) { const ks = R.pick([m, -m]), num = q * (al * ks + be); if (num % ks) continue; s = num / ks; } else s = R.int(-9, 9);
      if (Math.abs(s) > 20) continue;
      const res = [m, -m].map(k => ({ k, same: q * (al * k + be) === k * s })), none = res.filter(r => !r.same).map(r => r.k), many = res.filter(r => r.same).map(r => r.k);
      if (!none.length) continue; const askMany = many.length && R.bool(), ans = askMany ? many : none;
      const e1 = `${joinT([[1, 'kx'], [p, 'y']])}=${joinT([[al, 'k'], [be, '']])}`, e2 = `${joinT([[q, 'x'], [1, 'ky']])}=${s}`;
      const at = res.map(r => `k = ${r.k}: ${M(L2(r.k, p, al * r.k + be))} and ${M(L2(q, r.k, s))} are ${r.same ? 'the same line' : 'parallel'}`).join('; ');
      return E.num(`For which values of k does the system ${sys(e1, e2)} have ${askMany ? 'infinitely many solutions' : 'no solution'}?`, [{ label: 'k =', set: ans.map(String) }],
        `The left sides are in proportion when k/${P(q)} = ${P(p)}/k, so k² = ${p * q} and k = ±${m}; any other k gives one solution. ${at}.`); } } },
  });

  /* IV.4.08 Systems word problems */
  S('IV.4.08', 'Systems word problems', {
    a: { t: 'define two variables', g: R => { const c = ctx(R), [v1, v2] = c.v;
      return E.choice(R, `${c.story(c.n, c.T)} ${c.ask} Which is the best choice of variables?`, `${v1} = number of ${c.names[0]}, ${v2} = number of ${c.names[1]}`,
        [`${v1} = ${c.wn[0]}, ${v2} = ${c.wn[1]}`, `${v1} = ${c.tot[0]}, ${v2} = ${c.tot[1]}`, `${v1} = number of ${c.names[0]}, ${v2} = ${c.tot[0]}`],
        `The unknowns are the two counts, so ${v1} and ${v2} should count the ${c.names[0]} and the ${c.names[1]}. The rest is already given.`); } },
    b: { t: 'write two equations', g: R => { const c = ctx(R), [v1, v2] = c.v, [w1, w2] = c.w, [q1, q2] = ctxEqs(c), S2 = (p, q) => sys(p, q);
      return E.choice(R, `${c.story(c.n, c.T)} Let ${v1} = number of ${c.names[0]} and ${v2} = number of ${c.names[1]}. Which system fits?`, S2(q1, q2),
        [S2(`${v1}+${v2}=${c.T}`, `${joinT([[w1, v1], [w2, v2]])}=${c.n}`), S2(q1, `${joinT([[w2, v1], [w1, v2]])}=${c.T}`), S2(q1, `${joinT([[w1, v1]])}=${joinT([[w2, v2]])}`)],
        `One equation counts ${c.count}: ${M(q1)}. The other totals the ${c.val}: ${M(q2)}. Don't mix ${c.count} with ${c.val}.`); } },
    c: { t: 'solve', g: R => { const c = ctx(R), [v1, v2] = c.v, [w1, w2] = c.w, [q1, q2] = ctxEqs(c);
      return E.num(`${c.story(c.n, c.T)} ${c.ask}`, [{ label: `${c.names[0]}:`, ans: c.n1 }, { label: `${c.names[1]}:`, ans: c.n2 }],
        `${M(q1)} and ${M(q2)}. Put ${M(`${v2}=${c.n}-${v1}`)} into the second: ${M(joinT([[w1 - w2, v1]]) + '=' + (c.T - w2 * c.n))}, so ${v1} = ${c.n1} and ${v2} = ${c.n2}.`); } },
    d: { t: 'answer in context', g: R => { const c = ctx(R), [v1, v2] = c.v, sol = `Solving ${sys(...ctxEqs(c))} gives ${v1} = ${c.n1} and ${v2} = ${c.n2}`;
      if (c.n1 !== c.n2 && R.bool()) { const big = c.n1 > c.n2 ? 0 : 1, d = Math.abs(c.n1 - c.n2);
        return E.num(`${c.story(c.n, c.T)} How many more ${c.names[big]} are there than ${c.names[1 - big]}?`, [{ ans: d }], `${sol}, so there are ${Math.max(c.n1, c.n2)} − ${Math.min(c.n1, c.n2)} = ${d} more ${c.names[big]}.`); }
      const i = R.int(0, 1), n = i ? c.n2 : c.n1, v = c.w[i] * n;
      return E.num(`${c.story(c.n, c.T)} ${c.vq[i]}`, [c.money ? { label: '$', ans: v } : { ans: v }], `${sol}, so the answer is ${c.w[i]} × ${n} = ${c.money ? '$' : ''}${v}${c.money ? '' : ' ' + c.val}.`); } },
  });

  /* IV.4.09 Mixture problems */
  const dec = v => String(+v.toFixed(4));
  const SUBS = [['acid solution', 'acid'], ['salt solution', 'salt'], ['juice drink', 'juice'], ['alcohol solution', 'alcohol']];
  const mixGen = (R, O) => { const u = O && O.units === 'imperial' ? 'gallons' : 'liters';
    if (R.bool(0.65)) { for (;;) { const [p1, p2] = R.sample([5, 10, 15, 20, 25, 30, 40, 50, 60, 70, 80], 2).sort((a, b) => a - b), x = R.int(1, 20), y = R.int(1, 20), T = x + y, p = (p1 * x + p2 * y) / T;
      if (!Number.isInteger(p) || T > 30) continue; const [sub, pure] = R.pick(SUBS);
      return { conc: true, p1, p2, p, x, y, T, u, sub, pure, desc: `You mix x ${u} of ${p1}% ${sub} with y ${u} of ${p2}% ${sub} to make ${T} ${u} of ${p}% ${sub}.`, e2: `${dec(p1 / 100)}x+${dec(p2 / 100)}y=${dec(p * T / 100)}` }; } }
    const lb = O && O.units === 'metric' ? 'kilograms' : 'pounds', per = lb === 'pounds' ? 'lb' : 'kg';
    for (;;) { const w1 = R.int(4, 12), w2 = w1 + R.int(2, 8), x = R.int(2, 20), y = R.int(2, 20), T = x + y, w = (w1 * x + w2 * y) / T; if (!Number.isInteger(w) || T > 36) continue; const item = R.pick(['coffee', 'tea', 'mixed nuts', 'trail mix']);
      return { conc: false, p1: w1, p2: w2, p: w, x, y, T, u: lb, item, desc: `A shop blends x ${lb} of ${item} worth $${w1} per ${per} with y ${lb} worth $${w2} per ${per} to make ${T} ${lb} worth $${w} per ${per}.`, e2: `${w1}x+${w2}y=${w * T}` }; } };
  S('IV.4.09', 'Mixture problems', {
    a: { t: 'amount equation', g: (R, O) => { const m = mixGen(R, O);
      return E.num(`${m.desc} Write an equation for the total ${m.conc ? 'volume' : 'weight'}.`, [{ eqn: `x+y=${m.T}` }], `The two parts add up to the whole mixture: ${M('x+y=' + m.T)}.`); } },
    b: { t: 'value or concentration equation', g: (R, O) => { const m = mixGen(R, O);
      return E.num(`${m.desc} Write an equation for ${m.conc ? `the amount of pure ${m.pure}` : 'the total value in dollars'}.`, [{ eqn: m.e2 }],
        m.conc ? `${m.p1}% of x plus ${m.p2}% of y is ${m.p}% of ${m.T}: ${M(m.e2)}.` : `Value = price × amount for each part, and for the whole: ${M(m.e2)}.`); } },
    c: { t: 'solve', g: (R, O) => { const m = mixGen(R, O), k1 = m.conc ? dec((m.p1 - m.p2) / 100) : m.p1 - m.p2, rhs = m.conc ? dec((m.p - m.p2) * m.T / 100) : (m.p - m.p2) * m.T;
      return E.num(`${m.desc} Find x and y.`, [{ label: 'x =', ans: m.x }, { label: 'y =', ans: m.y }],
        `${M('x+y=' + m.T)} and ${M(m.e2)}. Put ${M(`y=${m.T}-x`)} into the second: ${M(k1 + 'x=' + rhs)}, so x = ${m.x} and y = ${m.y}.`); } },
    d: { t: 'check reasonableness', g: (R, O) => { const u = O && O.units === 'imperial' ? 'gallons' : 'liters', yes = R.bool(), [sub] = R.pick(SUBS);
      if (R.bool()) { const [p1, p2] = R.sample([10, 15, 20, 25, 30, 40, 50, 60], 2).sort((a, b) => a - b); let q, why;
        if (yes) { q = 5 * R.int(p1 / 5 + 1, p2 / 5 - 1); why = `A mixture always lands between ${p1}% and ${p2}%, and ${q}% is between them.`; }
        else { q = p1 + p2 < 100 && R.bool() ? p1 + p2 : R.bool() ? p2 + 5 * R.int(1, 4) : Math.max(1, p1 - 5 * R.int(1, 2)); if (q === p1) q = p1 - 1; why = `A mixture always lands between ${p1}% and ${p2}%, so ${q}% is impossible.${q === p1 + p2 ? " Percentages don't add." : ''}`; }
        return E.choiceFixed(`Can mixing ${p1}% and ${p2}% ${sub} give a ${q}% ${sub}?`, ['Yes', 'No'], yes ? 0 : 1, why); }
      for (;;) { const [p1, p2] = R.sample([10, 20, 25, 30, 40, 50, 60, 70], 2).sort((a, b) => a - b), T = R.int(6, 20), x = yes ? R.int(1, T - 1) : -R.int(1, 8), y = T - x, q = (p1 * x + p2 * y) / T;
        if (!Number.isInteger(q) || q <= 0 || q >= 100) continue;
        return E.choiceFixed(`To make ${T} ${u} of ${q}% ${sub} from ${p1}% and ${p2}% ${sub}, a student found x = ${x} ${u} of ${p1}% and y = ${y} ${u} of ${p2}%. Is that answer reasonable?`, ['Yes', 'No'], yes ? 0 : 1,
          yes ? `Both amounts are positive, they add to ${T}, and ${q}% lies between ${p1}% and ${p2}%.` : `A negative amount is impossible. It happened because ${q}% is not between ${p1}% and ${p2}%.`); } } },
  });

  /* IV.4.10 Rate & distance systems */
  const units = O => O && O.units === 'imperial' ? { d: 'miles', s: 'mph' } : { d: 'km', s: 'km/h' };
  const rtGen = (R, big) => { for (;;) { const t1 = R.int(1, 4), t2 = t1 + R.int(1, 3), m = big ? 10 * R.int(6, 10) : R.int(2, 8); if ((m * (t1 + t2)) % 2) continue; const b = m * (t1 + t2) / 2, c = m * (t2 - t1) / 2; return { t1, t2, D: m * t1 * t2, b, c }; } };
  const rt = (t, s) => t === 1 ? s : `${t}(${s})`;
  S('IV.4.10', 'Rate & distance systems', {
    a: { t: 'with and against the current', g: (R, O) => { const U = units(O), b = R.int(6, 30), c = R.int(1, Math.min(8, b - 3)), who = R.pick(['boat', 'kayak', 'canoe', 'ferry', 'motorboat']);
      return E.num(`A ${who} goes ${b} ${U.s} in still water. The river's current is ${c} ${U.s}. What is its speed downstream and upstream?`, [{ label: `downstream (${U.s}) =`, ans: b + c }, { label: `upstream (${U.s}) =`, ans: b - c }],
        `Downstream the current helps: ${b} + ${c} = ${b + c}. Upstream it pushes back: ${b} − ${c} = ${b - c}.`); } },
    b: { t: 'wind problems', g: (R, O) => { const U = units(O), big = R.bool(), p = big ? 10 * R.int(15, 60) : R.int(20, 60), w = big ? 5 * R.int(2, 16) : R.int(3, Math.min(15, p - 5)), who = big ? R.pick(['A plane', 'A jet', 'A small plane']) : R.pick(['A drone', 'A pigeon', 'A glider']);
      return E.num(`${who} flies at ${p + w} ${U.s} with the wind and ${p - w} ${U.s} against it. Find its speed in still air and the wind speed.`, [{ label: `still air (${U.s}) =`, ans: p }, { label: `wind (${U.s}) =`, ans: w }],
        `p + w = ${p + w} and p − w = ${p - w}. Adding: 2p = ${2 * p}, so p = ${p}; then w = ${w}.`); } },
    c: { t: 'set up rate × time', g: (R, O) => { const U = units(O), boat = R.bool(), g = rtGen(R, !boat), [b, c] = boat ? ['b', 'c'] : ['p', 'w'];
      const story = boat ? `A boat travels ${g.D} ${U.d} downstream in ${g.t1} h, then returns upstream in ${g.t2} h. Let b = its speed in still water and c = the current's speed.` : `A plane flies ${g.D} ${U.d} with the wind in ${g.t1} h and back against the wind in ${g.t2} h. Let p = its speed in still air and w = the wind speed.`;
      const pl = `${b}+${c}`, mi = `${b}-${c}`;
      return E.choice(R, `${story} Which system fits?`, sys(`${rt(g.t1, pl)}=${g.D}`, `${rt(g.t2, mi)}=${g.D}`),
        [sys(`${rt(g.t2, pl)}=${g.D}`, `${rt(g.t1, mi)}=${g.D}`), sys(`${rt(g.t1, pl)}=${g.D}`, `${rt(g.t2, `${c}-${b}`)}=${g.D}`), sys(`${pl}=${g.D * g.t1}`, `${mi}=${g.D * g.t2}`)],
        `Distance = rate × time. ${boat ? 'Downstream' : 'With the wind'} the rate is ${pl.replace('+', ' + ')} for ${g.t1} h; ${boat ? 'upstream' : 'against it'} it is ${mi.replace('-', ' − ')} for ${g.t2} h.`); } },
    d: { t: 'solve and interpret', g: (R, O) => { const U = units(O), boat = R.bool(), g = rtGen(R, !boat);
      const story = boat ? `A boat travels ${g.D} ${U.d} downstream in ${g.t1} h and returns upstream in ${g.t2} h. Find its speed in still water and the speed of the current.` : `A plane flies ${g.D} ${U.d} with the wind in ${g.t1} h and back against the wind in ${g.t2} h. Find its speed in still air and the wind speed.`;
      return E.num(story, [{ label: `${boat ? 'boat' : 'plane'} (${U.s}) =`, ans: g.b }, { label: `${boat ? 'current' : 'wind'} (${U.s}) =`, ans: g.c }],
        `The speeds are ${g.D} ÷ ${g.t1} = ${g.D / g.t1} and ${g.D} ÷ ${g.t2} = ${g.D / g.t2}. Half their sum is ${g.b} (still ${boat ? 'water' : 'air'}); half their difference is ${g.c} (${boat ? 'current' : 'wind'}).`); } },
  });

  /* IV.4.11 Systems of inequalities */
  const OPS = ['<', '<=', '>', '>='];
  S('IV.4.11', 'Systems of inequalities', {
    a: { t: 'graph each inequality', g: R => { const m = R.int(-3, 3), k = R.int(-4, 4), op = R.pick(OPS), pic = o => gIneq([{ m, k, op: o }], { w: 180, h: 180, labels: false });
      const right = pic(op), wrong = [pic(FLIP[op]), pic(TOG[op]), pic(FLIP[TOG[op]])];
      return E.choice(R, `Which graph shows ${M(iq(m, k, op))}?`, right, wrong, `${strict(op) ? 'A strict inequality gets a dashed line' : 'The line itself is included, so it is solid'}, and y ${above(op) ? 'greater' : 'less'} than the line means shade ${above(op) ? 'above' : 'below'} it.`); } },
    b: { t: 'find the overlap', g: R => { const L = twoLines(R, 2, 5), o1 = R.pick(OPS), o2 = R.pick(OPS), d1 = [1, L.m1], d2 = [1, L.m2], n = v => { const h = Math.hypot(...v); return [v[0] / h, v[1] / h]; }, u1 = n(d1), u2 = n(d2);
      const reps = [[u1[0] + u2[0], u1[1] + u2[1]], [u1[0] - u2[0], u1[1] - u2[1]]].flatMap(v => [v, [-v[0], -v[1]]]).map(n).map(v => { let r = 5; while (r > 2 && (Math.abs(L.x + r * v[0]) > 5.8 || Math.abs(L.y + r * v[1]) > 5.8)) r -= 0.2; return [L.x + r * v[0], L.y + r * v[1]]; })
        .sort((p, q) => Math.atan2(p[1] - L.y, p[0] - L.x) - Math.atan2(q[1] - L.y, q[0] - L.x));
      const letters = ['A', 'B', 'C', 'D'], ans = reps.findIndex(([x, y]) => (y > L.m1 * x + L.k1) === above(o1) && (y > L.m2 * x + L.k2) === above(o2));
      const vis = overlay(gIneq([{ m: L.m1, k: L.k1, op: o1 }, { m: L.m2, k: L.k2, op: o2 }], { shade: false }), { x: [-7, 7], y: [-7, 7] }, 300, 300, reps.map((p, j) => [p[0], p[1], letters[j]]));
      return E.choiceFixed(`The graph shows the boundary lines of ${sys(iq(L.m1, L.k1, o1), iq(L.m2, L.k2, o2))}. Which region is the solution?`, letters, ans,
        `The solution is where both are true: ${above(o1) ? 'above' : 'below'} ${M(Y(L.m1, L.k1))} and ${above(o2) ? 'above' : 'below'} ${M(Y(L.m2, L.k2))}. That is region ${letters[ans]}.`, { visual: vis }); } },
    c: { t: 'test a point', g: R => { for (;;) { const L = twoLines(R, 2, 5), o1 = R.pick(OPS), o2 = R.pick(OPS), yes = R.bool(), both = [], one = [], bIn = [], bOut = [];
      for (let x = -5; x <= 5; x++) for (let y = -5; y <= 5; y++) { const v1 = L.m1 * x + L.k1, v2 = L.m2 * x + L.k2, h1 = holds(o1, y, v1), h2 = holds(o2, y, v2), onB = y === v1 || y === v2;
        if (h1 && h2) (onB ? bIn : both).push([x, y]); else if (h1 !== h2) (onB ? bOut : one).push([x, y]); }
      const pool = yes ? (bIn.length && R.bool(0.3) ? bIn : both) : (bOut.length && R.bool(0.3) ? bOut : one); if (!pool.length) continue;
      const [p, q] = R.pick(pool), line = (m, k, o) => { const v = m * p + k, ok = holds(o, q, v); return `${yAt(m, k, p)}, and ${M(q + o + v)} is ${ok ? 'true ✓' : 'false ✗'}`; };
      return E.choiceFixed(`Is ${pt(p, q)} a solution of the system ${sys(iq(L.m1, L.k1, o1), iq(L.m2, L.k2, o2))}?`, ['Yes', 'No'], yes ? 0 : 1,
        `First: ${line(L.m1, L.k1, o1)}. Second: ${line(L.m2, L.k2, o2)}. ${yes ? 'Both hold, so yes.' : 'It must satisfy both, so no.'}`); } } },
    d: { t: 'write the system from a graph', g: R => { const L = twoLines(R, 2, 5), o1 = R.pick(OPS), o2 = R.pick(OPS), S2 = (a, b) => sys(iq(L.m1, L.k1, a), iq(L.m2, L.k2, b));
      const wrong = R.sample([S2(FLIP[o1], o2), S2(o1, FLIP[o2]), S2(FLIP[o1], FLIP[o2]), S2(TOG[o1], o2), S2(o1, TOG[o2])], 3);
      return E.choice(R, 'Which system of inequalities does the graph show?', S2(o1, o2), wrong,
        `The shading is ${above(o1) ? 'above' : 'below'} ${M(Y(L.m1, L.k1))} (${strict(o1) ? 'dashed' : 'solid'}) and ${above(o2) ? 'above' : 'below'} ${M(Y(L.m2, L.k2))} (${strict(o2) ? 'dashed' : 'solid'}).`, { visual: gIneq([{ m: L.m1, k: L.k1, op: o1 }, { m: L.m2, k: L.k2, op: o2 }]) }); } },
    e: { t: 'a point with a parameter', g: R => { for (;;) { const L = twoLines(R, 3, 5), o1 = R.pick(OPS), o2 = R.pick(OPS), vert = R.bool(0.35), ls = [[o1, L.m1, L.k1], [o2, L.m2, L.k2]];
      let fix, cons, lines;
      if (vert) { fix = R.int(-4, 4); cons = ls.map(([o, m, k]) => ({ o, n: m * fix + k, d: 1 })); lines = ls.map(([o, m, k], j) => `${M('k' + o + (m * fix + k))}`); }
      else { if (!L.m1 || !L.m2) continue; fix = R.int(-5, 5); cons = ls.map(([o, m, k]) => ({ o: m > 0 ? FLIP[o] : o, n: (fix - k) * Math.sign(m), d: Math.abs(m) }));
        lines = ls.map(([o, m, k], j) => `${M(fix + o + E.poly([m, k], 'k'))} gives ${M('k' + cons[j].o + fr(cons[j].n, cons[j].d))}`); }
      if (cons.some(c => Math.abs(c.n / c.d) > 8)) continue;
      const v = c => c.n / c.d, lows = cons.filter(c => c.o[0] === '>'), highs = cons.filter(c => c.o[0] === '<');
      const pickB = (arr, better) => arr.reduce((u, w) => !u ? w : better(v(w), v(u)) ? w : v(w) === v(u) ? (w.o.length === 1 ? w : u) : u, null);
      const lo = pickB(lows, (a, b) => a > b), hi = pickB(highs, (a, b) => a < b); if (lo && hi && v(lo) >= v(hi)) continue;
      const iv = `${lo ? (lo.o.length === 2 ? '[' : '(') + fr(lo.n, lo.d) : '(-inf'},${hi ? fr(hi.n, hi.d) + (hi.o.length === 2 ? ']' : ')') : 'inf)'}`;
      const flip = !vert && (L.m1 < 0 || L.m2 < 0) ? ' Dividing by a negative number flips the sign.' : '';
      return E.num(`For which values of k is ${vert ? pt(fix, 'k') : pt('k', fix)} a solution of ${sys(iq(L.m1, L.k1, o1), iq(L.m2, L.k2, o2))}? Answer in interval notation.`, [{ interval: iv }],
        `First: ${lines[0]}. Second: ${lines[1]}.${flip} Both at once: ${E.pt(iv)}.`); } } },
    f: { t: 'count the lattice points', g: R => { for (;;) { const kind = R.int(0, 1); let cons, show;
      if (kind === 0) { const a = R.int(1, 4), b = R.int(1, 4), c = R.int(4, 12), op = R.pick(['<=', '<']); cons = [[1, 0, '>=', 0], [0, 1, '>=', 0], [a, b, op, c]]; show = ['x>=0', 'y>=0', `${joinT([[a, 'x'], [b, 'y']])}${op}${c}`]; }
      else { const m1 = R.int(1, 3), m2 = -R.int(1, 3), x0 = R.int(-2, 2), h = R.int(2, 5), k1 = h - m1 * x0, k2 = h - m2 * x0, o1 = R.pick(['<=', '<']), o2 = R.pick(['<=', '<']), o3 = R.pick(['>=', '>=', '>']);
        cons = [[-m1, 1, o1, k1], [-m2, 1, o2, k2], [0, 1, o3, 0]]; show = [iq(m1, k1, o1), iq(m2, k2, o2), 'y' + o3 + '0']; }
      const cols = []; let N = 0;
      for (let x = -15; x <= 15; x++) { let n = 0; for (let y = -15; y <= 15; y++) if (cons.every(([A, B, o, Cc]) => holds(o, A * x + B * y, Cc))) n++; if (n) { cols.push(`x = ${x}: ${n}`); N += n; } }
      if (N < 5 || N > 40 || cols.length > 9) continue; const sh = R.shuffle(show);
      return E.num(`How many points (x, y) with integer coordinates satisfy all of ${M(sh[0])}, ${M(sh[1])} and ${M(sh[2])}?`, [{ ans: N }],
        `Count one column at a time. ${cols.join(', ')}. Total: ${N}.`); } } },
  });

  /* IV.4.12 Linear programming basics */
  const lpGen = R => { for (;;) { const p = R.int(1, 6), q = R.int(1, 6), X1 = p + R.int(1, 6), Y2 = q + R.int(1, 6);
    let A1 = q, B1 = X1 - p, C1 = q * X1, A2 = Y2 - q, B2 = p, C2 = p * Y2; if (C1 / B1 <= Y2 || C2 / A2 <= X1) continue;
    const g1 = gcd(gcd(A1, B1), C1), g2 = gcd(gcd(A2, B2), C2); A1 /= g1; B1 /= g1; C1 /= g1; A2 /= g2; B2 /= g2; C2 /= g2;
    return { p, q, X1, Y2, A1, B1, C1, A2, B2, C2, V: [[0, 0], [X1, 0], [p, q], [0, Y2]], c1: `${joinT([[A1, 'x'], [B1, 'y']])}<=${C1}`, c2: `${joinT([[A2, 'x'], [B2, 'y']])}<=${C2}` }; } };
  const lpPic = (g, pts = []) => { const W = Math.max(g.X1, g.Y2) + 2, l1 = sf(g.A1, g.B1, g.C1), l2 = sf(g.A2, g.B2, g.C2);
    return V.graph({ x: [-1, W], y: [-1, W], w: 300, h: 300, ticks: 1, fns: [{ f: l1, color: C.blue }, { f: l2, color: C.red }], shade: { f: x => Math.max(0, Math.min(l1(x), l2(x))), g: () => 0, from: 0, to: g.X1 }, points: pts, label: 'feasible region' }); };
  const lpCons = g => `${M('x>=0')}, ${M('y>=0')}, ${M(g.c1)} and ${M(g.c2)}`;
  const LPC = [['A bakery', 'bake', 'cakes', 'pies', 'hours of oven time'], ['A workshop', 'build', 'chairs', 'tables', 'hours of labor'], ['A farm', 'plant', 'acres of corn', 'acres of wheat', 'units of water'], ['A factory', 'assemble', 'phones', 'tablets', 'minutes of testing'], ['A print shop', 'print', 'posters', 'banners', 'liters of ink']];
  S('IV.4.12', 'Linear programming basics', {
    a: { t: 'constraints', g: R => { const [who, vb, i1, i2, res] = R.pick(LPC), intro = `${who} will ${vb} x ${i1} and y ${i2}.`;
      if (R.bool()) { let u1, u2; do { u1 = R.int(2, 7); u2 = R.int(2, 7); } while (u1 === u2); const Lm = R.int(4, 30) * 2;
        return E.choice(R, `${intro} Each of the ${i1} needs ${u1} ${res}, each of the ${i2} needs ${u2}, and only ${Lm} are available. Which constraint fits?`, M(`${joinT([[u1, 'x'], [u2, 'y']])}<=${Lm}`),
          [M(`${joinT([[u1, 'x'], [u2, 'y']])}>=${Lm}`), M(`${joinT([[u2, 'x'], [u1, 'y']])}<=${Lm}`), M(`x+y<=${Lm}`)], `The ${i1} use ${u1}x ${res} and the ${i2} use ${u2}y; together that can't exceed ${Lm}.`); }
      const N = R.int(5, 40);
      return E.choice(R, `${intro} It must ${vb} at least ${N} in total. Which constraint fits?`, M(`x+y>=${N}`), [M(`x+y<=${N}`), M(`x+y>${N}`), `${M('x>=' + N)} and ${M('y>=' + N)}`],
        `"At least ${N}" means the total x + y is ${N} or more, so ≥.`); } },
    b: { t: 'feasible region', g: R => { for (;;) { const g = lpGen(R), W = Math.max(g.X1, g.Y2) + 1, pools = [[], [], [], []];
      for (let x = -1; x <= W; x++) for (let y = -1; y <= W; y++) { const v1 = g.A1 * x + g.B1 * y, v2 = g.A2 * x + g.B2 * y, ok1 = v1 <= g.C1, ok2 = v2 <= g.C2, nn = x >= 0 && y >= 0;
        if (nn && x > 0 && y > 0 && v1 < g.C1 && v2 < g.C2) pools[0].push([x, y]); else if (nn && !ok1 && ok2 && v1 !== g.C1) pools[1].push([x, y]); else if (nn && ok1 && !ok2) pools[2].push([x, y]); else if (!nn && ok1 && ok2) pools[3].push([x, y]); }
      if (pools.some(p => !p.length)) continue; const [P, ...W3] = pools.map(p => R.pick(p));
      return E.choice(R, `The shaded region satisfies ${lpCons(g)}. Which point is in the feasible region?`, pt(...P), W3.map(p => pt(...p)),
        `${pt(...P)} meets every constraint: both coordinates are positive, ${evT([g.A1, g.B1], P)} ≤ ${g.C1}, and ${evT([g.A2, g.B2], P)} ≤ ${g.C2}.`, { visual: lpPic(g) }); } } },
    c: { t: 'vertices', g: R => { const g = lpGen(R), e1 = `${joinT([[g.A1, 'x'], [g.B1, 'y']])}=${g.C1}`, e2 = `${joinT([[g.A2, 'x'], [g.B2, 'y']])}=${g.C2}`;
      if (R.bool(0.7)) return E.num(`The feasible region for ${lpCons(g)} has four vertices. Three are ${pt(0, 0)}, ${pt(g.X1, 0)} and ${pt(0, g.Y2)}. Find the fourth.`, [{ point: [String(g.p), String(g.q)] }],
        `It is where ${M(e1)} and ${M(e2)} meet. Solving them together gives ${pt(g.p, g.q)}.`, { visual: lpPic(g) });
      const onX = R.bool();
      return E.num(`The feasible region for ${lpCons(g)} has a vertex on the ${onX ? 'x' : 'y'}-axis other than the origin. Find it.`, [{ point: onX ? [String(g.X1), '0'] : ['0', String(g.Y2)] }],
        onX ? `Along the x-axis the tighter limit is ${M(g.c1)}: y = 0 gives x = ${g.X1}. (The other line reaches the x-axis farther out.)` : `Along the y-axis the tighter limit is ${M(g.c2)}: x = 0 gives y = ${g.Y2}. (The other line reaches the y-axis higher up.)`, { visual: lpPic(g) }); } },
    d: { t: 'optimize the objective', g: R => { for (;;) { const g = lpGen(R), a = R.int(1, 9), b = R.int(1, 9), vals = g.V.map(([x, y]) => a * x + b * y), best = Math.max(...vals); if (vals.filter(v => v === best).length > 1) continue; const i = vals.indexOf(best);
      return E.num(`Over the region ${lpCons(g)}, maximize ${M(`P=${joinT([[a, 'x'], [b, 'y']])}`)}. Its vertices are ${g.V.map(v => pt(...v)).join(', ')}.`, [{ label: 'at the vertex', point: g.V[i].map(String) }, { label: 'max P =', ans: best }],
        `Check P at every vertex: ${g.V.map((v, j) => `${pt(...v)} → ${vals[j]}`).join(', ')}. The largest is ${best} at ${pt(...g.V[i])}.`, { visual: lpPic(g) }); } } },
    e: { t: 'minimize on an open region', g: R => { for (;;) { const p = R.int(1, 5), q = R.int(1, 5), X1 = p + R.int(1, 6), Y2 = q + R.int(1, 6);
      if ((q - Y2) / p >= -q / (X1 - p)) continue;
      const red = (A, B, Cc) => { const g = gcd(gcd(A, B), Cc); return [A / g, B / g, Cc / g]; }, s1 = red(Y2 - q, p, p * Y2), s2 = red(q, X1 - p, q * X1);
      const Vt = [[0, Y2], [p, q], [X1, 0]]; if (!Vt.every(([x, y]) => s1[0] * x + s1[1] * y >= s1[2] && s2[0] * x + s2[1] * y >= s2[2])) continue;
      const a = R.int(1, 9), b = R.int(1, 9), vals = Vt.map(([x, y]) => a * x + b * y), best = Math.min(...vals); if (vals.filter(v => v === best).length > 1) continue; const i = vals.indexOf(best);
      const c1 = `${joinT([[s1[0], 'x'], [s1[1], 'y']])}>=${s1[2]}`, c2 = `${joinT([[s2[0], 'x'], [s2[1], 'y']])}>=${s2[2]}`, W = Math.max(X1, Y2) + 2, l1 = sf(...s1), l2 = sf(...s2);
      const vis = V.graph({ x: [-1, W], y: [-1, W], w: 300, h: 300, ticks: 1, fns: [{ f: l1, color: C.blue }, { f: l2, color: C.red }], shade: { f: () => W, g: x => Math.min(W, Math.max(0, l1(x), l2(x))), from: 0, to: W }, label: 'unbounded feasible region' });
      return E.num(`Minimize ${M(`C=${joinT([[a, 'x'], [b, 'y']])}`)} subject to ${M('x>=0')}, ${M('y>=0')}, ${M(c1)} and ${M(c2)}. (The region is unbounded, so C has no maximum.)`, [{ label: 'at the vertex', point: Vt[i].map(String) }, { label: 'min C =', ans: best }],
        `The corners are ${pt(0, Y2)} and ${pt(X1, 0)} on the axes, and ${pt(p, q)} where the two lines cross. C there: ${Vt.map((v, j) => `${pt(...v)} → ${vals[j]}`).join(', ')}. The smallest is ${best} at ${pt(...Vt[i])}.`, { visual: vis }); } } },
    f: { t: 'which objectives pick this corner', g: R => { for (;;) { const g = lpGen(R), onX = R.bool(), lo = onX ? [g.Y2 - g.q, g.p] : [g.X1 - g.p, g.q], hi = onX ? [g.q, g.X1 - g.p] : [g.p, g.Y2 - g.q];
      if (lo[0] / lo[1] >= hi[0] / hi[1]) continue; const iv = `[${fr(...lo)},${fr(...hi)}]`, Pf = onX ? 'P=kx+y' : 'P=x+ky', atV = onX ? joinT([[g.p, 'k'], [g.q, '']]) : joinT([[g.q, 'k'], [g.p, '']]);
      const n1 = onX ? `${atV}>=${joinT([[g.X1, 'k']])}` : `${atV}>=${g.X1}`, n2 = onX ? `${atV}>=${g.Y2}` : `${atV}>=${joinT([[g.Y2, 'k']])}`;
      return E.num(`The feasible region ${lpCons(g)} has vertices ${g.V.map(v => pt(...v)).join(', ')}. For which values of k does ${M(Pf)} reach its maximum at ${pt(g.p, g.q)}? Answer in interval notation.`, [{ interval: iv }],
        `P at ${pt(g.p, g.q)} must be at least P at its neighbors ${pt(g.X1, 0)} and ${pt(0, g.Y2)}: ${M(n1)} and ${M(n2)}, so ${E.pt(fr(...lo))} ≤ k ≤ ${E.pt(fr(...hi))}. At either end P ties with a neighbor, which still counts.`, { visual: lpPic(g) }); } } },
  });

  /* IV.4.13 Three-variable systems */
  const sys3 = es => es.map((e, j) => `(${j + 1}) ${M(e)}`).join(', ');
  const s3Gen = (R, pred) => { for (;;) { const s = [R.int(-4, 4), R.int(-4, 4), R.int(-4, 4)], rows = [0, 1, 2].map(() => [R.int(-3, 3), R.int(-3, 3), R.int(-3, 3)]);
    if (rows.some(r => r.filter(Boolean).length < 2)) continue; const det = rows[0][0] * (rows[1][1] * rows[2][2] - rows[1][2] * rows[2][1]) - rows[0][1] * (rows[1][0] * rows[2][2] - rows[1][2] * rows[2][0]) + rows[0][2] * (rows[1][0] * rows[2][1] - rows[1][1] * rows[2][0]);
    if (!det) continue; const eq = rows.map(r => [...r, r[0] * s[0] + r[1] * s[1] + r[2] * s[2]]); if (!pred || pred(eq, s)) return { eq, s, str: eq.map(r => L3(...r)) }; } };
  const VN = ['x', 'y', 'z'];
  S('IV.4.13', 'Three-variable systems', {
    a: { t: 'eliminate to two equations', g: R => { const e = R.int(0, 2), keep = [0, 1, 2].filter(j => j !== e);
      const T = s3Gen(R, eq => eq[0][e] && Math.abs(eq[0][e]) === Math.abs(eq[1][e]) && keep.every(j => eq[0][j] + (eq[0][e] === eq[1][e] ? -1 : 1) * eq[1][j] !== 0));
      const sg = T.eq[0][e] === T.eq[1][e] ? -1 : 1, res = T.eq[0].map((v, j) => v + sg * T.eq[1][j]), ans = `${joinT(keep.map(j => [res[j], VN[j]]))}=${res[3]}`;
      return E.num(`${sys3(T.str)}. ${sg > 0 ? 'Add (1) and (2)' : 'Subtract (2) from (1)'} to eliminate ${VN[e]}. What equation in ${VN[keep[0]]} and ${VN[keep[1]]} do you get?`, [{ eqn: ans }],
        `The ${VN[e]}-coefficients ${sg > 0 ? 'are opposites, so adding' : 'match, so subtracting'} cancels them: ${M(ans)}. Next, eliminate ${VN[e]} from another pair too.`); } },
    b: { t: 'solve the pair', g: R => { const s = sysGen(R, { co: 6, sol: 5, pred: s => Math.abs(s.b1) === Math.abs(s.b2) || Math.abs(s.a1) === Math.abs(s.a2) || lcm(s.b1, s.b2) <= 12 }), z = R.int(-4, 4);
      return E.num(`Eliminating z from a three-variable system left ${sys(L2(s.a1, s.b1, s.c1), L2(s.a2, s.b2, s.c2))}. Solve this pair.`, [{ label: 'x =', ans: s.x }, { label: 'y =', ans: s.y }], elimTxt(s)); } },
    c: { t: 'back-substitute', g: R => { const x = R.int(-5, 5), y = R.int(-5, 5), z = R.int(-5, 5);
      if (R.bool()) { const a = nz(R, -3, 3), b = nz(R, -3, 3), c = nz(R, -3, 3), d = a * x + b * y + c * z;
        return E.num(`In solving a system you found x = ${x} and y = ${y}. Use ${M(L3(a, b, c, d))} to find z.`, [{ label: 'z =', ans: z }], `${evT([a, b], [x, y])}. That leaves ${solv(c, 'z', d - a * x - b * y, z)}.`); }
      const a1 = nz(R, -3, 3), b1 = nz(R, -3, 3), d1 = a1 * x + b1 * y, a = nz(R, -3, 3), b = nz(R, -3, 3), c = nz(R, -3, 3), d = a * x + b * y + c * z;
      return E.num(`You found x = ${x}. Use ${M(L2(a1, b1, d1))} to find y, then ${M(L3(a, b, c, d))} to find z.`, [{ label: 'y =', ans: y }, { label: 'z =', ans: z }],
        `${solv(b1, 'y', d1 - a1 * x, y)}. Then ${evT([a, b], [x, y])}, which leaves ${solv(c, 'z', d - a * x - b * y, z)}.`); } },
    d: { t: 'check all three', g: R => { const T = s3Gen(R), yes = R.bool(); let P = T.s.slice();
      if (!yes) { for (let tries = 0; ; tries++) { const [i, j] = R.sample([0, 1, 2], 2), n1 = T.eq[i], n2 = T.eq[j]; let d = [n1[1] * n2[2] - n1[2] * n2[1], n1[2] * n2[0] - n1[0] * n2[2], n1[0] * n2[1] - n1[1] * n2[0]]; const g = gcd(gcd(d[0], d[1]), d[2]); d = d.map(v => v / g);
        const sg = R.pick([1, -1]), Q = T.s.map((v, k) => v + d[k] * sg); if (Q.every(v => Math.abs(v) <= 12)) { P = Q; break; } if (tries > 20) { P = T.s.map((v, k) => v + (k === R.int(0, 2) ? 1 : 0)); if (P.some((v, k) => v !== T.s[k])) break; } } }
      const lines = T.eq.map((r, k) => { const v = r[0] * P[0] + r[1] * P[1] + r[2] * P[2]; return `(${k + 1}) ${evT(r.slice(0, 3), P)}${v === r[3] ? ' ✓' : `, not ${r[3]} ✗`}`; });
      return E.choiceFixed(`Is ${'(' + P.join(', ') + ')'} a solution of ${sys3(T.str)}?`, ['Yes', 'No'], yes ? 0 : 1, `${lines.join('. ')}. ${yes ? 'All three check, so yes.' : 'A solution must satisfy all three equations, so no.'}`); } },
    e: { t: 'each equation misses a variable', g: R => { let a1, b1, b2, c2, a3, c3, x, y, z;
      do { [a1, b1, b2, c2, a3, c3] = [0, 0, 0, 0, 0, 0].map(() => nz(R, -3, 3)); x = R.int(-5, 5); y = R.int(-5, 5); z = R.int(-5, 5); } while (a1 * b2 * c3 + b1 * c2 * a3 === 0);
      const r1 = L2(a1, b1, a1 * x + b1 * y), r2 = `${joinT([[b2, 'y'], [c2, 'z']])}=${b2 * y + c2 * z}`, r3 = `${joinT([[a3, 'x'], [c3, 'z']])}=${a3 * x + c3 * z}`;
      let ny = a3 * b1, nz2 = -a1 * c3, nr = a3 * (a1 * x + b1 * y) - a1 * (a3 * x + c3 * z); const g = gcd(gcd(ny, nz2), nr) || 1; ny /= g; nz2 /= g; nr /= g;
      return E.num(`Solve ${sys3(R.shuffle([r1, r2, r3]))}.`, [{ label: 'x =', ans: x }, { label: 'y =', ans: y }, { label: 'z =', ans: z }],
        `Remove x from the two equations that contain it: ${M(`${joinT([[ny, 'y'], [nz2, 'z']])}=${nr}`)}. Solve that with ${M(r2)}: y = ${y} and z = ${z}. Then ${M(r1)} gives x = ${x}.`); } },
    f: { t: 'add them all', g: R => { if (R.bool()) { for (;;) { const p = R.int(1, 5), q = R.int(-3, 5), r = R.int(-3, 5), S0 = p + q + r; if (!q || !r || S0 <= 0 || (p === q && q === r)) continue;
        const s = R.int(-6, 9), A = R.int(-20, 20), B = R.int(-20, 20), Cc = S0 * s - A - B; if (Math.abs(Cc) > 30) continue;
        const rows = [[p, q, r, A], [r, p, q, B], [q, r, p, Cc]].map(t => L3(...t));
        return E.num(`${sys3(rows)}. Find ${M('x+y+z')}.`, [{ label: 'x + y + z =', ans: s }],
          `Add all three: each variable appears with total coefficient ${p} + ${P(q)} + ${P(r)} = ${S0}, so ${M(`${S0}(x+y+z)=${A + B + Cc}`)} and x + y + z = ${s}.`); } }
      const [a, b, c, d] = [0, 0, 0, 0].map(() => R.int(-5, 9)), Ps = [a + b + c, b + c + d, c + d + a, d + a + b], tot = a + b + c + d;
      return E.num(`Solve ${M(`a+b+c=${Ps[0]}`)}, ${M(`b+c+d=${Ps[1]}`)}, ${M(`c+d+a=${Ps[2]}`)}, ${M(`d+a+b=${Ps[3]}`)}.`, [{ label: 'a =', ans: a }, { label: 'b =', ans: b }, { label: 'c =', ans: c }, { label: 'd =', ans: d }],
        `Add all four: each letter appears three times, so 3(a + b + c + d) = ${3 * tot} and a + b + c + d = ${tot}. Each equation leaves out one letter: d = ${tot} − ${P(Ps[0])} = ${d}, a = ${tot} − ${P(Ps[1])} = ${a}, b = ${tot} − ${P(Ps[2])} = ${b}, c = ${tot} − ${P(Ps[3])} = ${c}.`); } },
  });

  /* IV.4.14 Linear–quadratic systems */
  const lqGen = (R, kind) => { for (;;) { const a = R.pick([1, -1]), m = R.int(-3, 3), k = R.int(-4, 4); let d;
    const r = R.int(-3, 2), s = kind === 0 ? r + R.int(1, 4) : r, qq = R.int(1, 4);
    d = kind === 0 ? [a, -a * (r + s), a * r * s] : kind === 1 ? [a, -2 * a * r, a * r * r] : [a, -2 * a * r, a * (r * r + qq)];
    const b = m + d[1], c = k + d[2], f = x => a * x * x + b * x + c, h = -b / (2 * a); if (Math.abs(c) > 7 || Math.abs(f(h)) > 7 || Math.abs(h) > 4) continue;
    return { a, b, c, m, k, r, s, d, f, par: 'y=' + E.poly([a, b, c]), line: Y(m, k), D: d[1] * d[1] - 4 * d[0] * d[2] }; } };
  const lqPic = (g, o = {}) => V.graph({ x: [-6, 6], y: [-8, 8], w: o.w || 300, h: o.h || 300, ticks: 1, labels: o.labels, fns: [{ f: g.f, color: C.blue }, { f: lf(g.m, g.k), color: C.red }], label: 'a parabola and a line' });
  S('IV.4.14', 'Linear–quadratic systems', {
    a: { t: 'sketch a line and a parabola', g: R => { const g = lqGen(R, 0), sm = (a, b, c, m, k) => lqPic({ f: x => a * x * x + b * x + c, m, k }, { w: 180, h: 180, labels: false }), right = sm(g.a, g.b, g.c, g.m, g.k);
      const alts = [[-g.a, g.b, g.c, g.m, g.k], [g.a, g.b, g.c, -g.m || 2, g.k], [g.a, g.b, g.c, g.m, g.k + (g.k > 0 ? -4 : 4)], [g.a, -g.b || 2, g.c, g.m, g.k], [g.a, g.b, g.c + (g.c > 0 ? -4 : 4), g.m, g.k]];
      const wrong = [...new Set(alts.map(v => sm(...v)))].filter(s => s !== right);
      return E.choice(R, `Which graph shows ${sys(g.par, g.line)}?`, right, R.sample(wrong, 3),
        `The parabola opens ${g.a > 0 ? 'up' : 'down'} with y-intercept ${g.c}; the line has slope ${g.m} and y-intercept ${g.k}. They meet at x = ${g.r} and x = ${g.s}.`); } },
    b: { t: 'substitute', g: R => { const g = lqGen(R, R.int(0, 2)), eq = E.poly(g.d) + '=0';
      return E.num(`Substitute ${M(g.line)} into ${M(g.par)}. Write the result as an equation of the form ${M('ax^2+bx+c=0')}.`, [{ eqn: eq }],
        `Set the two expressions for y equal: ${M(E.poly([g.a, g.b, g.c]) + '=' + E.poly([g.m, g.k]))}, then move everything to one side: ${M(eq)}.`); } },
    c: { t: '0, 1 or 2 solutions', g: R => { const kind = R.int(0, 2), g = lqGen(R, kind), eq = E.poly(g.d) + '=0', pic = R.bool(0.4);
      return E.choiceFixed(`How many solutions does the system ${sys(g.par, g.line)} have?`, ['two', 'one', 'none'], kind,
        `Substituting gives ${M(eq)}, with discriminant ${g.D}: ${['positive, so the line crosses the parabola twice', 'zero, so the line just touches it', 'negative, so they never meet'][kind]}.`, pic ? { visual: lqPic(g) } : {}); } },
    d: { t: 'solve and check', g: R => { const g = lqGen(R, 0), fac = `${g.a < 0 ? '-' : ''}${E.lin(g.r)}${E.lin(g.s)}`, y1 = g.m * g.r + g.k, y2 = g.m * g.s + g.k;
      return E.num(`Solve the system ${sys(g.par, g.line)}.`, [{ label: 'left point', point: [String(g.r), String(y1)] }, { label: 'right point', point: [String(g.s), String(y2)] }],
        `Substitute: ${M(E.poly(g.d) + '=0')}, which factors as ${M(fac + '=0')}, so x = ${g.r} or x = ${g.s}. Each x gets its own y from the line: ${pt(g.r, y1)} and ${pt(g.s, y2)}.`); } },
    e: { t: 'find the value that makes it touch', g: R => { const sgT = v => v < 0 ? `+ ${-v}` : `− ${v}`;
      if (R.bool()) { let a, b, c, m; do { a = R.pick([1, -1]); b = R.int(-4, 4); c = R.int(-5, 5); m = R.int(-3, 3); } while ((b - m) % 2 || b === m); const k = c - a * (b - m) * (b - m) / 4, par = 'y=' + E.poly([a, b, c]);
        return E.num(`For what value of k does the line ${M('y=' + joinT([[m, 'x'], [1, 'k']]))} meet the parabola ${M(par)} at exactly one point?`, [{ label: 'k =', ans: k }],
          `Setting them equal gives ${M(`${E.poly([a, b - m, c])}-k=0`)}. One meeting point means the discriminant is 0: ${E.pt(`(${b - m})^2 - 4(${a})(${c} - k) = 0`)}, so k = ${k}.`); }
      const a = R.pick([1, -1]), b = R.int(-4, 4), c = R.int(-5, 5), j = R.int(1, 3), k0 = c - a * j * j, par = 'y=' + E.poly([a, b, c]);
      return E.num(`For which values of m does the line ${M('y=' + joinT([[1, 'mx'], [k0, '']]))} meet the parabola ${M(par)} at exactly one point?`, [{ label: 'm =', set: [String(b + 2 * j), String(b - 2 * j)] }],
        `Setting them equal gives a quadratic with discriminant (${b} − m)² − 4(${a})(${c - k0}). Set it to 0: (m ${sgT(b)})² = ${4 * j * j}, so m ${sgT(b)} = ±${2 * j} and m = ${b + 2 * j} or ${b - 2 * j}.`.replace('(0 − m)', '(−m)').replace('(m − 0)', 'm')); } },
    f: { t: 'the midpoint without the points', g: R => { for (;;) { const a = R.pick([1, 1, -1, 2]), b = R.int(-5, 5), c = R.int(-6, 6), m = nz(R, -4, 4), k = R.int(-6, 6), B = b - m, Cc = c - k, D = B * B - 4 * a * Cc;
      if (D <= 0 || (Number.isInteger(Math.sqrt(D)) && R.bool(0.8))) continue; const xm = fr(-B, 2 * a), ym = fr(-m * B + 2 * a * k, 2 * a);
      return E.num(`The line ${M(Y(m, k))} crosses the parabola ${M('y=' + E.poly([a, b, c]))} at two points. Find the midpoint of the segment joining them.`, [{ point: [xm, ym] }],
        `Setting them equal gives ${M(E.poly([a, B, Cc]) + '=0')}. Its two roots sit symmetrically about ${M(`x=-b/(2a)`)} = ${E.pt(xm)}, so that is their average, with no need to find them. The midpoint is on the line: y = ${m === 1 ? '' : m === -1 ? '−' : m + ' × '}${/^[−-]/.test(E.pt(xm)) || (m !== 1 && m !== -1) ? '(' + E.pt(xm) + ')' : E.pt(xm)}${k ? ` ${k < 0 ? '−' : '+'} ${Math.abs(k)}` : ''} = ${E.pt(ym)}.`); } } },
  });

  /* IV.4.15 Matrices for systems */
  const mn = v => v < 0 ? `<mrow><mo>−</mo><mn>${-v}</mn></mrow>` : `<mn>${v}</mn>`;
  const mat = rows => `<math><mrow><mo>[</mo><mtable>${rows.map(r => '<mtr>' + r.map((v, j) => (j === r.length - 1 ? '<mtd><mo>|</mo></mtd> ' : '') + `<mtd>${mn(v)}</mtd>`).join(' ') + '</mtr>').join(' ')}</mtable><mo>]</mo></mrow></math>`;
  const rowT = r => `${r.slice(0, -1).join(', ')} | ${r[r.length - 1]}`;
  const opT = (i, k, j) => `R${'₀₁₂₃'[i]} → R${'₀₁₂₃'[i]} ${k < 0 ? '−' : '+'} ${Math.abs(k) === 1 ? '' : Math.abs(k)}R${'₀₁₂₃'[j]}`;
  S('IV.4.15', 'Matrices for systems', {
    a: { t: 'write the augmented matrix', g: R => { const s = sysGen(R, { co: 6, sol: 5, pred: s => s.c1 && s.c2 && [s.a1, s.b1, s.a2, s.b2].some(v => v < 0) && s.a1 !== s.b1 }), rows = [[s.a1, s.b1, s.c1], [s.a2, s.b2, s.c2]];
      const f = [R.int(0, 2), R.int(0, 2)], show = ([a, b, c], k) => k === 0 ? L2(a, b, c) : k === 1 ? `${joinT([[b, 'y'], [a, 'x']])}=${c}` : `${joinT([[a, 'x']])}=${joinT([[c, ''], [-b, 'y']])}`;
      const cands = [rows.map(r => [r[0], r[1], -r[2]]), [[s.a1, s.b1, -s.c1], rows[1]], rows.map(r => [r[1], r[0], r[2]]), rows.map(r => [Math.abs(r[0]), Math.abs(r[1]), r[2]]), [[s.a1, -s.b1, s.c1], rows[1]], [rows[0], [s.a2, -s.b2, s.c2]]].map(mat);
      const right = mat(rows), wrong = [...new Set(cands)].filter(m => m !== right);
      return E.choice(R, `Which augmented matrix represents ${sys(show(rows[0], f[0]), show(rows[1], f[1]))}?`, right, R.sample(wrong, 3),
        `Line up x, then y, then the constant: row 1 is ${rowT(rows[0])} and row 2 is ${rowT(rows[1])}.`); } },
    b: { t: 'row operations', g: R => { const A = [[nz(R, -5, 5), R.int(-6, 6), R.int(-9, 9)], [nz(R, -5, 5), R.int(-6, 6), R.int(-9, 9)]], i = R.bool(0.7) ? 1 : 0, j = 1 - i, k = nz(R, -4, 4), nr = A[i].map((v, c) => v + k * A[j][c]);
      const P = v => v < 0 ? `(${v})` : v, step = c => `${A[i][c]} ${k < 0 ? '−' : '+'} ${Math.abs(k)}·${P(A[j][c])} = ${nr[c]}`;
      return E.num(`Apply ${opT(i + 1, k, j + 1)} to ${mat(A)}. What is the new row ${i + 1}?`, [{ label: 'first entry =', ans: nr[0] }, { label: 'second entry =', ans: nr[1] }, { label: 'last entry =', ans: nr[2] }],
        `Change the whole row, constant too: ${step(0)}; ${step(1)}; ${step(2)}.`); } },
    c: { t: 'row echelon form', g: R => { let A, k; do { const a = R.pick([1, 1, 1, 2, -1, 3]); A = [[a, nz(R, -5, 5), R.int(-9, 9)], [a * nz(R, -4, 4), R.int(-6, 6), R.int(-9, 9)]]; k = -A[1][0] / A[0][0]; } while (A[1][1] + k * A[0][1] === 0);
      const nr = A[1].map((v, c) => v + k * A[0][c]);
      return E.num(`To reach row echelon form for ${mat(A)}, use R₂ → R₂ + kR₁ to make the entry below ${A[0][0]} zero. Find k and the new row 2.`, [{ label: 'k =', ans: k }, { label: 'new second entry =', ans: nr[1] }, { label: 'new last entry =', ans: nr[2] }],
        `${A[0][0]} × ${P(k)} = ${-A[1][0]} cancels the ${A[1][0]} below it, so k = ${k}. Then ${A[1][1]} + ${k < 0 ? '(' + k + ')' : k}·${A[0][1] < 0 ? '(' + A[0][1] + ')' : A[0][1]} = ${nr[1]} and ${A[1][2]} + ${k < 0 ? '(' + k + ')' : k}·${A[0][2] < 0 ? '(' + A[0][2] + ')' : A[0][2]} = ${nr[2]}, so row 2 is 0, ${nr[1]} | ${nr[2]}.`); } },
    d: { t: 'read the solution', g: R => { const x = R.int(-6, 6), y = R.int(-6, 6), z = R.int(-6, 6);
      if (R.bool(0.4)) { const a = nz(R, -4, 4), b = nz(R, -3, 3), d = nz(R, -3, 3), A = [[1, a, b, x + a * y + b * z], [0, 1, d, y + d * z], [0, 0, 1, z]];
        return E.num(`The augmented matrix ${mat(A)} is in row echelon form. Solve the system.`, [{ label: 'x =', ans: x }, { label: 'y =', ans: y }, { label: 'z =', ans: z }],
          `Back-substitute from the bottom: z = ${z}; y + ${d < 0 ? '(' + d + ')' : d}(${z}) = ${A[1][3]} gives y = ${y}; x + ${a < 0 ? '(' + a + ')' : a}(${y}) + ${b < 0 ? '(' + b + ')' : b}(${z}) = ${A[0][3]} gives x = ${x}.`); }
      const a = nz(R, -5, 5), A = [[1, a, x + a * y], [0, 1, y]];
      return E.num(`The augmented matrix ${mat(A)} is in row echelon form. Solve the system.`, [{ label: 'x =', ans: x }, { label: 'y =', ans: y }],
        `Row 2 says y = ${y}. Row 1 says x + ${a < 0 ? '(' + a + ')' : a}y = ${A[0][2]}, so x = ${A[0][2]} − ${a < 0 ? '(' + a + ')' : a}(${y}) = ${x}.`); } },
  });
})(typeof window !== 'undefined' ? window : globalThis);
