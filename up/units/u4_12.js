/* Era IV · Unit IV.12 Exponential & logarithmic (IV.12.01–IV.12.17) */
(function (G) {
  const E = G.E4, V = E.V, C = E.C, M = s => E.mx(s);
  const S = (id, name, steps) => E.skill({ id, name, steps });
  const nz = (R, lo, hi) => { let v; do v = R.int(lo, hi); while (v === 0); return v; };
  const cl = x => +(+x).toFixed(9);                                   // strip float noise
  const fx = (x, dp) => E.fmt(x, { dp });                              // fixed decimals, commas
  const cur = O => (O && O.coins === 'THB') ? '฿' : '$';
  const money = (O, x) => cur(O) + E.fmt(x, { dp: 2 });
  const sgk = k => k ? (k > 0 ? '+' + k : String(k)) : '';            // '+3' / '-3' / ''
  const pw = (b, e) => `${/[-/.]/.test(String(b)) ? '(' + b + ')' : b}^${/^(\d+|[a-z])$/.test(String(e)) ? e : '(' + e + ')'}`;
  const lg = (b, a) => (b === 10 ? 'log' : b === 'e' ? 'ln' : 'log_' + b) + '(' + a + ')';
  const pv = (b, k) => k >= 0 ? String(b ** k) : `1/${b ** -k}`;       // b^k as an exact string
  const bx = (b, v = 'x') => /^\d+$/.test(String(b)) ? `${b}^${v}` : `(${b})^${v}`;
  // a·b^(e) + k as ASCII, e.g. ex(3, 2) → '3(2)^x', ex(1, 2, 'x-1', 4) → '2^(x-1)+4'
  const ex = (a, b, e = 'x', k = 0) => { const ee = /^[a-z]$/.test(e) ? e : `(${e})`; const intB = /^\d+$/.test(String(b));
    const base = (a === 1 || a === -1) && intB ? `${b}^${ee}` : `(${b})^${ee}`; return (a === 1 ? '' : a === -1 ? '-' : String(a)) + base + sgk(k); };
  const table = (xs, ys, xl = 'x', yl = 'y') => `<table class="dt"><tr><th>${xl}</th>${xs.map(x => `<td>${E.fmt(x)}</td>`).join('')}</tr><tr><th>${yl}</th>${ys.map(y => `<td>${E.fmt(y)}</td>`).join('')}</tr></table>`;
  const frac = (n, d) => { if (d < 0) { n = -n; d = -d; } const g = E.gcd(Math.abs(n), d) || 1; return { frac: [n / g, d / g], form: 'any' }; };
  const sh = (h, k) => [h ? `${Math.abs(h)} ${h > 0 ? 'right' : 'left'}` : '', k ? `${Math.abs(k)} ${k > 0 ? 'up' : 'down'}` : ''].filter(Boolean).join(' and ');
  const aan = v => (/^8/.test(String(v)) || /^1[18](\.|$)/.test(String(v))) ? 'an' : 'a';   // 'an 8%', 'an 18.75%', 'a 12%'
  const expPic = (fs, o = {}) => V.graph({ x: o.x || [-4, 4], y: o.y || [-1, 9], w: o.w || 240, h: o.h || 220, fns: fs.map(f => ({ f, color: o.color || C.blue })), hlines: o.hlines || [], vlines: o.vlines || [], points: o.points || [], label: o.label || 'exponential graph' });
  // MathML for a log whose base is a letter or an expression (the core parser only knows number bases): LB('x', '4x-3', '=2')
  const LBX = (base, arg, rest = '') => { const inner = M(base).replace(/^<math[^>]*>|<\/math>$/g, ''); return M(`log_97531(${arg})${rest}`).replace('<mn>97531</mn>', inner); };
  const MV = s => { const vs = []; let h = M(s.replace(/log_([a-z])\(/g, (m, v) => { vs.push(v); return `log_${97530 + vs.length}(`; })); vs.forEach((v, i) => { h = h.replace(`<mn>${97531 + i}</mn>`, `<mi>${v}</mi>`); }); return h; };
  const iroot = (n, q) => { const r = Math.round(n ** (1 / q)); return r ** q === n ? r : null; };
  const ratPow = (n, d, p, q) => { const a = iroot(n, q), b = iroot(d, q); if (a === null || b === null) return null; const [N, D] = p >= 0 ? [a ** p, b ** p] : [b ** -p, a ** -p]; return [N, D]; };   // (n/d)^(p/q) → [N, D] or null
  const fs = (n, d = 1) => E.fracStr(n, d);
  const minus = (p, q) => `${p} − ${q < 0 ? '(' + E.fmt(q) + ')' : E.fmt(q)}`;
  const lin = (terms, c0 = 0) => { let s = ''; for (const [c, v] of terms) { if (!c) continue; s += (c < 0 ? '-' : s ? '+' : '') + (Math.abs(c) === 1 ? '' : Math.abs(c)) + v; } if (c0) s += (c0 < 0 ? '-' : s ? '+' : '') + Math.abs(c0); return s || '0'; };   // lin([[3,'p'],[-1,'q']], 2) → '3p-q+2'
  const pf23 = (i, j, k = 0) => { const up = [], dn = []; [[2, i], [3, j], [5, k]].forEach(([p, e]) => { if (e > 0) up.push(e === 1 ? `${p}` : `${p}^${e}`); if (e < 0) dn.push(e === -1 ? `${p}` : `${p}^${-e}`); });
    const U = up.join('*') || '1'; return dn.length ? `${up.length > 1 ? '(' + U + ')' : U}/${dn.length > 1 ? '(' + dn.join('*') + ')' : dn[0]}` : U; };
  const MD = s => M(s).replace(/<\/msup><msup>/g, '</msup><mo>⋅</mo><msup>');   // number factorizations like 2³·3²
  const facStr = (r, s) => (r === 0 ? 'x' + E.lin(s) : s === 0 ? 'x' + E.lin(r) : E.lin(r) + E.lin(s));

  /* IV.12.01 Exponential growth */
  S('IV.12.01', 'Exponential growth', {
    a: { t: 'repeated multiplying', g: R => { const ctx = R.pick([['A dish starts with', 'bacteria', 'hour'], ['A new account starts with', 'followers', 'week'], ['A sample starts with', 'cells', 'day'], ['A pond starts with', 'lily pads', 'month'], ['A chain letter starts with', 'copies', 'day']]);
      let a, b, n; do { a = R.pick([2, 3, 4, 5, 6, 8, 10, 12, 20, 25, 50, 100]); b = R.int(2, 5); n = R.int(2, 5); } while (a * b ** n > 200000);
      const vals = Array.from({ length: n + 1 }, (_, k) => E.fmt(a * b ** k));
      return E.num(`${ctx[0]} ${a} ${ctx[1]}. The number is multiplied by ${b} every ${ctx[2]}. How many ${ctx[1]} are there after ${n} ${ctx[2]}s?`, [{ ans: a * b ** n }],
        `Multiply by ${b} once per ${ctx[2]}: ${vals.join(' → ')}. That is ${M(`${a}*${b}^${n}`)} = ${E.fmt(a * b ** n)}, not ${a} + ${b * n}.`); } },
    b: { t: 'y = a·bˣ with b > 1', g: R => { const b = R.pick([2, 3, 4, 5, 1.5, 2, 3]); const a = b === 1.5 ? 16 * R.int(1, 5) : R.pick([1, 2, 3, 4, 5, 6, 10, 20, 100]); const x = R.int(0, 4);
      const y = cl(a * b ** x);
      return E.num(`For ${M('y=' + ex(a, b))}, find y when x = ${x}.`, [{ label: 'y =', ans: y }],
        `Raise ${b} to the power first: ${M(`${pw(b, x)}=${cl(b ** x)}`)}, then multiply by ${a}: y = ${E.fmt(y)}.${x > 1 ? ` Don't multiply ${a} · ${b} first.` : ''}`); } },
    c: { t: 'initial value and factor', g: R => { const b = R.pick([2, 3, 4, 1.5, 1.2, 1.05, 1.08, 1.25, 1.1]), a = R.pick([5, 12, 40, 50, 120, 250, 800, 1500, 3000]);
      const ctx = R.pick([['P', 't', 'years'], ['N', 't', 'hours'], ['y', 'x', 'steps'], ['V', 't', 'months']]);
      if (R.bool()) return E.num(`A quantity is modeled by ${M(`${ctx[0]}=${a}(${b})^${ctx[1]}`)}. What are its initial value and growth factor?`, [{ label: 'initial value =', ans: a }, { label: 'growth factor =', ans: b }],
        `In ${M('y=a*b^x')}, a is the value at the start and b is what you multiply by each step: a = ${a}, b = ${b}.`);
      return E.num(`A quantity starts at ${a} and is multiplied by ${b} every ${ctx[2].slice(0, -1)}. Write a model for ${ctx[0]} after ${ctx[1]} ${ctx[2]}.`, [{ label: ctx[0] + ' =', expr: `${a}(${b})^${ctx[1]}` }],
        `Start value times the factor once per ${ctx[2].slice(0, -1)}: ${M(`${ctx[0]}=${a}(${b})^${ctx[1]}`)}. Not ${M(`${a}+${b}${ctx[1]}`)}, which adds instead of multiplying.`); } },
    d: { t: 'from a table', g: R => { const b = R.pick([2, 3, 4, 1.5, 2, 3]); const a = b === 1.5 ? 16 * R.int(1, 6) : R.int(1, 12) * R.pick([1, 5]); const x0 = R.pick([0, 0, 1]);
      const xs = [x0, x0 + 1, x0 + 2, x0 + 3], ys = xs.map(x => cl(a * b ** x));
      return E.num(`This table fits ${M('y=a*b^x')}. Find a and b.${table(xs, ys)}`, [{ label: 'a =', ans: a }, { label: 'b =', ans: b }],
        `Each y is ${b} times the one before (${E.fmt(ys[1])} ÷ ${E.fmt(ys[0])} = ${b}), so b = ${b}. ${x0 === 0 ? `At x = 0, y = a = ${a}.` : `At x = 0 the value would be ${E.fmt(ys[0])} ÷ ${b} = ${a}, so a = ${a}.`}`); } },
    e: { t: 'two points, find the model', g: R => { let a, b, x1, x2, y1, y2;
      do { b = R.pick([2, 3, 4, 5, 1.5, 2, 3]); a = R.pick([1, 2, 3, 4, 5, 6, 7, 10, 12, 16, 32, 64]); x1 = R.int(1, 3); x2 = x1 + R.int(2, 3); y1 = cl(a * b ** x1); y2 = cl(a * b ** x2); } while (!Number.isInteger(y1) || !Number.isInteger(y2) || y2 > 50000);
      const d = x2 - x1, r = cl(b ** d);
      return E.num(`The model ${M('y=a*b^x')} passes (${x1}, ${E.fmt(y1)}) and (${x2}, ${E.fmt(y2)}). Find a and b.`, [{ label: 'a =', ans: a }, { label: 'b =', ans: b }],
        `Divide the y-values: ${M(`b^${d}=${y2}/${y1}=${r}`)}, so b is the ${d === 2 ? 'square' : 'cube'} root of ${r}: b = ${b}. Then ${M(`a=${y1}/${pw(b, x1)}`)} = ${a}.`); } },
    f: { t: 'the missing value, without finding a or b', g: R => { let u, v, s, i, k, j, ys;
      do { [u, v] = R.pick([[2, 1], [3, 1], [3, 2], [4, 3], [5, 2], [4, 1], [5, 3]]); s = R.int(1, 4); ys = [0, 1, 2, 3, 4].map(t => s * u ** t * v ** (4 - t)); i = R.int(0, 2); k = i + R.int(2, 4 - i); j = R.int(0, 4); } while (j === i || j === k || ys[4] > 5000);
      const x0 = R.int(-2, 2), X = t => x0 + t, st = Math.abs(j - i), ratio = E.fracStr(ys[k], ys[i]), step = E.fracStr(u, v);
      return E.num(`An exponential function ${M('y=a*b^x')} has y = ${E.fmt(ys[i])} at x = ${X(i)} and y = ${E.fmt(ys[k])} at x = ${X(k)}. What is y at x = ${X(j)}?`, [{ label: 'y =', ans: ys[j] }],
        `Equal steps in x multiply y by equal factors. Over ${k - i} steps y is multiplied by ${E.pt(ratio)}, so one step multiplies by ${E.pt(step)}. ${j > i ? 'Forward' : 'Back'} ${st} step${st > 1 ? 's' : ''} from ${E.fmt(ys[i])}: ${E.fmt(ys[i])} ${j > i ? '×' : '÷'} ${st === 1 ? E.pt(step) : M(`${u % v ? '(' + step + ')' : step}^${st}`)} = ${E.fmt(ys[j])}.${k - i === 2 && j === i + 1 ? ` (It is the geometric mean ${M(`sqrt(${ys[i]}*${ys[k]})`)}, not the average.)` : ''}`); } },
  });

  /* IV.12.02 Exponential decay */
  const GROW = ['1.2', '3', '1.05', '5/4', '2', '1.5', '4/3', '1.01'], DECAY = ['0.8', '1/2', '0.95', '2/3', '0.3', '1/4', '0.6', '0.99'];
  S('IV.12.02', 'Exponential decay', {
    a: { t: '0 < b < 1', g: R => { const grow = R.bool(), bs = R.pick(grow ? GROW : DECAY), a = R.pick([2, 5, 10, 40, 60, 100, 250, 500, 1200]), v = R.pick(['x', 't']);
      return E.choiceFixed(`Does ${M(`y=${a}(${bs})^${v}`)} show exponential growth or decay?`, ['growth', 'decay'], grow ? 0 : 1,
        grow ? `b = ${E.pt(bs)} is greater than 1, so y grows each step.` : `b = ${E.pt(bs)} is between 0 and 1, so y shrinks each step: decay.`); } },
    b: { t: 'decay factor vs rate', g: R => { const r = R.pick([2, 3, 4, 5, 8, 10, 12, 15, 20, 25, 30, 35, 40, 45, 50, 60, 75, 80, 12.5, 7.5]), b = cl(1 - r / 100);
      if (R.bool()) return E.num(`A quantity decreases by ${r}% each year. What is the decay factor b in ${M('y=a*b^t')}?`, [{ label: 'b =', ans: b }],
        `Losing ${r}% means keeping ${cl(100 - r)}%, so b = 1 − ${cl(r / 100)} = ${b}, not ${cl(r / 100)}.`);
      const a = R.pick([50, 80, 200, 500, 1000, 2400]);
      return E.num(`In ${M(`y=${a}(${b})^t`)}, by what percent does y decrease each step?`, [{ label: 'decrease (%) =', ans: r }],
        `Each step keeps ${cl(b * 100)}% of the value, so it loses 100% − ${cl(b * 100)}% = ${r}%.`); } },
    c: { t: 'from a table', g: R => { const [b, base, kmax] = R.pick([[0.5, 8, 12], [0.25, 64, 4], [0.8, 125, 8], [0.9, 1000, 3], [0.6, 125, 6], [0.2, 125, 6], [0.75, 64, 6], [0.4, 125, 6]]);
      const a = base * R.int(1, kmax), xs = [0, 1, 2, 3], ys = xs.map(x => cl(a * b ** x));
      return E.num(`This table shows exponential decay. Find the decay factor and the percent decrease per step.${table(xs, ys)}`, [{ label: 'decay factor =', ans: b }, { label: 'decrease (%) =', ans: cl(100 - 100 * b) }],
        `${E.fmt(ys[1])} ÷ ${E.fmt(ys[0])} = ${b}, and every ratio is the same. Keeping ${cl(100 * b)}% means losing ${cl(100 - 100 * b)}% each step.`); } },
    d: { t: 'contexts', g: (R, O) => { const kind = R.int(0, 2), t = R.int(2, 8);
      if (kind === 0) { const P = 500 * R.int(30, 90), r = R.int(8, 25), b = cl(1 - r / 100), v = P * b ** t;
        return E.num(`A car bought for ${cur(O)}${E.fmt(P)} loses ${r}% of its value each year. What is it worth after ${t} years? Round to the nearest cent.`, [{ label: 'value ≈ ' + cur(O), ans: cl(Math.round(v * 100) / 100), dp: 2 }],
          `V = ${E.fmt(P)}(1 − ${cl(r / 100)})^${t} = ${E.fmt(P)}(${b})^${t} ≈ ${money(O, v)}. Use b = ${b}, not ${cl(r / 100)}.`); }
      if (kind === 1) { const D = 50 * R.int(2, 16), r = R.pick([10, 12, 15, 20, 25, 30, 35, 40]), b = cl(1 - r / 100), v = D * b ** t;
        return E.num(`A patient takes ${D} mg of a medicine. Each hour, ${r}% of the medicine in the body is removed. How much is left after ${t} hours? Round to 1 decimal place.`, [{ label: 'amount ≈', ans: v, dp: 1 }],
          `A = ${D}(${b})^${t} ≈ ${fx(v, 1)} mg. Each hour ${cl(100 - r)}% stays.`); }
      const P = 1000 * R.int(5, 60), r = R.pick([1, 2, 3, 4, 5, 1.5, 2.5]), b = cl(1 - r / 100), v = P * b ** t;
      return E.num(`A town of ${E.fmt(P)} people shrinks by ${r}% per year. Predict its population after ${t} years, to the nearest person.`, [{ label: 'population ≈', ans: v, dp: 0 }],
        `P = ${E.fmt(P)}(${b})^${t} ≈ ${E.fmt(Math.round(v))}.`); } },
  });

  /* IV.12.03 Graph exponentials */
  const BASES = [['2', 2], ['3', 3], ['4', 4], ['5', 5], ['1/2', 0.5], ['1/3', 1 / 3], ['1/4', 0.25], ['10', 10]];
  const powStr = (bs, k) => { const [n, d] = bs.includes('/') ? [1, +bs.split('/')[1]] : [+bs, 1]; const [p, q] = k >= 0 ? [n ** k, d ** k] : [d ** -k, n ** -k]; return q === 1 ? String(p) : `${p}/${q}`; };
  S('IV.12.03', 'Graph exponentials', {
    a: { t: 'key points', g: R => { let bs, bv, x, y; do { [bs, bv] = R.pick(BASES); x = R.int(-2, 2); y = bv ** x; } while (y > 16);
      const ys = powStr(bs, x);
      return E.num(`The graph shows ${M('y=' + bx(bs))}. Which point on it has x = ${x}?`, [{ point: [String(x), ys] }],
        `${M(`${pw(bs, x)}=${ys}`)}, so the point is (${x}, ${E.pt(ys)}).${x === 0 ? ' Every graph y = bˣ passes (0, 1).' : x === 1 ? ' Every graph y = bˣ passes (1, b).' : ''}`, { visual: expPic([t => bv ** t], { y: [-1, Math.max(9, Math.ceil(y) + 1)] }) }); } },
    b: { t: 'horizontal asymptote', g: R => { const [bs, bv] = R.pick(BASES.slice(0, 7)), a = R.pick([1, 2, 3, 5, 10, 4]), eq = ex(a, bs);
      if (R.bool(0.35)) return E.num(`What is the horizontal asymptote of ${M('y=' + eq)}? Give its equation.`, [{ eqn: 'y=0' }],
        `${M(bx(bs))} is always positive and gets as close to 0 as you like, but never reaches it. The asymptote is y = 0.`);
      const toZero = R.bool(), neg = (bv > 1) === toZero;           // which end goes to 0
      const opts = ['gets closer and closer to 0', 'grows without bound', `gets closer and closer to ${a}`, 'reaches 0 and then turns negative'];
      return E.choice(R, `For ${M('y=' + eq)}, what happens to y as x gets ${neg ? 'very negative' : 'very large'}?`, opts[toZero ? 0 : 1], [opts[toZero ? 1 : 0], opts[2], opts[3]],
        toZero ? `Powers of ${E.pt(bs)} shrink toward 0 in that direction, but ${M(bx(bs))} is never 0, so y only approaches 0.` : `Powers of ${E.pt(bs)} keep multiplying by more than 1 in that direction, so y grows without bound.`); } },
    c: { t: 'domain and range', g: R => { const [bs] = R.pick(BASES.slice(0, 7)), a = R.pick([1, 2, 3, 5, -1, -2, 4]), k = R.bool(0.4) ? nz(R, -6, 6) : 0;
      const rng = a > 0 ? `(${k},inf)` : `(-inf,${k})`;
      return E.num(`Give the domain and range of ${M('y=' + ex(a, bs, 'x', k))} in interval notation.`, [{ label: 'domain', interval: '(-inf,inf)' }, { label: 'range', interval: rng }],
        `Any x can be an exponent, so the domain is all reals. ${M(bx(bs))} takes every positive value${a < 0 ? ', times a negative gives every negative value' : ''}${k ? `, then the graph shifts ${k > 0 ? 'up' : 'down'} ${Math.abs(k)}` : ''}: range ${E.pt(rng)}.`); } },
    d: { t: 'growth vs decay shape', g: R => { const a = R.pick([1, 2, 3]), [bs, bv] = R.pick([['2', 2], ['3', 3], ['1/2', 0.5], ['1/3', 1 / 3], ['1.5', 1.5], ['2/3', 2 / 3]]);
      const pic = (A, B, line) => expPic([line ? (x => A + x) : (x => A * B ** x)], { w: 200, h: 190, y: [-1, 10] });
      const right = pic(a, bv), wrong = R.sample([pic(a, 1 / bv), pic(a + 2, bv), pic(a + 2, 1 / bv), pic(a, bv, true)], 3);
      return E.choice(R, `Which graph shows ${M('y=' + ex(a, bs))}?`, right, wrong,
        `It passes (0, ${a}) and ${bv > 1 ? 'rises' : 'falls'} from left to right because b = ${E.pt(bs)} is ${bv > 1 ? 'greater than 1 (growth)' : 'between 0 and 1 (decay)'}. It bends toward y = 0 but never touches it.`); } },
    e: { t: 'find the base from a point', g: R => { let bn, bd, p, q, y, a;
      do { [bn, bd] = R.pick([[2, 1], [3, 1], [4, 1], [5, 1], [8, 1], [9, 1], [16, 1], [25, 1], [27, 1], [1, 2], [1, 3], [1, 4], [1, 9], [1, 8]]); [p, q] = R.pick([[2, 1], [3, 1], [-1, 1], [-2, 1], [1, 2], [-1, 2], [3, 2], [1, 3], [2, 3], [-3, 2]]); y = ratPow(bn, bd, p, q); a = R.pick([1, 1, 1, 2, 3, 5]); }
      while (!y || y[0] > 1000 || y[1] > 1000);
      const xs = fs(p, q), ys = fs(y[0], y[1]), bs = fs(bn, bd), ay = fs(a * y[0], y[1]);
      const pr = a === 1 ? `The graph of ${M('y=b^x')} passes (${E.pt(xs)}, ${E.pt(ys)}). Find b.` : `The graph of ${M('y=a*b^x')} passes (0, ${a}) and (${E.pt(xs)}, ${E.pt(ay)}). Find b.`;
      return E.num(pr, [{ label: 'b =', ...frac(bn, bd) }],
        `${a === 1 ? '' : `a = ${a} (the value at x = 0), so divide by ${a}: `}${M(`b^(${xs})=${ys}`)}. Raise both sides to the power ${E.pt(fs(q, p))}: b = ${E.pt(bs)}.`); } },
    f: { t: 'count the solutions without solving', g: R => { const kind = R.pick([0, 0, 1, 1, 2, 2, 2, 3]);
      const bOf = b => b === 'e' ? Math.E : b;
      if (kind === 0) { const b = R.pick([2, 3, 5, 10, 'e']), m = R.int(-4, 8), rhs = m ? `${m}-x` : '-x';
        return E.num(`How many real solutions does ${M(`${b}^x=${rhs}`)} have?`, [{ ans: 1 }], `The left side always rises and the right side always falls, so they cross at most once. For very negative x the right side is bigger and for large x the left side is, so they cross exactly once: 1.`); }
      if (kind === 1) { const b = R.pick([3, 4, 5, 10, 'e']), c = R.int(0, 6), rhs = c ? `x-${c}` : 'x';
        return E.num(`How many real solutions does ${M(`${b}^x=${rhs}`)} have?`, [{ ans: 0 }], `For x < 0, ${M(`${b}^x`)} is positive but ${M(rhs)} is negative. For x ≥ 0, ${M(b === 'e' ? 'e^x>=x+1' : `${b}^x>=e^x>=x+1`)}, which is bigger than ${M(rhs)}. So there are 0 solutions.`); }
      if (kind === 2) { const b = R.pick([2, 3, 4, 5, 10, 'e']), m = R.pick([-3, -2, -1, 1, 2, 3, 1, 2]), rhs = `${m === 1 ? '' : m === -1 ? '-' : m}x+1`, n = m < 0 ? 1 : (b === 'e' && m === 1) ? 1 : 2;
        return E.num(`How many real solutions does ${M(`${b}^x=${rhs}`)} have?`, [{ ans: n }],
          m < 0 ? `x = 0 works. The curve always rises and the line falls, so that is the only one: 1.` : n === 1 ? `x = 0 works, and the line y = x + 1 is tangent to ${M('y=e^x')} there (both have slope 1). The curve bends up, so it only touches the line: 1.` :
            `x = 0 works. There the curve's slope is ${M(`ln(${b})`)} ≈ ${fx(Math.log(bOf(b)), 2)}, not ${m}, so the line cuts through the curve instead of touching it. A line meets a curve that bends up at most twice, so there are 2.`); }
      return E.num(`How many real solutions does ${M('2^x=x^2')} have?`, [{ ans: 3 }], `x = 2 and x = 4 both work. For negative x, ${M('x^2')} falls toward 0 as x rises while ${M('2^x')} rises, and they swap order between x = −1 and x = 0, so there is a third. Total 3.`); } },
  });

  /* IV.12.04 Transform exponentials */
  S('IV.12.04', 'Transform exponentials', {
    a: { t: 'shifts', g: R => { const b = R.pick([2, 3, 4, 5, 10]); let h, k; do { h = R.int(-5, 5); k = R.int(-6, 6); } while (!h && !k || (h && k && Math.abs(h) === Math.abs(k)));
      const eq = ex(1, b, h ? `x${sgk(-h)}` : 'x', k);
      if (R.bool() || !h || !k) return E.num(`Shift the graph of ${M('y=' + b + '^x')} ${sh(h, k)}. Write the new equation.`, [{ label: 'y =', expr: eq }],
        `${[h ? `Moving ${h > 0 ? 'right' : 'left'} ${Math.abs(h)} replaces x with ${M(`x${sgk(-h)}`)}` : '', k ? `${h ? 'moving' : 'Moving'} ${k > 0 ? 'up' : 'down'} ${Math.abs(k)} ${k > 0 ? 'adds' : 'subtracts'} ${Math.abs(k)} outside` : ''].filter(Boolean).join(' and ')}: ${M('y=' + eq)}.`);
      const txt = (p, q) => 'shifted ' + sh(p, q);
      return E.choice(R, `How is the graph of ${M('y=' + eq)} related to ${M('y=' + b + '^x')}?`, txt(h, k), [txt(-h, k), txt(h, -k), txt(k, h)],
        `${M(`x${sgk(-h)}`)} in the exponent moves it ${h > 0 ? 'right' : 'left'} ${Math.abs(h)}; ${sgk(k)} outside moves it ${k > 0 ? 'up' : 'down'} ${Math.abs(k)}.`); } },
    b: { t: 'reflections', g: R => { const b = R.int(2, 9), kind = R.int(0, 3);
      if (kind < 3) { const eq = [`-${b}^x`, `${b}^(-x)`, `-${b}^(-x)`][kind], opts = ['over the x-axis', 'over the y-axis', 'over both axes (through the origin)', 'over the line y = x'];
        return E.choice(R, `The graph of ${M('y=' + eq)} is the graph of ${M('y=' + b + '^x')} reflected…`, opts[kind], opts.filter((_, j) => j !== kind),
          ['A minus sign outside flips every y-value: reflection over the x-axis.', 'Replacing x with −x flips left and right: reflection over the y-axis.', 'Both signs change, so it flips over both axes, which is a half-turn about the origin.'][kind]); }
      const yax = R.bool(), right = yax ? `(1/${b})^x` : `-${b}^x`, pool = [`(1/${b})^x`, `-${b}^x`, `-(1/${b})^x`, `${b}^x-1`, `${b}^(1/x)`].filter(s => s !== right);
      return E.choice(R, `Which equation is ${M('y=' + b + '^x')} reflected over the ${yax ? 'y' : 'x'}-axis?`, M('y=' + right), R.sample(pool, 3).map(s => M('y=' + s)),
        yax ? `Replace x with −x: ${M(`${b}^(-x)=(1/${b})^x`)}.` : `Negate every y-value: ${M('y=-' + b + '^x')}.`); } },
    c: { t: 'stretches', g: R => { const b = R.pick([2, 3, 4]), a = R.pick([2, 3, 4, 5, -2, -3, 0.5]), kind = R.int(0, 2);
      if (kind === 2 && a > 0) { const d = a > 1 ? `stretched vertically by a factor of ${a}` : 'compressed vertically by a factor of 1/2', o = [d, `shifted up ${a}`, `stretched horizontally by a factor of ${a}`, `shifted right ${a}`];
        return E.choice(R, `Compared with ${M('y=' + b + '^x')}, the graph of ${M('y=' + ex(a === 0.5 ? '1/2' : a, b).replace(/^1\/2/, '(1/2)'))} is…`, o[0], o.slice(1), `Multiplying the whole output by ${E.pt(a === 0.5 ? '1/2' : String(a))} scales every y-value, so it is a vertical ${a > 1 ? 'stretch' : 'compression'}.`); }
      const x0 = R.int(-1, 3), y0 = b ** x0, y1 = cl(a * y0), y0s = pv(b, x0), y1s = x0 < 0 ? E.fracStr(a === 0.5 ? 1 : a, (a === 0.5 ? 2 : 1) * b ** -x0) : String(y1);
      const as = a === 0.5 ? '1/2' : String(a), eq = a === 0.5 ? `(1/2)${b}^x` : ex(a, b);
      return E.num(`The point (${x0}, ${E.pt(y0s)}) is on ${M('y=' + b + '^x')}. Where does it move on ${M('y=' + eq)}?`, [{ point: [String(x0), y1s] }],
        `${a < 0 ? 'A negative factor stretches and flips over the x-axis' : a < 1 ? 'A vertical compression' : 'A vertical stretch'}: x stays and y is multiplied by ${E.pt(as)}. (${x0}, ${E.pt(y0s)} · ${a < 0 ? '(' + as + ')' : E.pt(as)}) = (${x0}, ${E.pt(y1s)}).`); } },
    d: { t: 'new asymptote', g: R => { const b = R.pick([2, 3, 5, 10, '1/2', '1/3']), a = R.pick([1, 2, 3, -1, -2, 4]), h = R.int(-4, 4), k = nz(R, -8, 8);
      const eq = ex(a, b, h ? `x${sgk(-h)}` : 'x', k), rng = a > 0 ? `(${k},inf)` : `(-inf,${k})`;
      return E.num(`For ${M('y=' + eq)}, give the horizontal asymptote and the range.`, [{ label: 'asymptote', eqn: `y=${k}` }, { label: 'range', interval: rng }],
        `The vertical shift ${sgk(k)} moves the asymptote from y = 0 to y = ${k}. ${a > 0 ? 'The graph stays above it' : 'The negative factor flips it below the asymptote'}: range ${E.pt(rng)}.${h ? ' The horizontal shift does not move a horizontal line.' : ''}`); } },
    e: { t: 'find a, b and k from three points', g: R => { let a, b, k, x0, ys;
      do { b = R.pick([2, 3, 4, 0.5, 2, 3]); a = nz(R, -5, 5) * (b === 0.5 ? 4 : 1); k = R.int(-9, 9); x0 = R.int(-1, 1); ys = [0, 1, 2].map(t => cl(a * b ** (x0 + t) + k)); } while (ys.some(y => !Number.isInteger(y) || Math.abs(y) > 150));
      const d1 = ys[1] - ys[0], d2 = ys[2] - ys[1], bs = b === 0.5 ? '1/2' : String(b), v0 = ys[0] - k;
      return E.num(`The graph of ${M('y=a*b^x+k')} passes (${x0}, ${ys[0]}), (${x0 + 1}, ${ys[1]}) and (${x0 + 2}, ${ys[2]}). Find a, b and k.`, [{ label: 'a =', ans: a }, { label: 'b =', ...(b === 0.5 ? frac(1, 2) : { ans: b }) }, { label: 'k =', ans: k }],
        `k cancels in the differences: ${d1} and ${d2}. Their ratio is b = ${E.pt(bs)}. The first difference is ${x0 ? `a · ${M(pw(bs, x0))} · (${E.pt(bs)} − 1)` : `a(${E.pt(bs)} − 1)`} = ${d1}, so a = ${a}, and k = ${minus(ys[0], v0)} = ${k}.`); } },
    f: { t: 'a stretch that is really a shift', g: R => { let b, c, pn, pd, h, sn;
      do { [b, c, pn, pd] = R.pick([[2, '4', 2, 1], [2, '8', 3, 1], [2, '16', 4, 1], [2, '1/4', -2, 1], [2, '1/8', -3, 1], [3, '9', 2, 1], [3, '27', 3, 1], [3, '1/3', -1, 1], [3, '1/9', -2, 1], [4, '2', 1, 2], [4, '8', 3, 2], [4, '1/2', -1, 2], [9, '3', 1, 2], [9, '27', 3, 2], [9, '1/3', -1, 2], [8, '2', 1, 3], [8, '4', 2, 3], [8, '1/2', -1, 3], [5, '25', 2, 1], [5, '1/5', -1, 1], [16, '2', 1, 4], [16, '8', 3, 4], [27, '3', 1, 3], [27, '9', 2, 3]]); h = R.int(-4, 4); sn = h * pd - pn; } while (sn === 0);
      const cs = c.includes('/') ? `(${c})` : c, eq = `${cs}(${b})^${h ? `(x${sgk(-h)})` : 'x'}`, ps = fs(pn, pd), shift = fs(sn, pd);
      return E.num(`The graph of ${M('y=' + eq)} is the graph of ${M(`y=${b}^x`)} moved sideways, with no stretch at all. How far? Give the shift, positive for right and negative for left.`, [{ label: 'shift =', ...frac(sn, pd) }],
        `Write ${E.pt(c)} as a power of ${b}: ${M(`${cs}=${b}^(${ps})`)}. So ${M(`y=${b}^(x${sgk(-h)}${pn > 0 ? '+' : ''}${ps})`)}, which is ${M(`y=${b}^x`)} moved ${E.pt(fs(Math.abs(sn), pd))} ${sn > 0 ? 'right' : 'left'}.`); } },
  });

  /* IV.12.05 Percent growth models */
  const UPCTX = [['A salary', 'rises', ['year']], ['A town\'s population', 'grows', ['year', 'decade']], ['A channel\'s subscribers', 'grow', ['month', 'week']], ['Monthly rent', 'rises', ['year']], ['A house price', 'rises', ['year', 'decade']], ['A colony of ants', 'grows', ['week', 'month']]];
  const DOWNCTX = [['A phone\'s value', 'drops', ['year']], ['The water in a pond', 'drops', ['week', 'day']], ['A drug in the blood', 'drops', ['hour']], ['A laptop\'s value', 'falls', ['year']], ['An ice block\'s mass', 'drops', ['hour']], ['The number of fish in a lake', 'falls', ['year']]];
  S('IV.12.05', 'Percent growth models', {
    a: { t: 'b = 1 + r', g: R => { const r = R.pick([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 18, 20, 25, 30, 2.5, 3.5, 4.5, 12.5, 0.5]), b = cl(1 + r / 100), [who, verb, pers] = R.pick(UPCTX), per = R.pick(pers);
      if (R.bool(0.65)) return E.num(`${who} ${verb} by ${r}% per ${per}. What is the growth factor b?`, [{ label: 'b =', ans: b }],
        `Keep 100% and add ${r}%: b = 1 + ${cl(r / 100)} = ${b}.`);
      return E.num(`A model is ${M(`y=${R.pick([40, 300, 1200, 5000])}(${b})^t`)}. By what percent does y grow each step?`, [{ label: 'growth (%) =', ans: r }],
        `b = ${b} = 1 + ${cl(r / 100)}, so the rate is ${r}% per step.`); } },
    b: { t: 'b = 1 − r', g: R => { const r = R.pick([1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 18, 20, 25, 30, 40, 2.5, 7.5, 12.5, 0.5]), b = cl(1 - r / 100), [who, verb, pers] = R.pick(DOWNCTX), per = R.pick(pers);
      if (R.bool(0.65)) return E.num(`${who} ${verb} by ${r}% per ${per}. What is the decay factor b?`, [{ label: 'b =', ans: b }],
        `Each ${per} ${cl(100 - r)}% is left: b = 1 − ${cl(r / 100)} = ${b}, not ${cl(r / 100)}.`);
      return E.num(`A model is ${M(`y=${R.pick([60, 250, 900, 4000])}(${b})^t`)}. By what percent does y fall each step?`, [{ label: 'decrease (%) =', ans: r }],
        `b = ${b} = 1 − ${cl(r / 100)}, so y loses ${r}% per step.`); } },
    c: { t: 'write the model', g: R => { const up = R.bool(), r = R.pick(up ? [2, 3, 4, 5, 6, 8, 10, 12, 15, 1.5, 2.5] : [2, 3, 4, 5, 8, 10, 12, 15, 20, 25, 1.5]), b = cl(up ? 1 + r / 100 : 1 - r / 100);
      const [who, verb, pers] = R.pick(up ? UPCTX : DOWNCTX), a = R.pick([800, 1200, 2500, 4000, 15000, 32000, 450, 90]), per = R.pick(pers);
      return E.num(`${who} starts at ${E.fmt(a)} and ${verb} by ${r}% per ${per}. Write a model for y after t ${per}s.`, [{ label: 'y =', expr: `${a}(${b})^t` }],
        `b = 1 ${up ? '+' : '−'} ${cl(r / 100)} = ${b}, so ${M(`y=${a}(${b})^t`)}.`); } },
    d: { t: 'convert period rates', g: R => { const kind = R.int(0, 2);
      if (kind === 0) { const r = R.pick([0.5, 1, 1.5, 2, 2.5, 3]), [n, per] = R.pick([[12, 'month'], [4, 'quarter'], [52, 'week']]), f = (1 + r / 100) ** n, y = (f - 1) * 100;
        return E.num(`A quantity grows ${r}% per ${per}. What is the equivalent growth rate per year, as a percent? Round to 2 decimal places.`, [{ label: 'yearly rate (%) ≈', ans: y, dp: 2 }],
          `There are ${n} ${per}s in a year: ${M(`${cl(1 + r / 100)}^${n}`)} ≈ ${fx(f, 4)}, so about ${fx(y, 2)}% per year, not ${cl(r * n)}%.`); }
      if (kind === 1) { const [n, per] = R.pick([[12, 'month'], [4, 'quarter'], [52, 'week']]), r = R.pick(n === 52 ? [0.5, 1, 1.5] : n === 12 ? [0.5, 1, 1.5, 2, 3, 4] : [1, 2, 3, 4, 5, 6, 8]), f = (1 - r / 100) ** n, y = (1 - f) * 100;
        return E.num(`A quantity falls ${r}% per ${per}. What is the equivalent decrease per year, as a percent? Round to 2 decimal places.`, [{ label: 'yearly decrease (%) ≈', ans: y, dp: 2 }],
          `There are ${n} ${per}s in a year: ${M(`${cl(1 - r / 100)}^${n}`)} ≈ ${fx(f, 4)}, so it keeps about ${fx(f * 100, 2)}% and loses about ${fx(y, 2)}% per year, not ${cl(r * n)}%.`); }
      const r = R.pick([6, 8, 10, 12, 15, 20, 24, 5, 9]), f = (1 + r / 100) ** (1 / 12);
      return E.num(`A quantity grows ${r}% per year. What is its monthly growth factor? Round to 4 decimal places.`, [{ label: 'monthly factor ≈', ans: f, dp: 4 }],
        `You need b with ${M(`b^12=${cl(1 + r / 100)}`)}: b = ${M(`${cl(1 + r / 100)}^(1/12)`)} ≈ ${fx(f, 4)}, not 1 + ${cl(r / 100)}/12.`); } },
  });

  /* IV.12.06 Compound interest */
  const NAMES = { 1: 'annually', 2: 'semiannually', 4: 'quarterly', 12: 'monthly', 365: 'daily' };
  S('IV.12.06', 'Compound interest', {
    a: { t: 'A = P(1 + r/n)^(nt)', g: (R, O) => { const P = R.pick([500, 1000, 1500, 2000, 2500, 5000, 8000, 10000, 1200, 750]), r = R.pick([2, 3, 4, 5, 6, 8, 2.5, 3.5, 4.5]), n = R.pick([1, 1, 2]), t = R.int(2, 20);
      const A = P * (1 + r / 100 / n) ** (n * t);
      return E.num(`${cur(O)}${E.fmt(P)} is invested at ${r}% interest compounded ${NAMES[n]} for ${t} years. Use ${M('A=P(1+r/n)^(nt)')} to find the final amount, to the nearest cent.`, [{ label: 'A ≈ ' + cur(O), ans: cl(Math.round(A * 100) / 100), dp: 2 }],
        `r = ${cl(r / 100)}, n = ${n}, t = ${t}: ${M(`A=${P}(1+${cl(r / 100 / n)})^${n * t}`)} ≈ ${money(O, A)}.`); } },
    b: { t: 'compounding periods', g: (R, O) => { let r, n; do { r = R.pick([2, 3, 4, 5, 6, 8, 9, 12, 2.4, 3.6, 4.8]); n = R.pick([2, 4, 12]); } while (Math.abs(Math.round(r * 10 / n) - r * 10 / n) > 1e-9);
      const P = R.pick([1000, 2000, 2500, 4000, 5000, 6000, 10000]), t = R.int(2, 15), i = cl(r / 100 / n), A = P * (1 + i) ** (n * t);
      return E.num(`${cur(O)}${E.fmt(P)} earns ${r}% a year, compounded ${NAMES[n]}, for ${t} years. Find the rate per period, the number of periods, and the final amount (nearest cent).`,
        [{ label: 'rate per period =', ans: i }, { label: 'periods =', ans: n * t }, { label: 'A ≈ ' + cur(O), ans: cl(Math.round(A * 100) / 100), dp: 2 }],
        `Per period: ${cl(r / 100)} ÷ ${n} = ${i}. Periods: ${n} × ${t} = ${n * t}. ${M(`A=${P}(${cl(1 + i)})^${n * t}`)} ≈ ${money(O, A)}.`); } },
    c: { t: 'compare offers', g: (R, O) => { let r1, r2, n1, n2, A1, A2; const P = R.pick([1000, 5000, 10000, 2000]), t = R.int(3, 15);
      do { r1 = R.pick([3, 3.25, 3.5, 3.75, 4, 4.25, 4.5, 5]); r2 = cl(r1 + R.pick([0, 0, 0.25, -0.25, 0.1, -0.1])); n1 = R.pick([1, 2, 4, 12, 365]); n2 = R.pick([1, 2, 4, 12, 365]);
        A1 = P * (1 + r1 / 100 / n1) ** (n1 * t); A2 = P * (1 + r2 / 100 / n2) ** (n2 * t); } while (Math.abs(A1 - A2) < 0.02 * t || (r1 === r2 && n1 === n2));
      if ((A1 > A2) !== R.bool()) { [r1, r2] = [r2, r1]; [n1, n2] = [n2, n1]; [A1, A2] = [A2, A1]; }
      return E.choiceFixed(`You invest ${cur(O)}${E.fmt(P)} for ${t} years. Offer A pays ${r1}% compounded ${NAMES[n1]}; Offer B pays ${r2}% compounded ${NAMES[n2]}. Which ends with more money?`, ['Offer A', 'Offer B'], A1 > A2 ? 0 : 1,
        `A: ${money(O, A1)}. B: ${money(O, A2)}. ${r1 === r2 ? 'Same rate, so more frequent compounding wins.' : 'Compute both; a higher rate or more frequent compounding can win.'}`); } },
    d: { t: 'solve for time with logs', g: (R, O) => { const P = R.pick([1000, 2000, 5000, 10000, 500]), r = R.pick([3, 4, 5, 6, 8, 2.5, 4.5, 7]), n = R.pick([1, 4, 12]), goal = R.int(0, 2);
      const T = goal === 0 ? 2 * P : goal === 1 ? 3 * P : P + R.pick([500, 1000, 1500, 2500, 4000]), i = r / 100 / n, t = Math.log(T / P) / (n * Math.log(1 + i)), gs = String(cl(i)).length > 8 ? `1+${cl(r / 100)}/${n}` : String(cl(1 + i));
      return E.num(`${cur(O)}${E.fmt(P)} is invested at ${r}% compounded ${NAMES[n]}. How many years until it ${goal === 0 ? 'doubles' : goal === 1 ? 'triples' : `reaches ${cur(O)}${E.fmt(T)}`}? Round to 2 decimal places.`, [{ label: 't ≈', ans: t, dp: 2 }],
        `${M(`${P}(${gs})^(${n === 1 ? '' : n}t)=${T}`)}. Divide by ${E.fmt(P)} and take ln: ${M(n === 1 ? `t=ln(${cl(T / P)})/ln(${gs})` : `t=ln(${cl(T / P)})/(${n}ln(${gs}))`)} ≈ ${fx(t, 2)} years.`); } },
  });

  /* IV.12.07 The number e */
  S('IV.12.07', 'The number e', {
    a: { t: 'limit of compounding', g: (R, O) => { const kind = R.int(0, 2), n = R.pick([1, 2, 3, 4, 5, 10, 12, 20, 50, 100, 365, 1000, 10000]), v = (1 + 1 / n) ** n;
      if (kind === 0) return E.num(`Evaluate ${M('(1+1/n)^n')} for n = ${E.fmt(n)}. Round to 4 decimal places.`, [{ ans: v, dp: 4 }],
        `${M(`(1+1/${n})^${n}`)} ≈ ${fx(v, 4)}. As n grows, the value creeps up toward e ≈ 2.7183.`);
      if (kind === 1) { const P = R.pick([1, 100, 1000, 500, 2000]);
        return E.num(`${cur(O)}${E.fmt(P)} earns 100% interest for one year, compounded ${n} times. How much is it worth after the year? Round to the nearest cent.`, [{ label: cur(O), ans: cl(Math.round(P * v * 100) / 100), dp: 2 }],
          `${M(`${P === 1 ? '' : P}(1+1/${n})^${n}`)} ≈ ${money(O, P * v)}. Even compounding every instant only reaches ${P === 1 ? 'e' : E.fmt(P) + 'e'} ≈ ${money(O, P * Math.E)}.`); }
      const o = ['e ≈ 2.718', '1', '2', 'it grows without bound'];
      return E.choice(R, `As n gets larger and larger, ${M('(1+1/n)^n')} (try n = ${E.fmt(n)}: ≈ ${fx(v, 4)}) gets closer to…`, o[0], o.slice(1), 'It approaches a fixed number, e ≈ 2.71828. The 1/n shrinks while the power grows, and the two effects balance.'); } },
    b: { t: 'A = Pe^(rt)', g: (R, O) => { const P = R.pick([500, 1000, 1500, 2000, 3000, 5000, 10000, 750]), r = R.pick([2, 3, 4, 5, 6, 7, 8, 2.5, 3.5]), t = R.int(1, 25), A = P * Math.exp(r / 100 * t);
      return E.num(`${cur(O)}${E.fmt(P)} is invested at ${r}% compounded continuously. Use ${M('A=Pe^(rt)')} to find the amount after ${t} year${t > 1 ? 's' : ''}, to the nearest cent.`, [{ label: 'A ≈ ' + cur(O), ans: cl(Math.round(A * 100) / 100), dp: 2 }],
        `rt = ${cl(r / 100)} × ${t} = ${cl(r / 100 * t)}, so ${M(`A=${P}e^${cl(r / 100 * t)}`)} ≈ ${money(O, A)}. Only P, r and t change; e stays 2.718….`); } },
    c: { t: 'graph eˣ', g: R => { const kind = R.int(0, 2);
      if (kind === 0) { const a = R.int(1, 4), x = R.pick([-2, -1.5, -1, -0.5, 0.5, 1, 1.5, 2]), y = a * Math.exp(x);
        return E.num(`The graph shows ${M('y=' + (a === 1 ? '' : a) + 'e^x')}. Use a calculator to find y at x = ${x}, to 3 decimal places.`, [{ label: 'y ≈', ans: y, dp: 3 }],
          `${M(`${a === 1 ? '' : a}e^${x < 0 ? '(' + x + ')' : x}`)} ≈ ${fx(y, 3)}.`, { visual: expPic([t => a * Math.exp(t)], { x: [-3, 3], y: [-1, 13] }) }); }
      if (kind === 1) { const k = nz(R, -6, 6), a = R.pick([1, 2, 3, 5]);
        return E.num(`What is the horizontal asymptote of ${M('y=' + (a === 1 ? '' : a) + 'e^x' + sgk(k))}?`, [{ eqn: `y=${k}` }], `${M('e^x')} approaches 0 as x gets very negative, so y approaches ${k}: the asymptote is y = ${k}.`); }
      const a = R.int(1, 9), sgn = R.pick(['x', '-x']);
      return E.num(`Where does ${M('y=' + (a === 1 ? '' : a) + 'e^(' + sgn + ')')} cross the y-axis? Give the point.`, [{ point: ['0', String(a)] }],
        `At x = 0, ${M('e^0=1')}, so y = ${a}: the point (0, ${a}).`); } },
    d: { t: 'continuous growth contexts', g: R => { const kind = R.int(0, 2);
      if (kind === 0) { const P = R.pick([1200, 5000, 8000, 25000, 60000, 350]), r = R.pick([1, 1.5, 2, 2.5, 3, 4, 5, 6]), t = R.int(3, 20), v = P * Math.exp(r / 100 * t);
        return E.num(`A population of ${E.fmt(P)} grows continuously at ${r}% per year, so ${M(`P=${P}e^(${cl(r / 100)}t)`)}. Predict it after ${t} years, to the nearest whole number.`, [{ label: 'P ≈', ans: v, dp: 0 }],
          `${M(`${P}e^(${cl(r / 100)}*${t})=${P}e^${cl(r / 100 * t)}`)} ≈ ${E.fmt(Math.round(v))}.`); }
      if (kind === 1) { const A0 = R.pick([100, 200, 250, 400, 500, 800]), r = R.pick([5, 8, 10, 12, 15, 20, 25]), t = R.int(2, 12), v = A0 * Math.exp(-r / 100 * t);
        return E.num(`A drug leaves the body continuously: ${M(`A=${A0}e^(-${cl(r / 100)}t)`)} mg after t hours. How much remains after ${t} hours? Round to 1 decimal place.`, [{ label: 'A ≈', ans: v, dp: 1 }],
          `${M(`${A0}e^(-${cl(r / 100 * t)})`)} ≈ ${fx(v, 1)} mg.`); }
      const P = R.pick([100, 500, 2000, 50]), r = R.pick([2, 3, 4, 5, 6, 8, 10]), m = R.pick([2, 3, 5, 10, 1.5]), t = Math.log(m) / (r / 100);
      return E.num(`Bacteria grow continuously by ${M(`N=${P}e^(${cl(r / 100)}t)`)} (t in hours). When will there be ${E.fmt(cl(P * m))}? Round to 1 decimal place.`, [{ label: 't ≈', ans: t, dp: 1 }],
        `${M(`e^(${cl(r / 100)}t)=${m}`)}, so ${M(`t=ln(${m})/${cl(r / 100)}`)} ≈ ${fx(t, 1)} hours.`); } },
    e: { t: 'exact rates and times', g: R => { const m = R.pick([2, 3, 5, 10, 2, 3]), verb = m === 2 ? 'doubles' : m === 3 ? 'triples' : `grows to ${m} times its size`;
      if (R.bool()) { const T = R.pick([5, 8, 10, 12, 15, 20, 25, 40]);
        return E.num(`Money compounded continuously ${verb} in ${T} years. Find the rate r exactly, as a decimal (not a percent).`, [{ label: 'r =', exact: `ln(${m})/${T}` }],
          `${M(`e^(${T}r)=${m}`)}, so ${M(`${T}r=ln(${m})`)} and ${M(`r=ln(${m})/${T}`)} ≈ ${fx(Math.log(m) / T, 4)}.`); }
      const r = R.pick([1, 2, 4, 5, 10, 20, 25]), c = 100 / r;
      return E.num(`At ${r}% compounded continuously, how many years until money ${m === 2 ? 'doubles' : m === 3 ? 'triples' : `grows to ${m} times its size`}? Give the exact answer.`, [{ label: 't =', exact: `${c}ln(${m})` }],
        `${M(`e^(${cl(r / 100)}t)=${m}`)}, so ${M(`t=ln(${m})/${cl(r / 100)}=${c}ln(${m})`)} ≈ ${fx(c * Math.log(m), 2)} years.`); } },
    f: { t: 'limits in disguise', g: R => { let a, c, b, k;
      do { a = R.pick([1, 2, 3, -1, -2, 4]); c = R.pick([1, 1, 1, 2, 3]); b = R.pick([1, 1, 2, 3]); k = R.pick([0, 0, 0, 1, 2, 3, 5]); } while (a === 1 && c === 1 && b === 1 && k === 0);
      const cn = c === 1 ? 'n' : c + 'n', A = Math.abs(a), sg = a < 0 ? '-' : '+', style = c === 1 ? R.int(0, 1) : 0;
      const base = style ? `((n${sg}${A})/n)` : `(1${sg}${A}/${c === 1 ? 'n' : '(' + cn + ')'})`, pow = `${b === 1 ? '' : b}n${k ? '+' + k : ''}`, expr = `${base}^${pow === 'n' ? 'n' : '(' + pow + ')'}`;
      const [N, D] = [a * b, c].map(Math.abs), g = E.gcd(N, D), n0 = (a < 0 ? -1 : 1) * N / g, d0 = D / g, ex = fs(n0, d0), ans = ex === '1' ? 'e' : `e^${d0 === 1 && n0 > 0 ? n0 : '(' + ex + ')'}`;
      return E.num(`What value does ${M(expr)} approach as n grows without bound? Give an exact answer.`, [{ exact: ans }],
        `Use ${M('(1+x/N)^N')} → ${M('e^x')}. Here N = ${cn} and x = ${a}${b === c ? '' : `, and the power ${b === 1 ? '' : b}n equals ${fs(b, c).includes('/') ? '(' + E.pt(fs(b, c)) + ')' : fs(b, c)}N`}, so the limit is ${b === c ? '' : M(`(${a === 1 ? 'e' : 'e^' + (a < 0 ? '(' + a + ')' : a)})^(${fs(b, c)})`) + ' = '}${M(ans)}.${k ? ` The extra ${M(`${base}^${k}`)} tends to 1, so it changes nothing.` : ''}`); } },
  });

  /* IV.12.08 What a logarithm is */
  const apart = (vs, tol = 0.1) => vs.every((u, i) => vs.every((w, j) => j <= i || Math.abs(u - w) > tol * Math.max(1, Math.abs(u), Math.abs(w))));   // option values clearly different
  const powPick = (R, bases, kmin, kmax, cap = 1e6) => { let b, k; do { b = R.pick(bases); k = R.int(kmin, kmax); } while (b ** Math.abs(k) > cap); return [b, k]; };
  S('IV.12.08', 'What a logarithm is', {
    a: { t: 'log as "which exponent"', g: R => { const [b, k] = powPick(R, [2, 3, 4, 5, 6, 7, 8, 9, 10], 1, 6, 1e5), x = b ** k;
      return E.num(`${M(lg(b, x))} asks: ${b} to what power gives ${E.fmt(x)}? Find ${M(lg(b, x))}.`, [{ ans: k }],
        `${M(`${b}^${k}=${x}`)}, so ${M(`${lg(b, x)}=${k}`)}. The log is the exponent.`); } },
    b: { t: 'log_b(x) = y means bʸ = x', g: R => { const kind = R.int(0, 2);
      if (kind === 0) { const [b, k] = powPick(R, [2, 3, 4, 5, 6, 7, 10], 1, 5, 1e5);
        return E.num(`If ${M(`${lg(b, 'x')}=${k}`)}, what is x?`, [{ label: 'x =', ans: b ** k }], `${M(`${lg(b, 'x')}=${k}`)} means ${M(`${b}^${k}=x`)}, so x = ${E.fmt(b ** k)}.`); }
      if (kind === 1) { const [b, k] = powPick(R, [2, 3, 4, 5, 6, 7, 8, 9, 10], 2, 4, 1e4);
        return E.num(`If ${MV(`log_b(${b ** k})=${k}`)}, what is the base b?`, [{ label: 'b =', ans: b }], `It means ${M(`b^${k}=${b ** k}`)}, and ${M(`${b}^${k}=${b ** k}`)}, so b = ${b}.`); }
      const [b, k] = powPick(R, [2, 3, 4, 5, 10], 1, 4, 1e4);
      return E.num(`If ${M(`${lg(b, 'x')}=-${k}`)}, what is x?`, [{ label: 'x =', ...frac(1, b ** k) }], `It means ${M(`x=${b}^(-${k})=1/${b ** k}`)}. A negative log means x is between 0 and 1.`); } },
    c: { t: 'common and natural logs', g: R => { const kind = R.int(0, 3);
      if (kind === 0) { const k = R.int(-3, 6), x = k >= 0 ? String(10 ** k) : (10 ** k).toFixed(-k);
        return E.num(`Evaluate ${M(`log(${x})`)} without a calculator.`, [{ ans: k }], `log with no base means base 10, and ${M(`${x}=10^${k < 0 ? '(' + k + ')' : k}`)}, so the answer is ${k}.`); }
      if (kind === 1) { const k = nz(R, -4, 7);
        return E.num(`Evaluate ${M(`ln(e^${k < 0 ? '(' + k + ')' : k})`)}.`, [{ ans: k }], `ln means base e, and ln undoes ${M('e^x')}: the answer is ${k}.`); }
      if (kind === 2) { const ln = R.bool(), x = R.pick([2, 3, 5, 7, 12, 20, 45, 150, 0.5, 0.2, 2.5, 800]), v = ln ? Math.log(x) : Math.log10(x);
        return E.num(`Use a calculator: ${M((ln ? 'ln' : 'log') + '(' + x + ')')} to 3 decimal places.`, [{ ans: v, dp: 3 }], `${ln ? 'ln is base e' : 'log is base 10'}: ${M((ln ? 'ln' : 'log') + '(' + x + ')')} ≈ ${fx(v, 3)}.${x < 1 ? ' It is negative because the input is less than 1.' : ''}`); }
      const ln = R.bool(), o = ['10', 'e', '2', 'the input x'];
      return E.choice(R, `What base does ${M(ln ? 'ln(x)' : 'log(x)')} use?`, o[ln ? 1 : 0], o.filter((_, j) => j !== (ln ? 1 : 0)), ln ? 'ln is the natural log, base e ≈ 2.718.' : 'log with no base written is the common log, base 10.'); } },
    d: { t: 'log of 1, of b, and inverses', g: R => { const b = R.pick([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 15, 20, 'e']), kind = R.int(0, 3), k = R.int(2, 9);
      const L = a => lg(b, a), B = b === 'e' ? 'e' : String(b);
      if (kind === 0) return E.num(`Evaluate ${M(L(1))}.`, [{ ans: 0 }], `${M(`${B}^0=1`)}, so ${M(L(1) + '=0')}. The log of 1 is 0 in every base.`);
      if (kind === 1) return E.num(`Evaluate ${M(L(B))}.`, [{ ans: 1 }], `${M(`${B}^1=${B}`)}, so ${M(L(B) + '=1')}. The log of the base is 1.`);
      if (kind === 2) return E.num(`Evaluate ${M(L(`${B}^${k}`))}.`, [{ ans: k }], `The log asks for the exponent on ${B}: it is ${k}.`);
      return E.num(`Evaluate ${M(`${B}^${L(k)}`)}.`, [{ ans: k }], `${M(L(k))} is the power of ${B} that gives ${k}, so raising ${B} to it gives ${k}.`); } },
  });

  /* IV.12.09 Convert exponential and log */
  const logEq = (b, x, y) => M(`${lg(b, x)}=${y}`);
  S('IV.12.09', 'Convert exponential and log', {
    a: { t: 'exponential to log', g: R => { let b, k; do [b, k] = powPick(R, [2, 3, 4, 5, 6, 7, 10], -3, 5, 1e5); while (k >= -1 && k <= 1 || k === b); const x = pv(b, k), right = logEq(b, x, k), pool = [];
      const seen = [[b, E.value(x)[0], k]], add = (B, X, Y) => { const s = logEq(B, X, Y), xv = E.value(String(X))[0], yv = E.value(String(Y))[0];
        if (xv > 0 && Math.abs(Math.log(xv) / Math.log(B) - yv) < 1e-9) return;                    // a true statement is not a wrong answer
        if (seen.some(([B2, X2, Y2]) => B2 === B && Math.abs(X2 - xv) < 1e-9 && Math.abs(Y2 - yv) < 1e-9)) return; seen.push([B, xv, yv]); pool.push(s); };
      if (/^\d+$/.test(x)) add(+x, b, k); if (k >= 2) add(k, x, b); add(b, k, x); add(b, x, -k); add(b, x, E.fracStr(1, k));
      return E.choice(R, `Write ${M(`${pw(b, k)}=${x}`)} in logarithmic form.`, right, R.sample(pool, 3),
        `The base ${b} stays the base, and the log equals the exponent ${k}: ${right}.`); } },
    b: { t: 'log to exponential', g: R => { let b, k; do [b, k] = powPick(R, [2, 3, 4, 5, 6, 8, 9, 10], -3, 5, 1e5); while (k >= -1 && k <= 1 || k === b); const x = pv(b, k);
      const trip = [[b, k, x], [k, b, x], [x, k, b], [b, x, k], [k, x, b]].map(t => t.map(v => E.value(String(v))[0]));
      const eqs = [[b, k, x], [k, b, x], [x, k, b], [b, x, k], [k, x, b]].map(([B, P, V2]) => M(`${pw(B, P)}=${V2}`));
      const wrong = eqs.filter((s, i) => i && Math.abs(trip[i][0] ** trip[i][1] - trip[i][2]) > 1e-9 && s !== eqs[0]);   // drop true statements such as 4² = 16 for 2⁴ = 16
      return E.choice(R, `Write ${logEq(b, x, k)} in exponential form.`, eqs[0], R.sample(wrong, 3),
        `${M(`${lg(b, 'x')}=y`)} means ${M(`${b}^y=x`)}: the base ${b} is the thing raised, to the power ${k}.`); } },
    c: { t: 'with e and ln', g: R => { const kind = R.int(0, 2);
      if (kind === 0) { const k = nz(R, -3, 6), ek = k < 0 ? `e^(${k})` : `e^${k}`;
        return E.num(`Solve ${M(`ln(x)=${k}`)}. Give the exact answer.`, [{ label: 'x =', exact: ek }], `${M(`ln(x)=${k}`)} means ${M(`e^${k < 0 ? '(' + k + ')' : k}=x`)}, so x = ${M(ek)}.`); }
      if (kind === 1) { const n = R.pick([2, 3, 5, 6, 7, 10, 11, 12, 15, 20, 25, 30, 50, 100]);
        return E.num(`Solve ${M(`e^x=${n}`)}. Give the exact answer.`, [{ label: 'x =', exact: `ln(${n})` }], `${M(`e^x=${n}`)} means ${M(`x=ln(${n})`)}.`); }
      const k = R.int(2, 9), right = `x=e^${k}`;
      return E.choice(R, `Which is equivalent to ${M(`ln(x)=${k}`)}?`, M(right), [M(`x=ln(${k})`), M(`x=10^${k}`), M(`x=${k}e`)], `ln is log base e, so ${M(`ln(x)=${k}`)} means ${M(`e^${k}=x`)}.`); } },
    d: { t: 'solve simple ones', g: R => { const kind = R.int(0, 4);
      if (kind === 0) { const [b, k] = powPick(R, [2, 3, 4, 5, 6, 10], 2, 4, 1e4); return E.num(`Solve ${M(`${lg(b, 'x')}=${k}`)}.`, [{ label: 'x =', ans: b ** k }], `x = ${M(`${b}^${k}`)} = ${E.fmt(b ** k)}.`); }
      if (kind === 1) { const [b, k] = powPick(R, [2, 3, 4, 5, 6, 7, 8, 9], 2, 3, 1e3); return E.num(`Solve ${MV(`log_x(${b ** k})=${k}`)}.`, [{ label: 'x =', ans: b }], `${M(`x^${k}=${b ** k}`)}, and x must be a positive base, so x = ${b}.`); }
      if (kind === 2) { const [b, k] = powPick(R, [2, 3, 5, 10], 1, 4, 1e4), c = nz(R, -9, 9);
        return E.num(`Solve ${M(`${lg(b, 'x' + sgk(c))}=${k}`)}.`, [{ label: 'x =', ans: b ** k - c }], `${M(`x${sgk(c)}=${b}^${k}=${b ** k}`)}, so x = ${b ** k - c}.`); }
      if (kind === 3) { const [b, k] = powPick(R, [2, 3, 4, 5, 6, 7], 2, 5, 1e5); return E.num(`Solve ${M(`${b}^x=${b ** k}`)}.`, [{ label: 'x =', ans: k }], `In log form, ${M(`x=${lg(b, b ** k)}`)} = ${k}, since ${M(`${b}^${k}=${b ** k}`)}.`); }
      const [b, k] = powPick(R, [2, 3, 4, 5, 10], 1, 4, 1e4), a = R.pick([2, 4, 5]);
      return E.num(`Solve ${M(`${lg(b, a + 'x')}=${k}`)}.`, [{ label: 'x =', ...frac(b ** k, a) }], `${M(`${a}x=${b}^${k}=${b ** k}`)}, so x = ${E.pt(E.fracStr(b ** k, a))}.`); } },
  });

  /* IV.12.10 Evaluate logs */
  S('IV.12.10', 'Evaluate logs', {
    a: { t: 'by hand for exact powers', g: R => { const [b, k] = powPick(R, [2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 11, 12, 20], 0, 6, 1e6), x = b ** k;
      return E.num(`Evaluate ${M(lg(b, x))}.`, [{ ans: k }], `Write ${E.fmt(x)} as a power of ${b}: ${M(`${x}=${b}^${k}`)}, so the log is ${k}.`); } },
    b: { t: 'fractional and negative results', g: R => { let c, m, n; do { c = R.pick([2, 3, 5, 10]); m = c === 10 ? 1 : R.pick([1, 2, 3]); n = nz(R, -4, 4); } while (c ** m > 125 || c ** Math.abs(n) > 1000 || (n > 0 && n % m === 0));
      const b = c ** m, arg = n > 0 ? String(c ** n) : c === 10 ? (10 ** n).toFixed(-n) : `1/${c ** -n}`, ans = E.fracStr(n, m);
      return E.num(`Evaluate ${M(lg(b, arg))}. Give an exact answer.`, [frac(n, m)],
        m === 1 ? `${M(`${arg}=${c}^${n < 0 ? '(' + n + ')' : n}`)}, so the log is ${E.pt(ans)}. A fraction below 1 gives a negative log, not a reciprocal.` :
          `Both are powers of ${c}: ${M(`${b}=${c}^${m}`)} and ${M(`${arg}=${c}^${n < 0 ? '(' + n + ')' : n}`)}. So ${M(`${m}y=${n}`)}, y = ${E.pt(ans)}.`); } },
    c: { t: 'estimate between integers', g: R => { let b, x, k; do { b = R.pick([2, 3, 4, 5, 10]); k = R.int(0, 5); x = R.int(b ** k + 1, b ** (k + 1) - 1); } while (b ** (k + 1) > 1e5 || Math.abs(Math.round(Math.log(x) / Math.log(b)) - Math.log(x) / Math.log(b)) < 1e-9);
      return E.num(`${M(lg(b, x))} lies between which two consecutive whole numbers?`, [{ label: 'between', ans: k }, { label: 'and', ans: k + 1 }],
        `${M(`${b}^${k}=${b ** k}`)} and ${M(`${b}^${k + 1}=${b ** (k + 1)}`)}. Since ${E.fmt(b ** k)} < ${E.fmt(x)} < ${E.fmt(b ** (k + 1))}, the log is between ${k} and ${k + 1}.`); } },
    d: { t: 'calculator', g: R => { const b = R.pick([10, 'e', 2, 3, 5, 7, 10, 'e']); let x; do x = R.pick([3, 5, 7, 12, 15, 20, 30, 45, 60, 75, 99, 150, 250, 0.3, 0.75, 1.5, 2.5, 1000.5]); while (typeof b === 'number' && Math.abs(Math.log(x) / Math.log(b) % 1) < 1e-9);
      const v = b === 'e' ? Math.log(x) : Math.log(x) / Math.log(b);
      return E.num(`Use a calculator to evaluate ${M(lg(b, x))} to 3 decimal places.`, [{ ans: v, dp: 3 }],
        b === 10 || b === 'e' ? `The ${b === 10 ? 'log' : 'ln'} key gives ${fx(v, 3)}.` : `${M(`ln(${x})/ln(${b})`)} ≈ ${fx(Math.log(x), 4)} ÷ ${fx(Math.log(b), 4)} ≈ ${fx(v, 3)}.`); } },
    e: { t: 'roots and power bases', g: R => { let c, B, A;
      do { c = R.pick([2, 3, 5]);
        B = R.pick([[String(c), 1, 1], [String(c * c), 2, 1], [String(c ** 3), 3, 1], [`sqrt(${c})`, 1, 2], [`1/${c}`, -1, 1], [`1/${c * c}`, -2, 1]]);
        const n = R.int(1, 2), k = R.pick([1, 3]), j = R.int(1, 2), t = R.int(2, 4);
        A = R.pick([[`${c ** n}sqrt(${c})`, 2 * n + 1, 2], [`1/sqrt(${c ** k})`, -k, 2], [`cbrt(${c ** j})`, j, 3], [String(c ** t), t, 1], [`1/${c ** t}`, -t, 1]]); }
      while ((B[2] === 1 && B[1] === 1 && A[2] === 1) || +B[0] > 125 || (A[2] === 1 && +A[0] > 625) || (B[2] === 1 && A[2] === 1 && B[1] > 0 && A[1] > 0));
      const bs = fs(B[1], B[2]), as = fs(A[1], A[2]), num = A[1] * B[2], den = A[2] * B[1];
      return E.num(`Evaluate ${LBX(B[0], A[0])}. Give an exact answer.`, [frac(num, den)],
        `Write both as powers of ${c}: the base is ${M(`${c}^(${bs})`)} and the input is ${M(`${c}^(${as})`)}. The log is the ratio of the exponents: ${E.pt(as)} ÷ ${B[1] < 0 ? '(' + E.pt(bs) + ')' : E.pt(bs)} = ${E.pt(fs(num, den))}.`); } },
    f: { t: 'a telescoping chain', g: R => { if (R.bool()) { let a, k, N; do { a = R.int(2, 10); k = R.int(2, 3); N = a ** k; } while (N > 1000 || N - a < 3);
        const LG = (u, w) => M(`log_${u}(${w})`);
        return E.num(`Evaluate ${LG(a, a + 1)} · ${LG(a + 1, a + 2)} · ${LG(a + 2, a + 3)} · … · ${LG(N - 1, N)}.`, [{ ans: k }],
          `By change of base each factor is ${M('ln(m+1)/ln(m)')}, so everything cancels except ${M(`ln(${N})/ln(${a})`)} = ${M(lg(a, N))} = ${k}.`); }
      let b, a, k, N; do { b = R.pick([2, 3, 5, 10]); a = R.int(1, 3); k = R.int(2, 4); N = a * b ** k; } while (N > 1000 || N - a < 4);
      const T = j => lg(b, `${j}/${j + 1}`);
      return E.num(`Evaluate ${M(`${T(a)}+${T(a + 1)}+${T(a + 2)}`)} + … + ${M(T(N - 1))}.`, [{ ans: -k }],
        `Each term is ${M(`${lg(b, 'j')}-${lg(b, 'j+1')}`)}, so the middle terms cancel and the sum is ${M(`${lg(b, a)}-${lg(b, N)}=${lg(b, `${a}/${N}`)}`)} = ${-k}, since ${M(`${N}/${a}=${b}^${k}`)}.`); } },
  });

  /* IV.12.11 Log properties */
  const LETTERS = [['x', 'y'], ['m', 'n'], ['p', 'q'], ['u', 'v'], ['a', 'c']], LB = [10, 'e', 2, 3, 5, 7];
  S('IV.12.11', 'Log properties', {
    a: { t: 'product rule', g: R => { const kind = R.int(0, 2), b = R.pick(LB), [u, v] = R.pick(LETTERS);
      if (kind === 0) { const p = R.pick([1, 2, 3, 4, 5, 1.5, 0.7, 2.3, 1.2]), q = R.pick([2, 3, 6, 0.4, 1.1, 2.5, 4]);
        return E.num(`If ${M(`${lg(b, u)}=${p}`)} and ${M(`${lg(b, v)}=${q}`)}, find ${M(lg(b, u + v))}.`, [{ ans: cl(p + q) }], `${M(`${lg(b, u + v)}=${lg(b, u)}+${lg(b, v)}`)} = ${p} + ${q} = ${cl(p + q)}.`); }
      if (kind === 1) { let B, k, s, t2; do { B = R.pick([6, 10, 10, 12, 15, 20]); k = R.int(1, 3); const N = B ** k; const ds = []; for (let d = 2; d < N; d++) if (N % d === 0 && Math.abs(Math.log(d) / Math.log(B) % 1) > 1e-9) ds.push(d); s = ds.length ? R.pick(ds) : 0; t2 = s ? N / s : 0; } while (!s || B ** k > 5000);
        return E.num(`Evaluate ${M(`${lg(B, s)}+${lg(B, t2)}`)}.`, [{ ans: k }], `Add logs by multiplying inside: ${M(lg(B, `(${s}*${t2})`))} = ${M(lg(B, B ** k))} = ${k}.`); }
      const L = s => lg(b, s);
      return E.choice(R, `Which is equal to ${M(L(u + v))}?`, M(`${L(u)}+${L(v)}`), [M(`${L(u)}*${L(v)}`), M(`${L(u)}+${v}`), M(L(`${u}+${v}`))], `The log of a product is the sum of the logs: ${M(`${L(u + v)}=${L(u)}+${L(v)}`)}.`); } },
    b: { t: 'quotient rule', g: R => { const kind = R.int(0, 2), b = R.pick(LB), [u, v] = R.pick(LETTERS);
      if (kind === 0) { const p = R.pick([5, 7, 3, 4.5, 2.4, 6, 1.8]), q = R.pick([2, 3, 1.5, 0.9, 4, 2.2]);
        return E.num(`If ${M(`${lg(b, u)}=${p}`)} and ${M(`${lg(b, v)}=${q}`)}, find ${M(lg(b, `${u}/${v}`))}.`, [{ ans: cl(p - q) }], `${M(`${lg(b, `${u}/${v}`)}=${lg(b, u)}-${lg(b, v)}`)} = ${p} − ${q} = ${cl(p - q)}.`); }
      if (kind === 1) { const [B, k] = powPick(R, [2, 3, 5, 10, 4, 6], 1, 4, 1000), w = R.pick([3, 5, 6, 7, 11, 12, 13].filter(z => Math.abs(Math.log(z) / Math.log(B) % 1) > 1e-9)), top = w * B ** k;
        return E.num(`Evaluate ${M(`${lg(B, top)}-${lg(B, w)}`)}.`, [{ ans: k }], `Subtract logs by dividing inside: ${M(lg(B, `${top}/${w}`))} = ${M(lg(B, B ** k))} = ${k}.`); }
      const L = s => lg(b, s);
      return E.choice(R, `Which is equal to ${M(L(`${u}/${v}`))}?`, M(`${L(u)}-${L(v)}`), [M(`${L(u)}/${L(v)}`), M(`${L(v)}-${L(u)}`), M(L(`${u}-${v}`))], `The log of a quotient is a difference of logs: ${M(`${L(`${u}/${v}`)}=${L(u)}-${L(v)}`)}.`); } },
    c: { t: 'power rule', g: R => { const kind = R.int(0, 2), b = R.pick(LB), u = R.pick(['x', 'm', 'p', 'u', 'w']);
      if (kind === 0) { const p = R.pick([2, 3, 4, 1.5, 0.8, 6, 10]), rt = R.bool(0.3), k = R.int(2, 6), lhs = rt ? `sqrt(${u})` : `${u}^${k}`, v = cl(rt ? p / 2 : k * p);
        return E.num(`If ${M(`${lg(b, u)}=${p}`)}, find ${M(lg(b, lhs))}.`, [{ ans: v }], rt ? `${M(`sqrt(${u})=${u}^(1/2)`)}, so the log is ½ · ${p} = ${v}.` : `The exponent comes out front: ${M(`${k}${lg(b, u)}`)} = ${k} · ${p} = ${v}.`); }
      if (kind === 1) { const [B, m] = powPick(R, [2, 3, 5, 10], 1, 3, 1000), k = R.int(2, 9);
        return E.num(`Evaluate ${M(lg(B, `${B ** m}^${k}`))}.`, [{ ans: m * k }], `Power rule: ${M(`${k}${lg(B, B ** m)}`)} = ${k} · ${m} = ${m * k}.`); }
      const k = R.int(2, 7), L = s => lg(b, s);
      return E.choice(R, `Which is equal to ${M(L(`${u}^${k}`))}?`, M(`${k}${L(u)}`), [M(`(${L(u)})^${k}`), M(L(`${k}${u}`)), M(`${L(u)}+${k}`)], `The exponent moves to the front as a multiplier: ${M(`${L(`${u}^${k}`)}=${k}${L(u)}`)}.`); } },
    d: { t: 'expand and condense', g: R => { const kind = R.int(0, 2), b = R.pick([10, 'e', 2, 3]), L = s => lg(b, s);
      const pv2 = (v, p) => p === 1 ? v : `${v}^${p}`, co = (p, s) => (p === 1 ? '' : p) + s;
      if (kind === 0) { const p = R.int(1, 4), q = R.int(1, 3), r = R.int(2, 4), [x, y, z] = R.pick([['x', 'y', 'z'], ['a', 'b', 'c'], ['m', 'n', 'p'], ['u', 'v', 'w']]);
        const inside = `(${pv2(x, p)}${pv2(y, q)})/${pv2(z, r)}`, right = `${co(p, L(x))}+${co(q, L(y))}-${co(r, L(z))}`;
        return E.choice(R, `Expand ${M(L(inside))}.`, M(right), [M(`${co(p, L(x))}+${co(q, L(y))}+${co(r, L(z))}`), M(`${L(p === 1 ? x : p + x)}+${L(q === 1 ? y : q + y)}-${L(r + z)}`), M(`(${co(p, L(x))}+${co(q, L(y))})/(${co(r, L(z))})`)],
          `Product → add, quotient → subtract, powers → multipliers: ${M(right)}.`); }
      if (kind === 1) { const p = R.int(2, 4), q = R.int(1, 3), [x, y] = R.pick(LETTERS), right = L(`${pv2(x, p)}/${pv2(y, q)}`);
        return E.choice(R, `Condense ${M(`${co(p, L(x))}-${co(q, L(y))}`)} into a single log.`, M(right), [M(L(`${pv2(x, p)}-${pv2(y, q)}`)), M(L(`${pv2(x, p)}${pv2(y, q)}`)), M(L(`(${p}${x})/(${q === 1 ? '' : q}${y})`))],
          `Move the multipliers up as powers, then a difference of logs is the log of a quotient: ${M(right)}.`); }
      let B, k, w, s, t2; do { B = R.pick([2, 3, 10, 2, 5]); k = R.int(2, B === 10 ? 3 : 5); w = R.pick([3, 5, 7, 6, 15]); const N = w * B ** k; const ds = []; for (let d = 2; d * d <= N; d++) if (N % d === 0 && d !== w && N / d !== w) ds.push(d); s = ds.length ? R.pick(ds) : 0; t2 = s ? N / s : 0; } while (!s || w % B === 0 || s === t2);
      return E.num(`Evaluate ${M(`${lg(B, s)}+${lg(B, t2)}-${lg(B, w)}`)}.`, [{ ans: k }], `Condense: ${M(lg(B, `(${s}*${t2})/${w}`))} = ${M(lg(B, B ** k))} = ${k}.`); } },
  });

  /* IV.12.12 Change of base */
  S('IV.12.12', 'Change of base', {
    a: { t: 'the formula', g: R => { const f = R.pick(['ln', 'log']), Lf = f === 'ln' ? Math.log : Math.log10; let b, x;
      do { b = R.pick([2, 3, 4, 5, 6, 7, 8, 9, 11, 12]); x = R.int(2, 60); } while (x === b || Math.abs(Math.log(x) / Math.log(b) % 1) < 1e-9 || !apart([Lf(x) / Lf(b), Lf(b) / Lf(x), Lf(x) - Lf(b), Lf(x) * Lf(b)]));
      const right = M(`${f}(${x})/${f}(${b})`), wrong = [M(`${f}(${b})/${f}(${x})`), R.bool() ? M(`${f}(${x}/${b})`) : M(`${f}(${x})-${f}(${b})`), M(`${f}(${x})*${f}(${b})`)];   // ln(x/b) and ln x − ln b are equal, so only one
      return E.choice(R, `Which expression equals ${M(lg(b, x))}?`, right, wrong, `Change of base: ${M(`${lg(b, x)}=${f}(${x})/${f}(${b})`)}. The input goes on top, the base on the bottom.`); } },
    b: { t: 'evaluate any base', g: R => { const b = R.pick([2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 15, 20]); let x; do x = R.pick([R.int(2, 500), R.int(2, 500), R.pick([0.2, 0.5, 0.05, 1.8, 2.5, 7.5, 0.9])]); while (x === b || Math.abs(Math.log(x) / Math.log(b) % 1) < 1e-9);
      const v = Math.log(x) / Math.log(b);
      return E.num(`Evaluate ${M(lg(b, x))} to 3 decimal places.`, [{ ans: v, dp: 3 }], `${M(`${lg(b, x)}=ln(${x})/ln(${b})`)} ≈ ${fx(Math.log(x), 4)} ÷ ${fx(Math.log(b), 4)} ≈ ${fx(v, 3)}.`); } },
    c: { t: 'why it works', g: R => { const st = R.int(0, 3); let b, x; do { b = R.pick([2, 3, 5, 6, 7]); x = R.int(5, 90); } while (Math.abs(Math.log(x) / Math.log(b) % 1) < 1e-9 || st === 2 && !apart([Math.log(x) / Math.log(b), Math.log(b) / Math.log(x), Math.log(x) - Math.log(b), Math.log(x) * Math.log(b)]));
      const Q = [
        [`Let ${M(`y=${lg(b, x)}`)}. What does this mean in exponential form?`, M(`${b}^y=${x}`), [M(`y^${b}=${x}`), M(`${x}^y=${b}`), M(`${b}^${x}=y`)], `A log is an exponent: ${M(`${b}^y=${x}`)}.`],
        [`From ${M(`${b}^y=${x}`)}, take ln of both sides. Which equation follows?`, M(`y*ln(${b})=ln(${x})`), [M(`${b}ln(y)=ln(${x})`), M(`ln(${b})+ln(y)=ln(${x})`), M(`y+ln(${b})=ln(${x})`)], `The power rule brings y down: ${M(`ln(${b}^y)=y*ln(${b})`)}.`],
        [`From ${M(`y*ln(${b})=ln(${x})`)}, solve for y.`, M(`y=ln(${x})/ln(${b})`), [M(`y=ln(${b})/ln(${x})`), M(`y=ln(${x})-ln(${b})`), M(`y=ln(${x})*ln(${b})`)], `Divide both sides by ${M(`ln(${b})`)}, which is just a number.`],
        [`Why does ${M(`log(${x})/log(${b})`)} give the same value as ${M(`ln(${x})/ln(${b})`)}?`, 'The same steps work in any base; top and bottom just use the same one.', ['log and ln give the same values.', 'It only works when the answer is a whole number.', 'Base 10 cancels the base ' + b + '.'], `Taking log of both sides of ${M(`${b}^y=${x}`)} instead of ln gives ${M(`y=log(${x})/log(${b})`)}.`],
      ][st];
      return E.choice(R, Q[0], Q[1], Q[2], Q[3]); } },
    d: { t: 'compare logs', g: R => { let items; do { items = [0, 1, 2].map(() => { const b = R.pick([2, 3, 4, 5, 6, 7, 8, 9]); let x; do x = R.int(3, 120); while (x === b); return [b, x, Math.log(x) / Math.log(b)]; }); } while (items.some((p, i) => items.some((q, j) => i < j && (Math.abs(p[2] - q[2]) < 0.08 || p[0] === q[0]))));
      const big = R.bool(), best = items.reduce((m, p) => (big ? p[2] > m[2] : p[2] < m[2]) ? p : m), o = items.map(p => M(lg(p[0], p[1])));
      return E.choice(R, `Which is ${big ? 'largest' : 'smallest'}?`, M(lg(best[0], best[1])), o.filter(s => s !== M(lg(best[0], best[1]))),
        `Using ln(x)/ln(b): ${items.map(p => `${M(lg(p[0], p[1]))} ≈ ${fx(p[2], 3)}`).join(', ')}.`); } },
  });

  /* IV.12.13 Graph logs */
  S('IV.12.13', 'Graph logs', {
    a: { t: 'inverse of exponential', g: R => { const b = R.int(2, 10);
      if (R.bool(0.7)) { const k = R.int(-2, 3), y = pv(b, k);
        return E.num(`The point (${k}, ${E.pt(y)}) is on ${M(`y=${b}^x`)}. Which point must be on ${M(`y=${lg(b, 'x')}`)}?`, [{ point: [y, String(k)] }], `The log graph is the reflection in y = x, so swap the coordinates: (${E.pt(y)}, ${k}).`); }
      return E.choice(R, `${M(`y=${lg(b, 'x')}`)} is the inverse of which function?`, M(`y=${b}^x`), [M(`y=x^${b}`), M(`y=(1/${b})^x`), M(`y=${b}x`)], `${M(`y=${lg(b, 'x')}`)} undoes ${M(`y=${b}^x`)}; their graphs mirror each other in y = x.`); } },
    b: { t: 'vertical asymptote', g: R => { const b = R.pick([2, 3, 5, 10, 'e']), kind = R.int(0, 2), k = R.int(-5, 5);
      if (kind < 2) { const h = nz(R, -7, 7), arg = kind === 0 ? `x${sgk(-h)}` : `${h}-x`;
        return E.num(`What is the vertical asymptote of ${M(`y=${lg(b, arg)}${sgk(k)}`)}? Give its equation.`, [{ eqn: `x=${h}` }], `The input ${M(arg)} hits 0 at x = ${h}; the graph gets close to that line but never reaches it.${k ? ' The vertical shift does not move it.' : ''}`); }
      const a = R.pick([2, 3, 4]), c = nz(R, -12, 12), hs = E.fracStr(-c, a);
      return E.num(`What is the vertical asymptote of ${M(`y=${lg(b, `${a}x${sgk(c)}`)}`)}? Give its equation.`, [{ eqn: `x=${hs}` }], `The asymptote is where the input is 0: ${M(`${a}x${sgk(c)}=0`)} gives x = ${E.pt(hs)}.`); } },
    c: { t: 'transformations', g: R => { const b = R.pick([2, 3, 4, 5, 10]), h = R.int(-5, 5), k = R.int(-5, 5), a = R.pick([1, 1, 2, -1, 3]), which = R.bool();
      if (!h && !k && a === 1) return E.num(`Which point on ${M(`y=${lg(b, 'x')}`)} has y = 1?`, [{ point: [String(b), '1'] }], `${M(`${lg(b, b)}=1`)}, so the point is (${b}, 1).`);
      const eq = `${a === 1 ? '' : a === -1 ? '-' : a}${lg(b, h ? `x${sgk(-h)}` : 'x')}${sgk(k)}`, P = which ? [1, 0] : [b, 1], Q = [P[0] + h, a * P[1] + k];
      return E.num(`${M(`y=${lg(b, 'x')}`)} passes (${P[0]}, ${P[1]}). Where does that point move on ${M('y=' + eq)}?`, [{ point: [String(Q[0]), String(Q[1])] }],
        `${h ? `The shift inside moves x ${h > 0 ? 'right' : 'left'} ${Math.abs(h)}: ${P[0]} → ${Q[0]}` : `x stays ${P[0]}`}. The new y is ${a === 1 ? P[1] : `${a} · ${P[1]}`}${k ? ` ${k > 0 ? '+' : '−'} ${Math.abs(k)}` : ''} = ${Q[1]}. So the point is (${Q[0]}, ${Q[1]}).`); } },
    d: { t: 'domain', g: R => { const b = R.pick([2, 3, 10, 'e', 5]), kind = R.int(0, 2);
      if (kind === 0) { const h = nz(R, -9, 9), right = R.bool(), arg = right ? `x${sgk(-h)}` : `${h}-x`, iv = right ? `(${h},inf)` : `(-inf,${h})`;
        return E.num(`What is the domain of ${M(`y=${lg(b, arg)}`)}? Use interval notation.`, [{ interval: iv }], `The input must be positive: ${M(arg + '>0')} gives ${M(right ? `x>${h}` : `x<${h}`)}.`); }
      if (kind === 1) { const a = R.pick([2, 3, 4, 5, -2, -3]), c = nz(R, -12, 12), bd = E.fracStr(-c, a), iv = a > 0 ? `(${bd},inf)` : `(-inf,${bd})`;
        return E.num(`What is the domain of ${M(`y=${lg(b, `${a}x${sgk(c)}`)}`)}? Use interval notation.`, [{ interval: iv }], `${M(`${a}x${sgk(c)}>0`)} gives ${M(`x${a > 0 ? '>' : '<'}${bd}`)}${a < 0 ? ' (dividing by a negative flips the sign)' : ''}.`); }
      const p = R.int(-6, 4), q = p + R.int(1, 8);
      return E.num(`What is the domain of ${M(`y=${lg(b, `x${sgk(-p)}`)}+${lg(b, `${q}-x`)}`)}? Use interval notation.`, [{ interval: `(${p},${q})` }], `Both inputs must be positive: ${M(`x>${p}`)} and ${M(`x<${q}`)}, so the domain is (${p}, ${q}).`); } },
    e: { t: 'find the base from the graph', g: R => { let b, e, h, k; do { b = R.pick([2, 3, 4, 5, 9, 16, 25]); e = R.pick([1, 2, 3, 0.5]); h = R.int(-5, 5); k = R.int(-3, 3); } while (b ** e > 125 || !Number.isInteger(b ** e) || (e === 0.5 && b < 9 && b !== 4) || (e !== 0.5 && b > 5));
      const dx = b ** e, x1 = h + dx, es = e === 0.5 ? '1/2' : String(e);
      if (R.bool()) { const y1 = cl(e + k);
        return E.num(`The graph of ${MV(`y=log_b(x${sgk(-h)})${sgk(k)}`)} passes (${x1}, ${y1}). Find b.`, [{ label: 'b =', ans: b }],
          `Substitute: ${MV(`log_b(${dx})${sgk(k)}=${y1}`)}, so ${MV(`log_b(${dx})=${es}`)}. That means ${M(`b^(${es})=${dx}`)}, so b = ${b}.`); }
      return E.num(`The graph of ${MV('y=log_b(x+c)')} has vertical asymptote x = ${h} and passes (${x1}, ${es}). Find b and c.`, [{ label: 'b =', ans: b }, { label: 'c =', ans: -h }],
        `The asymptote is where x + c = 0, so c = ${-h}. Then ${MV(`log_b(${dx})=${es}`)} means ${M(`b^(${es})=${dx}`)}, so b = ${b}.`); } },
    f: { t: 'one crossing, found by inspection', g: R => { let b, j, c, x0; do { b = R.pick([2, 3, 10]); j = R.int(0, 3); c = R.pick([1, 1, 2, 3]); x0 = b ** j; } while (x0 > 27 && b !== 10 || (b === 10 && j > 1));
      const m = j + c * x0, cx = `${c === 1 ? '' : c}x`, form = R.bool(), eq = form ? `${lg(b, 'x')}=${m}-${cx}` : `${lg(b, 'x')}+${cx}=${m}`;
      return E.num(`Solve ${M(eq)}.`, [{ label: 'x =', ans: x0 }],
        `${form ? 'The left side rises and the right side falls' : 'The left side keeps rising'} as x grows, so there is at most one solution. Try powers of ${b}: x = ${x0} gives ${M(`${lg(b, x0)}=${j}`)} and ${form ? `${m} − ${c * x0} = ${j}` : `${j} + ${c * x0} = ${m}`}. So x = ${x0}.`); } },
  });

  /* IV.12.14 Solve exponential equations */
  const lt = (m, p) => p ? `${m === 1 ? '' : m + '('}x${sgk(p)}${m === 1 ? '' : ')'}` : `${m === 1 ? '' : m}x`;   // m(x+p) tidy
  const powBase = (c, n) => n >= 0 ? String(c ** n) : `1/${c ** -n}`;
  S('IV.12.14', 'Solve exponential equations', {
    a: { t: 'same base when possible', g: R => { const c = R.pick([2, 3, 5, 2]);
      if (R.bool(0.6)) { let m, q, p; do { m = R.int(1, 3); q = R.int(-3, 6); p = R.int(-3, 3); } while (c ** m > 125 || c ** Math.abs(q) > 1000 || q === 0 && p === 0);
        const A = c ** m, eq = `${A}^${p ? `(x${sgk(p)})` : 'x'}=${powBase(c, q)}`, f = frac(q - m * p, m);
        return E.num(`Solve ${M(eq)}.`, [{ label: 'x =', ...f }], `Write both sides as powers of ${c}: ${M(`${c}^(${lt(m, p)})=${c}^${q < 0 ? '(' + q + ')' : q}`)}. So ${M(`${lt(m, p)}=${q}`)} and x = ${E.pt(E.fracStr(q - m * p, m))}.`); }
      let m, n, p, s; do { m = R.int(1, 3); n = R.int(1, 3); p = R.int(-3, 3); s = R.int(-3, 3); } while (m === n || c ** Math.max(m, n) > 125 || (p === 0 && s === 0));
      const ep = v => v ? `(x${sgk(v)})` : 'x', eq = `${c ** m}^${ep(p)}=${c ** n}^${ep(s)}`, f = frac(n * s - m * p, m - n);
      return E.num(`Solve ${M(eq)}.`, [{ label: 'x =', ...f }], `Write both sides as powers of ${c} and match exponents: ${M(`${lt(m, p)}=${lt(n, s)}`)}, so x = ${E.pt(E.fracStr(n * s - m * p, m - n))}.`); } },
    b: { t: 'take logs of both sides', g: R => { const b = R.pick([2, 3, 5, 6, 7, 'e', 10, 1.5]); let N; do N = R.pick([5, 6, 7, 10, 12, 15, 20, 30, 50, 75, 100, 0.4, 0.2, 3]); while (typeof b === 'number' && Math.abs(Math.log(N) / Math.log(b) % 1) < 1e-9);
      const exact = b === 'e' ? `ln(${N})` : b === 10 ? `log(${N})` : `ln(${N})/ln(${b})`, v = b === 'e' ? Math.log(N) : Math.log(N) / Math.log(b);
      if (b === 1.5 && /\./.test(String(N))) N = 5;
      const ex2 = b === 1.5 ? `ln(${N})/ln(3/2)` : exact, v2 = b === 1.5 ? Math.log(N) / Math.log(1.5) : v;
      return E.num(`Solve ${M(`${b === 1.5 ? '(3/2)' : b}^x=${N}`)}. Give the exact answer and a decimal to 3 places.`, [{ label: 'exact x =', exact: ex2 }, { label: 'x ≈', ans: v2, dp: 3 }],
        `Take ${b === 10 ? 'log' : 'ln'} of both sides: ${b === 'e' ? M(`x=ln(${N})`) : b === 10 ? M(`x=log(${N})`) : M(`x*ln(${b === 1.5 ? '3/2' : b})=ln(${N})`) + ', so ' + M('x=' + ex2)} ≈ ${fx(v2, 3)}.`); } },
    c: { t: 'isolate first', g: R => { const kind = R.int(0, 2);
      if (kind === 0) { const b = R.pick([2, 3, 4, 5]), a = R.int(2, 6), k = R.int(1, b === 2 ? 6 : 3), c = R.int(-20, 20), d = a * b ** k + c;
        return E.num(`Solve ${M(`${a}*${b}^x${sgk(c)}=${d}`)}.`, [{ label: 'x =', ans: k }], `First ${c ? (c > 0 ? 'subtract ' + c : 'add ' + -c) + ', then ' : ''}divide by ${a}: ${M(`${b}^x=${b ** k}`)}, so x = ${k}. Don't take logs of ${a}·${b}ˣ as if it were ${a * b}ˣ.`); }
      if (kind === 1) { const a = R.int(2, 6), m = R.pick([2, 3, 5, 6, 7, 10, 4]), k = R.int(1, 4), c = R.int(-10, 10), d = a * m + c;
        const exa = k === 1 ? `ln(${m})` : `ln(${m})/${k}`;
        return E.num(`Solve ${M(`${a}e^(${k === 1 ? '' : k}x)${sgk(c)}=${d}`)}. Give the exact answer.`, [{ label: 'x =', exact: exa }], `Isolate: ${M(`e^(${k === 1 ? '' : k}x)=${m}`)}. Take ln: ${M(`${k === 1 ? '' : k}x=ln(${m})`)}, so x = ${M(exa)}.`); }
      const b = R.pick([2, 3, 5, 1.05, 1.2]), a = R.pick([2, 3, 4, 5, 100]); let N; do N = R.pick([7, 10, 11, 13, 17, 20, 25, 30]); while (Math.abs(Math.log(N) / Math.log(b) % 1) < 1e-9); const v = Math.log(N) / Math.log(b);
      return E.num(`Solve ${M(`${a}(${b})^x=${a * N}`)}. Round to 3 decimal places.`, [{ label: 'x ≈', ans: v, dp: 3 }], `Divide by ${a} first: ${M(`${bx(b)}=${N}`)}. Then ${M(`x=ln(${N})/ln(${b})`)} ≈ ${fx(v, 3)}.`); } },
    d: { t: 'exact vs decimal answers', g: R => { const kind = R.int(0, 2);
      if (kind === 0) { const b = R.pick([2, 3, 5, 7]), k = R.int(2, 4); let N; do N = R.int(5, 60); while (Math.abs(Math.log(N) / Math.log(b) % 1) < 1e-9); const exa = `ln(${N})/(${k}ln(${b}))`, v = Math.log(N) / (k * Math.log(b));
        return E.num(`Solve ${M(`${b}^(${k}x)=${N}`)}. Give the exact answer and a decimal to 3 places.`, [{ label: 'exact x =', exact: exa }, { label: 'x ≈', ans: v, dp: 3 }], `Take ln: ${M(`${k}x*ln(${b})=ln(${N})`)}, so ${M('x=' + exa)} ≈ ${fx(v, 3)}.`); }
      if (kind === 1) { const k = R.int(2, 5), c = nz(R, -4, 4); let N; do N = R.int(2, 40); while (N === 1); const exa = `(ln(${N})${sgk(-c)})/${k}`, v = (Math.log(N) - c) / k;
        return E.num(`Solve ${M(`e^(${k}x${sgk(c)})=${N}`)}. Give the exact answer and a decimal to 3 places.`, [{ label: 'exact x =', exact: exa }, { label: 'x ≈', ans: v, dp: 3 }], `Take ln: ${M(`${k}x${sgk(c)}=ln(${N})`)}, so ${M('x=' + exa)} ≈ ${fx(v, 3)}.`); }
      const b = R.pick([2, 3, 4, 5]), a = R.int(2, 9); let m; do m = R.int(3, 25); while (Math.abs(Math.log(m) / Math.log(b) % 1) < 1e-9); const exa = `ln(${m})/ln(${b})`, v = Math.log(m) / Math.log(b);
      return E.num(`Solve ${M(`${a}*${b}^x=${a * m}`)}. Give the exact answer and a decimal to 3 places.`, [{ label: 'exact x =', exact: exa }, { label: 'x ≈', ans: v, dp: 3 }], `Divide by ${a}: ${M(`${b}^x=${m}`)}. So ${M('x=' + exa)} ≈ ${fx(v, 3)}. Keep the exact form until the last step.`); } },
    e: { t: 'factor out the power', g: R => { let b, p1, p2, sg, j, N;
      do { b = R.pick([2, 3, 5]); p1 = R.int(1, 3); p2 = R.pick([0, 0, -1, 1]); sg = R.pick([1, -1]); j = R.int(0, 4); N = b ** (p1 + j) + sg * b ** (p2 + j); } while (p2 >= p1 || p2 + j < 0 || N > 3000 || N <= 0);
      const ex = p => p ? `${b}^(x${sgk(p)})` : `${b}^x`, C = b ** p1 + sg * b ** p2, Cs = p2 >= 0 ? String(C) : E.fracStr(b ** (p1 + 1) + sg, b);
      return E.num(`Solve ${M(`${ex(p1)}${sg > 0 ? '+' : '-'}${ex(p2)}=${N}`)}.`, [{ label: 'x =', ans: j }],
        `Factor out ${M(`${b}^x`)}: ${M(`${b}^x(${p1 === 1 ? b : b + '^' + p1}${sg > 0 ? '+' : '-'}${p2 < 0 ? `1/${b}` : p2 === 1 ? b : 1})=${N}`)}, so ${M(`${b}^x*${Cs.includes('/') ? '(' + Cs + ')' : Cs}=${N}`)} and ${M(`${b}^x=${b ** j}`)}. So x = ${j}.`); } },
    f: { t: 'a quadratic in disguise', g: R => { const kind = R.int(0, 3), b = R.pick([2, 3]), B2 = b * b, P = (u1, u2) => E.poly([1, -(u1 + u2), u1 * u2]).replace(/x/g, 'u'), Z = q => q.replace('x^2', 'Q').replace(/(\d*)x/, (m, d) => d ? `${d}*${b}^x` : `${b}^x`).replace('Q', `${B2}^x`);
      if (kind === 0) { let j1, j2; do { j1 = R.int(0, 3); j2 = R.int(0, 3); } while (j1 >= j2 || b ** (j1 + j2) > 300); const u1 = b ** j1, u2 = b ** j2;
        return E.num(`Solve ${M(Z(E.poly([1, -(u1 + u2), u1 * u2])) + '=0')}.`, [{ label: 'x =', set: [String(j1), String(j2)] }],
          `${M(`${B2}^x=(${b}^x)^2`)}, so with u = ${M(`${b}^x`)}: ${M(P(u1, u2) + '=0')}, u = ${u1} or ${u2}. So x = ${j1} or x = ${j2}.`); }
      if (kind === 1) { const j = R.int(1, 3), u1 = b ** j, m = R.int(1, 5), s = u1 - m, c = u1 * m;
        return E.num(`Solve ${M(Z(E.poly([1, -s, -c])) + '=0')}.`, [{ label: 'x =', set: [String(j)] }],
          `With u = ${M(`${b}^x`)}: ${M(P(u1, -m) + '=0')}, so u = ${u1} or u = ${-m}. ${M(`${b}^x=${-m}`)} is impossible because powers are positive, so only x = ${j}.`); }
      if (kind === 2) { let j1, j2; do { j1 = R.int(0, 3); j2 = R.int(0, 3); } while (j1 >= j2 || b ** (j1 + j2) > 300); const u1 = b ** j1, u2 = b ** j2, K = j1 + j2;
        return E.num(`Solve ${M(`${b}^x+${b}^(${K}-x)=${u1 + u2}`)}.`, [{ label: 'x =', set: [String(j1), String(j2)] }],
          `${M(`${b}^(${K}-x)=${b ** K}/${b}^x`)}. With u = ${M(`${b}^x`)}, multiply by u: ${M(P(u1, u2) + '=0')}, so u = ${u1} or ${u2}: x = ${j1} or x = ${j2}.`); }
      let u1, u2; do { u1 = R.int(1, 6); u2 = R.pick([2, 3, 4, 5, 6, 7, -1, -2, -3]); } while (u1 === u2 || u1 + u2 === 0);
      const good = [u1, u2].filter(u => u > 0), xs = good.map(u => u === 1 ? '0' : `ln(${u})`);
      return E.num(`Solve ${M(E.poly([1, -(u1 + u2), u1 * u2]).replace('x^2', 'Q').replace(/x/, 'e^x').replace('Q', 'e^(2x)') + '=0')}. Give exact answers.`, [{ label: 'x =', set: xs }],
        `With u = ${M('e^x')}: ${M(P(u1, u2) + '=0')}, so u = ${u1} or u = ${u2}.${good.length < 2 ? ` ${M(`e^x=${Math.min(u1, u2)}`)} is impossible,` : ''} ${good.map(u => `${M(`e^x=${u}`)} gives x = ${u === 1 ? '0' : M(`ln(${u})`)}`).join(' and ')}.`); } },
  });

  /* IV.12.15 Solve log equations */
  S('IV.12.15', 'Solve log equations', {
    a: { t: 'convert to exponential', g: R => { const kind = R.int(0, 2);
      if (kind < 2) { let b, k, a, c; do { [b, k] = powPick(R, [2, 3, 4, 5, 10], 1, 4, 1e4); a = R.int(1, 4); c = R.int(-15, 15); } while ((b ** k - c) % a || b ** k === c); const x0 = (b ** k - c) / a, arg = `${a === 1 ? '' : a}x${sgk(c)}`;
        return E.num(`Solve ${M(`${lg(b, arg)}=${k}`)}.`, [{ label: 'x =', ans: x0 }], `Exponential form: ${M(`${arg}=${b}^${k}=${b ** k}`)}, so x = ${x0}.`); }
      const k = nz(R, -2, 4), c = nz(R, -6, 6), exa = `e^${k < 0 ? '(' + k + ')' : k}${sgk(-c)}`;
      return E.num(`Solve ${M(`ln(x${sgk(c)})=${k}`)}. Give the exact answer.`, [{ label: 'x =', exact: exa }], `${M(`x${sgk(c)}=e^${k < 0 ? '(' + k + ')' : k}`)}, so x = ${M(exa)}.`); } },
    b: { t: 'condense then solve', g: R => { const kind = R.int(0, 2);
      if (kind === 0) { let b, k, m; do { [b, k] = powPick(R, [2, 3, 5, 10, 4], 2, 5, 1e4); m = R.pick([2, 4, 5, 8, 3, 25, 9]); } while ((b ** k) % m || m === b ** k);
        return E.num(`Solve ${M(`${lg(b, 'x')}+${lg(b, m)}=${k}`)}.`, [{ label: 'x =', ans: b ** k / m }], `Condense: ${M(`${lg(b, m + 'x')}=${k}`)}, so ${M(`${m}x=${b ** k}`)} and x = ${b ** k / m}.`); }
      if (kind === 1) { const [b, k] = powPick(R, [2, 3, 5, 10], 1, 3, 1000), m = R.int(2, 9);
        return E.num(`Solve ${M(`${lg(b, 'x')}-${lg(b, m)}=${k}`)}.`, [{ label: 'x =', ans: m * b ** k }], `Condense: ${M(`${lg(b, `x/${m}`)}=${k}`)}, so ${M(`x/${m}=${b ** k}`)} and x = ${m * b ** k}.`); }
      const [b, h] = powPick(R, [2, 3, 5, 10, 4], 1, 3, 1000), k = 2 * h;
      return E.num(`Solve ${M(`${lg(b, 'x')}+${lg(b, 'x')}=${k}`)}.`, [{ label: 'x =', ans: b ** h }], `Condense: ${M(`${lg(b, 'x^2')}=${k}`)}, so ${M(`x^2=${b ** k}`)}. Only the positive root keeps ${M(lg(b, 'x'))} defined: x = ${b ** h}.`); } },
    c: { t: 'log = log', g: R => { const b = R.pick([2, 3, 10, 'e', 5]); let a, d, x0, v; do { a = R.int(1, 6); d = R.int(1, 6); x0 = R.int(-4, 12); v = R.int(1, 30); } while (a === d);
      const c = v - a * x0, e = v - d * x0, L = `${a === 1 ? '' : a}x${sgk(c)}`, Rr = `${d === 1 ? '' : d}x${sgk(e)}`;
      return E.num(`Solve ${M(`${lg(b, L)}=${lg(b, Rr)}`)}.`, [{ label: 'x =', ans: x0 }], `Equal logs (same base) have equal inputs: ${M(`${L}=${Rr}`)}, so x = ${x0}. Check: both inputs equal ${v} > 0.`); } },
    d: { t: 'check domain', g: R => { const opts = []; for (const [b, ks] of [[2, [3, 4, 5, 6]], [3, [2, 3, 4]], [10, [2]], [6, [2]], [5, [2, 3]]]) for (const k of ks) { const P = b ** k; for (let r = 1; r <= P; r++) if (P % r === 0 && r * r > P && r - P / r <= 30) opts.push([b, k, P, r]); }
      const [b, k, P, r] = R.pick(opts), d = r - P / r, plus = R.bool();
      if (!plus) return E.num(`Solve ${M(`${lg(b, 'x')}+${lg(b, `x-${d}`)}=${k}`)}.`, [{ label: 'x =', set: [String(r)] }],
        `${M(`x(x-${d})=${P}`)} gives ${M(`(x-${r})(x+${P / r})=0`)}, so x = ${r} or x = ${-P / r}. x = ${-P / r} makes ${M(lg(b, 'x'))} undefined, so only x = ${r} works.`);
      const s = P / r;
      return E.num(`Solve ${M(`${lg(b, 'x')}+${lg(b, `x+${d}`)}=${k}`)}.`, [{ label: 'x =', set: [String(s)] }],
        `${M(`x(x+${d})=${P}`)} gives ${M(`(x-${s})(x+${r})=0`)}, so x = ${s} or x = ${-r}. x = ${-r} makes the logs undefined, so only x = ${s} works.`); } },
    e: { t: 'logs in different bases', g: R => { let b, ms, u, Sn, Sd;
      do { b = R.pick([2, 3]); ms = R.pick([[1, 2], [1, 4], [1, 2, 4], [2, 4], [1, 3], [1, -2], [2, 3], [1, -3], [1, 2, 3]]); Sn = 0; Sd = 1; for (const m of ms) { Sn = Sn * Math.abs(m) + Math.sign(m) * Sd; Sd *= Math.abs(m); } const g = E.gcd(Math.abs(Sn), Sd); Sn /= g; Sd /= g; u = nz(R, -3, 8); }
      while (ms.some(m => b ** Math.abs(m) > 81) || u % Sd !== 0 || b ** Math.abs(u) > 5000);
      const N = Sn * u / Sd, terms = ms.map((m, i) => `${m < 0 ? '-' : i ? '+' : ''}${lg(b ** Math.abs(m), 'x')}`).join(''), S = fs(Sn, Sd);
      return E.num(`Solve ${M(`${terms}=${N}`)}.`, [{ label: 'x =', ...frac(u >= 0 ? b ** u : 1, u >= 0 ? 1 : b ** -u) }],
        `Change to base ${b}: ${M(`${lg(b ** Math.abs(ms[ms.length - 1]), 'x')}=${lg(b, 'x')}/${Math.abs(ms[ms.length - 1])}`)}, and so on. With u = ${M(lg(b, 'x'))}: ${M(`${S.includes('/') ? '(' + S + ')' : S}u=${N}`)}, so u = ${u} and x = ${M(`${b}^${u < 0 ? '(' + u + ')' : u}`)} = ${E.pt(u >= 0 ? String(b ** u) : '1/' + b ** -u)}.`); } },
    f: { t: 'a quadratic in the log', g: R => { const kind = R.int(0, 2), b = R.pick([2, 3, 10]), X = u => u >= 0 ? String(b ** u) : `1/${b ** -u}`, L = lg(b, 'x');
      const Pu = (s, p) => E.poly([1, -s, p]).replace(/x/g, 'u');
      if (kind === 0) { let u1, u2; do { u1 = R.int(-2, 4); u2 = R.int(-2, 4); } while (u1 >= u2 || b ** Math.max(Math.abs(u1), Math.abs(u2)) > 1000);
        const eq = E.poly([1, -(u1 + u2), u1 * u2]).replace('x^2', 'Q').replace(/x/g, L).replace('Q', `(${L})^2`);
        return E.num(`Solve ${M(eq + '=0')}.`, [{ label: 'x =', set: [X(u1), X(u2)] }], `With u = ${M(L)}: ${M(Pu(u1 + u2, u1 * u2) + '=0')}, so u = ${u1} or u = ${u2}, and x = ${E.pt(X(u1))} or x = ${E.pt(X(u2))}. Both are positive, so both work.`); }
      if (kind === 1) { let u1, u2; do { u1 = nz(R, -3, 3); u2 = nz(R, -3, 3); } while (u1 >= u2 || b ** Math.max(Math.abs(u1), Math.abs(u2)) > 1000); const k = u1 * u2, s = u1 + u2;
        return E.num(`Solve ${MV(`${L}${k > 0 ? '+' : '-'}${Math.abs(k) === 1 ? '' : Math.abs(k)}log_x(${b})=${s}`)}.`, [{ label: 'x =', set: [X(u1), X(u2)] }],
          `${MV(`log_x(${b})=1/${L}`)}. With u = ${M(L)}: ${M(`u${k > 0 ? '+' : '-'}${Math.abs(k)}/u=${s}`)}, so ${M(Pu(s, k) + '=0')}, u = ${u1} or u = ${u2}: x = ${E.pt(X(u1))} or x = ${E.pt(X(u2))}.`); }
      let u1, u2; do { u1 = R.int(1, 4); u2 = R.int(-3, -1); } while (u1 + u2 < 0 || u1 + u2 > 2 || b ** Math.max(u1, -u2) > 1000 || b ** (-u1 * u2) > 1e9);
      const j = u1 + u2, k = -u1 * u2, bk = b ** k <= 100000 ? String(b ** k) : `${b}^${k}`, rhs = `${bk}${j === 0 ? '' : j === 1 ? 'x' : 'x^' + j}`;
      return E.num(`Solve ${M(`x^(${L})=${rhs}`)}.`, [{ label: 'x =', set: [X(u1), X(u2)] }],
        `Take ${b === 10 ? 'log' : 'log base ' + b} of both sides; with u = ${M(L)}: ${M(`u^2=${k}${j ? (j === 1 ? '+u' : `+${j}u`) : ''}`)}, so ${M(Pu(j, -k) + '=0')}, u = ${u1} or u = ${u2}: x = ${E.pt(X(u1))} or x = ${E.pt(X(u2))}.`); } },
  });

  /* IV.12.16 Half-life & doubling time */
  const HL = [['A medical tracer', 6, 'hours'], ['Iodine-131', 8, 'days'], ['A lab isotope', 12, 'minutes'], ['Cesium-137', 30, 'years'], ['Radon-222', 4, 'days'], ['A drug', 5, 'hours']];
  S('IV.12.16', 'Half-life & doubling time', {
    a: { t: 'half-life models', g: R => { const [nm, h, u] = R.pick(HL), kind = R.int(0, 2);
      if (kind === 0) { const m = R.int(1, 5), A0 = 2 ** m * R.int(1, 30), A = A0 / 2 ** m;
        return E.num(`${nm} has a half-life of ${h} ${u}. Starting with ${A0} g, how much is left after ${h * m} ${u}?`, [{ label: 'amount =', ans: A }], `${h * m} ${u} is ${m} half-li${m > 1 ? 'ves' : 'fe'}: ${M(`${A0}(1/2)^${m}=${cl(A)}`)} g.`); }
      if (kind === 1) { const m = R.int(2, 6);
        return E.num(`${nm} has a half-life of ${h} ${u}. What fraction of it remains after ${h * m} ${u}?`, [{ label: 'fraction =', frac: [1, 2 ** m], form: 'any' }], `That is ${m} half-lives: ${M(`(1/2)^${m}=1/${2 ** m}`)}. Halving ${m} times, not subtracting ${m} halves.`); }
      const A0 = R.pick([10, 50, 80, 100, 200, 500]), t = R.pick([1, 3, 5, 7, 9, 10, 15]) * h / 2, A = A0 * 0.5 ** (t / h);
      return E.num(`${nm} has a half-life of ${h} ${u}, so ${M(`A=${A0}(1/2)^(t/${h})`)}. How much is left after ${cl(t)} ${u}? Round to 2 decimal places.`, [{ label: 'A ≈', ans: A, dp: 2 }], `t/${h} = ${cl(t / h)} half-lives: ${M(`${A0}(1/2)^${cl(t / h)}`)} ≈ ${fx(A, 2)} g.`); } },
    b: { t: 'doubling models', g: (R, O) => { const kind = R.int(0, 2);
      if (kind === 0) { const d = R.pick([15, 20, 30, 40]), m = R.int(1, 6), N0 = R.pick([10, 25, 50, 100, 300]), t = d * m;
        return E.num(`A bacteria culture doubles every ${d} minutes. It starts with ${N0} cells. How many are there after ${t} minutes?`, [{ label: 'cells =', ans: N0 * 2 ** m }], `${t} ÷ ${d} = ${m} doublings: ${M(`${N0}*2^${m}`)} = ${E.fmt(N0 * 2 ** m)}.`); }
      if (kind === 1) { const d = R.pick([6, 8, 9, 10, 12]), P = R.pick([1000, 2000, 5000, 3000]), t = R.int(1, 5) * d + R.pick([0, d / 2, 2, 3].filter(z => z < d)), A = P * 2 ** (t / d);
        return E.num(`An investment doubles every ${d} years, so ${M(`A=${P}*2^(t/${d})`)}. What is it worth after ${cl(t)} years? Round to the nearest cent.`, [{ label: 'A ≈ ' + cur(O), ans: cl(Math.round(A * 100) / 100), dp: 2 }], `${M(`${P}*2^(${cl(t)}/${d})`)} ≈ ${money(O, A)}.`); }
      const d = R.pick([2, 3, 4, 5, 25, 35]), m = R.int(2, 5), N0 = R.pick([1, 2, 3, 5]) * 1000;
      return E.num(`A city's population doubles every ${d} years. It is ${E.fmt(N0)} now. How many times bigger is it after ${d * m} years?`, [{ label: 'times bigger =', ans: 2 ** m }], `${d * m} ÷ ${d} = ${m} doublings, so it grows by ${M(`2^${m}=${2 ** m}`)} times (to ${E.fmt(N0 * 2 ** m)}).`); } },
    c: { t: 'solve for time', g: R => { const kind = R.int(0, 3), [nm, h, u] = R.pick(HL);
      if (kind === 0) { const m = R.int(1, 6), A0 = 2 ** m * R.int(1, 20);
        return E.num(`${nm} has a half-life of ${h} ${u}. How long until ${A0} g decays to ${A0 / 2 ** m} g?`, [{ label: 'time =', ans: h * m }], `${A0} → ${A0 / 2 ** m} is ${m} halvings (÷${2 ** m}), so ${m} × ${h} = ${h * m} ${u}.`); }
      if (kind === 1) { const d = R.pick([20, 30, 45, 3, 5]), m = R.int(2, 6), N0 = R.pick([40, 100, 250]);
        return E.num(`A population doubles every ${d} ${d < 10 ? 'hours' : 'minutes'}. How long until it grows from ${N0} to ${E.fmt(N0 * 2 ** m)}?`, [{ label: 'time =', ans: d * m }], `It grows by ${2 ** m} = ${M(`2^${m}`)}, so ${m} doublings: ${m} × ${d} = ${d * m} ${d < 10 ? 'hours' : 'minutes'}.`); }
      if (kind === 2) { const A0 = R.pick([100, 200, 500, 80]), p = R.pick([0.3, 0.1, 0.2, 0.4, 0.15, 0.05, 0.6]), A = cl(A0 * p), t = h * Math.log(A0 / A) / Math.log(2);
        return E.num(`${nm} has a half-life of ${h} ${u}. How long until ${A0} g decays to ${E.fmt(A)} g? Round to 1 decimal place.`, [{ label: 'time ≈', ans: t, dp: 1 }], `${M(`(1/2)^(t/${h})=${cl(A / A0)}`)}, so ${M(`t=${h}*ln(${A0}/${E.fmt(A)})/ln(2)`)} ≈ ${fx(t, 1)} ${u}.`); }
      const m = R.int(2, 5), t = h * m, A0 = 2 ** m * R.int(2, 20);
      return E.num(`A sample drops from ${A0} g to ${A0 / 2 ** m} g in ${t} ${u}. What is its half-life?`, [{ label: 'half-life =', ans: h }], `÷${2 ** m} means ${m} half-lives in ${t} ${u}, so each is ${t} ÷ ${m} = ${h} ${u}.`); } },
    d: { t: 'carbon dating', g: R => { const kind = R.int(0, 2), H = 5730;
      if (kind === 0) { const m = R.int(1, 4);
        return E.num(`Carbon-14 has a half-life of 5,730 years. A bone has ${cl(100 / 2 ** m)}% of its original carbon-14. How old is it?`, [{ label: 'age =', ans: H * m }], `${cl(100 / 2 ** m)}% = ${M(`(1/2)^${m}`)}, so ${m} half-li${m > 1 ? 'ves' : 'fe'}: ${m} × 5,730 = ${E.fmt(H * m)} years.`); }
      if (kind === 1) { const p = R.pick([90, 80, 75, 70, 65, 60, 40, 35, 30, 20, 15, 10, 5]), t = H * Math.log(p / 100) / Math.log(0.5);
        return E.num(`Carbon-14 has a half-life of 5,730 years. Wood from a site has ${p}% of its original carbon-14. Estimate its age, to the nearest year.`, [{ label: 'age ≈', ans: t, dp: 0 }], `${M(`(1/2)^(t/5730)=${cl(p / 100)}`)}, so ${M(`t=5730*ln(${cl(p / 100)})/ln(0.5)`)} ≈ ${E.fmt(Math.round(t))} years.`); }
      const t = R.pick([1000, 2000, 3000, 4500, 8000, 10000, 12000, 15000, 20000, 2500]), p = 100 * 0.5 ** (t / H);
      return E.num(`Carbon-14 has a half-life of 5,730 years. What percent of the original carbon-14 remains after ${E.fmt(t)} years? Round to 1 decimal place.`, [{ label: 'percent ≈', ans: p, dp: 1 }], `${M(`100(1/2)^(${t}/5730)`)} ≈ ${fx(p, 1)}%.`); } },
  });

  /* IV.12.17 Log scales & regression */
  S('IV.12.17', 'Log scales & regression', {
    a: { t: 'decibels and pH', g: R => { const kind = R.int(0, 3);
      if (kind === 0) { const k = R.int(1, 13), m = R.pick([1, 1, 2, 3, 5, 4.5, 7]), v = -Math.log10(m * 10 ** -k);
        return E.num(`pH is ${M('-log(H)')}, where H is the hydrogen ion concentration. Find the pH when H = ${m === 1 ? M(`10^(-${k})`) : M(`${m}*10^(-${k})`)}.${m === 1 ? '' : ' Round to 2 decimal places.'}`, [m === 1 ? { label: 'pH =', ans: k } : { label: 'pH ≈', ans: v, dp: 2 }],
          m === 1 ? `${M(`log(10^(-${k}))=-${k}`)}, so pH = ${k}.` : `${M(`-log((${m}*10^(-${k})))=${k}-log(${m})`)} ≈ ${fx(v, 2)}.`); }
      if (kind === 1) { const p1 = R.int(1, 6), p2 = p1 + R.int(1, 5);
        return E.num(`How many times more acidic is a solution of pH ${p1} than one of pH ${p2}?`, [{ label: 'times =', ans: 10 ** (p2 - p1) }], `Each pH step is a factor of 10: ${p2 - p1} steps gives ${M(`10^${p2 - p1}`)} = ${E.fmt(10 ** (p2 - p1))}.`); }
      if (kind === 2) { const k = R.int(1, 12);
        return E.num(`Sound level is ${M('L=10log(I/J)').replace('<mi>J</mi>', '<msub><mi>I</mi><mn>0</mn></msub>')} dB, where ${M('J').replace('<mi>J</mi>', '<msub><mi>I</mi><mn>0</mn></msub>')} is the threshold intensity. A sound is ${M(`10^${k}`)} times the threshold intensity. What is its level?`, [{ label: 'L =', ans: 10 * k }], `${M(`10log(10^${k})=10*${k}`)} = ${10 * k} dB.`); }
      const L1 = 10 * R.int(3, 9), L2 = L1 + 10 * R.int(1, 4);
      return E.num(`How many times more intense is a ${L2} dB sound than a ${L1} dB sound?`, [{ label: 'times =', ans: 10 ** ((L2 - L1) / 10) }], `Every 10 dB is a factor of 10 in intensity: ${L2 - L1} dB gives ${M(`10^${(L2 - L1) / 10}`)} = ${E.fmt(10 ** ((L2 - L1) / 10))}. It is not ${L2} ÷ ${L1} times as intense.`); } },
    b: { t: 'Richter scale', g: R => { const kind = R.int(0, 3);
      if (kind === 0) { const m1 = R.int(3, 6), d = R.int(1, 3);
        return E.num(`How many times greater is the ground motion (amplitude) of a magnitude ${m1 + d} earthquake than a magnitude ${m1} one?`, [{ label: 'times =', ans: 10 ** d }], `Each whole step on the Richter scale is 10 times the amplitude: ${M(`10^${d}`)} = ${E.fmt(10 ** d)}, not ${cl((m1 + d) / m1)} times.`.replace(/not (\d+\.\d{3})\d+/, 'not $1')); }
      if (kind === 1) { const m1 = cl(R.int(40, 60) / 10), d = cl(R.int(3, 25) / 10), v = 10 ** d;
        return E.num(`Compare the amplitudes of magnitude ${cl(m1 + d)} and magnitude ${m1} earthquakes. How many times greater is the first? Round to 1 decimal place.`, [{ label: 'times ≈', ans: v, dp: 1 }], `The difference is ${d}, so the ratio is ${M(`10^${d}`)} ≈ ${fx(v, 1)}.`); }
      if (kind === 2) { const d = R.pick([1, 2, 0.5, 1.5, 3]), v = 10 ** (1.5 * d);
        return E.num(`Energy grows by ${M('10^1.5')} per magnitude step. How many times more energy does an earthquake ${d} magnitude${d === 1 ? '' : 's'} bigger release? Round to 1 decimal place.`, [{ label: 'times ≈', ans: v, dp: 1 }], `${M(`10^(1.5*${d})=10^${cl(1.5 * d)}`)} ≈ ${E.fmt(+v.toFixed(1))}.`); }
      const m1 = cl(R.int(30, 65) / 10), d = R.int(1, 3);
      return E.num(`One earthquake has magnitude ${m1}. Another has ${E.fmt(10 ** d)} times its amplitude. What is the second magnitude?`, [{ label: 'magnitude =', ans: cl(m1 + d) }], `${E.fmt(10 ** d)} = ${M(`10^${d}`)}, so add ${d}: ${cl(m1 + d)}.`); } },
    c: { t: 'exponential regression', g: R => { const kind = R.int(0, 2);
      if (kind === 0) { const [a, b] = R.pick([[3, 2], [5, 2], [2, 3], [4, 3], [500, 1.2], [1000, 1.1], [64, 1.5], [800, 0.5], [625, 0.8], [1000, 0.9], [7, 2], [160, 1.5]]), xs = [0, 1, 2, 3, 4], ys = xs.map(x => cl(a * b ** x));
        return E.num(`A calculator fits ${M('y=a*b^x')} to this data exactly. What are a and b?${table(xs, ys)}`, [{ label: 'a =', ans: a }, { label: 'b =', ans: b }], `a is the value at x = 0: ${a}. Each ratio is ${E.fmt(ys[1])} ÷ ${E.fmt(ys[0])} = ${b}, so b = ${b}.`); }
      if (kind === 1) { const a = R.pick([2.4, 3.1, 12.5, 150, 48.2, 7.6]), b = R.pick([1.18, 1.35, 1.07, 0.82, 1.52, 0.91]), x = R.int(5, 12), v = a * b ** x;
        return E.num(`Exponential regression on some data gives ${M(`y=${a}(${b})^x`)}. Predict y at x = ${x}, to 1 decimal place.`, [{ label: 'y ≈', ans: v, dp: 1 }], `${M(`${a}(${b})^${x}`)} ≈ ${fx(v, 1)}.`); }
      const b = R.pick([1.18, 1.35, 1.07, 0.82, 0.75, 1.52, 0.91, 1.04, 0.96, 1.25]), a = R.pick([12.3, 250, 48, 3.7]), up = b > 1, r = cl(Math.abs(b - 1) * 100);
      return E.num(`A regression gives ${M(`y=${a}(${b})^x`)}. By what percent does y ${up ? 'grow' : 'shrink'} for each 1-unit increase in x?`, [{ label: 'percent =', ans: r }], `b = ${b} = 1 ${up ? '+' : '−'} ${cl(r / 100)}, so y ${up ? 'grows' : 'shrinks'} ${r}% per unit.`); } },
    d: { t: 'linearize with logs', g: R => { const kind = R.int(0, 3);
      if (kind === 0) { const a = R.pick([2, 3, 5, 6, 7, 10, 12]), b = R.pick([2, 3, 5, 1.5].filter(z => z !== a));
        const bs = b === 1.5 ? '3/2' : String(b);
        return E.num(`If ${M(`y=${a}(${bs})^x`)}, then ln y is a linear function of x. Give its slope and intercept exactly.`, [{ label: 'slope =', exact: `ln(${bs})` }, { label: 'intercept =', exact: `ln(${a})` }],
          `Take ln: ${M(`ln(y)=ln(${a})+x*ln(${bs})`)}. Slope ${M(`ln(${bs})`)}, intercept ${M(`ln(${a})`)}.`); }
      if (kind === 1) { const c = R.int(0, 3), m = R.pick([0.1, 0.2, 0.3, 0.05, 0.15, -0.1, -0.2]), b = 10 ** m;
        return E.num(`Data fit the line ${M(`log(y)=${c ? c + (m < 0 ? '' : '+') : ''}${m}x`)}. Write it as ${M('y=a*b^x')}: find a and b (b to 3 decimal places).`, [{ label: 'a =', ans: 10 ** c }, { label: 'b ≈', ans: b, dp: 3 }],
          `Undo the log: ${M(`y=10^${c}*(10^${m})^x`)}, so a = ${E.fmt(10 ** c)} and b = ${M(`10^${m}`)} ≈ ${fx(b, 3)}.`.replace('10^-', '10^−')); }
      if (kind === 2) { const c = R.pick([0.5, 1.2, 2, 1.6, 0.8, 2.3]), m = R.pick([0.4, 0.25, 0.1, 0.7, -0.3, 0.05]), a = Math.exp(c), b = Math.exp(m);
        return E.num(`A plot of ln y against x is the line ${M(`ln(y)=${c}${m < 0 ? '' : '+'}${m}x`)}. Find a and b in ${M('y=a*b^x')}, to 3 decimal places.`, [{ label: 'a ≈', ans: a, dp: 3 }, { label: 'b ≈', ans: b, dp: 3 }],
          `${M(`y=e^${c}*(e^(${m}))^x`)}: a = ${M(`e^${c}`)} ≈ ${fx(a, 3)}, b = ${M(`e^(${m})`)} ≈ ${fx(b, 3)}.`); }
      const o = ['ln y against x', 'y against x', 'y against ln x', 'ln y against ln x'], xs = [0, 1, 2, 3], a = R.int(2, 9), b = R.int(2, 4);
      return E.choice(R, `This data looks exponential. Which plot should come out as a straight line?${table(xs, xs.map(x => a * b ** x))}`, o[0], o.slice(1), `If ${M('y=a*b^x')} then ${M('ln(y)=ln(a)+x*ln(b)')}, a line in x. (ln y against ln x straightens power functions instead.)`); } },
  });
})(typeof window !== 'undefined' ? window : globalThis);
