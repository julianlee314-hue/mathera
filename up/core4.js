/* Mathera · Era IV–V question core (shared). Needs E3 (Era III core) loaded first: it reuses rng, builders, palette, V helpers.
   Works in the browser (window.E4 / window.E5) and in Node (globalThis).

   QUESTION FORMAT — same as Era III, plus these field kinds for kind 'num':
     {ans:number, dp?:n}                 decimal answer; with dp, any value that rounds the same to dp places is right
     {frac:[n,d], form?}                 fraction (as Era III)
     {exact:'2sqrt(3)', form?:'any'|'simplest'}      exact number: typed value must be exact (no decimals unless the target has them)
     {expr:'x^2-4x+1', form?:'any'|'expanded'|'factored'|'simplified'|'vertex'}   expression in variables
     {eqn:'y=2x+3', form?:'any'|'solved'}          an equation, right up to multiplying both sides by a constant
     {set:['2','-3'] | [] }              solution set in any order; [] = no solution; typed "2, −3" or "x = 2 or x = −3"
     {interval:'(-inf,3]U(5,inf)'}       interval notation; inequalities like "x ≤ 3 or x > 5" are accepted too
     {point:['2','-3']}                  an ordered pair
     {complex:'3-2i', form?:'any'|'standard'}   a complex number; 'standard' requires a + bi form
   Every value string is plain ASCII math: sqrt(3), 2pi/3, x^2, (x-1)(x+2), 3/4, -inf, 2+i.
   Pretty output for prompts: E4.mx('x^2-5x+6=0') → MathML. Feedback text: E4.show(f).
*/
(function (G) {
  const E3 = G.E3; if (!E3) throw new Error('core4 needs E3');
  const E4 = G.E4 = G.E4 || {};
  ['rng', 'num', 'choice', 'choiceFixed', 'tf', 'words', 'ordinal', 'plural', 'C', 'colorName', 'gcd', 'lcm', 'reduce', 'fmt', 'frac', 'fh', 'OPTS'].forEach(k => E4[k] = E3[k]);
  E4.skills = E4.skills || []; E4.byId = E4.byId || {};
  // text outside tags: hyphen-minus before a number becomes a real minus (−); ' - ' becomes ' − '
  const tidyText = h => String(h).split(/(<[^>]+>)/).map((seg, k) => k % 2 ? seg : seg.replace(/(^|[\s(\[=,:/;±×·+])-(?=[\d.(√πx-z])/g, '$1−').replace(/ - /g, ' − ')).join('');
  E4.tidy = function (q) {
    if (!q || typeof q !== 'object') return q;
    q.prompt = tidyText(q.prompt); q.explain = tidyText(q.explain);
    if (q.choices) q.choices = q.choices.map(c => c.trim().startsWith('<svg') ? c : tidyText(c));
    if (q.items) q.items = q.items.map(tidyText);
    return q;
  };
  E4.skill = function (def) {
    if (this.byId[def.id]) throw new Error('duplicate skill ' + def.id);
    for (const k of Object.keys(def.steps || {})) { const g = def.steps[k].g; if (g && !g.tidy) { const w = (R, O) => E4.tidy(g(R, O)); w.tidy = true; def.steps[k].g = w; } }
    this.skills.push(def); this.byId[def.id] = def; return def;
  };
  const C = E3.C, gcd = E3.gcd;
  /* ---------- ordering questions: put the steps (of a proof, a construction, a method) in order ----------
     E4.order(R, prompt, steps, explain, {alts, fixed, visual})
       steps: the items in a correct order (HTML/MathML strings)
       alts: other accepted orders, as arrays of indices into steps (e.g. two independent lines may swap)
       fixed: how many leading steps are shown already placed (e.g. 1 keeps "Given …" first) — they are not shuffled
     The question: {kind:'order', prompt, items (display order), ans: [display indices in a correct order], alts: [[…]], fixed} */
  E4.order = function (R, prompt, steps, explain, extra = {}) {
    const n = steps.length, fixed = extra.fixed || 0;
    let perm; do { perm = [...Array(fixed).keys(), ...R.shuffle([...Array(n).keys()].slice(fixed))]; } while (n - fixed > 1 && perm.every((p, i) => p === i));
    const items = perm.map(i => steps[i]), pos = i => perm.indexOf(i);
    const q = { kind: 'order', prompt, items, ans: [...Array(n).keys()].map(pos), explain, fixed };
    if (extra.alts) q.alts = extra.alts.map(a => a.map(pos));
    if (extra.visual) q.visual = extra.visual;
    return q;
  };
  E4.checkOrder = (q, seq) => Array.isArray(seq) && seq.length === q.items.length && [q.ans, ...(q.alts || [])].some(a => a.every((x, i) => x === seq[i]));

  /* =================== math engine =================== */
  const FUN = ['arcsin', 'arccos', 'arctan', 'sqrt', 'cbrt', 'sinh', 'cosh', 'tanh', 'sin', 'cos', 'tan', 'sec', 'csc', 'cot', 'exp', 'abs', 'ln', 'log'];
  const SUPD = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁻': '-' };
  function norm(raw) {
    let s = String(raw).trim();
    s = s.replace(/[−–—]/g, '-').replace(/[×·⋅∙]/g, '*').replace(/÷/g, '/').replace(/π/g, 'pi').replace(/∞/g, 'inf').replace(/√/g, 'sqrt').replace(/∛/g, 'cbrt')
      .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻]+/g, m => '^(' + [...m].map(c => SUPD[c]).join('') + ')').replace(/≤/g, '<=').replace(/≥/g, '>=').replace(/≠/g, '!=')
      .replace(/′/g, "'").replace(/\s*\^\s*/g, '^');
    s = s.replace(/□|\?\?/g, '§');                                            // a blank to fill in
    s = s.replace(/(^|[^\d.])(\d+) (\d+)\/(\d+)/g, '$1($2+$3/$4)');       // mixed numbers 1 3/4
    return s;
  }
  // parse → tree. opts.vars: allowed single-letter variables (others are errors); opts.complex: 'i' is the imaginary unit; opts.e: 'e' is Euler's number
  function parse(raw, opts = {}) {
    const s = norm(raw).replace(/\s+/g, '');
    if (!s || /[^0-9a-zA-Z.+\-*/^()|!_§]/.test(s)) return null;
    let i = 0;
    const peek = () => s[i];
    const isVar = c => /[a-zA-Z]/.test(c);
    function name() {
      for (const f of FUN) if (s.startsWith(f, i)) { i += f.length; return { fn: f }; }
      if (s.startsWith('pi', i)) { i += 2; return { c: 'pi' }; }
      if (s.startsWith('inf', i)) { i += 3; return { c: 'inf' }; }
      const c = s[i]; i++;
      if (c === 'e' && opts.e) return { c: 'e' };
      if (c === 'i' && opts.complex) return { c: 'i' };
      return { v: c };
    }
    function sum() { let n = term(); if (!n) return null; while (peek() === '+' || peek() === '-') { const op = s[i++]; const r = term(); if (!r) return null; n = { op, a: n, b: r }; } return n; }
    function term() {
      let n = unary(); if (!n) return null;
      for (;;) {
        const c = peek();
        if (c === '*' || c === '/') { i++; const r = unary(); if (!r) return null; n = { op: c, a: n, b: r }; }
        else if (c && (/[a-zA-Z(0-9.§]/.test(c) || (c === '|' && absOpen === 0))) { const r = power(); if (!r) return null; n = { op: '*', a: n, b: r, imp: true }; }
        else return n;
      }
    }
    function unary() { if (peek() === '-') { i++; const u = unary(); return u && { op: 'neg', a: u }; } if (peek() === '+') { i++; return unary(); } return power(); }
    function power() {
      let b = postfix(); if (!b) return null;
      if (peek() === '^') { i++; const e = unary(); if (!e) return null; return { op: '^', a: b, b: e }; }
      return b;
    }
    function postfix() { let a = atom(); if (!a) return null; while (peek() === '!') { i++; a = { op: '!', a }; } return a; }
    let absOpen = 0;
    function atom() {
      const c = peek();
      if (c === '(') { i++; const n = sum(); if (!n || s[i] !== ')') return null; i++; return { op: '()', a: n }; }
      if (c === '§') { i++; return { op: 'box' }; }
      if (c === '|') { i++; absOpen++; const n = sum(); absOpen--; if (!n || s[i] !== '|') return null; i++; return { op: 'fn', f: 'abs', a: n }; }
      const m = /^(\d+\.?\d*|\.\d+)/.exec(s.slice(i)); if (m) { i += m[0].length; return { op: 'n', v: parseFloat(m[0]), lit: m[0] }; }
      if (c && isVar(c)) {
        const nm = name();
        if (nm.fn) {
          let base = null;
          if (nm.fn === 'log') { const bm = /^_?(\d+)/.exec(s.slice(i)); if (bm && s[i + bm[0].length] === '(') { base = +bm[1]; i += bm[0].length; } }
          let pw = null; if (peek() === '^' && nm.fn !== 'sqrt') { i++; pw = postfix(); if (!pw) return null; }   // sin^2 x
          let arg;
          if (peek() === '(') { i++; arg = sum(); if (!arg || s[i] !== ')') return null; i++; }
          else if (nm.fn === 'sqrt' || nm.fn === 'cbrt') { arg = postfix(); if (arg && peek() === '^') { i++; const e = unary(); arg = { op: '^', a: arg, b: e }; } }
          else { arg = power(); while (arg && peek() && /[a-zA-Z0-9.]/.test(peek()) && !FUN.some(f => s.startsWith(f, i))) { const r = power(); if (!r) return null; arg = { op: '*', a: arg, b: r, imp: true }; } }
          if (!arg) return null;
          let node = { op: 'fn', f: nm.fn, a: arg, base };
          if (pw) node = { op: '^', a: node, b: pw, fnpow: true };
          return node;
        }
        if (nm.c) return { op: 'c', v: nm.c };
        if (opts.vars && !opts.vars.includes(nm.v)) return { op: 'v', v: nm.v, stray: true };
        return { op: 'v', v: nm.v };
      }
      return null;
    }
    const t = sum(); return t && i === s.length ? t : null;
  }
  // complex arithmetic on [re, im]
  const cx = (re, im = 0) => [re, im];
  const add = (a, b) => [a[0] + b[0], a[1] + b[1]], sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
  const mul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
  const div = (a, b) => { const d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; };
  const isReal = a => Math.abs(a[1]) < 1e-12;
  const fact = n => { if (n < 0 || !Number.isInteger(n) || n > 170) return NaN; let r = 1; for (let k = 2; k <= n; k++) r *= k; return r; };
  function powc(a, b) {
    if (isReal(b) && Number.isInteger(Math.round(b[0])) && Math.abs(b[0] - Math.round(b[0])) < 1e-12) {
      let n = Math.round(b[0]), r = cx(1), base = a; if (n < 0) { base = div(cx(1), a); n = -n; }
      if (n > 400) return isReal(a) ? cx(Math.pow(a[0], b[0])) : cx(NaN); for (let k = 0; k < n; k++) r = mul(r, base); return r;
    }
    if (isReal(a) && isReal(b)) { if (a[0] < 0) { const q = 1 / b[0]; if (Math.abs(q - Math.round(q)) < 1e-9 && Math.round(q) % 2 === 1) return cx(-Math.pow(-a[0], b[0])); return cx(NaN); } return cx(Math.pow(a[0], b[0])); }
    return cx(NaN);
  }
  const REALF = { sin: Math.sin, cos: Math.cos, tan: Math.tan, sec: x => 1 / Math.cos(x), csc: x => 1 / Math.sin(x), cot: x => 1 / Math.tan(x), arcsin: Math.asin, arccos: Math.acos, arctan: Math.atan,
    sinh: Math.sinh, cosh: Math.cosh, tanh: Math.tanh, exp: Math.exp, ln: x => x > 0 ? Math.log(x) : NaN, cbrt: Math.cbrt };
  function ev(t, env) {
    switch (t.op) {
      case 'n': return cx(t.v);
      case 'c': return t.v === 'pi' ? cx(Math.PI) : t.v === 'e' ? cx(Math.E) : t.v === 'i' ? cx(0, 1) : cx(Infinity);
      case 'v': { const v = env[t.v]; return v === undefined ? cx(NaN) : (Array.isArray(v) ? v : cx(v)); }
      case '()': return ev(t.a, env);
      case 'neg': { const a = ev(t.a, env); return [-a[0], -a[1]]; }
      case '+': return add(ev(t.a, env), ev(t.b, env));
      case '-': return sub(ev(t.a, env), ev(t.b, env));
      case '*': return mul(ev(t.a, env), ev(t.b, env));
      case '/': return div(ev(t.a, env), ev(t.b, env));
      case '^': return powc(ev(t.a, env), ev(t.b, env));
      case '!': { const a = ev(t.a, env); return isReal(a) ? cx(fact(Math.round(a[0]) === a[0] ? a[0] : NaN)) : cx(NaN); }
      case 'fn': {
        const a = ev(t.a, env);
        if (t.f === 'abs') return cx(Math.hypot(a[0], a[1]));
        if (t.f === 'sqrt') { if (!isReal(a)) return cx(NaN); return a[0] >= 0 ? cx(Math.sqrt(a[0])) : cx(0, Math.sqrt(-a[0])); }
        if (!isReal(a)) return cx(NaN);
        if (t.f === 'log') { const b = t.base || 10; return a[0] > 0 ? cx(Math.log(a[0]) / Math.log(b)) : cx(NaN); }
        return cx(REALF[t.f](a[0]));
      }
    }
    return cx(NaN);
  }
  const varsOf = (t, acc = new Set()) => { if (!t) return acc; if (t.op === 'v') acc.add(t.v); ['a', 'b'].forEach(k => t[k] && typeof t[k] === 'object' && varsOf(t[k], acc)); return acc; };
  const walk = (t, fn) => { if (!t || typeof t !== 'object') return; fn(t); walk(t.a, fn); walk(t.b, fn); };
  const hasStray = t => { let s = false; walk(t, n => { if (n.stray) s = true; }); return s; };
  const close = (x, y) => Math.abs(x - y) <= 1e-8 * Math.max(1, Math.abs(y));
  const cclose = (a, b) => close(a[0], b[0]) && close(a[1], b[1]);
  E4.parse = parse; E4.eval = (t, env = {}) => ev(t, env);
  // value of a constant expression string (complex allowed) → [re, im] or null
  E4.value = function (str, o = {}) { const t = parse(str, { e: true, complex: o.complex !== false, vars: [] }); if (!t || varsOf(t).size) return null; const v = ev(t, {}); return isFinite(v[0]) && isFinite(v[1]) ? v : (v[0] === Infinity || v[0] === -Infinity ? v : null); };
  E4.num = E3.num;

  /* ---------- equivalence of expressions by random evaluation ---------- */
  function sampler(vars, k) {
    let seed = 987654321 + k * 7919;
    const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
    const env = {};
    vars.forEach((v, j) => { const r = rnd(); const band = (k + j) % 3; env[v] = band === 0 ? 0.3 + r * 3 : band === 1 ? -3.3 + r * 3 : -2 + r * 4.1; env[v] = Math.round(env[v] * 1000) / 1000 + 0.0137; });
    return env;
  }
  function sameFn(A, B, vars, o = {}) {
    let ok = 0;
    for (let k = 0; k < 60 && ok < 8; k++) {
      const env = sampler(vars, k), y = ev(B, env);
      if (!isFinite(y[0]) || !isFinite(y[1]) || Math.abs(y[1]) > 1e-9 && !o.complex) continue;
      const x = ev(A, env);
      if (!isFinite(x[0]) || !isFinite(x[1])) return false;
      if (!cclose(x, y)) return false; ok++;
    }
    return ok >= 4;
  }
  E4.sameExpr = (a, b, vars) => { const A = parse(a, { e: true }), B = parse(b, { e: true }); return !!(A && B && sameFn(A, B, vars || [...new Set([...varsOf(A), ...varsOf(B)])])); };

  /* ---------- structural form checks ---------- */
  const isConst = t => varsOf(t).size === 0;
  const hasSumParen = t => { let h = false; walk(t, n => { if (n.op === '()' && (n.a.op === '+' || n.a.op === '-')) h = true; }); return h; };
  const topTerms = t => (t.op === '+' || t.op === '-') ? topTerms(t.a) + topTerms(t.b) : 1;
  const factorsOf = t => t.op === 'neg' ? factorsOf(t.a) : t.op === '*' ? [...factorsOf(t.a), ...factorsOf(t.b)] : [t];
  function isFactored(t) {
    if (t.op === '+' || t.op === '-') return false;
    const fs = factorsOf(t).filter(f => !isConst(f));
    const sumish = f => (f.op === '()' && (f.a.op === '+' || f.a.op === '-')) || (f.op === '^' && f.a.op === '()');
    return fs.some(sumish) && (fs.length >= 2 || fs.some(f => f.op === '^') || factorsOf(t).some(isConst));
  }
  // every non-constant factor is primitive, has no factor x left inside, and has no rational root (degree ≥ 2)
  function polyCoeffs(t, v) {            // integer coefficients of a one-variable polynomial of degree ≤ 6, or null
    const n = 7, ys = []; for (let x = 0; x < n; x++) { const y = ev(t, { [v]: x }); if (!isReal(y) || !isFinite(y[0])) return null; ys.push(y[0]); }
    // Newton forward differences → coefficients
    const d = [ys.slice()]; for (let k = 1; k < n; k++) d.push(d[k - 1].slice(1).map((y, i) => y - d[k - 1][i]));
    let co = new Array(n).fill(0), basis = [1];                                   // basis = x(x-1)…(x-k+1) as coefficient array
    for (let k = 0; k < n; k++) { const c = d[k][0] / fact(k); for (let j = 0; j < basis.length; j++) co[j] += c * basis[j]; const nb = new Array(basis.length + 1).fill(0); for (let j = 0; j < basis.length; j++) { nb[j + 1] += basis[j]; nb[j] -= k * basis[j]; } basis = nb; }
    co = co.map(c => Math.round(c * 1e6) / 1e6); if (co.some(c => Math.abs(c - Math.round(c)) > 1e-6)) return null;
    const chk = ev(t, { [v]: 11.5 })[0], val = co.reduce((s, c, j) => s + c * Math.pow(11.5, j), 0); if (!close(val, chk)) return null;
    co = co.map(Math.round); while (co.length > 1 && co[co.length - 1] === 0) co.pop(); return co;     // co[j] = coefficient of x^j
  }
  function factorsComplete(A) {
    const vs = [...varsOf(A)]; if (vs.length !== 1) return true; const v = vs[0];
    for (let f of factorsOf(A)) {
      if (f.op === '^') f = f.a; if (f.op === '()') f = f.a; if (isConst(f)) continue;
      const co = polyCoeffs(f, v); if (!co) continue; const deg = co.length - 1; if (deg < 1) continue;
      const g = co.reduce((a, c) => gcd(a, c), 0); if (g > 1) return false;                       // common number inside
      if (co[0] === 0 && co.some((c, j) => j > 0 && j < deg && c !== 0) || (co[0] === 0 && deg > 1 && co.filter(c => c).length > 1)) return false;   // common x inside
      if (deg >= 2 && co.filter(c => c).length > 1) {                                                // rational root test
        const a0 = Math.abs(co[0]), an = Math.abs(co[deg]); const divs = n => { const r = []; for (let k = 1; k <= n; k++) if (n % k === 0) r.push(k); return r; };
        if (a0 === 0) return false;
        for (const p of divs(a0)) for (const q of divs(an)) for (const sgn of [1, -1]) { const x = sgn * p / q; if (Math.abs(co.reduce((s, c, j) => s + c * Math.pow(x, j), 0)) < 1e-9) return false; }
        if (deg === 4) { /* x^4 factoring into two quadratics without rational roots is rare at this level; accept */ }
      }
    }
    return true;
  }
  const isMonomial = t => factorsOf(t).every(f => f.op === 'n' || f.op === 'v' || f.op === 'c' || (f.op === '^' && (f.a.op === 'v' || f.a.op === 'n') && isConst(f.b)));
  // greatest common factor taken out: every bracket left is primitive with no x common to all its terms
  function gcfTaken(A) {
    const vs = [...varsOf(A)]; if (vs.length !== 1) return true; const v = vs[0];
    for (let f of factorsOf(A)) { if (f.op === '^') f = f.a; if (f.op === '()') f = f.a; if (isConst(f) || (f.op !== '+' && f.op !== '-')) continue;
      const co = polyCoeffs(f, v); if (!co) continue; if (co.reduce((a, c) => gcd(a, c), 0) > 1) return false; if (co[0] === 0) return false; }
    return true;
  }
  // a(x - h)^2 + k  (the squared bracket may be alone, k optional)
  function isVertex(t) {
    const terms = []; (function split(n, sg) { if (n.op === '+') { split(n.a, sg); split(n.b, sg); } else if (n.op === '-') { split(n.a, sg); split(n.b, -sg); } else terms.push(n); })(t, 1);
    const withVar = terms.filter(n => !isConst(n)); if (withVar.length !== 1) return false;
    const fs = factorsOf(withVar[0]).filter(f => !isConst(f));
    return fs.length === 1 && fs[0].op === '^' && fs[0].a.op === '()' && isConst(fs[0].b) && Math.abs(ev(fs[0].b, {})[0] - 2) < 1e-12;
  }
  // exact-number simplest form: square-free integer radicands, no radical in a denominator, reduced integer fractions, no decimals
  function exactSimplest(t) {
    let ok = true;
    walk(t, n => {
      if (n.op === 'n' && /\./.test(n.lit)) ok = false;
      if (n.op === 'fn' && n.f === 'sqrt') {
        const a = n.a.op === '()' ? n.a.a : n.a;
        if (a.op !== 'n' || !Number.isInteger(a.v) || a.v < 2) { ok = false; return; }
        for (let k = 2; k * k <= a.v; k++) if (a.v % (k * k) === 0) ok = false;
      }
      if (n.op === 'fn' && n.f === 'cbrt') {
        const a = n.a.op === '()' ? n.a.a : n.a;
        if (a.op !== 'n' || !Number.isInteger(a.v) || a.v < 2) { ok = false; return; }
        for (let k = 2; k * k * k <= a.v; k++) if (a.v % (k * k * k) === 0) ok = false;
      }
      if (n.op === '/') {
        let hasRad = false; walk(n.b, m => { if (m.op === 'fn' && (m.f === 'sqrt' || m.f === 'cbrt')) hasRad = true; }); if (hasRad) ok = false;
        const num = n.a.op === '()' ? n.a.a : n.a, den = n.b.op === '()' ? n.b.a : n.b;
        if (den.op === 'n' && Number.isInteger(den.v)) {
          if (den.v === 1) ok = false;
          const coefs = []; (function co(m) { if (m.op === '+' || m.op === '-') { co(m.a); co(m.b); } else { const fs = factorsOf(m); const c = fs.filter(f => f.op === 'n'); coefs.push(c.length ? c.reduce((p, f) => p * f.v, 1) : 1); } })(num);
          if (coefs.every(Number.isInteger) && coefs.reduce((g, c) => gcd(g, c), 0) % 1 === 0 && gcd(coefs.reduce((g, c) => gcd(g, c), 0), den.v) > 1) ok = false;
        }
      }
      if (n.op === '^' && n.a.op === 'fn' && n.a.f === 'sqrt') ok = false;
    });
    return ok;
  }

  /* ---------- answer readers ---------- */
  const stripLead = s => String(s).trim().replace(/^[a-zA-Z](\([a-z]\))?\s*=\s*(?![=])/, '');
  const EMPTY = /^(no solutions?|none|no real solutions?|∅|\{\s*\}|empty( set)?|dne)$/i;
  function readValue(txt, complex) {
    let raw = stripLead(txt).trim(); if (/^[-−]?\d{1,3}(,\d{3})+(\.\d+)?$/.test(raw)) raw = raw.replace(/,/g, '');   // 12,500 as one number
    const t = parse(raw, { e: true, complex: !!complex, vars: [] });
    if (!t) return null; if (varsOf(t).size) return 'bad';
    const v = ev(t, {}); if (!isFinite(v[0]) || !isFinite(v[1])) return v[0] === Infinity || v[0] === -Infinity ? { v, t } : 'bad';
    return { v, t };
  }
  function splitList(raw) {
    let s = String(raw).trim().replace(/^\{|\}$/g, '').replace(/\s+(or|and)\s+/gi, ',').replace(/;/g, ',');
    // "x = 2, x = -3" / "2, -3"; protect commas inside brackets
    const out = []; let depth = 0, cur = '';
    for (const ch of s) { if (ch === '(' || ch === '[') depth++; if (ch === ')' || ch === ']') depth--; if (ch === ',' && depth === 0) { out.push(cur); cur = ''; } else cur += ch; }
    out.push(cur); return out.map(x => x.trim()).filter(Boolean);
  }
  // intervals: [{lo,hi,lc,hc}] with lo/hi numbers (±Infinity)
  function readIntervals(raw) {
    let s = norm(raw).replace(/\s+/g, ' ').trim();
    if (EMPTY.test(s)) return [];
    if (/^(all real numbers|all reals|r|ℝ|\(-inf,inf\)|\(-inf, inf\)|-inf<x<inf)$/i.test(s)) return [{ lo: -Infinity, hi: Infinity, lc: false, hc: false }];
    const parts = s.split(/\s*(?:U|∪|\bor\b)\s*/i).filter(Boolean), res = [];
    for (let p of parts) {
      p = p.trim(); let m;
      if (/^[\[(]/.test(p) && /[\])]$/.test(p)) {   // (a, b) with endpoints that may hold brackets themselves: (15, 10sqrt(3))
        const inner = p.slice(1, -1); let depth = 0, cut = -1;
        for (let k = 0; k < inner.length; k++) { const ch = inner[k]; if (ch === '(' || ch === '[') depth++; else if (ch === ')' || ch === ']') depth--; else if (ch === ',' && depth === 0) { if (cut >= 0) { cut = -2; break; } cut = k; } }
        if (cut >= 0) {
          const lo = readValue(inner.slice(0, cut)), hi = readValue(inner.slice(cut + 1)); if (!lo || !hi || lo === 'bad' || hi === 'bad') return null;
          res.push({ lo: lo.v[0], hi: hi.v[0], lc: p[0] === '[', hc: p[p.length - 1] === ']' });
          continue;
        }
      }
      // inequalities: x<3 · x>=-2 · -2<x<=3 · 3>x
      const q = p.replace(/\s+/g, '');
      if ((m = /^([^<>=]+?)(<=|<)([a-z])(<=|<)([^<>=]+)$/.exec(q))) { const a = readValue(m[1]), b = readValue(m[5]); if (!a || !b || a === 'bad' || b === 'bad') return null; res.push({ lo: a.v[0], hi: b.v[0], lc: m[2] === '<=', hc: m[4] === '<=' }); continue; }
      if ((m = /^([^<>=]+?)(>=|>)([a-z])(>=|>)([^<>=]+)$/.exec(q))) { const a = readValue(m[1]), b = readValue(m[5]); if (!a || !b || a === 'bad' || b === 'bad') return null; res.push({ lo: b.v[0], hi: a.v[0], lc: m[4] === '>=', hc: m[2] === '>=' }); continue; }
      if ((m = /^([a-z])(<=|<|>=|>)(.+)$/.exec(q)) || (m = /^(.+?)(<=|<|>=|>)([a-z])$/.exec(q))) {
        let [_, L, op, Rt] = m, flip = false; if (/^[a-z]$/.test(Rt) && !/^[a-z]$/.test(L)) { [L, Rt] = [Rt, L]; flip = true; }
        const v = readValue(Rt); if (!v || v === 'bad') return null; let o = op; if (flip) o = { '<': '>', '<=': '>=', '>': '<', '>=': '<=' }[op];
        res.push(o[0] === '<' ? { lo: -Infinity, hi: v.v[0], lc: false, hc: o === '<=' } : { lo: v.v[0], hi: Infinity, lc: o === '>=', hc: false }); continue;
      }
      return null;
    }
    return mergeIv(res);
  }
  function mergeIv(list) {
    const L = list.map(x => ({ ...x, lc: x.lo === -Infinity ? false : x.lc, hc: x.hi === Infinity ? false : x.hc })).sort((a, b) => a.lo - b.lo || (b.lc - a.lc));
    const out = [];
    for (const x of L) {
      const p = out[out.length - 1];
      if (p && (x.lo < p.hi || (close(x.lo, p.hi) && (p.hc || x.lc)))) { if (x.hi > p.hi || (close(x.hi, p.hi) && x.hc)) { p.hi = x.hi; p.hc = x.hc || (close(x.hi, p.hi) && p.hc); } }
      else out.push({ ...x });
    }
    return out;
  }
  const sameIv = (A, B) => A.length === B.length && A.every((a, k) => { const b = B[k]; const eqE = (u, v) => (u === v) || (isFinite(u) && isFinite(v) && close(u, v)); return eqE(a.lo, b.lo) && eqE(a.hi, b.hi) && a.lc === b.lc && a.hc === b.hc; });
  // equations: L = R → tree of L - R
  function readEqn(raw, vars) {
    const s = String(raw).replace(/==/g, '='); const parts = s.split('='); if (parts.length !== 2) return null;
    const L = parse(parts[0], { e: true }), R = parse(parts[1], { e: true }); if (!L || !R) return null;
    return { L, R, d: { op: '-', a: { op: '()', a: L }, b: { op: '()', a: R } } };
  }
  function sameEqn(A, B, vars) {
    let ratio = null, ok = 0;
    for (let k = 0; k < 60 && ok < 8; k++) {
      const env = sampler(vars, k + 11), y = ev(B.d, env)[0], x = ev(A.d, env)[0];
      if (!isFinite(y) || Math.abs(y) < 1e-6) continue; if (!isFinite(x)) return false;
      const r = x / y; if (Math.abs(r) < 1e-9) return false;
      if (ratio === null) ratio = r; else if (!close(r, ratio)) return false; ok++;
    }
    return ok >= 4;
  }

  /* ---------- check one field ---------- */
  // a trailing unit on a plain value is fine: 30°, 12.5 cm, 3√2 units, 40 cm², 2 rad
  const UNIT_TAIL = /\s*(°|º|degrees?|deg|radians?|rad|(sq\.?\s*|square\s+|cubic\s+)?(units?|mm|cm|km|m|in|inches|ft|feet|yd|mi|miles)(\^?[23]|²|³)?)\.?\s*$/i;
  E4.stripUnit = t => { const u = String(t).replace(UNIT_TAIL, ''); return u.trim() ? u : t; };
  E4.check = function (f, raw) {
    let txt = String(raw).trim(); if (!txt) return null;
    if (f.ans !== undefined || f.frac || f.exact !== undefined) txt = E4.stripUnit(txt).trim();
    if (f.ans !== undefined && f.dp !== undefined) {
      const r = readValue(txt); if (!r || r === 'bad' || !isReal(r.v)) return null;
      return Math.abs(r.v[0] - f.ans) <= 0.5 * Math.pow(10, -f.dp) + 1e-9 * Math.max(1, Math.abs(f.ans));
    }
    if (f.ans !== undefined || f.frac) return E3.check(f, txt);
    if (f.exact !== undefined) {
      const r = readValue(txt); if (!r) return null; if (r === 'bad') return false;
      const tv = E4.value(f.exact);
      if (/sqrt|cbrt|pi|log|ln|sin|cos|tan|e/.test(f.exact) && !/\d\.\d|(^|[^\d])\.\d/.test(f.exact) && /\d\.\d|(^|[^\d])\.\d/.test(norm(txt))) return false;    // a decimal can't be the exact value of an irrational
      if (!cclose(r.v, tv)) return false;
      if ((f.form || 'any') === 'simplest') return exactSimplest(r.t);
      return true;
    }
    if (f.expr !== undefined) {
      const B = parse(f.expr, { e: true }); const vb = [...varsOf(B)];
      let A = parse(stripLead(txt), { e: true, vars: vb.length ? vb : undefined });
      if (!A) return null; if (hasStray(A)) return false;
      if (!sameFn(A, B, vb)) return false;
      const form = f.form || 'any';
      while (A.op === '()') A = A.a;                                              // outer brackets don't change the form
      if (form === 'expanded') return !hasSumParen(A);
      if (form === 'factored') return isFactored(A);
      if (form === 'simplified') { let Bs = B; while (Bs.op === '()') Bs = Bs.a; return !hasSumParen(A) && topTerms(A) <= topTerms(Bs); }
      if (form === 'vertex') return isVertex(A);
      if (form === 'complete') return (isMonomial(A) || isFactored(A)) && factorsComplete(A);
      if (form === 'gcf') return isFactored(A) && gcfTaken(A);
      return true;
    }
    if (f.eqn !== undefined) {
      const B = readEqn(f.eqn); const vars = [...new Set([...varsOf(B.L), ...varsOf(B.R)])];
      const A = readEqn(txt, vars); if (!A) return /=/.test(txt) ? null : null;
      const va = new Set([...varsOf(A.L), ...varsOf(A.R)]); for (const v of va) if (!vars.includes(v)) return false;
      if (!sameEqn(A, B, vars)) return false;
      if ((f.form || 'any') === 'solved') { const want = B.L.op === 'v' ? B.L.v : 'y'; return A.L.op === 'v' && A.L.v === want && !varsOf(A.R).has(want); }
      return true;
    }
    if (f.set !== undefined) {
      if (EMPTY.test(txt)) return f.set.length === 0;
      const items = splitList(txt); if (!items.length) return null;
      const complex = f.set.some(x => /i/.test(x.replace(/pi|inf/g, '')));
      const got = []; for (const it of items) { const r = readValue(it, complex); if (!r) return null; if (r === 'bad') return false; got.push(r.v); }
      const want = f.set.map(x => E4.value(x));
      const uniq = arr => arr.filter((a, k) => arr.findIndex(b => cclose(a, b)) === k);
      const G2 = uniq(got), W2 = uniq(want);
      return G2.length === W2.length && W2.every(w => G2.some(g => cclose(g, w)));
    }
    if (f.interval !== undefined) {
      const A = readIntervals(txt); if (!A) return null;
      return sameIv(A, readIntervals(f.interval));
    }
    if (f.point !== undefined) {
      const m = /^\(?\s*(.+?)\s*[,;]\s*(.+?)\s*\)?$/.exec(txt.replace(/^\(|\)$/g, m => m)); if (!m) return null;
      const inner = txt.replace(/^\s*\(/, '').replace(/\)\s*$/, ''); const parts = splitList(inner); if (parts.length !== f.point.length) return parts.length ? false : null;
      for (let k = 0; k < parts.length; k++) { const r = readValue(parts[k]); if (!r) return null; if (r === 'bad' || !cclose(r.v, E4.value(f.point[k]))) return false; }
      return true;
    }
    if (f.complex !== undefined) {
      const t = parse(stripLead(txt), { e: true, complex: true, vars: [] }); if (!t) return null; if (varsOf(t).size) return false;
      const v = ev(t, {}); if (!cclose(v, E4.value(f.complex))) return false;
      if ((f.form || 'any') === 'standard') { let bad = false; walk(t, n => { if (n.op === '/' ) { let hi = false; walk(n.b, m => { if (m.op === 'c' && m.v === 'i') hi = true; }); if (hi) bad = true; } if (n.op === '^') { let hi = false; walk(n.a, m => { if (m.op === 'c' && m.v === 'i') hi = true; }); if (hi) bad = true; } if (n.op === '()') bad = bad || false; }); let prodI = 0; walk(t, n => { if (n.op === '*' && [n.a, n.b].every(z => { let h = false; walk(z, m => { if (m.op === 'c' && m.v === 'i') h = true; }); return h; })) prodI++; }); return !bad && !prodI && !hasSumParen(t); }
      return true;
    }
    return null;
  };

  /* =================== display =================== */
  const SUP = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹', '-': '⁻' };
  // plain-text pretty print of an ASCII math string: sqrt(3) → √3, x^2 → x², pi → π, * → ·, - → −
  E4.pt = function (str) {
    let s = String(str);
    s = s.replace(/sqrt\(([^()]+)\)/g, (m, a) => /^[0-9a-z.]+$/i.test(a) ? '√' + a : '√(' + a + ')').replace(/cbrt\(([^()]+)\)/g, (m, a) => /^[0-9a-z]+$/i.test(a) ? '∛' + a : '∛(' + a + ')');
    s = s.replace(/\^\((-?\d+)\)|\^(-?\d+)/g, (m, a, b) => [...(a || b)].map(c => SUP[c]).join(''));
    s = s.replace(/\bpi\b|pi(?=[^a-z]|$)/g, 'π').replace(/-?inf\b/g, m => m[0] === '-' ? '−∞' : '∞');
    s = s.replace(/\s+/g, '').replace(/([^(^*/+\-,=<>\[U])([+\-])/g, '$1 $2 ').replace(/([=<>]|<=|>=)/g, ' $1 ').replace(/\s+/g, ' ')
      .replace(/< =/g, '≤').replace(/> =/g, '≥').replace(/<=/g, '≤').replace(/>=/g, '≥').replace(/,(?! )/g, ', ').replace(/U/g, ' ∪ ').replace(/-/g, '−').replace(/\*/g, '·');
    return s.replace(/\s+/g, ' ').trim();
  };
  E4.show = function (f) {
    if (f.ans !== undefined || f.frac) return f.dp !== undefined ? E3.fmt(f.ans, { dp: f.dp }) : E3.show(f);
    if (f.exact !== undefined) return E4.pt(f.exact);
    if (f.expr !== undefined) return E4.pt(f.expr);
    if (f.eqn !== undefined) return E4.pt(f.eqn);
    if (f.set !== undefined) return f.set.length ? f.set.map(E4.pt).join(', ') : 'no solution';
    if (f.interval !== undefined) return E4.pt(f.interval);
    if (f.point !== undefined) return '(' + f.point.map(E4.pt).join(', ') + ')';
    if (f.complex !== undefined) return E4.pt(f.complex);
    return '';
  };
  // the text a student would type for this field (used by tests)
  E4.typed = function (f) {
    if (f.ans !== undefined) return f.dp !== undefined ? f.ans.toFixed(f.dp) : String(f.ans);
    if (f.frac) return f.frac[1] === 1 ? String(f.frac[0]) : `${f.frac[0]}/${f.frac[1]}`;
    if (f.set !== undefined) return f.set.length ? f.set.join(', ') : 'no solution';
    if (f.point !== undefined) return '(' + f.point.join(', ') + ')';
    return f.exact ?? f.expr ?? f.eqn ?? f.interval ?? f.complex;
  };

  /* ---------- MathML from ASCII math ---------- */
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const FNAME = { arcsin: 'arcsin', arccos: 'arccos', arctan: 'arctan', sinh: 'sinh', cosh: 'cosh', tanh: 'tanh', sin: 'sin', cos: 'cos', tan: 'tan', sec: 'sec', csc: 'csc', cot: 'cot', exp: 'exp', ln: 'ln', log: 'log' };
  const P0 = '<mo lspace="0em" rspace="0em" stretchy="false">(</mo>', P1 = '<mo lspace="0em" rspace="0em" stretchy="false">)</mo>';
  function ml(t) {
    switch (t.op) {
      case 'n': return `<mn>${t.lit || t.v}</mn>`;
      case 'c': return t.v === 'pi' ? '<mi>π</mi>' : t.v === 'e' ? '<mi>e</mi>' : t.v === 'i' ? '<mi>i</mi>' : '<mi>∞</mi>';
      case 'v': return `<mi>${t.v}</mi>`;
      case 'box': return '<mi mathvariant="normal" class="blank">□</mi>';
      case '()': return `<mrow>${P0}${ml(t.a)}${P1}</mrow>`;
      case 'neg': return `<mrow><mo>−</mo>${ml(t.a)}</mrow>`;
      case '+': return `<mrow>${ml(t.a)}<mo>+</mo>${ml(t.b)}</mrow>`;
      case '-': return `<mrow>${ml(t.a)}<mo>−</mo>${ml(t.b)}</mrow>`;
      case '*': { const both = t.a.op === 'n' && (t.b.op === 'n' || (t.b.op === '^' && t.b.a.op === 'n')) || !t.imp && t.a.op === 'n' && t.b.op === 'n';
        return `<mrow>${ml(t.a)}${both ? '<mo>×</mo>' : (t.imp ? '' : (t.b.op === 'n' ? '<mo>⋅</mo>' : ''))}${ml(t.b)}</mrow>`; }
      case '/': { const un = x => x.op === '()' ? x.a : x; return `<mfrac><mrow>${ml(un(t.a))}</mrow><mrow>${ml(un(t.b))}</mrow></mfrac>`; }
      case '^': { if (t.fnpow) { const f = t.a; return `<mrow><msup><mi>${FNAME[f.f]}</mi><mrow>${ml(t.b)}</mrow></msup><mo>&#x2061;</mo>${ml(f.a)}</mrow>`; }
        const ex = t.b.op === '()' ? t.b.a : t.b; return `<msup><mrow>${ml(t.a)}</mrow><mrow>${ml(ex)}</mrow></msup>`; }
      case '!': return `<mrow>${ml(t.a)}<mo>!</mo></mrow>`;
      case 'fn': {
        const inner = t.a.op === '()' ? t.a.a : t.a;
        if (t.f === 'sqrt') return `<msqrt><mrow>${ml(inner)}</mrow></msqrt>`;
        if (t.f === 'cbrt') return `<mroot><mrow>${ml(inner)}</mrow><mn>3</mn></mroot>`;
        if (t.f === 'abs') return `<mrow><mo>|</mo>${ml(inner)}<mo>|</mo></mrow>`;
        const nm = t.f === 'log' && t.base ? `<msub><mi>log</mi><mn>${t.base}</mn></msub>` : `<mi>${FNAME[t.f]}</mi>`;
        const simple = ['v', 'n', 'c'].includes(inner.op) || (inner.op === '*' && t.a.op !== '()');
        return `<mrow>${nm}<mo>&#x2061;</mo>${simple && t.a.op !== '()' ? ml(inner) : P0 + ml(inner) + P1}</mrow>`;
      }
    }
    return '';
  }
  const REL = { '<=': '≤', '>=': '≥', '!=': '≠', '<': '&lt;', '>': '&gt;', '=': '=', '≈': '≈' };
  // E4.mx('x^2 - 5x + 6 = 0') → inline MathML. Relations (= < > <= >=) and ", " lists allowed; "U" joins intervals.
  // Greek letters and degree signs: swapped for placeholder numbers, rendered, then swapped back
  const GREEK = /[θαβφγδωλμσρ]/g;
  E4.mx = function (str, o = {}) {
    if (typeof str === 'string' && (GREEK.test(str) || /°/.test(str))) {
      GREEK.lastIndex = 0; const keep = [], tok = v => { keep.push(v); return String(97531000 + keep.length - 1); };
      const t = str.replace(/(\d+(?:\.\d+)?)°/g, (m, n) => tok('<mn>' + n + '°</mn>')).replace(/°/g, () => tok('<mo>°</mo>'));
      const free = 'qjkuvwzyQJKUVWZY'.split('').filter(ch => !str.includes(ch)), gmap = {};
      const t2 = t.replace(GREEK, g => { if (!(g in gmap)) gmap[g] = free.shift() || 'q'; return gmap[g]; });
      let h = E4.mx(t2, o);
      keep.forEach((k, i) => { h = h.split(`<mn>${97531000 + i}</mn>`).join(k); });
      for (const g in gmap) h = h.split(`<mi>${gmap[g]}</mi>`).join(`<mi>${g}</mi>`);
      return h;
    }
    const s = norm(str);
    const segs = s.split(/(<=|>=|!=|=|<|>|≈)/);
    let body = '';
    for (let k = 0; k < segs.length; k++) {
      const seg = segs[k];
      if (k % 2) { body += `<mo>${REL[seg]}</mo>`; continue; }
      if (!seg.trim()) continue;
      const items = splitList(seg);
      body += items.map(it => { const t = parse(it, { e: o.e !== false, complex: !!o.complex }); return t ? ml(t) : `<mtext>${esc(it)}</mtext>`; }).join('<mo>,</mo>');
    }
    return `<math${o.display ? ' display="block"' : ''}><mrow>${body}</mrow></math>`;
  };
  E4.showHTML = function (f) {
    if (f.expr !== undefined) return E4.mx(f.expr);
    if (f.exact !== undefined) return E4.mx(f.exact);
    if (f.eqn !== undefined) return E4.mx(f.eqn);
    if (f.complex !== undefined) return E4.mx(f.complex, { complex: true });
    if (f.set !== undefined && f.set.length) return f.set.map(x => E4.mx(x, { complex: true })).join(', ');
    return esc(E4.show(f));
  };

  /* =================== validation =================== */
  E4.validate = function (q, where) {
    const bad = m => { throw new Error(where + ': ' + m); };
    if (!q || typeof q !== 'object') bad('no question object');
    if (typeof q.prompt !== 'string' || !q.prompt.trim()) bad('empty prompt');
    // leaked JavaScript values, not the math word: NaN/[object/Infinity anywhere; "undefined" only next to = : ( [ or an operator, or alone
    const leak = t => { const x = String(t || ''); return /NaN|\[object|Infinity/.test(x) || /^\s*undefined\s*$|([=:(\[]|<m[ino]>)\s*undefined|undefined\s*([=)\]+×·\/]|<\/m)/.test(x); };
    for (const k of ['prompt', 'explain']) if (leak(q[k])) bad(k + ' has undefined/NaN: ' + q[k]);
    if (typeof q.explain !== 'string' || !q.explain.trim()) bad('missing explain');
    if (q.visual !== undefined) { if (typeof q.visual !== 'string' || !q.visual.startsWith('<svg')) bad('visual not svg'); if (/NaN|undefined|Infinity/.test(q.visual)) bad('visual has NaN/undefined'); }
    if (q.kind === 'num') {
      if (!Array.isArray(q.fields) || !q.fields.length || q.fields.length > 4) bad('fields 1-4');
      q.fields.forEach(f => {
        const kinds = ['ans', 'frac', 'exact', 'expr', 'eqn', 'set', 'interval', 'point', 'complex'].filter(k => f[k] !== undefined);
        if (kinds.length !== 1) bad('field must have exactly one answer kind, has ' + kinds.join('+'));
        if (f.ans !== undefined && (typeof f.ans !== 'number' || !isFinite(f.ans))) bad('ans not a number');
        if (f.ans !== undefined && f.dp === undefined && Math.abs(Math.round(f.ans * 1000) - f.ans * 1000) > 1e-6) bad('more than 3 dp without dp: ' + f.ans);
        if (f.exact !== undefined && !E4.value(f.exact)) bad('exact does not evaluate: ' + f.exact);
        if (f.expr !== undefined && !parse(f.expr, { e: true })) bad('expr does not parse: ' + f.expr);
        if (f.form && !['any', 'expanded', 'factored', 'complete', 'gcf', 'simplified', 'vertex', 'simplest', 'improper', 'mixed', 'solved', 'standard'].includes(f.form)) bad('unknown form ' + f.form);
        if (f.eqn !== undefined && !readEqn(f.eqn)) bad('eqn does not parse: ' + f.eqn);
        if (f.interval !== undefined && !readIntervals(f.interval)) bad('interval does not parse: ' + f.interval);
        if (f.set !== undefined && (!Array.isArray(f.set) || f.set.some(x => !E4.value(x)))) bad('set values do not evaluate: ' + f.set);
        if (f.point !== undefined && (!Array.isArray(f.point) || f.point.some(x => !E4.value(x)))) bad('point does not evaluate');
        if (f.complex !== undefined && !E4.value(f.complex)) bad('complex does not evaluate');
        if (f.label !== undefined && (typeof f.label !== 'string' || /undefined|NaN/.test(f.label))) bad('bad label');
        if (E4.check(f, E4.typed(f)) !== true) bad('the answer fails its own check: ' + E4.typed(f) + ' ' + JSON.stringify(f));
      });
    } else if (q.kind === 'choice') {
      if (!Array.isArray(q.choices) || q.choices.length < 2 || q.choices.length > 6) bad('choices 2-6');
      if (new Set(q.choices).size !== q.choices.length) bad('duplicate choices ' + q.choices.join(' / '));
      if (!Number.isInteger(q.ans) || q.ans < 0 || q.ans >= q.choices.length) bad('bad choice index');
      q.choices.forEach(c => { if (c !== 'undefined' && leak(c)) bad('choice has undefined/NaN'); });
    } else if (q.kind === 'order') {
      if (!Array.isArray(q.items) || q.items.length < 3 || q.items.length > 8) bad('order needs 3-8 items');
      if (new Set(q.items).size !== q.items.length) bad('duplicate order items ' + q.items.join(' / '));
      q.items.forEach(c => { if (typeof c !== 'string' || !c.trim() || leak(c)) bad('bad order item'); });
      const perm = a => Array.isArray(a) && a.length === q.items.length && new Set(a).size === a.length && a.every(x => Number.isInteger(x) && x >= 0 && x < q.items.length);
      if (!perm(q.ans)) bad('order ans is not a permutation');
      (q.alts || []).forEach(a => { if (!perm(a)) bad('order alt is not a permutation'); });
      for (let i = 0; i < (q.fixed || 0); i++) if (q.ans[i] !== i) bad('fixed items must lead');
      if (!E4.checkOrder(q, q.ans)) bad('order fails its own check');
    } else bad('unknown kind ' + q.kind);
    return true;
  };

  /* =================== drawing kit =================== */
  const V = E4.V = Object.assign({}, E3.V);
  const r2 = x => Math.round(x * 100) / 100;
  // graph of functions. o: {x:[lo,hi], y:[lo,hi], w, h, fns:[{f:x=>y, color, dash, from, to, label}], param:[{x:t=>, y:t=>, t:[a,b], color}],
  //   points:[[x,y,label,open]], vlines:[{x,dash,color}], hlines:[{y,dash,color}], shade:{f,g,from,to}, grid:true, ticks:1, labels:true}
  V.graph = function (o = {}) {
    const [x0, x1] = o.x || [-6, 6], [y0, y1] = o.y || [-6, 6], W = o.w || 360, H = o.h || Math.round(W * (y1 - y0) / (x1 - x0)) || 360, pad = 18;
    const X = x => pad + (x - x0) / (x1 - x0) * (W - 2 * pad), Y = y => H - pad - (y - y0) / (y1 - y0) * (H - 2 * pad);
    const tx = o.ticks || niceStep(x1 - x0), ty = o.yticks || o.ticks || niceStep(y1 - y0);
    let b = `<rect x="0" y="0" width="${W}" height="${H}" fill="${C.paper}"/>`;
    if (o.grid !== false) { for (let v = Math.ceil(x0 / tx) * tx; v <= x1 + 1e-9; v += tx) b += `<line x1="${r2(X(v))}" y1="${pad}" x2="${r2(X(v))}" y2="${H - pad}" stroke="${C.faint}" stroke-width="1"/>`;
      for (let v = Math.ceil(y0 / ty) * ty; v <= y1 + 1e-9; v += ty) b += `<line x1="${pad}" y1="${r2(Y(v))}" x2="${W - pad}" y2="${r2(Y(v))}" stroke="${C.faint}" stroke-width="1"/>`; }
    if (x0 <= 0 && x1 >= 0) b += `<line x1="${r2(X(0))}" y1="${pad - 6}" x2="${r2(X(0))}" y2="${H - pad + 6}" stroke="${C.ink}" stroke-width="1.6"/>`;
    if (y0 <= 0 && y1 >= 0) b += `<line x1="${pad - 6}" y1="${r2(Y(0))}" x2="${W - pad + 6}" y2="${r2(Y(0))}" stroke="${C.ink}" stroke-width="1.6"/>`;
    if (o.labels !== false) {
      const yAx = (y0 <= 0 && y1 >= 0) ? Y(0) : H - pad, xAx = (x0 <= 0 && x1 >= 0) ? X(0) : pad;
      for (let v = Math.ceil(x0 / tx) * tx; v <= x1 + 1e-9; v += tx) { if (Math.abs(v) < 1e-9 || v <= x0 + 1e-9 || v >= x1 - 1e-9) continue; b += V.text(r2(X(v)), r2(Math.min(H - 6, yAx + 12)), fmtTick(v, o.xpi), { size: 10.5, fill: C.muted }); }
      for (let v = Math.ceil(y0 / ty) * ty; v <= y1 + 1e-9; v += ty) { if (Math.abs(v) < 1e-9 || v <= y0 + 1e-9 || v >= y1 - 1e-9) continue; b += V.text(r2(Math.max(10, xAx - 10)), r2(Y(v)), fmtTick(v), { size: 10.5, fill: C.muted, anchor: 'end' }); }
    }
    if (o.shade) { const { f, g, from, to } = o.shade; let pts = []; const n = 80; for (let k = 0; k <= n; k++) { const x = from + (to - from) * k / n; pts.push([X(x), Y(clampY(f(x)))]); } for (let k = n; k >= 0; k--) { const x = from + (to - from) * k / n; pts.push([X(x), Y(clampY(g ? g(x) : 0))]); } b += `<polygon points="${pts.map(p => r2(p[0]) + ',' + r2(p[1])).join(' ')}" fill="${o.shade.color || C.blue}" fill-opacity="0.22"/>`; }
    function clampY(y) { return Math.max(y0 - (y1 - y0), Math.min(y1 + (y1 - y0), y)); }
    (o.hlines || []).forEach(L => b += `<line x1="${pad}" y1="${r2(Y(L.y))}" x2="${W - pad}" y2="${r2(Y(L.y))}" stroke="${L.color || C.muted}" stroke-width="1.6" ${L.dash !== false ? 'stroke-dasharray="6 5"' : ''}/>`);
    (o.vlines || []).forEach(L => b += `<line x1="${r2(X(L.x))}" y1="${pad}" x2="${r2(X(L.x))}" y2="${H - pad}" stroke="${L.color || C.muted}" stroke-width="1.6" ${L.dash !== false ? 'stroke-dasharray="6 5"' : ''}/>`);
    (o.fns || []).forEach((F, k) => {
      const col = F.color || C.set[(k + 1) % 7], a = F.from ?? x0, z = F.to ?? x1, n = 400; let d = '', pen = false, prev = null;
      for (let j = 0; j <= n; j++) { const x = a + (z - a) * j / n, y = F.f(x);
        if (!isFinite(y) || y < y0 - (y1 - y0) * 2 || y > y1 + (y1 - y0) * 2 || (prev !== null && Math.abs(y - prev) > (y1 - y0) * 1.5)) { pen = false; prev = isFinite(y) ? y : null; continue; }
        d += (pen ? 'L' : 'M') + r2(X(x)) + ' ' + r2(Y(clampY(y))); pen = true; prev = y; }
      b += `<path d="${d}" fill="none" stroke="${col}" stroke-width="2.6" ${F.dash ? 'stroke-dasharray="7 5"' : ''} stroke-linejoin="round" stroke-linecap="round"/>`;
      if (F.label) { const lx = F.lx ?? (z - (z - a) * 0.08), ly = F.f(lx); if (isFinite(ly)) b += V.text(r2(X(lx)), r2(Y(clampY(ly)) - 12), F.label, { size: 13, weight: 700, fill: col }); }
    });
    (o.param || []).forEach((F, k) => { const col = F.color || C.set[(k + 2) % 7], [a, z] = F.t, n = 400; let d = ''; for (let j = 0; j <= n; j++) { const t = a + (z - a) * j / n; d += (j ? 'L' : 'M') + r2(X(F.x(t))) + ' ' + r2(Y(F.y(t))); } b += `<path d="${d}" fill="none" stroke="${col}" stroke-width="2.6" stroke-linejoin="round"/>`; });
    (o.points || []).forEach(([x, y, lab, open]) => { b += open ? `<circle cx="${r2(X(x))}" cy="${r2(Y(y))}" r="5" fill="${C.paper}" stroke="${C.ink}" stroke-width="2"/>` : V.dot(r2(X(x)), r2(Y(y)), 5, C.red); if (lab) b += V.text(r2(X(x) + 10), r2(Y(y) - 12), lab, { size: 13, weight: 700, anchor: 'start' }); });
    let hh = 2166136261; const key = W + '|' + H + '|' + b; for (let k = 0; k < key.length; k++) { hh ^= key.charCodeAt(k); hh = Math.imul(hh, 16777619); }
    const clipId = 'g' + (hh >>> 0).toString(36);   // depends on the whole picture, so two graphs on one page never share a clip
    return V.svg(W, H, `<defs><clipPath id="${clipId}"><rect x="0" y="0" width="${W}" height="${H}"/></clipPath></defs><g clip-path="url(#${clipId})">${b}</g>`, o.label || 'graph');
  };
  function niceStep(span) { const raw = span / 8, p = Math.pow(10, Math.floor(Math.log10(raw))), m = raw / p; return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p; }
  function fmtTick(v, pi) { if (pi) { const k = Math.round(v / Math.PI * 2); return (k === 2 ? 'π' : k === -2 ? '−π' : k % 2 === 0 ? (k / 2 + 'π').replace('-', '−') : (k + 'π/2').replace('-', '−')); } return String(r2(v)).replace('-', '−'); }

  // geometry figure. o: {pts:{A:[x,y],…} (math coords, y up), segs:[['A','B', {label, dash, color, ticks}]], polys:[['A','B','C',{fill}]],
  //   circles:[{c:'O'|[x,y], r, dash}], arcs:[{c, r, from, to}] (degrees), angles:[['A','B','C', label, {r, right}]], labels: true,
  //   rays:[['A','B']], lines:[['A','B']], text:[[x,y,'s']], w, pad}
  V.geo = function (o = {}) {
    const P = o.pts || {}; const all = Object.values(P);
    (o.circles || []).forEach(c => { const cc = typeof c.c === 'string' ? P[c.c] : c.c; all.push([cc[0] - c.r, cc[1] - c.r], [cc[0] + c.r, cc[1] + c.r]); });
    const xs = all.map(p => p[0]), ys = all.map(p => p[1]);
    const mnx = Math.min(...xs), mxx = Math.max(...xs), mny = Math.min(...ys), mxy = Math.max(...ys);
    const W = o.w || 340, pad = o.pad || 34, sc = (W - 2 * pad) / Math.max(1e-9, mxx - mnx, (mxy - mny) * 1.0);
    const H = Math.round((mxy - mny) * sc + 2 * pad);
    const X = x => r2(pad + (x - mnx) * sc), Y = y => r2(H - pad - (y - mny) * sc);
    const pt = p => typeof p === 'string' ? P[p] : p;
    let b = '';
    (o.polys || []).forEach(pl => { const opt = typeof pl[pl.length - 1] === 'object' && !Array.isArray(pl[pl.length - 1]) ? pl[pl.length - 1] : {}; const ns = pl.filter(x => typeof x === 'string' || Array.isArray(x));
      b += `<polygon points="${ns.map(n => X(pt(n)[0]) + ',' + Y(pt(n)[1])).join(' ')}" fill="${opt.fill || C.blue}" fill-opacity="${opt.opacity ?? 0.12}" stroke="none"/>`; });
    (o.circles || []).forEach(c => { const cc = pt(c.c); b += `<circle cx="${X(cc[0])}" cy="${Y(cc[1])}" r="${r2(c.r * sc)}" fill="none" stroke="${c.color || C.ink}" stroke-width="2" ${c.dash ? 'stroke-dasharray="6 5"' : ''}/>`; });
    const extend = (A, B, t0, t1) => [[A[0] + (B[0] - A[0]) * t0, A[1] + (B[1] - A[1]) * t0], [A[0] + (B[0] - A[0]) * t1, A[1] + (B[1] - A[1]) * t1]];
    (o.lines || []).forEach(([a, c]) => { const [p, q] = extend(pt(a), pt(c), -0.6, 1.6); b += `<line x1="${X(p[0])}" y1="${Y(p[1])}" x2="${X(q[0])}" y2="${Y(q[1])}" stroke="${C.ink}" stroke-width="1.8"/>`; });
    (o.rays || []).forEach(([a, c]) => { const [p, q] = extend(pt(a), pt(c), 0, 1.5); b += `<line x1="${X(p[0])}" y1="${Y(p[1])}" x2="${X(q[0])}" y2="${Y(q[1])}" stroke="${C.ink}" stroke-width="1.8"/>`; });
    (o.segs || []).forEach(sg => { const [a, c, opt = {}] = sg; const A = pt(a), B = pt(c);
      b += `<line x1="${X(A[0])}" y1="${Y(A[1])}" x2="${X(B[0])}" y2="${Y(B[1])}" stroke="${opt.color || C.ink}" stroke-width="${opt.width || 2.2}" ${opt.dash ? 'stroke-dasharray="6 5"' : ''} stroke-linecap="round"/>`;
      const mx = (X(A[0]) + X(B[0])) / 2, my = (Y(A[1]) + Y(B[1])) / 2, dx = X(B[0]) - X(A[0]), dy = Y(B[1]) - Y(A[1]), L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
      if (opt.ticks) for (let k = 0; k < opt.ticks; k++) { const off = (k - (opt.ticks - 1) / 2) * 5, cx0 = mx + dx / L * off, cy0 = my + dy / L * off; b += `<line x1="${r2(cx0 - nx * 6)}" y1="${r2(cy0 - ny * 6)}" x2="${r2(cx0 + nx * 6)}" y2="${r2(cy0 + ny * 6)}" stroke="${C.ink}" stroke-width="1.8"/>`; }
      if (opt.label !== undefined) { const side = opt.side || 1; const cen = centroid(); const toC = (cen[0] - mx) * nx + (cen[1] - my) * ny; const sgn = (toC > 0 ? -1 : 1) * side; b += V.text(r2(mx + nx * 15 * sgn), r2(my + ny * 15 * sgn), opt.label, { size: 14, weight: 600, fill: opt.lcolor || C.ink }); } });
    function centroid() { const v = Object.values(P); return [v.reduce((s, p) => s + X(p[0]), 0) / v.length, v.reduce((s, p) => s + Y(p[1]), 0) / v.length]; }
    (o.angles || []).forEach(an => { const [a, v, c, lab, opt = {}] = an; const A = pt(a), B = pt(v), Cc = pt(c);
      const a1 = Math.atan2(-(A[1] - B[1]), A[0] - B[0]), a2 = Math.atan2(-(Cc[1] - B[1]), Cc[0] - B[0]); const rr = opt.r || 22, bx = X(B[0]), by = Y(B[1]);
      let d = a2 - a1; while (d <= -Math.PI) d += 2 * Math.PI; while (d > Math.PI) d -= 2 * Math.PI;
      if (opt.right) { const u = [Math.cos(a1), Math.sin(a1)], w = [Math.cos(a2), Math.sin(a2)], s = 13; b += `<path d="M${r2(bx + u[0] * s)} ${r2(by + u[1] * s)} L${r2(bx + (u[0] + w[0]) * s)} ${r2(by + (u[1] + w[1]) * s)} L${r2(bx + w[0] * s)} ${r2(by + w[1] * s)}" fill="none" stroke="${C.ink}" stroke-width="1.6"/>`; }
      else { const sweep = d > 0 ? 1 : 0; b += `<path d="M${r2(bx + rr * Math.cos(a1))} ${r2(by + rr * Math.sin(a1))} A${rr} ${rr} 0 0 ${sweep} ${r2(bx + rr * Math.cos(a2))} ${r2(by + rr * Math.sin(a2))}" fill="none" stroke="${opt.color || C.red}" stroke-width="2"/>`; }
      if (lab) { const mid = a1 + d / 2, lr = rr + 15; b += V.text(r2(bx + lr * Math.cos(mid)), r2(by + lr * Math.sin(mid)), lab, { size: 13.5, weight: 600, fill: opt.color || C.red }); } });
    if (o.labels !== false) { const cen = centroid(); Object.entries(P).forEach(([k, p]) => { if ((o.hide || []).includes(k)) return; const x = X(p[0]), y = Y(p[1]); let dx = x - cen[0], dy = y - cen[1]; const L = Math.hypot(dx, dy) || 1; b += V.dot(x, y, 3.2, C.ink) + V.text(r2(x + dx / L * 16), r2(y + dy / L * 16), k, { size: 15, weight: 700 }); }); }
    (o.text || []).forEach(([x, y, s]) => b += V.text(X(x), Y(y), s, { size: 14, weight: 600 }));
    return V.svg(W, H, b, o.label || 'geometry figure');
  };
  // unit circle with an angle θ (radians) marked and optional point label
  V.unitCircle = function (theta, o = {}) {
    const R = 1, pts = { O: [0, 0] }, px = Math.cos(theta), py = Math.sin(theta);
    const g = V.graph({ x: [-1.4, 1.4], y: [-1.4, 1.4], w: o.w || 300, ticks: 0.5, labels: false, fns: [], param: [{ x: t => Math.cos(t), y: t => Math.sin(t), t: [0, 2 * Math.PI], color: C.ink }], points: [[px, py, o.label || 'P']], label: 'unit circle' });
    return g.replace('</g></svg>', `<line x1="${r2(18 + (0 + 1.4) / 2.8 * 264)}" y1="${r2(282 - (0 + 1.4) / 2.8 * 264)}" x2="${r2(18 + (px + 1.4) / 2.8 * 264)}" y2="${r2(282 - (py + 1.4) / 2.8 * 264)}" stroke="${C.blue}" stroke-width="2.4"/></g></svg>`);
  };

  /* ---------- small helpers for generators ---------- */
  // coefficients → polynomial ASCII string, e.g. poly([1,-5,6]) → 'x^2-5x+6'
  E4.poly = function (co, v = 'x') {
    const n = co.length - 1; let s = '';
    co.forEach((c, k) => { const p = n - k; if (!c) return; const a = Math.abs(c), sg = c < 0 ? '-' : (s ? '+' : '');
      const body = p === 0 ? String(a) : (a === 1 ? '' : String(a)) + v + (p > 1 ? '^' + p : ''); s += sg + body; });
    return s || '0';
  };
  // (x - r) style factor text
  E4.lin = (r, v = 'x', a = 1) => { const A = a === 1 ? '' : a === -1 ? '-' : String(a); return r === 0 ? `${A}${v}` : `(${A}${v}${r > 0 ? '-' : '+'}${Math.abs(r)})`; };
  // simplify a*sqrt(b) → [coef, radicand]
  E4.surd = function (a, b) { let k = 1; for (let d = 2; d * d <= b; d++) while (b % (d * d) === 0) { b /= d * d; k *= d; } return [a * k, b]; };
  // exact string for (p + q*sqrt(r)) / d, fully reduced
  E4.surdStr = function (p, q, r, d = 1) {
    if (r === 1) { p += q; q = 0; }
    const [q2, r2x] = E4.surd(q, r); q = q2; r = r2x; if (r === 1) { p += q; q = 0; }
    if (d < 0) { p = -p; q = -q; d = -d; }
    const g = gcd(gcd(Math.abs(p), Math.abs(q)), d) || 1; p /= g; q /= g; d /= g;
    const rad = q === 0 ? '' : (Math.abs(q) === 1 ? '' : Math.abs(q)) + `sqrt(${r})`;
    let num = p === 0 ? (q < 0 ? '-' : '') + rad : q === 0 ? String(p) : `${p}${q < 0 ? '-' : '+'}${rad}`;
    if (!num) num = '0';
    if (d === 1) return num;
    return (p !== 0 && q !== 0) ? `(${num})/${d}` : `${num}/${d}`;
  };
  E4.fracStr = (n, d) => { if (d < 0) { n = -n; d = -d; } const g = gcd(n, d); n /= g; d /= g; return d === 1 ? String(n) : `${n}/${d}`; };

  // Era V shares the core with its own registry
  const E5 = G.E5 = G.E5 || Object.assign(Object.create(E4), { skills: [], byId: {} });
  E5.skill = def => E4.skill.call(E5, def);

  /* =================== Era V kit (promoted from the V.1 and V.3 pilot units) ===================
     const K = E5.K; then e.g. K.fig({pts, segs, angles, arrows, text, w}), K.bySides(a,b,c), K.spin(R, pts), K.orderQ(R, prompt, lines, deps, explain, {fixed})
     K.orderQ: deps[i] = the lines that line i needs; every order that respects them is accepted (the last line needs everything). */
  E5.K = (function () {
    const V = E4.V, C = E4.C, E = E5;
  const r2 = x => Math.round(x * 100) / 100;
  const rad = d => d * Math.PI / 180, dg = r => r * 180 / Math.PI;
  const dist = (P, Q) => Math.hypot(P[0] - Q[0], P[1] - Q[1]);
  const lerp = (P, Q, t) => [P[0] + (Q[0] - P[0]) * t, P[1] + (Q[1] - P[1]) * t];
  const mid = (P, Q) => lerp(P, Q, 0.5);
  const add = (P, Q) => [P[0] + Q[0], P[1] + Q[1]], sub = (P, Q) => [P[0] - Q[0], P[1] - Q[1]], mul = (P, k) => [P[0] * k, P[1] * k];
  const unit = P => mul(P, 1 / (Math.hypot(P[0], P[1]) || 1));
  const polar = (r, d) => [r * Math.cos(rad(d)), r * Math.sin(rad(d))];
  const ang3 = (P, Q, T) => { let d = Math.abs(Math.atan2(P[1] - Q[1], P[0] - Q[0]) - Math.atan2(T[1] - Q[1], T[0] - Q[0])); if (d > Math.PI) d = 2 * Math.PI - d; return dg(d); };
  const foot = (P, A, B) => { const d = sub(B, A), t = ((P[0] - A[0]) * d[0] + (P[1] - A[1]) * d[1]) / (d[0] * d[0] + d[1] * d[1]); return add(A, mul(d, t)); };
  // triangle from its sides: a = BC, b = CA, c = AB
  const bySides = (a, b, c) => { const x = (a * a + c * c - b * b) / (2 * a); return { A: [x, Math.sqrt(Math.max(0, c * c - x * x))], B: [0, 0], C: [a, 0] }; };
  // triangle from the angles at B and C, with BC = a
  const byAngles = (Bd, Cd, a = 6) => { const c = a * Math.sin(rad(Cd)) / Math.sin(rad(180 - Bd - Cd)); return { A: polar(c, Bd), B: [0, 0], C: [a, 0] }; };
  const circum = (A, B, Q) => { const d = 2 * (A[0] * (B[1] - Q[1]) + B[0] * (Q[1] - A[1]) + Q[0] * (A[1] - B[1])), a2 = A[0] ** 2 + A[1] ** 2, b2 = B[0] ** 2 + B[1] ** 2, c2 = Q[0] ** 2 + Q[1] ** 2;
    return [(a2 * (B[1] - Q[1]) + b2 * (Q[1] - A[1]) + c2 * (A[1] - B[1])) / d, (a2 * (Q[0] - B[0]) + b2 * (A[0] - Q[0]) + c2 * (B[0] - A[0])) / d]; };
  const incen = (A, B, Q) => { const a = dist(B, Q), b = dist(A, Q), c = dist(A, B), s = a + b + c; return [(a * A[0] + b * B[0] + c * Q[0]) / s, (a * A[1] + b * B[1] + c * Q[1]) / s]; };
  const cen3 = (A, B, Q) => [(A[0] + B[0] + Q[0]) / 3, (A[1] + B[1] + Q[1]) / 3];
  // rotate (and maybe reflect) a whole picture, so no figure always sits base-down
  const xform = (pts, th, flip, k = 1) => { const c = Math.cos(th), s = Math.sin(th), o = {}; for (const n in pts) { const x = (flip ? -pts[n][0] : pts[n][0]) * k, y = pts[n][1] * k; o[n] = [x * c - y * s, x * s + y * c]; } return o; };
  const spin = (R, pts) => xform(pts, rad(R.int(0, 71) * 5), R.bool());
  const POOL = 'ABCDEFGHJKLMNPQRSTUVWXYZ'.split('');
  const lets = (R, k) => R.sample(POOL, k);
  const trio = R => { const s = R.pick(['ABC', 'DEF', 'PQR', 'XYZ', 'JKL', 'LMN', 'RST', 'UVW', '', '', '']); return s ? s.split('') : lets(R, 3); };
  // replace single capital letters (point names) but never letters inside words like "Draw"
  const rnF = map => s => String(s).replace(/(?<![A-Za-z])[A-Z]+(?![a-z])/g, w => [...w].map(ch => map[ch] || ch).join(''));
  const renamePts = (pts, map) => { const o = {}; for (const k in pts) o[k[0] === '_' ? k : map[k]] = pts[k]; return o; };
  /* ================= the figure: V.geo plus labels placed to stay readable =================
     o: {pts, segs:[[a,b,{ticks,dash,lab,side,at}]], angles:[[p,v,q,label,{right,n,r}]], arrows:[[a,b,n,t]], text:[[pt,s]], w, center}
     Points whose name starts with "_" are drawn-to helpers (no dot, no label). */
  const TW = (s, z) => [...String(s)].reduce((w, ch) => w + (/[°.,′ ()]/.test(ch) ? 0.33 : /[A-Z△∠]/.test(ch) ? 0.68 : 0.56), 0) * z;
  const fig = o => {
    const P = o.pts, W = o.w || 280, pad = 30, hidden = k => k[0] === '_';
    const all = Object.values(P).slice();
    const xs = all.map(p => p[0]), ys = all.map(p => p[1]), mnx = Math.min(...xs), mxx = Math.max(...xs), mny = Math.min(...ys), mxy = Math.max(...ys);
    const sc = (W - 2 * pad) / Math.max(1e-9, mxx - mnx, mxy - mny), H = Math.round((mxy - mny) * sc + 2 * pad);
    const T = p => [r2(pad + (p[0] - mnx) * sc), r2(H - pad - (p[1] - mny) * sc)];
    const segs = (o.segs || []).map(([a, b, op = {}]) => [a, b, { ticks: op.ticks, dash: op.dash, color: op.color, width: op.width }]);
    const angs = [], albl = [], boxes = [], ticksA = [];
    (o.angles || []).forEach(([p, v, q, lab, op = {}]) => {
      const B = T(P[v]), a1 = Math.atan2(T(P[p])[1] - B[1], T(P[p])[0] - B[0]), a2 = Math.atan2(T(P[q])[1] - B[1], T(P[q])[0] - B[0]);
      if (op.right) { angs.push([p, v, q, '', { right: true }]); [a1, a2].forEach(a => boxes.push([B[0] + 20 * Math.cos(a), B[1] + 20 * Math.sin(a)])); return; }
      const t = ang3(P[p], P[v], P[q]), base = op.r || (t < 22 ? 40 : t < 40 ? 32 : t < 60 ? 26 : 22), n = op.n || 1;
      for (let i = 0; i < n; i++) angs.push([p, v, q, '', { r: base + 5 * i, color: op.color || C.red }]);
      const rr = base + 5 * (n - 1); let d = a2 - a1; while (d <= -Math.PI) d += 2 * Math.PI; while (d > Math.PI) d -= 2 * Math.PI;
      [a1, a2, a1 + d / 2].forEach(a => boxes.push([B[0] + (rr + 2) * Math.cos(a), B[1] + (rr + 2) * Math.sin(a)]));
      if (op.tick) { const m = a1 + d / 2; ticksA.push(`<line x1="${r2(B[0] + (rr - 5) * Math.cos(m))}" y1="${r2(B[1] + (rr - 5) * Math.sin(m))}" x2="${r2(B[0] + (rr + 5) * Math.cos(m))}" y2="${r2(B[1] + (rr + 5) * Math.sin(m))}" stroke="${op.color || C.red}" stroke-width="2"/>`); }
      if (lab) albl.push({ v, B, m: a1 + d / 2, h: Math.abs(d) / 2, lab, rr, op });
    });
    let body = V.geo({ pts: P, segs, angles: angs, polys: o.polys, labels: false, w: W, pad }).replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
    body += ticksA.join(''); Object.values(P).forEach(p => boxes.push(T(p)));
    const txt = (x, y, s, op = {}) => { const z = op.size || 14, hw = TW(s, z) / 2; boxes.push([x - hw, y - z * 0.62], [x + hw, y + z * 0.62]); body += V.text(r2(x), r2(y), s, { size: z, weight: op.weight || 600, fill: op.fill || C.ink }).replace('<text ', '<text paint-order="stroke" stroke="#fff" stroke-width="3.5" stroke-linejoin="round" '); };
    // distance along direction m that keeps a text box inside a wedge of half-angle h
    const fitWedge = (s, z, m, h, min) => { const hw = TW(s, z) / 2 + 3, hh = z * 0.6, ep = hw * Math.abs(Math.sin(m)) + hh * Math.abs(Math.cos(m)), eu = hw * Math.abs(Math.cos(m)) + hh * Math.abs(Math.sin(m));
      return Math.max(min + eu, eu + ep / Math.tan(Math.max(0.12, Math.min(h, 1.45)))); };
    // parallel arrows
    (o.arrows || []).forEach(([a, b, n = 1, t = 0.5]) => { const A = T(P[a]), B = T(P[b]), u = unit(sub(B, A)), w = [-u[1], u[0]], c = lerp(A, B, t);
      for (let i = 0; i < n; i++) { const tip = add(c, mul(u, 4 + 6 * (i - (n - 1) / 2))), k1 = add(sub(tip, mul(u, 7)), mul(w, 5)), k2 = add(sub(tip, mul(u, 7)), mul(w, -5));
        body += `<path d="M${r2(k1[0])} ${r2(k1[1])} L${r2(tip[0])} ${r2(tip[1])} L${r2(k2[0])} ${r2(k2[1])}" fill="none" stroke="${C.ink}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`; } });
    // angle labels, pushed out along the bisector until they fit between the arms
    const placed = [], hit = (x, y, hw, hh) => placed.some(q => Math.abs(q[0] - x) < q[2] + hw && Math.abs(q[1] - y) < q[3] + hh);
    albl.forEach(a => { const z = 13.5, hw = TW(a.lab, z) / 2, hh = z * 0.6; let d = Math.min(fitWedge(a.lab, z, a.m, a.h, a.rr + 4), a.op.max || a.rr + 34);
      if (a.op.out) d = -(hw * Math.abs(Math.cos(a.m)) + hh * Math.abs(Math.sin(a.m)) + 10);
      for (let i = 0; i < 8 && hit(a.B[0] + d * Math.cos(a.m), a.B[1] + d * Math.sin(a.m), hw, hh); i++) d += a.op.out ? -7 : 7;
      const x = a.B[0] + d * Math.cos(a.m), y = a.B[1] + d * Math.sin(a.m); placed.push([x, y, hw, hh]); txt(x, y, a.lab, { size: z, fill: a.op.color || C.red }); });
    // side labels, on the side away from the figure's middle
    const vis = Object.keys(P).filter(k => !hidden(k)).map(k => T(P[k])), cen = o.center ? T(o.center) : [vis.reduce((s, p) => s + p[0], 0) / vis.length, vis.reduce((s, p) => s + p[1], 0) / vis.length];
    (o.segs || []).forEach(([a, b, op = {}]) => { if (op.lab === undefined) return; const A = T(P[a]), B = T(P[b]), c = lerp(A, B, op.at ?? 0.5), u = unit(sub(B, A)); let n = [-u[1], u[0]];
      const nb = k => new Set((o.segs || []).flatMap(([p, q]) => p === k ? [q] : q === k ? [p] : [])), na = nb(a), third = [...nb(b)].find(k => na.has(k)), ref = op.ref ? T(P[op.ref]) : third ? T(P[third]) : cen;
      if ((ref[0] - c[0]) * n[0] + (ref[1] - c[1]) * n[1] > 0) n = mul(n, -1); if (op.side === -1) n = mul(n, -1);
      const z = 14, off = 7 + (TW(op.lab, z) / 2) * Math.abs(n[0]) + z * 0.55 * Math.abs(n[1]) + (op.ticks ? 3 : 0);
      txt(c[0] + n[0] * off, c[1] + n[1] * off, op.lab, { size: z, fill: op.lcolor || C.ink }); });
    // point labels in the widest gap between the lines that meet there
    Object.keys(P).forEach(k => { if (hidden(k) || (o.hide || []).includes(k)) return; const p = T(P[k]), dirs = [];
      (o.segs || []).forEach(([a, b]) => { const A = T(P[a]), B = T(P[b]);
        if (a === k) dirs.push(Math.atan2(B[1] - p[1], B[0] - p[0])); else if (b === k) dirs.push(Math.atan2(A[1] - p[1], A[0] - p[0]));
        else { const L2 = (B[0] - A[0]) ** 2 + (B[1] - A[1]) ** 2, t = ((p[0] - A[0]) * (B[0] - A[0]) + (p[1] - A[1]) * (B[1] - A[1])) / L2; if (t > 0.001 && t < 0.999 && dist(p, lerp(A, B, t)) < 0.8) dirs.push(Math.atan2(B[1] - p[1], B[0] - p[0]), Math.atan2(A[1] - p[1], A[0] - p[0])); } });
      albl.filter(a => a.v === k).forEach(a => { const q = a.op.out ? a.m + Math.PI : a.m; dirs.push(Math.atan2(Math.sin(q), Math.cos(q))); });
      let m, h = Math.PI;
      if (!dirs.length) m = Math.atan2(p[1] - cen[1], p[0] - cen[0]);
      else { dirs.sort((x, y) => x - y); let best = -1; dirs.forEach((x, i) => { const y = i + 1 < dirs.length ? dirs[i + 1] : dirs[0] + 2 * Math.PI, g = y - x; if (g > best) { best = g; m = x + g / 2; } }); h = best / 2; }
      const d = Math.min(fitWedge(k, 15, m, h, 8), 34);
      body += V.dot(p[0], p[1], 3.2, C.ink); txt(p[0] + d * Math.cos(m), p[1] + d * Math.sin(m), k, { size: 15, weight: 700 }); });
    (o.text || []).forEach(([q, s, op = {}]) => { const p = T(q); txt(p[0], p[1], s, op); });
    const bx = boxes.map(b => b[0]), by = boxes.map(b => b[1]), x0 = Math.min(...bx) - 6, y0 = Math.min(...by) - 6, w = Math.ceil(Math.max(...bx) + 6 - x0), h2 = Math.ceil(Math.max(...by) + 6 - y0);
    return V.svg(w, h2, `<g transform="translate(${r2(-x0)} ${r2(-y0)})">${body}</g>`, o.label || 'triangle figure');
  };
  // a figure for one triangle {A,B,C} with display names n (canonical → letter)
  const triMarks = (n, sides = {}, angs = {}, labs = {}) => ({
    segs: [['A', 'B'], ['B', 'C'], ['C', 'A']].map(([p, q]) => [n[p], n[q], { ticks: sides[p + q] || sides[q + p] || 0, lab: labs[p + q] ?? labs[q + p] }]),
    angles: 'ABC'.split('').filter(k => angs[k] || labs[k]).map(k => { const [p, q] = 'ABC'.replace(k, '').split(''); return [n[p], n[k], n[q], labs[k] || '', angs[k] === 'R' ? { right: true } : { n: angs[k] || 1 }]; }),
  });
  // two triangles side by side, each turned its own way
  const pairPts = (R, T1, T2, n1, n2) => {
    const a = spin(R, T1), b = spin(R, T2), bb = t => { const v = Object.values(t); return [Math.min(...v.map(p => p[0])), Math.max(...v.map(p => p[0])), Math.min(...v.map(p => p[1])), Math.max(...v.map(p => p[1]))]; };
    const [ax0, ax1, ay0, ay1] = bb(a), [bx0, bx1, by0, by1] = bb(b), gap = 0.5 * Math.max(ax1 - ax0, ay1 - ay0, bx1 - bx0, by1 - by0);
    const dx = ax1 + gap - bx0, dy = (ay0 + ay1) / 2 - (by0 + by1) / 2, P = {};
    for (const k of 'ABC') { P[n1[k]] = a[k]; P[n2[k]] = [b[k][0] + dx, b[k][1] + dy]; } return P;
  };
  const pairFig = (P, n1, n2, m1, m2, lab) => { const t1 = triMarks(n1, ...m1), t2 = triMarks(n2, ...m2); return fig({ pts: P, segs: [...t1.segs, ...t2.segs], angles: [...t1.angles, ...t2.angles], w: 340, label: lab || 'two triangles' }); };
  // a random scalene triangle with angles far enough apart to tell by eye
  const randTri = (R, o = {}) => { let A, B, Cc;
    do { if (o.right) { A = R.int(28, 62); B = 90 - A; Cc = 90; } else { A = R.int(38, 86); B = R.int(38, 86); Cc = 180 - A - B; } } while (Cc < 34 || Cc > 100 || Math.abs(A - B) < 8 || Math.abs(B - Cc) < 8 || Math.abs(A - Cc) < 8);
    return { t: byAngles(B, Cc, 5), A, B, C: Cc }; };
  /* ---------- ordering: every honest order of the proof lines ----------
     deps[i] = indices line i needs. The last line is the conclusion, so it needs everything. */
  const topo = (deps, fixed) => {
    const n = deps.length, out = [], used = Array(n).fill(false), seq = [];
    for (let i = 0; i < fixed; i++) { used[i] = true; seq.push(i); }
    const rec = () => { if (out.length > 400) return; if (seq.length === n) { out.push(seq.slice()); return; }
      for (let i = 0; i < n; i++) if (!used[i] && deps[i].every(d => used[d])) { used[i] = true; seq.push(i); rec(); seq.pop(); used[i] = false; } };
    rec(); return out;
  };
  const orderQ = (R, prompt, lines, deps, explain, o = {}) => {
    const n = lines.length, d = deps.map((x, i) => i === n - 1 ? [...Array(n - 1).keys()] : x), fixed = o.fixed ?? 1;
    const all = topo(d, fixed), canon = [...Array(n).keys()].join();
    if (!all.some(a => a.join() === canon)) throw new Error('canonical order breaks its own dependencies');
    const alts = all.filter(a => a.join() !== canon);
    return E5.order(R, prompt, lines, explain, Object.assign({ fixed }, o.visual ? { visual: o.visual } : {}, alts.length ? { alts } : {}));
  };
    const ang = (c, p) => Math.atan2(p[1] - c[1], p[0] - c[0]) * 180 / Math.PI;
    const md = x => ((x % 360) + 360) % 360;
    const inter = (A, B, Cc, D) => { const d1 = sub(B, A), d2 = sub(D, Cc), den = d1[0] * d2[1] - d1[1] * d2[0]; if (Math.abs(den) < 1e-9) return null; const t = ((Cc[0] - A[0]) * d2[1] - (Cc[1] - A[1]) * d2[0]) / den; return add(A, mul(d1, t)); };
    /* circle figure (promoted from V.8): K.fig plus circles, highlighted arcs, shaded sectors/segments/rings and extra dots.
       o: {pts, circ:[{c, r, color, dash}], arcs:[{c, r, a, b, big, thru, color, lab}], fills:[{c, r, a, b, big, thru, kind:'sector'|'segment'|'ring', r2, color, op}],
           paths:[(T, sc) => svg], dots:[[x,y]], segs, angles, text, arrows, polys, w, center, hide, label}. Points on a circle get invisible tangent stubs so labels sit off the curve. */
  const cfig = o => {
    const W = o.w || 260, pad = 30, Pt = Object.assign({}, o.pts), segs = (o.segs || []).slice(), at = p => typeof p === 'string' ? Pt[p] : p;
    const cs = (o.circ || []).map(c => Object.assign({}, c, { c: at(c.c) }));
    cs.forEach((c, i) => [[1, 0], [0, 1], [-1, 0], [0, -1]].forEach((d, j) => Pt[`_b${i}_${j}`] = add(c.c, mul(d, c.r))));
    Object.keys(o.pts).forEach(k => { if (k[0] === '_') return; cs.forEach((c, i) => { const p = o.pts[k]; if (Math.abs(dist(p, c.c) - c.r) > 1e-6) return;
      const u = unit(sub(p, c.c)), t = [-u[1], u[0]], e = c.r * 0.15; Pt[`_t${k}${i}a`] = add(p, mul(t, e)); Pt[`_t${k}${i}b`] = sub(p, mul(t, e));
      segs.push([k, `_t${k}${i}a`, { color: 'none' }], [k, `_t${k}${i}b`, { color: 'none' }]); }); });
    // keep every drawn arc inside the picture
    const span0 = (c, a, b, big, thru) => { const ta = ang(c, a), tb = ang(c, b); let s = md(tb - ta), t1 = ta; const flip = thru ? md(ang(c, thru) - ta) > s : big ? s < 180 : s > 180; if (flip) { t1 = tb; s = 360 - s; } return [t1, s]; };
    [...(o.arcs || []), ...(o.fills || [])].forEach((a, i) => { const c = at(a.c), [t1, s] = span0(c, at(a.a), at(a.b), a.big, a.thru && at(a.thru)); for (let j = 0; j <= 12; j++) Pt[`_s${i}_${j}`] = add(c, polar(a.r, t1 + s * j / 12)); });
    const all = Object.values(Pt), xs = all.map(p => p[0]), ys = all.map(p => p[1]), mnx = Math.min(...xs), mxx = Math.max(...xs), mny = Math.min(...ys), mxy = Math.max(...ys);
    const sc = (W - 2 * pad) / Math.max(1e-9, mxx - mnx, mxy - mny), H = Math.round((mxy - mny) * sc + 2 * pad);
    const T = p => [r2(pad + (p[0] - mnx) * sc), r2(H - pad - (p[1] - mny) * sc)];
    // which way round: start angle and ccw span of the chosen arc from a to b
    const span = (c, a, b, big, thru) => { const ta = ang(c, a), tb = ang(c, b); let s = md(tb - ta), t1 = ta;
      const flip = thru ? md(ang(c, thru) - ta) > s : big ? s < 180 : s > 180; if (flip) { t1 = tb; s = 360 - s; } return [t1, s]; };
    const arcPath = (c, r, t1, s, move = true, rev = false) => { const p1 = T(add(c, polar(r, rev ? t1 + s : t1))), p2 = T(add(c, polar(r, rev ? t1 : t1 + s))), rs = r2(r * sc);
      return `${move ? 'M' : 'L'}${p1[0]} ${p1[1]} A${rs} ${rs} 0 ${s > 180 ? 1 : 0} ${rev ? 1 : 0} ${p2[0]} ${p2[1]}`; };
    let extra = '';
    (o.fills || []).forEach(f => { const c = at(f.c), [t1, s] = span(c, at(f.a), at(f.b), f.big, f.thru && at(f.thru)), Tc = T(c); let d;
      if (f.kind === 'segment') d = arcPath(c, f.r, t1, s) + ' Z';
      else if (f.kind === 'ring') d = arcPath(c, f.r, t1, s) + ' ' + arcPath(c, f.r2, t1, s, false, true) + ' Z';
      else d = `M${Tc[0]} ${Tc[1]} ` + arcPath(c, f.r, t1, s, false) + ' Z';
      extra += `<path d="${d}" fill="${f.color || C.blue}" fill-opacity="${f.op ?? 0.25}" stroke="none"/>`; });
    (o.paths || []).forEach(p => { extra += p(T, sc); });
    cs.forEach(c => { const Tc = T(c.c); extra += `<circle cx="${Tc[0]}" cy="${Tc[1]}" r="${r2(c.r * sc)}" fill="none" stroke="${c.color || C.ink}" stroke-width="2" ${c.dash ? 'stroke-dasharray="6 5"' : ''}/>`; });
    const text = (o.text || []).slice();
    (o.arcs || []).forEach(a => { const c = at(a.c), [t1, s] = span(c, at(a.a), at(a.b), a.big, a.thru && at(a.thru)), col = a.color || C.blue;
      extra += `<path d="${arcPath(c, a.r, t1, s)}" fill="none" stroke="${col}" stroke-width="${a.width || 4}" stroke-linecap="round" opacity="0.85"/>`;
      if (a.lab) { const m = (t1 + s / 2) * Math.PI / 180, z = 13.5, hw = TW(a.lab, z) / 2, hh = z * 0.6, off = (9 + hw * Math.abs(Math.cos(m)) + hh * Math.abs(Math.sin(m))) / sc;
        text.push([add(c, polar(a.r + off, t1 + s / 2)), a.lab, { fill: col === C.ink ? C.ink : a.lcol || '#2F6DB0', size: z }]); } });
    (o.dots || []).forEach(p => { const q = T(p); extra += V.dot(q[0], q[1], 2.8, C.ink); });
    const svg = fig({ pts: Pt, segs, angles: o.angles, arrows: o.arrows, polys: o.polys, text, w: W, center: o.center, hide: o.hide, label: o.label || 'circle figure' });
    return svg.replace(/(<g transform="translate\([^)]*\)">)/, `$1${extra}`);
  };
    return { ang, md, inter, cfig, r2, rad, dg, dist, lerp, mid, add, sub, mul, unit, polar, ang3, foot, bySides, byAngles, circum, incen, cen3, xform, spin, POOL, lets, trio, rnF, renamePts, TW, fig, triMarks, pairPts, pairFig, randTri, topo, orderQ };
  })();
})(typeof window !== 'undefined' ? window : globalThis);
