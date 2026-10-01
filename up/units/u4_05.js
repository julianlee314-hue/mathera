/* Era IV · Unit IV.5 Exponents & radicals (IV.5.01–IV.5.07) */
(function (G) {
  const E = G.E4, V = E.V, C = E.C, M = s => E.mx(s);
  const nz = (R, lo, hi) => { let v; do v = R.int(lo, hi); while (v === 0); return v; };
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
  const S = (id, name, steps) => E.skill({ id, name, steps });
  const SQF = [2, 3, 5, 6, 7, 10, 11, 13, 14, 15];
  const isSq = n => n >= 0 && Number.isInteger(Math.sqrt(n));
  // sum of surd terms [[coef, radicand]] over an integer d → reduced exact ASCII string
  const sx = (terms, d = 1) => {
    const mp = new Map();
    for (const [c, r] of terms) { const [k, q] = r === 1 ? [c, 1] : E.surd(c, r); mp.set(q, (mp.get(q) || 0) + k); }
    let ts = [...mp.entries()].filter(([, c]) => c !== 0).sort((a, b) => a[0] - b[0]);
    if (d < 0) { d = -d; ts = ts.map(([r, c]) => [r, -c]); }
    const g = ts.reduce((g, [, c]) => gcd(g, c), d) || 1; d /= g; ts = ts.map(([r, c]) => [r, c / g]);
    if (!ts.length) return '0';
    if (ts[0][1] < 0) { const i = ts.findIndex(t => t[1] > 0); if (i > 0) ts.unshift(...ts.splice(i, 1)); }
    const one = ([r, c]) => r === 1 ? String(Math.abs(c)) : `${Math.abs(c) === 1 ? '' : Math.abs(c)}sqrt(${r})`;
    const num = ts.map((t, i) => (t[1] < 0 ? '-' : i ? '+' : '') + one(t)).join('');
    return d === 1 ? num : ts.length > 1 ? `(${num})/${d}` : `${num}/${d}`;
  };
  const rt = (k, m) => m === 1 ? String(k) : `${k === 1 ? '' : k === -1 ? '-' : k}sqrt(${m})`;       // k√m
  const cb = (k, m) => m === 1 ? String(k) : `${k === 1 ? '' : k === -1 ? '-' : k}cbrt(${m})`;       // k∛m
  // MathML nth root; inner is ASCII math
  const inner = s => M(s).replace(/^<math><mrow>/, '').replace(/<\/mrow><\/math>$/, '');
  const nr = (n, s, pre = '') => `<math><mrow>${pre}${n === 2 ? `<msqrt><mrow>${inner(s)}</mrow></msqrt>` : `<mroot><mrow>${inner(s)}</mrow><mn>${n}</mn></mroot>`}</mrow></math>`;
  const RN = { 2: 'square', 3: 'cube', 4: 'fourth', 5: 'fifth', 6: 'sixth' };
  const RS = { 2: '√', 3: '∛', 4: '∜' };
  const rootTxt = (n, v) => (RS[n] || `${n}th root of `) + v;
  const mono = (c, x, y) => { const v = (x ? 'x' + (x > 1 ? '^' + x : '') : '') + (y ? 'y' + (y > 1 ? '^' + y : '') : ''); return v ? (c === 1 ? v : c + v) : String(c); };
  const fr = (n, d) => { const g = gcd(n, d) || 1; if (d < 0) { n = -n; d = -d; } return [n / g, d / g]; };
  const frT = (n, d) => { const [a, b] = fr(n, d); return b === 1 ? String(a) : `${a}/${b}`; };
  const sq = n => n < 0 ? `(${n})` : String(n);

  /* IV.5.01 Simplify radicals */
  S('IV.5.01', 'Simplify radicals', {
    a: { t: 'pull out perfect-square factors', g: R => { const m = R.pick(SQF), k = R.int(2, m > 7 ? 5 : 9), n = k * k * m, c = R.bool(0.25) ? R.int(2, 5) : 1;
      return E.num(`Simplify ${M(rt(c, n))}. Give an exact answer.`, [{ exact: rt(c * k, m), form: 'simplest' }], `${n} = ${k * k} × ${m}, and √${k * k} = ${k}, so ${E.pt(rt(c, n))} = ${E.pt(rt(c * k, m))}.`); } },
    b: { t: 'with variables', g: R => { let m, k, a, b; do { m = R.pick([1, 2, 3, 5, 6, 7]); k = R.int(1, 5); a = R.int(2, 7); b = R.int(0, 5); } while ((m === 1 && a % 2 === 0 && b % 2 === 0) || k * k * m === 1);
      const out = mono(k, a >> 1, b >> 1), inn = mono(m, a % 2, b % 2), rad = mono(k * k * m, a, b);
      return E.num(`Simplify ${M(`sqrt(${rad})`)}, where x, y ≥ 0. Write it as ${M('Asqrt(B)')} with no square factors left in B.`, [{ label: 'A =', expr: out }, { label: 'B =', expr: inn }],
        `Take the square root of each square factor: ${k > 1 ? `√${k * k} = ${k}, ` : ''}${a > 1 ? `√${E.pt('x^' + 2 * (a >> 1))} = ${E.pt(mono(1, a >> 1, 0))}` : ''}${b > 1 ? `, √${E.pt('y^' + 2 * (b >> 1))} = ${E.pt(mono(1, 0, b >> 1))}` : ''}. So ${M(`sqrt(${rad})=${out}sqrt(${inn})`)}.`); } },
    c: { t: 'cube roots', g: R => { const m = R.pick([2, 3, 4, 5, 6, 7, 9, 10]), k = R.int(2, m > 5 ? 3 : 5), s = R.bool(0.3) ? -1 : 1, n = s * k ** 3 * m;
      return E.num(`Simplify ${M(`cbrt(${n})`)}. Write it as ${M('acbrt(b)')} with b as small as possible.`, [{ label: 'a =', ans: s * k }, { label: 'b =', ans: m }], `${n} = ${s < 0 ? '−' : ''}${k ** 3} × ${m}, and ∛${s < 0 ? '(−' + k ** 3 + ')' : k ** 3} = ${s * k}, so ${E.pt(`cbrt(${n})`)} = ${E.pt(cb(s * k, m))}.`); } },
    d: { t: 'nth roots', g: R => { const n = R.pick([4, 4, 5, 6]);
      if (R.bool(0.4)) { const b = R.int(2, n === 4 ? 5 : n === 5 ? 3 : 2), neg = n % 2 === 1 && R.bool(), N = (neg ? -1 : 1) * b ** n;
        return E.num(`Evaluate ${nr(n, n % 2 && N < 0 ? `(${N})` : String(N))}.`, [{ ans: neg ? -b : b }], `${neg ? `(−${b})` : b}${E.pt('^' + n)} = ${N}, so the ${RN[n]} root is ${neg ? -b : b}.`); }
      const k = n === 4 ? R.int(2, 3) : 2, m = R.pick(n === 4 ? [2, 3, 5, 6, 7] : [2, 3, 5]), N = k ** n * m;
      return E.num(`Simplify ${nr(n, String(N))}. Write it as ${M('a')} times the ${RN[n]} root of ${M('b')}, with b as small as possible.`, [{ label: 'a =', ans: k }, { label: 'b =', ans: m }], `${N} = ${k}${E.pt('^' + n)} × ${m} = ${k ** n} × ${m}, and the ${RN[n]} root of ${k ** n} is ${k}. So a = ${k}, b = ${m}.`); } },
    e: { t: 'factor before you multiply', g: R => {
      if (R.bool()) { let A, B, ans; do { A = R.int(6, 75); B = R.int(6, 75); ans = sx([[1, A * B]]); } while (isSq(A) || isSq(B) || A === B || E.surd(1, A * B)[0] < 6 || E.surd(1, A * B)[1] > 30);
        return E.num(`Simplify ${M(`sqrt(${A}*${B})`)}. Give an exact answer.`, [{ exact: ans, form: 'simplest' }],
          `Don't multiply out; pair up factors instead: ${A} × ${B} = ${E.surd(1, A * B)[1] === 1 ? E.surd(1, A * B)[0] + '²' : E.surd(1, A * B)[0] ** 2 + ' × ' + E.surd(1, A * B)[1]}, so the root is ${E.pt(ans)}.`); }
      let b1, b2, e1, e2, co, rad; do { [b1, b2] = R.pick([[2, 3], [2, 5], [3, 5], [2, 7]]); e1 = R.int(3, 9); e2 = R.int(1, 5); co = b1 ** (e1 >> 1) * b2 ** (e2 >> 1); rad = b1 ** (e1 % 2) * b2 ** (e2 % 2); } while (co > 400 || (e1 % 2 === 0 && e2 % 2 === 0 && R.bool(0.7)));
      const ans = rt(co, rad), part = (b, e) => `${E.pt(`sqrt(${b}^${e})`)} = ${E.pt((e >> 1 === 0 ? '' : e >> 1 === 1 ? String(b) : `${b}^${e >> 1}`) + (e % 2 ? `sqrt(${b})` : ''))}`;
      return E.num(`Simplify ${M(`sqrt(${b1}^${e1}*${b2}^${e2})`)}. Give an exact answer.`, [{ exact: ans, form: 'simplest' }],
        `Halve each even exponent: ${part(b1, e1)} and ${part(b2, e2)}. Multiply: ${E.pt(ans)}.`); } },
    f: { t: 'a root inside a root', g: R => { let x, y; do { x = R.int(2, 15); y = R.int(1, 12); } while (x <= y || x + y > 20 || isSq(x * y) || (isSq(x) && isSq(y)));
      const [c, r] = E.surd(2, x * y), inner = rt(c, r), S = x + y, kind = R.int(0, 3), P = `sqrt(${S}+${inner})`, Mi = `sqrt(${S}-${inner})`;
      const q = [P, Mi, `${P}+${Mi}`, `${P}-${Mi}`][kind], ans = [sx([[1, x], [1, y]]), sx([[1, x], [-1, y]]), sx([[2, x]]), sx([[2, y]])][kind];
      return E.num(`Simplify ${M(q)}. Give an exact answer.`, [{ exact: ans, form: 'simplest' }],
        `Try ${M('sqrt(a)+sqrt(b)')}: its square is ${M('a+b+2sqrt(ab)')}. We need a + b = ${S} and ab = ${x * y}, so a = ${x}, b = ${y}. Then ${M(P)} = ${E.pt(sx([[1, x], [1, y]]))} and ${M(Mi)} = ${E.pt(sx([[1, x], [-1, y]]))}${kind > 1 ? `, so the answer is ${E.pt(ans)}` : ''}.`); } },
  });

  /* IV.5.02 Add & subtract radicals */
  const sumTxt = ts => ts.map(([c, r], i) => (c < 0 ? '-' : i ? '+' : '') + (r === 1 ? Math.abs(c) : `${Math.abs(c) === 1 ? '' : Math.abs(c)}sqrt(${r})`)).join('');
  S('IV.5.02', 'Add & subtract radicals', {
    a: { t: 'like radicals', g: R => { const m = R.pick(SQF.slice(0, 7)); let ts, tot; do { ts = [[R.int(1, 9), m], [nz(R, -9, 9), m]]; if (R.bool(0.4)) ts.push([nz(R, -6, 6), m]); if (R.bool(0.25)) ts.splice(1, 0, [nz(R, -9, 9), 1]); tot = ts.filter(t => t[1] === m).reduce((s, t) => s + t[0], 0); } while (tot === 0);
      const ans = sx(ts), cs = ts.filter(t => t[1] === m).map(t => t[0]);
      return E.num(`Simplify ${M(sumTxt(ts))}. Give an exact answer.`, [{ exact: ans, form: 'simplest' }], `Combine the √${m} terms like x-terms: (${cs.join(' + ').replace(/\+ -/g, '− ')})√${m} = ${E.pt(rt(tot, m))}.${ts.some(t => t[1] === 1) ? ' The whole number stays separate.' : ''}`); } },
    b: { t: 'simplify first then combine', g: R => { const m = R.pick([2, 3, 5, 6, 7]); let ks, cs, tot; do { ks = R.sample([1, 2, 3, 4, 5], R.bool(0.3) ? 3 : 2); cs = ks.map((_, i) => i ? R.pick([1, 1, 2, -1, -1, 3]) : R.pick([1, 1, 2, 3])); tot = ks.reduce((s, k, i) => s + k * cs[i], 0); } while (tot === 0 || ks.every(k => k === 1) || ks.filter(k => k > 1).length < 1 || ks.includes(1) && ks.length === 2 && R.bool(0.5));
      const ts = ks.map((k, i) => [cs[i], k * k * m]);
      return E.num(`Simplify ${M(sumTxt(ts))}. Give an exact answer.`, [{ exact: rt(tot, m), form: 'simplest' }], `Simplify each radical first: ${ts.filter((t, i) => ks[i] > 1).map(([c, r]) => `${E.pt(rt(Math.abs(c), r))} = ${E.pt(rt(Math.abs(c) * Math.sqrt(r / m), m))}`).join(', ')}. Then combine: ${E.pt(rt(tot, m))}.`); } },
    c: { t: 'with variables', g: R => { const m = R.pick([2, 3, 5, 6, 7]), kind = R.int(0, 2); let k1, k2, c2, tot; do { k1 = R.int(1, 4); k2 = R.int(1, 5); c2 = R.pick([1, 2, 3, -1, -2]); tot = k1 + c2 * k2; } while (tot === 0 || k1 === k2 || (k1 === 1 && k2 === 1));
      const sg = c2 < 0 ? '-' : '+', a2 = Math.abs(c2) === 1 ? '' : Math.abs(c2);
      let q, ans, why;
      if (kind === 0) { q = `sqrt(${k1 * k1 * m}x)${sg}${a2}sqrt(${k2 * k2 * m}x)`; ans = `${tot === 1 ? '' : tot === -1 ? '-' : tot}sqrt(${m}x)`; why = [k1 > 1 ? `√(${k1 * k1 * m}x) = ${k1}√(${m}x)` : '', k2 > 1 ? `√(${k2 * k2 * m}x) = ${k2}√(${m}x)` : ''].filter(Boolean).join(' and '); }
      else if (kind === 1) { q = `${k1 === 1 ? '' : k1}xsqrt(${m})${sg}${a2}xsqrt(${k2 * k2 * m})`; ans = `${tot === 1 ? '' : tot === -1 ? '-' : tot}xsqrt(${m})`; why = [k1 > 1 ? '' : '', k2 > 1 ? `x√${k2 * k2 * m} = ${k2}x√${m}` : ''].filter(Boolean).join(' and ') || `Both terms are multiples of x√${m}`; }
      else { q = `sqrt(${k1 * k1 * m}x^3)${sg}${a2}xsqrt(${k2 * k2 * m}x)`; ans = `${tot === 1 ? '' : tot === -1 ? '-' : tot}xsqrt(${m}x)`; why = `√(${k1 * k1 * m}x³) = ${k1 === 1 ? '' : k1}x√(${m}x) and x√(${k2 * k2 * m}x) = ${k2 === 1 ? '' : k2}x√(${m}x)`; }
      return E.num(`Simplify ${M(q)}, where x ≥ 0.`, [{ expr: ans, form: 'simplified' }], `${why}. They are like radicals, so combine: ${M(ans)}.`); } },
    d: { t: 'spot unlike radicals', g: R => { const yes = R.bool(), m1 = R.pick([2, 3, 5, 6, 7]); let m2; do m2 = R.pick([2, 3, 5, 6, 7]); while (!yes && m2 === m1); if (yes) m2 = m1;
      let k1, k2; do { k1 = R.int(1, 5); k2 = R.int(1, 5); } while (k1 * k1 * m1 === k2 * k2 * m2 || k1 === 1 && k2 === 1);
      const op = R.pick(['+', '-']), r1 = k1 * k1 * m1, r2 = k2 * k2 * m2, tot = op === '+' ? k1 + k2 : k1 - k2;
      return E.tf(`Can ${M(`sqrt(${r1})${op}sqrt(${r2})`)} be written as a single radical term?`, yes,
        `√${r1} = ${E.pt(rt(k1, m1))} and √${r2} = ${E.pt(rt(k2, m2))}. ${yes ? `Both are multiples of √${m1}, so they combine to ${E.pt(rt(tot, m1))}.`.replace(' 0√' + m1, ' 0') : `√${m1} and √${m2} are unlike radicals, so they can't combine.`}`, { choices: ['Yes', 'No'] }); } },
  });

  /* IV.5.03 Multiply radicals */
  S('IV.5.03', 'Multiply radicals', {
    a: { t: '√a·√b = √ab', g: R => { let a, b; do { a = R.int(2, 15); b = R.int(2, 15); } while (isSq(a) || isSq(b) || a === b && R.bool(0.7)); const c1 = R.bool(0.35) ? R.int(2, 5) : 1, c2 = R.bool(0.35) ? R.int(2, 5) : 1;
      const ans = sx([[c1 * c2, a * b]]);
      return E.num(`Multiply and simplify ${M(rt(c1, a))} · ${M(rt(c2, b))}. Give an exact answer.`, [{ exact: ans, form: 'simplest' }], `Multiply outside numbers and inside numbers: ${E.pt(rt(c1 * c2, a * b))}${rt(c1 * c2, a * b) === ans ? ', which is already simplest' : ' = ' + E.pt(ans)}.`); } },
    b: { t: 'distribute', g: R => { let a, b; do { a = R.pick([2, 3, 5, 6, 7]); b = R.pick([2, 3, 5, 6, 7, 8, 10, 12]); } while (a === b); const c = nz(R, -7, 7), k = R.pick([1, 1, 2, 3]);
      const q = `${rt(k, a)}(sqrt(${b})${c > 0 ? '+' : ''}${c})`, ans = sx([[k, a * b], [k * c, a]]);
      return E.num(`Expand and simplify ${M(q)}. Give an exact answer.`, [{ exact: ans, form: 'simplest' }], (() => { const raw = `${E.pt(rt(k, a * b))} ${c * k > 0 ? '+' : '−'} ${E.pt(rt(Math.abs(c * k), a))}`; return `Multiply each term by ${E.pt(rt(k, a))}: ${raw}${raw === E.pt(ans) ? ', which is already simplest' : ' = ' + E.pt(ans)}.`; })()); } },
    c: { t: 'FOIL with radicals', g: R => { const m = R.pick([2, 3, 5, 6, 7]); let p, q, r, s; if (R.bool(0.3)) { p = R.int(1, 5); q = nz(R, -3, 3); r = p; s = q; } else do { p = R.int(1, 6); q = nz(R, -3, 3); r = nz(R, -6, 6); s = nz(R, -3, 3); } while (p * s + q * r === 0);
      const f = (x, y) => `(${x}${y > 0 ? '+' : '-'}${rt(Math.abs(y), m)})`, same = p === r && q === s, qs = same ? f(p, q) + '^2' : f(p, q) + f(r, s);
      const ra = p * r + q * s * m, rb = p * s + q * r, ans = sx([[ra, 1], [rb, m]]);
      return E.num(`Expand and simplify ${M(qs)}. Give an exact answer.`, [{ exact: ans, form: 'simplest' }], `FOIL: ${p * r} ${rb >= 0 ? '+' : '−'} ${Math.abs(rb)}√${m} + ${sq(q * s)}·${m}${same ? ' (keep the middle term)' : ''}, which is ${E.pt(ans)}.`.replace('+ (-', '− (').replace(/\(\d+\)·/, x => x.slice(1).replace(')', '')).replace('+ -', '− ')); } },
    d: { t: 'conjugate products', g: R => { const kind = R.int(0, 2);
      if (kind === 0) { const p = R.int(1, 9), q = R.int(1, 3), m = R.pick([2, 3, 5, 6, 7, 10, 11]), s = R.bool();
        const A = `(${p}+${rt(q, m)})`, B = `(${p}-${rt(q, m)})`;
        return E.num(`Multiply ${M(s ? A + B : B + A)}.`, [{ ans: p * p - q * q * m }], `Conjugates give a difference of squares: ${p}² − (${E.pt(rt(q, m))})² = ${p * p} − ${q * q * m} = ${p * p - q * q * m}.`); }
      if (kind === 1) { let a, b; do { a = R.pick([2, 3, 5, 6, 7, 10, 11, 13]); b = R.pick([2, 3, 5, 6, 7, 10, 11, 13]); } while (a === b);
        return E.num(`Multiply ${M(`(sqrt(${a})+sqrt(${b}))(sqrt(${a})-sqrt(${b}))`)}.`, [{ ans: a - b }], `(√a + √b)(√a − √b) = a − b = ${a} − ${b} = ${a - b}. The middle terms cancel.`); }
      const p = R.int(2, 9);
      return E.num(`Multiply ${M(`(sqrt(x)+${p})(sqrt(x)-${p})`)}, where x ≥ 0.`, [{ expr: `x-${p * p}`, form: 'expanded' }], `The middle terms cancel: (√x)² − ${p}² = ${E.pt(`x-${p * p}`)}.`); } },
  });

  /* IV.5.04 Rationalize denominators */
  S('IV.5.04', 'Rationalize denominators', {
    a: { t: 'single square root', g: R => { let m; do m = R.int(2, 20); while (isSq(m)); const a = R.int(1, 12), b = R.bool(0.3) ? R.int(2, 4) : 1, den = rt(b, m);
      const ans = sx([[a, m]], b * m);
      return E.num(`Rationalize the denominator: ${M(`${a}/${b === 1 ? den : '(' + den + ')'}`)}. Give an exact, simplified answer.`, [{ exact: ans, form: 'simplest' }], `Multiply top and bottom by √${m}: ${M(`${rt(a, m)}/${b * m}`)} = ${E.pt(ans)}.`); } },
    b: { t: 'cube root denominators', g: R => { const [m, x, p] = R.pick([[2, 4, 2], [3, 9, 3], [5, 25, 5], [4, 2, 2], [9, 3, 3], [25, 5, 5], [7, 49, 7], [6, 36, 6]]), a = R.int(1, 12);
      const g = gcd(a, p), co = a / g, d = p / g, ans = `${co === 1 ? '' : co}cbrt(${x})${d > 1 ? '/' + d : ''}`;
      return E.num(`Rationalize the denominator: ${M(`${a}/cbrt(${m})`)}. Give an exact, simplified answer.`, [{ exact: ans, form: 'simplest' }], `Multiply top and bottom by ∛${x}, since ∛${m} · ∛${x} = ∛${m * x} = ${p}: ${M(`${a}cbrt(${x})/${p}`)}${g > 1 ? ' = ' + E.pt(ans) : ''}.`); } },
    c: { t: 'binomial with conjugate', g: R => { let a, b, c, m, D; do { m = R.pick([2, 3, 5, 6, 7]); b = R.int(1, 6); c = R.pick([1, 1, 2]); D = b * b - c * c * m; a = R.bool(0.5) ? Math.abs(D) * R.int(1, 3) : R.int(1, 9); } while (D === 0);
      const sgn = R.bool(), den = `${b}${sgn ? '+' : '-'}${rt(c, m)}`, conj = `${b}${sgn ? '-' : '+'}${rt(c, m)}`, ans = sx([[a * b, 1], [(sgn ? -1 : 1) * a * c, m]], D);
      return E.num(`Rationalize the denominator: ${M(`${a}/(${den})`)}. Give an exact, simplified answer.`, [{ exact: ans, form: 'simplest' }], `Multiply top and bottom by the conjugate ${E.pt(conj)}. The bottom becomes ${b}² − ${c * c * m} = ${D}, giving ${E.pt(ans)}.`); } },
    d: { t: 'simplify the result', g: R => { const kind = R.int(0, 2);
      if (kind === 0) { let m, n; do { m = R.pick([2, 3, 5, 6, 7, 10, 11]); n = R.pick([2, 3, 5, 6, 7, 10, 11]); } while (m <= n); const k = (m - n) * R.int(1, 3) * (R.bool(0.7) ? 1 : 0) || R.int(1, 5);
        const ans = sx([[k, m], [-k, n]], m - n);
        return E.num(`Rationalize and simplify ${M(`${k}/(sqrt(${m})+sqrt(${n}))`)}. Give an exact answer.`, [{ exact: ans, form: 'simplest' }], `Multiply by ${E.pt(`sqrt(${m})-sqrt(${n})`)} over itself: the bottom is ${m} − ${n} = ${m - n}, so the result is ${E.pt(ans)}.`); }
      if (kind === 1) { let m, n; do { m = R.pick([2, 3, 5, 6, 7, 10]); n = R.pick([2, 3, 5, 6, 7, 10]); } while (m === n); const ans = sx([[m + n, 1], [2, m * n]], m - n);
        return E.num(`Rationalize and simplify ${M(`(sqrt(${m})+sqrt(${n}))/(sqrt(${m})-sqrt(${n}))`)}. Give an exact answer.`, [{ exact: ans, form: 'simplest' }], `Multiply by ${E.pt(`sqrt(${m})+sqrt(${n})`)} over itself: the top is ${m} + 2√${m * n} + ${n}, the bottom is ${m} − ${n} = ${m - n}. Simplified: ${E.pt(ans)}.`); }
      let a, m; do { a = R.int(1, 6); m = R.pick([2, 3, 5, 6, 7, 10, 11]); } while (a * a === m);
      const ans = sx([[a * a + m, 1], [2 * a, m]], a * a - m);
      return E.num(`Rationalize and simplify ${M(`(${a}+sqrt(${m}))/(${a}-sqrt(${m}))`)}. Give an exact answer.`, [{ exact: ans, form: 'simplest' }], `Multiply by ${E.pt(`${a}+sqrt(${m})`)} over itself: the top is ${a * a + m} + ${2 * a}√${m}, the bottom is ${a * a} − ${m} = ${a * a - m}. Simplified: ${E.pt(ans)}.`); } },
    e: { t: 'coefficients on the roots, or two fractions', g: R => {
      if (R.bool()) { let m, n, a, b, D; do { m = R.pick([2, 3, 5, 6, 7]); n = R.pick([2, 3, 5, 6, 7]); a = R.int(1, 3); b = R.int(1, 3); D = a * a * m - b * b * n; } while (m === n || D === 0 || (a === 1 && b === 1));
        const s = R.bool() ? 1 : -1, k = R.bool(0.4) ? Math.abs(D) : R.int(1, 6), den = `${rt(a, m)}${s > 0 ? '+' : '-'}${rt(b, n)}`, conj = `${rt(a, m)}${s > 0 ? '-' : '+'}${rt(b, n)}`, ans = sx([[k * a, m], [-s * k * b, n]], D);
        return E.num(`Rationalize the denominator: ${M(`${k}/(${den})`)}. Give an exact, simplified answer.`, [{ exact: ans, form: 'simplest' }],
          `Multiply top and bottom by ${E.pt(conj)}. The bottom is (${E.pt(rt(a, m))})² − (${E.pt(rt(b, n))})² = ${a * a * m} − ${b * b * n} = ${D}, giving ${E.pt(ans)}.`); }
      let p, m; do { p = R.int(1, 5); m = R.pick([2, 3, 5, 6, 7, 10, 11]); } while (p * p === m); const D = p * p - m, plus = R.bool(), ans = plus ? E.fracStr(2 * p, D) : sx([[-2, m]], D);
      return E.num(`Simplify ${M(`1/(${p}+sqrt(${m}))${plus ? '+' : '-'}1/(${p}-sqrt(${m}))`)}. Give an exact, simplified answer.`, [{ exact: ans, form: 'simplest' }],
        `Use the common denominator (${p} + √${m})(${p} − √${m}) = ${p * p} − ${m} = ${D}. The top is ${plus ? `(${p} − √${m}) + (${p} + √${m}) = ${2 * p}` : `(${p} − √${m}) − (${p} + √${m}) = −2√${m}`}, so the answer is ${E.pt(ans)}.`); } },
    f: { t: 'cube-root and three-term denominators', g: R => { const kind = R.int(0, 2);
      if (kind === 0) { const CB2 = { 2: [1, 4], 3: [1, 9], 4: [2, 2], 5: [1, 25], 6: [1, 36], 7: [1, 49], 9: [3, 3] }, m = +R.pick(Object.keys(CB2)), s = R.bool() ? 1 : -1, D = m + s, [c1, r1] = CB2[m];
        const k = R.pick([1, 1, 2, 3, D]), g = gcd(gcd(k * c1, k), D), co = [k * c1 / g, -s * k / g, k / g], dd = D / g;
        const num = `${co[0] === 1 ? '' : co[0]}cbrt(${r1})${co[1] > 0 ? '+' : '-'}${Math.abs(co[1]) === 1 ? '' : Math.abs(co[1])}cbrt(${m})+${co[2]}`, ans = dd === 1 ? num : `(${num})/${dd}`;
        const mult = `${E.pt(`cbrt(${m * m})`)} ${s > 0 ? '−' : '+'} ∛${m} + 1`;
        return E.num(`Rationalize the denominator: ${M(`${k}/(cbrt(${m})${s > 0 ? '+' : '-'}1)`)}. Give an exact answer.`, [{ exact: ans, form: 'simplest' }],
          `Use ${s > 0 ? 'a³ + b³ = (a + b)(a² − ab + b²)' : 'a³ − b³ = (a − b)(a² + ab + b²)'} with a = ∛${m}, b = 1: multiply top and bottom by ${mult}. The bottom becomes ${m} ${s > 0 ? '+' : '−'} 1 = ${D}, giving ${E.pt(ans)}.`); }
      if (kind === 1) { const [a, b, c] = R.pick([[1, 2, 3], [1, 5, 6], [1, 6, 7], [2, 3, 5], [1, 10, 11], [2, 5, 7], [3, 7, 10], [1, 13, 14], [1, 14, 15], [2, 13, 15], [5, 6, 11], [3, 10, 13]]);
        const A = a === 1 ? '1' : `sqrt(${a})`, ans = sx([[a, b], [b, a], [-1, a * b * c]], 2 * a * b);
        return E.num(`Rationalize the denominator: ${M(`1/(${A}+sqrt(${b})+sqrt(${c}))`)}. Give an exact, simplified answer.`, [{ exact: ans, form: 'simplest' }],
          `Treat ${E.pt(A)} + √${b} as one block and multiply by (${E.pt(A)} + √${b} − √${c}). The bottom becomes (${E.pt(A)} + √${b})² − ${c} = ${E.pt(rt(2, a * b))}, since ${a} + ${b} = ${c}. Then multiply by √${a * b}: ${E.pt(ans)}.`); }
      const n = R.bool() ? R.int(3, 10) ** 2 : R.int(5, 60), ans = sx([[1, n], [-1, 1]]);
      return E.num(`Find the exact value of ${M('1/(1+sqrt(2))+1/(sqrt(2)+sqrt(3))')} + ⋯ + ${M(`1/(sqrt(${n - 1})+sqrt(${n}))`)}.`, [{ exact: ans, form: 'simplest' }],
        `Rationalize one term: ${M('1/(sqrt(k)+sqrt(k+1))=sqrt(k+1)-sqrt(k)')}. The sum telescopes: (√2 − 1) + (√3 − √2) + ⋯ + (√${n} − √${n - 1}) = √${n} − 1 = ${E.pt(ans)}.`); } },
  });

  /* IV.5.05 Rational exponents */
  const BASES = { 2: [2, 15], 3: [2, 10], 4: [2, 6], 5: [2, 4], 6: [2, 3] };
  S('IV.5.05', 'Rational exponents', {
    a: { t: 'a^(1/n) as a root', g: R => { const n = R.pick([2, 2, 3, 3, 4, 5, 6]), b = R.int(...BASES[n]), neg = n % 2 === 1 && R.bool(0.3), N = (neg ? -1 : 1) * b ** n;
      return E.num(`Evaluate ${M(`${neg ? '(' + N + ')' : N}^(1/${n})`)}.`, [{ ans: neg ? -b : b }], `The exponent 1/${n} means the ${RN[n]} root: ${neg ? `(−${b})` : b}${E.pt('^' + n)} = ${N}, so the answer is ${neg ? -b : b}.`); } },
    b: { t: 'a^(m/n)', g: R => { let n, b, m; do { n = R.pick([2, 3, 3, 4, 5]); b = R.int(2, n === 2 ? 9 : n === 3 ? 5 : 3); m = R.int(2, 5); } while (gcd(m, n) !== 1 || b ** m > 1000); const N = b ** n, neg = R.bool(0.25);
      return E.num(`Evaluate ${M(`${N}^(${neg ? '-' : ''}${m}/${n})`)}.`, [neg ? { frac: [1, b ** m], form: 'any' } : { ans: b ** m }], `The denominator is a root: ${RN[n]} root of ${N} is ${b}. The numerator is a power: ${b}${E.pt('^' + m)} = ${b ** m}${neg ? `. The negative exponent means the reciprocal, 1/${b ** m}.` : '.'} It is not ${N} × ${m}/${n}.`); } },
    c: { t: 'convert both ways', g: R => { let n, m; do { n = R.pick([2, 3, 4, 5, 6]); m = R.int(1, 7); } while (m % n === 0 || (n === 2 && m === 1));
      if (R.bool(0.55)) { const [p, q] = fr(m, n);
        return E.num(`Write ${nr(n, m === 1 ? 'x' : `x^${m}`)} as a power of x. What is the exponent?`, [{ label: 'exponent =', frac: [p, q], form: 'any' }], `The index of the root goes in the denominator: ${M(`x^(${m}/${n})`)}${p !== m ? ` = ${M(`x^(${p}/${q})`)}` : ''}.`); }
      let mm = m; if (mm === 1) mm = n + 1; const [p, q] = fr(mm, n);
      const right = nr(q, `x^${p}`), wrong = [nr(p, `x^${q}`), E.pt(`x^${p}/${q}`), nr(q, 'x', `<mn>${p}</mn>`)];
      return E.choice(R, `Which is the same as ${M(`x^(${p}/${q})`)}?`, right, wrong, `The denominator ${q} is the root, the numerator ${p} is the power: the ${RN[q]} root of ${E.pt('x^' + p)}.`); } },
    d: { t: 'simplify with exponent rules', g: R => { const kind = R.int(0, 3), F = () => { const d = R.pick([2, 3, 4, 5, 6]); let n; do n = nz(R, -5, 7); while (gcd(n, d) !== 1); return [n, d]; };
      const pw = ([n, d]) => d === 1 ? String(n) : `${n}/${d}`;
      if (kind === 3) { const n = R.pick([2, 3]), b = R.int(2, n === 2 ? 5 : 3), m = R.int(1, n === 2 ? 3 : 2), k = n * R.int(1, 4) + (R.bool(0.4) ? 1 : 0), [ep, eq] = fr(k * m, n);
        return E.num(`Simplify ${M(`(${b ** n}x^${k})^(${m}/${n})`)}, where x ≥ 0, to the form ${M('cx^k')}.`, [{ label: 'c =', ans: b ** m }, { label: 'k =', frac: [ep, eq], form: 'any' }],
          `Raise each factor: ${b ** n}^(${m}/${n}) = ${b ** m}, and ${k} × ${m}/${n} = ${frT(k * m, n)}. So ${M(`${b ** m}x^(${frT(k * m, n)})`)}.`); }
      let A, B, res, q, why; do { A = F(); B = F(); if (kind === 0) res = fr(A[0] * B[1] + B[0] * A[1], A[1] * B[1]); else if (kind === 1) res = fr(A[0] * B[0], A[1] * B[1]); else res = fr(A[0] * B[1] - B[0] * A[1], A[1] * B[1]); } while (res[0] === 0 || (kind === 1 && A[0] < 0 && B[0] < 0));
      if (kind === 0) { q = null; why = `Multiplying adds exponents: ${pw(A)} + ${pw(B)} = ${pw(res)}`.replace('+ -', '− '); }
      else if (kind === 1) { q = `(x^(${pw(A)}))^(${pw(B)})`; why = `A power of a power multiplies exponents: ${pw(A)} × ${B[0] < 0 ? '(' + pw(B) + ')' : pw(B)} = ${pw(res)}`; }
      else { q = `x^(${pw(A)})/x^(${pw(B)})`; why = `Dividing subtracts exponents: ${pw(A)} − ${B[0] < 0 ? '(' + pw(B) + ')' : pw(B)} = ${pw(res)}`; }
      return E.num(`Simplify ${q ? M(q) : M(`x^(${pw(A)})`) + ' · ' + M(`x^(${pw(B)})`)} to a single power ${M('x^k')}. What is k?`, [{ label: 'k =', frac: res, form: 'any' }], `${why}.`); } },
    e: { t: 'solve with a fractional power', g: R => { let n, m, b; do { n = R.pick([2, 3, 3, 4, 5]); m = R.pick([2, 3, 4, 5]); b = R.int(2, 5); } while (gcd(m, n) !== 1 || m === n || b ** n > 1024 || b ** m > 1024);
      const x = b ** n, N = b ** m, neg = n % 2 === 1 && m % 2 === 1 && R.bool(0.4), inv = R.bool(0.25), both = n % 2 === 1 && m % 2 === 0;
      const sol = n % 2 === 0 ? [String(x)] : both ? [String(x), String(-x)] : [String(neg ? -x : x)], rhs = inv ? `${neg ? '-' : ''}1/${N}` : String(neg ? -N : N);
      const why = n % 2 === 0 ? `The ${RN[n]} root of x must be ${b} (it can't be negative), so x = ${b}${E.pt('^' + n)} = ${x}.`
        : both ? `The power ${m} is even, so the ${RN[n]} root of x is ${b} or −${b}. So x = ±${x}.` : `So the ${RN[n]} root of x is ${neg ? -b : b}, and x = ${neg ? `(−${b})` : b}${E.pt('^' + n)} = ${neg ? -x : x}.`;
      return E.num(`Solve ${M(`x^(${inv ? '-' : ''}${m}/${n})=${rhs}`)}. Give every real solution.`, [{ label: 'x =', set: sol }], `${inv ? `Flip both sides: ${M(`x^(${m}/${n})=${neg ? -N : N}`)}. ` : ''}Read it as (${RN[n]} root of x)${E.pt('^' + m)} = ${neg ? -N : N}. ${why}`); } },
    f: { t: 'powers from a given power, or which is largest', g: R => {
      if (R.bool(0.6)) { const j = R.pick([2, 2, 3]); let b, k, N, ans;
        do { b = R.pick([2, 3]); k = R.pick(j === 2 ? [3, 4, 5] : [2, 4, 5]);
          if (j === 2) { N = R.pick([2, 3, 5, 6, 7, 10, 4, 9, 16, 25]); const s = Math.round(Math.sqrt(N)); ans = s * s === N ? String(s ** k) : k % 2 ? rt(N ** ((k - 1) / 2), N) : String(N ** (k / 2)); }
          else { N = R.pick([2, 3, 5, 6, 7, 8, 27, 64]); const s = Math.round(Math.cbrt(N)); ans = s ** 3 === N ? String(s ** k) : cb(N ** Math.floor(k / 3), N ** (k % 3)); }
        } while (b ** k > 243 || E.value(ans)[0] > 1100 || k === j || [1, 2, 3, 4, 5, 6].some(t => b ** t === N));
        const B1 = b ** j, B2 = b ** k;
        return E.num(`If ${M(`${B1}^x=${N}`)}, what is ${M(`${B2}^x`)}? Give an exact answer.`, [{ exact: ans, form: 'simplest' }],
          `${B1}${E.pt('^x')} = (${b}${E.pt('^x')})${E.pt('^' + j)} = ${N}, so ${b}${E.pt('^x')} = ${M(`${N}^(1/${j})`)}. Then ${B2}${E.pt('^x')} = (${b}${E.pt('^x')})${E.pt('^' + k)} = ${M(`${N}^(${frT(k, j)})`)} = ${E.pt(ans)}.`); }
      const CAND = [[2, 2], [3, 3], [5, 5], [6, 6], [2, 3], [3, 4], [5, 3], [3, 2], [7, 4], [4, 3], [10, 5]], pick = R.sample(CAND, 4).map(([a, p]) => ({ a, p, v: a ** (1 / p) })), big = R.bool();
      const ord = pick.slice().sort((u, v) => big ? v.v - u.v : u.v - v.v), [w, u] = ord, L = w.p * u.p / gcd(w.p, u.p), T = z => M(`${z.a}^(1/${z.p})`);
      return E.choice(R, `Which number is the ${big ? 'largest' : 'smallest'}?`, T(w), ord.slice(1).map(T),
        `Raise to a common power to clear the roots. For the two ${big ? 'largest' : 'smallest'}, ${T(w)} and ${T(u)}, the power ${L} gives ${w.a ** (L / w.p)} and ${u.a ** (L / u.p)}. So ${T(w)} is the ${big ? 'largest' : 'smallest'}.`); } },
  });

  /* IV.5.06 Radical equations */
  S('IV.5.06', 'Radical equations', {
    a: { t: 'isolate the radical', g: R => { const kind = R.int(0, 2), a = R.int(-9, 9), b = nz(R, -12, 12), v = R.int(kind === 2 ? -5 : 1, 9), k = kind === 1 ? R.int(2, 5) : 1;
      const rad = kind === 2 ? `cbrt(${E.poly([1, a])})` : `sqrt(${E.poly([1, a])})`, lhs = `${k === 1 ? '' : k}${rad}${b > 0 ? '+' : ''}${b}`, rhs = k * v + b;
      return E.num(`In ${M(`${lhs}=${rhs}`)}, isolate the radical. What does ${M(rad)} equal?`, [{ label: `${E.pt(rad)} =`, ans: v }], `${b > 0 ? 'Subtract' : 'Add'} ${Math.abs(b)}${k > 1 ? `, then divide by ${k}` : ''}: ${M(`${rad}=${v}`)}. Do this before squaring or cubing.`); } },
    b: { t: 'raise both sides', g: R => { const n = R.pick([2, 3]), p = R.pick([1, 1, 2, 3, -1]), x0 = R.int(-8, 10), r = n === 2 ? R.int(0, 7) : R.int(-4, 4), q = r ** n - p * x0;
      const rad = `${n === 2 ? 'sqrt' : 'cbrt'}(${E.poly([p, q])})`;
      return E.num(`Solve ${M(`${rad}=${r}`)}. What power do you raise both sides to, and what is x?`, [{ label: 'power =', ans: n }, { label: 'x =', ans: x0 }], `${n === 2 ? 'Square' : 'Cube'} both sides: ${M(`${E.poly([p, q])}=${r ** n}`)}, so x = ${x0}.`); } },
    c: { t: 'solve', g: R => { const kind = R.int(0, 2);
      if (kind === 2) { const v = R.int(0, 30); let p, r; do { p = R.int(1, 5); r = R.int(1, 5); } while (p === r); const x0 = R.int(-5, 8), q = v - p * x0, s = v - r * x0;
        return E.num(`Solve ${M(`sqrt(${E.poly([p, q])})=sqrt(${E.poly([r, s])})`)}.`, [{ label: 'x =', ans: x0 }], `Square both sides: ${M(`${E.poly([p, q])}=${E.poly([r, s])}`)}, so x = ${x0}. Check: both radicands equal ${v}, which is not negative.`); }
      const p = R.pick([1, 2, 3, 4]), x0 = R.int(-6, 12), r = R.int(1, 8), q = r * r - p * x0, k = kind === 1 ? R.int(2, 4) : 1, c = nz(R, -9, 9), rhs = k * r + c, rad = `sqrt(${E.poly([p, q])})`;
      return E.num(`Solve ${M(`${k === 1 ? '' : k}${rad}${c > 0 ? '+' : ''}${c}=${rhs}`)}.`, [{ label: 'x =', ans: x0 }], `Isolate: ${M(`${rad}=${r}`)}. Square: ${M(`${E.poly([p, q])}=${r * r}`)}, so x = ${x0}.`); } },
    d: { t: 'check for extraneous roots', g: R => {
      if (R.bool(0.2)) { const a = R.int(-9, 9), c = R.int(1, 9), d = c - R.int(1, 8);
        return E.num(`Solve ${M(`sqrt(${E.poly([1, a])})+${c}=${d}`)}. Type "no solution" if there is none.`, [{ label: 'x =', set: [] }], `Isolating gives ${M(`sqrt(${E.poly([1, a])})=${d - c}`)}. A square root is never negative, so there is no solution. (Squaring would give x = ${(d - c) ** 2 - a}, which fails the check.)`); }
      const u = R.int(1, 5), v = 1 - u, b = R.int(-4, 4), r1 = u - b, r2 = v - b, a = b * b - r1 * r2;
      const rhs = E.poly([1, b]), good = u === 1 ? [String(r1), String(r2)] : [String(r1)];
      return E.num(`Solve ${M(`sqrt(${E.poly([1, a])})=${rhs}`)}. Check each answer, and type "no solution" if none work.`, [{ label: 'x =', set: good }],
        `Square: ${M(`${E.poly([1, a])}=(${rhs})^2`)}, so ${M(E.poly([1, 2 * b - 1, b * b - a]) + '=0')}, giving x = ${r1} or x = ${r2}. ${u === 1 ? `Both check: the right side is ${u} and ${v}, never negative.` : `At x = ${r2} the right side is ${v}, negative, so reject it. Only x = ${r1} works.`}`); } },
    e: { t: 'two radicals', g: R => {
      if (R.bool(0.2)) { let a, b; do { a = R.int(2, 20); b = R.int(2, 6); } while (b * b <= a || isSq(a));
        return E.num(`Solve ${M(`sqrt(x+${a})-sqrt(x)=${b}`)}. Type "no solution" if there is none.`, [{ label: 'x =', set: [] }],
          `Move √x over and square: x + ${a} = ${b * b} + ${2 * b}√x + x, so ${2 * b}√x = ${a - b * b}. A square root can't be negative, so there is no solution.`); }
      const t = R.int(1, 7), s = t + R.int(1, 5), a = s * s - t * t, plus = R.bool(), c = plus ? s + t : s - t;
      return E.num(`Solve ${M(`sqrt(x+${a})${plus ? '+' : '-'}sqrt(x)=${c}`)}. Type "no solution" if there is none.`, [{ label: 'x =', set: [String(t * t)] }],
        `Isolate one root: ${M(`sqrt(x+${a})=${c}${plus ? '-' : '+'}sqrt(x)`)}. Square: x + ${a} = ${c * c} ${plus ? '−' : '+'} ${2 * c}√x + x, so ${2 * c}√x = ${Math.abs(c * c - a)}, √x = ${t} and x = ${t * t}. It checks.`); } },
    f: { t: 'a quadratic in disguise', g: R => {
      if (R.bool(0.6)) { let p, q; do { p = R.int(1, 6); q = R.bool(0.6) ? R.int(1, 6) : -R.int(1, 5); } while (p === q || p + q === 0);
        const S = p + q, P = p * q, eq = `x${S > 0 ? '-' : '+'}${Math.abs(S) === 1 ? '' : Math.abs(S)}sqrt(x)${P > 0 ? '+' : '-'}${Math.abs(P)}=0`, sol = [p, q].filter(v => v > 0).map(v => String(v * v));
        return E.num(`Solve ${M(eq)}. Type "no solution" if there is none.`, [{ label: 'x =', set: sol }],
          `Let u = √x, so x = u²: ${M(E.poly([1, -S, P]).replace(/x/g, 'u') + '=0')}, so u = ${p} or u = ${q}. ${q > 0 ? `Both are fine, so x = ${p * p} or x = ${q * q}.` : `But u = √x can't be ${q}, so only u = ${p}: x = ${p * p}.`}`); }
      let p, q; do { p = nz(R, -4, 4); q = nz(R, -4, 4); } while (p === q || p + q === 0);
      const S = p + q, P = p * q, eq = `x^(2/3)${S > 0 ? '-' : '+'}${Math.abs(S) === 1 ? '' : Math.abs(S)}x^(1/3)${P > 0 ? '+' : '-'}${Math.abs(P)}=0`;
      return E.num(`Solve ${M(eq)}.`, [{ label: 'x =', set: [String(p ** 3), String(q ** 3)] }],
        `Let u = ${M('x^(1/3)')}, so ${M('x^(2/3)=u^2')}: ${M(E.poly([1, -S, P]).replace(/x/g, 'u') + '=0')}, so u = ${p} or u = ${q}. Cube roots can be negative, so both work: x = ${p ** 3} or x = ${q ** 3}.`); } },
  });

  /* IV.5.07 Same-base exponent equations */
  const FAM = [[2, [2, 4, 8, 16, 32]], [3, [3, 9, 27, 81]], [5, [5, 25, 125]], [10, [10, 100, 1000]], [6, [6, 36, 216]], [7, [7, 49, 343]]];
  const lg = (b, N) => Math.round(Math.log(N) / Math.log(b));
  const ex = (p, q) => E.poly([p, q]);
  const pe = (B, e) => /^[\dx]+$/.test(e) && !/x.*x/.test(e) && e.length < 3 ? `${B}^${e}` : `${B}^(${e})`;
  const sameBase = R => { let b, P, j, k, p, q, r, s, num, den, two; do { [b, P] = R.pick(FAM.slice(0, 4)); two = R.sample(P, 2); j = lg(b, two[0]); k = lg(b, two[1]); p = R.pick([1, 1, 2]); q = R.int(-4, 4); r = R.pick([1, 1, 2, -1]); s = R.int(-4, 4); num = k * s - j * q; den = j * p - k * r; } while (den === 0 || two[0] === two[1]);
    const B1 = b ** j, B2 = b ** k; return { b, j, k, p, q, r, s, B1, B2, num, den, eq: `${pe(B1, ex(p, q))}=${pe(B2, ex(r, s))}` }; };
  S('IV.5.07', 'Same-base exponent equations', {
    a: { t: 'rewrite with a common base', g: R => { const [b, P] = R.pick(FAM), mode = R.int(0, 2), N = R.pick(P.slice(1)), j = lg(b, N);
      if (mode === 0) { const e = R.int(2, 5), recip = R.bool(0.3);
        return E.num(`Write ${M(recip ? `1/${N}^${e}` : `${N}^${e}`)} as a power of ${b}: ${M(`${b}^□`)}. What goes in the box?`, [{ ans: (recip ? -1 : 1) * j * e }], `${N} = ${b}${E.pt('^' + j)}, so ${recip ? '1/' : ''}${N}${E.pt('^' + e)} = ${b}${E.pt('^(' + (recip ? '-' : '') + j * e + ')')}. Powers of powers multiply exponents${recip ? ', and a reciprocal makes the exponent negative' : ''}.`); }
      if (mode === 1) { const recip = R.bool(); const n = R.pick(P);  const jj = lg(b, n);
        return E.num(`Write ${M(recip ? `1/${n}` : String(n))} as a power of ${b}: ${M(`${b}^□`)}. What goes in the box?`, [{ ans: (recip ? -1 : 1) * jj }], `${n} = ${b}${E.pt('^' + jj)}${recip ? `, so 1/${n} = ${b}${E.pt('^(-' + jj + ')')}` : ''}.`); }
      const p = R.pick([1, 2, 3]), q = nz(R, -4, 4), e = ex(p, q), ans = ex(j * p, j * q);
      return E.num(`Write ${M(pe(N, e))} as a power of ${b}. What is the exponent?`, [{ label: 'exponent =', expr: ans }], `${N} = ${b}${E.pt('^' + j)}, so the exponent is ${j}(${E.pt(e)}) = ${E.pt(ans)}.`); } },
    b: { t: 'set exponents equal', g: R => {
      if (R.bool()) { const [b, P] = R.pick(FAM.slice(0, 4)), N = R.pick(P.slice(1)), j = lg(b, N), e = R.int(2, b === 2 ? 5 : 3);
        return E.num(`Solve ${M(`${b}^x=${N}^${e}`)}.`, [{ label: 'x =', ans: j * e }], `Match bases first: ${N}${E.pt('^' + e)} = (${b}${E.pt('^' + j)})${E.pt('^' + e)} = ${b}${E.pt('^' + j * e)}. So x = ${j * e}, not ${e}.`); }
      const b = R.pick([2, 3, 5, 7, 10]), x0 = R.int(-6, 8); let p, r; do { p = R.int(1, 5); r = R.int(1, 5); } while (p === r); const q = R.int(-9, 9), s = (p - r) * x0 + q;
      return E.num(`Solve ${M(`${pe(b, ex(p, q))}=${pe(b, ex(r, s))}`)}.`, [{ label: 'x =', ans: x0 }], `The bases match, so set the exponents equal: ${M(`${ex(p, q)}=${ex(r, s)}`)}, giving x = ${x0}.`); } },
    c: { t: 'solve', g: R => {
      if (R.bool(0.3)) { const [b, P] = R.pick(FAM.slice(0, 4)), two = R.sample(P.slice(1), 2), j = lg(b, two[0]), k = lg(b, two[1]), m = R.int(1, 3), p = R.pick([1, 2]), q = R.int(-3, 3), ans = fr(-k * m - j * q, j * p);
        return E.num(`Solve ${M(`${pe(two[0], ex(p, q))}=1/${two[1]}${m > 1 ? '^' + m : ''}`)}.`, [{ label: 'x =', frac: ans, form: 'any' }], `Write both sides with base ${b}: ${M(`${b}^(${ex(j * p, j * q)})=${b}^(${-k * m})`)}. So ${M(`${ex(j * p, j * q)}=${-k * m}`)} and x = ${frT(...ans)}.`); }
      const t = sameBase(R), ans = fr(t.num, t.den);
      return E.num(`Solve ${M(t.eq)}.`, [{ label: 'x =', frac: ans, form: 'any' }], `Write both sides with base ${t.b}: ${M(`${t.b}^(${ex(t.j * t.p, t.j * t.q)})=${t.b}^(${ex(t.k * t.r, t.k * t.s)})`)}. Set exponents equal: ${M(`${ex(t.j * t.p, t.j * t.q)}=${ex(t.k * t.r, t.k * t.s)}`)}, so x = ${frT(...ans)}.`); } },
    d: { t: 'check', g: R => { let t; do t = sameBase(R); while (t.num % t.den !== 0 || Math.abs(t.num / t.den) > 8); const x0 = t.num / t.den, ok = R.bool();
      let w = x0; if (!ok) { const naive = (t.s - t.q) / (t.p - t.r); w = t.p !== t.r && Number.isInteger(naive) && naive !== x0 && Math.abs(naive) < 12 && R.bool(0.6) ? naive : x0 + nz(R, -2, 2); }
      const e1 = t.p * w + t.q, e2 = t.r * w + t.s;
      const pw2 = (B, j, e) => `${B}${E.pt('^(' + e + ')')}${j > 1 ? ` = ${t.b}${E.pt('^(' + j * e + ')')}` : ''}`;
      return E.tf(`Is x = ${w} a solution of ${M(t.eq)}?`, ok, `At x = ${w}: ${pw2(t.B1, t.j, e1)} and ${pw2(t.B2, t.k, e2)}. ${ok ? 'The exponents match, so yes.' : 'The exponents differ, so no.'}`, { choices: ['Yes', 'No'] }); } },
  });
})(typeof window !== 'undefined' ? window : globalThis);
