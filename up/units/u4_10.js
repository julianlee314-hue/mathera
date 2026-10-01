/* Era IV · Unit IV.10 Polynomial functions (IV.10.01–IV.10.14) */
(function (G) {
  const E = G.E4, V = E.V, C = E.C, M = s => E.mx(s);
  const nz = (R, lo, hi) => { let v; do v = R.int(lo, hi); while (v === 0); return v; };
  const co = c => c === 1 ? '' : c === -1 ? '-' : String(c);                    // coefficient text: 1 → '', −1 → '-'
  const neg = n => String(n).replace(/-/g, '−');                                   // for labels and SVG text
  const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
  const g2 = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
  const lcm = (a, b) => Math.abs(a * b) / (g2(a, b) || 1);
  const pmul = (A, B) => { const r = Array(A.length + B.length - 1).fill(0); A.forEach((a, i) => B.forEach((b, j) => { r[i + j] += a * b; })); return r; };   // highest power first
  const pev = (P, x) => P.reduce((s, c) => s * x + c, 0);
  const syn = (P, r) => { const row = []; let acc = 0; P.forEach(c => { acc = acc * r + c; row.push(acc); }); return { row, q: row.slice(0, -1), rem: row[row.length - 1] }; };
  const poly = P => E.poly(P);
  // a factor [p, m, q]: zero p/q with multiplicity m; q = 1 → (x − p), q > 1 → (qx − p), q = −1 → (p − x)
  const lf = (p, q = 1) => q === 1 ? E.lin(p) : q === -1 ? `(${p}-x)` : `(${q}x${p > 0 ? '-' : '+'}${Math.abs(p)})`;
  const pw = (b, m) => m === 1 ? b : `${b}^${m}`;
  const fac = (a, zs) => co(a) + zs.slice().sort((u, v) => (u[0] === 0 ? 0 : 1) - (v[0] === 0 ? 0 : 1)).map(([p, m, q = 1]) => pw(lf(p, q), m)).join('');
  const expand = (a, zs) => zs.reduce((P, [p, m, q = 1]) => { for (let k = 0; k < m; k++) P = pmul(P, q === -1 ? [-1, p] : [q, -p]); return P; }, [a]);
  const fnOf = (a, zs) => x => zs.reduce((v, [p, m, q = 1]) => v * Math.pow(q === -1 ? p - x : q * x - p, m), a);
  const zval = ([p, , q = 1]) => q === -1 ? p : p / q;
  const zstr = ([p, , q = 1]) => q === -1 ? String(p) : E.fracStr(p, q);
  const lead = (a, zs) => zs.reduce((L, [, m, q = 1]) => L * Math.pow(q, m), a);
  const degOf = zs => zs.reduce((d, z) => d + z[1], 0);
  const listTxt = arr => arr.length === 1 ? arr[0] : arr.slice(0, -1).join(', ') + ' and ' + arr[arr.length - 1];
  // [[coef, power], …] in the order given → ASCII
  const terms = ts => { let s = ''; ts.filter(([c]) => c).forEach(([c, p]) => { const A = Math.abs(c); s += (c < 0 ? '-' : s ? '+' : '') + (p === 0 ? String(A) : (A === 1 ? '' : A) + 'x' + (p > 1 ? '^' + p : '')); }); return s || '0'; };
  const mono = (c, p) => p === 0 ? String(c) : co(c) + 'x' + (p > 1 ? '^' + p : '');
  const sgnT = (c, p, v = 'x') => !c ? '' : (c < 0 ? '-' : '+') + (p === 0 ? Math.abs(c) : (Math.abs(c) === 1 ? '' : Math.abs(c)) + v + (p > 1 ? '^' + p : ''));
  // a scrambled polynomial: leading term usually not written first
  const scramble = (R, deg, L, nT) => { const lower = R.sample(range(0, deg - 1), Math.min(nT, deg + 1) - 1);
    let ts = R.shuffle([[L, deg], ...lower.map(p => [nz(R, -9, 9), p])]); if (ts[0][1] === deg && R.bool(0.8)) ts.push(ts.shift()); return ts; };
  const randPoly = (R, deg, L) => [L, ...range(1, deg).map(() => R.bool(0.3) ? 0 : R.int(-9, 9))];
  // linear equation text like 4a − 2b = 7
  const le = (pairs, rhs) => { let s = ''; pairs.forEach(([c, v]) => { if (!c) return; const A = Math.abs(c); s += (c < 0 ? '-' : s ? '+' : '') + (A === 1 ? '' : A) + v; }); return (s || '0') + '=' + rhs; };
  // f(a) written out: 2(−1)^3 − (−1) + 4
  const subst = (P, a) => { const n = P.length - 1; let s = ''; P.forEach((c, k) => { const p = n - k; if (!c) return; const A = Math.abs(c); s += (c < 0 ? '-' : s ? '+' : '') + (p === 0 ? A : `${A === 1 ? '' : A}(${a})${p > 1 ? '^' + p : ''}`); }); return E.pt(s); };
  // fractions
  const fr = (n, d = 1) => { if (d < 0) { n = -n; d = -d; } const g = g2(n, d) || 1; return [n / g, d / g]; };
  const fadd = (a, b) => fr(a[0] * b[1] + b[0] * a[1], a[1] * b[1]), fmul = (a, b) => fr(a[0] * b[0], a[1] * b[1]), fdiv = (a, b) => fr(a[0] * b[1], a[1] * b[0]);
  const fs = a => E.fracStr(a[0], a[1]);
  const divs = n => range(1, Math.abs(n)).filter(d => Math.abs(n) % d === 0);
  // exact strings h ± k√r and h ± k i√r
  const reS = (h, k, r, sg) => { if (r === 1) return String(h + sg * k); const t = (k === 1 ? '' : k) + `sqrt(${r})`; return h === 0 ? (sg < 0 ? '-' : '') + t : `${h}${sg < 0 ? '-' : '+'}${t}`; };
  const imS = (h, k, r, sg) => { const t = (k === 1 ? '' : k) + (r === 1 ? 'i' : `isqrt(${r})`); return h === 0 ? (sg < 0 ? '-' : '') + t : `${h}${sg < 0 ? '-' : '+'}${t}`; };
  // roots of x^2 − 2hx + (h^2 − n): real if n > 0, complex if n < 0
  const pairRoots = (h, n) => { if (n > 0) { const [k, r] = E.surd(1, n); return [reS(h, k, r, 1), reS(h, k, r, -1)]; } const [k, r] = E.surd(1, -n); return [imS(h, k, r, 1), imS(h, k, r, -1)]; };
  const isSq = n => n >= 0 && Number.isInteger(Math.sqrt(n));

  /* pictures */
  const ENDS = ['up on both sides', 'down on both sides', 'down on the left, up on the right', 'up on the left, down on the right'];
  const endIdx = (deg, L) => deg % 2 === 0 ? (L > 0 ? 0 : 1) : (L > 0 ? 2 : 3);
  const endWhy = (deg, L) => `The degree ${deg} is ${deg % 2 ? 'odd, so the ends point opposite ways' : 'even, so the ends point the same way'}, and the leading coefficient ${L} is ${L > 0 ? 'positive' : 'negative'}: the graph goes ${ENDS[endIdx(deg, L)]}.`;
  // shape sketch of s·Π(x − r)^m: each factor is gently compressed far from its zero so every bump stays visible;
  // zeros, multiplicity behavior (cross / touch / flatten), signs and end behavior are exact; no y scale is shown
  const cmp = t => t / Math.pow(1 + t * t, 0.3);
  const gapOK = xs => xs.slice().sort((u, v) => u - v).every((x, i, a) => i === 0 || x - a[i - 1] >= 2);
  const sketch = (s, zs, o = {}) => {
    const xs = zs.map(z => z[0]), f = x => s * zs.reduce((v, [r, m]) => v * Math.pow(cmp(x - r), m), 1);
    const lo = Math.min(...xs), hi = Math.max(...xs), W = o.w || 300, H = o.h || 230;
    let x0 = o.x ? o.x[0] : Math.floor(lo) - 2, x1 = o.x ? o.x[1] : Math.ceil(hi) + 2; while (x1 - x0 < 8) { x0--; x1++; }
    const a = lo === hi ? lo - 2 : lo, b = lo === hi ? hi + 2 : hi; let Mx = 0;
    for (let k = 0; k <= 240; k++) Mx = Math.max(Mx, Math.abs(f(a + (b - a) * k / 240)));
    if (!(Mx > 1e-9)) Mx = 1;
    const sc = 3.3 / Mx;
    let g = V.graph({ x: [x0, x1], y: [-5, 5], w: W, h: H, labels: false, ticks: 1, fns: [{ f: x => f(x) * sc, color: C.blue }], points: o.dots === false ? [] : xs.map(x => [x, 0]), label: o.label || 'sketch of a polynomial' });
    if (o.text) { const X = x => Math.round(18 + (x - x0) / (x1 - x0) * (W - 36)), Y = y => Math.round(H - 18 - (y + 5) / 10 * (H - 36));
      g = g.replace(/<\/svg>$/, xs.map(x => V.text(X(x), Y(-1), neg(x), { size: o.w && o.w < 200 ? 11 : 13, weight: 700 })).join('') + '</svg>'); }
    return g;
  };
  // true-scale graph with the y-intercept labeled
  const truePic = (f, xs) => {
    const lo = Math.min(...xs), hi = Math.max(...xs); let x0 = Math.floor(Math.min(lo, 0)) - 2, x1 = Math.ceil(Math.max(hi, 0)) + 2; while (x1 - x0 < 8) { x0--; x1++; }
    let Mx = Math.abs(f(0)); for (let k = 0; k <= 240; k++) Mx = Math.max(Mx, Math.abs(f(lo + (hi - lo) * k / 240)));
    const Y = Math.ceil(Mx * 1.3);
    return V.graph({ x: [x0, x1], y: [-Y, Y], w: 320, h: 280, fns: [{ f, color: C.blue }], points: [[0, f(0), `(0, ${neg(f(0))})`]], label: 'graph of a polynomial' });
  };
  const S = (id, name, steps) => E.skill({ id, name, steps });

  /* IV.10.01 Degree & leading coefficient */
  S('IV.10.01', 'Degree & leading coefficient', {
    a: { t: 'find the degree', g: R => { const deg = R.int(2, 8), ts = scramble(R, deg, nz(R, -9, 9), R.int(2, 4));
      return E.num(`What is the degree of ${M('f(x)=' + terms(ts))}?`, [{ label: 'degree', ans: deg }], `The highest power of x is ${M('x^' + deg)}, so the degree is ${deg}.`); } },
    b: { t: 'find the leading coefficient', g: R => { const deg = R.int(2, 7), L = nz(R, -9, 9), ts = scramble(R, deg, L, R.int(3, 4));
      const first = ts[0][1] !== deg ? ` It is not ${ts[0][0]}, the first number written.` : '';
      return E.num(`What is the leading coefficient of ${M('f(x)=' + terms(ts))}?`, [{ label: 'leading coefficient', ans: L }], `The highest power is ${M('x^' + deg)}, and the number in front of it is ${L}.${first}`); } },
    c: { t: 'from factored form', g: R => { let zs, a;
      do { a = R.pick([1, 1, -1, 2, -2, 3]); const n = R.int(2, 3), ps = R.distinct(-6, 6, n); zs = ps.map(p => { let q = p === 0 ? 1 : R.pick([1, 1, 1, 2, 3, -1]); if (q > 1 && g2(p, q) !== 1) q = 1; return [p, R.pick([1, 1, 2, 2, 3]), q]; }); }
      while (degOf(zs) > 7 || new Set(zs.map(zval)).size !== zs.length || !zs.some(z => z[2] !== 1 || z[1] > 1));
      const D = degOf(zs), L = lead(a, zs);
      const tops = zs.map(([, m, q]) => q === 1 ? mono(1, m) : q === -1 ? pw('(-x)', m) : pw(`(${q}x)`, m)).join('');
      return E.num(`For ${M('f(x)=' + fac(a, zs))}, find the degree and the leading coefficient.`, [{ label: 'degree', ans: D }, { label: 'leading coefficient', ans: L }],
        `Multiply only the x-parts of each factor: ${M(co(a) + tops + '=' + mono(L, D))}. So the degree is ${D} and the leading coefficient is ${L}.`); } },
    d: { t: 'max number of zeros', g: R => { const kind = R.int(0, 2);
      if (kind === 0) { const deg = R.int(3, 9), ts = scramble(R, deg, nz(R, -9, 9), R.int(2, 4));
        return E.num(`At most how many real zeros can ${M('f(x)=' + terms(ts))} have?`, [{ ans: deg }], `A polynomial of degree ${deg} has at most ${deg} real zeros.`); }
      if (kind === 1) { const m = R.int(2, 6), n = R.int(2, 6);
        return E.num(`f has degree ${m} and g has degree ${n}. At most how many real zeros can ${M('f(x)g(x)')} have?`, [{ ans: m + n }], `Multiplying adds the degrees: ${m} + ${n} = ${m + n}, so at most ${m + n} real zeros.`); }
      const d1 = R.int(2, 4), d2 = R.int(1, 4), t1 = scramble(R, d1, nz(R, -5, 5), 2), t2 = scramble(R, d2, nz(R, -5, 5), 2);
      return E.num(`At most how many real zeros can ${M(`f(x)=(${terms(t1)})(${terms(t2)})`)} have?`, [{ ans: d1 + d2 }], `The degree is ${d1} + ${d2} = ${d1 + d2}, so there are at most ${d1 + d2} real zeros.`); } },
    e: { t: 'powers of brackets', g: R => {
      const a = R.pick([1, -1, 2, -2, 3, -3]), m = R.int(1, 3), k = R.pick([2, 3]), d = R.pick([1, -1, 2, -2]), n = R.int(1, 3), l = R.pick([1, 2]);
      const A = R.shuffle([[a, m], ...(m >= 2 ? [[nz(R, -5, 5), R.int(1, m - 1)]] : []), [nz(R, -6, 6), 0]]); if (A[0][1] === m) A.push(A.shift());
      const B = R.shuffle([[d, n], [nz(R, -6, 6), 0]]);
      const D = m * k + n * l, L = Math.pow(a, k) * Math.pow(d, l);
      return E.num(`For ${M(`f(x)=(${terms(A)})^${k}(${terms(B)})${l > 1 ? '^' + l : ''}`)}, find the degree and the leading coefficient.`, [{ label: 'degree', ans: D }, { label: 'leading coefficient', ans: L }],
        `Only the top term of each bracket matters: ${M(`(${mono(a, m)})^${k}${l > 1 ? `(${mono(d, n)})^${l}` : `(${mono(d, n)})`}=${mono(L, D)}`)}.`); } },
    f: { t: 'cancelling top terms', g: R => { const kind = R.int(0, 2);
      if (kind < 2) { const n = kind === 0 ? R.int(3, 6) : R.int(2, 4), a = R.int(1, 6), b = R.int(1, 6), u = kind === 0 ? 'x' : 'x^2', D = kind === 0 ? n - 1 : 2 * n - 2, L = n * (a + b);
        return E.num(`Find the degree and the leading coefficient of ${M(`f(x)=(${u}+${a})^${n}-(${u}-${b})^${n}`)}.`, [{ label: 'degree', ans: D }, { label: 'leading coefficient', ans: L }],
          `The ${M(kind === 0 ? 'x^' + n : 'x^' + 2 * n)} terms cancel. The next terms are ${n * a}${E.pt('x^' + D)} from the first bracket and −(${-n * b}${E.pt('x^' + D)}) from the second, which add to ${M(mono(L, D))}.`); }
      const m = R.int(1, 6), n = R.int(4, 6), p = R.int(2, n - 1), c = nz(R, -9, 9), askLow = R.bool(0.35);
      return E.num(`Let ${M(`f(x)=(k^2-${m * m})x^${n}+(k-${m})x^${p}+x${c > 0 ? '+' : ''}${c}`)}. For which value of k does f have degree exactly ${askLow ? 1 : p}?`, [{ label: 'k =', set: [String(askLow ? m : -m)] }],
        askLow ? `Both top terms must vanish: k² = ${m * m} and k = ${m}. That leaves k = ${m}.` : `The ${E.pt('x^' + n)} term must vanish, so k² = ${m * m} and k = ±${m}. But k = ${m} also kills the ${E.pt('x^' + p)} term, so k = −${m}.`); } },
  });

  /* IV.10.02 End behavior of polynomials */
  S('IV.10.02', 'End behavior of polynomials', {
    a: { t: 'even degree', g: R => { const deg = R.pick([2, 4, 6, 8]), L = R.bool() ? nz(R, 1, 9) : -nz(R, 1, 9), P = randPoly(R, deg, L);
      return E.choiceFixed(`Describe the end behavior of ${M('f(x)=' + poly(P))}.`, ENDS, endIdx(deg, L), endWhy(deg, L)); } },
    b: { t: 'odd degree', g: R => { const deg = R.pick([1, 3, 3, 5, 5, 7]), L = R.bool() ? nz(R, 1, 9) : -nz(R, 1, 9), P = randPoly(R, deg, L);
      return E.choiceFixed(`Describe the end behavior of ${M('f(x)=' + poly(P))}.`, ENDS, endIdx(deg, L), endWhy(deg, L)); } },
    c: { t: 'sign of the leader', g: R => { const t = R.int(0, 3), deg = t < 2 ? R.pick([2, 4, 6]) : R.pick([3, 5, 7]), L = (t % 2 === 0 ? 1 : -1) * R.int(1, 9), ts = scramble(R, deg, L, R.int(3, 4));
      if (ts[0][1] !== deg && R.bool(0.7)) ts[0][0] = -Math.sign(L) * Math.abs(ts[0][0]);
      return E.choiceFixed(`Describe the end behavior of ${M('f(x)=' + terms(ts))}.`, ENDS, t, `The leading term is ${M(mono(L, deg))}, not the first term written. ` + endWhy(deg, L)); } },
    d: { t: 'match graphs', g: R => { const t = R.int(0, 3), deg = t < 2 ? R.pick([2, 4, 6]) : R.pick([3, 5, 7]), L = (t % 2 === 0 ? 1 : -1) * R.int(1, 9), ts = scramble(R, deg, L, R.int(3, 4));
      const shape = k => { const n = k < 2 ? 4 : 3, xs = R.distinct(-3, 3, n).sort((u, v) => u - v), s = k % 2 === 0 ? 1 : -1;
        return sketch(s, xs.map(r => [r, 1]), { x: [-5, 5], w: 170, h: 150, dots: false, label: 'polynomial graph' }); };
      const svgs = [0, 1, 2, 3].map(shape);
      return E.choice(R, `Which graph has the same end behavior as ${M('f(x)=' + terms(ts))}?`, svgs[t], svgs.filter((_, k) => k !== t), `The leading term is ${M(mono(L, deg))}. ` + endWhy(deg, L)); } },
  });

  /* IV.10.03 Zeros & multiplicity */
  const genZ = (R, n, lo, hi, mults) => R.distinct(lo, hi, n).map(p => [p, R.pick(mults)]);
  S('IV.10.03', 'Zeros & multiplicity', {
    a: { t: 'read zeros from factors', g: R => { const a = R.pick([1, 1, 2, -1, 3, -2]); let zs;
      do { zs = R.distinct(-7, 7, R.int(2, 3)).map(p => { const q = p !== 0 && R.bool(0.25) ? R.pick([2, 3]) : 1; return [p, R.pick([1, 1, 2, 3]), g2(p, q) === 1 ? q : 1]; }); } while (new Set(zs.map(zval)).size !== zs.length);
      const vals = zs.map(zstr);
      return E.num(`What are the zeros of ${M('f(x)=' + fac(a, zs))}?`, [{ label: 'x =', set: vals }], `Set each factor to 0: ${zs.map(z => M(lf(z[0], z[2]).replace(/^\(|\)$/g, '') + '=0')).join(', ')}. So x = ${listTxt(vals)}. The sign inside the bracket flips.`); } },
    b: { t: 'count multiplicity', g: R => { const a = R.pick([1, 1, -1, 2, 3]), zs = genZ(R, 3, -6, 6, [1, 2, 3, 4]); if (zs.every(z => z[1] === zs[0][1])) zs[0][1] = zs[0][1] === 1 ? 2 : 1; const z = R.pick(zs);
      return E.num(`What is the multiplicity of the zero x = ${z[0]} of ${M('f(x)=' + fac(a, zs))}?`, [{ label: 'multiplicity', ans: z[1] }], `The factor ${M(lf(z[0]))} appears ${z[1] === 1 ? 'once (no power)' : 'to the power ' + z[1]}, so x = ${z[0]} has multiplicity ${z[1]}.`); } },
    c: { t: 'total degree check', g: R => { const a = R.pick([1, -1, 2, 3]), zs = genZ(R, R.int(2, 3), -6, 6, [1, 2, 3, 4]), D = degOf(zs);
      if (R.bool()) return E.num(`What is the degree of ${M('f(x)=' + fac(a, zs))}?`, [{ label: 'degree', ans: D }], `Add the multiplicities: ${zs.map(z => z[1]).join(' + ')} = ${D}.`);
      const z = R.pick(zs), shown = fac(a, zs.map(w => w === z ? w : w)).replace(pw(lf(z[0]), z[1]), pw(lf(z[0]), 'k')).replace(/\^k/, '^k');
      const txt = z[1] === 1 ? fac(a, zs).replace(lf(z[0]), lf(z[0]) + '^k') : shown;
      return E.num(`${M('f(x)=' + txt)} has degree ${D}. What is k?`, [{ label: 'k =', ans: z[1] }], `The multiplicities add up to the degree: ${D} − ${D - z[1]} = ${z[1]}.`); } },
    d: { t: 'from a graph', g: R => { const s = R.pick([1, -1]); let zs; do zs = genZ(R, 3, -4, 4, [1, 1, 2, 3]); while (zs.every(z => z[1] % 2 === 1) || degOf(zs) > 6 || !gapOK(zs.map(z => z[0])));
      zs.sort((u, v) => u[0] - v[0]);
      const right = fac(s, zs), cand = [fac(s, zs.map(([p, m]) => [-p, m])), fac(-s, zs)];
      zs.forEach((z, i) => { cand.push(fac(s, zs.map((w, j) => j === i ? [w[0], w[1] === 1 ? 2 : w[1] === 2 ? 1 : 2] : w))); });
      const wrong = R.sample([...new Set(cand)].filter(c => c !== right), 3);
      const how = zs.map(([p, m]) => `${p}: ${m === 1 ? 'crosses' : m === 2 ? 'touches' : 'crosses flat'}`).join('; ');
      return E.choice(R, `The graph of a polynomial is shown. Which could be its equation?`, M('y=' + right), wrong.map(w => M('y=' + w)), `Read each zero: ${how}. A crossing means odd multiplicity, a touch means even. The right end goes ${s * lead(1, zs) > 0 ? 'up' : 'down'}, so the leading coefficient is ${s > 0 ? 'positive' : 'negative'}.`,
        { visual: sketch(s, zs, { text: true }) }); } },
  });

  /* IV.10.04 Behavior at zeros */
  const BEH = m => m % 2 ? (m === 1 ? 'crosses' : 'crosses, flattening out') : 'touches and turns back';
  S('IV.10.04', 'Behavior at zeros', {
    a: { t: 'cross at odd multiplicity', g: R => { const a = R.pick([1, -1, 2, 3]), ps = R.distinct(-7, 7, R.int(2, 3)), zs = ps.map((p, i) => [p, i === 0 ? R.pick([1, 3]) : i === 1 ? 2 : R.pick([1, 2, 3])]); const odd = R.bool(), z = R.pick(zs.filter(w => (w[1] % 2 === 1) === odd));
      return E.choiceFixed(`At x = ${z[0]}, does the graph of ${M('y=' + fac(a, R.shuffle(zs)))} cross the x-axis or touch it and turn back?`, ['crosses', 'touches and turns back'], odd ? 0 : 1, `The multiplicity of ${z[0]} is ${z[1]}, which is ${odd ? 'odd, so the graph crosses' : 'even, so the graph touches and turns back'}.`); } },
    b: { t: 'bounce at even', g: R => { const a = R.pick([1, -1, 2, -3]); let zs; do zs = genZ(R, R.int(3, 4), -6, 6, [1, 2, 3, 4]); while (!zs.some(z => z[1] % 2 === 0) || !zs.some(z => z[1] % 2 === 1) || degOf(zs) > 10);
      const ev = zs.filter(z => z[1] % 2 === 0).map(z => String(z[0]));
      return E.num(`At which zeros does the graph of ${M('y=' + fac(a, zs))} touch the x-axis and turn back?`, [{ label: 'x =', set: ev }], `It turns back at zeros of even multiplicity: x = ${listTxt(ev)}. At the others (odd multiplicity) it crosses.`); } },
    c: { t: 'flatten at triple', g: R => { const a = R.pick([1, -1, 2]), zs = genZ(R, 3, -6, 6, [1]); const ms = R.shuffle([1, 2, 3]); zs.forEach((z, i) => z[1] = ms[i]); const z = R.bool(0.5) ? zs.find(w => w[1] === 3) : R.pick(zs);
      const opts = ['crosses like a straight line', 'touches and turns back', 'crosses, flattening out like y = x³', 'does not reach the axis'];
      return E.choice(R, `How does the graph of ${M('y=' + fac(a, zs))} behave at x = ${z[0]}?`, opts[z[1] - 1], opts.filter((_, k) => k !== z[1] - 1), `x = ${z[0]} has multiplicity ${z[1]}: ${['odd and simple, so it crosses like a line', 'even, so it touches and turns back', 'odd and 3, so it crosses but flattens, like y = x³'][z[1] - 1]}.`); } },
    d: { t: 'predict the shape', g: R => { const s = R.pick([1, -1]); let xs; do xs = R.distinct(-4, 4, 3).sort((u, v) => u - v); while (!gapOK(xs)); let ms; do ms = xs.map(() => R.pick([1, 2, 3])); while (ms.every(m => m === 1));
      const zs = xs.map((p, i) => [p, ms[i]]), cls = (m, sg) => m.map(v => v % 2).join('') + sg;
      const pics = [], seen = new Set([cls(ms, s)]);
      for (const sg of R.shuffle([1, -1])) for (const m of R.shuffle([[1, 1, 1], [2, 1, 1], [1, 2, 1], [1, 1, 2], [2, 2, 1], [1, 2, 2], [2, 1, 2], [3, 1, 1], [1, 3, 2], [2, 1, 3]])) { if (seen.has(cls(m, sg)) || pics.length >= 3) continue; seen.add(cls(m, sg)); pics.push(sketch(sg, xs.map((p, i) => [p, m[i]]), { x: [-5, 5], w: 170, h: 150, label: 'polynomial graph' })); }
      return E.choice(R, `Which graph could be ${M('y=' + fac(s, zs))}?`, sketch(s, zs, { x: [-5, 5], w: 170, h: 150, label: 'polynomial graph' }), pics,
        `${zs.map(([p, m]) => `At ${p}, multiplicity ${m}: ${BEH(m)}`).join('. ')}. The right end goes ${s > 0 ? 'up' : 'down'}.`); } },
    e: { t: 'factor first', g: R => { let chunks, mult;
      do { chunks = []; mult = {}; const add = (x, k) => { mult[x] = (mult[x] || 0) + k; };
        const n = R.int(2, 3);
        for (let i = 0; i < n; i++) { const kind = R.int(0, 3), r = R.int(1, 5), sg = R.pick([1, -1]), e = R.pick([1, 1, 2]);
          if (kind === 0) { chunks.push(`(x^2-${r * r})${e > 1 ? '^' + e : ''}`); add(r, e); add(-r, e); }
          else if (kind === 1) { chunks.push(`(${poly([1, -2 * sg * r, r * r])})${e > 1 ? '^' + e : ''}`); add(sg * r, 2 * e); }
          else if (kind === 2) { chunks.push(`(${poly([1, -sg * r, 0])})${e > 1 ? '^' + e : ''}`); add(0, e); add(sg * r, e); }
          else { const k = R.pick([1, 2, 3]); chunks.push(pw(E.lin(sg * r), k)); add(sg * r, k); } } }
      while (Object.keys(mult).length < 2 || Object.keys(mult).length > 4 || !Object.values(mult).some(k => k % 2) || !Object.values(mult).some(k => k % 2 === 0) || new Set(chunks).size !== chunks.length || Object.values(mult).reduce((a, b) => a + b, 0) > 9);
      const ask = R.bool(), keys = Object.keys(mult).map(Number).sort((u, v) => u - v), ans = keys.filter(x => (mult[x] % 2 === 1) === ask).map(String);
      return E.num(`At which zeros does the graph of ${M('y=' + chunks.join(''))} ${ask ? 'cross the x-axis' : 'touch the x-axis and turn back'}?`, [{ label: 'x =', set: ans }],
        `Factor fully and count: ${keys.map(x => `${x} has multiplicity ${mult[x]}`).join(', ')}. It ${ask ? 'crosses at odd' : 'turns back at even'} multiplicity: x = ${listTxt(ans)}.`); } },
    f: { t: 'new graphs from old', g: R => { const kind = R.int(0, 1); let Z;
      if (kind === 0) { do Z = R.distinct(-9, 9, 3).sort((u, v) => u - v); while (!Z.some(z => z > 0) || !Z.some(z => z <= 0));
        const pos = Z.filter(z => z > 0), total = R.bool(0.4), ans = 2 * pos.length + (total && Z.includes(0) ? 1 : 0);
        return E.num(`${M('f(x)=' + Z.map(z => E.lin(z)).join(''))}. At how many points does the graph of ${M('y=f(x^2)')} ${total ? 'meet' : 'cross'} the x-axis?`, [{ ans }],
          `f(x²) = 0 when x² = ${listTxt(Z.map(String))}. ${pos.map(z => `x² = ${z} gives x = ±${isSq(z) ? Math.sqrt(z) : '√' + z}`).join('; ')}, each a single zero where it crosses.${Z.includes(0) ? ' x² = 0 gives a double zero at 0, where it only touches.' : ''}${Z.some(z => z < 0) ? ' A negative value of x² gives nothing.' : ''} Answer: ${ans}.`); }
      do Z = R.distinct(-5, 5, R.int(3, 4)).sort((u, v) => u - v); while (!Z.some(z => Z.includes(-z)));
      const both = Z.filter(z => Z.includes(-z)), all = [...new Set([...Z, ...Z.map(z => -z)])].sort((u, v) => u - v), one = all.filter(z => !both.includes(z)), bothAll = both, askT = R.bool(0.4);
      const ans = askT ? bothAll.length : one.length;
      return E.num(`${M('f(x)=' + Z.map(z => E.lin(z)).join(''))}. At how many points does the graph of ${M('y=f(x)f(-x)')} ${askT ? 'touch the x-axis and turn back' : 'cross the x-axis'}?`, [{ ans }],
        `f(−x) has zeros ${listTxt(Z.map(z => String(-z)).reverse())}. A number that is a zero of both has multiplicity 2, so the graph touches there: ${bothAll.length ? listTxt(bothAll.map(String)) : 'none'}. The rest are single zeros where it crosses: ${one.length ? listTxt(one.map(String)) : 'none'}. Answer: ${ans}.`); } },
  });

  /* IV.10.05 Sketch from factored form */
  S('IV.10.05', 'Sketch from factored form', {
    a: { t: 'plot zeros', g: R => { const a = R.pick([1, -1, 2, -2, 3]); let zs; do zs = R.distinct(-7, 7, R.int(2, 3)).map(p => { const q = p !== 0 && R.bool(0.2) ? 2 : 1; return [p, R.pick([1, 1, 2]), g2(p, q) === 1 ? q : 1]; }); while (new Set(zs.map(zval)).size !== zs.length);
      const extra = R.bool(0.3) ? `(x^2+${R.int(1, 9)})` : '', vals = zs.map(zstr);
      return E.num(`Where does the graph of ${M('y=' + fac(a, zs) + extra)} meet the x-axis? Give the x-values.`, [{ label: 'x =', set: vals }], `Each bracket gives one zero: x = ${listTxt(vals)}.${extra ? ` ${E.pt(extra.slice(1, -1))} is always positive, so it gives no x-intercept.` : ''}`); } },
    b: { t: 'y-intercept', g: R => { const a = R.pick([1, -1, 2, -2, 3]), zs = R.distinct(-5, 5, R.int(2, 3)).filter(p => p !== 0).map(p => [p, R.pick([1, 1, 2, 3]), R.pick([1, 1, 1, -1])]);
      if (zs.length < 2) zs.push([zs.some(z => z[0] === 6) ? -6 : 6, 1, 1]);
      const y0 = fnOf(a, zs)(0), parts = zs.map(([p, m, q]) => pw(`(${q === -1 ? p : -p})`, m)).join('·');
      return E.num(`What is the y-intercept of ${M('y=' + fac(a, zs))}?`, [{ label: 'y =', ans: y0 }], `Put x = 0: y = ${a === 1 ? '' : a === -1 ? '−' : a + '·'}${E.pt(parts)} = ${y0}.`); } },
    c: { t: 'end behavior', g: R => { const t = R.int(0, 3); let a, zs, D, L;
      do { a = R.pick([1, -1, 2, -2, 3, -1]); zs = R.distinct(-6, 6, R.int(2, 3)).map(p => [p, R.pick([1, 1, 2, 3]), p !== 0 && R.bool(0.2) && p % 2 ? 2 : 1]); D = degOf(zs); L = lead(a, zs); } while (endIdx(D, L) !== t || D > 7);
      return E.choiceFixed(`How do the ends of the graph of ${M('y=' + fac(a, zs))} behave?`, ENDS, t, `The leading term is ${M(mono(L, D))}. ` + endWhy(D, L)); } },
    d: { t: 'join the pieces', g: R => { const s = R.pick([1, -1]); let zs; do zs = R.distinct(-4, 4, 3).map(p => [p, R.pick([1, 1, 2, 3])]); while (!gapOK(zs.map(z => z[0])) || zs.every(z => z[1] === 1) || (zs.map(z => -z[0]).sort().join() === zs.map(z => z[0]).sort().join() && R.bool(0.8)));
      zs.sort((u, v) => u[0] - v[0]);
      const pic = (sg, w) => sketch(sg, w, { x: [-5, 5], w: 170, h: 150, text: true, label: 'polynomial graph' });
      const right = pic(s, zs), cand = [pic(-s, zs), pic(s * (degOf(zs) % 2 ? -1 : 1), zs.map(([p, m]) => [-p, m]))];
      zs.forEach((z, i) => cand.push(pic(s, zs.map((w, j) => j === i ? [w[0], w[1] === 2 ? 1 : 2] : w))));
      const wrong = R.sample([...new Set(cand)].filter(c => c !== right), 3);
      return E.choice(R, `Which graph shows ${M('y=' + fac(s, zs))}?`, right, wrong, `Zeros ${zs.map(([p, m]) => `${p} (${BEH(m)})`).join(', ')}; the leading coefficient is ${s * lead(1, zs) > 0 ? 'positive' : 'negative'}, so the right end goes ${s > 0 ? 'up' : 'down'}.`); } },
  });

  /* IV.10.06 Turning points */
  const tpCubic = R => { let p, q; do { p = R.int(-4, 4); q = R.int(-4, 4); } while (p >= q || (p + q) % 2 !== 0); const s = R.pick([1, -1]), d = R.int(-8, 8);
    const P = [s, -s * 3 * (p + q) / 2, s * 3 * p * q, d]; return { p, q, s, P, f: x => pev(P, x) }; };
  S('IV.10.06', 'Turning points', {
    a: { t: 'at most n − 1', g: R => { const deg = R.int(2, 9), useFac = R.bool(0.3);
      if (useFac) { const zs = genZ(R, R.int(2, 3), -6, 6, [1, 2, 3]), D = degOf(zs); return E.num(`At most how many turning points can the graph of ${M('y=' + fac(R.pick([1, -1, 2]), zs))} have?`, [{ ans: D - 1 }], `Its degree is ${zs.map(z => z[1]).join(' + ')} = ${D}, so it has at most ${D} − 1 = ${D - 1} turning points.`); }
      const ts = scramble(R, deg, nz(R, -9, 9), R.int(2, 4));
      return E.num(`At most how many turning points can the graph of ${M('y=' + terms(ts))} have?`, [{ ans: deg - 1 }], `Degree ${deg} allows at most ${deg} − 1 = ${deg - 1} turning points.`); } },
    b: { t: 'find them with technology', g: R => { const { p, q, P, f } = tpCubic(R);
      return E.num(`Use a graphing tool to find the x-coordinates of the turning points of ${M('y=' + poly(P))}.`, [{ label: 'x =', set: [String(p), String(q)] }], `The graph turns at x = ${p} (y = ${f(p)}) and x = ${q} (y = ${f(q)}).`); } },
    c: { t: 'local max and min', g: R => { const { p, q, s, P, f } = tpCubic(R), mx = s > 0 ? p : q, mn = s > 0 ? q : p;
      return E.num(`Use a graphing tool to find the local maximum and local minimum of ${M('y=' + poly(P))}.`, [{ label: 'local max at', point: [String(mx), String(f(mx))] }, { label: 'local min at', point: [String(mn), String(f(mn))] }],
        `The leading coefficient is ${s > 0 ? 'positive' : 'negative'}, so the ${s > 0 ? 'left' : 'right'} turn is the peak: local max (${mx}, ${f(mx)}), local min (${mn}, ${f(mn)}).`); } },
    d: { t: 'meaning in context', g: R => { const kind = R.int(0, 2);
      if (kind === 0) { const x = R.int(10, 60), h = R.int(12, 45);
        return E.choice(R, `A roller coaster's height h(x) in meters, x meters along the track, has a local maximum at (${x}, ${h}). What does this mean?`, `${x} m along, the track peaks at ${h} m, higher than the track nearby.`, [`${h} m along, the track peaks at ${x} m high.`, `${h} m is the highest point of the whole ride.`, `The track is ${h} m high for the first ${x} m.`], 'A local max (x, y) is a peak: at input x the output y is higher than at nearby inputs, but not necessarily the highest overall.'); }
      if (kind === 1) { const t = R.int(2, 10), T = R.int(-8, 12);
        return E.choice(R, `The temperature T(t) in °C, t hours after midnight, has a local minimum at (${t}, ${T}). What does this mean?`, `About ${t} hours after midnight the temperature bottoms out at ${neg(T)}°C, then starts rising.`, [`About ${neg(T)} hours after midnight the temperature bottoms out at ${t}°C.`, `${neg(T)}°C is the coldest temperature all year.`, `The temperature stays at ${neg(T)}°C for ${t} hours.`], 'A local min (t, T) is a valley: the temperature stops falling and starts rising at time t, at the value T.'); }
      const u = R.int(2, 9), P = R.int(20, 90);
      return E.choice(R, `A company's profit P(x), in thousands of dollars, for x hundred items has a local maximum at (${u}, ${P}). What does this mean?`, `Making about ${u * 100} items gives a profit of $${P},000, more than slightly fewer or more items.`, [`Making about ${P * 100} items gives a profit of $${u},000.`, `The profit can never be more than $${P},000.`, `The company loses money after ${u} items.`], 'The x-value is the input (items) and the y-value is the output (profit); "local" means best compared with nearby inputs.'); } },
    e: { t: 'complete the square in x²', g: R => { const a = R.int(1, 3), c = R.int(-9, 9), s = R.pick([1, -1]), P = [s, 0, -s * 2 * a * a, 0, c], v = c - s * a ** 4;
      const lbl = s > 0 ? ['local max at', 'local minima at x =', 'minimum value'] : ['local min at', 'local maxima at x =', 'maximum value'];
      return E.num(`Find the turning points of ${M('y=' + poly(P))} without technology.`, [{ label: lbl[0], point: ['0', String(c)] }, { label: lbl[1], set: [String(a), String(-a)] }, { label: lbl[2], ans: v }],
        `Complete the square in x²: ${M('y=' + (s > 0 ? '' : '-') + `(x^2-${a * a})^2${v > 0 ? '+' : ''}${v === 0 ? '' : v}`)}. The bracket is 0 at x = ±${a}, giving the ${s > 0 ? 'minimum' : 'maximum'} ${v}; at x = 0 there is a local ${s > 0 ? 'max' : 'min'}, y = ${c}.`); } },
    f: { t: 'one turn or three', g: R => { const kind = R.int(0, 2), a = kind === 2 ? R.int(1, 5) : kind === 1 ? nz(R, -6, 6) : R.int(-6, 6), s = R.pick([1, -1]), c = nz(R, -9, 9), three = R.bool();
      const B = kind === 0 ? `(k${a > 0 ? '-' + a : a < 0 ? '+' + -a : ''})` : kind === 1 ? `(${a}-k)` : `(k^2-${a * a})`;
      const Bt = B.replace('(k)', 'k');
      let iv; const sig = kind === 1 ? -s : s;   // g(k) = sig·(k − a)  or  s·(k² − a²)
      if (kind < 2) iv = three ? (sig > 0 ? `(-inf,${a})` : `(${a},inf)`) : (sig > 0 ? `[${a},inf)` : `(-inf,${a}]`);
      else iv = three ? (s > 0 ? `(-${a},${a})` : `(-inf,-${a})U(${a},inf)`) : (s > 0 ? `(-inf,-${a}]U[${a},inf)` : `[-${a},${a}]`);
      const rule = s > 0 ? 'x⁴ + Bx² + c has three turning points when B < 0 (a W shape) and one when B ≥ 0 (a U shape)' : '−x⁴ + Bx² + c has three turning points when B > 0 (an M shape) and one when B ≤ 0';
      return E.num(`For which values of k does ${M(`y=${s > 0 ? '' : '-'}x^4+${Bt}x^2${c > 0 ? '+' : ''}${c}`)} have exactly ${three ? 'three turning points' : 'one turning point'}?`, [{ interval: iv }],
        `With u = x², ${rule}. Here B = ${E.pt(Bt.replace(/^\((.*)\)$/, '$1'))}, so k is in ${E.pt(iv)}.`); } },
  });

  /* IV.10.07 Remainder theorem */
  S('IV.10.07', 'Remainder theorem', {
    a: { t: 'f(a) is the remainder', g: R => { const P = [R.pick([1, 2, -1, 3]), R.int(-6, 6), R.int(-6, 6), R.int(-9, 9)], r = nz(R, -4, 4), rem = pev(P, r);
      return E.num(`What is the remainder when ${M('f(x)=' + poly(P))} is divided by ${M(E.lin(r))}?`, [{ label: 'remainder', ans: rem }], `Dividing by ${E.pt(E.lin(r))} means a = ${r}, so the remainder is f(${r}) = ${subst(P, r)} = ${rem}.`); } },
    b: { t: 'use synthetic division', g: R => { const n = R.pick([3, 3, 4]), P = [R.pick([1, 2, 3, -1]), ...range(1, n).map(() => R.int(-7, 7))], r = nz(R, -4, 4), { row, q, rem } = syn(P, r);
      return E.num(`Use synthetic division to divide ${M(poly(P))} by ${M(E.lin(r))}. Give the quotient and the remainder.`, [{ label: 'quotient', expr: poly(q), form: 'expanded' }, { label: 'remainder', ans: rem }],
        `With ${r} outside and coefficients ${P.join(', ')}: bring down, multiply by ${r}, add. The bottom row is ${row.join(', ')}, so the quotient is ${M(poly(q))} and the remainder is ${rem}.`); } },
    c: { t: 'evaluate quickly', g: R => { let P, r, v; do { const n = R.int(4, 5); P = [R.pick([1, 2, -1]), ...range(1, n).map(() => R.bool(0.35) ? 0 : R.int(-6, 6))]; r = R.pick([-4, -3, -2, 2, 3, 4, 5, -5]); v = pev(P, r); } while (Math.abs(v) > 4000 || !P.slice(1).includes(0));
      const { row } = syn(P, r);
      return E.num(`Use synthetic division to find f(${r}) for ${M('f(x)=' + poly(P))}.`, [{ label: `f(${neg(r)}) =`, ans: v }], `Write every coefficient, with 0 for missing powers: ${P.join(', ')}. Dividing by ${E.pt(E.lin(r))} gives the row ${row.join(', ')}; the remainder is f(${r}) = ${v}.`); } },
    d: { t: 'solve for a missing coefficient', g: R => { const pos = R.pick([2, 1]), a3 = R.pick([1, 2, -1]), b2 = R.int(-6, 6), b1 = R.int(-6, 6), c0 = R.int(-9, 9), k = R.int(-7, 7), r = nz(R, -3, 3);
      const P = [a3, pos === 2 ? k : b2, pos === 1 ? k : b1, c0], rem = pev(P, r), rj = r ** pos, A = rem - k * rj;
      const txt = `${mono(a3, 3)}${pos === 2 ? '+kx^2' : sgnT(b2, 2)}${pos === 1 ? '+kx' : sgnT(b1, 1)}${sgnT(c0, 0)}`;
      return E.num(`When ${M(txt)} is divided by ${M(E.lin(r))}, the remainder is ${rem}. Find k.`, [{ label: 'k =', ans: k }], `By the remainder theorem f(${r}) = ${rem}: ${M(le([[rj, 'k']], rem).replace('=', (A ? (A > 0 ? '+' : '') + A : '') + '='))}, so k = ${k}.`); } },
  });

  /* IV.10.08 Factor theorem */
  S('IV.10.08', 'Factor theorem', {
    a: { t: 'f(a) = 0 means (x − a) is a factor', g: R => { const kind = R.int(0, 2);
      if (kind === 0) { const r = nz(R, -9, 9); let c; do c = nz(R, -9, 9); while (Math.abs(c) === Math.abs(r));
        return E.choice(R, `A polynomial has f(${r}) = 0 and f(0) = ${c}. Which must be a factor of f(x)?`, M(E.lin(r)), [M(E.lin(-r)), M(E.lin(c)), M(E.lin(-c))], `f(${r}) = 0 makes x = ${r} a zero, so ${M(E.lin(r))} is a factor. f(0) = ${c} is just the y-intercept.`); }
      if (kind === 1) { const r = nz(R, -9, 9);
        return E.choice(R, `${M(E.lin(r))} is a factor of f(x). Which must be true?`, M(`f(${r})=0`), [M(`f(${-r})=0`), M(`f(0)=${r}`), M(`f(0)=${-r}`)], `The factor ${E.pt(E.lin(r))} is 0 at x = ${r}, so f(${r}) = 0.`); }
      const p = R.int(1, 3); let q; do q = R.int(2, 5); while (g2(p, q) !== 1 || q === p); const sg = R.pick([1, -1]);
      return E.choice(R, `f(${E.fracStr(sg * p, q)}) = 0. Which must be a factor of f(x)?`, M(lf(sg * p, q)), [M(lf(-sg * p, q)), M(lf(sg * q, p)), M(E.lin(sg * p))], `x = ${E.fracStr(sg * p, q)} solves ${E.pt(lf(sg * p, q).slice(1, -1))} = 0, so ${E.pt(lf(sg * p, q))} is a factor.`); } },
    b: { t: 'test a factor', g: R => { const r = nz(R, -5, 5), Q = [1, R.int(-6, 6), R.int(-9, 9)], P = pmul([1, -r], Q), yes = R.bool(); let t = r;
      if (!yes) { do t = nz(R, -5, 5); while (pev(P, t) === 0); }
      const v = pev(P, t);
      return E.choiceFixed(`Is ${M(E.lin(t))} a factor of ${M(poly(P))}?`, ['Yes', 'No'], yes ? 0 : 1, `Test f(${t}) = ${subst(P, t)} = ${v}${v === 0 ? ', so yes, it is a factor.' : ', not 0, so it is not a factor.'}`); } },
    c: { t: 'divide it out', g: R => { const r = nz(R, -5, 5), Q = [R.pick([1, 1, 2, 3, -1]), R.int(-7, 7), R.int(-9, 9)], P = pmul([1, -r], Q), { row } = syn(P, r);
      return E.num(`${M(E.lin(r))} is a factor of ${M('f(x)=' + poly(P))}. Find the other factor.`, [{ label: 'other factor', expr: poly(Q), form: 'expanded' }], `Synthetic division by ${r} gives the row ${row.join(', ')}. The remainder is 0 and the quotient is ${M(poly(Q))}.`); } },
    d: { t: 'factor the rest', g: R => { const r = nz(R, -5, 5); let rest, ans, P, Q, why;
      if (R.bool(0.6)) { let s, t; do { s = R.int(-6, 6); t = R.int(-6, 6); } while (s === r || t === r || s > t); const qd = R.bool(0.25) && s % 2 ? 2 : 1; rest = [[s, 1, qd], [t, 1]]; ans = fac(1, [[r, 1], ...rest]); P = expand(1, [[r, 1], ...rest]); Q = syn(P, r).q; why = `${M(poly(Q))} factors as ${M(fac(1, rest))}`; }
      else { const b = R.int(-3, 3), c = R.int(1, 9); Q = [1, b, c]; if (b * b - 4 * c >= 0) Q = [1, 0, c]; P = pmul([1, -r], Q); ans = `${E.lin(r)}(${poly(Q)})`; why = `${M(poly(Q))} has no real zeros, so it doesn't factor further`; }
      return E.num(`x = ${r} is a zero of ${M('f(x)=' + poly(P))}. Factor f(x) completely.`, [{ expr: ans, form: 'complete' }], `Divide by ${E.pt(E.lin(r))}: the quotient is ${M(poly(Q))}. ${why}. So ${M('f(x)=' + ans)}.`); } },
  });

  /* IV.10.09 Rational root theorem */
  const cands = (a0, an) => { const out = []; for (const p of divs(a0)) for (const q of divs(an)) for (const sg of [1, -1]) { const s = E.fracStr(sg * p, q); if (!out.includes(s)) out.push(s); } return out; };
  const irrQuad = (R, lo = -6, hi = 6, cmax = 9) => { let b, c; do { b = R.int(lo, hi); c = nz(R, -cmax, cmax); } while (isSq(b * b - 4 * c)); return [1, b, c]; };
  S('IV.10.09', 'Rational root theorem', {
    a: { t: 'list p/q candidates', g: R => { let an, a0, L; do { an = R.pick([1, 1, 2, 3]); a0 = nz(R, -10, 10); L = cands(a0, an); } while (L.length > 8 || L.length < 4);
      const P = [an, R.int(-6, 6), R.int(-6, 6), a0], why = `p divides ${Math.abs(a0)} (${divs(a0).join(', ')}) and q divides ${an} (${divs(an).join(', ')})`;
      if (R.bool(0.55)) return E.num(`List every possible rational root of ${M(poly(P) + '=0')} given by the rational root theorem.`, [{ label: 'x =', set: L }], `Candidates are ±p/q where ${why}: ${L.map(E.pt).join(', ')}.`);
      const pool = [...divs(a0).map(d => E.fracStr(an, d)), ...divs(a0).map(d => E.fracStr(-an, d)), String(Math.abs(a0) + 1), String(-2 * Math.abs(a0)), E.fracStr(1, 2 * an + 2)].filter(s => !L.includes(s) && s !== '0');
      const bad = R.pick([...new Set(pool)]);
      return E.choice(R, `Which of these can NOT be a rational root of ${M(poly(P) + '=0')}?`, M(bad), R.sample(L, 3).map(M), `Every candidate is ±p/q where ${why}. ${E.pt(bad)} is not of that form.`); } },
    b: { t: 'test them', g: R => { let P, roots; do { if (R.bool()) { roots = [nz(R, -4, 4), nz(R, -4, 4), nz(R, -4, 4)]; P = expand(1, roots.map(r => [r, 1])); } else { const r = nz(R, -4, 4), Q = irrQuad(R, -4, 4, 6); roots = [r]; P = pmul([1, -r], Q); } } while (Math.abs(P[3]) > 12);
      const L = cands(P[3], 1), rs = [...new Set(roots)].sort((u, v) => u - v).map(String);
      return E.num(`Test the possible rational roots of ${M(poly(P) + '=0')}. List every rational root.`, [{ label: 'x =', set: rs }], `Candidates: ${L.map(E.pt).join(', ')}. Substituting, only ${listTxt(rs)} ${rs.length > 1 ? 'give' : 'gives'} 0.`); } },
    c: { t: 'find a first root', g: R => { let p, q, Q, P; do { q = R.pick([2, 3]); p = nz(R, -5, 5); Q = irrQuad(R, -4, 4, 7); P = pmul([q, -p], Q); } while (g2(p, q) !== 1 || Math.abs(P[3]) > 30);
      return E.num(`${M(poly(P) + '=0')} has exactly one rational root. Find it.`, [{ label: 'x =', set: [E.fracStr(p, q)] }], `Candidates are ±p/q with p | ${Math.abs(P[3])} and q | ${P[0]}. Testing finds f(${E.fracStr(p, q)}) = 0; the leftover quadratic ${M(poly(Q))} has no rational roots.`); } },
    d: { t: 'reduce the degree', g: R => { let p, q, Q, P; do { q = R.pick([1, 2, 2, 3]); p = nz(R, -5, 5); Q = irrQuad(R, -5, 5, 8); P = pmul([q, -p], Q); } while (g2(p, q) !== 1 || Math.abs(P[3]) > 30);
      const ans = `${lf(p, q)}(${poly(Q)})`;
      return E.num(`${M('f(x)=' + poly(P))} has exactly one rational root. Find it, then write f(x) as a linear factor times a quadratic.`, [{ label: 'root x =', set: [E.fracStr(p, q)] }, { label: 'f(x) =', expr: ans, form: 'factored' }],
        `Testing candidates finds x = ${E.fracStr(p, q)}, so ${E.pt(lf(p, q))} is a factor. Dividing it out leaves ${M(poly(Q))}: ${M(ans)}.`); } },
    e: { t: 'clear the fractions first', g: R => { let zs, P, Lc; do { const q1 = R.pick([1, 2, 3]), q2 = R.pick([2, 3]); zs = [[nz(R, -5, 5), 1, q1], [nz(R, -5, 5), 1, q2], [nz(R, -4, 4), 1, 1]]; zs.forEach(z => { if (g2(z[0], z[2]) !== 1) z[2] = 1; }); Lc = lead(1, zs); P = expand(1, zs); } while (Lc < 2 || new Set(zs.map(zval)).size < 3 || P.some(c => Math.abs(c) > 60));
      const disp = P.map((c, i) => { const f = fr(c, Lc), pwr = 3 - i; if (!f[0]) return ''; const body = f[1] === 1 ? (Math.abs(f[0]) === 1 && pwr ? '' : Math.abs(f[0])) : `${Math.abs(f[0])}/${f[1]}`; return (f[0] < 0 ? '-' : i ? '+' : '') + body + (pwr ? 'x' + (pwr > 1 ? '^' + pwr : '') : ''); }).join('');
      const vals = zs.map(zstr);
      return E.num(`Find all rational roots of ${M(disp + '=0')}.`, [{ label: 'x =', set: vals }], `Multiply by ${Lc} first: ${M(poly(P) + '=0')}. Now the candidates are ±p/q with p | ${Math.abs(P[3])} and q | ${Lc}; testing gives x = ${listTxt(vals)}.`); } },
    f: { t: 'for which k is there a rational root', g: R => { let n, m, c, ks; do { n = R.pick([3, 3, 4]); m = R.int(1, Math.min(2, n - 1)); c = nz(R, n === 3 ? -6 : -4, n === 3 ? 6 : 4); ks = [];
        for (const d0 of divs(c)) for (const d of [d0, -d0]) { const num = -(d ** n + c), den = d ** m; if (num % den === 0 && !ks.includes(num / den)) ks.push(num / den); } } while (ks.length < 2 || ks.length > 6); ks.sort((u, v) => u - v);
      const cand = divs(c).flatMap(d => [d, -d]);
      return E.num(`Find all integers k for which ${M(`x^${n}+kx${m > 1 ? '^' + m : ''}${c > 0 ? '+' : ''}${c}=0`)} has a rational root.`, [{ label: 'k =', set: ks.map(String) }],
        `It's monic with integer coefficients, so a rational root must be an integer dividing ${Math.abs(c)}: ${cand.join(', ')}. Each candidate d gives k = −(d${E.pt('^' + n)} ${c > 0 ? '+' : '−'} ${Math.abs(c)})/d${m > 1 ? '²' : ''}; the integer values are k = ${listTxt(ks.map(String))}.`); } },
  });

  /* IV.10.10 Find all zeros */
  S('IV.10.10', 'Find all zeros', {
    a: { t: 'rational roots first', g: R => { const rs = R.distinct(-5, 5, 3).map(r => r === 0 ? 6 : r), L = R.pick([1, 1, 2, -1]), P = expand(L, rs.map(r => [r, 1])), r0 = R.pick(rs), Q = syn(P, r0).q;
      return E.num(`Find all zeros of ${M('f(x)=' + poly(P))}.`, [{ label: 'x =', set: rs.map(String) }], `Test divisors of ${Math.abs(P[3])}: f(${r0}) = 0. Divide to get ${M(poly(Q))}, which factors to give the other zeros. All zeros: ${listTxt(rs.map(String))}.`); } },
    b: { t: 'depressed quadratic', g: R => { let r, s, t; do { r = nz(R, -5, 5); s = R.int(-6, 6); t = R.int(-6, 6); } while (s > t || s === r || t === r); const L = R.pick([1, 1, 2]), Q = expand(L, [[s, 1], [t, 1]]), P = pmul([1, -r], Q);
      return E.num(`x = ${r} is a zero of ${M('f(x)=' + poly(P))}. Divide it out to get the depressed quadratic, then find the other zeros.`, [{ label: 'quotient', expr: poly(Q), form: 'expanded' }, { label: 'other zeros', set: [...new Set([String(s), String(t)])] }],
        `Synthetic division by ${r} leaves ${M(poly(Q))} = ${M(fac(L, s === t ? [[s, 2]] : [[s, 1], [t, 1]]))}, so the other ${s === t ? 'zero is ' + s + ' (a double root)' : 'zeros are ' + s + ' and ' + t}.`); } },
    c: { t: 'irrational and complex roots', g: R => { let r, h, n, P; do { r = nz(R, -4, 4); h = R.int(-3, 3); n = R.pick([2, 3, 5, 6, 7, 8, 12, -1, -4, -9, -2, -3, -8]); P = pmul([1, -r], [1, -2 * h, h * h - n]); } while (Math.abs(P[3]) > 40 || h * h - n === 0);
      const pr = pairRoots(h, n);
      return E.num(`Find all zeros of ${M('f(x)=' + poly(P))}. Give exact answers (complex ones too).`, [{ label: 'x =', set: [String(r), ...pr] }],
        `Testing divisors of ${Math.abs(P[3])} finds x = ${r}. Dividing leaves ${M(poly([1, -2 * h, h * h - n]))}; completing the square, ${M(`(x${h > 0 ? '-' + h : h < 0 ? '+' + -h : ''})^2=${n}`.replace('(x)^2', 'x^2'))}, so x = ${pr.map(E.pt).join(' or ')}.`); } },
    d: { t: 'write fully factored', g: R => { let r, s; do { r = nz(R, -4, 4); s = R.int(-4, 4); } while (s === r); const Q = R.bool() ? [1, 0, R.int(1, 9)] : irrQuad(R, -4, 4, 6), q = R.bool(0.3) && s % 2 ? 2 : 1;
      const P = pmul(expand(1, [[r, 1], [s, 1, q]]), Q), ans = fac(1, [[r, 1], [s, 1, q]]) + `(${poly(Q)})`;
      return E.num(`Factor ${M('f(x)=' + poly(P))} completely over the integers.`, [{ expr: ans, form: 'complete' }], `The rational root theorem finds x = ${r} and x = ${E.fracStr(s, q)}. Dividing both out leaves ${M(poly(Q))}, which has no rational roots. So ${M('f(x)=' + ans)}.`); } },
    e: { t: 'use the conjugate', g: R => { const h = R.int(-3, 3), cx = R.bool(), k = cx ? R.int(1, 3) : 1, n = cx ? -(k * k) : R.pick([2, 3, 5, 7]); let rs = [nz(R, -4, 4)]; if (R.bool(0.3)) { let t; do t = nz(R, -4, 4); while (t === rs[0]); rs.push(t); }
      const Q = [1, -2 * h, h * h - n], P = rs.reduce((A, r) => pmul(A, [1, -r]), Q), [z1, z2] = pairRoots(h, n);
      return E.num(`${M(z1)} is a zero of ${M('f(x)=' + poly(P))}. Find all zeros. Give exact answers.`, [{ label: 'x =', set: [z1, z2, ...rs.map(String)] }],
        `The coefficients are integers, so the conjugate ${E.pt(z2)} is a zero too. Together they give the factor ${M(poly(Q))}. Dividing it out leaves ${M(fac(1, rs.map(r => [r, 1])))}, so x = ${listTxt(rs.map(String))} as well.`); } },
    f: { t: 'a symmetric quartic', g: R => { const F = [[[2, -5, 2], ['2', '1/2']], [[2, 5, 2], ['-2', '-1/2']], [[3, -10, 3], ['3', '1/3']], [[3, 10, 3], ['-3', '-1/3']], [[4, -17, 4], ['4', '1/4']], [[4, 17, 4], ['-4', '-1/4']], [[1, -1, 1], []], [[1, 1, 1], []], [[1, 0, 1], []], [[1, -3, 1], ['(3+sqrt(5))/2', '(3-sqrt(5))/2']], [[1, 3, 1], ['(-3+sqrt(5))/2', '(-3-sqrt(5))/2']], [[1, -4, 1], ['2+sqrt(3)', '2-sqrt(3)']], [[1, 4, 1], ['-2+sqrt(3)', '-2-sqrt(3)']], [[1, -2, 1], ['1']], [[1, 2, 1], ['-1']]];
      let A, B; do { [A, B] = R.sample(F, 2); } while (!A[1].length && !B[1].length);
      const P = pmul(A[0], B[0]), sol = [...A[1], ...B[1]], u = f => E.fracStr(-f[0][1], f[0][0]);
      const say = f => f[1].length ? `u = ${E.pt(u(f))} gives x = ${f[1].map(E.pt).join(' or ')}` : `u = ${E.pt(u(f))} gives no real x (|u| < 2)`;
      return E.num(`Find all real solutions of ${M(poly(P) + '=0')}. Give exact answers.`, [{ label: 'x =', set: sol }],
        `The coefficients read the same both ways. Divide by x² and let u = x + 1/x; the equation becomes a quadratic in u with roots u = ${E.pt(u(A))} and u = ${E.pt(u(B))}. Then x + 1/x = u: ${say(A)}; ${say(B)}.`); } },
  });

  /* IV.10.11 Write a polynomial from zeros */
  S('IV.10.11', 'Write a polynomial from zeros', {
    a: { t: 'factors from zeros', g: R => { const rs = R.distinct(-7, 7, 3), zs = rs.map(r => [r, 1]);
      return E.num(`Write the monic cubic (leading coefficient 1) whose zeros are ${listTxt(rs.map(String))}.`, [{ label: 'f(x) =', expr: fac(1, zs) }], `Each zero r gives a factor (x − r): ${M('f(x)=' + fac(1, zs))}.`); } },
    b: { t: 'include multiplicity', g: R => { const zs = genZ(R, R.int(2, 3), -6, 6, [1, 2, 3]); if (zs.every(z => z[1] === 1)) zs[0][1] = 2; const D = degOf(zs);
      return E.num(`Write the monic polynomial of least degree with ${listTxt(zs.map(([p, m]) => `zero ${p} (multiplicity ${m})`))}.`, [{ label: 'f(x) =', expr: fac(1, zs) }], `Raise each factor to its multiplicity: ${M('f(x)=' + fac(1, zs))}, degree ${D}.`); } },
    c: { t: 'use conjugate pairs', g: R => { const r = R.int(-5, 5), h = R.int(-3, 3), cx = R.bool(), k = R.int(1, 3), n = cx ? -(k * k) : R.pick([2, 3, 5, 6, 7]); const Q = [1, -2 * h, h * h - n], P = pmul([1, -r], Q), [z1, z2] = pairRoots(h, n);
      return E.num(`Write the monic cubic with integer coefficients whose zeros include ${r} and ${M(z1)}. Give it expanded.`, [{ label: 'f(x) =', expr: poly(P), form: 'expanded' }],
        `${E.pt(z2)} must be a zero too. The conjugate pair gives ${M(poly(Q))}; multiply by ${M(E.lin(r))}: ${M('f(x)=' + poly(P))}.`); } },
    d: { t: 'scale to fit a point', g: R => { let zs; if (R.bool()) zs = R.distinct(-5, 5, 3).map(p => [p, 1]); else { const [p, q] = R.distinct(-5, 5, 2); zs = [[p, 2], [q, 1]]; } const a = R.pick([2, -1, -2, 3, -3, 1]);
      let x0; do x0 = R.int(-4, 4); while (zs.some(z => z[0] === x0)); const base = fnOf(1, zs)(x0), y0 = a * base;
      return E.num(`A cubic has ${zs.map(([p, m]) => m === 2 ? `a double zero at ${p}` : `a zero at ${p}`).join(', ')}, and passes through (${x0}, ${y0}). Write its equation.`, [{ label: 'f(x) =', expr: fac(a, zs) }],
        `f(x) = a${E.pt(fac(1, zs))}. At x = ${x0} the brackets give ${base}, so ${y0} = ${base}a and a = ${a}: ${M('f(x)=' + fac(a, zs))}.`); } },
    e: { t: 'read the graph', g: R => { const pats = [[1, 1, 1], [2, 1], [2, 1, 1], [2, 2], [3, 1], [1, 1, 1, 1]], pat = R.pick(pats); let zs, a, y0;
      do { zs = R.distinct(-4, 4, pat.length).filter(p => p !== 0).map((p, i) => [p, pat[i]]); a = R.pick([1, -1, 2, -2]); y0 = zs.length === pat.length ? fnOf(a, zs)(0) : 0; } while (zs.length !== pat.length || Math.abs(y0) > 40 || Math.abs(y0) < 1);
      zs.sort((u, v) => u[0] - v[0]); const D = degOf(zs);
      return E.num(`The graph shows a polynomial of degree ${D}. Write its equation.`, [{ label: 'f(x) =', expr: fac(a, zs) }],
        `${zs.map(([p, m]) => `${p === zs[0][0] ? 'At' : 'at'} ${p} it ${m === 1 ? 'crosses (multiplicity 1)' : m === 2 ? 'touches (multiplicity 2)' : 'crosses flat (multiplicity 3)'}`).join('; ')}. So f(x) = a${E.pt(fac(1, zs))}, and f(0) = ${y0} gives a = ${a}.`, { visual: truePic(fnOf(a, zs), zs.map(z => z[0])) }); } },
    f: { t: 'monic through given points', g: R => { const n = R.pick([3, 4]), s = R.int(-1, 2), nodes = range(s, s + n - 1), kind = R.int(0, 3), c = nz(R, -5, 5);
      const g = [x => x, () => c, x => 2 * x, x => x * x][kind], gT = ['x', String(c), '2x', 'x^2'][kind];
      let m; do m = R.pick([s - 1, s + n, s - 2, s + n + 1]); while (nodes.includes(m));
      const val = nodes.reduce((p, k) => p * (m - k), 1) + g(m);
      return E.num(`f is a monic polynomial of degree ${n} with ${nodes.map(k => `f(${k}) = ${g(k)}`).join(', ')}. Find f(${m}).`, [{ label: `f(${neg(m)}) =`, ans: val }],
        `${E.pt('f(x)' + (kind === 1 && c < 0 ? '+' + -c : '-' + gT))} is monic of degree ${n} and is 0 at ${listTxt(nodes.map(String))}, so ${E.pt('f(x)=' + nodes.map(k => E.lin(k)).join('') + (kind === 1 && c < 0 ? c : '+' + gT))}. Then f(${m}) = ${nodes.reduce((p, k) => p * (m - k), 1)} ${g(m) < 0 ? '− ' + -g(m) : '+ ' + g(m)} = ${val}.`); } },
  });

  /* IV.10.12 Polynomial inequalities */
  // zs: sorted [{x, m}], s: sign of leading coefficient → {iv, iso, signs}
  const solveIneq = (zs, s, op) => {
    const n = zs.length, xs = zs.map(z => z.x);
    const sgnAt = t => s * zs.reduce((p, z) => p * Math.pow(Math.sign(t - z.x), z.m), 1);
    const test = i => i === 0 ? xs[0] - 1 : i === n ? xs[n - 1] + 1 : (xs[i - 1] + xs[i]) / 2;
    const want = v => op === '>' ? v > 0 : op === '>=' ? v >= 0 : op === '<' ? v < 0 : v <= 0;
    const signs = range(0, n).map(i => sgnAt(test(i)));
    const inc = range(0, 2 * n).map(k => k % 2 === 0 ? want(signs[k / 2]) : op.length === 2);
    const runs = []; let st = null;
    for (let k = 0; k <= 2 * n + 1; k++) { if (k <= 2 * n && inc[k]) { if (st === null) st = k; } else if (st !== null) { runs.push([st, k - 1]); st = null; } }
    let iso = false;
    const iv = runs.map(([a, b]) => { if (a === b && a % 2 === 1) iso = true;
      const lo = a % 2 === 0 ? (a === 0 ? '-inf' : xs[a / 2 - 1]) : xs[(a - 1) / 2], lc = a % 2 === 1;
      const hi = b % 2 === 0 ? (b === 2 * n ? 'inf' : xs[b / 2]) : xs[(b - 1) / 2], hc = b % 2 === 1;
      return `${lc ? '[' : '('}${lo},${hi}${hc ? ']' : ')'}`; }).join('U');
    return { iv: iv || 'no solution', iso, signs, all: runs.length === 1 && runs[0][0] === 0 && runs[0][1] === 2 * n };
  };
  const chart = sg => sg.map(v => v > 0 ? '+' : '−').join(', ');
  const OPS = ['<', '<=', '>', '>='];
  const zsFrom = (R, n, lo, hi, mults) => R.distinct(lo, hi, n).sort((u, v) => u - v).map(x => ({ x, m: R.pick(mults) }));
  const toFac = (s, zs) => fac(s, zs.map(z => [z.x, z.m]));
  S('IV.10.12', 'Polynomial inequalities', {
    a: { t: 'find zeros', g: R => { const zero0 = R.bool(); let rs; do rs = zero0 ? [0, nz(R, -6, 6), nz(R, -6, 6)] : [nz(R, -5, 5), nz(R, -5, 5), nz(R, -5, 5)]; while (new Set(rs).size < 3);
      const L = R.pick([1, 1, -1, 2]), P = expand(L, rs.map(r => [r, 1])), op = R.pick(OPS);
      return E.num(`To solve ${M(poly(P) + op + '0')}, first find the zeros of the left side.`, [{ label: 'x =', set: rs.map(String) }], `${zero0 ? 'Take out the common x: ' : 'Factor (test small divisors first): '}${M(fac(L, rs.map(r => [r, 1])))}, so the zeros are ${listTxt(rs.map(String))}.`); } },
    b: { t: 'sign chart', g: R => { const s = R.pick([1, -1]), zs = zsFrom(R, 3, -6, 6, [1, 1, 2]), want = R.bool() ? 1 : -1; const n = zs.length;
      const sgn = t => s * zs.reduce((p, z) => p * Math.pow(Math.sign(t - z.x), z.m), 1), test = i => i === 0 ? zs[0].x - 1 : i === n ? zs[n - 1].x + 1 : (zs[i - 1].x + zs[i].x) / 2;
      const ok = range(0, n).filter(i => sgn(test(i)) === want); if (!ok.length) return E.choiceFixed(`For ${M('f(x)=' + toFac(s, zs))}, is f(x) positive or negative for ${M('x>' + zs[n - 1].x)}?`, ['positive', 'negative'], sgn(test(n)) > 0 ? 0 : 1, `Every factor has a fixed sign there; the product is ${sgn(test(n)) > 0 ? 'positive' : 'negative'}.`);
      const i = R.pick(ok), ti = i > 0 && i < n && zs[i].x - zs[i - 1].x > 1 ? zs[i - 1].x + 1 : null, reg = i === 0 ? M('x<' + zs[0].x) : i === n ? M('x>' + zs[n - 1].x) : M(`${zs[i - 1].x}<x<${zs[i].x}`), t = ti === null ? test(i) : ti, fv = fnOf(s, zs.map(z => [z.x, z.m]))(t);
      return E.choiceFixed(`For ${M('f(x)=' + toFac(s, zs))}, is f(x) positive or negative for ${reg}?`, ['positive', 'negative'], want > 0 ? 0 : 1,
        `Test x = ${t}: f(${t}) ${Number.isInteger(t) ? '= ' + fv + ', which is' : 'is'} ${want > 0 ? 'positive' : 'negative'}. The sign chart left to right is ${chart(range(0, n).map(j => sgn(test(j))))}.`); } },
    c: { t: 'read the graph', g: R => { let s, zs, op, res; do { s = R.pick([1, -1]); zs = zsFrom(R, R.int(2, 3), -4, 4, [1, 1, 2]); op = R.pick(OPS); res = solveIneq(zs, s, op); } while (res.iso || res.all || res.iv === 'no solution');

      return E.num(`The graph of y = f(x) is shown. Solve ${M('f(x)' + op + '0')}.`, [{ interval: res.iv }], `The curve is ${op[0] === '>' ? 'above' : 'below'} the x-axis on ${E.pt(res.iv)}${op.length === 2 ? ', with the zeros included' : ', zeros left out'}.`,
        { visual: sketch(s, zs.map(z => [z.x, z.m]), { text: true }) }); } },
    d: { t: 'interval answer', g: R => { let s, zs, op, res; do { s = R.pick([1, -1]); zs = zsFrom(R, R.int(2, 4), -6, 6, [1, 1, 1, 2]); op = R.pick(OPS); res = solveIneq(zs, s, op); } while (res.iso || res.all || res.iv === 'no solution' || degOf(zs.map(z => [z.x, z.m])) > 5);
      const expd = R.bool(0.4), lhs = expd ? poly(expand(s, zs.map(z => [z.x, z.m]))) : toFac(s, zs);
      return E.num(`Solve ${M(lhs + op + '0')}. Answer in interval notation.`, [{ interval: res.iv }], `${expd ? `Factor: ${M(toFac(s, zs))}. ` : ''}Zeros ${listTxt(zs.map(z => String(z.x)))}; the sign chart left to right is ${chart(res.signs)}. So the answer is ${E.pt(res.iv)}.`); } },
  });

  /* IV.10.13 Polynomial models */
  const unit = O => (O && O.units === 'imperial') ? 'in' : 'cm';
  S('IV.10.13', 'Polynomial models', {
    a: { t: 'box volume problem', g: (R, O) => { const u = unit(O), sq = R.bool(), L = R.int(8, 30), W = sq ? L : R.int(6, L - 2), ask = R.bool();
      const Vx = sq ? `x(${L}-2x)^2` : `x(${L}-2x)(${W}-2x)`;
      const setup = `An open box is made from a ${sq ? `${L} ${u} square` : `${L} ${u} by ${W} ${u}`} sheet by cutting a square of side x ${u} from each corner and folding up the sides.`;
      if (ask) return E.num(`${setup} Write the volume V(x).`, [{ label: 'V(x) =', expr: Vx }], `The base is ${sq ? `(${L} − 2x) by (${L} − 2x)` : `(${L} − 2x) by (${W} − 2x)`} and the height is x, so ${M('V(x)=' + Vx)}.`);
      const c = R.int(1, Math.floor((Math.min(L, W) - 1) / 2)), v = c * (L - 2 * c) * (W - 2 * c);
      return E.num(`${setup} What is the volume when x = ${c}?`, [{ label: 'V =', ans: v }], `The box is ${L - 2 * c} by ${W - 2 * c} by ${c}: V = ${v} ${u}³.`); } },
    b: { t: 'fit a cubic', g: R => { const a = R.pick([1, -1, 2, -2]), b = R.int(-5, 5), c = R.int(-5, 5), d = R.int(-6, 6), P = [a, b, c, d], xs = R.pick([[0, 1, 2, 3, 4], [-2, -1, 0, 1, 2], [-1, 0, 1, 2, 3]]), ys = xs.map(x => pev(P, x));
      const tb = `<table class="dt"><tr><th>x</th>${xs.map(x => `<td>${neg(x)}</td>`).join('')}</tr><tr><th>y</th>${ys.map(y => `<td>${neg(y)}</td>`).join('')}</tr></table>`;
      return E.num(`A calculator fits a cubic to this data exactly. What equation does it give?${tb}`, [{ label: 'y =', expr: poly(P) }], `Cubic regression gives ${M('y=' + poly(P))}. Check: x = 0 gives y = ${d}, and x = ${xs[4]} gives ${ys[4]}.`); } },
    c: { t: 'find a max with technology', g: (R, O) => { const kind = R.int(0, 2), u = unit(O);
      if (kind === 2) { let p, q; do { p = R.int(2, 8); q = R.int(-6, 0); } while ((p + q) % 2 !== 0); const c = R.int(0, 40), P = [-1, 3 * (p + q) / 2, -3 * p * q, c], vmax = pev(P, p);
        return E.num(`A shop's weekly sales S(t) (in units) over t weeks are modeled by ${M('S(t)=' + poly(P).replace(/x/g, 't'))} for t ≥ 0. Use a graphing tool: when do sales peak, and what is the peak?`, [{ label: 't =', ans: p }, { label: 'peak sales =', ans: vmax }], `The graph for t ≥ 0 has its local max at (${p}, ${vmax}).`); }
      const k = R.int(1, 5), L = kind === 0 ? 6 * k : 8 * k, W = kind === 0 ? 6 * k : 5 * k, v = k * (L - 2 * k) * (W - 2 * k);
      return E.num(`An open box is made from a ${kind === 0 ? `${L} ${u} square` : `${L} ${u} by ${W} ${u}`} sheet by cutting squares of side x ${u} from the corners. Use a graphing tool to find the x that gives the largest volume, and that volume.`, [{ label: 'x =', ans: k }, { label: 'max volume =', ans: v }],
        `Graph ${M(kind === 0 ? `V=x(${L}-2x)^2` : `V=x(${L}-2x)(${W}-2x)`)} for ${M(`0<x<${W / 2}`)}. The peak is at x = ${k}, where V = ${k}·${L - 2 * k}·${W - 2 * k} = ${v} ${u}³.`); } },
    d: { t: 'realistic domain', g: (R, O) => { const u = unit(O), sq = R.bool(0.4), L = R.int(8, 40), W = sq ? L : R.int(5, L - 1), top = Math.min(L, W) / 2, iv = `(0,${top})`;
      return E.num(`An open box is made from a ${sq ? `${L} ${u} square` : `${L} ${u} by ${W} ${u}`} sheet by cutting squares of side x from the corners, so ${M(sq ? `V(x)=x(${L}-2x)^2` : `V(x)=x(${L}-2x)(${W}-2x)`)}. What is the realistic domain? Answer in interval notation.`, [{ interval: iv }],
        `Every side must be positive: x > 0 and ${Math.min(L, W)} − 2x > 0, so ${M(`0<x<${E.pt(String(top))}`)}. Outside that, the formula gives numbers but no box.`); } },
  });

  /* IV.10.14 Roots & coefficients */
  const quadEq = (S0, P0) => { const D = lcm(S0[1], P0[1]), c = [D, -S0[0] * D / S0[1], P0[0] * D / P0[1]], g = c.reduce((a, b) => g2(a, b), 0); return poly(c.map(x => x / g)) + '=0'; };
  S('IV.10.14', 'Roots & coefficients', {
    a: { t: 'sum and product of quadratic roots', g: R => { const a = R.pick([1, 1, 2, 3, -1, 4]), b = nz(R, -9, 9), c = nz(R, -9, 9);
      return E.num(`For ${M(poly([a, b, c]) + '=0')}, find the sum and the product of the roots.`, [{ label: 'sum =', exact: E.fracStr(-b, a) }, { label: 'product =', exact: E.fracStr(c, a) }], `Sum = −b/a = ${E.pt(E.fracStr(-b, a))}; product = c/a = ${E.pt(E.fracStr(c, a))}.`); } },
    b: { t: 'build a quadratic from root facts', g: R => { const kind = R.int(0, 2);
      if (kind === 0) { const Sm = R.int(-9, 9), P = nz(R, -12, 12); return E.num(`Write a quadratic equation with integer coefficients whose roots have sum ${Sm} and product ${P}.`, [{ eqn: poly([1, -Sm, P]) + '=0' }], `x² − (sum)x + (product) = 0: ${M(poly([1, -Sm, P]) + '=0')}.`); }
      if (kind === 1) { const h = R.int(-4, 4), n = R.pick([2, 3, 5, 6, 7, 10]), [z1, z2] = pairRoots(h, n); return E.num(`Write a quadratic equation with integer coefficients whose roots are ${M(z1)} and ${M(z2)}.`, [{ eqn: poly([1, -2 * h, h * h - n]) + '=0' }], `Sum = ${2 * h}, product = ${h < 0 ? `(${neg(h)})` : h}² − ${n} = ${neg(h * h - n)}: ${M(poly([1, -2 * h, h * h - n]) + '=0')}.`); }
      const S0 = fr(nz(R, -9, 9), R.pick([2, 3])), P0 = fr(nz(R, -6, 6), R.pick([1, 2, 3])); const eq = quadEq(S0, P0);
      return E.num(`Write a quadratic equation with integer coefficients whose roots have sum ${E.pt(fs(S0))} and product ${E.pt(fs(P0))}.`, [{ eqn: eq }], `Use x² − (sum)x + (product) = 0 with sum ${E.pt(fs(S0))} and product ${E.pt(fs(P0))}, then clear fractions: ${M(eq)}.`); } },
    c: { t: 'relationships for cubic roots', g: R => { const a = R.pick([1, 1, 2, -1, 3]), b = R.int(-9, 9), c = R.int(-9, 9), d = nz(R, -9, 9);
      return E.num(`Let α, β, γ be the roots of ${M(poly([a, b, c, d]) + '=0')}. Find α + β + γ, αβ + βγ + γα and αβγ.`, [{ label: 'α + β + γ =', exact: E.fracStr(-b, a) }, { label: 'αβ + βγ + γα =', exact: E.fracStr(c, a) }, { label: 'αβγ =', exact: E.fracStr(-d, a) }],
        `For ax³ + bx² + cx + d: sum = −b/a = ${E.pt(E.fracStr(-b, a))}, pairs = c/a = ${E.pt(E.fracStr(c, a))}, product = −d/a = ${E.pt(E.fracStr(-d, a))}.`); } },
    d: { t: 'equations with transformed roots', g: R => { const a = R.pick([1, 1, 1, 2]), b = nz(R, -8, 8), c = nz(R, -8, 8), S0 = fr(-b, a), P0 = fr(c, a), kind = R.int(0, 3), k = nz(R, -3, 3) * (kind === 1 && R.bool() ? 1 : 1);
      let S1, P1, what;
      if (kind === 0) { S1 = fadd(S0, [2 * k, 1]); P1 = fadd(fadd(P0, fmul([k, 1], S0)), [k * k, 1]); what = `α ${k > 0 ? '+' : '−'} ${Math.abs(k)} and β ${k > 0 ? '+' : '−'} ${Math.abs(k)}`; }
      else if (kind === 1) { const kk = k === 1 || k === -1 ? 2 * k : k; S1 = fmul([kk, 1], S0); P1 = fmul([kk * kk, 1], P0); what = `${kk}α and ${kk}β`; }
      else if (kind === 2) { S1 = fdiv(S0, P0); P1 = fdiv([1, 1], P0); what = '1/α and 1/β'; }
      else { S1 = fadd(fmul(S0, S0), fmul([-2, 1], P0)); P1 = fmul(P0, P0); what = 'α² and β²'; }
      const eq = quadEq(S1, P1);
      return E.num(`α and β are the roots of ${M(poly([a, b, c]) + '=0')}. Write a quadratic equation with integer coefficients whose roots are ${what}.`, [{ eqn: eq }],
        `α + β = ${E.pt(fs(S0))} and αβ = ${E.pt(fs(P0))}. The new roots have sum ${E.pt(fs(S1))} and product ${E.pt(fs(P1))}, so ${M(eq)}.`); } },
    e: { t: 'symmetric expressions', g: R => { let a, b, c; do { a = R.pick([1, 1, 2, 3]); b = nz(R, -7, 7); c = nz(R, -7, 7); } while (b * b - 4 * a * c <= 0); const S0 = fr(-b, a), P0 = fr(c, a), kind = R.int(0, 5);
      const Q = [['α² + β²', fadd(fmul(S0, S0), fmul([-2, 1], P0)), '(α + β)² − 2αβ'], ['1/α + 1/β', fdiv(S0, P0), '(α + β)/(αβ)'], ['α³ + β³', fadd(fmul(fmul(S0, S0), S0), fmul([-3, 1], fmul(S0, P0))), '(α + β)³ − 3αβ(α + β)'],
        ['(α − β)²', fadd(fmul(S0, S0), fmul([-4, 1], P0)), '(α + β)² − 4αβ'], ['α/β + β/α', fdiv(fadd(fmul(S0, S0), fmul([-2, 1], P0)), P0), '((α + β)² − 2αβ)/(αβ)'], ['α²β + αβ²', fmul(S0, P0), 'αβ(α + β)']][kind];
      return E.num(`α and β are the roots of ${M(poly([a, b, c]) + '=0')}. Without solving, find ${Q[0]}.`, [{ label: Q[0] + ' =', exact: fs(Q[1]) }], `α + β = ${E.pt(fs(S0))}, αβ = ${E.pt(fs(P0))}. ${Q[0]} = ${Q[2]} = ${E.pt(fs(Q[1]))}.`); } },
    f: { t: 'find k from a root condition', g: R => { const kind = R.int(0, 2); let P, K, cond, why;
      if (kind === 0) { const al = R.int(1, 4), m = R.int(2, 4); P = m * al * al; K = (m + 1) * al; cond = `one root equal to ${m} times the other`; why = `Roots t and ${m}t: ${m}t² = ${P}, so t = ±${al}, and k = sum = ${m + 1}t = ±${K}.`; }
      else if (kind === 1) { const r = R.int(1, 5), d = R.int(1, 5); P = r * (r + d); K = 2 * r + d; cond = `roots that differ by ${d}`; why = `(α − β)² = (α + β)² − 4αβ: ${d * d} = k² − ${4 * P}, so k² = ${K * K} and k = ±${K}.`; }
      else { let r, s; do { r = nz(R, -6, 6); s = nz(R, -6, 6); } while (r === s || r + s === 0 || r * s <= 0 && R.bool(0.5)); P = r * s; K = Math.abs(r + s); const T = r * r + s * s; cond = `roots whose squares add up to ${T}`; why = `α² + β² = (α + β)² − 2αβ: ${T} = k² ${P > 0 ? '−' : '+'} ${Math.abs(2 * P)}, so k² = ${K * K} and k = ±${K}.`; }
      return E.num(`For which values of k does ${M(`x^2-kx${P > 0 ? '+' : ''}${P}=0`)} have ${cond}?`, [{ label: 'k =', set: [String(K), String(-K)] }], why); } },
  });
})(typeof window !== 'undefined' ? window : globalThis);
