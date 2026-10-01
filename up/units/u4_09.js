/* Era IV · Unit IV.9 Function toolkit (IV.9.01–IV.9.18) */
(function (G) {
  const E = G.E4, V = E.V, C = E.C, M = s => E.mx(s);
  const S = (id, name, steps) => E.skill({ id, name, steps });
  const nz = (R, lo, hi) => { let v; do v = R.int(lo, hi); while (v === 0); return v; };
  const pt = (x, y) => `(${x}, ${y})`;
  const fr = v => { for (let d = 1; d <= 64; d++) { const n = Math.round(v * d); if (Math.abs(n - v * d) < 1e-9) return E.fracStr(n, d); } return String(v); };
  const add = k => k ? (k > 0 ? '+' : '-') + fr(Math.abs(k)) : '';          // '+3' / '-3' / ''
  const xm = h => h === 0 ? 'x' : h > 0 ? `x-${fr(h)}` : `x+${fr(-h)}`;        // x − h
  const co = a => a === 1 ? '' : a === -1 ? '-' : fr(a);
  const addc = v => v === 1 ? '+' : v === -1 ? '-' : add(v);               // signed coefficient before a variable
  const nt = v => String(v).replace(/^-/, '−');                              // plain-text number with a real minus
  const ft = r => r === 0 ? 'x' : `(${E.pt(xm(r))})`;                          // factor text (x − r)
  const par = u => /^[a-z]$/.test(u) ? u : `(${u})`;
  const mod = (a, n) => ((a % n) + n) % n;
  const dir = (v, pos, neg) => `${v > 0 ? pos : neg} ${fr(Math.abs(v))}`;
  const cur = O => (O && O.coins === 'THB' ? '฿' : '$');
  const sub = n => String(n).split('').map(d => '₀₁₂₃₄₅₆₇₈₉'[d]).join('');
  const sup = n => E.pt('^(' + n + ')');
  const ptx = s => E.pt(s).replace(/log_(\d+)\(([^()]*)\)/g, (m, b, a) => 'log' + sub(b) + (/^[a-z0-9]+$/.test(a) ? a : '(' + a + ')'));

  /* parent functions and the transformed family y = a·P(b(x − h)) + k */
  const PF = {
    lin: { name: 'linear', f: x => x, s: u => u },
    quad: { name: 'quadratic', f: x => x * x, s: u => par(u) + '^2' },
    cube: { name: 'cubic', f: x => x ** 3, s: u => par(u) + '^3' },
    root: { name: 'square root', f: x => x >= 0 ? Math.sqrt(x) : NaN, s: u => `sqrt(${/^\d+x$/.test(u) ? u.replace('x', '*x') : u})` },
    abs: { name: 'absolute value', f: Math.abs, s: u => `|${u}|` },
    rec: { name: 'reciprocal', f: x => x === 0 ? NaN : 1 / x, s: u => `1/${par(u)}` },
    exp: { name: 'exponential', f: x => 2 ** x, s: u => `2^${par(u)}` },
    log: { name: 'logarithmic', f: x => x > 0 ? Math.log2(x) : NaN, s: u => `log_2(${u})` },
  };
  const inner = (b, h) => b === 1 ? xm(h) : h === 0 ? (b === -1 ? '-x' : Number.isInteger(b) ? `${b}x` : `${b < 0 ? '-' : ''}x/${fr(Math.abs(1 / b))}`) : `${b === -1 ? '-' : fr(b)}(${xm(h)})`;
  const T = (key, o = {}) => {
    const { a = 1, b = 1, h = 0, k = 0 } = o, P = PF[key], u = inner(b, h);
    let body;
    if (key === 'rec') body = `${a === -1 ? '-1' : fr(a)}/${par(u)}`;
    else if (key === 'exp') body = a === 1 ? P.s(u) : a === -1 ? '-' + P.s(u) : Number.isInteger(a) ? `${a}*${P.s(u)}` : `${a < 0 ? '-' : ''}${P.s(u)}/${fr(1 / Math.abs(a))}`;
    else if (key === 'lin') body = a === 1 ? u : `${co(a)}${par(u)}`;
    else if (!Number.isInteger(a)) { const [n, d] = fr(Math.abs(a)).split('/'); body = `${a < 0 ? '-' : ''}${n === '1' ? '' : n}${P.s(u)}/${d}`; }
    else body = co(a) + P.s(u);
    return { s: body + add(k), f: x => a * P.f(b * (x - h)) + k };
  };
  const ps = key => T(key).s;                                                 // parent equation text

  /* pictures */
  const W6 = [-6, 6];
  const small = (fns, o = {}) => V.graph({ x: W6, y: W6, w: 170, h: 170, labels: false, ticks: 1, fns, points: o.points || [], vlines: o.vlines || [], hlines: o.hlines || [], label: o.label || 'graph' });
  const big = (fns, o = {}) => V.graph({ x: o.x || W6, y: o.y || W6, w: o.w || 300, h: o.h || 300, ticks: o.ticks || 1, yticks: o.yticks, fns, points: o.points || [], vlines: o.vlines || [], hlines: o.hlines || [], label: o.label || 'graph' });
  const blue = f => ({ f, color: C.blue }), dashed = f => ({ f, color: C.muted, dash: true });
  const idLine = dashed(x => x);
  // two curves are told apart if they differ visibly over a stretch of the ±6 window
  const vis = y => isFinite(y) && y > -6.2 && y < 6.2 ? y : null;
  const differ = (f, g) => { let n = 0; for (let j = 0; j <= 240; j++) { const x = -6 + j * 0.05, a = vis(f(x)), b = vis(g(x)); if ((a === null) !== (b === null) || (a !== null && Math.abs(a - b) > 0.35)) n++; } return n >= 10; };
  // multiple choice of small graphs; null when fewer than 3 clearly different wrong pictures exist
  const gPick = (right, wrongs) => { const keep = []; for (const w of wrongs) if (differ(w, right) && keep.every(k => differ(k, w))) keep.push(w); return keep.length >= 3 ? keep.slice(0, 3) : null; };
  const gChoice = (R, prompt, right, wrongs, explain, o = {}) => {
    const pic = f => small([...(o.refs || []), blue(f)], { points: o.points ? o.points(f) : [] });
    return E.choice(R, prompt, pic(right), wrongs.map(pic), explain, o.visual ? { visual: o.visual } : {});
  };
  const table = rows => `<table class="dt">${rows.map(([h, vals]) => `<tr><th>${h}</th>${vals.map(v => `<td>${String(v).replace(/^-/, '−')}</td>`).join('')}</tr>`).join('')}</table>`;
  const polyAt = (co_, x) => co_.reduce((s, c) => s * x + c, 0);
  const negX = co_ => co_.map((c, i) => ((co_.length - 1 - i) % 2 ? -c : c));    // coefficients of p(−x)

  /* IV.9.01 Parent functions */
  S('IV.9.01', 'Parent functions', {
    a: { t: 'linear, quadratic, cubic', g: R => {
      const L = [['x', 'linear', x => x], ['x^2', 'quadratic', x => x * x], ['x^3', 'cubic', x => x ** 3]], i = R.int(0, 2), kind = R.int(0, 3), [eq, nm, f] = L[i];
      const why = ['a straight line through the origin: y = x', 'a U-shaped parabola with its vertex at the origin: y = x²', 'an S-shaped curve through the origin, falling on the left and rising on the right: y = x³'][i];
      if (kind === 0) return E.choiceFixed('Which parent function is graphed?', L.map(l => M('y=' + l[0])), i, `It is ${why}.`, { visual: big([blue(f)]) });
      if (kind === 1) { const p = i === 2 ? nz(R, -3, 3) : nz(R, -6, 6);
        return E.num(`For the ${nm} parent function ${M('f(x)=' + eq)}, what is f(${p})?`, [{ label: `f(${nt(p)}) =`, ans: f(p) }], i === 0 ? `f(x) = x returns its input: f(${p}) = ${p}.` : `f(${p}) = ${E.pt(eq.replace('x', '(' + p + ')'))} = ${f(p)}.`); }
      if (kind === 2) return E.choiceFixed(`${M('y=' + eq)} is the parent function of which family?`, ['linear', 'quadratic', 'cubic'], i, `The highest power of x is ${i + 1}, so it is ${nm}.`);
      const p = R.pick([2, 3, -2, -3]);
      return E.choiceFixed(`Which parent function passes through ${pt(p, f(p))}?`, L.map(l => M('y=' + l[0])), i, `At x = ${p}: x = ${p}, x² = ${p * p}, x³ = ${p ** 3}. Only ${E.pt('y=' + eq)} gives ${f(p)}.`); } },
    b: { t: 'root, absolute value, reciprocal', g: R => {
      const L = [['sqrt(x)', 'square root', PF.root.f], ['|x|', 'absolute value', Math.abs], ['1/x', 'reciprocal', PF.rec.f]], i = R.int(0, 2), kind = R.int(0, 2), [eq, nm, f] = L[i];
      if (kind === 0) return E.choiceFixed('Which parent function is graphed?', [...L.map(l => M('y=' + l[0])), M('y=x^2')], i,
        ['It starts at the origin and only exists for x ≥ 0: half of a sideways parabola, y = √x. (y = x² would continue to the left.)', 'A V shape with its corner at the origin: y = |x|.', 'Two separate branches that never touch the axes: y = 1/x.'][i], { visual: big([blue(f)]) });
      if (kind === 1) {
        if (i === 0) { const q = R.int(1, 9); return E.num(`For ${M('f(x)=sqrt(x)')}, what is f(${q * q})?`, [{ ans: q }], `√${q * q} = ${q}, the non-negative number whose square is ${q * q}.`); }
        if (i === 1) { const p = nz(R, -12, 12); return E.num(`For ${M('f(x)=|x|')}, what is f(${p})?`, [{ ans: Math.abs(p) }], `|${String(p).replace('-', '−')}| = ${Math.abs(p)}, the distance from 0.`); }
        const p = R.pick([2, 3, 4, 5, 8, 10, -2, -4, -5, -10]); return E.num(`For ${M('f(x)=1/x')}, what is f(${p})?`, [{ frac: [p < 0 ? -1 : 1, Math.abs(p)] }], `f(${p}) = 1/${p < 0 ? '(' + p + ')' : p} = ${p < 0 ? '−' : ''}1/${Math.abs(p)}.`); }
      const Q = [['domain', 0, '[0,inf)', 'You can only take the square root of numbers x ≥ 0.'], ['range', 0, '[0,inf)', 'A square root is never negative, and it reaches every value ≥ 0.'], ['domain', 1, '(-inf,inf)', 'Every number has an absolute value.'], ['range', 1, '[0,inf)', 'Absolute values are never negative.'],
        ['domain', 2, '(-inf,0)U(0,inf)', 'Every x except 0, since 1/0 is undefined.'], ['range', 2, '(-inf,0)U(0,inf)', '1/x is never 0, but it takes every other value.']].filter(q => q[1] === i);
      const [what, , iv, why] = R.pick(Q);
      return E.num(`What is the ${what} of ${M('y=' + eq)}? Use interval notation.`, [{ interval: iv }], `${why} So the ${what} is ${E.pt(iv)}.`); } },
    c: { t: 'exponential, log', g: R => {
      const b = R.pick([2, 3, 4, 5, 10]), kind = R.int(0, 4), isExp = R.bool();
      if (kind === 0) { const p = R.int(-2, b >= 5 ? 3 : 4); const v = b ** Math.abs(p);
        return E.num(`For ${M(`y=${b}^x`)}, what is y when x = ${p}?`, [p < 0 ? { frac: [1, v] } : { ans: v }], p < 0 ? `${b}${sup(p)} = 1/${b}${sup(-p)} = 1/${v}.` : `${b}${sup(p)} = ${v}.`); }
      if (kind === 1) { const p = R.int(-2, b >= 5 ? 3 : 4), arg = p < 0 ? `1/${b ** -p}` : String(b ** p);
        return E.num(`For ${M(`y=log_${b}(x)`)}, what is y when x = ${p < 0 ? M(arg) : arg}?`, [{ ans: p }], `A log asks "which power of ${b}?": ${arg} = ${b}${sup(p)}, so y = ${p}.`); }
      if (kind === 2) return isExp ? E.num(`Where does ${M(`y=${b}^x`)} cross the y-axis? Give the point.`, [{ point: ['0', '1'] }], `At x = 0, ${b}⁰ = 1, so it crosses at (0, 1). Every y = bˣ does.`)
        : E.num(`Where does ${M(`y=log_${b}(x)`)} cross the x-axis? Give the point.`, [{ point: ['1', '0'] }], `log${sub(b)}1 = 0 because ${b}⁰ = 1, so it crosses at (1, 0).`);
      if (kind === 3) return isExp ? E.num(`What is the horizontal asymptote of ${M(`y=${b}^x`)}? Give its equation.`, [{ eqn: 'y=0' }], `Far to the left ${b}ˣ gets closer and closer to 0 but never reaches it: y = 0.`)
        : E.num(`What is the vertical asymptote of ${M(`y=log_${b}(x)`)}? Give its equation.`, [{ eqn: 'x=0' }], `As x shrinks toward 0 the log falls without bound, and it is undefined for x ≤ 0: x = 0.`);
      const bb = R.pick([2, 3]), f = isExp ? x => bb ** x : x => x > 0 ? Math.log(x) / Math.log(bb) : NaN;
      return E.choiceFixed('Which equation matches the graph?', [M(`y=${bb}^x`), M(`y=log_${bb}(x)`), M('y=x^2'), M('y=sqrt(x)')], isExp ? 0 : 1,
        isExp ? `It passes through (0, 1), rises faster and faster, and hugs y = 0 on the left: y = ${bb}ˣ.` : `It passes through (1, 0), rises slowly, and dives down next to the y-axis: y = log${sub(bb)}x.`, { visual: big([blue(f)]) }); } },
    d: { t: 'match graph to equation', g: R => {
      const CONF = { lin: ['cube', 'abs', 'root', 'quad', 'log'], quad: ['root', 'abs', 'exp', 'cube', 'rec'], cube: ['lin', 'quad', 'rec', 'root', 'exp'], root: ['quad', 'log', 'abs', 'lin', 'exp'],
        abs: ['quad', 'lin', 'root', 'cube', 'rec'], rec: ['cube', 'log', 'exp', 'abs', 'lin'], exp: ['quad', 'log', 'cube', 'root', 'lin'], log: ['root', 'exp', 'rec', 'lin', 'quad'] };
      const key = R.pick(Object.keys(CONF)), others = R.sample(CONF[key], 3);
      const why = { lin: 'a straight line through the origin', quad: 'a U shape with vertex at the origin', cube: 'an S shape through the origin', root: 'half a sideways parabola starting at the origin', abs: 'a V shape', rec: 'two branches that avoid both axes', exp: 'it passes through (0, 1) and hugs y = 0 on the left', log: 'it passes through (1, 0) and dives down beside the y-axis' }[key];
      if (R.bool()) return E.choice(R, 'Which equation matches the graph?', M('y=' + ps(key)), others.map(k => M('y=' + ps(k))), `The graph is ${why}: ${ptx('y=' + ps(key))}.`, { visual: big([blue(PF[key].f)]) });
      return gChoice(R, `Which graph shows ${M('y=' + ps(key))}?`, PF[key].f, others.map(k => PF[k].f), `Look for ${why}.`); } },
    e: { t: 'a less familiar form', g: R => {
      const b = R.pick([2, 3, 4, 5, 7]);
      const items = [
        ['sqrt(x^2)', '|x|', ['x', 'sqrt(x)', 'x^2', '-x'], 'A square root is never negative, so √(x²) = |x|, not x.'],
        ['x^(1/2)', 'sqrt(x)', ['x^2', '1/x', 'x/2', '2^x'], 'A power of 1/2 is a square root: x^(1/2) = √x.'],
        ['x^(-1)', '1/x', ['-x', 'x', 'sqrt(x)', '-x^2'], 'A power of −1 is a reciprocal: x⁻¹ = 1/x.'],
        ['sqrt(x^4)', 'x^2', ['|x|', 'x', 'x^4', 'sqrt(x)'], '√(x⁴) = x², and x² is already never negative, so no |…| is needed.'],
        [`${b * b}^(x/2)`, `${b}^x`, [`${b * b}^x`, `x^${b}`, `${b}^(x/2)`, `${2 * b}^x`], `${b * b}^(x/2) = (${b}²)^(x/2) = ${b}ˣ.`],
        [`(1/${b})^(-x)`, `${b}^x`, [`(1/${b})^x`, `-${b}^x`, `x^${b}`, `log_${b}(x)`], `(1/${b})^(−x) = (${b}⁻¹)^(−x) = ${b}ˣ.`],
        [`log_${b}(${b}^x)`, 'x', [`${b}^x`, `log_${b}(x)`, `x^${b}`, '1/x'], `log base ${b} undoes ${b}ˣ, leaving x.`],
        [`log_${b}(${b}^(x^2))`, 'x^2', [`${b}^x`, 'x', `x^${2 * b}`, `log_${b}(x)`], `log base ${b} undoes the power of ${b}, leaving x².`],
      ];
      const [eq, right, wr, why] = R.pick(items);
      return E.choice(R, `Which simpler equation has exactly the same graph as ${M('y=' + eq)}?`, M('y=' + right), R.sample(wr, 3).map(w => M('y=' + w)), why); } },
    f: { t: 'count crossings of parent graphs', g: R => {
      const k = R.pick([1, 2, 3, 4, 5, 9]), kind = R.int(0, 5);
      if (kind === 0) return E.num(`How many real solutions does ${M(`x^3=${k === 1 ? '' : k}x`)} have?`, [{ ans: 3 }], `x³ − ${k === 1 ? '' : k}x = x(x² − ${k}) = 0 gives x = 0 and x = ±${k === 1 || k === 4 || k === 9 ? Math.sqrt(k) : '√' + k}: three solutions.`);
      if (kind === 1) { const s = R.pick([1, -1]) * k;
        return E.num(`How many real solutions does ${M(`1/x=${s === 1 ? '' : s === -1 ? '-' : s}x`)} have?`, [{ ans: s > 0 ? 2 : 0 }], s > 0 ? `Multiply by x: x² = ${fr(1 / s)}, so x = ±${s === 1 ? 1 : '√(' + fr(1 / s) + ')'}. Two solutions (the line crosses both branches).` : `Multiply by x: x² = ${fr(1 / s)}, which is negative. No solutions: the line y = ${s}x runs through the other two quadrants.`); }
      if (kind === 2) return E.num(`How many real solutions does ${M(`sqrt(x)=${k === 1 ? '' : k}x`)} have?`, [{ ans: 2 }], `Squaring gives x = ${k * k === 1 ? '' : k * k}x², so x = 0 or x = ${fr(1 / (k * k))}. Both check: two solutions.`);
      if (kind === 3) return E.num(`How many real solutions does ${M(`|x|=${k === 1 ? '' : k}x^2`)} have?`, [{ ans: 3 }], `x = 0 works. For x ≠ 0, divide by |x|: 1 = ${k === 1 ? '' : k}|x|, so x = ±${fr(1 / k)}. Three solutions.`);
      const FIX = [['2^x=x^2', 3, 'x = 2 and x = 4 both work, and since 2ˣ > x² at x = 0 but 2ˣ < x² at x = −1, there is a third solution between −1 and 0.'],
        ['2^x=x', 0, 'The exponential always stays above the line y = x, so they never meet.'], ['log_2(x)=x', 0, 'log₂x is always below the line y = x, so they never meet.'],
        ['log_2(x)=x-1', 2, 'x = 1 and x = 2 both work; the curve bends down, so the line meets it only there.'], ['x^3=x^2', 2, 'x²(x − 1) = 0 gives x = 0 or x = 1.'],
        ['1/x=x^2', 1, 'Multiplying by x gives x³ = 1, so only x = 1.'], ['|x|=1/x', 1, 'For x < 0 the left side is positive and the right side negative, so only x = 1 works.'],
        ['log_2(x)=sqrt(x)', 2, 'x = 4 and x = 16 both work (2 = 2 and 4 = 4); √x is ahead before 4 and after 16, so there are no others.'],
        ['2^x=x^3', 2, 'x³ is negative for x < 0. 2¹ > 1³ but 2² < 2³, and 2⁹ = 512 < 729 = 9³ but 2¹⁰ = 1024 > 1000 = 10³: two crossings.'],
        ['2^x=-x', 1, '2ˣ + x only increases, so it hits 0 exactly once (between −1 and 0).'], ['|x|=x^3', 2, 'For x ≥ 0: x = x³ gives 0 and 1. For x < 0: −x = x³ has no solution. Two solutions.'],
        ['sqrt(x)=x^3', 2, 'x = 0 and x = 1.'], ['1/x=x^3', 2, 'x⁴ = 1 gives x = ±1.'], ['2^x=1/x', 1, 'For x < 0, 1/x is negative. For x > 0 one curve rises and the other falls, so they cross once.']];
      const [eq, n, why] = R.pick(FIX);
      return E.num(`How many real solutions does ${M(eq)} have? (Picture the two parent graphs.)`, [{ ans: n }], why); } },
  });

  const SH = ['quad', 'cube', 'root', 'abs', 'rec', 'exp', 'log'];
  const keyPt = { quad: 'vertex', abs: 'vertex', root: 'starting point', cube: 'center point' };

  /* IV.9.02 Vertical shifts */
  S('IV.9.02', 'Vertical shifts', {
    a: { t: 'f(x) + k', g: R => { const k = nz(R, -6, 6);
      if (R.bool(0.6)) { const p = R.int(-6, 6), q = R.int(-6, 6);
        return E.num(`The point ${pt(p, q)} is on the graph of y = f(x). Which point must be on ${M('y=f(x)' + add(k))}?`, [{ point: [String(p), String(q + k)] }], `Adding ${k} changes every output by ${k}: the point moves ${dir(k, 'up', 'down')}, to ${pt(p, q + k)}.`); }
      const key = R.pick(['quad', 'abs', 'root', 'exp']), s = T(key, { k }).s;
      if (key === 'exp') return E.num(`Where does ${M('y=' + s)} cross the y-axis? Give the point.`, [{ point: ['0', String(1 + k)] }], `y = 2ˣ crosses at (0, 1); adding ${k} moves it ${dir(k, 'up', 'down')} to ${pt(0, 1 + k)}.`);
      return E.num(`What is the ${keyPt[key]} of ${M('y=' + s)}?`, [{ point: ['0', String(k)] }], `The parent ${E.pt('y=' + ps(key))} has its ${keyPt[key]} at (0, 0). The ${k > 0 ? '+' : '−'} ${Math.abs(k)} outside moves it ${dir(k, 'up', 'down')}: ${pt(0, k)}.`); } },
    b: { t: 'up vs down', g: R => { const key = R.pick(SH), k = nz(R, -7, 7), m = Math.abs(k), opts = [`shifted up ${m}`, `shifted down ${m}`, `shifted right ${m}`, `shifted left ${m}`], c = k > 0 ? 0 : 1;
      return E.choice(R, `Compared with ${M('y=' + ps(key))}, the graph of ${M('y=' + T(key, { k }).s)} is…`, opts[c], opts.filter((_, j) => j !== c), `The ${k > 0 ? '+' : '−'} ${m} is outside the function, so it changes the outputs: every point moves ${dir(k, 'up', 'down')}, not sideways.`); } },
    c: { t: 'graph it', g: R => { let key, k, w;
      do { key = R.pick(['quad', 'cube', 'root', 'abs', 'exp', 'rec']); k = nz(R, -4, 4); w = gPick(T(key, { k }).f, [T(key, { k: -k }).f, T(key, { h: k }).f, T(key, { h: -k }).f]); } while (!w);
      return gChoice(R, `Which graph shows ${M('y=' + T(key, { k }).s)}? (The dashed curve is ${M('y=' + ps(key))}.)`, T(key, { k }).f, w, `Every point of the parent moves ${dir(k, 'up', 'down')}; the curve keeps its shape and its left-right position.`, { refs: [dashed(PF[key].f)] }); } },
    d: { t: 'write it from a graph', g: R => { const key = R.pick(SH), k = nz(R, -4, 4), t = T(key, { k });
      const [px, py] = { quad: [0, 0], abs: [0, 0], root: [0, 0], cube: [0, 0], exp: [0, 1], rec: [1, 1], log: [1, 0] }[key];
      return E.num(`The graph is ${M('y=' + ps(key))} shifted up or down. Write its equation.`, [{ label: 'y =', expr: t.s }], `The parent's point ${pt(px, py)} is now at ${pt(px, py + k)}: every point moved ${dir(k, 'up', 'down')}. So y = ${ptx(t.s)}.`, { visual: big([blue(t.f)], { points: [[px, py + k]] }) }); } },
  });

  /* IV.9.03 Horizontal shifts */
  S('IV.9.03', 'Horizontal shifts', {
    a: { t: 'f(x − h)', g: R => { const h = nz(R, -6, 6);
      if (R.bool(0.6)) { const p = R.int(-6, 6), q = R.int(-6, 6);
        return E.num(`The point ${pt(p, q)} is on the graph of y = f(x). Which point must be on ${M('y=f(' + xm(h) + ')')}?`, [{ point: [String(p + h), String(q)] }], `The new graph reaches the old input ${p} when ${xm(h).replace('-', ' − ').replace('+', ' + ')} = ${p}, that is at x = ${p + h}. The point moves ${dir(h, 'right', 'left')}: ${pt(p + h, q)}.`); }
      const key = R.pick(['quad', 'abs', 'root', 'cube']), s = T(key, { h }).s;
      return E.num(`What is the ${keyPt[key]} of ${M('y=' + s)}?`, [{ point: [String(h), '0'] }], `The inside ${E.pt(xm(h))} is 0 at x = ${h}, so the parent's ${keyPt[key]} (0, 0) moves ${dir(h, 'right', 'left')}: ${pt(h, 0)}.`); } },
    b: { t: 'why the sign feels backwards', g: R => { const key = R.pick(SH), h = nz(R, -7, 7), m = Math.abs(h), opts = [`shifted right ${m}`, `shifted left ${m}`, `shifted up ${m}`, `shifted down ${m}`], c = h > 0 ? 0 : 1;
      return E.choice(R, `Compared with ${M('y=' + ps(key))}, the graph of ${M('y=' + T(key, { h }).s)} is…`, opts[c], opts.filter((_, j) => j !== c), `The inside ${E.pt(xm(h))} is 0 at x = ${h}, where the parent had its input 0. So the graph moves ${dir(h, 'right', 'left')}: the sign inside looks backwards.`); } },
    c: { t: 'graph it', g: R => { let key, h, w;
      do { key = R.pick(['quad', 'cube', 'root', 'abs', 'exp', 'rec', 'log']); h = nz(R, -3, 3); w = gPick(T(key, { h }).f, [T(key, { h: -h }).f, T(key, { k: h }).f, T(key, { k: -h }).f]); } while (!w);
      return gChoice(R, `Which graph shows ${M('y=' + T(key, { h }).s)}? (The dashed curve is ${M('y=' + ps(key))}.)`, T(key, { h }).f, w, `The inside is 0 at x = ${h}, so every point moves ${dir(h, 'right', 'left')}.`, { refs: [dashed(PF[key].f)] }); } },
    d: { t: 'write it from a graph', g: R => { const key = R.pick(SH), h = ['root', 'log'].includes(key) ? nz(R, -3, 1) : nz(R, -3, 3), t = T(key, { h });
      const [px, py] = { quad: [0, 0], abs: [0, 0], root: [0, 0], cube: [0, 0], exp: [0, 1], rec: [1, 1], log: [1, 0] }[key];
      return E.num(`The graph is ${M('y=' + ps(key))} shifted left or right. Write its equation.`, [{ label: 'y =', expr: t.s }], `The parent's point ${pt(px, py)} is now at ${pt(px + h, py)}: a shift ${dir(h, 'right', 'left')}, so x becomes ${E.pt(xm(h))}: y = ${ptx(t.s)}.`, { visual: big([blue(t.f)], { points: [[px + h, py]] }) }); } },
    e: { t: 'spot a hidden shift', g: R => { const kind = R.int(0, 3);
      if (kind === 0) { const h = nz(R, -6, 6);
        return E.num(`${M('y=' + E.poly([1, -2 * h, h * h]))} is the graph of ${M('y=x^2')} shifted left or right. Where is its vertex?`, [{ point: [String(h), '0'] }], `It is a perfect square: ${M('y=' + T('quad', { h }).s)}, so the vertex moved to ${pt(h, 0)}.`); }
      if (kind === 1) { const h = nz(R, -3, 3);
        return E.num(`${M('y=' + E.poly([1, -3 * h, 3 * h * h, -(h ** 3)]))} is the graph of ${M('y=x^3')} shifted left or right. Where did the point (0, 0) move to?`, [{ point: [String(h), '0'] }], `It is the expansion of ${M('y=' + T('cube', { h }).s)}, so (0, 0) moved to ${pt(h, 0)}.`); }
      if (kind === 2) { const h = nz(R, -6, 6);
        return E.num(`${M(`y=sqrt(${E.poly([1, -2 * h, h * h])})`)} is the graph of ${M('y=|x|')} shifted left or right. Where is its corner?`, [{ point: [String(h), '0'] }], `Inside is the perfect square ${E.pt(T('quad', { h }).s)}, and √(u²) = |u|, so y = ${E.pt(T('abs', { h }).s)}: the corner is at ${pt(h, 0)}.`); }
      const h = nz(R, -5, 5), eq = h > 0 ? `2^x/${2 ** h}` : `${2 ** -h}*2^x`;
      return E.num(`${M('y=' + eq)} is the graph of ${M('y=2^x')} shifted left or right. Where did the point (0, 1) move to?`, [{ point: [String(h), '1'] }], `${2 ** Math.abs(h)} = 2${E.pt('^' + Math.abs(h))}, so y = ${E.pt(`2^(x${h > 0 ? '-' : '+'}${Math.abs(h)})`)}: a shift ${dir(h, 'right', 'left')}, and (0, 1) moves to ${pt(h, 1)}.`); } },
    f: { t: 'shift it into symmetry', g: R => { const kind = R.int(0, 2);
      if (kind === 0) { const b = 2 * nz(R, -5, 5), c = R.int(-9, 9);
        return E.num(`Let ${M('f(x)=' + E.poly([1, b, c]))}. For what value of h is ${M('y=f(x-h)')} an even function?`, [{ label: 'h =', ans: b / 2 }], `f has its axis of symmetry at x = ${-b / 2}. f(x − h) moves it to x = ${-b / 2} + h, and an even function needs the axis at x = 0: h = ${b / 2}.`); }
      if (kind === 1) { const a = nz(R, -3, 3), d = R.int(-6, 6);
        return E.num(`Let ${M('f(x)=' + E.poly([1, -3 * a, 3 * a * a, d - a ** 3]))}. For which h and k is ${M('y=f(x-h)+k')} an odd function?`, [{ label: 'h =', ans: -a }, { label: 'k =', ans: -d }],
          `f(x) = ${E.pt(T('cube', { h: a, k: d }).s)}, whose center is ${pt(a, d)}. f(x − h) + k moves the center to ${pt(`${a} + h`, `${d} + k`)}, and an odd function needs it at (0, 0): h = ${-a}, k = ${-d}.`); }
      let p, q; do { p = R.int(-6, 4); q = p + 2 * R.int(1, 4); } while (p + q === 0);
      return E.num(`Let ${M(`f(x)=|${xm(p)}|+|${xm(q)}|`)}. For what value of h is ${M('y=f(x-h)')} an even function?`, [{ label: 'h =', ans: -(p + q) / 2 }], `f is symmetric about x = ${(p + q) / 2}, halfway between ${p} and ${q}. f(x − h) moves that line to x = ${(p + q) / 2} + h, which must be x = 0: h = ${-(p + q) / 2}.`); } },
  });

  /* IV.9.04 Reflections */
  const rpoly = (R, deg) => { const c = [nz(R, -3, 3)]; for (let i = 1; i <= deg; i++) c.push(R.int(-7, 7)); if (c.slice(1).every((v, i) => (deg - 1 - i) % 2 === deg % 2 || v === 0)) c[1] = nz(R, -5, 5); return c; };
  S('IV.9.04', 'Reflections', {
    a: { t: '−f(x) over the x-axis', g: R => {
      if (R.bool()) { const p = R.int(-6, 6), q = nz(R, -6, 6);
        return E.num(`The point ${pt(p, q)} is on the graph of y = f(x). Which point must be on ${M('y=-f(x)')}?`, [{ point: [String(p), String(-q)] }], `−f(x) negates every output, reflecting over the x-axis: ${pt(p, q)} → ${pt(p, -q)}.`); }
      const c = [nz(R, -4, 4), R.int(-9, 9), R.int(-9, 9)];
      return E.num(`${M('f(x)=' + E.poly(c))}. Write ${M('-f(x)')} in expanded form.`, [{ label: '−f(x) =', expr: E.poly(c.map(v => -v)), form: 'expanded' }], `Negate every term: −f(x) = ${E.pt(E.poly(c.map(v => -v)))}.`); } },
    b: { t: 'f(−x) over the y-axis', g: R => {
      if (R.bool()) { const p = nz(R, -6, 6), q = R.int(-6, 6);
        return E.num(`The point ${pt(p, q)} is on the graph of y = f(x). Which point must be on ${M('y=f(-x)')}?`, [{ point: [String(-p), String(q)] }], `f(−x) at x = ${-p} uses the input ${p}, so the output is ${q}: ${pt(-p, q)}. It is a reflection over the y-axis.`); }
      const c = rpoly(R, R.pick([2, 3]));
      return E.num(`${M('f(x)=' + E.poly(c))}. Write ${M('f(-x)')} in expanded form.`, [{ label: 'f(−x) =', expr: E.poly(negX(c)), form: 'expanded' }], `Replace x with −x: even powers stay the same and odd powers change sign. f(−x) = ${E.pt(E.poly(negX(c)))}.`); } },
    c: { t: 'graph them', g: R => { let t, w, ask;
      do { const key = R.pick(['root', 'exp', 'log', 'cube']); t = T(key, { h: R.int(-2, 1), k: R.int(-2, 2) }); ask = R.bool();
        const nf = x => -t.f(x), fn = x => t.f(-x); w = gPick(ask ? nf : fn, [ask ? fn : nf, x => -t.f(-x), t.f]); } while (!w);
      const right = ask ? x => -t.f(x) : x => t.f(-x);
      return gChoice(R, `The dashed curve is y = f(x). Which graph shows ${M(ask ? 'y=-f(x)' : 'y=f(-x)')}?`, right, w, ask ? '−f(x) flips the outputs: the graph reflects over the x-axis (up becomes down).' : 'f(−x) flips the inputs: the graph reflects over the y-axis (left becomes right).', { refs: [dashed(t.f)] }); } },
    d: { t: 'identify from equations', g: R => {
      const key = R.pick(['root', 'exp', 'log']), c = key === 'log' ? R.pick([1, 2]) : R.int(1, 3), b = R.pick(key === 'log' ? [2, 3, 5, 10] : [2, 3, 4, 5, 10]);
      const fs = (u, neg) => (neg ? '-' : '') + (c === 1 ? '' : c + (key === 'exp' ? '*' : '')) + (key === 'root' ? `sqrt(${u})` : key === 'exp' ? `${b}^${par(u)}` : `log_${b}(${u})`);
      const w = R.int(0, 2), g = [fs('x', true), fs('-x', false), fs('-x', true)][w];
      const opts = ['the x-axis', 'the y-axis', 'both axes (a half-turn about the origin)', 'the line y = x'];
      return E.choice(R, `The graph of ${M('y=' + g)} is the graph of ${M('y=' + fs('x', false))} reflected over…`, opts[w], opts.filter((_, j) => j !== w),
        ['The minus sign is outside, on the outputs, so it reflects over the x-axis.', 'The minus sign is inside, on the input x, so it reflects over the y-axis.', 'Both the input and the output are negated, so it reflects over both axes.'][w]); } },
  });

  /* IV.9.05 Vertical stretch & compress */
  S('IV.9.05', 'Vertical stretch & compress', {
    a: { t: 'a·f(x)', g: R => { const a = R.pick([2, 3, 4, -2, -3, 1 / 2, 5]), p = R.int(-6, 6); let q; do q = R.int(-6, 6); while (a === 1 / 2 && q % 2);
      return E.num(`The point ${pt(p, q)} is on the graph of y = f(x). Which point must be on ${M(`y=${co(a)}f(x)`)}?`, [{ point: [String(p), String(a * q)] }], `${fr(a)}f(x) multiplies every output by ${fr(a)} and leaves x alone: ${pt(p, q)} → ${pt(p, a * q)}.`); } },
    b: { t: 'a > 1 vs 0 < a < 1', g: R => { const key = R.pick(['quad', 'abs', 'root', 'cube', 'exp', 'log']), stretch = R.bool(), a = stretch ? R.pick([2, 3, 4, 5]) : R.pick([1 / 2, 1 / 3, 1 / 4]), A = fr(a);
      const opts = [`stretched vertically by a factor of ${A}`, `compressed vertically by a factor of ${A}`, `shifted up ${A}`, `shifted right ${A}`], c = stretch ? 0 : 1;
      return E.choice(R, `Compared with ${M('y=' + ps(key))}, the graph of ${M('y=' + T(key, { a }).s)} is…`, opts[c], opts.filter((_, j) => j !== c), `Every output is multiplied by ${A}. ${stretch ? `Since ${A} > 1, heights grow: a vertical stretch.` : `Since 0 < ${A} < 1, heights shrink: a vertical compression.`} Points on the x-axis stay put.`); } },
    c: { t: 'effect on points', g: R => { const m = R.int(-3, 3), d = R.int(1, 2), r = m - d, s = m + d, n = nz(R, -4, 4); const a = R.pick(n % 2 ? [2, 3, -2, -3] : [2, 3, -2, 1 / 2, -1 / 2]);
      const f = x => -n * (x - r) * (x - s) / (d * d);
      return E.num(`The graph of y = f(x) has zeros at x = ${r} and x = ${s} and a turning point at ${pt(m, n)}. Give the zeros and the turning point of ${M(`y=${co(a)}f(x)`)}.`, [{ label: 'zeros: x =', set: [String(r), String(s)] }, { label: 'turning point', point: [String(m), fr(a * n)] }],
        `Multiplying by ${fr(a)} changes heights only. Zeros have height 0, and ${fr(a)} × 0 = 0, so they stay at ${r} and ${s}. The turning point goes to ${pt(m, fr(a * n))}.`, { visual: big([blue(f)], { points: [[r, 0], [s, 0], [m, n]] }) }); } },
    d: { t: 'write from a graph', g: R => {
      const OPT = { quad: [[2, 1], [3, 1], [1 / 2, 2], [-2, 1], [-1 / 2, 2], [1 / 3, 3]], abs: [[2, 2], [3, 1], [1 / 2, 4], [-2, 2], [1 / 3, 3]], root: [[2, 4], [3, 1], [-2, 4], [-3, 1], [1 / 2, 4]], cube: [[1 / 2, 2], [1 / 4, 2], [2, 1], [-1 / 2, 2]], exp: [[2, 0], [3, 0], [-2, 0], [1 / 2, 1]] };
      const key = R.pick(Object.keys(OPT)), [a, p] = R.pick(OPT[key]), t = T(key, { a }), y = t.f(p);
      return E.num(`The solid graph is the dashed ${M('y=' + ps(key))} stretched or compressed vertically${a < 0 ? ' (and flipped)' : ''}. Write its equation.`, [{ label: 'y =', expr: t.s }],
        `At x = ${p} the parent is ${PF[key].f(p)} and the new graph is ${fr(y)}: ${fr(a)} times as high. So y = ${ptx(t.s)}.`, { visual: big([dashed(PF[key].f), blue(t.f)], { points: [[p, y]] }) }); } },
    e: { t: 'stretch to hit a target', g: R => { let a, n, m, V;
      do { a = R.pick([-3, -2, -1 / 2, -1 / 3, 2, 3, 1 / 2, 4, -4]); n = nz(R, -6, 6); m = R.int(-4, 4); V = a * n; } while (!Number.isInteger(V));
      const mx = a < 0 ? 'maximum' : 'minimum';
      return E.num(`Let ${M('f(x)=' + E.poly([1, -2 * m, m * m + n]))}. The graph of ${M('y=af(x)')} has a ${mx} value of ${V}. Find a.`, [{ label: 'a =', exact: fr(a) }],
        `Completing the square, f(x) = ${E.pt(T('quad', { h: m, k: n }).s)}, lowest value ${n}. Multiplying by a scales that height to ${n}a = ${V}, so a = ${fr(a)}.${a < 0 ? ' A negative a flips the lowest point into a highest point.' : ''}`); } },
    f: { t: 'what a stretch cannot move', g: R => { const kind = R.int(0, 4); let coefs, zeros;
      const r = nz(R, -5, 5); let s; do s = nz(R, -5, 5); while (s === r || s === -r);
      if (kind === 0) { coefs = [1, -(r + s), r * s]; zeros = [r, s]; }
      else if (kind === 1) { coefs = [1, -2 * r, r * r]; zeros = [r]; }
      else if (kind === 2) { const h = R.int(-4, 4), k = R.int(1, 6); coefs = [1, -2 * h, h * h + k]; zeros = []; }
      else if (kind === 3) { coefs = [1, -(r + s), r * s, 0]; zeros = [0, r, s]; }
      else { const q = R.int(1, 5); coefs = [1, 0, -q * q, 0]; zeros = [0, q, -q]; }
      const f = E.poly(coefs);
      const why = `Where they meet, f(x) = af(x), so (a − 1)f(x) = 0. Since a ≠ 1, that means f(x) = 0: ${zeros.length ? 'x = ' + zeros.join(', ') : 'but f(x) = 0 has no real solution'}.`;
      if (R.bool()) return E.num(`Let ${M('f(x)=' + f)}. For any number ${M('a!=1')}, how many points do the graphs of ${M('y=f(x)')} and ${M('y=af(x)')} have in common?`, [{ ans: zeros.length }], why);
      return E.num(`Let ${M('f(x)=' + f)} and let ${M('a!=1')}. Find the x-coordinate of every point where ${M('y=f(x)')} and ${M('y=af(x)')} meet. Type "no solution" if they never meet.`, [{ label: 'x =', set: zeros.map(String) }], why); } },
  });

  /* IV.9.06 Horizontal stretch & compress */
  const bIn = b => Number.isInteger(b) ? `${b}x` : `x/${fr(1 / b)}`;
  S('IV.9.06', 'Horizontal stretch & compress', {
    a: { t: 'f(bx)', g: R => { const b = R.pick([2, 3, 4, 1 / 2, 1 / 3]), q = R.int(-6, 6); const p = Number.isInteger(b) ? b * R.int(-3, 3) : R.int(-4, 4);
      return E.num(`The point ${pt(p, q)} is on the graph of y = f(x). Which point must be on ${M(`y=f(${bIn(b)})`)}?`, [{ point: [fr(p / b), String(q)] }], `The new graph needs ${bIn(b).replace('x/', 'x ÷ ').replace(/^(\d)x/, '$1x')} = ${p}, so x = ${fr(p / b)}. Heights stay the same: ${pt(fr(p / b), q)}.`); } },
    b: { t: 'factor 1/b', g: R => { const key = R.pick(['quad', 'cube', 'root', 'exp', 'log']), big1 = R.bool(), n = R.pick([2, 3, 4]), b = big1 ? n : 1 / n;
      const opts = big1 ? [`compressed horizontally by a factor of 1/${n}`, `stretched horizontally by a factor of ${n}`, `stretched vertically by a factor of ${n}`, `compressed vertically by a factor of 1/${n}`]
        : [`stretched horizontally by a factor of ${n}`, `compressed horizontally by a factor of 1/${n}`, `compressed vertically by a factor of 1/${n}`, `stretched vertically by a factor of ${n}`];
      return E.choice(R, `Compared with ${M('y=' + ps(key))}, the graph of ${M('y=' + T(key, { b }).s)} is…`, opts[0], opts.slice(1), big1 ? `The input is multiplied by ${n}, so each output is reached ${n} times sooner: x-values shrink by a factor of 1/${n}. Heights don't change.` : `The input is divided by ${n}, so each output is reached ${n} times later: x-values grow by a factor of ${n}. Heights don't change.`); } },
    c: { t: 'effect on points', g: R => { const b = R.pick([2, 3, 1 / 2]); let m, d;
      if (b === 2) { m = 2 * R.int(-1, 1); d = 2 * R.int(1, 2); } else if (b === 3) { m = 3 * R.int(-1, 1); d = 3; } else { m = R.int(-1, 1); d = R.int(1, 2); }
      const r = m - d, s = m + d, n = nz(R, -4, 4), f = x => -n * (x - r) * (x - s) / (d * d);
      return E.num(`The graph of y = f(x) has zeros at x = ${r} and x = ${s} and a turning point at ${pt(m, n)}. Give the zeros and the turning point of ${M(`y=f(${bIn(b)})`)}.`, [{ label: 'zeros: x =', set: [fr(r / b), fr(s / b)] }, { label: 'turning point', point: [fr(m / b), String(n)] }],
        `Every x-coordinate is divided by ${fr(b)} (multiplied by ${fr(1 / b)}) and heights stay: zeros ${fr(r / b)} and ${fr(s / b)}, turning point ${pt(fr(m / b), n)}.`, { visual: big([blue(f)], { points: [[r, 0], [s, 0], [m, n]] }) }); } },
    d: { t: 'write from a graph', g: R => {
      const OPT = [['root', 4, [[1, 2], [4, 4], [1 / 4, 1]]], ['root', 1 / 4, [[4, 1], [1, 1 / 2]]], ['root', 9, [[1, 3], [4, 6]]], ['root', 2, [[2, 2], [1 / 2, 1]]], ['root', -2, [[-2, 2], [-1 / 2, 1]]],
        ['exp', 2, [[1, 4], [-1, 1 / 4], [1 / 2, 2]]], ['exp', 1 / 2, [[2, 2], [4, 4], [-2, 1 / 2]]], ['exp', -1 / 2, [[-2, 2], [-4, 4], [2, 1 / 2]]],
        ['log', 4, [[1, 2], [1 / 4, 0], [4, 4]]], ['log', 2, [[1, 1], [2, 2], [1 / 2, 0]]], ['log', 1 / 2, [[2, 0], [4, 1]]], ['log', 1 / 4, [[4, 0], [1, -2]]],
        ['quad', 2, [[1, 4], [-1, 4]]], ['quad', 1 / 2, [[2, 1], [4, 4], [-4, 4]]], ['quad', 1 / 3, [[3, 1], [-3, 1]]], ['cube', 1 / 2, [[2, 1], [-2, -1]]], ['cube', 2, [[1 / 2, 1], [-1 / 2, -1]]]];
      const [key, b, cand] = R.pick(OPT), pts = R.sample(cand, R.int(1, 2)), t = T(key, { b });
      return E.num(`The solid graph is ${M('y=' + PF[key].s('bx'))} for some number b (the dashed curve is ${M('y=' + ps(key))}). Write its equation.`, [{ label: 'y =', expr: t.s }],
        `The new graph reaches the height ${fr(pts[0][1])} at x = ${fr(pts[0][0])}, where the parent needs x = ${fr(pts[0][0] * b)}. So b·${fr(pts[0][0])} = ${fr(pts[0][0] * b)}, which gives b = ${fr(b)}: y = ${ptx(t.s)}.`, { visual: big([dashed(PF[key].f), blue(t.f)], { points: pts }) }); } },
  });
  /* IV.9.07 Combined transformations */
  S('IV.9.07', 'Combined transformations', {
    a: { t: 'order of operations', g: R => { const a = R.pick([2, 3, -1, -2, 1 / 2, 4]), k = nz(R, -6, 6), p = R.int(-6, 6); let q; do q = R.int(-5, 5); while (a === 1 / 2 && q % 2);
      return E.num(`The point ${pt(p, q)} is on the graph of y = f(x). Which point must be on ${M(`y=${co(a)}f(x)${add(k)}`)}?`, [{ point: [String(p), fr(a * q + k)] }],
        `Stretch first, then shift: the height ${q} becomes ${fr(a)} × ${q < 0 ? '(' + q + ')' : q} ${k > 0 ? '+' : '−'} ${Math.abs(k)} = ${fr(a * q + k)}, not ${fr(a)} × (${q} ${k > 0 ? '+' : '−'} ${Math.abs(k)}). x stays ${p}.`); } },
    b: { t: 'map key points', g: R => { const a = R.pick([2, 3, -1, -2, 1 / 2]), h = nz(R, -5, 5), k = nz(R, -6, 6), p = R.int(-5, 5); let q; do q = R.int(-5, 5); while (a === 1 / 2 && q % 2);
      return E.num(`The point ${pt(p, q)} is on the graph of y = f(x). Which point must be on ${M(`y=${co(a)}f(${xm(h)})${add(k)}`)}?`, [{ point: [String(p + h), fr(a * q + k)] }],
        `x moves ${dir(h, 'right', 'left')}: ${p} → ${p + h}. The height is multiplied by ${fr(a)}, then shifted by ${k}: ${fr(a)}·${q < 0 ? '(' + q + ')' : q} ${k > 0 ? '+' : '−'} ${Math.abs(k)} = ${fr(a * q + k)}.`); } },
    c: { t: 'graph a full transformation', g: R => { let key, a, h, k, w;
      do { key = R.pick(['quad', 'abs', 'root', 'exp', 'cube']); a = R.pick([-1, 2, -2, 1 / 2]); h = nz(R, -3, 3); k = nz(R, -3, 3);
        w = gPick(T(key, { a, h, k }).f, [T(key, { a, h: -h, k }).f, T(key, { a, h, k: -k }).f, T(key, { a: -a, h, k }).f, T(key, { a, h: k, k: h }).f]); } while (!w);
      const t = T(key, { a, h, k });
      return gChoice(R, `Which graph shows ${M('y=' + t.s)}? (The dashed curve is ${M('y=' + ps(key))}.)`, t.f, w, `Stretch by ${fr(a)}${a < 0 ? ' (the minus flips it)' : ''}, then move ${dir(h, 'right', 'left')} and ${dir(k, 'up', 'down')}.`, { refs: [dashed(PF[key].f)] }); } },
    d: { t: 'describe one in words', g: R => { const key = R.pick(['root', 'abs', 'quad', 'cube', 'exp']), b = R.pick([2, 3]), h = nz(R, -4, 4), k = nz(R, -5, 5);
      const eq = PF[key].s(`${b}x${add(-b * h)}`) + add(k);
      const D = (hz, hv, kv) => `${hz}, then shift ${dir(hv, 'right', 'left')} and ${dir(kv, 'up', 'down')}`, cz = `compress horizontally by a factor of 1/${b}`;
      return E.choice(R, `Which describes how to get ${M('y=' + eq)} from ${M('y=' + ps(key))}?`, D(cz, h, k), R.sample([D(cz, b * h, k), D(cz, -h, k), D(`stretch horizontally by a factor of ${b}`, h, k), D(cz, h, -k)], 3),
        `Factor the inside first: ${E.pt(`${b}x${add(-b * h)}`)} = ${b}(${E.pt(xm(h))}). So compress by 1/${b}, move ${dir(h, 'right', 'left')} (the inside is 0 at x = ${h}, not ${b * h}), and move ${dir(k, 'up', 'down')}.`); } },
  });

  /* IV.9.08 Even & odd functions */
  const evenF = R => { const k = R.int(0, 2);
    if (k === 0) { const c = [nz(R, -3, 3), 0, nz(R, -6, 6), 0, R.int(-9, 9)]; if (R.bool()) c[0] = 0; return { s: E.poly(c), neg: E.poly(c), why: 'only even powers of x appear' }; }
    if (k === 1) { const c = nz(R, -5, 5), a = R.pick([1, 2, 3]); return { s: `${co(a)}|x|${add(c)}`, neg: `${co(a)}|x|${add(c)}`, why: '|−x| = |x|' }; }
    const a = nz(R, -6, 6), c = R.int(1, 5); return { s: `${a}/(x^2+${c})`, neg: `${a}/(x^2+${c})`, why: '(−x)² = x²' }; };
  const oddF = R => { const k = R.int(0, 2);
    if (k === 0) { const c = [nz(R, -3, 3), 0, R.int(-6, 6), 0, nz(R, -9, 9), 0]; if (R.bool()) { c.splice(0, 2); } return { s: E.poly(c), neg: E.poly(c.map(v => -v)), why: 'only odd powers of x appear and there is no constant' }; }
    if (k === 1) { const a = nz(R, -5, 5), c = R.int(1, 5); return { s: `${co(a)}x/(x^2+${c})`, neg: `${co(-a)}x/(x^2+${c})`, why: 'the top changes sign and the bottom does not' }; }
    const a = nz(R, -4, 4), m = R.pick([1, 3]); return { s: `${co(a)}x${m === 3 ? '^3' : ''}|x|`, neg: `${co(-a)}x${m === 3 ? '^3' : ''}|x|`, why: `(−x)${m === 3 ? '³' : ''} changes sign and |−x| does not` }; };
  const neitherF = R => { const k = R.int(0, 3);
    if (k === 0) { const c = [nz(R, -3, 3), 0, R.int(-5, 5), nz(R, -9, 9)]; if (R.bool()) c.splice(1, 2, 0, 0); return { s: E.poly(c), neg: E.poly(negX(c)), why: 'odd powers plus a constant: a constant is not odd' }; }
    if (k === 1) { const c = [nz(R, -3, 3), nz(R, -6, 6), R.int(-9, 9)]; return { s: E.poly(c), neg: E.poly(negX(c)), why: 'it mixes an even power with an odd power' }; }
    if (k === 2) { const h = nz(R, -5, 5); return { s: T('quad', { h }).s, neg: `(-x${add(-h)})^2`, why: `its axis is x = ${h}, not the y-axis` }; }
    const b = R.pick([2, 3, 5]), c = R.int(-4, 4); return { s: `${b}^x${add(c)}`, neg: `${b}^(-x)${add(c)}`, why: 'exponentials have no symmetry' }; };

  S('IV.9.08', 'Even & odd functions', {
    a: { t: 'f(−x) = f(x)', g: R => { const p = nz(R, -9, 9), q = R.int(-20, 20);
      if (R.bool(0.7)) return E.num(`f is an even function and f(${p}) = ${q}. What is f(${-p})?`, [{ label: `f(${nt(-p)}) =`, ans: q }], `Even means f(−x) = f(x): f(${-p}) = f(${p}) = ${q}.`);
      return E.num(`f is an even function and f(${p}) = ${q}. What is f(${p}) + f(${-p})?`, [{ ans: 2 * q }], `f(${-p}) = f(${p}) = ${q}, so the sum is ${2 * q}.`); } },
    b: { t: 'f(−x) = −f(x)', g: R => { const p = nz(R, -9, 9), q = nz(R, -20, 20), kind = R.int(0, 4);
      if (kind <= 2) return E.num(`f is an odd function and f(${p}) = ${q}. What is f(${-p})?`, [{ label: `f(${nt(-p)}) =`, ans: -q }], `Odd means f(−x) = −f(x): f(${-p}) = −f(${p}) = ${-q}.`);
      if (kind === 3) return E.num(`f is an odd function and f(${p}) = ${q}. What is f(${-p}) − f(${p})?`, [{ ans: -2 * q }], `f(${-p}) = ${-q}, so ${-q} − ${q < 0 ? '(' + q + ')' : q} = ${-2 * q}.`);
      return E.num(`f is an odd function, defined at 0, and f(${p}) = ${q}. What is f(0)?`, [{ ans: 0 }], 'Odd means f(−0) = −f(0), so f(0) = −f(0), which forces f(0) = 0.'); } },
    c: { t: 'test algebraically', g: R => { const kind = R.int(0, 2), F = [evenF, oddF, neitherF][kind](R);
      return E.choiceFixed(`Is ${M('f(x)=' + F.s)} even, odd or neither?`, ['even', 'odd', 'neither'], kind, `f(−x) = ${ptx(F.neg)}, which is ${['f(x): even', '−f(x): odd', 'neither f(x) nor −f(x)'][kind]} (${F.why}).`); } },
    d: { t: 'neither', g: R => { const N = neitherF(R), others = [evenF(R), oddF(R), R.bool() ? evenF(R) : oddF(R)];
      return E.choice(R, 'Which function is neither even nor odd?', M('f(x)=' + N.s), others.map(o => M('f(x)=' + o.s)), `For ${ptx('f(x)=' + N.s)}, f(−x) = ${ptx(N.neg)}: that is neither f(x) nor −f(x) (${N.why}). Each of the others is even or odd.`); } },
    e: { t: 'find k to make it even or odd', g: R => { const kind = R.int(0, 3), p = nz(R, -6, 6), q = nz(R, -7, 7), r = R.int(-9, 9);
      const kp = v => v ? `(k${add(v)})` : 'k';
      if (kind === 0) return E.num(`For what value of k is ${M(`f(x)=x^3+${kp(-p)}x^2${addc(q)}x`)} an odd function?`, [{ label: 'k =', ans: p }], `An odd polynomial has only odd powers, so the x² coefficient must be 0: k ${p > 0 ? '−' : '+'} ${Math.abs(p)} = 0, k = ${p}.`);
      if (kind === 1) return E.num(`For what value of k is ${M(`f(x)=x^4+${kp(p)}x^3${addc(q)}x^2${add(r)}`)} an even function?`, [{ label: 'k =', ans: -p }], `An even polynomial has only even powers, so the x³ coefficient must be 0: k ${p > 0 ? '+' : '−'} ${Math.abs(p)} = 0, k = ${-p}.`);
      if (kind === 2) return E.num(`For what value of k is ${M(`f(x)=(x+k)(${xm(p)})`)} an even function?`, [{ label: 'k =', ans: p }], `Expanding: x² + (k ${p > 0 ? '−' : '+'} ${Math.abs(p)})x ${p > 0 ? '−' : '+'} ${Math.abs(p)}k. The x-term must vanish: k = ${p}.`);
      return E.num(`For what value of k is ${M(`f(x)=x(x+k)(${xm(p)})`)} an odd function?`, [{ label: 'k =', ans: p }], `Expanding: x³ + (k ${p > 0 ? '−' : '+'} ${Math.abs(p)})x² ${p > 0 ? '−' : '+'} ${Math.abs(p)}kx. The x² term must vanish: k = ${p}.`); } },
    f: { t: 'split off the odd part', g: R => {
      if (R.bool()) { const ex = R.pick([[5, 3, 1], [7, 3, 1], [5, 1], [7, 5, 3]]), D = nz(R, -12, 12), p = R.int(1, 5), v = R.int(-30, 30), L = ['a', 'b', 'c'];
        const f = ex.map((e, i) => `${L[i]}x${e === 1 ? '' : '^' + e}`).join('+') + add(D);
        return E.num(`${M('f(x)=' + f)}, where ${ex.map((_, i) => L[i]).join(', ').replace(/, (\w)$/, ' and $1')} are unknown constants. If f(${-p}) = ${v}, what is f(${p})?`, [{ label: `f(${nt(p)}) =`, ans: 2 * D - v }],
          `f(x) − ${D < 0 ? '(' + D + ')' : D} has only odd powers, so it is odd: f(${p}) − ${D < 0 ? '(' + D + ')' : D} = −(f(${-p}) − ${D < 0 ? '(' + D + ')' : D}) = −(${v - D}). So f(${p}) = ${D} − ${v - D < 0 ? '(' + (v - D) + ')' : v - D} = ${2 * D - v}.`); }
      const p = R.int(1, 6), fp = nz(R, -9, 9), gp = R.int(-9, 9), A = fp + gp, B = gp - fp;
      return E.num(`f is odd and g is even. f(${p}) + g(${p}) = ${A} and f(${-p}) + g(${-p}) = ${B}. Find f(${p}) and g(${p}).`, [{ label: `f(${nt(p)}) =`, ans: fp }, { label: `g(${nt(p)}) =`, ans: gp }],
        `f(${-p}) = −f(${p}) and g(${-p}) = g(${p}), so the second fact says −f(${p}) + g(${p}) = ${B}. Adding the two facts: 2g(${p}) = ${A + B}, so g(${p}) = ${gp}; subtracting: 2f(${p}) = ${A - B}, so f(${p}) = ${fp}.`); } },
  });

  /* IV.9.09 Symmetry of graphs */
  const symPool = (R, kind) => { const c = R.int(-2, 2), s = R.pick([1, -1]), h = nz(R, -2, 2);
    const E_ = [x => s * x * x / 2 - s * 2 + c, x => s * (Math.abs(x) - 3) + c, x => s * 5 / (x * x + 1) - s * 2, x => s * (x ** 4 / 20 - x * x / 2) + c];
    const O_ = [x => s * x ** 3 / 8, x => s * (x ** 3 - 12 * x) / 8, x => s * 2 / x, x => s * x * Math.abs(x) / 4, x => s * x / 2];
    const N_ = [x => s * (x - h) ** 2 / 2 - 2, x => 2 ** x - 3 + c, x => Math.sqrt(x + 3) + c, x => s * (x - h) ** 3 / 8 + c, x => s * (x - 2) + c];
    return R.pick([E_, O_, N_][kind]); };
  S('IV.9.09', 'Symmetry of graphs', {
    a: { t: 'y-axis symmetry', g: R => {
      if (R.bool()) { const p = nz(R, -6, 6), q = R.int(-6, 6);
        return E.num(`The graph of y = f(x) is symmetric about the y-axis and passes through ${pt(p, q)}. Which other point must be on it?`, [{ point: [String(-p), String(q)] }], `Mirroring in the y-axis changes the sign of x only: ${pt(p, q)} → ${pt(-p, q)}.`); }
      let right, w; do { right = symPool(R, 0); w = gPick(right, [symPool(R, 1), symPool(R, 2), symPool(R, R.int(1, 2)), symPool(R, 2)]); } while (!w);
      return gChoice(R, 'Which graph is symmetric about the y-axis?', right, w, 'Fold along the y-axis: the left half must land exactly on the right half.'); } },
    b: { t: 'origin symmetry', g: R => {
      if (R.bool()) { const p = nz(R, -6, 6), q = nz(R, -6, 6);
        return E.num(`The graph of y = f(x) is symmetric about the origin and passes through ${pt(p, q)}. Which other point must be on it?`, [{ point: [String(-p), String(-q)] }], `Origin symmetry sends (x, y) to (−x, −y): ${pt(p, q)} → ${pt(-p, -q)}.`); }
      let right, w; do { right = symPool(R, 1); w = gPick(right, [symPool(R, 0), symPool(R, 2), symPool(R, R.int(0, 2) === 1 ? 2 : 0), symPool(R, 2)]); } while (!w);
      return gChoice(R, 'Which graph is symmetric about the origin?', right, w, 'Turn the graph half a turn about the origin: it must land on itself. Each point (x, y) has a partner (−x, −y).'); } },
    c: { t: 'other lines of symmetry', g: R => { const kind = R.int(0, 4), h = nz(R, -6, 6), k = R.int(-6, 6);
      if (kind === 0) return E.num(`What is the line of symmetry of ${M('y=' + T('abs', { h, k }).s)}? Give its equation.`, [{ eqn: `x=${h}` }], `The V has its corner where the inside is 0, at x = ${h}: the line x = ${h}.`);
      if (kind === 1) return E.num(`What is the line of symmetry of ${M('y=' + E.poly([1, -2 * h, h * h + k]))}? Give its equation.`, [{ eqn: `x=${h}` }], `x = −b/(2a) = ${2 * h}/2 = ${h}: the line x = ${h}.`);
      if (kind === 2) { const b = R.pick([2, 3]), c = nz(R, -9, 9);
        return E.num(`What is the line of symmetry of ${M(`y=|${b}x${add(c)}|`)}? Give its equation.`, [{ eqn: `x=${fr(-c / b)}` }], `The inside ${b}x ${c > 0 ? '+' : '−'} ${Math.abs(c)} is 0 at x = ${fr(-c / b)}, where the corner is: x = ${fr(-c / b)}.`); }
      if (kind === 3) { const r = R.int(-8, 4), s = r + R.int(1, 8);
        return E.num(`A parabola crosses the x-axis at x = ${r} and x = ${s}. What is its line of symmetry? Give its equation.`, [{ eqn: `x=${fr((r + s) / 2)}` }], `The axis is halfway between the zeros: x = (${r} + ${s})/2 = ${fr((r + s) / 2)}.`); }
      const p = h + nz(R, -5, 5), q = R.int(-6, 6);
      return E.num(`A parabola has axis of symmetry ${M('x=' + h)} and passes through ${pt(p, q)}. Which other point with the same y-value is on it?`, [{ point: [String(2 * h - p), String(q)] }], `${p} is ${Math.abs(p - h)} ${p > h ? 'right' : 'left'} of the axis, so its mirror is ${Math.abs(p - h)} ${p > h ? 'left' : 'right'}: x = ${2 * h - p}.`); } },
    d: { t: 'use symmetry to finish a sketch', g: R => { let r, w, org;
      do { org = R.bool(); const s = R.pick([1, -1]), c = R.int(2, 5), m = R.pick([1, 2]);
        if (org || R.bool()) r = x => s * x * (x - c) / m; else { const t = R.int(-3, 2); r = x => s * (x - c) ** 2 / (m + 1) + t; }
        const yA = x => r(Math.abs(x)), oA = x => x >= 0 ? r(x) : -r(-x), cont = r, flip = x => x >= 0 ? r(x) : -r(x);
        w = gPick(org ? oA : yA, [org ? yA : oA, cont, flip]); } while (!w);
      const right = org ? x => x >= 0 ? r(x) : -r(-x) : x => r(Math.abs(x));
      return gChoice(R, `Here is the part of a graph with ${M('x>=0')}. The whole graph is symmetric about ${org ? 'the origin' : 'the y-axis'}. Which picture shows the whole graph?`, right, w,
        org ? 'Rotate the right half a half-turn about the origin: each point (x, y) gives (−x, −y).' : 'Mirror the right half in the y-axis: each point (x, y) gives (−x, y).', { visual: big([{ f: r, color: C.blue, from: 0 }]) }); } },
    e: { t: 'symmetry about a point', g: R => { const h = R.int(-4, 4), k = R.int(-4, 4);
      if (R.bool()) { const a = R.pick([2, 3, 4, 6, -2, -4, -6]), ds = [1, 2, 3, 6].filter(d => a % d === 0).flatMap(d => [d, -d]), d = R.pick(ds), p = h + d, q = k + a / d;
        return E.num(`The graph of ${M(`y=${a}/(${xm(h)})${add(k)}`)} has point symmetry about its center. ${pt(p, q)} is on the graph. Which point is its mirror image through the center?`, [{ point: [String(2 * h - p), String(2 * k - q)] }],
          `The center is where the asymptotes cross, ${pt(h, k)}. It is halfway between ${pt(p, q)} and its mirror, so the mirror is (2h − p, 2k − q) = ${pt(2 * h - p, 2 * k - q)}.`); }
      const d = nz(R, -2, 2), p = h + d, q = k + d ** 3;
      return E.num(`The graph of ${M('y=' + T('cube', { h, k }).s)} has point symmetry about its center. ${pt(p, q)} is on the graph. Which point is its mirror image through the center?`, [{ point: [String(2 * h - p), String(2 * k - q)] }],
        `The center of y = (x − h)³ + k is (h, k) = ${pt(h, k)}. The mirror of ${pt(p, q)} is ${pt(2 * h - p, 2 * k - q)}: the center is halfway between them.`); } },
    f: { t: 'two mirrors make a repeat', g: R => { const a = R.int(-3, 2), dd = R.int(1, 3), b = a + dd, P = 2 * dd; let p; do p = R.int(-4, 5); while (p === a || p === b); const q = nz(R, -6, 6);
      const forced = (x, y) => y === q && (mod(x - p, P) === 0 || mod(x - (2 * a - p), P) === 0);
      const n = R.pick([2, 3, -2, 4]), useRef = R.bool(), cx = useRef ? 2 * a - p + P * n : p + P * n;
      const cands = [[p + dd, q], [p + P * n + dd, q], [cx, -q], [p + 3 * dd, q], [2 * a + p, q], [-p, q], [p + P * n + 1, q]].filter(([x, y]) => !forced(x, y) && x !== cx);
      const uniq = [...new Map(cands.map(c => [c.join(','), c])).values()];
      return E.choice(R, `The graph of y = f(x) is symmetric about the line ${M('x=' + a)} and about the line ${M('x=' + b)}. The point ${pt(p, q)} is on it. Which of these points must also be on the graph?`, pt(cx, q), R.sample(uniq, 3).map(([x, y]) => pt(x, y)),
        `Reflecting in x = ${a} and then in x = ${b} slides every point ${P} to the right, so the graph repeats every ${P}. ${useRef ? `Reflect ${pt(p, q)} in x = ${a} to get ${pt(2 * a - p, q)}, then slide ${n > 0 ? '' : 'back '}${Math.abs(n)} × ${P}: ${pt(cx, q)}.` : `Slide ${pt(p, q)} ${n > 0 ? '' : 'back '}${Math.abs(n)} × ${P}: ${pt(cx, q)}.`}`); } },
  });

  /* IV.9.10 End behavior */
  const INF = s => s > 0 ? '∞' : '−∞';
  S('IV.9.10', 'End behavior', {
    a: { t: 'arrows notation', g: R => { const L = nz(R, -6, 6);
      const combos = [['+', '+'], ['+', '-'], ['+', 'L'], ['-', '+'], ['-', '-'], ['-', 'L']];
      const arrow = ([x, f]) => `as x → ${x === '+' ? '∞' : '−∞'}, f(x) → ${f === 'L' ? String(L) : INF(f === '+' ? 1 : -1)}`;
      const words = ([x, f]) => `far to the ${x === '+' ? 'right' : 'left'}, the graph ${f === '+' ? 'rises without bound' : f === '-' ? 'falls without bound' : 'levels off toward the height ' + L}`;
      const i = R.int(0, 5), others = R.sample(combos.filter((_, j) => j !== i), 3);
      if (R.bool()) return E.choice(R, `Which notation means: "${words(combos[i])}"?`, arrow(combos[i]), others.map(arrow), `"Far to the ${combos[i][0] === '+' ? 'right' : 'left'}" is x → ${combos[i][0] === '+' ? '∞' : '−∞'}. ${combos[i][1] === 'L' ? `Leveling off toward ${L} is f(x) → ${L}.` : combos[i][1] === '+' ? 'Growing past every number is f(x) → ∞; ∞ is not a number that is reached.' : 'Dropping below every number is f(x) → −∞; −∞ is not a number that is reached.'}`);
      return E.choice(R, `What does "${arrow(combos[i])}" mean?`, words(combos[i]), others.map(words), `x → ${combos[i][0] === '+' ? '∞' : '−∞'} means going far to the ${combos[i][0] === '+' ? 'right' : 'left'}; then f(x) ${combos[i][1] === 'L' ? 'gets closer and closer to ' + L : combos[i][1] === '+' ? 'grows past every number' : 'drops below every number'}.`); } },
    b: { t: 'as x → ±∞', g: R => { const ci = R.int(0, 3), even = ci < 2, pos = ci % 2 === 0, n = even ? R.pick([2, 4]) : R.pick([3, 5]), a = (pos ? 1 : -1) * R.int(1, 4);
      const c = [a]; for (let i = 0; i < n; i++) c.push(R.int(-6, 6));
      let fs = E.poly(c); if (R.bool()) { const terms = c.map((v, i) => ({ v, p: n - i })).filter(t => t.v).reverse(); fs = terms.map((t, i) => (t.v < 0 ? '-' : i ? '+' : '') + (t.p === 0 ? Math.abs(t.v) : (Math.abs(t.v) === 1 ? '' : Math.abs(t.v)) + 'x' + (t.p > 1 ? '^' + t.p : ''))).join(''); }
      const opts = ['x → −∞: f(x) → ∞, and x → ∞: f(x) → ∞', 'x → −∞: f(x) → −∞, and x → ∞: f(x) → −∞', 'x → −∞: f(x) → −∞, and x → ∞: f(x) → ∞', 'x → −∞: f(x) → ∞, and x → ∞: f(x) → −∞'];
      const idx = even ? (pos ? 0 : 1) : (pos ? 2 : 3);
      return E.choiceFixed(`Which describes the end behavior of ${M('f(x)=' + fs)}?`, opts, idx, `Only the leading term ${ptx(E.poly([a, ...Array(n).fill(0)]))} matters far out. The degree ${n} is ${even ? 'even, so both ends go the same way' : 'odd, so the ends go opposite ways'}, and the coefficient is ${pos ? 'positive' : 'negative'}, so ${opts[idx]}.`); } },
    c: { t: 'from a graph', g: R => { const fam = R.int(0, 2), right = R.bool(), dirTxt = right ? 'x → ∞' : 'x → −∞'; let f, ans, why; const k = nz(R, -4, 4), s = R.pick([1, -1]);
      if (fam === 0) { const r = R.sample([-4, -3, -2, -1, 0, 1, 2, 3, 4], 3), m = R.pick([4, 5, 6]); f = x => s * (x - r[0]) * (x - r[1]) * (x - r[2]) / m; ans = INF(right ? s : -s); why = `The curve keeps ${(right ? s : -s) > 0 ? 'rising' : 'falling'} past every height as it goes ${right ? 'right' : 'left'}.`; }
      else if (fam === 1) { const h = R.int(-1, 1); if (R.bool()) { f = x => s * 2 ** (x - h) + k; ans = right ? INF(s) : String(k); } else { f = x => s * 2 ** (h - x) + k; ans = right ? String(k) : INF(s); } why = ans.includes('∞') ? `On this side the exponential ${s > 0 ? 'rises' : 'falls'} without bound.` : `On this side the curve flattens out toward the height ${k} without reaching it.`; }
      else { const h = R.int(-2, 2); f = x => s * 2 / (x - h) + k; ans = String(k); why = `Far out on both sides the curve levels off toward the height ${k}.`; }
      const other = String(R.pick([0, k + 2, k - 2, -k].filter(v => String(v) !== ans && v !== k)));
      return E.choice(R, `The graph shows y = f(x). As ${dirTxt}, what does f(x) approach?`, ans, ['∞', '−∞', String(k), other].filter(o => o !== ans).slice(0, 3), why, { visual: big([blue(f)]) }); } },
    d: { t: 'from an equation', g: R => { const fam = R.int(0, 3), right = R.bool(), dirTxt = right ? 'x → ∞' : 'x → −∞'; let fs, ans, why, dis;
      if (fam === 0) { const s = R.pick([1, -1, 2, -2]), r = R.sample([-4, -3, -2, -1, 1, 2, 3, 5], 3), sq = R.bool(); fs = `${co(s)}${E.lin(r[0])}${sq ? E.lin(r[1]) + '^2' : E.lin(r[1]) + E.lin(r[2])}`; const deg = 3;
        const sign = right ? s : -s; ans = INF(sign); dis = ['0', String(s * r[0] * r[1] * (sq ? r[1] : r[2]) * -1)]; why = `Multiplying out, the leading term is ${co(s)}x³. Degree 3 is odd and the coefficient is ${s > 0 ? 'positive' : 'negative'}, so as ${dirTxt}, f(x) → ${ans}.`.replace('is x³', 'is x³').replace(/is -x³/, 'is −x³'); void deg; }
      else if (fam === 1) { const b = R.pick([2, 3, 5]), a = R.pick([1, 2, 3, -1, -2]), k = nz(R, -6, 6), dec = R.bool(); fs = `${a === 1 ? '' : a === -1 ? '-' : a + '*'}${dec ? `(1/${b})` : b}^x${add(k)}`;
        const grows = right !== dec; ans = grows ? INF(a) : String(k); dis = [String(a + k), '0', String(-k)]; why = grows ? `${dec ? `(1/${b})ˣ` : `${b}ˣ`} grows without bound on this side, so f(x) → ${ans}.` : `${dec ? `(1/${b})ˣ` : `${b}ˣ`} shrinks toward 0 on this side, leaving the constant: f(x) → ${k}.`; }
      else if (fam === 2) { let p, q, r, s; do { p = nz(R, -6, 6); q = R.int(-9, 9); r = nz(R, 1, 4); s = R.int(-9, 9); } while (p * s === q * r || s === 0 || fr(q / s) === fr(p / r));
        fs = `(${E.poly([p, q])})/(${E.poly([r, s])})`; ans = fr(p / r); dis = [fr(q / s), '0']; why = `Far out, only the x-terms matter: ${ptx(E.poly([p, 0]))}/${ptx(E.poly([r, 0]))} = ${ans}. The same limit holds at both ends.`; }
      else { const a = nz(R, -9, 9), c = R.int(1, 9), top = R.bool(); fs = top ? `${a}/(x^2+${c})` : `(${a}x^2+1)/(x^2+${c})`; ans = top ? '0' : String(a); dis = [top ? String(a) : fr(1 / c), top ? fr(a / c) : '0'];
        why = top ? `The bottom grows without bound while the top stays ${a}, so f(x) → 0.` : `The x² terms dominate: ${a}x²/x² = ${a}.`; }
      const opts = ['∞', '−∞', ...dis].filter((o, i, A) => o !== ans && A.indexOf(o) === i);
      return E.choice(R, `As ${dirTxt}, what does ${M('f(x)=' + fs)} approach?`, ans, R.sample(opts, Math.min(3, opts.length)), why); } },
  });

  /* IV.9.11 Continuity informally */
  const jumpPic = (f1, f2, c) => big([{ f: f1, color: C.blue, to: c }, { f: f2, color: C.blue, from: c }], { points: [[c, f1(c), '', true], [c, f2(c)]] });
  S('IV.9.11', 'Continuity informally', {
    a: { t: 'draw without lifting', g: R => { const cont = R.bool(), fam = R.int(0, 2); let vis, why;
      if (cont) { const h = R.int(-2, 2), k = R.int(-3, 2), s = R.pick([1, -1]);
        const f = [x => s * (Math.abs(x - h) - 2) + k, x => s * (x - h) * ((x - h) ** 2 - 9) / 6, x => 2 ** (x - h) - 3 + k][fam]; vis = big([blue(f)]); why = 'It is one unbroken curve: no jumps, holes or breaks.'; }
      else if (fam === 0) { const c = R.int(-2, 2), m = R.pick([1, -1, 1 / 2]), b1 = R.int(-2, 2), gap = nz(R, -3, 3); vis = jumpPic(x => m * x + b1, x => m * x + b1 + gap, c); why = `It jumps at x = ${c}, so the pencil must lift.`; }
      else if (fam === 1) { const c = R.int(-3, 3), s = R.pick([1, -1]), k = R.int(-2, 2), f = x => s * x / 2 + k; vis = big([blue(f)], { points: [[c, f(c), '', true]] }); why = `There is a hole at x = ${c}; you must lift the pencil to skip it.`; }
      else { const h = R.int(-2, 2), k = R.int(-2, 2), a = R.pick([1, -1, 2]); vis = big([blue(x => a / (x - h) + k)]); why = `The graph breaks at the vertical asymptote x = ${h}: its two branches are separate.`; }
      return E.choiceFixed('Can you draw this whole graph without lifting your pencil?', ['Yes', 'No'], cont ? 0 : 1, why, { visual: vis }); } },
    b: { t: 'jumps', g: R => { const c = R.int(-4, 4), m1 = nz(R, -3, 3), b1 = R.int(-6, 6), m2 = nz(R, -3, 3), L = m1 * c + b1, gap = R.bool(0.3) ? 0 : nz(R, -6, 6), b2 = L + gap - m2 * c;
      const ev = (m, b) => `${m === 1 ? '' : m === -1 ? '−' : nt(m) + '·'}${c < 0 ? '(' + nt(c) + ')' : c}${b ? ` ${b < 0 ? '−' : '+'} ${Math.abs(b)}` : ''}`;
      return E.num(`${M('f(x)=' + E.poly([m1, b1]))} for ${M('x<' + c)}, and ${M('f(x)=' + E.poly([m2, b2]))} for ${M('x>=' + c)}. How big is the jump at x = ${c}? Enter 0 if there is no jump.`, [{ label: 'jump =', ans: Math.abs(gap) }],
        `From the left the graph heads to ${ev(m1, b1)} = ${L}. At x = ${c} and to the right it starts at ${ev(m2, b2)} = ${L + gap}. ${gap ? `The jump is |${nt(L + gap)} − ${L < 0 ? '(' + nt(L) + ')' : L}| = ${Math.abs(gap)}.` : 'They match, so there is no jump.'}`); } },
    c: { t: 'holes', g: R => { const kind = R.int(0, 2), r = nz(R, -6, 6); let s; do s = R.int(-6, 6); while (s === r);
      if (kind === 0) return E.num(`The graph of ${M(`f(x)=(x^2-${r * r})/(${xm(r)})`)} has a hole. What are its coordinates?`, [{ point: [String(r), String(2 * r)] }], `x² − ${r * r} = (${E.pt(xm(r))})(${E.pt(xm(-r))}), so f(x) = ${E.pt(xm(-r))} except at x = ${r}, where it is undefined. The hole is at ${pt(r, 2 * r)}.`);
      if (kind === 1) return E.num(`The graph of ${M(`f(x)=(${E.poly([1, -(r + s), r * s])})/(${xm(r)})`)} has a hole. What are its coordinates?`, [{ point: [String(r), String(r - s)] }], `The top factors as ${ft(r)}${ft(s)}, so f(x) = ${E.pt(xm(s))} except at x = ${r}. The hole is at ${pt(r, r - s)}.`);
      if (s === 0) s = r + 1;
      return E.num(`The graph of ${M(`f(x)=(${xm(r)})/(${E.poly([1, -(r + s), r * s])})`)} has one hole. What are its coordinates?`, [{ point: [String(r), fr(1 / (r - s))] }], `The bottom is ${ft(r)}${ft(s)}, so f(x) = 1/${ft(s)} except at x = ${r}. The hole is at ${pt(r, fr(1 / (r - s)))}; x = ${s} is an asymptote.`); } },
    d: { t: 'breaks at asymptotes', g: R => { let r, s; do { r = R.int(-6, 6); s = R.int(-6, 6); } while (r >= s); const p = R.bool(0.3) ? R.pick([r, s]) : R.int(-6, 6);
      const num = p === 0 ? 'x' : xm(p), den = E.poly([1, -(r + s), r * s]);
      const note = p === r || p === s ? `x = ${p} gives a hole (the factor cancels) and x = ${p === r ? s : r} a vertical asymptote` : 'both are vertical asymptotes';
      return E.num(`At which x-values does the graph of ${M(`f(x)=(${num})/(${den})`)} break (a hole or a vertical asymptote)?`, [{ label: 'x =', set: [String(r), String(s)] }],
        `The bottom ${E.pt(den)} = ${ft(r) === 'x' ? ft(s) + 'x' : ft(r) + ft(s)} is 0 at x = ${r} and x = ${s}, so f is undefined there: ${note}. Everywhere else f is continuous.`); } },
  });

  /* IV.9.12 Asymptotes informally */
  S('IV.9.12', 'Asymptotes informally', {
    a: { t: 'vertical', g: R => { const h = nz(R, -7, 7), kind = R.int(0, 2), k = R.int(-5, 5), a = nz(R, -6, 6);
      const fs = kind === 0 ? `${a}/(${xm(h)})${add(k)}` : kind === 1 ? `(${xm(-h - nz(R, 1, 4))})/(${xm(h)})` : `${a}/(${R.pick([2, 3])}${xm(h).replace(/^x/, '(x') + ')'})`;
      return E.num(`What is the vertical asymptote of ${M('y=' + fs)}? Give its equation.`, [{ eqn: `x=${h}` }], `The bottom is 0 at x = ${h} (and the top is not), so the graph shoots off to ±∞ there: x = ${h}.`); } },
    b: { t: 'horizontal', g: R => { const kind = R.int(0, 3); let fs, L, why;
      if (kind === 0) { const h = R.int(-5, 5), k = nz(R, -7, 7), a = nz(R, -6, 6); fs = `${a}/(${xm(h)})${add(k)}`; L = String(k); why = `Far out, ${a}/(${E.pt(xm(h))}) is tiny, so y gets close to ${k}.`; }
      else if (kind === 1) { let p, q, r, s; do { p = nz(R, -8, 8); q = R.int(-9, 9); r = R.int(1, 5); s = R.int(-9, 9); } while (p * s === q * r); fs = `(${E.poly([p, q])})/(${E.poly([r, s])})`; L = fr(p / r); why = `Far out, only the x-terms matter: ${p}x/${r}x = ${L}.`; }
      else if (kind === 2) { const b = R.pick([2, 3, 5]), a = nz(R, -4, 4), k = nz(R, -7, 7); fs = `${a === 1 ? '' : a === -1 ? '-' : a + '*'}${b}^x${add(k)}`; L = String(k); why = `Far to the left ${b}ˣ → 0, so y gets close to ${k}.`; }
      else { const p = nz(R, -9, 9), q = R.int(-9, 9), s = R.int(1, 9); fs = `(${E.poly([p, q])})/(x^2+${s})`; L = '0'; why = 'The bottom has the higher power, so for large |x| the fraction shrinks to 0.'; }
      return E.num(`What is the horizontal asymptote of ${M('y=' + fs)}? Give its equation.`, [{ eqn: 'y=' + L }], why + ` The asymptote is y = ${L}.`); } },
    c: { t: 'from a graph', g: R => { const h = R.int(-3, 3), k = R.int(-3, 3), a = R.pick([1, 2, 3, -1, -2, -3]);
      return E.num('The graph shows a function with one vertical and one horizontal asymptote. Give both equations.', [{ label: 'vertical:', eqn: `x=${h}` }, { label: 'horizontal:', eqn: `y=${k}` }],
        `The branches shoot up and down beside x = ${h}, and far out they level off toward y = ${k}.`, { visual: big([blue(x => a / (x - h) + k)]) }); } },
    d: { t: 'meaning in context', g: (R, O) => { const kind = R.int(0, 3), $ = cur(O);
      if (kind === 0) { const F = R.pick([200, 300, 500, 800, 1200]), v = R.int(2, 15);
        return E.num(`A workshop pays ${$}${F} for a machine plus ${$}${v} per item, so the average cost per item is ${M(`C(n)=(${F}+${v}n)/n`)}. What value does C(n) approach as n grows?`, [{ label: 'C(n) →', ans: v }], `C(n) = ${F}/n + ${v}. As n grows, ${F}/n shrinks to 0, so the average cost approaches ${$}${v} per item: the horizontal asymptote.`); }
      if (kind === 1) { const A = R.pick([8, 10, 12, 20, 25, 30]), B = R.int(2, 9);
        return E.num(`The concentration of a medicine in the blood t hours after a steady drip starts is ${M(`C(t)=${A}t/(t+${B})`)} mg/L. What level does it approach over time?`, [{ label: 'C(t) →', ans: A }], `For large t, t/(t + ${B}) → 1, so C(t) → ${A} mg/L. The level creeps up toward ${A} but never reaches it.`); }
      if (kind === 2) { const Rm = R.int(15, 25), D = R.int(40, 75);
        return E.num(`A cup of tea cools so that its temperature after t minutes is ${M(`T(t)=${Rm}+${D}(0.9)^t`)} °C. What temperature does it approach?`, [{ label: 'T(t) →', ans: Rm }], `(0.9)ᵗ shrinks toward 0, so T(t) → ${Rm} °C: the room temperature.`); }
      const F = R.pick([300, 500, 900]), v = R.int(2, 9);
      return E.choice(R, `The average cost per item is ${M(`C(n)=(${F}+${v}n)/n`)} dollars. What does its horizontal asymptote y = ${v} mean?`.replace(' dollars', $ === '$' ? ' dollars' : ' baht'), `For very large orders, the average cost per item gets close to ${$}${v}.`,
        [`The average cost is never more than ${$}${v}.`, `At some order size the average cost is exactly ${$}${v}.`, `Making ${v} items costs ${$}${F}.`], `C(n) = ${F}/n + ${v} is always a bit above ${v} but gets closer as n grows. An asymptote describes what happens far out.`); } },
  });
  /* IV.9.13 One-to-one & inverses on graphs */
  S('IV.9.13', 'One-to-one & inverses on graphs', {
    a: { t: 'horizontal line test', g: R => { const yes = R.bool(), h = R.int(-2, 2), k = R.int(-2, 2), s = R.pick([1, -1]);
      const Y = [x => s * (x - h) ** 3 / 4 + k, x => s * 2 ** (x - h) + k, x => Math.log2(x + 3) + k, x => s * Math.sqrt(x + 4) + k, x => s * 2 / (x - h) + k, x => s * (x / 2) + k];
      const N = [x => s * ((x - h) ** 2 / 2 - 3) + k, x => s * (Math.abs(x - h) - 2) + k, x => s * ((x - h) ** 3 - 9 * (x - h)) / 6, x => s * (5 / (x * x + 1) - 2)];
      const f = R.pick(yes ? Y : N);
      return E.choiceFixed('Is this function one-to-one?', ['Yes', 'No'], yes ? 0 : 1, yes ? 'Every horizontal line meets the graph at most once, so each output comes from only one input: one-to-one.' : 'Some horizontal line meets the graph more than once, so two inputs share an output: not one-to-one. (It is still a function: vertical lines meet it once.)', { visual: big([blue(f)]) }); } },
    b: { t: 'reflect over y = x', g: R => { let f, fi, w;
      do { const kind = R.int(0, 4), c = R.int(-2, 1);
        if (kind === 0) { f = x => 2 ** x + c; fi = x => x - c > 0 ? Math.log2(x - c) : NaN; }
        else if (kind === 1) { f = x => x > 0 ? Math.log2(x) + c : NaN; fi = x => 2 ** (x - c); }
        else if (kind === 2) { const d = R.int(0, 3); f = x => x + d >= 0 ? Math.sqrt(x + d) : NaN; fi = x => x >= 0 ? x * x - d : NaN; }
        else if (kind === 3) { f = x => (x - c) ** 3; fi = x => Math.cbrt(x) + c; }
        else { const m = R.pick([2, 3, 1 / 2, 1 / 3, -2]), b = R.int(-2, 2); f = x => m * x + b; fi = x => (x - b) / m; }
        w = gPick(fi, [x => -f(x), x => f(-x), f, x => fi(-x)]); } while (!w || !differ(f, fi));
      return gChoice(R, `The graph shows y = f(x) and the dashed line y = x. Which graph shows ${M('y=f^(-1)(x)')}?`, fi, w, 'Reflect the graph over y = x: each point (a, b) of f becomes (b, a) on the inverse.', { refs: [idLine], visual: big([idLine, blue(f)]) }); } },
    c: { t: 'inverse points (b, a)', g: R => { const kind = R.int(0, 2), p = R.int(-9, 9); let q; do q = R.int(-9, 9); while (q === p);
      if (kind === 0) return E.num(`The point ${pt(p, q)} is on the graph of a one-to-one function f. Which point must be on the graph of ${M('f^(-1)')}?`, [{ point: [String(q), String(p)] }], `The inverse swaps inputs and outputs: ${pt(p, q)} → ${pt(q, p)}.`);
      if (kind === 1) return E.num(`f is one-to-one and f(${p}) = ${q}. What is ${M(`f^(-1)(${q})`)}?`, [{ ans: p }], `f sends ${p} to ${q}, so f⁻¹ sends ${q} back to ${p}.`);
      const xs = [-2, -1, 0, 1, 2, 3].slice(R.int(0, 1), R.int(5, 6)), ys = R.sample([-7, -5, -4, -3, -1, 0, 2, 3, 5, 6, 8, 9, 11], xs.length), i = R.int(0, xs.length - 1);
      return E.num(`Using the table of the one-to-one function f, find ${M(`f^(-1)(${ys[i]})`)}.${table([['x', xs], ['f(x)', ys]])}`, [{ ans: xs[i] }], `Look for ${ys[i]} in the f(x) row: it sits under x = ${xs[i]}, so f⁻¹(${nt(ys[i])}) = ${xs[i]}.`); } },
    d: { t: 'inverse domain and range', g: R => { const kind = R.int(0, 3), h = R.int(-5, 5), k = R.int(-5, 5);
      if (kind === 0) { const a = R.int(-8, 0), b = a + R.int(2, 9), c = R.int(-8, 0), d = c + R.int(2, 9), br = () => R.pick([['[', ']'], ['(', ']'], ['[', ')']]), [l1, r1] = br(), [l2, r2] = br();
        const D = `${l1}${a},${b}${r1}`, Rg = `${l2}${c},${d}${r2}`;
        return E.num(`A one-to-one function f has domain ${E.pt(D)} and range ${E.pt(Rg)}. Give the domain and range of ${M('f^(-1)')}.`, [{ label: 'domain of f⁻¹', interval: Rg }, { label: 'range of f⁻¹', interval: D }], 'The inverse swaps inputs and outputs, so the domain of f⁻¹ is the range of f and the range of f⁻¹ is the domain of f.'); }
      const F = [[T('root', { h, k }).s, `[${h},inf)`, `[${k},inf)`], [T('exp', { k }).s, '(-inf,inf)', `(${k},inf)`], [`-sqrt(${xm(h)})${add(k)}`, `[${h},inf)`, `(-inf,${k}]`]][kind - 1];
      return E.num(`Let ${M('f(x)=' + F[0])}. Give the domain and range of ${M('f^(-1)')}.`, [{ label: 'domain of f⁻¹', interval: F[2] }, { label: 'range of f⁻¹', interval: F[1] }],
        `f has domain ${E.pt(F[1])} and range ${E.pt(F[2])}. The inverse swaps them: domain ${E.pt(F[2])}, range ${E.pt(F[1])}.`); } },
    e: { t: 'invert by spotting the input', g: R => { const cub = R.bool(), a = R.int(1, 5), b = R.int(-9, 9), m = cub ? R.int(-2, 3) : R.int(0, 4);
      const fs = cub ? `x^3${addc(a)}x${add(b)}` : `2^x${addc(a)}x${add(b)}`, v = cub ? m ** 3 + a * m + b : 2 ** m + a * m + b;
      return E.num(`${M('f(x)=' + fs)} is increasing, so it is one-to-one. Find ${M(`f^(-1)(${v})`)}.`, [{ ans: m }],
        `f⁻¹(${nt(v)}) is the input that gives ${v}. Try small whole numbers: f(${m}) = ${cub ? `${m < 0 ? '(' + nt(m) + ')' : m}³` : `2${sup(m)}`} + ${a === 1 ? '' : a + '·'}${m < 0 ? '(' + nt(m) + ')' : m} ${b < 0 ? '−' : '+'} ${Math.abs(b)} = ${v}. Since f is increasing, no other input works: f⁻¹(${nt(v)}) = ${m}.`); } },
    f: { t: 'a function that is its own inverse', g: R => { let a, b, c; do { a = nz(R, -6, 6); b = nz(R, -9, 9); c = nz(R, -4, 4); } while (-a * a - b * c === 0);
      const topK = R.bool();
      const fs = topK ? `(kx${add(b)})/(${co(c)}x${add(-a)})` : `(${co(a)}x${add(b)})/(${co(c)}x+k)`;
      return E.num(`For what value of k is ${M('f(x)=' + fs)} its own inverse (so its graph is symmetric about y = x)?`, [{ label: 'k =', ans: topK ? a : -a }],
        `f(x) = (ax + b)/(cx + d) with c ≠ 0 is its own inverse exactly when a + d = 0; then f(f(x)) simplifies back to x. Here ${topK ? `k + (${nt(-a)}) = 0, so k = ${a}` : `${nt(a)} + k = 0, so k = ${-a}`}.`); } },
  });

  /* IV.9.14 Restrict a domain */
  const invStr = (h, k, up) => { const rad = `sqrt(${xm(k)})`; return h === 0 ? (up ? rad : '-' + rad) : `${h}${up ? '+' : '-'}${rad}`; };
  S('IV.9.14', 'Restrict a domain', {
    a: { t: 'why restrict', g: R => { const h = R.int(-5, 5), k = R.int(-6, 6), key = R.pick(['quad', 'abs']), up = R.bool(), d1 = R.int(1, 3), d2 = R.int(1, 3);
      const right = M(up ? `x>=${h}` : `x<=${h}`), wrongs = [M(`x>=${h - d1}`), M(`x<=${h + d2}`), 'all real numbers', M(up ? `x<=${h + d1 + 1}` : `x>=${h - d2 - 1}`)];
      return E.choice(R, `Which domain restriction makes ${M('f(x)=' + T(key, { h, k }).s)} one-to-one?`, right, R.sample(wrongs, 3), `f turns at x = ${h}, so it fails the horizontal line test on any interval that contains points on both sides of ${h}. Staying on one side, such as ${E.pt(up ? 'x>=' + h : 'x<=' + h)}, makes it one-to-one.`); } },
    b: { t: 'restrict a parabola', g: R => { const h = R.int(-5, 5), k = R.int(-8, 8); let p; do p = R.int(-8, 8); while (p === h);
      const iv = p > h ? `[${h},inf)` : `(-inf,${h}]`;
      return E.num(`${M('f(x)=' + E.poly([1, -2 * h, h * h + k]))}. What is the largest interval containing x = ${p} on which f is one-to-one?`, [{ interval: iv }], `The vertex is at x = −b/(2a) = ${h}. f is one-to-one on each side of it; x = ${p} is on the ${p > h ? 'right' : 'left'}, so the interval is ${E.pt(iv)}.`); } },
    c: { t: 'find the inverse on that piece', g: R => { const h = R.int(-5, 5), k = R.int(-4, 1), up = R.bool();
      return E.num(`${M('f(x)=' + T('quad', { h, k }).s)} with domain ${M(up ? `x>=${h}` : `x<=${h}`)}. Find ${M('f^(-1)(x)')}.`, [{ label: 'f⁻¹(x) =', expr: invStr(h, k, up) }],
        `Swap x and y: x = ${h === 0 ? 'y' : '(' + E.pt(xm(h)).replace('x', 'y') + ')'}²${k ? ` ${k < 0 ? '−' : '+'} ${Math.abs(k)}` : ''}, so ${h === 0 ? 'y' : E.pt(xm(h)).replace('x', 'y')} = ±${E.pt(`sqrt(${xm(k)})`)}. On this piece y ${up ? '≥' : '≤'} ${h}, so take the ${up ? '+' : '−'} root: f⁻¹(x) = ${E.pt(invStr(h, k, up))}.`); } },
    d: { t: 'check it', g: R => { const h = R.int(-5, 5), k = R.int(-5, 5), up = R.bool(), ok = R.bool(), gs = invStr(h, k, ok ? up : !up), x0 = up ? h + 2 : h - 2, g0 = ok ? x0 : 2 * h - x0;
      return E.choiceFixed(`${M('f(x)=' + T('quad', { h, k }).s)} with domain ${M(up ? `x>=${h}` : `x<=${h}`)}. Is ${M('g(x)=' + gs)} the inverse of f?`, ['Yes', 'No'], ok ? 0 : 1,
        `Test x = ${x0}, which is in the domain: f(${nt(x0)}) = ${k + 4}, and g(${nt(k + 4)}) = ${h} ${(ok ? up : !up) ? '+' : '−'} 2 = ${g0}. ${ok ? `That returns ${x0}, as an inverse must.` : `That is not ${x0}, so g undoes the other half of the parabola. The right inverse uses the ${up ? '+' : '−'} root.`}`); } },
  });

  /* IV.9.15 Composition on graphs & tables */
  const lblAt = F => { for (let x = 5; x >= -5; x -= 0.5) { const y = F(x); if (isFinite(y) && Math.abs(y) < 4.5) return x; } return 0; };
  S('IV.9.15', 'Composition on graphs & tables', {
    a: { t: 'f(g(a)) from tables', g: R => { const s = R.int(-2, 1), xs = [0, 1, 2, 3, 4].map(v => v + s), f = xs.map(() => R.pick(xs)), g = xs.map(() => R.pick(xs)), i = R.int(0, 4), gf = R.bool(0.7);
      const tb = table([['x', xs], ['f(x)', f], ['g(x)', g]]);
      if (gf) { const m = g[i], v = f[xs.indexOf(m)]; return E.num(`Use the table to find ${M(`f(g(${xs[i]}))`)}.${tb}`, [{ ans: v }], `Start inside: g(${nt(xs[i])}) = ${m}. Then f(${nt(m)}) = ${v}.`); }
      const m = f[i], v = g[xs.indexOf(m)]; return E.num(`Use the table to find ${M(`g(f(${xs[i]}))`)}.${tb}`, [{ ans: v }], `Start inside: f(${nt(xs[i])}) = ${m}. Then g(${nt(m)}) = ${v}.`); } },
    b: { t: 'from graphs', g: R => { let f, g, a, m, v, gf, fS, gS;
      do { const mm = R.pick([1, -1, 2, 1 / 2]), c = R.int(-3, 3), s = R.pick([1, -1]), h = R.int(-3, 3), k = R.int(-3, 3);
        f = x => mm * x + c; g = x => s * Math.abs(x - h) + k; fS = [mm, c]; gS = [s, h, k]; a = R.int(-5, 5); gf = R.bool();
        m = gf ? g(a) : f(a); v = gf ? f(m) : g(m); } while (!Number.isInteger(m) || !Number.isInteger(v) || Math.abs(m) > 5 || Math.abs(v) > 5);
      void fS; void gS;
      const vis = big([{ f, color: C.red, label: 'f', lx: lblAt(f) }, { f: g, color: C.blue, label: 'g', lx: lblAt(g) }]);
      return E.num(`The graph shows f (red) and g (blue). Find ${M(gf ? `f(g(${a}))` : `g(f(${a}))`)}.`, [{ ans: v }], `Inside first: ${gf ? 'g' : 'f'}(${nt(a)}) = ${m} from the ${gf ? 'blue' : 'red'} graph. Then ${gf ? 'f' : 'g'}(${nt(m)}) = ${v} from the ${gf ? 'red' : 'blue'} graph.`, { visual: vis }); } },
    c: { t: 'domain of a composition', g: R => { const kind = R.int(0, 3);
      if (kind === 0) { const m = R.pick([1, 2, 3, -1, -2]), c = nz(R, -8, 8), b = fr(-c / m), iv = m > 0 ? `[${b},inf)` : `(-inf,${b}]`;
        return E.num(`${M('f(x)=sqrt(x)')} and ${M('g(x)=' + E.poly([m, c]))}. What is the domain of ${M('f(g(x))')}? Use interval notation.`, [{ interval: iv }], `f(g(x)) = √(${E.pt(E.poly([m, c]))}), which needs ${E.pt(E.poly([m, c]))} ≥ 0: ${E.pt(m > 0 ? 'x>=' + b : 'x<=' + b)}. So the domain is ${E.pt(iv)}.`); }
      if (kind === 1) { const c = nz(R, -9, 9);
        return E.num(`${M('f(x)=1/x')} and ${M('g(x)=' + xm(c))}. What is the domain of ${M('f(g(x))')}? Use interval notation.`, [{ interval: `(-inf,${c})U(${c},inf)` }], `f(g(x)) = 1/(${E.pt(xm(c))}); g(x) must not be 0, so x ≠ ${c}: ${E.pt(`(-inf,${c})U(${c},inf)`)}.`); }
      if (kind === 2) { const c = R.int(1, 4);
        return E.num(`${M(`f(x)=1/(${xm(c)})`)} and ${M('g(x)=sqrt(x)')}. What is the domain of ${M('f(g(x))')}? Use interval notation.`, [{ interval: `[0,${c * c})U(${c * c},inf)` }], `g needs x ≥ 0, and then f needs √x ≠ ${c}, so x ≠ ${c * c}: ${E.pt(`[0,${c * c})U(${c * c},inf)`)}.`); }
      const m = R.int(1, 4);
      return E.num(`${M(`f(x)=sqrt(x-${m * m})`)} and ${M('g(x)=x^2')}. What is the domain of ${M('f(g(x))')}? Use interval notation.`, [{ interval: `(-inf,-${m})U[${m},inf)`.replace(`(-inf,-${m})`, `(-inf,-${m}]`) }], `f(g(x)) = √(x² − ${m * m}) needs x² ≥ ${m * m}, so x ≤ −${m} or x ≥ ${m}: ${E.pt(`(-inf,-${m}]U[${m},inf)`)}.`); } },
    d: { t: 'in context', g: (R, O) => { const kind = R.int(0, 2), $ = cur(O);
      if (kind === 0) { const u = R.int(2, 6), F = R.pick([20, 30, 50, 80]), r = R.pick([12, 15, 20, 25, 40]), t = R.int(2, 6);
        return E.num(`A bakery's cost for n loaves is ${M(`C(n)=${u}n+${F}`)} (${$}). It bakes ${M(`n(t)=${r}t`)} loaves in t hours. What is ${M(`C(n(${t}))`)}, the cost of ${t} hours of baking?`, [{ label: `cost = ${$}`, ans: u * r * t + F }], `n(${t}) = ${r * t} loaves, then C(${r * t}) = ${u}·${r * t} + ${F} = ${u * r * t + F}.`); }
      if (kind === 1) { const b = 5 * R.int(-2, 4), t = R.int(1, 6), c = 5 * t + b, F = 9 * c / 5 + 32;
        return E.num(`A lab heats a liquid so its temperature is ${M(`c(t)=5t${add(b)}`)} °C after t minutes. Converting to Fahrenheit uses ${M('F(c)=9/5c+32')}. What is ${M(`F(c(${t}))`)}?`, [{ label: 'F =', ans: F }], `c(${t}) = ${c} °C, then F(${nt(c)}) = 9·${c < 0 ? '(' + nt(c) + ')' : c}/5 + 32 = ${F} °F.`); }
      const s = R.int(2, 5), t = R.int(1, 4);
      return E.num(`A ripple's radius after t seconds is ${M(`r(t)=${s}t`)} cm, and a circle's area is ${M('A(r)=pir^2')}. What is ${M(`A(r(${t}))`)}? Give an exact answer.`, [{ label: 'area =', exact: `${(s * t) ** 2}pi` }], `r(${t}) = ${s * t} cm, then A(${s * t}) = π·${s * t}² = ${(s * t) ** 2}π cm².`); } },
    e: { t: 'work backwards through a composition', g: R => {
      if (R.bool()) { let xs, f, g, a, v, n;
        do { const s = R.int(-2, 1); xs = [0, 1, 2, 3, 4].map(q => q + s); f = xs.map(() => R.pick(xs)); g = xs.map(() => R.pick(xs)); a = R.int(0, 4); const fg = xs.map((_, i) => f[xs.indexOf(g[i])]); v = fg[a]; n = fg.filter(u => u === v).length; } while (n !== 1);
        const m = g[a];
        return E.num(`Use the table to find the value of x for which ${M(`f(g(x))=${v}`)}.${table([['x', xs], ['f(x)', f], ['g(x)', g]])}`, [{ label: 'x =', ans: xs[a] }], `f(g(x)) = ${v} needs g(x) to be an input where f gives ${v}. Checking each x: g(${nt(xs[a])}) = ${m} and f(${nt(m)}) = ${v}, and no other x works.`); }
      const m = nz(R, -3, 3), c = R.int(-4, 4), p = nz(R, -3, 3), q = R.int(-6, 6), r = R.int(-9, 9);
      const comp = E.poly([p * m * m, 2 * p * m * c + q * m, p * c * c + q * c + r]);
      return E.num(`${M('g(x)=' + E.poly([m, c]))} and ${M('f(g(x))=' + comp)}. Find f(x).`, [{ label: 'f(x) =', expr: E.poly([p, q, r]), form: 'expanded' }],
        `Try f(x) = ax² + bx + c: f(g(x)) = a(${E.pt(E.poly([m, c]))})² + b(${E.pt(E.poly([m, c]))}) + c. Matching the x² term gives a = ${p}, then the x-term gives b = ${q}, then the constant gives c = ${r}: f(x) = ${E.pt(E.poly([p, q, r]))}.`); } },
    f: { t: 'iterate until it cycles', g: R => { let f, a, mu, lam, orbit;
      do { f = [1, 2, 3, 4, 5, 6].map(() => R.int(1, 6)); a = R.int(1, 6); orbit = [a]; const seen = { [a]: 0 }; let x = a;
        for (;;) { x = f[x - 1]; if (seen[x] !== undefined) { mu = seen[x]; lam = orbit.length - mu; break; } seen[x] = orbit.length; orbit.push(x); } } while (lam < 2 || lam > 4);
      const n = R.int(20, 2030), idx = n < mu ? n : mu + ((n - mu) % lam), ans = orbit[idx];
      return E.num(`Using the table, apply f to ${a} over and over: f(${a}), then f(f(${a})), and so on. What number do you get after applying f ${n} times?${table([['x', [1, 2, 3, 4, 5, 6]], ['f(x)', f]])}`, [{ ans }],
        `Follow the chain: ${orbit.join(' → ')} → ${orbit[mu]} … From step ${mu} on it repeats every ${lam} steps. ${n} − ${mu} = ${n - mu} leaves remainder ${(n - mu) % lam} when divided by ${lam}, so after ${n} steps you are at ${ans}.`); } },
  });

  /* IV.9.16 Choosing a model */
  const diffs = ys => ys.slice(1).map((y, i) => y - ys[i]);
  S('IV.9.16', 'Choosing a model', {
    a: { t: 'constant differences mean linear', g: R => { const s = R.int(-2, 2), xs = [0, 1, 2, 3, 4].map(v => v + s), lin = R.bool(); let ys;
      if (lin) { const m = nz(R, -9, 9), b = R.int(-9, 9); ys = xs.map(x => m * x + b); }
      else if (R.bool()) { const a = nz(R, -3, 3), b = R.int(-6, 6), c = R.int(-6, 6); ys = xs.map(x => a * x * x + b * x + c); }
      else { const g = R.int(1, 3), r = R.pick([2, 3]); ys = xs.map(x => g * r ** (x - s)); }
      const d = diffs(ys);
      return E.choiceFixed(`Is this table linear?${table([['x', xs], ['y', ys]])}`, ['Yes', 'No'], lin ? 0 : 1, `First differences: ${d.map(nt).join(', ')}. ${lin ? `They are all ${nt(d[0])}, so it is linear.` : 'They are not all the same, so it is not linear.'}`); } },
    b: { t: 'second differences mean quadratic', g: R => { const a = nz(R, -4, 4), b = R.int(-6, 6), c = R.int(-6, 6), s = R.int(-2, 2), xs = [0, 1, 2, 3, 4].map(v => v + s), ys = xs.map(x => a * x * x + b * x + c), d = diffs(ys);
      return E.num(`What is the constant second difference of this table?${table([['x', xs], ['y', ys]])}`, [{ ans: 2 * a }], `First differences: ${d.map(nt).join(', ')}. Their differences are all ${nt(2 * a)}, so the table is quadratic.`); } },
    c: { t: 'constant ratios mean exponential', g: R => { const [p, q] = R.pick([[2, 1], [3, 1], [4, 1], [5, 1], [1, 2], [1, 3], [3, 2], [2, 3], [1, 4]]), a = q ** 3 * R.int(1, 3) * R.pick([1, 1, -1]), xs = [0, 1, 2, 3], ys = xs.map(x => a * p ** x / q ** x);
      return E.num(`This table is exponential. What is the common ratio?${table([['x', xs], ['y', ys]])}`, [{ label: 'ratio =', frac: [p, q] }], `Divide each y by the one before: ${nt(ys[1])}/${ys[0] < 0 ? '(' + nt(ys[0]) + ')' : ys[0]} = ${fr(p / q)}, and the same for every step.`); } },
    d: { t: 'justify from context', g: (R, O) => { const kind = R.int(0, 2), $ = cur(O), n1 = R.int(2, 9), n2 = R.int(2, 9), pc = R.pick([3, 4, 5, 6, 8, 10, 12, 15]);
      const C3 = [
        [`A taxi charges ${$}${n1} plus ${$}${n2} for every kilometer.`, `A candle ${n1 + 10} cm tall burns down ${n2} mm every minute.`, `A gym charges ${$}${n1 * 10} to join and ${$}${n2 * 5} each month.`, `A tank fills at a steady ${n2} liters per minute.`],
        [`The area of a square whose side is s cm, as s grows.`, `The height of a ball ${n1} seconds into a throw straight up, over the whole flight.`, `The area of a circle as its radius grows.`, `The number of handshakes when each of n people shakes hands with every other person once.`],
        [`A colony of bacteria doubles every ${n1} hours.`, `A car loses ${pc}% of its value every year.`, `Money in a savings account earns ${pc}% interest, compounded yearly.`, `A medicine's amount in the blood halves every ${n1} hours.`]];
      const why = ['The amount changes by the same number each step: constant differences, linear.', 'The quantity grows like a square (or rises and falls like a parabola): quadratic.', 'The amount is multiplied by the same factor each step: constant ratios, exponential.'];
      return E.choiceFixed(`Which kind of model fits best? ${R.pick(C3[kind])}`, ['linear', 'quadratic', 'exponential'], kind, why[kind]); } },
  });

  /* IV.9.17 Growth races */
  S('IV.9.17', 'Growth races', {
    a: { t: 'linear vs exponential', g: R => { const wantG = R.bool(); let m, c, a, b, n, F, Gv;
      do { m = R.int(2, 20); c = R.int(0, 30); a = R.int(1, 5); b = R.pick([2, 3]); n = R.int(1, 7); F = m * n + c; Gv = a * b ** n; } while (F === Gv || (Gv > F) !== wantG || Math.abs(Gv - F) > 300);
      return E.choiceFixed(`${M(`f(x)=${m}x${add(c)}`)} and ${M(`g(x)=${a === 1 ? '' : a + '*'}${b}^x`)}. Which is larger at x = ${n}?`, [M(`f(${n})`), M(`g(${n})`)], wantG ? 1 : 0, `f(${n}) = ${m}·${n}${c ? ' + ' + c : ''} = ${F} and g(${n}) = ${a === 1 ? '' : a + '·'}${b}${sup(n)} = ${Gv}, so ${wantG ? 'g' : 'f'}(${n}) is larger.`); } },
    b: { t: 'exponential eventually wins', g: R => { const b = R.pick([2, 3]); let m, n;
      do { m = b === 2 ? R.int(3, 120) : R.int(4, 60); n = 1; while (b ** n <= m * n) n++; } while (n < 3 || n > 11);
      return E.num(`${M(`f(x)=${m}x`)} and ${M(`g(x)=${b}^x`)}. What is the smallest whole number x ≥ 1 for which g(x) > f(x)?`, [{ label: 'x =', ans: n }],
        `At x = ${n - 1}: ${b}${sup(n - 1)} = ${b ** (n - 1)} ≤ ${m * (n - 1)}. At x = ${n}: ${b}${sup(n)} = ${b ** n} > ${m * n}. From then on the exponential grows faster, so it stays ahead.`); } },
    c: { t: 'compare with tables', g: R => { let m, c, a, b, xs, F, Gv, first;
      do { m = R.int(5, 40); c = R.int(5, 40); a = R.int(1, 3); b = R.pick([2, 3]); xs = [0, 1, 2, 3, 4, 5, 6, 7]; F = xs.map(x => m * x + c); Gv = xs.map(x => a * b ** x); first = xs.findIndex((x, i) => Gv.slice(i).every((g, j) => g > F[i + j])); } while (first < 2 || first > 7 || Gv[0] >= F[0] || Gv.some((g, i) => g === F[i]));
      return E.num(`From which x-value in the table on is g larger than f?${table([['x', xs], ['f(x)', F], ['g(x)', Gv]])}`, [{ label: 'x =', ans: first }], `f grows by ${m} each step; g is multiplied by ${b}. At x = ${first - 1}, g = ${Gv[first - 1]} < ${F[first - 1]} = f, but at x = ${first}, g = ${Gv[first]} > ${F[first]}, and after that g's lead keeps growing.`); } },
    d: { t: 'compare with graphs', g: R => {
      if (R.bool()) { const n = R.int(3, 5), m = R.int(1, Math.floor((2 ** n - 2) / n)), c = 2 ** n - m * n, Y = 2 ** (n + 1);
        return E.num(`The graph shows ${M('y=2^x')} and a straight line. For ${M('x>0')}, at what x-value does the exponential overtake the line?`, [{ label: 'x =', ans: n }], `The curves cross at (${n}, ${2 ** n}): the line gives ${m === 1 ? '' : m + '·'}${n} + ${c} = ${2 ** n} and 2${sup(n)} = ${2 ** n}. After that the exponential is above.`,
          { visual: big([{ f: x => 2 ** x, color: C.blue }, { f: x => m * x + c, color: C.red }], { x: [0, n + 2], y: [0, Y], yticks: Y <= 32 ? 4 : 8, w: 300, h: 260 }) }); }
      const expA = R.bool(), m = R.int(3, 8), c = R.int(4, 12), a = R.pick([1, 2]), X = 5, fE = x => a * 2 ** x, fL = x => m * x + c;
      const vis = big([{ f: expA ? fE : fL, color: C.blue, label: 'A', lx: 4.3 }, { f: expA ? fL : fE, color: C.red, label: 'B', lx: 4.7 }], { x: [0, X], y: [0, 2 * a * 2 ** X > 80 ? 80 : 64], yticks: 8, w: 300, h: 260 });
      return E.choiceFixed('One curve is linear and one is exponential. Which curve is exponential?', ['A', 'B'], expA ? 0 : 1, `Curve ${expA ? 'A' : 'B'} bends upward: each step multiplies it by the same factor, so it keeps getting steeper. The straight one grows by the same amount each step.`, { visual: vis }); } },
    e: { t: 'the last crossing', g: R => { let b, a, k, N;
      do { b = R.pick([2, 3]); a = R.int(1, 10); k = R.int(1, 3); let last = -1; for (let x = 0; x <= 200; x++) if (BigInt(b) ** BigInt(x) <= BigInt(a) * BigInt(x) ** BigInt(k)) last = x; N = last + 1; } while (N < 3 || N > (b === 2 ? 14 : 8));
      const pw = x => a * x ** k;
      return E.num(`What is the smallest whole number N such that ${M(`${b}^x>${a === 1 ? '' : a}x${k === 1 ? '' : '^' + k}`)} for every whole number x ≥ N?`, [{ label: 'N =', ans: N }],
        `At x = ${N - 1}: ${b}${sup(N - 1)} = ${b ** (N - 1)} ≤ ${pw(N - 1)}. At x = ${N}: ${b}${sup(N)} = ${b ** N} > ${pw(N)}. After that, each step multiplies the left side by ${b} while the right side grows by a smaller factor, so the exponential stays ahead.`); } },
    f: { t: 'compare giant powers', g: R => {
      const P = [[2, 3, 3, 2], [3, 3, 5, 2], [2, 5, 5, 2], [2, 7, 5, 3], [2, 10, 10, 3], [3, 5, 2, 8], [7, 2, 2, 5], [2, 6, 3, 4], [2, 4, 3, 3], [6, 2, 2, 5], [2, 2, 4, 1], [2, 3, 8, 1], [4, 3, 8, 2], [9, 3, 27, 2], [3, 2, 9, 1]];
      const [b1, s1, b2, t2] = R.pick(P), k = R.int(10, 40), A = b1 ** s1, B = b2 ** t2;
      let X = [b1, s1 * k, A], Y = [b2, t2 * k, B]; if (R.bool()) [X, Y] = [Y, X];
      const ans = X[2] === Y[2] ? 2 : X[2] > Y[2] ? 0 : 1;
      return E.choiceFixed(`Which is larger: ${M(`${X[0]}^${X[1]}`)} or ${M(`${Y[0]}^${Y[1]}`)}?`, [`${M(`${X[0]}^${X[1]}`)} is larger`, `${M(`${Y[0]}^${Y[1]}`)} is larger`, 'They are equal'], ans,
        `Write both with the exponent ${k}: ${X[0]}${sup(X[1])} = (${X[0]}${sup(X[1] / k)})${sup(k)} = ${X[2]}${sup(k)} and ${Y[0]}${sup(Y[1])} = ${Y[2]}${sup(k)}. ${ans === 2 ? 'The bases match, so they are equal.' : `Since ${Math.max(X[2], Y[2])} > ${Math.min(X[2], Y[2])}, ${[X, Y][ans][0]}${sup([X, Y][ans][1])} is larger.`}`.replace(/\((\d+)¹\)/g, '$1')); } },
  });

  /* IV.9.18 Modulus graphs */
  const modBase = R => { if (R.bool()) { const m = R.pick([1, 2, -1, -2, 1 / 2]), c = nz(R, -3, 3); return { s: E.poly([1, 0]).replace('x', `${co(m)}x`) + add(c), f: x => m * x + c, co: [m, c] }; }
    const h = R.int(-2, 2), d = R.int(1, 4), s = R.pick([1, -1]); return { s: s > 0 ? E.poly([1, -2 * h, h * h - d]) : E.poly([-1, 2 * h, d - h * h]), f: x => s * ((x - h) ** 2 - d), co: s > 0 ? [1, -2 * h, h * h - d] : [-1, 2 * h, d - h * h] }; };
  S('IV.9.18', 'Modulus graphs', {
    a: { t: 'y = |f(x)| reflects the negative part', g: R => {
      if (R.bool()) { let F, w; do { F = modBase(R); const f = F.f; w = gPick(x => Math.abs(f(x)), [x => f(Math.abs(x)), x => -Math.abs(f(x)), f, x => Math.abs(f(-x))]); } while (!w);
        const f = F.f;
        return gChoice(R, `The dashed graph is ${M('y=' + F.s)}. Which graph shows ${M('y=|' + F.s + '|')}?`, x => Math.abs(f(x)), w, 'Keep the part above the x-axis; reflect the part below the x-axis up. Nothing ends up below the axis.', { refs: [dashed(f)] }); }
      const m = nz(R, -4, 4), p = nz(R, -6, 6), c = -m * p - R.int(1, 9);
      return E.num(`${M('f(x)=' + E.poly([m, c]))}. What is ${M(`|f(${p})|`)}?`, [{ ans: Math.abs(m * p + c) }], `f(${nt(p)}) = ${m * p + c}, and the absolute value makes it positive: |f(${nt(p)})| = ${Math.abs(m * p + c)}.`); } },
    b: { t: 'y = f(|x|) mirrors the right half', g: R => {
      if (R.bool()) { let F, w; do { F = modBase(R); const f = F.f; w = gPick(x => f(Math.abs(x)), [x => Math.abs(f(x)), f, x => f(-Math.abs(x)), x => -f(Math.abs(x))]); } while (!w);
        const f = F.f;
        return gChoice(R, `The dashed graph is y = f(x). Which graph shows ${M('y=f(|x|)')}?`, x => f(Math.abs(x)), w, 'Keep the right half (x ≥ 0), throw away the left half, and mirror the right half onto the left. The result is symmetric about the y-axis.', { refs: [dashed(f)] }); }
      const m = nz(R, -4, 4), c = R.int(-9, 9), p = R.int(-7, -1);
      return E.num(`${M('f(x)=' + E.poly([m, c]))}. What is ${M(`f(|${p}|)`)}?`, [{ ans: m * -p + c }], `|${nt(p)}| = ${-p}, so f(|${nt(p)}|) = f(${-p}) = ${m * -p + c}. (Compare |f(${nt(p)})| = ${Math.abs(m * p + c)}: a different thing.)`); } },
    c: { t: 'solve |f(x)| = k with the graph', g: R => { let fs, f, sol, k;
      if (R.bool()) { const m = R.pick([1, 2, 3, -1, -2]), c = nz(R, -6, 6); k = R.int(1, 6); fs = E.poly([m, c]); f = x => m * x + c; sol = [fr((k - c) / m), fr((-k - c) / m)]; }
      else { const big1 = R.bool(0.3); let p, q, C0; do { p = R.int(1, 4); q = big1 ? -R.int(1, 3) : R.int(0, p - 1); } while (big1 ? false : (p - q) % 2); 
        if (big1) { C0 = R.int(1, 3); k = p * p - C0; while (k <= C0) { p++; k = p * p - C0; } sol = [String(p), String(-p)]; }
        else { C0 = (p * p + q * q) / 2; k = (p * p - q * q) / 2; sol = q === 0 ? ['0', String(p), String(-p)] : [String(p), String(-p), String(q), String(-q)]; }
        fs = E.poly([1, 0, -C0]); f = x => x * x - C0; }
      const top = Math.max(8, k + 2);
      return E.num(`Use the graph of ${M('y=|' + fs + '|')} to solve ${M('|' + fs + '|=' + k)}.`, [{ label: 'x =', set: sol }], `The line y = ${k} meets the graph ${sol.length} times: where ${E.pt(fs)} = ${k} and where ${E.pt(fs)} = −${k}. That gives x = ${sol.map(nt).join(', ')}.`,
        { visual: big([blue(x => Math.abs(f(x)))], { y: [-2, top], hlines: [{ y: k }], h: Math.round(300 * (top + 2) / 12) }) }); } },
    d: { t: 'combine with other transformations', g: R => { let F, right, w, lab;
      do { F = modBase(R); const f = F.f, k0 = R.int(1, 3), h0 = nz(R, -3, 3), pick = R.int(0, 2);
        if (pick === 0) { right = x => Math.abs(f(x)) + k0; w = gPick(right, [x => Math.abs(f(x) + k0), x => f(Math.abs(x)) + k0, x => Math.abs(f(x)) - k0]); lab = `y=|f(x)|+${k0}`; }
        else if (pick === 1) { right = x => Math.abs(f(x)) - k0; w = gPick(right, [x => Math.abs(f(x) - k0), x => f(Math.abs(x)) - k0, x => Math.abs(f(x)) + k0]); lab = `y=|f(x)|-${k0}`; }
        else { right = x => Math.abs(f(x - h0)); w = gPick(right, [x => Math.abs(f(x + h0)), x => Math.abs(f(x)) + h0, x => f(Math.abs(x - h0))]); lab = `y=|f(${xm(h0)})|`; } } while (!w);
      return gChoice(R, `The dashed graph is ${M('y=f(x)')}. Which graph shows ${M(lab)}?`, right, w, lab.includes('|f(x)|') ? `First reflect the negative part of f up to get y = |f(x)|, then shift the whole thing ${lab.includes('+') ? 'up' : 'down'}.` : `Reflect the negative part up, and shift ${dir(Number(lab.match(/x([+-]\d+)/)[1]) * -1, 'right', 'left')}.`, { refs: [dashed(F.f)] }); } },
    e: { t: 'count solutions with a parameter', g: R => { const d = R.int(1, 4), h = R.int(-3, 3), four = R.bool();
      if (R.bool()) { const fs = E.poly([1, -2 * h, h * h - d * d]);
        return E.num(`For which k does ${M('|' + fs + '|=k')} have exactly ${four ? 'four' : 'three'} real solutions?${four ? ' Use interval notation.' : ''}`, [four ? { interval: `(0,${d * d})` } : { label: 'k =', ans: d * d }],
          `${E.pt(fs)} = ${E.pt(T('quad', { h, k: -d * d }).s)}, so y = |${E.pt(fs)}| is a W: zeros at x = ${h - d} and ${h + d}, and a bump of height ${d * d} at x = ${h}. The line y = k meets it 4 times for 0 < k < ${d * d}, 3 times at k = ${d * d} (touching the bump), and 2 times above.`); }
      return E.num(`For which k does ${M(`x^2-${2 * d}|x|=k`)} have exactly ${four ? 'four' : 'three'} real solutions?${four ? ' Use interval notation.' : ''}`, [four ? { interval: `(-${d * d},0)` } : { label: 'k =', ans: 0 }],
        `y = x² − ${2 * d}|x| is the right half of y = x² − ${2 * d}x mirrored: a W with lows of −${d * d} at x = ±${d} and a peak of 0 at x = 0. The line y = k meets it 4 times for −${d * d} < k < 0 and 3 times at k = 0 (through the peak).`); } },
    f: { t: 'nested absolute values', g: R => {
      if (R.bool()) { const a = R.int(1, 5), b = R.int(1, 5), h = R.int(-3, 3), set = new Set([h + a + b, h - a - b]); if (a > b) { set.add(h + a - b); set.add(h - a + b); } else if (a === b) set.add(h);
        return E.num(`Solve ${M(`abs(abs(${xm(h)})-${a})=${b}`)}.`, [{ label: 'x =', set: [...set].map(String) }],
          `The outer bars give |${E.pt(xm(h))}| − ${a} = ±${b}, so |${E.pt(xm(h))}| = ${a + b} or |${E.pt(xm(h))}| = ${a - b}. ${a > b ? `Both are positive: x = ${h === 0 ? '' : h + ' '}± ${a + b} or x = ${h === 0 ? '' : h + ' '}± ${a - b}.` : a === b ? `The second gives x = ${h} only: three solutions.` : `The second is negative, impossible, so only x = ${h === 0 ? '' : h + ' '}± ${a + b}.`}`); }
      let a, b, k, cnt; do { a = R.int(1, 4); b = a + 2 * R.int(1, 3); k = R.int(0, 12); cnt = 0; const s = a + b, p = a * b;
        for (const c of k === 0 ? [0] : [k, -k]) { const D = (b - a) ** 2 + 4 * c; if (D < 0) continue; if (D === 0) { cnt += 2; continue; } cnt += 2; if (s * s > D) cnt += 2; else if (s * s === D) cnt += 1; } void p; } while (cnt === 2 && R.bool(0.6));
      const H = ((b - a) / 2) ** 2;
      return E.num(`How many real solutions does ${M(`abs(x^2-${a + b}abs(x)+${a * b})=${k}`)} have?`, [{ ans: cnt }],
        `The inside is (|x| − ${a})(|x| − ${b}). Its graph is symmetric about the y-axis with zeros at ±${a} and ±${b}; after the outer bars there are humps of height ${H} at x = ±${(a + b) / 2}, and the height at x = 0 is ${a * b}. The line y = ${k} crosses this graph ${cnt} times.`); } },
  });
})(typeof window !== 'undefined' ? window : globalThis);
