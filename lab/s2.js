
/* Mathera · Era III question core
   Shared by every unit file. Works in the browser (window.E3) and in Node (globalThis.E3).

   QUESTION FORMAT (what every step generator returns)
   {
     prompt:  string   short plain sentence; may contain <b>..</b>. No lore needed to answer.
     visual?: string   one SVG string (use V.* helpers), shown above the answer area
     kind:    'num' | 'choice'
     // kind 'num'   → fields (1–4), each ONE of:
     //    {label?, ans:number}                      whole number or decimal (≤ 3 decimal places); typed 2.50 = 2.5
     //    {label?, frac:[n,d], form?:'any'|'simplest'|'mixed'|'improper'}   fraction answer
     //       'any'      any equal fraction, mixed number or whole number is accepted (default)
     //       'simplest' must be in lowest terms (a whole number, a/b or w a/b all fine if fully reduced)
     //       'mixed'    must be a whole number or a mixed number w a/b with a < b, reduced
     //       'improper' must be written a/b (not mixed), any equal fraction
     //    ERA III: answers may be negative (ans < 0, or frac n < 0). Typed "-3", "−3/4", "−1 1/2", "25%", "x = 4" all parse.
     //    {label?, expr:'3x+6', form?:'any'|'expanded'|'factored'|'simplified'}   algebra answer, checked by
     //       evaluating both at random points. 'expanded' = no brackets; 'factored' = a product at the top level;
     //       'simplified' = no brackets and no more terms than the target. Write expr in plain ASCII: 3x+6, 2(x-1), x^2-4, (a+b)/2
     // kind 'choice'→ choices: string[] (plain text OR SVG strings), ans: index of the right one
     explain: string   one or two short sentences shown after answering
   }
   A step generator is  (R, O) => question   where R is the seeded random helper and
   O is the House Rules options object ({coins:'US'|'THB', units:'metric'|'imperial', clock:'12h'|'24h'}).
*/
(function (G) {
  const E3 = G.E3 = G.E3 || {};
  E3.skills = E3.skills || [];
  E3.byId = E3.byId || {};

  /* ---------- registry ---------- */
  // E3.skill({id:'I.1.01', name:'Count objects one by one', steps:{a:{t:'touch and count to 3', g:(R,O)=>q}, b:..., c:..., d:...}})
  E3.skill = function (def) {
    if (E3.byId[def.id]) throw new Error('duplicate skill ' + def.id);
    E3.skills.push(def); E3.byId[def.id] = def; return def;
  };
  E3.OPTS = { coins: 'US', units: 'metric', clock: '12h' };

  /* ---------- seeded random ---------- */
  E3.rng = function (seed) {
    let a = (seed >>> 0) || 1;
    const next = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    const R = {
      f: next,
      int: (lo, hi) => lo + Math.floor(next() * (hi - lo + 1)),
      pick: arr => arr[Math.floor(next() * arr.length)],
      bool: (p = 0.5) => next() < p,
      shuffle: arr => { const b = arr.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(next() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; },
      sample: (arr, k) => R.shuffle(arr).slice(0, k),
      // k distinct ints in [lo,hi]
      distinct: (lo, hi, k) => R.sample(Array.from({ length: hi - lo + 1 }, (_, i) => lo + i), k),
    };
    return R;
  };

  /* ---------- question builders ---------- */
  // numeric answer(s)
  E3.num = (prompt, ans, explain, extra = {}) => Object.assign({
    prompt, kind: 'num', explain,
    fields: Array.isArray(ans) ? ans.map(a => typeof a === 'object' ? a : { ans: a }) : [{ ans }],
  }, extra);
  // multiple choice: correct + distractors (duplicates of correct or each other are removed), shuffled
  E3.choice = (R, prompt, correct, distractors, explain, extra = {}) => {
    const seen = new Set([String(correct)]); const ds = [];
    for (const d of distractors) { const k = String(d); if (!seen.has(k)) { seen.add(k); ds.push(d); } }
    const all = R.shuffle([correct, ...ds]);
    return Object.assign({ prompt, kind: 'choice', choices: all.map(String), ans: all.findIndex(x => String(x) === String(correct)), explain }, extra);
  };
  // fixed-order choice (e.g. 'odd','even' or '<','=','>') — keeps the given order
  E3.choiceFixed = (prompt, options, correctIndex, explain, extra = {}) =>
    Object.assign({ prompt, kind: 'choice', choices: options.map(String), ans: correctIndex, explain }, extra);
  E3.tf = (prompt, isTrue, explain, extra = {}) => E3.choiceFixed(prompt, ['True', 'False'], isTrue ? 0 : 1, explain, extra);

  /* ---------- number words ---------- */
  const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  E3.words = function words(n) {
    if (n < 20) return ONES[n];
    if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? '-' + ONES[n % 10] : '');
    if (n < 1000) return ONES[Math.floor(n / 100)] + ' hundred' + (n % 100 ? ' ' + words(n % 100) : '');
    if (n === 1000) return 'one thousand';
    throw new Error('words: out of range ' + n);
  };
  E3.ordinal = n => ['zeroth', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth'][n];
  E3.plural = (n, one, many) => n + ' ' + (n === 1 ? one : (many || one + 's'));

  /* ---------- palette ---------- */
  const C = E3.C = {
    ink: '#15171C', muted: '#646A75', line: '#C9CDD4', faint: '#EEF0F3', paper: '#FFFFFF',
    red: '#E0735A', amber: '#E2A13B', olive: '#9BAE45', teal: '#3E9D8F', blue: '#4A8FD1', violet: '#8A6CC9', pink: '#C9628E',
  };
  C.set = [C.red, C.blue, C.amber, C.teal, C.violet, C.olive, C.pink];
  E3.colorName = { [C.red]: 'red', [C.blue]: 'blue', [C.amber]: 'yellow', [C.teal]: 'green', [C.violet]: 'purple', [C.olive]: 'olive', [C.pink]: 'pink' };

  /* ---------- SVG visuals ---------- */
  const V = E3.V = {};
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  V.esc = esc;
  // wrapper: w,h are the viewBox size; the page scales it to fit (max display width = w px)
  V.svg = (w, h, body, label = '') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${esc(label)}" style="max-width:100%;height:auto" font-family="system-ui,sans-serif">${body}</svg>`;
  V.text = (x, y, s, o = {}) => `<text x="${x}" y="${y}" font-size="${o.size || 16}" fill="${o.fill || C.ink}" text-anchor="${o.anchor || 'middle'}" dominant-baseline="central" font-weight="${o.weight || 500}">${esc(s)}</text>`;
  V.dot = (x, y, r, fill) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`;

  // n dots. layout: 'row' | 'grid' (rows of 5) | 'scatter' (seeded by R) | 'dice' (1–6) | 'fingers' (1–10: two hands of 5 bars)
  V.dots = function (n, o = {}) {
    const r = o.r || 11, gap = r * 2 + 8, fill = o.color || C.red, lay = o.layout || 'row';
    if (lay === 'dice') {
      const P = { 1: [[1, 1]], 2: [[0, 0], [2, 2]], 3: [[0, 0], [1, 1], [2, 2]], 4: [[0, 0], [2, 0], [0, 2], [2, 2]], 5: [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]], 6: [[0, 0], [2, 0], [0, 1], [2, 1], [0, 2], [2, 2]] }[n];
      if (!P) throw new Error('dice needs 1-6');
      const s = 110, u = 30;
      return V.svg(s, s, `<rect x="4" y="4" width="${s - 8}" height="${s - 8}" rx="18" fill="${C.paper}" stroke="${C.ink}" stroke-width="3"/>` + P.map(([i, j]) => V.dot(25 + i * u, 25 + j * u, 10, C.ink)).join(''), `dice showing ${n}`);
    }
    if (lay === 'fingers') {
      // simple hands: each finger a rounded bar; raised = colored
      let body = '';
      const hc = n > 5 ? 2 : 1;
      for (let h = 0; h < hc; h++) {
        const up = Math.min(5, n - h * 5), x0 = 10 + h * 130;
        body += `<rect x="${x0}" y="70" width="110" height="46" rx="18" fill="${C.faint}" stroke="${C.line}"/>`;
        for (let f = 0; f < 5; f++) {
          const raised = f < up, fx = x0 + 8 + f * 20, len = raised ? 58 : 20;
          body += `<rect x="${fx}" y="${74 - len}" width="16" height="${len + 8}" rx="8" fill="${raised ? fill : C.faint}" stroke="${raised ? fill : C.line}"/>`;
        }
      }
      return V.svg(hc * 130 + 10, 124, body, `${n} fingers`);
    }
    let pts = [];
    if (lay === 'row') pts = Array.from({ length: n }, (_, i) => [gap / 2 + i * gap, gap / 2]);
    else if (lay === 'grid') { const per = o.per || 5; pts = Array.from({ length: n }, (_, i) => [gap / 2 + (i % per) * gap, gap / 2 + Math.floor(i / per) * gap]); }
    else if (lay === 'scatter') {
      const R = o.R || E3.rng(n * 7919 + 1), W = o.w || 300, H = o.h || 160;
      let tries = 0;
      while (pts.length < n && tries < 5000) { tries++; const p = [r + 4 + R.f() * (W - 2 * r - 8), r + 4 + R.f() * (H - 2 * r - 8)]; if (pts.every(q => Math.hypot(q[0] - p[0], q[1] - p[1]) > 2 * r + 6)) pts.push(p); }
      if (pts.length < n) throw new Error('scatter could not place ' + n);
      return V.svg(W, H, pts.map((p, i) => V.dot(p[0], p[1], r, Array.isArray(fill) ? fill[i] : fill)).join(''), `${n} dots`);
    }
    const W = Math.max(...pts.map(p => p[0])) + gap / 2, H = Math.max(...pts.map(p => p[1])) + gap / 2;
    return V.svg(Math.max(W, 1), Math.max(H, 1), pts.map((p, i) => V.dot(p[0], p[1], r, Array.isArray(fill) ? fill[i] : fill)).join(''), `${n} dots`);
  };

  // five-frame or ten-frame(s). n = red counters, n2 = blue counters after them. frames>1 draws several ten-frames.
  V.frame = function (n, o = {}) {
    const size = o.size || 10, n2 = o.n2 || 0, cols = 5, rows = size / 5, cell = 40, frames = o.frames || Math.max(1, Math.ceil((n + n2) / size));
    let body = '', k = 0;
    for (let f = 0; f < frames; f++) {
      const y0 = 4 + f * (rows * cell + 12);
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const x = 4 + c * cell, y = y0 + r * cell;
        body += `<rect x="${x}" y="${y}" width="${cell}" height="${cell}" fill="${C.paper}" stroke="${C.ink}" stroke-width="2"/>`;
        if (k < n) body += V.dot(x + cell / 2, y + cell / 2, 14, o.color || C.red);
        else if (k < n + n2) body += V.dot(x + cell / 2, y + cell / 2, 14, o.color2 || C.blue);
        k++;
      }
    }
    return V.svg(cols * cell + 8, frames * (rows * cell + 12) - 4, body, `${size === 5 ? 'five' : 'ten'}-frame`);
  };

  // number line. o: from,to,step(1), labels: 'all'|'ends'|'tens'|array, marks: [values to dot], ask: value to mark '?',
  // hide: [values whose labels are blank], jumps: [[from,to],...] arcs, width
  V.numline = function (o) {
    const from = o.from, to = o.to, step = o.step || 1, W = o.width || Math.min(640, Math.max(300, (to - from) / step * 36 + 40)), pad = 22, H = o.jumps && o.jumps.length ? 110 : 70, y = H - 40;
    const X = v => pad + (v - from) / (to - from) * (W - 2 * pad);
    let body = `<line x1="${pad - 10}" y1="${y}" x2="${W - pad + 10}" y2="${y}" stroke="${C.ink}" stroke-width="2"/>`;
    const lab = v => { const L = o.labels || 'all'; if ((o.hide || []).includes(v)) return false; if (Array.isArray(L)) return L.includes(v); if (L === 'ends') return v === from || v === to; if (L === 'tens') return v % 10 === 0; if (L === 'fives') return v % 5 === 0; if (L === 'none') return false; return true; };
    for (let v = from; v <= to + 1e-9; v += step) {
      body += `<line x1="${X(v)}" y1="${y - 7}" x2="${X(v)}" y2="${y + 7}" stroke="${C.ink}" stroke-width="2"/>`;
      if (lab(v)) body += V.text(X(v), y + 22, v, { size: 14 });
    }
    (o.marks || []).forEach(v => body += V.dot(X(v), y, 8, C.red));
    if (o.ask !== undefined) body += `<circle cx="${X(o.ask)}" cy="${y}" r="9" fill="${C.amber}"/>` + V.text(X(o.ask), y + 22, '?', { size: 15, weight: 700, fill: C.ink });
    (o.jumps || []).forEach(([a, b]) => { const x1 = X(a), x2 = X(b), mx = (x1 + x2) / 2, hh = Math.min(50, 14 + Math.abs(x2 - x1) * 0.35); body += `<path d="M${x1} ${y - 8} Q${mx} ${y - 8 - hh * 2} ${x2} ${y - 8}" fill="none" stroke="${C.teal}" stroke-width="2.5"/>` + `<circle cx="${x2}" cy="${y - 8}" r="3.5" fill="${C.teal}"/>`; });
    return V.svg(W, H, body, `number line from ${from} to ${to}`);
  };

  // a horizontal row of arbitrary small SVG fragments; each item drawn by fn(x,y,i) in a cell
  V.row = function (count, cellW, cellH, fn, label = '') {
    let body = ''; for (let i = 0; i < count; i++) body += fn(i * cellW + cellW / 2, cellH / 2, i);
    return V.svg(Math.max(1, count * cellW), cellH, body, label);
  };
  // place a V.svg string inside another at (x,y)
  V.nest = (svg, x, y) => svg.replace(/ style="[^"]*"/, '').replace('<svg ', `<svg x="${x}" y="${y}" `);
  // stack several SVG strings vertically with optional captions → one SVG (nested svg elements)
  V.stack = function (parts, o = {}) {
    let y = 0, body = '', W = 0; const gap = o.gap || 10;
    parts.forEach(p => {
      const cap = p.caption; const svg = p.svg || p;
      const m = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(svg); const w = +m[1], h = +m[2];
      if (cap) { body += V.text(0, y + 10, cap, { anchor: 'start', size: 14, fill: C.muted }); y += 24; }
      body += V.nest(svg, 0, y); y += h + gap; W = Math.max(W, w, cap ? 200 : 0);
    });
    return V.svg(W, y - gap, body, o.label || '');
  };
  // side by side
  V.side = function (parts, o = {}) {
    let x = 0, body = '', H = 0; const gap = o.gap || 24;
    parts.forEach(p => {
      const cap = p.caption; const svg = p.svg || p;
      const m = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(svg); const w = +m[1], h = +m[2];
      const top = cap ? 26 : 0; if (cap) body += V.text(x + w / 2, 10, cap, { size: 15, weight: 700 });
      body += V.nest(svg, x, top); x += w + gap; H = Math.max(H, h + top);
    });
    return V.svg(x - gap, H, body, o.label || '');
  };


  /* ---------- answers: parse, check, show ---------- */
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };
  E3.gcd = gcd; E3.lcm = (a, b) => a / gcd(a, b) * b;
  E3.reduce = (n, d) => { const g = gcd(n, d); return [n / g, d / g]; };
  // parse typed text → {n, d, kind} (exact rational) or null. Accepts 12 · 1,200 · 2.5 · .5 · 3/4 · 1 3/4
  E3.parse = function (raw) {
    let s = String(raw).trim().replace(/[−–]/g, '-').replace(/,(?=\d{3}\b)/g, '').replace(/\s+/g, ' ');
    s = s.replace(/^[a-z]\s*=\s*/i, '').replace(/\s*%$/, '');
    if (/^[-+]/.test(s)) { const neg = s[0] === '-'; const p = E3.parse(s.slice(1).trim()); if (!p || /^[-+]/.test(s.slice(1).trim())) return null; if (neg) p.n = -p.n; p.neg = neg; return p; }
    let m;
    if ((m = /^(\d+)$/.exec(s))) return { n: +m[1], d: 1, kind: 'int' };
    if ((m = /^(\d*)\.(\d+)$/.exec(s))) { const d = 10 ** m[2].length; return { n: (+(m[1] || 0)) * d + +m[2], d, kind: 'dec' }; }
    if ((m = /^(\d+)\.$/.exec(s))) return { n: +m[1], d: 1, kind: 'dec' };
    if ((m = /^(\d+)\s*\/\s*(\d+)$/.exec(s))) { if (+m[2] === 0) return null; return { n: +m[1], d: +m[2], kind: 'frac', a: +m[1], b: +m[2] }; }
    if ((m = /^(\d+) (\d+)\s*\/\s*(\d+)$/.exec(s))) { if (+m[3] === 0) return null; return { n: +m[1] * +m[3] + +m[2], d: +m[3], kind: 'mixed', w: +m[1], a: +m[2], b: +m[3] }; }
    return null;
  };
  // check one field against typed text → true/false (null if unreadable)
  E3.check = function (f, raw) {
    if (f.expr !== undefined) return E3.checkExpr(f, raw);
    const p = E3.parse(raw); if (!p) return null;
    if (!f.frac) { // decimal / whole answer: exact value match
      const target = Math.round(f.ans * 1000);
      return p.n * 1000 === target * p.d;
    }
    const [n, d] = f.frac; if (p.n * d !== n * p.d) return false;
    const form = f.form || 'any';
    if (form === 'any') return p.kind !== 'dec' || d === 1 || true;
    if (form === 'improper') return p.kind === 'frac' || (p.kind === 'int' && n % d === 0);
    if (form === 'simplest') {
      if (p.kind === 'int') return true;
      if (p.kind === 'frac') return gcd(p.a, p.b) === 1 && p.b !== 1;
      if (p.kind === 'mixed') return p.a > 0 && p.a < p.b && gcd(p.a, p.b) === 1;
      return false;
    }
    if (form === 'mixed') {
      if (p.kind === 'int') return true;
      if (p.kind === 'mixed') return p.a > 0 && p.a < p.b && gcd(p.a, p.b) === 1;
      if (p.kind === 'frac') return p.a < p.b && gcd(p.a, p.b) === 1; // a proper fraction is already "mixed" with 0 wholes
      return false;
    }
    return false;
  };
  // how to write the right answer in feedback
  E3.show = function (f) {
    if (f.expr !== undefined) return E3.exprShow(f.expr);
    if (!f.frac) return E3.fmt(f.ans);
    const sg = f.frac[0] < 0 ? '−' : '', n = Math.abs(f.frac[0]), d = f.frac[1], form = f.form || 'any', [rn, rd] = E3.reduce(n, d);
    const simple = sg + (rd === 1 ? String(rn) : rn > rd ? `${Math.floor(rn / rd)} ${rn % rd}/${rd}` : `${rn}/${rd}`);
    if (form === 'improper') return sg + (rd === 1 ? String(rn) : `${rn}/${rd}`);
    if (rd === 1) return sg + String(rn);
    if (form === 'any') { const raw = sg + (d === 1 ? String(n) : `${n}/${d}`); return raw === simple ? raw : `${raw} = ${simple}`; }
    if (form === 'simplest' && rn > rd) return `${sg}${rn}/${rd} = ${simple}`;
    return simple;
  };
  // number formatting: thousands commas, up to 3 decimals, no float noise
  E3.fmt = function (x, o = {}) {
    const neg = x < 0; x = Math.abs(x);
    let s = o.dp !== undefined ? x.toFixed(o.dp) : String(Math.round(x * 1000) / 1000);
    let [i, f] = s.split('.'); if (o.commas !== false && i.length > 4) i = i.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return (neg ? '−' : '') + i + (f ? '.' + f : '');
  };
  E3.frac = (n, d, form) => ({ frac: [n, d], form: form || 'any' });
  // HTML for a stacked fraction inside prompts/choices: E3.fh(3,4) → <span class="fr">…</span>; plain fallback a/b in tests
  E3.fh = (n, d, w) => `${w ? w + ' ' : ''}<span class="fr"><sup>${n}</sup>⁄<sub>${d}</sub></span>`;


  /* ---------- algebra: parse and compare expressions ---------- */
  // Grammar: sum := term (('+'|'-') term)* ; term := unary (('*'|'/'|implicit) unary)* ; unary := ('-'|'+') unary | power ;
  // power := atom ('^' unary)? ; atom := number | letter | '(' sum ')'
  E3.exprParse = function (raw) {
    const s = String(raw).replace(/[−–]/g, '-').replace(/[×·⋅∙]/g, '*').replace(/÷/g, '/').replace(/²/g, '^2').replace(/³/g, '^3').replace(/\s+/g, '');
    if (!s || /[^0-9a-zA-Z.+\-*/^()]/.test(s)) return null;
    let i = 0; const peek = () => s[i];
    function sum() { let n = term(); while (peek() === '+' || peek() === '-') { const op = s[i++]; const r = term(); if (!r) return null; n = { op, a: n, b: r }; if (!n.a) return null; } return n; }
    function term() { let n = unary(); if (!n) return null;
      for (;;) { const c = peek();
        if (c === '*' || c === '/') { i++; const r = unary(); if (!r) return null; n = { op: c, a: n, b: r }; }
        else if (c && (/[a-zA-Z(0-9.]/.test(c))) { const r = power(); if (!r) return null; n = { op: '*', a: n, b: r, imp: true }; }
        else return n; } }
    function unary() { if (peek() === '-') { i++; const u = unary(); return u && { op: 'neg', a: u }; } if (peek() === '+') { i++; return unary(); } return power(); }
    function power() { const b = atom(); if (!b) return null; if (peek() === '^') { i++; const e = unary(); if (!e) return null; return { op: '^', a: b, b: e }; } return b; }
    function atom() { const c = peek();
      if (c === '(') { i++; const n = sum(); if (!n || s[i] !== ')') return null; i++; return { op: '()', a: n }; }
      const m = /^(\d+\.?\d*|\.\d+)/.exec(s.slice(i)); if (m) { i += m[0].length; return { op: 'n', v: parseFloat(m[0]) }; }
      if (c && /[a-zA-Z]/.test(c)) { i++; return { op: 'v', v: c }; }
      return null; }
    const t = sum(); return t && i === s.length ? t : null;
  };
  const evalT = (t, env) => { switch (t.op) {
    case 'n': return t.v; case 'v': return env[t.v] === undefined ? NaN : env[t.v]; case '()': return evalT(t.a, env); case 'neg': return -evalT(t.a, env);
    case '+': return evalT(t.a, env) + evalT(t.b, env); case '-': return evalT(t.a, env) - evalT(t.b, env);
    case '*': return evalT(t.a, env) * evalT(t.b, env); case '/': return evalT(t.a, env) / evalT(t.b, env); case '^': return Math.pow(evalT(t.a, env), evalT(t.b, env)); } };
  const varsOf = (t, acc = new Set()) => { if (t.op === 'v') acc.add(t.v); ['a', 'b'].forEach(k => t[k] && typeof t[k] === 'object' && varsOf(t[k], acc)); return acc; };
  const hasParen = t => t.op === '()' || ['a', 'b'].some(k => t[k] && typeof t[k] === 'object' && hasParen(t[k]));
  const topTerms = t => (t.op === '+' || t.op === '-') ? topTerms(t.a) + topTerms(t.b) : 1;
  const isProduct = t => { if (t.op === 'neg') return isProduct(t.a); return t.op === '*' && (hasParen(t.a) || hasParen(t.b)) || t.op === '^' && t.a.op === '()'; };
  E3.checkExpr = function (f, raw) {
    let txt = String(raw).trim().replace(/^[a-zA-Z]\s*=\s*/, '').replace(/(\d),(\d)(?!\d\d)/g, '$1.$2');
    let tgt = f.expr;
    const tv = new Set((tgt.match(/[a-zA-Z]/g) || [])), lower = new Set([...tv].map(c => c.toLowerCase()));
    if (lower.size === tv.size) { txt = txt.toLowerCase(); tgt = tgt.toLowerCase(); } // no a/A clash in the target: case doesn't matter
    const A = E3.exprParse(txt), B = E3.exprParse(tgt); if (!A || !B) return A ? false : null;
    const va = varsOf(A), vb = varsOf(B); for (const v of va) if (!vb.has(v)) return false;
    const vars = [...vb]; let seed = 12345, ok = 0;
    const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
    for (let k = 0; k < 40 && ok < 6; k++) {
      const env = {}; vars.forEach(v => env[v] = Math.round((rnd() * 6 - 3) * 1000) / 1000 + 0.137 * (k + 1));
      const x = evalT(A, env), y = evalT(B, env);
      if (!isFinite(y)) continue; if (!isFinite(x)) return false;
      if (Math.abs(x - y) > 1e-7 * Math.max(1, Math.abs(y))) return false; ok++;
    }
    if (ok < 3) return false;
    const form = f.form || 'any';
    if (form === 'expanded') return !hasParen(A);
    if (form === 'factored') return isProduct(A);
    if (form === 'simplified') return !hasParen(A) && topTerms(A) <= topTerms(B);
    return true;
  };
  // pretty text for an expr string: 3x+6 → 3x + 6, - → −, * → ·
  E3.exprShow = e => String(e).replace(/\s+/g, '').replace(/([^(^*/+\-])([+\-])/g, '$1 $2 ').replace(/-/g, '−').replace(/\*/g, '·');
  // HTML for math text in prompts: italic single-letter variables, real minus, superscripts. E3.m('3x^2 - 2y') → 3<i>x</i><sup>2</sup> − 2<i>y</i>
  E3.m = function (str) {
    return String(str).replace(/\^\{([^}]*)\}|\^(-?\d+|[a-z])/g, (_, a, b) => `<sup>${a !== undefined ? a : b}</sup>`)
      .replace(/(^|[^a-zA-Z<\/])([a-zA-Z])(?![a-zA-Z>])/g, '$1<i>$2</i>').replace(/(\S)-(\S)/g, '$1 − $2').replace(/ - /g, ' − ').replace(/^-|(\(|\s)-/g, (x) => x.replace('-', '−')).replace(/\*/g, ' · ');
  };

  /* ---------- coordinate plane (all four quadrants) ---------- */
  // o: min,max (default -6..6), size (px per unit, 28), points:[[x,y,'A']], segments:[[x1,y1,x2,y2]], lines:[{m,b}] or [{x:3}] (vertical), polys:[[[x,y],…]], labels (axis numbers: true)
  V.plane = function (o = {}) {
    const lo = o.min ?? -6, hi = o.max ?? 6, u = o.size || 28, W = (hi - lo) * u + 40, pad = 20;
    const X = v => pad + (v - lo) * u, Y = v => pad + (hi - v) * u;
    let b = '';
    for (let v = lo; v <= hi; v++) { b += `<line x1="${X(v)}" y1="${Y(lo)}" x2="${X(v)}" y2="${Y(hi)}" stroke="${C.faint}" stroke-width="1"/><line x1="${X(lo)}" y1="${Y(v)}" x2="${X(hi)}" y2="${Y(v)}" stroke="${C.faint}" stroke-width="1"/>`; }
    if (lo <= 0 && hi >= 0) b += `<line x1="${X(0)}" y1="${Y(lo) + 6}" x2="${X(0)}" y2="${Y(hi) - 6}" stroke="${C.ink}" stroke-width="1.8"/><line x1="${X(lo) - 6}" y1="${Y(0)}" x2="${X(hi) + 6}" y2="${Y(0)}" stroke="${C.ink}" stroke-width="1.8"/>` + V.text(X(hi) + 12, Y(0), 'x', { size: 14, weight: 600 }) + V.text(X(0), Y(hi) - 12, 'y', { size: 14, weight: 600 });
    if (o.labels !== false) for (let v = lo; v <= hi; v++) { if (v === 0) continue; const step = (hi - lo) > 12 ? 2 : 1; if (v % step) continue;
      b += V.text(X(v), Y(0) + 13, String(v).replace('-', '−'), { size: 11, fill: C.muted }) + V.text(X(0) - 11, Y(v), String(v).replace('-', '−'), { size: 11, fill: C.muted }); }
    (o.polys || []).forEach((P, k) => b += `<polygon points="${P.map(([x, y]) => X(x) + ',' + Y(y)).join(' ')}" fill="${C.set[k % 7]}33" stroke="${C.set[k % 7]}" stroke-width="2"/>`);
    const clip = (m, c) => { const pts = []; [[lo, m * lo + c], [hi, m * hi + c]].forEach(p => pts.push(p)); if (m) { [(lo - c) / m, (hi - c) / m].forEach(x => pts.push([x, m * x + c])); } return pts.filter(([x, y]) => x >= lo - 1e-9 && x <= hi + 1e-9 && y >= lo - 1e-9 && y <= hi + 1e-9).sort((a, b) => a[0] - b[0]); };
    (o.lines || []).forEach((L, k) => { const col = L.color || C.set[(k + 1) % 7];
      if (L.x !== undefined) b += `<line x1="${X(L.x)}" y1="${Y(lo)}" x2="${X(L.x)}" y2="${Y(hi)}" stroke="${col}" stroke-width="2.5"/>`;
      else { const P = clip(L.m, L.b); if (P.length >= 2) b += `<line x1="${X(P[0][0])}" y1="${Y(P[0][1])}" x2="${X(P[P.length - 1][0])}" y2="${Y(P[P.length - 1][1])}" stroke="${col}" stroke-width="2.5"/>`; } });
    (o.segments || []).forEach(([a, c, d, e]) => b += `<line x1="${X(a)}" y1="${Y(c)}" x2="${X(d)}" y2="${Y(e)}" stroke="${C.blue}" stroke-width="2.5"/>`);
    (o.points || []).forEach(([x, y, t], k) => { b += V.dot(X(x), Y(y), 5, o.pointColor || C.red); if (t) b += V.text(X(x) + 10, Y(y) - 10, t, { size: 14, weight: 700 }); });
    return V.svg(W, W, b, 'coordinate plane');
  };

  /* ---------- shared Era II visuals ---------- */
  // fraction bar: d equal parts, first n shaded (n may exceed d → several bars). o: w, h, color, label (bool: write 1/d in each part)
  V.fbar = function (n, d, o = {}) {
    const W = o.w || 360, H = o.h || 44, bars = Math.max(1, Math.ceil(n / d - 1e-9)), col = o.color || C.blue, gap = 10;
    let body = '';
    for (let b = 0; b < (o.bars || bars); b++) {
      const y = 2 + b * (H + gap);
      for (let i = 0; i < d; i++) {
        const k = b * d + i, x = 2 + i * (W - 4) / d, w = (W - 4) / d;
        body += `<rect x="${x}" y="${y}" width="${w}" height="${H}" fill="${k < n ? col : C.paper}" stroke="${C.ink}" stroke-width="2"/>`;
        if (o.label) body += V.text(x + w / 2, y + H / 2, `1/${d}`, { size: Math.min(14, w / 2.6), fill: k < n ? C.paper : C.ink });
      }
    }
    const nb = o.bars || bars;
    return V.svg(W, nb * (H + gap) - gap + 4, body, nb > 1 ? `${nb} fraction bars of ${d} equal parts each, ${n} parts shaded in all` : `fraction bar of ${d} equal parts, ${n} shaded`);
  };
  // fraction circle (pie): d equal slices, first n shaded
  V.fcircle = function (n, d, o = {}) {
    const r = o.r || 60, cx = r + 4, cy = r + 4, col = o.color || C.red; let body = '';
    if (d === 1) body = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${n ? col : C.paper}" stroke="${C.ink}" stroke-width="2"/>`;
    else for (let i = 0; i < d; i++) {
      const a0 = -Math.PI / 2 + i * 2 * Math.PI / d, a1 = a0 + 2 * Math.PI / d;
      const p = a => `${(cx + r * Math.cos(a)).toFixed(2)} ${(cy + r * Math.sin(a)).toFixed(2)}`;
      body += `<path d="M${cx} ${cy} L${p(a0)} A${r} ${r} 0 ${d === 2 ? 0 : 0} 1 ${p(a1)} Z" fill="${i < n ? col : C.paper}" stroke="${C.ink}" stroke-width="2" stroke-linejoin="round"/>`;
    }
    return V.svg(2 * r + 8, 2 * r + 8, body, `circle, ${n} of ${d} parts shaded`);
  };
  // fraction number line from `from` to `to` (whole numbers), each whole split into d parts.
  // o: labels 'wholes' | 'all' (as fractions n/d) | 'none'; marks:[[n,d],…] red dots; ask:[n,d] amber '?' ; letters:[[n,d,'A'],…]
  V.fline = function (from, to, d, o = {}) {
    const W = o.width || Math.min(620, Math.max(320, (to - from) * d * 34 + 60)), pad = 26, H = 76, y = 30;
    const X = v => pad + (v - from) / (to - from) * (W - 2 * pad);
    let body = `<line x1="${pad - 8}" y1="${y}" x2="${W - pad + 8}" y2="${y}" stroke="${C.ink}" stroke-width="2"/>`;
    const L = o.labels || 'wholes';
    for (let k = from * d; k <= to * d; k++) {
      const v = k / d, whole = k % d === 0;
      body += `<line x1="${X(v)}" y1="${y - (whole ? 10 : 6)}" x2="${X(v)}" y2="${y + (whole ? 10 : 6)}" stroke="${C.ink}" stroke-width="${whole ? 2.5 : 1.6}"/>`;
      if ((o.hide || []).some(([a, b]) => a * d === k * b) || (o.ask && o.ask[0] * d === k * o.ask[1]) || (o.letters || []).some(([a, b]) => a * d === k * b)) continue;
      if (whole && L !== 'none') body += V.text(X(v), y + 26, String(v), { size: 15, weight: 600 });
      else if (L === 'all') body += `<text x="${X(v)}" y="${y + 22}" font-size="12" text-anchor="middle" fill="${C.ink}"><tspan x="${X(v)}" dy="0">${k}</tspan><tspan x="${X(v)}" dy="13">${d}</tspan></text><line x1="${X(v) - 7}" y1="${y + 25}" x2="${X(v) + 7}" y2="${y + 25}" stroke="${C.ink}" stroke-width="1"/>`;
    }
    (o.marks || []).forEach(([a, b]) => body += V.dot(X(a / b), y, 7, C.red));
    (o.letters || []).forEach(([a, b, t]) => body += V.dot(X(a / b), y, 7, C.blue) + V.text(X(a / b), y - 20, t, { size: 15, weight: 700, fill: C.blue }));
    if (o.ask) body += V.dot(X(o.ask[0] / o.ask[1]), y, 9, C.amber) + V.text(X(o.ask[0] / o.ask[1]), y - 20, '?', { size: 16, weight: 700 });
    return V.svg(W, H + (L === 'all' ? 8 : 0), body, `number line from ${from} to ${to}, each whole split into ${d} equal parts`);
  };
  // array of dots: rows × cols
  V.array = function (rows, cols, o = {}) {
    const r = o.r || 9, g = r * 2 + (o.gap || 8), col = o.color || C.blue; let body = '';
    for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) body += V.dot(g / 2 + j * g, g / 2 + i * g, r, col);
    return V.svg(cols * g, rows * g, body, `array of ${rows} rows and ${cols} columns`);
  };
  // grid of unit squares with some cells filled: cells = array of [row,col]; or rect {w,h} filled
  V.grid = function (rows, cols, o = {}) {
    const s = o.size || 26, col = o.color || C.teal; let body = '';
    const fill = new Set((o.cells || []).map(([r, c]) => r + ',' + c));
    for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) body += `<rect x="${2 + j * s}" y="${2 + i * s}" width="${s}" height="${s}" fill="${fill.has(i + ',' + j) ? col : C.paper}" stroke="${fill.has(i + ',' + j) ? C.ink : C.line}" stroke-width="${fill.has(i + ',' + j) ? 1.5 : 1}"/>`;
    return V.svg(cols * s + 4, rows * s + 4, body, `grid ${rows} by ${cols}`);
  };
  // hundred grid for decimals: n of 100 shaded (fills columns of 10 top to bottom, left to right)
  V.hgrid = function (n, o = {}) {
    const s = o.size || 18, col = o.color || C.violet; let body = '';
    for (let k = 0; k < 100; k++) { const c = Math.floor(k / 10), r = k % 10; body += `<rect x="${2 + c * s}" y="${2 + r * s}" width="${s}" height="${s}" fill="${k < n ? col : C.paper}" stroke="${C.ink}" stroke-width="${1}"/>`; }
    body += `<rect x="2" y="2" width="${10 * s}" height="${10 * s}" fill="none" stroke="${C.ink}" stroke-width="2.5"/>`;
    return V.svg(10 * s + 4, 10 * s + 4, body, `hundred grid, ${n} shaded`);
  };
  // labelled rectangle (area model). parts: array of widths labels along top, heights along side; o.fill per cell
  V.areaModel = function (tops, sides, o = {}) {
    const unitW = o.unitW || 1, W = o.w || 380, H = o.h || 180, cells = o.cells || [];
    const tw = tops.reduce((a, b) => a + (+b.w || 1), 0), sh = sides.reduce((a, b) => a + (+b.h || 1), 0);
    let body = '', x = 50, y;
    const colW = tops.map(t => (W - 60) * (+t.w || 1) / tw), rowH = sides.map(s => (H - 40) * (+s.h || 1) / sh);
    tops.forEach((t, i) => { body += V.text(x + colW[i] / 2, 14, t.label, { size: 15, weight: 600 }); x += colW[i]; });
    y = 30; sides.forEach((s, j) => { body += V.text(24, y + rowH[j] / 2, s.label, { size: 15, weight: 600 }); x = 50;
      tops.forEach((t, i) => { const c = (cells[j] || [])[i]; body += `<rect x="${x}" y="${y}" width="${colW[i]}" height="${rowH[j]}" fill="${C.set[(i + j * 2) % C.set.length]}33" stroke="${C.ink}" stroke-width="2"/>`; if (c !== undefined && c !== '') body += V.text(x + colW[i] / 2, y + rowH[j] / 2, c, { size: 16, weight: 600 }); x += colW[i]; });
      y += rowH[j]; });
    return V.svg(W, H, body, 'area model');
  };

  /* ---------- validation (used by tests and the page in dev) ---------- */
  E3.validate = function (q, where) {
    const bad = m => { throw new Error(where + ': ' + m); };
    if (!q || typeof q !== 'object') bad('no question object');
    if (typeof q.prompt !== 'string' || !q.prompt.trim()) bad('empty prompt');
    if (/undefined|NaN|\[object/.test(q.prompt)) bad('prompt has undefined/NaN: ' + q.prompt);
    if (typeof q.explain !== 'string' || !q.explain.trim()) bad('missing explain');
    if (/undefined|NaN|\[object/.test(q.explain)) bad('explain has undefined/NaN: ' + q.explain);
    if (q.visual !== undefined) { if (typeof q.visual !== 'string' || !q.visual.startsWith('<svg')) bad('visual not svg'); if (/NaN|undefined/.test(q.visual)) bad('visual has NaN/undefined'); }
    if (q.kind === 'num') {
      if (!Array.isArray(q.fields) || !q.fields.length || q.fields.length > 4) bad('fields 1-4');
      q.fields.forEach(f => {
        if (f.expr !== undefined) {
          if (typeof f.expr !== 'string' || !E3.exprParse(f.expr)) bad('expr does not parse: ' + f.expr);
          if (f.form && !['any', 'expanded', 'factored', 'simplified'].includes(f.form)) bad('bad expr form ' + f.form);
          if (!E3.checkExpr(f, f.expr)) bad('expr fails its own form: ' + f.expr + ' / ' + f.form);
        } else if (f.frac) {
          const [n, d] = f.frac; if (!Number.isInteger(n) || !Number.isInteger(d) || d <= 0) bad('bad frac ' + f.frac);
          if (f.form && !['any', 'simplest', 'mixed', 'improper'].includes(f.form)) bad('bad form ' + f.form);
          if ('ans' in f) bad('field has both ans and frac');
        } else {
          if (typeof f.ans !== 'number' || !isFinite(f.ans)) bad('answer not a number ' + f.ans);
          if (Math.abs(f.ans) > 1e12) bad('answer out of range ' + f.ans);
          if (Math.abs(Math.round(f.ans * 1000) - f.ans * 1000) > 1e-6) bad('more than 3 decimal places ' + f.ans);
        }
        if (f.label !== undefined && (typeof f.label !== 'string' || /undefined|NaN/.test(f.label))) bad('bad label');
      });
    } else if (q.kind === 'choice') {
      if (!Array.isArray(q.choices) || q.choices.length < 2 || q.choices.length > 6) bad('choices 2-6, got ' + (q.choices && q.choices.length));
      if (new Set(q.choices).size !== q.choices.length) bad('duplicate choices ' + q.choices.join(' / '));
      if (!Number.isInteger(q.ans) || q.ans < 0 || q.ans >= q.choices.length) bad('bad choice index');
      q.choices.forEach(c => { if (/undefined|NaN|\[object/.test(c)) bad('choice has undefined/NaN'); });
    } else bad('unknown kind ' + q.kind);
    return true;
  };
})(typeof window !== 'undefined' ? window : globalThis);

/* Era III · Unit III.1 Integers & rationals (III.1.01–III.1.15)
   Signed numbers print with a real minus (fmt). Fractions are kept as integer pairs [n, d]. */
(function () {
  const { choice, choiceFixed, tf, frac, fh, fmt, m, V, C } = E3;
  const num = (p, a, e, x) => E3.num(p, a && a.frac ? [a] : a, e, x);   // lets a single frac() be the answer

  /* ---------- helpers ---------- */
  const P = n => n < 0 ? `(${fmt(n)})` : fmt(n);                    // bracket negatives inside expressions
  const red = (n, d) => { if (d < 0) { n = -n; d = -d; } return E3.reduce(n, d); };
  const F = (n, d) => { [n, d] = red(n, d); if (d === 1) return fmt(n); return (n < 0 ? '−' : '') + fh(Math.abs(n), d); };
  const FM = (n, d) => { [n, d] = red(n, d); const a = Math.abs(n); if (d === 1 || a < d) return F(n, d); return (n < 0 ? '−' : '') + (a % d ? fh(a % d, d, Math.floor(a / d)) : fmt(a / d)); };
  const PF = (n, d) => n < 0 ? `(${F(n, d)})` : F(n, d);
  const add = (a, b) => red(a[0] * b[1] + b[0] * a[1], a[1] * b[1]);
  const mul = (a, b) => red(a[0] * b[0], a[1] * b[1]);
  const val = f => f[0] / f[1];
  const SIGNS = ['&lt;', '=', '&gt;'];
  const cmp = (a, b) => (a < b - 1e-12 ? 0 : a > b + 1e-12 ? 2 : 1);
  const D = (k, dp = 2) => fmt(k / 10 ** dp);                        // integer k in units of 10^-dp
  const deg = O => O.units === 'imperial' ? '°F' : '°C';
  const len = O => O.units === 'imperial' ? 'ft' : 'm';
  const M = (v, O) => O.coins === 'THB' ? `${fmt(v, Number.isInteger(v) ? {} : { dp: 2 })} baht` : (v < 0 ? '−' : '') + '$' + (Number.isInteger(v) ? fmt(Math.abs(v)) : fmt(Math.abs(v), { dp: 2 }));
  const OL = s => `<var style="font-style:normal;text-decoration:overline">${s}</var>`;
  const NB = s => `<span style="white-space:nowrap">${s}</span>`;
  // long division n/d (n ≥ 0) → {ip, pre, rep}
  const expand = (n, d) => {
    const ip = Math.floor(n / d); let r = n % d, digits = ''; const seen = new Map();
    while (r !== 0 && !seen.has(r)) { seen.set(r, digits.length); r *= 10; digits += Math.floor(r / d); r %= d; }
    if (r === 0) return { ip, pre: digits, rep: '' };
    const s = seen.get(r); return { ip, pre: digits.slice(0, s), rep: digits.slice(s) };
  };
  const decHTML = (e, neg) => (neg ? '−' : '') + e.ip + (e.pre || e.rep ? '.' : '') + e.pre + (e.rep ? OL(e.rep) : '');
  const onlyTwoFive = d => { while (d % 2 === 0) d /= 2; while (d % 5 === 0) d /= 5; return d === 1; };
  const primeList = d => { const out = []; for (let p = 2; d > 1; p++) while (d % p === 0) { out.push(p); d /= p; } return out; };
  const dpOf = x => (String(fmt(x)).split('.')[1] || '').length;
  const coord = (x, y) => `(${fmt(x)}, ${fmt(y)})`;

  /* ---------- visuals (prefix V1) ---------- */
  const V1 = {};
  // number line from lo to hi (integers), ticks every 1/den. Positions are integers k meaning k/den.
  // o: labels(k→bool) (default: whole numbers), marks:[k], letters:[[k,'A']], ask:k, jumps:[[k1,k2]], width
  V1.line = function (lo, hi, den = 1, o = {}) {
    const n = (hi - lo) * den, W = o.width || Math.min(460, Math.max(340, n * (den > 1 ? 26 : 30) + 60)), pad = 30;
    const y = o.jumps && o.jumps.length ? 74 : 44, H = y + 44;
    const X = k => pad + (k - lo * den) / n * (W - 2 * pad);
    const lab = o.labels || (k => k % den === 0);
    const hide = new Set([o.ask, ...(o.letters || []).map(l => l[0])]);
    let b = `<line x1="${pad - 16}" y1="${y}" x2="${W - pad + 16}" y2="${y}" stroke="${C.ink}" stroke-width="2"/>`
      + `<path d="M${pad - 22} ${y} l9 -5 v10 z M${W - pad + 22} ${y} l-9 -5 v10 z" fill="${C.ink}"/>`;
    for (let k = lo * den; k <= hi * den; k++) {
      const big = k % den === 0;
      b += `<line x1="${X(k)}" y1="${y - (big ? 9 : 5)}" x2="${X(k)}" y2="${y + (big ? 9 : 5)}" stroke="${C.ink}" stroke-width="${big ? 2.2 : 1.4}"/>`;
      if (lab(k) && !hide.has(k)) b += V.text(X(k), y + 26, fmt(k / den), { size: 16, weight: k === 0 ? 700 : 500 });
    }
    (o.jumps || []).forEach(([a, c]) => { const x1 = X(a), x2 = X(c), mx = (x1 + x2) / 2, hh = Math.min(30, 10 + Math.abs(x2 - x1) * 0.2);
      b += `<path d="M${x1} ${y - 10} Q${mx} ${y - 10 - hh * 2} ${x2} ${y - 10}" fill="none" stroke="${C.teal}" stroke-width="2.5"/>` + `<circle cx="${x2}" cy="${y - 10}" r="3.5" fill="${C.teal}"/>`; });
    (o.marks || []).forEach(k => b += V.dot(X(k), y, 7, C.red));
    (o.letters || []).forEach(([k, t]) => b += V.dot(X(k), y, 7, C.blue) + V.text(X(k), y - 21, t, { size: 16, weight: 700, fill: C.blue }));
    if (o.ask !== undefined) b += V.dot(X(o.ask), y, 9, C.amber) + V.text(X(o.ask), y - 21, '?', { size: 17, weight: 700 });
    return V.svg(W, H, b, 'number line');
  };
  // vertical scale (thermometer or sea-level gauge). o: every (label step), fill (thermometer level), marks:[[v,'label']], sea:true
  V1.vline = function (lo, hi, o = {}) {
    const u = o.unit || 8, top = 16, H = (hi - lo) * u + top * 2 + (o.fill !== undefined ? 26 : 0), x = o.sea ? 120 : 60, W = o.sea ? 250 : 130;
    const Y = v => top + (hi - v) * u;
    let b = '';
    if (o.sea) b += `<rect x="20" y="${Y(0)}" width="${W - 30}" height="${Y(lo) - Y(0)}" fill="${C.blue}22"/><line x1="20" y1="${Y(0)}" x2="${W - 10}" y2="${Y(0)}" stroke="${C.blue}" stroke-width="2" stroke-dasharray="6 4"/>` + V.text(W - 12, Y(0) - 10, 'sea level', { size: 12, anchor: 'end', fill: C.blue });
    if (o.fill !== undefined) {
      b += `<rect x="${x - 7}" y="${Y(hi) - 6}" width="14" height="${Y(lo) - Y(hi) + 14}" rx="7" fill="${C.paper}" stroke="${C.ink}" stroke-width="2"/>`
        + `<circle cx="${x}" cy="${Y(lo) + 18}" r="13" fill="${C.red}" stroke="${C.ink}" stroke-width="2"/>`
        + `<rect x="${x - 4}" y="${Y(o.fill)}" width="8" height="${Y(lo) + 8 - Y(o.fill)}" fill="${C.red}"/>`;
    } else b += `<line x1="${x}" y1="${Y(hi) - 4}" x2="${x}" y2="${Y(lo) + 4}" stroke="${C.ink}" stroke-width="2"/>`;
    const ev = o.every || 5;
    for (let v = lo; v <= hi; v++) {
      const big = v % ev === 0;
      b += `<line x1="${x + 8}" y1="${Y(v)}" x2="${x + 8 + (big ? 12 : 6)}" y2="${Y(v)}" stroke="${C.ink}" stroke-width="${big ? 1.8 : 1}"/>`;
      if (big) b += V.text(x + 26, Y(v), fmt(v), { size: 13, anchor: 'start', weight: v === 0 ? 700 : 500 });
    }
    (o.marks || []).forEach(([v, t]) => b += V.dot(x, Y(v), 6, C.amber) + V.text(x - 12, Y(v), t, { size: 14, anchor: 'end', weight: 700 }));
    return V.svg(W, H, b, o.fill !== undefined ? 'thermometer' : 'vertical scale');
  };
  V1.thermo = (lo, hi, t) => V1.vline(lo, hi, { fill: t, unit: 6 });
  // counters: p blue (+1) above, n red (−1) below, lined up so zero pairs show
  V1.counters = function (p, n) {
    const g = 32, W = Math.max(p, n, 1) * g + 8; let b = '';
    for (let i = 0; i < p; i++) b += V.dot(4 + g / 2 + i * g, 22, 13, C.blue) + V.text(4 + g / 2 + i * g, 22, '+', { size: 18, weight: 700, fill: C.paper });
    for (let i = 0; i < n; i++) b += V.dot(4 + g / 2 + i * g, 60, 13, C.red) + V.text(4 + g / 2 + i * g, 59, '−', { size: 18, weight: 700, fill: C.paper });
    return V.svg(W, 82, b, `${p} positive and ${n} negative counters`);
  };

  /* ================= III.1.01 Negative numbers in context ================= */
  E3.skill({ id: 'III.1.01', name: 'Negative numbers in context', steps: {
    a: { t: 'temperature', g: (R, O) => {
      const u = deg(O), kind = R.int(0, 2);
      if (kind === 0) { const t0 = R.int(1, 12), dr = t0 + R.int(1, 12), t1 = t0 - dr;
        return num(`It is ${t0}${u}. The temperature drops ${dr} degrees. What is it now?`, t1, `Drop ${t0} degree${t0 > 1 ? 's' : ''} to reach 0, then ${dr - t0} more below zero: ${fmt(t1)}${u}.`, { visual: V1.thermo(-15, 15, t0) }); }
      if (kind === 1) { const s = -R.int(2, 12), up = R.int(1, 20), e = s + up;
        return num(`It is ${fmt(s)}${u}. It warms up by ${up} degrees. What is it now?`, e, `Count up ${up} from ${fmt(s)}: ${fmt(s)} + ${up} = ${fmt(e)}${u}.`, { visual: V1.thermo(-15, 15, s) }); }
      const [a, b] = R.distinct(1, 20, 2).sort((x, y) => y - x);
      return choice(R, `Which temperature is colder?`, `${fmt(-a)}${u}`, [`${fmt(-b)}${u}`], `${fmt(-a)}${u} is further below zero than ${fmt(-b)}${u}, so it is colder.`);
    } },
    b: { t: 'sea level', g: (R, O) => {
      const u = len(O), kind = R.int(0, 2);
      if (kind === 0) { const d = R.int(3, 60), who = R.pick(['A diver', 'A fish', 'A shipwreck', 'A cave floor']);
        return num(`${who} is ${d} ${u} below sea level. Write the height as an integer (in ${u}).`, -d, `Sea level is 0 and below is negative: ${fmt(-d)} ${u}.`); }
      if (kind === 1) { const s = -R.int(20, 60), up = R.int(5, 18), e = s + up;
        return num(`A submarine is at ${fmt(s)} ${u}. It rises ${up} ${u}. What is its height now?`, e, `Rising adds: ${fmt(s)} + ${up} = ${fmt(e)} ${u}. It is still below sea level.`); }
      const a = R.int(3, 15), b = R.int(3, 15);
      return num(`A gull flies ${a} ${u} above sea level. A fish swims ${b} ${u} below. How far apart are they (in ${u})?`, a + b, `${a} up to sea level plus ${b} down from it: ${a} + ${b} = ${a + b} ${u}.`, { visual: V1.vline(-15, 15, { sea: true, marks: [[a, 'gull'], [-b, 'fish']], unit: 7 }) });
    } },
    c: { t: 'money owed', g: (R, O) => {
      const kind = R.int(0, 2);
      if (kind === 0) { const d = R.int(3, 40) * (O.coins === 'THB' ? 10 : 1);
        return num(`You have no money and you owe ${M(d, O)}. Write your balance as an integer.`, -d, `Money owed is negative: a balance of ${M(-d, O)}.`); }
      if (kind === 1) { const s = -R.int(5, 40) * (O.coins === 'THB' ? 10 : 1), dep = R.int(5, 60) * (O.coins === 'THB' ? 10 : 1), e = s + dep;
        return num(`Your balance is ${M(s, O)}. You pay in ${M(dep, O)}. What is your balance now?`, e, `${fmt(s)} + ${dep} = ${fmt(e)}, so the balance is ${M(e, O)}.`); }
      const k = O.coins === 'THB' ? 10 : 1, [a, b, c] = R.distinct(2, 30, 3).map(x => x * k);
      const lo = -Math.max(a, b);
      return choice(R, `Which balance is the lowest?`, M(lo, O), [M(0, O), M(-Math.min(a, b), O), M(c, O)], `A negative balance is money you owe. ${M(lo, O)} owes the most, so it is worse than ${M(0, O)}.`);
    } },
    d: { t: 'opposites', g: R => {
      const kind = R.int(0, 3), k = R.int(2, 40), s = R.pick([-1, 1]);
      if (kind === 0) return num(`What is the opposite of ${fmt(s * k)}?`, -s * k, `Opposites are the same distance from 0 on other sides: ${fmt(s * k)} and ${fmt(-s * k)}.`);
      if (kind === 1) return num(`What is the opposite of the opposite of ${fmt(s * k)}?`, s * k, `The opposite of ${fmt(s * k)} is ${fmt(-s * k)}, and its opposite is ${fmt(s * k)} again.`);
      if (kind === 2) return num(`${fmt(-k)} and a number <i>n</i> are opposites. What is ${fmt(-k)} + <i>n</i>?`, 0, `<i>n</i> = ${k}, and a number plus its opposite is 0.`);
      return choice(R, `Which pair are opposites?`, `${fmt(-k)} and ${k}`, [`${fmt(-k)} and ${fmt(-k)}`, `${k} and ${fh(1, k)}`, `${k} and 0`], `Opposites have the same size and different signs: ${fmt(-k)} and ${k}.`);
    } },
  } });

  /* ================= III.1.02 Integers on a number line ================= */
  E3.skill({ id: 'III.1.02', name: 'Integers on a number line', steps: {
    a: { t: 'place them', g: R => {
      const lo = -R.int(8, 13), hi = lo + R.int(14, 16);
      let v; do { v = R.int(lo + 1, Math.min(-1, hi - 1)); } while (v % 5 === 0);
      const L = Math.round(v / 5) * 5, dist = Math.abs(v - L);
      if (R.bool(0.6)) return num(`Which integer is marked <b>?</b>`, v, `Start at ${fmt(L)} and count ${dist} to the ${v < L ? 'left' : 'right'}: ${fmt(v)}.`, { visual: V1.line(lo, hi, 1, { labels: k => k % 5 === 0, ask: v }) });
      let w; do { w = R.int(lo + 1, hi - 1); } while (w === v || w === -v || w % 5 === 0);
      const letters = R.shuffle([[v, 'A'], [-v <= hi ? -v : v + 1, 'B'], [w, 'C']]).map((x, i) => [x[0], 'ABC'[i]]);
      const uniq = new Set(letters.map(l => l[0])); if (uniq.size < 3) return num(`Which integer is marked <b>?</b>`, v, `Start at ${fmt(L)} and count ${dist} to the ${v < L ? 'left' : 'right'}: ${fmt(v)}.`, { visual: V1.line(lo, hi, 1, { labels: k => k % 5 === 0, ask: v }) });
      const ans = letters.find(l => l[0] === v)[1];
      return choiceFixed(`Which letter is at ${fmt(v)}?`, ['A', 'B', 'C'], 'ABC'.indexOf(ans), `${fmt(v)} is ${dist} step${dist > 1 ? 's' : ''} ${v < L ? 'left' : 'right'} of ${fmt(L)}: letter ${ans}.`, { visual: V1.line(lo, hi, 1, { labels: k => k % 5 === 0, letters }) });
    } },
    b: { t: 'opposites', g: R => {
      const k = R.int(2, 9), s = R.pick([-1, 1]);
      if (R.bool()) return num(`What is the opposite of the number at A?`, -s * k, `A is at ${fmt(s * k)}. Its opposite is the same distance on the other side of 0: ${fmt(-s * k)}.`, { visual: V1.line(-10, 10, 1, { labels: x => x % 5 === 0, letters: [[s * k, 'A']] }) });
      return num(`A and B are opposites, ${2 * k} units apart. B is right of 0. What number is B?`, k, `Opposites sit the same distance from 0, so each is ${2 * k} ÷ 2 = ${k} away: B = ${k}.`, { visual: V1.line(-10, 10, 1, { labels: x => x === 0, letters: [[-k, 'A'], [k, 'B']] }) });
    } },
    c: { t: 'compare', g: R => {
      let a, b; const kind = R.int(0, 2);
      if (kind === 0) { [a, b] = R.distinct(1, 20, 2).map(x => -x); }
      else if (kind === 1) { a = -R.int(1, 20); b = R.int(0, 20); if (R.bool()) [a, b] = [b, a]; }
      else { a = -R.int(1, 15); b = R.bool(0.25) ? a : -R.int(1, 15); }
      const r = cmp(a, b);
      return choiceFixed(`Which sign goes in the circle? ${NB(`${fmt(a)} ◯ ${fmt(b)}`)}`, SIGNS, r, r === 1 ? 'They are the same number.' : `${fmt(Math.min(a, b))} is further left on the number line, so ${fmt(a)} ${SIGNS[r]} ${fmt(b)}.`);
    } },
    d: { t: 'order', g: R => {
      const neg = R.distinct(1, 15, 2).map(x => -x), pos = R.distinct(0, 15, 2).filter(x => !neg.includes(-x));
      let list = [...neg, ...pos]; for (const x of [-16, 16, -17]) if (list.length < 4 && !list.includes(x)) list.push(x);
      list = R.shuffle(list.slice(0, 4));
      const j = a => a.map(fmt).join(', ');
      const asc = list.slice().sort((x, y) => x - y), byAbs = list.slice().sort((x, y) => Math.abs(x) - Math.abs(y) || x - y);
      const negWrong = [...list.filter(x => x < 0).sort((x, y) => y - x), ...list.filter(x => x >= 0).sort((x, y) => x - y)];
      return choice(R, `Order from least to greatest: ${j(list)}`, j(asc), [j(byAbs), j(negWrong), j(asc.slice().reverse())], `Further left is smaller: ${asc.map(fmt).join(' &lt; ')}.`);
    } },
  } });

  /* ================= III.1.03 Absolute value ================= */
  E3.skill({ id: 'III.1.03', name: 'Absolute value', steps: {
    a: { t: 'distance from 0', g: R => {
      let v; do { v = R.int(-10, 10); } while (v === 0 || v % 5 === 0);
      if (R.bool()) return num(`How far is the dot from 0?`, Math.abs(v), `Count the steps from 0 to ${fmt(v)}: ${Math.abs(v)}. Distance is never negative.`, { visual: V1.line(-10, 10, 1, { labels: x => x % 5 === 0, marks: [v] }) });
      const w = R.pick([-1, 1]) * R.int(11, 99);
      return num(`How many units is ${fmt(w)} from 0 on a number line?`, Math.abs(w), `Distance from 0 is the size without the sign: ${Math.abs(w)}.`);
    } },
    b: { t: 'the notation', g: R => {
      const a = R.int(2, 30), b = R.int(2, 30), kind = R.int(0, 4);
      if (kind === 4) { const [x, y] = R.distinct(2, 15, 2).sort((u, v) => u - v);
        return choice(R, `|${x} − ${y}| = ?`, String(y - x), [fmt(x - y), String(x + y), fmt(-(x + y))], `${x} − ${y} = ${fmt(x - y)}, and its distance from 0 is ${y - x}. It is not |${x}| − |${y}| = ${fmt(x - y)}.`); }
      if (kind === 0) return num(`|${fmt(-a)}| = ?`, a, `|${fmt(-a)}| is the distance from ${fmt(-a)} to 0: ${a}.`);
      if (kind === 1) return num(`|${fmt(-a)}| + |${b}| = ?`, a + b, `${a} + ${b} = ${a + b}.`);
      if (kind === 2) return num(`−|${fmt(-a)}| = ?`, -a, `|${fmt(-a)}| = ${a}, and the minus outside makes it ${fmt(-a)}.`);
      return num(`|${fmt(-a)}| − |${fmt(-b)}| = ?`, a - b, `${a} − ${b} = ${fmt(a - b)}.`);
    } },
    c: { t: 'compare absolute values', g: R => {
      let a = R.int(1, 20) * R.pick([-1, 1]), b = R.int(1, 20) * R.pick([-1, 1]);
      if (R.bool(0.2)) b = -a;
      if (R.bool(0.5) && a > 0 === b > 0) a = -a;
      const r = cmp(Math.abs(a), Math.abs(b));
      return choiceFixed(`Which sign goes in the circle? ${NB(`|${fmt(a)}| ◯ |${fmt(b)}|`)}`, SIGNS, r, `|${fmt(a)}| = ${Math.abs(a)} and |${fmt(b)}| = ${Math.abs(b)}, so ${Math.abs(a)} ${SIGNS[r]} ${Math.abs(b)}.`);
    } },
    d: { t: 'in context', g: (R, O) => {
      const kind = R.int(0, 2);
      if (kind === 0) { const [a, b] = R.distinct(3, 40, 2), u = len(O);
        return choice(R, `A diver is at ${fmt(-a)} ${u}. A bird is at ${b} ${u}. Which is farther from sea level?`, a > b ? 'the diver' : 'the bird', [a > b ? 'the bird' : 'the diver', 'both the same'], `|${fmt(-a)}| = ${a} and |${b}| = ${b}. ${Math.max(a, b)} is farther.`); }
      if (kind === 1) { const d = R.int(5, 90) * (O.coins === 'THB' ? 10 : 1);
        return num(`An account balance is ${M(-d, O)}. How much money is owed?`, d, `The debt is the absolute value: |${fmt(-d)}| = ${d}.`); }
      const [a, b] = R.distinct(2, 25, 2), u = deg(O);
      const A = `${fmt(-a)}${u}`, B = `${b}${u}`;
      return choice(R, `Which temperature is farther from 0${u}?`, a > b ? A : B, [a > b ? B : A],
        `|${fmt(-a)}| = ${a} and |${b}| = ${b}, so ${a > b ? A : B} is farther from 0.`);
    } },
  } });

  /* ================= III.1.04 Add integers ================= */
  E3.skill({ id: 'III.1.04', name: 'Add integers', steps: {
    a: { t: 'same signs', g: R => {
      const a = R.int(2, 30), b = R.int(2, 30), neg = R.bool(0.8), s = neg ? -1 : 1;
      return num(`${fmt(s * a)} + ${P(s * b)} = ?`, s * (a + b), `Same signs: add the sizes, ${a} + ${b} = ${a + b}, and keep the sign: ${fmt(s * (a + b))}.`);
    } },
    b: { t: 'different signs on a number line', g: R => {
      let a, b; do { a = R.int(-9, 9); b = R.int(-9, 9); } while (!a || !b || (a > 0) === (b > 0) || Math.abs(a + b) > 10 || a + b === 0);
      return num(`Start at the dot. Use the line: ${fmt(a)} + ${P(b)} = ?`, a + b, `Adding ${b > 0 ? 'a positive moves right' : 'a negative moves left'} ${Math.abs(b)} step${Math.abs(b) > 1 ? 's' : ''}: from ${fmt(a)} to ${fmt(a + b)}.`, { visual: V1.line(-10, 10, 1, { labels: x => x % 5 === 0, marks: [a] }) });
    } },
    c: { t: 'zero pairs', g: R => {
      let p, n; do { p = R.int(1, 12); n = R.int(1, 12); } while (p === n);
      const zp = Math.min(p, n), rest = p - n;
      return num(`Each blue counter is +1 and each red counter is −1. What is ${p} + ${P(-n)}?`, rest, `${zp} zero pairs cancel. ${Math.abs(rest)} ${rest > 0 ? 'blue' : 'red'} left: ${fmt(rest)}.`, { visual: V1.counters(p, n) });
    } },
    d: { t: 'the rules', g: R => {
      const a = R.int(4, 60) * R.pick([-1, 1]); let b; do { b = -R.int(3, 60); } while (Math.abs(a) === Math.abs(b));
      const S = a + b, sz = Math.abs(a) + Math.abs(b), df = Math.abs(Math.abs(a) - Math.abs(b));
      return choice(R, `${fmt(a)} + ${P(b)} = ?`, fmt(S), [...new Set([fmt(-S), fmt(-df), fmt(df), fmt(sz), fmt(-sz)])].filter(x => x !== fmt(S)).slice(0, 3),
        a < 0 ? `Same signs: add the sizes (${sz}) and keep the minus: ${fmt(S)}.` : `Different signs: ${Math.max(Math.abs(a), Math.abs(b))} − ${Math.min(Math.abs(a), Math.abs(b))} = ${df}, sign of the larger size: ${fmt(S)}.`);
    } },
  } });

  /* ================= III.1.05 Subtract integers ================= */
  E3.skill({ id: 'III.1.05', name: 'Subtract integers', steps: {
    a: { t: 'add the opposite', g: R => {
      let a; do { a = R.int(-15, 15); } while (!a); const b = R.int(1, 15) * R.pick([-1, 1]);
      if (R.bool()) return choice(R, `Which addition means the same as ${fmt(a)} − ${P(b)}?`, `${fmt(a)} + ${P(-b)}`, [`${fmt(a)} + ${P(b)}`, `${P(-a)} + ${P(-b)}`, `${P(-a)} + ${P(b)}`], `Subtracting ${fmt(b)} is the same as adding its opposite, ${fmt(-b)}.`);
      const c = -R.int(1, 15);
      return num(`${fmt(a)} − ${P(c)} = ?`, a - c, `Add the opposite: ${fmt(a)} + ${-c} = ${fmt(a - c)}.`);
    } },
    b: { t: 'on a number line', g: R => {
      let a, b; do { a = R.int(-8, 8); b = R.int(-8, 8); } while (!b || Math.abs(a - b) > 10 || a - b === a);
      return num(`Start at the dot. Use the line: ${fmt(a)} − ${P(b)} = ?`, a - b, `Subtracting ${fmt(b)} moves ${b > 0 ? 'left' : 'right'} ${Math.abs(b)} step${Math.abs(b) > 1 ? 's' : ''}: from ${fmt(a)} to ${fmt(a - b)}.`, { visual: V1.line(-10, 10, 1, { labels: x => x % 5 === 0, marks: [a] }) });
    } },
    c: { t: 'distance between', g: (R, O) => {
      const kind = R.int(0, 2), a = -R.int(1, 12), b = R.int(1, 12);
      if (kind === 0) { const [x, y] = R.bool() ? [a, b] : [b, a];
        return num(`A is at ${fmt(x)} and B is at ${fmt(y)}. How far apart are they?`, b - a, `Distance = larger − smaller = ${b} − ${P(a)} = ${b - a}.`, { visual: V1.line(-13, 13, 1, { labels: t => t % 5 === 0, letters: [[x, 'A'], [y, 'B']], width: 600 }) }); }
      if (kind === 1) { const u = deg(O), lo = -R.int(2, 25), hi = R.int(1, 25);
        return num(`The high was ${hi}${u} and the low was ${fmt(lo)}${u}. What is the difference?`, hi - lo, `${hi} − ${P(lo)} = ${hi} + ${-lo} = ${hi - lo} degrees.`); }
      const [p, q] = R.distinct(2, 30, 2).sort((x, y) => x - y);
      return num(`How far apart are ${fmt(-q)} and ${fmt(-p)} on a number line?`, q - p, `${fmt(-p)} − ${P(-q)} = ${fmt(-p)} + ${q} = ${q - p}.`);
    } },
    d: { t: 'mixed', g: R => {
      const a = R.int(-20, 20), b = R.int(1, 20) * R.pick([-1, 1]), c = R.int(1, 20) * R.pick([-1, 1]);
      if (R.bool(0.35)) { const x = R.int(2, 20), y = R.int(1, 15);
        return choice(R, `${x} − ${P(-y)} = ?`, fmt(x + y), [fmt(x - y), fmt(-x - y), fmt(y - x)], `Subtracting a negative adds: ${x} + ${y} = ${x + y}.`); }
      const op = R.pick(['+', '−']), v = a - b + (op === '+' ? c : -c);
      return num(`${fmt(a)} − ${P(b)} ${op} ${P(c)} = ?`, v, `Left to right: ${fmt(a)} − ${P(b)} = ${fmt(a - b)}, then ${P(a - b)} ${op} ${P(c)} = ${fmt(v)}.`);
    } },
  } });

  /* ================= III.1.06 Multiply integers ================= */
  E3.skill({ id: 'III.1.06', name: 'Multiply integers', steps: {
    a: { t: 'from patterns', g: R => {
      const A = R.int(2, 9) * R.pick([-1, 1]), stop = -1, top = R.int(2, 4);
      const lines = []; for (let b = top; b > stop; b--) lines.push(`${fmt(A)} × ${P(b)} = ${fmt(A * b)}`);
      lines.push(`${fmt(A)} × ${P(stop)} = ?`);
      return num(`Continue the pattern.<br>${lines.join('<br>')}`, A * stop, `Each answer ${A > 0 ? 'drops' : 'grows'} by ${Math.abs(A)}, so the next is ${fmt(A * (stop + 1))} ${A > 0 ? '−' : '+'} ${Math.abs(A)} = ${fmt(A * stop)}.`);
    } },
    b: { t: 'sign rules', g: R => {
      let a = R.int(2, 12) * R.pick([-1, 1]); const b = R.int(2, 12) * R.pick([-1, 1]); if (a > 0 && b > 0 && R.bool(0.75)) a = -a;
      if (R.bool(0.3)) { const s1 = R.bool(), s2 = R.bool() ? s1 : !s1; a = Math.abs(a) * (s1 ? -1 : 1); const bb = Math.abs(b) * (s2 ? -1 : 1);
        return choiceFixed(`Is ${fmt(a)} × ${P(bb)} positive or negative?`, ['positive', 'negative'], a * bb > 0 ? 0 : 1, a * bb > 0 ? 'Same signs give a positive product.' : 'Different signs give a negative product.'); }
      return num(`${fmt(a)} × ${P(b)} = ?`, a * b, `${Math.abs(a)} × ${Math.abs(b)} = ${Math.abs(a * b)}; ${a * b > 0 ? 'same signs, so positive' : 'different signs, so negative'}: ${fmt(a * b)}.`);
    } },
    c: { t: 'several factors', g: R => {
      const k = R.int(3, 4); let f;
      do { f = Array.from({ length: k }, () => R.int(2, 5) * R.pick([-1, 1])); } while (Math.abs(f.reduce((x, y) => x * y, 1)) > 240 || f.every(x => x > 0));
      const p = f.reduce((x, y) => x * y, 1), negs = f.filter(x => x < 0).length;
      return num(`${f.map((x, i) => i ? P(x) : fmt(x)).join(' × ')} = ?`, p, `Sizes: ${f.map(Math.abs).join(' × ')} = ${Math.abs(p)}. ${negs} negative factor${negs > 1 ? 's' : ''} (${negs % 2 ? 'odd' : 'even'}), so ${p < 0 ? 'negative' : 'positive'}: ${fmt(p)}.`);
    } },
    d: { t: 'in context', g: (R, O) => {
      const kind = R.int(0, 2), r = R.int(2, 6), t = R.int(3, 9);
      if (kind === 0) return num(`The temperature falls ${r} degrees each hour. What is the change after ${t} hours?`, -r * t, `A fall is negative: ${t} × ${P(-r)} = ${fmt(-r * t)} degrees.`);
      if (kind === 1) { const k = O.coins === 'THB' ? 10 : 1; return num(`You pay ${M(r * k, O)} a week for ${t} weeks. What is the change in your balance?`, -r * t * k, `Each week is ${fmt(-r * k)}: ${t} × ${P(-r * k)} = ${fmt(-r * t * k)}.`); }
      const u = len(O); return num(`A diver goes down ${r} ${u} each minute. What is the change in her height after ${t} minutes (in ${u})?`, -r * t, `Down is negative: ${t} × ${P(-r)} = ${fmt(-r * t)} ${u}.`);
    } },
  } });

  /* ================= III.1.07 Divide integers ================= */
  E3.skill({ id: 'III.1.07', name: 'Divide integers', steps: {
    a: { t: 'sign rules', g: R => {
      const q = R.int(2, 12) * R.pick([-1, 1]), d = R.int(2, 12) * R.pick([-1, 1]), n = q * d;
      if (n < 0 || R.bool(0.5)) return num(`${fmt(n)} ÷ ${P(d)} = ?`, q, `${Math.abs(n)} ÷ ${Math.abs(d)} = ${Math.abs(q)}; ${q > 0 ? 'same signs, so positive' : 'different signs, so negative'}: ${fmt(q)}.`);
      const nn = -Math.abs(n), dd = -Math.abs(d), qq = nn / dd;
      return choice(R, `${fmt(nn)} ÷ ${P(dd)} = ?`, fmt(qq), [fmt(-qq), fmt(nn * dd)], `Two negatives in a division give a positive: ${fmt(qq)}.`);
    } },
    b: { t: 'link to multiplication', g: R => {
      const a = R.int(2, 9) * R.pick([-1, 1]), b = R.int(2, 9) * R.pick([-1, 1]), c = a * b;
      if (R.bool()) return num(`${fmt(a)} × ? = ${fmt(c)}`, b, `${fmt(c)} ÷ ${P(a)} = ${fmt(b)}. Check: ${fmt(a)} × ${P(b)} = ${fmt(c)}.`);
      return num(`${fmt(a)} × ${P(b)} = ${fmt(c)}. So what is ${fmt(c)} ÷ ${P(a)}?`, b, `Division undoes multiplication: ${fmt(c)} ÷ ${P(a)} = ${fmt(b)}.`);
    } },
    c: { t: 'fractions with negatives', g: R => {
      const kind = R.int(0, 1);
      if (kind === 0) { const q = R.int(2, 9) * R.pick([-1, 1]), d = R.int(2, 9) * R.pick([-1, 1]);
        return num(`${fh(fmt(q * d), fmt(d))} = ?`, q, `The fraction bar means divide: ${fmt(q * d)} ÷ ${P(d)} = ${fmt(q)}.`); }
      let a, b; do { a = R.int(1, 9); b = R.int(2, 9); } while (E3.gcd(a, b) !== 1);
      return choice(R, `Which is equal to ${fh(a, fmt(-b))}?`, `−${fh(a, b)}`, [fh(a, b), `−${fh(b, a)}`, fh(b, a)], `${a} ÷ ${P(-b)} is negative, so ${fh(a, fmt(-b))} = −${fh(a, b)}.`);
    } },
    d: { t: 'mixed', g: R => {
      const kind = R.int(0, 2);
      if (kind === 0) { let q, d, c; do { q = R.int(2, 8) * R.pick([-1, 1]); d = R.int(2, 6) * R.pick([-1, 1]); c = R.int(2, 6) * R.pick([-1, 1]); } while (q * d > 0 && d > 0 && c > 0);
        return num(`${fmt(q * d)} ÷ ${P(d)} × ${P(c)} = ?`, q * c, `Left to right: ${fmt(q * d)} ÷ ${P(d)} = ${fmt(q)}, then ${fmt(q)} × ${P(c)} = ${fmt(q * c)}.`); }
      if (kind === 1) { let q, d1, d2; do { q = R.int(2, 6) * R.pick([-1, 1]); d1 = R.int(2, 5) * R.pick([-1, 1]); d2 = R.int(2, 5) * R.pick([-1, 1]); } while (q > 0 && d1 > 0 && d2 > 0); const n = q * d1 * d2;
        return num(`${fmt(n)} ÷ ${P(d1)} ÷ ${P(d2)} = ?`, q, `${fmt(n)} ÷ ${P(d1)} = ${fmt(n / d1)}, then ÷ ${P(d2)} = ${fmt(q)}.`); }
      let a, b, dv; do { a = R.int(2, 9) * R.pick([-1, 1]); b = R.int(2, 9) * R.pick([-1, 1]); dv = R.pick([2, 3, 4, 6]); } while ((a * b) % dv !== 0 || (a > 0 && b > 0));
      dv *= R.pick([-1, 1]);
      return num(`${fh(`${fmt(a)} × ${P(b)}`, fmt(dv))} = ?`, a * b / dv, `Top: ${fmt(a)} × ${P(b)} = ${fmt(a * b)}. Then ${fmt(a * b)} ÷ ${P(dv)} = ${fmt(a * b / dv)}.`);
    } },
  } });

  /* ================= III.1.08 Order of operations with integers ================= */
  E3.skill({ id: 'III.1.08', name: 'Order of operations with integers', steps: {
    a: { t: 'two operations', g: R => {
      const a = R.int(-12, 12), b = R.int(2, 9) * R.pick([-1, 1]), c = R.int(2, 6) * R.pick([-1, 1]);
      if (R.bool()) return num(`${fmt(a)} + ${P(b)} × ${P(c)} = ?`, a + b * c, `Multiply first: ${P(b)} × ${P(c)} = ${fmt(b * c)}. Then ${fmt(a)} + ${P(b * c)} = ${fmt(a + b * c)}.`);
      return num(`${fmt(a)} − ${P(b * c)} ÷ ${P(c)} = ?`, a - b, `Divide first: ${P(b * c)} ÷ ${P(c)} = ${fmt(b)}. Then ${fmt(a)} − ${P(b)} = ${fmt(a - b)}.`);
    } },
    b: { t: 'with brackets', g: R => {
      const a = R.int(-9, 9), b = R.int(-9, 9), c = R.int(2, 6) * R.pick([-1, 1]), kind = R.int(0, 2);
      if (kind === 0) return num(`(${fmt(a)} + ${P(b)}) × ${P(c)} = ?`, (a + b) * c, `Brackets first: ${fmt(a)} + ${P(b)} = ${fmt(a + b)}. Then ${P(a + b)} × ${P(c)} = ${fmt((a + b) * c)}.`);
      if (kind === 1) return num(`${fmt(c)} × (${fmt(a)} − ${P(b)}) = ?`, c * (a - b), `Brackets first: ${fmt(a)} − ${P(b)} = ${fmt(a - b)}. Then ${fmt(c)} × ${P(a - b)} = ${fmt(c * (a - b))}.`);
      const q = R.int(1, 6) * R.pick([-1, 1]), x = R.int(-9, 9), y = x - q * c;
      return num(`(${fmt(x)} − ${P(y)}) ÷ ${P(c)} = ?`, q, `Brackets first: ${fmt(x)} − ${P(y)} = ${fmt(x - y)}. Then ${fmt(x - y)} ÷ ${P(c)} = ${fmt(q)}.`);
    } },
    c: { t: 'mixed signs', g: R => {
      const kind = R.int(0, 2);
      if (kind === 0) { const a = R.int(-10, 10), b = R.int(2, 6) * R.pick([-1, 1]), c = R.int(-5, 5), d = R.int(-5, 5), v = a - b * (c + d);
        return num(`${fmt(a)} − ${P(b)} × (${fmt(c)} + ${P(d)}) = ?`, v, `Brackets: ${fmt(c + d)}. Multiply: ${P(b)} × ${P(c + d)} = ${fmt(b * (c + d))}. Then ${fmt(a)} − ${P(b * (c + d))} = ${fmt(v)}.`); }
      if (kind === 1) { const k = R.int(2, 6), b = R.int(2, 5), c = R.int(-6, 6), v = k * k - b * c;
        return num(`(${fmt(-k)})<sup>2</sup> − ${b} × ${P(c)} = ?`, v, `(${fmt(-k)})<sup>2</sup> = ${k * k}. ${b} × ${P(c)} = ${fmt(b * c)}. ${k * k} − ${P(b * c)} = ${fmt(v)}.`); }
      const a = R.int(2, 6) * R.pick([-1, 1]), b = R.int(2, 6) * R.pick([-1, 1]), c = R.int(2, 5) * R.pick([-1, 1]), d = R.int(1, 5) * R.pick([-1, 1]), v = a * b + c * d;
      return num(`${fmt(a)} × ${P(b)} + ${P(c)} × ${P(d)} = ?`, v, `Both products first: ${fmt(a * b)} and ${fmt(c * d)}. Then ${fmt(a * b)} + ${P(c * d)} = ${fmt(v)}.`);
    } },
    d: { t: 'find the error', g: R => {
      const kind = R.int(0, 2); let expr, work, right, why;
      const WHY = ['Added before subtracting; + and − go left to right.', 'Added before multiplying; × comes first.', 'Subtracted a negative as if it were positive.'];
      if (kind === 0) { const a = R.int(8, 20), b = R.int(2, 7), c = R.int(2, 7); expr = `${a} − ${b} + ${c}`; work = `${a} − ${b + c} = ${fmt(a - b - c)}`; right = a - b + c; }
      else if (kind === 1) { const a = R.int(-9, -2), b = R.int(2, 6), c = R.int(2, 6) * R.pick([-1, 1]); expr = `${fmt(a)} + ${b} × ${P(c)}`; work = `${fmt(a + b)} × ${P(c)} = ${fmt((a + b) * c)}`; right = a + b * c; }
      else { const a = R.int(-9, 9), b = R.int(2, 9), c = R.int(2, 5); expr = `${fmt(a)} − ${P(-b)} × ${c}`; work = `${fmt(a)} − ${b * c} = ${fmt(a - b * c)}`; right = a + b * c; }
      if (R.bool(0.45)) return num(`Sam wrote: ${expr} = ${work}. What is the correct value?`, right, `${WHY[kind]} Correct value: ${fmt(right)}.`);
      return choiceFixed(`Sam wrote: ${expr} = ${work}. What went wrong?`, WHY.concat(['Nothing: it is right.']), kind, `${WHY[kind]} The correct value is ${fmt(right)}.`);
    } },
  } });

  /* ================= III.1.09 Rational numbers ================= */
  const FR = (n, d) => (n < 0 ? '−' : '') + fh(Math.abs(n), d);          // unreduced signed fraction
  const PD = (k, dp = 2) => k < 0 ? `(${D(k, dp)})` : D(k, dp);
  const NICE = [[1, 2], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [4, 5], [5, 4], [5, 2], [7, 4], [9, 4], [7, 2], [6, 5], [1, 20], [3, 20], [7, 20], [9, 25], [1, 8], [3, 8]];
  E3.skill({ id: 'III.1.09', name: 'Rational numbers', steps: {
    a: { t: 'the definition', g: R => {
      const kind = R.int(0, 2);
      if (kind === 0) { const k = R.int(2, 15);
        return choice(R, `Which fraction shows that ${fmt(-k)} is a rational number?`, fh(fmt(-k), 1), [fh(1, fmt(-k)), fh(k, 1), fh(fmt(-k), 0)], `${fmt(-k)} = ${fh(fmt(-k), 1)}: an integer over a nonzero integer.`); }
      if (kind === 1) { const [n, d] = R.pick(NICE);
        return choice(R, `Which fraction shows that ${fmt(-n / d)} is a rational number?`, FR(-n, d), [fh(n, d), FR(-d, n), FR(-n, d + 1)], `${fmt(-n / d)} = ${FR(-n, d)}, an integer over a nonzero integer.`); }
      const S = [[`${fmt(-R.int(2, 40))} is a rational number.`, true, 'Every integer <i>n</i> is <i>n</i>/1.'], ['0 is a rational number.', true, '0 = 0/1.'],
        [`${fh(R.int(1, 9), 0)} is a rational number.`, false, 'You cannot divide by 0, so this is not a number at all.'], [`${fmt(-R.int(11, 99) / 10)} is a rational number.`, true, 'A decimal that ends is a fraction over 10, 100, …'],
        ['Every integer is a rational number.', true, 'Every integer <i>n</i> is <i>n</i>/1.'], ['Every rational number is an integer.', false, `${fh(1, 2)} is rational but not an integer.`],
        [`−${fh(R.int(1, 4), 5)} is not rational because it is negative.`, false, 'Negative fractions are rational too: the top can be a negative integer.']];
      const [st, t, why] = R.pick(S);
      return tf(`True or false? ${st}`, t, why);
    } },
    b: { t: 'on a number line', g: R => {
      const den = R.pick([2, 3, 4, 5]), lo = R.pick([-2, -3]), hi = lo + 3;
      if (R.bool(0.65)) { let k; do { k = R.int(lo * den + 1, -1); } while (k % den === 0);
        return num(`Which number is marked <b>?</b> Write it as a fraction or mixed number.`, frac(k, den), `Each whole is split into ${den} parts. The <b>?</b> is ${-k} part${k < -1 ? 's' : ''} left of 0: ${FM(k, den)}.`, { visual: V1.line(lo, hi, den, { ask: k }) }); }
      let a, b; do { b = R.int(3, 9); a = R.int(1, b - 1); } while (E3.gcd(a, b) !== 1);
      return choice(R, `Where is −${fh(a, b)} on a number line?`, 'between −1 and 0', [`between ${fmt(-b)} and ${fmt(-a)}`, 'between 0 and 1', 'left of −1'], `${fh(a, b)} is less than 1, so −${fh(a, b)} lies between −1 and 0.`);
    } },
    c: { t: 'as fractions', g: R => {
      if (R.bool(0.6)) { const [n, d] = R.pick(NICE);
        return num(`Write ${fmt(-n / d)} as a fraction in simplest form.`, frac(-n, d, 'simplest'), `${fmt(-n / d)} = ${FR(-Math.round(n / d * 10 ** dpOf(n / d)), 10 ** dpOf(n / d))} = ${FM(-n, d)}.`); }
      const w = R.int(1, 5), d = R.int(2, 9); let a; do { a = R.int(1, d - 1); } while (E3.gcd(a, d) !== 1);
      return num(`Write −${fh(a, d, w)} as an improper fraction.`, frac(-(w * d + a), d, 'improper'), `${w} × ${d} + ${a} = ${w * d + a}, so −${fh(a, d, w)} = ${FR(-(w * d + a), d)}.`);
    } },
    d: { t: 'negative fractions', g: R => {
      let a, b; do { a = R.int(1, 9); b = R.int(2, 9); } while (E3.gcd(a, b) !== 1 || a === b);
      const kind = R.int(0, 2);
      if (kind === 0) return choice(R, `Which is NOT equal to −${fh(a, b)}?`, fh(fmt(-a), fmt(-b)), [fh(fmt(-a), b), fh(a, fmt(-b)), `−(${fh(a, b)})`], `${fh(fmt(-a), fmt(-b))} has two negatives, so it equals +${fh(a, b)}.`);
      if (kind === 1) return num(`Write ${fh(fmt(-a), fmt(-b))} in simplest form.`, frac(a, b, 'simplest'), `A negative divided by a negative is positive: ${fh(a, b)}.`);
      const d = R.int(2, 6), n = d * R.int(1, 4) + R.int(1, d - 1);
      return num(`Write ${FR(-n, d)} as a mixed number.`, frac(-n, d, 'mixed'), `${n} ÷ ${d} = ${Math.floor(n / d)} R ${n % d}, so ${FR(-n, d)} = ${FM(-n, d)}.`);
    } },
  } });

  /* ================= III.1.10 Add and subtract rationals ================= */
  E3.skill({ id: 'III.1.10', name: 'Add and subtract rationals', steps: {
    a: { t: 'negative fractions', g: R => {
      let a, b, c, d, r, L; do { b = R.pick([2, 3, 4, 6, 8, 12]); d = R.pick([2, 3, 4, 5, 6]); L = E3.lcm(b, d); a = R.int(1, b - 1); c = R.int(1, d - 1); } while (L > 24 || a * d === c * b);
      const op = R.pick(['+', '−']), c2 = op === '+' ? c : -c; r = add([-a, b], [c2, d]);
      return num(`${FR(-a, b)} ${op} ${fh(c, d)} = ? Write it in simplest form.`, frac(r[0], r[1], 'simplest'), `Common denominator ${L}: ${FR(-a * L / b, L)} ${op} ${fh(c * L / d, L)} = ${FR(-a * L / b + c2 * L / d, L)}${E3.gcd(-a * L / b + c2 * L / d, L) > 1 ? ' = ' + FM(r[0], r[1]) : ''}.`);
    } },
    b: { t: 'negative decimals', g: R => {
      const dp = R.pick([1, 2]), x = -R.int(11, dp === 1 ? 99 : 999), y = R.int(11, dp === 1 ? 99 : 999) * R.pick([-1, 1]), op = R.pick(['+', '−']);
      const v = op === '+' ? x + y : x - y;
      return num(`${D(x, dp)} ${op} ${PD(y, dp)} = ?`, v / 10 ** dp, op === '+' ? (y < 0 ? `Same signs: add the sizes and keep the minus: ${D(v, dp)}.` : `Different signs: ${D(Math.max(-x, y), dp)} − ${D(Math.min(-x, y), dp)} = ${D(Math.abs(v), dp)}, sign of the larger size: ${D(v, dp)}.`) : `Add the opposite: ${D(x, dp)} + ${PD(-y, dp)} = ${D(v, dp)}.`);
    } },
    c: { t: 'mixed forms', g: R => {
      const [n, d] = R.pick([[1, 2], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [4, 5]]), w = R.int(1, 4), y = R.int(1, 40) * 5 * R.pick([-1, 1]);
      const first = -(w * d + n) / d * 100, v = first + y;
      if (R.bool(0.3)) return choice(R, `What does −${fh(n, d, w)} mean?`, `−${w} − ${fh(n, d)}`, [`−${w} + ${fh(n, d)}`, `${w} − ${fh(n, d)}`, `−${w} × ${fh(n, d)}`], `−${fh(n, d, w)} is the opposite of ${w} + ${fh(n, d)}, which is −${w} − ${fh(n, d)} = ${fmt(first / 100)}.`);
      return num(`−${fh(n, d, w)} + ${PD(y)} = ? (Give a decimal or a fraction.)`, v / 100, `−${fh(n, d, w)} = ${fmt(first / 100)}, not −${w} + ${fh(n, d)}. Then ${fmt(first / 100)} + ${PD(y)} = ${fmt(v / 100)}.`);
    } },
    d: { t: 'in context', g: (R, O) => {
      const kind = R.int(0, 2);
      if (kind === 0) { const u = deg(O), s = -R.int(5, 95), up = R.int(20, 120), e = s + up;
        return num(`It is ${D(s, 1)}${u}. It warms up ${D(up, 1)} degrees. What is the temperature now?`, e / 10, `${D(s, 1)} + ${D(up, 1)} = ${D(e, 1)}${u}.`); }
      if (kind === 1) { const u = len(O), s = -R.int(50, 300), up = R.int(10, 120), e = s + up;
        return num(`A diver is at ${D(s, 1)} ${u}. She rises ${D(up, 1)} ${u}. What is her height now?`, e / 10, `${D(s, 1)} + ${D(up, 1)} = ${D(e, 1)} ${u}.`); }
      const k = O.coins === 'THB' ? 100 : 1, s = -R.int(100, 3000) * k / 100, dep = R.int(100, 3000) * k / 100;
      const sc = Math.round(s * 100), dc = Math.round(dep * 100), e = (sc + dc) / 100;
      return num(`A balance is ${M(s, O)}. Then ${M(dep, O)} is paid in. What is the balance now?`, e, `${M(s, O)} + ${M(dep, O)} = ${M(e, O)}.`);
    } },
  } });

  /* ================= III.1.11 Multiply and divide rationals ================= */
  E3.skill({ id: 'III.1.11', name: 'Multiply and divide rationals', steps: {
    a: { t: 'negative fractions', g: R => {
      let a, b, c, d; do { b = R.int(2, 9); a = R.int(1, b - 1); d = R.int(2, 9); c = R.int(1, d - 1); } while (E3.gcd(a, b) > 1 || E3.gcd(c, d) > 1);
      const sa = R.pick([-1, 1]), sc = sa > 0 ? -1 : R.pick([-1, 1]);
      const r = mul([sa * a, b], [sc * c, d]);
      return num(`${FR(sa * a, b)} × ${sc < 0 ? '(' + FR(-c, d) + ')' : fh(c, d)} = ? Write it in simplest form.`, frac(r[0], r[1], 'simplest'), `Tops: ${a * c}, bottoms: ${b * d}; ${r[0] < 0 ? 'different signs, so negative' : 'same signs, so positive'}: ${FR(sa * sc * a * c, b * d)}${E3.gcd(a * c, b * d) > 1 ? ' = ' + FM(r[0], r[1]) : ''}.`);
    } },
    b: { t: 'decimals', g: R => {
      if (R.bool()) { let x, y; do { x = R.int(2, 40) * R.pick([-1, 1]); y = R.int(2, 40) * R.pick([-1, 1]); } while (x % 10 === 0 || y % 10 === 0 || (x > 0 && y > 0)); const p = x * y;
        return num(`${D(x, 1)} × ${PD(y, 1)} = ?`, p / 100, `${Math.abs(x)} × ${Math.abs(y)} = ${Math.abs(p)}, and tenths × tenths give hundredths: ${D(Math.abs(p), 2)}. ${p < 0 ? 'Different signs: negative.' : 'Same signs: positive.'}`); }
      let q, dv; do { q = R.int(2, 12) * R.pick([-1, 1]); dv = R.int(2, 9) * R.pick([-1, 1]); } while (q > 0 && dv > 0); const n = q * dv;
      return num(`${D(n, 1)} ÷ ${PD(dv, 1)} = ?`, q, `Multiply both by 10: ${fmt(n)} ÷ ${P(dv)} = ${fmt(q)}.`);
    } },
    c: { t: 'reciprocals', g: R => {
      let a, b; do { a = R.int(1, 9); b = R.int(2, 9); } while (E3.gcd(a, b) !== 1 || a === b);
      const kind = R.int(0, 3);
      if (kind === 0) return num(`What is the reciprocal of −${fh(a, b)}?`, frac(-b, a), `Flip it and keep the sign: −${fh(b, a)}. Check: −${fh(a, b)} × (−${fh(b, a)}) = 1.`);
      if (kind === 1) { const k = R.int(2, 12); return num(`What is the reciprocal of ${fmt(-k)}?`, frac(-1, k), `${fmt(-k)} = ${fh(fmt(-k), 1)}, so its reciprocal is −${fh(1, k)}.`); }
      let c, d; do { c = R.int(1, 9); d = R.int(2, 9); } while (E3.gcd(c, d) !== 1 || c === d);
      if (kind === 2) return choice(R, `${FR(-a, b)} ÷ ${fh(c, d)} is the same as:`, `${FR(-a, b)} × ${fh(d, c)}`, [`${FR(-b, a)} × ${fh(c, d)}`, `${FR(-b, a)} × ${fh(d, c)}`, `${FR(-a, b)} × ${fh(c, d)}`], `Flip only the number you divide by: ÷ ${fh(c, d)} becomes × ${fh(d, c)}.`);
      const r = mul([-a, b], [d, c]);
      return num(`${FR(-a, b)} ÷ ${fh(c, d)} = ? Write it in simplest form.`, frac(r[0], r[1], 'simplest'), `${FR(-a, b)} × ${fh(d, c)} = ${FR(-a * d, b * c)}${E3.gcd(a * d, b * c) > 1 ? ' = ' + FM(r[0], r[1]) : ''}.`);
    } },
    d: { t: 'fractions of fractions', g: R => {
      let a, b, c, d; do { a = R.int(1, 4); b = R.int(a + 1, 6); c = R.int(1, 8); d = R.int(2, 10); } while (E3.gcd(a, b) > 1 || E3.gcd(c, d) > 1);
      if (R.bool(0.3)) { const k = b * R.int(1, 5), r = mul([a, b], [-k, 1]);
        return num(`What is ${fh(a, b)} of ${fmt(-k)}?`, r[0] / r[1], `${fmt(-k)} ÷ ${b} × ${a} = ${fmt(r[0] / r[1])}.`); }
      if (R.bool(0.45)) { // a fraction of a fraction of a whole number: two "of"s in a row
        let p, q; do { q = R.int(2, 6); p = R.int(1, q - 1); } while (E3.gcd(p, q) > 1);
        const k = b * q * R.int(1, 3), m1 = -k / q * p, r2 = m1 / b * a;
        return num(`What is ${fh(a, b)} of ${fh(p, q)} of ${fmt(-k)}?`, r2, `Work from the right. ${fh(p, q)} of ${fmt(-k)} is ${fmt(-k)} ÷ ${q} × ${p} = ${fmt(m1)}. Then ${fh(a, b)} of ${fmt(m1)} is ${fmt(m1)} ÷ ${b} × ${a} = ${fmt(r2)}.`); }
      if (R.bool(0.5)) { // cancel before multiplying
        let a2, b2, c2, d2; do { const p = R.int(1, 4), q = R.int(p + 1, 5), x = R.int(2, 4), y = R.int(2, 4);
          [a2, b2] = E3.reduce(p * x, q * y); [c2, d2] = E3.reduce(q * R.pick([1, 2]), p * x * R.pick([2, 3]));
        } while (a2 >= b2 || c2 >= d2 || (a2 / E3.gcd(a2, d2) === 1 && b2 / E3.gcd(c2, b2) === 1)); const r = mul([a2, b2], [-c2, d2]);
        if (a2 * c2 === 1 || E3.gcd(a2, d2) * E3.gcd(c2, b2) === 1) { const r0 = mul([a, b], [-c, d]); return num(`What is ${fh(a, b)} of −${fh(c, d)}? Write it in simplest form.`, frac(r0[0], r0[1], 'simplest'), `"Of" means ×: ${fh(a, b)} × (−${fh(c, d)}) = ${FR(-a * c, b * d)}${E3.gcd(a * c, b * d) > 1 ? ' = ' + FM(r0[0], r0[1]) : ''}.`); }
        const g1 = E3.gcd(a2, d2), g2 = E3.gcd(c2, b2);
        return num(`What is ${fh(a2, b2)} of −${fh(c2, d2)}? Cancel first, then write it in simplest form.`, frac(r[0], r[1], 'simplest'), `"Of" means ×. Cancel across: ${g1 > 1 ? `${a2} and ${d2} share ${g1}` : ''}${g1 > 1 && g2 > 1 ? ', and ' : ''}${g2 > 1 ? `${c2} and ${b2} share ${g2}` : ''}. So ${fh(a2, b2)} × (−${fh(c2, d2)}) = ${b2 / g2 === 1 ? a2 / g1 : fh(a2 / g1, b2 / g2)} × (−${d2 / g1 === 1 ? c2 / g2 : fh(c2 / g2, d2 / g1)}) = ${FM(r[0], r[1])}.`); }
      const r = mul([a, b], [-c, d]);
      return num(`What is ${fh(a, b)} of −${fh(c, d)}? Write it in simplest form.`, frac(r[0], r[1], 'simplest'), `"Of" means ×: ${fh(a, b)} × (−${fh(c, d)}) = ${FR(-a * c, b * d)}${E3.gcd(a * c, b * d) > 1 ? ' = ' + FM(r[0], r[1]) : ''}.`);
    } },
  } });

  /* ================= III.1.12 Terminating and repeating decimals ================= */
  const REP = []; [3, 6, 7, 9, 11, 12, 15, 18, 22, 27, 33, 30, 45].forEach(d => { for (let n = 1; n < d; n++) if (E3.gcd(n, d) === 1 && expand(n, d).rep.length <= 6) REP.push([n, d]); });
  E3.skill({ id: 'III.1.12', name: 'Terminating and repeating decimals', steps: {
    a: { t: 'fraction to decimal by division', g: R => {
      const d = R.pick([2, 4, 5, 8, 20, 25, 40, 50]); let n; do { n = R.int(1, 2 * d - 1); } while (E3.gcd(n, d) !== 1);
      const s = R.bool(0.3) ? -1 : 1;
      return num(`Write ${s < 0 ? '−' : ''}${fh(n, d)} as a decimal.`, s * n / d, `Divide ${n} by ${d}: ${n} ÷ ${d} = ${fmt(n / d)}${s < 0 ? ', so the answer is ' + fmt(-n / d) : ''}. The division ends.`);
    } },
    b: { t: 'decimals that end', g: R => {
      if (R.bool(0.3)) { const k = R.int(1, 9);
        return choice(R, `Which fraction equals 0.${k}?`, fh(k, 10), [fh(k, 9), fh(k, 100), fh(1, k + 1)].concat(k === 3 ? [fh(1, 3)] : []), `0.${k} ends after 1 place, so it is exactly ${fh(k, 10)}.${k === 3 ? ` (${fh(1, 3)} = 0.333… never ends.)` : ''}`); }
      const dp = R.pick([2, 3]), P10 = 10 ** dp; let k; do { k = R.int(1, P10 - 1); } while (k % 10 === 0 || E3.gcd(k, P10) === 1);
      const [n, d] = E3.reduce(k, P10);
      return num(`Write ${fmt(k / P10)} as a fraction in simplest form.`, frac(n, d, 'simplest'), `${fmt(k / P10)} = ${fh(k, P10)} = ${fh(n, d)} (divide top and bottom by ${k / n}).`);
    } },
    c: { t: 'repeating, with a bar', g: R => {
      const [n, d] = R.pick(REP), e = expand(n, d), right = decHTML(e);
      const trunc = `${e.ip}.${e.pre}${e.rep}`, ds = [trunc];
      if (e.pre) ds.push(`${e.ip}.${OL(e.pre + e.rep)}`);
      if (e.rep.length > 1) ds.push(`${e.ip}.${e.pre}${e.rep.slice(0, -1)}${OL(e.rep.slice(-1))}`);
      ds.push(`${e.ip}.${e.pre}${e.rep}${e.rep}`);
      return choice(R, `Divide to write ${fh(n, d)} as a decimal.`, right, ds, `${n} ÷ ${d} = ${e.ip}.${e.pre}${e.rep}${e.rep}… The block ${e.rep} repeats forever, so write ${right}.`);
    } },
    d: { t: 'predict from the denominator', g: R => {
      let n, d; do { d = R.int(3, 40); n = R.int(1, d - 1); } while (d % 10 === 0 && R.bool(0.7));
      if (R.bool(0.3)) { const k = R.pick([3, 7, 9]); const b = R.pick([2, 4, 5, 8, 10, 20]); d = b * k; n = k * R.pick([1, 3].filter(x => E3.gcd(x, b) === 1)); }
      const [rn, rd] = E3.reduce(n, d), t = onlyTwoFive(rd), pr = primeList(rd);
      return choiceFixed(`Does ${fh(n, d)} give a decimal that ends or one that repeats?`, ['It ends', 'It repeats'], t ? 0 : 1,
        `${rn !== n ? `In lowest terms it is ${fh(rn, rd)}. ` : ''}${rd === 1 ? 'It is a whole number.' : `${rd} = ${pr.join(' × ')}`}${rd === 1 ? '' : t ? ': only 2s and 5s, so it ends.' : `: it has a factor other than 2 and 5, so it repeats.`}`);
    } },
  } });

  /* ================= III.1.13 Repeating decimals to fractions ================= */
  E3.skill({ id: 'III.1.13', name: 'Repeating decimals to fractions', steps: {
    a: { t: '0.333…', g: R => {
      const k = R.int(1, 8), w = R.bool(0.25) ? R.int(1, 3) : 0, [n, d] = E3.reduce(k, 9);
      return num(`Write ${w}.${OL(k)} = ${w}.${k}${k}${k}… as a fraction in simplest form.`, frac(w * d + n, d, 'simplest'), `Let <i>x</i> = 0.${OL(k)}. Then 10<i>x</i> − <i>x</i> = ${k}, so <i>x</i> = ${fh(k, 9)}${n !== k ? ' = ' + fh(n, d) : ''}${w ? `, and the answer is ${fh(n, d, w)}` : ''}.`);
    } },
    b: { t: '0.121212…', g: R => {
      let ab; do { ab = R.int(1, 98); } while (ab % 11 === 0);
      const s = String(ab).padStart(2, '0'), [n, d] = E3.reduce(ab, 99);
      return num(`Write 0.${OL(s)} = 0.${s}${s}${s}… as a fraction in simplest form.`, frac(n, d, 'simplest'), `Let <i>x</i> = 0.${OL(s)}. 100<i>x</i> − <i>x</i> = ${ab}, so 99<i>x</i> = ${ab} and <i>x</i> = ${fh(ab, 99)}${n !== ab ? ' = ' + fh(n, d) : ''}.`);
    } },
    c: { t: 'a delayed repeat', g: R => {
      let a, b; do { a = R.int(0, 9); b = R.int(1, 9); } while (a === b);
      const top = 10 * a + b - a, [n, d] = E3.reduce(top, 90);
      return num(`Write 0.${a}${OL(b)} = 0.${a}${b}${b}${b}… as a fraction in simplest form.`, frac(n, d, 'simplest'), `Let <i>x</i> = 0.${a}${OL(b)}. 100<i>x</i> − 10<i>x</i> = ${10 * a + b}.${OL(b)} − ${a}.${OL(b)} = ${top}, so <i>x</i> = ${fh(top, 90)}${d !== 90 ? ' = ' + fh(n, d) : ''}.`);
    } },
    d: { t: '0.999… = 1', g: R => {
      const kind = R.int(0, 3);
      if (kind === 0) { const a = R.int(1, 8); return num(`0.${a}${OL(9)} = 0.${a}999… Write it as a decimal that ends.`, (a + 1) / 10, `0.0${OL(9)} = 0.1, so 0.${a}${OL(9)} = 0.${a} + 0.1 = 0.${a + 1}.`); }
      if (kind === 1) return num(`Let <i>x</i> = 0.${OL(9)}. What is 10<i>x</i> − <i>x</i>?`, 9, `10<i>x</i> = 9.${OL(9)}, and subtracting <i>x</i> = 0.${OL(9)} cancels the tail: 9. So 9<i>x</i> = 9 and <i>x</i> = 1.`);
      if (kind === 2) { const k = R.pick([3, 9]); const t = k === 3 ? `3 × 0.${OL(3)}` : `9 × 0.${OL(1)}`;
        return choice(R, `What is ${t}?`, '1', ['0.9', 'just under 1', '0.99'], `${k === 3 ? `0.${OL(3)} = ${fh(1, 3)}, and 3 × ${fh(1, 3)}` : `0.${OL(1)} = ${fh(1, 9)}, and 9 × ${fh(1, 9)}`} = 1. So 0.${OL(9)} = 1.`); }
      const S = [[`0.${OL(9)} is a little less than 1.`, false], [`0.${OL(9)} = 1`, true], [`There is a number between 0.${OL(9)} and 1.`, false], [`2.${OL(9)} = 3`, true], [`0.${OL(9)} = 0.99`, false], [`0.${OL(9)} and 1 are the same number.`, true]];
      const [st, t] = R.pick(S);
      return tf(`True or false? ${st}`, t, `0.${OL(9)} equals 1 exactly: 10<i>x</i> − <i>x</i> = 9 gives <i>x</i> = 1, and no number fits between them.`);
    } },
  } });

  /* ================= III.1.14 Compare and order rationals ================= */
  const ap = v => fmt(Math.round(v * 1000) / 1000) + (Number.isInteger(Math.round(v * 1e6) / 1000) ? '' : '…');
  const FRS = [[1, 2], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [4, 5], [1, 8], [3, 8], [5, 8], [7, 8], [1, 3], [2, 3], [7, 10], [9, 20], [11, 20]];
  E3.skill({ id: 'III.1.14', name: 'Compare and order rationals', steps: {
    a: { t: 'fractions and decimals', g: R => {
      const [n, d] = R.pick(FRS), v = n / d, near = Math.round(v * 100);
      let k = R.pick([near, near, near - R.int(1, 8), near + R.int(1, 8), near - 5]); if (k <= 0) k = near + 3;
      if (R.bool(0.3) && Number.isInteger(v * 10)) k = v * 100 - 5;
      const dec = fmt(k / 100), r = cmp(k * d, n * 100), flip = R.bool();
      const [L, Rt] = flip ? [dec, fh(n, d)] : [fh(n, d), dec], rr = flip ? r : 2 - r;
      return choiceFixed(`Which sign goes in the circle? ${NB(`${L} ◯ ${Rt}`)}`, SIGNS, rr, `${fh(n, d)} = ${decHTML(expand(n, d))}. Compare with ${dec}${k % 10 ? '' : ' = ' + fmt(k / 100, { dp: 2 })}: ${L} ${SIGNS[rr]} ${Rt}.`);
    } },
    b: { t: 'negatives', g: R => {
      if (R.bool(0.2)) { const A2 = R.pick(FRS.filter(([n, d]) => Number.isInteger(n / d * 1000))), dv = fmt(-A2[0] / A2[1]), fv = `−${fh(A2[0], A2[1])}`, [l, r] = R.bool() ? [dv, fv] : [fv, dv];
        return choiceFixed(`Which sign goes in the circle? ${NB(`${l} ◯ ${r}`)}`, SIGNS, 1, `${fh(A2[0], A2[1])} = ${fmt(A2[0] / A2[1])}, so ${l} and ${r} are the same number.`); }
      let A, B; do { A = R.pick(FRS); B = R.pick(FRS); } while (A[0] * B[1] === B[0] * A[1]);
      const useDec = R.bool(0.4), va = -A[0] / A[1], vb = -B[0] / B[1];
      const sa = useDec && Number.isInteger(A[0] / A[1] * 1000) ? fmt(va) : `−${fh(A[0], A[1])}`, sb = `−${fh(B[0], B[1])}`;
      const r = cmp(va, vb);
      return choiceFixed(`Which sign goes in the circle? ${NB(`${sa} ◯ ${sb}`)}`, SIGNS, r, `Sizes: ${ap(-va)} and ${ap(-vb)}. Among negatives, the bigger size is the smaller number: ${sa} ${SIGNS[r]} ${sb}.`);
    } },
    c: { t: 'on a number line', g: R => {
      const den = R.pick([2, 3, 4]); let k; do { k = R.int(-2 * den + 1, -1); } while (k % den === 0);
      const pool = R.shuffle(Array.from({ length: 4 * den - 1 }, (_, i) => i - 2 * den + 1).filter(x => x % den !== 0 && x !== k && x !== -k)), others = [-k];
      pool.forEach(x => { if (others.length < 3 && [k, ...others].every(y => Math.abs(x - y) >= 2)) others.push(x); });
      const pts = R.shuffle([k, ...others]).map((x, i) => [x, 'ABCD'[i]]), ans = pts.find(p => p[0] === k)[1];
      return choiceFixed(`Which letter shows ${FM(k, den)}?`, pts.map(p => p[1]), 'ABCD'.indexOf(ans), `${FM(k, den)} is ${-k} part${k < -1 ? 's' : ''} of ${fh(1, den)} left of 0: letter ${ans}.`, { visual: V1.line(-2, 2, den, { letters: pts }) });
    } },
    d: { t: 'mixed lists', g: R => {
      let items; do {
        const [a, b] = R.pick(FRS), [c, d] = R.pick(FRS), x = R.int(1, 19) * 5, y = R.int(1, 99);
        items = [{ s: `−${fh(a, b)}`, v: -a / b }, { s: fmt(-x / 100), v: -x / 100 }, { s: fh(c, d), v: c / d }, { s: fmt(y / 100), v: y / 100 }];
      } while (new Set(items.map(i => Math.round(i.v * 1e6))).size < 4);
      const list = R.shuffle(items), j = a => a.map(i => i.s).join(', '), jp = a => a.map((i, k) => NB(i.s + (k < a.length - 1 ? ',' : ''))).join(' ');
      const asc = list.slice().sort((p, q) => p.v - q.v), byAbs = list.slice().sort((p, q) => Math.abs(p.v) - Math.abs(q.v));
      const negWrong = [...list.filter(i => i.v < 0).sort((p, q) => q.v - p.v), ...list.filter(i => i.v > 0).sort((p, q) => p.v - q.v)];
      return choice(R, `Order from least to greatest: ${jp(list)}`, j(asc), [j(byAbs), j(negWrong), j(asc.slice().reverse())], `As decimals: ${asc.map(i => fmt(Math.round(i.v * 1000) / 1000) + (Number.isInteger(i.v * 1000) ? '' : '…')).join(' &lt; ')}.`);
    } },
  } });

  /* ================= III.1.15 All four quadrants ================= */
  const QN = ['I', 'II', 'III', 'IV'], quad = (x, y) => x > 0 ? (y > 0 ? 0 : 3) : (y > 0 ? 1 : 2);
  const pt = R => { let x, y; do { x = R.int(-5, 5); y = R.int(-5, 5); } while (!x || !y || Math.abs(x) === Math.abs(y)); return [x, y]; };
  E3.skill({ id: 'III.1.15', name: 'All four quadrants', steps: {
    a: { t: 'the quadrants', g: R => {
      const x = R.int(1, 12) * R.pick([-1, 1]), y = R.int(1, 12) * R.pick([-1, 1]), q = quad(x, y);
      return choiceFixed(`Which quadrant is ${coord(x, y)} in?`, QN, q, `x is ${x > 0 ? 'positive (right)' : 'negative (left)'} and y is ${y > 0 ? 'positive (up)' : 'negative (down)'}: quadrant ${QN[q]}. Quadrants count counterclockwise from the top right.`);
    } },
    b: { t: 'plot points', g: R => {
      const [x, y] = pt(R);
      if (R.bool(0.5)) return num(`What are the coordinates of P?`, [{ label: 'x', ans: x }, { label: 'y', ans: y }], `P is ${Math.abs(x)} ${x > 0 ? 'right' : 'left'} and ${Math.abs(y)} ${y > 0 ? 'up' : 'down'}: ${coord(x, y)}.`, { visual: V.plane({ points: [[x, y, 'P']] }) });
      const cand = R.shuffle([[x, y], [y, x], [-x, y], [x, -y]]).map((p, i) => [p[0], p[1], 'ABCD'[i]]), ans = cand.find(p => p[0] === x && p[1] === y)[2];
      return choiceFixed(`Which point is at ${coord(x, y)}?`, ['A', 'B', 'C', 'D'], 'ABCD'.indexOf(ans), `Go ${Math.abs(x)} ${x > 0 ? 'right' : 'left'} first (x), then ${Math.abs(y)} ${y > 0 ? 'up' : 'down'} (y): point ${ans}.`, { visual: V.plane({ points: cand }) });
    } },
    c: { t: 'reflect across the axes', g: R => {
      const [x, y] = pt(R), ax = R.pick(['x', 'y', 'both']);
      const [nx, ny] = ax === 'x' ? [x, -y] : ax === 'y' ? [-x, y] : [-x, -y];
      const txt = ax === 'both' ? 'across the x-axis and then across the y-axis' : `across the ${ax}-axis`;
      return num(`Reflect P${coord(x, y)} ${txt}. Where does it land?`, [{ label: 'x', ans: nx }, { label: 'y', ans: ny }], (ax === 'x' ? 'Across the x-axis, x stays and y changes sign.' : ax === 'y' ? 'Across the y-axis, y stays and x changes sign.' : 'Both signs change.') + ` P lands at ${coord(nx, ny)}.`, { visual: V.plane({ points: [[x, y, 'P']] }) });
    } },
    d: { t: 'distance along a line', g: R => {
      const horiz = R.bool(), c = R.int(1, 5) * R.pick([-1, 1]), p = -R.int(1, 5), q = R.int(1, 5);
      const A = horiz ? [p, c] : [c, p], B = horiz ? [q, c] : [c, q];
      if (R.bool(0.5)) { const a = -R.int(6, 20), b = R.int(3, 20), k = R.int(-9, 9);
        return num(`How far is ${coord(a, k)} from ${coord(b, k)}?`, b - a, `Same y, so subtract the x-values: ${b} − ${P(a)} = ${b - a}.`); }
      return num(`How far apart are A${coord(...A)} and B${coord(...B)}?`, q - p, `Same ${horiz ? 'y' : 'x'}, so count along: ${q} − ${P(p)} = ${q - p}.`, { visual: V.plane({ points: [[...A, 'A'], [...B, 'B']], segments: [[...A, ...B]] }) });
    } },
  } });
})();

/* Era III · Unit III.2 Ratios & rates (III.2.01–III.2.15)
   Tape diagrams, double number lines and graphs are drawn to scale. */
(function () {
  const { choice, choiceFixed, tf, frac, fh, fmt, m, V, C } = E3;
  const num = (p, a, e, x) => E3.num(p, a && a.frac ? [a] : a, e, x);   // lets a single frac() be the answer

  /* ---------- helpers ---------- */
  const red = (n, d) => E3.reduce(n, d);
  const gcd = E3.gcd;
  const ratio = (a, b) => `${fmt(a)} : ${fmt(b)}`;
  const money = (v, O) => { const s = Number.isInteger(Math.round(v * 1000) / 1000) ? fmt(v) : fmt(v, { dp: 2 }); return O.coins === 'THB' ? `${s} baht` : `$${s}`; };
  const cur = O => O.coins === 'THB' ? 'baht' : 'dollars';
  const imp = O => O.units === 'imperial';
  const DIST = O => imp(O) ? { u: 'mi', w: 'miles', sp: 'mph', one: 'mile' } : { u: 'km', w: 'km', sp: 'km/h', one: 'km' };
  const F = (n, d) => { [n, d] = red(n, d); return d === 1 ? fmt(n) : n > d ? fh(n % d, d, Math.floor(n / d)) : fh(n, d); };
  const ok3 = x => Math.abs(Math.round(x * 1000) - x * 1000) < 1e-6;            // at most 3 decimal places
  const SIGNS = ['&lt;', '=', '&gt;'];

  /* ---------- visuals (prefix V2) ---------- */
  const V2 = {};
  // row of a red circles and b blue squares
  V2.shapes = function (a, b) {
    const g = 30; let body = '';
    for (let i = 0; i < a; i++) body += V.dot(18 + i * g, 20, 11, C.red);
    for (let j = 0; j < b; j++) body += `<rect x="${7 + (a + j) * g + 12}" y="9" width="22" height="22" rx="3" fill="${C.blue}"/>`;
    return V.svg((a + b) * g + 24, 40, body, `${a} circles and ${b} squares`);
  };
  // tape diagram: rows [{label, n, color, total?}] — every box is the same width, so the tapes are to scale.
  // o.box: text inside every box (e.g. '?' or a value), o.whole: label for a brace over all boxes
  V2.tape = function (rows, o = {}) {
    const maxN = Math.max(...rows.map(r => r.n)), u = Math.min(46, Math.floor(300 / maxN)), lw = 78, rh = 34, gap = 14;
    const top = o.whole ? 30 : 6; let b = '';
    rows.forEach((r, i) => {
      const y = top + i * (rh + gap);
      b += V.text(lw - 8, y + rh / 2, r.label, { size: 14, anchor: 'end', weight: 600 });
      for (let k = 0; k < r.n; k++) {
        b += `<rect x="${lw + k * u}" y="${y}" width="${u}" height="${rh}" fill="${r.color || C.set[i]}33" stroke="${C.ink}" stroke-width="1.8"/>`;
        if (o.box !== undefined) b += V.text(lw + k * u + u / 2, y + rh / 2, o.box, { size: 13, fill: C.muted });
      }
      if (r.total !== undefined) b += `<path d="M${lw + r.n * u + 6} ${y + 2} q6 0 6 6 v${rh / 2 - 10} l5 4 l-5 4 v${rh / 2 - 10} q0 6 -6 6" fill="none" stroke="${C.ink}" stroke-width="1.5"/>` + V.text(lw + r.n * u + 22, y + rh / 2, r.total, { size: 15, anchor: 'start', weight: 700 });
    });
    if (o.whole) { const w = Math.max(...rows.map(r => r.n)) * u; b += `<path d="M${lw} ${top - 4} v-6 h${w} v6" fill="none" stroke="${C.ink}" stroke-width="1.5"/>` + V.text(lw + w / 2, 12, o.whole, { size: 14, weight: 700 }); }
    const W = lw + maxN * u + 80;
    return V.svg(W, top + rows.length * (rh + gap) - gap + 4, b, 'tape diagram');
  };
  // double number line: top {label, vals}, bot {label, vals}; vals[0] = 0; positions to scale by the top values.
  // ask: {row:'top'|'bot', i}
  V2.dnl = function (top, bot, o = {}) {
    const W = 440, x0 = 92, x1 = W - 22, max = top.vals[top.vals.length - 1], X = v => x0 + v / max * (x1 - x0), y1 = 30, y2 = 88;
    let b = '';
    [[top, y1, 'top'], [bot, y2, 'bot']].forEach(([row, y, key]) => {
      b += `<line x1="${x0 - 6}" y1="${y}" x2="${x1 + 12}" y2="${y}" stroke="${C.ink}" stroke-width="2"/>` + V.text(10, y, row.label, { size: 14, anchor: 'start', weight: 600 });
      row.vals.forEach((v, i) => {
        const x = X(top.vals[i]);
        b += `<line x1="${x}" y1="${y - 7}" x2="${x}" y2="${y + 7}" stroke="${C.ink}" stroke-width="2"/>`;
        const asked = o.ask && o.ask.row === key && o.ask.i === i;
        if (asked) b += `<circle cx="${x}" cy="${key === 'top' ? y - 20 : y + 21}" r="11" fill="${C.amber}"/>` + V.text(x, key === 'top' ? y - 20 : y + 21, '?', { size: 15, weight: 700 });
        else b += V.text(x, key === 'top' ? y - 18 : y + 20, fmt(v), { size: 14, weight: 600 });
      });
    });
    return V.svg(W, 116, b, 'double number line');
  };
  // ratio table: headers (row names), rows (arrays of equal length); a cell that is a string is shown highlighted (e.g. '?', 'A')
  V2.table = function (headers, rows, o = {}) {
    const cw = o.cw || 58, hw = o.hw || 96, rh = 36, n = rows[0].length; let b = '';
    rows.forEach((r, i) => {
      const y = 2 + i * rh;
      b += `<rect x="2" y="${y}" width="${hw}" height="${rh}" fill="${C.faint}" stroke="${C.ink}" stroke-width="1.5"/>` + V.text(2 + hw / 2, y + rh / 2, headers[i], { size: 14, weight: 700 });
      r.forEach((c, j) => {
        const x = 2 + hw + j * cw, hot = typeof c === 'string';
        b += `<rect x="${x}" y="${y}" width="${cw}" height="${rh}" fill="${hot ? C.amber + '55' : C.paper}" stroke="${C.ink}" stroke-width="1.5"/>` + V.text(x + cw / 2, y + rh / 2, hot ? c : fmt(c), { size: 16, weight: hot ? 700 : 500 });
      });
    });
    return V.svg(hw + n * cw + 4, rows.length * rh + 4, b, 'ratio table');
  };
  // first-quadrant graph. o: xmax, ymax, xstep (grid+labels), ystep, xlab, ylab, lines:[{k, c, label, color}] (y = kx + c),
  // points:[[x,y,'A']], dots:[[x,y]] (unlabelled)
  V2.graph = function (o) {
    const pw = 300, ph = 240, L = 46, T = 14, xs = o.xstep || 1, ys = o.ystep || 1;
    const X = v => L + v / o.xmax * pw, Y = v => T + ph - v / o.ymax * ph;
    let b = '';
    for (let v = 0; v <= o.xmax + 1e-9; v += xs) b += `<line x1="${X(v)}" y1="${Y(0)}" x2="${X(v)}" y2="${Y(o.ymax)}" stroke="${C.faint}" stroke-width="1.2"/>` + (v ? V.text(X(v), Y(0) + 14, fmt(v), { size: 12, fill: C.muted }) : '');
    for (let v = 0; v <= o.ymax + 1e-9; v += ys) b += `<line x1="${X(0)}" y1="${Y(v)}" x2="${X(o.xmax)}" y2="${Y(v)}" stroke="${C.faint}" stroke-width="1.2"/>` + (v ? V.text(X(0) - 8, Y(v), fmt(v), { size: 12, fill: C.muted, anchor: 'end' }) : '');
    b += `<line x1="${X(0)}" y1="${Y(0)}" x2="${X(o.xmax) + 8}" y2="${Y(0)}" stroke="${C.ink}" stroke-width="2"/><line x1="${X(0)}" y1="${Y(0)}" x2="${X(0)}" y2="${Y(o.ymax) - 8}" stroke="${C.ink}" stroke-width="2"/>` + V.text(X(0) - 8, Y(0) + 12, '0', { size: 12, fill: C.muted, anchor: 'end' });
    if (o.xlab) b += V.text(L + pw / 2, T + ph + 34, o.xlab, { size: 13, weight: 600 });
    if (o.ylab) b += `<text x="12" y="${T + ph / 2}" font-size="13" font-weight="600" fill="${C.ink}" text-anchor="middle" transform="rotate(-90 12 ${T + ph / 2})">${V.esc(o.ylab)}</text>`;
    (o.lines || []).forEach((ln, i) => {
      const col = ln.color || [C.blue, C.red, C.teal, C.violet][i % 4], c = ln.c || 0;
      let xe = o.xmax; if (ln.k * xe + c > o.ymax) xe = (o.ymax - c) / ln.k;
      b += `<line x1="${X(0)}" y1="${Y(c)}" x2="${X(xe)}" y2="${Y(ln.k * xe + c)}" stroke="${col}" stroke-width="2.8"/>`;
      if (ln.label) {   // label beside the line at 80% of its length, pushed off to the upper-left side
        const px = X(0), py = Y(c), qx = X(xe), qy = Y(ln.k * xe + c), len = Math.hypot(qx - px, qy - py) || 1, ux = (qx - px) / len, uy = (qy - py) / len, t = ln.at || 0.8;
        b += V.text(px + t * (qx - px) + 13 * uy, py + t * (qy - py) - 13 * ux, ln.label, { size: 15, weight: 700, fill: col });
      }
    });
    (o.dots || []).forEach(([x, y]) => b += V.dot(X(x), Y(y), 5, C.ink));
    (o.points || []).forEach(([x, y, t]) => b += V.dot(X(x), Y(y), 5.5, C.red) + V.text(X(x) + 11, Y(y) - 10, t, { size: 14, weight: 700 }));
    return V.svg(L + pw + 20, T + ph + (o.xlab ? 44 : 22), b, 'graph');
  };

  /* ================= III.2.01 Ratio language ================= */
  const PAIRS = [['girls', 'boys'], ['cats', 'dogs'], ['apples', 'pears'], ['red beads', 'blue beads'], ['cars', 'bikes'], ['teachers', 'students']];
  const coprime = (R, lo, hi) => { let a, b; do { a = R.int(lo, hi); b = R.int(lo, hi); } while (a === b || gcd(a, b) !== 1); return [a, b]; };
  E3.skill({ id: 'III.2.01', name: 'Ratio language', steps: {
    a: { t: '"a to b"', g: R => {
      const [a, b] = R.distinct(2, 7, 2), rev = R.bool();
      const [p, q, P, Q] = rev ? [b, a, 'squares', 'circles'] : [a, b, 'circles', 'squares'];
      return choice(R, `What is the ratio of ${P} to ${Q}?`, `${p} to ${q}`, [`${q} to ${p}`, `${p} to ${a + b}`, `${a + b} to ${q}`], `There are ${p} ${P} and ${q} ${Q}. Order matters: ${P} first, so ${p} to ${q}.`, { visual: V2.shapes(a, b) });
    } },
    b: { t: 'part to part', g: R => {
      const [x, y] = R.pick(PAIRS), [a, b] = coprime(R, 1, 7), k = R.int(2, 6);
      return num(`A group has ${k * a} ${x} and ${k * b} ${y}. Write the ratio ${x} : ${y} in simplest form.`, [{ label: x, ans: a }, { label: y, ans: b }], `${k * a} : ${k * b}. Divide both by ${k}: ${ratio(a, b)}.`);
    } },
    c: { t: 'part to whole', g: R => {
      const [x, y] = R.pick(PAIRS), [a, b] = coprime(R, 1, 7), k = R.int(2, 5), kind = R.int(0, 2);
      if (kind === 0) return num(`The ratio of ${x} to ${y} is ${ratio(a, b)}. What fraction of the whole group are ${x}?`, frac(a, a + b), `For every ${a} ${x} there are ${b} ${y}: ${a} out of every ${a + b}. So ${fh(a, a + b)}, not ${fh(a, b)}.`);
      if (kind === 1) return num(`There are ${k * a} ${x} and ${k * b} ${y}. What fraction of the group are ${y}?`, frac(b, a + b), `${k * b} out of ${k * (a + b)} = ${F(b, a + b)}.`);
      return num(`There are ${k * a} ${x} and ${k * b} ${y}. Write the ratio ${x} : whole group in simplest form.`, [{ label: x, ans: a }, { label: 'whole', ans: a + b }], `The whole group is ${k * (a + b)}. ${k * a} : ${k * (a + b)} = ${ratio(a, a + b)}.`);
    } },
    d: { t: 'three ways to write it', g: R => {
      const [a, b] = coprime(R, 1, 9), [x, y] = R.pick(PAIRS);
      if (R.bool()) return choice(R, `Which is NOT a way to write the ratio ${a} to ${b}?`, ratio(b, a), [ratio(a, b), fh(a, b), `${a} to ${b}`], `${a} to ${b} can be written ${ratio(a, b)} or ${fh(a, b)}. ${ratio(b, a)} is the other order.`);
      return choice(R, `${x} : ${y} = ${ratio(a, b)}. What does this mean?`, `For every ${a} ${x} there ${b === 1 ? 'is' : 'are'} ${b} ${y}.`,
        [`For every ${b} ${x} there ${a === 1 ? 'is' : 'are'} ${a} ${y}.`, `${a} out of every ${b} are ${x}.`, `There are exactly ${a} ${x}.`], `The first number goes with the first thing named: ${a} ${x} for every ${b} ${y}.`);
    } },
  } });

  /* ================= III.2.02 Equivalent ratios ================= */
  E3.skill({ id: 'III.2.02', name: 'Equivalent ratios', steps: {
    a: { t: 'multiply both parts', g: R => {
      const [a, b] = coprime(R, 1, 9), k = R.int(2, 9);
      if (R.bool(0.35)) return choice(R, `Which ratio is equivalent to ${ratio(a, b)}?`, ratio(k * a, k * b), [ratio(a + k, b + k), ratio(k * a, b), ratio(k * b, k * a)], `Multiply both parts by ${k}: ${ratio(k * a, k * b)}. Adding ${k} to both changes the ratio.`);
      if (R.bool()) return num(`${ratio(a, b)} = ? : ${k * b}`, k * a, `${b} × ${k} = ${k * b}, so multiply ${a} by ${k} too: ${k * a}.`);
      return num(`${ratio(a, b)} = ${k * a} : ?`, k * b, `${a} × ${k} = ${k * a}, so multiply ${b} by ${k} too: ${k * b}.`);
    } },
    b: { t: 'in tables', g: R => {
      const [a, b] = coprime(R, 1, 8), [x, y] = R.pick(PAIRS), mult = R.pick([[1, 2, 3, 4], [1, 2, 4, 5], [1, 3, 5, 6], [2, 4, 6, 10]]), i = R.int(1, 3);
      const top = mult.map(k => k * a), bot = mult.map(k => k * b); const ask = bot[i]; bot[i] = '?';
      return num(`The table shows equivalent ratios. What number goes in the <b>?</b>`, ask, `Each column is ${mult[0] === 1 ? `${ratio(a, b)}` : `${ratio(a, b)} scaled`}. ${top[i]} = ${mult[i]} × ${a}, so ${mult[i]} × ${b} = ${ask}.`, { visual: V2.table([x, y], [top, bot]) });
    } },
    c: { t: 'tape diagrams', g: R => {
      const [x, y] = R.pick(PAIRS), [a, b] = coprime(R, 1, 6), k = R.int(2, 9), kind = R.int(0, 1);
      if (kind === 0) return num(`${x} : ${y} = ${ratio(a, b)}. There are ${k * a} ${x}. How many ${y} are there?`, k * b, `${a > 1 ? `${a} boxes = ${k * a}, so ` : ''}1 box = ${k}. ${y}: ${b} × ${k} = ${k * b}.`, { visual: V2.tape([{ label: x, n: a, total: String(k * a) }, { label: y, n: b, total: '?' }]) });
      return num(`${x} : ${y} = ${ratio(a, b)}. There are ${k * (a + b)} in all. How many ${x} are there?`, k * a, `${a + b} boxes = ${k * (a + b)}, so 1 box = ${k}. ${x}: ${a} × ${k} = ${k * a}.`, { visual: V2.tape([{ label: x, n: a, total: '?' }, { label: y, n: b }], { whole: `${k * (a + b)} in all` }) });
    } },
    d: { t: 'double number lines', g: (R, O) => {
      const [a, b] = coprime(R, 1, 9), mult = R.pick([[0, 1, 2, 3, 4], [0, 1, 2, 3, 4, 5], [0, 2, 4, 6, 8], [0, 1, 3, 4, 6]]), i = R.int(2, mult.length - 1);
      const [tl, bl] = R.pick([['cups', 'eggs'], ['hours', imp(O) ? 'miles' : 'km'], ['cans', cur(O)], ['boxes', 'pens'], ['days', 'pages']]);
      const top = mult.map(k => k * a), bot = mult.map(k => k * b), row = R.bool(0.7) ? 'bot' : 'top';
      const ans = row === 'bot' ? bot[i] : top[i];
      return num(`The double number line shows ${tl} and ${bl} in the same ratio. What number goes in the <b>?</b>`, ans, `${a} ${tl} go with ${b} ${bl}. ${row === 'bot' ? `${top[i]} ${tl} is ${mult[i]} × ${a}, so ${mult[i]} × ${b} = ${ans}` : `${bot[i]} ${bl} is ${mult[i]} × ${b}, so ${mult[i]} × ${a} = ${ans}`}.`, { visual: V2.dnl({ label: tl, vals: top }, { label: bl, vals: bot }, { ask: { row, i } }) });
    } },
  } });

  /* ================= III.2.03 Ratio tables ================= */
  E3.skill({ id: 'III.2.03', name: 'Ratio tables', steps: {
    a: { t: 'complete one', g: (R, O) => {
      const [a, b] = coprime(R, 2, 9), cols = R.shuffle([1, 2, 3, 4, 5, 6, 10]).slice(0, 4).sort((p, q) => p - q), i = R.int(1, 3);
      const [x, y] = R.pick([['packs', 'stickers'], ['tickets', cur(O)], ['bags', 'apples'], ['cups of flour', 'eggs']]);
      const top = cols.map(k => k * a), bot = cols.map(k => k * b), ans = bot[i]; bot[i] = '?';
      return num(`Complete the ratio table. What goes in the <b>?</b>`, ans, `${top[i]} ÷ ${a} = ${cols[i]}, so ${cols[i]} × ${b} = ${ans}.`, { visual: V2.table([x, y], [top, bot], { hw: 118 }) });
    } },
    b: { t: 'find missing values', g: R => {
      const [a, b] = coprime(R, 2, 9), cols = R.shuffle([1, 2, 3, 4, 5, 6, 8, 10]).slice(0, 4).sort((p, q) => p - q);
      const [x, y] = R.pick(PAIRS), top = cols.map(k => k * a), bot = cols.map(k => k * b);
      const [i, j] = R.distinct(1, 3, 2).sort(), A = bot[i], B = top[j]; bot[i] = 'A'; top[j] = 'B';
      return num(`Find the missing values A and B.`, [{ label: 'A', ans: A }, { label: 'B', ans: B }], `Every column is ${ratio(a, b)} times a number. A = ${cols[i]} × ${b} = ${A}; B = ${cols[j]} × ${a} = ${B}.`, { visual: V2.table([x, y], [top, bot], { hw: 110 }) });
    } },
    c: { t: 'scale up and down', g: R => {
      let a, b; do { a = R.pick([2, 3, 4, 5, 6, 8]); b = R.int(3, 20); } while (!ok3(b / a) || gcd(a, b) === a);
      const g = R.int(2, 3), x2 = R.int(3, 12); const [tl, bl] = R.pick([['cups of flour', 'cups of milk'], ['meters of wire', 'grams'], ['hours', 'pages'], ['tins', 'kg of paint']]);
      return num(`${g * a} ${tl} go with ${g * b} ${bl}. Scale down to 1, then up. Find A and B.`, [{ label: 'A', ans: b / a }, { label: 'B', ans: b / a * x2 }], `Divide by ${g * a}: 1 goes with ${fmt(b / a)}. Then × ${x2}: ${fmt(b / a * x2)}.`, { visual: V2.table([tl, bl], [[g * a, 1, x2], [g * b, 'A', 'B']], { hw: 120, cw: 64 }) });
    } },
    d: { t: 'compare ratios', g: R => {
      const [a, b] = coprime(R, 1, 6), same = R.bool(), k = R.int(1, 3), cols = [1, 2, 3];
      const A = [cols.map(c => c * a), cols.map(c => c * b)], B = same ? [cols.map(c => c * (k + 1) * a), cols.map(c => c * (k + 1) * b)] : [cols.map(c => c * a + k * c ? c * a + k : 0), cols.map(c => c * b + k)];
      const vis = V.stack([{ caption: 'Table A', svg: V2.table(['x', 'y'], A, { hw: 50 }) }, { caption: 'Table B', svg: V2.table(['x', 'y'], B, { hw: 50 }) }], { gap: 8 });
      return choiceFixed(`Do tables A and B show the same ratio?`, ['Yes', 'No'], same ? 0 : 1, same ? `B's first column is ${ratio(B[0][0], B[1][0])} = ${ratio(a, b)}, just like A.` : `A is ${ratio(a, b)}, but B's first column is ${ratio(B[0][0], B[1][0])}: it adds ${k} instead of multiplying.`, { visual: vis });
    } },
  } });

  /* ================= III.2.04 Unit rates ================= */
  E3.skill({ id: 'III.2.04', name: 'Unit rates', steps: {
    a: { t: 'per one', g: R => {
      const T = R.pick([['pencils', 'packs', 'pencils per pack'], ['words', 'minutes', 'words per minute'], ['laps', 'hours', 'laps per hour'], ['pages', 'days', 'pages per day'], ['seeds', 'rows', 'seeds per row']]);
      if (R.bool(0.2)) T.splice(0, 3, 'liters', 'minutes', 'liters per minute');   // a measure, so a half is fine
      const half = T[0] === 'laps' || T[0] === 'liters', n = R.int(2, 9), r = R.pick([R.int(3, 25), R.int(3, 25), R.int(5, 40) + 0.5].map(v => Number.isInteger(v) || (half && n % 2 === 0) ? v : Math.floor(v)));
      return num(`${fmt(r * n)} ${T[0]} in ${n} ${T[1]}. How many ${T[2]}?`, r, `Divide: ${fmt(r * n)} ÷ ${n} = ${fmt(r)} ${T[2]}.`);
    } },
    b: { t: 'unit price', g: (R, O) => {
      const n = R.int(2, 12), u = O.coins === 'THB' ? R.int(4, 120) * 25 : R.int(5, 99) * 5;   // hundredths of a dollar / baht
      const item = R.pick(['apples', 'pens', 'notebooks', 'bottles of water', 'rolls']);
      return num(`${n} ${item} cost ${money(u * n / 100, O)}. What is the price of 1, in ${cur(O)}?`, u / 100, `Divide the price by the number: ${money(u * n / 100, O)} ÷ ${n} = ${money(u / 100, O)} each.`);
    } },
    c: { t: 'speed', g: (R, O) => {
      const D = DIST(O), t = R.pick([2, 3, 4, 5, 1.5, 2.5]); let r; do { r = R.int(8, 45) * 2; } while (!Number.isInteger(r * t));
      if (R.bool(0.25)) { const s = R.int(2, 9), sec = R.pick([10, 20, 30, 60]); return num(`A runner covers ${s * sec} m in ${sec} seconds. What is her speed in meters per second?`, s, `${s * sec} ÷ ${sec} = ${s} m per second.`); }
      return num(`A car goes ${fmt(r * t)} ${D.w} in ${fmt(t)} hours. What is its speed in ${D.sp}?`, r, `Speed = distance ÷ time = ${fmt(r * t)} ÷ ${fmt(t)} = ${r} ${D.sp}.`);
    } },
    d: { t: 'compare deals', g: (R, O) => {
      let nA, nB, uA, uB; const s = O.coins === 'THB' ? 25 : 5;
      do { [nA, nB] = R.distinct(2, 12, 2); uA = R.int(4, 60) * s; uB = R.int(4, 60) * s; } while (uA === uB || Math.abs(uA - uB) > 0.25 * Math.max(uA, uB));
      const item = R.pick(['yogurts', 'batteries', 'pens', 'cans of juice']), best = uA < uB ? 0 : 1;
      return choiceFixed(`Pack A: ${nA} ${item} for ${money(uA * nA / 100, O)}. Pack B: ${nB} ${item} for ${money(uB * nB / 100, O)}. Which is cheaper per item?`, ['Pack A', 'Pack B'], best,
        `A: ${money(uA * nA / 100, O)} ÷ ${nA} = ${money(uA / 100, O)} each. B: ${money(uB * nB / 100, O)} ÷ ${nB} = ${money(uB / 100, O)} each. Compare per item, not the totals.`);
    } },
  } });

  /* ================= III.2.05 Rates with fractions ================= */
  const FA = [[1, 2], [1, 3], [1, 4], [2, 3], [3, 4], [1, 5], [2, 5], [3, 5], [1, 6], [5, 6], [3, 8]];
  const TIMES = [[1, 2], [1, 3], [1, 4], [1, 6], [2, 3], [3, 4]];
  const divF = (p, q) => red(p[0] * q[1], p[1] * q[0]);
  E3.skill({ id: 'III.2.05', name: 'Rates with fractions', steps: {
    a: { t: '1/2 mile per 1/4 hour', g: (R, O) => {
      const D = DIST(O); let d, t; do { d = R.pick(FA); t = R.pick(TIMES); } while (d[0] * t[1] === t[0] * d[1]);
      const r = divF(d, t), wrong = red(d[0] * t[0], d[1] * t[1]);
      const p = `Someone walks ${fh(d[0], d[1])} ${D.one} in ${fh(t[0], t[1])} hour. How many ${D.w} per hour is that?`;
      const ex = `Divide distance by time: ${fh(d[0], d[1])} ÷ ${fh(t[0], t[1])} = ${fh(d[0], d[1])} × ${fh(t[1], t[0])} = ${F(r[0], r[1])} ${D.w} per hour.`;
      if (R.bool(0.35)) return choice(R, p, F(r[0], r[1]), [F(wrong[0], wrong[1]), F(r[1], r[0])], ex + ' Multiplying would give far too little.');
      return num(p, frac(r[0], r[1]), ex);
    } },
    b: { t: 'fractions of fractions', g: R => {
      let a, p; do { a = R.pick(FA); p = R.pick(TIMES); } while (a[0] * p[1] === p[0] * a[1]);
      const r = divF(a, p);
      if (R.bool()) return num(`${fh(a[0], a[1])} cup of sugar makes ${fh(p[0], p[1])} of a batch. How many cups make a whole batch?`, frac(r[0], r[1]), `Cups per batch = ${fh(a[0], a[1])} ÷ ${fh(p[0], p[1])} = ${fh(a[0], a[1])} × ${fh(p[1], p[0])} = ${F(r[0], r[1])}.`);
      return num(`A painter covers ${fh(a[0], a[1])} of a wall in ${fh(p[0], p[1])} hour. How many walls per hour is that?`, frac(r[0], r[1]), `Walls per hour = ${fh(a[0], a[1])} ÷ ${fh(p[0], p[1])} = ${fh(a[0], a[1])} × ${fh(p[1], p[0])} = ${F(r[0], r[1])}.`);
    } },
    c: { t: 'in context', g: (R, O) => {
      let a, t; do { a = R.pick(FA); t = R.pick(TIMES); } while (a[0] * t[1] === t[0] * a[1]);
      const u = imp(O) ? 'ft' : 'm', r = divF(a, t), inv = divF(t, a), kind = R.int(0, 2);
      if (kind === 0) return num(`A snail crawls ${fh(a[0], a[1])} ${u} in ${fh(t[0], t[1])} minute. How far does it crawl in 1 minute (in ${u})?`, frac(r[0], r[1]), `${fh(a[0], a[1])} ÷ ${fh(t[0], t[1])} = ${F(r[0], r[1])} ${u} per minute.`);
      if (kind === 1) return num(`A snail crawls ${fh(a[0], a[1])} ${u} in ${fh(t[0], t[1])} minute. How many minutes does it take to crawl 1 ${u}?`, frac(inv[0], inv[1]), `Minutes per ${u} = ${fh(t[0], t[1])} ÷ ${fh(a[0], a[1])} = ${F(inv[0], inv[1])}.`);
      const L = imp(O) ? 'gallon' : 'liter';
      return num(`A tap fills ${fh(a[0], a[1])} ${L} in ${fh(t[0], t[1])} minute. How many ${L}s per minute is that?`, frac(r[0], r[1]), `${fh(a[0], a[1])} ÷ ${fh(t[0], t[1])} = ${F(r[0], r[1])} ${L}s per minute.`);
    } },
    d: { t: 'compare', g: (R, O) => {
      const D = DIST(O); let A, B, rA, rB;
      do { A = [R.pick(FA), R.pick(TIMES)]; B = [R.pick(FA), R.pick(TIMES)]; rA = divF(...A); rB = divF(...B); } while (rA[0] * rB[1] === rB[0] * rA[1] || A[0][0] * A[1][1] === A[1][0] * A[0][1]);
      const faster = rA[0] / rA[1] > rB[0] / rB[1] ? 0 : 1;
      return choiceFixed(`Ana walks ${fh(A[0][0], A[0][1])} ${D.one} in ${fh(A[1][0], A[1][1])} hour. Ben walks ${fh(B[0][0], B[0][1])} ${D.one} in ${fh(B[1][0], B[1][1])} hour. Who is faster?`, ['Ana', 'Ben'], faster,
        `Ana: ${F(rA[0], rA[1])} ${D.sp}. Ben: ${F(rB[0], rB[1])} ${D.sp}. ${faster ? 'Ben' : 'Ana'} covers more per hour.`);
    } },
  } });

  /* ---------- helpers for III.2.06 onward ---------- */
  const LET = ['A', 'B', 'C', 'D'];
  const findv = (gen, okf) => { for (let i = 0; i < 400; i++) { const v = gen(); if (okf(v)) return v; } throw new Error('find failed'); };
  const uniqPts = P => new Set(P.map(p => p.join(','))).size === P.length;
  // k = n/d as text (whole, decimal or stacked fraction)
  const KT = (n, d) => { [n, d] = red(n, d); return d === 1 ? fmt(n) : ok3(n / d) ? fmt(n / d) : fh(n, d); };
  const YKX = `${m('y')} = ${m('k')}${m('x')}`, DRT = `${m('d')} = ${m('r')}${m('t')}`;
  const KS = [[2, 1], [3, 1], [4, 1], [5, 1], [3, 2], [5, 2], [1, 2], [1, 4], [3, 4], [2, 3], [4, 3], [6, 1]];

  /* ================= III.2.06 Ratios on a graph ================= */
  E3.skill({ id: 'III.2.06', name: 'Ratios on a graph', steps: {
    a: { t: 'plot the pairs', g: R => {
      const [a, b] = coprime(R, 1, 4), far = P => P.every((p, i) => P.every((q, j) => i >= j || Math.hypot(p[0] - q[0], p[1] - q[1]) >= 2));
      if (R.bool()) {   // one point in the ratio, three that are not
        const pts = findv(() => { const k = R.int(2, 3), j = R.int(1, 6); return [[k * a, k * b, 1], [k * b, k * a, 0], [a + j, b + j, 0], R.pick([[k * a, k * b + R.pick([-2, 2, 3]), 0], [k * a + R.pick([-2, 2, 3]), k * b, 0]])]; }, P => P.every(p => p[0] >= 1 && p[1] >= 1 && p[0] <= 12 && p[1] <= 12) && far(P) && P[3][0] * b !== P[3][1] * a);
        const S = R.shuffle(pts), k = pts[0][0] / a;
        return choiceFixed(`Which point shows a pair ${m('x : y')} in the ratio ${ratio(a, b)}?`, LET, S.findIndex(p => p[2]),
          `(${k * a}, ${k * b}) is ${k} × ${a} and ${k} × ${b}. (${k * b}, ${k * a}) has the order swapped.`, { visual: V2.graph({ xmax: 12, ymax: 12, points: S.map((p, i) => [p[0], p[1], LET[i]]) }) });
      }
      const pts = findv(() => { const j = R.int(1, 6); return R.shuffle([[a, b, 0], [2 * a, 2 * b, 0], [3 * a, 3 * b, 0], [4 * a, 4 * b, 0]].filter(p => p[0] <= 12 && p[1] <= 12)).slice(0, 3).concat([[a + j, b + j, 1]]); }, P => far(P) && P[3][0] <= 12 && P[3][1] <= 12);
      const odd = pts[3], j = odd[0] - a;
      const S = R.shuffle(pts), good = S.filter(p => !p[2]).map(p => `(${p[0]}, ${p[1]})`).join(', ');
      return choiceFixed(`Three points show pairs in the ratio ${ratio(a, b)}. Which point does NOT?`, LET, S.findIndex(p => p[2]),
        `${good} are all ${a} and ${b} times the same number. (${odd[0]}, ${odd[1]}) adds ${j} to both instead.`, { visual: V2.graph({ xmax: 12, ymax: 12, points: S.map((p, i) => [p[0], p[1], LET[i]]) }) });
    } },
    b: { t: 'a line through the origin', g: R => {
      const [a, b] = coprime(R, 1, 5), c = R.int(2, 4), L = R.shuffle([{ k: b / a, c: 0, ok: 1 }, { k: b / a, c }, { k: a / b, c: 0, swap: 1 }]);
      const lines = L.map((l, i) => ({ k: l.k, c: l.c, label: LET[i], color: [C.blue, C.red, C.teal][i] }));
      const sw = LET[L.findIndex(l => l.swap)], sh = LET[L.findIndex(l => l.c)];
      return choiceFixed(`Which line shows all the pairs ${m('x : y')} in the ratio ${ratio(a, b)}?`, LET.slice(0, 3), L.findIndex(l => l.ok),
        `It must pass through (0, 0) and (${a}, ${b}). Line ${sh} misses the origin; line ${sw} goes through (${b}, ${a}), the other order.`, { visual: V2.graph({ xmax: 10, ymax: 10, lines }) });
    } },
    c: { t: 'read values', g: R => {
      const [a, b] = coprime(R, 1, 6), t = Math.floor(12 / Math.max(a, b)), j = R.int(2, Math.max(2, t)), ly = R.bool(0.6);
      const vis = V2.graph({ xmax: 12, ymax: 12, lines: [{ k: b / a }], points: [[a, b, 'P']] });
      if (ly) return num(`The line shows pairs in one ratio. It passes through P. What is ${m('y')} when ${m('x')} = ${j * a}?`, j * b, `P is (${a}, ${b}), so ${m('x : y')} = ${ratio(a, b)}. ${j * a} = ${j} × ${a}, so ${m('y')} = ${j} × ${b} = ${j * b}.`, { visual: vis });
      return num(`The line shows pairs in one ratio. It passes through P. What is ${m('x')} when ${m('y')} = ${j * b}?`, j * a, `P is (${a}, ${b}), so ${m('x : y')} = ${ratio(a, b)}. ${j * b} = ${j} × ${b}, so ${m('x')} = ${j} × ${a} = ${j * a}.`, { visual: vis });
    } },
    d: { t: 'compare two ratios', g: (R, O) => {
      const D = DIST(O), [k1, k2] = R.sample([1, 1.5, 2, 2.5, 3, 4, 5], 2), ymax = 8 * Math.max(k1, k2);
      const vis = V2.graph({ xmax: 8, ymax, xstep: 1, ystep: 4, xlab: 'hours', ylab: D.w, lines: [{ k: k1, label: 'A', color: C.blue }, { k: k2, label: 'B', color: C.red }] });
      if (R.bool(0.6)) return choiceFixed(`The graph shows two walkers, A and B. Who walks faster?`, ['A', 'B'], k1 > k2 ? 0 : 1,
        `After 2 hours A has gone ${fmt(2 * k1)} ${D.w} and B ${fmt(2 * k2)} ${D.w}. The steeper line means more ${D.w} per hour.`, { visual: vis });
      return num(`The graph shows two walkers, A and B. How many more ${D.w} per hour does the faster one walk?`, Math.abs(k1 - k2), `Read at 2 hours: A ${fmt(2 * k1)}, B ${fmt(2 * k2)}. Per hour: ${fmt(k1)} and ${fmt(k2)}, a difference of ${fmt(Math.abs(k1 - k2))} ${D.w}.`, { visual: vis });
    } },
  } });

  /* ================= III.2.07 Proportions ================= */
  E3.skill({ id: 'III.2.07', name: 'Proportions', steps: {
    a: { t: 'equal ratios', g: R => {
      const [a, b] = findv(() => coprime(R, 1, 9), ([a, b]) => b > 1), k = R.int(2, 6), kind = R.int(0, 2);
      if (kind === 0) return choice(R, `Which ratio forms a proportion with ${fh(a, b)}?`, fh(k * a, k * b), [fh(a + k, b + k), fh(k * b, k * a), fh(k * a, k * b + 1)], `${fh(a, b)} = ${fh(k * a, k * b)}: both parts are multiplied by ${k}. Adding ${k} to both does not keep the ratio.`);
      const yes = kind === 1, [c, d] = yes ? [k * a, k * b] : R.pick([[a + k, b + k], [k * a, k * b + R.pick([-1, 1])]]).map(v => v);
      return choiceFixed(`Is ${fh(a, b)} = ${fh(c, d)} a true proportion?`, ['Yes', 'No'], yes ? 0 : 1,
        yes ? `${a} × ${k} = ${c} and ${b} × ${k} = ${d}: both parts scale by ${k}.` : `Cross products: ${a} × ${d} = ${a * d}, ${b} × ${c} = ${b * c}. They differ, so the ratios are not equal.`);
    } },
    b: { t: 'solve by scaling', g: R => {
      const [a, b] = findv(() => coprime(R, 1, 9), ([a, b]) => a > 1 && b > 1), k = R.int(2, 9), kind = R.int(0, 3);
      if (kind === 0) return num(`Solve ${fh(a, b)} = ${fh(m('x'), k * b)}.`, [{ label: 'x =', ans: k * a }], `${b} × ${k} = ${k * b}, so ${m('x')} = ${a} × ${k} = ${k * a}.`);
      if (kind === 1) return num(`Solve ${fh(a, b)} = ${fh(k * a, m('x'))}.`, [{ label: 'x =', ans: k * b }], `${a} × ${k} = ${k * a}, so ${m('x')} = ${b} × ${k} = ${k * b}.`);
      if (kind === 2) return num(`Solve ${fh(k * a, k * b)} = ${fh(m('x'), b)}.`, [{ label: 'x =', ans: a }], `${k * b} ÷ ${k} = ${b}, so ${m('x')} = ${k * a} ÷ ${k} = ${a}.`);
      return num(`Solve ${fh(m('x'), k * a)} = ${fh(b, a)}.`, [{ label: 'x =', ans: k * b }], `${a} × ${k} = ${k * a}, so ${m('x')} = ${b} × ${k} = ${k * b}.`);
    } },
    c: { t: 'cross products', g: R => {
      const [a, b, d] = findv(() => [R.int(1, 9), R.int(3, 12), R.int(4, 30)], ([a, b, d]) => gcd(a, b) === 1 && a !== b && d !== b && d % b !== 0 && b % d !== 0 && Number.isInteger(a * d / b * 4) && (a * d) % b !== 0);
      const x = a * d / b;
      if (R.bool()) return num(`Solve ${fh(a, b)} = ${fh(m('x'), d)}.`, [{ label: 'x =', ans: x }], `Cross multiply: ${b}${m('x')} = ${a} × ${d} = ${a * d}. So ${m('x')} = ${a * d} ÷ ${b} = ${fmt(x)}.`);
      // unknown in a denominator: a/b = d/x → x = b·d/a
      const [p, q, r] = findv(() => [R.int(2, 9), R.int(1, 12), R.int(3, 30)], ([p, q, r]) => gcd(p, q) === 1 && p !== q && Number.isInteger(q * r / p * 4) && (q * r) % p !== 0 && r % p !== 0);
      return num(`Solve ${fh(p, q)} = ${fh(r, m('x'))}.`, [{ label: 'x =', ans: q * r / p }], `Cross multiply: ${p}${m('x')} = ${q} × ${r} = ${q * r}. So ${m('x')} = ${q * r} ÷ ${p} = ${fmt(q * r / p)}.`);
    } },
    d: { t: 'word problems', g: (R, O) => {
      const T = R.pick([['cups of flour', 'cookies', 1], ['liters of paint', 'square meters of wall', 0], ['scoops of powder', 'cups of water', 0], ['kg of rice', 'people', 1], ['meters of fabric', 'cushions', 1]]);
      const [q1, p1] = findv(() => [R.int(2, 8), R.int(2, 12) * R.pick([2, 3, 5])], ([q1, p1]) => p1 % q1 !== 0 && q1 !== p1), kind = R.int(0, 2), X = m('x');
      if (kind === 0) {
        return choice(R, `${q1} ${T[0]} go with ${p1} ${T[1]}. Which proportion finds ${X}, the ${T[0]} for ${2 * p1 + q1} ${T[1]}?`, `${fh(q1, p1)} = ${fh(X, 2 * p1 + q1)}`, [`${fh(q1, p1)} = ${fh(2 * p1 + q1, X)}`, `${fh(q1, 2 * p1 + q1)} = ${fh(X, p1)}`, `${fh(p1, q1)} = ${fh(X, 2 * p1 + q1)}`],
          `Keep matching things in matching places: ${T[0]} on top, ${T[1]} below, on both sides.`);
      }
      if (kind === 1) { const q2 = findv(() => R.int(3, 30), q2 => q2 !== q1 && (q2 % q1 !== 0 || gcd(p1, q1) === 1) && ok3(p1 * q2 / q1) && (!T[2] || (p1 * q2) % q1 === 0)), ans = p1 * q2 / q1;
        return num(`${q1} ${T[0]} go with ${p1} ${T[1]}. How many ${T[1]} go with ${q2} ${T[0]}?`, ans, `${fh(q1, p1)} = ${fh(q2, X)}, so ${X} = ${p1} × ${q2} ÷ ${q1} = ${fmt(ans)}.`); }
      const cand = Array.from({ length: 3 * p1 }, (_, i) => i + 2).filter(v => v !== p1 && ok3(q1 * v / p1)), strict = cand.filter(v => v % p1 !== 0), p2 = R.pick(strict.length ? strict : cand), ans = q1 * p2 / p1;
      return num(`${q1} ${T[0]} go with ${p1} ${T[1]}. How many ${T[0]} go with ${p2} ${T[1]}?`, ans, `${fh(q1, p1)} = ${fh(X, p2)}, so ${X} = ${q1} × ${p2} ÷ ${p1} = ${fmt(ans)}.`);
    } },
  } });

  /* ================= III.2.08 Proportional relationships ================= */
  E3.skill({ id: 'III.2.08', name: 'Proportional relationships', steps: {
    a: { t: 'test with a table', g: R => {
      const [kn, kd] = R.pick(KS), xs = R.sample([1, 2, 3, 4, 5, 6, 8, 10], 4).sort((p, q) => p - q).map(x => x * kd), yes = R.bool(), c = R.int(1, 5) * (R.bool() ? 1 : -1);
      const ys = xs.map(x => x * kn / kd + (yes ? 0 : c));
      if (ys.some(y => y <= 0)) return E3.byId['III.2.08'].steps.a.g(R);
      const r = xs.map((x, i) => KT(ys[i] * kd, x * kd));
      return choiceFixed(`Is ${m('y')} proportional to ${m('x')}?`, ['Yes', 'No'], yes ? 0 : 1,
        yes ? `${m('y')} ÷ ${m('x')} = ${r[0]} in every column, so yes: ${m('y')} = ${KT(kn, kd)}${m('x')}.` : `${m('y')} ÷ ${m('x')} is ${r.slice(0, 2).join(', then ')}. It is not the same every time, so no.`,
        { visual: V2.table(['x', 'y'], [xs, ys], { hw: 50 }) });
    } },
    b: { t: 'with a graph', g: R => {
      const k = R.pick([0.5, 1, 1.5, 2, 3]), kind = R.int(0, 3), c = R.int(1, 3);
      if (kind === 0) return choiceFixed(`Is ${m('y')} proportional to ${m('x')}?`, ['Yes', 'No'], 0, `The graph is a straight line through (0, 0), so ${m('y')} = ${fmt(k)}${m('x')}.`, { visual: V2.graph({ xmax: 10, ymax: 10, lines: [{ k }] }) });
      if (kind === 1) return choiceFixed(`Is ${m('y')} proportional to ${m('x')}?`, ['Yes', 'No'], 1, `It is a straight line, but it starts at (0, ${c}), not (0, 0). A proportional graph must pass through the origin.`, { visual: V2.graph({ xmax: 10, ymax: 10, lines: [{ k: Math.min(k, 1), c }] }) });
      const xs = [1, 2, 3, 4, 5, 6].filter(x => x * k <= 10 && Number.isInteger(x * k));
      if (kind === 2) return choiceFixed(`The points show pairs (${m('x')}, ${m('y')}). Is ${m('y')} proportional to ${m('x')}?`, ['Yes', 'No'], 0, `The points lie on a straight line that would pass through (0, 0): ${m('y')} ÷ ${m('x')} = ${fmt(k)} every time.`, { visual: V2.graph({ xmax: 10, ymax: 10, dots: xs.map(x => [x, x * k]) }) });
      const pts = [[1, 1], [2, 4], [3, 9]].concat(R.bool() ? [] : [[0, 0]]);
      return choiceFixed(`The points show pairs (${m('x')}, ${m('y')}). Is ${m('y')} proportional to ${m('x')}?`, ['Yes', 'No'], 1, `${m('y')} ÷ ${m('x')} is 1, then 2, then 3. The points curve upward, not along one straight line.`, { visual: V2.graph({ xmax: 10, ymax: 10, dots: pts }) });
    } },
    c: { t: 'with an equation', g: R => {
      const k = R.int(2, 9), c = findv(() => R.int(1, 9), c => c !== k);
      if (R.bool(0.65)) return choice(R, `Which equation shows ${m('y')} proportional to ${m('x')}?`, m(`y = ${k}x`), [m(`y = ${k}x + ${c}`), m(`y = x + ${k}`), m(`y = ${k * 5} - x`)], `A proportional relationship has the form ${YKX}: no number added or subtracted. ${m(`y = ${k}x + ${c}`)} misses the origin.`);
      const eq = R.pick([[`y = ${k}x`, 1, 0], [`y = x/${k}`, 1, 0], [`y = ${k}x + ${c}`, 0, c], [`y = ${k}x - ${c}`, 0, -c], [`y = x + ${k}`, 0, k]]);
      return choiceFixed(`Is ${m(eq[0])} a proportional relationship?`, ['Yes', 'No'], eq[1] ? 0 : 1, eq[1] ? `It has the form ${YKX}${eq[0].includes('/') ? ` with ${m('k')} = ${fh(1, k)}` : ''}; when ${m('x')} = 0, ${m('y')} = 0.` : `When ${m('x')} = 0, ${m('y')} = ${fmt(eq[2])}, not 0. The line misses (0, 0), so no.`);
    } },
    d: { t: 'non-examples', g: (R, O) => {
      const P = [`The cost of apples at ${money(O.coins === 'THB' ? 40 : 2, O)} per kg`, 'A number of cars and their wheels (4 each)', `Distance walked at a steady ${DIST(O).w === 'miles' ? '3 mph' : '5 km/h'}`, 'The perimeter of a square and its side', 'Grams of sugar in some identical cans', 'A time in minutes and the same time in seconds'];
      const N2 = ['A taxi fare: a fixed fee plus a price per km', 'A gym: a joining fee plus a monthly charge', 'A candle burning down: its height and the time', 'A person\'s age and height', 'Temperature in °F and in °C', 'A phone plan: a monthly fee plus a price per call'];
      const odd = R.pick(N2), props = R.sample(P, 3);
      if (R.bool(0.3)) { const [kn, kd] = R.pick(KS.filter(k => k[1] === 1)), c = R.int(1, 4), xs = [1, 2, 3, 4];
        const good = [xs.map(x => [x, kn * x]), xs.map(x => [x, (kn + 1) * x]), xs.map(x => [x, kn * x + c])], ord = R.shuffle([0, 1, 2]);
        const vis = V.side(ord.map((g, i) => ({ caption: 'Table ' + LET[i], svg: V2.table(['x', 'y'], [good[g].map(p => p[0]), good[g].map(p => p[1])], { hw: 32, cw: 34 }) })), { gap: 14 });
        return choiceFixed(`Which table is NOT proportional?`, LET.slice(0, 3), ord.indexOf(2), `In table ${LET[ord.indexOf(2)]}, ${m('y')} ÷ ${m('x')} changes: ${kn + c}, then ${fmt((2 * kn + c) / 2)}. The others keep one ${m('y')} ÷ ${m('x')}.`, { visual: vis });
      }
      return choice(R, `Which one is NOT a proportional relationship?`, odd, props, `${odd}: doubling one amount does not double the other${/fee/.test(odd) ? ', because of the fixed fee' : ''}. The others all have one fixed rate and start at 0.`);
    } },
  } });

  /* ================= III.2.09 The constant of proportionality ================= */
  E3.skill({ id: 'III.2.09', name: 'The constant of proportionality', steps: {
    a: { t: 'from a table', g: R => {
      const [kn, kd] = R.pick(KS), xs = R.sample([1, 2, 3, 4, 5, 6, 8, 10], 4).sort((p, q) => p - q).map(x => x * kd), ys = xs.map(x => x * kn / kd);
      return num(`${m('y')} is proportional to ${m('x')}: ${YKX}. What is ${m('k')}?`, frac(kn, kd), `${m('k')} = ${m('y')} ÷ ${m('x')} = ${fmt(ys[0])} ÷ ${fmt(xs[0])} = ${KT(kn, kd)}. Check another column: ${fmt(ys[1])} ÷ ${fmt(xs[1])} = ${KT(kn, kd)}.`, { visual: V2.table(['x', 'y'], [xs, ys], { hw: 50 }) });
    } },
    b: { t: 'from a graph', g: R => {
      const [kn, kd] = R.pick(KS.filter(([n, d]) => n <= 6 && d <= 4 && n / d <= 5)), t = findv(() => R.int(1, 4), t => t * kd <= 10 && t * kn <= 10), x0 = t * kd, y0 = t * kn;
      return num(`The line shows ${YKX}. What is ${m('k')}?`, frac(kn, kd), `The line passes through (${x0}, ${y0}). ${m('k')} = ${m('y')} ÷ ${m('x')} = ${y0} ÷ ${x0} = ${KT(kn, kd)}.`, { visual: V2.graph({ xmax: 10, ymax: 10, lines: [{ k: kn / kd }], dots: [[x0, y0]] }) });
    } },
    c: { t: 'y = kx', g: R => {
      const [kn, kd] = R.pick(KS), kind = R.int(0, 2);
      const x1 = kd * R.int(2, 6), y1 = x1 * kn / kd;
      if (kind === 0) { const x2 = findv(() => R.int(2, 20), v => v !== x1 && ok3(v * kn / kd)); return num(`${m('y')} is proportional to ${m('x')}. When ${m('x')} = ${x1}, ${m('y')} = ${fmt(y1)}. Find ${m('y')} when ${m('x')} = ${x2}.`, x2 * kn / kd, `${m('k')} = ${fmt(y1)} ÷ ${x1} = ${KT(kn, kd)}, so ${m('y')} = ${KT(kn, kd)} × ${x2} = ${fmt(x2 * kn / kd)}.`); }
      if (kind === 1) { const y2 = findv(() => kn * R.int(1, 12), v => v !== y1 && ok3(v * kd / kn)); return num(`${m('y')} is proportional to ${m('x')}. When ${m('x')} = ${x1}, ${m('y')} = ${fmt(y1)}. Find ${m('x')} when ${m('y')} = ${fmt(y2)}.`, y2 * kd / kn, `${m('k')} = ${KT(kn, kd)}, so ${m('x')} = ${m('y')} ÷ ${m('k')} = ${fmt(y2)} ÷ ${KT(kn, kd)} = ${fmt(y2 * kd / kn)}.`); }
      const Y = m('y'), Xx = m('x');
      return choice(R, `${Y} is proportional to ${Xx}, and ${Y} = ${fmt(y1)} when ${Xx} = ${x1}. Which equation fits?`, `${Y} = ${KT(kn, kd)}${Xx}`, [`${Y} = ${KT(kd, kn)}${Xx}`, `${Y} = ${Xx} ${y1 >= x1 ? '+' : '−'} ${fmt(Math.abs(y1 - x1))}`, `${Y} = ${fmt(y1 * x1)}${Xx}`],
        `${m('k')} = ${m('y')} ÷ ${m('x')} = ${fmt(y1)} ÷ ${x1} = ${KT(kn, kd)}. Not ${m('x')} ÷ ${m('y')}.`);
    } },
    d: { t: 'its meaning in context', g: (R, O) => {
      const T = R.pick([['kg of rice cost', 'cost', 'the cost of 1 kg', 'the kg you get for 1', 1, 'kg'], ['hours of work pay', 'pay', 'the pay for 1 hour', 'the hours worked for 1', 1, 'hours'], ['liters of fuel take a car', 'distance', `the ${DIST(O).w} for 1 liter`, 'the liters used for 1', 0, 'liters']]);
      const x = R.int(2, 6), k = findv(() => R.int(2, 15), k => k !== x && x * k !== x + k), y = x * k, unit = T[4] ? cur(O) : DIST(O).w;
      const yT = T[4] ? money(O.coins === 'THB' ? y * 10 : y, O) : `${y} ${DIST(O).w}`, kv = O.coins === 'THB' && T[4] ? k * 10 : k, yv = O.coins === 'THB' && T[4] ? y * 10 : y;
      return choice(R, `${x} ${T[0]} ${yT}. ${T[1][0].toUpperCase() + T[1].slice(1)} ${m('y')} is proportional to ${m('x')} ${T[5]}: ${YKX}. What is ${m('k')}?`,
        `${m('k')} = ${kv}: ${T[2]}`, [`${m('k')} = ${KT(x, yv)}: ${T[2]}`, `${m('k')} = ${kv}: ${T[3]} ${T[4] ? (O.coins === 'THB' ? 'baht' : 'dollar') : DIST(O).one}`, `${m('k')} = ${yv}: the total`],
        `${m('k')} = ${m('y')} ÷ ${m('x')} = ${yv} ÷ ${x} = ${kv}, which is ${T[2]}. ${m('x')} ÷ ${m('y')} would give ${T[3]} ${T[4] ? (O.coins === 'THB' ? 'baht' : 'dollar') : DIST(O).one}.`);
    } },
  } });

  /* ================= III.2.10 Scale drawings ================= */
  // two rectangles to scale: A (w1×h1) and its copy B (f·w1 × f·h1). lab: which side labels to show {aw, ah, bw, bh} (strings or false)
  V2.pair = function (w1, h1, f, lab) {
    const w2 = w1 * f, h2 = h1 * f, u = Math.min(22, 250 / (w1 + w2), 150 / Math.max(h1, h2)), top = 26, gap = 70;
    const box = (x, w, h, col, name, lw, lh) => `<rect x="${x}" y="${top}" width="${w * u}" height="${h * u}" fill="${col}33" stroke="${col}" stroke-width="2.5"/>` + V.text(x + w * u / 2, top - 12, name, { size: 15, weight: 700 })
      + (lw ? V.text(x + w * u / 2, top + h * u + 14, lw, { size: 14 }) : '') + (lh ? V.text(x + w * u + 6, top + h * u / 2, lh, { size: 14, anchor: 'start' }) : '');
    const x2 = 10 + w1 * u + gap;
    return V.svg(x2 + w2 * u + 70, top + Math.max(h1, h2) * u + 26, box(10, w1, h1, C.blue, 'A', lab.aw, lab.ah) + box(x2, w2, h2, C.teal, 'B', lab.bw, lab.bh), 'two rectangles');
  };
  const FACT = [[2, 1], [3, 1], [4, 1], [3, 2], [5, 2], [1, 2], [1, 3], [1, 4], [5, 4]];
  E3.skill({ id: 'III.2.10', name: 'Scale drawings', steps: {
    a: { t: 'the scale factor', g: (R, O) => {
      const u = imp(O) ? 'in' : 'cm', [fn, fd] = R.pick(FACT), [w1, h1] = findv(() => [fd * R.int(1, 4), fd * R.int(1, 3)], ([w, h]) => w > h && w * Math.max(1, fn / fd) <= 16), w2 = w1 * fn / fd, h2 = h1 * fn / fd;
      const vis = V2.pair(w1, h1, fn / fd, { aw: `${fmt(w1)} ${u}`, ah: `${fmt(h1)} ${u}`, bw: `${fmt(w2)} ${u}`, bh: false });
      if (R.bool(0.7)) return num(`B is a scale drawing of A. What is the scale factor from A to B?`, frac(fn, fd), `Scale factor = new length ÷ old length = ${fmt(w2)} ÷ ${fmt(w1)} = ${KT(fn, fd)}.${fn < fd ? ' Less than 1, because B is smaller.' : ''}`, { visual: vis });
      return num(`B is a scale drawing of A. How tall is B, in ${u}?`, h2, `The scale factor is ${fmt(w2)} ÷ ${fmt(w1)} = ${KT(fn, fd)}, so B's height is ${fmt(h1)} × ${KT(fn, fd)} = ${fmt(h2)} ${u}.`, { visual: vis });
    } },
    b: { t: 'find real lengths', g: (R, O) => {
      const kind = R.int(0, 2);
      if (kind === 2) { const n = R.pick([50, 100, 200, 250, 500]), l = R.int(2, 16) / 2, real = l * n / 100;
        return num(`A plan has scale 1 : ${n}. A wall is ${fmt(l)} cm on the plan. How long is the real wall, in meters?`, real, `Real = ${fmt(l)} × ${n} = ${fmt(l * n)} cm = ${fmt(real)} m.`); }
      const [su, ru] = imp(O) ? ['in', 'ft'] : ['cm', 'm'], k = R.pick([2, 3, 4, 5, 10, 20]), l = R.int(2, 16) / (R.bool() ? 2 : 1);
      if (kind === 0) return num(`On a drawing, 1 ${su} stands for ${k} ${ru}. A line is ${fmt(l)} ${su} long. How long is it in real life, in ${ru}?`, l * k, `Each ${su} is ${k} ${ru}: ${fmt(l)} × ${k} = ${fmt(l * k)} ${ru}.`);
      const L = l * k; return num(`On a drawing, 1 ${su} stands for ${k} ${ru}. A real wall is ${fmt(L)} ${ru}. How long is it on the drawing, in ${su}?`, l, `Divide by ${k}: ${fmt(L)} ÷ ${k} = ${fmt(l)} ${su}.`);
    } },
    c: { t: 'redraw at a new scale', g: (R, O) => {
      const [su, ru] = imp(O) ? ['in', 'ft'] : ['cm', 'm'], kind = R.int(0, 2);
      if (kind === 2) { const f = R.int(2, 4), A = R.int(3, 12), au = imp(O) ? 'in²' : 'cm²';
        return choice(R, `A drawing is redrawn with every length ${f} times as long. The old drawing had area ${A} ${au}. What is the new area?`, `${f * f * A} ${au}`, [`${f * A} ${au}`, `${2 * f * A} ${au}`, `${A + f} ${au}`], `Area grows by ${f} × ${f} = ${f * f}, not ${f}: ${A} × ${f * f} = ${f * f * A} ${au}.`); }
      const [k1, k2] = findv(() => R.sample([1, 2, 4, 5, 10, 20], 2), ([a, b]) => a !== b), L = findv(() => R.int(2, 12), L => ok3(L * k1 / k2) && L * k1 / k2 <= 40), n = L * k1 / k2;
      return num(`A drawing uses 1 ${su} for ${k1} ${ru}. A room is ${L} ${su} long on it. Redraw at 1 ${su} for ${k2} ${ru}. How long is the room now, in ${su}?`, n, `Real length: ${L} × ${k1} = ${L * k1} ${ru}. New drawing: ${L * k1} ÷ ${k2} = ${fmt(n)} ${su}.`);
    } },
    d: { t: 'maps', g: (R, O) => {
      if (imp(O)) { const k = R.pick([2, 4, 5, 10, 20]), l = R.int(3, 18) / R.pick([1, 2, 4]);
        if (R.bool()) return num(`On a map, 1 inch represents ${k} miles. Two towns are ${fmt(l)} in apart. What is the real distance, in miles?`, l * k, `${fmt(l)} × ${k} = ${fmt(l * k)} miles.`);
        return num(`On a map, 1 inch represents ${k} miles. Two towns are ${fmt(l * k)} miles apart. How far apart are they on the map, in inches?`, l, `${fmt(l * k)} ÷ ${k} = ${fmt(l)} inches.`); }
      const n = R.pick([10000, 20000, 25000, 50000, 100000, 200000]), l = R.int(2, 30) / 2, km = l * n / 100000;
      if (!ok3(km)) return E3.byId['III.2.10'].steps.d.g(R, O);
      if (R.bool(0.6)) return num(`A map has scale 1 : ${fmt(n)}. A path is ${fmt(l)} cm on the map. How long is the real path, in km?`, km, `${fmt(l)} × ${fmt(n)} = ${fmt(l * n)} cm. 100,000 cm = 1 km, so that is ${fmt(km)} km.`);
      return num(`A map has scale 1 : ${fmt(n)}. Two towns are ${fmt(km)} km apart. How far apart are they on the map, in cm?`, l, `${fmt(km)} km = ${fmt(km * 100000)} cm. Divide by ${fmt(n)}: ${fmt(l)} cm.`);
    } },
  } });

  /* ================= III.2.11 Unit conversion with ratios ================= */
  const UM = [['m', 'cm', 100], ['km', 'm', 1000], ['kg', 'g', 1000], ['L', 'mL', 1000], ['cm', 'mm', 10]];
  const UI = [['ft', 'in', 12], ['yd', 'ft', 3], ['lb', 'oz', 16], ['gal', 'qt', 4], ['mi', 'ft', 5280]];
  E3.skill({ id: 'III.2.11', name: 'Unit conversion with ratios', steps: {
    a: { t: 'conversion factors', g: (R, O) => {
      const [B, S, f] = R.pick(imp(O) ? UI : UM), kind = R.int(0, 2);
      if (kind === 0) { const x = R.int(2, 9);
        return choice(R, `To change ${x} ${B} into ${S}, multiply by which fraction?`, fh(`${fmt(f)} ${S}`, `1 ${B}`), [fh(`1 ${B}`, `${fmt(f)} ${S}`), fh(`${fmt(f)} ${B}`, `1 ${S}`)], `${fh(`${fmt(f)} ${S}`, `1 ${B}`)} equals 1, and the ${B} cancel: ${x} × ${fmt(f)} = ${fmt(x * f)} ${S}.`); }
      if (kind === 1) { const x = R.int(2, 40) / (f >= 12 ? 1 : R.pick([1, 2])); return num(`Convert ${fmt(x)} ${B} to ${S}.`, x * f, `${fmt(x)} ${B} × ${fh(`${fmt(f)} ${S}`, `1 ${B}`)} = ${fmt(x * f)} ${S}.`); }
      const y = findv(() => R.int(1, 9) * (f >= 100 ? R.pick([f / 4, f / 2, f / 5, f]) : R.int(1, 9)), y => ok3(y / f) && y !== f); 
      return num(`Convert ${fmt(y)} ${S} to ${B}.`, y / f, `${fmt(y)} ${S} × ${fh(`1 ${B}`, `${fmt(f)} ${S}`)} = ${fmt(y / f)} ${B}.`);
    } },
    b: { t: 'multi-step', g: (R, O) => {
      const CH = [...(imp(O) ? [['yd', 'ft', 3, 'in', 12], ['gal', 'qt', 4, 'pints', 2], ['mi', 'yd', 1760, 'ft', 3]] : [['km', 'm', 1000, 'cm', 100], ['m', 'cm', 100, 'mm', 10], ['kg', 'g', 1000, 'mg', 1000]]), ['hours', 'minutes', 60, 'seconds', 60], ['days', 'hours', 24, 'minutes', 60], ['weeks', 'days', 7, 'hours', 24]];
      const [A, B, f1, Cc, f2] = R.pick(CH), x = R.int(2, 9) / (R.bool(0.3) ? 2 : 1);
      if (R.bool(0.75) || !ok3(x)) return num(`Convert ${fmt(x)} ${A} to ${Cc}.`, x * f1 * f2, `${fmt(x)} ${A} = ${fmt(x * f1)} ${B} = ${fmt(x * f1)} × ${f2} = ${fmt(x * f1 * f2)} ${Cc}.`);
      const y = x * f1 * f2; return num(`Convert ${fmt(y)} ${Cc} to ${A}.`, x, `${fmt(y)} ${Cc} ÷ ${f2} = ${fmt(x * f1)} ${B}, then ÷ ${fmt(f1)} = ${fmt(x)} ${A}.`);
    } },
    c: { t: 'rates', g: (R, O) => {
      const kind = R.int(0, 2);
      if (kind === 2) { const r = R.int(2, 12) * R.pick([1, 5]), u = R.pick(['liters', 'pages', 'steps']); return num(`A machine uses ${r} ${u} per minute. How many ${u} per hour is that?`, r * 60, `1 hour = 60 minutes: ${r} × 60 = ${r * 60} ${u} per hour.`); }
      if (imp(O)) { const v = 15 * R.int(1, 5);
        if (kind === 0) return num(`Convert ${v} miles per hour to feet per second. (1 mile = 5280 ft)`, v * 22 / 15, `${v} × 5280 = ${fmt(v * 5280)} ft per hour. ÷ 3600 s = ${fmt(v * 22 / 15)} ft per second.`);
        return num(`Convert ${fmt(v * 22 / 15)} feet per second to miles per hour. (1 mile = 5280 ft)`, v, `${fmt(v * 22 / 15)} × 3600 = ${fmt(v * 22 / 15 * 3600)} ft per hour. ÷ 5280 = ${v} mph.`); }
      const v = 18 * R.int(1, 7);
      if (kind === 0) return num(`Convert ${v} km/h to meters per second.`, v / 3.6, `${v} km/h = ${fmt(v * 1000)} m per 3600 s. ${fmt(v * 1000)} ÷ 3600 = ${fmt(v / 3.6)} m/s.`);
      return num(`Convert ${fmt(v / 3.6)} m/s to km/h.`, v, `${fmt(v / 3.6)} × 3600 = ${fmt(v * 1000)} m per hour = ${v} km/h.`);
    } },
    d: { t: 'track the units', g: (R, O) => {
      const T = R.pick(imp(O) ? [['ft²', 'in²', 12, 2], ['yd²', 'ft²', 3, 2], ['ft³', 'in³', 12, 3], ['yd³', 'ft³', 3, 3]] : [['m²', 'cm²', 100, 2], ['cm²', 'mm²', 10, 2], ['m³', 'cm³', 100, 3], ['cm³', 'mm³', 10, 3]]);
      const [B, S, f, p] = T, F2 = f ** p, x = R.int(2, 9);
      if (R.bool(0.5)) return choice(R, `Convert ${x} ${B} to ${S}.`, `${fmt(x * F2)} ${S}`, [`${fmt(x * f)} ${S}`, `${fmt(x * f * p)} ${S}`, `${fmt(x * F2 * f)} ${S}`], `${B} means ${p === 2 ? 'length × length' : 'length × length × length'}, so use ${f} ${p === 2 ? 'twice' : 'three times'}: ${x} × ${fmt(F2)} = ${fmt(x * F2)} ${S}.`);
      return num(`Convert ${x} ${B} to ${S}.`, x * F2, `1 ${B.slice(0, -1)} = ${f} ${S.slice(0, -1)}, so 1 ${B} = ${Array(p).fill(f).join(' × ')} = ${fmt(F2)} ${S}. ${x} × ${fmt(F2)} = ${fmt(x * F2)} ${S}.`);
    } },
  } });

  /* ================= III.2.12 Sharing in a ratio ================= */
  const NAMES = [['Ana', 'Ben'], ['Mia', 'Leo'], ['Sam', 'Kai'], ['Zoe', 'Eli'], ['Ivy', 'Max']];
  E3.skill({ id: 'III.2.12', name: 'Sharing in a ratio', steps: {
    a: { t: 'share an amount', g: (R, O) => {
      const [a, b] = coprime(R, 1, 7), k = R.int(2, 12) * (O.coins === 'THB' ? 10 : 1), T = k * (a + b), [p, q] = R.pick(NAMES);
      if (R.bool(0.3) && T % a === 0 && T % b === 0 && a > 1) return choice(R, `Share ${money(T, O)} between ${p} and ${q} in the ratio ${ratio(a, b)}. How much does ${p} get?`, money(k * a, O), [money(T / a, O), money(k * b, O), money(T / (a + b), O)], `${a} + ${b} = ${a + b} parts, so 1 part = ${money(T, O)} ÷ ${a + b} = ${money(k, O)}. ${p}: ${a} × ${money(k, O)} = ${money(k * a, O)}.`);
      return num(`Share ${money(T, O)} between ${p} and ${q} in the ratio ${ratio(a, b)}. How much does each get, in ${cur(O)}?`, [{ label: p, ans: k * a }, { label: q, ans: k * b }], `${a} + ${b} = ${a + b} parts. 1 part = ${fmt(T)} ÷ ${a + b} = ${fmt(k)}. ${p}: ${fmt(k * a)}, ${q}: ${fmt(k * b)}.`);
    } },
    b: { t: 'total from one part', g: (R, O) => {
      const [a, b] = coprime(R, 1, 7), k = R.int(2, 12) * (O.coins === 'THB' ? 10 : 1), [p, q] = R.pick(NAMES), kind = R.int(0, 2);
      if (kind === 0) return num(`${p} and ${q} share money in the ratio ${ratio(a, b)}. ${p} gets ${money(k * a, O)}. What is the total, in ${cur(O)}?`, k * (a + b), `${a} part${a > 1 ? 's' : ''} = ${fmt(k * a)}, so 1 part = ${fmt(k)}. Total = ${a + b} parts = ${fmt(k * (a + b))}.`, { visual: V2.tape([{ label: p, n: a, total: money(k * a, O) }, { label: q, n: b }], { whole: '?' }) });
      if (kind === 1) return num(`${p} and ${q} share money in the ratio ${ratio(a, b)}. ${p} gets ${money(k * a, O)}. How much does ${q} get, and what is the total, in ${cur(O)}?`, [{ label: q, ans: k * b }, { label: 'total', ans: k * (a + b) }], `1 part = ${fmt(k * a)} ÷ ${a} = ${fmt(k)}. ${q}: ${b} × ${fmt(k)} = ${fmt(k * b)}. Total = ${a + b} parts = ${fmt(k * (a + b))}.`);
      const [x, y] = a > b ? [a, b] : [b, a], [P, Q] = a > b ? [p, q] : [q, p];
      return num(`${P} and ${Q} share money in the ratio ${ratio(x, y)}. ${P} gets ${money(k * (x - y), O)} more than ${Q}. What is the total, in ${cur(O)}?`, k * (x + y), `The difference is ${x - y} part${x - y > 1 ? 's' : ''} = ${fmt(k * (x - y))}, so 1 part = ${fmt(k)}. Total = ${x + y} parts = ${fmt(k * (x + y))}.`, { visual: V2.tape([{ label: P, n: x }, { label: Q, n: y }]) });
    } },
    c: { t: 'change a ratio', g: R => {
      const [a, b, k, p, q] = findv(() => [...coprime(R, 1, 6), R.int(2, 6), ...coprime(R, 1, 5)], ([a, b, k, p, q]) => p * k * b % q === 0 && p * k * b / q > k * a && p * k * b / q - k * a <= 30);
      const A = k * a, B = k * b, n = p * B / q - A;
      return num(`A bag has red and blue beads in the ratio ${ratio(a, b)}. There are ${B} blue beads. How many red beads must be added to make the ratio ${ratio(p, q)}?`, n, `Red now: ${B} ÷ ${b} × ${a} = ${A}. For ${ratio(p, q)} with ${B} blue, red must be ${B} ÷ ${q} × ${p} = ${p * B / q}. Add ${p * B / q} − ${A} = ${n}.`);
    } },
    d: { t: 'mixtures', g: (R, O) => {
      const kind = R.int(0, 2);
      if (kind === 0) { const [a, b] = coprime(R, 1, 5), k = R.pick([25, 50, 100, 125, 150]), T = k * (a + b);
        return num(`Juice and water are mixed ${ratio(a, b)}. How much juice is in ${fmt(T)} mL of the drink?`, k * a, `${a + b} parts = ${fmt(T)} mL, so 1 part = ${k} mL. Juice: ${a} × ${k} = ${k * a} mL.`); }
      if (kind === 1) { const [a, b, c] = findv(() => [R.int(1, 5), R.int(1, 5), R.int(1, 5)], v => E3.gcd(E3.gcd(v[0], v[1]), v[2]) === 1 && new Set(v).size > 1), k = R.int(2, 9) * (O.coins === 'THB' ? 10 : 1), T = k * (a + b + c), N3 = R.pick(NAMES);
        const [m1, m2, m3] = R.pick([['nuts', 'raisins', 'seeds'], ['oats', 'nuts', 'fruit'], ['peanuts', 'raisins', 'chocolate']]), kg = k * 10 / (O.coins === 'THB' ? 10 : 1);
        return num(`A trail mix has ${m1}, ${m2} and ${m3} in the ratio ${a} : ${b} : ${c}. How many grams of each are in ${fmt(kg * (a + b + c))} g of the mix?`, [{ label: `${m1} (g)`, ans: kg * a }, { label: `${m2} (g)`, ans: kg * b }, { label: `${m3} (g)`, ans: kg * c }], `${a} + ${b} + ${c} = ${a + b + c} parts. 1 part = ${fmt(kg * (a + b + c))} ÷ ${a + b + c} = ${fmt(kg)} g. So ${fmt(kg * a)} g, ${fmt(kg * b)} g and ${fmt(kg * c)} g.`); }
      const sd = R.int(2, 4), gv = R.int(3, 6), k = R.int(2, 8) * 5, asksand = R.bool(), q = asksand ? sd : gv, w = asksand ? 'sand' : 'gravel';
      return num(`Concrete uses cement, sand and gravel in the ratio 1 : ${sd} : ${gv}. How much ${w} goes with ${k} kg of cement, in kg?`, k * q, `For every 1 kg of cement there are ${q} kg of ${w}: ${k} × ${q} = ${k * q} kg.`);
    } },
  } });

  /* ================= III.2.13 Speed, distance, time ================= */
  const HM = [[30, 60], [40, 60], [20, 30], [60, 90], [10, 15], [12, 24], [30, 70], [40, 120], [45, 90], [20, 60], [60, 40], [24, 12]];
  E3.skill({ id: 'III.2.13', name: 'Speed, distance, time', steps: {
    a: { t: 'd = rt', g: (R, O) => {
      const D = DIST(O), r = R.int(8, 24) * 5, t = R.pick([2, 3, 4, 5, 1.5, 2.5, 0.5]), kind = R.int(0, 2);
      if (kind === 2) { const v = 12 * R.int(1, 5), mnt = R.pick([10, 15, 20, 30, 45]); return num(`A cyclist rides at ${v} ${D.sp} for ${mnt} minutes. How far does she go, in ${D.w}?`, v * mnt / 60, `${mnt} minutes = ${F(mnt, 60)} hour. ${DRT} = ${v} × ${F(mnt, 60)} = ${fmt(v * mnt / 60)} ${D.w}.`); }
      return num(`A train travels at ${r} ${D.sp} for ${fmt(t)} hours. How far does it go, in ${D.w}?`, r * t, `${DRT} = ${r} × ${fmt(t)} = ${fmt(r * t)} ${D.w}.`);
    } },
    b: { t: 'find the time', g: (R, O) => {
      const D = DIST(O), r = R.pick([4, 5, 6, 8, 10, 12, 15, 20, 30, 40, 50, 60, 80]), t = R.pick([2, 3, 4, 5, 0.5, 1.5, 2.5, 0.25, 0.75]);
      if (R.bool(0.35)) { const mins = t * 60; return num(`How many minutes does it take to go ${fmt(r * t)} ${D.w} at ${r} ${D.sp}?`, mins, `${m('t')} = ${m('d')} ÷ ${m('r')} = ${fmt(r * t)} ÷ ${r} = ${fmt(t)} hours = ${fmt(mins)} minutes.`); }
      return num(`How many hours does it take to go ${fmt(r * t)} ${D.w} at ${r} ${D.sp}?`, t, `${m('t')} = ${m('d')} ÷ ${m('r')} = ${fmt(r * t)} ÷ ${r} = ${fmt(t)} hour${t === 1 ? '' : 's'}.`);
    } },
    c: { t: 'average speed', g: (R, O) => {
      const D = DIST(O);
      if (R.bool(0.55)) { const [s1, s2] = R.pick(HM), d = s1 * s2 / E3.gcd(s1, s2) * R.int(1, 2), t1 = d / s1, t2 = d / s2, avg = 2 * d / (t1 + t2);
        return choice(R, `A bus goes ${d} ${D.w} at ${s1} ${D.sp}, then ${d} ${D.w} more at ${s2} ${D.sp}. What is its average speed?`, `${fmt(avg)} ${D.sp}`, [`${fmt((s1 + s2) / 2)} ${D.sp}`, `${fmt(s1 + s2)} ${D.sp}`, `${fmt(Math.abs(s2 - s1))} ${D.sp}`],
          `Times: ${fmt(t1)} h and ${fmt(t2)} h. Average speed = total distance ÷ total time = ${2 * d} ÷ ${fmt(t1 + t2)} = ${fmt(avg)} ${D.sp}, not the average of the speeds.`); }
      const [t1, t2] = [R.int(1, 3), R.int(1, 3)], s1 = R.int(4, 12) * 5, s2 = R.int(4, 12) * 5, d = s1 * t1 + s2 * t2, avg = d / (t1 + t2);
      if (!ok3(avg) || s1 === s2) return E3.byId['III.2.13'].steps.c.g(R, O);
      return num(`A car drives ${s1 * t1} ${D.w} in ${t1} h, then ${s2 * t2} ${D.w} in ${t2} h. What is its average speed, in ${D.sp}?`, avg, `Total distance ${d} ${D.w}, total time ${t1 + t2} h. ${d} ÷ ${t1 + t2} = ${fmt(avg)} ${D.sp}.`);
    } },
    d: { t: 'two travelers', g: (R, O) => {
      const D = DIST(O), r1 = R.int(2, 12) * 5, r2 = R.int(2, 12) * 5, t = R.pick([0.5, 1, 1.5, 2, 2.5, 3, 0.25, 0.75]);
      if (R.bool(0.6)) { const d = (r1 + r2) * t; return num(`Two cars start ${fmt(d)} ${D.w} apart and drive toward each other at ${r1} ${D.sp} and ${r2} ${D.sp}. After how many hours do they meet?`, t, `Together they close ${r1} + ${r2} = ${r1 + r2} ${D.w} each hour. ${fmt(d)} ÷ ${r1 + r2} = ${fmt(t)} hour${t === 1 ? '' : 's'}.`); }
      if (r1 === r2) return E3.byId['III.2.13'].steps.d.g(R, O);
      const [lo, hi] = r1 < r2 ? [r1, r2] : [r2, r1], gap = (hi - lo) * t;
      return num(`A truck is ${fmt(gap)} ${D.w} ahead of a car on the same road. The truck drives at ${lo} ${D.sp}, the car at ${hi} ${D.sp}. After how many hours does the car catch up?`, t, `The car gains ${hi} − ${lo} = ${hi - lo} ${D.w} each hour. ${fmt(gap)} ÷ ${hi - lo} = ${fmt(t)} hour${t === 1 ? '' : 's'}.`);
    } },
  } });

  /* ================= III.2.14 Comparing ratios ================= */
  // two different juice : water mixes (a:b and c:d, both in simplest form)
  const ap = (a, b) => (ok3(a / b) ? '= ' : '≈ ') + fmt(Math.round(a / b * 100) / 100);
  const mixes = (R, same) => findv(() => [...coprime(R, 1, 9), ...coprime(R, 1, 9)], ([a, b, c, d]) => !(a === c && b === d) && (a * d === b * c) === !!same);
  E3.skill({ id: 'III.2.14', name: 'Comparing ratios', steps: {
    a: { t: 'which mix is stronger', g: R => {
      const [a, b, c, d] = findv(() => mixes(R), ([a, b, c, d]) => R.bool(0.6) ? (c > a) !== (c * b > a * d) : true), A = a / b > c / d;
      return choiceFixed(`Juice : water. Mix A is ${ratio(a, b)}. Mix B is ${ratio(c, d)}. Which mix tastes more of juice?`, ['Mix A', 'Mix B'], A ? 0 : 1,
        `Juice per 1 part water: A ${fh(a, b)} ${ap(a, b)}, B ${fh(c, d)} ${ap(c, d)}. ${A ? 'A' : 'B'} is stronger. More juice alone does not decide it.`,
        { visual: V2.tape([{ label: 'A juice', n: a, color: C.amber }, { label: 'A water', n: b, color: C.blue }, { label: 'B juice', n: c, color: C.amber }, { label: 'B water', n: d, color: C.blue }]) });
    } },
    b: { t: 'common terms', g: R => {
      const [a, b, c, d] = findv(() => mixes(R), ([a, b, c, d]) => a !== c && E3.lcm(a, c) <= 36), L = E3.lcm(a, c);
      return num(`Juice : water. A is ${ratio(a, b)} and B is ${ratio(c, d)}. Rewrite both with ${L} parts juice. How much water in each?`, [{ label: `A  ${L} :`, ans: b * L / a }, { label: `B  ${L} :`, ans: d * L / c }],
        `A: × ${L / a} gives ${ratio(L, b * L / a)}. B: × ${L / c} gives ${ratio(L, d * L / c)}. ${b * L / a === d * L / c ? 'Same water: same strength.' : `Less water with the same juice is stronger: ${b * L / a < d * L / c ? 'A' : 'B'}.`}`);
    } },
    c: { t: 'as fractions', g: R => {
      const same = R.bool(0.2), [a, b, c, d] = same ? (() => { const [p, q] = findv(() => coprime(R, 1, 6), v => v[1] > 1), k = R.int(2, 4); return [p, q, k * p, k * q]; })() : findv(() => mixes(R), v => v[1] > 1 && v[3] > 1), cmp = a * d < b * c ? 0 : a * d === b * c ? 1 : 2;
      return choiceFixed(`Compare the ratios ${ratio(a, b)} and ${ratio(c, d)} as fractions: ${fh(a, b)} ? ${fh(c, d)}`, SIGNS, cmp,
        `Cross multiply: ${a} × ${d} = ${a * d} and ${b} × ${c} = ${b * c}. So ${fh(a, b)} ${SIGNS[cmp]} ${fh(c, d)}.`);
    } },
    d: { t: 'justify', g: R => {
      const [a, b, c, d] = findv(() => mixes(R), ([a, b, c, d]) => c > a && c * b < a * d && a > 1 && b > 1 && d > 1);
      return choice(R, `Juice : water. A is ${ratio(a, b)}, B is ${ratio(c, d)}. Which reason correctly shows A is stronger?`, `Per 1 part water, A has ${F(a, b)} juice and B has ${F(c, d)}. ${F(a, b)} is more.`,
        [`B has more juice (${c} parts), so B is stronger.`, `A's juice and water differ by ${Math.abs(a - b)}, B's by ${Math.abs(c - d)}.`, `A has ${a + b} parts in all, B has ${c + d}.`],
        `Compare juice per part of water (or make one term the same): ${fh(a, b)} ${ap(a, b)} &gt; ${fh(c, d)} ${ap(c, d)}.`);
    } },
  } });

  /* ================= III.2.15 Ratio puzzles ================= */
  E3.skill({ id: 'III.2.15', name: 'Ratio puzzles', steps: {
    a: { t: 'recipes', g: R => {
      const s1 = R.pick([2, 4, 6, 8]), s2 = findv(() => R.pick([3, 4, 5, 6, 8, 10, 12]), v => v !== s1), [qn, qd] = R.pick([[3, 4], [1, 2], [2, 3], [3, 2], [5, 4], [1, 1], [2, 1], [3, 1]]);
      const ing = R.pick(['cups of flour', 'cups of milk', 'cups of rice', 'cups of oats']), [an, ad] = red(qn * s2, qd * s1);
      return num(`A recipe for ${s1} people uses ${F(qn, qd)} ${ing}. How many ${ing} for ${s2} people?${ad === 1 ? '' : ' Write a fraction or mixed number.'}`, frac(an, ad),
        `Per person: ${F(qn, qd)} ÷ ${s1} = ${F(qn, qd * s1)}. For ${s2}: ${F(qn, qd * s1)} × ${s2} = ${F(an, ad)}.`);
    } },
    b: { t: 'paint mixing', g: R => {
      const [a, b] = coprime(R, 1, 5), kind = R.int(0, 2);
      if (kind === 0) { const k = R.int(2, 8); return num(`Green paint is blue : yellow = ${ratio(a, b)}. You have ${k * a} L of blue. How much yellow do you need, and how much green will you make?`, [{ label: 'yellow (L)', ans: k * b }, { label: 'green (L)', ans: k * (a + b) }], `${k * a} ÷ ${a} = ${k}, so yellow = ${k} × ${b} = ${k * b} L. Green = ${k * a} + ${k * b} = ${k * (a + b)} L.`); }
      const k = R.int(2, 5), j = R.int(1, 3), Y = k * b + j * b;   // too much yellow poured: fix with blue
      if (kind === 1) return num(`Green paint needs blue : yellow = ${ratio(a, b)}. Tom mixed ${k * a} L blue with ${Y} L yellow by mistake. How much more blue must he add?`, j * a, `${Y} L yellow needs ${Y} ÷ ${b} × ${a} = ${Y / b * a} L blue. He has ${k * a}, so add ${Y / b * a - k * a} L.`);
      const T = R.int(2, 6) * (a + b) * 2; return num(`Orange paint is red : yellow = ${ratio(a, b)}. How many liters of red are in ${T} L of orange?`, T / (a + b) * a, `${a + b} parts = ${T} L, so 1 part = ${T / (a + b)} L. Red = ${a} × ${T / (a + b)} = ${T / (a + b) * a} L.`);
    } },
    c: { t: 'more workers, less time', g: R => {
      const [w1, w2, t1] = findv(() => [R.int(2, 12), R.int(2, 12), R.int(2, 12)], ([w1, w2, t1]) => w1 !== w2 && (w1 * t1) % w2 === 0), t2 = w1 * t1 / w2, job = R.pick([['painters', 'hours', 'a fence'], ['workers', 'days', 'a wall'], ['pumps', 'hours', 'a tank'], ['cooks', 'hours', 'a meal']]);
      const p = `${w1} ${job[0]} take ${t1} ${job[1]} to finish ${job[2]}. At the same rate, how many ${job[1]} would ${w2} ${job[0]} take?`, e = `${w1} × ${t1} = ${w1 * t1} ${job[0].slice(0, -1)}-${job[1]} of work. ${w1 * t1} ÷ ${w2} = ${fmt(t2)} ${job[1]}. More ${job[0]}, less time.`;
      if (R.bool(0.35)) return choice(R, p, `${fmt(t2)} ${job[1]}`, [`${fmt(Math.round(t1 * w2 / w1 * 100) / 100)} ${job[1]}`, `${t1 + Math.abs(w2 - w1)} ${job[1]}`, `${w1 * t1} ${job[1]}`], e);
      return num(p, t2, e);
    } },
    d: { t: 'explain your reasoning', g: R => {
      const kind = R.int(0, 2);
      if (kind === 0) { const s = R.pick([2, 3, 4, 5]), e = s + R.int(1, 3) * 2, n = s * 2; // add instead of multiply
        return choice(R, `A recipe for ${s} people uses ${e} eggs. Kim says for ${n} people you need ${e + n - s} eggs, "${n - s} more people, ${n - s} more eggs". What is wrong?`, `Twice the people needs twice the eggs: ${2 * e}, not ${e + n - s}.`, [`Nothing, adding ${n - s} keeps it fair.`, `You need ${e + 2} eggs, one more for each extra pair.`, `You need ${e} eggs, the recipe doesn't change.`], `Scale by multiplying: ${n} is ${n / s} × ${s}, so eggs = ${n / s} × ${e} = ${2 * e}.`); }
      if (kind === 1) { const w = R.int(2, 4), t = R.int(4, 12) * 2;
        return choice(R, `${w} workers build a shed in ${t} hours. Lee says ${2 * w} workers need ${2 * t} hours. What is the best reply?`, `Wrong: twice the workers share the work, so it takes ${t / 2} hours.`, [`Right: twice the workers, twice the hours.`, `Wrong: it takes ${t + w} hours.`, `Right: the ratio ${w} : ${t} stays the same.`], `The total work is ${w} × ${t} = ${w * t} worker-hours. ${w * t} ÷ ${2 * w} = ${t / 2} hours.`); }
      const [a, b] = coprime(R, 1, 5), k = R.int(2, 4);
      return choice(R, `Mix A is ${ratio(a, b)} juice : water. Mix B is ${ratio(k * a, k * b)}. Which statement is right?`, `They taste the same: B is A with every part × ${k}.`, [`B is stronger: it has more juice.`, `A is stronger: it has less water.`, `B is weaker: it has more water.`], `${ratio(k * a, k * b)} ÷ ${k} = ${ratio(a, b)}. Equivalent ratios make the same taste.`);
    } },
  } });

  /*__NEXT__*/
})();

/* Era III · Unit III.3 Percent (III.3.01–III.3.17)
   Money is kept as whole cents / satang (integers) and printed with M(); percents printed with pc(). */
(function () {
  const { num, choice, choiceFixed, tf, frac, fh, fmt, V, C } = E3;

  /* ---------- helpers ---------- */
  const gcd = E3.gcd;
  const pc = p => fmt(p) + '%';
  const sc = O => O.coins === 'THB' ? 10 : 1;                 // prices in baht are ~10x bigger
  const M = (c, O) => {                                        // c = whole cents / satang
    const neg = c < 0; c = Math.abs(Math.round(c));
    const w = Math.floor(c / 100), r = c % 100, s = fmt(w) + (r ? '.' + String(r).padStart(2, '0') : '');
    return (neg ? '−' : '') + (O.coins === 'THB' ? s + ' baht' : '$' + s);
  };
  const MX = (d, O) => M(Math.round(d * 100), O);                // money from a whole-unit amount (dollars/baht)
  const MF = (c, O) => ({ label: O.coins === 'THB' ? 'baht' : '$', ans: Math.round(c) / 100 });
  const unitsL = O => O.units === 'imperial' ? { len: 'in', big: 'ft', mass: 'lb', vol: 'gallons' } : { len: 'cm', big: 'm', mass: 'kg', vol: 'liters' };
  // try up to 200 times to satisfy ok(); gen uses R only
  const find = (gen, ok) => { let v; for (let i = 0; i < 200; i++) { v = gen(); if (ok(v)) return v; } throw new Error('find failed'); };
  const r1 = x => Math.round(x * 10) / 10;
  const f4 = x => String(Math.round(x * 10000) / 10000);            // up to 4 dp, e.g. 0.9375
  const mult = (R, step, max) => { const k = R.int(1, Math.max(2, Math.floor(max / step))); return step * k === 100 ? 100 * R.int(2, 6) : step * k; }; // a multiple of step, not 100

  /* ---------- visuals (prefix V3) ---------- */
  const V3 = {};
  // simple table: rows = [[header, cell, cell…], …]; '?' cells highlighted
  V3.table = function (rows, o = {}) {
    const cw = o.cw || 78, hw = o.hw || 96, rh = 38, cols = rows[0].length;
    const Wd = hw + (cols - 1) * cw + 4, Ht = rows.length * rh + 4; let b = '';
    rows.forEach((row, i) => row.forEach((cell, j) => {
      const x = j ? 2 + hw + (j - 1) * cw : 2, y = 2 + i * rh, w = j ? cw : hw, q = cell === '?';
      b += `<rect x="${x}" y="${y}" width="${w}" height="${rh}" fill="${j === 0 ? C.faint : q ? C.amber + '33' : C.paper}" stroke="${C.ink}" stroke-width="1.5"/>`;
      b += V.text(x + w / 2, y + rh / 2, String(cell), { size: 15, weight: j === 0 || q ? 700 : 500 });
    }));
    return V.svg(Wd, Ht, b, 'table');
  };
  // tape split into n equal parts, whole labeled above
  V3.tape = function (n, total, o = {}) {
    const W = 360, h = 40, y = 26; let b = V.text(W / 2 + 2, 11, String(total), { size: 15, weight: 700 });
    b += `<path d="M4 20 V16 H${W} V20" fill="none" stroke="${C.muted}" stroke-width="1.5"/>`;
    for (let i = 0; i < n; i++) { const x = 4 + i * (W - 4) / n; b += `<rect x="${x}" y="${y}" width="${(W - 4) / n}" height="${h}" fill="${i < (o.shade || 0) ? C.blue + '55' : C.paper}" stroke="${C.ink}" stroke-width="2"/>`;
      if (o.pcts) b += V.text(x + (W - 4) / n / 2, y + h / 2, fmt(100 / n * (i + 1)) + '%', { size: 12, fill: C.muted }); }
    return V.svg(W + 4, y + h + 4, b, 'tape diagram');
  };
  // bar chart: cats [{label, v}]
  V3.bars = function (cats) {
    const max = Math.max(...cats.map(c => c.v)), bw = 56, gap = 22, H = 170, base = 140, Wd = cats.length * (bw + gap) + gap;
    let b = `<line x1="8" y1="${base}" x2="${Wd - 4}" y2="${base}" stroke="${C.ink}" stroke-width="2"/>`;
    cats.forEach((c, i) => { const x = gap + i * (bw + gap), h = c.v / max * 105;
      b += `<rect x="${x}" y="${base - h}" width="${bw}" height="${h}" fill="${c.color || C.set[i % 7]}"/>` + V.text(x + bw / 2, base - h - 10, String(c.v), { size: 14, weight: 700 }) + V.text(x + bw / 2, base + 16, c.label, { size: 13 }); });
    return V.svg(Wd, H, b, 'bar chart');
  };
  // pie chart with legend: slices [{p (percent), label, show}] show = text in legend
  V3.pie = function (slices) {
    const r = 70, cx = 78, cy = 78; let a = -Math.PI / 2, b = '';
    slices.forEach((s, i) => { const a1 = a + s.p / 100 * 2 * Math.PI, big = s.p > 50 ? 1 : 0;
      const P = t => `${(cx + r * Math.cos(t)).toFixed(2)} ${(cy + r * Math.sin(t)).toFixed(2)}`;
      b += `<path d="M${cx} ${cy} L${P(a)} A${r} ${r} 0 ${big} 1 ${P(a1)} Z" fill="${s.color || C.set[i % 7]}" stroke="${C.paper}" stroke-width="2"/>`; a = a1; });
    slices.forEach((s, i) => { const y = 20 + i * 28; b += `<rect x="176" y="${y - 9}" width="18" height="18" rx="3" fill="${s.color || C.set[i % 7]}"/>` + V.text(202, y, s.show === '' ? s.label : `${s.label}: ${s.show}`, { size: 15, anchor: 'start' }); });
    return V.svg(340, Math.max(160, 20 + slices.length * 28), b, 'pie chart');
  };

  /* ================= III.3.01 Percent means per hundred ================= */
  const BENCH = [[50, 1, 2], [25, 1, 4], [75, 3, 4], [10, 1, 10], [20, 1, 5], [1, 1, 100], [5, 1, 20], [40, 2, 5], [60, 3, 5], [80, 4, 5], [30, 3, 10], [70, 7, 10]];
  E3.skill({ id: 'III.3.01', name: 'Percent means per hundred', steps: {
    a: { t: 'the 100 grid', g: R => {
      const k = R.int(3, 97);
      if (R.bool(0.65)) return num(`The grid has 100 squares. What percent is shaded?`, k, `${k} of the 100 squares are shaded: ${k} per hundred = ${k}%.`, { visual: V.hgrid(k, { size: 16 }) });
      return num(`The grid has 100 squares. What percent is <b>not</b> shaded?`, 100 - k, `${k} are shaded, so 100 − ${k} = ${100 - k} are not: ${100 - k}%.`, { visual: V.hgrid(k, { size: 16 }) });
    } },
    b: { t: 'as a fraction', g: R => {
      const p = R.int(2, 98), [n, d] = E3.reduce(p, 100), kind = R.int(0, 2);
      if (kind === 0) return num(`Write ${p}% as a fraction in simplest form.`, [frac(p, 100, 'simplest')], `${p}% = ${fh(p, 100)}${d !== 100 ? ` = ${fh(n, d)}` : ''}.`);
      if (kind === 1) return num(`Write ${fh(p, 100)} as a percent.`, p, `Per hundred means percent: ${fh(p, 100)} = ${p}%.`);
      return choice(R, `Which fraction equals ${p}%?`, fh(n, d), [fh(p, 10), fh(1, p), fh(p, 1000)], `Percent means out of 100: ${p}% = ${fh(p, 100)}${d !== 100 ? ` = ${fh(n, d)}` : ''}.`);
    } },
    c: { t: 'as a decimal', g: R => {
      const p = R.bool(0.4) ? R.int(1, 9) : R.int(11, 99);
      if (R.bool(0.5)) return num(`Write ${p}% as a decimal.`, p / 100, `${p}% = ${fh(p, 100)} = ${fmt(p / 100)}: move the point two places left.`);
      return choice(R, `Which decimal equals ${p}%?`, fmt(p / 100), [fmt(p / 10), fmt(p / 1000), String(p)], `${p}% = ${p} hundredths = ${fmt(p / 100)}.`);
    } },
    d: { t: 'benchmark percents', g: R => {
      const [p, n, d] = R.pick(BENCH), kind = R.int(0, 2);
      if (kind === 0) { const others = R.sample(BENCH.filter(b => b[0] !== p), 3).map(b => fh(b[1], b[2]));
        return choice(R, `Which fraction equals ${p}%?`, fh(n, d), others, `${p}% = ${fh(p, 100)} = ${fh(n, d)}.`); }
      if (kind === 1) return num(`What percent is ${fh(n, d)}?`, p, `${fh(n, d)} = ${fh(p, 100)} = ${p}%.`);
      const [q, a, b] = R.pick([[50, 1, 2], [25, 1, 4], [10, 1, 10], [20, 1, 5], [75, 3, 4]]), N = b * R.int(3, 8), ans = N * a / b;
      return choice(R, `A class has ${N} students. ${q}% of them walk to school. How many students walk?`, String(ans), [String(q), String(N - ans), String(ans + b)],
        `${q}% = ${fh(a, b)}, and ${fh(a, b)} of ${N} is ${ans}. A percent is a share, not a count.`);
    } },
  } });

  /* ================= III.3.02 Fractions, decimals, percents ================= */
  E3.skill({ id: 'III.3.02', name: 'Fractions, decimals, percents', steps: {
    a: { t: 'fraction to percent', g: R => {
      const d = R.pick([2, 4, 5, 10, 20, 25, 50, 8]), n = find(() => R.int(1, d - 1), n => gcd(n, d) === 1), p = n * 100 / d;
      return num(`Write ${fh(n, d)} as a percent.`, p, d === 8 ? `${n} ÷ 8 = ${fmt(n / 8)} = ${pc(p)}.` : `Scale to hundredths: ${fh(n, d)} = ${fh(p, 100)} = ${pc(p)}.`);
    } },
    b: { t: 'percent to decimal', g: R => {
      const p = R.pick([R.int(1, 9), R.int(11, 99), R.int(101, 250), R.pick([12.5, 37.5, 62.5, 87.5])]);
      if (R.bool(0.5)) return num(`Write ${pc(p)} as a decimal.`, p / 100, `Divide by 100 (point two places left): ${pc(p)} = ${fmt(p / 100)}.`);
      return choice(R, `Which decimal equals ${pc(p)}?`, fmt(p / 100), [fmt(p / 10), fmt(p), p >= 10 ? String(p / 1000) : fmt(p * 10)], `Divide by 100: ${pc(p)} = ${fmt(p / 100)}.`);
    } },
    c: { t: 'decimal to percent', g: R => {
      const t = R.pick([R.int(1, 9) * 100, R.int(1, 9) * 10, R.int(11, 99) * 10, R.int(101, 199) * 10, R.pick([125, 375, 625, 875, 45, 5])]); // thousandths
      if (R.bool(0.5)) return num(`Write ${fmt(t / 1000)} as a percent.`, t / 10, `Multiply by 100 (point two places right): ${fmt(t / 1000)} = ${pc(t / 10)}.`);
      return choice(R, `Which percent equals ${fmt(t / 1000)}?`, pc(t / 10), [pc(t / 100), pc(t), pc(t / 1000)], `Multiply by 100: ${fmt(t / 1000)} = ${pc(t / 10)}, not ${pc(t / 100)}.`);
    } },
    d: { t: 'repeating ones like 1/3', g: R => {
      const d = R.pick([3, 3, 6, 9, 12]), n = find(() => R.int(1, d - 1), n => gcd(n, d) === 1);
      const [pn, pd] = E3.reduce(100 * n, d), w = Math.floor(pn / pd), rr = pn % pd;
      if (R.bool(0.5)) return num(`Write ${fh(n, d)} as a percent. Give it as a mixed number, like 12 1/2.`, [frac(pn, pd, 'mixed')], `${fh(n, d)} × 100% = ${fh(100 * n, d)}% = ${fh(rr, pd, w)}%. The decimal ${String(Math.floor(n / d * 10000) / 10000)}… repeats, so the fraction keeps it exact.`);
      return choice(R, `Which is <b>exactly</b> equal to ${fh(n, d)}?`, `${fh(rr, pd, w)}%`, [`${w}%`, `${w + 1}%`, `${fmt(r1(100 * n / d))}%`],
        `${fh(n, d)} = ${String(Math.floor(n / d * 10000) / 10000)}… repeating, so only the mixed percent ${fh(rr, pd, w)}% is exact.`);
    } },
  } });

  /* ================= III.3.03 Percent of a number ================= */
  E3.skill({ id: 'III.3.03', name: 'Percent of a number', steps: {
    a: { t: '10% and 50%', g: R => {
      if (R.bool()) { const x = R.bool(0.7) ? R.int(2, 99) * 10 : R.int(11, 99), a = x / 10;
        if (R.bool(0.7)) return num(`Find 10% of ${x}.`, a, `10% = ${fh(1, 10)}, so divide by 10: ${x} ÷ 10 = ${fmt(a)}.`);
        return choice(R, `What is 10% of ${x}?`, fmt(a), [fmt(x / 100), fmt(x - 10), fmt(x * 10)], `10% = ${fh(1, 10)}: ${x} ÷ 10 = ${fmt(a)}.`); }
      const x = R.int(6, 250) * 2, a = x / 2;
      if (R.bool(0.7)) return num(`Find 50% of ${x}.`, a, `50% = ${fh(1, 2)}, so halve it: ${x} ÷ 2 = ${a}.`);
      return choice(R, `What is 50% of ${x}?`, String(a), [fmt(x / 50), x > 60 ? String(x - 50) : fmt(x / 5), String(x * 2)], `50% is half: ${x} ÷ 2 = ${a}. Don't divide by 50.`);
    } },
    b: { t: '25% and 75%', g: R => {
      const x = R.int(3, 100) * 4, q = x / 4, three = R.bool();
      if (!three) { if (R.bool(0.7)) return num(`Find 25% of ${x}.`, q, `25% = ${fh(1, 4)}: ${x} ÷ 4 = ${q}.`);
        return choice(R, `What is 25% of ${x}?`, String(q), [fmt(x / 25), String(q * 3), x > 35 ? String(x - 25) : fmt(x / 2)], `25% is a quarter: ${x} ÷ 4 = ${q}, not ${x} ÷ 25.`); }
      if (R.bool(0.7)) return num(`Find 75% of ${x}.`, 3 * q, `75% = ${fh(3, 4)}: ${x} ÷ 4 = ${q}, × 3 = ${3 * q}.`, { visual: V3.tape(4, x) });
      return choice(R, `What is 75% of ${x}?`, String(3 * q), [String(q), fmt(x / 75), x > 85 ? String(x - 75) : fmt(x / 2)], `75% = ${fh(3, 4)}: a quarter is ${q}, three quarters is ${3 * q}.`);
    } },
    c: { t: 'any percent', g: R => {
      const p = find(() => R.int(2, 98), p => ![10, 25, 50, 75].includes(p)), step = 100 / gcd(p, 100), x = mult(R, step, 600), a = p * x / 100;
      if (R.bool(0.75)) return num(`Find ${p}% of ${x}.`, a, `${p}% of ${x} = ${fmt(p / 100)} × ${x} = ${fmt(a)}.`);
      return choice(R, `What is ${p}% of ${x}?`, fmt(a), [fmt(r1(x / p)), fmt(a * 10), fmt(x - p)], `Change ${p}% to ${fmt(p / 100)} and multiply: ${fmt(p / 100)} × ${x} = ${fmt(a)}.`);
    } },
    d: { t: 'mental strategies', g: R => {
      const kind = R.int(0, 2);
      if (kind === 0) { const p = R.pick([5, 15, 20, 30, 35, 40, 45, 60, 90]), x = R.int(2, 30) * 20, t = x / 10, a = p * x / 100;
        const how = p === 5 ? `5% is half of 10%: ${fmt(t / 2)}` : p % 10 ? `${p - 5}% is ${fmt((p - 5) / 10 * t)} and 5% is ${fmt(t / 2)}` : `${p}% is ${p / 10} × ${fmt(t)}`;
        return num(`10% of ${x} is ${fmt(t)}. Use that to find ${p}% of ${x}.`, a, `${how}, so ${p}% is ${fmt(a)}.`); }
      if (kind === 1) { const base = R.pick([50, 25, 20]), p = base === 50 ? R.int(2, 49) * 2 : base === 25 ? R.int(2, 24) * 4 : R.int(2, 19) * 5, a = p * base / 100;
        return num(`Find ${p}% of ${base} in your head.`, a, `${p}% of ${base} = ${base}% of ${p}, and ${base}% is ${fh(base, 100)} = ${fh(...E3.reduce(base, 100))}: ${p} × ${fh(...E3.reduce(base, 100))} = ${a}.`); }
      const x = R.int(2, 40) * 100, p = R.int(2, 9), u = x / 100;
      return num(`1% of ${fmt(x)} is ${u}. What is ${p}% of ${fmt(x)}?`, p * u, `${p}% is ${p} times 1%: ${p} × ${u} = ${p * u}.`);
    } },
  } });

  /* ================= III.3.04 Find the whole ================= */
  E3.skill({ id: 'III.3.04', name: 'Find the whole', steps: {
    a: { t: '20% is 8', g: R => {
      const p = R.pick([10, 20, 25, 50, 5, 40, 75]), step = 100 / gcd(p, 100), W = step * R.int(2, Math.max(3, Math.floor(300 / step))), a = W * p / 100;
      if (R.bool(0.75)) return num(`${p}% of a number is ${a}. What is the number?`, W, `${p}% is ${a}, so 1% is ${fmt(a / p)} and 100% is ${fmt(W)}. The whole is bigger than the part.`);
      return choice(R, `${p}% of a number is ${a}. What is the number?`, fmt(W), [fmt(a * p / 100), fmt(a + p), fmt(a * (100 - p) / 100)], `${a} ÷ ${fmt(p / 100)} = ${fmt(W)}. The whole must be bigger than the part.`);
    } },
    b: { t: 'with tables', g: R => {
      if (R.bool()) { const p = R.pick([20, 30, 40, 60, 70, 80, 90]), u = R.int(2, 40), a = u * p / 10;
        return num(`${p}% of an amount is ${a}. Use the table to find the whole amount.`, 10 * u, `Divide by ${p / 10} to get 10%: ${u}. Multiply by 10 for 100%: ${10 * u}.`, { visual: V3.table([['Percent', pc(p), '10%', '100%'], ['Amount', a, '', '?']]) }); }
      const p = R.pick([15, 35, 45, 55, 65, 85, 95]), u = R.int(2, 20), a = u * p / 5;
      return num(`${p}% of an amount is ${a}. Use the table to find the whole amount.`, 20 * u, `Divide by ${p / 5} to get 5%: ${u}. Multiply by 20 for 100%: ${20 * u}.`, { visual: V3.table([['Percent', pc(p), '5%', '100%'], ['Amount', a, '', '?']]) });
    } },
    c: { t: 'with equations', g: R => {
      const p = find(() => R.int(4, 96), p => ![50].includes(p)), step = 100 / gcd(p, 100), W = mult(R, step, 500), a = W * p / 100, dec = fmt(p / 100);
      if (R.bool(0.55)) return num(`Solve ${dec}<i>W</i> = ${fmt(a)}.`, [{ label: 'W =', ans: W }], `Divide both sides by ${dec}: <i>W</i> = ${fmt(a)} ÷ ${dec} = ${fmt(W)}.`);
      return choice(R, `${p}% of <i>W</i> is ${fmt(a)}. Which equation fits?`, `${dec}<i>W</i> = ${fmt(a)}`, [`<i>W</i> = ${dec} × ${fmt(a)}`, `${p}<i>W</i> = ${fmt(a)}`, `${fmt(a)}<i>W</i> = ${dec}`],
        `“${p}% of <i>W</i>” is ${dec} × <i>W</i>, and “is” means equals: ${dec}<i>W</i> = ${fmt(a)}.`);
    } },
    d: { t: 'word problems', g: (R, O) => {
      const kind = R.int(0, 2), U = unitsL(O);
      if (kind === 0) { const [W, p] = find(() => [R.int(16, 40), R.pick([10, 20, 25, 30, 40, 60, 75, 80])], ([W, p]) => W * p % 100 === 0), a = W * p / 100;
        return num(`${a} students in a class walk to school. That is ${p}% of the class. How many students are in the class?`, W, `${p}% is ${a}, so the class is ${a} ÷ ${fmt(p / 100)} = ${W} students.`); }
      if (kind === 1) { const [D, p] = find(() => [R.int(12, 60) * 5 * sc(O), R.pick([20, 25, 30, 40, 60, 75, 80])], ([D, p]) => D * p % 100 === 0), a = D * p / 100;
        return num(`You have saved ${M(a * 100, O)}. That is ${p}% of the price of a bike. What is the price?`, [MF(D * 100, O)], `${M(a * 100, O)} ÷ ${fmt(p / 100)} = ${M(D * 100, O)}.`); }
      const [W, p] = find(() => [R.int(4, 40) * 10, R.pick([20, 25, 40, 60, 75, 80, 90])], ([W, p]) => W * p % 100 === 0), a = W * p / 100;
      return num(`A tank holds ${a} ${U.vol} of water. It is ${p}% full. How many ${U.vol} does it hold when full?`, W, `${a} is ${p}% of the full tank: ${a} ÷ ${fmt(p / 100)} = ${W} ${U.vol}.`);
    } },
  } });

  /* ================= III.3.05 Find the percent ================= */
  E3.skill({ id: 'III.3.05', name: 'Find the percent', steps: {
    a: { t: '6 is what % of 24', g: R => {
      const p = R.pick([10, 20, 25, 50, 75, 5, 40, 60, 80, 30, 70, 90]), step = 100 / gcd(p, 100), W = step * R.int(1, Math.max(2, Math.floor(200 / step))), a = W * p / 100;
      if (R.bool(0.65)) return num(`${a} is what percent of ${W}?`, p, `Divide by the whole (the number after “of”): ${a} ÷ ${W} = ${fmt(p / 100)} = ${p}%.`);
      return choice(R, `${a} is what percent of ${W}?`, pc(p), [pc(r1(W / a * 100)), pc(a), pc(W - a), pc(a / W)], `${a} ÷ ${W} = ${fmt(p / 100)} = ${p}%. Divide by ${W}, the whole after “of”.`);
    } },
    b: { t: 'with tables', g: R => {
      const [W, a] = find(() => { const W = R.pick([4, 5, 10, 20, 25, 50, 200, 300, 400, 500]); return [W, R.int(1, W - 1)]; }, ([W, a]) => a * 100 % W === 0 && a * 100 / W !== 50);
      const k = 100 / W;
      return num(`${a} out of ${W} is what percent? Use the table.`, a * 100 / W, `${k >= 1 ? `Multiply both by ${fmt(k)}` : `Divide both by ${fmt(1 / k)}`} to make the whole 100: ${a} → ${fmt(a * k)}. So ${fmt(a * k)}%.`,
        { visual: V3.table([['Part', a, '?'], ['Whole', W, 100]]) });
    } },
    c: { t: 'with equations', g: R => {
      const p = R.int(2, 98), step = 100 / gcd(p, 100), W = mult(R, step, 400), a = W * p / 100;
      if (R.bool(0.55)) return num(`Solve ${fmt(a)} = ${fh('<i>p</i>', 100)} × ${W} to find the percent <i>p</i>.`, [{ label: 'p =', ans: p }], `${fmt(a)} ÷ ${W} = ${fmt(p / 100)}, and × 100 gives <i>p</i> = ${p}.`);
      return choice(R, `Which calculation finds what percent ${fmt(a)} is of ${W}?`, `${fmt(a)} ÷ ${W} × 100`, [`${W} ÷ ${fmt(a)} × 100`, `${fmt(a)} × ${W} ÷ 100`, `${fmt(a)} ÷ 100 × ${W}`], `Part ÷ whole, then × 100: ${fmt(a)} ÷ ${W} × 100 = ${p}%.`);
    } },
    d: { t: 'word problems', g: (R, O) => {
      const kind = R.int(0, 3);
      if (kind === 0) { const [W, a] = find(() => { const W = R.pick([20, 25, 40, 50, 16, 32, 24]); return [W, R.int(2, W - 1)]; }, ([W, a]) => a * 100 % W === 0);
        return num(`A team won ${a} of its ${W} games. What percent of its games did it win?`, a * 100 / W, `${a} ÷ ${W} = ${fmt(a / W)} = ${pc(a * 100 / W)}.`); }
      if (kind === 1) { const [W, a] = find(() => { const W = R.pick([20, 25, 40, 50]); return [W, R.int(Math.ceil(W / 2), W - 1)]; }, ([W, a]) => a * 100 % W === 0);
        return num(`You got ${a} out of ${W} questions right. What is your score as a percent?`, a * 100 / W, `${a} ÷ ${W} = ${fmt(a / W)} = ${pc(a * 100 / W)}.`); }
      if (kind === 2) { const D = R.int(4, 30) * 4 * sc(O), p = R.pick([10, 20, 25, 30, 40, 50, 75]), off = D * p / 100;
        return num(`A ${M(D * 100, O)} jacket is marked down by ${M(off * 100, O)}. What percent is the markdown?`, p, `Compare with the original price: ${fmt(off)} ÷ ${fmt(D)} = ${fmt(p / 100)} = ${p}%.`); }
      const [W, a] = find(() => { const W = R.pick([20, 40, 50, 80, 200]); return [W, R.int(2, W - 2)]; }, ([W, a]) => a * 100 % W === 0), U = O.units === 'imperial' ? 'ft²' : 'm²';
      return num(`A garden is ${W} ${U}. Carrots take up ${a} ${U}. What percent of the garden is carrots?`, a * 100 / W, `${a} ÷ ${W} = ${fmt(a / W)} = ${pc(a * 100 / W)}.`);
    } },
  } });

  /* ================= III.3.06 Over 100% and under 1% ================= */
  E3.skill({ id: 'III.3.06', name: 'Over 100% and under 1%', steps: {
    a: { t: '150%', g: R => {
      const p = R.pick([110, 120, 125, 130, 140, 150, 160, 175, 180, 200, 225, 250, 300]), kind = R.int(0, 2);
      if (kind === 0) { const step = 100 / gcd(p, 100), x = step * R.int(1, Math.max(2, Math.floor(200 / step))), a = p * x / 100;
        return num(`Find ${p}% of ${x}.`, a, `${p}% = ${fmt(p / 100)}, so ${fmt(p / 100)} × ${x} = ${fmt(a)}. More than 100% gives more than ${x}.`); }
      if (kind === 1) return num(`Write ${p}% as a decimal.`, p / 100, `Divide by 100: ${p}% = ${fmt(p / 100)}.`);
      const step = 100 / gcd(p, 100), W = step * R.int(1, Math.max(2, Math.floor(120 / step))), a = W * p / 100;
      return num(`${a} is what percent of ${W}?`, p, `${a} ÷ ${W} = ${fmt(p / 100)} = ${p}%. The part is bigger than the whole, so it's over 100%.`);
    } },
    b: { t: '0.5%', g: R => {
      const pt = R.int(1, 9), p = pt / 10, kind = R.int(0, 2);
      if (kind === 0) { const x = R.int(1, 30) * 100, a = pt * x / 1000;
        return num(`Find ${pc(p)} of ${fmt(x)}.`, a, `1% of ${fmt(x)} is ${fmt(x / 100)}, so ${pc(p)} is ${fmt(p)} × ${fmt(x / 100)} = ${fmt(a)}.`); }
      if (kind === 1) return num(`Write ${pc(p)} as a decimal.`, pt / 1000, `Divide by 100: ${pc(p)} = ${fmt(pt / 1000)}.`);
      const x = R.int(1, 9) * 200, a = pt * x / 1000;
      return choice(R, `What is ${pc(p)} of ${fmt(x)}?`, fmt(a), [fmt(p * x), fmt(a * 10), fmt(a * 100)], `${pc(p)} is less than 1%. 1% of ${fmt(x)} is ${fmt(x / 100)}, so ${pc(p)} is ${fmt(a)}.`);
    } },
    c: { t: 'what they mean', g: R => {
      const kind = R.int(0, 2);
      if (kind === 0) { const p = R.pick([0.5, 0.2, 50, 90, 99, 100, 101, 120, 150, 250]), N = R.int(2, 90) * 10, k = p > 100 ? 0 : p < 100 ? 1 : 2;
        return choiceFixed(`${pc(p)} of ${N} is …`, [`more than ${N}`, `less than ${N}`, `exactly ${N}`], k, `100% of ${N} is ${N}. ${pc(p)} is ${p > 100 ? 'more' : p < 100 ? 'less' : 'exactly that'}${p === 100 ? '' : ' than 100%'}, so the result is ${['more than', 'less than', 'exactly'][k]} ${N}.`); }
      if (kind === 1) { const p = R.pick([120, 150, 175, 200, 250, 300, 400]);
        return choice(R, `Finding ${p}% of an amount means …`, `multiplying it by ${fmt(p / 100)}`, [`multiplying it by ${p}`, `adding ${p} to it`, `dividing it by ${fmt(p / 100)}`], `${p}% = ${fh(p, 100)} = ${fmt(p / 100)}, so you multiply by ${fmt(p / 100)}.`); }
      const pt = R.int(1, 9);
      return choice(R, `Which decimal equals ${pc(pt / 10)}?`, fmt(pt / 1000), [fmt(pt / 10), fmt(pt / 100), String(pt)], `${pc(pt / 10)} is a part of one percent: ${fmt(pt / 10)} ÷ 100 = ${fmt(pt / 1000)}.`);
    } },
    d: { t: 'in context', g: (R, O) => {
      const kind = R.int(0, 2);
      if (kind === 0) { const p = R.pick([110, 120, 125, 150, 175, 200, 250]), step = 100 / gcd(p, 100), N = find(() => R.int(10, 90) * 100, N => N % step === 0);
        return num(`A town had ${fmt(N)} people. Now it has ${p}% as many. How many people live there now?`, N * p / 100, `${fmt(p / 100)} × ${fmt(N)} = ${fmt(N * p / 100)}.`); }
      if (kind === 1) { const pt = R.int(1, 9), D = R.int(10, 200) * 10 * sc(O), c = D * pt / 10; // cents
        return num(`A bank pays ${pc(pt / 10)} interest a year. How much interest does ${M(D * 100, O)} earn in 1 year?`, [MF(c, O)], `${pc(pt / 10)} = ${fmt(pt / 1000)}, and ${fmt(pt / 1000)} × ${fmt(D)} = ${MX(c / 100, O)}.`); }
      const p = R.pick([120, 150, 180, 200, 250, 300]), last = find(() => R.int(12, 90) * 10, n => n * p % 100 === 0);
      return num(`A shop sold ${last} bikes last year. This year it sold ${p}% of last year's number. How many bikes this year?`, last * p / 100, `${p}% = ${fmt(p / 100)}: ${fmt(p / 100)} × ${last} = ${last * p / 100}.`);
    } },
  } });

  /* ================= III.3.07 Percent increase ================= */
  E3.skill({ id: 'III.3.07', name: 'Percent increase', steps: {
    a: { t: 'the new amount', g: (R, O) => {
      if (R.bool()) { const D = R.int(8, 150) * sc(O), p = R.int(2, 12) * 5;
        return num(`A price of ${M(D * 100, O)} goes up by ${p}%. What is the new price?`, [MF(D * (100 + p), O)], `${p}% of ${fmt(D)} is ${fmt(D * p / 100)}. Add it: ${fmt(D)} + ${fmt(D * p / 100)} = ${MX(D * (100 + p) / 100, O)}.`); }
      const p = R.pick([10, 20, 25, 30, 40, 50, 5, 15]), step = 100 / gcd(p, 100), x = step * R.int(2, Math.floor(400 / step));
      return num(`A plant is ${x} mm tall. It grows ${p}% taller. How tall is it now, in mm?`, x * (100 + p) / 100, `${p}% of ${x} is ${x * p / 100}; ${x} + ${x * p / 100} = ${x * (100 + p) / 100} mm.`);
    } },
    b: { t: 'multiply by 1.x', g: R => {
      const p = R.int(1, 60), f = (100 + p) / 100, kind = R.int(0, 2);
      if (kind === 0) return num(`To increase an amount by ${p}%, multiply it by what number?`, f, `Keep the 100% and add ${p}%: 100% + ${p}% = ${100 + p}% = ${fmt(f)}.`);
      if (kind === 1) return choice(R, `Which single multiplication increases <i>x</i> by ${p}%?`, `${fmt(f)} × <i>x</i>`, [`${fmt(p / 100)} × <i>x</i>`, `${fmt((100 - p) / 100)} × <i>x</i>`, `${p} × <i>x</i>`], `The new amount is ${100 + p}% of the old one, and ${100 + p}% = ${fmt(f)}.`);
      const x = R.int(2, 40) * 10;
      return num(`Increase ${x} by ${p}% with one multiplication. What is the result?`, x * (100 + p) / 100, `${x} × ${fmt(f)} = ${fmt(x * (100 + p) / 100)}.`);
    } },
    c: { t: 'find the percent increase', g: R => {
      const p = R.pick([5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 80, 100, 150]), step = 100 / gcd(p, 100), old = step * R.int(1, Math.max(2, Math.floor(300 / step))), nw = old * (100 + p) / 100;
      if (R.bool(0.65)) return num(`An amount rises from ${old} to ${nw}. What is the percent increase?`, p, `The change is ${nw - old}. Compare it with the original: ${nw - old} ÷ ${old} = ${fmt(p / 100)} = ${p}%.`);
      return choice(R, `An amount rises from ${old} to ${nw}. What is the percent increase?`, pc(p), [pc(r1((nw - old) / nw * 100)), pc(nw - old), pc(r1(nw / old * 100))], `Divide the change by the original amount: ${nw - old} ÷ ${old} = ${p}%, not ÷ ${nw}.`);
    } },
    d: { t: 'word problems', g: (R, O) => {
      const kind = R.int(0, 2);
      if (kind === 0) { const p = R.pick([2, 4, 5, 6, 8, 10, 12, 15]), old = R.int(4, 30) * 50 * sc(O), nw = old * (100 + p) / 100;
        return num(`Rent rose from ${M(old * 100, O)} to ${M(nw * 100, O)} a month. What was the percent increase?`, p, `Change: ${fmt(nw - old)}. ${fmt(nw - old)} ÷ ${fmt(old)} = ${fmt(p / 100)} = ${p}%.`); }
      if (kind === 1) { const [a, b] = find(() => [R.int(12, 40), R.int(13, 50)], ([a, b]) => b > a && (b - a) * 100 % a === 0);
        return num(`A club grew from ${a} members to ${b}. What was the percent increase?`, (b - a) * 100 / a, `${b - a} more members. ${b - a} ÷ ${a} = ${fmt((b - a) / a)} = ${pc((b - a) * 100 / a)}.`); }
      const D = R.int(10, 90) * sc(O), p = R.pick([4, 6, 8, 12, 15, 18, 20, 35]);
      return num(`A ticket costs ${M(D * 100, O)}. Next year it will cost ${p}% more. What will it cost?`, [MF(D * (100 + p), O)], `${fmt(D)} × ${fmt((100 + p) / 100)} = ${MX(D * (100 + p) / 100, O)}.`);
    } },
  } });

  /* ================= III.3.08 Percent decrease ================= */
  E3.skill({ id: 'III.3.08', name: 'Percent decrease', steps: {
    a: { t: 'the new amount', g: (R, O) => {
      if (R.bool()) { const D = R.int(8, 150) * sc(O), p = R.int(1, 12) * 5;
        return num(`A price of ${M(D * 100, O)} goes down by ${p}%. What is the new price?`, [MF(D * (100 - p), O)], `${p}% of ${fmt(D)} is ${fmt(D * p / 100)}. Subtract: ${fmt(D)} − ${fmt(D * p / 100)} = ${MX(D * (100 - p) / 100, O)}.`); }
      const p = R.pick([10, 20, 25, 30, 40, 50, 5, 15]), step = 100 / gcd(p, 100), x = step * R.int(2, Math.floor(400 / step));
      return num(`A crowd of ${x} people shrinks by ${p}%. How many people are left?`, x * (100 - p) / 100, `${p}% of ${x} is ${x * p / 100}; ${x} − ${x * p / 100} = ${x * (100 - p) / 100}.`);
    } },
    b: { t: 'multiply by 0.x', g: R => {
      const p = R.int(1, 90), f = (100 - p) / 100, kind = R.int(0, 2);
      if (kind === 0) return num(`To decrease an amount by ${p}%, multiply it by what number?`, f, `${100 - p}% is left after ${/^8|^1[18]$/.test(String(p)) ? 'an' : 'a'} ${p}% drop, and ${100 - p}% = ${fmt(f)}.`);
      if (kind === 1) return choice(R, `Which single multiplication decreases <i>x</i> by ${p}%?`, `${fmt(f)} × <i>x</i>`, [`${fmt(p / 100)} × <i>x</i>`, `${fmt((100 + p) / 100)} × <i>x</i>`, `−${p} × <i>x</i>`], `${fmt(p / 100)} is what's lost; ${fmt(f)} is what's left, so multiply by ${fmt(f)}.`);
      const x = R.int(2, 40) * 10;
      return num(`Decrease ${x} by ${p}% with one multiplication. What is the result?`, x * (100 - p) / 100, `${100 - p}% is left: ${x} × ${fmt(f)} = ${fmt(x * (100 - p) / 100)}.`);
    } },
    c: { t: 'find the percent decrease', g: R => {
      const p = R.pick([5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 80, 90]), step = 100 / gcd(p, 100), old = step * R.int(1, Math.max(2, Math.floor(300 / step))), nw = old * (100 - p) / 100;
      if (R.bool(0.65)) return num(`An amount falls from ${old} to ${nw}. What is the percent decrease?`, p, `The drop is ${old - nw}. Compare with the start: ${old - nw} ÷ ${old} = ${fmt(p / 100)} = ${p}%.`);
      return choice(R, `An amount falls from ${old} to ${nw}. What is the percent decrease?`, pc(p), [pc(r1((old - nw) / nw * 100)), pc(old - nw), pc(100 - p)], `Divide the drop by the starting amount: ${old - nw} ÷ ${old} = ${p}%.`);
    } },
    d: { t: 'word problems', g: (R, O) => {
      const kind = R.int(0, 2), U = unitsL(O);
      if (kind === 0) { const p = R.pick([10, 15, 20, 25, 30, 40]), old = R.int(4, 40) * 20 * sc(O), nw = old * (100 - p) / 100;
        return num(`A phone's price fell from ${M(old * 100, O)} to ${M(nw * 100, O)}. What was the percent decrease?`, p, `Drop: ${fmt(old - nw)}. ${fmt(old - nw)} ÷ ${fmt(old)} = ${fmt(p / 100)} = ${p}%.`); }
      if (kind === 1) { const [a, b] = find(() => [R.int(20, 80), R.int(5, 70)], ([a, b]) => b < a && (a - b) * 100 % a === 0);
        return num(`A class had ${a} books. Now it has ${b}. What was the percent decrease?`, (a - b) * 100 / a, `${a - b} fewer. ${a - b} ÷ ${a} = ${fmt((a - b) / a)} = ${pc((a - b) * 100 / a)}.`); }
      const p = R.pick([5, 10, 12, 15, 20, 25]), step = 100 / gcd(p, 100), x = step * R.int(1, Math.max(2, Math.floor(200 / step)));
      return num(`A sack holds ${x} ${U.mass} of rice. ${p}% of it is used. How many ${U.mass} are left?`, x * (100 - p) / 100, `${100 - p}% is left: ${x} × ${fmt((100 - p) / 100)} = ${fmt(x * (100 - p) / 100)} ${U.mass}.`);
    } },
  } });

  /* ================= III.3.09 Discounts and sale prices ================= */
  const ITEMS = ['jacket', 'pair of shoes', 'backpack', 'lamp', 'game', 'bike helmet', 'watch', 'tent'];
  E3.skill({ id: 'III.3.09', name: 'Discounts and sale prices', steps: {
    a: { t: '% off', g: (R, O) => {
      const D = R.int(8, 120) * sc(O), p = R.pick([10, 15, 20, 25, 30, 40, 50, 60, 70, 75]), it = R.pick(ITEMS);
      return num(`A ${M(D * 100, O)} ${it} is ${p}% off. How much money is taken off?`, [MF(D * p, O)], `${p}% of ${fmt(D)} = ${fmt(p / 100)} × ${fmt(D)} = ${MX(D * p / 100, O)}.`);
    } },
    b: { t: 'the sale price', g: (R, O) => {
      const D = R.int(8, 120) * sc(O), p = R.pick([10, 15, 20, 25, 30, 40, 50, 60, 75]), it = R.pick(ITEMS);
      if (R.bool(0.65)) return num(`A ${M(D * 100, O)} ${it} is ${p}% off. What is the sale price?`, [MF(D * (100 - p), O)], `You pay ${100 - p}%: ${fmt(D)} × ${fmt((100 - p) / 100)} = ${MX(D * (100 - p) / 100, O)}.`);
      return choice(R, `A ${M(D * 100, O)} ${it} is ${p}% off. What is the sale price?`, M(D * (100 - p), O), [M(D * p, O), M(D * 100 - p * 100, O), M(D * (100 + p), O)], `${p}% of ${fmt(D)} is ${fmt(D * p / 100)} off, so you pay ${fmt(D)} − ${fmt(D * p / 100)} = ${M(D * (100 - p), O)}.`);
    } },
    c: { t: 'discount on a discount', g: (R, O) => {
      const p = R.pick([10, 20, 25, 30, 40, 50]), q = R.pick([10, 20, 25, 50].filter(x => x !== p || x === 10)), left = (100 - p) * (100 - q) / 100;
      if (R.bool(0.5)) { const D = find(() => R.int(4, 60) * 4 * sc(O), D => D * (100 - p) * (100 - q) % 100 === 0);
        return num(`A ${M(D * 100, O)} item is ${p}% off. Then you get another ${q}% off the sale price. What do you pay?`, [MF(D * (100 - p) * (100 - q) / 100, O)], `${fmt(D)} × ${fmt((100 - p) / 100)} × ${fmt((100 - q) / 100)} = ${MX(D * left / 100, O)}.`); }
      return choice(R, `${p}% off, then another ${q}% off the new price. What is the total discount?`, pc(100 - left), [pc(p + q), pc(left), pc(Math.abs(p - q) || p * 2 + 5)], `You pay ${fmt((100 - p) / 100)} × ${fmt((100 - q) / 100)} = ${fmt(left / 100)} = ${pc(left)} of the price, so ${pc(100 - left)} off, not ${p + q}%.`);
    } },
    d: { t: 'compare deals', g: (R, O) => {
      if (R.bool()) { const D = R.int(4, 30) * 10 * sc(O), p = R.pick([10, 15, 20, 25, 30, 40]), k = find(() => 5 * sc(O) * R.int(1, D / 10 / sc(O)), k => k * 100 !== D * p);
        const a = D * (100 - p), b = (D - k) * 100, ans = a < b ? 0 : 1;
        return choiceFixed(`A ${M(D * 100, O)} coat. Deal A: ${p}% off. Deal B: ${M(k * 100, O)} off. Which is cheaper?`, ['Deal A', 'Deal B', 'They cost the same'], ans, `A: ${fmt(D)} × ${fmt((100 - p) / 100)} = ${M(a, O)}. B: ${fmt(D)} − ${fmt(k)} = ${M(b, O)}.`); }
      const [D1, p1, D2, p2] = find(() => [R.int(4, 20) * 5 * sc(O), R.pick([10, 20, 25, 30, 40, 50]), R.int(4, 20) * 5 * sc(O), R.pick([10, 20, 25, 30, 40, 50])], ([D1, p1, D2, p2]) => D1 !== D2 && p1 !== p2 && (D1 - D2) * (p1 - p2) > 0 && D1 * (100 - p1) !== D2 * (100 - p2));
      const a = D1 * (100 - p1), b = D2 * (100 - p2);
      return choiceFixed(`Shop A: ${M(D1 * 100, O)}, ${p1}% off. Shop B: ${M(D2 * 100, O)}, ${p2}% off. Which sale price is lower?`, ['Shop A', 'Shop B', 'They cost the same'], a < b ? 0 : 1, `A: ${fmt(D1)} × ${fmt((100 - p1) / 100)} = ${M(a, O)}. B: ${fmt(D2)} × ${fmt((100 - p2) / 100)} = ${M(b, O)}.`);
    } },
  } });

  /* ================= III.3.10 Tax and tips ================= */
  const TAXES = O => O.coins === 'THB' ? [7] : [4, 5, 6, 7, 8, 9, 10];
  E3.skill({ id: 'III.3.10', name: 'Tax and tips', steps: {
    a: { t: 'sales tax', g: (R, O) => {
      const D = R.int(5, 200) * sc(O), r = R.pick(TAXES(O)), t = D * r;
      if (R.bool(0.6)) return num(`An item costs ${M(D * 100, O)}. Sales tax is ${r}%. How much is the tax?`, [MF(t, O)], `${r}% of ${fmt(D)} = ${fmt(r / 100)} × ${fmt(D)} = ${MX(t / 100, O)}.`);
      return choice(R, `An item costs ${M(D * 100, O)}. Sales tax is ${r}%. What is the total?`, M(D * 100 + t, O), [M(D * 100 + r, O), M(t, O), M(D * 100 + r * 100, O)], `Tax is ${r}% of ${fmt(D)} = ${fmt(t / 100)}. Total: ${fmt(D)} + ${fmt(t / 100)} = ${M(D * 100 + t, O)}.`);
    } },
    b: { t: 'tips', g: (R, O) => {
      const D = R.int(12, 150) * sc(O), p = R.pick([10, 15, 18, 20, 12]);
      return num(`A meal costs ${M(D * 100, O)}. You leave ${/^8|^1[18]$/.test(String(p)) ? 'an' : 'a'} ${p}% tip. How much is the tip?`, [MF(D * p, O)], `${p}% of ${fmt(D)} = ${fmt(p / 100)} × ${fmt(D)} = ${MX(D * p / 100, O)}.`);
    } },
    c: { t: 'total cost', g: (R, O) => {
      const kind = R.int(0, 2), D = R.int(10, 120) * sc(O);
      if (kind === 0) { const r = R.pick(TAXES(O));
        return num(`A ${M(D * 100, O)} item has ${r}% sales tax. What is the total cost?`, [MF(D * (100 + r), O)], `${fmt(D)} × ${fmt((100 + r) / 100)} = ${MX(D * (100 + r) / 100, O)}.`); }
      if (kind === 1) { const p = R.pick([10, 15, 18, 20]);
        return num(`A meal costs ${M(D * 100, O)}. With ${/^8|^1[18]$/.test(String(p)) ? 'an' : 'a'} ${p}% tip, what is the total?`, [MF(D * (100 + p), O)], `Tip: ${fmt(D * p / 100)}. Total: ${fmt(D)} × ${fmt((100 + p) / 100)} = ${MX(D * (100 + p) / 100, O)}.`); }
      const r = R.pick(TAXES(O)), p = R.pick([10, 15, 20]);
      return num(`A meal costs ${M(D * 100, O)}. Add ${r}% tax and ${/^8|^1[18]$/.test(String(p)) ? 'an' : 'a'} ${p}% tip on the ${M(D * 100, O)}. What is the total?`, [MF(D * (100 + r + p), O)], `Tax ${fmt(D * r / 100)} + tip ${fmt(D * p / 100)}. Total: ${fmt(D)} × ${fmt((100 + r + p) / 100)} = ${MX(D * (100 + r + p) / 100, O)}.`);
    } },
    d: { t: 'mental estimates', g: (R, O) => {
      const p = R.pick([10, 15, 20]), bc = find(() => R.int(2100, 11900) * sc(O), c => c % 100 !== 0 && c % 100 !== 50), Rd = Math.round(bc / 100 / sc(O)) * sc(O), est = Rd * p / 100, e = Math.round(est);
      const how = p === 10 ? `10% of ${Rd} is ${fmt(Rd / 10)}` : p === 20 ? `10% of ${Rd} is ${fmt(Rd / 10)}; double it: ${fmt(Rd / 5)}` : `10% of ${Rd} is ${fmt(Rd / 10)}; add half of that: ${fmt(Rd * 0.15)}`;
      const ds = [Math.round(Rd / 10) === e ? Math.round(Rd / 5) + sc(O) : Math.round(Rd / 10), Math.round(e * 10), p * sc(O) === e ? e + 3 * sc(O) : p * sc(O)];
      return choice(R, `About how much is ${/^8|^1[18]$/.test(String(p)) ? 'an' : 'a'} ${p}% tip on ${M(bc, O)}?`, `about ${M(e * 100, O)}`, ds.map(v => `about ${M(v * 100, O)}`), `Round to ${fmt(Rd)}. ${how}, so about ${M(e * 100, O)}.`);
    } },
  } });

  /* ================= III.3.11 Markup and profit ================= */
  E3.skill({ id: 'III.3.11', name: 'Markup and profit', steps: {
    a: { t: 'markup', g: (R, O) => {
      const C0 = R.int(5, 150) * sc(O), m = R.pick([20, 25, 30, 40, 50, 60, 75, 80, 100]);
      return num(`A shop buys a toy for ${M(C0 * 100, O)} and adds ${/^8|^1[18]$/.test(String(m)) ? 'an' : 'a'} ${m}% markup. How much is the markup?`, [MF(C0 * m, O)], `Markup is ${m}% of the cost: ${fmt(m / 100)} × ${fmt(C0)} = ${MX(C0 * m / 100, O)}.`);
    } },
    b: { t: 'selling price', g: (R, O) => {
      const C0 = R.int(5, 150) * sc(O), m = R.pick([20, 25, 30, 40, 50, 60, 75, 80, 100]);
      if (R.bool(0.7)) return num(`A shop buys a lamp for ${M(C0 * 100, O)}. The markup is ${m}%. What is the selling price?`, [MF(C0 * (100 + m), O)], `${fmt(C0)} × ${fmt((100 + m) / 100)} = ${MX(C0 * (100 + m) / 100, O)}.`);
      return choice(R, `Cost ${M(C0 * 100, O)}, markup ${m}%. What is the selling price?`, M(C0 * (100 + m), O), [M(C0 * m, O), M(C0 * 100 + m * 100, O), M(C0 * (100 - m), O)], `Selling price = cost × ${fmt((100 + m) / 100)} = ${M(C0 * (100 + m), O)}.`);
    } },
    c: { t: 'profit percent', g: (R, O) => {
      const m = R.pick([10, 20, 25, 30, 40, 50, 60, 75, 80, 100]), step = 100 / gcd(m, 100), C0 = step * R.int(1, Math.max(2, Math.floor(120 / step))) * sc(O), P = C0 * (100 + m) / 100;
      if (R.bool(0.6)) return num(`A shop buys a chair for ${M(C0 * 100, O)} and sells it for ${M(P * 100, O)}. What is the profit as a percent of the cost?`, m, `Profit: ${fmt(P - C0)}. ${fmt(P - C0)} ÷ ${fmt(C0)} = ${fmt(m / 100)} = ${m}%.`);
      return choice(R, `Cost ${M(C0 * 100, O)}, selling price ${M(P * 100, O)}. What is the profit as a percent of the cost?`, pc(m), [pc(r1((P - C0) / P * 100)), pc(r1(P / C0 * 100)), pc(P - C0)], `Divide the profit by the cost: ${fmt(P - C0)} ÷ ${fmt(C0)} = ${m}%. Dividing by the price gives the margin instead.`);
    } },
    d: { t: 'word problems', g: (R, O) => {
      const kind = R.int(0, 2);
      if (kind === 0) { const m = R.pick([20, 25, 40, 50, 60, 100]), d = R.pick([10, 20, 25, 30]), C0 = find(() => R.int(4, 60) * 2 * sc(O), c => c * (100 + m) * (100 - d) % 100 === 0);
        return num(`A shop buys shoes for ${M(C0 * 100, O)}, marks them up ${m}%, then sells them at ${d}% off. What is the sale price?`, [MF(C0 * (100 + m) * (100 - d) / 100, O)], `${fmt(C0)} × ${fmt((100 + m) / 100)} = ${fmt(C0 * (100 + m) / 100)}, then × ${fmt((100 - d) / 100)} = ${MX(C0 * (100 + m) * (100 - d) / 10000, O)}.`); }
      if (kind === 1) { const m = R.pick([10, 20, 25, 30, 40, 50]), loss = m * m / 100;
        return choice(R, `A shop marks an item up ${m}%, then sells it at ${m}% off. Compared with the cost, the shop …`, `loses ${pc(loss)}`, ['breaks even', `gains ${pc(loss)}`, `loses ${pc(m)}`], `${fmt((100 + m) / 100)} × ${fmt((100 - m) / 100)} = ${f4((10000 - m * m) / 10000)}: the price ends at ${pc(100 - loss)} of the cost.`); }
      const [C0, P] = find(() => [R.int(4, 40) * 5 * sc(O), R.int(5, 60) * 5 * sc(O)], ([c, p]) => p > c && (p - c) * 100 % p === 0), g = (P - C0) * 100 / P;
      return num(`A bakery sells a cake for ${M(P * 100, O)}. It costs ${M(C0 * 100, O)} to make. What is the profit as a percent of the <b>selling price</b>?`, g, `Profit ${fmt(P - C0)} ÷ price ${fmt(P)} = ${fmt(g / 100)} = ${pc(g)}.`);
    } },
  } });

  /* ================= III.3.12 Simple interest ================= */
  E3.skill({ id: 'III.3.12', name: 'Simple interest', steps: {
    a: { t: 'I = Prt', g: (R, O) => {
      const P = R.int(2, 50) * 100 * sc(O), r = R.int(2, 9), t = R.int(1, 6), I = P * r * t / 100;
      if (R.bool(0.7)) return num(`Find the simple interest on ${M(P * 100, O)} at ${r}% a year for ${E3.plural(t, 'year')}.`, [MF(I * 100, O)], `<i>I</i> = <i>Prt</i> = ${fmt(P)} × ${fmt(r / 100)} × ${t} = ${MX(I, O)}.`);
      return choice(R, `Simple interest on ${M(P * 100, O)} at ${r}% a year for ${E3.plural(t, 'year')} is …`, M(I * 100, O), [M(P * r * t * 100, O), M(P * r, O), M((P + I) * 100, O)], `Use the rate as a decimal: ${fmt(P)} × ${fmt(r / 100)} × ${t} = ${MX(I, O)}.`);
    } },
    b: { t: 'find the rate', g: (R, O) => {
      const P = R.int(2, 50) * 100 * sc(O), r = R.int(2, 12), t = R.int(1, 5), I = P * r * t / 100;
      return num(`${M(P * 100, O)} earns ${M(I * 100, O)} simple interest in ${E3.plural(t, 'year')}. What is the yearly rate, in percent?`, r, `<i>r</i> = <i>I</i> ÷ (<i>Pt</i>) = ${fmt(I)} ÷ (${fmt(P)} × ${t}) = ${fmt(r / 100)} = ${r}%.`);
    } },
    c: { t: 'find the time', g: (R, O) => {
      const P = R.int(2, 50) * 100 * sc(O), r = R.int(2, 10), t = R.int(2, 8), I = P * r * t / 100;
      return num(`${M(P * 100, O)} at ${r}% simple interest a year earns ${M(I * 100, O)}. How many years is that?`, t, `One year earns ${fmt(P)} × ${fmt(r / 100)} = ${fmt(P * r / 100)}. ${fmt(I)} ÷ ${fmt(P * r / 100)} = ${t} years.`);
    } },
    d: { t: 'the total amount', g: (R, O) => {
      const P = R.int(2, 50) * 100 * sc(O), r = R.int(2, 9);
      if (R.bool(0.6)) { const t = R.int(1, 6), I = P * r * t / 100;
        return num(`You put ${M(P * 100, O)} in a bank at ${r}% simple interest a year. How much is there after ${E3.plural(t, 'year')}?`, [MF((P + I) * 100, O)], `<i>I</i> = ${fmt(P)} × ${fmt(r / 100)} × ${t} = ${fmt(I)}. Total: ${fmt(P)} + ${fmt(I)} = ${MX(P + I, O)}.`); }
      const mo = R.pick([3, 6, 9, 18]), Ic = P * r * mo / 12; // cents
      if (R.bool(0.4)) return choice(R, `${M(P * 100, O)} earns ${r}% simple interest a year. What is the total after ${mo} months?`, M(P * 100 + Ic, O), [M(P * 100 + P * r * mo, O), M(Ic, O), M(P * 100 + P * r, O)], `Time must be in years: ${mo} months = ${fmt(mo / 12)} year. <i>I</i> = ${fmt(P)} × ${fmt(r / 100)} × ${fmt(mo / 12)} = ${fmt(Ic / 100)}, not ${fmt(P)} × ${fmt(r / 100)} × ${mo}.`);
      return num(`${M(P * 100, O)} earns ${r}% simple interest a year. What is the total after ${mo} months?`, [MF(P * 100 + Ic, O)], `${mo} months = ${fmt(mo / 12)} year. <i>I</i> = ${fmt(P)} × ${fmt(r / 100)} × ${fmt(mo / 12)} = ${fmt(Ic / 100)}. Total ${MX((P * 100 + Ic) / 100, O)}.`);
    } },
  } });

  /* ================= III.3.13 Percent error ================= */
  const NAMES = ['Ana', 'Ben', 'Kai', 'Mia', 'Noor', 'Leo', 'Sara', 'Tom'];
  E3.skill({ id: 'III.3.13', name: 'Percent error', steps: {
    a: { t: 'the error', g: (R, O) => {
      const U = unitsL(O);
      if (R.bool()) { const A = R.int(20, 200), e = R.int(1, 12) * (R.bool() ? 1 : -1), G = A + e;
        return num(`Sam guessed there were ${G} beans in a jar. There were ${A}. What is the error?`, Math.abs(e), `Error = the size of the difference: |${G} − ${A}| = ${Math.abs(e)}.`); }
      const At = R.int(50, 400), e = R.int(1, 15) * (R.bool() ? 1 : -1), Mt = At + e;
      return num(`A shelf is ${fmt(At / 10)} ${U.len} long. Jo measures ${fmt(Mt / 10)} ${U.len}. What is the error, in ${U.len}?`, Math.abs(e) / 10, `|${fmt(Mt / 10)} − ${fmt(At / 10)}| = ${fmt(Math.abs(e) / 10)} ${U.len}.`);
    } },
    b: { t: 'percent error', g: R => {
      const [A, p] = find(() => [R.pick([20, 25, 40, 50, 80, 100, 200, 250, 400, 500]), R.pick([1, 2, 4, 5, 10, 20, 25])], ([A, p]) => A * p % 100 === 0 && A * p / 100 < A / 2), e = A * p / 100, Mv = R.bool() ? A - e : A + e;
      if (R.bool(0.6)) return num(`The actual value is ${A}. A measurement gave ${Mv}. What is the percent error?`, p, `Error ${e}. Divide by the actual value: ${e} ÷ ${A} = ${fmt(p / 100)} = ${p}%.`);
      return choice(R, `Actual value ${A}, measured value ${Mv}. What is the percent error?`, pc(p), [pc(Math.round(e / Mv * 10000) / 100), pc(r1(Mv / A * 100)), pc(e), pc(r1(e / Mv * 100) + (r1(e / Mv * 100) === p ? 1 : 0))], `Divide the error by the <b>actual</b> value: ${e} ÷ ${A} = ${p}%.`);
    } },
    c: { t: 'in measurement', g: (R, O) => {
      const U = unitsL(O), [At, p] = find(() => [R.int(20, 300) * 2, R.pick([0.5, 1, 2, 2.5, 4, 5, 10])], ([At, p]) => Number.isInteger(At * p / 100) && At * p / 100 >= 1);
      const e = At * p / 100, Mt = R.bool() ? At - e : At + e, thing = R.pick(['board', 'rope', 'desk', 'pipe']);
      return num(`A ${thing} is really ${fmt(At / 10)} ${U.len} long. Lee measures it as ${fmt(Mt / 10)} ${U.len}. What is the percent error?`, p, `Error ${fmt(e / 10)} ${U.len}. ${fmt(e / 10)} ÷ ${fmt(At / 10)} = ${fmt(p / 100)} = ${pc(p)}.`);
    } },
    d: { t: 'compare accuracy', g: (R, O) => {
      const U = unitsL(O), [n1, n2] = R.sample(NAMES, 2);
      const [A1, e1, A2, e2] = find(() => [R.int(2, 20) * 10, R.int(1, 6), R.int(20, 90) * 10, R.int(2, 12)], ([A1, e1, A2, e2]) => e2 > e1 && Math.abs(e1 / A1 - e2 / A2) > 0.002);
      const p1 = e1 / A1 * 100, p2 = e2 / A2 * 100;
      return choiceFixed(`${n1} measures ${/^8|^1[18]$/.test(String(A1)) ? 'an' : 'a'} ${A1} ${U.big} track and is off by ${e1} ${U.big}. ${n2} measures ${/^8|^1[18]$/.test(String(A2)) ? 'an' : 'a'} ${A2} ${U.big} track and is off by ${e2} ${U.big}. Who is more accurate?`, [n1, n2, 'Equally accurate'], p1 < p2 ? 0 : 1,
        `Compare percent errors: ${n1} ${e1} ÷ ${A1} ${Math.abs(p1 * 100 - Math.round(p1 * 100)) < 1e-6 ? '=' : '≈'} ${pc(Math.round(p1 * 100) / 100)}, ${n2} ${e2} ÷ ${A2} ${Math.abs(p2 * 100 - Math.round(p2 * 100)) < 1e-6 ? '=' : '≈'} ${pc(Math.round(p2 * 100) / 100)}. The smaller percent error is more accurate.`);
    } },
  } });

  /* ================= III.3.14 Percent change traps ================= */
  E3.skill({ id: 'III.3.14', name: 'Percent change traps', steps: {
    a: { t: 'change vs percent change', g: (R, O) => {
      if (R.bool()) { const [a, b] = find(() => [R.pick([2, 4, 5, 8, 10, 20, 25]), R.int(3, 40)], ([a, b]) => b > a && b <= 3 * a && (b - a) * 100 % a === 0);
        return num(`A rate goes up from ${a}% to ${b}%. Give the rise in percentage points and as a percent increase.`, [{ label: 'points', ans: b - a }, { label: 'percent increase', ans: (b - a) * 100 / a }], `${b} − ${a} = ${b - a} points. As a percent of the old rate: ${b - a} ÷ ${a} = ${pc((b - a) * 100 / a)}.`); }
      const p = R.pick([10, 20, 25, 40, 50, 75]), step = 100 / gcd(p, 100), o = step * R.int(1, Math.max(2, Math.floor(80 / step))) * sc(O), n = o * (100 + p) / 100;
      return num(`A price goes from ${M(o * 100, O)} to ${M(n * 100, O)}. Give the change and the percent change.`, [{ label: O.coins === 'THB' ? 'change (baht)' : 'change ($)', ans: n - o }, { label: 'percent change', ans: p }], `The change is ${MX(n - o, O)}. The percent change compares it with the start: ${fmt(n - o)} ÷ ${fmt(o)} = ${p}%.`);
    } },
    b: { t: 'up 50% then down 50%', g: (R, O) => {
      const p = R.pick([10, 20, 25, 30, 40, 50]), up = R.bool(), f1 = up ? 100 + p : 100 - p, f2 = up ? 100 - p : 100 + p, loss = p * p / 100;
      if (R.bool(0.55)) { const S = find(() => R.int(1, 30) * 20 * sc(O), S => S * f1 % 100 === 0 && S * f1 * f2 % 10000 === 0), mid = S * f1 / 100, end = S * f1 * f2 / 10000;
        return num(`A price of ${M(S * 100, O)} goes ${up ? 'up' : 'down'} ${p}%, then ${up ? 'down' : 'up'} ${p}%. What is the final price?`, [MF(end * 100, O)], `${MX(S, O)} → ${MX(mid, O)} → ${MX(end, O)}. The second ${p}% is taken of ${MX(mid, O)}, not ${MX(S, O)}.`); }
      return choice(R, `An amount goes ${up ? 'up' : 'down'} ${p}%, then ${up ? 'down' : 'up'} ${p}%. Compared with the start, it ends …`, `${pc(loss)} lower`, ['the same', `${pc(loss)} higher`, `${p}% lower`], `${fmt(f1 / 100)} × ${fmt(f2 / 100)} = ${f4((10000 - p * p) / 10000)}, so it ends ${pc(loss)} lower.`);
    } },
    c: { t: 'combined changes', g: R => {
      const a = R.pick([10, 20, 30, 40, 50]), b = R.pick([10, 20, 25, 30, 50]), sa = R.pick([1, 1, -1]), sb = R.pick([1, -1, -1]);
      const fa = 100 + sa * a, fb = 100 + sb * b, tot = fa * fb / 100 - 100, w = s => s > 0 ? 'up' : 'down';
      return num(`An amount goes ${w(sa)} ${a}%, then ${w(sb)} ${b}%. What is the overall percent change? (Use a negative number for a decrease.)`, tot, `${fmt(fa / 100)} × ${fmt(fb / 100)} = ${fmt(fa * fb / 10000)}, so the change is ${tot < 0 ? '−' : '+'}${pc(Math.abs(tot))}, not ${sa * a + sb * b < 0 ? '−' : '+'}${Math.abs(sa * a + sb * b)}%.`);
    } },
    d: { t: 'misleading claims', g: (R, O) => {
      const kind = R.int(0, 4);
      if (kind === 0) { const p = R.pick([10, 20, 25, 40, 50]);
        if (R.bool()) return tf(`“Prices went up ${p}% last year and down ${p}% this year, so they are now lower than where they started.”`, true, `True. ${fmt((100 + p) / 100)} × ${fmt((100 - p) / 100)} = ${f4((10000 - p * p) / 10000)}: prices are ${pc(p * p / 100)} lower.`);
        return tf(`“Prices went up ${p}% last year and down ${p}% this year, so they're back where they started.”`, false, `False. ${fmt((100 + p) / 100)} × ${fmt((100 - p) / 100)} = ${f4((10000 - p * p) / 10000)}: prices are ${pc(p * p / 100)} lower.`); }
      if (kind === 1) { const p = R.pick([10, 20, 30, 40]), q = R.pick([10, 20, 25, 50]), left = (100 - p) * (100 - q) / 100;
        if (R.bool()) return tf(`“${p}% off, then ${q}% off the sale price, is less than ${p + q}% off.”`, true, `True. You pay ${fmt((100 - p) / 100)} × ${fmt((100 - q) / 100)} = ${pc(left)}, so it's only ${pc(100 - left)} off.`);
        return tf(`“${p}% off, then ${q}% off the sale price, is ${p + q}% off.”`, false, `False. You pay ${fmt((100 - p) / 100)} × ${fmt((100 - q) / 100)} = ${pc(left)}, so it's ${pc(100 - left)} off.`); }
      if (kind === 2) { const [a, b] = find(() => [R.int(2, 10), R.int(3, 16)], ([a, b]) => b > a && (b - a) * 100 % a === 0);
        if (R.bool()) return tf(`“A rate going from ${a}% to ${b}% rose by ${E3.plural(b - a, 'percentage point')}.”`, true, `True. ${b} − ${a} = ${b - a} percentage points, which is a ${pc((b - a) * 100 / a)} increase on the old rate.`);
        return tf(`“A rate going from ${a}% to ${b}% is a ${b - a}% increase.”`, false, `False. It rose ${E3.plural(b - a, 'percentage point')}, which is a ${pc((b - a) * 100 / a)} increase.`); }
      if (kind === 3) { const [k, word, pct, ok] = R.pick([[2, 'Doubling', 100, true], [2, 'Doubling', 200, false], [3, 'Tripling', 200, true], [3, 'Tripling', 300, false], [0.5, 'Halving', 50, true], [4, 'Multiplying by 4', 300, true], [4, 'Multiplying by 4', 400, false]]);
        const real = Math.abs(k - 1) * 100;
        return tf(`“${word} a price is a ${pct}% ${k > 1 ? 'increase' : 'decrease'}.”`, ok, `${ok ? 'True' : 'False'}. The change is ${k > 1 ? k - 1 : 0.5} times the old price, a ${real}% ${k > 1 ? 'increase' : 'decrease'}.`); }
      const p = R.pick([10, 20, 25, 40, 50]), o = R.int(2, 20) * 20 * sc(O), n = o * (100 - p) / 100, right = R.bool(), shown = right ? p : r1((o - n) / n * 100);
      return tf(`“The price was cut from ${M(o * 100, O)} to ${M(n * 100, O)}. That's a ${pc(shown)} cut.”`, right, `${right ? 'True' : 'False'}. The cut is ${fmt(o - n)}, and ${fmt(o - n)} ÷ ${fmt(o)} = ${p}%. Compare with the original price.`);
    } },
  } });

  /* ================= III.3.15 Percent in data ================= */
  const COLORS = ['Red', 'Blue', 'Green', 'Yellow'], SPORTS = ['Soccer', 'Swim', 'Tennis', 'Chess'];
  const CCOL = { Red: C.red, Blue: C.blue, Green: C.teal, Yellow: C.amber };
  // split total T into k distinct parts (each a multiple of u, at least u) by random cuts
  const split = (R, T, k, u) => find(() => { const cuts = R.distinct(1, T / u - 1, k - 1).sort((x, y) => x - y).map(c => c * u), pts = [0, ...cuts, T]; return pts.slice(1).map((v, j) => v - pts[j]); }, v => new Set(v).size === k);
  const labsOf = R => R.bool() ? COLORS : SPORTS;
  const pieOf = (ps, labs, hide) => V3.pie(ps.map((p, j) => ({ p, label: labs[j], color: CCOL[labs[j]], show: hide === 'all' ? '' : j === hide ? '?' : p + '%' })));
  E3.skill({ id: 'III.3.15', name: 'Percent in data', steps: {
    a: { t: 'survey results', g: R => {
      const T = R.pick([20, 25, 40, 50, 200]), k = R.int(3, 4), labs = labsOf(R), v = split(R, T, k, T === 200 ? 2 : 1);
      const i = R.int(0, k - 1), p = v[i] * 100 / T;
      return num(`${T} students chose a favorite. What percent chose <b>${labs[i]}</b>?`, p, `${v[i]} of ${T}: ${v[i]} ÷ ${T} = ${fmt(p / 100)} = ${pc(p)}.`, { visual: V3.bars(v.map((x, j) => ({ label: labs[j], v: x, color: CCOL[labs[j]] }))) });
    } },
    b: { t: 'pie charts', g: R => {
      const labs = labsOf(R), k = R.int(3, 4), ps = split(R, 100, k, 5), i = R.int(0, k - 1), kind = R.int(0, 2);
      if (kind === 0) return num(`What percent of the pie is <b>${labs[i]}</b>?`, ps[i], `All the slices add to 100%: 100 − ${ps.filter((_, j) => j !== i).join(' − ')} = ${ps[i]}%.`, { visual: pieOf(ps, labs, i) });
      if (kind === 1) return num(`How many degrees is the <b>${labs[i]}</b> slice?`, ps[i] * 36 / 10, `${ps[i]}% of 360° = ${fmt(ps[i] / 100)} × 360 = ${fmt(ps[i] * 36 / 10)}°.`, { visual: pieOf(ps, labs, -1) });
      return num(`The <b>${labs[i]}</b> slice is ${fmt(ps[i] * 36 / 10)}°. What percent of the pie is it?`, ps[i], `${fmt(ps[i] * 36 / 10)} ÷ 360 = ${fmt(ps[i] / 100)} = ${ps[i]}%.`, { visual: pieOf(ps, labs, 'all') });
    } },
    c: { t: 'percent of a total', g: R => {
      const labs = labsOf(R), N = R.pick([20, 40, 60, 80, 120, 200, 300, 400]), ps = split(R, 100, 3, 5), i = R.int(0, 2), n = N * ps[i] / 100;
      return choice(R, `${N} people answered a survey. How many chose <b>${labs[i]}</b>?`, String(n), [String(ps[i]), String(N - n), String(n * 2)], `${ps[i]}% of ${N} = ${fmt(ps[i] / 100)} × ${N} = ${n} people. The ${ps[i]}% is a share, not a count.`,
        { visual: pieOf(ps, labs, -1) });
    } },
    d: { t: 'compare groups', g: R => {
      const trap = R.bool(0.7), [a, A, b, B] = find(() => { const A = R.pick([20, 25, 40, 50, 80, 100, 200]), B = R.pick([20, 25, 40, 50, 80, 100, 200]); return [R.int(2, A - 2), A, R.int(2, B - 2), B]; },
        ([a, A, b, B]) => A !== B && a * 100 % A === 0 && b * 100 % B === 0 && a !== b && (trap ? (a - b) * (a / A - b / B) < 0 : (a - b) * (a / A - b / B) > 0) && Math.abs(a / A - b / B) >= 0.02);
      const pa = a * 100 / A, pb = b * 100 / B;
      return choiceFixed(`School A: ${a} of ${A} students walk. School B: ${b} of ${B} students walk. Which school has the greater <b>share</b> of walkers?`, ['School A', 'School B', 'Same share'], pa > pb ? 0 : 1, `A: ${a} ÷ ${A} = ${pc(pa)}. B: ${b} ÷ ${B} = ${pc(pb)}.${trap ? ' A bigger count isn\'t a bigger share.' : ' Compare the percents, not the counts.'}`);
    } },
  } });

  /* ================= III.3.16 Estimating with percents ================= */
  const about = v => `about ${fmt(v)}`;
  E3.skill({ id: 'III.3.16', name: 'Estimating with percents', steps: {
    a: { t: 'round the base', g: R => {
      const p = R.pick([10, 20, 25, 50, 5]), base = R.int(2, 9) * 100, x = base + R.pick([-3, -2, -1, 1, 2, 3, 4]) * (R.bool() ? 1 : 3), est = base * p / 100;
      return choice(R, `Which is the best estimate of ${p}% of ${x}?`, about(est), [about(est * 10), about(est / 10), about(base - est)], `${x} is close to ${base}, and ${p}% of ${base} = ${fmt(est)}.`);
    } },
    b: { t: 'benchmark percents', g: R => {
      const [p, n, d] = R.pick([[26, 1, 4], [24, 1, 4], [49, 1, 2], [51, 1, 2], [33, 1, 3], [34, 1, 3], [74, 3, 4], [76, 3, 4], [19, 1, 5], [21, 1, 5], [11, 1, 10], [9, 1, 10], [67, 2, 3], [66, 2, 3]]);
      const base = d * R.int(4, 30), x = base + R.pick(d >= 5 ? [-2, -1, 1, 2] : [-1, 1]), est = base * n / d;   // x is never itself a multiple of d, and base is its nearest one
      return choice(R, `${p}% of ${x} is about …`, String(est), [String(Math.abs(p - est) >= 3 ? p : Math.round(est / 2)), String(Math.round(x * p / 10)), String(est * 2)], `${p}% is close to ${fh(n, d)}, and ${fh(n, d)} of ${base} = ${est}.`);
    } },
    c: { t: 'check reasonableness', g: R => {
      const p = R.int(11, 89), xt = R.int(1000, 9999), ex = p * xt / 1000; // x has 1 decimal
      return choice(R, `Which answer is reasonable for ${p}% of ${fmt(xt / 10)}?`, fmt(ex), [fmt(ex * 10), fmt(p * xt / 10000), fmt(xt / 10 + p)], `${p % 10 ? `${p}% is about ${Math.round(p / 10) * 10}%, and ` : ''}${Math.round(p / 10) * 10}% of about ${Math.round(xt / 1000) * 100} is about ${fmt(Math.round(p / 10) * Math.round(xt / 1000) * 10)}. Only ${fmt(ex)} is close.`);
    } },
    d: { t: 'mental math', g: R => {
      const p = find(() => R.int(12, 88), p => p % 10 !== 5 && p % 10 !== 0), x = find(() => R.int(120, 980), x => x % 100 !== 50 && x % 100 !== 0), pr = Math.round(p / 10) * 10, xr = Math.round(x / 100) * 100;
      return num(`Estimate ${p}% of ${x}: round ${x} to the nearest hundred and ${p}% to the nearest ten percent.`, pr * xr / 100, `${x} → ${xr} and ${p}% → ${pr}%. ${pr}% of ${xr} = ${fmt(pr * xr / 100)}.`);
    } },
  } });

  /* ================= III.3.17 Multi-step percent problems ================= */
  E3.skill({ id: 'III.3.17', name: 'Multi-step percent problems', steps: {
    a: { t: 'two changes', g: (R, O) => {
      const a = R.pick([5, 10, 20, 25, 30, 40, 50]), b = R.pick([5, 10, 15, 20, 25, 50]), sa = R.pick([1, -1]), sb = R.pick([1, -1]), fa = 100 + sa * a, fb = 100 + sb * b;
      const S = find(() => R.int(2, 40) * 10 * sc(O), S => S * fa * fb % 100 === 0), mid = S * fa, end = S * fa * fb / 100, w = s => s > 0 ? 'rises' : 'falls';
      return num(`A price of ${M(S * 100, O)} ${w(sa)} ${a}%, then ${w(sb)} ${b}%. What is the final price?`, [MF(end, O)], `${fmt(S)} × ${fmt(fa / 100)} = ${fmt(mid / 100)}, then × ${fmt(fb / 100)} = ${MX(end / 100, O)}.`);
    } },
    b: { t: 'find the original', g: (R, O) => {
      const p = R.pick([10, 20, 25, 30, 40, 50]), off = R.bool(0.7), f = off ? 100 - p : 100 + p, D = find(() => R.int(4, 60) * 2 * sc(O), D => D * f % 100 === 0), F = D * f / 100;
      const q = off ? `After ${p}% off, a price is ${M(F * 100, O)}. What was the original price?` : `After ${/^8|^1[18]$/.test(String(p)) ? 'an' : 'a'} ${p}% rise, a price is ${M(F * 100, O)}. What was the price before?`;
      if (R.bool(0.6)) return num(q, [MF(D * 100, O)], `The ${M(F * 100, O)} is ${f}% of the original: ${fmt(F)} ÷ ${fmt(f / 100)} = ${MX(D, O)}.`);
      return choice(R, q, M(D * 100, O), [M(F * (off ? 100 + p : 100 - p), O), M(F * 100 + (off ? 1 : -1) * p * 100, O), M(F * 100 * f / 100, O)], `${fmt(F)} ÷ ${fmt(f / 100)} = ${MX(D, O)}. Adding ${p}% of ${fmt(F)} back doesn't work: the ${p}% was of the original.`);
    } },
    c: { t: 'tax and discount together', g: (R, O) => {
      const d = R.pick([10, 15, 20, 25, 30, 40, 50]), t = R.pick(TAXES(O)), P = find(() => R.int(2, 40) * 5 * sc(O), P => P * (100 - d) * (100 + t) % 100 === 0), end = P * (100 - d) * (100 + t) / 100;
      return num(`A ${M(P * 100, O)} item is ${d}% off, then ${t}% sales tax is added. What is the final price?`, [MF(end, O)], `${fmt(P)} × ${fmt((100 - d) / 100)} = ${fmt(P * (100 - d) / 100)}, then × ${fmt((100 + t) / 100)} = ${MX(end / 100, O)}.`);
    } },
    d: { t: 'explain', g: (R, O) => {
      const kind = R.int(0, 2), P = R.int(4, 30) * 10 * sc(O);
      if (kind === 0) { const d = R.pick([10, 20, 25, 30, 40]), t = R.pick([5, 6, 8, 10]), fd = fmt((100 - d) / 100), ft = fmt((100 + t) / 100);
        return choice(R, `A ${M(P * 100, O)} item is ${d}% off, then ${t}% tax is added. Which calculation gives the final price?`, `${fmt(P)} × ${fd} × ${ft}`, [`${fmt(P)} × ${fmt((100 - d + t) / 100)}`, `${fmt(P)} × ${fmt(d / 100)} × ${ft}`, `${fmt(P)} × ${fd} + ${t}`],
          `Each change is its own multiplier: ${fd} for ${d}% off and ${ft} for ${t}% tax.`); }
      if (kind === 1) { const d = R.pick([10, 20, 25]), t = R.pick([5, 8, 10]);
        return choiceFixed(`${M(P * 100, O)}: take ${d}% off then add ${t}% tax, or add the tax first then take ${d}% off. Which is cheaper?`, ['Discount first', 'Tax first', 'Both give the same price'], 2, `Both are ${fmt(P)} × ${fmt((100 - d) / 100)} × ${fmt((100 + t) / 100)}; multiplying in either order gives the same answer.`); }
      const p = R.pick([10, 20, 25, 50]);
      return choice(R, `A price rises ${p}%, then falls ${p}%. Why doesn't it end where it started?`, `The fall is ${p}% of a bigger amount`, [`The rise is ${p}% of a bigger amount`, `Percents can't be subtracted`, 'It does end where it started'], `The ${p}% fall is taken from the raised price, so more comes off than was added: × ${fmt((100 + p) / 100)} × ${fmt((100 - p) / 100)} = × ${f4((10000 - p * p) / 10000)}.`);
    } },
  } });
})();

/* Era III · Unit III.4 Exponents & roots (III.4.01–III.4.17)
   Scientific notation is kept exact as an integer mantissa c and exponent e (value c × 10^e). */
(function () {
  const { choice, choiceFixed, tf, frac, fh, fmt, V, C } = E3;
  const num = (p, a, e, x) => E3.num(p, a && a.frac ? [a] : a, e, x);   // lets a single frac() be the answer

  /* ---------- helpers ---------- */
  const N = n => n < 0 ? '−' + (-n) : String(n);                         // number with a real minus
  const sup = e => `<sup>${N(e)}</sup>`;
  const pw = (b, e) => (typeof b === 'number' && b < 0 ? `(${N(b)})` : b) + sup(e); // b^e, negative base bracketed
  const vi = v => `<i>${v}</i>`;
  const vp = (v, e) => e === 1 ? vi(v) : vi(v) + sup(e);                 // x^e (x¹ shown as x)
  const mono = (c, parts) => (c === 1 ? '' : c === -1 ? '−' : N(c)) + parts.map(([v, e]) => vp(v, e)).join('');
  const ex = (c, parts) => (c === 1 ? '' : c === -1 ? '-' : String(c)) + parts.map(([v, e]) => e === 1 ? v : `${v}^${e}`).join(''); // ASCII expr
  const find = (gen, ok) => { let v; for (let i = 0; i < 300; i++) { v = gen(); if (ok(v)) return v; } throw new Error('find failed'); };
  const ipow = (b, e) => { let r = 1; for (let i = 0; i < e; i++) r *= b; return r; };
  const unitsL = O => O.units === 'imperial' ? { len: 'in', area: 'in²', vol: 'in³' } : { len: 'cm', area: 'cm²', vol: 'cm³' };
  const r3 = x => Math.round(x * 1000) / 1000;
  const imp = O => O.units === 'imperial';
  const money = (v, O) => O.coins === 'THB' ? `${fmt(v)} baht` : `$${fmt(v)}`;

  // scientific notation: value c × 10^e, c a positive integer
  const norm = (c, e) => { while (c % 10 === 0 && c) { c /= 10; e++; } const L = String(c).length; return { a: c / ipow(10, L - 1), n: e + L - 1 }; };
  const sciH = (a, n) => `${fmt(a)} × 10${sup(n)}`;
  const sciS = (c, e) => { const s = norm(c, e); return sciH(s.a, s.n); };
  const plain = (c, e) => { if (e >= 0) return fmt(c * ipow(10, e)); const s = String(c).padStart(-e + 1, '0'), k = s.length + e; return s.slice(0, k) + '.' + s.slice(k); };
  const sciF = (c, e) => { const s = norm(c, e); return [{ label: 'a =', ans: s.a }, { label: 'n =', ans: s.n }]; };
  const AN = `Write it as <i>a</i> × 10<sup><i>n</i></sup> with 1 ≤ <i>a</i> &lt; 10.`;
  const val = (c, e) => c * Math.pow(10, e);

  /* ---------- visuals (prefix V4) ---------- */
  const V4 = {};
  // number line from lo to hi (integers labeled) with letters at values: pts [[v,'A']]
  V4.line = function (lo, hi, pts) {
    const W = 460, pad = 30, y = 46, X = v => pad + (v - lo) / (hi - lo) * (W - 2 * pad);
    let b = `<line x1="${pad - 12}" y1="${y}" x2="${W - pad + 12}" y2="${y}" stroke="${C.ink}" stroke-width="2"/>`;
    for (let v = lo; v <= hi; v++) b += `<line x1="${X(v)}" y1="${y - 9}" x2="${X(v)}" y2="${y + 9}" stroke="${C.ink}" stroke-width="2"/>` + V.text(X(v), y + 24, N(v), { size: 15, weight: 600 });
    for (let v = lo; v < hi; v += 0.5) if (v % 1) b += `<line x1="${X(v)}" y1="${y - 5}" x2="${X(v)}" y2="${y + 5}" stroke="${C.muted}" stroke-width="1.4"/>`;
    pts.forEach(([v, t]) => b += V.dot(X(v), y, 7, C.blue) + V.text(X(v), y - 22, t, { size: 16, weight: 700, fill: C.blue }));
    return V.svg(W, 80, b, 'number line');
  };
  // square with its area written inside
  V4.square = (label, s = 120) => V.svg(s + 8, s + 8, `<rect x="4" y="4" width="${s}" height="${s}" fill="${C.teal}22" stroke="${C.ink}" stroke-width="2.5"/>` + V.text(s / 2 + 4, s / 2 + 4, label, { size: 16, weight: 600 }), 'square');
  // simple cube with its volume written beside
  V4.cube = function (label) {
    const s = 90, d = 36, x = 6, y = d + 6; const p = (pts, f) => `<polygon points="${pts}" fill="${f}" stroke="${C.ink}" stroke-width="2" stroke-linejoin="round"/>`;
    const b = p(`${x},${y} ${x + s},${y} ${x + s},${y + s} ${x},${y + s}`, C.blue + '33') + p(`${x},${y} ${x + d},${y - d} ${x + s + d},${y - d} ${x + s},${y}`, C.blue + '55') + p(`${x + s},${y} ${x + s + d},${y - d} ${x + s + d},${y + s - d} ${x + s},${y + s}`, C.blue + '77') + V.text(x + s + d + 12, y + s / 2, label, { size: 16, weight: 600, anchor: 'start' });
    return V.svg(290, s + d + 12, b, 'cube');
  };
  // table: rows [[header, cells…]]
  V4.table = function (rows) {
    const cw = 58, hw = 50, rh = 36, cols = rows[0].length, Wd = hw + (cols - 1) * cw + 4; let b = '';
    rows.forEach((row, i) => row.forEach((cell, j) => { const x = j ? 2 + hw + (j - 1) * cw : 2, y = 2 + i * rh, w = j ? cw : hw, q = cell === '?';
      b += `<rect x="${x}" y="${y}" width="${w}" height="${rh}" fill="${j === 0 ? C.faint : q ? C.amber + '33' : C.paper}" stroke="${C.ink}" stroke-width="1.5"/>` + V.text(x + w / 2, y + rh / 2, String(cell), { size: 15, weight: j === 0 || q ? 700 : 500 }); }));
    return V.svg(Wd, rows.length * rh + 4, b, 'table');
  };

  /* ================= III.4.01 Whole-number exponents ================= */
  E3.skill({ id: 'III.4.01', name: 'Whole-number exponents', steps: {
    a: { t: 'repeated multiplication', g: R => {
      const b = R.int(2, 9), n = find(() => R.int(2, 6), n => n !== b), prod = Array(n).fill(b).join(' × ');
      if (R.bool()) return choice(R, `Write ${prod} as a power.`, pw(b, n), [pw(n, b), `${b} × ${n}`, String(b * n)], `${n} factors of ${b} is ${b} to the power ${n}: ${pw(b, n)}.`);
      return choice(R, `What does ${pw(b, n)} mean?`, prod, [`${b} × ${n}`, n <= 5 ? Array(b > 6 ? 2 : b).fill(n).join(' × ') : `${n} × ${b} × ${b}`, Array(n).fill(b).join(' + ')], `The exponent ${n} says how many ${b}s to multiply: ${prod}.`);
    } },
    b: { t: 'base and exponent', g: R => {
      const b = R.pick([R.int(2, 12), R.int(2, 9), -R.int(2, 6)]), n = find(() => R.int(2, 9), n => n !== Math.abs(b));
      if (R.bool(0.6)) return num(`In ${pw(b, n)}, what is the base and what is the exponent?`, [{ label: 'base', ans: b }, { label: 'exponent', ans: n }], `The base ${N(b)} is the number multiplied; the exponent ${n} says how many times it is a factor.`);
      return choice(R, `In ${pw(b, n)}, the ${n} tells you …`, `how many factors of ${N(b)} to multiply`, [`to multiply ${N(b)} by ${n}`, `to add ${N(b)} to itself ${n} times`, `the answer has ${n} digits`], `${pw(b, n)} is ${n} factors of ${N(b)} multiplied together.`);
    } },
    c: { t: 'evaluate', g: R => {
      const [b, n] = R.pick([[2, R.int(2, 10)], [3, R.int(2, 6)], [R.int(4, 6), R.int(2, 4)], [R.int(7, 12), 2], [R.int(7, 10), 3], [-2, R.int(2, 5)], [-3, R.int(2, 4)], [10, R.int(2, 6)]]), v = Math.pow(b, n);
      if (R.bool(0.65)) return num(`Evaluate ${pw(b, n)}.`, v, `${Array(n).fill(N(b)).join(' × ')} = ${fmt(v)}.`);
      return choice(R, `What is ${pw(b, n)}?`, fmt(v), [fmt(b * n), fmt(Math.pow(n, Math.abs(b)) * (b < 0 && n % 2 ? -1 : 1)), fmt(-v)], `Multiply ${n} factors of ${N(b)}: ${fmt(v)}. Not ${N(b)} × ${n}.`);
    } },
    d: { t: 'write in exponent form', g: R => {
      const [b, n] = R.pick([[2, R.int(3, 10)], [3, R.int(2, 6)], [4, R.int(2, 4)], [5, R.int(2, 4)], [6, R.int(2, 3)], [7, R.int(2, 3)], [10, R.int(2, 6)]]), v = ipow(b, n);
      if (R.bool(0.6)) return num(`Write ${fmt(v)} as a power of ${b}: ${fmt(v)} = ${b}<sup><i>n</i></sup>. What is <i>n</i>?`, [{ label: 'n =', ans: n }], `Keep multiplying by ${b}: ${Array.from({ length: n }, (_, i) => fmt(ipow(b, i + 1))).join(', ')}. That is ${n} factors, so ${fmt(v)} = ${pw(b, n)}.`);
      return num(`${fmt(v)} = <i>b</i>${sup(n)}. What whole number is <i>b</i>?`, [{ label: 'b =', ans: b }], `${Array(n).fill(b).join(' × ')} = ${fmt(v)}, so <i>b</i> = ${b}.`);
    } },
  } });

  /* ================= III.4.02 Powers of ten ================= */
  E3.skill({ id: 'III.4.02', name: 'Powers of ten', steps: {
    a: { t: '10² to 10⁶', g: R => {
      const n = R.int(2, 6), v = ipow(10, n), kind = R.int(0, 2);
      if (kind === 0) return num(`Write ${pw(10, n)} as a whole number.`, v, `${pw(10, n)} is 1 followed by ${n} zeros: ${fmt(v)}.`);
      if (kind === 1) return num(`${fmt(v)} = 10<sup><i>n</i></sup>. What is <i>n</i>?`, [{ label: 'n =', ans: n }], `${fmt(v)} has ${n} zeros after the 1, so it is ${pw(10, n)}.`);
      return choice(R, `What is ${pw(10, n)}?`, fmt(v), [String(10 * n), fmt(ipow(10, n - 1)), fmt(ipow(10, n + 1))], `${pw(10, n)} = ${Array(n).fill(10).join(' × ')} = ${fmt(v)}, not 10 × ${n}.`);
    } },
    b: { t: 'expanded form with powers', g: R => {
      const L = R.int(4, 6), digs = find(() => Array.from({ length: L }, (_, i) => i === 0 ? R.int(1, 9) : R.bool(0.35) ? 0 : R.int(1, 9)), d => d.filter(x => x).length >= 3), n = +digs.join('');
      const terms = digs.map((d, i) => [d, L - 1 - i]).filter(([d]) => d);
      if (R.bool(0.5)) return num(`Write the number: ${terms.map(([d, p]) => `${d} × ${pw(10, p)}`).join(' + ')}`, n, `${terms.map(([d, p]) => fmt(d * ipow(10, p))).join(' + ')} = ${fmt(n)}.`);
      const [d, p] = R.pick(terms.filter(([d]) => digs.indexOf(d) === digs.lastIndexOf(d)).length ? terms.filter(([d]) => digs.indexOf(d) === digs.lastIndexOf(d)) : [terms[0]]);
      return num(`In ${fmt(n)}, the digit ${d} is worth ${d} × 10<sup><i>n</i></sup>. What is <i>n</i>?`, [{ label: 'n =', ans: p }], `The ${d} is in the ${fmt(ipow(10, p))}s place, and ${fmt(ipow(10, p))} = ${pw(10, p)}.`);
    } },
    c: { t: 'multiply by powers of ten', g: R => {
      const dp = R.int(1, 3), c = find(() => R.int(11, 9999), c => c % 10 !== 0 && String(c).length > dp), n = R.int(1, 5);
      if (R.bool(0.75)) { const res = c * ipow(10, n - dp) >= 1 && n >= dp ? c * ipow(10, n - dp) : c / ipow(10, dp - n);
        return num(`${plain(c, -dp)} × ${pw(10, n)} = ?`, res, `Multiplying by ${pw(10, n)} moves the point ${n} place${n > 1 ? 's' : ''} right: ${plain(c, n - dp)}.`); }
      const k = R.int(1, 3), big = c * ipow(10, R.int(0, 1));
      return num(`${fmt(big)} ÷ ${pw(10, k)} = ?`, big / ipow(10, k), `Dividing by ${pw(10, k)} moves the point ${k} place${k > 1 ? 's' : ''} left: ${plain(big, -k)}.`);
    } },
    d: { t: 'a first look at 10⁻¹', g: R => {
      const kind = R.int(0, 3), k = R.int(1, 3);
      if (kind === 0) return num(`Write ${pw(10, -k)} as a decimal.`, 1 / ipow(10, k), `Each step down divides by 10: ${pw(10, 0)} = 1, ${pw(10, -1)} = 0.1${k > 1 ? `, ${pw(10, -2)} = 0.01` : ''}${k > 2 ? `, ${pw(10, -3)} = 0.001` : ''}.`);
      if (kind === 1) { const d = R.int(2, 9); return num(`${d} × ${pw(10, -k)} = ?`, d / ipow(10, k), `${pw(10, -k)} = ${plain(1, -k)}, so ${d} × ${plain(1, -k)} = ${plain(d, -k)}.`); }
      if (kind === 2) { const top = R.int(2, 4), seq = Array.from({ length: top + 1 }, (_, i) => top - i); // down to 0
        return num(`${seq.slice(0, -1).map(p => `${pw(10, p)} = ${fmt(ipow(10, p))}`).join(', ')}. Each step divides by 10. What is ${pw(10, 0)}?`, 1, `${pw(10, 1)} = 10, and 10 ÷ 10 = 1, so ${pw(10, 0)} = 1.`); }
      return choice(R, `What is ${pw(10, -1)}?`, '0.1', ['−10', '−1', '0.01'], `A negative exponent is not a negative number: ${pw(10, -1)} = ${fh(1, 10)} = 0.1.`);
    } },
  } });

  /* ================= III.4.03 Exponents in the order of operations ================= */
  E3.skill({ id: 'III.4.03', name: 'Exponents in the order of operations', steps: {
    a: { t: 'exponents first', g: R => {
      const kind = R.int(0, 3), b = R.int(2, 5), n = R.pick([2, 2, 3]), a = R.int(2, 9), p = ipow(b, n);
      if (kind === 0) return num(`Evaluate ${a} + ${pw(b, n)}.`, a + p, `Exponent first: ${pw(b, n)} = ${p}. Then ${a} + ${p} = ${a + p}.`);
      if (kind === 1) return num(`Evaluate ${pw(b, n)} − ${a}.`, p - a, `Exponent first: ${p} − ${a} = ${N(p - a)}.`);
      if (kind === 2) return num(`Evaluate ${a} × ${pw(b, n)}.`, a * p, `Exponent first: ${pw(b, n)} = ${p}, then ${a} × ${p} = ${a * p}.`);
      return choice(R, `What is ${a} × ${pw(b, 2)}?`, String(a * b * b), [String((a * b) ** 2), String(a * b * 2), String(a + b * b)], `The square applies only to the ${b}: ${a} × ${b * b} = ${a * b * b}, not (${a} × ${b})² = ${(a * b) ** 2}.`);
    } },
    b: { t: 'with brackets', g: R => {
      const kind = R.int(0, 3), a = R.int(1, 6), b = R.int(1, 5), c = R.int(2, 5);
      if (kind === 0) return num(`Evaluate (${a} + ${b})${sup(2)}.`, (a + b) ** 2, `Brackets first: ${a + b}, then ${a + b}² = ${(a + b) ** 2}. Not ${a}² + ${b}².`);
      if (kind === 1) { const hi = a + b + R.int(1, 3); return num(`Evaluate (${hi} − ${b})${sup(3)} − ${c}.`, (hi - b) ** 3 - c, `Brackets: ${hi - b}. Cube: ${(hi - b) ** 3}. Then − ${c} = ${(hi - b) ** 3 - c}.`); }
      if (kind === 2) return num(`Evaluate ${c}(${a} + ${b})${sup(2)}.`, c * (a + b) ** 2, `Brackets ${a + b}, square ${(a + b) ** 2}, then × ${c} = ${c * (a + b) ** 2}.`);
      return num(`Evaluate (${c} × ${b})${sup(2)} − ${c} × ${pw(b, 2)}.`, (c * b) ** 2 - c * b * b, `(${c * b})² = ${(c * b) ** 2} and ${c} × ${b * b} = ${c * b * b}; ${(c * b) ** 2} − ${c * b * b} = ${(c * b) ** 2 - c * b * b}.`);
    } },
    c: { t: '−3² vs (−3)²', g: R => {
      const a = R.int(2, 7), n = R.pick([2, 2, 3, 4]), inBr = R.bool(), v = inBr ? Math.pow(-a, n) : -ipow(a, n), kind = R.int(0, 2);
      const s = inBr ? pw(-a, n) : `−${pw(a, n)}`;
      if (kind === 0) return num(`Evaluate ${s}.`, v, inBr ? `The bracket makes −${a} the base: ${Array(n).fill(`(−${a})`).join(' × ')} = ${N(v)}.` : `The exponent acts only on the ${a}: −(${pw(a, n)}) = −${ipow(a, n)}.`);
      if (kind === 1) { const c = R.int(5, 40); return num(`Evaluate ${s} + ${c}.`, v + c, `${s} = ${N(v)}, so ${N(v)} + ${c} = ${N(v + c)}.`); }
      const m = 2;
      return choice(R, `Which one equals ${a * a}?`, pw(-a, m), [`−${pw(a, m)}`, `−(${pw(a, m)})`, `−${a} × ${m}`], `(−${a})² = (−${a}) × (−${a}) = ${a * a}. In −${a}² the square applies only to the ${a}, giving −${a * a}.`);
    } },
    d: { t: 'mixed', g: R => {
      const kind = R.int(0, 3), a = R.int(2, 5), b = R.int(2, 4), c = R.int(2, 6);
      if (kind === 0) { const v = c * 5 - ipow(b, 2) * a; return num(`Evaluate ${c * 5} − ${pw(b, 2)} × ${a}.`, v, `${pw(b, 2)} = ${b * b}, × ${a} = ${b * b * a}, then ${c * 5} − ${b * b * a} = ${N(v)}.`); }
      if (kind === 1) { const v = Math.pow(-a, 3) + ipow(b, 2); return num(`Evaluate ${pw(-a, 3)} + ${pw(b, 2)}.`, v, `${pw(-a, 3)} = ${N(Math.pow(-a, 3))} and ${pw(b, 2)} = ${b * b}: ${N(Math.pow(-a, 3))} + ${b * b} = ${N(v)}.`); }
      if (kind === 2) { const s = a + b, d = find(() => R.int(2, 9), d => s * s % d === 0 && d !== s * s), v = s * s / d - c; return num(`Evaluate (${a} + ${b})${sup(2)} ÷ ${d} − ${c}.`, v, `(${s})² = ${s * s}; ${s * s} ÷ ${d} = ${s * s / d}; − ${c} = ${N(v)}.`); }
      const v = -ipow(a, 2) + Math.pow(-b, 2) * c; return num(`Evaluate −${pw(a, 2)} + ${pw(-b, 2)} × ${c}.`, v, `−${pw(a, 2)} = −${a * a}; ${pw(-b, 2)} = ${b * b}, × ${c} = ${b * b * c}; −${a * a} + ${b * b * c} = ${N(v)}.`);
    } },
  } });

  /* ================= III.4.04 Multiplying powers ================= */
  const VARS = ['x', 'y', 'a', 'n', 'm', 'p'];
  E3.skill({ id: 'III.4.04', name: 'Multiplying powers', steps: {
    a: { t: 'same base, add exponents', g: R => {
      const [m, n] = find(() => [R.int(2, 9), R.int(2, 9)], ([m, n]) => m * n !== m + n);
      if (R.bool()) { const b = R.int(2, 9); return num(`${pw(b, m)} · ${pw(b, n)} = ${b}<sup><i>k</i></sup>. What is <i>k</i>?`, [{ label: 'k =', ans: m + n }], `Same base: add the exponents. ${m} + ${n} = ${m + n}, so ${pw(b, m + n)}.`); }
      const v = R.pick(VARS);
      return choice(R, `Simplify ${vp(v, m)} · ${vp(v, n)}.`, vp(v, m + n), [vp(v, m * n), `2${vp(v, m + n)}`, vp(v, Math.abs(m - n) || m + n + 1)], `${m} factors of ${vi(v)} times ${n} more is ${m + n} factors: ${vp(v, m + n)}. Add exponents, don't multiply.`);
    } },
    b: { t: 'with numbers', g: R => {
      if (R.bool()) { const [b, m, n] = R.pick([[2, R.int(1, 4), R.int(2, 5)], [3, R.int(1, 3), 2], [5, 1, 2], [10, R.int(1, 3), R.int(1, 3)], [4, 1, 2]]), v = ipow(b, m + n);
        return num(`Evaluate ${pw(b, m)} · ${pw(b, n)}.`, v, `Add the exponents: ${pw(b, m + n)} = ${fmt(v)}.`); }
      const b = R.int(2, 9), m = R.int(2, 8), n = R.int(2, 8);
      return choice(R, `Write ${pw(b, m)} · ${pw(b, n)} as a single power.`, pw(b, m + n), [pw(b, m * n), pw(b * b, m + n), pw(2 * b, m + n)], `The base stays ${b}; add the exponents: ${pw(b, m + n)}.`);
    } },
    c: { t: 'with variables', g: R => {
      const c1 = R.int(2, 7), c2 = R.int(2, 7), m = R.int(1, 6), n = R.int(2, 6);
      if (R.bool(0.6)) { const v = R.pick(VARS);
        return num(`Simplify ${mono(c1, [[v, m]])} · ${mono(c2, [[v, n]])}.`, [{ expr: ex(c1 * c2, [[v, m + n]]), form: 'simplified' }], `Multiply the numbers: ${c1} × ${c2} = ${c1 * c2}. Add the exponents: ${m} + ${n} = ${m + n}. So ${mono(c1 * c2, [[v, m + n]])}.`); }
      const [u, w] = R.sample(['a', 'b', 'x', 'y'], 2).sort(), p = R.int(1, 4), q = R.int(1, 4), r = R.int(1, 4), s = R.int(1, 4);
      return num(`Simplify ${mono(c1, [[u, p], [w, q]])} · ${mono(c2, [[u, r], [w, s]])}.`, [{ expr: ex(c1 * c2, [[u, p + r], [w, q + s]]), form: 'simplified' }], `${c1} × ${c2} = ${c1 * c2}; ${vi(u)}: ${p} + ${r} = ${p + r}; ${vi(w)}: ${q} + ${s} = ${q + s}. So ${mono(c1 * c2, [[u, p + r], [w, q + s]])}.`);
    } },
    d: { t: 'mixed', g: R => {
      const kind = R.int(0, 2), v = R.pick(VARS);
      if (kind === 0) { const a = R.int(2, 6), b = R.int(2, 6);
        return num(`Simplify ${vp(v, a)} · ${vi(v)} · ${vp(v, b)}.`, [{ expr: ex(1, [[v, a + b + 1]]), form: 'simplified' }], `${vi(v)} on its own is ${vp(v, 1).replace('</i>', '</i><sup>1</sup>')}: ${a} + 1 + ${b} = ${a + b + 1}, so ${vp(v, a + b + 1)}.`); }
      if (kind === 1) { const c1 = R.int(2, 5), c2 = R.int(2, 6), m = R.int(2, 5), n = R.int(2, 5);
        return num(`Simplify (−${mono(c1, [[v, m]])})(${mono(c2, [[v, n]])}).`, [{ expr: ex(-c1 * c2, [[v, m + n]]), form: 'simplified' }], `Negative × positive: −${c1 * c2}. Add exponents: ${m + n}. So −${mono(c1 * c2, [[v, m + n]])}.`); }
      const [b1, b2] = R.pick([[2, 3], [2, 5], [3, 2], [5, 2], [3, 4]]), m = R.int(2, 3), n = 2, v2 = ipow(b1, m) * ipow(b2, n);
      return choice(R, `What is ${pw(b1, m)} · ${pw(b2, n)}?`, fmt(v2), [pw(b1 * b2, m + n), pw(b1 * b2, m * n), pw(b1 + b2, m + n)], `Different bases don't combine by adding exponents. Work it out: ${ipow(b1, m)} × ${ipow(b2, n)} = ${fmt(v2)}.`);
    } },
  } });

  /* ================= III.4.05 Dividing powers ================= */
  const dv = (a, b) => `${a} ÷ ${b}`;
  E3.skill({ id: 'III.4.05', name: 'Dividing powers', steps: {
    a: { t: 'same base, subtract exponents', g: R => {
      if (R.bool()) { const b = R.int(2, 9), n = R.int(2, 6), m = n + R.int(1, 7);
        return num(`${dv(pw(b, m), pw(b, n))} = ${b}<sup><i>k</i></sup>. What is <i>k</i>?`, [{ label: 'k =', ans: m - n }], `Same base: subtract the exponents. ${m} − ${n} = ${m - n}, so ${pw(b, m - n)}.`); }
      const v = R.pick(VARS), n = R.int(2, 4), m = n * R.int(2, 4);
      return choice(R, `Simplify ${dv(vp(v, m), vp(v, n))}.`, vp(v, m - n), [vp(v, m / n), vp(v, m + n), `${m / n}`], `${m} factors of ${vi(v)} divided by ${n} of them leaves ${m - n}: ${vp(v, m - n)}. Subtract exponents, don't divide them.`);
    } },
    b: { t: 'the zero exponent', g: R => {
      const b = R.pick([R.int(2, 12), R.int(13, 99), -R.int(2, 9)]), kind = R.int(0, 3);
      if (kind === 0) return choice(R, `What is ${pw(b, 0)}?`, '1', ['0', N(b), N(-Math.abs(b))], `Any non-zero number to the power 0 is 1: ${pw(b, 0)} = 1, not 0.`);
      if (kind === 1) { const m = R.int(2, 6), c = Math.abs(b); return num(`${dv(pw(c, m), pw(c, m))} = ${c}<sup><i>k</i></sup>. What is <i>k</i>, and what is the value?`, [{ label: 'k =', ans: 0 }, { label: 'value', ans: 1 }], `Subtract: ${m} − ${m} = 0, so ${pw(c, 0)}. Anything divided by itself is 1, so ${pw(c, 0)} = 1.`); }
      if (kind === 2) { const c = R.int(2, 9), d = R.int(2, 9); return num(`Evaluate ${c} × ${pw(d, 0)}.`, c, `${pw(d, 0)} = 1, so ${c} × 1 = ${c}.`); }
      const c = R.int(2, 9), d = R.int(2, 9); return num(`Evaluate ${pw(c, 0)} + ${pw(d, 1)}.`, 1 + d, `${pw(c, 0)} = 1 and ${pw(d, 1)} = ${d}: 1 + ${d} = ${1 + d}.`);
    } },
    c: { t: 'with variables', g: R => {
      const c2 = R.int(2, 6), q = R.int(1, 6), c1 = c2 * q, n = R.int(1, 4), m = n + R.int(1, 5);
      if (R.bool(0.6)) { const v = R.pick(VARS);
        return num(`Simplify ${dv(mono(c1, [[v, m]]), mono(c2, [[v, n]]))}.`, [{ expr: ex(q, [[v, m - n]]), form: 'simplified' }], `Divide the numbers: ${c1} ÷ ${c2} = ${q}. Subtract the exponents: ${m} − ${n} = ${m - n}. So ${mono(q, [[v, m - n]])}.`); }
      const [u, w] = R.sample(['a', 'b', 'x', 'y'], 2).sort(), p = R.int(1, 3), r = R.int(1, 3), s2 = R.int(1, 3);
      return num(`Simplify ${dv(mono(c1, [[u, p + r], [w, s2 + 1]]), mono(c2, [[u, r], [w, s2]]))}.`, [{ expr: ex(q, [[u, p], [w, 1]]), form: 'simplified' }], `${c1} ÷ ${c2} = ${q}; ${vi(u)}: ${p + r} − ${r} = ${p}; ${vi(w)}: ${s2 + 1} − ${s2} = 1. So ${mono(q, [[u, p], [w, 1]])}.`);
    } },
    d: { t: 'mixed', g: R => {
      const kind = R.int(0, 3), v = R.pick(VARS);
      if (kind === 0) { const a = R.int(2, 6), b = R.int(2, 6), c = R.int(1, a + b - 1);
        return num(`Simplify ${dv(`(${vp(v, a)} · ${vp(v, b)})`, vp(v, c))}.`, [{ expr: ex(1, [[v, a + b - c]]), form: 'simplified' }], `Multiply first: ${vp(v, a + b)}. Then divide: ${a + b} − ${c} = ${a + b - c}, so ${vp(v, a + b - c)}.`); }
      if (kind === 1) { const [b, d] = R.pick([[2, R.int(1, 5)], [3, R.int(1, 3)], [5, R.int(1, 2)], [10, R.int(1, 4)]]), n = R.int(2, 6), m = n + d;
        return num(`Evaluate ${dv(pw(b, m), pw(b, n))}.`, ipow(b, d), `Subtract the exponents: ${pw(b, d)} = ${fmt(ipow(b, d))}.`); }
      if (kind === 2) { const [u, w] = R.sample(['a', 'b', 'x', 'y'], 2).sort(), c2 = R.int(2, 5), q = R.int(2, 5), p = R.int(1, 4), s2 = R.int(1, 4), r = R.int(1, 3);
        return num(`Simplify ${dv(mono(c2 * q, [[u, p + r], [w, s2]]), mono(c2, [[u, r], [w, s2]]))}.`, [{ expr: ex(q, [[u, p]]), form: 'simplified' }], `${c2 * q} ÷ ${c2} = ${q}; ${vi(u)}: ${p + r} − ${r} = ${p}; ${vi(w)}: ${s2} − ${s2} = 0, and ${vp(w, 0).replace('<sup>0</sup>', '')}<sup>0</sup> = 1. So ${mono(q, [[u, p]])}.`); }
      const b = R.int(2, 9), m = R.int(3, 8), n = R.int(1, m - 1), k = R.int(1, 3);
      return num(`${dv(`${pw(b, m)} · ${pw(b, k)}`, pw(b, n))} = ${b}<sup><i>k</i></sup>. What is <i>k</i>?`, [{ label: 'k =', ans: m + k - n }], `Add, then subtract: ${m} + ${k} − ${n} = ${m + k - n}.`);
    } },
  } });

  /* ================= III.4.06 Power of a power ================= */
  E3.skill({ id: 'III.4.06', name: 'Power of a power', steps: {
    a: { t: 'multiply exponents', g: R => {
      const m = R.int(2, 5), n = find(() => R.int(2, 4), n => n !== m);
      if (R.bool()) { const b = R.int(2, 9); return num(`(${pw(b, m)})${sup(n)} = ${b}<sup><i>k</i></sup>. What is <i>k</i>?`, [{ label: 'k =', ans: m * n }], `${n} copies of ${pw(b, m)} multiplied: ${Array(n).fill(m).join(' + ')} = ${m * n}. Multiply the exponents.`); }
      const v = R.pick(VARS);
      return choice(R, `Simplify (${vp(v, m)})${sup(n)}.`, vp(v, m * n), [vp(v, m + n), vp(v, ipow(m, n)), `${n}${vp(v, m)}`], `(${vp(v, m)})${sup(n)} = ${Array(n).fill(vp(v, m)).join(' · ')} = ${vp(v, m * n)}. Multiply exponents: ${m} × ${n} = ${m * n}.`);
    } },
    b: { t: 'power of a product', g: R => {
      const c = R.int(2, 5), n = c > 3 ? 2 : R.int(2, 3), m = R.int(1, 4), v = R.pick(VARS), cn = ipow(c, n);
      if (R.bool(0.4)) return choice(R, `Simplify (${mono(c, [[v, m]])})${sup(n)}.`, mono(cn, [[v, m * n]]), [mono(c, [[v, m * n]]), mono(c * n, [[v, m * n]]), mono(cn, [[v, m + n]])], `Raise each factor: ${pw(c, n)} = ${cn} and ${m === 1 ? vp(v, n) : `(${vp(v, m)})${sup(n)} = ${vp(v, m * n)}`}. So ${mono(cn, [[v, m * n]])}.`);
      if (R.bool()) { const [u, w] = R.sample(['a', 'b', 'x', 'y'], 2).sort(), p = R.int(1, 3), q = R.int(2, 4);
        return num(`Simplify (${mono(c, [[u, p], [w, q]])})${sup(n)}.`, [{ expr: ex(cn, [[u, p * n], [w, q * n]]), form: 'simplified' }], `Every factor gets the power ${n}: ${pw(c, n)} = ${cn}, ${vp(u, p * n)}, ${vp(w, q * n)}. So ${mono(cn, [[u, p * n], [w, q * n]])}.`); }
      return num(`Simplify (${mono(c, [[v, m]])})${sup(n)}.`, [{ expr: ex(cn, [[v, m * n]]), form: 'simplified' }], `${pw(c, n)} = ${cn} and ${m === 1 ? vp(v, n) : `(${vp(v, m)})${sup(n)} = ${vp(v, m * n)}`}. So ${mono(cn, [[v, m * n]])}.`);
    } },
    c: { t: 'power of a quotient', g: R => {
      if (R.bool()) { const [a, b] = find(() => [R.int(1, 5), R.int(2, 6)], ([a, b]) => a !== b && E3.gcd(a, b) === 1), n = Math.max(a, b) > 4 ? 2 : R.int(2, 3);
        return num(`Evaluate (${fh(a, b)})${sup(n)}.`, frac(ipow(a, n), ipow(b, n)), `Raise top and bottom: ${fh(pw(a, n), pw(b, n))} = ${fh(ipow(a, n), ipow(b, n))}.`); }
      const v = R.pick(VARS), m = R.int(2, 4), c = R.int(2, 5), n = c > 3 ? 2 : R.int(2, 3);
      return choice(R, `Simplify (${fh(vp(v, m), c)})${sup(n)}.`, fh(vp(v, m * n), ipow(c, n)), [fh(vp(v, m * n), c), fh(vp(v, m + n), ipow(c, n)), fh(vp(v, m * n), c * n)], `Top: (${vp(v, m)})${sup(n)} = ${vp(v, m * n)}. Bottom: ${pw(c, n)} = ${ipow(c, n)}. The power applies to both.`);
    } },
    d: { t: 'all the laws together', g: R => {
      const kind = R.int(0, 3), v = R.pick(VARS);
      if (kind === 0) { const a = R.int(2, 4), b = R.int(2, 3), c = R.int(1, 5), d = R.int(1, a * b + c - 1);
        return num(`Simplify ${dv(`(${vp(v, a)})${sup(b)} · ${vp(v, c)}`, vp(v, d))}.`, [{ expr: ex(1, [[v, a * b + c - d]]), form: 'simplified' }], `(${vp(v, a)})${sup(b)} = ${vp(v, a * b)}; × ${vp(v, c)} gives ${vp(v, a * b + c)}; ÷ ${vp(v, d)} gives ${vp(v, a * b + c - d)}.`); }
      if (kind === 1) { const c = R.int(2, 3), m = R.int(1, 3), k = R.int(1, 4), cn = c * c;
        return num(`Simplify (${mono(c, [[v, m]])})${sup(2)} · ${vp(v, k)}.`, [{ expr: ex(cn, [[v, 2 * m + k]]), form: 'simplified' }], `(${mono(c, [[v, m]])})² = ${mono(cn, [[v, 2 * m]])}. Times ${vp(v, k)}: ${mono(cn, [[v, 2 * m + k]])}.`); }
      if (kind === 2) { const a = R.int(1, 5), b = R.int(1, 5);
        return choice(R, `Is (${a} + ${b})${sup(2)} equal to ${pw(a, 2)} + ${pw(b, 2)}?`, `No: ${(a + b) ** 2} ≠ ${a * a + b * b}`, [`Yes: both are ${(a + b) ** 2}`, `Yes: both are ${a * a + b * b}`], `(${a + b})² = ${(a + b) ** 2}, but ${a * a} + ${b * b} = ${a * a + b * b}. The power law works for products, not sums.`); }
      const b = R.int(2, 5), p = R.int(2, 3), q = R.int(2, 3), r = R.int(1, p * q - 1);
      return num(`${dv(`(${pw(b, p)})${sup(q)}`, pw(b, r))} = ${b}<sup><i>k</i></sup>. What is <i>k</i>?`, [{ label: 'k =', ans: p * q - r }], `(${pw(b, p)})${sup(q)} = ${pw(b, p * q)}. Then ${p * q} − ${r} = ${p * q - r}.`);
    } },
  } });

  /* ================= III.4.07 Negative exponents ================= */
  E3.skill({ id: 'III.4.07', name: 'Negative exponents', steps: {
    a: { t: 'what they mean', g: R => {
      const [b, n] = R.pick([[2, R.int(1, 5)], [3, R.int(1, 3)], [4, R.int(1, 3)], [5, R.int(1, 3)], [10, R.int(1, 3)], [R.int(6, 9), R.int(1, 2)]]), v = ipow(b, n);
      if (R.bool(0.65)) return choice(R, `What is ${pw(b, -n)}?`, fh(1, fmt(v)), [N(-v), N(-b * n), n === 1 ? fh(1, b * 2) : fh(1, b * n)], `A negative exponent means the reciprocal: ${pw(b, -n)} = ${fh(1, pw(b, n))} = ${fh(1, fmt(v))}. It is not negative.`);
      return choice(R, `Which is equal to ${fh(1, pw(b, n))}?`, pw(b, -n), [N(-v), pw(-b, n), pw(b, n)], `${fh(1, pw(b, n))} is the reciprocal of ${pw(b, n)}, which is written ${pw(b, -n)}.`);
    } },
    b: { t: 'as fractions', g: R => {
      const [b, n] = R.pick([[2, R.int(1, 6)], [3, R.int(1, 4)], [4, R.int(1, 3)], [5, R.int(1, 3)], [10, R.int(1, 4)], [R.int(6, 9), R.int(1, 2)]]), v = ipow(b, n), kind = R.int(0, 2);
      if (kind === 0) return num(`Write ${pw(b, -n)} as a fraction.`, frac(1, v), `${pw(b, -n)} = ${fh(1, pw(b, n))} = ${fh(1, fmt(v))}.`);
      if (kind === 1) return num(`${fh(1, fmt(v))} = ${b}<sup><i>k</i></sup>. What is <i>k</i>?`, [{ label: 'k =', ans: -n }], `${fmt(v)} = ${pw(b, n)}, and 1 over it is ${pw(b, -n)}. So <i>k</i> = −${n}.`);
      const c = R.int(2, 7); return num(`Write ${c} × ${pw(b, -n)} as a fraction.`, frac(c, v), `${pw(b, -n)} = ${fh(1, fmt(v))}, so ${c} × ${fh(1, fmt(v))} = ${fh(c, fmt(v))}${E3.gcd(c, v) > 1 ? ' = ' + fh(...E3.reduce(c, v)) : ''}.`);
    } },
    c: { t: 'simplify', g: R => {
      const kind = R.int(0, 2), v = R.pick(VARS);
      if (kind === 0) { const a = R.int(1, 5), b = a + R.int(1, 5), k = b - a;
        return choice(R, `Simplify ${dv(vp(v, a), vp(v, b))}. Use a positive exponent.`, fh(1, vp(v, k)), [vp(v, k), `−${vp(v, k)}`, fh(1, vp(v, a + b))], `Subtract: ${a} − ${b} = −${k}, so ${vp(v, -k)} = ${fh(1, vp(v, k))}.`); }
      if (kind === 1) { const n = R.int(2, 5); return choice(R, `Simplify ${fh(1, vp(v, -n))}.`, vp(v, n), [fh(1, vp(v, n)), `−${vp(v, n)}`, vp(v, -n)], `${vp(v, -n)} = ${fh(1, vp(v, n))}, and 1 over that flips it back: ${vp(v, n)}.`); }
      const [b, m, n] = R.pick([[2, R.int(1, 3), R.int(4, 6)], [3, R.int(1, 2), R.int(3, 4)], [5, 1, 3], [10, R.int(1, 2), R.int(3, 5)]]), k = n - m;
      return num(`Evaluate ${pw(b, m)} × ${pw(b, -n)} as a fraction.`, frac(1, ipow(b, k)), `Add exponents: ${m} + (−${n}) = −${k}. ${pw(b, -k)} = ${fh(1, fmt(ipow(b, k)))}.`);
    } },
    d: { t: 'with the laws', g: R => {
      const kind = R.int(0, 3);
      if (kind === 0) { const b = R.pick([2, 3, 5]), m = R.int(1, 3), n = R.int(1, 2), e = -m * n, val2 = frac(1, ipow(b, m * n));
        return num(`Evaluate (${pw(b, -m)})${sup(n)}.`, val2, `Multiply exponents: −${m} × ${n} = ${N(e)}. ${pw(b, e)} = ${fh(1, fmt(ipow(b, m * n)))}.`); }
      if (kind === 1) { const b = R.pick([2, 3]), m = R.int(1, 2), n = R.int(1, 2);
        return num(`Evaluate (${pw(b, -m)})${sup(-n)}.`, ipow(b, m * n), `Multiply exponents: (−${m}) × (−${n}) = ${m * n}. ${pw(b, m * n)} = ${ipow(b, m * n)}.`); }
      if (kind === 2) { const b = R.pick([2, 3, 4, 5, 10]), n = R.int(1, 4), m = n + R.int(1, b > 3 ? 1 : 3);
        return num(`Evaluate ${pw(b, -n)} × ${pw(b, m)}.`, ipow(b, m - n), `Add exponents: −${n} + ${m} = ${m - n}. ${pw(b, m - n)} = ${ipow(b, m - n)}.`); }
      const v = R.pick(VARS), a = R.int(1, 3), p = R.int(2, 3), c = a * p + R.int(1, 4);
      return num(`Simplify (${vp(v, -a)})${sup(p)} · ${vp(v, c)}.`, [{ expr: ex(1, [[v, c - a * p]]), form: 'simplified' }], `(${vp(v, -a)})${sup(p)} = ${vp(v, -a * p)}. Add ${c}: −${a * p} + ${c} = ${c - a * p}, so ${vp(v, c - a * p)}.`);
    } },
  } });

  /* ================= III.4.08 Scientific notation ================= */
  // a coefficient c (2 or 3 significant digits, last digit not 0) so that a = c / 10^(digits-1)
  const coef = R => find(() => R.pick([R.int(11, 99), R.int(101, 999), R.int(2, 9)]), c => c % 10 !== 0);
  E3.skill({ id: 'III.4.08', name: 'Scientific notation', steps: {
    a: { t: 'read it', g: R => {
      if (R.bool(0.35)) { const c = coef(R), L = String(c).length, a = c / ipow(10, L - 1), n = R.int(3, 8);
        return choice(R, `Which number is written in scientific notation?`, sciH(a, n), [`${fmt(a * 10)} × 10${sup(n - 1)}`, `${fmt(a / 10)} × 10${sup(n + 1)}`, `${fmt(a)} + 10${sup(n)}`], `In ${sciH(a, n)} the front number ${fmt(a)} is at least 1 and less than 10. ${fmt(a * 10)} is too big, ${fmt(a / 10)} too small.`); }
      const c = coef(R), L = String(c).length, n = R.int(L - 1 + 1, 7), e = n - (L - 1);
      return num(`Write ${sciS(c, e)} as an ordinary number.`, c * ipow(10, e), `10${sup(n)} moves the point ${n} places right: ${fmt(c * ipow(10, e))}.`);
    } },
    b: { t: 'write large numbers', g: R => {
      const c = coef(R), e = R.int(1, 7), v = c * ipow(10, e), s = norm(c, e);
      return num(`Write ${fmt(v)} in scientific notation. ${AN}`, sciF(c, e), `Put the point after the first digit: ${fmt(s.a)}. It moved ${s.n} places, so ${sciH(s.a, s.n)}.`);
    } },
    c: { t: 'write small numbers', g: R => {
      const c = coef(R), L = String(c).length, n = -R.int(1, 5), e = n - (L - 1), s = norm(c, e);
      if (R.bool(0.35)) return choice(R, `Write ${plain(c, e)} in scientific notation.`, sciH(s.a, s.n), [sciH(s.a, -s.n), sciH(s.a, s.n - 1), `${fmt(c)} × 10${sup(e)}`], `Move the point ${-s.n} place${s.n === -1 ? '' : 's'} right to get ${fmt(s.a)}. Small numbers get negative powers: ${sciH(s.a, s.n)}.`);
      return num(`Write ${plain(c, e)} in scientific notation. ${AN}`, sciF(c, e), `Move the point ${-s.n} place${s.n === -1 ? '' : 's'} right to get ${fmt(s.a)}. The number is small, so the power is negative: ${sciH(s.a, s.n)}.`);
    } },
    d: { t: 'convert back', g: R => {
      const c = coef(R), L = String(c).length, big = R.bool(0.4), n = big ? R.int(2, 8) : -R.int(1, 6), e = n - (L - 1), s = norm(c, e);
      const p = `Write ${sciH(s.a, s.n)} as an ordinary number.`, ex2 = `Move the point ${Math.abs(n)} place${Math.abs(n) === 1 ? '' : 's'} ${big ? 'right' : 'left'}: ${plain(c, e)}.`;
      if (big || e >= -3) return num(p, big ? c * ipow(10, e) : c / ipow(10, -e), ex2);
      return choice(R, p, plain(c, e), [plain(c, e - 1), plain(c, e + 1), fmt(c * ipow(10, -e - 2 * (L - 1)))], ex2);
    } },
  } });

  /* ================= III.4.09 Calculating in scientific notation ================= */
  // a random small coefficient: integer c with 1–2 significant digits (value a = c / 10^(L-1) between 1 and 10)
  const coef2 = R => find(() => R.pick([R.int(2, 9), R.int(11, 99), R.pick([15, 25, 12, 35, 45])]), c => c % 10 !== 0);
  const sA = c => c / ipow(10, String(c).length - 1);          // coefficient value of c
  E3.skill({ id: 'III.4.09', name: 'Calculating in scientific notation', steps: {
    a: { t: 'multiply', g: R => {
      const c1 = coef2(R), c2 = R.int(2, 9), m = R.int(2, 9), n = find(() => R.int(-4, 9), n => n !== 0), a1 = sA(c1), prod = a1 * c2, s = norm(Math.round(prod * 100), m + n - 2);
      return num(`Calculate (${sciH(a1, m)}) × (${sciH(c2, n)}). ${AN}`, sciF(Math.round(prod * 100), m + n - 2), `Multiply the front numbers: ${fmt(a1)} × ${c2} = ${fmt(prod)}. Add the powers: ${m} + ${n < 0 ? `(${N(n)})` : n} = ${N(m + n)}. ${prod >= 10 ? `${fmt(prod)} × 10${sup(m + n)} = ` : ''}${sciH(s.a, s.n)}.`);
    } },
    b: { t: 'divide', g: R => {
      const q = R.int(2, 9), c2 = R.int(2, 9), c1 = q * c2, m = R.int(4, 12), n = find(() => R.int(-3, m - 1), n => n !== 0), s1 = norm(c1, m - (String(c1).length - 1)), s = norm(q, m - (String(c1).length - 1) - n);
      return num(`Calculate (${sciH(s1.a, s1.n)}) ÷ (${sciH(c2, n)}). ${AN}`, sciF(q, m - (String(c1).length - 1) - n), `Divide the front numbers: ${fmt(s1.a)} ÷ ${c2} = ${fmt(s1.a / c2)}. Subtract the powers: ${s1.n} − ${n < 0 ? `(${N(n)})` : n} = ${N(s1.n - n)}. ${s1.a / c2 < 1 ? `${fmt(s1.a / c2)} × 10${sup(s1.n - n)} = ` : ''}${sciH(s.a, s.n)}.`);
    } },
    c: { t: 'add and subtract', g: R => {
      const a = R.int(2, 8), b = R.int(1, 9), m = R.int(3, 8), d = R.pick([0, 1, 1, 2]), sub = R.bool(0.4) && d > 0;
      const tot = sub ? a * ipow(10, d) - b : a * ipow(10, d) + b, s = norm(tot, m - d);
      const p = `Calculate ${sciH(a, m)} ${sub ? '−' : '+'} ${sciH(b, m - d)}.`;
      const e = d ? `Match the powers: ${sciH(b, m - d)} = ${fmt(b / ipow(10, d))} × 10${sup(m)}. Then ${a} ${sub ? '−' : '+'} ${fmt(b / ipow(10, d))} = ${fmt(tot / ipow(10, d))}, so ${sciH(s.a, s.n)}.` : `Same power, so ${sub ? 'subtract' : 'add'} the front numbers: ${a} ${sub ? '−' : '+'} ${b} = ${tot}${tot >= 10 ? `, and ${tot} × 10${sup(m)} = ${sciH(s.a, s.n)}` : ''}.`;
      if (R.bool(0.35) && !sub) return choice(R, p, sciH(s.a, s.n), [`${a + b} × 10${sup(2 * m - d)}`, `${a * b} × 10${sup(2 * m - d)}`, d ? `${a + b} × 10${sup(m)}` : `${a + b} × 10${sup(m + 1)}`], e + ' Only multiplying adds the powers.');
      return num(`${p} ${AN}`, sciF(tot, m - d), e);
    } },
    d: { t: 'real-world sizes', g: (R, O) => {
      const kind = R.int(0, 3);
      if (kind === 0) { const t = R.int(2, 9), n = R.int(1, 4), s = norm(3 * t, 8 + n);
        return num(`Light travels about ${sciH(3, 8)} meters each second. How far does it go in ${sciH(t, n)} seconds? ${AN}`, sciF(3 * t, 8 + n), `Distance = speed × time = 3 × ${t} = ${3 * t}, and 10${sup(8)} × 10${sup(n)} = 10${sup(8 + n)}. So ${sciH(s.a, s.n)} m.`); }
      if (kind === 1) { const mg = R.int(2, 9), k = R.int(3, 7), s = norm(mg, k - 3);
        return num(`A grain of rice has mass about ${sciH(mg, -3)} kg. What is the mass of 10${sup(k)} grains, in kg? ${AN}`, sciF(mg, k - 3), `${sciH(mg, -3)} × 10${sup(k)}: add the powers, −3 + ${k} = ${k - 3}. So ${sciH(s.a, s.n)} kg.`); }
      if (kind === 2) { const w = R.pick([2, 4, 5, 8]), q = R.int(2, 9), L = w * q, s = norm(L, -2), res = norm(q, 3);
        return num(`A hair is about ${sciH(w, -5)} m wide. How many hairs side by side make ${sciH(s.a, s.n)} m? ${AN}`, sciF(q, 3), `${fmt(s.a)} × 10${sup(s.n)} ÷ (${w} × 10${sup(-5)}) = ${fmt(s.a / w)} × 10${sup(s.n + 5)}${res.a === s.a / w && res.n === s.n + 5 ? '' : ' = ' + sciH(res.a, res.n)}.`); }
      const pop = R.pick([[8, 9, 'people on Earth'], [3, 8, 'people in the USA'], [7, 7, 'people in Thailand']]), l = R.int(2, 3), s = norm(pop[0] * l, pop[1]);
      return num(`There are about ${sciH(pop[0], pop[1])} ${pop[2]}. If each drinks ${l} liters of water a day, how many liters is that? ${AN}`, sciF(pop[0] * l, pop[1]), `${pop[0]} × ${l} = ${pop[0] * l}, so ${pop[0] * l} × 10${sup(pop[1])} = ${sciH(s.a, s.n)} liters.`);
    } },
  } });

  /* ================= III.4.10 Comparing huge and tiny numbers ================= */
  const sciPick = (R, lo, hi) => { const c = coef2(R), n = R.int(lo, hi); return { a: sA(c), n, v: sA(c) * Math.pow(10, n) }; };
  E3.skill({ id: 'III.4.10', name: 'Comparing huge and tiny numbers', steps: {
    a: { t: 'which is bigger', g: R => {
      const kind = R.int(0, 2); let A, B;
      if (kind === 0) { const n = R.int(-6, 9), d = R.int(1, 3); A = { a: R.int(5, 9) + 0.5 * R.int(0, 1), n }; B = { a: R.int(1, 4), n: n + d }; }
      else if (kind === 1) { const n = R.int(-6, 9); A = sciPick(R, n, n); B = find(() => sciPick(R, n, n), b => b.a !== A.a); }
      else { const n = -R.int(2, 7), d = R.int(1, 2); A = { a: R.int(5, 9), n }; B = { a: R.int(1, 4), n: n + d }; }
      const [X, Y] = R.bool() ? [A, B] : [B, A], big = X.a * Math.pow(10, X.n) > Y.a * Math.pow(10, Y.n) ? 0 : 1;
      return choiceFixed(`Which is bigger?`, [sciH(X.a, X.n), sciH(Y.a, Y.n)], big, X.n !== Y.n ? `Compare the powers first: 10${sup(Math.max(X.n, Y.n))} beats 10${sup(Math.min(X.n, Y.n))}, whatever the front numbers are.` : `The powers are the same, so compare the front numbers: ${fmt(Math.max(X.a, Y.a))} &gt; ${fmt(Math.min(X.a, Y.a))}.`);
    } },
    b: { t: 'how many times bigger', g: R => {
      const c2 = R.int(1, 4), q = R.bool() ? R.int(2, Math.max(2, Math.floor(9 / c2))) : 1, n = R.int(-5, 6), d = R.int(1, 5), c1 = c2 * q;
      if (c1 >= 10) return E3.byId['III.4.10'].steps.b.g(R);
      const ans = q * ipow(10, d);
      return num(`How many times bigger is ${sciH(c1, n + d)} than ${sciH(c2, n)}?`, ans, `Divide: ${c1} ÷ ${c2} = ${q}, and 10${sup(n + d)} ÷ 10${sup(n)} = 10${sup(d)}. So ${q} × ${fmt(ipow(10, d))} = ${fmt(ans)} times.`);
    } },
    c: { t: 'order', g: R => {
      const vals = find(() => { const n = R.int(-4, 6); return [0, 1, 2].map(() => sciPick(R, n - 2, n + 2)); }, V3 => new Set(V3.map(v => v.v)).size === 3 && new Set(V3.map(v => v.n)).size >= 2 && V3.every(v => v.n !== 0));
      const L = ['A', 'B', 'C'], order = [0, 1, 2].sort((i, j) => vals[i].v - vals[j].v), right = order.map(i => L[i]).join(', ');
      const byCoef = [0, 1, 2].sort((i, j) => vals[i].a - vals[j].a || vals[i].n - vals[j].n).map(i => L[i]).join(', ');
      const others = ['A, B, C', 'A, C, B', 'B, A, C', 'B, C, A', 'C, A, B', 'C, B, A'].filter(x => x !== right && x !== byCoef);
      return choice(R, `Put in order, smallest first. A = ${sciH(vals[0].a, vals[0].n)}, B = ${sciH(vals[1].a, vals[1].n)}, C = ${sciH(vals[2].a, vals[2].n)}.`, right, [byCoef, ...R.sample(others, 2)],
        `Sort by the power of ten first, then by the front number: ${order.map(i => `${sciH(vals[i].a, vals[i].n)}`).join(' &lt; ')}.`);
    } },
    d: { t: 'orders of magnitude', g: R => {
      const near = (up, n) => up ? { a: R.pick([7, 8, 9, 7.5, 8.5, 9.5]), n: n - 1, p: n } : { a: R.pick([1, 1.2, 1.5, 2, 2.5]), n, p: n };
      if (R.bool(0.4)) { const up = R.bool(), n = R.int(-5, 9), X = near(up, n);
        return num(`${sciH(X.a, X.n)} is closest to which power of ten, 10<sup><i>n</i></sup>?`, [{ label: 'n =', ans: X.p }], up ? `${fmt(X.a)} is close to 10, so ${sciH(X.a, X.n)} ≈ 10 × 10${sup(X.n)} = 10${sup(X.p)}.` : `${fmt(X.a)} is close to 1, so ${sciH(X.a, X.n)} ≈ 10${sup(X.p)}.`); }
      const [n1, n2] = find(() => [R.int(-6, 12), R.int(-6, 12)], ([p, q]) => p - q >= 2), A = near(R.bool(), n1), B = near(R.bool(), n2);
      return num(`About how many times bigger is ${sciH(A.a, A.n)} than ${sciH(B.a, B.n)}? Give it as 10<sup><i>n</i></sup>.`, [{ label: 'n =', ans: n1 - n2 }], `${sciH(A.a, A.n)} ≈ 10${sup(n1)} and ${sciH(B.a, B.n)} ≈ 10${sup(n2)}. 10${sup(n1)} ÷ 10${sup(n2)} = 10${sup(n1 - n2)}.`);
    } },
  } });

  /* ================= III.4.11 Square roots ================= */
  const sq = x => `√${x}`;
  const isSq = x => Number.isInteger(Math.sqrt(x));
  E3.skill({ id: 'III.4.11', name: 'Square roots', steps: {
    a: { t: 'perfect squares', g: R => {
      const n = R.int(4, 15), kind = R.int(0, 2);
      if (kind === 0) return num(`What is ${pw(n, 2)}?`, n * n, `${n} × ${n} = ${n * n}. So ${n * n} is a perfect square.`);
      if (kind === 1) return choice(R, `Which number is a perfect square?`, String(n * n), [n * n + 1, n * n - 1, n * (n + 1), 2 * n * n, n * n + n - 1].filter(x => !isSq(x)).slice(0, 3).map(String), `${n * n} = ${n} × ${n}. The others are not a whole number times itself.`);
      const k = R.int(2, 10); return num(`A square is made of ${k * k} small squares. How many small squares are along each side?`, k, `${k} × ${k} = ${k * k}, so each side has ${k}.`, { visual: V.grid(k, k, { size: Math.min(26, Math.floor(200 / k)) }) });
    } },
    b: { t: 'the √ sign', g: R => {
      const n = R.int(2, 15), kind = R.int(0, 2);
      if (kind === 0) return num(`Evaluate ${sq(n * n)}.`, n, `${n} × ${n} = ${n * n}, so ${sq(n * n)} = ${n}.`);
      if (kind === 1) { const e = R.int(2, 10) * 2, v = e * e; return choice(R, `What is ${sq(v)}?`, String(e), [String(v / 2), String(v / 4), String(e * 2)], `${e} × ${e} = ${v}, so ${sq(v)} = ${e}. It is not half of ${v}.`); }
      const a = R.int(2, 10), b = R.int(2, 10); return num(`Evaluate ${sq(a * a)} + ${sq(b * b)}.`, a + b, `${sq(a * a)} = ${a} and ${sq(b * b)} = ${b}: ${a} + ${b} = ${a + b}.`);
    } },
    c: { t: 'undoing a square', g: (R, O) => {
      const n = R.int(2, 15), kind = R.int(0, 2), u = unitsL(O);
      if (kind === 0) return num(`A square has area ${n * n} ${u.area}. How long is each side, in ${u.len}?`, n, `Side × side = ${n * n}. ${n} × ${n} = ${n * n}, so the side is ${sq(n * n)} = ${n} ${u.len}.`, { visual: V4.square(`${n * n} ${u.area}`) });
      if (kind === 1) { const x = R.int(2, 30); return num(`Evaluate (${sq(x)})${sup(2)}.`, x, `Squaring undoes the square root: (${sq(x)})² = ${x}.`); }
      return num(`Evaluate ${sq(`(${n}${sup(2)})`)}.`, n, `${pw(n, 2)} = ${n * n}, and ${sq(n * n)} = ${n}. The root undoes the square.`);
    } },
    d: { t: 'solve x² = 49', g: R => {
      const n = R.int(2, 12), kind = R.int(0, 2), X = vi('x');
      if (kind === 0) return num(`Solve ${X}² = ${n * n}. Give both solutions.`, [{ label: 'positive x =', ans: n }, { label: 'negative x =', ans: -n }], `${n}² = ${n * n} and (−${n})² = ${n * n}, so ${X} = ${n} or ${X} = −${n}.`);
      if (kind === 1) { const c = R.int(1, 20); return num(`Solve ${X}² + ${c} = ${n * n + c}. Give both solutions.`, [{ label: 'positive x =', ans: n }, { label: 'negative x =', ans: -n }], `Subtract ${c}: ${X}² = ${n * n}. So ${X} = ${n} or ${X} = −${n}.`); }
      return choice(R, `Solve ${X}² = ${n * n}.`, `${X} = ${n} or ${X} = −${n}`, [`${X} = ${n} only`, `${X} = ${n * n / 2}`, `${X} = −${n} only`], `Both ${n} × ${n} and (−${n}) × (−${n}) give ${n * n}.`);
    } },
  } });

  /* ================= III.4.12 Cube roots ================= */
  const cr = x => `∛${x}`;
  E3.skill({ id: 'III.4.12', name: 'Cube roots', steps: {
    a: { t: 'perfect cubes', g: R => {
      const n = R.int(2, 10), kind = R.int(0, 1);
      if (kind === 0) return num(`What is ${pw(n, 3)}?`, n * n * n, `${n} × ${n} × ${n} = ${n * n * n}. So ${n * n * n} is a perfect cube.`);
      return choice(R, `Which number is a perfect cube?`, String(n ** 3), [n * n, 3 * n, n ** 3 + 1, n ** 3 - 1].filter(x => !Number.isInteger(Math.round(Math.cbrt(x))) || Math.round(Math.cbrt(x)) ** 3 !== x).slice(0, 3).map(String), `${n ** 3} = ${n} × ${n} × ${n}.`);
    } },
    b: { t: 'the notation', g: (R, O) => {
      const n = R.int(2, 10), kind = R.int(0, 2), u = unitsL(O);
      if (kind === 0) return num(`Evaluate ${cr(n ** 3)}.`, n, `${n} × ${n} × ${n} = ${n ** 3}, so ${cr(n ** 3)} = ${n}.`);
      if (kind === 1) { const m = R.pick([3, 6, 9]); return choice(R, `What is ${cr(m ** 3)}?`, String(m), [String(m ** 3 / 3), String(m * m), String(Math.round(m ** 1.5))].filter(x => x !== String(m)), `${m} × ${m} × ${m} = ${m ** 3}. Dividing by 3 is not a cube root.`); }
      return num(`A cube has volume ${n ** 3} ${u.vol}. How long is each edge, in ${u.len}?`, n, `Edge × edge × edge = ${n ** 3}, so the edge is ${cr(n ** 3)} = ${n} ${u.len}.`, { visual: V4.cube(`${n ** 3} ${u.vol}`) });
    } },
    c: { t: 'negative cube roots', g: R => {
      const n = R.int(1, 8), kind = R.int(0, 2);
      if (kind === 0) return num(`Evaluate ${cr(`(−${n ** 3})`)}.`, -n, `(−${n}) × (−${n}) × (−${n}) = −${n ** 3}, so ${cr(`(−${n ** 3})`)} = −${n}.`);
      if (kind === 1) return choice(R, `What is ${cr(`(−${n ** 3})`)}?`, N(-n), [String(n), 'It does not exist', n > 1 ? `−${n * n}` : '−3'], `(−${n})³ = −${n ** 3}. A negative number has a negative cube root.`);
      const a = R.int(1, 5), b = R.int(1, 5); return num(`Evaluate ${cr(a ** 3)} + ${cr(`(−${b ** 3})`)}.`, a - b, `${cr(a ** 3)} = ${a} and ${cr(`(−${b ** 3})`)} = −${b}: ${a} − ${b} = ${N(a - b)}.`);
    } },
    d: { t: 'solve x³ = 27', g: R => {
      const n = R.int(2, 6) * (R.bool(0.3) ? -1 : 1), kind = R.int(0, 2), X = vi('x'), c = n ** 3;
      if (kind === 0) return num(`Solve ${X}³ = ${N(c)}.`, [{ label: 'x =', ans: n }], `${N(n)} × ${N(n)} × ${N(n)} = ${N(c)}, so ${X} = ${N(n)}. There is only one solution.`);
      if (kind === 1) { const k = R.int(2, 4); return num(`Solve ${k}${X}³ = ${N(k * c)}.`, [{ label: 'x =', ans: n }], `Divide by ${k}: ${X}³ = ${N(c)}. So ${X} = ${cr(N(c))} = ${N(n)}.`); }
      return choice(R, `Solve ${X}³ = ${N(c)}.`, `${X} = ${N(n)} only`, [`${X} = ${Math.abs(n)} or ${X} = −${Math.abs(n)}`, `${X} = ${N(c % 3 === 0 ? c / 3 : n * n)}`, `${X} = ${N(-n)} only`], `${N(n)}³ = ${N(c)}, but ${N(-n)}³ = ${N(-c)}. A cube keeps the sign, so there is one solution.`);
    } },
  } });

  /* ================= III.4.13 Estimate roots ================= */
  const sq4 = x => { const k = Math.round(x * 100); return String(k * k / 10000); };   // exact square of a 2-dp number
  const nonSq = (R, lo, hi) => find(() => R.int(lo, hi), x => !isSq(x));
  E3.skill({ id: 'III.4.13', name: 'Estimate roots', steps: {
    a: { t: 'between which integers', g: R => {
      const x = nonSq(R, 3, 150), lo = Math.floor(Math.sqrt(x));
      if (R.bool(0.3) && x % 2 === 0 && x > 20) return choice(R, `Between which two whole numbers is ${sq(x)}?`, `${lo} and ${lo + 1}`, [`${x / 2 - 1} and ${x / 2 + 1}`, `${x - 1} and ${x + 1}`, `${lo - 1} and ${lo}`], `${pw(lo, 2)} = ${lo * lo} and ${pw(lo + 1, 2)} = ${(lo + 1) ** 2}. ${x} is between them, so ${sq(x)} is between ${lo} and ${lo + 1}, not near ${x / 2}.`);
      return num(`${sq(x)} is between which two whole numbers?`, [{ label: `${sq(x)} is between`, ans: lo }, { label: 'and', ans: lo + 1 }], `${pw(lo, 2)} = ${lo * lo} &lt; ${x} &lt; ${(lo + 1) ** 2} = ${pw(lo + 1, 2)}, so ${lo} &lt; ${sq(x)} &lt; ${lo + 1}.`);
    } },
    b: { t: 'to one decimal place', g: R => {
      const x = find(() => nonSq(R, 2, 99), x => { const d = Math.sqrt(x) * 10 % 1; return Math.abs(d - 0.5) > 0.15; }), r = Math.round(Math.sqrt(x) * 10) / 10, t = Math.floor(Math.sqrt(x) * 10) / 10;
      return num(`Estimate ${sq(x)} to one decimal place.`, r, `${fmt(t)}² = ${fmt(t * t)} and ${fmt(t + 0.1)}² = ${fmt((t + 0.1) ** 2)}, so ${sq(x)} is between ${fmt(t)} and ${fmt(t + 0.1)}. ${fmt(t + 0.05)}² = ${sq4(t + 0.05)} is ${(t + 0.05) ** 2 > x ? 'more' : 'less'} than ${x}, so ${sq(x)} ≈ ${fmt(r)}.`);
    } },
    c: { t: 'on a number line', g: R => {
      const x = find(() => nonSq(R, 3, 99), x => { const f = Math.sqrt(x) % 1; return f > 0.15 && f < 0.85; }), s = Math.sqrt(x), lo = Math.floor(s) - 1, hi = Math.floor(s) + 2;
      const pts = R.shuffle([s, Math.floor(s) + (s % 1 < 0.5 ? 0.85 : 0.15), R.bool() ? s + 1 : s - 1]), idx = pts.indexOf(s);
      return choiceFixed(`Which letter marks ${sq(x)} best?`, LETS.slice(0, pts.length), idx, `${Math.floor(s) ** 2} &lt; ${x} &lt; ${Math.ceil(s) ** 2}, so ${sq(x)} is between ${Math.floor(s)} and ${Math.ceil(s)}, ${s % 1 < 0.5 ? 'nearer' : 'further from'} ${Math.floor(s)}${s % 1 < 0.5 ? '' : ', nearer ' + Math.ceil(s)}.`, { visual: V4.line(lo, hi, pts.map((v, i) => [v, LETS[i]])) });
    } },
    d: { t: 'refine by squaring', g: R => {
      const x = find(() => nonSq(R, 2, 99), x => { const d = Math.sqrt(x) * 10 % 1; return Math.abs(d - 0.5) > 0.12 && d > 0.05 && d < 0.95; }), t = Math.floor(Math.sqrt(x) * 10) / 10, t2 = r3(t + 0.1);
      if (R.bool()) return num(`${sq(x)} is between which two numbers with one decimal place? Square to check.`, [{ label: `${sq(x)} is between`, ans: t }, { label: 'and', ans: t2 }], `${fmt(t)}² = ${fmt(t * t)} &lt; ${x} and ${fmt(t2)}² = ${fmt(t2 * t2)} &gt; ${x}.`);
      const closer = x - t * t < t2 * t2 - x ? 0 : 1;
      return choiceFixed(`${fmt(t)}² = ${fmt(t * t)} and ${fmt(t2)}² = ${fmt(t2 * t2)}. Which is closer to ${sq(x)}?`, [fmt(t), fmt(t2)], closer, `${x} is ${fmt(x - t * t)} above ${fmt(t * t)} and ${fmt(t2 * t2 - x)} below ${fmt(t2 * t2)}, so ${sq(x)} is closer to ${closer ? fmt(t2) : fmt(t)}.`);
    } },
  } });

  /* ---------- number pool for III.4.14–16: {h: html, rat, fam: families of N,Z,Q,Irr,R it is in, small: smallest of N/Z/Q/Irr, v} ---------- */
  const LETS = ['A', 'B', 'C', 'D'];
  const OL = d => `<span style="text-decoration:overline">${d}</span>`;
  const numPool = (R, kind) => {
    switch (kind) {
      case 'nat': { const k = R.int(2, 40); return { h: String(k), rat: 1, fam: 4, small: 0, v: k }; }
      case 'neg': { const k = R.int(1, 30); return { h: N(-k), rat: 1, fam: 3, small: 1, v: -k }; }
      case 'frac': { const [p, q] = find(() => [R.int(1, 9), R.int(2, 9)], ([p, q]) => p % q !== 0 && E3.gcd(p, q) === 1), neg = R.bool(0.3); return { h: (neg ? '−' : '') + fh(p, q), rat: 1, fam: 2, small: 2, v: (neg ? -1 : 1) * p / q }; }
      case 'dec': { const d = R.int(1, 99) / R.pick([10, 100]); if (Number.isInteger(d)) return numPool(R, 'dec'); return { h: fmt(d), rat: 1, fam: 2, small: 2, v: d }; }
      case 'rep': { const a = R.int(0, 3), d = R.int(1, 9); return { h: `${a}.${OL(d)}`, rat: 1, fam: 2, small: 2, v: a + d / 9 }; }
      case 'sqsq': { const k = R.int(2, 12); return { h: sq(k * k), rat: 1, fam: 4, small: 0, v: k }; }
      case 'sqn': { const k = nonSq(R, 2, 60); return { h: sq(k), rat: 0, fam: 2, small: 3, v: Math.sqrt(k) }; }
      case 'pi': { const c = R.pick([1, 1, 2, 3]); return { h: c === 1 ? 'π' : `${c}π`, rat: 0, fam: 2, small: 3, v: c * Math.PI }; }
    }
  };
  const KINDS = ['nat', 'neg', 'frac', 'dec', 'rep', 'sqsq', 'sqn', 'pi'];
  const FAM = ['natural numbers', 'integers', 'rational numbers', 'irrational numbers'];

  /* ================= III.4.14 Irrational numbers ================= */
  E3.skill({ id: 'III.4.14', name: 'Irrational numbers', steps: {
    a: { t: 'not a fraction', g: R => {
      const irr = numPool(R, R.pick(['sqn', 'sqn', 'pi'])), rats = [numPool(R, 'dec'), numPool(R, 'rep'), numPool(R, 'sqsq'), numPool(R, 'neg'), numPool(R, 'frac')];
      const ds = R.sample(rats, 3);
      return choice(R, `Which number can NOT be written as a fraction of two integers?`, irr.h, ds.map(d => d.h), `${irr.h} is irrational: its decimals never end or repeat. ${ds.map(d => d.h).join(', ')} can all be written as fractions.`);
    } },
    b: { t: '√2 and π', g: R => {
      const kind = R.int(0, 3);
      if (kind === 0) return choice(R, `Which statement about π is true?`, `π = 3.14159…, and its decimals never end or repeat.`, [`π is exactly ${fh(22, 7)}.`, `π is exactly 3.14.`, `π = 3.141414…, repeating.`], `${fh(22, 7)} and 3.14 are only rational approximations of π.`);
      if (kind === 1) { const [n, s] = R.pick([[2, 1.41421], [3, 1.73205], [5, 2.23607]]), lo = Math.floor(s * 100) / 100;
        return choice(R, `${sq(n)} = ${s}… Between which two numbers is it?`, `${fmt(lo)} and ${fmt(lo + 0.01)}`, [`${fmt(lo + 0.01)} and ${fmt(lo + 0.02)}`, `${fmt(Math.floor(s * 10) / 10 + 0.1)} and ${fmt(Math.floor(s * 10) / 10 + 0.2)}`, `${n / 2} and ${n / 2 + 1}`], `${fmt(lo)}² = ${sq4(lo)} &lt; ${n} &lt; ${sq4(lo + 0.01)} = ${fmt(lo + 0.01)}².`); }
      if (kind === 2) { const n = R.pick([2, 3, 5, 6, 7]); return num(`Evaluate ${sq(n)} × ${sq(n)}.`, n, `${sq(n)} is the number whose square is ${n}, so ${sq(n)} × ${sq(n)} = ${n}, exactly.`); }
      if (R.bool()) return tf(`${fh(22, 7)} is close to π, but not equal to it.`, true, `${fh(22, 7)} = 3.142857… and π = 3.141592… They differ in the third decimal place. ${fh(22, 7)} is rational; π is not.`);
      return tf(`${fh(22, 7)} = π exactly.`, false, `${fh(22, 7)} = 3.142857… and π = 3.141592… They differ in the third decimal place. ${fh(22, 7)} is rational; π is not.`);
    } },
    c: { t: 'decimals that never repeat', g: R => {
      const d1 = R.int(1, 9), d2 = find(() => R.int(0, 9), d => d !== d1), k = R.int(1, 3);
      let grow = '0.'; for (let i = 1; grow.length < 16; i++) grow += String(d1) + String(d2).repeat(i);   // 0.1 2 1 22 1 222 … never repeats
      const rep = `0.${String(d1) + String(d2)}${String(d1) + String(d2)}${String(d1) + String(d2)}…`, term = fmt(R.int(1, 999) / 1000), rep1 = `${k}.${String(d2).repeat(5)}…`;
      if (R.bool()) return choice(R, `Which decimal is irrational?`, `${grow}… (pattern keeps growing)`, [`${rep} (repeats ${d1}${d2})`, term, `${rep1} (repeats ${d2})`], `A decimal that ends or repeats is rational. ${grow}… never falls into a repeating block, so it is irrational.`);
      return choice(R, `Which decimal is rational?`, `${rep} (repeats ${d1}${d2})`, [`${grow}… (pattern keeps growing)`, `${sq(R.pick([2, 3, 5, 7]))} = …`, `π = 3.14159…`], `${rep} repeats the block ${d1}${d2} forever, so it equals a fraction: ${fh(d1 * 10 + d2, 99)}.`);
    } },
    d: { t: 'classify numbers', g: R => {
      const x = numPool(R, R.bool() ? R.pick(['sqn', 'sqn', 'pi']) : R.pick(['nat', 'neg', 'frac', 'dec', 'rep', 'sqsq']));
      return choiceFixed(`Is ${x.h} rational or irrational?`, ['Rational', 'Irrational'], x.rat ? 0 : 1, x.rat ? `${x.h} can be written as a fraction of integers${x.h.startsWith('√') ? ` (it equals ${fmt(x.v)})` : ''}, so it is rational.` : `${x.h} is not a fraction of integers: its decimals never end or repeat.`);
    } },
  } });

  /* ================= III.4.15 The real number system ================= */
  // nested diagram: R contains Q (contains Z, contains N) and the irrationals; regions carry letters
  V4.nest = function () {
    const r = (x, y, w, h, c, t, lx, ly) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="${c}22" stroke="${c}" stroke-width="2"/>` + V.text(lx, ly, t, { size: 13, weight: 700, fill: C.ink, anchor: 'start' });
    let b = r(4, 4, 432, 232, C.muted, 'Real numbers', 16, 20) + r(16, 32, 280, 196, C.blue, 'Rational', 28, 48) + r(28, 60, 200, 160, C.teal, 'Integers', 40, 76) + r(40, 88, 120, 124, C.amber, 'Natural', 52, 104)
      + r(306, 32, 120, 196, C.violet, 'Irrational', 318, 48);
    [['A', 100, 160], ['B', 194, 160], ['C', 262, 160], ['D', 366, 140]].forEach(([t, x, y]) => b += V.dot(x, y, 15, C.paper) + `<circle cx="${x}" cy="${y}" r="15" fill="none" stroke="${C.ink}" stroke-width="1.5"/>` + V.text(x, y, t, { size: 15, weight: 700 }));
    return V.svg(440, 240, b, 'nested number families');
  };
  E3.skill({ id: 'III.4.15', name: 'The real number system', steps: {
    a: { t: 'naturals, integers, rationals', g: R => {
      const x = numPool(R, R.pick(['nat', 'neg', 'frac', 'dec', 'rep', 'sqsq']));
      const why = [`${x.h} is a counting number${x.h.startsWith('√') ? ` (it equals ${fmt(x.v)})` : ''}.`, `${x.h} is a whole number below 0: an integer, but not natural.`, `${x.h} is not a whole number, but it is a fraction of integers.`][x.small];
      return choiceFixed(`What is the smallest family that contains ${x.h}?`, ['Natural numbers', 'Integers', 'Rational numbers'], x.small, why);
    } },
    b: { t: 'irrationals', g: R => {
      const list = R.shuffle([numPool(R, 'sqn'), numPool(R, R.pick(['sqn', 'pi', 'sqsq'])), numPool(R, 'sqsq'), numPool(R, R.pick(['frac', 'rep', 'dec'])), numPool(R, R.pick(['pi', 'rep', 'neg']))]);
      const k = list.filter(x => !x.rat).length, hs = list.map(x => x.h);
      if (new Set(hs).size < 5) return E3.byId['III.4.15'].steps.b.g(R);
      return num(`How many of these numbers are irrational? ${hs.join(', ')}`, k, `Irrational: ${list.filter(x => !x.rat).map(x => x.h).join(', ') || 'none'}. The rest can be written as fractions${list.some(x => x.h.startsWith('√') && x.rat) ? ' (a root of a perfect square is a whole number)' : ''}.`);
    } },
    c: { t: 'the nested diagram', g: R => {
      const x = numPool(R, R.pick(KINDS)), reg = x.small;
      return choiceFixed(`Where does ${x.h} go in the diagram?`, LETS, reg, [`${x.h} is natural, so it goes in the innermost box, A.`, `${x.h} is an integer but not natural: B.`, `${x.h} is rational but not an integer: C.`, `${x.h} is irrational, outside the rationals: D.`][reg], { visual: V4.nest() });
    } },
    d: { t: 'classify', g: R => {
      const x = numPool(R, R.pick(KINDS));
      const list = [['natural', x.small === 0], ['integer', x.small <= 1], ['rational', x.rat], ['irrational', !x.rat], ['real', true]].filter(f => f[1]).map(f => f[0]);
      return num(`${x.h} belongs to how many of these families: natural, integer, rational, irrational, real?`, x.fam, `${x.h} is ${list.join(', ')}: ${x.fam} families. The families nest, so a number can be in several at once.`);
    } },
  } });

  /* ================= III.4.16 Compare irrationals ================= */
  const SIG = ['&lt;', '=', '&gt;'];
  const apx = p => (p.rat && Number.isInteger(Math.round(p.v * 1e6) / 1e4) ? '= ' : '≈ ') + fmt(Math.round(p.v * 100) / 100);
  E3.skill({ id: 'III.4.16', name: 'Compare irrationals', steps: {
    a: { t: 'with approximations', g: R => {
      const kind = R.int(0, 2);
      if (kind === 0) { const x = nonSq(R, 3, 99), s = Math.sqrt(x), d = find(() => Math.round((s + (R.bool() ? 1 : -1) * R.int(1, 4) / 10) * 10) / 10, d => Math.abs(d * d - x) > 0.3), c = s < d ? 0 : 2;
        return choiceFixed(`Compare: ${sq(x)} ? ${fmt(d)}`, SIG, c, `Square both: ${fmt(d)}² = ${fmt(d * d)}, which is ${d * d > x ? 'more' : 'less'} than ${x}. So ${sq(x)} ${SIG[c]} ${fmt(d)}.`); }
      if (kind === 1 && R.bool()) { const [a, b] = R.sample([2, 3, 5, 6, 7], 2).sort((p, q) => p - q);
        return choiceFixed(`Compare: ${sq(a)} × ${sq(b)} ? ${sq(a * b)}`, SIG, 1, `Roots multiply: ${sq(a)} × ${sq(b)} = ${sq(a * b)}, since (${sq(a)} × ${sq(b)})² = ${a} × ${b} = ${a * b}. (They don't add, though.)`); }
      if (kind === 1) { const [a, b] = R.sample([2, 3, 5, 6, 7, 8], 2).sort((p, q) => p - q);
        return choiceFixed(`Compare: ${sq(a)} + ${sq(b)} ? ${sq(a + b)}`, SIG, 2, `${sq(a)} ≈ ${fmt(Math.round(Math.sqrt(a) * 1000) / 1000)} and ${sq(b)} ≈ ${fmt(Math.round(Math.sqrt(b) * 1000) / 1000)}, sum ≈ ${fmt(Math.round((Math.sqrt(a) + Math.sqrt(b)) * 100) / 100)}. But ${sq(a + b)} ≈ ${fmt(Math.round(Math.sqrt(a + b) * 100) / 100)}. Roots don't add.`); }
      const [A, vA, B, vB] = R.pick([['π', Math.PI, sq(10), Math.sqrt(10)], ['π', Math.PI, fh(22, 7), 22 / 7], ['π', Math.PI, '3.14', 3.14], [sq(2), Math.SQRT2, '1.4', 1.4], [sq(3), Math.sqrt(3), fh(7, 4), 1.75], ['π', Math.PI, sq(9), 3], [sq(2), Math.SQRT2, '1.5', 1.5], ['π', Math.PI, '3.15', 3.15]]), c = vA < vB ? 0 : 2;
      return choiceFixed(`Compare: ${A} ? ${B}`, SIG, c, `${A} ≈ ${fmt(Math.round(vA * 1000) / 1000)} and ${B} ${Number.isInteger(vB * 100) ? '=' : '≈'} ${fmt(Math.round(vB * 1000) / 1000)}. So ${A} ${SIG[c]} ${B}.`);
    } },
    b: { t: 'on a number line', g: R => {
      const pts = find(() => R.shuffle([numPool(R, 'sqn'), numPool(R, 'sqn'), numPool(R, R.pick(['pi', 'frac', 'dec']))]), P => P.every(p => p.v > 0.5 && p.v < 7.5) && P.every((p, i) => P.every((q, j) => i >= j || Math.abs(p.v - q.v) > 0.35)));
      const target = R.int(0, 2), lo = Math.floor(Math.min(...pts.map(p => p.v))), hi = Math.ceil(Math.max(...pts.map(p => p.v))) + (Math.ceil(Math.max(...pts.map(p => p.v))) - lo < 3 ? 1 : 0);
      const lab = p => p.h === fmt(Math.round(p.v * 100) / 100) ? p.h : `${p.h} ${apx(p)}`;
      return choiceFixed(`The letters mark ${pts.map(p => p.h).join(', ')} in some order. Which letter is ${pts[target].h}?`, LETS.slice(0, 3), target, `From left to right: ${[...pts].sort((p, q) => p.v - q.v).map(lab).join(' &lt; ')}. So ${pts[target].h} is at ${LETS[target]}.`, { visual: V4.line(lo, hi, pts.map((p, i) => [p.v, LETS[i]])) });
    } },
    c: { t: 'order mixed lists', g: R => {
      const vals = find(() => [numPool(R, 'sqn'), numPool(R, R.pick(['pi', 'sqn'])), numPool(R, R.pick(['frac', 'dec', 'nat']))], V3 => new Set(V3.map(v => v.h)).size === 3 && V3.every((p, i) => V3.every((q, j) => i >= j || Math.abs(p.v - q.v) > 0.05)) && V3.every(v => v.v > 0 && v.v < 10));
      const L = ['A', 'B', 'C'], order = [0, 1, 2].sort((i, j) => vals[i].v - vals[j].v), right = order.map(i => L[i]).join(', ');
      const others = ['A, B, C', 'A, C, B', 'B, A, C', 'B, C, A', 'C, A, B', 'C, B, A'].filter(x => x !== right);
      return choice(R, `Put in order, smallest first. A = ${vals[0].h}, B = ${vals[1].h}, C = ${vals[2].h}.`, right, R.sample(others, 3),
        `Approximate: ${vals.map((v, i) => `${L[i]} ${apx(v)}`).join(', ')}. So ${right}.`);
    } },
    d: { t: 'which is closer', g: R => {
      if (R.bool(0.6)) { const x = find(() => nonSq(R, 3, 150), x => Math.abs(Math.sqrt(x) % 1 - 0.5) > 0.08), lo = Math.floor(Math.sqrt(x)), up = Math.sqrt(x) % 1 > 0.5, h = lo + 0.5;
        return choiceFixed(`Is ${sq(x)} closer to ${lo} or to ${lo + 1}?`, [String(lo), String(lo + 1)], up ? 1 : 0, `The halfway point is ${fmt(h)}, and ${fmt(h)}² = ${fmt(h * h)}. ${x} is ${x > h * h ? 'above' : 'below'} it, so ${sq(x)} is closer to ${up ? lo + 1 : lo}.`); }
      const k = R.int(2, 9), a = find(() => nonSq(R, (k - 1) ** 2 + 1, k * k - 1), () => true), b = find(() => nonSq(R, k * k + 1, (k + 1) ** 2 - 1), () => true), da = k - Math.sqrt(a), db = Math.sqrt(b) - k;
      if (Math.abs(da - db) < 0.05) return E3.byId['III.4.16'].steps.d.g(R);
      return choiceFixed(`Which is closer to ${k}: ${sq(a)} or ${sq(b)}?`, [sq(a), sq(b)], da < db ? 0 : 1, `${sq(a)} ≈ ${fmt(Math.round(Math.sqrt(a) * 100) / 100)} is ${fmt(Math.round(da * 100) / 100)} away; ${sq(b)} ≈ ${fmt(Math.round(Math.sqrt(b) * 100) / 100)} is ${fmt(Math.round(db * 100) / 100)} away.`);
    } },
  } });

  /* ================= III.4.17 Growth with exponents ================= */
  E3.skill({ id: 'III.4.17', name: 'Growth with exponents', steps: {
    a: { t: 'doubling', g: R => {
      const s = R.int(2, 12), n = R.int(3, 8), T = R.pick([['A pond has', 'lily pads', 'week'], ['A jar has', 'bacteria', 'hour'], ['A story is shared with', 'people', 'day']]);
      const p = `${T[0]} ${s} ${T[1]}. The number doubles every ${T[2]}. How many after ${n} ${T[2]}s?`, e = `${s} × ${Array(n).fill(2).join(' × ')} = ${s} × ${pw(2, n)} = ${fmt(s * ipow(2, n))}.`;
      if (R.bool(0.35)) return choice(R, p, fmt(s * ipow(2, n)), [fmt(s + 2 * n), fmt(s * 2 * n), fmt(s * ipow(2, n - 1))].filter(v => v !== fmt(s * ipow(2, n))), e + ' Doubling multiplies each time; it does not add 2.');
      return num(p, s * ipow(2, n), e);
    } },
    b: { t: 'powers of 2', g: R => {
      const n = R.int(3, 12), v = ipow(2, n), kind = R.int(0, 2);
      if (kind === 0) return num(`What is ${pw(2, n)}?`, v, `Keep doubling: ${Array.from({ length: n }, (_, i) => fmt(ipow(2, i + 1))).join(', ')}.`);
      if (kind === 1) return num(`${fmt(v)} = 2<sup><i>n</i></sup>. What is <i>n</i>?`, [{ label: 'n =', ans: n }], `Count the doublings from 1: ${Array.from({ length: n }, (_, i) => fmt(ipow(2, i + 1))).join(', ')}. That is ${n}, so ${fmt(v)} = ${pw(2, n)}.`);
      return choice(R, `What is ${pw(2, n)}?`, fmt(v), [String(2 * n), fmt(n * n), fmt(v / 2)], `${pw(2, n)} means ${n} twos multiplied: ${fmt(v)}. Not 2 × ${n}.`);
    } },
    c: { t: 'linear vs exponential tables', g: R => {
      const exp = R.bool(), a = R.int(1, 5), r = R.int(2, 3), d = R.int(2, 9), ys = [0, 1, 2, 3, 4].map(x => exp ? a * ipow(r, x) : a + d * x);
      if (R.bool()) return choiceFixed(`Is this growth linear or exponential?`, ['Linear', 'Exponential'], exp ? 1 : 0, exp ? `Each step multiplies by ${r}: ${ys.slice(0, 3).join(', ')}, … The amount added keeps growing.` : `Each step adds ${d}: ${ys.slice(0, 3).join(', ')}, … Same amount every time.`, { visual: V4.table([['x', 0, 1, 2, 3, 4], ['y', ...ys]]) });
      const nxt = exp ? a * ipow(r, 5) : a + d * 5;
      return num(`Find the next value, at ${vi('x')} = 5.`, nxt, exp ? `Each step multiplies by ${r}: ${ys[4]} × ${r} = ${nxt}.` : `Each step adds ${d}: ${ys[4]} + ${d} = ${nxt}.`, { visual: V4.table([['x', 0, 1, 2, 3, 4, 5], ['y', ...ys, '?']]) });
    } },
    d: { t: 'real examples', g: (R, O) => {
      const kind = R.int(0, 2);
      if (kind === 0) { const s = R.int(2, 9) * 10, h = R.int(2, 5); return num(`A culture starts with ${s} bacteria and triples every hour. How many after ${h} hours?`, s * ipow(3, h), `${s} × ${pw(3, h)} = ${s} × ${ipow(3, h)} = ${fmt(s * ipow(3, h))}.`); }
      if (kind === 1) { const k = R.int(10, 60) * (O.coins === 'THB' ? 10 : 1), c = O.coins === 'THB' ? 10 : 1; let day = 1; while (c * ipow(2, day) <= k * day) day++;
        return num(`Plan A pays ${money(k, O)} every day. Plan B pays ${money(2 * c, O)} on day 1, then doubles the day's pay each day. On which day does B's day pay first beat A's total so far?`, day, `Day ${day - 1}: B ${fmt(c * ipow(2, day - 1))}, A total ${fmt(k * (day - 1))}. Day ${day}: B ${fmt(c * ipow(2, day))}, A total ${fmt(k * day)}. B wins from day ${day}.`); }
      const n = R.int(3, 7), th = imp(O) ? 0.004 : 0.1, u = imp(O) ? 'in' : 'mm';
      return num(`A sheet of paper is ${th} ${u} thick. Each fold doubles the thickness. How thick is it after ${n} folds, in ${u}?`, r3(th * ipow(2, n)), `${th} × ${pw(2, n)} = ${th} × ${ipow(2, n)} = ${fmt(th * ipow(2, n))} ${u}.`);
    } },
  } });

  /*__NEXT__*/
})();

/* Era III · Unit III.5 Expressions (III.5.01–III.5.15)
   Local helpers live under V5 / small functions inside this file. */
(function(){ const {num, choice, choiceFixed, tf, frac, fh, fmt, m, V, C} = E3;
const LET = ['x', 'n', 'y', 'a', 'k', 't', 'p', 'b'];
const money = (O, n) => O.coins === 'THB' ? `${fmt(n)} baht` : `$${fmt(n)}`;
const cur = O => O.coins === 'THB' ? 'baht' : 'dollars';
const len = O => O.units === 'imperial' ? 'in' : 'cm';
// m() plus italics for runs of variables like xy, ab
const mm = s => m(s).replace(/(^|[^a-zA-Z<\/&;])([a-z]{2,3})(?![a-zA-Z>;])/g, (_, p, w) => p + w.split('').map(c => `<i>${c}</i>`).join('')).replace(/\( − /g, '(−');
const sp = s => String(s).replace(/([^(^*/+\-])([+\-])/g, '$1 $2 ');
const H = s => mm(sp(s));
// ASCII with a leading quotient: n/4, (n+4)/3, n/2-3 → stacked fraction HTML
const Hx = s => { let t = /^\((.+)\)\/(\w+)$/.exec(s) || /^(\w+)\/(\w+)$/.exec(s); if (t) return fh(H(t[1]), H(t[2]));
  t = /^(\w+)\/(\w+)([+-].+)$/.exec(s); if (t) return fh(H(t[1]), H(t[2])) + H(t[3]).replace(/^([−+])/, ' $1 ');
  return H(s); };
const n2 = a => String(Math.round(a * 1000) / 1000);
const term = (c, v) => { const a = Math.abs(c); return v ? (a === 1 ? '' : n2(a)) + v : n2(a); };
// [[3,'x'],[-4,'']] → '3x-4'
const lin = ts => { let s = ''; ts.forEach(([c, v]) => { if (!c) return; s += (s ? (c < 0 ? '-' : '+') : (c < 0 ? '-' : '')) + term(c, v); }); return s || '0'; };
const L = ts => H(lin(ts));
const nz = (R, lo, hi) => { let v; do v = R.int(lo, hi); while (!v); return v; };
const f = n => fmt(n);
const pn = n => n < 0 ? `(${f(n)})` : f(n);
// replace letters by bracketed values: '3x+4y' → '3(−2)+4(5)'
const subs = (s, env) => { let o = '';
  for (let i = 0; i < s.length; i++) { const c = s[i];
    if (env[c] === undefined) { if (c === '(' && o && /[0-9)]/.test(o[o.length - 1]) && /[a-z]/.test(s[i - 1] || '')) o += '*'; o += c; continue; }
    if (o && /[0-9)]/.test(o[o.length - 1])) o += '*';
    o += env[c] < 0 ? `(${env[c]})` : String(env[c]); }
  return H(o); };
const gcd = E3.gcd;
const E = (label, expr, form) => Object.assign({expr, form: form || 'any'}, label ? {label} : {});

/* ---------- V5 visuals ---------- */
const V5 = {};
V5.table = (rows, o = {}) => {
  const cw = o.cw || (rows.length > 4 ? 56 : 66), hw = o.hw || 90, rh = 38, hd = o.head || ['n', 'term']; let body = '';
  const cell = (x, y, w, v, head) => { body += `<rect x="${x}" y="${y}" width="${w}" height="${rh}" fill="${head ? C.faint : C.paper}" stroke="${C.ink}" stroke-width="1.5"/>`;
    body += v === '?' ? `<rect x="${x + w / 2 - 16}" y="${y + 7}" width="32" height="${rh - 14}" rx="5" fill="${C.amber}"/>` + V.text(x + w / 2, y + rh / 2, '?', {size: 17, weight: 700}) : V.text(x + w / 2, y + rh / 2, String(v).replace(/-/g, '−'), {size: 17, weight: head ? 700 : 500}); };
  cell(2, 2, hw, hd[0], true); rows.forEach((r, i) => cell(2 + hw + i * cw, 2, cw, r[0]));
  cell(2, 2 + rh, hw, hd[1], true); rows.forEach((r, i) => cell(2 + hw + i * cw, 2 + rh, cw, r[1]));
  return V.svg(hw + rows.length * cw + 4, 2 * rh + 4, body, 'table');
};
// rectangle with a top label and a left label
V5.rect = (top, side, o = {}) => {
  const w = o.w || 200, h = o.h || 110, x0 = 70, y0 = 30; let b = `<rect x="${x0}" y="${y0}" width="${w}" height="${h}" fill="${C.blue}22" stroke="${C.ink}" stroke-width="2"/>`;
  b += V.text(x0 + w / 2, 14, top, {size: 16, weight: 600}) + V.text(x0 - 10, y0 + h / 2, side, {size: 16, weight: 600, anchor: 'end'});
  return V.svg(x0 + w + 20, y0 + h + 10, b, 'rectangle');
};
V5.tri = (a, b, c) => { // three side labels: left, right, bottom
  let s = `<polygon points="60,140 170,20 300,140" fill="${C.amber}22" stroke="${C.ink}" stroke-width="2"/>`;
  s += V.text(100, 72, a, {size: 16, weight: 600, anchor: 'end'}) + V.text(245, 72, b, {size: 16, weight: 600, anchor: 'start'}) + V.text(180, 160, c, {size: 16, weight: 600});
  return V.svg(360, 172, s, 'triangle');
};
// L shape: bottom block (x + a) wide, h1 tall; top block x wide, h2 tall on the left
V5.L = (bottom, top, h1, h2) => {
  const x0 = 60, y0 = 30, W = 260, w = 160, H1 = 60, H2 = 70; const yb = y0 + H2;
  let s = `<path d="M${x0} ${y0} L${x0 + w} ${y0} L${x0 + w} ${yb} L${x0 + W} ${yb} L${x0 + W} ${yb + H1} L${x0} ${yb + H1} Z" fill="${C.teal}22" stroke="${C.ink}" stroke-width="2"/>`;
  s += `<line x1="${x0}" y1="${yb}" x2="${x0 + w}" y2="${yb}" stroke="${C.muted}" stroke-dasharray="5 4"/>`;
  s += V.text(x0 + w / 2, y0 - 13, top, {size: 16, weight: 600}) + V.text(x0 + W / 2, yb + H1 + 16, bottom, {size: 16, weight: 600});
  s += V.text(x0 - 10, y0 + H2 / 2, h2, {size: 16, weight: 600, anchor: 'end'}) + V.text(x0 - 10, yb + H1 / 2, h1, {size: 16, weight: 600, anchor: 'end'});
  return V.svg(x0 + W + 20, yb + H1 + 32, s, 'L shape');
};
// two equal rectangles side by side
V5.two = (wl, hl) => {
  const x0 = 50, y0 = 28, w = 130, h = 70; let s = '';
  [0, 1].forEach(i => s += `<rect x="${x0 + i * w}" y="${y0}" width="${w}" height="${h}" fill="${C.violet}22" stroke="${C.ink}" stroke-width="2"/>` + V.text(x0 + i * w + w / 2, y0 - 13, wl, {size: 16, weight: 600}));
  s += V.text(x0 - 10, y0 + h / 2, hl, {size: 16, weight: 600, anchor: 'end'});
  return V.svg(x0 + 2 * w + 20, y0 + h + 10, s, 'two rectangles');
};
// algebra tiles. groups: [{x2, x, u}] signed counts. Positive: blue x², teal x, amber 1. Negative: red.
const TX = 46, TW = 14;
V5.tiles = (groups, o = {}) => {
  let s = '', x = 8; const top = 44, key = o.key !== false;
  if (key) { // key row
    s += `<rect x="8" y="6" width="22" height="22" fill="${C.blue}" stroke="${C.ink}"/>` + V.text(36, 17, 'x²', {size: 14, anchor: 'start'});
    s += `<rect x="70" y="10" width="30" height="${TW}" fill="${C.teal}" stroke="${C.ink}"/>` + V.text(106, 17, 'x', {size: 14, anchor: 'start'});
    s += `<rect x="130" y="10" width="${TW}" height="${TW}" fill="${C.amber}" stroke="${C.ink}"/>` + V.text(150, 17, '1', {size: 14, anchor: 'start'});
    s += `<rect x="176" y="10" width="${TW}" height="${TW}" fill="${C.red}" stroke="${C.ink}"/>` + V.text(196, 17, 'negative', {size: 14, anchor: 'start'});
  }
  groups.forEach((g, gi) => {
    if (gi > 0) { s += V.text(x + 8, top + TX / 2, o.sep || '+', {size: 22, weight: 700}); x += 26; }
    const put = (n, kind) => { const neg = n < 0; for (let i = 0; i < Math.abs(n); i++) {
      const col = neg ? C.red : kind === 'x2' ? C.blue : kind === 'x' ? C.teal : C.amber;
      if (kind === 'x2') { s += `<rect x="${x}" y="${top}" width="${TX}" height="${TX}" fill="${col}" stroke="${C.ink}" stroke-width="1.5"/>`; x += TX + 5; }
      else if (kind === 'x') { s += `<rect x="${x}" y="${top}" width="${TW}" height="${TX}" fill="${col}" stroke="${C.ink}" stroke-width="1.5"/>`; x += TW + 5; }
      else { const r = i % 3; s += `<rect x="${x}" y="${top + r * (TW + 2)}" width="${TW}" height="${TW}" fill="${col}" stroke="${C.ink}" stroke-width="1.5"/>`; if (r === 2 || i === Math.abs(n) - 1) x += TW + 5; }
    } };
    put(g.x2 || 0, 'x2'); if (g.x2) x += 4; const xp = (g.x || 0) > 0 ? g.x : 0, xn = (g.x || 0) < 0 ? g.x : 0;
    put(xp, 'x'); put(xn, 'x'); if (g.x) x += 4; const up = (g.u || 0) > 0 ? g.u : 0, un = (g.u || 0) < 0 ? g.u : 0;
    put(up, 'u'); if (up && un) x += 2; put(un, 'u'); x += 6;
  });
  return V.svg(Math.max(x + 4, 270), top + TX + 8, s, 'algebra tiles');
};
// rectangle outline for tiles: sides as lists of 'x' or '1' segments; no inside tiles drawn
V5.frame = (topSeg, sideSeg) => {
  const segL = t => t === 'x' ? 90 : 26, x0 = 50, y0 = 30; const W = topSeg.reduce((a, t) => a + segL(t), 0), Hh = sideSeg.reduce((a, t) => a + segL(t), 0);
  let s = `<rect x="${x0}" y="${y0}" width="${W}" height="${Hh}" fill="${C.faint}" stroke="${C.ink}" stroke-width="2"/>`, x = x0;
  topSeg.forEach(t => { s += `<line x1="${x}" y1="${y0 - 8}" x2="${x}" y2="${y0 + 4}" stroke="${C.ink}" stroke-width="1.5"/>` + V.text(x + segL(t) / 2, y0 - 14, t, {size: 15, weight: 600}); x += segL(t); });
  s += `<line x1="${x}" y1="${y0 - 8}" x2="${x}" y2="${y0 + 4}" stroke="${C.ink}" stroke-width="1.5"/>`;
  let y = y0; sideSeg.forEach(t => { s += `<line x1="${x0 - 8}" y1="${y}" x2="${x0 + 4}" y2="${y}" stroke="${C.ink}" stroke-width="1.5"/>` + V.text(x0 - 16, y + segL(t) / 2, t, {size: 15, weight: 600}); y += segL(t); });
  s += `<line x1="${x0 - 8}" y1="${y}" x2="${x0 + 4}" y2="${y}" stroke="${C.ink}" stroke-width="1.5"/>`;
  return V.svg(x0 + W + 16, y0 + Hh + 10, s, 'rectangle to fill with tiles');
};
// matchstick / dot patterns, shapes 1..3
V5.pattern = (kind, o = {}) => {
  const st = (x1, y1, x2, y2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${C.red}" stroke-width="4" stroke-linecap="round"/>`;
  const u = 26, need = kind === 'sq' ? u : kind === 'tri' ? u * 0.87 : kind === 'house' ? u * 1.7 : o.r * 16; let s = '', x = 24; const base = Math.round(need + 12);
  for (let n = 1; n <= 3; n++) {
    const x0 = x;
    if (kind === 'sq') { for (let i = 0; i <= n; i++) s += st(x + i * u, base - u, x + i * u, base); for (let i = 0; i < n; i++) s += st(x + i * u, base - u, x + (i + 1) * u, base - u) + st(x + i * u, base, x + (i + 1) * u, base); x += n * u; }
    else if (kind === 'tri') { const hh = u * 0.87, P = Array.from({ length: n + 2 }, (_, k) => [x + k * u / 2, k % 2 ? base - hh : base]);
      for (let k = 0; k <= n; k++) s += st(P[k][0], P[k][1], P[k + 1][0], P[k + 1][1]);
      for (let k = 0; k < n; k++) s += st(P[k][0], P[k][1], P[k + 2][0], P[k + 2][1]);
      x += (n + 1) * u / 2; }
    else if (kind === 'house') { for (let i = 0; i <= n; i++) s += st(x + i * u, base - u, x + i * u, base); for (let i = 0; i < n; i++) s += st(x + i * u, base, x + (i + 1) * u, base) + st(x + i * u, base - u, x + i * u + u / 2, base - u * 1.7) + st(x + i * u + u / 2, base - u * 1.7, x + (i + 1) * u, base - u); x += n * u; }
    else { const r = o.r, c = n + o.c, g = 16; for (let i = 0; i < r; i++) for (let j = 0; j < c; j++) s += V.dot(x + 6 + j * g, base - 6 - i * g, 5.5, C.blue); x += c * g; }
    s += V.text((x0 + x) / 2, base + 22, `shape ${n}`, {size: 13, fill: C.muted});
    x += 34;
  }
  return V.svg(x, base + 34, s, 'growing pattern');
};

/* ---------- III.5.01 Variables ---------- */
const OBJ = [['a', 'apples'], ['b', 'bananas'], ['p', 'pears'], ['c', 'cars'], ['t', 'trees'], ['d', 'dogs']];
E3.skill({ id: 'III.5.01', name: 'Variables', steps: {
  a: { t: 'a letter stands for a number', g: (R) => { const v = R.pick(LET), k = R.int(2, 9), t = R.int(0, 2);
    if (t === 0) { const it = R.pick(['marbles', 'sweets', 'coins', 'stickers', 'pencils', 'shells']);
      return choice(R, `A box holds ${mm(v)} ${it}. You put in ${k} more. Which shows how many are in the box now?`, H(`${v}+${k}`), [H(`${k}${v}`), H(`${v}-${k}`), H(`${k}`)], `The box had ${mm(v)} ${it} and gained ${k}: ${H(`${v}+${k}`)}. The letter stands for a number you can't see.`); }
    if (t === 1) { const [l, w] = R.pick(OBJ);
      return choice(R, `What does ${H(k + l)} mean?`, `${k} times a number ${mm(l)}`, [`${k} ${w}`, `${k} plus a number ${mm(l)}`, `the number ${k}${R.int(1, 9)}`], `A letter stands for a number, not a thing: ${H(k + l)} means ${k} × ${mm(l)}.`); }
    const b = R.int(k + 1, k + 15);
    return num(`${H(`${v}+${k}`)} = ${b}. What number is ${mm(v)}?`, b - k, `${b - k} + ${k} = ${b}, so ${mm(v)} stands for ${b - k}.`); } },
  b: { t: 'substitute values', g: (R) => { const v = R.pick(LET), x = R.int(2, 12), a = R.int(2, 9), b = R.int(1, 15), t = R.int(0, 4);
    const T = [[`${v}+${b}`, x + b], [`${a}${v}`, a * x], [`${v}-${b}`, x - b], [`${a}${v}+${b}`, a * x + b], [`${a}${v}-${b}`, a * x - b]][t];
    return num(`Find ${H(T[0])} when ${mm(v)} = ${x}.`, T[1], `Put ${x} in place of ${mm(v)}: ${subs(T[0], {[v]: x})} = ${f(T[1])}.`); } },
  c: { t: '"a number" in words', g: (R) => { const v = R.pick(LET), k = R.int(2, 12), t = R.int(0, 5);
    const T = [[`a number increased by ${k}`, `${v}+${k}`], [`a number decreased by ${k}`, `${v}-${k}`], [`${k} times a number`, `${k}${v}`],
      [`a number divided by ${k}`, `${v}/${k}`], [`a number plus ${k}`, `${v}+${k}`], [`a number multiplied by ${k}`, `${k}${v}`]][t];
    return num(`Write “${T[0]}” as an expression. Use ${mm(v)} for the number.`, [E('', T[1])], `“A number” becomes ${mm(v)}: ${Hx(T[1])}.`); } },
  d: { t: 'variables in formulas', g: (R, O) => { const u = len(O), t = R.int(0, 4);
    if (t === 0) { const s = R.int(3, 25); return num(`The perimeter of a square is ${mm('P = 4s')}. Find ${mm('P')} when ${mm('s')} = ${s} ${u}.`, 4 * s, `${mm('P')} = 4 × ${s} = ${4 * s} ${u}.`); }
    if (t === 1) { const l = R.int(3, 15), w = R.int(2, 12); return num(`The area of a rectangle is ${mm('A = lw')}. Find ${mm('A')} when ${mm('l')} = ${l} and ${mm('w')} = ${w}.`, l * w, `${mm('lw')} means ${mm('l')} × ${mm('w')}: ${l} × ${w} = ${l * w}.`); }
    if (t === 2) { const l = R.int(4, 20), w = R.int(2, 15); return num(`A rectangle's perimeter is ${mm('P = 2l + 2w')}. Find ${mm('P')} when ${mm('l')} = ${l} and ${mm('w')} = ${w}.`, 2 * l + 2 * w, `2 × ${l} + 2 × ${w} = ${2 * l} + ${2 * w} = ${2 * l + 2 * w}.`); }
    if (t === 3) { const r = R.pick([30, 40, 45, 50, 60, 80]), h = R.int(2, 6), U = O.units === 'imperial' ? 'miles' : 'km'; return num(`Distance is ${mm('d = rt')}: speed ${mm('r')} times time ${mm('t')}. Find ${mm('d')} in ${U} when ${mm('r')} = ${r} ${U} per hour and ${mm('t')} = ${h} hours.`, r * h, `${mm('d')} = ${r} × ${h} = ${r * h} ${U}.`); }
    const F = R.pick([['A = lw', 'l', 'the length', ['the area', 'the number 1', 'the width']], ['A = lw', 'w', 'the width', ['the area', 'the length', 'a weight']], ['P = 4s', 's', 'the side length', ['the perimeter', 'the number of sides', 'a square']], ['d = rt', 't', 'the time taken', ['the distance', 'the speed', 'the number of trips']], ['d = rt', 'r', 'the speed', ['the distance', 'the time', 'the route']]]);
    return choice(R, `In the formula ${mm(F[0])}, what does ${mm(F[1])} stand for?`, F[2], F[3], `Each letter in a formula names a quantity: in ${mm(F[0])}, ${mm(F[1])} is ${F[2]}.`); } },
}});

/* ---------- III.5.02 Expressions from words ---------- */
const wordsQ = (R, T, v) => { const [ph, ok, bad, why] = T;
  const ex = `${why ? why + ' ' : ''}${ph[0].toUpperCase() + ph.slice(1)} is ${Hx(ok)}.`;
  if (R.bool(0.4)) return choice(R, `Which expression is “${ph}”?`, Hx(ok), bad.map(Hx), ex);
  return num(`Write “${ph}” as an expression. Use ${mm(v)} for the number.`, [E('', ok)], ex); };
E3.skill({ id: 'III.5.02', name: 'Expressions from words', steps: {
  a: { t: 'sum and difference', g: (R) => { const v = R.pick(LET), k = R.int(2, 20), t = R.int(0, 4);
    const T = [[`the sum of a number and ${k}`, `${v}+${k}`, [`${k}${v}`, `${v}-${k}`, `${k}-${v}`]],
      [`the difference of a number and ${k}`, `${v}-${k}`, [`${k}-${v}`, `${v}+${k}`, `${k}${v}`], `Difference means subtract, in the order given.`],
      [`${k} added to a number`, `${v}+${k}`, [`${k}${v}`, `${v}-${k}`, `${k}-${v}`]],
      [`${k} minus a number`, `${k}-${v}`, [`${v}-${k}`, `${k}+${v}`, `${k}${v}`], `Start with ${k} and take the number away.`],
      [`a number minus ${k}`, `${v}-${k}`, [`${k}-${v}`, `${v}+${k}`, `${k}${v}`]]][t];
    return wordsQ(R, T, v); } },
  b: { t: 'product and quotient', g: (R) => { const v = R.pick(LET), k = R.int(2, 12), t = R.int(0, 4);
    const T = [[`the product of ${k} and a number`, `${k}${v}`, [`${v}+${k}`, `${v}/${k}`, `${k}-${v}`], `Product means multiply.`],
      [`the quotient of a number and ${k}`, `${v}/${k}`, [`${k}/${v}`, `${k}${v}`, `${v}-${k}`], `Quotient means divide, in the order given.`],
      [`the quotient of ${k} and a number`, `${k}/${v}`, [`${v}/${k}`, `${k}${v}`, `${k}-${v}`], `Quotient means divide: ${k} is divided by the number.`],
      [`a number divided by ${k}`, `${v}/${k}`, [`${k}/${v}`, `${k}${v}`, `${v}-${k}`]],
      [`${k} times a number`, `${k}${v}`, [`${k}+${v}`, `${v}/${k}`, `${v}^${k}`]]][t];
    return wordsQ(R, T, v); } },
  c: { t: '"more than" and "less than"', g: (R) => { const v = R.pick(LET), k = R.int(2, 20), t = R.int(0, 5);
    const T = [[`${k} more than a number`, `${v}+${k}`, [`${k}-${v}`, `${v}-${k}`, `${k}${v}`]],
      [`${k} less than a number`, `${v}-${k}`, [`${k}-${v}`, `${v}+${k}`, `${k}${v}`], `“Less than” flips the order: start with the number and go down ${k}.`],
      [`${k} decreased by a number`, `${k}-${v}`, [`${v}-${k}`, `${v}+${k}`, `${k}${v}`], `Start at ${k} and go down by the number.`],
      [`${k} fewer than a number`, `${v}-${k}`, [`${k}-${v}`, `${v}+${k}`, `${k}${v}`], `Start with the number and take ${k} away.`],
      [`${k} subtracted from a number`, `${v}-${k}`, [`${k}-${v}`, `${v}+${k}`, `${k}${v}`], `“Subtracted from” flips the order: start with the number.`],
      [`a number subtracted from ${k}`, `${k}-${v}`, [`${v}-${k}`, `${v}+${k}`, `${k}${v}`], `“Subtracted from” flips the order: start with ${k}.`]][t];
    return wordsQ(R, T, v); } },
  d: { t: 'two operations', g: (R) => { const v = R.pick(LET), k = R.int(2, 12), j = R.int(2, 9), t = R.int(0, 5);
    const T = [[`${k} less than twice a number`, `2${v}-${k}`, [`${k}-2${v}`, `2(${v}-${k})`, `2${v}+${k}`], `Twice the number is 2${mm(v)}; then go down ${k}.`],
      [`twice the sum of a number and ${k}`, `2(${v}+${k})`, [`2${v}+${k}`, `${v}+2*${k}`, `2+${v}+${k}`], `The whole sum is doubled, so it needs brackets.`],
      [`${k} more than the product of ${j} and a number`, `${j}${v}+${k}`, [`${j}(${v}+${k})`, `${k}${v}+${j}`, `${j}${v}-${k}`], `Multiply first, then add ${k}.`],
      [`the sum of a number and ${k}, divided by ${j}`, `(${v}+${k})/${j}`, [`${v}+${k}/${j}`, `${j}/(${v}+${k})`, `${j}(${v}+${k})`], `The whole sum is divided by ${j}.`],
      [`${j} times the difference of a number and ${k}`, `${j}(${v}-${k})`, [`${j}${v}-${k}`, `${j}(${k}-${v})`, `${j}${v}+${k}`], `The difference comes first, in brackets, then times ${j}.`],
      [`${k} less than ${j} times a number`, `${j}${v}-${k}`, [`${k}-${j}${v}`, `${j}(${v}-${k})`, `${j}${v}+${k}`], `${j} times the number is ${H(j + v)}; then go down ${k}.`]][t];
    return wordsQ(R, T, v); } },
}});

/* ---------- III.5.03 Evaluate expressions ---------- */
E3.skill({ id: 'III.5.03', name: 'Evaluate expressions', steps: {
  a: { t: 'one variable', g: (R) => { const v = R.pick(LET), x = R.int(1, 10), a = R.int(2, 9), b = R.int(1, 12), t = R.int(0, 4);
    const T = [[`${a}${v}+${b}`, a * x + b], [`${a}(${v}+${b})`, a * (x + b)], [`${a}${v}-${b}`, a * x - b], [`${b + 10}-${v}`, b + 10 - x], [`${v}^2+${b}`, x * x + b]][t];
    return num(`Find the value of ${H(T[0])} when ${mm(v)} = ${x}.`, T[1], `${subs(T[0], {[v]: x})} = ${f(T[1])}.`); } },
  b: { t: 'two variables', g: (R) => { const x = nz(R, -6, 9), y = nz(R, -6, 9), a = R.int(2, 7), b = R.int(2, 7), c = R.int(1, 10), t = R.int(0, 4);
    const T = [[`${a}x+${b}y`, a * x + b * y], [`${a}x-${b}y`, a * x - b * y], [`xy+${c}`, x * y + c], [`x(y+${c})`, x * (y + c)], [`${a}x-y`, a * x - y]][t];
    return num(`Find ${H(T[0])} when ${mm('x')} = ${f(x)} and ${mm('y')} = ${f(y)}.`, T[1], `Substitute in brackets: ${subs(T[0], {x, y})} = ${f(T[1])}.`); } },
  c: { t: 'with exponents', g: (R) => { const x = R.int(-5, -1) * (R.bool(0.8) ? 1 : -1), y = R.int(1, 8), a = R.int(2, 5), c = R.int(1, 12), t = R.int(0, 4);
    // [expr, value, trap value (squaring a negative gives a negative)]
    const T = [[`${a}x^2-2y`, a * x * x - 2 * y, -a * x * x - 2 * y], [`x^2+${c}`, x * x + c, -x * x + c], [`${a}x^2`, a * x * x, -a * x * x], [`x^2-x`, x * x - x, -x * x - x], [`x^2+y^2`, x * x + y * y, -x * x + y * y]][t];
    const ex = `Put ${f(x)} in brackets: ${subs(T[0], {x, y})} = ${f(T[1])}. ${x < 0 ? `(${f(x)})² = ${x * x}, not ${f(-x * x)}.` : ''}`;
    const q = `Find ${H(T[0])} when ${mm('x')} = ${f(x)}${T[0].includes('y') ? ` and ${mm('y')} = ${y}` : ''}.`;
    if (x < 0 && R.bool(0.35)) return choice(R, q, f(T[1]), [f(T[2]), f(T[1] + (t === 3 ? 2 * x : 2)), f(-T[1])].filter(z => z !== f(T[1])), ex);
    return num(q, T[1], ex); } },
  d: { t: 'formulas', g: (R, O) => { const t = R.int(0, 4), u = len(O);
    if (t === 0) { const b = R.int(2, 12) * 2, h = R.int(3, 15); return num(`A triangle's area is ${mm('A')} = ${fh(1, 2)}${mm('bh')}. Find ${mm('A')} when ${mm('b')} = ${b} ${u} and ${mm('h')} = ${h} ${u}.`, b * h / 2, `${fh(1, 2)} × ${b} × ${h} = ${b * h / 2} ${u}².`); }
    if (t === 1) { const c = R.int(-4, 8) * 5; return num(`${mm('F = 1.8C + 32')} changes °C to °F. Find ${mm('F')} when ${mm('C')} = ${f(c)}.`, 1.8 * c + 32, `1.8 × ${pn(c)} + 32 = ${f(1.8 * c)} + 32 = ${f(1.8 * c + 32)}.`); }
    if (t === 2) { const l = R.int(3, 20), w = R.int(2, 15); return num(`A rectangle's perimeter is ${mm('P = 2(l + w)')}. Find ${mm('P')} when ${mm('l')} = ${l} and ${mm('w')} = ${w}.`, 2 * (l + w), `Brackets first: 2(${l} + ${w}) = 2 × ${l + w} = ${2 * (l + w)}.`); }
    if (t === 3) { const [l, w, h] = [R.int(2, 12), R.int(2, 9), R.int(2, 8)]; return num(`A box's volume is ${mm('V = lwh')}. Find ${mm('V')} when ${mm('l')} = ${l}, ${mm('w')} = ${w}, ${mm('h')} = ${h}.`, l * w * h, `${l} × ${w} × ${h} = ${l * w * h}.`); }
    const s = R.int(2, 15); return num(`A square's area is ${mm('A = s^2')}. Find ${mm('A')} when ${mm('s')} = ${s}.`, s * s, `${s}² = ${s} × ${s} = ${s * s}, not 2 × ${s}.`); } },
}});

/* ---------- III.5.04 Parts of an expression ---------- */
// random polynomial-like expression: terms [[c, v], ...]
const partsExpr = (R) => {
  const v = R.pick(['x', 'y', 'a', 'n']), t = R.int(0, 3);
  let ts = [[nz(R, -9, 9), `${v}^2`], [nz(R, -9, 9), v], [nz(R, -12, 12), '']];
  if (t === 1) ts = [[nz(R, -12, 12), ''], [nz(R, -9, 9), v]];
  if (t === 2) ts = [[nz(R, -9, 9), v], [nz(R, -9, 9), 'y'], [nz(R, -12, 12), '']].map(z => z[1] === 'y' && v === 'y' ? [z[0], 'x'] : z);
  if (t === 3) ts = R.shuffle(ts);
  return ts;
};
E3.skill({ id: 'III.5.04', name: 'Parts of an expression', steps: {
  a: { t: 'terms', g: (R) => { const ts = partsExpr(R), e = L(ts), list = ts.map(z => L([z])).join(', ');
    if (R.bool(0.5)) return num(`How many terms does ${e} have?`, ts.length, `Terms are separated by + and −: ${list}.`);
    const nos = ts.map(([c, v]) => L([[Math.abs(c), v]])).join(', '), split = ts.map(([c, v]) => v ? `${Math.abs(c)}, ${mm(v)}` : `${Math.abs(c)}`).join(', ');
    const cos = ts.map(([c]) => f(c)).join(', ');
    return choice(R, `Which list shows the terms of ${e}?`, list, [...new Set([nos, split, cos])].filter(z => z !== list).slice(0, 3), `${ts.some(([c], i) => c < 0 && i > 0) ? 'A minus sign belongs to the term after it' : 'Terms are the parts joined by + or −'}: ${list}.`); } },
  b: { t: 'coefficients', g: (R) => { let ts = partsExpr(R); if (R.bool(0.25)) ts = ts.map(z => z[1] && z[1].length === 1 ? [R.pick([1, -1]), z[1]] : z);
    const pick = R.pick(ts.filter(z => z[1])), c = pick[0], v = pick[1];
    return num(`What is the coefficient of ${mm(v)} in ${L(ts)}?`, c, `The term is ${L([pick])}${Math.abs(c) === 1 ? ` = ${f(c)}${mm(v)}` : ''}, so the coefficient is ${f(c)}${c < 0 ? ': the minus sign belongs to it' : ''}.`); } },
  c: { t: 'constants', g: (R) => { const ts = partsExpr(R), k = ts.find(z => !z[1])[0];
    return num(`What is the constant term in ${L(ts)}?`, k, `The constant stands alone with no variable: ${f(k)}${k < 0 ? ', with its minus sign' : ''}.`); } },
  d: { t: 'factors', g: (R) => { const t = R.int(0, 1);
    if (t === 0) { const [p, q] = R.pick([[2, 3], [2, 5], [3, 5], [2, 7], [3, 3], [2, 2]]), v = R.pick(['x', 'a', 'n']), w = R.pick(['y', 'b', 'k']);
      const k = p * q, T = `${k}${v}^2${w}`;
      return choice(R, `Which shows the term ${mm(T)} as a product of factors?`, `${p} · ${q} · ${mm(v)} · ${mm(v)} · ${mm(w)}`, [`${k} · 2 · ${mm(v)} · ${mm(w)}`, `${p} + ${q} + ${mm(v)} + ${mm(v)} + ${mm(w)}`, `${p} · ${q} · ${mm(v)} · ${mm(w)}`], `${mm(v + '^2')} is ${mm(v)} · ${mm(v)}, not 2${mm(v)}, and factors are multiplied: ${p} · ${q} · ${mm(v)} · ${mm(v)} · ${mm(w)}.`); }
    const a = R.int(2, 9), b = R.int(1, 9), v = R.pick(['x', 'y', 'n']), g = `(${v}+${b})`;
    return choice(R, `Which expression has ${H(g)} as a factor?`, H(`${a}${g}`), [H(`${a}${v}+${b}`), H(`${a}+${g}`), H(`${g}-${a}`)], `A factor is multiplied: ${H(`${a}${g}`)} means ${a} × ${H(g)}. In the others, ${H(g)} is added or not there at all.`); } },
}});

/* ---------- III.5.05 Like terms ---------- */
// collect [[c,v],…] → simplified terms in first-seen order
const collect = ts => { const o = []; ts.forEach(([c, v]) => { const k = o.find(z => z[1] === v); if (k) k[0] += c; else o.push([c, v]); }); return o.filter(z => z[0]); };
E3.skill({ id: 'III.5.05', name: 'Like terms', steps: {
  a: { t: 'identify them', g: (R) => { const [v, others] = R.pick([['x', ['x^2', 'y', '']], ['y', ['y^2', 'x', '']], ['x^2', ['x', 'y^2', 'x^3']], ['xy', ['x', 'y', 'x^2y']], ['ab', ['a', 'b^2', 'a^2b']], ['n', ['n^2', 'm', '']]]);
    const c = R.int(2, 9), d = nz(R, -9, 9), same = v === 'xy' && R.bool(0.5) ? 'yx' : v === 'ab' && R.bool(0.5) ? 'ba' : v;
    const mk = w => w === '' ? String(c + R.int(1, 5)) : L([[c, w]]);
    return choice(R, `Which is a like term to ${L([[c, v]])}?`, L([[d === c ? -c : d, same]]), others.map(mk), `Like terms have the same variables to the same powers: ${L([[c, v]])} and ${L([[d === c ? -c : d, same]])}${same !== v ? ` (${mm(same)} = ${mm(v)})` : ''}.`); } },
  b: { t: 'combine them', g: (R) => { const [p, q] = R.pick([['a', 'b'], ['x', 'y'], ['m', 'n'], ['p', 'q']]);
    const ts = R.shuffle([[R.int(1, 9), p], [R.int(1, 9), q], [R.int(1, 9), p], [R.int(1, 9), q]].concat(R.bool(0.4) ? [[R.int(1, 9), '']] : []));
    const out = collect(ts); return num(`Simplify ${L(ts)}.`, [E('', lin(out), 'simplified')], `Add the coefficients of like terms: ${L(out)}.`); } },
  c: { t: 'with negatives', g: (R) => { const [p, q] = R.pick([['a', 'b'], ['x', 'y'], ['m', 'n'], ['c', 'd']]);
    if (R.bool(0.25)) { const a = R.int(2, 9), b = R.int(2, 9);
      return choice(R, `Simplify ${L([[a, p], [b, q]])}.`, `${L([[a, p], [b, q]])}: it can't be combined`, [mm(`${a + b}${p}${q}`), mm(`${a + b}${p}`), mm(`${a * b}${p}${q}`)], `${mm(p)} and ${mm(q)} are unlike terms, so ${L([[a, p], [b, q]])} stays as it is. It is not ${mm(`${a + b}${p}${q}`)}.`); }
    let ts, out; do { ts = R.shuffle([[nz(R, -9, 9), p], [nz(R, -9, 9), q], [nz(R, -9, 9), p], [nz(R, -9, 9), q]]); out = collect(ts); } while (out.length < 2 || !ts.some(z => z[0] < 0));
    return num(`Simplify ${L(ts)}.`, [E('', lin(out), 'simplified')], `Keep each sign with its term and add like terms: ${L(out)}.`); } },
  d: { t: 'several variables', g: (R) => { const kinds = R.pick([['xy', 'x', 'y'], ['x^2', 'x', ''], ['ab', 'a', 'b'], ['y^2', 'y', ''], ['x^2', 'xy', 'y']]);
    if (R.bool(0.2)) { const a = R.int(2, 7), b = R.int(2, 7), v = R.pick(['x', 'y', 'a']);
      return choice(R, `Simplify ${L([[a, v], [b, v + '^2']])}.`, `${L([[a, v], [b, v + '^2']])}: it can't be combined`, [mm(`${a + b}${v}^3`), mm(`${a + b}${v}^2`), mm(`${a + b}${v}`)], `${mm(v)} and ${mm(v + '^2')} are unlike terms: the powers differ. So nothing combines.`); }
    let ts, out; do { ts = R.shuffle([[nz(R, -8, 9), kinds[0]], [nz(R, -8, 9), kinds[1]], [nz(R, -8, 9), kinds[0]], [nz(R, -8, 9), kinds[2] || kinds[1]], [nz(R, -8, 9), kinds[1]]]); out = collect(ts); } while (out.length < 2);
    const kind0 = ts.map(([c, v]) => v === 'xy' && R.bool(0.3) ? [c, 'yx'] : [c, v]);
    return num(`Simplify ${L(kind0)}.`, [E('', lin(out), 'simplified')], `Group terms with the same variable part${kind0.some(z => z[1] === 'yx') ? ` (${mm('yx')} = ${mm('xy')})` : ''}: ${L(out)}.`); } },
}});

/* ---------- III.5.06 The distributive property ---------- */
const distQ = (R, shown, out, bad, ex) => R.bool(0.3) ? choice(R, `Expand ${shown}.`, L(out), [...new Set(bad.map(L))].filter(z => z !== L(out)).slice(0, 3), ex) : num(`Expand ${shown}.`, [E('', lin(out), 'expanded')], ex);
E3.skill({ id: 'III.5.06', name: 'The distributive property', steps: {
  a: { t: '3(x + 2)', g: (R) => { const a = R.int(2, 9), b = R.int(1, 9), c = R.bool(0.3) ? R.int(2, 5) : 1, v = R.pick(LET);
    const out = [[a * c, v], [a * b, '']];
    return distQ(R, H(`${a}(${lin([[c, v], [b, '']])})`), out, [[[a * c, v], [b, '']], [[c, v], [a * b, '']], [[a * c + a * b, v]]], `Multiply every term inside by ${a}: ${L(out)}.`); } },
  b: { t: 'with negatives', g: (R) => { const a = R.int(2, 9), b = R.int(1, 9), c = R.int(1, 5), v = R.pick(LET), t = R.int(0, 2);
    let inside = [[c, v], [b, '']], k = -a; if (t === 1) { inside = [[-c, v], [b, '']]; k = a; } if (t === 2) inside = [[-c, v], [b, '']];
    const out = inside.map(([p, w]) => [k * p, w]);
    return distQ(R, H(`${k}(${lin(inside)})`), out, [[out[0], [-out[1][0], '']], [out[0], inside[1]], [[-out[0][0], v], out[1]]], `Multiply each term by ${f(k)}: ${f(k)} × ${inside[0][0] < 0 ? '(' + L([inside[0]]) + ')' : L([inside[0]])} and ${f(k)} × ${pn(inside[1][0])}. So ${L(out)}.`); } },
  c: { t: 'subtraction inside', g: (R) => { const a = R.int(2, 9), b = R.int(1, 9), c = R.int(1, 6), v = R.pick(LET), t = R.int(0, 2);
    const k = t === 0 ? a : t === 1 ? -1 : -a, inside = [[t === 1 ? 1 : c, v], [-b, '']], out = inside.map(([p, w]) => [k * p, w]);
    const shown = t === 1 ? H(`-(${lin(inside)})`) : H(`${k}(${lin(inside)})`);
    return distQ(R, shown, out, [[out[0], [-out[1][0], '']], [out[0], inside[1]], [[k * inside[0][0], v], [inside[1][0], '']], inside, [[-out[0][0], v], out[1]]].filter(z => lin(z) !== lin(out)),
      `${t === 1 ? 'The minus multiplies every term by −1' : `Multiply each term by ${f(k)}`}: ${L(out)}.${k < 0 ? ` ${f(k)} × (−${b}) = +${-k * b}.` : ''}`); } },
  d: { t: 'with fractions', g: (R) => { const v = R.pick(LET), t = R.int(0, 1);
    if (t === 0) { const [n, d] = R.pick([[1, 2], [1, 3], [1, 4], [2, 3], [3, 4], [1, 5], [2, 5]]), p = R.int(1, 4), q = R.int(1, 5), s = R.pick([1, -1]);
      const inside = [[d * p, v], [s * d * q, '']], out = [[n * p, v], [s * n * q, '']];
      return distQ(R, `${fh(n, d)}(${L(inside)})`, out, [[[n * p, v], [s * d * q, '']], [[d * p, v], [s * n * q, '']], [[n * p + s * n * q, v]]].filter(z => lin(z) !== lin(out)), `${fh(n, d)} of ${f(d * p)}${mm(v)} is ${L([out[0]])}, and ${fh(n, d)} of ${f(d * q)} is ${f(n * q)}. So ${L(out)}.`); }
    const k = R.pick([0.5, 1.5, 2.5, 0.2]), p = k === 0.2 ? R.pick([5, 10, 15]) : R.int(1, 5) * 2, q = k === 0.2 ? R.pick([5, 10, 20]) : R.int(1, 6) * 2, s = R.pick([1, -1]);
    const inside = [[p, v], [s * q, '']], out = [[k * p, v], [s * k * q, '']];
    return distQ(R, `${f(k)}(${L(inside)})`, out, [[out[0], [s * q, '']], [[p, v], out[1]], [[k * p, v], [-s * k * q, '']]].filter(z => lin(z) !== lin(out)), `Multiply each term by ${f(k)}: ${L(out)}.`); } },
}});

/* ---------- III.5.07 Factor out a GCF ---------- */
const coprime = (R, lo, hi) => { let p, q; do { p = R.int(lo, hi); q = R.int(lo, hi); } while (gcd(p, q) !== 1 || p === q && p !== 1); return [p, q]; };
E3.skill({ id: 'III.5.07', name: 'Factor out a GCF', steps: {
  a: { t: '6x + 9', g: (R) => { const g = R.int(2, 9), v = R.pick(LET), [p, q] = coprime(R, 1, 7), s = R.pick([1, 1, -1]);
    const e = lin([[g * p, v], [s * g * q, '']]), fac = `${g}(${lin([[p, v], [s * q, '']])})`;
    return num(`Factor ${H(e)} completely. Give the GCF and the factored form.`, [{label: 'GCF', ans: g}, E('factored', fac, 'factored')], `${g} divides both terms: ${H(e)} = ${H(fac)}.${q === 1 ? ` Keep the 1: ${g} ÷ ${g} = 1.` : ''} Check: ${H(fac)} expands back.`); } },
  b: { t: 'with variables', g: (R) => { const g = R.int(2, 6), [p, q] = coprime(R, 1, 5), t = R.int(0, 2), s = R.pick([1, -1]);
    let e, gg, fac;
    if (t === 0) { const k = R.int(1, 2), v = R.pick(['x', 'y', 'a']), hi = k === 1 ? `${v}^2` : `${v}^3`, lo = k === 1 ? v : `${v}^2`;
      e = lin([[g * p, hi], [s * g * q, lo]]); gg = `${g}${lo}`; fac = `${gg}(${lin([[p, v], [s * q, '']])})`; }
    else if (t === 1) { e = lin([[g * p, 'xy'], [s * g * q, 'x']]); gg = `${g}x`; fac = `${gg}(${lin([[p, 'y'], [s * q, '']])})`; }
    else { e = lin([[g * p, 'a^2'], [s * g * q, 'ab']]); gg = `${g}a`; fac = `${gg}(${lin([[p, 'a'], [s * q, 'b']])})`; }
    return num(`Factor ${H(e)} completely. Give the GCF and the factored form.`, [E('GCF', gg), E('factored', fac, 'factored')], `The GCF is the biggest number and the highest power of each variable in every term: ${H(gg)}. So ${H(e)} = ${H(fac)}.`); } },
  c: { t: 'with negatives', g: (R) => { const g = R.int(2, 9), v = R.pick(LET), [p, q] = coprime(R, 1, 6), s = R.pick([1, -1]);
    const e = lin([[-g * p, v], [-s * g * q, '']]), fac = `-${g}(${lin([[p, v], [s * q, '']])})`;
    return num(`Factor out a negative GCF: ${H(e)}.`, [{label: 'GCF', ans: -g}, E('factored', fac, 'factored')], `Divide each term by −${g}: ${H(e)} = ${H(fac)}. Every sign inside flips.`); } },
  d: { t: 'check by expanding', g: (R) => { const g = R.pick([2, 3, 4, 5, 6, 8, 9]), v = R.pick(LET), [p, q] = coprime(R, 1, 5), s = R.pick([1, -1]);
    const e = lin([[g * p, v], [s * g * q, '']]), inner = lin([[p, v], [s * q, '']]), fac = `${g}(${inner})`;
    if (R.bool(0.4)) return num(`Check the factoring by expanding: ${H(fac)} = ?`, [E('', e, 'expanded')], `${g} × ${L([[p, v]])} = ${L([[g * p, v]])} and ${g} × ${f(s * q)} = ${f(s * g * q)}: ${H(e)}. It matches.`);
    const sub = [2, 3].find(d => g % d === 0 && g !== d);
    const bad = [q === 1 ? `${g}(${lin([[p, v]])})` : `${g}(${lin([[p, v], [s * g * q, '']])})`, `${g}(${lin([[p, v], [-s * q, '']])})`, sub ? `${sub}(${lin([[g / sub * p, v], [s * g / sub * q, '']])})` : `${g}${v}(${lin([[p, ''], [s * q, '']])})`];
    return choice(R, `Which is ${H(e)} factored completely and correctly?`, H(fac), bad.map(H), `Expand to check: ${H(fac)} = ${H(e)}, and ${L([[p, v]])} and ${f(q)} share no factor.${q === 1 ? ' Keep the 1 when a whole term comes out.' : ''}`); } },
}});

/* ---------- III.5.08 Equivalent expressions ---------- */
E3.skill({ id: 'III.5.08', name: 'Equivalent expressions', steps: {
  a: { t: 'test by substituting', g: (R) => { const a = R.int(2, 6), b = R.int(1, 6), t = R.int(0, 4), x = R.int(1, 6);
    const P = [[`${a}(x+${b})-x`, `${a - 1}x+${a * b}`, X => a * (X + b) - X, X => (a - 1) * X + a * b],
      [`x^2+${b * b}`, `(x+${b})^2`, X => X * X + b * b, X => (X + b) ** 2],
      [`${a}(x-${b})`, `${a}x-${b}`, X => a * (X - b), X => a * X - b],
      ['x^2', `${a}x`, X => X * X, X => a * X],
      [`${a + b}x-${b}x`, `${a}x`, X => (a + b) * X - b * X, X => a * X]][t];
    const A = P[2](x), B = P[3](x), eq = A === B;
    return num(`A = ${H(P[0])} and B = ${H(P[1])}. Substitute ${mm('x')} = ${x} into both.`, [{label: 'A', ans: A}, {label: 'B', ans: B}],
      eq ? `Both give ${A}. One match doesn't prove they're equivalent; ${t === 3 ? `at another value they differ` : `simplifying does`}.` : `A = ${A} but B = ${B}: one mismatch proves they are not equivalent.`); } },
  b: { t: 'by simplifying', g: (R) => { const a = R.int(2, 6), b = R.int(1, 7), v = R.pick(LET), sgn = R.pick([1, -1]); let c; do c = R.int(1, 5); while (a + sgn * c === 0 || 1 + sgn * c === 0);
    const e = `${a}(${v}+${b})${sgn > 0 ? '+' : '-'}${c}${v}`, out = [[a + sgn * c, v], [a * b, '']];
    const bad = [[[a + sgn * c, v], [b, '']], [[a, v], [a * b + sgn * c, '']], [[1 + sgn * c, v], [a * b, '']]].filter(z => lin(z) !== lin(out));
    return choice(R, `Which expression is equivalent to ${H(e)}?`, L(out), bad.map(L), `Distribute, then combine: ${L([[a, v], [a * b, ''], [sgn * c, v]])} = ${L(out)}.`); } },
  c: { t: 'pick the equal ones', g: (R) => { const a = R.int(2, 6), b = R.int(2, 7);
    const T = [[`${a}(x+${b})`, `${a}x+${a * b}`], [`${a}x+${b}x`, `${a + b}x`], ['x+x+x', '3x'], [`${a}(x-${b})+x`, `${a + 1}x-${a * b}`], ['x*x', 'x^2'], [`${b}-(x-${a})`, `${a + b}-x`]];
    const F = [[`${a}(x+${b})`, `${a}x+${b}`], ['x^2', '2x'], [`(x+${b})^2`, `x^2+${b * b}`], [`${a}x+${b}`, `${a + b}x`], ['x+x', 'x^2'], [`${b}-(x-${a})`, `${b - a}-x`], [`${a}x-x`, `${a}`]];
    const pr = ([p, q]) => `${H(p)} and ${H(q)}`, ok = R.pick(T);
    return choice(R, 'Which pair of expressions is equivalent?', pr(ok), R.sample(F, 3).map(pr), `${pr(ok)} are equal for every ${mm('x')}: simplify one to get the other. Each other pair differs at some value.`); } },
  d: { t: 'explain', g: (R) => { const t = R.int(0, 4);
    const P = [['x^2', '2x', 2, 3, 9, 6], ['x^2', '3x', 3, 1, 1, 3], ['x+x', 'x^2', 2, 3, 6, 9], ['2x+1', 'x+4', 3, 1, 3, 5], ['x^3', 'x', 1, 2, 8, 2]][t];
    if (R.bool(0.3)) { const a = R.int(2, 5), b = R.int(1, 6), x = R.int(1, 4), A = `${a}(x+${b})-x`, B = `${a - 1 === 1 ? '' : a - 1}x+${a * b}`;
      return choice(R, `${H(A)} and ${H(B)} are equal at ${mm('x')} = ${x}. Are they equivalent?`, `Yes: ${H(A)} simplifies to ${H(B)}`, [`Yes: they match at ${mm('x')} = ${x}`, `No: they look different`, `Can't tell without trying every number`], `Matching once proves nothing, but simplifying does: ${a}${mm('x')} + ${a * b} − ${mm('x')} = ${H(B)}.`); }
    return choice(R, `${H(P[0])} and ${H(P[1])} are both ${P[4] === P[5] ? '' : ''}equal at ${mm('x')} = ${P[2]}. Are they equivalent?`, `No: at ${mm('x')} = ${P[3]} they give ${P[4]} and ${P[5]}`, [`Yes: they match at ${mm('x')} = ${P[2]}`, `Yes: they use the same numbers`, `No: they are never equal`], `One match isn't proof. One mismatch is: at ${mm('x')} = ${P[3]}, ${H(P[0])} = ${P[4]} but ${H(P[1])} = ${P[5]}.`); } },
}});

/* ---------- III.5.09 Simplify expressions ---------- */
E3.skill({ id: 'III.5.09', name: 'Simplify expressions', steps: {
  a: { t: 'distribute, then combine', g: (R) => { const a = R.int(2, 7), b = R.int(1, 8), c = R.int(1, 6), d = R.bool(0.4) ? R.int(1, 9) : 0, v = R.pick(LET);
    const e = `${a}(${v}+${b})+${c === 1 ? '' : c}${v}${d ? '+' + d : ''}`, out = [[a + c, v], [a * b + d, '']];
    return num(`Simplify ${H(e)}.`, [E('', lin(out), 'simplified')], `${L([[a, v], [a * b, ''], [c, v], [d, '']])} = ${L(out)}.`); } },
  b: { t: 'several steps', g: (R) => { let a, b, c, d, e2; do { a = R.int(2, 6); b = R.int(1, 5); c = R.int(1, 7); d = R.int(2, 5); e2 = R.int(1, 7); } while (a * b === d);
    const v = R.pick(['x', 'y', 'n', 'a']), s2 = R.pick([1, -1]);
    const e = `${a}(${lin([[b, v], [-c, '']])})${s2 > 0 ? '+' : '-'}${d}(${v}-${e2})`, mid = [[a * b, v], [-a * c, ''], [s2 * d, v], [-s2 * d * e2, '']], out = collect(mid);
    return num(`Simplify ${H(e)}.`, [E('', lin(out), 'simplified')], `${L(mid)} = ${L(out)}.${s2 < 0 ? ` −${d} × (−${e2}) = +${d * e2}.` : ''}`); } },
  c: { t: 'with rationals', g: (R) => { const v = R.pick(['x', 'y', 'n']), t = R.int(0, 1);
    if (t === 0) { const k = R.pick([2, 3, 4]), p = R.int(1, 4), q = R.int(1, 5), j = R.pick([2, 3, 5].filter(z => z !== k)), s = R.pick([1, -1]);
      const out = `${p * j + 1}${v}/${j}${s > 0 ? '+' : '-'}${q}`;
      return num(`Simplify ${fh(1, k)}(${L([[k * p, v], [s * k * q, '']])}) + ${fh(mm(v), j)}.`, [E('', out, 'simplified')], `${L([[p, v], [s * q, '']])} + ${fh(mm(v), j)} = ${fh(p * j + 1, j)}${mm(v)} ${s > 0 ? '+' : '−'} ${q}, since ${p} + ${fh(1, j)} = ${fh(p * j + 1, j)}.`); }
    const k = R.pick([0.5, 1.5, 2.5]), p = R.int(1, 4) * 2, q = R.int(1, 5) * 2, c = R.pick([0.5, 1.5, 0.2, 1.2, 2.5]);
    const out = [[k * p + c, v], [k * q, '']];
    return num(`Simplify ${f(k)}(${L([[p, v], [q, '']])}) + ${f(c)}${mm(v)}.`, [E('', lin(out), 'simplified')], `${L([[k * p, v], [k * q, ''], [c, v]])} = ${L(out)}.`); } },
  d: { t: 'find the error', g: (R) => { const v = 'x', t = R.int(0, 1), e = R.int(1, 3);
    let start, lines;
    if (t === 0) { let a, b, c, d; do { a = R.int(2, 6); b = R.int(1, 6); c = R.int(2, 6); d = R.int(1, 6); } while (a === c);
      start = H(`${a}(x+${b})-${c}(x-${d})`);
      const ok = [[[a, v], [a * b, ''], [-c, v], [c * d, '']], [[a, v], [-c, v], [a * b, ''], [c * d, '']], [[a - c, v], [a * b + c * d, '']]];
      const bad = { 1: [[[a, v], [a * b, ''], [-c, v], [-c * d, '']], [[a, v], [-c, v], [a * b, ''], [-c * d, '']], [[a - c, v], [a * b - c * d, '']]],
        2: [ok[0], [[a, v], [c, v], [a * b, ''], [c * d, '']], [[a + c, v], [a * b + c * d, '']]],
        3: [ok[0], ok[1], [[a - c, v], [a * b - c * d, '']]] }[e];
      lines = bad.map(L); }
    else { let a, b, c, d; do { a = R.int(2, 5); b = R.int(1, 4); c = R.int(a + 2, 15); d = R.int(1, 6); } while (d === a || c - a * b === 0);
      start = H(`${c}-${a}(x+${b})+${d}x`);
      const ok = [[[c, ''], [-a, v], [-a * b, ''], [d, v]], [[d - a, v], [c - a * b, '']]];
      if (e === 1) lines = [H(`${c - a}(x+${b})+${d}x`), L([[c - a, v], [(c - a) * b, ''], [d, v]]), L([[c - a + d, v], [(c - a) * b, '']])];
      else if (e === 2) lines = [L(ok[0]), L([[-a, v], [d, v], [c, ''], [a * b, '']]), L([[d - a, v], [c + a * b, '']])];
      else lines = [L(ok[0]), L([[-a, v], [d, v], [c, ''], [-a * b, '']]), L([[d + a, v], [c - a * b, '']])]; }
    const expl = t === 0 ? ['a minus times a minus gives plus', 'the sign of the x term was lost when reordering', 'the constant terms were combined with the wrong sign'][e - 1] : ['multiply before subtracting: the number in front is not part of the bracket', 'a sign was lost when reordering', 'the x terms were combined with the wrong sign'][e - 1];
    return choiceFixed(`Which line has the first error?<br>${start}<br>Line 1: ${lines[0]}<br>Line 2: ${lines[1]}<br>Line 3: ${lines[2]}`, ['Line 1', 'Line 2', 'Line 3'], e - 1, `Line ${e}: ${expl}.`); } },
}});

/* ---------- III.5.10 Expressions in geometry ---------- */
const sx = ts => lin(ts).replace(/-/g, ' − ').replace(/\+/g, ' + ').replace(/^ − /, '−');
E3.skill({ id: 'III.5.10', name: 'Expressions in geometry', steps: {
  a: { t: 'perimeter', g: (R) => { const t = R.int(0, 1);
    if (t === 0) { const a = R.int(1, 9), b = R.int(0, 6), p = R.int(1, 3), top = [[p, 'x'], [a, '']], side = b ? [[1, 'x'], [b, '']] : [[R.int(2, 9), '']];
      const out = collect([...top, ...top, ...side, ...side]);
      return num('Write the perimeter of the rectangle. Simplify.', [E('P =', lin(out), 'simplified')], `Add all 4 sides: 2(${L(top)}) + 2(${L(side)}) = ${L(out)}.`, {visual: V5.rect(sx(top), sx(side))}); }
    const s1 = [[R.int(1, 3), 'x'], [R.int(1, 6), '']], s2 = [[R.int(1, 4), 'x'], [-R.int(1, 3), '']], s3 = [[1, 'x'], [R.int(2, 9), '']], out = collect([...s1, ...s2, ...s3]);
    return num('Write the perimeter of the triangle. Simplify.', [E('P =', lin(out), 'simplified')], `Add the 3 sides: ${L(s1)} + ${L(s2)} + ${L(s3)} = ${L(out)}.`, {visual: V5.tri(sx(s1), sx(s2), sx(s3))}); } },
  b: { t: 'area', g: (R) => { const t = R.int(0, 2), a = R.int(2, 9), b = R.int(1, 8);
    let top, side, out;
    if (t === 0) { top = [[1, 'x']]; side = [[a, '']]; out = [[a, 'x']]; }
    else if (t === 1) { top = [[1, 'x'], [b, '']]; side = [[a, '']]; out = [[a, 'x'], [a * b, '']]; }
    else { top = [[1, 'x'], [b, '']]; side = [[1, 'x']]; out = [[1, 'x^2'], [b, 'x']]; }
    const P = collect([...top, ...top, ...side, ...side]), ex = `Area = length × width = ${t === 2 ? mm('x') : a}(${L(top)}) = ${L(out)}. The perimeter would be ${L(P)}.`;
    const half = t === 0 ? [[1, 'x'], [a, '']] : t === 1 ? [[a, 'x'], [b, '']] : [[1, 'x^2'], [b, '']];
    if (R.bool(0.3)) return choice(R, 'Which expression is the area of the rectangle?', L(out), [L(P), L(half), L(collect([...top, ...side]))].filter(z => z !== L(out)), ex, {visual: V5.rect(sx(top), sx(side))});
    return num('Write the area of the rectangle, with no brackets.', [E('A =', lin(out), 'expanded')], ex, {visual: V5.rect(sx(top), sx(side))}); } },
  c: { t: 'combined shapes', g: (R) => { const a = R.int(2, 8), h1 = R.int(2, 6), h2 = R.int(2, 7);
    const vis = V5.L(`x + ${a}`, 'x', String(h1), String(h2));
    if (R.bool(0.5)) { const out = [[h1 + h2, 'x'], [h1 * a, '']];
      return num('Write the area of the shape. Simplify.', [E('A =', lin(out), 'simplified')], `Split along the dashed line: ${h1}(${L([[1, 'x'], [a, '']])}) + ${h2}${mm('x')} = ${L(out)}.`, {visual: vis}); }
    const out = [[2, 'x'], [2 * a + 2 * (h1 + h2), '']];
    return num('Write the perimeter of the shape. Simplify.', [E('P =', lin(out), 'simplified')], `The outside edge: ${mm('x')} + ${a} along the bottom, ${mm('x')} and ${a} along the top steps, and ${h1} + ${h2} up each side: ${L(out)}. The dashed line is inside, so it doesn't count.`, {visual: vis}); } },
  d: { t: 'simplify', g: (R) => { const t = R.int(0, 1);
    if (t === 0) { const c = R.int(2, 9), right = [[4, 'x'], [2 * c, '']], wrong = [[4, 'x'], [4 * c, '']];
      const ex = `The shape is 2${mm('x')} by ${c}: 2(2${mm('x')}) + 2(${c}) = ${L(right)}. The two edges where they touch are inside, so don't add both perimeters.`;
      if (R.bool(0.5)) return choice(R, `Two ${mm('x')} by ${c} rectangles are put side by side. What is the perimeter of the shape?`, L(right), [L(wrong), L([[2, 'x'], [2 * c, '']]), L([[2 * c, 'x']])], ex, {visual: V5.two('x', String(c))});
      return num(`Two ${mm('x')} by ${c} rectangles are put side by side. Write the perimeter of the shape. Simplify.`, [E('P =', lin(right), 'simplified')], ex, {visual: V5.two('x', String(c))}); }
    const l = [[R.int(1, 4), 'x'], [R.int(1, 7), '']], w = [[R.int(1, 3), 'x'], [-R.int(1, 4), '']], out = collect([...l, ...l, ...w, ...w]);
    return num(`A rectangle is ${L(l)} long and ${L(w)} wide. Its perimeter is 2(${L(l)}) + 2(${L(w)}). Simplify.`, [E('P =', lin(out), 'simplified')], `${L([[2 * l[0][0], 'x'], [2 * l[1][0], ''], [2 * w[0][0], 'x'], [2 * w[1][0], '']])} = ${L(out)}.`, {visual: V5.rect(sx(l), sx(w))}); } },
}});

/* ---------- III.5.11 Expressions in context ---------- */
const CTX = [ // [what, fixed-part text, rate text, unit, letter, total]
  ['A taxi ride', 'a fixed fee', 'the price per km', 'km', 'k', 'the total fare'],
  ['A phone plan', 'the monthly fee', 'the price per GB of data', 'GB', 'g', 'the monthly bill'],
  ['A gym', 'the joining fee', 'the price per visit', 'visits', 'v', 'the total cost'],
  ['A bike hire', 'the booking fee', 'the price per hour', 'hours', 'h', 'the total cost'],
];
const NM = [['Maya', 'm', 'Her'], ['Ben', 'b', 'His'], ['Sara', 's', 'Her'], ['Kim', 'k', 'Her'], ['Raj', 'r', 'His'], ['Tom', 't', 'His'], ['Noor', 'n', 'Her']];
E3.skill({ id: 'III.5.11', name: 'Expressions in context', steps: {
  a: { t: 'cost', g: (R, O) => { const t = R.int(0, 2), p = R.int(2, 15), fee = R.int(2, 9);
    if (t === 0) return num(`Tickets cost ${money(O, p)} each, plus ${/^8|^1[18]$/.test(String(fee)) ? 'an' : 'a'} ${money(O, fee)} booking fee. Write the cost of ${mm('t')} tickets, in ${cur(O)}.`, [E('', `${p}t+${fee}`)], `${mm('t')} tickets cost ${p}${mm('t')}; add the fee: ${H(`${p}t+${fee}`)}.`);
    if (t === 1) { const k = R.int(2, 9); return num(`Pens cost ${mm('p')} ${cur(O)} each. Write the cost of ${k} pens and a ${money(O, fee)} notebook.`, [E('', `${k}p+${fee}`)], `${k} pens cost ${H(k + 'p')}; add the notebook: ${H(`${k}p+${fee}`)}.`); }
    const [w, , , u, l] = R.pick(CTX);
    return num(`${w} costs ${money(O, fee)}, plus ${money(O, p)} per ${u.replace(/s$/, '')}. Write the cost for ${mm(l)} ${u}.`, [E('', `${p}${l}+${fee}`)], `${p} for each of ${mm(l)} ${u} is ${H(p + l)}, plus the fixed ${fee}: ${H(`${p}${l}+${fee}`)}.`); } },
  b: { t: 'ages', g: (R) => { const [nm, l, hr] = R.pick(NM), d = R.int(2, 9), k = R.int(2, 12), t = R.int(0, 3);
    if (t === 0) return num(`${nm} is ${mm(l)} years old. ${hr} brother is ${d} years older. Write the sum of their ages in ${k} years. Simplify.`, [E('', `2${l}+${d + 2 * k}`, 'simplified')], `In ${k} years: (${H(`${l}+${k}`)}) + (${H(`${l}+${d + k}`)}) = ${H(`2${l}+${d + 2 * k}`)}.`);
    if (t === 1) { const k2 = R.int(1, d); return num(`${nm} is ${mm(l)} years old. ${hr} sister is ${d} years younger. Write the sister's age ${k2} years ago. Simplify.`, [E('', `${l}-${d + k2}`, 'simplified')], `Now the sister is ${H(`${l}-${d}`)}. ${k2} years ago: ${H(`${l}-${d}-${k2}`)} = ${H(`${l}-${d + k2}`)}.`); }
    if (t === 2) { const q = R.int(2, 4); return num(`${nm} is ${mm(l)} years old. ${hr} mother is ${q} times as old. Write the sum of their ages in ${k} years. Simplify.`, [E('', `${q + 1}${l}+${2 * k}`, 'simplified')], `(${H(`${l}+${k}`)}) + (${H(`${q}${l}+${k}`)}) = ${H(`${q + 1}${l}+${2 * k}`)}.`); }
    return num(`${nm} is ${mm(l)} years old. ${hr} cousin is ${d} years older. Write the sum of their ages now. Simplify.`, [E('', `2${l}+${d}`, 'simplified')], `${mm(l)} + (${H(`${l}+${d}`)}) = ${H(`2${l}+${d}`)}.`); } },
  c: { t: 'what each part means', g: (R, O) => { const [w, fx, rt, u, l, tot] = R.pick(CTX), r = R.int(2, 6), a = R.pick([2, 3, 4, 5, 6, 7, 8, 9].filter(z => z !== r)), t = R.int(0, 2);
    const model = `C = ${a} + ${r}${l}`, ans = [`${fx}`, `${rt}`, `the number of ${u}`][t], q = [String(a), String(r), l][t];
    return choice(R, `${w} costs ${mm(model)} ${cur(O)}. What does ${t === 2 ? mm(q) : q} stand for?`, ans, [fx, rt, `the number of ${u}`, tot].filter(z => z !== ans), `${a} is paid once (${fx}); ${r} is paid for each of the ${mm(l)} ${u}.`); } },
  d: { t: 'rewrite to reveal meaning (1.05p)', g: (R) => { const r = R.pick([3, 4, 5, 6, 7, 8, 10, 12, 15, 20, 25]), t = R.int(0, 3), rr = f(r / 100), up = f(1 + r / 100), dn = f(1 - r / 100);
    if (t === 0) return num(`Write ${mm(`p + ${rr}p`)} as a single term.`, [E('', `${up}p`, 'simplified')], `${mm('p')} is 1${mm('p')}, so 1${mm('p')} + ${rr}${mm('p')} = ${up}${mm('p')}: adding ${r}% means multiplying by ${up}.`);
    if (t === 1) return num(`Write ${mm(`p - ${rr}p`)} as a single term.`, [E('', `${dn}p`, 'simplified')], `1${mm('p')} − ${rr}${mm('p')} = ${dn}${mm('p')}: taking off ${r}% leaves ${100 - r}% of ${mm('p')}.`);
    if (t === 2) return choice(R, `A price ${mm('p')} goes up by ${r}%. Which expression is the new price?`, mm(`${up}p`), [mm(`p + ${r}`), mm(`${rr}p`), mm(`${f(1 + r / 10)}p`)], `${mm('p')} + ${rr}${mm('p')} = ${up}${mm('p')}: ${100 + r}% of the price.`);
    return choice(R, `A shop writes the price with tax as ${mm(`${up}p`)}. What does that mean?`, `${mm('p')} plus ${r}% of ${mm('p')}`, [`${up}% of ${mm('p')}`, `${mm('p')} plus ${up}`, `${mm('p')} minus ${r}%`], `${up}${mm('p')} = ${mm('p')} + ${rr}${mm('p')}: the price plus ${r}%, which is ${100 + r}% of ${mm('p')}.`); } },
}});

/* ---------- III.5.12 Expressions with powers ---------- */
E3.skill({ id: 'III.5.12', name: 'Expressions with powers', steps: {
  a: { t: 'x² vs 2x', g: (R) => { const v = R.pick(['x', 'y', 'n', 'a']), t = R.int(0, 2);
    if (t === 0) { const k = R.pick([1, 3, 4, 5, 6, 7, 8, 9, 10]); return num(`Find ${mm(v + '^2')} and 2${mm(v)} when ${mm(v)} = ${k}.`, [{label: `${v}² =`, ans: k * k}, {label: `2${v} =`, ans: 2 * k}], `${mm(v + '^2')} = ${k} × ${k} = ${k * k}, but 2${mm(v)} = ${k} + ${k} = ${2 * k}.`); }
    if (t === 1) return choice(R, `Which expression means ${mm(v)} · ${mm(v)}?`, mm(v + '^2'), [mm('2' + v), mm(v + ' + ' + v), mm('2' + v + '^2')], `${mm(v)} times itself is ${mm(v + '^2')}. ${mm(v)} + ${mm(v)} is 2${mm(v)}.`);
    return choice(R, `Which expression means ${mm(v)} + ${mm(v)}?`, mm('2' + v), [mm(v + '^2'), mm(v + ' · ' + v), mm('2' + v + '^2')], `Adding ${mm(v)} twice is 2${mm(v)}. ${mm(v)} · ${mm(v)} would be ${mm(v + '^2')}.`); } },
  b: { t: 'evaluate', g: (R) => { const x = nz(R, -5, 5), a = R.int(2, 5), c = R.int(1, 10), t = R.int(0, 4);
    const T = [[`${a}x^2`, a * x * x, -a * x * x], [`x^2-x`, x * x - x, -x * x - x], [`2x^3`, 2 * x ** 3, -2 * x ** 3], [`-x^2+${c}`, -x * x + c, x * x + c], [`x^3+x^2`, x ** 3 + x * x, x ** 3 - x * x]][t];
    const ex = `${subs(T[0], {x})} = ${f(T[1])}.${x < 0 && T[0].includes('^2') ? ` A negative squared is positive: (${f(x)})² = ${x * x}.` : ''}${x < 0 && T[0].includes('^3') ? ` A negative cubed stays negative: (${f(x)})³ = ${f(x ** 3)}.` : ''}`;
    if (x < 0 && T[2] !== T[1] && R.bool(0.35)) return choice(R, `Find ${H(T[0])} when ${mm('x')} = ${f(x)}.`, f(T[1]), [f(T[2]), f(T[1] + 1), f(-T[1])], ex);
    return num(`Find ${H(T[0])} when ${mm('x')} = ${f(x)}.`, T[1], ex); } },
  c: { t: 'combine like powers', g: (R) => { const v = R.pick(['x', 'y', 'a', 'n']);
    if (R.bool(0.25)) { const a = R.int(2, 7), b = R.int(2, 7);
      return choice(R, `Simplify ${L([[a, v], [b, v + '^2']])}.`, `${L([[a, v], [b, v + '^2']])}: no like terms`, [mm(`${a + b}${v}^3`), mm(`${a + b}${v}^2`), mm(`${a * b}${v}^3`)], `${mm(v)} and ${mm(v + '^2')} are different powers, so they don't combine.`); }
    let ts, out; do { ts = R.shuffle([[nz(R, -7, 8), v + '^2'], [nz(R, -7, 8), v + '^2'], [nz(R, -7, 8), v], [R.bool(0.5) ? nz(R, -7, 8) : 0, v], [R.bool(0.4) ? nz(R, -9, 9) : 0, '']]).filter(z => z[0]); out = collect(ts); } while (out.length < 2 || !out.some(z => z[1] === v + '^2'));
    return num(`Simplify ${L(ts)}.`, [E('', lin(out), 'simplified')], `Combine only matching powers: ${L(out)}.`); } },
  d: { t: 'products of powers', g: (R) => { const v = R.pick(['x', 'y', 'a']), p = R.int(1, 6), q = R.int(3, 6), a = R.int(2, 7), b = R.int(3, 7), t = R.int(0, 2);
    const pw = e => e === 1 ? v : `${v}^${e}`;
    if (t === 0) return num(`${mm(`${a}${pw(p)}`)} · ${mm(`${b}${pw(q)}`)} = ${mm('c')}${mm(v + '^k')}. Find ${mm('c')} and ${mm('k')}.`, [{label: 'c =', ans: a * b}, {label: 'k =', ans: p + q}], `Multiply the numbers: ${a} × ${b} = ${a * b}. Add the exponents: ${p} + ${q} = ${p + q}.`);
    if (t === 1) return choice(R, `${mm(pw(p))} · ${mm(pw(q))} = ?`, mm(`${v}^${p + q}`), [mm(`${v}^${p * q}`), mm(`2${v}^${p + q}`), mm(`${v}^${p + q + 1}`)].filter(z => z !== mm(`${v}^${p + q}`)), `${p} factors of ${mm(v)} times ${q} more is ${p + q} factors: ${mm(`${v}^${p + q}`)}.`);
    return choice(R, `${mm(`${a}${pw(p)}`)} · ${mm(`${b}${pw(q)}`)} = ?`, mm(`${a * b}${v}^${p + q}`), [mm(`${a + b}${v}^${p + q}`), mm(`${a * b}${v}^${p * q}`), mm(`${a + b}${v}^${p * q}`)].filter(z => z !== mm(`${a * b}${v}^${p + q}`)), `Multiply the numbers (${a * b}) and add the exponents (${p + q}).`); } },
}});

/* ---------- III.5.13 Patterns to expressions ---------- */
const seqR = (R, neg) => { const d = neg && R.bool(0.3) ? -R.int(2, 5) : R.int(2, 7), c = d < 0 ? R.int(15, 30) : R.int(-3, 8); return [d, d + c <= 0 ? c + 10 : c]; };
const rule = (d, c) => lin([[d, 'n'], [c, '']]);
E3.skill({ id: 'III.5.13', name: 'Patterns to expressions', steps: {
  a: { t: 'from tables', g: (R) => { const [d, c] = seqR(R, false), rows = [1, 2, 3, 4].map(n => [n, d * n + c]);
    const ex = `The terms go up by ${d}, so start with ${d}${mm('n')}. ${d}(1) = ${d}, and the first term is ${d + c}, so ${c < 0 ? `subtract ${-c}` : `add ${c}`}: ${H(rule(d, c))}.`;
    if (R.bool(0.3)) return choice(R, 'Which expression gives the term at position n?', H(rule(d, c)), [...new Set([H(`n+${d}`), H(`${d}n`), H(`n+${d + c}`), H(rule(d, d + c))])].filter(z => z !== H(rule(d, c))).slice(0, 3), ex, {visual: V5.table(rows, {head: ['n', 'term']})});
    return num(`Write an expression for the term at position ${mm('n')}.`, [E('term =', rule(d, c))], ex, {visual: V5.table(rows, {head: ['n', 'term']})}); } },
  b: { t: 'growing shapes', g: (R) => { const kind = R.pick(['sq', 'tri', 'house', 'dots', 'dots']);
    const o = {r: R.int(2, 3), c: R.int(0, 2)};
    const [d, c, what] = kind === 'sq' ? [3, 1, 'matchsticks'] : kind === 'tri' ? [2, 1, 'matchsticks'] : kind === 'house' ? [4, 1, 'matchsticks'] : [o.r, o.r * o.c, 'dots'];
    const vis = V5.pattern(kind, o), ex = `Each new shape adds ${d} ${what}. Shape 1 has ${d + c}, so shape ${mm('n')} has ${H(rule(d, c))}.`;
    if (R.bool(0.35)) { const k = R.int(10, 40); return num(`How many ${what} are in shape ${k}?`, d * k + c, `${ex} For ${k}: ${d} × ${k} + ${c} = ${d * k + c}.`, {visual: vis}); }
    return num(`How many ${what} are in shape ${mm('n')}? Write an expression.`, [E('', rule(d, c))], ex, {visual: vis}); } },
  c: { t: 'the nth term', g: (R) => { const [d, c] = seqR(R, true), s = [1, 2, 3, 4].map(n => f(d * n + c)).join(', ');
    if (R.bool(0.4)) { const k = R.int(10, 50); return num(`The sequence ${s}, … continues the same way. Find term number ${k}.`, d * k + c, `The ${mm('n')}th term is ${H(rule(d, c))}. For ${mm('n')} = ${k}: ${d}(${k}) ${c < 0 ? '−' : '+'} ${Math.abs(c)} = ${f(d * k + c)}.`); }
    return num(`Write the ${mm('n')}th term of ${s}, …`, [E('', rule(d, c))], `The difference is ${f(d)}, so ${f(d)}${mm('n')}; then fit the first term: ${f(d)} ${c < 0 ? '−' : '+'} ${Math.abs(c)} = ${f(d + c)}. Rule: ${H(rule(d, c))}.`); } },
  d: { t: 'check the rule', g: (R) => { const [d, c] = seqR(R, false), s = [1, 2, 3, 4].map(n => d * n + c).join(', '), nm = R.pick(NM)[0];
    if (R.bool(0.5)) return choice(R, `Which rule gives every term of ${s}, …?`, H(rule(d, c)), [H(`n+${d}`), H(rule(d + c, 0)), H(rule(d, c + d))].filter(z => z !== H(rule(d, c))), `Check each rule on 2 terms. ${H(rule(d, c))}: ${d}(1) + ${c} = ${d + c} and ${d}(2) + ${c} = ${2 * d + c}.`);
    const w = R.pick([rule(d, c), `n+${d + c - 1}`, rule(d + c, 0), rule(d, c + 1)]), ok = w === rule(d, c);
    const at2 = ({[rule(d, c)]: 2 * d + c, [`n+${d + c - 1}`]: d + c + 1, [rule(d + c, 0)]: 2 * (d + c), [rule(d, c + 1)]: 2 * d + c + 1})[w];
    return choiceFixed(`${nm} says the ${mm('n')}th term of ${s}, … is ${H(w)}. Is that right?`, ['Yes, it fits every term', `No, it doesn't fit every term`], ok ? 0 : 1,
      ok ? `Check more than one term: at ${mm('n')} = 1 it gives ${d + c}, at ${mm('n')} = 2 it gives ${2 * d + c}. It fits.` : `At ${mm('n')} = 2 it gives ${at2}, but the 2nd term is ${2 * d + c}. The rule is ${H(rule(d, c))}.`); } },
}});

/* ---------- III.5.14 Algebra tiles ---------- */
const tileE = g => lin([[g.x2 || 0, 'x^2'], [g.x || 0, 'x'], [g.u || 0, '']]);
E3.skill({ id: 'III.5.14', name: 'Algebra tiles', steps: {
  a: { t: 'represent', g: (R) => { let g; do g = {x2: R.int(0, 2), x: R.int(0, 5), u: R.int(0, 6) * (R.bool(0.25) ? -1 : 1)}; while ([g.x2, g.x, g.u].filter(Boolean).length < 2 || g.x2 === g.x);
    const ok = tileE(g), bad = [tileE({x2: g.x, x: g.x2, u: g.u}), tileE({x2: g.x2, x: g.u, u: g.x}), lin([[g.x2 + g.x, g.x2 ? 'x^2' : 'x'], [g.u, '']]), tileE({x2: g.x2, x: g.x, u: -g.u})].filter(z => z !== ok);
    return choice(R, 'Which expression do the tiles show?', H(ok), R.sample([...new Set(bad)], 3).map(H), `Count each kind: big squares are ${mm('x^2')}, strips are ${mm('x')}, small squares are 1${g.u < 0 ? ' (red ones are negative)' : ''}. ${H(ok)}.`, {visual: V5.tiles([g])}); } },
  b: { t: 'combine', g: (R) => { let g1, g2, out; do { g1 = {x: nz(R, -4, 5), u: nz(R, -5, 6)}; g2 = {x: nz(R, -4, 4), u: nz(R, -5, 5)}; out = {x: g1.x + g2.x, u: g1.u + g2.u}; } while (!out.x || (g1.x * g2.x > 0 && g1.u * g2.u > 0) || Math.abs(g1.x) + Math.abs(g2.x) > 8);
    return num(`Combine the tiles. Remove zero pairs. What expression is left? Simplify.`, [E('', tileE(out), 'simplified')], `(${H(tileE(g1))}) + (${H(tileE(g2))}): a strip and a red strip make 0, and so do a unit and a red unit. Left: ${H(tileE(out))}.`, {visual: V5.tiles([g1, g2])}); } },
  c: { t: 'distribute', g: (R) => { const t = R.int(0, 1), a = R.int(1, 4), b = R.int(1, 4);
    if (t === 0) { const k = R.int(2, 4), out = lin([[k, 'x'], [k * b, '']]);
      return num(`The rectangle is ${k} by ${H(`x+${b}`)}. Fill it with tiles. Write its area with no brackets.`, [E('', out, 'expanded')], `Each of the ${k} rows holds 1 strip and ${b} unit${b > 1 ? 's' : ''}: ${k}(${H(`x+${b}`)}) = ${H(out)}.`, {visual: V5.frame(['x', ...Array(b).fill('1')], Array(k).fill('1'))}); }
    const out = lin([[1, 'x^2'], [a + b, 'x'], [a * b, '']]);
    return num(`The rectangle is ${H(`x+${a}`)} by ${H(`x+${b}`)}. Fill it with tiles. Write its area with no brackets.`, [E('', out, 'expanded')], `One ${mm('x^2')} square, ${a} + ${b} = ${a + b} strips, and ${a} × ${b} = ${a * b} units: ${H(out)}.`, {visual: V5.frame(['x', ...Array(b).fill('1')], ['x', ...Array(a).fill('1')])}); } },
  d: { t: 'factor', g: (R) => { const t = R.int(0, 2);
    if (t === 0) { const k = R.int(2, 4), b = R.int(1, 4), ok = `${k}(x+${b})`;
      return choice(R, `Arrange the tiles into a rectangle. Which shows its sides?`, H(ok), [H(`${k}(x+${k * b})`), H(`x(${k}+${k * b})`), H(`${k + b}(x+1)`)], `${k} strips and ${k * b} units make ${k} rows of 1 strip and ${b} unit${b > 1 ? 's' : ''}: ${H(ok)}.`, {visual: V5.tiles([{x: k, u: k * b}])}); }
    let a, b; do { a = R.int(1, 4); b = R.int(1, 4); } while (a > b);
    const ok = `(x+${a})(x+${b})`, bad = [`(x+1)(x+${a * b})`, `(x+${a + b})(x+1)`, `(x+${a})(x+${b + 1})`, `(x+${a + b})(x+${a * b})`].filter(z => z !== ok && !(a === 1 && z === `(x+1)(x+${a * b})`));
    return choice(R, `Arrange the tiles into a rectangle. Which shows its sides?`, H(ok), R.sample(bad, 3).map(H), `The ${mm('x^2')} goes in a corner, ${a + b} strips split ${a} and ${b} along the sides, and ${a} × ${b} = ${a * b} units fill the rest: ${H(ok)}.`, {visual: V5.tiles([{x2: 1, x: a + b, u: a * b}])}); } },
}});

/* ---------- III.5.15 Why number tricks work ---------- */
const OPS = {add: (k) => `Add ${k}.`, sub: (k) => `Subtract ${k}.`, mul: (k) => `Multiply by ${k}.`, div: (k) => `Divide by ${k}.`, subn: () => 'Subtract the number you started with.'};
const runT = (ops, n) => ops.reduce((v, [o, k]) => o === 'add' ? v + k : o === 'sub' ? v - k : o === 'mul' ? v * k : o === 'div' ? v / k : v - n, n);
const symT = ops => ops.reduce(([a, b], [o, k]) => o === 'add' ? [a, b + k] : o === 'sub' ? [a, b - k] : o === 'mul' ? [a * k, b * k] : o === 'div' ? [a / k, b / k] : [a - 1, b], [1, 0]);
const trick = R => { const k = R.int(2, 5), a = R.int(2, 9), t = R.int(0, 3);
  if (t === 0) return [['mul', k], ['add', k * a], ['div', k], ['subn']];
  if (t === 1) return [['add', a], ['mul', k], ['sub', k * a], ['div', k]];
  if (t === 2) return [['add', a], ['mul', k], ['div', k], ['subn']];
  return [['mul', 2], ['add', a], ['mul', 5], ['sub', 5 * a]]; };
const tText = ops => 'Think of a number. ' + ops.map(([o, k]) => OPS[o](k)).join(' ');
E3.skill({ id: 'III.5.15', name: 'Why number tricks work', steps: {
  a: { t: '"think of a number" tricks', g: (R) => { const ops = trick(R), n = R.int(2, 20); let v = n; const chain = [n];
    ops.forEach(([o, k]) => { v = runT([[o, k]], v); if (o === 'subn') v = chain[chain.length - 1] - n; chain.push(v); });
    return num(`${tText(ops)} If you start with ${n}, what do you end with?`, chain[chain.length - 1], `${chain.join(' → ')}.`); } },
  b: { t: 'follow it with a variable', g: (R) => { const ops = trick(R), j = R.int(2, ops.length);
    const [a, b] = symT(ops.slice(0, j)), e = lin([[a, 'n'], [b, '']]);
    const trail = [1, 2, 3, 4].slice(0, j).map(i => H(lin((([p, q]) => [[p, 'n'], [q, '']])(symT(ops.slice(0, i)))))).join(' → ');
    return num(`${tText(ops)} Call the number ${mm('n')}. What expression do you have after step ${j}${j === ops.length ? ' (the end)' : ''}? Simplify.`, [E('', e, 'simplified')], `${mm('n')} → ${trail}.`); } },
  c: { t: 'create one', g: (R) => { const k = R.int(2, 5), a = R.pick([2, 3, 4, 5, 6, 7, 8, 9].filter(z => z !== k)), t = R.int(0, 1);
    if (t === 0) return choice(R, `Finish the trick so everyone ends with ${a}. Think of a number. Multiply by ${k}. Add ${k * a}. Divide by ${k}. Then…`, 'Subtract the number you started with.', [`Subtract ${a}.`, `Divide by ${a}.`, `Add the number you started with.`], `With ${mm('n')}: ${H(`${k}n`)} → ${H(`${k}n+${k * a}`)} → ${H(`n+${a}`)}. Subtracting ${mm('n')} leaves ${a} for everyone.`);
    return choice(R, `Finish the trick so everyone gets back their starting number. Think of a number. Add ${a}. Multiply by ${k}. Subtract ${k * a}. Then…`, `Divide by ${k}.`, [`Subtract ${a}.`, `Divide by ${a}.`, `Subtract ${k}.`], `With ${mm('n')}: ${H(`n+${a}`)} → ${H(`${k}n+${k * a}`)} → ${H(`${k}n`)}. Dividing by ${k} gives ${mm('n')}.`); } },
  d: { t: 'explain with algebra', g: (R) => { const k = R.int(2, 5), a = R.int(2, 9), t = R.int(0, 1);
    if (t === 0) return choice(R, `Think of a number. Multiply by ${k}. Add ${k * a}. Divide by ${k}. Subtract the number you started with. Why do you always get ${a}?`, `With ${mm('n')}, the steps simplify to ${a}: the ${mm('n')}'s cancel`, [`It gave ${a} for 3 numbers I tried`, `${k * a} ÷ ${k} = ${a}, and the rest doesn't matter`, `Every number works because ${mm('n')} = ${a}`], `(${H(`${k}n+${k * a}`)}) ÷ ${k} = ${H(`n+${a}`)}, and subtracting ${mm('n')} leaves ${a}. Testing a few numbers can't show it always works; the algebra does.`);
    return choice(R, `Think of a number. Double it. Add ${a}. Multiply by 5. Subtract ${5 * a}. What do you always get?`, `10 times your number: ${H('10n')}`, [`Always ${5 * a}`, H(`10n+${5 * a}`), H(`5n+${a}`)], `5(${H(`2n+${a}`)}) − ${5 * a} = ${H(`10n+${5 * a}`)} − ${5 * a} = ${H('10n')}: your number with a 0 on the end.`); } },
}});

})();

/* Era III · Unit III.6 Equations & inequalities (III.6.01–III.6.12)
   Local helpers live under V6 / small functions inside this file. */
(function(){ const {num, choice, choiceFixed, tf, frac, fh, fmt, m, V, C} = E3;
const f = n => fmt(n);
const gcd = E3.gcd;
// m() plus italics for runs of variables like rt, lw
const mm = s => m(s).replace(/(^|[^a-zA-Z<\/&;])([a-z]{2,3})(?![a-zA-Z>;])/g, (_, p, w) => p + w.split('').map(c => `<i>${c}</i>`).join('')).replace(/\( − /g, '(−');
const sp = s => String(s).replace(/([^(^*/+\-])([+\-])/g, '$1 $2 ');
const H = s => mm(sp(s));
const n2 = a => String(Math.round(a * 1000) / 1000);
const term = (c, v) => { const a = Math.abs(c); return v ? (a === 1 ? '' : n2(a)) + v : n2(a); };
// [[3,'x'],[-4,'']] → '3x-4'
const lin = ts => { let s = ''; ts.forEach(([c, v]) => { if (!c) return; s += (s ? (c < 0 ? '-' : '+') : (c < 0 ? '-' : '')) + term(c, v); }); return s || '0'; };
const L = ts => H(lin(ts));
const eqH = (l, r) => `${H(l)} = ${H(r)}`;
const nz = (R, lo, hi) => { let v; do v = R.int(lo, hi); while (!v); return v; };
const pn = n => n < 0 ? `(${f(n)})` : f(n);
const red = (n, d) => { if (d < 0) { n = -n; d = -d; } const g = gcd(n, d); return [n / g, d / g]; };
// rational as HTML: whole number or stacked fraction with sign
const qh = (n, d = 1) => { [n, d] = red(n, d); if (d === 1) return f(n); return (n < 0 ? '−' : '') + fh(Math.abs(n), d); };
// rational answer field
const qf = (n, d = 1, label) => { [n, d] = red(n, d); const o = d === 1 ? {ans: n} : frac(n, d, 'any'); if (label) o.label = label; return o; };
const money = (O, n) => O.coins === 'THB' ? `${fmt(n)} baht` : `$${fmt(n)}`;
// c·(v) + k as worked HTML, e.g. 3(−2) + 5
const sb = (c, v, k = 0) => `${c === 1 ? pn(v) : c === -1 ? '−' + pn(v) : `${f(c)}(${f(v)})`}${k ? (k < 0 ? ' − ' : ' + ') + f(Math.abs(k)) : ''}`;
const coef = (c, v = 'x') => c === 1 ? mm(v) : c === -1 ? '−' + mm(v) : f(c) + mm(v);

/* ---------- inequalities ---------- */
const OPS = {'<': '&lt;', '>': '&gt;', '<=': '≤', '>=': '≥'};
const flip = o => ({'<': '>', '>': '<', '<=': '>=', '>=': '<='})[o];
const swapIn = o => ({'<': '<=', '<=': '<', '>': '>=', '>=': '>'})[o];
const holds = (o, a, b) => o === '<' ? a < b : o === '<=' ? a <= b : o === '>' ? a > b : a >= b;
const IQ = (v, o, rhsHTML) => `${mm(v)} ${OPS[o]} ${rhsHTML}`;
const IQn = (v, o, n, d = 1) => IQ(v, o, qh(n, d));
const WORD = {'<': 'less than', '<=': 'less than or equal to', '>': 'greater than', '>=': 'greater than or equal to'};

/* ---------- V6 visuals ---------- */
const V6 = {};
const lab = v => String(v).replace('-', '−');
// number line with an inequality graph: boundary b, op o (x o b). o=null draws a plain line.
V6.ray = (b, o, opt = {}) => {
  const lo = opt.from ?? b - 5, hi = opt.to ?? b + 5, W = opt.w || 420, pad = 24, y = 22, H = 52;
  const X = v => pad + (v - lo) / (hi - lo) * (W - 2 * pad), L0 = pad - 14, L1 = W - pad + 14;
  const head = (x, dir, col) => `<polygon points="${x},${y} ${x - dir * 10},${y - 6} ${x - dir * 10},${y + 6}" fill="${col}"/>`;
  let s = `<line x1="${L0}" y1="${y}" x2="${L1}" y2="${y}" stroke="${C.ink}" stroke-width="2"/>` + head(L0, -1, C.ink) + head(L1, 1, C.ink);
  const step = hi - lo > 14 ? 2 : 1;
  for (let v = lo; v <= hi; v++) { s += `<line x1="${X(v)}" y1="${y - 6}" x2="${X(v)}" y2="${y + 6}" stroke="${C.ink}" stroke-width="1.5"/>`; if ((v - lo) % step === 0) s += V.text(X(v), y + 20, lab(v), {size: 14}); }
  if (o) { const right = o[0] === '>', end = right ? L1 : L0, closed = o.length === 2;
    s += `<line x1="${X(b)}" y1="${y}" x2="${end - (right ? 8 : -8)}" y2="${y}" stroke="${C.blue}" stroke-width="6"/>` + head(end + (right ? 2 : -2), right ? 1 : -1, C.blue);
    s += `<circle cx="${X(b)}" cy="${y}" r="7.5" fill="${closed ? C.blue : C.paper}" stroke="${C.blue}" stroke-width="3"/>`; }
  return V.svg(W, H, s, 'number line');
};
// four labelled number lines A–D (for "which graph" questions)
V6.four = (items, lo, hi) => {
  let s = '', y = 0; const W = 480;
  items.forEach(([b, o], i) => { s += V.text(14, y + 22, 'ABCD'[i], {size: 17, weight: 700}) + V.nest(V6.ray(b, o, {from: lo, to: hi, w: 450}), 30, y); y += 58; });
  return V.svg(W, y - 4, s, 'four number lines');
};
// balance scale: k bags (x) and a blocks on the left, b blocks on the right
V6.balance = (k, a, b) => {
  const W = 420, by = 110; let s = '';
  s += `<polygon points="${W / 2 - 24},${by + 58} ${W / 2 + 24},${by + 58} ${W / 2},${by + 8}" fill="${C.muted}"/>`;
  s += `<line x1="10" y1="${by + 60}" x2="${W - 10}" y2="${by + 60}" stroke="${C.line}" stroke-width="2"/>`;
  s += `<rect x="16" y="${by}" width="${W - 32}" height="8" rx="3" fill="${C.ink}"/>`;
  const blocks = (n, x0, x1) => { let o = ''; const z = 17, g = 3, per = Math.max(1, Math.floor((x1 - x0 + g) / (z + g)));
    for (let i = 0; i < n; i++) { const c = i % per, r = Math.floor(i / per); o += `<rect x="${x0 + c * (z + g)}" y="${by - (r + 1) * (z + g) + g - 1}" width="${z}" height="${z}" fill="${C.amber}" stroke="${C.ink}" stroke-width="1.2"/>`; } return o; };
  let x = 26;
  for (let i = 0; i < k; i++) { s += `<path d="M${x + 4} ${by - 1} L${x + 30} ${by - 1} Q${x + 36} ${by - 30} ${x + 24} ${by - 38} L${x + 10} ${by - 38} Q${x - 2} ${by - 30} ${x + 4} ${by - 1} Z" fill="${C.violet}" stroke="${C.ink}" stroke-width="1.5"/><rect x="${x + 11}" y="${by - 46}" width="12" height="8" rx="2" fill="${C.violet}" stroke="${C.ink}" stroke-width="1.5"/>` + `<text x="${x + 17}" y="${by - 18}" font-size="17" fill="#fff" text-anchor="middle" dominant-baseline="central" font-style="italic" font-weight="700">x</text>`; x += 40; }
  s += blocks(a, x + 4, W / 2 - 14) + blocks(b, W / 2 + 14, W - 24);
  return V.svg(W, by + 64, s, 'balance scale');
};

/* ---------- III.6.01 What an equation is ---------- */
E3.skill({ id: 'III.6.01', name: 'What an equation is', steps: {
  a: { t: 'the balance idea', g: (R) => { const k = R.int(1, 3), v = R.int(1, 5); let a = R.int(0, k === 3 ? 6 : 8); if (k === 1 && !a) a = R.int(1, 8);
    const b = k * v + a, vis = {visual: V6.balance(k, a, b)}; let t = R.int(0, 2); if (t === 1 && !a) t = 0;
    if (t === 0) return num('The scale balances. Every bag holds the same number of blocks. How many blocks are in one bag?', v,
      `${a ? `Take ${a} block${a > 1 ? 's' : ''} off both sides: ` : ''}${k} bag${k > 1 ? 's' : ''} balance${k > 1 ? '' : 's'} ${b - a} block${b - a > 1 ? 's' : ''}, so one bag holds ${k > 1 ? `${b - a} ÷ ${k} = ` : ''}${v}.`, vis);
    if (t === 1) { const c = R.int(1, a);
      return choice(R, `You take ${c} block${c > 1 ? 's' : ''} off the left side. What keeps the scale balanced?`, `Take ${c} block${c > 1 ? 's' : ''} off the right side`,
        [`Add ${c} block${c > 1 ? 's' : ''} to the right side`, 'Leave the right side as it is', `Take ${c + 1} blocks off the right side`], 'Doing the same thing to both sides keeps an equation balanced.', vis); }
    const ok = eqH(lin([[k, 'x'], [a, '']]), String(b));
    const bad = [a ? eqH(lin([[k, 'x']]), String(b)) : eqH(lin([[k, 'x']]), String(b + k)), k > 1 ? eqH(lin([[1, 'x'], [a, '']]), String(b)) : eqH(lin([[1, 'x'], [b, '']]), String(a || 1)), eqH(lin([[k + a, 'x']]), String(b)), eqH(lin([[k, 'x'], [b, '']]), String(a))];
    return choice(R, `Each bag holds ${mm('x')} blocks. Which equation matches the scale?`, ok, bad.slice(0, 3), `The left side has ${k} bag${k > 1 ? 's' : ''} and ${a} block${a === 1 ? '' : 's'}: ${L([[k, 'x'], [a, '']])}. The right side has ${b}.`, vis); } },
  b: { t: 'what a solution means', g: (R) => { const a = R.int(2, 6), s = R.int(1, 9), c0 = R.int(1, 12), c = a * s + c0, t = R.int(0, 2), e = eqH(`${a}x+${c0}`, String(c));
    const ex = `${a}(${s}) + ${c0} = ${c}, so both sides are equal when ${mm('x')} = ${s}.`;
    if (t === 0) return choice(R, `Which value of ${mm('x')} is a solution of ${e}?`, f(s), [f(c), f(a * s), f(s + 1)], ex + ' The number on the right is not the answer; a solution makes both sides equal.');
    if (t === 1) return choice(R, `${mm('x')} = ${s} is a solution of ${e}. What does that mean?`, `Putting ${s} in for ${mm('x')} makes both sides equal`,
      [`The right side of the equation is ${s}`, `${mm('x')} = ${s} in every equation`, `Putting ${c} in for ${mm('x')} makes it true`], ex);
    return choice(R, `Which equation has ${mm('x')} = ${s} as a solution?`, e, [eqH(`${a}x+${c0}`, String(c + a)), eqH(`${a}x-${c0}`, String(c)), eqH(`x+${c0}`, String(c))], ex); } },
  c: { t: 'test values', g: (R) => { let p, r; do { p = R.int(2, 7); r = R.int(1, 6); } while (p === r);
    const v = R.int(-4, 6), q = R.int(-9, 9), ok = R.bool(), s = p * v + q - r * v + (ok ? 0 : R.pick([-3, -2, -1, 1, 2, 3]));
    const lhs = lin([[p, 'x'], [q, '']]), rhs = lin([[r, 'x'], [s, '']]), A = p * v + q, B = r * v + s, t = R.int(0, 2);
    const ex = `Left: ${sb(p, v, q)} = ${f(A)}. Right: ${sb(r, v, s)} = ${f(B)}. ${A === B ? `They match, so ${mm('x')} = ${f(v)} is a solution.` : `They differ, so ${mm('x')} = ${f(v)} is not a solution.`}`;
    if (t === 0) return num(`Test ${mm('x')} = ${f(v)} in ${eqH(lhs, rhs)}. Work out each side.`, [{label: 'left side', ans: A}, {label: 'right side', ans: B}], ex);
    if (t === 1) return choiceFixed(`Is ${mm('x')} = ${f(v)} a solution of ${eqH(lhs, rhs)}?`, ['Yes', 'No'], A === B ? 0 : 1, ex);
    // which of the values works
    const sol = v, s2 = p * v + q - r * v, others = R.sample([-3, -2, -1, 1, 2, 3], 2).map(d => sol + d);
    const ex2 = `Test ${mm('x')} = ${f(sol)}: left ${sb(p, sol, q)} = ${f(p * sol + q)}, right ${sb(r, sol, s2)} = ${f(r * sol + s2)}. They match.`;
    return choice(R, `Test each value. Which one solves ${eqH(lhs, lin([[r, 'x'], [s2, '']]))}?`, `${mm('x')} = ${f(sol)}`, others.map(o => `${mm('x')} = ${f(o)}`), ex2); } },
  d: { t: 'true or false', g: (R) => { const t = R.int(0, 3);   // half the time: statements about equations with x
    if (t === 0) { const a = R.int(2, 9), b = R.int(2, 9), S = a + b, tr = R.bool(), k = R.int(0, 1); let c, d;
      if (tr) { do { c = R.int(1, S - 1); } while (c === a || c === b); d = S - c; }
      else if (k === 0) { c = S; d = R.int(1, 9); } else { do { c = R.int(1, S); } while (c === a || c === b); d = S - c + R.pick([-1, 1]); if (d < 1) d = S - c + 1; }
      return tf(`True or false: ${a} + ${b} = ${c} + ${d}`, tr, tr ? `Both sides equal ${S}.` : `The left side is ${S} but the right side is ${c + d}. The = sign says both sides are equal; it doesn't mean “the answer comes next”.`); }
    if (t === 1) { const a = R.int(2, 9), b = R.int(2, 9), P = a * b, tr = R.bool(), d = R.int(1, 9), c = tr ? P + d : P;
      return tf(`True or false: ${a} × ${b} = ${c} − ${d}`, tr, tr ? `Both sides equal ${P}.` : `The left side is ${P} but the right side is ${c - d}. Both sides must have the same value.`); }
    const a = R.int(2, 6), b = R.int(2, 9), c = b + R.int(1, 5), k = R.int(0, 5);
    const T = [[`${H(`${a}(x+${b})`)} = ${H(`${a}x+${a * b}`)} is true for every ${mm('x')}.`, true, `Expand: ${a}(${mm('x')} + ${b}) = ${H(`${a}x+${a * b}`)}, the same as the right side.`],
      [`${H(`${a}(x+${b})`)} = ${H(`${a}x+${b}`)} is true for every ${mm('x')}.`, false, `${a}(${mm('x')} + ${b}) = ${H(`${a}x+${a * b}`)}, not ${H(`${a}x+${b}`)}. At ${mm('x')} = 0 the sides are ${a * b} and ${b}.`],
      [`${H(`x+${b}`)} = ${H(`x+${c}`)} has no solution.`, true, `Whatever ${mm('x')} is, ${H(`x+${b}`)} is ${c - b} less than ${H(`x+${c}`)}, so they are never equal.`],
      [`${H('x+x')} = ${m('x^2')} is true for every ${mm('x')}.`, false, `At ${mm('x')} = 3: ${H('x+x')} = 6 but ${m('x^2')} = 9.`],
      [`${H(`${a}x`)} = ${H(`x+${a}`)} is true for every ${mm('x')}.`, false, `At ${mm('x')} = 0: ${a}(0) = 0 but 0 + ${a} = ${a}.`],
      [`${H(`${a}x-${a}x`)} = 0 is true for every ${mm('x')}.`, true, `${a}${mm('x')} − ${a}${mm('x')} is always 0.`]][k];
    return tf(`True or false: ${T[0]}`, T[1], T[2]); } },
}});

/* ---------- III.6.02 One-step equations: + and − ---------- */
const VAR = ['x', 'y', 'n', 'm', 'p', 'a'];
E3.skill({ id: 'III.6.02', name: 'One-step equations: + and −', steps: {
  a: { t: 'whole numbers', g: (R) => { const v = R.pick(VAR), a = R.int(2, 25), t = R.int(0, 3); let x = R.int(1, 40);
    if (t === 1) x = R.int(a + 1, a + 40);
    const Tt = [[eqH(`${v}+${a}`, String(x + a)), `Subtract ${a} from both sides: ${mm(v)} = ${x + a} − ${a} = ${x} (not ${x + 2 * a}).`],
      [eqH(`${v}-${a}`, String(x - a)), `Add ${a} to both sides: ${mm(v)} = ${x - a} + ${a} = ${x}.`],
      [eqH(`${a}+${v}`, String(x + a)), `Subtract ${a} from both sides: ${mm(v)} = ${x + a} − ${a} = ${x}.`],
      [eqH(String(x + a), `${v}+${a}`), `Subtract ${a} from both sides: ${x + a} − ${a} = ${x}, so ${mm(v)} = ${x}.`]][t];
    return num(`Solve ${Tt[0]}.`, x, Tt[1]); } },
  b: { t: 'negatives', g: (R) => { const v = R.pick(VAR), x = nz(R, -25, 20), a = nz(R, -15, 15), t = R.int(0, 2), b = x + a;
    if (t === 0) return num(`Solve ${eqH(lin([[1, v], [a, '']]), String(b))}.`, x, `${a > 0 ? `Subtract ${a} from` : `Add ${-a} to`} both sides: ${mm(v)} = ${f(b)} ${a > 0 ? '−' : '+'} ${Math.abs(a)} = ${f(x)}.`);
    if (t === 1) { const k = Math.abs(a); if (a > 0) return num(`Solve ${eqH(`${v}-(-${k})`, String(x + k))}.`, x, `Subtracting −${k} is adding ${k}: ${H(`${v}+${k}`)} = ${f(x + k)}, so ${mm(v)} = ${f(x + k)} − ${k} = ${f(x)}.`);
      return num(`Solve ${eqH(`${v}+(-${k})`, String(x - k))}.`, x, `Adding −${k} is subtracting ${k}: ${H(`${v}-${k}`)} = ${f(x - k)}, so ${mm(v)} = ${f(x - k)} + ${k} = ${f(x)}.`); }
    return num(`Solve ${eqH(lin([[a, ''], [1, v]]), String(b))}.`, x, `${a > 0 ? `Subtract ${a} from` : `Add ${-a} to`} both sides: ${mm(v)} = ${f(b)} ${a > 0 ? '−' : '+'} ${Math.abs(a)} = ${f(x)}.`); } },
  c: { t: 'fractions', g: (R) => { const v = R.pick(['x', 'y', 'n']), D = R.pick([4, 6, 8, 10, 12]); let xn, an;
    do { xn = nz(R, -D, 2 * D); } while (xn % D === 0);
    do { an = R.int(1, 2 * D - 1); } while (an % D === 0 || red(an, D)[1] === red(xn, D)[1] && R.bool(0.6));
    const add = R.bool(), bn = add ? xn + an : xn - an;
    const e = `${mm(v)} ${add ? '+' : '−'} ${qh(an, D)} = ${qh(bn, D)}`;
    return num(`Solve ${e}. Give ${mm(v)} as a fraction.`, [qf(xn, D, `${v} =`)],
      `${add ? 'Subtract' : 'Add'} ${qh(an, D)} ${add ? 'from' : 'to'} both sides: ${mm(v)} = ${qh(bn, D)} ${add ? '−' : '+'} ${qh(an, D)} = ${fh(lab(bn), D)} ${add ? '−' : '+'} ${fh(an, D)} = ${qh(xn, D)}.`); } },
  d: { t: 'decimals', g: (R) => { const v = R.pick(VAR), dp = R.pick([1, 2]), u = dp === 1 ? 10 : 100; let xi, ai;
    do { xi = nz(R, -30 * u, 30 * u); } while (xi % u === 0);
    do { ai = R.int(1, 15 * u); } while (ai % u === 0);
    const add = R.bool(), bi = add ? xi + ai : xi - ai, X = xi / u, A = ai / u, B = bi / u;
    return num(`Solve ${mm(v)} ${add ? '+' : '−'} ${f(A)} = ${f(B)}.`, X, `${add ? 'Subtract' : 'Add'} ${f(A)} ${add ? 'from' : 'to'} both sides: ${mm(v)} = ${f(B)} ${add ? '−' : '+'} ${f(A)} = ${f(X)}.`); } },
}});

/* ---------- III.6.03 One-step equations: × and ÷ ---------- */
const ov = (v, d) => fh(mm(v), lab(d));
E3.skill({ id: 'III.6.03', name: 'One-step equations: × and ÷', steps: {
  a: { t: 'whole numbers', g: (R) => { const v = R.pick(VAR), a = R.int(2, 12), x = R.int(2, 15);
    if (R.bool(0.6)) return num(`Solve ${H(`${a}${v}`)} = ${a * x}.`, x, `Divide both sides by ${a}: ${mm(v)} = ${a * x} ÷ ${a} = ${x}.`);
    return num(`Solve ${ov(v, a)} = ${x}.`, a * x, `Multiply both sides by ${a}: ${mm(v)} = ${x} × ${a} = ${a * x} (not ${x} ÷ ${a}).`); } },
  b: { t: 'negatives', g: (R) => { const v = R.pick(VAR); let a, x; do { a = nz(R, -12, 12); x = nz(R, -12, 12); } while ((a > 0 && x > 0) || a === 1);
    if (R.bool(0.65)) return num(`Solve ${coef(a, v)} = ${f(a * x)}.`, x, `Divide both sides by ${f(a)}${a < 0 ? `, not ${-a}` : ''}: ${mm(v)} = ${f(a * x)} ÷ ${pn(a)} = ${f(x)}.`);
    const d = a === -1 ? -2 : a;
    return num(`Solve ${ov(v, d)} = ${f(x)}.`, x * d, `Multiply both sides by ${f(d)}: ${mm(v)} = ${f(x)} × ${pn(d)} = ${f(x * d)}.`); } },
  c: { t: 'fractions, with reciprocals', g: (R) => { const v = R.pick(['x', 'y', 'n']); let p, q; do { p = R.int(1, 7); q = R.int(2, 9); } while (gcd(p, q) !== 1 || p === q);
    const sg = R.bool(0.3) ? -1 : 1, P = sg * p, cH = `${sg < 0 ? '−' : ''}${fh(p, q)}${mm(v)}`, t = R.int(0, 2);
    if (t === 0) { const k = nz(R, -6, 9), x = q * k, r = P * k;
      return num(`Solve ${cH} = ${f(r)}.`, x, `Multiply both sides by the reciprocal ${qh(sg * q, p)}: ${mm(v)} = ${f(r)} × ${qh(sg * q, p)} = ${f(x)}.`); }
    if (t === 1) { let rn, rd; do { rd = R.pick([2, 3, 4, 5, 6]); rn = nz(R, -9, 9); } while (red(rn, rd)[1] === 1);
      const [xn, xd] = red(rn * q, rd * P);
      return num(`Solve ${cH} = ${qh(rn, rd)}.`, [qf(xn, xd, `${v} =`)], `Multiply both sides by ${qh(sg * q, p)}: ${mm(v)} = ${qh(rn, rd)} × ${qh(sg * q, p)} = ${qh(xn, xd)}.`); }
    const k = R.int(1, 9) * p;
    return choice(R, `To solve ${cH} = ${f(P * k / p * 1)}, multiply both sides by what?`, qh(sg * q, p), [qh(sg * p, q), qh(-sg * q, p), f(q)].filter(z => z !== qh(sg * q, p)).slice(0, 3),
      `Multiplying by the reciprocal ${qh(sg * q, p)} turns ${qh(P, q)}${mm(v)} into ${mm(v)}.`); } },
  d: { t: 'decimals', g: (R) => { const v = R.pick(VAR), c = R.pick([0.2, 0.25, 0.4, 0.5, 0.6, 0.8, 1.2, 1.5, 2.5, 0.3]), t = R.int(0, 2); let xi;
    do { xi = nz(R, -80, 150); } while (xi % 10 === 0 && R.bool(0.5));
    const x = xi / 10, ci = Math.round(c * 100);
    if (t < 2) { const b = ci * xi / 1000;
      return num(`Solve ${f(c)}${mm(v)} = ${f(b)}.`, x, `Divide both sides by ${f(c)}: ${mm(v)} = ${f(b)} ÷ ${f(c)} = ${f(x)}.`); }
    const b = xi / 10, X = ci * xi / 1000;
    return num(`Solve ${ov(v, f(c))} = ${f(b)}.`, X, `Multiply both sides by ${f(c)}: ${mm(v)} = ${f(b)} × ${f(c)} = ${f(X)}.`); } },
}});

/* ---------- III.6.04 Two-step equations ---------- */
E3.skill({ id: 'III.6.04', name: 'Two-step equations', steps: {
  a: { t: 'ax + b = c', g: (R) => { const v = R.pick(VAR), a = R.int(2, 9), x = R.int(1, 12), b = R.int(1, 20), neg = R.bool(0.35) && a * x > b;
    const c = neg ? a * x - b : a * x + b;
    return num(`Solve ${eqH(`${a}${v}${neg ? '-' : '+'}${b}`, String(c))}.`, x, `${neg ? `Add ${b}` : `Subtract ${b}`} first: ${H(`${a}${v}`)} = ${a * x}. Then divide by ${a}: ${mm(v)} = ${x}.`); } },
  b: { t: 'with negatives', g: (R) => { const v = R.pick(VAR); let a, x; do { a = nz(R, -9, 9); x = nz(R, -10, 10); } while ((a > 0 && x > 0) || Math.abs(a) === 1 && R.bool(0.7));
    const b = nz(R, -20, 20), c = a * x + b, front = R.bool(0.35);
    const lhs = front ? lin([[b, ''], [a, v]]) : lin([[a, v], [b, '']]);
    return num(`Solve ${eqH(lhs, String(c))}.`, x, `${b > 0 ? `Subtract ${b} from` : `Add ${-b} to`} both sides: ${coef(a, v)} = ${f(a * x)}. Divide by ${f(a)}: ${mm(v)} = ${f(x)}.`); } },
  c: { t: 'with fractions', g: (R) => { const v = R.pick(['x', 'y', 'n']), t = R.int(0, 3);
    if (t === 0) { const a = R.int(2, 6), x = a * nz(R, -6, 9), b = nz(R, -12, 12), c = x / a + b;
      return num(`Solve ${ov(v, a)} ${b > 0 ? '+' : '−'} ${Math.abs(b)} = ${f(c)}.`, x, `${b > 0 ? 'Subtract' : 'Add'} ${Math.abs(b)}: ${ov(v, a)} = ${f(x / a)}. Multiply by ${a}: ${mm(v)} = ${f(x)}.`); }
    if (t === 1) { let p, q; do { p = R.int(2, 5); q = R.int(p + 1, 9); } while (gcd(p, q) !== 1); const k = nz(R, -5, 8), x = q * k, b = R.int(1, 12), c = p * k - b;
      return num(`Solve ${fh(p, q)}${mm(v)} − ${b} = ${f(c)}.`, x, `Add ${b}: ${fh(p, q)}${mm(v)} = ${f(p * k)}. Multiply by ${fh(q, p)}: ${mm(v)} = ${f(x)}.`); }
    if (t === 2) { let a, r; do { a = R.int(2, 9); r = nz(R, -30, 40); } while (r % a === 0); const b = nz(R, -12, 12), c = r + b;
      return num(`Solve ${eqH(lin([[a, v], [b, '']]), String(c))}. Give ${mm(v)} as a fraction.`, [qf(r, a, `${v} =`)], `${b > 0 ? 'Subtract' : 'Add'} ${Math.abs(b)}: ${H(`${a}${v}`)} = ${f(r)}. Divide by ${a}: ${mm(v)} = ${qh(r, a)}.`); }
    const a = R.int(2, 6), c = nz(R, -6, 9), b = nz(R, -10, 10), x = a * c - b;
    return num(`Solve ${fh(H(lin([[1, v], [b, '']])), a)} = ${f(c)}.`, x, `Multiply by ${a}: ${L([[1, v], [b, '']])} = ${f(a * c)}. ${b > 0 ? 'Subtract' : 'Add'} ${Math.abs(b)}: ${mm(v)} = ${f(x)}.`); } },
  d: { t: 'check the solution', g: (R) => { const a = R.int(2, 6), x = R.int(-5, 9), b = R.int(2, 15), c = a * x + b, e = eqH(`${a}x+${b}`, String(c));
    const k = R.bool() ? 0 : R.int(1, 2), cl = k === 0 ? [x, 1] : k === 1 ? red(c - a * b, a) : red(c + b, a), right = cl[0] === x * cl[1];
    const val = a * cl[0] / cl[1] + b, nm = R.pick(['Kai', 'Mia', 'Leo', 'Ana', 'Sam']);
    const ex = `${a}(${qh(...cl)}) + ${b} = ${f(val)}${right ? `, which matches ${c}. It is a solution.` : `, not ${c}. It is not a solution${k === 1 ? ': subtract before dividing' : ''}.`}`;
    if (R.bool(0.5)) return num(`${nm} says ${mm('x')} = ${qh(...cl)} solves ${e}. Check: what is ${H(`${a}x+${b}`)} when ${mm('x')} = ${qh(...cl)}? Then solve the equation yourself.`, [{ label: 'value', ans: val }, { label: 'x =', ans: x }], ex + ` Solving: ${H(`${a}x`)} = ${c} − ${b} = ${f(c - b)}, so ${mm('x')} = ${f(x)}.`);
    return choiceFixed(`${nm} says ${mm('x')} = ${qh(...cl)} solves ${e}. Substitute to check. Is ${nm} right?`, ['Yes', 'No'], right ? 0 : 1, ex); } },
}});

/* ---------- III.6.05 Multi-step equations ---------- */
E3.skill({ id: 'III.6.05', name: 'Multi-step equations', steps: {
  a: { t: 'distribute first', g: (R) => { const a = R.int(2, 7), x = nz(R, -8, 10), b = nz(R, -9, 9), d = R.bool(0.5) ? nz(R, -12, 12) : 0, c = a * (x + b) + d;
    const lhs = `${a}(${lin([[1, 'x'], [b, '']])})${d ? (d > 0 ? '+' : '-') + Math.abs(d) : ''}`;
    if (R.bool(0.3)) { const ok = eqH(lin([[a, 'x'], [a * b + d, '']]), String(c));
      return choice(R, `Which equation comes from ${eqH(lhs, String(c))} after distributing${d ? ' and combining' : ''}?`, ok,
        [eqH(lin([[a, 'x'], [b + d, '']]), String(c)), eqH(lin([[1, 'x'], [a * b + d, '']]), String(c)), eqH(lin([[a, 'x'], [a + b + d, '']]), String(c))],
        `${a} multiplies both terms: ${a}(${L([[1, 'x'], [b, '']])}) = ${L([[a, 'x'], [a * b, '']])}, not ${L([[a, 'x'], [b, '']])}.`); }
    return num(`Solve ${eqH(lhs, String(c))}.`, x, `Distribute: ${L([[a, 'x'], [a * b, ''], [d, '']])} = ${f(c)}. So ${H(`${a}x`)} = ${f(a * x)} and ${mm('x')} = ${f(x)}.`); } },
  b: { t: 'combine like terms', g: (R) => { let p, r; do { p = R.int(2, 9); r = nz(R, -6, 7); } while (p + r === 0 || p + r === 1 && R.bool(0.7));
    const x = nz(R, -9, 12), q = nz(R, -15, 15), s = R.bool(0.4) ? nz(R, -9, 9) : 0, c = (p + r) * x + q + s;
    const ts = s ? [[p, 'x'], [q, ''], [r, 'x'], [s, '']] : [[p, 'x'], [q, ''], [r, 'x']];
    return num(`Solve ${L(ts)} = ${f(c)}.`, x, `Combine like terms: ${L([[p + r, 'x'], [q + s, '']])} = ${f(c)}. ${p + r === 1 ? 'So' : `Then ${coef(p + r)} = ${f((p + r) * x)}, so`} ${mm('x')} = ${f(x)}.`); } },
  c: { t: 'with fractions', g: (R) => { const t = R.int(0, 2);
    if (t < 2) { const [a, b] = R.sample([2, 3, 4, 5, 6], 2).sort((u, w) => u - w), Lm = E3.lcm(a, b), k = nz(R, -4, 6) * (t === 1 ? 1 : 1), x = Lm * k;
      const plus = t === 0, c = plus ? x / a + x / b : x / a - x / b;
      return num(`Solve ${fh(mm('x'), a)} ${plus ? '+' : '−'} ${fh(mm('x'), b)} = ${f(c)}.`, x, `Multiply every term by ${Lm}: ${L([[Lm / a, 'x']])} ${plus ? '+' : '−'} ${L([[Lm / b, 'x']])} = ${f(c * Lm)}${(plus ? Lm / a + Lm / b : Lm / a - Lm / b) === 1 ? '' : `, so ${coef(plus ? Lm / a + Lm / b : Lm / a - Lm / b)} = ${f(c * Lm)}`} and ${mm('x')} = ${f(x)}.`); }
    const p = R.int(2, 5), a = R.pick([2, 3, 4, 5]), cc = nz(R, -6, 9), b = nz(R, -9, 9), num1 = a * cc - b;
    return num(`Solve ${fh(L([[p, 'x'], [b, '']]), a)} = ${f(cc)}.`, [qf(num1, p, 'x =')], `Multiply both sides by ${a}: ${L([[p, 'x'], [b, '']])} = ${f(a * cc)}. Then ${H(`${p}x`)} = ${f(num1)}, so ${mm('x')} = ${qh(num1, p)}.`); } },
  d: { t: 'check', g: (R) => { const a = R.int(2, 6), b = R.int(1, 7), c = R.int(1, 4), x = R.int(1, 9), d = a * (x - b) + c * x;
    const e = eqH(`${a}(x-${b})+${c === 1 ? '' : c}x`, String(d)), bad = red(d + b, a + c), wrong = !(bad[0] === x && bad[1] === 1) && R.bool(0.55);
    const cl = wrong ? bad : [x, 1], val = a * cl[0] / cl[1] - a * b + c * cl[0] / cl[1], nm = R.pick(['Lee', 'Zoe', 'Omar', 'Ivy', 'Ben']);
    const ex = `${a}(${qh(...cl)} − ${b}) + ${c === 1 ? (cl[1] === 1 ? qh(...cl) : `(${qh(...cl)})`) : `${c}(${qh(...cl)})`} = ${f(val)}${!wrong ? `, which matches ${f(d)}.` : `, not ${f(d)}. ${nm} probably wrote ${a}(${mm('x')} − ${b}) as ${L([[a, 'x'], [-b, '']])}, not ${L([[a, 'x'], [-a * b, '']])}.`}`;
    if (R.bool(0.4)) return num(`${nm} says ${mm('x')} = ${qh(...cl)} solves ${e}. Work out the left side at ${mm('x')} = ${qh(...cl)}. Then solve the equation yourself.`, [{ label: 'left side', ans: val }, { label: 'x =', ans: x }], ex + ` Solving: ${L([[a + c, 'x'], [-a * b, '']])} = ${f(d)}, so ${coef(a + c)} = ${f(d + a * b)} and ${mm('x')} = ${f(x)}.`);
    return choiceFixed(`${nm} says ${mm('x')} = ${qh(...cl)} solves ${e}. Is ${nm} right?`, ['Yes', 'No'], wrong ? 1 : 0, ex); } },
}});

/* ---------- III.6.06 Variables on both sides ---------- */
const NOSOL = 'No solution', ALL = 'Every number is a solution';
E3.skill({ id: 'III.6.06', name: 'Variables on both sides', steps: {
  a: { t: 'collect the terms', g: (R) => { let a, c; do { a = nz(R, -4, 9); c = nz(R, -4, 9); } while (a === c || (a < 0 && c < 0));
    const x = nz(R, -8, 10), b = nz(R, -15, 15), d = (a - c) * x + b, v = R.pick(['x', 'y', 'n']);
    const lo = Math.min(a, c), ex = lo < 0 ? `Add ${coef(-lo, v)} to both sides: ` : `Subtract ${coef(lo, v)} from both sides: `;
    const line = a > c ? `${L([[a - c, v], [b, '']])} = ${f(d)}` : `${f(b)} = ${L([[c - a, v], [d, '']])}`;
    return num(`Solve ${eqH(lin([[a, v], [b, '']]), lin([[c, v], [d, '']]))}.`, x, `${ex}${line}. Then ${mm(v)} = ${f(x)}.`); } },
  b: { t: 'with distribution', g: (R) => { let a, c; do { a = R.int(2, 7); c = nz(R, -3, 8); } while (a === c);
    const x = nz(R, -7, 9), b = nz(R, -8, 8), t = R.bool(), e2 = nz(R, -6, 6);
    if (t) { const d = a * (x + b) - c * x;
      return num(`Solve ${eqH(`${a}(${lin([[1, 'x'], [b, '']])})`, lin([[c, 'x'], [d, '']]))}.`, x, `Distribute: ${L([[a, 'x'], [a * b, '']])} = ${L([[c, 'x'], [d, '']])}. Collect: ${coef(a - c)} = ${f(d - a * b)}, so ${mm('x')} = ${f(x)}.`); }
    const k = a * (x + b) - c * (x + e2);
    const cc = c === 1 ? '' : c === -1 ? '-' : String(c);
    return num(`Solve ${eqH(`${a}(${lin([[1, 'x'], [b, '']])})`, `${cc}(${lin([[1, 'x'], [e2, '']])})${k ? (k > 0 ? '+' : '-') + Math.abs(k) : ''}`)}.`, x,
      `Distribute: ${L([[a, 'x'], [a * b, '']])} = ${L([[c, 'x'], [c * e2 + k, '']])}. Collect: ${coef(a - c)} = ${f(c * e2 + k - a * b)}, so ${mm('x')} = ${f(x)}.`); } },
  c: { t: 'no solution', g: (R) => { const a = R.int(2, 7), b = nz(R, -6, 8); let d; do { d = nz(R, -20, 20); } while (d === a * b);
    const lhs = `${a}(${lin([[1, 'x'], [b, '']])})`, e = eqH(lhs, lin([[a, 'x'], [d, '']]));
    const ex = `Distribute: ${L([[a, 'x'], [a * b, '']])} = ${L([[a, 'x'], [d, '']])}. Subtract ${a}${mm('x')}: ${f(a * b)} = ${f(d)}, which is false, so no ${mm('x')} works.`;
    if (R.bool(0.5)) return choice(R, `Solve ${e}.`, NOSOL, [ALL, `${mm('x')} = 0`, `${mm('x')} = ${f(d - a * b)}`], ex);
    // which equation has no solution
    const p = R.int(2, 6), q = nz(R, -9, 9), r = nz(R, -9, 9), s = q + nz(R, -5, 5);
    const one = eqH(lin([[p + 1, 'x'], [q, '']]), lin([[p, 'x'], [r, '']])), all = eqH(`${p}(x+${Math.abs(q)})`, lin([[p, 'x'], [p * Math.abs(q), '']]));
    const one2 = eqH(lin([[p, 'x'], [q, '']]), lin([[-p, 'x'], [s, '']]));
    return choice(R, 'Which equation has no solution?', e, [one, all, one2], `${ex} The others have one solution or, when both sides match, every number.`); } },
  d: { t: 'infinitely many', g: (R) => { const a = R.int(2, 7), b = nz(R, -8, 8), t = R.int(0, 2), lhs = `${a}(${lin([[1, 'x'], [b, '']])})`;
    const e = eqH(lhs, lin([[a, 'x'], [a * b, '']])), ex = `Distribute: ${L([[a, 'x'], [a * b, '']])} = ${L([[a, 'x'], [a * b, '']])}. Both sides are the same, so subtracting gives 0 = 0: true for every ${mm('x')}, not just ${mm('x')} = 0.`;
    if (t === 0) return choice(R, `Solve ${e}.`, ALL, [`${mm('x')} = 0`, NOSOL, `${mm('x')} = ${f(a * b)}`], ex);
    if (t === 1) { let d; do { d = nz(R, -20, 20); } while (d === a * b);
      const c2 = a + R.pick([-1, 1]);
      return choice(R, 'Which equation has infinitely many solutions?', e, [eqH(lhs, lin([[a, 'x'], [d, '']])), eqH(lhs, lin([[c2, 'x'], [a * b, '']])), eqH(lhs, lin([[a, 'x'], [b, '']]))], ex); }
    return num(`What number goes in the box so ${H(lhs)} = ${H(`${a}x`)} + □ is true for every ${mm('x')}?`, a * b, `${H(lhs)} = ${L([[a, 'x'], [a * b, '']])}, so the box is ${f(a * b)}. Then both sides are identical.`); } },
}});

/* ---------- III.6.07 Equations from word problems ---------- */
const WP = (R, O) => { const k = R.int(0, 7), nm = R.pick([['Jo', 'Sam'], ['Mia', 'Leo'], ['Ana', 'Raj'], ['Kim', 'Tom']]), u = O.units === 'imperial' ? 'inches' : 'cm';
  if (k === 0) { const P = R.int(4, 15), F = R.int(2, 9), t = R.int(2, 12), T = P * t + F;
    return {v: 't', story: `Tickets cost ${money(O, P)} each, plus ${/^8|^1[18]$/.test(String(F)) ? 'an' : 'a'} ${money(O, F)} booking fee. The total is ${money(O, T)}.`, def: 'the number of tickets bought', bad: ['the tickets', 'the total cost', 'the price of one ticket'],
      eq: eqH(`${P}t+${F}`, String(T)), eqBad: [eqH(`${P}(t+${F})`, String(T)), eqH(`${P}t`, `${T}+${F}`), eqH(`${P + F}t`, String(T))], sol: t, work: `${H(`${P}t`)} = ${T - F}, so ${mm('t')} = ${t}.`, q: 'How many tickets were bought?'}; }
  if (k === 1) { const F = R.int(8, 30), P = R.int(2, 6), g = R.int(2, 15), T = F + P * g;
    return {v: 'g', story: `A phone plan costs ${money(O, F)} a month, plus ${money(O, P)} per GB of data. One month's bill is ${money(O, T)}.`, def: 'the number of GB used', bad: ['the data', 'the monthly bill', 'the price per GB'],
      eq: eqH(`${F}+${P}g`, String(T)), eqBad: [eqH(`${P}+${F}g`, String(T)), eqH(`${F + P}g`, String(T)), eqH(`${P}g`, `${T}+${F}`)], sol: g, work: `${H(`${P}g`)} = ${T - F}, so ${mm('g')} = ${g}.`, q: 'How many GB were used?'}; }
  if (k === 2) { const s = R.int(4, 20), d = R.int(2, 9), S = 2 * s + d;
    return {v: 's', story: `${nm[0]} is ${d} years older than ${nm[1]}. Their ages add up to ${S}.`, def: `${nm[1]}'s age in years`, bad: [nm[1], 'the sum of their ages', `the ${d} years`],
      eq: eqH(`s+(s+${d})`, String(S)), eqBad: [eqH(`s+${d}`, String(S)), eqH(`s+${d}s`, String(S)), eqH(`2s`, `${S}+${d}`)], sol: s, work: `${H(`2s+${d}`)} = ${S}, so ${H('2s')} = ${S - d} and ${mm('s')} = ${s}.`, q: `How old is ${nm[0]}?`, ans: s + d,
      interp: `${mm('s')} = ${s} is ${nm[1]}'s age. ${nm[0]} is ${d} years older: ${s} + ${d} = ${s + d}.`}; }
  if (k === 3) { const w = R.int(3, 15), d = R.int(2, 8), P = 4 * w + 2 * d;
    return {v: 'w', story: `A rectangle is ${d} ${u} longer than it is wide. Its perimeter is ${P} ${u}.`, def: `the width in ${u}`, bad: ['the rectangle', `the perimeter in ${u}`, `the extra ${d} ${u}`],
      eq: eqH(`2w+2(w+${d})`, String(P)), eqBad: [eqH(`w+(w+${d})`, String(P)), eqH(`w(w+${d})`, String(P)), eqH(`2w+${d}`, String(P))], sol: w, work: `${H(`4w+${2 * d}`)} = ${P}, so ${H('4w')} = ${P - 2 * d} and ${mm('w')} = ${w}.`, q: `How long is the rectangle?`, ans: w + d,
      interp: `${mm('w')} = ${w} is the width. The length is ${d} more: ${w + d} ${u}.`}; }
  if (k === 4) { const n = R.int(3, 40), S = 3 * n + 3;
    return {v: 'n', story: `Three whole numbers in a row add up to ${S}.`, def: 'the smallest of the three numbers', bad: ['all three numbers', 'the sum of the numbers', 'the number 3'],
      eq: eqH('n+(n+1)+(n+2)', String(S)), eqBad: [eqH('n+n+n', String(S)), eqH('n+1+2', String(S)), eqH('3n+1', String(S))], sol: n, work: `${H('3n+3')} = ${S}, so ${H('3n')} = ${S - 3} and ${mm('n')} = ${n}.`, q: 'What is the largest of the three numbers?', ans: n + 2,
      interp: `${mm('n')} = ${n} is the smallest. The numbers are ${n}, ${n + 1}, ${n + 2}, so the largest is ${n + 2}.`}; }
  if (k === 5) { const M = R.int(5, 40), D = R.int(3, 12), w = R.int(2, 15), T = M + D * w;
    return {v: 'w', story: `${nm[0]} has ${money(O, M)} and saves ${money(O, D)} a week. After some weeks ${nm[0]} has ${money(O, T)}.`, def: 'the number of weeks', bad: ['the savings', `the ${money(O, D)} saved`, 'the total amount'],
      eq: eqH(`${M}+${D}w`, String(T)), eqBad: [eqH(`${D}+${M}w`, String(T)), eqH(`${M + D}w`, String(T)), eqH(`${D}w-${M}`, String(T))], sol: w, work: `${H(`${D}w`)} = ${T - M}, so ${mm('w')} = ${w}.`, q: 'How many weeks did it take?'}; }
  if (k === 6) { const a = R.int(3, 20), r = R.int(2, 4), S = a * (r + 1);
    return {v: 'a', story: `${nm[0]} and ${nm[1]} share ${money(O, S)}. ${nm[1]} gets ${r} times as much as ${nm[0]}.`, def: `${nm[0]}'s share`, bad: [nm[0], 'the total shared', `the number ${r}`],
      eq: eqH(`a+${r}a`, String(S)), eqBad: [eqH(`a+${r}`, String(S)), eqH(`${r}a`, String(S)), eqH(`a+${r}a`, String(S * r))], sol: a, work: `${H(`${r + 1}a`)} = ${S}, so ${mm('a')} = ${a}.`, q: `How much does ${nm[1]} get?`, ans: r * a,
      interp: `${mm('a')} = ${a} is ${nm[0]}'s share. ${nm[1]} gets ${r} times as much: ${money(O, r * a)}.`}; }
  const n = R.int(3, 8), p = R.int(2, 9), F = R.int(2, 9), T = n * p + F, k2 = R.int(2, 5);
  return {v: 'p', story: `${n} pens and a ${money(O, F)} notebook cost ${money(O, T)}.`, def: 'the price of one pen', bad: ['the pens', 'the number of pens', 'the total cost'],
    eq: eqH(`${n}p+${F}`, String(T)), eqBad: [eqH(`${n}(p+${F})`, String(T)), eqH(`p+${F}`, String(T)), eqH(`${n}p`, `${T}+${F}`)], sol: p, work: `${H(`${n}p`)} = ${T - F}, so ${mm('p')} = ${p}.`, q: `How much do ${k2} pens cost?`, ans: k2 * p,
    interp: `${mm('p')} = ${p} is the price of one pen, so ${k2} pens cost ${k2} × ${p} = ${money(O, k2 * p)}.`};
};
E3.skill({ id: 'III.6.07', name: 'Equations from word problems', steps: {
  a: { t: 'define the variable', g: (R, O) => { const w = WP(R, O);
    return choice(R, `${w.story} ${w.q} Which is the best meaning for ${mm(w.v)}?`, w.def, w.bad, `A letter stands for a number: ${mm(w.v)} = ${w.def}. Then the story turns into ${w.eq}.`); } },
  b: { t: 'write the equation', g: (R, O) => { const w = WP(R, O);
    return choice(R, `${w.story} Let ${mm(w.v)} be ${w.def}. Which equation fits?`, w.eq, w.eqBad, `Say the story in symbols: ${w.eq}.`); } },
  c: { t: 'solve', g: (R, O) => { const w = WP(R, O);
    return num(`${w.story} Let ${mm(w.v)} be ${w.def}. Write an equation and find ${mm(w.v)}.`, w.sol, `${w.eq}. ${w.work}`); } },
  d: { t: 'interpret', g: (R, O) => { let w; do { w = WP(R, O); } while (w.ans === undefined);
    return num(`${w.story} Let ${mm(w.v)} be ${w.def}. Solving ${w.eq} gives ${mm(w.v)} = ${w.sol}. ${w.q}`, w.ans, `${w.interp} Answer the question asked, not just ${mm(w.v)}.`); } },
}});

/* ---------- III.6.08 Inequalities ---------- */
const PH = {
  '>=': [(k, u) => `at least ${k}${u}`, (k, u) => `${k}${u} or more`, (k, u) => `no less than ${k}${u}`],
  '<=': [(k, u) => `at most ${k}${u}`, (k, u) => `${k}${u} or less`, (k, u) => `no more than ${k}${u}`],
  '>': [(k, u) => `more than ${k}${u}`, (k, u) => `over ${k}${u}`, (k, u) => `greater than ${k}${u}`],
  '<': [(k, u) => `less than ${k}${u}`, (k, u) => `under ${k}${u}`, (k, u) => `below ${k}${u}`],
};
E3.skill({ id: 'III.6.08', name: 'Inequalities', steps: {
  a: { t: 'what < and ≤ mean', g: (R) => { const o = R.pick(['<', '<=', '>', '>=']), b = R.int(-9, 12), t = R.int(0, 2);
    if (t === 0) { const v = R.bool(0.25) ? b : b + R.pick([-1, 1]) * R.int(1, 3), y = holds(o, v, b);
      return choiceFixed(`Is ${f(v)} a solution of ${IQn('x', o, b)}?`, ['Yes', 'No'], y ? 0 : 1, `${IQn('x', o, b)} means ${mm('x')} is ${WORD[o]} ${f(b)}. ${f(v)} ${y ? 'is' : 'is not'}${v === b ? (o.length === 2 ? ': the line under the sign includes ' + f(b) : ': ' + OPS[o] + ' leaves out ' + f(b) + ' itself') : ''}.`); }
    if (t === 1) { const cand = [b - 2, b - 1, b, b + 1, b + 2], good = cand.filter(v => holds(o, v, b)), badv = cand.filter(v => !holds(o, v, b));
      const ok = R.pick(good), wrong = R.sample(badv, Math.min(3, badv.length));
      return choice(R, `Which number is a solution of ${IQn('x', o, b)}?`, f(ok), wrong.map(f), `${IQn('x', o, b)}: ${mm('x')} must be ${WORD[o]} ${f(b)}. ${f(ok)} is.${o.length === 1 && wrong.includes(b) ? ` ${f(b)} is not: ${OPS[o]} leaves it out.` : ''}`); }
    const o2 = R.pick(['<=', '>=']);
    return choice(R, `Which inequality has ${f(b)} as a solution?`, IQn('x', o2, b), [IQn('x', '<', b), IQn('x', '>', b), IQn('x', o2 === '<=' ? '<=' : '>=', o2 === '<=' ? b - 2 : b + 2)],
      `${OPS[o2]} includes ${f(b)} itself; &lt; and &gt; leave it out.`); } },
  b: { t: 'many solutions', g: (R) => { const o = R.pick(['<', '<=', '>', '>=']), t = R.int(0, 2);
    if (t === 0) { const k = R.int(1, 9), cnt = Array.from({length: 11}, (_, i) => i).filter(i => holds(o, i, k)).length;
      return num(`How many whole numbers from 0 to 10 are solutions of ${IQn('x', o, k)}?`, cnt, `${o[0] === '<' ? `0 up to ${o === '<' ? k - 1 : k}` : `${o === '>' ? k + 1 : k} up to 10`}: that's ${cnt} numbers.${o.length === 1 ? ` ${k} itself is not included.` : ''}`); }
    if (t === 1) { const half = R.bool(0.35), k = R.int(-9, 12) + (half ? 0.5 : 0), lower = o[0] === '<';
      const ans = lower ? (half ? Math.floor(k) : o === '<' ? k - 1 : k) : (half ? Math.ceil(k) : o === '>' ? k + 1 : k);
      return num(`What is the ${lower ? 'largest' : 'smallest'} integer solution of ${IQ('x', o, f(k))}?`, ans,
        `${mm('x')} must be ${WORD[o]} ${f(k)}. The ${lower ? 'largest' : 'smallest'} integer that works is ${f(ans)}.`); }
    const k = R.int(-8, 15);
    return choice(R, `How many numbers are solutions of ${IQn('x', o, k)}?`, 'Infinitely many', ['Just 1', o[0] === '<' && k > 1 ? String(k - 1) : String(Math.abs(k) + 1), 'None'],
      `Every number ${WORD[o]} ${f(k)} works, including decimals like ${f(o[0] === '<' ? k - 0.5 : k + 0.5)}: there is no end to them.`); } },
  c: { t: 'graph on a number line', g: (R) => { const o = R.pick(['<', '<=', '>', '>=']), b = R.int(-6, 6), lo = b - 5, hi = b + 5, v = 'x';
    const ex = `${o.length === 2 ? 'A filled dot' : 'An open circle'} at ${f(b)} (${o.length === 2 ? 'included' : 'left out'}) and an arrow to the ${o[0] === '>' ? 'right' : 'left'}: ${IQn(v, o, b)}.`;
    if (R.bool(0.5)) return choice(R, 'Which inequality does the graph show?', IQn(v, o, b), [IQn(v, swapIn(o), b), IQn(v, flip(o), b), IQn(v, flip(swapIn(o)), b)], ex, {visual: V6.ray(b, o, {from: lo, to: hi})});
    const opts = R.shuffle([o, swapIn(o), flip(o), flip(swapIn(o))]);
    return choiceFixed(`Which graph shows ${IQn(v, o, b)}?`, ['A', 'B', 'C', 'D'], opts.indexOf(o), ex, {visual: V6.four(opts.map(z => [b, z]), lo, hi)}); } },
  d: { t: 'write from words', g: (R) => { const o = R.pick(['<', '<=', '>', '>=']), ph = R.pick(PH[o]);
    const CT = [['g', 'The number of guests, g, is', '', R.int(12, 60)], ['h', 'A rider’s height, h, must be', ' cm', R.int(100, 140)], ['s', 'Your score, s, must be', ' points', R.int(20, 90)],
      ['t', 'The temperature, t, is', ' °C', R.int(-10, 15)], ['a', 'To join, your age, a, must be', ' years', R.int(8, 18)], ['n', 'The number of tickets sold, n, is', '', R.int(50, 300)]];
    const [v, s, u, k] = R.pick(CT), txt = s.replace(/, (\w), /, (_, l) => `, ${mm(l)}, `);
    return choice(R, `${txt} ${ph(k, u)}. Which inequality says this?`, IQn(v, o, k), [swapIn(o), flip(o), flip(swapIn(o))].map(z => IQn(v, z, k)),
      `“${ph(k, u)}” means ${WORD[o]} ${k}${o.length === 2 ? ` (${k} counts)` : ` (${k} itself doesn't count)`}: ${IQn(v, o, k)}.`); } },
}});

/* ---------- III.6.09 One-step inequalities ---------- */
const OS = ['<', '<=', '>', '>='];
// solve a·x o c (a ≠ 0) → [op, n, d]
const solve1 = (a, o, c) => { const [n, d] = red(c, a); return [a < 0 ? flip(o) : o, n, d]; };
const ineqEx = (a, o, c, pre = '') => { const [o2, n, d] = solve1(a, o, c);
  return `${pre}Divide both sides by ${f(a)}${a < 0 ? ', a negative, so flip the sign' : a > 0 ? ' (positive: the sign stays)' : ''}: ${IQn('x', o2, n, d)}.`; };
E3.skill({ id: 'III.6.09', name: 'One-step inequalities', steps: {
  a: { t: 'add and subtract', g: (R) => { const o = R.pick(OS), a = R.int(2, 15), k = R.int(-10, 15), t = R.int(0, 2), plus = t !== 1, b = plus ? k + a : k - a;
    const lhs = t === 0 ? H(`x+${a}`) : t === 1 ? H(`x-${a}`) : H(`${a}+x`);
    return choice(R, `Solve ${lhs} ${OPS[o]} ${f(b)}.`, IQn('x', o, k), [IQn('x', o, plus ? b + a : b - a), IQn('x', flip(o), k), IQn('x', swapIn(o), k)],
      `${plus ? `Subtract ${a} from` : `Add ${a} to`} both sides: ${IQn('x', o, k)}. Adding or subtracting never flips the sign.`); } },
  b: { t: 'multiply or divide by a positive', g: (R) => { const o = R.pick(OS), a = R.int(2, 9), k = R.bool(0.45) ? -R.int(1, 10) : R.int(1, 12);
    if (R.bool(0.65)) { const b = a * k;
      return choice(R, `Solve ${H(`${a}x`)} ${OPS[o]} ${f(b)}.`, IQn('x', o, k), [IQn('x', flip(o), k), IQn('x', o, b - a), IQn('x', swapIn(o), k)],
        `Divide both sides by ${a}: ${IQn('x', o, k)}. ${a} is positive, so the sign stays${k < 0 ? ', even though the answer is negative' : ''}.`); }
    return choice(R, `Solve ${ov('x', a)} ${OPS[o]} ${f(k)}.`, IQn('x', o, a * k), [IQn('x', flip(o), a * k), IQn('x', o, k, a), IQn('x', swapIn(o), a * k)],
      `Multiply both sides by ${a}: ${IQn('x', o, a * k)}. ${a} is positive, so the sign stays.`); } },
  c: { t: 'a negative flips the sign', g: (R) => { const o = R.pick(OS), a = -R.int(1, 9), k = nz(R, -10, 10), t = R.int(0, 2);
    if (t < 2 || a === -1) { const b = a * k;
      return choice(R, `Solve ${coef(a)} ${OPS[o]} ${f(b)}.`, IQn('x', flip(o), k), [IQn('x', o, k), IQn('x', flip(o), -k), IQn('x', o, -k)],
        a === -1 ? `Multiply both sides by −1 and flip the sign: ${IQn('x', flip(o), k)}.` : ineqEx(a, o, b)); }
    return choice(R, `Solve ${ov('x', a)} ${OPS[o]} ${f(k)}.`, IQn('x', flip(o), a * k), [IQn('x', o, a * k), IQn('x', flip(o), -a * k), IQn('x', o, -a * k)],
      `Multiply both sides by ${f(a)}, a negative, so flip the sign: ${IQn('x', flip(o), a * k)}.`); } },
  d: { t: 'graph', g: (R) => { const o = R.pick(OS), a = R.pick([-6, -5, -4, -3, -2, -1, 2, 3, 4, 5, 6]), k = R.int(-5, 5), b = a * k, [o2] = solve1(a, o, b), lhs = a === 1 ? mm('x') : coef(a);
    const opts = R.shuffle([o2, flip(o2), swapIn(o2), flip(swapIn(o2))]);
    const ex = a === 1 ? `Nothing to undo: ${IQn('x', o2, k)}: ${o2.length === 2 ? 'filled dot' : 'open circle'} at ${f(k)}, arrow ${o2[0] === '>' ? 'right' : 'left'}.`
      : ineqEx(a, o, b) + ` ${o2.length === 2 ? 'Filled dot' : 'Open circle'} at ${f(k)}, arrow ${o2[0] === '>' ? 'right' : 'left'}.`;
    return choiceFixed(`Solve ${lhs} ${OPS[o]} ${f(b)}. Which graph shows the solution?`, ['A', 'B', 'C', 'D'], opts.indexOf(o2), ex, {visual: V6.four(opts.map(z => [k, z]), k - 5, k + 5)}); } },
}});

/* ---------- III.6.10 Two-step inequalities ---------- */
// n/d exactly, or as a fraction ≈ 1 decimal place
const qd = (n, d) => n % d === 0 ? f(n / d) : Number.isInteger(n * 100 / d) ? f(n / d) : `${fh(n, d)} ≈ ${f(Math.round(n / d * 10) / 10)}`;
// a x + b o c, integer answer k
const two = (R, negA) => { const o = R.pick(OS); let a; do { a = negA ? -R.int(2, 7) : R.int(2, 9); } while (!a);
  const k = nz(R, -8, 10), b = nz(R, -15, 15), c = a * k + b, front = negA && R.bool(0.5);
  const lhs = front ? L([[b, ''], [a, 'x']]) : L([[a, 'x'], [b, '']]), o2 = a < 0 ? flip(o) : o;
  const ex = `${b > 0 ? `Subtract ${b} from` : `Add ${-b} to`} both sides: ${coef(a)} ${OPS[o]} ${f(c - b)}. ` + ineqEx(a, o, c - b).replace(/^Divide/, 'Then divide');
  return {o, a, k, b, c, lhs, o2, ex, s: `${lhs} ${OPS[o]} ${f(c)}`};
};
E3.skill({ id: 'III.6.10', name: 'Two-step inequalities', steps: {
  a: { t: 'solve', g: (R) => { const q = two(R, false), [dn, dd] = red(q.c - q.a * q.b, q.a);
    return choice(R, `Solve ${q.s}.`, IQn('x', q.o2, q.k), [IQn('x', flip(q.o2), q.k), IQn('x', q.o2, q.c + q.b, q.a), IQn('x', q.o2, dn, dd), IQn('x', swapIn(q.o2), q.k)].slice(0, 3), q.ex); } },
  b: { t: 'flip when needed', g: (R) => { const q = two(R, R.bool(0.7));
    return choice(R, `Solve ${q.s}.`, IQn('x', q.o2, q.k), [IQn('x', flip(q.o2), q.k), IQn('x', q.o2, -q.k), IQn('x', flip(q.o2), -q.k)], q.ex); } },
  c: { t: 'graph', g: (R) => { const q = two(R, R.bool(0.5)), k = q.k, opts = R.shuffle([q.o2, flip(q.o2), swapIn(q.o2), flip(swapIn(q.o2))]);
    return choiceFixed(`Solve ${q.s}. Which graph shows the solution?`, ['A', 'B', 'C', 'D'], opts.indexOf(q.o2), q.ex + ` ${q.o2.length === 2 ? 'Filled dot' : 'Open circle'} at ${f(k)}, arrow ${q.o2[0] === '>' ? 'right' : 'left'}.`, {visual: V6.four(opts.map(z => [k, z]), k - 5, k + 5)}); } },
  d: { t: 'word problems', g: (R, O) => { const t = R.int(0, 4), kg = O.units === 'imperial' ? 'lb' : 'kg';
    if (t === 0) { const P = R.int(4, 15), F = R.int(2, 9); let M, n; do { M = R.int(30, 120); n = Math.floor((M - F) / P); } while (n < 2 || (M - F) % P === 0 && R.bool(0.7));
      return num(`You have ${money(O, M)}. Tickets cost ${money(O, P)} each, plus ${/^8|^1[18]$/.test(String(F)) ? 'an' : 'a'} ${money(O, F)} fee. At most how many tickets can you buy?`, n,
        `${H(`${P}n+${F}`)} ≤ ${M}, so ${H(`${P}n`)} ≤ ${M - F} and ${mm('n')} ≤ ${qd(M - F, P)}. Only whole tickets: at most ${n}.`); }
    if (t === 1) { const P = R.int(8, 20), B = R.int(5, 40); let T, h; do { T = R.int(80, 300); h = Math.ceil((T - B) / P); } while (h < 2 || (T - B) % P === 0 && R.bool(0.7));
      return num(`You earn ${money(O, P)} an hour plus ${/^8|^1[18]$/.test(String(B)) ? 'an' : 'a'} ${money(O, B)} bonus. You need at least ${money(O, T)}. What is the least whole number of hours?`, h,
        `${H(`${P}h+${B}`)} ≥ ${T}, so ${H(`${P}h`)} ≥ ${T - B} and ${mm('h')} ≥ ${qd(T - B, P)}. Round up: ${h} hours.`); }
    if (t === 2) { const c = R.int(50, 120), b = R.int(15, 40); let W, n; do { W = R.int(300, 800); n = Math.floor((W - c) / b); } while (n < 2 || (W - c) % b === 0 && R.bool(0.7));
      return num(`A lift carries at most ${W} ${kg}. A ${c} ${kg} cart is inside. Boxes weigh ${b} ${kg} each. At most how many boxes fit the limit?`, n,
        `${H(`${b}n+${c}`)} ≤ ${W}, so ${H(`${b}n`)} ≤ ${W - c} and ${mm('n')} ≤ ${qd(W - c, b)}. At most ${n} boxes.`); }
    if (t === 3) { const M = R.int(5, 50), D = R.int(4, 15), T = M + R.int(20, 150), w = Math.floor((T - M) / D) + 1;
      return num(`Ana has ${money(O, M)} and saves ${money(O, D)} a week. She wants more than ${money(O, T)}. What is the fewest whole weeks?`, w,
        `${H(`${M}+${D}w`)} &gt; ${T}, so ${H(`${D}w`)} &gt; ${T - M} and ${mm('w')} &gt; ${qd(T - M, D)}. The first whole number that works is ${w}.`); }
    const F = R.int(10, 25), P = R.int(2, 6); let M, g; do { M = R.int(30, 90); g = Math.floor((M - F) / P); } while (g < 2 || (M - F) % P === 0 && R.bool(0.7));
    return num(`A phone plan costs ${money(O, F)} a month plus ${money(O, P)} per GB. Your budget is at most ${money(O, M)}. What is the most whole GB you can use?`, g,
      `${H(`${F}+${P}g`)} ≤ ${M}, so ${H(`${P}g`)} ≤ ${M - F} and ${mm('g')} ≤ ${qd(M - F, P)}. At most ${g} GB.`); } },
}});

/* ---------- III.6.11 Rearrange formulas ---------- */
const X = (label, expr) => ({label, expr, form: 'any'});
const dv = (a, b) => fh(mm(a), mm(b));
E3.skill({ id: 'III.6.11', name: 'Rearrange formulas', steps: {
  a: { t: 'd = rt for t', g: (R, O) => { const t = R.int(0, 3), km = O.units === 'imperial' ? 'miles' : 'km', sp2 = O.units === 'imperial' ? 'mph' : 'km/h';
    if (t === 0) return num(`Rearrange ${mm('d = rt')} to make ${mm('t')} the subject.`, [X('t =', 'd/r')], `Divide both sides by ${mm('r')}: ${mm('t')} = ${dv('d', 'r')}.`);
    if (t === 1) return num(`Rearrange ${mm('d = rt')} to make ${mm('r')} the subject.`, [X('r =', 'd/t')], `Divide both sides by ${mm('t')}: ${mm('r')} = ${dv('d', 't')}.`);
    if (t === 2) { const r = R.pick([20, 30, 40, 50, 60, 80]), tt = R.pick([0.5, 1.5, 2, 2.5, 3, 4, 5]), d = r * tt;
      return num(`A car travels ${fmt(d)} ${km} at ${r} ${sp2}. Use ${mm('t')} = ${dv('d', 'r')} to find the time in hours.`, tt, `${mm('t')} = ${fmt(d)} ÷ ${r} = ${fmt(tt)} hours.`); }
    return choice(R, `Which is ${mm('d = rt')} solved for ${mm('t')}?`, `${mm('t')} = ${dv('d', 'r')}`, [`${mm('t')} = ${mm('rd')}`, `${mm('t')} = ${dv('r', 'd')}`, `${mm('t')} = ${H('d-r')}`],
      `${mm('t')} is multiplied by ${mm('r')}, so divide both sides by ${mm('r')}: ${mm('t')} = ${dv('d', 'r')}.`); } },
  b: { t: 'A = lw', g: (R, O) => { const t = R.int(0, 3), u = O.units === 'imperial' ? 'in' : 'cm';
    if (t === 0) return num(`Rearrange ${mm('A = lw')} to make ${mm('w')} the subject.`, [X('w =', 'A/l')], `Divide both sides by ${mm('l')}: ${mm('w')} = ${dv('A', 'l')}.`);
    if (t === 1) return num(`Rearrange ${mm('A = lw')} to make ${mm('l')} the subject.`, [X('l =', 'A/w')], `Divide both sides by ${mm('w')}: ${mm('l')} = ${dv('A', 'w')}.`);
    if (t === 2) { const l = R.int(4, 20), w = R.pick([R.int(2, 15), R.int(2, 15) + 0.5]), A = l * w;
      return num(`A rectangle has area ${fmt(A)} ${u}² and length ${l} ${u}. Use ${mm('w')} = ${dv('A', 'l')} to find the width.`, w, `${mm('w')} = ${fmt(A)} ÷ ${l} = ${fmt(w)} ${u}.`); }
    const s = R.pick(['w', 'l']), o = s === 'w' ? 'l' : 'w';
    return choice(R, `Which is ${mm('A = lw')} solved for ${mm(s)}?`, `${mm(s)} = ${dv('A', o)}`, [`${mm(s)} = ${dv(o, 'A')}`, `${mm(s)} = ${H(`A-${o}`)}`, `${mm(s)} = ${mm('A' + o)}`],
      `Divide both sides by ${mm(o)}: ${mm(s)} = ${dv('A', o)}.`); } },
  c: { t: 'P = 2l + 2w', g: (R, O) => { const t = R.int(0, 2), u = O.units === 'imperial' ? 'in' : 'cm', s = R.pick(['l', 'w']), o = s === 'l' ? 'w' : 'l';
    const ok = `${mm(s)} = ${fh(H(`P-2${o}`), 2)}`, ex = `Subtract 2${mm(o)}: 2${mm(s)} = ${H(`P-2${o}`)}. Divide the whole side by 2: ${mm(s)} = ${fh(H(`P-2${o}`), 2)}.`;
    if (t === 0) return num(`Rearrange ${mm('P = 2l + 2w')} to make ${mm(s)} the subject.`, [X(`${s} =`, `(P-2${o})/2`)], ex);
    if (t === 1) { const L1 = R.int(3, 25), W1 = R.int(2, 20), P = 2 * L1 + 2 * W1, known = s === 'l' ? W1 : L1, ans = s === 'l' ? L1 : W1;
      return num(`A rectangle has perimeter ${P} ${u} and ${o === 'w' ? 'width' : 'length'} ${known} ${u}. Find its ${s === 'l' ? 'length' : 'width'}.`, ans, `${mm(s)} = ${fh(H(`P-2${o}`), 2)} = ${fh(`${P} − ${2 * known}`, 2)} = ${ans} ${u}.`); }
    return choice(R, `Which is ${mm('P = 2l + 2w')} solved for ${mm(s)}?`, ok, [`${mm(s)} = ${mm('P')} − ${fh(H(`2${o}`), 2)}`, `${mm(s)} = ${fh(H(`P-${o}`), 2)}`, `${mm(s)} = ${H(`P-2${o}`)}`], ex); } },
  d: { t: 'temperature conversion', g: (R) => { const t = R.int(0, 3), Fm = `${mm('F')} = ${fh(9, 5)}${mm('C')} + 32`, Cm = `${mm('C')} = ${fh(5, 9)}(${H('F-32')})`;
    if (t === 0) return num(`Rearrange ${Fm} to make ${mm('C')} the subject.`, [X('C =', '5(F-32)/9')], `Subtract 32: ${H('F-32')} = ${fh(9, 5)}${mm('C')}. Multiply by ${fh(5, 9)}: ${Cm}.`);
    if (t === 1) { const k = R.int(-4, 20), F = 32 + 9 * k, Cc = 5 * k;
      return num(`Convert ${F} °F to °C. Use ${Cm}.`, Cc, `${F} − 32 = ${9 * k}, and ${fh(5, 9)} × ${pn(9 * k)} = ${f(Cc)} °C.`); }
    if (t === 2) { const k = R.int(-8, 20), Cc = 5 * k, F = 9 * k + 32;
      return num(`Convert ${f(Cc)} °C to °F. Use ${Fm}.`, F, `${fh(9, 5)} × ${pn(Cc)} = ${f(9 * k)}, and ${f(9 * k)} + 32 = ${F} °F.`); }
    return choice(R, `Which is ${Fm} solved for ${mm('C')}?`, Cm, [`${mm('C')} = ${fh(5, 9)}${mm('F')} − 32`, `${mm('C')} = ${fh(9, 5)}(${H('F-32')})`, `${mm('C')} = ${fh(5, 9)}(${H('F+32')})`],
      `Undo in reverse order: subtract 32 first, then multiply by ${fh(5, 9)}: ${Cm}.`); } },
}});

/* ---------- III.6.12 Choosing a strategy ---------- */
E3.skill({ id: 'III.6.12', name: 'Choosing a strategy', steps: {
  a: { t: 'undo operations', g: (R) => { const t = R.int(0, 2), a = R.int(2, 9), b = R.int(1, 15), x = R.int(2, 15);
    if (t === 0) { const sub = R.bool(); const c = sub ? a * x - b : a * x + b;
      return num(`I think of a number, multiply it by ${a}, then ${sub ? 'subtract' : 'add'} ${b}. I get ${c}. What is my number?`, x, `Undo in reverse order: ${c} ${sub ? '+' : '−'} ${b} = ${a * x}, then ${a * x} ÷ ${a} = ${x}.`); }
    if (t === 1) { const c = a * x + b;
      return choice(R, `What is the first step to solve ${eqH(`${a}x+${b}`, String(c))}?`, `Subtract ${b} from both sides`, [`Add ${b} to both sides`, `Divide only ${H(`${a}x`)} by ${a}`, `Subtract ${a} from both sides`],
        `Undo the last thing done to ${mm('x')} first: the + ${b}. Then ${H(`${a}x`)} = ${a * x}, so ${mm('x')} = ${x}.`); }
    const c = R.int(2, 12);
    return choice(R, `What is the first step to solve ${fh(H(`x+${b}`), a)} = ${c}?`, `Multiply both sides by ${a}`, [`Subtract ${b} from both sides`, `Divide both sides by ${a}`, `Multiply only the right side by ${a}`],
      `The division by ${a} was done last, so undo it first: ${H(`x+${b}`)} = ${a * c}, so ${mm('x')} = ${a * c - b}.`); } },
  b: { t: 'keep the balance', g: (R) => { const t = R.int(0, 1);
    if (t === 0) { let p, r; do { p = R.int(3, 9); r = R.int(1, 8); } while (p <= r); const q = nz(R, -9, 9), s = nz(R, -12, 12);
      const e = eqH(lin([[p, 'x'], [q, '']]), lin([[r, 'x'], [s, '']]));
      return choice(R, `Which is a correct next step for ${e}?`, eqH(lin([[p - r, 'x'], [q, '']]), String(s)),
        [eqH(lin([[p + r, 'x'], [q, '']]), String(s)), eqH(lin([[p - r, 'x'], [q, '']]), lin([[r, 'x'], [s, '']])), eqH(lin([[p, 'x']]), lin([[r, 'x'], [s + q, '']]))],
        `Subtract ${coef(r)} from both sides: ${eqH(lin([[p - r, 'x'], [q, '']]), String(s))}. Whatever you do to one side, do to the other.`); }
    const k = R.pick([2, 3]), a = k * R.int(1, 4), b = k * nz(R, -6, 6), c = k * R.int(-5, 12), e = eqH(lin([[a, 'x'], [b, '']]), String(c));
    return choice(R, `Divide both sides of ${e} by ${k}. What do you get?`, eqH(lin([[a / k, 'x'], [b / k, '']]), String(c / k)),
      [eqH(lin([[a / k, 'x'], [b, '']]), String(c / k)), eqH(lin([[a / k, 'x'], [b / k, '']]), String(c)), eqH(lin([[a, 'x'], [b / k, '']]), String(c / k))],
      `Divide every term on both sides by ${k}: ${eqH(lin([[a / k, 'x'], [b / k, '']]), String(c / k))}.`); } },
  c: { t: 'check', g: (R) => { const a = R.int(2, 5), b = R.int(1, 6), x = nz(R, -5, 9); let c; do { c = R.int(1, a + 3); } while (c === a);
    const d = a * (x - b) - c * x, e = eqH(`${a}(x-${b})`, lin([[c, 'x'], [d, '']])), nm = R.pick(['Ana', 'Leo', 'Kim', 'Raj']);
    if (R.bool(0.35)) return choice(R, `${nm} solved ${e} and got ${mm('x')} = ${f(x)}. Where should ${nm} check it?`, 'In the original equation', ['In the last line of the working', 'In any line of the working', 'No check is needed'],
      `A slip early on would still pass a check in a later line. In the original: ${a}(${f(x)} − ${b}) = ${f(a * (x - b))} and ${sb(c, x, d)} = ${f(c * x + d)}.`);
    const cl = R.bool(0.6) ? x : x + R.pick([-2, -1, 1, 2]), A = a * (cl - b), B = c * cl + d;
    return num(`${nm} got ${mm('x')} = ${f(cl)} for ${e}. Check in the original: work out each side.`, [{label: 'left side', ans: A}, {label: 'right side', ans: B}],
      `Left: ${a}(${f(cl)} − ${b}) = ${f(A)}. Right: ${sb(c, cl, d)} = ${f(B)}. ${A === B ? 'They match: correct.' : `They differ: ${mm('x')} = ${f(cl)} is wrong.`}`); } },
  d: { t: 'the most efficient path', g: (R) => { const t = R.int(0, 3);
    if (t === 0) { const a = R.int(2, 9), b = R.int(1, 12), c = R.int(2, 12);
      return choice(R, `What is the most efficient first step for ${fh(H(`x+${b}`), a)} = ${c}?`, `Multiply both sides by ${a}`, [`Subtract ${b} from both sides`, `Divide both sides by ${c}`, `Subtract ${c} from both sides`],
        `Clearing the fraction first gives ${H(`x+${b}`)} = ${a * c} in one step, so ${mm('x')} = ${a * c - b}.`); }
    if (t === 1) { const a = R.int(2, 9), b = nz(R, -9, 9), k = nz(R, -6, 12), c = a * k;
      return choice(R, `What is the most efficient first step for ${eqH(`${a}(${lin([[1, 'x'], [b, '']])})`, String(c))}?`, `Divide both sides by ${a}`, ['Expand the brackets', `Subtract ${Math.abs(b)} from both sides`, `Multiply both sides by ${a}`],
        `${f(c)} divides by ${a} exactly: ${L([[1, 'x'], [b, '']])} = ${f(k)}, so ${mm('x')} = ${f(k - b)}. Expanding works too, but takes longer.`); }
    if (t === 2) { const [a, b] = R.sample([2, 3, 4, 5, 6], 2).sort((u, w) => u - w), Lm = E3.lcm(a, b), c = R.int(1, 9) * (a + b);
      return choice(R, `What is the most efficient first step for ${fh(mm('x'), a)} + ${fh(mm('x'), b)} = ${c}?`, `Multiply every term by ${Lm}`, [`Multiply only ${fh(mm('x'), a)} by ${a}`, `Add the fractions to get ${fh(H('2x'), a + b)}`, `Subtract ${fh(mm('x'), b)} from both sides`],
        `Multiplying every term by ${Lm} clears both fractions: ${L([[Lm / a, 'x']])} + ${L([[Lm / b, 'x']])} = ${c * Lm}.`); }
    let p, r; do { p = R.int(1, 6); r = R.int(2, 9); } while (p >= r); const q = nz(R, -12, 12), s = nz(R, -12, 12);
    return choice(R, `What is the most efficient first step for ${eqH(lin([[p, 'x'], [q, '']]), lin([[r, 'x'], [s, '']]))}?`, `Subtract ${coef(p)} from both sides`, [`Subtract ${coef(r)} from both sides`, `Add ${coef(p)} to both sides`, `Divide both sides by ${r}`],
      `Take the smaller ${mm('x')} term away: ${f(q)} = ${L([[r - p, 'x'], [s, '']])}. The ${mm('x')} term stays positive. Subtracting ${coef(r)} works but gives a negative.`); } },
}});

})();

/* Era III · Unit III.7 Lines & first functions (III.7.01–III.7.12)
   Local helpers live under V7 / small functions inside this file. */
(function(){ const {num, choice, choiceFixed, tf, frac, fh, fmt, m, V, C} = E3;
const f = n => fmt(n);
const gcd = E3.gcd;
const mm = s => m(s).replace(/(^|[^a-zA-Z<\/&;])([a-z]{2,3})(?![a-zA-Z>;])/g, (_, p, w) => p + w.split('').map(c => `<i>${c}</i>`).join('')).replace(/\( − /g, '(−');
const sp = s => String(s).replace(/([^(^*/+\-])([+\-])/g, '$1 $2 ');
const H = s => mm(sp(s));
const nz = (R, lo, hi) => { let v; do v = R.int(lo, hi); while (!v); return v; };
const pn = n => n < 0 ? `(${f(n)})` : f(n);
const red = (n, d) => { if (d < 0) { n = -n; d = -d; } const g = gcd(n, d); return [n / g, d / g]; };
const qh = (n, d = 1) => { [n, d] = red(n, d); if (d === 1) return f(n); return (n < 0 ? '−' : '') + fh(Math.abs(n), d); };
const qf = (n, d = 1, label) => { [n, d] = red(n, d); const o = d === 1 ? {ans: n} : frac(n, d, 'any'); if (label) o.label = label; return o; };
const money = (O, n) => { const t = Number.isInteger(n) ? fmt(n) : n.toFixed(2); return O.coins === 'THB' ? `${t} baht` : `$${t}`; };
const cur = O => O.coins === 'THB' ? 'baht' : 'dollars';
const pt = (x, y) => `(${f(x)}, ${f(y)})`;
// slope m = p/q (q > 0), intercept b (integer) → ASCII for the checker and HTML for display
const mxbA = (p, q, b, v = 'x') => { [p, q] = red(p, q); let s = p === 0 ? '' : (p < 0 ? '-' : '') + (Math.abs(p) === 1 ? '' : Math.abs(p)) + v + (q === 1 ? '' : '/' + q);
  if (b || !s) s += (s && b >= 0 ? '+' : '') + f(b).replace('−', '-'); return s; };
const mxbH = (p, q, b, v = 'x') => { [p, q] = red(p, q); let s = '';
  if (p) s = (p < 0 ? '−' : '') + (q === 1 ? (Math.abs(p) === 1 ? '' : Math.abs(p)) + mm(v) : fh(Math.abs(p), q) + mm(v));
  if (b || !s) s += s ? (b < 0 ? ' − ' : ' + ') + Math.abs(b) : f(b); return s; };
const yeq = (p, q, b) => `${mm('y')} = ${mxbH(p, q, b)}`;
const SLOPES = [[1, 1], [2, 1], [3, 1], [1, 2], [3, 2], [2, 3], [1, 3], [-1, 1], [-2, 1], [-3, 1], [-1, 2], [-3, 2], [-2, 3], [-1, 3]];

/* ---------- V7 visuals ---------- */
const V7 = {};
// two-row table; headers italic
V7.table = (xs, ys, o = {}) => {
  const hd = o.head || ['x', 'y'], cw = o.cw || 56, hw = o.hw || (hd[0].length > 2 ? 110 : 50), rh = 36; let b = '';
  const cell = (x, y, w, v, head) => { b += `<rect x="${x}" y="${y}" width="${w}" height="${rh}" fill="${head ? C.faint : C.paper}" stroke="${C.ink}" stroke-width="1.5"/>`;
    if (v === '?') b += `<rect x="${x + w / 2 - 15}" y="${y + 7}" width="30" height="${rh - 14}" rx="5" fill="${C.amber}"/>` + V.text(x + w / 2, y + rh / 2, '?', {size: 16, weight: 700});
    else b += `<text x="${x + w / 2}" y="${y + rh / 2}" font-size="16" fill="${C.ink}" text-anchor="middle" dominant-baseline="central" font-weight="${head ? 700 : 500}"${head && v.length <= 2 ? ' font-style="italic"' : ''}>${V.esc(String(v).replace(/-/g, '−'))}</text>`; };
  cell(2, 2, hw, hd[0], true); xs.forEach((v, i) => cell(2 + hw + i * cw, 2, cw, v));
  cell(2, 2 + rh, hw, hd[1], true); ys.forEach((v, i) => cell(2 + hw + i * cw, 2 + rh, cw, v));
  return V.svg(hw + xs.length * cw + 4, 2 * rh + 4, b, 'table');
};
// coordinate plane with extras: dashed [[x1,y1,x2,y2,col]], curves [{fn|pts, color}], labels [[x,y,text,col]], dots [[x,y,label]]
V7.plane = (o = {}) => {
  const lo = o.min ?? -6, hi = o.max ?? 6, u = o.size || 28, X = v => 20 + (v - lo) * u, Y = v => 20 + (hi - v) * u;
  let base = V.plane({min: lo, max: hi, size: u, lines: o.lines, segments: o.segments}), e = '';
  const P = n => Math.round(n * 100) / 100;
  (o.curves || []).forEach(c => { const col = c.color || C.blue; let pts = c.pts;
    if (!pts) { pts = []; for (let x = lo; x <= hi + 1e-9; x += 0.02) { const y = c.fn(x); pts.push(isFinite(y) ? [x, y] : null); } }
    let run = [], prev = null; const inb = p => p && p[0] >= lo - 1e-9 && p[0] <= hi + 1e-9 && p[1] >= lo - 1e-9 && p[1] <= hi + 1e-9;
    const flush = () => { if (run.length > 1) e += `<polyline points="${run.map(([x, y]) => P(X(x)) + ',' + P(Y(y))).join(' ')}" fill="none" stroke="${col}" stroke-width="2.5" stroke-linejoin="round"/>`; run = []; };
    pts.forEach(p => { if (inb(p)) { if (!run.length && prev && inb(prev) === false && prev) { const y = Math.max(lo, Math.min(hi, prev[1])); const t = (y - prev[1]) / (p[1] - prev[1] || 1); run.push([prev[0] + (p[0] - prev[0]) * Math.min(1, Math.max(0, t)), y]); } run.push(p); }
      else { if (run.length && p) { const y = Math.max(lo, Math.min(hi, p[1])), q = run[run.length - 1], t = (y - q[1]) / (p[1] - q[1] || 1); run.push([q[0] + (p[0] - q[0]) * Math.min(1, Math.max(0, t)), y]); } flush(); }
      prev = p; });
    flush(); });
  (o.dashed || []).forEach(([a, b, c, d, col]) => e += `<line x1="${X(a)}" y1="${Y(b)}" x2="${X(c)}" y2="${Y(d)}" stroke="${col || C.amber}" stroke-width="3" stroke-dasharray="6 4"/>`);
  (o.fills || []).forEach(([pts, col]) => e += `<polygon points="${pts.map(([x, y]) => X(x) + ',' + Y(y)).join(' ')}" fill="${col}" fill-opacity="0.25" stroke="none"/>`);
  (o.labels || []).forEach(([x, y, t, col]) => e += `<rect x="${X(x) - 11}" y="${Y(y) - 11}" width="22" height="22" rx="5" fill="${C.paper}" stroke="${col || C.ink}" stroke-width="1.5"/>` + V.text(X(x), Y(y), t, {size: 14, weight: 700, fill: col || C.ink}));
  (o.dots || []).forEach(([x, y, t]) => { e += V.dot(X(x), Y(y), 5, C.red); if (t) e += V.text(X(x) + 11, Y(y) - 11, t, {size: 14, weight: 700}); });
  return base.replace(/<\/svg>$/, e + '</svg>');
};
// a spot on line y = mx + b (m = p/q) inside [lo+1, hi-1] near the right, for a label
const onLine = (p, q, b, lo = -6, hi = 6, pref = 1) => { const xs = []; for (let x = hi - 0.8; x >= lo + 0.8; x -= 0.2) xs.push(x); if (pref < 0) xs.reverse();
  for (const x of xs) { const y = p / q * x + b; if (y >= lo + 0.8 && y <= hi - 0.8) return [Math.round(x * 10) / 10, Math.round(y * 10) / 10]; } return [0, b]; };
// label offset from a line so the box doesn't sit on it
const offLine = (p, q, b, lo, hi, pref) => { const [x, y] = onLine(p, q, b, lo, hi, pref); const s = p / q; const nx = -s, ny = 1, L = Math.hypot(nx, ny); return [x + 0.7 * nx / L, y + 0.7 * ny / L]; };

/* ---------- III.7.01 Input–output rules ---------- */
const ruleWords = (p, b) => `multiply by ${f(p)}, then ${b >= 0 ? 'add' : 'subtract'} ${Math.abs(b)}`;
E3.skill({ id: 'III.7.01', name: 'Input–output rules', steps: {
  a: { t: 'apply a rule, or undo it', g: (R) => { const p = nz(R, -5, 9), b = nz(R, -12, 15), t = R.int(0, 2); let x = R.int(-6, 12);
    if (t === 0) { x = R.int(1, 12); const pp = Math.abs(p) < 2 ? R.int(2, 9) : Math.abs(p);
      return num(`The rule is: ${ruleWords(pp, b)}. What is the output for the input ${x}?`, pp * x + b, `${pp} × ${x} = ${pp * x}, then ${f(pp * x)} ${b >= 0 ? '+' : '−'} ${Math.abs(b)} = ${f(pp * x + b)}.`); }
    if (t === 1) return num(`The rule is ${yeq(p, 1, b)}. Find ${mm('y')} when ${mm('x')} = ${f(x)}.`, p * x + b, `${mm('y')} = ${p === 1 ? pn(x) : p === -1 ? '−' + pn(x) : `${f(p)}(${f(x)})`} ${b < 0 ? '−' : '+'} ${Math.abs(b)} = ${f(p * x + b)}.`);
    const pp = R.int(2, 9); x = R.int(1, 12); const out = pp * x + b;
    return num(`The rule is: ${ruleWords(pp, b)}. The output is ${f(out)}. What was the input?`, x, `Undo in reverse: ${f(out)} ${b >= 0 ? '−' : '+'} ${Math.abs(b)} = ${f(pp * x)}, then ${f(pp * x)} ÷ ${pp} = ${x}.`); } },
  b: { t: 'fill an in–out table', g: (R) => { const p = nz(R, -4, 6), b = nz(R, -9, 9), s = R.int(-2, 3), xs = [s, s + 1, s + 2, s + 3, s + 4], ys = xs.map(x => p * x + b);
    const [i, j] = R.sample([1, 2, 3, 4], 2).sort(), shown = ys.map((y, k) => k === i || k === j ? '?' : y);
    return num(`Rule: ${yeq(p, 1, b)}. Fill in the table.`, [{label: `x = ${f(xs[i])}, y =`, ans: ys[i]}, {label: `x = ${f(xs[j])}, y =`, ans: ys[j]}],
      `Put each input into the rule: ${[i, j].map(k => `${p === 1 ? '' : p === -1 ? '−' : f(p)}(${f(xs[k])}) ${b < 0 ? '−' : '+'} ${Math.abs(b)} = ${f(ys[k])}`).join(', ')}.`, {visual: V7.table(xs, shown, {head: ['x', 'y']})}); } },
  c: { t: 'find the rule from a table', g: (R) => { const p = R.pick([2, 3, 4, 5, -2, -3]), b = nz(R, -8, 10), s = R.int(0, 2), xs = [s, s + 1, s + 2, s + 3], ys = xs.map(x => p * x + b);
    const first = ys[0] - xs[0], bad = [yeq(b, 1, p), yeq(p, 1, b + p), yeq(p, 1, 0)].filter(z => z !== yeq(p, 1, b) && z !== yeq(1, 1, first));
    return choice(R, 'Which rule fits every pair in the table?', yeq(p, 1, b), [yeq(1, 1, first), ...R.sample(bad, 2)], `When ${mm('x')} goes up 1, ${mm('y')} ${p > 0 ? 'goes up' : 'goes down'} ${Math.abs(p)}, so ${mm('y')} = ${f(p)}${mm('x')} + something. Test every pair: ${yeq(p, 1, b)} works. ${yeq(1, 1, first)} fits only the first pair.`, {visual: V7.table(xs, ys)}); } },
  d: { t: 'write the rule as an equation', g: (R) => { const t = R.int(0, 2), p = R.pick([2, 3, 4, 5, 6, -2, -3]), b = nz(R, -9, 9);
    if (t === 0) { const s = R.int(0, 2), xs = [s, s + 1, s + 2, s + 3], ys = xs.map(x => p * x + b);
      return num('Write the rule for the table as an equation.', [{label: 'y =', expr: mxbA(p, 1, b), form: 'any'}], `${mm('y')} changes by ${f(p)} for each 1 in ${mm('x')}; at ${mm('x')} = 0, ${mm('y')} = ${f(b)}: ${yeq(p, 1, b)}.`, {visual: V7.table(xs, ys)}); }
    if (t === 1) { const pp = Math.abs(p);
      return num(`Rule: ${ruleWords(pp, b)}. Write it as an equation.`, [{label: 'y =', expr: mxbA(pp, 1, b), form: 'any'}], `Multiply ${mm('x')} by ${pp}, then ${b > 0 ? 'add' : 'subtract'} ${Math.abs(b)}: ${yeq(pp, 1, b)}.`); }
    const a = R.int(2, 6), c = nz(R, -6, 6);
    return num(`Rule: ${c > 0 ? 'add' : 'subtract'} ${Math.abs(c)}, then multiply by ${a}. Write it as an equation.`, [{label: 'y =', expr: `${a}(x${c > 0 ? '+' : '-'}${Math.abs(c)})`, form: 'any'}],
      `First ${H(`x${c > 0 ? '+' : '-'}${Math.abs(c)}`)}, then multiply the whole thing by ${a}: ${mm('y')} = ${a}(${H(`x${c > 0 ? '+' : '-'}${Math.abs(c)}`)}), or ${yeq(a, 1, a * c)}.`); } },
}});

/* ---------- III.7.02 Graph from a table ---------- */
E3.skill({ id: 'III.7.02', name: 'Graph from a table', steps: {
  a: { t: 'plot table pairs', g: (R) => { let a, b; do { a = nz(R, -5, 5); b = nz(R, -5, 5); } while (Math.abs(a) === Math.abs(b));
    const cand = [[a, b], [b, a], [-a, b], [a, -b], [-b, -a]], pts = [cand[0], cand[1], R.pick([cand[2], cand[3]]), cand[4]].slice(0, 4);
    const order = R.shuffle([0, 1, 2, 3]), labeled = order.map((k, i) => [...pts[k], 'ABCD'[i]]), ans = order.indexOf(0);
    return choiceFixed(`The table has the pair ${mm('x')} = ${f(a)}, ${mm('y')} = ${f(b)}. Which point shows it?`, ['A', 'B', 'C', 'D'], ans,
      `Go ${Math.abs(a)} ${a > 0 ? 'right' : 'left'} (${mm('x')} first), then ${Math.abs(b)} ${b > 0 ? 'up' : 'down'}: point ${'ABCD'[ans]}. The point at ${pt(b, a)} has the numbers swapped.`, {visual: V7.plane({dots: labeled})}); } },
  b: { t: 'read pairs off a graph', g: (R) => { const p = R.pick([1, 2, -1, -2]), b = R.int(-2, 2), xs = [-2, -1, 0, 1, 2, 3].filter(x => Math.abs(p * x + b) <= 5), use = xs.slice(0, 5);
    const k = R.int(0, use.length - 1), x = use[k], y = p * x + b;
    if (R.bool(0.5)) { const lab = 'ABCDE'.slice(0, use.length);
      return num(`The graph shows a table of pairs. What are the coordinates of point ${lab[k]}?`, [{label: 'x', ans: x}, {label: 'y', ans: y}], `${lab[k]} is ${x ? `${Math.abs(x)} ${x > 0 ? 'right' : 'left'}` : 'on the y-axis'} and ${y ? `${Math.abs(y)} ${y > 0 ? 'up' : 'down'}` : 'on the x-axis'}: ${pt(x, y)}.`, {visual: V7.plane({dots: use.map((z, i) => [z, p * z + b, lab[i]])})}); }
    return num(`The graph shows a table of pairs. What is ${mm('y')} when ${mm('x')} = ${f(x)}?`, y, `Find ${mm('x')} = ${f(x)} on the ${mm('x')}-axis and look up or down to the point: ${pt(x, y)}, so ${mm('y')} = ${f(y)}.`, {visual: V7.plane({dots: use.map(z => [z, p * z + b])})}); } },
  c: { t: 'decide if points line up', g: (R) => { const p = R.pick([1, 2, -1, -2, 0.5]), b = R.int(-3, 2); let xs = [-4, -2, 0, 2, 4]; if (p === 2 || p === -2) xs = [-2, -1, 0, 1, 2];
    let pts = xs.map(x => [x, p * x + b]).filter(([, y]) => Math.abs(y) <= 6); const line = R.bool();
    if (!line) { const k = R.int(1, pts.length - 2); pts = pts.map((q, i) => i === k ? [q[0], q[1] + R.pick([-2, -1, 1, 2]) * (Math.abs(q[1]) > 4 ? -1 : 1)] : q); }
    const ex = line ? `Each step of ${Math.abs(pts[1][0] - pts[0][0])} to the right changes ${mm('y')} by the same amount (${f(pts[1][1] - pts[0][1])}), so the points line up.` : `The steps in ${mm('y')} are not all the same, so the points don't line up.`;
    if (R.bool(0.5)) return choiceFixed('Do these points lie on one straight line?', ['Yes', 'No'], line ? 0 : 1, ex, {visual: V7.plane({dots: pts})});
    return choiceFixed('Plot the table. Do the points lie on one straight line?', ['Yes', 'No'], line ? 0 : 1, ex, {visual: V7.table(pts.map(q => q[0]), pts.map(q => q[1]))}); } },
  d: { t: 'extend the pattern on the graph', g: (R) => { const p = R.int(1, 3), b = R.int(0, p === 3 ? 1 : 3), xs = [0, 1, 2, 3], X = R.int(5, 8), Y = p * X + b;
    return num(`The pattern continues in a straight line. What is ${mm('y')} when ${mm('x')} = ${X}?`, Y, `Each step of 1 to the right goes up ${p}. From ${pt(3, 3 * p + b)}, ${X - 3} more steps: ${3 * p + b} + ${X - 3} × ${p} = ${Y}.`,
      {visual: V7.plane({min: -1, max: 11, size: 26, dots: xs.map(x => [x, p * x + b])})}); } },
}});

/* ---------- III.7.03 Rate of change ---------- */
const CTX3 = [ // [y name, y unit, x name, x unit, per-phrase]
  ['distance', 'km', 'time', 'h', 'km per hour'], ['water in a tank', 'L', 'time', 'min', 'liters per minute'], ['cost', '$', 'tickets', 'tickets', 'dollars per ticket'],
  ['height of a plant', 'cm', 'time', 'weeks', 'cm per week'], ['temperature', '°C', 'time', 'h', '°C per hour'], ['pages read', 'pages', 'time', 'days', 'pages per day']];
E3.skill({ id: 'III.7.03', name: 'Rate of change', steps: {
  a: { t: 'change in y over change in x', g: (R) => { const t = R.int(0, 2); let x1, x2, y1, y2; do { x1 = R.int(-5, 6); x2 = R.int(-5, 9); y1 = R.int(-10, 20); y2 = R.int(-10, 20); } while (x1 === x2 || y1 === y2);
    const ex = `Change in ${mm('y')} ÷ change in ${mm('x')} = ${fh(`${f(y2)} − ${pn(y1)}`, `${f(x2)} − ${pn(x1)}`)} = ${fh(f(y2 - y1), f(x2 - x1))}${E3.gcd(Math.abs(y2 - y1), Math.abs(x2 - x1)) === 1 && x2 - x1 > 1 ? '' : ' = ' + qh(y2 - y1, x2 - x1)}.`;
    if (t === 0) return num(`Find the rate of change from ${pt(x1, y1)} to ${pt(x2, y2)}.`, [qf(y2 - y1, x2 - x1)], ex);
    if (t === 1) { const h1 = R.int(0, 4), h2 = h1 + R.int(1, 5), r = nz(R, -15, 20), L1 = R.int(40, 90), L2 = L1 + r * (h2 - h1);
      return num(`At ${h1} h a tank holds ${L1} L. At ${h2} h it holds ${L2} L. What is the rate of change, in liters per hour?`, r, `${fh(`${L2} − ${L1}`, `${h2} − ${h1}`)} = ${fh(f(L2 - L1), h2 - h1)} = ${f(r)} liters per hour.${r < 0 ? ' Negative: the tank is emptying.' : ''}`); }
    return choice(R, `What is the rate of change from ${pt(x1, y1)} to ${pt(x2, y2)}?`, qh(y2 - y1, x2 - x1), [qh(x2 - x1, y2 - y1), qh(y1 - y2, x2 - x1), qh(y2 + y1, x2 + x1 || 1)], ex + ' Not the other way up.'); } },
  b: { t: 'rate from a table', g: (R) => { const st = R.pick([1, 2, 3, 5, 10]), r = R.pick([2, 3, 4, 5, -2, -3, 1.5, 0.5, -4]), s0 = R.int(0, 3) * st, y0 = R.int(-10, 30), xs = [0, 1, 2, 3].map(i => s0 + i * st), ys = xs.map(x => y0 + r * (x - s0));
    return num(`${mm('y')} changes at a constant rate. What is the rate of change?`, r, `${mm('x')} goes up ${st} each step and ${mm('y')} ${r > 0 ? 'goes up' : 'goes down'} ${f(Math.abs(r * st))}: ${fh(f(r * st), st)} = ${f(r)} per unit of ${mm('x')}.`, {visual: V7.table(xs, ys.map(f))}); } },
  c: { t: 'rate from a graph', g: (R) => { let p, q, b, A, B; do { [p, q] = R.pick(SLOPES); b = R.int(-3, 3); const k = R.int(1, 2), x0 = -q * R.int(0, 1); A = [x0, p / q * x0 + b]; B = [x0 + k * q, p / q * (x0 + k * q) + b]; } while ([...A, ...B].some(v => Math.abs(v) > 5 || !Number.isInteger(v)));
    return num('Find the rate of change of the line.', [qf(p, q)], `From ${pt(...A)} to ${pt(...B)}: ${mm('y')} changes ${f(B[1] - A[1])} while ${mm('x')} changes ${f(B[0] - A[0])}. ${fh(f(B[1] - A[1]), f(B[0] - A[0]))}${B[1] - A[1] === p && B[0] - A[0] === q && q > 1 ? '' : ' = ' + qh(p, q)}.`,
      {visual: V7.plane({lines: [{m: p / q, b}], dots: [A, B]})}); } },
  d: { t: 'interpret units of a rate', g: (R, O) => { const c = R.pick(CTX3), t = R.int(0, 1), r = R.int(2, 12);
    const unitY = c[1] === '$' ? cur(O) : c[1], per = c[1] === '$' ? `${cur(O)} per ticket` : c[4];
    if (t === 0) { const wrong = c[1] === '$' ? [`tickets per ${cur(O).replace(/s$/, '')}`, cur(O), 'tickets'] : [`${c[3]} per ${unitY}`.replace('h per', 'hours per'), unitY, c[3] === 'h' ? 'hours' : c[3]];
      return choice(R, `${mm('y')} is the ${c[0]} in ${unitY} and ${mm('x')} is ${c[2] === 'time' ? `the time in ${c[3] === 'h' ? 'hours' : c[3]}` : 'the number of tickets'}. The rate of change is ${r}. What are its units?`, per, wrong,
        `Rate = change in ${mm('y')} ÷ change in ${mm('x')}, so its units are ${unitY} per ${c[3] === 'h' ? 'hour' : c[3].replace(/s$/, '')}${per === `${unitY} per ${c[3].replace(/s$/, '')}` ? '' : `: ${per}`}.`); }
    const dn = R.bool(), lbl = dn ? 'falls' : 'rises', ttl = c[0] === 'temperature' ? ['The temperature', '°C', 'hour'] : ['The water level', 'cm', 'minute'];
    return choice(R, `${ttl[0]} changes at ${dn ? '−' : ''}${r} ${ttl[1]} per ${ttl[2]}. What does this mean?`, `It ${lbl} ${r} ${ttl[1]} every ${ttl[2]}`, [`It ${dn ? 'rises' : 'falls'} ${r} ${ttl[1]} every ${ttl[2]}`, `It ${lbl} 1 ${ttl[1]} every ${r} ${ttl[2]}s`, `It is ${dn ? '−' : ''}${r} ${ttl[1]} now`],
      `A rate says how much ${mm('y')} changes for each 1 unit of ${mm('x')}. ${dn ? 'Negative means falling' : 'Positive means rising'}: ${r} ${ttl[1]} each ${ttl[2]}.`); } },
}});

/* ---------- III.7.04 Slope ---------- */
// two lattice points on a line of slope p/q, both inside [-5,5]
const twoPts = (R, p, q) => { for (let i = 0; i < 60; i++) { const k = R.int(1, 3), x1 = R.int(-5, 5), y1 = R.int(-5, 5), x2 = x1 + k * q, y2 = y1 + k * p; if (Math.abs(x2) <= 5 && Math.abs(y2) <= 5) return [[x1, y1], [x2, y2]]; } return [[0, 0], [q, p]]; };
const KIND = ['positive', 'negative', 'zero', 'not defined'];
E3.skill({ id: 'III.7.04', name: 'Slope', steps: {
  a: { t: 'rise over run on a grid', g: (R) => { const [p, q] = R.pick(SLOPES), [A, B] = twoPts(R, p, q), b = A[1] - p / q * A[0];
    const vis = {visual: V7.plane({lines: [{m: p / q, b}], dashed: [[A[0], A[1], B[0], A[1]], [B[0], A[1], B[0], B[1]]], dots: [[...A, 'P'], [...B, 'Q']]})};
    const ex = `From P to Q: run ${B[0] - A[0]} right, rise ${f(B[1] - A[1])}. Slope = ${fh('rise', 'run')} = ${fh(f(B[1] - A[1]), B[0] - A[0])}${B[1] - A[1] === p && B[0] - A[0] === q && q > 1 ? '' : ' = ' + qh(p, q)}.`;
    if (R.bool(0.35)) return choice(R, 'What is the slope of the line?', qh(p, q), [qh(q, p), qh(-p, q), f(B[1] - A[1]), qh(-q, p)], ex + ' Rise over run, not run over rise.', vis);
    return num('What is the slope of the line? Use the slope triangle from P to Q.', [qf(p, q)], ex, vis); } },
  b: { t: 'slope from two points', g: (R) => { let x1, x2, y1, y2; do { x1 = R.int(-9, 9); x2 = R.int(-9, 9); y1 = R.int(-9, 9); y2 = R.int(-9, 9); } while (x1 === x2 || y1 === y2);
    return num(`Find the slope of the line through ${pt(x1, y1)} and ${pt(x2, y2)}.`, [qf(y2 - y1, x2 - x1)], `${mm('m')} = ${fh(`${f(y2)} − ${pn(y1)}`, `${f(x2)} − ${pn(x1)}`)} = ${fh(f(y2 - y1), f(x2 - x1))} = ${qh(y2 - y1, x2 - x1)}.`); } },
  c: { t: 'positive, negative, zero, undefined', g: (R) => { const k = R.int(0, 3), t = R.bool(0.55);
    const ex = ['It rises from left to right: positive slope.', 'It falls from left to right: negative slope.', 'It is flat: the rise is 0, so the slope is 0.', 'It is vertical: the run is 0 and you can’t divide by 0, so the slope is not defined (it isn’t 0).'][k];
    if (t) { let line; if (k === 3) line = {x: nz(R, -4, 4)}; else if (k === 2) line = {m: 0, b: nz(R, -4, 4)}; else { const [p, q] = R.pick(SLOPES.filter(s => (s[0] > 0) === (k === 0))); line = {m: p / q, b: R.int(-3, 3)}; }
      return choiceFixed('What kind of slope does the line have?', KIND, k, ex, {visual: V7.plane({lines: [line]})}); }
    const x1 = R.int(-6, 6), y1 = R.int(-6, 6), d = R.int(1, 6), e = R.int(1, 6), P2 = [[x1 + d, y1 + e], [x1 + d, y1 - e], [x1 + d, y1], [x1, y1 + e * R.pick([-1, 1])]][k];
    return choiceFixed(`What kind of slope does the line through ${pt(x1, y1)} and ${pt(...P2)} have?`, KIND, k, ex.replace('It', 'The line') + (k === 3 ? ` Both points have ${mm('x')} = ${f(x1)}.` : k === 2 ? ` Both points have ${mm('y')} = ${f(y1)}.` : ''), {}); } },
  d: { t: 'compare steepness', g: (R) => { const t = R.int(0, 1);
    if (t === 0) { const ms = R.sample([[1, 2], [1, 1], [2, 1], [3, 1], [4, 1], [3, 2], [5, 1], [1, 3], [2, 3]], 3).sort((a, b) => b[0] / b[1] - a[0] / a[1]); const sg = ms.map(() => R.pick([1, -1]));
      if (sg[0] > 0 && R.bool(0.6)) sg[0] = -1; const eqs = ms.map(([p, q], i) => yeq(sg[i] * p, q, nz(R, -5, 5)));
      const extra = ms[0][0] / ms[0][1] > 1 ? yeq(1, 1, 8) : yeq(1, 3, 9);
      return choice(R, 'Which line is the steepest?', eqs[0], [eqs[1], eqs[2], extra], `Steepness depends on the size of the slope, ignoring its sign: ${qh(sg[0] * ms[0][0], ms[0][1])} is furthest from 0. The ${mm('y')}-intercept doesn't matter.`); }
    let a, c; do { a = R.pick(SLOPES); c = R.pick(SLOPES); } while (Math.abs(a[0] / a[1]) === Math.abs(c[0] / c[1]));
    const A = a[0] / a[1], Cc = c[0] / c[1], ans = Math.abs(A) > Math.abs(Cc) ? 0 : 1;
    return choiceFixed('Which line is steeper?', ['A', 'B'], ans, `Slope of A = ${qh(...a)}, slope of B = ${qh(...c)}. Compare sizes, ignoring signs: ${'AB'[ans]} is steeper.`,
      {visual: V7.plane({lines: [{m: A, b: 0, color: C.blue}, {m: Cc, b: 0, color: C.red}], labels: [[...offLine(a[0], a[1], 0, -6, 6, 1), 'A', C.blue], [...offLine(c[0], c[1], 0, -6, 6, -1), 'B', C.red]]})}); } },
}});

/* ---------- III.7.05 Slope and similar triangles ---------- */
const triL = (A, B) => [[A[0], A[1], B[0], A[1]], [B[0], A[1], B[0], B[1]]];
// a line with slope p/q and two slope triangles (sizes k1, k2) that fit in [-6,6]
const twoTri = (R) => { for (let i = 0; i < 200; i++) { const [p, q] = R.pick(SLOPES.filter(([a, c]) => Math.abs(a) <= 2 && c <= 2)), b = R.int(-3, 3), k2 = R.int(2, 3);
    const s1 = q * R.int(-6, 2), s2 = q * R.int(-2, 4), y = x => p / q * x + b, A1 = [s1, y(s1)], A2 = [s1 + q, y(s1 + q)], B1 = [s2, y(s2)], B2 = [s2 + k2 * q, y(s2 + k2 * q)];
    const all = [...A1, ...A2, ...B1, ...B2]; if (all.every(v => Number.isInteger(v) && Math.abs(v) <= 6) && s2 >= s1 + q + 1) return {p, q, b, k2, A1, A2, B1, B2}; }
  return {p: 1, q: 1, b: 0, k2: 2, A1: [-5, -5], A2: [-4, -4], B1: [0, 0], B2: [2, 2]}; };
E3.skill({ id: 'III.7.05', name: 'Slope and similar triangles', steps: {
  a: { t: 'draw slope triangles', g: (R) => { const [p, q] = R.pick(SLOPES), [A, B] = twoPts(R, p, q), b = A[1] - p / q * A[0], run = B[0] - A[0], rise = B[1] - A[1];
    if (R.bool(0.5)) return num('Read the slope triangle from P to Q. Write a fall as a negative rise.', [{label: 'run', ans: run}, {label: 'rise', ans: rise}],
      `Across: ${run} to the right. ${rise > 0 ? 'Up' : 'Down'}: ${Math.abs(rise)}, so the rise is ${f(rise)}. Slope = ${fh(f(rise), run)}${rise === p && run === q && q > 1 ? '' : ' = ' + qh(p, q)}.`, {visual: V7.plane({lines: [{m: p / q, b}], dashed: triL(A, B), dots: [[...A, 'P'], [...B, 'Q']]})});
    return num(`Draw a slope triangle from P: go ${run} to the right. How far up must you go to meet the line again? (Down is negative.)`, rise,
      `The line has slope ${qh(p, q)}, so a run of ${run} needs a rise of ${qh(p, q)} × ${run} = ${f(rise)}. The corner is at ${pt(...B)}.`, {visual: V7.plane({lines: [{m: p / q, b}], dots: [[...A, 'P']]})}); } },
  b: { t: 'compare rise ÷ run of two slope triangles', g: (R) => { const [p, q] = R.pick(SLOPES.filter(s => s[0] > 0)), k = R.int(2, 4), a = q * R.int(1, 2), r = p * a / q, t = R.int(0, 2);
    if (t === 0) { const same = R.bool(), r2 = same ? k * r : k * r + R.pick([-1, 1]);
      return choiceFixed(`Slope triangle 1 has run ${a}, rise ${r}. Slope triangle 2 has run ${k * a}, rise ${r2}. Do they give the same rise ÷ run (so they are similar)?`, ['Yes', 'No'], same ? 0 : 1, `Triangle 1: ${fh(r, a)} = ${qh(r, a)}. Triangle 2: ${fh(r2, k * a)} = ${qh(r2, k * a)}. ${same ? 'Same ratio, so yes.' : 'Different ratios, so no.'}`); }
    if (t === 1) return num(`Slope triangles with run ${a}, rise ${r} and run ${k * a}, rise ${k * r}. Find rise ÷ run for each.`, [qf(r, a, 'small'), qf(k * r, k * a, 'big')], `${fh(r, a)} = ${qh(p, q)} and ${fh(k * r, k * a)} = ${qh(p, q)}: the same, so the triangles are similar.`);
    return num(`A slope triangle on a line has run ${a} and rise ${r}. A bigger one on the same line has run ${k * a}. What is its rise?`, k * r, `Rise ÷ run must stay ${qh(p, q)}: the run is ${k} times as long, so the rise is too: ${r} × ${k} = ${k * r}.`); } },
  c: { t: 'same ratio anywhere on the line', g: (R) => { const T = twoTri(R), {p, q, b, k2, A1, A2, B1, B2} = T, up = p > 0 ? -1 : 1;
    const vis = {visual: V7.plane({lines: [{m: p / q, b}], dashed: [...triL(A1, A2), ...triL(B1, B2).map(z => [...z, C.teal])], labels: [[(A1[0] + A2[0]) / 2, Math.abs(A1[1] + 0.9 * up) > 6.4 ? A1[1] - 0.9 * up : A1[1] + 0.9 * up, 'A', C.amber], [(B1[0] + B2[0]) / 2, Math.abs(B1[1] + 0.9 * up) > 6.4 ? B1[1] - 0.9 * up : B1[1] + 0.9 * up, 'B', C.teal]]})};
    const ex = `A: ${fh(f(A2[1] - A1[1]), A2[0] - A1[0])}${A2[1] - A1[1] === p && A2[0] - A1[0] === q && q > 1 ? '' : ' = ' + qh(p, q)}. B: ${fh(f(B2[1] - B1[1]), B2[0] - B1[0])}${B2[1] - B1[1] === p && B2[0] - B1[0] === q && q > 1 ? '' : ' = ' + qh(p, q)}. Same line, same slope, wherever the triangle is.`;
    if (R.bool(0.6)) return num('Find rise ÷ run for each slope triangle.', [qf(p, q, 'A'), qf(p, q, 'B')], ex, vis);
    return choice(R, 'Triangle B is bigger than triangle A. Which is true?', `Both give slope ${qh(p, q)}`, [`B gives a bigger slope than A`, `A gives a bigger slope than B`, `B gives slope ${qh(k2 * p, q)}`], ex, vis); } },
  d: { t: 'rise ÷ run from different pairs of points', g: (R) => { const [p, q] = R.pick(SLOPES), x0 = R.int(-4, 0), y0 = R.int(-3, 3), m1 = R.int(1, 2), m2 = R.int(1, 3), t = R.int(0, 2);
    const P = [x0, y0], Q = [x0 + m1 * q, y0 + m1 * p], S = [x0 + (m1 + m2) * q, y0 + (m1 + m2) * p];
    if (t === 0) return num(`The points P${pt(...P)}, Q${pt(...Q)} and R${pt(...S)} are on one line. Find rise ÷ run from P to Q and from Q to R.`, [qf(Q[1] - P[1], Q[0] - P[0], 'P to Q'), qf(S[1] - Q[1], S[0] - Q[0], 'Q to R')], `P to Q: ${fh(f(Q[1] - P[1]), Q[0] - P[0])} = ${qh(p, q)}. Q to R: ${fh(f(S[1] - Q[1]), S[0] - Q[0])} = ${qh(p, q)}. Same line, same slope.`);
    if (t === 1) { const on = R.bool(), S2 = on ? S : [S[0], S[1] + R.pick([-1, 1])], r1 = Q[1] - P[1], r2 = S2[1] - Q[1];
      return choiceFixed(`Are ${pt(...P)}, ${pt(...Q)} and ${pt(...S2)} on one straight line? Compare rise ÷ run.`, ['Yes', 'No'], on ? 0 : 1, `First pair: ${fh(f(r1), Q[0] - P[0])} = ${qh(r1, Q[0] - P[0])}. Second pair: ${fh(f(r2), S2[0] - Q[0])} = ${qh(r2, S2[0] - Q[0])}. ${on ? 'Equal, so yes.' : 'Not equal, so no.'}`); }
    const a = q * R.int(1, 2), r = p * a / q, k = R.int(2, 3), nm = R.pick(['Ben', 'Ava', 'Sam', 'Noor']);
    return choice(R, `${nm} says the big slope triangle (run ${k * a}, rise ${f(k * r)}) gives a steeper slope than the small one (run ${a}, rise ${f(r)}) on the same line. Work out both. What is the slope?`,
      `Both give ${qh(p, q)}`, [...new Set([`Big: ${qh(k * r, a)}, small: ${qh(p, q)}`, `Big: ${f(k * r)}, small: ${f(r)}`, `Both give ${qh(q, p)}`, `Both give ${f(k * r)}`, `Both give ${qh(p + (p > 0 ? 1 : -1), q)}`])].filter(z => z !== `Both give ${qh(p, q)}`).slice(0, 3), `${fh(f(k * r), k * a)} = ${fh(f(r), a)} = ${qh(p, q)}. Slope is a ratio, so both triangles give the same value.`); } },
}});

/* ---------- III.7.06 y = mx + b ---------- */
E3.skill({ id: 'III.7.06', name: 'y = mx + b', steps: {
  a: { t: 'read m and b from an equation', g: (R) => { const t = R.int(0, 3), [p0, q0] = R.pick([...SLOPES, [4, 1], [-4, 1], [5, 1]]), b0 = nz(R, -9, 9);
    let p = p0, q = q0, b = b0, e;
    if (t === 0) e = yeq(p, q, b);
    else if (t === 1) e = `${mm('y')} = ${f(b)} ${p < 0 ? '−' : '+'} ${mxbH(Math.abs(p), q, 0)}`;
    else if (t === 2) { b = 0; e = yeq(p, q, 0); } else { p = 0; q = 1; e = `${mm('y')} = ${f(b)}`; }
    return num(`Find the slope ${mm('m')} and the ${mm('y')}-intercept ${mm('b')} of ${e}.`, [qf(p, q, 'm ='), {label: 'b =', ans: b}],
      t === 1 ? `The slope is the number multiplying ${mm('x')}, wherever it is: ${mm('m')} = ${qh(p, q)}, not ${f(b)}. The constant is ${mm('b')} = ${f(b)}.`
      : t === 3 ? `There is no ${mm('x')} term, so ${mm('m')} = 0: the line is flat at ${mm('y')} = ${f(b)}.` : `Match ${mm('y = mx + b')}: ${mm('m')} = ${qh(p, q)} and ${mm('b')} = ${f(b)}${b === 0 ? ' (no constant term)' : ''}.`); } },
  b: { t: 'graph from slope-intercept form', g: (R) => { const [p, q] = R.pick(SLOPES), b = nz(R, -3, 3);
    if (R.bool(0.35)) return num(`The line ${yeq(p, q, b)} passes through (0, ?) and (${q * 2}, ?). Fill in the ${mm('y')}-values.`, [{label: '(0, ?)', ans: b}, {label: `(${q * 2}, ?)`, ans: b + 2 * p}],
      `At ${mm('x')} = 0, ${mm('y')} = ${f(b)} (the intercept). Going ${2 * q} right changes ${mm('y')} by ${qh(p, q)} × ${2 * q} = ${f(2 * p)}: ${f(b + 2 * p)}.`);
    const cands = [[p, q, b], [-p, q, b], [p, q, -b], [q, p, b]].filter((z, i, a) => a.findIndex(w => w[0] * z[1] === z[0] * w[1] && w[2] === z[2]) === i).slice(0, 3);
    const order = R.shuffle(cands.map((_, i) => i)), cols = [C.blue, C.red, C.teal], prefs = [1, -1, 1];
    const lines = order.map((k, i) => ({m: cands[k][0] / cands[k][1], b: cands[k][2], color: cols[i]}));
    const labels = order.map((k, i) => [...offLine(cands[k][0], cands[k][1], cands[k][2], -6, 6, prefs[i] * (i === 2 ? -1 : 1) * (R.bool() ? 1 : 1)), 'ABC'[i], cols[i]]);
    return choiceFixed(`Which line is ${yeq(p, q, b)}?`, ['A', 'B', 'C'].slice(0, cands.length), order.indexOf(0), `Start at (0, ${f(b)}) on the ${mm('y')}-axis, then go ${q} right and ${Math.abs(p)} ${p > 0 ? 'up' : 'down'}.`,
      {visual: V7.plane({lines, labels})}); } },
  c: { t: 'write the equation from a graph', g: (R) => { let p, q, b; do { [p, q] = R.pick(SLOPES); b = R.int(-4, 4); } while (Math.abs(b + p) > 5);
    return num('Write the equation of the line.', [{label: 'y =', expr: mxbA(p, q, b), form: 'any'}], `It crosses the ${mm('y')}-axis at ${f(b)}, so ${mm('b')} = ${f(b)}. From (0, ${f(b)}) to ${pt(q, b + p)}: slope ${fh(f(p), q)}. So ${yeq(p, q, b)}.`,
      {visual: V7.plane({lines: [{m: p / q, b}], dots: [[0, b], [q, b + p]]})}); } },
  d: { t: 'write it from two points', g: (R) => { const [p, q] = R.pick([...SLOPES, [4, 1], [-4, 1]]), b = nz(R, -8, 8); let i, j; do { i = R.int(-3, 4); j = R.int(-3, 4); } while (i === j || i === 0 && j === 0);
    const x1 = i * q, x2 = j * q, y1 = p * i + b, y2 = p * j + b;
    return num(`Write the equation of the line through ${pt(x1, y1)} and ${pt(x2, y2)}.`, [{label: 'y =', expr: mxbA(p, q, b), form: 'any'}],
      `${mm('m')} = ${fh(f(y2 - y1), f(x2 - x1))} = ${qh(p, q)}. Then ${f(y1)} = ${qh(p, q)} × ${pn(x1)} + ${mm('b')}, so ${mm('b')} = ${f(b)}: ${yeq(p, q, b)}.`); } },
}});

/* ---------- III.7.07 Proportional vs non-proportional ---------- */
const PN = ['Proportional', 'Not proportional'];
E3.skill({ id: 'III.7.07', name: 'Proportional vs non-proportional', steps: {
  a: { t: 'through the origin test', g: (R) => { const [p, q] = R.pick(SLOPES.filter(s => s[0] > 0)), prop = R.bool(), b = prop ? 0 : nz(R, -4, 4);
    return choiceFixed('Is the relationship shown proportional?', PN, prop ? 0 : 1, prop ? 'It is a straight line through the origin (0, 0), so it is proportional.' : `It is straight, but it crosses the ${mm('y')}-axis at ${f(b)}, not at 0. It misses the origin, so it is not proportional.`,
      {visual: V7.plane({lines: [{m: p / q, b}]})}); } },
  b: { t: 'constant ratio y/x test', g: (R) => { const k = R.pick([2, 3, 4, 5, 1.5, 2.5, 0.5, 6]), st = R.pick([1, 2, 3]), xs = [1, 2, 3, 4].map(i => i * st), prop = R.bool(0.67), b = prop ? 0 : nz(R, 1, 6);
    const ys = xs.map(x => k * x + b), rat = xs.map((x, i) => { const r = ys[i] / x, r2 = Math.round(r * 100) / 100; return (r2 !== r ? 'about ' : '') + fmt(r2); });
    if (prop && R.bool(0.5)) return num(`${mm('y')} is proportional to ${mm('x')}. Find the constant ${mm('k')} = ${fh(mm('y'), mm('x'))}.`, k, `${fh(f(ys[0]), xs[0])} = ${f(k)}, and every pair gives the same: ${mm('y')} = ${f(k)}${mm('x')}.`, {visual: V7.table(xs, ys.map(f))});
    return choiceFixed(`Is ${mm('y')} proportional to ${mm('x')}? Check ${fh(mm('y'), mm('x'))}.`, PN, prop ? 0 : 1,
      prop ? `${fh(mm('y'), mm('x'))} is ${f(k)} for every pair, so it is proportional.` : `${fh(mm('y'), mm('x'))} gives ${rat.join(', ')}: not constant, so not proportional.`, {visual: V7.table(xs, ys.map(f))}); } },
  c: { t: 'y = kx vs y = mx + b', g: (R) => { const [p, q] = R.pick(SLOPES.filter(s => s[0] > 0)), b = nz(R, 1, 9), t = R.bool(0.55);
    if (t) return choice(R, 'Which equation shows a proportional relationship?', yeq(p, q, 0), [yeq(p, q, b), yeq(1, 1, b), `${mm('y')} = ${b}`], `Proportional means ${mm('y = kx')}: no constant added. ${yeq(p, q, 0)} passes through (0, 0); the others don't.`);
    const prop = R.bool(), e = yeq(p, q, prop ? 0 : (R.bool() ? b : -b));
    return choiceFixed(`Is ${e} proportional?`, PN, prop ? 0 : 1, prop ? `It has the form ${mm('y = kx')} with ${mm('k')} = ${qh(p, q)}.` : `It is linear, but the constant term means it misses the origin: at ${mm('x')} = 0, ${mm('y')} is not 0.`); } },
  d: { t: 'classify from words', g: (R, O) => { const P = R.int(2, 12), F = R.int(2, 9), S = R.pick([40, 50, 60, 80]), u = O.units === 'imperial' ? ['miles', 'mph', 'lb', 'inches'] : ['km', 'km/h', 'kg', 'cm'];
    const T = [[`Apples cost ${money(O, P)} per ${u[2]}. Cost vs ${u[2]} bought.`, 0], [`A car drives at ${S} ${u[1]}. Distance vs time.`, 0], [`Each ticket costs ${money(O, P)}. Total cost vs number of tickets.`, 0],
      [`You earn ${money(O, P)} an hour. Pay vs hours worked.`, 0], [`A recipe uses ${F} eggs per cake. Eggs vs cakes.`, 0],
      [`A taxi charges ${money(O, F)} plus ${money(O, P)} per ${u[0].replace(/s$/, '')}. Fare vs distance.`, 1], [`A plant is ${F} ${u[3]} tall and grows ${P > 5 ? 2 : P} ${u[3]} a week. Height vs weeks.`, 1],
      [`A gym charges a ${money(O, F * 5)} joining fee plus ${money(O, P)} a visit. Cost vs visits.`, 1], [`A candle is ${F + 20} ${u[3]} tall and burns ${1 + F % 3} ${u[3]} an hour. Height vs hours.`, 1],
      [`A phone plan costs ${money(O, F * 3)} a month plus ${money(O, P)} per GB. Bill vs GB used.`, 1]];
    const [txt, a] = R.pick(T);
    return choiceFixed(`${txt} Is it proportional?`, PN, a, a === 0 ? 'Zero of the input gives zero, and doubling the input doubles the output: proportional.' : 'There is a starting amount (a fee or a start value), so 0 of the input doesn’t give 0. Not proportional, even though it is linear.'); } },
}});

/* ---------- III.7.08 Linear vs nonlinear ---------- */
const LN = ['Linear', 'Nonlinear'];
const diffs = a => a.slice(1).map((v, i) => v - a[i]);
E3.skill({ id: 'III.7.08', name: 'Linear vs nonlinear', steps: {
  a: { t: 'constant differences in a table', g: (R) => { const t = R.int(0, 3), b = R.int(-3, 6), mm1 = R.int(2, 5); let xs = [0, 1, 2, 3, 4], ys, lin;
    if (t === 0) { ys = xs.map(x => mm1 * x + b); lin = true; }
    else if (t === 1) { const c = R.int(1, 3); ys = R.bool() ? xs.map(x => c * x * x + b) : xs.map(x => c * 2 ** x + b); lin = false; }
    else if (t === 2) { xs = R.pick([[0, 1, 3, 4, 6], [1, 2, 4, 5, 8], [0, 2, 3, 5, 6]]); ys = xs.map((_, i) => mm1 * i + b); lin = false; }
    else { xs = R.pick([[0, 1, 3, 4, 6], [1, 2, 4, 5, 8], [0, 2, 3, 5, 6]]); ys = xs.map(x => mm1 * x + b); lin = true; }
    const dx = diffs(xs), dy = diffs(ys), even = dx.every(d => d === dx[0]);
    const ex = even ? `${mm('x')} goes up by ${dx[0]} each time; ${mm('y')} changes by ${dy.join(', ')}. ${lin ? 'Constant' : 'Not constant'}, so ${lin ? 'linear' : 'nonlinear'}.`
      : `The ${mm('x')} steps are ${dx.join(', ')}, not equal, so compare each ${mm('y')} change with its ${mm('x')} step: ${dy.map((d, i) => qh(d, dx[i])).join(', ')}. ${lin ? 'All equal: linear.' : 'Not all equal: nonlinear.'}`;
    return choiceFixed('Is the relationship in the table linear?', LN, lin ? 0 : 1, ex, {visual: V7.table(xs, ys)}); } },
  b: { t: 'straight vs curved graphs', g: (R) => { const k = R.int(0, 5), a = R.pick([1, -1]), c = R.int(-2, 2), sl = R.pick([0.5, 1, 2, -1, -0.5, -2]);
    const G = [[{fn: x => a * (x * x / 3) + c - a * 2}, false], [{fn: x => a * Math.abs(x) - a * 2 + c}, false], [{fn: x => 4 / x}, false], [{fn: x => 2 ** (x / 1.5) - 3}, false],
      [{fn: x => sl * x + c}, true], [{fn: x => (x * x * x) / 20 + c}, false]];
    let g = G[k]; if (R.bool(0.35)) g = G[4];
    return choiceFixed('Is the relationship shown linear?', LN, g[1] ? 0 : 1, g[1] ? 'The graph is one straight line: linear.' : 'The graph is not one straight line (it curves or bends), so it is nonlinear.', {visual: V7.plane({curves: [g[0]]})}); } },
  c: { t: 'spot nonlinear equations', g: (R) => { const a = R.int(2, 6), b = nz(R, -6, 8), c = R.int(2, 9);
    const NL = [`${mm('y')} = ${H(`x^2+${a}`)}`, `${mm('y')} = ${fh(c, mm('x'))}`, `${mm('y')} = ${m('2^x')}`, `${mm('y')} = ${m('x^3')}`, `${mm('y')} = √${mm('x')} + ${a}`, `${mm('y')} = ${mm('x')}(${H(`x+${a}`)})`];
    const LI = [yeq(a, 1, b), `${mm('y')} = ${f(c)} − ${a}${mm('x')}`, `${mm('y')} = ${fh(mm('x'), a)} + ${c}`, `${H(`${a}x+y`)} = ${c}`, `${mm('y')} = ${f(b)}`, `${mm('y')} = ${a}(${H(`x+${c}`)})`];
    if (R.bool(0.6)) return choice(R, 'Which equation is NOT linear?', R.pick(NL), R.sample(LI, 3), `In a linear equation ${mm('x')} appears only to the first power: not squared, cubed, under a root, in a denominator or an exponent.`);
    return choice(R, 'Which equation is linear?', R.pick(LI), R.sample(NL, 3), `It can be written as ${mm('y = mx + b')}: ${mm('x')} only to the first power. The others square, cube, root, divide by or raise to ${mm('x')}.`); } },
  d: { t: 'justify the choice', g: (R) => { const lin = R.bool(), b = R.int(0, 5), p = R.int(2, 5), xs = [0, 1, 2, 3, 4], sq = R.bool(), ys = lin ? xs.map(x => p * x + b) : sq ? xs.map(x => x * x + b) : xs.map(x => 2 ** x + b), dy = diffs(ys);
    if (lin) return choice(R, 'Is the table linear? Pick the correct answer and reason.', `Linear: ${mm('y')} goes up ${p} each time ${mm('x')} goes up 1`,
      [`Linear: the ${mm('y')}-values get bigger`, `Nonlinear: ${mm('y')} is not a multiple of ${mm('x')}`, `Nonlinear: the table does not start at ${mm('y')} = 0`], `The changes in ${mm('y')} are ${dy.join(', ')}: equal steps, so linear. “Getting bigger” alone doesn't show that.`, {visual: V7.table(xs, ys)});
    return choice(R, 'Is the table linear? Pick the correct answer and reason.', `Nonlinear: the changes in ${mm('y')} are ${dy.join(', ')}`,
      [`Linear: the ${mm('y')}-values get bigger`, `Linear: ${mm('x')} goes up 1 each time`, `Nonlinear: the table starts at ${mm('y')} = ${ys[0]}`], `Equal ${mm('x')} steps give changes ${dy.join(', ')} in ${mm('y')}: not constant, so nonlinear.`, {visual: V7.table(xs, ys)}); } },
}});

/* ---------- III.7.09 Functions ---------- */
const FN = ['Function', 'Not a function'];
V7.map = (ins, outs, arrows) => {
  const W = 330, rh = 34, n = Math.max(ins.length, outs.length), H = n * rh + 40, xl = 70, xr = 260; let b = '';
  b += `<ellipse cx="${xl}" cy="${H / 2}" rx="42" ry="${H / 2 - 4}" fill="${C.faint}" stroke="${C.ink}" stroke-width="1.5"/><ellipse cx="${xr}" cy="${H / 2}" rx="42" ry="${H / 2 - 4}" fill="${C.faint}" stroke="${C.ink}" stroke-width="1.5"/>`;
  const yi = (i, k) => H / 2 + (i - (k - 1) / 2) * rh;
  arrows.forEach(([i, j]) => { const x1 = xl + 18, y1 = yi(i, ins.length), x2 = xr - 20, y2 = yi(j, outs.length), a = Math.atan2(y2 - y1, x2 - x1);
    b += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${C.blue}" stroke-width="2"/><polygon points="${x2},${y2} ${x2 - 10 * Math.cos(a) + 5 * Math.sin(a)},${y2 - 10 * Math.sin(a) - 5 * Math.cos(a)} ${x2 - 10 * Math.cos(a) - 5 * Math.sin(a)},${y2 - 10 * Math.sin(a) + 5 * Math.cos(a)}" fill="${C.blue}"/>`; });
  ins.forEach((v, i) => b += V.text(xl, yi(i, ins.length), lab7(v), {size: 16, weight: 600}));
  outs.forEach((v, j) => b += V.text(xr, yi(j, outs.length), lab7(v), {size: 16, weight: 600}));
  const head = V.text(xl, 10, 'input', {size: 13, fill: C.muted}) + V.text(xr, 10, 'output', {size: 13, fill: C.muted});
  return V.svg(W, H + 20, head + `<g transform="translate(0 20)">${b}</g>`, 'mapping diagram');
};
const lab7 = v => String(v).replace(/^-/, '−');
const CTX9 = [['a student', 'their date of birth', 1], ['a date', 'the students born on that date', 0], ['a time of day', 'the temperature outside', 1], ['a temperature', 'the times of day it was that warm', 0],
  ['a person', 'their height', 1], ['a height', 'the people who are that tall', 0], ['a book', 'its number of pages', 1], ['a number of pages', 'the books with that many pages', 0],
  ['a number', 'its square', 1], ['a positive number', 'the numbers that square to it', 0], ['a number of tickets', 'their total cost at a fixed price', 1], ['a country', 'its capital city', 1],
  ['a first name', 'the phone numbers of people with that name', 0], ['a car', 'its number plate', 1], ['a shoe size', 'the people who wear it', 0], ['a day', 'the rainfall that day', 1],
  ['an amount of rainfall', 'the days with that much rain', 0], ['a side length of a square', 'its area', 1], ['a class', 'the students in it', 0], ['a distance in km', 'the same distance in miles', 1],
  ['a month of the year', 'its number of days (not a leap year)', 1], ['a word', 'its first letter', 1], ['a student', 'their seat number in class', 1], ['a price in dollars', 'the same price in cents', 1], ['a time in hours', 'the same time in minutes', 1],
  ['a letter of the alphabet', 'the words that start with it', 0], ['a birthday month', 'the students born in that month', 0], ['a color', 'the fruits that are that color', 0], ['a number of wheels', 'the vehicles with that many wheels', 0], ['a test score', 'the students who got that score', 0]];
E3.skill({ id: 'III.7.09', name: 'Functions', steps: {
  a: { t: 'one output per input', g: (R) => { const xs = R.distinct(-3, 9, 4), fn = R.bool(), ys = xs.map(() => R.int(-5, 9));
    if (R.bool(0.5)) ys[2] = ys[0];
    let pairs = xs.map((x, i) => [x, ys[i]]); if (!fn) { const k = R.int(0, 3); let y; do { y = R.int(-5, 9); } while (y === pairs[k][1]); pairs[(k + 1 + R.int(0, 2)) % 4] = [pairs[k][0], y]; }
    pairs = R.shuffle(pairs); const seen = {}; let dup = null; pairs.forEach(([x, y]) => { if (seen[x] !== undefined && seen[x] !== y) dup = x; seen[x] = y; });
    const isF = dup === null, sameY = new Set(pairs.map(q => q[1])).size < pairs.length;
    return choiceFixed(`Is this set of pairs a function? ${pairs.map(q => pt(...q)).join(', ')}`, FN, isF ? 0 : 1,
      isF ? `Each input ${mm('x')} has exactly one output.${sameY ? ' Two inputs may share an output; that is fine.' : ''}` : `The input ${f(dup)} has two different outputs, so it is not a function.`); } },
  b: { t: 'mapping diagrams', g: (R) => { const ins = R.distinct(-3, 9, R.int(3, 4)).sort((a, b) => a - b), outs = R.distinct(-5, 12, R.int(2, 4)).sort((a, b) => a - b), fn = R.bool();
    const arrows = ins.map((_, i) => [i, R.int(0, outs.length - 1)]); let k = -1;
    if (!fn) { k = R.int(0, ins.length - 1); let j; do { j = R.int(0, outs.length - 1); } while (j === arrows[k][1]); arrows.push([k, j]); }
    const shared = new Set(arrows.map(a => a[1])).size < arrows.length && fn;
    return choiceFixed('Does the mapping diagram show a function?', FN, fn ? 0 : 1, fn ? `Every input has exactly one arrow.${shared ? ' Two arrows may point to the same output.' : ''}` : `The input ${lab7(ins[k])} has two arrows, so two outputs: not a function.`,
      {visual: V7.map(ins, outs, arrows)}); } },
  c: { t: 'vertical line test', g: (R) => { const a = R.int(-2, 2), c = R.int(-2, 2), k = R.int(0, 7), T = [];
    const circ = r => Array.from({length: 181}, (_, i) => [a + r * Math.cos(i * Math.PI / 90), c + r * Math.sin(i * Math.PI / 90)]);
    const G = [[{fn: x => (x - a) * (x - a) / 3 + c - 3}, 1], [{fn: x => -Math.abs(x - a) + c + 3}, 1], [{fn: x => (x - a) ** 3 / 15 + c}, 1], [{fn: x => x + c}, 1],
      [{pts: circ(R.int(2, 4))}, 0], [{pts: Array.from({length: 241}, (_, i) => { const y = -6 + i * 0.05; return [(y - c) * (y - c) / 3 + a - 3, y]; })}, 0],
      [{pts: [[a + 0.001, -6], [a, 6]]}, 0], [{pts: Array.from({length: 241}, (_, i) => { const y = -6 + i * 0.05; return [Math.abs(y - c) + a - 3, y]; })}, 0]];
    const g = G[k]; if (k === 3) { const sl = R.pick([0.5, -1, 2]); g[0] = {fn: x => sl * x + c}; }
    return choiceFixed('Is the graph a function?', FN, g[1] ? 0 : 1, g[1] ? 'Every vertical line crosses the graph at most once, so each input has one output.' : 'Some vertical line crosses the graph more than once, so some input has two outputs: not a function.',
      {visual: V7.plane({curves: [g[0]]})}); } },
  d: { t: 'function or not from context', g: (R) => { const [i, o, yes] = R.pick(CTX9);
    return choiceFixed(`Input: ${i}. Output: ${o}. Is this a function?`, FN, yes ? 0 : 1, yes ? 'Each input gives exactly one output.' : 'One input can give more than one output, so it is not a function.'); } },
}});

/* ---------- III.7.10 Compare functions ---------- */
const ABS = ['A', 'B', 'Same'];
E3.skill({ id: 'III.7.10', name: 'Compare functions', steps: {
  a: { t: 'compare two rates', g: (R, O) => { const t = R.int(0, 1);
    if (t === 0) { const m1 = R.int(1, 7), m2 = R.bool(0.15) ? m1 : R.int(1, 7), b1 = R.int(-5, 9), b2 = R.int(-5, 9), ans = m1 > m2 ? 0 : m2 > m1 ? 1 : 2;
      return choiceFixed(`A: ${yeq(m1, 1, b1)}. B: ${yeq(m2, 1, b2)}. Which has the greater rate of change?`, ABS, ans, `The rate is the slope: A has ${f(m1)}, B has ${f(m2)}. ${ans === 2 ? 'They are equal.' : `${'AB'[ans]} is greater.`} The intercepts don't matter.`); }
    const km = O.units === 'imperial' ? 'miles' : 'km', h1 = R.int(2, 5), h2 = R.int(2, 5); const r1 = R.pick([30, 40, 45, 50, 60, 70]), r2 = R.pick([30, 40, 45, 50, 60, 70]);
    const ans = r1 > r2 ? 0 : r2 > r1 ? 1 : 2;
    return choiceFixed(`Car A goes ${r1 * h1} ${km} in ${h1} hours. Car B goes ${r2 * h2} ${km} in ${h2} hours. Which has the greater rate (speed)?`, ABS, ans, `A: ${r1 * h1} ÷ ${h1} = ${r1} ${km} per hour. B: ${r2 * h2} ÷ ${h2} = ${r2} ${km} per hour.${ans === 2 ? ' The same.' : ''} Compare rates, not totals.`); } },
  b: { t: 'compare starting values', g: (R) => { const m1 = nz(R, -3, 5), b1 = R.int(-6, 10), m2 = nz(R, -3, 5); let b2 = R.int(-6, 10); if (R.bool(0.12)) b2 = b1;
    const xs = [1, 2, 3], ys = xs.map(x => m2 * x + b2), ans = b1 > b2 ? 0 : b2 > b1 ? 1 : 2, vis = {visual: V7.table(xs, ys)};
    const ex = `A starts at ${f(b1)} (its ${mm('y')}-intercept). In the table ${mm('y')} changes by ${f(m2)} per step, so at ${mm('x')} = 0, ${mm('y')} = ${f(ys[0])} − ${pn(m2)} = ${f(b2)}.`;
    if (R.bool(0.4)) return num(`Function B is in the table. What is its starting value (${mm('y')} when ${mm('x')} = 0)?`, b2, ex.replace(/^A starts at [^.]*\. /, ''), vis);
    return choiceFixed(`A: ${yeq(m1, 1, b1)}. B is in the table. Which has the greater starting value?`, ABS, ans, ex + (ans === 2 ? ' The same.' : ` ${'AB'[ans]} starts higher.`), vis); } },
  c: { t: 'across table, graph and equation', g: (R) => { const [p, q] = R.pick(SLOPES), b = R.int(-3, 3), ask = R.bool() ? 'rate' : 'start', t = R.bool();
    let m2 = R.pick([-3, -2, -1, 1, 2, 3, 4]), b2 = R.int(-5, 6); if (ask === 'rate' && m2 === p / q) m2 += 1; if (ask === 'start' && b2 === b) b2 += 1;
    const A = ask === 'rate' ? p / q : b, B = ask === 'rate' ? m2 : b2, ans = A > B ? 0 : 1, xs = [0, 1, 2, 3];
    const Bdesc = t ? `B: ${yeq(m2, 1, b2)}.` : 'B is in the table.', vis = t ? V7.plane({lines: [{m: p / q, b}]}) : V.side([V7.plane({lines: [{m: p / q, b}], size: 22}), V7.table(xs, xs.map(x => m2 * x + b2), {cw: 44, hw: 40})], {gap: 16});
    return choiceFixed(`A is the graph. ${Bdesc} Which has the greater ${ask === 'rate' ? 'rate of change' : `${mm('y')}-intercept`}?`, ['A', 'B'], ans,
      `A: slope ${qh(p, q)}, intercept ${f(b)}. B: slope ${f(m2)}, intercept ${f(b2)}. ${'AB'[ans]} has the greater ${ask === 'rate' ? 'rate' : 'intercept'}.`, {visual: vis}); } },
  d: { t: 'decide which grows faster', g: (R) => { const m1 = R.int(1, 3), m2 = m1 + R.int(1, 4), xs = R.int(2, 9), b2 = R.int(0, 6), b1 = b2 + (m2 - m1) * xs;
    const F = `${mm('f')}(${mm('x')}) = ${mxbH(m1, 1, b1)}`, G = `${mm('g')}(${mm('x')}) = ${mxbH(m2, 1, b2)}`;
    if (R.bool(0.25)) return choiceFixed(`${F} and ${G}. Which is larger when ${mm('x')} = 0?`, [mm('f'), mm('g')], 0, `At ${mm('x')} = 0 each is just its starting value: ${mm('f')}(0) = ${b1} and ${mm('g')}(0) = ${b2}. ${mm('f')} starts ahead, even though ${mm('g')} grows faster and passes it at ${mm('x')} = ${xs}.`);
    if (R.bool(0.34)) return choiceFixed(`${F} and ${G}. Which is larger when ${mm('x')} = 100?`, [mm('f'), mm('g')], 1, `${mm('g')} grows ${m2} per step, ${mm('f')} only ${m1}. ${mm('f')} starts ahead, but ${mm('g')} catches up at ${mm('x')} = ${xs} and stays ahead: ${m2 * 100 + b2} vs ${m1 * 100 + b1}.`);
    return num(`${F} and ${G}. For what ${mm('x')} are they equal?`, xs, `${mxbH(m1, 1, b1)} = ${mxbH(m2, 1, b2)}, so ${b1 - b2} = ${m2 - m1 === 1 ? '' : m2 - m1}${mm('x')} and ${mm('x')} = ${xs}. After that the faster one, ${mm('g')}, is ahead.`); } },
}});

/* ---------- III.7.11 Describe graphs qualitatively ---------- */
// piecewise graph: levels[0..n]; o.letters puts A.. over pieces
V7.story = (lv, o = {}) => {
  const W = o.w || 380, H = o.h || 200, L0 = 40, B0 = H - 30, T0 = 22, R0 = W - 14, n = lv.length - 1, top = Math.max(5, ...lv);
  const X = i => L0 + (R0 - L0) * i / n, Y = v => B0 - (B0 - T0) * v / top; let b = '';
  b += `<line x1="${L0}" y1="${B0}" x2="${R0 + 6}" y2="${B0}" stroke="${C.ink}" stroke-width="2"/><line x1="${L0}" y1="${B0}" x2="${L0}" y2="${T0 - 12}" stroke="${C.ink}" stroke-width="2"/>`;
  b += `<polygon points="${R0 + 10},${B0} ${R0 + 2},${B0 - 5} ${R0 + 2},${B0 + 5}" fill="${C.ink}"/><polygon points="${L0},${T0 - 16} ${L0 - 5},${T0 - 8} ${L0 + 5},${T0 - 8}" fill="${C.ink}"/>`;
  b += V.text((L0 + R0) / 2, H - 10, o.xl || 'time', {size: o.fs || 13, fill: C.muted}) + `<text x="16" y="${(T0 + B0) / 2}" font-size="${o.fs || 13}" fill="${C.muted}" text-anchor="middle" dominant-baseline="central" transform="rotate(-90 16 ${(T0 + B0) / 2})">${V.esc(o.yl || '')}</text>`;
  b += `<polyline points="${lv.map((v, i) => X(i) + ',' + Y(v)).join(' ')}" fill="none" stroke="${C.blue}" stroke-width="3" stroke-linejoin="round"/>`;
  if (o.letters) for (let i = 0; i < n; i++) { const xm = (X(i) + X(i + 1)) / 2, ym = Math.min(Y(lv[i]), Y(lv[i + 1])) - 16; b += V.text(xm, Math.max(12, ym), 'ABCDEF'[i], {size: 15, weight: 700}); }
  return V.svg(W, H, b, 'graph');
};
const QTY = [['distance from home', 'the distance from home'], ['water in a tank', 'the amount of water'], ['height of a balloon', 'the height'], ['money saved', 'the money saved']];
const STEP = {up: 1, up2: 2, flat: 0, down: -1, down2: -2};
// levels from a list of moves, or null if it goes below 0
const levelsOf = (moves, start = 0) => { const lv = [start]; for (const mv of moves) { const v = lv[lv.length - 1] + STEP[mv]; if (v < 0) return null; lv.push(v); } return lv; };
const pickMoves = (R, n, ok) => { for (let i = 0; i < 400; i++) { const mv = Array.from({length: n}, () => R.pick(['up', 'up2', 'flat', 'down', 'down2'])), lv = levelsOf(mv, R.int(0, 1)); if (lv && ok(mv)) return {mv, lv}; } return null; };
const kind = mv => STEP[mv] > 0 ? 'up' : STEP[mv] < 0 ? 'down' : 'flat';
const STORY = {
  home: {up: 'walks away from home', up2: 'cycles quickly away from home', flat: 'stops at a shop', down: 'walks back toward home', down2: 'cycles quickly back toward home', yl: 'distance from home'},
  tank: {up: 'fills slowly', up2: 'fills quickly', flat: 'stays at the same level', down: 'drains slowly', down2: 'drains quickly', yl: 'water in tank'},
};
E3.skill({ id: 'III.7.11', name: 'Describe graphs qualitatively', steps: {
  a: { t: 'increasing and decreasing parts', g: (R) => { const want = R.pick(['up', 'down']), Q = R.pick(QTY);
    const g = pickMoves(R, 4, mv => mv.filter(z => kind(z) === want).length === 1);
    const k = g.mv.findIndex(z => kind(z) === want);
    return choiceFixed(`The graph shows ${Q[1]} over time. In which part is it ${want === 'up' ? 'increasing' : 'decreasing'}?`, ['A', 'B', 'C', 'D'], k, `Read left to right: part ${'ABCD'[k]} goes ${want === 'up' ? 'up, so it is increasing' : 'down, so it is decreasing'}. Flat parts show no change.`,
      {visual: V7.story(g.lv, {letters: true, yl: Q[0]})}); } },
  b: { t: 'flat parts mean no change', g: (R) => { const Q = R.pick(QTY), g = pickMoves(R, 4, mv => mv.filter(z => z === 'flat').length === 1), k = g.mv.indexOf('flat');
    if (R.bool(0.5)) return choiceFixed(`The graph shows ${Q[1]} over time. In which part does it not change?`, ['A', 'B', 'C', 'D'], k, `Part ${'ABCD'[k]} is flat: time passes but ${Q[1]} stays the same.`, {visual: V7.story(g.lv, {letters: true, yl: Q[0]})});
    return choice(R, `The graph shows ${Q[1]} over time. What happens in part ${'ABCD'[k]}?`, 'It stays the same', ['It increases', 'It decreases', 'It drops to zero'], `Flat means no change: ${Q[1]} stays the same while time passes.`, {visual: V7.story(g.lv, {letters: true, yl: Q[0]})}); } },
  c: { t: 'sketch a graph from a story', g: (R) => { const S = STORY[R.pick(['home', 'tank'])], nm = R.pick(['Maya', 'Leo', 'Ana', 'Tom']);
    const g = pickMoves(R, 3, mv => new Set(mv).size === 3); const alts = [];
    for (let i = 0; i < 200 && alts.length < 3; i++) { const h = pickMoves(R, 3, mv => mv.join() !== g.mv.join() && !alts.some(a => a.mv.join() === mv.join())); if (h) alts.push(h); }
    const all = R.shuffle([g, ...alts]), ans = all.indexOf(g), who = S === STORY.home ? `${nm} ` : 'A tank ';
    const txt = g.mv.map(mv => S[mv]).join(', then ');
    const grid = all.map((z, i) => V.side([{svg: V7.story(z.lv, {w: 220, h: 130, yl: S.yl, fs: 11}), caption: 'ABCD'[i]}]));
    return choiceFixed(`${who}${txt}. Which graph shows this?`, ['A', 'B', 'C', 'D'], ans, `Match each part: ${g.mv.map(mv => ({up: 'gentle rise', up2: 'steep rise', flat: 'flat', down: 'gentle fall', down2: 'steep fall'})[mv]).join(', ')}. Steeper means faster.`,
      {visual: V.stack([V.side([grid[0], grid[1]], {gap: 20}), V.side([grid[2], grid[3]], {gap: 20})], {gap: 14})}); } },
  d: { t: 'tell a story from a graph', g: (R) => { const home = R.bool(), S = home ? STORY.home : STORY.tank, who = home ? 'Someone ' : 'The tank ';
    const dc = mv => mv.every((z, i) => !i || z !== mv[i - 1]), g = pickMoves(R, 3, mv => new Set(mv.map(kind)).size >= 2 && dc(mv));
    const say = mv => mv.map(z => S[z]).join(', then '), wrong = [];
    for (let i = 0; i < 100 && wrong.length < 2; i++) { const h = pickMoves(R, 3, mv => mv.join() !== g.mv.join() && dc(mv)); if (h && !wrong.includes(say(h.mv)) && say(h.mv) !== say(g.mv)) wrong.push(say(h.mv)); }
    if (home) wrong.push('walks up a hill, then down the other side');
    return choice(R, `The graph shows ${home ? 'distance from home' : 'the water in a tank'} over time. Which story fits?`, who + say(g.mv), wrong.map(w => (w.startsWith('walks up') ? 'Someone ' : who) + w),
      `Read each part left to right: up means ${home ? 'moving away' : 'filling'}, flat means no change, down means ${home ? 'coming back' : 'draining'}; steeper means faster.${home ? ' The graph is not a picture of the route: it shows distance, not hills.' : ''}`, {visual: V7.story(g.lv, {yl: S.yl})}); } },
}});

/* ---------- III.7.12 Linear models ---------- */
const MODEL = (R, O) => { const k = R.int(0, 5), u = O.units === 'imperial' ? {cm: 'inches', km: 'mile', kms: 'miles', L: 'gal'} : {cm: 'cm', km: 'km', kms: 'km', L: 'L'};
  if (k === 0) { const g = R.pick([1.5, 2, 2.5, 3, 0.5]), h0 = R.int(2, 12); return {y: 'h', x: 'w', m: g, b: h0, sit: `A plant is ${h0} ${u.cm} tall and grows ${f(g)} ${u.cm} a week.`, yw: `its height in ${u.cm}`, xw: 'weeks',
    rate: `The plant grows ${f(g)} ${u.cm} each week`, start: `The plant was ${h0} ${u.cm} tall at the start`, lo: 0, hi: 20, big: 1000, bigMsg: 'plants stop growing; the model only fits the weeks it was measured'}; }
  if (k === 1) { const P = R.pick([2, 3, 1.5, 2.5]), F = R.int(2, 6); return {y: 'C', x: 'k', m: P, b: F, sit: `A taxi charges a ${money(O, F)} fee plus ${money(O, P)} per ${u.km}.`, yw: `the fare in ${cur(O)}`, xw: u.kms,
    rate: `Each ${u.km} costs ${money(O, P)}`, start: `The fixed fee is ${money(O, F)}`, lo: 0, hi: 30}; }
  if (k === 2) { const r = R.int(2, 8), V0 = r * R.int(10, 25); return {y: 'V', x: 't', m: -r, b: V0, sit: `A tank holds ${V0} ${u.L} and drains ${r} ${u.L} a minute.`, yw: `the water left in ${u.L}`, xw: 'minutes',
    rate: `The tank loses ${r} ${u.L} each minute`, start: `The tank held ${V0} ${u.L} at the start`, lo: 0, hi: V0 / r, big: V0 / r + R.int(5, 20), bigMsg: `a tank can't hold less than 0 ${u.L}`}; }
  if (k === 3) { const D = R.int(3, 15), M = R.int(10, 60); return {y: 'S', x: 'w', m: D, b: M, sit: `Ana has ${money(O, M)} and saves ${money(O, D)} a week.`, yw: `her savings in ${cur(O)}`, xw: 'weeks',
    rate: `Ana saves ${money(O, D)} each week`, start: `Ana had ${money(O, M)} at the start`, lo: 0, hi: 52}; }
  if (k === 4) { const b = R.pick([2, 3, 4]), L0 = b * R.int(6, 12); return {y: 'L', x: 'h', m: -b, b: L0, sit: `A candle is ${L0} ${u.cm} tall and burns ${b} ${b === 1 && u.cm === 'inches' ? 'inch' : u.cm} an hour.`, yw: `its height in ${u.cm}`, xw: 'hours',
    rate: `The candle gets ${b} ${u.cm} shorter each hour`, start: `The candle was ${L0} ${u.cm} tall at the start`, lo: 0, hi: L0 / b, big: L0 / b + R.int(3, 10), bigMsg: `a candle can't be shorter than 0 ${u.cm}`}; }
  const F = R.int(8, 25), P = R.int(2, 6); return {y: 'B', x: 'g', m: P, b: F, sit: `A phone plan costs ${money(O, F)} a month plus ${money(O, P)} per GB.`, yw: `the bill in ${cur(O)}`, xw: 'GB',
    rate: `Each GB costs ${money(O, P)}`, start: `The monthly fee is ${money(O, F)}`, lo: 0, hi: 40};
};
const mA = M => M.m < 0 ? `${M.b}-${-M.m}${M.x}` : `${f(M.m)}${M.x}+${M.b}`;
const mH = M => M.m < 0 ? `${mm(M.y)} = ${M.b} − ${M.m === -1 ? '' : -M.m}${mm(M.x)}` : `${mm(M.y)} = ${M.m === 1 ? '' : f(M.m)}${mm(M.x)} + ${M.b}`;
E3.skill({ id: 'III.7.12', name: 'Linear models', steps: {
  a: { t: 'build a model from a situation', g: (R, O) => { const M = MODEL(R, O);
    return num(`${M.sit} Write ${mm(M.y)}, ${M.yw}, after ${mm(M.x)} ${M.xw}.`, [{label: `${M.y} =`, expr: mA(M), form: 'any'}], `Start value ${M.b}, then ${M.m < 0 ? 'minus' : 'plus'} ${f(Math.abs(M.m))} for each of the ${mm(M.x)} ${M.xw}: ${mH(M)}.`); } },
  b: { t: 'interpret slope in context', g: (R, O) => { const M = MODEL(R, O);
    return choice(R, `${M.sit} The model is ${mH(M)}. What does ${f(Math.abs(M.m))} tell you?`, M.rate, [M.start, `${M.yw[0].toUpperCase() + M.yw.slice(1)} after 1 ${M.xw === 'inches' ? 'inch' : M.xw.replace(/s$/, '')}`, `The number of ${M.xw}`],
      `${f(M.m)} multiplies ${mm(M.x)}: it is the change in ${mm(M.y)} for each 1 ${M.xw.replace(/s$/, '')}, the rate. ${M.b} is the starting value.`); } },
  c: { t: 'interpret intercept in context', g: (R, O) => { if (R.bool(0.3)) { const a = R.int(5, 7), g = R.int(5, 7), b = R.int(75, 90);
      return choice(R, `For children aged ${a} to 12, a model for height is ${mm('h')} = ${g}${mm('a')} + ${b} (cm, age ${mm('a')} in years). What does ${b} mean?`, `The model's height at age 0: outside the data, so it may not mean anything real`,
        [`Every newborn is ${b} cm long`, `Children grow ${b} cm a year`, `The average height of a ${a}-year-old`], `${b} is ${mm('h')} when ${mm('a')} = 0. The model was built from ages ${a} to 12, and newborns are much shorter: this intercept means nothing real.`); }
    const M = MODEL(R, O);
    return choice(R, `${M.sit} The model is ${mH(M)}. What does ${M.b} tell you?`, M.start, [M.rate, `The value after ${M.b} ${M.xw}`, `The number of ${M.xw}`],
      `${M.b} is ${mm(M.y)} when ${mm(M.x)} = 0: the starting value.`); } },
  d: { t: 'predict and check reasonableness', g: (R, O) => { let M = MODEL(R, O);
    if (R.bool(0.35)) { for (let i = 0; i < 20 && !M.big; i++) M = MODEL(R, O); const X = M.big, Y = M.m * X + M.b;
      return choice(R, `${M.sit} Using ${mH(M)} for ${mm(M.x)} = ${X} gives ${mm(M.y)} = ${f(Y)}. Is that reasonable?`, `No: ${M.bigMsg}`, ['Yes: the model says so', 'Yes: the slope is constant', `No: ${mm(M.x)} can't be bigger than ${M.b}`],
        `A model only fits the situation it came from. Here ${M.bigMsg}.`); }
    const X = Math.max(1, R.int(M.lo + 1, Math.floor(M.hi))), Y = M.m * X + M.b;
    return num(`${M.sit} Use ${mH(M)} to predict ${mm(M.y)} when ${mm(M.x)} = ${X}.`, Y, `${mm(M.y)} = ${M.m < 0 ? `${M.b} − ${-M.m} × ${X}` : `${f(M.m)} × ${X} + ${M.b}`} = ${f(Y)}. ${Y >= 0 ? 'That fits the situation.' : ''}`); } },
}});

})();

/* Era III · Unit III.8 Geometry: angles, area, volume, Pythagoras, moves (III.8.01 – III.8.23)
   Drawing helpers live in V8 (all figures drawn to their numbers). */
(function(){ const {fh, fmt, m, V, C} = E3;
const dots = q => { q.prompt = q.prompt.replace(/\.\./g, '.'); q.explain = q.explain.replace(/\.\./g, '.'); return q; };
const num = (...a) => dots(E3.num(...a)), choice = (...a) => dots(E3.choice(...a)), choiceFixed = (...a) => dots(E3.choiceFixed(...a)), tf = (...a) => dots(E3.tf(...a));
const frac = E3.frac;
const X = '×', M = '−', D = '°', PI = 'π';
const P1 = v => Math.round(v * 10) / 10;
const rad = d => d * Math.PI / 180;
const again = (id, k, R, O) => E3.byId[id].steps[k].g(R, O);
const yn = (p, yes, e, x) => choiceFixed(p, ['Yes', 'No'], yes ? 0 : 1, e, x);
const metric = O => O.units !== 'imperial';
const UL = O => metric(O) ? {s: 'cm', b: 'm'} : {s: 'in', b: 'ft'};
const sg = n => n < 0 ? M + Math.abs(n) : String(n);                 // signed number text
const pt = (x, y) => `(${sg(x)}, ${sg(y)})`;                         // coordinate text
const dp1 = v => Math.round(v * 10) / 10;
const f3 = v => fmt(Math.round(v * 1000) / 1000);
// linear expression text: lin(2,10) → "2x + 10"
const lin = (p, q, v = 'x') => `${p === 1 ? '' : p}${v}${q ? (q < 0 ? ' − ' + (-q) : ' + ' + q) : ''}`;
const deg = s => `${s}${D}`;
const isSq = n => Number.isInteger(Math.sqrt(n));
const TRIPLES = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15], [7, 24, 25], [12, 16, 20], [20, 21, 29], [10, 24, 26], [15, 20, 25], [9, 40, 41], [12, 35, 37]];
const SMALLTRI = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [9, 12, 15], [8, 15, 17], [12, 16, 20]];

/* =================== Scene: draw anywhere, then crop to the drawing =================== */
const tw = (t, size = 15) => String(t).length * size * 0.56;
function Scene() {
  const s = {b: '', x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity};
  s.pt = (x, y) => { s.x0 = Math.min(s.x0, x); s.x1 = Math.max(s.x1, x); s.y0 = Math.min(s.y0, y); s.y1 = Math.max(s.y1, y); };
  s.raw = (str, pts = []) => { pts.forEach(p => s.pt(p[0], p[1])); s.b += str; };
  s.line = (A, B, o = {}) => { s.pt(...A); s.pt(...B); s.b += `<line x1="${P1(A[0])}" y1="${P1(A[1])}" x2="${P1(B[0])}" y2="${P1(B[1])}" stroke="${o.col || C.ink}" stroke-width="${o.w || 2.5}"${o.dash ? ` stroke-dasharray="${o.dash === true ? '6 5' : o.dash}"` : ''} stroke-linecap="round"/>`; };
  s.poly = (P, o = {}) => { P.forEach(p => s.pt(...p)); s.b += `<path d="M${P.map(p => P1(p[0]) + ' ' + P1(p[1])).join(' L')}${o.open ? '' : ' Z'}" fill="${o.fill || 'none'}" stroke="${o.col || C.ink}" stroke-width="${o.w || 2.5}" stroke-linejoin="round"${o.dash ? ' stroke-dasharray="6 5"' : ''}/>`; };
  s.text = (x, y, t, o = {}) => { const size = o.size || 15, w = tw(t, size), a = o.anchor || 'middle';
    const xl = a === 'start' ? x : a === 'end' ? x - w : x - w / 2; s.pt(xl, y - size * 0.7); s.pt(xl + w, y + size * 0.7);
    s.b += V.text(P1(x), P1(y), t, Object.assign({size, weight: 600}, o)); };
  s.dot = (x, y, r = 4, col = C.ink) => { s.pt(x - r, y - r); s.pt(x + r, y + r); s.b += V.dot(P1(x), P1(y), r, col); };
  s.svg = (label = 'figure', pad = 8) => { const W = s.x1 - s.x0 + 2 * pad, H = s.y1 - s.y0 + 2 * pad;
    return V.svg(P1(W), P1(H), `<g transform="translate(${P1(pad - s.x0)} ${P1(pad - s.y0)})">${s.b}</g>`, label); };
  return s;
}
const unit = (a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1; return [dx / L, dy / L]; };
const add = (A, u, k) => [A[0] + u[0] * k, A[1] + u[1] * k];
const mid = (A, B) => [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];
// screen direction of a math angle (degrees, counterclockwise, y up)
const dir = a => [Math.cos(rad(a)), -Math.sin(rad(a))];
const angOf = (Vt, P) => { let a = Math.atan2(-(P[1] - Vt[1]), P[0] - Vt[0]) * 180 / Math.PI; return (a + 360) % 360; };
// text box vs segments: does a box at c (half sizes hw, hh) touch any segment?
const hits = (c, hw, hh, segs) => segs.some(([A, B]) => { const L = Math.hypot(B[0] - A[0], B[1] - A[1]), n = Math.ceil(L / 2);
  for (let i = 0; i <= n; i++) { const x = A[0] + (B[0] - A[0]) * i / n, y = A[1] + (B[1] - A[1]) * i / n; if (Math.abs(x - c[0]) < hw && Math.abs(y - c[1]) < hh) return true; } return false; });
// arc at Vt from math angle a1 counterclockwise to a2, with a label pushed out along the bisector until it clears `segs`
function arcLabel(S, Vt, a1, a2, text, o = {}) {
  while (a2 <= a1) a2 += 360;
  const r = o.r || 24, col = o.col || C.red, sweep = a2 - a1;
  if (o.square) { const u = dir(a1), w = dir(a2), z = 14; S.raw(`<path d="M${P1(Vt[0] + u[0] * z)} ${P1(Vt[1] + u[1] * z)} L${P1(Vt[0] + (u[0] + w[0]) * z)} ${P1(Vt[1] + (u[1] + w[1]) * z)} L${P1(Vt[0] + w[0] * z)} ${P1(Vt[1] + w[1] * z)}" fill="none" stroke="${C.ink}" stroke-width="1.8"/>`); }
  else if (!o.noArc) { const u = dir(a1), w = dir(a2);
    S.raw(`<path d="M${P1(Vt[0] + u[0] * r)} ${P1(Vt[1] + u[1] * r)} A${r} ${r} 0 ${sweep > 180 ? 1 : 0} 0 ${P1(Vt[0] + w[0] * r)} ${P1(Vt[1] + w[1] * r)}" fill="none" stroke="${col}" stroke-width="2.2"/>`); }
  if (text === undefined || text === null || text === '') return;
  const size = o.size || 15, hw = tw(text, size) / 2 + 3, hh = size * 0.62, b = dir((a1 + a2) / 2), segs = o.segs || [];
  let d = Math.max(r + 12, o.d || 0), c = add(Vt, b, d);
  for (let k = 0; k < 60 && hits(c, hw, hh, segs); k++) { d += 3; c = add(Vt, b, d); }
  S.text(c[0], c[1], text, {size, fill: o.tcol || col, weight: 700});
}
const rightSq = (S, Vt, A, B, z = 13) => { const u = unit(Vt, A), w = unit(Vt, B);
  S.raw(`<path d="M${P1(Vt[0] + u[0] * z)} ${P1(Vt[1] + u[1] * z)} L${P1(Vt[0] + (u[0] + w[0]) * z)} ${P1(Vt[1] + (u[1] + w[1]) * z)} L${P1(Vt[0] + w[0] * z)} ${P1(Vt[1] + w[1] * z)}" fill="none" stroke="${C.ink}" stroke-width="1.8"/>`); };
const tick = (S, A, B, k = 1) => { const [ux, uy] = unit(A, B), c = mid(A, B);
  for (let i = 0; i < k; i++) { const o = (i - (k - 1) / 2) * 5, p = [c[0] + ux * o, c[1] + uy * o]; S.line([p[0] - uy * 7, p[1] + ux * 7], [p[0] + uy * 7, p[1] - ux * 7], {w: 2}); } };
const arrowTick = (S, A, B, k = 1) => { const u = unit(A, B), c = mid(A, B);
  for (let i = 0; i < k; i++) { const p = add(c, u, i * 8 - (k - 1) * 4); const q = add(p, u, -8);
    S.raw(`<path d="M${P1(q[0] - u[1] * 6)} ${P1(q[1] + u[0] * 6)} L${P1(p[0])} ${P1(p[1])} L${P1(q[0] + u[1] * 6)} ${P1(q[1] - u[0] * 6)}" fill="none" stroke="${C.ink}" stroke-width="2"/>`); } };
// label beside segment A-B on the side of normal n (unit), clear of the line
const sideLab = (S, A, B, text, away, o = {}) => { const u = unit(A, B); let n = [-u[1], u[0]]; const c = mid(A, B);
  if (away && (n[0] * (away[0] - c[0]) + n[1] * (away[1] - c[1])) > 0) n = [-n[0], -n[1]];
  const size = o.size || 15, off = 7 + Math.abs(n[0]) * tw(text, size) / 2 + Math.abs(n[1]) * size * 0.65;
  S.text(c[0] + n[0] * off, c[1] + n[1] * off, text, {size, fill: o.col || C.ink, weight: o.weight || 600}); };
const pip = (x, y, P) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, yi] = P[i], [xj, yj] = P[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
const area2 = P => P.reduce((a, p, i) => { const q = P[(i + 1) % P.length]; return a + p[0] * q[1] - q[0] * p[1]; }, 0);

const V8 = {};
/* polygon in model coords (y up), scaled to fit. o: labels[i] (edge i→i+1), right:[i], angles:{i:text}, names:[..], ticks:[k per edge],
   dashed:[{a,b,text,right:[foot,toward]}], ext:[[p,q]] solid extra lines, arcs:[{v,from,to,text}], fill, maxW, maxH, grid */
V8.poly = function (pts, o = {}) {
  const all = pts.concat(...(o.dashed || []).map(d => [d.a, d.b]), ...(o.ext || []));
  const xs = all.map(p => p[0]), ys = all.map(p => p[1]), x0 = Math.min(...xs), y1 = Math.max(...ys);
  const s = o.scale || Math.min((o.maxW || 300) / Math.max(Math.max(...xs) - x0, 1e-6), (o.maxH || 190) / Math.max(y1 - Math.min(...ys), 1e-6));
  const T = p => [(p[0] - x0) * s, (y1 - p[1]) * s], P = pts.map(T), n = P.length, S = Scene();
  const ccw = area2(pts) > 0, cen = [P.reduce((a, p) => a + p[0], 0) / n, P.reduce((a, p) => a + p[1], 0) / n];
  if (o.grid) { const [gx0, gy0, gx1, gy1] = o.grid; for (let x = gx0; x <= gx1; x++) S.line(T([x, gy0]), T([x, gy1]), {col: C.faint, w: 1.2}); for (let y = gy0; y <= gy1; y++) S.line(T([gx0, y]), T([gx1, y]), {col: C.faint, w: 1.2}); }
  (o.shade || []).forEach(Q => S.poly(Q.map(T), {fill: C.amber + '66', w: 1.5, col: C.amber}));
  S.poly(P, {fill: o.fill || C.teal + '22'});
  (o.holes || []).forEach(Q => S.poly(Q.map(T), {fill: C.paper, w: 2.5}));
  (o.ext || []).forEach(([a, b]) => S.line(T(a), T(b), {w: 2.5}));
  const segs = P.map((p, i) => [p, P[(i + 1) % n]]).concat((o.ext || []).map(([a, b]) => [T(a), T(b)]));
  (o.dashed || []).forEach(d => { const A = T(d.a), B = T(d.b); S.line(A, B, {col: d.col || C.red, w: 2.2, dash: true}); segs.push([A, B]);
    if (d.foot) rightSq(S, T(d.foot[0]), T(d.foot[1]), T(d.foot[2]), 11); });
  (o.dashed || []).forEach(d => { if (d.text) { const A = T(d.a), B = T(d.b); sideLab(S, A, B, d.text, d.away ? T(d.away) : null, {col: d.col || C.red, weight: 700}); } });
  for (let i = 0; i < n; i++) { const A = P[i], B = P[(i + 1) % n];
    if (o.ticks && o.ticks[i]) tick(S, A, B, o.ticks[i]);
    const L = o.labels && o.labels[i];
    if (L !== undefined && L !== null && L !== '') { const u = unit(A, B); let nn = [u[1], -u[0]]; const c = mid(A, B);
      if (pip(c[0] + nn[0] * 4, c[1] + nn[1] * 4, P)) nn = [-nn[0], -nn[1]];
      const off = 8 + Math.abs(nn[0]) * tw(L) / 2 + Math.abs(nn[1]) * 10; S.text(c[0] + nn[0] * off, c[1] + nn[1] * off, String(L), {size: 15}); } }
  (o.right || []).forEach(i => rightSq(S, P[i], P[(i + n - 1) % n], P[(i + 1) % n]));
  Object.keys(o.angles || {}).forEach(k => { const i = +k, Vt = P[i], nx = P[(i + 1) % n], pv = P[(i + n - 1) % n];
    let a1 = angOf(Vt, nx), a2 = angOf(Vt, pv); if (!ccw) [a1, a2] = [a2, a1];
    const t = o.angles[k], sq = t === 'R'; arcLabel(S, Vt, a1, a2, sq ? '' : t, {segs, square: sq, r: 22}); });
  (o.arcs || []).forEach(a => { const Vt = T(a.v); let a1 = angOf(Vt, T(a.from)), a2 = angOf(Vt, T(a.to)); if (((a2 - a1 + 360) % 360) > 180) [a1, a2] = [a2, a1];
    arcLabel(S, Vt, a1, a2, a.text, {segs, col: a.col || C.blue, r: 22}); });
  (o.names || []).forEach((t, i) => { if (!t) return; const Vt = P[i], u = unit(cen, Vt); S.text(Vt[0] + u[0] * 16, Vt[1] + u[1] * 16, t, {size: 16, weight: 700}); });
  if (o.inner) S.text(cen[0], cen[1], o.inner, {size: 15, fill: C.ink});
  (o.texts || []).forEach(([p, t]) => { const q = T(p); S.text(q[0], q[1], t, {size: 17, weight: 700, fill: C.blue}); });
  return S.svg(o.label || 'shape');
};
// triangle from two base angles (A at left, B at right), base length c (model units)
const triAng = (A, B, c = 10) => { const Cg = 180 - A - B, b = c * Math.sin(rad(B)) / Math.sin(rad(Cg)); return [[0, 0], [c, 0], [b * Math.cos(rad(A)), b * Math.sin(rad(A))]]; };
// triangle from three sides (a opposite A...): A=(0,0), B=(c,0)
const triSides = (a, b, c) => { const x = (b * b + c * c - a * a) / (2 * c); return [[0, 0], [c, 0], [x, Math.sqrt(Math.max(0, b * b - x * x))]]; };

/* rays from one vertex. dirs: math angles; arcs: [[i,j,text,o]] from dir i ccw to dir j; lines drawn full length L */
V8.rays = function (dirs, arcs, o = {}) {
  const S = Scene(), Vt = [0, 0], L = o.L || 130, ends = dirs.map(a => add(Vt, dir(a), L));
  ends.forEach(E => S.line(Vt, E, {w: 3}));
  S.pt(-40, -40); S.pt(40, 40);
  const segs = ends.map(E => [Vt, E]);
  arcs.forEach(([i, j, text, ao = {}], k) => arcLabel(S, Vt, dirs[i], dirs[j], text, Object.assign({segs, r: 22 + (k % 2) * 8, col: ao.col || [C.red, C.blue, C.teal, C.violet][k % 4]}, ao)));
  if (o.square) arcLabel(S, Vt, dirs[o.square[0]], dirs[o.square[1]], '', {square: true});
  if (o.dotV !== false) S.dot(0, 0, 3.5);
  return S.svg(o.label || 'angles');
};

/* two parallel lines cut by a transversal at angle th (math degrees, 30–150). o.nums: {1..8: text}, o.parallel (default true), o.tilt (for non-parallel) */
V8.trans = function (th, o = {}) {
  const S = Scene(), yT = 0, yB = 110, cx = 0, cot = 1 / Math.tan(rad(th)), par = o.parallel !== false, tilt = par ? 0 : (o.tilt || 14);
  const xt = cx + 55 * cot, xb = cx - 55 * cot;
  const lineAt = (Pc, phi) => [add(Pc, dir(phi), -150), add(Pc, dir(phi), 150)];
  const top = lineAt([xt, yT], 0), bot = lineAt([xb, yB], tilt);
  const tv = dir(th), T0 = add([xt, yT], tv, 70), T1 = add([xb, yB], tv, -70);
  S.line(top[0], top[1], {w: 3}); S.line(bot[0], bot[1], {w: 3}); S.line(T0, T1, {w: 3, col: C.blue});
  if (par) { arrowTick(S, [xt + 70, yT], [xt + 140, yT], 1); arrowTick(S, [xb + 70, yB], [xb + 140, yB], 1); }
  S.text(top[1][0] + 12, yT, 'p', {size: 15, fill: C.muted, anchor: 'start'}); S.text(bot[1][0] + 12, bot[1][1], 'q', {size: 15, fill: C.muted, anchor: 'start'});
  const segs = [top, bot, [T0, T1]];
  const place = (Pc, phi, base) => { const ds = [[phi, th], [th, phi + 180], [phi + 180, th + 180], [th + 180, phi + 360]], idx = [2, 1, 3, 4];
    ds.forEach(([a1, a2], k) => { const nm = base + idx[k], t = o.nums && o.nums[nm]; if (t === undefined || t === '') return;
      const hl = o.hl && o.hl.includes(nm); arcLabel(S, Pc, a1, a2, t, {segs, noArc: !hl, r: 18, col: hl ? C.red : C.ink, tcol: hl ? C.red : C.ink, size: 16, d: 22}); }); };
  place([xt, yT], 0, 0); place([xb, yB], tilt, 4);
  return S.svg(o.label || 'parallel lines and a transversal');
};
// the angle size at position k (1–8) when the transversal makes th with parallel lines
const posAng = (k, th) => [2, 3, 6, 7].includes(k) ? th : 180 - th;
const PAIRS = {corr: [[1, 5], [2, 6], [3, 7], [4, 8]], altIn: [[3, 6], [4, 5]], altEx: [[1, 8], [2, 7]], ssIn: [[3, 5], [4, 6]], vert: [[1, 4], [2, 3], [5, 8], [6, 7]]};
const partner = (kind, k) => { for (const [a, b] of PAIRS[kind]) { if (a === k) return b; if (b === k) return a; } return null; };
const allNums = () => ({1: '1', 2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8'});
const ANG = n => `∠${n}`;

/* grid picture: polys [{pts, fill, col, dash}] in cell units (y up), lines [[p,q,{dash,col}]], size px per unit */
V8.gridPic = function (cols, rows, polys, o = {}) {
  const s = o.size || 26, S = Scene(), T = p => [p[0] * s, (rows - p[1]) * s];
  for (let x = 0; x <= cols; x++) S.line(T([x, 0]), T([x, rows]), {col: C.line, w: 1});
  for (let y = 0; y <= rows; y++) S.line(T([0, y]), T([cols, y]), {col: C.line, w: 1});
  polys.forEach(p => S.poly(p.pts.map(T), {fill: p.fill || C.teal + '44', col: p.col || C.ink, w: p.w || 2.5, dash: p.dash}));
  (o.lines || []).forEach(([a, b, lo = {}]) => S.line(T(a), T(b), {col: lo.col || C.red, w: 2.2, dash: lo.dash === undefined ? true : lo.dash}));
  (o.texts || []).forEach(([p, t, to = {}]) => S.text(T(p)[0], T(p)[1], t, Object.assign({size: 15, weight: 700}, to)));
  return S.svg(o.label || 'grid');
};

/* =================== III.8.01 – III.8.03 angles =================== */
E3.skill({ id: 'III.8.01', name: 'Angle relationships', steps: {
  a: { t: 'complementary', g: (R) => { const x = R.int(15, 75), k = R.int(0, 3), rot = R.pick([0, 0, 10, 20, -15, 90, 180]);
    const ex = `Complementary angles add to 90${D}: 90${D} ${M} ${x}${D} = ${90 - x}${D}.`;
    if (k <= 1) { const first = R.bool(), labs = first ? [deg(x), '?'] : ['?', deg(x)], a1 = first ? x : 90 - x;
      return num('The two angles together make a right angle. Find the missing angle, in degrees.', 90 - x, ex, {visual: V8.rays([rot, rot + a1, rot + 90], [[0, 1, labs[0], {r: 30}], [1, 2, labs[1], {r: 30}]], {square: [0, 2]})}); }
    if (k === 2) return choice(R, `What is the complement of ${x}${D}?`, deg(90 - x), [deg(180 - x), deg(x), deg(360 - x)], ex + ` The complement is not 180${D} ${M} ${x}${D}.`);
    const y = R.int(15, 75), ok = x + y === 90 || R.bool(0.4); const yy = ok ? 90 - x : y;
    return yn(`Are ${x}${D} and ${yy}${D} complementary?`, x + yy === 90, `${x}${D} + ${yy}${D} = ${x + yy}${D}. Complementary means exactly 90${D}.`); } },
  b: { t: 'supplementary', g: (R) => { const x = R.int(20, 160), k = R.int(0, 3), rot = R.pick([0, 0, 0, 15, -10, 30]);
    const ex = `Angles on a straight line are supplementary: 180${D} ${M} ${x}${D} = ${180 - x}${D}.`;
    if (k <= 1) { const first = R.bool(), labs = first ? [deg(x), '?'] : ['?', deg(x)], a1 = first ? x : 180 - x;
      return num('The two angles sit on a straight line. Find the missing angle, in degrees.', 180 - x, ex, {visual: V8.rays([rot, rot + a1, rot + 180], [[0, 1, labs[0]], [1, 2, labs[1]]])}); }
    if (k === 2) return choice(R, `What is the supplement of ${x}${D}?`, deg(180 - x), [x < 90 ? deg(90 - x) : deg(270 - x), deg(360 - x), deg(x)], ex + ` Supplementary means 180${D}, not 90${D}.`);
    const n = R.int(2, 5), part = 180 / (n + 1);
    if (Number.isInteger(part)) return num(`Two supplementary angles: one is ${n} times the other. Find the smaller angle, in degrees.`, part, `x + ${n}x = 180, so ${n + 1}x = 180 and x = ${part}${D}.`);
    return num(`Two supplementary angles: one is ${x}${D}. Find the other, in degrees.`, 180 - x, ex); } },
  c: { t: 'vertical angles', g: (R) => { const th = R.pick([R.int(30, 75), R.int(105, 150)]), rot = R.pick([0, 10, 20, -20, 30]), k = R.int(0, 2);
    const sizes = [th, 180 - th, th, 180 - th], dirs = [rot, rot + th, rot + 180, rot + 180 + th];
    if (k === 2) { const g = R.int(0, 3), labs = ['a', 'b', 'c', 'd']; labs[g] = deg(sizes[g]); const other = [1, 2, 3].map(i => (g + i) % 4);
      return num(`Two straight lines cross. Find the other three angles, in degrees.`, other.map(i => ({label: labs[i] + ' =', ans: sizes[i]})), `The vertical angle equals ${sizes[g]}${D}; the two beside it are 180${D} ${M} ${sizes[g]}${D} = ${180 - sizes[g]}${D}.`,
        {visual: V8.rays(dirs, [0, 1, 2, 3].map(i => [i, (i + 1) % 4, labs[i], {col: i === g ? C.red : C.blue}]))}); }
    const g = R.int(0, 3), q = (g + (k === 0 ? 2 : R.pick([1, 3]))) % 4, labs = ['', '', '', '']; labs[g] = deg(sizes[g]); labs[q] = 'x';
    const vert = (q - g + 4) % 4 === 2;
    return num('Two straight lines cross. Find x, in degrees.', sizes[q], vert ? `x is vertical (opposite) to ${sizes[g]}${D}, and vertical angles are equal: x = ${sizes[g]}${D}.` : `x and ${sizes[g]}${D} sit on a straight line: x = 180${D} ${M} ${sizes[g]}${D} = ${sizes[q]}${D}.`,
      {visual: V8.rays(dirs, [0, 1, 2, 3].filter(i => labs[i]).map(i => [i, (i + 1) % 4, labs[i], {col: i === g ? C.red : C.blue}]))}); } },
  d: { t: 'solve for a missing angle with an equation', g: (R) => { const kind = R.pick(['supp', 'supp', 'comp', 'vert']);
    for (let t = 0; t < 400; t++) {
      const x = R.int(4, 30), p = R.int(1, 5), r = R.int(1, 5);
      if (kind === 'vert') { if (p === r) continue; const q = R.int(-20, 40), A = p * x + q, s = A - r * x; if (A < 30 || A > 150 || Math.abs(s) > 90 || s === 0) continue;
        const rot = R.pick([0, 15, -15, 25]), dirs = [rot, rot + A, rot + 180, rot + 180 + A];
        return num(`Two straight lines cross. Find x.`, x, `Vertical angles are equal: ${lin(p, q)} = ${lin(r, s)}, so ${Math.abs(p - r) === 1 ? 'x = ' + x : (p > r ? lin(p - r, 0) + ' = ' + (s - q) : lin(r - p, 0) + ' = ' + (q - s)) + ' and x = ' + x}.`,
          {visual: V8.rays(dirs, [[0, 1, `(${lin(p, q)})${D}`], [2, 3, `(${lin(r, s)})${D}`, {col: C.red}]])}); }
      const tot = kind === 'supp' ? 180 : 90, q = R.int(-10, 30), A = p * x + q, s = tot - (p + r) * x - q, B = r * x + s;
      if (A < 20 || B < 20 || A > tot - 20) continue;
      const rot = kind === 'supp' ? R.pick([0, 0, 10]) : R.pick([0, 10, 90]);
      const pic = V8.rays([rot, rot + A, rot + tot], [[0, 1, `(${lin(p, q)})${D}`, {r: 30}], [1, 2, `(${lin(r, s)})${D}`, {col: C.blue, r: 30}]], kind === 'comp' ? {square: [0, 2]} : {});
      const ex = `${kind === 'supp' ? 'On a straight line' : 'In a right angle'} the angles add to ${tot}${D}: ${lin(p + r, q + s)} = ${tot}, so ${lin(p + r, 0)} = ${tot - q - s} and x = ${x}.`;
      if (R.bool(0.35)) return num(`The angles ${kind === 'supp' ? 'sit on a straight line' : 'make a right angle'}. Find x and the larger angle.`, [{label: 'x =', ans: x}, {label: 'larger angle =', ans: Math.max(A, B)}], ex + ` The angles are ${A}${D} and ${B}${D}.`, {visual: pic});
      return num(`The angles ${kind === 'supp' ? 'sit on a straight line' : 'make a right angle'}. Find x.`, x, ex, {visual: pic});
    } return again('III.8.01', 'd', R); } },
}});

E3.skill({ id: 'III.8.02', name: 'Parallel lines & a transversal', steps: {
  a: { t: 'name corresponding angles', g: (R) => { const th = R.pick([R.int(40, 75), R.int(105, 140)]), k = R.int(0, 3);
    if (k === 3) { const i = R.int(1, 4), j = i + 4;
      return choiceFixed(`Lines p and q are NOT parallel. Must ${ANG(i)} and ${ANG(j)} be equal?`, ['Yes, always', 'No, not unless p ∥ q'], 1, `The corresponding-angle rule needs parallel lines. Here q is tilted, so ${ANG(i)} and ${ANG(j)} are different.`, {visual: V8.trans(th, {nums: allNums(), parallel: false, tilt: R.pick([-14, 14])})}); }
    const i = R.int(1, 8), c = partner('corr', i), wrong = [partner('altIn', i) || partner('altEx', i), partner('vert', i), partner('ssIn', i) || (i % 2 ? i + 1 : i - 1)].filter(x => x && x !== c);
    if (k === 2) { const v = posAng(i, th);
      return num(`p ∥ q and ${ANG(i)} = ${v}${D}. Find its corresponding angle, ${ANG(c)}.`, v, `Corresponding angles sit in the same spot at each crossing, so they are equal: ${ANG(c)} = ${v}${D}.`, {visual: V8.trans(th, {nums: allNums(), hl: [i, c]})}); }
    return choice(R, `p ∥ q. Which angle corresponds to ${ANG(i)}?`, ANG(c), wrong.map(ANG), `${ANG(c)} is in the same position at the other crossing (${i <= 4 ? 'top' : 'bottom'} line → ${c <= 4 ? 'top' : 'bottom'} line).`, {visual: V8.trans(th, {nums: allNums(), hl: [i]})}); } },
  b: { t: 'alternate interior and exterior', g: (R) => { const th = R.pick([R.int(40, 75), R.int(105, 140)]), kind = R.pick(['altIn', 'altEx']), [i, j0] = R.pick(PAIRS[kind]), sw = R.bool(), a = sw ? j0 : i, b = sw ? i : j0, name = kind === 'altIn' ? 'alternate interior' : 'alternate exterior';
    const k = R.int(0, 2);
    if (k === 0) { const v = posAng(a, th); return num(`p ∥ q and ${ANG(a)} = ${v}${D}. Find ${ANG(b)}.`, v, `${ANG(a)} and ${ANG(b)} are ${name} angles, on opposite sides of the transversal, so they are equal: ${v}${D}.`, {visual: V8.trans(th, {nums: allNums(), hl: [a, b]})}); }
    if (k === 1) { const wrong = [partner('corr', a), partner('vert', a), partner(kind === 'altIn' ? 'ssIn' : 'corr', a)].filter(x => x && x !== b);
      return choice(R, `p ∥ q. Which angle is ${name} to ${ANG(a)}?`, ANG(b), wrong.map(ANG), `${name[0].toUpperCase() + name.slice(1)} angles sit ${kind === 'altIn' ? 'between' : 'outside'} the parallel lines, on opposite sides of the transversal: ${ANG(a)} and ${ANG(b)}.`, {visual: V8.trans(th, {nums: allNums(), hl: [a]})}); }
    const [c, d] = R.pick([[3, 6], [4, 5], [1, 8], [2, 7], [1, 5], [3, 4], [2, 6]]), rel = PAIRS.altIn.some(p => p.includes(c) && p.includes(d)) ? 'Alternate interior' : PAIRS.altEx.some(p => p.includes(c) && p.includes(d)) ? 'Alternate exterior' : PAIRS.corr.some(p => p.includes(c) && p.includes(d)) ? 'Corresponding' : 'Vertical';
    const opts = ['Alternate interior', 'Alternate exterior', 'Corresponding', 'Vertical'];
    return choiceFixed(`p ∥ q. What kind of pair are ${ANG(c)} and ${ANG(d)}?`, opts, opts.indexOf(rel), {'Alternate interior': 'Between p and q, on opposite sides of the transversal.', 'Alternate exterior': 'Outside p and q, on opposite sides of the transversal.', Corresponding: 'Same position at the two crossings.', Vertical: 'Opposite each other at one crossing.'}[rel], {visual: V8.trans(th, {nums: allNums(), hl: [c, d]})}); } },
  c: { t: 'same-side interior', g: (R) => { const th = R.pick([R.int(40, 75), R.int(105, 140)]), [i, j0] = R.pick(PAIRS.ssIn), sw = R.bool(), a = sw ? j0 : i, b = sw ? i : j0, v = posAng(a, th), k = R.int(0, 2);
    const ex = `Same-side interior angles are between the parallel lines on the same side of the transversal, so they add to 180${D}: 180${D} ${M} ${v}${D} = ${180 - v}${D}.`;
    if (k <= 1) return num(`p ∥ q and ${ANG(a)} = ${v}${D}. Find ${ANG(b)}.`, 180 - v, ex, {visual: V8.trans(th, {nums: allNums(), hl: [a, b]})});
    return choice(R, `p ∥ q and ${ANG(a)} = ${v}${D}. What is ${ANG(b)}?`, deg(180 - v), [deg(v), deg(Math.abs(90 - v)), deg(360 - v)], ex, {visual: V8.trans(th, {nums: allNums(), hl: [a, b]})}); } },
  d: { t: 'find all eight from one', g: (R) => { const th = R.pick([R.int(40, 75), R.int(105, 140)]), g = R.int(1, 8), v = posAng(g, th);
    const asks = R.sample([1, 2, 3, 4, 5, 6, 7, 8].filter(k => k !== g), 3).sort((a, b) => a - b), nums = allNums(); nums[g] = deg(v);
    const eq = [1, 2, 3, 4, 5, 6, 7, 8].filter(k => posAng(k, th) === v).map(ANG).join(', ');
    return num(`p ∥ q and ${ANG(g)} = ${v}${D}. Find the three angles.`, asks.map(k => ({label: ANG(k) + ' =', ans: posAng(k, th)})), `Four angles equal ${v}${D} (${eq}); the other four are 180${D} ${M} ${v}${D} = ${180 - v}${D}.`, {visual: V8.trans(th, {nums, hl: [g]})}); } },
}});

/* sectors placed side by side from direction start (math degrees): angles[], labels[], colors */
V8.wedges = function (angles, labels, o = {}) {
  const S = Scene(), r = o.r || 80, Vt = [0, 0]; let a = o.start || 0; const cols = [C.red, C.blue, C.amber, C.teal];
  if (o.line) S.line(add(Vt, dir(0), -r - 30), add(Vt, dir(0), r + 30), {w: 2.5});
  const segs = [];
  angles.forEach((g, i) => { const u = dir(a), w = dir(a + g), A = add(Vt, u, r), B = add(Vt, w, r);
    S.raw(`<path d="M0 0 L${P1(A[0])} ${P1(A[1])} A${r} ${r} 0 ${g > 180 ? 1 : 0} 0 ${P1(B[0])} ${P1(B[1])} Z" fill="${cols[i % 4]}55" stroke="${cols[i % 4]}" stroke-width="2"/>`, [A, B]);
    segs.push([Vt, A], [Vt, B]); a += g; });
  a = o.start || 0;
  angles.forEach((g, i) => { arcLabel(S, Vt, a, a + g, labels[i], {noArc: true, segs, col: C.ink, size: 15, d: r * 0.55}); a += g; });
  S.pt(-r, -r); S.pt(r, o.line ? 10 : r);
  return S.svg(o.label || 'torn corners');
};

E3.skill({ id: 'III.8.03', name: 'Triangle angle sum', steps: {
  a: { t: 'the 180° fact', g: (R) => { const k = R.int(0, 4);
    if (k === 0) { const A = R.int(30, 80), B = R.int(30, 80), Cc = 180 - A - B + R.pick([0, 0, 0, 10, -10, 20]); if (Cc < 10) return again('III.8.03', 'a', R);
      return yn(`Can a triangle have angles ${A}${D}, ${B}${D} and ${Cc}${D}?`, A + B + Cc === 180, `${A} + ${B} + ${Cc} = ${A + B + Cc}. A triangle's angles must add to exactly 180${D}.`); }
    if (k === 1) return choice(R, 'The three angles of any triangle add up to:', `180${D}`, [`360${D}`, `90${D}`, `270${D}`], `Every triangle's angles add to 180${D}. (A quadrilateral's add to 360${D}.)`);
    if (k === 2) return choice(R, 'The four angles of any quadrilateral add up to:', `360${D}`, [`180${D}`, `90${D}`, `540${D}`], `A diagonal splits a quadrilateral into 2 triangles: 2 ${X} 180${D} = 360${D}. The 180${D} rule is for triangles only.`);
    if (k === 3) return num('A triangle has a right angle. What do the other two angles add up to, in degrees?', 90, `180${D} ${M} 90${D} = 90${D} is left for the other two.`);
    return R.bool() ? num('All three angles of an equilateral triangle are equal. How big is each one, in degrees?', 60, `180${D} ÷ 3 = 60${D}.`) : R.bool() ? yn('Can a triangle have one right angle?', true, `Yes: 90${D} leaves 90${D} for the other two angles, like 30${D} and 60${D}.`) : yn('Can a triangle have two right angles?', false, `90${D} + 90${D} = 180${D} already, leaving 0${D} for the third angle. So no.`); } },
  b: { t: 'find a missing angle', g: (R) => { const k = R.int(0, 3);
    if (k === 3) { const apex = R.int(4, 14) * 10, base = (180 - apex) / 2; if (!Number.isInteger(base)) return again('III.8.03', 'b', R);
      const askApex = R.bool(), pts = triAng(base, base, 10);
      return num(`This triangle has two equal sides. Find x, in degrees.`, askApex ? apex : base, askApex ? `The base angles are equal: x = 180${D} ${M} ${base}${D} ${M} ${base}${D} = ${apex}${D}.` : `The base angles are equal: x = (180${D} ${M} ${apex}${D}) ÷ 2 = ${base}${D}.`,
        {visual: V8.poly(pts, {angles: askApex ? {0: deg(base), 2: 'x'} : {1: 'x', 2: deg(apex)}, ticks: [0, 1, 1]})}); }
    let A, B; do { A = R.int(25, 110); B = R.int(25, 110); } while (180 - A - B < 25);
    if (R.bool(0.25)) A = 90; if (180 - A - B < 20) return again('III.8.03', 'b', R);
    const Cg = 180 - A - B, sz = [A, B, Cg], q = R.int(0, 2), ang = {}; [0, 1, 2].forEach(i => ang[i] = i === q ? 'x' : sz[i] === 90 ? 'R' : deg(sz[i]));
    const known = [0, 1, 2].filter(i => i !== q).map(i => sz[i]);
    return num('Find x, in degrees.', sz[q], `180${D} ${M} ${known[0]}${D} ${M} ${known[1]}${D} = ${sz[q]}${D}.`, {visual: V8.poly(triAng(A, B, 10), {angles: ang})}); } },
  c: { t: 'exterior angle theorem', g: (R) => { let A, B; do { A = R.int(30, 85); B = R.int(40, 110); } while (180 - A - B < 30);
    const Cg = 180 - A - B, pts = triAng(A, B, 10), Bv = pts[1], E = [Bv[0] + 4.5, 0], k = R.int(0, 2);
    if (k === 2) { return num('Find x, the missing angle inside the triangle, in degrees.', Cg, `The exterior angle equals the two far angles added: ${A}${D} + x = ${A + Cg}${D}, so x = ${Cg}${D}.`,
      {visual: V8.poly(pts, {angles: {0: deg(A), 2: 'x'}, ext: [[Bv, E]], arcs: [{v: Bv, from: E, to: pts[2], text: deg(A + Cg)}]})}); }
    const ex = `The exterior angle equals the two opposite inside angles added: ${A}${D} + ${Cg}${D} = ${A + Cg}${D}.`;
    const vis = V8.poly(pts, {angles: {0: deg(A), 2: deg(Cg)}, ext: [[Bv, E]], arcs: [{v: Bv, from: E, to: pts[2], text: 'x'}]});
    if (k === 1) return choice(R, 'Find the exterior angle x.', deg(A + Cg), [deg(B), deg(180 - A), deg(Math.abs(A - Cg) || 90)], ex, {visual: vis});
    return num('Find the exterior angle x, in degrees.', A + Cg, ex, {visual: vis}); } },
  d: { t: 'multi-step missing angles', g: (R) => { const k = R.int(0, 4);
    if (k === 0) { const A = R.int(20, 50), twice = R.bool(), d = R.int(10, 40), B = twice ? 2 * A : A + d; if (180 - A - B < 15) return again('III.8.03', 'd', R);
      const Cg = 180 - A - B;
      return num(`In a triangle, angle A = ${A}${D} and angle B is ${twice ? 'twice angle A' : `${d}${D} more than angle A`}. Find angle C, in degrees.`, Cg, `Step 1: B = ${twice ? `2 ${X} ${A}` : `${A} + ${d}`} = ${B}${D}. Step 2: C = 180${D} ${M} ${A}${D} ${M} ${B}${D} = ${Cg}${D}.`, {visual: V8.poly(triAng(A, B, 10), {angles: {0: deg(A), 1: 'B', 2: 'C'}})}); }
    if (k === 1) { const base = R.int(35, 75), ex = 180 - base, apex = 180 - 2 * base, pts = triAng(base, base, 10), Bv = pts[1], E = [Bv[0] + 4.5, 0];
      return num(`This triangle has two equal sides. The outside angle at a base corner is ${ex}${D}. Find the top angle x, in degrees.`, apex, `Step 1: base angle = 180${D} ${M} ${ex}${D} = ${base}${D}. Step 2: both base angles are ${base}${D}, so x = 180${D} ${M} ${base}${D} ${M} ${base}${D} = ${apex}${D}.`,
        {visual: V8.poly(pts, {angles: {2: 'x'}, ticks: [0, 1, 1], ext: [[Bv, E]], arcs: [{v: Bv, from: E, to: pts[2], text: deg(ex)}]})}); }
    if (k === 2) { let a, b, x; do { a = R.int(60, 130); b = R.int(60, 130); x = (360 - a - b) / 2; } while (!Number.isInteger(x) || x < 45 || x > 130);
      return num(`A quadrilateral has angles ${a}${D} and ${b}${D}. Its other two angles are equal. Find one of them, in degrees.`, x, `Step 1: the angles add to 360${D}, so the two equal angles make 360${D} ${M} ${a}${D} ${M} ${b}${D} = ${2 * x}${D}. Step 2: ${2 * x}${D} ÷ 2 = ${x}${D}.`); }
    if (k === 3) { const apex = R.int(3, 14) * 10, base = (180 - apex) / 2, ex = 180 - base, pts = triAng(base, base, 10), Bv = pts[1], E = [Bv[0] + 4.5, 0];
      return num(`This triangle has two equal sides and a top angle of ${apex}${D}. Find the outside angle x at the base, in degrees.`, ex, `Step 1: each base angle = (180${D} ${M} ${apex}${D}) ÷ 2 = ${base}${D}. Step 2: x = 180${D} ${M} ${base}${D} = ${ex}${D}.`,
        {visual: V8.poly(pts, {angles: {2: deg(apex)}, ticks: [0, 1, 1], ext: [[Bv, E]], arcs: [{v: Bv, from: E, to: pts[2], text: 'x'}]})}); }
    let A, B; do { A = R.int(40, 80); B = R.int(40, 80); } while (180 - A - B < 30);
    const Cg = 180 - A - B, pts = triAng(A, B, 10), Av = pts[0], Bv = pts[1], EA = [Av[0] - 4.5, 0], EB = [Bv[0] + 4.5, 0];
    return num(`The base of this triangle is extended both ways. The outside angles are ${180 - A}${D} and ${180 - B}${D}. Find x, in degrees.`, Cg, `Step 1: the inside base angles are 180${D} ${M} ${180 - A}${D} = ${A}${D} and 180${D} ${M} ${180 - B}${D} = ${B}${D}. Step 2: x = 180${D} ${M} ${A}${D} ${M} ${B}${D} = ${Cg}${D}.`,
      {visual: V8.poly(pts, {angles: {2: 'x'}, ext: [[Av, EA], [Bv, EB]], arcs: [{v: Av, from: pts[2], to: EA, text: deg(180 - A)}, {v: Bv, from: EB, to: pts[2], text: deg(180 - B)}]})}); } },
}});

/* =================== III.8.04 – III.8.07 area =================== */
const SLANT = [[3, 4, 5], [4, 3, 5], [6, 8, 10], [8, 6, 10], [5, 12, 13], [9, 12, 15], [12, 9, 15], [2, 0, 0], [3, 0, 0], [4, 0, 0]];
// parallelogram base b, offset s, height h (model)
const pgram = (b, s, h) => [[0, 0], [b, 0], [b + s, h], [s, h]];
E3.skill({ id: 'III.8.04', name: 'Area of parallelograms', steps: {
  a: { t: 'cut and slide to a rectangle', g: (R) => { const b = R.int(3, 7), h = R.int(2, 5), s = R.int(1, 3), k = R.int(0, 2);
    const vis = V8.gridPic(b + s + 1, h + 1, [{pts: pgram(b, s, h).map(p => [p[0] + 0.5 * 0 + 0, p[1]])}, {pts: [[0, 0], [s, h], [s, 0]], fill: C.amber + '88', col: C.amber, w: 1.5}], {lines: [[[s, 0], [s, h]]]});
    const ex = `Slide the shaded triangle to the right end: the parallelogram becomes a ${b} by ${h} rectangle, ${b} ${X} ${h} = ${b * h} square units.`;
    if (k === 0) return num('Cut off the shaded triangle and slide it to the other end. What is the area of the parallelogram, in square units?', b * h, ex, {visual: vis});
    if (k === 1) return num('Cut off the shaded triangle and slide it to the other end. What size is the rectangle you get?', [{label: 'length', ans: b}, {label: 'height', ans: h}], ex, {visual: vis});
    return choice(R, 'Cutting and sliding the triangle makes a rectangle. Which is true?', 'The area stays the same', ['The area gets bigger', 'The area gets smaller', 'The area doubles'], 'Nothing is added or lost when you slide a piece, so the area stays the same.', {visual: vis}); } },
  b: { t: 'base × height', g: (R, O) => { const u = UL(O).s, [s0, h, sl] = R.pick(SLANT.slice(0, 7)), f = R.pick([1, 1, 2]), b = R.int(Math.max(4, h), 14), s = s0;
    const vis = V8.poly(pgram(b, s, h), {labels: [`${b} ${u}`, `${sl} ${u}`], dashed: [{a: [s, h], b: [s, 0], text: `${h} ${u}`, foot: [[s, 0], [s, h], [b, 0]], away: [s - 5, h / 2]}]});
    return num(`Find the area of the parallelogram, in ${u}².`, b * h, `A = base ${X} height = ${b} ${X} ${h} = ${b * h} ${u}². Use the height ${h}, not the slanted side ${sl}.`, {visual: vis}); } },
  c: { t: 'identify the true height', g: (R, O) => { const u = UL(O).s, [s0, h, sl] = R.pick(SLANT.slice(0, 7)), b = R.int(Math.max(3, h - 2), 12), out = R.bool(0.35), s = out ? b + R.int(1, 3) : s0;
    if (b === h || b === sl) return again('III.8.04', 'c', R, O);
    const slant = Math.hypot(s, h), sls = Number.isInteger(slant) ? `${slant} ${u}` : null;
    const labels = [`${b} ${u}`, out ? '' : `${sl} ${u}`];
    const dashed = [{a: [s, h], b: [s, 0], text: `${h} ${u}`, foot: [[s, 0], [s, h], [0, 0]], away: (b - s / 2 > 0 && b - s / 2 < s / 2) ? [s + 5, h / 2] : [s - 5, h / 2]}];
    if (s > b) dashed.push({a: [b, 0], b: [s, 0], col: C.muted});
    const vis = V8.poly(pgram(b, out ? s : s0, h), {labels, dashed});
    if (R.bool(0.5) && !out) return choice(R, `Which length is the height for the ${b} ${u} base?`, `${h} ${u}`, [`${sl} ${u}`, `${b} ${u}`], `The height meets the base at a right angle: ${h} ${u}. The slanted side (${sl} ${u}) is longer.`, {visual: vis});
    return num(`Find the area of the parallelogram, in ${u}².`, b * h, `The height is the dashed ${h} ${u}, at a right angle to the base${out ? ' (extended)' : ''}: ${b} ${X} ${h} = ${b * h} ${u}².`, {visual: vis}); } },
  d: { t: 'solve for a missing side', g: (R, O) => { const u = UL(O).s, b = R.int(4, 15), h = R.int(3, 9), s = R.int(1, 4), A = b * h;
    if (R.bool()) return num(`The parallelogram has area ${A} ${u}². Find the base, in ${u}.`, b, `b = A ÷ h = ${A} ÷ ${h} = ${b} ${u}.`, {visual: V8.poly(pgram(b, s, h), {labels: ['?'], dashed: [{a: [s, h], b: [s, 0], text: `${h} ${u}`, foot: [[s, 0], [s, h], [b, 0]], away: [s - 5, h / 2]}]})});
    return num(`The parallelogram has area ${A} ${u}². Find its height, in ${u}.`, h, `h = A ÷ b = ${A} ÷ ${b} = ${h} ${u}.`, {visual: V8.poly(pgram(b, s, h), {labels: [`${b} ${u}`], dashed: [{a: [s, h], b: [s, 0], text: 'h', foot: [[s, 0], [s, h], [b, 0]], away: [s - 5, h / 2]}]})}); } },
}});

E3.skill({ id: 'III.8.05', name: 'Area of triangles', steps: {
  a: { t: 'half a parallelogram', g: (R) => { const b = R.int(3, 8), h = R.int(2, 6), k = R.int(0, 2);
    if (k === 0) { const vis = V8.gridPic(b + 1, h + 1, [{pts: [[0, 0], [b, 0], [b, h], [0, h]], fill: C.paper}, {pts: [[0, 0], [b, 0], [b, h]], fill: C.teal + '66'}]);
      return num('What is the area of the shaded triangle, in square units?', b * h / 2, `It is half of the ${b} by ${h} rectangle: ${b * h} ÷ 2 = ${fmt(b * h / 2)} square units.`, {visual: vis}); }
    const s = R.int(1, 3), vis = V8.gridPic(b + s + 1, h + 1, [{pts: pgram(b, s, h), fill: C.paper}, {pts: [[0, 0], [b, 0], [s, h]], fill: C.teal + '66'}]);
    if (k === 1) return num('What is the area of the shaded triangle, in square units?', b * h / 2, `The diagonal cuts the parallelogram (${b} ${X} ${h} = ${b * h}) into 2 equal triangles: ${fmt(b * h / 2)} square units.`, {visual: vis});
    const P = b * h; return num(`The parallelogram has area ${P} square units. What is the area of the shaded triangle?`, P / 2, `The diagonal splits it into 2 equal triangles: ${P} ÷ 2 = ${fmt(P / 2)}.`, {visual: vis}); } },
  b: { t: '½ × base × height', g: (R, O) => { const u = UL(O).s, k = R.int(0, 2);
    if (k === 0) { const b = R.int(3, 14), h = R.int(3, 12);
      return num(`Find the area of the right triangle, in ${u}².`, b * h / 2, `A = ½ ${X} ${b} ${X} ${h} = ${fmt(b * h / 2)} ${u}². Without the ½ you'd get the rectangle.`, {visual: V8.poly([[0, 0], [b, 0], [0, h]], {labels: [`${b} ${u}`, '', `${h} ${u}`], right: [0]})}); }
    const b = R.int(6, 16), h = R.int(3, 11), p = R.int(1, b - 1);
    const vis = V8.poly([[0, 0], [b, 0], [p, h]], {labels: [`${b} ${u}`], dashed: [{a: [p, h], b: [p, 0], text: `${h} ${u}`, foot: [[p, 0], [p, h], [b, 0]], away: [p < b / 2 ? p - 1 : p + 1, h / 2]}]});
    if (k === 1) return choice(R, `Find the area of the triangle.`, `${fmt(b * h / 2)} ${u}²`, [`${b * h} ${u}²`, `${b + h} ${u}²`, `${fmt(b * h / 4)} ${u}²`], `A = ½ ${X} base ${X} height = ½ ${X} ${b} ${X} ${h} = ${fmt(b * h / 2)} ${u}².`, {visual: vis});
    return num(`Find the area of the triangle, in ${u}².`, b * h / 2, `A = ½ ${X} ${b} ${X} ${h} = ${fmt(b * h / 2)} ${u}².`, {visual: vis}); } },
  c: { t: 'obtuse triangles, outside height', g: (R, O) => { const u = UL(O).s, b = R.int(3, 10), h = R.int(3, 9), e = R.int(2, 5), left = R.bool();
    const apex = left ? -e : b + e, foot = [apex, 0], far = left ? [b, 0] : [0, 0], near = left ? [0, 0] : [b, 0];
    const side = Math.hypot(e, h), sideLab = Number.isInteger(side) ? `${side} ${u}` : '';
    const vis = V8.poly([[0, 0], [b, 0], [apex, h]], {labels: [`${b} ${u}`, left ? '' : sideLab, left ? sideLab : ''], dashed: [{a: [apex, h], b: foot, text: `${h} ${u}`, foot: [foot, [apex, h], far], away: [apex + (left ? 3 : -3), h / 2]}, {a: near, b: foot, col: C.muted}]});
    if (R.bool(0.3)) return choice(R, `Which length is the height for the ${b} ${u} base?`, `${h} ${u}`, [`${b + e} ${u}`, `${e} ${u}`].concat(sideLab ? [sideLab] : []), `The height is the dashed line at a right angle to the base, extended outside the triangle: ${h} ${u}.`, {visual: vis});
    return num(`Find the area of the triangle, in ${u}².`, b * h / 2, `The height falls outside, onto the base extended. A = ½ ${X} ${b} ${X} ${h} = ${fmt(b * h / 2)} ${u}².`, {visual: vis}); } },
  d: { t: 'missing base or height', g: (R, O) => { const u = UL(O).s, b = R.int(3, 16), h = R.int(3, 12), A = b * h / 2, p = R.int(1, b - 1);
    if (R.bool()) return num(`The triangle has area ${fmt(A)} ${u}². Find its height, in ${u}.`, h, `h = 2A ÷ b = ${fmt(2 * A)} ÷ ${b} = ${h} ${u}.`, {visual: V8.poly([[0, 0], [b, 0], [p, h]], {labels: [`${b} ${u}`], dashed: [{a: [p, h], b: [p, 0], text: 'h', foot: [[p, 0], [p, h], [b, 0]]}]})});
    return num(`The triangle has area ${fmt(A)} ${u}². Find its base, in ${u}.`, b, `b = 2A ÷ h = ${fmt(2 * A)} ÷ ${h} = ${b} ${u}. Don't forget to double the area first.`, {visual: V8.poly([[0, 0], [b, 0], [p, h]], {labels: ['?'], dashed: [{a: [p, h], b: [p, 0], text: `${h} ${u}`, foot: [[p, 0], [p, h], [b, 0]]}]})}); } },
}});

// trapezoid: bottom B, top a starting at p, height h
const trap = (B, a, p, h) => [[0, 0], [B, 0], [p + a, h], [p, h]];
E3.skill({ id: 'III.8.06', name: 'Area of trapezoids', steps: {
  a: { t: 'split into shapes', g: (R, O) => { const u = UL(O).s, h = R.int(3, 8);
    if (R.bool()) { const a = R.int(3, 9), B = a + R.int(2, 7), tri = (B - a) * h / 2;
      return num(`Split along the dashed line. Find the area of each part and the total, in ${u}².`, [{label: 'rectangle', ans: a * h}, {label: 'triangle', ans: tri}, {label: 'total', ans: a * h + tri}], `Rectangle ${a} ${X} ${h} = ${a * h}; triangle ½ ${X} ${B - a} ${X} ${h} = ${fmt(tri)}; total ${fmt(a * h + tri)} ${u}².`,
        {visual: V8.poly(trap(B, a, 0, h), {labels: [`${B} ${u}`, '', `${a} ${u}`, `${h} ${u}`], right: [0, 3], dashed: [{a: [a, h], b: [a, 0], col: C.muted}]})}); }
    const a = R.int(3, 8), e = R.int(1, 4), B = a + 2 * e, tri = e * h / 2;
    return num(`Split along the dashed lines. Find the area of each part and the total, in ${u}².`, [{label: 'each triangle', ans: tri}, {label: 'rectangle', ans: a * h}, {label: 'total', ans: a * h + 2 * tri}], `Each triangle is ½ ${X} ${e} ${X} ${h} = ${fmt(tri)}, the rectangle ${a} ${X} ${h} = ${a * h}; total ${fmt(a * h + 2 * tri)} ${u}².`,
      {visual: V8.poly(trap(B, a, e, h), {labels: [`${B} ${u}`, '', `${a} ${u}`], dashed: [{a: [e, h], b: [e, 0], col: C.red, text: `${h} ${u}`, away: [e + 1, h / 2], foot: [[e, 0], [e, h], [B, 0]]}, {a: [e + a, h], b: [e + a, 0], col: C.red}]})}); } },
  b: { t: 'average of bases × height', g: (R, O) => { const u = UL(O).s, a = R.int(2, 10), B = a + R.int(2, 9), h = R.int(2, 9), p = R.int(0, B - a), avg = (a + B) / 2;
    return num(`Find the average of the two parallel sides, then the area in ${u}².`, [{label: 'average', ans: avg}, {label: 'area', ans: avg * h}], `(${a} + ${B}) ÷ 2 = ${fmt(avg)}, then ${fmt(avg)} ${X} ${h} = ${fmt(avg * h)} ${u}².`,
      {visual: V8.poly(trap(B, a, p, h), {labels: [`${B} ${u}`, '', `${a} ${u}`], dashed: [{a: [p + a / 2, h], b: [p + a / 2, 0], text: `${h} ${u}`, foot: [[p + a / 2, 0], [p + a / 2, h], [B, 0]], away: [p + a / 2 + 1, h / 2]}]})}); } },
  c: { t: 'apply the formula', g: (R, O) => { const u = UL(O).s, [e, h, sl] = R.pick([[3, 4, 5], [4, 3, 5], [6, 8, 10], [8, 6, 10], [5, 12, 13], [9, 12, 15]]), a = R.int(3, 12), extra = R.int(0, 6), B = a + e + extra;
    const pts = trap(B, a, extra, h), A = (a + B) * h / 2, vis = V8.poly(pts, {labels: [`${B} ${u}`, `${sl} ${u}`, `${a} ${u}`, ''], dashed: [{a: [extra + a, h], b: [extra + a, 0], text: `${h} ${u}`, foot: [[extra + a, 0], [extra + a, h], [0, 0]], away: [extra + a + 1, h / 2]}]});
    if (R.bool(0.35)) return choice(R, `Find the area of the trapezoid.`, `${fmt(A)} ${u}²`, [`${(a + B) * h} ${u}²`, `${fmt((a + B) * sl / 2)} ${u}²`, `${a * B} ${u}²`], `(${a} + ${B}) ÷ 2 ${X} ${h} = ${fmt(A)} ${u}². Halve the sum of the bases, and use the height, not the slanted side.`, {visual: vis});
    return num(`Find the area of the trapezoid, in ${u}².`, A, `A = (${a} + ${B}) ÷ 2 ${X} ${h} = ${fmt((a + B) / 2)} ${X} ${h} = ${fmt(A)} ${u}².`, {visual: vis}); } },
  d: { t: 'solve for a missing base', g: (R, O) => { const u = UL(O).s, a = R.int(2, 10), B = a + R.int(2, 9), h = R.pick([2, 4, 3, 5, 6, 8]), A = (a + B) * h / 2, p = R.int(0, B - a), top = R.bool();
    if (!Number.isInteger(A * 2) || !Number.isInteger(A)) return again('III.8.06', 'd', R, O);
    const vis = V8.poly(trap(B, a, p, h), {labels: [top ? `${B} ${u}` : '?', '', top ? '?' : `${a} ${u}`], dashed: [{a: [p, h], b: [p, 0], text: `${h} ${u}`, foot: [[p, 0], [p, h], [B, 0]], away: [p - 1, h / 2]}]});
    return num(`The trapezoid has area ${A} ${u}². Find the missing base, in ${u}.`, top ? a : B, `${A} ÷ ${h} = ${fmt(A / h)} is the average of the bases, so they add to ${fmt(2 * A / h)}: ${fmt(2 * A / h)} ${M} ${top ? B : a} = ${top ? a : B} ${u}.`, {visual: vis}); } },
}});

const Lpts = (W, H, w2, h2) => [[0, 0], [W, 0], [W, H - h2], [W - w2, H - h2], [W - w2, H], [0, H]];
E3.skill({ id: 'III.8.07', name: 'Composite area', steps: {
  a: { t: 'decompose a shape', g: (R, O) => { const u = UL(O).s, W = R.int(6, 12), H = R.int(5, 10), w2 = R.int(2, W - 3), h2 = R.int(2, H - 2), vert = R.bool();
    const s = [W, H - h2, w2, h2, W - w2, H], labs = s.map(v => `${v} ${u}`);
    if (vert) { labs[3] = ''; labs[0] = R.bool() ? labs[0] : ''; const A1 = (W - w2) * H, A2 = w2 * (H - h2);
      return num(`The dashed line splits the shape into rectangles A and B. Find each area, in ${u}².`, [{label: 'A =', ans: A1}, {label: 'B =', ans: A2}], `A is ${W - w2} ${X} ${H} = ${A1}; B is ${w2} ${X} ${H - h2} = ${A2}.`,
        {visual: V8.poly(Lpts(W, H, w2, h2), {labels: labs, dashed: [{a: [W - w2, H - h2], b: [W - w2, 0], col: C.muted}], texts: [[[(W - w2) / 2, H / 2], 'A'], [[W - w2 / 2, (H - h2) / 2], 'B']]})}); }
    const A1 = W * (H - h2), A2 = (W - w2) * h2; labs[2] = ''; labs[5] = R.bool() ? labs[5] : '';
    return num(`The dashed line splits the shape into rectangles A and B. Find each area, in ${u}².`, [{label: 'A =', ans: A1}, {label: 'B =', ans: A2}], `A (bottom) is ${W} ${X} ${H - h2} = ${A1}; B (top) is ${W - w2} ${X} ${h2} = ${A2}.`,
      {visual: V8.poly(Lpts(W, H, w2, h2), {labels: labs, dashed: [{a: [0, H - h2], b: [W - w2, H - h2], col: C.muted}], texts: [[[W / 2, (H - h2) / 2], 'A'], [[(W - w2) / 2, H - h2 / 2], 'B']]})}); } },
  b: { t: 'add the parts', g: (R, O) => { const u = UL(O).s, k = R.int(0, 2);
    if (k === 0) { const W = R.int(7, 12), H = R.int(6, 10), w2 = R.int(3, W - 3), h2 = R.int(3, H - 3), s = [W, H - h2, w2, h2, W - w2, H];
      return num(`Find the area of the shape, in ${u}².`, W * H - w2 * h2, `Split it into 2 rectangles: ${W - w2} ${X} ${H} = ${(W - w2) * H} and ${w2} ${X} ${H - h2} = ${w2 * (H - h2)}; total ${W * H - w2 * h2} ${u}².`, {visual: V8.poly(Lpts(W, H, w2, h2), {labels: s.map(v => `${v} ${u}`)})}); }
    if (k === 1) { const w = R.pick([6, 8, 10, 12]), h = R.int(3, 8), t = R.int(3, w / 2 + 2), tri = w * t / 2;
      return num(`Find the area of the shape, in ${u}².`, w * h + tri, `Rectangle ${w} ${X} ${h} = ${w * h}, triangle ½ ${X} ${w} ${X} ${t} = ${tri}; total ${w * h + tri} ${u}².`,
        {visual: V8.poly([[0, 0], [w, 0], [w, h], [w / 2, h + t], [0, h]], {labels: [`${w} ${u}`, `${h} ${u}`], dashed: [{a: [0, h], b: [w, h], col: C.muted}, {a: [w / 2, h + t], b: [w / 2, h], col: C.red, text: `${t} ${u}`, away: [w / 2 - 1, h]}]})}); }
    const W = R.int(8, 14), a = R.int(2, 4), H = R.int(2, 4), stem = R.int(3, 7), x0 = R.int(1, W - a - 1);
    const pts = [[x0, 0], [x0 + a, 0], [x0 + a, stem], [W, stem], [W, stem + H], [0, stem + H], [0, stem], [x0, stem]];
    return num(`Find the area of the T-shape, in ${u}².`, W * H + a * stem, `Top bar ${W} ${X} ${H} = ${W * H}, stem ${a} ${X} ${stem} = ${a * stem}; total ${W * H + a * stem} ${u}².`, {visual: V8.poly(pts, {labels: [`${a} ${u}`, `${stem} ${u}`, '', `${H} ${u}`, `${W} ${u}`]})}); } },
  c: { t: 'subtract cut-outs', g: (R, O) => { const u = UL(O).s, k = R.int(0, 2), W = R.int(8, 16), H = R.int(6, 12);
    if (k === 0) { const w = R.int(2, W - 4), h = R.int(2, H - 3), x = R.int(1, W - w - 1), y = R.int(1, H - h - 1);
      const S0 = V8.poly([[0, 0], [W, 0], [W, H], [0, H]], {labels: [`${W} ${u}`, `${H} ${u}`], holes: [[[x, y], [x + w, y], [x + w, y + h], [x, y + h]]]});
      return num(`A ${W} by ${H} ${u} card has a ${w} by ${h} ${u} hole cut out. What area is left, in ${u}²?`, W * H - w * h, `Whole card ${W} ${X} ${H} = ${W * H}, minus the hole ${w} ${X} ${h} = ${w * h}: ${W * H - w * h} ${u}².`, {visual: S0}); }
    if (k === 1) { const b = R.pick([2, 4, 6].filter(v => v <= W - 2)), t = R.int(2, H - 2), x = R.int(1, W - b - 1);
      const pts = [[0, 0], [W, 0], [W, H], [x + b, H], [x + b / 2, H - t], [x, H], [0, H]];
      return num(`A triangle ${b} ${u} wide and ${t} ${u} deep is cut from a ${W} by ${H} ${u} rectangle. Find the area left, in ${u}².`, W * H - b * t / 2, `${W} ${X} ${H} = ${W * H}; the notch is ½ ${X} ${b} ${X} ${t} = ${b * t / 2}; ${W * H} ${M} ${b * t / 2} = ${W * H - b * t / 2} ${u}².`, {visual: V8.poly(pts, {labels: [`${W} ${u}`, `${H} ${u}`]})}); }
    const bw = R.int(1, 2), w = W - 2 * bw, h = H - 2 * bw;
    return num(`A ${W} by ${H} ${u} frame is ${bw} ${u} wide all round. What is the area of the frame itself, in ${u}²?`, W * H - w * h, `The opening is ${w} by ${h} = ${w * h}. Frame = ${W * H} ${M} ${w * h} = ${W * H - w * h} ${u}².`,
      {visual: V8.poly([[0, 0], [W, 0], [W, H], [0, H]], {labels: [`${W} ${u}`, `${H} ${u}`], holes: [[[bw, bw], [W - bw, bw], [W - bw, H - bw], [bw, H - bw]]]})}); } },
  d: { t: 'area on the coordinate plane', g: (R) => { const W = R.int(4, 8), H = R.int(4, 8), x0 = R.int(-6, 6 - W), y0 = R.int(-6, 6 - H);
    if (R.bool()) { const k = R.int(1, H - 1), j = R.int(1, W - 1);
      let P = [[0, 0], [W, k], [j, H]]; if (R.bool()) P = P.map(([x, y]) => [W - x, y]); if (R.bool()) P = P.map(([x, y]) => [x, H - y]);
      const T = [W * k / 2, (W - j) * (H - k) / 2, j * H / 2], A = W * H - T[0] - T[1] - T[2]; P = P.map(([x, y]) => [x + x0, y + y0]);
      return num('Find the area of the triangle, in square units.', A, `Box it in a ${W} ${X} ${H} rectangle (${W * H}). Subtract the corner triangles ${T.map(fmt).join(' + ')}: ${W * H} ${M} ${fmt(T[0] + T[1] + T[2])} = ${fmt(A)}.`,
        {visual: V.plane({polys: [P], points: P.map(([x, y], i) => [x, y, 'ABC'[i]])})}); }
    const a = R.int(1, W - 1), b = R.int(1, H - 1), c = R.int(1, W - 1), d = R.int(1, H - 1);
    const P = [[a, 0], [W, b], [c, H], [0, d]].map(([x, y]) => [x + x0, y + y0]);
    const T = [(W - a) * b / 2, (W - c) * (H - b) / 2, c * (H - d) / 2, a * d / 2], A = W * H - T.reduce((s, v) => s + v, 0);
    return num('Find the area of the shape, in square units.', A, `Box it in a ${W} ${X} ${H} rectangle (${W * H}). Subtract the 4 corner triangles ${T.map(fmt).join(' + ')}: ${W * H} ${M} ${fmt(W * H - A)} = ${fmt(A)}.`,
      {visual: V.plane({polys: [P], points: P.map(([x, y], i) => [x, y, 'ABCD'[i]])})}); } },
}});

/* =================== circles and solids: helpers =================== */
// circle: pts {A: angle°, ...} on the circle; segs [[P,Q,{text,col}]] ('O' = center); arc [P,Q,col] from P counterclockwise to Q
V8.circle = function (o = {}) {
  const S = Scene(), r = o.r || 80, O = [0, 0], pos = n => n === 'O' ? O : add(O, dir(o.pts[n]), r);
  S.raw(`<circle cx="0" cy="0" r="${r}" fill="${o.fill || C.teal + '18'}" stroke="${C.ink}" stroke-width="2.5"/>`, [[-r, -r], [r, r]]);
  if (o.arc) { const [P, Q, col] = o.arc, a1 = o.pts[P]; let a2 = o.pts[Q]; while (a2 <= a1) a2 += 360; const A = pos(P), B = pos(Q);
    S.raw(`<path d="M${P1(A[0])} ${P1(A[1])} A${r} ${r} 0 ${a2 - a1 > 180 ? 1 : 0} 0 ${P1(B[0])} ${P1(B[1])}" fill="none" stroke="${col || C.red}" stroke-width="5" stroke-linecap="round"/>`); }
  (o.segs || []).forEach(([P, Q, so = {}]) => { S.line(pos(P), pos(Q), {col: so.col || C.blue, w: 3}); if (so.text) sideLab(S, pos(P), pos(Q), so.text, so.away || null, {col: so.col || C.blue, weight: 700}); });
  if (o.center !== false) { S.dot(0, 0, 4); if (o.centerName) { const used = []; (o.segs || []).forEach(([P, Q]) => [P, Q].forEach(n => { if (n !== 'O') used.push(o.pts[n]); }));
    let best = 225, bd = -1; for (let a = 0; a < 360; a += 15) { const dd = Math.min(999, ...used.map(g => Math.abs(((a - g) % 360 + 540) % 360 - 180))); if (dd > bd) { bd = dd; best = a; } }
    const q = add([0, 0], dir(best), 17); S.text(q[0], q[1], o.centerName, {size: 16, weight: 700}); } }
  Object.keys(o.pts || {}).forEach(n => { if (o.hideNames) return; const q = add(O, dir(o.pts[n]), r + 15); S.dot(...add(O, dir(o.pts[n]), r), 4); S.text(q[0], q[1], n, {size: 16, weight: 700}); });
  return S.svg(o.label || 'circle');
};
// half (k=2) or quarter (k=4) circle of radius r px with the radius labelled
V8.part = function (k, text) {
  const S = Scene(), r = 90, sweep = k === 2 ? 180 : 90, E = add([0, 0], dir(sweep), r);
  S.raw(`<path d="M0 0 L${r} 0 A${r} ${r} 0 0 0 ${P1(E[0])} ${P1(E[1])} Z" fill="${C.teal}22" stroke="${C.ink}" stroke-width="2.5" stroke-linejoin="round"/>`, [[k === 2 ? -r : 0, -r], [r, 0]]);
  if (k === 4) rightSq(S, [0, 0], [r, 0], E, 12); else S.dot(0, 0, 4);
  S.line([0, 0], [r, 0], {col: C.blue, w: 3}); S.text(r / 2, 14, text, {size: 15, fill: C.blue, weight: 700});
  return S.svg(k === 2 ? 'half circle' : 'quarter circle');
};
// oblique projection for solids: depth y goes up and to the right
const OBK = 0.5, OBA = rad(35);
const proj = s => (x, y, z) => [(x + y * OBK * Math.cos(OBA)) * s, -(z + y * OBK * Math.sin(OBA)) * s];
const FILL = C.blue + '16';
// box l × w × h. o: l,w,h labels; grid (unit squares); diag: 'face'|'space'|'base'; diagText
V8.box = function (l, w, h, o = {}) {
  const s = o.s || Math.min((o.maxW || 250) / (l + w * OBK * Math.cos(OBA)), (o.maxH || 170) / (h + w * OBK * Math.sin(OBA))), T = proj(s), S = Scene();
  const v = (x, y, z) => T(x * l, y * w, z * h);
  S.poly([v(0, 0, 0), v(1, 0, 0), v(1, 0, 1), v(0, 0, 1)], {fill: FILL});
  S.poly([v(0, 0, 1), v(1, 0, 1), v(1, 1, 1), v(0, 1, 1)], {fill: C.blue + '0c'});
  S.poly([v(1, 0, 0), v(1, 1, 0), v(1, 1, 1), v(1, 0, 1)], {fill: C.blue + '26'});
  if (o.grid) { for (let i = 1; i < l; i++) { S.line(T(i, 0, 0), T(i, 0, h), {w: 1.2}); S.line(T(i, 0, h), T(i, w, h), {w: 1.2}); }
    for (let k = 1; k < h; k++) { S.line(T(0, 0, k), T(l, 0, k), {w: 1.2}); S.line(T(l, 0, k), T(l, w, k), {w: 1.2}); }
    for (let j = 1; j < w; j++) { S.line(T(0, j, h), T(l, j, h), {w: 1.2}); S.line(T(l, j, 0), T(l, j, h), {w: 1.2}); } }
  else [[v(0, 1, 0), v(1, 1, 0)], [v(0, 1, 0), v(0, 1, 1)], [v(0, 0, 0), v(0, 1, 0)]].forEach(([A, B]) => S.line(A, B, {w: 1.6, dash: '5 5', col: C.muted}));
  const cen = v(0.5, 0.5, 0.5);
  if (o.diag) { const D = o.diag === 'face' ? [v(0, 0, 0), v(1, 0, 1)] : o.diag === 'base' ? [v(0, 0, 0), v(1, 1, 0)] : [v(0, 0, 0), v(1, 1, 1)];
    if (o.diag === 'space' && o.base) S.line(v(0, 0, 0), v(1, 1, 0), {col: C.teal, w: 2.2, dash: '6 4'});
    S.line(D[0], D[1], {col: C.red, w: 3, dash: o.diag === 'face' ? false : '7 4'});
    if (o.diagText) { const M0 = mid(D[0], D[1]); S.text(M0[0] - 14, M0[1] - 12, o.diagText, {size: 16, fill: C.red, weight: 700, anchor: 'end'}); } }
  if (o.l) sideLab(S, v(0, 0, 0), v(1, 0, 0), o.l, cen);
  if (o.h) sideLab(S, v(0, 0, 0), v(0, 0, 1), o.h, cen);
  if (o.w) sideLab(S, v(1, 0, 0), v(1, 1, 0), o.w, cen);
  return S.svg(o.label || 'box');
};
// triangular prism: right triangle legs b (along x) and c (up), depth d. o: labels b,c,d,hyp
V8.triPrism = function (b, c, d, o = {}) {
  const s = Math.min(240 / (b + d * OBK * Math.cos(OBA)), 160 / (c + d * OBK * Math.sin(OBA))), T = proj(s), S = Scene();
  const F = [T(0, 0, 0), T(b, 0, 0), T(0, 0, c)], B = [T(0, d, 0), T(b, d, 0), T(0, d, c)];
  S.poly([F[1], B[1], B[2], F[2]], {fill: C.blue + '20'}); S.poly(F, {fill: FILL});
  [[B[0], B[1]], [B[0], B[2]], [F[0], B[0]]].forEach(([P, Q]) => S.line(P, Q, {w: 1.6, dash: '5 5', col: C.muted}));
  rightSq(S, F[0], F[1], F[2], 11);
  const cen = T(b / 3, d / 2, c / 3);
  if (o.b) sideLab(S, F[0], F[1], o.b, cen); if (o.c) sideLab(S, F[0], F[2], o.c, cen); if (o.d) sideLab(S, F[1], B[1], o.d, cen); if (o.hyp) sideLab(S, F[1], F[2], o.hyp, T(0, 0, 0));
  return S.svg('triangular prism');
};
// cylinder r × h (model). o: r, d, h labels
V8.cyl = function (r, h, o = {}) {
  const s = o.s || Math.min(170 / (2 * r), 170 / (h + 0.6 * r)), rx = r * s, ry = rx * 0.3, H = h * s, S = Scene();
  S.raw(`<rect x="${P1(-rx)}" y="${P1(-H)}" width="${P1(2 * rx)}" height="${P1(H)}" fill="${FILL}" stroke="none"/><ellipse cx="0" cy="0" rx="${P1(rx)}" ry="${P1(ry)}" fill="${FILL}" stroke="none"/>`, [[-rx, -H - ry], [rx, ry]]);
  S.raw(`<path d="M${P1(-rx)} 0 A${P1(rx)} ${P1(ry)} 0 0 0 ${P1(rx)} 0" fill="none" stroke="${C.ink}" stroke-width="2.5"/><path d="M${P1(-rx)} 0 A${P1(rx)} ${P1(ry)} 0 0 1 ${P1(rx)} 0" fill="none" stroke="${C.muted}" stroke-width="1.6" stroke-dasharray="5 5"/>`);
  S.raw(`<ellipse cx="0" cy="${P1(-H)}" rx="${P1(rx)}" ry="${P1(ry)}" fill="${C.blue}14" stroke="${C.ink}" stroke-width="2.5"/>`);
  S.line([-rx, 0], [-rx, -H]); S.line([rx, 0], [rx, -H]);
  if (o.d) { S.line([-rx, -H], [rx, -H], {col: C.red, w: 2.5}); S.text(0, -H - ry - 12, o.d, {fill: C.red, weight: 700}); }
  else if (o.r) { S.line([0, -H], [rx, -H], {col: C.red, w: 2.5}); S.dot(0, -H, 3.5); S.text(rx / 2, -H - ry - 12, o.r, {fill: C.red, weight: 700}); }
  if (o.h) S.text(rx + 10, -H / 2, o.h, {anchor: 'start', weight: 700});
  return S.svg('cylinder');
};
// cone r × h. o: r, h, l (slant) labels
V8.cone = function (r, h, o = {}) {
  const s = o.s || Math.min(220 / (2 * r), 170 / (h + 0.3 * r)), rx = r * s, ry = rx * 0.3, H = h * s, S = Scene();
  S.raw(`<path d="M${P1(-rx)} 0 L0 ${P1(-H)} L${P1(rx)} 0 A${P1(rx)} ${P1(ry)} 0 0 1 ${P1(-rx)} 0 Z" fill="${FILL}" stroke="none"/>`, [[-rx, -H], [rx, ry]]);
  S.raw(`<path d="M${P1(-rx)} 0 A${P1(rx)} ${P1(ry)} 0 0 0 ${P1(rx)} 0" fill="none" stroke="${C.ink}" stroke-width="2.5"/><path d="M${P1(-rx)} 0 A${P1(rx)} ${P1(ry)} 0 0 1 ${P1(rx)} 0" fill="none" stroke="${C.muted}" stroke-width="1.6" stroke-dasharray="5 5"/>`);
  S.line([-rx, 0], [0, -H]); S.line([rx, 0], [0, -H]);
  if (o.h !== undefined) { S.line([0, 0], [0, -H], {col: C.red, w: 2.2, dash: true}); rightSq(S, [0, 0], [0, -H], [rx, 0], 10); if (o.h) { const yc = H * 0.45, xTop = (1 - Math.min(1, (yc + 10) / H)) * rx, xBot = (1 - Math.max(0, (yc - 10) / H)) * rx, inside = tw(o.h) + 12 < xTop; S.text(inside ? -8 : -xBot - 6, -yc, o.h, {anchor: 'end', fill: C.red, weight: 700}); } }
  if (o.r !== undefined) { S.line([0, 0], [rx, 0], {col: C.blue, w: 2.5}); if (o.r) S.text(rx / 2, ry > 32 ? 16 : 0.87 * ry + 14, o.r, {fill: C.blue, weight: 700}); }
  S.dot(0, 0, 3);
  if (o.l) sideLab(S, [rx, 0], [0, -H], o.l, [0, 0]);
  return S.svg('cone');
};
V8.sphere = function (text, o = {}) {
  const r = o.r || 80, ry = r * 0.275, S = Scene();
  S.raw(`<circle cx="0" cy="0" r="${r}" fill="${FILL}" stroke="${C.ink}" stroke-width="2.5"/><path d="M${-r} 0 A${r} ${ry} 0 0 0 ${r} 0" fill="none" stroke="${C.ink}" stroke-width="1.8"/><path d="M${-r} 0 A${r} ${ry} 0 0 1 ${r} 0" fill="none" stroke="${C.muted}" stroke-width="1.6" stroke-dasharray="5 5"/>`, [[-r, -r], [r, r]]);
  S.dot(0, 0, 3.5); S.line([0, 0], [r * 0.7, -r * 0.71], {col: C.red, w: 2.5}); if (text) S.text(r * 0.35 - 6, -r * 0.355 - 10, text, {fill: C.red, weight: 700, anchor: 'end'});
  return S.svg('sphere');
};
// square pyramid base a, height H (model). o: a label, l (slant height) label, h label
V8.pyr = function (a, H, o = {}) {
  const s = Math.min(230 / (a + a * OBK * Math.cos(OBA)), 170 / (H + a * OBK * Math.sin(OBA))), T = proj(s), S = Scene();
  const b0 = T(0, 0, 0), b1 = T(a, 0, 0), b2 = T(a, a, 0), b3 = T(0, a, 0), ap = T(a / 2, a / 2, H), m = T(a / 2, 0, 0);
  S.poly([b0, b1, ap], {fill: FILL}); S.poly([b1, b2, ap], {fill: C.blue + '26'});
  [[b3, b2], [b3, b0], [b3, ap]].forEach(([P, Q]) => S.line(P, Q, {w: 1.6, dash: '5 5', col: C.muted}));
  if (o.l) { S.line(ap, m, {col: C.red, w: 2.2, dash: true}); rightSq(S, m, b1, ap, 9); const q = mid(m, ap), lx = (b0[0] + ap[0]) / 2 - 12; S.line([lx + 2, q[1]], [q[0] - 3, q[1]], {col: C.red, w: 1.2}); S.text(lx - 2, q[1], o.l, {anchor: 'end', fill: C.red, weight: 700}); }
  if (o.a) sideLab(S, b0, b1, o.a, ap);
  return S.svg('square pyramid');
};
// nets
V8.cubeNet = cells => { const z = 16, S = Scene(); cells.forEach(([c, r]) => S.raw(`<rect x="${c * z}" y="${r * z}" width="${z}" height="${z}" fill="${C.teal}44" stroke="${C.ink}" stroke-width="1.5"/>`, [[c * z, r * z], [c * z + z, r * z + z]])); return S.svg('net', 3); };
V8.boxNet = function (l, w, h, o = {}) {
  const R0 = [[0, 0, l, h], [0, h, l, w], [0, -w, l, w], [0, -w - h, l, h], [-w, 0, w, h], [l, 0, w, h]], s = Math.min(300 / (l + 2 * w), 300 / (2 * h + 2 * w)), S = Scene();
  const T = (x, y) => [x * s, -y * s];
  R0.forEach(([x, y, a, b], i) => S.poly([T(x, y), T(x + a, y), T(x + a, y + b), T(x, y + b)], {fill: i < 4 && i % 2 ? C.amber + '44' : i >= 4 ? C.teal + '44' : C.blue + '33', w: 2}));
  if (o.labels !== false) { sideLab(S, T(0, -w - h), T(l, -w - h), `${l}`, T(l / 2, 0)); sideLab(S, T(l + w, 0), T(l + w, h), `${h}`, T(0, 0)); sideLab(S, T(0, h), T(0, h + w), `${w}`, T(l, h)); }
  return S.svg('net of a box');
};
V8.pyrNet = function (a, l, ta, tl) {
  const s = 240 / (a + 2 * l), S = Scene(), T = (x, y) => [x * s, -y * s], h = a / 2;
  S.poly([T(-h, -h), T(h, -h), T(h, h), T(-h, h)], {fill: C.blue + '33'});
  [[[-h, h], [h, h], [0, h + l]], [[h, -h], [h, h], [h + l, 0]], [[-h, -h], [h, -h], [0, -h - l]], [[-h, -h], [-h, h], [-h - l, 0]]].forEach(t => S.poly(t.map(p => T(...p)), {fill: C.amber + '44'}));
  S.line(T(0, h), T(0, h + l), {col: C.red, w: 2.2, dash: true}); sideLab(S, T(0, h), T(0, h + l), tl, T(-1, h + l / 2), {col: C.red, weight: 700});
  sideLab(S, T(-h, -h), T(h, -h), ta, T(0, 0));
  return S.svg('net of a pyramid');
};
const U3 = O => UL(O).s; const sq = u => u + '²', cu = u => u + '³';
const piAns = (k, label) => ({label: label || 'number × π', ans: k});
const ap = v => Math.round(v * 1000) / 1000;   // exact-safe decimal for 3.14 products

/* =================== III.8.08 – III.8.10 circles =================== */
E3.skill({ id: 'III.8.08', name: 'Circle parts', steps: {
  a: { t: 'center, radius, diameter', g: (R) => { const a0 = R.int(0, 179), c0 = a0 + R.int(40, 140), pts = {A: a0, B: a0 + 180, C: c0};
    const names = R.shuffle(['A', 'B', 'C']); const P = {}; P[names[0]] = a0; P[names[1]] = a0 + 180; P[names[2]] = c0;
    const [dA, dB, rC] = names, vis = V8.circle({pts: P, segs: [[dA, dB], ['O', rC]], centerName: 'O'});
    const k = R.int(0, 2);
    if (k === 0) return choice(R, 'Which segment is a radius?', `O${rC}`, [`${dA}${dB}`, `${dA}${rC}`, `${rC}${dB}`], `A radius runs from the center O to the circle: O${rC}.`, {visual: vis});
    if (k === 1) return choice(R, 'Which segment is a diameter?', `${dA}${dB}`, [`O${rC}`, `O${dA}`, `${dA}${rC}`], `A diameter goes right across through the center: ${dA}${dB}.`, {visual: vis});
    return choiceFixed('What is point O?', ['The center', 'A radius', 'A diameter', 'An arc'], 0, 'O is the middle point, the same distance from every point on the circle: the center.', {visual: vis}); } },
  b: { t: 'd = 2r', g: (R, O) => { const u = U3(O), r = R.int(2, 40), k = R.int(0, 2);
    if (k === 0) return num(`The radius is ${r} ${u}. What is the diameter, in ${u}?`, 2 * r, `d = 2r = 2 ${X} ${r} = ${2 * r} ${u}.`, {visual: V8.circle({pts: {P: R.int(15, 60)}, segs: [['O', 'P', {text: `${r} ${u}`, away: [60, 60]}]], hideNames: true})});
    if (k === 1) return num(`The diameter is ${2 * r} ${u}. What is the radius, in ${u}?`, r, `r = d ÷ 2 = ${2 * r} ÷ 2 = ${r} ${u}.`);
    return choice(R, `A circle is ${2 * r} ${u} across. What is its radius?`, `${r} ${u}`, [`${4 * r} ${u}`, `${2 * r} ${u}`, `${r * 2 + 2} ${u}`], `The radius is half the diameter, not double it: ${2 * r} ÷ 2 = ${r} ${u}.`); } },
  c: { t: 'chord and arc names', g: (R) => { const a0 = R.int(10, 80), b0 = a0 + R.int(70, 130), c0 = b0 + R.int(40, 80), k = R.int(0, 2);
    const P = {A: a0, B: b0, C: c0}, vis = V8.circle({pts: P, segs: [['A', 'B']], arc: k === 1 ? ['A', 'B'] : null, centerName: 'O'});
    if (k === 0) return choice(R, 'What is the segment AB called?', 'A chord', ['A radius', 'A diameter', 'An arc'], 'AB joins two points on the circle but misses the center: a chord.', {visual: vis});
    if (k === 1) return choice(R, 'What is the red curved piece from A to B called?', 'An arc', ['A chord', 'A radius', 'A diameter'], 'A piece of the circle itself is an arc. The straight segment AB is a chord.', {visual: vis});
    return choice(R, 'What is the longest chord of a circle called?', 'The diameter', ['The radius', 'The arc', 'The circumference'], 'The chord through the center is the longest one: the diameter.'); } },
  d: { t: 'meaning of π as C ÷ d', g: (R, O) => { const u = U3(O), d = R.pick([10, 20, 25, 50, 100, 2, 4, 5, 40, 60]), k = R.int(0, 2);
    if (k === 0) return num(`A wheel is ${d} ${u} across and ${fmt(ap(3.14 * d))} ${u} around. What is C ÷ d?`, 3.14, `${fmt(ap(3.14 * d))} ÷ ${d} = 3.14, which is about π.`);
    if (k === 1) return choice(R, 'For every circle, circumference ÷ diameter is:', 'π, about 3.14', ['Exactly 3', 'About 2', 'Bigger for bigger circles'], 'Every circle is a scaled copy of every other, so C ÷ d is always the same number, π ≈ 3.14.');
    const r = d / 2; return num(`A circle has radius ${fmt(r)} ${u} and circumference ${fmt(ap(6.28 * r))} ${u}. What is C ÷ r?`, 6.28, `${fmt(ap(6.28 * r))} ÷ ${fmt(r)} = 6.28 = 2π, because the diameter is 2 radii.`); } },
}});


const circPic = (R, text, isD) => V8.circle({pts: {P: R.int(10, 50), Q: 0}, segs: [[isD ? 'Q' : 'O', 'P', {text}]].map(x => isD ? ['P', 'Q', x[2]] : x), hideNames: true});
const diamPic = (R, text) => { const a = R.int(0, 40); return V8.circle({pts: {P: a, Q: a + 180}, segs: [['P', 'Q', {text, away: add([0, 0], dir(a + 90), 40)}]], hideNames: true}); };
const radPic = (R, text) => V8.circle({pts: {P: R.int(10, 60)}, segs: [['O', 'P', {text, away: [60, 60]}]], hideNames: true});
E3.skill({ id: 'III.8.09', name: 'Circumference', steps: {
  a: { t: 'C = πd', g: (R, O) => { const u = U3(O), d = R.int(2, 30), k = R.int(0, 2);
    if (k === 0) return num(`The diameter is ${d} ${u}. Find the exact circumference: C = ?π`, d, `C = πd = π ${X} ${d} = ${d}π ${u}.`, {visual: diamPic(R, `${d} ${u}`)});
    if (k === 1) return num(`The diameter is ${d} ${u}. Find the circumference in ${u}, using π ≈ 3.14.`, ap(3.14 * d), `C = πd ≈ 3.14 ${X} ${d} = ${fmt(ap(3.14 * d))} ${u}.`, {visual: diamPic(R, `${d} ${u}`)});
    return choice(R, `A plate is ${d} ${u} across. About how far is it around?`, `${fmt(ap(3.14 * d))} ${u}`, [`${fmt(ap(6.28 * d))} ${u}`, `${fmt(ap(3.14 * d * d / 4))} ${u}`, `${fmt(ap(1.57 * d))} ${u}`], `With the diameter, don't double: C = πd ≈ 3.14 ${X} ${d} = ${fmt(ap(3.14 * d))} ${u}.`); } },
  b: { t: 'C = 2πr', g: (R, O) => { const u = U3(O), r = R.int(2, 25), k = R.int(0, 2);
    if (k === 0) return num(`The radius is ${r} ${u}. Find the exact circumference: C = ?π`, 2 * r, `C = 2πr = 2 ${X} π ${X} ${r} = ${2 * r}π ${u}.`, {visual: radPic(R, `${r} ${u}`)});
    if (k === 1) return num(`The radius is ${r} ${u}. Find the circumference in ${u}, using π ≈ 3.14.`, ap(6.28 * r), `C = 2πr ≈ 2 ${X} 3.14 ${X} ${r} = ${fmt(ap(6.28 * r))} ${u}.`, {visual: radPic(R, `${r} ${u}`)});
    return choice(R, `The radius is ${r} ${u}. What is the exact circumference?`, `${2 * r}π ${u}`, [`${r * r}π ${u}`, `${r}π ${u}`, `${4 * r}π ${u}`], `C = 2πr = ${2 * r}π. (πr² = ${r * r}π is the area, not the circumference.)`, {visual: radPic(R, `${r} ${u}`)}); } },
  c: { t: 'find r from C', g: (R, O) => { const u = U3(O), r = R.int(2, 30), k = R.int(0, 2);
    if (k === 0) return num(`A circle has circumference ${2 * r}π ${u}. Find its radius, in ${u}.`, r, `C = 2πr, so 2r = ${2 * r} and r = ${r} ${u}.`);
    if (k === 1) return num(`A circle has circumference ${fmt(ap(6.28 * r))} ${u}. Using π ≈ 3.14, find its radius, in ${u}.`, r, `r = C ÷ (2 ${X} 3.14) = ${fmt(ap(6.28 * r))} ÷ 6.28 = ${r} ${u}.`);
    return num(`A circle has circumference ${fmt(ap(3.14 * r))} ${u}. Using π ≈ 3.14, find its diameter, in ${u}.`, r, `d = C ÷ π = ${fmt(ap(3.14 * r))} ÷ 3.14 = ${r} ${u}.`); } },
  d: { t: 'exact (in π) vs approximate', g: (R, O) => { const u = U3(O), r = R.int(2, 20), k = R.int(0, 2);
    if (k === 0) return num(`Radius ${r} ${u}. Give the circumference exactly (?π) and using π ≈ 3.14.`, [{label: 'exact: ?π', ans: 2 * r}, {label: 'about', ans: ap(6.28 * r)}], `Exact: 2πr = ${2 * r}π. Approximate: ${2 * r} ${X} 3.14 = ${fmt(ap(6.28 * r))} ${u}.`, {visual: radPic(R, `${r} ${u}`)});
    if (k === 1) return choice(R, `Which is the EXACT circumference of a circle with diameter ${2 * r} ${u}?`, `${2 * r}π ${u}`, [`${fmt(ap(6.28 * r))} ${u}`, `${fmt(Math.round(6.2832 * r))} ${u}`, `${4 * r * r}π ${u}`], `Only ${2 * r}π is exact; 3.14 is a rounded value of π, so ${fmt(ap(6.28 * r))} is approximate.`);
    const A = 2 * r; return num(`A circle's exact circumference is ${A}π ${u}. Write it as a decimal using π ≈ 3.14.`, ap(3.14 * A), `${A} ${X} 3.14 = ${fmt(ap(3.14 * A))} ${u}.`); } },
}});

E3.skill({ id: 'III.8.10', name: 'Area of a circle', steps: {
  a: { t: 'A = πr²', g: (R, O) => { const u = U3(O), r = R.int(2, 15), k = R.int(0, 2);
    if (k === 0) return num(`The radius is ${r} ${u}. Find the exact area: A = ?π`, r * r, `A = πr² = π ${X} ${r}² = ${r * r}π ${sq(u)}.`, {visual: radPic(R, `${r} ${u}`)});
    if (k === 1) return num(`The radius is ${r} ${u}. Find the area in ${sq(u)}, using π ≈ 3.14.`, ap(3.14 * r * r), `A = πr² ≈ 3.14 ${X} ${r * r} = ${fmt(ap(3.14 * r * r))} ${sq(u)}.`, {visual: radPic(R, `${r} ${u}`)});
    return choice(R, `The radius is ${r} ${u}. What is the exact area?`, `${r * r}π ${sq(u)}`, [`${r * r}π² ${sq(u)}`, `${2 * r}π ${sq(u)}`, `${4 * r * r}π ${sq(u)}`], `Square only the radius: π ${X} ${r}² = ${r * r}π, not (π${r})² = ${r * r}π².`, {visual: radPic(R, `${r} ${u}`)}); } },
  b: { t: 'from a diameter', g: (R, O) => { const u = U3(O), r = R.int(2, 15), d = 2 * r, k = R.int(0, 2);
    if (k === 0) return num(`The diameter is ${d} ${u}. Find the exact area: A = ?π`, r * r, `Halve first: r = ${r}. A = π ${X} ${r}² = ${r * r}π ${sq(u)}.`, {visual: diamPic(R, `${d} ${u}`)});
    if (k === 1) return num(`The diameter is ${d} ${u}. Find the area in ${sq(u)}, using π ≈ 3.14.`, ap(3.14 * r * r), `r = ${r}, so A ≈ 3.14 ${X} ${r * r} = ${fmt(ap(3.14 * r * r))} ${sq(u)}.`, {visual: diamPic(R, `${d} ${u}`)});
    return choice(R, `The diameter is ${d} ${u}. What is the exact area?`, `${r * r}π ${sq(u)}`, [`${d * d}π ${sq(u)}`, `${d}π ${sq(u)}`, `${2 * d}π ${sq(u)}`], `Use the radius, not the diameter: r = ${r}, A = ${r * r}π ${sq(u)}.`, {visual: diamPic(R, `${d} ${u}`)}); } },
  c: { t: 'half and quarter circles', g: (R, O) => { const u = U3(O), k = R.pick([2, 4]), r = k === 4 ? R.pick([2, 4, 6, 8, 10, 12, 3, 5]) : R.int(2, 14), co = r * r / k, nm = k === 2 ? 'half circle' : 'quarter circle';
    if (R.bool(0.6)) return num(`Find the exact area of the ${nm}: A = ?π`, co, `A whole circle is ${r * r}π; ${k === 2 ? 'half' : 'a quarter'} of it is ${fmt(co)}π ${sq(u)}.`, {visual: V8.part(k, `${r} ${u}`)});
    return num(`Find the area of the ${nm} in ${sq(u)}, using π ≈ 3.14.`, ap(3.14 * co), `(3.14 ${X} ${r * r}) ÷ ${k} = ${fmt(ap(3.14 * co))} ${sq(u)}.`, {visual: V8.part(k, `${r} ${u}`)}); } },
  d: { t: 'find r from area', g: (R, O) => { const u = U3(O), r = R.int(2, 15), k = R.int(0, 2);
    if (k === 0) return num(`A circle has area ${r * r}π ${sq(u)}. Find its radius, in ${u}.`, r, `r² = ${r * r}, so r = √${r * r} = ${r} ${u}.`);
    if (k === 1) return num(`A circle has area ${fmt(ap(3.14 * r * r))} ${sq(u)}. Using π ≈ 3.14, find its radius, in ${u}.`, r, `r² = ${fmt(ap(3.14 * r * r))} ÷ 3.14 = ${r * r}, so r = ${r} ${u}.`);
    return num(`A circle has area ${r * r}π ${sq(u)}. Find its diameter, in ${u}.`, 2 * r, `r² = ${r * r}, so r = ${r} and d = ${2 * r} ${u}.`); } },
}});

/* =================== III.8.11 – III.8.14 surface area and volume =================== */
const NET_OK = (i, j) => [[0, 1], [1, 1], [2, 1], [3, 1], [i, 0], [j, 2]];
const NET_BAD = R => R.pick([
  () => { const [i, j] = R.sample([0, 1, 2, 3], 2); return [[0, 1], [1, 1], [2, 1], [3, 1], [i, 0], [j, 0]]; },
  () => [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1]],
  () => { const i = R.int(0, 4); return [[0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [i, 0]]; },
  () => { const [i, j] = R.sample([0, 1, 2, 3], 2); return [[0, 1], [1, 1], [2, 1], [3, 1], [i, 2], [j, 2]]; },
])();
E3.skill({ id: 'III.8.11', name: 'Surface area of prisms', steps: {
  a: { t: 'draw a net', g: (R) => { const k = R.int(0, 2);
    if (k === 0) { const good = V8.cubeNet(NET_OK(R.int(0, 3), R.int(0, 3))); const bad = []; let t = 0; while (bad.length < 3 && t++ < 50) { const b = V8.cubeNet(NET_BAD(R)); if (!bad.includes(b)) bad.push(b); }
      return choice(R, 'Which net folds into a cube?', good, bad, 'A cube net has a strip of 4 faces that wrap around, with one face on each side of the strip: a lid and a base.'); }
    if (k === 1) { const [nm, f, why] = R.pick([['a triangular prism', 5, '2 triangles + 3 rectangles'], ['a square pyramid', 5, '1 square + 4 triangles'], ['a box (rectangular prism)', 6, '3 pairs of rectangles'], ['a cube', 6, '6 squares'], ['a triangular pyramid', 4, '4 triangles'], ['a pentagonal prism', 7, '2 pentagons + 5 rectangles']]);
      return num(`How many faces are in the net of ${nm}?`, f, `${nm[0].toUpperCase() + nm.slice(1)} has ${f} faces: ${why}.`); }
    const l = R.int(3, 8), w = R.int(2, 5), h = R.int(2, 6); if (l === w || w === h || l === h) return again('III.8.11', 'a', R);
    return num(`This net folds into a box. How many of its faces measure ${l} by ${w}?`, 2, `A box has 3 pairs of matching faces; the top and bottom are both ${l} by ${w}.`, {visual: V8.boxNet(l, w, h)}); } },
  b: { t: 'area of each face', g: (R, O) => { const u = U3(O), l = R.int(3, 12), w = R.int(2, 9), h = R.int(2, 10);
    return num(`Find the area of each different face of the box, in ${sq(u)}.`, [{label: `front (${l} ${X} ${h})`, ans: l * h}, {label: `top (${l} ${X} ${w})`, ans: l * w}, {label: `side (${w} ${X} ${h})`, ans: w * h}], `Front ${l} ${X} ${h} = ${l * h}, top ${l} ${X} ${w} = ${l * w}, side ${w} ${X} ${h} = ${w * h}. Each appears twice.`,
      {visual: V8.box(l, w, h, {l: `${l} ${u}`, w: `${w} ${u}`, h: `${h} ${u}`})}); } },
  c: { t: 'total surface area', g: (R, O) => { const u = U3(O), k = R.int(0, 3);
    if (k === 3) { const [a, b, c] = R.pick(SMALLTRI.slice(0, 4)), d = R.int(3, 12), SA = a * b + (a + b + c) * d;
      return num(`Find the surface area of the triangular prism, in ${sq(u)}.`, SA, `2 triangles: 2 ${X} ½ ${X} ${a} ${X} ${b} = ${a * b}. 3 rectangles: (${a} + ${b} + ${c}) ${X} ${d} = ${(a + b + c) * d}. Total ${SA} ${sq(u)}.`, {visual: V8.triPrism(a, b, d, {b: `${a} ${u}`, c: `${b} ${u}`, d: `${d} ${u}`, hyp: `${c} ${u}`})}); }
    const cube = k === 2, l = R.int(2, 10), w = cube ? l : R.int(2, 8), h = cube ? l : R.int(2, 9), SA = 2 * (l * w + l * h + w * h), V = l * w * h;
    const ex = `SA = 2(${l} ${X} ${w} + ${l} ${X} ${h} + ${w} ${X} ${h}) = 2 ${X} ${l * w + l * h + w * h} = ${SA} ${sq(u)}.`, vis = V8.box(l, w, h, {l: `${l} ${u}`, w: `${w} ${u}`, h: `${h} ${u}`});
    if (k === 1) return choice(R, 'What is the surface area of the box?', `${SA} ${sq(u)}`, [`${V} ${sq(u)}`, `${SA / 2} ${sq(u)}`, `${l * w + l * h + w * h + l * w} ${sq(u)}`], ex + ` (${V} is the volume.)`, {visual: vis});
    return num(`Find the surface area of the ${cube ? 'cube' : 'box'}, in ${sq(u)}.`, SA, cube ? `6 faces of ${l} ${X} ${l} = ${l * l}: 6 ${X} ${l * l} = ${SA} ${sq(u)}.` : ex, {visual: vis}); } },
  d: { t: 'pyramids by net', g: (R, O) => { const u = U3(O), a = R.int(2, 12), l = R.int(3, 14), SA = a * a + 2 * a * l;
    const ex = `Base ${a} ${X} ${a} = ${a * a}; 4 triangles of ½ ${X} ${a} ${X} ${l} = ${fmt(a * l / 2)}, total ${2 * a * l}. SA = ${SA} ${sq(u)}.`;
    if (R.bool()) return num(`Find the surface area of the square pyramid from its net, in ${sq(u)}.`, SA, ex, {visual: V8.pyrNet(a, l, `${a} ${u}`, `${l} ${u}`)});
    const H = Math.sqrt(l * l - a * a / 4); if (!(H > 1)) return again('III.8.11', 'd', R, O);
    return num(`The square pyramid has slant height ${l} ${u}. Find its surface area, in ${sq(u)}.`, SA, ex, {visual: V8.pyr(a, H, {a: `${a} ${u}`, l: `${l} ${u}`})}); } },
}});

const frS = (n, d) => { const w = Math.floor(n / d), r = n % d, g = { '1/2': '½', '1/4': '¼', '3/4': '¾' }[r ? E3.reduce(r, d).join('/') : ''] || ''; return r ? (w ? w : '') + g : String(w); };
const frH = (n, d) => { const [a, b] = E3.reduce(n, d); return b === 1 ? String(a) : a > b ? fh(a % b, b, Math.floor(a / b)) : fh(a, b); };
E3.skill({ id: 'III.8.12', name: 'Volume of prisms', steps: {
  a: { t: 'count unit cubes', g: (R) => { const l = R.int(2, 5), w = R.int(2, 4), h = R.int(2, 4), vis = V8.box(l, w, h, {grid: true});
    if (R.bool()) return num('The box is packed with unit cubes. How many cubes are there?', [{label: 'in the bottom layer', ans: l * w}, {label: 'layers', ans: h}, {label: 'total', ans: l * w * h}], `Bottom layer ${l} ${X} ${w} = ${l * w}; ${h} layers: ${l * w} ${X} ${h} = ${l * w * h} cubes.`, {visual: vis});
    return num('The box is packed with unit cubes. How many cubes are there?', l * w * h, `${l} ${X} ${w} = ${l * w} in a layer, ${h} layers: ${l * w * h} cubes. Count the hidden ones too.`, {visual: vis}); } },
  b: { t: 'base area × height', g: (R, O) => { const u = U3(O), k = R.int(0, 2);
    if (k === 0) { const [a, b] = R.pick([[3, 4], [6, 8], [5, 12], [4, 6], [2, 5], [4, 10]]), d = R.int(3, 12), B = a * b / 2;
      return num(`Find the base area and the volume of the prism.`, [{label: `base area (${sq(u)})`, ans: B}, {label: `volume (${cu(u)})`, ans: B * d}], `Base triangle ½ ${X} ${a} ${X} ${b} = ${B}. V = ${B} ${X} ${d} = ${B * d} ${cu(u)}.`, {visual: V8.triPrism(a, b, d, {b: `${a} ${u}`, c: `${b} ${u}`, d: `${d} ${u}`})}); }
    if (k === 1) { const B = R.int(6, 60), h = R.int(2, 15); return num(`A prism has a base area of ${B} ${sq(u)} and a height of ${h} ${u}. Find its volume, in ${cu(u)}.`, B * h, `V = Bh = ${B} ${X} ${h} = ${B * h} ${cu(u)}.`); }
    const l = R.int(2, 15), w = R.int(2, 10), h = R.int(2, 12);
    return num(`Find the volume of the box, in ${cu(u)}.`, l * w * h, `V = l ${X} w ${X} h = ${l} ${X} ${w} ${X} ${h} = ${l * w * h} ${cu(u)}.`, {visual: V8.box(l, w, h, {l: `${l} ${u}`, w: `${w} ${u}`, h: `${h} ${u}`})}); } },
  c: { t: 'fractional edge lengths', g: (R, O) => { const u = U3(O);
    // edges in quarters: numerators over 4
    const pickE = () => R.pick([2, 6, 10, 3, 5, 8, 12, 4, 7, 9]), e = [pickE(), pickE(), pickE()]; if (e.every(v => v % 4 === 0)) return again('III.8.12', 'c', R, O);
    if (e.some(v => v % 4 && ![2, 1, 3].includes(v % 4))) return again('III.8.12', 'c', R, O);
    const n = e[0] * e[1] * e[2], d = 64, labs = e.map(v => `${frS(v, 4)} ${u}`);
    const vis = V8.box(e[0] / 4, e[1] / 4, e[2] / 4, {l: labs[0], w: labs[1], h: labs[2]});
    return num(`Find the volume of the box, in ${cu(u)}. A fraction, mixed number or decimal is fine.`, [Object.assign(frac(n, d), {})], `V = ${e.map(v => frH(v, 4)).join(` ${X} `)} = ${frH(n, d)} ${cu(u)}.`, {visual: vis}); } },
  d: { t: 'missing dimension', g: (R, O) => { const u = U3(O), l = R.int(2, 12), w = R.int(2, 9), h = R.int(2, 10), V = l * w * h, k = R.int(0, 2);
    if (k === 0) return num(`A box has volume ${V} ${cu(u)}. Find the missing height, in ${u}.`, h, `l ${X} w = ${l} ${X} ${w} = ${l * w}, so h = ${V} ÷ ${l * w} = ${h} ${u}.`, {visual: V8.box(l, w, h, {l: `${l} ${u}`, w: `${w} ${u}`, h: '?'})});
    if (k === 1) return num(`A box has volume ${V} ${cu(u)}. Find the missing length, in ${u}.`, l, `w ${X} h = ${w} ${X} ${h} = ${w * h}, so l = ${V} ÷ ${w * h} = ${l} ${u}.`, {visual: V8.box(l, w, h, {l: '?', w: `${w} ${u}`, h: `${h} ${u}`})});
    const B = R.int(5, 40); return num(`A prism has volume ${B * h} ${cu(u)} and base area ${B} ${sq(u)}. How tall is it, in ${u}?`, h, `h = V ÷ B = ${B * h} ÷ ${B} = ${h} ${u}.`); } },
}});

E3.skill({ id: 'III.8.13', name: 'Volume of cylinders', steps: {
  a: { t: 'base is a circle', g: (R, O) => { const u = U3(O), r = R.int(1, 9), h = R.int(2, 12), k = R.int(0, 2);
    if (k === 0) return choice(R, 'What shape is the base of a cylinder?', 'A circle', ['A rectangle', 'A square', 'A triangle'], 'A cylinder has 2 equal circles as its bases, joined by a curved side.', {visual: V8.cyl(r, h, {})});
    if (k === 1) return num(`Find the exact area of the cylinder's base: ?π ${sq(u)}`, r * r, `The base is a circle: πr² = π ${X} ${r}² = ${r * r}π ${sq(u)}.`, {visual: V8.cyl(r, h, {r: `${r} ${u}`, h: `${h} ${u}`})});
    const B = R.int(5, 50); return num(`A cylinder's circular base has area ${B} ${sq(u)}. Its height is ${h} ${u}. Find its volume, in ${cu(u)}.`, B * h, `V = base area ${X} height = ${B} ${X} ${h} = ${B * h} ${cu(u)}.`); } },
  b: { t: 'V = πr²h', g: (R, O) => { const u = U3(O), r = R.int(1, 10), h = R.int(2, 15), vis = V8.cyl(r, h, {r: `${r} ${u}`, h: `${h} ${u}`});
    if (R.bool(0.6)) return num(`Find the exact volume of the cylinder: V = ?π ${cu(u)}`, r * r * h, `V = πr²h = π ${X} ${r * r} ${X} ${h} = ${r * r * h}π ${cu(u)}.`, {visual: vis});
    return num(`Find the volume of the cylinder in ${cu(u)}, using π ≈ 3.14.`, ap(3.14 * r * r * h), `V = πr²h ≈ 3.14 ${X} ${r * r} ${X} ${h} = ${fmt(ap(3.14 * r * r * h))} ${cu(u)}.`, {visual: vis}); } },
  c: { t: 'from diameter', g: (R, O) => { const u = U3(O), r = R.int(1, 8), d = 2 * r, h = R.int(2, 15), vis = V8.cyl(r, h, {d: `${d} ${u}`, h: `${h} ${u}`});
    if (R.bool(0.35)) return choice(R, 'What is the exact volume of the cylinder?', `${r * r * h}π ${cu(u)}`, [`${d * d * h}π ${cu(u)}`, `${d * h}π ${cu(u)}`, `${r * h}π ${cu(u)}`], `Halve the diameter: r = ${r}. V = π ${X} ${r * r} ${X} ${h} = ${r * r * h}π ${cu(u)}.`, {visual: vis});
    return num(`Find the exact volume of the cylinder: V = ?π ${cu(u)}`, r * r * h, `r = ${d} ÷ 2 = ${r}. V = π ${X} ${r * r} ${X} ${h} = ${r * r * h}π ${cu(u)}.`, {visual: vis}); } },
  d: { t: 'word problems with units', g: (R, O) => { const met = metric(O), k = R.int(0, 2);
    if (k === 0) { const d = R.pick([6, 8, 10, 12]), h = R.int(8, 16), r = d / 2, u = met ? 'cm' : 'in';
      return num(`A can is ${d} ${u} across and ${h} ${u} tall. How much does it hold, in ${cu(u)}? Use π ≈ 3.14.`, ap(3.14 * r * r * h), `r = ${r}, V ≈ 3.14 ${X} ${r * r} ${X} ${h} = ${fmt(ap(3.14 * r * r * h))} ${cu(u)}.`); }
    if (k === 1) { const r = R.int(1, 3), h = R.int(2, 6), u = met ? 'm' : 'ft';
      return num(`A round water tank has radius ${r} ${u} and height ${h} ${u}. Find its volume in ${cu(u)}, using π ≈ 3.14.`, ap(3.14 * r * r * h), `V ≈ 3.14 ${X} ${r}² ${X} ${h} = ${fmt(ap(3.14 * r * r * h))} ${cu(u)}.`); }
    const r = R.int(2, 5), h = R.int(5, 20);
    if (met) return num(`A glass is a cylinder with radius ${r} cm and height ${h} cm. How many mL does it hold? (1 cm³ = 1 mL; use π ≈ 3.14)`, ap(3.14 * r * r * h), `V ≈ 3.14 ${X} ${r * r} ${X} ${h} = ${fmt(ap(3.14 * r * r * h))} cm³ = ${fmt(ap(3.14 * r * r * h))} mL.`);
    return num(`A pipe is ${h} ft long with a radius of ${r} in. Find its volume in in³, using π ≈ 3.14. (1 ft = 12 in)`, ap(3.14 * r * r * h * 12), `Length ${h} ${X} 12 = ${12 * h} in. V ≈ 3.14 ${X} ${r * r} ${X} ${12 * h} = ${fmt(ap(3.14 * r * r * h * 12))} in³.`); } },
}});

E3.skill({ id: 'III.8.14', name: 'Volume of cones & spheres', steps: {
  a: { t: 'cone = ⅓ cylinder', g: (R, O) => { const u = U3(O), Vc = R.int(4, 40) * 3, k = R.int(0, 2), r = R.int(2, 5), h = R.int(4, 9), sc = Math.min(150 / (2 * r), 150 / (h + 0.6 * r));
    if (k === 0) return num(`A cylinder holds ${Vc} ${cu(u)}. A cone has the same base and height. How much does the cone hold, in ${cu(u)}?`, Vc / 3, `A cone is ⅓ of its cylinder: ${Vc} ÷ 3 = ${Vc / 3} ${cu(u)}.`, {visual: V.side([V8.cyl(r, h, {s: sc}), V8.cone(r, h, {s: sc})])});
    if (k === 1) return num(`A cone holds ${Vc / 3} ${cu(u)}. How much does a cylinder with the same base and height hold, in ${cu(u)}?`, Vc, `The cylinder is 3 times the cone: 3 ${X} ${Vc / 3} = ${Vc} ${cu(u)}.`, {visual: V.side([V8.cone(r, h, {s: sc}), V8.cyl(r, h, {s: sc})])});
    return choice(R, 'How many cones of water fill a cylinder with the same base and height?', '3', ['2', '4', '1½'], 'A cone is a third of its cylinder, not a half: 3 cones fill it.', {visual: V.side([V8.cone(r, h, {s: sc}), V8.cyl(r, h, {s: sc})])}); } },
  b: { t: 'V = ⅓πr²h', g: (R, O) => { const u = U3(O), r = R.int(1, 9), h = R.int(2, 15); if ((r * r * h) % 3) return again('III.8.14', 'b', R, O);
    const co = r * r * h / 3, vis = V8.cone(r, h, {r: `${r} ${u}`, h: `${h} ${u}`});
    if (R.bool(0.3)) return choice(R, 'What is the exact volume of the cone?', `${co}π ${cu(u)}`, [`${r * r * h}π ${cu(u)}`, `${fmt(r * r * h / 2)}π ${cu(u)}`, `${fmt(r * h / 3)}π ${cu(u)}`], `V = ⅓πr²h = ⅓ ${X} ${r * r} ${X} ${h} ${X} π = ${co}π ${cu(u)}.`, {visual: vis});
    return num(`Find the exact volume of the cone: V = ?π ${cu(u)}`, co, `V = ⅓ ${X} π ${X} ${r}² ${X} ${h} = ${r * r * h}π ÷ 3 = ${co}π ${cu(u)}.`, {visual: vis}); } },
  c: { t: 'V = ⁴⁄₃πr³', g: (R, O) => { const u = U3(O), k = R.int(0, 2);
    if (k === 0) { const r = R.pick([3, 6, 9, 12, 15]); return num(`Find the exact volume of the sphere: V = ?π ${cu(u)}`, 4 * r ** 3 / 3, `V = ⁴⁄₃πr³ = ⁴⁄₃ ${X} ${r ** 3}π = ${4 * r ** 3 / 3}π ${cu(u)}.`, {visual: V8.sphere(`${r} ${u}`)}); }
    if (k === 1) { const r = R.pick([1, 2, 4, 5, 7, 8, 10]); return num(`Find the exact volume of the sphere: V = ?π ${cu(u)}. A fraction is fine.`, [frac(4 * r ** 3, 3)], `V = ⁴⁄₃ ${X} ${r}³ ${X} π = ⁴⁄₃ ${X} ${r ** 3}π = ${frH(4 * r ** 3, 3)}π ${cu(u)}.`, {visual: V8.sphere(`${r} ${u}`)}); }
    const r = R.pick([3, 6, 9, 12]); return choice(R, 'What is the exact volume of the sphere?', `${4 * r ** 3 / 3}π ${cu(u)}`, [`${4 * r * r / 3}π ${cu(u)}`, `${4 * r ** 3}π ${cu(u)}`, `${r ** 3}π ${cu(u)}`], `A sphere uses r³: ⁴⁄₃ ${X} ${r ** 3}π = ${4 * r ** 3 / 3}π ${cu(u)}.`, {visual: V8.sphere(`${r} ${u}`)}); } },
  d: { t: 'compare the three solids', g: (R, O) => { const u = U3(O), r = R.pick([3, 6, 9, 12]), k = R.int(0, 2), cyl = 2 * r ** 3, cone = 2 * r ** 3 / 3, sph = 4 * r ** 3 / 3;
    const sc = 55 / r, vis = V.side([V8.cone(r, 2 * r, {s: sc}), V8.sphere('', {r: 55}), V8.cyl(r, 2 * r, {s: sc})]);
    if (k === 0) return num(`A cone, a sphere and a cylinder all have radius ${r} ${u} and height ${2 * r} ${u}. Find each exact volume, as ?π.`, [{label: 'cone', ans: cone}, {label: 'sphere', ans: sph}, {label: 'cylinder', ans: cyl}], `Cone ⅓ ${X} ${r * r} ${X} ${2 * r} = ${cone}; sphere ⁴⁄₃ ${X} ${r ** 3} = ${sph}; cylinder ${r * r} ${X} ${2 * r} = ${cyl}. Ratio 1 : 2 : 3.`, {visual: vis});
    if (k === 1) return num(`A cylinder of radius r and height 2r holds ${cyl}π ${cu(u)}. A sphere of radius r fits inside. What is the sphere's volume? ?π ${cu(u)}`, sph, `Cone : sphere : cylinder = 1 : 2 : 3, so the sphere is ⅔ of ${cyl}π = ${sph}π ${cu(u)}.`, {visual: vis});
    return choiceFixed('Same radius, and height = diameter. Which list goes from smallest to largest volume?', ['cone, sphere, cylinder', 'sphere, cone, cylinder', 'cylinder, sphere, cone', 'cone, cylinder, sphere'], 0, 'Their volumes are in the ratio 1 : 2 : 3: cone, then sphere, then cylinder.', {visual: vis}); } },
}});

/* =================== III.8.15 – III.8.18 Pythagoras =================== */
const ROTS = [0, 0, 0, 90, 180, 270, 20, -25, 200, 110, 160];
const turnP = (P, a) => P.map(([x, y]) => [x * Math.cos(rad(a)) - y * Math.sin(rad(a)), x * Math.sin(rad(a)) + y * Math.cos(rad(a))]);
// right triangle: right angle at vertex 0, leg a on edge 0→1, hypotenuse edge 1→2, leg b on edge 2→0
const rtri = (a, b, rot = 0, flip = false) => turnP([[0, 0], [a, 0], [0, b]].map(([x, y]) => [flip ? -x : x, y]), rot);
V8.rt = (a, b, labs, o = {}) => V8.poly(rtri(a, b, o.rot || 0, o.flip), {labels: labs, right: [0], names: o.names, maxW: o.maxW || 250, maxH: o.maxH || 165, label: 'right triangle'});
const rtPic = (R, a, b, labs, names) => V8.rt(a, b, labs, {rot: R.pick(ROTS), flip: R.bool(), names});
// two legs whose squares add to a non-square
const nonTri = (R, lo, hi) => { for (let t = 0; t < 200; t++) { const a = R.int(lo, hi), b = R.int(lo, hi); if (!isSq(a * a + b * b)) return [a, b]; } return [2, 3]; };
// hypotenuse c and leg a with c² − a² not a square
const nonTriLeg = (R, lo, hi) => { for (let t = 0; t < 200; t++) { const c = R.int(lo, hi), a = R.int(2, c - 1); if (!isSq(c * c - a * a)) return [c, a]; } return [7, 3]; };
const sqrtTxt = n => `√${n}`;
const tripTxt = t => t.join(', ');
const LETTERS = [['A', 'B', 'C'], ['P', 'Q', 'R'], ['X', 'Y', 'Z'], ['D', 'E', 'F'], ['K', 'L', 'M']];

E3.skill({ id: 'III.8.15', name: 'Pythagorean theorem', steps: {
  a: { t: 'name legs and hypotenuse', g: (R) => { const [a0, b0, c] = R.pick(TRIPLES.slice(0, 9)), sw = R.bool(), a = sw ? b0 : a0, b = sw ? a0 : b0, nm = R.shuffle(R.pick(LETTERS)), k = R.int(0, 3);
    const hyp = nm[1] + nm[2], legs = [nm[0] + nm[1], nm[0] + nm[2]], vis = rtPic(R, a, b, [], nm);
    if (k === 0) return choice(R, 'Which side is the hypotenuse?', hyp, legs, `The hypotenuse is the side opposite the right angle at ${nm[0]}: ${hyp}. It is always the longest side.`, {visual: vis});
    if (k === 1) return choice(R, 'Which two sides are the legs?', `${legs[0]} and ${legs[1]}`, [`${legs[0]} and ${hyp}`, `${legs[1]} and ${hyp}`], `The legs are the two sides that meet at the right angle, ${nm[0]}: ${legs[0]} and ${legs[1]}.`, {visual: vis});
    if (k === 2) return choice(R, 'Which length is the hypotenuse?', String(c), [String(a), String(b)], `The hypotenuse is opposite the right angle: ${c}. It is longer than either leg.`, {visual: rtPic(R, a, b, [String(a), String(c), String(b)])});
    return choice(R, `In ${m('a^2 + b^2 = c^2')}, what is ${m('c')}?`, 'The hypotenuse', ['Any side', 'The shortest side', 'The bottom side'], `${m('c')} is always the hypotenuse, the side opposite the right angle; ${m('a')} and ${m('b')} are the legs.`); } },
  b: { t: 'a² + b² = c² for c', g: (R, O) => { const u = UL(O).s, k = R.int(0, 3);
    if (k <= 1) { const [a0, b0, c] = R.pick(TRIPLES), sw = R.bool(), a = sw ? b0 : a0, b = sw ? a0 : b0, vis = rtPic(R, a, b, [`${a} ${u}`, 'c', `${b} ${u}`]);
      const ex = `c² = ${a}² + ${b}² = ${a * a} + ${b * b} = ${c * c}, so c = √${c * c} = ${c} ${u}.`;
      if (k === 0) return num(`Find the hypotenuse c, in ${u}.`, c, ex, {visual: vis});
      return choice(R, 'Find the hypotenuse c.', `${c} ${u}`, [`${a + b} ${u}`, `${a * a + b * b} ${u}`, `${Math.abs(b - a) || a + 1} ${u}`], ex + ` Adding the legs (${a + b}) skips the squares.`, {visual: vis}); }
    const [a, b] = nonTri(R, 2, 12), s = a * a + b * b, vis = rtPic(R, a, b, [`${a} ${u}`, 'c', `${b} ${u}`]);
    if (k === 2) return num(`Find c², then c rounded to 1 decimal place.`, [{label: 'c² =', ans: s}, {label: 'c ≈', ans: dp1(Math.sqrt(s))}], `c² = ${a * a} + ${b * b} = ${s}, and √${s} ≈ ${fmt(dp1(Math.sqrt(s)))} ${u}.`, {visual: vis});
    return choice(R, 'What is the exact length of the hypotenuse c?', `${sqrtTxt(s)} ${u}`, [`${a + b} ${u}`, `${s} ${u}`, `${sqrtTxt(Math.abs(b * b - a * a) || s + 1)} ${u}`], `c² = ${a}² + ${b}² = ${s}, so c = √${s} ${u} (about ${fmt(dp1(Math.sqrt(s)))}).`, {visual: vis}); } },
  c: { t: 'solve for a leg', g: (R, O) => { const u = UL(O).s, k = R.int(0, 2);
    if (k <= 1) { const [a0, b0, c] = R.pick(TRIPLES), sw = R.bool(), a = sw ? b0 : a0, b = sw ? a0 : b0, vis = rtPic(R, a, b, [`${a} ${u}`, `${c} ${u}`, 'b']);
      const ex = `The hypotenuse is ${c}, so subtract: b² = ${c}² ${M} ${a}² = ${c * c} ${M} ${a * a} = ${b * b}, so b = ${b} ${u}.`;
      if (k === 0) return num(`Find the missing leg b, in ${u}.`, b, ex, {visual: vis});
      return choice(R, 'Find the missing leg b.', `${b} ${u}`, [`${fmt(dp1(Math.sqrt(c * c + a * a)))} ${u}`, `${c - a} ${u}`, `${c * c - a * a} ${u}`], ex + ` Adding ${c}² + ${a}² would treat ${c} as a leg.`, {visual: vis}); }
    const [c, a] = nonTriLeg(R, 6, 20), s = c * c - a * a, vis = rtPic(R, a, Math.sqrt(s), [`${a} ${u}`, `${c} ${u}`, 'b']);
    return num('Find the missing leg b, rounded to 1 decimal place.', dp1(Math.sqrt(s)), `b² = ${c}² ${M} ${a}² = ${c * c} ${M} ${a * a} = ${s}, so b = √${s} ≈ ${fmt(dp1(Math.sqrt(s)))} ${u}.`, {visual: vis}); } },
  d: { t: 'word problems', g: (R, O) => { const U = UL(O), big = U.b, sm = U.s, ctx = R.int(0, 4), exact = R.bool(0.6);
    const legsC = () => { if (exact) { const [a, b, c] = R.pick(TRIPLES.slice(0, 8)); return R.bool() ? [a, b, c] : [b, a, c]; } const [a, b] = nonTri(R, 3, 15); return [a, b, Math.sqrt(a * a + b * b)]; };
    const legC = () => { if (exact) { const [a, b, c] = R.pick(TRIPLES.slice(0, 8)); return R.bool() ? [a, b, c] : [b, a, c]; } const [c, a] = nonTriLeg(R, 6, 20); return [a, Math.sqrt(c * c - a * a), c]; };
    const rnd = exact ? '' : ' Round to 1 decimal place.', ans = v => exact ? v : dp1(v), sh = v => fmt(ans(v));
    if (ctx === 0) { const [d, h, L] = legC();
      return num(`${/^8|^1[18]$/.test(String(L)) ? 'An' : 'A'} ${L} ${big} ladder leans on a wall. Its foot is ${d} ${big} from the wall. How high up the wall does it reach, in ${big}?${rnd}`, ans(h), `The ladder is the hypotenuse: h² = ${L}² ${M} ${d}² = ${L * L - d * d}, so h = ${sh(h)} ${big}.`); }
    if (ctx === 1) { const [a, b, c] = legsC();
      return num(`Mia walks ${a} ${big} east, then ${b} ${big} north. How far is she from her start in a straight line, in ${big}?${rnd}`, ans(c), `East and north meet at a right angle: d² = ${a}² + ${b}² = ${a * a + b * b}, so d = ${sh(c)} ${big}.`); }
    if (ctx === 2) { const [a, b, c] = legsC();
      return num(`A screen is ${a} ${sm} wide and ${b} ${sm} tall. How long is its diagonal, in ${sm}?${rnd}`, ans(c), `The diagonal is the hypotenuse: d² = ${a * a} + ${b * b} = ${a * a + b * b}, so d = ${sh(c)} ${sm}.`); }
    if (ctx === 3) { const [d, h, L] = legC();
      return num(`A kite string is ${L} ${big} long and pulled tight. The kite is right above a point ${d} ${big} away. How high is the kite, in ${big}?${rnd}`, ans(h), `The string is the hypotenuse: h² = ${L}² ${M} ${d}² = ${L * L - d * d}, so h = ${sh(h)} ${big}.`); }
    const [a, b, c] = R.pick(TRIPLES.slice(0, 8)), sw = R.bool(), l = sw ? b : a, w = sw ? a : b;
    return num(`A field is ${l} ${big} by ${w} ${big}. How much shorter is it to walk across the diagonal than along two sides, in ${big}?`, l + w - c, `Diagonal: √(${l * l} + ${w * w}) = ${c}. Two sides: ${l} + ${w} = ${l + w}. Saving: ${l + w} ${M} ${c} = ${l + w - c} ${big}.`); } },
}});

// four-triangle proof square (side a+b) and squares-on-the-sides picture
V8.proofSq = function (a, b, o = {}) {
  const n = a + b, s = 190 / n, S = Scene(), T = ([x, y]) => [x * s, (n - y) * s];
  S.poly([[0, 0], [n, 0], [n, n], [0, n]].map(T), {fill: C.paper});
  const hole = [[a, 0], [n, a], [b, n], [0, b]];
  S.poly(hole.map(T), {fill: C.teal + '44'});
  [[[0, 0], [a, 0], [0, b]], [[a, 0], [n, 0], [n, a]], [[n, a], [n, n], [b, n]], [[b, n], [0, n], [0, b]]].forEach(t => S.poly(t.map(T), {fill: C.amber + '55'}));
  if (o.labels !== false) { sideLab(S, T([0, 0]), T([a, 0]), o.a || 'a', T([a / 2, 5])); sideLab(S, T([a, 0]), T([n, 0]), o.b || 'b', T([n - b / 2, 5])); sideLab(S, T([0, 0]), T([0, b]), o.b || 'b', T([5, b / 2])); sideLab(S, T([0, b]), T([0, n]), o.a || 'a', T([5, n - a / 2]));
    sideLab(S, T(hole[0]), T(hole[1]), o.c || 'c', T([n / 2, n / 2]), {col: C.teal, weight: 700}); }
  return S.svg('four right triangles in a square');
};
V8.sqSides = function (A1, A2, labs) {
  const a = Math.sqrt(A1), b = Math.sqrt(A2), c = Math.sqrt(A1 + A2), s = Math.min(230 / (a + b + b * 0.2 + a), 230 / (a + b + a * 0.1 + b)), S = Scene(), T = ([x, y]) => [x * s, -y * s];
  const n = [b / c, a / c], B = [a, 0], Cc = [0, b];
  const sqA = [[0, 0], [a, 0], [a, -a], [0, -a]], sqB = [[0, 0], [0, b], [-b, b], [-b, 0]], sqC = [B, [a + n[0] * c, n[1] * c], [n[0] * c, b + n[1] * c], Cc];
  [[sqA, C.blue], [sqB, C.red], [sqC, C.teal]].forEach(([Q, col]) => S.poly(Q.map(T), {fill: col + '33', col, w: 2}));
  S.poly([[0, 0], B, Cc].map(T), {fill: C.faint});
  rightSq(S, T([0, 0]), T(B), T(Cc), 10);
  const cen = Q => T([Q.reduce((x, p) => x + p[0], 0) / 4, Q.reduce((y, p) => y + p[1], 0) / 4]);
  [[sqA, labs[0], C.blue], [sqB, labs[1], C.red], [sqC, labs[2], C.teal]].forEach(([Q, t, col]) => { const q = cen(Q); S.text(q[0], q[1], t, {size: 16, weight: 700, fill: C.ink}); });
  return S.svg('squares on the sides of a right triangle');
};

const NEAR = t => { const [a, b, c] = t; return [[a, b, c + 1], [a + 1, b, c], [a, b + 1, c + 1], [a, b, a + b - 1]].filter(([x, y, z]) => x + y > z && x * x + y * y !== z * z); };
const sortN = t => t.slice().sort((x, y) => x - y);
E3.skill({ id: 'III.8.16', name: 'Converse of Pythagoras', steps: {
  a: { t: 'test three lengths', g: (R) => { const k = R.int(0, 3), T0 = R.pick(TRIPLES.slice(0, 10)), right = R.bool(), t = right ? T0 : R.pick(NEAR(T0)), [a, b, c] = sortN(t), show = R.shuffle([a, b, c]);
    const ex = `Use the longest side, ${c}: ${a}² + ${b}² = ${a * a + b * b} and ${c}² = ${c * c}. ${a * a + b * b === c * c ? 'Equal, so the angle opposite ' + c + ' is a right angle.' : 'Not equal, so there is no right angle.'}`;
    if (k <= 1) return yn(`Do sides ${show.join(', ')} make a right triangle?`, right, ex);
    if (k === 2) return num(`Sides ${show.join(', ')}. Square and add the two shorter sides; then square the longest.`, [{label: `${a}² + ${b}² =`, ans: a * a + b * b}, {label: `${c}² =`, ans: c * c}], ex);
    const [p, q, r] = sortN(T0), sh = R.shuffle([p, q, r]);
    return choice(R, `To test sides ${sh.join(', ')} for a right angle, which check is right?`, `${p}² + ${q}² = ${r}²`, [`${p}² + ${r}² = ${q}²`, `${q}² + ${r}² = ${p}²`], `Always put the longest side, ${r}, alone: ${p * p} + ${q * q} = ${r * r}. ✓`); } },
  b: { t: 'Pythagorean triples', g: (R) => { const k = R.int(0, 3), t = R.pick(TRIPLES), [a, b, c] = t;
    if (k === 0) { const ds = R.sample(NEAR(t), 2).concat([R.pick([[4, 5, 6], [2, 3, 4], [5, 6, 7], [6, 8, 12], [5, 12, 15], [3, 4, 7]])]).map(tripTxt);
      return choice(R, 'Which is a Pythagorean triple?', tripTxt(t), ds, `${a}² + ${b}² = ${a * a} + ${b * b} = ${c * c} = ${c}². The others don't balance.`); }
    if (k === 1) { const hideC = R.bool(0.6);
      return num(`Complete the Pythagorean triple: ${hideC ? `${a}, ${b}, ?` : `${a}, ?, ${c}`}`, hideC ? c : b, hideC ? `${a * a} + ${b * b} = ${c * c} = ${c}².` : `${c * c} ${M} ${a * a} = ${b * b} = ${b}².`); }
    if (k === 2) { const [p, q, r] = R.pick([[3, 4, 5], [5, 12, 13], [8, 15, 17]]), n = R.int(2, 6);
      return num(`${p}, ${q}, ${r} is a triple. Legs ${n * p} and ${n * q} make a right triangle. How long is the hypotenuse?`, n * r, `${n * p}, ${n * q} is ${n} ${X} (${p}, ${q}), so the hypotenuse is ${n} ${X} ${r} = ${n * r}.`); }
    const right = R.bool(), s = right ? t : R.pick(NEAR(t)), [x, y, z] = sortN(s);
    return yn(`Is ${tripTxt(s)} a Pythagorean triple?`, right, `${x}² + ${y}² = ${x * x + y * y}; ${z}² = ${z * z}. ${right ? 'Equal, so yes.' : 'Not equal, so no.'}`); } },
  c: { t: 'acute, right, obtuse by comparing sums', g: (R) => { const opts = ['Acute', 'Right', 'Obtuse'];
    if (R.bool(0.3)) { const [p, q, r] = R.pick(TRIPLES.slice(0, 8)), cs = [r - 1, r, r + 1];
      return choiceFixed(`A triangle has sides ${p}, ${q} and c, with c the longest. For which c is it obtuse?`, cs.map(String), 2, `${p}² + ${q}² = ${p * p + q * q}. Obtuse needs c² bigger: ${r + 1}² = ${(r + 1) ** 2}. (${r} gives right, ${r - 1} acute.)`); }
    const want = R.int(0, 2); let a, b, c;
    if (want === 1) [a, b, c] = R.pick(TRIPLES.slice(0, 10));
    else for (let t = 0; t < 500; t++) { [a, b, c] = sortN([R.int(3, 18), R.int(3, 18), R.int(3, 18)]); const d = a * a + b * b - c * c; if (a + b > c && c > b && (want === 0 ? d > 0 : d < 0)) break; }
    const s = a * a + b * b, cc = c * c, kind = s === cc ? 1 : s > cc ? 0 : 2;
    return choiceFixed(`A triangle has sides ${R.shuffle([a, b, c]).join(', ')}. What kind is it?`, opts, kind, `Compare with the longest side: ${a}² + ${b}² = ${s}${s === cc ? ` = ${c}²` : ` ${s > cc ? '&gt;' : '&lt;'} ${cc} = ${c}²`}, so the triangle is ${opts[kind].toLowerCase()}.`); } },
  d: { t: 'is it a right triangle? (coordinate or decimal sides)', g: (R) => { const k = R.int(0, 3);
    if (k <= 1) { const T0 = R.pick(TRIPLES.slice(0, 7)), right = R.bool(), t = right ? T0 : R.pick(NEAR(T0)), sc = R.pick([0.1, 0.5, 0.2, 1.5]), [a, b, c] = sortN(t).map(v => +(v * sc).toFixed(2)), sq = v => +(v * v).toFixed(4), s = +(sq(a) + sq(b)).toFixed(4), ok = s === sq(c);
      return yn(`Do sides ${R.shuffle([a, b, c]).map(fmt).join(' cm, ')} cm make a right triangle?`, ok, `Longest side ${fmt(c)}: ${fmt(a)}² + ${fmt(b)}² = ${fmt(sq(a))} + ${fmt(sq(b))} = ${fmt(s)} and ${fmt(c)}² = ${fmt(sq(c))}. ${ok ? 'Equal, so yes: right triangle.' : 'Not equal, so no.'}`); }
    let A, B, Cc, right;
    for (;;) { A = [R.int(-5, 1), R.int(-5, 1)]; const p = R.int(1, 3), q = R.int(0, 3), m = R.pick([1, 2]); B = [A[0] + p, A[1] + q]; Cc = [A[0] - m * q, A[1] + m * p];
      right = k === 3 || R.bool(); if (!right) Cc = [Cc[0] + R.pick([-1, 1]), Cc[1] + R.pick([0, 1])];
      const pts = [A, B, Cc]; if (pts.some(P => Math.abs(P[0]) > 5 || Math.abs(P[1]) > 5)) continue;
      const area2 = (B[0] - A[0]) * (Cc[1] - A[1]) - (Cc[0] - A[0]) * (B[1] - A[1]); if (!area2) continue;
      const d2 = (P, Q) => (P[0] - Q[0]) ** 2 + (P[1] - Q[1]) ** 2, S = [d2(B, Cc), d2(A, Cc), d2(A, B)], isR = S.some((v, i) => v === S[(i + 1) % 3] + S[(i + 2) % 3]);
      if (isR !== right) continue; break; }
    const pts = [A, B, Cc], nm = ['A', 'B', 'C'], d2 = (P, Q) => (P[0] - Q[0]) ** 2 + (P[1] - Q[1]) ** 2, sides = [[1, 2], [0, 2], [0, 1]];
    const lines = sides.map(([i, j]) => { const dx = Math.abs(pts[i][0] - pts[j][0]), dy = Math.abs(pts[i][1] - pts[j][1]); return `${nm[i]}${nm[j]}² = ${dx}² + ${dy}² = ${dx * dx + dy * dy}`; });
    const S = sides.map(([i, j]) => d2(pts[i], pts[j])), big = S.indexOf(Math.max(...S)), o = [0, 1, 2].filter(i => i !== big), ok = S[o[0]] + S[o[1]] === S[big];
    const ex = `Count across and up for each side: ${lines.join('; ')}. ${S[o[0]]} + ${S[o[1]]} ${ok ? '=' : '≠'} ${S[big]}${ok ? `, so the right angle is at ${nm[big]}.` : ', so there is no right angle.'}`;
    const vis = V8.pl({polys: [{pts, col: C.teal, names: nm}]});
    if (k === 3) return choiceFixed(`Triangle ABC is a right triangle. At which corner is the right angle?`, nm, big, ex, {visual: vis});
    return yn(`Is triangle ABC, with A${pt(...A)}, B${pt(...B)}, C${pt(...Cc)}, a right triangle?`, ok, ex, {visual: vis}); } },
}});

/* coordinate plane with extra drawing: polys [{pts,col,dash,names}], lines [{x}|{y}|{m,b}, col, text], segs [{a,b,col,dash}], points [{p,t,col}], right [[V,A,B]] */
V8.pl = function (o = {}) {
  const lo = o.min ?? -6, hi = o.max ?? 6, u = o.size || Math.min(28, Math.floor(340 / (hi - lo))), pad = 20;
  const T = p => [pad + (p[0] - lo) * u, pad + (hi - p[1]) * u];
  const ln = (A, B, col, w, dash) => `<line x1="${P1(A[0])}" y1="${P1(A[1])}" x2="${P1(B[0])}" y2="${P1(B[1])}" stroke="${col}" stroke-width="${w}"${dash ? ` stroke-dasharray="${dash}"` : ''} stroke-linecap="round"/>`;
  const Wd = (hi - lo) * u + 40, lab = (x, y, t, st) => V.text(P1(Math.min(Wd - 8, Math.max(8, x))), P1(Math.min(Wd - 8, Math.max(8, y))), t, st).replace('<text ', '<text stroke="#fff" stroke-width="4" stroke-linejoin="round" paint-order="stroke" ');
  let b = '';
  (o.lines || []).forEach(L => { const col = L.col || C.violet; let E;
    if (L.x !== undefined) E = [[L.x, lo], [L.x, hi]];
    else if (L.y !== undefined) E = [[lo, L.y], [hi, L.y]];
    else { const q = [[lo, L.m * lo + L.b], [hi, L.m * hi + L.b], [(lo - L.b) / L.m, lo], [(hi - L.b) / L.m, hi]].filter(([x, y]) => x >= lo - 1e-9 && x <= hi + 1e-9 && y >= lo - 1e-9 && y <= hi + 1e-9).sort((p, r) => p[0] - r[0]); E = [q[0], q[q.length - 1]]; }
    b += ln(T(E[0]), T(E[1]), col, 3, L.dash ? '9 6' : '');
    if (L.text) { const top = E[0][1] > E[1][1] ? E[0] : E[1], q = T(top); b += lab(q[0] + (L.x !== undefined ? 8 : -6), q[1] + 10, L.text, {size: 13, fill: col, weight: 700, anchor: L.x !== undefined ? 'start' : 'end'}); } });
  (o.segs || []).forEach(g => b += ln(T(g.a), T(g.b), g.col || C.blue, g.w || 2.5, g.dash ? '7 5' : ''));
  (o.right || []).forEach(([Vt, A, B]) => { const P = T(Vt), ua = unit(P, T(A)), ub = unit(P, T(B)), z = 10;
    b += `<path d="M${P1(P[0] + ua[0] * z)} ${P1(P[1] + ua[1] * z)} L${P1(P[0] + (ua[0] + ub[0]) * z)} ${P1(P[1] + (ua[1] + ub[1]) * z)} L${P1(P[0] + ub[0] * z)} ${P1(P[1] + ub[1] * z)}" fill="none" stroke="${C.ink}" stroke-width="1.6"/>`; });
  (o.polys || []).forEach(Pg => { const col = Pg.col || C.red, Q = Pg.pts.map(T), cx = Q.reduce((s, q) => s + q[0], 0) / Q.length, cy = Q.reduce((s, q) => s + q[1], 0) / Q.length;
    b += `<polygon points="${Q.map(q => P1(q[0]) + ',' + P1(q[1])).join(' ')}" fill="${col}${Pg.dash ? '1c' : '3a'}" stroke="${col}" stroke-width="2.5" stroke-linejoin="round"${Pg.dash ? ' stroke-dasharray="7 5"' : ''}/>`;
    (Pg.names || []).forEach((t, i) => { const q = Q[i]; b += V.dot(P1(q[0]), P1(q[1]), 3.5, col); if (!t) return; let d = [q[0] - cx, q[1] - cy]; const L = Math.hypot(d[0], d[1]) || 1; b += lab(q[0] + d[0] / L * 14, q[1] + d[1] / L * 14, t, {size: 14, weight: 700, fill: col}); }); });
  (o.points || []).forEach(p => { const q = T(p.p); b += V.dot(P1(q[0]), P1(q[1]), 5, p.col || C.red); if (p.t) b += lab(q[0] + (p.dx ?? 10), q[1] + (p.dy ?? -11), p.t, {size: 14, weight: 700, fill: p.col || C.ink}); });
  return V.plane({min: lo, max: hi, size: u}).replace(/<\/svg>$/, b + '</svg>');
};
const inR = (P, lo = -6, hi = 6) => P.every(([x, y]) => x >= lo && x <= hi && y >= lo && y <= hi);

const LEGV = [[3, 4], [4, 3], [6, 8], [8, 6], [5, 12], [12, 5], [9, 12], [12, 9]];
// two points P, Q with integer distance (legs from a triple), both inside −6..6
const triplePts = R => { for (let t = 0; t < 200; t++) { let [dx, dy] = R.pick(LEGV); dx *= R.pick([1, -1]); dy *= R.pick([1, -1]); const P = [R.int(-6, 6), R.int(-6, 6)], Q = [P[0] + dx, P[1] + dy]; if (inR([Q])) return [P, Q]; } return [[-1, -2], [2, 2]]; };
const anyPts = R => { for (let t = 0; t < 200; t++) { const P = [R.int(-6, 6), R.int(-6, 6)], Q = [R.int(-6, 6), R.int(-6, 6)]; if (Math.abs(P[0] - Q[0]) >= 2 && Math.abs(P[1] - Q[1]) >= 2) return [P, Q]; } return [[-2, 1], [3, 4]]; };
E3.skill({ id: 'III.8.17', name: 'Distance on the plane', steps: {
  a: { t: 'draw the right triangle', g: (R) => { const [P, Q] = anyPts(R), k = R.int(0, 2), corner = R.bool() ? [Q[0], P[1]] : [P[0], Q[1]];
    const base = {segs: [{a: P, b: Q, col: C.blue}], points: [{p: P, t: 'P'}, {p: Q, t: 'Q'}]};
    if (k === 0) { const good = [[Q[0], P[1]], [P[0], Q[1]]], key = p => p.join(), bad = [[P[1], Q[0]], [Q[1], P[0]], [Math.round((P[0] + Q[0]) / 2), Math.round((P[1] + Q[1]) / 2)], [Q[0], -P[1]], [-P[0], Q[1]], [P[0] + Q[0], P[1]]].filter(p => inR([p]) && !good.concat([P, Q]).some(g => key(g) === key(p)));
      return choice(R, 'PQ is the long side of a right triangle with one horizontal and one vertical leg. Which point could be the right-angle corner?', pt(...corner), bad.map(p => pt(...p)).slice(0, 3), `The corner shares its x with one point and its y with the other: ${pt(...corner)}.`, {visual: V8.pl(base)}); }
    const vis = V8.pl(Object.assign({}, base, {segs: [{a: P, b: Q, col: C.blue}, {a: P, b: corner, col: C.red, dash: true}, {a: corner, b: Q, col: C.red, dash: true}], right: [[corner, P, Q]], points: base.points.concat([{p: corner, t: 'R', col: C.red}])}));
    if (k === 1) return num('The dashed legs meet at the right angle R. What are the coordinates of R?', [{label: 'x =', ans: corner[0]}, {label: 'y =', ans: corner[1]}], `R is straight across from one point and straight up or down from the other: R = ${pt(...corner)}.`, {visual: vis});
    return num('Count grid squares. How long is each dashed leg?', [{label: 'horizontal', ans: Math.abs(Q[0] - P[0])}, {label: 'vertical', ans: Math.abs(Q[1] - P[1])}], `Across: from x = ${sg(P[0])} to ${sg(Q[0])} is ${Math.abs(Q[0] - P[0])}. Up/down: from y = ${sg(P[1])} to ${sg(Q[1])} is ${Math.abs(Q[1] - P[1])}.`, {visual: vis}); } },
  b: { t: 'horizontal and vertical legs', g: (R) => { let P, Q; do { [P, Q] = anyPts(R); } while (!(P[0] * Q[0] < 0 || P[1] * Q[1] < 0) && R.bool(0.7));
    const dx = Math.abs(Q[0] - P[0]), dy = Math.abs(Q[1] - P[1]), ex = `Horizontal: |${sg(Q[0])} ${M} ${P[0] < 0 ? '(' + sg(P[0]) + ')' : P[0]}| = ${dx}. Vertical: |${sg(Q[1])} ${M} ${P[1] < 0 ? '(' + sg(P[1]) + ')' : P[1]}| = ${dy}.`;
    if (R.bool(0.35)) { const wrong = [Math.abs(Math.abs(Q[0]) - Math.abs(P[0])), Math.abs(Q[0] + P[0]), dx + 1].filter(v => v !== dx);
      return choice(R, `How long is the horizontal leg from ${pt(...P)} to ${pt(...Q)}?`, String(dx), wrong.map(String), `Subtract the x-coordinates: ${ex.split('. ')[0]}.`); }
    return num(`Find the lengths of the horizontal and vertical legs from ${pt(...P)} to ${pt(...Q)}.`, [{label: 'horizontal', ans: dx}, {label: 'vertical', ans: dy}], ex); } },
  c: { t: 'find the distance', g: (R) => { const k = R.int(0, 2);
    if (k <= 1) { const [P, Q] = triplePts(R), dx = Math.abs(Q[0] - P[0]), dy = Math.abs(Q[1] - P[1]), d = Math.hypot(dx, dy), vis = V8.pl({segs: [{a: P, b: Q}], points: [{p: P, t: 'P'}, {p: Q, t: 'Q'}]});
      const ex = `Legs ${dx} and ${dy}: d = √(${dx * dx} + ${dy * dy}) = √${d * d} = ${d}.`;
      if (k === 0) return num(`Find the distance from P${pt(...P)} to Q${pt(...Q)}.`, d, ex, {visual: vis});
      const wrong = [dx + dy, dp1(Math.hypot(Q[0], Q[1])), d * d].filter(v => v !== d);
      return choice(R, `What is the distance from ${pt(...P)} to ${pt(...Q)}?`, String(d), wrong.map(v => fmt(v)), ex + ' Subtract the coordinates before squaring.', {visual: vis}); }
    let P, Q, s; do { [P, Q] = anyPts(R); s = (Q[0] - P[0]) ** 2 + (Q[1] - P[1]) ** 2; } while (isSq(s));
    const dx = Math.abs(Q[0] - P[0]), dy = Math.abs(Q[1] - P[1]);
    return num(`Find the distance from ${pt(...P)} to ${pt(...Q)}, rounded to 1 decimal place.`, dp1(Math.sqrt(s)), `Legs ${dx} and ${dy}: d = √(${dx * dx} + ${dy * dy}) = √${s} ≈ ${fmt(dp1(Math.sqrt(s)))}.`, {visual: V8.pl({segs: [{a: P, b: Q}], points: [{p: P, t: 'P'}, {p: Q, t: 'Q'}]})}); } },
  d: { t: 'perimeter of a plotted shape', g: (R) => { const kind = R.int(0, 4); let S0;
    const [p, q] = R.pick([[3, 4], [4, 3]]);
    if (kind === 0) { const [a, b] = R.pick([[3, 4], [4, 3], [6, 8], [8, 6], [5, 12], [12, 5]]); S0 = [[0, 0], [a, 0], [0, b]]; }
    else if (kind === 1) S0 = [[0, 0], [2 * p, 0], [p, q]];
    else if (kind === 2) S0 = [[0, q], [p, 0], [2 * p, q], [p, 2 * q]];
    else if (kind === 3) { const L = R.int(1, 4); S0 = [[0, 0], [L + 2 * p, 0], [L + p, q], [p, q]]; }
    else { const L = R.int(2, 5); S0 = [[0, 0], [L, 0], [L + p, q], [p, q]]; }
    for (let t = 0; t < 100; t++) { let P = turnP(S0, R.pick([0, 90, 180, 270])).map(([x, y]) => [Math.round(x), Math.round(y)]); if (R.bool()) P = P.map(([x, y]) => [-x, y]);
      const xs = P.map(v => v[0]), ys = P.map(v => v[1]), dx = R.int(-6 - Math.min(...xs), 6 - Math.max(...xs)), dy = R.int(-6 - Math.min(...ys), 6 - Math.max(...ys));
      if (!(dx >= -6 - Math.min(...xs) && dx <= 6 - Math.max(...xs))) continue;
      P = P.map(([x, y]) => [x + dx, y + dy]); if (!inR(P)) continue;
      const nm = 'ABCD'.slice(0, P.length).split(''), sides = P.map((v, i) => { const w = P[(i + 1) % P.length]; return Math.round(Math.hypot(w[0] - v[0], w[1] - v[1])); }), per = sides.reduce((s, v) => s + v, 0);
      return num(`Find the perimeter of ${nm.join('')}.`, per, `Side lengths (use Pythagoras for slanted sides): ${sides.join(' + ')} = ${per}.`, {visual: V8.pl({polys: [{pts: P, col: C.teal, names: nm}]})}); }
    return again('III.8.17', 'd', R); } },
}});

// boxes whose space diagonal is a whole number; BOXT: the first two edges also make a triple (base diagonal whole)
const BOX3 = [[1, 2, 2, 3], [2, 3, 6, 7], [1, 4, 8, 9], [4, 4, 7, 9], [2, 6, 9, 11], [6, 6, 7, 11], [3, 4, 12, 13], [4, 8, 8, 12], [2, 10, 11, 15], [2, 5, 14, 15], [8, 9, 12, 17], [6, 10, 15, 19], [3, 4, 12, 13], [9, 12, 20, 25], [12, 16, 21, 29], [6, 8, 24, 26]];
const BOXT = [[3, 4, 12, 13], [4, 3, 12, 13], [9, 12, 20, 25], [12, 9, 20, 25], [12, 16, 21, 29], [6, 8, 24, 26], [8, 6, 24, 26]];
const CONE3 = [[3, 4, 5], [4, 3, 5], [5, 12, 13], [6, 8, 10], [8, 6, 10], [9, 12, 15], [8, 15, 17], [12, 5, 13], [7, 24, 25], [12, 16, 20]];
E3.skill({ id: 'III.8.18', name: 'Pythagoras in 3D', steps: {
  a: { t: 'face diagonal', g: (R, O) => { const u = U3(O), k = R.int(0, 2), w = R.int(2, 8);
    if (k <= 1) { const [a0, b0, c] = R.pick(TRIPLES.slice(0, 9)), sw = R.bool(), l = sw ? b0 : a0, h = sw ? a0 : b0, vis = V8.box(l, w, h, {l: `${l} ${u}`, w: `${w} ${u}`, h: `${h} ${u}`, diag: 'face', diagText: 'd'});
      const ex = `The diagonal d is on the front face, ${l} by ${h}: d = √(${l * l} + ${h * h}) = ${c} ${u}. The depth ${w} is not used.`;
      if (k === 0) return num(`Find the length of the red diagonal d on the front face, in ${u}.`, c, ex, {visual: vis});
      return choice(R, 'How long is the red diagonal d on the front face?', `${c} ${u}`, [`${l + h} ${u}`, `${fmt(dp1(Math.sqrt(l * l + w * w + h * h)))} ${u}`, `${l * l + h * h} ${u}`], ex, {visual: vis}); }
    const [l, h] = nonTri(R, 3, 12);
    return num(`Find the length of the red diagonal d on the front face, in ${u}, rounded to 1 decimal place.`, dp1(Math.hypot(l, h)), `d = √(${l}² + ${h}²) = √${l * l + h * h} ≈ ${fmt(dp1(Math.hypot(l, h)))} ${u}.`, {visual: V8.box(l, w, h, {l: `${l} ${u}`, w: `${w} ${u}`, h: `${h} ${u}`, diag: 'face', diagText: 'd'})}); } },
  b: { t: 'space diagonal of a box', g: (R, O) => { const u = U3(O), k = R.int(0, 2);
    if (k === 0) { const e = R.pick(BOX3), d = e[3], [l, w, h] = R.shuffle(e.slice(0, 3));
      return num(`Find the square of the base diagonal, then the space diagonal d, in ${u}.`, [{label: 'base diagonal² =', ans: l * l + w * w}, {label: 'd =', ans: d}], `Base: ${l}² + ${w}² = ${l * l + w * w}. Then d² = ${l * l + w * w} + ${h}² = ${d * d}, so d = ${d} ${u}.`,
        {visual: V8.box(l, w, h, {l: `${l} ${u}`, w: `${w} ${u}`, h: `${h} ${u}`, diag: 'space', base: true, diagText: 'd'})}); }
    if (k === 1) { const [l, w, h, d] = R.pick(BOXT), bd = Math.hypot(l, w);
      return choice(R, 'How long is the space diagonal d?', `${d} ${u}`, [`${l + w + h} ${u}`, `${bd} ${u}`, `${fmt(dp1(Math.hypot(bd, h) + 2))} ${u}`].filter(x => x !== `${d} ${u}`), `Base diagonal √(${l * l} + ${w * w}) = ${bd}. Then d = √(${bd * bd} + ${h * h}) = ${d} ${u}. Not ${l} + ${w} + ${h}, and not just the base diagonal.`,
        {visual: V8.box(l, w, h, {l: `${l} ${u}`, w: `${w} ${u}`, h: `${h} ${u}`, diag: 'space', base: true, diagText: 'd'})}); }
    let l, w, h, s; do { l = R.int(2, 12); w = R.int(2, 9); h = R.int(2, 10); s = l * l + w * w + h * h; } while (isSq(s));
    return num(`Find the space diagonal d, in ${u}, rounded to 1 decimal place.`, dp1(Math.sqrt(s)), `d² = ${l}² + ${w}² + ${h}² = ${l * l} + ${w * w} + ${h * h} = ${s}, so d ≈ ${fmt(dp1(Math.sqrt(s)))} ${u}.`,
      {visual: V8.box(l, w, h, {l: `${l} ${u}`, w: `${w} ${u}`, h: `${h} ${u}`, diag: 'space', diagText: 'd'})}); } },
  c: { t: 'slant height of a cone', g: (R, O) => { const u = U3(O), k = R.int(0, 3), [r, h, l] = R.pick(CONE3);
    if (k === 0) return num(`Find the slant height of the cone, in ${u}.`, l, `Radius, height and slant height make a right triangle: l = √(${r}² + ${h}²) = √${l * l} = ${l} ${u}.`, {visual: V8.cone(r, h, {r: `${r} ${u}`, h: `${h} ${u}`, l: '?'})});
    if (k === 1) return num(`The cone's slant height is ${l} ${u}. Find its height h, in ${u}.`, h, `The slant height is the hypotenuse: h² = ${l}² ${M} ${r}² = ${l * l - r * r}, so h = ${h} ${u}.`, {visual: V8.cone(r, h, {r: `${r} ${u}`, h: 'h', l: `${l} ${u}`})});
    if (k === 2) return choice(R, `A cone has diameter ${2 * r} ${u} and height ${h} ${u}. What is its slant height?`, `${l} ${u}`, [`${fmt(dp1(Math.hypot(2 * r, h)))} ${u}`, `${r + h} ${u}`, `${l * l} ${u}`], `Halve the diameter first: r = ${r}. l = √(${r * r} + ${h * h}) = ${l} ${u}.`, {visual: V8.cone(r, h, {r: '', h: `${h} ${u}`, l: '?'})});
    const [a, b] = nonTri(R, 2, 12);
    return num(`Find the slant height of the cone, in ${u}, rounded to 1 decimal place.`, dp1(Math.hypot(a, b)), `l = √(${a}² + ${b}²) = √${a * a + b * b} ≈ ${fmt(dp1(Math.hypot(a, b)))} ${u}.`, {visual: V8.cone(a, b, {r: `${a} ${u}`, h: `${b} ${u}`, l: '?'})}); } },
  d: { t: 'real-world 3D lengths', g: (R, O) => { const U = UL(O), sm = U.s, big = U.b, ctx = R.int(0, 3);
    if (ctx === 0) { const e = R.pick(BOX3), d = e[3], [l, w, h] = R.shuffle(e.slice(0, 3));
      return num(`A box is ${l} by ${w} by ${h} ${sm}. What is the longest straight stick that fits inside, in ${sm}?`, d, `The longest stick runs corner to far corner: √(${l * l} + ${w * w} + ${h * h}) = √${d * d} = ${d} ${sm}.`, {visual: V8.box(l, w, h, {l: `${l} ${sm}`, w: `${w} ${sm}`, h: `${h} ${sm}`, diag: 'space'})}); }
    if (ctx === 1) { let l, w, h, s; do { l = R.int(4, 9); w = R.int(3, 7); h = R.int(2, 4); s = l * l + w * w + h * h; } while (isSq(s));
      return num(`A room is ${l} ${big} long, ${w} ${big} wide and ${h} ${big} high. How far is it from a floor corner to the opposite ceiling corner? Round to 1 decimal place.`, dp1(Math.sqrt(s)), `d = √(${l * l} + ${w * w} + ${h * h}) = √${s} ≈ ${fmt(dp1(Math.sqrt(s)))} ${big}.`); }
    if (ctx === 2) { const [r, h, l] = R.pick(CONE3.slice(0, 7));
      return num(`A party hat is a cone ${2 * r} ${sm} across and ${h} ${sm} tall. How long is its slant edge, from the rim to the tip, in ${sm}?`, l, `r = ${2 * r} ÷ 2 = ${r}. l = √(${r * r} + ${h * h}) = ${l} ${sm}.`, {visual: V8.cone(r, h, {r: '', h: `${h} ${sm}`, l: '?'})}); }
    const [dd, h, s] = R.pick([[6, 8, 10], [8, 6, 10], [5, 12, 13], [9, 12, 15], [8, 15, 17]]);
    return num(`A can is ${dd} ${sm} across and ${h} ${sm} tall. What is the longest straw that fits fully inside, in ${sm}?`, s, `The straw goes from one edge of the bottom to the far edge of the top: √(${dd}² + ${h}²) = √${s * s} = ${s} ${sm}.`, {visual: V8.cyl(dd / 2, h, {d: `${dd} ${sm}`, h: `${h} ${sm}`})}); } },
}});

/* =================== III.8.19 – III.8.23 transformations =================== */
const IX = '<i>x</i>', IY = '<i>y</i>', PR = '′';
const ruleT = (e1, e2) => `(${IX}, ${IY}) → (${e1}, ${e2})`;
const plus = (v, n) => n === 0 ? v : n > 0 ? `${v} + ${n}` : `${v} ${M} ${-n}`;
const trRule = (a, b) => ruleT(plus(IX, a), plus(IY, b));
const MOVE = { rx: ([x, y]) => [x, -y], ry: ([x, y]) => [-x, y], yx: ([x, y]) => [y, x], r90: ([x, y]) => [-y, x], r180: ([x, y]) => [-x, -y], r270: ([x, y]) => [y, -x] };
const z0 = v => v === 0 ? 0 : v;                       // no −0
const ap2 = (f, P) => P.map(p => f(p).map(z0));
// random triangle with vertices in [lo,hi]², not too thin; then placed in the quadrant given by signs
const rTri = (R, lo = 1, hi = 5) => { for (let t = 0; t < 400; t++) { const P = [0, 1, 2].map(() => [R.int(lo, hi), R.int(lo, hi)]), A = Math.abs(area2(P)) / 2;
  if (A >= 2 && P.every((p, i) => P.every((q, j) => i === j || Math.hypot(p[0] - q[0], p[1] - q[1]) >= 2))) return P; } return [[lo, lo], [lo + 3, lo], [lo, lo + 2]]; };
const quad = (R, P) => { const sx = R.pick([1, -1]), sy = R.pick([1, -1]); return P.map(([x, y]) => [sx * x, sy * y]); };
const NM = ['A', 'B', 'C'], NMp = NM.map(n => n + PR);
const xyF = (name, p) => [{label: `${name}: x =`, ans: p[0]}, {label: `${name}: y =`, ans: p[1]}];
const both = (P, Q, o = {}) => V8.pl(Object.assign({polys: [{pts: P, col: C.red, names: NM}, {pts: Q, col: C.blue, dash: true, names: NMp}]}, o));
const one = (P, o = {}) => V8.pl(Object.assign({polys: [{pts: P, col: C.red, names: NM}]}, o));
const sameSet = (P, Q) => { const k = X => X.map(p => p.join()).sort().join('|'); return k(P) === k(Q); };
const dirTxt = (a, b) => `${Math.abs(a)} ${a > 0 ? 'right' : 'left'}, ${Math.abs(b)} ${b > 0 ? 'up' : 'down'}`;
// a translation vector (both parts nonzero) that keeps P inside −6..6
const trVec = (R, P) => { for (let t = 0; t < 300; t++) { const a = R.int(-7, 7), b = R.int(-7, 7); if (a && b && inR(P.map(([x, y]) => [x + a, y + b]))) return [a, b]; } return [1, 1]; };

E3.skill({ id: 'III.8.19', name: 'Translations', steps: {
  a: { t: 'slide on a grid', g: (R) => { const P = rTri(R, -3, 3), [a, b] = trVec(R, P), Q = P.map(([x, y]) => [x + a, y + b]), k = R.int(0, 2), i = R.int(0, 2);
    if (k === 0) return choice(R, 'The red triangle slides onto the blue one. Describe the slide.', dirTxt(a, b), [dirTxt(b, a), dirTxt(-a, b), dirTxt(a, -b), dirTxt(-a, -b)].filter(s => s !== dirTxt(a, b)).slice(0, 3), `Follow one corner: ${NM[i]}${pt(...P[i])} goes to ${NMp[i]}${pt(...Q[i])}, which is ${dirTxt(a, b)}.`, {visual: both(P, Q)});
    return num(`Slide the triangle ${dirTxt(a, b)}. Where does ${NM[i]} land?`, xyF(NMp[i], Q[i]), `${pt(...P[i])}: ${a > 0 ? 'right' : 'left'} ${Math.abs(a)} changes x to ${sg(Q[i][0])}; ${b > 0 ? 'up' : 'down'} ${Math.abs(b)} changes y to ${sg(Q[i][1])}. ${NMp[i]} = ${pt(...Q[i])}.`, {visual: one(P)}); } },
  b: { t: 'coordinate rule (x+a, y+b)', g: (R) => { const k = R.int(0, 2), a = R.pick([-6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6]), b = R.pick([-6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6]), p = [R.int(-8, 8), R.int(-8, 8)], q = [p[0] + a, p[1] + b];
    if (k === 0) return num(`Use the rule ${trRule(a, b)}. Find the image of ${pt(...p)}.`, [{label: 'x =', ans: q[0]}, {label: 'y =', ans: q[1]}], `${sg(p[0])} ${a > 0 ? '+ ' + a : M + ' ' + -a} = ${sg(q[0])} and ${sg(p[1])} ${b > 0 ? '+ ' + b : M + ' ' + -b} = ${sg(q[1])}: ${pt(...q)}.`);
    if (k === 1) return choice(R, `Which rule slides a shape ${dirTxt(a, b)}?`, trRule(a, b), [trRule(-a, -b), trRule(-a, b), trRule(b, a)], `Right/up means add, left/down means subtract: ${trRule(a, b)}.`);
    return num(`The rule ${trRule(a, b)} sends P to ${pt(...q)}. Where was P?`, [{label: 'x =', ans: p[0]}, {label: 'y =', ans: p[1]}], `Undo the slide: ${sg(q[0])} ${a > 0 ? M + ' ' + a : '+ ' + -a} = ${sg(p[0])}, ${sg(q[1])} ${b > 0 ? M + ' ' + b : '+ ' + -b} = ${sg(p[1])}. P = ${pt(...p)}.`); } },
  c: { t: 'properties preserved', g: (R) => { const k = R.int(0, 3);
    if (k === 0) return choice(R, 'A triangle is translated. What changes?', 'Its position', ['Its side lengths', 'Its angles', 'Its area'], 'A slide moves every point the same way: only the position changes. Lengths, angles and area stay the same.');
    if (k === 1) { const [p, q] = triplePts(R), d = Math.hypot(q[0] - p[0], q[1] - p[1]), [a, b] = [R.int(-4, 4) || 2, R.int(-4, 4) || -3];
      return num(`A(${sg(p[0])}, ${sg(p[1])}) and B(${sg(q[0])}, ${sg(q[1])}) are ${d} apart. After the rule ${trRule(a, b)}, how long is A${PR}B${PR}?`, d, `A translation keeps every length: A${PR}B${PR} = ${d}.`); }
    if (k === 2 && R.bool()) return tf('After a translation, every side is the same length as before.', true, 'A translation only slides the shape, so lengths, angles and area stay the same.');
    if (k === 2) return tf('A translation can turn a shape upside down.', false, 'A translation only slides. It never turns or flips, so the shape faces the same way.');
    const w = R.int(2, 6), h = R.int(2, 6), [a, b] = [R.int(1, 5), -R.int(1, 5)];
    return num(`A ${w} by ${h} rectangle is moved by ${trRule(a, b)}. What is the area of the image?`, w * h, `Translations keep size and shape: the area is still ${w} ${X} ${h} = ${w * h}.`); } },
  d: { t: 'describe a translation', g: (R) => { const P = rTri(R, -3, 3), [a, b] = trVec(R, P), Q = P.map(([x, y]) => [x + a, y + b]), k = R.int(0, 2);
    if (k <= 1) return num(`The red triangle is translated onto the blue one by ${ruleT(`${IX} + <i>a</i>`, `${IY} + <i>b</i>`)}. Find a and b.`, [{label: 'a =', ans: a}, {label: 'b =', ans: b}], `A${pt(...P[0])} → A${PR}${pt(...Q[0])}: a = ${sg(Q[0][0])} ${M} ${P[0][0] < 0 ? '(' + sg(P[0][0]) + ')' : P[0][0]} = ${sg(a)}, b = ${sg(Q[0][1])} ${M} ${P[0][1] < 0 ? '(' + sg(P[0][1]) + ')' : P[0][1]} = ${sg(b)}.`, {visual: both(P, Q)});
    const ok = R.bool(), j = R.int(0, 2), Q2 = Q.map((p, i) => i === j && !ok ? [p[0] + R.pick([1, -1]), p[1]] : p);
    if (!inR(Q2)) return again('III.8.19', 'd', R);
    return yn('Is the blue triangle a translation of the red one?', ok, ok ? `Every corner moves ${dirTxt(a, b)}, so yes.` : `${NM[j]} moves differently from the other corners, so it is not a single slide.`, {visual: both(P, Q2)}); } },
}});

const REFL = { x: {f: MOVE.rx, nm: 'the x-axis', line: {y: 0}, rule: ruleT(IX, `${M}${IY}`)}, y: {f: MOVE.ry, nm: 'the y-axis', line: {x: 0}, rule: ruleT(`${M}${IX}`, IY)}, yx: {f: MOVE.yx, nm: 'the line y = x', line: {m: 1, b: 0, text: 'y = x'}, rule: ruleT(IY, IX)} };
const reflStep = key => (R) => { const Rf = REFL[key], k = R.int(0, 2), i = R.int(0, 2);
  const P = quad(R, rTri(R, 1, 5));
  if (key === 'yx' && P.some(([x, y]) => x === y)) return reflStep(key)(R);
  const Q = ap2(Rf.f, P), p = P[i], q = Q[i], L = Object.assign({col: C.violet}, Rf.line);
  const wrong = [[-p[0], p[1]], [p[0], -p[1]], [p[1], p[0]], [-p[0], -p[1]], [-p[1], -p[0]]].map(v => v.map(z0)).filter(v => v.join() !== q.join()).map(v => pt(...v));
  const why = {x: `Over the x-axis, x stays and y changes sign`, y: `Over the y-axis, y stays and x changes sign`, yx: `Over y = x, the coordinates swap`}[key];
  if (k === 0) return num(`Reflect the triangle over ${Rf.nm}. Where does ${NM[i]} go?`, xyF(NMp[i], q), `${why}: ${pt(...p)} → ${pt(...q)}.`, {visual: one(P, {lines: [L]})});
  if (k === 1) return choice(R, `Reflect ${pt(...p)} over ${Rf.nm}. Where does it go?`, pt(...q), R.sample(wrong, 3), `${why}: ${pt(...p)} → ${pt(...q)}. The rule is ${Rf.rule}.`, {visual: V8.pl({points: [{p, t: 'P'}], lines: [L]})});
  const j = (i + 1) % 3;
  return num(`Reflect the triangle over ${Rf.nm}. Find ${NMp[i]} and ${NMp[j]}.`, xyF(NMp[i], q).concat(xyF(NMp[j], Q[j])), `${why}: ${pt(...p)} → ${pt(...q)} and ${pt(...P[j])} → ${pt(...Q[j])}.`, {visual: one(P, {lines: [L]})}); };
E3.skill({ id: 'III.8.20', name: 'Reflections', steps: {
  a: { t: 'over the x-axis', g: reflStep('x') },
  b: { t: 'over the y-axis', g: reflStep('y') },
  c: { t: 'over y = x', g: reflStep('yx') },
  d: { t: 'find the line of reflection', g: (R) => { const kind = R.pick(['x', 'y', 'yx', 'v', 'h']); let P, Q, kk = 0;
    for (let t = 0; t < 300; t++) { kk = R.pick([-3, -2, -1, 1, 2, 3]);
      if (kind === 'v') { P = rTri(R, 1, 4).map(([x, y]) => [kk + x, y - 2]); Q = P.map(([x, y]) => [2 * kk - x, y]); }
      else if (kind === 'h') { P = rTri(R, 1, 4).map(([x, y]) => [x - 2, kk + y]); Q = P.map(([x, y]) => [x, 2 * kk - y]); }
      else { P = quad(R, rTri(R, 1, 5)); Q = ap2(REFL[kind].f, P); }
      if (R.bool() && (kind === 'v' || kind === 'h')) { [P, Q] = [Q, P]; }
      if (inR(P) && inR(Q) && !sameSet(P, Q)) break; }
    const other = (kind === 'v' || kind === 'h') ? (kind === 'v' ? `the line x = ${sg(kk)}` : `the line y = ${sg(kk)}`) : R.bool() ? `the line x = ${sg(R.pick([-2, -1, 1, 2]))}` : `the line y = ${sg(R.pick([-2, -1, 1, 2]))}`;
    const opts = ['the x-axis', 'the y-axis', 'the line y = x', other], ans = {x: 0, y: 1, yx: 2, v: 3, h: 3}[kind];
    // make sure no other option also maps P onto Q
    const fOf = s => s === 'the x-axis' ? MOVE.rx : s === 'the y-axis' ? MOVE.ry : s === 'the line y = x' ? MOVE.yx : /x =/.test(s) ? (([x, y]) => [2 * +s.split('= ')[1].replace(M, '-') - x, y]) : (([x, y]) => [x, 2 * +s.split('= ')[1].replace(M, '-') - y]);
    if (opts.some((s, i) => i !== ans && sameSet(ap2(fOf(s), P), Q))) return again('III.8.20', 'd', R);
    const ex = {x: 'Each point keeps its x and its y changes sign: the mirror is the x-axis.', y: 'Each point keeps its y and its x changes sign: the mirror is the y-axis.', yx: 'Each point swaps its coordinates, like (2, 5) ↔ (5, 2): the mirror is y = x.', v: `Each pair of matching points is the same distance left and right of x = ${sg(kk)}.`, h: `Each pair of matching points is the same distance above and below y = ${sg(kk)}.`}[kind];
    return choiceFixed('The blue triangle is a reflection of the red one. What is the mirror line?', opts, ans, ex + ' The mirror line cuts every segment from a point to its image in half, at a right angle.', {visual: both(P, Q)}); } },
}});

const ROT = { 90: {f: MOVE.r90, nm: `90${D} counterclockwise`, rule: ruleT(`${M}${IY}`, IX), why: 'For 90° counterclockwise, (x, y) → (−y, x): swap, then change the sign of the new x'},
  180: {f: MOVE.r180, nm: `180${D}`, rule: ruleT(`${M}${IX}`, `${M}${IY}`), why: 'For 180°, (x, y) → (−x, −y): both signs change'},
  270: {f: MOVE.r270, nm: `270${D} counterclockwise`, rule: ruleT(IY, `${M}${IX}`), why: 'For 270° counterclockwise (= 90° clockwise), (x, y) → (y, −x): swap, then change the sign of the new y'} };
const ORIG = {points: [{p: [0, 0], col: C.ink, t: 'O', dx: -10, dy: -11}]};
const rotWrong = (p, q) => [[-p[0], p[1]], [p[1], -p[0]], [-p[1], p[0]], [-p[0], -p[1]], [p[0], -p[1]], [p[1], p[0]]].map(v => v.map(z0)).filter(v => v.join() !== q.join()).map(v => pt(...v));
const rotStep = deg => (R) => { const Ro = ROT[deg], P = quad(R, rTri(R, 1, 5)), Q = ap2(Ro.f, P), i = R.int(0, 2), j = (i + 1) % 3, k = R.int(0, 2), p = P[i], q = Q[i];
  if (k === 0) return num(`Rotate the triangle ${Ro.nm} about the origin O. Where does ${NM[i]} go?`, xyF(NMp[i], q), `${Ro.why}: ${pt(...p)} → ${pt(...q)}.`, {visual: one(P, ORIG)});
  if (k === 1 && (Math.abs(p[0]) === Math.abs(p[1]))) return rotStep(deg)(R);
  if (k === 1) { const wr = R.sample(rotWrong(p, q), 3), cl = pt(...(deg === 90 ? [-p[0], p[1]] : deg === 180 ? [p[0], -p[1]] : [p[1], -p[0]]).map(z0)), ds = wr.includes(cl) || cl === pt(...q) ? wr : [cl].concat(wr.slice(0, 2));
    return choice(R, `Rotate ${pt(...p)} by ${Ro.nm} about the origin. Where does it go?`, pt(...q), ds, `${Ro.why}: ${pt(...p)} → ${pt(...q)}.${deg === 90 ? ' (−x, y) would be a reflection, not a turn.' : ''}`, {visual: V8.pl({points: [{p, t: 'P'}, {p: [0, 0], col: C.ink, t: 'O', dx: -10, dy: -11}]})}); }
  return num(`Rotate the triangle ${Ro.nm} about the origin. Find ${NMp[i]} and ${NMp[j]}.`, xyF(NMp[i], q).concat(xyF(NMp[j], Q[j])), `${Ro.why}: ${pt(...p)} → ${pt(...q)}, ${pt(...P[j])} → ${pt(...Q[j])}.`, {visual: one(P, ORIG)}); };
E3.skill({ id: 'III.8.21', name: 'Rotations', steps: {
  a: { t: '90° about the origin', g: rotStep(90) },
  b: { t: '180°', g: rotStep(180) },
  c: { t: '270° and direction', g: (R) => { const k = R.int(0, 2), P = quad(R, rTri(R, 1, 5)), Q = ap2(MOVE.r270, P), i = R.int(0, 2);
    if (k === 0) return num(`Rotate the triangle 270${D} counterclockwise about the origin. Where does ${NM[i]} go?`, xyF(NMp[i], Q[i]), `270° counterclockwise is the same as 90° clockwise: (x, y) → (y, −x), so ${pt(...P[i])} → ${pt(...Q[i])}.`, {visual: one(P, ORIG)});
    if (k === 1) return num(`Rotate the triangle 90${D} clockwise about the origin. Where does ${NM[i]} go?`, xyF(NMp[i], Q[i]), `90° clockwise: (x, y) → (y, −x), so ${pt(...P[i])} → ${pt(...Q[i])}.`, {visual: one(P, ORIG)});
    const [ask, ans, ds] = R.pick([[`270${D} counterclockwise`, `90${D} clockwise`, [`90${D} counterclockwise`, `270${D} clockwise`, `180${D}`]], [`90${D} clockwise`, `270${D} counterclockwise`, [`90${D} counterclockwise`, `180${D}`, `270${D} clockwise`]], [`270${D} clockwise`, `90${D} counterclockwise`, [`90${D} clockwise`, `180${D}`, `270${D} counterclockwise`]]]);
    return choice(R, `A turn of ${ask} ends in the same place as:`, ans, ds, `A full turn is 360°: going ${ask} leaves 360° ${M} 270° = 90° the other way, so it matches ${ans}.`); } },
  d: { t: 'coordinate rules', g: (R) => { const k = R.int(0, 2), degs = [90, 180, 270], dg = R.pick(degs), Ro = ROT[dg];
    const nm = d => d === 270 ? `90${D} clockwise` : ROT[d].nm;
    if (k === 0) return choice(R, `Which rule rotates a shape ${nm(dg)} about the origin?`, Ro.rule, [ROT[90].rule, ROT[180].rule, ROT[270].rule, ruleT(`${M}${IX}`, IY)].filter(r => r !== Ro.rule), `${Ro.why}. Check with (1, 0): it should land ${{90: 'on (0, 1)', 180: 'on (−1, 0)', 270: 'on (0, −1)'}[dg]}.`);
    const P = quad(R, rTri(R, 1, 5)), Q = ap2(Ro.f, P);
    if (k === 1) return choiceFixed('The red triangle turns about the origin onto the blue one. Which turn is it?', [`90${D} counterclockwise`, `180${D}`, `90${D} clockwise`], degs.indexOf(dg), `A${pt(...P[0])} → A${PR}${pt(...Q[0])}. ${Ro.why}.`, {visual: both(P, Q, ORIG)});
    const i = R.int(0, 2), j = (i + 2) % 3;
    return num(`Use the rule ${Ro.rule} to find ${NMp[i]} and ${NMp[j]}.`, xyF(NMp[i], Q[i]).concat(xyF(NMp[j], Q[j])), `${pt(...P[i])} → ${pt(...Q[i])} and ${pt(...P[j])} → ${pt(...Q[j])}. This is a ${nm(dg)} turn.`, {visual: one(P, ORIG)}); } },
}});

const kTxt = (n, d) => d === 1 ? String(n) : fh(n, d);
const dil = (P, k) => P.map(([x, y]) => [z0(x * k), z0(y * k)]).map(([x, y]) => [Math.round(x * 1000) / 1000, Math.round(y * 1000) / 1000]);
E3.skill({ id: 'III.8.22', name: 'Dilations', steps: {
  a: { t: 'scale factor > 1', g: (R) => { const k = R.pick([2, 2, 3]), P = rTri(R, k === 2 ? -3 : -2, k === 2 ? 3 : 2), Q = dil(P, k), i = R.int(0, 2), p = P[i], q = Q[i], t = R.int(0, 2);
    if (t === 0) return num(`Dilate the triangle by scale factor ${k}, centered at the origin. Where does ${NM[i]} go?`, xyF(NMp[i], q), `Multiply both coordinates by ${k}: ${pt(...p)} → ${pt(...q)}.`, {visual: one(P, ORIG)});
    if (t === 1 && (p[0] === p[1] || !p[0] || !p[1])) return again('III.8.22', 'a', R);
    if (t === 1) return choice(R, `Dilate ${pt(...p)} by scale factor ${k}, centered at the origin.`, pt(...q), [pt(p[0] + k, p[1] + k), pt(z0(k * p[0]), p[1]), pt(z0(k * p[1]), z0(k * p[0]))].filter(s => s !== pt(...q)), `A dilation multiplies, it doesn't add: (${k} ${X} ${sg(p[0])}, ${k} ${X} ${sg(p[1])}) = ${pt(...q)}.`);
    const L = R.int(2, 9); return num(`A side is ${L} units long. After a dilation with scale factor ${k}, how long is it?`, k * L, `Every length is multiplied by ${k}: ${k} ${X} ${L} = ${k * L}.`); } },
  b: { t: 'scale factor < 1', g: (R) => { const d = R.pick([2, 2, 3, 4]), t = R.int(0, 2);
    let P; if (d === 2) P = rTri(R, -6, 6); else if (d === 3) P = rTri(R, -2, 2).map(([x, y]) => [3 * x, 3 * y]); else P = rTri(R, -1, 1).map(([x, y]) => [4 * x, 4 * y]);
    if (d === 4 && Math.abs(area2(P)) < 1) return again('III.8.22', 'b', R);
    const Q = dil(P, 1 / d), i = R.int(0, 2), p = P[i], q = Q[i];
    if (t === 0) return num(`Dilate the triangle by scale factor ${fh(1, d)}, centered at the origin. Where does ${NM[i]} go?`, xyF(NMp[i], q), `Multiply by ${fh(1, d)} (divide by ${d}): ${pt(...p)} → ${pt(...q)}.`, {visual: one(P, ORIG)});
    if (t === 1) return choice(R, `Dilate ${pt(...p)} by scale factor ${fh(1, d)}, centered at the origin.`, pt(...q), [pt(...[p[0] + 1 / d, p[1] + 1 / d].map(v => Math.round(v * 1000) / 1000)), pt(z0(p[0] * d), z0(p[1] * d)), pt(...[p[0] - 1 / d, p[1] - 1 / d].map(v => Math.round(v * 1000) / 1000))].filter(s => s !== pt(...q)), `Scale factor ${fh(1, d)} means ${d === 2 ? 'half' : d === 3 ? 'a third' : d === 4 ? 'a quarter' : fh(1, d)} as big, not "add ${fh(1, d)}": ${pt(...p)} → ${pt(...q)}.`);
    const L = d * R.int(2, 8); return num(`A side is ${L} cm long. After a dilation with scale factor ${fh(1, d)}, how long is it, in cm?`, L / d, `${fh(1, d)} ${X} ${L} = ${L / d} cm. A scale factor less than 1 shrinks.`); } },
  c: { t: 'center at origin rule', g: (R) => { const t = R.int(0, 2);
    if (t === 0) { const [n, d] = R.pick([[2, 1], [3, 1], [4, 1], [1, 2], [1, 3], [3, 2], [1, 4]]), p = [R.pick([-2, -1, 1, 2]) * d * R.int(1, 2), R.pick([-3, -2, -1, 1, 2, 3]) * d], q = p.map(v => z0(v * n / d));
      return num(`A dilation centered at the origin sends ${pt(...p)} to ${pt(...q)}. What is the scale factor?`, [frac(n, d)], `Divide matching coordinates: ${sg(q[0])} ÷ ${sg(p[0])} = ${kTxt(n, d)}, and ${sg(q[1])} ÷ ${sg(p[1])} = ${kTxt(n, d)} too.`); }
    if (t === 1) { const k = R.int(2, 5);
      return choice(R, `Which rule is a dilation by scale factor ${k}, centered at the origin?`, ruleT(`${k}${IX}`, `${k}${IY}`), [ruleT(`${IX} + ${k}`, `${IY} + ${k}`), ruleT(`${k}${IX}`, IY), ruleT(`${IX} ÷ ${k}`, `${IY} ÷ ${k}`)], `A dilation from the origin multiplies both coordinates by k: (${k}x, ${k}y).`); }
    const P = rTri(R, -3, 3), mode = R.bool() ? 0 : R.int(1, 2), k = 2; let Q;
    if (mode === 0) Q = dil(P, k); else if (mode === 1) Q = P.map(([x, y]) => [z0(2 * x), y]); else Q = dil(P, k).map(([x, y]) => [x + 1, y]);
    if (!inR(Q) || sameSet(P, Q)) return again('III.8.22', 'c', R);
    return yn('Is the blue triangle a dilation of the red one, centered at the origin?', mode === 0, mode === 0 ? `Each point is multiplied by 2, e.g. ${pt(...P[0])} → ${pt(...Q[0])}. Yes.` : mode === 1 ? 'Only x is doubled; y stays the same. The shape is stretched, so no.' : `${pt(...P[0])} → ${pt(...Q[0])} is not (2x, 2y): the image is also shifted, so no.`, {visual: both(P, Q, ORIG)}); } },
  d: { t: 'what stays and what changes', g: (R) => { const t = R.int(0, 3), k = R.int(2, 4);
    if (t === 0) { const s = R.int(2, 6);
      return choice(R, `A square has side ${s}. It is dilated by scale factor ${k}. What is the new area?`, String(s * s * k * k), [String(s * s * k), String(s * k * 4), String((s + k) ** 2)].filter(v => v !== String(s * s * k * k)), `The side becomes ${k * s}, so the area is ${k * s}² = ${k * k * s * s}: ${k}² = ${k * k} times as big, not ${k} times.`); }
    if (t === 1) return choiceFixed(`A triangle is dilated by scale factor ${k}. What happens to its angles?`, ['They stay the same', `They are ${k} times as big`, `They are ${k * k} times as big`], 0, 'Dilations keep the shape: angles stay the same. Only lengths (×k) and area (×k²) change.');
    if (t === 2) { const w = R.int(2, 6), h = R.int(2, 6);
      return num(`A ${w} by ${h} rectangle is dilated by scale factor ${k}. Find the new perimeter and area.`, [{label: 'perimeter', ans: 2 * k * (w + h)}, {label: 'area', ans: k * k * w * h}], `New sides ${k * w} and ${k * h}: perimeter ${2 * k * (w + h)} (${k} times ${2 * (w + h)}), area ${k * k * w * h} (${k * k} times ${w * h}).`); }
    return num(`After a dilation, a shape's area is ${k * k} times as big. What is the scale factor?`, k, `Area grows by k². k² = ${k * k}, so k = ${k}.`); } },
}});

const MVNAME = {rx: 'reflect over the x-axis', ry: 'reflect over the y-axis', r90: `rotate 90${D} counterclockwise about the origin`, r180: `rotate 180${D} about the origin`, r270: `rotate 90${D} clockwise about the origin`};
const cap = s => s[0].toUpperCase() + s.slice(1);
const trP = (P, a, b) => P.map(([x, y]) => [x + a, y + b]);
// place two triangles side by side, second optionally turned/flipped
const twoTri = (P1_, P2_, o1, o2) => V.side([V8.poly(P1_, Object.assign({maxW: 170, maxH: 130}, o1)), V8.poly(P2_, Object.assign({maxW: 170, maxH: 130}, o2))], {gap: 30});
E3.skill({ id: 'III.8.23', name: 'Congruence & similarity informally', steps: {
  a: { t: 'congruent means rigid moves', g: (R) => { const t = R.int(0, 2);
    if (t === 0) return choice(R, 'Which move can change the size of a shape?', 'A dilation', ['A translation', 'A rotation', 'A reflection'], 'Translations, rotations and reflections are rigid: they keep every length. Only a dilation changes size.');
    if (t === 1) { const s = R.distinct(3, 12, 3), pairs = [['AB', 'DE'], ['BC', 'EF'], ['CA', 'FD']], i = R.int(0, 2);
      return num(`Triangle ABC is ${R.pick(['reflected', 'rotated', 'translated'])} onto triangle DEF (A→D, B→E, C→F). AB = ${s[0]}, BC = ${s[1]}, CA = ${s[2]}. How long is ${pairs[i][1]}?`, s[i], `Rigid moves keep lengths, so ${pairs[i][1]} = ${pairs[i][0]} = ${s[i]}.`); }
    const P = quad(R, rTri(R, 1, 4)), mode = R.int(0, 3); let Q;
    if (mode === 0) Q = ap2(MOVE.r180, P); else if (mode === 1) Q = ap2(R.pick([MOVE.rx, MOVE.ry]), P); else if (mode === 2) Q = P.map(([x, y]) => [z0(-y), z0(2 * x)]); else Q = dil(ap2(MOVE.r90, P), 1.5).map(([x, y]) => [Math.round(x), Math.round(y)]);
    if (!inR(Q) || sameSet(P, Q)) return again('III.8.23', 'a', R);
    const cong = mode <= 1;
    return yn('Are the red and blue triangles congruent?', cong, cong ? `The blue one is the red one after a ${mode === 0 ? '180° rotation' : 'reflection'}: a rigid move, so yes.` : 'The blue triangle has different side lengths, so no rigid move can map red onto it. Not congruent.', {visual: V8.pl({polys: [{pts: P, col: C.red}, {pts: Q, col: C.blue, dash: true}]})}); } },
  b: { t: 'similar means moves + dilation', g: (R) => { const t = R.int(0, 3);
    if (t === 0) { const a = R.int(2, 6), b = a + R.int(1, 5), k = R.int(2, 3), ok = R.bool(), n = R.int(1, 4), c = ok ? [k * a, k * b] : [a + n * k, b + n * k];
      return yn(`Is a ${a} by ${b} rectangle similar to a ${c[0]} by ${c[1]} rectangle?`, ok, ok ? `Both sides are multiplied by ${k}, so yes: it is a dilation by ${k}.` : `${c[0]} ÷ ${a} ${c[0] / a === c[1] / b ? '=' : '≠'} ${c[1]} ÷ ${b}. Adding the same amount to both sides doesn't keep the shape. Not similar.`); }
    if (t === 1) { const a = R.int(2, 7), b = a + R.int(1, 6), k = R.pick([2, 3, 4, 5]);
      return num(`A ${a} by ${b} rectangle is similar to a ${k * a} by ? rectangle. Find the missing side.`, k * b, `The scale factor is ${k * a} ÷ ${a} = ${k}, so ? = ${k} ${X} ${b} = ${k * b}.`); }
    if (t === 2) return choice(R, 'Two shapes are similar. Which must be the same?', 'Their angles', ['Their side lengths', 'Their areas', 'Their perimeters'], 'Similar shapes are dilated copies: same angles, with all lengths scaled by the same factor.');
    const P = quad(R, rTri(R, 1, 3)), ok = R.bool(); let Q = ok ? dil(ap2(R.pick([MOVE.r90, MOVE.r180, MOVE.rx]), P), 2) : ap2(MOVE.r90, P).map(([x, y]) => [z0(2 * x), y]);
    const [a, b] = trVec(R, Q); Q = trP(Q, R.bool() ? a : 0, R.bool() ? b : 0);
    if (!inR(Q) || sameSet(P, Q)) return again('III.8.23', 'b', R);
    return yn('Is the blue triangle similar to the red one?', ok, ok ? 'Blue is red turned or flipped, then enlarged by 2: every side doubles. Similar.' : 'Blue is stretched in one direction only, so its angles change. Not similar.', {visual: V8.pl({polys: [{pts: P, col: C.red}, {pts: Q, col: C.blue, dash: true}]})}); } },
  c: { t: 'find a sequence of moves', g: (R) => { const keys = Object.keys(MVNAME);
    for (let tries = 0; tries < 200; tries++) { const P = quad(R, rTri(R, 1, 4)), m1 = R.pick(keys), M1 = ap2(MOVE[m1], P), [a, b] = trVec(R, M1), Q = trP(M1, a, b);
      if (!inR(Q) || sameSet(P, Q)) continue;
      const desc = (mk, x, y) => `${cap(MVNAME[mk])}, then slide ${dirTxt(x, y)}`, correct = desc(m1, a, b), img = (mk, x, y) => trP(ap2(MOVE[mk], P), x, y);
      if (R.bool(0.3)) { const i = R.int(0, 2);
        return num(`Triangle ABC: first ${MVNAME[m1]}, then slide ${dirTxt(a, b)}. Where does ${NM[i]} end up?`, xyF(NMp[i], Q[i]), `${pt(...P[i])} → ${pt(...M1[i])} after the first move, then → ${pt(...Q[i])} after the slide.`, {visual: one(P, ORIG)}); }
      const cands = [];
      keys.filter(k2 => k2 !== m1).forEach(k2 => { const I = img(k2, a, b); if (!sameSet(I, Q)) cands.push(desc(k2, a, b)); });
      [[-a, -b], [b, a], [a, -b], [-a, b]].forEach(([x, y]) => { if (x && y && !sameSet(img(m1, x, y), Q)) cands.push(desc(m1, x, y)); });
      const ds = R.shuffle([...new Set(cands)]).slice(0, 3); if (ds.length < 3) continue;
      return choice(R, 'Which sequence of moves maps the red triangle onto the blue one?', correct, ds, `Check a corner: A${pt(...P[0])} → ${pt(...M1[0])} (${MVNAME[m1]}) → ${pt(...Q[0])} (slide ${dirTxt(a, b)}). It lands on A${PR}.`, {visual: both(P, Q, ORIG)}); }
    return again('III.8.23', 'c', R); } },
  d: { t: 'AA similarity for triangles', g: (R) => { const t = R.int(0, 3);
    if (t === 0) { let A, B; do { A = R.int(30, 85); B = R.int(30, 85); } while (180 - A - B < 25 || Math.abs(A - B) < 6 || Math.abs(180 - A - B - A) < 6 || Math.abs(180 - A - B - B) < 6);
      const Cg = 180 - A - B, ok = R.bool(), T2 = ok ? R.shuffle([A, B, Cg]) : R.shuffle([A, B + R.pick([-12, 12, 18]), 0]).map((v, i, arr) => v || 180 - arr.reduce((s, w) => s + w, 0));
      if (T2.some(v => v < 15) || (!ok && sortN(T2).join() === sortN([A, B, Cg]).join())) return again('III.8.23', 'd', R);
      const p1 = triAng(A, B, 10), p2 = turnP(triAng(T2[0], T2[1], R.pick([6, 13])), R.pick([0, 30, 180, 150, -20]));
      const sim = ok, known2 = `${T2[0]}${D} and ${T2[1]}${D}`;
      return yn('Are the two triangles similar?', sim, `Third angles: ${Cg}${D} and ${180 - T2[0] - T2[1]}${D}. ${sim ? `Both are ${[A, B, Cg].sort((x, y) => x - y).join('°, ')}°, so two pairs of angles match (AA): similar.` : `The angle sets ${[A, B, Cg].sort((x, y) => x - y).join(', ')} and ${T2.slice().sort((x, y) => x - y).join(', ')} differ: not similar.`}`,
        {visual: twoTri(p1, p2, {angles: {0: deg(A), 1: deg(B)}}, {angles: {0: deg(T2[0]), 1: deg(T2[1])}})}); }
    if (t === 1) { const s = R.int(3, 6), w = R.int(2, 4), l = w + R.int(4, 7);
      return choiceFixed(`A ${s} by ${s} square and a ${w} by ${l} rectangle both have four right angles. Are they similar?`, ['Yes: equal angles are enough', 'No: the sides are not in proportion'], 1, `Equal angles only guarantee similarity for triangles. ${s} ÷ ${s} = 1 but ${l} ÷ ${w} ≠ 1, so the shapes differ.`); }
    if (t === 2) { const [p, q, c] = R.pick(SMALLTRI.slice(0, 4)), k = R.pick([2, 3]), rot = R.pick([0, 90, 180, 270, 30]);
      const v1 = V8.poly(rtri(p, q, 0), {labels: [String(p), String(c), String(q)], right: [0], angles: {1: 'a'}, maxW: 150, maxH: 120});
      const v2 = V8.poly(rtri(k * p, k * q, rot, true), {labels: [String(k * p), '', '?'], right: [0], angles: {1: 'a'}, maxW: 200, maxH: 170});
      return num('Both triangles have a right angle and an equal angle a, so they are similar (AA). Find ?', k * q, `The scale factor is ${k * p} ÷ ${p} = ${k}, so ? = ${k} ${X} ${q} = ${k * q}.`, {visual: V.side([v1, v2], {gap: 30})}); }
    let A, B; do { A = R.int(25, 80); B = R.int(25, 80); } while (180 - A - B < 20 || A === B || A === 180 - A - B || B === 180 - A - B);
    const Cg = 180 - A - B, pair = R.pick([[A, Cg], [B, Cg]]).map(deg).join(', '), set = [A, B, Cg];
    const isSim = (x, y) => x + y < 180 && sortN([x, y, 180 - x - y]).join() === sortN(set).join();
    const cands = [[A, Cg + 10], [B, A + 10], [Cg, B + 10], [A, B + 12], [Cg, A - 8]].filter(([x, y]) => y > 5 && x + y < 175 && !isSim(x, y)).map(([x, y]) => `angles ${deg(x)}, ${deg(y)}`);
    return choice(R, `A triangle has angles ${A}${D} and ${B}${D}. Which triangle is similar to it?`, `angles ${pair}`, cands.slice(0, 3), `The third angle is 180 ${M} ${A} ${M} ${B} = ${Cg}${D}. A triangle with two of ${A}${D}, ${B}${D}, ${Cg}${D} is similar (AA).`); } },
}});

/* @@END */
})();

/* Era III · Unit III.9 Statistics & probability (III.9.01–III.9.20)
   Every statistic is computed from the generated data. Quartiles: median of each half, leaving out the
   overall median when the count is odd. Local visuals live under V9. */
(function(){ const {num, choice, choiceFixed, tf, frac, fh, fmt, m, V, C} = E3;
/* ---------- small helpers ---------- */
const sum = a => a.reduce((x, y) => x + y, 0);
const srt = a => a.slice().sort((x, y) => x - y);
const mean = a => sum(a) / a.length;
const median = a => { const s = srt(a), n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; };
const halves = a => { const s = srt(a), n = s.length; return [s.slice(0, Math.floor(n / 2)), s.slice(Math.ceil(n / 2))]; };
const quart = a => { const [lo, hi] = halves(a); return [median(lo), median(hi)]; };
const five = a => { const s = srt(a), [q1, q3] = quart(a); return [s[0], q1, median(a), q3, s[s.length - 1]]; };
const counts = a => { const c = new Map(); a.forEach(v => c.set(v, (c.get(v) || 0) + 1)); return c; };
const modes = a => { const c = counts(a), mx = Math.max(...c.values()); if (mx === 1) return []; return srt([...c.keys()].filter(k => c.get(k) === mx)); };
const mad = a => { const mu = mean(a); return sum(a.map(v => Math.abs(v - mu))) / a.length; };
const dp = (x, k) => Math.abs(Math.round(x * 10 ** k) - x * 10 ** k) < 1e-9;
const F = x => fmt(x);                                   // number → text (real minus, no float noise)
const L = a => a.map(F).join(', ');
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const red = (n, d) => E3.reduce(n, d);
const fr = (n, d) => { const [a, b] = red(n, d); return b === 1 ? String(a) : fh(a, b); };   // HTML fraction, reduced
const frRaw = (n, d) => d === 1 ? String(n) : fh(n, d);                                       // HTML fraction as written
const NAMES = ['Ana', 'Ben', 'Mia', 'Leo', 'Sara', 'Tom', 'Kim', 'Raj', 'Noor', 'Eli', 'Zoe', 'Max'];
const tries = (gen, ok, n = 500) => { for (let i = 0; i < n; i++) { const d = gen(); if (ok(d)) return d; } throw new Error('no data after ' + n + ' tries'); };
const P1 = v => Math.round(v * 10) / 10;
const nzI = (R, lo, hi) => { let v; do v = R.int(lo, hi); while (!v); return v; };

/* ================= V9 visuals ================= */
const V9 = {};
const line = (x1, y1, x2, y2, col = C.ink, w = 2) => `<line x1="${P1(x1)}" y1="${P1(y1)}" x2="${P1(x2)}" y2="${P1(y2)}" stroke="${col}" stroke-width="${w}"/>`;
const rect = (x, y, w, h, fill, st = C.ink, sw = 1.5) => `<rect x="${P1(x)}" y="${P1(y)}" width="${P1(w)}" height="${P1(h)}" fill="${fill}" stroke="${st}" stroke-width="${sw}"/>`;
const lblEvery = (span, sp) => [1, 2, 5, 10, 20, 25, 50].find(k => k * sp >= 26 && (k === 1 || true)) || 50;
// number-line axis from lo to hi, tick every `step`; returns {b, X}
const axis = (lo, hi, x0, x1, y, step = 1, o = {}) => {
  const X = v => x0 + (v - lo) / (hi - lo) * (x1 - x0); let b = line(x0 - 8, y, x1 + 8, y);
  const sp = (x1 - x0) / ((hi - lo) / step), every = o.every || lblEvery(hi - lo, sp);
  for (let v = lo, k = 0; v <= hi + 1e-9; v += step, k++) {
    b += line(X(v), y - 5, X(v), y + 5, C.ink, 1.5);
    if (Math.round(v / step) % Math.max(1, Math.round(every / step)) === 0 || every <= step) b += V.text(X(v), y + 18, F(v), { size: 13, fill: C.muted });
  }
  return { b, X };
};
// dot plot of values (integers) from lo to hi
V9.dot = (vals, lo, hi, o = {}) => {
  const n = hi - lo, sp = Math.min(40, Math.max(22, 520 / n)), pad = 24, W = pad * 2 + n * sp;
  const c = counts(vals), mx = Math.max(3, ...c.values()), r = Math.min(8, sp / 2 - 3), gap = 2 * r + 3, y = 10 + mx * gap;
  const A = axis(lo, hi, pad, W - pad, y, 1, { every: o.every || (n > 16 ? 2 : 1) }); let b = A.b;
  c.forEach((k, v) => { for (let i = 0; i < k; i++) b += V.dot(P1(A.X(v)), P1(y - 10 - r - i * gap), r, o.color || C.blue); });
  let H = y + 30; if (o.title) { b += V.text(W / 2, H + 2, o.title, { size: 13, fill: C.muted }); H += 18; }
  return V.svg(Math.round(W), Math.round(H), b, 'dot plot');
};
// box plots: rows [{f:[min,q1,med,q3,max], label, color}], axis lo..hi with tick step
V9.box = (rows, lo, hi, step, o = {}) => {
  const W = o.w || 460, left = rows.some(r => r.label) ? 34 : 16, right = 18, bh = o.bh || 30, rh = bh + 20;
  const X = v => left + (v - lo) / (hi - lo) * (W - left - right); let b = '';
  rows.forEach((r, i) => {
    const [mn, q1, md, q3, mx] = r.f, cy = 10 + i * rh + bh / 2, col = r.color || C.teal;
    b += line(X(mn), cy, X(q1), cy, C.ink, 2) + line(X(q3), cy, X(mx), cy, C.ink, 2);
    b += line(X(mn), cy - bh / 3, X(mn), cy + bh / 3, C.ink, 2) + line(X(mx), cy - bh / 3, X(mx), cy + bh / 3, C.ink, 2);
    b += rect(X(q1), cy - bh / 2, X(q3) - X(q1), bh, col + '44', C.ink, 2) + line(X(md), cy - bh / 2, X(md), cy + bh / 2, C.ink, 3);
    (r.out || []).forEach(v => b += `<circle cx="${P1(X(v))}" cy="${cy}" r="4" fill="none" stroke="${C.ink}" stroke-width="2"/>`);
    if (r.label) b += V.text(12, cy, r.label, { size: 15, weight: 700 });
  });
  const y = 10 + rows.length * rh; const A = axis(lo, hi, X(lo), X(hi), y, step, { every: o.every });
  return V.svg(W, y + 28, b + A.b, 'box plot');
};
// histogram: edges [e0..ek], counts [c1..ck]
V9.hist = (edges, cnt, o = {}) => {
  const k = cnt.length, left = 40, top = 12, PH = o.ph || 170, bw = o.bw || Math.min(64, 440 / k), W = left + k * bw + 24;
  const mx = Math.max(...cnt), ys = mx > 12 ? 2 : 1, ymax = Math.ceil((mx + 1) / ys) * ys, Y = v => top + PH - v / ymax * PH; let b = '';
  for (let v = 0; v <= ymax; v += ys) { b += line(left, Y(v), W - 14, Y(v), v ? C.faint : C.ink, v ? 1 : 2); b += V.text(left - 8, Y(v), v, { size: 12, anchor: 'end', fill: C.muted }); }
  cnt.forEach((c, i) => { if (c) b += rect(left + i * bw, Y(c), bw, Y(0) - Y(c), (o.color || C.blue) + 'bb', C.ink, 1.5); });
  edges.forEach((e, i) => b += line(left + i * bw, Y(0), left + i * bw, Y(0) + 5) + V.text(left + i * bw, Y(0) + 17, F(e), { size: 12, fill: C.muted }));
  b += line(left, top - 4, left, Y(0));
  let H = top + PH + 30; if (o.title) { b += V.text(left + k * bw / 2, H, o.title, { size: 13, fill: C.muted }); H += 16; }
  return V.svg(Math.round(W), H, b, 'histogram');
};
// scatter plot. pts [[x,y,label?]], o: xmax,ymax,xstep,ystep,xmin,ymin, xt,yt titles, lines [{m,b,color,label}]
V9.scatter = (pts, o = {}) => {
  const x0 = o.xmin || 0, y0 = o.ymin || 0, x1 = o.xmax, y1 = o.ymax, xs = o.xstep || 1, ys = o.ystep || 1;
  const left = 46, top = 14, PW = o.pw || 320, PH = o.ph || 240, W = left + PW + 24, H = top + PH + (o.xt ? 50 : 32);
  const X = v => left + (v - x0) / (x1 - x0) * PW, Y = v => top + PH - (v - y0) / (y1 - y0) * PH; let b = '';
  const xe = o.xevery || xs, ye = o.yevery || ys;
  for (let v = x0; v <= x1 + 1e-9; v += xs) { b += line(X(v), top, X(v), Y(y0), C.faint, 1); if (Math.abs(Math.round((v - x0) / xe) * xe - (v - x0)) < 1e-9) b += V.text(X(v), Y(y0) + 15, F(v), { size: 12, fill: C.muted }); }
  for (let v = y0; v <= y1 + 1e-9; v += ys) { b += line(left, Y(v), X(x1), Y(v), C.faint, 1); if (Math.abs(Math.round((v - y0) / ye) * ye - (v - y0)) < 1e-9) b += V.text(left - 7, Y(v), F(v), { size: 12, anchor: 'end', fill: C.muted }); }
  b += line(left, Y(y0), X(x1) + 4, Y(y0)) + line(left, Y(y1) - 4, left, Y(y0));
  const placed = [];
  (o.lines || []).forEach(Ln => {
    const ends = [[x0, Ln.m * x0 + Ln.b], [x1, Ln.m * x1 + Ln.b]];
    const clipY = ([x, y]) => { if (y > y1) return [(y1 - Ln.b) / Ln.m, y1]; if (y < y0) return [(y0 - Ln.b) / Ln.m, y0]; return [x, y]; };
    const [p, q] = ends.map(clipY);
    b += line(X(p[0]), Y(p[1]), X(q[0]), Y(q[1]), Ln.color || C.red, 2.5);
    if (Ln.label) { const side = q[0] >= x1 - 1e-9, top = !side && q[1] >= y1 - 1e-9, lx = X(q[0]) + (side || top ? 12 : 0); let ly = Y(q[1]) + (side ? 0 : top ? 12 : -10);
      while (placed.some(([px, py]) => Math.abs(px - lx) < 16 && Math.abs(py - ly) < 16)) ly += 16; placed.push([lx, ly]);
      b += V.text(lx, ly, Ln.label, { size: 14, weight: 700, fill: Ln.color || C.red }); }
  });
  pts.forEach(([x, y, t]) => { b += V.dot(P1(X(x)), P1(Y(y)), 5, o.color || C.blue); if (t) b += V.text(P1(X(x) + 10), P1(Y(y) - 10), t, { size: 14, weight: 700 }); });
  if (o.xt) b += V.text(left + PW / 2, top + PH + 36, o.xt, { size: 13, fill: C.muted });
  if (o.yt) b += `<text x="14" y="${top + PH / 2}" font-size="13" fill="${C.muted}" text-anchor="middle" transform="rotate(-90 14 ${top + PH / 2})">${V.esc(o.yt)}</text>`;
  return V.svg(W, H, b, 'scatter plot');
};
// table: rows of cells (strings). o.head: first row shaded, o.side: first column shaded, '?' cells amber
V9.table = (rows, o = {}) => {
  const rh = 34, ncol = rows[0].length;
  const cw = Array.from({ length: ncol }, (_, j) => Math.max(j === 0 ? (o.first || 70) : (o.cell || 64), ...rows.map(r => String(r[j]).length * 8.5 + 22)));
  const W = sum(cw) + 4; let b = '';
  rows.forEach((r, i) => { let x = 2; const y = 2 + i * rh;
    r.forEach((c, j) => {
      const sh = (i === 0 && o.head !== false) || (j === 0 && o.side !== false);
      b += rect(x, y, cw[j], rh, sh ? C.faint : C.paper, C.ink, 1.3);
      if (c === '?') b += `<rect x="${x + cw[j] / 2 - 15}" y="${y + 6}" width="30" height="${rh - 12}" rx="5" fill="${C.amber}"/>` + V.text(x + cw[j] / 2, y + rh / 2, '?', { size: 15, weight: 700 });
      else b += V.text(x + cw[j] / 2, y + rh / 2, c, { size: 14, weight: sh || (o.boldTotal && (i === rows.length - 1 || j === ncol - 1)) ? 700 : 500 });
      x += cw[j]; });
  });
  return V.svg(Math.round(W), rows.length * rh + 4, b, 'table');
};
// cube stacks for fair share
V9.stacks = vals => {
  const s = 20, sp = 50, mx = Math.max(...vals), W = vals.length * sp + 10, H = mx * s + 12; let b = '';
  vals.forEach((v, i) => { const x = 10 + i * sp; for (let k = 0; k < v; k++) b += rect(x, 4 + (mx - k - 1) * s, s, s, C.set[i % 7], C.ink, 1.3); });
  b += line(4, mx * s + 4, W - 4, mx * s + 4);
  return V.svg(W, H, b, 'stacks of cubes');
};
// bag of marbles: [[count,color]]
V9.bag = parts => {
  const all = []; parts.forEach(([k, col]) => { for (let i = 0; i < k; i++) all.push(col); });
  const per = Math.min(8, Math.max(4, Math.ceil(Math.sqrt(all.length * 1.6)))), r = 11, g = 27, rows = Math.ceil(all.length / per);
  const W = per * g + 30, H = rows * g + 28; let b = `<path d="M8 10 Q4 ${H - 4} ${W / 2} ${H - 4} Q${W - 4} ${H - 4} ${W - 8} 10" fill="${C.faint}" stroke="${C.ink}" stroke-width="2"/>`;
  all.forEach((col, i) => b += `<circle cx="${15 + g / 2 + (i % per) * g}" cy="${16 + g / 2 + Math.floor(i / per) * g}" r="${r}" fill="${col}" stroke="${C.ink}" stroke-width="1.2"/>`);
  return V.svg(W, H, b, 'bag of marbles');
};
// spinner with equal sectors: labels, colors
V9.spinner = (labels, cols, o = {}) => {
  const r = o.r || 62, cx = r + 6, cy = r + 6, n = labels.length; let b = '';
  labels.forEach((t, i) => {
    const a0 = -Math.PI / 2 + i * 2 * Math.PI / n, a1 = a0 + 2 * Math.PI / n, p = a => `${P1(cx + r * Math.cos(a))} ${P1(cy + r * Math.sin(a))}`;
    b += n === 1 ? `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${cols ? cols[i] : C.paper}" stroke="${C.ink}" stroke-width="2"/>` : `<path d="M${cx} ${cy} L${p(a0)} A${r} ${r} 0 0 1 ${p(a1)} Z" fill="${cols ? cols[i] + '99' : C.paper}" stroke="${C.ink}" stroke-width="2"/>`;
    const am = (a0 + a1) / 2; if (t !== '') b += V.text(P1(cx + r * 0.66 * Math.cos(am)), P1(cy + r * 0.66 * Math.sin(am)), t, { size: n > 8 ? 12 : 15, weight: 700 });
  });
  b += line(cx, cy, cx + r * 0.3, cy - r * 0.2, C.ink, 3) + V.dot(cx, cy, 4, C.ink);
  return V.svg(2 * r + 12, 2 * r + 12, b, 'spinner');
};
// two-level tree diagram
V9.tree = (A, B, o = {}) => {
  const n = A.length * B.length, rh = 24, H = n * rh + 8, W = 330; let b = '';
  A.forEach((a, i) => {
    const ys = B.map((_, j) => 4 + (i * B.length + j) * rh + rh / 2), ay = (ys[0] + ys[ys.length - 1]) / 2;
    b += line(12, H / 2, 110, ay, C.muted, 1.5) + `<rect x="${110}" y="${ay - 12}" width="${Math.max(50, a.length * 8 + 14)}" height="24" rx="6" fill="${C.faint}" stroke="${C.ink}" stroke-width="1.2"/>` + V.text(110 + Math.max(50, a.length * 8 + 14) / 2, ay, a, { size: 13, weight: 600 });
    B.forEach((bb, j) => { b += line(110 + Math.max(50, a.length * 8 + 14), ay, 215, ys[j], C.muted, 1.5) + V.text(222, ys[j], bb, { size: 13, anchor: 'start' }); });
  });
  b += V.dot(12, H / 2, 4, C.ink);
  return V.svg(W, H, b, 'tree diagram');
};

/* ================= III.9.01 Statistical questions ================= */
const TOP = [
  { about: 'sleep', q: 'How many hours did students in our class sleep last night?', one: 'How many hours did Sam sleep last night?', vague: 'Do students in our class sleep enough?', data: "each student's hours of sleep last night", bad: ["Sam's hours of sleep last night", 'the number of students in our class', 'the time school starts'] },
  { about: 'pets', q: 'How many pets does each grade 7 student have?', one: 'How many pets does Mia have?', vague: 'Do grade 7 students like pets?', data: 'the number of pets each grade 7 student has', bad: ["Mia's number of pets", 'the number of grade 7 students', 'the prices of pets in a shop'] },
  { about: 'travel to school', q: 'How many minutes does it take students at our school to get to school?', one: 'How many minutes does it take Leo to get to school?', vague: 'Is school far away?', data: "each student's travel time to school, in minutes", bad: ["Leo's travel time to school", 'the time school starts', 'the number of school buses'] },
  { about: 'heights', q: "How tall are the students in Mia's class?", one: 'How tall is Mia?', vague: "Are the students in Mia's class tall?", data: 'the height of each student in the class', bad: ["Mia's height", 'the height of the classroom door', 'the number of students in the class'] },
  { about: 'summer reading', q: 'How many books did each grade 6 student read this summer?', one: 'How many books did Ben read this summer?', vague: 'Do grade 6 students read?', data: 'the number of books each grade 6 student read this summer', bad: ['the number of books in the library', "Ben's number of books", 'the number of grade 6 students'] },
  { about: 'screen time', q: 'How many hours of screen time did the members of our club have yesterday?', one: 'How many hours of screen time did I have yesterday?', vague: 'Is screen time bad?', data: "each club member's screen time yesterday, in hours", bad: ['my screen time yesterday', 'the number of phones sold this year', 'the number of club members'] },
  { about: 'shoe sizes', q: 'What shoe sizes do the players on our team wear?', one: 'What shoe size does Coach Kim wear?', vague: 'Do our players have big feet?', data: 'the shoe size of each player on the team', bad: ["Coach Kim's shoe size", 'the price of the team shoes', 'the number of players'] },
  { about: 'temperatures', q: 'What was the high temperature each day in our town last month?', one: 'What is the temperature outside right now?', vague: 'Was last month hot?', data: 'the high temperature for each day of last month', bad: ['the temperature outside right now', 'the number of days in the month', "the town's population"] },
  { about: 'siblings', q: 'How many siblings do the students at our school have?', one: 'How many siblings does Noor have?', vague: 'Are families at our school big?', data: 'the number of siblings of each student at the school', bad: ["Noor's number of siblings", 'the number of classrooms', 'the number of students at the school'] },
  { about: 'plant growth', q: "How many centimeters did each of the class's bean plants grow in a week?", one: 'How tall is the tallest bean plant?', vague: 'Do bean plants grow well?', data: "each bean plant's growth in one week", bad: ['the height of the tallest plant', 'the number of beans in a packet', 'the date the beans were planted'] },
  { about: 'long jump', q: 'How far did each grade 7 student jump in the long jump?', one: 'How far did Raj jump on his first try?', vague: 'Is grade 7 good at jumping?', data: "the distance of each grade 7 student's long jump", bad: ["Raj's first jump", 'the length of the sand pit', 'the number of grade 7 students'] },
  { about: 'phone apps', q: 'How many apps do the teachers at our school have on their phones?', one: 'How many apps does Ms Lee have on her phone?', vague: 'Do teachers like apps?', data: "the number of apps on each teacher's phone", bad: ["the number of apps on Ms Lee's phone", 'the number of apps in the app store', 'the number of teachers'] },
];
const FACTS = ['How many days are in a week?', 'How many legs does a spider have?', 'How tall is the school flagpole?', 'What year was our school built?', 'How many minutes are in an hour?'];
const STAT_EXPL = 'A statistical question asks about a group and expects answers that vary. A question with one answer is not statistical.';
E3.skill({ id: 'III.9.01', name: 'Statistical questions', steps: {
  a: { t: 'statistical vs not', g: R => {
    const [t, u] = R.sample(TOP, 2);
    if (R.bool(0.6)) return choice(R, 'Which is a statistical question?', t.q, [t.one, u.one, R.pick(FACTS)], `"${t.q}" asks a whole group, so the answers vary. The others each have one answer.`);
    return choice(R, 'Which is <b>not</b> a statistical question?', t.one, [t.q, u.q], `"${t.one}" has just one answer, so it is not statistical. The others ask a whole group.`);
  } },
  b: { t: 'expect variability', g: R => {
    const k = R.int(0, 2), t = R.pick(TOP), q = k === 0 ? t.q : k === 1 ? t.one : R.pick(FACTS);
    return choiceFixed(`"${q}"<br>How many different answers would you expect?`, ['Many different answers', 'Just one answer'], k === 0 ? 0 : 1,
      k === 0 ? 'It asks a whole group, and members differ, so the answers vary. That makes it statistical.' : 'It has one answer, so there is no variability: it is not a statistical question.');
  } },
  c: { t: 'write a good question', g: R => {
    const t = R.pick(TOP);
    return choice(R, `Which is the best statistical question about ${t.about}?`, t.q, [t.one, t.vague],
      `It names a group and asks each member for a value you can record. The others are too vague or have one answer.`);
  } },
  d: { t: 'pick what data to collect', g: R => {
    const t = R.pick(TOP);
    return choice(R, `To answer "${t.q}", what data should you collect?`, t.data, R.sample(t.bad, 3), `The question asks about every member of the group, so record ${t.data}.`);
  } },
} });

/* ================= III.9.02 Mean ================= */
E3.skill({ id: 'III.9.02', name: 'Mean', steps: {
  a: { t: 'fair-share meaning', g: R => {
    const v = tries(() => Array.from({ length: R.int(3, 5) }, () => R.int(1, 9)), a => sum(a) % a.length === 0 && new Set(a).size > 1);
    const mu = sum(v) / v.length;
    return num(`Move cubes between the ${v.length} stacks until every stack is the same height. How many cubes are in each stack?`, mu,
      `There are ${v.join(' + ')} = ${sum(v)} cubes. Shared fairly: ${sum(v)} ÷ ${v.length} = ${mu}. That fair share is the mean.`, { visual: V9.stacks(v) });
  } },
  b: { t: 'compute the mean', g: R => {
    const n = R.pick([4, 5, 5, 6, 8, 10]);
    const v = tries(() => Array.from({ length: n }, () => R.int(8, 45)), a => dp(sum(a) / n, 2));
    const mu = sum(v) / n;
    return num(`Find the mean: ${L(v)}`, mu, `Add them: ${sum(v)}. Divide by the count: ${sum(v)} ÷ ${n} = ${F(mu)}. The mean needn't be one of the values.`);
  } },
  c: { t: 'missing value for a target mean', g: R => {
    const k = R.int(3, 5), T = R.int(70, 92);
    const v = tries(() => Array.from({ length: k }, () => R.int(60, 98)), a => { const x = T * (k + 1) - sum(a); return x >= 55 && x <= 100; });
    const x = T * (k + 1) - sum(v);
    return num(`Test scores so far: ${L(v)}. What score on the next test makes the mean of all ${k + 1} tests exactly ${T}?`, x,
      `The total must be ${k + 1} × ${T} = ${T * (k + 1)}. So far ${sum(v)}, so the next score is ${T * (k + 1)} − ${sum(v)} = ${x}.`);
  } },
  d: { t: 'effect of an outlier', g: R => {
    const hi = R.bool(0.65), n = R.int(4, 6);
    const d = tries(() => { const v = Array.from({ length: n }, () => R.int(20, 40)); const o = hi ? R.int(80, 150) : R.int(0, 6); return { v, o }; },
      ({ v, o }) => sum(v) % n === 0 && (sum(v) + o) % (n + 1) === 0);
    const all = R.shuffle(d.v.concat([d.o])), m1 = (sum(d.v) + d.o) / (n + 1), m0 = sum(d.v) / n;
    return num(`Data: ${L(all)}. The value ${d.o} is an outlier. Find the mean with it and without it.`, [{ label: `mean with ${d.o}`, ans: m1 }, { label: `mean without ${d.o}`, ans: m0 }],
      `With it: ${sum(d.v) + d.o} ÷ ${n + 1} = ${m1}. Without it: ${sum(d.v)} ÷ ${n} = ${m0}. The outlier pulls the mean ${hi ? 'up' : 'down'} toward itself.`);
  } },
} });

/* ================= III.9.03 Median & mode ================= */
E3.skill({ id: 'III.9.03', name: 'Median & mode', steps: {
  a: { t: 'order and find the middle', g: R => {
    const n = R.pick([5, 7, 9]), v = tries(() => Array.from({ length: n }, () => R.int(1, 60)), a => a[(n - 1) / 2] !== median(a));
    const s = srt(v), md = median(v);
    return num(`Find the median: ${L(v)}`, md, `In order: ${L(s)}. The middle (value ${(n + 1) / 2} of ${n}) is ${md}.`);
  } },
  b: { t: 'even-count median', g: R => {
    const n = R.pick([6, 8, 10]), v = tries(() => Array.from({ length: n }, () => R.int(1, 50)), a => { const s = srt(a); return s[n / 2 - 1] !== s[n / 2]; });
    const s = srt(v), a = s[n / 2 - 1], b = s[n / 2], md = (a + b) / 2;
    return num(`Find the median: ${L(v)}`, md, `In order: ${L(s)}. With an even count, average the two middle values: (${a} + ${b}) ÷ 2 = ${F(md)}.`);
  } },
  c: { t: 'mode and no-mode', g: R => {
    const kind = R.pick(['one', 'one', 'two', 'none']), n = R.int(6, 8);
    const v = tries(() => {
      const base = R.distinct(1, 20, n);
      if (kind === 'one') { base[1] = base[0]; if (R.bool(0.4)) base[2] = base[0]; }
      if (kind === 'two') { base[1] = base[0]; base[3] = base[2]; }
      return R.shuffle(base);
    }, a => modes(a).length === { one: 1, two: 2, none: 0 }[kind] && !modes(a).includes(median(a)));
    const md = modes(v), mdn = median(v), s = srt(v);
    const ans = kind === 'none' ? 'No mode' : kind === 'one' ? String(md[0]) : `${md[0]} and ${md[1]}`;
    const ds = kind === 'none' ? [F(mdn), String(s[s.length - 1]), String(v[0])] : kind === 'one' ? ['No mode', F(mdn), String(s[s.length - 1])] : [String(md[0]), String(md[1]), 'No mode'];
    return choice(R, `What is the mode of ${L(v)}?`, ans, ds,
      kind === 'none' ? 'Every value appears once, so there is no mode.' : kind === 'one' ? `${md[0]} appears ${counts(v).get(md[0])} times, more than any other value.` : `${md[0]} and ${md[1]} both appear twice, more than any other value, so there are two modes.`);
  } },
  d: { t: 'choose mean vs median', g: R => {
    const n = R.int(5, 7), ctx = R.pick([['Hourly pay', 'workers', 12, 20, 60, 90], ['Home prices (thousands)', 'homes', 200, 300, 900, 1500], ['Minutes to finish a puzzle', 'students', 8, 15, 45, 70], ['Points scored', 'players', 4, 12, 40, 55]]);
    const v = R.shuffle(Array.from({ length: n }, () => R.int(ctx[2], ctx[3])).concat([R.int(ctx[4], ctx[5])]));
    const mu = mean(v), md = median(v), muS = dp(mu, 1) ? F(mu) : '≈ ' + F(Math.round(mu * 10) / 10);
    if (R.bool()) return choice(R, `${ctx[0]} for ${n + 1} ${ctx[1]}: ${L(v)}. Which better describes a typical value?`, `Median (${F(md)})`, [`Mean (${muS})`],
      `The one large value pulls the mean up to ${muS}, above most of the data. The median, ${F(md)}, sits in the middle, so it describes a typical value better.`);
    return choice(R, `${ctx[0]} for ${n + 1} ${ctx[1]}: ${L(v)}. If the largest value is removed, which changes more?`, 'The mean', ['The median', 'Neither changes'],
      `The mean uses every value, so dropping ${Math.max(...v)} moves it a lot. The median only moves to a neighbouring middle value.`);
  } },
} });

/* ================= III.9.04 Range ================= */
E3.skill({ id: 'III.9.04', name: 'Range', steps: {
  a: { t: 'max − min', g: R => {
    const temps = R.bool(0.4), n = R.int(6, 8);
    const v = temps ? Array.from({ length: n }, () => R.int(-12, 15)) : Array.from({ length: n }, () => R.int(10, 99));
    const mx = Math.max(...v), mn = Math.min(...v);
    return num(`${temps ? 'Morning temperatures (°): ' : 'Find the range: '}${L(v)}${temps ? '. Find the range.' : ''}`, mx - mn,
      `Range = max − min = ${F(mx)} − ${mn < 0 ? '(' + F(mn) + ')' : mn} = ${mx - mn}. It is a difference, not the largest value.`);
  } },
  b: { t: 'range from a plot', g: R => {
    const lo = R.int(0, 10), w = R.int(9, 14), n = R.int(9, 15);
    const v = tries(() => Array.from({ length: n }, () => lo + R.int(0, w)), a => Math.max(...a) - Math.min(...a) >= 5);
    const mx = Math.max(...v), mn = Math.min(...v);
    return num('The dot plot shows how many books each student read. What is the range?', mx - mn, `Highest dot ${mx}, lowest dot ${mn}: range ${mx} − ${mn} = ${mx - mn}.`, { visual: V9.dot(v, lo, lo + w) });
  } },
  c: { t: 'what range misses', g: R => {
    if (R.bool(0.45)) {
      const n = R.int(6, 8), v = srt(Array.from({ length: n }, () => R.int(20, 40))), mx = Math.max(...v), mn = Math.min(...v), nw = mx + R.int(30, 70);
      const w = v.slice(); w[w.length - 1] = nw;
      return num(`Data: ${L(v)}. The largest value, ${mx}, is replaced by ${nw}. What is the new range?`, nw - mn,
        `New range ${nw} − ${mn} = ${nw - mn}, up from ${mx - mn}. One extreme value changes the range a lot, though the other values stay put.`);
    }
    const lo = R.int(5, 20), rg = R.pick([30, 40, 50]), hi = lo + rg, mid = lo + rg / 2;
    const tight = srt([lo, hi, mid - 2, mid - 1, mid, mid + 1, mid + 2]), even = srt([lo, hi, lo + rg / 6, lo + rg / 3, mid, hi - rg / 3, hi - rg / 6].map(Math.round));
    const aTight = R.bool(), A = aTight ? tight : even, B = aTight ? even : tight;
    return choice(R, `Set A: ${L(A)}<br>Set B: ${L(B)}<br>Both have range ${rg}. In which set are most values bunched closer together?`, aTight ? 'Set A' : 'Set B', [aTight ? 'Set B' : 'Set A', "Can't tell: the ranges are equal"],
      `The ranges match because only the min and max count. In ${aTight ? 'A' : 'B'}, five values sit within 2 of ${mid}: the range misses that.`);
  } },
  d: { t: 'compare ranges', g: R => {
    const [a, b] = R.sample(NAMES, 2);
    const d = tries(() => [Array.from({ length: 6 }, () => R.int(40, 100)), Array.from({ length: 6 }, () => R.int(40, 100))], ([A, B]) => {
      const rA = Math.max(...A) - Math.min(...A), rB = Math.max(...B) - Math.min(...B), dm = Math.abs(Math.max(...A) - Math.max(...B));
      return rA !== rB && Math.abs(rA - rB) !== dm && dm !== 0; });
    const [A, B] = d, rA = Math.max(...A) - Math.min(...A), rB = Math.max(...B) - Math.min(...B), big = rA > rB ? a : b, sm = rA > rB ? b : a, df = Math.abs(rA - rB);
    return choice(R, `Quiz scores. ${a}: ${L(A)}. ${b}: ${L(B)}. Whose scores have the greater range, and by how much?`, `${big}, by ${df}`, [`${sm}, by ${df}`, `${big}, by ${Math.abs(Math.max(...A) - Math.max(...B))}`, `${sm}, by ${Math.abs(Math.max(...A) - Math.max(...B))}`],
      `${a}: ${Math.max(...A)} − ${Math.min(...A)} = ${rA}. ${b}: ${Math.max(...B)} − ${Math.min(...B)} = ${rB}. ${big}'s scores spread ${df} more.`);
  } },
} });

/* ================= III.9.05 Quartiles & IQR ================= */
const QN = n => n % 2 ? ' Leave the median out of both halves.' : '';
const QM = n => n % 2 ? `With ${n} values, leave out the median and take the median of each half of ${(n - 1) / 2}.` : `With ${n} values, split into two halves of ${n / 2}.`;
const qData = (R, n, lo = 1, hi = 40) => tries(() => Array.from({ length: n }, () => R.int(lo, hi)), a => new Set(a).size >= n - 1);
E3.skill({ id: 'III.9.05', name: 'Quartiles & IQR', steps: {
  a: { t: 'lower and upper halves', g: R => {
    const n = R.int(7, 10), v = qData(R, n), s = srt(v), [lo, hi] = halves(v), up = R.bool(), want = up ? hi : lo;
    const withMed = up ? s.slice(Math.floor(n / 2)) : s.slice(0, Math.ceil(n / 2));
    const extra = up ? s.slice(Math.floor(n / 2) - 1) : s.slice(0, Math.floor(n / 2) + 1);
    const raw = up ? v.slice(v.length - want.length) : v.slice(0, want.length);
    return choice(R, `Data: ${L(v)}. Which values make up the <b>${up ? 'upper' : 'lower'}</b> half?${QN(n)}`, L(want), [L(n % 2 ? withMed : extra), L(raw), L(up ? lo : hi)],
      `In order: ${L(s)}. ${QM(n)} The ${up ? 'upper' : 'lower'} half is ${L(want)}.`);
  } },
  b: { t: 'Q1 and Q3', g: R => {
    const n = R.int(7, 12), v = qData(R, n), s = srt(v), [lo, hi] = halves(v), [q1, q3] = quart(v);
    return num(`Find Q1 and Q3: ${L(v)}.${QN(n)}`, [{ label: 'Q1', ans: q1 }, { label: 'Q3', ans: q3 }],
      `In order: ${L(s)}. ${QM(n)} Q1 = median of ${L(lo)} = ${F(q1)}; Q3 = median of ${L(hi)} = ${F(q3)}.`);
  } },
  c: { t: 'IQR = Q3 − Q1', g: R => {
    const n = R.int(8, 12), v = qData(R, n, 10, 70), s = srt(v), [q1, q3] = quart(v);
    return num(`Find the interquartile range (IQR): ${L(v)}.${QN(n)}`, q3 - q1,
      `In order: ${L(s)}. ${QM(n)} Q1 = ${F(q1)}, Q3 = ${F(q3)}, so IQR = ${F(q3)} − ${F(q1)} = ${F(q3 - q1)}. Not the range, ${s[n - 1] - s[0]}.`);
  } },
  d: { t: '1.5 × IQR outlier rule', g: R => {
    const n = R.int(8, 11);
    const v = tries(() => { const a = Array.from({ length: n - 1 }, () => R.int(10, 30)); a.push(R.bool(0.7) ? R.int(40, 75) : R.int(25, 34)); return R.shuffle(a); },
      a => { const [q1, q3] = quart(a), I = q3 - q1; return I > 0 && dp(1.5 * I, 2) && Math.abs(Math.max(...a) - (q3 + 1.5 * I)) > 0.4; });
    const s = srt(v), [q1, q3] = quart(v), I = q3 - q1, lf = q1 - 1.5 * I, uf = q3 + 1.5 * I, outs = v.filter(x => x < lf || x > uf);
    return num(`Data: ${L(v)}. Use the 1.5 × IQR rule. Find the fences and count the outliers.${QN(n)}`, [{ label: 'lower fence', ans: lf }, { label: 'upper fence', ans: uf }, { label: 'outliers', ans: outs.length }],
      `Q1 = ${F(q1)}, Q3 = ${F(q3)} (median of each half${n % 2 ? ', median left out' : ''}), IQR = ${F(I)}, 1.5 × IQR = ${F(1.5 * I)}. Fences ${F(lf)} and ${F(uf)}: ${outs.length ? L(outs) + ' lie' + (outs.length > 1 ? '' : 's') + ' outside' : 'nothing lies outside'}.`);
  } },
} });

/* ================= III.9.06 Box plots ================= */
const f5 = f => f.map(F).join(', ');
// data whose five-number summary sits on whole numbers that are multiples of `st`
const boxData = (R, st, lo, hi) => {
  const f = tries(() => srt(Array.from({ length: 5 }, () => R.int(lo / st, hi / st) * st)), a => new Set(a).size === 5 && a[4] - a[0] >= 6 * st);
  return f;
};
const scaleFor = f => { const span = f[4] - f[0], st = span <= 14 ? 1 : span <= 30 ? 2 : span <= 70 ? 5 : 10; return { st, lo: Math.floor(f[0] / st) * st - st, hi: Math.ceil(f[4] / st) * st + st }; };
E3.skill({ id: 'III.9.06', name: 'Box plots', steps: {
  a: { t: 'five-number summary', g: R => {
    const n = R.pick([7, 9, 11, 8, 10]), v = tries(() => qData(R, n, 1, 50), a => { const f = five(a); return new Set(f).size === 5 && Math.abs(mean(a) - f[2]) > 0.6; });
    const s = srt(v), f = five(v);
    const incl = n % 2 ? [s[0], median(s.slice(0, (n + 1) / 2)), f[2], median(s.slice((n - 1) / 2)), s[n - 1]] : [s[0], s[Math.floor(n / 4)], f[2], s[n - 1 - Math.floor(n / 4)], s[n - 1]];
    const mu = Math.round(mean(v)), ds = [f5(incl), f5([f[0], f[1], mu, f[3], f[4]]), f5([f[0], f[1], f[2], f[3], f[4] - f[0]]), f5([v[0], f[1], f[2], f[3], v[n - 1]])];
    return choice(R, `Data: ${L(v)}. Which is the five-number summary (min, Q1, median, Q3, max)?${QN(n)}`, f5(f), ds.filter(d => d !== f5(f)).slice(0, 3),
      `In order: ${L(s)}. Min ${f[0]}, median ${F(f[2])}, max ${f[4]}. ${QM(n)} Q1 = ${F(f[1])}, Q3 = ${F(f[3])}.`);
  } },
  b: { t: 'draw a box plot', g: R => {
    const st = R.pick([1, 2]), f = boxData(R, st, st, 11 * st), { lo, hi } = { lo: 0, hi: 12 * st };
    const mir = f[1] + f[3] - f[2], m2 = mir !== f[2] && mir > f[1] && mir < f[3] ? mir : f[2] + st < f[3] ? f[2] + st : f[2] - st;
    const wrong = [[f[0], f[0], f[1], f[2], f[4]], [f[0], f[1], f[3], f[4], f[4]], [f[0], f[1], m2, f[3], f[4]]];
    const opts = [f].concat(wrong).filter((g, i, A) => A.findIndex(h => f5(h) === f5(g)) === i).slice(0, 4);
    const pics = opts.map(g => V9.box([{ f: g }], lo, hi, st, { w: 300, bh: 24, every: st }));
    return choice(R, `Which box plot shows min ${f[0]}, Q1 ${f[1]}, median ${f[2]}, Q3 ${f[3]}, max ${f[4]}?`, pics[0], pics.slice(1),
      `The box runs from Q1 = ${f[1]} to Q3 = ${f[3]} with a line at the median, ${f[2]}. Whiskers reach out to ${f[0]} and ${f[4]}.`);
  } },
  c: { t: 'read a box plot', g: R => {
    const st = R.pick([1, 2, 5, 10]), f = boxData(R, st, st, 11 * st), what = R.pick(['median', 'IQR', 'range', 'above', 'between']), N = R.pick([20, 40, 60, 80, 100]);
    const vis = V9.box([{ f }], 0, 12 * st, st, { every: st });
    const Q = { median: [`What is the median?`, f[2], `The line inside the box is at ${f[2]}.`],
      IQR: [`What is the interquartile range?`, f[3] - f[1], `The box runs from ${f[1]} to ${f[3]}: IQR = ${f[3] - f[1]}.`],
      range: [`What is the range?`, f[4] - f[0], `Whiskers end at ${f[0]} and ${f[4]}: range = ${f[4] - f[0]}.`],
      above: [`The plot shows ${N} test scores. About how many scores are above ${f[3]}?`, N / 4, `${f[3]} is Q3, and about a quarter of the data lies above it: ${N} ÷ 4 = ${N / 4}.`],
      between: [`The plot shows ${N} test scores. About how many are between ${f[1]} and ${f[3]}?`, N / 2, `The box holds the middle half: ${N} ÷ 2 = ${N / 2}. Its width shows spread, not count.`] }[what];
    return num(Q[0], Q[1], Q[2], { visual: vis });
  } },
  d: { t: 'compare two box plots', g: R => {
    const st = R.pick([1, 2, 5]);
    const [A, B] = tries(() => [boxData(R, st, st, 11 * st), boxData(R, st, st, 11 * st)], ([A, B]) => A[2] !== B[2] && (A[3] - A[1]) !== (B[3] - B[1]) && (A[4] - A[0]) !== (B[4] - B[0]));
    const mA = A[2] > B[2] ? 'A' : 'B', iA = A[3] - A[1] > B[3] - B[1] ? 'A' : 'B', rA = A[4] - A[0] > B[4] - B[0] ? 'A' : 'B', o = x => x === 'A' ? 'B' : 'A';
    const lw = A[1] - A[0] > A[4] - A[3] ? 'left' : 'right';
    const T = [[`${mA} has the greater median.`, `Medians: A ${A[2]}, B ${B[2]}.`], [`${iA} has the greater IQR.`, `IQRs: A ${A[3] - A[1]}, B ${B[3] - B[1]}.`], [`${rA} has the greater range.`, `Ranges: A ${A[4] - A[0]}, B ${B[4] - B[0]}.`]];
    const Fs = [`${o(mA)} has the greater median.`, `${o(iA)} has the greater IQR.`, `${o(rA)} has the greater range.`, `A's longer ${lw} whisker holds more data than its other whisker.`];
    const t = R.int(0, 2), fs = R.sample(Fs.filter((_, i) => i !== t), 3);
    return choice(R, 'Which statement is true?', T[t][0], fs, `${T[t][1]} Each whisker holds about a quarter of the data, whatever its length.`,
      { visual: V9.box([{ f: A, label: 'A', color: C.teal }, { f: B, label: 'B', color: C.amber }], 0, 12 * st, st, { every: st }) });
  } },
} });

/* ================= III.9.07 Dot plots ================= */
const dotData = (R, n, lo, w) => tries(() => Array.from({ length: n }, () => lo + R.int(0, w)), a => new Set(a).size >= 4);
E3.skill({ id: 'III.9.07', name: 'Dot plots', steps: {
  a: { t: 'make a dot plot', g: R => {
    const lo = R.int(0, 5), w = 6, n = R.int(8, 11), v = dotData(R, n, lo + 1, w - 2), c = counts(v), ks = [...c.keys()];
    const k1 = R.pick(ks), mv = v.slice(); mv[v.indexOf(k1)] = k1 + (k1 < lo + w - 1 ? 1 : -1);
    const drop = v.slice(); drop.splice(v.indexOf(R.pick(ks)), 1);
    const k2 = R.pick(ks), add = v.concat([k2 === lo + 1 ? lo + 2 : k2]);
    const pic = d => V9.dot(d, lo, lo + w);
    return choice(R, `Which dot plot shows ${L(v)}?`, pic(v), [pic(mv), pic(drop), pic(add)],
      `Put one dot above the number line for each value: ${[...c.entries()].sort((a, b) => a[0] - b[0]).map(([k, x]) => `${x} at ${k}`).join(', ')}.`);
  } },
  b: { t: 'read center and spread', g: R => {
    const lo = R.int(0, 10), w = R.int(8, 12), n = R.pick([9, 11, 13, 15, 10, 12]), v = dotData(R, n, lo, w), s = srt(v);
    const md = median(v);
    return num('The dot plot shows goals scored in each game. Find the median and the range.', [{ label: 'median', ans: md }, { label: 'range', ans: s[n - 1] - s[0] }],
      `There are ${n} dots; counting from the left, the median is ${n % 2 ? `dot ${(n + 1) / 2}, at ${md}` : `halfway between dots ${n / 2} and ${n / 2 + 1}: ${F(md)}`}. Range ${s[n - 1]} − ${s[0]} = ${s[n - 1] - s[0]}.`,
      { visual: V9.dot(v, lo, lo + w) });
  } },
  c: { t: 'shape: cluster, gap, peak', g: R => {
    const lo = 0, a = R.int(1, 4), pk = a + R.int(1, 2), right = R.bool();
    const cl = [a, a + 1, a + 2, a + 3]; let v = [];
    cl.forEach(x => { const k = x === pk ? R.int(4, 5) : R.int(1, 3); for (let i = 0; i < k; i++) v.push(x); });
    const out = a + 3 + R.int(4, 6); v.push(out);
    let hi = out + R.int(1, 2);
    if (!right) { v = v.map(x => hi - x); }
    const peak = right ? pk : hi - pk, o = right ? out : hi - out, cA = right ? a : hi - a - 3, cB = cA + 3;
    const g1 = right ? a + 4 : o + 1, g2 = right ? o - 1 : cA - 1;
    return num('Look at the shape of the dot plot. Where is the peak, and which value is the outlier?', [{ label: 'peak at', ans: peak }, { label: 'outlier', ans: o }],
      `The tallest stack (the peak, the mode) is at ${peak}. Most dots cluster from ${cA} to ${cB}; after a gap from ${g1} to ${g2}, a lone dot sits at ${o}.`,
      { visual: V9.dot(v, lo, hi) });
  } },
  d: { t: 'answer questions from one', g: R => {
    const ctx = R.pick([['pets per student', 'students'], ['hours of practice per week', 'players'], ['goals per game', 'games'], ['siblings per student', 'students']]);
    const lo = 0, w = R.int(6, 8), n = R.int(12, 18), k = R.int(lo + 2, lo + w - 2), v = tries(() => dotData(R, n, lo, w), a => a.some(x => x > k) && a.some(x => x < k));
    const q = R.pick(['atleast', 'fewer', 'frac', 'mode']);
    const vis = V9.dot(v, lo, lo + w, { title: ctx[0] });
    if (q === 'atleast') { const c = v.filter(x => x >= k).length; return num(`How many ${ctx[1]} had ${k} or more?`, c, `Count the dots at ${k} and above: ${c}.`, { visual: vis }); }
    if (q === 'fewer') { const c = v.filter(x => x < k).length; return num(`How many ${ctx[1]} had fewer than ${k}?`, c, `Count the dots below ${k}: ${c}.`, { visual: vis }); }
    if (q === 'frac') { const c = v.filter(x => x > k).length; return num(`What fraction of the ${ctx[1]} had more than ${k}? Write it in simplest form.`, [frac(c, n, 'simplest')], `${c} of the ${n} dots are above ${k}: ${frRaw(c, n)}${E3.gcd(c, n) > 1 ? ' = ' + fr(c, n) : ''}.`, { visual: vis }); }
    const mo = tries(() => dotData(R, n, lo, w), a => modes(a).length === 1 && modes(a)[0] !== median(a));
    return num(`What is the mode?`, modes(mo)[0], `The tallest stack is at ${modes(mo)[0]}. (The median is ${F(median(mo))}: the mode is the peak, not the middle.)`, { visual: V9.dot(mo, lo, lo + w, { title: ctx[0] }) });
  } },
} });

/* ================= III.9.08 Histograms ================= */
const binLab = (a, w) => `${a}–${a + w - 1}`;
E3.skill({ id: 'III.9.08', name: 'Histograms', steps: {
  a: { t: 'choose bins', g: R => {
    const w = R.pick([5, 10, 10, 20]), k = R.int(4, 5), s0 = R.int(0, 3) * w, mn = s0 + R.int(0, w - 1), mx = s0 + (k - 1) * w + R.int(0, w - 1);
    const good = Array.from({ length: k }, (_, i) => binLab(s0 + i * w, w)).join(', ');
    const unequal = [binLab(s0, w), binLab(s0 + w, 2 * w)].concat(Array.from({ length: k - 3 }, (_, i) => binLab(s0 + (3 + i) * w, w))).join(', ');
    const short = Array.from({ length: k - 1 }, (_, i) => binLab(s0 + i * w, w)).join(', ');
    const late = Array.from({ length: k }, (_, i) => binLab(s0 + w + i * w, w)).join(', ');
    return choice(R, `Data run from ${mn} to ${mx}. Which bins work for a histogram?`, good, [unequal, short, late],
      `Bins must be the same width (${w}) and cover every value from ${mn} to ${mx} with no gaps or overlaps.`);
  } },
  b: { t: 'draw a histogram', g: R => {
    const w = 10, s0 = R.int(1, 5) * 10, n = R.int(12, 16), v = tries(() => Array.from({ length: n }, () => s0 + R.int(0, 39)), a => [0, 1, 2, 3].every(i => a.some(x => Math.floor((x - s0) / w) === i)));
    const c = [0, 1, 2, 3].map(i => v.filter(x => Math.floor((x - s0) / w) === i).length);
    return num(`Data: ${L(v)}. For a histogram with bins of width ${w}, how tall is each bar?`, c.map((k, i) => ({ label: binLab(s0 + i * w, w), ans: k })),
      `Count the values in each bin: ${c.map((k, i) => `${binLab(s0 + i * w, w)}: ${k}`).join(', ')}. Check: ${c.join(' + ')} = ${n}.`);
  } },
  c: { t: 'read frequencies', g: R => {
    const w = R.pick([5, 10]), k = R.int(5, 6), s0 = R.int(0, 4) * w, c = tries(() => Array.from({ length: k }, () => R.int(0, 9)), a => a.filter(x => x).length >= k - 1 && a[0] > 0 && a[k - 1] > 0);
    const edges = Array.from({ length: k + 1 }, (_, i) => s0 + i * w), q = R.pick(['atleast', 'below', 'total', 'bin']), j = R.int(1, k - 1);
    const ctx = R.pick(['Minutes spent on homework', 'Ages of people at a pool', 'Heights of plants (cm)', 'Scores on a game']);
    const vis = V9.hist(edges, c, { title: ctx });
    if (q === 'atleast') { const t = sum(c.slice(j)); return num(`How many values are ${edges[j]} or more?`, t, `Add the bars from ${edges[j]} up: ${c.slice(j).length > 1 ? c.slice(j).join(' + ') + ' = ' : ''}${t}.`, { visual: vis }); }
    if (q === 'below') { const t = sum(c.slice(0, j)); return num(`How many values are less than ${edges[j]}?`, t, `Add the bars below ${edges[j]}: ${j > 1 ? c.slice(0, j).join(' + ') + ' = ' : ''}${t}.`, { visual: vis }); }
    if (q === 'total') return num('How many values does the histogram show in all?', sum(c), `Add all the bar heights: ${c.join(' + ')} = ${sum(c)}.`, { visual: vis });
    return num(`How many values are from ${edges[j]} up to (not including) ${edges[j + 1]}?`, c[j], `Read the height of the bar from ${edges[j]} to ${edges[j + 1]}: ${c[j]}.`, { visual: vis });
  } },
  d: { t: 'describe skew and symmetry', g: R => {
    const k = R.pick(['Symmetric', 'Skewed right', 'Skewed left', 'Two peaks']);
    const base = { Symmetric: R.pick([[1, 3, 6, 9, 6, 3, 1], [2, 4, 7, 7, 4, 2], [1, 4, 8, 4, 1]]), 'Skewed right': R.pick([[3, 9, 7, 4, 2, 1, 1], [8, 6, 4, 3, 2, 1], [4, 9, 5, 3, 2, 1]]), 'Two peaks': R.pick([[2, 7, 3, 1, 3, 7, 2], [6, 3, 1, 2, 6, 2], [1, 6, 2, 2, 7, 3]]) }[k === 'Skewed left' ? 'Skewed right' : k];
    let c = base.map(x => x + (x > 2 ? R.int(-1, 1) : 0)); if (k === 'Skewed left') c = c.reverse();
    if (k === 'Symmetric') { const n = c.length; for (let i = 0; i < n / 2; i++) c[n - 1 - i] = c[i]; }
    const w = R.pick([5, 10]), s0 = R.int(0, 3) * w, edges = Array.from({ length: c.length + 1 }, (_, i) => s0 + i * w);
    const ex = { Symmetric: 'The bars rise to a middle peak and fall the same way on both sides.', 'Skewed right': 'Most values are on the left, with a long tail stretching to the right.', 'Skewed left': 'Most values are on the right, with a long tail stretching to the left.', 'Two peaks': 'There are two separate high points with lower bars between them.' }[k];
    return choiceFixed('Which best describes the shape of this histogram?', ['Symmetric', 'Skewed right', 'Skewed left', 'Two peaks'], ['Symmetric', 'Skewed right', 'Skewed left', 'Two peaks'].indexOf(k), ex, { visual: V9.hist(edges, c) });
  } },
} });

/* ================= III.9.09 Mean absolute deviation ================= */
const madData = (R, n, lo, hi) => tries(() => Array.from({ length: n }, () => R.int(lo, hi)), a => sum(a) % n === 0 && new Set(a).size > 2 && dp(mad(a), 2));
E3.skill({ id: 'III.9.09', name: 'Mean absolute deviation', steps: {
  a: { t: 'distances from the mean', g: R => {
    const v = madData(R, 4, 2, 30), mu = mean(v);
    return num(`The mean of ${L(v)} is ${mu}. Find each value's distance from the mean.`, v.map(x => ({ label: `|${x} − ${mu}| =`, ans: Math.abs(x - mu) })),
      `Distances are always positive: ${v.map(x => Math.abs(x - mu)).join(', ')}. For example ${Math.min(...v)} is ${mu - Math.min(...v)} below ${mu}, a distance of ${mu - Math.min(...v)}, not −${mu - Math.min(...v)}.`);
  } },
  b: { t: 'average those distances', g: R => {
    const n = R.pick([4, 5, 5, 6]), v = madData(R, n, 1, 30), mu = mean(v), ds = v.map(x => Math.abs(x - mu));
    return num(`Find the mean absolute deviation (MAD): ${L(v)}`, mad(v),
      `Mean = ${sum(v)} ÷ ${n} = ${mu}. Distances: ${ds.join(', ')}, total ${sum(ds)}. MAD = ${sum(ds)} ÷ ${n} = ${F(mad(v))}.`);
  } },
  c: { t: 'interpret MAD', g: R => {
    const q = R.pick(['spread', 'consistent', 'meaning', 'zero']);
    const [a, b] = R.sample(NAMES, 2), mu = R.int(60, 85), s1 = R.int(2, 5), s2 = s1 + R.int(3, 8);
    if (q === 'spread' || q === 'consistent') {
      const prompt = `${a}'s scores: mean ${mu}, MAD ${s1}. ${b}'s scores: mean ${mu}, MAD ${s2}. Which is true?`;
      const T = q === 'spread' ? `${b}'s scores are more spread out.` : `${a}'s scores are more consistent.`;
      return choice(R, prompt, T, [q === 'spread' ? `${a}'s scores are more spread out.` : `${b}'s scores are more consistent.`, `${b} usually scores higher.`, `${b}'s scores are ${s2} points higher than ${a}'s.`],
        `The means are equal. A bigger MAD (${s2}) means values sit farther from the mean on average, so ${b}'s scores vary more and ${a}'s are more consistent.`);
    }
    if (q === 'meaning') return choice(R, `A set of test scores has mean ${mu} and MAD ${s1}. What does the MAD tell you?`, `On average, a score is ${s1} points away from ${mu}.`, [`Every score is exactly ${s1} points from ${mu}.`, `The scores go up by ${s1} each time.`, `The highest score is ${mu + s1}.`],
      `MAD is the average distance from the mean: some scores are closer, some farther, averaging ${s1}.`);
    return choice(R, `A data set has MAD 0. What must be true?`, 'All the values are equal.', ['The mean is 0.', 'The values add up to 0.', 'There are no values.'], 'Every distance from the mean is 0, so every value equals the mean.');
  } },
  d: { t: 'compare spreads', g: R => {
    const [A, B] = tries(() => [madData(R, 5, 5, 30), madData(R, 5, 5, 30)], ([A, B]) => mad(A) !== mad(B));
    const more = mad(A) > mad(B) ? 'A' : 'B';
    return num(`Set A: ${L(A)}<br>Set B: ${L(B)}<br>Find the MAD of each set to compare their spreads.`, [{ label: 'MAD of A', ans: mad(A) }, { label: 'MAD of B', ans: mad(B) }],
      `A: mean ${mean(A)}, MAD ${F(mad(A))}. B: mean ${mean(B)}, MAD ${F(mad(B))}. The larger MAD, set ${more}, is more spread out.`);
  } },
} });

/* ================= III.9.10 Sampling ================= */
const SAMP = [
  { sz: [[10, 15], [60, 80], [300, 350]], vol: 'students who chose to answer an online poll', yes: 'want pizza for lunch', who: 'The principal', grp: 'students at the school', N: [400, 1200], topic: 'what students want for lunch', random: 'Draw names at random from a list of all students', biased: ['Ask the first students in the lunch line', 'Ask students who stay after school for cooking club', 'Ask only students in one grade 7 class'] },
  { sz: [[10, 20], [150, 200, 300], [2000, 3000]], vol: 'adults who chose to answer an online poll', yes: 'want the new park', who: 'A town council', grp: 'adults in the town', N: [5000, 20000], topic: 'whether to build a new park', random: 'Pick adults at random from the full town voter list', biased: ['Ask people walking their dogs in the old park', 'Put an online poll on the council page for anyone who wants to answer', 'Ask only the adults on one street'] },
  { sz: [[10, 15], [40, 50], [150, 180]], vol: 'members who chose to reply to an open email', yes: 'pick Saturday', who: 'A coach', grp: 'members of the sports club', N: [200, 600], topic: 'the best training day', random: 'Number all members and pick numbers with a random generator', biased: ['Ask the players at Saturday training', "Ask the coach's own team", 'Ask members who reply first to an email'] },
  { sz: [[10, 15], [50, 60], [250, 280]], vol: 'students who chose to fill in a form in the library', yes: 'read more than 3 books a month', who: 'A librarian', grp: 'students at the school', N: [300, 900], topic: 'how many books students read each month', random: 'Pick student ID numbers at random from the school list', biased: ['Ask students who are in the library at lunch', 'Ask the members of the reading club', 'Ask students who volunteer to answer'] },
  { sz: [[10, 15], [150, 200], [1500, 2000]], vol: 'phones returned by unhappy customers', yes: 'have batteries that last over 2 days', who: 'A factory manager', grp: 'phones made this week', N: [2000, 8000], topic: 'how long the batteries last', random: "Test phones picked at random from the whole week's output", biased: ['Test only the first phones made on Monday', 'Test only phones returned by unhappy customers', 'Test phones from the top of one box'] },
  { sz: [[10, 20], [150, 200, 300], [2000, 3000]], vol: 'riders who chose to fill in a feedback card', yes: 'are happy with the service', who: 'A bus company', grp: 'people who ride the buses', N: [3000, 9000], topic: 'how happy riders are with the service', random: 'Choose riders at random from all tickets sold this month', biased: ['Ask riders who filed a complaint', 'Ask riders on the 7 a.m. bus only', 'Ask riders who choose to fill in a card'] },
];
const rN = (R, [a, b]) => R.int(a / 100, b / 100) * 100;
E3.skill({ id: 'III.9.10', name: 'Sampling', steps: {
  a: { t: 'population vs sample', g: R => {
    const s = R.pick(SAMP), N = rN(R, s.N), k = R.pick([20, 25, 40, 50, 60, 80]), askPop = R.bool();
    const pop = `All ${fmt(N)} ${s.grp}`, smp = `The ${k} ${s.grp} in the survey`;
    return choice(R, `${s.who} wants to know ${s.topic}. There are ${fmt(N)} ${s.grp}; ${k} of them are surveyed. What is the <b>${askPop ? 'population' : 'sample'}</b>?`, askPop ? pop : smp, [askPop ? smp : pop, cap(s.topic), s.who],
      `The population is the whole group the question is about (${fmt(N)} ${s.grp}); the sample is the part actually surveyed (${k}).`);
  } },
  b: { t: 'random samples', g: R => {
    const s = R.pick(SAMP), k = R.pick([30, 40, 50, 100]);
    return choice(R, `${s.who} wants to know ${s.topic}. Which method gives a random sample of ${k} ${s.grp}?`, `${s.random} (${k} in all)`, s.biased.map(b => `${b} (${k} in all)`),
      `In a random sample every member has the same chance of being chosen. The other methods favour some ${s.grp} over others.`);
  } },
  c: { t: 'spot biased samples', g: R => {
    const [s, t, u] = R.sample(SAMP, 3), b = R.pick(s.biased);
    return choice(R, 'Which sample is <b>biased</b>?', `To learn ${s.topic}: ${b.charAt(0).toLowerCase() + b.slice(1)}.`,
      [t, u].map(x => `To learn ${x.topic}: ${x.random.charAt(0).toLowerCase() + x.random.slice(1)}.`),
      `"${b}" picks some ${s.grp} more than others, so their answers may not match the whole population.`);
  } },
  d: { t: 'sample size effects', g: R => {
    const s = R.pick(SAMP), sm = R.pick(s.sz[0]), bg = R.pick(s.sz[1]), vol = R.pick(s.sz[2]);
    if (R.bool(0.6)) return choice(R, `${s.who} wants to know ${s.topic}. Which sample should give the most trustworthy estimate?`, `A random sample of ${bg} ${s.grp}`, [`A random sample of ${sm} ${s.grp}`, `${fmt(vol)} ${s.vol}`],
      `Bigger random samples vary less. A huge volunteer sample stays biased: size doesn't cure bias.`);
    let p1, p2, g = 0; do { p1 = R.int(20, 45); p2 = Math.round(R.int(1, sm - 1) / sm * 100); g++; }   // both percents must be whole-person counts of their samples
    while (g < 500 && (!Number.isInteger(p1 * bg / 100) || !Number.isInteger(p2 * sm / 100) || Math.abs(p2 - p1) < 8 || Math.abs(p2 - p1) > 25));
    return choice(R, `Two random samples of ${s.grp}: ${p2}% of ${sm} ${s.yes}, and ${p1}% of ${bg} ${s.yes}. Which estimate should you trust more?`, `${p1}%, from the sample of ${bg}`, [`${p2}%, from the sample of ${sm}`, `Their average, ${F((p1 + p2) / 2)}%`],
      `Small samples wander a lot from one to the next. The random sample of ${bg} is more likely to be close to the truth.`);
  } },
} });

/* ================= III.9.11 Inferences from samples ================= */
const INF = [['students', 'walk to school'], ['students', 'play an instrument'], ['households', 'own a dog'], ['shoppers', 'bring their own bag'], ['voters', 'support the new library'], ['students', 'prefer pizza for lunch']];
E3.skill({ id: 'III.9.11', name: 'Inferences from samples', steps: {
  a: { t: 'estimate a proportion', g: R => {
    const [g, act] = R.pick(INF), n = R.pick([20, 25, 40, 50, 60, 80]), k = tries(() => R.int(3, n - 3), k => k * 100 % n === 0);
    if (R.bool()) return num(`In a random sample of ${n} ${g}, ${k} ${act}. Estimate the percent of all ${g} who ${act}.`, k * 100 / n, `${k} ÷ ${n} = ${F(k / n)} = ${k * 100 / n}%. It is an estimate: another sample would differ a little.`);
    return num(`In a random sample of ${n} ${g}, ${k} ${act}. What fraction of the sample ${act}? Write it in simplest form.`, [frac(k, n, 'simplest')], `${frRaw(k, n)}${E3.gcd(k, n) > 1 ? ' = ' + fr(k, n) : ''}, so about ${fr(k, n)} of all ${g} ${act}.`);
  } },
  b: { t: 'scale up to the population', g: R => {
    const [g, act] = R.pick(INF), n = R.pick([20, 25, 40, 50, 60, 80, 100]);
    const { k, N } = tries(() => ({ k: R.int(3, n - 3), N: R.int(3, 40) * 100 }), ({ k, N }) => k * N % n === 0);
    return num(`A random sample of ${n} of the ${fmt(N)} ${g} found that ${k} ${act}. About how many of all ${fmt(N)} ${act}?`, k * N / n,
      `${frRaw(k, n)} × ${fmt(N)} = ${fmt(k * N / n)}. Equal ratios: ${k} out of ${n} is the same rate as ${fmt(k * N / n)} out of ${fmt(N)}.`);
  } },
  c: { t: 'compare several samples', g: R => {
    const [g, act] = R.pick(INF), n = 20, S = 4;
    const { c, N } = tries(() => { const p = R.int(4, 14); return { c: Array.from({ length: S }, () => Math.max(1, p + R.int(-3, 3))), N: R.int(2, 20) * 100 }; }, ({ c, N }) => sum(c) * N % (n * S) === 0);
    const est = sum(c) * N / (n * S);
    return num(`Four random samples of ${n} ${g} each: the table shows how many ${act}. Use all four together to estimate how many of ${fmt(N)} ${g} ${act}.`, est,
      `Together: ${c.join(' + ')} = ${sum(c)} out of ${n * S}. ${frRaw(sum(c), n * S)} × ${fmt(N)} = ${fmt(est)}.`,
      { visual: V9.table([['Sample', '1', '2', '3', '4'], ['Count', ...c.map(String)]], { first: 90 }) });
  } },
  d: { t: 'margin of variation informally', g: R => {
    const [g, act] = R.pick(INF), p = R.int(6, 12), c = tries(() => Array.from({ length: 5 }, () => p + R.int(-3, 3)), a => new Set(a).size >= 4);
    const pc = c.map(x => x * 5), lo = Math.min(...pc), hi = Math.max(...pc), mu = Math.round(mean(pc));
    return choice(R, `Five random samples of 20 ${g}: the table gives the percent who ${act}. Which is the best conclusion about all ${g}?`,
      `Between about ${lo}% and ${hi}%, likely near ${mu}%`, [`Exactly ${mu}%`, `Exactly ${pc[0]}%, the first sample`, `Between about ${Math.max(0, lo - 30)}% and ${lo - 5}%`],
      `The samples range from ${lo}% to ${hi}%, so one sample could be off by several points. Give a range, not an exact value.`,
      { visual: V9.table([['Sample', '1', '2', '3', '4', '5'], ['Percent', ...pc.map(x => x + '%')]], { first: 80, cell: 50 }) });
  } },
} });

/* ================= III.9.12 Compare populations ================= */
E3.skill({ id: 'III.9.12', name: 'Compare populations', steps: {
  a: { t: 'compare centers', g: R => {
    const [A, B] = tries(() => [Array.from({ length: 6 }, () => R.int(10, 40)), Array.from({ length: 6 }, () => R.int(10, 40))], ([A, B]) => sum(A) % 6 === 0 && sum(B) % 6 === 0 && mean(A) !== mean(B));
    const [a, b] = R.sample(['Class A', 'Class B'], 2), big = mean(A) > mean(B) ? 'A' : 'B', d = Math.abs(mean(A) - mean(B));
    const useMed = R.bool(0.4);
    if (useMed) { const [P, Q] = tries(() => [Array.from({ length: 7 }, () => R.int(10, 40)), Array.from({ length: 7 }, () => R.int(10, 40))], ([P, Q]) => median(P) !== median(Q)); const hi = median(P) > median(Q) ? 'A' : 'B';
      return num(`Push-ups. Group A: ${L(P)}. Group B: ${L(Q)}. How much greater is the higher median than the lower one?`, Math.abs(median(P) - median(Q)), `Medians: A ${median(P)}, B ${median(Q)}. Group ${hi}'s is higher by ${Math.abs(median(P) - median(Q))}.`); }
    return num(`Minutes of reading. Group A: ${L(A)}. Group B: ${L(B)}. How much greater is the higher mean than the lower one?`, d, `Means: A ${sum(A)} ÷ 6 = ${mean(A)}, B ${sum(B)} ÷ 6 = ${mean(B)}. Group ${big}'s is higher by ${d}.`);
  } },
  b: { t: 'compare spreads', g: R => {
    const st = R.pick([1, 2, 5]), [A, B] = tries(() => [boxData(R, st, st, 11 * st), boxData(R, st, st, 11 * st)], ([A, B]) => A[3] - A[1] !== B[3] - B[1]);
    return num('Find the IQR of each group to compare the spread of their middle halves.', [{ label: 'IQR of A', ans: A[3] - A[1] }, { label: 'IQR of B', ans: B[3] - B[1] }],
      `A: ${A[3]} − ${A[1]} = ${A[3] - A[1]}. B: ${B[3]} − ${B[1]} = ${B[3] - B[1]}. Group ${A[3] - A[1] > B[3] - B[1] ? 'A' : 'B'} has the wider box, so more spread.`,
      { visual: V9.box([{ f: A, label: 'A', color: C.teal }, { f: B, label: 'B', color: C.amber }], 0, 12 * st, st, { every: st }) });
  } },
  c: { t: 'difference in means as multiples of MAD', g: R => {
    const M = R.int(2, 6), k = R.pick([0.5, 1, 1.5, 2, 2.5, 3, 4]), d = k * M;
    if (!Number.isInteger(d)) return E3.byId['III.9.12'].steps.c.g(R);
    const m1 = R.int(40, 80), m2 = m1 + d, ctx = R.pick(['Plant heights (cm)', 'Jump distances (dm)', 'Quiz scores', 'Reaction times (hundredths of a second)']);
    return num(`${ctx}. Group A: mean ${m1}, MAD ${M}. Group B: mean ${m2}, MAD ${M}. The difference in means is how many MADs?`, k,
      `Difference ${m2} − ${m1} = ${d}. ${d} ÷ ${M} = ${F(k)} MAD${k === 1 ? '' : 's'}.${k >= 2 ? ' That is 2 or more, a clear difference.' : ' Less than 2: the groups overlap a lot.'}`);
  } },
  d: { t: 'write a conclusion', g: R => {
    const clear = R.bool(), k = clear ? R.pick([2.5, 3, 4]) : R.pick([0.5, 1]), M = R.pick([2, 4, 6]) - (k === 1 || k === 3 || k === 4 ? R.int(0, 1) : 0), d = k * M;
    const m1 = R.int(30, 70), hiA = R.bool(), mA = hiA ? m1 + d : m1, mB = hiA ? m1 : m1 + d, H = hiA ? 'A' : 'B', Lo = hiA ? 'B' : 'A';
    const ctx = R.pick([['Plants with fertilizer A and fertilizer B, height in cm', 'grew taller'], ['Students in class A and class B, quiz scores', 'scored higher'], ['Runners from club A and club B, laps completed', 'ran more laps']]);
    const r = F(d / M);
    const good = clear ? `Group ${H} clearly ${ctx[1]}: the means differ by ${r} MADs.` : `The groups overlap a lot: the means differ by only ${r} MAD${r === '1' ? '' : 's'}.`;
    const ds = clear ? [`The groups overlap a lot: the difference is small.`, `Group ${Lo} clearly ${ctx[1]}.`, `Every member of group ${H} beat every member of group ${Lo}.`]
      : [`Group ${H} clearly ${ctx[1]}, because its mean is higher.`, `Group ${Lo} clearly ${ctx[1]}.`, `Every member of group ${H} beat every member of group ${Lo}.`];
    return choice(R, `${ctx[0]}. Mean A ${mA}, mean B ${mB}; both MADs are ${M}. Which conclusion fits best?`, good, ds,
      `Difference ${d} ÷ MAD ${M} = ${r}. ${clear ? 'About 2 or more MADs means a clear difference.' : 'Under 2 MADs, the groups overlap a lot, so a higher mean alone proves little.'}`);
  } },
} });

/* ================= III.9.13 Probability basics ================= */
const COL = [['red', C.red], ['blue', C.blue], ['yellow', C.amber], ['green', C.teal], ['purple', C.violet]];
const bagMake = (R, k, lo = 1, hi = 6) => R.sample(COL, k).map(([nm, c]) => ({ nm, c, n: R.int(lo, hi) }));
const bagVis = b => V9.bag(b.map(x => [x.n, x.c]));
const bagTxt = b => b.map(x => `${x.n} ${x.nm}`).join(', ');
E3.skill({ id: 'III.9.13', name: 'Probability basics', steps: {
  a: { t: 'the 0 to 1 scale', g: R => {
    const valid = ['0', '1', '0.35', '0.9', fh(3, 5), fh(1, 2), '0.07', fh(7, 8), '45%'], bad = ['1.2', '−0.3', fh(5, 4), '130%', '−' + fh(1, 2), '2'];
    if (R.bool()) { const b = R.pick(bad); return choice(R, 'Which number <b>cannot</b> be a probability?', b, R.sample(valid, 3), `Probabilities run from 0 (impossible) to 1 (certain). ${b} is outside that range.`); }
    const v = R.pick(valid); return choice(R, 'Which number <b>could</b> be a probability?', v, R.sample(bad, 3), `Only ${v} lies from 0 to 1. The others are negative or greater than 1.`);
  } },
  b: { t: 'likely, unlikely, certain', g: R => {
    const W = ['Impossible', 'Unlikely', 'Even chance', 'Likely', 'Certain'], kind = R.int(0, 4);
    let bag = bagMake(R, R.int(2, 3), 1, 6), ev;
    if (kind === 0) { ev = R.pick(COL.filter(c => !bag.some(b => b.nm === c[0])))[0]; }
    else if (kind === 4) { bag = [bag[0]]; ev = bag[0].nm; }
    else { bag = tries(() => bagMake(R, R.int(2, 3), 1, 7), b => { const t = sum(b.map(x => x.n)), x = b[0].n; return kind === 2 ? 2 * x === t : kind === 1 ? 2 * x < t : 2 * x > t; }); ev = bag[0].nm; bag = R.shuffle(bag); }
    const t = sum(bag.map(x => x.n)), f = (bag.find(x => x.nm === ev) || { n: 0 }).n;
    return choiceFixed(`A bag holds ${bagTxt(bag)} marble${t > 1 ? 's' : ''}. You pick one without looking. How likely is ${ev}?`, W, kind,
      `P(${ev}) = ${frRaw(f, t)}${f && f < t && red(f, t)[1] !== t ? ' = ' + fr(f, t) : ''}. ${['0 means impossible.', 'Less than a half is unlikely.', 'Exactly a half is an even chance.', 'More than a half is likely.', '1 means certain.'][kind]}`,
      { visual: bagVis(bag) });
  } },
  c: { t: 'P = favorable ÷ total', g: R => {
    const k = R.pick(['bag', 'die', 'spin']);
    if (k === 'bag') { const b = bagMake(R, 3, 1, 7), t = sum(b.map(x => x.n)), x = R.pick(b);
      return num(`A bag holds ${bagTxt(b)} marbles. You pick one at random. What is P(${x.nm})? Write it in simplest form.`, [frac(x.n, t, 'simplest')], `${x.n} ${x.nm} out of ${t} marbles: ${frRaw(x.n, t)}${red(x.n, t)[1] !== t ? ' = ' + fr(x.n, t) : ''}.`, { visual: bagVis(b) }); }
    if (k === 'die') { const E = R.pick([['an even number', [2, 4, 6]], ['a number greater than 4', [5, 6]], ['a multiple of 3', [3, 6]], ['a number less than 5', [1, 2, 3, 4]], ['a prime number', [2, 3, 5]], ['a 1 or a 6', [1, 6]]]);
      return num(`Roll a fair six-sided die. What is P(${E[0]})? Write it in simplest form.`, [frac(E[1].length, 6, 'simplest')], `Favorable: ${E[1].join(', ')}, which is ${E[1].length} of 6 outcomes. ${frRaw(E[1].length, 6)} = ${fr(E[1].length, 6)}.`); }
    const n = R.pick([5, 6, 8, 10]), labs = Array.from({ length: n }, (_, i) => String(i + 1)), E = R.pick([['an odd number', x => x % 2 === 1], [`a number greater than ${Math.floor(n / 2)}`, x => x > Math.floor(n / 2)], ['a number less than 4', x => x < 4]]);
    const f = labs.filter(x => E[1](+x)).length;
    return num(`The spinner has ${n} equal sections. What is P(${E[0]})? Write it in simplest form.`, [frac(f, n, 'simplest')], `${f} of the ${n} equal sections: ${frRaw(f, n)}${red(f, n)[1] !== n ? ' = ' + fr(f, n) : ''}.`, { visual: V9.spinner(labs) });
  } },
  d: { t: 'complement 1 − P', g: R => {
    const k = R.pick(['frac', 'dec', 'bag']);
    if (k === 'frac') { const d = R.pick([5, 6, 8, 9, 10, 12]), n = tries(() => R.int(1, d - 1), n => E3.gcd(n, d) === 1), ev = R.pick(['it rains tomorrow', 'a player scores', 'the bus is late', 'a seed sprouts']);
      return num(`P(${ev}) = ${fh(n, d)}. What is the probability that it does <b>not</b> happen? Write it in simplest form.`, [frac(d - n, d, 'simplest')], `1 − ${fh(n, d)} = ${fh(d, d)} − ${fh(n, d)} = ${fr(d - n, d)}.`); }
    if (k === 'dec') { const p = R.int(1, 99) / 100, ev = R.pick(['a light bulb fails this year', 'a train is on time', 'a team wins']);
      return num(`P(${ev}) = ${F(p)}. What is the probability that it does <b>not</b> happen? Give a decimal.`, Math.round((1 - p) * 100) / 100, `1 − ${F(p)} = ${F(Math.round((1 - p) * 100) / 100)}.`); }
    const b = bagMake(R, 3, 1, 7), t = sum(b.map(x => x.n)), x = R.pick(b);
    return num(`A bag holds ${bagTxt(b)} marbles. What is P(<b>not</b> ${x.nm})? Write it in simplest form.`, [frac(t - x.n, t, 'simplest')], `P(${x.nm}) = ${frRaw(x.n, t)}, so P(not ${x.nm}) = 1 − ${frRaw(x.n, t)} = ${fr(t - x.n, t)}.`, { visual: bagVis(b) });
  } },
} });

/* ================= III.9.14 Experimental probability ================= */
E3.skill({ id: 'III.9.14', name: 'Experimental probability', steps: {
  a: { t: 'run trials and record', g: R => {
    const cs = R.sample(COL, 3), n = R.int(15, 24), seq = Array.from({ length: n }, () => R.int(0, 2)), cnt = [0, 1, 2].map(i => seq.filter(x => x === i).length);
    const letters = cs.map(c => c[0][0].toUpperCase());
    return num(`A spinner was spun ${n} times: ${seq.map(i => letters[i]).join(' ')}<br>(${cs.map((c, i) => letters[i] + ' = ' + c[0]).join(', ')}). Record the count for each color.`, cs.map((c, i) => ({ label: c[0], ans: cnt[i] })),
      `Tally each letter: ${cs.map((c, i) => `${c[0]} ${cnt[i]}`).join(', ')}. Check: ${cnt.join(' + ')} = ${n}.`);
  } },
  b: { t: 'relative frequency', g: R => {
    const k = R.pick(['coin', 'die', 'spinner']);
    const labs = k === 'coin' ? ['Heads', 'Tails'] : k === 'die' ? ['1', '2', '3', '4', '5', '6'] : R.sample(COL, 3).map(c => cap(c[0]));
    const N = R.pick(k === 'die' ? [30, 60, 120] : [20, 40, 50, 80, 100]);
    const c = tries(() => { const a = labs.map(() => R.int(1, 10)); const t = sum(a); const b = a.map(x => Math.max(1, Math.round(x / t * N))); b[b.length - 1] = N - sum(b.slice(0, -1)); return b; }, b => b[b.length - 1] > 0);
    const j = R.int(0, labs.length - 1);
    return num(`The table shows the results of ${N} trials. What is the relative frequency of ${labs[j]}? Write it in simplest form.`, [frac(c[j], N, 'simplest')],
      `${labs[j]} happened ${c[j]} times in ${N} trials: ${frRaw(c[j], N)}${red(c[j], N)[1] !== N ? ' = ' + fr(c[j], N) : ''}.`,
      { visual: V9.table([['Outcome', ...labs], ['Count', ...c.map(String)]], { first: 80, cell: labs.length > 4 ? 40 : 60 }) });
  } },
  c: { t: 'compare to theoretical', g: R => {
    const die = R.bool(), sides = die ? 6 : R.pick([4, 5, 8]), N = sides * R.int(5, 20), exp = N / sides, got = exp + nzI(R, -Math.min(8, exp - 1), 8), f = R.int(1, sides);
    const dev = die ? 'a fair die was rolled' : `a spinner with ${sides} equal sections numbered 1 to ${sides} was spun`;
    return num(`In an experiment, ${dev} ${N} times. It landed on ${f} in ${got} of them. How many times would you expect? How far off was the result?`, [{ label: 'expected', ans: exp }, { label: 'observed − expected =', ans: got - exp }],
      `Theoretical P(${f}) = ${fh(1, sides)}, so expect ${fh(1, sides)} × ${N} = ${exp}. Observed − expected = ${got} − ${exp} = ${F(got - exp)}.`);
  } },
  d: { t: 'more trials, closer estimate', g: R => {
    const q = R.pick(['who', 'streak', 'table']), [a, b] = R.sample(NAMES, 2);
    if (q === 'streak') { const k = R.int(4, 7);
      return num(`A fair coin lands heads ${k} times in a row. What is the probability that the next toss is heads?`, [frac(1, 2)], `The coin has no memory: each toss is still ${fh(1, 2)}. Past results don't change the next toss.`); }
    if (q === 'who') { const n1 = R.pick([10, 20, 30]), n2 = R.pick([500, 800, 1000]);
      return choice(R, `${a} tosses a fair coin ${n1} times and ${b} tosses one ${n2} times. Whose fraction of heads is likely closer to ${fh(1, 2)}?`, `${b}'s (${n2} tosses)`, [`${a}'s (${n1} tosses)`, 'Both are exactly the same'],
        'With more trials, the relative frequency usually settles closer to the theoretical probability.'); }
    const N = [10, 50, 200, 1000], p = R.pick([[1, 6], [1, 4], [1, 2]]), th = p[0] / p[1];
    const rf = N.map((n, i) => { const off = [0.2, 0.08, 0.03, 0.006][i] * (R.bool() ? 1 : -1); return Math.max(0, Math.round((th + off) * n)); });
    const dev = p[1] === 6 ? 'rolling a 6 on a die' : p[1] === 4 ? 'landing on red (1 of 4 equal sections)' : 'heads on a coin';
    return choice(R, `The table shows results for ${dev}. Which estimate of the probability should you trust most?`, `${rf[3]}/${N[3]}`, [0, 1, 2].map(i => `${rf[i]}/${N[i]}`),
      `${rf[3]}/${N[3]} comes from the most trials (${N[3]}). It is closest to the theoretical ${p[0]}/${p[1]}.`,
      { visual: V9.table([['Trials', ...N.map(String)], ['Successes', ...rf.map(String)]], { first: 90 }) });
  } },
} });

/* ================= III.9.15 Sample spaces ================= */
E3.skill({ id: 'III.9.15', name: 'Sample spaces', steps: {
  a: { t: 'list outcomes', g: R => {
    const k = R.pick(['coins', 'coinspin', 'three', 'spins']);
    let A, B, what;
    if (k === 'coins') { A = ['H', 'T']; B = ['H', 'T']; what = 'toss two coins'; }
    else if (k === 'coinspin') { A = ['H', 'T']; B = Array.from({ length: R.int(3, 4) }, (_, i) => String(i + 1)); what = `toss a coin and spin a spinner numbered 1 to ${B.length}`; }
    else if (k === 'spins') { A = R.sample(['R', 'B', 'G', 'Y'], 2); B = ['1', '2', '3']; what = `pick a marble (${A.join(' or ')}) and spin 1 to 3`; }
    else { const all = ['HHH', 'HHT', 'HTH', 'HTT', 'THH', 'THT', 'TTH', 'TTT'], miss = R.sample(all.slice(1, 7), 1);
      return choice(R, 'Which list is the full sample space for tossing three coins?', all.join(', '), [all.filter(x => !miss.includes(x)).join(', '), 'HHH, HHT, HTT, TTT', 'H, T'],
        'Each coin has 2 outcomes: 2 × 2 × 2 = 8. Order matters, so HHT, HTH and THH are different outcomes.'); }
    const full = A.flatMap(a => B.map(b => a + b)), noRev = A.length === B.length && A.join() === B.join() ? full.filter((x, i) => x[0] <= x[1]) : full.slice(0, -1);
    const oneEach = A.concat(B).filter((x, i, a) => a.indexOf(x) === i);
    return choice(R, `You ${what}. Which list is the full sample space?`, full.join(', '), [noRev.join(', '), oneEach.join(', '), full.slice(1).join(', ')],
      `Pair every first result with every second one: ${A.length} × ${B.length} = ${full.length} outcomes.${k === 'coins' ? ' HT and TH are different outcomes.' : ''}`);
  } },
  b: { t: 'tables for two events', g: R => {
    const a = R.int(3, 6), b = R.int(3, 6), S = R.int(4, a + b - 1), cnt = [];
    for (let i = 1; i <= a; i++) for (let j = 1; j <= b; j++) if (i + j === S) cnt.push([i, j]);
    if (!cnt.length) return E3.byId['III.9.15'].steps.b.g(R);
    return num(`Spin both spinners and add the numbers. Make a table of all outcomes. How many outcomes are there, and how many give a sum of ${S}?`, [{ label: 'outcomes', ans: a * b }, { label: `sum ${S}`, ans: cnt.length }],
      `The table has ${a} rows × ${b} columns = ${a * b} cells. Sum ${S}: ${cnt.map(([i, j]) => `${i}+${j}`).join(', ')}, so ${cnt.length}.`,
      { visual: V.side([V9.spinner(Array.from({ length: a }, (_, i) => String(i + 1)), null, { r: 52 }), V9.spinner(Array.from({ length: b }, (_, i) => String(i + 1)), null, { r: 52 })]) });
  } },
  c: { t: 'tree diagrams', g: R => {
    const sets = [[['Rice', 'Noodles', 'Bread'], ['Chicken', 'Tofu', 'Fish', 'Beef']], [['Red', 'Blue', 'Black'], ['Small', 'Medium', 'Large']], [['Soccer', 'Swim'], ['Mon', 'Wed', 'Fri', 'Sat']], [['Heads', 'Tails'], ['1', '2', '3', '4', '5', '6']]];
    const [A0, B0] = R.pick(sets), A = R.sample(A0, R.int(2, Math.min(3, A0.length))), B = R.sample(B0, R.int(2, Math.min(4, B0.length)));
    const q = R.int(0, 2), a = R.pick(A), b = R.pick(B);
    const vis = V9.tree(A, B);
    if (q === 0) return num('How many outcomes does the tree diagram show?', A.length * B.length, `Each of the ${A.length} first choices branches into ${B.length}: ${A.length} × ${B.length} = ${A.length * B.length} paths.`, { visual: vis });
    if (q === 1) return num(`How many outcomes include ${a}?`, B.length, `${a} branches into ${B.length} second choices, so ${B.length} paths go through it.`, { visual: vis });
    return num(`How many outcomes include ${a} or ${b} (or both)?`, B.length + A.length - 1, `${B.length} paths go through ${a}, and ${A.length} paths end in ${b}. ${a} with ${b} is counted twice, so ${B.length} + ${A.length} − 1 = ${A.length + B.length - 1}.`, { visual: vis });
  } },
  d: { t: 'counting principle', g: R => {
    const ctx = R.pick([['breads', 'fillings', 'drinks', 'lunches'], ['shirts', 'pairs of pants', 'pairs of shoes', 'outfits'], ['starters', 'main dishes', 'desserts', 'meals'], ['colors', 'sizes', 'logos', 'T-shirt designs']]);
    const three = R.bool(0.7), a = R.int(2, 6), b = R.int(2, 6), c = three ? R.int(2, 5) : 1;
    const t = a * b * c, pr = three ? `${a} ${ctx[0]}, ${b} ${ctx[1]} and ${c} ${ctx[2]}` : `${a} ${ctx[0]} and ${b} ${ctx[1]}`;
    return num(`You choose one from each: ${pr}. How many different ${ctx[3]} are possible?`, t,
      `Multiply the choices: ${three ? `${a} × ${b} × ${c}` : `${a} × ${b}`} = ${t}. Adding (${a + b + c - (three ? 0 : 1)}) would miss the combinations.`);
  } },
} });

/* ================= III.9.16 Compound events ================= */
const EVA = [['heads on a coin', 1, 2], ['a 6 on a die', 1, 6], ['an even number on a die', 3, 6], ['a number less than 3 on a die', 2, 6], ['red on a spinner with 4 equal colors', 1, 4], ['a 1 or 2 on a spinner numbered 1 to 5', 2, 5], ['a vowel from the cards A, B, C, D, E', 2, 5]];
const sumTable = (a, b) => V9.table([['+', ...Array.from({ length: b }, (_, j) => String(j + 1))]].concat(Array.from({ length: a }, (_, i) => [String(i + 1), ...Array.from({ length: b }, (_, j) => String(i + j + 2))])), { first: 40, cell: 40 });
E3.skill({ id: 'III.9.16', name: 'Compound events', steps: {
  a: { t: 'independent events multiply', g: R => {
    const [A, B] = tries(() => R.sample(EVA, 2), ([A, B]) => !(A[0].includes('die') && B[0].includes('die')) && !(A[0].includes('coin') && B[0].includes('coin')));
    const n = A[1] * B[1], d = A[2] * B[2];
    return num(`Find P(${A[0]} <b>and</b> ${B[0]}). Write it in simplest form.`, [frac(n, d, 'simplest')],
      `Independent, so multiply: ${fr(A[1], A[2])} × ${fr(B[1], B[2])} = ${fr(n, d)}. Don't add: "and" is less likely than either event alone.`);
  } },
  b: { t: 'find P from a sample space', g: R => {
    const a = R.int(3, 6), b = R.int(3, 6), all = []; for (let i = 1; i <= a; i++) for (let j = 1; j <= b; j++) all.push(i + j);
    const q = R.pick(['eq', 'gt', 'even']), S = R.int(4, a + b - 1);
    const [txt, f] = q === 'eq' ? [`a sum of ${S}`, all.filter(x => x === S).length] : q === 'gt' ? [`a sum greater than ${S}`, all.filter(x => x > S).length] : ['an even sum', all.filter(x => x % 2 === 0).length];
    return num(`Two spinners, numbered 1 to ${a} and 1 to ${b}, are spun and the numbers added. The table shows every outcome. Find P(${txt}) in simplest form.`, [frac(f, a * b, 'simplest')],
      `${f} of the ${a * b} equally likely cells give ${txt}: ${frRaw(f, a * b)}${red(f, a * b)[1] !== a * b ? ' = ' + fr(f, a * b) : ''}.`, { visual: sumTable(a, b) });
  } },
  c: { t: '"and" vs "or" informally', g: R => {
    const n = R.pick([10, 12, 15, 20]), k = R.int(3, n - 4);
    const [bt, bf] = R.pick([[`greater than ${k}`, x => x > k], ['a multiple of 3', x => x % 3 === 0], [`less than ${k}`, x => x < k], ['a multiple of 5', x => x % 5 === 0]]);
    const [at, af] = R.pick([['even', x => x % 2 === 0], ['odd', x => x % 2 === 1]]);
    const xs = Array.from({ length: n }, (_, i) => i + 1), A = xs.filter(af), B = xs.filter(bf), AB = xs.filter(x => af(x) && bf(x)), AoB = xs.filter(x => af(x) || bf(x));
    if (!AB.length) return E3.byId['III.9.16'].steps.c.g(R);
    return num(`Cards numbered 1 to ${n}; pick one at random. Find P(${at} <b>and</b> ${bt}) and P(${at} <b>or</b> ${bt}) in simplest form.`, [{ label: 'P(and)', ...frac(AB.length, n, 'simplest') }, { label: 'P(or)', ...frac(AoB.length, n, 'simplest') }],
      `And (both): ${L(AB)}, ${AB.length} card${AB.length === 1 ? '' : 's'}. Or (either): ${A.length} + ${B.length} − ${AB.length} overlap = ${AoB.length} cards. So ${fr(AB.length, n)} and ${fr(AoB.length, n)}.`);
  } },
  d: { t: 'word problems', g: R => {
    const q = R.pick(['bag', 'both', 'atleast']);
    if (q === 'bag') { const b = bagMake(R, 2, 2, 6), t = b[0].n + b[1].n, x = R.pick(b);
      return num(`A bag holds ${bagTxt(b)} marbles. Pick one, put it back, then pick again. Find P(both ${x.nm}) in simplest form.`, [frac(x.n * x.n, t * t, 'simplest')],
        `Putting it back keeps the picks independent: ${frRaw(x.n, t)} × ${frRaw(x.n, t)} = ${frRaw(x.n * x.n, t * t)}${red(x.n * x.n, t * t)[1] !== t * t ? ' = ' + fr(x.n * x.n, t * t) : ''}.`); }
    const p = R.pick([[1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [2, 5], [3, 5], [3, 10], [7, 10]]), r = R.pick([[1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [1, 5], [4, 5], [9, 10]]);
    const [a, b] = R.sample(NAMES, 2);
    if (q === 'both') return num(`${a} makes a free throw with probability ${fh(...p)}; ${b}, independently, with probability ${fh(...r)}. Find P(both make it) in simplest form.`, [frac(p[0] * r[0], p[1] * r[1], 'simplest')],
      `Both must happen, so multiply: ${fh(...p)} × ${fh(...r)} = ${fr(p[0] * r[0], p[1] * r[1])}.`);
    const nm = (p[1] - p[0]) * (r[1] - r[0]), d = p[1] * r[1];
    return num(`${a} makes a free throw with probability ${fh(...p)}; ${b}, independently, with probability ${fh(...r)}. Find P(at least one makes it) in simplest form.`, [frac(d - nm, d, 'simplest')],
      `P(both miss) = ${fh(p[1] - p[0], p[1])} × ${fh(r[1] - r[0], r[1])} = ${frRaw(nm, d)}. At least one = 1 − ${frRaw(nm, d)} = ${fr(d - nm, d)}.`);
  } },
} });

/* ================= III.9.17 Simulations ================= */
const DEV = [[1, 2, 'Toss a coin: heads = success'], [1, 6, 'Roll a die: 6 = success'], [1, 3, 'Roll a die: 1 or 2 = success'], [1, 4, 'Spin a spinner with 4 equal sections: 1 section = success'], [7, 10, 'Pick a random digit 0–9: 0 to 6 = success'], [3, 10, 'Pick a random digit 0–9: 0 to 2 = success'], [2, 5, 'Pick a random digit 0–9: 0 to 3 = success'], [5, 6, 'Roll a die: 1 to 5 = success'], [3, 4, 'Spin a spinner with 4 equal sections: 3 sections = success'], [9, 10, 'Pick a random digit 0–9: 0 to 8 = success']];
const pTxt = (n, d) => d === 10 ? `${n * 10}%` : fh(n, d);
const digitsVis = (groups, per) => { const cw = per * 12 + 16, row = Math.min(10, groups.length), rows = Math.ceil(groups.length / row); let b = '';
  groups.forEach((g, i) => { const x = 4 + (i % row) * (cw + 6), y = 4 + Math.floor(i / row) * 34; b += `<rect x="${x}" y="${y}" width="${cw}" height="28" rx="5" fill="${C.faint}" stroke="${C.line}"/>` + V.text(x + cw / 2, y + 14, g, { size: 15, weight: 600 }); });
  return V.svg(row * (cw + 6) + 2, rows * 34 + 4, b, 'random digits'); };
E3.skill({ id: 'III.9.17', name: 'Simulations', steps: {
  a: { t: 'choose a random device', g: R => {
    const t = R.pick(DEV), ctx = R.pick(['A player scores', 'A seed sprouts', 'A bus is late', 'A machine passes a test']);
    const pool = DEV.filter(d => d[0] * t[1] !== t[0] * d[1]), coin = pool.find(d => d[1] === 2), ds = (coin ? [coin].concat(R.sample(pool.filter(d => d !== coin), 2)) : R.sample(pool, 3)).map(d => d[2]);
    return choice(R, `${ctx} with probability ${pTxt(t[0], t[1])}. Which device can simulate one try?`, t[2], ds,
      `The device must succeed with the same probability, ${pTxt(t[0], t[1])}. "${t[2]}" does.`);
  } },
  b: { t: 'design trials', g: R => {
    const p = R.pick([2, 3, 4, 6, 7, 8]) * 10, k = p / 10, sh = R.int(2, 5);
    if (R.bool(0.55)) return choice(R, `Simulate a player who makes ${p}% of shots using random digits 0–9. Which digits should stand for a make?`, `0 to ${k - 1}`, [`0 to ${k}`, `${k} to 9`, `1 to ${k - 1}`],
      `${p}% of the 10 digits is ${k} digits, so 0 to ${k - 1} (${k} digits) mean a make and the other ${10 - k} a miss.`);
    const T = R.pick([10, 20, 25, 50]);
    return num(`Simulate a player who makes ${p}% of shots with random digits 0–9, one digit per shot. You run ${T} trials of ${sh} shots each.`, [{ label: 'digits that mean a make', ans: k }, { label: 'digits used in all', ans: T * sh }],
      `${p}% of the 10 digits is ${k} digits (0 to ${k - 1}). Each trial uses ${sh} digits, so ${T} trials use ${T} × ${sh} = ${T * sh}.`);
  } },
  c: { t: 'run and tally', g: R => {
    const p = R.pick([5, 6, 7, 8]), T = R.pick([10, 12, 15]), groups = Array.from({ length: T }, () => `${R.int(0, 9)}${R.int(0, 9)}`);
    const mk = g => [...g].filter(c => +c < p).length, q = R.pick(['both', 'miss', 'one']);
    const [txt, f] = q === 'both' ? ['both shots made', g => mk(g) === 2] : q === 'miss' ? ['at least one miss', g => mk(g) < 2] : ['exactly one make', g => mk(g) === 1];
    const c = groups.filter(f).length;
    return num(`A player makes ${p * 10}% of shots: digits 0 to ${p - 1} = make, ${p} to 9 = miss. Each pair is one trial of 2 shots. How many trials show ${txt}?`, c,
      `Check each pair: ${groups.filter(f).join(', ') || 'none'} ${c === 1 ? 'shows' : 'show'} ${txt}, so ${c}.`, { visual: digitsVis(groups, 2) });
  } },
  d: { t: 'estimate a probability', g: R => {
    const N = R.pick([20, 25, 40, 50, 60]), c0 = R.int(1, Math.floor(N / 4)), c1 = R.int(3, Math.floor(N / 2)), c2 = N - c0 - c1;
    const q = R.pick(['least', 'both', 'none']), [txt, f] = q === 'least' ? ['at least 1 make', c1 + c2] : q === 'both' ? ['2 makes', c2] : ['0 makes', c0];
    return num(`A simulation ran ${N} trials of 2 shots each. Estimate P(${txt}) in simplest form.`, [frac(f, N, 'simplest')],
      `${f} of ${N} trials: ${frRaw(f, N)}${red(f, N)[1] !== N ? ' = ' + fr(f, N) : ''}. More trials would give a steadier estimate.`,
      { visual: V9.table([['Makes', '0', '1', '2'], ['Trials', String(c0), String(c1), String(c2)]], { first: 70, cell: 50 }) });
  } },
} });

/* ================= III.9.18 Scatter plots ================= */
const corr = P => { const n = P.length, mx = mean(P.map(p => p[0])), my = mean(P.map(p => p[1])); let sxy = 0, sxx = 0, syy = 0; P.forEach(([x, y]) => { sxy += (x - mx) * (y - my); sxx += (x - mx) ** 2; syy += (y - my) ** 2; }); return sxy / Math.sqrt(sxx * syy || 1); };
const fit = P => { const mx = mean(P.map(p => p[0])), my = mean(P.map(p => p[1])); let sxy = 0, sxx = 0; P.forEach(([x, y]) => { sxy += (x - mx) * (y - my); sxx += (x - mx) ** 2; }); const m = sxy / sxx; return { m, b: my - m * mx }; };
const sse = (P, Ln) => sum(P.map(([x, y]) => (y - Ln.m * x - Ln.b) ** 2));
const SC = [['Hours of practice', 'Points scored'], ['Age of car (years)', 'Value (thousands)'], ['Temperature (°)', 'Drinks sold'], ['Minutes of study', 'Quiz score'], ['Days', 'Plant height']];
const cloud = (R, m, b, n, noise, xs = null) => { const X = xs || R.distinct(0, 10, n); return X.map(x => [x, Math.round(Math.min(20, Math.max(0, m * x + b + (R.f() * 2 - 1) * noise)))]); };
const uniq = P => P.filter((p, i) => P.findIndex(q => q[0] === p[0] && q[1] === p[1]) === i);
E3.skill({ id: 'III.9.18', name: 'Scatter plots', steps: {
  a: { t: 'plot bivariate data', g: R => {
    const P = tries(() => Array.from({ length: 5 }, () => [R.int(1, 10), R.int(1, 10)]), P => uniq(P).length === 5 && P[0][0] !== P[0][1] && !P.some(q => q[0] === P[0][1] && q[1] === P[0][0]) && new Set(P.map(p => p[0])).size >= 4);
    const [x, y] = P[0], all = P.concat([[y, x]]), lets = R.shuffle(['A', 'B', 'C', 'D', 'E', 'F']), pts = all.map((p, i) => [p[0], p[1], lets[i]]);
    const ctx = R.pick([['hours of practice', 'goals'], ['books read', 'hours online'], ['km walked', 'hours slept']]);
    return choice(R, `x = ${ctx[0]}, y = ${ctx[1]}. Which point shows ${x} ${ctx[0]} and ${y} ${ctx[1]}?`, lets[0], [lets[5], lets[1], lets[2]],
      `Go across to x = ${x}, then up to y = ${y}: point ${lets[0]}. Point ${lets[5]} is (${y}, ${x}), with x and y swapped.`,
      { visual: V9.scatter(pts, { xmax: 10, ymax: 10, pw: 280, ph: 280, xt: ctx[0], yt: ctx[1] }) });
  } },
  b: { t: 'positive, negative, none', g: R => {
    const k = R.int(0, 2), n = R.int(10, 13), ctx = R.pick(SC);
    const P = tries(() => k === 2 ? uniq(Array.from({ length: n }, () => [R.int(0, 10), R.int(1, 19)])) : cloud(R, k === 0 ? R.pick([1, 1.5, 1.8]) : -R.pick([1, 1.5, 1.8]), k === 0 ? R.int(1, 4) : R.int(16, 19), n, 3),
      P => k === 2 ? Math.abs(corr(P)) < 0.15 && P.length >= 10 : Math.abs(corr(P)) > 0.8);
    return choiceFixed('What kind of association does the scatter plot show?', ['Positive', 'Negative', 'No association'], k,
      ['As x increases, y tends to increase.', 'As x increases, y tends to decrease.', 'The points show no clear up or down trend.'][k] + ' A pattern alone does not prove one causes the other.',
      { visual: V9.scatter(P, { xmax: 10, ymax: 20, ystep: 2 }) });
  } },
  c: { t: 'clusters and outliers', g: R => {
    const up = R.bool(), m = up ? R.pick([1.2, 1.5]) : -R.pick([1.2, 1.5]), b = up ? R.int(2, 4) : R.int(16, 18);
    const d = tries(() => { const P = cloud(R, m, b, 10, 1.5); const o = R.int(2, 8); const oy = Math.round(m * o + b) > 10 ? R.int(0, 3) : R.int(17, 20); return { P: P.filter(p => p[0] !== o), o: [o, oy] }; },
      ({ P, o }) => Math.abs(o[1] - (m * o[0] + b)) >= 8 && P.length >= 8);
    const lets = R.shuffle(['A', 'B', 'C', 'D']), others = R.sample(d.P, 3), pts = d.P.map(p => { const i = others.indexOf(p); return i >= 0 ? [p[0], p[1], lets[i + 1]] : p; }).concat([[d.o[0], d.o[1], lets[0]]]);
    return choice(R, 'Which labeled point is an outlier?', lets[0], lets.slice(1),
      `Point ${lets[0]} at (${d.o[0]}, ${d.o[1]}) sits far from the ${up ? 'rising' : 'falling'} pattern the other points follow.`, { visual: V9.scatter(pts, { xmax: 10, ymax: 20, ystep: 2 }) });
  } },
  d: { t: 'linear vs nonlinear pattern', g: R => {
    const k = R.int(0, 2), xs = R.distinct(0, 10, 10);
    let P;
    if (k === 0) { const m = R.pick([1.5, -1.5, 1.8, -1.2]), b = m > 0 ? R.int(1, 2) : 19; P = cloud(R, m, b, 10, 1, xs); }
    else if (k === 1) { const f = R.pick([x => 0.2 * x * x, x => 20 - 0.2 * x * x, x => 0.8 * (x - 5) ** 2, x => 19 - 0.7 * (x - 5) ** 2, x => 20 * 0.72 ** x]); P = xs.map(x => [x, Math.round(Math.max(0, Math.min(20, f(x))))]); }
    else P = tries(() => uniq(xs.map(x => [x, R.int(1, 19)])), P => Math.abs(corr(P)) < 0.15);
    return choiceFixed('Which describes the pattern in the scatter plot?', ['Linear', 'Nonlinear (curved)', 'No association'], k,
      ['The points lie close to a straight line.', 'The points follow a curve, not a straight line.', 'The points show no clear pattern.'][k], { visual: V9.scatter(P, { xmax: 10, ymax: 20, ystep: 2 }) });
  } },
} });

/* ================= III.9.19 Trend lines ================= */
const lineExpr = (m, b) => `${m === 1 ? '' : m === -1 ? '-' : F(m).replace('−', '-')}x${b > 0 ? '+' + b : b < 0 ? '-' + (-b) : ''}`;
E3.skill({ id: 'III.9.19', name: 'Trend lines', steps: {
  a: { t: 'draw a line of fit by eye', g: R => {
    const up = R.bool(), m = up ? R.pick([1.2, 1.5, 1.7]) : -R.pick([1.2, 1.5, 1.7]), b = up ? R.int(2, 4) : R.int(16, 18);
    const d = tries(() => { const P = cloud(R, m, b, 10, 2.5); const s = P.slice().sort((a, c) => a[0] - c[0]); const f = s[0], l = s[s.length - 1];
      const best = fit(P), fl = { m: (l[1] - f[1]) / (l[0] - f[0]), b: f[1] - (l[1] - f[1]) / (l[0] - f[0]) * f[0] }, shift = { m: best.m, b: best.b + (up ? 5 : -5) }, steep = { m: best.m * 2.2, b: mean(P.map(p => p[1])) - best.m * 2.2 * mean(P.map(p => p[0])) };
      return { P, best, alt: [R.bool() ? fl : steep, shift] }; },
      ({ P, best, alt }) => alt.every(a => sse(P, a) > 2.2 * sse(P, best) && Math.abs(a.m - best.m) + Math.abs(a.b - best.b) > 2));
    const lets = R.shuffle(['A', 'B', 'C']), cols = [C.red, C.teal, C.violet], Ls = [d.best].concat(d.alt).map((Ln, i) => ({ m: Ln.m, b: Ln.b, label: lets[i], color: cols[i] }));
    return choice(R, 'Which line fits the data best?', lets[0], lets.slice(1),
      `Line ${lets[0]} follows the whole cloud with points on both sides. A good fit needn't pass through the first and last points.`, { visual: V9.scatter(d.P, { xmax: 10, ymax: 20, ystep: 2, lines: Ls }) });
  } },
  b: { t: 'write its equation', g: R => {
    const [m, b] = R.pick([[1, R.int(1, 8)], [2, R.int(0, 4)], [0.5, R.int(2, 12)], [1.5, R.int(1, 4)], [-1, R.int(12, 19)], [-2, R.int(18, 20)], [-0.5, R.int(8, 18)], [-1.5, R.int(16, 20)]]);
    const P = cloud(R, m, b, 9, 1.8);
    return num('Write the equation of the red trend line in the form y = mx + b.', [{ label: 'y =', expr: lineExpr(m, b), form: 'any' }],
      `It crosses the y-axis at ${b}, so b = ${b}. It ${m > 0 ? 'rises' : 'falls'} ${F(Math.abs(m * 2))} for every 2 across, so m = ${F(m)}: y = ${m === 1 ? '' : m === -1 ? '−' : F(m)}x ${b >= 0 ? '+ ' + b : '− ' + (-b)}.`,
      { visual: V9.scatter(P, { xmax: 10, ymax: 20, ystep: 2, lines: [{ m, b, color: C.red }] }) });
  } },
  c: { t: 'predict from it', g: R => {
    const ctx = R.pick([['hours of practice', 'points', 'score'], ['minutes of exercise', 'heart rate', 'beats per minute'], ['days', 'plant height', 'cm'], ['years since 2010', 'town population', 'hundreds of people']]);
    const sl = R.pick([1.5, 2, 2.5, 3, 4, 0.5, 5]), b = R.int(10, 60), x = R.int(3, 15), y = sl * x + b;
    return num(`A trend line for ${ctx[0]} (x) and ${ctx[1]} (y) is ${m('y = ' + F(sl) + 'x + ' + b)}. Predict y when x = ${x}.`, y,
      `Substitute: y = ${F(sl)} × ${x} + ${b} = ${F(sl * x)} + ${b} = ${F(y)}.`);
  } },
  d: { t: 'interpret slope and intercept', g: (R, O) => {
    const cur = O.coins === 'THB' ? (v => `${F(v)} baht`) : (v => `$${F(v)}`), cm = O.units === 'imperial' ? 'in' : 'cm'; const tens = O.coins === 'THB' ? 'hundreds of baht' : 'tens of dollars';
    const Cx = R.pick([
      { m: R.pick([1.5, 2, 2.5, 3]), b: R.int(5, 12), x: 'weeks', y: `plant height (${cm})`, s: m => `The plant grows about ${F(m)} ${cm} per week.`, i: b => `The plant was about ${b} ${cm} tall at week 0.`, sw: m => `The plant was about ${F(m)} ${cm} tall at week 0.`, iw: b => `The plant grows about ${b} ${cm} per week.` },
      { m: R.pick([12, 15, 20]), b: R.int(25, 60), x: 'hours worked', y: 'money earned', s: m => `Each extra hour earns about ${cur(m)} more.`, i: b => `With 0 hours worked, the line gives ${cur(b)}.`, sw: m => `With 0 hours worked, the line gives ${cur(m)}.`, iw: b => `Each extra hour earns about ${cur(b)} more.` },
      { m: -R.pick([2, 3, 4]), b: R.int(30, 50), x: 'age of a bike (years)', y: `value (${tens})`, s: m => `The value drops by about ${-m} ${tens} per year.`, i: b => `A new bike (age 0) is worth about ${b} ${tens}.`, sw: m => `A new bike is worth about ${-m} ${tens}.`, iw: b => `The value drops by about ${b} ${tens} per year.` },
      { m: R.pick([4, 5, 6]), b: R.int(40, 60), x: 'hours of study', y: 'test score', s: m => `Each extra hour of study adds about ${m} points.`, i: b => `With no study, the predicted score is about ${b}.`, sw: m => `With no study, the predicted score is about ${m}.`, iw: b => `Each extra hour of study adds about ${b} points.` },
    ]);
    const slope = R.bool(), eq = m(`y = ${F(Cx.m)}x + ${Cx.b}`);
    return choice(R, `For ${Cx.x} (x) and ${Cx.y} (y), the trend line is ${eq}. What does the <b>${slope ? 'slope' : 'y-intercept'}</b> mean?`, slope ? Cx.s(Cx.m) : Cx.i(Cx.b), slope ? [Cx.sw(Cx.m), Cx.iw(Cx.b)] : [Cx.iw(Cx.b), Cx.sw(Cx.m)],
      `The slope, ${F(Cx.m)}, is the change in y for each 1 unit of x. The intercept, ${Cx.b}, is the value of y when x = 0.`);
  } },
} });

/* ================= III.9.20 Two-way tables ================= */
const TW = [
  { r: ['Grade 7', 'Grade 8'], c: ['Plays', "Doesn't"], what: 'play an instrument', likely: 'play an instrument', ofr: r => `${r} students` },
  { r: ['Has a pet', 'No pet'], c: ['Walks', 'Rides'], what: 'walk to school', likely: 'walk to school', ofr: r => r === 'Has a pet' ? 'students with a pet' : 'students without a pet' },
  { r: ['Breakfast', 'No breakfast'], c: ['Passed', 'Failed'], what: 'passed the quiz', likely: 'have passed the quiz', ofr: r => r === 'Breakfast' ? 'students who ate breakfast' : 'students who skipped breakfast' },
  { r: ['Club A', 'Club B'], c: ['Likes', 'Dislikes'], what: 'like early practice', likely: 'like early practice', ofr: r => `${r} members` },
];
const twTable = (t, a, hide = []) => { const rows = [['', t.c[0], t.c[1], 'Total']];
  const g = [[a[0][0], a[0][1], a[0][0] + a[0][1]], [a[1][0], a[1][1], a[1][0] + a[1][1]], [a[0][0] + a[1][0], a[0][1] + a[1][1], a[0][0] + a[0][1] + a[1][0] + a[1][1]]];
  ['r0', 'r1', 'tot'].forEach((_, i) => rows.push([i < 2 ? t.r[i] : 'Total', ...g[i].map((v, j) => hide.some(([p, q]) => p === i && q === j) ? '?' : String(v))]));
  return { vis: V9.table(rows, { first: 110, cell: 72 }), g }; };
const twName = (t, i, j) => i === 2 && j === 2 ? 'the grand total' : i === 2 ? `${t.c[j]} column total` : j === 2 ? `${t.r[i]} row total` : `${t.r[i]} / ${t.c[j]}`;
E3.skill({ id: 'III.9.20', name: 'Two-way tables', steps: {
  a: { t: 'read counts', g: R => {
    const t = R.pick(TW), a = [[R.int(5, 40), R.int(5, 40)], [R.int(5, 40), R.int(5, 40)]], { vis, g } = twTable(t, a), i = R.int(0, 2), j = R.int(0, 2);
    const q = i < 2 && j < 2 ? `How many are in the "${t.r[i]}" row and the "${t.c[j]}" column?` : i === 2 && j === 2 ? 'How many are counted in all?' : i === 2 ? `How many are "${t.c[j]}" in all?` : `How many are "${t.r[i]}" in all?`;
    return num(`The table counts students by two categories. ${q}`, g[i][j], `Read the cell where the ${i < 2 ? `"${t.r[i]}"` : 'Total'} row meets the ${j < 2 ? `"${t.c[j]}"` : 'Total'} column: ${g[i][j]}.`, { visual: vis });
  } },
  b: { t: 'fill in missing counts', g: R => {
    const t = R.pick(TW), a = [[R.int(5, 40), R.int(5, 40)], [R.int(5, 40), R.int(5, 40)]];
    const hide = R.pick([[[0, 1], [1, 2], [2, 0]], [[0, 0], [1, 1], [2, 2]], [[1, 0], [0, 2], [2, 1]], [[0, 0], [0, 1]], [[1, 1], [2, 0], [0, 2]]]);
    const { vis, g } = twTable(t, a, hide);
    return num('Fill in the missing counts. Rows and columns must add up to their totals.', hide.map(([i, j]) => ({ label: twName(t, i, j), ans: g[i][j] })),
      `Use row and column totals and subtract. ${hide.map(([i, j]) => `${twName(t, i, j)} = ${g[i][j]}`).join('; ')}.`, { visual: vis });
  } },
  c: { t: 'relative frequencies by row or column', g: R => {
    const t = R.pick(TW), byRow = R.bool(0.6);
    // each row (or column) total is 20–80 and its first count is a whole percent of it
    const part = () => tries(() => { const n = R.pick([20, 25, 40, 50, 60, 75, 80]), q = R.int(2, 18) * 5; return [n * q / 100, n - n * q / 100]; }, ([x, y]) => Number.isInteger(x) && x >= 3 && y >= 3);
    const P0 = part(), P1b = part(), a = byRow ? [P0, P1b] : [[P0[0], P1b[0]], [P0[1], P1b[1]]];
    const { vis, g } = twTable(t, a), k = R.int(0, 1);
    if (byRow) { const p = 100 * g[k][0] / g[k][2];
      return num(`What percent of ${t.ofr(t.r[k])} ${t.what}?`, p, `Divide by the row total: ${g[k][0]} ÷ ${g[k][2]} = ${F(p / 100)} = ${p}%. Use the row total, not the grand total ${g[2][2]}.`, { visual: vis }); }
    const p = 100 * g[0][k] / g[2][k];
    return num(`In the "${t.c[k]}" column, what percent are "${t.r[0]}"?`, p, `Divide by the column total: ${g[0][k]} ÷ ${g[2][k]} = ${F(p / 100)} = ${p}%.`, { visual: vis });
  } },
  d: { t: 'spot an association', g: R => {
    const t = R.pick(TW), assoc = R.bool();
    const d = tries(() => { const n0 = R.pick([20, 25, 40, 50]), n1 = R.pick([20, 25, 40, 50, 100]), p0 = R.int(2, 18) * 5, p1 = assoc ? p0 + R.pick([-1, 1]) * R.int(5, 10) * 5 : p0; return { n0, n1, p0, p1 }; },
      ({ n0, n1, p0, p1 }) => p1 > 0 && p1 < 100 && n0 * p0 % 100 === 0 && n1 * p1 % 100 === 0 && n0 !== n1);
    const a = [[d.n0 * d.p0 / 100, d.n0 - d.n0 * d.p0 / 100], [d.n1 * d.p1 / 100, d.n1 - d.n1 * d.p1 / 100]], { vis } = twTable(t, a);
    const hi = d.p0 > d.p1 ? 0 : 1, cntHi = a[0][0] > a[1][0] ? 0 : 1;
    const good = assoc ? `Yes: ${d.p0}% of ${t.ofr(t.r[0])} vs ${d.p1}% of ${t.ofr(t.r[1])}` : `No: ${d.p0}% in both rows`;
    const ds = assoc ? [`No: the percents are about the same`, `Yes: ${t.ofr(t.r[hi ^ 1])} are more likely to ${t.likely}`, `Yes: ${a[cntHi][0]} ${t.ofr(t.r[cntHi])} ${t.what} but only ${a[cntHi ^ 1][0]} ${t.ofr(t.r[cntHi ^ 1])}`].slice(0, cntHi === hi ? 2 : 3)
      : [`Yes: ${a[cntHi][0]} ${t.ofr(t.r[cntHi])} ${t.what} but only ${a[cntHi ^ 1][0]} ${t.ofr(t.r[cntHi ^ 1])}`, `Yes: ${t.ofr(t.r[cntHi ^ 1])} are more likely to ${t.likely}`];
    return choice(R, `Is there an association between the row group and whether they ${t.what.replace('passed', 'pass')}?`, good, ds,
      `Compare row percents: ${a[0][0]} of ${d.n0} = ${d.p0}%, ${a[1][0]} of ${d.n1} = ${d.p1}%. ${assoc ? 'They differ a lot, so there is an association.' : 'They match, so there is no association; raw counts differ only because the rows are different sizes.'}`, { visual: vis });
  } },
} });

})();

