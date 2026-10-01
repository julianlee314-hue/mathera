/* Era IV · Unit IV.2 Functions (IV.2.01–IV.2.15) */
(function (G) {
  const E = G.E4, V = E.V, C = E.C, M = s => E.mx(s);
  const nz = (R, lo, hi) => { let v; do v = R.int(lo, hi); while (v === 0); return v; };
  const sg = n => n < 0 ? `− ${-n}` : `+ ${n}`;                        // "+ 3" / "− 3" for text
  const pm = n => n > 0 ? '+' + n : n < 0 ? String(n) : '';            // "+3" / "-3" / "" for ASCII math
  const sh = (h, v = 'x') => h === 0 ? v : `${v}${pm(-h)}`;             // x − h
  const P = (co, v = 'x') => E.poly(co, v);
  const ev = (co, x) => co.reduce((s, c) => s * x + c, 0);
  const par = n => n < 0 ? `(${n})` : String(n);
  const pt = (x, y) => `(${x}, ${y})`;
  const lb = s => String(s).replace(/-/g, '−');                         // labels are not tidied by the core
  const fs = (n, d) => E.fracStr(n, d);
  const numF = (n, d, label) => { if (d < 0) { n = -n; d = -d; } const g = E.gcd(Math.abs(n), d) || 1; n /= g; d /= g; const o = n % d === 0 ? { ans: n / d } : { frac: [n, d], form: 'any' }; if (label) o.label = label; return o; };
  const inner = s => M(s).replace(/^<math><mrow>/, '').replace(/<\/mrow><\/math>$/, '');
  // piecewise definition: rows [[expr, condition]]
  const pw = (lhs, rows) => `<math><mrow>${inner(lhs)}<mo>=</mo><mrow><mo>{</mo><mtable columnalign="left">${rows.map(([e, c]) => `<mtr><mtd>${inner(e)}</mtd><mtd><mspace width="0.8em"/><mtext>if</mtext><mspace width="0.4em"/>${inner(c)}</mtd></mtr>`).join('')}</mtable></mrow></mrow></math>`;
  const brk = (s, ceil) => `<math><mrow><mo>${ceil ? '⌈' : '⌊'}</mo>${inner(s)}<mo>${ceil ? '⌉' : '⌋'}</mo></mrow></math>`;
  const tbl = (hx, hy, xs, ys) => `<table class="dt"><tr><th>${hx}</th>${xs.map(x => `<td>${lb(x)}</td>`).join('')}</tr><tr><th>${hy}</th>${ys.map(y => `<td>${lb(y)}</td>`).join('')}</tr></table>`;
  // substitution text for a polynomial at k: "2(3)² − 4(3) + 1"
  const sub = (co, k) => { const n = co.length - 1; let s = ''; co.forEach((c, i) => { const p = n - i; if (!c) return; const A = Math.abs(c);
    s += (c < 0 ? (s ? ' − ' : '−') : (s ? ' + ' : '')) + (p === 0 ? String(A) : (A === 1 ? '' : A) + `(${k})` + (p === 2 ? '²' : p === 3 ? '³' : '')); }); return s || '0'; };

  // piecewise-linear graphs with integer corners
  const slope = (p, q) => (q[1] - p[1]) / (q[0] - p[0]);
  const trim = pts => pts.filter((p, k) => k === 0 || k === pts.length - 1 || slope(pts[k - 1], p) !== slope(p, pts[k + 1]));
  const zig = (R, x0, x1, slopes, test) => { for (let t = 0; t < 5000; t++) { const pts = [[x0, R.int(-4, 4)]]; let ok = true;
      while (pts[pts.length - 1][0] < x1) { const [x, y] = pts[pts.length - 1], len = Math.min(R.int(1, 3), x1 - x), ny = y + R.pick(slopes) * len; if (Math.abs(ny) > 5) { ok = false; break; } pts.push([x + len, ny]); }
      if (!ok) continue; const q = trim(pts); if (!test || test(q)) return q; } throw new Error('zig failed'); };
  const at = (pts, x) => { for (let k = 0; k < pts.length - 1; k++) if (x >= pts[k][0] - 1e-9 && x <= pts[k + 1][0] + 1e-9) return pts[k][1] + slope(pts[k], pts[k + 1]) * (x - pts[k][0]); return NaN; };
  const zpic = (pts, o = {}) => V.graph({ x: [-6, 6], y: [-6, 6], w: 300, h: 300, ticks: 1, fns: [{ f: x => at(pts, x), from: pts[0][0], to: pts[pts.length - 1][0], color: C.blue }], points: o.points || [], label: o.label || 'graph of a function' });
  const labelX = (f, xs) => xs.find(x => Math.abs(f(x)) < 6.5) ?? 5;
  const two = (f, g, pts = []) => V.graph({ x: [-6, 6], y: [-8, 8], w: 300, h: 380, ticks: 1, points: pts, label: 'graphs of f and g',
    fns: [{ f, color: C.blue, label: 'f', lx: labelX(f, [5.2, -5.2, 4.2, -4.2, 3]) }, { f: g, color: C.red, label: 'g', lx: labelX(g, [-5.5, 5.5, -4.5, 4.5, -3]) }] });
  const qpic = (a, h, k, o = {}) => V.graph({ x: [-6, 6], y: [-8, 8], w: 300, h: 380, ticks: 1, fns: [{ f: x => a * (x - h) ** 2 + k, color: C.blue }, ...(o.fns || [])], hlines: o.hlines, points: o.points || [], label: o.label || 'graph of a parabola' });

  // contexts shared by IV.2.01 and IV.2.05
  const CTX = [
    { F: 'C', v: 'n', desc: 'is the total cost in dollars of n rides', inp: 'the number of rides', out: 'the total cost in dollars', a: [2, 12], b: [6, 60], say: (a, b) => `${a} rides cost $${b} in total.`, rate: b => `Each ride costs $${b}.`, iu: 'rides', ou: 'dollars', r: 'dollars per ride', ir: 'rides per dollar' },
    { F: 'H', v: 't', desc: 'is the height in centimeters of a plant t weeks after planting', inp: 'the weeks since planting', out: 'the height in centimeters', a: [1, 12], b: [14, 60], say: (a, b) => `After ${a} weeks, the plant is ${b} cm tall.`, rate: b => `The plant grows ${b} cm every week.`, iu: 'weeks', ou: 'centimeters', r: 'centimeters per week', ir: 'weeks per centimeter' },
    { F: 'D', v: 't', desc: 'is the distance in miles a car has driven after t hours', inp: 'the time in hours', out: 'the distance in miles', a: [1, 9], b: [40, 400], say: (a, b) => `After ${a} hours, the car has gone ${b} miles.`, rate: b => `The car drives ${b} miles every hour.`, iu: 'hours', ou: 'miles', r: 'miles per hour', ir: 'hours per mile' },
    { F: 'T', v: 'm', desc: 'is the oven temperature in °F m minutes after it is switched on', inp: 'the minutes since switching on', out: 'the temperature in °F', a: [2, 20], b: [100, 400], say: (a, b) => `${a} minutes after switching on, the oven is at ${b}°F.`, rate: b => `The oven heats up ${b}°F every minute.`, iu: 'minutes', ou: 'degrees Fahrenheit', r: 'degrees Fahrenheit per minute', ir: 'minutes per degree Fahrenheit' },
    { F: 'W', v: 'd', desc: 'is the water in liters in a tank after d days', inp: 'the number of days', out: 'the water in liters', a: [1, 30], b: [40, 900], say: (a, b) => `After ${a} days, the tank holds ${b} liters.`, rate: b => `The tank gains ${b} liters every day.`, iu: 'days', ou: 'liters', r: 'liters per day', ir: 'days per liter' },
    { F: 'S', v: 'h', desc: 'is the pay in dollars for h hours of work', inp: 'the hours worked', out: 'the pay in dollars', a: [2, 40], b: [30, 900], say: (a, b) => `Working ${a} hours pays $${b}.`, rate: b => `The pay is $${b} for each hour.`, iu: 'hours', ou: 'dollars', r: 'dollars per hour', ir: 'hours per dollar' },
    { F: 'N', v: 'y', desc: 'is the population of a town, in thousands, y years after 2000', inp: 'the years since 2000', out: 'the population in thousands', a: [1, 25], b: [30, 90], say: (a, b) => `In ${2000 + a}, the town has ${b} thousand people.`, rate: b => `The town grows by ${b} thousand people each year.`, iu: 'years', ou: 'thousands of people', r: 'thousands of people per year', ir: 'years per thousand people' },
  ];
  const ctxAB = (R, c) => { const a = R.int(...c.a); let b; do b = R.int(...c.b); while (b === a); return [a, b]; };
  const fac = (a, r, s) => { if (s === 0) [r, s] = [s, r]; return `${a === 1 ? '' : a === -1 ? '-' : a}${E.lin(r)}${E.lin(s)}`; };
  const S = (id, name, steps) => E.skill({ id, name, steps });

  /* IV.2.01 Function notation */
  S('IV.2.01', 'Function notation', {
    a: { t: 'read f(x) aloud and in meaning', g: R => { const F = R.pick(['f', 'g', 'h', 'P', 'C']);
      if (R.bool(0.25)) { const v = R.pick(['x', 't', 'n']);
        return E.choice(R, `How do you read ${M(`${F}(${v})`)}?`, `"${F} of ${v}"`, [`"${F} times ${v}"`, `"${F} plus ${v}"`, `"${F} divided by ${v}"`], `${M(`${F}(${v})`)} is read "${F} of ${v}": the output of ${F} when the input is ${v}. It is not a product.`); }
      const k = R.int(-6, 9); let m; do m = R.int(-9, 20); while (m === k);
      return E.choice(R, `What does ${M(`${F}(${k})=${m}`)} mean?`, `When the input is ${k}, the output of ${F} is ${m}.`, [`When the input is ${m}, the output of ${F} is ${k}.`, `${F} times ${k} equals ${m}.`, `${F} equals ${m} for every input.`],
        `The number in the parentheses is the input and the right side is the output: input ${k} gives output ${m}.`); } },
    b: { t: 'f(3) vs f(x) = 3', g: R => { let a, b, x0, k; do { a = R.pick([2, 3, -2, 4, 5, -3]); b = nz(R, -9, 9); x0 = R.int(-5, 6); k = a * x0 + b; } while (k === x0 || Math.abs(k) > 15);
      const fk = a * k + b;
      return E.num(`Let ${M('f(x)=' + P([a, b]))}. Find ${M(`f(${k})`)}, then solve ${M(`f(x)=${k}`)}.`, [{ label: lb(`f(${k}) =`), ans: fk }, { label: 'x =', ans: x0 }],
        `f(${k}) uses ${k} as the input: ${a}·${par(k)} ${sg(b)} = ${fk}. f(x) = ${k} asks for the input that gives ${k}: ${E.pt(P([a, b]))} = ${k}, so x = ${x0}.`); } },
    c: { t: 'notation in context', g: R => { const c = R.pick(CTX), [a, b] = ctxAB(R, c);
      return E.choice(R, `${M(`${c.F}(${c.v})`)} ${c.desc}. Write this in function notation: ${c.say(a, b)}`, M(`${c.F}(${a})=${b}`), [M(`${c.F}(${b})=${a}`), M(`${a}${c.F}=${b}`), M(`${c.v}(${a})=${b}`)],
        `The input (${a}) goes inside ${c.F}( ) and the output (${b}) goes on the right: ${c.F}(${a}) = ${b}.`); } },
    d: { t: 'write a function from words', g: R => { const a = R.int(2, 9), b = R.int(2, 25), kind = R.int(0, 5);
      const K = [
        () => [`A taxi charges $${b} plus $${a} per mile. Write ${M('C(m)')}, the cost of an m-mile ride.`, P([a, b], 'm'), `$${a} for each of the m miles plus the fixed $${b}: C(m) = ${E.pt(P([a, b], 'm'))}.`, 'C(m) ='],
        () => [`A gym charges a $${b * 5} joining fee plus $${a * 5} per month. Write ${M('G(n)')}, the total cost for n months.`, P([a * 5, b * 5], 'n'), `G(n) = ${E.pt(P([a * 5, b * 5], 'n'))}: the monthly fee times n, plus the one-time fee.`, 'G(n) ='],
        () => { const r = a, T = r * R.int(10, 40); return [`A tank holds ${T} liters and drains ${r} liters per minute. Write ${M('W(t)')}, the water left after t minutes.`, P([-r, T], 't'), `It starts at ${T} and loses ${r} each minute: W(t) = ${E.pt(P([-r, T], 't'))}.`, 'W(t) =']; },
        () => [`The function f multiplies a number by ${a}, then subtracts ${b}. Write ${M('f(x)')}.`, P([a, -b]), `Multiply first, then subtract: f(x) = ${E.pt(P([a, -b]))}.`, 'f(x) ='],
        () => [`The function g adds ${b} to a number, then multiplies the result by ${a}. Write ${M('g(x)')}.`, `${a}(x+${b})`, `Add first, then multiply the whole sum: g(x) = ${a}(x + ${b}) = ${E.pt(P([a, a * b]))}.`, 'g(x) ='],
        () => [`A rectangle is ${b} cm longer than it is wide. Write ${M('A(w)')}, its area when the width is w cm.`, `w(w+${b})`, `The length is w + ${b}, so A(w) = w(w + ${b}) = ${E.pt(P([1, b, 0], 'w'))}.`, 'A(w) ='],
      ];
      const [q, ans, why, label] = K[kind]();
      return E.num(q, [{ label, expr: ans }], why); } },
    e: { t: 'work back to f(x)', g: R => { const m = nz(R, -5, 5), n = nz(R, -9, 9);
      if (R.bool()) { const c = nz(R, -4, 4), res = P([m, n - m * c]);
        return E.num(`A function satisfies ${M(`f(${sh(-c)})=${P([m, n])}`)} for every x. Find ${M('f(x)')}.`, [{ label: 'f(x) =', expr: res, form: 'expanded' }],
          `Let u = x ${sg(c)}, so x = u ${sg(-c)}. Then f(u) = ${m}(u ${sg(-c)}) ${sg(n)} = ${E.pt(P([m, n - m * c], 'u'))}, so f(x) = ${E.pt(res)}.`); }
      const k = R.pick([2, 3, 4, -2, -3]);
      return E.num(`A function satisfies ${M(`f(${k}x)=${P([k * m, n])}`)} for every x. Find ${M('f(x)')}.`, [{ label: 'f(x) =', expr: P([m, n]), form: 'expanded' }],
        `Let u = ${k}x, so x = u/${par(k)}. Then f(u) = ${k * m}·(u/${par(k)}) ${sg(n)} = ${E.pt(P([m, n], 'u'))}, so f(x) = ${E.pt(P([m, n]))}.`); } },
    f: { t: 'two equations in f', g: R => { let a, c, k, j, m, n, pk, pj, top, kind;
      do { kind = R.int(0, 1); a = R.pick([2, 2, 3, -2, -3]); c = R.int(1, 6); k = R.int(-3, 5); j = kind ? -k : c - k; m = nz(R, -5, 5); n = R.int(-6, 6); pk = m * k + n; pj = m * j + n; top = pk - a * pj; }
      while (j === k || top % (1 - a * a) !== 0);
      const ans = top / (1 - a * a), A = Math.abs(a), op = a > 0 ? '+' : '-', opT = a > 0 ? '+' : '−';
      const lhs = `f(x)${op}${A}f(${kind ? '-x' : c + '-x'})`;
      return E.num(`For every x, ${M(`${lhs}=${P([m, n])}`)}. Find ${M(`f(${k})`)}.`, [{ label: lb(`f(${k}) =`), ans }],
        `Put x = ${k}: f(${k}) ${opT} ${A}f(${j}) = ${pk}. Put x = ${j}: f(${j}) ${opT} ${A}f(${k}) = ${pj}. Take the first minus ${par(a)} times the second: ${1 - a * a}f(${k}) = ${top}, so f(${k}) = ${ans}.`); } },
  });

  /* IV.2.02 Evaluate functions */
  S('IV.2.02', 'Evaluate functions', {
    a: { t: 'plug in numbers', g: R => { const kind = R.int(0, 2), k = R.int(0, 6);
      const co = kind === 0 ? [nz(R, -6, 9), R.int(-9, 9)] : kind === 1 ? [1, R.int(-6, 6), R.int(-9, 9)] : [R.pick([2, 3, -1, -2]), 0, R.int(-9, 9)];
      const F = R.pick(['f', 'g', 'h']), val = ev(co, k);
      return E.num(`If ${M(`${F}(x)=` + P(co))}, find ${M(`${F}(${k})`)}.`, [{ label: `${F}(${k}) =`, ans: val }], `Replace x with ${k}: ${F}(${k}) = ${sub(co, k)} = ${val}.`); } },
    b: { t: 'plug in negatives and fractions', g: R => { const F = R.pick(['f', 'g', 'h']);
      if (R.bool(0.55)) { const co = [R.pick([1, 1, -1, 2]), R.int(-6, 6), R.int(-9, 9)], k = -R.int(1, 5), val = ev(co, k);
        return E.num(`If ${M(`${F}(x)=` + P(co))}, find ${M(`${F}(${k})`)}.`, [{ label: lb(`${F}(${k}) =`), ans: val }], `Put ${k} in parentheses: ${F}(${k}) = ${sub(co, k)} = ${val}. Note (${k})² = ${k * k}, not ${-k * k}.`); }
      const d = R.pick([2, 3, 4, 5]); let n; do n = nz(R, -7, 7); while (E.gcd(Math.abs(n), d) !== 1); const m = nz(R, -6, 6), b = R.int(-5, 5);
      const num = m * n + b * d; const x = fs(n, d);
      return E.num(`If ${M(`${F}(x)=` + P([m, b]))}, find ${M(`${F}(${x})`)}. Give a fraction or whole number.`, [numF(num, d)], `${F}(${E.pt(x)}) = ${m}·(${E.pt(x)})${b ? ` ${sg(b)} = ${fs(m * n, d)} ${sg(b)}` : ''} = ${fs(num, d)}.`); } },
    c: { t: 'plug in expressions like f(a + 1)', g: R => { const A = R.pick([1, 1, 2, -1, 0]), b = R.int(-5, 5), c = R.int(-6, 6), v = R.pick(['a', 't', 'h']);
      const co = A ? [A, b, c] : [nz(R, -5, 5), c]; const p = R.pick([1, 1, 1, 2, 3]), q = p === 1 ? nz(R, -4, 4) : R.int(-2, 2);
      const arg = P([p, q], v); const res = A ? [A * p * p, 2 * A * p * q + b * p, A * q * q + b * q + c] : [co[0] * p, co[0] * q + c];
      const argP = /[+-]/.test(arg.slice(1)) || p !== 1 ? `(${arg})` : arg;
      return E.num(`If ${M('f(x)=' + P(co))}, find ${M(`f(${arg})`)}. Expand and simplify.`, [{ label: `f(${E.pt(arg)}) =`, expr: P(res, v), form: 'expanded' }],
        `Replace every x with ${argP.replace(/-/g, '−')}: ${A ? `${A === 1 ? '' : A === -1 ? '−' : A}${E.pt(argP)}²${b ? ' ' + sg(b) + E.pt(argP) : ''}${c ? ' ' + sg(c) : ''}` : `${co[0]}${E.pt(argP)}${c ? ' ' + sg(c) : ''}`} = ${E.pt(P(res, v))}.`); } },
    d: { t: 'evaluate from a graph or table', g: R => {
      if (R.bool()) { const pts = zig(R, -6, 6, [-2, -1, 0, 1, 2]); const k = R.int(-5, 5), v = at(pts, k);
        return E.num(`The graph shows ${M('y=f(x)')}. What is ${M(`f(${k})`)}?`, [{ label: lb(`f(${k}) =`), ans: v }], `Go to x = ${k} and read the height of the graph: f(${k}) = ${v}.`, { visual: zpic(pts) }); }
      const x0 = R.int(-3, 1), xs = [0, 1, 2, 3, 4].map(i => x0 + i); let ys, k, kind;
      do { ys = xs.map(() => R.int(-6, 9)); k = R.pick(xs); kind = R.int(0, 1); } while (kind === 1 && !xs.includes(ys[xs.indexOf(k)]));
      const fk = ys[xs.indexOf(k)];
      if (kind === 1) { const ffk = ys[xs.indexOf(fk)];
        return E.num(`Use the table to find ${M(`f(f(${k}))`)}.${tbl('x', 'f(x)', xs, ys)}`, [{ ans: ffk }], `Inside first: f(${k}) = ${fk}. Then f(${fk}) = ${ffk}.`); }
      let j; do j = R.pick(xs); while (j === k);
      const fj = ys[xs.indexOf(j)];
      return E.num(`Use the table to find ${M(`f(${k})+f(${j})`)}.${tbl('x', 'f(x)', xs, ys)}`, [{ ans: fk + fj }], `f(${k}) = ${fk} and f(${j}) = ${fj}, so the sum is ${fk + fj}.`); } },
    e: { t: 'find the missing coefficient first', g: R => { let p, r, c, A, k, q, co, lead;
      do { lead = R.bool(); p = nz(R, -3, 3); do r = R.int(-3, 4); while (r === p); c = nz(R, -9, 9); A = lead ? nz(R, -3, 3) : R.pick([1, 2, -1, 3]); k = nz(R, -6, 6);
        co = lead ? [A, k, c] : [A, k, c]; q = ev(co, p); } while (Math.abs(q) > 60);
      const val = ev(co, r), kv = lead ? A : k, lin = x => x === 1 ? '' : x === -1 ? '-' : x;
      const def = lead ? `kx^2${k ? (k > 0 ? '+' : '-') + lin(Math.abs(k)) + 'x' : ''}${pm(c)}` : `${lin(A)}x^2+kx${pm(c)}`;
      const step = lead ? `${p * p === 1 ? '' : p * p}k ${sg(k * p)} ${sg(c)} = ${q}` : `${A * p * p} ${p > 0 ? '+' : '−'} ${Math.abs(p) === 1 ? '' : Math.abs(p)}k ${sg(c)} = ${q}`;
      return E.num(`${M('f(x)=' + def)} and ${M(`f(${p})=${q}`)}. Find ${M(`f(${r})`)}.`, [{ label: lb(`f(${r}) =`), ans: val }],
        `Use the known value: ${step}, so k = ${kv}. Then f(${r}) = ${sub(co, r)} = ${val}.`); } },
    f: { t: 'build it up step by step', g: R => { const kind = R.int(0, 2);
      if (kind === 0) { const a = R.pick([1, 2, 3, -1, -2]), b = R.int(-4, 4), c = R.int(-5, 9), N = R.int(6, 12), val = c + a * N * (N - 1) / 2 + b * N;
        return E.num(`A function has ${M(`f(0)=${c}`)} and ${M(`f(n+1)=f(n)${P([a, b], 'n')[0] === '-' ? '' : '+'}${P([a, b], 'n')}`)} for every whole number n. Find ${M(`f(${N})`)}.`, [{ label: `f(${N}) =`, ans: val }],
          `Add up the ${N} steps: f(${N}) = f(0) + ${a === 1 ? '' : par(a) + '·'}(0 + 1 + … + ${N - 1})${b ? ` ${sg(b)}·${N}` : ''} = ${c} ${sg(a * N * (N - 1) / 2)}${b ? ' ' + sg(b * N) : ''} = ${val}.`); }
      if (kind === 1) { const k = R.pick([1, 2, -1, 2, 4]), m = nz(R, -3, 5), N = R.int(4, 10), val = m * N + k * N * (N - 1) / 2;
        return E.num(`For all x and y, ${M(`f(x+y)=f(x)+f(y)+${k === 1 ? '' : k === -1 ? '-' : k}xy`.replace('+-', '-'))}, and ${M(`f(1)=${m}`)}. Find ${M(`f(${N})`)}.`, [{ label: `f(${N}) =`, ans: val }],
          `Put y = 1: f(x + 1) = f(x) ${sg(m)} ${k > 0 ? '+' : '−'} ${Math.abs(k) === 1 ? '' : Math.abs(k)}x. So f(${N}) = ${m}·${N} + ${par(k)}·(1 + 2 + … + ${N - 1}) = ${m * N} ${sg(k * N * (N - 1) / 2)} = ${val}.`); }
      const b = R.pick([2, 3, 4, 5]), N = R.pick([2, 3, 4, -1, -2, 0]), val = b ** Math.abs(N);
      if (b ** Math.abs(N) > 700) return E.num(`For all x and y, ${M('f(x+y)=f(x)f(y)')}, and ${M(`f(1)=${b}`)}. Find ${M('f(2)')}.`, [{ label: 'f(2) =', ans: b * b }], `f(2) = f(1 + 1) = f(1)·f(1) = ${b * b}.`);
      const field = N < 0 ? numF(1, val, lb(`f(${N}) =`)) : { label: lb(`f(${N}) =`), ans: N === 0 ? 1 : val };
      const why = N === 0 ? `f(1) = f(1 + 0) = f(1)·f(0), so ${b} = ${b}·f(0) and f(0) = 1.` : N > 0 ? `f(${N}) = f(1)·f(1)${N > 2 ? '·f(1)' : ''}${N > 3 ? '·f(1)' : ''} = ${E.pt(b + '^' + N)} = ${val}.` : `First f(0) = 1 (from f(1) = f(1)·f(0)). Then f(${N})·f(${-N}) = f(0) = 1 and f(${-N}) = ${val}, so f(${N}) = 1/${val}.`;
      return E.num(`For all x and y, ${M('f(x+y)=f(x)f(y)')}, and ${M(`f(1)=${b}`)}. Find ${M(`f(${N})`)}.`, [field], why); } },
  });

  /* IV.2.03 Domain & range */
  S('IV.2.03', 'Domain & range', {
    a: { t: 'from a list of pairs', g: R => { const n = R.int(4, 5), xs = R.sample([-4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6], n).sort((p, q) => p - q), ys = xs.map(() => R.int(-5, 8));
      if (R.bool(0.6)) ys[R.int(1, n - 1)] = ys[0];
      const rng = [...new Set(ys)].sort((p, q) => p - q);
      return E.num(`A function is given by the pairs ${xs.map((x, i) => pt(x, ys[i])).join(', ')}. List its domain and its range.`, [{ label: 'domain', set: xs.map(String) }, { label: 'range', set: rng.map(String) }],
        `Domain = the first coordinates {${xs.map(lb).join(', ')}}. Range = the second coordinates, each listed once: {${rng.map(lb).join(', ')}}.`); } },
    b: { t: 'from a graph', g: R => { const x0 = R.int(-6, -2), x1 = R.int(1, 6), pts = zig(R, x0, x1, [-2, -1, 1, 2], q => q.length >= 3);
      const oL = R.bool(0.3), oR = R.bool(0.3), last = pts.length - 1, ys = pts.map(p => p[1]), lo = Math.min(...ys), hi = Math.max(...ys);
      const closedAt = v => pts.some((p, k) => p[1] === v && !((k === 0 && oL) || (k === last && oR)));
      const dom = `${oL ? '(' : '['}${x0},${x1}${oR ? ')' : ']'}`, ran = `${closedAt(lo) ? '[' : '('}${lo},${hi}${closedAt(hi) ? ']' : ')'}`;
      const vis = zpic(pts, { points: [[x0, pts[0][1], '', oL], [x1, pts[last][1], '', oR]] });
      return E.num(`Find the domain and range of the function graphed. An open dot is not included. Use interval notation or inequalities.`, [{ label: 'domain', interval: dom }, { label: 'range', interval: ran }],
        `The graph runs from x = ${x0} to x = ${x1}, so the domain is ${E.pt(dom)}. Its lowest height is ${lo} and highest is ${hi}, so the range is ${E.pt(ran)}.`, { visual: vis }); } },
    c: { t: 'from an equation (no ÷ 0, no √ negative)', g: R => { const kind = R.int(0, 6), a = nz(R, -6, 6), b = R.int(-6, 6);
      if (kind <= 3) { let f, ex, why;
        if (kind === 0) { f = `${R.int(1, 9)}/(${sh(a)})`; ex = [a]; why = `The denominator ${E.pt(sh(a))} is 0 when x = ${a}.`; }
        else if (kind === 1) { let c; do c = nz(R, -6, 6); while (c === a); f = `(${sh(0)}${pm(b)})/((${sh(a)})(${sh(c)}))`; ex = [a, c]; why = `The denominator is 0 when x = ${a} or x = ${c}.`; }
        else if (kind === 2) { const k = R.int(1, 7); f = `x/(x^2-${k * k})`; ex = [k, -k]; why = `x² − ${k * k} = 0 when x = ±${k}.`; }
        else { let n; do n = nz(R, -9, 9); while (n % 2 === 0); f = `${R.int(1, 9)}/(2x${pm(-n)})`; ex = [fs(n, 2)]; why = `2x ${sg(-n)} = 0 when x = ${fs(n, 2).replace('-', '−')}.`; }
        return E.num(`Which x-values are not in the domain of ${M('f(x)=' + f)}?`, [{ label: 'x =', set: ex.map(String) }], `You can't divide by 0. ${why}`); }
      let f, iv, why; const A = Math.abs(a);
      if (kind === 4) { f = `sqrt(${sh(a)})`; iv = `[${a},inf)`; why = `Need ${E.pt(sh(a))} ≥ 0, so x ≥ ${a}.`; }
      else if (kind === 5) { f = `sqrt(${A}-x)`; iv = `(-inf,${A}]`; why = `Need ${A} − x ≥ 0, so x ≤ ${A}.`; }
      else { f = `1/sqrt(${sh(a)})`; iv = `(${a},inf)`; why = `Need ${E.pt(sh(a))} > 0: the root can't be of a negative, and the denominator can't be 0. So x > ${a}.`; }
      return E.num(`What is the domain of ${M('f(x)=' + f)}? Answer as an inequality or interval.`, [{ label: 'domain', interval: iv }], why); } },
    d: { t: 'in interval notation', g: R => { const kind = R.int(0, 7), h = R.int(-5, 5), k = R.int(-6, 6); let f, what, iv, why;
      if (kind === 0) { f = `(${sh(h)})^2${pm(k)}`.replace('(x)^2', 'x^2'); what = 'range'; iv = `[${k},inf)`; why = `A square is never negative, so the lowest output is ${k}.`; }
      else if (kind === 1) { f = `-(${sh(h)})^2${pm(k)}`.replace('(x)^2', 'x^2'); what = 'range'; iv = `(-inf,${k}]`; why = `−(…)² is never positive, so the highest output is ${k}.`; }
      else if (kind === 2) { f = `abs(${sh(h)})${pm(k)}`; what = 'range'; iv = `[${k},inf)`; why = `|…| ≥ 0, so the outputs start at ${k} and go up.`; }
      else if (kind === 3) { f = `sqrt(${sh(h)})${pm(k)}`; what = 'range'; iv = `[${k},inf)`; why = `A square root is never negative, so outputs are ${k} or more.`; }
      else if (kind === 4) { f = `sqrt(${sh(h)})${pm(k)}`; what = 'domain'; iv = `[${h},inf)`; why = h ? `Need ${E.pt(sh(h))} ≥ 0, so x ≥ ${h}.` : 'Need x ≥ 0.'; }
      else if (kind === 5) { const a = nz(R, -6, 6); f = `1/(${sh(a)})`; what = 'domain'; iv = `(-inf,${a})U(${a},inf)`; why = `Every x works except ${a}, where the denominator is 0.`; }
      else if (kind === 6) { f = `1/x${pm(k)}`; what = 'range'; iv = `(-inf,${k})U(${k},inf)`; why = `1/x is never 0, so f(x) never equals ${k}; every other output happens.`; }
      else { f = `-sqrt(${sh(h)})${pm(k)}`; what = 'range'; iv = `(-inf,${k}]`; why = `−√(…) is never positive, so the outputs are ${k} or less.`; }
      return E.num(`Write the ${what} of ${M('f(x)=' + f)} in interval notation.`, [{ label: what, interval: iv }], `${why} ${what[0].toUpperCase() + what.slice(1)}: ${E.pt(iv)}.`); } },
    e: { t: 'two rules at once', g: R => { const kind = R.int(0, 3); let f, iv, why;
      if (kind === 0) { const B = R.int(-6, 3), A = B + R.int(1, 8); f = `sqrt(${A}-x)+sqrt(${sh(B)})`; iv = `[${B},${A}]`; why = `Both roots need a number ≥ 0: x ≤ ${A} and x ≥ ${B}. Both hold for ${E.pt(iv)}.`; }
      else if (kind === 1) { const a = R.int(-5, 4), where = R.int(0, 2), b = where === 0 ? a + R.int(1, 5) : where === 1 ? a : a - R.int(1, 4); f = `sqrt(${sh(a)})/(${sh(b)})`;
        iv = where === 0 ? `[${a},${b})U(${b},inf)` : where === 1 ? `(${a},inf)` : `[${a},inf)`;
        why = `The root needs x ≥ ${a}, and the denominator is 0 at x = ${b}. ${where === 0 ? `Remove ${b}: ${E.pt(iv)}.` : where === 1 ? `That removes the endpoint itself: ${E.pt(iv)}.` : `But ${b} is already outside x ≥ ${a}, so nothing more is removed: ${E.pt(iv)}.`}`; }
      else if (kind === 2) { const a = R.int(-5, 4), c = R.int(1, 3), bad = a + c * c; f = `1/(sqrt(${sh(a)})-${c})`; iv = `[${a},${bad})U(${bad},inf)`; why = `The root needs x ≥ ${a}. The denominator is 0 when √(${E.pt(sh(a))}) = ${c}, that is x = ${bad}. So the domain is ${E.pt(iv)}.`; }
      else { const k = R.int(1, 8); f = `sqrt(${k * k}-x^2)`; iv = `[${-k},${k}]`; why = `Need ${k * k} − x² ≥ 0, so x² ≤ ${k * k}, which means −${k} ≤ x ≤ ${k}.`; }
      return E.num(`What is the domain of ${M('f(x)=' + f)}? Answer in interval notation.`, [{ label: 'domain', interval: iv }], why); } },
    f: { t: 'range needs an idea', g: R => { const kind = R.int(0, 3); let f, iv, why, dom = '';
      if (kind === 0) { let a, b, c; do { a = nz(R, -5, 5); b = R.int(-9, 9); c = nz(R, -5, 5); } while (a * c + b === 0); f = `(${P([a, b])})/(${sh(c)})`; iv = `(-inf,${a})U(${a},inf)`;
        why = `Solve y = f(x) for x: y(x ${sg(-c)}) = ${E.pt(P([a, b]))} gives x = (${E.pt(P([c, b], 'y'))})/(y ${sg(-a)}). Every y works except y = ${a}.`; }
      else if (kind === 1) { const a = R.int(-6, 3), b = a + R.int(1, 7); f = `abs(${sh(a)})+abs(${sh(b)})`; iv = `[${b - a},inf)`; why = `It is the distance from x to ${a} plus the distance to ${b}. That is at least ${b - a} (reached for x between them) and can be as large as you like.`; }
      else if (kind === 2) { const k = R.int(1, 7), pos = R.bool(0.6); f = `x+${k * k}/x`; dom = pos ? ` for ${M('x>0')}` : ''; iv = pos ? `[${2 * k},inf)` : `(-inf,${-2 * k}]U[${2 * k},inf)`;
        why = `For x > 0, x + ${k * k}/x − ${2 * k} = (x − ${k})²/x ≥ 0, so f(x) ≥ ${2 * k}, with equality at x = ${k}.${pos ? '' : ` f is odd, so negative x give f(x) ≤ −${2 * k}.`}`; }
      else { const k = R.int(1, 9), c = R.int(1, 3); f = `${c}/(x^2+${k})`; iv = `(0,${fs(c, k)}]`; why = `x² + ${k} is at least ${k} (at x = 0) and grows without bound, so ${c}/(x² + ${k}) goes from ${E.pt(fs(c, k))} down toward 0, never reaching it.`; }
      return E.num(`What is the range of ${M('f(x)=' + f)}${dom}? Answer in interval notation.`, [{ label: 'range', interval: iv }], why); } },
  });

  /* IV.2.04 Reading function graphs */
  S('IV.2.04', 'Reading function graphs', {
    a: { t: 'find f(a) on a graph', g: R => { const k = R.int(-5, 5);
      if (R.bool()) { const pts = zig(R, -6, 6, [-2, -1, 0, 1, 2]), v = at(pts, k);
        return E.num(`The graph shows ${M('y=f(x)')}. Find ${M(`f(${k})`)}.`, [{ label: lb(`f(${k}) =`), ans: v }], `Above x = ${k} the graph is at height ${v}, so f(${k}) = ${v}.`, { visual: zpic(pts) }); }
      let a, h, c, v; do { a = R.pick([1, -1]); h = R.int(-3, 3); c = R.int(-5, 5); v = a * (k - h) ** 2 + c; } while (Math.abs(v) > 7 || Math.abs(c + a * 9) > 12 && false);
      return E.num(`The graph shows ${M('y=f(x)')}. Find ${M(`f(${k})`)}.`, [{ label: lb(`f(${k}) =`), ans: v }], `Go up or down from x = ${k} to the curve: its height is ${v}, so f(${k}) = ${v}.`, { visual: qpic(a, h, c, { label: 'graph of a function' }) }); } },
    b: { t: 'solve f(x) = k on a graph', g: R => { const a = R.pick([1, -1]), h = R.int(-3, 3), kind = R.pick([0, 0, 0, 1, 2]); let c, d, kv;
      do { c = R.int(-5, 5); d = R.int(1, 3); kv = kind === 0 ? c + a * d * d : kind === 1 ? c : c - a * R.int(1, 3); } while (Math.abs(kv) > 7); const sol = kind === 0 ? [String(h - d), String(h + d)] : kind === 1 ? [String(h)] : [];
      return E.num(`The graph shows ${M('y=f(x)')}. Solve ${M(`f(x)=${kv}`)}. Type "no solution" if there is none.`, [{ label: 'x =', set: sol }],
        kind === 0 ? `Find height ${kv} on the graph: the curve is there at x = ${h - d} and x = ${h + d}.` : kind === 1 ? `Height ${kv} is only reached at the turning point, x = ${h}.` : `The graph never reaches height ${kv}, so there is no solution.`,
        { visual: qpic(a, h, c, { hlines: [{ y: kv }], label: 'graph of a function' }) }); } },
    c: { t: 'where f(x) > g(x)', g: R => { const a = R.pick([1, -1]), m = R.pick([-1, 0, 1]), n = R.int(-2, 2); let r, s; do { r = R.int(-4, 2); s = r + R.int(2, 5); } while (s > 4 || Math.abs(m * r + n) > 6 || Math.abs(m * s + n) > 6);
      const g = x => m * x + n, f = x => g(x) + a * (x - r) * (x - s), op = R.pick(['>', '<']);
      const inside = (op === '>') === (a < 0), iv = inside ? `(${r},${s})` : `(-inf,${r})U(${s},inf)`;
      return E.num(`Use the graphs to solve ${M('f(x)' + op + 'g(x)')}. Answer in interval notation.`, [{ interval: iv }],
        `The curves cross at x = ${r} and x = ${s}. f is ${op === '>' ? 'above' : 'below'} g ${inside ? 'between them' : 'outside them'}: ${E.pt(iv)}.`, { visual: two(f, g, [[r, g(r)], [s, g(s)]]) }); } },
    d: { t: 'read intersections', g: R => { const a = R.pick([1, -1]), m = R.pick([-2, -1, 0, 1, 2]), n = R.int(-3, 3); let r, s; do { r = R.int(-4, 2); s = r + R.int(1, 5); } while (s > 4 || Math.abs(m * r + n) > 7 || Math.abs(m * s + n) > 7);
      const g = x => m * x + n, f = x => g(x) + a * (x - r) * (x - s);
      return E.num(`Where do the graphs of f and g intersect? Give both points, left one first.`, [{ label: 'left point', point: [String(r), String(g(r))] }, { label: 'right point', point: [String(s), String(g(s))] }],
        `The graphs meet where f(x) = g(x): at ${pt(r, g(r))} and ${pt(s, g(s))}.`, { visual: two(f, g) }); } },
    e: { t: 'shifted input on the graph', g: R => { const a = R.pick([1, -1]), h = R.int(-3, 3), shift = R.bool(0.6); let c, d, kv;
      do { c = R.int(-5, 5); d = R.int(1, 3); kv = c + a * d * d; } while (Math.abs(kv) > 7);
      const us = [h - d, h + d];
      if (shift) { const s = nz(R, -3, 3), xs = us.map(u => u + s);
        return E.num(`The graph shows ${M('y=f(x)')}. Solve ${M(`f(${sh(s)})=${kv}`)}.`, [{ label: 'x =', set: xs.map(String) }],
          `Let u = x ${sg(-s)}. The graph is at height ${kv} when u = ${us[0]} or u = ${us[1]}, so x = u ${sg(s)} = ${xs[0]} or ${xs[1]}.`, { visual: qpic(a, h, c, { label: 'graph of a function' }) }); }
      const k = R.pick([2, 2, 3, -1]), xs = us.map(u => fs(u, k));
      return E.num(`The graph shows ${M('y=f(x)')}. Solve ${M(`f(${k === -1 ? '-' : k}x)=${kv}`)}.`, [{ label: 'x =', set: xs }],
        `Let u = ${k === -1 ? '−' : k}x. The graph is at height ${kv} when u = ${us[0]} or u = ${us[1]}, so x = u/${par(k)} = ${xs.map(E.pt).join(' or ')}.`, { visual: qpic(a, h, c, { label: 'graph of a function' }) }); } },
    f: { t: 'solve f(f(x)) = k from the graph', g: R => { let a, h, c, d, K, us, sols, parts;
      for (;;) { a = R.pick([1, -1]); h = R.int(-3, 3); c = R.int(-5, 5); d = R.int(1, 3); K = c + a * d * d; if (Math.abs(K) > 7) continue; us = [h - d, h + d]; sols = []; parts = []; let ok = true;
        for (const u of us) { const t = (u - c) * a; if (t < 0) { parts.push(`f(x) = ${u} never happens`); continue; } const r = Math.sqrt(t); if (!Number.isInteger(r) || h + r > 6 || h - r < -6) { ok = false; break; }
          const xs = r === 0 ? [h] : [h - r, h + r]; sols.push(...xs); parts.push(`f(x) = ${u} at x = ${xs.join(' and ')}`); }
        if (ok && sols.length >= 2 && new Set(sols).size === sols.length) break; }
      return E.num(`The graph shows ${M('y=f(x)')}. Find all x with ${M(`f(f(x))=${K}`)}.`, [{ label: 'x =', set: sols.map(String) }],
        `Let u = f(x). The graph is at height ${K} when u = ${us[0]} or u = ${us[1]}. Now read the graph again: ${parts.join('; ')}.`, { visual: qpic(a, h, c, { label: 'graph of a function' }) }); } },
  });

  /* IV.2.05 Functions in context */
  S('IV.2.05', 'Functions in context', {
    a: { t: 'name input and output', g: R => { const c = R.pick(CTX), askIn = R.bool(), other = R.sample(CTX.filter(o => o !== c), 2);
      const right = askIn ? c.inp : c.out, wrong = [askIn ? c.out : c.inp, other[0].inp, other[1].out];
      return E.choice(R, `${M(`${c.F}(${c.v})`)} ${c.desc}. What is the ${askIn ? 'input' : 'output'}?`, right, wrong, `The input is the variable inside the parentheses (${c.v}: ${c.inp}); the output is the value ${c.F}(${c.v}) (${c.out}).`); } },
    b: { t: 'interpret f(a) = b in words', g: R => { const c = R.pick(CTX), [a, b] = ctxAB(R, c);
      return E.choice(R, `${M(`${c.F}(${c.v})`)} ${c.desc}. What does ${M(`${c.F}(${a})=${b}`)} mean?`, c.say(a, b), [c.say(b, a), c.rate(b), c.rate(a)],
        `Input first: ${c.v} = ${a}, and the output is ${b}. So: ${c.say(a, b)}`); } },
    c: { t: 'reasonable domain', g: R => { const kind = R.int(0, 3); let q, right, wrong, why;
      if (kind === 0) { const r = R.pick([4, 5, 6, 8]), T = r * R.int(5, 12);
        q = `A car's tank holds ${T} L and uses ${r} L per hour. ${M(`F(t)=${T}-${r}t`)} is the fuel left after t hours. What is a reasonable domain?`;
        right = M(`0<=t<=${T / r}`); wrong = [M(`0<=t<=${T}`), M('t>=0'), M(`0<=t<=${r}`)]; why = `Time starts at 0, and the tank is empty when ${T} − ${r}t = 0, at t = ${T / r}.`; }
      else if (kind === 1) { const N = R.pick([30, 40, 45, 50, 60]), p = R.pick([2, 3, 5, 12]);
        q = `A bus has ${N} seats and each ticket costs $${p}. ${M(`R(n)=${p}n`)} is the income from n passengers. What is a reasonable domain?`;
        right = `whole numbers from 0 to ${N}`; wrong = [`all real numbers from 0 to ${N}`, `whole numbers from 0 to ${p * N}`, 'all whole numbers']; why = `You can't sell part of a ticket, and at most ${N} people fit: n = 0, 1, 2, …, ${N}.`; }
      else if (kind === 2) { const P0 = 4 * R.int(5, 25);
        q = `A rectangle has perimeter ${P0} m and width w m. ${M(`A(w)=w(${P0 / 2}-w)`)} is its area. What is a reasonable domain?`;
        right = M(`0<w<${P0 / 2}`); wrong = [M(`0<w<${P0}`), M(`0<w<${P0 / 4}`), M('w>0')]; why = `Both sides must be positive: w > 0 and ${P0 / 2} − w > 0, so 0 < w < ${P0 / 2}.`; }
      else { const T = R.int(2, 7), v = 16 * T;
        q = `A ball is thrown up from the ground. ${M(`h(t)=-16t^2+${v}t`)} is its height in feet until it lands. What is a reasonable domain?`;
        right = M(`0<=t<=${T}`); wrong = [M(`0<=t<=${v}`), M('t>=0'), M(`0<=t<=${4 * T * T}`)]; why = `h(t) = −16t(t − ${T}) is 0 at t = 0 (launch) and t = ${T} (landing).`; }
      return E.choice(R, q, right, wrong, why); } },
    d: { t: 'units of input and output', g: R => { const c = R.pick(CTX), ask = R.int(0, 2), [a] = ctxAB(R, c);
      const opts = [c.iu, c.ou, c.r, c.ir];
      const q = [`What are the units of the input ${c.v}?`, `What are the units of ${M(`${c.F}(${a})`)}?`, `What are the units of the average rate of change of ${c.F}?`][ask];
      const why = [`${c.v} counts ${c.inp.replace(/^the /, '')}, so its units are ${c.iu}.`, `${c.F}(${a}) is an output, so it is in ${c.ou}.`, `Rate of change = change in output ÷ change in input: ${c.r}.`][ask];
      return E.choice(R, `${M(`${c.F}(${c.v})`)} ${c.desc}. ${q}`, opts[[0, 1, 2][ask]], opts.filter((_, j) => j !== ask), why); } },
  });

  /* IV.2.06 Average rate of change */
  const rateText = (fb, fa, b, a) => { const n = fb - fa, d = b - a, r = fs(n, d); return `(${fb} − ${par(fa)}) / (${b} − ${par(a)}) = ${d === 1 ? r : n + '/' + d + (r === `${n}/${d}` ? '' : ' = ' + r)}`; };
  S('IV.2.06', 'Average rate of change', {
    a: { t: 'formula over an interval', g: R => { const cubic = R.bool(0.3), co = cubic ? [1, 0, 0, R.int(-5, 5)] : [R.pick([1, 2, -1, 3, -2]), R.int(-6, 6), R.int(-9, 9)];
      const a = R.int(-3, 2), b = a + R.int(1, 4), fa = ev(co, a), fb = ev(co, b);
      return E.num(`Find the average rate of change of ${M('f(x)=' + P(co))} from ${M('x=' + a)} to ${M('x=' + b)}.`, [numF(fb - fa, b - a)], `f(${a}) = ${fa} and f(${b}) = ${fb}. Rate = ${rateText(fb, fa, b, a)}.`); } },
    b: { t: 'from a table', g: R => { const x0 = R.int(-2, 3), step = R.pick([1, 2, 5]), xs = [0, 1, 2, 3, 4].map(i => x0 + step * i), ys = xs.map(() => R.int(-10, 40));
      const [i, j] = R.sample([0, 1, 2, 3, 4], 2).sort(), a = xs[i], b = xs[j];
      return E.num(`Find the average rate of change of f from ${M('x=' + a)} to ${M('x=' + b)}.${tbl('x', 'f(x)', xs, ys)}`, [numF(ys[j] - ys[i], b - a)], `Rate = ${rateText(ys[j], ys[i], b, a)}. Change in output over change in input.`); } },
    c: { t: 'from a graph', g: R => { const pts = zig(R, -6, 6, [-2, -1, 0, 1, 2]); let a, b; do { a = R.int(-5, 4); b = R.int(a + 1, 5); } while (at(pts, a) === at(pts, b) && R.bool(0.8));
      const fa = at(pts, a), fb = at(pts, b);
      return E.num(`Find the average rate of change of f from ${M('x=' + a)} to ${M('x=' + b)}.`, [numF(fb - fa, b - a)], `Read f(${a}) = ${fa} and f(${b}) = ${fb}. Rate = ${rateText(fb, fa, b, a)}.`, { visual: zpic(pts, { points: [[a, fa, 'A'], [b, fb, 'B']] }) }); } },
    d: { t: 'interpret in context', g: R => { const K = [
        ['V', 'the water in a tank, in liters, after t minutes', 'liters', 'minute', 'The water', [8, 30], 'dec'],
        ['D', 'the distance, in miles, a train has traveled after t hours', 'miles', 'hour', 'The distance', [30, 80], 'inc'],
        ['T', 'the temperature of a cup of tea, in °F, after t minutes', 'degrees', 'minute', 'The temperature', [2, 9], 'dec'],
        ['B', 'the money, in dollars, in a savings account after t months', 'dollars', 'month', 'The balance', [15, 90], 'inc'],
        ['N', 'the number of bacteria, in thousands, after t hours', 'thousand bacteria', 'hour', 'The count', [3, 20], 'both']];
      const [F, desc, u, per, subj, rg, dir] = R.pick(K); let r = R.int(...rg); if (dir === 'dec' || (dir === 'both' && R.bool())) r = -r;
      const t1 = R.int(1, 5), dt = R.int(2, 6), t2 = t1 + dt, v1 = r < 0 ? -r * dt + R.int(5, 20) * 10 : R.int(2, 20) * 10, v2 = v1 + r * dt;
      const up = r > 0 ? 'increases' : 'decreases', dn = r > 0 ? 'decreases' : 'increases', R0 = Math.abs(r);
      return E.choice(R, `${M(`${F}(t)`)} is ${desc}. ${M(`${F}(${t1})=${v1}`)} and ${M(`${F}(${t2})=${v2}`)}. What does the average rate of change tell you?`,
        `${subj} ${up} by ${R0} ${u} per ${per} on average.`, [`${subj} ${dn} by ${R0} ${u} per ${per} on average.`, `${subj} ${up} by ${Math.abs(v2 - v1)} ${u} per ${per} on average.`, `${subj} ${up} by 1/${R0} ${per} per ${u.replace(/s$/, '').replace('thousand bacteria', 'thousand bacteria')} on average.`],
        `(${v2} − ${v1}) / (${t2} − ${t1}) = ${v2 - v1}/${dt} = ${r} ${u} per ${per}. ${r > 0 ? 'Positive: it goes up.' : 'Negative: it goes down.'}`); } },
  });

  /* IV.2.07 Increasing & decreasing */
  S('IV.2.07', 'Increasing & decreasing', {
    a: { t: 'spot intervals on a graph', g: R => { const want = R.bool(); const pts = zig(R, -6, 6, [-2, -1, 1, 2], q => q.some((p, k) => k < q.length - 1 && (slope(p, q[k + 1]) > 0) === want));
      const segs = pts.slice(0, -1).map((p, k) => [p, pts[k + 1]]).filter(([p, q]) => (slope(p, q) > 0) === want); const [p, q] = R.pick(segs);
      const lo = R.int(p[0], q[0] - 1), hi = R.int(lo + 1, q[0]);
      return E.choiceFixed(`On the interval from ${M('x=' + lo)} to ${M('x=' + hi)}, is f increasing or decreasing?`, ['increasing', 'decreasing'], want ? 0 : 1,
        `Moving right from x = ${lo} to x = ${hi}, the graph goes ${want ? 'up' : 'down'} (from ${at(pts, lo)} to ${at(pts, hi)}), so f is ${want ? 'increasing' : 'decreasing'}.`, { visual: zpic(pts) }); } },
    b: { t: 'write them as intervals', g: R => { const kind = R.int(0, 2), ask = R.bool() ? 'increasing' : 'decreasing'; let iv, vis, why, fdesc;
      if (kind < 2) { const a = R.pick([1, -1]), h = R.int(-3, 3), k = R.int(-4, 4); const upRight = a > 0; fdesc = kind === 0 ? M('f(x)=' + `${a < 0 ? '-' : ''}(${sh(h)})^2${pm(k)}`.replace('(x)^2', 'x^2')) : M('f(x)=' + `${a < 0 ? '-' : ''}abs(${sh(h)})${pm(k)}`);
        iv = (ask === 'increasing') === upRight ? `(${h},inf)` : `(-inf,${h})`; why = `The turning point is at x = ${h}. f goes ${upRight ? 'down then up' : 'up then down'}, so it is ${ask} on ${E.pt(iv)}.`;
        const f = kind === 0 ? (x => a * (x - h) ** 2 + k) : (x => a * Math.abs(x - h) + k);
        vis = V.graph({ x: [-6, 6], y: [-8, 8], w: 300, h: 380, ticks: 1, fns: [{ f, color: C.blue }], label: 'graph of f' });
        return E.num(`On what interval is ${fdesc} ${ask}? Use interval notation with open ends.`, [{ interval: iv }], why, { visual: vis }); }
      let xs, ys; do { xs = R.sample([-6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6], 4).sort((p, q) => p - q); const s = R.bool() ? 1 : -1; ys = [R.int(-5, 5)]; for (let k = 1; k < 4; k++) ys.push(ys[k - 1] + (k % 2 ? s : -s) * R.int(1, 6)); } while (ys.some(y => Math.abs(y) > 5));
      const pts = xs.map((x, k) => [x, ys[k]]), ivs = []; for (let k = 0; k < 3; k++) if ((ys[k + 1] > ys[k]) === (ask === 'increasing')) ivs.push(`(${xs[k]},${xs[k + 1]})`);
      iv = ivs.join('U');
      return E.num(`The graph shows f on ${M(`${xs[0]}<=x<=${xs[3]}`)}. On what interval(s) is f ${ask}? Use open intervals; join two with ∪.`, [{ interval: iv }],
        `Read the x-values where the graph goes ${ask === 'increasing' ? 'up' : 'down'} from left to right: ${E.pt(iv)}.`, { visual: zpic(pts, { points: [[xs[0], ys[0]], [xs[3], ys[3]]] }) }); } },
    c: { t: 'constant intervals', g: R => { let xs, ys; do { xs = R.sample([-6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6], R.int(4, 5)).sort((p, q) => p - q); const flat = R.int(0, xs.length - 2); ys = [R.int(-4, 4)];
        for (let k = 1; k < xs.length; k++) ys.push(ys[k - 1] + (k - 1 === flat ? 0 : R.pick([-1, 1]) * R.int(1, 5))); } while (ys.some(y => Math.abs(y) > 5));
      const pts = xs.map((x, k) => [x, ys[k]]), k0 = ys.findIndex((y, k) => k < ys.length - 1 && ys[k + 1] === y), iv = `(${xs[k0]},${xs[k0 + 1]})`;
      return E.num(`On what interval is f constant? Use an open interval.`, [{ interval: iv }], `The graph is flat at height ${ys[k0]} from x = ${xs[k0]} to x = ${xs[k0 + 1]}: ${E.pt(iv)}. Give x-values, not the height.`, { visual: zpic(trim(pts), { points: [pts[0], pts[pts.length - 1]] }) }); } },
    d: { t: 'connect to sign of rate of change', g: R => { const kind = R.int(0, 2), a = R.int(-6, 2), b = a + R.int(3, 7), p = R.int(a, b - 2), q = R.int(p + 1, b);
      const word = ['increasing', 'constant', 'decreasing'][kind];
      if (R.bool(0.35)) { const opts = ['positive', 'zero', 'negative'];
        return E.choiceFixed(`The average rate of change of f is ${opts[kind]} over every part of the interval ${M(`(${a},${b})`)}. Then on that interval f is…`, ['increasing', 'constant', 'decreasing'], kind,
          `${['Positive rate: outputs rise as inputs rise, so f is increasing.', 'Zero rate: outputs never change, so f is constant.', 'Negative rate: outputs fall as inputs rise, so f is decreasing.'][kind]}`); }
      return E.choiceFixed(`f is ${word} on ${M(`(${a},${b})`)}. Is its average rate of change from ${M('x=' + p)} to ${M('x=' + q)} positive, zero or negative?`, ['positive', 'zero', 'negative'], kind,
        `${['Increasing: f(' + q + ') > f(' + p + '), so the change in output is positive.', 'Constant: f(' + q + ') = f(' + p + '), so the change in output is 0.', 'Decreasing: f(' + q + ') < f(' + p + '), so the change in output is negative.'][kind]} The change in input is positive.`); } },
  });

  /* IV.2.08 Intercepts & zeros */
  S('IV.2.08', 'Intercepts & zeros', {
    a: { t: 'y-intercept is f(0)', g: R => { const kind = R.int(0, 3); let f, y0;
      if (kind === 0) { const m = nz(R, -6, 6), b = R.int(-9, 9); f = P([m, b]); y0 = b; }
      else if (kind === 1) { const co = [nz(R, -3, 3), R.int(-6, 6), R.int(-9, 9)]; f = P(co); y0 = co[2]; }
      else if (kind === 2) { const a = R.pick([1, 2, -1, 3]), r = nz(R, -5, 5), s = nz(R, -5, 5); f = `${a === 1 ? '' : a === -1 ? '-' : a}${E.lin(r)}${E.lin(s)}`; y0 = a * r * s; }
      else { const a = R.pick([2, 3, -2]), h = nz(R, -4, 4), k = R.int(-6, 6); f = `${a}(${sh(h)})^2${pm(k)}`; y0 = a * h * h + k; }
      return E.num(`What is the y-intercept of ${M('f(x)=' + f)}? Give the y-value.`, [{ label: 'y =', ans: y0 }], `The y-intercept is f(0): put x = 0 into ${E.pt(f)} to get ${y0}.`); } },
    b: { t: 'zeros where f(x) = 0', g: R => { const kind = R.int(0, 2); let f, zs, why;
      if (kind === 0) { const m = R.pick([2, 3, 4, -2, 5]), b = nz(R, -9, 9); f = P([m, b]); zs = [fs(-b, m)]; why = `${E.pt(f)} = 0 gives x = ${fs(-b, m).replace('-', '−')}.`; }
      else if (kind === 1) { const a = R.pick([1, 2, -1]), r = R.int(-6, 6); let s; do s = R.int(-6, 6); while (s === r); f = fac(a, r, s); zs = [String(r), String(s)]; why = `A product is 0 when a factor is 0: x = ${r} or x = ${s}.`; }
      else { const k = R.int(1, 8), c = R.pick([1, 2, 3]); f = `${c === 1 ? '' : c}x^2-${c * k * k}`; zs = [String(k), String(-k)]; why = `${c === 1 ? '' : c}x² = ${c * k * k} gives x² = ${k * k}, so x = ±${k}.`; }
      return E.num(`Find the zeros of ${M('f(x)=' + f)}.`, [{ label: 'x =', set: zs }], `Zeros are the inputs where f(x) = 0. ${why}`); } },
    c: { t: 'find them from a graph', g: R => { let a, r, s; do { a = R.pick([1, -1]); r = R.int(-5, 3); s = r + R.int(2, 6); } while (s > 5 || Math.abs(r * s) > 7 || ((s - r) / 2) ** 2 > 8);
      const h = (r + s) / 2, k = -a * ((s - r) / 2) ** 2;
      return E.num(`The graph shows ${M('y=f(x)')}. What are the zeros of f, and what is the y-intercept?`, [{ label: 'zeros', set: [String(r), String(s)] }, { label: 'y-intercept', ans: a * r * s }],
        `The zeros are where the graph crosses the x-axis: x = ${r} and x = ${s}. It crosses the y-axis at y = ${a * r * s}.`, { visual: qpic(a, h, k) }); } },
    d: { t: 'find them algebraically', g: R => { const kind = R.int(0, 2); let co, zs, why;
      if (kind === 0) { const r = R.int(-8, 8); let s; do s = R.int(-8, 8); while (s === r); const a = R.pick([1, 1, -1, 2]); co = [a, -a * (r + s), a * r * s]; zs = [String(r), String(s)]; why = `It factors as ${E.pt(fac(a, r, s))}, so x = ${r} or x = ${s}.`; }
      else if (kind === 1) { const r = nz(R, -5, 5); let s; do s = nz(R, -5, 5); while (s === r); co = [1, -(r + s), r * s, 0]; zs = ['0', String(r), String(s)]; why = `Factor out x: x(${E.pt(P([1, -(r + s), r * s]))}) = x${E.pt(E.lin(r) + E.lin(s))}, so x = 0, ${r} or ${s}.`; }
      else { let r, s; do { r = R.int(-5, 5); s = nz(R, -5, 5); } while (s % 2 === 0); co = [2, -(2 * r + s), r * s]; zs = [String(r), fs(s, 2)]; why = `It factors as ${E.pt(`${E.lin(r)}(2x${pm(-s)})`)}, so x = ${r} or x = ${fs(s, 2).replace('-', '−')}.`; }
      return E.num(`Find all zeros of ${M('f(x)=' + P(co))}.`, [{ label: 'x =', set: zs }], `Set f(x) = 0. ${why}`); } },
  });

  /* IV.2.09 Maxima & minima */
  S('IV.2.09', 'Maxima & minima', {
    a: { t: 'relative max and min', g: R => { const kind = R.int(0, 2);
      const kindAt = (q, k) => { const s1 = slope(q[k - 1], q[k]), s2 = slope(q[k], q[k + 1]); return s1 > 0 && s2 < 0 ? 0 : s1 < 0 && s2 > 0 ? 1 : 2; };
      let pts, P0;
      if (kind === 2 && R.bool()) { pts = zig(R, -6, 6, [-2, -1, 1, 2], q => q.some((p, k) => k < q.length - 1 && q[k + 1][0] - p[0] >= 2)); const segs = pts.slice(0, -1).map((p, k) => [p, pts[k + 1]]).filter(([p, q]) => q[0] - p[0] >= 2); const [p, q] = R.pick(segs); const x = R.int(p[0] + 1, q[0] - 1); P0 = [x, at(pts, x)]; }
      else { pts = zig(R, -6, 6, [-2, -1, 1, 2], q => q.some((p, k) => k > 0 && k < q.length - 1 && kindAt(q, k) === kind)); const ks = pts.map((p, k) => k).filter(k => k > 0 && k < pts.length - 1 && kindAt(pts, k) === kind); P0 = pts[R.pick(ks)]; }
      return E.choiceFixed(`Is the point P ${pt(P0[0], P0[1])} a relative maximum, a relative minimum or neither?`, ['relative maximum', 'relative minimum', 'neither'], kind,
        ['The graph rises to P and falls after it: P is higher than every point nearby, so it is a relative maximum.', 'The graph falls to P and rises after it: P is lower than every point nearby, so it is a relative minimum.', 'The graph keeps going the same way (up or down) through P, so there are nearby points both higher and lower: neither.'][kind], { visual: zpic(pts, { points: [[P0[0], P0[1], 'P']] }) }); } },
    b: { t: 'absolute max and min', g: R => { const x0 = R.int(-6, -3), x1 = R.int(2, 6), pts = zig(R, x0, x1, [-2, -1, 1, 2], q => q.length >= 4);
      const ys = pts.map(p => p[1]), hi = Math.max(...ys), lo = Math.min(...ys), last = pts.length - 1;
      return E.num(`The graph shows all of f, for ${M(`${x0}<=x<=${x1}`)}. What are the absolute maximum and absolute minimum values of f?`, [{ label: 'absolute max =', ans: hi }, { label: 'absolute min =', ans: lo }],
        `The highest point of the whole graph has height ${hi}; the lowest has height ${lo}. Check the endpoints too.`, { visual: zpic(pts, { points: [pts[0], pts[last]] }) }); } },
    c: { t: 'read them from a graph', g: R => {
      if (R.bool(0.6)) { const mx = R.bool(), kind = mx ? 'maximum' : 'minimum', x0 = R.int(-6, -3), x1 = R.int(2, 6), ext = ys => mx ? Math.max(...ys) : Math.min(...ys);
        const pts = zig(R, x0, x1, [-2, -1, 1, 2], q => { const ys = q.map(p => p[1]), e = ext(ys); return q.length >= 4 && ys.filter(y => y === e).length === 1; });
        const e = ext(pts.map(p => p[1])), X = pts.find(p => p[1] === e)[0];
        return E.num(`The graph shows all of f, for ${M(`${x0}<=x<=${x1}`)}. What is the absolute ${kind} value of f, and at what x does it occur?`, [{ label: `absolute ${kind} value =`, ans: e }, { label: 'at x =', ans: X }],
          `The ${mx ? 'highest' : 'lowest'} point of the whole graph is ${pt(X, e)}. The ${kind} value is its height, ${e}; it occurs at x = ${X}. Don't swap them.`, { visual: zpic(pts, { points: [pts[0], pts[pts.length - 1]] }) }); }
      const a = R.pick([1, -1, 2, -2]), h = R.int(-4, 4), k = R.int(-5, 5), kind = a < 0 ? 'maximum' : 'minimum';
      return E.num(`f has a ${kind}. What is the ${kind} value of f, and at what x does it occur?`, [{ label: `${kind} value =`, ans: k }, { label: 'at x =', ans: h }],
        `The turning point is ${pt(h, k)}. The ${kind} value is the height, ${k}; it occurs at x = ${h}.`, { visual: qpic(a, h, k, { label: 'graph of f' }) }); } },
    d: { t: 'interpret in context', g: R => { const kind = R.int(0, 3); let F, f, right, wrong, why;
      if (kind === 0) { const h = R.int(4, 12) * 5, k = R.int(10, 90) * 100, a = R.pick([2, 3, 5]); F = 'P'; f = `P(x)=-${a}(x-${h})^2+${k}`;
        right = `The greatest profit is $${k}, when the price is $${h}.`; wrong = [`The greatest profit is $${h}, when the price is $${k}.`, `The least profit is $${k}, when the price is $${h}.`, `The profit is $${k} when the price is $0.`];
        why = `The vertex (${h}, ${k}) is a maximum since a < 0: the height ${k} is the profit and x = ${h} is the price.`; return E.choice(R, `A shop's weekly profit in dollars at price x dollars is ${M(f)}. What does the vertex tell you?`, right, wrong, why); }
      if (kind === 1) { const h = R.int(1, 4), k = 16 * h * h + R.int(1, 30); F = 'h'; f = `h(t)=-16(t-${h})^2+${k}`;
        right = `The ball's highest point is ${k} ft, reached after ${h} s.`; wrong = [`The ball's highest point is ${h} ft, reached after ${k} s.`, `The ball lands after ${h} s at ${k} ft.`, `The ball's lowest point is ${k} ft, reached after ${h} s.`];
        why = `a < 0, so the vertex (${h}, ${k}) is a maximum: height ${k} ft at time ${h} s.`; return E.choice(R, `A ball's height in feet after t seconds is ${M(f)}. What does the vertex tell you?`, right, wrong, why); }
      if (kind === 2) { const h = R.int(2, 9) * 10, k = R.int(2, 20) * 50, a = R.pick([1, 2, 3]); f = `C(x)=${a === 1 ? '' : a}(x-${h})^2+${k}`;
        right = `The lowest cost per day is $${k}, when ${h} units are made.`; wrong = [`The lowest cost per day is $${h}, when ${k} units are made.`, `The highest cost per day is $${k}, when ${h} units are made.`, `Making ${k} units costs $${h}.`];
        why = `a > 0, so the vertex (${h}, ${k}) is a minimum: cost $${k} at x = ${h} units.`; return E.choice(R, `A factory's daily cost in dollars for making x units is ${M(f)}. What does the vertex tell you?`, right, wrong, why); }
      const h = R.int(2, 6), k = R.int(-8, 12);
      f = `T(t)=(t-${h})^2${pm(k)}`;
      right = `The coldest temperature is ${k}°C, at ${h} hours after midnight.`; wrong = [`The coldest temperature is ${h}°C, at ${k} hours after midnight.`, `The warmest temperature is ${k}°C, at ${h} hours after midnight.`, `At midnight the temperature is ${k}°C.`];
      why = `a > 0, so the vertex (${h}, ${k}) is a minimum: the output ${k} is the temperature and ${h} is the time.`;
      return E.choice(R, `The temperature in °C t hours after midnight is ${M(f)} for ${M('0<=t<=8')}. What does the vertex tell you?`, right, wrong, why); } },
  });

  /* IV.2.10 Piecewise functions */
  const piece = R => { const c = R.int(-2, 2); let m1, m2, y1, y2; do { m1 = R.int(-2, 2); m2 = R.int(-2, 2); y1 = R.int(-4, 4); y2 = R.int(-4, 4); } while (y1 === y2 || Math.abs(y1 - 4 * m1) > 7 || Math.abs(y2 + 4 * m2) > 7);
    const f1 = x => y1 + m1 * (x - c), f2 = x => y2 + m2 * (x - c), leftClosed = R.bool();
    return { c, f1, f2, e1: P([m1, y1 - m1 * c]), e2: P([m2, y2 - m2 * c]), y1, y2, leftClosed, c1: leftClosed ? `x<=${c}` : `x<${c}`, c2: leftClosed ? `x>${c}` : `x>=${c}` }; };
  const ppic = (p, o = {}) => { const w = o.w || 300; return V.graph({ x: [-6, 6], y: [-8, 8], w, h: Math.round(w * 1.25), ticks: o.small ? 2 : 1, fns: [{ f: p.f1, to: p.c, color: C.blue }, { f: p.f2, from: p.c, color: C.blue }],
    points: [[p.c, p.f1(p.c), '', !p.leftClosed], [p.c, p.f2(p.c), '', p.leftClosed]], label: 'piecewise graph' }); };
  S('IV.2.10', 'Piecewise functions', {
    a: { t: 'evaluate the right piece', g: R => { const c = R.int(-2, 3), three = R.bool(0.3), A = [nz(R, -3, 3), R.int(-5, 5)], B = R.bool() ? [1, 0, R.int(-5, 5)] : [nz(R, -3, 3), R.int(-6, 6)], Cc = [R.int(-6, 9)];
      const incl = R.bool(); const c2 = c + R.int(2, 3);
      const rows = three ? [[P(A), incl ? `x<=${c}` : `x<${c}`], [P(B), incl ? `${c}<x<=${c2}` : `${c}<=x<${c2}`], [P(Cc), incl ? `x>${c2}` : `x>=${c2}`]] : [[P(A), incl ? `x<=${c}` : `x<${c}`], [P(B), incl ? `x>${c}` : `x>=${c}`]];
      const k = R.pick(three ? [c - R.int(1, 3), c, c + 1, c2, c2 + R.int(1, 2)] : [c - R.int(1, 3), c, c, c + R.int(1, 3)]);
      const which = k < c || (k === c && incl) ? 0 : !three || k < c2 || (k === c2 && incl) ? 1 : 2, co = [A, B, Cc][which], val = ev(co, k);
      return E.num(`Find ${M(`f(${k})`)} for ${pw('f(x)', rows)}`, [{ label: lb(`f(${k}) =`), ans: val }], `${k} fits the condition ${E.pt(rows[which][1])}, so use ${E.pt(rows[which][0])}: ${co.length === 1 ? `f(${k}) = ${val}` : `${sub(co, k)} = ${val}`}.`); } },
    b: { t: 'graph each piece', g: R => { let p, alt; do { p = piece(R); alt = [{ ...p, f1: p.f2, f2: p.f1 }, { ...p, c: p.c + (p.c < 2 ? 1 : -1) }, { ...p, f2: x => p.f2(x) + 3 * (p.y2 > 0 ? -1 : 1) }]; } while (Math.abs(p.f1(p.c) - p.f2(p.c)) < 1 || Math.abs(alt[0].f1(p.c) - alt[0].f2(p.c)) < 1);
      const s = q => ppic(q, { w: 200, small: true }), right = s(p), wrongs = alt.map(s).filter(x => x !== right);
      return E.choice(R, `Which graph shows ${pw('f(x)', [[p.e1, p.c1], [p.e2, p.c2]])}?`, right, wrongs, `Draw ${E.pt(p.e1)} only left of x = ${p.c} and ${E.pt(p.e2)} only to the right. At x = ${p.c} the ${p.leftClosed ? 'left' : 'right'} piece gets the closed dot.`); } },
    c: { t: 'open vs closed endpoints', g: R => { let p; do p = piece(R); while (p.y1 === p.y2);
      if (R.bool()) { const val = p.leftClosed ? p.y1 : p.y2;
        return E.num(`The graph shows ${M('y=f(x)')}. What is ${M(`f(${p.c})`)}?`, [{ label: lb(`f(${p.c}) =`), ans: val }], `At x = ${p.c} the closed dot is at height ${val}; the open dot at ${p.leftClosed ? p.y2 : p.y1} is not on the graph. So f(${p.c}) = ${val}.`, { visual: ppic(p) }); }
      const side = R.bool() ? 'left' : 'right', closed = (side === 'left') === p.leftClosed;
      return E.choiceFixed(`For ${pw('f(x)', [[p.e1, p.c1], [p.e2, p.c2]])}, is the dot at the end of the ${side} piece, at ${M('x=' + p.c)}, open or closed?`, ['open', 'closed'], closed ? 1 : 0,
        `The ${side} piece's condition is ${E.pt(side === 'left' ? p.c1 : p.c2)}, which ${closed ? 'includes' : 'leaves out'} x = ${p.c}, so its dot is ${closed ? 'closed' : 'open'}.`); } },
    d: { t: 'write one from a graph', g: R => { let p; do p = piece(R); while (p.y1 === p.y2);
      return E.num(`The graph shows ${pw('f(x)', [['□', p.c1], ['□', p.c2]])} Write each piece.`, [{ label: 'left piece: f(x) =', expr: p.e1 }, { label: 'right piece: f(x) =', expr: p.e2 }],
        `Left of x = ${p.c}, the line has slope ${slope([p.c - 1, p.f1(p.c - 1)], [p.c, p.y1])} and ends at ${pt(p.c, p.y1)}: ${E.pt(p.e1)}. Right of it, slope ${slope([p.c, p.y2], [p.c + 1, p.f2(p.c + 1)])} starting at ${pt(p.c, p.y2)}: ${E.pt(p.e2)}.`, { visual: ppic(p) }); } },
  });

  /* IV.2.11 Step functions */
  const dec = v => String(v).replace('-', '−');
  const stepPic = (ceil, k, o = {}) => { const fns = [], points = [];
    for (let n = -3; n < 3; n++) { const y = (ceil ? n + 1 : n) + k; fns.push({ f: () => y, from: n, to: n + 1, color: C.blue });
      const closedLeft = o.flip ? ceil : !ceil; points.push([n, y, '', !closedLeft], [n + 1, y, '', closedLeft]); }
    return V.graph({ x: [-3, 3], y: [-5, 5], w: 190, h: 290, ticks: 1, labels: true, fns, points, label: 'step graph' }); };
  S('IV.2.11', 'Step functions', {
    a: { t: 'floor and ceiling', g: R => { const ceil = R.bool(), n = R.int(-6, 6), fr = R.pick([0.2, 0.5, 0.7, 0.25, 0.9, 0.1, 0]), v = Math.round((n + fr) * 100) / 100, ans = ceil ? Math.ceil(v) : Math.floor(v);
      return E.num(`Evaluate ${brk(String(v), ceil)}.`, [{ ans }], `${ceil ? '⌈ ⌉ rounds up' : '⌊ ⌋ rounds down'} to an integer${Number.isInteger(v) ? `; ${dec(v)} is already an integer` : `: the integer just ${ceil ? 'above' : 'below'} ${dec(v)} is ${dec(ans)}`}.${v < 0 && !Number.isInteger(v) ? ` For negatives, ${ceil ? 'up means toward zero' : 'down means away from zero'}.` : ''}`); } },
    b: { t: 'graph steps', g: R => { const ceil = R.bool(), k = R.int(-1, 1);
      const cand = [stepPic(!ceil, k), stepPic(ceil, k + 1), stepPic(ceil, k - 1), stepPic(ceil, k, { flip: true })];
      const f = `${ceil ? 'ceil' : 'floor'}`, lab = brk('x', ceil) .replace('</mrow></math>', k ? `<mo>${k > 0 ? '+' : '−'}</mo><mn>${Math.abs(k)}</mn></mrow></math>` : '</mrow></math>');
      return E.choice(R, `Which graph shows ${M('y=')}${lab}?`.replace('<math><mrow><mi>y</mi><mo>=</mo></mrow></math>', '<math><mrow><mi>y</mi><mo>=</mo></mrow></math>'), stepPic(ceil, k), R.sample(cand, 3),
        `${ceil ? 'Ceiling rounds up: on each interval (n, n + 1] the value is n + 1, closed dot on the right' : 'Floor rounds down: on each interval [n, n + 1) the value is n, closed dot on the left'}${k ? `, then shift ${k > 0 ? 'up' : 'down'} ${Math.abs(k)}` : ''}. The graph at x = 0.5 has height ${(ceil ? 1 : 0) + k}.`); } },
    c: { t: 'postage and parking models', g: R => { const kind = R.int(0, 2), m = (c) => (c / 100).toFixed(2);
      if (kind === 0) { const a = R.pick([2, 3, 4, 5, 6]), h = R.int(1, 6), mins = R.pick([5, 10, 20, 30, 45, 50]), n = h + 1;
        return E.num(`Parking costs $${a} for each hour or part of an hour. What do you pay for ${h} h ${mins} min?`, [{ label: 'cost = $', ans: a * n }], `Any part of an hour counts as a full hour, so ${h} h ${mins} min is charged as ${n} hours: ${n} × $${a} = $${a * n}.`); }
      if (kind === 1) { const a = R.pick([3, 4, 5, 8]), b = R.pick([1, 2, 3]), t = R.int(2, 7) + R.pick([0.25, 0.5, 0.75]), extra = Math.ceil(t - 1);
        return E.num(`A garage charges $${a} for the first hour and $${b} for each extra hour or part of an hour. What does ${t} hours cost?`, [{ label: 'cost = $', ans: a + b * extra }], `After the first hour, ${t - 1} more hours round up to ${extra}: $${a} + ${extra} × $${b} = $${a + b * extra}.`); }
      const c1 = R.pick([63, 68, 73, 78]), c2 = R.pick([20, 24, 28]), w = R.int(2, 6) + R.pick([0.2, 0.4, 0.5, 0.8]), extra = Math.ceil(w - 1), tot = c1 + c2 * extra;
      return E.num(`A letter costs $${m(c1)} for the first ounce and $${m(c2)} for each extra ounce or part of an ounce. What does a ${w} oz letter cost?`, [{ label: 'cost = $', ans: tot / 100 }], `The ${Math.round((w - 1) * 10) / 10} oz beyond the first rounds up to ${extra} extra ounces: $${m(c1)} + ${extra} × $${m(c2)} = $${m(tot)}.`); } },
    d: { t: 'evaluate at the jumps', g: R => { if (R.bool(0.4)) { const a = R.pick([2, 3, 4, 5]), h = R.int(2, 6);
        return E.num(`Parking costs $${a} for each hour or part of an hour. What do you pay for exactly ${h} hours, and for ${h} hours and 1 minute?`, [{ label: `${h} h: $`, ans: a * h }, { label: `${h} h 1 min: $`, ans: a * (h + 1) }],
          `Exactly ${h} hours is ${h} full hours: $${a * h}. One more minute starts a new hour: ${h + 1} × $${a} = $${a * (h + 1)}.`); }
      const ceil = R.bool(), k = R.int(-3, 3), n = R.int(-4, 4), d = R.pick([0.1, 0.5, 0.01]), side = R.bool() ? -1 : 1, x2 = Math.round((n + side * d) * 100) / 100;
      const F = x => (ceil ? Math.ceil(x) : Math.floor(x)) + k, fdef = brk('x', ceil).replace('</mrow></math>', k ? `<mo>${k > 0 ? '+' : '−'}</mo><mn>${Math.abs(k)}</mn></mrow></math>` : '</mrow></math>');
      return E.num(`Let ${M('f(x)=')}${fdef}. Find ${M(`f(${n})`)} and ${M(`f(${x2})`)}.`, [{ label: lb(`f(${n}) =`), ans: F(n) }, { label: lb(`f(${x2}) =`), ans: F(x2) }],
        `${ceil ? '⌈' + dec(n) + '⌉' : '⌊' + dec(n) + '⌋'} = ${dec(n)} because ${dec(n)} is an integer, so f(${n}) = ${F(n)}. ${ceil ? '⌈' + dec(x2) + '⌉' : '⌊' + dec(x2) + '⌋'} = ${dec(F(x2) - k)}, so f(${x2}) = ${F(x2)}. The jump happens right at x = ${n}.`); } },
    e: { t: 'given the output, find the inputs', g: R => { const kind = R.int(0, 2), n = R.int(-5, 7); let lhs, iv, why;
      if (kind < 2) { const ceil = kind === 1, a = R.pick([2, 3, 4]), b = R.int(-5, 5), ex = P([a, b]); lhs = brk(ex, ceil);
        iv = ceil ? `(${fs(n - 1 - b, a)},${fs(n - b, a)}]` : `[${fs(n - b, a)},${fs(n + 1 - b, a)})`;
        why = `${ceil ? `${n - 1} < ${E.pt(ex)} ≤ ${n}` : `${n} ≤ ${E.pt(ex)} < ${n + 1}`}. ${b > 0 ? `Subtract ${b} and divide` : b < 0 ? `Add ${-b} and divide` : 'Divide'} by ${a}: ${E.pt(iv)}.`; }
      else { const d = R.pick([2, 3, 4, 5]); lhs = brk(`x/${d}`, false); iv = `[${n * d},${(n + 1) * d})`; why = `${n} ≤ x/${d} < ${n + 1}. Multiply by ${d}: ${E.pt(iv)}.`; }
      lhs = lhs.replace(/<\/mrow><\/math>$/, `<mo>=</mo>${inner(String(n))}</mrow></math>`);
      return E.num(`Solve ${lhs}. Answer in interval notation.`, [{ interval: iv }], why); } },
    f: { t: 'floor puzzles', g: R => { const kind = R.int(0, 2);
      if (kind === 0) { const m = R.pick([1, 2, 3]), n = R.int(-5, 8), t = R.pick([0.2, 0.25, 0.4, 0.5, 0.6, 0.75, 0.8]), x = Math.round((n + t) * 100) / 100, c = Math.round(((m + 1) * n + t) * 100) / 100;
        const lhs = `<math><mrow><mi>x</mi><mo>+</mo>${m > 1 ? `<mn>${m}</mn>` : ''}<mo>⌊</mo><mi>x</mi><mo>⌋</mo><mo>=</mo>${inner(String(c))}</mrow></math>`;
        return E.num(`Solve ${lhs}.`, [{ label: 'x =', ans: x }], `Write x = n + t with n = ⌊x⌋ a whole number and 0 ≤ t < 1. Then ${m + 1}n + t = ${dec(c)}, which forces n = ${n} and t = ${t}. So x = ${dec(x)}.`); }
      if (kind === 1) { const N = R.int(10, 50), J = Math.floor(Math.sqrt(N)); let tot = 0; const bits = [];
        for (let j = 1; j <= J; j++) { const cnt = Math.min((j + 1) ** 2 - 1, N) - j * j + 1; tot += j * cnt; bits.push(`${j}·${cnt}`); }
        return E.num(`Find ${brk('sqrt(1)')} + ${brk('sqrt(2)')} + ${brk('sqrt(3)')} + … + ${brk(`sqrt(${N})`)}.`, [{ ans: tot }],
          `⌊√k⌋ = j for j² ≤ k < (j + 1)², a block of 2j + 1 values (the last block is cut off at ${N}). Sum: ${bits.join(' + ')} = ${tot}.`); }
      let a, b; do { a = R.int(2, 6); b = R.int(2, 6); } while (a === b);
      const ks = []; for (let k = -40; k <= 40; k++) if (Math.floor(b * k / a) === k) ks.push(k);
      const lhs = brk(`x/${a}`, false).replace(/<\/mrow><\/math>$/, `<mo>=</mo>${inner(`x/${b}`)}</mrow></math>`);
      return E.num(`Find all real x with ${lhs}.`, [{ label: 'x =', set: ks.map(k => String(b * k)) }],
        `x/${b} equals a floor, so it is a whole number k and x = ${b}k. Then ⌊${b}k/${a}⌋ = k needs k ≤ ${b}k/${a} < k + 1, true only for k = ${ks.join(', ')}. So x = ${ks.map(k => b * k).join(', ')}.`); } },
  });

  /* IV.2.12 Absolute value function */
  const av = (a, h, k) => `${a === 1 ? '' : a === -1 ? '-' : a}abs(${sh(h)})${pm(k)}`;
  const apic = (a, h, k, o = {}) => V.graph({ x: [-6, 6], y: [-8, 8], w: 300, h: 380, ticks: 1, fns: [{ f: x => a * Math.abs(x - h) + k, color: C.blue }], hlines: o.hlines, label: 'V-shaped graph' });
  S('IV.2.12', 'Absolute value function', {
    a: { t: 'the V graph', g: R => { const a = R.pick([1, -1]), h = R.int(-3, 3), k = R.int(-4, 4);
      const right = av(a, h, k), wr = [av(a, -h || 2, k), av(-a, h, k), av(a, h, -k || 3), av(a, k, h === k ? h + 1 : h)].filter(w => w !== right);
      return E.choice(R, 'Which equation matches the graph?', M('y=' + right), R.sample([...new Set(wr)], 3).map(w => M('y=' + w)), `The vertex is ${pt(h, k)} and the V opens ${a > 0 ? 'up' : 'down'}. The inside |x ${h > 0 ? '− ' + h : h < 0 ? '+ ' + -h : ''}| is 0 at x = ${h}.`.replace('|x |', '|x|'), { visual: apic(a, h, k) }); } },
    b: { t: 'vertex and slopes', g: R => { const a = R.pick([1, 2, 3, -1, -2, -3]), h = R.int(-6, 6), k = R.int(-8, 8);
      return E.num(`For ${M('y=' + av(a, h, k))}, find the vertex and the slope of each side of the V.`, [{ label: 'vertex', point: [String(h), String(k)] }, { label: 'slope right of the vertex', ans: a }, { label: 'slope left of the vertex', ans: -a }],
        `The inside is 0 at x = ${h}, giving vertex ${pt(h, k)}. To the right the slope is a = ${a}; to the left it is −a = ${-a}.`); } },
    c: { t: 'as a piecewise function', g: R => { const a = R.pick([1, 1, 2, -1, 3]), h = R.int(-5, 5), k = R.int(-6, 6);
      const rt = P([a, -a * h + k]), lf = P([-a, a * h + k]);
      return E.num(`Write ${M('f(x)=' + av(a, h, k))} as ${pw('f(x)', [['□', `x>=${h}`], ['□', `x<${h}`]])}`, [{ label: `for x ≥ ${lb(h)}: f(x) =`, expr: rt }, { label: 'for the other side: f(x) =', expr: lf }],
        `When x ≥ ${h}, the inside is not negative, so |${E.pt(sh(h))}| = ${E.pt(sh(h))}: f(x) = ${E.pt(rt)}. When x < ${h}, the inside is negative, so |${E.pt(sh(h))}| = ${h ? '−(' + E.pt(sh(h)) + ')' : '−x'}: f(x) = ${E.pt(lf)}.`); } },
    d: { t: 'solve with the graph', g: R => { const a = R.pick([1, -1, 2]), h = R.int(-3, 3), k = R.int(-3, 3), kind = R.pick([0, 0, 1, 2]), d = R.int(1, 3);
      const c = kind === 0 ? k + a * d : kind === 1 ? k : k - a * R.int(1, 2); const sol = kind === 0 ? [String(h - d), String(h + d)] : kind === 1 ? [String(h)] : [];
      return E.num(`The graph shows ${M('y=' + av(a, h, k))} and the line ${M('y=' + c)}. Solve ${M(av(a, h, k) + '=' + c)}. Type "no solution" if there is none.`, [{ label: 'x =', set: sol }],
        kind === 0 ? `The line meets the V at x = ${h - d} and x = ${h + d}.` : kind === 1 ? `The line touches only the vertex, at x = ${h}.` : `The line misses the V entirely, so there is no solution.`, { visual: apic(a, h, k, { hlines: [{ y: c }] }) }); } },
  });

  /* IV.2.13 Combining functions */
  const addCo = (p, q, s = 1) => { const n = Math.max(p.length, q.length), a = [...Array(n - p.length).fill(0), ...p], b = [...Array(n - q.length).fill(0), ...q]; return a.map((v, i) => v + s * b[i]); };
  const mulCo = (p, q) => { const r = Array(p.length + q.length - 1).fill(0); p.forEach((a, i) => q.forEach((b, j) => { r[i + j] += a * b; })); return r; };
  const randPoly = R => R.bool() ? [nz(R, -3, 3), R.int(-6, 6), R.int(-9, 9)] : [nz(R, -6, 6), R.int(-9, 9)];
  S('IV.2.13', 'Combining functions', {
    a: { t: '(f + g)(x)', g: R => { const f = randPoly(R), g = randPoly(R), s = addCo(f, g);
      if (R.bool(0.35)) { const k = R.int(-3, 4);
        return E.num(`${M('f(x)=' + P(f))} and ${M('g(x)=' + P(g))}. Find ${M(`(f+g)(${k})`)}.`, [{ ans: ev(f, k) + ev(g, k) }], `f(${k}) = ${ev(f, k)} and g(${k}) = ${ev(g, k)}, so (f + g)(${k}) = ${ev(f, k) + ev(g, k)}.`); }
      return E.num(`${M('f(x)=' + P(f))} and ${M('g(x)=' + P(g))}. Find ${M('(f+g)(x)')} and simplify.`, [{ label: '(f + g)(x) =', expr: P(s), form: 'expanded' }], `Add like terms: (${E.pt(P(f))}) + (${E.pt(P(g))}) = ${E.pt(P(s))}.`); } },
    b: { t: '(f − g)(x)', g: R => { let f, g, s; do { f = randPoly(R); g = randPoly(R); s = addCo(f, g, -1); } while (g[g.length - 1] >= 0 && R.bool(0.6) || s.every(v => v === 0));
      const which = R.bool(0.8) ? 'f-g' : 'g-f', res = which === 'f-g' ? s : s.map(v => -v), [A, B] = which === 'f-g' ? [f, g] : [g, f];
      return E.num(`${M('f(x)=' + P(f))} and ${M('g(x)=' + P(g))}. Find ${M(`(${which})(x)`)} and simplify.`, [{ label: `(${which.replace('-', ' − ')})(x) =`, expr: P(res), form: 'expanded' }],
        `Subtract the whole of the second function: (${E.pt(P(A))}) − (${E.pt(P(B))}) = ${E.pt(P(A))} ${E.pt(P(B.map(v => -v))).replace(/^(?!−)/, '+ ').replace(/^−/, '− ')} = ${E.pt(P(res))}.`); } },
    c: { t: '(fg)(x) and (f/g)(x)', g: R => { const kind = R.int(0, 2);
      if (kind === 0) { const f = [nz(R, -3, 3), R.int(-6, 6)], g = [R.pick([1, 1, 2, -1]), nz(R, -6, 6)], pr = mulCo(f, g);
        return E.num(`${M('f(x)=' + P(f))} and ${M('g(x)=' + P(g))}. Find ${M('(fg)(x)')} and expand.`, [{ label: '(fg)(x) =', expr: P(pr), form: 'expanded' }], `(fg)(x) = (${E.pt(P(f))})(${E.pt(P(g))}) = ${E.pt(P(pr))}.`); }
      if (kind === 1) { const f = randPoly(R), g = [nz(R, -4, 4), R.int(-6, 6)]; let k; do k = R.int(-4, 4); while (ev(g, k) === 0 || ev(f, k) === 0);
        const fk = ev(f, k), gk = ev(g, k);
        return E.num(`${M('f(x)=' + P(f))} and ${M('g(x)=' + P(g))}. Find ${M(`(f/g)(${k})`)}.`, [numF(fk, gk)], `f(${k}) = ${fk} and g(${k}) = ${gk}, so (f/g)(${k}) = ${fk}/${par(gk)}${fs(fk, gk) === `${fk}/${gk}` ? '' : ' = ' + fs(fk, gk)}.`); }
      const r = nz(R, -7, 7), s = R.int(-7, 7);
      return E.num(`${M('f(x)=' + P([1, -(r + s), r * s]))} and ${M('g(x)=' + sh(r))}. Simplify ${M('(f/g)(x)')} for ${M('x!=' + r)}.`, [{ label: '(f/g)(x) =', expr: sh(s), form: 'simplified' }],
        `f factors as ${E.pt(E.lin(r) + (s === 0 ? 'x' : E.lin(s)))}, and ${E.pt(E.lin(r))} cancels: ${E.pt(sh(s))}, with x ≠ ${r}.`); } },
    d: { t: 'domain of the combination', g: R => { const kind = R.int(0, 4), a = R.int(-5, 5); let f, g, op, iv, why;
      if (kind === 0) { f = P([1, R.int(-6, 6)]); g = sh(a); op = 'f/g'; iv = `(-inf,${a})U(${a},inf)`; why = `g(x) = 0 at x = ${a}, so that input is left out.`; }
      else if (kind === 1) { const b = nz(R, -5, 5); f = P([1, -b, 0]); g = sh(b); op = 'f/g'; iv = `(-inf,${b})U(${b},inf)`; why = `The fraction simplifies to x, but g(${b}) = 0, so x = ${b} is still excluded.`; }
      else if (kind === 2) { f = `sqrt(${sh(a)})`; g = P([nz(R, -4, 4), R.int(-6, 6)]); op = R.pick(['f+g', 'f-g', 'fg']); iv = `[${a},inf)`; why = `The domain is where both f and g are defined. f needs x ≥ ${a}; g takes every x.`; }
      else if (kind === 3) { const b = a + R.int(1, 4); f = `sqrt(${sh(a)})`; g = sh(b); op = 'f/g'; iv = `[${a},${b})U(${b},inf)`; why = `f needs x ≥ ${a}, and g(x) ≠ 0 rules out x = ${b}.`; }
      else { const k = R.int(1, 5); f = P([1, R.int(-5, 5)]); g = `x^2-${k * k}`; op = 'f/g'; iv = `(-inf,${-k})U(${-k},${k})U(${k},inf)`; why = `g(x) = x² − ${k * k} is 0 at x = ±${k}.`; }
      return E.num(`${M('f(x)=' + f)} and ${M('g(x)=' + g)}. Find the domain of ${M(`(${op})(x)`)} in interval notation.`, [{ label: 'domain', interval: iv }], `${why} Domain: ${E.pt(iv)}.`); } },
    e: { t: 'work backwards to f or g', g: R => {
      if (R.bool()) { let f, g, S, D; do { f = randPoly(R); g = randPoly(R); S = addCo(f, g); D = addCo(f, g, -1); } while (S.every(v => v === 0) || D.every(v => v === 0) || P(f) === P(g));
        const askF = R.bool(), ans = askF ? f : g;
        return E.num(`${M('(f+g)(x)=' + P(S))} and ${M('(f-g)(x)=' + P(D))}. Find ${M(askF ? 'f(x)' : 'g(x)')}.`, [{ label: askF ? 'f(x) =' : 'g(x) =', expr: P(ans), form: 'expanded' }],
          `${askF ? 'Add' : 'Subtract'} the two: 2${askF ? 'f' : 'g'}(x) = ${E.pt(P(askF ? addCo(S, D) : addCo(S, D, -1)))}, so ${askF ? 'f' : 'g'}(x) = ${E.pt(P(ans))}.`); }
      const f = [R.pick([1, 2, 3, -1]), nz(R, -6, 6)], g = [R.pick([1, 1, 2, -1]), nz(R, -6, 6)], pr = mulCo(f, g);
      return E.num(`${M('f(x)=' + P(f))} and ${M('(fg)(x)=' + P(pr))}. Find ${M('g(x)')}.`, [{ label: 'g(x) =', expr: P(g), form: 'expanded' }],
        `(fg)(x) = f(x)·g(x), so factor ${E.pt(P(pr))} with ${E.pt(P(f))} as one factor: ${E.pt(`(${P(f)})(${P(g)})`)}. So g(x) = ${E.pt(P(g))}.`); } },
    f: { t: 'hidden structure', g: R => {
      if (R.bool()) { const kind = R.int(0, 2); let h, co;
        if (kind === 0) { let rs; do rs = [nz(R, -4, 4), nz(R, -4, 4), nz(R, -4, 4)]; while (new Set(rs).size < 3); co = mulCo(mulCo([1, -rs[0]], [1, -rs[1]]), [1, -rs[2]]); h = rs.map(r0 => E.lin(r0)).join(''); }
        else if (kind === 1) { const p = nz(R, -5, 5), q = nz(R, -6, 6); co = [1, p, q, p * q]; h = `(${sh(-p)})(x^2${pm(q)})`; }
        else { const p = nz(R, -6, 6); co = [0, 1, 2 * p, p * p]; h = `(${sh(-p)})^2`; }
        const ev4 = [0, co[1], 0, co[3]], od4 = [co[0], 0, co[2], 0], askF = R.bool();
        return E.num(`${M('h(x)=' + h)} is written as ${M('f(x)+g(x)')}, where f is even (${M('f(-x)=f(x)')}) and g is odd (${M('g(-x)=-g(x)')}). Find ${M(askF ? 'f(x)' : 'g(x)')}.`, [{ label: askF ? 'f(x) =' : 'g(x) =', expr: P(askF ? ev4 : od4), form: 'expanded' }],
          `Replace x by −x: h(−x) = f(x) − g(x). So ${askF ? 'f(x) = (h(x) + h(−x))/2, the even-power part' : 'g(x) = (h(x) − h(−x))/2, the odd-power part'} of ${E.pt(P(co))}: ${E.pt(P(askF ? ev4 : od4))}.`); }
      let s, p; do { s = nz(R, -9, 9); p = R.int(-12, 12); } while (p === 0);
      const x0 = R.int(-3, 5), kind = R.int(0, 2), ask = ['f^2+g^2', '(f-g)^2', '1/f+1/g'][kind];
      const field = kind === 0 ? { ans: s * s - 2 * p } : kind === 1 ? { ans: s * s - 4 * p } : numF(s, p);
      const why = [`(f² + g²)(${x0}) = (f + g)² − 2fg = ${s * s} − ${par(2 * p)} = ${s * s - 2 * p}`, `(f − g)² = (f + g)² − 4fg = ${s * s} − ${par(4 * p)} = ${s * s - 4 * p}`, `1/f + 1/g = (f + g)/(fg) = ${s}/${par(p)}${fs(s, p) === `${s}/${p}` ? '' : ' = ' + fs(s, p)}`][kind];
      const target = kind === 2 ? `1/(f(${x0}))+1/(g(${x0}))` : kind === 0 ? `f(${x0})^2+g(${x0})^2` : `(f(${x0})-g(${x0}))^2`;
      return E.num(`${M(`(f+g)(${x0})=${s}`)} and ${M(`(fg)(${x0})=${p}`)}. Find ${M(target)}. (You don't need f or g themselves.)`, [field], `${why}.`); } },
  });

  /* IV.2.14 Composition */
  const lq = R => R.bool() ? [nz(R, -4, 4), R.int(-6, 6)] : [R.pick([1, -1, 2]), 0, R.int(-5, 5)];
  const compose = (f, g) => { let r = [0]; f.forEach(c => { r = addCo(mulCo(r, g), [c]); }); while (r.length > 1 && r[0] === 0) r.shift(); return r; };
  S('IV.2.14', 'Composition', {
    a: { t: 'f(g(a)) with numbers', g: R => { let f, g, k, A, B, nA, nB, inner, val; const order = R.bool(0.7);
      do { f = lq(R); g = lq(R); k = R.int(-3, 4); [A, B, nA, nB] = order ? [f, g, 'f', 'g'] : [g, f, 'g', 'f']; inner = ev(B, k); val = ev(A, inner); } while (Math.abs(val) > 150);
      return E.num(`${M('f(x)=' + P(f))} and ${M('g(x)=' + P(g))}. Find ${M(`${nA}(${nB}(${k}))`)}.`, [{ ans: val }], `Inside first: ${nB}(${k}) = ${inner}. Then ${nA}(${inner}) = ${val}.`); } },
    b: { t: 'f(g(x)) as an expression', g: R => { const kind = R.int(0, 2); let f, g;
      if (kind === 0) { f = [1, 0, R.int(-6, 6)]; g = [nz(R, -4, 4), nz(R, -5, 5)]; } else if (kind === 1) { f = [nz(R, -4, 4), R.int(-6, 6)]; g = [R.pick([1, -1, 2]), R.int(-3, 3), R.int(-5, 5)]; } else { f = [nz(R, -5, 5), R.int(-6, 6)]; g = [nz(R, -5, 5), nz(R, -6, 6)]; }
      const swap = R.bool(0.3), [A, B, nA, nB] = swap ? [g, f, 'g', 'f'] : [f, g, 'f', 'g'], res = compose(A, B);
      return E.num(`${M('f(x)=' + P(f))} and ${M('g(x)=' + P(g))}. Find ${M(`${nA}(${nB}(x))`)} and expand.`, [{ label: `${nA}(${nB}(x)) =`, expr: P(res), form: 'expanded' }],
        `Put all of ${nB}(x) = ${E.pt(P(B))} in place of x in ${nA}: ${E.pt(P(A).replace(/x/g, `(${P(B)})`))} = ${E.pt(P(res))}.`); } },
    c: { t: 'order matters', g: R => { let f, g, fg, gf; do { f = [nz(R, -4, 4), R.int(-6, 6)]; g = R.bool() ? [1, 0, R.int(-5, 5)] : [nz(R, -4, 4), R.int(-6, 6)]; fg = compose(f, g); gf = compose(g, f); } while (P(fg) === P(gf));
      if (R.bool()) { const k = R.int(-3, 3), a1 = ev(f, ev(g, k)), a2 = ev(g, ev(f, k));
        return E.num(`${M('f(x)=' + P(f))} and ${M('g(x)=' + P(g))}. Find ${M(`f(g(${k}))`)} and ${M(`g(f(${k}))`)}.`, [{ label: lb(`f(g(${k})) =`), ans: a1 }, { label: lb(`g(f(${k})) =`), ans: a2 }],
          `f(g(${k})) = f(${ev(g, k)}) = ${a1}, but g(f(${k})) = g(${ev(f, k)}) = ${a2}. The order changes the answer.`); }
      return E.num(`${M('f(x)=' + P(f))} and ${M('g(x)=' + P(g))}. Find ${M('f(g(x))')} and ${M('g(f(x))')}, expanded.`, [{ label: 'f(g(x)) =', expr: P(fg), form: 'expanded' }, { label: 'g(f(x)) =', expr: P(gf), form: 'expanded' }],
        `f(g(x)) = ${E.pt(P(f).replace(/x/g, `(${P(g)})`))} = ${E.pt(P(fg))}, while g(f(x)) = ${E.pt(P(g).replace(/x/g, `(${P(f)})`))} = ${E.pt(P(gf))}. They differ.`); } },
    d: { t: 'decompose h into f(g(x))', g: R => { const m = R.pick([2, 3, 4, 5, -2, -3]), b = nz(R, -7, 7), gi = P([m, b]), kind = R.int(0, 4), c = R.int(1, 9);
      const K = [[`(${gi})^2`, 'x^2', gi], [`sqrt(${gi})`, 'sqrt(x)', gi], [`1/(${gi})`, '1/x', gi], [`abs(${gi})`, 'abs(x)', gi], [`(x^2+${c})^3`, 'x^3', `x^2+${c}`]];
      const [h, f, g] = K[kind], giveG = R.bool();
      return E.num(`${M('h(x)=' + h)} can be written as ${M('f(g(x))')}. ${giveG ? `If ${M('g(x)=' + g)}, what is ${M('f(x)')}?` : `If ${M('f(x)=' + f)}, what is ${M('g(x)')}?`}`, [{ label: giveG ? 'f(x) =' : 'g(x) =', expr: giveG ? f : g }],
        `g is the inside part, ${E.pt(g)}; f is what is done to it, ${E.pt(f).replace('abs(x)', '|x|')}. Check: f(g(x)) = ${E.pt(h).replace(/abs\((.*)\)/, '|$1|')}.`); } },
    e: { t: 'composition with an unknown', g: R => { const kind = R.int(0, 2);
      const na = n => n === 1 ? '+ a' : n === -1 ? '− a' : n > 0 ? `+ ${n}a` : `− ${-n}a`;
      if (kind === 0) { let m, n, b, a; do { m = R.pick([2, 3, -1, -2, 4]); n = R.pick([2, 3, -1, -2, 5]); b = nz(R, -8, 8); a = b * (1 - m) / (1 - n); } while (m === n || !Number.isInteger(a));
        return E.num(`${M(`f(x)=${P([m, 0])}+a`)} and ${M('g(x)=' + P([n, b]))}. For what value of a is ${M('f(g(x))=g(f(x))')} for every x?`, [{ label: 'a =', ans: a }],
          `f(g(x)) = ${m === -1 ? '−' : m}(${E.pt(P([n, b]))}) + a = ${E.pt(P([m * n, 0]))} ${sg(m * b)} + a and g(f(x)) = ${n === -1 ? '−' : n}(${E.pt(P([m, 0]))} + a) ${sg(b)} = ${E.pt(P([m * n, 0]))} ${na(n)} ${sg(b)}. Match the constants: ${m * b} + a = ${n === 1 ? '' : n === -1 ? '−' : n}a ${sg(b)}, so ${1 - n === 1 ? '' : 1 - n === -1 ? '−' : 1 - n}a = ${b - m * b} and a = ${a}.`); }
      if (kind === 1) { const m = R.pick([2, 3, -2, 4, -1]), c = nz(R, -6, 6), g = [R.pick([1, 1, -1, 2]), R.int(-4, 4), R.int(-5, 5)], h = addCo(g.map(v => v * m), [c]);
        return E.num(`${M('f(x)=' + P([m, c]))} and ${M('f(g(x))=' + P(h))}. Find ${M('g(x)')}.`, [{ label: 'g(x) =', expr: P(g), form: 'expanded' }],
          `f(g(x)) = ${m}·g(x) ${sg(c)}. So ${m}·g(x) = ${E.pt(P(addCo(h, [-c])))} and g(x) = ${E.pt(P(g))}.`.replace('+ 0.', '.')); }
      const p = R.pick([1, 2, 3, -1]), q = R.int(-5, 5), cc = R.int(-6, 6), t = R.int(0, 5), K = t * t + cc, sol = t === 0 ? [fs(-q, p)] : [fs(t - q, p), fs(-t - q, p)];
      return E.num(`${M(`f(x)=x^2${pm(cc)}`)} and ${M('g(x)=' + P([p, q]))}. Solve ${M(`f(g(x))=${K}`)}.`, [{ label: 'x =', set: sol }],
        `f(g(x)) = (${E.pt(P([p, q]))})² ${sg(cc)} = ${K}, so (${E.pt(P([p, q]))})² = ${t * t}${t ? ` and ${E.pt(P([p, q]))} = ±${t}` : ''}: x = ${sol.map(E.pt).join(' or ')}.`.replace(' + 0 =', ' =')); } },
    f: { t: 'iterate and find the pattern', g: R => {
      if (R.bool()) { const which = R.bool(), N = R.int(10, 2030); let a; do a = R.int(-5, 6); while ([-1, 0, 1].includes(a));
        const step = ([n, d]) => { const [u, v] = which ? [d, d - n] : [n - d, n + d]; const g = E.gcd(Math.abs(u), Math.abs(v)) || 1, s = v < 0 ? -1 : 1; return [s * u / g, s * v / g]; };
        const orb = [[a, 1]]; for (let i = 0; i < (which ? 3 : 4); i++) orb.push(step(orb[orb.length - 1]));
        const per = which ? 3 : 4, r = N % per, [n, d] = orb[r], show = ([u, v]) => fs(u, v).replace('-', '−');
        return E.num(`Let ${M(which ? 'f(x)=1/(1-x)' : 'f(x)=(x-1)/(x+1)')}. Start with ${a}, then apply f again and again, ${N} times in all. What number do you get?`, [numF(n, d)],
          `The values go ${orb.slice(0, per + 1).map(show).join(' → ')}: they repeat every ${per} steps. ${N} = ${per}·${(N - r) / per} + ${r}, ${r ? `so the answer matches step ${r}: ${show([n, d])}` : `so you are back at the start: ${a}`}.`); }
      let m, b1, b2, c; do { m = R.pick([2, 3, 4, 5]); b1 = nz(R, -5, 5); c = b1 * (m + 1); b2 = c / (1 - m); } while (!Number.isInteger(b2) || Math.abs(c) > 30);
      const k = R.int(0, 2), vals = [...new Set([m * k + b1, -m * k + b2])];
      return E.num(`f is a linear function and ${M(`f(f(x))=${m * m}x${pm(c)}`)}. Find all possible values of ${M(`f(${k})`)}.`, [{ label: lb(`f(${k}) =`), set: vals.map(String) }],
        `Write f(x) = ax + b: f(f(x)) = a²x + (a + 1)b. So a² = ${m * m}, a = ±${m}, and (a + 1)b = ${c}. a = ${m} gives b = ${b1}; a = −${m} gives b = ${b2}. Then f(${k}) = ${vals.join(' or ')}.`); } },
  });

  /* IV.2.15 Inverse functions */
  const OPS = [['adds', 'subtracts'], ['subtracts', 'adds'], ['multiplies by', 'divides by'], ['divides by', 'multiplies by']];
  S('IV.2.15', 'Inverse functions', {
    a: { t: 'undo a function in words', g: R => { const add = R.int(0, 1), mul = R.int(2, 3), [i, j] = R.bool() ? [add, mul] : [mul, add], a = R.int(2, 9); let b; do b = R.int(2, 9); while (b === a);
      const d = (op, n) => `${op} ${n}`, bare = t => t.replace(/^adds/, 'add').replace(/^subtracts/, 'subtract').replace(/^multiplies/, 'multiply').replace(/^divides/, 'divide');
      const f1 = d(OPS[i][0], a), f2 = d(OPS[j][0], b), u1 = d(OPS[i][1], a), u2 = d(OPS[j][1], b);
      return E.choice(R, `A function f ${f1}, then ${f2}. What does ${M('f^(-1)')} do?`, `It ${u2}, then ${u1}.`, [`It ${u1}, then ${u2}.`, `It ${f2}, then ${f1}.`, `It ${d(OPS[i][1], b)}, then ${d(OPS[j][1], a)}.`],
        `Undo the last step first, like taking off shoes before socks: first ${bare(u2)}, then ${bare(u1)}.`); } },
    b: { t: 'swap x and y and solve', g: R => { const kind = R.int(0, 3), m = R.pick([2, 3, 4, 5, -2, -3]), b = nz(R, -9, 9); let f, inv, why;
      if (kind === 0) { f = P([m, b]); const top = m > 0 ? `x${pm(-b)}` : `${b}-x`; inv = `(${top})/${Math.abs(m)}`; why = `x = ${E.pt(P([m, b], 'y'))} → ${Math.abs(m)}y = ${E.pt(top)} → y = (${E.pt(top)})/${Math.abs(m)}.`; }
      else if (kind === 1) { const k = Math.abs(m); f = `(x${pm(b)})/${k}`; inv = P([k, -b]); why = `x = (y ${sg(b)})/${k} → ${k}x = y ${sg(b)} → y = ${E.pt(P([k, -b]))}.`; }
      else if (kind === 2) { f = `x^3${pm(b)}`; inv = `cbrt(x${pm(-b)})`; why = `x = y³ ${sg(b)} → y³ = ${E.pt(`x${pm(-b)}`)} → y = ∛(${E.pt(`x${pm(-b)}`)}).`; }
      else { const k = Math.abs(m); f = `${k}(x${pm(b)})`; inv = `x/${k}${pm(-b)}`; why = `x = ${k}(y ${sg(b)}) → x/${k} = y ${sg(b)} → y = x/${k} ${sg(-b)}.`; }
      return E.num(`Find the inverse of ${M('f(x)=' + f)}.`, [{ label: 'f⁻¹(x) =', expr: inv }], `Swap x and y, then solve for y: ${why}`); } },
    c: { t: 'reflect over y = x', g: R => { const p = R.int(-6, 6); let q; do q = R.int(-6, 6); while (q === p); const kind = R.int(0, 2);
      if (kind === 0) return E.num(`The point ${pt(p, q)} is on the graph of f. Which point must be on the graph of ${M('f^(-1)')}?`, [{ point: [String(q), String(p)] }], `Reflecting over y = x swaps the coordinates: ${pt(p, q)} → ${pt(q, p)}.`);
      if (kind === 1) return E.num(`${M(`f(${p})=${q}`)}. What is ${M(`f^(-1)(${q})`)}?`, [{ ans: p }], `f sends ${p} to ${q}, so f⁻¹ sends ${q} back to ${p}.`);
      const m = R.pick([2, 3, -2, -3, 4, -4]), b = R.int(-4, 4), x0 = R.int(-3, 3), y0 = m * x0 + b;
      return E.num(`The graph shows the line ${M('f(x)=' + P([m, b]))} through ${pt(x0, y0)}. Its inverse is the mirror image over ${M('y=x')}. What is the slope of ${M('f^(-1)')}?`, [numF(1, m)],
        `Reflecting swaps x and y, so rise and run swap: the slope ${m} becomes 1/${par(m)} = ${fs(1, m).replace('-', '−')}.`, { visual: V.graph({ x: [-6, 6], y: [-6, 6], w: 300, h: 300, ticks: 1, fns: [{ f: x => m * x + b, color: C.blue, label: 'f', lx: labelX(x => m * x + b, [4.5, -4.5, 3, -3, 1.5]) }, { f: x => x, color: C.muted, dash: true }], points: [[x0, y0]], label: 'line and y = x' }) }); } },
    d: { t: 'verify f(f⁻¹(x)) = x', g: R => { const a = R.pick([2, 3, 4, 5]), b = nz(R, -7, 7), ok = R.bool(), kind = R.int(0, 2);
      const gs = [[`(x${pm(-b)})/${a}`, [1, 0]], [`(x${pm(b)})/${a}`, [1, 2 * b]], [`x/${a}${pm(-b)}`, [1, b - a * b]], [P([a, -b]), [a * a, -a * b + b]]];
      const [g, res] = ok ? gs[0] : gs[1 + kind];
      return E.choiceFixed(`Are ${M('f(x)=' + P([a, b]))} and ${M('g(x)=' + g)} inverses of each other?`, ['Yes', 'No'], ok ? 0 : 1,
        `f(g(x)) = ${a}·g(x) ${sg(b)} = ${E.pt(P(res))}${ok ? '. Also g(f(x)) = x, so yes.' : ', which is not x. So no.'}`); } },
  });
})(typeof window !== 'undefined' ? window : globalThis);
