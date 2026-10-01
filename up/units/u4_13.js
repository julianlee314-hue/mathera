/* Era IV · Unit IV.13 Sequences & series (IV.13.01–IV.13.14) */
(function (G) {
  const E = G.E4, V = E.V, C = E.C, M = s => E.mx(s);
  const nz = (R, lo, hi) => { let v; do v = R.int(lo, hi); while (v === 0); return v; };
  const S = (id, name, steps) => E.skill({ id, name, steps });
  // ---- display helpers for subscripts, sigma and binomial coefficients (the core M() has none) ----
  const IN = s => M(s).replace(/^<math><mrow>/, '').replace(/<\/mrow><\/math>$/, '');
  const MS = (b, i) => `<msub><mi>${b}</mi><mrow>${IN(String(i))}</mrow></msub>`;
  const seg = s => { s = String(s).replace(/\s+/g, ''); if (!s) return ''; if (s.includes('*')) return s.split('*').map(seg).join('<mo>⋅</mo>'); let pre = '', post = '', m;
    if ((m = /^[+-]/.exec(s))) { pre = `<mo>${m[0] === '-' ? '−' : '+'}</mo>`; s = s.slice(1); }
    if ((m = /[+-]$/.exec(s))) { post = `<mo>${m[0] === '-' ? '−' : '+'}</mo>`; s = s.slice(0, -1); }
    return pre + (s ? IN(s) : '') + post; };
  // 'a_n=2a_{n-1}+3' → MathML with real subscripts
  const SMi = str => { const p = String(str).split(/([A-Za-z])_(\{[^}]*\}|[A-Za-z]|\d+)/); let b = '';
    for (let j = 0; j < p.length; j += 3) { b += seg(p[j]); if (j + 1 < p.length) b += MS(p[j + 1], p[j + 2].replace(/^\{|\}$/g, '')); }
    return b; };
  const SM = str => `<math><mrow>${SMi(str)}</mrow></math>`;
  const SUBC = { 0: '₀', 1: '₁', 2: '₂', 3: '₃', 4: '₄', 5: '₅', 6: '₆', 7: '₇', 8: '₈', 9: '₉', n: 'ₙ', k: 'ₖ', m: 'ₘ', p: 'ₚ', '+': '₊', '-': '₋' };
  const ts = (b, i) => b + [...String(i)].map(c => SUBC[c] ?? c).join('');          // text subscript: a₁₂
  const SIG = (lo, hi, body, tail = '', v = 'k') => `<math><mrow><munderover><mo>∑</mo><mrow><mi>${v}</mi><mo>=</mo>${IN(String(lo))}</mrow><mrow>${hi === 'inf' ? '<mi>∞</mi>' : IN(String(hi))}</mrow></munderover>${String(body).startsWith('<') ? body : IN(body)}${tail ? IN(tail) : ''}</mrow></math>`;
  const BN = (n, k) => `<mrow><mo>(</mo><mfrac linethickness="0"><mrow>${IN(String(n))}</mrow><mrow>${IN(String(k))}</mrow></mfrac><mo>)</mo></mrow>`;
  const MB = (n, k) => `<math>${BN(n, k)}</math>`;
  const cb = (n, k) => { if (k < 0 || k > n) return 0; let r = 1; for (let j = 1; j <= k; j++) r = r * (n - k + j) / j; return Math.round(r); };
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
  const fs = (n, d) => E.fracStr(n, d);
  const seq = (arr, more = true) => M(arr.map(String).join(', ')) + (more ? ', …' : '');       // 3, 7, 11, …
  const series = arr => arr.map(String).join('+').replace(/\+-/g, '-');                       // "3+6-12"
  const fmt = x => String(Math.round(x * 1e6) / 1e6);
  const money = x => '$' + x.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const lin = (p, q, v = 'n') => E.poly([p, q], v);
  const th = k => k + ((k % 100 >= 11 && k % 100 <= 13) ? 'th' : ['th', 'st', 'nd', 'rd'][k % 10] || 'th');
  const sgn = n => n < 0 ? `− ${-n}` : `+ ${n}`;
  const par = n => n < 0 ? `(${n})` : String(n);
  const rq = (p, q) => q === 1 ? `(${p})` : p < 0 ? `(-${-p}/${q})` : `(${p}/${q})`;                   // ratio for M(): (−1/3)
  const tail = last => last < 0 ? ' − … − ' + M(String(-last)) : ' + … + ' + M(String(last));                                        // pn + q

  /* IV.13.01 Sequence notation */
  const fam = R => { const k = R.int(0, 3);
    if (k === 0) { const a = R.int(-5, 9), d = nz(R, -6, 7); return n => a + (n - 1) * d; }
    if (k === 1) { const a = R.int(1, 4), r = R.pick([2, 3, -2]); return n => a * r ** (n - 1); }
    if (k === 2) { const c = R.int(-3, 5); return n => n * n + c; }
    const c = R.int(1, 5); return n => (n % 2 ? 1 : -1) * c * n; };
  S('IV.13.01', 'Sequence notation', {
    a: { t: 'terms and aₙ', g: R => { const f = fam(R), k = R.int(1, 6), ts6 = [1, 2, 3, 4, 5, 6].map(f);
      return E.num(`The sequence ${seq(ts6)} continues. What is ${SM('a_' + k)}?`, [{ label: ts('a', k) + ' =', ans: f(k) }], k === 1 ? `${ts('a', 1)} is the first term, the one with n = 1: ${ts('a', 1)} = ${f(1)}.` : `${ts('a', k)} is the ${E.ordinal(k)} term, counting from ${ts('a', 1)} = ${f(1)}: ${ts('a', k)} = ${f(k)}.`); } },
    b: { t: 'find terms from a formula', g: R => { const kind = R.int(0, 3), k = R.bool(0.3) ? 1 : R.int(2, 12); let f, s;
      if (kind === 0) { const p = nz(R, -5, 6), q = nz(R, -9, 9); f = n => p * n + q; s = lin(p, q); }
      else if (kind === 1) { const c = nz(R, -8, 8); f = n => n * n + c; s = E.poly([1, 0, c], 'n'); }
      else if (kind === 2) { const c = R.int(-5, 5); f = n => 2 ** n + c; s = `2^n${c ? (c > 0 ? '+' + c : c) : ''}`; }
      else { const c = R.int(0, 4); f = n => (n % 2 ? -1 : 1) * (n + c); s = `(-1)^n${c ? `(n+${c})` : 'n'}`; }
      return E.num(`A sequence has ${SM('a_n=' + s)}. What is ${SM('a_' + k)}?`, [{ label: ts('a', k) + ' =', ans: f(k) }], `Substitute n = ${k}: ${ts('a', k)} = ${f(k)}.${k === 1 ? ' The first term uses n = 1, not n = 0.' : ''}`); } },
    c: { t: 'finite vs infinite', g: R => { const fin = R.bool(), kind = R.int(0, 1), a = R.int(1, 9), d = R.int(2, 7), N = R.int(12, 60);
      if (kind === 0) { const t = [a, a + d, a + 2 * d];
        return E.choiceFixed(`Is the sequence ${fin ? M(t.join(', ')) + ', …, ' + M(String(a + (N - 1) * d)) : seq(t.concat([a + 3 * d]))} finite or infinite?`, ['finite', 'infinite'], fin ? 0 : 1, fin ? `It stops at a last term, ${a + (N - 1) * d}, so it is finite (${N} terms).` : 'The "…" at the end means it goes on forever, so it is infinite.'); }
      return E.choiceFixed(`Is the sequence ${SM('a_n=' + lin(d, a - d))} ${fin ? `for n = 1, 2, …, ${N}` : 'for every whole number n ≥ 1'} finite or infinite?`, ['finite', 'infinite'], fin ? 0 : 1, fin ? `n only runs up to ${N}, so there are ${N} terms: finite.` : 'n never stops, so there is no last term: infinite.'); } },
    d: { t: 'write a formula from terms', g: R => { const kind = R.int(0, 2); let f, s, why;
      if (kind === 0) { const a = R.int(-6, 12), d = nz(R, -6, 8); f = n => a + (n - 1) * d; s = lin(d, a - d); why = `Each term adds ${d}, so ${ts('a', 'n')} = ${a} + (n − 1)(${d}) = ${E.pt(s)}.`; }
      else if (kind === 1) { const c = nz(R, -5, 6); f = n => n * n + c; s = E.poly([1, 0, c], 'n'); why = `The terms are the squares 1, 4, 9, 16, … ${c > 0 ? 'plus ' + c : 'minus ' + -c}: ${ts('a', 'n')} = ${E.pt(s)}.`; }
      else { const a = R.int(1, 5), r = R.pick([2, 3, 4]); f = n => a * r ** (n - 1); s = `${a === 1 ? '' : a + '*'}${r}^(n-1)`; why = `Each term is ${r} times the one before, starting at ${a}: ${ts('a', 'n')} = ${E.pt(s)}.`; }
      return E.num(`Write a formula for the nth term of ${seq([1, 2, 3, 4, 5].map(f))}`, [{ label: ts('a', 'n') + ' =', expr: s }], why); } },
    e: { t: 'run it backwards: which term?', g: R => { let n0, b, c; do { n0 = R.int(4, 14); b = R.int(-6, 7); c = R.int(-12, 12); } while (-b - n0 > 0 || -b - n0 === n0);
      const V = n0 * n0 + b * n0 + c, m = -b - n0;
      return E.num(`Which term of ${SM('a_n=' + E.poly([1, b, c], 'n'))} equals ${V}?`, [{ label: 'n =', ans: n0 }], `Solve ${E.pt(E.poly([1, b, c - V], 'n'))} = 0, which factors as (n − ${n0})(n ${m > 0 ? '− ' + m : '+ ' + -m}) = 0. n must be a positive whole number, so n = ${n0}.`.replace('(n + 0)', 'n')); } },
    f: { t: 'find a far term by insight', g: R => { if (R.bool()) { const N = R.int(20, 160); let x = 0, c = 0; while (c < N) { x++; if (!Number.isInteger(Math.sqrt(x))) c++; } const k = Math.floor(Math.sqrt(x));
        return E.num(`The sequence ${seq([2, 3, 5, 6, 7, 8, 10, 11])} lists the positive integers that are not perfect squares. What is ${SM('a_' + N)}?`, [{ label: ts('a', N) + ' =', ans: x }], `From 1 to ${x} there are ${k} squares (up to ${k}² = ${k * k}), leaving ${x} − ${k} = ${N} non-squares, and ${x} is not a square. So ${ts('a', N)} = ${x}.`); }
      const N = R.int(20, 300); let k = 1; while (k * (k + 1) / 2 < N) k++;
      return E.num(`In the sequence ${seq([1, 2, 2, 3, 3, 3, 4, 4, 4, 4])} each whole number k appears k times. What is ${SM('a_' + N)}?`, [{ label: ts('a', N) + ' =', ans: k }], `The last copy of k sits at position 1 + 2 + … + k = k(k + 1)/2. Since ${(k - 1) * k / 2} < ${N} ≤ ${k * (k + 1) / 2}, position ${N} is in the block of ${k}s.`); } },
  });

  /* IV.13.02 Arithmetic sequences */
  S('IV.13.02', 'Arithmetic sequences', {
    a: { t: 'common difference', g: R => { const half = R.bool(0.2), a = R.int(-20, 30), d = half ? R.pick([1.5, 2.5, -1.5, 0.5, -2.5]) : nz(R, -9, 9), t = [0, 1, 2, 3].map(j => fmt(a + j * d));
      return E.num(`What is the common difference of the arithmetic sequence ${seq(t)}?`, [{ label: 'd =', ans: d }], `Subtract any term from the next: ${t[1]} − ${+t[0] < 0 ? '(' + t[0] + ')' : t[0]} = ${d}.`); } },
    b: { t: 'explicit formula (d is the slope)', g: R => { const a = R.int(-10, 15), d = nz(R, -7, 9), t = [0, 1, 2, 3].map(j => a + j * d), s = lin(d, a - d);
      return E.num(`Write an explicit formula for ${seq(t)}`, [{ label: ts('a', 'n') + ' =', expr: s }], `${ts('a', 'n')} = ${ts('a', 1)} + (n − 1)d = ${a} + (n − 1)(${d}) = ${E.pt(s)}. The slope is d = ${d}.`); } },
    c: { t: 'find a term', g: R => { const a = R.int(-15, 25), d = nz(R, -8, 9), k = R.int(12, 90), t = [0, 1, 2, 3].map(j => a + j * d);
      return E.num(`Find the ${th(k)} term of ${seq(t)}`, [{ label: ts('a', k) + ' =', ans: a + (k - 1) * d }], `${ts('a', k)} = ${a} + (${k} − 1)(${d}) = ${a} ${(k - 1) * d < 0 ? '− ' + -(k - 1) * d : '+ ' + (k - 1) * d} = ${a + (k - 1) * d}.`.replace(/(\d)th term/, '$1th term')); } },
    d: { t: 'find which term', g: R => { const a = R.int(-10, 20), d = nz(R, -7, 9), n = R.int(12, 80), V = a + (n - 1) * d, t = [a, a + d, a + 2 * d];
      return E.num(`Which term of ${seq(t)} is ${V}?`, [{ label: 'n =', ans: n }], `Solve ${a} + (n − 1)(${d}) = ${V}: n − 1 = (${V} − ${a < 0 ? '(' + a + ')' : a}) ÷ ${d} = ${n - 1}, so n = ${n}. (Not ${V} ÷ ${d}: the start value matters.)`); } },
  });

  /* IV.13.03 Geometric sequences */
  const RAT = [[2, 1], [3, 1], [4, 1], [5, 1], [-2, 1], [-3, 1], [1, 2], [1, 3], [-1, 2], [2, 3], [3, 2], [-1, 3]];
  S('IV.13.03', 'Geometric sequences', {
    a: { t: 'common ratio', g: R => { const [p, q] = R.pick(RAT), a = q ** 3 * R.pick([1, 2, 3, 5, -1, -2]), t = [0, 1, 2, 3].map(j => a * p ** j / q ** j);
      return E.num(`What is the common ratio of the geometric sequence ${seq(t)}?${q > 1 ? ' Give an exact answer.' : ''}`, [{ label: 'r =', exact: fs(p, q) }], `Divide a term by the one before: ${t[1]} ÷ ${t[0] < 0 ? '(' + t[0] + ')' : t[0]} = ${E.pt(fs(p, q))}. (Divide, don't subtract.)`); } },
    b: { t: 'explicit formula', g: R => { const half = R.bool(0.25), r = half ? 0.5 : R.pick([2, 3, 4, 5]), a = half ? 8 * R.int(1, 12) : nz(R, -4, 6), t = [0, 1, 2, 3].map(j => a * r ** j);
      const s = `${a === 1 ? '' : a === -1 ? '-' : a + '*'}${half ? '(1/2)' : r}^(n-1)`;
      return E.num(`Write an explicit formula for the geometric sequence ${seq(t)}`, [{ label: ts('a', 'n') + ' =', expr: s }], `${ts('a', 1)} = ${a} and r = ${half ? '1/2' : r}, so ${ts('a', 'n')} = ${ts('a', 1)}·rⁿ⁻¹ = ${a === 1 ? '' : a === -1 ? '−' : a + '·'}${half ? '(1/2)' : r}ⁿ⁻¹.`); } },
    c: { t: 'find a term', g: R => { const half = R.bool(0.3); let a, p, q, k;
      if (half) { q = R.pick([2, 3]); p = R.pick([1, -1]); a = q ** R.int(3, 5) * R.int(1, 3); k = R.int(5, 9); } else { q = 1; p = R.pick([2, 3, -2, -3]); a = nz(R, -4, 5); k = R.int(5, Math.abs(p) === 2 ? 11 : 8); }
      const t = [0, 1, 2, 3].map(j => a * p ** j / q ** j), num = a * p ** (k - 1), den = q ** (k - 1), v = fs(num, den);
      return E.num(`Find ${SM('a_' + k)} for the geometric sequence ${seq(t)}${den > 1 && num % den ? ' Give an exact answer.' : ''}`, [{ label: ts('a', k) + ' =', exact: v }], `r = ${fs(p, q)}, so ${ts('a', k)} = ${a}·${q > 1 || p < 0 ? '(' + fs(p, q) + ')' : p}^${k - 1} = ${E.pt(v)}.`.replace(/\^(\d+)/, (m, e) => E.pt('^' + e))); } },
    d: { t: 'find which term with logs', g: R => { if (R.bool()) { const r = R.pick([2, 3, 5]), a = R.int(1, 7), n = R.int(7, r === 2 ? 20 : r === 3 ? 14 : 10), V = a * r ** (n - 1);
        return E.num(`Which term of ${seq([a, a * r, a * r * r])} is ${V}?`, [{ label: 'n =', ans: n }], `${a}·${r}ⁿ⁻¹ = ${V} gives ${r}ⁿ⁻¹ = ${V / a}, so n − 1 = log(${V / a}) ÷ log ${r} = ${n - 1} and n = ${n}.`.replace('1·', '')); }
      let a, r, L, n, v; do { a = R.pick([2, 3, 5, 10, 4]); r = R.pick([1.5, 2, 3, 1.2, 2.5]); L = R.pick([1000, 5000, 10000, 100000]); n = 1; while (a * r ** (n - 1) <= L) n++; v = Math.log(L / a) / Math.log(r) + 1; } while (Math.abs(v - Math.round(v)) < 1e-6);
      return E.num(`The geometric sequence ${seq([a, a * r, fmt(a * r * r)])} has ratio ${r}. Which is the first term greater than ${L.toLocaleString('en-US')}?`, [{ label: 'n =', ans: n }], `Solve ${a}·${r}ⁿ⁻¹ > ${L}: n − 1 > log(${fmt(L / a)}) ÷ log ${r} ≈ ${(v - 1).toFixed(2)}, so n − 1 = ${n - 1} and n = ${n}.`); } },
  });

  /* IV.13.04 Recursive vs explicit */
  S('IV.13.04', 'Recursive vs explicit', {
    a: { t: 'read a recursive rule', g: R => { const kind = R.int(0, 2), a1 = R.int(1, 9); let p, q, right, wrong;
      if (kind === 0) { p = 1; q = nz(R, -9, 9); right = q > 0 ? `add ${q} to the previous term` : `subtract ${-q} from the previous term`; wrong = [`multiply the previous term by ${Math.abs(q) === 1 ? 2 : Math.abs(q)}`, `add ${q} to the term number n`, `add ${a1 === q ? a1 + 1 : a1} to the previous term`]; }
      else if (kind === 1) { p = R.int(2, 6); q = 0; right = `multiply the previous term by ${p}`; wrong = [`add ${p} to the previous term`, `multiply the term number n by ${p}`, `multiply the previous term by ${p + 1}`]; }
      else { p = R.int(2, 5); q = nz(R, -7, 7); right = `multiply the previous term by ${p}, then ${q > 0 ? 'add ' + q : 'subtract ' + -q}`; wrong = [`${q > 0 ? 'add ' + q : 'subtract ' + -q}, then multiply by ${p}`, `multiply the term number n by ${p}, then ${q > 0 ? 'add ' + q : 'subtract ' + -q}`, `multiply the previous term by ${Math.abs(q) === p ? p + 1 : Math.abs(q)}, then ${p === Math.abs(q) ? 'add ' + p : 'add ' + p}`]; }
      const rule = `a_n=${p === 1 ? '' : p}a_{n-1}${q ? (q > 0 ? '+' + q : q) : ''}`;
      return E.choice(R, `A sequence has ${SM('a_1=' + a1)} and ${SM(rule)}. In words, how do you get each term after the first?`, right, wrong, `${ts('a', 'n-1')} is the previous term, so the rule says: ${right}. For example ${ts('a', 2)} = ${p * a1 + q}.`); } },
    b: { t: 'generate terms', g: R => { let a1, p, q, t; do { a1 = R.int(-5, 9); p = R.pick([1, 2, 3, -1, -2]); q = R.int(-8, 8); t = [a1]; for (let j = 1; j < 4; j++) t.push(p * t[j - 1] + q); } while (Math.max(...t.map(Math.abs)) > 200 || new Set(t).size < 3);
      const rule = `a_n=${p === 1 ? '' : p === -1 ? '-' : p}a_{n-1}${q ? (q > 0 ? '+' + q : q) : ''}`;
      return E.num(`${SM('a_1=' + a1)} and ${SM(rule)}. Find the next three terms.`, [{ label: 'a₂ =', ans: t[1] }, { label: 'a₃ =', ans: t[2] }, { label: 'a₄ =', ans: t[3] }], `Apply the rule to each term in turn: ${t.join(', ')}.`); } },
    c: { t: 'convert recursive to explicit', g: R => { const a1 = R.int(-6, 12); let rule, s, why;
      if (R.bool()) { const d = nz(R, -7, 9); rule = `a_n=a_{n-1}${d > 0 ? '+' + d : d}`; s = lin(d, a1 - d); why = `Adding ${d} each time is arithmetic: ${ts('a', 'n')} = ${a1} + (n − 1)(${d}) = ${E.pt(s)}.`; }
      else { const r = R.pick([2, 3, 4, 5]), a = a1 === 0 ? 1 : a1; rule = `a_n=${r}a_{n-1}`; s = `${a === 1 ? '' : a === -1 ? '-' : a + '*'}${r}^(n-1)`; return E.num(`Write an explicit formula for ${SM('a_1=' + a)}, ${SM(rule)}.`, [{ label: ts('a', 'n') + ' =', expr: s }], `Multiplying by ${r} each time is geometric: ${ts('a', 'n')} = ${a}·${r}ⁿ⁻¹.`); }
      return E.num(`Write an explicit formula for ${SM('a_1=' + a1)}, ${SM(rule)}.`, [{ label: ts('a', 'n') + ' =', expr: s }], why); } },
    d: { t: 'when each is useful', g: R => { const a = R.int(2, 9), d = R.int(2, 9), N = R.pick([200, 500, 1000, 250]), k = R.int(0, 5);
      const Q = [
        [`To find ${ts('a', N)} of ${a}, ${a + d}, ${a + 2 * d}, …, which rule is quickest?`, `the explicit rule ${ts('a', 'n')} = ${E.pt(lin(d, a - d))}, with n = ${N}`, [`the recursive rule, step by step ${N - 1} times`, 'both are equally quick', 'neither can find it'], `The explicit rule jumps straight to term ${N}; the recursive one needs every term before it.`],
        [`Why is ${ts('a', 'n')} = ${ts('a', 'n-1')} + ${d} on its own not enough to define a sequence?`, `it has no starting value: ${a}, ${a + d}, ${a + 2 * d}, … and ${a + 1}, ${a + 1 + d}, … both fit`, ['it has no explicit formula', `${d} is not a valid difference`, 'recursive rules never define sequences'], 'A recursive rule needs a first term to start from.'],
        [`A balance grows ${d}% each month and you add $${a * 10} each month. Which description is most natural?`, `recursive: new balance = ${fmt(1 + d / 100)} × old balance + ${a * 10}`, [`explicit: balance = ${a * 10}n`, `explicit: balance = ${fmt(1 + d / 100)}n + ${a * 10}`, 'neither: it is not a sequence'], 'Each month depends on the month before, which is exactly what a recursive rule says.'],
        ['Each Fibonacci number is the sum of the two before it. Which kind of rule says this most simply?', 'recursive', ['explicit', 'neither', 'a constant rule'], 'The definition itself uses earlier terms, so it is recursive.'],
        [`To see roughly how big ${ts('a', 'n')} gets when n is ${N}, which helps most?`, 'an explicit formula', ['a recursive rule', 'the first term alone', 'the common difference alone'], 'An explicit formula shows directly how the size depends on n.'],
        [`${ts('a', 1)} = ${a}, ${ts('a', 'n')} = ${ts('a', 'n-1')} + ${d}. Which explicit rule gives the same sequence?`, `${ts('a', 'n')} = ${E.pt(lin(d, a - d))}`, [`${ts('a', 'n')} = ${E.pt(lin(d, a))}`, `${ts('a', 'n')} = ${E.pt(lin(a, d))}`, `${ts('a', 'n')} = ${a}·${d}ⁿ⁻¹`], `Start at ${a} and add ${d} each step: ${a} + (n − 1)·${d}.`],
      ][k];
      return E.choice(R, Q[0], Q[1], Q[2], Q[3]); } },
    e: { t: 'run it backwards', g: R => { let a1, p, q, m, t; do { a1 = R.int(-6, 9); p = R.pick([2, 3, -2]); q = R.int(-7, 7); m = R.int(4, 5); t = [a1]; for (let j = 1; j < m; j++) t.push(p * t[j - 1] + q); } while (Math.abs(t[m - 1]) > 400 || new Set(t).size < m);
      const rule = `a_n=${p}a_{n-1}${q ? (q > 0 ? '+' + q : q) : ''}`;
      return E.num(`A sequence follows ${SM(rule)} and ${SM(`a_${m}=${t[m - 1]}`)}. Find ${SM('a_1')}.`, [{ label: 'a₁ =', ans: a1 }], `Undo the rule: ${ts('a', 'n-1')} = (${ts('a', 'n')} ${q >= 0 ? '− ' + q : '+ ' + -q}) ÷ ${p < 0 ? '(' + p + ')' : p}. Going back: ${t.slice().reverse().join(', ')}.`); } },
    f: { t: 'a hidden cycle', g: R => { const N = R.int(20, 2030);
      if (R.bool()) { const c = R.pick([2, 3, 4, 5, -1, -2, -3, -4]); const v = [fs(1, 1), fs(c, 1), fs(1, 1 - c), fs(c - 1, c)]; const ans = [fs(c, 1), fs(1, 1 - c), fs(c - 1, c)][(N - 1) % 3];
        const rule = `<math><mrow>${MS('a', 'n+1')}<mo>=</mo><mfrac><mn>1</mn><mrow><mn>1</mn><mo>−</mo>${MS('a', 'n')}</mrow></mfrac></mrow></math>`;
        return E.num(`${SM('a_1=' + c)} and ${rule}. Find ${SM('a_{' + N + '}')}. Give an exact answer.`, [{ label: ts('a', N) + ' =', exact: ans }], `The terms go ${E.pt(v[1])}, ${E.pt(v[2])}, ${E.pt(v[3])}, then back to ${E.pt(v[1])}: a cycle of 3. ${N} = 3·${Math.floor((N - 1) / 3)} + ${(N - 1) % 3 + 1}, so ${ts('a', N)} = ${ts('a', (N - 1) % 3 + 1)} = ${E.pt(ans)}.`); }
      let u, v; do { u = nz(R, -9, 9); v = nz(R, -9, 9); } while (u === v || u === -v || v === 2 * u || u === 2 * v);
      const cyc = [u, v, v - u, -u, -v, u - v], ans = cyc[(N - 1) % 6];
      return E.num(`${SM('a_1=' + u)}, ${SM('a_2=' + v)} and ${SM('a_n=a_{n-1}-a_{n-2}')} for n ≥ 3. Find ${SM('a_{' + N + '}')}.`, [{ label: ts('a', N) + ' =', ans }], `The terms run ${cyc.join(', ')}, ${u}, ${v}, …: they repeat every 6. ${N} = 6·${Math.floor((N - 1) / 6)} + ${(N - 1) % 6 + 1}, so ${ts('a', N)} = ${ts('a', (N - 1) % 6 + 1)} = ${ans}.`); } },
  });
  /* IV.13.05 Arithmetic series */
  S('IV.13.05', 'Arithmetic series', {
    a: { t: "Gauss's pairing trick", g: R => { let m, Mx; if (R.bool()) { m = 1; Mx = R.int(10, 200); } else { m = R.int(2, 60); Mx = m + R.int(9, 120); }
      const n = Mx - m + 1, T = n * (m + Mx) / 2;
      return E.num(`Find ${M(`${m}+${m + 1}+${m + 2}`)} + … + ${M(String(Mx))}.`, [{ ans: T }], `Write the sum forwards and backwards: each of the ${n} columns adds to ${m} + ${Mx} = ${m + Mx}. So twice the sum is ${n} × ${m + Mx}, and the sum is ${T}.`); } },
    b: { t: 'Sₙ formula', g: R => { const a = R.int(-10, 20), d = nz(R, -5, 8), n = R.int(10, 40), last = a + (n - 1) * d, Sn = n * (a + last) / 2;
      return E.num(`Find the sum of the first ${n} terms of ${M(series([a, a + d, a + 2 * d]))} + …`, [{ label: ts('S', n) + ' =', ans: Sn }], `${ts('a', n)} = ${a} + ${n - 1}(${d}) = ${last}, so ${ts('S', n)} = ${n}(${a} + ${par(last)})/2 = ${Sn}.`); } },
    c: { t: 'find n or a₁', g: R => { if (R.bool()) { const a = R.int(1, 10), d = R.int(1, 6), n = R.int(8, 30), T = n * (2 * a + (n - 1) * d) / 2;
        return E.num(`How many terms of ${M(series([a, a + d, a + 2 * d]))} + … add up to ${T}?`, [{ label: 'n =', ans: n }], `n(2·${a} + (n − 1)·${d})/2 = ${T} gives ${E.pt(E.poly([d, 2 * a - d, -2 * T], 'n'))} = 0. Its positive root is n = ${n}.`); }
      const a = R.int(-12, 20), d = nz(R, -5, 6), n = R.int(8, 30), T = n * (2 * a + (n - 1) * d) / 2;
      return E.num(`An arithmetic series has ${n} terms, common difference ${d} and sum ${T}. Find ${SM('a_1')}.`, [{ label: 'a₁ =', ans: a }], `${T} = ${n}(2${ts('a', 1)} + ${n - 1}·${par(d)})/2, so 2${ts('a', 1)} ${sgn((n - 1) * d)} = ${2 * T / n} and ${ts('a', 1)} = ${a}.`); } },
    d: { t: 'stacking and seating problems', g: R => { const kind = R.int(0, 2);
      if (kind === 0) { const r1 = R.int(10, 30), k = R.int(1, 4), rows = R.int(10, 30), T = rows * (2 * r1 + (rows - 1) * k) / 2;
        return E.num(`A theater has ${r1} seats in the first row, and each row has ${k} more than the row in front. There are ${rows} rows. How many seats are there?`, [{ ans: T }], `The last row has ${r1} + ${rows - 1}·${k} = ${r1 + (rows - 1) * k} seats, so the total is ${rows}(${r1} + ${r1 + (rows - 1) * k})/2 = ${T}.`); }
      if (kind === 1) { const b = R.int(12, 30), t = R.int(1, 8), rows = b - t + 1, T = rows * (b + t) / 2;
        return E.num(`Logs are stacked with ${b} on the bottom row, one fewer in each row above, and ${t} on the top row. How many logs are there?`, [{ ans: T }], `From ${b} down to ${t} there are ${b} − ${t} + 1 = ${rows} rows. Total = ${rows}(${b} + ${t})/2 = ${T}.`); }
      const m = R.int(3, 9), N = R.int(10, 40), T = m * N * (N + 1) / 2;
      return E.num(`Find the sum of the multiples of ${m} from ${m} to ${m * N}.`, [{ ans: T }], `There are ${m * N} ÷ ${m} = ${N} terms (count them first). Sum = ${N}(${m} + ${m * N})/2 = ${T}.`); } },
    e: { t: 'from a formula for Sₙ', g: R => { const A = R.int(1, 5) * (R.bool(0.8) ? 1 : -1), B = R.int(-5, 9), k = R.int(5, 20), Sk = A * k * k + B * k, Sk1 = A * (k - 1) ** 2 + B * (k - 1);
      return E.num(`The sum of the first n terms of an arithmetic sequence is ${SM('S_n=' + E.poly([A, B, 0], 'n'))}. Find ${SM('a_{' + k + '}')} and d.`, [{ label: ts('a', k) + ' =', ans: Sk - Sk1 }, { label: 'd =', ans: 2 * A }], `${ts('a', k)} = ${ts('S', k)} − ${ts('S', k - 1)} = ${Sk} − ${par(Sk1)} = ${Sk - Sk1}. Also ${ts('a', 1)} = ${ts('S', 1)} = ${A + B} and ${ts('a', 2)} = ${ts('S', 2)} − ${ts('S', 1)} = ${3 * A + B}, so d = ${2 * A}.`); } },
    f: { t: 'sums that know each other', g: R => { if (R.bool()) { const m = R.int(3, 30); let n; do n = R.int(3, 30); while (n === m);
        return E.num(`An arithmetic series has ${SM(`S_{${m}}=${n}`)} and ${SM(`S_{${n}}=${m}`)}. Find ${SM(`S_{${m + n}}`)}.`, [{ label: ts('S', m + n) + ' =', ans: -(m + n) }], `Write ${ts('S', 'k')} = Ak² + Bk. Subtracting the two facts: A(${m}² − ${n}²) + B(${m} − ${n}) = ${n} − ${m}, so A(${m + n}) + B = −1. Then ${ts('S', m + n)} = ${m + n}(A·${m + n} + B) = −${m + n}.`); }
      const a = R.int(-10, 20), d = nz(R, -6, 6), p = R.int(4, 12), Sf = n => n * (2 * a + (n - 1) * d) / 2, X = Sf(p), Y = Sf(2 * p), Z = Sf(3 * p);
      if (Z !== 3 * (Y - X)) throw new Error('IV.13.05f identity');
      return E.num(`An arithmetic series has ${SM(`S_{${p}}=${X}`)} and ${SM(`S_{${2 * p}}=${Y}`)}. Find ${SM(`S_{${3 * p}}`)}.`, [{ label: ts('S', 3 * p) + ' =', ans: Z }], `Split into blocks of ${p} terms: the first two blocks sum to ${X} and ${Y} − ${par(X)} = ${Y - X}. Each block sum is ${p}²d more than the one before, so the third block is ${Y - X} + (${Y - X} − ${par(X)}) = ${2 * (Y - X) - X}. Total ${Y} + ${par(2 * (Y - X) - X)} = ${Z}.`); } },
  });

  /* IV.13.06 Finite geometric series */
  const gsum = (a, p, q, n) => fs(a * (q ** n - p ** n), q ** (n - 1) * (q - p));                // a(1 − rⁿ)/(1 − r), r = p/q
  S('IV.13.06', 'Finite geometric series', {
    a: { t: 'the formula', g: R => { let a, r, n; do { a = R.pick([1, 2, 3, 5, -1, -2, 4]); r = R.pick([2, 3, -2, 4]); n = R.int(5, 10); } while (Math.abs(a * r ** (n - 1)) > 300000);
      const last = a * r ** (n - 1);
      return E.num(`To use ${M('S=a(1-r^n)/(1-r)')} on ${M(series([a, a * r, a * r * r]))}${tail(last)}, what are a, r and n?`, [{ label: 'a =', ans: a }, { label: 'r =', ans: r }, { label: 'n =', ans: n }], `a is the first term, ${a}; r = ${a * r} ÷ ${par(a)} = ${r}. The last term is a·rⁿ⁻¹, so ${par(r)}ⁿ⁻¹ = ${last / a} = ${par(r)}${E.pt('^' + (n - 1))}: n − 1 = ${n - 1}, so n = ${n} terms.`); } },
    b: { t: 'sum it by multiplying and subtracting', g: R => { let a, r, m; do { a = R.int(1, 5); r = R.int(2, 5); m = R.int(4, 8); } while (a * r ** (m + 1) > 5e6);
      const top = a * (r ** (m + 1) - 1), last = a === 1 ? `${r}^${m}` : `${a}*${r}^${m}`;
      return E.num(`Let ${M(`S=${a}+${a * r}+${a * r * r}`)} + … + ${M(last)}. Multiply by ${r} and subtract S. What is ${M(`${r}S-S`)}, and what is S?`, [{ label: `${r}S − S =`, ans: top }, { label: 'S =', ans: top / (r - 1) }], `${r}S = ${a * r} + ${a * r * r} + … + ${a === 1 ? '' : a + '·'}${E.pt(r + '^' + (m + 1))}. Subtracting, every middle term cancels: ${r}S − S = ${a === 1 ? '' : a + '·'}${E.pt(r + '^' + (m + 1))} − ${a} = ${top}${r - 1 === 1 ? ', so S = ' + top : `, so ${r - 1}S = ${top} and S = ${top / (r - 1)}`}.`); } },
    c: { t: 'apply it', g: R => { const half = R.bool(0.35); let a, p, q, n;
      if (half) { q = 2; p = R.pick([1, 1, -1]); n = R.int(5, 9); a = 2 ** R.int(n - 3, n - 1) * R.pick([1, 3]); } else { q = 1; p = R.pick([2, 3, -2, -3]); n = R.int(6, Math.abs(p) === 2 ? 11 : 8); a = R.pick([1, 2, 3, 4, 5, -1, -2]); }
      const t = [0, 1, 2].map(j => a * p ** j / q ** j), v = gsum(a, p, q, n), rr = q > 1 || p < 0 ? `(${fs(p, q)})` : String(p);
      return E.num(`Find the sum of the first ${n} terms of ${M(series(t))} + …${v.includes('/') ? ' Give an exact answer.' : ''}`, [{ label: ts('S', n) + ' =', exact: v }], `a = ${a}, r = ${E.pt(fs(p, q))} and n = ${n} (the number of terms): ${ts('S', n)} = ${a}(1 − ${E.pt(rr + '^' + n)})/(1 − ${E.pt(rr)}) = ${E.pt(v)}.`); } },
    d: { t: 'find n', g: R => { if (R.bool()) { const a = R.int(1, 6), r = R.pick([2, 3]), n = R.int(5, r === 2 ? 13 : 9), T = a * (r ** n - 1) / (r - 1);
        return E.num(`How many terms of ${M(series([a, a * r, a * r * r]))} + … add up to ${T}?`, [{ label: 'n =', ans: n }], `${a}(${r}ⁿ − 1)/${r - 1} = ${T} gives ${r}ⁿ = ${T * (r - 1) / a + 1} = ${E.pt(r + '^' + n)}, so n = ${n}.`.replace('/1 =', ' =')); }
      let a, r, L, n, v; do { a = R.pick([1, 2, 3, 5]); r = R.pick([2, 3]); L = R.pick([1000, 5000, 10000, 100000, 1000000]); n = 1; while (a * (r ** n - 1) / (r - 1) <= L) n++; v = Math.log(L * (r - 1) / a + 1) / Math.log(r); } while (Math.abs(v - Math.round(v)) < 1e-6);
      return E.num(`What is the smallest number of terms of ${M(series([a, a * r, a * r * r]))} + … whose sum is greater than ${L.toLocaleString('en-US')}?`, [{ label: 'n =', ans: n }], `Solve ${a}(${r}ⁿ − 1)/${r - 1} > ${L}: ${r}ⁿ > ${fmt(L * (r - 1) / a + 1)}, so n > log(${fmt(L * (r - 1) / a + 1)}) ÷ log ${r} ≈ ${v.toFixed(2)}. The smallest whole n is ${n}.`.replace('/1 >', ' >')); } },
  });

  /* IV.13.07 Sigma notation */
  const term = (R) => { const kind = R.int(0, 2);
    if (kind === 0) { const p = nz(R, -4, 6), q = R.int(-6, 8); return { s: E.poly([p, q], 'k'), f: k => p * k + q, wrap: q !== 0 }; }
    if (kind === 1) { const c = R.int(-4, 5); return { s: E.poly([1, 0, c], 'k'), f: k => k * k + c, wrap: c !== 0 }; }
    return { s: '2^k', f: k => 2 ** k, wrap: false }; };
  const body = T => T.wrap ? `(${T.s})` : T.s;
  S('IV.13.07', 'Sigma notation', {
    a: { t: 'read Σ', g: R => { const T = term(R), lo = R.int(0, 5), hi = lo + R.int(3, 20);
      return E.num(`In ${SIG(lo, hi, body(T))}, how many terms are added, and what is the first term?`, [{ label: 'number of terms =', ans: hi - lo + 1 }, { label: 'first term =', ans: T.f(lo) }], `k runs from ${lo} to ${hi}: that is ${hi} − ${lo} + 1 = ${hi - lo + 1} terms. The first uses k = ${lo}: ${T.f(lo)}.`); } },
    b: { t: 'expand a sum', g: R => { if (R.bool(0.3)) { const c = nz(R, -9, 9), n = R.int(4, 12);
        return E.num(`Evaluate ${SIG(1, n, String(c))}.`, [{ ans: n * c }], `There is no k in the term, so ${c} is added once for each k = 1, …, ${n}: ${n} × ${par(c)} = ${n * c}.`); }
      const T = term(R), lo = R.int(0, 2), n = lo + R.int(3, 5), vals = []; for (let k = lo; k <= n; k++) vals.push(T.f(k));
      return E.num(`Evaluate ${SIG(lo, n, body(T))}.`, [{ ans: vals.reduce((x, y) => x + y, 0) }], `Put in k = ${lo}, …, ${n}: ${vals.map(par).join(' + ')} = ${vals.reduce((x, y) => x + y, 0)}.`); } },
    c: { t: 'write a sum in Σ', g: R => { const kind = R.int(0, 2); let n, s, t, why;
      if (kind === 0) { const a = nz(R, -3, 9), d = R.int(2, 7); n = R.int(6, 20); s = E.poly([d, a - d], 'k'); t = k => a + (k - 1) * d; why = `The terms go up by ${d}, starting at ${a}: term = ${E.pt(s)}.`; }
      else if (kind === 1) { const a = R.int(1, 5), r = R.pick([2, 3]); n = R.int(5, r === 2 ? 10 : 8); s = `${a === 1 ? '' : a + '*'}${r}^(k-1)`; t = k => a * r ** (k - 1); why = `Each term is ${r} times the last, starting at ${a}: term = ${E.pt(s)}.`; }
      else { n = R.int(6, 15); s = 'k^2'; t = k => k * k; why = 'The terms are the squares: term = k².'; }
      return E.num(`Write ${M(series([t(1), t(2), t(3)]))} + … + ${M(String(t(n)))} as ${SIG(1, 'n', '(term)')}. What are n and the term (in k)?`, [{ label: 'n =', ans: n }, { label: 'term =', expr: s }], `${why} The last term ${t(n)} is k = ${n}, so n = ${n}.`); } },
    d: { t: 'properties of sums', g: R => { if (R.bool()) { const p = nz(R, -5, 6), q = nz(R, -9, 9), n = R.int(10, 50), T = p * n * (n + 1) / 2 + q * n;
        return E.num(`Use ${SIG(1, 'n', 'k', '=n(n+1)/2')} to evaluate ${SIG(1, n, '(' + E.poly([p, q], 'k') + ')')}.`, [{ ans: T }], `Split it: ${p === 1 ? '' : p}Σk + Σ${par(q)} = ${p}·${n}·${n + 1}/2 + ${n}·${par(q)} = ${p * n * (n + 1) / 2} + ${par(q * n)} = ${T}. The constant is added ${n} times.`); }
      const n = R.pick([8, 10, 12, 20]), A = R.int(-20, 40), B = R.int(-20, 40), p = nz(R, -4, 5), q = nz(R, -4, 5), c = nz(R, -5, 5);
      const bd = `<mo>(</mo>${SMi(`${p === 1 ? '' : p === -1 ? '-' : p}a_k${q > 0 ? '+' : '-'}${Math.abs(q) === 1 ? '' : Math.abs(q)}b_k${c > 0 ? '+' + c : c}`)}<mo>)</mo>`;
      return E.num(`${SIG(1, n, MS('a', 'k'), '=' + A)} and ${SIG(1, n, MS('b', 'k'), '=' + B)}. Find ${SIG(1, n, bd)}.`, [{ ans: p * A + q * B + n * c }], `Sums split and constants factor out: ${p}(${A}) + ${par(q)}(${B}) + ${n}·${par(c)} = ${p * A + q * B + n * c}. The constant ${c} is added ${n} times, not once.`); } },
    e: { t: 'shifted start or run backwards', g: R => { if (R.bool()) { const p = nz(R, -4, 6), q = R.int(-6, 8), m = R.int(5, 20), n = m + R.int(10, 40), f = k => p * k + q, cnt = n - m + 1, T = cnt * (f(m) + f(n)) / 2;
        return E.num(`Evaluate ${SIG(m, n, q ? '(' + E.poly([p, q], 'k') + ')' : E.poly([p, 0], 'k'))}.`, [{ ans: T }], `It is arithmetic with ${n} − ${m} + 1 = ${cnt} terms, from ${f(m)} to ${f(n)}: ${cnt}(${f(m)} + ${par(f(n))})/2 = ${T}.`); }
      if (R.bool()) { const N = R.int(8, 40);
        return E.num(`For which n is ${SIG(1, 'n', '(2k-1)', '=' + N * N)}?`, [{ label: 'n =', ans: N }], `1 + 3 + 5 + … + (2n − 1) = n², so n² = ${N * N} and n = ${N}.`); }
      const N = R.int(10, 60), T = N * (N + 1) / 2;
      return E.num(`For which n is ${SIG(1, 'n', 'k', '=' + T)}?`, [{ label: 'n =', ans: N }], `n(n + 1)/2 = ${T} gives n² + n − ${2 * T} = 0, so (n − ${N})(n + ${N + 1}) = 0 and n = ${N}.`); } },
    f: { t: 'telescoping sums', g: R => { const kind = R.int(0, 3);
      if (kind === 0) { const n = R.int(5, 99); return E.num(`Evaluate ${SIG(1, n, '1/(k(k+1))')}. Give an exact answer.`, [{ exact: fs(n, n + 1) }], `1/(k(k + 1)) = 1/k − 1/(k + 1), so the sum telescopes to 1 − 1/${n + 1} = ${fs(n, n + 1)}.`); }
      if (kind === 1) { const n = R.int(5, 60); return E.num(`Evaluate ${SIG(1, n, '1/((2k-1)(2k+1))')}. Give an exact answer.`, [{ exact: fs(n, 2 * n + 1) }], `1/((2k − 1)(2k + 1)) = ½(1/(2k − 1) − 1/(2k + 1)), which telescopes to ½(1 − 1/${2 * n + 1}) = ${fs(n, 2 * n + 1)}.`); }
      if (kind === 2) { const m = R.int(3, 14), n = m * m - 1; return E.num(`Evaluate ${SIG(1, n, '1/(sqrt(k)+sqrt(k+1))')}.`, [{ ans: m - 1 }], `Rationalize: 1/(√k + √(k + 1)) = √(k + 1) − √k. The sum telescopes to √${n + 1} − √1 = ${m} − 1 = ${m - 1}.`); }
      const n = R.int(5, 40), v = fs(3 * (n + 1) * (n + 2) - 2 * (n + 2) - 2 * (n + 1), 2 * (n + 1) * (n + 2));
      return E.num(`Evaluate ${SIG(1, n, '2/(k(k+2))')}. Give an exact answer.`, [{ exact: v }], `2/(k(k + 2)) = 1/k − 1/(k + 2). Terms cancel two apart, leaving 1 + 1/2 − 1/${n + 1} − 1/${n + 2} = ${E.pt(v)}.`); } },
  });

  /* IV.13.08 Infinite geometric series */
  const SR = [[1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [-1, 2], [-1, 3], [1, 5], [2, 5], [-1, 4]];
  S('IV.13.08', 'Infinite geometric series', {
    a: { t: 'when r is between −1 and 1', g: R => { const yes = R.bool(), [p, q] = yes ? R.pick([[1, 2], [1, 3], [2, 3], [-1, 2], [3, 4], [-1, 3], [1, 4], [-2, 3], [2, 5]]) : R.pick([[2, 1], [3, 1], [-2, 1], [1, 1], [-1, 1], [3, 2], [-3, 2], [5, 4]]);
      const a = q ** 3 * R.pick([1, 2, 3, -1]), t = [0, 1, 2, 3].map(j => a * p ** j / q ** j);
      return E.tf(`Does the infinite series ${M(series(t))} + … have a sum?`, yes, `r = ${t[1]} ÷ ${par(t[0])} = ${E.pt(fs(p, q))}. ${yes ? `|r| < 1, so the terms shrink and the sum is a/(1 − r) = ${E.pt(fs(a * q, q - p))}.` : `|r| ≥ 1, so the terms never shrink to 0 and there is no sum.`}`, { choices: ['Yes', 'No'] }); } },
    b: { t: 'S = a/(1 − r)', g: R => { const [p, q] = R.pick(SR), a = q * q * R.pick([1, 2, 3, 4, 5, -1, -2]), t = [0, 1, 2].map(j => a * p ** j / q ** j), v = fs(a * q, q - p);
      return E.num(`Find the sum of ${M(series(t))} + …${v.includes('/') ? ' Give an exact answer.' : ''}`, [{ label: 'S =', exact: v }], `a = ${a} and r = ${E.pt(fs(p, q))}, with |r| < 1. S = a/(1 − r) = ${a} ÷ ${E.pt(fs(q - p, q))} = ${E.pt(v)}.`); } },
    c: { t: 'repeating decimals as fractions', g: R => { const kind = R.int(0, 2); let shown, n, d, why;
      if (kind === 0) { const x = R.int(1, 8); shown = '0.' + String(x).repeat(6) + '…'; n = x; d = 9; why = `${x}/10 + ${x}/100 + … has r = 1/10: (${x}/10)/(1 − 1/10) = ${x}/9`; }
      else if (kind === 1) { let ab; do ab = R.int(1, 98); while (ab % 11 === 0); const s2 = String(ab).padStart(2, '0'); shown = '0.' + s2.repeat(3) + '…'; n = ab; d = 99; why = `${ab}/100 + ${ab}/10000 + … has r = 1/100: (${ab}/100)/(1 − 1/100) = ${ab}/99`; }
      else { const x = R.int(1, 9); let y; do y = R.int(1, 8); while (y === x); shown = `0.${x}${String(y).repeat(5)}…`; n = 9 * x + y; d = 90; why = `${x}/10 + (${y}/100 + ${y}/1000 + …); the bracket is (${y}/100)/(1 − 1/10) = ${y}/90. Total ${9 * x}/90 + ${y}/90 = ${9 * x + y}/90`; }
      const g = gcd(n, d);
      return E.num(`Write ${shown} as a fraction in simplest form.`, [{ frac: [n / g, d / g], form: 'simplest' }], `${why}${g > 1 ? ' = ' + n / g + '/' + d / g : ''}.`); } },
    d: { t: 'shifted starting index and bouncing balls', g: (R, O) => { if (R.bool()) { const [p, q] = R.pick([[1, 2], [1, 3], [2, 3], [-1, 2], [1, 4], [-1, 3], [3, 4]]), a = R.int(1, 6), s = R.int(1, 3), first = fs(a * p ** s, q ** s), v = fs(a * p ** s, q ** (s - 1) * (q - p));
        return E.num(`Find ${SIG(s, 'inf', `${a === 1 ? '' : a}${rq(p, q)}^k`)}. Give an exact answer.`, [{ exact: v }], `The first term is k = ${s}, not k = 0: ${E.pt(first)}. With r = ${E.pt(fs(p, q))}, S = ${E.pt(first)} ÷ (1 − ${E.pt(fs(p, q))}) = ${E.pt(v)}.`.replace('− −', '+ ')); }
      const [a, b] = R.pick([[1, 2], [2, 3], [3, 4], [3, 5], [4, 5], [1, 3], [2, 5]]), H = R.int(2, 30), u = O && O.units === 'imperial' ? 'ft' : 'm', v = fs(H * (a + b), b - a);
      return E.num(`A ball is dropped from ${H} ${u}. Each bounce reaches ${a}/${b} of the height before. How far does it travel up and down in total?${v.includes('/') ? ' Give an exact answer.' : ''}`, [{ label: `distance (${u}) =`, exact: v }], `Down ${H}, then each rebound goes up and down: ${H} + 2·(${H}·${a}/${b})/(1 − ${a}/${b}) = ${H} + ${E.pt(fs(2 * H * a, b - a))} = ${E.pt(v)} ${u}.`); } },
    e: { t: 'a parameter or run backwards', g: R => { const kind = R.int(0, 2);
      if (kind === 0) { const h = R.int(-5, 5), m = R.int(2, 6), xh = h > 0 ? `x-${h}` : h < 0 ? `x+${-h}` : 'x';
        return E.num(`For which x does ${SIG(0, 'inf', `((${xh})/${m})^k`)} converge? Answer in interval notation.`, [{ interval: `(${h - m},${h + m})` }], `It is geometric with r = (${E.pt(xh)})/${m}. It converges when |r| < 1: |${E.pt(xh)}| < ${m}, so ${h - m} < x < ${h + m}.`); }
      if (kind === 1) { const c = R.int(2, 9);
        return E.num(`For which x does ${M(`1+${c}x+${c * c}x^2+${c ** 3}x^3`)} + … converge? Answer in interval notation.`, [{ interval: `(-1/${c},1/${c})` }], `r = ${c}x, and it converges when |${c}x| < 1: −1/${c} < x < 1/${c}.`); }
      const [p, q] = R.pick(SR), a = (q - p) * R.int(1, 6), T = a * q / (q - p);
      return E.num(`An infinite geometric series has first term ${a} and sum ${T}. Find r.${q > 1 ? ' Give an exact answer.' : ''}`, [{ label: 'r =', exact: fs(p, q) }], `${T} = ${a}/(1 − r), so 1 − r = ${E.pt(fs(a, T))} and r = ${E.pt(fs(p, q))}.`); } },
    f: { t: 'two sums, two unknowns', g: R => { if (R.bool()) { const [p, q] = R.pick([[1, 2], [1, 3], [2, 3], [-1, 2], [1, 4], [3, 4], [-1, 3], [2, 5]]), a = R.int(1, 6), S1 = fs(a * q, q - p), S2 = fs(a * a * q * q, q * q - p * p);
        return E.num(`An infinite geometric series has sum ${M(S1)}. The squares of its terms have sum ${M(S2)}. Find the first term a and the ratio r.`, [{ label: 'a =', exact: String(a) }, { label: 'r =', exact: fs(p, q) }], `S₁ = a/(1 − r) and S₂ = a²/(1 − r²). Dividing, S₁²/S₂ = (1 + r)/(1 − r) = ${E.pt(fs(q + p, q - p))}, which gives r = ${E.pt(fs(p, q))}; then a = S₁(1 − r) = ${a}.`); }
      const [p, q] = R.pick([[1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [1, 5], [2, 5], [-1, 2], [-1, 3], [1, 6], [1, 10]]), v = fs(p * q, (q - p) ** 2);
      return E.num(`Find ${SIG(1, 'inf', p === 1 ? `n/${q}^n` : `n${rq(p, q)}^n`, '', 'n')}. Give an exact answer.`, [{ exact: v }], `Let x = ${E.pt(fs(p, q))} and S = x + 2x² + 3x³ + …. Then S − xS = x + x² + x³ + … = x/(1 − x), so S = x/(1 − x)² = ${E.pt(v)}.`); } },
  });

  /* IV.13.09 Convergence informally */
  const H = [[1, 1], [3, 2], [11, 6], [25, 12], [137, 60]];
  S('IV.13.09', 'Convergence informally', {
    a: { t: 'partial sums', g: R => { const kind = R.int(0, 2), k = R.int(3, 6);
      if (kind === 0) { const a = R.int(-5, 12), d = nz(R, -4, 6), t = []; for (let j = 0; j < k; j++) t.push(a + j * d);
        return E.num(`For ${M(series(t.slice(0, 3)))} + …, find the partial sum ${SM('S_' + k)}.`, [{ label: ts('S', k) + ' =', ans: t.reduce((x, y) => x + y, 0) }], `${ts('S', k)} adds the first ${k} terms: ${t.map(par).join(' + ')} = ${t.reduce((x, y) => x + y, 0)}.`); }
      if (kind === 1) { const q = R.pick([2, 3]), a = q ** R.int(0, 2) * R.int(1, 3), v = fs(a * (q ** k - 1), q ** (k - 1) * (q - 1)), t = []; for (let j = 0; j < k; j++) t.push(fs(a, q ** j));
        return E.num(`For ${M(t.slice(0, 3).join('+'))} + …, find the partial sum ${SM('S_' + k)}.${v.includes('/') ? ' Give an exact answer.' : ''}`, [{ label: ts('S', k) + ' =', exact: v }], `${ts('S', k)} adds the first ${k} terms: ${t.join(' + ')} = ${E.pt(v)}.`); }
      const t = []; for (let j = 1; j <= k; j++) t.push(`1/${j * (j + 1)}`);
      return E.num(`For ${SIG(1, 'inf', '1/(n(n+1))', '', 'n')}, find the partial sum ${SM('S_' + k)}. Give an exact answer.`, [{ label: ts('S', k) + ' =', exact: fs(k, k + 1) }], `${t.join(' + ')} = ${fs(k, k + 1)}. (The pattern is ${ts('S', 'n')} = n/(n + 1).)`); } },
    b: { t: 'converge vs diverge', g: R => { const conv = R.bool(), kind = R.int(0, 3); let b, why;
      if (conv) {
        if (kind === 0) { const [p, q] = R.pick([[1, 2], [1, 3], [2, 3], [-1, 2], [3, 4], [1, 5], [-2, 3], [4, 5], [3, 5]]), c = R.int(1, 9); b = `${c === 1 ? '' : c}${rq(p, q)}^n`; why = `It is geometric with r = ${E.pt(fs(p, q))}, and |r| < 1.`; }
        else if (kind === 1) { const m = R.int(2, 9), c = R.int(1, 9); b = `${c}/${m}^n`; why = `It is geometric with r = 1/${m}, and |r| < 1.`; }
        else if (kind === 2) { const e = R.pick([2, 3, 4]); b = `1/n^${e}`; why = `Each term is at most 1/n², and the partial sums of Σ1/n² stay below 2 (1/n² ≤ 1/(n(n − 1)) for n ≥ 2, which telescopes). So it converges.`; }
        else { const c = R.int(1, 9); b = `${c === 1 ? '' : c}/(n(n+1))`.replace(/^\//, '1/'); why = `${c}/(n(n + 1)) = ${c}(1/n − 1/(n + 1)) telescopes: the partial sums approach ${c}.`; }
      } else {
        if (kind === 0) { const [p, q] = R.pick([[2, 1], [3, 2], [5, 4], [-1, 1], [1, 1], [-3, 2], [4, 3], [3, 1]]), c = R.int(1, 9); b = q === 1 && p === 1 ? `${c}` : `${c === 1 ? '' : c}(${fs(p, q).includes('/') ? p + '/' + q : p})^n`; why = p === 1 && q === 1 ? `Adding ${c} forever grows without bound.` : `It is geometric with r = ${E.pt(fs(p, q))}, and |r| ≥ 1, so the terms don't shrink to 0.`; }
        else if (kind === 1) { const c = R.int(0, 9); b = c ? `1/(n+${c})` : '1/n'; why = c ? `It is the harmonic series with its first ${c > 1 ? c + ' terms' : 'term'} removed, and the harmonic series grows without bound.` : 'This is the harmonic series: the terms go to 0, but the sum grows without bound.'; }
        else if (kind === 2) { const c = R.int(1, 9); b = `n/(n+${c})`; why = `The terms approach 1, not 0, so adding them grows without bound.`; }
        else { const c = R.int(1, 9); b = R.bool() ? `${c}/sqrt(n)` : `${c}/n`; why = `Each term is at least ${c} × 1/n, and the harmonic series already grows without bound.`; }
      }
      return E.choiceFixed(`Does ${SIG(1, 'inf', b, '', 'n')} converge or diverge?`, ['converges', 'diverges'], conv ? 0 : 1, why); } },
    c: { t: 'harmonic series surprise', g: R => { const kind = R.int(0, 2);
      if (kind === 0) { const Q = [
          ['The terms of 1 + 1/2 + 1/3 + 1/4 + … shrink to 0. What happens to the sum?', 'It grows without bound: it diverges.', ['It converges to 2.', 'It converges, because the terms go to 0.', 'It converges to about 1.6.']],
          ['Which statement is true?', 'If a series converges, its terms must go to 0.', ['If the terms go to 0, the series must converge.', 'Every series with positive terms diverges.', 'The harmonic series converges, just slowly.']],
          ['Each of 1/3 and 1/4 is at least 1/4. So 1/3 + 1/4 is at least…', '1/2', ['1/4', '1/3', '1']],
          ['The partial sums of 1 + 1/2 + 1/3 + … pass 10 only after about 12,000 terms. What does that show?', 'It grows very slowly, but it still grows without bound.', ['It must converge to about 10.', 'It stops growing after 12,000 terms.', 'It converges to 12,000.']],
        ][R.int(0, 3)];
        return E.choice(R, Q[0], Q[1], Q[2], 'Group the terms: 1/3 + 1/4 ≥ 1/2, 1/5 + … + 1/8 ≥ 1/2, and so on. Infinitely many halves, so the harmonic series diverges even though its terms go to 0.'); }
      if (kind === 1) { const m = 2 ** R.int(2, 9);
        return E.num(`In the harmonic series, look at the group ${M(`1/${m + 1}+1/${m + 2}`)} + … + ${M(`1/${2 * m}`)}. How many terms does it have, and what is the smallest term?`, [{ label: 'terms =', ans: m }, { label: 'smallest term =', frac: [1, 2 * m] }], `From ${m + 1} to ${2 * m} there are ${m} terms, each at least 1/${2 * m}. So the group is at least ${m} × 1/${2 * m} = 1/2.`); }
      const j = R.int(3, 20);
      return E.num(`Group the harmonic series as 1 + 1/2 + (1/3 + 1/4) + (1/5 + … + 1/8) + …, with each group after the 1 at least 1/2. What lower bound does this give for the sum of the first ${E.pt('2^' + j)} terms?`, [{ label: 'at least', ans: 1 + j / 2 }], `After the 1 there are ${j} groups up to 1/${E.pt('2^' + j)}, each at least 1/2: 1 + ${j}·(1/2) = ${1 + j / 2}. The bound keeps growing, so the series diverges.`); } },
    d: { t: 'table and graph of partial sums', g: R => { const conv = R.bool(0.6); let Sn = [], opts, right, why, bodyS;
      if (conv) { const [p, q] = R.pick([[1, 2], [1, 3], [-1, 2], [2, 3], [1, 4], [-1, 3]]), a = R.int(1, 6); let s = 0; for (let n = 1; n <= 6; n++) { s += a * (p / q) ** (n - 1); Sn.push(s); }
        const L = fs(a * q, q - p), W1 = fs(a * q, q + p); right = `It converges to ${E.pt(L)}.`; opts = [`It converges to ${a}.`, `It converges to ${E.pt(W1)}.`, 'It diverges.']; bodyS = `${a === 1 ? '' : a}${rq(p, q)}^(n-1)`;
        why = `The partial sums settle down. It is geometric with a = ${a} and r = ${E.pt(fs(p, q))}, so S = a/(1 − r) = ${E.pt(L)}.`; }
      else { const kind = R.int(0, 2); right = 'It diverges.';
        if (kind === 0) { const a = R.int(1, 5), d = R.int(1, 4); let s = 0; for (let n = 1; n <= 6; n++) { s += a + (n - 1) * d; Sn.push(s); } bodyS = E.poly([d, a - d], 'n'); if (a - d) bodyS = `(${bodyS})`; why = 'The partial sums keep growing by more each time, so they never settle: it diverges.'; }
        else if (kind === 1) { let s = 0; for (let n = 1; n <= 6; n++) { s += 1 / n; Sn.push(s); } bodyS = '1/n'; why = 'This is the harmonic series: the partial sums grow slowly but without bound, so it diverges.'; }
        else { const c = R.int(1, 5); for (let n = 1; n <= 6; n++) Sn.push(n % 2 ? c : 0); bodyS = `${c === 1 ? '' : c}(-1)^(n+1)`; why = `The partial sums jump between ${c} and 0 forever and never settle, so it diverges.`; }
        opts = [`It converges to ${fmt(+Sn[5].toFixed(3))}.`, `It converges to ${fmt(+Sn[0].toFixed(3)) === fmt(+Sn[5].toFixed(3)) ? '1/2' : fmt(+Sn[0].toFixed(3))}.`, 'It converges to 0.'].filter(o => o !== right); }
      const tb = `<table class="dt"><tr><th>n</th>${[1, 2, 3, 4, 5, 6].map(n => `<td>${n}</td>`).join('')}</tr><tr><th>Sₙ</th>${Sn.map(s => `<td>${String(+s.toFixed(3)).replace('-', '−')}</td>`).join('')}</tr></table>`;
      const lo = Math.min(0, ...Sn), hi = Math.max(...Sn);
      const vis = V.graph({ x: [0, 7], y: [Math.floor(lo - 1), Math.ceil(hi + 1)], w: 280, h: 200, points: Sn.map((s, i) => [i + 1, s]), label: 'partial sums' });
      return E.choice(R, `The table and graph show the partial sums of ${SIG(1, 'inf', bodyS, '', 'n')}. What happens as n grows?${tb}`, right, opts, why, { visual: vis }); } },
  });
  /* IV.13.10 Special recursive sequences */
  const fib = n => { let a = 1, b = 1; for (let j = 2; j < n; j++) [a, b] = [b, a + b]; return n <= 2 ? 1 : b; };
  const run = (a1, a2, n) => { const t = [a1, a2]; while (t.length < n) t.push(t[t.length - 1] + t[t.length - 2]); return t; };
  S('IV.13.10', 'Special recursive sequences', {
    a: { t: 'Fibonacci', g: R => { if (R.bool()) { const n = R.int(8, 22);
        return E.num(`The Fibonacci numbers have ${SM('F_1=F_2=1')} and ${SM('F_n=F_{n-1}+F_{n-2}')}. Find ${SM('F_{' + n + '}')}.`, [{ label: ts('F', n) + ' =', ans: fib(n) }], `Keep adding the last two: …, ${ts('F', n - 2)} = ${fib(n - 2)}, ${ts('F', n - 1)} = ${fib(n - 1)}, so ${ts('F', n)} = ${fib(n - 2)} + ${fib(n - 1)} = ${fib(n)}.`); }
      let a1, a2; do { a1 = R.int(1, 9); a2 = R.int(1, 12); } while (a1 === 1 && a2 === 1); const k = R.int(6, 9), t = run(a1, a2, k);
      return E.num(`${SM(`a_1=${a1}`)}, ${SM(`a_2=${a2}`)} and each term is the sum of the two before it. Find ${SM('a_' + k)}.`, [{ label: ts('a', k) + ' =', ans: t[k - 1] }], `The terms are ${t.join(', ')}. So ${ts('a', k)} = ${t[k - 1]}.`); } },
    b: { t: 'golden ratio from ratios', g: R => { const kind = R.int(0, 5);
      if (kind === 0) return E.num(`The ratios of consecutive Fibonacci numbers approach the positive solution of ${M('x^2=x+1')}. Find it exactly.`, [{ label: 'φ =', exact: '(1+sqrt(5))/2' }], `x² − x − 1 = 0 gives x = (1 ± √5)/2. The positive one is φ = (1 + √5)/2 ≈ 1.618.`);
      let a1 = 1, a2 = 1; if (kind >= 3) { do { a1 = R.int(1, 9); a2 = R.int(1, 9); } while (a1 === a2); }
      const n = R.int(6, 14), t = run(a1, a2, n + 1), r = t[n] / t[n - 1];
      return E.num(`${kind >= 3 ? `A sequence starts ${seq([a1, a2], false)} and each term is the sum of the two before it` : 'Take the Fibonacci numbers 1, 1, 2, 3, 5, 8, …'}. Divide term ${n + 1} by term ${n}. Round to 3 decimal places.`, [{ label: 'ratio ≈', ans: r, dp: 3 }], `Term ${n} = ${t[n - 1]} and term ${n + 1} = ${t[n]}: ${t[n]} ÷ ${t[n - 1]} ≈ ${r.toFixed(3)}. The ratios close in on φ = (1 + √5)/2 ≈ 1.618, not 2.`); } },
    c: { t: 'triangular and square numbers', g: R => { const kind = R.int(0, 2), n = R.int(5, 40), T = m => m * (m + 1) / 2;
      if (kind === 0) return E.num(`Find the ${th(n)} triangular number, ${SM('T_{' + n + '}')}.`, [{ ans: T(n) }], `${ts('T', n)} = 1 + 2 + … + ${n} = ${n}·${n + 1}/2 = ${T(n)}.`);
      if (kind === 1) return E.num(`Find ${SM(`T_{${n - 1}}+T_{${n}}`)}.`, [{ ans: n * n }], `${T(n - 1)} + ${T(n)} = ${n * n} = ${n}². Two neighboring triangles always fit together into a square.`);
      return E.num(`Find ${SM(`8T_{${n}}+1`)}.`, [{ ans: 8 * T(n) + 1 }], `8·${T(n)} + 1 = ${8 * T(n) + 1} = ${2 * n + 1}². In general 8Tₙ + 1 = 4n² + 4n + 1 = (2n + 1)².`); } },
    d: { t: 'find patterns', g: R => { const kind = R.int(0, 5), s = R.int(1, 5); let f, why;
      if (kind === 0) { f = j => j * (j + 1) / 2; why = 'Triangular numbers: the gaps grow by 1 each time.'; }
      else if (kind === 1) { f = j => j * j; why = 'Square numbers: the gaps are the odd numbers.'; }
      else if (kind === 2) { f = j => j ** 3; why = 'Cube numbers.'; }
      else if (kind === 3) { let a1, a2; do { a1 = R.int(1, 9); a2 = R.int(2, 12); } while (a1 === a2); const t = run(a1, a2, 12); f = j => t[j - s]; why = 'Each term is the sum of the two before it.'; }
      else if (kind === 4) { const a = R.int(1, 3), b = R.int(-3, 4), c = R.int(-5, 5); f = j => a * j * j + b * j + c; why = `The second differences are all ${2 * a}, so the next gap is ${2 * a} more than the last.`; }
      else { f = j => 2 ** j - 1; why = 'Each term is double the last plus 1 (one less than a power of 2).'; }
      const t = [0, 1, 2, 3, 4].map(j => f(s + j));
      return E.num(`What comes next: ${seq(t, false)}, … ?`, [{ ans: f(s + 5) }], `${why} Next: ${f(s + 5)}.`); } },
  });

  /* IV.13.11 Sums of powers */
  const S1 = n => n * (n + 1) / 2, S2 = n => n * (n + 1) * (2 * n + 1) / 6, S3 = n => S1(n) ** 2;
  S('IV.13.11', 'Sums of powers', {
    a: { t: 'sum of 1 to n: n(n + 1)/2', g: R => { const t = R.int(0, 2);
      if (t === 0) { const n = R.int(10, 200); return E.num(`Use ${SIG(1, 'n', 'k', '=n(n+1)/2')} to evaluate ${SIG(1, n, 'k')}.`, [{ ans: S1(n) }], `${n} · ${n + 1} / 2 = ${n * (n + 1)} / 2 = ${S1(n)}.`); }
      if (t === 1) { const m = R.int(5, 40), n = m + R.int(10, 60);
        return E.num(`Evaluate ${SIG(m, n, 'k')}.`, [{ ans: S1(n) - S1(m - 1) }], `Take the sum from 1 to ${n} and remove the sum from 1 to ${m - 1}: ${S1(n)} − ${S1(m - 1)} = ${S1(n) - S1(m - 1)}.`); }
      const c = R.pick([2, 3, 4, 5, -2, -3]), n = R.int(10, 60);
      return E.num(`Evaluate ${SIG(1, n, c + 'k')}.`, [{ ans: c * S1(n) }], `Factor out ${par(c)}: ${par(c)} · ${n} · ${n + 1}/2 = ${par(c)} · ${S1(n)} = ${c * S1(n)}.`); } },
    b: { t: 'sum of squares: n(n + 1)(2n + 1)/6', g: R => { const t = R.int(0, 2);
      if (t === 0) { const n = R.int(5, 40); return E.num(`Use ${SIG(1, 'n', 'k^2', '=(n(n+1)(2n+1))/6')} to evaluate ${SIG(1, n, 'k^2')}.`, [{ ans: S2(n) }], `${n} · ${n + 1} · ${2 * n + 1} / 6 = ${n * (n + 1) * (2 * n + 1)} / 6 = ${S2(n)}.`); }
      if (t === 1) { const n = R.int(6, 25); return E.num(`Find ${M('1^2+2^2+3^2')} + … + ${M(`${n}^2`)}.`, [{ ans: S2(n) }], `This is ${SIG(1, n, 'k^2')} = ${n} · ${n + 1} · ${2 * n + 1} / 6 = ${S2(n)}.`); }
      const m = R.int(4, 15), n = m + R.int(5, 20);
      return E.num(`Evaluate ${SIG(m, n, 'k^2')}.`, [{ ans: S2(n) - S2(m - 1) }], `Sum of squares to ${n} minus sum of squares to ${m - 1}: ${S2(n)} − ${S2(m - 1)} = ${S2(n) - S2(m - 1)}.`); } },
    c: { t: 'sum of cubes: (n(n + 1)/2)²', g: R => { const t = R.int(0, 2);
      if (t === 0) { const n = R.int(4, 30); return E.num(`Use ${SIG(1, 'n', 'k^3', '=(n(n+1)/2)^2')} to evaluate ${SIG(1, n, 'k^3')}.`, [{ ans: S3(n) }], `n(n + 1)/2 = ${S1(n)}, and ${S1(n)}² = ${S3(n)}.`); }
      if (t === 1) { const n = R.int(4, 15); return E.num(`For n = ${n}, find ${SIG(1, n, 'k')} and ${SIG(1, n, 'k^3')}.`, [{ label: 'Σk =', ans: S1(n) }, { label: 'Σk³ =', ans: S3(n) }], `Σk = ${n} · ${n + 1}/2 = ${S1(n)}. The sum of cubes is its square: ${S1(n)}² = ${S3(n)}.`); }
      const m = R.int(3, 8), n = m + R.int(3, 8);
      return E.num(`Evaluate ${SIG(m, n, 'k^3')}.`, [{ ans: S3(n) - S3(m - 1) }], `Cubes to ${n} minus cubes to ${m - 1}: ${S1(n)}² − ${S1(m - 1)}² = ${S3(n)} − ${S3(m - 1)} = ${S3(n) - S3(m - 1)}.`); } },
    d: { t: 'mix them: Σ(ak² + bk + c)', g: R => { const t = R.int(0, 2), n = R.int(5, 20);
      if (t === 0) return E.num(`Evaluate ${SIG(1, n, 'k(k+1)')}.`, [{ ans: S2(n) + S1(n) }], `k(k + 1) = k² + k, so the sum is Σk² + Σk = ${S2(n)} + ${S1(n)} = ${S2(n) + S1(n)}.`);
      if (t === 1) { const v = 4 * S2(n) - 4 * S1(n) + n; return E.num(`Evaluate ${SIG(1, n, '(2k-1)^2')}.`, [{ ans: v }], `(2k − 1)² = 4k² − 4k + 1, so the sum is 4 · ${S2(n)} − 4 · ${S1(n)} + ${n} = ${v}.`); }
      const a = R.pick([1, 2, 3]), b = R.pick([-6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6]), c = R.pick([-9, -7, -5, -3, -2, -1, 1, 2, 4, 6, 8]), v = a * S2(n) + b * S1(n) + c * n;
      return E.num(`Evaluate ${SIG(1, n, '(' + E.poly([a, b, c], 'k') + ')')}.`, [{ ans: v }], `Split it: ${a === 1 ? '' : a + ' · '}Σk² ${b < 0 ? '−' : '+'} ${Math.abs(b)} · Σk ${c < 0 ? '−' : '+'} ${Math.abs(c)} · ${n} = ${a === 1 ? '' : a + ' · '}${S2(n)} ${b < 0 ? '−' : '+'} ${Math.abs(b * S1(n))} ${c < 0 ? '−' : '+'} ${Math.abs(c * n)} = ${v}.`); } },
  });

  /* IV.13.12 Pascal's triangle */
  const row = n => { const r = []; for (let k = 0; k <= n; k++) r.push(cb(n, k)); return r; };
  S('IV.13.12', "Pascal's triangle", {
    a: { t: 'build it', g: R => { const n = R.int(4, 9), j = R.int(1, n), r1 = row(n + 1).map(String); r1[j] = '□';
      return E.num(`Row ${n} of Pascal's triangle is ${M(row(n).join(', '))}. Fill in the missing entry of row ${n + 1}: ${M(r1.join(', '))}.`, [{ ans: cb(n + 1, j) }], `Each entry is the sum of the two above it: ${cb(n, j - 1)} + ${cb(n, j)} = ${cb(n + 1, j)}.`); } },
    b: { t: 'patterns in rows', g: R => { const kind = R.int(0, 3), n = R.int(5, 30);
      if (kind === 0) return E.num(`Rows of Pascal's triangle are numbered from row 0. How many entries does row ${n} have?`, [{ ans: n + 1 }], `Row n has n + 1 entries (row 0 is just 1), so row ${n} has ${n + 1}.`);
      if (kind === 1) return E.num(`Rows and entries of Pascal's triangle are numbered from 0. What is entry 1 (the second entry) of row ${n}?`, [{ ans: n }], `Row n begins 1, n, …, so the second entry of row ${n} is ${n}.`);
      if (kind === 2) return E.num(`Rows and entries of Pascal's triangle are numbered from 0. What is entry 2 (the third entry) of row ${n}?`, [{ ans: n * (n - 1) / 2 }], `The third entries are the triangular numbers: C(${n}, 2) = ${n}·${n - 1}/2 = ${n * (n - 1) / 2}.`);
      const k = R.int(1, Math.floor(n / 2) - 1 || 1);
      return E.num(`Entries of Pascal's triangle are numbered from 0. Row ${n} is symmetric, so entry ${k} equals which other entry?`, [{ label: 'entry', ans: n - k }], `Row ${n} reads the same from both ends: entry ${k} matches entry ${n} − ${k} = ${n - k}.`); } },
    c: { t: 'link to combinations', g: R => { let n, k; do { n = R.int(5, 14); k = R.int(2, n - 2); } while (cb(n, k) > 3432);
      const thing = R.pick(['books', 'pizza toppings', 'players', 'songs', 'questions', 'colors']);
      return E.num(`In how many ways can you choose ${k} of ${n} different ${thing}? This is ${MB(n, k)}, entry ${k} of row ${n} of Pascal's triangle.`, [{ ans: cb(n, k) }], `C(${n}, ${k}) = ${n}!/(${k}!·${n - k}!) = ${cb(n, k)}, which is entry ${k} of row ${n} (counting from 0).`); } },
    d: { t: 'row sums as powers of 2', g: R => { const kind = R.int(0, 2), n = R.int(5, 15);
      if (kind === 0) return E.num(`What is the sum of all the entries in row ${n} of Pascal's triangle?`, [{ ans: 2 ** n }], `Row sums double each row: row n adds to ${E.pt('2^n')}, so row ${n} adds to ${E.pt('2^' + n)} = ${2 ** n}.`.replace('2^n', '2ⁿ'));
      if (kind === 1) return E.num(`Which row of Pascal's triangle has entries adding to ${2 ** n}?`, [{ label: 'row', ans: n }], `Row n adds to 2ⁿ, and ${2 ** n} = ${E.pt('2^' + n)}, so it is row ${n}.`);
      return E.num(`In row ${n} of Pascal's triangle, what is the sum of all the entries except the two 1s at the ends?`, [{ ans: 2 ** n - 2 }], `The whole row adds to ${E.pt('2^' + n)} = ${2 ** n}; remove the two 1s: ${2 ** n - 2}.`); } },
    e: { t: 'hockey stick or run backwards', g: R => { if (R.bool()) { const r = R.int(1, 3), n = R.int(r + 4, 12);
        return E.num(`Find ${M(`${cb(r, r)}+${cb(r + 1, r)}+${cb(r + 2, r)}`)} + … + ${M(String(cb(n, r)))}, the sum of the entries ${MB('k', r)} for k = ${r} to ${n}.`, [{ ans: cb(n + 1, r + 1) }], `Hockey stick: a run down a diagonal of Pascal's triangle adds up to the entry just below and to the side, so C(${r}, ${r}) + … + C(${n}, ${r}) = C(${n + 1}, ${r + 1}) = ${cb(n + 1, r + 1)}.`); }
      const n = R.int(6, 40), V = cb(n, 2);
      return E.num(`For which n is ${MB('n', 2)} = ${V}?`, [{ label: 'n =', ans: n }], `n(n − 1)/2 = ${V} gives n² − n − ${2 * V} = 0, so (n − ${n})(n + ${n - 1}) = 0 and n = ${n}.`); } },
    f: { t: 'hidden patterns', g: R => { const kind = R.int(0, 2);
      if (kind === 0) { const n = R.int(10, 63); let r = [1]; for (let j = 1; j <= n; j++) { const nr = [1]; for (let k = 1; k < j; k++) nr.push((r[k - 1] + r[k]) % 2); nr.push(1); r = nr; } const odd = r.filter(x => x === 1).length, bin = n.toString(2), ones = [...bin].filter(c => c === '1').length;
        if (odd !== 2 ** ones) throw new Error('IV.13.12f');
        return E.num(`How many odd numbers are in row ${n} of Pascal's triangle?`, [{ ans: odd }], `Write ${n} in binary: ${bin}, with ${ones} ones. Row n has 2 to the power (number of 1s in binary) odd entries, so ${E.pt('2^' + ones)} = ${odd}. (Check: row 3 = 1 3 3 1 has 2² = 4.)`); }
      if (kind === 1) { const n = R.int(3, 9), sq = row(n);
        return E.num(`Find the sum of the squares of the entries in row ${n} of Pascal's triangle: ${M(sq.slice(0, 3).map(x => x + '^2').join('+'))} + … + ${M('1^2')}.`, [{ ans: cb(2 * n, n) }], `Choose ${n} people from ${n} men and ${n} women: k men and ${n} − k women gives C(${n}, k)·C(${n}, ${n} − k) = C(${n}, k)². So the sum is C(${2 * n}, ${n}) = ${cb(2 * n, n)}.`); }
      const n = R.int(5, 14);
      return E.num(`In row ${n} of Pascal's triangle, add the entries in even positions: entries 0, 2, 4, …. What is the total?`, [{ ans: 2 ** (n - 1) }], `The whole row adds to ${E.pt('2^' + n)}, and the alternating sum 1 − ${n} + ${cb(n, 2)} − … is 0. So the even and odd positions each hold half: ${E.pt('2^' + (n - 1))} = ${2 ** (n - 1)}.`); } },
  });

  /* IV.13.13 Binomial theorem */
  const pw = (v, e) => e === 0 ? '' : e === 1 ? v : `${v}^${e}`;
  S('IV.13.13', 'Binomial theorem', {
    a: { t: 'coefficients from Pascal', g: R => { const n = R.int(4, 8), k = R.int(1, n - 1);
      return E.num(`In the expansion of ${M(`(a+b)^${n}`)}, what is the coefficient of ${M(pw('a', n - k) + pw('b', k))}?`, [{ ans: cb(n, k) }], `The coefficients are row ${n} of Pascal's triangle: ${row(n).join(', ')}. The term with ${E.pt(pw('b', k))} uses entry ${k}: ${cb(n, k)}.`); } },
    b: { t: 'expand (a + b)ⁿ', g: R => { if (R.bool(0.7)) { const n = R.pick([3, 3, 4, 4, 5]), c = n === 3 ? R.pick([1, 2, 3, 4, -1, -2, -3, -4]) : n === 4 ? R.pick([1, 2, 3, -1, -2, -3]) : R.pick([1, 2, -1, -2]), co = row(n).map((x, k) => x * c ** k), ex = E.poly(co);
        return E.num(`Expand ${M(`(x${c > 0 ? '+' : ''}${c})^${n}`)}.`, [{ expr: ex, form: 'expanded' }], `Row ${n} of Pascal (${row(n).join(', ')}) with powers of ${par(c)}: ${E.pt(ex)}.`); }
      const n = R.int(3, 5), neg = R.bool(), ex = row(n).map((x, k) => `${neg && k % 2 ? '-' : '+'}${x === 1 ? '' : x}${pw('a', n - k)}${pw('b', k)}`).join('').replace(/^\+/, '');
      return E.num(`Expand ${M(`(a${neg ? '-' : '+'}b)^${n}`)}.`, [{ expr: ex, form: 'expanded' }], `Row ${n} of Pascal gives the coefficients ${row(n).join(', ')}; powers of a go down while powers of ${neg ? '(−b)' : 'b'} go up${neg ? ', so the signs alternate' : ''}: ${E.pt(ex)}.`); } },
    c: { t: 'find a specific term', g: R => { const n = R.int(5, 9), c = R.pick([1, 2, 3, -1, -2, -3]), k = R.int(Math.max(1, n - 4), n - 1), v = cb(n, k) * c ** (n - k);
      return E.num(`What is the coefficient of ${M(pw('x', k))} in the expansion of ${M(`(x${c > 0 ? '+' : ''}${c})^${n}`)}?`, [{ ans: v }], `The term is C(${n}, ${n - k})·${E.pt(pw('x', k))}·${par(c)}${E.pt('^' + (n - k))}, so the coefficient is ${cb(n, k)} × ${par(c ** (n - k))} = ${v}.`); } },
    d: { t: 'with negatives and coefficients', g: R => { if (R.bool()) { let a, b, n, k, v; do { a = R.pick([2, 3]); b = R.pick([-1, -2, -3]); n = R.int(4, 7); k = R.int(1, n - 1); v = cb(n, k) * a ** k * b ** (n - k); } while (Math.abs(v) > 20000);
        return E.num(`What is the coefficient of ${M(pw('x', k))} in ${M(`(${a}x${b})^${n}`)}?`, [{ ans: v }], `The term is C(${n}, ${k})·(${a}x)${E.pt('^' + k)}·(${b})${E.pt('^' + (n - k))}: ${cb(n, k)} × ${a ** k} × ${par(b ** (n - k))} = ${v}. Both the ${a} and the ${b} get raised to powers.`); }
      const a = R.pick([2, 3]), b = R.pick([1, 2, 3, -1, -2, -3]), co = [1, 3, 3, 1].map((x, k) => x * a ** (3 - k) * b ** k), ex = E.poly(co);
      return E.num(`Expand ${M(`(${a}x${b > 0 ? '+' : ''}${b})^3`)}.`, [{ expr: ex, form: 'expanded' }], `Use 1, 3, 3, 1 with (${a}x)³, (${a}x)², ${a}x and powers of ${par(b)}: ${E.pt(ex)}.`); } },
    e: { t: 'the constant term', g: R => { const kind = R.int(0, 2); let p, q, n, c, v, k;
      do { if (kind === 0) { p = 1; q = 1; n = R.pick([4, 6, 8]); } else if (kind === 1) { p = 2; q = 1; n = R.pick([3, 6]); } else { p = 1; q = 2; n = R.pick([3, 6, 9]); } c = R.pick([1, 2, 3, -1, -2, -3]); k = p * n / (p + q); v = cb(n, k) * c ** k; } while (Math.abs(v) > 50000);
      const lead = pw('x', p), den = pw('x', q);
      return E.num(`What is the constant term in the expansion of ${M(`(${lead}${c > 0 ? '+' : '-'}${Math.abs(c)}/${den})^${n}`)}?`, [{ ans: v }], `A general term is C(${n}, k)(${E.pt(lead)})ⁿ⁻ᵏ(${c}/${E.pt(den)})ᵏ, with power of x equal to ${p === 1 ? '' : p}(${n} − k) − ${q === 1 ? '' : q}k. That is 0 when k = ${k}: C(${n}, ${k})·${par(c)}${E.pt('^' + k)} = ${cb(n, k)} × ${par(c ** k)} = ${v}.`.replace('ⁿ⁻ᵏ', '^(' + n + ' − k)').replace('1 × ', '')); } },
    f: { t: 'binomial tricks', g: R => { const kind = R.int(0, 3);
      if (kind <= 1) { let a, b, n, v; do { a = R.int(2, 4); b = nz(R, -3, 3); n = R.int(5, 9); v = kind === 0 ? (a + b) ** n : ((a + b) ** n + (b - a) ** n) / 2; } while (Math.abs(a + b) > 3 || Math.abs(b - a) > 5 || a + b === 0 || Math.abs(v) > 100000);
        const P = M(`(${a}x${b > 0 ? '+' : ''}${b})^${n}`);
        if (kind === 0) return E.num(`What is the sum of all the coefficients in the expansion of ${P}?`, [{ ans: v }], `Put x = 1: every term becomes just its coefficient, so the sum is (${a} ${sgn(b)})${E.pt('^' + n)} = ${par(a + b)}${E.pt('^' + n)} = ${v}.`);
        return E.num(`In the expansion of ${P}, what is the sum of the coefficients of the even powers of x (including the constant)?`, [{ ans: v }], `f(1) = ${par(a + b)}${E.pt('^' + n)} = ${(a + b) ** n} adds all coefficients; f(−1) = ${par(b - a)}${E.pt('^' + n)} = ${(b - a) ** n} flips the odd ones. Averaging: (${(a + b) ** n} + ${par((b - a) ** n)})/2 = ${v}.`); }
      if (kind === 2) { const m = R.int(1, 9), n = R.int(10, 99), v = (1 + 10 * m * n) % 100;
        return E.num(`What are the last two digits of ${M(`${10 * m + 1}^${n}`)}? Answer as a number from 0 to 99.`, [{ ans: v }], `(1 + ${10 * m})${E.pt('^' + n)} = 1 + ${n}·${10 * m} + C(${n}, 2)·${10 * m}² + …, and every term after the second is a multiple of 100. So the last two digits come from 1 + ${10 * m * n} = ${1 + 10 * m * n}: ${String(v).padStart(2, '0')}.`); }
      let n, k, p, q; do { n = R.int(6, 20); k = R.int(1, n - 2); const g = gcd(k + 1, n - k); p = (k + 1) / g; q = (n - k) / g; } while (p === q || p > 9 || q > 9);
      return E.num(`In the expansion of ${M('(1+x)^n')}, the coefficients of ${M(pw('x', k))} and ${M(pw('x', k + 1))} are in the ratio ${p} : ${q}. Find n.`, [{ label: 'n =', ans: n }], `C(n, ${k + 1})/C(n, ${k}) = (n − ${k})/${k + 1} = ${q}/${p}, so n − ${k} = ${(k + 1) * q / p} and n = ${n}. Check: ${cb(n, k)} : ${cb(n, k + 1)} = ${p} : ${q}.`); } },
  });

  /* IV.13.14 Series in money */
  const MR = [[6, 0.005], [12, 0.01], [3.6, 0.003], [4.8, 0.004], [2.4, 0.002], [9, 0.0075]];     // annual % → monthly rate
  const fv = (P, i, n) => P * ((1 + i) ** n - 1) / i;
  S('IV.13.14', 'Series in money', {
    a: { t: 'savings plans', g: R => { const P = R.pick([250, 500, 1000, 1200, 2000]), r = R.int(2, 6), n = R.int(3, 5), i = r / 100, v = fv(P, i, n);
      return E.num(`You deposit $${P} at the end of each year into an account paying ${r}% a year. How much is in the account right after the ${th(n)} deposit? Round to the nearest cent.`, [{ label: 'balance = $', ans: +v.toFixed(2), dp: 2 }], `The first deposit grows for ${n - 1} years, the last for none: ${P}(${fmt(1 + i)})${E.pt('^' + (n - 1))} + … + ${P}(${fmt(1 + i)}) + ${P} = ${P}·((${fmt(1 + i)})${E.pt('^' + n)} − 1)/${fmt(i)} ≈ ${money(v)}.`); } },
    b: { t: 'loan payments', g: R => { const L = R.pick([1000, 2000, 5000, 800, 1500]), [r, i] = R.pick(MR), Mp = R.pick([100, 150, 200, 250]), n = R.pick([2, 3]); let B = L; const steps = []; for (let j = 0; j < n; j++) { B = B * (1 + i) - Mp; steps.push(B); }
      return E.num(`You borrow $${L} at ${r}% a year, charged monthly (${fmt(i * 100)}% a month). Each month interest is added, then you pay $${Mp}. What do you owe after ${n} payments? Round to the nearest cent.`, [{ label: 'balance = $', ans: +B.toFixed(2), dp: 2 }], `Month by month: ${steps.map(money).join(', then ')}. As a series: ${L}(${fmt(1 + i)})${E.pt('^' + n)} − ${Mp}(${n === 2 ? '1 + ' + fmt(1 + i) : '1 + ' + fmt(1 + i) + ' + ' + fmt(1 + i) + '²'}) ≈ ${money(B)}.`); } },
    c: { t: 'annuity formula', g: R => { const P = R.pick([50, 100, 200, 250, 400]), [r, i] = R.pick(MR), y = R.pick([5, 10, 15, 20]), n = 12 * y, v = fv(P, i, n);
      return E.num(`You save $${P} at the end of every month for ${y} years at ${r}% a year compounded monthly. How much do you have at the end? Round to the nearest cent.`, [{ label: 'total = $', ans: +v.toFixed(2), dp: 2 }], `i = ${r}%/12 = ${fmt(i)} and n = ${n} deposits. FV = P((1 + i)ⁿ − 1)/i = ${P}(${fmt(1 + i)}${E.pt('^' + n)} − 1)/${fmt(i)} ≈ ${money(v)}. Each deposit grows for a different time, so it is not ${P}·${fmt(1 + i)}${E.pt('^' + n)}.`); } },
    d: { t: 'compare plans', g: R => { const wantA = R.bool(); let L, P, r, n, A, B;
      do { r = R.int(3, 8); n = R.pick([5, 10, 15, 20]); P = R.pick([1000, 2000, 3000, 5000]); L = Math.round(P * n * R.pick([0.5, 0.6, 0.7, 0.8, 0.9]) / 1000) * 1000; A = L * (1 + r / 100) ** n; B = fv(P, r / 100, n); } while ((A > B) !== wantA || Math.abs(A - B) / Math.max(A, B) < 0.03 || L <= 0);
      return E.choiceFixed(`Both earn ${r}% a year compounded yearly. Plan A: invest $${L.toLocaleString('en-US')} once, now. Plan B: invest $${P.toLocaleString('en-US')} at the end of each year for ${n} years. Which is worth more after ${n} years?`, ['Plan A', 'Plan B'], A > B ? 0 : 1, `Plan A: ${L}·${fmt(1 + r / 100)}${E.pt('^' + n)} ≈ ${money(A)}. Plan B: ${P}·(${fmt(1 + r / 100)}${E.pt('^' + n)} − 1)/${fmt(r / 100)} ≈ ${money(B)}. ${A > B ? 'Plan A' : 'Plan B'} wins.`); } },
  });
})(typeof window !== 'undefined' ? window : globalThis);
