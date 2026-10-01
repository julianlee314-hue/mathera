/* Era IV · Unit IV.6 Polynomials (IV.6.01–IV.6.16) */
(function (G) {
  const E = G.E4, V = E.V, C = E.C, M = s => E.mx(s);
  const nz = (R, lo, hi) => { let v; do v = R.int(lo, hi); while (v === 0); return v; };
  const sg = n => n < 0 ? `− ${-n}` : `+ ${n}`;
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
  const gcdA = arr => arr.reduce((g, c) => gcd(g, c), 0);
  const pt = s => E.pt(s);
  const par = n => n < 0 ? `(${n})` : String(n);
  // coefficient arrays, highest power first
  const P = (co, v = 'x') => E.poly(co, v);
  const mono = (c, k, v = 'x') => E.poly([c, ...Array(k).fill(0)], v);
  const mul = (A, B) => { const r = Array(A.length + B.length - 1).fill(0); A.forEach((a, i) => B.forEach((b, j) => { r[i + j] += a * b; })); return r; };
  const pad = (A, n) => [...Array(Math.max(0, n - A.length)).fill(0), ...A];
  const add = (A, B) => { const n = Math.max(A.length, B.length), a = pad(A, n), b = pad(B, n); return a.map((x, i) => x + b[i]); };
  const neg = A => A.map(x => -x);
  const trim = A => { let i = 0; while (i < A.length - 1 && A[i] === 0) i++; return A.slice(i); };
  const at = (A, x) => A.reduce((s, c) => s * x + c, 0);
  const terms = A => A.map((c, i) => [c, A.length - 1 - i]).filter(t => t[0] !== 0);          // [[c, power], …]
  const join = ts => ts.map(([c, k], i) => { const s = mono(c, k); return i === 0 || c < 0 ? s : '+' + s; }).join('') || '0';
  const signed = s => s.startsWith('-') ? s : '+' + s;                                        // "+3x" / "-3x" for gluing
  // two-variable monomial c·x^a·y^b and sums of them
  const mv = (c, a, b = 0) => { const v = (a ? 'x' + (a > 1 ? '^' + a : '') : '') + (b ? 'y' + (b > 1 ? '^' + b : '') : ''); if (!v) return String(c); return (c === 1 ? '' : c === -1 ? '-' : String(c)) + v; };
  const mvJoin = ts => ts.map((t, i) => { const s = mv(...t); return i === 0 || t[0] < 0 ? s : '+' + s; }).join('');
  const bin = (p, q, v = 'x') => `(${P([p, q], v)})`;
  const box = (top, left, cells) => `<table class="dt"><tr><th>×</th>${top.map(t => `<th>${M(t)}</th>`).join('')}</tr>${left.map((l, i) => `<tr><th>${M(l)}</th>${cells[i].map(c => `<td>${c === null ? '□' : c === '' ? '&nbsp;' : M(c)}</td>`).join('')}</tr>`).join('')}</table>`;
  const yn = (prompt, yes, explain, extra) => E.choiceFixed(prompt, ['Yes', 'No'], yes ? 0 : 1, explain, extra);
  const isSq = n => n >= 0 && Number.isInteger(Math.sqrt(n));
  const S = (id, name, steps) => E.skill({ id, name, steps });

  /* IV.6.01 Polynomial vocabulary */
  const DEG = ['constant', 'linear', 'quadratic', 'cubic', 'quartic', 'quintic'], TRM = ['', 'monomial', 'binomial', 'trinomial'];
  S('IV.6.01', 'Polynomial vocabulary', {
    a: { t: 'terms and coefficients', g: R => {
      const d = R.int(2, 4); let ts;
      do { ts = []; for (let k = d; k >= 0; k--) if (k === d || R.bool(0.7)) ts.push([k === d ? nz(R, -9, 9) : R.pick([nz(R, -9, 9), 1, -1]), k]); } while (ts.length < 3);
      const shown = join(R.shuffle(ts.slice())), ask = R.int(0, 2), missing = [...Array(d).keys()].filter(k => k > 0 && !ts.some(t => t[1] === k));
      if (ask === 0) {
        if (missing.length && R.bool(0.2)) { const k = R.pick(missing); return E.num(`What is the coefficient of ${M(mono(1, k))} in ${M(shown)}?`, [{ ans: 0 }], `There is no ${pt(mono(1, k))} term, so its coefficient is 0.`); }
        const [c, k] = R.pick(ts.filter(t => t[1] > 0));
        return E.num(`What is the coefficient of ${M(mono(1, k))} in ${M(shown)}?`, [{ ans: c }], `The ${pt(mono(1, k))} term is ${pt(mono(c, k))}, so its coefficient is ${c}${Math.abs(c) === 1 ? ' (a bare ' + (c < 0 ? '−' : '') + pt(mono(1, k)) + ' means ' + c + ')' : ''}.`);
      }
      if (ask === 1) { const c0 = (ts.find(t => t[1] === 0) || [0])[0];
        return E.num(`What is the constant term of ${M(shown)}?`, [{ ans: c0 }], c0 ? `The term with no x is ${c0}, sign included.` : `Every term has an x, so the constant term is 0.`); }
      return E.num(`How many terms does ${M(shown)} have?`, [{ ans: ts.length }], `Terms are separated by + and − signs: ${ts.map(([c, k]) => pt(mono(c, k))).join(', ')}. That is ${ts.length} terms.`); } },
    b: { t: 'degree', g: R => { const kind = R.pick([0, 0, 1, 1, 2, 2, 3]);
      if (kind === 0) { const d = R.int(2, 7); let ts; do { ts = [[nz(R, -9, 9), d]]; for (let k = d - 1; k >= 0; k--) if (R.bool(0.45)) ts.push([nz(R, -9, 9), k]); } while (ts.length < 3);
        return E.num(`What is the degree of ${M(join(R.shuffle(ts)))}?`, [{ ans: d }], `The degree is the highest power of x: ${pt(mono(1, d))}, so the degree is ${d}.`); }
      if (kind === 1) { const c = nz(R, -9, 9), a = R.int(1, 5), b = R.int(1, 5);
        return E.num(`What is the degree of the monomial ${M(mv(c, a, b))}?`, [{ ans: a + b }], `For a monomial, add the exponents: ${a} + ${b} = ${a + b}.`); }
      if (kind === 2) { let ts; do { ts = [0, 1, 2].map(() => [nz(R, -9, 9), R.int(0, 4), R.int(0, 4)]).filter(t => t[1] + t[2] > 0); } while (ts.length < 2 || new Set(ts.map(t => t[1] + t[2])).size !== ts.length || new Set(ts.map(t => t[1] + ',' + t[2])).size !== ts.length);
        const ds = ts.map(t => t[1] + t[2]), d = Math.max(...ds);
        return E.num(`What is the degree of ${M(mvJoin(ts))}?`, [{ ans: d }], `Each term's degree is the sum of its exponents: ${ds.join(', ')}. The highest is ${d}.`); }
      if (R.bool()) { const n = nz(R, -20, 20); return E.num(`What is the degree of the polynomial ${M(String(n))}?`, [{ ans: 0 }], `A nonzero constant is ${n}·x⁰, so its degree is 0.`); }
      const c = nz(R, -12, 12); return E.num(`What is the degree of ${M(mono(c, 1))}?`, [{ ans: 1 }], `${pt(mono(c, 1))} is ${c}·x¹, so its degree is 1.`); } },
    c: { t: 'standard form', g: R => { const d = R.int(3, 5); let ks; do ks = R.sample([...Array(d).keys()], 3); while (false); ks = [d, ...ks].sort((a, b) => b - a);
      const ts = ks.map(k => [nz(R, -9, 9), k]); let sh; do sh = R.shuffle(ts.slice()); while (sh.every((t, i) => t === ts[i]));
      if (R.bool(0.6)) {
        const right = join(ts), asc = join(ts.slice().reverse()); const others = new Set([asc, join(sh)]);
        let guard = 0; while (others.size < 4 && guard++ < 50) { const p = join(R.shuffle(ts.slice())); if (p !== right) others.add(p); }
        return E.choice(R, `Which shows ${M(join(sh))} in standard form?`, M(right), [...others].filter(s => s !== right).slice(0, 3).map(M), `Standard form lists the terms from the highest power down: ${M(right)}.`);
      }
      return E.num(`What is the leading coefficient of ${M(join(sh))}?`, [{ ans: ts[0][0] }], `In standard form the first term is ${pt(mono(ts[0][0], d))}, the highest power, so the leading coefficient is ${ts[0][0]}.`); } },
    d: { t: 'name by degree and terms', g: R => { const d = R.int(0, 5), n = R.int(1, Math.min(3, d + 1));
      let ks = n === 1 ? [d] : [d, ...R.sample([...Array(d).keys()], n - 1)]; const ts = ks.sort((a, b) => b - a).map(k => [nz(R, -9, 9), k]);
      const right = `${DEG[d]} ${TRM[n]}`, cand = [];
      [d - 2, d - 1, d + 1, d + 2, d + 3].forEach(e => { if (e >= 0 && e <= 5 && n <= e + 1) cand.push(`${DEG[e]} ${TRM[n]}`); });
      [1, 2, 3].forEach(m => { if (m !== n && m <= d + 1) cand.push(`${DEG[d]} ${TRM[m]}`); });
      if (d >= 1 && d <= 3 && n !== d && d <= n + 1) cand.push(`${DEG[n]} ${TRM[d]}`);
      return E.choice(R, `Name ${M(join(R.shuffle(ts)))} by its degree and number of terms.`, right, R.sample([...new Set(cand)].filter(c => c !== right), 3), `Degree ${d} makes it ${DEG[d]}; ${n} term${n > 1 ? 's' : ''} make${n > 1 ? '' : 's'} it a ${TRM[n]}.`); } },
  });

  /* IV.6.02 Add & subtract polynomials */
  const groupStr = (A, B) => { const n = Math.max(A.length, B.length), a = pad(A, n), b = pad(B, n); let s = '';
    for (let i = 0; i < n; i++) { const k = n - 1 - i, list = [[a[i], k], [b[i], k]].filter(t => t[0]); if (!list.length) continue;
      if (list.length === 1) { const t = mono(list[0][0], k); s += s ? signed(t) : t; } else s += (s ? '+' : '') + '(' + join(list) + ')'; }
    return s; };
  const quad = R => [nz(R, -6, 6), R.int(-9, 9), R.int(-9, 9)];
  S('IV.6.02', 'Add & subtract polynomials', {
    a: { t: 'combine like terms', g: R => { let A, B, Sm; do { A = quad(R); B = quad(R); Sm = add(A, B); } while (!Sm[0] || terms(Sm).length < 2);
      if (R.bool()) return E.num(`Simplify ${M(`(${P(A)})+(${P(B)})`)}.`, [{ expr: P(Sm), form: 'simplified' }], `Group like terms: ${pt(groupStr(A, B))} = ${pt(P(Sm))}.`);
      const all = R.shuffle([...terms(A), ...terms(B)]);
      return E.num(`Simplify ${M(join(all))} by combining like terms.`, [{ expr: P(Sm), form: 'simplified' }], `Group like terms: ${pt(groupStr(A, B))} = ${pt(P(Sm))}.`); } },
    b: { t: 'distribute the minus', g: R => { let A, B, D; do { A = quad(R); B = quad(R); B[2] = B[2] || nz(R, -9, 9); D = add(A, neg(B)); } while (!D[0] || terms(D).length < 2 || terms(B).length < 3);
      return E.num(`Simplify ${M(`(${P(A)})-(${P(B)})`)}.`, [{ expr: P(D), form: 'simplified' }], `Change every sign of the second polynomial: ${pt(P(A) + signed(P(neg(B))))}. Then combine: ${pt(P(D))}.`); } },
    c: { t: 'vertical layout', g: R => { const sub = R.bool(); let A, B, T;
      do { A = [nz(R, -7, 7), R.int(-9, 9), R.int(-9, 9), R.int(-9, 9)]; B = [R.int(-5, 5), R.int(-9, 9), R.int(-9, 9), R.int(-9, 9)]; A[R.int(1, 3)] = 0; B[R.int(1, 3)] = 0; T = add(A, sub ? neg(B) : B); } while (!T[0] || terms(B).length < 2 || terms(T).length < 2);
      const row = X => { let first = true; return X.map((c, i) => { if (!c) return ''; const k = 3 - i, s = first ? M(mono(c, k)) : `${c < 0 ? '−' : '+'} ${M(mono(Math.abs(c), k))}`; first = false; return s; }); };
      const tbl = `<table class="dt"><tr><th></th>${row(A).map(c => `<td>${c || '&nbsp;'}</td>`).join('')}</tr><tr><th>${sub ? '−' : '+'}</th>${row(B).map(c => `<td>${c || '&nbsp;'}</td>`).join('')}</tr></table>`;
      const cols = ['x³', 'x²', 'x', 'constants'].map((l, i) => A[i] || B[i] ? `${l}: ${A[i]} ${sub ? '−' : '+'} ${par(B[i])} = ${T[i]}` : '').filter(Boolean);
      return E.num(`Like terms are lined up in columns. ${sub ? 'Subtract the bottom polynomial from the top one' : 'Add the two polynomials'}.${tbl}`, [{ expr: P(T), form: 'simplified' }], `Work column by column (a gap means 0): ${cols.join('; ')}. Result: ${pt(P(T))}.`); } },
    d: { t: 'perimeter problems', g: R => { const kind = R.int(0, 2); const side = () => [R.int(1, 6), nz(R, -4, 9)];
      if (kind === 1) { const Lr = side(), W = side(), Pm = add(mul([2], Lr), mul([2], W));
        const pic = V.geo({ pts: { A: [0, 0], B: [7, 0], C: [7, 3.5], D: [0, 3.5] }, segs: [['A', 'B', { label: pt(P(Lr)) }], ['B', 'C', { label: pt(P(W)) }], ['C', 'D'], ['D', 'A']], labels: false, w: 280, label: 'rectangle' });
        return E.num(`A rectangle has length ${M(P(Lr))} and width ${M(P(W))}. Write its perimeter as a simplified polynomial.`, [{ label: 'perimeter =', expr: P(Pm), form: 'simplified' }], `Perimeter = 2(${pt(P(Lr))}) + 2(${pt(P(W))}) = ${pt(P(mul([2], Lr)) + signed(P(mul([2], W))))} = ${pt(P(Pm))}.`, { visual: pic }); }
      const s = [side(), side(), side()], Pm = add(add(s[0], s[1]), s[2]);
      const tri = lab => V.geo({ pts: { A: [0, 0], B: [6, 0], C: [2, 3.5] }, segs: [['A', 'B', { label: lab[0] }], ['B', 'C', { label: lab[1] }], ['C', 'A', { label: lab[2] }]], labels: false, w: 280, label: 'triangle' });
      if (kind === 0) return E.num(`A triangle has sides ${M(P(s[0]))}, ${M(P(s[1]))} and ${M(P(s[2]))}. Write its perimeter as a simplified polynomial.`, [{ label: 'perimeter =', expr: P(Pm), form: 'simplified' }], `Add the sides: x-terms ${s[0][0]} + ${s[1][0]} + ${s[2][0]} = ${Pm[0]}, constants ${s[0][1]} ${sg(s[1][1])} ${sg(s[2][1])} = ${Pm[1]}. Perimeter = ${pt(P(Pm))}.`, { visual: tri(s.map(x => pt(P(x)))) });
      return E.num(`A triangle has perimeter ${M(P(Pm))}. Two sides are ${M(P(s[0]))} and ${M(P(s[1]))}. Find the third side.`, [{ label: 'third side =', expr: P(s[2]), form: 'simplified' }], `Subtract: (${pt(P(Pm))}) − (${pt(P(s[0]))}) − (${pt(P(s[1]))}) = ${pt(P(s[2]))}. Every sign of the subtracted sides changes.`, { visual: tri([pt(P(s[0])), pt(P(s[1])), '?']) }); } },
  });

  /* IV.6.03 Monomial × polynomial */
  // monomial [c, a, b] (c·x^a·y^b) times a list of such terms; returns product terms and the step text
  const distribute = (m, ts) => { const pr = ts.map(t => [m[0] * t[0], m[1] + t[1], (m[2] || 0) + (t[2] || 0)]);
    return { pr, steps: ts.map((t, i) => `${pt(mv(...m))} · ${t[0] < 0 ? '(' + pt(mv(...t)) + ')' : pt(mv(...t))} = ${pt(mv(...pr[i]))}`).join(', ') }; };
  S('IV.6.03', 'Monomial × polynomial', {
    a: { t: 'distribute', g: R => { const kind = R.int(0, 2), k = R.int(2, 9);
      const m = kind === 1 ? [R.pick([1, k]), 1, 0] : [k, 0, 0];
      const ts = kind === 2 ? [[R.int(1, 5), 2, 0], [nz(R, -9, 9), 1, 0], [nz(R, -9, 9), 0, 0]] : [[R.int(1, 5), 1, 0], [nz(R, -9, 9), 0, 0]];
      const { pr, steps } = distribute(m, ts);
      return E.num(`Expand ${M(`${mv(...m)}(${mvJoin(ts)})`)}.`, [{ expr: mvJoin(pr), form: 'expanded' }], `Multiply ${pt(mv(...m))} by every term: ${steps}. So it is ${pt(mvJoin(pr))}.`); } },
    b: { t: 'exponent rules on each term', g: R => { const two = R.bool(0.4);
      if (two) { const m = [R.int(2, 6), R.int(1, 3), R.int(1, 3)]; let ts; do ts = [[nz(R, -7, 7), R.int(0, 3), R.int(0, 3)], [nz(R, -7, 7), R.int(0, 3), R.int(0, 3)]]; while (ts[0][1] === ts[1][1] && ts[0][2] === ts[1][2]);
        const { pr, steps } = distribute(m, ts);
        return E.num(`Expand ${M(`${mv(...m)}(${mvJoin(ts)})`)}.`, [{ expr: mvJoin(pr), form: 'expanded' }], `Multiply the numbers and add the exponents of each variable: ${steps}.`); }
      const m = [R.int(2, 7), R.int(1, 4), 0], ks = R.sample([0, 1, 2, 3, 4], R.int(2, 3)).sort((a, b) => b - a), ts = ks.map(k => [nz(R, -8, 8), k, 0]);
      const { pr, steps } = distribute(m, ts);
      return E.num(`Expand ${M(`${mv(...m)}(${mvJoin(ts)})`)}.`, [{ expr: mvJoin(pr), form: 'expanded' }], `Multiply the numbers and add the exponents (${pt('x^a')}·${pt('x^b')} = x^(a+b)): ${steps}.`.replace('x^(a+b)', 'xᵃ⁺ᵇ')); } },
    c: { t: 'negative monomials', g: R => { const k = R.int(1, 3), c = -R.int(1, 6), m = [c, c === -1 ? R.int(1, 3) : R.int(0, 3), 0];
      const ks = R.sample([0, 1, 2, 3], R.int(2, 3)).sort((a, b) => b - a); let ts; do ts = ks.map(q => [nz(R, -8, 8), q, 0]); while (!ts.some(t => t[0] < 0) || !ts.some(t => t[0] > 0));
      const { pr, steps } = distribute(m, ts);
      return E.num(`Expand ${M(`${mv(...m)}(${mvJoin(ts)})`)}.`, [{ expr: mvJoin(pr), form: 'expanded' }], `The negative sign reaches every term, so each sign flips: ${steps}.`); } },
    d: { t: 'area models', g: R => { const kind = R.int(0, 2);
      if (kind === 0) { const w = [R.int(2, 8), R.int(0, 1), 0], ts = R.bool() ? [[R.int(1, 5), 1, 0], [R.int(1, 9), 0, 0]] : [[R.int(1, 4), 2, 0], [R.int(1, 6), 1, 0], [R.int(1, 9), 0, 0]];
        const { pr, steps } = distribute(w, ts);
        const pic = V.geo({ pts: { A: [0, 0], B: [7, 0], C: [7, 3.5], D: [0, 3.5] }, segs: [['A', 'B', { label: pt(mvJoin(ts)) }], ['B', 'C', { label: pt(mv(...w)) }], ['C', 'D'], ['D', 'A']], labels: false, w: 280, label: 'rectangle' });
        return E.num(`Write the area of the rectangle as a polynomial.`, [{ label: 'area =', expr: mvJoin(pr), form: 'expanded' }], `Area = ${pt(mv(...w))}(${pt(mvJoin(ts))}): ${steps}. Area = ${pt(mvJoin(pr))}.`, { visual: pic }); }
      if (kind === 1) { const k = R.int(1, 5), ts = [[R.int(1, 5), 1, 0], [R.int(1, 9), 0, 0]], { pr } = distribute([k, 1, 0], ts);
        const pic = V.geo({ pts: { A: [0, 0], B: [6, 0], C: [0, 4] }, segs: [['A', 'B', { label: pt(mv(2 * k, 1)) }], ['B', 'C'], ['C', 'A', { label: pt(mvJoin(ts)) }]], angles: [['B', 'A', 'C', '', { right: true }]], labels: false, w: 260, label: 'right triangle' });
        return E.num(`Write the area of the right triangle as a polynomial.`, [{ label: 'area =', expr: mvJoin(pr), form: 'expanded' }], `Area = ½ · ${pt(mv(2 * k, 1))} · (${pt(mvJoin(ts))}) = ${pt(mv(k, 1))}(${pt(mvJoin(ts))}) = ${pt(mvJoin(pr))}.`, { visual: pic }); }
      let k, a; do { k = R.int(1, 6); a = R.int(1, 5); } while (k * a < 2); const b = R.int(1, 9), A = [k * a - 1, k * b, 0];
      return E.num(`A rectangle is ${M(mv(k, 1))} wide and ${M(P([a, b]))} long. A square of side ${M('x')} is cut from one corner. Write the remaining area as a polynomial.`, [{ label: 'area =', expr: P(A), form: 'expanded' }], `Rectangle: ${pt(mv(k, 1))}(${pt(P([a, b]))}) = ${pt(P([k * a, k * b, 0]))}. Subtract the square x²: ${pt(P(A))}.`); } },
    e: { t: 'find the missing piece', g: R => { const kind = R.int(0, 1); let c0; do c0 = nz(R, -6, 6); while (Math.abs(c0) < 2);
      const m = [c0, R.int(1, 3), R.bool(0.3) ? R.int(1, 2) : 0], ks = R.sample([0, 1, 2, 3], 3).sort((a, b) => b - a);
      let ts; do ts = ks.map(k => [nz(R, -7, 7), k, 0]); while (gcdA(ts.map(t => t[0])) !== 1);
      const { pr, steps } = distribute(m, ts);
      if (kind === 0) return E.num(`What monomial goes in the box? ${M(`□(${mvJoin(ts)})=${mvJoin(pr)}`)}`, [{ expr: mv(...m) }], `Divide the first terms: ${pt(mv(...pr[0]))} ÷ ${ts[0][0] < 0 ? '(' + pt(mv(...ts[0])) + ')' : pt(mv(...ts[0]))} = ${pt(mv(...m))}. Check: ${steps}.`);
      const i = R.int(0, 2), inner = ts.map((t, j) => { const s = j === i ? '□' : mv(...t); return j === 0 || s === '□' || t[0] < 0 ? (j > 0 && s === '□' ? '+□' : s) : '+' + s; }).join('');
      const t = ts[i];
      return E.num(`What goes in the box? ${M(`${mv(...m)}(${inner})=${mvJoin(pr)}`)}`, [t[1] === 0 && t[2] === 0 ? { ans: t[0] } : { expr: mv(...t) }], `The matching term of the product is ${pt(mv(...pr[i]))}. Divide it by ${pt(mv(...m))}: the box holds ${pt(mv(...t))}.`); } },
    f: { t: 'substitute a whole expression', g: R => { let p, q, a, b, c;
      do { p = nz(R, -6, 6); q = nz(R, -9, 9); a = R.pick([1, 2, 3, -1, -2]); b = nz(R, -5, 5); c = R.int(-9, 9); } while (a * p + b === 0 || b * p - a * q === 0 || p * p + 4 * q < 0);
      const Qs = P([1, p, 0]), F = [a, a * p + b, b * p - a * q, c], v = b * q + c, tail = c ? (c < 0 ? '' : '+') + c : '';
      const s1 = `${mono(a, 1)}(${Qs})${b < 0 ? '-' : '+'}${Math.abs(b) === 1 ? '' : Math.abs(b)}(${Qs})${signed(mono(-a * q, 1))}${tail}`;
      const s2 = `${mono(a * q, 1)}${signed(String(b * q))}${signed(mono(-a * q, 1))}${tail}`;
      return E.num(`If ${M(Qs + '=' + q)}, what is the value of ${M(P(F))}?`, [{ ans: v }], `Split it using ${pt(Qs)}: ${pt(s1)}. Replace ${pt(Qs)} by ${q}: ${pt(s2)} = ${v}.`); } },
  });

  /* IV.6.04 Multiply binomials */
  const foil = (p, q, r, s) => { const res = P([p * r, p * s + q * r, q * s]);
    return `First ${pt(mono(p, 1))} · ${pt(mono(r, 1))} = ${pt(mono(p * r, 2))}, Outer ${pt(mono(p, 1))} · ${par(s)} = ${pt(mono(p * s, 1))}, Inner ${par(q)} · ${pt(mono(r, 1))} = ${pt(mono(q * r, 1))}, Last ${par(q)} · ${par(s)} = ${q * s}. Combine the middle terms: ${pt(res)}.`; };
  S('IV.6.04', 'Multiply binomials', {
    a: { t: 'area box', g: R => { const a = R.int(1, 9); let b; do b = R.int(1, 9); while (b === a);
      const cells = [['x^2', mono(a, 1)], [mono(b, 1), String(a * b)]], res = P([1, a + b, a * b]);
      if (R.bool(0.45)) { const i = R.int(0, 1), j = R.int(i === 0 ? 1 : 0, 1), ans = cells[i][j], shown = cells.map((row, u) => row.map((c, v) => u === i && v === j ? null : c));
        return E.num(`This box multiplies ${M(`(x+${a})(x+${b})`)}. What goes in the empty cell?${box(['x', String(a)], ['x', String(b)], shown)}`, [i === 1 && j === 1 ? { ans: a * b } : { expr: ans }], `Each cell is its row label times its column label: ${pt(i === 0 ? 'x' : String(b))} · ${pt(j === 0 ? 'x' : String(a))} = ${pt(ans)}.`); }
      return E.num(`Use the box to write ${M(`(x+${a})(x+${b})`)} as a trinomial.${box(['x', String(a)], ['x', String(b)], cells)}`, [{ expr: res, form: 'expanded' }], `Add the four cells and combine the two x-terms: x² + ${a}x + ${b}x + ${a * b} = ${pt(res)}.`); } },
    b: { t: 'FOIL', g: R => { const a = R.int(1, 9), b = R.int(1, 9), f = `(x+${a})(x+${b})`;
      if (R.bool(0.35)) { const which = R.int(0, 2), name = ['Outer', 'Inner', 'Last'][which], val = [mono(b, 1), mono(a, 1), String(a * b)][which];
        return E.num(`In FOIL for ${M(f)}, what is the ${name} product?`, [which === 2 ? { ans: a * b } : { expr: val }], `${name}: ${['the outer terms x and ' + b, 'the inner terms ' + a + ' and x', 'the last terms ' + a + ' and ' + b][which]} give ${pt(val)}.`); }
      return E.num(`Expand ${M(f)}.`, [{ expr: P([1, a + b, a * b]), form: 'expanded' }], foil(1, a, 1, b)); } },
    c: { t: 'with coefficients', g: R => { let p, q, r, s; do { p = R.int(1, 5); r = R.int(1, 5); q = R.int(1, 9); s = R.int(1, 9); } while (p === 1 && r === 1);
      return E.num(`Expand ${M(bin(p, q) + bin(r, s))}.`, [{ expr: P([p * r, p * s + q * r, q * s]), form: 'expanded' }], foil(p, q, r, s)); } },
    d: { t: 'with negatives', g: R => { let p, q, r, s; do { p = R.pick([1, 1, 2, 3, 4]); r = R.pick([1, 1, 2, 3, 5]); q = nz(R, -9, 9); s = nz(R, -9, 9); } while ((q > 0 && s > 0) || p * s + q * r === 0);
      return E.num(`Expand ${M(bin(p, q) + bin(r, s))}.`, [{ expr: P([p * r, p * s + q * r, q * s]), form: 'expanded' }], foil(p, q, r, s)); } },
  });

  /* IV.6.05 Special products */
  const sqr = (R, sign) => { const p = R.pick([1, 1, 2, 3, 4]), q = R.int(1, 9), y = R.bool(0.2) && p === 1;
    const a = y ? 'x' : mono(p, 1), b = y ? mv(q, 0, 1) : String(q), ex = y ? mvJoin([[1, 2, 0], [2 * q * sign, 1, 1], [q * q, 0, 2]]) : P([p * p, 2 * p * q * sign, q * q]);
    const miss = y ? mvJoin([[1, 2, 0], [q * q, 0, 2]]) : P([p * p, 0, q * q]);
    return { f: `(${a}${sign > 0 ? '+' : '-'}${b})^2`, ex, a, b, last: y ? mv(q * q, 0, 2) : String(q * q), mid: y ? mv(2 * q, 1, 1) : mono(2 * p * q, 1), miss }; };
  S('IV.6.05', 'Special products', {
    a: { t: '(a + b)²', g: R => { const o = sqr(R, 1);
      return E.num(`Expand ${M(o.f)}.`, [{ expr: o.ex, form: 'expanded' }], `(a + b)² = a² + 2ab + b² with a = ${pt(o.a)}, b = ${pt(o.b)}: ${pt(o.ex)}. The middle term ${pt(o.mid)} is required; it is not ${pt(o.miss)}.`); } },
    b: { t: '(a − b)²', g: R => { const o = sqr(R, -1);
      return E.num(`Expand ${M(o.f)}.`, [{ expr: o.ex, form: 'expanded' }], `(a − b)² = a² − 2ab + b² with a = ${pt(o.a)}, b = ${pt(o.b)}: ${pt(o.ex)}. The last term is (${pt(o.b)})² = +${pt(o.last)}, since (−b)² is positive.`); } },
    c: { t: '(a + b)(a − b)', g: R => { const p = R.pick([1, 1, 2, 3, 4, 5]), q = R.int(1, 9), flip = R.bool(0.25), a = flip ? String(q) : mono(p, 1), b = flip ? mono(p, 1) : String(q);
      const f = R.bool() ? `(${a}+${b})(${a}-${b})` : `(${a}-${b})(${a}+${b})`, ex = flip ? `${q * q}-${mono(p * p, 2)}` : P([p * p, 0, -q * q]);
      return E.num(`Expand ${M(f)}.`, [{ expr: ex, form: 'expanded' }], `(a + b)(a − b) = a² − b² with a = ${pt(a)}, b = ${pt(b)}: the middle terms cancel, leaving ${pt(ex)}.`); } },
    d: { t: 'mental math uses', g: R => { const kind = R.int(0, 2);
      if (kind === 2) { const n = R.pick([20, 30, 40, 50, 60, 70, 80, 90, 100, 200]), d = R.int(1, n >= 100 ? 9 : 4);
        return E.num(`Use a special product to work out ${n + d} × ${n - d}.`, [{ ans: n * n - d * d }], `(${n} + ${d})(${n} − ${d}) = ${n}² − ${d}² = ${n * n} − ${d * d} = ${n * n - d * d}.`); }
      const n = R.pick([20, 30, 40, 50, 60, 70, 80, 90, 100]), d = R.int(1, 3), up = kind === 0, v = up ? n + d : n - d;
      return E.num(`Use a special product to work out ${v}².`, [{ ans: v * v }], `(${n} ${up ? '+' : '−'} ${d})² = ${n}² ${up ? '+' : '−'} 2·${n}·${d} + ${d}² = ${n * n} ${up ? '+' : '−'} ${2 * n * d} + ${d * d} = ${v * v}.`); } },
    e: { t: 'treat a sum as one term', g: R => {
      const mul2 = (A, B) => { const mp = new Map(); A.forEach(s => B.forEach(t => { const k = (s[1] + t[1]) + ',' + (s[2] + t[2]); mp.set(k, (mp.get(k) || 0) + s[0] * t[0]); }));
        return [...mp].filter(e => e[1]).map(([k, c]) => [c, ...k.split(',').map(Number)]).sort((u, v) => (v[1] + v[2]) - (u[1] + u[2]) || v[1] - u[1]); };
      const kind = R.int(0, 2), m = R.pick([1, 1, 2]), n = R.int(1, 3), sy = R.pick([1, -1]), k = R.int(1, 9);
      const X = mvJoin([[m, 1, 0], [sy * n, 0, 1]]);
      if (kind === 0) { const L1 = [[m, 1, 0], [sy * n, 0, 1], [k, 0, 0]], L2 = [[m, 1, 0], [sy * n, 0, 1], [-k, 0, 0]], ans = mvJoin(mul2(L1, L2)), sw = R.bool();
        return E.num(`Expand ${M(`(${mvJoin(sw ? L2 : L1)})(${mvJoin(sw ? L1 : L2)})`)}.`, [{ expr: ans, form: 'expanded' }], `Let A = ${pt(X)}. Then (A + ${k})(A − ${k}) = A² − ${k * k} = ${pt(ans)}.`); }
      if (kind === 1) { const L1 = [[m, 1, 0], [k, 0, 0], [-n, 0, 1]], L2 = [[m, 1, 0], [-k, 0, 0], [n, 0, 1]], ans = mvJoin(mul2(L1, L2)), B = mvJoin([[k, 0, 0], [-n, 0, 1]]);
        return E.num(`Expand ${M(`(${mvJoin(L1)})(${mvJoin(L2)})`)}.`, [{ expr: ans, form: 'expanded' }], `Group it as (${pt(mono(m, 1))} + (${pt(B)}))(${pt(mono(m, 1))} − (${pt(B)})) = ${m === 1 ? 'x' : '(' + pt(mono(m, 1)) + ')'}² − (${pt(B)})² = ${pt(ans)}.`); }
      const sk = R.pick([1, -1]), L = [[m, 1, 0], [sy * n, 0, 1], [sk * k, 0, 0]], ans = mvJoin(mul2(L, L));
      return E.num(`Expand ${M(`(${mvJoin(L)})^2`)}.`, [{ expr: ans, form: 'expanded' }], `Let A = ${pt(X)}: (A ${sk > 0 ? '+' : '−'} ${k})² = A² ${sk > 0 ? '+' : '−'} ${2 * k}A + ${k * k}, with A² = ${pt(mvJoin(mul2(L.slice(0, 2), L.slice(0, 2))))}. Altogether: ${pt(ans)}.`); } },
    f: { t: 'chains of identities', g: R => { const kind = R.int(0, 2);
      if (kind === 0) { const cube = R.bool(), k = cube ? R.int(2, 7) : R.int(3, 6), v = cube ? k ** 3 - 3 * k : (k * k - 2) ** 2 - 2;
        return E.num(`If ${M('x+1/x=' + k)}, what is ${M(cube ? 'x^3+1/x^3' : 'x^4+1/x^4')}?`, [{ ans: v }], cube
          ? `Cube both sides: x³ + 3x + 3/x + 1/x³ = ${k ** 3}, and 3x + 3/x = 3 · ${k} = ${3 * k}. So x³ + 1/x³ = ${k ** 3} − ${3 * k} = ${v}.`
          : `Square: x² + 2 + 1/x² = ${k * k}, so x² + 1/x² = ${k * k - 2}. Square again: x⁴ + 2 + 1/x⁴ = ${(k * k - 2) ** 2}, so x⁴ + 1/x⁴ = ${v}.`); }
      if (kind === 1) { const k = R.int(1, 5), m = k * k + 2, v = m * m - 2;
        return E.num(`If ${M('x-1/x=' + k)}, what is ${M('x^4+1/x^4')}?`, [{ ans: v }], `Square: x² − 2 + 1/x² = ${k * k}, so x² + 1/x² = ${m}. Square again: x⁴ + 2 + 1/x⁴ = ${m * m}, so x⁴ + 1/x⁴ = ${v}.`); }
      const four = R.bool(0.4); let s, p, D; do { s = R.int(2, four ? 5 : 7); p = nz(R, -6, 9); D = s * s - 4 * p; } while (D <= 0 || isSq(D));
      const m = s * s - 2 * p, v = four ? m * m - 2 * p * p : s ** 3 - 3 * p * s;
      return E.num(`If ${M('a+b=' + s)} and ${M('ab=' + p)}, what is ${M(four ? 'a^4+b^4' : 'a^3+b^3')}?`, [{ ans: v }], four
        ? `a² + b² = (a + b)² − 2ab = ${s * s} ${sg(-2 * p)} = ${m}. Then a⁴ + b⁴ = (a² + b²)² − 2(ab)² = ${m}² − 2 · ${p * p} = ${v}.`
        : `(a + b)³ = a³ + b³ + 3ab(a + b), so a³ + b³ = ${s}³ − 3 · ${par(p)} · ${s} = ${s ** 3} ${sg(-3 * p * s)} = ${v}.`); } },
  });

  /* IV.6.06 Multiply polynomials */
  S('IV.6.06', 'Multiply polynomials', {
    a: { t: 'binomial × trinomial', g: R => { const p = R.pick([1, 1, 1, 2, 3]), a = nz(R, -6, 6), T = [1, nz(R, -6, 6), nz(R, -9, 9)], Pr = mul([p, a], T);
      const part1 = mul([p, 0], T), part2 = mul([a], T);
      return E.num(`Expand ${M(bin(p, a) + '(' + P(T) + ')')}.`, [{ expr: P(Pr), form: 'expanded' }], `Multiply each term of the binomial by the whole trinomial: ${pt(P(part1) + signed(P(part2)))}. Combine like terms: ${pt(P(Pr))}.`); } },
    b: { t: 'organize with a box', g: R => { const p = R.pick([1, 2, 3]), a = nz(R, -6, 6), T = [R.pick([1, 1, 2]), nz(R, -6, 6), nz(R, -9, 9)], Pr = mul([p, a], T);
      const top = [mono(T[0], 2), mono(T[1], 1), String(T[2])], left = [mono(p, 1), String(a)];
      const cells = [[mono(p * T[0], 3), mono(p * T[1], 2), mono(p * T[2], 1)], [mono(a * T[0], 2), mono(a * T[1], 1), String(a * T[2])]];
      const f = M(bin(p, a) + '(' + P(T) + ')');
      if (R.bool()) return E.num(`The box organizes ${f}. Add the cells and combine like terms.${box(top, left, cells)}`, [{ expr: P(Pr), form: 'expanded' }], `Like terms sit on diagonals: ${pt(cells[0][1])} and ${pt(cells[1][0])} give ${pt(mono(Pr[1], 2))}; ${pt(cells[0][2])} and ${pt(cells[1][1])} give ${pt(mono(Pr[2], 1))}. Product: ${pt(P(Pr))}.`);
      const k = R.pick([2, 1]), c = Pr[3 - k], pair = k === 2 ? [cells[0][1], cells[1][0]] : [cells[0][2], cells[1][1]];
      return E.num(`Set up a box to multiply ${f}. What is the coefficient of ${M(mono(1, k))} in the product?${box(top, left, [['', '', ''], ['', '', '']])}`, [{ ans: c }], `The ${pt(mono(1, k))} cells are ${pt(pair[0])} and ${pt(pair[1])}, which add to ${pt(mono(c, k) === '0' ? '0' : mono(c, k))}. The coefficient is ${c}.`); } },
    c: { t: 'three binomials', g: R => { const a = nz(R, -5, 5), b = nz(R, -5, 5), c = nz(R, -4, 4), q = mul([1, a], [1, b]), Pr = mul(q, [1, c]);
      return E.num(`Expand ${M(bin(1, a) + bin(1, b) + bin(1, c))}.`, [{ expr: P(Pr), form: 'expanded' }], `First ${pt(bin(1, a) + bin(1, b))} = ${pt(P(q))}. Then (${pt(P(q))})${pt(bin(1, c))} = ${pt(P(Pr))}.`); } },
    d: { t: 'check by substituting a number', g: R => { const a = nz(R, -5, 5), T = [1, nz(R, -5, 5), nz(R, -6, 6)], Pr = mul([1, a], T), ok = R.bool();
      let claim = Pr.slice();
      if (!ok) { const w = R.int(0, 2); if (w === 0) claim[R.pick([1, 2])] *= -1; else if (w === 1) claim = [1, 0, 0, a * T[2]]; else claim[3] = -claim[3]; if (claim.every((v, i) => v === Pr[i])) claim[2] += 2; }
      const ts = [2, 1, 3, -1, -2], t = ok ? R.pick(ts) : ts.find(x => at(claim, x) !== at(Pr, x));
      const Lv = at([1, a], t) * at(T, t), Rv = at(claim, t);
      return yn(`Someone claims ${M(bin(1, a) + '(' + P(T) + ')=' + P(claim))}. Substitute ${M('x=' + t)} into both sides. Is the claim correct?`, ok, `At x = ${t}: left side = (${at([1, a], t)})(${at(T, t)}) = ${Lv}; right side = ${Rv}. ${ok ? 'They match, so the expansion checks out.' : 'They differ, so the expansion is wrong: it should be ' + pt(P(Pr)) + '.'}`); } },
    e: { t: 'one coefficient, no full expansion', g: R => {
      if (R.bool(0.6)) { let A, B, Pr, k; do { A = [R.pick([1, 2, 3, -1]), nz(R, -6, 6), nz(R, -7, 7)]; B = [R.pick([1, 2, -2, 3]), nz(R, -6, 6), nz(R, -7, 7)]; Pr = mul(A, B); k = R.int(1, 3); } while (!Pr[4 - k]);
        const c = Pr[4 - k], parts = []; for (let i = 0; i <= 2; i++) { const j = k - i; if (j >= 0 && j <= 2) parts.push(`(${pt(mono(A[2 - i], i))})(${pt(mono(B[2 - j], j))})`); }
        return E.num(`What is the coefficient of ${M(mono(1, k))} in ${M(`(${P(A)})(${P(B)})`)}?`, [{ ans: c }], `Only pairs whose powers add to ${k} matter: ${parts.join(' + ')} = ${pt(mono(c, k))}. The coefficient is ${c}.`); }
      let a, b, c; do { a = nz(R, -6, 6); b = nz(R, -6, 6); c = nz(R, -6, 6); } while (a * b + b * c + c * a === 0);
      const v = a * b + b * c + c * a;
      return E.num(`What is the coefficient of ${M('x')} in ${M(bin(1, a) + bin(1, b) + bin(1, c))}?`, [{ ans: v }], `An x-term takes x from one bracket and the numbers from the other two: ${par(a)}·${par(b)} + ${par(a)}·${par(c)} + ${par(b)}·${par(c)} = ${v}.`); } },
    f: { t: 'hidden coefficients', g: R => {
      if (R.bool(0.6)) { const p = nz(R, -5, 5), q = nz(R, -5, 5), a = nz(R, -5, 5), b = nz(R, -6, 6), T3 = a + q, T1 = a * b + p * q, pq1 = q < 0 ? `(${pt(mono(q, 1))})` : pt(mono(q, 1));
        return E.num(`In the expansion of ${M(`(x^2+ax${signed(String(p))})(x^2${signed(mono(q, 1))}+b)`)}, the coefficient of ${M('x^3')} is ${T3} and the coefficient of ${M('x')} is ${T1}. Find a and b.`, [{ label: 'a =', ans: a }, { label: 'b =', ans: b }],
          `x³ comes from x² · ${pq1} and ax · x²: a + ${par(q)} = ${T3}, so a = ${a}. x comes from ax · b and ${par(p)} · ${pq1}: ${pt(mono(a, 1)).replace('x', 'b')} ${sg(p * q)} = ${T1}, so b = ${b}.`); }
      const n = R.int(6, 25), s = R.pick([1, -1]), v = s * n * (n + 1) / 2, op = s < 0 ? '-' : '+';
      return E.num(`What is the coefficient of ${M(mono(1, n - 1))} in ${M(`(x${op}1)(x${op}2)(x${op}3)`)} ⋯ ${M(`(x${op}${n})`)}?`, [{ ans: v }],
        `Take x from every bracket but one, and the number from that one. Adding over all ${n} choices: ${s < 0 ? '−(' : ''}1 + 2 + ⋯ + ${n}${s < 0 ? ')' : ''} = ${s < 0 ? '−' : ''}${n} · ${n + 1} ÷ 2 = ${v}.`); } },
  });

  /* IV.6.07 GCF factoring */
  // inner polynomial with integer content 1, positive leading coefficient and nonzero constant
  const innerP = (R, one) => { let A; do { const n = R.int(1, 3); A = [R.int(1, 7), ...Array(n).fill(0).map(() => R.int(-9, 9))]; A[n] = A[n] || nz(R, -9, 9); if (one) A[n] = 1; } while (gcdA(A) !== 1 || terms(A).length < 2); return A; };
  S('IV.6.07', 'GCF factoring', {
    a: { t: 'find the GCF', g: R => { const g = R.int(2, 9), n = R.int(2, 3), two = R.bool(0.3), m = R.int(two ? 1 : 0, 3), my = two ? R.int(1, 2) : 0; let ks; do ks = R.distinct(1, 9, n); while (gcdA(ks) !== 1);
      let ex; do ex = ks.map(() => [R.int(0, 3), two ? R.int(0, 2) : 0]); while (Math.min(...ex.map(e => e[0])) !== 0 || (two && Math.min(...ex.map(e => e[1])) !== 0));
      const ms = ks.map((k, i) => mv(g * k, m + ex[i][0], my + ex[i][1])), G2 = mv(g, m, my), list = ms.map(M);
      return E.num(`What is the greatest common factor of ${list.slice(0, -1).join(', ')} and ${list[list.length - 1]}?`, [m || my ? { label: 'GCF =', expr: G2 } : { label: 'GCF =', ans: g }],
        `The GCF of ${ks.map(k => g * k).join(', ')} is ${g}${m ? `; the lowest power of x is ${pt(mono(1, m))}` : ''}${my ? `; the lowest power of y is ${pt(mv(1, 0, my))}` : ''}. GCF = ${pt(G2)}.`); } },
    b: { t: 'factor it out', g: R => { let g, m; do { g = R.int(1, 9); m = R.int(0, 3); } while (g === 1 && m === 0);
      const one = R.bool(0.4), I = innerP(R, one), O = mul([g, ...Array(m).fill(0)], I), G2 = mono(g, m);
      return E.num(`Factor out the GCF: ${M(P(O))}.`, [{ expr: `${G2}(${P(I)})`, form: 'gcf' }], `The GCF is ${pt(G2)}. Divide each term by it: ${pt(`${G2}(${P(I)})`)}.${one ? ` The last term equals the GCF, so it leaves 1, not nothing.` : ''}`); } },
    c: { t: 'negative GCF', g: R => { let g, m; do { g = R.int(1, 9); m = R.int(0, 3); } while (g === 1 && m === 0);
      const I = innerP(R, R.bool(0.3)), O = mul([-g, ...Array(m).fill(0)], I), G2 = mono(-g, m);
      return E.num(`Factor ${M(P(O))} by taking out a negative GCF, so the bracket starts with a positive term.`, [{ expr: `${G2}(${P(I)})`, form: 'gcf' }], `Take out ${pt(G2)}. Dividing by a negative flips every sign: ${pt(`${G2}(${P(I)})`)}.`); } },
    d: { t: 'binomial GCF', g: R => { const v = R.pick(['x', 'x', 'y']), k = nz(R, -9, 9), b2 = P([1, k], v), c1 = R.int(1, 6), e1 = R.pick([1, 1, 2]); let c2; do c2 = nz(R, -9, 9); while (E.gcd(c1, Math.abs(c2)) > 1);
      const first = mono(c1, e1), other = join([[c1, e1], [c2, 0]]);
      return E.num(`Factor ${M(`${first}(${b2})${c2 < 0 ? '-' : '+'}${Math.abs(c2)}(${b2})`)}.`, [{ expr: `(${b2})(${other})`, form: 'gcf' }], `Both terms share the factor (${pt(b2)}). Take it out: (${pt(b2)})(${pt(other)}).`); } },
  });

  /* IV.6.08 Factor by grouping */
  const grp = R => { let a, b, c, d; do { a = R.pick([1, 1, 2, 3]); b = nz(R, -7, 7); c = R.pick([1, 1, 2, 3]); d = nz(R, -9, 9); } while (gcd(a, b) !== 1 || gcd(c, d) !== 1 || (c === 1 && d === 1 && a === 1));
    return { a, b, c, d, co: [a * c, b * c, a * d, b * d], B: P([a, b]), X: mono(c, 2) }; };
  S('IV.6.08', 'Factor by grouping', {
    a: { t: 'group in pairs', g: R => { const { co } = grp(R), f = P(co), first = `(${P([co[0], co[1], 0, 0])})`;
      const op = co[2] > 0 ? '+' : '-', s0 = co[2] > 0 ? 1 : -1, form = (o, u, w) => `${first}${o}(${P([u * co[2], w * co[3]])})`;
      const right = form(op, s0, s0), wrong = [[s0, -s0], [-s0, s0], [-s0, -s0]].map(([u, w]) => form(op, u, w)).filter(s => !E.sameExpr(s, f));
      return E.choice(R, `Which correctly splits ${M(f)} into two pairs?`, M(right), wrong.map(M), `Keep every sign: ${M(right)}. Pulling out a minus sign flips both terms inside the bracket.`); } },
    b: { t: 'factor each pair', g: R => { const o = grp(R), f = P(o.co);
      if (R.bool(0.7)) return E.num(`Factor each pair of ${M(f)}: ${M(`${o.X}(${o.B})+□(${o.B})`)}. What number goes in the box?`, [{ ans: o.d }], `The second pair is ${pt(P([o.co[2], o.co[3]]))} = ${o.d}(${pt(o.B)}). The box needs ${o.d}${o.d < 0 ? ', with its minus sign, so the brackets match' : ''}.`);
      return E.num(`Factor each pair of ${M(f)}: ${M(`□(${o.B})${o.d < 0 ? '-' : '+'}${Math.abs(o.d)}(${o.B})`)}. What goes in the box?`, [{ expr: o.X }], `The first pair is ${pt(P([o.co[0], o.co[1], 0, 0]))} = ${pt(o.X)}(${pt(o.B)}).`); } },
    c: { t: 'pull out the common binomial', g: R => { const o = grp(R), ans = `(${o.B})(${P([o.c, 0, o.d])})`;
      if (R.bool()) return E.num(`Finish factoring: ${M(`${o.X}(${o.B})${o.d < 0 ? '-' : '+'}${Math.abs(o.d)}(${o.B})`)}.`, [{ expr: ans, form: 'factored' }], `Both terms contain (${pt(o.B)}). Take it out: ${pt(ans)}.`);
      return E.num(`Factor by grouping: ${M(P(o.co))}.`, [{ expr: ans, form: 'factored' }], `${pt(P([o.co[0], o.co[1], 0, 0]))} = ${pt(o.X)}(${pt(o.B)}) and ${pt(P([o.co[2], o.co[3]]))} = ${o.d}(${pt(o.B)}), so it is ${pt(ans)}.`); } },
    d: { t: 'regroup when stuck', g: R => { let p, q, r, s; do { p = R.int(1, 3); r = R.int(1, 3); q = nz(R, -6, 6); s = nz(R, -6, 6); } while (gcd(p, q) !== 1 || gcd(r, s) !== 1);
      const shown = mvJoin([[p * r, 1, 1], [q * s, 0, 0], [p * s, 1, 0], [q * r, 0, 1]]), ans = `(${P([p, q])})(${P([r, s], 'y')})`;
      return E.num(`Factor ${M(shown)}. (Grouping the first two terms gets stuck, so regroup.)`, [{ expr: ans, form: 'factored' }],
        `Pair the terms with x and the terms without: (${pt(mvJoin([[p * r, 1, 1], [p * s, 1, 0]]))}) + (${pt(mvJoin([[q * r, 0, 1], [q * s, 0, 0]]))}) = ${pt(mv(p, 1))}(${pt(P([r, s], 'y'))}) ${q < 0 ? '−' : '+'} ${Math.abs(q)}(${pt(P([r, s], 'y'))}) = ${pt(ans)}.`); } },
    e: { t: 'group three terms and one', g: R => { const k = nz(R, -7, 7), n = R.int(1, 3);
      if (R.bool()) { const ts = [[1, 2, 0], [2 * k, 1, 0], [k * k, 0, 0], [-n * n, 0, 2]], shown = R.bool() ? ts : [ts[0], ts[3], ts[1], ts[2]];
        const Y = mv(n, 0, 1), A = P([1, k]), ans = `(${A}+${Y})(${A}-${Y})`;
        return E.num(`Factor ${M(mvJoin(shown))}.`, [{ expr: ans, form: 'complete' }], `The x-terms and the ${k * k} form a perfect square: ${pt(`(${A})^2-${n === 1 ? 'y' : '(' + Y + ')'}^2`)}. That is a difference of squares: ${pt(ans)}.`); }
      const m = R.pick([1, 1, 2, 3]), ts = [[m * m, 2, 0], [-1, 0, 2], [2 * k, 0, 1], [-k * k, 0, 0]], shown = R.bool() ? ts : [ts[0], ts[2], ts[1], ts[3]];
      const B = P([1, -k], 'y'), mx = mono(m, 1), ans = `(${mx}+y${k > 0 ? '-' : '+'}${Math.abs(k)})(${mx}-y${k > 0 ? '+' : '-'}${Math.abs(k)})`;
      return E.num(`Factor ${M(mvJoin(shown))}.`, [{ expr: ans, form: 'complete' }], `The y-terms and the ${-k * k} are −(${pt(P([1, -2 * k, k * k], 'y'))}) = −(${pt(B)})². So it is ${m === 1 ? 'x' : '(' + pt(mx) + ')'}² − (${pt(B)})² = ${pt(ans)}.`); } },
    f: { t: 'grouping that cracks a puzzle', g: R => {
      if (R.bool()) { let a, b, c; do { a = R.pick([1, 1, 2, 3]); b = nz(R, -7, 7); c = R.int(1, 5); } while (gcd(a, Math.abs(b)) !== 1 || Math.abs(b) === a * c);
        const plus = R.bool(0.3), F = mul([a, b], [1, 0, plus ? c * c : -c * c]), B = P([a, b]), r0 = E.fracStr(-b, a);
        return E.num(`Find all real solutions of ${M(P(F) + '=0')}.`, [{ label: 'x =', set: plus ? [r0] : [r0, String(c), String(-c)] }],
          `Group: x²(${pt(B)}) ${plus ? '+' : '−'} ${c === 1 ? '' : c * c}(${pt(B)}) = (${pt(B)})(x² ${plus ? '+' : '−'} ${c * c}) = 0. ${plus ? `x² + ${c * c} is never 0, so the only real solution is x = ${pt(r0)}.` : `So x = ${pt(r0)} or x = ±${c}.`}`); }
      let a, b, N, sols; do { a = R.int(1, 6); b = R.int(1, 6); N = R.int(Math.max(12, a * b + 1), 60); sols = []; for (let d = b + 1; d <= N; d++) if (N % d === 0 && N / d > a) sols.push([d - b, N / d - a]); } while (!sols.length || sols.length > 6);
      const c = N - a * b;
      return E.num(`How many pairs of positive integers (x, y) satisfy ${M(`xy+${a === 1 ? '' : a}x+${b === 1 ? '' : b}y=${c}`)}?`, [{ ans: sols.length }],
        `Add ${a * b} to both sides and group: x(y + ${a}) + ${b === 1 ? '' : b}(y + ${a}) = (x + ${b})(y + ${a}) = ${N}. Need x + ${b} > ${b} and y + ${a} > ${a}: ${sols.map(([x, y]) => `${x + b} × ${y + a} gives (${x}, ${y})`).join('; ')}. That is ${sols.length}.`); } },
  });

  /* IV.6.09 Factor x² + bx + c */
  const pq = R => { let p, q; do { p = nz(R, -9, 9); q = nz(R, -9, 9); } while (Math.abs(p) === Math.abs(q)); return [p, q]; };
  const fx = (p, q) => `(x${p > 0 ? '+' + p : p})(x${q > 0 ? '+' + q : q})`;
  S('IV.6.09', 'Factor x² + bx + c', {
    a: { t: 'find two numbers', g: R => { const [p, q] = pq(R);
      return E.num(`To factor ${M(P([1, p + q, p * q]))}, find two numbers whose product is ${p * q} and whose sum is ${p + q}.`, [{ set: [String(p), String(q)] }], `${p} × ${par(q)} = ${p * q} and ${p} + ${par(q)} = ${p + q}.`); } },
    b: { t: 'signs of the pair', g: R => { const kind = R.int(0, 2); let p, q; do [p, q] = pq(R); while ((kind === 0 && !(p > 0 && q > 0)) || (kind === 1 && !(p < 0 && q < 0)) || (kind === 2 && p * q > 0));
      const b = p + q, c = p * q;
      return E.choiceFixed(`For ${M(P([1, b, c]))}, what signs do the two numbers (product ${c}, sum ${b}) have?`, ['both positive', 'both negative', 'one positive, one negative'], kind,
        [`c > 0 means same signs, and b > 0 makes them both positive: ${p} and ${q}.`, `c > 0 means same signs, and b < 0 makes them both negative: ${p} and ${q}.`, `c < 0 means opposite signs: ${Math.max(p, q)} and ${Math.min(p, q)}.`][kind]); } },
    c: { t: 'write the factors', g: R => { const [p, q] = pq(R);
      return E.num(`Factor ${M(P([1, p + q, p * q]))}.`, [{ expr: fx(p, q), form: 'complete' }], `${p} and ${par(q)} multiply to ${p * q} and add to ${p + q}: ${pt(fx(p, q))}.`); } },
    d: { t: 'check by multiplying', g: R => { const [p, q] = pq(R), right = fx(p, q), wrong = [fx(-p, -q), fx(-p, q), fx(p, -q)];
      return E.choice(R, `Which factorization of ${M(P([1, p + q, p * q]))} is correct? Check by multiplying.`, M(right), wrong.map(M), `${pt(right)} = x² ${sg(p + q)}x ${sg(p * q)}. The other sign choices give a different middle term or constant.`.replace('+ 1x', '+ x').replace('− 1x', '− x')); } },
  });

  /* IV.6.10 Factor ax² + bx + c */
  const acP = R => { let p, q, r, s; do { p = R.int(1, 4); r = R.int(1, 4); q = nz(R, -7, 7); s = nz(R, -7, 7); } while (p * r < 2 || p * r > 12 || gcd(p, q) !== 1 || gcd(r, s) !== 1 || p * s + q * r === 0 || p * s === q * r || (p === r && q === s));
    return { p, q, r, s, a: p * r, b: p * s + q * r, c: q * s, m: p * s, n: q * r }; };
  const split = (a, u, v, c) => `${mono(a, 2)}${signed(mono(u, 1))}${signed(mono(v, 1))}${signed(String(c))}`;
  S('IV.6.10', 'Factor ax² + bx + c', {
    a: { t: 'ac method', g: R => { const o = acP(R);
      return E.num(`To factor ${M(P([o.a, o.b, o.c]))} by the ac method, find ac and the two numbers whose product is ac and whose sum is b.`, [{ label: 'ac =', ans: o.a * o.c }, { label: 'numbers:', set: [String(o.m), String(o.n)] }],
        `ac = ${o.a} × ${par(o.c)} = ${o.a * o.c}. The pair ${o.m} and ${par(o.n)} has product ${o.a * o.c} and sum ${o.b}.`); } },
    b: { t: 'split the middle term', g: R => { const o = acP(R), ac = o.a * o.c, key = (u, v) => [Math.max(u, v), Math.min(u, v)];
      const [m, n] = key(o.m, o.n), cand = [];
      for (let u = -Math.abs(ac); u <= Math.abs(ac); u++) if (u && ac % u === 0) { const [x, y] = key(u, ac / u); if (x + y !== o.b) cand.push([x, y]); }
      for (const k of [1, -1, 2, -2, 3]) { const [x, y] = key(m + k, n - k); if (x && y && x * y !== ac) cand.push([x, y]); }
      const seen = new Set([m + ',' + n]), wrong = []; for (const c of R.shuffle(cand)) { const k = c.join(','); if (!seen.has(k)) { seen.add(k); wrong.push(split(o.a, c[0], c[1], o.c)); } }
      return E.choice(R, `To factor ${M(P([o.a, o.b, o.c]))} by grouping, which way of splitting the middle term works?`, M(split(o.a, m, n, o.c)), wrong.slice(0, 3).map(M), `You need product ac = ${ac} and sum b = ${o.b}: that is ${m} and ${par(n)}.`); } },
    c: { t: 'group', g: R => { const o = acP(R), [u, v] = R.bool() ? [o.m, o.n] : [o.n, o.m];
      const g1 = gcd(o.a, u), B = [o.a / g1, u / g1], g2s = v / B[0], ans = `(${P(B)})(${P([g1, g2s])})`;
      return E.num(`Factor by grouping: ${M(split(o.a, u, v, o.c))}.`, [{ expr: ans, form: 'complete' }],
        `${pt(P([o.a, u, 0]))} = ${pt(mono(g1, 1))}(${pt(P(B))}) and ${pt(P([v, o.c]))} = ${g2s}(${pt(P(B))}), so the answer is ${pt(ans)}.`); } },
    d: { t: 'guess and check alternative', g: R => { const o = acP(R), tgt = [o.a, o.b, o.c].join(','), seen = new Set([tgt]), wrong = [];
      const divs = n => { const out = []; for (let d = 1; d <= Math.abs(n); d++) if (n % d === 0) out.push(d, -d); return out; };
      const cands = []; for (const p1 of divs(o.a).filter(d => d > 0)) for (const q1 of divs(o.c)) cands.push([p1, q1, o.a / p1, o.c / q1]);
      for (const [p1, q1, r1, s1] of R.shuffle(cands)) { const k = [p1 * r1, p1 * s1 + q1 * r1, q1 * s1].join(','); if (!seen.has(k)) { seen.add(k); wrong.push(bin(p1, q1) + bin(r1, s1)); } }
      const extra = [fx(o.m, o.n), fx(o.q, o.s)]; const pool = [extra[0], ...wrong.slice(0, 2), ...wrong.slice(2), extra[1]].filter((w, i, arr) => arr.indexOf(w) === i);
      const right = R.bool() ? bin(o.p, o.q) + bin(o.r, o.s) : bin(o.r, o.s) + bin(o.p, o.q);
      return E.choice(R, `Which is the factorization of ${M(P([o.a, o.b, o.c]))}? Check the middle term of each.`, M(right), pool.slice(0, 3).map(M), `Outer + inner: ${pt(mono(o.p, 1))}·${par(o.s)} + ${par(o.q)}·${pt(mono(o.r, 1))} = ${pt(mono(o.p * o.s, 1) + signed(mono(o.q * o.r, 1)))} = ${pt(mono(o.b, 1))}, which matches.`); } },
  });

  /* IV.6.11 Difference of squares */
  const NS = [2, 3, 5, 6, 7, 8, 10, 12, 15, 18, 20, 24, 27, 32, 40, 45, 50];
  S('IV.6.11', 'Difference of squares', {
    a: { t: 'recognize a² − b²', g: R => { const yes = R.bool(), k = R.int(1, 9), m = R.pick([1, 1, 2, 3, 4]);
      let e, why;
      if (yes) { const t = R.int(0, 2); e = [P([m * m, 0, -k * k]), `${k * k}-${mono(m * m, 2)}`, mvJoin([[1, 2, 0], [-k * k, 0, 2]])][t];
        why = ['It is ' + pt(`(${mono(m, 1)})^2-${k}^2`) + ': a square minus a square.', 'It is ' + pt(`${k}^2-(${mono(m, 1)})^2`) + ': a square minus a square.', 'It is ' + pt(`x^2-(${mv(k, 0, 1)})^2`) + ': a square minus a square.'][t]; }
      else { const t = R.int(0, 3), n = R.pick(NS), a = R.pick([2, 3, 5, 6, 8]);
        e = [P([m * m, 0, k * k]), P([1, 0, -n]), P([a, 0, -k * k]), P([1, 0, 0, -k * k])][t];
        why = ['It is a sum of squares, not a difference.', `${n} is not a perfect square.`, `${a} is not a perfect square, so ${pt(mono(a, 2))} is not a square.`, 'x³ is not a perfect square.'][t]; }
      return yn(`Is ${M(e)} a difference of two squares?`, yes, why); } },
    b: { t: 'factor', g: R => { const k = R.int(1, 12), t = R.int(0, 3);
      const [e, ans] = [[P([1, 0, -k * k]), `(x+${k})(x-${k})`], [P([1, 0, -k * k]), `(x+${k})(x-${k})`], [`${k * k}-x^2`, `(${k}+x)(${k}-x)`], [mvJoin([[1, 2, 0], [-k * k, 0, 2]]), `(x+${mv(k, 0, 1)})(x-${mv(k, 0, 1)})`]][t];
      return E.num(`Factor ${M(e)}.`, [{ expr: ans, form: 'complete' }], `a² − b² = (a + b)(a − b): ${pt(ans)}.`); } },
    c: { t: 'with coefficients', g: R => { let m, k; do { m = R.int(2, 9); k = R.int(1, 11); } while (gcd(m, k) !== 1); const y = R.bool(0.3);
      const e = y ? mvJoin([[m * m, 2, 0], [-k * k, 0, 2]]) : P([m * m, 0, -k * k]), B = y ? mv(k, 0, 1) : String(k), ans = `(${mono(m, 1)}+${B})(${mono(m, 1)}-${B})`;
      return E.num(`Factor ${M(e)}.`, [{ expr: ans, form: 'complete' }], `${pt(mono(m * m, 2))} = (${pt(mono(m, 1))})² and ${pt(y ? mv(k * k, 0, 2) : String(k * k))} = ${y ? '(' + pt(B) + ')' : k}²: ${pt(ans)}.`); } },
    d: { t: 'repeated (x⁴ − 16)', g: R => { let u, v; do { u = R.int(1, 3); v = R.int(1, 3); } while (gcd(u, v) !== 1 || (u === 1 && v === 1 && R.bool(0.7)));
      const A = mono(u, 1), A2 = mono(u * u, 2), e = P([u ** 4, 0, 0, 0, -(v ** 4)]), sq = `(${A2}+${v * v})`, df = `(${A2}-${v * v})`, right = `${sq}(${A}+${v})(${A}-${v})`;
      const wrong = [`${sq}${df}`, `(${A}+${v})^2(${A}-${v})^2`, `${df}(${A}+${v})(${A}-${v})`, `(${A}+${v})(${A}-${v})(${A}+${v})(${A}-${v})`];
      return E.choice(R, `Which is the complete factorization of ${M(e)}?`, M(right), [wrong[0], ...R.sample(wrong.slice(1), 2)].map(M),
        `${pt(e)} = ${pt(sq + df)}, and ${pt(df)} is again a difference of squares. ${pt(sq)} is a sum of squares and stays: ${pt(right)}.`); } },
    e: { t: 'squares of brackets', g: R => {
      if (R.bool()) { const h = nz(R, -7, 7); let k; do k = R.int(1, 9); while (k === Math.abs(h));
        const lin = c => `(${P([1, c])})`, ans = lin(h + k) + lin(h - k);
        return E.num(`Factor ${M(`(${P([1, h])})^2-${k * k}`)}.`, [{ expr: ans, form: 'complete' }], `It is A² − ${k}² with A = ${pt(P([1, h]))}: (A + ${k})(A − ${k}) = ${pt(ans)}.`); }
      let a, b, c, d; do { a = R.int(2, 4); c = R.int(1, a - 1); b = nz(R, -6, 6); d = nz(R, -6, 6); } while (b + d === 0 || b === d || gcd(a, b) !== 1 || gcd(c, d) !== 1);
      const f1 = [a + c, b + d], f2 = [a - c, b - d], g1 = gcdA(f1), g2 = gcdA(f2), G = g1 * g2;
      const ans = `${G > 1 ? G : ''}(${P(f1.map(v => v / g1))})(${P(f2.map(v => v / g2))})`;
      return E.num(`Factor completely: ${M(`(${P([a, b])})^2-(${P([c, d])})^2`)}.`, [{ expr: ans, form: 'complete' }],
        `It is A² − B² with A = ${pt(P([a, b]))} and B = ${pt(P([c, d]))}: (A + B)(A − B) = (${pt(P(f1))})(${pt(P(f2))})${G > 1 ? ` = ${pt(ans)}, taking out ${G}` : ''}.`); } },
    f: { t: 'difference of squares in disguise', g: R => { const kind = R.int(0, 2);
      if (kind === 0) { let N, sols; do { N = R.int(15, 120); sols = []; for (let d = 1; d * d < N; d++) if (N % d === 0 && (N / d - d) % 2 === 0) sols.push([(d + N / d) / 2, (N / d - d) / 2]); } while (!sols.length || sols.length > 5);
        return E.num(`How many pairs of positive integers (x, y) satisfy ${M(`x^2-y^2=${N}`)}?`, [{ ans: sols.length }],
          `(x + y)(x − y) = ${N}, with x + y > x − y > 0 and both factors even or both odd. ${sols.map(([x, y]) => `${x + y} × ${x - y} gives (${x}, ${y})`).join('; ')}. That is ${sols.length}.`); }
      if (kind === 1) { const n = R.int(5, 50), rev = R.bool(), v = (rev ? 1 : -1) * n * (2 * n + 1), N2 = 2 * n;
        if (rev) return E.num(`Work out ${M(`${N2}^2-${N2 - 1}^2+${N2 - 2}^2-${N2 - 3}^2`)} + ⋯ + ${M('2^2-1^2')}.`, [{ ans: v }], `Pair the terms: ${N2}² − ${N2 - 1}² = (${N2} − ${N2 - 1})(${N2} + ${N2 - 1}) = ${N2} + ${N2 - 1}, and so on. The total is ${N2} + ${N2 - 1} + ⋯ + 1 = ${N2} · ${N2 + 1} ÷ 2 = ${v}.`);
        return E.num(`Work out ${M('1^2-2^2+3^2-4^2')} + ⋯ + ${M(`${N2 - 1}^2-${N2}^2`)}.`, [{ ans: v }], `Pair the terms: 1² − 2² = (1 − 2)(1 + 2) = −(1 + 2), and so on. The total is −(1 + 2 + ⋯ + ${N2}) = −${N2} · ${N2 + 1} ÷ 2 = ${v}.`); }
      const n = R.int(5, 40), g = E.gcd(n + 1, 2 * n), fr = [(n + 1) / g, 2 * n / g];
      return E.num(`Work out ${M('(1-1/2^2)(1-1/3^2)(1-1/4^2)')} ⋯ ${M(`(1-1/${n}^2)`)}.`, [{ frac: fr }], `Each factor is 1 − 1/k² = ((k − 1)/k) · ((k + 1)/k). In the full product almost everything cancels, leaving (1/2) · (${n + 1}/${n}) = ${pt(E.fracStr(fr[0], fr[1]))}.`); } },
  });

  /* IV.6.12 Perfect square trinomials */
  S('IV.6.12', 'Perfect square trinomials', {
    a: { t: 'recognize the pattern', g: R => { const yes = R.bool(), m = R.pick([1, 1, 1, 2, 3]), k = R.int(1, 9), s = R.pick([1, -1]);
      if (yes) { const e = P([m * m, 2 * m * k * s, k * k]); return yn(`Is ${M(e)} a perfect square trinomial?`, true, `Yes: ${pt(e)} = ${pt(`(${mono(m, 1)}${s > 0 ? '+' : '-'}${k})^2`)}, since the middle term is 2 · ${pt(mono(m, 1))} · ${k}.`); }
      const t = R.int(0, 2);
      if (t === 0) { const e = P([m * m, m * k * s, k * k]); return yn(`Is ${M(e)} a perfect square trinomial?`, false, `No: a perfect square would need a middle term of ${pt(mono(2 * m * k, 1))}, not ${pt(mono(Math.abs(m * k), 1))}.`); }
      if (t === 1) { const e = P([m * m, 2 * m * k * s, -k * k]); return yn(`Is ${M(e)} a perfect square trinomial?`, false, `No: the last term of a perfect square is +b², never negative.`); }
      const e = P([m * m, 0, k * k]); return yn(`Is ${M(e)} a perfect square trinomial?`, false, `No: it has no middle term. ${pt(`(${mono(m, 1)}+${k})^2`)} would be ${pt(P([m * m, 2 * m * k, k * k]))}.`); } },
    b: { t: 'factor', g: R => { const k = R.int(1, 12), s = R.pick([1, -1]), ans = `(x${s > 0 ? '+' : '-'}${k})^2`;
      return E.num(`Factor ${M(P([1, 2 * k * s, k * k]))}.`, [{ expr: ans, form: 'complete' }], `${k * k} = ${k}², and ${Math.abs(2 * k)} = 2 · ${k}, so it is ${pt(ans)}.`); } },
    c: { t: 'with coefficients', g: R => { let m, k; do { m = R.int(2, 7); k = R.int(1, 9); } while (gcd(m, k) !== 1); const s = R.pick([1, -1]), y = R.bool(0.3);
      const e = y ? mvJoin([[m * m, 2, 0], [2 * m * k * s, 1, 1], [k * k, 0, 2]]) : P([m * m, 2 * m * k * s, k * k]), B = y ? mv(k, 0, 1) : String(k), ans = `(${mono(m, 1)}${s > 0 ? '+' : '-'}${B})^2`;
      return E.num(`Factor ${M(e)}.`, [{ expr: ans, form: 'complete' }], `First term (${pt(mono(m, 1))})², last term (${pt(B)})², middle term 2 · ${pt(mono(m, 1))} · ${pt(B)} = ${pt(y ? mv(2 * m * k, 1, 1) : mono(2 * m * k, 1))}. So it is ${pt(ans)}.`); } },
    d: { t: 'build one by choosing c', g: R => { const kind = R.int(0, 3), k = R.int(1, 10), m = R.int(2, 5), s = R.pick([1, -1]);
      if (kind === 0) return E.num(`What value of c makes ${M(P([1, 2 * k * s, 0]) + '+c')} a perfect square trinomial?`, [{ label: 'c =', ans: k * k }], `Half of ${2 * k * s} is ${k * s}; squared, ${k * k}. Then it is ${pt(`(x${s > 0 ? '+' : '-'}${k})^2`)}.`);
      if (kind === 1) return E.num(`What positive value of b makes ${M(`x^2+bx+${k * k}`)} a perfect square trinomial?`, [{ label: 'b =', ans: 2 * k }], `${k * k} = ${k}², so b = 2 · ${k} = ${2 * k}: ${pt(`(x+${k})^2`)}.`);
      let kk; do kk = R.int(1, 7); while (gcd(m, kk) !== 1);
      if (kind === 2) return E.num(`What value of c makes ${M(P([m * m, 2 * m * kk * s, 0]) + '+c')} a perfect square trinomial?`, [{ label: 'c =', ans: kk * kk }], `${pt(mono(m * m, 2))} = (${pt(mono(m, 1))})², and ${2 * m * kk} = 2 · ${m} · ${kk}, so c = ${kk}² = ${kk * kk}.`);
      return E.num(`What positive value of b makes ${M(`${m * m}x^2+bx+${kk * kk}`)} a perfect square trinomial?`, [{ label: 'b =', ans: 2 * m * kk }], `It must be (${pt(mono(m, 1))} + ${kk})², so b = 2 · ${m} · ${kk} = ${2 * m * kk}.`); } },
  });

  /* IV.6.13 Sum & difference of cubes */
  const cubes = (R, s) => { let m, k; do { m = R.pick([1, 1, 2, 3, 4, 5]); k = R.int(1, 7); } while (gcd(m, k) !== 1); const y = m === 1 && R.bool(0.25);
    const A = mono(m, 1), B = y ? mv(k, 0, 1) : String(k), e = y ? mvJoin([[1, 3, 0], [s * k ** 3, 0, 3]]) : P([m ** 3, 0, 0, s * k ** 3]);
    const tri = y ? mvJoin([[1, 2, 0], [-s * k, 1, 1], [k * k, 0, 2]]) : P([m * m, -s * m * k, k * k]);
    return { A, B, e, ans: `(${A}${s > 0 ? '+' : '-'}${B})(${tri})`, tri }; };
  S('IV.6.13', 'Sum & difference of cubes', {
    a: { t: 'recognize cubes', g: R => { const yes = R.bool(), s = R.pick([1, -1]);
      if (yes) { const o = cubes(R, s); return yn(`Is ${M(o.e)} a sum or difference of two cubes?`, true, `Yes: it is (${pt(o.A)})³ ${s > 0 ? '+' : '−'} (${pt(o.B)})³.`); }
      const t = R.int(0, 2), n = R.pick([4, 9, 16, 12, 25, 36, 49, 18, 32]), a = R.pick([2, 4, 9, 16]);
      const e = [P([1, 0, 0, s * n]), P([a, 0, 0, s * 8]), P([1, 0, s * 27])][t];
      return yn(`Is ${M(e)} a sum or difference of two cubes?`, false, [`${n} is not a perfect cube.`, `${a} is not a perfect cube, so ${pt(mono(a, 3))} is not a cube.`, `x² is not a cube.`][t]); } },
    b: { t: 'sum formula', g: R => { const o = cubes(R, 1);
      return E.num(`Factor ${M(o.e)}.`, [{ expr: o.ans, form: 'complete' }], `a³ + b³ = (a + b)(a² − ab + b²) with a = ${pt(o.A)}, b = ${pt(o.B)}: ${pt(o.ans)}.`); } },
    c: { t: 'difference formula', g: R => { const o = cubes(R, -1);
      return E.num(`Factor ${M(o.e)}.`, [{ expr: o.ans, form: 'complete' }], `a³ − b³ = (a − b)(a² + ab + b²) with a = ${pt(o.A)}, b = ${pt(o.B)}: ${pt(o.ans)}. It is not (${pt(o.A)} − ${pt(o.B)})³.`); } },
    d: { t: 'SOAP sign pattern', g: R => { const s = R.pick([1, -1]); let k; do k = R.int(2, 6); while (false);
      const e = P([1, 0, 0, s * k ** 3]);
      if (R.bool()) { const opts = ['−, +, +', '+, −, +', '+, +, −', '−, −, +'], right = s > 0 ? opts[1] : opts[0];
        return E.choice(R, `Fill in the signs: ${M(e)} = (x ○ ${k})(x² ○ ${k}x ○ ${k * k}).`, right, opts.filter(o => o !== right), `SOAP: Same sign as the original, Opposite sign, Always Positive. So the signs are ${right}.`); }
      const right = `(x${s > 0 ? '+' : '-'}${k})(${P([1, -s * k, k * k])})`, wrong = [`(x${s > 0 ? '+' : '-'}${k})^3`, `(x${s > 0 ? '+' : '-'}${k})(${P([1, s * k, k * k])})`, `(x${s > 0 ? '-' : '+'}${k})(${P([1, -s * k, k * k])})`, `(x${s > 0 ? '+' : '-'}${k})(${P([1, 0, k * k])})`];
      return E.choice(R, `Which is the factorization of ${M(e)}?`, M(right), R.sample(wrong, 3).map(M), `SOAP: Same sign, Opposite sign, Always Positive: ${pt(right)}. The cube ${pt(wrong[0])} expands to ${pt(P(s > 0 ? [1, 3 * k, 3 * k * k, k ** 3] : [1, -3 * k, 3 * k * k, -(k ** 3)]))}.`); } },
  });

  /* IV.6.14 Factor completely */
  const PAT = ['difference of squares', 'perfect square trinomial', 'x² + bx + c with two numbers', 'sum of cubes', 'difference of cubes'];
  const fc = (R, only) => { const t = only !== undefined ? only : R.int(0, 4); let g, m; do { g = R.int(1, 6); m = R.int(0, 2); } while (g === 1 && m === 0);
    const k = R.int(1, t >= 3 ? 4 : 7), G2 = mono(g, m); let inner, full, part, wrong;
    if (t === 0) { inner = [1, 0, -k * k]; full = `(x+${k})(x-${k})`; wrong = [`(x-${k})^2`, `(x+${k})^2`]; }
    if (t === 1) { const s = R.pick([1, -1]); inner = [1, 2 * s * k, k * k]; full = `(x${s > 0 ? '+' : '-'}${k})^2`; wrong = [`(x+${k})(x-${k})`, `(x${s > 0 ? '-' : '+'}${k})^2`]; }
    if (t === 2) { let p, q; do { p = nz(R, -7, 7); q = nz(R, -7, 7); } while (p === q || p === -q); inner = [1, p + q, p * q]; full = fx(p, q); wrong = [fx(-p, -q), fx(-p, q)]; }
    if (t >= 3) { const s = t === 3 ? 1 : -1; inner = [1, 0, 0, s * k ** 3]; full = `(x${s > 0 ? '+' : '-'}${k})(${P([1, -s * k, k * k])})`; wrong = [`(x${s > 0 ? '+' : '-'}${k})^3`, `(x${s > 0 ? '+' : '-'}${k})(${P([1, s * k, k * k])})`]; }
    const Gp = G2 === '1' ? '' : G2 === '-1' ? '-' : G2;
    return { t, g, m, G2, inner, O: mul([g, ...Array(m).fill(0)], inner), full: Gp + full, part: `${Gp}(${P(inner)})`, wrong: wrong.map(w => Gp + w) }; };
  S('IV.6.14', 'Factor completely', {
    a: { t: 'GCF first', g: R => { const o = fc(R);
      return E.num(`To factor ${M(P(o.O))} completely, what GCF do you take out first?`, [o.m ? { label: 'GCF =', expr: o.G2 } : { label: 'GCF =', ans: o.g }], `Every term shares ${pt(o.G2)}: ${pt(P(o.O))} = ${pt(o.part)}.`); } },
    b: { t: 'choose the pattern', g: R => { const o = fc(R);
      return E.choice(R, `After taking out the GCF of ${M(P(o.O))}, which pattern factors what is left?`, PAT[o.t], R.sample(PAT.filter((_, i) => i !== o.t), 3), `${pt(P(o.O))} = ${pt(o.part)}, and ${pt(P(o.inner))} is a ${PAT[o.t]}${o.t === 2 ? ' trinomial' : ''}: ${pt(o.full)}.`.replace('a x²', 'an x²')); } },
    c: { t: 'keep factoring', g: R => { const o = fc(R, R.pick([0, 0, 1, 2, 2, 3, 4]));
      return E.choice(R, `Which is the complete factorization of ${M(P(o.O))}?`, M(o.full), [o.part, ...o.wrong].map(M), `GCF first: ${pt(o.part)}. Then keep going, since ${pt(P(o.inner))} factors: ${pt(o.full)}.`); } },
    d: { t: 'prime polynomials', g: R => { const prime = R.bool(); let e, why;
      if (prime) { const t = R.int(0, 2);
        if (t === 0) { const k = R.int(1, 9); e = P([1, 0, k * k]); why = `A sum of squares like ${pt(e)} has no real factors, so it is prime.`; }
        else if (t === 1) { const n = R.pick(NS); e = P([1, 0, -n]); why = `${n} is not a perfect square, so ${pt(e)} has no integer factors.`; }
        else { let b, c; do { b = nz(R, -9, 9); c = nz(R, -12, 12); } while (isSq(b * b - 4 * c)); e = P([1, b, c]); why = `No two integers multiply to ${c} and add to ${b}, so it is prime.`; } }
      else { const t = R.int(0, 2), k = R.int(1, 6);
        if (t === 0) { const [p, q] = [nz(R, -7, 7), nz(R, -7, 7)]; e = P([1, p + q, p * q]); why = `It factors: ${pt(p === q ? `(x${p > 0 ? '+' : '-'}${Math.abs(p)})^2` : fx(p, q))}.`; }
        else if (t === 1) { e = P([1, 0, 0, k ** 3]); why = `A sum of cubes does factor: ${pt(`(x+${k})(${P([1, -k, k * k])})`)}.`; }
        else { const b = nz(R, -9, 9); e = P([1, b, 0]); why = `Both terms share x: ${pt(`x(${P([1, b])})`)}.`; } }
      return yn(`Is ${M(e)} prime (impossible to factor over the integers)?`, prime, why); } },
    e: { t: 'three steps deep', g: R => {
      if (R.bool()) { const U = [-1, -4, -9, -16, 1, 4, 9, 2, 3, -2, -3]; let g, m, p, q; do { g = R.int(1, 4); m = R.int(0, 1); p = R.pick(U); q = R.pick(U); } while (p >= q || !(p < 0 && isSq(-p)) || (g === 1 && m === 0));
        const inner = mul([1, 0, p], [1, 0, q]), O = mul([g, ...Array(m).fill(0)], inner), G2 = mono(g, m);
        const fac = t => t < 0 && isSq(-t) ? `(x+${Math.sqrt(-t)})(x-${Math.sqrt(-t)})` : `(${P([1, 0, t])})`, ans = G2 + fac(p) + fac(q);
        return E.num(`Factor completely: ${M(P(O))}.`, [{ expr: ans, form: 'complete' }], `GCF first: ${pt(G2)}(${pt(P(inner))}). With u = x² the bracket is (${pt(P([1, 0, p]))})(${pt(P([1, 0, q]))}). Split every x² minus a square: ${pt(ans)}.`); }
      let a, k, g; do { a = nz(R, -6, 6); k = R.int(1, 5); g = R.pick([1, 1, 2, 3]); } while (Math.abs(a) === k);
      const inner = mul([1, a], [1, 0, -k * k]), A = P([1, a]), ans = `${g > 1 ? g : ''}(${A})(x+${k})(x-${k})`;
      return E.num(`Factor completely: ${M(P(mul([g], inner)))}.`, [{ expr: ans, form: 'complete' }], `${g > 1 ? `Take out ${g}. ` : ''}Group: x²(${pt(A)}) − ${k * k}(${pt(A)}) = (${pt(A)})(x² − ${k * k}), and x² − ${k * k} splits again: ${pt(ans)}.`); } },
    f: { t: 'add and subtract a square', g: R => { const kind = R.int(0, 2);
      if (kind === 2) { const k = R.pick([1, 3, 5]), ans = `(${P([2, 2 * k, k * k])})(${P([2, -2 * k, k * k])})`;
        return E.num(`Factor completely over the integers: ${M(`4x^4+${k ** 4}`)}.`, [{ expr: ans, form: 'complete' }], `Add and subtract ${4 * k * k}x²: (2x² + ${k * k})² − ${4 * k * k}x² = (2x² + ${k * k})² − (${2 * k}x)², a difference of squares: ${pt(ans)}.`); }
      let c, m; do { c = R.int(1, 9); m = R.int(1, 6); } while (isSq(m * m - 4 * c) || Math.abs(2 * c - m * m) > 30);
      const b = 2 * c - m * m, y = kind === 1;
      const e = y ? mvJoin([[1, 4, 0], [b, 2, 2], [c * c, 0, 4]].filter(t => t[0])) : P([1, 0, b, 0, c * c]);
      const ans = y ? `(${mvJoin([[1, 2, 0], [m, 1, 1], [c, 0, 2]])})(${mvJoin([[1, 2, 0], [-m, 1, 1], [c, 0, 2]])})` : `(${P([1, m, c])})(${P([1, -m, c])})`;
      const sq = y ? `(x²${c ? ' + ' + pt(mv(c, 0, 2)) : ''})` : `(x² + ${c})`, mx = y ? pt(mv(m, 1, 1)) : pt(mono(m, 1));
      return E.num(`Factor completely over the integers: ${M(e)}.`, [{ expr: ans, form: 'complete' }], `Complete the square: ${pt(e)} = ${sq}² − ${m * m === 1 ? '' : m * m}${y ? 'x²y²' : 'x²'} = ${sq}² − (${mx})². A difference of squares: ${pt(ans)}.`); } },
  });

  /* IV.6.15 Polynomial division */
  const divide = (A, D) => { const q = [], r = A.slice(); for (let i = 0; i <= A.length - D.length; i++) { const c = r[i] / D[0]; q.push(c); D.forEach((d, j) => { r[i + j] -= c * d; }); } return [q, trim(r.slice(A.length - D.length + 1))]; };
  S('IV.6.15', 'Polynomial division', {
    a: { t: 'divide by a monomial', g: R => { const g = nz(R, -6, 6), m = R.int(1, 3); let Q; do Q = [nz(R, -8, 8), R.int(-8, 8), R.int(-8, 8)]; while (terms(Q).length < 2 || (g < 0 && Q[0] < 0 && R.bool()));
      const Dv = mono(g, m), O = mul([g, ...Array(m).fill(0)], Q);
      return E.num(`Divide ${M(P(O))} by ${M(Dv)}.`, [{ expr: P(Q), form: 'expanded' }], `Divide each term by ${pt(Dv)}: ${terms(O).map(([c, k]) => `${pt(mono(c, k))} ÷ ${g < 0 ? '(' + pt(Dv) + ')' : pt(Dv)} = ${pt(mono(c / g, k - m))}`).join(', ')}.`); } },
    b: { t: 'long division', g: R => { const r = nz(R, -6, 6), Q = R.bool() ? [R.pick([1, 1, 2, 3]), R.int(-7, 7), nz(R, -9, 9)] : [R.pick([1, 2]), nz(R, -9, 9)], O = mul([1, -r], Q);
      return E.num(`Use long division to divide ${M(P(O))} by ${M(P([1, -r]))}.`, [{ label: 'quotient =', expr: P(Q), form: 'expanded' }], `Divide the leading terms, multiply back, subtract, and repeat. The quotient is ${pt(P(Q))} with remainder 0. Check: (${pt(P([1, -r]))})(${pt(P(Q))}) = ${pt(P(O))}.`); } },
    c: { t: 'synthetic division', g: R => { const r = nz(R, -3, 3), A = [R.pick([1, 1, 2, 3, -1]), R.int(-9, 9), R.int(-9, 9), R.int(-9, 9)]; if (R.bool(0.5)) A[R.int(1, 2)] = 0;
      const row = [A[0]]; for (let i = 1; i < 4; i++) row.push(A[i] + r * row[i - 1]); const q = row.slice(0, 3), rem = row[3];
      return E.num(`Use synthetic division to divide ${M(P(A))} by ${M(P([1, -r]))}.`, [{ label: 'quotient =', expr: P(q), form: 'expanded' }, { label: 'remainder =', ans: rem }],
        `Use r = ${r} and coefficients ${A.join(', ')}${A.slice(1, 3).includes(0) ? ' (0 for each missing power)' : ''}. Bring down, multiply by ${r}, add: ${row.join(', ')}. So the quotient is ${pt(P(q))} and the remainder is ${rem}.`); } },
    d: { t: 'write quotient + remainder', g: R => { let D, Q, Rm;
      if (R.bool()) { D = [1, nz(R, -4, 4)]; Q = [R.int(2, 3), R.int(-6, 6), R.int(-6, 6)]; Rm = [nz(R, -9, 9)]; }
      else { D = [1, R.int(-3, 3), nz(R, -5, 5)]; Q = [R.pick([1, 2]), R.int(-5, 5)]; Rm = [nz(R, -5, 5), R.int(-9, 9)]; }
      const F = add(mul(D, Q), Rm), [q2, r2] = divide(F, D);
      return E.num(`Divide ${M('f(x)=' + P(F))} by ${M('d(x)=' + P(D))}. Write ${M('f(x)=d(x)q(x)+r(x)')}: what are q(x) and r(x)?`, [{ label: 'q(x) =', expr: P(q2), form: 'expanded' }, Rm.length === 1 ? { label: 'r(x) =', ans: r2[0] } : { label: 'r(x) =', expr: P(r2) }],
        `Long division gives quotient ${pt(P(q2))} and remainder ${pt(P(r2))} (its degree is below ${D.length - 1 === 1 ? 'the divisor’s degree 1' : 'the divisor’s degree 2'}). Check: ${pt(`(${P(D)})(${P(q2)})` + signed(P(r2)))} = ${pt(P(F))}.`); } },
    e: { t: 'a harder divisor, or a missing k', g: R => {
      if (R.bool()) { let a, b; do { a = R.pick([2, 3]); b = nz(R, -5, 5); } while (gcd(a, Math.abs(b)) !== 1);
        const Q = [R.int(1, 3), R.int(-5, 5), R.int(-6, 6)], rm = nz(R, -7, 7), F = add(mul([a, b], Q), [rm]);
        return E.num(`Divide ${M(P(F))} by ${M(P([a, b]))}. Give the quotient and the remainder.`, [{ label: 'quotient =', expr: P(Q), form: 'expanded' }, { label: 'remainder =', ans: rm }],
          `Divide each leading term by ${a}x, multiply back and subtract: the quotient is ${pt(P(Q))} and the remainder is ${rm}. Check: (${pt(P([a, b]))})(${pt(P(Q))}) ${sg(rm)} = ${pt(P(F))}.`); }
      let r, k, b, c; do { r = nz(R, -3, 3); k = nz(R, -6, 6); b = R.int(-9, 9); c = -(r ** 3 + k * r * r + b * r); } while (!c || Math.abs(c) > 40);
      return E.num(`For what value of k does ${M(P([1, -r]))} divide ${M(`x^3+kx^2${b ? signed(mono(b, 1)) : ''}${signed(String(c))}`)} with no remainder?`, [{ label: 'k =', ans: k }],
        `Synthetic division by ${pt(P([1, -r]))} ends with the value at x = ${r}: ${r ** 3} + ${r * r}k${b ? ' ' + sg(b * r) : ''} ${sg(c)}. It must be 0, so ${r * r === 1 ? `k = ${k}` : `${r * r}k = ${k * r * r} and k = ${k}`}.`.replace(' + 1k', ' + k')); } },
    f: { t: 'remainders without long division', g: R => {
      if (R.bool(0.4)) { let p, q, t; do { p = nz(R, -5, 5); q = nz(R, -6, 6); t = nz(R, -5, 5); } while (p + t === 0);
        const m = p + t, a = q + p * t, b = q * t;
        return E.num(`Find a and b so that ${M(`x^3${signed(mono(m, 2))}+ax+b`)} is divisible by ${M(P([1, p, q]))}.`, [{ label: 'a =', ans: a }, { label: 'b =', ans: b }],
          `The quotient must be x + t: (${pt(P([1, p, q]))})(x + t) has x² coefficient ${p} + t = ${m}, so t = ${t}. Then a = ${q} + ${par(p)}·${par(t)} = ${a} and b = ${q}·${par(t)} = ${b}.`); }
      let n, m; do { n = R.int(10, 99); m = R.int(3, 99); } while (n === m); const a = nz(R, -3, 3), k = R.int(-9, 9), one = R.bool();
      const F = `x^${n}${a < 0 ? '-' : '+'}${Math.abs(a) === 1 ? '' : Math.abs(a)}x^${m}${k ? (k < 0 ? '' : '+') + k : ''}`;
      const f1 = 1 + a + k, fm = (-1) ** n + a * (-1) ** m + k, c = one ? (f1 - fm) / 2 : 1 + a, d = one ? (f1 + fm) / 2 : k, rem = c ? P([c, d]) : String(d);
      return E.num(`What is the remainder when ${M(F)} is divided by ${M(one ? 'x^2-1' : 'x^2-x')}?`, [c ? { label: 'remainder =', expr: rem } : { label: 'remainder =', ans: d }],
        `The remainder has degree below 2, so it is cx + d. ${one ? `Put x = 1: c + d = ${f1}. Put x = −1: −c + d = ${fm}. So c = ${c} and d = ${d}` : `x² − x = x(x − 1). Put x = 0: d = ${k}. Put x = 1: c + d = ${f1}, so c = ${c}`}: the remainder is ${pt(rem)}.`); } },
  });

  /* IV.6.16 Polynomial identities */
  S('IV.6.16', 'Polynomial identities', {
    a: { t: 'check an identity by expanding both sides', g: R => { const k = R.int(1, 6), t = R.int(0, 5), yes = R.bool();
      const T = [
        [`(x+${k})^2-(x-${k})^2`, mono(4 * k, 1), mono(2 * k, 1)],
        [`(x+${k})^2`, P([1, 2 * k, k * k]), P([1, 0, k * k])],
        [`(x+${k})(x-${k})`, P([1, 0, -k * k]), P([1, -2 * k, -k * k])],
        [`(x+${k})^3`, P([1, 3 * k, 3 * k * k, k ** 3]), P([1, 0, 0, k ** 3])],
        [`x^3-${k ** 3}`, `(x-${k})(${P([1, k, k * k])})`, `(x-${k})^3`],
        [`(x+${k})^2-${2 * k}x`, P([1, 0, k * k]), P([1, 0, -k * k])],
      ][t];
      const rhs = yes ? T[1] : T[2], L = T[0], Lx = [P([4 * k, 0]), P([1, 2 * k, k * k]), P([1, 0, -k * k]), P([1, 3 * k, 3 * k * k, k ** 3]), P([1, 0, 0, -(k ** 3)]), P([1, 0, k * k])][t];
      const really = E.sameExpr(L, rhs, ['x']);
      return yn(`Is ${M(L + '=' + rhs)} an identity (true for every x)?`, really, `Expand both sides: the left is ${pt(Lx)}${/\(/.test(rhs) ? ' and the right is ' + pt(t === 4 && !yes ? P([1, -3 * k, 3 * k * k, -(k ** 3)]) : P([1, 0, 0, -(k ** 3)])) : ''}. ${really ? 'They match for every x, so it is an identity.' : 'They differ, so it is not an identity.'}`); } },
    b: { t: '(x² + y²)² = (x² − y²)² + (2xy)²', g: R => {
      if (R.bool(0.6)) { const x = R.int(2, 9), y = R.int(1, x - 1), s = x * x + y * y, d = x * x - y * y, p = 2 * x * y;
        return E.num(`Check ${M('(x^2+y^2)^2=(x^2-y^2)^2+(2xy)^2')} with x = ${x} and y = ${y}. What number do both sides equal?`, [{ ans: s * s }], `Left: ${s}² = ${s * s}. Right: ${d}² + ${p}² = ${d * d} + ${p * p} = ${s * s}.`); }
      const k = R.int(1, 6), ex = P([1, 0, 2 * k * k, 0, k ** 4]);
      return E.num(`Expand and simplify ${M(`(x^2-${k * k})^2+(${2 * k}x)^2`)}.`, [{ expr: ex, form: 'simplified' }], `(x² − ${k * k})² = ${pt(P([1, 0, -2 * k * k, 0, k ** 4]))} and (${2 * k}x)² = ${pt(mono(4 * k * k, 2))}. Adding gives ${pt(ex)} = (x² + ${k * k})², as the identity says.`); } },
    c: { t: 'generate Pythagorean triples', g: R => { const x = R.int(2, 9), y = R.int(1, x - 1), a = x * x - y * y, b = 2 * x * y, c = x * x + y * y;
      if (R.bool(0.3)) return E.num(`The triple (${a}, ${b}, ${c}) comes from legs ${M('x^2-y^2')} and ${M('2xy')} and hypotenuse ${M('x^2+y^2')}, with whole numbers ${M('x>y')}. Find x and y.`, [{ label: 'x =', ans: x }, { label: 'y =', ans: y }], `x² + y² = ${c} and x² − y² = ${a} give x² = ${x * x} and y² = ${y * y}, so x = ${x}, y = ${y}. Check: 2xy = ${b}.`);
      return E.num(`Use x = ${x} and y = ${y} in ${M('(x^2-y^2)^2+(2xy)^2=(x^2+y^2)^2')} to make a Pythagorean triple.`, [{ label: 'x² − y² =', ans: a }, { label: '2xy =', ans: b }, { label: 'x² + y² =', ans: c }], `${x * x} − ${y * y} = ${a}, 2·${x}·${y} = ${b}, ${x * x} + ${y * y} = ${c}. Check: ${a}² + ${b}² = ${a * a + b * b} = ${c}².`); } },
    d: { t: 'use identities for mental math', g: R => { const kind = R.int(0, 2);
      if (kind === 0) { const s = R.pick([20, 40, 50, 60, 80, 100, 120, 150, 200]), d = 2 * R.int(1, Math.min(8, s / 2 - 1)), a = (s + d) / 2, b = (s - d) / 2;
        return E.num(`Use ${M('a^2-b^2=(a+b)(a-b)')} to work out ${a}² − ${b}².`, [{ ans: a * a - b * b }], `(${a} + ${b})(${a} − ${b}) = ${s} × ${d} = ${a * a - b * b}.`); }
      if (kind === 1) { const n = R.pick([10, 20, 30, 40, 50, 60, 70, 80, 90]) / 10, v = 10 * n + 5;
        return E.num(`Use ${M('(a+b)^2=a^2+2ab+b^2')} to work out ${v}².`, [{ ans: v * v }], `(${10 * n} + 5)² = ${100 * n * n} + ${100 * n} + 25 = ${v * v}.`); }
      const n = R.pick([100, 1000]), d = R.int(1, 9);
      return E.num(`Use ${M('(a+b)(a-b)=a^2-b^2')} to work out ${n + d} × ${n - d}.`, [{ ans: n * n - d * d }], `${n}² − ${d}² = ${n * n} − ${d * d} = ${n * n - d * d}.`); } },
    e: { t: 'rewrite in powers of (x − h)', g: R => { const h = nz(R, -3, 3), A = R.pick([1, 2, 3, -1, -2]), B = R.int(-8, 8), C = R.int(-9, 9);
      const b = B + 2 * A * h, c = A * h * h + B * h + C, X = P([1, -h]);
      return E.num(`Find a, b and c so that ${M(`a(${X})^2+b(${X})+c=${P([A, B, C])}`)} for every x.`, [{ label: 'a =', ans: A }, { label: 'b =', ans: b }, { label: 'c =', ans: c }],
        `Put x = ${h}: both brackets are 0, so c = ${pt(P([A, B, C]))} at x = ${h}, which is ${c}. The x² terms give a = ${A}. The x terms: b ${sg(-2 * A * h)} = ${B}, so b = ${b}.`); } },
    f: { t: 'identities that do the work', g: R => {
      if (R.bool()) { let q, r; do { q = R.int(2, 12); r = R.int(2, 12); } while (q === r || q + r > 20); const p = q + r, rev = R.bool(), v = (rev ? 3 : -3) * p * q * r;
        return E.num(`Work out ${M(rev ? `${p}^3-${q}^3-${r}^3` : `${q}^3+${r}^3-${p}^3`)}.`, [{ ans: v }],
          `The bases ${rev ? `${p}, −${q}, −${r}` : `${q}, ${r}, −${p}`} add to 0, and when a + b + c = 0, a³ + b³ + c³ = 3abc. So it is 3 · ${rev ? `${p} · (−${q}) · (−${r})` : `${q} · ${r} · (−${p})`} = ${v}.`); }
      let s, t; do { s = R.int(-6, 9); t = R.int(-12, 12); } while (s * s - 3 * t < 0 || s * s - 2 * t < 0);
      const Q = s * s - 2 * t, kind = R.int(0, 2);
      if (kind === 0) return E.num(`If ${M('a+b+c=' + s)} and ${M('ab+bc+ca=' + t)}, what is ${M('a^2+b^2+c^2')}?`, [{ ans: Q }], `(a + b + c)² = a² + b² + c² + 2(ab + bc + ca), so a² + b² + c² = ${par(s)}² − 2 · ${par(t)} = ${Q}.`);
      if (kind === 1) return E.num(`If ${M('a+b+c=' + s)} and ${M('a^2+b^2+c^2=' + Q)}, what is ${M('ab+bc+ca')}?`, [{ ans: t }], `(a + b + c)² = a² + b² + c² + 2(ab + bc + ca), so ${s * s} = ${Q} + 2(ab + bc + ca) and ab + bc + ca = ${t}.`);
      const p = nz(R, -9, 9), v = s * (Q - t) + 3 * p;
      return E.num(`If ${M('a+b+c=' + s)}, ${M('ab+bc+ca=' + t)} and ${M('abc=' + p)}, what is ${M('a^3+b^3+c^3')}?`, [{ ans: v }],
        `a² + b² + c² = ${par(s)}² − 2 · ${par(t)} = ${Q}. Then use a³ + b³ + c³ − 3abc = (a + b + c)(a² + b² + c² − ab − bc − ca): a³ + b³ + c³ = ${par(s)} · (${Q} ${sg(-t)}) + 3 · ${par(p)} = ${v}.`); } },
  });
})(typeof window !== 'undefined' ? window : globalThis);
