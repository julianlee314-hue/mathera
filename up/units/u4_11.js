/* Era IV · Unit IV.11 Rational & radical functions (IV.11.01–IV.11.14) */
(function (G) {
  const E = G.E4, V = E.V, C = E.C, M = s => E.mx(s);
  const nz = (R, lo, hi) => { let v; do v = R.int(lo, hi); while (v === 0); return v; };
  const sg = n => n < 0 ? `− ${-n}` : `+ ${n}`;
  const P = co => E.poly(co);
  const pt = (x, y) => `(${x}, ${y})`;
  const S = (id, name, steps) => E.skill({ id, name, steps });
  // k distinct integers in [lo, hi], none from avoid
  const pickD = (R, lo, hi, k, avoid = []) => { let a; do a = R.distinct(lo, hi, k); while (a.some(v => avoid.includes(v))); return a; };
  // polynomial arithmetic (coefficients, highest power first)
  const mul = (p, q) => { const r = new Array(p.length + q.length - 1).fill(0); p.forEach((a, i) => q.forEach((b, j) => { r[i + j] += a * b; })); return r; };
  const fromRoots = (rs, k = 1) => rs.reduce((acc, r) => mul(acc, [1, -r]), [k]);
  const ex = (rs, k = 1) => P(fromRoots(rs, k));                              // expanded
  const ev = (co, x) => co.reduce((s, c) => s * x + c, 0);
  // factored text: zeros first, repeated factors as powers, k in front
  const fac = (rs, k = 1) => {
    const cnt = new Map(); [...rs].sort((a, b) => (a === 0 ? -1 : b === 0 ? 1 : 0)).forEach(r => cnt.set(r, (cnt.get(r) || 0) + 1));
    let s = ''; for (const [r, m] of cnt) s += r === 0 ? (m > 1 ? `x^${m}` : 'x') : (m > 1 ? `${E.lin(r)}^${m}` : E.lin(r));
    if (!s) return String(k); return (k === 1 ? '' : k === -1 ? '-' : String(k)) + s;
  };
  const lin2 = c => c === 0 ? 'x' : `x${c > 0 ? '+' : ''}${c}`;                 // x + c without brackets
  const sum0 = s => { let d = 0; for (let i = 0; i < s.length; i++) { const ch = s[i]; if (ch === '(') d++; else if (ch === ')') d--; else if (i > 0 && d === 0 && (ch === '+' || ch === '-')) return true; } return false; };
  // tidy built ASCII: "+-3" → "-3", "--3" → "+3", "1x" → "x", "5(x)" → "5x"
  const cl = s => String(s).replace(/\+-/g, '-').replace(/--/g, '+').replace(/(^|[^\d.^])1x/g, '$1x').replace(/(\d)\(x\)/g, '$1x');
  const par = n => n < 0 ? `(${n})` : String(n);                                   // wrap negatives in products
  const one = s => /^\([^()]*\)$/.test(s) ? s.slice(1, -1) : s;                    // "(x-3)" → "x-3" when it stands alone
  const atomD = s => /^(\d+|x(\^\d+)?|\([^()]*\)(\^\d+)?)$/.test(s);
  const rat = (n, d) => d === '1' ? n : `${sum0(n) ? '(' + n + ')' : n}/${atomD(d) ? d : '(' + d + ')'}`;
  const cf = c => c === 1 ? '' : c === -1 ? '-' : String(c);                     // coefficient text: 1 → '', −1 → '−'
  const fd = (n, d) => { const r = E.fracStr(n, d), raw = `${n}/${par(d)}`; return E.pt(r === raw ? r : raw + ' = ' + r); };   // n/d, then reduced if different
  const setS = arr => [...new Set(arr)].map(String);
  const list = arr => { const a = [...new Set(arr)].sort((p, q) => p - q).map(String); return a.length === 1 ? a[0] : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]; };
  const fld = (n, d) => { if (d < 0) { n = -n; d = -d; } const g = E.gcd(Math.abs(n), d) || 1; n /= g; d /= g; return d === 1 ? { ans: n } : { frac: [n, d], form: 'any' }; };
  // multiple choice of ASCII expressions: drop distractors that equal the answer, typeset all
  const chooseX = (R, prompt, right, wrongs, explain, extra) => {
    const seen = new Set([right]); const ok = [];
    for (const w of wrongs) if (!seen.has(w) && !E.sameExpr(w, right)) { seen.add(w); ok.push(w); }
    return E.choice(R, prompt, M(right), R.sample(ok, Math.min(3, ok.length)).map(M), explain, extra);
  };

  // solution of f(x) op 0 from a sign chart; crit = [[x, isPole]] (simple zeros and poles, distinct integers)
  const signIv = (crit, f, op) => {
    const cs = [...crit].sort((a, b) => a[0] - b[0]), incl = op.length === 2, want = op[0] === '>' ? 1 : -1, out = [];
    for (let i = 0; i <= cs.length; i++) {
      const lo = i ? cs[i - 1] : null, hi = i < cs.length ? cs[i] : null;
      const t = !lo ? hi[0] - 0.5 : !hi ? lo[0] + 0.5 : (lo[0] + hi[0]) / 2;
      if (Math.sign(f(t)) !== want) continue;
      out.push(`${!lo ? '(-inf' : (incl && !lo[1] ? '[' : '(') + lo[0]},${!hi ? 'inf)' : hi[0] + (incl && !hi[1] ? ']' : ')')}`);
    }
    return out.join('U');
  };
  const opT = op => ({ '<': '<', '>': '>', '<=': '≤', '>=': '≥' })[op];
  // exact fraction for a terminating/simple rational number (bounded search)
  const fracOf = v => { for (let d = 1; d <= 100000; d++) { const n = Math.round(v * d); if (Math.abs(n - v * d) < 1e-9) return [n, d]; } return [Math.round(v * 1000), 1000]; };

  /* IV.11.01 Simplify rational expressions */
  S('IV.11.01', 'Simplify rational expressions', {
    a: { t: 'factor top and bottom', g: R => {
      const part = (kind, share) => {
        if (kind === 0) { const [p] = pickD(R, -6, 6, 1, [0, share]); const k = R.pick([2, 3, 4, 5]); const rs = share !== null && R.bool(0.6) ? [share] : [p]; return { rs, k }; }
        if (kind === 1) { const m = R.int(1, 7); return { rs: [m, -m], k: 1 }; }
        const a = share !== null && R.bool(0.6) ? share : R.int(-6, 6); let b; do b = R.int(-7, 7); while (b === a); return { rs: [a, b], k: R.pick([1, 1, 1, 2]) };
      };
      const top = part(R.int(0, 2), null), bot = part(R.pick([1, 2, 2]), R.pick(top.rs));
      const T = ex(top.rs, top.k), B = ex(bot.rs, bot.k);
      return E.num(`Factor the top and the bottom of ${M(rat(T, B))} completely.`, [{ label: 'top =', expr: fac(top.rs, top.k), form: 'complete' }, { label: 'bottom =', expr: fac(bot.rs, bot.k), form: 'complete' }],
        `${M(T + '=' + fac(top.rs, top.k))} and ${M(B + '=' + fac(bot.rs, bot.k))}.`); } },
    b: { t: 'cancel common factors', g: R => {
      if (R.bool(0.45)) { const [c, u] = pickD(R, -7, 7, 2); const k = R.pick([1, 1, 2, 3]);
        const T = ex([c, u], k), B = ex([c], k);
        return E.num(`Simplify ${M(rat(T, B))}.`, [{ expr: P([1, -u]), form: 'simplified' }], `Factor: ${M(rat(fac([c, u], k), fac([c], k)))}. Cancel ${k === 1 ? '' : k + ' and '}${M(E.lin(c))} to leave ${M(P([1, -u]))}.`); }
      const [c, u, v] = pickD(R, -7, 7, 3); const T = ex([c, u]), B = ex([c, v]);
      const right = rat(fac([u]), fac([v]));
      const wrongs = [rat(fac([v]), fac([u])), rat(fac([-u]), fac([-v])), rat(fac([c]), fac([v])), rat(fac([u]), fac([c])), v !== 0 && u !== 0 ? E.fracStr(u, v) : rat(fac([u, u]), fac([v, v]))];
      return chooseX(R, `Simplify ${M(rat(T, B))}.`, right, wrongs, `Factor: ${M(rat(fac([c, u]), fac([c, v])))}. Cancel the common factor ${M(E.lin(c))}, not single terms.`); } },
    c: { t: 'state excluded values', g: R => {
      const kind = R.int(0, 2); let bot;
      if (kind === 0) bot = pickD(R, -7, 7, 2); else if (kind === 1) { const m = R.int(1, 7); bot = [m, -m]; } else bot = [0, nz(R, -7, 7)];
      const sh = R.pick(bot); let u; do u = R.int(-7, 7); while (bot.includes(u));
      const T = ex([sh, u]), B = ex(bot), other = bot.find(r => r !== sh);
      const simp = rat(fac([u]), fac([other]));
      return E.num(`${M(rat(T, B))} simplifies to ${M(simp)}. Which values of x are excluded from the original expression?`, [{ label: 'x ≠', set: setS(bot) }],
        `The original bottom ${M(B + '=' + fac(bot))} is 0 at x = ${list(bot)}. Cancelling doesn't remove x = ${sh}.`); } },
    d: { t: '(a − b)/(b − a) = −1', g: R => {
      const kind = R.int(0, 3), r = nz(R, -7, 7);
      if (kind === 0) { const k = R.int(1, 6); const T = `${k * r}-${k === 1 ? '' : k}x`;
        return E.num(`Simplify ${M(rat(T, lin2(-r)))}.`, [{ expr: String(-k), form: 'simplified' }], `${k === 1 ? '' : M(T + '=' + k + '(' + r + '-x)') + ', and '}${M(`(${r}-x)/(${lin2(-r)})=-1`)}, so the answer is ${-k}.`); }
      if (kind === 1) { const m = Math.abs(r); const T = `x^2-${m * m}`, B = `${m}-x`;
        return E.num(`Simplify ${M(rat(T, B))}. Write your answer without brackets.`, [{ expr: P([-1, -m]), form: 'simplified' }], `${M(rat(fac([m, -m]), B))}, and ${M(`(x-${m})/(${m}-x)=-1`)}, so the answer is ${M('-(x+' + m + ')=' + P([-1, -m]))}.`); }
      if (kind === 2) { let s; do s = R.int(-7, 7); while (s === r); const T = ex([r, s]), B = `${r}-x`;
        return E.num(`Simplify ${M(rat(T, B))}. Write your answer without brackets.`, [{ expr: P([-1, s]), form: 'simplified' }], `${M(rat(fac([r, s]), B))}. Since ${M(lin2(-r))} and ${M(B)} are opposites, their ratio is −1, so the answer is ${M(s === 0 ? '-x' : '-' + fac([s]) + '=' + P([-1, s]))}.`); }
      let s; do s = R.int(-7, 7); while (s === r); const B = `(${r}-x)${fac([s])}`;
      return chooseX(R, `Simplify ${M(rat(lin2(-r), B))}.`, `-1/${fac([s])}`, [`1/${fac([s])}`, `-1/${fac([r])}`, `1/${fac([-s])}`, `-1/${fac([-s])}`], `${M(`(${lin2(-r)})/(${r}-x)=-1`)}, leaving ${M(`-1/${fac([s])}`)}.`); } },
  });

  /* IV.11.02 Multiply & divide rational expressions */
  // two fractions whose product is U/V after cancelling w1 and w2
  const md = (R, nU, nV) => {
    let vals; do vals = R.distinct(-6, 6, 2 + nU + nV); while (vals.includes(0) && R.bool(0.6));
    const [w1, w2, ...rest] = vals, U = rest.slice(0, nU), Vv = rest.slice(nU);
    const U1 = [], U2 = [], V1 = [], V2 = [];
    if (nU === 2) { U1.push(U[0]); U2.push(U[1]); } else if (nU === 1) (R.bool() ? U1 : U2).push(U[0]);
    if (nV === 1) (R.bool() ? V1 : V2).push(Vv[0]);
    const k = R.bool(0.4) ? R.pick([2, 3]) : 1, kOn = R.bool();
    const N1 = { rs: [...U1, w1], k: kOn ? k : 1 }, D1 = { rs: [w2, ...V1], k: kOn ? 1 : k }, N2 = { rs: [w2, ...U2], k: kOn ? 1 : k }, D2 = { rs: [w1, ...V2], k: kOn ? k : 1 };
    const F = (n, d) => rat(ex(n.rs, n.k), ex(d.rs, d.k)), FF = (n, d) => rat(fac(n.rs, n.k), fac(d.rs, d.k));
    return { w1, w2, U, Vv, N1, D1, N2, D2, k, f1: F(N1, D1), f2: F(N2, D2), g1: FF(N1, D1), g2: FF(N2, D2), f2flip: F(D2, N2), g2flip: FF(D2, N2) };
  };
  const mdAnswer = (R, o, prompt, explain) => {
    if (!o.Vv.length) {
      const f = o.U.length === 1 ? { expr: one(fac(o.U)), form: 'simplified' } : { expr: fac(o.U), form: 'factored' };
      return E.num(prompt + (o.U.length === 2 ? ' Leave your answer factored.' : ''), [f], explain + ` Result: ${M(one(fac(o.U)))}.`);
    }
    const right = rat(fac(o.U), fac(o.Vv));
    const wrongs = [rat(fac(o.Vv), fac(o.U)), rat(fac(o.U.map(u => -u)), fac(o.Vv.map(v => -v))), rat(fac([...o.U, o.w1]), fac([...o.Vv, o.w2])), rat(fac(o.U), fac([...o.Vv, o.w1])), rat(fac([...o.U, o.w2]), fac(o.Vv))];
    return chooseX(R, prompt, right, wrongs, explain + ` Result: ${M(right)}.`);
  };
  S('IV.11.02', 'Multiply & divide rational expressions', {
    a: { t: 'factor all', g: R => {
      const o = md(R, 2, 1), parts = [['first top', o.N1], ['first bottom', o.D1], ['second top', o.N2], ['second bottom', o.D2]];
      const ask = parts.filter(([, p]) => p.rs.length === 2 || p.k !== 1);
      return E.num(`Factor every part of ${M(o.f1)} · ${M(o.f2)} that can be factored.`, ask.map(([l, p]) => ({ label: l + ' =', expr: fac(p.rs, p.k), form: 'complete' })),
        `Factored: ${M(o.g1)} · ${M(o.g2)}. Now matching factors are easy to spot.`); } },
    b: { t: 'multiply and cancel', g: R => { const nV = R.bool(0.4) ? 1 : 0, o = md(R, R.pick([1, 1, 2]), nV);
      return mdAnswer(R, o, `Multiply and simplify: ${M(o.f1)} · ${M(o.f2)}.`, `Factor: ${M(o.g1)} · ${M(o.g2)}. Cancel ${M(E.lin(o.w1))} and ${M(E.lin(o.w2))}${o.k !== 1 ? ' and ' + o.k : ''}.`); } },
    c: { t: 'flip to divide', g: R => { const o = md(R, R.pick([1, 1, 2]), R.bool(0.3) ? 1 : 0);
      if (R.bool(0.4)) {
        const A = M(o.f1), B = M(o.f2flip);
        const opts = [`${M(o.f1)} · ${M(o.f2)}`, `${M(rat(ex(o.D1.rs, o.D1.k), ex(o.N1.rs, o.N1.k)))} · ${M(o.f2flip)}`, `${M(o.f1)} · ${M(o.f2flip)}`, `${M(rat(ex(o.D1.rs, o.D1.k), ex(o.N1.rs, o.N1.k)))} · ${M(o.f2)}`];
        return E.choice(R, `Which product equals ${A} ÷ ${B}?`, opts[0], opts.slice(1), 'Keep the first fraction and flip the second (the divisor), then multiply.'); }
      return mdAnswer(R, o, `Divide and simplify: ${M(o.f1)} ÷ ${M(o.f2flip)}.`, `Flip the second fraction: ${M(o.g1)} · ${M(o.g2)}. Cancel ${M(E.lin(o.w1))} and ${M(E.lin(o.w2))}${o.k !== 1 ? ' and ' + o.k : ''}.`); } },
    d: { t: 'excluded values', g: R => { const o = md(R, R.int(0, 2), R.int(0, 1)), div = R.bool(0.55);
      const exc = div ? [...o.D1.rs, ...o.N2.rs, ...o.D2.rs] : [...o.D1.rs, ...o.D2.rs];
      return E.num(`Find all excluded values of x for ${M(o.f1)} ${div ? '÷' : '·'} ${M(div ? o.f2flip : o.f2)}.`, [{ label: 'x ≠', set: setS(exc) }],
        div ? `Every bottom must be nonzero, and so must the divisor ${M(o.f2flip)}, so its top counts too: ${M(o.g1)} ÷ ${M(o.g2flip)} excludes x = ${list(exc)}.` : `Every bottom must be nonzero: ${M(o.g1)} · ${M(o.g2)} excludes x = ${list(exc)}.`); } },
    e: { t: 'run it backwards', g: R => {
      const [a, b, c, d, e] = R.distinct(-6, 6, 5), div = R.bool();
      const f1 = rat(ex([a, b]), ex([c, d])), target = div ? rat(ex([a, e]), ex([c, d])) : rat(ex([a, b]), ex([d, e]));
      const box = div ? rat(fac([b]), fac([e])) : rat(fac([c]), fac([e]));
      return E.num(`Fill the box: ${M(f1)} ${div ? '÷' : '·'} □ = ${M(target)}.`, [{ label: '□ =', expr: box }],
        div ? `□ = first ÷ result: ${M(rat(fac([a, b]), fac([c, d])))} · ${M(rat(fac([c, d]), fac([a, e])))} = ${M(box)}.` : `□ = result ÷ first: ${M(rat(fac([a, b]), fac([d, e])))} · ${M(rat(fac([c, d]), fac([a, b])))} = ${M(box)}.`); } },
    f: { t: 'a telescoping product', g: R => {
      const plus = R.bool(), n = R.int(3, 6), s = R.int(-3, 3), k0 = plus ? s : s + 1;
      const fct = j => `(1${plus ? '+' : '-'}1/${fac([-(k0 + j)])})`;
      const shown = n <= 4 ? M([...Array(n)].map((_, j) => fct(j)).join('')) : `${M(fct(0) + fct(1) + fct(2))} ⋯ ${M(fct(n - 1))}`;
      const p = plus ? s + n : s, q = plus ? s : s + n;
      return E.num(`The product ${shown} has ${n} factors. It simplifies to ${M('(x+p)/(x+q)')}. Find p and q.`, [{ label: 'p =', ans: p }, { label: 'q =', ans: q }],
        `Each factor is one fraction: ${M(`${fct(0)}=${rat(lin2(plus ? k0 + 1 : k0 - 1), lin2(k0))}`)}. Neighboring tops and bottoms cancel, leaving ${M(rat(lin2(p), lin2(q)))}.`); } },
  });

  /* IV.11.03 Add & subtract rational expressions */
  S('IV.11.03', 'Add & subtract rational expressions', {
    a: { t: 'like denominators', g: R => {
      const dk = R.int(0, 2), r = nz(R, -6, 6), den = dk === 0 ? lin2(-r) : dk === 1 ? 'x' : ex([r, nz(R, -5, 5)]);
      const root = dk === 1 ? 0 : r; let p1, q1, p2, q2, op, N;
      do { p1 = R.int(-4, 5); q1 = R.int(-9, 9); p2 = R.int(-4, 5); q2 = R.int(-9, 9); op = R.pick(['+', '-']); N = op === '+' ? [p1 + p2, q1 + q2] : [p1 - p2, q1 - q2]; }
      while ((p1 === 0 && q1 === 0) || (p2 === 0 && q2 === 0) || (N[0] === 0 && N[1] === 0) || (dk !== 2 && ev(N, root) === 0) || (p1 === 0 && p2 === 0));
      const n1 = P([p1, q1]), n2 = P([p2, q2]), d = atomD(den) ? den : '(' + den + ')';
      return E.num(`Write ${M(`${rat(n1, den)}${op}${rat(n2, den)}`)} as one fraction ${M('□/' + d)}. What is the top?`, [{ label: 'top =', expr: P(N), form: 'simplified' }],
        `Same bottom, so ${op === '+' ? 'add' : 'subtract'} the tops${op === '-' ? ' (the minus applies to every term of the second top)' : ''}: ${M(`(${n1})${op}(${n2})=${P(N)}`)}.`); } },
    b: { t: 'find the LCD', g: R => {
      const kind = R.int(0, 3); let d1, d2, L, why;
      if (kind === 0) { const a = R.int(1, 8), b = R.int(1, 8), m = R.int(1, 3), n = R.int(1, 3); if (a === b && m === n) return this_b(R); const l = a * b / E.gcd(a, b), mx = Math.max(m, n);
        const mono = (c, p) => `${c === 1 ? '' : c}x${p > 1 ? '^' + p : ''}`; d1 = mono(a, m); d2 = mono(b, n); L = mono(l, mx); why = `lcm(${a}, ${b}) = ${l} and the highest power of x is ${mono(1, mx)}.`; }
      else if (kind === 1) { const m = R.int(1, 7), s = R.pick([m, -m]); d1 = ex([m, -m]); d2 = lin2(-s); L = fac([m, -m]); why = `${M(d1 + '=' + fac([m, -m]))} already contains ${M(fac([s]))}.`; }
      else if (kind === 2) { const [a, b, c] = pickD(R, -6, 6, 3); d1 = ex([a, b]); d2 = ex([b, c]); L = fac([a, b, c]); why = `${M(d1 + '=' + fac([a, b]))} and ${M(d2 + '=' + fac([b, c]))}; take each factor once.`; }
      else { const r = nz(R, -7, 7); d1 = ex([0, r]); d2 = R.bool() ? 'x^2' : lin2(-r) + '^2'; L = d2 === 'x^2' ? fac([0, 0, r]) : fac([0, r, r]); why = `${M(d1 + '=' + fac([0, r]))}; use the highest power of each factor.`; }
      const a1 = nz(R, -6, 6), a2 = R.int(1, 6);
      return E.num(`What is the least common denominator of ${M(`${rat(String(a1), d1)}${R.pick(['+', '-'])}${rat(String(a2), d2)}`)}?`, [{ label: 'LCD =', expr: L }], `LCD = ${M(L)}: ${why}`); } },
    c: { t: 'rewrite and combine', g: R => {
      const kind = R.int(0, 2); let r, s, a, b, op, N, LCD, show, how;
      do {
        r = R.int(-6, 6); s = R.int(-6, 6); a = nz(R, -6, 6); b = R.int(1, 6); op = R.pick(['+', '-']); const sgn = op === '+' ? 1 : -1;
        if (kind === 2) { r = nz(R, -6, 6); N = [sgn * b, a - sgn * b * r]; LCD = lin2(-r); show = `${rat(String(a), lin2(-r))}${op}${b}`; how = `${M(b + '=' + rat(b + fac([r]), fac([r])))}`; }
        else { if (kind === 1) r = 0; N = [a + sgn * b, -(a * s + sgn * b * r)]; LCD = fac([r, s]); show = `${rat(String(a), fac([r]))}${op}${rat(String(b), fac([s]))}`; how = `the tops become ${M(a + fac([s]))} and ${M(b + fac([r]))}`; }
      } while (r === s || (N[0] === 0 && N[1] === 0));
      return E.num(`Write ${M(show)} as one fraction over ${M(LCD)}. What is the top?`, [{ label: 'top =', expr: P(N), form: 'simplified' }],
        `Multiply each fraction by what its bottom is missing: ${how}. Combine: ${M(P(N))}.`); } },
    d: { t: 'simplify the result', g: R => {
      if (R.bool(0.5)) { const [r, s] = pickD(R, -7, 7, 2); const p = R.int(-4, 4), q = p + r + s, w = -r * s;
        const n1 = P([1, p, 0]), n2 = P([q, w]);
        return E.num(`Subtract and simplify: ${M(`${rat(n1, lin2(-r))}-${rat(n2, lin2(-r))}`)}.`, [{ expr: P([1, -s]), form: 'simplified' }],
          `Same bottom: ${M(`(${n1})-(${n2})=${ex([r, s])}=${fac([r, s])}`)}. Cancel ${M(fac([r]))}: ${M(fac([s]).replace(/^\(|\)$/g, ''))}.`); }
      const [t, u] = pickD(R, -6, 6, 2), B = nz(R, -3, 3), A = B * (t - u);
      const right = `${B}/${fac([t])}`;
      return chooseX(R, `${B > 0 ? 'Add' : 'Subtract'} and simplify: ${M(cl(`${rat(String(A), ex([t, u]))}+${B}/${fac([u])}`))}.`, right, [`${B}/${fac([u])}`, `${-B}/${fac([t])}`, `${A + B}/(${fac([t, u])})`, `${B}/${fac([-t])}`, `${A + B}/${fac([t])}`],
        `Over ${M(fac([t, u]))}: the top is ${M(cl(`${A}+${cf(B)}${fac([t])}=${fac([u], B)}`))}. Cancel ${M(fac([u]))} to get ${M(right)}.`); } },
    e: { t: 'run it backwards', g: R => {
      const [r, s] = R.distinct(-6, 6, 2), A = nz(R, -5, 5), B = nz(R, -5, 5), top = P([A + B, -(A * s + B * r)]);
      return E.num(`Find A and B so that ${M(`${rat(top, ex([r, s]))}=A/${fac([r])}+B/${fac([s])}`)}.`, [{ label: 'A =', ans: A }, { label: 'B =', ans: B }],
        `Clear the bottom: ${M(`${top}=A${fac([s])}+B${fac([r])}`)}. At x = ${r}: ${A * (r - s)} = A(${r - s}), so A = ${A}. At x = ${s}: ${B * (s - r)} = B(${s - r}), so B = ${B}.`); } },
    f: { t: 'a telescoping sum', g: R => {
      const d = R.pick([1, 1, 2]), n = R.int(3, 5), s = R.int(-3, 3), term = j => `${d}/(${fac([-(s + j * d), -(s + j * d + d)])})`;
      const shown = [...Array(n)].map((_, j) => term(j)).join('+'), N = n * d, far = s + N;
      const right = `${N}/(${fac([-s, -far])})`;
      const wrongs = [`1/(${fac([-s, -far])})`, `${n}/(${fac([-s, -(far - d)])})`, `${N}/(${fac([-(s + d), -far])})`, `${N}/${fac([-s, -s])}`, `${d === 1 ? n + 1 : n}/(${fac([-s, -(far + d)])})`];
      return chooseX(R, `Add: ${M(shown)}.`, right, wrongs,
        `Each term splits: ${M(`${d}/(${fac([-s, -(s + d)])})=1/${fac([-s])}-1/${fac([-(s + d)])}`)}. The middle terms cancel, leaving ${M(`1/${fac([-s])}-1/${fac([-far])}=${right}`)}.`); } },
  });
  function this_b(R) { return E.byId['IV.11.03'].steps.b.g(R); }

  /* IV.11.04 Complex fractions */
  const termS = (c, p, first) => { const body = p === 0 ? String(Math.abs(c)) : `${Math.abs(c)}/x${p > 1 ? '^' + p : ''}`; return (c < 0 ? '-' : first ? '' : '+') + body; };
  const sumS = ts => ts.map(([c, p], i) => termS(c, p, i === 0)).join('');
  S('IV.11.04', 'Complex fractions', {
    a: { t: 'combine top and bottom', g: R => {
      const r = R.bool(0.5) ? 0 : nz(R, -5, 5), D = r === 0 ? 'x' : fac([r]);
      const p = nz(R, -4, 5), q = nz(R, -7, 7), s = nz(R, -4, 5), t = nz(R, -7, 7);
      const piece = (a, b) => R.bool(0.7) ? `${a}${b > 0 ? '+' : '-'}${Math.abs(b)}/${D}` : `${b}/${D}${a > 0 ? '+' : '-'}${Math.abs(a)}`;
      const top = piece(p, q), bot = piece(s, t), nt = [p, q - p * r], nb = [s, t - s * r];
      return E.num(`In ${M(`(${top})/(${bot})`)}, write the top and the bottom each as one fraction over ${M(D)}. What are their tops?`, [{ label: 'top of the top =', expr: P(nt), form: 'simplified' }, { label: 'top of the bottom =', expr: P(nb), form: 'simplified' }],
        `${M(`${p}=${rat(cf(p) + (r === 0 ? 'x' : D), D)}`)}, so the top is ${M(rat(P(nt), D))}. Likewise the bottom is ${M(rat(P(nb), D))}.`); } },
    b: { t: 'multiply by the LCD method', g: R => {
      let top, bot, Lp;
      do { const two = () => { const ps = R.sample([0, 1, 2], 2).sort(); return ps.map(p => [nz(R, -6, 6), p]); }; top = two(); bot = two(); Lp = Math.max(...top.map(t => t[1]), ...bot.map(t => t[1])); } while (Lp < 1);
      const newP = ts => { const co = new Array(Lp + 1).fill(0); ts.forEach(([c, p]) => { co[p] += c; }); return P(co); };
      const L = Lp === 1 ? 'x' : 'x^' + Lp, nt = newP(top), nb = newP(bot);
      return E.num(`Simplify ${M(`(${sumS(top)})/(${sumS(bot)})`)} by multiplying its top and bottom by the LCD of the small fractions. What are the LCD, the new top and the new bottom?`,
        [{ label: 'LCD =', expr: L }, { label: 'new top =', expr: nt, form: 'simplified' }, { label: 'new bottom =', expr: nb, form: 'simplified' }],
        `Multiply every term by ${M(L)}: the top becomes ${M(nt)} and the bottom ${M(nb)}, so the result is ${M(rat(nt, nb))}.`); } },
    c: { t: 'simplify', g: R => {
      const kind = R.int(0, 3), k = R.int(2, 6), s = R.pick([1, -1]);
      if (kind === 0) { const bot = `1${s > 0 ? '+' : '-'}${k}/x`;
        return E.num(`Simplify ${M(`(x-${k * k}/x)/(${bot})`)}.`, [{ expr: P([1, -s * k]), form: 'simplified' }], `Multiply top and bottom by x: ${M(rat(`x^2-${k * k}`, lin2(s * k)))} = ${M(rat(fac([k, -k]), fac([-s * k])))} = ${M(P([1, -s * k]))}.`); }
      if (kind === 1) { const bot = `1/${k}${s > 0 ? '+' : '-'}1/x`;
        return E.num(`Simplify ${M(`(x/${k}-${k}/x)/(${bot})`)}.`, [{ expr: P([1, -s * k]), form: 'simplified' }], `Multiply top and bottom by ${k}x: ${M(rat(`x^2-${k * k}`, lin2(s * k)))} = ${M(P([1, -s * k]))}.`); }
      if (kind === 2) { const a = nz(R, -6, 6), b = nz(R, -9, 9);
        return E.num(`Simplify ${M(`(${a}${b > 0 ? '-' : '+'}${Math.abs(b)}/x)/(1/x)`)}.`, [{ expr: P([a, -b]), form: 'simplified' }], `Multiply top and bottom by x: the top becomes ${M(P([a, -b]))} and the bottom becomes 1, so the answer is ${M(P([a, -b]))}.`); }
      let m; do m = R.int(1, 6); while (m === k && R.bool(0.5));
      const right = rat(lin2(k), lin2(-m));
      return chooseX(R, `Simplify ${M(`(1+${k}/x)/(1-${m}/x)`)}.`, right, [rat(lin2(-k), lin2(m)), rat(lin2(-m), lin2(k)), E.fracStr(k, -m), rat(lin2(k), `x^2-${m}`)],
        `Multiply top and bottom by x: ${M(`x(1+${k}/x)=${lin2(k)}`)} and ${M(`x(1-${m}/x)=${lin2(-m)}`)}, so the answer is ${M(right)}.`); } },
    d: { t: 'excluded values', g: R => {
      const kind = R.int(0, 2); let q, exc, why;
      if (kind === 0) { let r, b; do { r = nz(R, -5, 5); b = nz(R, -5, 5); } while (r === b); const a = nz(R, -5, 5);
        q = `(${a}/x)/(1${b > 0 ? '+' : '-'}${Math.abs(b)}/${fac([r])})`; exc = [0, r, r - b]; why = `The small bottoms give x = 0 and x = ${r}. The big bottom is ${M(rat(lin2(-r + b), fac([r])))}, which is 0 at x = ${r - b}.`; }
      else if (kind === 1) { const d = R.int(1, 6), c = nz(R, -5, 5);
        q = `(1${c > 0 ? '+' : '-'}${Math.abs(c)}/x)/(1-${d * d}/x^2)`; exc = [0, d, -d]; why = `The small bottoms give x = 0. The big bottom is ${M(rat(`x^2-${d * d}`, 'x^2'))}, which is 0 at x = ±${d}.`; }
      else { let p, qq; do { p = R.int(-5, 5); qq = R.int(-5, 5); } while (p === qq || p === qq - 1);
        q = `(1/${fac([p])})/(1/${fac([qq])}+1)`; exc = [p, qq, qq - 1]; why = `The small bottoms give x = ${p} and x = ${qq}. The big bottom is ${M(rat(lin2(1 - qq), fac([qq])))}, which is 0 at x = ${qq - 1}.`; }
      return E.num(`Find every excluded value of x for ${M(q)}.`, [{ label: 'x ≠', set: setS(exc) }], why + ' Check the small bottoms and the big bottom.'); } },
    e: { t: 'a fraction inside a fraction inside a fraction', g: R => {
      let a, b, c, d; do { a = nz(R, -3, 4); b = nz(R, -4, 4); c = R.int(1, 4); d = nz(R, -5, 5); } while (a * c + b === 0);
      let tp = [a * c + b, a * d], bt = [c, d]; const g = [...tp, ...bt].reduce((u, v) => E.gcd(Math.abs(u), Math.abs(v)));
      tp = tp.map(v => v / g); bt = bt.map(v => v / g);
      const right = rat(P(tp), P(bt));
      const wrongs = [rat(P([a + b, a * d]), P(bt)), rat(P([a, b]), P(bt)), rat(P(tp), P([c, 0])), rat(P(tp), P([d, c])), rat(P([a * c + b, d]), P(bt))];
      return chooseX(R, `Simplify ${M(`${a}${b > 0 ? '+' : '-'}${Math.abs(b)}/(${c}${d > 0 ? '+' : '-'}${Math.abs(d)}/x)`)}.`, right, wrongs,
        `Work from the inside out: ${M(`${c}${d > 0 ? '+' : '-'}${Math.abs(d)}/x=${rat(P([c, d]), 'x')}`)}, so ${M(`${b}/(${rat(P([c, d]), 'x')})=${rat(P([b, 0]), P([c, d]))}`)}. Then add ${a}: ${M(right)}.`); } },
    f: { t: 'continued fractions', g: R => {
      if (R.bool()) { let a, b, D; do { a = R.int(1, 4); b = nz(R, -2, 6); D = a * a + 4 * b; } while (D <= 0);
        const r1 = E.surdStr(a, 1, D, 2), r2 = E.surdStr(a, -1, D, 2);
        return E.num(`Find every real x with ${M(`x=${a}+${b}/(${a}+${b}/x)`)}. Give exact answers.`, [{ label: 'x =', set: [...new Set([r1, r2])] }],
          `${M(`${a}+${b}/x=${rat(P([a, b]), 'x')}`)}, so the right side is ${M(`${a}+${rat(P([b, 0]), P([a, b]))}`)}. Clearing the bottom gives ${M(`x^2-${a}x${b > 0 ? '-' : '+'}${Math.abs(b)}=0`.replace('-1x', '-x'))}, so x = ${E.pt(r1)} or ${E.pt(r2)}. Neither makes a bottom 0.`); }
      const cs = [R.int(1, 3), R.int(1, 3), R.int(1, 3)]; let x0, t3, t2;
      do { x0 = nz(R, -5, 6); t3 = cs[2] + 1 / x0; t2 = t3 === 0 ? 0 : cs[1] + 1 / t3; } while (t3 === 0 || Math.abs(t2) < 1e-9);
      // (αx+β)/(γx+δ) from the matrices [[c,1],[1,0]]
      const mm = (A, B) => [[A[0][0] * B[0][0] + A[0][1] * B[1][0], A[0][0] * B[0][1] + A[0][1] * B[1][1]], [A[1][0] * B[0][0] + A[1][1] * B[1][0], A[1][0] * B[0][1] + A[1][1] * B[1][1]]];
      const Mx = cs.map(c => [[c, 1], [1, 0]]).reduce(mm), [al, be] = Mx[0], [ga, de] = Mx[1];
      const vs = E.fracStr(al * x0 + be, ga * x0 + de);
      return E.num(`Solve ${M(`${cs[0]}+1/(${cs[1]}+1/(${cs[2]}+1/x))=${vs}`)}.`, [{ label: 'x =', set: [String(x0)] }],
        `Simplify from the inside out: the left side is ${M(rat(P([al, be]), P([ga, de])))}. Setting it equal to ${E.pt(vs)} and cross-multiplying gives x = ${x0}, which makes no bottom 0.`); } },
  });

  /* IV.11.05 Rational equations */
  S('IV.11.05', 'Rational equations', {
    a: { t: 'multiply by the LCD', g: R => {
      if (R.bool(0.45)) { const kind = R.int(0, 2); let eq, L;
        if (kind === 0) { const [r, s] = pickD(R, -6, 6, 2); eq = `${nz(R, -5, 5)}/${fac([r])}=${nz(R, -5, 5)}/${fac([s])}`; L = fac([r, s]); }
        else if (kind === 1) { const a = R.int(2, 4), b = R.pick([3, 4, 5, 6].filter(v => v !== a)); eq = `1/(${a}x)+1/(${b}x)=${nz(R, -5, 5)}`; L = `${a * b / E.gcd(a, b)}x`; }
        else { const r = nz(R, -6, 6); eq = `${nz(R, -5, 5)}/x+${R.int(1, 5)}/${fac([r])}=${R.int(1, 5)}`; L = fac([0, r]); }
        return E.num(`What is the LCD you would multiply by to clear the fractions in ${M(eq)}?`, [{ label: 'LCD =', expr: L }], `The LCD is ${M(L)}; multiplying every term by it clears every fraction.`); }
      const kind = R.int(0, 1);
      if (kind === 0) { let a, b, c; do { a = nz(R, -9, 9); b = nz(R, -5, 5); c = nz(R, -9, 9); } while (a === c || a === b || b === c);
        const opts = [`${a}+${b}x=${c}`, `${a}+${b}=${c}`, `${a}x+${b}=${c}`, `${a}+${b}x=${c}x`].map(s => M(cl(s)));
        return E.choice(R, `Multiply every term of ${M(cl(`${a}/x+${b}=${c}/x`))} by x. Which equation results?`, opts[0], opts.slice(1), `Every term gets multiplied, including the whole number ${b}: ${opts[0]}.`); }
      const r = nz(R, -6, 6); let a, b, c; do { a = nz(R, -9, 9); b = nz(R, -5, 5); c = nz(R, -9, 9); } while (a === c);
      const ins = lin2(-r), opts = [`${a}=${b}(${ins})+${c}`, `${a}=${b}+${c}`, `${a}=${b}(${ins})+${c}(${ins})`, `${a}(${ins})=${b}+${c}`].map(s => M(cl(s)));
      return E.choice(R, `Multiply every term of ${M(cl(`${a}/(${ins})=${b}+${c}/(${ins})`))} by ${M(ins)}. Which equation results?`, opts[0], opts.slice(1), `The whole number ${b} gets multiplied too: ${opts[0]}.`); } },
    b: { t: 'solve the result', g: R => {
      const kind = R.int(0, 2);
      if (kind === 0) { const x0 = nz(R, -8, 8), b = nz(R, -5, 5), a = nz(R, -9, 9), c = a + b * x0;
        return E.num(`Solve ${M(cl(`${a}/x+${b}=${c}/x`))}.`, [{ label: 'x =', set: [String(x0)] }], `Multiply by x: ${M(cl(`${a}+${b}x=${c}`))}, so ${M(cl(`${b}x=${c - a}`))} and x = ${x0}.`); }
      if (kind === 1) { const [p, q] = pickD(R, -7, 7, 2, [0]); const k = p * q, m = p + q;
        return E.num(`Solve ${M(cl(`x+${k}/x=${m}`))}.`, [{ label: 'x =', set: [String(p), String(q)] }], `Multiply by x: ${M(cl(`x^2+${k}=${m}x`))}, so ${M(ex([p, q]) + '=0')}, giving x = ${list([p, q])}. Neither makes x = 0.`); }
      // a/x + b/(kx) = c → ka + b = kcx. b is not a multiple of k (else the second fraction reduces), so x is often a fraction.
      const k = R.int(2, 4); let c, a, b; do { c = nz(R, -3, 3); a = nz(R, -6, 6); b = nz(R, -9, 9); } while (b % k === 0 || k * a + b === 0);
      const xs = E.fracStr(k * a + b, k * c);
      return E.num(`Solve ${M(cl(`${a}/x+${b}/(${k}x)=${c}`))}.`, [{ label: 'x =', set: [xs] }], `Multiply by ${k}x: ${M(cl(`${k * a}+${b}=${k * c}x`))}, so ${M(cl(`${k * c}x=${k * a + b}`))} and x = ${E.pt(xs)}.`); } },
    c: { t: 'proportions shortcut', g: R => {
      if (R.bool(0.3)) { let x0, a, b; do { x0 = R.int(2, 12); a = R.pick([2, 3, 4, 5, 6, 8, 9]); b = x0 * x0 / a; } while (!Number.isInteger(b) || a === b);
        return E.num(`Solve ${M(`x/${a}=${b}/x`)}.`, [{ label: 'x =', set: [String(x0), String(-x0)] }], `Cross-multiply: ${M(`x^2=${a * b}`)}, so x = ±${x0}.`); }
      let x0, a, b, t, p, q; do { x0 = R.int(-6, 6); [a, b] = pickD(R, 1, 7, 2); t = nz(R, -3, 3); p = a * t - x0; q = b * t - x0; } while (p === q || Math.abs(p) > 12 || Math.abs(q) > 12);
      return E.num(`Solve ${M(`${a}/(${lin2(p)})=${b}/(${lin2(q)})`)}.`, [{ label: 'x =', set: [String(x0)] }],
        `Cross-multiply: ${M(cl(`${a}(${lin2(q)})=${b}(${lin2(p)})`))}, so ${M(cl(`${a - b}x=${b * p - a * q}`))} and x = ${x0}. It makes no bottom 0.`); } },
    d: { t: 'check', g: R => {
      const [r, s] = pickD(R, -6, 6, 2), p = R.int(-3, 3), q = p + r + s, w = -r * s;
      const n1 = P([1, p, 0]), n2 = P([q, w]), eq = `${rat(n1, lin2(-r))}=${rat(n2, lin2(-r))}`;
      const kind = R.bool() ? 0 : R.int(1, 2); let c; if (kind === 0) c = s; else if (kind === 1) c = r; else { do c = R.int(-7, 7); while (c === r || c === s); }
      const L = ev([1, p, 0], c), Rv = ev([q, w], c), d = c - r;
      const why = kind === 0 ? `Substitute: both sides equal ${E.fracStr(L, d)}, and the bottom ${r === 0 ? c : `${c} ${sg(-r)} = ${d}`} is not 0.` : kind === 1 ? `x = ${c} makes the bottom 0, so neither side is defined. It is extraneous.` : `Substitute: the left side is ${E.fracStr(L, d)} but the right side is ${E.fracStr(Rv, d)}.`;
      return E.tf(`Is x = ${c} a solution of ${M(eq)}?`, kind === 0, why, { choices: ['Yes', 'No'] }); } },
  });

  /* IV.11.06 Extraneous solutions */
  // f/D = g/D with f − g = (x − r)(x − s); D decides which candidates survive
  const extraEq = (R, kind) => {
    const [r, s] = pickD(R, -6, 6, 2), p = R.int(-3, 3), q = p + r + s, w = -r * s;
    let D, bad; if (kind === 'one') { D = [r]; bad = [r]; } else if (kind === 'both') { D = [r, s]; bad = [r, s]; } else { let t; do t = R.int(-6, 6); while (t === r || t === s); D = [t]; bad = []; }
    const d = D.length === 1 ? lin2(-D[0]) : ex(D);
    return { r, s, bad, good: [r, s].filter(v => !bad.includes(v)), eq: `${rat(P([1, p, 0]), d)}=${rat(P([q, w]), d)}`, D };
  };
  // sqrt(Ax + C) = x + b, built so that squaring gives (x − r)(x − s) = 0; a candidate v is extraneous when v + b < 0
  const radEq = (R, neither) => {
    let b, r, s, A;
    do { b = R.int(-5, 5); [r, s] = pickD(R, -7, 8, 2); A = r + s + 2 * b; }
    while (A < 1 || A > 6 || (neither ? [r, s].some(v => v + b < 0) : [r, s].filter(v => v + b < 0).length !== 1));
    const C = b * b - r * s, rhs = lin2(b);
    return { r, s, eq: `sqrt(${P([A, C])})=${rhs}`, good: [r, s].filter(v => v + b >= 0), bad: [r, s].filter(v => v + b < 0), b, rhs, A, C };
  };
  S('IV.11.06', 'Extraneous solutions', {
    a: { t: 'why they appear', g: R => {
      const kind = R.int(0, 3);
      if (kind === 0) { const a = nz(R, -9, 9);
        return E.choice(R, `Start with ${M('x=' + a)}. Squaring both sides gives ${M('x^2=' + a * a)}. Which solution of the new equation is extraneous?`, `x = ${-a}`, [`x = ${a}`, 'neither', 'both'],
          `${M('x^2=' + a * a)} has solutions ${a} and ${-a}, but only x = ${a} solves the original. Squaring can't tell a from −a.`); }
      if (kind === 1) { const [a, r] = pickD(R, -8, 8, 2);
        return E.choice(R, `Start with ${M('x=' + a)}. Multiplying both sides by ${M(lin2(-r))} gives ${M(`x(${lin2(-r)})=${a}(${lin2(-r)})`)}. Which solution of the new equation is extraneous?`, `x = ${r}`, [`x = ${a}`, 'neither', 'both'],
          `At x = ${r} the factor ${M(lin2(-r))} is 0, so both sides become 0. That value was never a solution of ${M('x=' + a)}.`); }
      if (kind === 2) { const n = R.int(2, 9), r = nz(R, -7, 7);
        const safe = [`Adding ${n} to both sides`, `Subtracting ${n}x from both sides`, `Dividing both sides by ${n}`, `Multiplying both sides by ${n}`, `Subtracting ${n} from both sides`];
        const risky = R.pick(['Squaring both sides', `Multiplying both sides by ${E.pt(lin2(-r))}`]);
        return E.choice(R, 'Which step can introduce an extraneous solution?', risky, R.sample(safe, 3),
          risky.startsWith('Squaring') ? 'Squaring turns a = −b into a² = b², which can add a value. The other steps are reversible.' : `${E.pt(lin2(-r))} is 0 at x = ${r}, so that value can sneak in. The other steps are reversible.`); }
      const Q = [
        ['Why can multiplying both sides by the LCD create an extraneous solution?', 'The LCD can be 0 at that value, so the new equation is not equivalent there.', ['An arithmetic mistake was made.', 'The LCD is always negative.', 'Multiplying loses a solution instead.']],
        ['Why can squaring both sides create an extraneous solution?', 'Squaring makes a = −b look like a = b, since both give a² = b².', ['Square roots can be negative.', 'Squaring always doubles the number of solutions.', 'It only happens with mistakes in algebra.']],
        ['What is an extraneous solution?', 'A value that solves the transformed equation but not the original one.', ['A solution you found by a wrong method.', 'A solution that is not a whole number.', 'A second solution of a quadratic.']],
        ['After solving a rational equation, what should you check first?', 'That no candidate makes a denominator 0.', ['That every candidate is positive.', 'That there are exactly two answers.', 'That the LCD is a whole number.']],
        ['After solving a square root equation, what should you check?', 'Substitute each candidate into the original, because the root side can\'t be negative.', ['Nothing, squaring is always safe.', 'Only that each candidate is a whole number.', 'Only the larger candidate.']],
        ['If your algebra is perfect, can you still get an extraneous solution?', 'Yes. Clearing fractions or squaring can add values that don\'t work.', ['No, they only come from mistakes.', 'Only in linear equations.', 'Only when the answer is negative.']],
      ];
      const [q, right, wrong] = R.pick(Q); return E.choice(R, q, right, wrong, 'Some steps are not reversible, so the new equation can have extra solutions. Always check in the original.'); } },
    b: { t: 'spot them in rational equations', g: R => {
      const kind = R.pick(['one', 'one', 'one', 'neither', 'neither', 'both']), o = extraEq(R, kind);
      const [lo, hi] = [o.r, o.s].sort((a, b) => a - b);
      const right = kind === 'one' ? `x = ${o.bad[0]}` : kind === 'both' ? 'both' : 'neither';
      const all = [`x = ${lo}`, `x = ${hi}`, 'neither', 'both'];
      return E.choice(R, `Clearing fractions in ${M(o.eq)} gives the candidates x = ${lo} and x = ${hi}. Which is extraneous?`, right, all.filter(v => v !== right),
        `The bottom is 0 at x = ${list(o.D)}. ${kind === 'neither' ? 'Neither candidate is there, so both are real solutions.' : `So ${kind === 'both' ? 'both candidates are' : 'x = ' + o.bad[0] + ' is'} extraneous.`}`); } },
    c: { t: 'in radical equations', g: R => {
      const nei = R.bool(0.3), o = radEq(R, nei), [lo, hi] = [o.r, o.s].sort((a, b) => a - b);
      const right = nei ? 'neither' : `x = ${o.bad[0]}`;
      const chk = v => `x = ${v}: the right side is ${v + o.b}${v + o.b < 0 ? ', negative, but a square root is never negative' : ', and it checks'}`;
      return E.choice(R, `Squaring ${M(o.eq)} gives the candidates x = ${lo} and x = ${hi}. Which is extraneous?`, right, [`x = ${lo}`, `x = ${hi}`, 'neither', 'both'].filter(v => v !== right),
        `${chk(lo)}. ${chk(hi)}.`); } },
    d: { t: 'state the final set', g: R => {
      if (R.bool()) { const kind = R.pick(['one', 'one', 'neither', 'both']), o = extraEq(R, kind);
        return E.num(`Solve ${M(o.eq)}. Type "no solution" if there is none.`, [{ label: 'x =', set: o.good.map(String) }],
          `Clearing fractions gives ${M(ex([o.r, o.s]) + '=0')}, so x = ${list([o.r, o.s])}. The bottom is 0 at x = ${list(o.D)}, so ${o.good.length === 2 ? 'both are solutions' : o.good.length ? 'the only solution is x = ' + o.good[0] : 'there is no solution'}.`); }
      const o = radEq(R, R.bool(0.25));
      return E.num(`Solve ${M(o.eq)}.`, [{ label: 'x =', set: o.good.map(String) }],
        `Squaring gives ${M(ex([o.r, o.s]) + '=0')}, so x = ${list([o.r, o.s])}. ${o.bad.length ? `At x = ${o.bad[0]} the right side ${M(o.rhs)} is ${o.bad[0] + o.b}, negative, so it is extraneous.` : 'Both check in the original.'}`); } },
    e: { t: 'rearrange, then check', g: R => {
      if (R.bool()) { const o = radEq(R, false), m = -o.b;
        return E.num(`Solve ${M(`x-sqrt(${P([o.A, o.C])})=${m}`)}.`, [{ label: 'x =', set: o.good.map(String) }],
          `Isolate the root first: ${M(`sqrt(${P([o.A, o.C])})=${o.rhs}`)}. Squaring gives ${M(ex([o.r, o.s]) + '=0')}, so x = ${list([o.r, o.s])}. At x = ${o.bad[0]} the right side is ${o.bad[0] + o.b}, negative, so it is extraneous.`); }
      let p, q, r, k, N; do { [p, q, r] = R.distinct(-6, 6, 3); k = q - p - r; N = -k * p - p * r; } while (k === 0 || N === 0);
      return E.num(`Solve ${M(cl(`x/(${lin2(-p)})+${k}/(${lin2(-q)})=${N}/(${fac([p, q])})`))}. Type "no solution" if there is none.`, [{ label: 'x =', set: [String(r)] }],
        `Multiply by ${M(fac([p, q]))}: ${M(cl(`x(${lin2(-q)})+${k}(${lin2(-p)})=${N}`))}, so ${M(ex([p, r]) + '=0')} and x = ${list([p, r])}. x = ${p} makes a bottom 0, so only x = ${r} works.`); } },
    f: { t: 'square twice', g: R => {
      let A, d, b, u1, u2, B;
      do { A = R.pick([2, 3]); d = R.pick([1, 2]); const sum = 2 * d / (A - 1); u1 = R.int(Math.max(1, Math.ceil(sum / 2)), 6); u2 = sum - u1; b = R.int(-4, 6); B = A * b + d * d + (A - 1) * u1 * u2; }
      while (u1 === u2 || B === 0 || u1 * u1 - b > 40);
      const xs = [u1, u2].filter(u => u >= 0).map(u => u * u - b), badX = u2 < 0 ? u2 * u2 - b : null;
      return E.num(`Solve ${M(`sqrt(${P([A, B])})-sqrt(${P([1, b])})=${d}`)}.`, [{ label: 'x =', set: xs.map(String) }],
        `Let u = ${M(`sqrt(${P([1, b])})`)} ≥ 0, so x = u² ${sg(-b)}. Then ${M(`sqrt(${P([A, B])})=${d}+u`)}; squaring gives ${M(`${P([A - 1, -2 * d, (A - 1) * u1 * u2]).replace(/x/g, 'u')}=0`)}, so u = ${u1} or u = ${u2}.${badX === null ? ` Both are allowed, so x = ${list(xs)}.` : ` u = ${u2} is impossible (a root is never negative), so x = ${badX} is extraneous and only x = ${xs[0]} works.`}`.replace('u² + 0', 'u²')); } },
  });

  /* IV.11.07 Vertical asymptotes */
  S('IV.11.07', 'Vertical asymptotes', {
    a: { t: 'zeros of the denominator', g: R => {
      const kind = R.int(0, 2); let D;
      if (kind === 0) D = pickD(R, -7, 7, 2); else if (kind === 1) { const m = R.int(1, 8); D = [m, -m]; } else D = [0, nz(R, -7, 7)];
      let a; do a = R.int(-7, 7); while (D.includes(a)); const top = R.bool(0.3) ? String(nz(R, -9, 9)) : lin2(-a);
      return E.num(`Find the vertical asymptotes of ${M('f(x)=' + rat(top, ex(D)))}. Give the x-values.`, [{ label: 'x =', set: setS(D) }],
        `${M(ex(D) + '=' + fac(D))} is 0 at x = ${list(D)}, and the top isn't 0 there.`); } },
    b: { t: 'after cancelling', g: R => {
      const [c, v, a] = pickD(R, -7, 7, 3), share = R.bool(0.8);
      const top = share ? (R.bool() ? [c] : [c, a]) : [a], D = [c, v];
      const va = share ? [v] : [c, v];
      return E.num(`Find the vertical asymptotes of ${M('f(x)=' + rat(ex(top), ex(D)))}. Give the x-values.`, [{ label: 'x =', set: setS(va) }],
        share ? `${M(rat(fac(top), fac(D)))}: ${M(fac([c]))} cancels, so x = ${c} is a hole. Only x = ${v} is an asymptote.` : `${M(rat(fac(top), fac(D)))} has no common factor, so both x = ${c} and x = ${v} are asymptotes.`); } },
    c: { t: 'behavior near them', g: R => {
      const r = R.int(-5, 5), kind = R.int(0, 2), side = R.pick([1, -1]), want = R.pick([1, -1]);
      let a; do a = R.int(-6, 6); while (a === r);
      const base = x => kind === 0 ? 1 / (x - r) : kind === 1 ? (x - a) / (x - r) : 1 / ((x - r) * (x - r));
      const k = Math.sign(base(r + side * 1e-6)) === want ? 1 : -1, m = k * R.int(1, 4);
      const f = kind === 0 ? rat(String(m), lin2(-r)) : kind === 1 ? rat(P([m, -m * a]), lin2(-r)) : rat(String(m), fac([r, r]));
      const topAt = kind === 1 ? m * (r - a) : m;
      return E.choiceFixed(`As x approaches ${r} from the ${side > 0 ? 'right' : 'left'}, what does ${M('f(x)=' + f)} do?`, ['f(x) → ∞', 'f(x) → −∞'], want > 0 ? 0 : 1,
        `Near x = ${r} the top is about ${topAt} and the bottom is a tiny ${kind === 2 ? 'positive number (it is squared)' : side > 0 ? 'positive number' : 'negative number'}, so f(x) → ${want > 0 ? '∞' : '−∞'}.`); } },
    d: { t: 'write the equations', g: R => {
      const kind = R.int(0, 2);
      if (kind === 0) { const [r, c] = pickD(R, -7, 7, 2); const k = nz(R, -4, 4);
        return E.num(`Write the equation of the vertical asymptote of ${M('f(x)=' + rat(ex([c], k), ex([r, c])))}.`, [{ eqn: `x=${r}` }], `${M(fac([c]))} cancels (a hole at x = ${c}), leaving the asymptote x = ${r}.`); }
      if (kind === 1) { const r = nz(R, -7, 7), k = nz(R, -6, 6);
        return E.num(`Write the equation of the vertical asymptote of ${M('f(x)=' + rat(String(k), ex([r, r])))}.`, [{ eqn: `x=${r}` }], `${M(ex([r, r]) + '=' + fac([r, r]))} is 0 only at x = ${r}.`); }
      const [p, q] = pickD(R, -7, 7, 2).sort((a, b) => a - b); let a; do a = R.int(-7, 7); while (a === p || a === q);
      return E.num(`Write the equations of the vertical asymptotes of ${M('f(x)=' + rat(lin2(-a), ex([p, q])))}.`, [{ label: 'left one:', eqn: `x=${p}` }, { label: 'right one:', eqn: `x=${q}` }], `${M(ex([p, q]) + '=' + fac([p, q]))}, so the asymptotes are x = ${p} and x = ${q}.`); } },
  });

  /* IV.11.08 Horizontal asymptotes */
  const rpoly = (R, deg) => { const co = [nz(R, -5, 5)]; for (let i = 0; i < deg; i++) co.push(R.int(-6, 6)); return co; };
  S('IV.11.08', 'Horizontal asymptotes', {
    a: { t: 'compare degrees', g: R => {
      const kind = R.int(0, 2); let dn, dd; do { dn = R.int(0, 3); dd = R.int(1, 3); } while (Math.sign(dn - dd) !== [-1, 0, 1][kind]);
      const N = rpoly(R, dn), D = rpoly(R, dd);
      return E.choiceFixed(`What is the horizontal asymptote of ${M('f(x)=' + rat(P(N), P(D)))}?`, ['y = 0', 'y = (ratio of leading coefficients)', 'none'], kind,
        `The top has degree ${dn} and the bottom degree ${dd}: ${['bottom bigger gives y = 0', 'equal degrees give the ratio of the leading coefficients, y = ' + E.pt(E.fracStr(N[0], D[0])), 'top bigger gives no horizontal asymptote'][kind]}.`); } },
    b: { t: 'ratio of leaders', g: R => {
      const n = R.int(1, 2), N = rpoly(R, n), D = rpoly(R, n); const rev = R.bool(0.3);
      const txt = co => { if (!rev) return P(co); const terms = co.map((c, i) => [c, co.length - 1 - i]).filter(([c]) => c).reverse(); return terms.map(([c, p], i) => (c < 0 ? '-' : i ? '+' : '') + (p === 0 ? Math.abs(c) : (Math.abs(c) === 1 ? '' : Math.abs(c)) + 'x' + (p > 1 ? '^' + p : ''))).join(''); };
      const y = E.fracStr(N[0], D[0]);
      return E.num(`Write the equation of the horizontal asymptote of ${M('f(x)=' + rat(txt(N), txt(D)))}.`, [{ eqn: `y=${y}` }], `Equal degrees, so divide the leading coefficients (of ${M(n === 1 ? 'x' : 'x^2')}): y = ${fd(N[0], D[0])}.`); } },
    c: { t: 'y = 0 case', g: R => {
      const dd = R.int(1, 3), dn = R.int(0, dd - 1), right = rat(P(rpoly(R, dn)), P(rpoly(R, dd)));
      const w = [];
      for (let i = 0; i < 6; i++) { const e = R.int(1, 3), up = R.bool(); w.push(rat(P(rpoly(R, up ? e + 1 : e)), P(rpoly(R, e)))); }
      return chooseX(R, 'Which function has the horizontal asymptote y = 0?', right, w, `Only when the top has a smaller degree than the bottom does f(x) → 0: ${M(right)}.`); } },
    d: { t: 'can a graph cross it', g: R => {
      const a = nz(R, -3, 3), e = R.int(1, 4);
      if (R.bool(0.6)) { const x0 = nz(R, -5, 5), b = nz(R, -4, 4), d = a * e - b * x0; const N = P([a, b, d]), D = P([1, 0, e]);
        return E.num(`${M('f(x)=' + rat(N, D))}. Find its horizontal asymptote and the x-value where the graph crosses it.`, [{ label: 'asymptote:', eqn: `y=${a}` }, { label: 'crosses at x =', ans: x0 }],
          `Equal degrees give y = ${a}. Solve ${M(`${rat(N, D)}=${a}`)}: ${M(`${N}=${P([a, 0, a * e])}`)}, so ${b === 1 ? '' : M(`${P([b, 0])}=${a * e - d}`) + ' and '}x = ${x0}.`); }
      const yes = R.bool(); const b = yes ? nz(R, -4, 4) : 0; let d; do d = R.int(-8, 8); while (d === a * e);
      const N = P([a, b, d]), D = P([1, 0, e]);
      return E.tf(`Does the graph of ${M('f(x)=' + rat(N, D))} cross its horizontal asymptote y = ${a}?`, yes,
        yes ? `Setting f(x) = ${a} gives ${M(`${P([b, 0])}=${a * e - d}`)}, which has a solution x = ${E.pt(E.fracStr(a * e - d, b))}. Asymptotes only describe the far ends.` : `Setting f(x) = ${a} gives ${M(`${d}=${a * e}`)}, which is false, so it never reaches y = ${a}.`, { choices: ['Yes', 'No'] }); } },
  });

  /* IV.11.09 Holes */
  const ratPic = (f, o = {}) => V.graph({ x: [-6, 6], y: [-6, 6], w: o.w || 170, h: o.h || 170, labels: false, ticks: 1, fns: [{ f, color: C.blue }], points: o.points || [], vlines: o.vlines || [], hlines: o.hlines || [], label: 'graph of a rational function' });
  S('IV.11.09', 'Holes', {
    a: { t: 'cancelled factors', g: R => {
      const [h, s, t] = pickD(R, -7, 7, 3), top = R.bool(0.3) ? [h] : [h, s], k = R.pick([1, 1, 2, -1]);
      return E.num(`At what x-value does ${M('f(x)=' + rat(ex(top, k), ex([h, t])))} have a hole?`, [{ label: 'x =', ans: h }],
        `${M(rat(fac(top, k), fac([h, t])))}: the factor ${M(fac([h]))} cancels, leaving a hole at x = ${h}.`); } },
    b: { t: "find the hole's coordinates", g: R => {
      const [h, s, t] = pickD(R, -6, 6, 3), kind = R.int(0, 2), k = R.pick([1, 1, 2, 3, -1]);
      const top = kind === 1 ? [h] : [h, s], bot = kind === 2 ? [h] : [h, t];
      const gN = kind === 1 ? k : k * (h - s), gD = kind === 2 ? 1 : h - t;
      const simp = one(rat(fac(top.slice(1), k), fac(bot.slice(1))));
      return E.num(`Find the coordinates of the hole in ${M('f(x)=' + rat(ex(top, k), ex(bot)))}.`, [{ point: [String(h), E.fracStr(gN, gD)] }],
        `Cancel ${M(fac([h]))} to get ${M(simp)}. At x = ${h} it gives ${E.pt(E.fracStr(gN, gD))}, so the hole is ${pt(h, E.pt(E.fracStr(gN, gD)))}.`); } },
    c: { t: 'show on a graph', g: R => {
      const kind = R.int(0, 1);
      if (kind === 0) { let h, s; do { h = R.int(-4, 4); s = R.int(-4, 4); } while (h === s || Math.abs(h - s) > 5);
        const g = x => x - s, hy = h - s; let h2; do h2 = R.int(-4, 4); while (h2 === h || h2 === s);
        const pic = pts => ratPic(g, { points: pts });
        const right = pic([[h, hy, '', true]]), wrong = [pic([[h, 0, '', true]]), pic([]), pic([[h2, g(h2), '', true]])];
        return E.choice(R, `Which graph shows ${M('f(x)=' + rat(ex([h, s]), lin2(-h)))}?`, right, wrong, `It simplifies to ${M('y=' + lin2(-s))} with a hole at x = ${h}. The hole's height comes from the simplified form: ${pt(h, hy)}.`); }
      let h, t; do { h = R.int(-4, 4); t = R.int(-4, 4); } while (h === t || Math.abs(h - t) < 1);
      const g = x => 1 / (x - t), hy = 1 / (h - t);
      const right = ratPic(g, { points: [[h, hy, '', true]], vlines: [{ x: t }] });
      const wrong = [ratPic(g, { vlines: [{ x: t }] }), ratPic(x => 1 / (x - h), { points: [[t, 1 / (t - h), '', true]], vlines: [{ x: h }] }), ratPic(g, { points: [[h, 0, '', true]], vlines: [{ x: t }] })];
      return E.choice(R, `Which graph shows ${M('f(x)=' + rat(lin2(-h), ex([h, t])))}?`, right, wrong, `It simplifies to ${M(rat('1', lin2(-t)))}: an asymptote at x = ${t} and a hole at ${pt(h, E.pt(E.fracStr(1, h - t)))}.`); } },
    d: { t: 'hole vs asymptote', g: R => {
      const [a, h, v] = pickD(R, -6, 6, 3), ask = R.int(0, 2), xv = [h, v, a][ask];
      return E.choiceFixed(`At x = ${xv}, the graph of ${M('f(x)=' + rat(ex([a, h]), ex([h, v])))} has…`, ['a hole', 'a vertical asymptote', 'an x-intercept'], ask,
        `${M(rat(fac([a, h]), fac([h, v])))}: ${M(fac([h]))} cancels (hole at x = ${h}), ${M(fac([v]))} stays on the bottom (asymptote at x = ${v}), and ${M(fac([a]))} stays on top (x-intercept at x = ${a}).`); } },
  });

  /* IV.11.10 Graph rational functions */
  S('IV.11.10', 'Graph rational functions', {
    a: { t: 'intercepts', g: R => {
      if (R.bool(0.5)) { const [a, b] = pickD(R, -7, 7, 2, [0]), k = R.pick([1, 1, 2, -1, 3]);
        return E.num(`Find the intercepts of ${M('f(x)=' + rat(ex([a], k), lin2(-b)))}.`, [{ label: 'x-intercept: x =', ans: a }, { label: 'y-intercept: y =', ...fld(k * a, b) }],
          `The top is 0 at x = ${a}. At x = 0, f(0) = ${fd(-k * a, -b)}.`); }
      const [a, c, b, d] = pickD(R, -6, 6, 4, [0]);
      return E.num(`Find the intercepts of ${M('f(x)=' + rat(ex([a, c]), ex([b, d])))}.`, [{ label: 'x-intercepts: x =', set: setS([a, c]) }, { label: 'y-intercept: y =', ...fld(a * c, b * d) }],
        `The top ${M(fac([a, c]))} is 0 at x = ${list([a, c])}. f(0) = ${fd(a * c, b * d)}.`); } },
    b: { t: 'asymptotes and holes', g: R => {
      const [h, a, b] = pickD(R, -6, 6, 3), k = nz(R, -3, 3);
      const y = E.fracStr(k * (h - a), h - b);
      return E.num(`For ${M('f(x)=' + rat(ex([h, a], k), ex([h, b])))}, find the vertical asymptote, the horizontal asymptote and the hole.`,
        [{ label: 'vertical:', eqn: `x=${b}` }, { label: 'horizontal:', eqn: `y=${k}` }, { label: 'hole:', point: [String(h), y] }],
        `${M(rat(fac([h, a], k), fac([h, b])))} = ${M(rat(fac([a], k), fac([b])))} with a hole at x = ${h}, y = ${E.pt(y)}. Asymptotes: x = ${b}, and y = ${k} (equal degrees).`); } },
    c: { t: 'sign chart', g: R => {
      const two = R.bool(0.5), pts = pickD(R, -6, 6, two ? 3 : 2), b = pts[pts.length - 1], tops = pts.slice(0, -1);
      const cr = [...pts].sort((p, q) => p - q), zone = R.int(0, cr.length), want = R.pick([1, -1]);
      const tp = zone === 0 ? cr[0] - 1.5 : zone === cr.length ? cr[cr.length - 1] + 1.5 : (cr[zone - 1] + cr[zone]) / 2;
      const s0 = Math.sign(tops.reduce((p, r) => p * (tp - r), 1) / (tp - b)), k = s0 === want ? 1 : -1;
      const iv = zone === 0 ? `x<${cr[0]}` : zone === cr.length ? `x>${cr[cr.length - 1]}` : `${cr[zone - 1]}<x<${cr[zone]}`;
      const f = rat(ex(tops, k), lin2(-b));
      return E.choiceFixed(`Is ${M('f(x)=' + f)} positive or negative for ${M(iv)}?`, ['positive', 'negative'], want > 0 ? 0 : 1,
        `The sign can only change at x = ${list(pts)}. Test x = ${tp}: f(${tp}) is ${want > 0 ? 'positive' : 'negative'}.`); } },
    d: { t: 'sketch', g: R => {
      const b = nz(R, -3, 3), c = nz(R, -3, 3), m = nz(R, -3, 3);
      const pic = (bb, cc, mm) => ratPic(x => cc + mm / (x - bb), { vlines: [{ x: bb }], hlines: [{ y: cc }] });
      const right = pic(b, c, m), wrong = [pic(-b, c, m), pic(b, -c, m), pic(b, c, -m)];
      return E.choice(R, `Which graph shows ${M('f(x)=' + rat(P([c, m - c * b]), lin2(-b)))}?`, right, wrong,
        `It equals ${M(`${c}+${m}/(${lin2(-b)})`.replace(/\+-/g, '-'))}: asymptotes x = ${b} and y = ${c}. For ${M('x>' + b)} the fraction part is ${m > 0 ? 'positive' : 'negative'}, so the right branch is ${m > 0 ? 'above' : 'below'} y = ${c}.`); } },
    e: { t: 'build it from the features', g: R => {
      const [a, c] = R.distinct(-6, 6, 2), b = nz(R, -4, 4), yInt = R.bool(0.4) && a !== 0;
      if (yInt) { let q; do q = R.int(-9, 9); while (q === -a * b); const d = E.fracStr(q, -a);
        return E.num(`Write ${M('f(x)=(px+q)/(x+r)')} with vertical asymptote x = ${a}, horizontal asymptote y = ${b} and y-intercept ${E.pt(d)}.`, [{ label: 'f(x) =', expr: rat(P([b, q]), lin2(-a)) }],
          `The asymptotes give r = ${-a} and p = ${b}. Then f(0) = q/${par(-a)} = ${E.pt(d)}, so q = ${q}: ${M('f(x)=' + rat(P([b, q]), lin2(-a)))}.`); }
      return E.num(`Write ${M('f(x)=(px+q)/(x+r)')} with vertical asymptote x = ${a}, horizontal asymptote y = ${b} and x-intercept ${c}.`, [{ label: 'f(x) =', expr: rat(P([b, -b * c]), lin2(-a)) }],
        `Bottom ${M(lin2(-a))} for the asymptote x = ${a}; top ${M(`${cf(b)}${fac([c])}`)} for the zero at ${c} and leading ratio ${b}: ${M('f(x)=' + rat(P([b, -b * c]), lin2(-a)))}.`); } },
    f: { t: 'rational inequalities', g: R => {
      const op = R.pick(['<', '<=', '>', '>=']);
      if (R.bool()) { const [a, b, c] = R.distinct(-6, 6, 3), f = x => (x - a) * (x - b) / (x - c), iv = signIv([[a, false], [b, false], [c, true]], f, op);
        return E.num(`Solve ${M(rat(ex([a, b]), lin2(-c)) + op + '0')}. Answer in interval notation.`, [{ interval: iv }],
          `Critical points: zeros ${list([a, b])} and the pole ${c} (never included). Test a point in each region: ${E.pt(iv)}.`); }
      let p, k, c, z, q; do { p = nz(R, -3, 3); k = nz(R, -3, 3); c = R.int(-5, 5); z = R.int(-6, 6); q = -(p - k) * z - k * c; } while (p === k || z === c || Math.abs(q) > 20);
      const f = x => ((p - k) * x + q + k * c) / (x - c), iv = signIv([[z, false], [c, true]], f, op);
      return E.num(`Solve ${M(rat(P([p, q]), lin2(-c)) + op + k)}. Answer in interval notation.`, [{ interval: iv }],
        `Don't multiply by ${M(lin2(-c))}, its sign is unknown. ${k > 0 ? 'Subtract ' + k : 'Add ' + -k}: ${M(rat(P([p - k, q + k * c]), lin2(-c)) + op + '0')}. Critical points ${z} (zero) and ${c} (pole, excluded); the sign chart gives ${E.pt(iv)}.`); } },
  });

  /* IV.11.11 Slant asymptotes */
  const slant = (R, target) => { const r = R.int(-2, 2), a = R.pick([1, -1]), q0 = R.int(-3, 3), Rm = target ? target * R.int(1, 5) : nz(R, -5, 5), b = q0 - a * r, c = Rm - a * r * r - b * r; return { r, a, q0, Rm, b, c, N: P([a, b, c]), f: x => (a * x * x + b * x + c) / (x - r) }; };
  S('IV.11.11', 'Slant asymptotes', {
    a: { t: 'degree one higher', g: R => {
      const yes = R.bool(); let dd, dn, D, N;
      do { dd = R.int(1, 2); dn = yes ? dd + 1 : R.pick([dd, dd + 2, dd - 1].filter(v => v >= 0)); D = dd === 1 ? [nz(R, -5, 5)] : pickD(R, -5, 5, 2); N = rpoly(R, dn); } while (D.some(r => ev(N, r) === 0));
      return E.choiceFixed(`Does ${M('f(x)=' + rat(P(N), ex(D)))} have a slant asymptote?`, ['Yes', 'No'], yes ? 0 : 1,
        yes ? `The top's degree (${dn}) is exactly one more than the bottom's (${dd}), so yes.` : `The top has degree ${dn} and the bottom ${dd}. A slant asymptote needs exactly one more on top.`); } },
    b: { t: 'divide to find it', g: R => {
      if (R.bool(0.65)) { let a, b, c, r; do { a = R.pick([1, 1, 2, -1, 3]); b = R.int(-6, 6); c = R.int(-9, 9); r = nz(R, -5, 5); } while (a * r * r + b * r + c === 0);
        const Q = P([a, b + a * r]);
        return E.num(`Find the slant asymptote of ${M('f(x)=' + rat(P([a, b, c]), lin2(-r)))}.`, [{ eqn: `y=${Q}` }],
          `Dividing gives ${M(`${Q}+${a * r * r + b * r + c}/(${lin2(-r)})`.replace(/\+-/g, '-'))}. The remainder part fades, so y = ${E.pt(Q)}.`); }
      let p, q, w, e; do { p = R.int(-5, 5); q = R.int(-6, 6); w = R.int(-9, 9); e = R.int(1, 4); } while (q - e === 0 && w - p * e === 0);
      const Q = P([1, p]);
      return E.num(`Find the slant asymptote of ${M('f(x)=' + rat(P([1, p, q, w]), P([1, 0, e])))}.`, [{ eqn: `y=${Q}` }],
        `Dividing by ${M(P([1, 0, e]))} gives the quotient ${M(Q)} with remainder ${M(P([q - e, w - p * e]))}, so y = ${E.pt(Q)}.`); } },
    c: { t: 'graph with it', g: R => {
      const o = slant(R), mid = o.a * o.r + o.q0;
      const vis = V.graph({ x: [o.r - 7, o.r + 7], y: [mid - 9, mid + 9], w: 300, h: 300, fns: [{ f: o.f, color: C.blue }, { f: x => o.a * x + o.q0, color: C.red, dash: true }], vlines: [{ x: o.r }], label: 'rational function with its asymptotes' });
      const right = 'y=' + P([o.a, o.q0]);
      const cands = [[o.a, o.q0 + o.Rm], [o.a, -o.q0], [-o.a, o.q0], [o.a, o.q0 + (o.Rm > 0 ? -2 : 2)], [-o.a, -o.q0 + 1]].map(([m, q]) => 'y=' + P([m, q])).filter(s => s !== right);
      return E.choice(R, `The graph shows ${M('f(x)=' + rat(o.N, lin2(-o.r)))} and its slant asymptote (dashed). What is the asymptote's equation?`, M(right), [...new Set(cands)].slice(0, 3).map(M),
        `Divide: ${M(`${o.N}=(${lin2(-o.r)})(${P([o.a, o.q0])})+${o.Rm}`.replace(/\+-/g, '-'))}. The quotient alone is the asymptote: ${M(right)}.`, { visual: vis }); } },
    d: { t: 'end behavior', g: R => {
      if (R.bool()) { const want = R.pick([1, -1]), o = slant(R, want), Q = P([o.a, o.q0]);
        return E.choiceFixed(`${M('f(x)=' + rat(o.N, lin2(-o.r)))} has slant asymptote ${M('y=' + Q)}. As x → ∞, is the graph above or below it?`, ['above', 'below'], want > 0 ? 0 : 1,
          `${M(`f(x)=${Q}+${o.Rm}/(${lin2(-o.r)})`.replace(/\+-/g, '-'))}. For large x the fraction is ${want > 0 ? 'positive' : 'negative'}, so the graph is ${want > 0 ? 'above' : 'below'}.`); }
      const o = slant(R), dir = R.pick([1, -1]), res = o.a * dir, Q = P([o.a, o.q0]);
      return E.choiceFixed(`As x → ${dir > 0 ? '∞' : '−∞'}, what does ${M('f(x)=' + rat(o.N, lin2(-o.r)))} do?`, ['f(x) → ∞', 'f(x) → −∞'], res > 0 ? 0 : 1,
        `f follows its slant asymptote ${M('y=' + Q)}, which has slope ${o.a}, so f(x) → ${res > 0 ? '∞' : '−∞'}.`); } },
    e: { t: 'where it crosses the asymptote', g: R => {
      const p = R.int(-4, 4), e = R.int(1, 5), al = nz(R, -4, 4), x0 = R.int(-5, 5), be = -al * x0;
      const N = mul([1, p], [1, 0, e]); N[2] += al; N[3] += be;
      return E.num(`${M('f(x)=' + rat(P(N), P([1, 0, e])))}. Find its slant asymptote and the x-value where the graph crosses it.`, [{ label: 'asymptote:', eqn: `y=${P([1, p])}` }, { label: 'crosses at x =', ans: x0 }],
        `Divide: ${M(`f(x)=${P([1, p])}+${rat(P([al, be]), P([1, 0, e]))}`.replace('+-', '-'))}. The graph meets the line when the remainder part is 0: ${M(P([al, be]) + '=0')}, so x = ${x0}.`); } },
    f: { t: 'a parameter in the top and the bottom', g: R => {
      let k1, k2, c; do { [k1, k2] = R.distinct(-4, 4, 2); c = R.int(-6, 6); } while (k1 === 0 || k2 === 0 || [k1, k2].some(k => k ** 3 + k + c === 0));
      const x1 = -(k1 + k2), y1 = 1 - k1 * k2;
      return E.num(`The slant asymptote of ${M('f(x)=' + rat(`kx^2+x${c ? (c > 0 ? '+' : '') + c : ''}`, 'x-k'))} passes through ${pt(x1, y1)}. Find every possible k.`, [{ label: 'k =', set: setS([k1, k2]) }],
        `Dividing by ${M('x-k')} gives the quotient ${M('kx+k^2+1')}, so the asymptote is ${M('y=kx+k^2+1')}. Through ${pt(x1, y1)}: ${M(`${P([1, x1, 1 - y1]).replace(/x/g, 'k')}=0`)}, so k = ${list([k1, k2])}.`); } },
  });

  /* IV.11.12 Inverse variation */
  const tbl = (xs, ys) => `<table class="dt"><tr><th>x</th>${xs.map(x => `<td>${String(x).replace('-', '−')}</td>`).join('')}</tr><tr><th>y</th>${ys.map(y => `<td>${String(y).replace('-', '−')}</td>`).join('')}</tr></table>`;
  const XCH = [[2, 'doubles'], [3, 'triples'], [0.5, 'is halved'], [4, 'is multiplied by 4'], [0.25, 'is divided by 4'], [9, 'is multiplied by 9'], [1.25, 'increases by 25%'], [0.8, 'decreases by 20%'], [1.5, 'increases by 50%'], [1.6, 'increases by 60%'], [0.4, 'decreases by 60%'], [2.5, 'increases by 150%'], [0.75, 'decreases by 25%'], [1.2, 'increases by 20%'], [1.44, 'increases by 44%'], [0.64, 'decreases by 36%'], [2.25, 'increases by 125%'], [0.36, 'decreases by 64%'], [1.21, 'increases by 21%'], [0.81, 'decreases by 19%']];
  const PCT = []; [1, 2, 3, 0.5].forEach(n => XCH.forEach(([r, verb]) => { const pc = (Math.pow(1 / r, n) - 1) * 100; if (Math.abs(pc * 100 - Math.round(pc * 100)) < 1e-6 && Math.abs(pc) > 1e-9) PCT.push([n, r, verb]); }));
  const pw = (v, e) => { const t = E.pt(E.fracStr(...fracOf(v))), w = t.includes('/') ? `(${t})` : t; return e === 0.5 ? `√${w}` : e === 1 ? w : w + (e === 2 ? '²' : '³'); };
  const MULTS = [[2, 'doubled'], [3, 'tripled'], [0.5, 'halved'], [4, 'multiplied by 4'], [1 / 3, 'divided by 3']];
  S('IV.11.12', 'Inverse variation', {
    a: { t: 'y = k/x', g: R => {
      if (R.bool()) { const k = R.int(2, 24), alt = R.bool(0.3);
        const right = alt ? `xy=${k}` : `y=${k}/x`, wr = [`y=-${k}x`, `y=${k}x`, `y=x/${k}`, `y=-x+${k}`, `y=${k}-x`];
        return E.choice(R, 'Which equation says that y varies inversely with x?', M(right), R.sample(wr, 3).map(M), `Inverse variation means ${M('y=k/x')}, or ${M('xy=k')}: as x doubles, y halves. A line with negative slope is not inverse variation.`); }
      const yes = R.bool(), k = R.pick([12, 24, 36, 48, 60]), xs = R.sample([1, 2, 3, 4, 6], 4).sort((a, b) => a - b);
      const m = R.int(2, 4), c = m * xs[3] + R.int(1, 10), ys = yes ? xs.map(x => k / x) : xs.map(x => c - m * x);
      return E.tf(`Does this table show inverse variation?${tbl(xs, ys)}`, yes, yes ? `Every product xy is ${k}, so y = ${k}/x.` : `The products xy are ${xs.map((x, i) => x * ys[i]).join(', ')}, not constant. y drops steadily, which is linear.`, { choices: ['Yes', 'No'] }); } },
    b: { t: 'find k', g: R => {
      const x0 = nz(R, -9, 9), y0 = nz(R, -12, 12), k = x0 * y0;
      if (R.bool()) return E.num(`y varies inversely with x, and y = ${y0} when x = ${x0}. What is k?`, [{ label: 'k =', ans: k }], `k = xy = ${x0} · ${par(y0)} = ${k}.`);
      return E.num(`y varies inversely with x, and y = ${y0} when x = ${x0}. Write the equation in the form ${M('y=k/x')}.`, [{ eqn: `y=${k}/x` }], `k = xy = ${k}, so ${M(`y=${k}/x`)}.`); } },
    c: { t: 'joint and combined variation', g: R => {
      for (;;) {
        const kind = R.int(0, 2);
        if (kind === 0) { const k = R.pick([1, 2, 3, 4, 5, 0.5]), x1 = R.int(2, 6), y1 = R.int(2, 6), x2 = R.int(2, 9), y2 = R.int(2, 9), z1 = k * x1 * y1, z2 = k * x2 * y2;
          if (!Number.isInteger(z1) || (x1 === x2 && y1 === y2)) continue;
          return E.num(`z varies jointly with x and y. When x = ${x1} and y = ${y1}, z = ${z1}. Find z when x = ${x2} and y = ${y2}.`, [{ label: 'z =', ans: z2 }], `${M('z=kxy')}: k = ${z1}/(${x1} · ${y1}) = ${k}. Then z = ${k} · ${x2} · ${y2} = ${z2}.`); }
        if (kind === 1) { const k = R.int(1, 8), x1 = R.int(2, 9), z1 = R.int(2, 6), x2 = R.int(2, 12), z2 = R.int(2, 6), y1 = k * x1 / z1, y2 = k * x2 / z2;
          if (!Number.isInteger(y1) || !Number.isInteger(y2 * 2) || (x1 === x2 && z1 === z2)) continue;
          return E.num(`y varies directly with x and inversely with z. When x = ${x1} and z = ${z1}, y = ${y1}. Find y when x = ${x2} and z = ${z2}.`, [{ label: 'y =', ans: y2 }], `${M('y=kx/z')}: k = ${y1} · ${z1}/${x1} = ${k}. Then y = ${k} · ${x2}/${z2} = ${y2}.`); }
        const k = R.pick([36, 72, 144, 100, 200, 48]), x1 = R.int(1, 6), x2 = R.int(1, 6), z1 = R.int(1, 6), z2 = R.int(1, 6), y1 = k * x1 / (z1 * z1), y2 = k * x2 / (z2 * z2);
        if (!Number.isInteger(y1) || Math.round(y2 * 1000) !== y2 * 1000 || (x1 === x2 && z1 === z2)) continue;
        return E.num(`y varies directly with x and inversely with the square of z. When x = ${x1} and z = ${z1}, y = ${y1}. Find y when x = ${x2} and z = ${z2}.`, [{ label: 'y =', ans: y2 }], `${M('y=kx/z^2')}: k = ${y1} · ${z1 * z1}/${x1} = ${k}. Then y = ${k} · ${x2}/${z2 * z2} = ${y2}.`);
      } } },
    d: { t: 'word problems', g: (R, O) => {
      const km = !O || O.units !== 'imperial', du = km ? 'km' : 'miles', su = km ? 'km/h' : 'mph';
      for (;;) {
        const kind = R.int(0, 3);
        if (kind === 0) { const s1 = 10 * R.int(3, 9), t1 = R.int(2, 8), s2 = 10 * R.int(3, 12), t2 = s1 * t1 / s2; if (s1 === s2 || Math.round(t2 * 1000) !== t2 * 1000) continue;
          return E.num(`A trip takes ${t1} hours at ${s1} ${su}. How many hours does the same trip take at ${s2} ${su}?`, [{ label: 'time =', ans: t2 }], `Time varies inversely with speed: the distance ${s1 * t1} ${du} stays fixed, so t = ${s1 * t1}/${s2} = ${t2} h.`); }
        if (kind === 1) { const w1 = R.int(2, 12), d1 = R.int(2, 15), w2 = R.int(2, 12), d2 = w1 * d1 / w2; if (w1 === w2 || !Number.isInteger(d2)) continue;
          return E.num(`${w1} workers can finish a job in ${d1} days. At the same rate, how many days would ${w2} workers take?`, [{ label: 'days =', ans: d2 }], `Days vary inversely with workers: k = ${w1} · ${d1} = ${w1 * d1} worker-days, so ${w1 * d1}/${w2} = ${d2} days.`); }
        if (kind === 2) { const p1 = R.int(2, 12), v1 = R.int(2, 12) * 5, p2 = R.int(2, 12), v2 = p1 * v1 / p2; if (p1 === p2 || Math.round(v2 * 1000) !== v2 * 1000) continue;
          return E.num(`A gas has volume ${v1} L at pressure ${p1} atm. Pressure varies inversely with volume. What is the volume at ${p2} atm?`, [{ label: 'volume =', ans: v2 }], `PV = k = ${p1} · ${v1} = ${p1 * v1}, so V = ${p1 * v1}/${p2} = ${v2} L.`); }
        const d1 = R.int(1, 5), I1 = R.pick([36, 72, 100, 144, 16, 48]), d2 = R.int(1, 6), I2 = I1 * d1 * d1 / (d2 * d2); if (d1 === d2 || Math.round(I2 * 1000) !== I2 * 1000) continue;
        return E.num(`The brightness of a lamp varies inversely with the square of the distance. At ${d1} m it measures ${I1} units. What does it measure at ${d2} m?`, [{ label: 'brightness =', ans: I2 }], `k = ${I1} · ${d1 * d1} = ${I1 * d1 * d1}, so brightness = ${I1 * d1 * d1}/${d2 * d2} = ${I2}.`);
      } } },
  });

  /* IV.11.13 Root functions */
  const RF = { 'sqrt(x)': x => Math.sqrt(x), 'cbrt(x)': x => Math.cbrt(x), '-sqrt(x)': x => -Math.sqrt(x), 'sqrt(-x)': x => Math.sqrt(-x), '-cbrt(x)': x => -Math.cbrt(x) };
  const rootPic = f => V.graph({ x: [-6, 6], y: [-4, 4], w: 170, h: 130, labels: false, ticks: 1, fns: [{ f, color: C.blue }], label: 'graph' });
  const withRoot = (kind, a, h, k) => `${a === 1 ? '' : a === -1 ? '-' : a}${kind}(${lin2(-h)})${k ? (k > 0 ? '+' + k : k) : ''}`;
  S('IV.11.13', 'Root functions', {
    a: { t: 'graph √x and ∛x', g: R => {
      const tgt = R.pick(['sqrt(x)', 'cbrt(x)']);
      if (R.bool()) { const others = R.sample(Object.keys(RF).filter(k => k !== tgt), 3);
        return E.choice(R, `Which graph shows ${M('y=' + tgt)}?`, rootPic(RF[tgt]), others.map(k => rootPic(RF[k])), tgt === 'sqrt(x)' ? '√x starts at (0, 0) and rises slowly to the right; it has no points for negative x.' : '∛x passes through (0, 0), is defined for every x, and is negative for negative x.'); }
      const n = R.int(2, 5);
      if (tgt === 'sqrt(x)') return E.choice(R, `Which point is on the graph of ${M('y=sqrt(x)')}?`, pt(n * n, n), [pt(n, n * n), pt(-n * n, -n), pt(n * n, -n)], `√${n * n} = ${n}, so ${pt(n * n, n)} is on it. √x is never negative.`);
      const s = R.pick([1, -1]), n3 = n * n * n;
      return E.choice(R, `Which point is on the graph of ${M('y=cbrt(x)')}?`, pt(s * n3, s * n), [pt(s * n, s * n3), pt(s * n3, -s * n), pt(n * n, n)], `∛(${s * n3}) = ${s * n} because (${s * n})³ = ${s * n3}.`); } },
    b: { t: 'transform them', g: R => {
      const kind = R.pick(['sqrt', 'sqrt', 'cbrt']), a = R.pick([1, 1, -1, 2, -2, 3]), h = nz(R, -6, 6), k = R.int(-6, 6);
      const f = withRoot(kind, a, h, k);
      return E.num(kind === 'sqrt' ? `Where does the graph of ${M('y=' + f)} start? Give the endpoint.` : `The graph of ${M('y=' + f)} is ${M('y=cbrt(x)')} moved. Where is its center point (the image of the origin)?`, [{ point: [String(h), String(k)] }],
        `Set the inside to 0: x = ${h}. Then y = ${k}, so the point is ${pt(h, k)}. The sign inside is the opposite of the shift.`); } },
    c: { t: 'domain and range', g: R => {
      if (R.bool(0.2)) { const a = R.pick([1, -1, 2]), h = R.int(-5, 5), k = R.int(-5, 5);
        return E.num(`Find the domain and range of ${M('y=' + withRoot('cbrt', a, h, k))}.`, [{ label: 'domain:', interval: '(-inf,inf)' }, { label: 'range:', interval: '(-inf,inf)' }], 'Cube roots accept any number and give any number: both are all real numbers.'); }
      const a = R.pick([1, 1, -1, 2, -2]), h = R.int(-6, 6), k = R.int(-6, 6), flip = R.bool(0.3);
      const inside = flip ? (h === 0 ? '-x' : `${h}-x`) : lin2(-h), f = `${a === 1 ? '' : a === -1 ? '-' : a}sqrt(${inside})${k ? (k > 0 ? '+' + k : k) : ''}`;
      const dom = flip ? `(-inf,${h}]` : `[${h},inf)`, rng = a > 0 ? `[${k},inf)` : `(-inf,${k}]`;
      return E.num(`Find the domain and range of ${M('y=' + f)}.`, [{ label: 'domain:', interval: dom }, { label: 'range:', interval: rng }],
        `The inside ${M(inside + '>=0')} gives ${M(flip ? 'x<=' + h : 'x>=' + h)}. The root is at least 0, ${a > 0 ? 'so y ≥ ' + k : 'and a = ' + a + ' flips it, so y ≤ ' + k}.`); } },
    d: { t: 'inverse of a quadratic piece', g: R => {
      const a = R.pick([1, 1, 1, 4, 9]), h = R.int(-5, 5), k = R.int(-5, 1), side = R.pick([1, -1]);
      const rad = `sqrt(${lin2(-k)})${a > 1 ? '/' + Math.sqrt(a) : ''}`, ans = h === 0 ? (side < 0 ? '-' : '') + rad : `${h}${side > 0 ? '+' : '-'}${rad}`;
      const fx = `${a === 1 ? '' : a}${h === 0 ? 'x^2' : '(' + lin2(-h) + ')^2'}${k ? (k > 0 ? '+' + k : k) : ''}`;
      return E.num(`${M('f(x)=' + fx)} for ${M(side > 0 ? 'x>=' + h : 'x<=' + h)}. Find ${M('f^(-1)(x)')}.`, [{ label: 'f⁻¹(x) =', expr: ans }],
        `Swap and solve: ${M(`x=${fx.replace(/x/g, 'y')}`)} gives ${M(`${a === 1 ? '' : a}${h === 0 ? 'y' : '(' + lin2(-h).replace('x', 'y') + ')'}^2=${lin2(-k)}`)}. The original x-values were ${side > 0 ? '≥' : '≤'} ${h}, so take the ${side > 0 ? '+' : '−'} root: ${M('f^(-1)(x)=' + ans)}.`); } },
  });

  /* IV.11.14 Work & rate problems */
  const JOBS = [['A pump', 'fills a tank', 'the tank'], ['A painter', 'paints a room', 'the room'], ['A printer', 'prints a batch of flyers', 'the batch'], ['A hose', 'fills a pool', 'the pool'], ['A robot', 'mows a lawn', 'the lawn']];
  const PAIRS = [['Ana', 'Ben'], ['Kai', 'Mia'], ['Pipe A', 'Pipe B'], ['Sam', 'Lee'], ['Nora', 'Omar']];
  // two workers and a job that suits them (pipes only fill things)
  const crew = R => { const [A, B] = R.pick(PAIRS), pool = A.startsWith('Pipe') ? [['fills a tank', 'the tank'], ['fills a pool', 'the pool']] : [['paints a room', 'the room'], ['mows a lawn', 'the lawn'], ['cleans the garage', 'the garage'], ['stacks a pile of boxes', 'the pile'], ['weeds a garden', 'the garden']]; const [does, it] = R.pick(pool); return [A, B, does, it]; };
  // (A's time, gap d, time together) with the time together a whole number of minutes and a simple fraction of an hour
  const GAPS = []; for (let x = 2; x <= 16; x++) for (let d = 1; d <= 12; d++) { const T = x * (x + d) / (2 * x + d); if (d !== x && [1, 2, 3, 4, 5].some(q => Math.abs(T * q - Math.round(T * q)) < 1e-9)) GAPS.push([x, d, T]); }
  const hrs = T => { const h = Math.floor(T + 1e-9), m = Math.round((T - h) * 60); return `${h} hour${h === 1 ? '' : 's'}${m ? ` ${m} minutes` : ''}`; };
  S('IV.11.14', 'Work & rate problems', {
    a: { t: 'rate as 1/time', g: R => {
      const [who, does, it] = R.pick(JOBS), t = R.int(2, 12);
      if (R.bool()) return E.num(`${who} ${does} in ${t} hours. What fraction of ${it} does it finish in one hour?`.replace('it finish', who === 'A painter' ? 'the painter finish' : 'it finish'), [{ frac: [1, t], form: 'simplest' }], `Rate = 1 job ÷ ${t} hours = 1/${t} of ${it} per hour.`);
      const h = R.int(1, t - 1), g = E.gcd(h, t);
      return E.num(`${who} ${does} in ${t} hours. What fraction of ${it} is done after ${h} hour${h > 1 ? 's' : ''}?`, [{ frac: [h / g, t / g], form: 'simplest' }], `${h} × 1/${t} = ${E.fracStr(h, t)}.`); } },
    b: { t: 'add rates', g: R => {
      const [A, B, does, it] = crew(R), [a, b] = pickD(R, 2, 12, 2);
      const n = a + b, d = a * b, g = E.gcd(n, d), L = d / E.gcd(a, b);
      return E.num(`${A} ${does} in ${a} hours and ${B} in ${b} hours. What fraction of ${it} do they finish together in one hour?`, [{ frac: [n / g, d / g], form: 'simplest' }],
        `Add the rates, not the times: ${M(`1/${a}+1/${b}=${L / a}/${L}+${L / b}/${L}=${E.fracStr(n, d)}`)}.`); } },
    c: { t: 'set up the equation', g: R => {
      const [A, B, does] = crew(R);
      if (R.bool()) { const [a, b] = pickD(R, 2, 12, 2);
        return E.choice(R, `${A} ${does} alone in ${a} hours; ${B} takes ${b} hours. Which equation gives t, the time working together?`, M(`1/${a}+1/${b}=1/t`), [M(`${a}+${b}=t`), M(`1/${a}+1/${b}=t`), M(`(${a}+${b})/2=t`)], 'Rates add: each hour they do 1/a + 1/b of the job, and together that is 1/t.'); }
      const T = R.int(2, 6), a = T + R.int(1, 8);
      return E.choice(R, `${A} ${does} alone in ${a} hours. With ${B} helping, it takes ${T} hours. Which equation gives x, ${B}'s time alone?`, M(`1/${a}+1/x=1/${T}`), [M(`${a}+x=${T}`), M(`1/${a}-1/x=1/${T}`), M(`1/${a}+1/x=${T}`)], `${A}'s rate plus ${B}'s rate equals the combined rate 1/${T}.`); } },
    d: { t: 'solve and interpret', g: R => {
      const [A, B] = R.pick(PAIRS);
      for (;;) {
        const kind = R.int(0, 2);
        if (kind === 0) { const [a, b] = pickD(R, 2, 20, 2), t = a * b / (a + b); if (!Number.isInteger(t)) continue;
          return E.num(`${A} can do a job in ${a} hours and ${B} in ${b} hours. How many hours does it take them together?`, [{ label: 'hours =', ans: t }], `${M(`1/${a}+1/${b}=${E.fracStr(a + b, a * b)}`)} of the job per hour, so t = 1 ÷ ${E.fracStr(a + b, a * b)} = ${t} hours. That's less than either alone, as it should be.`); }
        if (kind === 1) { const T = R.int(2, 10), a = T + R.int(1, 20), x = a * T / (a - T); if (!Number.isInteger(x)) continue;
          return E.num(`${A} can do a job alone in ${a} hours. Together, ${A} and ${B} take ${T} hours. How long would ${B} take alone?`, [{ label: 'hours =', ans: x }], `${M(`1/x=1/${T}-1/${a}=${E.fracStr(a - T, a * T)}`)}, so x = ${x} hours.`); }
        const a = R.int(2, 10), b = a + R.int(1, 12), t = a * b / (b - a); if (!Number.isInteger(t)) continue;
        return E.num(`A pipe fills a tank in ${a} hours, but a leak empties a full tank in ${b} hours. With both working, how many hours to fill the empty tank?`, [{ label: 'hours =', ans: t }], `The leak's rate subtracts: ${M(`1/${a}-1/${b}=${E.fracStr(b - a, a * b)}`)}, so t = ${t} hours.`);
      } } },
    e: { t: 'one starts, then both', g: R => {
      const [A, B, does] = crew(R); let a, b, h; do { a = R.int(3, 12); b = R.int(2, 12); h = R.int(1, Math.floor(a / 2)); } while (a === b);
      const n = (a - h) * b, d = a + b;
      return E.num(`${A} ${does} alone in ${a} hours; ${B} takes ${b} hours. ${A} works alone for ${h} hour${h > 1 ? 's' : ''}, then ${B} joins. How many more hours until the job is done? Give an exact answer.`, [{ label: 'hours =', ...fld(n, d) }],
        `After ${h} h, ${E.fracStr(a - h, a)} of the job is left. Together they do ${M(`1/${a}+1/${b}=${E.fracStr(a + b, a * b)}`)} per hour, so the time is ${E.pt(E.fracStr(a - h, a))} ÷ ${E.pt(E.fracStr(a + b, a * b))} = ${E.pt(E.fracStr(n, d))} h.`); } },
    f: { t: 'times linked by a gap', g: R => {
      const [x, d, T] = R.pick(GAPS), [A, B, does] = crew(R), askB = R.bool(), hm = hrs(T);
      return E.num(`${B} takes ${d} hour${d > 1 ? 's' : ''} longer than ${A} to finish a job alone. Together they take ${hm}. How long does ${askB ? B : A} take alone?`, [{ label: 'hours =', ans: askB ? x + d : x }],
        `Let ${A} take t hours: ${M(`1/t+1/(t+${d})=${E.fracStr(2 * x + d, x * (x + d))}`)}. Clearing fractions gives a quadratic with roots t = ${x} and t = ${E.pt(E.fracStr(-d * (x + d), 2 * x + d))}. A time can't be negative, so t = ${x}${askB ? `, and ${B} takes ${x} + ${d} = ${x + d} hours` : ' hours'}.`); } },
  });
})(typeof window !== 'undefined' ? window : globalThis);
