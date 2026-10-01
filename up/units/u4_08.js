/* Era IV · Unit IV.8 Complex numbers (IV.8.01–IV.8.16) */
(function (G) {
  const E = G.E4, V = E.V, C = E.C, M = s => E.mx(s);
  const nz = (R, lo, hi) => { let v; do v = R.int(lo, hi); while (v === 0); return v; };
  const sg = n => n < 0 ? `− ${-n}` : `+ ${n}`;
  const co = p => p === 1 ? '' : p === -1 ? '-' : String(p);                 // coefficient text: 1 → '', −1 → '-'
  // a + bi as ASCII from integers (or decimals)
  const cs = (a, b) => { if (b === 0) return String(a); const im = b === 1 ? 'i' : b === -1 ? '-i' : b + 'i'; return a === 0 ? im : a + (b > 0 ? '+' : '') + im; };
  // a + bi from exact ASCII parts ('3/2', '-sqrt(3)/2', '0')
  const cxs = (re, im) => {
    if (im === '0') return re;
    const neg = im[0] === '-', ab = neg ? im.slice(1) : im;
    const t = ab === '1' ? 'i' : /\//.test(ab) ? `(${ab})i` : /sqrt/.test(ab) ? ab.replace('sqrt', 'isqrt') : ab + 'i';
    return re === '0' ? (neg ? '-' : '') + t : re + (neg ? '-' : '+') + t;
  };
  // exact ASCII for k, k/2, k√2, k√2/2, k√3, k√3/2
  const ex = v => { if (Math.abs(v) < 1e-9) return '0';
    for (const [rad, den] of [[1, 1], [1, 2], [2, 1], [2, 2], [3, 1], [3, 2]]) { const k = v * den / Math.sqrt(rad); if (Math.abs(k - Math.round(k)) < 1e-7) { const K = Math.round(k); return rad === 1 ? E.fracStr(K, den) : E.surdStr(0, K, rad, den); } }
    throw new Error('ex: no exact form for ' + v); };
  const md = d => ((d % 360) + 360) % 360;
  const rad = d => d * Math.PI / 180;
  const pol = (rStr, th) => `${rStr === '1' ? '' : E.pt(rStr)}(cos ${th}° + i sin ${th}°)`;
  const cmul = ([a, b], [c, d]) => [a * c - b * d, a * d + b * c];
  const ipow = n => [[1, 0], [0, 1], [-1, 0], [0, -1]][((n % 4) + 4) % 4];
  const zminus = (a, b) => { const s = cs(-a, -b); return s === '0' ? 'z' : 'z' + (s[0] === '-' ? s : '+' + s); };
  const P = s => E.pt(s);
  const pn = n => n < 0 ? `(${n})` : String(n);                                // wrap negatives: 3 + (−4)
  const nth = n => n + (n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] || 'th');
  const cis = (r, th) => pol(String(r), th);
  const kt = (m, v = 'k') => m === 1 ? v : m === -1 ? '−' + v : m + v;                 // coefficient times a letter, for explanations
  const lin2 = (m, c0, v = 'k') => `${kt(m, v)}${c0 ? (c0 < 0 ? ' − ' : ' + ') + Math.abs(c0) : ''}`;
  const minusT = w => /[+-]/.test(w.slice(1)) ? `-(${w})` : w[0] === '-' ? '+' + w.slice(1) : '-' + w;   // "− w" inside M
  const SUP = n => String(n).split('').map(c => '⁰¹²³⁴⁵⁶⁷⁸⁹'[c]).join('');
  const SUB = n => String(n).split('').map(c => '₀₁₂₃₄₅₆₇₈₉'[c]).join('');
  const pmul = (A, B) => { const r = Array(A.length + B.length - 1).fill(0); A.forEach((a, i) => B.forEach((b, j) => { r[i + j] += a * b; })); return r; };
  // Argand diagram on a square window [−L, L]²
  const argand = o => { const L = o.L, W = o.w || 260, pad = 18;
    const X = x => pad + (x + L) / (2 * L) * (W - 2 * pad), Y = y => W - pad - (y + L) / (2 * L) * (W - 2 * pad);
    const param = (o.segs || []).map(([x1, y1, x2, y2, col]) => ({ x: t => x1 + (x2 - x1) * t, y: t => y1 + (y2 - y1) * t, t: [0, 1], color: col || C.blue }))
      .concat((o.circles || []).map(c => ({ x: t => c.c[0] + c.r * Math.cos(t), y: t => c.c[1] + c.r * Math.sin(t), t: [0, 2 * Math.PI], color: c.color || C.blue })));
    const g = V.graph({ x: [-L, L], y: [-L, L], w: W, h: W, ticks: o.ticks || (L > 8 ? 2 : 1), labels: o.labels, param, points: o.pts || [], shade: o.shade, vlines: o.vlines, hlines: o.hlines, label: o.label || 'complex plane' });
    const ax = V.text(Math.round(W - pad - 2), Math.round(Y(0) - 9), 'Re', { size: 12, fill: C.muted, anchor: 'end' }) + V.text(Math.round(X(0) + 7), pad + 6, 'Im', { size: 12, fill: C.muted, anchor: 'start' });
    return g.replace(/<\/g><\/svg>$/, ax + '</g></svg>'); };
  const Lfit = (...v) => Math.max(4, Math.ceil(Math.max(...v.map(Math.abs))) + 1);
  const quad = (a, b) => a > 0 && b > 0 ? 'Quadrant I' : a < 0 && b > 0 ? 'Quadrant II' : a < 0 && b < 0 ? 'Quadrant III' : 'Quadrant IV';
  const S = (id, name, steps) => E.skill({ id, name, steps });

  /* IV.8.01 The number i */
  S('IV.8.01', 'The number i', {
    a: { t: 'i² = −1', g: R => { const kind = R.int(0, 3), k = R.int(2, 9), m = R.int(2, 9), c = R.int(-9, 9);
      if (kind === 0) return E.num(`Simplify ${M(`(${k}i)^2`)}.`, [{ ans: -k * k }], `(${k}i)² = ${k}²·i² = ${k * k}·(−1) = ${-k * k}. The square of i is −1, not 1.`);
      if (kind === 1) return E.num(`Simplify ${M(`(-${k}i)^2`)}.`, [{ ans: -k * k }], `(−${k}i)² = ${k * k}·i² = ${k * k}·(−1) = ${-k * k}. The minus signs square away, but i² still gives −1.`);
      if (kind === 2) return E.num(`Simplify ${M(`${m}i^2${c ? (c > 0 ? '+' + c : c) : ''}`)}.`, [{ ans: c - m }], `i² = −1, so ${m}(−1)${c ? ' ' + sg(c) : ''} = ${c - m}.`);
      return E.num(`Simplify ${M(`${m}i*${k}i`)}.`, [{ ans: -m * k }], `${m}·${k}·i² = ${m * k}·(−1) = ${-m * k}.`); } },
    b: { t: 'why it was invented', g: R => { const kind = R.int(0, 3), k = R.int(2, 20), r = E.surdStr(0, 1, k), ri = P(cxs('0', r));
      if (kind === 0) return E.choice(R, 'Which equation has no real solution, but has two solutions once we allow i?', M(`x^2+${k}=0`), [M(`x^2-${k}=0`), M(`x^2+${k}x=0`), M(`x+${k}=0`)],
        `${M(`x^2+${k}=0`)} means x² = −${k}. No real number squares to a negative, but x = ±${ri} works.`);
      if (kind === 1) return E.choice(R, 'Why was the number i invented?', 'So that equations like x² = −1 have solutions', ['To give a name to negative numbers', 'Because √1 had no value', 'To make every equation have exactly one solution'],
        'No real number squares to −1, so mathematicians created i with i² = −1. Then every quadratic has solutions.');
      if (kind === 2) return E.choice(R, 'What is the number i defined to be?', 'A number whose square is −1', ['The number −1', 'A number whose square is 1', 'The square root of 1'], 'i is defined by i² = −1. i itself is not −1: only its square is.');
      return E.choice(R, `Over the real numbers, ${M(`x^2=-${k}`)} has no solution. What are its solutions once i is allowed?`, `x = ${ri} or x = −${ri}`, [`x = ${P(r)} or x = −${P(r)}`, `x = ${k}i or x = −${k}i`, 'There are still no solutions'],
        `x = ±√(−${k}) = ±i√${k}${r !== 'sqrt(' + k + ')' ? ' = ±' + ri : ''}. Check: (${ri})² = ${k}·i² = −${k}.`); } },
    c: { t: 'powers of i cycle', g: R => { const n = R.int(1, 24), split = R.bool(0.3) && n > 4, a = split ? R.int(2, n - 2) : n, b = n - a;
      const idx = [3, 0, 1, 2][n % 4], val = ['i', '−1', '−i', '1'][idx];
      return E.choiceFixed(`What is ${split ? `i${SUP(a)} · i${SUP(b)}` : M(`i^${n}`)}?`, [M('i'), M('-1'), M('-i'), M('1')], idx,
        `${split ? `Add the powers: i^${a}·i^${b} = i^${n}. ` : ''}The powers cycle i, −1, −i, 1. ${n} = 4·${Math.floor(n / 4)} + ${n % 4}${n % 4 ? `, so i^${n} = i^${n % 4} = ${val}` : `, a multiple of 4, so i^${n} = 1`}.`.replace(/i\^(\d+)/g, (m, d) => 'i' + SUP(d))); } },
    d: { t: 'simplify iⁿ', g: R => {
      if (R.bool(0.45)) { const N = R.int(25, 2030), v = ipow(N), ans = cs(v[0], v[1]);
        return E.num(`Simplify ${M(`i^${N}`)}.`, [{ complex: ans, form: 'standard' }], `${N} = 4·${Math.floor(N / 4)} + ${N % 4}, and i⁴ = 1, so i${SUP(N)} = i${SUP(N % 4)} = ${P(ans)}.`); }
      const p = nz(R, -6, 6), q = nz(R, -6, 6), N1 = R.int(10, 99); let N2; do N2 = R.int(10, 99); while (N2 === N1); const c = R.int(-9, 9);
      const v1 = ipow(N1), v2 = ipow(N2), re = c + p * v1[0] + q * v2[0], im = p * v1[1] + q * v2[1], ans = cs(re, im);
      const expr = `${co(p)}i^${N1}${q > 0 ? '+' : ''}${co(q)}i^${N2}${c ? (c > 0 ? '+' + c : c) : ''}`;
      return E.num(`Simplify ${M(expr)}. Write it in the form a + bi.`, [{ complex: ans, form: 'standard' }], `i${SUP(N1)} = i${SUP(N1 % 4)} = ${P(cs(...v1))} and i${SUP(N2)} = i${SUP(N2 % 4)} = ${P(cs(...v2))}, so the total is ${P(ans)}.`); } },
    e: { t: 'a long sum: fours cancel', g: R => { const m = R.int(0, 9), n = m + R.int(6, 60); let re = 0, im = 0; for (let k = m; k <= n; k++) { const v = ipow(k); re += v[0]; im += v[1]; }
      const ans = cs(re, im), cnt = n - m + 1, left = cnt % 4, head = m === 0 ? '1+i+i^2' : m === 1 ? 'i+i^2+i^3' : `i^${m}+i^${m + 1}+i^${m + 2}`;
      const rest = Array.from({ length: left }, (_, j) => P(cs(...ipow(n - left + 1 + j))));
      return E.num(`Simplify ${M(head)} + … + ${M('i^' + n)}. Write it in the form a + bi.`, [{ complex: ans, form: 'standard' }],
        `Any 4 powers in a row add to i − 1 − i + 1 = 0 (in some order). There are ${cnt} terms, so ${left ? `only the last ${left} survive${left > 1 ? `: ${rest.join(' + ')}` : ''} = ${P(ans)}` : 'everything cancels and the sum is 0'}.`.replace(/\+ −/g, '− ')); } },
    f: { t: 'products and weighted sums', g: R => {
      if (R.bool()) { const n = R.int(5, 70), T = n * (n + 1) / 2, ans = cs(...ipow(T));
        return E.num(`Simplify i · i² · i³ · … · i${SUP(n)}. Write it in the form a + bi.`, [{ complex: ans, form: 'standard' }],
          `Add the exponents: 1 + 2 + … + ${n} = ${n}·${n + 1}/2 = ${T}. Then ${T} = 4·${Math.floor(T / 4)} + ${T % 4}, so the product is i${SUP(T % 4)} = ${P(ans)}.`); }
      const q = R.int(2, 12), r = R.int(0, 3), n = 4 * q + r; let re = 0, im = 0; for (let k = 1; k <= n; k++) { const v = ipow(k); re += k * v[0]; im += k * v[1]; }
      const ans = cs(re, im), extra = Array.from({ length: r }, (_, j) => P(cs(...ipow(4 * q + 1 + j).map(x => x * (4 * q + 1 + j)))));
      return E.num(`Simplify ${M('i+2i^2+3i^3+4i^4')} + … + ${M(n + 'i^' + n)}. Write it in the form a + bi.`, [{ complex: ans, form: 'standard' }],
        `Group in fours: (4j + 1)i − (4j + 2) − (4j + 3)i + (4j + 4) = 2 − 2i for every group. The ${q} groups give ${P(cs(2 * q, -2 * q))}${r ? `, and the leftover term${r > 1 ? 's' : ''} ${extra.join(', ')} bring${r > 1 ? '' : 's'} it to ${P(ans)}` : ''}.`); } },
  });

  /* IV.8.02 Square roots of negatives */
  const SF = [2, 3, 5, 6, 7, 10, 11, 13, 14, 15, 17, 19, 21];
  S('IV.8.02', 'Square roots of negatives', {
    a: { t: '√−a = i√a', g: R => { const perfect = R.bool(0.6), k = R.int(2, 12), N = perfect ? k * k : R.pick(SF), ans = perfect ? cs(0, k) : `isqrt(${N})`;
      return E.num(`Write ${M(`sqrt(-${N})`)} in terms of i.`, [{ complex: ans }], `√−${N} = √${N}·√−1 = ${perfect ? `${k}·i = ${P(ans)}` : `i√${N}`}.`); } },
    b: { t: 'simplify', g: R => { const s = R.int(2, 6), m = R.pick([2, 3, 5, 6, 7, 10, 11]), c = R.pick([1, 1, 1, 2, 3]), N = s * s * m, k = c * s;
      return E.num(`Simplify ${M(`${c > 1 ? c : ''}sqrt(-${N})`)}. Write it as ${M('ksqrt(m)i')} with m as small as possible.`, [{ label: 'k =', ans: k }, { label: 'm =', ans: m }],
        `√−${N} = i√${N} = i√(${s * s}·${m}) = ${s}√${m} i${c > 1 ? `, and ${c}·${s}√${m} i = ${k}√${m} i` : ''}.`); } },
    c: { t: 'avoid √a·√b trap', g: R => { const p = R.int(2, 9), q = R.int(2, 9), pq = p * q;
      if (R.bool(0.7)) return E.choice(R, `What is ${M(`sqrt(-${p * p})*sqrt(-${q * q})`)}?`, M(`-${pq}`), [M(`${pq}`), M(`${pq}i`), M(`-${pq}i`)],
        `Change to i first: ${p}i · ${q}i = ${pq}i² = −${pq}. It is not √${p * p * q * q} = ${pq}: √a·√b = √(ab) fails when both are negative.`);
      return E.choice(R, `What is ${M(`sqrt(-${p * p})*sqrt(${q * q})`)}?`, M(`${pq}i`), [M(`-${pq}`), M(`${pq}`), M(`-${pq}i`)], `Change to i first: ${p}i · ${q} = ${pq}i. Only one factor is negative, so one i is left.`); } },
    d: { t: 'multiply correctly', g: R => { const kind = R.int(0, 2);
      if (kind === 2) { const p = R.int(-6, 6), s = R.int(1, 6), q = R.int(-6, 6), t = R.int(1, 6), sp = R.bool(), st = R.bool();
        const z = [p, sp ? s : -s], w = [q, st ? t : -t], v = cmul(z, w), ans = cs(v[0], v[1]);
        const f = (a, sq, pos) => `(${a ? a : ''}${a ? (pos ? '+' : '-') : (pos ? '' : '-')}sqrt(-${sq}))`;
        return E.num(`Multiply: ${M(f(p, s * s, sp) + f(q, t * t, st))}. Write it in the form a + bi.`, [{ complex: ans, form: 'standard' }], `First write each root with i: (${P(cs(...z))})(${P(cs(...w))}). Then FOIL with i² = −1: ${P(ans)}.`); }
      const L = [2, 3, 5, 6, 7, 8, 10, 12, 15, 18, 20, 27], a = R.pick(L); let b; do b = R.pick(L); while (b === a && R.bool(0.7)); const c1 = R.pick([1, 1, 2, 3]), c2 = R.pick([1, 1, 2]);
      const A = `${c1 > 1 ? c1 : ''}sqrt(-${a})`;
      if (kind === 0) { const ans = E.surdStr(0, -c1 * c2, a * b);
        return E.num(`Multiply: ${M(`${A}*${c2 > 1 ? c2 : ''}sqrt(-${b})`)}. Give an exact answer.`, [{ complex: ans, form: 'standard' }], `Change to i first: ${c1 > 1 ? c1 : ''}i√${a} · ${c2 > 1 ? c2 : ''}i√${b} = ${c1 * c2 > 1 ? c1 * c2 : ''}i²√${a * b} = ${P(ans)}, since i² = −1. It is not +${P(E.surdStr(0, c1 * c2, a * b))}.`); }
      const ans = cxs('0', E.surdStr(0, c1 * c2, a * b));
      return E.num(`Multiply: ${M(`${A}*${c2 > 1 ? c2 : ''}sqrt(${b})`)}. Give an exact answer.`, [{ complex: ans, form: 'standard' }], `Change to i first: ${c1 > 1 ? c1 : ''}i√${a} · ${c2 > 1 ? c2 : ''}√${b} = ${c1 * c2 > 1 ? c1 * c2 : ''}i√${a * b} = ${P(ans)}.`); } },
  });

  /* IV.8.03 Standard form a + bi */
  S('IV.8.03', 'Standard form a + bi', {
    a: { t: 'real and imaginary parts', g: R => { const order = R.int(0, 3); let a = nz(R, -9, 9), b = nz(R, -9, 9); if (order === 2) a = 0; if (order === 3) b = 0;
      const shown = order === 1 ? `${cs(0, b)}${a > 0 ? '+' : ''}${a}` : cs(a, b);
      return E.num(`What are the real part and the imaginary part of ${M(shown)}?`, [{ label: 'real part =', ans: a }, { label: 'imaginary part =', ans: b }],
        `In a + bi form it is ${P(cs(a, b))}: real part ${a}, imaginary part ${b}. The imaginary part is the real number ${b}, not ${P(cs(0, b))}.`); } },
    b: { t: 'equality of complex numbers', g: R => { const x = R.int(-6, 6), y = R.int(-6, 6), m = R.pick([1, 1, 2, 3]), n = R.pick([1, 1, 2, 3]), p = R.int(-6, 6), q = R.int(-6, 6);
      const lin = (k, v, c) => `${co(k)}${v}${c ? (c > 0 ? '+' + c : c) : ''}`, A = m * x + p, B = n * y + q;
      const re = p ? `(${lin(m, 'x', p)})` : lin(m, 'x', 0), im = q ? `(${lin(n, 'y', q)})i` : `${co(n)}yi`;
      return E.num(`Find the real numbers x and y: ${M(`${re}+${im}=${cs(A, B)}`)}.`, [{ label: 'x =', ans: x }, { label: 'y =', ans: y }],
        `Two complex numbers are equal when their real parts match and their imaginary parts match: ${P(lin(m, 'x', p))} = ${A} gives x = ${x}, and ${P(lin(n, 'y', q))} = ${B} gives y = ${y}.`); } },
    c: { t: 'write in standard form', g: R => { const kind = R.int(0, 3);
      if (kind === 0) { const k = R.int(2, 5), a = nz(R, -6, 6), b = nz(R, -6, 6), ans = cs(a, b);
        return E.num(`Write ${M(`(${cs(k * a, k * b)})/${k}`)} in the form a + bi.`, [{ complex: ans, form: 'standard' }], `Divide each part by ${k}: ${k * a}/${k} = ${a} and ${k * b}/${k} = ${b}, so ${P(ans)}.`); }
      if (kind === 1) { const p = nz(R, -5, 5), q = nz(R, -6, 6), r = R.int(-9, 9), ans = cs(r - p, q);
        return E.num(`Write ${M(`${co(p)}i^2${q > 0 ? '+' : ''}${co(q)}i${r ? (r > 0 ? '+' + r : r) : ''}`)} in the form a + bi.`, [{ complex: ans, form: 'standard' }], `i² = −1, so ${P(co(p) + 'i^2')} = ${-p}. Collect the real parts: ${P(ans)}.`); }
      if (kind === 2) { const a = nz(R, -9, 9), s = R.int(1, 9), plus = R.bool(), ans = cs(a, plus ? s : -s);
        return E.num(`Write ${M(`${a}${plus ? '+' : '-'}sqrt(-${s * s})`)} in the form a + bi.`, [{ complex: ans, form: 'standard' }], `√−${s * s} = ${P(cs(0, s))}, so the number is ${P(ans)}.`); }
      const a = nz(R, -9, 9), b = nz(R, -9, 9); let c; do c = nz(R, -9, 9); while (c === b); const ans = cs(a, b - c);
      return E.num(`Write ${M(`${cs(0, b)}${a > 0 ? '+' : ''}${a}${c > 0 ? '-' : '+'}${cs(0, Math.abs(c))}`)} in the form a + bi.`, [{ complex: ans, form: 'standard' }], `Real part first, then combine the i-terms: ${b} − (${c}) = ${b - c}. So ${P(ans)}.`); } },
    d: { t: 'classify real, pure imaginary', g: R => { const kind = R.int(0, 2), k = R.int(2, 9), s = R.int(2, 9), a = nz(R, -9, 9), b = nz(R, -9, 9);
      const forms = [[`${k}i^2`, cs(-k, 0)], [`i^2+${k}`, cs(k - 1, 0)], [`${k}i^4`, cs(k, 0)], [`${a}+0i`, cs(a, 0)], [`sqrt(-${s * s})*i`, cs(-s, 0)]][R.int(0, 4)];
      const pure = [[`${b}i`, cs(0, b)], [`sqrt(-${s * s})`, cs(0, s)], [`${k}i^3`, cs(0, -k)], [`-sqrt(-${s * s})`, cs(0, -s)]][R.int(0, 3)];
      const nei = [[cs(a, b), cs(a, b)], [`${a}-sqrt(-${s * s})`, cs(a, -s)], [`${cs(0, b)}${a > 0 ? '+' : ''}${a}`, cs(a, b)], [`${k}+i^3`, cs(k, -1)]][R.int(0, 3)];
      const [shown, val] = [forms, pure, nei][kind];
      return E.choiceFixed(`Is ${M(shown)} real, pure imaginary, or neither?`, ['real', 'pure imaginary', 'neither'], kind,
        `It equals ${P(val)}. ${['Its imaginary part is 0, so it is real.', 'Its real part is 0 and its imaginary part is not, so it is pure imaginary.', 'Both parts are nonzero, so it is neither.'][kind]}`); } },
  });

  /* IV.8.04 Add & subtract complex */
  S('IV.8.04', 'Add & subtract complex', {
    a: { t: 'combine real parts', g: R => { const a = nz(R, -9, 9), b = nz(R, -9, 9), c = nz(R, -9, 9), d = nz(R, -9, 9);
      if (R.bool()) { const form = R.int(0, 2), ans = cs(form === 2 ? a - c : a + c, b);
        const shown = form === 0 ? `(${cs(a, b)})+${c < 0 ? '(' + c + ')' : c}` : form === 1 ? `${c}+(${cs(a, b)})` : `(${cs(a, b)})-${c < 0 ? '(' + c + ')' : c}`;
        return E.num(`Simplify ${M(shown)}.`, [{ complex: ans, form: 'standard' }], `Only the real parts combine: ${a} ${form === 2 ? '−' : '+'} ${pn(c)} = ${form === 2 ? a - c : a + c}. The imaginary part ${b} stays. So ${P(ans)}.`); }
      return E.num(`What is the real part of ${M(`(${cs(a, b)})+(${cs(c, d)})`)}?`, [{ label: 'real part =', ans: a + c }], `Add the real parts: ${a} + ${pn(c)} = ${a + c}.`); } },
    b: { t: 'combine imaginary parts', g: R => { const a = nz(R, -9, 9), b = nz(R, -9, 9), c = nz(R, -9, 9), d = nz(R, -9, 9);
      if (R.bool(0.3)) { const ans = cs(a, b + d); return E.num(`Simplify ${M(`(${cs(a, b)})+${d < 0 ? '(' + cs(0, d) + ')' : cs(0, d)}`)}.`, [{ complex: ans, form: 'standard' }], `Only the imaginary parts combine: ${b} + ${pn(d)} = ${b + d}. So ${P(ans)}.`); }
      const ans = cs(a + c, b + d);
      return E.num(`Add: ${M(`(${cs(a, b)})+(${cs(c, d)})`)}.`, [{ complex: ans, form: 'standard' }], `Real parts: ${a} + ${pn(c)} = ${a + c}. Imaginary parts: ${b} + ${pn(d)} = ${b + d}. So ${P(ans)}.`); } },
    c: { t: 'distribute minus', g: R => { const a = nz(R, -9, 9), b = nz(R, -9, 9), c = nz(R, -9, 9), d = nz(R, -9, 9);
      if (R.bool(0.25)) { const ans = cs(a - c, -d); return E.num(`Simplify ${M(`${a}-(${cs(c, d)})`)}.`, [{ complex: ans, form: 'standard' }], `The minus applies to both parts: ${a} − ${pn(c)} = ${a - c}, and the imaginary part becomes ${-d}. So ${P(ans)}.`); }
      const ans = cs(a - c, b - d);
      return E.num(`Subtract: ${M(`(${cs(a, b)})-(${cs(c, d)})`)}.`, [{ complex: ans, form: 'standard' }], `Subtract both parts: ${a} − ${pn(c)} = ${a - c} and ${b} − ${pn(d)} = ${b - d}. So ${P(ans)}.`); } },
    d: { t: 'as vectors', g: R => { const add = R.bool(); let a, b, c, d, x, y;
      do { a = R.int(-4, 4); b = R.int(-4, 4); c = R.int(-4, 4); d = R.int(-4, 4); x = add ? a + c : a - c; y = add ? b + d : b - d; } while ((a === 0 && b === 0) || (c === 0 && d === 0) || (a === c && b === d) || Math.abs(x) > 6 || Math.abs(y) > 6);
      const L = Lfit(a, b, c, d, x, y), ans = cs(x, y);
      const vis = argand({ L, pts: [[a, b, 'z'], [c, d, 'w']], segs: [[0, 0, a, b, C.blue], [0, 0, c, d, C.red]], label: 'z and w as arrows from 0' });
      return E.num(`The arrows show z and w on the complex plane. Find ${add ? 'z + w' : 'z − w'}.`, [{ complex: ans, form: 'standard' }],
        `z = ${P(cs(a, b))} and w = ${P(cs(c, d))}. ${add ? 'Adding' : 'Subtracting'} moves by the arrow${add ? '' : ' in reverse'}: (${a} ${add ? '+' : '−'} ${pn(c)}) + (${b} ${add ? '+' : '−'} ${pn(d)})i = ${P(ans)}.`, { visual: vis }); } },
    e: { t: 'solve for z', g: R => { const kind = R.int(0, 2), z = [R.int(-8, 8), R.int(-8, 8)], w = [nz(R, -8, 8), nz(R, -8, 8)], zs = cs(...z);
      const wrap = v => { const s = cs(...v); return /[+-]/.test(s.slice(1)) ? `(${s})` : s; };
      if (kind === 0) { const rhs = [w[0] - z[0], w[1] - z[1]];
        return E.num(`Solve for z: ${M(`${wrap(w)}-z=${cs(...rhs)}`)}.`, [{ label: 'z =', complex: zs, form: 'standard' }], `Move z to one side: z = (${P(cs(...w))}) − (${P(cs(...rhs))}) = ${P(zs)}. Subtract both parts.`); }
      if (kind === 1) { const k = R.pick([2, 3, -1, -2]), rhs = [k * z[0] + w[0], k * z[1] + w[1]];
        return E.num(`Solve for z: ${M(`${co(k)}z+${wrap(w)}=${cs(...rhs)}`)}.`, [{ label: 'z =', complex: zs, form: 'standard' }], `Subtract ${P(cs(...w))}: ${k === -1 ? '−' : k}z = ${P(cs(rhs[0] - w[0], rhs[1] - w[1]))}. Divide both parts by ${k}: z = ${P(zs)}.`); }
      const u = [nz(R, -8, 8), nz(R, -8, 8)], rhs = [z[0] - w[0] + u[0], z[1] - w[1] + u[1]];
      return E.num(`Solve for z: ${M(`z-${wrap(w)}=${cs(...rhs)}-${wrap(u)}`)}.`, [{ label: 'z =', complex: zs, form: 'standard' }], `Right side: ${P(cs(rhs[0] - u[0], rhs[1] - u[1]))}. Add ${P(cs(...w))}: z = ${P(zs)}.`); } },
    f: { t: 'all fourth vertices', g: R => { let A, B, Cc; do { A = [R.int(-4, 4), R.int(-4, 4)]; B = [R.int(-4, 4), R.int(-4, 4)]; Cc = [R.int(-4, 4), R.int(-4, 4)]; } while ((B[0] - A[0]) * (Cc[1] - A[1]) - (B[1] - A[1]) * (Cc[0] - A[0]) === 0);
      const add = (u, v, w) => cs(u[0] + v[0] - w[0], u[1] + v[1] - w[1]), ans = [add(A, B, Cc), add(A, Cc, B), add(B, Cc, A)];
      return E.num(`Three vertices of a parallelogram are ${M(cs(...A))}, ${M(cs(...B))} and ${M(cs(...Cc))}. Find all possible fourth vertices.`, [{ label: 'fourth vertex:', set: ans }],
        `The diagonals share a midpoint, so the fourth vertex is (sum of two) − (the one opposite it). Choosing each vertex as the opposite one gives ${ans.map(P).join(', ')}.`); } },
  });

  /* IV.8.05 Multiply complex */
  S('IV.8.05', 'Multiply complex', {
    a: { t: 'by a real', g: R => { let k; do k = nz(R, -9, 9); while (Math.abs(k) === 1); const a = nz(R, -9, 9), b = nz(R, -9, 9), ans = cs(k * a, k * b), left = R.bool(0.7);
      return E.num(`Multiply: ${M(left ? `${k}(${cs(a, b)})` : `(${cs(a, b)})*${k < 0 ? '(' + k + ')' : k}`)}.`, [{ complex: ans, form: 'standard' }], `Multiply both parts by ${k}: ${k}·${pn(a)} = ${k * a} and ${k}·${pn(b)} = ${k * b}. So ${P(ans)}.`); } },
    b: { t: 'by i', g: R => { const k = R.pick([1, -1, 2, -2, 3, -3, 4, 5]), a = nz(R, -9, 9), b = nz(R, -9, 9), ans = cs(-k * b, k * a);
      return E.num(`Multiply: ${M(`${cs(0, k)}(${cs(a, b)})`)}.`, [{ complex: ans, form: 'standard' }],
        `${P(cs(0, k))}·${pn(a)} = ${P(cs(0, k * a))}, and (${P(cs(0, k))})(${P(cs(0, b))}) = ${k * b}i² = ${-k * b}. So ${P(ans)}.`); } },
    c: { t: 'FOIL and i² = −1', g: R => { const a = nz(R, -6, 6), b = nz(R, -6, 6), c = nz(R, -6, 6), d = nz(R, -6, 6), v = cmul([a, b], [c, d]), ans = cs(v[0], v[1]);
      return E.num(`Multiply: ${M(`(${cs(a, b)})(${cs(c, d)})`)}.`, [{ complex: ans, form: 'standard' }],
        `FOIL: ${a * c} ${sg(a * d)}i ${sg(b * c)}i ${sg(b * d)}i². Since i² = −1, ${b * d}i² = ${-b * d}. Total: ${P(ans)}.`); } },
    d: { t: 'squares of complex numbers', g: R => { const a = nz(R, -7, 7), b = nz(R, -7, 7), ans = cs(a * a - b * b, 2 * a * b), flip = R.bool(0.25);
      return E.num(`Simplify ${M(`(${flip ? `${cs(0, b)}${a > 0 ? '+' : ''}${a}` : cs(a, b)})^2`)}.`, [{ complex: ans, form: 'standard' }],
        `(a + bi)² = a² + 2abi + b²i² = ${a * a} ${sg(2 * a * b)}i − ${b * b} = ${P(ans)}. It is not a² + b²i alone: the middle term 2abi matters.`); } },
    e: { t: 'find k: real or pure imaginary', g: R => { const kind = R.int(0, 3); let a, b, c, k;
      for (;;) { a = nz(R, -6, 6); b = nz(R, -6, 6); c = nz(R, -6, 6);
        // kind 0/1: (a+bi)(c+ki); kind 2/3: (k+bi)(c+ai)  [a plays d]
        const num = [-b * c, a * c, -b * c, b * a][kind], den = [a, b, a, c][kind]; if (num % den) continue; k = num / den; if (!k || Math.abs(k) > 12) continue;
        const pr = kind < 2 ? cmul([a, b], [c, k]) : cmul([k, b], [c, a]); if (pr[kind % 2 ? 1 : 0] === 0) continue; break; }
      const real = kind % 2 === 0, kS = (x, y) => `${x}${y > 0 ? '+' : '-'}${Math.abs(y) === 1 ? '' : Math.abs(y)}i`;
      const shown = kind < 2 ? `(${cs(a, b)})(${c}+ki)` : `(${kS('k', b)})(${cs(c, a)})`;
      const reP = kind < 2 ? lin2(-b, a * c) : lin2(c, -a * b), imP = lin2(a, b * c);
      return E.num(`For what real number k is ${M(shown)} ${real ? 'a real number' : 'pure imaginary'}?`, [{ label: 'k =', ans: k }],
        `Expand: real part ${reP}, imaginary part ${imP}. ${real ? `Set the imaginary part to 0: ${imP} = 0` : `Set the real part to 0: ${reP} = 0`}, so k = ${k}.`); } },
    f: { t: 'square roots by matching parts', g: R => { let x, y; do { x = nz(R, -6, 6); y = nz(R, -6, 6); } while (x < 0 && R.bool(0.3));
      const A = x * x - y * y, B = 2 * x * y, N = x * x + y * y, w = cs(A, B), ans = [cs(x, y), cs(-x, -y)];
      return E.num(`Find all complex numbers z with ${M('z^2=' + w)}.`, [{ label: 'z =', set: ans }],
        `Let z = x + yi: x² − y² = ${A} and 2xy = ${B}. Also |z|² = |z²|, so x² + y² = √(${A * A} + ${B * B}) = ${N}. Adding gives x² = ${x * x}, and 2xy = ${B} fixes the signs: z = ${P(ans[0])} or ${P(ans[1])}.`); } },
  });

  /* IV.8.06 Conjugates */
  S('IV.8.06', 'Conjugates', {
    a: { t: 'write the conjugate', g: R => { const kind = R.pick([0, 0, 0, 0, 0, 0, 1, 2]); let a = nz(R, -9, 9), b = nz(R, -9, 9); if (kind === 1) b = 0; if (kind === 2) a = 0; const ans = cs(a, -b);
      return E.num(`Write the conjugate of ${M(cs(a, b))}.`, [{ complex: ans, form: 'standard' }], kind === 1 ? `A real number is its own conjugate: ${a}.` : `Flip the sign of the imaginary part only: ${P(ans)}. The real part stays ${a}.`); } },
    b: { t: 'z·z̅ is real', g: R => { const a = nz(R, -9, 9), b = nz(R, -9, 9), N = a * a + b * b;
      const pr = R.bool() ? `Let ${M('z=' + cs(a, b))}. Find z·z̄, the product of z and its conjugate.` : `Multiply: ${M(`(${cs(a, b)})(${cs(a, -b)})`)}.`;
      return E.num(pr, [{ ans: N }], `(a + bi)(a − bi) = a² − b²i² = a² + b² = ${a * a} + ${b * b} = ${N}. The i-terms cancel, so the product is real.`); } },
    c: { t: 'reflection in the plane', g: R => { let a, b; do { a = nz(R, -5, 5); b = nz(R, -5, 5); } while (Math.abs(a) === Math.abs(b));
      const cands = R.shuffle([[a, -b, 1], [-a, b, 0], [-a, -b, 0], [b, a, 0]]), L = ['A', 'B', 'C', 'D'], idx = cands.findIndex(c => c[2]);
      const vis = argand({ L: 6, pts: [[a, b, 'z'], ...cands.map((c, k) => [c[0], c[1], L[k]])], label: 'point z and four lettered points' });
      return E.choiceFixed(`The point z = ${M(cs(a, b))} is shown. Which lettered point is z̄, the conjugate of z?`, L, idx, `z̄ = ${P(cs(a, -b))} sits at (${a}, ${-b}): the reflection of z in the real axis. That is point ${L[idx]}.`, { visual: vis }); } },
    d: { t: 'conjugate pairs of roots', g: R => { const kind = R.int(0, 2), p = R.int(-6, 6), q = nz(R, -6, 6), z = cs(p, q), zb = cs(p, -q);
      if (kind === 0) return E.num(`A quadratic with real coefficients has ${M(z)} as a root. What is its other root?`, [{ complex: zb, form: 'standard' }], `Non-real roots of a real polynomial come in conjugate pairs, so the other root is ${P(zb)}.`);
      if (kind === 1) { const r = R.int(-6, 6); return E.num(`A cubic with real coefficients has roots ${r} and ${M(z)}. What is its third root?`.replace(/roots -/, 'roots −'), [{ complex: zb, form: 'standard' }], `The conjugate ${P(zb)} must also be a root. With ${r} that makes three, so it is the third root.`); }
      return E.num(`A quadratic with real coefficients has roots ${M(z)} and its conjugate. Find the sum and the product of the two roots.`, [{ label: 'sum =', ans: 2 * p }, { label: 'product =', ans: p * p + q * q }],
        `Sum: (${P(z)}) + (${P(zb)}) = ${2 * p}. Product: ${p < 0 ? `(${p})` : p}² + ${q < 0 ? `(${q})` : q}² =${p * p + q * q}. Both are real, as they must be.`); } },
  });

  /* IV.8.07 Divide complex */
  const fracC = (a, b, c, d) => { const N = c * c + d * d; return cxs(E.fracStr(a * c + b * d, N), E.fracStr(b * c - a * d, N)); };
  const qshow = (a, b, c, d) => M(`(${cs(a, b)})/(${cs(c, d)})`);
  S('IV.8.07', 'Divide complex', {
    a: { t: 'multiply by the conjugate', g: R => { const a = nz(R, -9, 9), b = nz(R, -9, 9), c = nz(R, -6, 6), d = nz(R, -6, 6), cj = cs(c, -d);
      if (R.bool()) return E.num(`To divide ${qshow(a, b, c, d)}, you multiply the top and bottom by the same number to make the bottom real. Which number?`, [{ complex: cj, form: 'standard' }],
        `Use the conjugate of the denominator: ${P(cj)}. Then (${P(cs(c, d))})(${P(cj)}) = ${c * c + d * d} is real. Don't divide the parts separately.`);
      const v = cmul([a, b], [c, -d]), ans = cs(v[0], v[1]);
      return E.num(`You multiply the top and bottom of ${qshow(a, b, c, d)} by ${M(cj)}. What is the new numerator?`, [{ complex: ans, form: 'standard' }], `(${P(cs(a, b))})(${P(cj)}) = ${a * c} ${sg(-a * d)}i ${sg(b * c)}i ${sg(-b * d)}i² = ${P(ans)}.`); } },
    b: { t: 'simplify the denominator', g: R => { const a = nz(R, -9, 9), b = nz(R, -9, 9), c = nz(R, -9, 9), d = nz(R, -9, 9), N = c * c + d * d;
      return E.num(`You multiply the top and bottom of ${qshow(a, b, c, d)} by ${M(cs(c, -d))}. What is the new denominator?`, [{ ans: N }], `(${P(cs(c, d))})(${P(cs(c, -d))}) = ${pn(c)}² + ${pn(d)}² = ${c * c} + ${d * d} = ${N}. The i-terms cancel.`); } },
    c: { t: 'standard form answer', g: R => { const c = nz(R, -4, 4), d = nz(R, -4, 4); let a, b;
      if (R.bool(0.55)) { const p = R.int(-5, 5), q = nz(R, -5, 5); [a, b] = cmul([p, q], [c, d]); } else { a = nz(R, -9, 9); b = R.int(-9, 9); }
      const N = c * c + d * d, v = cmul([a, b], [c, -d]), ans = fracC(a, b, c, d);
      return E.num(`Divide: ${qshow(a, b, c, d)}. Write the answer in the form a + bi.`, [{ complex: ans, form: 'standard' }],
        `Multiply top and bottom by ${P(cs(c, -d))}: the top becomes ${P(cs(v[0], v[1]))} and the bottom ${N}. Divide each part by ${N}: ${P(ans)}.`); } },
    d: { t: 'reciprocals', g: R => { const kind = R.int(0, 2);
      if (kind === 1) { const b = nz(R, -9, 9), k = R.pick([1, 1, 2, 3, 5]), ans = cxs('0', E.fracStr(-k, b));
        return E.num(`Write ${M(`${k}/${b < 0 ? '(' + cs(0, b) + ')' : cs(0, b)}`)} in the form a + bi.`, [{ complex: ans, form: 'standard' }], `Multiply top and bottom by i: ${k}i/(${b}i²) = ${k}i/${-b} = ${P(ans)}.`); }
      const a = nz(R, -6, 6), b = nz(R, -6, 6), k = kind === 0 ? 1 : nz(R, -5, 5), N = a * a + b * b, ans = cxs(E.fracStr(k * a, N), E.fracStr(-k * b, N));
      return E.num(`Write ${M(`${k}/(${cs(a, b)})`)} in the form a + bi.`, [{ complex: ans, form: 'standard' }], `Multiply top and bottom by ${P(cs(a, -b))}: ${k === 1 ? '' : k}(${P(cs(a, -b))})/${N} = ${P(ans)}.`); } },
  });

  /* IV.8.08 Complex plane */
  const LET = ['A', 'B', 'C', 'D'];
  S('IV.8.08', 'Complex plane', {
    a: { t: 'real and imaginary axes', g: R => { const kind = R.int(0, 5), k = R.int(2, 9), s = R.int(1, 9); let a, b, shown;
      if (kind === 0) { a = nz(R, -9, 9); b = 0; shown = R.bool(0.3) ? `${k}i^2` : String(a); if (shown !== String(a)) a = -k; }
      else if (kind === 1) { a = 0; b = nz(R, -9, 9); shown = R.bool(0.3) ? `sqrt(-${s * s})` : cs(0, b); if (shown !== cs(0, b)) b = s; }
      else { const sa = kind === 2 || kind === 5 ? 1 : -1, sb = kind <= 3 ? 1 : -1; a = sa * R.int(1, 9); b = sb * R.int(1, 9); shown = cs(a, b); }
      const opts = ['the real axis', 'the imaginary axis', 'Quadrant I', 'Quadrant II', 'Quadrant III', 'Quadrant IV'];
      return E.choiceFixed(`Where is ${M(shown)} plotted on the complex plane?`, opts, kind, `${P(cs(a, b))} is plotted at (${a}, ${b}), ${kind === 0 ? 'on the real axis (across)' : kind === 1 ? 'on the imaginary axis (up and down)' : 'in ' + opts[kind]}.`); } },
    b: { t: 'plot a + bi', g: R => { const kind = R.pick([0, 0, 0, 1, 2]); let a, b, cands;
      if (kind === 0) { do { a = nz(R, -5, 5); b = nz(R, -5, 5); } while (Math.abs(a) === Math.abs(b)); cands = [[a, b, 1], [b, a, 0], [a, -b, 0], [-a, b, 0]]; }
      else if (kind === 1) { a = 0; b = nz(R, -5, 5); cands = [[0, b, 1], [b, 0, 0], [0, -b, 0], [-b, 0, 0]]; }
      else { b = 0; a = nz(R, -5, 5); cands = [[a, 0, 1], [0, a, 0], [-a, 0, 0], [0, -a, 0]]; }
      cands = R.shuffle(cands); const idx = cands.findIndex(c => c[2]);
      const vis = argand({ L: 6, pts: cands.map((c, k) => [c[0], c[1], LET[k]]), label: 'four lettered points' });
      return E.choiceFixed(`Which point shows ${M('z=' + cs(a, b))}?`, LET, idx, `a + bi is plotted at (a, b): real part across, imaginary part up. ${P(cs(a, b))} goes at (${a}, ${b}), point ${LET[idx]}.`, { visual: vis }); } },
    c: { t: 'read a point', g: R => { const sc = R.pick([1, 1, 2, 5]), pair = R.pick([['P', 'Q'], ['A', 'B'], ['z', 'w']]), two = R.bool(0.45), ask = R.int(0, two ? 1 : 0);
      const pick = () => { let a, b; do { a = R.int(-6, 6); b = R.int(-6, 6); } while ((a === 0 && b === 0) || ((a === 0 || b === 0) && R.bool(0.6))); return [a * sc, b * sc]; };
      const p1 = pick(); let p2; do p2 = pick(); while (p2[0] === p1[0] && p2[1] === p1[1]);
      const pts = two ? [[...p1, pair[0]], [...p2, pair[1]]] : [[...p1, pair[0]]], [a, b] = ask ? p2 : p1, nm = pair[ask], ans = cs(a, b);
      return E.num(`${two ? 'Two points are plotted. ' : ''}${sc > 1 ? `Grid lines are ${sc} units apart. ` : ''}Which complex number is plotted at ${nm}?`, [{ complex: ans, form: 'standard' }],
        `${nm} is at (${a}, ${b}): real part ${a} (across), imaginary part ${b} (up). So ${nm} is ${P(ans)}.`, { visual: argand({ L: 7 * sc, ticks: sc, pts, label: two ? 'two lettered points' : 'one lettered point' }) }); } },
    d: { t: 'addition as moving', g: R => { const kind = R.int(0, 2), a = R.int(-5, 5), b = R.int(-5, 5), h = nz(R, -6, 6), v = nz(R, -6, 6);
      const u = n => `${Math.abs(n)} unit${Math.abs(n) > 1 ? 's' : ''}`, mv = `Move ${u(h)} ${h > 0 ? 'right' : 'left'} and ${u(v)} ${v > 0 ? 'up' : 'down'}`;
      if (kind === 0) return E.num(`Start at ${M(cs(a, b))}. ${mv}. Which complex number did you add?`, [{ complex: cs(h, v), form: 'standard' }], `Right/left changes the real part by ${h}; up/down changes the imaginary part by ${v}. You added ${P(cs(h, v))}.`);
      if (kind === 1) { const ans = cs(a + h, b + v); return E.num(`Start at ${M(cs(a, b))}. ${mv}. Which complex number do you reach?`, [{ complex: ans, form: 'standard' }], `Adding ${P(cs(h, v))} moves you there: ${P(cs(a, b))} + (${P(cs(h, v))}) = ${P(ans)}.`); }
      let c, d; do { c = R.int(-5, 5); d = R.int(-5, 5); } while (c === a && d === b); const ans = cs(c - a, d - b);
      return E.num('Adding which complex number moves point P to point Q?', [{ complex: ans, form: 'standard' }], `P = ${P(cs(a, b))} and Q = ${P(cs(c, d))}. Q − P = ${P(ans)}: ${Math.abs(c - a)} ${c >= a ? 'right' : 'left'}, ${Math.abs(d - b)} ${d >= b ? 'up' : 'down'}.`,
        { visual: argand({ L: 6, pts: [[a, b, 'P'], [c, d, 'Q']], label: 'points P and Q' }) }); } },
  });

  /* IV.8.09 Modulus */
  const TRI = [[3, 4, 5], [5, 12, 13], [6, 8, 10], [8, 15, 17], [9, 12, 15], [12, 16, 20], [7, 24, 25]];
  const dist = N => { const r = Math.sqrt(N); return Number.isInteger(r) ? { ans: r } : { exact: E.surdStr(0, 1, N), form: 'simplest' }; };
  S('IV.8.09', 'Modulus', {
    a: { t: 'modulus = √(a² + b²)', g: R => { let a, b, c;
      if (R.bool(0.2)) { c = R.int(2, 12); [a, b] = R.shuffle([0, R.pick([c, -c])]); } else { const t = R.pick(TRI); [a, b] = R.bool() ? [t[0], t[1]] : [t[1], t[0]]; c = t[2]; a *= R.pick([1, -1]); b *= R.pick([1, -1]); }
      return E.num(`Find ${M(`|${cs(a, b)}|`)}.`, [{ ans: c }], `|a + bi| = √(a² + b²) = √(${a * a} + ${b * b}) = √${c * c} = ${c}${a && b ? `, not ${Math.abs(a)} + ${Math.abs(b)}` : ''}.`); } },
    b: { t: 'distance from 0', g: R => { const a = nz(R, -8, 8), b = nz(R, -8, 8), N = a * a + b * b, f = dist(N);
      return E.num(`How far is ${M(cs(a, b))} from 0 on the complex plane? Give the exact answer.`, [f], `The distance from 0 is the modulus: √(${pn(a)}² + ${pn(b)}²) = √${N}${f.exact && f.exact !== `sqrt(${N})` ? ' = ' + P(f.exact) : f.ans !== undefined ? ' = ' + f.ans : ''}.`,
        { visual: argand({ L: 9, pts: [[a, b, 'z']], segs: [[0, 0, a, b]], label: 'z and its distance from 0' }) }); } },
    c: { t: 'distance between two numbers', g: R => { let a, b, c, d; do { a = R.int(-7, 7); b = R.int(-7, 7); c = R.int(-7, 7); d = R.int(-7, 7); } while ((a === c && b === d) || (a === c || b === d) && R.bool(0.7));
      const N = (a - c) ** 2 + (b - d) ** 2, f = dist(N), sh = f.ans !== undefined ? String(f.ans) : P(f.exact);
      return E.num(`Find the distance between ${M(cs(a, b))} and ${M(cs(c, d))}. Give the exact answer.`, [f], `Distance = |z − w| = |${P(cs(a - c, b - d))}| = √(${(a - c) ** 2} + ${(b - d) ** 2}) = √${N}${sh !== '√' + N ? ' = ' + sh : ''}.`); } },
    d: { t: 'midpoint', g: R => { let a, b, c, d; do { a = R.int(-8, 8); b = R.int(-8, 8); c = R.int(-8, 8); d = R.int(-8, 8); } while (a === c && b === d);
      if (R.bool(0.35)) { const e = 2 * c - a, f = 2 * d - b, ans = cs(e, f); return E.num(`The midpoint of ${M(cs(a, b))} and w is ${M(cs(c, d))}. Find w.`, [{ complex: ans, form: 'standard' }], `The midpoint is (z + w)/2, so w = 2·(${P(cs(c, d))}) − (${P(cs(a, b))}) = ${P(ans)}.`); }
      const ans = cxs(E.fracStr(a + c, 2), E.fracStr(b + d, 2));
      return E.num(`Find the midpoint of ${M(cs(a, b))} and ${M(cs(c, d))} on the complex plane.`, [{ complex: ans, form: 'standard' }], `Midpoint = (z + w)/2 = (${P(cs(a + c, b + d))})/2 = ${P(ans)}.`); } },
    e: { t: 'find the missing part', g: R => { const t = R.pick(TRI.slice(0, 5)), sw = R.bool(), [u, v] = sw ? [t[1], t[0]] : [t[0], t[1]];
      if (R.bool()) { const a = u * R.pick([1, -1]); return E.num(`Find all real k with ${M(`|${a}+ki|=${t[2]}`)}.`.replace('+-', '-'), [{ label: 'k =', set: [String(v), String(-v)] }],
        `${a}² + k² = ${t[2]}², so k² = ${t[2] * t[2]} − ${a * a} = ${v * v} and k = ±${v}.`.replace(/^-(\d+)²/, '(−$1)²')); }
      const a = R.int(-5, 5), b = R.int(-5, 5), c = b + u * R.pick([1, -1]), ans = [String(a + v), String(a - v)];
      return E.num(`The distance from ${M(cs(a, b))} to ${M(`k${c ? (c > 0 ? '+' : '') + cs(0, c) : ''}`)} is ${t[2]}, and k is real. Find all possible k.`, [{ label: 'k =', set: ans }],
        `(k − ${pn(a)})² + (${c} − ${pn(b)})² = ${t[2]}², so (k − ${pn(a)})² = ${t[2] * t[2]} − ${u * u} = ${v * v}. So k = ${a} ± ${v}: k = ${ans[0]} or ${ans[1]}.`); } },
    f: { t: 'nearest and farthest', g: R => { const t = R.pick([[3, 4, 5], [6, 8, 10], [5, 12, 13], [4, 3, 5], [8, 6, 10], [12, 5, 13]]), c = [R.int(-3, 3), R.int(-3, 3)], sx = R.pick([1, -1]), sy = R.pick([1, -1]);
      const w = [c[0] - sx * t[0], c[1] - sy * t[1]], D = t[2]; let r; do r = R.int(1, D + 5); while (r === D);
      const lo = Math.abs(D - r), hi = D + r, zc = `|${zminus(...c)}|=${r}`, zw = `|${zminus(...w)}|`;
      return E.num(`z lies on the circle ${M(zc)}. Find the least and greatest possible values of ${M(zw)}.`, [{ label: 'least =', ans: lo }, { label: 'greatest =', ans: hi }],
        `${P(zw)} is the distance from z to ${P(cs(...w))}. That point is ${D} from the center ${P(cs(...c))}, ${r < D ? 'outside' : 'inside'} the circle of radius ${r}. Along the line through the center, the distances are ${r < D ? `${D} − ${r}` : `${r} − ${D}`} = ${lo} and ${D} + ${r} = ${hi}.`); } },
  });

  /* IV.8.10 Complex roots of quadratics */
  S('IV.8.10', 'Complex roots of quadratics', {
    a: { t: 'negative discriminant', g: R => { const kind = R.int(0, 2); let a, b, c, D;
      do { a = nz(R, -4, 4); b = R.int(-8, 8); c = R.int(-9, 9); if (kind === 1) { const h = nz(R, -4, 4); b = -2 * a * h; c = a * h * h; } D = b * b - 4 * a * c; } while (Math.sign(D) !== [1, 0, -1][kind]);
      return E.choiceFixed(`What kind of solutions does ${M(E.poly([a, b, c]) + '=0')} have?`, ['two real solutions', 'one repeated real solution', 'two non-real solutions (a conjugate pair)'], kind,
        `b² − 4ac = ${D}: ${['positive, so two real solutions.', 'zero, so one repeated real solution.', 'negative. That is not "no solution": √D is imaginary, so the solutions are a conjugate pair.'][kind]}`); } },
    b: { t: 'solve with the formula', g: R => { const p = R.bool(0.25) ? 0 : nz(R, -5, 5), q = R.int(1, 6), k = R.pick([1, 1, 1, 2, 3]), b = -2 * p * k, c = k * (p * p + q * q), D = b * b - 4 * k * c;
      const r1 = cs(p, q), r2 = cs(p, -q);
      return E.num(`Solve ${M(E.poly([k, b, c]) + '=0')} with the quadratic formula.`, [{ label: 'x =', set: [r1, r2] }],
        `b² − 4ac = ${D}, and √(${D}) = ${2 * k * q}i. So x = (${-b} ± ${2 * k * q}i)/${2 * k} = ${P(r1)} or ${P(r2)}.`); } },
    c: { t: 'conjugate pair answers', g: R => { let a, b, c, D; do { a = R.pick([2, 3, 4, 5]); b = R.int(-9, 9); c = R.int(1, 12); D = b * b - 4 * a * c; } while (D >= 0);
      const re = E.fracStr(-b, 2 * a), im = E.surdStr(0, 1, -D, 2 * a), r1 = cxs(re, im), r2 = cxs(re, '-' + im);
      return E.num(`Solve ${M(E.poly([a, b, c]) + '=0')}. Give exact answers.`, [{ label: 'x =', set: [r1, r2] }],
        `x = (${-b} ± √(${D}))/${2 * a} = (${-b} ± ${P(cxs('0', E.surdStr(0, 1, -D)))})/${2 * a}. So x = ${P(r1)} or ${P(r2)}: a conjugate pair.`); } },
    d: { t: 'check by substituting', g: R => { const p = nz(R, -4, 4), q = R.int(1, 5), b = -2 * p, c = p * p + q * q, ok = R.bool();
      let x; if (ok) x = R.bool() ? [p, q] : [p, -q]; else x = R.pick([[-p, q], [p, q + 1], [p + 1, q], [q, p]].filter(([u, v]) => !(u === p && Math.abs(v) === q)));
      const x2 = cmul(x, x), val = [x2[0] + b * x[0] + c, x2[1] + b * x[1]], zero = val[0] === 0 && val[1] === 0;
      return E.choiceFixed(`Is ${M('x=' + cs(x[0], x[1]))} a solution of ${M(E.poly([1, b, c]) + '=0')}?`, ['Yes', 'No'], zero ? 0 : 1,
        `x² = ${P(cs(x2[0], x2[1]))} and ${b}x = ${P(cs(b * x[0], b * x[1]))}, so x² ${sg(b)}x ${sg(c)} = ${P(cs(val[0], val[1]))}${zero ? '. It is 0, so yes.' : ', not 0, so no.'}`); } },
  });

  /* IV.8.11 Fundamental theorem of algebra */
  S('IV.8.11', 'Fundamental theorem of algebra', {
    a: { t: 'degree n has n roots', g: R => { const kind = R.int(0, 2); let shown, n;
      if (kind === 0) { n = R.int(1, 8); const cf = Array.from({ length: n + 1 }, (_, k) => k === 0 ? nz(R, -5, 5) : R.bool(0.6) ? R.int(-9, 9) : 0); shown = E.poly(cf); }
      else if (kind === 1) { n = R.int(2, 7); const cf = Array.from({ length: n + 1 }, (_, k) => k === 0 ? nz(R, -5, 5) : R.bool(0.5) ? nz(R, -9, 9) : 0);
        const terms = cf.map((c, k) => [c, n - k]).filter(t => t[0]).reverse(); shown = terms.map(([c, p], k) => { const body = p === 0 ? String(Math.abs(c)) : (Math.abs(c) === 1 ? '' : Math.abs(c)) + 'x' + (p > 1 ? '^' + p : ''); return (c < 0 ? '-' : k ? '+' : '') + body; }).join(''); }
      else { const fs = R.int(2, 3); n = 0; shown = ''; for (let k = 0; k < fs; k++) { const t = R.int(0, 2); if (t === 0) { shown += E.lin(nz(R, -6, 6)).replace(/^x$/, '(x)'); n += 1; } else if (t === 1) { shown += `(x^2+${R.int(1, 9)})`; n += 2; } else { const e = R.int(2, 3); shown += `${E.lin(nz(R, -6, 6))}^${e}`; n += e; } } }
      return E.num(`How many complex roots does ${M('p(x)=' + shown)} have, counted with multiplicity?`, [{ ans: n }], `${kind === 2 ? 'Adding the degrees of the factors gives' : 'The highest power of x is'} degree ${n}, so there are exactly ${n} complex roots, counting repeats (some may be non-real).`); } },
    b: { t: 'count with multiplicity', g: R => { const nl = R.int(1, 3), roots = R.sample([-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5], nl), ex_ = roots.map(() => R.int(1, 3)); if (nl === 1 && ex_[0] === 1) ex_[0] = 2;
      const hasQ = R.bool(0.45), k = R.int(1, 3), eq = R.pick([1, 1, 2]);
      const shown = roots.map((r, j) => ex_[j] > 1 ? `${r === 0 ? 'x' : E.lin(r)}^${ex_[j]}` : (r === 0 ? 'x' : E.lin(r))).join('') + (hasQ ? `(x^2+${k * k})${eq > 1 ? '^' + eq : ''}` : '');
      const total = ex_.reduce((s, e) => s + e, 0) + (hasQ ? 2 * eq : 0), distinct = nl + (hasQ ? 2 : 0), ask = R.int(0, 2);
      const why = `Roots: ${roots.map((r, j) => `${r} (×${ex_[j]})`).join(', ')}${hasQ ? `, ${P(cs(0, k))} and ${P(cs(0, -k))} (×${eq} each)` : ''}.`;
      if (ask === 0) return E.num(`How many roots does ${M('p(x)=' + shown)} have, counted with multiplicity?`, [{ ans: total }], `${why} Counting repeats: ${total}.`);
      if (ask === 1) return E.num(`How many different roots does ${M('p(x)=' + shown)} have?`, [{ ans: distinct }], `${why} Different values: ${distinct}.`);
      const j = R.int(0, nl - 1);
      return E.num(`What is the multiplicity of the root x = ${roots[j]} of ${M('p(x)=' + shown)}?`, [{ ans: ex_[j] }], `The factor ${P(roots[j] === 0 ? 'x' : E.lin(roots[j]))} appears to the power ${ex_[j]}, so x = ${roots[j]} counts ${ex_[j]} time${ex_[j] > 1 ? 's' : ''}.`); } },
    c: { t: 'conjugate root theorem', g: R => { const kind = R.int(0, 3), p = R.int(-5, 5), q = nz(R, -5, 5); let s, t; do { s = R.int(-5, 5); t = nz(R, -5, 5); } while (s === p && Math.abs(t) === Math.abs(q));
      const r1 = R.int(-6, 6); let r2; do r2 = R.int(-6, 6); while (r2 === r1);
      const [deg, given, missing] = [[3, [String(r1), cs(p, q)], [cs(p, -q)]], [4, [cs(p, q), cs(s, t)], [cs(p, -q), cs(s, -t)]], [4, [cs(p, q), String(r1), String(r2)], [cs(p, -q)]], [5, [cs(p, q), cs(s, t), String(r1)], [cs(p, -q), cs(s, -t)]]][kind];
      const g = R.shuffle(given.slice()), one = missing.length === 1;
      return E.num(`A polynomial of degree ${deg} with real coefficients has roots ${g.slice(0, -1).map(x => M(x)).join(', ')} and ${M(g[g.length - 1])}. ${one ? 'What is its other root?' : 'What are its other two roots?'}`, [{ label: one ? 'other root:' : 'other roots:', set: missing }],
        `Non-real roots of a real polynomial come in conjugate pairs, so ${missing.map(P).join(' and ')} must ${one ? 'be a root' : 'be roots'} too. That makes ${deg} roots, all of them.`); } },
    d: { t: 'build a polynomial from roots', g: R => { const kind = R.int(0, 2), p = nz(R, -5, 5), q = R.int(1, 5), r = R.int(-5, 5);
      const quadP = [1, -2 * p, p * p + q * q], quad0 = [1, 0, q * q];
      if (kind === 0) { const ans = E.poly(quadP);
        return E.num(`Write the monic quadratic with real coefficients that has ${M(cs(p, q))} as a root. Expand it.`, [{ label: 'p(x) =', expr: ans, form: 'expanded' }], `The conjugate ${P(cs(p, -q))} is the other root. Sum ${2 * p}, product ${p * p + q * q}: ${P(ans)}.`); }
      if (kind === 1) { const ans = E.poly(pmul([1, -r], quad0));
        return E.num(`Write the monic polynomial of lowest degree with real coefficients that has roots ${r} and ${M(cs(0, q))}. Expand it.`.replace(/roots -/, 'roots −'), [{ label: 'p(x) =', expr: ans, form: 'expanded' }], `${P(cs(0, -q))} must be a root too, so p(x) = ${P(E.lin(r).replace(/^x$/, 'x'))}(x² + ${q * q}) = ${P(ans)}.`); }
      const ans = E.poly(pmul([1, -r], quadP));
      return E.num(`Write the monic polynomial of lowest degree with real coefficients that has roots ${r} and ${M(cs(p, q))}. Expand it.`.replace(/roots -/, 'roots −'), [{ label: 'p(x) =', expr: ans, form: 'expanded' }],
        `${P(cs(p, -q))} must be a root too. The pair gives ${P(E.poly(quadP))}; times ${P(E.lin(r))} gives ${P(ans)}.`); } },
  });

  /* IV.8.12 Polar form */
  const ANG = [0, 30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330];
  const fam = (th, k) => { const rv = th % 90 === 0 ? k : th % 90 === 45 ? k * Math.SQRT2 : 2 * k, rStr = th % 90 === 0 ? String(k) : th % 90 === 45 ? `${k === 1 ? '' : k}sqrt(2)` : String(2 * k);
    const re = ex(rv * Math.cos(rad(th))), im = ex(rv * Math.sin(rad(th))); return { rv, rStr, re, im, z: cxs(re, im), x: rv * Math.cos(rad(th)), y: rv * Math.sin(rad(th)) }; };
  const refA = th => th <= 90 ? th : th <= 180 ? 180 - th : th <= 270 ? th - 180 : 360 - th;
  const where = (th, x, y) => th % 90 === 0 ? `on the ${th === 0 ? 'positive real' : th === 90 ? 'positive imaginary' : th === 180 ? 'negative real' : 'negative imaginary'} axis` : `in ${quad(x, y)}, with reference angle ${refA(th)}°`;
  S('IV.8.12', 'Polar form', {
    a: { t: 'argument (angle)', g: R => { const th = R.pick(ANG), k = R.pick([1, 1, 2, 3]), f = fam(th, k);
      return E.num(`Find the argument θ of ${M('z=' + f.z)}, in degrees with 0° ≤ θ < 360°.`, [{ label: 'θ =', ans: th }], `z is at (${P(f.re)}, ${P(f.im)}), ${where(th, f.x, f.y)}. So θ = ${th}°.${th > 90 && th % 90 ? ' Always check the quadrant: arctan alone gives only ' + refA(th) + '°.' : ''}`,
        { visual: argand({ L: Lfit(f.x, f.y), pts: [[f.x, f.y, 'z']], segs: [[0, 0, f.x, f.y]], label: 'z on the complex plane' }) }); } },
    b: { t: 'r(cos θ + i sin θ)', g: R => { const th = R.pick(ANG.filter(t => t % 90)), k = R.pick([1, 1, 2]), f = fam(th, k), r2 = Math.round(f.rv * f.rv);
      const right = pol(f.rStr, th), pool = [pol(f.rStr, refA(th)), pol(f.rStr, md(th + 180)), pol(f.rStr, md(-th)), pol(String(r2), th), pol(f.rStr, md(90 - th))].filter((s, j, A) => s !== right && A.indexOf(s) === j);
      return E.choice(R, `Which is ${M(f.z)} in polar form?`, right, R.sample(pool, 3), `r = √(${Math.round(f.x * f.x)} + ${Math.round(f.y * f.y)}) = ${P(f.rStr)}, and z is ${where(th, f.x, f.y)}, so θ = ${th}°.`); } },
    c: { t: 'convert rectangular to polar', g: R => { const th = R.pick(ANG), k = R.pick([1, 1, 2, 3]), f = fam(th, k), rf = /sqrt/.test(f.rStr) ? { exact: f.rStr, form: 'simplest' } : { ans: +f.rStr };
      return E.num(`Write ${M(f.z)} in polar form r(cos θ + i sin θ). Give r exactly and θ in degrees, 0° ≤ θ < 360°.`, [{ label: 'r =', ...rf }, { label: 'θ =', ans: th }],
        `r = √(${Math.round(f.x * f.x)} + ${Math.round(f.y * f.y)}) = ${P(f.rStr)}. z is ${where(th, f.x, f.y)}, so θ = ${th}°.`); } },
    d: { t: 'convert back', g: R => { const th = R.pick(ANG); let rStr, rv; if (R.bool()) { rv = R.int(1, 6); rStr = String(rv); } else { const f = fam(th, R.pick([1, 2])); rv = f.rv; rStr = f.rStr; }
      const re = ex(rv * Math.cos(rad(th))), im = ex(rv * Math.sin(rad(th))), ans = cxs(re, im);
      return E.num(`Write ${pol(rStr, th)} in the form a + bi. Give exact values.`, [{ complex: ans, form: 'standard' }], `a = r cos θ = ${P(rStr)}·cos ${th}° = ${P(re)} and b = r sin θ = ${P(rStr)}·sin ${th}° = ${P(im)}. So ${P(ans)}.`.replace('1·cos', 'cos').replace('1·sin', 'sin')); } },
  });

  /* IV.8.13 Multiply & divide in polar */
  const ang5 = R => 5 * R.int(1, 71);
  S('IV.8.13', 'Multiply & divide in polar', {
    a: { t: 'multiply moduli', g: R => {
      if (R.bool()) { const r1 = R.int(2, 9), r2 = R.int(2, 9), a = ang5(R), b = ang5(R);
        return E.num(`z = ${pol(String(r1), a)} and w = ${pol(String(r2), b)}. What is |zw|?`, [{ label: '|zw| =', ans: r1 * r2 }], `Moduli multiply: |zw| = ${r1} · ${r2} = ${r1 * r2}. (The angles add, but that doesn't change the modulus.)`); }
      const t1 = R.pick(TRI), t2 = R.pick(TRI), z = cs(t1[0] * R.pick([1, -1]), t1[1] * R.pick([1, -1])), w = cs(t2[1] * R.pick([1, -1]), t2[0] * R.pick([1, -1]));
      return E.num(`Find ${M(`|(${z})(${w})|`)} without multiplying out.`, [{ ans: t1[2] * t2[2] }], `|zw| = |z|·|w| = ${t1[2]} · ${t2[2]} = ${t1[2] * t2[2]}.`); } },
    b: { t: 'add arguments', g: R => { const r1 = R.int(1, 6), r2 = R.int(2, 6), a = ang5(R), b = ang5(R), s = a + b;
      return E.num(`z = ${pol(String(r1), a)} and w = ${pol(String(r2), b)}. Write zw in polar form, with 0° ≤ θ < 360°.`, [{ label: 'r =', ans: r1 * r2 }, { label: 'θ =', ans: md(s) }],
        `Multiply the moduli: ${r1} · ${r2} = ${r1 * r2}. Add the angles: ${a}° + ${b}° = ${s}°${s >= 360 ? `, which is ${md(s)}° after a full turn` : ''}. Don't multiply the angles.`); } },
    c: { t: 'division rule', g: R => { const r2 = R.pick([2, 4, 5]), r1 = R.int(1, 20), a = ang5(R), b = ang5(R), d = a - b;
      return E.num(`z = ${pol(String(r1), a)} and w = ${pol(String(r2), b)}. Write z/w in polar form, with 0° ≤ θ < 360°.`, [{ label: 'r =', ans: r1 / r2 }, { label: 'θ =', ans: md(d) }],
        `Divide the moduli: ${r1} ÷ ${r2} = ${r1 / r2}. Subtract the angles: ${a}° − ${b}° = ${d}°${d < 0 ? `, which is ${md(d)}°` : ''}.`); } },
    d: { t: 'rotation meaning', g: R => {
      if (R.bool()) { const a = nz(R, -7, 7), b = nz(R, -7, 7), kind = R.int(0, 2), f = [[0, 1], [-1, 0], [0, -1]][kind], v = cmul([a, b], f), ans = cs(v[0], v[1]);
        const txt = ['90° counterclockwise', '180°', '90° clockwise'][kind];
        return E.num(`Rotate ${M(cs(a, b))} by ${txt} about 0. Which number do you get?`, [{ complex: ans, form: 'standard' }], `Rotating ${txt} is multiplying by ${['i', '−1', '−i'][kind]}: (${P(cs(a, b))})·${['i', '(−1)', '(−i)'][kind]} = ${P(ans)}.`); }
      const th = R.pick([30, 45, 60, 90, 120, 150]), r = R.pick([1, 2, 3]);
      const keep = r === 1 ? 'keeps its distance from 0' : `multiplies its distance from 0 by ${r}`;
      const right = `It rotates the point ${th}° counterclockwise about 0 and ${keep}.`;
      const wr = [`It rotates the point ${th}° clockwise about 0 and ${keep}.`, `It rotates the point ${th}° counterclockwise about 0 and adds ${r} to its distance from 0.`, `It rotates the point ${r === 1 ? 2 * th : r * th}° counterclockwise about 0 and ${r === 1 ? 'doubles its distance from 0' : 'keeps its distance from 0'}.`];
      return E.choice(R, `What does multiplying a complex number by ${pol(String(r), th)} do to its point?`, right, wr, `Multiplying multiplies moduli (×${r}) and adds arguments (+${th}°), so it is a turn of ${th}° counterclockwise${r === 1 ? ' with no stretch' : ' and a stretch by ' + r}.`); } },
    e: { t: 'find the missing factor', g: R => { const r1 = R.int(1, 6), rw = R.int(2, 6), a = ang5(R), bw = ang5(R), div = R.bool();
      if (!div) { const T = md(a + bw);
        return E.num(`z = ${cis(r1, a)} and zw = ${cis(r1 * rw, T)}. Find w in polar form, with 0° ≤ θ < 360°.`, [{ label: 'r =', ans: rw }, { label: 'θ =', ans: bw }],
          `w = zw ÷ z: divide the moduli, ${r1 * rw} ÷ ${r1} = ${rw}, and subtract the angles, ${T}° − ${a}° = ${T - a}°${T - a < 0 ? `, which is ${bw}°` : ''}.`); }
      const T = md(a - bw), r0 = r1 * rw;
      return E.num(`z = ${cis(r0, a)} and z/w = ${cis(r1, T)}. Find w in polar form, with 0° ≤ θ < 360°.`, [{ label: 'r =', ans: rw }, { label: 'θ =', ans: bw }],
        `w = z ÷ (z/w): moduli ${r0} ÷ ${r1} = ${rw}, angles ${a}° − ${T}° = ${a - T}°${a - T < 0 ? `, which is ${bw}°` : ''}.`); } },
    f: { t: 'a long product of turns', g: R => {
      if (R.bool()) { const a = 5 * R.int(1, 17), n = R.int(4, 12), S = a * n * (n + 1) / 2;
        return E.num(`Find the argument of ${pol('1', a)}·${pol('1', 2 * a)}·…·${pol('1', n * a)}, with 0° ≤ θ < 360°.`, [{ label: 'θ =', ans: md(S) }],
          `Multiplying adds the angles: ${a}°(1 + 2 + … + ${n}) = ${a}° · ${n * (n + 1) / 2} = ${S}°, which is ${md(S)}° after removing full turns.`); }
      let a, n; do { a = R.pick([10, 12, 15, 20, 24, 30, 36, 40, 45, 50, 60, 70, 72, 75, 80, 84, 90, 100, 105, 108, 120, 135, 150]); n = 1; while ((a * n * (n + 1) / 2) % 360) n++; } while (n < 3);
      const S = a * n * (n + 1) / 2;
      return E.num(`What is the smallest positive integer n for which ${pol('1', a)}·${pol('1', 2 * a)}·…·${pol('1', `n·${a}`)} = 1?`, [{ label: 'n =', ans: n }],
        `The angles add to ${a}°·n(n + 1)/2, and the product is 1 when that is a multiple of 360°. Trying n = 1, 2, 3, …, the first that works is n = ${n}: ${a}° · ${n * (n + 1) / 2} = ${S}° = ${S / 360} · 360°.`); } },
  });

  /* IV.8.14 De Moivre's theorem */
  const ZF = [[45, 1], [135, 1], [225, 1], [315, 1], [30, 1], [150, 1], [210, 1], [330, 1], [60, 1], [120, 1], [240, 1], [300, 1]];
  const deM = R => { const [th, k] = R.pick(ZF), f = fam(th, k), n = th % 90 === 45 ? R.int(2, 8) : R.int(2, 6), Rv = f.rv ** n, ph = md(n * th);
    return { th, f, n, Rv, Rs: ex(Rv), ph, re: ex(Rv * Math.cos(rad(ph))), im: ex(Rv * Math.sin(rad(ph))) }; };
  S('IV.8.14', "De Moivre's theorem", {
    a: { t: 'powers in polar form', g: R => { const r = R.pick([1, 2, 2, 3]), n = r === 3 ? R.int(2, 5) : R.int(2, 6), th = 5 * R.int(1, 35), Rv = r ** n, ph = md(n * th);
      return E.num(`Use De Moivre's theorem: ${r === 1 ? pol('1', th) : '[' + pol(String(r), th) + ']'}${SUP(n)} = R(cos φ + i sin φ). Find R and φ, with 0° ≤ φ < 360°.`, [{ label: 'R =', ans: Rv }, { label: 'φ =', ans: ph }],
        `Raise the modulus to the power and multiply the angle: R = ${r}${SUP(n)} = ${Rv}, φ = ${n} · ${th}° = ${n * th}°${n * th >= 360 ? `, which is ${ph}°` : ''}.`); } },
    b: { t: 'compute zⁿ', g: R => { const d = deM(R), mf = /sqrt/.test(d.Rs) ? { exact: d.Rs, form: 'simplest' } : { ans: +d.Rs };
      return E.num(`Let ${M('z=' + d.f.z)}. Find the modulus and argument of ${M('z^' + d.n)}, with the argument from 0° up to 360°.`, [{ label: 'modulus =', ...mf }, { label: 'argument =', ans: d.ph }],
        `z = ${pol(d.f.rStr, d.th)}, so z${SUP(d.n)} has modulus ${/sqrt/.test(d.f.rStr) ? '(' + P(d.f.rStr) + ')' : P(d.f.rStr)}${SUP(d.n)} = ${P(d.Rs)} and argument ${d.n} · ${d.th}° = ${d.n * d.th}°${d.n * d.th >= 360 ? ` → ${d.ph}°` : ''}.`); } },
    c: { t: 'back to rectangular', g: R => { const d = deM(R), ans = cxs(d.re, d.im);
      return E.num(`Let ${M('z=' + d.f.z)}. Use polar form to find ${M('z^' + d.n)} in the form a + bi.`, [{ complex: ans, form: 'standard' }],
        `z = ${pol(d.f.rStr, d.th)}, so z${SUP(d.n)} = ${pol(d.Rs, d.ph)} = ${P(ans)}.`); } },
    d: { t: 'use De Moivre to find cos 2θ, sin 2θ, cos 3θ or sin 3θ', g: R => { const k = R.int(0, 2), tr = [[3, 4, 5], [4, 3, 5], [5, 12, 13], [12, 5, 13], [8, 15, 17], [15, 8, 17], [7, 24, 25], [24, 7, 25]];
      if (k === 0) { const [a, b, c] = R.pick(tr), cosAsk = R.bool(), sa = R.pick([1, 1, -1]);
        const n = cosAsk ? a * a - b * b : 2 * sa * a * b, dd = c * c, g = E.gcd(Math.abs(n), dd);
        return E.num(`Matching parts of (cos θ + i sin θ)² = cos 2θ + i sin 2θ gives ${cosAsk ? 'cos 2θ = cos²θ − sin²θ' : 'sin 2θ = 2 sin θ cos θ'}. If cos θ = ${sa < 0 ? '−' : ''}${a}/${c} and sin θ = ${b}/${c}, find ${cosAsk ? 'cos 2θ' : 'sin 2θ'}.`, [{ frac: [n / g, dd / g], form: 'any' }],
          cosAsk ? `cos 2θ = ${a * a}/${dd} − ${b * b}/${dd} = ${E.fracStr(n, dd)}.` : `sin 2θ = 2 · (${sa < 0 ? '−' : ''}${a}/${c}) · ${b}/${c} = ${E.fracStr(n, dd)}.`); }
      if (k === 1) { const [a, b, c] = R.pick(tr.slice(0, 4)), cosAsk = R.bool(), n = cosAsk ? a ** 3 - 3 * a * b * b : 3 * a * a * b - b ** 3, dd = c ** 3, g = E.gcd(Math.abs(n), dd);
        return E.num(`Matching parts of (cos θ + i sin θ)³ = cos 3θ + i sin 3θ gives ${cosAsk ? 'cos 3θ = cos³θ − 3 cos θ sin²θ' : 'sin 3θ = 3 cos²θ sin θ − sin³θ'}. If cos θ = ${a}/${c} and sin θ = ${b}/${c}, find ${cosAsk ? 'cos 3θ' : 'sin 3θ'}.`, [{ frac: [n / g, dd / g], form: 'any' }],
          cosAsk ? `cos 3θ = ${a ** 3}/${dd} − 3 · ${a}/${c} · ${b * b}/${c * c} = ${a ** 3}/${dd} − ${3 * a * b * b}/${dd} = ${E.fracStr(n, dd)}.` : `sin 3θ = 3 · ${a * a}/${c * c} · ${b}/${c} − ${b ** 3}/${dd} = ${3 * a * a * b}/${dd} − ${b ** 3}/${dd} = ${E.fracStr(n, dd)}.`); }
      let th, n; do { th = R.pick([15, 30, 45, 60, 75, 105, 120, 135, 150, 165]); n = R.int(2, 3); } while ((n * th) % 30 && (n * th) % 45);
      const cosAsk = R.bool(), ph = md(n * th), v = ex(cosAsk ? Math.cos(rad(ph)) : Math.sin(rad(ph))), fn = cosAsk ? 'cos' : 'sin';
      const fld = /sqrt/.test(v) ? { exact: v, form: 'simplest' } : /\//.test(v) ? { frac: v.replace(/^-/, '').split('/').map((z, i) => (i === 0 && v[0] === '-' ? -1 : 1) * +z), form: 'any' } : { ans: +v };
      return E.num(`Let θ = ${th}°. By De Moivre, (cos θ + i sin θ)${SUP(n)} = cos ${n}θ + i sin ${n}θ. Find ${fn} ${n}θ exactly.`, [fld],
        `(cos ${th}° + i sin ${th}°)${SUP(n)} = cos ${n * th}° + i sin ${n * th}°${n * th >= 360 ? ` = cos ${ph}° + i sin ${ph}°` : ''}. So ${fn} ${n}θ = ${fn} ${ph}° = ${P(v)}.`); } },
    e: { t: 'when is zⁿ real?', g: R => { let th, k, f, cond, n;
      do { [th] = R.pick(ZF); k = R.pick([1, 1, 2]); f = fam(th, k); cond = R.int(0, 3); n = 0; for (let m = 1; m <= 24 && !n; m++) { const p = md(m * th); if ([p % 180 === 0, p === 0, p === 180, p % 180 === 90][cond]) n = m; } } while (!n);
      const txt = ['a real number', 'a positive real number', 'a negative real number', 'pure imaginary'][cond], need = ['a multiple of 180°', 'a multiple of 360°', '180° plus a multiple of 360°', '90° plus a multiple of 180°'][cond];
      return E.num(`What is the smallest positive integer n for which ${M(`(${f.z})^n`)} is ${txt}?`, [{ label: 'n =', ans: n }],
        `z = ${pol(f.rStr, th)}, so zⁿ has argument n · ${th}°. That must be ${need}. The first n that works is ${n}: ${n} · ${th}° = ${n * th}°.`); } },
    f: { t: 'z + 1/z and its powers', g: R => {
      if (R.bool(0.6)) { const [cS, th] = R.pick([['1', 60], ['-1', 120], ['0', 90], ['sqrt(2)', 45], ['sqrt(3)', 30], ['-sqrt(2)', 135], ['-sqrt(3)', 150]]), N = R.int(5, 200), ph = md(N * th), v = ex(2 * Math.cos(rad(ph)));
        return E.num(`A complex number z satisfies ${M(`z+1/z=${cS}`)}. Find ${M(`z^${N}+1/z^${N}`)}. Give an exact answer.`, [/sqrt/.test(v) ? { exact: v, form: 'simplest' } : { ans: +v }],
          `z + 1/z = 2 cos θ with z = cos θ ± i sin θ, so θ = ${th}°. By De Moivre, zⁿ + 1/zⁿ = 2 cos nθ = 2 cos ${N * th}° = 2 cos ${ph}° = ${P(v)}.`); }
      const b3 = R.bool(), n = b3 ? R.int(3, 11) : R.int(3, 20), r = b3 ? 2 : Math.SQRT2, th = b3 ? 60 : 45, v = Math.round(2 * r ** n * Math.cos(rad(n * th))), z = b3 ? '1+isqrt(3)' : '1+i', zb = b3 ? '1-isqrt(3)' : '1-i';
      return E.num(`Find ${M(`(${z})^${n}+(${zb})^${n}`)}.`, [{ ans: v }],
        `The two are conjugates, so the sum is twice the real part of (${P(z)})${SUP(n)}. With r = ${b3 ? '2' : '√2'} and θ = ${th}°: 2 · r${SUP(n)} cos ${n * th}° = ${v}.`); } },
  });

  /* IV.8.15 Roots of complex numbers */
  const ORD = { 2: 'square', 3: 'cube', 4: 'fourth', 5: 'fifth', 6: 'sixth', 7: 'seventh', 8: 'eighth' };
  const POLY = { 3: 'triangle', 4: 'square', 6: 'hexagon', 8: 'octagon' };
  S('IV.8.15', 'Roots of complex numbers', {
    a: { t: 'n roots exist', g: R => { const n = R.int(2, 8); let a, b; do { a = R.int(-9, 9); b = R.int(-9, 9); } while (a === 0 && b === 0); const w = cs(a, b);
      if (R.bool()) return E.num(`How many different solutions does ${M(`z^${n}=${w}`)} have in the complex numbers?`, [{ ans: n }], `A nonzero number has exactly ${n} different ${ORD[n]} roots, spread evenly around a circle: ${n} solutions, not just one.`);
      return E.num(`How many different complex ${ORD[n]} roots does ${M(w)} have?`, [{ ans: n }], `Every nonzero complex number has exactly ${n} ${ORD[n]} roots, ${360 / n % 1 ? '' : 360 / n + '° apart '}around a circle centered at 0.`); } },
    b: { t: 'formula with 2πk/n', g: R => { const n = R.pick([3, 4, 5, 6]), m = n === 6 ? R.int(1, 2) : R.int(1, 3), Rv = m ** n, t = 5 * R.int(0, Math.floor(359 / n / 5)), th = n * t, k = R.int(1, n - 1), arg = t + 360 * k / n;
      return E.num(`The solutions of ${M(`z^${n}`)} = ${pol(String(Rv), th)} are z${SUB(0)}, …, z${SUB(n - 1)}, where zₖ has argument (${th}° + 360°k)/${n}. Find the modulus and argument of z${SUB(k)}.`, [{ label: 'modulus =', ans: m }, { label: 'argument =', ans: arg }],
        `Every root has modulus ${{ 3: '∛', 4: '∜' }[n] || SUP(n) + '√'}${Rv} = ${m}. For k = ${k}: (${th}° + ${360 * k}°)/${n} = ${arg}°. (In radians the step is 2πk/${n}.)`); } },
    c: { t: 'roots of unity', g: R => {
      if (R.bool(0.3)) { const n = R.int(3, 12); return E.num(`The ${nth(n)} roots of unity (solutions of ${M(`z^${n}=1`)}) are equally spaced on the unit circle. What is the angle between neighbors, in degrees?`, [{ ans: 360 / n, dp: 360 % n && (360 / n * 1000) % 1 ? 2 : undefined }].map(f => { if (f.dp === undefined) delete f.dp; return f; }), `Going around once is 360°, split into ${n} equal steps: 360° ÷ ${n} = ${+(360 / n).toFixed(2)}°.`); }
      const [n, ths] = R.pick([[2, [0, 90, 180, 270]], [3, [0, 90, 180, 270]], [3, [0, 180]], [4, [0, 180]], [6, [0, 180]], [8, [0]]]), th = R.pick(ths);
      const m = R.bool(0.5) ? 1 : n === 8 ? 1 : n >= 4 ? 2 : R.int(2, 3), Rv = m ** n, w = cxs(ex(Rv * Math.cos(rad(th))), ex(Rv * Math.sin(rad(th))));
      const args = Array.from({ length: n }, (_, k) => th / n + 360 * k / n), roots = args.map(a => cxs(ex(m * Math.cos(rad(a))), ex(m * Math.sin(rad(a)))));
      return E.num(`Solve ${M(`z^${n}=${w}`)}. Give all ${n} solutions exactly.`, [{ label: 'z =', set: roots }],
        `${M(w)} = ${pol(String(Rv), th)}. Each root has modulus ${m}, and the arguments are ${th / n}° + ${360 / n}°k: ${args.map(a => a + '°').join(', ')}. So z = ${roots.map(P).join(', ')}.`); } },
    d: { t: 'roots as a regular polygon', g: R => {
      if (R.bool()) { const n = R.pick([3, 4, 6, 8]), step = n === 8 ? 45 : n === 4 ? R.pick([30, 45]) : 30, a0 = step * R.int(0, 360 / step - 1), r = R.int(1, 4), a1 = md(a0 + 360 / n);
        const start = cxs(ex(r * Math.cos(rad(a0))), ex(r * Math.sin(rad(a0)))), ans = cxs(ex(r * Math.cos(rad(a1))), ex(r * Math.sin(rad(a1))));
        return E.num(`A ${n === 4 ? '' : 'regular '}${POLY[n]} centered at 0 has a vertex at ${M(start)}. What is the next vertex counterclockwise? Give it exactly in the form a + bi.`, [{ complex: ans, form: 'standard' }],
          `The vertex is ${pol(String(r), a0)}. Turning 360° ÷ ${n} = ${360 / n}° gives ${pol(String(r), a1)} = ${P(ans)}.`); }
      const n = R.int(3, 8), r = R.int(1, 3), a0 = 15 * R.int(0, 23), pts = Array.from({ length: n }, (_, k) => [r * Math.cos(rad(a0 + 360 * k / n)), r * Math.sin(rad(a0 + 360 * k / n))]);
      const vis = argand({ L: r + 1, ticks: 1, pts: pts.map(p => [p[0], p[1], '']), segs: pts.map((p, k) => [p[0], p[1], pts[(k + 1) % n][0], pts[(k + 1) % n][1], C.muted]), label: 'roots on a circle' });
      return E.num(`The dots are all the solutions of ${M('z^n=w')}. They lie on a circle of radius ${r} centered at 0. Find n and |w|.`, [{ label: 'n =', ans: n }, { label: '|w| =', ans: r ** n }],
        `There are ${n} dots, so n = ${n}. Each root has modulus ${r}, so |w| = ${r}${SUP(n)} = ${r ** n}.`, { visual: vis }); } },
    e: { t: 'from one root, find them all', g: R => { const th = R.pick(ANG), k = R.pick([1, 1, 2]), f = fam(th, k), n = th % 90 === 45 ? R.pick([2, 4]) : R.pick([3, 4, 6]);
      const args = Array.from({ length: n }, (_, j) => md(th + 360 * j / n)), roots = args.map(a => cxs(ex(f.rv * Math.cos(rad(a))), ex(f.rv * Math.sin(rad(a)))));
      return E.num(`One solution of ${M(`z^${n}=w`)} is ${M('z=' + f.z)}. Find all ${n} solutions. Give exact answers.`, [{ label: 'z =', set: roots }],
        `All ${n} solutions have modulus ${P(f.rStr)} and are ${360 / n}° apart. ${P(f.z)} = ${pol(f.rStr, th)}, so the angles are ${args.map(a => a + '°').join(', ')}, giving ${roots.map(P).join(', ')}.`); } },
    f: { t: 'the roots all together', g: R => { const kind = R.int(0, 2);
      if (kind < 2) { const n = R.int(2, 6); let a, b; do { a = R.int(-9, 9); b = R.int(-9, 9); } while (a === 0 && b === 0); const w = cs(a, b);
        if (kind === 0) { const s = n % 2 ? 1 : -1, ans = cs(s * a, s * b);
          return E.num(`What is the product of all ${n} solutions of ${M(`z^${n}=${w}`)}?`, [{ complex: ans, form: 'standard' }],
            `They are the roots of ${M(`z^${n}` + minusT(w) + '=0')}. By Vieta, the product of the roots is (−1)${SUP(n)} times the constant term −(${P(w)}), which is ${P(ans)}.`); }
        const ans = n === 2 ? cs(2 * a, 2 * b) : '0';
        return E.num(`Let z${SUB(1)}, …, z${SUB(n)} be the ${n} solutions of ${M(`z^${n}=${w}`)}. Find z${SUB(1)}² + ${n > 2 ? '… + ' : ''}z${SUB(n)}².`, [{ complex: ans, form: 'standard' }],
          n === 2 ? `The two roots are ±√w, and each squares to w. So the sum is 2w = ${P(ans)}.` : `The equation has no zⁿ⁻¹ or zⁿ⁻² term, so the sum and the pairwise products of the roots are both 0. The sum of squares is (sum)² − 2(pairwise sum) = 0.`); }
      const n = R.pick([3, 4, 6, 8]), r = n === 8 ? 1 : n === 6 ? R.int(1, 2) : R.int(1, 3), u = R.int(0, 3), w = cs(...[[1, 0], [0, 1], [-1, 0], [0, -1]][u].map(x => x * r ** n));
      const area = n === 3 ? E.surdStr(0, 3 * r * r, 3, 4) : n === 4 ? String(2 * r * r) : n === 6 ? E.surdStr(0, 3 * r * r, 3, 2) : E.surdStr(0, 2 * r * r, 2, 1);
      return E.num(`The solutions of ${M(`z^${n}=${w}`)} are the corners of a polygon. What is its area? Give an exact answer.`, [{ label: 'area =', ...(/sqrt|\//.test(area) ? { exact: area, form: 'simplest' } : { ans: +area }) }],
        `Every solution has modulus ${{ 3: '∛', 4: '∜' }[n] || SUP(n) + '√'}${r ** n} = ${r}, so they form a regular ${POLY[n]} on the circle of radius ${r}. It is ${n} triangles with two sides ${r} and angle ${360 / n}°: area = ${n} · ½ · ${r}² · sin ${360 / n}° = ${P(area)}.`); } },
  });

  /* IV.8.16 Complex loci */
  const argSvg = (px, py, th, o = {}) => { const c = Math.cos(rad(th)), s = Math.sin(rad(th)), segs = [[px, py, px + 20 * c, py + 20 * s]]; if (o.full) segs.push([px, py, px - 20 * c, py - 20 * s]);
    return argand({ L: 6, w: 170, labels: false, segs, pts: [[px, py, '', true]], label: 'a half-line' }); };
  const halfSvg = (axis, side, k) => { const L = 6, sh = axis === 'Re' ? { f: () => L, g: () => -L, from: side > 0 ? k : -L, to: side > 0 ? L : k } : { f: () => side > 0 ? L : k, g: () => side > 0 ? k : -L, from: -L, to: L };
    return argand({ L, w: 170, labels: false, shade: sh, vlines: axis === 'Re' ? [{ x: k, dash: false, color: C.blue }] : [], hlines: axis === 'Im' ? [{ y: k, dash: false, color: C.blue }] : [], label: 'a shaded region' }); };
  const diskSvg = (p, q, r, fill) => argand({ L: 6, w: 170, labels: false, circles: [{ c: [p, q], r }], shade: fill ? { f: x => q + Math.sqrt(Math.max(0, r * r - (x - p) ** 2)), g: x => q - Math.sqrt(Math.max(0, r * r - (x - p) ** 2)), from: p - r, to: p + r } : undefined, label: 'a circle region' });
  S('IV.8.16', 'Complex loci', {
    a: { t: '|z − a| = r is a circle', g: R => { let a, b; do { a = R.int(-6, 6); b = R.int(-6, 6); } while (a === 0 && b === 0); const r = R.int(1, 9), paren = R.bool(0.3) && a && b;
      const shown = paren ? `|z-(${cs(a, b)})|=${r}` : `|${zminus(a, b)}|=${r}`;
      return E.num(`The locus ${M(shown)} is a circle. What are its center and radius?`, [{ label: 'center =', complex: cs(a, b) }, { label: 'radius =', ans: r }],
        `|z − c| is the distance from z to c. ${paren || /^z-[0-9.]+$/.test(zminus(a, b)) ? '' : `Rewrite it as |z − (${P(cs(a, b))})| = ${r}. `}So the center is ${P(cs(a, b))} and the radius is ${r}.`); } },
    b: { t: '|z − a| = |z − b| is a bisector', g: R => { let a1, a2, b1, b2; const kind = R.int(0, 2);
      if (kind === 0) { a2 = b2 = R.int(-5, 5); a1 = R.int(-6, 4); b1 = a1 + 2 * R.int(1, 4); if (R.bool()) [a1, b1] = [b1, a1]; }
      else if (kind === 1) { a1 = b1 = R.int(-5, 5); a2 = R.int(-6, 4); b2 = a2 + 2 * R.int(1, 4); if (R.bool()) [a2, b2] = [b2, a2]; }
      else { do { a1 = R.int(-5, 5); a2 = R.int(-5, 5); b1 = R.int(-5, 5); b2 = R.int(-5, 5); } while (a1 === b1 || a2 === b2); }
      let A = 2 * (b1 - a1), B = 2 * (b2 - a2), K = b1 * b1 + b2 * b2 - a1 * a1 - a2 * a2; const g = E.gcd(E.gcd(Math.abs(A), Math.abs(B)), Math.abs(K)) || 1; A /= g; B /= g; K /= g; if (A < 0 || (A === 0 && B < 0)) { A = -A; B = -B; K = -K; }
      const lhs = (A ? `${co(A)}x` : '') + (B ? `${A && B > 0 ? '+' : ''}${co(B)}y` : ''), eq = `${lhs}=${K}`;
      return E.num(`Let ${M('z=x+yi')}. The locus ${M(`|${zminus(a1, a2)}|=|${zminus(b1, b2)}|`)} is a straight line. Write its equation in x and y.`, [{ eqn: eq }],
        `Points equally far from ${P(cs(a1, a2))} and ${P(cs(b1, b2))} form the perpendicular bisector of the segment joining them. Squaring and expanding both sides gives ${P(eq)}.`); } },
    c: { t: 'arg(z − a) = θ is a half-line', g: R => { let p, q; do { p = R.int(-3, 3); q = R.int(-3, 3); } while (p === 0 && q === 0); const th = R.pick([-135, -90, -45, 0, 45, 90, 135, 180]);
      const right = argSvg(p, q, th), wrong = [argSvg(-p, -q, th), argSvg(p, q, th + 180), argSvg(p, q, th, { full: true })];
      return E.choice(R, `Which picture shows the locus arg(${M(zminus(p, q))}) = ${th}°?`, right, wrong,
        `arg(z − a) = θ means the direction from a = ${P(cs(p, q))} to z is ${th}°. That is a half-line starting at ${P(cs(p, q))} (the start point itself is left out) and pointing at ${th}°.`); } },
    d: { t: 'shade regions', g: R => {
      if (R.bool()) { let p, q; do { p = R.int(-2, 2); q = R.int(-2, 2); } while (p === 0 && q === 0); const r = R.int(1, 3);
        return E.choice(R, `Which picture shows the region ${M(`|${zminus(p, q)}|<=${r}`)}?`, diskSvg(p, q, r, true), [diskSvg(-p, -q, r, true), diskSvg(p, q, r + 1, true), diskSvg(p, q, r, false)],
          `This is |z − (${P(cs(p, q))})| ≤ ${r}: every point within ${r} of ${P(cs(p, q))}. That is the circle and the whole disk inside it.`); }
      const axis = R.pick(['Re', 'Im']), side = R.pick([1, -1]), k = nz(R, -3, 3), other = axis === 'Re' ? 'Im' : 'Re';
      return E.choice(R, `Which picture shows the region ${axis}(z) ${side > 0 ? '≥' : '≤'} ${k}?`, halfSvg(axis, side, k), [halfSvg(axis, -side, k), halfSvg(other, side, k), halfSvg(axis, side, -k)],
        `${axis}(z) is the ${axis === 'Re' ? 'real part (across)' : 'imaginary part (up)'}, so shade ${axis === 'Re' ? (side > 0 ? 'to the right of' : 'to the left of') : (side > 0 ? 'above' : 'below')} the ${axis === 'Re' ? 'vertical' : 'horizontal'} line ${axis === 'Re' ? 'x' : 'y'} = ${k}, including the line.`); } },
    e: { t: 'take out the factor first', g: R => { const k = R.pick([2, 3, 4, -2, 'i', '-i']), cx = R.int(-4, 4), cy = R.int(-4, 4), r = R.int(1, 9);
      const c = k === 'i' ? cmul([0, 1], [cx, cy]) : k === '-i' ? cmul([0, -1], [cx, cy]) : [k * cx, k * cy], s = cs(-c[0], -c[1]), kz = (k === 'i' ? 'i' : k === '-i' ? '-i' : co(k)) + 'z';
      const kL = P(kz.slice(0, -1)), shown = `|${kz}${s === '0' ? '' : (s[0] === '-' ? s : '+' + s)}|=${r}`, K = typeof k === 'number' ? Math.abs(k) : 1, rad_ = r % K ? { frac: [r / E.gcd(r, K), K / E.gcd(r, K)], form: 'any' } : { ans: r / K };
      return E.num(`The locus ${M(shown)} is a circle. What are its center and radius?`, [{ label: 'center =', complex: cs(cx, cy) }, { label: 'radius =', ...rad_ }],
        `Take out the factor: |${kL}z${s === '0' ? '' : s[0] === '-' ? ' − ' + P(s.slice(1)) : ' + ' + P(s)}| = |${kL}|·|z − (${P(cs(cx, cy))})|, and |${kL}| = ${K}. So |z − (${P(cs(cx, cy))})| = ${K === 1 ? r : E.pt(E.fracStr(r, K))}: center ${P(cs(cx, cy))}, radius ${K === 1 ? r : E.pt(E.fracStr(r, K))}.`); } },
    f: { t: 'a circle in disguise (Apollonius)', g: R => { const k = R.pick([2, 2, 3]), v = k === 2 ? R.pick([[1, 0], [-1, 0], [0, 1], [0, -1], [2, 0], [0, -2]]) : R.pick([[1, 0], [-1, 0], [0, 1], [0, -1]]);
      const b = [R.int(-3, 3), R.int(-3, 3)], a = [b[0] + (k * k - 1) * v[0], b[1] + (k * k - 1) * v[1]], ctr = cs(b[0] - v[0], b[1] - v[1]), rr = k * Math.hypot(...v);
      const Pi = cs(b[0] + (k - 1) * v[0], b[1] + (k - 1) * v[1]), Qe = cs(b[0] - (k + 1) * v[0], b[1] - (k + 1) * v[1]);
      return E.num(`The locus ${M(`|${zminus(...a)}|=${k}|${zminus(...b)}|`)} is a circle. What are its center and radius?`, [{ label: 'center =', complex: ctr }, { label: 'radius =', ans: rr }],
        `On the line through ${P(cs(...a))} and ${P(cs(...b))}, the points ${k} times as far from ${P(cs(...a))} as from ${P(cs(...b))} are ${P(Pi)} (between them) and ${P(Qe)} (outside). They are the ends of a diameter: center ${P(ctr)}, radius ${rr}.`); } },
  });
})(typeof window !== 'undefined' ? window : globalThis);
