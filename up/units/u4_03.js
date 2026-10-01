/* Era IV · Unit IV.3 Linear functions (IV.3.01–IV.3.09) */
(function (G) {
  const E = G.E4, V = E.V, C = E.C, M = s => E.mx(s);
  const S = (id, name, steps) => E.skill({ id, name, steps });
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
  const nz = (R, lo, hi) => { let v; do v = R.int(lo, hi); while (v === 0); return v; };
  // rationals as [n, d], d > 0, reduced
  const fr = (n, d = 1) => { if (d < 0) { n = -n; d = -d; } const k = gcd(n, d) || 1; return [n / k, d / k]; };
  const RV = v => Array.isArray(v) ? v : [v, 1];
  const fs = m => { m = RV(m); return m[1] === 1 ? String(m[0]) : `${m[0]}/${m[1]}`; };
  const fv = m => { m = RV(m); return m[0] / m[1]; };
  const radd = (a, b) => { a = RV(a); b = RV(b); return fr(a[0] * b[1] + b[0] * a[1], a[1] * b[1]); };
  const rmul = (a, b) => { a = RV(a); b = RV(b); return fr(a[0] * b[0], a[1] * b[1]); };
  const req = (a, b) => { a = RV(a); b = RV(b); return a[0] * b[1] === b[0] * a[1]; };
  const recipNeg = m => { m = RV(m); return fr(-m[1], m[0]); };
  // pieces of ASCII equations
  const cx = (m, v) => { const [n, d] = RV(m); if (!n) return ''; if (d === 1) return n === 1 ? v : n === -1 ? '-' + v : n + v; return `${n}/${d}${v}`; };
  const tm = (c, v) => v ? cx(c, v) : (RV(c)[0] ? fs(c) : '');
  const tsum = arr => { let s = ''; for (const t of arr) if (t) s += s && !t.startsWith('-') ? '+' + t : t; return s || '0'; };
  const sh = (v, n) => n === 0 ? v : n > 0 ? `${v}-${n}` : `${v}+${-n}`;             // "x-2", "y+3"
  const si = (m, b) => 'y=' + tsum([tm(m, 'x'), tm(b)]);                          // slope-intercept
  const ps = (m, x1, y1) => { const [n, d] = RV(m); let r;                         // point-slope
    if (x1 === 0) r = cx(m, 'x') || '0';
    else { const inner = `(${sh('x', x1)})`; r = d === 1 ? (n === 1 ? sh('x', x1) : n === -1 ? '-' + inner : n + inner) : `${n}/${d}${inner}`; }
    return `${sh('y', y1)}=${r}`; };
  const std = (A, B, Cc) => `${tsum([tm(A, 'x'), tm(B, 'y')])}=${Cc}`;
  const normStd = (A, B, Cc) => { const g = gcd(gcd(A, B), Cc) || 1; A /= g; B /= g; Cc /= g; if (A < 0 || (A === 0 && B < 0)) { A = -A; B = -B; Cc = -Cc; } return [A + 0, B + 0, Cc + 0]; };
  const stdOf = (m, b) => { const [n, d] = RV(m); return normStd(-n, d, d * b); };      // y = (n/d)x + b with integer b
  const P = (x, y) => `(${x}, ${y})`;
  const par = n => n < 0 ? `(${n})` : String(n);
  const mS = m => RV(m)[1] === 1 ? String(RV(m)[0]) : M(fs(m));                      // slope for text
  const sf = m => { m = RV(m); return m[1] === 1 ? { ans: m[0] } : { frac: [m[0], m[1]] }; };
  const rs = (R, pf = 0.35, top = 5) => { if (R.bool(pf)) { const d = R.pick([2, 3, 4]); let n; do n = nz(R, -top, top); while (gcd(n, d) !== 1); return [n, d]; } return [nz(R, -top, top), 1]; };
  const lineStr = (m, b) => si(m, b).slice(2);
  // small line pictures for "which graph" questions
  const lineSvg = (f, pts = [], lab = 'line') => V.graph({ x: [-6, 6], y: [-6, 6], w: 190, h: 190, ticks: 1, labels: false, fns: [{ f, color: C.blue }], points: pts, label: lab });
  const pickGraphs = (R, right, cands) => { const seen = new Set([right]), out = []; for (const s of R.shuffle(cands)) if (!seen.has(s)) { seen.add(s); out.push(s); } return out.slice(0, 3); };
  const bigGraph = o => V.graph(Object.assign({ x: [-6, 6], y: [-6, 6], w: 260, h: 260, ticks: 1 }, o));
  // brave-step helpers: expressions linear in k
  const lk = (a, b) => tsum([tm(a, 'k'), tm(b)]);                                     // "2k-3"
  const pk = p => p ? `(${lk(1, p)})` : 'k';                                          // "(k+3)" or "k"
  const kco = (a, b, v) => a && b ? `(${lk(a, b)})${v}` : a ? cx(a, 'k' + v) : tm(b, v); // coefficient (ak+b) on v
  const ivl = (op, v) => ({ '<': `(-inf,${v})`, '<=': `(-inf,${v}]`, '>': `(${v},inf)`, '>=': `[${v},inf)` })[op];

  /* IV.3.01 Point-slope form */
  S('IV.3.01', 'Point-slope form', {
    a: { t: 'meaning of y − y₁ = m(x − x₁)', g: R => { const m = rs(R), x1 = nz(R, -8, 8), y1 = nz(R, -8, 8);
      return E.num(`Compare ${M(ps(m, x1, y1))} with y − y₁ = m(x − x₁). What is the slope m, and what is the point (x₁, y₁)?`, [{ label: 'm =', ...sf(m) }, { label: '(x₁, y₁) =', point: [String(x1), String(y1)] }],
        `m = ${mS(m)}. The signs in the brackets flip: ${M(sh('y', y1))} means y₁ = ${y1} and ${M(sh('x', x1))} means x₁ = ${x1}, so the point is ${P(x1, y1)}.`); } },
    b: { t: 'write from a point and slope', g: R => { const m = rs(R), x1 = R.int(-8, 8), y1 = R.int(-8, 8);
      return E.num(`Write an equation in point-slope form for the line through ${P(x1, y1)} with slope ${mS(m)}.`, [{ eqn: ps(m, x1, y1) }],
        `Put m = ${mS(m)}, x₁ = ${x1} and y₁ = ${y1} into y − y₁ = m(x − x₁): ${M(ps(m, x1, y1))}.`); } },
    c: { t: 'write from two points', g: R => { let x1, y1, dx, dy; do { x1 = R.int(-6, 6); y1 = R.int(-6, 6); dx = nz(R, -6, 6); dy = nz(R, -8, 8); } while (Math.abs(x1 + dx) > 8 || Math.abs(y1 + dy) > 9);
      const x2 = x1 + dx, y2 = y1 + dy, m = fr(dy, dx);
      return E.num(`A line passes through ${P(x1, y1)} and ${P(x2, y2)}. Find its slope, then write its equation in point-slope form.`, [{ label: 'slope =', ...sf(m) }, { label: 'equation:', eqn: ps(m, x1, y1) }],
        `${M(`m=(${y2}-${par(y1)})/(${x2}-${par(x1)})=${fs(m)}`)}. Using ${P(x1, y1)}: ${M(ps(m, x1, y1))}. Using the other point gives an equivalent equation.`); } },
    d: { t: 'graph from it', g: R => { const m = R.pick([1, -1, 2, -2, 3, -3, [1, 2], [-1, 2], [2, 3], [-2, 3], [3, 2], [-3, 2]]); let x1, y1;
      do { x1 = nz(R, -4, 4); y1 = nz(R, -4, 4); } while (req(y1, rmul(m, x1)) || Math.abs(fv(m) * (0 - x1) + y1) > 9);
      const mk = (s, a, b) => lineSvg(x => fv(s) * (x - a) + b, [[a, b]]);
      const right = mk(m, x1, y1), cands = [mk(m, -x1, -y1), mk(fr(-RV(m)[0], RV(m)[1]), x1, y1), mk(fr(RV(m)[1], RV(m)[0]), x1, y1), mk(fr(-RV(m)[0], RV(m)[1]), -x1, -y1)];
      return E.choice(R, `Which graph shows ${M(ps(m, x1, y1))}?`, right, pickGraphs(R, right, cands),
        `Plot the point ${P(x1, y1)} (the signs flip), then use slope ${mS(m)}: ${RV(m)[1] === 1 ? `${Math.abs(RV(m)[0])} ${RV(m)[0] > 0 ? 'up' : 'down'} for every 1 right` : `${Math.abs(RV(m)[0])} ${RV(m)[0] > 0 ? 'up' : 'down'} for every ${RV(m)[1]} right`}.`); } },
    e: { t: 'run it backwards: the missing value', g: R => {
      if (R.bool()) { let x1, y1, dx, dy; do { x1 = nz(R, -6, 6); y1 = nz(R, -6, 6); dx = nz(R, -6, 6); dy = nz(R, -9, 9); } while (Math.abs(x1 + dx) > 9 || Math.abs(y1 + dy) > 9);
        const x2 = x1 + dx, y2 = y1 + dy, m = fr(dy, dx);
        return E.num(`The line ${M(`${sh('y', y1)}=k(${sh('x', x1)})`)} passes through ${P(x2, y2)}. Find k.`, [{ label: 'k =', ...sf(m) }],
          `Substitute the point: ${M(`${sh(String(y2), y1)}=k(${sh(String(x2), x1)})`)}, so ${M(`${dy}=${cx(dx, 'k')}`)} and k = ${mS(m)}.`); }
      let x1, y1, x2, y2, x3, t, m, j; do { x1 = R.int(-6, 6); y1 = R.int(-6, 6); const dx = nz(R, -4, 4), dy = nz(R, -6, 6); x2 = x1 + dx; y2 = y1 + dy; m = fr(dy, dx); j = nz(R, -3, 3); x3 = x1 + m[1] * j; t = y1 + m[0] * j; }
      while (x3 === x2 || Math.abs(x2) > 9 || Math.abs(y2) > 9 || Math.abs(x3) > 9 || Math.abs(t) > 12);
      return E.num(`The points ${P(x1, y1)}, ${P(x2, y2)} and ${P(x3, 't')} all lie on one line. Find t.`, [{ label: 't =', ans: t }],
        `The slope is ${M(`(${y2}-${par(y1)})/(${x2}-${par(x1)})=${fs(m)}`)}, so the line is ${M(ps(m, x1, y1))}. At x = ${x3}: t = ${y1} + ${fs(m)} × ${par(x3 - x1)} = ${t}.`); } },
    f: { t: 'a family through one point', g: R => { let X, Y, p, q, r, s, t;
      do { X = R.int(-5, 5); Y = R.int(-5, 5); p = R.int(-4, 4); q = nz(R, -3, 3); r = nz(R, -4, 4); s = X + q * Y; t = p * X + r * Y; } while (r === p * q || (X === 0 && Y === 0) || Math.abs(t) > 20 || Math.abs(s) > 15);
      const eq = `${tsum([kco(1, p, 'x'), kco(q, r, 'y')])}=${lk(s, t)}`;
      return E.num(`For every value of k, the line ${M(eq)} passes through the same point. Find that point.`, [{ point: [String(X), String(Y)] }],
        `Collect the k-terms: ${M(`k(${tsum(['x', tm(q, 'y'), tm(-s)])})+(${tsum([tm(p, 'x'), tm(r, 'y'), tm(-t)])})=0`)}. This holds for every k only if both brackets are 0: ${M(tsum(['x', tm(q, 'y')]) + '=' + s)} and ${M(tsum([tm(p, 'x'), tm(r, 'y')]) + '=' + t)}, giving ${P(X, Y)}.`); } },
  });

  /* IV.3.02 Standard form */
  S('IV.3.02', 'Standard form', {
    a: { t: 'Ax + By = C', g: R => { let A, B, Cc; do { A = R.int(1, 6); B = nz(R, -6, 6); Cc = R.int(-12, 12); } while (gcd(gcd(A, B), Cc) !== 1);
      const k = R.pick([1, 1, 1, 2, 3, -1]), shape = R.int(0, 3);
      const eq = [`${tm(k * B, 'y')}=${tsum([tm(-k * A, 'x'), tm(k * Cc)])}`, `${tm(k * A, 'x')}=${tsum([tm(k * Cc), tm(-k * B, 'y')])}`,
        `${tsum([tm(k * A, 'x'), tm(k * B, 'y'), tm(-k * Cc)])}=0`, `${tsum([tm(k * B, 'y'), tm(k * A, 'x')])}=${k * Cc}`][shape];
      return E.num(`Write ${M(eq)} in standard form ${M('Ax+By=C')}, using integers with no common factor and ${M('A>0')}. What are A, B and C?`, [{ label: 'A =', ans: A }, { label: 'B =', ans: B }, { label: 'C =', ans: Cc }],
        `Put the x- and y-terms on the left and the number on the right${k === -1 ? ', then multiply by −1' : k > 1 ? ', then divide by ' + k : ''}: ${M(std(A, B, Cc))}.`); } },
    b: { t: 'intercepts from standard form', g: R => { const a = nz(R, -9, 9), b = nz(R, -9, 9), [A, B, Cc] = normStd(b, a, a * b);
      return E.num(`Find the intercepts of ${M(std(A, B, Cc))}. Give them as points.`, [{ label: 'x-intercept', point: [String(a), '0'] }, { label: 'y-intercept', point: ['0', String(b)] }],
        `Set y = 0: ${M(`${tm(A, 'x')}=${Cc}`)}, so x = ${a}. Set x = 0: ${M(`${tm(B, 'y')}=${Cc}`)}, so y = ${b}. Don't just read off the coefficients.`); } },
    c: { t: 'graph by intercepts', g: R => { let a, b; do { a = nz(R, -6, 6); b = nz(R, -6, 6); } while (Math.abs(a) === Math.abs(b));
      const [A, B, Cc] = normStd(b, a, a * b), mk = (p, q) => lineSvg(x => q - q / p * x, [[p, 0], [0, q]]);
      const cands = [[A, B], [b, a], [-a, b], [a, -b]].filter(([p, q]) => p && q && Math.abs(p) <= 6 && Math.abs(q) <= 6).map(([p, q]) => mk(p, q)), right = mk(a, b);
      return E.choice(R, `Which graph shows ${M(std(A, B, Cc))}?`, right, pickGraphs(R, right, cands),
        `Set y = 0 to get x = ${a}, and x = 0 to get y = ${b}. Join ${P(a, 0)} and ${P(0, b)}.`); } },
    d: { t: 'budget and combination contexts', g: R => {
      const items = R.pick([[['adult ticket', 'adult tickets'], ['child ticket', 'child tickets']], [['notebook', 'notebooks'], ['pen', 'pens']], [['large pizza', 'large pizzas'], ['small pizza', 'small pizzas']],
        [['T-shirt', 'T-shirts'], ['cap', 'caps']], [['bag of rice', 'bags of rice'], ['bag of beans', 'bags of beans']], [['plant', 'plants'], ['pot', 'pots']]]);
      let p, q; do { p = R.int(2, 12); q = R.int(2, 12); } while (p === q);
      const g = gcd(p, q), k = R.int(2, 4), T = p * q / g * k, X = T / p, Y = T / q, [n1, n2] = items, nm = (n, w) => n === 1 ? w[0] : w[1];
      const intro = `${n1[1][0].toUpperCase() + n1[1].slice(1)} cost $${p} each and ${n2[1]} cost $${q} each.`, type = R.int(0, 3);
      if (type === 0) return E.num(`${intro} Write an equation for buying x ${n1[1]} and y ${n2[1]} for exactly $${T}.`, [{ eqn: `${p}x+${q}y=${T}` }],
        `Cost of ${n1[1]} plus cost of ${n2[1]} is the total: ${M(`${p}x+${q}y=${T}`)}.`);
      if (type === 1) { const x0 = R.int(1, k - 1) * (q / g), y0 = (T - p * x0) / q;
        return E.num(`${intro} You spend exactly $${T} and buy ${x0} ${nm(x0, n1)}. How many ${n2[1]} do you buy?`, [{ ans: y0 }], `${M(`${p}(${x0})+${q}y=${T}`)} gives ${M(`${q}y=${T - p * x0}`)}, so y = ${y0}.`); }
      if (type === 2) return E.num(`${intro} With exactly $${T}, how many ${n1[1]} can you buy if you buy no ${n2[1]}? (This is an intercept of ${M(`${p}x+${q}y=${T}`)}.)`, [{ ans: X }],
        `Set y = 0: ${M(`${p}x=${T}`)}, so x = ${X}. That is the x-intercept ${P(X, 0)}.`);
      return E.num(`${intro} With exactly $${T}, how many ${n2[1]} can you buy if you buy no ${n1[1]}? (This is an intercept of ${M(`${p}x+${q}y=${T}`)}.)`, [{ ans: Y }],
        `Set x = 0: ${M(`${q}y=${T}`)}, so y = ${Y}. That is the y-intercept ${P(0, Y)}.`); } },
    e: { t: 'run it backwards', g: R => {
      if (R.bool()) { let a, b; do { a = nz(R, -9, 9); b = nz(R, -9, 9); } while (Math.abs(a) === Math.abs(b) && R.bool(0.7)); const [A, B, Cc] = normStd(b, a, a * b);
        return E.num(`A line has x-intercept ${P(a, 0)} and y-intercept ${P(0, b)}. Write it in standard form ${M('Ax+By=C')}, using integers with no common factor and ${M('A>0')}. What are A, B and C?`, [{ label: 'A =', ans: A }, { label: 'B =', ans: B }, { label: 'C =', ans: Cc }],
          `Try ${M(std(b, a, a * b))}: y = 0 gives x = ${a} and x = 0 gives y = ${b}. ${A === b && B === a ? 'So' : 'Tidied up, it is'} ${M(std(A, B, Cc))}.`); }
      const onX = R.bool(), k = nz(R, -6, 6), r = nz(R, -6, 6), o = nz(R, -6, 6), Cc = k * r;
      const eq = onX ? `${tsum([cx(1, 'k') + 'x', tm(o, 'y')])}=${Cc}` : `${tsum([tm(o, 'x'), 'ky'])}=${Cc}`, ipt = onX ? P(r, 0) : P(0, r);
      return E.num(`For what value of k does ${M(eq)} have ${onX ? 'x' : 'y'}-intercept ${ipt}?`, [{ label: 'k =', ans: k }],
        `The point ${ipt} is on the line: put ${onX ? 'x' : 'y'} = ${r} and ${onX ? 'y' : 'x'} = 0 to get ${M(`${r}k=${Cc}`)}, so k = ${k}.`); } },
    f: { t: 'count the whole-number solutions', g: R => { let p, q, T, pos, ys;
      do { p = R.int(2, 9); q = R.int(2, 9); T = R.int(20, 90); pos = R.bool(); ys = [];
        for (let y = pos ? 1 : 0; q * y <= T; y++) { const rem = T - q * y; if (rem % p === 0 && (!pos || rem > 0)) ys.push(y); } } while (p === q || gcd(p, q) !== 1 || ys.length < 2 || ys.length > 10);
      const n = ys.length, eq = `${p}x+${q}y=${T}`, ctx = R.bool();
      const q_ = ctx ? `Pens cost $${p} each and notebooks cost $${q} each. In how many ways can you spend exactly $${T}${pos ? ', buying at least one of each' : ' (buying none of one kind is allowed)'}?`
        : `How many pairs of ${pos ? 'positive' : 'non-negative'} integers (x, y) solve ${M(eq)}?`;
      return E.num(q_, [{ ans: n }],
        `${ctx ? `With x pens and y notebooks, ${M(eq)}. ` : ''}${T} − ${q}y must be a ${pos ? 'positive ' : ''}multiple of ${p}, which happens for y = ${ys.join(', ')} (steps of ${p}). That is ${n} solutions.`); } },
  });

  /* IV.3.03 Converting forms */
  S('IV.3.03', 'Converting forms', {
    a: { t: 'standard to slope-intercept', g: R => { let A, B, Cc; do { A = R.int(1, 6); B = nz(R, -6, 6); Cc = R.bool(0.7) ? B * R.int(-6, 6) : R.int(-12, 12); } while (A === B && R.bool(0.7));
      const m = fr(-A, B), b = fr(Cc, B);
      return E.num(`Write ${M(std(A, B, Cc))} in slope-intercept form.`, [{ eqn: si(m, b), form: 'solved' }],
        `Move the x-term: ${M(`${tm(B, 'y')}=${tsum([tm(-A, 'x'), tm(Cc)])}`)}${B === 1 ? '' : `, then divide every term by ${B}`}: ${M(si(m, b))}.`); } },
    b: { t: 'point-slope to slope-intercept', g: R => { const m = rs(R, 0.3), x1 = nz(R, -8, 8), y1 = nz(R, -8, 8), b = radd(y1, rmul(m, -x1));
      return E.num(`Write ${M(ps(m, x1, y1))} in slope-intercept form.`, [{ eqn: si(m, b), form: 'solved' }],
        `Distribute: ${M(`${sh('y', y1)}=${tsum([tm(m, 'x'), tm(rmul(m, -x1))])}`)}. Then ${y1 > 0 ? 'add ' + y1 + ' to' : 'subtract ' + -y1 + ' from'} both sides: ${M(si(m, b))}.`); } },
    c: { t: 'slope-intercept to standard', g: R => { const m = rs(R, 0.75, 7), b = R.bool(0.4) ? fr(nz(R, -9, 9), R.pick([2, 3, 4])) : [R.int(-9, 9), 1];
      const L = RV(m)[1] * RV(b)[1] / gcd(RV(m)[1], RV(b)[1]), [A, B, Cc] = normStd(-RV(m)[0] * L / RV(m)[1], L, RV(b)[0] * L / RV(b)[1]);
      return E.num(`Write ${M(si(m, b))} in standard form ${M('Ax+By=C')}, using integers with no common factor and ${M('A>0')}. What are A, B and C?`, [{ label: 'A =', ans: A }, { label: 'B =', ans: B }, { label: 'C =', ans: Cc }],
        `${L > 1 ? `Multiply every term by ${L} to clear fractions, then move` : 'Move'} the x-term to the left${A !== RV(m)[0] * -L / RV(m)[1] ? ' and make A positive' : ''}: ${M(std(A, B, Cc))}.`); } },
    d: { t: 'pick the best form for a job', g: R => { const kind = R.int(0, 2), m = nz(R, -6, 6), b = R.int(-9, 9), x = R.int(-8, 8), y = R.int(-8, 8), p = R.int(2, 9), q = R.int(2, 9), T = p * q * R.int(2, 5);
      const jobs = [[`You know the slope is ${m} and the y-intercept is ${b}.`, `You want to graph by starting at the y-intercept and counting the slope.`, `You want to read the slope of a line off its equation at a glance.`, `You need y for many x-values, and the rule is "start at ${b}, change by ${m} per step".`],
        [`You know the slope is ${m} and the line passes through ${P(x, y)}.`, `You know two points on the line, ${P(x, y)} and ${P(x + p, y + m)}.`, `You know the line passes through ${P(x, y)} with slope ${m}, and you don't want to find the y-intercept.`],
        [`You want both intercepts of a line quickly.`, `Items cost $${p} and $${q}, and you spend exactly $${T} in total.`, `The line is vertical, through ${P(x, y)}.`, `You want an equation with only integer coefficients.`]];
      const opts = ['slope-intercept form', 'point-slope form', 'standard form'];
      return E.choiceFixed(`Which form of a linear equation fits this job best? ${R.pick(jobs[kind])}`, opts, kind,
        ['y = mx + b shows the slope and y-intercept directly.', 'y − y₁ = m(x − x₁) uses a point and a slope directly.', 'Ax + By = C gives intercepts easily, fits totals, and can write vertical lines.'][kind]); } },
  });

  /* IV.3.04 Horizontal & vertical lines */
  S('IV.3.04', 'Horizontal & vertical lines', {
    a: { t: 'y = k', g: R => { const mode = R.int(0, 2), k = mode === 1 ? R.int(-5, 5) : R.int(-9, 9), a = R.int(-9, 9);
      const q = [`Write the equation of the horizontal line through ${P(a, k)}.`, `Write the equation of the line in the graph.`, `A line has slope 0 and passes through ${P(a, k)}. Write its equation.`][mode];
      return E.num(q, [{ eqn: `y=${k}` }], `A horizontal line keeps the same height: every point has y = ${k}, so ${M('y=' + k)}. It runs left to right, not up and down.`,
        mode === 1 ? { visual: bigGraph({ fns: [{ f: () => k, color: C.blue }], label: 'a horizontal line' }) } : {}); } },
    b: { t: 'x = h', g: R => { const mode = R.int(0, 2), h = mode === 1 ? R.int(-5, 5) : R.int(-9, 9), a = R.int(-9, 9);
      const q = [`Write the equation of the vertical line through ${P(h, a)}.`, `Write the equation of the line in the graph.`, `A line has no defined slope and passes through ${P(h, a)}. Write its equation.`][mode];
      return E.num(q, [{ eqn: `x=${h}` }], `A vertical line keeps the same x: every point has x = ${h}, so ${M('x=' + h)}.`,
        mode === 1 ? { visual: bigGraph({ vlines: [{ x: h, color: C.blue, dash: false }], label: 'a vertical line' }) } : {}); } },
    c: { t: 'slope 0 vs undefined', g: R => { const zero = R.bool(), mode = R.int(0, 2), k = R.int(-9, 9), a = R.int(-9, 9); let c; do c = R.int(-9, 9); while (c === a);
      const q = mode === 0 ? `What is the slope of the line through ${zero ? P(a, k) + ' and ' + P(c, k) : P(k, a) + ' and ' + P(k, c)}?`
        : mode === 1 ? `What is the slope of ${M(zero ? 'y=' + k : 'x=' + k)}?` : `What is the slope of the line through ${P(a, k)} parallel to the ${zero ? 'x' : 'y'}-axis?`;
      return E.choiceFixed(q, ['0', 'not defined'], zero ? 0 : 1, zero ? 'The line is horizontal: the rise is 0, so slope = 0 ÷ run = 0.' : 'The line is vertical: the run is 0, and division by 0 is not defined, so the slope is not defined.'); } },
    d: { t: 'which one is a function', g: R => { const yes = R.bool(), mode = R.int(0, 1), k = R.int(-9, 9), a = R.int(-9, 9); let c; do c = R.int(-9, 9); while (c === a);
      let q; if (mode === 0) { const eq = yes ? (R.bool() ? 'y=' + k : si([nz(R, -5, 5), 1], R.int(-9, 9))) : 'x=' + k; q = `Does ${M(eq)} define y as a function of x?`; }
      else { const d = nz(R, -4, 4); q = `Is the line through ${yes ? (R.bool() ? P(a, k) + ' and ' + P(c, k) : P(a, k) + ' and ' + P(c, k + d)) : P(k, a) + ' and ' + P(k, c)} the graph of a function?`; }
      return E.choiceFixed(q, ['Yes', 'No'], yes ? 0 : 1, yes ? 'Each x-value has exactly one y-value, so it passes the vertical line test.' : 'It is a vertical line: one x-value has infinitely many y-values, so it fails the vertical line test.'); } },
  });

  /* IV.3.05 Parallel lines */
  const lineEq = (R, m, b, forms = [0, 1]) => { const f = R.pick(forms); if (f === 1) { const [A, B, Cc] = stdOf(m, b); return std(A, B, Cc); } return si(m, b); };
  S('IV.3.05', 'Parallel lines', {
    a: { t: 'equal slopes', g: R => { const m = rs(R, 0.35, 6), form = R.int(0, 1);
      const eq = form === 0 ? si(m, R.int(-9, 9)) : ps(m, nz(R, -7, 7), nz(R, -7, 7));
      return E.num(`What is the slope of any line parallel to ${M(eq)}?`, [{ label: 'slope =', ...sf(m) }], `Parallel lines have equal slopes. This line has slope ${mS(m)}, so every parallel line does too.`); } },
    b: { t: 'test two equations', g: R => { const kind = R.int(0, 2), m = rs(R, 0.3, 4), b1 = R.int(-6, 6); let m2 = m, b2 = b1;
      if (kind === 0) b2 = b1 + nz(R, -5, 5); if (kind === 2) { do m2 = rs(R, 0.3, 4); while (req(m2, m)); b2 = R.int(-6, 6); }
      const [A, B, Cc] = stdOf(m2, b2), s = R.pick([1, 1, 2, 3]), e2 = std(A * s, B * s, Cc * s), e1 = si(m, b1);
      const [f1, f2] = R.bool() ? [e1, e2] : [e2, e1];
      return E.choiceFixed(`How are the lines ${M(f1)} and ${M(f2)} related?`, ['parallel', 'the same line', 'they intersect'], kind,
        `Solve ${M(e2)} for y: ${M(si(m2, b2))}. ${kind === 2 ? `The slopes ${fs(m)} and ${fs(m2)} differ, so the lines cross.` : kind === 0 ? `Same slope ${fs(m)} but different y-intercepts (${b1} and ${b2}), so parallel.` : `Same slope and same y-intercept: it is the same line, not parallel.`}`); } },
    c: { t: 'write a parallel line through a point', g: R => { const m = rs(R, 0.3, 5), b = R.int(-6, 6); let x0, y0; do { x0 = R.int(-6, 6); y0 = R.int(-8, 8); } while (req(y0, radd(rmul(m, x0), b)));
      const eq = lineEq(R, m, b), b2 = radd(y0, rmul(m, -x0));
      return E.num(`Write an equation of the line parallel to ${M(eq)} through ${P(x0, y0)}.`, [{ eqn: ps(m, x0, y0) }],
        `Parallel means the same slope, ${mS(m)}. Through ${P(x0, y0)}: ${M(ps(m, x0, y0))}, which is ${M(si(m, b2))}.`); } },
    d: { t: 'check sides are parallel on a grid (compare slopes)', g: R => { let A, B, Cc, D, p, q, u, v, par_;
      for (;;) { A = [R.int(-6, 0), R.int(-6, -1)]; p = R.int(2, 6); q = R.int(-3, 3); u = R.int(-2, 2); v = R.int(3, 7); B = [A[0] + p, A[1] + q]; D = [A[0] + u, A[1] + v];
        par_ = R.bool(); const k = R.pick([1, 1, 2]); const [dp, dq] = par_ ? [0, 0] : R.pick([[0, 1], [0, -1], [1, 0], [-1, 0]]);
        Cc = [D[0] + k * p + dp, D[1] + k * q + dq]; const cx_ = Cc[0] - D[0], cy_ = Cc[1] - D[1];
        if (cx_ <= 0 || [A, B, Cc, D].some(P2 => Math.abs(P2[0]) > 6 || Math.abs(P2[1]) > 6)) continue;
        if (p * v - q * u === 0 || (p * cy_ - q * cx_ === 0) !== par_) continue; break; }
      const mAB = fr(B[1] - A[1], B[0] - A[0]), mDC = fr(Cc[1] - D[1], Cc[0] - D[0]);
      const seg = (X, Y) => ({ x: t => X[0] + (Y[0] - X[0]) * t, y: t => X[1] + (Y[1] - X[1]) * t, t: [0, 1], color: C.blue });
      const vis = V.graph({ x: [-7, 7], y: [-7, 7], w: 280, h: 280, ticks: 1, labels: false, param: [seg(A, B), seg(B, Cc), seg(Cc, D), seg(D, A)], points: [[...A, 'A'], [...B, 'B'], [...Cc, 'C'], [...D, 'D']], label: 'quadrilateral ABCD on a grid' });
      const exS = `Slope AB = ${M(`(${B[1]}-${par(A[1])})/(${B[0]}-${par(A[0])})=${fs(mAB)}`)}, slope DC = ${M(`(${Cc[1]}-${par(D[1])})/(${Cc[0]}-${par(D[0])})=${fs(mDC)}`)}.`;
      if (R.bool(0.35)) return E.num(`Quadrilateral ABCD has A${P(...A)}, B${P(...B)}, C${P(...Cc)} and D${P(...D)}. Find the slopes of sides AB and DC.`, [{ label: 'slope AB =', ...sf(mAB) }, { label: 'slope DC =', ...sf(mDC) }], `${exS} ${par_ ? 'Equal slopes, so AB ∥ DC.' : 'The slopes differ, so AB and DC are not parallel.'}`, { visual: vis });
      return E.choiceFixed(`Quadrilateral ABCD has A${P(...A)}, B${P(...B)}, C${P(...Cc)} and D${P(...D)}. Is side AB parallel to side DC?`, ['Yes', 'No'], par_ ? 0 : 1,
        `Slope AB = ${M(`(${B[1]}-${par(A[1])})/(${B[0]}-${par(A[0])})=${fs(mAB)}`)}, slope DC = ${M(`(${Cc[1]}-${par(D[1])})/(${Cc[0]}-${par(D[0])})=${fs(mDC)}`)}. ${par_ ? 'Equal slopes, so AB ∥ DC.' : 'The slopes differ, so they are not parallel.'}`, { visual: vis }); } },
    e: { t: 'for what k', g: R => { let m, t, A, k, Cc, b, eq, sl, kind;
      do { kind = R.int(0, 1); m = rs(R, 0.4, 4); t = nz(R, -3, 3); b = R.int(-8, 8); Cc = nz(R, -12, 12);
        if (kind === 0) { A = m[0] * t; k = -m[1] * t; eq = `${tsum([tm(A, 'x'), 'ky'])}=${Cc}`; sl = `${-A}/k`; }
        else { A = m[1] * t; k = -m[0] * t; eq = `${tsum(['kx', tm(A, 'y')])}=${Cc}`; sl = A === 1 ? '-k' : A === -1 ? 'k' : A > 0 ? `-k/${A}` : `k/${-A}`; } }
      while (Math.abs(A) > 12 || req(fr(Cc, kind === 0 ? k : A), b));
      return E.num(`For what value of k is ${M(eq)} parallel to ${M(si(m, b))}?`, [{ label: 'k =', ans: k }],
        `Solved for y, ${M(eq)} has slope ${M(sl)}. Parallel needs slope ${mS(m)}: ${M(`${sl}=${fs(m)}`)} gives k = ${k}. (The y-intercepts differ, so the lines are distinct.)`); } },
    f: { t: 'parallel, but not the same line', g: R => { const r = R.int(2, 6), divs = []; for (let d = 1; d <= r * r; d++) if ((r * r) % d === 0) divs.push(d);
      const sg = R.pick([1, -1]), p = sg * R.pick(divs), q = r * r / p, same = R.bool(); let c1, c2, k0 = 0;
      if (same) { k0 = R.pick([r, -r]); const j = nz(R, -3, 3); c1 = k0 * j; c2 = q * j; }
      else do { c1 = nz(R, -9, 9); c2 = nz(R, -9, 9); } while (c1 * q === r * c2 || c1 * q === -r * c2);
      const e1 = `${tsum(['kx', tm(p, 'y')])}=${c1}`, e2 = `${tsum([tm(q, 'x'), 'ky'])}=${c2}`;
      return E.num(`For which values of k are ${M(e1)} and ${M(e2)} parallel and not the same line?`, [{ label: 'k =', set: same ? [String(-k0)] : [String(r), String(-r)] }],
        `Equal slopes: ${M(`k/${par(p)}=${par(q)}/k`)}, so ${M(`k^2=${r * r}`)} and k = ±${r}. ${same ? `But k = ${k0} makes the first equation a multiple of the second (the same line), so only k = ${-k0}.` : 'Neither value makes the equations multiples of each other, so both work.'}`); } },
  });

  /* IV.3.06 Perpendicular lines */
  const SL = [2, -2, 3, -3, 4, -4, 5, -5, [1, 2], [-1, 2], [2, 3], [-2, 3], [3, 4], [-3, 4], [3, 2], [-3, 2], [1, 3], [-1, 3], [4, 3], [-4, 3], [5, 2], [-5, 2]].map(RV);
  S('IV.3.06', 'Perpendicular lines', {
    a: { t: 'negative reciprocal slopes', g: R => { const m = R.pick(SL), b = R.int(-9, 9), pm = recipNeg(m);
      return E.choice(R, `What is the slope of a line perpendicular to ${M(si(m, b))}?`, M(fs(pm)), [fr(-m[0], m[1]), fr(m[1], m[0]), m].map(x => M(fs(x))),
        `Flip ${fs(m)} to get ${fs(fr(m[1], m[0]))}, then change the sign: ${fs(pm)}. Check: ${fs(m)} × ${fs(pm)} = −1.`.replace(/(^|[\s(])-/g, '$1−')); } },
    b: { t: 'test two equations', g: R => { const kind = R.int(0, 2), m = R.pick([...SL, [1, 1], [-1, 1]]), b1 = R.int(-6, 6); let m2, b2 = R.int(-6, 6);
      if (kind === 0) { m2 = m; if (b2 === b1) b2 = b1 + 3; } else if (kind === 1) m2 = recipNeg(m);
      else { const tries = R.shuffle([fr(-m[0], m[1]), fr(m[1], m[0]), ...SL]); m2 = tries.find(t => !req(t, m) && !req(rmul(t, m), -1)); }
      const e1 = si(m, b1), e2 = R.bool() ? lineEq(R, m2, b2, [1]) : si(m2, b2), sw = R.bool(), [f1, f2] = sw ? [e2, e1] : [e1, e2], [s1, s2] = sw ? [m2, m] : [m, m2];
      const prod = rmul(m, m2);
      return E.choiceFixed(`Are ${M(f1)} and ${M(f2)} parallel, perpendicular or neither?`, ['parallel', 'perpendicular', 'neither'], kind,
        `The slopes are ${fs(s1)} and ${fs(s2)}. ${kind === 0 ? 'They are equal and the intercepts differ, so parallel.' : kind === 1 ? 'Their product is −1, so perpendicular.' : `They are not equal, and their product is ${fs(prod)}, not −1: neither.`}`.replace(/(^|[\s(])-/g, '$1−')); } },
    c: { t: 'write a perpendicular line through a point', g: R => { const m = rs(R, 0.35, 4), b = R.int(-6, 6), x0 = R.int(-6, 6), y0 = R.int(-8, 8), pm = recipNeg(m), eq = lineEq(R, m, b), b2 = radd(y0, rmul(pm, -x0));
      return E.num(`Write an equation of the line perpendicular to ${M(eq)} through ${P(x0, y0)}.`, [{ eqn: ps(pm, x0, y0) }],
        `The given slope is ${mS(m)}, so the perpendicular slope is ${mS(pm)}. Through ${P(x0, y0)}: ${M(ps(pm, x0, y0))}, which is ${M(si(pm, b2))}.`); } },
    d: { t: 'perpendicular bisector', g: R => { const mx = R.int(-4, 4), my = R.int(-4, 4), axis = R.bool(0.15); let u, v;
      if (axis) { if (R.bool()) { u = nz(R, -4, 4); v = 0; } else { u = 0; v = nz(R, -4, 4); } } else { u = nz(R, -4, 4); v = nz(R, -4, 4); }
      const A = [mx - u, my - v], B = [mx + u, my + v];
      let ans, why; if (v === 0) { ans = `x=${mx}`; why = `AB is horizontal, so the bisector is the vertical line ${M(ans)}.`; }
      else if (u === 0) { ans = `y=${my}`; why = `AB is vertical, so the bisector is the horizontal line ${M(ans)}.`; }
      else { const mAB = fr(v, u), pm = recipNeg(mAB); ans = ps(pm, mx, my); why = `Slope AB = ${mS(mAB)}, so the bisector has slope ${mS(pm)}: ${M(ans)}, which is ${M(si(pm, radd(my, rmul(pm, -mx))))}.`; }
      return E.num(`Find an equation of the perpendicular bisector of the segment from A${P(...A)} to B${P(...B)}.`, [{ eqn: ans }], `The midpoint is ${P(mx, my)}. ${why}`); } },
    e: { t: 'for what k', g: R => { let m, t, A, k, Cc, eq, sl, kind; const b = R.int(-8, 8);
      do { kind = R.int(0, 1); m = rs(R, 0.4, 4); t = nz(R, -3, 3); Cc = nz(R, -12, 12);
        if (kind === 0) { A = m[0] * t; k = m[1] * t; eq = `${tsum(['kx', tm(A, 'y')])}=${Cc}`; sl = A === 1 ? '-k' : A === -1 ? 'k' : A > 0 ? `-k/${A}` : `k/${-A}`; }
        else { A = m[1] * t; k = m[0] * t; eq = `${tsum([tm(A, 'x'), 'ky'])}=${Cc}`; sl = `${-A}/k`; } }
      while (Math.abs(A) > 12);
      const pm = recipNeg(m);
      return E.num(`For what value of k is ${M(eq)} perpendicular to ${M(si(m, b))}?`, [{ label: 'k =', ans: k }],
        `Perpendicular to slope ${mS(m)} means slope ${mS(pm)}. Solved for y, ${M(eq)} has slope ${M(sl)}, so ${sl === 'k' ? '' : M(`${sl}=${fs(pm)}`) + ' gives '}k = ${k}.`); } },
    f: { t: 'foot of the perpendicular, and reflections', g: R => { let m, Fx, Fy, t, Px, Py, b;
      do { m = RV(R.pick([1, -1, 2, -2, 3, -3, [1, 2], [-1, 2], [2, 3], [-2, 3], [3, 2], [-3, 2], [1, 3], [-1, 3]])); Fx = m[1] * R.int(-2, 2); Fy = R.int(-5, 5); b = Fy - m[0] * Fx / m[1]; t = nz(R, -2, 2); Px = Fx + t * m[0]; Py = Fy - t * m[1]; }
      while (Math.abs(b) > 10 || Math.abs(Px) > 9 || Math.abs(Py) > 9 || Math.abs(Fx - t * m[0]) > 12 || Math.abs(Fy + t * m[1]) > 12);
      const refl = R.bool(), line = lineEq(R, m, b), pm = recipNeg(m), ans = refl ? [Fx - t * m[0], Fy + t * m[1]] : [Fx, Fy];
      return E.num(refl ? `Find the reflection of the point ${P(Px, Py)} in the line ${M(line)}.` : `Find the point on the line ${M(line)} that is closest to ${P(Px, Py)}.`, [{ point: ans.map(String) }],
        `The perpendicular through ${P(Px, Py)} has slope ${mS(pm)}: ${M(ps(pm, Px, Py))}. Solving with the line gives the foot ${P(Fx, Fy)}${refl ? `, the midpoint of the point and its image. So the image is 2 × ${P(Fx, Fy)} − ${P(Px, Py)} = ${P(...ans)}.` : ', the closest point.'}`); } },
  });

  /* IV.3.07 Intercepts of lines */
  S('IV.3.07', 'Intercepts of lines', {
    a: { t: 'x-intercept by y = 0', g: R => { const form = R.int(0, 2); let eq, why, r;
      if (form === 0) { const m = [nz(R, -6, 6), 1]; r = R.int(-9, 9); const b = -m[0] * r; eq = si(m, b); why = `${M(`0=${lineStr(m, b)}`)}, so x = ${r}`; }
      else if (form === 1) { const d = R.pick([2, 3, 4]); let n; do n = nz(R, -5, 5); while (gcd(n, d) !== 1); r = d * nz(R, -3, 3); const b = -n * r / d; eq = si([n, d], b); why = `${M(`0=${lineStr([n, d], b)}`)}, so x = ${r}`; }
      else { const A = R.int(1, 6), B = nz(R, -6, 6); r = R.int(-9, 9); eq = std(A, B, A * r); why = `${M(`${tm(A, 'x')}=${A * r}`)}, so x = ${r}`; }
      return E.num(`Find the x-intercept of ${M(eq)}. Give it as a point.`, [{ label: 'x-intercept', point: [String(r), '0'] }], `Set y = 0: ${why}. The x-intercept is ${P(r, 0)}.`); } },
    b: { t: 'y-intercept by x = 0', g: R => { const form = R.int(0, 2), b = R.int(-9, 9); let eq, why;
      if (form === 0) { const A = R.int(1, 6), B = nz(R, -6, 6); eq = std(A, B, B * b); why = `${M(`${tm(B, 'y')}=${B * b}`)}, so y = ${b}`; }
      else if (form === 1) { const m = nz(R, -5, 5), x1 = nz(R, -6, 6), y1 = b + m * x1; eq = ps(m, x1, y1); why = `${M(`${sh('y', y1)}=${m === 1 ? -x1 : m === -1 ? x1 : m + '(' + -x1 + ')'}`)}, so y = ${b}`; }
      else { const A = nz(R, -6, 6), B = nz(R, -5, 5), c0 = -B * b; eq = `${tm(A, 'x')}=${tsum([tm(B, 'y'), tm(c0)])}`; why = `${M(`0=${tsum([tm(B, 'y'), tm(c0)])}`)}, so y = ${b}`; }
      return E.num(`Find the y-intercept of ${M(eq)}. Give it as a point.`, [{ label: 'y-intercept', point: ['0', String(b)] }], `Set x = 0: ${why}. The y-intercept is ${P(0, b)}.`); } },
    c: { t: 'meaning in context', g: R => {
      const CT = [
        () => { const r = R.pick([10, 20, 25, 40, 50]), T = R.int(6, 30); return { eq: `V=${r * T}-${r}t`, intro: 'The water in a tank is', vars: '(V liters after t minutes)', S: r * T, T, start: n => `The tank starts with ${n} liters.`, end: n => `The tank is empty after ${n} minutes.`, rate: `The tank loses ${r} liters each minute.` }; },
        () => { const r = R.pick([4, 5, 10, 20, 25]), T = 100 / r; return { eq: `B=100-${r}h`, intro: 'A phone battery has', vars: '(B percent after h hours)', S: 100, T, start: n => `The battery starts at ${n}%.`, end: n => `The battery runs out after ${n} hours.`, rate: `The battery drops ${r}% each hour.` }; },
        () => { const r = R.pick([1, 2, 3]), T = R.int(4, 12); return { eq: `H=${r * T}-${r === 1 ? '' : r}t`, intro: 'A burning candle has height', vars: '(H cm after t hours)', S: r * T, T, start: n => `The candle starts ${n} cm tall.`, end: n => `The candle burns out after ${n} hours.`, rate: `The candle gets ${r} cm shorter each hour.` }; },
        () => { const r = R.pick([50, 100, 150, 200, 250]), T = R.int(6, 24); return { eq: `D=${r * T}-${r}m`, intro: 'A loan balance is', vars: '(D dollars owed after m months)', S: r * T, T, start: n => `The loan starts at $${n}.`, end: n => `The loan is paid off after ${n} months.`, rate: `$${r} is paid off each month.` }; },
        () => { const r = R.pick([5, 10, 15, 20]), T = R.int(3, 10); return { eq: `G=${r * T}-${r}w`, intro: 'A gift card balance is', vars: '(G dollars after w weeks)', S: r * T, T, start: n => `The card starts with $${n}.`, end: n => `The card is used up after ${n} weeks.`, rate: `$${r} is spent each week.` }; },
      ];
      const c = R.pick(CT)(), askEnd = R.bool(), ipt = askEnd ? P(c.T, 0) : P(0, c.S);
      const right = askEnd ? c.end(c.T) : c.start(c.S), wrong = askEnd ? [c.start(c.S), c.rate, c.start(c.T)] : [c.end(c.T), c.rate, c.end(c.S)];
      return E.choice(R, `${c.intro} ${M(c.eq)} ${c.vars}. What does the intercept ${ipt} mean?`, right, wrong,
        askEnd ? `At ${ipt} the amount is 0, so ${right.charAt(0).toLowerCase() + right.slice(1)}` : `At ${ipt} no time has passed, so ${right.charAt(0).toLowerCase() + right.slice(1)}`); } },
    d: { t: 'graph from intercepts', g: R => { let r, b; do { r = nz(R, -6, 6); b = nz(R, -6, 6); } while (Math.abs(r) === Math.abs(b));
      const m = fr(-b, r), mk = (p, q) => lineSvg(x => q - q / p * x, [[p, 0], [0, q]]), right = mk(r, b);
      const cands = [mk(-r, b), mk(b, r), mk(r, -b), mk(-r, -b)];
      return E.choice(R, `Find the intercepts of ${M(si(m, b))}, then pick its graph.`, right, pickGraphs(R, right, cands),
        `x = 0 gives the y-intercept ${P(0, b)}. y = 0 gives ${M(`0=${lineStr(m, b)}`)}, so the x-intercept is ${P(r, 0)}. Join them.`); } },
    e: { t: 'the triangle with the axes', g: R => { let a, b; do { a = nz(R, -10, 10); b = nz(R, -10, 10); } while (Math.abs(a) < 2 || Math.abs(b) < 2);
      const form = R.int(0, 2), [A, B, Cc] = normStd(b, a, a * b), m = fr(-b, a);
      const eq = form === 0 ? std(A, B, Cc) : form === 1 ? si(m, b) : `${tsum([tm(A, 'x'), tm(-Cc)])}=${tm(-B, 'y')}`, area = Math.abs(a * b) / 2;
      return E.num(`Find the area of the triangle formed by ${M(eq)} and the two axes.`, [{ label: 'area =', ans: area }],
        `y = 0 gives x = ${a}, and x = 0 gives y = ${b}. The triangle has legs ${Math.abs(a)} and ${Math.abs(b)}, so the area is ½ × ${Math.abs(a)} × ${Math.abs(b)} = ${area}.`); } },
    f: { t: 'a line through a point, area given', g: R => { let a, b, p, q, S, a2;
      for (;;) { a = R.int(2, 12); b = R.int(2, 12); p = R.int(1, a - 1); if ((b * (a - p)) % a) continue; q = b * (a - p) / a; S = a * b; if (S % 2 || S % q) continue; a2 = S / q - a; if (a2 > 0 && a2 <= 30 && (a2 !== a || R.bool(0.2))) break; }
      const sol = a === a2 ? [String(a)] : [String(a), String(a2)];
      return E.num(`A line through ${P(p, q)} makes a triangle of area ${S / 2} with the positive x- and y-axes. Find every possible x-intercept (give the x-values).`, [{ label: 'x =', set: sol }],
        `Call the intercepts a and b: ${M(`ab=${S}`)} and, since ${P(p, q)} is on ${M('x/a+y/b=1')}, ${M(`${p}/a+${q}/b=1`)}. Put b = ${S}/a: ${M(`${tm(q, 'a^2')}-${S}a+${p * S}=0`)}, which is ${M(a === a2 ? `(a-${a})^2=0` : `(a-${a})(a-${a2})=0`)}${q === 1 ? '' : ` after dividing by ${q}`}. So a = ${sol.join(' or a = ')}.`); } },
  });

  /* IV.3.08 Two-variable inequalities */
  const FLIP = { '<': '>', '>': '<', '<=': '>=', '>=': '<=' };
  const OPS = ['<', '>', '<=', '>='];
  const bothForms = (R, A, B, Cc, op) => R.bool() ? `${tsum([tm(A, 'x'), tm(B, 'y')])}${op}${Cc}` : `${tm(B, 'y')}${op}${tsum([tm(-A, 'x'), tm(Cc)])}`;
  const holds = (l, op, r) => op === '<' ? l < r : op === '>' ? l > r : op === '<=' ? l <= r : l >= r;
  S('IV.3.08', 'Two-variable inequalities', {
    a: { t: 'solid vs dashed boundary', g: R => { const op = R.pick(OPS), form = R.int(0, 1); let ineq;
      if (form === 0) ineq = 'y' + op + lineStr(rs(R, 0.3), R.int(-9, 9)); else ineq = bothForms(R, R.int(1, 6), nz(R, -6, 6), R.int(-12, 12), op);
      const solid = op.length === 2;
      return E.choiceFixed(`When you graph ${M(ineq)}, is the boundary line solid or dashed?`, ['solid', 'dashed'], solid ? 0 : 1,
        solid ? 'The sign includes "or equal to", so points on the line are solutions: solid.' : 'The sign is strict (no "or equal to"), so points on the line are not solutions: dashed.'); } },
    b: { t: 'test point to shade', g: R => { const A = R.int(-5, 5), B = nz(R, -4, 4), Cc = nz(R, -8, 8), op = R.pick(OPS), ineq = bothForms(R, A, B, Cc, op);
      const above = ['>', '>='].includes(B > 0 ? op : FLIP[op]);
      const originIn = holds(0, op, Cc), originAbove = Cc / B < 0;
      if ((originIn === originAbove) !== above) throw new Error('shade check');
      return E.choiceFixed(`You graph ${M(ineq)}. Which side of the boundary line do you shade?`, ['above the line', 'below the line'], above ? 0 : 1,
        `Test (0, 0): ${M(`0${op}${Cc}`)} is ${originIn ? 'true' : 'false'}, so shade the side ${originIn ? 'with' : 'without'} (0, 0), which is ${above ? 'above' : 'below'} the line.${B < 0 ? ' (The y-term is negative, so the sign alone misleads.)' : ''}`); } },
    c: { t: 'check if a point is a solution', g: R => { const want = R.bool(), onLine = R.bool(0.3), op = R.pick(OPS), form = R.int(0, 1);
      let A, B, Cc, m, b; if (form === 0) { m = nz(R, -4, 4); b = R.int(-6, 6); } else { A = R.int(1, 5); B = nz(R, -5, 5); Cc = R.int(-10, 10); }
      const L = (x, y) => form === 0 ? y : A * x + B * y, Rt = x => form === 0 ? m * x + b : Cc;
      let x, y, n = 0;
      do { x = R.int(-6, 6); if (onLine && n < 40 && form === 0) y = m * x + b; else if (onLine && n < 40 && (Cc - A * x) % B === 0) y = (Cc - A * x) / B; else y = R.int(-9, 9); n++; }
      while (holds(L(x, y), op, Rt(x)) !== want || Math.abs(y) > 12);
      const ineq = form === 0 ? `y${op}${lineStr([m, 1], b)}` : `${tsum([tm(A, 'x'), tm(B, 'y')])}${op}${Cc}`;
      const lv = L(x, y), rv = Rt(x), left = form === 0 ? `${y}` : `${A}(${x})+${par(B)}(${y})`, right = form === 0 ? `${m}(${x})${b ? (b > 0 ? '+' : '') + b : ''}` : `${Cc}`;
      return E.choiceFixed(`Is ${P(x, y)} a solution of ${M(ineq)}?`, ['Yes', 'No'], want ? 0 : 1,
        `Substitute: ${M(`${left}=${lv}`)} on the left and ${form === 0 ? M(`${right}=${rv}`) : rv} on the right. ${M(`${lv}${op}${rv}`)} is ${want ? 'true' : 'false'}${lv === rv ? (want ? ' (the line is included)' : ' (the line is not included)') : ''}.`); } },
    d: { t: 'write one from a graph', g: R => { const m = R.pick([1, -1, 2, -2, 3, -3, [1, 2], [-1, 2]].map(RV)), b = R.int(-4, 4), op = R.pick(OPS), above = op[0] === '>', strict = op.length === 1;
      const f = x => fv(m) * x + b, rhs = lineStr(m, b), cor = `y${op}${rhs}`;
      const wrongLine = b ? lineStr(m, -b) : lineStr(fr(-m[0], m[1]), b);
      const opts = [`y${FLIP[op]}${rhs}`, `y${strict ? op + '=' : op[0]}${rhs}`, `y${op}${wrongLine}`];
      const vis = bigGraph({ fns: [{ f, color: C.blue, dash: strict }], shade: { f, g: () => above ? 12 : -12, from: -6, to: 6 }, label: 'a shaded half-plane' });
      return E.choice(R, 'Which inequality does the graph show?', M(cor), opts.map(M),
        `The line has y-intercept ${b} and slope ${fs(m)}, so it is ${M('y=' + rhs)}. It is ${strict ? 'dashed (strict)' : 'solid (or equal to)'} and the shading is ${above ? 'above' : 'below'}: ${M(cor)}.`, { visual: vis }); } },
  });

  /* IV.3.09 Linear regression & residuals */
  const table = (xs, ys) => `<table class="dt"><tr><th>x</th>${xs.map(x => `<td>${String(x).replace('-', '−')}</td>`).join('')}</tr><tr><th>y</th>${ys.map(y => `<td>${String(y).replace('-', '−')}</td>`).join('')}</tr></table>`;
  const lsq = (xs, ys) => { const n = xs.length, mx = xs.reduce((s, v) => s + v, 0) / n, my = ys.reduce((s, v) => s + v, 0) / n;
    let sxy = 0, sxx = 0; xs.forEach((x, i) => { sxy += (x - mx) * (ys[i] - my); sxx += (x - mx) ** 2; }); const a = sxy / sxx; return [a, my - a * mx]; };
  const dec = (v, d) => String(+v.toFixed(d));
  const lineDec = (a, b) => { const A = a === 1 ? '' : a === -1 ? '-' : a; return `y=${A}x${b ? (b > 0 ? '+' : '') + b : ''}`; };
  const scatter = (xs, ys, o = {}) => { const lo = Math.min(...ys), hi = Math.max(...ys), pad = Math.max(1, (hi - lo) * 0.15);
    return V.graph({ x: [0, Math.max(...xs) + 1], y: [Math.floor(Math.min(0, lo - pad)), Math.ceil(hi + pad)], w: 280, h: 220, points: xs.map((x, i) => [x, ys[i]]), fns: o.fns || [], hlines: o.hlines || [], labels: o.labels, label: o.label || 'scatter plot' }); };
  S('IV.3.09', 'Linear regression & residuals', {
    a: { t: 'line of best fit with technology', g: R => { const n = R.int(5, 7), xs = R.distinct(1, 12, n).sort((a, b) => a - b), m = R.pick([0.5, 1, 1.5, 2, 2.5, 3, -0.5, -1, -1.5, -2]), b0 = R.int(m < 0 ? 20 : 0, m < 0 ? 35 : 12);
      const ys = xs.map(x => Math.round(m * x + b0 + R.int(-3, 3)));
      const [a, b] = lsq(xs, ys);
      if (R.bool()) return E.num(`Use linear regression on a calculator to find the line of best fit for this data. Round to 2 decimal places.${table(xs, ys)}`, [{ label: 'slope =', ans: a, dp: 2 }, { label: 'y-intercept =', ans: b, dp: 2 }],
        `Enter the lists and run linear regression: ${M(lineDec(+a.toFixed(2), +b.toFixed(2)))}.`);
      const a1 = +a.toFixed(1), b1 = +b.toFixed(1), bad = [lineDec(-a1 || -1, b1), lineDec(a1, +(b1 + (a1 > 0 ? -1 : 1) * Math.max(8, Math.abs(b1) * 0.6)).toFixed(1)), lineDec(+(a1 * 2.5).toFixed(1) || 1, b1)];
      return E.choice(R, 'Which line best fits the data in the scatter plot?', M(lineDec(a1, b1)), bad.map(M),
        `The points trend ${a > 0 ? 'upward' : 'downward'} with slope about ${a1} and cross x = 0 near ${b1}. Regression gives ${M(lineDec(a1, b1))}.`, { visual: scatter(xs, ys) }); } },
    b: { t: 'correlation coefficient r', g: R => {
      if (R.bool()) { const T = [['-0.95', 'a strong negative'], ['-0.6', 'a moderate negative'], ['0', 'no'], ['0.6', 'a moderate positive'], ['0.95', 'a strong positive']], k = R.int(0, 4), target = +T[k][0];
        const n = 14, xs = Array.from({ length: n }, () => R.int(1, 20)); if (new Set(xs).size < 4) xs[0] = 1, xs[1] = 20;
        const mx = xs.reduce((s, v) => s + v, 0) / n; let e = xs.map(() => R.int(-10, 10)); const em = e.reduce((s, v) => s + v, 0) / n; e = e.map(v => v - em);
        const sxx = xs.reduce((s, x) => s + (x - mx) ** 2, 0), pr = xs.reduce((s, x, i) => s + (x - mx) * e[i], 0) / sxx; e = e.map((v, i) => v - pr * (xs[i] - mx));
        let see = e.reduce((s, v) => s + v * v, 0); if (see < 1e-9) { e = xs.map((_, i) => i % 2 ? 1 : -1); see = n; }
        const slope = target === 0 ? 0 : Math.sign(target), lam = target === 0 ? 1 : Math.sqrt(sxx * (1 - target * target) / (target * target * see));
        let ys = xs.map((x, i) => slope * (x - mx) + lam * e[i]); const lo = Math.min(...ys), hi = Math.max(...ys), sc = 16 / ((hi - lo) || 1); ys = ys.map(y => 2 + (y - lo) * sc);
        return E.choiceFixed('Which value of r best matches the scatter plot?', T.map(t => `r ≈ ${t[0]}`), k, `The points show ${T[k][1]} linear pattern${k === 2 ? '' : `, so r is about ${T[k][0]}`}.${k === 2 ? ' r is about 0.' : ''}`, { visual: scatter(xs, ys, { label: 'scatter plot' }) }); }
      const t = R.bool(), a = R.pick(['0.91', '0.87', '0.94', '0.82']), w = R.pick(['0.12', '0.05', '0.08', '0.15']);
      const TRUE = [[`r = −${a} shows a strong negative linear relationship.`, 'r close to −1 means the points lie close to a falling line.'], [`r = ${w} shows only a weak linear relationship.`, 'r near 0 means a straight line fits poorly.'], [`r can never be greater than 1.`, 'r always lies between −1 and 1.'], [`r = −${a} is a stronger linear relationship than r = 0.5.`, 'Strength depends on how close |r| is to 1, not the sign.']];
      const FALSE = [[`Ice cream sales and sunburns have r = ${a}, so eating ice cream causes sunburn.`, 'A high r does not prove causation: hot sunny weather drives both.'], [`r = ${w} means there is no relationship between the variables.`, 'r near 0 only means no straight-line relationship; a curve could still fit well.'], [`r = −${a} is a weak relationship because it is negative.`, 'The sign gives the direction; |r| near 1 means strong.'], [`Hours studied and test scores have r = ${a}, so every extra hour of study raises a score.`, 'r describes a trend in the data, not a guarantee or proof of cause.']];
      const [st, why] = R.pick(t ? TRUE : FALSE);
      return E.tf(`True or false? ${st}`, t, why); } },
    c: { t: 'compute residuals', g: R => { const a10 = R.pick([5, 15, 20, 25, 12, 8, -15, -5, 30, -20]), b10 = R.int(-20, 60), x = R.int(1, 12), yh10 = a10 * x + b10; let e10; do e10 = R.int(-35, 35); while (e10 === 0);
      const y10 = yh10 + e10, a = a10 / 10, b = b10 / 10, yh = yh10 / 10, y = y10 / 10, res = e10 / 10;
      return E.num(`The line of best fit is ${M(lineDec(a, b))}. The data point ${P(x, y)} is in the set. What is its residual?`, [{ label: 'residual =', ans: res }],
        `Predicted: ${a}(${x}) ${b < 0 ? '− ' + -b : '+ ' + b} = ${yh}. Residual = actual − predicted = ${y} − ${par(yh)} = ${res}${res > 0 ? ', so the point lies above the line.' : ', so the point lies below the line.'}`); } },
    d: { t: 'read a residual plot', g: R => { const good = R.bool(), xs = Array.from({ length: 10 }, (_, i) => i + 1);
      let rs_; if (good) { let best = null; for (let t = 0; t < 40; t++) { const e = xs.map(() => R.int(-8, 8) / 4); const qd = xs.map(x => (x - 5.5) ** 2), qm = qd.reduce((s, v) => s + v, 0) / 10, em = e.reduce((s, v) => s + v, 0) / 10;
          let sxy = 0, sxx = 0, syy = 0; qd.forEach((q, i) => { sxy += (q - qm) * (e[i] - em); sxx += (q - qm) ** 2; syy += (e[i] - em) ** 2; }); const c = syy ? Math.abs(sxy / Math.sqrt(sxx * syy)) : 1; best = e; if (c < 0.35) break; }
        rs_ = best; }
      else { const c = R.pick([0.15, 0.2, 0.25, -0.15, -0.2, -0.25]), mean = xs.reduce((s, x) => s + c * (x - 5.5) ** 2, 0) / 10; rs_ = xs.map(x => c * (x - 5.5) ** 2 - mean + R.int(-2, 2) / 10); }
      const what = R.pick(['temperature and ice cream sales', 'age and height of trees', 'speed and stopping distance', 'study time and test score', 'hours of sun and plant growth', 'price and number sold']);
      const vis = V.graph({ x: [0, 11], y: [-4, 4], w: 280, h: 200, ticks: 1, labels: false, hlines: [{ y: 0, dash: false, color: C.ink }], points: xs.map((x, i) => [x, rs_[i]]), label: 'residual plot' });
      return E.choiceFixed(`This is the residual plot for a linear model of ${what}. Is a linear model a good fit?`, ['Yes', 'No'], good ? 0 : 1,
        good ? 'The residuals scatter randomly above and below 0 with no pattern, so a line fits well.' : 'The residuals form a clear curve, so the data is not linear; a curved model would fit better.', { visual: vis }); } },
  });
})(typeof window !== 'undefined' ? window : globalThis);
