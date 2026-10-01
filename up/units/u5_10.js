/* Era V · Unit V.10 Identities & equations (V.10.01–V.10.12) */
(function (G) {
  const E = G.E5, V = E.V, C = E.C, M = s => E.mx(s), K = E.K;
  // bare " < " / " > " in plain text are escaped so they can never be read as the start of a tag
  const esc = t => typeof t === 'string' ? t.replace(/ < /g, ' &lt; ').replace(/ > /g, ' &gt; ') : t;
  const S = (id, name, steps) => { for (const k of Object.keys(steps)) { const g = steps[k].g; steps[k].g = (R, O) => { const q = g(R, O); q.prompt = esc(q.prompt); q.explain = esc(q.explain); if (q.choices) q.choices = q.choices.map(c => c.startsWith('<svg') ? c : esc(c)); if (q.items) q.items = q.items.map(esc); return q; }; } return E.skill({ id, name, steps }); };
  const PI = Math.PI, rad = K.rad;
  const YN = { choices: ['Yes', 'No'] };
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
  const mod = (a, n) => ((a % n) + n) % n;
  const fr = (n, d = 1) => E.fracStr(n, d);
  const X = (exact, label) => label ? { exact, label } : { exact };
  const co = a => a === 1 ? '' : a === -1 ? '-' : String(a);
  const list = a => a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1];
  const QN = ['Quadrant I', 'Quadrant II', 'Quadrant III', 'Quadrant IV'];
  const SUP = { 2: '²', 3: '³', 4: '⁴' };
  // pretty plain text for trig strings (keeps the space in "sin x cos x")
  const unsq = s => { let t = String(s), o; do { o = t; t = t.replace(/sqrt\(([^()]+)\)/g, (m, a) => /^[0-9a-z]+$/i.test(a) ? '√' + a : '√(' + a + ')'); } while (t !== o); return t; };
  const tp = s => unsq(s).replace(/\^(\d)/g, (m, d) => SUP[d] || '^' + d)
    .replace(/pi/g, 'π').replace(/([^\s(^/])([+-])(?=\S)/g, '$1 $2 ').replace(/\*/g, '·').replace(/-/g, '−').replace(/\s+/g, ' ').trim();
  const sub = (s, v) => v === 'x' ? s : String(s).replace(/x/g, v);
  const VAR = R => R.pick(['x', 'x', 'θ']);

  /* ---------- short proofs (V.10.05.c, V.10.06.b, V.10.11.b) ---------- */
  const twoCol = (rows, hide) => `<table class="dt"><tr><th>#</th><th>Statement</th><th>Reason</th></tr>${rows.map((r, i) => `<tr><td>${i + 1}</td><td>${r[0]}</td><td>${i === hide ? '<b>?</b>' : r[1]}</td></tr>`).join('')}</table>`;
  const stepTbl = (rows, blank) => `<table class="dt">${rows.map((r, i) => `<tr><th>Step ${i + 1}</th><td>${i === blank ? '<b>?</b>' : r}</td></tr>`).join('')}</table>`;
  const negS = s => s === '0' ? '0' : s[0] === '-' ? s.slice(1) : '-' + s;

  /* ---------- multiples of π ---------- */
  const piS = (n, d = 1) => { if (d < 0) { n = -n; d = -d; } const g = gcd(n, d) || 1; n /= g; d /= g; if (n === 0) return '0';
    const s = (n < 0 ? '-' : '') + (Math.abs(n) === 1 ? '' : Math.abs(n)) + 'pi'; return d === 1 ? s : s + '/' + d; };
  const toPi = (v, dmax = 400) => { for (let d = 1; d <= dmax; d++) { const n = Math.round(v / PI * d); if (Math.abs(n * PI / d - v) < 1e-9) { const g = gcd(n, d) || 1; return [n / g, d / g]; } } return null; };
  const dPi = d => { const q = toPi(rad(d)); if (!q) throw new Error('not a nice angle ' + d); return piS(q[0], q[1]); };
  const nd = d => String(+d.toFixed(4));                                                 // degrees as a clean number string

  /* ---------- exact special values: [n, d, r] means n·√r / d ---------- */
  const SINR = { 0: [0, 1, 1], 30: [1, 2, 1], 45: [1, 2, 2], 60: [1, 2, 3], 90: [1, 1, 1] };
  const TANR = { 0: [0, 1, 1], 30: [1, 3, 3], 45: [1, 1, 1], 60: [1, 1, 3] };
  const refOf = d => { const m = mod(d, 360); return m <= 90 ? m : m <= 180 ? 180 - m : m <= 270 ? m - 180 : 360 - m; };
  const sgn = x => Math.abs(x) < 1e-9 ? 0 : Math.sign(x);
  const tv = (fn, deg) => { const rf = refOf(deg), a = rad(deg);
    if (fn === 'sin') { const [n, d, r] = SINR[rf]; return [n * sgn(Math.sin(a)), d, r]; }
    if (fn === 'cos') { const [n, d, r] = SINR[90 - rf]; return [n * sgn(Math.cos(a)), d, r]; }
    if (rf === 90) return null; const [n, d, r] = TANR[rf]; return [n * sgn(Math.sin(a)) * sgn(Math.cos(a)), d, r]; };
  const vs = v => { if (!v) return null; let [n, d, r] = v; if (n === 0) return '0'; const g = gcd(n, d); n /= g; d /= g;
    if (r === 1) return fr(n, d); return `${n < 0 ? '-' : ''}${Math.abs(n) === 1 ? '' : Math.abs(n)}sqrt(${r})${d === 1 ? '' : '/' + d}`; };
  const tvS = (fn, deg) => vs(tv(fn, deg));
  const val = s => E.value(s)[0];
  const TRIP = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29]];
  const SVAL = ['0', '1/2', '-1/2', 'sqrt(2)/2', '-sqrt(2)/2', 'sqrt(3)/2', '-sqrt(3)/2', '1', '-1'];
  const TVAL = ['0', '1', '-1', 'sqrt(3)', '-sqrt(3)', 'sqrt(3)/3', '-sqrt(3)/3'];

  /* ---------- expression checks (every symbolic answer is verified by evaluation) ---------- */
  const MIR = { sin: 'cos', cos: 'sin', tan: 'cot', cot: 'tan', sec: 'csc', csc: 'sec' };
  const mir = s => String(s).replace(/(?<![a-z])(sin|cos|tan|cot|sec|csc)(?![a-z])/g, m => MIR[m]);     // co-function swap: every identity stays true
  const same = (a, b) => E.sameExpr(a, b, ['x']);
  const need = (a, b, tag) => { if (!same(a, b)) throw new Error(`${tag}: ${a} is not ${b}`); };
  const uniqD = (right, ds) => { const out = []; for (const d of ds) if (d && !same(d, right) && !out.some(o => same(o, d))) out.push(d); return out; };
  const pickD = (R, right, ds, tag) => { const u = uniqD(right, ds); if (u.length < 3) throw new Error(tag + ': too few distractors for ' + right); return R.sample(u, 3); };

  /* ---------- equations: solving on a grid of special angles ---------- */
  const fv = (f, d) => { const a = rad(d); return f === 'sin' ? Math.sin(a) : f === 'cos' ? Math.cos(a) : f === 'tan' ? Math.tan(a) : f === 'sec' ? 1 / Math.cos(a) : f === 'csc' ? 1 / Math.sin(a) : Math.cos(a) / Math.sin(a); };
  const okAt = (f, d) => !((f === 'tan' || f === 'sec') && mod(d, 180) === 90) && !((f === 'cot' || f === 'csc') && mod(d, 180) === 0);
  const solve1 = (f, vstr) => { const v = val(vstr); const out = []; for (let d = 0; d < 360; d += 15) if (okAt(f, d) && Math.abs(fv(f, d) - v) < 1e-9) out.push(d); return out; };
  // every root of g on [0°, 360°) lies on the 15° grid; a sign change between grid-free neighbours would mean a missed root
  const gridSolve = (g, step = 15) => { const out = []; for (let d = 0; d < 360 - 1e-9; d += step) { const y = g(d); if (isFinite(y) && Math.abs(y) < 1e-9) out.push(d); }
    for (let d = 0; d < 360; d += 0.25) { const a = g(d), b = g(d + 0.25); if (isFinite(a) && isFinite(b) && a * b < 0 && Math.abs(a) + Math.abs(b) < 1 && !out.some(s => Math.abs(s - d) < 1 || Math.abs(s + 360 - d) < 1 || Math.abs(s - 360 - d) < 1)) throw new Error('missed root near ' + d); }
    return out; };
  const degList = ds => ds.length ? list(ds.map(d => nd(d) + '°')) : 'none';
  const radList = ds => ds.length ? list(ds.map(d => tp(dPi(d)))) : 'none';
  const ansSet = (ds, radn) => radn ? ds.map(dPi) : ds.map(nd);
  const domTxt = radn => radn ? M('0<=x<2pi') : M('0°<=x<360°');
  const askSet = radn => radn ? 'Give exact answers, separated by commas, or type "no solution".' : 'Give the angles in degrees, separated by commas, or type "no solution".';
  const sols = (ds, radn) => radn ? radList(ds) : degList(ds);

  /* ---------- figures ---------- */
  const circ = { x: t => Math.cos(t), y: t => Math.sin(t), t: [0, 2 * PI], color: C.ink };
  const rayP = d => ({ x: t => t * Math.cos(rad(d)), y: t => t * Math.sin(rad(d)), t: [0, 1], color: C.blue });
  // unit circle with the line y = v (sine) or x = v (cosine) and the points where it meets the circle
  const ucLine = (f, v, ds) => V.graph({ x: [-1.4, 1.4], y: [-1.4, 1.4], w: 220, h: 220, ticks: 0.5, labels: false, param: [circ, ...ds.map(rayP)],
    hlines: f === 'sin' ? [{ y: v, color: C.red }] : [], vlines: f === 'cos' ? [{ x: v, color: C.red }] : [], points: ds.map(d => [Math.cos(rad(d)), Math.sin(rad(d))]), label: 'unit circle' });
  // the core labels π/2 as "1π/2", and clips y labels when x starts at 0, so leave room left of the axis and tidy the labels
  const DEGL = { 'π/2': '90°', 'π': '180°', '3π/2': '270°', '2π': '360°' };
  const piLab = (svg, deg) => { svg = svg.replace(/>(−?)1π\/2</g, '>$1π/2<'); return deg ? svg.replace(/>(π\/2|π|3π\/2|2π)</g, (m, k) => `>${DEGL[k]}<`) : svg; };
  const trigGraph = (fn, v, o = {}) => { const xr = o.x || [0, 2 * PI];
    return piLab(V.graph({ x: [Math.min(xr[0], -0.55), xr[1]], y: [-1.6, 1.6], w: 340, h: 170, ticks: PI / 2, yticks: 0.5, xpi: true, fns: [{ f: fn, color: C.blue, from: xr[0], to: xr[1] }], hlines: [{ y: v, color: C.red }], label: o.label || 'graph' }), o.deg); };

  /* ================= V.10.01 Reciprocal & quotient identities ================= */
  const VEC = { sin: [1, 0], cos: [0, 1], tan: [1, -1], cot: [-1, 1], sec: [0, -1], csc: [-1, 0] };
  const WRONG = [{ tan: [-1, 1], cot: [1, -1] }, { sec: [-1, 0], csc: [0, -1] }, { tan: [-1, 1], cot: [1, -1], sec: [-1, 0], csc: [0, -1] }, { sec: [0, 1], csc: [1, 0], cot: [1, -1] }];
  const vecOf = (terms, map = {}) => terms.reduce((a, [f, p]) => { const v = map[f] || VEC[f]; return [a[0] + p * v[0], a[1] + p * v[1]]; }, [0, 0]);
  const pw = (f, n) => n === 1 ? `${f} x` : `${f}^${n} x`;
  const fracOf = (num, den) => { const n = num.join(' ') || '1'; return den.length ? `${n}/${den.length > 1 ? '(' + den.join(' ') + ')' : den[0]}` : n; };
  const scStr = ([p, q]) => { const num = [], den = []; if (p > 0) num.push(pw('sin', p)); if (q > 0) num.push(pw('cos', q)); if (p < 0) den.push(pw('sin', -p)); if (q < 0) den.push(pw('cos', -q)); return fracOf(num, den); };
  const termStr = terms => fracOf(terms.filter(t => t[1] > 0).map(t => pw(t[0], 1)), terms.filter(t => t[1] < 0).map(t => pw(t[0], 1)));
  const NAME = { '0,0': '1', '1,0': 'sin x', '0,1': 'cos x', '1,-1': 'tan x', '-1,1': 'cot x', '0,-1': 'sec x', '-1,0': 'csc x' };
  const CONV = { tan: 'sin x/cos x', cot: 'cos x/sin x', sec: '1/cos x', csc: '1/sin x', sin: 'sin x', cos: 'cos x' };
  const RECIP = { csc: 'sin', sec: 'cos', cot: 'tan', sin: 'csc', cos: 'sec', tan: 'cot' };
  const randTerms = (R, n) => { let fs; do fs = R.sample(Object.keys(VEC), n); while (fs.every(f => f === 'sin' || f === 'cos')); return fs.map((f, i) => [f, i && R.bool(0.35) ? -1 : 1]); };
  S('V.10.01', 'Reciprocal & quotient identities', {
    a: { t: 'csc, sec, cot as reciprocals', g: R => { const v = VAR(R);
      if (R.bool(0.3)) { const f = R.pick(['csc', 'sec', 'cot']), right = { csc: '1/sin x', sec: '1/cos x', cot: '1/tan x' }[f];
        const pool = ['1/sin x', '1/cos x', '1/tan x', f === 'cot' ? 'sin x/cos x' : f === 'sec' ? 'cos x' : 'sin x'].filter(s => s !== right);
        return E.choice(R, `Which expression equals ${M(sub(f + ' x', v))}?`, M(sub(right, v)), pool.map(s => M(sub(s, v))),
          `${f} ${v} is the reciprocal of ${RECIP[f]} ${v}: ${tp(sub(right, v))}.${f === 'sec' ? ' Watch out: sec goes with cos, not sin.' : f === 'csc' ? ' Watch out: csc goes with sin, not cos.' : ''}`); }
      const f = R.pick(['sin', 'cos', 'tan', 'csc', 'sec', 'cot']), s = R.pick([1, -1]); let p, q; do { q = R.int(2, 11); p = R.int(1, ['tan', 'cot'].includes(f) ? 15 : q - 1); } while (gcd(p, q) > 1 || p === q);
      const rec = ['csc', 'sec', 'cot'].includes(f), given = rec ? fr(s * q, p) : fr(s * p, q), ask = RECIP[f], ans = rec ? fr(s * p, q) : fr(s * q, p);
      return E.num(`If ${M(`${sub(f + ' x', v)}=${given}`)}, find ${M(sub(ask + ' x', v))}.`, [X(ans, `${ask} ${v} =`)],
        `${ask} ${v} = 1/${f} ${v}, so flip the fraction: 1 ÷ (${tp(given)}) = ${tp(ans)}. The sign stays the same.`); } },
    b: { t: 'tan = sin/cos', g: R => { const v = VAR(R), askT = R.bool(0.65); let sx, sy, why;
      if (R.bool(0.6)) { const [a, b, c] = R.pick(TRIP), sw = R.bool(), x = (sw ? b : a) * R.pick([1, -1]), y = (sw ? a : b) * R.pick([1, -1]); sx = fr(x, c); sy = fr(y, c); }
      else { const d = R.pick([30, 45, 60, 120, 135, 150, 210, 225, 240, 300, 315, 330]); sx = tvS('cos', d); sy = tvS('sin', d); }
      const num = askT ? sy : sx, den = askT ? sx : sy, value = val(num) / val(den);
      const exact = (() => { // simplify (num)/(den) for fractions or the special surds
        const cands = ['0', '1', '-1', 'sqrt(3)', '-sqrt(3)', 'sqrt(3)/3', '-sqrt(3)/3']; for (const c of cands) if (Math.abs(val(c) - value) < 1e-9) return c;
        for (let d = 1; d <= 60; d++) { const n = Math.round(value * d); if (Math.abs(n / d - value) < 1e-9) return fr(n, d); } throw new Error('V.10.01.b no exact'); })();
      why = `${askT ? 'tan' : 'cot'} ${v} = ${askT ? 'sin' : 'cos'} ${v} ÷ ${askT ? 'cos' : 'sin'} ${v} = (${tp(num)}) ÷ (${tp(den)}) = ${tp(exact)}.${askT ? ' Not cos ÷ sin: that would be cot.' : ''}`;
      return E.num(`${M(`${sub('sin x', v)}=${sy}`)} and ${M(`${sub('cos x', v)}=${sx}`)}. Find ${askT ? 'tan' : 'cot'} ${v} exactly.`, [X(exact, `${askT ? 'tan' : 'cot'} ${v} =`)], why); } },
    c: { t: 'rewrite in sin and cos', g: R => { const v = VAR(R); let terms, right, ds;
      for (let tries = 0; ; tries++) { terms = randTerms(R, R.int(2, 3)); const rv = vecOf(terms); right = scStr(rv);
        ds = [...WRONG.map(w => scStr(vecOf(terms, w))), scStr([-rv[0], -rv[1]]), scStr([rv[0] + 1, rv[1] - 1])].filter((s, i, a) => s !== right && a.indexOf(s) === i);
        if (ds.length >= 3) break; if (tries > 40) throw new Error('V.10.01.c'); }
      const expr = termStr(terms); need(expr, right, 'V.10.01.c');
      const conv = [...new Set(terms.map(t => t[0]).filter(f => f !== 'sin' && f !== 'cos'))].map(f => `${f} ${v} = ${tp(sub(CONV[f], v))}`).join(', ');
      return E.choice(R, `Write ${M(sub(expr, v))} in terms of sin ${v} and cos ${v}, simplified.`, M(sub(right, v)), R.sample(ds.slice(0, 5), 3).map(s => M(sub(s, v))),
        `Use ${conv}. Then cancel: ${tp(sub(right, v))}.`); } },
    d: { t: 'simplify', g: R => { const v = VAR(R); let terms, rv;
      do { terms = randTerms(R, R.int(2, 3)); rv = vecOf(terms); } while (!NAME[rv.join()] || terms.length === 2 && NAME[rv.join()] === '1' && R.bool(0.6));
      const right = NAME[rv.join()], expr = termStr(terms); need(expr, right, 'V.10.01.d');
      const ds = [...new Set([...WRONG.map(w => NAME[vecOf(terms, w).join()]).filter(Boolean), ...R.shuffle(Object.values(NAME))])].filter(s => s !== right).slice(0, 3);
      const conv = [...new Set(terms.map(t => t[0]).filter(f => f !== 'sin' && f !== 'cos'))].map(f => `${f} ${v} = ${tp(sub(CONV[f], v))}`).join(', ');
      return E.choice(R, `Simplify ${M(sub(expr, v))}.`, M(sub(right, v)), ds.map(s => M(sub(s, v))), `Write it in sin and cos (${conv}) and cancel: ${scStr(rv) === right ? tp(sub(right, v)) : `${tp(sub(scStr(rv), v))} = ${tp(sub(right, v))}`}.`); } },
  });

  /* ================= V.10.02 Pythagorean identities ================= */
  // a ratio p/q with q > p, either from a Pythagorean triple or with a surd partner
  const ratioPair = R => { if (R.bool(0.5)) { const [a, b, c] = R.pick(TRIP), sw = R.bool(); return { p: sw ? b : a, q: c }; } let p, q; do { q = R.int(3, 9); p = R.int(1, q - 1); } while (gcd(p, q) > 1 || Number.isInteger(Math.sqrt(q * q - p * p))); return { p, q }; };
  const qSigns = q => [q === 0 || q === 3 ? 1 : -1, q < 2 ? 1 : -1];        // [sign of cos, sign of sin]
  S('V.10.02', 'Pythagorean identities', {
    a: { t: 'sin² + cos² = 1', g: R => { const v = VAR(R);
      if (R.bool(0.2)) { const a = R.int(2, 9), b = R.int(-9, 9), d = R.int(10, 80), f = R.bool() ? `${a}sin^2(${d}°)+${a}cos^2(${d}°)` : `${a}cos^2(${d}°)+${a}sin^2(${d}°)`, ex = b ? `${f}${b > 0 ? '+' : ''}${b}` : f;
        return E.num(`Find the exact value of ${M(ex)}.`, [{ label: 'value =', ans: a + b }], `Factor out ${a}: ${a}(sin²${d}° + cos²${d}°)${b ? (b > 0 ? ' + ' : ' − ') + Math.abs(b) : ''} = ${a} × 1${b ? (b > 0 ? ' + ' : ' − ') + Math.abs(b) : ''} = ${a + b}.`); }
      const { p, q } = ratioPair(R), qd = R.int(0, 3), [sc, ss] = qSigns(qd), givS = R.bool(), gs = givS ? ss : sc, os = givS ? sc : ss;
      const given = fr(gs * p, q), other = E.surdStr(0, os, q * q - p * p, q), gn = givS ? 'sin' : 'cos', on = givS ? 'cos' : 'sin';
      return E.num(`${M(`${sub(gn + ' x', v)}=${given}`)} and ${v} is in ${QN[qd]}. Find ${on} ${v} exactly.`, [X(other, `${on} ${v} =`)],
        `${on}²${v} = 1 − ${gn}²${v} = 1 − ${tp(fr(p * p, q * q))} = ${tp(fr(q * q - p * p, q * q))}. In ${QN[qd]} ${on} is ${os > 0 ? 'positive' : 'negative'}, so ${on} ${v} = ${tp(other)}.`); } },
    b: { t: '1 + tan² = sec²', g: R => { const v = VAR(R);
      if (R.bool(0.2)) { const a = R.int(2, 9), d = R.int(10, 80), ex = R.bool() ? `${a}sec^2(${d}°)-${a}tan^2(${d}°)` : `${a}tan^2(${d}°)-${a}sec^2(${d}°)`, ans = ex.startsWith(a + 'sec') ? a : -a;
        return E.num(`Find the exact value of ${M(ex)}.`, [{ label: 'value =', ans }], `sec²x − tan²x = 1 (from 1 + tan²x = sec²x), so the value is ${ans > 0 ? '' : '−'}${a} × 1 = ${ans}.`); }
      let p, q; do { q = R.int(1, 9); p = R.int(1, 12); } while (gcd(p, q) > 1 || p === q && q > 1);
      const qd = R.int(0, 3), [sc, ss] = qSigns(qd), t = fr(sc * ss * p, q), sec = E.surdStr(0, sc, p * p + q * q, q);
      return E.num(`${M(`${sub('tan x', v)}=${t}`)} and ${v} is in ${QN[qd]}. Find sec ${v} exactly.`, [X(sec, `sec ${v} =`)],
        `sec²${v} = 1 + tan²${v} = 1 + ${tp(fr(p * p, q * q))} = ${tp(fr(p * p + q * q, q * q))}. sec has the sign of cos, which is ${sc > 0 ? 'positive' : 'negative'} in ${QN[qd]}: sec ${v} = ${tp(sec)}.`); } },
    c: { t: '1 + cot² = csc²', g: R => { const v = VAR(R);
      if (R.bool(0.2)) { const a = R.int(2, 9), d = R.int(10, 80), ex = R.bool() ? `${a}csc^2(${d}°)-${a}cot^2(${d}°)` : `${a}cot^2(${d}°)-${a}csc^2(${d}°)`, ans = ex.startsWith(a + 'csc') ? a : -a;
        return E.num(`Find the exact value of ${M(ex)}.`, [{ label: 'value =', ans }], `csc²x − cot²x = 1 (from 1 + cot²x = csc²x), so the value is ${ans > 0 ? '' : '−'}${a} × 1 = ${ans}.`); }
      let p, q; do { q = R.int(1, 9); p = R.int(1, 12); } while (gcd(p, q) > 1 || p === q && q > 1);
      const qd = R.int(0, 3), [sc, ss] = qSigns(qd), t = fr(sc * ss * p, q), csc = E.surdStr(0, ss, p * p + q * q, q);
      return E.num(`${M(`${sub('cot x', v)}=${t}`)} and ${v} is in ${QN[qd]}. Find csc ${v} exactly.`, [X(csc, `csc ${v} =`)],
        `csc²${v} = 1 + cot²${v} = 1 + ${tp(fr(p * p, q * q))} = ${tp(fr(p * p + q * q, q * q))}. csc has the sign of sin, which is ${ss > 0 ? 'positive' : 'negative'} in ${QN[qd]}: csc ${v} = ${tp(csc)}.`); } },
    d: { t: 'derive the last two', g: R => { const v = VAR(R), k = R.int(0, 3), sv = s => M(sub(s, v));
      if (k === 0) { const toTan = R.bool(), right = toTan ? 'cos^2 x' : 'sin^2 x';
        return E.choice(R, `Divide every term of ${sv('sin^2 x+cos^2 x=1')} by which expression to get ${sv(toTan ? 'tan^2 x+1=sec^2 x' : '1+cot^2 x=csc^2 x')}?`, sv(right), [toTan ? 'sin^2 x' : 'cos^2 x', toTan ? 'cos x' : 'sin x', 'tan^2 x'].map(sv),
          `${toTan ? 'sin²/cos² = tan² and 1/cos² = sec²' : 'cos²/sin² = cot² and 1/sin² = csc²'}, so divide by ${tp(sub(right, v))}.`); }
      if (k === 1) { const toTan = R.bool(), d = toTan ? 'cos^2 x' : 'sin^2 x';
        const L = toTan ? [`${sv('sin^2 x+cos^2 x=1')}`, `${sv('sin^2 x/cos^2 x+cos^2 x/cos^2 x=1/cos^2 x')} <i>(divide every term by ${tp(sub(d, v))})</i>`, `${sv('tan^2 x+1=1/cos^2 x')} <i>(quotient identity)</i>`, `${sv('tan^2 x+1=sec^2 x')} <i>(reciprocal identity)</i>`]
          : [`${sv('sin^2 x+cos^2 x=1')}`, `${sv('sin^2 x/sin^2 x+cos^2 x/sin^2 x=1/sin^2 x')} <i>(divide every term by ${tp(sub(d, v))})</i>`, `${sv('1+cot^2 x=1/sin^2 x')} <i>(quotient identity)</i>`, `${sv('1+cot^2 x=csc^2 x')} <i>(reciprocal identity)</i>`];
        return K.orderQ(R, `Put the steps of this derivation of ${sv(toTan ? '1+tan^2 x=sec^2 x' : '1+cot^2 x=csc^2 x')} in order.`, L, [[], [0], [1], [2]], `Start from sin² + cos² = 1, divide by ${tp(sub(d, v))}, then name the ratios.`); }
      if (k === 2) { const T = R.pick([['sec^2 x-tan^2 x', '1'], ['sec^2 x-1', 'tan^2 x'], ['csc^2 x-1', 'cot^2 x'], ['1-sin^2 x', 'cos^2 x'], ['csc^2 x-cot^2 x', '1'], ['1-sec^2 x', '-tan^2 x'], ['1-cos^2 x', 'sin^2 x'], ['cot^2 x-csc^2 x', '-1'], ['tan^2 x-sec^2 x', '-1'], ['1-csc^2 x', '-cot^2 x']]);
        need(T[0], T[1], 'V.10.02.d'); const ds = pickD(R, T[1], ['1', '-1', 'tan^2 x', '-tan^2 x', 'cot^2 x', '-cot^2 x', 'sin^2 x', 'cos^2 x', 'sec^2 x'], 'V.10.02.d');
        return E.choice(R, `Simplify ${sv(T[0])}.`, sv(T[1]), ds.map(sv), `Rearrange a Pythagorean identity: ${tp(sub(T[0], v))} = ${tp(sub(T[1], v))}.`); }
      const truth = R.bool(); const [st, why] = R.pick(truth ? [['tan^2 x+1=sec^2 x', 'Divide sin² + cos² = 1 by cos².'], ['cot^2 x=csc^2 x-1', 'It is 1 + cot² = csc², rearranged.'], ['cos^2 x=1-sin^2 x', 'It is sin² + cos² = 1, rearranged.'], ['sec^2 x-tan^2 x=1', 'It is 1 + tan² = sec², rearranged.']]
        : [['1-tan^2 x=sec^2 x', 'The identity is 1 + tan² = sec², with a plus sign.'], ['sin^2 x-1=cos^2 x', 'cos² = 1 − sin², not sin² − 1 (that is −cos²).'], ['csc^2 x+1=cot^2 x', 'It is 1 + cot² = csc², so csc² − 1 = cot².'], ['sec^2 x+tan^2 x=1', 'sec² − tan² = 1, not sec² + tan².']]);
      return E.tf(`True or false: ${sv(st)} for every ${v} where both sides are defined.`, truth, why); } },
  });

  /* ================= V.10.03 Simplify trig expressions ================= */
  const U3 = ['sin x', 'cos x', 'tan x'];
  const uPow = (u, n) => n === 1 ? u : u.includes(' ') ? u.replace(' ', `^${n} `) : `${u}^${n}`;
  const term = (c, u, first) => { if (!c) return ''; const s = c < 0 ? '-' : first ? '' : '+'; const a = Math.abs(c); return s + (u ? (a === 1 ? '' : a) + u : String(a)); };
  const polyU = (cs, u) => { let s = ''; cs.forEach(([c, n]) => { s += term(c, n ? uPow(u, n) : '', !s); }); return s || '0'; };
  const lin = (a, u, b) => `${a === 1 ? '' : a === -1 ? '-' : a}${u}${b ? (b > 0 ? '+' : '-') + Math.abs(b) : ''}`;
  // templates in sin/cos form: [expr, answer, distractors]; k scales where marked with K
  const COMB = [k => [`${k}/(1-sin x)+${k}/(1+sin x)`, `${2 * k}/cos^2 x`, [`${k}/cos^2 x`, `${2 * k}/sin^2 x`, `${2 * k}`, `${2 * k}sin x/cos^2 x`]],
    k => [`${k}/(1-sin x)-${k}/(1+sin x)`, `${2 * k}sin x/cos^2 x`, [`${2 * k}/cos^2 x`, `-${2 * k}sin x/cos^2 x`, `${k}sin x/cos^2 x`, `${2 * k}/sin x`]],
    () => ['sin x/cos x+cos x/sin x', '1/(sin x cos x)', ['1', '(sin x+cos x)/(sin x cos x)', '2/(sin x cos x)', 'sin x cos x']],
    () => ['cos x/(1+sin x)+(1+sin x)/cos x', '2/cos x', ['2', '2/(1+sin x)', '2cos x', '1/cos x']],
    k => [`${k}/sin x-${co(k)}sin x`, `${co(k)}cos^2 x/sin x`, [`${co(k)}cos x`, `${k}(1-sin x)/sin x`, `${k}/sin^2 x`, `${co(k)}sin^2 x/cos x`]],
    () => ['1/(sin x cos x)-cos x/sin x', 'sin x/cos x', ['cos x/sin x', '(1-cos x)/(sin x cos x)', '1/sin x', '1/cos x']],
    k => [`${co(k)}sin x+${co(k)}cos^2 x/sin x`, `${k}/sin x`, [`${k}`, `${co(k)}cos x/sin x`, `${k}(sin x+cos x)/sin x`, `${k}/cos x`]]];
  const SUBST = [k => [`(1-cos^2 x)/sin x`, 'sin x', ['cos x', '1/sin x', 'sin^2 x', '-sin x']],
    k => [`${k}-${k}sin^2 x`, `${co(k)}cos^2 x`, [`${co(k)}sin^2 x`, `-${co(k)}cos^2 x`, `${co(k)}cos x`, `${k}`]],
    k => ['(sec^2 x-1)/tan x', 'tan x', ['cot x', 'sec x', '-tan x', 'tan^2 x']],
    k => ['sin^2 x/(1-cos x)', '1+cos x', ['1-cos x', 'sin x', '1+sin x', 'cos x']],
    k => [`(1-sin^2 x)sec x`, 'cos x', ['sin x', 'sec x', 'cos^2 x', '1']],
    k => [`${co(k)}cos^2 x tan^2 x`, `${co(k)}sin^2 x`, [`${co(k)}cos^2 x`, `${k}`, `${co(k)}sin x`, `${co(k)}tan^2 x`]],
    k => [`(csc^2 x-1)sin^2 x`, 'cos^2 x', ['sin^2 x', '1', 'cot^2 x', '-cos^2 x']],
    k => [`${co(k)}tan^2 x-${co(k)}sec^2 x`, `${-k}`, [`${k}`, `${co(k)}tan^2 x`, '0', `${co(k)}sec^2 x`]],
    k => [`(1+cot^2 x)sin^2 x`, '1', ['cot^2 x', 'sin^2 x', 'cos^2 x', '-1']]];
  const ONE = [['(tan x+cot x)sin x', 'sec x'], ['(sec x-cos x)/sin x', 'tan x'], ['(1+tan^2 x)cos x', 'sec x'], ['sin x+cos x cot x', 'csc x'], ['sec x-sin x tan x', 'cos x'], ['(csc x-sin x)/cos x', 'cot x'],
    ['sin^2 x sec x csc x', 'tan x'], ['(1-cos^2 x)(1+cot^2 x)', '1'], ['tan x cos x csc x', '1'], ['sec x/(tan x+cot x)', 'sin x'], ['cos x(tan x+cot x)', 'csc x'], ['(1-sin x)(1+sin x)sec^2 x', '1']];
  const REC1 = { 'sin x': 'csc x', 'cos x': 'sec x', 'tan x': 'cot x', 'cot x': 'tan x', 'sec x': 'cos x', 'csc x': 'sin x', '1': '-1' };
  S('V.10.03', 'Simplify trig expressions', {
    a: { t: 'factor', g: R => { const v = VAR(R), u = R.pick(U3), k = R.int(0, 3), sv = s => M(sub(s, v)); let ex, right, ds, why;
      if (k === 0) { let m, n; do { m = R.int(1, 5); n = R.int(-9, 9); } while (!n || gcd(m, n) > 1 && R.bool(0.7)); const g = gcd(m, n);
        ex = polyU([[m, 2], [n, 1]], u); right = `${g === 1 ? '' : g}${u}(${lin(m / g, u, n / g)})`; ds = [`${u}(${lin(m, u, -n)})`, `${m === 1 ? 2 : m}${u}(${u}${n > 0 ? '+' : '-'}${Math.abs(n)})`, `(${u}+${m})(${u}${n > 0 ? '+' : '-'}${Math.abs(n)})`, `${u}(${lin(n, u, m)})`];
        why = `Both terms contain ${g === 1 ? '' : g}${tp(u)}, so take it out: ${tp(right)}.`; }
      else if (k === 1) { let r1, r2; do { r1 = R.int(-6, 6); r2 = R.int(-6, 6); } while (!r1 || !r2 || Math.abs(r1) === Math.abs(r2));
        ex = polyU([[1, 2], [-(r1 + r2), 1], [r1 * r2, 0]], u); right = `(${lin(1, u, -r1)})(${lin(1, u, -r2)})`; ds = [`(${lin(1, u, r1)})(${lin(1, u, r2)})`, `(${lin(1, u, -r1)})(${lin(1, u, r2)})`, `(${lin(1, u, r1)})(${lin(1, u, -r2)})`];
        why = `Treat ${tp(u)} as the variable: find two numbers with product ${r1 * r2} and sum ${r1 + r2}, namely ${r1} and ${r2}. So ${tp(right)}.`; }
      else if (k === 2) { const a = R.int(1, 5), b = R.int(1, 7); ex = polyU([[a * a, 2], [-b * b, 0]], u); right = `(${lin(a, u, -b)})(${lin(a, u, b)})`; ds = [`(${lin(a, u, -b)})^2`, `(${lin(a, u, b)})^2`, `(${lin(a, u, -b * b)})(${lin(a, u, 1)})`, `(${lin(a * a, u, -b)})(${lin(1, u, b)})`, `(${lin(-a, u, b)})(${lin(a, u, b)})`];
        why = `It is a difference of squares: (${a === 1 ? '' : a}${tp(u)})² − ${b}² = ${tp(right)}.`; }
      else { const [f, g] = R.pick([['sin x', 'cos x'], ['cos x', 'sin x'], ['tan x', 'sin x'], ['sin x', 'tan x']]), c = R.int(1, 5) * R.pick([1, -1]);
        ex = `${f} ${g}${c > 0 ? '+' : '-'}${Math.abs(c) === 1 ? '' : Math.abs(c)}${f}`; right = `${f}(${g}${c > 0 ? '+' : '-'}${Math.abs(c)})`; ds = [`${g}(${f}${c > 0 ? '+' : '-'}${Math.abs(c)})`, `${f}(${g}${c > 0 ? '-' : '+'}${Math.abs(c)})`, `${Math.abs(c) + 1}${f} ${g}`, `${f} ${g}(1${c > 0 ? '+' : '-'}${Math.abs(c)})`];
        why = `Both terms contain ${tp(f)}: ${tp(right)}.`; }
      need(ex, right, 'V.10.03.a');
      return E.choice(R, `Factor ${sv(ex)}.`, sv(right), pickD(R, right, ds, 'V.10.03.a').map(sv), sub(why, v)); } },
    b: { t: 'common denominators', g: R => { const v = VAR(R), m = R.bool(), T = R.pick(COMB)(R.int(1, 3)), f = s => m ? mir(s) : s, [ex, right, ds] = [f(T[0]), f(T[1]), T[2].map(f)];
      need(ex, right, 'V.10.03.b');
      return E.choice(R, `Combine into a single fraction and simplify: ${M(sub(ex, v))}`, M(sub(right, v)), pickD(R, right, ds, 'V.10.03.b').map(s => M(sub(s, v))),
        `Use a common denominator, then simplify with sin² + cos² = 1: ${tp(sub(ex, v))} = ${tp(sub(right, v))}.`); } },
    c: { t: 'substitute identities', g: R => { const v = VAR(R), m = R.bool(), T = R.pick(SUBST)(R.int(2, 5)), f = s => m ? mir(s) : s, [ex, right, ds] = [f(T[0]), f(T[1]), T[2].map(f)];
      need(ex, right, 'V.10.03.c');
      return E.choice(R, `Simplify ${M(sub(ex, v))}.`, M(sub(right, v)), pickD(R, right, ds, 'V.10.03.c').map(s => M(sub(s, v))),
        `Replace the part that matches a Pythagorean identity, then cancel: ${tp(sub(ex, v))} = ${tp(sub(right, v))}.`); } },
    d: { t: 'reach one function', g: R => { const v = VAR(R), m = R.bool(), sv = s => M(sub(s, v));
      if (R.bool(0.2)) { const f = m ? 'sin x' : 'cos x', g = m ? 'cos x' : 'sin x', k = R.int(1, 4), ex = `(${co(k)}${g}+${f})/${f}`, right = `${co(k)}${m ? 'cot' : 'tan'} x+1`; need(ex, right, 'V.10.03.d');
        return E.choice(R, `Simplify ${sv(ex)}.`, sv(right), pickD(R, right, [`${co(k)}${g}`, `${co(k)}${g}+1`, `${co(k)}${m ? 'cot' : 'tan'} x`, `${co(k + 1)}${m ? 'cot' : 'tan'} x`], 'V.10.03.d').map(sv),
          `Split the fraction: ${tp(sub(`${co(k)}${g}/${f}`, v))} + ${tp(sub(`${f}/${f}`, v))} = ${tp(sub(right, v))}. You can't cancel ${tp(sub(f, v))} from just one term of a sum.`); }
      const T = R.pick(ONE), ex = m ? mir(T[0]) : T[0], right = m ? mir(T[1]) : T[1]; need(ex, right, 'V.10.03.d');
      const ds = pickD(R, right, [REC1[right], mir(right), ...R.shuffle(['sin x', 'cos x', 'tan x', 'cot x', 'sec x', 'csc x', '1'])], 'V.10.03.d');
      return E.choice(R, `Simplify ${sv(ex)} to a single trig function or a number.`, sv(right), ds.map(sv), `Write everything in sin and cos, combine, and use sin² + cos² = 1: ${tp(sub(ex, v))} = ${tp(sub(right, v))}.`); } },
  });

  /* ================= V.10.04 Prove identities ================= */
  const RQ = 'quotient identity', RR = 'reciprocal identity', RP = 'Pythagorean identity', RC = 'common denominator', RJ = 'multiply by the conjugate', RX = 'cancel', RE = 'expand', RD = 'difference of squares', RF = 'factor', RRQ = 'reciprocal and quotient identities';
  // proofs: [left side, ...[line, reason]]; the last line is the right side. Every line is checked by evaluation.
  const PF = [
    ['sin x cot x', ['sin x(cos x/sin x)', RQ], ['cos x', RX]],
    ['(1-cos^2 x)csc x', ['sin^2 x csc x', RP], ['sin^2 x(1/sin x)', RR], ['sin x', RX]],
    ['tan x+cot x', ['sin x/cos x+cos x/sin x', RQ], ['(sin^2 x+cos^2 x)/(sin x cos x)', RC], ['1/(sin x cos x)', RP], ['sec x csc x', RR]],
    ['sec x-cos x', ['1/cos x-cos x', RR], ['(1-cos^2 x)/cos x', RC], ['sin^2 x/cos x', RP], ['sin x tan x', RQ]],
    ['(1+tan^2 x)cos^2 x', ['sec^2 x cos^2 x', RP], ['(1/cos^2 x)cos^2 x', RR], ['1', RX]],
    ['cos x/(1-sin x)', ['cos x(1+sin x)/((1-sin x)(1+sin x))', RJ], ['cos x(1+sin x)/(1-sin^2 x)', RD], ['cos x(1+sin x)/cos^2 x', RP], ['(1+sin x)/cos x', RX]],
    ['1/(1-sin x)+1/(1+sin x)', ['(1+sin x+1-sin x)/((1-sin x)(1+sin x))', RC], ['2/(1-sin^2 x)', 'simplify'], ['2/cos^2 x', RP], ['2sec^2 x', RR]],
    ['(sin x+cos x)^2', ['sin^2 x+2sin x cos x+cos^2 x', RE], ['1+2sin x cos x', RP]],
    ['sin^4 x-cos^4 x', ['(sin^2 x-cos^2 x)(sin^2 x+cos^2 x)', RD], ['sin^2 x-cos^2 x', RP]],
    ['(sec x-1)(sec x+1)', ['sec^2 x-1', RE], ['tan^2 x', RP]],
    ['cos x(sec x-cos x)', ['cos x sec x-cos^2 x', RE], ['1-cos^2 x', RR], ['sin^2 x', RP]],
    ['sec x/csc x', ['(1/cos x)/(1/sin x)', RR], ['sin x/cos x', 'simplify'], ['tan x', RQ]],
    ['sec x-sin x tan x', ['1/cos x-sin x(sin x/cos x)', RRQ], ['(1-sin^2 x)/cos x', RC], ['cos^2 x/cos x', RP], ['cos x', RX]],
    ['1/(sec x-tan x)', ['(sec x+tan x)/((sec x-tan x)(sec x+tan x))', RJ], ['(sec x+tan x)/(sec^2 x-tan^2 x)', RD], ['sec x+tan x', RP]],
    ['tan x/(sec x-1)', ['tan x(sec x+1)/((sec x-1)(sec x+1))', RJ], ['tan x(sec x+1)/(sec^2 x-1)', RD], ['tan x(sec x+1)/tan^2 x', RP], ['(sec x+1)/tan x', RX]],
    ['(sec x+tan x)(1-sin x)', ['(1/cos x+sin x/cos x)(1-sin x)', RRQ], ['(1+sin x)(1-sin x)/cos x', RC], ['(1-sin^2 x)/cos x', RD], ['cos^2 x/cos x', RP], ['cos x', RX]],
  ];
  // conjugate proofs: [left, conjugate, denominator after, its distractors]
  const CJ = [
    [['cos x/(1-sin x)', ['cos x(1+sin x)/((1-sin x)(1+sin x))', RJ], ['cos x(1+sin x)/(1-sin^2 x)', RD], ['cos x(1+sin x)/cos^2 x', RP], ['(1+sin x)/cos x', RX]], '1+sin x', '1-sin x', 'cos^2 x', ['sin^2 x', '1-sin x', '1+sin^2 x', '1']],
    [['cos x/(1+sin x)', ['cos x(1-sin x)/((1+sin x)(1-sin x))', RJ], ['cos x(1-sin x)/(1-sin^2 x)', RD], ['cos x(1-sin x)/cos^2 x', RP], ['(1-sin x)/cos x', RX]], '1-sin x', '1+sin x', 'cos^2 x', ['sin^2 x', '1+sin x', '1-cos^2 x', '1']],
    [['1/(sec x-tan x)', ['(sec x+tan x)/((sec x-tan x)(sec x+tan x))', RJ], ['(sec x+tan x)/(sec^2 x-tan^2 x)', RD], ['sec x+tan x', RP]], 'sec x+tan x', 'sec x-tan x', '1', ['sec^2 x+tan^2 x', '-1', 'tan^2 x', 'sec^2 x']],
    [['1/(sec x+tan x)', ['(sec x-tan x)/((sec x+tan x)(sec x-tan x))', RJ], ['(sec x-tan x)/(sec^2 x-tan^2 x)', RD], ['sec x-tan x', RP]], 'sec x-tan x', 'sec x+tan x', '1', ['sec^2 x+tan^2 x', '-1', 'tan^2 x', 'sec^2 x']],
    [['tan x/(sec x-1)', ['tan x(sec x+1)/((sec x-1)(sec x+1))', RJ], ['tan x(sec x+1)/(sec^2 x-1)', RD], ['tan x(sec x+1)/tan^2 x', RP], ['(sec x+1)/tan x', RX]], 'sec x+1', 'sec x-1', 'tan^2 x', ['sec^2 x+1', '1', '-tan^2 x', 'sec^2 x']],
    [['tan x/(sec x+1)', ['tan x(sec x-1)/((sec x+1)(sec x-1))', RJ], ['tan x(sec x-1)/(sec^2 x-1)', RD], ['tan x(sec x-1)/tan^2 x', RP], ['(sec x-1)/tan x', RX]], 'sec x-1', 'sec x+1', 'tan^2 x', ['sec^2 x+1', '1', '-tan^2 x', 'sec^2 x']],
    [['sin x/(1-cos x)', ['sin x(1+cos x)/((1-cos x)(1+cos x))', RJ], ['sin x(1+cos x)/(1-cos^2 x)', RD], ['sin x(1+cos x)/sin^2 x', RP], ['(1+cos x)/sin x', RX]], '1+cos x', '1-cos x', 'sin^2 x', ['cos^2 x', '1-cos x', '1+cos^2 x', '1']],
  ];
  // proofs whose complicated side mixes tan/cot with sec/csc, for the "convert first" step
  const MIX = [['sec x-sin x tan x', 'cos x'], ['tan x csc x', 'sec x'], ['sec x csc x-cot x', 'tan x'], ['sec x/tan x', 'csc x'], ['tan x/sec x', 'sin x'], ['(sec x+tan x)(1-sin x)', 'cos x'], ['sin x sec x cot x', '1'], ['(1+cot x)/csc x', 'sin x+cos x'], ['cot x sec x', 'csc x']];
  const MAPS = { ok: { tan: ['sin', 'cos'], cot: ['cos', 'sin'], sec: ['1', 'cos'], csc: ['1', 'sin'] }, A: { tan: ['cos', 'sin'], cot: ['sin', 'cos'], sec: ['1', 'cos'], csc: ['1', 'sin'] },
    B: { tan: ['sin', 'cos'], cot: ['cos', 'sin'], sec: ['1', 'sin'], csc: ['1', 'cos'] }, AB: { tan: ['cos', 'sin'], cot: ['sin', 'cos'], sec: ['1', 'sin'], csc: ['1', 'cos'] },
    D: { tan: ['sin', 'cos'], cot: ['sin', 'cos'], sec: ['cos', null], csc: ['sin', null] },
    E: { tan: ['sin', 'cos'], cot: ['cos', 'sin'], sec: ['cos', null], csc: ['sin', null] }, F: { tan: ['cos', 'sin'], cot: ['cos', 'sin'], sec: ['1', 'cos'], csc: ['1', 'sin'] },
    G: { tan: ['sin', 'cos'], cot: ['sin', 'cos'], sec: ['1', 'cos'], csc: ['1', 'sin'] }, H: { tan: ['cos', 'sin'], cot: ['sin', 'cos'], sec: ['cos', null], csc: ['sin', null] } };
  // rewrite tan/cot/sec/csc with a (possibly wrong) map, adding brackets only where a product needs them
  const convert = (s, map) => s.replace(/(tan|cot|sec|csc)(\^2)? x/g, (m, f, sq, off) => {
    const [n, d] = map[f], P = t => t === '1' ? '1' : `${t}${sq ? '^2' : ''} x`, body = d ? `${P(n)}/${P(d)}` : P(n);
    const before = s.slice(0, off).replace(/\s+$/, ''), after = s.slice(off + m.length).replace(/^\s+/, ''), bare = (!before || /[+\-(]$/.test(before)) && (!after || /^[+\-)]/.test(after));
    return bare || !d ? body : `(${body})`; });
  const proofOf = (P, m) => { const f = s => m ? mir(s) : s, L = f(P[0]), lines = P.slice(1).map(([e, r]) => [f(e), r]); lines.forEach(([e], i) => need(e, L, 'V.10.04 proof line ' + i)); return { L, lines, Rt: lines[lines.length - 1][0] }; };
  const pline = (v, e, r) => `= ${M(sub(e, v))} <i>(${r})</i>`;
  const tbl = rows => `<table class="dt">${rows.map(r => `<tr>${r.map((c, i) => i ? `<td>${c}</td>` : `<th>${c}</th>`).join('')}</tr>`).join('')}</table>`;
  // a student's "proof" with exactly one wrong step: [lines, index of the wrong line, why]
  const BROKEN = [
    [['tan x cos x+sin x', '(cos x/sin x)cos x+sin x', 'cos^2 x/sin x+sin x', '(cos^2 x+sin^2 x)/sin x', '1/sin x'], 1, 'tan x is sin x/cos x, not cos x/sin x (that is cot x). Every later step is fine, but it builds on that mistake.'],
    [['sec x-cos x', '1/cos x-cos x', '(1-cos x)/cos x', '1/cos x-1', 'sec x-1'], 2, 'Over the denominator cos x, the term cos x becomes cos²x/cos x, so the line should be (1 − cos²x)/cos x.'],
    [['(sin x cos x+cos^2 x)/cos^2 x', 'cos x(sin x+cos x)/cos^2 x', '(sin x+cos x)/cos x', 'sin x+1'], 3, 'cos x was cancelled from only one term of a sum. (sin x + cos x)/cos x = tan x + 1, not sin x + 1.'],
    [['(1+tan^2 x)cos x', 'sec^2 x cos x', '(1/sin^2 x)cos x', 'cos x/sin^2 x', 'cot x csc x'], 2, 'sec x = 1/cos x, so sec²x = 1/cos²x, not 1/sin²x.'],
    [['(sec^2 x-1)cos^2 x', '-tan^2 x cos^2 x', '-(sin^2 x/cos^2 x)cos^2 x', '-sin^2 x'], 1, 'The identity is 1 + tan²x = sec²x, so sec²x − 1 = tan²x, not −tan²x.'],
    [['(1+tan x)^2 cos^2 x', '(1+tan^2 x)cos^2 x', 'sec^2 x cos^2 x', '1'], 1, '(1 + tan x)² = 1 + 2tan x + tan²x: the middle term 2tan x was dropped.'],
    [['sec x csc x-cot x', '1/(cos x sin x)-cot x', '1/(cos x sin x)-sin x/cos x', '(1-sin^2 x)/(sin x cos x)', 'cos^2 x/(sin x cos x)', 'cos x/sin x'], 2, 'cot x = cos x/sin x, not sin x/cos x.'],
    [['sin x/(1-cos x)', 'sin x(1+cos x)/((1-cos x)(1+cos x))', 'sin x(1+cos x)/(1-cos^2 x)', 'sin x(1+cos x)/cos^2 x', 'tan x sec x+tan x'], 3, '1 − cos²x = sin²x, not cos²x.'],
  ];
  const HARD = [
    ['(1+sin x)/cos x+cos x/(1+sin x)', ['((1+sin x)^2+cos^2 x)/(cos x(1+sin x))', RC], ['(1+2sin x+sin^2 x+cos^2 x)/(cos x(1+sin x))', RE], ['(2+2sin x)/(cos x(1+sin x))', RP], ['2(1+sin x)/(cos x(1+sin x))', RF], ['2/cos x', RX], ['2sec x', RR]],
    ['tan^2 x-sin^2 x', ['sin^2 x/cos^2 x-sin^2 x', RQ], ['(sin^2 x-sin^2 x cos^2 x)/cos^2 x', RC], ['sin^2 x(1-cos^2 x)/cos^2 x', RF], ['sin^2 x sin^2 x/cos^2 x', RP], ['tan^2 x sin^2 x', RQ]],
    ['(sin x+cos x)(tan x+cot x)', ['(sin x+cos x)(sin x/cos x+cos x/sin x)', RQ], ['(sin x+cos x)(sin^2 x+cos^2 x)/(sin x cos x)', RC], ['(sin x+cos x)/(sin x cos x)', RP], ['sin x/(sin x cos x)+cos x/(sin x cos x)', 'split the fraction'], ['1/cos x+1/sin x', RX], ['sec x+csc x', RR]],
    ['sin x/(1-cos x)+sin x/(1+cos x)', ['(sin x(1+cos x)+sin x(1-cos x))/(1-cos^2 x)', RC], ['2sin x/(1-cos^2 x)', 'simplify'], ['2sin x/sin^2 x', RP], ['2/sin x', RX], ['2csc x', RR]],
    ['(1-tan^2 x)/(1+tan^2 x)', ['(1-tan^2 x)/sec^2 x', RP], ['(1-tan^2 x)cos^2 x', RR], ['cos^2 x-tan^2 x cos^2 x', RE], ['cos^2 x-sin^2 x', RQ]],
    ['cos^4 x-sin^4 x', ['(cos^2 x-sin^2 x)(cos^2 x+sin^2 x)', RD], ['cos^2 x-sin^2 x', RP], ['1-sin^2 x-sin^2 x', RP], ['1-2sin^2 x', 'simplify']],
    ['(csc x-cot x)^2', ['(1/sin x-cos x/sin x)^2', RRQ], ['(1-cos x)^2/sin^2 x', RC], ['(1-cos x)^2/(1-cos^2 x)', RP], ['(1-cos x)^2/((1-cos x)(1+cos x))', RD], ['(1-cos x)/(1+cos x)', RX]],
    ['sec^4 x-tan^4 x', ['(sec^2 x-tan^2 x)(sec^2 x+tan^2 x)', RD], ['sec^2 x+tan^2 x', RP], ['1+tan^2 x+tan^2 x', RP], ['1+2tan^2 x', 'simplify']],
  ];
  const REASONS = [RQ, RR, RP, RC, RJ, RX, RE, RD, RF];
  const showId = (v, a, b, flip) => flip ? M(`${sub(b, v)}=${sub(a, v)}`) : M(`${sub(a, v)}=${sub(b, v)}`);
  S('V.10.04', 'Prove identities', {
    a: { t: 'work one side only', g: R => { const v = VAR(R), k = R.int(0, 2);
      if (k === 0) { const P = proofOf(R.pick(PF), R.bool()), flip = R.bool(), side = flip ? 'right' : 'left';
        return E.choiceFixed(`You want to prove ${showId(v, P.L, P.Rt, flip)}. Which side is the better place to start?`, ['the left side', 'the right side'], flip ? 1 : 0,
          `Start with the more complicated side, ${tp(sub(P.L, v))}, here the ${side} side, and rewrite it until it becomes ${tp(sub(P.Rt, v))}. There is more there to simplify.`); }
      if (k === 1) { const P = proofOf(R.pick(PF), R.bool()), flip = R.bool(), side = flip ? 'right' : 'left';
        const right = `Rewrite the ${side} side, one step at a time, until it becomes the other side.`;
        const ds = ['Square both sides, then simplify each side until they match.', `Check that both sides are equal when ${v} = 30°.`, 'Treat it like an equation: do the same thing to both sides until you reach a true statement.', 'Cross-multiply, then simplify both sides at once.'];
        return E.choice(R, `Which plan gives a valid proof of ${showId(v, P.L, P.Rt, flip)}?`, right, R.sample(ds, 3),
          `Work on one side only, here the ${side} side (${tp(sub(P.L, v))}), until it matches the other. Squaring can create false equalities, and checking one value never proves "for every ${v}".`); }
      const truth = R.bool(), [st, why] = R.pick(truth ? [[`Checking that both sides agree at ${v} = 45° does not prove an identity.`, 'One value is only one example; an identity must hold for every allowed value.'],
        ['You may start from the right side instead of the left, as long as you work on only that side.', 'Either side works; what matters is transforming one side until it matches the other.'],
        ['Each line of an identity proof must equal the line before it for every allowed value.', 'That is what makes the chain of equals signs valid.'],
        ['Multiplying the top and bottom of a fraction by the same nonzero expression is allowed in a proof.', 'It multiplies by 1, so the value does not change.']]
        : [[`Checking that both sides agree at ${v} = 45° proves the identity.`, 'One value is only one example; an identity must hold for every allowed value.'],
          ['Squaring both sides is a safe first step in proving an identity.', 'Squaring is not reversible: (−1)² = 1² even though −1 ≠ 1.'],
          ['To prove an identity you may move terms from one side to the other, as when solving an equation.', 'That assumes the identity is already true. Transform one side only.'],
          ['Multiplying both sides by 0 and getting 0 = 0 proves an identity.', '0 = 0 is true whatever you started with, so it proves nothing.']]);
      return E.tf(`True or false? ${st}`, truth, why); } },
    b: { t: 'convert to sin and cos', g: R => { const v = VAR(R), m = R.bool(), T = R.pick(MIX), L = m ? mir(T[0]) : T[0], Rt = m ? mir(T[1]) : T[1], flip = R.bool();
      need(L, Rt, 'V.10.04.b'); const right = convert(L, MAPS.ok); need(right, L, 'V.10.04.b conv');
      const ds = pickD(R, right, [convert(L, MAPS.A), convert(L, MAPS.B), convert(L, MAPS.AB), convert(L, MAPS.D), convert(L, MAPS.E), convert(L, MAPS.F), convert(L, MAPS.G), convert(L, MAPS.H)], 'V.10.04.b');
      return E.choice(R, `To prove ${showId(v, L, Rt, flip)}, you rewrite ${M(sub(L, v))} in sin and cos. Which line is correct?`, `= ${M(sub(right, v))}`, ds.map(s => `= ${M(sub(s, v))}`),
        `tan = sin/cos, cot = cos/sin, sec = 1/cos and csc = 1/sin, so ${tp(sub(L, v))} = ${tp(sub(right, v))}.`); } },
    c: { t: 'multiply by a conjugate', g: R => { const v = VAR(R), m = R.bool(), f = s => m ? mir(s) : s, T = R.pick(CJ), P = proofOf(T[0], m), k = R.int(0, 2), cj = f(T[1]), bad = f(T[2]), den = f(T[3]);
      const sv = s => M(sub(s, v));
      if (k === 0) { const num = P.L.split('/')[0], t1 = bad.split(/[+-]/)[0], alt = num !== '1' ? num : t1, ds = [`(${bad})/(${bad})`, `(${mir(cj)})/(${mir(cj)})`, `(${alt})/(${alt})`];
        const right = `(${cj})/(${cj})`, opts = [...new Set(ds.filter(d => d !== right))].slice(0, 3);
        return E.choice(R, `To prove ${showId(v, P.L, P.Rt, false)}, you multiply the top and bottom of the left side by the same expression. Which one?`, sv(right), opts.map(sv),
          `Use the conjugate of the denominator ${tp(sub(bad, v))}: multiplying by ${tp(sub(cj, v))} turns it into a difference of squares, ${tp(sub(den, v))}.`); }
      if (k === 1) { const prod = `(${bad})(${cj})`; need(prod, den, 'V.10.04.c den');
        return E.choice(R, `Simplify ${sv(prod)}, the denominator you get after multiplying by the conjugate.`, sv(den), pickD(R, den, T[4].map(f), 'V.10.04.c').map(sv),
          `Difference of squares, then a Pythagorean identity: ${tp(sub(prod, v))} = ${tp(sub(den, v))}.`); }
      return K.orderQ(R, `Put the lines of this proof of ${showId(v, P.L, P.Rt, false)} in order.`, [M(sub(P.L, v)), ...P.lines.map(([e, r]) => pline(v, e, r))], [[], ...P.lines.map((l, i) => [i])],
        `Multiply by the conjugate, multiply out the denominator, use a Pythagorean identity, then cancel: ${[P.L, ...P.lines.map(l => l[0])].map(s => tp(sub(s, v))).join(' = ')}.`); } },
    d: { t: 'write it cleanly', g: R => { const v = VAR(R), m = R.bool(), f = s => m ? mir(s) : s;
      if (R.bool(0.4)) { const [L0, j, why] = R.pick(BROKEN), L = L0.map(f);
        L.slice(1).forEach((e, i) => { const ok = same(L[i], e); if (ok === (i + 1 === j)) throw new Error('V.10.04.d broken template ' + L0[0]); });
        const rows = L.map((e, i) => [`Step ${i + 1}`, (i ? '= ' : '') + M(sub(e, v))]);
        return E.choiceFixed(`A student tries to show that ${M(`${sub(L[0], v)}=${sub(L[L.length - 1], v)}`)}. Exactly one step is wrong. Which one?` + tbl(rows), L.slice(1).map((e, i) => `Step ${i + 2}`), j - 1, `Step ${j + 1} is wrong: ${tp(sub(f(why), v))}`); }
      const P = proofOf(R.pick(PF), m), flip = R.bool();
      return K.orderQ(R, `Put the lines of this proof of ${showId(v, P.L, P.Rt, flip)} in order. It starts from the ${flip ? 'right' : 'left'} side.`, [M(sub(P.L, v)), ...P.lines.map(([e, r]) => pline(v, e, r))], [[], ...P.lines.map((l, i) => [i])],
        `Each line rewrites the one before: ${[P.L, ...P.lines.map(l => l[0])].map(s => tp(sub(s, v))).join(' = ')}.`); } },
    e: { t: 'longer proofs', g: R => { const v = VAR(R), m = R.bool(), P = proofOf(R.pick(HARD), m), n = P.lines.length;
      if (R.bool(0.3)) { const j = R.int(0, n - 1), r = P.lines[j][1], prev = j ? P.lines[j - 1][0] : P.L;
        const ds = R.sample(REASONS.filter(x => x !== r && !(r === RRQ && (x === RQ || x === RR))), 3);
        return E.choice(R, `In this proof of ${showId(v, P.L, P.Rt, false)}, which reason turns ${M(sub(prev, v))} into ${M(sub(P.lines[j][0], v))}?`, r, ds, `Going from ${tp(sub(prev, v))} to ${tp(sub(P.lines[j][0], v))} uses the ${r}.`); }
      return K.orderQ(R, `Put the lines of this proof of ${showId(v, P.L, P.Rt, false)} in order.`, [M(sub(P.L, v)), ...P.lines.map(([e, r]) => pline(v, e, r))], [[], ...P.lines.map((l, i) => [i])],
        `Each line rewrites the one before: ${[P.L, ...P.lines.map(l => l[0])].map(s => tp(sub(s, v))).join(' = ')}.`); } },
    f: { t: 'identities that unlock a value', g: R => { const k = R.int(0, 4), v = VAR(R);
      if (k === 0) { let p, q; do { q = R.int(2, 7); p = R.int(-Math.floor(q * 1.41), Math.floor(q * 1.41)); } while (!p || gcd(p, q) > 1 || Math.abs(p) === q || p * p >= 2 * q * q);
        const ans = fr(p * p - q * q, 2 * q * q);
        return E.num(`If ${M(`${sub('sin x+cos x', v)}=${fr(p, q)}`)}, find the exact value of ${M(sub('sin x cos x', v))}.`, [X(ans, `sin ${v} cos ${v} =`)],
          `Square both sides: sin² + 2 sin ${v} cos ${v} + cos² = ${tp(fr(p * p, q * q))}, so 1 + 2 sin ${v} cos ${v} = ${tp(fr(p * p, q * q))} and sin ${v} cos ${v} = ${tp(ans)}.`); }
      if (k === 1) { const n = R.int(2, 7) * R.pick([1, 1, -1]), cube = R.bool(0.4), ans = cube ? n * n * n - 3 * n : n * n - 2;
        return E.num(`If ${M(`${sub('tan x+cot x', v)}=${n}`)}, find ${M(sub(cube ? 'tan^3 x+cot^3 x' : 'tan^2 x+cot^2 x', v))}.`, [{ label: 'value =', ans }],
          cube ? `tan ${v} · cot ${v} = 1, so tan³ + cot³ = (tan + cot)³ − 3 tan cot (tan + cot) = ${n < 0 ? `(${n})` : n}³ − 3(${n}) = ${ans}.` : `tan ${v} · cot ${v} = 1, so (tan + cot)² = tan² + 2 + cot². Then tan² + cot² = ${n < 0 ? `(${n})` : n}² − 2 = ${ans}.`); }
      if (k === 2) { let p, q; do { p = R.int(1, 9); q = R.int(1, 9); } while (gcd(p, q) > 1 || p === q); const askS = R.bool(), ans = askS ? fr(p * p - q * q, p * p + q * q) : fr(2 * p * q, p * p + q * q);
        return E.num(`If ${M(`${sub('sec x+tan x', v)}=${fr(p, q)}`)}, find the exact value of ${askS ? 'sin' : 'cos'} ${v}.`, [X(ans, `${askS ? 'sin' : 'cos'} ${v} =`)],
          `(sec + tan)(sec − tan) = sec² − tan² = 1, so sec ${v} − tan ${v} = ${tp(fr(q, p))}. Adding and subtracting: sec ${v} = ${tp(fr(p * p + q * q, 2 * p * q))} and tan ${v} = ${tp(fr(p * p - q * q, 2 * p * q))}, so ${askS ? `sin = tan/sec = ${tp(ans)}` : `cos = 1/sec = ${tp(ans)}`}.`); }
      let p, q; do { q = R.int(2, 7); p = R.int(-Math.floor(q * 1.41), Math.floor(q * 1.41)); } while (!p || gcd(p, q) > 1 || Math.abs(p) === q || p * p >= 2 * q * q);
      if (k === 3) { const sc = [p * p - q * q, 2 * q * q], ans = fr(sc[1] * sc[1] - 2 * sc[0] * sc[0], sc[1] * sc[1]);
        return E.num(`If ${M(`${sub('sin x+cos x', v)}=${fr(p, q)}`)}, find the exact value of ${M(sub('sin^4 x+cos^4 x', v))}.`, [X(ans, 'value =')],
          `Squaring gives sin ${v} cos ${v} = ${tp(fr(sc[0], sc[1]))}. Then sin⁴ + cos⁴ = (sin² + cos²)² − 2sin²cos² = 1 − 2(${tp(fr(sc[0], sc[1]))})² = ${tp(ans)}.`); }
      const ans = fr(q * q - p * p, 2 * q * q);
      return E.num(`If ${M(`${sub('sin x-cos x', v)}=${fr(p, q)}`)}, find the exact value of ${M(sub('sin x cos x', v))}.`, [X(ans, `sin ${v} cos ${v} =`)],
        `Square both sides: 1 − 2 sin ${v} cos ${v} = ${tp(fr(p * p, q * q))}, so sin ${v} cos ${v} = ${tp(ans)}.`); } },
  });

  /* ================= V.10.05 Sum & difference formulas ================= */
  // sin and cos of two angles from triples, with chosen quadrants
  const angPair = R => { const mk = () => { const [a, b, c] = R.pick(TRIP), sw = R.bool(), q = R.int(0, 3), [sc, ss] = qSigns(q); return { c: [sc * (sw ? a : b), c], s: [ss * (sw ? b : a), c], q }; }; let A, B; do { A = mk(); B = mk(); } while (A.c[1] === B.c[1] && A.c[0] === B.c[0] && A.s[0] === B.s[0]); return [A, B]; };
  const F15 = [15, 75, 105, 165, 195, 255, 285, 345];
  const exact15 = (f, d) => { const v = fv(f, d); const C15 = ['(sqrt(6)+sqrt(2))/4', '(sqrt(6)-sqrt(2))/4', '(-sqrt(6)+sqrt(2))/4', '(-sqrt(6)-sqrt(2))/4', '2+sqrt(3)', '2-sqrt(3)', '-2+sqrt(3)', '-2-sqrt(3)'];
    for (const c of C15) if (Math.abs(val(c) - v) < 1e-9) return c; throw new Error('no 15° value'); };
  const split15 = d => d === 15 ? [45, 30, '-'] : [d - 45, 45, '+'];
  const fmlaTxt = { sin: { '+': 'sin A cos B + cos A sin B', '-': 'sin A cos B − cos A sin B' }, cos: { '+': 'cos A cos B − sin A sin B', '-': 'cos A cos B + sin A sin B' }, tan: { '+': '(tan A + tan B)/(1 − tan A tan B)', '-': '(tan A − tan B)/(1 + tan A tan B)' } };
  const fmlaQ = (R, f) => { const op = R.pick(['+', '-']), o = op === '+' ? '-' : '+', T = { sin: [`sin A cos B${op}cos A sin B`, [`sin A cos B${o}cos A sin B`, `sin A${op}sin B`, `sin A sin B${op}cos A cos B`]],
      cos: [`cos A cos B${o}sin A sin B`, [`cos A cos B${op}sin A sin B`, `cos A${op}cos B`, `sin A cos B${op}cos A sin B`]], tan: [`(tan A${op}tan B)/(1${o}tan A tan B)`, [`(tan A${op}tan B)/(1${op}tan A tan B)`, `tan A${op}tan B`, `(tan A${o}tan B)/(1${op}tan A tan B)`]] }[f];
    return E.choice(R, `Which expression equals ${M(`${f}(A${op}B)`)}?`, M(T[0]), T[1].map(M), `${f}(A ${op === '+' ? '+' : '−'} B) = ${fmlaTxt[f][op]}. It is not ${f} A ${op === '+' ? '+' : '−'} ${f} B.`); };
  // derive tan(A ± B) from the sine and cosine formulas: order the lines, name a reason, or find the broken step
  const tanDeriv = R => { const [A, B] = R.pick([['A', 'B'], ['x', 'y'], ['α', 'β']]), op = R.pick(['+', '-']), o = op === '+' ? '-' : '+', so = op === '+' ? '+' : '−', sw = op === '+' ? 'sum' : 'difference';
    const ex = [`tan(${A}${op}${B})`, `(sin(${A}${op}${B}))/(cos(${A}${op}${B}))`, `(sin ${A} cos ${B}${op}cos ${A} sin ${B})/(cos ${A} cos ${B}${o}sin ${A} sin ${B})`,
      `((sin ${A})/(cos ${A})${op}(sin ${B})/(cos ${B}))/(1${o}((sin ${A})/(cos ${A}))((sin ${B})/(cos ${B})))`, `(tan ${A}${op}tan ${B})/(1${o}tan ${A} tan ${B})`];
    const bad = [null, null, `(sin ${A} cos ${B}${op}cos ${A} sin ${B})/(cos ${A} cos ${B}${op}sin ${A} sin ${B})`, `((sin ${A})/(cos ${B})${op}(sin ${B})/(cos ${A}))/(1${o}((sin ${A})/(cos ${A}))((sin ${B})/(cos ${B})))`, `(tan ${A}${op}tan ${B})/(1${op}tan ${A} tan ${B})`];
    const RS = ['quotient identity', `${sw} formulas for sine and cosine`, `divide the top and bottom by cos ${A} cos ${B}`, 'quotient identity'];
    const WR = ['Pythagorean identity', 'reciprocal identity', 'double-angle formula', `multiply the top and bottom by cos ${A} cos ${B}`];
    const line = (i, e) => i === 0 ? M(`${ex[0]}=${e}`) : `= ${M(e)}`, head = `Derive the formula for ${M(ex[0])}.`, kind = R.int(0, 2);
    const flow = `tan = sin/cos, expand with the ${sw} formulas, divide every term by cos ${A} cos ${B}, then turn each sin/cos into tan.`;
    if (kind === 0) return K.orderQ(R, `${head} Put the lines in order.`, ex.slice(1).map((e, i) => `${line(i, e)} <i>(${RS[i]})</i>`), [[], [0], [1], [2]], flow, { fixed: 1 });
    if (kind === 1) { const k = R.int(1, 3), rows = ex.slice(1).map((e, i) => [line(i, e), RS[i]]);
      return E.choice(R, `${head} What is the reason for step ${k + 1}?${twoCol(rows, k)}`, RS[k], R.sample(WR.concat(RS.filter(r => r !== RS[k])).filter((r, i, a) => a.indexOf(r) === i), 3), `${flow} Step ${k + 1}: ${RS[k]}.`); }
    const b = R.int(2, 4), rows = ex.slice(1).map((e, i) => line(i, i + 1 === b ? bad[b] : e));
    const why = { 2: `Step 2 is wrong: cos(${A} ${so} ${B}) = cos ${A} cos ${B} ${op === '+' ? '−' : '+'} sin ${A} sin ${B}; the sign in the middle is the opposite of the one in the angle.`,
      3: `Step 3 is wrong: dividing sin ${A} cos ${B} by cos ${A} cos ${B} leaves sin ${A}/cos ${A}, not sin ${A}/cos ${B}.`,
      4: `Step 4 is wrong: the denominator of step 3 is 1 ${op === '+' ? '−' : '+'} tan ${A} tan ${B}, so the sign must stay ${op === '+' ? 'minus' : 'plus'}.` }[b];
    return E.choiceFixed(`A student derives the formula for ${M(ex[0])}. Exactly one step is wrong. Which one?${stepTbl(rows)}`, ['Step 2', 'Step 3', 'Step 4'], b - 2, why); };
  S('V.10.05', 'Sum & difference formulas', {
    a: { t: 'cos(A ± B)', g: R => { if (R.bool(0.2)) return fmlaQ(R, 'cos');
      const [A, B] = angPair(R), op = R.pick(['+', '-']), N = A.c[0] * B.c[0] + (op === '+' ? -1 : 1) * A.s[0] * B.s[0], D = A.c[1] * B.c[1], ans = fr(N, D);
      return E.num(`${M(`cos A=${fr(...A.c)}`)}, ${M(`sin A=${fr(...A.s)}`)}, ${M(`cos B=${fr(...B.c)}`)} and ${M(`sin B=${fr(...B.s)}`)}. Find ${M(`cos(A${op}B)`)}.`, [X(ans, `cos(A ${op === '+' ? '+' : '−'} B) =`)],
        `cos(A ${op === '+' ? '+' : '−'} B) = ${fmlaTxt.cos[op]} = (${tp(fr(...A.c))})(${tp(fr(...B.c))}) ${op === '+' ? '−' : '+'} (${tp(fr(...A.s))})(${tp(fr(...B.s))}) = ${tp(ans)}.`); } },
    b: { t: 'sin(A ± B)', g: R => { if (R.bool(0.2)) return fmlaQ(R, 'sin');
      const [A, B] = angPair(R), op = R.pick(['+', '-']), N = A.s[0] * B.c[0] + (op === '+' ? 1 : -1) * A.c[0] * B.s[0], D = A.c[1] * B.c[1], ans = fr(N, D);
      if (R.bool(0.5)) { // acute angles, only the sines given: find the cosines first
        const [a1, b1, c1] = R.pick(TRIP), [a2, b2, c2] = R.pick(TRIP.filter(t => t[2] !== c1)), sA = [a1, c1], sB = [b2, c2], cA = [b1, c1], cB = [a2, c2], N2 = sA[0] * cB[0] + (op === '+' ? 1 : -1) * cA[0] * sB[0], ans2 = fr(N2, c1 * c2);
        return E.num(`A and B are acute angles with ${M(`sin A=${fr(...sA)}`)} and ${M(`sin B=${fr(...sB)}`)}. Find ${M(`sin(A${op}B)`)}.`, [X(ans2, `sin(A ${op === '+' ? '+' : '−'} B) =`)],
          `For acute angles the cosines are positive: cos A = ${tp(fr(...cA))}, cos B = ${tp(fr(...cB))}. Then sin(A ${op === '+' ? '+' : '−'} B) = ${fmlaTxt.sin[op]} = ${tp(ans2)}.`); }
      return E.num(`${M(`sin A=${fr(...A.s)}`)}, ${M(`cos A=${fr(...A.c)}`)}, ${M(`sin B=${fr(...B.s)}`)} and ${M(`cos B=${fr(...B.c)}`)}. Find ${M(`sin(A${op}B)`)}.`, [X(ans, `sin(A ${op === '+' ? '+' : '−'} B) =`)],
        `sin(A ${op === '+' ? '+' : '−'} B) = ${fmlaTxt.sin[op]} = (${tp(fr(...A.s))})(${tp(fr(...B.c))}) ${op === '+' ? '+' : '−'} (${tp(fr(...A.c))})(${tp(fr(...B.s))}) = ${tp(ans)}.`); } },
    c: { t: 'tan(A ± B)', g: R => { if (R.bool(0.35)) return tanDeriv(R); if (R.bool(0.2)) return fmlaQ(R, 'tan');
      const op = R.pick(['+', '-']); let a, b, c, d; do { a = R.int(-6, 6); b = R.int(1, 5); c = R.int(-6, 6); d = R.int(1, 5); } while (!a || !c || gcd(a, b) > 1 || gcd(c, d) > 1 || (op === '+' ? b * d - a * c : b * d + a * c) === 0 || a * d === c * b);
      const N = op === '+' ? a * d + c * b : a * d - c * b, D = op === '+' ? b * d - a * c : b * d + a * c, ans = fr(N, D);
      return E.num(`${M(`tan A=${fr(a, b)}`)} and ${M(`tan B=${fr(c, d)}`)}. Find ${M(`tan(A${op}B)`)}.`, [X(ans, `tan(A ${op === '+' ? '+' : '−'} B) =`)],
        `tan(A ${op === '+' ? '+' : '−'} B) = ${fmlaTxt.tan[op]} = (${tp(fr(a, b))} ${op === '+' ? '+' : '−'} ${tp(fr(c, d)).replace(/^−/, '(−') + (c < 0 ? ')' : '')}) ÷ (1 ${op === '+' ? '−' : '+'} ${tp(fr(a * c, b * d)).replace(/^−/, '(−') + (a * c < 0 ? ')' : '')}) = ${tp(ans)}.`); } },
    d: { t: 'exact values like sin 15°', g: R => { const d = R.pick(F15), f = R.pick(['sin', 'cos', 'tan']), radn = R.bool(0.35), [A, B, op] = split15(d), ans = exact15(f, d);
      const angT = radn ? M(dPi(d)) : `${d}°`, sp = `${radn ? tp(dPi(A)) : A + '°'} ${op === '+' ? '+' : '−'} ${radn ? tp(dPi(B)) : B + '°'}`;
      const parts = f === 'tan' ? `(tan ${A}° ${op === '+' ? '+' : '−'} tan ${B}°)/(1 ${op === '+' ? '−' : '+'} tan ${A}° tan ${B}°) where tan ${A}° = ${tp(tvS('tan', A))} and tan ${B}° = ${tp(tvS('tan', B))}`
        : `${f === 'sin' ? `sin ${A}° cos ${B}° ${op === '+' ? '+' : '−'} cos ${A}° sin ${B}°` : `cos ${A}° cos ${B}° ${op === '+' ? '−' : '+'} sin ${A}° sin ${B}°`}`;
      return E.num(`Use a sum or difference formula to find the exact value of ${f} ${angT}.`, [X(ans, `${f} ${radn ? tp(dPi(d)) : d + '°'} =`)],
        `${radn ? `${tp(dPi(d))} = ${d}° = ` : `${d}° = `}${A}° ${op === '+' ? '+' : '−'} ${B}°${radn ? ` (${sp})` : ''}, so ${f} ${d}° = ${parts}${f === 'tan' ? '. This simplifies to' : ' ='} ${tp(ans)}.`); } },
    e: { t: 'spot the formula in reverse', g: R => { const kind = R.int(0, 2), T = R.pick([30, 45, 60, 120, 135, 150]); let a, b, op;
      do { op = R.pick(['+', '-']); b = R.int(5, 85); a = op === '+' ? T - b : T + b; } while (a <= 0 || a >= 180 || a === b || [a, b].some(x => x % 15 === 0) || (kind === 2 && (T === 90 || a === 90)));
      const o = op === '+' ? '-' : '+';
      if (kind === 0) { const ex = `sin(${a}°)cos(${b}°)${op}cos(${a}°)sin(${b}°)`, ans = tvS('sin', T);
        return E.num(`Find the exact value of ${M(ex)}.`, [X(ans, 'value =')], `This is sin(A ${op === '+' ? '+' : '−'} B) with A = ${a}°, B = ${b}°: sin ${T}° = ${tp(ans)}.`); }
      if (kind === 1) { const ex = `cos(${a}°)cos(${b}°)${o}sin(${a}°)sin(${b}°)`, ans = tvS('cos', T);
        return E.num(`Find the exact value of ${M(ex)}.`, [X(ans, 'value =')], `This is cos(A ${op === '+' ? '+' : '−'} B) with A = ${a}°, B = ${b}° (note the opposite sign in the middle): cos ${T}° = ${tp(ans)}.`); }
      const ex = `(tan(${a}°)${op}tan(${b}°))/(1${o}tan(${a}°)tan(${b}°))`, ans = tvS('tan', T);
      return E.num(`Find the exact value of ${M(ex)}.`, [X(ans, 'value =')], `This is tan(A ${op === '+' ? '+' : '−'} B) with A = ${a}°, B = ${b}°: tan ${T}° = ${tp(ans)}.`); } },
    f: { t: 'hidden angle sums', g: R => { const k = R.int(0, 3);
      if (k === 0) { const n = R.int(2, 9), big = R.bool(), A = big ? [n, 1] : [1, n], B = big ? [n + 1, n - 1] : [n - 1, n + 1], ans = big ? 135 : 45, [p, q] = R.shuffle([A, B]);
        return E.num(`Acute angles A and B have ${M(`tan A=${fr(...p)}`)} and ${M(`tan B=${fr(...q)}`)}. Find A + B in degrees.`, [{ label: 'A + B =', ans }],
          `tan(A + B) = (${tp(fr(...p))} + ${tp(fr(...q))}) ÷ (1 − ${tp(fr(p[0] * q[0], p[1] * q[1]))}) = ${big ? '−1' : '1'}. A + B is between 0° and 180°, so A + B = ${ans}°.`); }
      if (k === 1) { const s = R.pick([45, 225]), a = R.int(1, 44), b = s - a;
        return E.num(`Find the exact value of ${M(`(1+tan(${a}°))(1+tan(${b}°))`)}.`, [{ label: 'value =', ans: 2 }],
          `${a}° + ${b}° = ${s}°, and tan ${s}° = 1, so (tan ${a}° + tan ${b}°)/(1 − tan ${a}° tan ${b}°) = 1, giving tan ${a}° + tan ${b}° + tan ${a}° tan ${b}° = 1. Then (1 + tan ${a}°)(1 + tan ${b}°) = 1 + 1 = 2.`); }
      if (k === 2) { const lo = R.pick([1, 2, 3, 4, 5]), hi = 45 - lo, n = (hi - lo + 1) / 2;
        return E.num(`The product ${M(`(1+tan(${lo}°))(1+tan(${lo + 1}°))`)} ⋯ ${M(`(1+tan(${hi}°))`)} equals ${M('2^n')}. Find n.`, [{ label: 'n =', ans: n }],
          `Pair the factors whose angles add to 45°: (1 + tan a°)(1 + tan(45 − a)°) = 2. From ${lo}° to ${hi}° there are ${hi - lo + 1} factors, making ${n} pairs, so the product is 2^${n} and n = ${n}.`); }
      let a, b; do { a = R.int(1, 6); b = R.int(1, 6); } while (a * b <= 1 || a === b && R.bool(0.7)); const ans = fr(a + b, a * b - 1);
      return E.num(`In triangle ABC, ${M(`tan A=${a}`)} and ${M(`tan B=${b}`)}. Find tan C exactly.`, [X(ans, 'tan C =')],
        `C = 180° − (A + B), so tan C = −tan(A + B) = −(${a} + ${b})/(1 − ${a * b}) = ${tp(ans)}.`); } },
  });

  /* ================= V.10.06 Double-angle formulas ================= */
  const fromRatio = R => { const { p, q } = ratioPair(R), qd = R.int(0, 3), [sc, ss] = qSigns(qd), givS = R.bool(), m = q * q - p * p, [k, r] = E.surd(1, m);
    return givS ? { gn: 'sin', given: fr(ss * p, q), sNum: [ss * p, 1], cNum: [sc * k, r], q, qd } : { gn: 'cos', given: fr(sc * p, q), cNum: [sc * p, 1], sNum: [ss * k, r], q, qd }; };
  S('V.10.06', 'Double-angle formulas', {
    a: { t: 'sin 2A', g: R => { const v = R.pick(['A', 'θ', 'x']);
      if (R.bool(0.25)) { const n = R.pick([1, 2, 3, 4, 5]), a2 = co(2 * n), a1 = co(n), w = n === 1 ? v : `${n}${v}`;
        return E.choice(R, `Which expression equals ${M(`sin ${a2}${v}`)}?`, M(`2sin ${w} cos ${w}`), [M(`2sin ${w}`), M(`sin ${w} cos ${w}`), M(`sin^2 ${w}-cos^2 ${w}`)], `sin 2u = 2 sin u cos u with u = ${w}. It is not 2 sin ${w}.`); }
      const [a, b, c] = R.pick(TRIP), sw = R.bool(), qd = R.int(0, 3), [sc, ss] = qSigns(qd), s = ss * (sw ? a : b), cc = sc * (sw ? b : a), givS = R.bool(), ans = fr(2 * s * cc, c * c);
      return E.num(`${M(`${givS ? 'sin' : 'cos'} ${v}=${fr(givS ? s : cc, c)}`)} and ${v} is in ${QN[qd]}. Find ${M(`sin 2${v}`)}.`, [X(ans, `sin 2${v} =`)],
        `${givS ? 'cos' : 'sin'} ${v} = ${tp(fr(givS ? cc : s, c))} (${givS ? 'cos' : 'sin'} is ${(givS ? cc : s) > 0 ? 'positive' : 'negative'} in ${QN[qd]}). sin 2${v} = 2 sin ${v} cos ${v} = 2(${tp(fr(s, c))})(${tp(fr(cc, c))}) = ${tp(ans)}.`); } },
    b: { t: 'three forms of cos 2A', g: R => { const v = R.pick(['A', 'θ', 'x']);
      if (R.bool(0.35)) { const cf = R.bool(), kind = R.int(0, 2), P = `1-${cf ? 'cos' : 'sin'}^2 ${v}`, tgt = cf ? `2cos^2 ${v}-1` : `1-2sin^2 ${v}`;
        const ex = [`cos 2${v}=cos^2 ${v}-sin^2 ${v}`, cf ? `=cos^2 ${v}-(1-cos^2 ${v})` : `=(1-sin^2 ${v})-sin^2 ${v}`, `=${tgt}`];
        const RS = [`the sum formula cos(A + B) with both angles ${v}`, cf ? `Pythagorean identity: sin²${v} = 1 − cos²${v}` : `Pythagorean identity: cos²${v} = 1 − sin²${v}`, 'collect like terms'];
        const show = e => e[0] === '=' ? `= ${M(e.slice(1))}` : M(e), head = `Show that ${M(`cos 2${v}=${tgt}`)}.`;
        const flow = `Start from cos 2${v} = cos²${v} − sin²${v}, replace ${cf ? 'sin²' : 'cos²'}${v} with ${tp(P)}, and collect terms.`;
        if (kind === 0) { const k = R.int(0, 2), WR = ['the double-angle formula sin 2A = 2 sin A cos A', 'reciprocal identity', 'quotient identity', 'difference of squares'];
          return E.choice(R, `${head} What is the reason for step ${k + 1}?${twoCol(ex.map((e, i) => [show(e), RS[i]]), k)}`, RS[k], R.sample(WR.concat(RS.filter(r => r !== RS[k])), 3), `${flow} Step ${k + 1}: ${RS[k]}.`); }
        if (kind === 1) { const wr = cf ? [`=cos^2 ${v}-(1+cos^2 ${v})`, `=cos^2 ${v}-(cos^2 ${v}-1)`, `=cos^2 ${v}-(1-sin^2 ${v})`] : [`=(1+sin^2 ${v})-sin^2 ${v}`, `=(sin^2 ${v}-1)-sin^2 ${v}`, `=(1-cos^2 ${v})-sin^2 ${v}`];
          return E.choice(R, `${head} Which line belongs in the blank step?${stepTbl(ex.map(show), 1)}`, show(ex[1]), wr.map(show), `${flow} So step 2 is ${tp(ex[1].slice(1))}.`); }
        const b = R.int(0, 2), bad = [`cos 2${v}=cos^2 ${v}+sin^2 ${v}`, cf ? `=cos^2 ${v}-(cos^2 ${v}-1)` : `=(sin^2 ${v}-1)-sin^2 ${v}`, cf ? `=2cos^2 ${v}+1` : `=1-sin^2 ${v}`];
        const why = [`Step 1 is wrong: cos 2${v} = cos²${v} − sin²${v}. (cos²${v} + sin²${v} is just 1.)`, `Step 2 is wrong: ${cf ? `sin²${v} = 1 − cos²${v}` : `cos²${v} = 1 − sin²${v}`}, not ${cf ? `cos²${v} − 1` : `sin²${v} − 1`}.`,
          `Step 3 is wrong: ${tp(ex[1].slice(1))} = ${tp(tgt)} after collecting like terms.`][b];
        return E.choiceFixed(`A student shows that ${M(`cos 2${v}=${tgt}`)}. Exactly one step is wrong. Which one?${stepTbl(ex.map((e, i) => show(i === b ? bad[b] : e)))}`, ['Step 1', 'Step 2', 'Step 3'], b, why); }
      if (R.bool(0.3)) { const n = R.pick([1, 1, 2, 3]), w = n === 1 ? v : `${n}${v}`, good = [`cos^2 ${w}-sin^2 ${w}`, `2cos^2 ${w}-1`, `1-2sin^2 ${w}`], bad = R.pick([`2sin^2 ${w}-1`, `1-2cos^2 ${w}`, `cos^2 ${w}+sin^2 ${w}`, `2cos ${w}`]);
        return E.choice(R, `Which expression is NOT equal to ${M(`cos ${co(2 * n)}${v}`)}?`, M(bad), good.map(M), `The three forms are cos² − sin², 2cos² − 1 and 1 − 2sin² (of ${w}). ${tp(bad)} is not one of them.`); }
      let p, q; do { q = R.int(2, 9); p = R.int(1, q - 1); } while (gcd(p, q) > 1); const s = R.pick([1, -1]), givS = R.bool(), ans = givS ? fr(q * q - 2 * p * p, q * q) : fr(2 * p * p - q * q, q * q);
      return E.num(`${M(`${givS ? 'sin' : 'cos'} ${v}=${fr(s * p, q)}`)}. Find ${M(`cos 2${v}`)} exactly.`, [X(ans, `cos 2${v} =`)],
        `Use the form with ${givS ? 'sin' : 'cos'} only: cos 2${v} = ${givS ? `1 − 2sin²${v} = 1 − 2(${tp(fr(p * p, q * q))})` : `2cos²${v} − 1 = 2(${tp(fr(p * p, q * q))}) − 1`} = ${tp(ans)}. No need to know the quadrant.`); } },
    c: { t: 'tan 2A', g: R => { const v = R.pick(['A', 'θ', 'x']);
      if (R.bool(0.4)) { const [a, b, c] = R.pick(TRIP), sw = R.bool(), qd = R.int(0, 3), [sc, ss] = qSigns(qd), s = ss * (sw ? a : b), cc = sc * (sw ? b : a), t = [s, cc], ans = fr(2 * s * cc, cc * cc - s * s);
        return E.num(`${M(`cos ${v}=${fr(cc, c)}`)} and ${v} is in ${QN[qd]}. Find ${M(`tan 2${v}`)}.`, [X(ans, `tan 2${v} =`)],
          `sin ${v} = ${tp(fr(s, c))}, so tan ${v} = ${tp(fr(s, cc))}. tan 2${v} = 2tan ${v}/(1 − tan²${v}) = ${tp(fr(2 * s, cc))} ÷ ${cc * cc - s * s < 0 ? `(${tp(fr(cc * cc - s * s, cc * cc))})` : tp(fr(cc * cc - s * s, cc * cc))} = ${tp(ans)}.`); }
      let p, q; do { p = R.int(-7, 7); q = R.int(1, 6); } while (!p || gcd(p, q) > 1 || Math.abs(p) === q); const ans = fr(2 * p * q, q * q - p * p);
      return E.num(`${M(`tan ${v}=${fr(p, q)}`)}. Find ${M(`tan 2${v}`)}.`, [X(ans, `tan 2${v} =`)], `tan 2${v} = 2tan ${v}/(1 − tan²${v}) = ${tp(fr(2 * p, q))} ÷ (1 − ${tp(fr(p * p, q * q))}) = ${tp(ans)}. It is not 2 tan ${v}.`); } },
    d: { t: 'evaluate from one ratio', g: R => { const v = R.pick(['A', 'θ', 'x']), ask = R.pick(['sin', 'cos', 'tan']);
      if (R.bool(0.3)) { let p, q; do { p = R.int(1, 8); q = R.int(1, 8); } while (gcd(p, q) > 1 || p === q); const qd = R.pick([0, 1, 2, 3]), [sc, ss] = qSigns(qd), t = fr(sc * ss * p, q), ps = sc * ss * p;
        const ans = ask === 'sin' ? fr(2 * ps * q, p * p + q * q) : ask === 'cos' ? fr(q * q - p * p, p * p + q * q) : fr(2 * ps * q, q * q - p * p);
        return E.num(`${M(`tan ${v}=${t}`)} and ${v} is in ${QN[qd]}. Find ${M(`${ask} 2${v}`)} exactly.`, [X(ans, `${ask} 2${v} =`)],
          `${ask === 'tan' ? `tan 2${v} = 2tan ${v}/(1 − tan²${v})` : ask === 'sin' ? `sin 2${v} = 2tan ${v}/(1 + tan²${v})` : `cos 2${v} = (1 − tan²${v})/(1 + tan²${v})`} = ${tp(ans)}. (Or draw the triangle with legs ${p} and ${q}.)`); }
      const T = fromRatio(R), q = T.q, q2 = q * q, s2 = [2 * T.sNum[0] * T.cNum[0], T.sNum[1] * T.cNum[1]], sq = n => n[0] * n[0] * n[1];
      const c2n = q2 - 2 * sq(T.sNum), ans = ask === 'sin' ? E.surdStr(0, s2[0], s2[1], q2) : ask === 'cos' ? fr(c2n, q2) : E.surdStr(0, s2[0], s2[1], c2n);
      if (ask === 'tan' && c2n === 0) return E.num(`${M(`${T.gn} ${v}=${T.given}`)} and ${v} is in ${QN[T.qd]}. Find ${M(`cos 2${v}`)} exactly.`, [X('0', `cos 2${v} =`)], `cos 2${v} = 1 − 2sin²${v} = 0.`);
      const other = T.gn === 'sin' ? E.surdStr(0, T.cNum[0], T.cNum[1], q) : E.surdStr(0, T.sNum[0], T.sNum[1], q);
      const chk = { sin: Math.sin, cos: Math.cos, tan: Math.tan }[ask](2 * Math.atan2(sq(T.sNum) ** 0.5 * Math.sign(T.sNum[0]), sq(T.cNum) ** 0.5 * Math.sign(T.cNum[0])));
      if (Math.abs(chk - val(ans)) > 1e-9) throw new Error('V.10.06.d mismatch');
      return E.num(`${M(`${T.gn} ${v}=${T.given}`)} and ${v} is in ${QN[T.qd]}. Find ${M(`${ask} 2${v}`)} exactly.`, [X(ans, `${ask} 2${v} =`)],
        `First ${T.gn === 'sin' ? 'cos' : 'sin'} ${v} = ${tp(other)} (its sign from ${QN[T.qd]}). Then ${ask === 'sin' ? `sin 2${v} = 2 sin ${v} cos ${v}` : ask === 'cos' ? `cos 2${v} = 1 − 2sin²${v}` : `tan 2${v} = sin 2${v}/cos 2${v}`} = ${tp(ans)}.`); } },
  });

  /* ================= V.10.07 Half-angle formulas ================= */
  S('V.10.07', 'Half-angle formulas', {
    a: { t: 'derive from cos 2A', g: R => { const k = R.int(0, 2), sn = R.bool();
      if (k === 0) { const right = sn ? '(1-cos A)/2' : '(1+cos A)/2';
        return E.choice(R, `Start from ${M(sn ? 'cos 2θ=1-2sin^2 θ' : 'cos 2θ=2cos^2 θ-1')} and put θ = A/2. Which formula do you get for ${M(sn ? 'sin^2(A/2)' : 'cos^2(A/2)')}?`, M(right), [sn ? '(1+cos A)/2' : '(1-cos A)/2', sn ? '1-cos A' : '1+cos A', sn ? '(1-cos(A/2))/2' : '(1+cos(A/2))/2'].map(M),
          `With θ = A/2, cos 2θ = cos A, so ${sn ? 'cos A = 1 − 2sin²(A/2) and sin²(A/2) = (1 − cos A)/2' : 'cos A = 2cos²(A/2) − 1 and cos²(A/2) = (1 + cos A)/2'}.`); }
      if (k === 1) { let p, q; do { q = R.int(2, 9); p = R.int(-q + 1, q - 1); } while (gcd(p, q) > 1 && p !== 0 || p === 0 && R.bool(0.8)); const ans = sn ? fr(q - p, 2 * q) : fr(q + p, 2 * q);
        return E.num(`${M(`cos A=${fr(p, q)}`)}. Find ${M(sn ? 'sin^2(A/2)' : 'cos^2(A/2)')} exactly.`, [X(ans, sn ? 'sin²(A/2) =' : 'cos²(A/2) =')],
          `${sn ? 'sin²(A/2) = (1 − cos A)/2' : 'cos²(A/2) = (1 + cos A)/2'} = (1 ${sn ? '−' : '+'} ${tp(fr(p, q)).replace(/^−/, '(−') + (p < 0 ? ')' : '')})/2 = ${tp(ans)}.`); }
      const L = sn ? [M('cos 2θ=1-2sin^2 θ'), M('2sin^2 θ=1-cos 2θ'), M('sin^2 θ=(1-cos 2θ)/2'), `${M('sin^2(A/2)=(1-cos A)/2')} <i>(put θ = A/2)</i>`, M('sin(A/2)=±sqrt((1-cos A)/2)')]
        : [M('cos 2θ=2cos^2 θ-1'), M('2cos^2 θ=1+cos 2θ'), M('cos^2 θ=(1+cos 2θ)/2'), `${M('cos^2(A/2)=(1+cos A)/2')} <i>(put θ = A/2)</i>`, M('cos(A/2)=±sqrt((1+cos A)/2)')];
      return K.orderQ(R, `Put the steps of the derivation of the half-angle formula for ${sn ? 'sine' : 'cosine'} in order.`, L, [[], [0], [1], [2], [3]], 'Rearrange the double-angle formula, put θ = A/2, then take the square root.'); } },
    b: { t: 'choose the sign', g: R => { const want = R.bool(), radn = R.bool(0.3); let A, f, s, h;
      do { A = R.int(1, 71) * 10; f = R.pick(['sin', 'cos', 'tan']); h = A / 2; s = Math.sign(fv(f, h)); } while (A % 90 === 0 || mod(h, 90) === 0 || (s > 0) !== want);
      const q = Math.floor(mod(h, 360) / 90), AT = radn ? M(dPi(A)) : `${A}°`;
      return E.choiceFixed(`For A = ${AT}, is ${M(`${f}(A/2)`)} positive or negative?`, ['positive', 'negative'], want ? 0 : 1,
        `A/2 = ${radn ? tp(dPi(h)) + ' = ' : ''}${h}°, which is in ${QN[q]}, where ${f} is ${want ? 'positive' : 'negative'}. So take the ${want ? '+' : '−'} sign in the half-angle formula.`); } },
    c: { t: 'exact values', g: R => { const h = R.pick([15, 22.5, 67.5, 75, 105, 112.5, 157.5, 165, 195, 202.5, 247.5, 255, 285, 292.5, 337.5, 345]), f = R.pick(['sin', 'cos', 'tan']), A = 2 * h, v = fv(f, h);
      const cands = f === 'tan' ? ['2-sqrt(3)', '2+sqrt(3)', '-2+sqrt(3)', '-2-sqrt(3)', 'sqrt(2)-1', 'sqrt(2)+1', '1-sqrt(2)', '-1-sqrt(2)'] : ['sqrt(2-sqrt(3))/2', 'sqrt(2+sqrt(3))/2', '-sqrt(2-sqrt(3))/2', '-sqrt(2+sqrt(3))/2', 'sqrt(2-sqrt(2))/2', 'sqrt(2+sqrt(2))/2', '-sqrt(2-sqrt(2))/2', '-sqrt(2+sqrt(2))/2'];
      const ans = cands.find(c => Math.abs(val(c) - v) < 1e-9); if (!ans) throw new Error('V.10.07.c ' + f + h);
      const cA = tvS('cos', A), sA = tvS('sin', A), q = Math.floor(h / 90), sg = v > 0 ? '+' : '−';
      const why = f === 'tan' ? `${h}° = ${A}°/2. tan(A/2) = (1 − cos A)/sin A = (1 − (${tp(cA)}))/(${tp(sA)}) = ${tp(ans)}.`
        : `${h}° = ${A}°/2, in ${QN[q]}, so take the ${sg} sign: ${f} ${h}° = ${sg}√((1 ${f === 'sin' ? '−' : '+'} cos ${A}°)/2) = ${sg}√((1 ${f === 'sin' ? '−' : '+'} (${tp(cA)}))/2) = ${tp(ans)}.`;
      return E.num(`Use a half-angle formula to find the exact value of ${f} ${h}°.`, [X(ans, `${f} ${h}° =`)], why); } },
    d: { t: 'power reduction', g: R => { const k = R.int(0, 3), n = R.pick([1, 1, 2, 3]), c = R.pick([1, 2, 4, 6, 8]), w = n === 1 ? 'x' : `${n}x`, w2 = `${2 * n}x`, w4 = `${4 * n}x`;
      if (k <= 1) { const sn = k === 0, a = fr(c, 2), b = fr(sn ? -c : c, 2);
        return E.num(`Write ${M(`${co(c)}${sn ? 'sin' : 'cos'}^2 ${w}`)} in the form ${M(`a+b cos ${w2}`)}. Find a and b.`, [X(a, 'a ='), X(b, 'b =')],
          `${sn ? 'sin²u = (1 − cos 2u)/2' : 'cos²u = (1 + cos 2u)/2'} with u = ${w}, so ${c === 1 ? '' : c}${sn ? 'sin' : 'cos'}²${w} = ${tp(a)} ${sn ? '−' : '+'} ${tp(fr(c, 2))} cos ${w2}.`); }
      if (k === 2) { const a = fr(c, 8), b = fr(-c, 8);
        return E.num(`Write ${M(`${co(c)}sin^2 ${w} cos^2 ${w}`)} in the form ${M(`a+b cos ${w4}`)}. Find a and b.`, [X(a, 'a ='), X(b, 'b =')],
          `sin ${w} cos ${w} = ½ sin ${w2}, so the product is ${tp(fr(c, 4))} sin²${w2} = ${tp(fr(c, 4))} · (1 − cos ${w4})/2 = ${tp(a)} − ${tp(fr(c, 8))} cos ${w4}.`); }
      const sn = R.bool(), a = fr(3 * c, 8), b = fr((sn ? -1 : 1) * c, 2), cc = fr(c, 8);
      return E.num(`Write ${M(`${co(c)}${sn ? 'sin' : 'cos'}^4 ${w}`)} in the form ${M(`a+b cos ${w2}+c cos ${w4}`)}. Find a, b and c.`, [X(a, 'a ='), X(b, 'b ='), X(cc, 'c =')],
        `${sn ? 'sin' : 'cos'}⁴u = ((1 ${sn ? '−' : '+'} cos 2u)/2)² = (1 ${sn ? '−' : '+'} 2cos 2u + cos²2u)/4, and cos²2u = (1 + cos 4u)/2. That gives 3/8 ${sn ? '−' : '+'} ½ cos 2u + ⅛ cos 4u; times ${c}: ${tp(a)}, ${tp(b)}, ${tp(cc)}.`); } },
  });

  /* ================= V.10.08 Harmonic form ================= */
  // [a, b, R, alpha(°)] with a = R cos α, b = R sin α
  const SPH = [['1', 'sqrt(3)', '2', 60], ['sqrt(3)', '1', '2', 30], ['1', '1', 'sqrt(2)', 45]];
  const harm = (R, special) => { if (special || R.bool(0.4)) { const [a, b, Rr, al] = R.pick(SPH), k = R.int(1, 4), mulS = s => k === 1 ? s : /^\d+$/.test(s) ? String(k * +s) : `${k}${s}`; return { a: mulS(a), b: mulS(b), R: mulS(Rr), al, sp: true }; }
    const [p, q, c] = R.pick(TRIP.slice(0, 4)), sw = R.bool(), a = sw ? q : p, b = sw ? p : q; return { a: String(a), b: String(b), R: String(c), al: Math.atan2(b, a) * 180 / PI, sp: false }; };
  const cfx = s => s === '1' ? '' : s;
  const sqP = s => /sqrt/.test(s) ? `(${tp(s)})` : tp(s);
  const alField = H => H.sp ? { label: 'α =', ans: H.al } : { label: 'α =', ans: +H.al.toFixed(1), dp: 1 };
  const FORMS = [['cos', '-', 'cos', 'sin', '+'], ['cos', '+', 'cos', 'sin', '-'], ['sin', '+', 'sin', 'cos', '+'], ['sin', '-', 'sin', 'cos', '-']];
  S('V.10.08', 'Harmonic form', {
    a: { t: 'R and α from a and b', g: R => { const H = harm(R), ex = `${cfx(H.a)}cos θ+${cfx(H.b)}sin θ`;
      return E.num(`Write ${M(ex)} as ${M('R cos(θ-α)')} with R > 0 and 0° < α < 90°. Find R exactly and α in degrees${H.sp ? '' : ' to 1 decimal place'}.`, [X(H.R, 'R ='), alField(H)],
        `R cos(θ − α) = R cos α cos θ + R sin α sin θ, so R cos α = ${tp(H.a)} and R sin α = ${tp(H.b)}. R = √(${sqP(H.a)}² + ${sqP(H.b)}²) = ${tp(H.R)} and tan α = ${tp(H.b)}/${sqP(H.a)}, so α = ${H.sp ? H.al : H.al.toFixed(1)}°.`); } },
    b: { t: 'a cos θ + b sin θ = R cos(θ − α)', g: R => { const H = harm(R), F = R.pick(FORMS), ex = `${cfx(H.a)}${F[2]} θ${F[4]}${cfx(H.b)}${F[3]} θ`, form = `R ${F[0]}(θ${F[1]}α)`;
      [0.3, 1.1, 2.5].forEach(t => { const T1 = { sin: Math.sin, cos: Math.cos }, l = val(H.a) * T1[F[2]](t) + (F[4] === '+' ? 1 : -1) * val(H.b) * T1[F[3]](t), r = val(H.R) * T1[F[0]](t + (F[1] === '+' ? 1 : -1) * rad(H.al)); if (Math.abs(l - r) > 1e-9) throw new Error('V.10.08.b form'); });
      return E.num(`Write ${M(ex)} in the form ${M(form)} with R > 0 and 0° < α < 90°. Find R exactly and α in degrees${H.sp ? '' : ' to 1 decimal place'}.`, [X(H.R, 'R ='), alField(H)],
        `Expand: ${tp(form)} = ${F[0] === 'cos' ? `R cos θ cos α ${F[1] === '-' ? '+' : '−'} R sin θ sin α` : `R sin θ cos α ${F[1] === '+' ? '+' : '−'} R cos θ sin α`}. Match: R cos α = ${tp(H.a)}, R sin α = ${tp(H.b)}, so R = ${tp(H.R)} and α = ${H.sp ? H.al : H.al.toFixed(1)}°.`); } },
    c: { t: 'maximum and minimum values', g: R => { const H = harm(R), k = R.int(0, 2), c = R.int(-9, 9), F = R.pick(FORMS), body = `${cfx(H.a)}${F[2]} θ${F[4]}${cfx(H.b)}${F[3]} θ`;
      if (k === 2 && !H.sp) { const Rn = +H.R, c2 = Rn + R.int(1, 6), num = R.int(1, 12), ex = `${num}/(${c2}+${body})`;
        return E.num(`Find the maximum value of ${M(ex)}.`, [X(fr(num, c2 - Rn), 'maximum =')], `The denominator is ${c2} + ${Rn} ${F[0]}(θ ${F[1] === '+' ? '+' : '−'} α), which runs from ${c2 - Rn} to ${c2 + Rn}. The fraction is largest when the denominator is smallest: ${num}/${c2 - Rn} = ${tp(fr(num, c2 - Rn))}.`); }
      const ex = c ? `${c}+${body}`.replace('+-', '-') : body;
      const Rk = H.R.includes('sqrt') ? [+(H.R.split('sqrt')[0] || 1), 2] : [+H.R, 1], max = E.surdStr(c, Rk[0], Rk[1], 1), min = E.surdStr(c, -Rk[0], Rk[1], 1);
      return E.num(`Find the maximum and minimum values of ${M(ex)}.`, [X(max, 'maximum ='), X(min, 'minimum =')],
        `${tp(body)} = ${tp(H.R)} ${F[0]}(θ ${F[1] === '+' ? '+' : '−'} α) with α ${H.sp ? '= ' + H.al : '≈ ' + H.al.toFixed(1)}°, which runs from −${tp(H.R)} to ${tp(H.R)}. So the maximum is ${tp(max)} and the minimum is ${tp(min)}.`); } },
    d: { t: 'solve equations with it', g: R => { let H, sa, sb, al, ratio, c, Rk, rs;
      do { H = harm(R, true); sa = R.pick([1, 1, -1]); sb = R.pick([1, 1, -1]); al = mod(Math.atan2(sb * val(H.b), sa * val(H.a)) * 180 / PI, 360); Rk = H.R.includes('sqrt') ? [+(H.R.split('sqrt')[0] || 1), 2] : [+H.R, 1];
        ratio = R.pick(['0', '1/2', '-1/2', 'sqrt(2)/2', '-sqrt(2)/2', 'sqrt(3)/2', '-sqrt(3)/2', '1', '-1']); const rv = val(ratio), cv = val(H.R) * rv;
        c = null; for (const cand of [String(Math.round(cv)), `${Math.round(cv / Math.SQRT2)}sqrt(2)`, `${Math.round(cv / Math.sqrt(3))}sqrt(3)`]) { const cc = cand.replace(/^1sqrt/, 'sqrt').replace(/^-1sqrt/, '-sqrt'); if (!/^-?0sqrt/.test(cc) && Math.abs(val(cc) - cv) < 1e-9) { c = cc; break; } }
      } while (c === null);
      const A = sa * val(H.a), B = sb * val(H.b), g = d => A * Math.cos(rad(d)) + B * Math.sin(rad(d)) - val(c), ds = gridSolve(g);
      const term = (s, k, f) => `${s < 0 ? '-' : '+'}${cfx(k)}${f} θ`, ex = (term(sa, H.a, 'cos') + term(sb, H.b, 'sin')).replace(/^\+/, '');
      const beta = Math.acos(Math.max(-1, Math.min(1, val(ratio)))) * 180 / PI;
      return E.num(`Solve ${M(`${ex}=${c}`)} for ${M('0°<=θ<360°')}. ${askSet(false)}`, [{ label: 'θ =', set: ansSet(ds, false) }],
        `Write the left side as ${tp(H.R)} cos(θ − ${nd(al)}°). Then cos(θ − ${nd(al)}°) = ${tp(ratio)}, so θ − ${nd(al)}° = ${beta === 0 || beta === 180 ? nd(beta) + '°' : `±${nd(beta)}°`} + 360°k, giving θ = ${degList(ds)}.`); } },
  });

  /* ================= V.10.09 Basic trig equations ================= */
  // an equation whose isolated form is f(x) = v
  const isoEq = (R, f, v) => { const x = val(v), m = /sqrt\((\d)\)/.exec(v);
    if (!m) { const n = Math.round(x * 2) === x * 2 && !Number.isInteger(x) ? 2 * R.int(1, 3) : R.int(2, 5), b = R.int(-9, 9), lhs = `${n}${f} x${b ? (b > 0 ? '+' : '') + b : ''}`, rhs = String(n * x + b);
      if (R.bool(0.35)) { const c = R.int(1, n - 1), a = n + c, b2 = R.int(-6, 6), r2 = n * x + b2; return { eq: `${a}${f} x${b2 ? (b2 > 0 ? '+' : '') + b2 : ''}=${co(c)}${f} x${r2 ? (r2 > 0 ? '+' : '') + r2 : ''}`, why: `Collect the ${f} terms: ${n} ${f} x = ${r2 - b2}, so ${f} x = ${tp(v)}.` }; }
      return { eq: `${lhs}=${rhs}`, why: `${b ? `${b > 0 ? 'Subtract' : 'Add'} ${Math.abs(b)}, then d` : 'D'}ivide by ${n}: ${f} x = ${tp(v)}.` }; }
    const r = +m[1], neg = x < 0, den = /\/(\d)/.test(v) ? +/\/(\d)/.exec(v)[1] : 1, s = den > 1 ? R.int(1, 2) : R.int(2, 3), A = den * s, rhs = `${s === 1 ? '' : s}sqrt(${r})`;
    return R.bool() ? { eq: `${A}${f} x${neg ? '+' : '-'}${rhs}=0`, why: `Move the surd across and divide by ${A}: ${f} x = ${tp(v)}.` } : { eq: `${A}${f} x=${neg ? '-' : ''}${rhs}`, why: `Divide by ${A}: ${f} x = ${tp(v)}.` }; };
  const pickFV = (R, opts = {}) => { const f = R.pick(opts.fs || ['sin', 'cos', 'tan']); let v; do v = R.pick(f === 'tan' ? TVAL : SVAL); while (opts.no0 && (v === '0' || v === '1' || v === '-1') && f !== 'tan' || opts.no0 && v === '0'); return [f, v]; };
  const QPAIR = { sin: [['I and II', 'III and IV'], [0, 1]], cos: [['I and IV', 'II and III']], tan: [['I and III', 'II and IV']] };
  S('V.10.09', 'Basic trig equations', {
    a: { t: 'isolate the function', g: R => { const [f, v] = pickFV(R), E1 = isoEq(R, f, v);
      return E.num(`Rearrange ${M(E1.eq)} to find the value of ${M(f + ' x')}. Give an exact answer.`, [X(v, `${f} x =`)], E1.why); } },
    b: { t: 'reference angle', g: R => { const f = R.pick(['sin', 'cos', 'tan']);
      if (R.bool(0.55)) { let x; do x = R.int(-95, 95) / 100 * (f === 'tan' ? R.pick([1, 3]) : 1); while (Math.abs(x) < 0.05 || [0.5, 1].includes(Math.abs(x))); const xs = String(+x.toFixed(2)), ax = Math.abs(+xs), ref = { sin: Math.asin, cos: Math.acos, tan: Math.atan }[f](ax) * 180 / PI;
        return E.num(`For ${M(`${f} x=${xs}`)}, find the reference angle in degrees, to 1 decimal place.`, [{ label: 'reference angle =', ans: +ref.toFixed(1), dp: 1 }],
          `Use the positive value: ${f}⁻¹(${+ax.toFixed(2)}) ≈ ${ref.toFixed(1)}°. The sign of ${xs} only decides which quadrants the solutions are in.`); }
      const [, v] = pickFV(R, { fs: [f], no0: true }), ref = refOf(solve1(f, v)[0]), radn = R.bool(0.4);
      return radn ? E.num(`For ${M(`${f} x=${v}`)}, find the reference angle in radians. Give an exact answer.`, [X(dPi(ref), 'reference angle =')], `${f} of the reference angle is |${tp(v)}| = ${tp(v.replace('-', ''))}, so it is ${tp(dPi(ref))} (${ref}°).`)
        : E.num(`For ${M(`${f} x=${v}`)}, find the reference angle in degrees.`, [{ label: 'reference angle =', ans: ref }], `${f} of the reference angle is |${tp(v)}| = ${tp(v.replace('-', ''))}, so it is ${ref}°.`); } },
    c: { t: 'all quadrants that fit', g: R => {
      if (R.bool(0.3)) { const f = R.pick(['sin', 'cos', 'tan']), pos = R.bool(); let x; do x = R.int(5, 95) / 100 * (f === 'tan' ? R.pick([1, 4]) : 1); while ([0.5].includes(x)); const xs = String(+(pos ? x : -x).toFixed(2));
        const opts = ['I and II', 'I and IV', 'II and III', 'III and IV', 'I and III', 'II and IV'], ans = { sin: pos ? 'I and II' : 'III and IV', cos: pos ? 'I and IV' : 'II and III', tan: pos ? 'I and III' : 'II and IV' }[f];
        return E.choiceFixed(`In which quadrants are the solutions of ${M(`${f} x=${xs}`)}?`, opts, opts.indexOf(ans), `${f} is ${pos ? 'positive' : 'negative'} in Quadrants ${ans}, so there is one solution in each.`); }
      const [f, v] = pickFV(R, { no0: true }), radn = R.bool(0.4), ds = solve1(f, v), E1 = isoEq(R, f, v), ref = refOf(ds[0]);
      const fig = f !== 'tan' && R.bool(0.6) ? { visual: ucLine(f, val(v), ds) } : {};
      return E.num(`Solve ${M(E1.eq)} for ${domTxt(radn)}. ${askSet(radn)}`, [{ label: 'x =', set: ansSet(ds, radn) }],
        `${E1.why} The reference angle is ${radn ? tp(dPi(ref)) : ref + '°'}, and ${f} is ${val(v) > 0 ? 'positive' : 'negative'} ${ds.length > 1 ? 'in two quadrants' : 'only on an axis'}: x = ${sols(ds, radn)}.`, fig); } },
    d: { t: 'check', g: R => { const [f, v] = pickFV(R, { no0: true, fs: ['sin', 'cos', 'tan'] }), ds = solve1(f, v), E1 = isoEq(R, f, v);
      if (R.bool(0.5) && ds.length === 2) { const i = R.int(0, 1), first = ds[i], other = ds[1 - i], pos = val(v) > 0, qs = { sin: pos ? 'I and II' : 'III and IV', cos: pos ? 'I and IV' : 'II and III', tan: pos ? 'I and III' : 'II and IV' }[f];
        return E.num(`One solution of ${M(E1.eq)} is x = ${first}°. Find the other solution with ${M('0°<=x<360°')}.`, [{ label: 'x =', ans: other }],
          `The reference angle is ${refOf(first)}°, and ${f} is ${pos ? 'positive' : 'negative'} in Quadrants ${qs}. The other solution is ${other}°.`); }
      const yes = R.bool(); let x;
      if (yes) x = R.pick(ds); else { const cand = [...new Set(ds.flatMap(d => [mod(180 - d, 360), mod(-d, 360), mod(d + 180, 360), mod(d + 90, 360)]))].filter(d => !ds.includes(d) && okAt(f, d) && Math.abs(fv(f, d) - val(v)) > 1e-9); x = R.pick(cand); }
      const radn = R.bool(0.4), xt = radn ? M(dPi(x)) : `${x}°`, fx = tvS(f, x);
      return E.tf(`Is x = ${xt} a solution of ${M(E1.eq)}?`, yes, `${E1.why} ${f} ${radn ? tp(dPi(x)) : x + '°'} = ${tp(fx)}, ${yes ? 'so yes, it checks.' : `not ${tp(v)}, so no.`}`, YN); } },
  });

  /* ================= V.10.10 Intervals & general solutions ================= */
  const genFam = (f, v) => { const ds = solve1(f, v); return f === 'tan' ? [`${dPi(ds[0])}+pik`] : ds.map(d => `${dPi(d)}+2pik`); };
  const famTxt = fs => fs.map(s => M('x=' + s.replace(/^0\+/, ''))).join(' or ');
  // solution set of f(x) op v on [lo, hi) (radians), as interval notation
  const ineqSet = (f, op, v, lo, hi, toS) => { const F = { sin: Math.sin, cos: Math.cos }[f], T = x => { const y = F(x); return op === '<' ? y < v - 1e-12 : op === '>' ? y > v + 1e-12 : op === '<=' ? y <= v + 1e-12 : y >= v - 1e-12; };
    const roots = []; for (let d = 0; d < 720; d += 15) { const x = rad(d) + lo; if (x < hi - 1e-9 && x > lo + 1e-9 && Math.abs(F(x) - v) < 1e-9) roots.push(x); }
    const b = [lo, ...roots, hi], segs = b.slice(0, -1).map((x, i) => T((x + b[i + 1]) / 2)), pts = b.slice(0, -1).map(T), out = []; let cur = null;
    for (let i = 0; i < segs.length; i++) {
      if (!segs[i] && pts[i] && !(i > 0 && segs[i - 1])) return null;          // an isolated point
      if (segs[i]) { if (cur && !pts[i]) { cur.hi = b[i]; cur.hc = false; out.push(cur); cur = null; } if (!cur) cur = { lo: b[i], lc: pts[i] }; }
      else if (cur) { cur.hi = b[i]; cur.hc = pts[i]; out.push(cur); cur = null; } }
    if (cur) { cur.hi = hi; cur.hc = false; out.push(cur); }
    if (!out.length || out.length === 1 && Math.abs(out[0].lo - lo) < 1e-9 && Math.abs(out[0].hi - hi) < 1e-9 && out[0].lc) return null;
    return out.map(I => `${I.lc ? '[' : '('}${toS(I.lo)},${toS(I.hi)}${I.hc ? ']' : ')'}`).join('U'); };
  const countSol = (f, v, a, b, ca, cb) => { const base = f === 'sin' ? [Math.asin(v), PI - Math.asin(v)] : f === 'cos' ? [Math.acos(v), -Math.acos(v)] : [Math.atan(v)], per = f === 'tan' ? PI : 2 * PI, out = [];
    if (f !== 'tan' && Math.abs(v) > 1) return []; for (const s of base) for (let k = -12; k <= 12; k++) { const x = s + k * per; if ((x > a + 1e-9 || ca && Math.abs(x - a) < 1e-9) && (x < b - 1e-9 || cb && Math.abs(x - b) < 1e-9) && !out.some(y => Math.abs(y - x) < 1e-9)) out.push(x); }
    return out.sort((x, y) => x - y); };
  S('V.10.10', 'Intervals & general solutions', {
    a: { t: 'solutions in [0, 2π)', g: R => { const [f, v] = pickFV(R), E1 = isoEq(R, f, v), ds = solve1(f, v);
      return E.num(`Solve ${M(E1.eq)} for ${M('0<=x<2pi')}. ${askSet(true)}`, [{ label: 'x =', set: ansSet(ds, true) }], `${E1.why} On one turn that gives x = ${radList(ds)}.`); } },
    b: { t: 'add 2πk or πk', g: R => { const [f, v] = pickFV(R, { no0: true }), ds = solve1(f, v);
      if (R.bool(0.55) && ds.length === 2 || f === 'tan' && R.bool(0.5)) { const fam = genFam(f, v), right = famTxt(fam);
        const wrong = f === 'tan' ? [famTxt([`${dPi(ds[0])}+2pik`]), famTxt([`${dPi(ds[0])}+pik/2`]), famTxt([`${dPi(ds[0])}+2pik`, `${dPi(mod(ds[0] + 90, 360))}+2pik`])]
          : [famTxt([`${dPi(ds[0])}+2pik`]), famTxt(ds.map(d => `${dPi(d)}+pik`)), famTxt([`${dPi(ds[0])}+pik`])];
        return E.choice(R, `Which describes every solution of ${M(`${f} x=${v}`)}? (k is any integer.)`, right, wrong,
          f === 'tan' ? `tan repeats every π, so one family covers everything: x = ${tp(dPi(ds[0]))} + πk.` : `Find both solutions in one turn, ${radList(ds)}, then add 2πk to each. Adding πk would include angles where ${f} x = ${tp(v.startsWith('-') ? v.slice(1) : '-' + v)}.`); }
      const lo = R.pick([-1, 1, 2]), dsr = ds.map(d => d + 360 * lo).sort((a, b) => a - b), L = `${lo < 0 ? '-' : ''}${Math.abs(2 * lo) === 2 ? '' : Math.abs(2 * lo)}pi`, H = lo + 1 === 0 ? '0' : `${2 * (lo + 1) === 2 ? '' : 2 * (lo + 1)}pi`;
      return E.num(`Find every solution of ${M(`${f} x=${v}`)} with ${M(`${L}<=x<${H}`)}. ${askSet(true)}`, [{ label: 'x =', set: dsr.map(dPi) }],
        `In [0, 2π) the solutions are ${radList(ds)}. ${lo < 0 ? 'Subtract' : 'Add'} ${Math.abs(lo) === 1 ? '2π' : Math.abs(2 * lo) + 'π'} to each: ${radList(dsr)}.`); } },
    c: { t: 'trig inequalities on an interval', g: R => { let f, op, v, ans, degs; degs = R.bool(0.3);
      do { f = R.pick(['sin', 'cos']); op = R.pick(['<', '>', '<=', '>=']); v = R.pick(SVAL); ans = ineqSet(f, op, val(v), 0, 2 * PI, x => degs ? nd(x * 180 / PI) : (Math.abs(x) < 1e-12 ? '0' : piS(...toPi(x)))); } while (!ans);
      const opM = { '<': '<', '>': '>', '<=': '<=', '>=': '>=' }[op], dom = degs ? M('0°<=x<360°') : M('0<=x<2pi');
      return E.num(`Solve ${M(`${f} x${opM}${v}`)} for ${dom}. Give the answer in interval notation${degs ? ', in degrees' : ', with exact endpoints'}.`, [{ label: 'x ∈', interval: ans }],
        `The graph of ${f} x is ${op[0] === '<' ? 'below' : 'above'} the line y = ${tp(v)} ${op.length > 1 ? '(or on it) ' : ''}there: ${tp(ans.replace(/U/g, ' ∪ '))}.`, { visual: trigGraph(f === 'sin' ? Math.sin : Math.cos, val(v), { label: `graph of y = ${f} x and y = ${tp(v)}`, deg: degs }) }); } },
    d: { t: 'count solutions', g: R => { const f = R.pick(['sin', 'cos', 'tan']); let v, vs;
      if (R.bool(0.5)) { vs = R.pick(f === 'tan' ? TVAL : SVAL); v = val(vs); } else { const x = R.int(-12, 12) / 10 * (f === 'tan' ? 3 : 1); v = x; vs = String(x); }
      const a = R.pick([0, 0, -1, -2]) * PI, b = a + R.pick([2, 3, 4, 5, 6]) * PI, ca = R.bool(0.75), cb = R.bool(0.4), xs = countSol(f, v, a, b, ca, cb);
      const S2 = x => Math.abs(x) < 1e-12 ? '0' : piS(...toPi(x)), iv = `${ca ? '[' : '('}${tp(S2(a))}, ${tp(S2(b))}${cb ? ']' : ')'}`;
      const nice = xs.every(x => toPi(x, 12)), lst = nice ? xs.map(x => tp(S2(x))).join(', ') : xs.map(x => x.toFixed(2)).join(', ');
      return E.num(`How many solutions does ${M(`${f} x=${vs}`)} have on the interval ${iv}?`, [{ label: 'number of solutions =', ans: xs.length }],
        xs.length ? `The solutions there are ${lst}: ${xs.length} in all.` : `${f} x is never ${vs} (it stays between −1 and 1), so there are 0.`); } },
  });

  /* ================= V.10.11 Equations by factoring & identities ================= */
  const RAT = [[0, 1], [1, 2], [-1, 2], [1, 1], [-1, 1]];
  const BIG = [[2, 1], [-2, 1], [3, 1], [-3, 1], [3, 2], [-3, 2], [5, 2], [4, 1]];
  const quadFrom = ([p1, q1], [p2, q2]) => { let A = q1 * q2, B = -(q1 * p2 + q2 * p1), Cc = p1 * p2; const g = gcd(gcd(A, B), Cc) || 1; return [A / g, B / g, Cc / g]; };
  const polyF = (cs, u) => polyU([[cs[0], 2], [cs[1], 1], [cs[2], 0]], u);
  const radPick = R => R.bool(0.45);
  S('V.10.11', 'Equations by factoring & identities', {
    a: { t: 'quadratic in sin or cos', g: R => { const u = R.pick(['sin x', 'cos x']); let r1, r2; do { [r1, r2] = R.sample(RAT, 2); } while (false);
      const cs = quadFrom(r1, r2), ex = polyF(cs, u), vals = [fr(...r1), fr(...r2)];
      return E.num(`Treat ${M(`${ex}=0`)} as a quadratic in ${M(u)}. What values can ${M(u)} take?`, [{ label: `${u} =`, set: vals }],
        `Let u = ${tp(u)}: ${tp(polyF(cs, 'u'))} = 0 factors as ${[lin(r1[1], 'u', -r1[0]), lin(r2[1], 'u', -r2[0])].sort((a, b) => (a === 'u' ? 0 : 1) - (b === 'u' ? 0 : 1)).map(t => t === 'u' ? 'u' : `(${tp(t)})`).join('')} = 0, so u = ${tp(vals[0])} or u = ${tp(vals[1])}.`); } },
    b: { t: 'factor', g: R => { const radn = radPick(R), [f, g] = R.pick([['sin', 'cos'], ['cos', 'sin'], ['sin', 'sin'], ['cos', 'cos'], ['tan', 'tan']]); const v = R.pick(g === 'tan' ? ['1', '-1', 'sqrt(3)', '-sqrt(3)'] : ['1/2', '-1/2', 'sqrt(3)/2', '-sqrt(3)/2', 'sqrt(2)/2', '-sqrt(2)/2']);
      const m = g === 'tan' ? 1 : 2, sign = v.startsWith('-') ? '+' : '-', mag = v.includes('sqrt') ? `sqrt(${v.match(/sqrt\((\d)\)/)[1]})` : '1', cm = mag === '1' ? '' : mag;
      const ex = f === g ? `${co(m)}${f}^2 x${sign}${cm}${f} x` : `${co(m)}${g} x ${f} x${sign}${cm}${f} x`, fac = `${f} x(${co(m)}${g} x${sign}${mag})`, cv = (sign === '+' ? 1 : -1) * val(mag);
      need(ex, fac, 'V.10.11.b');
      if (R.bool(0.35)) { const dF = gridSolve(d => okAt(f, d) ? fv(f, d) : NaN), dG = solve1(g, v), b = R.int(0, 3), flip = sign === '+' ? '-' : '+';
        const wF = [{ sin: 0, cos: 90, tan: 0 }[f]], wG = dG.map(d => mod(g === 'sin' ? -d : 180 - d, 360)).sort((p, q) => p - q);
        const rows = [`Factor: ${M(`${b === 0 ? `${f} x(${co(m)}${g} x${flip}${mag})` : fac}=0`)}`, `${M(`${f} x=0`)} or ${M(`${g} x=${b === 1 ? negS(v) : v}`)}`,
          `${M(`${f} x=0`)} gives x = ${sols(b === 2 ? wF : dF, radn)}`, `${M(`${g} x=${v}`)} gives x = ${sols(b === 3 ? wG : dG, radn)}`];
        const why = [`Step 1 is wrong: multiplying out ${tp(`${f} x(${co(m)}${g} x${flip}${mag})`)} does not give back the left side. The factor is ${tp(fac)}.`,
          `Step 2 is wrong: ${tp(`${co(m)}${g} x${sign}${mag}`)} = 0 gives ${g} x = ${tp(v)}, not ${tp(negS(v))}.`,
          `Step 3 is wrong: ${f} x = 0 at ${sols(dF, radn)} in this interval, not only at ${sols(wF, radn)}.`,
          `Step 4 is wrong: ${g} x = ${tp(v)} at ${sols(dG, radn)}, where ${g} is ${val(v) > 0 ? 'positive' : 'negative'}; ${sols(wG, radn)} give ${g} x = ${tp(negS(v))} instead.`][b];
        return E.choiceFixed(`A student solves ${M(`${ex}=0`)} for ${domTxt(radn)} by factoring. Exactly one step is wrong. Which one?${stepTbl(rows)}`, ['Step 1', 'Step 2', 'Step 3', 'Step 4'], b, why); }
      const G = d => fv(f, d) * (m * fv(g, d) + cv), ds = gridSolve(d => okAt(f, d) && okAt(g, d) ? G(d) : NaN);
      return E.num(`Solve ${M(`${ex}=0`)} for ${domTxt(radn)}. ${askSet(radn)}`, [{ label: 'x =', set: ansSet(ds, radn) }],
        `Factor, don't divide: ${tp(fac)} = 0. So ${f} x = 0 or ${g} x = ${tp(v)}, giving x = ${sols(ds, radn)}.`); } },
    c: { t: 'swap with an identity', g: R => { const radn = radPick(R), k = R.int(0, 2);
      if (k === 2) { const T = R.pick([['sec^2 x=tan x+1', 'tan', t => t + 1, ['0', '1']], ['sec^2 x=1-tan x', 'tan', t => 1 - t, ['0', '−1']], ['sec^2 x=2tan x', 'tan', t => 2 * t, ['1']],
          ['csc^2 x=cot x+1', 'cot', t => t + 1, ['0', '1']], ['csc^2 x=2cot x', 'cot', t => 2 * t, ['1']], ['csc^2 x=1-cot x', 'cot', t => 1 - t, ['0', '−1']]]), fn = T[1];
        const ds = gridSolve(d => okAt(fn, d) ? (fn === 'tan' ? fv('sec', d) ** 2 : fv('csc', d) ** 2) - T[2](fv(fn, d)) : NaN);
        return E.num(`Solve ${M(T[0])} for ${domTxt(radn)}. ${askSet(radn)}`, [{ label: 'x =', set: ansSet(ds, radn) }],
          `Replace ${fn === 'tan' ? 'sec²x with 1 + tan²x' : 'csc²x with 1 + cot²x'} to get a quadratic in ${fn} x, giving ${fn} x = ${T[3].join(' or ')}. So x = ${sols(ds, radn)}.`); }
      const s = k === 0 ? 'sin' : 'cos', o = s === 'sin' ? 'cos' : 'sin'; let r1, r2; do [r1, r2] = R.sample(RAT, 2); while (false);
      let [A, B, Cc] = quadFrom(r1, r2); if (R.bool(0.5)) { A = -A; B = -B; Cc = -Cc; }
      // A s² + B s + C = 0 with s² = 1 − o²:  −A o² + B s + (A + C) = 0
      const ex = `${polyU([[-A, 2]], `${o} x`)}${polyU([[B, 1], [A + Cc, 0]], `${s} x`).replace(/^(?=[^-])/, '+')}`.replace(/\+0$/, '').replace(/^\+/, '');
      const ds = gridSolve(d => -A * fv(o, d) ** 2 + B * fv(s, d) + A + Cc), vals = [fr(...r1), fr(...r2)];
      return E.num(`Solve ${M(`${ex}=0`)} for ${domTxt(radn)}. ${askSet(radn)}`, [{ label: 'x =', set: ansSet(ds, radn) }],
        `Replace ${o}²x with 1 − ${s}²x to get ${tp(polyF([A, B, Cc], s + ' x'))} = 0, so ${s} x = ${tp(vals[0])} or ${tp(vals[1])}. That gives x = ${sols(ds, radn)}.`); } },
    d: { t: 'reject impossible values', g: R => { const radn = radPick(R), u = R.pick(['sin', 'cos']), none = R.bool(0.15), r1 = none ? R.pick(BIG) : R.pick(RAT); let r2; do r2 = R.pick(BIG); while (r2[0] * r1[1] === r1[0] * r2[1]);
      const cs = quadFrom(r1, r2), ex = polyF(cs, `${u} x`), ds = gridSolve(d => cs[0] * fv(u, d) ** 2 + cs[1] * fv(u, d) + cs[2]), bad = [r1, r2].filter(r => Math.abs(r[0] / r[1]) > 1).map(r => tp(fr(...r)));
      return E.num(`Solve ${M(`${ex}=0`)} for ${domTxt(radn)}. ${askSet(radn)}`, [{ label: 'x =', set: ansSet(ds, radn) }],
        `It factors as (${tp(lin(r1[1], `${u} x`, -r1[0]))})(${tp(lin(r2[1], `${u} x`, -r2[0]))}) = 0. ${u} x = ${list(bad)} ${bad.length > 1 ? 'are' : 'is'} impossible, since ${u} stays between −1 and 1. ${ds.length ? `The rest gives x = ${sols(ds, radn)}.` : 'So there is no solution.'}`); } },
    e: { t: 'double angles and hidden factors', g: R => { const radn = radPick(R), k = R.int(0, 2);
      if (k === 0) { const f = R.pick(['sin', 'cos']), g = f === 'sin' ? 'cos' : 'sin', c = R.pick(['1', '-1', 'sqrt(2)', '-sqrt(2)', 'sqrt(3)', '-sqrt(3)']), ex = `sin 2x=${c === '1' ? '' : c === '-1' ? '-' : c}${f} x`;
        const ds = gridSolve(d => Math.sin(rad(2 * d)) - val(c) * fv(f, d));
        return E.num(`Solve ${M(ex)} for ${domTxt(radn)}. ${askSet(radn)}`, [{ label: 'x =', set: ansSet(ds, radn) }],
          `Write sin 2x = 2 sin x cos x and move everything to one side: ${f} x (2${g} x ${c.startsWith('-') ? '+' : '−'} ${tp(c.replace(/^-/, ''))}) = 0. Don't divide by ${f} x. So ${f} x = 0 or ${g} x = ${tp(c.includes('sqrt') ? c + '/2' : fr(val(c) * 2, 4))}: x = ${sols(ds, radn)}.`); }
      if (k === 1) { let r1, r2; do [r1, r2] = R.sample(RAT, 2); while (false); let [A, B, Cc] = quadFrom(r1, r2); if (A % 2) { A *= 2; B *= 2; Cc *= 2; }
        const kk = A / 2, ex = `${co(kk)}cos 2x${polyU([[B, 1], [Cc + kk, 0]], 'cos x').replace(/^(?=[^-])/, '+')}`.replace(/\+0$/, '');
        const ds = gridSolve(d => kk * Math.cos(rad(2 * d)) + B * Math.cos(rad(d)) + Cc + kk);
        return E.num(`Solve ${M(`${ex}=0`)} for ${domTxt(radn)}. ${askSet(radn)}`, [{ label: 'x =', set: ansSet(ds, radn) }],
          `Use cos 2x = 2cos²x − 1: ${tp(polyF([A, B, Cc], 'cos x'))} = 0, so cos x = ${tp(fr(...r1))} or ${tp(fr(...r2))}. That gives x = ${sols(ds, radn)}.`); }
      const c = R.pick(['2', '-2', 'sqrt(2)', '-sqrt(2)']), ex = `tan x=${c}sin x`, ds = gridSolve(d => okAt('tan', d) ? Math.tan(rad(d)) - val(c) * Math.sin(rad(d)) : NaN);
      return E.num(`Solve ${M(ex)} for ${domTxt(radn)}. ${askSet(radn)}`, [{ label: 'x =', set: ansSet(ds, radn) }],
        `tan x = sin x/cos x, so sin x/cos x ${c.startsWith('-') ? '+' : '−'} ${tp(c.replace(/^-/, ''))} sin x = 0, which factors as sin x (1/cos x ${c.startsWith('-') ? '+' : '−'} ${tp(c.replace(/^-/, ''))}) = 0. Don't divide by sin x: sin x = 0 or cos x = ${tp(vs([c.startsWith('-') ? -1 : 1, c.includes('sqrt') ? 2 : 2, c.includes('sqrt') ? 2 : 1]))}. So x = ${sols(ds, radn)}.`); } },
    f: { t: 'squaring, and the roots it invents', g: R => { const k = R.int(0, 3);
      if (k <= 1) { const T = R.pick([['sin x+cos x', (s, c) => s + c], ['sin x-cos x', (s, c) => s - c], ['cos x-sin x', (s, c) => c - s]]), c = R.pick(['1', '-1', 'sqrt(2)', '-sqrt(2)', '0']);
        const g = d => T[1](Math.sin(rad(d)), Math.cos(rad(d))) - val(c), ds = gridSolve(g), sq = gridSolve(d => (T[1](Math.sin(rad(d)), Math.cos(rad(d)))) ** 2 - val(c) ** 2), extra = sq.filter(d => !ds.includes(d));
        return E.num(`Find every solution of ${M(`${T[0]}=${c}`)} with ${M('0<=x<2pi')}. ${askSet(true)}`, [{ label: 'x =', set: ansSet(ds, true) }],
          `Squaring gives 1 ${T[0].includes('+') ? '+' : '−'} sin 2x = ${Math.round(val(c) ** 2)}, whose roots in [0, 2π) are ${radList(sq)}. Check each in the original: ${extra.length ? `${radList(extra)} ${extra.length > 1 ? 'fail' : 'fails'} (the sign is wrong), so ` : ''}x = ${radList(ds)}.`); }
      if (k === 2) { const c = R.pick(['sqrt(3)', '1', '-1', 'sqrt(3)/3', '-sqrt(3)']), g = d => okAt('sec', d) ? 1 / Math.cos(rad(d)) + Math.tan(rad(d)) - val(c) : NaN, ds = gridSolve(g);
        return E.num(`Find every solution of ${M(`sec x+tan x=${c}`)} with ${M('0<=x<2pi')}. ${askSet(true)}`, [{ label: 'x =', set: ansSet(ds, true) }],
          `sec x + tan x = (1 + sin x)/cos x. Squaring and using cos²x = 1 − sin²x gives (1 + sin x)/(1 − sin x) = ${tp(fr(Math.round(val(c) ** 2 * 3), 3))}, so sin x = ${tp(fr(Math.round(val(c) ** 2 * 3) - 3, Math.round(val(c) ** 2 * 3) + 3))}; check the signs (and that cos x ≠ 0) in the original: ${ds.length ? 'x = ' + radList(ds) : 'nothing survives, so there is no solution'}.`); }
      const kk = R.pick([[5, 8], [1, 2], [7, 8], [3, 4]]), g = d => Math.sin(rad(d)) ** 4 + Math.cos(rad(d)) ** 4 - kk[0] / kk[1], ds = gridSolve(g, 7.5), s2 = fr(2 * (kk[1] - kk[0]), kk[1]);
      return E.num(`Find every solution of ${M(`sin^4 x+cos^4 x=${fr(...kk)}`)} with ${M('0<=x<2pi')}. ${askSet(true)}`, [{ label: 'x =', set: ansSet(ds, true) }],
        `sin⁴x + cos⁴x = (sin²x + cos²x)² − 2sin²x cos²x = 1 − ½ sin²2x. So sin²2x = ${tp(s2)}, and 2x runs over [0, 4π): x = ${radList(ds)}.`); } },
  });

  /* ================= V.10.12 Multiple-angle equations ================= */
  // solutions of f(n x) = v with x in [0°, 360°·span), from the special solutions of f(u) = v
  const multiSol = (f, n, v, span = 1) => { const base = solve1(f, v), out = []; for (const b of base) for (let k = 0; k < n * span + 1; k++) { const x = (b + 360 * k) / n; if (x < 360 * span - 1e-9 && !out.some(y => Math.abs(y - x) < 1e-9)) out.push(x); } return out.sort((a, b) => a - b); };
  const multiExplain = (f, n, v, radn, ds) => `Let u = ${n}x. Since x runs over one turn, u runs over ${n} turns. Solve ${f} u = ${tp(v)} for u, add full turns until u passes ${n * 360}°, then divide by ${n}: x = ${sols(ds, radn)}.`;
  const NV = { 2: SVAL, 3: SVAL, 4: ['0', '1/2', '-1/2', 'sqrt(3)/2', '-sqrt(3)/2', '1', '-1'] };
  S('V.10.12', 'Multiple-angle equations', {
    a: { t: 'sin 2x = k', g: R => { const f = R.pick(['sin', 'sin', 'cos', 'cos', 'tan']), v = f === 'tan' ? R.pick(TVAL) : R.pick(SVAL.filter(s => s !== '1' && s !== '-1' || R.bool(0.3))), radn = R.bool(0.35), ds = multiSol(f, 2, v, 0.5);
      ds.forEach(d => { if (!okAt(f, 2 * d) || Math.abs(fv(f, 2 * d) - val(v)) > 1e-9) throw new Error('V.10.12.a'); });
      return E.num(`Solve ${M(`${f} 2x=${v}`)} for ${radn ? M('0<=x<pi') : M('0°<=x<180°')}. ${askSet(radn)}`, [{ label: 'x =', set: ansSet(ds, radn) }],
        `As x runs from 0 to ${radn ? 'π' : '180°'}, 2x runs over one full turn. ${f} u = ${tp(v)} gives u = ${sols(solve1(f, v), radn)}, and halving gives x = ${sols(ds, radn)}.`); } },
    b: { t: 'widen the interval first', g: R => { const n = R.int(2, 5);
      if (R.bool(0.45)) { const radn = R.bool(0.6), right = radn ? `[0, ${tp(piS(2 * n))})` : `[0°, ${360 * n}°)`, wr = radn ? [`[0, 2π)`, `[0, ${tp(piS(2, n))})`, `[0, ${tp(piS(4 * n))})`] : ['[0°, 360°)', `[0°, ${nd(360 / n)}°)`, `[0°, ${720 * n}°)`];
        return E.choice(R, `To solve ${M(`sin ${n}x=1/2`)} for ${radn ? M('0<=x<2pi') : M('0°<=x<360°')}, you let u = ${n}x. Over which interval must you find u?`, right, wr, `Multiply the interval by ${n}: u = ${n}x runs over ${right}, which is ${n} full turns.`); }
      const f = R.pick(['sin', 'cos']), m = R.int(2, 3), v = R.pick(SVAL), us = multiSol(f, 1, v, m);
      return E.num(`Let u = ${m}x. List every u with ${M(`${f} u=${v}`)} and ${M(`0<=u<${2 * m}pi`)}. ${askSet(true)}`, [{ label: 'u =', set: ansSet(us, true) }],
        `In one turn ${f} u = ${tp(v)} gives u = ${radList(solve1(f, v))}. Add 2π${m > 2 ? ' and 4π' : ''} to each: u = ${radList(us)}.`); } },
    c: { t: 'divide back', g: R => { const n = R.pick([2, 2, 3, 4]), f = R.pick(['sin', 'cos', 'tan']), v = R.pick(f === 'tan' ? (n === 4 ? ['0', 'sqrt(3)', '-sqrt(3)', 'sqrt(3)/3', '-sqrt(3)/3'] : TVAL) : NV[n]), radn = R.bool(0.5), ds = multiSol(f, n, v);
      ds.forEach(d => { if (!okAt(f, n * d) || Math.abs(fv(f, n * d) - val(v)) > 1e-9) throw new Error('V.10.12.c'); });
      return E.num(`Solve ${M(`${f} ${n}x=${v}`)} for ${domTxt(radn)}. ${askSet(radn)}`, [{ label: 'x =', set: ansSet(ds, radn) }], multiExplain(f, n, v, radn, ds).replace(`add full turns until u passes ${n * 360}°`, f === 'tan' ? `add multiples of 180° until u passes ${n * 360}°` : `add full turns until u passes ${n * 360}°`)); } },
    d: { t: 'check the count', g: R => { const n = R.int(2, 5), f = R.pick(['sin', 'cos']); let vs;
      if (R.bool(0.5)) vs = R.pick(SVAL); else { let x; do x = R.int(-9, 9) / 10; while (x === 0 || Math.abs(x) === 0.5); vs = String(x); }
      const v = val(vs), cb = R.bool(0.3), xs = countSol(f, v, 0, 2 * PI * n, true, cb).map(u => u / n), N = xs.length, iv = `[0, 2π${cb ? ']' : ')'}`;
      const vis = trigGraph(x => (f === 'sin' ? Math.sin : Math.cos)(n * x), v, { label: `graph of y = ${f} ${n}x and y = ${tp(vs)}` });
      if (R.bool(0.35)) { const yes = R.bool(), claim = yes ? N : R.pick([N / 2, N - 1, N + 1, 2, 2 * N].filter(c => c !== N && c >= 1 && Number.isInteger(c)));
        return E.tf(`A student says ${M(`${f} ${n}x=${vs}`)} has exactly ${claim} solution${claim === 1 ? '' : 's'} on ${iv}. Are they right?`, yes, `${n}x runs over ${n} turns, and the graph of y = ${f} ${n}x meets the line y = ${tp(vs)} ${N} time${N === 1 ? '' : 's'} there${yes ? ', so yes.' : `, not ${claim}.`}`, Object.assign({ visual: vis }, YN)); }
      return E.num(`How many solutions does ${M(`${f} ${n}x=${vs}`)} have on ${iv}?`, [{ label: 'number of solutions =', ans: N }],
        `u = ${n}x runs over ${n} full turns (u from 0 to ${2 * n}π). ${Math.abs(v) === 1 ? 'Each turn gives one solution' : 'Each turn gives two solutions'}${cb && N % 2 === 1 && Math.abs(v) !== 1 ? ', plus one at the closed endpoint' : ''}${cb && Math.abs(v) === 1 && N > n ? ', plus one at the closed endpoint' : ''}: ${N} in all.`, { visual: vis }); } },
  });
})(typeof window !== 'undefined' ? window : globalThis);
