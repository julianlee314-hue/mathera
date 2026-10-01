/* Era IV · Unit IV.7 Quadratics (IV.7.01–IV.7.17) — the pilot unit and the pattern for the rest */
(function (G) {
  const E = G.E4, V = E.V, C = E.C, M = s => E.mx(s);
  const nz = (R, lo, hi) => { let v; do v = R.int(lo, hi); while (v === 0); return v; };
  const sg = n => n < 0 ? `− ${-n}` : `+ ${n}`;                     // "+ 3" / "− 3" for building text
  const vtx = (a, h, k) => `${a === 1 ? '' : a === -1 ? '-' : a}(x${h > 0 ? '-' + h : h < 0 ? '+' + -h : ''})^2${k ? (k > 0 ? '+' + k : k) : ''}`.replace('(x)^2', 'x^2');
  const std = (a, b, c) => E.poly([a, b, c]);
  const fac = (a, r, s) => { const A = a === 1 ? '' : a === -1 ? '-' : String(a); if (r === s) return `${A}${r === 0 ? 'x^2' : E.lin(r) + '^2'}`; if (s === 0) [r, s] = [s, r]; return `${A}${E.lin(r)}${E.lin(s)}`; };
  const pt = (x, y) => `(${x}, ${y})`;
  const Q = (a, b, c) => x => a * x * x + b * x + c;
  // small parabola picture, window chosen around the vertex
  const pic = (a, b, c, o = {}) => { const h = -b / (2 * a), k = Q(a, b, c)(h); const x0 = Math.floor(h - 5), x1 = Math.ceil(h + 5);
    const ys = [k, Q(a, b, c)(x0), Q(a, b, c)(x1), 0]; const y0 = Math.max(Math.min(...ys) - 1, k - 12), y1 = Math.min(Math.max(...ys) + 1, k + 12);
    return V.graph({ x: [x0, x1], y: [Math.floor(Math.min(y0, -1)), Math.ceil(Math.max(y1, 1))], w: o.w || 300, h: o.h || 260, fns: [{ f: Q(a, b, c), color: o.color || C.blue }], points: o.points || [], label: o.label || 'graph of a parabola' }); };
  // distinct wrong parabolas for "which graph" questions
  const graphChoice = (R, a, b, c, prompt, explain) => {
    const alts = [[-a, -b, -c], [a, -b, c], [a, b, c + (c > 0 ? -4 : 4)], [2 * a, b, c], [a, b + 4, c]].filter(([p, q, r]) => !(p === a && q === b && r === c));
    const picks = R.sample(alts, 3);
    const svg = (p, q, r) => V.graph({ x: [-6, 6], y: [-8, 8], w: 170, h: 170, labels: false, ticks: 1, fns: [{ f: Q(p, q, r), color: C.blue }], label: 'parabola' });
    const right = svg(a, b, c); const wrong = picks.map(p => svg(...p)).filter(s => s !== right);
    return E.choice(R, prompt, right, wrong, explain);
  };
  const S = (id, name, steps) => E.skill({ id, name, steps });
  const lin2 = (p, q) => q === 0 ? `${p === 1 ? '' : p}x` : `(${p === 1 ? '' : p}x${q > 0 ? '+' + q : q})`;   // (px + q)

  /* IV.7.01 Parabola features */
  S('IV.7.01', 'Parabola features', {
    a: { t: 'vertex', g: R => { const a = R.pick([1, -1, 2, -2, 1, -1]), h = R.int(-4, 4), k = R.int(-6, 6), b = -2 * a * h, c = a * h * h + k;
      return E.num(`The graph shows ${M('y=' + std(a, b, c))}. What are the coordinates of the vertex?`, [{ point: [String(h), String(k)] }], `The vertex is the turning point: ${pt(h, k)}.`, { visual: pic(a, b, c) }); } },
    b: { t: 'axis of symmetry', g: R => { const a = nz(R, -2, 2), h = R.int(-5, 5), k = R.int(-5, 5);
      return E.num(`What is the axis of symmetry of ${M('y=' + vtx(a, h, k))}? Give the equation of the line.`, [{ eqn: `x=${h}` }], `The axis is the vertical line through the vertex: x = ${h}.`); } },
    c: { t: 'opens up or down', g: R => { const a = nz(R, -5, 5), b = R.int(-6, 6), c = R.int(-9, 9), form = R.pick(['std', 'vtx', 'fac']);
      const eq = form === 'std' ? std(a, b, c) : form === 'vtx' ? vtx(a, R.int(-4, 4), R.int(-6, 6)) : fac(a, R.int(-4, 4), R.int(-4, 4));
      return E.choiceFixed(`Does the parabola ${M('y=' + eq)} open up or down?`, ['up', 'down'], a > 0 ? 0 : 1, `The sign of a decides: a = ${a} is ${a > 0 ? 'positive, so it opens up' : 'negative, so it opens down'}.`); } },
    d: { t: 'intercepts', g: R => { const r = R.int(-5, 5); let s; do s = R.int(-5, 5); while (s === r); const a = R.pick([1, 1, -1]), b = -a * (r + s), c = a * r * s;
      const lo = Math.min(r, s), hi = Math.max(r, s);
      return E.num(`For ${M('y=' + std(a, b, c))}, find the x-intercepts and the y-intercept.`, [{ label: 'x-intercepts', set: [String(r), String(s)] }, { label: 'y-intercept', ans: c }],
        `Setting y = 0 gives ${M(std(a, b, c) + '=0')}, which factors as ${M(fac(a, r, s) + '=0')}, so x = ${lo} or x = ${hi}. Setting x = 0 gives y = ${c}.`); } },
  });

  /* IV.7.02 Graph vertex form */
  S('IV.7.02', 'Graph vertex form', {
    a: { t: 'read (h, k)', g: R => { const a = R.pick([1, -1, 2, -3, 0.5]), h = R.int(-6, 6), k = R.int(-7, 7);
      return E.num(`What is the vertex of ${M('y=' + vtx(a, h, k))}?`, [{ point: [String(h), String(k)] }], `y = a(x − h)² + k has vertex (h, k). Watch the sign inside the bracket: the vertex is ${pt(h, k)}.`); } },
    b: { t: 'effect of a', g: R => { const kind = R.int(0, 2), as = kind === 0 ? R.pick(['2', '3', '4', '5', '6', '10', '1.5', '2.5', '3/2', '5/2']) : kind === 1 ? R.pick(['1/2', '1/3', '1/4', '1/5', '2/3', '3/4', '0.5', '0.2', '0.1']) : R.pick(['-1', '-2', '-3', '-1/2', '-4', '-1/3']);
      const a = E.value(as)[0], h = R.int(-4, 4), k = R.int(-5, 5), base = vtx(1, h, k), inner = base.replace(/^\(?x/, m => m).replace(/\^2.*$/, '^2');
      const opts = [`narrower than ${E.pt('y=' + base)}`, `wider than ${E.pt('y=' + base)}`, 'flipped upside down'];
      const ans = kind;
      return E.choiceFixed(`Compared with ${M('y=' + base)}, the graph of ${M('y=' + (as.includes('/') ? '(' + as + ')' : as) + inner + (k ? (k > 0 ? '+' + k : k) : ''))} is…`, opts, ans, a < 0 ? 'A negative a flips the parabola so it opens down.' : Math.abs(a) > 1 ? '|a| > 1 stretches it vertically, so it looks narrower.' : '0 < |a| < 1 squashes it, so it looks wider.'); } },
    c: { t: 'plot symmetric points', g: R => { const a = nz(R, -2, 2), h = R.int(-3, 3), k = R.int(-5, 5), d = R.int(1, 4), x1 = h - d, y1 = a * d * d + k;
      return E.num(`The parabola ${M('y=' + vtx(a, h, k))} passes through ${pt(x1, y1)}. Which other point has the same y-value?`, [{ point: [String(h + d), String(y1)] }], `Points mirror across the axis x = ${h}. ${x1} is ${d} to the left, so its partner is ${d} to the right: ${pt(h + d, y1)}.`.replace(/x = -/, 'x = −')); } },
    d: { t: 'sketch', g: R => { const a = R.pick([1, -1]), h = R.int(-3, 3), k = R.int(-4, 4);
      return graphChoice(R, a, -2 * a * h, a * h * h + k, `Which graph shows ${M('y=' + vtx(a, h, k))}?`, `Vertex ${pt(h, k)}, opening ${a > 0 ? 'up' : 'down'}.`); } },
    e: { t: 'a number inside the bracket', g: R => { const p = R.pick([2, 3, 4, 5]), h = nz(R, -5, 5), k = R.int(-9, 9), A = R.pick([1, 1, -1, 2, 3]), q = p * h, flip = R.bool();
      const inner = flip ? `(${q}-${p}x)` : `(${p}x${q > 0 ? '-' + q : '+' + -q})`;
      return E.num(`What is the vertex of ${M(`y=${A === 1 ? '' : A === -1 ? '-' : A}${inner}^2${k ? (k > 0 ? '+' + k : k) : ''}`)}?`, [{ point: [String(h), String(k)] }], `The square is smallest (0) when ${p}x = ${q}, so x = ${h}, not ${q}. The vertex is ${pt(h, k)}.`); } },
    f: { t: 'the lowest vertex', g: R => { const m = R.pick([1, 1, 2]), t0 = nz(R, -4, 4), c = R.int(-8, 8), b = -2 * m * t0, kmin = c - m * t0 * t0;
      const tl = `${b > 0 ? '+' : ''}${b}t${c ? (c > 0 ? '+' + c : c) : ''}`, ky = `${m === 1 ? '' : m}t^2${tl}`;
      return E.num(`For each number t, ${M(`y=x^2-2tx+${m + 1}t^2${tl}`)} is a parabola. As t changes, which of these vertices is lowest? Give its coordinates.`, [{ point: [String(t0), String(kmin)] }], `Completing the square gives ${M('y=(x-t)^2+' + ky)}, so the vertex is (t, ${E.pt(ky)}). That height is smallest at t = ${t0}, giving ${pt(t0, kmin)}.`); } },
  });

  /* IV.7.03 Graph standard form */
  S('IV.7.03', 'Graph standard form', {
    a: { t: 'x = −b/2a', g: R => { const a = nz(R, -3, 3), h = R.int(-5, 5), b = -2 * a * h, c = R.int(-9, 9);
      return E.num(`What is the x-coordinate of the vertex of ${M('y=' + std(a, b, c))}?`, [{ ans: h }], `x = −b/(2a) = ${-b}/${2 * a} = ${h}.`); } },
    b: { t: 'find the vertex', g: R => { const a = nz(R, -2, 2), h = R.int(-4, 4), k = R.int(-8, 8), b = -2 * a * h, c = a * h * h + k;
      return E.num(`Find the vertex of ${M('y=' + std(a, b, c))}.`, [{ point: [String(h), String(k)] }], `x = −b/(2a) = ${h}; then y = ${a === 1 ? '' : a === -1 ? '-' : a}(${h})²${b ? ` ${sg(b)}(${h})` : ''}${c ? ` ${sg(c)}` : ''} = ${k}.`); } },
    c: { t: 'y-intercept c', g: R => { const a = nz(R, -4, 4), b = R.int(-8, 8), c = R.int(-12, 12);
      return E.num(`Where does ${M('y=' + std(a, b, c))} cross the y-axis? Give the point.`, [{ point: ['0', String(c)] }], `At x = 0 every x-term vanishes, leaving y = c = ${c}.`); } },
    d: { t: 'sketch', g: R => { const a = R.pick([1, -1]), h = R.int(-3, 3), k = R.int(-4, 4), b = -2 * a * h, c = a * h * h + k;
      return graphChoice(R, a, b, c, `Which graph shows ${M('y=' + std(a, b, c))}?`, `Vertex at x = −b/(2a) = ${h}, y-intercept ${c}, opening ${a > 0 ? 'up' : 'down'}.`); } },
  });

  /* IV.7.04 Graph factored form */
  S('IV.7.04', 'Graph factored form', {
    a: { t: 'read the zeros', g: R => { const r = R.int(-7, 7); let s; do s = R.int(-7, 7); while (s === r); const a = R.pick([1, 2, -1, 3, -2]);
      return E.num(`What are the zeros of ${M('y=' + fac(a, r, s))}?`, [{ set: [String(r), String(s)] }], `Each factor is 0 at one zero: x = ${r} and x = ${s}.`); } },
    b: { t: 'vertex halfway between', g: R => { const r = R.int(-6, 4), s = r + 2 * R.int(1, 4), a = R.pick([1, -1, 2]); const h = (r + s) / 2, k = a * (h - r) * (h - s);
      return E.num(`Find the vertex of ${M('y=' + fac(a, r, s))}.`, [{ point: [String(h), String(k)] }], `The vertex sits halfway between the zeros: x = (${r} + ${s})/2 = ${h}; then y = ${k}.`); } },
    c: { t: 'direction from a', g: R => { const a = nz(R, -4, 4), r = R.int(-5, 5), s = R.int(-5, 5);
      return E.choiceFixed(`Does ${M('y=' + fac(a, r, s))} open up or down?`, ['up', 'down'], a > 0 ? 0 : 1, `Expanding gives a leading coefficient of ${a}, so it opens ${a > 0 ? 'up' : 'down'}.`); } },
    d: { t: 'sketch', g: R => { const r = R.int(-4, 1), s = r + R.int(2, 5), a = R.pick([1, -1]);
      return graphChoice(R, a, -a * (r + s), a * r * s, `Which graph shows ${M('y=' + fac(a, r, s))}?`, `It crosses the x-axis at ${r} and ${s} and opens ${a > 0 ? 'up' : 'down'}.`); } },
  });

  /* IV.7.05 Convert quadratic forms */
  S('IV.7.05', 'Convert quadratic forms', {
    a: { t: 'vertex to standard', g: R => { const a = R.pick([1, 1, 2, -1, 3]), h = R.int(-5, 5), k = R.int(-9, 9);
      return E.num(`Write ${M('y=' + vtx(a, h, k))} in standard form ${M('y=ax^2+bx+c')}.`, [{ label: 'y =', expr: std(a, -2 * a * h, a * h * h + k), form: 'expanded' }], `Square first, then multiply by a, then add k: ${M('y=' + std(a, -2 * a * h, a * h * h + k))}.`); } },
    b: { t: 'factored to standard', g: R => { const a = R.pick([1, 1, 2, -1]), r = R.int(-6, 6), s = R.int(-6, 6);
      return E.num(`Expand ${M('y=' + fac(a, r, s))} into standard form.`, [{ label: 'y =', expr: std(a, -a * (r + s), a * r * s), form: 'expanded' }], `Multiply out the brackets${a === 1 ? '' : `, then multiply by ${a}`}: ${M('y=' + std(a, -a * (r + s), a * r * s))}.`); } },
    c: { t: 'standard to factored', g: R => { const r = R.int(-8, 8); let s; do s = R.int(-8, 8); while (s === r || s === -r && R.bool(0.7)); const a = R.pick([1, 1, 1, 2]);
      return E.num(`Factor ${M(std(a, -a * (r + s), a * r * s))} completely.`, [{ expr: fac(a, r, s), form: 'complete' }], (r * s === 0 ? `Every term has a factor of ${a === 1 ? '' : a}x, so take it out: ${M(fac(a, r, s))}.` : `Two numbers with product ${r * s} and sum ${-(r + s)}${a !== 1 ? ' (after taking out ' + a + ')' : ''}: ${M(fac(a, r, s))}.`.replace(/(product |sum )-/g, '$1−'))); } },
    d: { t: 'what each form shows best', g: R => { const ask = R.int(0, 2), a = R.pick([1, 2, -1, 3]), r = nz(R, -5, 5); let s; do s = nz(R, -5, 5); while (s === r || s === -r); const h = (r + s) / 2, k = a * (h - r) * (h - s);
      const forms = [vtx(a, h, k), fac(a, r, s), std(a, -a * (r + s), a * r * s)];
      const q = ['its vertex', 'its x-intercepts', 'its y-intercept'][ask];
      return E.choiceFixed(`These are three ways to write the same parabola. Which one shows ${q} without any working?`, forms.map(f => M('y=' + f)), ask, [`Vertex form shows the vertex ${pt(h, k)}.`, `Factored form shows the zeros ${r} and ${s}.`.replace(/(zeros |and )-/g, '$1−'), `Standard form shows the y-intercept ${a * r * s}.`][ask]); } },
  });

  /* IV.7.06 Solve by square roots */
  S('IV.7.06', 'Solve by square roots', {
    a: { t: 'isolate x²', g: R => { const a = R.pick([1, 2, 3, 4, 5]), r = R.int(1, 9), c = R.int(-20, 20), rhs = a * r * r + c;
      return E.num(`Solve ${M(`${a === 1 ? '' : a}x^2${c ? (c > 0 ? '+' + c : c) : ''}=${rhs}`)}.`, [{ label: 'x =', set: [String(r), String(-r)] }], `Isolate: x² = ${r * r}, so x = ±${r}.`); } },
    b: { t: '± root', g: R => { let n; do n = R.int(2, 99); while (Number.isInteger(Math.sqrt(n)) && R.bool(0.7)); const [q, rr] = E.surd(1, n); const v = rr === 1 ? String(q) : `${q === 1 ? '' : q}sqrt(${rr})`;
      return E.num(`Solve ${M('x^2=' + n)}. Give exact answers.`, [{ label: 'x =', set: [v, '-' + v] }], `x = ±√${n}${rr !== n ? ' = ±' + E.pt(v) : ''}. Don't forget the negative root.`); } },
    c: { t: '(x − h)² = k', g: R => { const h = R.int(-6, 6), r = R.int(1, 7), perfect = R.bool(0.6), k = perfect ? r * r : R.pick([2, 3, 5, 7, 8, 12]);
      const root = perfect ? String(r) : (() => { const [q, rr] = E.surd(1, k); return `${q === 1 ? '' : q}sqrt(${rr})`; })();
      const sol = perfect ? [String(h + r), String(h - r)] : [`${h}+${root}`, `${h}-${root}`];
      return E.num(`Solve ${M(`(x${h > 0 ? '-' + h : h < 0 ? '+' + -h : ''})^2=${k}`)}. Give exact answers.`, [{ label: 'x =', set: sol }], `Take ± roots: x ${h > 0 ? '− ' + h : h < 0 ? '+ ' + -h : ''} = ±${E.pt(root)}, so x = ${sol.map(E.pt).join(' or ')}.`.replace('x  =', 'x =')); } },
    d: { t: 'no real solution cases', g: R => { const a = R.pick([1, 2, 3]), k = R.int(1, 9), c = R.int(-9, 9), has = R.bool(0.5);
      const rhs = has ? a * k * k + c : c - a * k, eq = `${a === 1 ? '' : a}x^2${c ? (c > 0 ? '+' + c : c) : ''}=${rhs}`, x2 = E.fracStr(rhs - c, a);
      return E.num(`Solve ${M(eq)} over the real numbers. Type "no solution" if there is none.`, [{ label: 'x =', set: has ? [String(k), String(-k)] : [] }],
        has ? `Isolating gives x² = ${k * k}, so x = ±${k}.` : `Isolating gives x² = ${x2}. No real number squares to a negative, so there is no real solution.`); } },
  });

  /* IV.7.07 Solve by factoring */
  S('IV.7.07', 'Solve by factoring', {
    a: { t: 'set equal to zero', g: R => { const r = R.int(-6, 6); let s; do s = R.int(-6, 6); while (s === r); const b = -(r + s), c = r * s;
      if (c === 0) return E.num(`Rewrite ${M(`x^2=${E.poly([-b, 0])}`)} so the right side is 0. What is the left side?`, [{ label: 'left side =', expr: std(1, b, 0), form: 'expanded' }], `Move ${E.pt(E.poly([-b, 0]))} to the left: ${M(std(1, b, 0) + '=0')}.`);
      return E.num(`Rewrite ${M(`${E.poly([1, b, 0])}=${-c}`)} so the right side is 0. What is the left side?`, [{ label: 'left side =', expr: std(1, b, c), form: 'expanded' }], `Move ${-c} to the left: ${M(std(1, b, c) + '=0')}.`.replace('Move -', 'Move −')); } },
    b: { t: 'factor', g: R => { const r = R.int(-9, 9); let s; do s = R.int(-9, 9); while (s === r); const a = R.pick([1, 1, 1, 2, 3]);
      return E.num(`Factor ${M(std(a, -a * (r + s), a * r * s))}.`, [{ expr: fac(a, r, s), form: 'complete' }], `${M(fac(a, r, s))}. Check by expanding.`); } },
    c: { t: 'zero product property', g: R => { let p, q, rr, s; do { p = R.pick([1, 2, 3, 1]); q = R.int(-7, 7); rr = R.pick([1, 1, 2]); s = R.int(-7, 7); } while (q * rr === s * p);
      if (s === 0) [p, q, rr, s] = [rr, s, p, q];
      const inn = (m, n) => `${m === 1 ? '' : m}x${n ? (n > 0 ? '+' + n : n) : ''}`, i1 = inn(p, q), i2 = inn(rr, s), f1 = q ? `(${i1})` : i1, f2 = `(${i2})`;
      return E.num(`Solve ${M(f1 + f2 + '=0')}.`, [{ label: 'x =', set: [E.fracStr(-q, p), E.fracStr(-s, rr)] }], `A product is 0 only when a factor is 0: ${M(i1 + '=0')} or ${M(i2 + '=0')}.`); } },
    d: { t: 'check both roots', g: R => { const r = R.int(-6, 6); let s; do s = R.int(-6, 6); while (s === r); const b = -(r + s), c = r * s; let w; do w = R.int(-6, 6); while (w === r || w === s);
      const ok = R.bool(0.5), ask = ok ? R.pick([r, s]) : w;
      return E.tf(`Is x = ${ask} a solution of ${M(std(1, b, c) + '=0')}?`.replace('= -', '= −'), ok, `Substitute: ${ask < 0 ? `(${ask})` : ask}²${b ? ` ${b < 0 ? '−' : '+'} ${Math.abs(b) === 1 ? (ask < 0 ? `(${ask})` : ask) : `${Math.abs(b)}·(${ask})`}` : ''}${c ? ' ' + sg(c) : ''} = ${ask * ask + b * ask + c}${ok ? ', which is 0.' : ', not 0.'}`, { choices: ['Yes', 'No'] }); } },
    e: { t: 'rearrange, then factor', g: R => { let r, s, a, b, k;
      do { r = R.int(-7, 7); s = R.int(-7, 7); a = nz(R, -6, 6); b = -(r + s) - a; k = a * b - r * s; } while (r === s || k === 0 || b === 0);
      return E.num(`Solve ${M(`${E.lin(-a)}${E.lin(-b)}=${k}`)}.`, [{ label: 'x =', set: [String(r), String(s)] }], `The product isn't 0 yet, so expand and move ${k}: ${M(std(1, -(r + s), r * s) + '=0')}, which factors as ${M(fac(1, r, s) + '=0')}. So x = ${r} or x = ${s}.`); } },
    f: { t: 'a quadratic in disguise', g: R => { const kind = R.int(0, 1), m = R.int(1, 5); let n; do n = R.int(1, 6); while (n === m);
      if (kind === 0) { const u1 = m * m, u2 = n * n;
        return E.num(`Solve ${M(`x^4${-(u1 + u2) < 0 ? '-' : '+'}${u1 + u2}x^2+${u1 * u2}=0`)}.`, [{ label: 'x =', set: [String(m), String(-m), String(n), String(-n)] }], `Let u = x²: ${M(`u^2-${u1 + u2}u+${u1 * u2}=0`)} gives u = ${u1} or u = ${u2}, so x = ±${m} or x = ±${n}. Four solutions.`); }
      const u1 = m * m, u2 = -n * n;   // one positive and one negative value of u
      return E.num(`Solve ${M(`x^4${u1 + u2 > 0 ? '-' : '+'}${Math.abs(u1 + u2) === 1 ? '' : Math.abs(u1 + u2)}x^2-${-u1 * u2}=0`.replace('+x^2', '+x^2').replace(/[+-]0x\^2/, ''))} over the real numbers.`, [{ label: 'x =', set: [String(m), String(-m)] }], `Let u = x²: u = ${u1} or u = ${u2}. x² = ${u2} has no real solution, so only x = ±${m}.`); } },
  });

  /* IV.7.08 Completing the square */
  S('IV.7.08', 'Completing the square', {
    a: { t: 'half b, square it', g: R => { const b = nz(R, -24, 24);
      return E.num(`What number completes the square: ${M(E.poly([1, b, 0]) + '+□')}?`, [b % 2 ? { frac: [b * b, 4], form: 'improper' } : { ans: (b / 2) ** 2 }], `Half of ${b} is ${b % 2 ? b + '/2' : b / 2}; squared, ${b % 2 ? b * b + '/4' : (b / 2) ** 2}. Then ${M(`${E.poly([1, b, 0])}+${b % 2 ? b * b + '/4' : (b / 2) ** 2}=(x${b > 0 ? '+' : '-'}${b % 2 ? Math.abs(b) + '/2' : Math.abs(b / 2)})^2`)}.`.replace(/Half of -/, 'Half of −').replace(/is -/, 'is −')); } },
    b: { t: 'add to both sides', g: R => { const h = nz(R, -7, 7), b = -2 * h, k = R.int(1, 30), c0 = k - h * h;
      return E.num(`Complete the square: ${M(`x^2${b > 0 ? '+' : ''}${b}x=${c0}`)} becomes ${M(`(x${-h > 0 ? '+' : ''}${-h})^2=□`)}. What goes in the box?`, [{ ans: k }], `Add (b/2)² = ${h * h} to both sides: ${c0} + ${h * h} = ${k}.`); } },
    c: { t: 'with a ≠ 1', g: R => { const a = R.pick([2, 3, 4, 5]), h = nz(R, -5, 5), k = R.int(-9, 9);
      return E.num(`Write ${M('y=' + std(a, -2 * a * h, a * h * h + k))} in vertex form by completing the square.`, [{ label: 'y =', expr: vtx(a, h, k), form: 'vertex' }], `Factor ${a} out of the x-terms, complete the square inside, and balance: ${M('y=' + vtx(a, h, k))}.`); } },
    d: { t: 'solve', g: R => { const h = nz(R, -6, 6), perfect = R.bool(0.4), r = R.int(1, 6), k = perfect ? r * r : R.pick([2, 3, 5, 6, 7, 10, 11]);
      const b = -2 * h, c = h * h - k; const rt = perfect ? String(r) : `sqrt(${k})`; const sol = perfect ? [String(h + r), String(h - r)] : [`${h}+sqrt(${k})`, `${h}-sqrt(${k})`];
      return E.num(`Solve ${M(std(1, b, c) + '=0')} by completing the square. Give exact answers.`, [{ label: 'x =', set: sol }], `${M(`(x${-h > 0 ? '+' : ''}${-h})^2=${k}`)}, so x = ${h} ± ${E.pt(rt)}${perfect ? `, which is ${h + r} or ${h - r}` : ''}.`.replace('= -', '= −')); } },
    e: { t: 'odd b: fractions inside', g: R => { let b, c, D; do { b = R.pick([-9, -7, -5, -3, -1, 1, 3, 5, 7, 9]); c = R.int(-9, 9); D = b * b - 4 * c; } while (D <= 0 || Number.isInteger(Math.sqrt(D)));
      const s1 = E.surdStr(-b, 1, D, 2), s2 = E.surdStr(-b, -1, D, 2);
      return E.num(`Solve ${M(std(1, b, c) + '=0')} by completing the square. Give exact answers.`, [{ label: 'x =', set: [s1, s2] }], `Move ${c} across and add (${b}/2)² = ${b * b}/4: ${M(`(x${b > 0 ? '+' : '-'}${Math.abs(b)}/2)^2=${D}/4`)}. Taking ± roots, x = ${E.pt(s1)} or x = ${E.pt(s2)}.`); } },
    f: { t: 'two squares at once', g: R => { const A = R.pick([1, 1, 2, 3]), h = nz(R, -5, 5), j = nz(R, -4, 4), m = R.int(-6, 12), d = m + h * h + A * j * j, sgn = n => (n > 0 ? '+' : '') + n;
      const ex = `x^2+${A === 1 ? '' : A}y^2${sgn(-2 * h)}x${sgn(-2 * A * j)}y${d ? sgn(d) : ''}`;
      return E.num(`What is the smallest value of ${M(ex)}, and at which point (x, y) does it happen?`, [{ label: 'smallest value =', ans: m }, { label: '(x, y) =', point: [String(h), String(j)] }], `Complete the square in x and in y: ${M(`${E.lin(h)}^2+${A === 1 ? '' : A}${E.lin(j, 'y')}^2${m ? sgn(m) : ''}`)}. Squares are never negative, so the minimum is ${m}, at ${pt(h, j)}.`); } },
  });

  /* IV.7.09 Vertex form by completing */
  S('IV.7.09', 'Vertex form by completing', {
    a: { t: 'group x terms', g: R => { const a = R.pick([2, 3, -2, 4]), b = a * 2 * nz(R, -4, 4), c = R.int(-9, 9);
      return E.num(`To complete the square on ${M('y=' + std(a, b, c))}, first factor ${a} out of the x-terms: ${M(`y=${a}(x^2+□x)${c ? (c > 0 ? '+' + c : c) : ''}`)}. What goes in the box?`, [{ ans: b / a }], `${b}x ÷ ${a} = ${b / a}x, so the bracket is x² ${sg(b / a)}x.`); } },
    b: { t: 'complete the square', g: R => { const h = nz(R, -6, 6), k = R.int(-12, 12);
      return E.num(`Complete the square: write ${M('y=' + std(1, -2 * h, h * h + k))} as ${M('y=(x-h)^2+k')}.`, [{ label: 'y =', expr: vtx(1, h, k), form: 'vertex' }], `Half of ${-2 * h} is ${-h}: ${M('y=' + vtx(1, h, k))}.`); } },
    c: { t: 'balance the constant', g: R => { const a = R.pick([2, 3, 4, -2, -3]), h = nz(R, -4, 4), k = R.int(-9, 9), c = a * h * h + k;
      return E.num(`${M('y=' + std(a, -2 * a * h, c))} is rewritten as ${M(`y=${a}(x^2${-2 * h > 0 ? '+' : ''}${-2 * h}x+${h * h})+□`)}. What number balances it?`, [{ ans: c - a * h * h }], `The bracket added ${a}·${h * h} = ${a * h * h}, so subtract it: ${c} − (${a * h * h}) = ${k}.`); } },
    d: { t: 'read the vertex', g: R => { const a = R.pick([1, 2, -1, 3]), h = nz(R, -5, 5), k = R.int(-9, 9);
      return E.num(`Find the vertex of ${M('y=' + std(a, -2 * a * h, a * h * h + k))} by completing the square.`, [{ point: [String(h), String(k)] }], `${M('y=' + vtx(a, h, k))}, so the vertex is ${pt(h, k)}.`); } },
    e: { t: 'a vertex with fractions', g: R => { let a, b, c; do { a = R.pick([1, -1, 2, -2, 3]); b = nz(R, -9, 9); c = R.int(-9, 9); } while (b % (2 * a) === 0);
      const h = E.fracStr(-b, 2 * a), k = E.fracStr(4 * a * c - b * b, 4 * a), hin = E.fracStr(b, 2 * a);
      const vf = `${a === 1 ? '' : a === -1 ? '-' : a}(x${hin.startsWith('-') ? '' : '+'}${hin})^2${k === '0' ? '' : k.startsWith('-') ? k : '+' + k}`;
      return E.num(`Find the vertex of ${M('y=' + std(a, b, c))}. Give exact coordinates.`, [{ point: [h, k] }], `Completing the square gives ${M('y=' + vf)}, so the vertex is (${E.pt(h)}, ${E.pt(k)}).`); } },
    f: { t: 'pair the factors', g: R => { const p = R.int(-6, 2), g1 = R.int(1, 3), g2 = R.int(1, 4), q = p + g1, r = q + g2, s = r + g1, T = p + s, D = q * r - p * s, ans = E.fracStr(-D * D, 4);
      const roots = R.shuffle([p, q, r, s]).sort((x, y) => (x === 0 ? -1 : 0) - (y === 0 ? -1 : 0));
      const uu = n => n ? `(u ${sg(n)})` : 'u';
      return E.num(`What is the smallest value of ${M('f(x)=' + roots.map(z => E.lin(z)).join(''))}?`, [{ label: 'smallest value =', exact: ans }], `Pair the outer roots and the inner roots: ${M('f(x)=(' + std(1, -T, p * s) + ')(' + std(1, -T, q * r) + ')')}. With ${M('u=' + std(1, -T, 0))} this is ${uu(p * s)}${uu(q * r)}, a parabola in u whose zeros are ${D} apart, so its minimum is −(${D}/2)² = ${E.pt(ans)}.`); } },
  });

  /* IV.7.10 Quadratic formula */
  const qf = (R) => { for (;;) { const a = R.pick([1, 1, 2, 3, -1, 2]), b = R.int(-9, 9), c = R.int(-9, 9); const D = b * b - 4 * a * c; if (D > 0 && Math.sqrt(D) % 1 !== 0 && c !== 0) return { a, b, c, D }; } };
  S('IV.7.10', 'Quadratic formula', {
    a: { t: 'identify a, b, c', g: R => { const a = nz(R, -5, 5), b = R.int(-9, 9), c = nz(R, -9, 9); const lhs = R.bool() ? `${c}+${E.poly([b, 0]).replace(/^0$/, '0')}+${E.poly([a, 0, 0])}` : null;
      const eq = lhs ? `${E.poly([a, 0, 0])}${b ? (b > 0 ? '+' : '') + E.poly([b, 0]) : ''}=${-c}` : std(a, b, c) + '=0';
      return E.num(`Write ${M(eq)} as ${M('ax^2+bx+c=0')}. What are a, b and c?`, [{ label: 'a =', ans: a }, { label: 'b =', ans: b }, { label: 'c =', ans: c }], `In the form ${M(std(a, b, c) + '=0')}: a = ${a}, b = ${b}, c = ${c}.`.replace(/= -/g, '= −')); } },
    b: { t: 'substitute carefully', g: R => { const { a, b, c, D } = qf(R);
      return E.num(`For ${M(std(a, b, c) + '=0')}, what is the value of ${M('b^2-4ac')}?`, [{ ans: D }], `b² − 4ac = (${b})² − 4(${a})(${c}) = ${b * b} − (${4 * a * c}) = ${D}. Square the whole b, sign included.`); } },
    c: { t: 'simplify the radical', g: R => { const { a, b, c, D } = qf(R);
      const s1 = E.surdStr(-b, 1, D, 2 * a), s2 = E.surdStr(-b, -1, D, 2 * a);
      return E.num(`Solve ${M(std(a, b, c) + '=0')}. Give exact, simplified answers.`, [{ label: 'x =', set: [s1, s2] }], `x = (${-b} ± √${D})/${2 * a}, which simplifies to ${E.pt(s1)} and ${E.pt(s2)}.`); } },
    d: { t: 'rearrange first, then use the formula', g: R => { let { a, b, c, D } = qf(R); if (a < 0) { a = -a; b = -b; c = -c; }
      const form = b === 0 ? 1 : R.int(0, 2), t = R.int(0, 1);
      const eq = form === 0 ? `${E.poly([a, 0, 0])}=${E.poly([-b, -c])}` : form === 1 ? `${E.poly([a, b, 0])}=${-c}` : `x(${E.poly([a, b])})=${-c}`;
      const move = form === 0 ? `Move ${E.pt(E.poly([-b, -c]))} to the left` : form === 1 ? `Move ${-c} to the left` : `Expand x(${E.pt(E.poly([a, b]))}) = ${E.pt(E.poly([a, b, 0]))}, then move ${-c} to the left`;
      if (t === 0) return E.num(`Rearrange ${M(eq)} into ${M('ax^2+bx+c=0')} with a = ${a}. What are b and c?`, [{ label: 'b =', ans: b }, { label: 'c =', ans: c }], `${move}: ${M(std(a, b, c) + '=0')}, so b = ${b} and c = ${c}.`.replace(/= -/g, '= −'));
      const s1 = E.surdStr(-b, 1, D, 2 * a), s2 = E.surdStr(-b, -1, D, 2 * a);
      return E.num(`Solve ${M(eq)}. Give exact, simplified answers.`, [{ label: 'x =', set: [s1, s2] }], `${move}: ${M(std(a, b, c) + '=0')}. Then b² − 4ac = ${D}, so x = (${-b} ± √${D})/${2 * a}: ${E.pt(s1)} and ${E.pt(s2)}.`); } },
    e: { t: 'run the formula backwards', g: R => { let a, b, c, D; do { a = R.pick([1, 1, 2]); b = R.int(-9, 9); c = nz(R, -9, 9); D = b * b - 4 * a * c; } while (D <= 0 || Number.isInteger(Math.sqrt(D)));
      const s1 = E.surdStr(-b, 1, D, 2 * a), s2 = E.surdStr(-b, -1, D, 2 * a);
      return E.num(`The solutions of ${M((a === 1 ? '' : a) + 'x^2+bx+c=0')} are ${M('x=' + s1)} and ${M('x=' + s2)}. Find b and c.`, [{ label: 'b =', ans: b }, { label: 'c =', ans: c }], `The roots add to ${E.pt(E.fracStr(-b, a))} and multiply to ${E.pt(E.fracStr(c, a))}. They also add to ${a === 1 ? '−b' : '−b/' + a} and multiply to ${a === 1 ? 'c' : 'c/' + a}, so b = ${b} and c = ${c}.`); } },
    f: { t: 'surds in the coefficients', g: R => { const n = R.pick([2, 3, 5, 6, 7, 10, 11]);
      if (R.bool()) { const p = nz(R, -6, 6), pr = `${p === 1 ? '' : p === -1 ? '-' : p}sqrt(${n})`, P = Math.abs(p), sp = `√${n} ${p > 0 ? '+' : '−'} ${P}`, sm = `√${n} ${p > 0 ? '−' : '+'} ${P}`;
        return E.num(`Solve ${M(`x^2-(sqrt(${n})${p > 0 ? '+' : '-'}${P})x${p > 0 ? '+' : ''}${pr}=0`)}. Give exact answers.`, [{ label: 'x =', set: [String(p), `sqrt(${n})`] }], `b² − 4ac = (${sp})² − 4(${E.pt(pr)}) = (${sm})², a perfect square. So x = [(${sp}) ± (${sm})]/2 = √${n} or ${p}.`); }
      const k = R.int(1, 5), neg = R.bool(), cst = n - k * k, r0 = `${neg ? '-' : ''}sqrt(${n})`;
      return E.num(`Solve ${M(`x^2${neg ? '+' : '-'}2sqrt(${n})x${cst > 0 ? '+' : ''}${cst}=0`)}. Give exact answers.`, [{ label: 'x =', set: [`${r0}+${k}`, `${r0}-${k}`] }], `b² − 4ac = 4·${n} − 4(${cst}) = ${4 * k * k}, a perfect square. So x = (${neg ? '−' : ''}2√${n} ± ${2 * k})/2 = ${E.pt(r0)} ± ${k}.`); } },
  });

  /* IV.7.11 Discriminant */
  S('IV.7.11', 'Discriminant', {
    a: { t: 'b² − 4ac', g: R => { const a = nz(R, -5, 5), b = R.int(-10, 10), c = R.int(-10, 10);
      return E.num(`Find the discriminant of ${M(std(a, b, c) + '=0')}.`, [{ ans: b * b - 4 * a * c }], `b² − 4ac = ${b * b} − ${4 * a * c < 0 ? '(' + 4 * a * c + ')' : 4 * a * c} = ${b * b - 4 * a * c}.`); } },
    b: { t: 'two, one or no real roots', g: R => { const kind = R.int(0, 2); let a, b, c, D;
      do { a = nz(R, -4, 4); b = R.int(-8, 8); c = kind === 1 ? null : R.int(-9, 9); if (kind === 1) { const h = nz(R, -4, 4); b = -2 * a * h; c = a * h * h; } D = b * b - 4 * a * c; } while (Math.sign(D) !== [1, 0, -1][kind]);
      return E.choiceFixed(`How many real solutions does ${M(std(a, b, c) + '=0')} have?`, ['two', 'one', 'none'], kind, `The discriminant is ${D}${[', positive, so there are two real solutions', ', so there is one repeated solution', ', negative, so there are no real solutions'][kind]}.`); } },
    c: { t: 'rational vs irrational roots', g: R => { const want = R.int(0, 1); let a, b, c, D;
      do { a = R.pick([1, 2, 3]); b = R.int(-9, 9); c = R.int(-9, 9); D = b * b - 4 * a * c; } while (!(D >= 0 && (want === 0 ? Number.isInteger(Math.sqrt(D)) : !Number.isInteger(Math.sqrt(D)))));
      const rational = Number.isInteger(Math.sqrt(D));
      return E.choiceFixed(`The roots of ${M(std(a, b, c) + '=0')} are…`, ['rational', 'irrational'], rational ? 0 : 1, `b² − 4ac = ${D}${rational ? `, a perfect square, so the roots are rational.` : `, not a perfect square, so √${D} stays irrational.`}`); } },
    d: { t: 'link to the graph', g: R => { const kind = R.int(0, 2); let a, b, c, D;
      do { a = R.pick([1, -1, 2]); const h = R.int(-3, 3); b = -2 * a * h; c = a * h * h + (kind === 1 ? 0 : (kind === 0 ? -a : a) * R.int(1, 5)); D = b * b - 4 * a * c; } while (Math.sign(D) !== [1, 0, -1][kind]);
      return E.choiceFixed(`The graph shows ${M('y=' + std(a, b, c))}. What sign is its discriminant?`, ['positive', 'zero', 'negative'], kind, ['It crosses the x-axis twice, so D > 0.', 'It touches the x-axis once, so D = 0.', 'It never meets the x-axis, so D < 0.'][kind], { visual: pic(a, b, c) }); } },
    e: { t: 'find k for one root', g: R => { const kind = R.int(0, 2), b = 2 * nz(R, -7, 7), a = R.pick([1, 1, 2, 3]);
      if (kind === 0) { const k = b * b / (4 * a);
        return E.num(`For what value of k does ${M(`${a === 1 ? '' : a}x^2${b > 0 ? '+' : ''}${b}x+k=0`)} have exactly one solution?`, [{ label: 'k =', exact: E.fracStr(b * b, 4 * a) }], `One solution means b² − 4ac = 0: ${b * b} − ${4 * a}k = 0, so k = ${E.pt(E.fracStr(b * b, 4 * a))}.`); }
      const c = R.pick([1, 2, 3, 4, 6, 9]), lim = E.fracStr(b * b, 4 * c), two = kind === 1;
      return E.num(`For which values of k does ${M(`kx^2${b > 0 ? '+' : ''}${b}x+${c}=0`)} have ${two ? 'two' : 'no'} real solutions? (Assume k ≠ 0.)`, [{ interval: two ? `(-inf,0)U(0,${lim})` : `(${lim},inf)` }], `b² − 4ac = ${b * b} − ${4 * c}k must be ${two ? 'positive' : 'negative'}: k ${two ? '<' : '>'} ${E.pt(lim)}${two ? ', and k ≠ 0 or it stops being quadratic' : ''}.`); } },
    f: { t: 'a parameter everywhere', g: R => { let k1, k2, q, p, r;
      do { k1 = R.int(-8, 8); k2 = R.int(-8, 8); q = nz(R, -3, 3); p = (4 * q - (k1 + k2)) / 2; r = (p * p - k1 * k2) / 4; } while (k1 === k2 || !Number.isInteger(p) || !Number.isInteger(r) || Math.abs(p) > 12 || Math.abs(r) > 30);
      const bx = p ? `(k${p > 0 ? '+' : ''}${p})x` : 'kx', c0 = `${q === 1 ? '' : q === -1 ? '-' : q}k${r ? (r > 0 ? '+' : '') + r : ''}`;
      return E.num(`For which values of k does ${M(`x^2+${bx}${c0.startsWith('-') ? '' : '+'}${c0}=0`)} have a repeated root?`, [{ label: 'k =', set: [String(k1), String(k2)] }], `Set the discriminant to 0: ${M(`${p ? `(k${p > 0 ? '+' : ''}${p})` : 'k'}^2-4(${c0})=0`)} simplifies to ${M(std(1, -(k1 + k2), k1 * k2).replace(/x/g, 'k') + '=0')}, so k = ${k1} or k = ${k2}.`); } },
  });

  /* IV.7.12 Choosing a method */
  S('IV.7.12', 'Choosing a method', {
    a: { t: 'square roots when no b', g: R => { const yes = R.bool(), cf = k => k === 1 ? '' : String(k), sq = h => `(x${h > 0 ? '-' + h : '+' + -h})^2`;
      if (yes) { const kind = R.int(0, 2), a = R.pick([1, 2, 3, 4, 5]), h = nz(R, -6, 6), c = nz(R, -12, 12), v = R.pick([4, 9, 16, 25, 5, 7, 12, 20]);
        const eq = kind === 0 ? `${cf(a)}x^2${c > 0 ? '+' : ''}${c}=${a * v + c}` : kind === 1 ? `${sq(h)}=${v}` : `${cf(a)}${sq(h)}${c > 0 ? '+' : ''}${c}=${a * v + c}`;
        return E.tf(`Can you solve ${M(eq)} just by isolating the square and taking ± square roots?`, true, kind === 0 ? `Yes: there is no bx term. Isolate x² = ${v}, then x = ±${Number.isInteger(Math.sqrt(v)) ? Math.sqrt(v) : '√' + v}.` : `Yes: x only appears inside the squared bracket. Isolate it, ${E.pt(sq(h) + '=' + v)}, then take ± roots.`, { choices: ['Yes', 'No'] }); }
      let b, c; do { b = nz(R, -9, 9); c = R.int(-12, 12); } while (b * b === 4 * c);
      const moved = R.bool(), eq = moved ? `${E.poly([1, b, 0])}=${-c}` : std(1, b, c) + '=0';
      return E.tf(`Can you solve ${M(eq)} just by isolating the square and taking ± square roots?`, false, `No: it has a bx term (${E.pt(E.poly([b, 0]))}), so x² can't be isolated on its own. Factor, complete the square or use the formula.`, { choices: ['Yes', 'No'] }); } },
    b: { t: 'factoring when it factors', g: R => { const r = R.int(-9, 9), s = R.int(-9, 9), yes = R.bool();
      let b = -(r + s), c = r * s; if (!yes) { do { c = R.int(-12, 12); } while (Number.isInteger(Math.sqrt(Math.max(0, b * b - 4 * c)))); }
      const f = Number.isInteger(Math.sqrt(b * b - 4 * c)) && b * b - 4 * c >= 0;
      return E.choiceFixed(`Does ${M(std(1, b, c))} factor over the integers?`, ['Yes', 'No'], f ? 0 : 1, f ? `Yes: ${M(fac(1, (-b + Math.sqrt(b * b - 4 * c)) / 2, (-b - Math.sqrt(b * b - 4 * c)) / 2))}.` : `No: b² − 4c = ${b * b - 4 * c} is not a perfect square.`.replace('= -', '= −')); } },
    c: { t: 'formula always', g: R => { const { a, b, c } = qf(R); const d = 2;
      const r1 = (-b + Math.sqrt(b * b - 4 * a * c)) / (2 * a), r2x = (-b - Math.sqrt(b * b - 4 * a * c)) / (2 * a);
      return E.num(`Solve ${M(std(a, b, c) + '=0')} with the formula. Round to 2 decimal places.`, [{ label: 'larger x =', ans: Math.max(r1, r2x), dp: d }, { label: 'smaller x =', ans: Math.min(r1, r2x), dp: d }], `x = (${-b} ± √${b * b - 4 * a * c})/${2 * a} ≈ ${Math.max(r1, r2x).toFixed(2)} and ${Math.min(r1, r2x).toFixed(2)}.`); } },
    d: { t: 'justify the choice', g: R => { const r = R.int(1, 6), s = R.int(1, 6), n = R.pick([3, 5, 7, 11, 13, 18, 20]); let A, B, Cc; do { A = R.pick([2, 3, 5]); B = R.pick([1, 3, 5, 7]); Cc = -R.pick([1, 2, 3]); } while (Number.isInteger(Math.sqrt(B * B - 4 * A * Cc)));
      const reasons = ['There is no x-term, so take ± square roots.', 'It factors with small whole numbers, so factor.', 'It won\'t factor nicely, so use the quadratic formula.'];
      const D = B * B - 4 * A * Cc, eqs = [[`x^2=${n}`, 0, `No bx term: x = ±√${n}.`], [std(1, -(r + s), r * s) + '=0', 1, `${r * s} = ${r} × ${s} and ${r} + ${s} = ${r + s}, so it factors as ${E.pt(fac(1, r, s))}.`], [std(A, B, Cc) + '=0', 2, `b² − 4ac = ${D} is not a perfect square, so it won't factor.`]];
      const [eq, k, why] = R.pick(eqs);
      return E.choice(R, `Which is the best reason for how to solve ${M(eq)}?`, reasons[k], [...reasons.filter((_, j) => j !== k), 'Always complete the square first.'], why); } },
  });

  /* IV.7.13 Projectile motion */
  S('IV.7.13', 'Projectile motion', {
    a: { t: 'the height model', g: R => { const us = R.pick(['ft', 'm']), g = us === 'ft' ? 16 : 4.9, v = R.pick(us === 'ft' ? [32, 48, 64, 80] : [10, 15, 20, 25]), h0 = R.pick([0, 2, 5, 6, 10]), t = R.pick([1, 2]);
      const val = Math.round((-g * t * t + v * t + h0) * 10) / 10;
      return E.num(`A ball's height in ${us === 'ft' ? 'feet' : 'meters'} after t seconds is ${M(`h(t)=-${g}t^2+${v}t${h0 ? '+' + h0 : ''}`)}. What is h(${t})?`, [{ label: `h(${t}) =`, ans: val }], `h(${t}) = −${g}(${t * t}) + ${v}(${t})${h0 ? ' + ' + h0 : ''} = ${val} ${us}.`); } },
    b: { t: 'max height', g: R => { const v = 16 * R.int(1, 8), h0 = R.int(0, 12); const tp = v / 32, hm = -16 * tp * tp + v * tp + h0;
      return E.num(`A ball's height in feet is ${M(`h(t)=-16t^2+${v}t${h0 ? '+' + h0 : ''}`)}. What is its maximum height?`, [{ label: 'max height =', ans: hm }], `The peak is at t = −b/(2a) = ${v}/32 = ${tp} s; h(${tp}) = ${hm} ft.`); } },
    c: { t: 'time to land', g: R => { const T = R.int(1, 15), v = 16 * T, h0 = 0;
      return E.num(`A ball is launched from the ground with ${M(`h(t)=-16t^2+${v}t`)} (feet, seconds). When does it land?`, [{ label: 't =', ans: T }], `Set h = 0: −16t(t − ${T}) = 0, so t = 0 (launch) or t = ${T} s (landing).`); } },
    d: { t: 'when it reaches a height', g: R => { const t1 = R.int(1, 4), t2 = t1 + R.int(1, 5), v = 16 * (t1 + t2), H = 16 * t1 * t2;
      return E.num(`With ${M(`h(t)=-16t^2+${v}t`)} (feet), at what two times is the ball ${H} ft high?`, [{ label: 't =', set: [String(t1), String(t2)] }], `−16t² + ${v}t = ${H} → t² − ${t1 + t2}t + ${t1 * t2} = 0 → t = ${t1} s (going up) and t = ${t2} s (coming down).`); } },
  });

  /* IV.7.14 Area & optimization */
  S('IV.7.14', 'Area & optimization', {
    a: { t: 'write area as a quadratic', g: R => { const P = 2 * R.int(8, 70);
      return E.num(`A rectangle has perimeter ${P} m and one side x m. Write its area A in terms of x (expanded).`, [{ label: 'A =', expr: `${P / 2}x-x^2`, form: 'expanded' }], `The other side is ${P / 2} − x, so A = x(${P / 2} − x) = ${P / 2}x − x².`); } },
    b: { t: 'find the vertex', g: R => { const L = 2 * R.int(5, 80);
      return E.num(`${M(`A(x)=x(${L}-x)`)}. For what x is A largest?`, [{ label: 'x =', ans: L / 2 }], `The zeros are 0 and ${L}; the vertex is halfway, at x = ${L / 2}.`); } },
    c: { t: 'max area or revenue', g: R => { if (R.bool()) { const F = R.pick([40, 60, 80, 100]); return E.num(`A farmer has ${F} m of fence for a rectangular pen against a long wall (fence on three sides). What is the largest possible area?`, [{ label: 'area =', ans: F * F / 8 }], `With sides x, x and ${F} − 2x: A = x(${F} − 2x), maximized at x = ${F / 4}, giving ${F / 4} × ${F / 2} = ${F * F / 8} m².`); }
      const p0 = R.pick([10, 12, 20]), q0 = R.pick([100, 200, 300]), dq = R.pick([5, 10, 20]); const best = (q0 / dq + p0) / 2 - p0; const price = p0 + best, rev = price * (q0 - dq * best);
      return E.num(`A shop sells ${q0} caps a week at $${p0}. Each $1 price rise loses ${dq} sales. What price gives the most revenue?`, [{ label: 'price = $', ans: price }], `R(n) = (${p0} + n)(${q0} − ${dq}n) is largest halfway between its zeros n = −${p0} and n = ${q0 / dq}: n = ${best}, so price $${price} (revenue $${rev}).`); } },
    d: { t: 'interpret the answer', g: R => { const v = 32 * R.int(1, 8), tp = v / 32, hm = 16 * tp * tp;
      const opts = [`The ball reaches its highest point, ${hm} ft, after ${tp} s.`, `The ball lands after ${tp} s.`, `The ball is ${tp} ft high after ${hm} s.`, `The ball travels ${hm} ft sideways.`];
      return E.choice(R, `For ${M(`h(t)=-16t^2+${v}t`)}, the vertex is (${tp}, ${hm}). What does it mean?`, opts[0], opts.slice(1), `The vertex of a height graph is (time of the peak, peak height).`); } },
  });

  /* IV.7.15 Quadratic inequalities */
  S('IV.7.15', 'Quadratic inequalities', {
    a: { t: 'find the roots', g: R => { const r = R.int(-6, 5), s = r + R.int(1, 6);
      return E.num(`To solve ${M(std(1, -(r + s), r * s) + '<0')}, first find the roots of ${M(std(1, -(r + s), r * s) + '=0')}.`, [{ label: 'x =', set: [String(r), String(s)] }], `It factors as ${M(fac(1, r, s))}: roots ${r} and ${s}.`); } },
    b: { t: 'sign chart', g: R => { const r = R.int(-6, 3), s = r + R.int(2, 6), zone = R.bool() ? 1 : R.pick([0, 2]), xs = [r - R.int(1, 3), R.int(r + 1, s - 1), s + R.int(1, 3)][zone];
      const val = (xs - r) * (xs - s);
      return E.choiceFixed(`For ${M('f(x)=' + fac(1, r, s))}, is f(${xs}) positive or negative?`.replace('(-', '(−'), ['positive', 'negative'], val > 0 ? 0 : 1, `${xs} is ${['left of both roots', 'between the roots', 'right of both roots'][zone]}; the factors give (${xs - r})(${xs - s}) = ${val}.`); } },
    c: { t: 'read from the graph', g: R => { const r = R.int(-5, 1), s = r + R.int(2, 5), a = R.pick([1, -1]), op = R.pick(['>', '<']);
      const inside = (op === '<') === (a > 0);
      return E.num(`The graph shows ${M('y=' + std(a, -a * (r + s), a * r * s))}. Solve ${M(std(a, -a * (r + s), a * r * s) + op + '0')}.`, [{ interval: inside ? `(${r},${s})` : `(-inf,${r})U(${s},inf)` }],
        inside ? `The curve is ${op === '<' ? 'below' : 'above'} the axis between the roots: ${M(r + '<x<' + s)}.` : `The curve is ${op === '<' ? 'below' : 'above'} the axis outside the roots: ${M('x<' + r)} or ${M('x>' + s)}.`, { visual: pic(a, -a * (r + s), a * r * s) }); } },
    d: { t: 'interval answer', g: R => { const r = R.int(-7, 3), s = r + R.int(1, 7), op = R.pick(['<=', '>=', '<', '>']); const closed = op.length === 2;
      const inside = op[0] === '<';
      const iv = inside ? `${closed ? '[' : '('}${r},${s}${closed ? ']' : ')'}` : `(-inf,${r}${closed ? ']' : ')'}U${closed ? '[' : '('}${s},inf)`;
      return E.num(`Solve ${M(std(1, -(r + s), r * s) + op + '0')}. Answer in interval notation.`, [{ interval: iv }], `Roots ${r} and ${s}; the parabola opens up, so it is ${inside ? 'below' : 'above'} zero ${inside ? 'between' : 'outside'} them: ${E.pt(iv)}.`.replace(/Roots -/, 'Roots −').replace(/and -/, 'and −')); } },
    e: { t: 'rearrange first', g: R => { const r = R.int(-6, 3), s = r + R.int(1, 7), m = R.int(-4, 4), op = R.pick(['<', '<=', '>', '>=']); const b = -(r + s), c = r * s;
      const lhs = m ? `x(x${b + m > 0 ? '+' : ''}${b + m === 0 ? '' : b + m})` : 'x^2', rhsB = m, rhs = `${rhsB === 0 ? '' : (rhsB === 1 ? '' : rhsB === -1 ? '-' : rhsB) + 'x'}${-c > 0 && rhsB !== 0 ? '+' : ''}${-c === 0 && rhsB !== 0 ? '' : -c}`;
      const closed = op.length === 2, inside = op[0] === '<', iv = inside ? `${closed ? '[' : '('}${r},${s}${closed ? ']' : ')'}` : `(-inf,${r}${closed ? ']' : ')'}U${closed ? '[' : '('}${s},inf)`;
      return E.num(`Solve ${M(lhs.replace('(x)', '(x)') + op + rhs)}. Answer in interval notation.`, [{ interval: iv }], `Move everything left: ${M(std(1, b, c) + op + '0')}. The roots are ${r} and ${s}, and the parabola opens up, so the answer is ${E.pt(iv)}.`); } },
    f: { t: 'true for every x', g: R => { const c = R.int(1, 7), kind = R.int(0, 2), L = 2 * c;
      const Q = ['>0 for every x', '>=0 for every x', '<0 for at least one x'][kind];
      const iv = [`(-${L},${L})`, `[-${L},${L}]`, `(-inf,-${L})U(${L},inf)`][kind];
      return E.num(`For which values of k is ${M(`x^2+kx+${c * c}`)} ${Q.replace('>0', '&gt; 0').replace('>=0', '≥ 0').replace('<0', '&lt; 0')}?`, [{ interval: iv }],
        [`It stays above the axis when it has no real roots: k² − ${4 * c * c} < 0, so −${L} < k < ${L}.`, `Touching the axis is allowed: k² − ${4 * c * c} ≤ 0, so −${L} ≤ k ≤ ${L}.`, `It dips below the axis when it has two real roots: k² − ${4 * c * c} > 0, so ${M('k<-' + L)} or ${M('k>' + L)}.`][kind]); } },
  });

  /* IV.7.16 Write a quadratic from features */
  S('IV.7.16', 'Write a quadratic from features', {
    a: { t: 'from vertex and a point', g: R => { const a = nz(R, -3, 3), h = R.int(-4, 4), k = R.int(-6, 6), x1 = h + nz(R, -2, 2), y1 = a * (x1 - h) ** 2 + k;
      return E.num(`A parabola has vertex ${pt(h, k)} and passes through ${pt(x1, y1)}. Write its equation.`, [{ label: 'y =', expr: vtx(a, h, k) }], `y = a(x − h)² + k with the point: ${y1} = a(${x1 - h})² ${sg(k)}, so a = ${a}. ${M('y=' + vtx(a, h, k))}.`); } },
    b: { t: 'from zeros and a point', g: R => { const r = R.int(-5, 4), s = r + R.int(1, 6), a = nz(R, -3, 3); let x1; do x1 = R.int(-6, 6); while (x1 === r || x1 === s); const y1 = a * (x1 - r) * (x1 - s);
      return E.num(`A parabola has zeros ${r} and ${s} and passes through ${pt(x1, y1)}. Write its equation.`.replace(/zeros -/, 'zeros −').replace(/and -/, 'and −'), [{ label: 'y =', expr: fac(a, r, s) }], `y = a(x − r)(x − s); the point gives a = ${a}: ${M('y=' + fac(a, r, s))}.`.replace('= -', '= −')); } },
    c: { t: 'from three points', g: R => { const a = nz(R, -2, 2), b = R.int(-4, 4), c = R.int(-5, 5), xs = [-1, 0, 1].map(x => x + R.pick([0, 1]) * 0), f = Q(a, b, c);
      return E.num(`Find ${M('y=ax^2+bx+c')} through ${pt(-1, f(-1))}, ${pt(0, f(0))} and ${pt(1, f(1))}.`, [{ label: 'y =', expr: std(a, b, c) }], `x = 0 gives c = ${c}. Then a − b + c = ${f(-1)} and a + b + c = ${f(1)}: adding gives a = ${a}, subtracting gives b = ${b}.`); } },
    d: { t: 'check with a graph', g: R => { const a = R.pick([1, -1]), h = R.int(-3, 3), k = R.int(-4, 4);
      const right = vtx(a, h, k), wrongs = [vtx(a, -h || 1, k), vtx(-a, h, k), vtx(a, h, -k || 2), vtx(a, k, h === k ? h + 1 : h)].filter(w => w !== right);
      return E.choice(R, `Which equation matches the graph?`, M('y=' + right), R.sample([...new Set(wrongs)], 3).map(w => M('y=' + w)), `Vertex ${pt(h, k)} and it opens ${a > 0 ? 'up' : 'down'}.`, { visual: pic(a, -2 * a * h, a * h * h + k) }); } },
    e: { t: 'the axis and two points', g: R => { let d1, d2; const a = nz(R, -3, 3), h = R.int(-4, 4), k = R.int(-8, 8); do { d1 = nz(R, -3, 3); d2 = nz(R, -4, 4); } while (d1 * d1 === d2 * d2);
      const x1 = h + d1, y1 = a * d1 * d1 + k, x2 = h + d2, y2 = a * d2 * d2 + k;
      return E.num(`A parabola has axis of symmetry ${M('x=' + h)} and passes through ${pt(x1, y1)} and ${pt(x2, y2)}. Write its equation.`, [{ label: 'y =', expr: vtx(a, h, k) }], `Use ${M('y=a' + E.lin(h) + '^2+k')}: ${y1} = ${d1 * d1 === 1 ? '' : d1 * d1}a + k and ${y2} = ${d2 * d2 === 1 ? '' : d2 * d2}a + k. Subtracting gives a = ${a}, then k = ${k}: ${M('y=' + vtx(a, h, k))}.`); } },
    f: { t: 'touching the axis: find all', g: R => { let x1, x2, s1, s2; do { x1 = R.int(-5, 5); x2 = R.int(-5, 5); s1 = R.int(1, 4); s2 = R.int(1, 4); } while (x1 === x2 || s1 === s2);
      const t = R.pick([1, 1, 2, 3]), y1 = t * s1 * s1, y2 = t * s2 * s2, h1 = E.fracStr(s2 * x1 - s1 * x2, s2 - s1), h2 = E.fracStr(s2 * x1 + s1 * x2, s2 + s1);
      return E.num(`The graph of ${M('y=ax^2+bx+c')} touches the x-axis at exactly one point and passes through ${pt(x1, y1)} and ${pt(x2, y2)}. Find every possible x-coordinate of its vertex.`, [{ label: 'x =', set: [h1, h2] }], `Touching means ${M('y=a(x-h)^2')}. Dividing the two equations, ((${x1} − h)/(${x2} − h))² = ${E.pt(E.fracStr(y1, y2))}, so (${x1} − h)/(${x2} − h) = ±${E.pt(E.fracStr(s1, s2))}. That gives h = ${E.pt(h1)} or h = ${E.pt(h2)}.`); } },
  });

  /* IV.7.17 Quadratic regression */
  const table = (xs, ys) => `<table class="dt"><tr><th>x</th>${xs.map(x => `<td>${String(x).replace('-', '−')}</td>`).join('')}</tr><tr><th>y</th>${ys.map(y => `<td>${String(y).replace('-', '−')}</td>`).join('')}</tr></table>`;
  S('IV.7.17', 'Quadratic regression', {
    a: { t: 'spot a quadratic pattern', g: R => { const kind = R.int(0, 2), xs = [0, 1, 2, 3, 4];
      const m = nz(R, -5, 5), c0 = R.int(-6, 9), qa = nz(R, -3, 3), qb = R.int(-4, 4), g0 = R.int(1, 4), ratio = R.pick([2, 3]);
      const f = [x => m * x + c0, x => qa * x * x + qb * x + c0, x => g0 * ratio ** x][kind];
      return E.choiceFixed(`Which kind of model fits this table?${table(xs, xs.map(f))}`, ['linear', 'quadratic', 'exponential'], kind, ['First differences are constant: linear.', 'Second differences are constant: quadratic.', 'Each y is multiplied by the same number: exponential.'][kind]); } },
    b: { t: 'second differences', g: R => { const a = nz(R, -3, 3), b = R.int(-5, 5), c = R.int(-5, 5), xs = [0, 1, 2, 3, 4], ys = xs.map(Q(a, b, c));
      return E.num(`What is the constant second difference of this table?${table(xs, ys)}`, [{ ans: 2 * a }], `First differences: ${ys.slice(1).map((y, i) => y - ys[i]).join(', ')}. Their differences are all ${2 * a} (always 2a).`); } },
    c: { t: 'fit with technology', g: R => { const a = nz(R, -2, 2), b = R.int(-4, 4), c = R.int(-5, 5), xs = [-2, -1, 0, 1, 2], ys = xs.map(Q(a, b, c));
      return E.num(`A calculator fits a quadratic to this data exactly. What equation does it give?${table(xs, ys)}`, [{ label: 'y =', expr: std(a, b, c) }], `c = y(0) = ${c}; second difference ${2 * a} gives a = ${a}; then b = ${b}.`); } },
    d: { t: 'predict and judge', g: R => { const t = R.int(5, 12), far = t * R.int(3, 6);
      const opts = [`Risky: week ${far} is far outside the data, so the curve may not hold there.`, 'Safe: a quadratic model is always valid for any x.', 'Safe, as long as r is close to 1.', 'Impossible: quadratics can\'t predict.'];
      return E.choice(R, `A quadratic fits heights of a growing plant for weeks 1 to ${t}. Someone uses it to predict week ${far}. Is that sensible?`, opts[0], opts.slice(1), 'Predicting far outside the data (extrapolation) is risky: a parabola eventually turns, and a plant does not.'); } },
  });
})(typeof window !== 'undefined' ? window : globalThis);
