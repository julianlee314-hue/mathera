
/* Mathera · Era II question core
   Shared by every unit file. Works in the browser (window.E2) and in Node (globalThis.E2).

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
     // kind 'choice'→ choices: string[] (plain text OR SVG strings), ans: index of the right one
     explain: string   one or two short sentences shown after answering
   }
   A step generator is  (R, O) => question   where R is the seeded random helper and
   O is the House Rules options object ({coins:'US'|'THB', units:'metric'|'imperial', clock:'12h'|'24h'}).
*/
(function (G) {
  const E2 = G.E2 = G.E2 || {};
  E2.skills = E2.skills || [];
  E2.byId = E2.byId || {};

  /* ---------- registry ---------- */
  // E2.skill({id:'I.1.01', name:'Count objects one by one', steps:{a:{t:'touch and count to 3', g:(R,O)=>q}, b:..., c:..., d:...}})
  // "1 tenths" -> "1 tenth", "1 groups" -> "1 group" in the text of a question (audit II: grammar after numbers made at random)
  const ONE_PL = /(^|[^\d.,\/⁄])1 (ones|tens|hundreds|thousands|tenths|hundredths|thousandths|halves|thirds|fourths|fifths|sixths|sevenths|eighths|ninths|numbers|groups|parts|pieces|steps|jumps|lines|layers|rows|columns|symbols|marks|squares|cubes)\b( are\b)?/g;
  const one = t => typeof t === 'string' && !/^\s*<svg/.test(t) ? t.replace(ONE_PL, (m, pre, w, are) => `${pre}1 ${w === 'halves' ? 'half' : w.slice(0, -1)}${are ? ' is' : ''}`) : t;
  const tidy = q => { if (!q || typeof q !== 'object') return q; q.prompt = one(q.prompt); q.explain = one(q.explain);
    if (Array.isArray(q.choices)) q.choices = q.choices.map(one); if (Array.isArray(q.fields)) q.fields.forEach(f => { if (f && f.label) f.label = one(f.label); }); return q; };
  E2.skill = function (def) {
    if (E2.byId[def.id]) throw new Error('duplicate skill ' + def.id);
    for (const k of 'abcd') { const st = def.steps && def.steps[k]; if (st && typeof st.g === 'function') { const g0 = st.g; st.g = (R, O) => tidy(g0(R, O)); } }
    E2.skills.push(def); E2.byId[def.id] = def; return def;
  };
  E2.tidy = q => tidy(q);
  E2.OPTS = { coins: 'US', units: 'metric', clock: '12h' };

  /* ---------- seeded random ---------- */
  E2.rng = function (seed) {
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
  E2.num = (prompt, ans, explain, extra = {}) => Object.assign({
    prompt, kind: 'num', explain,
    fields: Array.isArray(ans) ? ans.map(a => typeof a === 'object' ? a : { ans: a }) : [{ ans }],
  }, extra);
  // multiple choice: correct + distractors (duplicates of correct or each other are removed), shuffled
  E2.choice = (R, prompt, correct, distractors, explain, extra = {}) => {
    const seen = new Set([String(correct)]); const ds = [];
    for (const d of distractors) { const k = String(d); if (!seen.has(k)) { seen.add(k); ds.push(d); } }
    const all = R.shuffle([correct, ...ds]);
    return Object.assign({ prompt, kind: 'choice', choices: all.map(String), ans: all.findIndex(x => String(x) === String(correct)), explain }, extra);
  };
  // fixed-order choice (e.g. 'odd','even' or '<','=','>') — keeps the given order
  E2.choiceFixed = (prompt, options, correctIndex, explain, extra = {}) =>
    Object.assign({ prompt, kind: 'choice', choices: options.map(String), ans: correctIndex, explain }, extra);
  E2.tf = (prompt, isTrue, explain, extra = {}) => E2.choiceFixed(prompt, ['True', 'False'], isTrue ? 0 : 1, explain, extra);

  /* ---------- number words ---------- */
  const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  E2.words = function words(n) {
    if (n < 20) return ONES[n];
    if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? '-' + ONES[n % 10] : '');
    if (n < 1000) return ONES[Math.floor(n / 100)] + ' hundred' + (n % 100 ? ' ' + words(n % 100) : '');
    if (n === 1000) return 'one thousand';
    throw new Error('words: out of range ' + n);
  };
  E2.ordinal = n => ['zeroth', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth'][n];
  E2.plural = (n, one, many) => n + ' ' + (n === 1 ? one : (many || one + 's'));

  /* ---------- palette ---------- */
  const C = E2.C = {
    ink: '#15171C', muted: '#646A75', line: '#C9CDD4', faint: '#EEF0F3', paper: '#FFFFFF',
    red: '#E0735A', amber: '#E2A13B', olive: '#9BAE45', teal: '#3E9D8F', blue: '#4A8FD1', violet: '#8A6CC9', pink: '#C9628E',
  };
  C.set = [C.red, C.blue, C.amber, C.teal, C.violet, C.olive, C.pink];
  E2.colorName = { [C.red]: 'red', [C.blue]: 'blue', [C.amber]: 'yellow', [C.teal]: 'green', [C.violet]: 'purple', [C.olive]: 'olive', [C.pink]: 'pink' };

  /* ---------- SVG visuals ---------- */
  const V = E2.V = {};
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
      const R = o.R || E2.rng(n * 7919 + 1), W = o.w || 300, H = o.h || 160;
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
  E2.gcd = gcd; E2.lcm = (a, b) => a / gcd(a, b) * b;
  E2.reduce = (n, d) => { const g = gcd(n, d); return [n / g, d / g]; };
  // parse typed text → {n, d, kind} (exact rational) or null. Accepts 12 · 1,200 · 2.5 · .5 · 3/4 · 1 3/4
  E2.parse = function (raw) {
    let s = String(raw).trim().replace(/−/g, '-').replace(/,(?=\d{3}\b)/g, '').replace(/\s+/g, ' ');
    let m;
    if ((m = /^(\d+)$/.exec(s))) return { n: +m[1], d: 1, kind: 'int' };
    if ((m = /^(\d*)\.(\d+)$/.exec(s))) { const d = 10 ** m[2].length; return { n: (+(m[1] || 0)) * d + +m[2], d, kind: 'dec' }; }
    if ((m = /^(\d+)\.$/.exec(s))) return { n: +m[1], d: 1, kind: 'dec' };
    if ((m = /^(\d+)\s*\/\s*(\d+)$/.exec(s))) { if (+m[2] === 0) return null; return { n: +m[1], d: +m[2], kind: 'frac', a: +m[1], b: +m[2] }; }
    if ((m = /^(\d+) (\d+)\s*\/\s*(\d+)$/.exec(s))) { if (+m[3] === 0) return null; return { n: +m[1] * +m[3] + +m[2], d: +m[3], kind: 'mixed', w: +m[1], a: +m[2], b: +m[3] }; }
    return null;
  };
  // check one field against typed text → true/false (null if unreadable)
  E2.check = function (f, raw) {
    const p = E2.parse(raw); if (!p) return null;
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
  E2.show = function (f) {
    if (!f.frac) return E2.fmt(f.ans);
    const [n, d] = f.frac, form = f.form || 'any', [rn, rd] = E2.reduce(n, d);
    const simple = rd === 1 ? String(rn) : rn > rd ? `${Math.floor(rn / rd)} ${rn % rd}/${rd}` : `${rn}/${rd}`;
    if (form === 'improper') return rd === 1 ? String(rn) : `${rn}/${rd}`;
    if (rd === 1) return String(rn);
    if (form === 'any') { const raw = d === 1 ? String(n) : `${n}/${d}`; return raw === simple ? raw : `${raw} = ${simple}`; }
    if (form === 'simplest' && rn > rd) return `${rn}/${rd} = ${simple}`;
    return simple;
  };
  // number formatting: thousands commas, up to 3 decimals, no float noise
  E2.fmt = function (x, o = {}) {
    const neg = x < 0; x = Math.abs(x);
    let s = o.dp !== undefined ? x.toFixed(o.dp) : String(Math.round(x * 1000) / 1000);
    let [i, f] = s.split('.'); if (o.commas !== false && i.length > 4) i = i.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return (neg ? '−' : '') + i + (f ? '.' + f : '');
  };
  E2.frac = (n, d, form) => ({ frac: [n, d], form: form || 'any' });
  // HTML for a stacked fraction inside prompts/choices: E2.fh(3,4) → <span class="fr">…</span>; plain fallback a/b in tests
  E2.fh = (n, d, w) => `${w ? w + ' ' : ''}<span class="fr"><sup>${n}</sup>⁄<sub>${d}</sub></span>`;

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
  E2.validate = function (q, where) {
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
        if (f.frac) {
          const [n, d] = f.frac; if (!Number.isInteger(n) || !Number.isInteger(d) || d <= 0 || n < 0) bad('bad frac ' + f.frac);
          if (f.form && !['any', 'simplest', 'mixed', 'improper'].includes(f.form)) bad('bad form ' + f.form);
          if ('ans' in f) bad('field has both ans and frac');
        } else {
          if (typeof f.ans !== 'number' || !isFinite(f.ans)) bad('answer not a number ' + f.ans);
          if (f.ans < 0 || f.ans > 10000000) bad('answer out of range ' + f.ans);
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

/* Era II · Unit II.1 Place value to millions */
(function(){ const {num, choice, choiceFixed, tf, fmt, V, C} = E2;

/* ---------- helpers (prefix P1) ---------- */
const P1 = {};
const PLACE = ['ones', 'tens', 'hundreds', 'thousands', 'ten thousands', 'hundred thousands', 'millions'];
const PV = [1, 10, 100, 1000, 10000, 100000, 1000000];
const HEAD = [['', 'ones'], ['', 'tens'], ['', 'hundreds'], ['', 'thousands'], ['ten', 'thousands'], ['hundred', 'thousands'], ['', 'millions']];
const dig = (n, p) => Math.floor(n / PV[p]) % 10;
const len = n => String(n).length;
// commas from 1,000 up (this unit is about reading big numbers)
const F = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const rN = (R, d) => R.int(10 ** (d - 1), 10 ** d - 1);
const gen = (f, ok) => { for (let i = 0; i < 5000; i++) { const x = f(); if (ok(x)) return x; } throw new Error('gen failed'); };
const rnd = (n, p) => { const r = n % p; return r * 2 >= p ? n - r + p : n - r; };
const placeName = p => ({ 10: 'ten', 100: 'hundred', 1000: 'thousand', 10000: 'ten thousand', 100000: 'hundred thousand' })[p];
// number words to 1,000,000
P1.words = n => {
  if (n === 1000000) return 'one million';
  const th = Math.floor(n / 1000), r = n % 1000; let s = '';
  if (th) s = E2.words(th) + ' thousand';
  if (r) s += (th ? ' ' : '') + E2.words(r);
  return s || 'zero';
};
const distinctDigits = (R, L) => gen(() => rN(R, L), n => new Set(String(n)).size === L);
const expanded = n => { const s = String(n), out = []; for (let k = 0; k < s.length; k++) if (s[k] !== '0') out.push(F(+s[k] * PV[s.length - 1 - k])); return out.join(' + '); };

// place-value chart. rows: numbers, or arrays of cell strings (left to right). o.places, o.hl (place index to tint)
P1.chart = function (rows, o = {}) {
  const np = o.places || Math.max(...rows.map(r => typeof r === 'number' ? len(r) : r.length));
  const cw = 78, hh = 44, rh = 46, W = np * cw + 4, H = hh + rows.length * rh + 4;
  let body = '';
  for (let i = 0; i < np; i++) {
    const p = np - 1 - i, x = 2 + i * cw;
    const fill = o.hl === p ? '#FBE9C8' : (p >= 3 && p <= 5 ? C.faint : C.paper);
    body += `<rect x="${x}" y="2" width="${cw}" height="${H - 4}" fill="${fill}" stroke="${C.line}" stroke-width="1.5"/>`;
    if (HEAD[p][0]) body += V.text(x + cw / 2, 15, HEAD[p][0], { size: 12, fill: C.muted });
    body += V.text(x + cw / 2, HEAD[p][0] ? 32 : 24, HEAD[p][1], { size: 12, fill: C.muted });
  }
  body += `<line x1="2" y1="${hh}" x2="${W - 2}" y2="${hh}" stroke="${C.line}" stroke-width="1.5"/>`;
  rows.forEach((r, j) => {
    const cells = typeof r === 'number' ? String(r).padStart(np, ' ').split('') : r;
    cells.forEach((c, i) => {
      const x = 2 + i * cw + cw / 2, y = hh + j * rh + rh / 2;
      if (c === '?') body += `<rect x="${x - 16}" y="${y - 17}" width="32" height="34" rx="6" fill="${C.amber}"/>` + V.text(x, y, '?', { size: 20, weight: 700 });
      else if (c.trim()) body += V.text(x, y, c, { size: 26, weight: 600 });
    });
  });
  return V.svg(W, H, body, 'place value chart');
};

// k hundred flats in a row
P1.flats = function (k) {
  const s = 44, g = 8; let body = '';
  for (let i = 0; i < k; i++) {
    const x = 2 + i * (s + g);
    body += `<rect x="${x}" y="2" width="${s}" height="${s}" fill="${C.teal}" stroke="${C.ink}" stroke-width="1.2"/>`;
    for (let j = 1; j < 10; j++) body += `<line x1="${x + j * s / 10}" y1="3" x2="${x + j * s / 10}" y2="${s + 1}" stroke="#fff" stroke-opacity=".6"/><line x1="${x + 1}" y1="${2 + j * s / 10}" x2="${x + s - 1}" y2="${2 + j * s / 10}" stroke="#fff" stroke-opacity=".6"/>`;
  }
  return V.svg(k * (s + g) - g + 4, s + 4, body, `${k} hundred flats`);
};

// column sum. o.rows (numbers), o.shift (columns moved left per row), o.op, o.ans (string: digit, '?', ' '), o.carry {col:'1'|'?'}
P1.col = function (o) {
  const rows = o.rows.map(String), sh = o.shift || rows.map(() => 0), cw = 30, rh = 36;
  const ans = o.ans != null ? String(o.ans) : null;
  const ncol = Math.max(...rows.map((r, i) => r.length + sh[i]), ans ? ans.length : 0) + 1;
  const W = ncol * cw + 16, top = o.carry ? 28 : 6;
  const X = c => W - 8 - (c + 0.5) * cw;
  let body = '';
  if (o.carry) for (const [c, s] of Object.entries(o.carry)) {
    if (s === '?') body += `<rect x="${X(+c) - 10}" y="3" width="20" height="22" rx="4" fill="${C.amber}"/>` + V.text(X(+c), 14, '?', { size: 14, weight: 700 });
    else body += V.text(X(+c), 14, s, { size: 15, fill: C.red, weight: 700 });
  }
  rows.forEach((r, i) => {
    const y = top + i * rh + rh / 2;
    for (let k = 0; k < r.length; k++) body += V.text(X(r.length - 1 - k + sh[i]), y, r[k], { size: 24 });
  });
  body += V.text(X(ncol - 1), top + (rows.length - 1) * rh + rh / 2, o.op, { size: 24 });
  const ly = top + rows.length * rh + 2;
  body += `<line x1="6" y1="${ly}" x2="${W - 6}" y2="${ly}" stroke="${C.ink}" stroke-width="2"/>`;
  if (ans) for (let k = 0; k < ans.length; k++) {
    const ch = ans[k], x = X(ans.length - 1 - k), y = ly + 22;
    if (ch === '?') body += `<rect x="${x - 12}" y="${y - 16}" width="24" height="32" rx="5" fill="${C.amber}"/>` + V.text(x, y, '?', { size: 20, weight: 700 });
    else if (ch !== ' ') body += V.text(x, y, ch, { size: 24 });
  }
  return V.svg(W, ly + (ans ? 44 : 10), body, 'column sum');
};

// number line lo..hi with n ticks, ends and midpoint labelled, dot at v
P1.nline = function (lo, hi, v) {
  const W = 520, pad = 36, y = 44, X = x => pad + (x - lo) / (hi - lo) * (W - 2 * pad), mid = (lo + hi) / 2, st = (hi - lo) / 10;
  let body = `<line x1="${pad - 12}" y1="${y}" x2="${W - pad + 12}" y2="${y}" stroke="${C.ink}" stroke-width="2"/>`;
  for (let k = 0; k <= 10; k++) { const t = lo + k * st, big = k === 0 || k === 5 || k === 10; body += `<line x1="${X(t)}" y1="${y - (big ? 11 : 6)}" x2="${X(t)}" y2="${y + (big ? 11 : 6)}" stroke="${C.ink}" stroke-width="${big ? 2.5 : 1.5}"/>`; }
  [lo, mid, hi].forEach(t => body += V.text(X(t), y + 28, F(t), { size: 15, weight: t === mid ? 500 : 700, fill: t === mid ? C.muted : C.ink }));
  body += V.dot(X(v), y, 8, C.red) + V.text(X(v), y - 22, F(v), { size: 15, weight: 700, fill: C.red });
  return V.svg(W, 84, body, 'number line');
};

/* ---------- column arithmetic helpers ---------- */
const carriesOf = nums => { const L = Math.max(...nums.map(len)); let c = 0; const out = []; for (let p = 0; p < L; p++) { const s = nums.reduce((a, n) => a + dig(n, p), 0) + c; c = Math.floor(s / 10); out.push(c); } return out; };
const borrowsOf = (a, b) => { let bin = 0; const out = []; for (let p = 0; p < len(a); p++) { const t = dig(a, p) - bin, bd = dig(b, p); bin = t < bd ? 1 : 0; out.push(bin); } return out; };
const same = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
const addExplain = nums => {
  const L = Math.max(...nums.map(len)); let c = 0; const parts = [];
  for (let p = 0; p < L; p++) {
    const ds = nums.filter(n => len(n) > p).map(n => dig(n, p)), s = ds.reduce((a, b) => a + b, 0) + c;
    parts.push(`${PLACE[p]} ${c ? c + ' + ' : ''}${ds.join(' + ')} = ${s}${s >= 10 ? ' (carry ' + Math.floor(s / 10) + ')' : ''}`);
    c = Math.floor(s / 10);
  }
  const tot = nums.reduce((a, b) => a + b, 0);
  return parts.length > 4 ? (carriesOf(nums).some(x => x) ? `Add each column from the ones, carrying when a column makes 10 or more. The total is ${F(tot)}.` : `Add each column from the ones; no column makes 10 or more, so there is nothing to carry. The total is ${F(tot)}.`) : `${parts.join(', ')}. So the answer is ${F(tot)}.`.replace(/^./, m => m.toUpperCase());
};
const subExplain = (a, b) => {
  let bin = 0; const parts = [];
  for (let p = 0; p < len(a); p++) {
    const t = dig(a, p) - bin, bd = dig(b, p);
    if (t < bd) { parts.push(`${PLACE[p]} regroup: ${t + 10} − ${bd} = ${t + 10 - bd}`); bin = 1; }
    else { if (p < len(b) || t > 0 || p < len(a) - 1) parts.push(`${PLACE[p]} ${t} − ${bd} = ${t - bd}`); bin = 0; }
  }
  return parts.length > 4 ? `Subtract each column from the ones, regrouping when the top digit is too small. The answer is ${F(a - b)}.` : `${parts.join(', ')}. So the answer is ${F(a - b)}.`.replace(/^./, m => m.toUpperCase());
};
// ask: whole answer (mostly), one answer digit, or a carry
const addQ = (R, nums, o = {}) => {
  const tot = nums.reduce((a, b) => a + b, 0), cs = carriesOf(nums), ex = addExplain(nums), r = R.f();
  const cpos = cs.map((c, i) => c ? i : -1).filter(i => i >= 0 && i + 1 < Math.max(...nums.map(len)));
  if (o.carry && cpos.length && r < 0.2) {
    const p = R.pick(cpos);
    return num(`What number do you carry into the ${PLACE[p + 1]} column?`, cs[p], ex, { visual: P1.col({ rows: nums, op: '+', carry: { [p + 1]: '?' } }) });
  }
  if (r < 0.4) {
    const p = R.int(0, len(tot) - 1), s = String(tot).split('').map((d, k) => len(tot) - 1 - k === p ? '?' : ' ').join('');
    return num(`What digit goes in the ${PLACE[p]} place of the answer?`, dig(tot, p), ex, { visual: P1.col({ rows: nums, op: '+', ans: s }) });
  }
  return num(`Add: ${nums.map(F).join(' + ')}`, tot, ex, { visual: P1.col({ rows: nums, op: '+' }) });
};
const subQ = (R, a, b) => {
  const ex = subExplain(a, b), d = a - b;
  if (R.bool(0.3)) {
    const p = R.int(0, len(d) - 1), s = String(d).split('').map((x, k) => len(d) - 1 - k === p ? '?' : ' ').join('');
    return num(`What digit goes in the ${PLACE[p]} place of the answer?`, dig(d, p), ex, { visual: P1.col({ rows: [a, b], op: '−', ans: s }) });
  }
  return num(`Subtract: ${F(a)} − ${F(b)}`, d, ex, { visual: P1.col({ rows: [a, b], op: '−' }) });
};
// line-up question: a long, b short
const lineUpQ = (R, a, b, op) => {
  const v = R.int(0, 2), res = op === '+' ? a + b : a - b;
  if (v === 0) {
    const L = len(a), lb = len(b);
    const good = P1.col({ rows: [a, b], op });
    const left = P1.col({ rows: [a, b], op, shift: [0, L - lb] });
    const one = P1.col({ rows: [a, b], op, shift: [0, 1] });
    return choice(R, `Which shows ${F(a)} ${op} ${F(b)} lined up correctly?`, good, [left, one], `Line up the ones digits on the right: ${b % 10} goes under ${a % 10}.`);
  }
  if (v === 1 && new Set(String(b)).size === len(b)) {
    const s = String(b), k = gen(() => R.int(0, s.length - 1), k => s.split(s[k]).length === 2), p = s.length - 1 - k;
    return num(`Line up ${F(a)} ${op} ${F(b)}. The ${s[k]} of ${F(b)} goes under which digit of ${F(a)}?`, dig(a, p), `The ${s[k]} is in the ${PLACE[p]} place, so it goes under the ${PLACE[p]} digit of ${F(a)}, which is ${dig(a, p)}.`);
  }
  return num(`${op === '+' ? 'Add' : 'Subtract'}: ${F(a)} ${op} ${F(b)}`, res, (op === '+' ? addExplain([a, b]) : subExplain(a, b)).replace(/^/, 'Line up the ones first. '));
};

/* ---------- II.1.01 ---------- */
E2.skill({ id: 'II.1.01', name: 'Thousands', steps: {
  a: { t: '1,000 as ten hundreds', g: (R) => {
    const v = R.int(0, 4);
    if (v === 0) { const k = R.int(2, 8); return num(`Here are ${10 - k} hundreds. How many more hundreds make 1,000?`, k, `10 hundreds make 1,000, and ${10 - k} + ${k} = 10.`, { visual: P1.flats(10 - k) }); }
    if (v === 1) { const k = R.int(11, 99); return num(`${k} hundreds = ?`, k * 100, `10 hundreds make 1,000, so ${k} hundreds = ${F(k * 100)}.`); }
    if (v === 2) { const k = R.int(1, 9) * 1000 + R.pick([0, R.int(1, 9) * 100]); return num(`How many hundreds make ${F(k)}?`, k / 100, `Each 1,000 is 10 hundreds, so ${F(k)} is ${k / 100} hundreds.`); }
    if (v === 3) { const th = R.int(1, 9), [u, uv] = R.pick([['hundreds', 100], ['tens', 10]]); return num(`How many ${u} make ${F(th * 1000)}?`, th * 1000 / uv, `1,000 is ${1000 / uv} ${u}, so ${F(th * 1000)} is ${th} × ${1000 / uv} = ${th * 1000 / uv} ${u}.`); }
    const k = R.int(2, 9); return num(`${k * 10} hundreds = how many thousands?`, k, `10 hundreds make 1 thousand, so ${k * 10} hundreds make ${k} thousands.`);
  } },
  b: { t: 'read 4-digit numbers', g: (R) => {
    const n = distinctDigits(R, 4), v = R.int(0, 3);
    if (v === 0) { const p = R.int(0, 3), d = dig(n, p); return num(`What is the value of the digit ${d} in ${F(n)}?`, d * PV[p], `The ${d} is in the ${PLACE[p]} place, so it is worth ${F(d * PV[p])}.`); }
    if (v === 1) { const p = R.int(0, 3); return num(`Which digit is in the ${PLACE[p]} place of ${F(n)}?`, dig(n, p), `${F(n)}: thousands ${dig(n, 3)}, hundreds ${dig(n, 2)}, tens ${dig(n, 1)}, ones ${dig(n, 0)}.`); }
    if (v === 2) { const m = R.bool() ? n : n - dig(n, 1) * 10; return num('What number does the chart show?', m, `${dig(m, 3)} thousand${dig(m, 3) === 1 ? '' : 's'}, ${dig(m, 2)} hundred${dig(m, 2) === 1 ? '' : 's'}, ${dig(m, 1)} ten${dig(m, 1) === 1 ? '' : 's'} and ${dig(m, 0)} one${dig(m, 0) === 1 ? '' : 's'} make ${F(m)}.`, { visual: P1.chart([m]) }); }
    return num(`Read ${F(n)}. Fill in each place.`, [3, 2, 1, 0].map(p => ({ label: PLACE[p], ans: dig(n, p) })), `${F(n)} = ${expanded(n)}.`);
  } },
  c: { t: 'write them', g: (R) => {
    const n = gen(() => rN(R, 4), n => String(n).slice(1).includes('0') || R.bool(0.3)), v = R.int(0, 2);
    const parts = [3, 2, 1, 0].map(p => `${dig(n, p)} ${PLACE[p]}`);
    if (v === 0) return num(`Write the number: ${parts.join(', ')}.`, n, `Put each digit in its place: ${F(n)}.`);
    if (v === 1) return num(`Write in digits: <b>${P1.words(n)}</b>`, n, `${P1.words(n)} = ${expanded(n)} = ${F(n)}.`);
    const nz = [3, 2, 1, 0].filter(p => dig(n, p)).map(p => `${dig(n, p)} ${PLACE[p]}`);
    return num(`Write the number: ${R.shuffle(nz).join(', ')}.`, n, `Order the places: ${[3, 2, 1, 0].map(p => dig(n, p) + ' ' + PLACE[p]).join(', ')} is ${F(n)}.`);
  } },
  d: { t: 'expanded form', g: (R) => {
    const n = gen(() => rN(R, 4), n => R.bool(0.5) || String(n).includes('0')), v = R.int(0, 2);
    if (v === 0) return num(`${expanded(n)} = ?`, n, `Put each part in its place: ${F(n)}.`);
    if (v === 1) {
      const ps = [3, 2, 1, 0].filter(p => dig(n, p)); if (ps.length < 3) return num(`${expanded(n)} = ?`, n, `Put each part in its place: ${F(n)}.`);
      const p = R.pick(ps.slice(1)), terms = ps.map(q => q === p ? '?' : F(dig(n, q) * PV[q]));
      return num(`${terms.join(' + ')} = ${F(n)}`, dig(n, p) * PV[p], `The ${PLACE[p]} digit of ${F(n)} is ${dig(n, p)}, worth ${dig(n, p) * PV[p]}.`);
    }
    const s = String(n), bad1 = s.split('').map((d, k) => d === '0' ? null : +d * PV[Math.max(0, s.length - 2 - k)]).filter(x => x !== null && x > 0);
    const w1 = bad1.map(F).join(' + '), w2 = s.split('').filter(d => d !== '0').join(' + '), w3 = s.split('').map((d, k) => +d * PV[s.length - 1 - k]).map(F).join(' + ');
    return choice(R, `Which is the expanded form of ${F(n)}?`, expanded(n), [w1, w2, w3 !== expanded(n) ? w3 : expanded((() => { for (let i = 0; i < 200; i++) { const m = +R.shuffle(s.split('')).join(''); if (m !== n && m >= 1000) return m; } return n * 10; })())].filter(x => x), `Each digit times its place value: ${expanded(n)}.`);
  } },
} });

/* ---------- II.1.02 ---------- */
E2.skill({ id: 'II.1.02', name: 'Numbers to a million', steps: {
  a: { t: 'ten thousands', g: (R) => {
    const v = R.int(0, 3);
    if (v === 0) { const n = distinctDigits(R, 5), p = R.pick([4, 4, 3]), d = dig(n, p); return num(`What is the value of the digit ${d} in ${F(n)}?`, d * PV[p], `The ${d} is in the ${PLACE[p]} place, so it is worth ${F(d * PV[p])}.`, { visual: P1.chart([n]) }); }
    if (v === 1) { const k = R.int(2, 9), extra = R.pick([0, R.int(1, 9) * 1000]); return num(`${k} ten thousands and ${extra / 1000} thousands = ?`, k * 10000 + extra, `${k} × 10,000 = ${F(k * 10000)}, plus ${F(extra)} is ${F(k * 10000 + extra)}.`); }
    if (v === 2) { const n = R.int(10000, 89999); return num(`What is 10,000 more than ${F(n)}?`, n + 10000, `Only the ten thousands digit goes up by 1: ${F(n + 10000)}.`); }
    const n = R.int(1, 9) * 10000 + R.int(0, 9999); return num(`How many whole ten thousands are in ${F(n)}?`, Math.floor(n / 10000), `The ten thousands digit of ${F(n)} is ${Math.floor(n / 10000)}.`);
  } },
  b: { t: 'hundred thousands', g: (R) => {
    const v = R.int(0, 3);
    if (v === 0) { const n = distinctDigits(R, 6), p = R.pick([5, 5, 4]), d = dig(n, p); return num(`What is the value of the digit ${d} in ${F(n)}?`, d * PV[p], `The ${d} is in the ${PLACE[p]} place, so it is worth ${F(d * PV[p])}.`, { visual: P1.chart([n]) }); }
    if (v === 1) { const k = R.int(2, 9); return num(`${k} hundred thousands = ?`, k * 100000, `One hundred thousand is 100,000, so ${k} of them make ${F(k * 100000)}.`); }
    if (v === 2) { const n = R.int(100000, 899999); return num(`What is 100,000 more than ${F(n)}?`, n + 100000, `Only the hundred thousands digit goes up by 1: ${F(n + 100000)}.`); }
    const [q, a] = R.pick([['ten thousands make 100,000', 10], ['hundred thousands make 1,000,000', 10], ['thousands make 100,000', 100], ['ten thousands make 1,000,000', 100]]);
    if (R.bool()) return num(`How many ${q}?`, a, `Each place is 10 times the one to its right, so the answer is ${a}.`);
    const k = R.int(2, 9); return num(`How many ten thousands make ${F(k * 100000)}?`, k * 10, `100,000 is 10 ten thousands, so ${F(k * 100000)} is ${k * 10} ten thousands.`);
  } },
  c: { t: 'read with commas', g: (R) => {
    const v = R.int(0, 2), L = R.pick([5, 6, 6, 7]);
    const n = L === 7 ? 1000000 : gen(() => rN(R, L), n => String(n).includes('0') || R.bool(0.4));
    if (v === 0 && L !== 7) {
      const s = String(n), bad = [s.slice(0, 3) + ',' + s.slice(3), s.slice(0, s.length - 2) + ',' + s.slice(-2), s.slice(0, 1) + ',' + s.slice(1)].filter(x => x !== F(n));
      return choice(R, `Where do the commas go in ${s}?`, F(n), bad, `Count 3 digits from the right, then put a comma: ${F(n)}.`);
    }
    if (v === 1 || L === 7) { const m = L === 7 ? rN(R, 6) : n; return num(`How many whole thousands are in ${F(m)}?`, Math.floor(m / 1000), `The digits before the comma tell the thousands: ${F(m)} is ${F(Math.floor(m / 1000))} thousand ${m % 1000}.`); }
    const p = R.int(0, L - 1); return num(`In ${F(n)}, which digit is in the ${PLACE[p]} place?`, dig(n, p), `Read right to left: ones, tens, hundreds, then thousands after the comma. The ${PLACE[p]} digit is ${dig(n, p)}.`);
  } },
  d: { t: 'write in words', g: (R) => {
    const L = R.pick([5, 6, 6]);
    const n = gen(() => rN(R, L), n => { const z = String(n).slice(1).split('').filter(d => d === '0').length; return z >= 1 && z <= 2; });
    if (R.bool(0.45)) return num(`Write in digits: <b>${P1.words(n)}</b>`, n, `${P1.words(n).replace(' thousand', ' thousand,')} → ${F(n)}.`);
    const s = String(n), vars = new Set();
    for (let k = 1; k < s.length - 1; k++) { const t = s.split(''); [t[k], t[k + 1]] = [t[k + 1], t[k]]; if (t[0] !== '0' && t.join('') !== s) vars.add(+t.join('')); }
    const z = s.indexOf('0', 1); if (z > 0) vars.add(+(s.slice(0, z) + s.slice(z + 1)));
    const ds = R.shuffle([...vars].filter(x => x !== n && x > 0)).slice(0, 3).map(P1.words);
    return choice(R, `Which is <b>${F(n)}</b> in words?`, P1.words(n), ds, `${F(n)} is ${F(Math.floor(n / 1000))} thousand and ${n % 1000}: ${P1.words(n)}.`);
  } },
} });

/* ---------- II.1.03 ---------- */
E2.skill({ id: 'II.1.03', name: 'Place value patterns', steps: {
  a: { t: 'each place is 10 times the next', g: (R) => {
    const v = R.int(0, 2);
    if (v === 0) { const d = R.int(1, 9), L = R.int(3, 5), n = +String(d).repeat(L), p = R.int(1, L - 1);
      return num(`In ${F(n)}, the ${d} in the ${PLACE[p]} place is worth how many times the ${d} to its right?`, 10, `${F(d * PV[p])} is 10 times ${F(d * PV[p - 1])}.`, { visual: P1.chart([n]) }); }
    if (v === 1) { const p = R.int(1, 5), q = R.bool(0.7) ? p - 1 : Math.max(0, p - 2); return num(`1 ${placeName(PV[p]) || PLACE[p]} = how many ${PLACE[q]}?`, PV[p] / PV[q], `${F(PV[p])} ÷ ${F(PV[q])} = ${PV[p] / PV[q]}.`); }
    const d = R.int(2, 9), p = R.int(1, 4), k = R.pick([1, 1, 2]), q = p - k + 0 < 0 ? 0 : p - k;
    return num(`The ${d} in ${F(d * PV[p])} is worth how many times the ${d} in ${F(d * PV[q])}?`, PV[p - q], `${F(d * PV[p])} ÷ ${F(d * PV[q])} = ${PV[p - q]}. Each place to the left is 10 times bigger.`);
  } },
  b: { t: '× 10 shifts digits left', g: (R) => {
    const v = R.int(0, 2), n = gen(() => R.int(12, 9999), n => n % 10 !== 0);
    if (v === 0) return num(`${F(n)} × 10 = ?`, n * 10, `Each digit moves one place left, and 0 fills the ones: ${F(n * 10)}.`, { visual: P1.chart([n, String(n * 10).split('').map(() => '?')], { places: len(n * 10) }) });
    if (v === 1) { const m = gen(() => R.int(12, 999), m => m % 10 !== 0); return num(`${F(m)} × 100 = ?`, m * 100, `× 100 moves each digit two places left: ${F(m * 100)}.`); }
    return num(`? × 10 = ${F(n * 10)}`, n, `Undo × 10 by moving each digit one place right: ${F(n)}.`);
  } },
  c: { t: '÷ 10 shifts right', g: (R) => {
    const v = R.int(0, 2), n = gen(() => R.int(12, 9999), n => n % 10 !== 0);
    if (v === 0) return num(`${F(n * 10)} ÷ 10 = ?`, n, `Each digit moves one place right: ${F(n)}.`, { visual: P1.chart([n * 10, [' ', ...String(n).split('').map(() => '?')]], { places: len(n * 10) }) });
    if (v === 1) { const m = gen(() => R.int(12, 9999), m => m % 10 !== 0); return num(`${F(m * 100)} ÷ 100 = ?`, m, `÷ 100 moves each digit two places right: ${F(m)}.`); }
    return num(`? ÷ 10 = ${F(n)}`, n * 10, `Undo ÷ 10 by moving each digit one place left: ${F(n * 10)}.`);
  } },
  d: { t: 'zeros in the middle', g: (R) => {
    const v = R.int(0, 2), L = R.int(4, 6);
    const n = gen(() => rN(R, L), n => { const m = String(n).slice(1, -1); return m.includes('0') && !/^0+$/.test(m); });
    if (v === 0) { const zs = String(n).split('').map((d, k) => d === '0' ? L - 1 - k : -1).filter(p => p > 0); const p = R.pick(zs);
      return num(`Which digit is in the ${PLACE[p]} place of ${F(n)}?`, 0, `The ${PLACE[p]} digit of ${F(n)} is 0: a 0 holds that place.`); }
    const ps = [...Array(L).keys()].reverse().filter(p => dig(n, p)), desc = ps.map(p => `${dig(n, p)} ${PLACE[p]}`).join(', ');
    if (v === 1) return num(`Write the number: ${desc}.`, n, `Put 0 in any empty place: ${F(n)}.`);
    const s = String(n).replace(/0/g, ''), ds = [+s, +(s + '0'.repeat(L - s.length)), +String(n).split('').reverse().join('')];
    return choice(R, `Which number is ${desc}?`, F(n), ds.filter(x => x !== n && x > 0).map(F), `Each empty place gets a 0: ${F(n)}.`);
  } },
} });

/* ---------- II.1.04 ---------- */
const closeSet = (R, L, k) => { // k distinct L-digit numbers sharing leading digits
  const share = R.int(1, L - 2), base = rN(R, share), out = new Set();
  while (out.size < k) out.add(base * PV[L - share] + R.int(0, PV[L - share] - 1));
  return [...out];
};
E2.skill({ id: 'II.1.04', name: 'Compare and order large numbers', steps: {
  a: { t: '4-digit', g: (R) => {
    const xs = closeSet(R, 4, R.pick([2, 3, 4])), big = R.bool(0.6), t = big ? Math.max(...xs) : Math.min(...xs);
    return choice(R, `Which number is ${big ? 'greatest' : 'least'}?`, F(t), xs.filter(x => x !== t).map(F), `The thousands match, so compare from the left until a digit differs. ${F(t)} is the ${big ? 'greatest' : 'least'}.`);
  } },
  b: { t: '6-digit', g: (R) => {
    const xs = closeSet(R, 6, 3), big = R.bool(0.6);
    if (R.bool(0.35)) xs.push(gen(() => rN(R, 5), x => String(x)[0] >= String(xs[0])[0]));
    const t = big ? Math.max(...xs) : Math.min(...xs);
    return choice(R, `Which number is ${big ? 'greatest' : 'least'}?`, F(t), xs.filter(x => x !== t).map(F), `More digits means a bigger number; with the same number of digits, compare from the left. ${F(t)} is the ${big ? 'greatest' : 'least'}.`);
  } },
  c: { t: 'order a list', g: (R) => {
    const L = R.pick([4, 5, 6]), xs = closeSet(R, L, 3); xs.push(gen(() => rN(R, L - 1), x => String(x)[0] > String(xs[0])[0] || R.bool(0.3)));
    const up = R.bool(), asc = xs.slice().sort((a, b) => a - b), right = up ? asc : asc.slice().reverse();
    const lex = xs.slice().sort((a, b) => String(a) < String(b) ? -1 : 1), lexO = up ? lex : lex.slice().reverse();
    const sw = right.slice(); [sw[1], sw[2]] = [sw[2], sw[1]];
    const show = a => a.map(F).join(up ? ' &lt; ' : ' &gt; ');
    return choice(R, `Order from ${up ? 'least to greatest' : 'greatest to least'}.`, show(right), [show(lexO), show(sw), show(right.slice().reverse())], `Count digits first, then compare from the left: ${show(right)}.`);
  } },
  d: { t: 'with >, < and =', g: (R) => {
    const L = R.pick([4, 5, 6]), x = gen(() => rN(R, L), n => String(n).slice(1).includes('0') && String(n).replace(/0/g, '').length >= 2), v = R.int(0, 2);
    let y = x;
    if (v > 0) { const s = String(x).split(''); const k = gen(() => R.int(1, L - 2), k => s[k] !== s[k + 1]); [s[k], s[k + 1]] = [s[k + 1], s[k]]; y = +s.join(''); }
    const left = R.bool(0.6) ? expanded(x) : F(x), rightS = F(y);
    const sw = R.bool(); const [A, B, a, b] = sw ? [rightS, left, y, x] : [left, rightS, x, y];
    const idx = a < b ? 0 : a === b ? 1 : 2;
    return choiceFixed(`Which sign goes in the box?<br><b>${A} ☐ ${B}</b>`, ['&lt;', '=', '&gt;'], idx, `${F(a)} ${['is less than', 'equals', 'is greater than'][idx]} ${F(b)}.`);
  } },
} });

/* ---------- II.1.05 ---------- */
E2.skill({ id: 'II.1.05', name: 'Round to tens and hundreds', steps: {
  a: { t: 'to 10', g: (R) => {
    const n = gen(() => R.int(11, 999), n => n % 10 !== 0 && n % 10 !== 5), r = rnd(n, 10);
    return num(`Round ${F(n)} to the nearest 10.`, r, `${F(n)} is between ${F(n - n % 10)} and ${F(n - n % 10 + 10)}. The ones digit is ${n % 10}, so it rounds ${r > n ? 'up' : 'down'} to ${F(r)}.`);
  } },
  b: { t: 'to 100', g: (R) => {
    const n = gen(() => R.int(101, 4999), n => n % 100 !== 0 && n % 100 !== 50 && (n < 1000 || R.bool(0.3))), r = rnd(n, 100);
    return num(`Round ${F(n)} to the nearest 100.`, r, `${F(n)} is between ${F(n - n % 100)} and ${F(n - n % 100 + 100)}. The tens digit is ${dig(n, 1)}, so it rounds ${r > n ? 'up' : 'down'} to ${F(r)}.`);
  } },
  c: { t: 'the halfway rule', g: (R) => {
    const v = R.int(0, 3);
    if (v === 0) { const n = R.int(1, 99) * 10 + 5; return num(`Round ${F(n)} to the nearest 10.`, n + 5, `${F(n)} is exactly halfway between ${F(n - 5)} and ${F(n + 5)}. Halfway rounds up, so ${F(n + 5)}.`); }
    if (v === 1) { const n = R.int(1, 49) * 100 + 50; return num(`Round ${F(n)} to the nearest 100.`, n + 50, `${F(n)} is exactly halfway between ${F(n - 50)} and ${F(n + 50)}. Halfway rounds up, so ${F(n + 50)}.`); }
    if (v === 2) { const n = R.int(1, 49) * 100 + 40 + R.int(5, 9); return choice(R, `Round ${F(n)} to the nearest 100.`, F(n - n % 100), [F(n - n % 100 + 100)], `Look only at the tens digit: ${dig(n, 1)} is less than 5, so ${F(n)} rounds down to ${F(n - n % 100)}. Don't round to 10 first.`); }
    const lo = R.int(1, 99) * 10; return choiceFixed(`${F(lo + 5)} is exactly halfway between ${F(lo)} and ${F(lo + 10)}. Rounded to the nearest 10, it is:`, [F(lo), F(lo + 10)], 1, `The halfway rule: a number exactly in the middle rounds up, to ${F(lo + 10)}.`);
  } },
  d: { t: 'on a number line', g: (R) => {
    const big = R.bool(0.6);
    if (big) { const lo = R.int(1, 49) * 100, n = lo + gen(() => R.int(1, 99), k => k !== 50 || R.bool(0.3)), r = rnd(n, 100);
      return choiceFixed(`Round ${F(n)} to the nearest 100.`, [F(lo), F(lo + 100)], r === lo ? 0 : 1, `${F(n)} is ${n - lo < 50 ? 'before' : n - lo === 50 ? 'exactly at' : 'past'} the middle mark ${F(lo + 50)}, so it rounds to ${F(r)}.`, { visual: P1.nline(lo, lo + 100, n) }); }
    const lo = R.int(1, 99) * 10, n = lo + R.int(1, 9), r = rnd(n, 10);
    return choiceFixed(`Round ${F(n)} to the nearest 10.`, [F(lo), F(lo + 10)], r === lo ? 0 : 1, `${F(n)} is ${n - lo < 5 ? 'before' : n - lo === 5 ? 'exactly at' : 'past'} the middle mark ${F(lo + 5)}, so it rounds to ${F(r)}.`, { visual: P1.nline(lo, lo + 10, n) });
  } },
} });

/* ---------- II.1.06 ---------- */
const roundQ = (R, n, p) => { const r = rnd(n, p), lo = n - n % p, d = dig(n, len(p) - 2);
  return num(`Round ${F(n)} to the nearest ${F(p)}.`, r, `Look at the digit to the right of the ${placeName(p)}s place: ${d}. ${d >= 5 ? '5 or more rounds up' : 'Less than 5 rounds down'}, so ${F(r)}.`); };
const EXACT = ['a phone number', 'a locker code', 'the change from a shop', 'a house number', 'a bus route number', 'a password'];
const ROUGH = ['fans at a football match', 'people living in a city', 'visitors to a zoo in a year', 'trees in a forest', 'books in a big library', 'cars on a highway in a day'];
E2.skill({ id: 'II.1.06', name: 'Round large numbers', steps: {
  a: { t: 'to 1,000', g: (R) => roundQ(R, gen(() => R.int(1001, 99999), n => n % 1000 !== 0), 1000) },
  b: { t: 'to 10,000', g: (R) => roundQ(R, gen(() => R.int(10001, 999999), n => n % 10000 !== 0), 10000) },
  c: { t: 'to any place', g: (R) => { const p = R.pick([10, 100, 1000, 10000, 100000]); return roundQ(R, gen(() => rN(R, 6), n => n % p !== 0), p); } },
  d: { t: 'when rounding helps', g: (R) => {
    const v = R.int(0, 2);
    if (v === 0) { const e = R.pick(ROUGH); return choice(R, 'Where is a rounded number good enough?', e, R.sample(EXACT, R.int(2, 3)), `For ${e}, "about" is fine. Codes, numbers you dial and money you pay must be exact.`); }
    if (v === 1) { const e = R.pick(EXACT); return choice(R, 'Where do you need the exact number?', e, R.sample(ROUGH, R.int(2, 3)), `${e[0].toUpperCase() + e.slice(1)} must be exact. Big counts like crowds can be rounded.`); }
    const [what, p] = R.pick([['fans came to the match', 1000], ['people live in the town', 1000], ['people ran the city race', 100], ['visitors came to the museum this year', 10000]]);
    const n = gen(() => R.int(p * 3 + 1, p * 99), n => n % p !== 0);
    return num(`${F(n)} ${what}. A headline rounds this to the nearest ${F(p)}. What number does it print?`, rnd(n, p), `${F(n)} to the nearest ${F(p)} is ${F(rnd(n, p))}.`);
  } },
} });

/* ---------- II.1.07 ---------- */
const estPair = (R, L, op) => gen(() => [rN(R, L), rN(R, L)], ([a, b]) => { const p = PV[L - 1]; return a % p !== 0 && b % p !== 0 && (op === '+' || rnd(a, p) > rnd(b, p)) && a !== b && (op === '+' || a > b); });
E2.skill({ id: 'II.1.07', name: 'Estimate sums and differences', steps: {
  a: { t: 'round, then add', g: (R) => {
    const L = R.pick([2, 3, 3, 4]), p = PV[L - 1], [a, b] = estPair(R, L, '+');
    return num(`Estimate ${F(a)} + ${F(b)} by rounding each to the nearest ${F(p)}.`, rnd(a, p) + rnd(b, p), `${F(a)} ≈ ${F(rnd(a, p))} and ${F(b)} ≈ ${F(rnd(b, p))}, so about ${F(rnd(a, p) + rnd(b, p))}.`);
  } },
  b: { t: 'round, then subtract', g: (R) => {
    const L = R.pick([2, 3, 3, 4]), p = PV[L - 1], [a, b] = estPair(R, L, '−');
    return num(`Estimate ${F(a)} − ${F(b)} by rounding each to the nearest ${F(p)}.`, rnd(a, p) - rnd(b, p), `${F(a)} ≈ ${F(rnd(a, p))} and ${F(b)} ≈ ${F(rnd(b, p))}, so about ${F(rnd(a, p) - rnd(b, p))}.`);
  } },
  c: { t: 'front-end estimates', g: (R) => {
    const L = R.pick([3, 4, 4]), p = PV[L - 1], op = R.pick(['+', '−']);
    const [a, b] = gen(() => [rN(R, L), rN(R, L)], ([a, b]) => a % p !== 0 && b % p !== 0 && (op === '+' || Math.floor(a / p) > Math.floor(b / p)));
    const fa = a - a % p, fb = b - b % p, e = op === '+' ? fa + fb : fa - fb;
    return num(`Front-end estimate (keep the first digit, make the other digits 0):<br>${F(a)} ${op} ${F(b)} ≈ ?`, e, `${F(a)} → ${F(fa)} and ${F(b)} → ${F(fb)}. ${F(fa)} ${op} ${F(fb)} = ${F(e)}.`);
  } },
  d: { t: 'is the answer reasonable?', g: (R) => {
    const L = R.pick([3, 4]), p = PV[L - 1], op = R.pick(['+', '−']);
    const [a, b] = gen(() => [rN(R, L), rN(R, L)], ([a, b]) => op === '+' || a - b > 2 * p);
    const t = op === '+' ? a + b : a - b, est = op === '+' ? rnd(a, p) + rnd(b, p) : rnd(a, p) - rnd(b, p), ok = R.bool();
    const claim = ok ? t : gen(() => t + (R.bool() ? 1 : -1) * R.int(3, 5) * p + R.int(-9, 9), c => c > 0 && Math.abs(c - est) >= 2.5 * p);
    return choiceFixed(`Sam says ${F(a)} ${op} ${F(b)} = ${F(claim)}. Is that reasonable?`, ['Reasonable', 'Not reasonable'], ok ? 0 : 1, `Estimate: ${F(rnd(a, p))} ${op} ${F(rnd(b, p))} = ${F(est)}. ${F(claim)} is ${ok ? 'close to that' : 'far from that'}, so it is ${ok ? '' : 'not '}reasonable.`);
  } },
} });

/* ---------- II.1.08 – II.1.11 column methods ---------- */
const noCarry = (R, La, Lb) => gen(() => [rN(R, La), rN(R, Lb)], ns => carriesOf(ns).every(c => c === 0));
E2.skill({ id: 'II.1.08', name: 'Column addition, no regrouping', steps: {
  a: { t: '3-digit', g: (R) => addQ(R, noCarry(R, 3, 3)) },
  b: { t: 'line up the places', g: (R) => { const [a, b] = noCarry(R, 4, R.pick([2, 3])); return lineUpQ(R, a, b, '+'); } },
  c: { t: '4-digit', g: (R) => addQ(R, noCarry(R, 4, 4)) },
  d: { t: 'many digits', g: (R) => { const L = R.pick([5, 6]); return addQ(R, noCarry(R, L, R.pick([L, L - 1]))); } },
} });
const withCarry = (R, L, pat, k = 2) => gen(() => Array.from({ length: k }, () => rN(R, L)), ns => same(carriesOf(ns).slice(0, L - 1), pat) && carriesOf(ns)[L - 1] === 0);
E2.skill({ id: 'II.1.09', name: 'Column addition with regrouping', steps: {
  a: { t: 'carry ones', g: (R) => addQ(R, withCarry(R, 3, [1, 0]), { carry: true }) },
  b: { t: 'carry tens', g: (R) => addQ(R, withCarry(R, 3, [0, 1]), { carry: true }) },
  c: { t: 'carry twice', g: (R) => { const L = R.pick([3, 4]); return addQ(R, L === 3 ? withCarry(R, 3, [1, 1]) : withCarry(R, 4, R.pick([[1, 1, 0], [0, 1, 1], [1, 0, 1]])), { carry: true }); } },
  d: { t: 'three addends', g: (R) => addQ(R, gen(() => [rN(R, 3), rN(R, 3), rN(R, R.pick([2, 3]))], ns => ns.reduce((a, b) => a + b, 0) < 1000 && carriesOf(ns).some(c => c > 0)), { carry: true }) },
} });
const noBorrow = (R, La, Lb) => gen(() => [rN(R, La), rN(R, Lb)], ([a, b]) => a > b && borrowsOf(a, b).every(x => x === 0));
const checkQ = (R, a, b, mistake) => {
  const d = a - b, v = R.int(0, 2);
  if (v === 0) return num(`${F(a)} − ${F(b)} = ${F(d)}. Check it by adding: ${F(d)} + ${F(b)} = ?`, a, `${F(d)} + ${F(b)} = ${F(a)}, the number we started with, so the subtraction is right.`);
  if (v === 1) return choice(R, `Which addition checks ${F(a)} − ${F(b)} = ${F(d)}?`, `${F(d)} + ${F(b)} = ${F(a)}`, [`${F(d)} + ${F(a)} = ${F(d + a)}`, `${F(a)} + ${F(b)} = ${F(a + b)}`], `Answer + the number taken away should give back the start: ${F(d)} + ${F(b)} = ${F(a)}.`);
  const ok = R.bool(), claim = ok ? d : mistake(a, b);
  return choiceFixed(`Is ${F(a)} − ${F(b)} = ${F(claim)} right? Check by adding.`, ['Right', 'Wrong'], ok ? 0 : 1, `${F(claim)} + ${F(b)} = ${F(claim + b)}, ${ok ? 'which matches' : 'not'} ${F(a)}. ${ok ? '' : 'The answer is ' + F(d) + '.'}`);
};
// common slip without regrouping: subtract the smaller digit from the larger in each column
const smallFromBig = (a, b) => { let r = 0; for (let p = 0; p < len(a); p++) r += Math.abs(dig(a, p) - dig(b, p)) * PV[p]; return r; };
const offByTen = (a, b) => a - b + (dig(a - b, 1) < 9 ? 10 : -10);
E2.skill({ id: 'II.1.10', name: 'Column subtraction, no regrouping', steps: {
  a: { t: '3-digit', g: (R) => { const [a, b] = gen(() => noBorrow(R, 3, 3), ([a, b]) => a - b >= 100); return subQ(R, a, b); } },
  b: { t: 'line up the places', g: (R) => { const [a, b] = noBorrow(R, 4, R.pick([2, 3])); return lineUpQ(R, a, b, '−'); } },
  c: { t: '4-digit', g: (R) => { const [a, b] = noBorrow(R, 4, 4); return subQ(R, a, b); } },
  d: { t: 'check with addition', g: (R) => { const [a, b] = noBorrow(R, R.pick([3, 4]), 3); return checkQ(R, a, b, offByTen); } },
} });
const withBorrow = (R, L, pat) => gen(() => [rN(R, L), rN(R, R.pick([L, L - 1]))], ([a, b]) => a > b && same(borrowsOf(a, b).slice(0, pat.length), pat) && borrowsOf(a, b).slice(pat.length).every(x => x === 0));
const acrossZeros = R => gen(() => {
  const L = R.pick([3, 4, 4]), pat = R.pick(L === 3 ? ['d00', 'd0o'] : ['d000', 'd00o', 'd0oo', 'dd00', 'dd0o']);
  const a = +pat.split('').map((c, i) => c === '0' ? '0' : String(R.int(i === 0 ? 1 : 1, 9))).join('');
  return [a, rN(R, R.pick([L, L - 1]))];
}, ([a, b]) => a > b && dig(b, 0) > dig(a, 0) && dig(a, 1) === 0 && borrowsOf(a, b)[1] === 1);
E2.skill({ id: 'II.1.11', name: 'Column subtraction with regrouping', steps: {
  a: { t: 'regroup a ten', g: (R) => { const [a, b] = withBorrow(R, 3, [1, 0]); return subQ(R, a, b); } },
  b: { t: 'regroup a hundred', g: (R) => { const [a, b] = withBorrow(R, 3, [0, 1]); return subQ(R, a, b); } },
  c: { t: 'across zeros', g: (R) => { const [a, b] = acrossZeros(R); const q = subQ(R, a, b); q.explain = `Regroup across the zero${String(a).match(/0/g).length > 1 ? 's' : ''}: take 1 from the first non-zero digit to the left. ` + q.explain; return q; } },
  d: { t: 'check with addition', g: (R) => { const [a, b] = gen(() => [rN(R, 4), rN(R, R.pick([3, 4]))], ([a, b]) => a > b && borrowsOf(a, b).some(x => x) && smallFromBig(a, b) !== a - b); return checkQ(R, a, b, smallFromBig); } },
} });

/* ---------- II.1.12 ---------- */
const PROB = [
  // [op, template(a,b,u), a digits, b digits]
  ['+', (a, b) => `A library has ${F(a)} books. It gets ${F(b)} more. How many books now?`],
  ['+', (a, b) => `${F(a)} people came on Saturday and ${F(b)} on Sunday. How many in all?`],
  ['+', (a, b, u) => `A plane flies ${F(a)} ${u}, then ${F(b)} ${u} more. How far in all?`],
  ['−', (a, b) => `A farm had ${F(a)} eggs. It sold ${F(b)}. How many are left?`],
  ['−', (a, b) => `A hall has ${F(a)} seats. A theater has ${F(b)}. How many more seats does the hall have?`],
  ['−', (a, b, u) => `A trip is ${F(a)} ${u}. You have gone ${F(b)} ${u}. How far is left?`],
];
const U = O => O.units === 'imperial' ? 'miles' : 'km';
const probNums = R => gen(() => [rN(R, 4), rN(R, R.pick([3, 4]))], ([a, b]) => a > b && a % 100 !== 0 && b % 100 !== 0);
E2.skill({ id: 'II.1.12', name: 'Addition and subtraction problems', steps: {
  a: { t: 'one step', g: (R, O) => {
    const [op, t] = R.pick(PROB), [a, b] = probNums(R), r = op === '+' ? a + b : a - b;
    return num(t(a, b, U(O)), r, `${op === '+' ? 'Put together, so add' : 'Take away or compare, so subtract'}: ${F(a)} ${op} ${F(b)} = ${F(r)}.`);
  } },
  b: { t: 'two steps', g: (R, O) => {
    const v = R.int(0, 2), u = U(O);
    if (v === 0) { const a = R.int(1200, 4999), b = R.int(150, 900), c = R.int(100, 900); return num(`A school had ${F(a)} books. It bought ${F(b)} and gave away ${F(c)}. How many now?`, a + b - c, `${F(a)} + ${F(b)} = ${F(a + b)}, then ${F(a + b)} − ${F(c)} = ${F(a + b - c)}.`); }
    if (v === 1) { const b = R.int(200, 900), c = R.int(200, 900), a = b + c + R.int(150, 2000); return num(`A trip is ${F(a)} ${u}. Day 1: ${F(b)} ${u}. Day 2: ${F(c)} ${u}. How far is left?`, a - b - c, `${F(b)} + ${F(c)} = ${F(b + c)} done, and ${F(a)} − ${F(b + c)} = ${F(a - b - c)} left.`); }
    const b = R.int(300, 1500), c = R.int(200, 900), a = b + c + R.int(50, 900); return num(`A hall holds ${F(a)} people. ${F(b)} adults and ${F(c)} children came. How many seats were empty?`, a - b - c, `${F(b)} + ${F(c)} = ${F(b + c)} people, and ${F(a)} − ${F(b + c)} = ${F(a - b - c)} empty.`);
  } },
  c: { t: 'choose the operation', g: (R, O) => {
    const [op, t] = R.pick(PROB), [a, b] = probNums(R);
    const right = `${F(a)} ${op} ${F(b)}`, other = `${F(a)} ${op === '+' ? '−' : '+'} ${F(b)}`;
    return choice(R, `${t(a, b, U(O))} Which calculation answers it?`, right, [other, `${F(b)} − ${F(a)}`], op === '+' ? 'The amounts are put together, so add.' : 'Something is taken away or compared, so subtract the smaller from the larger.');
  } },
  d: { t: 'estimate to check', g: (R, O) => {
    const [op, t] = R.pick(PROB), [a, b] = gen(() => probNums(R), ([a, b]) => rnd(a, 100) > rnd(b, 100) + 200);
    const e = op === '+' ? rnd(a, 100) + rnd(b, 100) : rnd(a, 100) - rnd(b, 100), e2 = op === '+' ? rnd(a, 100) - rnd(b, 100) : rnd(a, 100) + rnd(b, 100);
    return choice(R, `${t(a, b, U(O))} Which is the best estimate?`, F(e), [F(e2), F(e * 10), F(Math.round(e / 10))].filter(x => x !== '0'), `Round to hundreds: ${F(rnd(a, 100))} ${op} ${F(rnd(b, 100))} = ${F(e)}.`);
  } },
} });

})();

/* Era II · Unit II.2 Multiplication */
(function(){ const {num, choiceFixed, tf, fh, fmt, V, C} = E2;
// at most 3 distractors (4 choices), best ones listed first; duplicates of the answer dropped
const choice = (R, p, c, ds, ex, extra) => { const seen = new Set([String(c)]), keep = [];
  ds.forEach(d => { if (!seen.has(String(d))) { seen.add(String(d)); keep.push(d); } });
  return E2.choice(R, p, c, keep.slice(0, 3), ex, extra); };
const X = '×', M = '−';
const NAMES = ['Ana', 'Ben', 'Mia', 'Leo', 'Sara', 'Tom', 'Kim', 'Raj', 'Noor', 'Eli'];
const money = (O, n) => O.coins === 'THB' ? `${fmt(n)} baht` : `$${fmt(n)}`;
const r10 = n => Math.round(n / 10) * 10;
const lead = n => { const p = 10 ** (String(n).length - 1); return Math.round(n / p) * p; }; // round to leading place

/* ---------- VM_ visual helpers (unit II.2) ---------- */
const VM = {};
// equal groups: g rounded boxes with `per` dots each
VM.groups = function (g, per, o = {}) {
  const r = 7, s = 18, cols = Math.min(per, 5), rows = Math.ceil(per / 5), bw = cols * s + 14, bh = rows * s + 14, gap = 12, perRow = Math.min(g, o.perRow || 5);
  let body = '';
  for (let k = 0; k < g; k++) {
    const x0 = 2 + (k % perRow) * (bw + gap), y0 = 2 + Math.floor(k / perRow) * (bh + gap);
    body += `<rect x="${x0}" y="${y0}" width="${bw}" height="${bh}" rx="12" fill="${C.faint}" stroke="${C.muted}" stroke-width="2"/>`;
    for (let i = 0; i < per; i++) body += V.dot(x0 + 7 + s / 2 + (i % 5) * s, y0 + 7 + s / 2 + Math.floor(i / 5) * s, r, o.color || C.red);
  }
  const W = perRow * (bw + gap) - gap + 4, H = Math.ceil(g / perRow) * (bh + gap) - gap + 4;
  return V.svg(W, H, body, `${g} groups of ${per}`);
};
// written column calculation. rows: {t:'347', op:'×', note:'4 × 7', small:true (carry row)} | {line:true} | {q:3} (answer box)
// '?' inside t draws a one-digit box; spaces leave a column empty.
VM.vert = function (rows, o = {}) {
  const cw = 24, rh = 36, pad = 10;
  const len = r => (r.q ? r.q : r.t.length) + (r.op ? 1 : 0);
  const maxc = Math.max(...rows.filter(r => !r.line).map(len)) + 0;
  const noteW = rows.some(r => r.note) ? 118 : 0, xr = pad + maxc * cw;
  const box = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="${C.amber}"/>` + V.text(x + w / 2, y + h / 2, '?', {size: 18, weight: 700});
  let y = pad, body = '';
  rows.forEach(r => {
    if (r.line) { body += `<line x1="${xr - maxc * cw - 2}" y1="${y + 3}" x2="${xr + 4}" y2="${y + 3}" stroke="${C.ink}" stroke-width="2.5"/>`; y += 8; return; }
    const h = r.small ? 22 : rh, cy = y + h / 2, size = r.small ? 14 : 23, fill = r.small ? C.red : C.ink;
    if (r.q) body += box(xr - r.q * cw + 2, y + 4, r.q * cw - 4, h - 8);
    else for (let i = 0; i < r.t.length; i++) {
      const ch = r.t[r.t.length - 1 - i], x = xr - cw / 2 - i * cw;
      if (ch === ' ') continue;
      if (ch === '?') body += r.small ? box(x - 8, y + 2, 16, h - 4) : box(x - cw / 2 + 2, y + 4, cw - 4, h - 8);
      else body += V.text(x, cy, ch, {size, fill, weight: 600});
    }
    if (r.op) body += V.text(xr - maxc * cw + cw / 2, cy, r.op, {size: 22, weight: 600});
    if (r.note) body += V.text(xr + 18, cy, r.note, {size: 15, anchor: 'start', fill: C.muted});
    y += h;
  });
  return V.svg(xr + pad + noteW, y + pad, body, o.label || 'written calculation');
};
// carries for a × m (m one digit): c[i] = carry into column i (from right)
const carries = (a, m) => { const d = String(a).split('').reverse().map(Number), c = [0]; let k = 0; d.forEach((x, i) => { k = Math.floor((x * m + k) / 10); c[i + 1] = k; }); return c; };
const carryRow = (a, m, mask) => { const L = String(a).length, c = carries(a, m); let s = ''; for (let i = L - 1; i >= 0; i--) s += mask && mask(i) ? '?' : (c[i] ? String(c[i]) : ' '); return s; };
const qBox = n => ({q: Math.max(3, String(n).length)});
// a × m laid out with a blank answer box
const mulLayout = (a, m, extra = []) => VM.vert([{t: String(a)}, {t: String(m), op: X}, {line: true}, ...extra]);

/* ---------- fact helpers ---------- */
const EX = {
  0: (t, n) => `Any number times 0 is 0.`,
  1: (t, n) => `Any number times 1 stays the same: ${n}.`,
  2: (t, n) => `Times 2 is doubling: ${n} + ${n} = ${2 * n}.`,
  3: (t, n) => `3 × ${n} is 2 × ${n} plus one more ${n}: ${2 * n} + ${n} = ${3 * n}.`,
  4: (t, n) => `Double ${n} is ${2 * n}; double again is ${4 * n}.`,
  5: (t, n) => `5 × ${n} is half of 10 × ${n} = ${10 * n}, so ${5 * n}.`,
  6: (t, n) => `6 × ${n} is 5 × ${n} plus one more ${n}: ${5 * n} + ${n} = ${6 * n}.`,
  7: (t, n) => `7 × ${n} is 5 × ${n} + 2 × ${n} = ${5 * n} + ${2 * n} = ${7 * n}.`,
  8: (t, n) => `Double ${n} three times: ${2 * n}, ${4 * n}, ${8 * n}.`,
  9: (t, n) => `9 × ${n} is 10 × ${n} − ${n} = ${10 * n} − ${n} = ${9 * n}.`,
  10: (t, n) => `Times 10 puts a 0 on the end: ${10 * n}.`,
};
const factQ = (R, t, lo = 1, hi = 10) => {
  const n = R.int(lo, hi), p = t * n, [a, b] = R.bool() ? [t, n] : [n, t], ex = (EX[t] || ((t, n) => `${t} × ${n} = ${t * n}.`))(t, n);
  if (R.int(0, 2) < 2 || t === 0 || n === 0) return num(`${a} ${X} ${b} = ?`, p, ex);
  return num(`${a} ${X} ? = ${p}`, b, `${a} ${X} ${b} = ${p}, so the missing number is ${b}.`);
};

E2.skill({ id: 'II.2.01', name: 'Equal groups', steps: {
  a: { t: 'groups of 2', g: (R) => { const g = R.int(2, 9);
    if (R.bool(0.7)) return num(`${g} groups of 2. How many dots in all?`, 2 * g, `Count by 2s ${g} times: ${Array.from({length: g}, (_, i) => 2 * (i + 1)).join(', ')}.`, {visual: VM.groups(g, 2)});
    return num(`How many groups of 2 are there? How many dots in all?`, [{label: 'groups', ans: g}, {label: 'dots', ans: 2 * g}], `There are ${g} groups of 2. ${g} twos make ${2 * g}.`, {visual: VM.groups(g, 2)}); } },
  b: { t: 'groups of 5 and 10', g: (R) => { const per = R.pick([5, 10]), g = R.int(2, per === 5 ? 8 : 6);
    return num(`${g} groups of ${per}. How many dots in all?`, g * per, `Count by ${per}s: ${Array.from({length: g}, (_, i) => per * (i + 1)).join(', ')}.`, {visual: VM.groups(g, per)}); } },
  c: { t: 'as repeated addition', g: (R) => { const g = R.int(2, 5), per = R.int(2, 9), rep = k => Array(k).fill(per).join(' + ');
    if (R.bool()) return num(`${rep(g)} = ?`, g * per, `${g} groups of ${per}: ${Array.from({length: g}, (_, i) => per * (i + 1)).join(', ')}.`, {visual: VM.groups(g, per)});
    return choice(R, 'Which addition matches the picture?', rep(g), [`${g} + ${per}`, rep(g + 1), g > 2 ? rep(g - 1) : Array(g).fill(per + 1).join(' + ')],
      `There are ${g} groups with ${per} in each, so add them: ${Array(g).fill(per).join(' + ')}.`, {visual: VM.groups(g, per)}); } },
  d: { t: 'as multiplication', g: (R) => { const g = R.int(2, 6), per = R.int(2, 9); if (g === per) return E2.byId['II.2.01'].steps.d.g(R);
    if (R.bool()) return choice(R, 'Which multiplication matches the picture?', `${g} ${X} ${per} = ${g * per}`, [`${g} + ${per} = ${g + per}`, `${g} ${X} ${per + 1} = ${g * (per + 1)}`, `${g + 1} ${X} ${per} = ${(g + 1) * per}`],
      `${g} groups of ${per} is ${g} ${X} ${per} = ${g * per}.`, {visual: VM.groups(g, per)});
    return num(`${Array(g).fill(per).join(' + ')} = ? ${X} ${per}`, g, `${per} is added ${g} times, so it is ${g} ${X} ${per}.`); } },
}});

E2.skill({ id: 'II.2.02', name: 'Arrays', steps: {
  a: { t: 'rows and columns', g: (R) => { const [r, c] = R.distinct(2, 7, 2);
    return num('How many rows and how many columns?', [{label: 'rows', ans: r}, {label: 'columns', ans: c}], `Rows go across (${r} of them); columns go up and down (${c} of them).`, {visual: V.array(r, c)}); } },
  b: { t: 'write the multiplication', g: (R) => { const [r, c] = R.distinct(2, 8, 2);
    if (R.bool()) return choice(R, `${r} rows of ${c}. Which multiplication matches?`, `${r} ${X} ${c} = ${r * c}`, [`${r} + ${c} = ${r + c}`, `${r} ${X} ${c} = ${r + c}`, `${r} ${X} ${c + 1} = ${r * (c + 1)}`],
      `${r} rows with ${c} in each row: ${r} ${X} ${c} = ${r * c}.`, {visual: V.array(r, c)});
    return num(`${r} rows of ${c}. ${r} ${X} ${c} = ?`, r * c, `Count by ${c}s ${r} times: ${r * c}.`, {visual: V.array(r, c)}); } },
  c: { t: 'turn the array', g: (R) => { const [r, c] = R.distinct(2, 8, 2);
    if (R.bool()) return num(`This array shows ${r} ${X} ${c}. Turn it on its side. What is ${c} ${X} ${r}?`, r * c, `Turning does not change the number of dots, so ${c} ${X} ${r} = ${r * c}.`, {visual: V.array(r, c)});
    return num(`Turn this array on its side so it has ${c} rows. How many dots are in each row?`, r, `The ${r} rows become ${r} columns, so each new row has ${r} dots.`, {visual: V.array(r, c)}); } },
  d: { t: 'build an array for a fact', g: (R) => { const r = R.int(2, 5), c = R.int(3, 7); if (r === c) return E2.byId['II.2.02'].steps.d.g(R);
    if (R.bool()) return choice(R, `Which array shows ${r} ${X} ${c} (${r} rows of ${c})?`, V.array(r, c, {r: 7}), [V.array(c, r, {r: 7}), V.array(r, c + 1, {r: 7}), V.array(r + 1, c, {r: 7})],
      `${r} rows going across, with ${c} dots in each row: ${r * c} dots.`);
    return num(`To build ${r} ${X} ${c}, you make ${r} rows. How many dots go in each row?`, c, `${r} ${X} ${c} means ${r} rows of ${c}.`); } },
}});

E2.skill({ id: 'II.2.03', name: 'Multiply by 0, 1, 2, 5 and 10', steps: {
  a: { t: '× 0 and × 1', g: (R) => { const n = R.int(2, 10), t = R.pick([0, 1]), f = R.int(0, 2);
    if (t === 1 && f === 2) return num(`${n} ${X} ? = ${n}`, 1, `Only times 1 keeps ${n} the same.`);
    const [a, b] = f ? [n, t] : [t, n];
    return num(`${a} ${X} ${b} = ?`, n * t, t ? `Times 1 keeps a number the same: ${n}.` : a === 0 ? `0 ${X} ${n} means 0 groups of ${n}: nothing at all, so it is 0 (not ${n}).` : `${n} ${X} 0 means ${n} groups of nothing, so it is 0 (not ${n}; that would be ${n} + 0).`); } },
  b: { t: '× 2', g: (R) => factQ(R, 2) },
  c: { t: '× 5', g: (R) => factQ(R, 5) },
  d: { t: '× 10', g: (R) => factQ(R, 10) },
}});

E2.skill({ id: 'II.2.04', name: 'Facts for 3, 4 and 6', steps: {
  a: { t: '× 3', g: (R) => factQ(R, 3) },
  b: { t: '× 4 as double-double', g: (R) => { const n = R.int(2, 10);
    return num(`Find 4 ${X} ${n} by doubling ${n}, then doubling again.`, [{label: `2 ${X} ${n} =`, ans: 2 * n}, {label: `4 ${X} ${n} =`, ans: 4 * n}], `Double ${n} is ${2 * n}. Double ${2 * n} is ${4 * n} (not ${2 * n} + 2).`); } },
  c: { t: '× 6', g: (R) => factQ(R, 6) },
  d: { t: 'mixed', g: (R) => factQ(R, R.pick([3, 4, 6]), 2, 10) },
}});

E2.skill({ id: 'II.2.05', name: 'Facts for 7, 8 and 9', steps: {
  a: { t: '× 9 patterns', g: (R) => { const n = R.int(2, 10);
    if (R.bool()) return num(`9 ${X} ${n} = ${n - 1}_. The digits of a 9s fact add to 9. What digit goes in the blank?`, 10 - n, `The digits of 9 ${X} ${n} add to 9: ${n - 1} + ${10 - n} = 9. So 9 ${X} ${n} = ${9 * n}.`);
    return factQ(R, 9, 2, 10); } },
  b: { t: '× 8', g: (R) => factQ(R, 8) },
  c: { t: '× 7', g: (R) => factQ(R, 7) },
  d: { t: 'mixed', g: (R) => factQ(R, R.pick([7, 8, 9]), 2, 10) },
}});

E2.skill({ id: 'II.2.06', name: 'All facts to 10 × 10', steps: {
  a: { t: 'square facts', g: (R) => { const n = R.int(2, 10);
    if (R.bool(0.65)) return num(`${n} ${X} ${n} = ?`, n * n, `${n} rows of ${n} make a square: ${n * n}.`);
    return num(`Which number times itself makes ${n * n}?`, n, `${n} ${X} ${n} = ${n * n}.`); } },
  b: { t: 'build from known facts', g: (R) => { const a = R.int(3, 9), b = R.int(3, 9), k = R.int(0, 2);
    if (k === 0 && b < 10) return num(`${a} ${X} ${b} = ${a * b}. So ${a} ${X} ${b + 1} = ?`, a * (b + 1), `One more group of ${a}: ${a * b} + ${a} = ${a * (b + 1)}.`);
    if (k === 1) return num(`${a} ${X} ${b} = ${a * b}. So ${a} ${X} ${b - 1} = ?`, a * (b - 1), `One less group of ${a}: ${a * b} − ${a} = ${a * (b - 1)}.`);
    const h = R.int(2, 5); return num(`${h} ${X} ${b} = ${h * b}. So ${2 * h} ${X} ${b} = ?`, 2 * h * b, `${2 * h} is double ${h}, so double ${h * b}: ${2 * h * b}.`); } },
  c: { t: 'mixed', g: (R) => factQ(R, R.int(2, 10), 2, 10) },
  d: { t: 'from memory', g: (R) => { const a = R.int(6, 9), b = R.int(6, 9);
    if (R.bool(0.7)) return num(`${a} ${X} ${b} = ?`, a * b, EX[a](a, b));
    return num(`? ${X} ${b} = ${a * b}`, a, `${a} ${X} ${b} = ${a * b}. ${EX[a](a, b)}`); } },
}});

E2.skill({ id: 'II.2.07', name: 'The area model', steps: {
  a: { t: 'count squares', g: (R) => { const r = R.int(2, 6), c = R.int(3, 9), cells = [];
    for (let i = 0; i < r; i++) for (let j = 0; j < c; j++) cells.push([i, j]);
    return num('How many unit squares cover the rectangle?', r * c, `${r} rows of ${c} squares: ${r} ${X} ${c} = ${r * c}.`, {visual: V.grid(r, c, {cells, size: 24})}); } },
  b: { t: 'length × width', g: (R) => { const l = R.int(4, 12), w = R.int(2, 9); if (l === w) return E2.byId['II.2.07'].steps.b.g(R);
    return num('Find the area of the rectangle in square units.', l * w, `Area = length ${X} width = ${l} ${X} ${w} = ${l * w}.`, {visual: V.areaModel([{label: `${l}`}], [{label: `${w}`}], {w: 60 + l * 24, h: 40 + w * 18})}); } },
  c: { t: 'split a rectangle', g: (R) => { const a = R.int(3, 9);
    let p, q; if (R.bool(0.7)) { p = 10; q = R.int(2, 9); } else { p = 5; q = R.int(1, 4); }
    const b = p + q, pic = V.areaModel([{label: `${p}`, w: p}, {label: `${q}`, w: q}], [{label: `${a}`}], {cells: [[`${a * p}`, '?']], w: 420, h: 150});
    return num(`The rectangle is ${a} by ${b}, split into ${p} and ${q}. Find the missing part and the whole area.`, [{label: `${a} ${X} ${q} =`, ans: a * q}, {label: `${a} ${X} ${b} =`, ans: a * b}],
      `${a} ${X} ${q} = ${a * q}. Add the parts: ${a * p} + ${a * q} = ${a * b}.`, {visual: pic}); } },
  d: { t: 'link to the distributive property', g: (R) => { const a = R.int(3, 9), x = R.int(2, 9), b = 10 + x;
    const pic = V.areaModel([{label: '10', w: 10}, {label: `${x}`, w: x}], [{label: `${a}`}], {w: 420, h: 150});
    if (R.bool()) return choice(R, `Which matches the area model for ${a} ${X} ${b}?`, `${a} ${X} 10 + ${a} ${X} ${x}`, [`${a} ${X} 10 + ${x}`, `${a} + 10 ${X} ${x}`, `${a} ${X} 10 ${X} ${x}`],
      `Each part is ${a} tall: ${a} ${X} 10 and ${a} ${X} ${x}. Add them.`, {visual: pic});
    return num(`${a} ${X} ${b} = ${a} ${X} 10 + ${a} ${X} ${x} = ?`, a * b, `${a * 10} + ${a * x} = ${a * b}.`, {visual: pic}); } },
}});

E2.skill({ id: 'II.2.08', name: 'Properties of multiplication', steps: {
  a: { t: 'commutative', g: (R) => { const [a, b] = R.distinct(2, 10, 2), k = R.int(0, 2);
    if (k === 2) { const [s, l] = a < b ? [a, b] : [b, a], p = s * l;
      return choice(R, 'Which one is true?', `${s} ${X} ${l} = ${l} ${X} ${s}`, [`${p} ÷ ${s} = ${s} ÷ ${p}`, `${l} ${M} ${s} = ${s} ${M} ${l}`],
        `Swapping works for × (and +): both give ${p}. It does not work for ÷ or ${M}: ${p} ÷ ${s} = ${l}, but ${s} ÷ ${p} is less than 1.`); }
    if (k === 1) return num(`${a} ${X} ${b} = ${a * b}. What is ${b} ${X} ${a}?`, a * b, `Swapping the order does not change the product: ${a * b}.`);
    return num(`${a} ${X} ${b} = ${b} ${X} ?`, a, `The same two numbers in any order give the same product.`); } },
  b: { t: 'associative', g: (R) => { const a = R.int(2, 5), b = R.int(2, 5), c = R.int(2, 5);
    if (R.bool()) return num(`(${a} ${X} ${b}) ${X} ${c} = ${a} ${X} ?`, b * c, `Group the other pair first: (${a} ${X} ${b}) ${X} ${c} = ${a} ${X} (${b} ${X} ${c}) = ${a} ${X} ${b * c}.`);
    return num(`(${a} ${X} ${b}) ${X} ${c} = ?`, a * b * c, `${a} ${X} ${b} = ${a * b}, then ${a * b} ${X} ${c} = ${a * b * c}.`); } },
  c: { t: 'distributive', g: (R) => { const a = R.int(3, 9), x = R.int(1, 9), b = 10 + x, k = R.int(0, 2);
    if (k === 0) return num(`${a} ${X} ${b} = ${a} ${X} 10 + ${a} ${X} ?`, x, `${b} = 10 + ${x}, so multiply ${a} by 10 and by ${x}.`);
    if (k === 1) return num(`Find ${a} ${X} ${b} by splitting ${b} into 10 + ${x}.`, a * b, `${a} ${X} 10 = ${a * 10}, ${a} ${X} ${x} = ${a * x}; ${a * 10} + ${a * x} = ${a * b}.`);
    return choice(R, `Which is equal to ${a} ${X} ${b}?`, `${a} ${X} 10 + ${a} ${X} ${x}`, [`${a} ${X} 10 + ${x}`, `${a} ${X} 10 ${X} ${x}`, `${a} + 10 + ${x}`],
      `Split ${b} into 10 + ${x} and multiply each part by ${a}.`); } },
  d: { t: 'use them to simplify', g: (R) => { const [p, q] = R.pick([[2, 5], [4, 25], [5, 20], [2, 50], [4, 5], [5, 2], [25, 4]]), m = R.int(3, 19);
    return num(`Find ${p} ${X} ${m} ${X} ${q}.`, p * q * m, `Swap and group the friendly pair: ${p} ${X} ${q} = ${p * q}, then ${p * q} ${X} ${m} = ${fmt(p * q * m)}.`); } },
}});

E2.skill({ id: 'II.2.09', name: 'Multiply by multiples of 10', steps: {
  a: { t: '× 10', g: (R) => { const n = R.int(11, 99);
    if (R.bool(0.3)) return num(`? ${X} 10 = ${n * 10}`, n, `${n} ${X} 10 = ${n * 10}.`);
    return num(R.bool() ? `${n} ${X} 10 = ?` : `10 ${X} ${n} = ?`, n * 10, `Times 10: each digit moves up one place, so ${n} becomes ${n * 10}.`); } },
  b: { t: '3 × 40', g: (R) => { const a = R.int(2, 9), b = R.int(2, 9);
    return num(R.bool() ? `${a} ${X} ${b * 10} = ?` : `${b * 10} ${X} ${a} = ?`, a * b * 10, `${a} ${X} ${b} tens = ${a * b} tens = ${a * b * 10}.`); } },
  c: { t: '30 × 40', g: (R) => { const a = R.int(2, 9), b = R.int(2, 9);
    return num(`${a * 10} ${X} ${b * 10} = ?`, a * b * 100, `${a} ${X} ${b} = ${a * b}, and 10 ${X} 10 = 100, so ${fmt(a * b * 100)}.${(a * b) % 10 ? '' : ` The 0 in ${a * b} stays too: ${a * b * 100} has three zeros.`}`); } },
  d: { t: '× 100 and × 1,000', g: (R) => { const k = R.int(0, 2);
    if (k === 2) { const a = R.int(2, 9), b = R.int(2, 9); return num(`${a} ${X} ${b * 100} = ?`, a * b * 100, `${a} ${X} ${b} = ${a * b}, then ${X} 100: ${fmt(a * b * 100)}.`); }
    const n = R.int(2, 99), m = k ? 1000 : 100;
    return num(`${n} ${X} ${fmt(m)} = ?`, n * m, `${X} ${fmt(m)} adds ${k ? 3 : 2} zeros: ${fmt(n * m)}.`); } },
}});

E2.skill({ id: 'II.2.10', name: 'Two-digit by one-digit', steps: {
  a: { t: 'area model', g: (R) => { const t = R.int(1, 9), o = R.int(1, 9), m = R.int(2, 9), n = 10 * t + o;
    const pic = V.areaModel([{label: `${t * 10}`, w: 3}, {label: `${o}`, w: 1.3}], [{label: `${m}`}], {w: 400, h: 140});
    return num(`Use the area model to find ${n} ${X} ${m}.`, [{label: `${m} ${X} ${t * 10} =`, ans: m * t * 10}, {label: `${m} ${X} ${o} =`, ans: m * o}, {label: `${n} ${X} ${m} =`, ans: n * m}],
      `${m * t * 10} + ${m * o} = ${n * m}.`, {visual: pic}); } },
  b: { t: 'partial products', g: (R) => { const t = R.int(1, 9), o = R.int(2, 9), m = R.int(2, 9), n = 10 * t + o, hideOnes = R.bool();
    const pic = mulLayout(n, m, [hideOnes ? {q: 3, note: `${m} ${X} ${o}`} : {t: String(m * o), note: `${m} ${X} ${o}`}, hideOnes ? {t: String(m * t * 10), note: `${m} ${X} ${t * 10}`} : {q: 3, note: `${m} ${X} ${t * 10}`}, {line: true}, {q: 3}]);
    const hid = hideOnes ? [o, m * o] : [t * 10, m * t * 10];
    return num(`Find the missing partial product and the total.`, [{label: `${m} ${X} ${hid[0]} =`, ans: hid[1]}, {label: `${n} ${X} ${m} =`, ans: n * m}],
      `${m} ${X} ${o} = ${m * o} and ${m} ${X} ${t * 10} = ${m * t * 10}. Total ${n * m}.`, {visual: pic}); } },
  c: { t: 'standard algorithm', g: (R) => { const t = R.int(1, 9), o = R.int(2, 9), m = R.int(3, 9), n = 10 * t + o;
    if (m * o >= 10 && R.bool()) { const c = Math.floor(m * o / 10), P = n * m;
      const pic = VM.vert([{t: c + ' ', small: true}, {t: String(n)}, {t: String(m), op: X}, {line: true}, {t: '?'.repeat(String(P).length - 1) + (P % 10)}]);
      return num(`${n} ${X} ${m}: the ones are done and ${c} is carried. Finish the answer.`, P, `${m} ${X} ${t} = ${m * t}, plus the ${c} carried = ${m * t + c}. So ${P} (not ${m * t}${P % 10}, which forgets the carry).`, {visual: pic}); }
    return num(`Use the standard algorithm: ${n} ${X} ${m} = ?`, n * m, `${m} ${X} ${o} = ${m * o}${m * o >= 10 ? `, carry ${Math.floor(m * o / 10)}` : ''}; ${m} ${X} ${t} + ${Math.floor(m * o / 10)} = ${m * t + Math.floor(m * o / 10)}. Answer ${n * m}.`, {visual: mulLayout(n, m, [qBox(n * m)])}); } },
  d: { t: 'estimate first', g: (R) => { const t = R.int(1, 9), o = R.pick([1, 2, 3, 4, 6, 7, 8, 9]), m = R.int(3, 9), n = 10 * t + o, e = r10(n) * m;
    return num(`Estimate ${n} ${X} ${m} by rounding ${n} to the nearest ten. Then find the exact answer.`, [{label: 'estimate', ans: e}, {label: 'exact', ans: n * m}],
      `${n} rounds to ${r10(n)}; ${r10(n)} ${X} ${m} = ${e}. Exact: ${n * m}, close to ${e}.`); } },
}});

const noZero3 = R => 100 * R.int(1, 9) + 10 * R.int(1, 9) + R.int(1, 9);
E2.skill({ id: 'II.2.11', name: 'Three- and four-digit by one-digit', steps: {
  a: { t: 'partial products', g: (R) => { const n = noZero3(R), m = R.int(2, 9), [h, t, o] = String(n).split('').map(Number);
    return num(`Find ${n} ${X} ${m} with partial products.`, [{label: `${m} ${X} ${h * 100} =`, ans: m * h * 100}, {label: `${m} ${X} ${t * 10} =`, ans: m * t * 10}, {label: `${m} ${X} ${o} =`, ans: m * o}, {label: `${n} ${X} ${m} =`, ans: n * m}],
      `${m * h * 100} + ${m * t * 10} + ${m * o} = ${fmt(n * m)}.`); } },
  b: { t: 'regrouping', g: (R) => { let n, m, c; do { n = noZero3(R); m = R.int(3, 9); c = carries(n, m); } while (!(c[1] && c[2]));
    const [, t, o] = String(n).split('').map(Number), P = n * m;
    if (R.bool()) {
      const pic = VM.vert([{t: carryRow(n, m, i => i === 1).replace(/[0-9]/g, ' '), small: true}, {t: String(n)}, {t: String(m), op: X}, {line: true}, {t: '?'}]);
      return num(`${n} ${X} ${m}: start with ${m} ${X} ${o}. What ones digit do you write, and what do you carry?`, [{label: 'ones digit', ans: (m * o) % 10}, {label: 'carry', ans: c[1]}],
        `${m * o} = ${c[1]} tens and ${(m * o) % 10} ones: write ${(m * o) % 10}, carry ${c[1]}.`, {visual: pic}); }
    const s = m * t + c[1];
    const pic2 = VM.vert([{t: `?${c[1]} `, small: true}, {t: String(n)}, {t: String(m), op: X}, {line: true}, {t: '?' + (P % 10)}]);
    return num(`${n} ${X} ${m}: the ones are done and ${c[1]} is carried. Now do the tens. What tens digit do you write, and what do you carry?`, [{label: 'tens digit', ans: s % 10}, {label: 'carry', ans: Math.floor(s / 10)}],
      `${m} ${X} ${t} = ${m * t}, then add the carry: ${m * t} + ${c[1]} = ${s}. Write ${s % 10}, carry ${Math.floor(s / 10)}. (Multiply first, then add the carry.)`, {visual: pic2}); } },
  c: { t: 'standard algorithm', g: (R) => { const n = R.bool(0.4) ? R.int(101, 999) : R.int(1001, 9999), m = R.int(3, 9);
    return num(`Use the standard algorithm: ${fmt(n)} ${X} ${m} = ?`, n * m, `Multiply each digit by ${m} from the right, carrying as you go: ${fmt(n * m)}.`, {visual: mulLayout(n, m, [qBox(n * m)])}); } },
  d: { t: 'check by estimating', g: (R) => { const n = R.bool() ? R.int(120, 980) : R.int(1200, 9800), m = R.int(3, 9), P = n * m, e = lead(n);
    return choice(R, `Estimate to choose the answer to ${fmt(n)} ${X} ${m}.`, fmt(P), [fmt(Math.round(P / 10)), fmt(P * 10), fmt(n + m)],
      `${fmt(n)} is about ${fmt(e)}, and ${fmt(e)} ${X} ${m} = ${fmt(e * m)}. Only ${fmt(P)} is close.`); } },
}});

const twoD = R => 10 * R.int(1, 9) + R.int(1, 9);
E2.skill({ id: 'II.2.12', name: 'Two-digit by two-digit', steps: {
  a: { t: 'area model', g: (R) => { const a = twoD(R), b = twoD(R), [a1, a2] = [Math.floor(a / 10), a % 10], [b1, b2] = [Math.floor(b / 10), b % 10];
    const P = [[a1 * b1 * 100, a2 * b1 * 10], [a1 * b2 * 10, a2 * b2]], hi = R.int(0, 1), hj = R.int(0, 1);
    const cells = P.map((row, i) => row.map((v, j) => i === hi && j === hj ? '?' : String(v)));
    const pic = V.areaModel([{label: `${a1 * 10}`, w: 2.6}, {label: `${a2}`, w: 1.2}], [{label: `${b1 * 10}`, h: 2}, {label: `${b2}`, h: 1}], {cells, w: 420, h: 200});
    const f = [[a1 * 10, b1 * 10], [a2, b1 * 10], [a1 * 10, b2], [a2, b2]][hi * 2 + hj];
    return num(`Find the missing part, then ${a} ${X} ${b}.`, [{label: `${f[0]} ${X} ${f[1]} =`, ans: P[hi][hj]}, {label: `${a} ${X} ${b} =`, ans: a * b}],
      `${f[0]} ${X} ${f[1]} = ${P[hi][hj]}. Add all four parts: ${P.flat().join(' + ')} = ${fmt(a * b)}.`, {visual: pic}); } },
  b: { t: 'partial products', g: (R) => { const a = twoD(R), b = twoD(R), a1 = Math.floor(a / 10) * 10, a2 = a % 10, b1 = Math.floor(b / 10) * 10, b2 = b % 10;
    const parts = [[b2, a2], [b2, a1], [b1, a2], [b1, a1]], h = R.int(0, 3);
    const rows = parts.map(([x, y], i) => i === h ? {q: 4, note: `${x} ${X} ${y}`} : {t: String(x * y), note: `${x} ${X} ${y}`});
    return num('Find the missing partial product and the total.', [{label: `${parts[h][0]} ${X} ${parts[h][1]} =`, ans: parts[h][0] * parts[h][1]}, {label: `${a} ${X} ${b} =`, ans: a * b}],
      `The four parts are ${parts.map(([x, y]) => x * y).join(', ')}. They add to ${fmt(a * b)}.`, {visual: mulLayout(a, b, [...rows, {line: true}, {q: 4}])}); } },
  c: { t: 'standard algorithm', g: (R) => { const a = twoD(R), b = twoD(R), b1 = Math.floor(b / 10), b2 = b % 10;
    return num(`Finish the standard algorithm for ${a} ${X} ${b}.`, [{label: 'second row', ans: a * b1 * 10}, {label: 'product', ans: a * b}],
      `Row 1: ${a} ${X} ${b2} = ${a * b2}. Row 2: ${a} ${X} ${b1 * 10} = ${a * b1 * 10} (not ${a * b1}: the ${b1} is ${b1} ten${b1 === 1 ? '' : 's'}). Add: ${fmt(a * b)}.`, {visual: mulLayout(a, b, [{t: String(a * b2)}, {q: 4}, {line: true}, {q: 4}])}); } },
  d: { t: 'estimate and check', g: (R) => { const pk = () => 10 * R.int(1, 9) + R.pick([1, 2, 3, 4, 6, 7, 8, 9]); const a = pk(), b = pk(), e = r10(a) * r10(b);
    return num(`Estimate ${a} ${X} ${b} by rounding both to the nearest ten. Then find the exact product.`, [{label: 'estimate', ans: e}, {label: 'exact', ans: a * b}],
      `${r10(a)} ${X} ${r10(b)} = ${fmt(e)}. Exact: ${fmt(a * b)}, which is close.`); } },
}});

E2.skill({ id: 'II.2.13', name: 'Multi-digit multiplication', steps: {
  a: { t: '3-digit × 2-digit', g: (R) => { const a = R.int(101, 999), b = R.int(11, 99);
    return num(`${a} ${X} ${b} = ?`, a * b, `${a} ${X} ${b % 10} = ${fmt(a * (b % 10))} and ${a} ${X} ${b - b % 10} = ${fmt(a * (b - b % 10))}. Add: ${fmt(a * b)}.`, {visual: mulLayout(a, b, [{q: 5}])}); } },
  b: { t: 'with zeros', g: (R) => { const k = R.int(0, 2), x = R.int(1, 9), y = R.int(1, 9);
    const a = k === 0 ? x * 100 + y : k === 1 ? x * 100 + y * 10 : R.int(101, 999), b = k === 2 ? R.int(2, 9) * 10 : R.int(11, 99);
    return num(`${a} ${X} ${b} = ?`, a * b, `${a} ${X} ${b % 10} = ${fmt(a * (b % 10))} and ${a} ${X} ${b - b % 10} = ${fmt(a * (b - b % 10))}. Add: ${fmt(a * b)}. Keep the zeros in their places.`, {visual: mulLayout(a, b, [{q: 5}])}); } },
  c: { t: 'algorithm fluency', g: (R) => { const a = R.int(101, 999), b = twoD(R), b1 = Math.floor(b / 10), b2 = b % 10;
    return num(`Work out ${a} ${X} ${b} row by row.`, [{label: 'first row', ans: a * b2}, {label: 'second row', ans: a * b1 * 10}, {label: 'product', ans: a * b}],
      `${a} ${X} ${b2} = ${fmt(a * b2)}; ${a} ${X} ${b1 * 10} = ${fmt(a * b1 * 10)}, shifted one place left (not ${fmt(a * b1)}); sum ${fmt(a * b)}.`, {visual: mulLayout(a, b, [{q: 5}, {q: 5}, {line: true}, {q: 5}])}); } },
  d: { t: 'reasonableness', g: (R) => { const a = R.int(110, 990), b = R.int(12, 98), P = a * b, ea = lead(a), eb = r10(b);
    return choice(R, `Which answer to ${a} ${X} ${b} is reasonable?`, fmt(P), [fmt(Math.round(P / 10)), fmt(P * 10), fmt(a * (b % 10) + Math.floor(b / 10) * a)],
      `${a} ${X} ${b} is about ${ea} ${X} ${eb} = ${fmt(ea * eb)}, so ${fmt(P)} fits.`); } },
}});

E2.skill({ id: 'II.2.14', name: 'Multiplication problems', steps: {
  a: { t: 'equal groups', g: (R) => { const g = R.int(2, 10), p = R.int(2, 10), [what, box] = R.pick([['pencils', 'boxes'], ['apples', 'bags'], ['eggs', 'cartons'], ['cards', 'packs'], ['flowers', 'vases']]);
    return num(`There are ${g} ${box} with ${p} ${what} in each. How many ${what} in all?`, g * p, `${g} groups of ${p}: ${g} ${X} ${p} = ${g * p}.`); } },
  b: { t: 'arrays', g: (R) => { const r = R.int(3, 9), c = R.bool(0.6) ? R.int(3, 10) : R.int(11, 25), [s, what] = R.pick([['A garden has', 'plants'], ['A hall has', 'chairs'], ['A wall has', 'tiles'], ['A box has', 'chocolates']]);
    return num(`${s} ${r} rows of ${c} ${what}. How many ${what}?`, r * c, `${r} rows ${X} ${c} in each row = ${r * c}.`); } },
  c: { t: '"times as many"', g: (R, O) => { const [A, B] = R.sample(NAMES, 2), x = R.int(3, 25), k = R.int(2, 9), u = O.units === 'imperial' ? 'lb' : 'kg';
    const kk = R.int(0, 2);
    if (kk === 2) return choice(R, `${A} has ${x} stickers. ${B} has ${k} times as many. How many stickers does ${B} have?`, k * x, [k + x, k * x + x, (k - 1) * x],
      `${k} times as many means ${k} groups of ${x}: ${k} ${X} ${x} = ${k * x}, not ${x} + ${k} = ${x + k}.`);
    if (kk === 1) return num(`${A} has ${x} stickers. ${B} has ${k} times as many. How many stickers does ${B} have?`, k * x, `${k} times as many as ${x} is ${k} ${X} ${x} = ${k * x} (not ${x} + ${k}).`);
    return num(`A puppy weighs ${x} ${u}. Its mother weighs ${k} times as much. How many ${u} is the mother?`, k * x, `${k} ${X} ${x} = ${k * x} ${u}.`); } },
  d: { t: 'multi-step', g: (R, O) => { const k = R.int(0, 2), N = R.pick(NAMES);
    if (k === 0) { const p = R.int(4, 12), g = R.int(3, 9), e = R.int(2, p * g - 5); return num(`Juice comes in packs of ${p}. ${N} buys ${g} packs and hands out ${e}. How many are left?`, p * g - e, `${g} ${X} ${p} = ${p * g}, then ${p * g} − ${e} = ${p * g - e}.`); }
    if (k === 1) { const [x, y] = R.distinct(3, 15, 2), a = R.int(2, 6), b = R.int(2, 6); return num(`Adult tickets cost ${money(O, x)} and child tickets cost ${money(O, y)}. What do ${a} adults and ${b} children pay in all?`, a * x + b * y, `${a} ${X} ${x} = ${a * x}, ${b} ${X} ${y} = ${b * y}; ${a * x} + ${b * y} = ${a * x + b * y}.`); }
    const r = R.int(3, 9), c = R.int(4, 12), e = R.int(2, 15); return num(`A hall has ${r} rows of ${c} chairs and ${e} extra chairs. How many chairs?`, r * c + e, `${r} ${X} ${c} = ${r * c}, then + ${e} = ${r * c + e}.`); } },
}});

E2.skill({ id: 'II.2.15', name: 'Multiplication patterns', steps: {
  a: { t: 'in the times table', g: (R) => { const t = R.int(2, 10), s = R.int(1, 6);
    if (R.bool(0.6)) return num(`Continue the pattern: ${[0, 1, 2, 3].map(i => t * (s + i)).join(', ')}, ?`, t * (s + 4), `Each number is ${t} more: ${t * (s + 3)} + ${t} = ${t * (s + 4)}.`);
    const k = R.int(3, 9), off = [1, 2, -1].filter(d => (t * k + d) % t !== 0);
    return choice(R, `Which number is in the ${t} times table?`, t * k, off.map(d => t * k + d).concat([t * k + t + 1]).filter(v => v % t !== 0), `${t} ${X} ${k} = ${t * k}.`); } },
  b: { t: 'even and odd products', g: (R) => { const oo = R.bool(0.45), odd = () => R.pick([3, 5, 7, 9, 11, 13, 15]), a = oo ? odd() : R.int(2, 15), b = oo ? odd() : R.int(2, 15), even = (a * b) % 2 === 0;
    const why = even ? `At least one factor (${a % 2 ? b : a}) is even, so the product is even: ${a * b}.` : `Odd ${X} odd is always odd, even though odd + odd is even: ${a} ${X} ${b} = ${a * b}.`;
    return choiceFixed(`Without multiplying: is ${a} ${X} ${b} even or odd?`, ['even', 'odd'], even ? 0 : 1, why); } },
  c: { t: 'doubling and halving', g: (R) => { const a = 2 * R.int(6, 24), b = R.pick([5, 5, 25, 50]);
    if (R.bool()) return num(`${a} ${X} ${b} = ${a / 2} ${X} ?`, 2 * b, `Halve ${a} to get ${a / 2}, so double ${b} to ${2 * b}.`);
    return num(`Find ${a} ${X} ${b} by halving ${a} and doubling ${b}.`, a * b, `${a / 2} ${X} ${2 * b} = ${fmt(a * b)}.`); } },
  d: { t: 'explain a pattern', g: (R) => { const k = R.int(0, 3);
    if (k === 0) { const a = R.int(2, 5), n = R.int(3, 9);
      return choice(R, `${a} ${X} ${n} = ${a * n} and ${2 * a} ${X} ${n} = ${2 * a * n}. Why is the second product double?`, `${2 * a} is double ${a}, so there are twice as many groups of ${n}.`,
        [`${n} was doubled.`, `You add 2 to the first product.`, `Every product in a times table is double the last.`], `${2 * a} groups of ${n} is two lots of ${a} groups of ${n}.`); }
    if (k === 1) { const n = R.int(3, 9);
      return choice(R, `${n + 1} ${X} ${n} is ${n} more than ${n} ${X} ${n}. Why?`, `${n + 1} groups of ${n} is one more group of ${n}.`,
        [`${n + 1} is 1 more than ${n}, so add 1.`, `Square numbers always go up by ${n}.`, `You add the two factors.`], `${n} ${X} ${n} = ${n * n}; one more group of ${n} makes ${n * n + n}.`); }
    if (k === 2) { const t = R.pick([4, 6, 8]);
      return choice(R, `Every product in the ${t} times table is even. Why?`, `${t} = 2 ${X} ${t / 2}, so every product is a number of 2s.`,
        [`${t} is bigger than 3.`, `All times tables have only even products.`, `The products all end in ${t}.`], `${t} ${X} n = 2 ${X} (${t / 2} ${X} n), and any number of 2s is even.`); }
    const s = R.int(1, 7);
    return choice(R, `The ${5} times table goes ${[0, 1, 2, 3].map(i => 5 * (s + i)).join(', ')}, … Why do the ones digits switch between 5 and 0?`, `Two 5s make 10, so every second step lands on a ten.`,
      [`5 is an odd number.`, `You add 10 each time.`, `The tens digit goes up by 5.`], `Adding 5 twice adds 10, so the ones digit switches between 5 and 0.`); } },
}});
})();

/* Era II · Unit II.3 Division */
(function(){ const {num, choiceFixed, tf, fh, fmt, V, C} = E2;
// at most 3 distractors (4 choices), best ones listed first; duplicates of the answer dropped
const choice = (R, p, c, ds, ex, extra) => { const seen = new Set([String(c)]), keep = [];
  ds.forEach(d => { if (!seen.has(String(d))) { seen.add(String(d)); keep.push(d); } });
  return E2.choice(R, p, c, keep.slice(0, 3), ex, extra); };
const ONE = {boxes: 'box', shelves: 'shelf', plates: 'plate', bags: 'bag', cups: 'cup', packs: 'pack', pages: 'page'};
const X = '×', D = '÷', M = '−';
const NAMES = ['Ana', 'Ben', 'Mia', 'Leo', 'Sara', 'Tom', 'Kim', 'Raj', 'Noor', 'Eli'];
const money = (O, n) => O.coins === 'THB' ? `${fmt(n)} baht` : `$${fmt(n)}`;
const again = (id, k, R, O) => E2.byId[id].steps[k].g(R, O);

/* ---------- VD_ visual helpers (unit II.3) ---------- */
const VD = {};
const qbox = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="${C.amber}"/>` + V.text(x + w / 2, y + h / 2, '?', {size: 18, weight: 700});
// n loose dots (rows of 10) above g empty plates
VD.share = function (n, g, o = {}) {
  const s = 22, per = 10, rows = Math.ceil(n / per); let body = '';
  for (let i = 0; i < n; i++) body += V.dot(14 + (i % per) * s, 14 + Math.floor(i / per) * s, 8, o.color || C.red);
  const y = rows * s + 22, pw = 70, gap = 14;
  for (let k = 0; k < g; k++) body += `<ellipse cx="${6 + pw / 2 + k * (pw + gap)}" cy="${y + 24}" rx="${pw / 2}" ry="22" fill="${C.faint}" stroke="${C.muted}" stroke-width="2"/>`;
  return V.svg(Math.max(per * s + 8, g * (pw + gap) - gap + 12), y + 50, body, `${n} dots and ${g} empty plates`);
};
// g plates with `per` dots each
VD.plates = function (g, per) {
  const s = 17, pw = Math.max(76, Math.min(per, 5) * s + 18), ph = Math.ceil(per / 5) * s + 20, gap = 12, perRow = Math.min(g, 5); let body = '';
  for (let k = 0; k < g; k++) {
    const x0 = 2 + (k % perRow) * (pw + gap), y0 = 2 + Math.floor(k / perRow) * (ph + gap);
    body += `<rect x="${x0}" y="${y0}" width="${pw}" height="${ph}" rx="${ph / 2 > 20 ? 20 : ph / 2}" fill="${C.faint}" stroke="${C.muted}" stroke-width="2"/>`;
    const cols = Math.min(per, 5), x1 = x0 + (pw - cols * s) / 2;
    for (let i = 0; i < per; i++) body += V.dot(x1 + s / 2 + (i % 5) * s, y0 + 10 + s / 2 + Math.floor(i / 5) * s, 7, C.blue);
  }
  return V.svg(perRow * (pw + gap) - gap + 4, Math.ceil(g / perRow) * (ph + gap) - gap + 4, body, `${g} plates of ${per}`);
};
// base-ten blocks: t rods and o cubes
VD.blocks = function (t, o) {
  const u = 11, L = 10 * u, st = `stroke="${C.ink}" stroke-width="1.2"`; let body = '', x = 4;
  for (let i = 0; i < t; i++) { body += `<rect x="${x}" y="4" width="${u}" height="${L}" fill="${C.blue}" ${st}/>`; for (let k = 1; k < 10; k++) body += `<line x1="${x + 1}" y1="${4 + k * u}" x2="${x + u - 1}" y2="${4 + k * u}" stroke="#fff" stroke-opacity=".75"/>`; x += u + 7; }
  x += t && o ? 14 : 0;
  for (let i = 0; i < o; i++) body += `<rect x="${x + Math.floor(i / 5) * (u + 4)}" y="${4 + L - (i % 5 + 1) * (u + 4) + 4}" width="${u}" height="${u}" fill="${C.red}" ${st}/>`;
  x += o ? Math.ceil(o / 5) * (u + 4) : 0;
  return V.svg(x + 4, L + 8, body, `${t} tens and ${o} ones`);
};
// column layout (same idea as the II.2 one): rows {t, op, note} | {line} | {q:k}
VD.vert = function (rows) {
  const cw = 24, rh = 36, pad = 10, len = r => (r.q ? r.q : r.t.length) + (r.op ? 1 : 0);
  const maxc = Math.max(...rows.filter(r => !r.line).map(len)), noteW = rows.some(r => r.note) ? 110 : 0, xr = pad + maxc * cw;
  let y = pad, body = '';
  rows.forEach(r => {
    if (r.line) { body += `<line x1="${xr - maxc * cw - 2}" y1="${y + 3}" x2="${xr + 4}" y2="${y + 3}" stroke="${C.ink}" stroke-width="2.5"/>`; y += 8; return; }
    const cy = y + rh / 2;
    if (r.q) body += qbox(xr - r.q * cw + 2, y + 4, r.q * cw - 4, rh - 8);
    else for (let i = 0; i < r.t.length; i++) { const ch = r.t[r.t.length - 1 - i]; if (ch !== ' ') body += V.text(xr - cw / 2 - i * cw, cy, ch, {size: 23, weight: 600}); }
    if (r.op) body += V.text(xr - maxc * cw + cw / 2, cy, r.op, {size: 22, weight: 600});
    if (r.note) body += V.text(xr + 16, cy, r.note, {size: 15, anchor: 'start', fill: C.muted});
    y += rh;
  });
  return V.svg(xr + pad + noteW, y + pad, body, 'written calculation');
};
// long division steps for n ÷ d → {q: quotient string aligned to the dividend's columns, rows:[{t,end,minus}]}
const ldSteps = (n, d) => {
  const s = String(n), L = s.length; let cur = 0, started = false, q = ''; const rows = [];
  for (let i = 0; i < L; i++) {
    cur = cur * 10 + +s[i];
    if (!started && cur < d && i < L - 1) { q += ' '; continue; }
    if (started) rows.push({t: String(cur), end: i});
    started = true;
    const qd = Math.floor(cur / d); q += qd;
    rows.push({t: String(qd * d), end: i, minus: true}); cur -= qd * d;
  }
  rows.push({t: String(cur), end: L - 1});
  return {q, rows};
};
// long-division bracket. o.q: quotient string (spaces = blank, '?' = box); o.rows: steps (t may be '?' with o.w digits box)
VD.longdiv = function (d, n, o = {}) {
  const cw = 26, rh = 34, s = String(n), L = s.length, ds = String(d), xL = 22 + ds.length * 15, top = 8;
  const cx = i => xL + 8 + i * cw + cw / 2;
  let body = '', y = top;
  const q = o.q === undefined ? '' : o.q;
  if (o.qBox) body += qbox(cx(L - o.qBox) - cw / 2 + 2, y + 3, o.qBox * cw - 4, rh - 6);
  else for (let i = 0; i < q.length; i++) { const ch = q[i], col = L - q.length + i; if (ch === ' ') continue; body += ch === '?' ? qbox(cx(col) - cw / 2 + 2, y + 3, cw - 4, rh - 6) : V.text(cx(col), y + rh / 2, ch, {size: 22, weight: 600}); }
  y += rh;
  body += `<path d="M${xL} ${y} L${xL + 8 + L * cw + 6} ${y} M${xL} ${y} Q${xL + 9} ${y + rh / 2} ${xL} ${y + rh}" fill="none" stroke="${C.ink}" stroke-width="2.5"/>`;
  body += V.text(xL - 8, y + rh / 2, ds, {size: 22, weight: 600, anchor: 'end'});
  for (let i = 0; i < L; i++) body += V.text(cx(i), y + rh / 2, s[i], {size: 22, weight: 600});
  y += rh;
  (o.rows || []).forEach(r => {
    const w = r.t === '?' ? (r.w || 2) : r.t.length;
    if (r.t === '?') body += qbox(cx(r.end - w + 1) - cw / 2 + 2, y + 3, w * cw - 4, rh - 6);
    else for (let i = 0; i < w; i++) body += V.text(cx(r.end - w + 1 + i), y + rh / 2, r.t[i], {size: 20, weight: 500});
    if (r.minus) { body += V.text(cx(r.end - w + 1) - cw * 0.85, y + rh / 2, M, {size: 20}); body += `<line x1="${cx(r.end - w + 1) - cw * 0.9}" y1="${y + rh + 1}" x2="${cx(r.end) + cw / 2}" y2="${y + rh + 1}" stroke="${C.ink}" stroke-width="2"/>`; }
    y += rh + (r.minus ? 4 : 0);
  });
  return V.svg(xL + 8 + L * cw + 14, y + 6, body, `long division ${n} divided by ${d}`);
};

/* ---------- II.3.01 – II.3.05 ---------- */
E2.skill({ id: 'II.3.01', name: 'Sharing equally', steps: {
  a: { t: 'share into 2', g: (R) => { const q = R.int(2, 10), n = 2 * q;
    return num(`Share ${n} dots equally onto 2 plates. How many go on each plate?`, q, `Deal them out one at a time: ${n} shared by 2 is ${q} each.`, {visual: VD.share(n, 2)}); } },
  b: { t: 'into 3 to 5 groups', g: (R) => { const g = R.int(3, 5), q = R.int(2, 6), n = g * q;
    return num(`Share ${n} dots equally onto ${g} plates. How many go on each plate?`, q, `${g} plates with ${q} each use all ${n}: ${g} ${X} ${q} = ${n}.`, {visual: VD.share(n, g)}); } },
  c: { t: 'how many in each', g: (R) => { const g = R.int(2, 6), q = R.int(2, 9), n = g * q, [what, who] = R.pick([['stickers', 'kids'], ['grapes', 'bowls'], ['books', 'shelves'], ['pencils', 'cups'], ['marbles', 'bags']]);
    return num(`${n} ${what} are shared equally among ${g} ${who}. How many does each get?`, q, `${n} ${D} ${g} = ${q}, because ${g} ${X} ${q} = ${n}.`); } },
  d: { t: 'write as division', g: (R) => { const g = R.int(2, 5), q = R.int(2, 6), n = g * q; if (g === q) return again('II.3.01', 'd', R);
    return choice(R, `${n} dots are shared onto ${g} plates. Which division matches?`, `${n} ${D} ${g} = ${q}`, [`${n} ${M} ${g} = ${n - g}`, `${g} ${D} ${n} = ${q}`, `${n} ${X} ${g} = ${n * g}`],
      `${n} shared into ${g} equal groups gives ${q} in each: ${n} ${D} ${g} = ${q}. The total comes first, never ${g} ${D} ${n}.`, {visual: VD.share(n, g)}); } },
}});

E2.skill({ id: 'II.3.02', name: 'Making groups', steps: {
  a: { t: 'groups of a given size', g: (R) => { const s = R.int(2, 6), k = R.int(2, 6), n = s * k;
    return num(`Make groups of ${s} from these ${n} dots. How many groups can you make?`, k, `Count by ${s}s up to ${n}: that is ${k} groups.`, {visual: V.dots(n, {layout: 'grid', per: s === 5 ? 6 : 5, r: 9})}); } },
  b: { t: 'how many groups', g: (R) => { const s = R.int(2, 9), k = R.int(2, 9), n = s * k, [what, box] = R.pick([['eggs', 'boxes'], ['kids', 'teams'], ['cupcakes', 'trays'], ['socks', 'piles'], ['cards', 'packs']]);
    return num(`${n} ${what} are put in ${box} of ${s}. How many ${box}?`, k, `${s} is the size of each group, so count how many ${s}s fit: ${n} ${D} ${s} = ${k}, because ${k} ${X} ${s} = ${n}.`); } },
  c: { t: 'write as division', g: (R) => { const s = R.int(2, 9), k = R.int(2, 9), n = s * k; if (s === k) return again('II.3.02', 'c', R);
    return choice(R, `${n} pencils go in packs of ${s}. Which division gives the number of packs?`, `${n} ${D} ${s} = ${k}`, [`${n} ${M} ${s} = ${n - s}`, `${s} ${D} ${n} = ${k}`, `${n} ${X} ${s} = ${n * s}`],
      `Find how many ${s}s are in ${n}: ${n} ${D} ${s} = ${k}.`); } },
  d: { t: 'sharing vs grouping', g: (R) => { const a = R.int(2, 9), b = R.int(2, 9), n = a * b, share = R.bool(), [what, box] = R.pick([['cookies', 'plates'], ['apples', 'bags'], ['books', 'shelves'], ['pens', 'cups']]);
    const p = share ? `${n} ${what} are shared equally onto ${a} ${box}. How many on each?` : `${n} ${what} go ${a} on each of some ${box}. How many ${box}?`;
    return choiceFixed(p + ' Is this sharing or grouping?', ['Sharing: the number of groups is known', 'Grouping: the size of each group is known'], share ? 0 : 1,
      share ? `We know there are ${a} ${box} and want how many on each: sharing.` : `We know each ${ONE[box]} gets ${a} and want how many ${box}: grouping.`); } },
}});

E2.skill({ id: 'II.3.03', name: 'Division as a missing factor', steps: {
  a: { t: '12 ÷ 3 means 3 × ? = 12', g: (R) => { const d = R.int(2, 10), q = R.int(2, 10), n = d * q;
    return num(`${n} ${D} ${d} = ? &nbsp;Think: ${d} ${X} ? = ${n}.`, q, `${d} ${X} ${q} = ${n}, so ${n} ${D} ${d} = ${q}.`); } },
  b: { t: 'fact families', g: (R) => { const [a, b] = R.distinct(2, 10, 2), n = a * b;
    if (R.bool()) return num(`${a} ${X} ${b} = ${n}. So ${n} ${D} ${a} = ?`, b, `Same fact family: ${n} ${D} ${a} = ${b}.`);
    const fam = R.shuffle([`${a} ${X} ${b} = ${n}`, `${b} ${X} ${a} = ${n}`, `${n} ${D} ${a} = ${b}`, `${n} ${D} ${b} = ${a}`]).slice(0, 3);
    return choice(R, `Which is NOT in the fact family of ${a}, ${b} and ${n}?`, R.pick([`${a} ${D} ${n} = ${b}`, `${n} ${M} ${a} = ${b}`, `${a} + ${b} = ${n}`]), fam,
      `The family is ${a} ${X} ${b} = ${n}, ${b} ${X} ${a} = ${n}, ${n} ${D} ${a} = ${b} and ${n} ${D} ${b} = ${a}. Division starts from ${n}, and + or ${M} is not part of it.`); } },
  c: { t: 'solve with facts', g: (R) => { const d = R.int(2, 10), q = R.int(2, 10), n = d * q;
    return num(`${n} ${D} ${d} = ?`, q, `${d} ${X} ${q} = ${n}.`); } },
  d: { t: 'unknown in any position', g: (R) => { const d = R.int(2, 10), q = R.int(2, 10), n = d * q, k = R.int(0, 3);
    if (k === 0) return num(`? ${D} ${d} = ${q}`, n, `${q} ${X} ${d} = ${n}.`);
    if (k === 1) return num(`${n} ${D} ? = ${q}`, d, `${q} ${X} ${d} = ${n}, so the divisor is ${d}.`);
    if (k === 2) return num(`${q} = ${n} ${D} ?`, d, `${n} ${D} ${d} = ${q}.`);
    return num(`${d} ${X} ? = ${n}`, q, `${n} ${D} ${d} = ${q}.`); } },
}});

const divQ = (R, ds, qlo = 2, qhi = 10) => { const d = R.pick(ds), q = R.int(qlo, qhi), n = d * q;
  if (R.bool(0.25)) return num(`? ${D} ${d} = ${q}`, n, `${q} ${X} ${d} = ${n}.`);
  return num(`${n} ${D} ${d} = ?`, q, `${d} ${X} ${q} = ${n}, so ${n} ${D} ${d} = ${q}.${d === 5 ? ` (Not half of ${n}: ask 5 times what is ${n}.)` : ''}`); };
E2.skill({ id: 'II.3.04', name: 'Division facts', steps: {
  a: { t: '÷ 1, 2, 5, 10', g: (R) => divQ(R, [1, 2, 5, 10]) },
  b: { t: '÷ 3 and 4', g: (R) => divQ(R, [3, 4]) },
  c: { t: '÷ 6 to 9', g: (R) => divQ(R, [6, 7, 8, 9]) },
  d: { t: 'from memory', g: (R) => divQ(R, [3, 4, 6, 7, 8, 9], 3, 10) },
}});

E2.skill({ id: 'II.3.05', name: 'Dividing with 0 and 1', steps: {
  a: { t: '÷ 1', g: (R) => { const n = R.int(2, 99);
    if (R.bool(0.3)) return num(`${n} ${D} ? = ${n}`, 1, `Only dividing by 1 leaves ${n} unchanged.`);
    return num(`${n} ${D} 1 = ?`, n, `${n} in 1 group is still ${n}.`); } },
  b: { t: 'n ÷ n', g: (R) => { const n = R.int(2, 99);
    if (R.bool(0.3)) return num(`${n} ${D} ? = 1`, n, `A number divided by itself is 1: ${n} ${D} ${n} = 1.`);
    return num(`${n} ${D} ${n} = ?`, 1, `${n} shared into ${n} groups gives 1 each.`); } },
  c: { t: '0 ÷ n', g: (R) => { const n = R.int(2, 50);
    if (R.bool()) return num(`0 ${D} ${n} = ?`, 0, `Sharing nothing into ${n} groups gives 0 in each.`);
    return choice(R, `Which is equal to 0?`, `0 ${D} ${n}`, [`${n} ${D} ${n}`, `${n} ${D} 1`], `0 shared into ${n} groups is 0. ${n} ${D} ${n} = 1 and ${n} ${D} 1 = ${n}.`); } },
  d: { t: 'why dividing by 0 fails', g: (R) => { const n = R.int(2, 40);
    if (R.bool()) return choice(R, `Why is ${n} ${D} 0 not a number?`, `No number times 0 makes ${n}.`, [`${n} ${D} 0 is 0, because of the 0.`, `${n} ${D} 0 is ${n}, like ${n} ${D} 1.`, `0 is smaller than ${n}.`],
      `${n} ${D} 0 = ? would need ? ${X} 0 = ${n}, but anything times 0 is 0.`);
    return choice(R, `0 ${D} ${n} = 0, but ${n} ${D} 0 has no answer. Why?`, `0 ${X} ${n} = 0 works, but nothing times 0 gives ${n}.`, [`Big numbers can't be divided by small ones.`, `0 ${D} ${n} and ${n} ${D} 0 are both 0.`, `Dividing by 0 always gives 1.`],
      `Check with multiplication: 0 ${X} ${n} = 0, but ? ${X} 0 = ${n} has no answer.`); } },
}});

/* ---------- II.3.06 – II.3.07 remainders ---------- */
const rq = (R, dlo, dhi, qlo, qhi) => { const d = R.int(dlo, dhi), q = R.int(qlo, qhi), r = R.int(1, d - 1); return {d, q, r, n: d * q + r}; };
const QR = (q, r) => [{label: 'quotient', ans: q}, {label: 'remainder', ans: r}];
E2.skill({ id: 'II.3.06', name: 'Remainders', steps: {
  a: { t: 'leftovers', g: (R) => { const {d, q, r, n} = rq(R, 3, 6, 2, 5);
    return num(`${n} apples go into bags of ${d}. How many are left over?`, r, `${q} bags use ${d * q}. ${n} ${M} ${d * q} = ${r} left.`, {visual: V.dots(n, {layout: 'grid', per: 10, r: 9})}); } },
  b: { t: 'write with R', g: (R) => { const {d, q, r, n} = rq(R, 3, 9, 2, 9);
    if (R.bool()) return num(`${n} ${D} ${d} = ? R ? &nbsp;Give the quotient and the remainder.`, QR(q, r), `${d} ${X} ${q} = ${d * q}, and ${n} ${M} ${d * q} = ${r}. So ${q} R ${r}.`);
    return choice(R, `Which is ${n} ${D} ${d}? (R means remainder.)`, `${q} R ${r}`, [`${q} R ${r + d}`.replace(`${q} R ${r + d}`, `${q - 1} R ${r + d}`), `${q + 1} R ${r}`, `${q} R ${d - r === r ? r + 1 : d - r}`],
      `${d} ${X} ${q} = ${d * q}, ${r} left over: ${q} R ${r}.`); } },
  c: { t: 'remainder smaller than divisor', g: (R) => { const k = R.int(0, 2), d = R.int(3, 9);
    if (k === 0) return num(`What is the largest remainder you can get when dividing by ${d}?`, d - 1, `A remainder must be less than ${d}, so ${d - 1} is the largest.`);
    if (k === 1) return choice(R, `Which could be a remainder when dividing by ${d}?`, d - R.int(1, Math.min(3, d - 1)), [d, d + 1, d + 2], `The remainder must be less than ${d}.`);
    const q = R.int(2, 8), r = R.int(0, d - 1), n = d * (q + 1) + r;
    return num(`Ali wrote ${n} ${D} ${d} = ${q} R ${r + d}. The remainder is too big. Fix it.`, QR(q + 1, r), `${r + d} is ${d} too many left over, so one more group: ${q + 1} R ${r}.`); } },
  d: { t: 'check: quotient × divisor + remainder', g: (R) => { const {d, q, r, n} = rq(R, 3, 9, 3, 12), k = R.int(0, 2);
    if (k === 0) return num(`${n} ${D} ${d} = ${q} R ${r}. Check: ${q} ${X} ${d} + ${r} = ?`, n, `${q} ${X} ${d} = ${q * d}, + ${r} = ${n}. It matches.`);
    if (k === 1) return num(`? ${D} ${d} = ${q} R ${r}. What is the number?`, n, `${q} ${X} ${d} + ${r} = ${q * d} + ${r} = ${n}.`);
    const wrong = R.bool(), rr = wrong ? (r + 1) % d || 1 : r;
    return tf(`True or false: ${n} ${D} ${d} = ${q} R ${rr}. Check by multiplying.`, !wrong || rr === r, `${q} ${X} ${d} + ${rr} = ${q * d + rr}${q * d + rr === n ? ', which matches' : `, not ${n}`}.`); } },
}});

const RCTX = {
  up: [
    (n, d) => [`${n} people need a ride. Each van holds ${d}. How many vans are needed?`, 'vans'],
    (n, d) => [`${n} books go in boxes of ${d}. How many boxes are needed to pack them all?`, 'boxes'],
    (n, d) => [`${n} kids sit at tables of ${d}. How many tables are needed so everyone sits?`, 'tables'],
    (n, d) => [`A lift carries ${d} people at a time. How many trips for ${n} people?`, 'trips'],
  ],
  drop: [
    (n, d, O) => [`You have ${money(O, n)}. A book costs ${money(O, d)}. How many books can you buy?`, 'books'],
    (n, d) => [`${n} eggs go in cartons of ${d}. How many full cartons?`, 'cartons'],
    (n, d) => [`${n} kids make teams of ${d}. How many full teams?`, 'teams'],
    (n, d) => [`${n} flowers make bunches of ${d}. How many full bunches?`, 'bunches'],
  ],
  frac: [
    (n, d) => [`${n} pizzas are shared equally by ${d} people. How much pizza does each get?`, 'pizzas'],
    (n, d, O) => { const u = O && O.units === 'imperial' ? 'ft' : 'm'; return [`${n} ${u} of ribbon is cut into ${d} equal pieces. How long is each piece, in ${u}?`, u]; },
    (n, d) => [`${n} cakes are shared equally by ${d} friends. How much cake does each get?`, 'cakes'],
  ],
  rem: [
    (n, d) => [`${n} stickers are shared equally by ${d} kids. How many stickers are left over?`, 'stickers'],
    (n, d) => [`${n} cards are dealt equally to ${d} players. How many cards are left over?`, 'cards'],
  ],
};
E2.skill({ id: 'II.3.07', name: 'Interpreting remainders', steps: {
  a: { t: 'round up (buses)', g: (R) => { const {d, q, r, n} = rq(R, 4, 12, 2, 8), [p] = R.pick(RCTX.up)(n, d);
    return num(p, q + 1, `${n} ${D} ${d} = ${q} R ${r}. The ${r} left over still ${r === 1 ? 'needs' : 'need'} one more, so ${q + 1}.`); } },
  b: { t: 'drop it', g: (R, O) => { const {d, q, r, n} = rq(R, 3, 12, 2, 9), [p] = R.pick(RCTX.drop)(n, d, O);
    return num(p, q, `${n} ${D} ${d} = ${q} R ${r}. The ${r} left over is not enough for another, so ${q}.`); } },
  c: { t: 'share it as a fraction', g: (R, O) => { let x; do { x = rq(R, 2, 6, 1, 4); } while (E2.gcd(x.r, x.d) !== 1); const {d, q, r, n} = x, [p] = R.pick(RCTX.frac)(n, d, O);
    return num(p + ' Write it as a mixed number.', [E2.frac(n, d, 'mixed')], `${n} ${D} ${d} = ${q} R ${r}. Cut up the ${r} left over too: each gets ${fh(r, d)} more, so ${fh(r, d, q)}.`); } },
  d: { t: 'choose which', g: (R, O) => { const kind = R.pick(['up', 'drop', 'frac', 'rem']); let x; do { x = kind === 'frac' ? rq(R, 2, 6, 1, 5) : rq(R, 3, 9, 2, 9); } while (E2.gcd(x.r, x.d) !== 1); const {d, q, r, n} = x, [p] = R.pick(RCTX[kind])(n, d, O);
    const opts = {up: String(q + 1), drop: String(q), frac: `${q} ${fh(r, d)}`, rem: String(r)};
    const why = {up: `the ${r} left over still ${r === 1 ? 'needs' : 'need'} one more`, drop: `the ${r} left over is not enough for a full one`, frac: `the ${r} left over can be cut and shared`, rem: `the question asks for the ${r} left over`};
    const ds = Object.keys(opts).filter(k => k !== kind && (kind !== 'frac' ? k !== 'frac' || R.bool() : true)).map(k => opts[k]);
    return choice(R, p, opts[kind], ds, `${n} ${D} ${d} = ${q} R ${r}; ${why[kind]}.`); } },
}});

/* ---------- II.3.08 – II.3.11 ---------- */
E2.skill({ id: 'II.3.08', name: 'Divide multiples of 10', steps: {
  a: { t: '60 ÷ 3', g: (R) => { const d = R.int(2, 9), q = R.int(2, 9), n = d * q * 10;
    return num(`${n} ${D} ${d} = ?`, q * 10, `${n} is ${d * q} tens. ${d * q} tens ${D} ${d} = ${q} tens = ${q * 10}.`); } },
  b: { t: '600 ÷ 3', g: (R) => { const d = R.int(2, 9), q = R.int(2, 9), n = d * q * 100;
    return num(`${fmt(n)} ${D} ${d} = ?`, q * 100, `${fmt(n)} is ${d * q} hundreds. ${d * q} hundreds ${D} ${d} = ${q} hundreds = ${q * 100}.`); } },
  c: { t: '240 ÷ 40', g: (R) => { const d = R.int(2, 9), q = R.int(2, 9), n = d * q * 10;
    return num(`${n} ${D} ${d * 10} = ?`, q, `${d * q} tens ${D} ${d} tens = ${d * q} ${D} ${d} = ${q}.`); } },
  d: { t: 'patterns with zeros', g: (R) => { const d = R.int(2, 9), q = R.int(2, 9), n = d * q;
    if (R.bool()) return num(`Use ${n} ${D} ${d} = ${q} to finish the pattern.`, [{label: `${n * 10} ${D} ${d} =`, ans: q * 10}, {label: `${fmt(n * 100)} ${D} ${d} =`, ans: q * 100}, {label: `${fmt(n * 1000)} ${D} ${d} =`, ans: q * 1000}],
      `Each extra zero in the number being divided adds a zero to the answer.`);
    return num(`Use ${n} ${D} ${d} = ${q} to finish the pattern.`, [{label: `${n * 10} ${D} ${d * 10} =`, ans: q}, {label: `${fmt(n * 100)} ${D} ${d * 10} =`, ans: q * 10}, {label: `${fmt(n * 1000)} ${D} ${d * 100} =`, ans: q * 10}],
      `Cross off the same number of zeros from both numbers first: ${fmt(n * 1000)} ${D} ${d * 100} = ${n * 10} ${D} ${d} = ${q * 10}.`); } },
}});

E2.skill({ id: 'II.3.09', name: 'Two-digit by one-digit division', steps: {
  a: { t: 'with place value blocks', g: (R) => { let d, q; if (R.bool(0.65)) { d = R.int(2, 4); const qt = R.int(1, Math.floor(9 / d)), qo = R.int(0, Math.floor(9 / d)); q = 10 * qt + qo; } else { d = R.int(2, 5); q = R.int(11, Math.floor(99 / d)); }
    const n = d * q, t = Math.floor(n / 10), o = n % 10, qt = Math.floor(t / d), lt = t - qt * d;
    const ex = lt ? `Share the tens: ${qt} each, ${lt} ten${lt > 1 ? 's' : ''} left. Trade for ${lt * 10} ones${o ? ` and add the ${o}` : ''}: ${lt * 10 + o} ones ${D} ${d} = ${(lt * 10 + o) / d} each. So ${q}.` : `${t} tens ${D} ${d} = ${qt} ten${qt > 1 ? 's' : ''}; ${o} ones ${D} ${d} = ${o / d} one${o / d === 1 ? '' : 's'}. So ${q}.`;
    return num(`Share the blocks into ${d} equal groups. ${n} ${D} ${d} = ?`, q, ex, {visual: VD.blocks(t, o)}); } },
  b: { t: 'partial quotients', g: (R) => { const d = R.int(2, 8), q = R.int(11, Math.floor(99 / d)); if (q % 10 === 0) return again('II.3.09', 'b', R);
    const n = d * q, c = Math.floor(q / 10) * 10, left = n - c * d;
    return num(`Find ${n} ${D} ${d}. First take ${c} groups of ${d}.`, [{label: `${left} ${D} ${d} =`, ans: q - c}, {label: `${n} ${D} ${d} =`, ans: q}],
      `${c} ${X} ${d} = ${c * d}, leaving ${left}. ${left} ${D} ${d} = ${q - c}. Total ${c} + ${q - c} = ${q}.`, {visual: VD.vert([{t: String(n)}, {t: String(c * d), op: M, note: `${c} ${X} ${d}`}, {line: true}, {t: String(left)}, {q: 2, op: M, note: `? ${X} ${d}`}, {line: true}, {t: '0'}])}); } },
  c: { t: 'long division', g: (R) => { const d = R.int(2, 7), q = R.int(11, Math.floor(99 / d)), n = d * q, L = ldSteps(n, d);
    if (R.bool()) return num(`Use long division: ${n} ${D} ${d} = ?`, q, `${Math.floor(n / 10)} tens ${D} ${d} = ${Math.floor(n / 10 / d)} R ${Math.floor(n / 10) % d}; bring down the ${n % 10} to get ${(Math.floor(n / 10) % d) * 10 + n % 10}, ${D} ${d} = ${q % 10}. Answer ${q}.`, {visual: VD.longdiv(d, n, {qBox: 2})});
    const rows = [L.rows[0], {t: '?', end: 1, w: 2}];
    return num(`${n} ${D} ${d}: subtract, then bring down the ones. What number do you divide next?`, +L.rows[1].t, `${Math.floor(n / 10)} ${M} ${L.rows[0].t} = ${Math.floor(n / 10) % d}; bring down ${n % 10} to make ${L.rows[1].t}.`, {visual: VD.longdiv(d, n, {q: L.q[0] + ' ', rows})}); } },
  d: { t: 'with remainders', g: (R) => { const d = R.int(3, 9), q = R.int(Math.max(4, Math.ceil(10 / d)), Math.floor(98 / d)), r = R.int(1, d - 1), n = d * q + r; if (n > 99) return again('II.3.09', 'd', R);
    return num(`${n} ${D} ${d} = ? R ?`, QR(q, r), `${d} ${X} ${q} = ${d * q}, and ${n} ${M} ${d * q} = ${r}, which is less than ${d}.`, {visual: VD.longdiv(d, n, {qBox: 2})}); } },
}});

const zeroQ = R => { const k = R.int(0, 2), a = R.int(1, 9), b = R.int(1, 9); return k === 0 ? a * 100 + b : k === 1 ? a * 100 + b * 10 : a * 10; };
E2.skill({ id: 'II.3.10', name: 'Long division by one digit', steps: {
  a: { t: '3-digit ÷ 1-digit', g: (R) => { const d = R.int(2, 9), q = R.int(Math.max(12, Math.ceil(100 / d)), Math.floor(999 / d)), n = d * q; if (/0/.test(String(q))) return again('II.3.10', 'a', R);
    return num(`Use long division: ${n} ${D} ${d} = ?`, q, `Divide, multiply, subtract, bring down, place by place: ${n} ${D} ${d} = ${q}. Check: ${q} ${X} ${d} = ${n}.`, {visual: VD.longdiv(d, n, {qBox: 3})}); } },
  b: { t: '4-digit', g: (R) => { const d = R.int(2, 9), q = R.int(Math.ceil(1000 / d), Math.floor(9999 / d)), n = d * q; if (/0/.test(String(q))) return again('II.3.10', 'b', R);
    const L = ldSteps(n, d);
    if (R.bool(0.35)) { const i = R.int(0, L.q.trim().length - 1), qs = L.q.trim(), pos = L.q.length - qs.length + i;
      return num(`${fmt(n)} ${D} ${d}. Which digit goes in the box?`, +qs[i], `${fmt(n)} ${D} ${d} = ${q}. Check: ${q} ${X} ${d} = ${fmt(n)}.`, {visual: VD.longdiv(d, n, {q: L.q.slice(0, pos) + '?' + L.q.slice(pos + 1)})}); }
    return num(`Use long division: ${fmt(n)} ${D} ${d} = ?`, q, `Work place by place: ${fmt(n)} ${D} ${d} = ${q}. Check: ${q} ${X} ${d} = ${fmt(n)}.`, {visual: VD.longdiv(d, n, {qBox: 4})}); } },
  c: { t: 'zeros in the quotient', g: (R) => { const q = zeroQ(R), d = R.int(2, 9), n = q * d; if (n > 9999 || n < 100) return again('II.3.10', 'c', R);
    const nz = +String(q).replace(/0/g, '');
    const wrong = [nz, q * 10, +String(q).replace(/0/, '00')].filter(v => v !== q);
    if (R.bool()) return choice(R, `${fmt(n)} ${D} ${d} = ?`, fmt(q), wrong.map(fmt), `Where ${d} doesn't go into a place, write 0 there; don't skip it (${fmt(nz)} is the classic slip). Check: ${q} ${X} ${d} = ${fmt(n)}.`);
    return num(`Use long division: ${fmt(n)} ${D} ${d} = ?`, q, `Where a part is too small to divide, write 0 in the quotient. ${q} ${X} ${d} = ${fmt(n)}.`, {visual: VD.longdiv(d, n, {qBox: String(q).length})}); } },
  d: { t: 'check by multiplying', g: (R) => { const d = R.int(3, 9), q = R.int(Math.ceil(100 / d) + 5, Math.floor(9999 / d)), n = d * q;
    if (R.bool()) return num(`Check ${fmt(n)} ${D} ${d} = ${q}. What is ${q} ${X} ${d}?`, n, `${q} ${X} ${d} = ${fmt(n)}, so the division is right.`);
    const bad = R.bool(), shown = bad ? q + R.pick([-10, -1, 1, 10]) : q;
    return tf(`True or false: ${fmt(n)} ${D} ${d} = ${shown}. Check by multiplying.`, !bad, `${shown} ${X} ${d} = ${fmt(shown * d)}${bad ? `, not ${fmt(n)}` : `, which matches`}.`); } },
}});

E2.skill({ id: 'II.3.11', name: 'Division by two digits', steps: {
  a: { t: 'estimate the quotient', g: (R) => { const Dv = 10 * R.int(2, 9), q = R.int(2, 9), sc = R.pick([1, 10]), dv = Dv + R.pick([-3, -2, -1, 1, 2, 3]), n = Dv * q * sc + R.int(-8, 8) * sc;
    if (n < 100) return again('II.3.11', 'a', R);
    return choice(R, `Which is the best estimate for ${fmt(n)} ${D} ${dv}?`, `about ${q * sc}`, [`about ${q * sc * 10}`, `about ${sc === 1 ? q * 100 : q}`],
      `${dv} is about ${Dv}. ${fmt(Dv * q * sc)} ${D} ${Dv} = ${q * sc}.`); } },
  b: { t: 'partial quotients', g: (R) => { const dv = R.int(12, 35), q = R.int(11, 39); if (q % 10 === 0) return again('II.3.11', 'b', R);
    const n = dv * q, c = Math.floor(q / 10) * 10, left = n - c * dv;
    return num(`Find ${fmt(n)} ${D} ${dv}. First take ${c} groups of ${dv}.`, [{label: `${fmt(n)} ${M} ${c * dv} =`, ans: left}, {label: `${fmt(n)} ${D} ${dv} =`, ans: q}],
      `${c} ${X} ${dv} = ${c * dv}, leaving ${left}. ${left} ${D} ${dv} = ${q - c}. Total ${c} + ${q - c} = ${q}.`, {visual: VD.vert([{t: String(n)}, {t: String(c * dv), op: M, note: `${c} ${X} ${dv}`}, {line: true}, {q: 3}])}); } },
  c: { t: 'long division', g: (R) => { const dv = R.int(12, 49), q = R.int(12, 99), n = dv * q;
    return num(`Use long division: ${fmt(n)} ${D} ${dv} = ?`, q, `${dv} ${X} ${Math.floor(q / 10) * 10} = ${dv * Math.floor(q / 10) * 10}, and ${dv} ${X} ${q % 10} = ${dv * (q % 10)}. So ${q}. Check: ${q} ${X} ${dv} = ${fmt(n)}.`, {visual: VD.longdiv(dv, n, {qBox: 2})}); } },
  d: { t: 'adjust an estimate', g: (R) => { const dv = R.int(12, 49), q = R.int(3, 8), r = R.int(0, dv - 1), n = dv * q + r, up = R.bool();
    if (up) return num(`For ${n} ${D} ${dv} you try ${q + 1}: ${q + 1} ${X} ${dv} = ${(q + 1) * dv}. Too big. Find the quotient and remainder.`, QR(q, r), `${(q + 1) * dv} is more than ${n}, so use one less. Try ${q}: ${q} ${X} ${dv} = ${q * dv}, and ${n} ${M} ${q * dv} = ${r}.`);
    return num(`For ${n} ${D} ${dv} you try ${q - 1}: ${q - 1} ${X} ${dv} = ${(q - 1) * dv}, leaving ${n - (q - 1) * dv}. Too small. Find the quotient and remainder.`, QR(q, r), `${n - (q - 1) * dv} left is not less than ${dv}, so ${q - 1} is too small. Try ${q}: ${n} ${M} ${q * dv} = ${r}.`); } },
}});

/* ---------- II.3.12 divisibility ---------- */
const sumD = n => String(n).split('').reduce((a, b) => a + +b, 0);
const RULE = {
  2: n => `${n} ends in ${n % 10}, ${n % 2 ? 'an odd digit' : 'an even digit'}.`,
  5: n => `${n} ends in ${n % 10}; multiples of 5 end in 0 or 5.`,
  10: n => `${n} ends in ${n % 10}; multiples of 10 end in 0.`,
  3: n => `Digit sum ${String(n).split('').join(' + ')} = ${sumD(n)}${sumD(n) % 3 ? ', not' : ','} a multiple of 3.`,
  9: n => `Digit sum ${String(n).split('').join(' + ')} = ${sumD(n)}${sumD(n) % 9 ? ', not' : ','} a multiple of 9.`,
  4: n => `Last two digits ${String(n).slice(-2)}${(n % 100) % 4 ? ' are not' : ' are'} a multiple of 4.`,
  6: n => n % 2 ? `${n} is odd, so it fails the test for 2. A multiple of 6 must pass the tests for 2 and 3.` : `${n} is even, and its digit sum ${sumD(n)} is ${sumD(n) % 3 ? 'not ' : ''}a multiple of 3. A multiple of 6 must pass both tests.`,
};
const pickNum = (R, lo, hi, ok) => { for (let i = 0; i < 500; i++) { const n = R.int(lo, hi); if (ok(n)) return n; } throw new Error('pickNum'); };
const whichDiv = (R, k, trap) => { const lo = 100, hi = R.bool() ? 999 : 9999;
  const good = pickNum(R, lo, hi, n => n % k === 0), bads = [];
  while (bads.length < 3) { const b = pickNum(R, lo, hi, n => n % k !== 0 && (!trap || bads.length > 0 || trap(n))); if (!bads.includes(b)) bads.push(b); }
  return choice(R, `Which number is divisible by ${k}?`, good, bads, RULE[k](good)); };
E2.skill({ id: 'II.3.12', name: 'Divisibility rules', steps: {
  a: { t: '2, 5 and 10', g: (R) => { const k = R.pick([2, 5, 10]); return whichDiv(R, k, k === 10 ? n => n % 5 === 0 : k === 5 ? n => n % 2 === 0 : null); } },
  b: { t: '3 and 9', g: (R) => { const k = R.pick([3, 9]); return whichDiv(R, k, k === 9 ? n => n % 3 === 0 : null); } },
  c: { t: '4 and 6', g: (R) => { const k = R.pick([4, 6]); return whichDiv(R, k, k === 4 ? n => n % 2 === 0 : n => n % 3 === 0); } },
  d: { t: 'test a number', g: (R) => { const k = R.pick([2, 3, 4, 5, 6, 9, 10]);
    if (R.bool(0.3)) { const a = R.int(1, 9), b = R.int(0, 9), k3 = R.pick([3, 9]), s = a + b; let x = 0; while ((s + x) % k3) x++;
      return num(`${a}${b}_ : what is the smallest digit for _ that makes the number divisible by ${k3}?`, x, `${a} + ${b} = ${s}. The digit sum must be a multiple of ${k3}, so add ${x}: ${a}${b}${x}.`); }
    const yes = R.bool(), n = pickNum(R, 100, 9999, m => (m % k === 0) === yes);
    return choiceFixed(`Is ${n} divisible by ${k}?`, ['Yes', 'No'], yes ? 0 : 1, RULE[k](n)); } },
}});

/* ---------- II.3.13 – II.3.15 ---------- */
E2.skill({ id: 'II.3.13', name: 'Division problems', steps: {
  a: { t: 'equal sharing', g: (R) => { const g = R.int(2, 9), q = R.int(2, 10), n = g * q, [what, who] = R.pick([['stickers', 'kids'], ['marbles', 'jars'], ['beads', 'necklaces'], ['seeds', 'pots']]);
    return num(`${n} ${what} are shared equally among ${g} ${who}. How many for each?`, q, `${n} ${D} ${g} = ${q}.`); } },
  b: { t: 'grouping', g: (R) => { const s = R.int(2, 9), k = R.int(2, 10), n = s * k, [what, box, verb] = R.pick([['kids', 'teams', 'make teams of'], ['eggs', 'boxes', 'fill boxes of'], ['chairs', 'rows', 'go in rows of'], ['muffins', 'trays', 'fill trays of']]);
    return num(`${n} ${what} ${verb} ${s}. How many ${box}?`, k, `${n} ${D} ${s} = ${k}.`); } },
  c: { t: 'with remainders', g: (R) => { const {d, q, r, n} = rq(R, 3, 9, 3, 12), [what, box] = R.pick([['cards', 'packs'], ['pens', 'boxes'], ['apples', 'bags'], ['stamps', 'pages']]);
    return num(`${n} ${what} are put ${d} to a ${ONE[box]}. How many full ${box}, and how many ${what} are left?`, [{label: `full ${box}`, ans: q}, {label: 'left over', ans: r}], `${n} ${D} ${d} = ${q} R ${r}.`); } },
  d: { t: 'multi-step', g: (R, O) => { const k = R.int(0, 2);
    if (k === 0) { let g, q, b, tot; do { g = R.int(2, 9); q = R.int(2, 12); tot = g * q; b = R.pick([2, 3, 4, 5, 6].filter(x => tot % x === 0 && tot / x >= 3) .concat([0])); } while (!b);
      return num(`${b} boxes of ${tot / b} pens are shared equally into ${g} cups. How many pens in each cup?`, q, `${b} ${X} ${tot / b} = ${tot}, then ${tot} ${D} ${g} = ${q}.`); }
    if (k === 1) { const g = R.int(2, 6), q = R.int(3, 15), s = R.int(2, 20), T = s + g * q, N = R.pick(NAMES);
      return num(`${N} has ${money(O, T)} and spends ${money(O, s)}. The rest is shared equally by ${g} people. How much does each get?`, q, `${T} ${M} ${s} = ${T - s}, then ${T - s} ${D} ${g} = ${q}.`); }
    let r, c, kk; do { r = R.int(2, 8); c = R.int(3, 12); kk = R.int(2, 9); } while ((r * c) % kk || r * c / kk < 2 || kk === r);
    return num(`${r} rows of ${c} chairs are moved into ${kk} equal rows. How many chairs in each row?`, r * c / kk, `${r} ${X} ${c} = ${r * c}, then ${r * c} ${D} ${kk} = ${r * c / kk}.`); } },
}});

const OPS = ['+', M, X, D];
const OPCTX = [
  (R) => { const a = R.int(12, 60), b = R.int(12, 60); return [`${a} red and ${b} blue marbles are in a jar. How many marbles?`, 0, `Putting two amounts together: add.`]; },
  (R) => { const a = R.int(12, 60), b = R.int(12, 60); return [`A class has ${a} books and gets ${b} more. How many books now?`, 0, `Getting more: add.`]; },
  (R) => { const a = R.int(30, 90), b = R.int(5, 25); return [`There are ${a} marbles and ${b} are lost. How many are left?`, 1, `Taking some away: subtract.`]; },
  (R) => { const a = R.int(30, 90), b = R.int(5, 25), N = R.pick(NAMES); return [`${N} has ${a} cards. A friend has ${b}. How many more cards does ${N} have?`, 1, `Comparing two amounts: subtract.`]; },
  (R) => { const a = R.int(3, 9), b = R.int(4, 12); return [`${a} bags hold ${b} marbles each. How many marbles?`, 2, `Equal groups, find the total: multiply.`]; },
  (R) => { const a = R.int(3, 9), b = R.int(4, 12); return [`A tray has ${a} rows of ${b} cookies. How many cookies?`, 2, `Rows of equal size: multiply.`]; },
  (R) => { const a = R.int(3, 9), b = R.int(3, 9); return [`${a * b} marbles are shared equally into ${a} bags. How many in each bag?`, 3, `Sharing equally: divide.`]; },
  (R) => { const a = R.int(3, 9), b = R.int(3, 9); return [`${a * b} kids form teams of ${a}. How many teams?`, 3, `Making equal groups: divide.`]; },
];
E2.skill({ id: 'II.3.14', name: 'Mixed operations', steps: {
  a: { t: 'choose the operation', g: (R) => { const [p, k, ex] = R.pick(OPCTX)(R); return choiceFixed(`Which operation solves it? ${p}`, OPS, k, ex); } },
  b: { t: 'two-step problems', g: (R) => { const k = R.int(0, 3);
    if (k === 0) { const g = R.int(3, 8), p = R.int(4, 12), e = R.int(2, 9); return num(`${g} packs of ${p} cards and ${e} loose cards. How many cards?`, g * p + e, `${g} ${X} ${p} = ${g * p}, then + ${e} = ${g * p + e}.`); }
    if (k === 1) { const g = R.int(3, 8), q = R.int(3, 9), s = R.int(2, 12), T = g * q + s; return num(`There are ${T} cookies. ${s} are eaten and the rest go in bags of ${g}. How many bags?`, q, `${T} ${M} ${s} = ${T - s}, then ${T - s} ${D} ${g} = ${q}.`); }
    if (k === 2) { const r = R.int(4, 9), c = R.int(4, 9), e = R.int(2, r * c - 5); return num(`A bus has ${r} rows of ${c} seats. ${e} seats are empty. How many seats are full?`, r * c - e, `${r} ${X} ${c} = ${r * c}, then ${r * c} ${M} ${e} = ${r * c - e}.`); }
    const g = R.int(3, 8), q = R.int(3, 9), a = R.int(5, g * q - 5), b = g * q - a; return num(`${a} boys and ${b} girls make teams of ${g}. How many teams?`, q, `${a} + ${b} = ${g * q}, then ${g * q} ${D} ${g} = ${q}.`); } },
  c: { t: 'check reasonableness', g: (R) => { const mul = R.bool();
    if (mul) { const a = R.int(3, 9), b = R.int(21, 98), P = a * b;
      return choice(R, `A box holds ${b} crayons. How many crayons in ${a} boxes? Which answer is reasonable?`, P, [P * 10, Math.round(P / 10), a + b], `About ${a} ${X} ${Math.round(b / 10) * 10} = ${a * Math.round(b / 10) * 10}, so ${P}.`); }
    const d = R.int(3, 9), q = R.int(21, 98), n = d * q;
    return choice(R, `${n} seeds are shared equally into ${d} pots. How many seeds in each pot? Which answer is reasonable?`, q, [q * 10, n - d, Math.max(2, Math.round(q / 10))].filter(v => v !== q), `About ${d} ${X} ${Math.round(q / 10) * 10} = ${d * Math.round(q / 10) * 10}, close to ${n}, so each pot gets about ${Math.round(q / 10) * 10}: ${q} is reasonable.`); } },
  d: { t: 'write an equation', g: (R) => { const k = R.int(0, 3);
    if (k === 0) { const g = R.int(3, 9), q = R.int(3, 9), T = g * q; return choice(R, `${g} bags have the same number of marbles, n, in each. There are ${T} in all. Which equation fits?`, `${g} ${X} n = ${T}`, [`n = ${g} ${X} ${T}`, `${g} + n = ${T}`, `n ${D} ${g} = ${T}`], `${g} groups of n make ${T}: ${g} ${X} n = ${T}.`); }
    if (k === 1) { const g = R.int(3, 9), q = R.int(3, 9), T = g * q; return choice(R, `${T} stickers are shared equally by ${g} kids. Each gets n. Which equation fits?`, `${T} ${D} ${g} = n`, [`${g} ${D} ${T} = n`, `${T} ${M} ${g} = n`, `${T} ${X} ${g} = n`], `Sharing ${T} into ${g} equal groups: ${T} ${D} ${g} = n.`); }
    if (k === 2) { const a = R.int(3, 12), m = R.int(2, 9); return choice(R, `Ana has ${a} shells. Ben has ${m} times as many, n. Which equation fits?`, `n = ${m} ${X} ${a}`, [`n = ${m} + ${a}`, `n = ${a} ${D} ${m}`, `${m} ${X} n = ${a}`], `${m} times as many as ${a}: n = ${m} ${X} ${a}.`); }
    const T = R.int(20, 60), r = R.int(3, T - 5); return choice(R, `Leo had ${T} cards, gave away n cards, and has ${r} left. Which equation fits?`, `${T} ${M} n = ${r}`, [`${T} + n = ${r}`, `n ${M} ${T} = ${r}`, `${T} ${X} n = ${r}`], `Start with ${T}, take away n, leaves ${r}.`); } },
}});

E2.skill({ id: 'II.3.15', name: 'Estimating quotients', steps: {
  a: { t: 'compatible numbers', g: (R) => { const d = R.int(3, 9), q = R.int(Math.ceil(11 / d), 9), c = d * q * 10, off = R.pick([-7, -6, -4, -3, 3, 4, 6, 7]), n = c + off;
    if (n % d === 0 || n < 100 || (d === 5 && Math.abs(off) > 5)) return again('II.3.15', 'a', R);
    const r10 = Math.round(n / 10) * 10, r100 = Math.round(n / 100) * 100, ds = [];
    if (r10 !== c && r10 % d) ds.push(`${r10} ${D} ${d}`);
    if (r100 !== c && r100 % d) ds.push(`${r100} ${D} ${d}`);
    ds.push(`${c + (off > 0 ? 1 : -1) * 10 * d} ${D} ${d}`, `${c} ${D} ${d + 1}`, `${n} ${D} 10`);
    return choice(R, `Which compatible numbers are best for estimating ${n} ${D} ${d}?`, `${c} ${D} ${d}`, ds, `${c} is close to ${n}, and ${d} divides it easily: ${c} ${D} ${d} = ${q * 10}. Keep the divisor ${d}.`); } },
  b: { t: 'round the divisor', g: (R) => { const Dv = 10 * R.int(2, 9), q = R.int(2, 9), dv = Dv + R.pick([-3, -2, -1, 1, 2, 3]), n = Dv * q + R.int(-4, 4);
    return num(`Estimate ${n} ${D} ${dv}: round ${dv} to the nearest ten and ${n} to the nearest ten.`, q, `${n} ≈ ${Dv * q} and ${dv} ≈ ${Dv}. ${Dv * q} ${D} ${Dv} = ${q}.`); } },
  c: { t: 'between which tens', g: (R) => { const d = R.int(3, 9), q = R.int(21, Math.min(98, Math.floor(999 / d))), r = R.int(0, d - 1), n = d * q + r; if (n > 999 || q % 10 === 0) return again('II.3.15', 'c', R);
    const t = Math.floor(q / 10) * 10;
    return choice(R, `${n} ${D} ${d} is between which two numbers?`, `${t} and ${t + 10}`, [`${t - 10} and ${t}`, `${t + 10} and ${t + 20}`, `${t / 10} and ${t / 10 + 1}`],
      `${d} ${X} ${t} = ${d * t} and ${d} ${X} ${t + 10} = ${d * (t + 10)}. ${n} is between them.`); } },
  d: { t: 'check an answer', g: (R) => { const d = R.int(3, 9), q = R.int(110, Math.floor(9999 / d)), n = d * q, k = R.int(0, 2), shown = [q, Math.floor(q / 10), q * 10][k];
    const e = Math.round(n / d / (10 ** (String(q).length - 1))) * 10 ** (String(q).length - 1);
    return choiceFixed(`Kim says ${fmt(n)} ${D} ${d} = ${fmt(shown)}. Use an estimate to check.`, ['Reasonable', 'Too small', 'Too large'], k,
      `${d} ${X} ${fmt(e)} = ${fmt(d * e)}, which is close to ${fmt(n)}. So the answer is about ${fmt(e)}, and ${fmt(shown)} is ${['reasonable', 'too small', 'too large'][k]}.`); } },
}});
})();

/* Era II · Unit II.4 Factors & multiples (II.4.01–II.4.12)
   Local helpers live under V4 / small functions inside this file. */
(function(){ const {num, choice, choiceFixed, tf, frac, fh, fmt, V, C} = E2;
const X = '×', D = '÷', M = '−';
const gcd = E2.gcd, lcm = E2.lcm;
const again = (id, k, R, O) => E2.byId[id].steps[k].g(R, O);
const NAMES = ['Ana', 'Ben', 'Mia', 'Leo', 'Sara', 'Tom', 'Kim', 'Raj', 'Noor', 'Eli'];

/* ---------- number helpers ---------- */
const factors = n => { const f = []; for (let i = 1; i <= n; i++) if (n % i === 0) f.push(i); return f; };
const pairs = n => { const p = []; for (let i = 1; i * i <= n; i++) if (n % i === 0) p.push([i, n / i]); return p; };
const isPrime = n => n > 1 && factors(n).length === 2;
const PRIMES = Array.from({length: 150}, (_, i) => i).filter(isPrime);
const pf = n => { const r = []; let m = n; for (let p = 2; m > 1; p++) while (m % p === 0) { r.push(p); m /= p; } return r; };
const spf = n => pf(n)[0];
const pfX = n => pf(n).join(` ${X} `);
const pfE = n => { const c = {}; pf(n).forEach(p => c[p] = (c[p] || 0) + 1); return Object.keys(c).map(Number).sort((a, b) => a - b).map(p => c[p] > 1 ? `${p}<sup>${c[p]}</sup>` : `${p}`).join(` ${X} `); };
const L = a => a.join(', ');
const pairStr = ps => ps.map(([a, b]) => `${a} ${X} ${b}`).join(', ');
const sumProper = n => factors(n).filter(f => f < n).reduce((a, b) => a + b, 0);
const pickN = (R, lo, hi, ok) => { for (let i = 0; i < 2000; i++) { const n = R.int(lo, hi); if (ok(n)) return n; } throw new Error('pickN ' + lo + '-' + hi); };
const upto = (lo, hi, ok) => { const r = []; for (let n = lo; n <= hi; n++) if (ok(n)) r.push(n); return r; };
const yn = (prompt, yes, explain, extra) => choiceFixed(prompt, ['Yes', 'No'], yes ? 0 : 1, explain, extra);

/* ---------- V4 visuals ---------- */
const V4 = {};
// hundred chart 1..N, 10 per row. o: shade Set, cross Set, circle Set
V4.chart = (N, o = {}) => {
  const s = 32, sh = o.shade || new Set(), cr = o.cross || new Set(), ci = o.circle || new Set(); let body = '';
  for (let i = 1; i <= N; i++) {
    const x = 2 + ((i - 1) % 10) * s, y = 2 + Math.floor((i - 1) / 10) * s;
    body += `<rect x="${x}" y="${y}" width="${s}" height="${s}" fill="${sh.has(i) ? C.amber : C.paper}" stroke="${C.line}" stroke-width="1"/>`;
    body += V.text(x + s / 2, y + s / 2, i, {size: 13, fill: cr.has(i) ? C.muted : C.ink, weight: ci.has(i) ? 700 : 500});
    if (ci.has(i)) body += `<circle cx="${x + s / 2}" cy="${y + s / 2}" r="${s / 2 - 3}" fill="none" stroke="${C.teal}" stroke-width="2.5"/>`;
    if (cr.has(i)) body += `<line x1="${x + 5}" y1="${y + s - 5}" x2="${x + s - 5}" y2="${y + 5}" stroke="${C.red}" stroke-width="2.2"/>`;
  }
  return V.svg(10 * s + 4, Math.ceil(N / 10) * s + 4, body, `number chart 1 to ${N}`);
};
// sieve state after crossing out multiples of the primes in ps (1 is crossed too; the primes are circled)
V4.sieve = (N, ps) => {
  const cross = new Set([1]), circle = new Set(ps);
  ps.forEach(p => { for (let m = 2 * p; m <= N; m += p) cross.add(m); });
  return V4.chart(N, {cross, circle});
};
// factor tree. node: {v, k:[l, r]} ; askNode shown as '?'
V4.tree = (root, askNode) => {
  let li = 0, maxd = 0; const all = [];
  const pos = (nd, d) => { nd.d = d; maxd = Math.max(maxd, d); all.push(nd); if (nd.k) { nd.k.forEach(c => pos(c, d + 1)); nd.x = (nd.k[0].x + nd.k[1].x) / 2; } else nd.x = li++; };
  pos(root, 0);
  const gx = 62, X0 = 34, Y = d => 28 + d * 64; let body = '';
  all.forEach(nd => { if (nd.k) nd.k.forEach(c => body += `<line x1="${X0 + nd.x * gx}" y1="${Y(nd.d)}" x2="${X0 + c.x * gx}" y2="${Y(c.d)}" stroke="${C.ink}" stroke-width="2"/>`); });
  all.forEach(nd => {
    const cx = X0 + nd.x * gx, cy = Y(nd.d), ask = nd === askNode;
    body += `<circle cx="${cx}" cy="${cy}" r="21" fill="${ask ? C.amber : C.paper}" stroke="${ask ? C.amber : (nd.k ? C.ink : C.teal)}" stroke-width="${nd.k ? 2 : 3}"/>`;
    body += V.text(cx, cy, ask ? '?' : nd.v, {size: nd.v >= 100 && !ask ? 14 : 16, weight: 700});
  });
  return V.svg(Math.max(2 * X0 + (li - 1) * gx, 120), Y(maxd) + 28, body, 'factor tree');
};
// random factor tree for n
const mkTree = (R, n) => {
  if (isPrime(n)) return {v: n};
  const ps = pairs(n).filter(([a]) => a > 1), [a, b] = R.pick(ps), sw = R.bool();
  return {v: n, k: sw ? [mkTree(R, b), mkTree(R, a)] : [mkTree(R, a), mkTree(R, b)]};
};
const treeNodes = t => [t].concat(t.k ? t.k.flatMap(treeNodes) : []);
const treeLeaves = t => t.k ? t.k.flatMap(treeLeaves) : [t.v];
// dots in pairs (2 rows); the odd one out drawn in amber. Several groups side by side.
V4.pairs = (ns) => {
  const g = 22, r = 8; let body = '', x = 8;
  ns.forEach((n, gi) => {
    const col = gi % 2 ? C.blue : C.red, cols = Math.ceil(n / 2);
    for (let i = 0; i < n; i++) { const c = Math.floor(i / 2), row = i % 2, odd = n % 2 && i === n - 1; body += V.dot(x + c * g + r, 12 + row * g, r, odd ? C.amber : col); }
    x += cols * g + 26;
  });
  return V.svg(x - 18, 2 * g + 8, body, 'dots arranged in pairs');
};

/* ---------- II.4.01 Factor pairs ---------- */
const notPair = (R, n, k) => { const out = []; let t = 0;
  while (out.length < k && t++ < 300) { const a = R.int(2, Math.max(3, Math.floor(Math.sqrt(n)) + 2)), b = Math.max(2, Math.round(n / a) + R.pick([-1, 1, 0])); if (a * b !== n && !out.some(([x, y]) => x === a && y === b)) out.push([a, b]); }
  return out; };
const allPairsQ = (R, lo, hi) => {
  const n = pickN(R, lo, hi, m => pairs(m).length >= 3), ps = pairs(n), k = R.int(0, 2);
  const ex = `Try 1, 2, 3, … in order: ${pairStr(ps)}. Stop when the pairs start repeating.`;
  if (k === 0) return num(`How many factor pairs does ${n} have? (Count 2 ${X} 3 and 3 ${X} 2 as one pair.)`, ps.length, ex);
  if (k === 1) {
    const drop1 = pairStr(ps.slice(1)), mid = ps.slice(0); mid.splice(R.int(1, ps.length - 1), 1);
    const [w] = notPair(R, n, 1), wrong = ps.slice(0, -1).concat([w]);
    return choice(R, `Which list shows ALL the factor pairs of ${n}?`, pairStr(ps), [drop1, pairStr(mid), pairStr(wrong)], ex + ` Don't forget 1 ${X} ${n}.`);
  }
  const i = R.int(1, ps.length - 1), shown = ps.filter((_, j) => j !== i), miss = ps[i];
  const ds = notPair(R, n, 3).map(([a, b]) => `${a} ${X} ${b}`);
  return choice(R, `${n} = ${pairStr(shown)}. Which factor pair of ${n} is missing?`, `${miss[0]} ${X} ${miss[1]}`, ds, `${miss[0]} ${X} ${miss[1]} = ${n}. All pairs: ${pairStr(ps)}.`);
};
E2.skill({ id: 'II.4.01', name: 'Factor pairs', steps: {
  a: { t: 'for small numbers', g: (R) => { const n = pickN(R, 6, 24, m => pairs(m).length >= 2), ps = pairs(n), [a, b] = R.bool(0.2) ? ps[0] : R.pick(ps.slice(1)), sw = R.bool();
    if (R.bool()) return num(`${sw ? b : a} ${X} ? = ${n}`, sw ? a : b, `${a} ${X} ${b} = ${n}, so ${a} and ${b} are a factor pair of ${n}.`);
    const ds = notPair(R, n, 2).map(([x, y]) => `${x} and ${y}`); const s = pickN(R, 2, n - 2, x => n % x !== 0); ds.push(`${s} and ${n - s}`);
    return choice(R, `Which is a factor pair of ${n}?`, `${a} and ${b}`, ds, `${a} ${X} ${b} = ${n}. A factor pair multiplies to the number; it does not add to it.`); } },
  b: { t: 'with arrays', g: (R) => { const n = R.pick([8, 10, 12, 14, 15, 16, 18, 20, 21, 24, 28, 30, 32, 36]), ps = pairs(n).filter(([a]) => a > 1), [r0, c0] = R.pick(ps), sw = R.bool(), r = sw ? c0 : r0, c = sw ? r0 : c0, k = R.int(0, 2);
    if (k === 0) return num(`An array of ${n} dots has ${r} equal rows. How many dots are in each row?`, c, `${r} ${X} ${c} = ${n}, so the array is ${r} by ${c}.`);
    if (k === 1) return choice(R, `Which factor pair of ${n} does this array show?`, `${r} ${X} ${c}`, [`${r} ${X} ${c + 1}`, `${r + 1} ${X} ${c}`, `${r} + ${c}`], `${r} rows of ${c} dots: ${r} ${X} ${c} = ${n}.`, {visual: V.array(r, c)});
    const others = pairs(n).filter(([a, b]) => !(a === Math.min(r, c) && b === Math.max(r, c)));
    const [a, b] = R.pick(others), ds = notPair(R, n, 3).map(([x, y]) => `${x} ${X} ${y}`);
    return choice(R, `These ${n} dots are moved into a different rectangle. Which one could it be?`, `${a} ${X} ${b}`, ds, `${a} ${X} ${b} = ${n}, so ${n} dots fill a ${a} by ${b} rectangle.`, {visual: V.array(r, c)}); } },
  c: { t: 'all pairs to 50', g: (R) => allPairsQ(R, 12, 50) },
  d: { t: 'to 100', g: (R) => allPairsQ(R, 51, 100) },
}});

/* ---------- II.4.02 Multiples ---------- */
E2.skill({ id: 'II.4.02', name: 'Multiples', steps: {
  a: { t: 'list multiples', g: (R) => { const k = R.int(2, 10), t = R.int(0, 2);
    if (t === 0) { const m = [1, 2, 3, 4, 5].map(i => i * k), fk = factors(4 * k).slice(0, 5);
      return choice(R, `Which list shows the first 5 multiples of ${k}?`, L(m), [L(fk), L([0, 1, 2, 3, 4].map(i => k + 2 * i)), L([1, 2, 3, 4, 5].map(i => i * (k + 1)))], `Multiples of ${k} are ${k} ${X} 1, ${k} ${X} 2, …: ${L(m)}.`); }
    if (t === 1) { const i = R.int(3, 10); return num(`What is the ${E2.ordinal(i)} multiple of ${k}?`, i * k, `The ${E2.ordinal(i)} multiple is ${k} ${X} ${i} = ${i * k}.`); }
    const s = R.int(1, 4); return num(`Count in ${k}s: ${L([s, s + 1, s + 2].map(i => i * k))}, ?, ?`, [{ans: (s + 3) * k}, {ans: (s + 4) * k}], `Add ${k} each time: ${(s + 3) * k}, then ${(s + 4) * k}.`); } },
  b: { t: 'is it a multiple?', g: (R) => { const k = R.int(3, 12), t = R.int(0, 2);
    if (t === 0) { const yes = R.bool(), n = pickN(R, 20, 99, m => (m % k === 0) === yes), q = Math.floor(n / k);
      return yn(`Is ${n} a multiple of ${k}?`, yes, yes ? `${k} ${X} ${q} = ${n}, so yes.` : `${k} ${X} ${q} = ${k * q} and ${k} ${X} ${q + 1} = ${k * (q + 1)}. ${n} is between, so no.`); }
    if (t === 1) { const q = R.int(3, 9), n = k * q;
      if (R.bool()) return yn(`Is ${n} a multiple of ${k}?`, true, `${k} ${X} ${q} = ${n}, so yes: ${n} is a multiple of ${k}, and ${k} is a factor of ${n}.`);
      return yn(`Is ${k} a multiple of ${n}?`, false, `No: it's the other way round. ${n} = ${k} ${X} ${q}, so ${n} is a multiple of ${k}, and ${k} is a factor of ${n}.`); }
    const good = k * R.int(3, 9), ds = []; while (ds.length < 3) { const b = good + R.pick([-2, -1, 1, 2, k + 1, k - 1, -k + 1]); if (b % k && b > 0 && !ds.includes(b)) ds.push(b); }
    return choice(R, `Which number is a multiple of ${k}?`, good, ds, `${good} = ${k} ${X} ${good / k}.`); } },
  c: { t: 'multiples on a hundred chart', g: (R) => { const k = R.int(2, 9), t = R.int(0, 1);
    if (t === 0) { const top = R.int(3, 5) * 10, N = top, sh = new Set(upto(1, top, m => m % k === 0));
      const ds = [k + 1, k - 1 > 1 ? k - 1 : k + 2]; if (k % 2 === 0 && k > 2) ds.push(k / 2); else ds.push(2 * k);
      return choice(R, `The shaded squares are multiples of which number?`, k, ds, `The shading starts at ${k} and jumps ${k} each time: ${L([...sh].slice(0, 4))}, …`, {visual: V4.chart(N, {shade: sh})}); }
    const top = 30, sh = new Set(upto(1, top, m => m % k === 0)), good = pickN(R, 31, 100, m => m % k === 0), ds = [];
    while (ds.length < 3) { const b = R.int(31, 100); if (b % k && !ds.includes(b)) ds.push(b); }
    return choice(R, `The multiples of ${k} are shaded up to 30. Keep going: which of these will be shaded too?`, good, ds, `${good} = ${k} ${X} ${good / k}, so it is a multiple of ${k}.`, {visual: V4.chart(40, {shade: sh})}); } },
  d: { t: 'link to factors', g: (R) => { const [a, b] = R.distinct(2, 12, 2), n = a * b, t = R.int(0, 2);
    if (t === 0) { const good = R.pick([`${n} is a multiple of ${a}`, `${a} is a factor of ${n}`, `${n} is a multiple of ${b}`, `${b} is a factor of ${n}`]);
      return choice(R, `${a} ${X} ${b} = ${n}. Which is true?`, good, R.sample([`${a} is a multiple of ${n}`, `${n} is a factor of ${a}`, `${b} is a multiple of ${n}`, `${n} is a factor of ${b}`], 3), `${a} and ${b} are factors of ${n}; ${n} is a multiple of each of them.`); }
    if (t === 1 && R.bool()) return choiceFixed(`${a} is a factor of ${n}. So ${n} is a ___ of ${a}.`, ['factor', 'multiple'], 1, `${a} ${X} ${b} = ${n}: ${n} is a multiple of ${a}, and ${a} is a factor of ${n}.`);
    if (t === 1) return choiceFixed(`${n} is a multiple of ${a}. So ${a} is a ___ of ${n}.`, ['factor', 'multiple'], 0, `${a} ${X} ${b} = ${n}: ${a} is a factor of ${n}, and ${n} is a multiple of ${a}.`);
    const q = R.int(2, 9), yes = R.bool(), m = yes ? a * q : a * q + R.int(1, a - 1);
    return tf(`${a} is a factor of ${m}, so ${m} is a multiple of ${a}.`, yes, yes ? `${a} ${X} ${q} = ${m}, so both parts are true.` : `${a} is not a factor of ${m}: ${m} ${D} ${a} leaves a remainder.`); } },
}});

/* ---------- II.4.03 Primes and composites ---------- */
const PCN = ['Prime', 'Composite', 'Neither'];
const pcIdx = n => n === 1 ? 2 : isPrime(n) ? 0 : 1;
const pcEx = n => n === 1 ? `1 has only one factor, so it is neither prime nor composite.` : isPrime(n) ? `${n} has exactly two factors, 1 and ${n}, so it is prime.` : `${n} = ${pairs(n)[1][0]} ${X} ${pairs(n)[1][1]}, so it has more than two factors: composite.`;
const ODDC = [9, 15, 21, 25, 27, 33, 35, 39, 45, 49, 51, 55, 57, 63, 65, 69, 75, 77, 81, 85, 87, 91, 93, 95, 99];
E2.skill({ id: 'II.4.03', name: 'Primes and composites', steps: {
  a: { t: 'the definition', g: (R) => { const t = R.int(0, 2);
    if (t === 0) { const n = R.bool() ? R.pick(PRIMES.filter(x => x < 40)) : pickN(R, 4, 40, m => !isPrime(m)); return choiceFixed(`The factors of ${n} are ${L(factors(n))}. Is ${n} prime or composite?`, PCN.slice(0, 2), pcIdx(n), pcEx(n)); }
    if (t === 1) { const p = R.pick(PRIMES.filter(x => x < 40)); return choice(R, `${p} is prime. How many factors does it have?`, 'exactly 2', ['only 1', 'more than 2', `${p}`], `A prime has exactly two factors: 1 and ${p}.`); }
    const p = R.pick(PRIMES.filter(x => x < 40)), ds = R.sample(upto(4, 40, m => !isPrime(m)), 3);
    return choice(R, `Which number has exactly 2 factors?`, p, ds, `${p} has only 1 and ${p}. The others have more factors, e.g. ${pcEx(ds[0])}`); } },
  b: { t: 'primes to 20', g: (R) => { const t = R.int(0, 2);
    if (t === 0) { const p = R.pick(PRIMES.filter(x => x <= 20)), ds = R.sample([1, 9, 15, 4, 6, 8, 10, 12, 14, 16, 18, 20], 3);
      return choice(R, `Which is a prime number?`, p, ds, `${p} has exactly two factors, 1 and ${p}. ${ds.includes(1) ? '1 is not prime; it has only one factor.' : ds.includes(9) ? '9 = 3 × 3 is odd but not prime.' : ''}`); }
    if (t === 1) { const w = R.f(), n = w < 0.12 ? 1 : w < 0.56 ? R.pick(PRIMES.filter(x => x <= 20)) : pickN(R, 4, 20, m => !isPrime(m)); return choiceFixed(`Is ${n} prime, composite or neither?`, PCN, pcIdx(n), pcEx(n)); }
    const p = R.pick(PRIMES.filter(x => x < 19)), nx = PRIMES.find(x => x > p); return num(`What is the next prime number after ${p}?`, nx, `Check the numbers after ${p}: ${upto(p + 1, nx, () => true).map(m => m === nx ? `${m} is prime` : `${m} = ${pairs(m)[1][0]} ${X} ${pairs(m)[1][1]}`).join('; ')}.`); } },
  c: { t: 'to 100', g: (R) => { const t = R.int(0, 2);
    if (t === 0) { const p = R.pick(PRIMES.filter(x => x > 20 && x < 100)), ds = R.sample(ODDC.filter(x => x > 20), 3);
      return choice(R, `Which is a prime number?`, p, ds, `${p} is not divisible by 2, 3, 5 or 7, so it is prime. ${pcEx(ds[0])}`); }
    if (t === 1) { const n = R.bool(0.5) ? R.pick(ODDC.filter(x => x > 20)) : R.pick(PRIMES.filter(x => x > 20 && x < 100)); return choiceFixed(`Is ${n} prime or composite?`, PCN.slice(0, 2), pcIdx(n), pcEx(n)); }
    const c = R.pick(ODDC.filter(x => x > 30)), ds = R.sample(PRIMES.filter(x => x > 20 && x < 100), 3);
    return choice(R, `Which number is composite?`, c, ds, `${pcEx(c)} Odd does not mean prime.`); } },
  d: { t: 'why 1 is neither', g: (R) => { const t = R.int(0, 3), p = R.pick(PRIMES.filter(x => x < 30)), c = R.pick([4, 6, 8, 9, 10, 12, 14, 15]);
    if (t === 0) return choice(R, `${p} has factors 1 and ${p}, so it is prime. Why is 1 not prime?`, '1 has only one factor, and a prime needs exactly two.', ['1 is too small to be prime.', '1 is odd.', `1 ${X} 1 = 1, so 1 is composite.`], `The only factor of 1 is 1. A prime has exactly two factors, like 1 and ${p}.`);
    if (t === 1) return choice(R, `${c} has more than two factors, so it is composite. Why is 1 not composite?`, '1 has only one factor, not more than two.', ['1 is a factor of every number.', '1 is prime.', '1 is even.'], `Composite means more than two factors, like ${c}: ${L(factors(c))}. 1 has just one factor.`);
    if (t === 2) { const ps = R.sample(PRIMES.filter(x => x < 50), 4).sort((a, b) => a - b), w1 = [1].concat(ps.slice(1)), w2 = ps.slice(0, 3).concat([R.pick(ODDC.filter(x => x < 50 && x > ps[2]).concat([49]))]).sort((a, b) => a - b);
      return choice(R, `Which list shows only prime numbers?`, L(ps), [L(w1), L(w2)], `${L(ps)} each have exactly two factors. 1 is not prime, and ${w2.find(x => !isPrime(x))} = ${pairs(w2.find(x => !isPrime(x)))[1].join(` ${X} `)}.`); }
    return choiceFixed(`${p} is prime and ${c} is composite. What is 1?`, PCN, 2, `1 has exactly one factor: not two (prime) and not more than two (composite).`); } },
}});

/* ---------- II.4.04 The sieve of Eratosthenes ---------- */
const firstBy = n => `${n} is crossed out first by ${spf(n)}, because ${n} = ${spf(n)} ${X} ${n / spf(n)}.`;
E2.skill({ id: 'II.4.04', name: 'The sieve of Eratosthenes', steps: {
  a: { t: 'cross out multiples of 2', g: (R) => { const N = R.pick([30, 40, 50]), t = R.int(0, 2), vis = V4.chart(N, {circle: new Set([2]), cross: new Set([1])});
    if (t === 0) return num(`2 is circled. Now cross out all the other multiples of 2 up to ${N}. How many numbers do you cross out?`, N / 2 - 1, `4, 6, 8, …, ${N}: that is ${N / 2} multiples of 2, but 2 itself stays circled, so ${N / 2 - 1}.`, {visual: vis});
    if (t === 1) { const good = R.bool(0.2) ? 2 : pickN(R, 3, N, m => m % 2 === 1), ds = R.sample(upto(4, N, m => m % 2 === 0), 3);
      return choice(R, `2 is circled. You cross out the other multiples of 2. Which number is NOT crossed out?`, good, ds, good === 2 ? `2 is the prime you circled; only its other multiples are crossed out.` : `${good} is odd, so it is not a multiple of 2.`, {visual: vis}); }
    const n = R.bool(0.1) ? 2 : R.bool() ? 2 * R.int(2, N / 2) : 2 * R.int(1, N / 2 - 1) + 1;
    return yn(`2 is circled. You cross out its other multiples. Is ${n} crossed out?`, n !== 2 && n % 2 === 0, n === 2 ? `Don't cross out the prime itself: 2 stays circled.` : n % 2 === 0 ? `${n} = 2 ${X} ${n / 2}, a multiple of 2.` : `${n} is odd, so it stays.`, {visual: vis}); } },
  b: { t: 'of 3 and 5', g: (R) => { const t = R.int(0, 2);
    if (t === 0) { const N = 50, good = R.pick([9, 15, 21, 27, 33, 39, 45]), ds = [3, R.pick([6, 12, 18, 24, 30, 36]), R.pick([7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47])];
      return choice(R, `Multiples of 2 are crossed out. Circle 3 and cross out its multiples. Which number is crossed out for the first time?`, good, ds, `${good} = 3 ${X} ${good / 3} is odd, so 2 missed it. Even multiples of 3 are already gone, and 3 itself stays circled.`, {visual: V4.sieve(N, [2])}); }
    if (t === 1) { const n = pickN(R, 10, 100, m => [3, 5].includes(spf(m)) || (m % 2 === 0 && R.bool(0.2)));
      return choiceFixed(`In the sieve, which prime crosses out ${n} first?`, ['2', '3', '5', '7'], [2, 3, 5, 7].indexOf(spf(n)), firstBy(n)); }
    const N = R.pick([30, 40, 50, 60, 70, 80, 90, 100]), nw = upto(6, N, m => m % 5 === 0 && m % 2 && m % 3);
    return num(`Multiples of 2 and 3 are crossed out. Circle 5 and cross out its multiples up to ${N}. How many NEW numbers get crossed out?`, nw.length, `Only odd multiples of 5 that are not multiples of 3 are new: ${L(nw)}.`, {visual: V4.sieve(N, [2, 3])}); } },
  c: { t: 'of 7', g: (R) => { const t = R.int(0, 2);
    if (t === 0) { const good = R.pick([49, 77, 91]), ds = R.sample([7, 14, 21, 35, 42, 56, 63, 70, 84, 97, 89], 3);
      return choice(R, `Multiples of 2, 3 and 5 are crossed out. Which number is crossed out for the first time by 7?`, good, ds, `${good} = 7 ${X} ${good / 7}. It is not a multiple of 2, 3 or 5, so it survived until 7.`, {visual: V4.sieve(100, [2, 3, 5])}); }
    if (t === 1) { const n = 7 * R.int(2, 14); return choiceFixed(`${n} is a multiple of 7. In the sieve, which prime crosses it out first?`, ['2', '3', '5', '7'], [2, 3, 5, 7].indexOf(spf(n)), firstBy(n)); }
    const N = R.pick([50, 60, 70, 80, 90, 100]), nw = [49, 77, 91].filter(m => m <= N);
    return num(`Multiples of 2, 3 and 5 are crossed out. Now cross out multiples of 7 up to ${N}. How many NEW numbers get crossed out?`, nw.length, `The new ones are ${L(nw)}. The other multiples of 7 (14, 21, 35, …) were already crossed out.`, {visual: V4.sieve(N, [2, 3, 5])}); } },
  d: { t: 'what remains', g: (R) => { const t = R.int(0, 2);
    if (t === 0) { const a = R.int(1, 8) * 10, b = a + R.pick([10, 20]), ps = PRIMES.filter(p => p > a && p < b);
      return num(`After the sieve, how many prime numbers are left between ${a} and ${b}?`, ps.length, ps.length ? `The primes left are ${L(ps)}.` : `None: every number from ${a} to ${b} is crossed out.`); }
    if (t === 1) { const good = R.pick(PRIMES.filter(x => x > 10 && x < 100)), ds = R.sample([1, 91, 51, 57, 49, 87, 77, 27, 39], 3);
      return choice(R, `At the end of the sieve to 100, which number is left (not crossed out)?`, good, ds, `${good} is prime, so nothing crosses it out. ${ds.includes(1) ? '1 is crossed out: it is not prime.' : pcEx(ds[0])}`); }
    const N = R.pick([30, 40, 48, 50, 60, 80, 100, 110, 120, 130, 150]), p = PRIMES.filter(q => q * q <= N).pop(), nx = PRIMES.find(q => q > p);
    return num(`In a sieve up to ${N}, what is the last prime whose multiples you need to cross out?`, p, `${p} ${X} ${p} = ${p * p} ≤ ${N}, but ${nx} ${X} ${nx} = ${nx * nx} is more than ${N}. Any composite up to ${N} has a prime factor ${p} or smaller.`); } },
}});

/* ---------- II.4.05 Prime factorization ---------- */
const FACT = upto(12, 100, m => pf(m).length >= 3);
E2.skill({ id: 'II.4.05', name: 'Prime factorization', steps: {
  a: { t: 'factor trees', g: (R) => { const n = R.pick(FACT), t = mkTree(R, n);
    if (R.bool(0.7)) { const ask = R.pick(treeNodes(t).slice(1)), par = treeNodes(t).find(nd => nd.k && nd.k.includes(ask)), sib = par.k.find(c => c !== ask);
      return num(`Find the missing number in the factor tree.`, ask.v, `${par.v} = ${ask.v} ${X} ${sib.v}${ask.k ? `, and ${ask.v} splits into ${ask.k[0].v} ${X} ${ask.k[1].v}` : ''}.`, {visual: V4.tree(t, ask)}); }
    const top = t.k.map(c => c.v), ds = [top.join(` ${X} `), `1 ${X} ${pfX(n)}`, pf(n).slice(1).join(` ${X} `)];
    return choice(R, `What prime factorization does this tree give?`, pfX(n), ds, `Stop when every branch ends in a prime: ${n} = ${pfX(n)}.`, {visual: V4.tree(t)}); } },
  b: { t: 'repeated division', g: (R) => { const n = pickN(R, 24, 200, m => pf(m).length >= 3 && pf(m).length <= 4 && Math.max(...pf(m)) <= 7), ps = pf(n);
    if (R.bool(0.6)) { let cur = n; const fs = ps.map(p => { const f = {label: `${cur} ${D} ${p} =`, ans: cur / p}; cur /= p; return f; });
      return num(`Divide ${n} by primes, smallest first, until you reach 1.`, fs, `${n} = ${pfX(n)}.`); }
    const i = R.int(1, ps.length - 2), cur = ps.slice(i).reduce((a, b) => a * b, 1), done = ps.slice(0, i);
    return choiceFixed(`${n}: you divided by ${done.join(', then ')} and reached ${cur}. Which prime do you divide by next?`, ['2', '3', '5', '7'], [2, 3, 5, 7].indexOf(spf(cur)), `The smallest prime that divides ${cur} is ${spf(cur)}: ${cur} = ${spf(cur)} ${X} ${cur / spf(cur)}.`); } },
  c: { t: 'exponents for repeats', g: (R) => { const a = R.int(1, 4), b = R.int(1, 3), c = R.pick([0, 0, 1]), n = 2 ** a * 3 ** b * 5 ** c, t = R.int(0, 2);
    if (n > 500 || (a === 1 && b === 1)) return again('II.4.05', 'c', R);
    const e = (p, k) => k === 0 ? '' : k === 1 ? `${p}` : `${p}<sup>${k}</sup>`, ex = (x, y, z) => [e(2, x), e(3, y), e(5, z)].filter(s => s).join(` ${X} `);
    if (t === 0) return num(`${fmt(n)} = ${pfX(n)}. Write it as 2<sup>?</sup> ${X} 3<sup>?</sup>${c ? ` ${X} 5` : ''}.`, [{label: 'exponent of 2', ans: a}, {label: 'exponent of 3', ans: b}], `Count the repeats: ${a} twos and ${b} threes, so ${n} = ${pfE(n)}.`);
    if (t === 1) { const ds = [ex(b, a, c), `${2 * a} ${X} ${3 * b}${c ? ` ${X} 5` : ''}`, ex(a + 1, b, c)];
      return choice(R, `Which is ${pfX(n)}?`, ex(a, b, c), ds, (a > 1 ? `${a} twos make 2<sup>${a}</sup>, not 2 ${X} ${a}.` : `${b} threes make 3<sup>${b}</sup>, not 3 ${X} ${b}.`) + ` So ${pfE(n)}.`); }
    return num(`${pfE(n)} = ?`, n, `${e(2, a)} = ${2 ** a}${a > 1 ? ` (${Array(a).fill(2).join(` ${X} `)}, not 2 ${X} ${a})` : ''} and ${e(3, b)} = ${3 ** b}. ${2 ** a} ${X} ${3 ** b}${c ? ` ${X} 5` : ''} = ${n}.`); } },
  d: { t: 'only one factorization', g: (R) => { const n = pickN(R, 24, 150, m => pf(m).length >= 3 && pairs(m).filter(([x]) => x > 1).length >= 2), t = R.int(0, 2);
    const ps = pairs(n).filter(([x]) => x > 1);
    if (t === 0) { const [p1, p2] = R.sample(ps, 2), [A, B] = R.sample(NAMES, 2);
      return choice(R, `${A} starts ${n} = ${p1[0]} ${X} ${p1[1]}. ${B} starts ${n} = ${p2[0]} ${X} ${p2[1]}. Both finish their prime factorizations. What do they get?`, `The same primes: ${pfX(n)}`, [`Different primes, because they started differently`, `Only ${A}'s answer is a prime factorization`, `${A} gets ${pfX(n)}; ${B} gets ${p2[0]} ${X} ${p2[1]}`], `Every number has only one prime factorization, whatever split you start with: ${n} = ${pfX(n)}.`); }
    const unf = R.pick(ps.filter(([x, y]) => !isPrime(x) || !isPrime(y))), sw = pf(n).slice(); sw[sw.length - 1] = PRIMES.find(q => q > sw[sw.length - 1]);
    if (t === 1) return choice(R, `Which is the prime factorization of ${n}?`, pfX(n), [`${unf[0]} ${X} ${unf[1]}`, sw.join(` ${X} `), `1 ${X} ${unf[0]} ${X} ${unf[1]}`], `A factorization is finished only when every factor is prime: ${n} = ${pfX(n)}. ${unf[0]} ${X} ${unf[1]} still has a composite factor.`);
    const good = R.bool();
    if (good) return tf(`${n} = ${pfX(n)} is the prime factorization of ${n}.`, true, `Every factor is prime, and they multiply to ${n}.`);
    const n4 = pickN(R, 48, 240, m => pf(m).length >= 4), ps4 = pf(n4), i4 = R.int(0, ps4.length - 2), comp = ps4[i4] * ps4[i4 + 1], shown4 = [...ps4.slice(0, i4), comp, ...ps4.slice(i4 + 2)].sort((x, y) => x - y).join(` ${X} `);
    return tf(`${n4} = ${shown4} is the prime factorization of ${n4}.`, false, `Not finished: ${comp} is not prime. ${n4} = ${pfX(n4)}.`); } },
}});

/* ---------- II.4.06 Common factors ---------- */
const gfPair = (R, hi) => { for (;;) { const g = R.int(2, 12), [x, y] = R.distinct(1, 7, 2).sort((p, q) => p - q), a = g * x, b = g * y; if (gcd(x, y) === 1 && a >= 6 && b <= hi && a !== b && (x > 1 || R.bool(0.2))) return [a, b, g]; } };
E2.skill({ id: 'II.4.06', name: 'Common factors', steps: {
  a: { t: 'list both', g: (R) => { const [a, b] = gfPair(R, 60), n = R.pick([a, b]), f = factors(n), t = R.int(0, 1);
    if (t === 0 && f.length >= 4) { const mid = f.slice(); mid.splice(R.int(1, f.length - 2), 1); const nf = pickN(R, 2, n - 1, m => n % m !== 0), extra = f.concat([nf]).sort((p, q) => p - q);
      return choice(R, `To find the common factors of ${a} and ${b}, first list the factors of each. Which is the full list for ${n}?`, L(f), [L(f.slice(1, -1)), L(mid), L(extra)], `Go through factor pairs: ${pairStr(pairs(n))}. So ${L(f)}.`); }
    return num(`List the factors of ${a} and of ${b}. How many factors does each have?`, [{label: `${a}`, ans: factors(a).length}, {label: `${b}`, ans: factors(b).length}], `${a}: ${L(factors(a))}. ${b}: ${L(factors(b))}.`); } },
  b: { t: 'find the common ones', g: (R) => { const [a, b] = gfPair(R, 60), fa = factors(a), fb = factors(b), cm = fa.filter(x => fb.includes(x));
    const pr = `Factors of ${a}: ${L(fa)}.<br>Factors of ${b}: ${L(fb)}.`;
    if (R.bool(0.6)) { const un = [...new Set(fa.concat(fb))].sort((p, q) => p - q);
      return choice(R, `${pr}<br>Which are the common factors?`, L(cm), [L(un), L(fa.filter(x => !fb.includes(x)).concat([1]).sort((p, q) => p - q)), L(cm.slice(1).concat([lcm(a, b)]))], `Common factors are in both lists: ${L(cm)}.`); }
    return num(`${pr}<br>How many common factors do ${a} and ${b} have?`, cm.length, `In both lists: ${L(cm)}.`); } },
  c: { t: 'greatest common factor', g: (R) => { const [a, b, g] = gfPair(R, 90);
    if (R.bool()) return num(`What is the greatest common factor (GCF) of ${a} and ${b}?`, g, `Factors of ${a}: ${L(factors(a))}. The largest that also divides ${b} is ${g}.`);
    const sm = factors(g).slice(0, -1).pop();
    return choice(R, `What is the GCF of ${a} and ${b}?`, g, [lcm(a, b), sm === 1 && g > 2 ? 1 : sm, a + b].filter(v => v !== g), `${g} divides both (${a} = ${g} ${X} ${a / g}, ${b} = ${g} ${X} ${b / g}). The GCF can't be bigger than ${a}; ${lcm(a, b)} is a common multiple.`); } },
  d: { t: 'with prime factors', g: (R) => { let a, b, g; do { [a, b, g] = gfPair(R, 150); } while (pf(a).length < 2 || pf(b).length < 2 || pf(g).length < 1 || a < 12);
    return num(`${a} = ${pfX(a)}<br>${b} = ${pfX(b)}<br>Use the shared primes. What is the GCF?`, g, `Both lists share ${pfX(g)}${pf(g).length > 1 ? ` = ${g}` : ''}. So the GCF is ${g}.`); } },
}});

/* ---------- II.4.07 Using the GCF ---------- */
E2.skill({ id: 'II.4.07', name: 'Using the GCF', steps: {
  a: { t: 'simplify fractions', g: (R) => { let x, y; do { y = R.int(2, 12); x = R.int(1, y - 1); } while (gcd(x, y) !== 1); const g = R.pick([4, 6, 8, 9, 10, 12, 2, 3, 5]), n = g * x, d = g * y;
    if (d > 100) return again('II.4.07', 'a', R);
    if (R.bool(0.55)) return num(`Simplify ${fh(n, d)}. Write it in simplest form.`, [E2.frac(x, y, 'simplest')], `The GCF of ${n} and ${d} is ${g}. ${n} ${D} ${g} = ${x}, ${d} ${D} ${g} = ${y}, so ${fh(x, y)}.`);
    const p = spf(g), ds = [p < g ? fh(n / p, d / p) : fh(x, y + 1), fh(n - x, d - y) === fh(x, y) ? fh(x + 1, y) : fh(n / g, d), fh(x + 1, y + 1)];
    return choice(R, `Which is ${fh(n, d)} in simplest form?`, fh(x, y), ds, `Divide top and bottom by the GCF, ${g}: ${fh(x, y)}.${p < g ? ` Dividing by ${p} gives ${fh(n / p, d / p)}, which still simplifies.` : ''}`); } },
  b: { t: 'split into equal groups', g: (R) => { const [a, b, g] = gfPair(R, 60), [A, B, bag] = R.pick([['red beads', 'blue beads', 'bags'], ['pencils', 'erasers', 'packs'], ['apples', 'oranges', 'baskets'], ['boys', 'girls', 'teams'], ['stickers', 'stamps', 'envelopes']]);
    return num(`${a} ${A} and ${b} ${B} are split into ${bag} that are all the same, with none left. What is the greatest number of ${bag}? How many ${A} in each?`, [{label: bag, ans: g}, {label: `${A} in each`, ans: a / g}], `The GCF of ${a} and ${b} is ${g}, so ${g} ${bag}, each with ${a / g} ${A} and ${b / g} ${B}.`); } },
  c: { t: '12 + 18 = 6 × (2 + 3)', g: (R) => { const [a, b, g] = gfPair(R, 90), x = a / g, y = b / g, t = R.int(0, 2);
    if (t === 0) return num(`Use the GCF: ${a} + ${b} = ${g} ${X} (? + ?)`, [{label: 'first ?', ans: x}, {label: 'second ?', ans: y}], `${a} = ${g} ${X} ${x} and ${b} = ${g} ${X} ${y}, so ${a} + ${b} = ${g} ${X} (${x} + ${y}).`);
    if (t === 1) return num(`${a} + ${b} = ? ${X} (${x} + ${y})`, g, `${a} ${D} ${x} = ${g} and ${b} ${D} ${y} = ${g}. Check: ${g} ${X} ${x + y} = ${a + b}.`);
    const p = spf(g), ds = [`${g} ${X} (${a} + ${b})`, `${g} + (${x} + ${y})`]; if (p < g) ds.push(`${p} ${X} (${a / p} + ${b / p})`); else ds.push(`${g} ${X} ${x} + ${y}`);
    return choice(R, `Which uses the GCF to rewrite ${a} + ${b}?`, `${g} ${X} (${x} + ${y})`, ds, `The GCF is ${g}: ${a} + ${b} = ${g} ${X} ${x} + ${g} ${X} ${y} = ${g} ${X} (${x} + ${y}).`); } },
  d: { t: 'word problems', g: (R, O) => { const [a, b, g] = gfPair(R, 90), u = O.units === 'imperial' ? 'in' : 'cm', t = R.int(0, 2);
    if (t === 0) return num(`Two ribbons are ${a} ${u} and ${b} ${u} long. Cut both into equal pieces, as long as possible, with none left. How long is each piece, in ${u}?`, g, `The piece length must divide ${a} and ${b}; the greatest is the GCF, ${g} ${u}.`);
    if (t === 1) return num(`A floor is ${a} ${u} by ${b} ${u}. What is the side of the largest square tile that covers it exactly, with no cutting, in ${u}?`, g, `The tile side must divide both ${a} and ${b}. The GCF is ${g}, so ${g} ${u} tiles.`);
    return num(`${a} boys and ${b} girls make teams. Every team has the same number of boys and the same number of girls. What is the most teams?`, g, `The number of teams must divide ${a} and ${b}. GCF = ${g}: each team has ${a / g} boys and ${b / g} girls.`); } },
}});

/* ---------- II.4.08 Common multiples ---------- */
const lmPair = (R, lo, hi, strict) => { for (;;) { const [a, b] = R.distinct(lo, hi, 2).sort((p, q) => p - q); if (b % a && gcd(a, b) > 1 || (!strict && b % a && R.bool(0.3))) return [a, b, lcm(a, b)]; } };
E2.skill({ id: 'II.4.08', name: 'Common multiples', steps: {
  a: { t: 'list both', g: (R) => { const [a, b] = lmPair(R, 2, 10);
    return num(`Continue both lists.<br>Multiples of ${a}: ${a}, ${2 * a}, ${3 * a}, ?, ?<br>Multiples of ${b}: ${b}, ${2 * b}, ${3 * b}, ?, ?`, [{label: `${a}s: 4th`, ans: 4 * a}, {label: `${a}s: 5th`, ans: 5 * a}, {label: `${b}s: 4th`, ans: 4 * b}, {label: `${b}s: 5th`, ans: 5 * b}], `Keep adding: ${a}s go up by ${a} (${4 * a}, ${5 * a}); ${b}s go up by ${b} (${4 * b}, ${5 * b}).`); } },
  b: { t: 'find the common ones', g: (R) => { const [a, b, l] = lmPair(R, 2, 10);
    if (R.bool()) { const ma = [1, 2, 3, 4, 5, 6, 7, 8].map(i => i * a).filter(m => m <= 4 * l && m <= 60), mb = [1, 2, 3, 4, 5, 6, 7, 8].map(i => i * b).filter(m => m <= 4 * l && m <= 60), cm = ma.filter(m => mb.includes(m));
      if (!cm.length) return again('II.4.08', 'b', R);
      const un = [...new Set(ma.concat(mb))].sort((p, q) => p - q).slice(0, cm.length + 2), oa = ma.filter(m => !mb.includes(m)).slice(0, 3);
      return choice(R, `Multiples of ${a}: ${L(ma)}<br>Multiples of ${b}: ${L(mb)}<br>Which are the common multiples in these lists?`, L(cm), [L(un), L(oa), L([a, b])], `Numbers in both lists: ${L(cm)}.`); }
    const good = l * R.int(1, 3), ds = [];
    [a * R.int(1, 9), b * R.int(1, 9), a + b, a * b + a].forEach(v => { if (v % a || v % b) ds.push(v); });
    return choice(R, `Which is a common multiple of ${a} and ${b}?`, good, ds.slice(0, 3), `${good} = ${a} ${X} ${good / a} = ${b} ${X} ${good / b}.`); } },
  c: { t: 'least common multiple', g: (R) => { const [a, b, l] = lmPair(R, 2, 12);
    if (R.bool()) return num(`What is the least common multiple (LCM) of ${a} and ${b}?`, l, `Multiples of ${b}: ${L(Array.from({ length: l / b }, (_, i) => (i + 1) * b))}. The first one ${a} also divides is ${l}.`);
    return choice(R, `What is the LCM of ${a} and ${b}?`, l, [a * b, gcd(a, b), a + b, 2 * l].filter(v => v !== l), `${l} is the first multiple of ${b} that ${a} divides: ${l} = ${a} ${X} ${l / a}. ${l < a * b ? ` The LCM isn't always ${a} ${X} ${b} = ${a * b}.` : ''}`); } },
  d: { t: 'with prime factors', g: (R) => { let a, b, l; do { [a, b, l] = lmPair(R, 6, 40); } while (pf(a).length < 2 || pf(b).length < 2 || l > 400 || gcd(a, b) === 1);
    return num(`${a} = ${pfX(a)}<br>${b} = ${pfX(b)}<br>Use the primes. What is the LCM?`, l, `Take each prime the most times it appears in either list: ${pfX(l)} = ${l}.`); } },
}});

/* ---------- II.4.09 Using the LCM ---------- */
const GL = [
  (a, b) => [`${a} red and ${b} blue beads go into equal bags with none left. Most bags?`, 'GCF'],
  (a, b) => [`Lights flash every ${a} s and every ${b} s. When do they next flash together?`, 'LCM'],
  (a, b) => [`Cut ropes of ${a} m and ${b} m into equal pieces, as long as possible.`, 'GCF'],
  (a, b) => [`Cups come in packs of ${a}, lids in packs of ${b}. Fewest cups to match lids exactly?`, 'LCM'],
  (a, b) => [`Two buses leave together, one every ${a} min, one every ${b} min. When together again?`, 'LCM'],
  (a, b) => [`Largest square tile to cover a ${a} by ${b} floor exactly?`, 'GCF'],
];
E2.skill({ id: 'II.4.09', name: 'Using the LCM', steps: {
  a: { t: 'common denominators', g: (R) => { const [a, b, l] = lmPair(R, 2, 12), n1 = R.int(1, a - 1), n2 = R.int(1, b - 1), t = R.int(0, 2);
    if (t === 0) return num(`What is the least common denominator of ${fh(n1, a)} and ${fh(n2, b)}?`, l, `The LCM of ${a} and ${b} is ${l}.`);
    if (t === 1) return choice(R, `Which is the least common denominator of ${fh(n1, a)} and ${fh(n2, b)}?`, l, [a * b, a + b, Math.max(a, b)].filter(v => v !== l), `The LCM of ${a} and ${b} is ${l}; ${a} ${X} ${b} = ${a * b} works too, but it is not the least.`);
    return num(`Rewrite ${fh(n1, a)} and ${fh(n2, b)} with denominator ${l}.`, [{label: `${n1}/${a} = ?/${l}`, ans: n1 * l / a}, {label: `${n2}/${b} = ?/${l}`, ans: n2 * l / b}], `${l} ${D} ${a} = ${l / a}, so ${n1} ${X} ${l / a} = ${n1 * l / a}. ${l} ${D} ${b} = ${l / b}, so ${n2} ${X} ${l / b} = ${n2 * l / b}.`); } },
  b: { t: 'when events line up', g: (R) => { const [a, b, l] = lmPair(R, 2, 12), [pr, u] = R.pick([[`Two lights flash together. One flashes every ${a} seconds, the other every ${b} seconds. After how many seconds do they next flash together?`, 'seconds'], [`Two buses leave the stop together. One comes every ${a} minutes, the other every ${b} minutes. After how many minutes do they next leave together?`, 'minutes'], [`A drum beats every ${a} counts and a bell rings every ${b} counts. Both sound on count 0. On which count do they next sound together?`, 'counts'], [`Two runners start a lap together. One takes ${a} minutes a lap, the other ${b}. After how many minutes are they back at the start together?`, 'minutes']]);
    if (R.bool(0.6)) return num(pr, l, `The first time they line up is the LCM of ${a} and ${b}: ${l} ${u}.`);
    return choice(R, pr, l, [gcd(a, b), a * b, a + b].filter(v => v !== l), `Lining up again is the LCM, not the GCF: multiples of ${b} are ${L([1, 2, 3].map(i => i * b))}, …; ${l} is the first one ${a} also divides.`); } },
  c: { t: 'word problems', g: (R) => { const [a, b, l] = lmPair(R, 3, 12), t = R.int(0, 2);
    if (t === 0) return num(`Hot dogs come in packs of ${a} and buns in packs of ${b}. You want the same number of each, as few as possible. How many packs of each?`, [{label: 'hot dog packs', ans: l / a}, {label: 'bun packs', ans: l / b}], `The LCM of ${a} and ${b} is ${l}: ${l / a} packs of ${a} and ${l / b} packs of ${b}.`);
    if (t === 1) { const [p, k] = R.pick(GL)(a, b); return choiceFixed(`Which do you need: GCF or LCM? ${p}`, ['GCF', 'LCM'], k === 'GCF' ? 0 : 1, k === 'GCF' ? `Splitting into the biggest equal parts uses the GCF.` : `Finding when things match or line up uses the LCM.`); }
    return num(`A class can split into teams of ${a} or into teams of ${b} with no one left out. What is the smallest the class could be?`, l, `The size must be a multiple of ${a} and of ${b}. The LCM is ${l}.`); } },
  d: { t: 'GCF × LCM = the product', g: (R) => { const [a, b, l] = lmPair(R, 4, 20, true), g = gcd(a, b), t = R.int(0, 2);
    if (t === 0) return num(`The GCF of ${a} and ${b} is ${g}, and ${a} ${X} ${b} = ${a * b}. What is their LCM?`, l, `GCF ${X} LCM = ${a} ${X} ${b}, so LCM = ${a * b} ${D} ${g} = ${l}.`);
    if (t === 1) return num(`Two numbers have GCF ${g} and LCM ${l}. One number is ${a}. What is the other?`, b, `GCF ${X} LCM = ${g} ${X} ${l} = ${g * l}. ${g * l} ${D} ${a} = ${b}.`);
    const ds = [`${g} + ${l} = ${a} + ${b}`, `${g} ${X} ${l} = ${a} + ${b}`, `${l} ${D} ${g} = ${a} ${X} ${b}`].filter((s, i) => i === 0 ? g + l !== a + b : i === 1 ? g * l !== a + b : l / g !== a * b);
    return choice(R, `${a} and ${b} have GCF ${g} and LCM ${l}. Which is true?`, `${g} ${X} ${l} = ${a} ${X} ${b}`, ds, `${g} ${X} ${l} = ${g * l} and ${a} ${X} ${b} = ${a * b}: GCF ${X} LCM is always the product.`); } },
}});

/* ---------- II.4.10 Square numbers ---------- */
const SQ = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => n * n);
E2.skill({ id: 'II.4.10', name: 'Square numbers', steps: {
  a: { t: 'squares as arrays', g: (R) => { const n = R.int(2, 8), t = R.int(0, 2);
    if (t === 0) return num(`This square array has ${n} rows of ${n}. How many dots?`, n * n, `${n} ${X} ${n} = ${n * n}.`, {visual: V.array(n, n, {r: 8})});
    if (t === 1) { const sq = R.pick(SQ.slice(1, 10)), ds = R.sample([6, 8, 10, 12, 14, 18, 20, 24, 27, 30, 32, 40, 45, 50], 3);
      return choice(R, `Which number of dots can make a square array (same number of rows and columns)?`, sq, ds, `${sq} = ${Math.sqrt(sq)} ${X} ${Math.sqrt(sq)}.`); }
    return num(`A square array has ${n * n} dots. How many rows does it have?`, n, `${n} ${X} ${n} = ${n * n}, so ${n} rows of ${n}.`); } },
  b: { t: 'up to 12 × 12', g: (R) => { const n = R.int(2, 12), t = R.int(0, 2);
    if (t === 0) return num(`${n}<sup>2</sup> = ?`, n * n, `${n}<sup>2</sup> means ${n} ${X} ${n} = ${n * n}.`);
    if (t === 1) return choice(R, `What is ${n}<sup>2</sup>?`, n * n, [2 * n, n + 2, (n + 1) * (n + 1)].filter(v => v !== n * n), `${n}<sup>2</sup> = ${n} ${X} ${n} = ${n * n}, not ${n} ${X} 2.`);
    return num(`Which number times itself makes ${n * n}?`, n, `${n} ${X} ${n} = ${n * n}.`); } },
  c: { t: 'squares have an odd number of factors', g: (R) => { const r = R.int(2, 10), sq = r * r, t = R.int(0, 2);
    if (t === 0) return num(`How many factors does ${sq} have?`, factors(sq).length, `${L(factors(sq))}. ${r} pairs with itself, so it is counted once.`);
    if (t === 1) { const ds = R.sample(upto(6, 100, m => !SQ.includes(m) && factors(m).length >= 4), 3);
      return choice(R, `Which number has an odd number of factors?`, sq, ds, `${sq} = ${r} ${X} ${r} is a square: ${r} has no separate partner, so its factor count is odd (${factors(sq).length}).`); }
    return choice(R, `Why does ${sq} have an odd number of factors?`, `In ${r} ${X} ${r}, ${r} pairs with itself, so it is counted once.`, [`${sq} is ${sq % 2 ? 'odd' : 'even'}.`, `Every number has an odd number of factors.`, `${sq} is bigger than ${r}.`], `Factors come in pairs, except ${r}: ${pairStr(pairs(sq))}.`); } },
  d: { t: 'patterns', g: (R) => { const n = R.int(1, 9), t = R.int(0, 3);
    if (t === 0) { const s = [0, 1, 2, 3].map(i => (n + i) ** 2); return num(`${L(s)}, ? What comes next?`, (n + 4) ** 2, `These are square numbers; next is ${n + 4} ${X} ${n + 4} = ${(n + 4) ** 2}. The gaps are odd: ${2 * n + 1}, ${2 * n + 3}, ${2 * n + 5}, ${2 * n + 7}.`); }
    if (t === 1) return num(`${n + 1}<sup>2</sup> ${M} ${n}<sup>2</sup> = ?`, 2 * n + 1, `${(n + 1) ** 2} ${M} ${n * n} = ${2 * n + 1}, which is ${n} + ${n + 1}.`);
    if (t === 2) return num(`${n}<sup>2</sup> = ${n * n}. Add ${n} + ${n + 1} to find ${n + 1}<sup>2</sup>.`, (n + 1) ** 2, `${n * n} + ${2 * n + 1} = ${(n + 1) ** 2}.`);
    const s = [0, 1, 2, 3, 4].map(i => (n + i) ** 2);
    return choice(R, `What is the pattern in the gaps between ${L(s)}?`, `odd numbers: ${2 * n + 1}, ${2 * n + 3}, ${2 * n + 5}, …`, [`add ${2 * n + 1} each time`, `even numbers: ${2 * n + 2}, ${2 * n + 4}, …`, `double each time`], `The gaps go up by 2: ${2 * n + 1}, ${2 * n + 3}, ${2 * n + 5}, ${2 * n + 7}.`); } },
}});

/* ---------- II.4.11 Even and odd rules ---------- */
const EO = ['Even', 'Odd'], par = n => n % 2, pw = n => n % 2 ? 'odd' : 'even';
E2.skill({ id: 'II.4.11', name: 'Even and odd rules', steps: {
  a: { t: 'sums', g: (R) => { const k = R.bool(0.7) ? 2 : 3, ns = Array.from({length: k}, () => R.int(11, 999)), s = ns.reduce((a, b) => a + b, 0);
    return choiceFixed(`Without adding: is ${ns.join(' + ')} even or odd?`, EO, par(s), `${ns.map(pw).join(' + ')} is ${pw(s)}${k === 2 && ns.every(par) ? ': the two leftover ones make a pair' : ''}. (${ns.join(' + ')} = ${fmt(s)}.)`); } },
  b: { t: 'products', g: (R) => { const k = R.bool(0.6) ? 2 : 3, wantOdd = R.bool(), ns = Array.from({length: k}, () => wantOdd ? 2 * R.int(5, 49) + 1 : R.int(11, 99)); if (!wantOdd && ns.every(x => x % 2)) { const j = R.int(0, k - 1); ns[j] -= 1; } const p = ns.reduce((a, b) => a * b, 1);
    return choiceFixed(`Without multiplying: is ${ns.join(` ${X} `)} even or odd?`, EO, par(p), ns.every(par) ? `Every factor is odd, so the product is odd.` : `${ns.find(x => !par(x))} is even, so the product is even: a product is odd only when every factor is odd.`); } },
  c: { t: 'even or odd: sums and products of many numbers', g: (R) => { const t = R.int(0, 3), nn = () => R.int(11, 99);
    if (t === 0) { const k = R.int(4, 6), ns = Array.from({length: k}, nn), s = ns.reduce((a, b) => a + b, 0), no = ns.filter(par).length;
      return choiceFixed(`Without adding: is ${ns.join(' + ')} even or odd?`, EO, par(s), `Count the odd numbers: ${no}. ${no % 2 ? 'An odd count of odd numbers leaves one unpaired, so the sum is odd' : 'An even count of odd numbers pairs up, so the sum is even'}. (Total ${fmt(s)}.)`); }
    if (t === 1) { const k = R.int(4, 5), allOdd = R.bool(0.45), ns = Array.from({length: k}, () => allOdd ? 2 * R.int(2, 9) + 1 : R.int(3, 19)); if (!allOdd && ns.every(par)) ns[R.int(0, k - 1)] += 1; const p = ns.reduce((a, b) => a * b, 1);
      return choiceFixed(`Without multiplying: is ${ns.join(` ${X} `)} even or odd?`, EO, par(p), ns.every(par) ? `All ${k} factors are odd, so the product is odd.` : `${ns.find(x => !par(x))} is even, so the whole product is even.`); }
    if (t === 2) { const [a, b, c, d] = [nn(), nn(), nn(), nn()], v = a * b + c * d, pa = par(a * b), pc = par(c * d);
      return choiceFixed(`Without working it out: is ${a} ${X} ${b} + ${c} ${X} ${d} even or odd?`, EO, par(v), `${a} ${X} ${b} is ${pw(a * b)} and ${c} ${X} ${d} is ${pw(c * d)}; ${pw(a * b)} + ${pw(c * d)} is ${pw(v)}. (${fmt(v)}.)`); }
    const [a, b, c] = [nn(), nn(), nn()], v = (a + b) * c;
    return choiceFixed(`Without working it out: is (${a} + ${b}) ${X} ${c} even or odd?`, EO, par(v), `${a} + ${b} is ${pw(a + b)}; ${pw(a + b)} ${X} ${pw(c)} is ${pw(v)}. (${fmt(v)}.)`); } },
  d: { t: 'puzzles', g: (R) => { const t = R.int(0, 2);
    if (t === 0) { const k = R.int(3, 7), S = R.int(k + 4, 40), ok = par(S) === par(k);
      return yn(`Can ${k} odd numbers add up to ${S}?`, ok, ok ? `Yes: ${k} odd numbers make ${k % 2 ? 'an odd' : 'an even'} sum, like ${S}. For example ${Array(k - 1).fill(1).join(' + ')} + ${S - k + 1}.` : `No: ${k} odd numbers always make ${k % 2 ? 'an odd' : 'an even'} sum, and ${S} is ${pw(S)}.`); }
    if (t === 1) { const o = R.int(2, 9), e = R.int(1, 6);
      return choiceFixed(`You add ${o} odd numbers and ${e} even number${e === 1 ? '' : 's'}. Is the total even or odd?`, EO, par(o), `The evens don't change it. ${o} odd numbers give ${o % 2 ? 'odd' : 'even'}: ${o % 2 ? 'one leftover is unpaired' : 'the leftovers pair up'}.`); }
    const n = R.int(3, 5), S = R.int(15, 45);
    return yn(`Can ${n} even numbers add up to ${S}?`, S % 2 === 0, S % 2 === 0 ? `Yes: even numbers always add to an even number, like ${S}.` : `No: even numbers always add to an even number, and ${S} is odd.`); } },
}});

/* ---------- II.4.12 Number puzzles with factors ---------- */
const clueSet = (R, t) => {
  const pool = [];
  const ks = upto(2, 12, k => t % k === 0 && k !== t); ks.forEach(k => pool.push({s: `I am a multiple of ${k}.`, f: n => n % k === 0}));
  const Ns = upto(t + 1, 100, N => N % t === 0 && N !== t); Ns.forEach(N => pool.push({s: `I am a factor of ${N}.`, f: n => N % n === 0}));
  if (t % 10) { const lo = Math.floor(t / 10) * 10; pool.push({s: `I am between ${lo} and ${lo + 10}.`, f: n => n > lo && n < lo + 10}); }
  pool.push({s: `I am ${pw(t)}.`, f: n => n % 2 === t % 2});
  const hi = t + R.int(1, 6); pool.push({s: `I am less than ${hi}.`, f: n => n < hi});
  const lo2 = t - R.int(1, 6); if (lo2 > 1) pool.push({s: `I am more than ${lo2}.`, f: n => n > lo2});
  if (isPrime(t)) pool.push({s: `I am prime.`, f: isPrime});
  return pool;
};
E2.skill({ id: 'II.4.12', name: 'Number puzzles with factors', steps: {
  a: { t: 'mystery numbers', g: (R) => { for (let tries = 0; tries < 400; tries++) {
      const t = R.int(6, 60), pool = clueSet(R, t), k = R.pick([2, 3, 3]), cs = R.sample(pool, k), cand = upto(1, 100, n => cs.every(c => c.f(n)));
      const fi = cs.findIndex(c => /factor/.test(c.s)); if (cand.length !== 1 || fi < 0) continue;
      if (cs.some((_, i) => upto(1, 100, n => cs.every((c, j) => j === i || c.f(n))).length < 2)) continue; // every clue must be needed
      const ord = [cs[fi]].concat(cs.filter((_, i) => i !== fi)), c1 = upto(1, 100, n => ord[0].f(n));
      return num(`${ord.map(c => c.s).join(' ')} What number am I?`, t, `${ord[0].s.replace('I am a factor of', 'Factors of').replace('.', ':')} ${L(c1)}. Only ${t} fits the other clues too.`);
    } throw new Error('no mystery'); } },
  b: { t: 'perfect numbers', g: (R) => { const t = R.int(0, 2), n = R.bool(0.45) ? R.pick([6, 28]) : R.pick([8, 10, 12, 14, 15, 16, 18, 20, 21, 22, 24, 9, 25, 30]), pf_ = factors(n).filter(f => f < n), s = sumProper(n);
    if (t === 0) { const pr = `Add the factors of ${n}, not counting ${n} itself. What is the total?`, ex = `${pf_.join(' + ')} = ${s}. ${s === n ? `That equals ${n}, so ${n} is perfect.` : `That is not ${n}, so ${n} is not perfect.`}`;
      if (R.bool()) return num(pr, s, ex);
      return choice(R, pr, s, [s + n, s - 1, s + 1], ex + ` Don't add ${n} itself.`); }
    if (t === 1) { const good = R.pick([6, 28, 496]), ds = R.sample([12, 8, 10, 18, 20, 24, 30, 16, 100, 36, 27], 3);
      return choice(R, `A perfect number equals the sum of its factors other than itself. Which is perfect?`, good, ds, good === 496 ? `1 + 2 + 4 + 8 + 16 + 31 + 62 + 124 + 248 = 496.` : `${factors(good).filter(f => f < good).join(' + ')} = ${good}.`); }
    return yn(`Is ${n} a perfect number? (Add its factors other than ${n}.)`, s === n, `${pf_.join(' + ')} = ${s}${s === n ? `, which is ${n}: perfect.` : `, not ${n}.`}`); } },
  c: { t: 'factor games', g: (R) => { const t = R.int(0, 2), rule = `Factor Game: you pick a number and score it. Your partner scores all its other factors.`;
    if (t === 0) { const n = pickN(R, 4, 30, m => !isPrime(m)); return num(`${rule} You pick ${n}. What does your partner score?`, sumProper(n), `The other factors of ${n} are ${L(factors(n).filter(f => f < n))}: ${factors(n).filter(f => f < n).join(' + ')} = ${sumProper(n)}.`); }
    if (t === 1) { const p = R.pick(PRIMES.filter(x => x > 11 && x < 30)), ds = R.sample(upto(12, 30, m => !isPrime(m)), 3);
      return choice(R, `${rule} Which first pick gives your partner the fewest points?`, p, ds, `${p} is prime: its only other factor is 1, so your partner scores just 1.`); }
    const n = R.pick([6, 28, 4, 8, 9, 10, 12, 14, 15, 16, 18, 20, 21, 22, 24, 25, 26, 27, 30]), s = sumProper(n);
    return choiceFixed(`${rule} You pick ${n}. Who scores more?`, ['You', 'Your partner', 'A tie'], s < n ? 0 : s > n ? 1 : 2, `You get ${n}; your partner gets ${factors(n).filter(f => f < n).join(' + ')} = ${s}.${s === n ? ` ${n} is a perfect number!` : ''}`); } },
  d: { t: 'explain a strategy', g: (R) => { const t = R.int(0, 2);
    if (t === 0) { const p = R.pick(PRIMES.filter(x => x > 20 && x < 50)); return choice(R, `In the Factor Game, why is ${p} a good first pick?`, `${p} is prime, so your partner gets only 1 point.`, [`${p} has many factors, so you score them all.`, `Odd numbers score double.`, `Your partner gets ${p} points too, so it's fair.`], `${p}'s factors are only 1 and ${p}: you score ${p}, your partner 1.`); }
    if (t === 1) { const n = pickN(R, 30, 99, m => !SQ.includes(m) && pairs(m).length >= 2), s = Math.floor(Math.sqrt(n));
      return choice(R, `To find all factor pairs of ${n}, why can you stop testing at ${s}?`, `${s + 1} ${X} ${s + 1} = ${(s + 1) ** 2} is more than ${n}, so any bigger factor was already found as a partner.`, [`Numbers bigger than ${s} are never factors.`, `${n} is odd, so small numbers are enough.`.replace(`${n} is odd`, `${n} is ${pw(n)}`), `${s} is the largest factor of ${n}.`], `Pairs so far: ${pairStr(pairs(n))}. Past ${s} you'd only meet the partners again.`); }
    const n = pickN(R, 50, 120, m => !isPrime(m) && m % 2 && m % 5), p = spf(n);
    return choice(R, `Quick test: is ${n} prime? Which is the best strategy?`, `Try dividing by the primes 2, 3, 5, 7, … up to about ${Math.floor(Math.sqrt(n))}.`, [`Check if ${n} is odd; odd numbers are prime.`, `Check the last digit only.`, `Divide by every number up to ${n}.`], `Here ${n} ${D} ${p} = ${n / p}, so ${n} is composite. Odd does not mean prime.`); } },
}});
})();

/* Era II · Unit II.5 Fractions I (II.5.01–II.5.15)
   Local helpers live under F5 inside this file. */
(function () {
  const { num, choice, choiceFixed, tf, frac, fh, fmt, V, C } = E2;
  const gcd = E2.gcd, lcm = E2.lcm, W = E2.words;
  const F5 = {};
  const f2 = v => +(+v).toFixed(2);
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  const DEN = { 1: 'wholes', 2: 'halves', 3: 'thirds', 4: 'fourths', 5: 'fifths', 6: 'sixths', 7: 'sevenths', 8: 'eighths', 9: 'ninths', 10: 'tenths', 11: 'elevenths', 12: 'twelfths' };
  const ONE = { 1: 'whole', 2: 'half', 3: 'third', 4: 'fourth', 5: 'fifth', 6: 'sixth', 7: 'seventh', 8: 'eighth', 9: 'ninth', 10: 'tenth', 11: 'eleventh', 12: 'twelfth' };
  const fw = (n, d) => `${W(n)} ${n === 1 ? ONE[d] : DEN[d]}`;           // "three fifths"
  const mx = (n, d) => { const w = Math.floor(n / d), r = n % d; return r === 0 ? String(w) : w ? fh(r, d, w) : fh(r, d); }; // n/d shown as mixed (not reduced)
  const mxr = (n, d) => { const [a, b] = E2.reduce(n, d); return mx(a, b); };
  const SYM = ['&lt;', '=', '&gt;'];
  const cmp = (a, b, c, d) => { const x = a * d, y = c * b; return x < y ? 0 : x === y ? 1 : 2; }; // a/b vs c/d
  const symWord = i => ['is less than', 'equals', 'is greater than'][i];
  const yn = (prompt, yes, explain, extra) => choiceFixed(prompt, ['yes', 'no'], yes ? 0 : 1, explain, extra);
  const NAMES = ['Ana', 'Ben', 'Mia', 'Leo', 'Sara', 'Kai', 'Nia', 'Omar', 'Lily', 'Sam', 'Zoe', 'Eli'];
  const two = R => R.sample(NAMES, 2);
  const U = (O, k) => (O.units === 'imperial' ? { len: 'ft', dist: 'mi', vol: 'cups', mass: 'lb' } : { len: 'm', dist: 'km', vol: 'L', mass: 'kg' })[k];

  /* ---------- shapes split into parts ---------- */
  // rectangle split along x (or y if vert) into parts of relative sizes ws; fill(i) → color or null
  F5.bar = (ws, fill, o = {}) => {
    const vert = o.vert, Wd = o.w || (vert ? 110 : 300), H = o.h || (vert ? 190 : 56), tot = ws.reduce((a, b) => a + b, 0); let p = 0, body = '';
    ws.forEach((w, i) => {
      const L = vert ? H : Wd, a = p / tot * L, b = (p + w) / tot * L; p += w;
      const x = vert ? 2 : 2 + a, y = vert ? 2 + a : 2, ww = vert ? Wd : b - a, hh = vert ? b - a : H;
      body += `<rect x="${f2(x)}" y="${f2(y)}" width="${f2(ww)}" height="${f2(hh)}" fill="${fill(i) || C.paper}" stroke="${C.ink}" stroke-width="2"/>`;
    });
    return V.svg(Wd + 4, H + 4, body, o.label || 'shape split into parts');
  };
  // circle split into slices of relative sizes ws
  F5.pie = (ws, fill, o = {}) => {
    const r = o.r || 62, cx = r + 4, cy = r + 4, tot = ws.reduce((a, b) => a + b, 0); let p = 0, body = '';
    if (ws.length === 1) body = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill(0) || C.paper}" stroke="${C.ink}" stroke-width="2"/>`;
    else ws.forEach((w, i) => {
      const a0 = -Math.PI / 2 + p / tot * 2 * Math.PI, a1 = -Math.PI / 2 + (p + w) / tot * 2 * Math.PI; p += w;
      const P = a => `${f2(cx + r * Math.cos(a))} ${f2(cy + r * Math.sin(a))}`;
      body += `<path d="M${cx} ${cy} L${P(a0)} A${r} ${r} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${P(a1)} Z" fill="${fill(i) || C.paper}" stroke="${C.ink}" stroke-width="2" stroke-linejoin="round"/>`;
    });
    return V.svg(2 * r + 8, 2 * r + 8, body, o.label || 'circle split into parts');
  };
  // rectangle cut into rows × cols equal cells; cell index = r*cols + c
  F5.grid = (rows, cols, fill, o = {}) => {
    const s = o.s || 46; let body = '';
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) body += `<rect x="${2 + c * s}" y="${2 + r * s}" width="${s}" height="${s}" fill="${fill(r * cols + c) || C.paper}" stroke="${C.ink}" stroke-width="2"/>`;
    return V.svg(cols * s + 4, rows * s + 4, body, o.label || 'rectangle split into parts');
  };
  const GRIDS = { 4: [[2, 2]], 6: [[2, 3], [3, 2]], 8: [[2, 4]], 9: [[3, 3]], 10: [[2, 5]], 12: [[3, 4], [2, 6]] };
  F5.uneq = (R, n) => { for (;;) { const ws = Array.from({ length: n }, () => R.int(1, 6)); if (Math.max(...ws) >= 2 * Math.min(...ws)) return ws; } };
  // a shape in d parts with the given set of parts shaded. o.kind: 'bar'|'vbar'|'pie'|'grid'; o.unequal
  F5.shape = (R, d, shaded, o = {}) => {
    const fill = i => shaded.has(i) ? (o.color || C.blue) : null;
    const kinds = ['bar', 'vbar', 'pie']; if (GRIDS[d] && !o.unequal) kinds.push('grid');
    const k = o.kind || R.pick(kinds);
    if (k === 'grid') { const [r, c] = R.pick(GRIDS[d]); return F5.grid(r, c, fill, { s: o.small ? 30 : 46 }); }
    const ws = o.unequal ? F5.uneq(R, d) : Array(d).fill(1);
    if (k === 'pie') return F5.pie(ws, fill, { r: o.small ? 40 : 62 });
    return F5.bar(ws, fill, o.small ? { vert: k === 'vbar', w: k === 'vbar' ? 60 : 160, h: k === 'vbar' ? 110 : 34 } : { vert: k === 'vbar' });
  };
  const some = (R, d, n) => new Set(R.sample([...Array(d).keys()], n));
  const first = n => new Set([...Array(n).keys()]);
  // unit square: d columns (n shaded) each cut into m rows
  F5.area = (d, m, n) => {
    const S = 200, cw = S / d, rh = S / m; let body = '';
    for (let c = 0; c < d; c++) for (let r = 0; r < m; r++) body += `<rect x="${f2(2 + c * cw)}" y="${f2(2 + r * rh)}" width="${f2(cw)}" height="${f2(rh)}" fill="${c < n ? C.teal : C.paper}" stroke="${C.ink}" stroke-width="1"/>`;
    for (let c = 0; c <= d; c++) body += `<line x1="${f2(2 + c * cw)}" y1="2" x2="${f2(2 + c * cw)}" y2="${S + 2}" stroke="${C.ink}" stroke-width="3"/>`;
    body += `<rect x="2" y="2" width="${S}" height="${S}" fill="none" stroke="${C.ink}" stroke-width="3"/>`;
    return V.svg(S + 4, S + 4, body, 'area model');
  };
  const smallBar = (n, d) => V.fbar(n, d, { w: 170, h: 22 });

  /* ================= II.5.01 Equal parts ================= */
  E2.skill({ id: 'II.5.01', name: 'Equal parts', steps: {
    a: { t: 'halves, thirds and fourths', g: R => {
      const d = R.pick([2, 3, 4]), sh = R.bool() ? some(R, d, 1) : new Set();
      return choiceFixed('The shape is cut into equal parts. What are the parts called?', ['halves', 'thirds', 'fourths'], d - 2,
        `There are ${d} equal parts, so each part is one ${ONE[d]}. The parts are ${DEN[d]}.`, { visual: F5.shape(R, d, sh) });
    } },
    b: { t: 'sixths and eighths', g: R => {
      const d = R.pick([6, 8]), sh = R.bool() ? some(R, d, 1) : new Set();
      return choiceFixed('The shape is cut into equal parts. What are the parts called?', ['fourths', 'sixths', 'eighths', 'tenths'], d === 6 ? 1 : 2,
        `Count the parts: ${d} equal parts are ${DEN[d]}.`, { visual: F5.shape(R, d, sh) });
    } },
    c: { t: 'equal or unequal', g: R => {
      const d = R.int(2, 6), m1 = R.bool(), eq = m1 ? R.bool() : R.bool(0.75), vis = F5.shape(R, d, new Set(), { unequal: !eq, kind: R.pick(['bar', 'vbar', 'pie']) });
      if (m1) return yn('Are all the parts the same size?', eq, eq ? `All ${d} parts are the same size, so they are equal parts.` : 'Some parts are bigger than others, so the parts are not equal.', { visual: vis });
      const k = R.bool(eq ? 0.67 : 0.6) ? d : R.pick([2, 3, 4, 5, 6].filter(x => x !== d)), yes = eq && k === d;
      return yn(`Does this shape show ${DEN[k]}?`, yes,
        !eq ? `The parts are not equal, so they are not ${DEN[k]}. ${cap(DEN[k])} must be ${k} equal parts.` : yes ? `There are ${d} equal parts, so yes, these are ${DEN[d]}.` : `There are ${d} equal parts, so these are ${DEN[d]}, not ${DEN[k]}.`, { visual: vis });
    } },
    d: { t: 'name the part', g: R => {
      const d = R.pick([2, 3, 4, 5, 6, 8, 10, 12]);
      const ds = [fh(d, 1), fh(d - 1, d)]; if (d > 2) ds.push(fh(1, d - 1)); else ds.push(fh(1, 3));
      return choice(R, 'The whole is cut into equal parts. What fraction of the whole is the shaded part?', fh(1, d), ds,
        `There are ${d} equal parts and 1 is shaded, so it is ${fh(1, d)} (one ${ONE[d]}).`, { visual: F5.shape(R, d, some(R, d, 1)) });
    } },
  } });

  /* ================= II.5.02 Unit fractions ================= */
  E2.skill({ id: 'II.5.02', name: 'Unit fractions', steps: {
    a: { t: '1/2, 1/3, 1/4', g: R => {
      const d = R.pick([2, 3, 4]);
      return choiceFixed('Which unit fraction is shaded?', [fh(1, 2), fh(1, 3), fh(1, 4)], d - 2,
        `The whole has ${d} equal parts and 1 is shaded: ${fh(1, d)}.`, { visual: F5.shape(R, d, some(R, d, 1)) });
    } },
    b: { t: 'larger denominators', g: R => {
      const d = R.int(5, 12);
      if (R.bool()) return num('Write the unit fraction that is shaded.', [frac(1, d)], `There are ${d} equal parts and 1 is shaded, so it is ${fh(1, d)}.`, { visual: F5.shape(R, d, some(R, d, 1), { kind: R.pick(['bar', 'pie']) }) });
      const k = R.pick(['bar', 'pie']), pic = (dd, un) => F5.shape(R, dd, first(1), { kind: k, small: true, unequal: un });
      return choice(R, `Which picture shows ${fh(1, d)}?`, pic(d), [pic(d - 1), pic(d + 1), pic(d, true)],
        `${fh(1, d)} is 1 of ${d} equal parts. Count the parts and check they are equal.`);
    } },
    c: { t: 'bigger denominator, smaller piece', g: R => {
      const v = R.int(0, 2);
      if (v === 0) {
        const [a, b] = R.distinct(2, 12, 2);
        return choice(R, `Two same-size bars are cut into ${a} equal parts and ${b} equal parts. Which parts are bigger?`, DEN[Math.min(a, b)], [DEN[Math.max(a, b)], 'They are the same size'],
          `Cutting the same bar into more parts makes each part smaller, so ${DEN[Math.min(a, b)]} are bigger.`);
      }
      const ds = R.distinct(2, 12, R.pick([3, 4])), big = v === 1, ans = big ? Math.min(...ds) : Math.max(...ds);
      return choice(R, `Which unit fraction is the ${big ? 'biggest' : 'smallest'}?`, fh(1, ans), ds.filter(x => x !== ans).map(x => fh(1, x)),
        big ? `Fewer parts means bigger parts, so ${fh(1, ans)} is biggest.` : `More parts means smaller parts, so ${fh(1, ans)} is smallest.`);
    } },
    d: { t: 'compare unit fractions', g: R => {
      const a = R.int(2, 12), b = R.bool(0.1) ? a : R.pick([...Array(11)].map((_, i) => i + 2).filter(x => x !== a)), s = cmp(1, a, 1, b);
      return choiceFixed(`Choose the sign: ${fh(1, a)} ? ${fh(1, b)}`, SYM, s,
        a === b ? 'Both are the same unit fraction, so they are equal.' : `${cap(DEN[Math.min(a, b)])} are bigger than ${DEN[Math.max(a, b)]}, so ${fh(1, a)} ${symWord(s)} ${fh(1, b)}.`);
    } },
  } });

  /* ================= II.5.03 Fractions of a whole ================= */
  E2.skill({ id: 'II.5.03', name: 'Fractions of a whole', steps: {
    a: { t: '3/4 of a shape', g: R => {
      const d = R.pick([3, 4, 5, 6, 8]), n = R.int(2, d - 1);
      return choice(R, 'What fraction of the shape is shaded?', fh(n, d), [...new Set([fh(n, d - n), fh(n, 1), d - n !== n ? fh(d - n, d) : fh(d, n), fh(d, n)])].slice(0, 3),
        `${n} of the ${d} equal parts ${n === 1 ? 'is' : 'are'} shaded, so ${fh(n, d)} is shaded.`, { visual: F5.shape(R, d, R.bool() ? first(n) : some(R, d, n)) });
    } },
    b: { t: 'numerator and denominator', g: R => {
      const d = R.int(3, 12), n = R.int(1, d - 1);
      if (R.bool()) return num('Write the shaded fraction. What are its numerator and denominator?', [{ label: 'numerator', ans: n }, { label: 'denominator', ans: d }],
        `The denominator counts the equal parts (${d}); the numerator counts the shaded parts (${n}).`, { visual: F5.shape(R, d, some(R, d, n), { kind: R.pick(['bar', 'pie']) }) });
      if (R.bool()) return choice(R, `In ${fh(n, d)}, what does the denominator ${d} tell you?`, `The whole is cut into ${d} equal parts`, [`${d} parts are shaded`, `There are ${d} wholes`],
        `The denominator (bottom number) tells how many equal parts make the whole: ${d}.`);
      return choice(R, `In ${fh(n, d)}, what does the numerator ${n} tell you?`, `${n} of the parts are counted`, [`The whole is cut into ${n} parts`, `Each part is ${n} long`],
        `The numerator (top number) tells how many parts we are counting: ${n}.`);
    } },
    c: { t: 'write a fraction', g: R => {
      const d = R.int(2, 12), n = R.int(1, d - 1);
      if (R.bool(0.6)) return num('What fraction of the shape is shaded?', [frac(n, d)], `${n} of ${d} equal parts ${n === 1 ? 'is' : 'are'} shaded: ${fh(n, d)}.`, { visual: F5.shape(R, d, R.bool() ? first(n) : some(R, d, n)) });
      return num(`Write <b>${fw(n, d)}</b> as a fraction.`, [frac(n, d, 'improper')], `${cap(W(n))} is the numerator and ${DEN[d]} means ${d} parts: ${fh(n, d)}.`);
    } },
    d: { t: 'draw a fraction', g: R => {
      const d = R.pick([3, 4, 5, 6, 8]), n = R.int(1, d - 1), k = R.pick(['bar', 'pie']);
      const pic = (nn, dd, un) => F5.shape(R, dd, first(nn), { kind: k, small: true, unequal: un });
      const ds = [pic(n, n + d), pic(n, d, true)]; if (d - n !== n) ds.push(pic(d - n, d)); else ds.push(pic(n, d + 1));
      return choice(R, `Which picture shows ${fh(n, d)}?`, pic(n, d), ds,
        `${fh(n, d)} needs ${d} equal parts with ${n} shaded.`);
    } },
  } });

  /* ================= II.5.04 Fractions of a set ================= */
  const SETS = [['students', 'wear glasses'], ['marbles', 'are blue'], ['apples', 'are green'], ['cars', 'are red'], ['books', 'are new'], ['cookies', 'have nuts'], ['birds', 'are ducks'], ['stickers', 'are stars'], ['shells', 'are white']];
  E2.skill({ id: 'II.5.04', name: 'Fractions of a set', steps: {
    a: { t: '1/3 of 6', g: R => {
      const d = R.int(2, 5), k = R.int(2, 6), N = d * k;
      return num(`What is ${fh(1, d)} of ${N}?`, k, `Split ${N} into ${d} equal groups: ${N} ÷ ${d} = ${k}.`, { visual: V.dots(N, { layout: 'scatter', R, r: 9, w: 320, h: 150 }) });
    } },
    b: { t: '2/3 of 6', g: R => {
      const d = R.int(3, 6), n = R.int(2, d - 1), k = R.int(2, 6), N = d * k;
      const ex = `${fh(1, d)} of ${N} is ${N} ÷ ${d} = ${k}, so ${fh(n, d)} is ${n} × ${k} = ${n * k}.`;
      if (R.bool(0.4)) return choice(R, `What is ${fh(n, d)} of ${N}?`, n * k, [N % n === 0 ? N / n * d : N - k, k, N - n * k].filter(x => x > 0), ex + ` Divide by the bottom, multiply by the top.`);
      return num(`What is ${fh(n, d)} of ${N}?`, n * k, ex, R.bool() ? { visual: V.dots(N, { layout: 'scatter', R, r: 9, w: 320, h: 150 }) } : {});
    } },
    c: { t: 'from a picture', g: R => {
      const N = R.int(4, 12), r = R.int(1, N - 1), cols = R.shuffle(Array.from({ length: N }, (_, i) => i < r ? C.red : C.blue)), red = R.bool();
      return num(`What fraction of the dots are ${red ? 'red' : 'blue'}?`, [frac(red ? r : N - r, N)],
        `${red ? r : N - r} of the ${N} dots are ${red ? 'red' : 'blue'}: ${fh(red ? r : N - r, N)}.`, { visual: V.dots(N, { layout: N > 7 ? 'grid' : 'row', per: 6, color: cols }) });
    } },
    d: { t: 'word problems', g: R => {
      const d = R.int(3, 8), n = R.int(1, d - 1), k = R.int(2, 6), N = d * k, [thing, what] = R.pick(SETS), not = R.bool(0.35);
      const ans = not ? N - n * k : n * k, verb = what.replace(/^(are|have|wear) /, m => m);
      return num(`There are ${N} ${thing}. ${cap(fh(n, d))} of them ${what}. How many ${not ? 'do not' : ''}${not ? ' ' + what.replace(/^are/, 'be').replace(/^have/, 'have').replace(/^wear/, 'wear') : what}?`.replace('do not be', 'are not').replace(/How many are$/, 'How many are'), ans,
        not ? `${fh(n, d)} of ${N} = ${n * k}, so ${N} − ${n * k} = ${ans} do not.` : `${N} ÷ ${d} = ${k}, and ${n} × ${k} = ${ans}.`);
    } },
  } });

  /* ================= II.5.05 Fractions on a number line ================= */
  E2.skill({ id: 'II.5.05', name: 'Fractions on a number line', steps: {
    a: { t: 'split 0 to 1', g: R => {
      const d = R.int(2, 10), vis = V.fline(0, 1, d);
      if (R.bool()) return num('0 to 1 is split into equal parts. How many parts?', d, `Count the spaces between 0 and 1 (not the marks): ${d}.`, { visual: vis });
      return num('0 to 1 is split into equal parts. What fraction is each part?', [frac(1, d)], `There are ${d} equal parts, so each part is ${fh(1, d)}.`, { visual: vis });
    } },
    b: { t: 'place unit fractions', g: R => {
      const d = R.int(2, 10);
      if (d < 4 || R.bool()) return num('What fraction is at the <b>?</b>', [frac(1, d)], `0 to 1 has ${d} equal parts. The ? is 1 part from 0: ${fh(1, d)}.`, { visual: V.fline(0, 1, d, { ask: [1, d] }) });
      const pos = [1, ...R.sample([...Array(d - 2)].map((_, i) => i + 2), 2)], L = ['A', 'B', 'C'], sh = R.shuffle([0, 1, 2]);
      const letters = sh.map((p, i) => [pos[p], d, L[i]]), ans = sh.indexOf(0);
      return choiceFixed(`Which point is at ${fh(1, d)}?`, L, ans, `${fh(1, d)} is the first mark after 0, one of ${d} equal parts.`, { visual: V.fline(0, 1, d, { letters }) });
    } },
    c: { t: 'place other fractions', g: R => {
      const d = R.int(3, 10), n = R.int(2, d - 1);
      if (d < 4 || R.bool()) return num('What fraction is at the <b>?</b>', [frac(n, d)], `Each part is ${fh(1, d)}. The ? is ${n} parts from 0: ${fh(n, d)}.`, { visual: V.fline(0, 1, d, { ask: [n, d] }) });
      const cand = [n - 1, n + 1, d - n].filter(x => x > 0 && x < d && x !== n), pos = [n, ...R.sample([...new Set(cand)], 2)];
      if (pos.length < 3) pos.push([...Array(d - 1)].map((_, i) => i + 1).find(x => !pos.includes(x)));
      const L = ['A', 'B', 'C'], sh = R.shuffle([0, 1, 2]), letters = sh.map((p, i) => [pos[p], d, L[i]]);
      return choiceFixed(`Which point is at ${fh(n, d)}?`, L, sh.indexOf(0), `Count ${n} jumps of ${fh(1, d)} from 0.`, { visual: V.fline(0, 1, d, { letters }) });
    } },
    d: { t: 'beyond 1', g: R => {
      const to = R.pick([2, 3]), d = R.int(2, to === 2 ? 6 : 5); let n; do n = R.int(d + 1, to * d - 1); while (n % d === 0);
      return num('What number is at the <b>?</b> Write a fraction or a mixed number.', [frac(n, d)],
        `Each whole has ${d} parts. The ? is ${n} parts from 0: ${fh(n, d)} = ${mx(n, d)}.`, { visual: V.fline(0, to, d, { ask: [n, d] }) });
    } },
  } });

  /* ================= II.5.06 Whole numbers as fractions ================= */
  E2.skill({ id: 'II.5.06', name: 'Whole numbers as fractions', steps: {
    a: { t: '2/2 = 1', g: R => {
      const d = R.int(2, 12), v = R.int(0, 2);
      if (v === 0) return num(`${fh(d, d)} = ?`, 1, `All ${d} of the ${d} parts make 1 whole.`, { visual: V.fbar(d, d) });
      if (v === 1) return num(`1 = ${fh('?', d)}`, d, `1 whole cut into ${d} parts has ${d} parts: 1 = ${fh(d, d)}.`);
      return num(`How many ${fh(1, d)}s make 1 whole?`, d, `${d} ${DEN[d]} make 1: ${fh(d, d)} = 1.`);
    } },
    b: { t: '4/1 = 4', g: R => {
      const n = R.int(2, 12);
      if (R.bool()) return num(`${fh(n, 1)} = ?`, n, `A denominator of 1 means each whole is 1 part, so ${n} parts are ${n} wholes.`);
      return choice(R, `Which fraction equals ${n}?`, fh(n, 1), [fh(1, n), fh(n, n)], `${fh(n, 1)} means ${n} wholes. ${fh(n, n)} = 1 and ${fh(1, n)} is less than 1.`);
    } },
    c: { t: '6/3 = 2', g: R => {
      const d = R.int(2, 6), k = R.int(2, 5);
      if (R.bool()) return num(`${fh(k * d, d)} = ?`, k, `${d} ${DEN[d]} make 1 whole, so ${k * d} ${DEN[d]} make ${k * d} ÷ ${d} = ${k}.`);
      return num(`${k} = ${fh('?', d)}`, k * d, `Each whole is ${d} ${DEN[d]}, so ${k} wholes are ${k} × ${d} = ${k * d} ${DEN[d]}.`);
    } },
    d: { t: 'on the number line', g: R => {
      const to = R.pick([3, 4]), d = R.int(2, 4), k = R.int(1, to);
      if (R.bool()) return num(`Point A is at ${fh('?', d)}. What is the missing numerator?`, k * d, `A is at ${k}. Each whole has ${d} parts, so ${k} = ${fh(k * d, d)}.`, { visual: V.fline(0, to, d, { labels: 'all', letters: [[k * d, d, 'A']] }) });
      const hide = [...Array(to)].map((_, i) => [i + 1, 1]);
      return num('Point A is at a whole number. Which one?', k, `A is at ${fh(k * d, d)} and ${k * d} ÷ ${d} = ${k}.`, { visual: V.fline(0, to, d, { labels: 'all', hide, letters: [[k * d, d, 'A']] }) });
    } },
  } });

  /* ================= II.5.07 Equivalent fractions with models ================= */
  E2.skill({ id: 'II.5.07', name: 'Equivalent fractions with models', steps: {
    a: { t: 'fraction strips', g: R => {
      const d = R.int(2, 6), m = R.int(2, Math.floor(12 / d)), n = R.int(1, d - 1);
      if (R.bool()) return num(`The strips are the same length. ${fh(n, d)} = ${fh('?', d * m)}`, n * m, `Each ${ONE[d]} matches ${m} ${DEN[d * m]}, so ${fh(n, d)} = ${fh(n * m, d * m)}.`, { visual: V.stack([V.fbar(n, d), V.fbar(0, d * m)]) });
      return num(`The strips are the same length. ${fh(n * m, d * m)} = ${fh('?', d)}`, n, `${m} ${DEN[d * m]} fill 1 ${ONE[d]}, so ${n * m} ${DEN[d * m]} = ${n} ${n === 1 ? ONE[d] : DEN[d]}.`, { visual: V.stack([V.fbar(n * m, d * m), V.fbar(0, d)]) });
    } },
    b: { t: 'number line', g: R => {
      const d = R.int(2, 4), m = R.int(2, Math.floor(12 / d)), n = R.int(1, d - 1);
      return num(`The dot on the top line is ${fh(n, d)}. The ? is at the same spot. ${fh(n, d)} = ${fh('?', d * m)}`, n * m,
        `The bottom line has ${d * m} parts. Count ${n * m} parts to reach the ?, so ${fh(n, d)} = ${fh(n * m, d * m)}.`,
        { visual: V.stack([V.fline(0, 1, d, { width: 460, labels: 'all', marks: [[n, d]] }), V.fline(0, 1, d * m, { width: 460, ask: [n * m, d * m] })], { gap: 4 }) });
    } },
    c: { t: 'area model', g: R => {
      const d = R.int(2, 5), m = R.int(2, 4), n = R.int(1, d - 1);
      return num(`${fh(n, d)} of the square is shaded. Each part is cut into ${m}. Count the small parts.`, [{ label: 'shaded', ans: n * m }, { label: 'in all', ans: d * m }],
        `Now ${n * m} of ${d * m} small parts are shaded: ${fh(n, d)} = ${fh(n * m, d * m)}.`, { visual: F5.area(d, m, n) });
    } },
    d: { t: 'generate equivalents', g: R => {
      const d = R.int(2, 6), n = R.int(1, d - 1), m = R.int(2, 5);
      if (R.bool()) return choice(R, `Which fraction is equal to ${fh(n, d)}?`, fh(n * m, d * m), [fh(n + m, d + m), fh(n * m, d), fh(n, d * m)],
        `Multiply top and bottom by ${m}: ${fh(n, d)} = ${fh(n * m, d * m)}. Adding the same number to both does not work.`);
      const ms = R.distinct(2, 6, 3), k = R.int(1, 4);
      return choice(R, `Which fraction is <b>not</b> equal to ${fh(n, d)}?`, fh(n + k, d + k), ms.map(x => fh(n * x, d * x)),
        `The others are ${fh(n, d)} with top and bottom multiplied by the same number. ${fh(n + k, d + k)} adds ${k} instead.`);
    } },
  } });

  /* ================= II.5.08 Equivalent fractions by rule ================= */
  const redPair = (R, lo, hi) => { for (;;) { const d = R.int(lo, hi), n = R.int(1, d - 1); if (gcd(n, d) === 1) return [n, d]; } };
  E2.skill({ id: 'II.5.08', name: 'Equivalent fractions by rule', steps: {
    a: { t: 'multiply top and bottom', g: R => {
      const [n, d] = redPair(R, 2, 10), m = R.int(2, 6);
      if (R.bool()) return num(`${fh(n, d)} = ${fh('?', d * m)}`, n * m, `${d} × ${m} = ${d * m}, so multiply the top by ${m} too: ${n} × ${m} = ${n * m}.`);
      return num(`${fh(n, d)} = ${fh(n * m, '?')}`, d * m, `${n} × ${m} = ${n * m}, so multiply the bottom by ${m} too: ${d} × ${m} = ${d * m}.`);
    } },
    b: { t: 'divide top and bottom', g: R => {
      const [n, d] = redPair(R, 2, 10), m = R.int(2, 6);
      if (R.bool()) return num(`${fh(n * m, d * m)} = ${fh('?', d)}`, n, `${d * m} ÷ ${m} = ${d}, so divide the top by ${m} too: ${n * m} ÷ ${m} = ${n}.`);
      return num(`${fh(n * m, d * m)} = ${fh(n, '?')}`, d, `${n * m} ÷ ${m} = ${n}, so divide the bottom by ${m} too: ${d * m} ÷ ${m} = ${d}.`);
    } },
    c: { t: 'simplest form', g: R => {
      let n, d, m; do { [n, d] = redPair(R, 2, 12); m = R.int(2, 6); } while (d * m > 60);
      return num(`Write ${fh(n * m, d * m)} in simplest form.`, [frac(n * m, d * m, 'simplest')], `The greatest common factor of ${n * m} and ${d * m} is ${m}. Divide both by ${m}: ${fh(n, d)}.`);
    } },
    d: { t: 'test equivalence', g: R => {
      const [n, d] = redPair(R, 2, 9), m = R.int(2, 5), v = R.bool() ? 0 : R.int(1, 3);
      let c = n * m, e = d * m;
      if (v === 1) { c = n + m; e = d + m; } else if (v === 2) { e = d * m + R.pick([-1, 1]); } else if (v === 3) { const k = R.pick([2, 3, 4, 5].filter(x => x !== m)); e = d * k; }
      const eq = n * e === c * d;
      return yn(`Are ${fh(n, d)} and ${fh(c, e)} equal?`, eq,
        eq ? `${n} × ${e / d} = ${c} and ${d} × ${e / d} = ${e}, so they are equal.` : `${n} × ${e} = ${n * e} but ${c} × ${d} = ${c * d}. Top and bottom were not multiplied by the same number.`);
    } },
  } });

  /* ================= II.5.09 Compare, same denominator ================= */
  const eatCtx = [['ate', 'of a pizza', 'The pizzas are the same size.', 'eat'], ['used', 'of a ribbon', 'The ribbons are the same length.', 'use'], ['drank', 'of a bottle of juice', 'The bottles are the same size.', 'drink'], ['painted', 'of a fence', 'The fences are the same size.', 'paint'], ['read', 'of a book', 'They read the same book.', 'read']];
  E2.skill({ id: 'II.5.09', name: 'Compare, same denominator', steps: {
    a: { t: 'more pieces is more', g: R => {
      const d = R.int(3, 10), [a, b] = R.distinct(1, d - 1, 2);
      return choice(R, `Which is more: ${fh(a, d)} or ${fh(b, d)}?`, fh(Math.max(a, b), d), [fh(Math.min(a, b), d)],
        `Both are ${DEN[d]}. ${E2.plural(Math.max(a, b), 'piece')} are more than ${E2.plural(Math.min(a, b), 'piece')}.`,
        { visual: V.stack([{ caption: `${a}/${d}`, svg: V.fbar(a, d, { w: 300, h: 36 }) }, { caption: `${b}/${d}`, svg: V.fbar(b, d, { w: 300, h: 36, color: C.red }) }]) });
    } },
    b: { t: 'with symbols', g: R => {
      const d = R.int(2, 12), a = R.int(1, d + 2), b = R.bool(0.15) ? a : R.int(1, d + 2), s = cmp(a, d, b, d);
      return choiceFixed(`Choose the sign: ${fh(a, d)} ? ${fh(b, d)}`, SYM, s, a === b ? 'Same numerator and same denominator: equal.' : `Same-size pieces, so compare the numerators: ${a} ${['&lt;', '=', '&gt;'][s]} ${b}.`);
    } },
    c: { t: 'on a number line', g: R => {
      const d = R.int(3, 10), [a, b] = R.distinct(1, d - 1, 2);
      if (R.bool()) return choice(R, `Which is greater? Use the number line.`, fh(Math.max(a, b), d), [fh(Math.min(a, b), d)],
        `${fh(Math.max(a, b), d)} is further right, so it is greater.`, { visual: V.fline(0, 1, d, { labels: 'all', marks: [[a, d], [b, d]] }) });
      return choiceFixed(`A is at ${fh(a, d)}. B is at ${fh(b, d)}. Which point shows the greater fraction?`, ['A', 'B'], a > b ? 0 : 1,
        `Numbers get greater to the right. ${fh(Math.max(a, b), d)} is further right.`, { visual: V.fline(0, 1, d, { letters: [[a, d, 'A'], [b, d, 'B']] }) });
    } },
    d: { t: 'story problems', g: R => {
      const d = R.int(3, 12), [a, b] = R.distinct(1, d - 1, 2), [p, q] = two(R), [verb, what, same, base] = R.pick(eatCtx);
      if (R.bool(0.6)) return choice(R, `${p} ${verb} ${fh(a, d)} ${what}. ${q} ${verb} ${fh(b, d)}. ${same} Who ${verb} more?`, a > b ? p : q, [a > b ? q : p, 'The same'],
        `Same-size pieces (${DEN[d]}), so ${Math.max(a, b)} pieces is more than ${Math.min(a, b)}.`);
      return num(`${p} ${verb} ${fh(a, d)} ${what}. ${q} ${verb} ${fh(b, d)}. ${same} How many more ${DEN[d]} did ${a > b ? p : q} ${base}?`,
        Math.abs(a - b), `Same-size pieces: ${Math.max(a, b)} ${DEN[d]} is ${Math.abs(a - b)} more than ${Math.min(a, b)} ${DEN[d]}.`);
    } },
  } });

  /* ================= II.5.10 Compare, same numerator ================= */
  E2.skill({ id: 'II.5.10', name: 'Compare, same numerator', steps: {
    a: { t: 'bigger pieces is more', g: R => {
      const [b1, b2] = R.distinct(2, 10, 2), n = R.int(1, Math.min(b1, b2) - 1 || 1);
      return choice(R, `Which is more: ${fh(n, b1)} or ${fh(n, b2)}?`, fh(n, Math.min(b1, b2)), [fh(n, Math.max(b1, b2))],
        `Both have ${n} piece${n > 1 ? 's' : ''}, but ${DEN[Math.min(b1, b2)]} are bigger than ${DEN[Math.max(b1, b2)]}.`,
        { visual: V.stack([{ caption: `${n}/${b1}`, svg: V.fbar(n, b1, { w: 300, h: 36 }) }, { caption: `${n}/${b2}`, svg: V.fbar(n, b2, { w: 300, h: 36, color: C.red }) }]) });
    } },
    b: { t: 'with symbols', g: R => {
      const n = R.int(1, 9), b1 = R.int(2, 12), b2 = R.bool(0.12) ? b1 : R.int(2, 12), s = cmp(n, b1, n, b2);
      return choiceFixed(`Choose the sign: ${fh(n, b1)} ? ${fh(n, b2)}`, SYM, s,
        b1 === b2 ? 'They are the same fraction.' : `Same number of pieces; ${DEN[Math.min(b1, b2)]} are bigger pieces, so ${fh(n, b1)} ${symWord(s)} ${fh(n, b2)}.`);
    } },
    c: { t: 'reason about size', g: R => {
      const [s1, s2] = R.distinct(2, 12, 2), b1 = Math.min(s1, s2), b2 = Math.max(s1, s2), n = R.int(1, b1 - 1 || 1);
      if (R.bool()) return choice(R, `Why is ${fh(n, b1)} &gt; ${fh(n, b2)}?`, `${cap(DEN[b1])} are bigger pieces than ${DEN[b2]}`,
        [`${cap(DEN[b2])} are bigger pieces than ${DEN[b1]}`, `${fh(n, b1)} has more pieces`],
        `Both have ${n} piece${n > 1 ? 's' : ''}. A whole cut into ${b1} parts has bigger parts than one cut into ${b2}.`);
      const v = R.int(0, 3), good = v === 0 || v === 3;
      return tf([`True or false: ${fh(n, b1)} &gt; ${fh(n, b2)} because ${DEN[b1]} are bigger than ${DEN[b2]}.`, `True or false: ${fh(n, b2)} &gt; ${fh(n, b1)} because ${DEN[b2]} are bigger than ${DEN[b1]}.`, `True or false: ${fh(n, b2)} &gt; ${fh(n, b1)} because ${b2} &gt; ${b1}.`, `True or false: ${fh(n, b1)} &gt; ${fh(n, b2)} because ${b1} &lt; ${b2}, so each piece is bigger.`][v], good,
        `Same numerator, so the fraction with the smaller denominator (bigger pieces) is greater: ${fh(n, b1)}.`);
    } },
    d: { t: 'story problems', g: R => {
      const [s1, s2] = R.distinct(2, 12, 2), n = R.int(1, Math.min(s1, s2) - 1 || 1), [p, q] = two(R), [verb, what, same] = R.pick(eatCtx);
      return choice(R, `${p} ${verb} ${fh(n, s1)} ${what}. ${q} ${verb} ${fh(n, s2)}. ${same} Who ${verb} more?`, s1 < s2 ? p : q, [s1 < s2 ? q : p, 'The same'],
        `Both ${verb} ${n} piece${n > 1 ? 's' : ''}, but ${DEN[Math.min(s1, s2)]} are bigger than ${DEN[Math.max(s1, s2)]}.`);
    } },
  } });

  /* ================= II.5.11 Compare any fractions ================= */
  E2.skill({ id: 'II.5.11', name: 'Compare any fractions', steps: {
    a: { t: 'against 1/2', g: R => {
      const d = R.int(3, 12); let n = R.int(1, d - 1); if (d % 2 === 0 && R.bool(0.15)) n = d / 2;
      const s = cmp(n, d, 1, 2);
      return choiceFixed(`Is ${fh(n, d)} less than, equal to, or more than ${fh(1, 2)}?`, [`less than ${fh(1, 2)}`, `equal to ${fh(1, 2)}`, `more than ${fh(1, 2)}`], s,
        d % 2 === 0 ? `Half of ${d} is ${d / 2}, so ${fh(d / 2, d)} = ${fh(1, 2)}. ${n} ${['&lt;', '=', '&gt;'][s]} ${d / 2}.` : `Double the numerator: ${n} × 2 = ${2 * n}, which is ${2 * n < d ? 'less' : 'more'} than ${d}.`);
    } },
    b: { t: 'common denominators', g: R => {
      const b = R.int(2, 6), m = R.int(2, Math.floor(12 / b)), dd = b * m, a = R.int(1, b - 1);
      let c = R.bool(0.2) ? a * m : R.int(1, dd - 1); const sw = R.bool();
      const [x1, y1, x2, y2] = sw ? [c, dd, a, b] : [a, b, c, dd], s = cmp(x1, y1, x2, y2);
      return choiceFixed(`Choose the sign: ${fh(x1, y1)} ? ${fh(x2, y2)}`, SYM, s, `Rename: ${fh(a, b)} = ${fh(a * m, dd)}. Compare ${fh(a * m, dd)} with ${fh(c, dd)}.`);
    } },
    c: { t: 'cross-multiplying as a check', g: R => {
      let a, b, c, d; do { b = R.int(3, 9); d = R.int(3, 9); a = R.int(1, b - 1); c = R.int(1, d - 1); } while (b === d || a * d === c * b);
      if (R.bool()) return num(`Check ${fh(a, b)} vs ${fh(c, d)} by cross-multiplying.`, [{ label: `${a} × ${d} =`, ans: a * d }, { label: `${c} × ${b} =`, ans: c * b }],
        `${a} × ${d} = ${a * d} and ${c} × ${b} = ${c * b}, so ${fh(a, b)} ${symWord(cmp(a, b, c, d))} ${fh(c, d)}.`);
      if (R.bool(0.2)) { const b0 = R.int(2, 4), a0 = R.int(1, b0 - 1), m0 = R.int(2, Math.floor(9 / b0));
        return choiceFixed(`Choose the sign: ${fh(a0, b0)} ? ${fh(a0 * m0, b0 * m0)}`, SYM, 1, `Cross-multiply: ${a0} × ${b0 * m0} = ${a0 * b0 * m0} and ${a0 * m0} × ${b0} = ${a0 * m0 * b0}. The products match, so the fractions are equal.`); }
      const s = cmp(a, b, c, d);
      return choiceFixed(`Choose the sign: ${fh(a, b)} ? ${fh(c, d)}`, SYM, s, `Cross-multiply: ${a} × ${d} = ${a * d} and ${c} × ${b} = ${c * b}. ${a * d} ${['&lt;', '=', '&gt;'][s]} ${c * b}.`);
    } },
    d: { t: 'order a list', g: R => {
      let fs; do { fs = [0, 1, 2].map(() => { const d = R.int(2, 12); return [R.int(1, d - 1), d]; }); }
      while (new Set(fs.map(([n, d]) => n / d)).size < 3 || new Set(fs.map(f => f[0])).size < 3 || new Set(fs.map(f => f[1])).size < 3);
      const show = arr => arr.map(([n, d]) => fh(n, d)).join(', ');
      const asc = fs.slice().sort((x, y) => x[0] / x[1] - y[0] / y[1]);
      const byNum = fs.slice().sort((x, y) => x[0] - y[0]), byDen = fs.slice().sort((x, y) => x[1] - y[1]);
      return choice(R, 'Order from least to greatest.', show(asc), [show(byNum), show(byDen), show(asc.slice().reverse())],
        `Compare with ${fh(1, 2)} and common denominators: ${show(asc).replace(/, /g, ' &lt; ')}.`);
    } },
  } });

  /* ================= II.5.12 Mixed numbers ================= */
  const mixPick = (R, maxW = 3, lo = 2, hi = 6) => { const b = R.int(lo, hi), a = R.int(1, b - 1), w = R.int(1, maxW); return [w, a, b]; };
  E2.skill({ id: 'II.5.12', name: 'Mixed numbers', steps: {
    a: { t: 'read 1 3/4', g: R => {
      const [w, a, b] = mixPick(R);
      if (R.bool()) return num('Each bar is 1 whole. Write the shaded amount as a mixed number.', [frac(w * b + a, b, 'mixed')],
        `${w} whole bar${w > 1 ? 's' : ''} and ${a} of ${b} parts: ${fh(a, b, w)}.`, { visual: V.fbar(w * b + a, b, { w: 280, h: 30 }) });
      const ds = [`${W(w + a)} ${DEN[b]}`, `${W(w)} times ${fw(a, b)}`]; if (a !== w && w < b) ds.push(`${W(a)} and ${fw(w, b)}`);
      return choice(R, `How do you read ${fh(a, b, w)}?`, `${W(w)} and ${fw(a, b)}`, ds, `${fh(a, b, w)} is ${w} whole${w > 1 ? 's' : ''} and ${fh(a, b)} more: "${W(w)} and ${fw(a, b)}".`);
    } },
    b: { t: 'on a number line', g: R => {
      const to = R.pick([2, 3]), d = R.int(2, to === 2 ? 6 : 5); let n; do n = R.int(d + 1, to * d - 1); while (n % d === 0 || gcd(n % d, d) > 1);
      return num('Write the number at the <b>?</b> as a mixed number.', [frac(n, d, 'mixed')], `The ? is ${Math.floor(n / d)} whole${n >= 2 * d ? 's' : ''} and ${n % d} more ${n % d === 1 ? ONE[d] : DEN[d]}: ${mx(n, d)}.`, { visual: V.fline(0, to, d, { ask: [n, d] }) });
    } },
    c: { t: 'draw one', g: R => {
      const [w, a, b] = mixPick(R, 2, 3, 6);
      const pic = n => smallBar(n, b), ds = [pic((w + 1) * b + a), pic(w + a <= b - 1 ? w + a : a)];
      if (b - a !== a) ds.push(pic(w * b + b - a));
      return choice(R, `Which picture shows ${fh(a, b, w)}? Each bar is 1 whole.`, pic(w * b + a), ds,
        `${fh(a, b, w)} is ${w} full bar${w > 1 ? 's' : ''} and ${a} of ${b} parts of the next one.`);
    } },
    d: { t: 'whole part and fraction part', g: R => {
      const [w, a, b] = mixPick(R, 9, 2, 10), v = R.int(0, 3);
      if (v === 0) return num(`${fh(a, b, w)} = ${w} + ?`, [frac(a, b)], `${fh(a, b, w)} is ${w} and ${fh(a, b)} more.`);
      if (v === 1) return num(`${fh(a, b, w)} = ? + ${fh(a, b)}`, w, `The whole part of ${fh(a, b, w)} is ${w}.`);
      if (v === 2) return num(`${w} + ${fh(a, b)} = ? Write it as a mixed number.`, [frac(w * b + a, b, 'mixed')], `Write the whole part next to the fraction part: ${fh(a, b, w)}.`);
      return num(`Split ${fh(a, b, w)} into its whole part and fraction part.`, [{ label: 'whole part', ans: w }, { label: 'fraction part', frac: [a, b], form: 'any' }], `${fh(a, b, w)} = ${w} + ${fh(a, b)}.`);
    } },
  } });

  /* ================= II.5.13 Improper fractions ================= */
  E2.skill({ id: 'II.5.13', name: 'Improper fractions', steps: {
    a: { t: 'greater than 1', g: R => {
      const d1 = R.int(2, 9), big = [R.int(d1 + 1, 2 * d1 + 1), d1], d2 = R.int(2, 9), eq = [d2, d2], d3 = R.int(3, 12), p1 = [R.int(1, d3 - 1), d3], d4 = R.int(3, 12), p2 = [R.int(1, d4 - 1), d4];
      if (R.bool(0.65)) return choice(R, 'Which fraction is greater than 1?', fh(...big), [fh(...eq), fh(...p1), fh(...p2)],
        `In ${fh(...big)} the numerator is bigger than the denominator, so it is more than 1 whole.`);
      const s1 = [R.int(d1 + 1, 2 * d1 + 1), d1], s2 = [R.int(d2 + 1, 2 * d2), d2];
      return choice(R, 'Which fraction is less than 1?', fh(...p1), [fh(...eq), fh(...s1), fh(...s2)],
        `In ${fh(...p1)} the numerator is smaller than the denominator, so it is less than 1 whole.`);
    } },
    b: { t: 'to mixed numbers', g: R => {
      const d = R.int(2, 10); let n; do n = R.int(d + 1, 5 * d); while (n % d === 0 || gcd(n % d, d) > 1);
      return num(`Write ${fh(n, d)} as a mixed number.`, [frac(n, d, 'mixed')], `${n} ÷ ${d} = ${Math.floor(n / d)} R ${n % d}, so ${fh(n, d)} = ${mx(n, d)}.`);
    } },
    c: { t: 'mixed to improper', g: R => {
      const [w, a, b] = mixPick(R, 6, 2, 10);
      return num(`Write ${fh(a, b, w)} as an improper fraction.`, [frac(w * b + a, b, 'improper')], `${w} × ${b} = ${w * b} ${DEN[b]}, plus ${a} is ${w * b + a}: ${fh(w * b + a, b)}.`);
    } },
    d: { t: 'compare', g: R => {
      const d = R.int(2, 8), w = R.int(1, 4), a = R.int(1, d - 1), n = w * d + a + (R.bool(0.3) ? 0 : R.pick([-2, -1, 1, 2]));
      const nn = Math.max(d + 1, n), s = cmp(nn, d, w * d + a, d), sw = R.bool();
      const L = sw ? fh(a, d, w) : fh(nn, d), Rt = sw ? fh(nn, d) : fh(a, d, w);
      return choiceFixed(`Choose the sign: ${L} ? ${Rt}`, SYM, sw ? 2 - s : s, `${fh(a, d, w)} = ${fh(w * d + a, d)}. Compare ${fh(w * d + a, d)} with ${fh(nn, d)}.`);
    } },
  } });

  /* ================= II.5.14 Fractions as division ================= */
  E2.skill({ id: 'II.5.14', name: 'Fractions as division', steps: {
    a: { t: '3 ÷ 4 = 3/4', g: R => {
      const b = R.int(2, 12), a = R.int(1, b - 1), v = R.int(0, 2);
      if (v === 0) return num(`${a} ÷ ${b} = ? Write it as a fraction.`, [frac(a, b)], `Dividing ${a} by ${b} gives the fraction ${fh(a, b)}.`);
      if (v === 1) return num(`${fh(a, b)} = ${a} ÷ ?`, b, `A fraction is its numerator divided by its denominator: ${fh(a, b)} = ${a} ÷ ${b}.`);
      return num(`${fh(a, b)} = ? ÷ ${b}`, a, `A fraction is its numerator divided by its denominator: ${fh(a, b)} = ${a} ÷ ${b}.`);
    } },
    b: { t: 'sharing pizzas', g: R => {
      const b = R.int(2, 8), a = R.int(1, Math.min(4, b - 1));
      return num(`${a} pizza${a > 1 ? 's are' : ' is'} shared equally by ${b} people. What fraction of a pizza does each person get?`, [frac(a, b)],
        a === 1 ? `Cut the pizza into ${b} equal slices. Each person gets 1 slice: 1 ÷ ${b} = ${fh(1, b)}.` : `Cut each pizza into ${b} slices. Each person gets 1 slice from each pizza, ${a} ${DEN[b]} in all: ${a} ÷ ${b} = ${fh(a, b)}.`,
        { visual: V.side(Array.from({ length: a }, () => V.fcircle(0, 1, { r: 40 })), { gap: 14 }) });
    } },
    c: { t: 'mixed-number answers', g: R => {
      const b = R.int(2, 8); let a; do a = R.int(b + 1, 5 * b); while (a % b === 0 || gcd(a, b) > 1);
      return num(`${a} ÷ ${b} = ? Write it as a mixed number.`, [frac(a, b, 'mixed')], `${a} ÷ ${b} = ${Math.floor(a / b)} R ${a % b}. The ${a % b} left over is split in ${b}: ${mx(a, b)}.`);
    } },
    d: { t: 'word problems', g: (R, O) => {
      const b = R.int(2, 6); let a; do a = R.int(b + 1, 4 * b); while (a % b === 0 || gcd(a, b) > 1);
      const ctx = R.pick([
        [`${a} ${U(O, 'len')} of ribbon is cut into ${b} equal pieces. How long is each piece, in ${U(O, 'len')}?`, 'ribbon'],
        [`${a} pizzas are shared equally by ${b} friends. How many pizzas does each friend get?`, 'pizza'],
        [`${a} ${U(O, 'vol')} of juice is poured equally into ${b} jugs. How much is in each jug, in ${U(O, 'vol')}?`, 'juice'],
        [`${b} children share ${a} ${U(O, 'mass')} of clay equally. How much does each get, in ${U(O, 'mass')}?`, 'clay'],
      ]);
      return num(`${ctx[0]} Write a mixed number.`, [frac(a, b, 'mixed')], `${a} ÷ ${b} = ${fh(a, b)} = ${mx(a, b)}.`);
    } },
  } });

  /* ================= II.5.15 Fraction sense ================= */
  E2.skill({ id: 'II.5.15', name: 'Fraction sense', steps: {
    a: { t: 'the same whole matters', g: R => {
      const [p, q] = two(R);
      if (R.bool()) {
        const [n, d] = R.pick([[1, 2], [1, 3], [1, 4], [3, 4], [2, 3]]), bigFirst = R.bool(), thing = R.pick(['pizza', 'cake', 'pie', 'watermelon']);
        return choice(R, `${p} ate ${fh(n, d)} of a ${bigFirst ? 'large' : 'small'} ${thing}. ${q} ate ${fh(n, d)} of a ${bigFirst ? 'small' : 'large'} ${thing}. Who ate more?`, bigFirst ? p : q, [bigFirst ? q : p, 'The same'],
          `The fractions match, but ${fh(n, d)} of a larger whole is a larger amount.`);
      }
      const a = R.int(2, 4), b = R.int(a + 1, 8), k1 = R.int(2, 5), k2 = R.int(2, 8), N1 = a * k1, N2 = b * k2;
      const ans = k1 > k2 ? `${fh(1, a)} of ${N1}` : k2 > k1 ? `${fh(1, b)} of ${N2}` : 'They are equal';
      return choice(R, `Which is more: ${fh(1, a)} of ${N1} or ${fh(1, b)} of ${N2}?`, ans, [`${fh(1, a)} of ${N1}`, `${fh(1, b)} of ${N2}`, 'They are equal'],
        `${fh(1, a)} of ${N1} = ${k1} and ${fh(1, b)} of ${N2} = ${k2}. The size of the whole matters.`);
    } },
    b: { t: 'near 0, 1/2 or 1', g: R => {
      let n, d, v; do { d = R.int(5, 12); n = R.int(1, d - 1); v = n / d; } while (Math.abs(v - 0.25) < 0.07 || Math.abs(v - 0.75) < 0.07);
      const k = v < 0.25 ? 0 : v < 0.75 ? 1 : 2;
      return choiceFixed(`Is ${fh(n, d)} closest to 0, ${fh(1, 2)} or 1?`, ['0', fh(1, 2), '1'], k,
        [`${n} is small compared with ${d}, so it is near 0.`, `${fh(n, d)} is closer to ${fh(1, 2)} than to 0 or 1: half of ${d} is ${d / 2}, and ${n} is near it.`, `${n} is close to ${d}, so it is near 1.`][k]);
    } },
    c: { t: 'estimate', g: R => {
      const near = bm => { for (;;) { const d = R.int(5, 12), n = R.int(1, d - 1); if (Math.abs(n / d - bm) <= 0.13) return [n, d]; } };
      let b1, b2; do { b1 = R.pick([0, 0.5, 1]); b2 = R.pick([0, 0.5, 1]); } while (b1 + b2 === 0);
      const [a, b] = near(b1), [c, d] = near(b2), est = b1 + b2, opts = [0.5, 1, 1.5, 2];
      return choiceFixed(`About how much is ${fh(a, b)} + ${fh(c, d)}?`, [fh(1, 2), '1', fh(1, 2, 1), '2'], opts.indexOf(est),
        `${fh(a, b)} is about ${b1 === 0.5 ? fh(1, 2) : b1} and ${fh(c, d)} is about ${b2 === 0.5 ? fh(1, 2) : b2}, so the sum is about ${est === 1.5 ? fh(1, 2, 1) : est === 0.5 ? fh(1, 2) : est}.`);
    } },
    d: { t: 'explain a comparison', g: R => {
      if (R.bool()) {
        let a, b, c, d; do { b = R.int(3, 9); d = R.int(6, 12); a = R.int(1, b - 1); c = R.int(1, d - 1); } while (!(2 * a > b && 2 * c < d && c > a));
        return choice(R, `Which is greater, and why? ${fh(a, b)} or ${fh(c, d)}`, `${fh(a, b)}: it is more than ${fh(1, 2)}, and ${fh(c, d)} is less than ${fh(1, 2)}`,
          [`${fh(c, d)}: ${c} is more than ${a}`, `${fh(c, d)}: ${DEN[d]} are bigger pieces`, 'They are equal'],
          `Double each top: ${a} × 2 = ${2 * a} &gt; ${b}, so ${fh(a, b)} &gt; ${fh(1, 2)}; ${c} × 2 = ${2 * c} &lt; ${d}, so ${fh(c, d)} &lt; ${fh(1, 2)}.`);
      }
      const [s1, s2] = R.distinct(3, 12, 2), sm = Math.min(s1, s2), bg = Math.max(s1, s2);
      return choice(R, `Which is greater, and why? ${fh(s1 - 1, s1)} or ${fh(s2 - 1, s2)}`, `${fh(bg - 1, bg)}: it is only ${fh(1, bg)} away from 1, a smaller gap`,
        [`${fh(sm - 1, sm)}: ${DEN[sm]} are bigger pieces`, 'They are equal: both are 1 piece from 1'],
        `Each is 1 piece short of 1. ${fh(1, bg)} is a smaller gap than ${fh(1, sm)}, so ${fh(bg - 1, bg)} is closer to 1.`);
    } },
  } });
})();

/* Era II · Unit II.6 Fractions II (II.6.01–II.6.14)
   Local helpers live under F6 inside this file. */
(function () {
  const { num, choice, choiceFixed, tf, frac, fh, fmt, V, C } = E2;
  const gcd = E2.gcd, lcm = E2.lcm;
  const F6 = {};
  const f2 = v => +(+v).toFixed(2);
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  const DEN = { 1: 'wholes', 2: 'halves', 3: 'thirds', 4: 'fourths', 5: 'fifths', 6: 'sixths', 7: 'sevenths', 8: 'eighths', 9: 'ninths', 10: 'tenths', 11: 'elevenths', 12: 'twelfths' };
  const DENS = d => DEN[d] || `${d}ths`;
  const mx = (n, d) => { const w = Math.floor(n / d), r = n % d; return r === 0 ? String(w) : w ? fh(r, d, w) : fh(r, d); }; // n/d as mixed, not reduced
  const mxr = (n, d) => { const [a, b] = E2.reduce(n, d); return mx(a, b); };                                             // reduced, mixed if > 1
  const SYM = ['&lt;', '=', '&gt;'];
  const cmp = (a, b, c, d) => { const x = a * d, y = c * b; return x < y ? 0 : x === y ? 1 : 2; };
  const yn = (prompt, yes, explain, extra) => choiceFixed(prompt, ['yes', 'no'], yes ? 0 : 1, explain, extra);
  const NAMES = ['Ana', 'Ben', 'Mia', 'Leo', 'Sara', 'Kai', 'Nia', 'Omar', 'Lily', 'Sam', 'Zoe', 'Eli'];
  const two = R => R.sample(NAMES, 2);
  const U = (O, k) => (O.units === 'imperial' ? { len: 'ft', dist: 'mi', vol: 'cups', mass: 'lb' } : { len: 'm', dist: 'km', vol: 'L', mass: 'kg' })[k];
  const proper = (R, lo, hi) => { const d = R.int(lo, hi); return [R.int(1, d - 1), d]; };
  const cop = (R, d) => { for (;;) { const n = R.int(1, d - 1); if (gcd(n, d) === 1) return n; } }; // numerator in lowest terms
  const properR = (R, lo, hi) => { for (;;) { const [n, d] = proper(R, lo, hi); if (gcd(n, d) === 1) return [n, d]; } };
  // answer form helper: mixed if > 1 (not whole), otherwise simplest
  const simp = (n, d) => (n > d && n % d ? { f: frac(n, d, 'mixed'), say: 'Write it as a mixed number in simplest form.' } : { f: frac(n, d, 'simplest'), say: 'Write it in simplest form.' });

  // choice of fractions: items are [n,d] or {v:[n,d], s:'html'}; distractors equal in value to the answer (or each other) are dropped
  F6.fc = (R, prompt, c, ds, explain, extra, show = (n, d) => fh(n, d)) => {
    const it = x => Array.isArray(x) ? { v: x, s: show(x[0], x[1]) } : x;
    const cc = it(c), seen = [cc.v], out = [];
    for (const raw of ds) {
      if (!raw) continue; const x = it(raw), [n, d] = x.v;
      if (!Number.isInteger(n) || !Number.isInteger(d) || n <= 0 || d <= 0) continue;
      if (seen.some(([p, q]) => p * d === n * q) || out.includes(x.s) || x.s === cc.s) continue;
      seen.push(x.v); out.push(x.s);
    }
    return choice(R, prompt, cc.s, out.slice(0, 3), explain, extra);
  };

  /* ---------- visuals ---------- */
  // bar(s) of d parts with colored runs: segs = [[count, color], …]; o.cross = indices drawn crossed out
  F6.bar = (segs, d, o = {}) => {
    const Wd = o.w || 360, H = o.h || 40, gap = 10, tot = segs.reduce((s, x) => s + x[0], 0), bars = o.bars || Math.max(1, Math.ceil(tot / d - 1e-9));
    const cols = []; segs.forEach(([k, c]) => { for (let i = 0; i < k; i++) cols.push(c); });
    const cross = new Set(o.cross || []); let body = '';
    for (let b = 0; b < bars; b++) for (let i = 0; i < d; i++) {
      const k = b * d + i, w = (Wd - 4) / d, x = 2 + i * w, y = 2 + b * (H + gap);
      body += `<rect x="${f2(x)}" y="${y}" width="${f2(w)}" height="${H}" fill="${cols[k] || C.paper}" stroke="${C.ink}" stroke-width="2"/>`;
      if (cross.has(k)) body += `<path d="M${f2(x + 6)} ${y + 6} L${f2(x + w - 6)} ${y + H - 6} M${f2(x + w - 6)} ${y + 6} L${f2(x + 6)} ${y + H - 6}" stroke="${C.ink}" stroke-width="2.5"/>`;
    }
    return V.svg(Wd, bars * (H + gap) - gap + 4, body, o.label || 'fraction bar');
  };
  // three strips stacked: a/b, c/d and an empty strip of L parts
  F6.strips = (a, b, c, d, L) => V.stack([
    { caption: `${a}/${b}`, svg: V.fbar(a, b, { w: 360, h: 32 }) },
    { caption: `${c}/${d}`, svg: V.fbar(c, d, { w: 360, h: 32, color: C.red }) },
    { caption: `${DENS(L)}`, svg: V.fbar(0, L, { w: 360, h: 32 }) }], { gap: 6 });
  // number line 0..to in d parts with n jumps of `step` parts from 0; ask at the landing point
  F6.jline = (to, d, step, n, o = {}) => {
    const W = Math.min(620, Math.max(320, to * d * 34 + 60)), pad = 26, y = 30, X = k => pad + k / (to * d) * (W - 2 * pad);
    let arcs = '';
    for (let i = 0; i < n; i++) { const x1 = X(i * step), x2 = X((i + 1) * step), m = (x1 + x2) / 2; arcs += `<path d="M${f2(x1)} ${y - 5} Q${f2(m)} ${y - 36} ${f2(x2)} ${y - 5}" fill="none" stroke="${C.teal}" stroke-width="2.5"/>`; }
    return V.fline(0, to, d, { width: W, ask: o.ask }).replace('</svg>', arcs + '</svg>');
  };
  // a bar of b parts; the first part is split into n pieces, one piece dark
  F6.split = (b, n) => {
    const Wd = 360, H = 46, w = (Wd - 4) / b; let body = '';
    for (let i = 0; i < b; i++) body += `<rect x="${f2(2 + i * w)}" y="2" width="${f2(w)}" height="${H}" fill="${i === 0 ? C.blue + '55' : C.paper}" stroke="${C.ink}" stroke-width="2.5"/>`;
    body += `<rect x="2" y="2" width="${f2(w / n)}" height="${H}" fill="${C.blue}" stroke="${C.ink}" stroke-width="1.5"/>`;
    for (let j = 1; j < n; j++) body += `<line x1="${f2(2 + j * w / n)}" y1="2" x2="${f2(2 + j * w / n)}" y2="${H + 2}" stroke="${C.ink}" stroke-width="1.5" stroke-dasharray="4 3"/>`;
    return V.svg(Wd + 4, H + 4, body, 'bar with one part split into pieces');
  };
  // unit square: b columns (first a blue), d rows (first c yellow); overlap purple
  F6.area = (b, d, a, c) => {
    const S = 200, cw = S / b, rh = S / d; let body = '';
    for (let i = 0; i < b; i++) for (let j = 0; j < d; j++) {
      const both = i < a && j < c, fill = both ? C.violet : i < a ? C.blue : j < c ? C.amber : C.paper, op = both ? 1 : (i < a || j < c) ? 0.45 : 1;
      body += `<rect x="${f2(2 + i * cw)}" y="${f2(2 + j * rh)}" width="${f2(cw)}" height="${f2(rh)}" fill="${fill}" fill-opacity="${op}" stroke="${C.ink}" stroke-width="1"/>`;
    }
    body += `<rect x="2" y="2" width="${S}" height="${S}" fill="none" stroke="${C.ink}" stroke-width="3"/>`;
    return V.svg(S + 4, S + 4, body, 'area model');
  };

  /* ================= II.6.01 Add, like denominators ================= */
  E2.skill({ id: 'II.6.01', name: 'Add, like denominators', steps: {
    a: { t: 'with models', g: R => {
      const d = R.int(3, 10), a = R.int(1, d - 2), b = R.int(1, d - a);
      return num(`${fh(a, d)} + ${fh(b, d)} = ?`, [frac(a + b, d)], `Blue ${a} + red ${b} = ${a + b} ${DENS(d)} shaded, so the sum is ${fh(a + b, d)}.`,
        { visual: F6.bar([[a, C.blue], [b, C.red]], d) });
    } },
    b: { t: 'with numbers', g: R => {
      const d = R.int(3, 12), a = R.int(1, d - 2), b = R.int(1, d - a), ex = `The pieces are all ${DENS(d)}: add the tops, keep the bottom. ${a} + ${b} = ${a + b}, so ${fh(a + b, d)}.`;
      if (R.bool(0.4)) return F6.fc(R, `${fh(a, d)} + ${fh(b, d)} = ?`, [a + b, d], [[a + b, 2 * d], [a * b, d], [a + b, d * d], [a + b + 1, d]], ex + ` Not ${fh(a + b, 2 * d)}.`);
      if (R.bool(0.3)) return num(`${fh(a, d)} + ${fh('?', d)} = ${fh(a + b, d)}`, b, `${a} + ${b} = ${a + b}, so the missing top is ${b}.`);
      return num(`${fh(a, d)} + ${fh(b, d)} = ?`, [frac(a + b, d)], ex);
    } },
    c: { t: 'sums over 1', g: R => {
      let d, a, b; do { d = R.int(2, 10); a = R.int(1, d - 1); b = R.int(1, d - 1); } while (a + b <= d || (a + b) % d === 0);
      return num(`${fh(a, d)} + ${fh(b, d)} = ? Write it as a mixed number in simplest form.`, [frac(a + b, d, 'mixed')],
        `${a} + ${b} = ${a + b}, so ${fh(a + b, d)}. ${d} ${DENS(d)} make 1, so it is ${mxr(a + b, d)}.`);
    } },
    d: { t: 'story problems', g: (R, O) => {
      const [p, q] = two(R), v = R.int(0, 3), d = R.int(3, 10), a = R.int(1, d - 2), b = v === 0 ? R.int(1, d - a) : R.int(1, d - 1);
      const P = [
        `${p} ate ${fh(a, d)} of a pizza. ${q} ate ${fh(b, d)} of it. How much of the pizza did they eat in all?`,
        `${p} walked ${fh(a, d)} ${U(O, 'dist')} to school and ${fh(b, d)} ${U(O, 'dist')} to the park. How far did ${p} walk in all?`,
        `A jug holds ${fh(a, d)} ${U(O, 'vol')} of water. ${p} pours in ${fh(b, d)} ${U(O, 'vol')} more. How much water is in the jug now?`,
        `${p} has two ribbons, ${fh(a, d)} ${U(O, 'len')} and ${fh(b, d)} ${U(O, 'len')} long. What is their total length?`][v];
      return num(P, [frac(a + b, d)], `${fh(a, d)} + ${fh(b, d)} = ${fh(a + b, d)}${a + b > d ? ' = ' + mxr(a + b, d) : ''}.`);
    } },
  } });

  /* ================= II.6.02 Subtract, like denominators ================= */
  E2.skill({ id: 'II.6.02', name: 'Subtract, like denominators', steps: {
    a: { t: 'with models', g: R => {
      const d = R.int(3, 10), a = R.int(2, d), b = R.int(1, a - 1);
      return num(`${fh(a, d)} − ${fh(b, d)} = ? The crossed-out parts are taken away.`, [frac(a - b, d)],
        `${a} ${DENS(d)} take away ${b} leaves ${a - b}: ${fh(a - b, d)}.`, { visual: F6.bar([[a, C.blue]], d, { cross: Array.from({ length: b }, (_, i) => a - 1 - i) }) });
    } },
    b: { t: 'with numbers', g: R => {
      const d = R.int(3, 12), a = R.int(2, d), b = R.int(1, a - 1);
      if (R.bool(0.3)) return num(`${fh(a, d)} − ${fh('?', d)} = ${fh(a - b, d)}`, b, `${a} − ${b} = ${a - b}, so the missing top is ${b}.`);
      if (R.bool(0.35)) return F6.fc(R, `${fh(a, d)} − ${fh(b, d)} = ?`, [a - b, d], [[a + b, d], [a - b + 1, d], [a - b, 2 * d]], `Same-size pieces: subtract the tops, keep the ${DENS(d)}. ${a} − ${b} = ${a - b}.`);
      return num(`${fh(a, d)} − ${fh(b, d)} = ?`, [frac(a - b, d)], `Same-size pieces: subtract the tops, keep the ${DENS(d)}. ${a} − ${b} = ${a - b}, so ${fh(a - b, d)}.`);
    } },
    c: { t: 'from a whole', g: R => {
      const w = R.pick([1, 1, 1, 2, 3]), d = R.int(3, 12), b = R.int(w === 1 ? 2 : 1, d - 1), n = w * d - b;
      const ex = `Write ${w} as ${fh(w * d, d)}. ${fh(w * d, d)} − ${fh(b, d)} = ${fh(n, d)}${w > 1 ? ' = ' + mx(n, d) : ''}.`;
      if (R.bool(0.45)) return F6.fc(R, `${w} − ${fh(b, d)} = ?`, [n, d], [[b - w, d], [d - b, d], [w * d + b, d], [n + 1, d]], ex, {}, mx);
      return num(`${w} − ${fh(b, d)} = ?`, [frac(n, d)], ex);
    } },
    d: { t: 'story problems', g: (R, O) => {
      const [p, q] = two(R), v = R.int(0, 3), d = R.int(3, 12), a = R.int(2, d), b = R.int(1, a - 1);
      if (v === 3) return num(`A pizza is cut into ${d} equal slices. ${p} eats ${b}. What fraction of the pizza is left?`, [frac(d - b, d)], `The whole pizza is ${fh(d, d)}. ${fh(d, d)} − ${fh(b, d)} = ${fh(d - b, d)}.`);
      const P = [
        `${p} had ${fh(a, d)} of a cake. ${p} ate ${fh(b, d)} of the cake. How much of the cake is left?`,
        `A ribbon is ${fh(a, d)} ${U(O, 'len')} long. ${p} cuts off ${fh(b, d)} ${U(O, 'len')}. How long is the ribbon now?`,
        `${p} ran ${fh(a, d)} ${U(O, 'dist')}. ${q} ran ${fh(b, d)} ${U(O, 'dist')}. How much farther did ${p} run?`][v];
      return num(P, [frac(a - b, d)], `${fh(a, d)} − ${fh(b, d)} = ${fh(a - b, d)}.`);
    } },
  } });

  /* ================= II.6.03 Break fractions apart ================= */
  E2.skill({ id: 'II.6.03', name: 'Break fractions apart', steps: {
    a: { t: '3/4 = 1/4 + 1/4 + 1/4', g: R => {
      const d = R.int(3, 10), n = R.int(2, Math.min(5, d - 1)), rep = (x, y, k) => Array(k).fill(fh(x, y)).join(' + ');
      if (R.bool()) return num(`How many ${fh(1, d)}s add up to ${fh(n, d)}?`, n, `${fh(n, d)} means ${n} pieces of ${fh(1, d)}: ${rep(1, d, n)}.`);
      const ds = [rep(1, d, n + 1), rep(1, d, n - 1), `${fh(1, d)} + ${fh(n - 1, d - 1)}`];
      return choice(R, `Which sum equals ${fh(n, d)}?`, rep(1, d, n), ds, `The numerator ${n} counts the pieces of ${fh(1, d)}: ${rep(1, d, n)}.`);
    } },
    b: { t: 'several ways', g: R => {
      const d = R.int(4, 12), n = R.int(3, d - 1), p = R.int(1, n - 1);
      if (R.bool()) return num(`${fh(n, d)} = ${fh(p, d)} + ${fh('?', d)}`, n - p, `Split only the top: ${n} = ${p} + ${n - p}, so ${fh(n, d)} = ${fh(p, d)} + ${fh(n - p, d)}.`);
      let q, s; do { q = R.int(1, d - 1); s = R.int(1, n - 1); } while ((s * (d - q) + (n - s) * q) * d === n * q * (d - q) || (s >= q && n - s >= d - q));
      const bad = `${fh(s, q)} + ${fh(n - s, d - q)}`;
      const good = R.sample([...Array(n - 1)].map((_, i) => i + 1), 2).map(x => `${fh(x, d)} + ${fh(n - x, d)}`);
      const three = n >= 3 ? `${fh(1, d)} + ${fh(1, d)} + ${fh(n - 2, d)}` : null;
      return choice(R, `Which is <b>not</b> equal to ${fh(n, d)}?`, bad, [...good, three].filter(Boolean),
        `When you split ${fh(n, d)}, the bottom stays ${d}. Only the tops are split, so ${bad} is not a split of ${fh(n, d)}.`);
    } },
    c: { t: 'mixed numbers', g: R => {
      const b = R.int(2, 8), a = R.int(1, b - 1), w = R.int(1, 3), v = R.int(0, 2);
      if (v === 0) return num(`${fh(a, b, w)} = ${fh('?', b)} + ${fh(a, b)}`, w * b, `Each whole is ${fh(b, b)}, so ${w} = ${fh(w * b, b)}.`);
      if (v === 1) return num(`${fh(w * b + a, b)} = ${w} + ${fh('?', b)}`, a, `${w} = ${fh(w * b, b)}, and ${w * b + a} − ${w * b} = ${a}. So ${fh(w * b + a, b)} = ${w} + ${fh(a, b)}.`);
      return num(`${fh(a, b, w)} = ${fh(b, b)} + ${fh('?', b)}`, (w - 1) * b + a, `${fh(a, b, w)} = ${fh(w * b + a, b)}. Take away ${fh(b, b)} and ${fh((w - 1) * b + a, b)} is left.`);
    } },
    d: { t: 'use it to add', g: R => {
      let d, a, c, r; do { d = R.int(3, 10); a = R.int(1, d - 1); c = R.int(1, d - 1); r = a + c - d; } while (r <= 0 || gcd(r, d) > 1);
      return num(`Add ${fh(a, d)} + ${fh(c, d)} by making 1 first: split ${fh(c, d)} = ${fh(d - a, d)} + ${fh('?', d)}. Write the total as a mixed number.`,
        [{ label: 'missing top', ans: r }, { label: 'total', frac: [a + c, d], form: 'mixed' }],
        `${fh(a, d)} + ${fh(d - a, d)} = 1, and ${fh(r, d)} is left over. The total is ${fh(r, d, 1)}.`);
    } },
  } });

  /* ================= II.6.04 Mixed numbers, like denominators ================= */
  const mixUp = (R, lo, hi, test) => { for (;;) { const d = R.int(lo, hi), a1 = R.int(1, d - 1), a2 = R.int(1, d - 1); if (test(a1, a2, d)) return [d, a1, a2]; } };
  E2.skill({ id: 'II.6.04', name: 'Mixed numbers, like denominators', steps: {
    a: { t: 'add wholes and parts', g: R => {
      const [d, a1, a2] = mixUp(R, 3, 10, (x, y, d) => x + y < d && gcd(x + y, d) === 1), w1 = R.int(1, 5), w2 = R.int(1, 4);
      return num(`${fh(a1, d, w1)} + ${fh(a2, d, w2)} = ? Write a mixed number.`, [frac((w1 + w2) * d + a1 + a2, d, 'mixed')],
        `Wholes: ${w1} + ${w2} = ${w1 + w2}. Parts: ${fh(a1, d)} + ${fh(a2, d)} = ${fh(a1 + a2, d)}. Together: ${fh(a1 + a2, d, w1 + w2)}.`);
    } },
    b: { t: 'regroup a whole', g: R => {
      if (R.bool()) {
        const d = R.int(2, 8), a = R.int(1, d - 1), w = R.int(2, 6), ex = `Take 1 whole = ${fh(d, d)} and add it to ${fh(a, d)}: ${d} + ${a} = ${d + a}. So ${fh(a, d, w)} = ${fh(d + a, d, w - 1)}.`;
        if (R.bool()) return choice(R, `${fh(a, d, w)} = ${w - 1} and how many ${DENS(d)}?`, d + a, [10 + a, a + 1, a], ex);
        return num(`${fh(a, d, w)} = ${fh('?', d, w - 1)}`, d + a, ex);
      }
      const [d, a1, a2] = mixUp(R, 3, 10, (x, y, d) => x + y > d && gcd(x + y - d, d) === 1), w1 = R.int(1, 5), w2 = R.int(1, 4), s = a1 + a2;
      return num(`${fh(a1, d, w1)} + ${fh(a2, d, w2)} = ? Write a mixed number.`, [frac((w1 + w2) * d + s, d, 'mixed')],
        `${w1 + w2} and ${fh(s, d)}. ${fh(s, d)} = ${fh(s - d, d, 1)}, so regroup: ${fh(s - d, d, w1 + w2 + 1)}.`);
    } },
    c: { t: 'subtract with regrouping', g: R => {
      const [d, a1, a2] = mixUp(R, 3, 10, (x, y, d) => x < y && gcd(d + x - y, d) === 1), w1 = R.int(3, 8), w2 = R.int(1, w1 - 1), r = d + a1 - a2, W2 = w1 - w2 - 1;
      const ex = `${fh(a1, d)} is less than ${fh(a2, d)}, so regroup: ${fh(a1, d, w1)} = ${fh(d + a1, d, w1 - 1)}. Then ${fh(d + a1, d, w1 - 1)} − ${fh(a2, d, w2)} = ${mx(W2 * d + r, d)}.`;
      if (R.bool(0.4)) return F6.fc(R, `${fh(a1, d, w1)} − ${fh(a2, d, w2)} = ?`, [W2 * d + r, d],
        [[(w1 - w2) * d + a2 - a1, d], [W2 * d + 10 + a1 - a2, d], [W2 * d + a2 - a1, d]], ex, {}, (n, dd) => mx(n, dd));
      return num(`${fh(a1, d, w1)} − ${fh(a2, d, w2)} = ? Write a mixed number.`, [frac(W2 * d + r, d, 'mixed')], ex);
    } },
    d: { t: 'story problems', g: (R, O) => {
      const [p, q] = two(R), add = R.bool();
      if (add) {
        const [d, a1, a2] = mixUp(R, 2, 8, (x, y, d) => gcd((x + y) % d, d) === 1 && (x + y) % d !== 0), w1 = R.int(1, 4), w2 = R.int(1, 4), n = (w1 + w2) * d + a1 + a2;
        const P = R.pick([`${p} walked ${fh(a1, d, w1)} ${U(O, 'dist')} on Monday and ${fh(a2, d, w2)} ${U(O, 'dist')} on Tuesday. How far in all?`,
          `A cake needs ${fh(a1, d, w1)} cups of flour and ${fh(a2, d, w2)} cups of sugar. How many cups is that in all?`]);
        return num(P + ' Write a mixed number.', [frac(n, d, 'mixed')], `${fh(a1, d, w1)} + ${fh(a2, d, w2)} = ${fh(a1 + a2, d, w1 + w2)}${a1 + a2 >= d ? ` = ${mx(n, d)}` : ''}.`);
      }
      const [d, a1, a2] = mixUp(R, 2, 8, (x, y, d) => x !== y && gcd(Math.abs(x - y) % d || d + x - y, d) === 1), w1 = R.int(3, 7), w2 = R.int(1, w1 - 1), n = (w1 * d + a1) - (w2 * d + a2);
      const P = R.pick([`A board is ${fh(a1, d, w1)} ${U(O, 'len')} long. ${p} cuts off ${fh(a2, d, w2)} ${U(O, 'len')}. How long is the rest?`,
        `${p} had ${fh(a1, d, w1)} ${U(O, 'mass')} of clay and used ${fh(a2, d, w2)} ${U(O, 'mass')}. How much is left?`]);
      return num(P + ' Write a mixed number.', [frac(n, d, 'mixed')], a1 < a2 ? `Regroup: ${fh(a1, d, w1)} = ${fh(d + a1, d, w1 - 1)}. Then subtract: ${mx(n, d)}.` : `Wholes: ${w1} − ${w2} = ${w1 - w2}. Parts: ${fh(a1, d)} − ${fh(a2, d)} = ${fh(a1 - a2, d)}. So ${mx(n, d)}.`);
    } },
  } });

  /* ================= II.6.05 Common denominators ================= */
  const pairShared = R => { for (;;) { const [b, d] = R.distinct(2, 12, 2); if (gcd(b, d) > 1 && lcm(b, d) <= 36) return [b, d]; } };
  const pairAny = (R, hi = 10, maxL = 24) => { for (;;) { const [b, d] = R.distinct(2, hi, 2); if (lcm(b, d) <= maxL) return [b, d]; } };
  const mults = (d, L) => Array.from({ length: L / d }, (_, i) => (i + 1) * d).join(', ');
  E2.skill({ id: 'II.6.05', name: 'Common denominators', steps: {
    a: { t: 'using the LCM', g: R => {
      const [b, d] = R.bool(0.75) ? pairShared(R) : pairAny(R, 9), L = lcm(b, d), [x, y] = b > d ? [b, d] : [d, b];
      const a = cop(R, b), c = cop(R, d), ex = `Multiples of ${x}: ${mults(x, L)}. The first one ${y} goes into is ${L}.`;
      if (R.bool(0.35)) return choice(R, `What is the least common denominator of ${fh(a, b)} and ${fh(c, d)}?`, L, [b * d, b + d, L * 2].filter(v => v !== L), ex);
      return num(`What is the least common denominator of ${fh(a, b)} and ${fh(c, d)}?`, L, ex);
    } },
    b: { t: 'multiply the denominators', g: R => {
      let b, d; do { [b, d] = R.distinct(2, 9, 2); } while (gcd(b, d) > 1);
      const a = cop(R, b), c = cop(R, d);
      if (R.bool()) return num(`Multiply the denominators to find a common denominator for ${fh(a, b)} and ${fh(c, d)}.`, b * d, `${b} × ${d} = ${b * d}. Both ${b} and ${d} go into ${b * d}.`);
      return num(`${b} × ${d} = ${b * d} is a common denominator. ${fh(a, b)} = ${fh('?', b * d)}`, a * d, `The bottom was multiplied by ${d}, so multiply the top by ${d} too: ${a} × ${d} = ${a * d}.`);
    } },
    c: { t: 'rename both', g: R => {
      let b, d; do { [b, d] = R.bool(0.6) ? pairShared(R) : pairAny(R, 9); } while (b % d === 0 || d % b === 0);
      const L = lcm(b, d), a = cop(R, b), c = cop(R, d), k = L / b;
      if (R.bool(0.35)) return F6.fc(R, `Rename ${fh(a, b)} in ${DENS(L)}.`, [a * k, L], [[a, L], [a + k, L], [a + L - b, L]], `${b} × ${k} = ${L}, so multiply the top by ${k} too: ${fh(a, b)} = ${fh(a * k, L)}. Keeping the top ${a} would change the size.`);
      return num(`Rename ${fh(a, b)} and ${fh(c, d)} with denominator ${L}.`, [{ label: `${a}/${b} = ?/${L}`, ans: a * k }, { label: `${c}/${d} = ?/${L}`, ans: c * L / d }],
        `${fh(a, b)} = ${fh(a * k, L)} (× ${k}) and ${fh(c, d)} = ${fh(c * L / d, L)} (× ${L / d}).`);
    } },
    d: { t: 'the smallest one', g: R => {
      if (R.bool(0.5)) { // three fractions: find the smallest denominator all three share
        let b, d, e, L; do { [b, d, e] = R.distinct(2, 12, 3).sort((x, y) => x - y); L = lcm(lcm(b, d), e); } while (L > 48 || L === e || L === b * d * e);
        const ex = `Multiples of ${e}: ${mults(e, L)}. The first one that ${b} and ${d} both go into is ${L}.`;
        if (R.bool()) return num(`What is the <b>smallest</b> common denominator of ${fh(cop(R, b), b)}, ${fh(cop(R, d), d)} and ${fh(cop(R, e), e)}?`, L, ex);
        return choice(R, `Which is the <b>smallest</b> common denominator of ${fh(cop(R, b), b)}, ${fh(cop(R, d), d)} and ${fh(cop(R, e), e)}?`, L, [b * d * e, L * 2, e, b + d + e].filter(v => v !== L).slice(0, 3), ex + ` ${b * d * e} works too, but it is not the smallest.`);
      }
      const [b, d] = pairShared(R), L = lcm(b, d), a = cop(R, b), c = cop(R, d);
      const other = L * 2 === b * d ? L * 3 : L * 2, sum = (b + d) % b === 0 && (b + d) % d === 0 ? null : b + d;
      return choice(R, `Which is the <b>smallest</b> common denominator of ${fh(a, b)} and ${fh(c, d)}?`, L, [b * d, other, sum].filter(v => v && v !== L),
        `${L} is the least common multiple of ${b} and ${d}. ${b * d} works too, but it is not the smallest. ${sum ? b + d + ' is not a multiple of both.' : ''}`.trim());
    } },
  } });

  /* ================= II.6.06 Add, unlike denominators ================= */
  const MODEL = [[2, 4], [2, 3], [3, 6], [2, 6], [4, 8], [2, 8], [3, 4], [2, 5], [4, 12], [3, 12], [2, 10], [6, 12]];
  const modelPair = (R, ok) => { for (;;) { const [x, y] = R.pick(MODEL), [b, d] = R.bool() ? [x, y] : [y, x], a = cop(R, b), c = cop(R, d); if (ok(a, b, c, d)) return [a, b, c, d]; } };
  const renameEx = (a, b, c, d, op) => { const L = lcm(b, d), x = a * L / b, y = c * L / d; return `${fh(a, b)} = ${fh(x, L)} and ${fh(c, d)} = ${fh(y, L)}. ${fh(x, L)} ${op} ${fh(y, L)} = ${fh(op === '+' ? x + y : x - y, L)}.`; };
  E2.skill({ id: 'II.6.06', name: 'Add, unlike denominators', steps: {
    a: { t: 'with models', g: R => {
      const [a, b, c, d] = modelPair(R, (a, b, c, d) => a * d + c * b <= b * d), L = lcm(b, d);
      return num(`Use the ${DENS(L)} strip. ${fh(a, b)} + ${fh(c, d)} = ${fh('?', L)}`, a * L / b + c * L / d, renameEx(a, b, c, d, '+'), { visual: F6.strips(a, b, c, d, L) });
    } },
    b: { t: 'rename, then add', g: R => {
      const [b, d] = pairAny(R, 10, 24), a = cop(R, b), c = cop(R, d), L = lcm(b, d), x = a * L / b, y = c * L / d;
      if (R.bool(0.4)) return F6.fc(R, `${fh(a, b)} + ${fh(c, d)} = ?`, [x + y, L], [[a + c, b + d], [a + c, L], [x + y, 2 * L]],
        renameEx(a, b, c, d, '+') + ` Adding tops and bottoms gives ${fh(a + c, b + d)}, which is wrong.`);
      return num(`${fh(a, b)} + ${fh(c, d)} = ?`, [frac(x + y, L)], renameEx(a, b, c, d, '+'));
    } },
    c: { t: 'simplify', g: R => {
      let a, b, c, d, L, s; do { [b, d] = pairAny(R, 12, 24); a = cop(R, b); c = cop(R, d); L = lcm(b, d); s = a * L / b + c * L / d; } while (gcd(s, L) === 1 || s % L === 0);
      const [p, q] = E2.reduce(s, L), S = simp(p, q);
      return num(`${fh(a, b)} + ${fh(c, d)} = ? ${S.say}`, [frac(s, L, S.f.form)], `${renameEx(a, b, c, d, '+')} Simplify: ${fh(s, L)} = ${mxr(s, L)}.`);
    } },
    d: { t: 'three fractions', g: R => {
      const SETS = [[2, 3, 4], [2, 4, 8], [2, 3, 6], [2, 5, 10], [3, 4, 6], [4, 6, 12], [2, 3, 12], [3, 6, 9], [2, 4, 6], [2, 6, 8]];
      const ds = R.shuffle(R.pick(SETS)), ns = ds.map(d => cop(R, d)), L = ds.reduce((x, y) => lcm(x, y)), xs = ns.map((n, i) => n * L / ds[i]), s = xs[0] + xs[1] + xs[2];
      return num(`${fh(ns[0], ds[0])} + ${fh(ns[1], ds[1])} + ${fh(ns[2], ds[2])} = ?`, [frac(s, L)],
        `Use ${DENS(L)}: ${xs.map(x => fh(x, L)).join(' + ')} = ${fh(s, L)}${s !== L ? ' = ' + mxr(s, L) : ''}.`);
    } },
  } });

  /* ================= II.6.07 Subtract, unlike denominators ================= */
  E2.skill({ id: 'II.6.07', name: 'Subtract, unlike denominators', steps: {
    a: { t: 'with models', g: R => {
      const [a, b, c, d] = modelPair(R, (a, b, c, d) => a * d > c * b), L = lcm(b, d);
      return num(`Use the ${DENS(L)} strip. ${fh(a, b)} − ${fh(c, d)} = ${fh('?', L)}`, a * L / b - c * L / d, renameEx(a, b, c, d, '−'), { visual: F6.strips(a, b, c, d, L) });
    } },
    b: { t: 'rename, then subtract', g: R => {
      let a, b, c, d; do { [b, d] = pairAny(R, 10, 24); a = cop(R, b); c = cop(R, d); } while (a * d <= c * b);
      const L = lcm(b, d), x = a * L / b, y = c * L / d;
      if (R.bool(0.4)) return F6.fc(R, `${fh(a, b)} − ${fh(c, d)} = ?`, [x - y, L], [[a - c, b - d], [a - c, L], [a - c, Math.abs(b - d)], [x + y, L], [a + c, b + d], [x - y, b + d]],
        renameEx(a, b, c, d, '−') + ' Rename first; never subtract the bottoms.');
      return num(`${fh(a, b)} − ${fh(c, d)} = ?`, [frac(x - y, L)], renameEx(a, b, c, d, '−'));
    } },
    c: { t: 'simplify', g: R => {
      let a, b, c, d, L, s; do { [b, d] = pairAny(R, 12, 24); a = cop(R, b); c = cop(R, d); L = lcm(b, d); s = a * L / b - c * L / d; } while (s <= 0 || gcd(s, L) === 1);
      return num(`${fh(a, b)} − ${fh(c, d)} = ? Write it in simplest form.`, [frac(s, L, 'simplest')], `${renameEx(a, b, c, d, '−')} Simplify: ${fh(s, L)} = ${mxr(s, L)}.`);
    } },
    d: { t: 'story problems', g: (R, O) => {
      let a, b, c, d; do { [b, d] = pairAny(R, 10, 24); a = cop(R, b); c = cop(R, d); } while (a * d <= c * b);
      const [p, q] = two(R), L = lcm(b, d), s = a * L / b - c * L / d;
      const P = R.pick([
        `${p} had ${fh(a, b)} of a pizza and ate ${fh(c, d)} of the pizza. How much of the pizza is left?`,
        `A bottle holds ${fh(a, b)} ${U(O, 'vol')} of juice. ${p} pours out ${fh(c, d)} ${U(O, 'vol')}. How much is left?`,
        `${p} ran ${fh(a, b)} ${U(O, 'dist')}. ${q} ran ${fh(c, d)} ${U(O, 'dist')}. How much farther did ${p} run?`,
        `A path is ${fh(a, b)} ${U(O, 'dist')} long. ${p} has walked ${fh(c, d)} ${U(O, 'dist')}. How much farther to the end?`]);
      return num(P, [frac(s, L)], renameEx(a, b, c, d, '−'));
    } },
  } });

  /* ================= II.6.08 Mixed numbers, unlike denominators ================= */
  // pick a/b, c/d (b ≠ d, lcm ≤ 24) with test on their values; returns parts over L
  const unlike = (R, test) => { for (;;) { const [b, d] = pairAny(R, 8, 24), a = cop(R, b), c = cop(R, d), L = lcm(b, d), x = a * L / b, y = c * L / d; if (test(x, y, L)) return { a, b, c, d, L, x, y }; } };
  E2.skill({ id: 'II.6.08', name: 'Mixed numbers, unlike denominators', steps: {
    a: { t: 'add', g: R => {
      const { a, b, c, d, L, x, y } = unlike(R, (x, y, L) => x + y < L), w1 = R.int(1, 5), w2 = R.int(1, 4), n = (w1 + w2) * L + x + y;
      return num(`${fh(a, b, w1)} + ${fh(c, d, w2)} = ? Write a mixed number in simplest form.`, [frac(n, L, 'mixed')],
        `Rename: ${fh(x, L, w1)} + ${fh(y, L, w2)}. Wholes ${w1 + w2}, parts ${fh(x + y, L)}: ${mxr(n, L)}.`);
    } },
    b: { t: 'subtract', g: R => {
      const { a, b, c, d, L, x, y } = unlike(R, (x, y) => x > y), w1 = R.int(2, 7), w2 = R.int(1, w1 - 1), n = (w1 - w2) * L + x - y;
      return num(`${fh(a, b, w1)} − ${fh(c, d, w2)} = ? Write a mixed number in simplest form.`, [frac(n, L, 'mixed')],
        `Rename: ${fh(x, L, w1)} − ${fh(y, L, w2)}. Wholes ${w1 - w2}, parts ${fh(x - y, L)}: ${mxr(n, L)}.`);
    } },
    c: { t: 'with regrouping', g: R => {
      if (R.bool()) {
        const { a, b, c, d, L, x, y } = unlike(R, (x, y, L) => x + y > L), w1 = R.int(1, 5), w2 = R.int(1, 4), n = (w1 + w2) * L + x + y;
        return num(`${fh(a, b, w1)} + ${fh(c, d, w2)} = ? Write a mixed number in simplest form.`, [frac(n, L, 'mixed')],
          `Rename: parts ${fh(x, L)} + ${fh(y, L)} = ${fh(x + y, L)} = ${fh(x + y - L, L, 1)}. Regroup the extra 1: ${mxr(n, L)}.`);
      }
      const { a, b, c, d, L, x, y } = unlike(R, (x, y) => x < y), w1 = R.int(3, 8), w2 = R.int(1, w1 - 1), n = (w1 - w2) * L + x - y;
      const ex = `Rename: ${fh(x, L, w1)} − ${fh(y, L, w2)}. ${fh(x, L)} is too small, so borrow 1: ${fh(x + L, L, w1 - 1)} − ${fh(y, L, w2)} = ${mxr(n, L)}.`;
      if (R.bool(0.4)) return F6.fc(R, `${fh(a, b, w1)} − ${fh(c, d, w2)} = ?`, [n, L], [[(w1 - w2) * L + y - x, L], [(w1 - w2 - 1) * L + y - x, L], [n + L, L]], ex, {}, mxr);
      return num(`${fh(a, b, w1)} − ${fh(c, d, w2)} = ? Write a mixed number in simplest form.`, [frac(n, L, 'mixed')], ex);
    } },
    d: { t: 'estimate first', g: R => {
      const part = () => { const b = R.int(5, 12); return R.bool() ? [1, b] : [b - 1, b]; }, [a, b] = part(), [c, d] = part();
      const add = R.bool(), w1 = R.int(add ? 1 : 4, 7), w2 = R.int(1, add ? 5 : w1 - 3), r1 = w1 + (a * 2 > b ? 1 : 0), r2 = w2 + (c * 2 > d ? 1 : 0), est = add ? r1 + r2 : r1 - r2, naive = add ? w1 + w2 : w1 - w2;
      return choice(R, `Estimate: ${fh(a, b, w1)} ${add ? '+' : '−'} ${fh(c, d, w2)} is about…`, est, [est + 1, est - 1, naive, est + 2].filter(v => v >= 0 && v !== est).slice(0, 3),
        `Round each to the nearest whole: ${fh(a, b, w1)} ≈ ${r1} and ${fh(c, d, w2)} ≈ ${r2}. ${r1} ${add ? '+' : '−'} ${r2} = ${est}.`);
    } },
  } });

  /* ================= II.6.09 Fraction × whole number ================= */
  E2.skill({ id: 'II.6.09', name: 'Fraction × whole number', steps: {
    a: { t: 'as repeated addition', g: R => {
      const n = R.int(2, 5), [a, b] = proper(R, 2, 8), rep = (x, y, k) => Array(k).fill(fh(x, y)).join(' + ');
      if (R.bool()) return num(`${n} × ${fh(a, b)} = ${rep(a, b, n)} = ?`, [frac(n * a, b)], `Add the tops: ${n} × ${a} = ${n * a}, so ${fh(n * a, b)}.`,
        { visual: V.side(Array.from({ length: n }, () => V.fbar(a, b, { w: 100, h: 24 })), { gap: 12 }) });
      return choice(R, `Which addition matches ${n} × ${fh(a, b)}?`, rep(a, b, n), [`${n} + ${fh(a, b)}`, rep(a, b, n - 1) || fh(a, b), rep(a, n * b, n)],
        `${n} × ${fh(a, b)} means ${n} groups of ${fh(a, b)}: ${rep(a, b, n)}.`);
    } },
    b: { t: '3 × 2/5', g: R => {
      const n = R.int(2, 9), [a, b] = proper(R, 2, 10), ex = `Multiply only the top: ${n} × ${a} = ${n * a}. The pieces are still ${DENS(b)}: ${fh(n * a, b)}${n * a > b ? ' = ' + mxr(n * a, b) : ''}.`;
      if (R.bool(0.4)) return F6.fc(R, `${n} × ${fh(a, b)} = ?`, [n * a, b], [[n * a, n * b], [a, n * b], [n + a, b]], ex);
      return num(`${n} × ${fh(a, b)} = ?`, [frac(n * a, b)], ex);
    } },
    c: { t: 'on a number line', g: R => {
      let n, a, b, to; do { b = R.int(2, 6); a = R.int(1, b - 1); n = R.int(2, 5); to = Math.floor(n * a / b) + 1; } while (to * b > 16 || to > 4);
      return num(`The jumps show ${n} × ${fh(a, b)}. What number is at the <b>?</b>`, [frac(n * a, b)],
        `Each jump is ${fh(a, b)} (${a} small part${a > 1 ? 's' : ''}). ${n} jumps is ${n * a} ${DENS(b)}: ${fh(n * a, b)}${n * a > b ? ' = ' + mx(n * a, b) : ''}.`, { visual: F6.jline(to, b, a, n, { ask: [n * a, b] }) });
    } },
    d: { t: 'word problems', g: (R, O) => {
      const n = R.int(2, 8), [a, b] = properR(R, 2, 8), p = R.pick(NAMES);
      const P = R.pick([
        `Each glass holds ${fh(a, b)} ${U(O, 'vol')} of milk. How much milk is in ${n} glasses?`,
        `A bag of rice weighs ${fh(a, b)} ${U(O, 'mass')}. How much do ${n} bags weigh?`,
        `${p} runs ${fh(a, b)} ${U(O, 'dist')} every day. How far does ${p} run in ${n} days?`,
        `${p} cuts ${n} pieces of string, each ${fh(a, b)} ${U(O, 'len')} long. What is the total length?`]);
      return num(P, [frac(n * a, b)], `${n} × ${fh(a, b)} = ${fh(n * a, b)}${n * a > b ? ' = ' + mxr(n * a, b) : ''}.`);
    } },
  } });

  /* ================= II.6.10 Multiply fractions ================= */
  E2.skill({ id: 'II.6.10', name: 'Multiply fractions', steps: {
    a: { t: 'area model', g: R => {
      const b = R.int(2, 5), d = R.int(2, 5), a = R.int(1, b - 1), c = R.int(1, d - 1);
      return num(`Blue columns show ${fh(a, b)}. Yellow rows show ${fh(c, d)}. The purple overlap is ${fh(a, b)} × ${fh(c, d)}. What fraction is it?`, [frac(a * c, b * d)],
        `The square has ${b} × ${d} = ${b * d} small parts, and ${a} × ${c} = ${a * c} are purple: ${fh(a * c, b * d)}.`, { visual: F6.area(b, d, a, c) });
    } },
    b: { t: 'top × top, bottom × bottom', g: R => {
      const [a, b] = properR(R, 2, 9), [c, d] = properR(R, 2, 9), ex = `Tops: ${a} × ${c} = ${a * c}. Bottoms: ${b} × ${d} = ${b * d}. So ${fh(a * c, b * d)}.`;
      if (R.bool(0.45)) {
        const L = lcm(b, d), st = b !== d ? [(a * L / b) * (c * L / d), L] : [a * c, b];
        return F6.fc(R, `${fh(a, b)} × ${fh(c, d)} = ?`, [a * c, b * d], [st, [a * c, Math.max(b, d)], [a * d, b * c], [a + c, b + d]], ex + ' Bottoms multiply too.');
      }
      return num(`${fh(a, b)} × ${fh(c, d)} = ?`, [frac(a * c, b * d)], ex);
    } },
    c: { t: 'simplify first', g: R => {
      let a, b, c, d, g1, g2; do { [a, b] = proper(R, 3, 12); [c, d] = proper(R, 3, 12); g1 = gcd(a, d); g2 = gcd(c, b); } while (g1 * g2 === 1 || gcd(a, b) > 1 || gcd(c, d) > 1);
      const A = a / g1, D = d / g1, Cc = c / g2, B = b / g2, cut = [g1 > 1 ? `${a} and ${d} by ${g1}` : '', g2 > 1 ? `${c} and ${b} by ${g2}` : ''].filter(Boolean).join(', ');
      return num(`${fh(a, b)} × ${fh(c, d)} = ? Simplify first. Write it in simplest form.`, [frac(a * c, b * d, 'simplest')],
        `Divide ${cut}: ${fh(A, B)} × ${fh(Cc, D)} = ${fh(A * Cc, B * D)}.`);
    } },
    d: { t: 'mixed numbers', g: R => {
      const b = R.int(2, 4), a = cop(R, b), w = R.int(1, 3), N1 = w * b + a;
      if (R.bool()) {
        const d = R.int(2, 5), c = cop(R, d), n = N1 * c, q = b * d, S = simp(...E2.reduce(n, q));
        return num(`${fh(a, b, w)} × ${fh(c, d)} = ? ${S.say}`, [frac(n, q, S.f.form)], `${fh(a, b, w)} = ${fh(N1, b)}. ${fh(N1, b)} × ${fh(c, d)} = ${fh(n, q)} = ${mxr(n, q)}.`);
      }
      const d = R.int(2, 4), c = cop(R, d), v = R.int(1, 2), N2 = v * d + c, n = N1 * N2, q = b * d, ex = `Make them improper: ${fh(N1, b)} × ${fh(N2, d)} = ${fh(n, q)} = ${mxr(n, q)}.`;
      if (R.bool(0.4)) return F6.fc(R, `${fh(a, b, w)} × ${fh(c, d, v)} = ?`, [n, q], [[w * v * q + a * c, q], [n + q, q], [(w + v) * q + a * c, q]], ex + ` Multiplying only wholes × wholes and parts × parts misses pieces.`, {}, mxr);
      const S = simp(...E2.reduce(n, q));
      return num(`${fh(a, b, w)} × ${fh(c, d, v)} = ? ${S.say}`, [frac(n, q, S.f.form)], ex);
    } },
  } });

  /* ================= II.6.11 Multiplying as scaling ================= */
  const moreLess = N => [`less than ${N}`, `equal to ${N}`, `more than ${N}`];
  const scaleEx = (a, b, N) => a < b ? `${fh(a, b)} is less than 1, so ${fh(a, b)} × ${N} is only part of ${N}: less than ${N}.` : a > b ? `${fh(a, b)} is more than 1, so ${fh(a, b)} × ${N} is ${N} and some more: more than ${N}.` : `${fh(a, b)} = 1, so the product equals ${N}.`;
  E2.skill({ id: 'II.6.11', name: 'Multiplying as scaling', steps: {
    a: { t: '× less than 1 shrinks', g: R => {
      const N = R.int(6, 60), b = R.int(2, 10), w = R.f(), a = w < 0.7 ? R.int(1, b - 1) : w < 0.85 ? R.int(b + 1, 2 * b) : b; // mostly < 1: this step is about shrinking
      if (R.bool(0.35)) {
        const [c, d] = proper(R, 2, 9), e = R.int(2, 6);
        return choice(R, `Which product is <b>less</b> than ${N}?`, `${fh(c, d)} × ${N}`, [`${fh(d + e, d)} × ${N}`, `${e} × ${N}`, `${fh(d, d)} × ${N}`], scaleEx(c, d, N));
      }
      return choiceFixed(`Without working it out: ${fh(a, b)} × ${N} is…`, moreLess(N), cmp(a, b, 1, 1), scaleEx(a, b, N));
    } },
    b: { t: '× more than 1 grows', g: R => {
      const N = R.int(6, 60), b = R.int(2, 10), v = R.int(0, 19), a = v < 14 ? R.int(b + 1, 3 * b) : v < 17 ? R.int(1, b - 1) : b; // mostly > 1: this step is about growing
      if (R.bool(0.35)) {
        const d = R.int(2, 9), c = R.int(d + 1, 2 * d), [p, q] = proper(R, 2, 9);
        return choice(R, `Which product is <b>more</b> than ${N}?`, `${fh(c, d)} × ${N}`, [`${fh(p, q)} × ${N}`, `${fh(d, d)} × ${N}`, `${fh(1, q)} × ${N}`], scaleEx(c, d, N));
      }
      const show = a > b && a % b && R.bool() ? fh(a % b, b, Math.floor(a / b)) : fh(a, b);
      return choiceFixed(`Without working it out: ${show} × ${N} is…`, moreLess(N), cmp(a, b, 1, 1), scaleEx(a, b, N).split(fh(a, b)).join(show));
    } },
    c: { t: 'predict without computing', g: R => {
      const N = R.int(8, 99), b = R.int(2, 9), w = R.f(), a = w < 0.42 ? R.int(1, b - 1) : w < 0.84 ? R.int(b + 1, Math.min(15, 2 * b + 2)) : b;
      if (R.bool()) return choiceFixed(`Choose the sign without computing: ${fh(a, b)} × ${N} ? ${N}`, SYM, cmp(a, b, 1, 1), scaleEx(a, b, N));
      let c, d; do { d = R.int(2, 9); c = R.int(1, 2 * d); } while (c * b === a * d);
      return choiceFixed(`Choose the sign without computing: ${fh(a, b)} × ${N} ? ${fh(c, d)} × ${N}`, SYM, cmp(a, b, c, d),
        `Both multiply ${N}, so the bigger fraction gives the bigger product. ${fh(a, b)} ${SYM[cmp(a, b, c, d)]} ${fh(c, d)}.`);
    } },
    d: { t: 'explain', g: R => {
      const N = R.int(6, 40), v = R.int(0, 2);
      if (v === 0) {
        const [a, b] = proper(R, 2, 9);
        return choice(R, `Why is ${fh(a, b)} × ${N} less than ${N}?`, `${fh(a, b)} is less than 1, so you take only part of ${N}`,
          [`Multiplying always makes a number smaller`, `You take ${a} away from ${N}`, `The denominator ${b} is bigger than ${a}, so you divide by ${a}`], scaleEx(a, b, N));
      }
      if (v === 1) {
        const b = R.int(2, 8), a = R.int(b + 1, 2 * b);
        return choice(R, `Why is ${fh(a, b)} × ${N} more than ${N}?`, `${fh(a, b)} is more than 1, so you get all of ${N} and more`,
          [`Multiplying always makes a number bigger`, `You add ${a} to ${N}`, `Fractions always make numbers bigger`], scaleEx(a, b, N) + ' Multiplying by a fraction less than 1 would shrink it.');
      }
      const [a, b] = proper(R, 2, 9), s = R.int(0, 3);
      if (s === 3) return tf(`True or false: ${fh(a + b, b)} × ${N} &gt; ${N}, because ${fh(a + b, b)} &gt; 1.`, true, scaleEx(a + b, b, N));
      if (s === 0) return tf(`True or false: multiplying ${N} by any number makes it bigger.`, false, `${fh(a, b)} × ${N} is less than ${N}, because ${fh(a, b)} &lt; 1.`);
      if (s === 1) return tf(`True or false: ${fh(a, b)} × ${N} &lt; ${N}, because ${fh(a, b)} &lt; 1.`, true, scaleEx(a, b, N));
      return tf(`True or false: ${fh(a + b, b)} × ${N} &lt; ${N}, because it is a fraction.`, false, scaleEx(a + b, b, N));
    } },
  } });

  /* ================= II.6.12 Unit fraction ÷ whole number ================= */
  E2.skill({ id: 'II.6.12', name: 'Unit fraction ÷ whole number', steps: {
    a: { t: '1/2 ÷ 3 with models', g: R => {
      let b, n; do { b = R.int(2, 8); n = R.int(2, 5); } while (b * n > 30);
      return num(`The bar is 1 whole. The shaded ${fh(1, b)} is split into ${n} equal pieces. What fraction of the whole is the dark piece?`, [frac(1, b * n)],
        `Split every ${fh(1, b)} into ${n} and the whole has ${b} × ${n} = ${b * n} pieces. So ${fh(1, b)} ÷ ${n} = ${fh(1, b * n)}.`, { visual: F6.split(b, n) });
    } },
    b: { t: 'with numbers', g: R => {
      const b = R.int(2, 10), n = R.int(2, 6), ex = `Sharing ${fh(1, b)} into ${n} makes smaller pieces: ${fh(1, b)} ÷ ${n} = ${fh(1, `${b} × ${n}`)} = ${fh(1, b * n)}.`;
      if (R.bool(0.45)) return F6.fc(R, `${fh(1, b)} ÷ ${n} = ?`, [1, b * n], [[n, b], [1, b + n], [b, n]], ex, {}, (p, q) => fh(p, q));
      return num(`${fh(1, b)} ÷ ${n} = ?`, [frac(1, b * n)], ex);
    } },
    c: { t: 'story problems', g: (R, O) => {
      const b = R.int(2, 8), n = R.int(2, 5), p = R.pick(NAMES);
      const P = R.pick([
        `${fh(1, b)} of a cake is shared equally by ${n} friends. What fraction of the whole cake does each get?`,
        `${p} plants ${fh(1, b)} of a garden, split into ${n} equal beds. What fraction of the garden is each bed?`,
        `${fh(1, b)} ${U(O, 'vol')} of juice is poured equally into ${n} cups. How much is in each cup, in ${U(O, 'vol')}?`,
        `${fh(1, b)} of a pizza is left. ${n} children share it equally. What fraction of the pizza does each get?`]);
      return num(P, [frac(1, b * n)], `${fh(1, b)} ÷ ${n} = ${fh(1, b * n)}.`);
    } },
    d: { t: 'check by multiplying', g: R => {
      const b = R.int(2, 8), n = R.int(2, 5);
      if (R.bool()) return num(`${fh(1, b)} ÷ ${n} = ${fh(1, b * n)}. Check: ${n} × ${fh(1, b * n)} = ?`, [frac(n, b * n)], `${n} × ${fh(1, b * n)} = ${fh(n, b * n)} = ${fh(1, b)}, so the division was right.`);
      const k = R.bool() ? 0 : R.int(1, 2), X = [[1, b * n], [n, b], [1, b + n]][k], p = R.pick(NAMES);
      return yn(`${p} says ${fh(1, b)} ÷ ${n} = ${fh(X[0], X[1])}. Check by multiplying: is ${p} right?`, k === 0,
        `${n} × ${fh(X[0], X[1])} = ${fh(n * X[0], X[1])}${k === 0 ? ` = ${fh(1, b)}, so yes.` : `, which is not ${fh(1, b)}. The answer is ${fh(1, b * n)}.`}`);
    } },
  } });

  /* ================= II.6.13 Whole number ÷ unit fraction ================= */
  E2.skill({ id: 'II.6.13', name: 'Whole number ÷ unit fraction', steps: {
    a: { t: '4 ÷ 1/3 with models', g: R => {
      const N = R.int(2, 5), b = R.int(2, 6);
      return num(`Each bar is 1 whole. ${N} ÷ ${fh(1, b)} = ?`, N * b, `Each whole holds ${b} pieces of ${fh(1, b)}, so ${N} wholes hold ${N} × ${b} = ${N * b}.`,
        { visual: V.fbar(0, b, { bars: N, w: 300, h: 26 }) });
    } },
    b: { t: 'how many thirds fit', g: R => {
      const N = R.int(2, 10), b = R.int(2, 8), ex = `There are ${b} ${DENS(b)} in 1, so ${N} × ${b} = ${N * b} in ${N}.`;
      if (R.bool(0.4)) return choice(R, `${N} ÷ ${fh(1, b)} = ?`, String(N * b), [fh(N, b), fh(1, N * b), String(N + b)], ex + ` Dividing by ${fh(1, b)} gives a bigger answer.`);
      return num(R.bool() ? `How many ${DENS(b)} are in ${N}?` : `${N} ÷ ${fh(1, b)} = ?`, N * b, ex);
    } },
    c: { t: 'story problems', g: (R, O) => {
      const N = R.int(2, 9), b = R.int(2, 6), p = R.pick(NAMES);
      const P = R.pick([
        `How many ${fh(1, b)}-${O.units === 'imperial' ? 'cup' : 'liter'} scoops are in ${N} ${U(O, 'vol')} of rice?`,
        `A ${N} ${U(O, 'len')} ribbon is cut into pieces ${fh(1, b)} ${U(O, 'len')} long. How many pieces?`,
        `There are ${N} pizzas. Each child gets ${fh(1, b)} of a pizza. How many children can eat?`,
        `${p} walks ${fh(1, b)} ${U(O, 'dist')} each lap. How many laps make ${N} ${U(O, 'dist')}?`]);
      return num(P, N * b, `${N} ÷ ${fh(1, b)} = ${N} × ${b} = ${N * b}.`);
    } },
    d: { t: 'check by multiplying', g: R => {
      const N = R.int(2, 9), b = R.int(2, 8);
      if (R.bool()) return num(`${N} ÷ ${fh(1, b)} = ${N * b}. Check: ${N * b} × ${fh(1, b)} = ?`, N, `${N * b} × ${fh(1, b)} = ${fh(N * b, b)} = ${N}, so the division was right.`);
      const k = R.bool() ? 0 : R.int(1, 2), p = R.pick(NAMES), X = [String(N * b), fh(N, b), String(N + b)][k], back = [fh(N * b, b) + ' = ' + N, fh(N, b * b), fh(N + b, b)][k];
      return yn(`${p} says ${N} ÷ ${fh(1, b)} = ${X}. Check by multiplying: is ${p} right?`, k === 0,
        `${X} × ${fh(1, b)} = ${back}${k === 0 ? ', so yes.' : `, not ${N}. The answer is ${N * b}.`}`);
    } },
  } });

  /* ================= II.6.14 Fraction problems ================= */
  E2.skill({ id: 'II.6.14', name: 'Fraction problems', steps: {
    a: { t: 'choose the operation', g: (R, O) => {
      const [p, q] = two(R), [a, b] = proper(R, 2, 8), [c, d] = proper(R, 2, 8), n = R.int(2, 6), op = R.int(0, 3);
      const P = [
        [`${p} pours ${fh(a, b)} ${U(O, 'vol')} of water into a bucket, then ${fh(c, d)} ${U(O, 'vol')} more. How much water is in the bucket?`,
          `${p} walks ${fh(a, b)} ${U(O, 'dist')} to ${q}'s house, then ${fh(c, d)} ${U(O, 'dist')} to the shop. How far is that?`],
        [`A ribbon is ${n} ${U(O, 'len')} long. ${p} cuts off ${fh(c, d)} ${U(O, 'len')}. How much is left?`,
          `${p} ran ${fh(a, b, 1)} ${U(O, 'dist')}. ${q} ran ${fh(c, d)} ${U(O, 'dist')}. How much farther did ${p} run?`],
        [`One bag of rice weighs ${fh(a, b)} ${U(O, 'mass')}. How much do ${n} bags weigh?`,
          `${p} reads for ${fh(a, b)} of an hour each day. How long does ${p} read in ${n} days?`],
        [`${n} ${U(O, 'len')} of rope is cut into pieces ${fh(1, b)} ${U(O, 'len')} long. How many pieces are there?`,
          `${fh(1, b)} of a pie is shared equally by ${n} friends. How much of the pie does each get?`]][op];
      const why = ['Two amounts are put together, so add.', 'You take one amount away from another (or compare them), so subtract.', 'The same amount is repeated, so multiply.', 'You split an amount into equal parts or pieces, so divide.'][op];
      return choiceFixed(`${R.pick(P)} Which operation solves it?`, ['add', 'subtract', 'multiply', 'divide'], op, why);
    } },
    b: { t: 'multi-step', g: (R, O) => {
      if (R.bool()) {
        let b, a, N; do { b = R.int(3, 6); a = cop(R, b); N = b * R.int(2, 8); } while ((N - N / b * a) % 2 || N > 40);
        const used = N / b * a, rest = N - used, [thing, what, what2] = R.pick([['students', 'walk to school', 'ride bikes'], ['stickers', 'are stars', 'are hearts'], ['apples', 'are red', 'are green'], ['books', 'are about animals', 'are about space']]);
        return num(`There are ${N} ${thing}. ${fh(a, b)} of them ${what}. Half of the rest ${what2}. How many ${what2}?`, rest / 2,
          `${fh(a, b)} of ${N} = ${used}. The rest is ${N} − ${used} = ${rest}. Half of ${rest} is ${rest / 2}.`);
      }
      const [p, q] = two(R), d = R.pick([6, 8, 10, 12]), a = R.int(Math.ceil(d / 2), d - 1), b = R.int(1, a - 2), c = R.int(1, a - b - 1);
      const vol = U(O, 'vol');
      return num(`A jug holds ${mxr(a, d)} ${vol} of juice. ${p} drinks ${mxr(b, d)} ${vol} and ${q} drinks ${mxr(c, d)} ${vol}. How much is left?`, [frac(a - b - c, d)],
        `Use ${DENS(d)}: ${fh(a, d)} − ${fh(b, d)} − ${fh(c, d)} = ${fh(a - b - c, d)}.`);
    } },
    c: { t: 'with mixed numbers', g: (R, O) => {
      const [p] = two(R), v = R.int(0, 2), b = R.pick([2, 3, 4, 5, 6, 8]), a = cop(R, b), w = R.int(1, 3);
      if (v === 0) {
        const n = R.int(2, 5), N = (w * b + a) * n;
        return num(`A recipe uses ${fh(a, b, w)} ${O.units === 'imperial' ? 'cups' : 'kg'} of flour. How much flour for ${n} batches?`, [frac(N, b)], `${n} × ${fh(a, b, w)} = ${n} × ${fh(w * b + a, b)} = ${fh(N, b)} = ${mxr(N, b)}.`);
      }
      let c; do c = cop(R, b); while (b > 2 && c === a); const W = R.int(w + 1, w + 4), n1 = W * b + c, n2 = w * b + a;
      if (v === 1) return num(`A board is ${fh(c, b, W)} ${U(O, 'len')} long. ${p} cuts off ${fh(a, b, w)} ${U(O, 'len')}. How long is the rest?`, [frac(n1 - n2, b)],
        `${fh(c, b, W)} − ${fh(a, b, w)} = ${fh(n1, b)} − ${fh(n2, b)} = ${fh(n1 - n2, b)} = ${mxr(n1 - n2, b)}.`);
      const e = R.pick([2, 3, 4, 6].filter(x => x !== b)), f = cop(R, e), L = lcm(b, e), s = (w * b + a) * L / b + (W * e + f) * L / e;
      return num(`${p} walked ${fh(a, b, w)} ${U(O, 'dist')} on Saturday and ${fh(f, e, W)} ${U(O, 'dist')} on Sunday. How far in all?`, [frac(s, L)],
        `Rename to ${DENS(L)}: ${fh(a * L / b, L, w)} + ${fh(f * L / e, L, W)} = ${mxr(s, L)}.`);
    } },
    d: { t: 'is it reasonable?', g: R => {
      const p = R.pick(NAMES), v = R.int(0, 3);
      if (v === 0) {
        const b = R.int(6, 12), d = R.int(6, 13), a = b - 1, c = d - 1;
        return choice(R, `${p} says ${fh(a, b)} + ${fh(c, d)} = ${fh(a + c, b + d)}. Is that reasonable?`, 'No: each fraction is close to 1, so the sum is close to 2',
          [`Yes: ${a} + ${c} = ${a + c} and ${b} + ${d} = ${b + d}`, 'Yes: adding fractions gives a fraction less than 1'], `${fh(a, b)} ≈ 1 and ${fh(c, d)} ≈ 1, so the sum is about 2. ${fh(a + c, b + d)} is less than 1.`);
      }
      if (v === 1) {
        const [a, b] = properR(R, 2, 6), N = a * b * R.int(1, 4), wrong = N * b / a;
        return choice(R, `${p} says ${fh(a, b)} × ${N} = ${wrong}. Is that reasonable?`, `No: ${fh(a, b)} is less than 1, so the answer must be less than ${N}`,
          ['Yes: multiplying makes numbers bigger', `Yes: ${N} ÷ ${a} × ${b} = ${wrong}`], `${fh(a, b)} × ${N} = ${N / b * a}, which is less than ${N}. ${p} flipped the fraction.`);
      }
      if (v === 2) {
        const N = R.int(2, 9), b = R.int(2, 6);
        return choice(R, `${p} says ${N} ÷ ${fh(1, b)} = ${fh(N, b)}. Is that reasonable?`, `No: each whole holds ${b} pieces of ${fh(1, b)}, so the answer is more than ${N}`,
          ['Yes: dividing always makes numbers smaller', `Yes: ${N} ÷ ${b} = ${fh(N, b)}`], `${N} ÷ ${fh(1, b)} = ${N} × ${b} = ${N * b}.`);
      }
      const b = R.int(6, 12), d = R.pick([4, 6, 8, 10].filter(x => x !== b)), a = b - 1, c = d / 2 + (d >= 8 ? R.pick([-1, 0, 1]) : 0), L = lcm(b, d), s = a * L / b + c * L / d;
      return choice(R, `${p} says ${fh(a, b)} + ${fh(c, d)} = ${mxr(s, L)}. Is that reasonable?`, `Yes: it is about 1 + ${fh(1, 2)} = ${fh(1, 2, 1)}`,
        ['No: the sum of two fractions is always less than 1', `No: it should be ${fh(a + c, b + d)}`], `${fh(a, b)} ≈ 1 and ${fh(c, d)} ≈ ${fh(1, 2)}, so about ${fh(1, 2, 1)}. ${mxr(s, L)} is close.`);
    } },
  } });
})();

/* Era II · Unit II.7 Decimals (II.7.01–II.7.14)
   All decimal arithmetic is done on integers (tenths / hundredths / thousandths) and printed with fmt. */
(function () {
  const { num, choice, choiceFixed, tf, frac, fh, fmt, V, C } = E2;

  /* ---------- helpers ---------- */
  const P10 = [1, 10, 100, 1000];
  const d = (n, dp) => fmt(n / P10[dp]);                              // integer n in units of 10^-dp → '3.4'
  const dF = (n, dp) => { const s = String(n).padStart(dp + 1, '0'); return dp ? s.slice(0, -dp) + '.' + s.slice(-dp) : s; }; // fixed dp, '3.40'
  const dpOf = (n, dp) => { while (dp > 0 && n % 10 === 0) { n /= 10; dp--; } return dp; }; // real decimal places
  const W = n => E2.words(n);
  const PLACE = ['ones', 'tenths', 'hundredths', 'thousandths'];
  // money helpers: amount in cents / satang
  const cur = O => O.coins === 'THB' ? { big: 'baht', small: 'satang', lab: 'baht' } : { big: 'dollars', small: 'cents', lab: '$' };
  const M = (c, O) => O.coins === 'THB' ? `${dF(c, 2)} baht` : `$${dF(c, 2)}`;
  const MS = (c, O) => O.coins === 'THB' ? `${c} satang` : `${c}¢`;

  /* ---------- visuals (prefix V7) ---------- */
  const V7 = {};
  // decimal number line from lo to hi, measured in units of 1/den (integers). o: labels(k→bool), ask:k, marks:[k], letters:[[k,'A']]
  V7.line = function (lo, hi, den, o = {}) {
    const n = hi - lo, Wd = o.width || Math.min(440, Math.max(340, n * 22 + 60)), pad = 30, y = 40, H = 88;
    const X = k => pad + (k - lo) / n * (Wd - 2 * pad);
    const lab = o.labels || (k => k % den === 0);
    const hide = new Set([o.ask]);
    let b = `<line x1="${pad - 10}" y1="${y}" x2="${Wd - pad + 10}" y2="${y}" stroke="${C.ink}" stroke-width="2"/>`;
    for (let k = lo; k <= hi; k += (o.step || 1)) {
      const big = k % den === 0 || (o.mid && k % o.mid === 0);
      b += `<line x1="${X(k)}" y1="${y - (big ? 10 : 6)}" x2="${X(k)}" y2="${y + (big ? 10 : 6)}" stroke="${C.ink}" stroke-width="${big ? 2.4 : 1.5}"/>`;
      if (lab(k) && !hide.has(k)) b += V.text(X(k), y + 28, d(k, o.dp || 1), { size: o.fs || 17, weight: 600 });
    }
    (o.marks || []).forEach(k => b += V.dot(X(k), y, 7, C.red));
    (o.letters || []).forEach(([k, t]) => b += V.dot(X(k), y, 7, C.blue) + V.text(X(k), y - 22, t, { size: 18, weight: 700, fill: C.blue }));
    if (o.ask !== undefined) b += V.dot(X(o.ask), y, 9, C.amber) + V.text(X(o.ask), y - 22, '?', { size: 19, weight: 700 });
    return V.svg(Wd, H, b, 'decimal number line');
  };
  // several tenths bars side by side (groups for multiplication / sharing)
  V7.bars = (k, m) => V.stack(Array.from({ length: k }, () => V.fbar(m, 10, { w: 300, h: 30 })), { gap: 8 });
  // vertical sum written with points lined up: rows are [n,dp]; op '+' or '−'
  V7.column = function (rows, op) {
    const maxDp = Math.max(...rows.map(r => r[1])), cw = 18, strs = rows.map(([n, dp]) => dF(n, dp));
    const intLen = Math.max(...strs.map(s => s.split('.')[0].length)) + 1;
    const Wd = (intLen + 1 + maxDp) * cw + 20;
    let b = '';
    strs.forEach((s, i) => {
      const [ip, fp = ''] = s.split('.'); const y = 20 + i * 28;
      ip.split('').forEach((ch, j) => b += V.text(10 + (intLen - ip.length + j) * cw + cw / 2, y, ch, { size: 20 }));
      if (fp) { b += V.text(10 + intLen * cw + cw / 2, y, '.', { size: 20, weight: 800 }); fp.split('').forEach((ch, j) => b += V.text(10 + (intLen + 1 + j) * cw + cw / 2, y, ch, { size: 20 })); }
      if (i === rows.length - 1) b += V.text(10 + cw / 2, y, op, { size: 20 });
    });
    const yl = 20 + rows.length * 28 - 12;
    b += `<line x1="6" y1="${yl}" x2="${Wd - 6}" y2="${yl}" stroke="${C.ink}" stroke-width="2"/>`;
    return V.svg(Wd, yl + 8, b, 'column layout');
  };

  /* ================= II.7.01 Tenths ================= */
  E2.skill({ id: 'II.7.01', name: 'Tenths', steps: {
    a: { t: '1/10 as 0.1', g: R => {
      const k = R.int(1, 9);
      if (R.bool()) return num(`Write ${fh(k, 10)} as a decimal.`, k / 10, `${k} tenths is written 0.${k}. The first place after the point is tenths.`);
      return num(`0.${k} is how many tenths?`, k, `The digit after the point counts tenths, so 0.${k} = ${k} tenths.`);
    } },
    b: { t: 'with models', g: R => {
      const w = R.pick([0, 0, 1]), k = R.int(1, 9), n = w * 10 + k;
      return num(`Each bar is 1 whole. What decimal is shaded?`, n / 10, `${w ? '1 whole bar and ' : ''}${k} tenths are shaded: ${d(n, 1)}.`, { visual: V.fbar(n, 10, { w: 320, h: 36 }) });
    } },
    c: { t: 'on a number line', g: R => {
      const a = R.int(0, 5), k = R.int(1, 9), span = R.bool() ? 1 : 2, lo = a * 10, hi = lo + span * 10, t = lo + R.int(1, span * 10 - 1);
      return num(`What decimal is at the <b>?</b>`, t / 10, `Each small step is 0.1. Count from ${Math.floor(t / 10)}: ${d(t, 1)}.`, { visual: V7.line(lo, hi, 10, { ask: t }) });
    } },
    d: { t: 'read and write', g: R => {
      const w = R.int(0, 20), k = R.int(1, 9), n = w * 10 + k, kind = R.int(0, 2);
      if (kind === 0) return num(`Write <b>${w ? W(w) + ' and ' : ''}${W(k)} tenth${k > 1 ? 's' : ''}</b> as a decimal.`, n / 10, `${w} whole${w === 1 ? '' : 's'} and ${k} tenths is ${d(n, 1)}.`);
      if (kind === 1) { const t = R.int(11, 99); return num(`Write <b>${t} tenths</b> as a decimal.`, t / 10, `10 tenths make 1 whole, so ${t} tenths = ${d(t, 1)}.`); }
      const w2 = Math.max(1, w), n2 = w2 * 10 + k;
      return choice(R, `Which words mean ${d(n2, 1)}?`, `${W(w2)} and ${W(k)} tenth${k > 1 ? 's' : ''}`,
        [`${W(w2)} and ${W(k)} hundredth${k > 1 ? 's' : ''}`, `${W(k)} and ${W(w2)} tenth${w2 > 1 ? 's' : ''}`, W(n2)],
        `The whole part is ${w2}; the digit after the point is ${k} tenths.`);
    } },
  } });

  /* ================= II.7.02 Hundredths ================= */
  E2.skill({ id: 'II.7.02', name: 'Hundredths', steps: {
    a: { t: '1/100 as 0.01', g: R => {
      const k = R.pick([R.int(1, 9), R.int(11, 99)]);
      if (R.bool(0.6)) return num(`Write ${fh(k, 100)} as a decimal.`, k / 100, `Hundredths use two places after the point: ${fh(k, 100)} = ${dF(k, 2)}.`);
      return num(`${dF(k, 2)} is how many hundredths?`, k, `Two places after the point count hundredths: ${dF(k, 2)} = ${k} hundredths.`);
    } },
    b: { t: 'on a hundred grid', g: R => {
      let k = R.int(3, 97); if (k % 10 === 0) k++;
      return num(`The grid is 1 whole. What decimal is shaded?`, k / 100, `${k} of 100 squares are shaded: ${dF(k, 2)}.`, { visual: V.hgrid(k, { size: 16 }) });
    } },
    c: { t: 'read and write', g: R => {
      const w = R.int(0, 12), h = R.pick([R.int(1, 9), R.int(11, 99)]), n = w * 100 + h;
      if (R.bool(0.6)) return num(`Write <b>${w ? W(w) + ' and ' : ''}${W(h)} hundredth${h > 1 ? 's' : ''}</b> as a decimal.`, n / 100, `${h} hundredths needs two places${h < 10 ? ', so write a 0 in the tenths place' : ''}: ${dF(n, 2)}.`);
      const w2 = Math.max(1, w), n2 = w2 * 100 + h;
      return choice(R, `Which words mean ${dF(n2, 2)}?`, `${W(w2)} and ${W(h)} hundredth${h > 1 ? 's' : ''}`,
        [`${W(w2)} and ${W(h)} tenth${h > 1 ? 's' : ''}`, `${W(w2)} and ${W(h)} thousandth${h > 1 ? 's' : ''}`, `${W(h)} and ${W(w2)} hundredth${w2 > 1 ? 's' : ''}`],
        `Two digits after the point are hundredths: ${dF(n2, 2)} = ${w2} and ${h} hundredths.`);
    } },
    d: { t: 'tenths vs hundredths', g: R => {
      const k = R.int(1, 9), kind = R.int(0, 2);
      if (kind === 0) return num(`0.${k} = how many hundredths?`, k * 10, `1 tenth = 10 hundredths, so 0.${k} = 0.${k}0 = ${k * 10} hundredths.`);
      if (kind === 1) return choice(R, `Which is equal to 0.${k}?`, `0.${k}0`, [`0.0${k}`, `${k}.0`, `0.00${k}`], `A zero at the end of a decimal does not change it: 0.${k} = 0.${k}0.`);
      const a = R.int(1, 9), b = R.int(1, 9);
      return choice(R, `Which is greater: 0.${a} or 0.0${b}?`, `0.${a}`, [`0.0${b}`, 'They are equal'], `0.${a} = ${a * 10} hundredths, which is more than ${b} hundredths.`);
    } },
  } });

  /* ================= II.7.03 Decimal place value ================= */
  const distinctDigits = (R, k) => R.distinct(1, 9, k);
  E2.skill({ id: 'II.7.03', name: 'Decimal place value', steps: {
    a: { t: 'tenths place', g: R => {
      const [x, y, z, w] = distinctDigits(R, 4), two = R.bool(), n = two ? `${x}${y}.${z}${w}` : `${x}.${z}${w}`;
      if (R.bool(0.6)) return choice(R, `Which digit is in the <b>tenths</b> place of ${n}?`, String(z), [String(w), String(two ? y : x), String(x)].filter(v => v !== String(z)), `The tenths place is the first digit after the point: ${z}.`);
      return choice(R, `What is the value of the ${z} in ${n}?`, `0.${z}`, [`${z}`, `0.0${z}`, `${z}0`], `${z} is in the tenths place, so it is worth ${z} tenths = 0.${z}.`);
    } },
    b: { t: 'hundredths', g: R => {
      const [x, y, z, w] = distinctDigits(R, 4), n = `${x}${y}.${z}${w}`;
      if (R.bool()) return choice(R, `Which digit is in the <b>hundredths</b> place of ${n}?`, String(w), [String(z), String(y), String(x)], `Hundredths is the second place after the point: ${w}.`);
      return choice(R, `What is the value of the ${w} in ${n}?`, `0.0${w}`, [`0.${w}`, `${w}`, `0.00${w}`], `${w} is in the hundredths place: ${w} hundredths = 0.0${w}.`);
    } },
    c: { t: 'thousandths', g: R => {
      const [x, y, z, w] = distinctDigits(R, 4), n = `${x}.${y}${z}${w}`, pos = R.int(1, 3), dig = [x, y, z, w][pos];
      if (R.bool()) return choice(R, `Which digit is in the <b>thousandths</b> place of ${n}?`, String(w), [String(z), String(y), String(x)], `Thousandths is the third place after the point: ${w}.`);
      const val = [`0.${dig}`, `0.0${dig}`, `0.00${dig}`];
      return choice(R, `What is the value of the ${dig} in ${n}?`, val[pos - 1], [...val.filter((_, i) => i !== pos - 1), `${dig}`], `${dig} is in the ${PLACE[pos]} place, so it is worth ${val[pos - 1]}.`);
    } },
    d: { t: 'expanded form', g: R => {
      const w = R.int(1, 9), t = R.int(0, 9), h = R.int(1, 9), th = R.int(1, 9), n = w * 1000 + t * 100 + h * 10 + th;
      const parts = [String(w), t ? `0.${t}` : null, `0.0${h}`, `0.00${th}`].filter(Boolean);
      if (R.bool()) return num(`${parts.join(' + ')} = ?`, n / 1000, `Put each digit in its place: ${dF(n, 3)}.${t ? '' : ' There are 0 tenths.'}`);
      const miss = R.int(t ? 1 : 2, 3), all = [String(w), `0.${t}`, `0.0${h}`, `0.00${th}`];
      const shown = all.map((p, i) => i === miss ? '?' : p).filter((p, i) => i !== 1 || t);
      const ans = [0, t / 10, h / 100, th / 1000][miss];
      return num(`${dF(n, 3)} = ${shown.join(' + ')}. What is the missing number?`, ans, `The ${[0, t, h, th][miss]} in ${dF(n, 3)} is in the ${PLACE[miss]} place, worth ${fmt(ans)}.`);
    } },
  } });

  /* ================= II.7.04 Fractions and decimals ================= */
  E2.skill({ id: 'II.7.04', name: 'Fractions and decimals', steps: {
    a: { t: 'tenths', g: R => {
      const w = R.int(0, 6), k = R.int(1, 9), n = w * 10 + k;
      if (R.bool()) return num(`Write ${w ? fh(k, 10, w) : fh(k, 10)} as a decimal.`, n / 10, `${k} tenths is 0.${k}${w ? `, so ${w} and ${k} tenths is ${d(n, 1)}` : ''}.`);
      return num(`${d(n, 1)} = ${w ? w + ' + ' : ''}${fh('?', 10)}. What is the missing number?`, k, `The digit after the point shows tenths: ${d(n, 1)} = ${w ? w + ' + ' : ''}${fh(k, 10)}.`);
    } },
    b: { t: 'hundredths', g: R => {
      let k = R.int(1, 99); if (k % 10 === 0) k++;
      const kind = R.int(0, 2);
      if (kind === 0) return num(`Write ${fh(k, 100)} as a decimal.`, k / 100, `${k} hundredths = ${dF(k, 2)}.`);
      if (kind === 1) return num(`${dF(k, 2)} = ${fh('?', 100)}. What is the missing number?`, k, `${dF(k, 2)} is ${k} hundredths: ${fh(k, 100)}.`);
      const den = R.pick([20, 25, 50]), a = R.int(1, den - 1), h = a * 100 / den;
      return num(`Write ${fh(a, den)} as a decimal.`, h / 100, `${fh(a, den)} = ${fh(h, 100)} (multiply top and bottom by ${100 / den}) = ${dF(h, 2)}.`);
    } },
    c: { t: '1/2, 1/4, 3/4', g: R => {
      const F = R.pick([[1, 2, 50], [1, 4, 25], [3, 4, 75]]), w = R.int(0, 9), n = w * 100 + F[2];
      const fr = w ? fh(F[0], F[1], w) : fh(F[0], F[1]);
      if (R.bool()) return num(`Write ${fr} as a decimal.`, n / 100, `${fh(F[0], F[1])} = ${fh(F[2], 100)} = 0.${F[2]}${w ? `, so ${fr} = ${d(n, 2)}` : ''}.`);
      const opts = [[1, 2, 50], [1, 4, 25], [3, 4, 75]].map(G => w ? fh(G[0], G[1], w) : fh(G[0], G[1]));
      const trap = w ? fh(1, F[2], w) : fh(1, F[2]);
      return choice(R, `Which is equal to ${d(n, 2)}?`, fr, [...opts.filter(o => o !== fr), trap], `0.${F[2]} = ${fh(F[2], 100)} = ${fh(F[0], F[1])}.`);
    } },
    d: { t: 'decimal to fraction', g: R => {
      const dp = R.pick([1, 2, 2]), w = R.pick([0, 0, 1, 2]);
      let k; do { k = dp === 1 ? R.pick([2, 4, 5, 6, 8]) : R.int(2, 98); } while (dp === 2 && (k % 10 === 0 || E2.gcd(k, 100) === 1));
      const den = P10[dp], n = w * den + k, [a, b] = E2.reduce(k, den);
      return num(`Write ${d(n, dp)} as a fraction in simplest form.`, 0, `${d(n, dp)} = ${w ? fh(k, den, w) : fh(k, den)}. Divide top and bottom by ${den / b}: ${w ? fh(a, b, w) : fh(a, b)}.`, { fields: [frac(n, den, 'simplest')] });
    } },
  } });

  /* ================= II.7.05 Compare decimals ================= */
  const cmp = (a, b) => a < b ? 0 : a === b ? 1 : 2;
  const SIGNS = ['&lt;', '=', '&gt;'];
  E2.skill({ id: 'II.7.05', name: 'Compare decimals', steps: {
    a: { t: 'same length', g: R => {
      const dp = R.pick([1, 2]), top = dp === 1 ? 99 : 999, a = R.int(1, top); let b = R.bool(0.15) ? a : a + R.pick([-1, 1]) * R.pick([1, 9, 10, 11, 90, 100].filter(x => x < top / 2));
      if (b < 1 || b > top) b = a + 1;
      const r = cmp(a, b);
      return choiceFixed(`Which sign goes in the circle? ${dF(a, dp)} ◯ ${dF(b, dp)}`, SIGNS, r, `Compare place by place from the left: ${dF(a, dp)} ${SIGNS[r]} ${dF(b, dp)}.`);
    } },
    b: { t: '0.5 vs 0.45', g: R => {
      const t = R.int(2, 9), w = R.int(0, 3), kind = R.int(0, 4); let hLow = R.int(11, t * 10 - 1); if (hLow % 10 === 0) hLow++;
      const A = w * 100 + t * 10, B = w * 100 + (kind === 4 ? t * 10 + R.int(1, 9) : hLow);
      const sa = dF(A / 10, 1), sb = dF(B, 2);
      if (kind === 3) return choice(R, `Which is greater: ${sa} or ${w}.${t}0?`, 'They are equal', [sa, `${w}.${t}0`], `A zero on the end changes nothing: ${sa} = ${w}.${t}0.`);
      const big = A > B ? sa : sb;
      return choice(R, `Which is greater: ${sa} or ${sb}?`, big, [A > B ? sb : sa, 'They are equal'], `Write ${sa} as ${dF(A, 2)}. ${dF(A, 2)} ${A > B ? '&gt;' : '&lt;'} ${sb}, so ${big} is greater. Longer is not always bigger.`);
    } },
    c: { t: 'on a number line', g: R => {
      if (R.bool()) {
        const t = R.int(1, 8), h = R.int(1, 9), n = t * 10 + h;
        return num(`What decimal is at the <b>?</b>`, n / 100, `The line goes from 0.${t} to 0.${t + 1} in hundredths. The ? is ${h} steps past 0.${t}: ${dF(n, 2)}.`, { visual: V7.line(t * 10, t * 10 + 10, 10, { ask: n, dp: 2, labels: k => k % 10 === 0, step: 1 }) });
      }
      // letters on a 0–1 line in hundredths; which letter shows the number
      let x, y, uniq; do { x = R.int(1, 9); y = R.int(1, 9); uniq = [x * 10 + y, y * 10 + x, x * 10, y * 10]; } while (x === y || uniq.some((a, i) => uniq.some((b, j) => i < j && Math.abs(a - b) < 7)));
      const target = uniq[0], letters = R.shuffle(['A', 'B', 'C', 'D']).slice(0, uniq.length);
      const vis = V7.line(0, 100, 100, { width: 460, fs: 15, step: 10, mid: 10, labels: k => k % 10 === 0, dp: 2, letters: uniq.map((k, i) => [k, letters[i]]) });
      return choiceFixed(`Which letter shows <b>${dF(target, 2)}</b>?`, letters.slice().sort(), letters.slice().sort().indexOf(letters[0]), `${dF(target, 2)} is between 0.${x} and 0.${x + 1}, just ${y} hundredths past 0.${x}.`, { visual: vis });
    } },
    d: { t: 'order a list', g: R => {
      // mixed lengths around the same size, e.g. 0.4, 0.35, 0.405, 0.38
      const w = R.int(0, 5), t = R.int(2, 8);
      const vals = [[t, 1], [t * 10 - R.int(1, 9), 2], [t * 100 + R.int(1, 9), 3], [(t - 1) * 10 + R.int(1, 9), 2]];
      const nums = vals.map(([n, dp]) => ({ s: d(w * P10[dp] + n, dp), v: (w * P10[dp] + n) * P10[3 - dp] }));
      const uniq = []; nums.forEach(x => { if (!uniq.some(u => u.v === x.v)) uniq.push(x); });
      const list = R.shuffle(uniq).slice(0, 4);
      const asc = list.slice().sort((a, b) => a.v - b.v).map(x => x.s).join(', ');
      const byLen = list.slice().sort((a, b) => a.s.length - b.s.length || a.v - b.v).map(x => x.s).join(', ');
      const byDigits = list.slice().sort((a, b) => +a.s.replace('.', '') - +b.s.replace('.', '')).map(x => x.s).join(', ');
      const desc = list.slice().sort((a, b) => b.v - a.v).map(x => x.s).join(', ');
      return choice(R, `Order from least to greatest: ${list.map(x => x.s).join(', ')}`, asc, [byLen, byDigits, desc], `Give them all 3 decimal places, then compare: ${list.slice().sort((a, b) => a.v - b.v).map(x => dF(x.v, 3)).join(' &lt; ')}.`);
    } },
  } });

  /* ================= II.7.06 Round decimals ================= */
  E2.skill({ id: 'II.7.06', name: 'Round decimals', steps: {
    a: { t: 'to the whole', g: R => {
      const dp = R.pick([1, 1, 2]), P = P10[dp]; let n; do { n = R.int(P + 1, 30 * P); } while (n % P === 0);
      const r = Math.floor((n + P / 2) / P), up = (n % P) * 2 >= P, wh = Math.floor(n / P), hn = n * (100 / P);
      return num(`Round ${d(n, dp)} to the nearest whole number.`, r, `The tenths digit is ${Math.floor((n % P) / P10[dp - 1])}, ${up ? '5 or more, so round up' : 'less than 5, so round down'} to ${r}.`, { visual: V7.line(wh * 100, wh * 100 + 100, 100, { step: 10, dp: 2, labels: k => k % 50 === 0, marks: [hn], width: 420 }) });
    } },
    b: { t: 'to tenths', g: R => {
      let n; do { n = R.int(101, 2999); } while (n % 10 === 0);
      const t = Math.floor((n + 5) / 10), h = n % 10;
      return num(`Round ${dF(n, 2)} to the nearest tenth.`, t / 10, `The hundredths digit is ${h}, so round ${h >= 5 ? 'up' : 'down'}: ${d(t, 1)}${t % 10 === 0 ? ` (= ${dF(t, 1)})` : ''}.`);
    } },
    c: { t: 'to hundredths', g: R => {
      let n; do { n = R.int(1001, 19999); } while (n % 10 === 0);
      const t = Math.floor((n + 5) / 10), th = n % 10;
      return num(`Round ${dF(n, 3)} to the nearest hundredth.`, t / 100, `The thousandths digit is ${th}, so round ${th >= 5 ? 'up' : 'down'}: ${d(t, 2)}.`);
    } },
    d: { t: 'estimate with rounding', g: R => {
      let a, b; do { a = R.int(21, 199); b = R.int(11, 99); } while (a % 10 === 5 || b % 10 === 5 || a % 10 === 0 || b % 10 === 0);
      const ra = Math.round(a / 10), rb = Math.round(b / 10);
      const kind = R.int(0, 2);
      if (kind === 0) return num(`Estimate ${d(a, 1)} + ${d(b, 1)} by rounding each to the nearest whole.`, ra + rb, `${d(a, 1)} ≈ ${ra} and ${d(b, 1)} ≈ ${rb}, so about ${ra} + ${rb} = ${ra + rb}.`);
      if (kind === 1 && ra > rb) return num(`Estimate ${d(a, 1)} − ${d(b, 1)} by rounding each to the nearest whole.`, ra - rb, `${d(a, 1)} ≈ ${ra} and ${d(b, 1)} ≈ ${rb}, so about ${ra} − ${rb} = ${ra - rb}.`);
      const m = R.int(3, 9); let x; do { x = R.int(21, 99); } while (x % 10 === 5 || x % 10 === 0);
      const rx = Math.round(x / 10), other = (x % 10 > 5 ? rx - 1 : rx + 1) * m;
      return choice(R, `About how much is ${d(x, 1)} × ${m}?`, String(rx * m), [String(rx * m * 10), fmt(rx * m / 10), String(other)], `${d(x, 1)} ≈ ${rx}, and ${rx} × ${m} = ${rx * m}.`);
    } },
  } });

  /* ================= II.7.07 Add decimals ================= */
  E2.skill({ id: 'II.7.07', name: 'Add decimals', steps: {
    a: { t: 'tenths', g: R => {
      const a = R.int(1, 60), b = R.int(1, 40);
      return num(`${d(a, 1)} + ${d(b, 1)} = ?`, (a + b) / 10, `${a} tenths + ${b} tenths = ${a + b} tenths = ${d(a + b, 1)}.`);
    } },
    b: { t: 'hundredths', g: R => {
      const a = R.int(101, 899), b = R.int(11, 599);
      return num(`${dF(a, 2)} + ${dF(b, 2)} = ?`, (a + b) / 100, `Add hundredths, then tenths, then ones, regrouping as needed: ${d(a + b, 2)}.`, { visual: V7.column([[a, 2], [b, 2]], '+') });
    } },
    c: { t: 'line up the point', g: R => {
      const a = R.int(101, 999), b = R.int(11, 99), sa = dF(a, 2), sb = R.bool() ? d(b, 1) : String(R.int(2, 19));
      const bv = sb.includes('.') ? b * 10 : +sb * 100, sum = a + bv;
      const wrong = sb.includes('.') ? (a + b) / 100 : (a + +sb) / 100;
      return choice(R, `${sa} + ${sb} = ?`, fmt(sum / 100), [fmt(wrong), fmt(sum / 10), sb.includes('.') ? fmt(sum / 1000) : fmt((a + +sb * 10) / 100)],
        `Line up the points: ${sa} + ${sb.includes('.') ? sb + '0' : sb + '.00'} = ${d(sum, 2)}.`);
    } },
    d: { t: 'different lengths', g: R => {
      const kind = R.int(0, 2);
      if (kind === 0) { const a = R.int(11, 99), b = R.int(1001, 9999); return num(`${d(a, 1)} + ${dF(b, 3)} = ?`, (a * 100 + b) / 1000, `Write ${d(a, 1)} as ${dF(a * 100, 3)}, then add: ${d(a * 100 + b, 3)}.`); }
      if (kind === 1) { const a = R.int(2, 30); let b; do { b = R.int(101, 999); } while (b % 10 === 0); return num(`${a} + ${dF(b, 2)} = ?`, (a * 100 + b) / 100, `${a} = ${a}.00, so ${a}.00 + ${dF(b, 2)} = ${d(a * 100 + b, 2)}.`); }
      const a = R.int(11, 99), c = R.int(1, 9); let b; do { b = R.int(101, 999); } while (b % 10 === 0);
      return num(`${d(a, 1)} + ${dF(b, 2)} + ${c} = ?`, (a * 10 + b + c * 100) / 100, `Line up the points: ${dF(a * 10, 2)} + ${dF(b, 2)} + ${c}.00 = ${d(a * 10 + b + c * 100, 2)}.`);
    } },
  } });

  /* ================= II.7.08 Subtract decimals ================= */
  E2.skill({ id: 'II.7.08', name: 'Subtract decimals', steps: {
    a: { t: 'tenths', g: R => {
      const a = R.int(5, 99), b = R.int(1, a - 1);
      return num(`${d(a, 1)} − ${d(b, 1)} = ?`, (a - b) / 10, `${a} tenths − ${b} tenths = ${a - b} tenths = ${d(a - b, 1)}.`);
    } },
    b: { t: 'hundredths', g: R => {
      const a = R.int(200, 999), b = R.int(11, a - 20);
      return num(`${dF(a, 2)} − ${dF(b, 2)} = ?`, (a - b) / 100, `Subtract hundredths, then tenths, then ones, regrouping as needed: ${d(a - b, 2)}.`, { visual: V7.column([[a, 2], [b, 2]], '−') });
    } },
    c: { t: 'line up the point', g: R => {
      let a, b; do { a = R.int(1001, 4999); b = R.int(11, 99); } while (a % 10 === 0 || b % 10 === 0); // a hundredths, b tenths
      const diff = a - b * 10, wrong = (a - b) / 100;
      return choice(R, `${dF(a, 2)} − ${d(b, 1)} = ?`, fmt(diff / 100), [fmt(wrong), fmt((a * 10 - b) / 1000), fmt(diff / 10)],
        `Line up the points: ${dF(a, 2)} − ${d(b, 1)}0 = ${d(diff, 2)}.`, { });
    } },
    d: { t: 'with zeros', g: R => {
      const kind = R.int(0, 2);
      if (kind === 0) { const a = R.int(2, 20), b = R.int(11, a * 100 - 1); return num(`${a} − ${dF(b, 2)} = ?`, (a * 100 - b) / 100, `Write ${a} as ${a}.00, then subtract: ${a}.00 − ${dF(b, 2)} = ${d(a * 100 - b, 2)}.`); }
      if (kind === 1) { const a = R.int(20, 99), b = R.int(101, a * 100 - 100); return num(`${d(a, 1)} − ${dF(b, 3)} = ?`, (a * 100 - b) / 1000, `Write ${d(a, 1)} as ${dF(a * 100, 3)}, then subtract: ${d(a * 100 - b, 3)}.`); }
      const a = R.pick([1, 10, 100]), b = R.int(1, a * 100 - 1);
      return num(`${a} − ${dF(b, 2)} = ?`, (a * 100 - b) / 100, `${a} = ${a}.00. Regroup across the zeros: ${a}.00 − ${dF(b, 2)} = ${d(a * 100 - b, 2)}.`);
    } },
  } });

  /* ================= II.7.09 Powers of ten and the point ================= */
  E2.skill({ id: 'II.7.09', name: 'Powers of ten and the point', steps: {
    a: { t: '× 10', g: R => {
      const dp = R.pick([1, 2, 2, 3]); let n; do { n = R.int(11, 999); } while (n % 10 === 0);
      return num(`${d(n, dp)} × 10 = ?`, n / P10[dp - 1], `Each digit moves 1 place to the left: ${d(n, dp)} × 10 = ${d(n, dp - 1)}.`);
    } },
    b: { t: '× 100 and × 1,000', g: R => {
      const f = R.pick([2, 3]), dp = R.int(1, 3); let n; do { n = R.int(11, 999); } while (n % 10 === 0);
      const res = f >= dp ? n * P10[f - dp] : n / P10[dp - f];
      return num(`${d(n, dp)} × ${f === 3 ? '1,000' : '100'} = ?`, res, `Each digit moves ${f} places to the left: ${fmt(res)}.`);
    } },
    c: { t: '÷ 10', g: R => {
      const f = R.pick([1, 1, 1, 2]), dp = R.int(0, 3 - f); let n; do { n = R.int(11, 999); } while (n % 10 === 0);
      return num(`${d(n, dp)} ÷ ${P10[f]} = ?`, n / P10[dp + f], `Each digit moves ${f} place${f > 1 ? 's' : ''} to the right: ${d(n, dp + f)}.`);
    } },
    d: { t: 'why the point seems to move', g: R => {
      const [x, y, z] = R.distinct(1, 9, 3), n = x * 100 + y * 10 + z, mul = R.bool(0.6), f = mul ? R.pick([1, 2]) : 1;
      if (R.bool(0.6)) {
        const was = y / 10, now = mul ? y * P10[f] / 10 : y / 10 / P10[f];
        return num(`In ${d(n, 2)} ${mul ? '×' : '÷'} ${P10[f]} = ${mul ? d(n, 2 - f) : d(n, 2 + f)}, the digit ${y} was worth ${fmt(was)}. What is it worth now?`, now, `${mul ? 'Multiplying' : 'Dividing'} by ${P10[f]} makes every digit ${P10[f]} times ${mul ? 'bigger' : 'smaller'}: ${fmt(was)} ${mul ? '×' : '÷'} ${P10[f]} = ${fmt(now)}.`);
      }
      const ok = `The digits move ${f} place${f > 1 ? 's' : ''} ${mul ? 'left' : 'right'}; the point stays put.`;
      return choice(R, `What really happens in ${d(n, 2)} ${mul ? '×' : '÷'} ${P10[f]}?`, ok,
        [`The digits move ${f} place${f > 1 ? 's' : ''} ${mul ? 'right' : 'left'}; the point stays put.`, `${f > 1 ? f + ' zeros are' : 'A zero is'} added on the end.`, `The digits stay put and the point jumps ${f === 1 ? 2 : 1} place${f === 1 ? 's' : ''}.`],
        `Each digit becomes ${P10[f]} times ${mul ? 'bigger' : 'smaller'}, so it shifts ${f} place${f > 1 ? 's' : ''} ${mul ? 'left' : 'right'}. The point only seems to move.`);
    } },
  } });

  /* ================= II.7.10 Decimal × whole number ================= */
  E2.skill({ id: 'II.7.10', name: 'Decimal × whole number', steps: {
    a: { t: 'with models', g: R => {
      const k = R.int(2, 4), m = R.int(2, 9);
      return num(`Each bar is 1 whole. What is ${k} × 0.${m}?`, k * m / 10, `${k} groups of ${m} tenths = ${k * m} tenths = ${d(k * m, 1)}.`, { visual: V7.bars(k, m) });
    } },
    b: { t: 'the algorithm', g: R => {
      const dp = R.pick([1, 2]), m = R.int(3, 9); let n; do { n = dp === 1 ? R.int(12, 99) : R.int(101, 999); } while (n % 10 === 0);
      return num(`${d(n, dp)} × ${m} = ?`, n * m / P10[dp], `Multiply ${n} × ${m} = ${n * m}, then put back ${dp} decimal place${dp > 1 ? 's' : ''}: ${(n * m) % 10 ? d(n * m, dp) : `${dF(n * m, dp)} = ${d(n * m, dp)}`}.`);
    } },
    c: { t: 'place the point', g: R => {
      const dp = R.pick([1, 2]), m = R.int(3, 9); let n; do { n = R.int(12, 99); } while (n % 10 === 0); const p = n * m;
      return choice(R, `${n} × ${m} = ${p}. So ${d(n, dp)} × ${m} = ?`, d(p, dp), [d(p, dp + 1), String(p), dp === 1 ? d(p, 3) : d(p, 1)],
        `${d(n, dp)} has ${dp} decimal place${dp > 1 ? 's' : ''}, so the answer has ${dp} too: ${d(p, dp)}.`);
    } },
    d: { t: 'estimate', g: R => {
      const m = R.int(3, 9); let n; do { n = R.int(21, 99); } while (n % 10 === 5 || n % 10 === 0);
      const r = Math.round(n / 10), e = r * m, other = (n % 10 > 5 ? r - 1 : r + 1) * m;
      return choice(R, `About how much is ${d(n, 1)} × ${m}?`, String(e), [String(e * 10), fmt(e / 10), String(other)],
        `${d(n, 1)} is close to ${r}, and ${r} × ${m} = ${e}.`);
    } },
  } });

  /* ================= II.7.11 Multiply decimals ================= */
  E2.skill({ id: 'II.7.11', name: 'Multiply decimals', steps: {
    a: { t: 'area model', g: R => {
      const A = R.int(1, 4), a = R.int(1, 9), B = R.int(1, 3), b = R.int(1, 9);
      const cells = [[String(A * B), d(a * B, 1)], [d(A * b, 1), d(a * b, 2)]], hid = R.int(0, 3);
      const vis = V.areaModel([{ label: String(A), w: 3 }, { label: `0.${a}`, w: 1.3 }], [{ label: String(B), h: 2 }, { label: `0.${b}`, h: 1 }], { cells: cells.map((r, i) => r.map((c, j) => i * 2 + j === hid ? '?' : c)) });
      const tot = (A * 10 + a) * (B * 10 + b);
      return num(`Use the area model: ${A}.${a} × ${B}.${b} = ?`, tot / 100, `The parts are ${A * B}, ${d(a * B, 1)}, ${d(A * b, 1)} and ${d(a * b, 2)}. They add to ${d(tot, 2)}.`, { visual: vis });
    } },
    b: { t: 'count decimal places', g: R => {
      let x, y; do { x = R.int(12, 99); y = R.int(12, 99); } while (x % 10 === 0 || y % 10 === 0); const p = x * y, da = R.int(1, 2), db = R.int(1, 2), s = da + db;
      const show4 = k => k === 4 ? ('0.' + String(p).padStart(4, '0')).replace(/\.?0+$/, '') : d(p, k);
      return choice(R, `${x} × ${y} = ${fmt(p)}. So ${d(x, da)} × ${d(y, db)} = ?`, show4(s), [s - 1, s + 1, s === 2 ? 4 : 1].filter(k => k >= 0 && k <= 4).map(show4),
        `${d(x, da)} has ${da} decimal place${da > 1 ? 's' : ''} and ${d(y, db)} has ${db}, so the answer has ${s}: ${show4(s)}.`);
    } },
    c: { t: 'the algorithm', g: R => {
      const da = R.pick([1, 1, 2]), x = da === 1 ? R.int(12, 99) : R.int(101, 499), y = R.int(2, 9) + (R.bool() ? R.int(1, 3) * 10 : 0), p = x * y;
      return num(`${d(x, da)} × ${d(y, 1)} = ?`, p / P10[da + 1], `Multiply ${x} × ${y} = ${fmt(p)}. There are ${da + 1} decimal places in total: ${p % 10 ? d(p, da + 1) : `${dF(p, da + 1)} = ${d(p, da + 1)}`}.`);
    } },
    d: { t: 'estimate', g: R => {
      let x, y; do { x = R.int(21, 99); y = R.int(21, 99); } while ([x, y].some(v => v % 10 === 5 || v % 10 === 0));
      const rx = Math.round(x / 10), ry = Math.round(y / 10), e = rx * ry;
      return choice(R, `About how much is ${d(x, 1)} × ${d(y, 1)}?`, String(e), [String(e * 10), fmt(e / 10), String(e * 100)],
        `${d(x, 1)} ≈ ${rx} and ${d(y, 1)} ≈ ${ry}, so about ${rx} × ${ry} = ${e}.`);
    } },
  } });

  /* ================= II.7.12 Decimal ÷ whole number ================= */
  E2.skill({ id: 'II.7.12', name: 'Decimal ÷ whole number', steps: {
    a: { t: 'with models', g: R => {
      const k = R.int(2, 5);
      if (R.bool()) { const q = R.int(1, Math.floor(20 / k)), n = q * k; return num(`Each bar is 1 whole. Share ${d(n, 1)} equally into ${k} groups. How much is in each?`, q / 10, `${n} tenths ÷ ${k} = ${q} tenth${q === 1 ? '' : 's'} = ${d(q, 1)}.`, { visual: V.fbar(n, 10, { w: 320, h: 36 }) }); }
      let q; do { q = R.int(3, Math.floor(99 / k)); } while ((q * k) % 10 === 0);
      return num(`The grid is 1 whole. Share ${dF(q * k, 2)} equally into ${k} groups. How much is in each?`, q / 100, `${q * k} hundredths ÷ ${k} = ${q} hundredths = ${dF(q, 2)}.`, { visual: V.hgrid(q * k, { size: 14 }) });
    } },
    b: { t: 'long division with a point', g: R => {
      const m = R.int(3, 9); let q, n; do { q = R.int(101, 999); n = q * m; } while (n % 10 === 0);
      return num(`${d(n, 2)} ÷ ${m} = ?`, q / 100, `Divide as with whole numbers and keep the point in line: ${d(n, 2)} ÷ ${m} = ${d(q, 2)}.`);
    } },
    c: { t: 'add zeros to keep going', g: R => {
      let n, dp, m, q;
      do { dp = R.pick([0, 1]); m = R.pick([2, 4, 5, 8]); n = dp ? R.int(11, 99) : R.int(1, 30); q = n * P10[3 - dp] / m; }
      while (!Number.isInteger(q) || dpOf(q, 3) <= dp || n % m === 0);
      return num(`${d(n, dp)} ÷ ${m} = ?`, q / 1000, `Write ${d(n, dp)} as ${dF(n * P10[3 - dp], 3)} (extra zeros change nothing) and keep dividing: ${d(q, 3)}.`);
    } },
    d: { t: 'money', g: (R, O) => {
      const k = R.int(2, 6), each = R.int(25, 999) * (O.coins === 'THB' ? 10 : 1), tot = each * k, c = cur(O);
      return num(`${k} friends share ${M(tot, O)} equally. How much does each get?`, each / 100, `${M(tot, O)} ÷ ${k} = ${M(each, O)}.`, { fields: [{ label: c.lab, ans: each / 100 }] });
    } },
  } });

  /* ================= II.7.13 Divide by a decimal ================= */
  E2.skill({ id: 'II.7.13', name: 'Divide by a decimal', steps: {
    a: { t: 'shift the point in both', g: R => {
      const dv = R.int(2, 9), q = R.int(2, 12), dp = R.pick([1, 1, 2]), n = dv * q; // n/10^dp ÷ dv/10^dp
      const A = d(n, dp), B = d(dv, dp), f = P10[dp];
      return choice(R, `${A} ÷ ${B} has the same answer as…`, `${n} ÷ ${dv}`, [`${A} ÷ ${dv}`, `${n} ÷ ${B}`, `${fmt(n * 10)} ÷ ${dv}`],
        `Multiply both numbers by ${f}: ${A} × ${f} = ${n} and ${B} × ${f} = ${dv}. The answer stays the same.`);
    } },
    b: { t: 'the algorithm', g: R => {
      const dp = R.pick([1, 1, 2]), dv = R.int(2, 9) + (R.bool(0.3) ? 10 : 0), qd = R.pick([0, 0, 1]), q = qd ? R.int(11, 99) : R.int(2, 40);
      const n = dv * q, ndp = dp + qd;
      return num(`${d(n, ndp)} ÷ ${d(dv, dp)} = ?`, q / P10[qd], `Multiply both by ${P10[dp]}: ${d(n, qd)} ÷ ${dv} = ${d(q, qd)}.`);
    } },
    c: { t: 'estimate', g: R => {
      let dv, q; do { dv = R.int(2, 9); q = R.int(2, 9) * R.pick([1, 10]); } while (dv * q < 15);
      const n = dv * q + R.pick([-1, 1]), e = q, sd = d(n, 1), sv = d(dv, 1);
      return choice(R, `About how much is ${sd} ÷ ${sv}?`, String(e), [fmt(e / 10), String(e * 10), String(e * 100)],
        `${sd} ÷ ${sv} is the same as ${d(n, 0)} ÷ ${dv}, which is about ${dv * q} ÷ ${dv} = ${e}.`);
    } },
    d: { t: 'word problems', g: (R, O) => {
      const kind = R.int(0, 2), q = R.int(4, 25);
      if (kind === 2) { const p = R.pick([5, 10, 20, 25, 50]), tot = p * q; return num(`A pencil costs ${MS(p, O)}. How many pencils can you buy with ${M(tot, O)}?`, q, `${M(tot, O)} ÷ ${M(p, O)} is the same as ${tot} ÷ ${p} = ${q}.`); }
      const met = O.units !== 'imperial', dv = R.int(2, 9), n = dv * q;
      const pr = kind === 0 ? `A ribbon is ${d(n, 1)} ${met ? 'm' : 'yd'} long. How many pieces of 0.${dv} ${met ? 'm' : 'yd'} can you cut?`
        : `A jug holds ${d(n, 1)} ${met ? 'L' : 'gal'}. How many cups of 0.${dv} ${met ? 'L' : 'gal'} can you fill?`;
      return num(pr, q, `${d(n, 1)} ÷ 0.${dv} is the same as ${n} ÷ ${dv} = ${q}.`);
    } },
  } });

  /* ================= II.7.14 Money ================= */
  E2.skill({ id: 'II.7.14', name: 'Money', steps: {
    a: { t: 'whole units and cents', g: (R, O) => {
      const c = cur(O), big = R.int(0, 25), small = R.pick([R.int(1, 9), R.int(10, 99)]), tot = big * 100 + small, kind = R.int(0, 2);
      if (kind === 0) return num(`Write ${big} ${c.big} and ${small} ${c.small} as a decimal.`, tot / 100, `${small} ${c.small} is ${dF(small, 2)} of a ${c.big === 'dollars' ? 'dollar' : 'baht'}${small < 10 ? ' (two places, so write a 0)' : ''}: ${M(tot, O)}.`, { fields: [{ label: c.lab, ans: tot / 100 }] });
      if (kind === 1) return num(`How many ${c.small} is ${M(tot + 100, O)}?`, tot + 100, `1 ${c.big === 'dollars' ? 'dollar' : 'baht'} = 100 ${c.small}, so ${M(tot + 100, O)} = ${tot + 100} ${c.small}.`);
      return choice(R, `Which is the same as ${MS(small, O)}?`, M(small, O), [M(small * 10, O), M(small * 100, O)], `100 ${c.small} = 1 ${c.big === 'dollars' ? 'dollar' : 'baht'}, so ${MS(small, O)} = ${M(small, O)}.`);
    } },
    b: { t: 'add and subtract money', g: (R, O) => {
      const c = cur(O), sc = O.coins === 'THB' ? 10 : 1, a = R.int(105, 2500) * sc, b = R.int(105, 2500) * sc, kind = R.int(0, 2);
      if (kind === 0) return num(`${M(a, O)} + ${M(b, O)} = ?`, (a + b) / 100, `Line up the points and add: ${M(a + b, O)}.`, { fields: [{ label: c.lab, ans: (a + b) / 100 }] });
      if (kind === 1) { const hi = Math.max(a, b), lo = Math.min(a, b) === hi ? hi - 50 : Math.min(a, b); return num(`${M(hi, O)} − ${M(lo, O)} = ?`, (hi - lo) / 100, `Line up the points and subtract: ${M(hi - lo, O)}.`, { fields: [{ label: c.lab, ans: (hi - lo) / 100 }] }); }
      const pay = R.pick([500, 1000, 2000, 5000]) * sc, cost = R.int(Math.floor(pay / 3), pay - 5);
      return num(`A toy costs ${M(cost, O)}. You pay ${M(pay, O)}. How much change?`, (pay - cost) / 100, `${M(pay, O)} − ${M(cost, O)} = ${M(pay - cost, O)}.`, { fields: [{ label: c.lab, ans: (pay - cost) / 100 }] });
    } },
    c: { t: 'multiply prices', g: (R, O) => {
      const c = cur(O), k = R.int(2, 9), p = R.pick([R.int(5, 99) * 5, R.int(101, 999)]) * (O.coins === 'THB' ? 10 : 1);
      return num(`One ticket costs ${M(p, O)}. How much do ${k} tickets cost?`, k * p / 100, `${k} × ${M(p, O)} = ${M(k * p, O)}.`, { fields: [{ label: c.lab, ans: k * p / 100 }] });
    } },
    d: { t: 'simple budgets', g: (R, O) => {
      const c = cur(O), sc = O.coins === 'THB' ? 10 : 1, budget = R.pick([1000, 2000, 2500, 5000]) * sc, k = R.int(2, 3);
      let p1, p2; do { p1 = R.int(40, 250) * 5 * sc; p2 = R.int(10, 200) * 5 * sc; } while (k * p1 + p2 >= budget || k * p1 + p2 < budget / 3);
      const spent = k * p1 + p2;
      return num(`You have ${M(budget, O)}. You buy ${k} books at ${M(p1, O)} each and a pen at ${M(p2, O)}. How much is left?`, (budget - spent) / 100,
        `${k} × ${M(p1, O)} + ${M(p2, O)} = ${M(spent, O)}. ${M(budget, O)} − ${M(spent, O)} = ${M(budget - spent, O)}.`, { fields: [{ label: c.lab + ' left', ans: (budget - spent) / 100 }] });
    } },
  } });
})();

/* Era II · Unit II.8 Expressions (II.8.01–II.8.09)
   Local helpers live under V8 / small functions inside this file. */
(function(){ const {num, choice, choiceFixed, tf, fh, fmt, V, C} = E2;
const X = '×', D = '÷', M = '−', BOX = '□';
const again = (id, k, R, O) => E2.byId[id].steps[k].g(R, O);
const NAMES = ['Ana', 'Ben', 'Mia', 'Leo', 'Sara', 'Tom', 'Kim', 'Raj', 'Noor', 'Eli'];
const money = (O, n) => O.coins === 'THB' ? `${fmt(n)} baht` : `$${fmt(n)}`;
const SYM = ['&lt;', '=', '&gt;'];

/* ---------- expression engine (strings with + − × ÷ and brackets) ---------- */
const tok = s => s.match(/\d+|[+−×÷()]/g);
const ap = (a, op, b) => op === '+' ? a + b : op === M ? a - b : op === X ? a * b : a / b;
const okN = v => Number.isInteger(v) && v >= 0;
// evaluate. mode 'ok' (normal rules) | 'flat' (left to right, brackets kept) | 'nob' (brackets ignored, normal rules). null if a step is not a whole number ≥ 0
const ev = (s, mode = 'ok') => {
  let t = tok(s); if (mode === 'nob') t = t.filter(x => x !== '(' && x !== ')');
  let i = 0, bad = false;
  const A = (a, op, b) => { const v = ap(a, op, b); if (!okN(v)) bad = true; return v; };
  const prim = () => { if (t[i] === '(') { i++; const v = expr(); i++; return v; } return +t[i++]; };
  const term = () => { let v = prim(); while (t[i] === X || t[i] === D) { const op = t[i++]; v = A(v, op, prim()); } return v; };
  const expr = () => { if (mode === 'flat') { let v = prim(); while (i < t.length && t[i] !== ')') { const op = t[i++]; v = A(v, op, prim()); } return v; }
    let v = term(); while (t[i] === '+' || t[i] === M) { const op = t[i++]; v = A(v, op, term()); } return v; };
  const v = expr(); return bad ? null : v;
};
const sp = t => t.join(' ').replace(/\( /g, '(').replace(/ \)/g, ')');
// one step of working on a token array. how: 'ok' | 'flat' (leftmost op in the innermost group, ignoring × first)
const step1 = (t, how = 'ok') => {
  const close = t.indexOf(')'), lo = close >= 0 ? t.lastIndexOf('(', close) + 1 : 0, hi = close >= 0 ? close : t.length, seg = t.slice(lo, hi);
  let j = how === 'flat' ? 1 : seg.findIndex(x => x === X || x === D); if (j < 0) j = 1;
  const v = ap(+seg[j - 1], seg[j], +seg[j + 1]), nseg = seg.slice(0, j - 1).concat([String(v)], seg.slice(j + 2));
  const out = close >= 0 && nseg.length === 1 ? t.slice(0, lo - 1).concat(nseg, t.slice(hi + 1)) : t.slice(0, lo).concat(nseg, t.slice(hi));
  return {t: out, v, op: `${seg[j - 1]} ${seg[j]} ${seg[j + 1]}`, idx: (close >= 0 && nseg.length === 1 ? lo - 1 : lo) + j - 1};
};
// fill a template like 'a + b × c' with numbers from gen until it evaluates to a whole number in range
const fill = (R, tpl, gen, o = {}) => {
  for (let k = 0; k < 400; k++) {
    const vals = {}; const s = tpl.replace(/[a-e]/g, ch => (vals[ch] = vals[ch] !== undefined ? vals[ch] : gen(ch, R, vals)));
    const v = ev(s); if (v === null || v > (o.max || 200) || (o.min !== undefined && v < o.min)) continue;
    if (o.ok && !o.ok(s, v, vals)) continue;
    return {s, v, vals};
  }
  throw new Error('fill ' + tpl);
};
const small = (ch, R) => R.int(2, 9);
// every bracket holds at least 2, and no step divides into 0 or makes 0
const brOK = s => (s.match(/\([^()]*\)/g) || []).every(b => ev(b) >= 2);
const mixed = (ch, R) => R.bool(0.5) ? R.int(2, 9) : R.int(10, 30);

/* ---------- V8 visuals ---------- */
const V8 = {};
// input/output table. rows: [[in, out], …]; a value '?' is drawn as an amber box
V8.table = (rows, o = {}) => {
  const cw = rows.length > 3 ? 62 : 86, rh = 38, hd = o.head || ['In', 'Out']; let body = '';
  const cell = (x, y, v, head) => { body += `<rect x="${x}" y="${y}" width="${cw}" height="${rh}" fill="${head ? C.faint : C.paper}" stroke="${C.ink}" stroke-width="1.5"/>`;
    body += v === '?' ? `<rect x="${x + cw / 2 - 16}" y="${y + 7}" width="32" height="${rh - 14}" rx="5" fill="${C.amber}"/>` + V.text(x + cw / 2, y + rh / 2, '?', {size: 17, weight: 700}) : V.text(x + cw / 2, y + rh / 2, v, {size: 17, weight: head ? 700 : 500}); };
  cell(2, 2, hd[0], true); rows.forEach((r, i) => cell(2 + (i + 1) * cw, 2, r[0]));
  cell(2, 2 + rh, hd[1], true); rows.forEach((r, i) => cell(2 + (i + 1) * cw, 2 + rh, r[1]));
  return V.svg((rows.length + 1) * cw + 4, 2 * rh + 4, body, 'input output table');
};
// pan balance. items: {w:n} a weight block | {u:'A'} an unknown (color by letter)
const UCOL = {'?': C.amber, A: C.amber, B: C.violet};
V8.balance = (left, right) => {
  const W = 500, cx = W / 2, arm = 160, beamY = 70, panY = 118, pw = 180; let body = '';
  body += `<path d="M${cx} ${beamY} L${cx - 26} 190 L${cx + 26} 190 Z" fill="${C.faint}" stroke="${C.ink}" stroke-width="2"/>`;
  body += `<line x1="${cx - arm}" y1="${beamY}" x2="${cx + arm}" y2="${beamY}" stroke="${C.ink}" stroke-width="4" stroke-linecap="round"/>` + V.dot(cx, beamY, 6, C.ink);
  const pan = (x0, items) => {
    const pc = x0 + pw / 2;
    body += `<line x1="${pc}" y1="${beamY}" x2="${pc - pw / 2 + 12}" y2="${panY}" stroke="${C.muted}" stroke-width="1.5"/><line x1="${pc}" y1="${beamY}" x2="${pc + pw / 2 - 12}" y2="${panY}" stroke="${C.muted}" stroke-width="1.5"/>`;
    body += `<path d="M${x0} ${panY} L${x0 + pw} ${panY} L${x0 + pw - 16} ${panY + 12} L${x0 + 16} ${panY + 12} Z" fill="${C.line}" stroke="${C.ink}" stroke-width="1.5"/>`;
    const s = 30, g = 4, per = 5, n = items.length, rows = Math.ceil(n / per);
    items.forEach((it, i) => {
      const row = Math.floor(i / per), inRow = Math.min(per, n - row * per), col = i % per, x = pc - (inRow * (s + g) - g) / 2 + col * (s + g), y = panY - (row + 1) * (s + 2);
      if (it.u) body += (it.u === 'B' ? `<circle cx="${x + s / 2}" cy="${y + s / 2}" r="${s / 2}" fill="${UCOL.B}"/>` : `<rect x="${x}" y="${y}" width="${s}" height="${s}" rx="5" fill="${UCOL[it.u] || C.amber}"/>`) + V.text(x + s / 2, y + s / 2, it.u, {size: 16, weight: 700, fill: it.u === 'B' ? C.paper : C.ink});
      else body += `<rect x="${x}" y="${y}" width="${s}" height="${s}" rx="3" fill="${C.teal}"/>` + V.text(x + s / 2, y + s / 2, it.w, {size: it.w >= 10 ? 14 : 16, weight: 700, fill: C.paper});
    });
    return rows;
  };
  pan(cx - arm - pw / 2, left); pan(cx + arm - pw / 2, right);
  // shift everything down if pans are stacked high
  const top = Math.max(0, Math.max(Math.ceil(left.length / 5), Math.ceil(right.length / 5)) * 36 - 40);
  return V.svg(W + 8, 196 + top, `<g transform="translate(4 ${top})">${body}</g>`, 'pan balance');
};
const Bx = (n, u = '?') => Array.from({length: n}, () => ({u}));
const Wt = (...ns) => ns.map(w => ({w}));

/* ---------- II.8.01 Order of operations ---------- */
const orderQ = (R, tpls, gen, o = {}) => {
  const tpl = R.pick(tpls), {s, v} = fill(R, tpl, gen, {max: o.max || 150, ok: (s, v, vals) => brOK(s) && (!o.ok || o.ok(s, v, vals))});
  const wrong = [ev(s, 'flat'), ev(s, 'nob')].concat(o.wrong ? [o.wrong(s)] : []).filter(w => w !== null && w !== v);
  const tk = tok(s); let t = tk, parts = []; while (t.length > 1) { const st = step1(t); parts.push(sp(st.t)); t = st.t; }
  const ex = `${s} = ${parts.join(' = ')}.${o.note ? ' ' + o.note(s) : ''}`;
  if (wrong.length && R.bool(0.45)) return choice(R, `${s} = ?`, v, wrong.concat([v + R.pick([1, 2, 10])]), ex);
  return num(`${s} = ?`, v, ex);
};
E2.skill({ id: 'II.8.01', name: 'Order of operations', steps: {
  a: { t: 'left to right for + and −', g: (R) => orderQ(R, [`a ${M} b + c`, `a + b ${M} c`, `a ${M} b ${M} c`, `a ${M} b + c ${M} d`], (ch, R) => ch === 'a' ? R.int(20, 60) : R.int(2, 19), {ok: s => ev(s.replace(/(\d+ [+−] \d+)$/, '($1)')) !== null, wrong: s => ev(s.replace(/(\d+ [+−] \d+)$/, '($1)')), note: () => `+ and ${M} have equal rank: work left to right.`}) },
  b: { t: '× and ÷ first', g: (R) => orderQ(R, [`a + b ${X} c`, `a ${M} b ${X} c`, `a ${X} b + c`, `a + b ${D} c`, `a ${D} b ${X} c`, `a ${X} b ${D} c`, `a ${M} b ${D} c`], (ch, R, v) => ch === 'a' ? R.int(2, 40) : R.int(2, 9), {ok: (s, v) => s.includes(D) ? true : v > 0, note: s => /÷ \d+ ×/.test(s) ? `${X} and ${D} have equal rank, so go left to right.` : `${X} and ${D} come before + and ${M}.`}) },
  c: { t: 'brackets first', g: (R) => orderQ(R, [`(a + b) ${X} c`, `a ${X} (b ${M} c)`, `(a ${M} b) ${D} c`, `a ${M} (b + c)`, `(a + b) ${X} (c ${M} d)`, `a + (b + c) ${X} d`], (ch, R) => R.int(2, 12), {note: () => `Brackets first.`}) },
  d: { t: 'mixed', g: (R) => orderQ(R, [`a ${M} b ${D} c ${X} (d + e)`, `(a + b) ${X} c ${M} d ${D} e`, `a + b ${X} (c ${M} d) ${D} e`, `a ${X} (b + c) ${M} d ${X} e`, `(a ${M} b) ${X} c + d ${D} e`], (ch, R) => ch === 'a' ? R.int(10, 40) : R.int(2, 9), {max: 200, note: () => `Brackets, then ${X} and ${D} left to right, then + and ${M}.`}) },
}});

/* ---------- II.8.02 Write numerical expressions ---------- */
const WORDS = {
  plain: [
    (a, b, c) => [`Subtract ${b} from ${a}.`, `${a} ${M} ${b}`, [`${b} ${M} ${a}`, `${a} + ${b}`]],
    (a, b, c) => [`Multiply ${a} by ${b}, then add ${c}.`, `${a} ${X} ${b} + ${c}`, [`${a} ${X} (${b} + ${c})`, `${a} + ${b} ${X} ${c}`]],
    (a, b, c) => [`Add ${a} to the product of ${b} and ${c}.`, `${a} + ${b} ${X} ${c}`, [`(${a} + ${b}) ${X} ${c}`, `${a} ${X} ${b} + ${c}`]],
    (a, b, c) => [`Divide ${a * b} by ${b}.`, `${a * b} ${D} ${b}`, [`${b} ${D} ${a * b}`, `${a * b} ${X} ${b}`]],
    (a, b, c) => [`Take ${b} away from ${a + b + c}, then take away ${c}.`, `${a + b + c} ${M} ${b} ${M} ${c}`, [`${a + b + c} ${M} (${b} ${M} ${c})`, `${b} ${M} ${a + b + c} ${M} ${c}`]],
    (a, b, c) => [`Add ${a} and ${b}, then subtract ${c}.`, `${a} + ${b} ${M} ${c}`, [`${a} + (${c} ${M} ${b})`, `${c} ${M} ${a} + ${b}`]],
  ],
  brk: [
    (a, b, c) => [`Twice the sum of ${a} and ${b}.`, `2 ${X} (${a} + ${b})`, [`2 ${X} ${a} + ${b}`, `2 + ${a} + ${b}`]],
    (a, b, c) => [`Add ${a} and ${b}, then multiply by ${c}.`, `(${a} + ${b}) ${X} ${c}`, [`${a} + ${b} ${X} ${c}`, `${a} ${X} ${c} + ${b}`]],
    (a, b, c) => [`Subtract ${b} from ${2 * a + b}, then divide by 2.`, `(${2 * a + b} ${M} ${b}) ${D} 2`, [`${2 * a + b} ${M} ${b} ${D} 2`, `2 ${D} (${2 * a + b} ${M} ${b})`]],
    (a, b, c) => [`${c} times the difference of ${a + b} and ${b}.`, `${c} ${X} (${a + b} ${M} ${b})`, [`${c} ${X} ${a + b} ${M} ${b}`, `${c} ${X} (${b} ${M} ${a + b})`]],
    (a, b, c) => [`Three times the sum of ${a} and ${b}.`, `3 ${X} (${a} + ${b})`, [`3 ${X} ${a} + ${b}`, `3 + ${a} + ${b}`]],
    (a, b, c) => [`Add ${a} and ${b}, then take the total away from ${a + b + c * 5}.`, `${a + b + c * 5} ${M} (${a} + ${b})`, [`${a + b + c * 5} ${M} ${a} + ${b}`, `(${a} + ${b}) ${M} ${a + b + c * 5}`]],
  ],
};
const READ = [
  (a, b, c) => [`${c} ${X} (${a} ${M} ${b})`, `${c} times the difference of ${a} and ${b}`, [`${c} times ${a}, then subtract ${b}`, `${c} times the sum of ${a} and ${b}`, `the difference of ${c} and ${a}, times ${b}`]],
  (a, b, c) => [`(${a} + ${b}) ${D} ${c}`, `the sum of ${a} and ${b}, divided by ${c}`, [`${a} plus the result of ${b} divided by ${c}`, `${c} divided by the sum of ${a} and ${b}`, `the sum of ${a} and ${b}, times ${c}`]],
  (a, b, c) => [`${a} ${M} ${b} ${X} ${c}`, `${a} minus the product of ${b} and ${c}`, [`the difference of ${a} and ${b}, times ${c}`, `${b} times ${c}, minus ${a}`, `${a} minus the sum of ${b} and ${c}`]],
  (a, b, c) => [`2 ${X} (${a} + ${b})`, `twice the sum of ${a} and ${b}`, [`twice ${a}, plus ${b}`, `the sum of 2 and ${a}, times ${b}`, `half the sum of ${a} and ${b}`]],
  (a, b, c) => [`${a} ${X} ${b} + ${c}`, `the product of ${a} and ${b}, plus ${c}`, [`${a} times the sum of ${b} and ${c}`, `${a} plus ${b} times ${c}`, `the sum of ${a} and ${b}, plus ${c}`]],
];
E2.skill({ id: 'II.8.02', name: 'Write numerical expressions', steps: {
  a: { t: 'from words', g: (R) => { const a = R.int(10, 20), [b, c] = R.distinct(2, 9, 2), [w, good, bad] = R.pick(WORDS.plain)(a, b, c);
    return choice(R, `Which expression matches? ${w}`, good, bad, `${w} → ${good}. Its value is ${ev(good)}.`); } },
  b: { t: 'with brackets', g: (R) => { const [a, b, c] = R.distinct(3, 12, 3), [w, good, bad] = R.pick(WORDS.brk)(a, b, c);
    if (R.bool(0.35)) return num(`Write an expression, then find its value. ${w}`, ev(good), `${good} = ${ev(good)}. The brackets make that part happen first.`);
    return choice(R, `Which expression matches? ${w}`, good, bad, `${good}: the brackets show what happens first. Without them, ${bad[0]} = ${ev(bad[0]) === null ? 'something else' : ev(bad[0])}, not ${ev(good)}.`); } },
  c: { t: 'compare without computing', g: (R) => { const a = R.int(120, 480), b = R.int(15, 95), k = R.int(0, 4);
    const pr = (L, Rt) => `Without working them out, compare: ${L} &nbsp;?&nbsp; ${Rt}`;
    if (k === 0) { const m = R.int(2, 9), sw = R.bool(); const L = `${m} ${X} (${a} + ${b})`, Rt = `${a} + ${b}`;
      return choiceFixed(pr(sw ? Rt : L, sw ? L : Rt), SYM, sw ? 0 : 2, `${L} is ${m} times as large as ${Rt}.`); }
    if (k === 1) { const m = R.int(2, 9); return choiceFixed(pr(`(${a} + ${b}) ${X} ${m}`, `(${b} + ${a}) ${X} ${m}`), SYM, 1, `${a} + ${b} and ${b} + ${a} are equal, so both sides are equal.`); }
    if (k === 2) { const [m, n] = R.distinct(2, 9, 2); return choiceFixed(pr(`(${a} ${M} ${b}) ${X} ${m}`, `(${a} ${M} ${b}) ${X} ${n}`), SYM, m < n ? 0 : 2, `Same number in brackets, times ${m} or times ${n}: ${m < n ? 'the right' : 'the left'} side is larger.`); }
    if (k === 3) { const m = R.int(12, 48); return choiceFixed(pr(`${m} ${X} ${b}`, `${m} ${X} ${b + 1}`), SYM, 0, `${m} ${X} ${b + 1} is one more group of ${m} than ${m} ${X} ${b}.`); }
    const m = R.int(2, 9); return num(`${m} ${X} (${a} + ${b}) is how many times as large as ${a} + ${b}?`, m, `${m} ${X} (${a} + ${b}) means ${m} groups of (${a} + ${b}).`); } },
  d: { t: 'read one aloud', g: (R) => { const [a, b, c] = [R.int(10, 20), R.int(2, 9), R.int(2, 9)], [e, good, bad] = R.pick(READ)(a, b, c);
    return choice(R, `Which words match ${e}?`, good, bad, `${e}: ${good}.`); } },
}});

/* ---------- II.8.03 Evaluate expressions ---------- */
const evalQ = (R, tpls, gen, o = {}) => orderQ(R, tpls, gen, o);
E2.skill({ id: 'II.8.03', name: 'Evaluate expressions', steps: {
  a: { t: 'two operations', g: (R) => evalQ(R, [`a + b ${X} c`, `a ${X} b ${M} c`, `a ${D} b + c`, `a ${M} b ${D} c`, `a ${X} b + c`], (ch, R) => ch === 'a' ? R.int(6, 40) : R.int(2, 9), {ok: (s, v) => v > 0}) },
  b: { t: 'three', g: (R) => evalQ(R, [`a + b ${X} c ${M} d`, `a ${X} b ${M} c ${D} d`, `a ${M} b + c ${X} d`, `a ${D} b + c ${X} d`, `a + b ${D} c ${X} d`], (ch, R) => ch === 'a' ? R.int(6, 60) : R.int(2, 9), {ok: (s, v) => v > 0}) },
  c: { t: 'with brackets', g: (R) => evalQ(R, [`a ${X} (b + c ${X} d)`, `(a + b) ${X} c ${M} d`, `a ${M} (b ${M} c) ${X} d`, `(a ${M} b ${X} c) ${D} d`, `a + (b + c) ${D} d`], (ch, R) => ch === 'a' ? R.int(2, 40) : R.int(2, 9), {max: 200, ok: (s, v) => v > 0, note: s => /\(\d+ [+−] \d+ ×/.test(s) ? `Inside brackets, × still comes first.` : ''}) },
  d: { t: 'find the mistake', g: (R) => {
    const tpl = R.pick([`a + b ${X} (c ${M} d)`, `a ${X} (b + c ${X} d)`, `(a + b) ${X} c ${M} d`, `a ${M} b ${X} c + d`, `a + b ${X} c ${M} d`, `a ${D} b ${X} c + d`]);
    const gen = (ch, R) => ch === 'a' ? R.int(8, 40) : R.int(2, 9);
    for (let tries = 0; tries < 300; tries++) {
      const {s, v} = fill(R, tpl, gen, {max: 300, ok: (s, v) => v > 0});
      const steps = []; let t = tok(s); while (t.length > 1) { const st = step1(t); steps.push(st); t = st.t; }
      if (steps.length !== 3) continue;
      const k = R.int(0, 2), before = k ? steps[k - 1].t : tok(s);
      let wrongT, why;
      const fl = step1(before, 'flat');
      if (fl.op !== steps[k].op && okN(fl.v) && R.bool(0.7)) { wrongT = fl.t; why = `Step ${k + 1} works out ${fl.op} first, but ${steps[k].op.includes(X) || steps[k].op.includes(D) ? `${steps[k].op.split(' ')[1]} comes before + and ${M}` : 'you go left to right'}: it should be ${steps[k].op} = ${steps[k].v}.`; }
      else { const slip = steps[k].v + R.pick([1, -1, 2, 10, -10]); if (slip < 0) continue; wrongT = steps[k].t.map((x, i) => i === steps[k].idx ? String(slip) : x);
        if (sp(wrongT) === sp(steps[k].t)) continue; why = `Step ${k + 1}: ${steps[k].op} = ${steps[k].v}, not ${slip}.`; }
      const lines = steps.slice(0, k).map(st => st.t); let cur = wrongT, bad = false; lines.push(cur);
      while (cur.length > 1) { const st = step1(cur); if (!okN(st.v)) { bad = true; break; } cur = st.t; lines.push(cur); }
      if (bad || lines.length !== 3 || +cur[0] === v) continue;
      const N = R.pick(NAMES);
      return choiceFixed(`${N} worked out ${s}:<br>Step 1: = ${sp(lines[0])}<br>Step 2: = ${sp(lines[1])}<br>Step 3: = ${sp(lines[2])}<br>Which step has the first mistake?`, ['Step 1', 'Step 2', 'Step 3'], k, `${why} The answer is ${v}.`);
    }
    throw new Error('mistake gen'); } },
}});

/* ---------- II.8.04 Number patterns and rules ---------- */
const seqRule = R => { const t = R.int(0, 3);
  if (t === 0 || t === 3) { const d = R.int(2, 12), s = R.int(1, 20); return {terms: n => s + d * n, name: `add ${d}`, bad: [`add ${d + 1}`, `multiply by ${Math.max(2, Math.round((s + d) / s))}`, `add ${s}`], d, s, kind: 'add'}; }
  if (t === 1) { const m = R.int(2, 3), s = R.int(1, 5); return {terms: n => s * m ** n, name: `multiply by ${m}`, bad: [`add ${s * (m - 1)}`, `add ${s * m}`, `multiply by ${m + 1}`], m, s, kind: 'mul'}; }
  const d = R.int(2, 9), s = R.int(5 * d, 99); return {terms: n => s - d * n, name: `subtract ${d}`, bad: [`add ${d}`, `subtract ${d + 1}`, `divide by ${d}`], d, s, kind: 'sub'};
};
E2.skill({ id: 'II.8.04', name: 'Number patterns and rules', steps: {
  a: { t: 'find the rule', g: (R) => { const q = seqRule(R), ts = [0, 1, 2, 3].map(q.terms);
    return choice(R, `${ts.join(', ')}, … What is the rule?`, q.name, q.bad.filter(b => b !== q.name), `Check every step: ${ts.slice(0, 3).map((x, i) => `${x} → ${ts[i + 1]}`).join(', ')}. The rule is ${q.name}.`); } },
  b: { t: 'extend it', g: (R) => { const q = seqRule(R), ts = [0, 1, 2, 3].map(q.terms);
    if (q.kind === 'add' && R.bool(0.4)) { const t10 = q.terms(9);
      return num(`${ts.join(', ')}, … The rule is add ${q.d}. What is the 10th term?`, t10, `From the 1st term to the 10th is 9 jumps of ${q.d}: ${q.s} + 9 ${X} ${q.d} = ${t10}, not 10 ${X} ${q.d}.`); }
    return num(`${ts.join(', ')}, ?, ? &nbsp;Find the next two terms.`, [{ans: q.terms(4)}, {ans: q.terms(5)}], `The rule is ${q.name}: ${q.terms(4)}, then ${q.terms(5)}.`); } },
  c: { t: 'two patterns side by side', g: (R) => { const p = R.int(2, 6), k = R.int(2, 4), q = p * k, A = [0, 1, 2, 3, 4].map(i => i * p), B = [0, 1, 2, 3, 4].map(i => i * q), t = R.int(0, 2);
    const pr = `Pattern A: start at 0, add ${p}. Pattern B: start at 0, add ${q}.`;
    const vis = V8.table(A.map((a, i) => [a, B[i]]), {head: ['A', 'B']});
    if (t === 0) return num(`${pr} Each term in B is how many times the matching term in A?`, k, `${A[2]} → ${B[2]}, ${A[3]} → ${B[3]}: each B term is ${k} times the A term, because ${q} = ${k} ${X} ${p}.`, {visual: vis});
    if (t === 1) return choice(R, `${pr} How are the terms related?`, `B is ${k} times A`, [`B is A + ${q - p}`, `B is A + ${q}`, `A is ${k} times B`], `${A[1]} → ${B[1]}, ${A[2]} → ${B[2]}: always ${k} times, not a fixed amount more.`, {visual: vis});
    const n = R.int(6, 9); return num(`${pr} What is term ${n} of each? (Term 1 is 0.)`, [{label: 'A', ans: (n - 1) * p}, {label: 'B', ans: (n - 1) * q}], `Term ${n} is ${n - 1} jumps from 0: A = ${n - 1} ${X} ${p} = ${(n - 1) * p}, B = ${n - 1} ${X} ${q} = ${(n - 1) * q}.`); } },
  d: { t: 'pairs from two patterns', g: (R) => { const p = R.int(2, 6), k = R.int(2, 4), q = p * k, n = R.int(3, 4), prs = Array.from({length: n}, (_, i) => `(${i * p}, ${i * q})`), t = R.int(0, 1);
    const pr = `A starts at 0 and adds ${p}. B starts at 0 and adds ${q}. Pairs (A, B): ${prs.join(', ')}, …`;
    if (t === 0) return num(`${pr} What is the next pair?`, [{label: 'A', ans: n * p}, {label: 'B', ans: n * q}], `Add ${p} to A and ${q} to B: (${n * p}, ${n * q}). B is always ${k} times A.`);
    const m = R.int(n + 1, 8), good = `(${m * p}, ${m * q})`;
    return choice(R, `${pr} Which pair will also appear?`, good, [`(${m * q}, ${m * p})`, `(${m * p}, ${m * p + q})`, `(${m * p}, ${(m + 1) * q})`], `In every pair B is ${k} times A: ${m * q} = ${k} ${X} ${m * p}.`); } },
}});

/* ---------- II.8.05 Input–output tables ---------- */
const RULE1 = R => { const t = R.int(0, 2); if (t === 0) { const m = R.int(2, 9); return {s: `${X} ${m}`, f: x => x * m, inv: y => y / m, iv: `${D} ${m}`}; }
  if (t === 1) { const k = R.int(3, 25); return {s: `+ ${k}`, f: x => x + k, inv: y => y - k, iv: `${M} ${k}`}; }
  const k = R.int(2, 9); return {s: `${M} ${k}`, f: x => x - k, inv: y => y + k, iv: `+ ${k}`, lo: k + 1}; };
E2.skill({ id: 'II.8.05', name: 'Input–output tables', steps: {
  a: { t: 'find the output', g: (R) => { const r = RULE1(R), ins = R.distinct(r.lo || 1, 12, 3), ask = R.int(0, 2), rows = ins.map((x, i) => [x, i === ask ? '?' : r.f(x)]);
    return num(`Rule: ${r.s}. What is the missing output?`, r.f(ins[ask]), `${ins[ask]} ${r.s} = ${r.f(ins[ask])}.`, {visual: V8.table(rows)}); } },
  b: { t: 'find the rule', g: (R) => { for (;;) { const r = RULE1(R), ins = R.distinct(Math.max(2, r.lo || 1), 10, 3).sort((a, b) => a - b), outs = ins.map(r.f), x = ins[0], y = outs[0];
      const cands = [`+ ${y - x}`, `${X} ${y / x}`, `${X} ${Math.round(y / x) + 1}`, `+ ${y - x + 1}`, `${M} ${x - y}`].filter(s => !/-|\.|NaN|Infinity|[+−] 0$|× [01]$/.test(s));
      const fits = s => { const [op, n] = s.split(' '); return ins.every((xx, i) => ap(xx, op === '+' ? '+' : op, +n) === outs[i]); };
      const ds = cands.filter(s => s !== r.s && !fits(s));
      if (ds.length < 2) continue;
      return choice(R, `Which rule fits every column of the table?`, `${r.s}`, ds.slice(0, 3), `Check all columns: ${ins.map((xx, i) => `${xx} ${r.s} = ${outs[i]}`).join(', ')}. A rule has to work for every input, not just the first.`, {visual: V8.table(ins.map((xx, i) => [xx, outs[i]]))}); } } },
  c: { t: 'find the input', g: (R) => { const r = RULE1(R), ins = R.distinct(r.lo || 1, 12, 3), ask = R.int(0, 2), rows = ins.map((x, i) => [i === ask ? '?' : x, r.f(x)]);
    return num(`Rule: ${r.s}. What is the missing input?`, ins[ask], `Undo the rule: ${r.f(ins[ask])} ${r.iv} = ${ins[ask]}.`, {visual: V8.table(rows)}); } },
  d: { t: 'two-step rules', g: (R) => { const m = R.int(2, 5), k = R.int(1, 9), f = x => x * m + k, rs = `${X} ${m}, then + ${k}`, t = R.int(0, 2);
    if (t === 0) { const x = R.int(2, 12); return num(`Rule: ${rs}. Input ${x}. What is the output?`, f(x), `${x} ${X} ${m} = ${x * m}, then + ${k} = ${f(x)}.`); }
    const x = R.int(2, 12), y = f(x);
    const ex = `Undo in reverse order: ${y} ${M} ${k} = ${y - k}, then ${y - k} ${D} ${m} = ${x}.`;
    if (t === 1) return num(`Rule: ${rs}. The output is ${y}. What was the input?`, x, ex, {visual: V8.table([[x + (x > 6 ? -R.int(2, 4) : R.int(2, 5)), 0], ['?', y]].map(([i, o]) => [i, i === '?' ? o : f(i)]))});
    const wrong = y % m === 0 && y / m - k >= 0 ? y / m - k : null, ds = [y - k, x + 1]; if (wrong !== null) ds.unshift(wrong);
    return choice(R, `Rule: ${rs}. The output is ${y}. What was the input?`, x, ds, ex + (wrong !== null ? ` Not ${y} ${D} ${m} ${M} ${k}.` : '')); } },
}});

/* ---------- II.8.06 Missing numbers ---------- */
E2.skill({ id: 'II.8.06', name: 'Missing numbers', steps: {
  a: { t: 'in additions', g: (R) => { const a = R.int(8, 60), b = R.int(5, 39), c = a + b, t = R.int(0, 2);
    if (t === 0) return num(`${a} + ? = ${c}`, b, `${c} ${M} ${a} = ${b}.`);
    if (t === 1) return num(`? + ${b} = ${c}`, a, `${c} ${M} ${b} = ${a}.`);
    return num(`${c} = ${a} + ?`, b, `${c} ${M} ${a} = ${b}.`); } },
  b: { t: 'in multiplications', g: (R) => { const a = R.int(2, 12), b = R.int(2, 12), c = a * b, t = R.int(0, 2);
    if (t === 0) return num(`${a} ${X} ? = ${c}`, b, `${c} ${D} ${a} = ${b}.`);
    if (t === 1) return num(`? ${X} ${b} = ${c}`, a, `${c} ${D} ${b} = ${a}.`);
    return num(`${c} = ${a} ${X} ?`, b, `${c} ${D} ${a} = ${b}.`); } },
  c: { t: 'in any position', g: (R) => { const t = R.int(0, 4);
    if (t === 0) { const c = R.int(20, 90), b = R.int(3, c - 5), a = c - b; // c − ? = a
      if (R.bool()) return choice(R, `${c} ${M} ? = ${a}`, b, [c + a, a, b + 1], `? is the amount taken away: ${c} ${M} ${a} = ${b}. Check: ${c} ${M} ${b} = ${a}.`);
      return num(`${c} ${M} ? = ${a}`, b, `${c} ${M} ${a} = ${b}. Check: ${c} ${M} ${b} = ${a}.`); }
    if (t === 1) { const a = R.int(5, 40), b = R.int(3, 40); return num(`? ${M} ${a} = ${b}`, a + b, `Add back: ${b} + ${a} = ${a + b}.`); }
    if (t === 2) { const a = R.int(2, 9), b = R.int(2, 12); return num(`? ${D} ${a} = ${b}`, a * b, `${b} ${X} ${a} = ${a * b}.`); }
    if (t === 3) { const a = R.int(2, 9), b = R.int(2, 12); return num(`${a * b} ${D} ? = ${b}`, a, `${b} ${X} ${a} = ${a * b}, so ${a * b} ${D} ${a} = ${b}.`); }
    const a = R.int(2, 12), b = R.int(2, 12); return num(`${a * b} = ? ${X} ${b}`, a, `${a * b} ${D} ${b} = ${a}.`); } },
  d: { t: 'with a box for the unknown', g: (R) => { const x = R.int(2, 12), t = R.int(0, 4), a = R.int(2, 6), k = R.int(1, 15);
    if (t === 0) return num(`${a} ${X} ${BOX} + ${k} = ${a * x + k}. What is ${BOX}?`, x, `Take away ${k}: ${a} ${X} ${BOX} = ${a * x}. Then ${a * x} ${D} ${a} = ${x}.`);
    if (t === 1) return num(`${BOX} + ${BOX} + ${k} = ${2 * x + k}. What is ${BOX}?`, x, `${2 * x + k} ${M} ${k} = ${2 * x}, and two equal boxes make ${2 * x}, so ${BOX} = ${x}.`);
    if (t === 2) { const kk = Math.min(k, a * x - 1); return num(`${a} ${X} ${BOX} ${M} ${kk} = ${a * x - kk}. What is ${BOX}?`, x, `Add back ${kk}: ${a} ${X} ${BOX} = ${a * x}, so ${BOX} = ${x}.`); }
    if (t === 3) return num(`(${BOX} + ${k}) ${X} ${a} = ${(x + k) * a}. What is ${BOX}?`, x, `${(x + k) * a} ${D} ${a} = ${x + k}, then ${x + k} ${M} ${k} = ${x}.`);
    return num(`${BOX} ${D} ${a} + ${k} = ${x + k}. What is ${BOX}?`, a * x, `Take away ${k}: ${BOX} ${D} ${a} = ${x}. So ${BOX} = ${x} ${X} ${a} = ${a * x}.`); } },
}});

/* ---------- II.8.07 Equivalent expressions ---------- */
E2.skill({ id: 'II.8.07', name: 'Equivalent expressions', steps: {
  a: { t: '3 × 4 + 3 × 2 = 3 × 6', g: (R) => { const a = R.int(2, 9), [b, c] = R.distinct(2, 12, 2).sort((p, q) => q - p), t = R.int(0, 2);
    if (t === 0) return num(`${a} ${X} ${b} + ${a} ${X} ${c} = ${a} ${X} ?`, b + c, `${b} groups of ${a} and ${c} more groups of ${a} make ${b + c} groups: ${a} ${X} ${b + c}.`);
    if (t === 1) return num(`${a} ${X} (${b} + ${c}) = ${a} ${X} ${b} + ${a} ${X} ?`, c, `${a} multiplies both parts: ${a} ${X} ${b} + ${a} ${X} ${c}.`);
    return num(`${a} ${X} ${b} ${M} ${a} ${X} ${c} = ${a} ${X} ?`, b - c, `${b} groups of ${a} take away ${c} groups leaves ${b - c} groups: ${a} ${X} ${b - c}.`); } },
  b: { t: 'regroup', g: (R) => { const t = R.int(0, 2);
    if (t === 0) { const [p, q] = R.pick([[25, 4], [5, 2], [50, 2], [20, 5], [4, 25], [2, 50], [5, 20], [2, 5], [125, 8]]), a = R.int(3, 19);
      return num(`${p} ${X} ${q} ${X} ${a} = ? ${X} ${a}`, p * q, `Group the easy pair first: ${p} ${X} ${q} = ${p * q}, so ${p * q} ${X} ${a} = ${p * q * a}.`); }
    if (t === 1) { const a = R.int(11, 89), cc = (Math.ceil(a / 10) * 10 + R.pick([0, 10, 20])) - a || 10, b = R.int(12, 79); // never '+ 0'
      return num(`Regroup to add: ${a} + ${b} + ${cc} = ?`, a + b + cc, `(${a} + ${cc}) + ${b} = ${a + cc} + ${b} = ${a + b + cc}.`); }
    const [a, b, c] = [R.int(2, 9), R.int(2, 9), R.int(2, 9)];
    return choice(R, `Which is equal to (${a} ${X} ${b}) ${X} ${c}?`, `${a} ${X} (${b} ${X} ${c})`, [`${a} + (${b} ${X} ${c})`, `(${a} ${X} ${b}) + ${c}`, `${a} ${X} (${b} + ${c})`], `You can group factors either way: both are ${a * b * c}.`); } },
  c: { t: 'true or false', g: (R) => { const a = R.int(2, 9), b = R.int(10, 30), c = R.int(2, 9), t = R.int(0, 8);
    const S = [
      [`${a} ${X} (${b} + ${c}) = ${a} ${X} ${b} + ${c}`, false, `${a} multiplies both parts: ${a} ${X} ${b} + ${a} ${X} ${c} = ${a * (b + c)}, not ${a * b + c}.`],
      [`${a} ${X} (${b} + ${c}) = ${a} ${X} ${b} + ${a} ${X} ${c}`, true, `Both are ${a * (b + c)}.`],
      [`${a} ${X} ${b} = ${b} ${X} ${a}`, true, `You can multiply in either order: both are ${a * b}.`],
      [`${b} ${M} ${a} = ${a} ${M} ${b}`, false, `Order matters in subtraction: ${b} ${M} ${a} = ${b - a}, but ${a} ${M} ${b} is not.`],
      [`(${b + 20} ${M} ${b}) ${M} ${c} = ${b + 20} ${M} (${b} ${M} ${c})`, false, `Left: ${20 - c}. Right: ${b + 20} ${M} ${b - c} = ${20 + c}. Subtraction can't be regrouped.`],
      [`(${b} + ${a}) + ${c} = ${b} + (${a} + ${c})`, true, `Addition can be grouped either way: both are ${a + b + c}.`],
      [`${a * c * 4} ${D} ${2 * c} ${D} 2 = ${a * c * 4} ${D} (${2 * c} ${D} 2)`, false, `Left: ${a * c * 4 / (2 * c) / 2}. Right: ${a * c * 4} ${D} ${c} = ${a * 4}. Division can't be regrouped.`],
      [`${a} ${X} ${b} ${X} ${c} = ${a} ${X} (${b} ${X} ${c})`, true, `Multiplication can be grouped either way: both are ${a * b * c}.`],
      [`${a} ${X} ${b} ${M} ${a} ${X} ${c} = ${a} ${X} (${b} ${M} ${c})`, true, `Both are ${a * (b - c)}: ${b} groups of ${a} take away ${c} groups.`],
    ][t];
    return tf(`True or false? ${S[0]}`, S[1], S[2]); } },
  d: { t: 'explain why', g: (R) => { const [a, c] = R.distinct(2, 9, 2), b = R.int(10, 14), t = R.int(0, 3);
    if (t === 0) return choice(R, `Why does ${a} ${X} (${b} + ${c}) equal ${a} ${X} ${b} + ${a} ${X} ${c}?`, `${a} groups of ${b + c} is ${a} groups of ${b} plus ${a} groups of ${c}.`, [`You can always drop the brackets.`, `Both sides use the same numbers.`, `Multiplying is the same as adding.`], `Split each group of ${b + c} into ${b} and ${c}: ${a * b} + ${a * c} = ${a * (b + c)}.`);
    if (t === 1) return choice(R, `Why is ${a} ${X} (${b} + ${c}) NOT equal to ${a} ${X} ${b} + ${c}?`, `${a} must multiply the ${c} too; ${a} ${X} ${c} is missing.`, [`Brackets never change the answer.`, `Addition must be done last.`, `${a} ${X} ${b} + ${c} is bigger.`], `${a} ${X} (${b} + ${c}) = ${a * (b + c)}, but ${a} ${X} ${b} + ${c} = ${a * b + c}.`);
    if (t === 2) { const [p, q] = R.pick([[25, 4], [5, 2], [50, 2], [20, 5]]);
      return choice(R, `Why does ${p} ${X} ${a} ${X} ${q} equal ${p * q} ${X} ${a}?`, `Factors can be multiplied in any order and grouped any way, so group ${p} ${X} ${q} first.`, [`You can add ${p} and ${q} instead.`, `Only the first two numbers are multiplied.`, `${a} can be left out.`], `${p} ${X} ${q} = ${p * q}, and ${p * q} ${X} ${a} = ${p * q * a}.`); }
    const B = b + 20; return choice(R, `Why is (${B} ${M} ${b}) ${M} ${c} not equal to ${B} ${M} (${b} ${M} ${c})?`, `In the second, you take away ${b} ${M} ${c}, which is less than ${b}, so more is left.`, [`Subtraction can be grouped any way.`, `The numbers are in a different order.`, `Brackets only matter with ${X}.`], `(${B} ${M} ${b}) ${M} ${c} = ${20 - c}, but ${B} ${M} ${b - c} = ${20 + c}.`); } },
}});

/* ---------- II.8.08 Problems to expressions ---------- */
const P1 = [
  (R) => { const a = R.int(6, 12), b = R.int(3, 9); if (a === b) return P1[0](R); return [`A box holds ${a} eggs. How many eggs are in ${b} boxes?`, `${b} ${X} ${a}`, [`${b} + ${a}`, `${a} ${M} ${b}`, `${a} ${D} ${b}`]]; },
  (R) => { const b = R.int(3, 9), q = R.int(3, 9); return [`${b * q} stickers are shared equally by ${b} kids. How many does each get?`, `${b * q} ${D} ${b}`, [`${b * q} ${M} ${b}`, `${b * q} ${X} ${b}`, `${b} ${D} ${b * q}`]]; },
  (R) => { const a = R.int(20, 60), b = R.int(3, 19); return [`There are ${a} apples. ${b} are eaten. How many are left?`, `${a} ${M} ${b}`, [`${a} + ${b}`, `${b} ${M} ${a}`, `${a} ${D} ${b}`]]; },
  (R) => { const a = R.int(10, 40), b = R.int(10, 40); return [`A jar has ${a} red and ${b} blue marbles. How many marbles?`, `${a} + ${b}`, [`${a} ${X} ${b}`, `${a} ${M} ${b}`.replace(`${a} ${M} ${b}`, a >= b ? `${a} ${M} ${b}` : `${b} ${M} ${a}`), `${a} ${D} ${b}`]]; },
];
const P2 = [
  (R) => { const a = R.int(3, 9), b = R.int(3, 8), c = R.int(1, 5); return [`${a} tables have ${b} chairs each. Then ${c} chairs are taken away. How many chairs are left?`, `${a} ${X} ${b} ${M} ${c}`, [`${a} ${X} (${b} ${M} ${c})`, `${a} + ${b} ${M} ${c}`, `${a} ${X} ${b} + ${c}`]]; },
  (R) => { const a = R.int(2, 8), b = R.int(5, 12), c = a === 9 ? 1 : R.pick([1, 2, 3, 4, 5, 6, 7, 8, 9].filter(x => x !== a)); return [`${R.pick(NAMES)} has ${a} packs of ${b} cards and ${c} loose cards. How many cards?`, `${a} ${X} ${b} + ${c}`, [`${a} ${X} (${b} + ${c})`, `${a} + ${b} + ${c}`, `${a} + ${b} ${X} ${c}`]]; },
  (R) => { const b = R.int(2, 6), q = R.int(4, 9), c = R.int(1, 3); return [`${b * q} cookies are shared equally by ${b} kids. Each kid eats ${c}. How many does each kid have left?`, `${b * q} ${D} ${b} ${M} ${c}`, [`${b * q} ${D} (${b} ${M} ${c})`, `${b * q} ${M} ${b} ${M} ${c}`, `${b * q} ${D} ${b} + ${c}`]]; },
  (R) => { const a = R.int(25, 50), b = R.int(3, 6), c = R.int(2, 4); return [`A bus has ${a} people. At a stop, ${c} groups of ${b} get off. How many are left?`, `${a} ${M} ${c} ${X} ${b}`, [`(${a} ${M} ${c}) ${X} ${b}`, `${a} ${M} ${c} + ${b}`, `${c} ${X} ${b} ${M} ${a}`]]; },
];
const P3 = [
  (R, O) => { const a = R.int(2, 5), b = R.int(2, 6), p = R.int(3, 9); return [`${a} adults and ${b} children buy tickets at ${money(O, p)} each. What is the total cost?`, `(${a} + ${b}) ${X} ${p}`, [`${a} + ${b} ${X} ${p}`, `${a} ${X} ${p} + ${b}`, `${a} + ${b} + ${p}`]]; },
  (R) => { const t = R.int(3, 8), g = R.int(2, 6), a = R.int(2, t * g - 2), b = t * g - a; return [`${a} boys and ${b} girls make teams of ${g}. How many teams?`, `(${a} + ${b}) ${D} ${g}`, [`${a} + ${b} ${D} ${g}`, `${a} ${D} ${g} + ${b}`, `(${a} + ${b}) ${X} ${g}`]]; },
  (R, O) => { const p = R.int(8, 20), d = R.int(1, 5), n = R.int(2, 6); return [`A shirt costs ${money(O, p)}, but is ${money(O, d)} off today. What do ${n} shirts cost?`, `(${p} ${M} ${d}) ${X} ${n}`, [`${p} ${M} ${d} ${X} ${n}`, `${p} ${X} ${n} ${M} ${d}`, `(${p} + ${d}) ${X} ${n}`]]; },
  (R) => { const a = R.int(3, 9), b = R.int(3, 9), k = R.int(2, 5); return [`A box has ${a} red and ${b} blue pens. How many pens in ${k} boxes?`, `${k} ${X} (${a} + ${b})`, [`${k} ${X} ${a} + ${b}`, `${k} + ${a} + ${b}`, `${k} ${X} ${a} ${X} ${b}`]]; },
];
E2.skill({ id: 'II.8.08', name: 'Problems to expressions', steps: {
  a: { t: 'one step', g: (R) => { const [p, good, bad] = R.pick(P1)(R); return choice(R, `${p} Which expression fits?`, good, bad, `${good} = ${ev(good)}.`); } },
  b: { t: 'two steps', g: (R) => { const [p, good, bad] = R.pick(P2)(R); return choice(R, `${p} Which expression fits?`, good, bad, `${good} = ${ev(good)}: ${good.includes('(') ? '' : `${X} and ${D} happen before + and ${M}, so no brackets are needed.`}`); } },
  c: { t: 'with brackets', g: (R, O) => { const [p, good, bad] = R.pick(P3)(R, O); return choice(R, `${p} Which expression fits?`, good, bad, `The story groups them first, so use brackets: ${good} = ${ev(good)}.${ev(bad[0]) !== null ? ` Without brackets, ${bad[0]} = ${ev(bad[0])}.` : ''}`); } },
  d: { t: 'solve', g: (R, O) => { const [p, good] = R.bool() ? R.pick(P2)(R) : R.pick(P3)(R, O); return num(`${p} Write one expression and solve it.`, ev(good), `${good} = ${ev(good)}.`); } },
}});

/* ---------- II.8.09 Balance puzzles ---------- */
E2.skill({ id: 'II.8.09', name: 'Balance puzzles', steps: {
  a: { t: 'a pan balance', g: (R) => { const x = R.int(2, 12), k = R.int(1, 9), tot = x + k, split = R.bool(0.4) && tot > 4, r = split ? R.int(1, tot - 1) : tot;
    const right = split ? Wt(r, tot - r) : Wt(tot);
    return num(`The pans balance. What does the box weigh?`, x, `The right side weighs ${tot}. Take ${k} off both sides: box = ${tot} ${M} ${k} = ${x}.`, {visual: V8.balance(Bx(1).concat(Wt(k)), right)}); } },
  b: { t: 'find the weight', g: (R) => { const n = R.int(2, 4), x = R.int(2, 9), k = R.int(0, 9), tot = n * x + k;
    return num(`The pans balance. All the boxes weigh the same. What does one box weigh?`, x, k ? `Take ${k} off both sides: ${n} boxes = ${tot - k}. Then share: ${tot - k} ${D} ${n} = ${x}.` : `${n} boxes = ${tot}, so one box = ${tot} ${D} ${n} = ${x}.`, {visual: V8.balance(Bx(n).concat(k ? Wt(k) : []), Wt(tot))}); } },
  c: { t: 'two unknowns', g: (R) => { const t = R.int(0, 1);
    if (t === 0) { const m = R.int(2, 3), a = R.int(2, 8), b = m * a;
      return num(`Both balances are level. What do A and B each weigh?`, [{label: 'A', ans: a}, {label: 'B', ans: b}], `The top balance shows B = ${m} A's. So A + B = ${m + 1} A's = ${a + b}, and A = ${a}, B = ${b}.`, {visual: V.stack([V8.balance(Bx(m, 'A'), Bx(1, 'B')), V8.balance(Bx(1, 'A').concat(Bx(1, 'B')), Wt(a + b))])}); }
    const b = R.int(2, 8), d = R.int(1, 6), a = b + d;
    return num(`Both balances are level. What do A and B each weigh?`, [{label: 'A', ans: a}, {label: 'B', ans: b}], `A = B + ${d}. So A + B = 2 B's + ${d} = ${a + b}. 2 B's = ${a + b - d}, B = ${b}, A = ${a}.`, {visual: V.stack([V8.balance(Bx(1, 'A'), Bx(1, 'B').concat(Wt(d))), V8.balance(Bx(1, 'A').concat(Bx(1, 'B')), Wt(a + b))])}); } },
  d: { t: 'record as an equation', g: (R) => { const n = R.int(2, 4), x = R.int(2, 9), k = R.int(1, 9), tot = n * x + k;
    const vis = V8.balance(Bx(n).concat(Wt(k)), Wt(tot)), good = `${n} ${X} ${BOX} + ${k} = ${tot}`;
    if (R.bool(0.65)) return choice(R, `Each box weighs ${BOX}. Which equation matches the balance?`, good, [`${n} + ${BOX} + ${k} = ${tot}`, `${n} ${X} ${BOX} = ${tot} + ${k}`, `${BOX} + ${k} = ${tot}`], `${n} boxes and ${k} on the left, ${tot} on the right: ${good}.`, {visual: vis});
    return num(`Each box weighs ${BOX}. Write an equation for the balance and solve it. What is ${BOX}?`, x, `${good}. Take ${k} from both sides: ${n} ${X} ${BOX} = ${tot - k}. Divide both sides by ${n}: ${BOX} = ${x}.`, {visual: vis}); } },
}});
})();

/* Era II · Unit II.9 Measurement & geometry (II.9.01 – II.9.20)
   Unit helpers live in V9 (drawing) and small local functions. */
(function(){ const {frac, fh, fmt, V, C} = E2;
const dots = q => { q.prompt = q.prompt.replace(/\.\./g, '.'); q.explain = q.explain.replace(/\.\./g, '.'); return q; };
const num = (...a) => dots(E2.num(...a)), choice = (...a) => dots(E2.choice(...a)), choiceFixed = (...a) => dots(E2.choiceFixed(...a)), tf = (...a) => dots(E2.tf(...a));
const X = '×', M = '−', DEG = '°';
const P1 = v => Math.round(v * 10) / 10;
const rad = d => d * Math.PI / 180;
const again = (id, k, R, O) => E2.byId[id].steps[k].g(R, O);
const yn = (p, yes, e, x) => choiceFixed(p, ['Yes', 'No'], yes ? 0 : 1, e, x);
const metric = O => O.units !== 'imperial';
const UL = O => metric(O) ? {s: 'cm', b: 'm'} : {s: 'in', b: 'ft'};   // small / big length unit
const money = (O, n) => O.coins === 'THB' ? `${fmt(n)} baht` : `$${fmt(n)}`;
const pad2 = n => (n < 10 ? '0' : '') + n;
// time of day from minutes after midnight
const tod = (O, t) => { t = ((t % 1440) + 1440) % 1440; const H = Math.floor(t / 60), m = t % 60;
  return O.clock === '24h' ? `${pad2(H)}:${pad2(m)}` : `${(H % 12) || 12}:${pad2(m)} ${H < 12 ? 'a.m.' : 'p.m.'}`; };
const hm = d => d >= 60 ? `${Math.floor(d / 60)} h${d % 60 ? ' ' + (d % 60) + ' min' : ''}` : `${d} min`;

/* =================== V9: drawing helpers =================== */
const V9 = {};
// fit model points (y up) into a box of maxW × maxH
function fit(pts, maxW, maxH, pad = 30, padX) {
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]), px = padX === undefined ? pad : padX;
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const s = Math.min((maxW - 2 * px) / Math.max(x1 - x0, 1e-9), (maxH - 2 * pad) / Math.max(y1 - y0, 1e-9));
  return {s, W: P1((x1 - x0) * s + 2 * px), H: P1((y1 - y0) * s + 2 * pad), T: p => [P1(px + (p[0] - x0) * s), P1(pad + (y1 - p[1]) * s)]};
}
const pip = (x, y, P) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, yi] = P[i], [xj, yj] = P[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
const unit = (a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1; return [dx / L, dy / L]; };
const lab = (x, y, s, o = {}) => V.text(P1(x), P1(y), s, Object.assign({size: 15, weight: 600}, o));
// tick marks (k of them) across the segment A-B at its middle (screen coords)
const ticks = (A, B, k) => { const [ux, uy] = unit(A, B), mx = (A[0] + B[0]) / 2, my = (A[1] + B[1]) / 2; let s = '';
  for (let i = 0; i < k; i++) { const o = (i - (k - 1) / 2) * 5, cx = mx + ux * o, cy = my + uy * o; s += `<line x1="${P1(cx - uy * 7)}" y1="${P1(cy + ux * 7)}" x2="${P1(cx + uy * 7)}" y2="${P1(cy - ux * 7)}" stroke="${C.ink}" stroke-width="2"/>`; }
  return s; };
// right-angle square at V between directions to A and B (screen coords)
const rightMark = (Vt, A, B, z = 13) => { const u = unit(Vt, A), w = unit(Vt, B);
  return `<path d="M${P1(Vt[0] + u[0] * z)} ${P1(Vt[1] + u[1] * z)} L${P1(Vt[0] + (u[0] + w[0]) * z)} ${P1(Vt[1] + (u[1] + w[1]) * z)} L${P1(Vt[0] + w[0] * z)} ${P1(Vt[1] + w[1] * z)}" fill="none" stroke="${C.ink}" stroke-width="1.8"/>`; };
// arc at V from direction of A to direction of B (the smaller angle), radius r; returns path
const arcMark = (Vt, A, B, r = 26, col = C.red) => { const u = unit(Vt, A), w = unit(Vt, B), cr = u[0] * w[1] - u[1] * w[0];
  return `<path d="M${P1(Vt[0] + u[0] * r)} ${P1(Vt[1] + u[1] * r)} A${r} ${r} 0 0 ${cr > 0 ? 1 : 0} ${P1(Vt[0] + w[0] * r)} ${P1(Vt[1] + w[1] * r)}" fill="none" stroke="${col}" stroke-width="2.2"/>`; };
const bis = (Vt, A, B) => { const u = unit(Vt, A), w = unit(Vt, B); let bx = u[0] + w[0], by = u[1] + w[1]; const L = Math.hypot(bx, by); if (L < 1e-6) return [-u[1], u[0]]; return [bx / L, by / L]; };

// polygon in model coords (y up). o: labels[i] (edge i→i+1), ticks[i], right:[vertex idx], names:[..], angles:{i:text}, fill, maxW, maxH, dash (dashed lines [[p,q,label]]), dots
V9.poly = function (pts, o = {}) {
  const extra = (o.lines || []).flatMap(l => [l[0], l[1]]);
  const f = fit(pts.concat(extra), o.maxW || 320, o.maxH || 220, o.pad || 34, o.padX || (o.labels ? 56 : 34)), P = pts.map(f.T), n = pts.length;
  let b = `<path d="M${P.map(p => p.join(' ')).join(' L')} Z" fill="${o.fill || C.teal + '26'}" stroke="${C.ink}" stroke-width="2.5" stroke-linejoin="round"/>`;
  for (let i = 0; i < n; i++) {
    const A = P[i], B = P[(i + 1) % n], [ux, uy] = unit(A, B), mx = (A[0] + B[0]) / 2, my = (A[1] + B[1]) / 2;
    let nx = uy, ny = -ux; if (pip(mx + nx * 4, my + ny * 4, P)) { nx = -nx; ny = -ny; }
    if (o.ticks && o.ticks[i]) b += ticks(A, B, o.ticks[i]);
    const L = o.labels && o.labels[i];
    if (L !== undefined && L !== null && L !== '') { const s = String(L), off = 13 + Math.abs(nx) * s.length * 4.2; b += lab(mx + nx * off, my + ny * off, s, {size: 15}); }
  }
  (o.right || []).forEach(i => b += rightMark(P[i], P[(i + n - 1) % n], P[(i + 1) % n]));
  Object.keys(o.angles || {}).forEach(k => { const i = +k, Vt = P[i], A = P[(i + n - 1) % n], B = P[(i + 1) % n], [bx, by] = bis(Vt, A, B);
    b += arcMark(Vt, A, B, 22); b += lab(Vt[0] + bx * 42, Vt[1] + by * 42, o.angles[k], {size: 14, fill: C.red}); });
  (o.names || []).forEach((t, i) => { if (!t) return; const Vt = P[i], [bx, by] = bis(Vt, P[(i + n - 1) % n], P[(i + 1) % n]); b += lab(Vt[0] - bx * 16, Vt[1] - by * 16, t, {size: 16, weight: 700}); });
  (o.lines || []).forEach(([p, q, t]) => { const A = f.T(p), B = f.T(q); b += `<line x1="${A[0]}" y1="${A[1]}" x2="${B[0]}" y2="${B[1]}" stroke="${C.red}" stroke-width="2.5" stroke-dasharray="7 5"/>`;
    if (t) b += `<circle cx="${B[0]}" cy="${B[1]}" r="11" fill="${C.paper}" stroke="${C.red}" stroke-width="1.5"/>` + lab(B[0], B[1], t, {size: 13, weight: 700, fill: C.red}); });
  if (o.inner) { const cx = P.reduce((a, p) => a + p[0], 0) / n, cy = P.reduce((a, p) => a + p[1], 0) / n; b += lab(cx, cy, o.inner, {size: 15, fill: C.ink}); }
  return V.svg(f.W, f.H, b, o.label || 'shape');
};
// rectangle w × h (model) with side labels: o.top, o.bottom, o.left, o.right
V9.rect = (w, h, o = {}) => V9.poly([[0, 0], [w, 0], [w, h], [0, h]], Object.assign({labels: [o.bottom, o.right, o.top, o.left], maxW: o.maxW || 280, maxH: o.maxH || 170}, o));

// grid of cells; cells: [[r,c]], halves: [[r,c,corner]] triangles (corner: 'tl','tr','bl','br' = the filled corner)
V9.cells = function (rows, cols, cells, o = {}) {
  const s = o.size || 26, col = o.color || C.teal; let b = '';
  for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) b += `<rect x="${2 + j * s}" y="${2 + i * s}" width="${s}" height="${s}" fill="${C.paper}" stroke="${C.line}" stroke-width="1"/>`;
  cells.forEach(([r, c]) => b += `<rect x="${2 + c * s}" y="${2 + r * s}" width="${s}" height="${s}" fill="${col}" fill-opacity="0.75" stroke="${C.ink}" stroke-width="1"/>`);
  (o.halves || []).forEach(([r, c, k]) => { const x = 2 + c * s, y = 2 + r * s, pts = {tl: [[x, y], [x + s, y], [x, y + s]], tr: [[x, y], [x + s, y], [x + s, y + s]], bl: [[x, y], [x, y + s], [x + s, y + s]], br: [[x + s, y], [x + s, y + s], [x, y + s]]}[k];
    b += `<path d="M${pts.map(p => p.join(' ')).join(' L')} Z" fill="${col}" fill-opacity="0.75" stroke="${C.ink}" stroke-width="1"/>`; });
  if (o.title) b += V.text(2 + cols * s / 2, rows * s + 18, o.title, {size: 16, weight: 700});
  return V.svg(cols * s + 4, rows * s + 4 + (o.title ? 26 : 0), b, `grid shape`);
};
// random polyomino with k cells, no holes, fits in maxR × maxC
function polyo(R, k, maxR = 6, maxC = 8) {
  for (let t = 0; t < 200; t++) {
    const set = new Set(['0,0']); let cells = [[0, 0]];
    while (cells.length < k) { const [r, c] = R.pick(cells), [dr, dc] = R.pick([[0, 1], [1, 0], [0, -1], [-1, 0]]), key = (r + dr) + ',' + (c + dc); if (!set.has(key)) { set.add(key); cells.push([r + dr, c + dc]); } }
    const r0 = Math.min(...cells.map(p => p[0])), c0 = Math.min(...cells.map(p => p[1]));
    cells = cells.map(([r, c]) => [r - r0, c - c0]);
    const H = Math.max(...cells.map(p => p[0])) + 1, W = Math.max(...cells.map(p => p[1])) + 1;
    if (H > maxR || W > maxC) continue;
    // hole check: flood from outside of a padded box
    const S = new Set(cells.map(p => p.join(','))), seen = new Set(['-1,-1']), st = [[-1, -1]];
    while (st.length) { const [r, c] = st.pop(); [[0, 1], [1, 0], [0, -1], [-1, 0]].forEach(([dr, dc]) => { const a = r + dr, b = c + dc, key = a + ',' + b; if (a < -1 || b < -1 || a > H || b > W || seen.has(key) || S.has(key)) return; seen.add(key); st.push([a, b]); }); }
    if (seen.size + S.size !== (H + 2) * (W + 2)) continue;
    return {cells, H, W};
  }
  return {cells: Array.from({length: k}, (_, i) => [0, i]), H: 1, W: k};
}
const perimOf = cells => { const S = new Set(cells.map(p => p.join(','))); let p = 0; cells.forEach(([r, c]) => [[0, 1], [1, 0], [0, -1], [-1, 0]].forEach(([a, b]) => { if (!S.has((r + a) + ',' + (c + b))) p++; })); return p; };

// ruler: unit 'cm' (mm ticks) or 'in' (quarter ticks); bar from 0 to len (in the unit)
V9.ruler = function (u, max, len, o = {}) {
  const P = u === 'cm' ? 46 : 84, pad = 26, W = pad * 2 + max * P, sub = u === 'cm' ? 10 : 4, top = 34, X = v => P1(pad + v * P);
  let b = `<rect x="${X(0)}" y="8" width="${P1(len * P)}" height="16" rx="3" fill="${o.color || C.red}"/>`;
  b += `<line x1="${X(len)}" y1="24" x2="${X(len)}" y2="${top}" stroke="${C.muted}" stroke-dasharray="3 3"/>`;
  b += `<rect x="${pad - 14}" y="${top}" width="${max * P + 28}" height="50" rx="4" fill="#F7EDD2" stroke="${C.ink}" stroke-width="2"/>`;
  for (let i = 0; i <= max * sub; i++) { const whole = i % sub === 0, half = !whole && (i * 2) % sub === 0, L = whole ? 20 : half ? 14 : 8;
    b += `<line x1="${X(i / sub)}" y1="${top}" x2="${X(i / sub)}" y2="${top + L}" stroke="${C.ink}" stroke-width="${whole ? 2 : 1}"/>`;
    if (whole) b += V.text(X(i / sub), top + 33, i / sub, {size: 14, weight: 600}); }
  b += V.text(X(max) + 8, top + 44, u, {size: 12, fill: C.muted, anchor: 'end'});
  return V.svg(W, top + 54, b, 'ruler in ' + u);
};

// analog clock
V9.clock = function (t, o = {}) {
  const S = o.size || 130, c = S / 2, R0 = c - 4, H = Math.floor(t / 60) % 12, m = t % 60;
  const pt = (r, deg) => [P1(c + r * Math.sin(rad(deg))), P1(c - r * Math.cos(rad(deg)))];
  let b = `<circle cx="${c}" cy="${c}" r="${R0}" fill="${C.paper}" stroke="${C.ink}" stroke-width="3"/>`;
  for (let i = 0; i < 60; i++) { const big = i % 5 === 0, [x1, y1] = pt(R0 - 2, i * 6), [x2, y2] = pt(R0 - (big ? 9 : 5), i * 6); b += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${big ? C.ink : C.line}" stroke-width="${big ? 2 : 1}"/>`; }
  for (let n = 1; n <= 12; n++) { const [x, y] = pt(R0 - 19, n * 30); b += V.text(x, y, n, {size: 12, weight: 600}); }
  const [hx, hy] = pt(R0 * 0.45, (H + m / 60) * 30), [mx, my] = pt(R0 * 0.7, m * 6);
  b += `<line x1="${c}" y1="${c}" x2="${hx}" y2="${hy}" stroke="${C.ink}" stroke-width="6" stroke-linecap="round"/><line x1="${c}" y1="${c}" x2="${mx}" y2="${my}" stroke="${C.blue}" stroke-width="3.5" stroke-linecap="round"/>` + V.dot(c, c, 4, C.ink);
  return V.svg(S, S, b, 'clock');
};
// simple table: header row + rows (strings)
V9.table = function (head, rows, o = {}) {
  const cw = o.cw || head.map((h, i) => Math.max(70, ...[h].concat(rows.map(r => r[i])).map(s => String(s).length * 9 + 24))), rh = 34, W = cw.reduce((a, b) => a + b, 0) + 2;
  let b = `<rect x="1" y="1" width="${W - 2}" height="${rh}" fill="${C.faint}"/>`, x = 1;
  head.forEach((h, i) => { b += V.text(x + cw[i] / 2, 1 + rh / 2, h, {size: 14, weight: 700}); x += cw[i]; });
  rows.forEach((r, j) => { x = 1; const y = 1 + (j + 1) * rh; b += `<line x1="1" y1="${y}" x2="${W - 1}" y2="${y}" stroke="${C.line}"/>`;
    r.forEach((s, i) => { b += V.text(x + cw[i] / 2, y + rh / 2, s, {size: 14, weight: i === 0 ? 600 : 500, fill: s === '?' ? C.red : C.ink}); x += cw[i]; }); });
  x = 1; cw.slice(0, -1).forEach(w => { x += w; b += `<line x1="${x}" y1="1" x2="${x}" y2="${1 + (rows.length + 1) * rh}" stroke="${C.line}"/>`; });
  b += `<rect x="1" y="1" width="${W - 2}" height="${(rows.length + 1) * rh}" fill="none" stroke="${C.ink}" stroke-width="1.5"/>`;
  return V.svg(W, (rows.length + 1) * rh + 2, b, o.label || 'table');
};

/* =================== II.9.01 – II.9.05 units, time =================== */
E2.skill({ id: 'II.9.01', name: 'Metric length', steps: {
  a: { t: 'mm, cm, m', g: (R) => { const k = R.int(0, 5);
    if (k === 0) { const n = R.int(2, 40); return num(`${n} cm = ? mm`, 10 * n, `1 cm = 10 mm, so ${n} cm = ${n} ${X} 10 = ${10 * n} mm.`); }
    if (k === 1) { const n = R.int(2, 40); return num(`${10 * n} mm = ? cm`, n, `10 mm make 1 cm, so ${10 * n} ÷ 10 = ${n} cm.`); }
    if (k === 2) { const n = R.int(2, 9); return num(`${n} m = ? cm`, 100 * n, `1 m = 100 cm, so ${n} m = ${100 * n} cm.`); }
    if (k === 3) { const n = R.int(2, 9); return num(`${100 * n} cm = ? m`, n, `100 cm make 1 m, so ${100 * n} ÷ 100 = ${n} m.`); }
    const L = R.int(21, 89); if (L % 10 === 0) return again('II.9.01', 'a', R);
    if (k === 4) return num(`How long is the red bar, in millimeters?`, L, `It ends ${L % 10} small marks past ${Math.floor(L / 10)} cm: ${Math.floor(L / 10)} ${X} 10 + ${L % 10} = ${L} mm.`, {visual: V9.ruler('cm', 10, L / 10)});
    return num(`${L} mm = ? cm ? mm`, [{label: 'cm', ans: Math.floor(L / 10)}, {label: 'mm', ans: L % 10}], `${L} = ${Math.floor(L / 10)} ${X} 10 + ${L % 10}, so ${Math.floor(L / 10)} cm ${L % 10} mm.`); } },
  b: { t: 'km', g: (R) => { const k = R.int(0, 5);
    if (k === 0) { const n = R.int(2, 9); return num(`${n} km = ? m`, 1000 * n, `1 km = 1000 m, so ${n} km = ${fmt(1000 * n)} m.`); }
    if (k === 1) { const n = R.int(2, 9); return num(`${fmt(1000 * n)} m = ? km`, n, `1000 m make 1 km, so ${fmt(1000 * n)} ÷ 1000 = ${n} km.`); }
    if (k === 2) { const a = R.int(1, 8), m = R.int(1, 19) * 50; return num(`${a} km ${m} m = ? m`, 1000 * a + m, `${a} km = ${fmt(1000 * a)} m, plus ${m} m is ${fmt(1000 * a + m)} m.`); }
    if (k === 3) { const a = R.int(1, 8), m = R.int(1, 19) * 50, t = 1000 * a + m; return num(`${fmt(t)} m = ? km ? m`, [{label: 'km', ans: a}, {label: 'm', ans: m}], `${fmt(t)} = ${fmt(1000 * a)} + ${m}, so ${a} km ${m} m.`); }
    if (k === 4) return choice(R, 'Which is about 1 km?', R.pick(['a 15-minute walk', '10 soccer fields end to end', '2 and a half laps of a 400 m track']), R.sample(['the length of a bus', 'the height of a door', 'the length of a classroom', 'a 10-second walk', 'the length of a pencil'], 3), '1 km = 1000 m: about a 15-minute walk, or 10 soccer fields of 100 m.');
    const a = R.int(2, 6), m = 1000 * a + R.pick([-100, -50, 50, 100, -200, 200]);
    return choiceFixed(`Which is longer: ${a} km or ${fmt(m)} m?`, [`${a} km`, `${fmt(m)} m`], m < 1000 * a ? 0 : 1, `${a} km = ${fmt(1000 * a)} m, which is ${m < 1000 * a ? 'more' : 'less'} than ${fmt(m)} m.`); } },
  c: { t: 'convert m and cm', g: (R) => { const k = R.int(0, 5), a = R.int(1, 9), c = R.int(1, 19) * 5, t = 100 * a + c;
    if (k === 0) return num(`${fmt(t / 100)} m = ? cm`, t, `1 m = 100 cm, so ${fmt(t / 100)} ${X} 100 = ${t} cm.`);
    if (k === 1) return num(`${t} cm = ? m`, t / 100, `100 cm = 1 m, so ${t} ÷ 100 = ${fmt(t / 100)} m.`);
    if (k === 2) return num(`${a} m ${c} cm = ? cm`, t, `${a} m = ${100 * a} cm, plus ${c} cm is ${t} cm.`);
    if (k === 3) return num(`${t} cm = ? m ? cm`, [{label: 'm', ans: a}, {label: 'cm', ans: c}], `${t} = ${100 * a} + ${c}, so ${a} m ${c} cm.`);
    if (k === 4) { const n = R.int(2, 9); return choice(R, `${n} m = ? cm`, `${100 * n} cm`, [`${fmt(n / 100)} cm`, `${10 * n} cm`, `${fmt(1000 * n)} cm`], `Centimeters are smaller, so there are more of them: ${n} ${X} 100 = ${100 * n} cm.`); }
    const other = R.pick([t + R.pick([-20, -5, 5, 20]), 10 * a + Math.floor(c / 10)]); if (other === t || other <= 0) return again('II.9.01', 'c', R);
    return choiceFixed(`Which is longer: ${fmt(t / 100)} m or ${other} cm?`, [`${fmt(t / 100)} m`, `${other} cm`], t > other ? 0 : 1, `${fmt(t / 100)} m = ${t} cm, which is ${t > other ? 'more' : 'less'} than ${other} cm.`); } },
  d: { t: 'choose a unit', g: (R) => {
    const items = [['the length of an ant', 'mm'], ['the width of a grain of rice', 'mm'], ['the thickness of a coin', 'mm'], ['the length of a ladybug', 'mm'],
      ['the length of a pencil', 'cm'], ['the width of a book', 'cm'], ['the length of a spoon', 'cm'], ['the length of your hand', 'cm'], ['the length of a shoe', 'cm'],
      ['the length of a classroom', 'm'], ['the height of a tree', 'm'], ['the length of a swimming pool', 'm'], ['the length of a bus', 'm'], ['the height of a house', 'm'],
      ['the distance between two towns', 'km'], ['a train trip to another city', 'km'], ['the length of a marathon', 'km'], ['the length of a long river', 'km']];
    const U = ['mm', 'cm', 'm', 'km'], why = {mm: 'Tiny things are measured in millimeters.', cm: 'Small things you can hold are measured in centimeters.', m: 'Rooms, buildings and big things are measured in meters.', km: 'Long distances between places are measured in kilometers.'};
    if (R.bool(0.6)) { const [w, u] = R.pick(items); return choiceFixed(`Which unit is best for measuring ${w}?`, U, U.indexOf(u), why[u]); }
    const S = [['An ant is about 5', 'mm', 'long'], ['A pencil is about 18', 'cm', 'long'], ['A door is about 2', 'm', 'tall'], ['A bus is about 12', 'm', 'long'], ['A crayon is about 9', 'cm', 'long'], ['A marathon is about 42', 'km', 'long'], ['A coin is about 2', 'mm', 'thick'], ['A pool is about 25', 'm', 'long'], ['A book is about 20', 'cm', 'wide'], ['The flight was about 900', 'km', '']];
    const [a, u, e] = R.pick(S);
    return choiceFixed(`${a} ___${e ? ' ' + e : ''}. Which unit fits?`, U, U.indexOf(u), `${a} ${u}${e ? ' ' + e : ''}. ${why[u]}`); } },
}});

E2.skill({ id: 'II.9.02', name: 'Imperial length', steps: {
  a: { t: 'inch, foot, yard', g: (R) => { const k = R.int(0, 5);
    if (k === 0) { const n = R.int(2, 9); return num(`${n} ft = ? in`, 12 * n, `1 ft = 12 in, so ${n} ${X} 12 = ${12 * n} in.`); }
    if (k === 1) { const n = R.int(2, 9); return num(`${12 * n} in = ? ft`, n, `12 in make 1 ft, so ${12 * n} ÷ 12 = ${n} ft.`); }
    if (k === 2) { const n = R.int(2, 12); return num(`${n} yd = ? ft`, 3 * n, `1 yd = 3 ft, so ${n} ${X} 3 = ${3 * n} ft.`); }
    if (k === 3) { const n = R.int(2, 12); return num(`${3 * n} ft = ? yd`, n, `3 ft make 1 yd, so ${3 * n} ÷ 3 = ${n} yd.`); }
    if (k === 4) { const n = R.int(1, 5); return num(`${n} yd = ? in`, 36 * n, `1 yd = 3 ft = 36 in, so ${n} ${X} 36 = ${36 * n} in.`); }
    const [p, c, d] = R.pick([['1 foot = ? inches', '12', ['10', '3', '36']], ['1 yard = ? feet', '3', ['10', '12', '36']], ['1 yard = ? inches', '36', ['30', '12', '100']]]);
    return choice(R, p, c, d, '1 ft = 12 in and 1 yd = 3 ft = 36 in. They don\'t go by tens.'); } },
  b: { t: 'mile', g: (R) => { const k = R.int(0, 4);
    if (k === 0) { const n = R.int(1, 3); return num(`${n} mi = ? ft`, 5280 * n, `1 mi = 5280 ft, so ${n} ${X} 5280 = ${fmt(5280 * n)} ft.`); }
    if (k === 1) { const n = R.int(1, 5); return num(`${n} mi = ? yd`, 1760 * n, `1 mi = 1760 yd, so ${n} ${X} 1760 = ${fmt(1760 * n)} yd.`); }
    if (k === 2) { const [u, v] = R.pick([['ft', R.pick([5000, 5200, 5300, 5500, 6000, 4800])], ['yd', R.pick([1500, 1700, 1800, 2000, 1600])]]), mi = u === 'ft' ? 5280 : 1760;
      return choiceFixed(`Which is longer: 1 mile or ${fmt(v)} ${u}?`, ['1 mile', `${fmt(v)} ${u}`], mi > v ? 0 : 1, `1 mile = ${fmt(mi)} ${u}, which is ${mi > v ? 'more' : 'less'} than ${fmt(v)} ${u}.`); }
    if (k === 3) return choice(R, 'Which is about 1 mile?', R.pick(['a 20-minute walk', '4 laps of a running track', '18 football fields end to end']), R.sample(['the length of a football field', 'the height of a tall tree', 'across a classroom', 'a 1-minute walk', 'the length of a car'], 3), '1 mile = 5280 ft: about a 20-minute walk, 4 laps of a running track, or 18 football fields end to end.');
    const [f, v, w] = R.pick([[[1, 2], 2640, 880], [[1, 4], 1320, 440]]);
    return R.bool() ? num(`${fh(...f)} mi = ? ft`, v, `1 mi = 5280 ft, and 5280 ÷ ${f[1]} = ${fmt(v)} ft.`) : num(`${fh(...f)} mi = ? yd`, w, `1 mi = 1760 yd, and 1760 ÷ ${f[1]} = ${w} yd.`); } },
  c: { t: 'convert', g: (R) => { const k = R.int(0, 4);
    if (k === 0) { const f = R.int(1, 7), i = R.int(1, 11), n = 12 * f + i; return num(`${n} in = ? ft ? in`, [{label: 'ft', ans: f}, {label: 'in', ans: i}], `${n} = ${f} ${X} 12 + ${i}, so ${f} ft ${i} in.`); }
    if (k === 1) { const f = R.int(1, 7), i = R.int(1, 11); return num(`${f} ft ${i} in = ? in`, 12 * f + i, `${f} ft = ${12 * f} in, plus ${i} is ${12 * f + i} in.`); }
    if (k === 2) { const y = R.int(1, 9), f = R.int(1, 2); return num(`${y} yd ${f} ft = ? ft`, 3 * y + f, `${y} yd = ${3 * y} ft, plus ${f} is ${3 * y + f} ft.`); }
    if (k === 3) { const y = R.int(1, 9), f = R.int(1, 2), n = 3 * y + f; return num(`${n} ft = ? yd ? ft`, [{label: 'yd', ans: y}, {label: 'ft', ans: f}], `${n} = ${y} ${X} 3 + ${f}, so ${y} yd ${f} ft.`); }
    const f = R.int(1, 9), i = R.pick([3, 6, 9]), v = f + i / 12;
    return choice(R, `${f} ft ${i} in = ? ft`, `${fmt(v)} ft`, [`${f}.${i} ft`, `${f}.0${i} ft`, `${f + 1} ft`], `A foot is 12 in, not 10: ${i} in is ${fh(i / 3, 4)} of a foot, so ${fmt(v)} ft.`); } },
  d: { t: 'choose a unit', g: (R) => {
    const items = [['the length of a pencil', 'inch'], ['the length of a paper clip', 'inch'], ['the width of a phone', 'inch'], ['the length of a crayon', 'inch'], ['the width of a book', 'inch'],
      ['the height of a door', 'foot'], ['the height of a person', 'foot'], ['the length of a bed', 'foot'], ['the height of a room', 'foot'], ['the length of a car', 'foot'],
      ['the length of a football field', 'yard'], ['cloth to make curtains', 'yard'], ['the length of a running race', 'yard'], ['the length of a garden hose', 'yard'],
      ['the distance between two towns', 'mile'], ['a car trip to the beach', 'mile'], ['the length of a long river', 'mile'], ['a bike ride across the city', 'mile']];
    const U = ['inch', 'foot', 'yard', 'mile'], why = {inch: 'Small things you can hold are measured in inches.', foot: 'Things about as big as a person are measured in feet.', yard: 'Fields, races and long pieces of cloth are often measured in yards.', mile: 'Long distances between places are measured in miles.'};
    if (R.bool(0.65)) { const [w, u] = R.pick(items); return choiceFixed(`Which unit is best for measuring ${w}?`, U, U.indexOf(u), why[u]); }
    const S = [['A pencil is about 7', 'inch', 'long'], ['A door is about 7', 'foot', 'tall'], ['A football field is 100', 'yard', 'long'], ['The drive to the lake is 30', 'mile', ''], ['A paper clip is about 1', 'inch', 'long'], ['A car is about 15', 'foot', 'long'], ['A marathon is about 26', 'mile', 'long']];
    const [a, u, e] = R.pick(S), pl = / 1$/.test(a) ? u : u === 'foot' ? 'feet' : u === 'inch' ? 'inches' : u + 's';
    return choiceFixed(`${a} ___${e ? ' ' + e : ''}. Which unit fits?`, U, U.indexOf(u), `${a} ${pl}${e ? ' ' + e : ''}. ${why[u]}`); } },
}});

// objects for estimating: [name, metric correct, metric wrong ×3, imperial correct, imperial wrong ×3]
const MASS = [['an apple', '150 g', ['15 kg', '1.5 g', '15 g'], '6 oz', ['6 lb', '60 lb', '600 oz']], ['a cat', '4 kg', ['4 g', '40 g', '400 kg'], '10 lb', ['10 oz', '1 oz', '1000 lb']],
  ['a bike', '12 kg', ['12 g', '120 g', '1200 kg'], '25 lb', ['25 oz', '2 oz', '2500 lb']], ['a bag of flour', '2 kg', ['2 g', '20 g', '200 kg'], '5 lb', ['5 oz', '50 oz', '500 lb']],
  ['a pencil', '5 g', ['5 kg', '50 kg', '500 g'], null], ['a grown man', '75 kg', ['75 g', '7 kg', '750 kg'], '170 lb', ['170 oz', '17 oz', '1700 lb']],
  ['a loaf of bread', '500 g', ['5 g', '50 kg', '5 kg'], '1 lb', ['1 oz', '10 lb', '100 lb']], ['a car', '1500 kg', ['1500 g', '15 kg', '150 g'], '3000 lb', ['3000 oz', '30 lb', '30 oz']],
  ['a banana', '120 g', ['120 kg', '12 kg', '1 g'], '4 oz', ['4 lb', '40 lb', '400 lb']], ['a dictionary', '1 kg', ['1 g', '100 kg', '10 g'], '2 lb', ['2 oz', '200 lb', '20 lb']],
  ['a strawberry', '15 g', ['15 kg', '150 kg', '1.5 kg'], '1 oz', ['1 lb', '10 lb', '100 lb']], ['a watermelon', '5 kg', ['5 g', '50 g', '500 kg'], '10 lb', ['10 oz', '1 oz', '1000 lb']]];
E2.skill({ id: 'II.9.03', name: 'Mass', steps: {
  a: { t: 'grams and kilograms', g: (R) => { const k = R.int(0, 4), n = R.int(2, 9);
    if (k === 0) return num(`${n} kg = ? g`, 1000 * n, `1 kg = 1000 g, so ${n} kg = ${fmt(1000 * n)} g.`);
    if (k === 1) return num(`${fmt(1000 * n)} g = ? kg`, n, `1000 g make 1 kg, so ${fmt(1000 * n)} ÷ 1000 = ${n} kg.`);
    if (k === 2) { const g = R.int(1, 19) * 50; return num(`${n} kg ${g} g = ? g`, 1000 * n + g, `${n} kg = ${fmt(1000 * n)} g, plus ${g} g is ${fmt(1000 * n + g)} g.`); }
    if (k === 3) return choice(R, `${n} kg = ? g`, `${fmt(1000 * n)} g`, [`${100 * n} g`, `${10 * n} g`, `${fmt(10000 * n)} g`], `"Kilo" means a thousand: ${n} kg = ${n} ${X} 1000 = ${fmt(1000 * n)} g.`);
    const g = 1000 * n + R.pick([-100, -50, 50, 100, -200, 200]);
    return choiceFixed(`Which is heavier: ${n} kg or ${fmt(g)} g?`, [`${n} kg`, `${fmt(g)} g`], g < 1000 * n ? 0 : 1, `${n} kg = ${fmt(1000 * n)} g, which is ${g < 1000 * n ? 'more' : 'less'} than ${fmt(g)} g.`); } },
  b: { t: 'ounces and pounds', g: (R) => { const k = R.int(0, 4), n = R.int(2, 6);
    if (k === 0) return num(`${n} lb = ? oz`, 16 * n, `1 lb = 16 oz, so ${n} ${X} 16 = ${16 * n} oz.`);
    if (k === 1) return num(`${16 * n} oz = ? lb`, n, `16 oz make 1 lb, so ${16 * n} ÷ 16 = ${n} lb.`);
    if (k === 2) { const o = R.int(1, 15); return num(`${n} lb ${o} oz = ? oz`, 16 * n + o, `${n} lb = ${16 * n} oz, plus ${o} is ${16 * n + o} oz.`); }
    if (k === 3) return choice(R, `${n} lb = ? oz`, `${16 * n} oz`, [`${10 * n} oz`, `${12 * n} oz`, `${100 * n} oz`], `A pound is 16 ounces, not 10: ${n} ${X} 16 = ${16 * n} oz.`);
    const o = 16 * n + R.pick([-4, -2, 2, 4, -6, 6, -6 * n]);
    return choiceFixed(`Which is heavier: ${n} lb or ${o} oz?`, [`${n} lb`, `${o} oz`], o < 16 * n ? 0 : 1, `${n} lb = ${16 * n} oz, which is ${o < 16 * n ? 'more' : 'less'} than ${o} oz.`); } },
  c: { t: 'convert', g: (R, O) => { const k = R.int(0, 3);
    if (metric(O)) { const a = R.int(1, 9), g = R.int(1, 9) * 100;
      if (k === 0) { const t = 1000 * a + R.int(1, 9) * 100; return num(`${fmt(t / 1000)} kg = ? g`, t, `1 kg = 1000 g, so ${fmt(t / 1000)} ${X} 1000 = ${fmt(t)} g.`); }
      if (k === 1) { const t = 1000 * a + R.int(1, 9) * 100; return num(`${fmt(t)} g = ? kg`, t / 1000, `1000 g = 1 kg, so ${fmt(t)} ÷ 1000 = ${fmt(t / 1000)} kg.`); }
      if (k === 2) { const s = R.int(1, 19) * 5; return num(`${a} kg ${s} g = ? g`, 1000 * a + s, `${a} kg = ${fmt(1000 * a)} g, plus ${s} g is ${fmt(1000 * a + s)} g. Keep the 0 in the hundreds place.`); }
      const t = 1000 * a + g; return num(`${fmt(t)} g = ? kg ? g`, [{label: 'kg', ans: a}, {label: 'g', ans: g}], `${fmt(t)} = ${fmt(1000 * a)} + ${g}, so ${a} kg ${g} g.`); }
    const a = R.int(1, 6), o = R.int(1, 15), t = 16 * a + o;
    if (k === 0) return num(`${t} oz = ? lb ? oz`, [{label: 'lb', ans: a}, {label: 'oz', ans: o}], `${t} = ${a} ${X} 16 + ${o}, so ${a} lb ${o} oz.`);
    if (k === 1) return num(`${a} lb ${o} oz = ? oz`, t, `${a} lb = ${16 * a} oz, plus ${o} is ${t} oz.`);
    if (k === 2) { const [f, q] = R.pick([[[1, 2], 8], [[1, 4], 4], [[3, 4], 12]]); return num(`${a} ${fh(...f)} lb = ? oz`, 16 * a + q, `${a} lb = ${16 * a} oz, and ${fh(...f)} lb = ${q} oz. Total ${16 * a + q} oz.`); }
    return choice(R, `${a} lb 8 oz = ? lb`, `${a}.5 lb`, [`${a}.8 lb`, `${a}.08 lb`, `${a + 8} lb`], `A pound is 16 oz, so 8 oz is half a pound: ${a}.5 lb.`); } },
  d: { t: 'estimate', g: (R, O) => { const ok = MASS.filter(m => m && m[1] && (metric(O) || m[3]));
    const m = R.pick(ok), [c, d] = metric(O) ? [m[1], m[2]] : [m[3], m[4]];
    return choice(R, `About how heavy is ${m[0]}?`, c, d, `${m[0][0].toUpperCase() + m[0].slice(1)} weighs about ${c}. ${metric(O) ? '1 kg = 1000 g; a paper clip is about 1 g.' : '1 lb = 16 oz; a slice of bread is about 1 oz.'}`); } },
}});

const CAPM = [['a teaspoon', '5 mL', ['5 L', '50 L', '500 mL']], ['a glass of milk', '250 mL', ['25 L', '2.5 mL', '250 L']], ['a bathtub', '150 L', ['150 mL', '15 mL', '1.5 L']], ['a bucket', '10 L', ['10 mL', '100 mL', '1000 L']],
  ['a large milk jug', '4 L', ['4 mL', '40 mL', '400 L']], ['a water bottle', '500 mL', ['5 mL', '50 L', '500 L']], ['a fish tank', '40 L', ['40 mL', '4 mL', '4000 L']], ['a car\'s fuel tank', '50 L', ['50 mL', '5 mL', '5000 L']],
  ['a soup bowl', '300 mL', ['3 mL', '30 L', '300 L']], ['a kitchen sink', '20 L', ['20 mL', '2 mL', '2000 L']], ['a juice box', '200 mL', ['200 L', '2 mL', '20 L']], ['a cooking pot', '5 L', ['5 mL', '50 mL', '500 L']]];
const CAPI = [['a glass of milk', '1 cup', ['1 gal', '10 gal', '10 qt']], ['a bathtub', '40 gal', ['40 cups', '4 cups', '4 pt']], ['a bucket', '2 gal', ['2 cups', '20 gal', '200 gal']], ['a large milk jug', '1 gal', ['1 cup', '20 gal', '100 gal']],
  ['a soup bowl', '2 cups', ['2 gal', '20 gal', '20 qt']], ['a fish tank', '10 gal', ['10 cups', '1 cup', '1000 gal']], ['a car\'s fuel tank', '12 gal', ['12 cups', '1 pt', '1200 gal']], ['a juice box', '1 cup', ['1 gal', '10 gal', '10 qt']],
  ['a kitchen sink', '5 gal', ['5 cups', '1 cup', '500 gal']], ['a cooking pot', '4 qt', ['4 cups', '40 gal', '400 gal']], ['a swimming pool', '10,000 gal', ['10 gal', '10 cups', '100 qt']], ['a watering can', '2 gal', ['2 cups', '200 gal', '2000 gal']]];
E2.skill({ id: 'II.9.04', name: 'Capacity', steps: {
  a: { t: 'mL and L', g: (R) => { const k = R.int(0, 4), n = R.int(2, 9);
    if (k === 0) return num(`${n} L = ? mL`, 1000 * n, `1 L = 1000 mL, so ${n} L = ${fmt(1000 * n)} mL.`);
    if (k === 1) return num(`${fmt(1000 * n)} mL = ? L`, n, `1000 mL make 1 L, so ${fmt(1000 * n)} ÷ 1000 = ${n} L.`);
    if (k === 2) { const m = R.int(1, 19) * 50; return num(`${n} L ${m} mL = ? mL`, 1000 * n + m, `${n} L = ${fmt(1000 * n)} mL, plus ${m} is ${fmt(1000 * n + m)} mL.`); }
    if (k === 3) return choice(R, `${n} L = ? mL`, `${fmt(1000 * n)} mL`, [`${100 * n} mL`, `${10 * n} mL`, `${fmt(10000 * n)} mL`], `"Milli" means a thousandth: 1 L = 1000 mL, so ${n} L = ${fmt(1000 * n)} mL.`);
    const c = R.pick([250, 200, 500]); return num(`How many ${c} mL cups fill a ${n} L jug?`, 1000 * n / c, `${n} L = ${fmt(1000 * n)} mL, and ${fmt(1000 * n)} ÷ ${c} = ${1000 * n / c}.`); } },
  b: { t: 'cups, pints, quarts, gallons', g: (R) => { const k = R.int(0, 5), n = R.int(2, 9);
    if (k === 0) return num(`${n} gal = ? qt`, 4 * n, `1 gal = 4 qt, so ${n} ${X} 4 = ${4 * n} qt.`);
    if (k === 1) return num(`${n} qt = ? pt`, 2 * n, `1 qt = 2 pt, so ${n} ${X} 2 = ${2 * n} pt.`);
    if (k === 2) return num(`${n} pt = ? cups`, 2 * n, `1 pt = 2 cups, so ${n} ${X} 2 = ${2 * n} cups.`);
    if (k === 3) { const m = R.int(1, 4); return R.bool() ? num(`${m} gal = ? pt`, 8 * m, `1 gal = 4 qt = 8 pt, so ${m} ${X} 8 = ${8 * m} pt.`) : num(`${m} gal = ? cups`, 16 * m, `1 gal = 4 qt = 8 pt = 16 cups, so ${m} ${X} 16 = ${16 * m} cups.`); }
    if (k === 4) { const [p, c, d] = R.pick([['1 gallon = ? quarts', '4', ['10', '2', '16']], ['1 gallon = ? cups', '16', ['10', '4', '8']], ['1 quart = ? cups', '4', ['10', '2', '8']], ['1 gallon = ? pints', '8', ['10', '4', '16']]]);
      return choice(R, p, c, d, 'Customary units don\'t go by tens: 1 gal = 4 qt = 8 pt = 16 cups.'); }
    for (let t = 0; t < 50; t++) { const q = R.int(2, 4), p = R.int(3, 9), c = R.int(5, 17), v = [4 * q, 2 * p, c], mx = Math.max(...v); if (v.filter(x => x === mx).length > 1) continue;
      const opts = [`${q} qt`, `${p} pt`, `${c} cups`];
      return choiceFixed(`Which holds the most?`, opts, v.indexOf(mx), `In cups: ${q} qt = ${4 * q}, ${p} pt = ${2 * p}, and ${c} cups. The most is ${opts[v.indexOf(mx)]}.`); }
    return num('2 qt = ? cups', 8, '1 qt = 4 cups, so 2 qt = 8 cups.'); } },
  c: { t: 'convert', g: (R, O) => { const k = R.int(0, 3);
    if (metric(O)) { const a = R.int(1, 9), h = R.int(1, 9) * 100;
      if (k === 0) return num(`${fmt(a + h / 1000)} L = ? mL`, 1000 * a + h, `1 L = 1000 mL, so ${fmt(a + h / 1000)} ${X} 1000 = ${fmt(1000 * a + h)} mL.`);
      if (k === 1) return num(`${fmt(1000 * a + h)} mL = ? L`, a + h / 1000, `1000 mL = 1 L, so ${fmt(1000 * a + h)} ÷ 1000 = ${fmt(a + h / 1000)} L.`);
      if (k === 2) { const s = R.int(1, 19) * 5; return num(`${a} L ${s} mL = ? mL`, 1000 * a + s, `${a} L = ${fmt(1000 * a)} mL, plus ${s} is ${fmt(1000 * a + s)} mL.`); }
      return num(`${fmt(1000 * a + h)} mL = ? L ? mL`, [{label: 'L', ans: a}, {label: 'mL', ans: h}], `${fmt(1000 * a + h)} = ${fmt(1000 * a)} + ${h}, so ${a} L ${h} mL.`); }
    const g = R.int(2, 5), q = R.int(1, 3);
    if (k === 0) return num(`${g} gal = ? pt`, 8 * g, `1 gal = 8 pt, so ${g} ${X} 8 = ${8 * g} pt.`);
    if (k === 1) { const n = R.int(2, 6); return num(`${4 * n} cups = ? qt`, n, `4 cups make 1 qt, so ${4 * n} ÷ 4 = ${n} qt.`); }
    if (k === 2) return num(`${g} gal ${q} qt = ? qt`, 4 * g + q, `${g} gal = ${4 * g} qt, plus ${q} is ${4 * g + q} qt.`);
    return num(`${4 * g + q} qt = ? gal ? qt`, [{label: 'gal', ans: g}, {label: 'qt', ans: q}], `${4 * g + q} = ${g} ${X} 4 + ${q}, so ${g} gal ${q} qt.`); } },
  d: { t: 'estimate', g: (R, O) => { const L = metric(O) ? CAPM : CAPI, [n, c, d] = R.pick(L);
    return choice(R, `About how much does ${n} hold?`, c, d, `${n[0].toUpperCase() + n.slice(1)} holds about ${c}. ${metric(O) ? 'A teaspoon is about 5 mL; a big bottle is 1 or 2 L.' : 'A glass is about 1 cup; a big milk jug is 1 gallon.'}`); } },
}});

E2.skill({ id: 'II.9.05', name: 'Time', steps: {
  a: { t: 'elapsed time', g: (R, O) => { const t0 = R.int(7 * 12, 17 * 12) * 5, d = R.int(3, 47) * 5, t1 = t0 + d, what = R.pick(['A film', 'A game', 'A party', 'A class trip', 'A concert', 'A swim lesson']);
    const ans = d >= 60 ? [{label: 'hours', ans: Math.floor(d / 60)}, {label: 'minutes', ans: d % 60}] : [{label: 'minutes', ans: d}];
    const to = 60 - t0 % 60, ex = t0 % 60 && d > to ? `${to} min to ${tod(O, t0 + to)}, then ${hm(d - to)} more: ${hm(d)} in all.` : `Count on from ${tod(O, t0)} to ${tod(O, t1)}: ${hm(d)}.`;
    if (R.bool(0.3)) { const wrong = [t1 - 60, t1 + 60, t1 + 10, t1 - 10, t0 % 60 + d % 60 >= 60 ? t1 - 60 + 40 : t1 + 40].map(t => tod(O, t));
      return choice(R, `${what} starts at ${tod(O, t0)} and lasts ${hm(d)}. When does it end?`, tod(O, t1), R.sample([...new Set(wrong)].filter(w => w !== tod(O, t1)), 3), ex); }
    if (O.clock === '12h' && R.bool(0.4) && d < 11 * 60) return num(`${what} starts and ends at the times shown. How long does it last?`, ans, ex, {visual: V.side([{svg: V9.clock(t0), caption: 'Start'}, {svg: V9.clock(t1), caption: 'End'}])});
    return num(`${what} starts at ${tod(O, t0)} and ends at ${tod(O, t1)}. How long is it?`, ans, ex); } },
  b: { t: 'minutes and hours', g: (R) => { const k = R.int(0, 4);
    if (k === 0) { const h = R.int(1, 5), m = R.int(1, 11) * 5; return num(`${h} h ${m} min = ? min`, 60 * h + m, `${h} h = ${60 * h} min, plus ${m} is ${60 * h + m} min.`); }
    if (k === 1) { const h = R.int(1, 5), m = R.int(1, 11) * 5, t = 60 * h + m; return num(`${t} min = ? h ? min`, [{label: 'h', ans: h}, {label: 'min', ans: m}], `${t} = ${h} ${X} 60 + ${m}, so ${h} h ${m} min.`); }
    if (k === 2) { const h = R.int(1, 4), [f, m] = R.pick([['5', 30], ['25', 15], ['75', 45]]);
      return choice(R, `${h}.${f} hours = ?`, `${h} h ${m} min`, [`${h} h ${f} min`, `${h} h ${m === 30 ? 20 : m + 10} min`, `${60 * h + +f} min`].filter(s => s !== `${h} h ${m} min`), `An hour has 60 minutes, not 100: 0.${f} h = ${m} min, so ${h} h ${m} min.`); }
    if (k === 3) { const h = R.int(1, 3), m = R.int(1, 5) * 10, a = 100 * h + R.pick([-20, 0, 10, 20]) , t = 60 * h + m; if (a === t) return again('II.9.05', 'b', R);
      return choiceFixed(`Which is longer: ${a} min or ${h} h ${m} min?`, [`${a} min`, `${h} h ${m} min`], a > t ? 0 : 1, `${h} h ${m} min = ${t} min, which is ${a > t ? 'less' : 'more'} than ${a} min.`); }
    const [f, m] = R.pick([[[1, 4], 15], [[1, 2], 30], [[3, 4], 45], [[1, 3], 20], [[2, 3], 40], [[1, 6], 10], [[1, 5], 12]]);
    return num(`${fh(...f)} of an hour = ? min`, m, `60 ÷ ${f[1]} = ${60 / f[1]}${f[0] > 1 ? `, and ${f[0]} ${X} ${60 / f[1]} = ${m}` : ''} min.`); } },
  c: { t: 'convert units of time', g: (R) => {
    const U = [['min', 's', 60], ['h', 'min', 60], ['days', 'h', 24], ['weeks', 'days', 7], ['years', 'months', 12]];
    const [a, b, r] = R.pick(U), n = R.int(2, 9), k = R.int(0, 2);
    if (k === 0) return num(`${n} ${a} = ? ${b}`, n * r, `1 ${a.replace(/s$/, '')} = ${r} ${b}, so ${n} ${X} ${r} = ${n * r} ${b}.`);
    if (k === 1) return num(`${n * r} ${b} = ? ${a}`, n, `${r} ${b} make 1 ${a.replace(/s$/, '')}, so ${n * r} ÷ ${r} = ${n}.`);
    const [p, v, e] = R.pick([['1 h = ? s', 3600, '60 min × 60 s = 3600 s.'], ['1 day = ? min', 1440, '24 h × 60 min = 1440 min.'], ['2 weeks = ? h', 336, '14 days × 24 h = 336 h.'], ['1 year = ? weeks (about)', 52, '365 days ÷ 7 is about 52 weeks.'], ['3 days = ? h', 72, '3 × 24 h = 72 h.'], ['1 week = ? h', 168, '7 × 24 h = 168 h.'], ['half a day = ? h', 12, '24 ÷ 2 = 12 h.'], ['5 min = ? s', 300, '5 × 60 = 300 s.']]);
    return num(p, v, e); } },
  d: { t: 'timetables', g: (R, O) => {
    const stops = R.sample(['Station', 'Market', 'Park', 'School', 'Library', 'Zoo', 'Bridge', 'Harbor'], 4), legs = [R.int(4, 18), R.int(4, 18), R.int(4, 18)];
    const gap = R.pick([15, 20, 25, 30, 40]), t0 = R.int(6 * 12, 9 * 12) * 5, deps = [t0, t0 + gap, t0 + 2 * gap];
    const at = (b, s) => deps[b] + legs.slice(0, s).reduce((a, x) => a + x, 0);
    const vis = V9.table([O.clock === '24h' ? 'Bus stop' : 'Bus stop (a.m.)', 'Bus 1', 'Bus 2', 'Bus 3'], stops.map((s, i) => [s, ...[0, 1, 2].map(b => tod(O, at(b, i)).replace(' a.m.', ''))]));
    const k = R.int(0, 3);
    if (k === 0) { const [i, j] = R.distinct(0, 3, 2).sort((a, b) => a - b), b = R.int(0, 2), d = at(b, j) - at(b, i);
      return num(`How long does Bus ${b + 1} take from ${stops[i]} to ${stops[j]}? (minutes)`, d, `It leaves ${stops[i]} at ${tod(O, at(b, i))} and reaches ${stops[j]} at ${tod(O, at(b, j))}: ${d} min.`, {visual: vis}); }
    if (k === 1) { const b = R.int(0, 1), T = at(b, 3) + R.int(1, gap - 1);
      return choiceFixed(`You must be at ${stops[3]} by ${tod(O, T)}. Which is the latest bus you can catch at ${stops[0]}?`, ['Bus 1', 'Bus 2', 'Bus 3'], b, `Bus ${b + 1} reaches ${stops[3]} at ${tod(O, at(b, 3))}. Bus ${b + 2} arrives at ${tod(O, at(b + 1, 3))}, too late.`, {visual: vis}); }
    if (k === 2) { const s = R.int(0, 2), b = R.int(0, 1), w = R.int(2, gap - 2), T = at(b, s) + (gap - w);
      return num(`You reach ${stops[s]} at ${tod(O, T)}. How many minutes until the next bus?`, w, `Bus ${b + 1} left at ${tod(O, at(b, s))}. Bus ${b + 2} comes at ${tod(O, at(b + 1, s))}: ${w} min later.`, {visual: vis}); }
    const s = R.int(1, 3); return num(`How many minutes apart are the buses at ${stops[s]}?`, gap, `${tod(O, at(0, s))} to ${tod(O, at(1, s))} is ${gap} min, and the same again to Bus 3.`, {visual: vis}); } },
}});


/* =================== II.9.06 – II.9.11 perimeter, area, volume =================== */
// grid picture of a polyomino with a 1-cell margin
const cellPic = (P, o = {}) => V9.cells(P.H + 2, P.W + 2, P.cells.map(([r, c]) => [r + 1, c + 1]), o);
// integer triangle sides, drawn to scale (A=(0,0), B=(c,0))
const triPts = (a, b, c) => { const x = (b * b + c * c - a * a) / (2 * c); return [[0, 0], [c, 0], [x, Math.sqrt(Math.max(0, b * b - x * x))]]; };
const PYTH = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [9, 12, 15], [8, 6, 10], [4, 3, 5]];
// L-shape: outer W × H with a w2 × h2 notch cut from the top right. edges: bottom, right-low, notch-h, notch-v, top, left
const Lpts = (W, H, w2, h2) => [[0, 0], [W, 0], [W, H - h2], [W - w2, H - h2], [W - w2, H], [0, H]];

E2.skill({ id: 'II.9.06', name: 'Perimeter', steps: {
  a: { t: 'count units', g: (R) => { const P = polyo(R, R.int(4, 9), 4, 6), p = perimOf(P.cells);
    return num('Each small square has sides of 1 unit. What is the perimeter of the shaded shape?', p, `Walk around the outside and count every unit edge: ${p} units.`, {visual: cellPic(P)}); } },
  b: { t: 'add the sides', g: (R, O) => { const u = UL(O).s, k = R.int(0, 3);
    if (k === 0) { let a, b, c; do { [a, b, c] = [R.int(3, 12), R.int(3, 12), R.int(4, 14)]; } while (a + b <= c + 2 || a + c <= b + 2 || b + c <= a + 2);
      return num(`What is the perimeter of this triangle?`, a + b + c, `Add the 3 sides: ${c} + ${a} + ${b} = ${a + b + c} ${u}.`, {visual: V9.poly(triPts(a, b, c), {labels: [`${c} ${u}`, `${a} ${u}`, `${b} ${u}`]})}); }
    if (k === 1) { const W = R.int(5, 12), H = R.int(4, 10), w2 = R.int(3, W - 2), h2 = R.int(2, H - 2), s = [W, H - h2, w2, h2, W - w2, H];
      return num(`What is the perimeter of this shape?`, 2 * (W + H), `Add all 6 sides: ${s.join(' + ')} = ${2 * (W + H)} ${u}.`, {visual: V9.poly(Lpts(W, H, w2, h2), {labels: s.map(v => `${v} ${u}`)})}); }
    if (k === 2) { const [p, q, r] = R.pick(PYTH), w = 2 * p, h = R.int(3, 9), s = [w, h, r, r, h];
      return num(`What is the perimeter of this shape?`, w + 2 * h + 2 * r, `Add all 5 sides: ${s.join(' + ')} = ${w + 2 * h + 2 * r} ${u}.`, {visual: V9.poly([[0, 0], [w, 0], [w, h], [p, h + q], [0, h]], {labels: s.map(v => `${v} ${u}`)})}); }
    const [p, q, r] = R.pick(PYTH), t = R.int(3, 8), b = t + p, s = [b, r, t, q];
    return num(`What is the perimeter of this shape?`, b + r + t + q, `Add all 4 sides: ${s.join(' + ')} = ${b + r + t + q} ${u}.`, {visual: V9.poly([[0, 0], [b, 0], [t, q], [0, q]], {labels: s.map(v => `${v} ${u}`), right: [0, 3]})}); } },
  c: { t: 'rectangles by rule', g: (R, O) => { const u = R.bool() ? UL(O).s : UL(O).b;
    if (R.bool(0.25)) { const s = R.int(3, 15); return num(`A square has sides of ${s} ${u}. What is its perimeter?`, 4 * s, `4 equal sides: 4 ${X} ${s} = ${4 * s} ${u}.`); }
    let l = R.int(4, 20), w = R.int(2, 12); if (l === w) l++;
    const vis = V9.rect(l, w, {bottom: `${l} ${u}`, left: `${w} ${u}`}), P = 2 * (l + w), ex = `P = 2 ${X} (${l} + ${w}) = ${P} ${u}. A rectangle has 4 sides, not 2.`;
    if (R.bool(0.35)) return choice(R, 'What is the perimeter of this rectangle?', `${P} ${u}`, [`${l + w} ${u}`, `${l * w} ${u}`, `${2 * l + w} ${u}`], ex, {visual: vis});
    return num('What is the perimeter of this rectangle?', P, ex, {visual: vis}); } },
  d: { t: 'find a missing side', g: (R, O) => { const u = UL(O).s, k = R.int(0, 3);
    if (k <= 1) { let l = R.int(4, 16), w = R.int(2, 12); if (l === w) l++; const P = 2 * (l + w);
      return num(`This rectangle has a perimeter of ${P} ${u}. How long is the ? side?`, w, `The two ${l} ${u} sides make ${2 * l}. ${P} ${M} ${2 * l} = ${P - 2 * l}, shared by 2 sides: ${w} ${u}.`, {visual: V9.rect(l, w, {bottom: `${l} ${u}`, left: '?'})}); }
    if (k === 2) { const s = R.int(3, 15); return num(`A square has a perimeter of ${4 * s} ${u}. How long is each side?`, s, `4 equal sides: ${4 * s} ÷ 4 = ${s} ${u}.`); }
    let a, b, c; do { [a, b, c] = [R.int(3, 12), R.int(3, 12), R.int(4, 14)]; } while (a + b <= c + 2 || a + c <= b + 2 || b + c <= a + 2);
    return num(`The triangle has a perimeter of ${a + b + c} ${u}. How long is the ? side?`, b, `${a + b + c} ${M} ${c} ${M} ${a} = ${b} ${u}.`, {visual: V9.poly(triPts(a, b, c), {labels: [`${c} ${u}`, `${a} ${u}`, '?']})}); } },
}});

// row-based shapes with half squares → {cells, halves, rows, cols, twice (2 × area)}
function halfShape(R) {
  const k = R.int(0, 2), cells = [], halves = [];
  if (k === 0) { const n = R.int(2, 5); for (let i = 0; i < n; i++) { for (let j = 0; j < i; j++) cells.push([i, j]); halves.push([i, i, 'bl']); } return {cells, halves, rows: n, cols: n, twice: n * n}; }
  if (k === 1) { const w = R.int(1, 4), h = R.int(2, 4); for (let i = 0; i < h; i++) { for (let j = 0; j < w + i; j++) cells.push([i, j]); halves.push([i, w + i, 'bl']); } return {cells, halves, rows: h, cols: w + h, twice: 2 * w * h + h * h}; }
  const w = R.int(2, 5), h = R.int(2, 4); for (let i = 0; i < h; i++) { halves.push([i, h - i - 1, 'br']); for (let j = h - i; j <= h - i + w - 2; j++) cells.push([i, j]); halves.push([i, h - i - 1 + w, 'tl']); }
  return {cells, halves, rows: h, cols: h + w, twice: 2 * w * h};
}
const shift = (L, d = 1) => L.map(([r, c, x]) => x ? [r + d, c + d, x] : [r + d, c + d]);
E2.skill({ id: 'II.9.07', name: 'Area by counting', steps: {
  a: { t: 'square units', g: (R) => { const P = polyo(R, R.int(5, 14), 5, 7), n = P.cells.length;
    return num('Each small square is 1 square unit. What is the area of the shaded shape?', n, `Count the shaded squares: ${n} square units.`, {visual: cellPic(P)}); } },
  b: { t: 'part squares', g: (R) => { const S = halfShape(R), f = S.cells.length, h = S.halves.length;
    return num('Each small square is 1 square unit. Two half squares make 1 whole. What is the shaded area?', S.twice / 2, `${f} whole squares and ${h} halves: ${f} + ${h} ÷ 2 = ${fmt(S.twice / 2)} square units.`, {visual: V9.cells(S.rows + 2, S.cols + 2, shift(S.cells), {halves: shift(S.halves)})}); } },
  c: { t: 'compare areas', g: (R) => { const a = R.int(5, 12), same = R.bool(0.25), b = same ? a : a + R.pick([-3, -2, -1, 1, 2, 3]);
    const A = polyo(R, a, 4, 6), B = polyo(R, b, 4, 6), ans = a > b ? 0 : a < b ? 1 : 2;
    return choiceFixed('Which shape has the greater area?', ['A', 'B', 'Same'], ans, `A covers ${a} squares and B covers ${b}. ${ans === 2 ? 'They are the same.' : (ans ? 'B' : 'A') + ' is greater.'}`, {visual: V.side([cellPic(A, {title: 'A'}), cellPic(B, {title: 'B'})], {gap: 16})}); } },
  d: { t: 'same area, different shape', g: (R) => {
    if (R.bool(0.4)) { const A = R.pick([12, 16, 18, 20, 24, 30, 36]), pairs = []; for (let a = 2; a * a <= A; a++) if (A % a === 0) pairs.push([a, A / a]);
      const [p, q] = R.pick(pairs), wrong = []; for (let a = 2; a <= 8; a++) for (let b = a; b <= 12; b++) if (a * b !== A && Math.abs(a * b - A) <= 6) wrong.push(`${a} by ${b}`);
      const sp = []; for (let a = 1; a < A / 4; a++) { const b = A / 4 - a; if (Number.isInteger(b) && b >= a && a * b !== A) sp.push(`${a} by ${b}`); }  // same perimeter trap
      return choice(R, `Which rectangle also has an area of ${A} square units?`, `${p} by ${q}`, R.sample(sp, Math.min(1, sp.length)).concat(R.sample(wrong, 3)).slice(0, 3), `Area = length ${X} width: ${p} ${X} ${q} = ${A}.`); }
    const n = R.int(6, 10), P0 = polyo(R, n, 4, 5), per = perimOf(P0.cells), opts = [polyo(R, n, 4, 5)];
    let t = 0; while (opts.length < 3 && t++ < 200) { const Q = polyo(R, n + R.pick([-2, -1, 1, 2]), 4, 5); if (opts.length === 1 && perimOf(Q.cells) !== per && t < 150) continue; opts.push(Q); }
    const L = R.shuffle([0, 1, 2]), names = ['A', 'B', 'C'], pics = L.map((i, j) => cellPic(opts[i], {title: names[j], size: 22}));
    const ai = L.indexOf(0), ac = opts.map(o => o.cells.length);
    return choiceFixed('Which shape has the same area as the shaded shape?', names, ai, `The shaded shape covers ${n} squares. Shape ${names[ai]} also covers ${n}; the others cover ${L.filter(i => i).map(i => ac[i]).join(' and ')}.`, {visual: V.stack([cellPic(P0, {size: 22}), V.side(pics, {gap: 12})])}); } },
}});

E2.skill({ id: 'II.9.08', name: 'Area of rectangles', steps: {
  a: { t: 'length × width', g: (R, O) => { const u = R.bool() ? UL(O).s : UL(O).b; let l = R.int(3, 12), w = R.int(2, 9); if (l === w) l++;
    const vis = V9.rect(l, w, {bottom: `${l} ${u}`, left: `${w} ${u}`}), ex = `Area = length ${X} width = ${l} ${X} ${w} = ${l * w} ${u}².`;
    if (R.bool(0.3)) return choice(R, 'What is the area of this rectangle?', `${l * w} ${u}²`, [`${l * w} ${u}`, `${l + w} ${u}²`, `${2 * (l + w)} ${u}`], ex + ' Area is in square units.', {visual: vis});
    return num(`What is the area of this rectangle, in ${u}²?`, l * w, ex, {visual: vis}); } },
  b: { t: 'missing side', g: (R, O) => { const u = R.bool() ? UL(O).s : UL(O).b; let l = R.int(3, 12), w = R.int(2, 9); if (l === w) l++;
    if (R.bool(0.2)) { const s = R.int(2, 10); return num(`A square has an area of ${s * s} ${u}². How long is each side?`, s, `${s} ${X} ${s} = ${s * s}, so each side is ${s} ${u}.`); }
    return num(`The area is ${l * w} ${u}². How long is the ? side?`, w, `Length ${X} width = area, so ${l} ${X} ? = ${l * w}. ${l * w} ÷ ${l} = ${w} ${u}.`, {visual: V9.rect(l, w, {bottom: `${l} ${u}`, left: '?', inner: `${l * w} ${u}²`})}); } },
  c: { t: 'shapes made of rectangles', g: (R, O) => { const u = UL(O).b, W = R.int(5, 12), H = R.int(4, 10), w2 = R.int(2, W - 2), h2 = R.int(2, H - 2), A = W * H - w2 * h2;
    const lbl = [`${W} ${u}`, `${H - h2} ${u}`, '', '', `${W - w2} ${u}`, `${H} ${u}`];
    return num(`What is the area of this shape, in ${u}²?`, A, `Split it: ${W - w2} ${X} ${H} = ${(W - w2) * H} and ${w2} ${X} ${H - h2} = ${w2 * (H - h2)}. Total ${A} ${u}².`, {visual: V9.poly(Lpts(W, H, w2, h2), {labels: lbl})}); } },
  d: { t: 'word problems', g: (R, O) => { const u = UL(O).b, k = R.int(0, 4);
    if (k === 0) { const l = R.int(4, 15), w = R.int(3, 12); return num(`A garden is ${l} ${u} long and ${w} ${u} wide. What is its area in ${u}²?`, l * w, `${l} ${X} ${w} = ${l * w} ${u}².`); }
    if (k === 1) { const l = R.int(3, 8), w = R.int(2, 6), c = R.int(2, 9) * (O.coins === 'THB' ? 10 : 1);
      return num(`A floor is ${l} ${u} by ${w} ${u}. Tiles cost ${money(O, c)} per ${u}². How much do the tiles cost?`, l * w * c, `Area ${l} ${X} ${w} = ${l * w} ${u}². Cost ${l * w} ${X} ${c} = ${l * w * c}.`); }
    if (k === 2) { const L = R.int(5, 10), W = R.int(4, 8), l = R.int(2, L - 2), w = R.int(2, W - 1);
      return num(`A room is ${L} ${u} by ${W} ${u}. A rug ${l} ${u} by ${w} ${u} lies on the floor. How much floor is not covered, in ${u}²?`, L * W - l * w, `Room ${L * W} ${u}², rug ${l * w} ${u}². ${L * W} ${M} ${l * w} = ${L * W - l * w} ${u}².`); }
    if (k === 3) { const L = R.int(5, 10), H = R.int(3, 5), a = R.int(1, 3), b = R.int(1, 2);
      return num(`A wall is ${L} ${u} long and ${H} ${u} high. It has a window ${a} ${u} by ${b} ${u}. How much wall is there to paint, in ${u}²?`, L * H - a * b, `${L} ${X} ${H} = ${L * H}, minus the window ${a * b}: ${L * H - a * b} ${u}².`); }
    const s = R.int(3, 12); return num(`A square patio has sides of ${s} ${u}. What is its area in ${u}²?`, s * s, `${s} ${X} ${s} = ${s * s} ${u}².`); } },
}});

const factPairs = A => { const p = []; for (let a = 1; a * a <= A; a++) if (A % a === 0) p.push([a, A / a]); return p; };
const PMEAS = [['a fence around a garden', 0], ['a frame around a photo', 0], ['a ribbon around the edge of a card', 0], ['a path around a pond', 0], ['lights along the edge of a roof', 0], ['a border around a bulletin board', 0], ['how far you run around a field', 0], ['tape around the edge of a table', 0], ['lace to sew around a pillow', 0], ['a wall around a park', 0],
  ['carpet for a floor', 1], ['paint for a wall', 1], ['grass seed for a lawn', 1], ['tiles to cover a bathroom floor', 1], ['wrapping paper to cover a box top', 1], ['a tablecloth to cover a table', 1], ['a rug for a bedroom', 1], ['solar panels to cover a roof', 1], ['a poster to cover a board', 1], ['plastic to cover a pool', 1], ['a string of flags around a playground', 0], ['trim around a doorway', 0], ['a fence for a dog run', 0], ['turf to cover a sports field', 1], ['a sheet of glass for a window', 1], ['mulch to cover a flower bed', 1]];
E2.skill({ id: 'II.9.09', name: 'Perimeter vs area', steps: {
  a: { t: 'same perimeter, different areas', g: (R, O) => { const u = UL(O).s, S = R.int(6, 12), k = R.int(0, 2);
    if (k === 0) { const all = []; for (let a = 1; 2 * a <= S; a++) all.push([a, S - a]); const best = all[all.length - 1], rest = R.sample(all.slice(0, -1), Math.min(3, all.length - 1));
      return choice(R, `All these rectangles have a perimeter of ${2 * S} ${u}. Which has the greatest area?`, `${best[0]} by ${best[1]}`, rest.map(p => `${p[0]} by ${p[1]}`), `Areas: ${all.map(p => `${p[0]} ${X} ${p[1]} = ${p[0] * p[1]}`).join(', ')}. The squarest one wins.`); }
    const [a, c] = R.distinct(1, Math.floor(S / 2), 2), b = S - a, d = S - c;
    if (k === 1) return num(`Both rectangles have a perimeter of ${2 * S} ${u}. What is the area of each?`, [{label: 'A', ans: a * b}, {label: 'B', ans: c * d}], `A: ${a} ${X} ${b} = ${a * b} ${u}². B: ${c} ${X} ${d} = ${c * d} ${u}². Same perimeter, different areas.`, {visual: V.side([{svg: V9.rect(b, a, {bottom: `${b}`, left: `${a}`, maxW: 230, maxH: 130}), caption: 'A'}, {svg: V9.rect(d, c, {bottom: `${d}`, left: `${c}`, maxW: 230, maxH: 130}), caption: 'B'}])});
    return num(`A ${a} by ${b} and a ${c} by ${d} rectangle have the same perimeter. How much greater is the larger area?`, Math.abs(a * b - c * d), `Areas ${a * b} and ${c * d}; the difference is ${Math.abs(a * b - c * d)} ${u}².`); } },
  b: { t: 'same area, different perimeters', g: (R, O) => { const u = UL(O).s, k = R.int(0, 2);
    if (k === 0) { const A = R.pick([12, 16, 18, 20, 24, 30, 36, 40, 48]), P = factPairs(A), best = P[P.length - 1];
      return choice(R, `All these rectangles have an area of ${A} ${u}². Which has the smallest perimeter?`, `${best[0]} by ${best[1]}`, R.sample(P.slice(0, -1), 3).map(p => `${p[0]} by ${p[1]}`), `Perimeters: ${P.map(p => `${p[0]} by ${p[1]} → ${2 * (p[0] + p[1])}`).join(', ')}. The squarest has the least.`); }
    if (k === 1) { const A = R.pick([12, 16, 18, 20, 24, 30, 36]), [p, q] = R.sample(factPairs(A), 2);
      return num(`A ${p[0]} by ${p[1]} and a ${q[0]} by ${q[1]} rectangle both have area ${A} ${u}². What is the perimeter of each?`, [{label: `${p[0]} by ${p[1]}`, ans: 2 * (p[0] + p[1])}, {label: `${q[0]} by ${q[1]}`, ans: 2 * (q[0] + q[1])}], `2 ${X} (${p[0]} + ${p[1]}) = ${2 * (p[0] + p[1])} and 2 ${X} (${q[0]} + ${q[1]}) = ${2 * (q[0] + q[1])}.`); }
    const n = R.int(8, 14), s = R.int(Math.ceil(Math.sqrt(n + 1)), Math.floor((n + 1) / 2) - (n % 2 ? 0 : 0)); if (4 * s >= 2 * (n + 1) || s * s <= n) return again('II.9.09', 'b', R, O);
    const v9 = R.int(0, 3), tru = v9 % 2 === 0;
    return tf(`A 1 by ${n} rectangle has a bigger perimeter than a ${s} by ${s} square. ${['But it has a smaller area.', 'So it has a bigger area too.', 'The square has the bigger area.', 'They must have the same area.'][v9]}`, tru, `1 by ${n}: perimeter ${2 * (n + 1)}, area ${n}. ${s} by ${s}: perimeter ${4 * s}, area ${s * s}. More perimeter doesn't mean more area.`); } },
  c: { t: 'which one to measure', g: (R) => { const [w, a] = R.pick(PMEAS);
    return choiceFixed(`You need ${w}. Do you measure the perimeter or the area?`, ['Perimeter', 'Area'], a, a ? 'You are covering a flat surface, so you need the area.' : 'You are going around the edge, so you need the perimeter.'); } },
  d: { t: 'design problems', g: (R, O) => { const u = UL(O).b, k = R.int(0, 3);
    if (k === 0) { const S = R.int(6, 20), a = Math.floor(S / 2);
      return num(`You have ${2 * S} ${u} of fence for a rectangular pen with whole-number sides. What is the largest area you can fence, in ${u}²?`, a * (S - a), `Length + width = ${S}. The squarest choice is ${a} by ${S - a}: area ${a * (S - a)} ${u}².`); }
    if (k === 1) { const A = R.pick([12, 16, 18, 20, 24, 28, 30, 32, 36, 40, 45, 48]), P = factPairs(A), b = P[P.length - 1];
      return num(`A rectangle has an area of ${A} ${u}² and whole-number sides. What is the smallest perimeter it can have?`, 2 * (b[0] + b[1]), `Try the factor pairs of ${A}; the squarest is ${b[0]} by ${b[1]}, perimeter ${2 * (b[0] + b[1])} ${u}.`); }
    if (k === 2) { const S = R.int(5, 12), c = Math.floor(S / 2);
      return num(`How many different rectangles with whole-number sides have a perimeter of ${2 * S} ${u}?`, c, `Length + width = ${S}: ${Array.from({length: c}, (_, i) => `${i + 1} by ${S - i - 1}`).join(', ')}. That is ${c}.`); }
    const A = R.pick([12, 16, 18, 20, 24, 30, 36, 40, 48]), P = factPairs(A);
    return num(`How many different rectangles with whole-number sides have an area of ${A} ${u}²?`, P.length, `Factor pairs of ${A}: ${P.map(p => `${p[0]} by ${p[1]}`).join(', ')}. That is ${P.length}.`); } },
}});

/* ---- 3D: unit cubes and boxes in oblique view (back goes up-right) ---- */
const OB = {dx: 0.6, dy: 0.42};
const proj = (s, ox, oy) => (x, y, z) => [P1(ox + (x + y * OB.dx) * s), P1(oy - (z + y * OB.dy) * s)];
const face = (pts, fill, sw = 1.3) => `<path d="M${pts.map(p => p.join(' ')).join(' L')} Z" fill="${fill}" stroke="${C.ink}" stroke-width="${sw}" stroke-linejoin="round"/>`;
const CF = {front: '#9CC3EA', top: '#D6E7F8', side: '#6FA3D6'};
// cubes: list of [x,y,z]; fits in maxW × maxH
V9.cubes = function (list, o = {}) {
  const Xm = Math.max(...list.map(c => c[0])) + 1, Ym = Math.max(...list.map(c => c[1])) + 1, Zm = Math.max(...list.map(c => c[2])) + 1;
  const s = Math.min(o.s || 34, ((o.maxW || 300) - 12) / (Xm + Ym * OB.dx), ((o.maxH || 220) - 12) / (Zm + Ym * OB.dy));
  const W = (Xm + Ym * OB.dx) * s + 12, H = (Zm + Ym * OB.dy) * s + 12, T = proj(s, 6, H - 6);
  let b = '';
  list.slice().sort((a, c) => c[1] - a[1] || a[2] - c[2] || a[0] - c[0]).forEach(([x, y, z]) => {
    b += face([T(x, y, z), T(x + 1, y, z), T(x + 1, y, z + 1), T(x, y, z + 1)], CF.front) + face([T(x, y, z + 1), T(x + 1, y, z + 1), T(x + 1, y + 1, z + 1), T(x, y + 1, z + 1)], CF.top) + face([T(x + 1, y, z), T(x + 1, y + 1, z), T(x + 1, y + 1, z + 1), T(x + 1, y, z + 1)], CF.side);
  });
  if (o.title) b += V.text(W / 2, H + 14, o.title, {size: 16, weight: 700});
  return V.svg(P1(W), P1(H + (o.title ? 26 : 0)), b, 'unit cubes');
};
const boxCubes = (l, w, h) => { const L = []; for (let x = 0; x < l; x++) for (let y = 0; y < w; y++) for (let z = 0; z < h; z++) L.push([x, y, z]); return L; };
// solid boxes: list of {x,y,z,l,w,h}; labels: [{at:[x,y,z], text, anchor, dx, dy}] in model coords
V9.boxes = function (list, labels = [], o = {}) {
  const Xm = Math.max(...list.map(b => b.x + b.l)), Ym = Math.max(...list.map(b => b.y + b.w)), Zm = Math.max(...list.map(b => b.z + b.h)), pad = o.pad || 66;
  const s = o.s || Math.min(((o.maxW || 340) - 2 * pad) / (Xm + Ym * OB.dx), ((o.maxH || 220) - 2 * 30) / (Zm + Ym * OB.dy));
  const W = (Xm + Ym * OB.dx) * s + 2 * pad, H = (Zm + Ym * OB.dy) * s + 60, T = proj(s, pad, H - 30);
  let b = '';
  list.forEach(({x, y, z, l, w, h, fill}) => {
    b += face([T(x, y, z), T(x + l, y, z), T(x + l, y, z + h), T(x, y, z + h)], fill || CF.front, 2) + face([T(x, y, z + h), T(x + l, y, z + h), T(x + l, y + w, z + h), T(x, y + w, z + h)], CF.top, 2) + face([T(x + l, y, z), T(x + l, y + w, z), T(x + l, y + w, z + h), T(x + l, y, z + h)], CF.side, 2);
  });
  if (o.under) b += V.text(P1(W / 2), P1(H - 8), o.under, {size: 15, weight: 600, fill: C.muted});
  labels.forEach(L => { const [px, py] = T(...L.at); b += V.text(P1(px + (L.dx || 0)), P1(py + (L.dy || 0)), L.text, {size: 15, weight: 600, anchor: L.anchor || 'middle'}); });
  return V.svg(P1(W), P1(H), b, 'box');
};
// one labelled box l × w × h (labels are strings; '' to hide)
const box1 = (l, w, h, tl, tw, th, o = {}) => V9.boxes([{x: 0, y: 0, z: 0, l, w, h}], [
  tl ? {at: [l / 2, 0, 0], text: tl, dy: 14} : null, th ? {at: [0, 0, h / 2], text: th, anchor: 'end', dx: -8} : null, tw ? {at: [l, w / 2, 0], text: tw, anchor: 'start', dx: 10, dy: 6} : null].filter(Boolean), o);
const tripleStr = t => `${t[0]} by ${t[1]} by ${t[2]}`;

E2.skill({ id: 'II.9.10', name: 'Volume by counting cubes', steps: {
  a: { t: 'unit cubes', g: (R) => {
    if (R.bool()) { const n = R.int(2, 5), hs = Array.from({length: n}, () => R.int(1, 4)), L = []; hs.forEach((h, x) => { for (let z = 0; z < h; z++) L.push([x, 0, z]); });
      const t = hs.reduce((a, b) => a + b, 0); return num('How many unit cubes are there?', t, `Count each stack: ${hs.join(' + ')} = ${t} cubes.`, {visual: V9.cubes(L)}); }
    const l = R.int(2, 5), w = R.int(2, 3); return num('How many unit cubes are in this layer?', l * w, `${w} rows of ${l}: ${l * w} cubes.`, {visual: V9.cubes(boxCubes(l, w, 1))}); } },
  b: { t: 'layers', g: (R) => { const l = R.int(2, 5), w = R.int(2, 4), h = R.int(2, 4);
    return num(`This box is built from unit cubes. How many cubes are in each layer, and in all?`, [{label: 'each layer', ans: l * w}, {label: 'in all', ans: l * w * h}], `Each layer is ${l} ${X} ${w} = ${l * w} cubes. ${h} layers: ${l * w} ${X} ${h} = ${l * w * h}. Count the hidden cubes too.`, {visual: V9.cubes(boxCubes(l, w, h))}); } },
  c: { t: 'compare', g: (R) => { const same = R.bool(0.25); let A, B;
    if (same) { const S = R.pick([[[2, 3, 4], [2, 2, 6]], [[2, 2, 4], [4, 2, 2]], [[3, 2, 2], [2, 3, 2]], [[4, 3, 1], [2, 3, 2]], [[2, 2, 3], [3, 4, 1]], [[1, 4, 3], [2, 2, 3]]]); [A, B] = R.shuffle(S); }
    else { do { A = [R.int(1, 5), R.int(1, 3), R.int(1, 4)]; B = [R.int(1, 5), R.int(1, 3), R.int(1, 4)]; } while (A[0] * A[1] * A[2] === B[0] * B[1] * B[2]); }
    const va = A[0] * A[1] * A[2], vb = B[0] * B[1] * B[2], ans = va > vb ? 0 : va < vb ? 1 : 2;
    return choiceFixed('Which box is made of more unit cubes?', ['A', 'B', 'Same'], ans, `A: ${A.join(' ' + X + ' ')} = ${va}. B: ${B.join(' ' + X + ' ')} = ${vb}. ${ans === 2 ? 'The same.' : (ans ? 'B' : 'A') + ' has more.'}`, {visual: V.side([V9.cubes(boxCubes(...A), {title: 'A', s: 26, maxW: 220, maxH: 170}), V9.cubes(boxCubes(...B), {title: 'B', s: 26, maxW: 220, maxH: 170})], {gap: 30})}); } },
  d: { t: 'build a given volume', g: (R) => { const k = R.int(0, 2);
    if (k === 0) { const V0 = R.pick([12, 16, 18, 20, 24, 30, 36]), tr = []; for (let a = 1; a <= 6; a++) for (let b = a; b <= 6; b++) for (let c = b; c <= 12; c++) if (a * b * c === V0) tr.push([a, b, c]);
      const t = R.pick(tr), wr = []; for (let a = 1; a <= 5; a++) for (let b = a; b <= 5; b++) for (let c = b; c <= 8; c++) if (a * b * c !== V0 && Math.abs(a * b * c - V0) <= 8) wr.push([a, b, c]);
      const sum = wr.filter(w => w[0] + w[1] + w[2] === V0), pool = R.sample(sum, 1).concat(R.sample(wr, 3));
      return choice(R, `Which box is built from exactly ${V0} unit cubes?`, tripleStr(t), pool.map(tripleStr).filter(s => s !== tripleStr(t)).slice(0, 3), `${t.join(' ' + X + ' ')} = ${V0}. Multiply the 3 edges; don't add them.`); }
    if (k === 1) { const a = R.int(2, 5), b = R.int(2, 4), h = R.int(2, 6);
      return num(`The bottom layer of a box is ${a} by ${b} cubes. How many layers are needed to use ${a * b * h} cubes?`, h, `Each layer holds ${a * b}. ${a * b * h} ÷ ${a * b} = ${h} layers.`); }
    const a = R.int(2, 5), b = R.int(2, 4), c = R.int(2, 4);
    return num(`This ${a} by ${b} by ${c} box is built from cubes. How many more cubes make it one layer taller?`, a * b, `One more layer is ${a} ${X} ${b} = ${a * b} cubes.`, {visual: V9.cubes(boxCubes(a, b, c), {maxH: 200})}); } },
}});

E2.skill({ id: 'II.9.11', name: 'Volume of boxes', steps: {
  a: { t: 'l × w × h', g: (R, O) => { const u = UL(O).s, l = R.int(2, 12), w = R.int(2, 8), h = R.int(2, 10), vis = box1(l, w, h, `${l} ${u}`, `${w} ${u}`, `${h} ${u}`), V0 = l * w * h, ex = `V = ${l} ${X} ${w} ${X} ${h} = ${V0} ${u}³.`;
    if (R.bool(0.3)) return choice(R, 'What is the volume of this box?', `${V0} ${u}³`, [`${l + w + h} ${u}³`, `${l * w} ${u}³`, `${V0} ${u}²`], ex + ' Multiply all three edges.', {visual: vis});
    return num(`What is the volume of this box, in ${u}³?`, V0, ex, {visual: vis}); } },
  b: { t: 'base × height', g: (R, O) => { const u = UL(O).s, B = R.int(2, 15) * R.pick([2, 3, 4]), h = R.int(2, 10);
    if (R.bool()) return num(`A box has a base of area ${B} ${u}² and a height of ${h} ${u}. What is its volume, in ${u}³?`, B * h, `V = base ${X} height = ${B} ${X} ${h} = ${B * h} ${u}³.`, {visual: box1(5, 3, 3.5, '', '', `${h} ${u}`, {maxW: 260, maxH: 190, under: `base: ${B} ${u}²`})});
    return num(`A box has a volume of ${B * h} ${u}³ and a base of area ${B} ${u}². How tall is it?`, h, `Height = volume ÷ base = ${B * h} ÷ ${B} = ${h} ${u}.`); } },
  c: { t: 'combined boxes', g: (R, O) => { const u = UL(O).s, L = R.int(5, 10), W = R.int(2, 5), H1 = R.int(2, 5), l2 = R.int(2, L - 2), H2 = R.int(2, 5), v1 = L * W * H1, v2 = l2 * W * H2;
    if (R.bool(0.3)) { const [a, b, c] = [R.int(2, 6), R.int(2, 5), R.int(2, 5)], [d, e, f] = [R.int(2, 6), R.int(2, 5), R.int(2, 5)];
      return num(`What is the total volume of both boxes, in ${u}³?`, a * b * c + d * e * f, `${a} ${X} ${b} ${X} ${c} = ${a * b * c} and ${d} ${X} ${e} ${X} ${f} = ${d * e * f}. Total ${a * b * c + d * e * f} ${u}³.`, {visual: V.side([box1(a, b, c, `${a} ${u}`, `${b} ${u}`, `${c} ${u}`, {s: 15}), box1(d, e, f, `${d} ${u}`, `${e} ${u}`, `${f} ${u}`, {s: 15})], {gap: 4})}); }
    const vis = V9.boxes([{x: 0, y: 0, z: 0, l: L, w: W, h: H1}, {x: 0, y: 0, z: H1, l: l2, w: W, h: H2}], [
      {at: [L / 2, 0, 0], text: `${L} ${u}`, dy: 14}, {at: [0, 0, H1 / 2], text: `${H1} ${u}`, anchor: 'end', dx: -8}, {at: [0, 0, H1 + H2 / 2], text: `${H2} ${u}`, anchor: 'end', dx: -8},
      {at: [L, W / 2, 0], text: `${W} ${u}`, anchor: 'start', dx: 10, dy: 6}, {at: [l2 / 2, W, H1 + H2], text: `${l2} ${u}`, dy: -12}], {maxW: 360, maxH: 250});
    return num(`This solid is made of two boxes. What is its volume, in ${u}³?`, v1 + v2, `Bottom: ${L} ${X} ${W} ${X} ${H1} = ${v1}. Top: ${l2} ${X} ${W} ${X} ${H2} = ${v2}. Total ${v1 + v2} ${u}³.`, {visual: vis}); } },
  d: { t: 'word problems', g: (R, O) => { const k = R.int(0, 4), u = UL(O).s, U = UL(O).b;
    if (k === 0) { const [l, w, h] = metric(O) ? [R.pick([40, 50, 60]), R.pick([20, 25, 30]), R.pick([20, 25, 30])] : [R.pick([20, 24, 30]), R.pick([10, 12]), R.pick([12, 16])];
      return num(`A fish tank is ${l} ${u} long, ${w} ${u} wide and ${h} ${u} tall. What is its volume in ${u}³?`, l * w * h, `${l} ${X} ${w} ${X} ${h} = ${fmt(l * w * h)} ${u}³.`); }
    if (k === 1) { const l = R.int(2, 6), w = R.int(2, 5), d = R.int(1, 2);
      return num(`A sandbox is ${l} ${U} by ${w} ${U}. It is filled with sand ${d} ${U} deep. How much sand, in ${U}³?`, l * w * d, `${l} ${X} ${w} ${X} ${d} = ${l * w * d} ${U}³.`); }
    if (k === 2) { const l = R.int(3, 6), w = R.int(2, 5), h = R.int(3, 6), f = R.int(1, h - 1);
      return num(`A ${l} by ${w} by ${h} box is being filled with unit cubes. ${f} full layers are in. How many more cubes are needed?`, l * w * (h - f), `Each layer is ${l * w}. ${h - f} layers are left: ${l * w} ${X} ${h - f} = ${l * w * (h - f)}.`); }
    if (k === 3) { const [a, b, c] = [R.int(1, 3), R.int(1, 3), R.int(1, 2)], [p, q, r] = [R.int(2, 4), R.int(2, 3), R.int(2, 3)];
      return num(`How many ${a} by ${b} by ${c} boxes fit exactly in a ${a * p} by ${b * q} by ${c * r} crate?`, p * q * r, `${a * p} ÷ ${a} = ${p}, ${b * q} ÷ ${b} = ${q}, ${c * r} ÷ ${c} = ${r}. ${p} ${X} ${q} ${X} ${r} = ${p * q * r} boxes.`); }
    const l = R.int(3, 10), w = R.int(2, 6), h = R.int(2, 9);
    return num(`A box holds ${l * w * h} ${u}³. Its base is ${l} ${u} by ${w} ${u}. How tall is it?`, h, `Base = ${l} ${X} ${w} = ${l * w}. ${l * w * h} ÷ ${l * w} = ${h} ${u}.`); } },
}});


/* =================== II.9.12 – II.9.16 lines, angles, triangles =================== */
const arrowHead = (A, B, col = C.ink) => { const [ux, uy] = unit(A, B), s = 10, w = 5;
  return `<path d="M${P1(B[0])} ${P1(B[1])} L${P1(B[0] - ux * s - uy * w)} ${P1(B[1] - uy * s + ux * w)} L${P1(B[0] - ux * s + uy * w)} ${P1(B[1] - uy * s - ux * w)} Z" fill="${col}"/>`; };
const seg = (A, B, o = {}) => `<line x1="${P1(A[0])}" y1="${P1(A[1])}" x2="${P1(B[0])}" y2="${P1(B[1])}" stroke="${o.col || C.ink}" stroke-width="${o.w || 2.5}"${o.dash ? ' stroke-dasharray="6 5"' : ''}/>`;
// geometric figure in screen coords inside W × H: items {type:'point'|'segment'|'line'|'ray', p, q, names:[..]}
const geoItem = (it) => { const {type, p, q} = it; let b = '';
  if (type === 'point') b += V.dot(p[0], p[1], 5, C.ink);
  else { b += seg(p, q); if (type === 'line') b += arrowHead(q, p) + arrowHead(p, q); if (type === 'ray') b += V.dot(p[0], p[1], 5, C.ink) + arrowHead(p, q); if (type === 'segment') b += V.dot(p[0], p[1], 5, C.ink) + V.dot(q[0], q[1], 5, C.ink); }
  (it.names || []).forEach(([t, at]) => b += lab(at[0], at[1] - 16, t, {size: 15, weight: 700}));
  return b; };
const rotAbout = (c, deg) => ([x, y]) => { const a = rad(deg), dx = x - c[0], dy = y - c[1]; return [P1(c[0] + dx * Math.cos(a) - dy * Math.sin(a)), P1(c[1] + dx * Math.sin(a) + dy * Math.cos(a))]; };
V9.geo = (type, R, o = {}) => { const W = o.W || 220, H = o.H || 100, c = [W / 2, H / 2 + 8], rot = rotAbout(c, o.rot !== undefined ? o.rot : R.int(-25, 25));
  if (type === 'point') return V.svg(W, H, geoItem({type, p: c}), 'point');
  const A = rot([c[0] - 60, c[1]]), B = rot([c[0] + (type === 'segment' ? 60 : 30), c[1]]);
  let b = geoItem({type, p: type === 'line' ? rot([c[0] - 88, c[1]]) : A, q: type === 'segment' ? B : rot([c[0] + 88, c[1]])});
  if (o.names) b += V.dot(A[0], A[1], 4.5, C.ink) + V.dot(B[0], B[1], 4.5, C.ink) + lab(A[0], A[1] - 17, o.names[0], {size: 15, weight: 700}) + lab(B[0], B[1] - 17, o.names[1], {size: 15, weight: 700});
  return V.svg(W, H, b, type); };
// a pair of lines in a small panel. kind: 'par' | 'conv' | 'perp' | 'oblique'
const linePair = (R, kind, x0 = 0, y0 = 0, tag) => { const W = 150, H = 110, c = [x0 + W / 2, y0 + H / 2 + 4], th = R.int(-35, 35) + (R.bool(0.2) ? 90 : 0);
  const L = (cen, deg, len = 104) => { const u = [Math.cos(rad(deg)), Math.sin(rad(deg))]; return [[cen[0] - u[0] * len / 2, cen[1] - u[1] * len / 2], [cen[0] + u[0] * len / 2, cen[1] + u[1] * len / 2]]; };
  const nrm = [-Math.sin(rad(th)), Math.cos(rad(th))];
  let lines;
  if (kind === 'par' || kind === 'conv') { const d = kind === 'par' ? 0 : R.pick([-1, 1]) * R.int(7, 13), off = 17;
    lines = [L([c[0] + nrm[0] * off, c[1] + nrm[1] * off], th), L([c[0] - nrm[0] * off, c[1] - nrm[1] * off], th + d)]; }
  else { const ang = kind === 'perp' ? 90 : R.pick([R.int(45, 70), R.int(110, 135)]), sh = R.int(-25, 25);
    lines = [L(c, th), L([c[0] + Math.cos(rad(th)) * sh, c[1] + Math.sin(rad(th)) * sh], th + ang, 86)]; }
  let b = lines.map(([p, q]) => seg(p, q, {w: 2.2}) + arrowHead(q, p) + arrowHead(p, q)).join('');
  if (tag) b += lab(x0 + 12, y0 + 12, tag, {size: 16, weight: 700, fill: C.blue});
  return b; };
const pairsPic = (R, kinds) => { const tags = ['A', 'B', 'C', 'D']; let b = '';
  kinds.forEach((k, i) => { const x0 = (i % 2) * 160, y0 = Math.floor(i / 2) * 120; b += `<rect x="${x0 + 2}" y="${y0 + 2}" width="152" height="114" rx="8" fill="none" stroke="${C.line}"/>` + linePair(R, k, x0 + 2, y0 + 4, tags[i]); });
  return V.svg(318, Math.ceil(kinds.length / 2) * 120, b, 'pairs of lines'); };
// quadrilateral ABCD for side questions: kind 'rect' | 'para' | 'trap'
const quadABCD = (R, kind) => { const w = R.int(5, 8), h = R.int(3, 4), s = R.int(1, 2);
  const P = kind === 'rect' ? [[0, 0], [w, 0], [w, h], [0, h]] : kind === 'para' ? [[0, 0], [w, 0], [w + s, h], [s, h]] : [[0, 0], [w + 2, 0], [w, h], [s, h]];
  const names = R.pick([['A', 'B', 'C', 'D'], ['P', 'Q', 'R', 'S'], ['W', 'X', 'Y', 'Z']]);
  return {names, svg: V9.poly(P, {names, right: kind === 'rect' ? [0, 1, 2, 3] : [], maxW: 280, maxH: 170, fill: C.amber + '22'})}; };

E2.skill({ id: 'II.9.12', name: 'Points, lines and rays', steps: {
  a: { t: 'point, line, segment', g: (R) => { const k = R.int(0, 2), T = ['point', 'line', 'segment'], N = ['Point', 'Line', 'Line segment'];
    if (k === 0) { const i = R.int(0, 2); return choiceFixed('What is this?', N, i, ['A point is a single dot: an exact spot.', 'A line goes on forever both ways: arrows on both ends.', 'A line segment has two endpoints.'][i], {visual: V9.geo(T[i], R)}); }
    if (k === 1) { const [p, a, e] = R.pick([['How many endpoints does a line segment have?', 2, 'A segment stops at both ends: 2 endpoints.'], ['How many endpoints does a line have?', 0, 'A line never ends, so it has 0 endpoints.'], ['How many points are needed to name a line segment?', 2, 'Name it by its two endpoints, like AB.']]); return num(p, a, e); }
    const n = R.int(3, 6), pts = Array.from({length: n}, (_, i) => [Math.cos(rad(90 + 360 * i / n)) * (0.8 + R.f() * 0.3), Math.sin(rad(90 + 360 * i / n)) * (0.8 + R.f() * 0.3)]);
    return num('How many line segments make the sides of this shape?', n, `Each side is a segment between two corners: ${n} sides, ${n} segments.`, {visual: V9.poly(pts, {maxW: 200, maxH: 170})}); } },
  b: { t: 'ray', g: (R) => { const k = R.int(0, 3), T = ['point', 'line', 'segment', 'ray'], N = ['Point', 'Line', 'Line segment', 'Ray'];
    if (k === 0) { const i = R.pick([1, 2, 3, 3]); return choiceFixed('What is this?', N, i, ['', 'Arrows on both ends: a line goes on forever both ways.', 'Two endpoints: a line segment.', 'One endpoint and an arrow: a ray starts at a point and goes on forever one way.'][i], {visual: V9.geo(T[i], R)}); }
    if (k === 1) return num('How many endpoints does a ray have?', 1, 'A ray starts at one endpoint and goes on forever the other way.');
    if (k === 2) { const n = R.int(3, 6), c = [110, 90], a0 = R.int(0, 60); let b = V.dot(c[0], c[1], 5, C.ink) + lab(c[0] - 14, c[1] + 14, 'O', {size: 15, weight: 700});
      const angs = []; for (let i = 0; i < n; i++) angs.push(a0 + i * 360 / n + R.int(-12, 12));
      angs.forEach(a => { const q = [c[0] + Math.cos(rad(a)) * 75, c[1] - Math.sin(rad(a)) * 75]; b += seg(c, q) + arrowHead(c, q); });
      return num('How many rays start at point O?', n, `Each ray starts at O and has one arrow: ${n} rays.`, {visual: V.svg(220, 180, b, 'rays')}); }
    const [a, b2] = R.pick([['A', 'B'], ['P', 'Q'], ['M', 'N'], ['X', 'Y']]), rot = R.int(-20, 20);
    const pic = (type, names) => V9.geo(type, R, {rot, names, W: 200, H: 80});
    const ex = `Ray ${a}${b2} starts at ${a} and goes on through ${b2}.`;
    return choice(R, `Which picture shows ray ${a}${b2}?`, pic('ray', [a, b2]), [pic('ray', [b2, a]), pic('segment', [a, b2]), pic('line', [a, b2])], ex); } },
  c: { t: 'parallel', g: (R) => { const k = R.int(0, 2);
    if (k === 0) { const kinds = R.shuffle(['par', 'conv', 'conv', R.pick(['oblique', 'conv'])]);
      return choiceFixed('Which pair of lines is parallel?', ['A', 'B', 'C', 'D'], kinds.indexOf('par'), 'Parallel lines stay the same distance apart and never meet. The others would meet if you extended them.', {visual: pairsPic(R, kinds)}); }
    if (k === 1) { const kind = R.pick(['rect', 'para', 'trap']), {names: [A, B, Cc, D], svg} = quadABCD(R, kind);
      return choice(R, `Which side is parallel to ${A}${B}?`, `${D}${Cc}`, [`${B}${Cc}`, `${A}${D}`, `${A}${Cc}`], `${D}${Cc} is across from ${A}${B} and runs the same way; they never meet.`, {visual: svg}); }
    const [s, t, e] = R.pick([['Two lines that don\'t cross on the page must be parallel.', false, 'They might meet if you extend them. Parallel means they never meet at all.'], ['Parallel lines never meet, however far they go.', true, 'That is what parallel means.'],
      ['Parallel lines stay the same distance apart.', true, 'The gap between them never changes, so they never meet.'], ['The two rails of a straight train track are parallel.', true, 'They stay the same distance apart.'], ['Two sides of a triangle can be parallel.', false, 'Any two sides of a triangle meet at a corner.'], ['A rectangle has 2 pairs of parallel sides.', true, 'Opposite sides of a rectangle are parallel.'], ['Parallel lines cross at exactly one point.', false, 'Parallel lines never cross at all.'], ['A rectangle has only 1 pair of parallel sides.', false, 'Both pairs of opposite sides of a rectangle are parallel: 2 pairs.']]);
    return tf(s, t, e); } },
  d: { t: 'perpendicular', g: (R) => { const k = R.int(0, 2);
    if (k === 0) { const kinds = R.shuffle(['perp', 'oblique', 'oblique', 'par']);
      return choiceFixed('Which pair of lines is perpendicular?', ['A', 'B', 'C', 'D'], kinds.indexOf('perp'), 'Perpendicular lines meet at a right angle, like the corner of a page.', {visual: pairsPic(R, kinds)}); }
    if (k === 1) { const {names: [A, B, Cc, D], svg} = quadABCD(R, 'rect'), ok = R.bool() ? `${B}${Cc}` : `${A}${D}`;
      return choice(R, `Which side is perpendicular to ${A}${B}?`, ok, [`${D}${Cc}`, `${A}${Cc}`], `${ok} meets ${A}${B} at a right angle. ${D}${Cc} is parallel to ${A}${B}.`, {visual: svg}); }
    const kind = R.pick(['perp', 'par', 'oblique']), ans = {perp: 0, par: 1, oblique: 2}[kind];
    return choiceFixed('These two lines are:', ['Perpendicular', 'Parallel', 'Neither'], ans, ['They cross at a right angle: perpendicular.', 'They never meet: parallel.', 'They cross, but not at a right angle: neither.'][ans], {visual: V.svg(156, 118, linePair(R, kind, 2, 4), 'two lines')}); } },
}});

// one angle: deg between arm1 (direction rot, math degrees) and arm2; o: L1, L2, label, square, names [on arm1, vertex, on arm2], noArc
V9.angle = function (deg, o = {}) {
  const rot = o.rot || 0, L1 = o.L1 || 120, L2 = o.L2 || 120, V0 = [0, 0], d1 = rad(rot), d2 = rad(rot + deg);
  const A = [Math.cos(d1) * L1, Math.sin(d1) * L1], B = [Math.cos(d2) * L2, Math.sin(d2) * L2];
  const f = fit([V0, A, B], o.maxW || 280, o.maxH || 190, 30, 30), [v, a, b2] = [V0, A, B].map(f.T);
  let s = seg(v, a, {w: 3}) + seg(v, b2, {w: 3});
  if (deg === 90 && o.square !== false) s += rightMark(v, a, b2, 16);
  else if (!o.noArc) { const r = o.r || 30, u = unit(v, a), w = unit(v, b2), big = deg > 180 ? 1 : 0;
    s += `<path d="M${P1(v[0] + u[0] * r)} ${P1(v[1] + u[1] * r)} A${r} ${r} 0 ${big} 0 ${P1(v[0] + w[0] * r)} ${P1(v[1] + w[1] * r)}" fill="none" stroke="${C.red}" stroke-width="2.2"/>`; }
  if (o.label) { const m = rad(rot + deg / 2); s += lab(v[0] + Math.cos(m) * 52, v[1] - Math.sin(m) * 52, o.label, {size: 15, fill: C.red}); }
  if (o.names) { const [n1, n2, n3] = o.names, m = rad(rot + deg / 2); s += V.dot(a[0], a[1], 4, C.ink) + V.dot(b2[0], b2[1], 4, C.ink) + V.dot(v[0], v[1], 4, C.ink);
    s += lab(a[0] + Math.cos(d1) * 16, a[1] - Math.sin(d1) * 16, n1, {size: 16, weight: 700}) + lab(b2[0] + Math.cos(d2) * 16, b2[1] - Math.sin(d2) * 16, n3, {size: 16, weight: 700}) + lab(v[0] - Math.cos(m) * 16, v[1] + Math.sin(m) * 16, n2, {size: 16, weight: 700}); }
  s = s + ''; return V.svg(f.W, f.H, s, 'angle');
};
const acuteDeg = R => R.int(4, 15) * 5, obtuseDeg = R => R.int(21, 32) * 5;
const kindOf = d => d < 90 ? 'Acute' : d === 90 ? 'Right' : d < 180 ? 'Obtuse' : 'Straight';
const kindWhy = {Acute: 'less than a right angle (under 90°)', Right: 'exactly a square corner: 90°', Obtuse: 'more than a right angle but less than a straight line', Straight: 'a straight line: 180°'};
E2.skill({ id: 'II.9.13', name: 'Angles', steps: {
  a: { t: 'an angle as a turn', g: (R) => { const k = R.int(0, 3);
    if (k === 0) { const [t, v] = R.pick([['A quarter turn', 90], ['A half turn', 180], ['A three-quarter turn', 270], ['A full turn', 360]]); return num(`${t} is how many degrees?`, v, v === 360 ? `A full turn goes all the way round: 360°.` : `A full turn is 360°, so ${t.toLowerCase()} is ${v}°.`); }
    if (k === 1) { const [t, v] = R.pick([['a full turn', 4], ['a half turn', 2], ['a three-quarter turn', 3]]); return num(`How many right angles make ${t}?`, v, `A right angle is a quarter turn, 90°. ${t[0].toUpperCase() + t.slice(1)} is ${v * 90}° = ${v} right angles.`); }
    if (k === 2) { const a = R.int(0, 11), n = R.int(1, 11), b = (a + n) % 12 || 12, a1 = a || 12;
      if (n % 3 === 0 && R.bool()) { const nm = ['a quarter turn', 'a half turn', 'a three-quarter turn'][n / 3 - 1];
        return choice(R, `The minute hand turns from ${a1} to ${b}. How far does it turn?`, nm, ['a quarter turn', 'a half turn', 'a three-quarter turn', 'a full turn'].filter(x => x !== nm), `${n} of the 12 numbers is ${fh(n, 12)} of a full turn: ${nm}.`); }
      return num(`The minute hand turns clockwise from ${a1} to ${b}. How many degrees is that?`, 30 * n, `Each number is 360 ÷ 12 = 30°. ${n} number${n === 1 ? '' : 's'}: ${n} ${X} 30 = ${30 * n}°.`); }
    const big = R.int(9, 26) * 5, same = R.bool(0.2), small = same ? big : big - R.int(3, 8) * 5, swap = R.bool();
    const pBig = V9.angle(big, {L1: 55, L2: 55, rot: R.int(0, 30), maxW: 180, maxH: 150}), pSmall = V9.angle(small, {L1: 130, L2: 130, rot: R.int(0, 30), maxW: 180, maxH: 150});
    const ans = same ? 2 : swap ? 1 : 0, pics = swap ? [pSmall, pBig] : [pBig, pSmall];
    return choiceFixed('Which angle is bigger?', ['A', 'B', 'Same'], ans, `Longer arms don't make a bigger angle. Look at the turn between the arms: ${same ? 'they are the same.' : (swap ? 'B' : 'A') + ' turns more.'}`, {visual: V.side([{svg: pics[0], caption: 'A'}, {svg: pics[1], caption: 'B'}])}); } },
  b: { t: 'right, acute, obtuse', g: (R) => { const k = R.pick(['Acute', 'Right', 'Obtuse']), d = k === 'Acute' ? acuteDeg(R) : k === 'Right' ? 90 : obtuseDeg(R), N = ['Acute', 'Right', 'Obtuse'];
    if (R.bool(0.3)) { const dd = k === 'Right' ? 90 : k === 'Acute' ? R.int(5, 89) : R.int(91, 175); return choiceFixed(`An angle of ${dd}° is:`, N, N.indexOf(kindOf(dd)), `${dd}° is ${kindWhy[kindOf(dd)]}.`); }
    return choiceFixed('What kind of angle is this?', N, N.indexOf(k), `This angle is ${kindWhy[k]}.`, {visual: V9.angle(d, {rot: R.int(0, 11) * 30 - 180 * 0 + R.int(-10, 10), L1: R.int(90, 130), L2: R.int(90, 130)})}); } },
  c: { t: 'straight angle', g: (R) => { const k = R.int(0, 2), N = ['Acute', 'Right', 'Obtuse', 'Straight'];
    if (k === 0) { const [p, v, e] = R.pick([['A straight angle is how many degrees?', 180, 'A straight angle is a half turn: 180°.'], ['How many right angles make a straight angle?', 2, '90° + 90° = 180°.'], ['A straight angle and a right angle together make how many degrees?', 270, '180° + 90° = 270°.'], ['How many straight angles make a full turn?', 2, '180° + 180° = 360°.']]); return num(p, v, e); }
    if (k === 1) { const d = R.pick([180, 180, acuteDeg(R), obtuseDeg(R), 90]); return choiceFixed('What kind of angle is this?', N, N.indexOf(kindOf(d)), `This angle is ${kindWhy[kindOf(d)]}.`, {visual: V9.angle(d, {rot: R.int(-15, 15), r: 26})}); }
    const x = R.int(3, 33) * 5; return num(`A straight angle is split into two angles. One is ${x}°. What is the other?`, 180 - x, `A straight angle is 180°: 180 ${M} ${x} = ${180 - x}°.`, {visual: V9.parts([x, 180 - x], [`${x}°`, '?'])}); } },
  d: { t: 'name angles', g: (R) => { const L = R.pick([['A', 'B', 'C'], ['P', 'Q', 'R'], ['D', 'E', 'F'], ['X', 'Y', 'Z'], ['L', 'M', 'N'], ['R', 'S', 'T']]), k = R.int(0, 1);
    if (k === 0) { const [a, b, c] = R.shuffle(L); return choice(R, `What is the vertex of ∠${a}${b}${c}?`, b, [a, c], `The middle letter names the vertex: ${b}.`); }
    const d = R.pick([acuteDeg(R), obtuseDeg(R), 90]), [a, b, c] = L;
    return choice(R, 'Which is a name for the marked angle?', `∠${a}${b}${c}`, [`∠${b}${a}${c}`, `∠${a}${c}${b}`, `∠${b}${c}${a}`], `The vertex ${b} goes in the middle: ∠${a}${b}${c} (or ∠${c}${b}${a}).`, {visual: V9.angle(d, {rot: R.int(-10, 30), names: [a, b, c], L1: 120, L2: 110})}); } },
}});

// protractor: base arm at 0° (right) or 180° (left); arms: math angles to draw; dots: [{deg, t}]
V9.prot = function (o = {}) {
  const r = 150, cx = r + 40, cy = r + 34, W = 2 * r + 80, H = cy + 26, pt = (rr, d) => [P1(cx + rr * Math.cos(rad(d))), P1(cy - rr * Math.sin(rad(d)))];
  let b = `<path d="M${cx - r} ${cy} A${r} ${r} 0 0 1 ${cx + r} ${cy} Z" fill="#F7EDD2" fill-opacity="0.85" stroke="${C.ink}" stroke-width="2"/>`;
  b += `<path d="M${cx - r + 52} ${cy} A${r - 52} ${r - 52} 0 0 1 ${cx + r - 52} ${cy}" fill="none" stroke="${C.line}" stroke-width="1"/>`;
  for (let d = 0; d <= 180; d += 5) { const L = d % 10 ? 7 : 13, [x1, y1] = pt(r, d), [x2, y2] = pt(r - L, d); b += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${C.ink}" stroke-width="${d % 10 ? 1 : 1.6}"/>`; }
  for (let d = 0; d <= 180; d += 10) { const [ox, oy] = pt(r - 22, d), [ix, iy] = pt(r - 42, d); b += V.text(ox, oy, 180 - d, {size: 10.5, weight: 600, fill: C.ink}) + V.text(ix, iy, d, {size: 10, weight: 500, fill: C.blue}); }
  b += `<line x1="${cx - r}" y1="${cy}" x2="${cx + r}" y2="${cy}" stroke="${C.ink}" stroke-width="1.5"/>` + V.dot(cx, cy, 3, C.ink);
  (o.arms || []).forEach(d => { const [x, y] = pt(r + 28, d); b += `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="${C.red}" stroke-width="3" stroke-linecap="round"/>`; });
  (o.dots || []).forEach(({deg, t}) => { const [x, y] = pt(r + 2, deg), [tx, ty] = pt(r + 18, deg); b += V.dot(x, y, 5, C.teal) + lab(tx, ty, t, {size: 15, weight: 700, fill: C.teal}); });
  return V.svg(W, H, b, 'protractor');
};
const protAngle = (R, lo = 3, hi = 33, step = 5) => { let x; do { x = R.int(lo, hi) * step; } while (Math.abs(x - 90) < 10); return x; };
E2.skill({ id: 'II.9.14', name: 'Measure angles', steps: {
  a: { t: 'the protractor', g: (R) => { const k = R.int(0, 2);
    if (k === 0) { const left = R.bool(), x = protAngle(R, 2, 16, 10), arms = left ? [180, 180 - x] : [0, x];
      return choiceFixed('The bottom arm lines up with 0 on which scale?', ['The outer scale', 'The inner scale'], left ? 0 : 1, `Follow the bottom arm to the edge: 0 is on the ${left ? 'outer' : 'inner'} scale there, so read that scale.`, {visual: V9.prot({arms})}); }
    if (k === 1) return choice(R, 'Where does the center mark of the protractor go?', 'On the vertex of the angle', ['At the end of an arm', 'Anywhere along an arm', 'Inside the angle, near the arc'], 'Center on the vertex, then put 0 on one arm.');
    const left = R.bool(), x = protAngle(R, 2, 16, 10), arms = left ? [180, 180 - x] : [0, x];
    return num(`The bottom arm is on 0 of the ${left ? 'outer' : 'inner'} scale. What does that scale read on the other arm?`, x, `Read the ${left ? 'outer' : 'inner'} scale where the other arm crosses it: ${x}°.`, {visual: V9.prot({arms})}); } },
  b: { t: 'measure', g: (R) => { const left = R.bool(), x = R.bool() ? protAngle(R, 2, 16, 10) : protAngle(R, 3, 33, 5), arms = left ? [180, 180 - x] : [0, x];
    return choice(R, 'How big is the red angle?', `${x}°`, [`${180 - x}°`, `${x + 10}°`, `${x - 10}°`], `The bottom arm is on 0 of the ${left ? 'outer' : 'inner'} scale, so read that scale: ${x}°. It is ${x < 90 ? 'acute, so it must be under 90°' : 'obtuse, so it must be over 90°'}.`, {visual: V9.prot({arms})}); } },
  c: { t: 'draw an angle', g: (R) => { let x; do { x = R.int(4, 32) * 5; } while (Math.abs(x - 90) < 20);
    const cand = R.shuffle([x, 180 - x, x + R.pick([10, -10]), 180 - x + R.pick([10, -10])]), T = ['A', 'B', 'C', 'D'];
    return choiceFixed(`The bottom arm is on 0 of the inner scale. To draw a ${x}° angle, which dot should the second arm go through?`, T, cand.indexOf(x), `Count up the inner scale from its 0 to ${x}. The dot where the outer scale reads ${x} is the trap: on the inner scale it is ${180 - x}.`, {visual: V9.prot({arms: [0], dots: cand.map((d, i) => ({deg: d, t: T[i]}))})}); } },
  d: { t: 'estimate first', g: (R) => {
    if (R.bool()) { const S = [20, 30, 45, 60, 120, 135, 150, 160], x = R.pick(S), wr = S.filter(v => Math.abs(v - x) >= 25 && v !== 180 - x), d = R.sample(wr, 2).concat([180 - x]);
      return choice(R, 'Estimate: about how big is this angle?', `${x}°`, d.map(v => `${v}°`), `Compare with a right angle (90°): it is ${x < 90 ? 'smaller' : 'bigger'}, and ${x}° fits best.`, {visual: V9.angle(x, {rot: R.int(-20, 20), L1: 120, L2: 120})}); }
    const left = R.bool(), x = protAngle(R), arms = left ? [180, 180 - x] : [0, x];
    return choiceFixed(`The arm crosses ${Math.min(x, 180 - x)} on one scale and ${Math.max(x, 180 - x)} on the other. First decide: acute or obtuse? Which is the angle?`, [`${Math.min(x, 180 - x)}°`, `${Math.max(x, 180 - x)}°`], x < 90 ? 0 : 1, `The angle is ${x < 90 ? 'acute (smaller than a square corner)' : 'obtuse (wider than a square corner)'}, so it is ${x}°.`, {visual: V9.prot({arms})}); } },
}});

// adjacent angles from a vertex: parts (degrees) drawn from rot; labels per part; o.total label on outer arc
V9.parts = function (parts, labels, o = {}) {
  const rot = o.rot || 0, tot = parts.reduce((a, b) => a + b, 0), full = tot >= 359.9, L = 120, rays = [rot]; parts.forEach(p => rays.push(rays[rays.length - 1] + p));
  const pts = rays.map(d => [Math.cos(rad(d)) * L, Math.sin(rad(d)) * L]);
  const f = fit([[0, 0], ...pts, ...(full ? [[L, 0], [-L, 0], [0, L], [0, -L]] : [])], o.maxW || 300, o.maxH || 220, 26, 26), v = f.T([0, 0]);
  let b = (full ? rays.slice(0, -1) : rays).map((d, i) => seg(v, f.T(pts[i]), {w: 2.6})).join('');
  parts.forEach((p, i) => { const a0 = rays[i], a1 = rays[i + 1], r = 30 + (i % 2) * 8, m = rad((a0 + a1) / 2);
    if (Math.abs(p - 90) < 0.1 && o.square) b += rightMark(v, f.T(pts[i]), f.T(pts[i + 1]), 15);
    else b += `<path d="M${P1(v[0] + Math.cos(rad(a0)) * r)} ${P1(v[1] - Math.sin(rad(a0)) * r)} A${r} ${r} 0 ${p > 180 ? 1 : 0} 0 ${P1(v[0] + Math.cos(rad(a1)) * r)} ${P1(v[1] - Math.sin(rad(a1)) * r)}" fill="none" stroke="${C.set[i % 7]}" stroke-width="2.4"/>`;
    const rr = p < 35 ? 78 : 58; b += lab(v[0] + Math.cos(m) * rr, v[1] - Math.sin(m) * rr, labels[i], {size: 15, fill: labels[i] === '?' ? C.ink : C.set[i % 7]}); });
  if (o.total) { const r = 92, a0 = rays[0], a1 = rays[rays.length - 1], bi = parts.indexOf(Math.max(...parts)), m = rad((rays[bi] + rays[bi + 1]) / 2);
    b += `<path d="M${P1(v[0] + Math.cos(rad(a0)) * r)} ${P1(v[1] - Math.sin(rad(a0)) * r)} A${r} ${r} 0 ${tot > 180 ? 1 : 0} 0 ${P1(v[0] + Math.cos(rad(a1)) * r)} ${P1(v[1] - Math.sin(rad(a1)) * r)}" fill="none" stroke="${C.ink}" stroke-width="1.6" stroke-dasharray="5 4"/>`;
    b += lab(v[0] + Math.cos(m) * (r + 18), v[1] - Math.sin(m) * (r + 18), o.total, {size: 15}); }
  return V.svg(f.W, f.H, b, 'angles');
};
const splitSum = (R, total, k, lo = 15) => { for (let t = 0; t < 100; t++) { const cuts = R.distinct(lo / 5, (total - lo) / 5, k - 1).map(v => v * 5).sort((a, b) => a - b), pts = [0, ...cuts, total], parts = pts.slice(1).map((v, i) => v - pts[i]); if (parts.every(p => p >= lo)) return parts; } return null; };
E2.skill({ id: 'II.9.15', name: 'Add angles', steps: {
  a: { t: 'angles side by side add', g: (R) => { const a = R.int(6, 16) * 5, b = R.int(6, 16) * 5; if (a + b > 170) return again('II.9.15', 'a', R);
    return num('The two angles are side by side. What is the whole angle, in degrees?', a + b, `Angles side by side add: ${a}° + ${b}° = ${a + b}°.`, {visual: V9.parts([a, b], [`${a}°`, `${b}°`], {rot: R.int(0, 30), total: '?'})}); } },
  b: { t: 'find a missing angle', g: (R) => { const k = R.int(0, 2), T = k === 0 ? 90 : k === 1 ? 180 : R.int(20, 34) * 5, a = R.int(3, T / 5 - 3) * 5, b = T - a, first = R.bool();
    const labels = first ? ['?', `${b}°`] : [`${a}°`, '?'], ans = first ? a : b;
    return num(`What is the missing angle, in degrees?`, ans, `${T === 180 ? 'Angles on a straight line make 180°' : T === 90 ? 'The parts make a right angle, 90°' : `The whole angle is ${T}°`}: ${T} ${M} ${first ? b : a} = ${ans}°.`, {visual: V9.parts([a, b], labels, {rot: T === 180 ? 0 : R.int(0, 30), total: T === 90 ? '90°' : T === 180 ? '' : `${T}°`})}); } },
  c: { t: 'around a point is 360°', g: (R) => { const k = R.int(3, 4), parts = splitSum(R, 360, k, 40), i = R.int(0, k - 1), ans = parts[i], rest = parts.filter((_, j) => j !== i), s = rest.reduce((a, b) => a + b, 0);
    const vis = V9.parts(parts, parts.map((p, j) => j === i ? '?' : `${p}°`), {rot: R.int(0, 60), square: true}), ex = `Angles around a point make 360°: 360 ${M} ${rest.join(' ' + M + ' ')} = ${ans}°.`;
    if (R.bool(0.3) && s < 180) return choice(R, 'What is the missing angle?', `${ans}°`, [`${180 - s}°`, `${ans + 10}°`, `${s}°`], ex + ' Not 180°: that is only for a straight line.', {visual: vis});
    return num('What is the missing angle, in degrees?', ans, ex, {visual: vis}); } },
  d: { t: 'word problems', g: (R) => { const k = R.int(0, 4);
    if (k === 0) { const a = R.int(4, 12) * 5, b = R.int(3, 10) * 5; return num(`A door is open ${a}°. It swings open ${b}° more. How far open is it now, in degrees?`, a + b, `${a}° + ${b}° = ${a + b}°.`); }
    if (k === 1) { const n = R.int(1, 11); return num(`The minute hand moves from 12 to ${n}. How many degrees does it turn?`, 30 * n, `Each of the 12 steps is 360 ÷ 12 = 30°: ${n} ${X} 30 = ${30 * n}°.`); }
    if (k === 2) { const a = R.int(4, 20) * 5, b = R.int(4, 20) * 5; if (a + b >= 350) return again('II.9.15', 'd', R); return num(`A skater turns ${a}°, then ${b}° more. How many more degrees to make a full turn?`, 360 - a - b, `A full turn is 360°: 360 ${M} ${a} ${M} ${b} = ${360 - a - b}°.`); }
    if (k === 3) { const n = R.pick([3, 4, 5, 6, 8, 9, 10, 12]); return num(`A round pizza is cut from the center into ${n} equal slices. What angle does each slice make at the center?`, 360 / n, `All the way round is 360°: 360 ÷ ${n} = ${360 / n}°.`); }
    const x = R.int(4, 16) * 5; return num(`A ladder leans on flat ground, making a ${x}° angle on one side. What angle does it make on the other side?`, 180 - x, `The two angles lie on a straight line, so they make 180°: 180 ${M} ${x} = ${180 - x}°.`); } },
}});

// triangle by angles at A, B (base AB) → points; returns svg with angle labels / ticks / right mark
const triByAngles = (al, be) => { const ga = 180 - al - be, AC = Math.sin(rad(be)) / Math.sin(rad(ga)); return [[0, 0], [1, 0], [AC * Math.cos(rad(al)), AC * Math.sin(rad(al))]]; };
const triPic = (angs, o = {}) => { const [a, b, c] = angs, P = triByAngles(a, b), opp = [a, b, c];
  // side i (P[i]→P[i+1]) is opposite vertex (i+2)%3
  const sideAng = [c, a, b], ticksArr = sideAng.map(x => { const same = sideAng.filter(y => y === x).length; return same === 3 ? 1 : same === 2 ? 1 : 0; });
  const angles = {}; if (o.labels !== false) [0, 1, 2].forEach(i => { if (!(opp[i] === 90 && o.square)) angles[i] = `${opp[i]}°`; });
  return V9.poly(P, {angles, ticks: o.ticks ? ticksArr : [], right: o.square ? [0, 1, 2].filter(i => opp[i] === 90) : [], maxW: 300, maxH: 235, fill: C.violet + '22'}); };
const TRI = {
  'Right isosceles': R => [90, 45, 45], 'Right scalene': R => { const a = R.pick([25, 30, 35, 40, 50, 55, 60, 65]); return [90, a, 90 - a]; },
  'Obtuse isosceles': R => { const b = R.int(4, 8) * 5; return [180 - 2 * b, b, b]; }, 'Obtuse scalene': R => { for (;;) { const o = R.int(20, 26) * 5, a = R.int(4, (180 - o) / 5 - 4) * 5, b = 180 - o - a; if (a !== b) return [o, a, b]; } },
  'Acute equilateral': R => [60, 60, 60], 'Acute isosceles': R => { const b = R.pick([50, 55, 65, 70, 75]); return [180 - 2 * b, b, b]; }, 'Acute scalene': R => { for (;;) { const a = R.int(9, 17) * 5, b = R.int(9, 17) * 5, c = 180 - a - b; if (c < 90 && c >= 40 && new Set([a, b, c]).size === 3) return [a, b, c]; } }};
E2.skill({ id: 'II.9.16', name: 'Classify triangles', steps: {
  a: { t: 'by sides', g: (R, O) => { const u = UL(O).s, kind = R.pick(['Equilateral', 'Isosceles', 'Scalene']); let s;
    if (kind === 'Equilateral') { const a = R.int(3, 12); s = [a, a, a]; }
    else if (kind === 'Isosceles') { let a, b; do { a = R.int(4, 12); b = R.int(3, 14); } while (b === a || b >= 2 * a - 1 || b < a / 2); s = R.shuffle([a, a, b]); }
    else { do { s = [R.int(3, 12), R.int(3, 12), R.int(4, 14)]; } while (new Set(s).size < 3 || s[0] + s[1] <= s[2] + 1 || s[0] + s[2] <= s[1] + 1 || s[1] + s[2] <= s[0] + 1); }
    const [a, b, c] = s, N = ['Equilateral', 'Isosceles', 'Scalene'];
    return choiceFixed('Name this triangle by its sides.', N, N.indexOf(kind), {Equilateral: 'All 3 sides are equal: equilateral.', Isosceles: 'Exactly 2 sides are equal: isosceles.', Scalene: 'No sides are equal: scalene.'}[kind], {visual: V9.poly(triPts(a, b, c), {labels: [`${c} ${u}`, `${a} ${u}`, `${b} ${u}`], maxW: 300, maxH: 200, fill: C.violet + '22'})}); } },
  b: { t: 'by angles', g: (R) => { const kind = R.pick(['Acute', 'Right', 'Obtuse']), key = kind === 'Acute' ? R.pick(['Acute scalene', 'Acute isosceles', 'Acute equilateral', 'Acute scalene']) : R.pick([kind + ' scalene', kind + ' isosceles']);
    const angs = R.shuffle(TRI[key](R)), N = ['Acute', 'Right', 'Obtuse'];
    return choiceFixed('Name this triangle by its angles.', N, N.indexOf(kind), {Acute: 'All 3 angles are less than 90°: acute.', Right: 'One angle is 90°: right.', Obtuse: 'One angle is more than 90°: obtuse.'}[kind], {visual: triPic(angs)}); } },
  c: { t: 'both', g: (R) => { const names = Object.keys(TRI), key = R.pick(names), angs = R.shuffle(TRI[key](R));
    const pool = names.filter(n => n !== key && !(key === 'Acute equilateral' && n === 'Acute isosceles'));
    return choice(R, 'Name this triangle by its angles and its sides.', key, R.sample(pool, 3), `${key.split(' ')[0]}: ${{Acute: 'all angles under 90°', Right: 'one angle is 90°', Obtuse: 'one angle over 90°'}[key.split(' ')[0]]}. ${key.split(' ')[1][0].toUpperCase() + key.split(' ')[1].slice(1)}: ${{isosceles: '2 equal sides (marked)', scalene: 'no equal sides', equilateral: 'all 3 sides equal'}[key.split(' ')[1]]}.`, {visual: triPic(angs, {ticks: true})}); } },
  d: { t: 'which are possible', g: (R) => {
    if (R.bool(0.55)) { const [s, ok, e] = R.pick([['a right equilateral triangle', false, 'Every equilateral triangle has three 60° angles, so none is 90°.'], ['an obtuse equilateral triangle', false, 'Every equilateral triangle has three 60° angles: it is always acute.'],
      ['a triangle with two right angles', false, 'Two right angles already use 180°, leaving nothing for the third angle.'], ['a triangle with two obtuse angles', false, 'Two angles over 90° add to more than 180°.'], ['a right isosceles triangle', true, '90°, 45°, 45° works.'],
      ['an obtuse isosceles triangle', true, '120°, 30°, 30° works.'], ['a right scalene triangle', true, '90°, 30°, 60° works.'], ['an acute scalene triangle', true, '50°, 60°, 70° works.'], ['an obtuse scalene triangle', true, '100°, 30°, 50° works.'], ['an acute isosceles triangle', true, '70°, 70°, 40° works.']]);
      return yn(`Can there be ${s}?`, ok, e); }
    const a = R.int(4, 20) * 5, b = R.int(4, 20) * 5, good = R.bool(), c = good ? 180 - a - b : 180 - a - b + R.pick([-20, -10, 10, 20]); if (c <= 0 || a + b >= 175) return again('II.9.16', 'd', R);
    return yn(`Can a triangle have angles of ${a}°, ${b}° and ${c}°?`, good, `The angles of a triangle add to 180°. ${a} + ${b} + ${c} = ${a + b + c}${good ? ', so yes.' : ', not 180, so no.'}`); } },
}});

/* =================== II.9.17 – II.9.18 quadrilaterals, symmetry =================== */
const vsub = (a, b) => [a[0] - b[0], a[1] - b[1]], crs = (u, v) => u[0] * v[1] - u[1] * v[0], dotp = (u, v) => u[0] * v[0] + u[1] * v[1], len2 = u => u[0] * u[0] + u[1] * u[1];
// exact facts about an integer quadrilateral (vertices in order). Trapezoid = EXACTLY one pair of parallel sides.
const quadInfo = P => { const e = [0, 1, 2, 3].map(i => vsub(P[(i + 1) % 4], P[i])), L = e.map(len2), turns = e.map((u, i) => crs(u, e[(i + 1) % 4]));
  const convex = turns.every(t => t > 0) || turns.every(t => t < 0), p1 = crs(e[0], e[2]) === 0, p2 = crs(e[1], e[3]) === 0, pairs = +p1 + +p2;
  const right = [0, 1, 2, 3].filter(i => dotp(e[(i + 3) % 4], e[i]) === 0), eq = L.every(x => x === L[0]);
  const kite = !eq && ((L[0] === L[1] && L[2] === L[3]) || (L[1] === L[2] && L[3] === L[0]));
  const name = pairs === 2 ? (right.length === 4 ? (eq ? 'Square' : 'Rectangle') : (eq ? 'Rhombus' : 'Parallelogram')) : pairs === 1 ? 'Trapezoid' : kite ? 'Kite' : 'Quadrilateral';
  return {P, L, pairs, right, eq, convex, name}; };
const QNAMES = ['Quadrilateral', 'Parallelogram', 'Rectangle', 'Rhombus', 'Square'];
const QPROP = {Quadrilateral: [], Parallelogram: ['par'], Rectangle: ['par', 'right'], Rhombus: ['par', 'eq'], Square: ['par', 'right', 'eq']};
const QWORD = {par: '2 pairs of parallel sides', right: '4 right angles', eq: '4 equal sides'};
const qfits = (nm, q) => nm === 'Trapezoid' ? q.pairs === 1 : QPROP[nm].every(p => p === 'par' ? q.pairs === 2 : p === 'right' ? q.right.length === 4 : q.eq);
const isSub = (x, y) => QPROP[y].every(p => QPROP[x].includes(p));   // every x is a y
const lc = s => s.toLowerCase();
const QGEN = {
  Square: R => { const [a, b] = R.pick([[2, 0], [3, 0], [4, 0], [5, 0], [2, 1], [3, 1], [1, 2], [2, 2], [3, 2], [1, 3]]); return [[0, 0], [a, b], [a - b, a + b], [-b, a]]; },
  Rectangle: R => { if (R.bool(0.65)) { const a = R.int(2, 7), c = R.int(1, 5); return a === c ? null : [[0, 0], [a, 0], [a, c], [0, c]]; }
    const [u, v] = R.pick([[[1, 1], [-1, 1]], [[2, 1], [-1, 2]], [[1, 2], [-2, 1]], [[3, 1], [-1, 3]]]), m = R.int(1, 3), n = R.int(1, 2); if (m === n) return null;
    return [[0, 0], [u[0] * m, u[1] * m], [u[0] * m + v[0] * n, u[1] * m + v[1] * n], [v[0] * n, v[1] * n]]; },
  Rhombus: R => { if (R.bool(0.6)) { const a = R.int(1, 4), b = R.int(1, 3); return a === b ? null : [[a, 0], [2 * a, b], [a, 2 * b], [0, b]]; }
    const [u, v] = R.pick([[[2, 1], [1, 2]], [[3, 1], [1, 3]], [[4, 1], [1, 4]], [[3, 2], [2, 3]], [[5, 0], [3, 4]], [[5, 0], [4, 3]]]); return [[0, 0], u, [u[0] + v[0], u[1] + v[1]], v]; },
  Parallelogram: R => { if (R.bool(0.7)) { const a = R.int(3, 6), s = R.pick([-2, -1, 1, 2, 3]), h = R.int(2, 4); return [[0, 0], [a, 0], [a + s, h], [s, h]]; }
    const a = R.int(2, 4), b = R.pick([1, 2, -1]), h = R.int(2, 4); return [[0, 0], [a, b], [a, b + h], [0, h]]; },
  Trapezoid: R => { const a = R.int(4, 7), h = R.int(2, 4), k = R.int(0, 2);
    if (k === 0) { const t = R.int(1, a - 2); if ((a - t) % 2) return null; const s = (a - t) / 2; return [[0, 0], [a, 0], [s + t, h], [s, h]]; }
    if (k === 1) { const t = R.int(1, a - 1); return [[0, 0], [a, 0], [t, h], [0, h]]; }
    const s = R.int(1, a - 1), t = R.int(1, a - 1); return s + t > a + 1 ? null : [[0, 0], [a, 0], [s + t, h], [s, h]]; },
  Kite: R => { const a = R.int(1, 3), b = R.int(1, 2), c = R.int(2, 5); return b === c ? null : [[0, b], [a, 0], [0, -c], [-a, 0]]; },
  Quadrilateral: R => [[0, 0], [R.int(3, 6), R.int(-1, 1)], [R.int(3, 6), R.int(3, 5)], [R.int(-1, 1), R.int(2, 4)]],
};
const D8 = [p => [p[0], p[1]], p => [-p[0], p[1]], p => [p[0], -p[1]], p => [-p[0], -p[1]], p => [p[1], p[0]], p => [-p[1], p[0]], p => [p[1], -p[0]], p => [-p[1], -p[0]]];
const makeQuad = (R, kind) => { for (let t = 0; t < 200; t++) { const raw = QGEN[kind](R); if (!raw) continue; const f = R.pick(D8), Q = raw.map(f), x0 = Math.min(...Q.map(p => p[0])), y0 = Math.min(...Q.map(p => p[1])), P = Q.map(p => [p[0] - x0, p[1] - y0]);
  if (Math.max(...P.map(p => p[0])) > 8 || Math.max(...P.map(p => p[1])) > 7) continue; const q = quadInfo(P); if (q.convex && q.name === kind) return q; }
  throw new Error('makeQuad ' + kind); };
// polygon with integer vertices on squared paper; equal sides get tick marks, right angles get squares
V9.gq = function (P, o = {}) { const n = P.length, mx = Math.max(...P.map(p => p[0])) + 2, my = Math.max(...P.map(p => p[1])) + 2, s = P1(Math.min(28, (o.maxW || 260) / mx, (o.maxH || 210) / my)), W = P1(mx * s + 4), H = P1(my * s + 4);
  const T = p => [P1(2 + (p[0] + 1) * s), P1(2 + (my - 1 - p[1]) * s)], Q = P.map(T);
  let b = ''; for (let i = 0; i <= mx; i++) b += `<line x1="${P1(2 + i * s)}" y1="2" x2="${P1(2 + i * s)}" y2="${P1(2 + my * s)}" stroke="${C.line}" stroke-width="1"/>`;
  for (let j = 0; j <= my; j++) b += `<line x1="2" y1="${P1(2 + j * s)}" x2="${P1(2 + mx * s)}" y2="${P1(2 + j * s)}" stroke="${C.line}" stroke-width="1"/>`;
  b += `<path d="M${Q.map(p => p.join(' ')).join(' L')} Z" fill="${o.fill || C.amber + '33'}" stroke="${C.ink}" stroke-width="2.5" stroke-linejoin="round"/>`;
  if (o.marks !== false) { const e = P.map((p, i) => vsub(P[(i + 1) % n], p)), L = e.map(len2), groups = [];
    L.forEach(l => { if (L.filter(x => x === l).length > 1 && !groups.includes(l)) groups.push(l); });
    L.forEach((l, i) => { const g = groups.indexOf(l); if (g >= 0) b += ticks(Q[i], Q[(i + 1) % n], g + 1); });
    P.forEach((p, i) => { if (dotp(e[(i + n - 1) % n], e[i]) === 0) b += rightMark(Q[i], Q[(i + n - 1) % n], Q[(i + 1) % n], Math.min(12, s * 0.45)); }); }
  return V.svg(W, H, b, o.label || 'shape on squared paper'); };
// quadrilateral family tree; blank = name shown as '?'
V9.tree = function (blank) { const bw = 170, bh = 48, pos = {Quadrilateral: [180, 30], Parallelogram: [180, 110], Rectangle: [92, 190], Rhombus: [268, 190], Square: [180, 270]};
  const sub = {Quadrilateral: '4 straight sides', Parallelogram: '2 pairs of parallel sides', Rectangle: '+ 4 right angles', Rhombus: '+ 4 equal sides', Square: 'right angles, equal sides'};
  let b = [['Quadrilateral', 'Parallelogram'], ['Parallelogram', 'Rectangle'], ['Parallelogram', 'Rhombus'], ['Rectangle', 'Square'], ['Rhombus', 'Square']].map(([a, c]) => seg([pos[a][0], pos[a][1] + bh / 2], [pos[c][0], pos[c][1] - bh / 2], {w: 2, col: C.muted})).join('');
  QNAMES.forEach(nm => { const [x, y] = pos[nm], q = nm === blank;
    b += `<rect x="${x - bw / 2}" y="${y - bh / 2}" width="${bw}" height="${bh}" rx="8" fill="${q ? C.amber + '33' : C.paper}" stroke="${q ? C.amber : C.ink}" stroke-width="2"/>`;
    b += V.text(x, y - 9, q ? '?' : nm, {size: 15, weight: 700}) + V.text(x, y + 11, sub[nm], {size: 11.5, fill: C.muted}); });
  return V.svg(360, 300, b, 'quadrilateral family tree'); };
const qBest = {Square: '4 equal sides and 4 right angles: a square. It is a rectangle and a rhombus too, but "square" says the most.',
  Rectangle: '4 right angles, but the sides are not all equal: a rectangle.', Rhombus: '4 equal sides, but no right angles: a rhombus.'};
const TRAPDEF = 'Here a trapezoid has exactly 1 pair of parallel sides (some books say at least 1).';

E2.skill({ id: 'II.9.17', name: 'Classify quadrilaterals', steps: {
  a: { t: 'square, rectangle, rhombus', g: (R) => { const N = ['Square', 'Rectangle', 'Rhombus'], k = R.int(0, 5);
    if (k <= 2) { const kind = R.pick(N), q = makeQuad(R, kind); return choiceFixed('What is the best name for this shape?', N, N.indexOf(kind), qBest[kind], {visual: V9.gq(q.P)}); }
    if (k === 3) { const [p, i] = R.pick([['4 equal sides and 4 right angles', 0], ['4 right angles, but its sides are not all equal', 1], ['4 equal sides, but no right angles', 2]]);
      return choiceFixed(`Which shape has ${p}?`, N, i, qBest[N[i]]); }
    const [p, y, e] = R.pick([['Is a square a rectangle?', true, 'Yes. A rectangle needs 4 right angles, and a square has them. It is the special rectangle with equal sides.'],
      ['Is every rectangle a square?', false, 'No. A rectangle has 4 right angles, but its sides need not all be equal.'], ['Is a square a rhombus?', true, 'Yes. A rhombus needs 4 equal sides, and a square has them.'],
      ['Is every rhombus a square?', false, 'No. A rhombus has 4 equal sides, but its angles need not be right angles.'], ['Can a rectangle also be a rhombus?', true, 'Yes, when all 4 sides are equal: then it is a square.'], ['Is every rhombus a rectangle?', false, 'No. A rhombus needs 4 equal sides, but its angles need not be right angles.'], ['Can a square have an angle that is not a right angle?', false, 'No. All 4 angles of a square are right angles.']]);
    if (k === 5 && R.bool()) { const q = makeQuad(R, 'Rhombus'); return yn('This shape is turned on its side. Is it a square?', false, 'No. Its 4 sides are equal, but its angles are not right angles: it is a rhombus. Turning a shape does not change its name.', {visual: V9.gq(q.P)}); }
    if (k === 5) { const q = makeQuad(R, 'Square'); if (q.L[0] === 4 || q.L[0] === 9 || q.L[0] === 16 || q.L[0] === 25) return again('II.9.17', 'a', R);
      return yn('This shape is turned on its side. Is it still a square?', true, 'Yes. Its 4 sides are equal and its 4 angles are right angles. Turning a shape does not change its name.', {visual: V9.gq(q.P)}); }
    return yn(p, y, e); } },
  b: { t: 'parallelogram, trapezoid', g: (R) => { const k = R.int(0, 4);
    if (k <= 1) { const kind = R.pick(['Parallelogram', 'Parallelogram', 'Trapezoid', 'Trapezoid', 'Kite', 'Quadrilateral']), q = makeQuad(R, kind), i = kind === 'Parallelogram' ? 0 : kind === 'Trapezoid' ? 1 : 2;
      return choiceFixed('Parallelogram, trapezoid (exactly 1 pair of parallel sides), or neither?', ['Parallelogram', 'Trapezoid', 'Neither'], i,
        ['Both pairs of opposite sides are parallel (check the grid): a parallelogram.', 'Exactly 1 pair of sides is parallel: a trapezoid.', 'No sides are parallel, so it is neither.'][i] + (i === 1 ? ' ' + TRAPDEF : ''), {visual: V9.gq(q.P)}); }
    if (k <= 3) { const kind = R.pick(['Parallelogram', 'Trapezoid', 'Trapezoid', 'Rectangle', 'Rhombus', 'Kite', 'Quadrilateral']), q = makeQuad(R, kind);
      return num('How many pairs of parallel sides does this shape have?', q.pairs, ['No two sides run the same way on the grid: 0 pairs.', 'Only one pair of opposite sides runs the same way: 1 pair.', 'Both pairs of opposite sides run the same way: 2 pairs.'][q.pairs], {visual: V9.gq(q.P)}); }
    const [p, c, d, e] = R.pick([['Which shape has exactly 1 pair of parallel sides?', 'Trapezoid', ['Parallelogram', 'Rectangle', 'Rhombus'], 'A trapezoid has exactly 1 pair; the others have 2.'],
      ['In a parallelogram, opposite sides are:', 'Parallel and equal', ['Perpendicular', 'Parallel but different lengths', 'Never equal'], 'Opposite sides of a parallelogram are parallel, and they are also equal in length.'],
      ['Which shape has 2 pairs of parallel sides?', 'Parallelogram', ['Trapezoid', 'Kite', 'Triangle'], 'A parallelogram has 2 pairs of parallel sides. ' + TRAPDEF],
      ['A trapezoid has how many pairs of parallel sides?', '1', ['0', '2', '4'], TRAPDEF]]);
    return choice(R, p, c, d, e); } },
  c: { t: 'the family tree', g: (R) => { const k = R.int(0, 2);
    if (k === 0) { const bl = R.pick(QNAMES); return choice(R, 'Which name goes in the ? box?', bl, R.sample(QNAMES.filter(x => x !== bl), 3), `Each shape below has everything the one above has, plus more. ${bl}: ${bl === 'Quadrilateral' ? 'any shape with 4 straight sides' : QPROP[bl].map(p => QWORD[p]).join(' and ')}.`, {visual: V9.tree(bl)}); }
    if (k === 1) { const q = makeQuad(R, R.pick(['Square', 'Square', 'Rectangle', 'Rhombus', 'Parallelogram', 'Trapezoid', 'Kite'])), ok = QNAMES.filter(nm => qfits(nm, q));
      return num('How many of these names fit this shape: quadrilateral, parallelogram, rectangle, rhombus, square?', ok.length, `Names that fit: ${ok.map(lc).join(', ')}. That is ${ok.length}.${q.name === 'Trapezoid' || q.name === 'Kite' ? ` (It is a ${lc(q.name)}, which is not on the list.)` : ''}`, {visual: V9.gq(q.P)}); }
    const x = R.pick(['Rectangle', 'Rhombus', 'Parallelogram']), sup = QNAMES.filter(y => y !== x && isSub(x, y)), c = R.pick(sup), d = ['Square', 'Rectangle', 'Rhombus', 'Parallelogram'].filter(y => y !== x && !isSub(x, y));
    return choice(R, `Every ${lc(x)} is also a:`, lc(c), d.map(lc), `A ${lc(x)} has ${QPROP[x].length ? QPROP[x].map(p => QWORD[p]).join(' and ') : '4 sides'}. That makes it a ${lc(c)}, but not always a ${d.map(lc).join(' or ')}.`); } },
  d: { t: 'true or false', g: (R) => { const k = R.int(0, 5);
    if (k <= 2) { const x = R.pick(QNAMES.slice(0, 4).concat(['Square', 'Rectangle'])), yes = QNAMES.filter(y => y !== x && isSub(x, y)), no = QNAMES.filter(y => y !== x && !isSub(x, y)), tru = yes.length && (!no.length || R.bool()), y = R.pick(tru ? yes : no);
      const miss = QPROP[y].filter(p => !QPROP[x].includes(p)).map(p => QWORD[p]);
      return tf(`Every ${lc(x)} is a ${lc(y)}.`, tru, tru ? `True: every ${lc(x)} has ${QPROP[y].length ? QPROP[y].map(p => QWORD[p]).join(' and ') : '4 straight sides'}, so it is a ${lc(y)}.` : `False: a ${lc(x)} doesn't have to have ${miss.join(' or ')}.`); }
    if (k <= 4) { const q = makeQuad(R, R.pick(['Square', 'Rectangle', 'Rhombus', 'Parallelogram', 'Trapezoid'])), nm = R.pick(q.name === 'Trapezoid' ? ['Trapezoid', 'Parallelogram', 'Rectangle'] : QNAMES.slice(1)), t = qfits(nm, q);
      const has = [q.pairs === 2 ? QWORD.par : q.pairs === 1 ? 'exactly 1 pair of parallel sides' : 'no parallel sides', q.right.length === 4 ? QWORD.right : '', q.eq ? QWORD.eq : ''].filter(Boolean).join(', ');
      return tf(`This shape is a ${lc(nm)}.`, t, `${t ? 'True' : 'False'}: it has ${has}. It is a ${lc(q.name)}${t && nm !== q.name ? `, so it is a ${lc(nm)} too` : ''}.${nm === 'Trapezoid' || q.name === 'Trapezoid' ? ' ' + TRAPDEF : ''}`, {visual: V9.gq(q.P)}); }
    const [s, t, e] = R.pick([['A parallelogram can have exactly 1 right angle.', false, 'If one angle of a parallelogram is 90°, all four are. Then it is a rectangle.'], ['A rhombus can have 4 right angles.', true, 'Then it is a square, the special rhombus with right angles.'],
      ['A trapezoid can have 2 right angles.', true, 'A right trapezoid has two 90° angles next to each other.'], ['A rectangle can have 4 equal sides.', true, 'Then it is a square, the special rectangle with equal sides.'],
      ['A square is not a rectangle, because its sides are all equal.', false, 'A square has 4 right angles, so it is a rectangle: the special one whose sides are all equal.'], ['Opposite sides of a parallelogram are equal.', true, 'Opposite sides of a parallelogram are parallel and equal in length.'],
      ['A shape with 4 equal sides must be a square.', false, 'A rhombus has 4 equal sides without right angles.']]);
    return tf(s, t, e); } },
}});

// symmetry of a convex polygon: axes must pass through the vertex centroid and a vertex or an edge midpoint
const reflect = (p, c, t) => { const dx = p[0] - c[0], dy = p[1] - c[1], cs = Math.cos(2 * t), sn = Math.sin(2 * t); return [c[0] + dx * cs + dy * sn, c[1] + dx * sn - dy * cs]; };
const sameSet = (A, B) => A.every(a => B.some(b => Math.hypot(a[0] - b[0], a[1] - b[1]) < 1e-6 * (1 + Math.hypot(b[0], b[1]))));
const centroid = P => [P.reduce((a, p) => a + p[0], 0) / P.length, P.reduce((a, p) => a + p[1], 0) / P.length];
const isAxis = (P, c, t) => sameSet(P.map(p => reflect(p, c, t)), P);
const modPi = t => ((t % Math.PI) + Math.PI) % Math.PI, angDist = (a, b) => { const d = Math.abs(modPi(a) - modPi(b)); return Math.min(d, Math.PI - d); };
const polyAxes = P => { const c = centroid(P), cand = [], ax = [];
  P.forEach((p, i) => { const q = P[(i + 1) % P.length]; cand.push(Math.atan2(p[1] - c[1], p[0] - c[0]), Math.atan2((p[1] + q[1]) / 2 - c[1], (p[0] + q[0]) / 2 - c[0])); });
  cand.forEach(t => { if (ax.some(a => angDist(a, t) < 1e-6)) return; if (isAxis(P, c, t)) ax.push(modPi(t)); });
  return ax; };
const reg = n => Array.from({length: n}, (_, i) => [Math.cos(rad(90 + 360 * i / n)), Math.sin(rad(90 + 360 * i / n))]);
const turn = (P, deg) => P.map(([x, y]) => [x * Math.cos(rad(deg)) - y * Math.sin(rad(deg)), x * Math.sin(rad(deg)) + y * Math.cos(rad(deg))]);
// named convex shapes → [points, expected number of lines]; the count is checked against polyAxes
const SSH = {
  'equilateral triangle': () => [reg(3), 3], 'square': () => [reg(4), 4], 'regular pentagon': () => [reg(5), 5], 'regular hexagon': () => [reg(6), 6], 'regular octagon': () => [reg(8), 8],
  'rectangle': R => { const w = R.int(4, 8), h = R.int(2, 5); return w < 1.25 * h || w > 2 * h ? null : [[[0, 0], [w, 0], [w, h], [0, h]], 2]; },
  'rhombus': R => { const a = R.int(2, 5), b = R.int(2, 4); return Math.abs(a - b) < 1 ? null : [[[a, 0], [0, b], [-a, 0], [0, -b]], 2]; },
  'parallelogram': R => { const w = R.int(4, 7), s = R.int(1, 3), h = R.int(2, 4); return w * w === s * s + h * h ? null : [[[0, 0], [w, 0], [w + s, h], [s, h]], 0]; },
  'isosceles trapezoid': R => { const w = R.int(5, 8), s = R.int(1, 2), h = R.int(2, 4); return [[[0, 0], [w, 0], [w - s, h], [s, h]], 1]; },
  'right trapezoid': R => { const w = R.int(5, 8), t = R.int(2, w - 2), h = R.int(2, 4); return [[[0, 0], [w, 0], [t, h], [0, h]], 0]; },
  'kite': R => { const a = R.int(2, 3), b = R.int(1, 2), c = R.int(3, 5); return [[[0, b], [a, 0], [0, -c], [-a, 0]], 1]; },
  'isosceles triangle': R => { const a = R.int(2, 4), h = R.int(2, 7); return a * a * 3 === h * h ? null : [[[-a, 0], [a, 0], [0, h]], 1]; },
  'scalene triangle': R => { const w = R.int(5, 8), s = R.int(0, w + 1), h = R.int(2, 5); return 2 * s === w ? null : [[[0, 0], [w, 0], [s, h]], 0]; },
  'quadrilateral': R => [[[0, 0], [R.int(5, 7), R.int(0, 1)], [R.int(4, 6), R.int(3, 5)], [R.int(0, 1), R.int(2, 4)]], 0],
};
const symShape = (R, name, spin = true) => { for (let t = 0; t < 100; t++) { const r = SSH[name](R); if (!r) continue; const P = spin ? turn(r[0], R.int(0, 11) * 15 + R.pick([0, 5])) : r[0], ax = polyAxes(P);
  if (ax.length === r[1]) return {P, ax, n: r[1], name}; } throw new Error('symShape ' + name); };
// block letters and figures on a grid (row 0 at top); symmetry of a cell set is checked on its bounding box
const LETTERS = {H: ['#.#', '#.#', '###', '#.#', '#.#'], T: ['###', '.#.', '.#.', '.#.', '.#.'], E: ['###', '#..', '###', '#..', '###'], F: ['###', '#..', '##.', '#..', '#..'], L: ['#..', '#..', '#..', '#..', '###'],
  U: ['#.#', '#.#', '#.#', '#.#', '###'], C: ['###', '#..', '#..', '#..', '###'], O: ['###', '#.#', '#.#', '#.#', '###'], I: ['###', '.#.', '.#.', '.#.', '###'], P: ['###', '#.#', '###', '#..', '#..'],
  Z: ['###', '..#', '.#.', '#..', '###'], A: ['.#.', '#.#', '###', '#.#', '#.#'], J: ['..#', '..#', '..#', '#.#', '###'], plus: ['.#.', '###', '.#.'], X: ['#...#', '.#.#.', '..#..', '.#.#.', '#...#'], S: ['###', '#..', '###', '..#', '###'], Y: ['#.#', '#.#', '.#.', '.#.', '.#.']};
const cellsOf = rows => { const c = []; rows.forEach((s, r) => [...s].forEach((ch, k) => { if (ch === '#') c.push([r, k]); })); return c; };
const cellAxes = cells => { const H = Math.max(...cells.map(p => p[0])) + 1, W = Math.max(...cells.map(p => p[1])) + 1, S = new Set(cells.map(p => p.join(','))), ok = f => cells.every(p => S.has(f(p).join(',')));
  const maps = [['vertical', ([r, c]) => [r, W - 1 - c]], ['horizontal', ([r, c]) => [H - 1 - r, c]]]; if (H === W) maps.push(['diagonal', ([r, c]) => [c, r]], ['diagonal', ([r, c]) => [W - 1 - c, H - 1 - r]]);
  return maps.filter(([, f]) => ok(f)).map(m => m[0]); };
const letterPic = (key, o = {}) => { const cells = cellsOf(LETTERS[key]), H = LETTERS[key].length, W = LETTERS[key][0].length; return V9.cells(H + 2, W + 2, cells.map(([r, c]) => [r + 1, c + 1]), Object.assign({size: 22, color: C.blue}, o)); };
const symCountWhy = {'equilateral triangle': 'one from each corner to the middle of the opposite side', square: '2 through the middles of opposite sides and 2 along the diagonals', 'regular pentagon': 'a regular shape with n sides has n lines', 'regular hexagon': 'a regular shape with n sides has n lines',
  'regular octagon': 'a regular shape with n sides has n lines', rectangle: 'across the middle both ways. Not the diagonals: fold along one and the halves don\'t match', rhombus: 'along both diagonals', parallelogram: 'no fold makes the halves match', 'isosceles trapezoid': 'through the middles of the 2 parallel sides',
  'right trapezoid': 'no fold makes the halves match', kite: 'the diagonal between the pairs of equal sides', 'isosceles triangle': 'from the corner between the equal sides to the middle of the opposite side', 'scalene triangle': 'with no equal sides, no fold makes the halves match', quadrilateral: 'no fold makes the halves match'};
const symLine = (P, c, t, ext, off = 0) => { let d = [Math.cos(t), Math.sin(t)]; if (d[1] < -1e-9 || (Math.abs(d[1]) < 1e-9 && d[0] < 0)) d = [-d[0], -d[1]];
  const o = [c[0] - d[1] * off, c[1] + d[0] * off]; return [[o[0] - d[0] * ext, o[1] - d[1] * ext], [o[0] + d[0] * ext, o[1] + d[1] * ext]]; };
// choose which end of each line carries its label, keeping the labels far apart
const spreadLabels = L => { const put = []; return L.map(([p, q]) => { const far = e => put.length ? Math.min(...put.map(u => Math.hypot(u[0] - e[0], u[1] - e[1]))) : 0, sw = far(p) > far(q) + 1e-9; put.push(sw ? p : q); return sw ? [q, p] : [p, q]; }); };
const extent = P => { const c = centroid(P); return Math.max(...P.map(p => Math.hypot(p[0] - c[0], p[1] - c[1]))); };
// half-drawn figure for "draw": cells left of a vertical mirror (or above a horizontal one when h)
const mirrorPic = (rows, cols, cells, h, o = {}) => { const s = o.size || 22, tr = h ? ([r, c]) => [c, r] : p => p, R0 = h ? cols : rows, C0 = h ? rows : cols;
  const g = V9.cells(R0, C0, cells.map(tr), {size: s, color: o.color || C.violet});
  const ax = h ? `<line x1="0" y1="${2 + (R0 / 2) * s}" x2="${C0 * s + 4}" y2="${2 + (R0 / 2) * s}" stroke="${C.red}" stroke-width="2.5" stroke-dasharray="7 5"/>` : `<line x1="${2 + (C0 / 2) * s}" y1="0" x2="${2 + (C0 / 2) * s}" y2="${R0 * s + 4}" stroke="${C.red}" stroke-width="2.5" stroke-dasharray="7 5"/>`;
  return g.replace('</svg>', ax + '</svg>'); };

E2.skill({ id: 'II.9.18', name: 'Lines of symmetry', steps: {
  a: { t: 'find', g: (R) => { const k = R.int(0, 3);
    if (k === 3) { const key = R.pick(['T', 'E', 'U', 'C', 'A', 'H', 'O', 'I', 'Y', 'F', 'L', 'P']), ax = cellAxes(cellsOf(LETTERS[key])), A = ['Up and down', 'Across', 'Both', 'Neither'];
      const v = ax.includes('vertical'), hz = ax.includes('horizontal'), i = v && hz ? 2 : v ? 0 : hz ? 1 : 3;
      return choiceFixed('Which fold line is a line of symmetry: up and down, across, both, or neither?', A, i, ['Fold it down the middle, top to bottom: the left and right halves match.', 'Fold it across the middle: the top and bottom halves match.', 'Both folds make the halves match.', 'Neither fold makes the halves match.'][i], {visual: letterPic(key)}); }
    const name = R.pick(['rectangle', 'rectangle', 'isosceles triangle', 'kite', 'isosceles trapezoid', 'rhombus']), S = symShape(R, name), c = centroid(S.P), ext = extent(S.P) * 1.3, t0 = R.pick(S.ax);
    const bad = []; for (let t = 0; t < 400 && bad.length < 12; t++) { const a = rad(R.int(0, 35) * 5); if (S.ax.some(x => angDist(x, a) < rad(30))) continue; bad.push(a); }
    // classic trap: a rectangle's diagonal
    const diag = name === 'rectangle' ? Math.atan2(S.P[2][1] - S.P[0][1], S.P[2][0] - S.P[0][0]) : null;
    if (k === 0) { const f1 = diag !== null ? diag : bad[0], f2 = bad.find(a => angDist(a, f1) > rad(30)), off = R.bool(0.35) || f2 === undefined;
      const lines = R.shuffle([[t0, 0, true], [f1, 0, false], off ? [t0, extent(S.P) * 0.5, false] : [f2, 0, false]]), T = ['A', 'B', 'C'];
      return choiceFixed('Which dashed line is a line of symmetry?', T, lines.findIndex(l => l[2]), `Fold along line ${T[lines.findIndex(l => l[2])]} and the two halves match exactly.${diag !== null ? ' A rectangle\'s diagonal is not a line of symmetry.' : ''}${off ? ' A line of symmetry must go through the middle of the shape.' : ''}`,
        {visual: V9.poly(S.P, {lines: spreadLabels(lines.map(l => symLine(S.P, c, l[0], ext, l[1]))).map((l, i) => l.concat(T[i])), maxW: 300, maxH: 230, pad: 20, padX: 20, fill: C.blue + '22'})}); }
    const yes = R.bool(), t = yes ? t0 : (diag !== null && R.bool() ? diag : bad[0]);
    return yn('Is the dashed line a line of symmetry?', yes, yes ? 'Yes. Fold along it and the two halves match exactly.' : `No. Fold along it and the halves don't match.${diag !== null && t === diag ? ' A rectangle\'s diagonal is not a line of symmetry.' : ''}`,
      {visual: V9.poly(S.P, {lines: [symLine(S.P, c, t, ext)], maxW: 300, maxH: 220, pad: 20, padX: 20, fill: C.blue + '22'})}); } },
  b: { t: 'count', g: (R) => { const k = R.int(0, 3);
    if (k === 3) { const key = R.pick(['H', 'T', 'E', 'O', 'I', 'U', 'C', 'A', 'X', 'plus', 'F', 'L', 'Z', 'Y']), ax = cellAxes(cellsOf(LETTERS[key])), n = ax.length;
      return num('How many lines of symmetry does this shape have?', n, n ? `${n} line${n > 1 ? 's' : ''}: ${ax.map(a => ({vertical: 'up and down', horizontal: 'across', diagonal: 'corner to corner'})[a]).join(', ').replace('corner to corner, corner to corner', 'both diagonals')}. Fold there and the halves match.` : 'None: no fold makes the two halves match.', {visual: letterPic(key)}); }
    const name = R.pick(Object.keys(SSH)), S = symShape(R, name);
    const ex = `${S.n} line${S.n === 1 ? '' : 's'}: ${symCountWhy[name]}.`;
    if (name === 'rectangle' && R.bool(0.4)) return choice(R, 'How many lines of symmetry does this rectangle have?', '2', ['4', '1', '0'], ex, {visual: V9.poly(S.P, {maxW: 240, maxH: 180, fill: C.blue + '22'})});
    return num('How many lines of symmetry does this shape have?', S.n, ex, {visual: V9.poly(S.P, {maxW: 240, maxH: 180, fill: C.blue + '22'})}); } },
  c: { t: 'draw', g: (R) => { const h = R.bool(0.35), rows = R.int(3, 5), k = R.int(3, 4), cols = 2 * k;
    for (let t = 0; t < 100; t++) { const P = polyo(R, R.int(3, 7), rows, k); const dc = k - P.W, dr = R.int(0, rows - P.H), S = P.cells.map(([r, c]) => [r + dr, c + dc]);
      const mir = S.map(([r, c]) => [r, cols - 1 - c]), key = L => L.map(p => p.join(',')).sort().join(';'), full = S.concat(mir);
      if (R.bool(0.4)) { const m = R.int(1, Math.min(3, mir.length)), keep = R.shuffle(mir).slice(m);
        return num(`Shade more squares so the dashed line is a line of symmetry. How many more squares are needed?`, m, `Each shaded square needs a partner the same distance from the line on the other side. ${m} partner${m > 1 ? 's are' : ' is'} missing.`, {visual: mirrorPic(rows, cols, S.concat(keep), h)}); }
      const slide = S.concat(S.map(([r, c]) => [r, c + k])), upside = S.concat(mir.map(([r, c]) => [rows - 1 - r, c]));
      if (new Set([key(full), key(slide), key(upside)]).size < 3) continue;
      const pics = [full, slide, upside].map(L => mirrorPic(rows, cols, L, h, {size: 16}));
      return choice(R, 'The dashed line is a line of symmetry. Which picture completes the shape correctly?', pics[0], pics.slice(1), `Flip the shape over the line, like a mirror: each square lands the same distance away on the other side. Sliding it across is not a flip.`, {visual: mirrorPic(rows, cols, S, h)}); }
    return again('II.9.18', 'c', R); } },
  d: { t: 'shapes with none', g: (R) => { const k = R.int(0, 3), none = ['parallelogram', 'right trapezoid', 'scalene triangle', 'quadrilateral'], some = ['rectangle', 'isosceles trapezoid', 'kite', 'isosceles triangle', 'rhombus', 'equilateral triangle', 'regular pentagon'];
    if (k <= 1) { const z = R.pick(none), others = R.sample(some, 3), T = ['A', 'B', 'C', 'D'], list = R.shuffle([z, ...others]);
      const pics = list.map((nm, i) => V9.poly(symShape(R, nm).P, {maxW: 140, maxH: 110, pad: 14, padX: 14, fill: C.blue + '22'}));
      const vis = V.svg(300, 300, pics.map((p, i) => V9ne(p, (i % 2) * 150, Math.floor(i / 2) * 150, T[i])).join(''), 'four shapes');
      return choiceFixed('Which shape has no lines of symmetry?', T, list.indexOf(z), `Shape ${T[list.indexOf(z)]}, the ${z === 'quadrilateral' ? 'uneven 4-sided shape' : z}: ${symCountWhy[z]}. The others each have at least one.`, {visual: vis}); }
    if (k === 2) { const key = R.pick(['F', 'L', 'P', 'Z', 'J', 'S', 'T', 'E', 'U', 'H', 'A', 'C']), n = cellAxes(cellsOf(LETTERS[key])).length;
      return yn('Does this shape have any lines of symmetry?', n > 0, n ? `Yes, ${n === 1 ? '1 line' : n + ' lines'}: fold it the right way and the halves match.` : 'No. Try folding up and down or across: the halves never match.', {visual: letterPic(key)}); }
    const nm = R.pick(none.concat(['rectangle', 'kite', 'isosceles trapezoid'])), S = symShape(R, nm);
    return yn('Does this shape have any lines of symmetry?', S.n > 0, `${S.n ? 'Yes' : 'No'}: ${symCountWhy[nm]}.`, {visual: V9.poly(S.P, {maxW: 240, maxH: 170, fill: C.blue + '22'})}); } },
}});
// place a shape svg in a 150 × 150 slot with a letter underneath
function V9ne(svg, x, y, t) { const m = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(svg), w = +m[1], h = +m[2];
  return V.nest(svg, P1(x + (150 - w) / 2), P1(y + (120 - h) / 2)) + V.text(x + 75, y + 136, t, {size: 16, weight: 700, fill: C.blue}); }

/* =================== II.9.19 the first quadrant =================== */
// first-quadrant grid 0..mx × 0..my. pts: [{x,y,t}] dots with letters; o.segs [[p,q]]
V9.plane = function (mx, my, pts = [], o = {}) { const s = o.s || Math.min(28, 290 / mx, 260 / my), L = 36, T = 30, W = P1(L + mx * s + 26), H = P1(T + my * s + 34), X = x => P1(L + x * s), Y = y => P1(T + (my - y) * s);
  let b = ''; for (let i = 0; i <= mx; i++) b += `<line x1="${X(i)}" y1="${Y(0)}" x2="${X(i)}" y2="${Y(my)}" stroke="${C.line}" stroke-width="1"/>`;
  for (let j = 0; j <= my; j++) b += `<line x1="${X(0)}" y1="${Y(j)}" x2="${X(mx)}" y2="${Y(j)}" stroke="${C.line}" stroke-width="1"/>`;
  b += seg([X(0), Y(0)], [X(mx) + 14, Y(0)], {w: 2.2}) + arrowHead([X(0), Y(0)], [X(mx) + 16, Y(0)]) + seg([X(0), Y(0)], [X(0), Y(my) - 12], {w: 2.2}) + arrowHead([X(0), Y(0)], [X(0), Y(my) - 14]);
  b += V.text(X(mx) + 16, Y(0) - 13, 'x', {size: 15, weight: 700, fill: C.blue}) + V.text(X(0) + 13, Y(my) - 16, 'y', {size: 15, weight: 700, fill: C.blue});
  for (let i = 0; i <= mx; i++) b += V.text(X(i), Y(0) + 15, i, {size: 12, fill: C.muted});
  for (let j = 1; j <= my; j++) b += V.text(X(0) - 12, Y(j), j, {size: 12, fill: C.muted});
  (o.segs || []).forEach(([p, q]) => b += seg([X(p[0]), Y(p[1])], [X(q[0]), Y(q[1])], {w: 2, col: C.teal}));
  pts.forEach(p => { b += V.dot(X(p.x), Y(p.y), 5.5, p.col || C.red); if (!p.t) return;
    let vx = 0, vy = 0; pts.forEach(q => { const dx = p.x - q.x, dy = p.y - q.y, d2 = dx * dx + dy * dy; if (q !== p && d2 > 0 && d2 <= 6.25) { vx += dx / d2; vy += dy / d2; } });
    if (Math.hypot(vx, vy) < 0.2) { vx = 1; vy = 1; } const L0 = Math.hypot(vx, vy); b += V.text(P1(X(p.x) + vx / L0 * 15), P1(Y(p.y) - vy / L0 * 15), p.t, {size: 15, weight: 700, fill: p.col || C.red}); });
  return V.svg(W, H, b, 'coordinate grid'); };
const xy = (x, y) => `(${x}, ${y})`;
E2.skill({ id: 'II.9.19', name: 'The first quadrant', steps: {
  a: { t: 'axes and origin', g: (R) => { const k = R.int(0, 4), m = R.int(6, 10);
    if (k === 0) { const onX = R.bool(), v = R.int(1, m - 1), p = onX ? [v, 0] : [0, v];
      return choice(R, 'Point A is on an axis. What are its coordinates?', xy(...p), [xy(p[1], p[0]), xy(v, v), onX ? xy(v, 1) : xy(1, v)], `A is ${onX ? `${v} across and 0 up` : `0 across and ${v} up`}: ${xy(...p)}. The across number comes first.`, {visual: V9.plane(m, m, [{x: p[0], y: p[1], t: 'A'}])}); }
    if (k === 1) { const onX = R.bool(), v = R.int(1, m - 1), p = onX ? [v, 0] : [0, v];
      return choiceFixed('Which axis is point A on?', ['The x-axis', 'The y-axis'], onX ? 0 : 1, onX ? 'A is on the line going across: the x-axis. Its y is 0.' : 'A is on the line going up: the y-axis. Its x is 0.', {visual: V9.plane(m, m, [{x: p[0], y: p[1], t: 'A'}])}); }
    if (k === 2) return choice(R, 'What are the coordinates of the origin, where the axes meet?', '(0, 0)', ['(1, 1)', '(0, 1)', '(1, 0)'], 'The origin is 0 across and 0 up: (0, 0). Every point is measured from it.', {visual: V9.plane(m, m, [{x: 0, y: 0, t: 'O'}])});
    if (k === 3) { const [p, a, e] = R.pick([['Every point on the y-axis has x = ?', 0, 'Points on the y-axis are 0 across from the origin, so x = 0.'], ['Every point on the x-axis has y = ?', 0, 'Points on the x-axis are 0 up from the origin, so y = 0.']]); return num(p, a, e); }
    const [p, c, d, e] = R.pick([['The x-axis goes:', 'Across (left to right)', ['Up and down', 'Diagonally'], 'The x-axis is the horizontal one; the y-axis goes up.'], ['The y-axis goes:', 'Up and down', ['Across (left to right)', 'Diagonally'], 'The y-axis is the vertical one; the x-axis goes across.'],
      ['In (3, 7), which number tells how far across?', '3', ['7', '10'], 'The first number is x, how far across. The second is y, how far up.'], ['In (6, 2), which number tells how far up?', '2', ['6', '8'], 'The second number is y, how far up.']]);
    return choice(R, p, c, d, e); } },
  b: { t: 'plot points', g: (R) => { const m = 10;
    for (let t = 0; t < 50; t++) { const a = R.int(1, 9), b = R.int(1, 9); if (a === b) continue;
      const cand = [[a, b], [b, a], R.pick([[a + 1, b], [a - 1, b]]), R.pick([[a, b + 1], [a, b - 1]])], key = new Set(cand.map(p => p.join(',')));
      if (key.size < 4 || cand.some(p => p[0] < 1 || p[1] < 1 || p[0] > m || p[1] > m)) continue;
      const T = ['A', 'B', 'C', 'D'], order = R.shuffle([0, 1, 2, 3]), pts = order.map((ci, i) => ({x: cand[ci][0], y: cand[ci][1], t: T[i]})), ans = order.indexOf(0), sw = T[order.indexOf(1)];
      const p = R.bool() ? `Which point is at ${xy(a, b)}?` : `Start at (0, 0). Go ${a} right and ${b} up. Which point are you on?`;
      return choiceFixed(p, T, ans, `${xy(a, b)} is ${a} across, then ${b} up: point ${T[ans]}. Point ${sw} is ${xy(b, a)}, the numbers the wrong way round.`, {visual: V9.plane(m, m, pts)}); }
    return again('II.9.19', 'b', R); } },
  c: { t: 'read points', g: (R) => { const m = 10, a = R.int(0, 9), b = R.int(0, 9); if (a === 0 && b === 0) return again('II.9.19', 'c', R);
    const nm = R.pick(['P', 'A', 'M', 'K', 'Q']), others = R.bool() ? [] : [{x: R.int(1, 9), y: R.int(1, 9), t: '', col: C.muted}].filter(p => Math.abs(p.x - a) + Math.abs(p.y - b) > 3), ex = `Go across to ${a}, then up to ${b}: ${xy(a, b)}. Across first, then up.`;
    const vis = V9.plane(m, m, [{x: a, y: b, t: nm}, ...others]);
    if (a !== b && R.bool(0.35)) return choice(R, `What are the coordinates of point ${nm}?`, xy(a, b), [xy(b, a), xy(a + 1, b), xy(a, b + 1)], ex, {visual: vis});
    return num(`What are the coordinates of point ${nm}?`, [{label: 'x', ans: a}, {label: 'y', ans: b}], ex, {visual: vis}); } },
  d: { t: 'patterns on the grid', g: (R) => { const k = R.int(0, 3);
    if (k === 0) { const [rule, f, lo] = R.pick([['y = x + ', null, 0], ['y = 2 × x', x => 2 * x, 0], ['y = 2 × x + 1', x => 2 * x + 1, 0], ['y = x', x => x, 0]]), c = R.int(1, 3), F = f || (x => x + c), x0 = R.int(0, 1), xs = [x0, x0 + 1, x0 + 2], nx = x0 + 3;
      if (F(nx) > 10) return again('II.9.19', 'd', R);
      return num('These points follow a pattern. What is the next point?', [{label: 'x', ans: nx}, {label: 'y', ans: F(nx)}], `Each step goes 1 across and ${F(x0 + 1) - F(x0)} up. After ${xy(x0 + 2, F(x0 + 2))} comes ${xy(nx, F(nx))}.`, {visual: V9.plane(10, 10, xs.map(x => ({x, y: F(x)})))}); }
    if (k === 1) { const m = R.pick([1, 2, 3]), c = R.int(0, 3), F = x => m * x + c, ask = R.int(4, 6), ptsTxt = [0, 1, 2].map(x => xy(x, F(x))).join(', ');
      return num(`The points ${ptsTxt} follow a pattern. What is y when x = ${ask}?`, F(ask), `Each time x goes up 1, y goes up ${m}. From ${xy(2, F(2))}: ${F(2)} + ${ask - 2} ${X} ${m} = ${F(ask)}.`); }
    if (k === 2) { const x1 = R.int(1, 5), y1 = R.int(1, 5), x2 = x1 + R.int(2, 4), y2 = y1 + R.int(2, 4), C4 = [[x1, y1], [x2, y1], [x2, y2], [x1, y2]], miss = R.int(0, 3), T = ['A', 'B', 'C', 'D'];
      const shown = C4.map((p, i) => ({x: p[0], y: p[1], t: T[i]})).filter((_, i) => i !== miss);
      return num(`A, B, C and D are the corners of a rectangle. Where is ${T[miss]}?`, [{label: 'x', ans: C4[miss][0]}, {label: 'y', ans: C4[miss][1]}], `${T[miss]} lines up across from one corner and up from another: ${xy(...C4[miss])}.`, {visual: V9.plane(10, 10, shown)}); }
    const same = R.bool(), a = R.int(1, 8), b = R.int(1, 8), d = R.int(2, 6), P = same ? [[a, b], [Math.min(10, a + d), b]] : [[a, b], [a, Math.min(10, b + d)]], dist = same ? P[1][0] - P[0][0] : P[1][1] - P[0][1];
    return num(`How many units apart are ${xy(...P[0])} and ${xy(...P[1])}?`, dist, `They have the same ${same ? 'y' : 'x'}, so subtract the other numbers: ${same ? P[1][0] : P[1][1]} ${M} ${same ? a : b} = ${dist}.`, {visual: V9.plane(10, 10, [{x: P[0][0], y: P[0][1], t: 'A'}, {x: P[1][0], y: P[1][1], t: 'B'}], {segs: [P]})}); } },
}});

/* =================== II.9.20 measurement problems =================== */
E2.skill({ id: 'II.9.20', name: 'Measurement problems', steps: {
  a: { t: 'conversions', g: (R, O) => { const k = R.int(0, 3);
    if (metric(O)) {
      if (k === 0) { const a = R.int(2, 5), c = R.int(3, 19) * 5; return num(`A ribbon is ${a} m long. You cut off ${c} cm. How many cm are left?`, 100 * a - c, `${a} m = ${100 * a} cm. ${100 * a} ${M} ${c} = ${100 * a - c} cm.`); }
      if (k === 1) { const a = R.int(1, 3), g = R.pick([150, 200, 250, 300]), n = R.int(2, Math.floor(1000 * a / g) - 1); return num(`A jug holds ${a} L of juice. You pour ${n} glasses of ${g} mL. How many mL are left?`, 1000 * a - n * g, `${a} L = ${fmt(1000 * a)} mL. ${n} ${X} ${g} = ${n * g} mL, so ${fmt(1000 * a)} ${M} ${n * g} = ${1000 * a - n * g} mL.`); }
      if (k === 2) { const a = R.int(1, 4), g = R.int(1, 19) * 50; return num(`One bag weighs ${a} kg. Another weighs ${g} g. How many grams is that in all?`, 1000 * a + g, `${a} kg = ${fmt(1000 * a)} g. ${fmt(1000 * a)} + ${g} = ${fmt(1000 * a + g)} g.`); }
      const a = R.int(1, 3), m = R.int(1, 9) * 100, b = R.int(1, 9) * 100; return num(`You walk ${a} km ${m} m, then ${b} m more. How many meters is that in all?`, 1000 * a + m + b, `${a} km ${m} m = ${fmt(1000 * a + m)} m. ${fmt(1000 * a + m)} + ${b} = ${fmt(1000 * a + m + b)} m.`); }
    if (k === 0) { const a = R.int(3, 8), c = R.int(2, 11); return num(`A board is ${a} ft long. You cut off ${c} in. How many inches are left?`, 12 * a - c, `${a} ft = ${12 * a} in. ${12 * a} ${M} ${c} = ${12 * a - c} in.`); }
    if (k === 1) { const a = R.int(1, 3), n = R.int(3, 16 * a - 2); return num(`A jug holds ${a} gal of juice. You pour ${n} cups. How many cups are left?`, 16 * a - n, `${a} gal = ${16 * a} cups. ${16 * a} ${M} ${n} = ${16 * a - n} cups.`); }
    if (k === 2) { const a = R.int(1, 4), o = R.int(2, 15); return num(`One bag weighs ${a} lb. Another weighs ${o} oz. How many ounces is that in all?`, 16 * a + o, `${a} lb = ${16 * a} oz. ${16 * a} + ${o} = ${16 * a + o} oz.`); }
    const p = R.pick([1, 2, 3]), a = R.int(2, 8) * (p === 2 ? 2 : 1); return num(`A rope is ${a} yd long. How many ${p} ft pieces can you cut from it?`, 3 * a / p, `${a} yd = ${3 * a} ft. ${3 * a} ÷ ${p} = ${3 * a / p} pieces.`); } },
  b: { t: 'perimeter and area', g: (R, O) => { const k = R.int(0, 3), met = metric(O), U = met ? 'm' : 'ft';
    if (k === 0) { const l = R.int(4, 15), w = R.int(2, 10); return num(`A garden is ${l} ${U} by ${w} ${U}. How long is the fence around it, and what area does it cover?`, [{label: `fence (${U})`, ans: 2 * (l + w)}, {label: `area (${U}²)`, ans: l * w}], `Fence is the perimeter: 2 ${X} (${l} + ${w}) = ${2 * (l + w)} ${U}. Ground is the area: ${l} ${X} ${w} = ${l * w} ${U}².`); }
    if (k === 1) { if (met) { const a = R.int(2, 5), c = R.pick([50, 150, 250, 350]), b = c / 100; return num(`A rug is ${a} m by ${c} cm. What is its area in m²?`, a * b, `${c} cm = ${fmt(b)} m. ${a} ${X} ${fmt(b)} = ${fmt(a * b)} m². Change to the same unit first.`); }
      const a = R.int(2, 6), c = R.pick([6, 18, 30, 42]); return num(`A rug is ${a} ft by ${c} in. What is its area in ft²?`, a * c / 12, `${c} in = ${fmt(c / 12)} ft. ${a} ${X} ${fmt(c / 12)} = ${fmt(a * c / 12)} ft². Change to the same unit first.`); }
    if (k === 2) { const [p, c, d, e] = met ? ['1 m² = ? cm²', '10,000', ['100', '1000', '200'], 'A square 1 m on a side is 100 cm by 100 cm: 100 × 100 = 10,000 cm², not 100.'] : R.pick([['1 ft² = ? in²', '144', ['12', '24', '100'], 'A square 1 ft on a side is 12 in by 12 in: 12 × 12 = 144 in², not 12.'], ['1 yd² = ? ft²', '9', ['3', '6', '12'], 'A square 1 yd on a side is 3 ft by 3 ft: 3 × 3 = 9 ft², not 3.']]);
      return choice(R, p, c, d, e, {visual: met ? V9.rect(1, 1, {bottom: '100 cm', left: '100 cm', inner: '1 m²', maxW: 230, maxH: 150, padX: 70}) : undefined}); }
    if (met) { const t = R.pick([20, 25, 50]), a = R.int(1, 4) * 100, b = R.int(1, 3) * 100, n = (a / t) * (b / t); if (n > 200) return again('II.9.20', 'b', R, O);
      return num(`How many square tiles ${t} cm by ${t} cm cover a floor ${a / 100} m by ${b / 100} m?`, n, `${a / 100} m = ${a} cm and ${b / 100} m = ${b} cm. ${a} ÷ ${t} = ${a / t} and ${b} ÷ ${t} = ${b / t}: ${a / t} ${X} ${b / t} = ${n} tiles.`); }
    const t = R.pick([6, 4, 12]), a = R.int(2, 6), b = R.int(2, 4), n = (12 * a / t) * (12 * b / t);
    return num(`How many square tiles ${t} in by ${t} in cover a floor ${a} ft by ${b} ft?`, n, `${a} ft = ${12 * a} in and ${b} ft = ${12 * b} in. ${12 * a / t} ${X} ${12 * b / t} = ${n} tiles.`); } },
  c: { t: 'volume', g: (R, O) => { const k = R.int(0, 3), met = metric(O);
    if (met) {
      if (k <= 1) { const [l, w, h] = [R.int(2, 6) * 10, R.int(2, 4) * 10, R.int(1, 4) * 10], v = l * w * h; return num(`A fish tank is ${l} cm by ${w} cm by ${h} cm. How many liters of water fill it?`, v / 1000, `${l} ${X} ${w} ${X} ${h} = ${fmt(v)} cm³. 1000 cm³ = 1 L, so ${fmt(v)} ÷ 1000 = ${fmt(v / 1000)} L.`, {visual: box1(l, w, h, `${l} cm`, `${w} cm`, `${h} cm`, {maxW: 320, maxH: 200})}); }
      if (k === 2) { const [l, w, h] = [R.int(2, 10), R.int(2, 5), R.int(2, 5)]; return num(`A box is ${l} cm by ${w} cm by ${h} cm. How many mL of water does it hold?`, l * w * h, `${l} ${X} ${w} ${X} ${h} = ${l * w * h} cm³, and 1 cm³ holds 1 mL: ${l * w * h} mL.`); }
      const [l, w, h] = [R.int(3, 10), R.int(2, 6), R.int(1, 2)]; return num(`A pool is ${l} m by ${w} m by ${h} m. How many liters does it hold? (1 m³ = 1000 L)`, l * w * h * 1000, `${l} ${X} ${w} ${X} ${h} = ${l * w * h} m³. ${l * w * h} ${X} 1000 = ${fmt(l * w * h * 1000)} L.`); }
    if (k === 0) return choice(R, '1 yd³ = ? ft³', '27', ['3', '9', '12'], 'A cube 1 yd on each edge is 3 ft by 3 ft by 3 ft: 3 × 3 × 3 = 27 ft³.', {visual: box1(3, 3, 3, '1 yd = 3 ft', '3 ft', '3 ft', {maxW: 300, maxH: 190})});
    if (k === 1) { const [l, w, h] = [R.int(3, 8), R.int(2, 5), R.int(1, 2)]; return num(`A sandbox is ${l} ft by ${w} ft. Sand fills it ${h} ft deep. How many ft³ of sand?`, l * w * h, `${l} ${X} ${w} ${X} ${h} = ${l * w * h} ft³.`, {visual: box1(l, w, h, `${l} ft`, `${w} ft`, `${h} ft`, {maxW: 320, maxH: 190})}); }
    if (k === 2) { const s = R.int(2, 4), l = s * R.int(2, 4), w = s * R.int(1, 3), h = s * R.int(1, 2); return num(`How many ${s} in cubes fit in a box ${l} in by ${w} in by ${h} in?`, (l / s) * (w / s) * (h / s), `${l / s} along, ${w / s} across, ${h / s} up: ${l / s} ${X} ${w / s} ${X} ${h / s} = ${(l / s) * (w / s) * (h / s)} cubes.`); }
    const [l, w, h] = [R.int(3, 8), R.int(2, 4), 2 * R.int(1, 2)], v = l * w * h; return num(`A garden bed is ${l} ft by ${w} ft by ${h} ft. How many 2 ft³ bags of soil fill it?`, v / 2, `Volume ${l} ${X} ${w} ${X} ${h} = ${v} ft³. ${v} ÷ 2 = ${v / 2} bags.`); } },
  d: { t: 'multi-step', g: (R, O) => { const k = R.int(0, 3), met = metric(O), U = met ? 'm' : 'ft';
    if (k === 0) { const l = R.int(4, 12), w = R.int(3, 8), g = met ? R.int(1, 2) : R.pick([3, 4]), p = R.int(2, 9) * (O.coins === 'THB' ? 10 : 1), f = 2 * (l + w) - g;
      return num(`${/^(8|11|18)/.test(String(l)) ? 'An' : 'A'} ${l} ${U} by ${w} ${U} garden gets a fence all round, except a ${g} ${U} gate. Fence costs ${money(O, p)} per ${U}. Total cost?`, f * p, `Perimeter 2 ${X} (${l} + ${w}) = ${2 * (l + w)} ${U}. Minus the gate: ${f} ${U}. ${f} ${X} ${p} = ${fmt(f * p)}.`); }
    if (k === 1) { for (let t = 0; t < 100; t++) { const L = met ? R.int(3, 8) : R.int(6, 16), h = met ? R.int(2, 4) : R.pick([8, 10, 12]), c = met ? R.pick([5, 10, 12]) : R.pick([40, 50, 80]), coats = R.int(1, 2), A = L * h * coats; if (A % c) continue;
        return num(`A wall is ${L} ${U} by ${h} ${U}. It needs ${coats} coat${coats > 1 ? 's' : ''}. 1 ${met ? 'L of paint' : 'can of paint'} covers ${c} ${U}². How many ${met ? 'liters' : 'cans'}?`, A / c, `Area ${L} ${X} ${h} = ${L * h} ${U}².${coats > 1 ? ` 2 coats: ${A} ${U}².` : ''} ${A} ÷ ${c} = ${A / c} ${met ? 'L' : 'cans'}.`); }
      return again('II.9.20', 'd', R, O); }
    if (k === 2) { if (met) { const a = R.int(2, 9), c = R.pick([15, 20, 30, 35, 40, 45]), t = 100 * a, q = Math.floor(t / c), r = t % c;
        return num(`A ${a} m rope is cut into ${c} cm pieces. How many pieces, and how many cm are left over?`, [{label: 'pieces', ans: q}, {label: 'left (cm)', ans: r}], `${a} m = ${t} cm. ${t} ÷ ${c} = ${q} remainder ${r}: ${q} pieces and ${r} cm left.`); }
      const a = R.int(2, 6), c = R.pick([5, 7, 8, 10, 11]), t = 36 * a, q = Math.floor(t / c), r = t % c;
      return num(`A ${a} yd rope is cut into ${c} in pieces. How many pieces, and how many inches are left over?`, [{label: 'pieces', ans: q}, {label: 'left (in)', ans: r}], `${a} yd = ${t} in. ${t} ÷ ${c} = ${q} remainder ${r}: ${q} pieces and ${r} in left.`); }
    if (met) { for (let t = 0; t < 100; t++) { const l = R.int(3, 6) * 10, w = R.int(2, 4) * 10, h = R.int(2, 4) * 10, j = R.pick([2, 3, 4, 5]), v = l * w * h / 1000; if (v % j) continue;
        return num(`A tank is ${l} cm by ${w} cm by ${h} cm. You fill it with a ${j} L bucket. How many buckets?`, v / j, `${l} ${X} ${w} ${X} ${h} = ${fmt(l * w * h)} cm³ = ${v} L. ${v} ÷ ${j} = ${v / j} buckets.`); }
      return again('II.9.20', 'd', R, O); }
    const s = R.int(3, 6), p = R.int(2, 9) * (O.coins === 'THB' ? 10 : 1), n = R.int(2, 4);
    return num(`${n} rooms are each ${s} ft by ${s} ft. Carpet costs ${money(O, p)} per ft². What does carpet for all of them cost?`, n * s * s * p, `One room: ${s} ${X} ${s} = ${s * s} ft². ${n} rooms: ${n * s * s} ft². ${n * s * s} ${X} ${p} = ${fmt(n * s * s * p)}.`); } },
}});

})();

/* Era II · Unit II.10 Data (II.10.01–II.10.09)
   Local helpers live under V10 and small functions inside this file. */
(function(){ const {choice, choiceFixed, tf, frac, fh, fmt, V, C} = E2;
const num = (p, a, e, x) => E2.num(p, a && a.frac ? [a] : a, e, x);
const P1 = v => Math.round(v * 10) / 10;
const sum = a => a.reduce((x, y) => x + y, 0);
const COLS = [C.red, C.blue, C.amber, C.teal, C.violet];
const NAMES = ['Ana', 'Ben', 'Mia', 'Leo', 'Sara', 'Tom', 'Kim', 'Raj', 'Noor', 'Eli', 'Zoe', 'Max'];
const X = '×', D = '÷', M = '−';
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const list = a => a.join(', ');
const again = (id, k, R, O) => E2.byId[id].steps[k].g(R, O);
// fraction value (in 1/d units) → HTML, mixed when above 1
const mixH = (n, d) => { const [a, b] = E2.reduce(n, d); if (b === 1) return String(a); const w = Math.floor(a / b); return w ? fh(a % b, b, w) : fh(a, b); };

/* ---------- categorical topics ---------- */
const TOPICS = [
  { cats: ['cats', 'dogs', 'fish', 'birds', 'rabbits'], t: 'Favorite pet', ask: 'What is your favorite pet' },
  { cats: ['apple', 'banana', 'grape', 'pear', 'mango'], t: 'Favorite fruit', ask: 'What is your favorite fruit' },
  { cats: ['soccer', 'tennis', 'swim', 'dance', 'judo'], t: 'Favorite sport', ask: 'What is your favorite sport' },
  { cats: ['red', 'blue', 'green', 'yellow', 'purple'], t: 'Favorite color', ask: 'What is your favorite color' },
  { cats: ['milk', 'juice', 'water', 'cocoa'], t: 'Favorite drink', ask: 'What is your favorite drink' },
  { cats: ['bus', 'car', 'walk', 'bike'], t: 'Way to school', ask: 'How do you get to school' },
  { cats: ['art', 'music', 'math', 'science', 'reading'], t: 'Favorite subject', ask: 'What is your favorite subject' },
];
// k categories with values from gen(); opts: distinct, uniqueMax, uniqueMin
const dataset = (R, k, gen, o = {}) => {
  const t = R.pick(TOPICS), cats = R.sample(t.cats, Math.min(k, t.cats.length));
  for (let tries = 0; tries < 400; tries++) {
    const vals = cats.map(() => gen());
    const mx = Math.max(...vals), mn = Math.min(...vals);
    if (o.distinct && new Set(vals).size < vals.length) continue;
    if (o.uniqueMax && vals.filter(v => v === mx).length > 1) continue;
    if (o.uniqueMin && vals.filter(v => v === mn).length > 1) continue;
    if (o.ok && !o.ok(vals)) continue;
    return { t, cats, vals };
  }
  throw new Error('dataset');
};

/* ================= V10 visuals ================= */
const V10 = {};
// small mixed-number label centered at (x,y)
const fracLab = (x, y, n, d, size = 13) => {
  const [a, b] = E2.reduce(n, d);
  if (b === 1) return V.text(x, y, a, { size: size + 1, weight: 600 });
  const w = Math.floor(a / b), r = a % b; let s = '', fx = x;
  if (w) { s += V.text(x - 7, y, w, { size: size + 1, weight: 600 }); fx = x + 6; }
  return s + V.text(fx, y - 8, r, { size: size - 1 }) + `<line x1="${fx - 5}" y1="${y}" x2="${fx + 5}" y2="${y}" stroke="${C.ink}" stroke-width="1.2"/>` + V.text(fx, y + 8, b, { size: size - 1 });
};
const xMark = (x, y, col) => `<path d="M${x - 7} ${y - 7} L${x + 7} ${y + 7} M${x + 7} ${y - 7} L${x - 7} ${y + 7}" stroke="${col}" stroke-width="3" stroke-linecap="round"/>`;
// line plot. counts: {k: count} where the value is k/d. Ticks from lo to hi (whole numbers).
V10.lplot = (lo, hi, d, counts, o = {}) => {
  const n = (hi - lo) * d, sp = o.sp || (n > 8 ? 46 : 56), pad = 30, W = pad * 2 + n * sp;
  const maxC = Math.max(2, ...Object.values(counts)), xh = 19, y = 14 + maxC * xh, col = o.color || C.blue;
  let b = `<line x1="${pad - 16}" y1="${y}" x2="${W - pad + 16}" y2="${y}" stroke="${C.ink}" stroke-width="2"/>`;
  for (let k = 0; k <= n; k++) {
    const x = pad + k * sp, v = lo * d + k, whole = v % d === 0;
    b += `<line x1="${x}" y1="${y - (whole ? 8 : 6)}" x2="${x}" y2="${y + (whole ? 8 : 6)}" stroke="${C.ink}" stroke-width="${whole ? 2.2 : 1.5}"/>`;
    b += d === 1 ? V.text(x, y + 22, v, { size: 15, weight: 600 }) : fracLab(x, y + 28, v, d);
    for (let i = 0; i < (counts[v] || 0); i++) b += xMark(x, y - 16 - i * xh, col);
  }
  let H = y + (d === 1 ? 34 : 48);
  if (o.title) { b += V.text(W / 2, H + 4, o.title, { size: 14, fill: C.muted }); H += 18; }
  return V.svg(W, H, b, 'line plot');
};
// bar graph. o.step / o.base / o.top, or o.ticks (drawn equally spaced even if the values are not: for misleading graphs)
V10.bar = (cats, vals, o = {}) => {
  let ticks = o.ticks;
  if (!ticks) { const step = o.step || 1, base = o.base || 0, top = o.top || Math.max(base + 2 * step, Math.ceil(Math.max(...vals) / step) * step); ticks = []; for (let v = base; v <= top + 1e-9; v += step) ticks.push(v); }
  const L = 46, T = 12, PH = o.ph || 190, bw = o.bw || 40, sp = o.sp || 66, W = L + cats.length * sp + 10, nT = ticks.length - 1;
  const Y = v => { if (v <= ticks[0]) return T + PH; for (let i = 0; i < nT; i++) if (v <= ticks[i + 1] + 1e-9) return P1(T + PH - (i + (v - ticks[i]) / (ticks[i + 1] - ticks[i])) / nT * PH); return T; };
  const every = nT > 10 ? 2 : 1; let b = '';
  ticks.forEach((v, i) => {
    b += `<line x1="${L}" y1="${Y(v)}" x2="${W - 4}" y2="${Y(v)}" stroke="${i ? C.faint : C.ink}" stroke-width="${i ? 1.5 : 2}"/>`;
    if (i % every === 0) b += V.text(L - 8, Y(v), v, { size: 13, anchor: 'end', fill: C.muted });
  });
  cats.forEach((c, i) => {
    const x = L + (sp - bw) / 2 + i * sp, col = o.colors ? o.colors[i] : (o.color || C.teal);
    if (o.hide !== i && vals[i] > ticks[0]) b += `<rect x="${x}" y="${Y(vals[i])}" width="${bw}" height="${P1(Y(ticks[0]) - Y(vals[i]))}" fill="${col}"/>`;
    b += V.text(x + bw / 2, T + PH + 16, c, { size: 13 });
  });
  b += `<line x1="${L}" y1="${T}" x2="${L}" y2="${Y(ticks[0])}" stroke="${C.ink}" stroke-width="2"/>`;
  let H = T + PH + 30;
  if (o.title) { b += V.text(L + (W - L) / 2, H + 2, o.title, { size: 14, fill: C.muted }); H += 18; }
  return V.svg(W, H, b, 'bar graph');
};
// icons for pictographs; half = the left half only (drawn as a true half, not a smaller icon)
const clipLeft = (pts, cx) => { const out = []; for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length], ai = a[0] <= cx + 1e-9, bi = b[0] <= cx + 1e-9; if (ai) out.push(a); if (ai !== bi) { const t = (cx - a[0]) / (b[0] - a[0]); out.push([cx, a[1] + t * (b[1] - a[1])]); } } return out; };
const poly = (pts, col) => `<path d="${pts.map((p, i) => (i ? 'L' : 'M') + P1(p[0]) + ' ' + P1(p[1])).join('')}Z" fill="${col}"/>`;
const iconFrag = (kind, x, y, s, col, half) => {
  if (kind === 'circle') return half ? `<path d="M${x} ${P1(y - s / 2)} A${s / 2} ${s / 2} 0 0 0 ${x} ${P1(y + s / 2)} Z" fill="${col}"/>` : V.dot(x, y, s / 2, col);
  let pts;
  if (kind === 'star') { pts = []; for (let i = 0; i < 10; i++) { const r = i % 2 ? s * 0.23 : s * 0.54, a = i * Math.PI / 5; pts.push([x + r * Math.sin(a), y + s * 0.06 - r * Math.cos(a)]); } }
  else if (kind === 'square') { const h = s * 0.44; pts = [[x - h, y - h], [x + h, y - h], [x + h, y + h], [x - h, y + h]]; }
  else { const h = s * 0.5; pts = [[x, y - h], [x + h, y], [x, y + h], [x - h, y]]; } // diamond
  return poly(half ? clipLeft(pts, x) : pts, col);
};
const ICONS = ['star', 'circle', 'square', 'diamond'];
// rows [{label, n}] with n a multiple of key/2
V10.picto = (rows, key, o = {}) => {
  const lw = 92, rh = 36, sp = 30, icon = o.icon || 'star', col = o.color || C.amber;
  const maxI = Math.max(...rows.map(r => Math.ceil(r.n / key))), W = Math.max(270, lw + maxI * sp + 14);
  let b = '';
  rows.forEach((r, i) => {
    const y = i * rh + rh / 2 + 2, whole = Math.floor(r.n / key + 1e-9), half = r.n / key - whole > 0.25;
    b += V.text(8, y, r.label, { size: 15, anchor: 'start' });
    for (let k = 0; k < whole; k++) b += iconFrag(icon, lw + sp / 2 + k * sp, y, 24, col);
    if (half) b += iconFrag(icon, lw + sp / 2 + whole * sp, y, 24, col, true);
    b += `<line x1="0" y1="${i * rh + rh + 2}" x2="${W}" y2="${i * rh + rh + 2}" stroke="${C.line}"/>`;
  });
  b += `<line x1="${lw - 6}" y1="0" x2="${lw - 6}" y2="${rows.length * rh + 2}" stroke="${C.ink}" stroke-width="1.5"/>`;
  const ky = rows.length * rh + 26;
  b += `<rect x="${W - 170}" y="${ky - 16}" width="166" height="32" rx="6" fill="${C.faint}"/>` + V.text(W - 158, ky, 'Key:', { size: 14, anchor: 'start', fill: C.muted }) +
    iconFrag(icon, W - 106, ky, 22, col) + V.text(W - 90, ky, `= ${key}`, { size: 16, anchor: 'start', weight: 700 });
  if (o.title) b += V.text(8, ky, o.title, { size: 14, anchor: 'start', fill: C.muted });
  return V.svg(W, ky + 20, b, 'pictograph');
};
// one row of symbols (for "which row shows …" choices)
V10.prow = (count, icon, col) => {
  const whole = Math.floor(count + 1e-9), half = count - whole > 0.25, n = whole + (half ? 1 : 0), sp = 30;
  let b = ''; for (let k = 0; k < whole; k++) b += iconFrag(icon, 18 + k * sp, 18, 24, col);
  if (half) b += iconFrag(icon, 18 + whole * sp, 18, 24, col, true);
  return V.svg(Math.max(40, n * sp + 8), 36, b, `${count} symbols`);
};
// tallies
const tallyFrag = (n, x, y, h = 26) => {
  let b = ''; const g = Math.floor(n / 5), r = n % 5;
  for (let k = 0; k < g; k++) { const gx = x + k * 46;
    for (let i = 0; i < 4; i++) b += `<line x1="${gx + i * 8}" y1="${y}" x2="${gx + i * 8}" y2="${y + h}" stroke="${C.ink}" stroke-width="2.5" stroke-linecap="round"/>`;
    b += `<line x1="${gx - 5}" y1="${y + h - 5}" x2="${gx + 29}" y2="${y + 5}" stroke="${C.ink}" stroke-width="2.5" stroke-linecap="round"/>`; }
  for (let i = 0; i < r; i++) b += `<line x1="${x + g * 46 + i * 8}" y1="${y}" x2="${x + g * 46 + i * 8}" y2="${y + h}" stroke="${C.ink}" stroke-width="2.5" stroke-linecap="round"/>`;
  return b;
};
const tallyW = n => Math.floor(n / 5) * 46 + (n % 5) * 8;
// table. head: [..], rows: [[cell,…]]; a cell is a string/number, '?' (amber box) or {tally:n}
V10.table = (head, rows, o = {}) => {
  const rh = 36, ncol = head.length;
  const cw = head.map((h, j) => Math.max(j === 0 ? (o.first || 108) : (o.cell || 86), String(h).length * 9 + 24, ...rows.map(r => r[j] && r[j].tally !== undefined ? tallyW(r[j].tally) + 30 : String(r[j]).length * 9 + 24)));
  const W = sum(cw) + 4, all = [head].concat(rows); let b = '';
  all.forEach((r, i) => { let x = 2; const y = 2 + i * rh, bold = i === 0 || (o.boldLast && i === all.length - 1);
    r.forEach((c, j) => {
      b += `<rect x="${x}" y="${y}" width="${cw[j]}" height="${rh}" fill="${i === 0 ? C.faint : C.paper}" stroke="${C.ink}" stroke-width="1.3"/>`;
      if (c && c.tally !== undefined) b += tallyFrag(c.tally, x + 15, y + 6, rh - 12);
      else if (c === '?') b += `<rect x="${x + cw[j] / 2 - 16}" y="${y + 6}" width="32" height="${rh - 12}" rx="5" fill="${C.amber}"/>` + V.text(x + cw[j] / 2, y + rh / 2, '?', { size: 16, weight: 700 });
      else b += V.text(j === 0 ? x + 12 : x + cw[j] / 2, y + rh / 2, c, { size: 15, weight: bold ? 700 : 500, anchor: j === 0 ? 'start' : 'middle' });
      x += cw[j]; });
  });
  return V.svg(W, all.length * rh + 4, b, 'table');
};
// towers of cubes
V10.towers = (vals, o = {}) => {
  const s = 22, sp = 58, mx = Math.max(...vals), H = mx * s + 34, W = vals.length * sp + 10; let b = '';
  vals.forEach((v, i) => { const x = 10 + i * sp + (sp - s) / 2 - 5, col = COLS[i % COLS.length];
    for (let k = 0; k < v; k++) b += `<rect x="${x}" y="${4 + (mx - k - 1) * s}" width="${s}" height="${s}" fill="${col}" stroke="${C.ink}" stroke-width="1.3"/>`;
    if (o.labels) b += V.text(x + s / 2, mx * s + 20, o.labels[i], { size: 13 }); });
  b += `<line x1="4" y1="${mx * s + 4}" x2="${W - 4}" y2="${mx * s + 4}" stroke="${C.ink}" stroke-width="2"/>`;
  return V.svg(W, o.labels ? H : H - 18, b, 'towers of cubes');
};
// line graph. series [{vals, color, name}], o.step, o.top, o.base, o.skip [si, i] leaves out one point
V10.line = (xs, series, o = {}) => {
  const step = o.step || 1, base = o.base || 0, all = [].concat(...series.map(s => s.vals)), top = o.top || Math.max(base + 2 * step, Math.ceil(Math.max(...all) / step) * step);
  const leg = series.some(s => s.name) ? 26 : 0, L = 48, T = 12 + leg, PH = o.ph || 180, sp = o.sp || 64, W = L + xs.length * sp + 8;
  const Y = v => P1(T + PH - (v - base) / (top - base) * PH), Xp = i => L + sp / 2 + i * sp;
  const nT = (top - base) / step, every = nT > 10 ? 2 : 1; let b = '';
  for (let k = 0; k <= nT; k++) { const v = base + k * step;
    b += `<line x1="${L}" y1="${Y(v)}" x2="${W - 4}" y2="${Y(v)}" stroke="${k ? C.faint : C.ink}" stroke-width="${k ? 1.5 : 2}"/>`;
    if (k % every === 0) b += V.text(L - 8, Y(v), v, { size: 13, anchor: 'end', fill: C.muted }); }
  xs.forEach((x, i) => b += V.text(Xp(i), T + PH + 16, x, { size: 13 }));
  b += `<line x1="${L}" y1="${T}" x2="${L}" y2="${T + PH}" stroke="${C.ink}" stroke-width="2"/>`;
  series.forEach((s, si) => { const col = s.color || C.blue, skip = o.skip && o.skip[0] === si ? o.skip[1] : -1;
    for (let i = 0; i + 1 < s.vals.length; i++) if (i !== skip && i + 1 !== skip) b += `<line x1="${Xp(i)}" y1="${Y(s.vals[i])}" x2="${Xp(i + 1)}" y2="${Y(s.vals[i + 1])}" stroke="${col}" stroke-width="3" stroke-linecap="round"/>`;
    s.vals.forEach((v, i) => { if (i !== skip) b += si % 2 ? `<rect x="${Xp(i) - 5}" y="${Y(v) - 5}" width="10" height="10" fill="${col}"/>` : V.dot(Xp(i), Y(v), 5.5, col); }); });
  let lx = L + 6; series.forEach((s, si) => { if (!s.name) return; const col = s.color || C.blue;
    b += `<line x1="${lx}" y1="14" x2="${lx + 22}" y2="14" stroke="${col}" stroke-width="3"/>` + (si % 2 ? `<rect x="${lx + 6}" y="9" width="10" height="10" fill="${col}"/>` : V.dot(lx + 11, 14, 5, col)) + V.text(lx + 28, 14, s.name, { size: 14, anchor: 'start' });
    lx += 40 + s.name.length * 8; });
  let H = T + PH + 30;
  if (o.title) { b += V.text(L + (W - L) / 2, H + 2, o.title, { size: 14, fill: C.muted }); H += 18; }
  return V.svg(W, H, b, 'line graph');
};
// raw answers as word chips
V10.chips = (words) => {
  const per = 6, cw = 82, ch = 32; let b = '';
  words.forEach((w, i) => { const x = 4 + (i % per) * (cw + 6), y = 4 + Math.floor(i / per) * (ch + 6);
    b += `<rect x="${x}" y="${y}" width="${cw}" height="${ch}" rx="8" fill="${C.faint}" stroke="${C.line}"/>` + V.text(x + cw / 2, y + ch / 2, w, { size: 14 }); });
  const rows = Math.ceil(words.length / per);
  return V.svg(Math.min(words.length, per) * (cw + 6) + 2, rows * (ch + 6) + 2, b, 'answers');
};

/* ================= II.10.01 Line plots ================= */
const LP = [
  { t: 'Pets each kid has', lo: 0, hi: 5, q: v => `How many kids have ${v} pet${v === 1 ? '' : 's'}?`, more: v => `How many kids have more than ${v} pets?`, who: 'kids' },
  { t: 'Books each kid read this week', lo: 0, hi: 6, q: v => `How many kids read ${v} book${v === 1 ? '' : 's'}?`, more: v => `How many kids read more than ${v} books?`, who: 'kids' },
  { t: 'Goals in each game', lo: 0, hi: 5, q: v => `In how many games were ${v} goal${v === 1 ? '' : 's'} scored?`, more: v => `In how many games were more than ${v} goals scored?`, who: 'games' },
  { t: 'Brothers and sisters each kid has', lo: 0, hi: 4, q: v => `How many kids have ${v} brother${v === 1 ? '' : 's'} or sister${v === 1 ? '' : 's'}?`, more: v => `How many kids have more than ${v} brothers or sisters?`, who: 'kids' },
  { t: 'Hours of sleep last night', lo: 7, hi: 11, q: v => `How many kids slept ${v} hours?`, more: v => `How many kids slept more than ${v} hours?`, who: 'kids' },
  { t: 'Letters in each first name', lo: 3, hi: 8, q: v => `How many names have ${v} letters?`, more: v => `How many names have more than ${v} letters?`, who: 'names' },
];
const lpCounts = (R, c, o = {}) => {
  for (let t = 0; t < 400; t++) {
    const cnt = {}; for (let v = c.lo; v <= c.hi; v++) cnt[v] = R.bool(0.2) ? 0 : R.int(0, o.max || 4);
    const vs = Object.values(cnt), tot = sum(vs), mx = Math.max(...vs);
    if (tot < (o.min || 7) || tot > 16 || vs.filter(x => x === mx).length > 1) continue;
    return cnt;
  }
  throw new Error('lpCounts');
};
const cntToList = cnt => [].concat(...Object.keys(cnt).map(k => Array(cnt[k]).fill(+k)));
// fraction contexts for line plots
const FLP = O => O.units === 'imperial'
  ? [{ t: 'Ribbon lengths (inches)', thing: 'ribbons', u: 'in', unit: 'inches', verb: 'long', tot: 'total length', share: n => `All the ribbons are joined, then cut into ${n} equal pieces. How long is each piece, in inches?` },
     { t: 'Pencil lengths (inches)', thing: 'pencils', u: 'in', unit: 'inches', verb: 'long', tot: 'total length' },
     { t: 'Bags of flour (pounds)', thing: 'bags', u: 'lb', unit: 'pounds', verb: 'heavy', tot: 'total weight', share: n => `All the flour is shared equally among the ${n} bags. How many pounds in each bag?` },
     { t: 'Time spent reading (hours)', thing: 'kids', u: 'h', unit: 'hours', verb: 'long', tot: 'total time', read: 1 }]
  : [{ t: 'Juice in each jug (liters)', thing: 'jugs', u: 'L', unit: 'liters', verb: 'full', tot: 'total amount', jug: 1, share: n => `All the juice is poured together and shared equally among the ${n} jugs. How many liters in each?` },
     { t: 'Bags of flour (kilograms)', thing: 'bags', u: 'kg', unit: 'kilograms', verb: 'heavy', tot: 'total weight', share: n => `All the flour is shared equally among the ${n} bags. How many kilograms in each bag?` },
     { t: 'Distance each kid walked (km)', thing: 'kids', u: 'km', unit: 'kilometers', verb: 'long', tot: 'total distance', walk: 1 },
     { t: 'Time spent reading (hours)', thing: 'kids', u: 'h', unit: 'hours', verb: 'long', tot: 'total time', read: 1 }];
const fracPlot = (R, O, o = {}) => {
  const c = R.pick(FLP(O).filter(x => !o.share || x.share)), d = R.pick([2, 4, 4]), lo = d === 4 ? R.int(0, 1) : R.int(0, 1), hi = d === 4 ? lo + 2 : lo + 4;
  for (let t = 0; t < 500; t++) {
    const cnt = {}; for (let k = lo * d + 1; k <= hi * d; k++) cnt[k] = R.bool(0.35) ? 0 : R.int(0, 3);
    const keys = Object.keys(cnt).filter(k => cnt[k]).map(Number), tot = sum(Object.values(cnt)), mx = Math.max(...Object.values(cnt));
    if (keys.length < 4 || tot < 6 || tot > (o.maxN || 12) || Object.values(cnt).filter(x => x === mx).length > 1) continue;
    if (!keys.some(k => k % d)) continue;
    if (o.share && [1, 2, 4].indexOf(E2.reduce(sum(keys.map(v => v * cnt[v])), d * tot)[1]) < 0) continue;
    return { c, d, lo, hi, cnt, keys, tot, vis: V10.lplot(lo, hi, d, cnt, { title: c.t }) };
  }
  throw new Error('fracPlot');
};
const valPhrase = (c, k, d) => c.read ? `read for ${mixH(k, d)} hours` : c.walk ? `walked ${mixH(k, d)} km` : c.jug ? `hold ${mixH(k, d)} L` : `are ${mixH(k, d)} ${c.u}`;
E2.skill({ id: 'II.10.01', name: 'Line plots', steps: {
  a: { t: 'read', g: (R) => {
    const c = R.pick(LP), cnt = lpCounts(R, c), vis = V10.lplot(c.lo, c.hi, 1, cnt, { title: c.t }), tot = sum(Object.values(cnt)), k = R.int(0, 3);
    const vals = Object.keys(cnt).map(Number), mode = vals.find(v => cnt[v] === Math.max(...Object.values(cnt)));
    if (k === 0) { const v = R.pick(vals.filter(v => cnt[v] > 0)); return num(c.q(v), cnt[v], `Count the X's above ${v}: there ${cnt[v] === 1 ? 'is' : 'are'} ${cnt[v]}.`, { visual: vis }); }
    if (k === 1) return num(`How many ${c.who} are shown in all?`, tot, `Each X is one of the ${c.who}. Count every X: ${tot}.`, { visual: vis });
    if (k === 2) return num(`Which number was the most common answer?`, mode, `The tallest stack of X's is above ${mode}.`, { visual: vis });
    const v = R.int(c.lo + 1, c.hi - 2), more = vals.filter(x => x > v), m = sum(more.map(x => cnt[x]));
    return num(c.more(v), m, `Count the X's to the right of ${v}: ${more.map(x => cnt[x]).join(' + ')} = ${m}.`, { visual: vis }); } },
  b: { t: 'make', g: (R) => {
    const c = R.pick(LP), cnt = lpCounts(R, c, { min: 6 }), data = R.shuffle(cntToList(cnt)), k = R.int(0, 2), rep = Object.keys(cnt).map(Number).filter(v => cnt[v] > 1);
    const pr = `${c.t}: ${list(data)}.`;
    if (k === 0 || !rep.length) {
      const once = {}; Object.keys(cnt).forEach(v => once[v] = cnt[v] ? 1 : 0);
      const moved = Object.assign({}, cnt), from = R.pick(Object.keys(cnt).map(Number).filter(v => cnt[v] > 0)), to = from < c.hi ? from + 1 : from - 1; moved[from]--; moved[to]++;
      const g = cc => V10.lplot(c.lo, c.hi, 1, cc, { sp: 40 });
      return choice(R, `${pr} Which line plot shows the data?`, g(cnt), [g(once), g(moved)], `Put one X above the number for every value, repeats included: ${Object.keys(cnt).filter(v => cnt[v]).map(v => `${cnt[v]} above ${v}`).join(', ')}.`); }
    if (k === 1) { const v = R.pick(rep); return num(`${pr} In a line plot, how many X's go above ${v}?`, cnt[v], `${v} appears ${cnt[v]} times, so it gets ${cnt[v]} X's, one for each value.`); }
    return num(`${pr} How many X's does the line plot need in all?`, data.length, `One X for every value: there are ${data.length} values.`); } },
  c: { t: 'with fractions', g: (R, O) => {
    const P = fracPlot(R, O), { c, d, cnt, keys, vis } = P, k = R.int(0, 3);
    if (k === 0) { const v = R.pick(keys.filter(x => x % d)); return num(`How many ${c.thing} ${valPhrase(c, v, d)}?`, cnt[v], `Find ${mixH(v, d)} on the line and count the X's above it: ${cnt[v]}.`, { visual: vis }); }
    if (k === 1) { const v = R.pick(keys.slice(1, -1)), more = keys.filter(x => x > v), m = sum(more.map(x => cnt[x]));
      return num(`How many ${c.thing} are more than ${mixH(v, d)} ${c.u}?`, m, `Count the X's to the right of ${mixH(v, d)}: ${more.map(x => cnt[x]).join(' + ')} = ${m}.`, { visual: vis }); }
    if (k === 2) { const mx = Math.max(...keys), mn = Math.min(...keys);
      return num(`What is the difference between the greatest and least value, in ${c.unit}?`, frac(mx - mn, d), `${mixH(mx, d)} ${M} ${mixH(mn, d)} = ${mixH(mx - mn, d)} ${c.u}.`, { visual: vis }); }
    const mode = keys.find(v => cnt[v] === Math.max(...Object.values(cnt)));
    return num(`Which value is the most common, in ${c.unit}?`, frac(mode, d), `The tallest stack is above ${mixH(mode, d)}.`, { visual: vis }); } },
  d: { t: 'answer questions', g: (R, O) => {
    const k = R.int(0, 2);
    if (k === 2) { // share equally
      const P = fracPlot(R, O, { maxN: 10, share: 1 }), { c, d, cnt, keys, tot, vis } = P, total = sum(keys.map(v => v * cnt[v]));
      return num(c.share(tot), frac(total, d * tot), `Total = ${mixH(total, d)} ${c.u}. ${mixH(total, d)} ${D} ${tot} = ${mixH(total, d * tot)} ${c.u}.`, { visual: vis }); }
    const P = fracPlot(R, O), { c, d, cnt, keys, vis } = P;
    if (k === 0) { const total = sum(keys.map(v => v * cnt[v]));
      return num(`What is the ${c.tot} of all the ${c.thing}, in ${c.unit}?`, frac(total, d), `Add every value, one per X: ${keys.map(v => cnt[v] > 1 ? `${cnt[v]} ${X} ${mixH(v, d)}` : mixH(v, d)).join(' + ')} = ${mixH(total, d)} ${c.u}.`, { visual: vis }); }
    const v = R.pick(keys.filter(x => cnt[x] > 1 && x % d) .concat(keys.filter(x => cnt[x] > 1)));
    return num(`What is the ${c.tot} of the ${c.thing} at ${mixH(v, d)} ${c.u}?`, frac(v * cnt[v], d), `There are ${cnt[v]} X's above ${mixH(v, d)}: ${cnt[v]} ${X} ${mixH(v, d)} = ${mixH(v * cnt[v], d)} ${c.u}.`, { visual: vis }); } },
}});

/* ================= II.10.02 Bar graphs with scales ================= */
const scaleVals = (R, step, k, o = {}) => dataset(R, k, () => step === 2 ? R.int(1, 20) : R.int(o.minL || 1, o.maxL || 19) * (step / 2) * (step === 5 ? 2 : 1), Object.assign({ distinct: true }, o));
E2.skill({ id: 'II.10.02', name: 'Bar graphs with scales', steps: {
  a: { t: 'scales of 2, 5 and 10', g: (R) => {
    const step = R.pick([2, 5, 10]), ds = dataset(R, R.int(3, 5), () => step === 2 ? R.int(1, 20) : step === 5 ? 5 * R.int(1, 10) : 5 * R.int(1, 19), { distinct: true });
    const i = R.int(0, ds.cats.length - 1), v = ds.vals[i], vis = V10.bar(ds.cats, ds.vals, { step, color: R.pick(COLS), title: ds.t.t });
    const onLine = v % step === 0, lines = onLine ? v / step : Math.floor(v / step) + 0.5;
    const ex = onLine ? `The scale counts by ${step}. The ${ds.cats[i]} bar reaches ${v}.` : `The scale counts by ${step}. The ${ds.cats[i]} bar ends halfway between ${v - step / 2} and ${v + step / 2}: ${v}.`;
    if (R.bool(0.4) && v !== lines) return choice(R, `How many chose ${ds.cats[i]}?`, v, [Math.ceil(lines), v + step, v - step > 0 ? v - step : v + 2 * step], ex + ` Each line is ${step}, not 1.`, { visual: vis });
    return num(`How many chose ${ds.cats[i]}?`, v, ex, { visual: vis }); } },
  b: { t: 'make one', g: (R) => {
    const step = R.pick([2, 5, 10]), ds = dataset(R, 3, () => step * R.int(1, 8), { distinct: true }), col = R.pick(COLS);
    const tbl = V10.table([ds.t.t, 'Votes'], ds.cats.map((c, i) => [c, ds.vals[i]]));
    if (R.bool(0.5)) { const i = R.int(0, 2), v = ds.vals[i];
      return num(`Make a bar graph with a scale of ${step}. How many lines up from 0 does the ${ds.cats[i]} bar reach?`, v / step, `Each line is worth ${step}: ${v} ${D} ${step} = ${v / step} lines.`, { visual: tbl }); }
    const top = step * 9, g = vs => V10.bar(ds.cats, vs, { step, top, color: col, ph: 150, sp: 58, bw: 34 });
    const i = R.int(0, 2), off = ds.vals.slice(); off[i] = off[i] + (off[i] > step ? -step : step);
    const sw = ds.vals.slice(); const j = (i + 1) % 3; [sw[i], sw[j]] = [sw[j], sw[i]];
    const asLines = ds.vals.map(v => v / step);
    const ds2 = [off, sw, asLines.every(v => v >= 1) ? asLines : null].filter(Boolean);
    return choice(R, `Which bar graph shows the table?`, g(ds.vals), ds2.slice(0, 2).concat(R.bool() ? [] : ds2.slice(2)).map(g), `Read each bar on the scale of ${step}: ${ds.cats.map((c, k) => `${c} ${ds.vals[k]}`).join(', ')}.`, { visual: tbl }); } },
  c: { t: 'compare', g: (R) => {
    const step = R.pick([2, 5, 10]), ds = dataset(R, 4, () => step * R.int(1, 10), { distinct: true }), vis = V10.bar(ds.cats, ds.vals, { step, color: R.pick(COLS), title: ds.t.t }), k = R.int(0, 2);
    const [i, j] = R.sample([0, 1, 2, 3], 2), a = Math.max(i, j) === i ? i : j;
    const hi = ds.vals[i] > ds.vals[j] ? i : j, lo = hi === i ? j : i;
    if (k === 0) { const d = ds.vals[hi] - ds.vals[lo];
      return R.bool(0.4) ? choice(R, `How many more chose ${ds.cats[hi]} than ${ds.cats[lo]}?`, d, [d / step, ds.vals[hi] + ds.vals[lo], d + step], `${ds.vals[hi]} ${M} ${ds.vals[lo]} = ${d}. Read the scale, don't count the lines.`, { visual: vis })
        : num(`How many more chose ${ds.cats[hi]} than ${ds.cats[lo]}?`, d, `${ds.vals[hi]} ${M} ${ds.vals[lo]} = ${d}.`, { visual: vis }); }
    if (k === 1) return num(`How many chose ${ds.cats[i]} or ${ds.cats[j]}?`, ds.vals[i] + ds.vals[j], `${ds.vals[i]} + ${ds.vals[j]} = ${ds.vals[i] + ds.vals[j]}.`, { visual: vis });
    return num(`How many votes are shown in all?`, sum(ds.vals), `${ds.vals.join(' + ')} = ${sum(ds.vals)}.`, { visual: vis }); } },
  d: { t: 'choose a scale', g: (R) => {
    if (R.bool(0.35)) { const step = R.pick([2, 5, 10, 20, 25]), mx = R.int(3, 9) * step + R.int(1, step - 1);
      return num(`A bar graph counts by ${step}. The largest value is ${mx}. What is the smallest top number that fits it?`, Math.ceil(mx / step) * step, `Count by ${step} past ${mx}: the next line is ${Math.ceil(mx / step) * step}.`); }
    const s = R.pick([2, 5, 10]);
    const ds = dataset(R, 4, () => s === 2 ? 2 * R.int(1, 10) : s === 5 ? 5 * R.int(1, 10) : 10 * R.int(1, 10), { distinct: true, ok: v => {
      const mx = Math.max(...v);
      if (s === 2) return mx > 10 && mx <= 20 && v.some(x => x % 10);
      if (s === 5) return mx > 20 && mx <= 50 && v.some(x => x % 10);
      return mx > 50; } });
    const opts = [1, 2, 5, 10], why = s === 2 ? `Scale 1 needs ${Math.max(...ds.vals)} lines, too many. Scale 5 or 10 leaves bars between lines (${ds.vals.find(x => x % 10)}).`
      : s === 5 ? `Scale 1 or 2 needs more than 10 lines for ${Math.max(...ds.vals)}. Scale 10 leaves ${ds.vals.find(x => x % 10)} between lines.`
      : `Scales 1, 2 and 5 need more than 10 lines for ${Math.max(...ds.vals)}. Every value is a multiple of 10.`;
    return choiceFixed(`Data: ${ds.cats.map((c, i) => `${c} ${ds.vals[i]}`).join(', ')}. The graph has 10 lines above 0. Which scale makes every bar end on a line?`,
      opts.map(o => `count by ${o}`), opts.indexOf(s), why); } },
}});

/* ================= II.10.03 Pictographs with keys ================= */
const pictoData = (R, key, k, o = {}) => dataset(R, k, () => (o.half ? R.int(1, 15) : R.int(1, 8) * 2) * key / 2, Object.assign({ distinct: true }, o));
const symW = (n, key) => { const s = n / key; return Number.isInteger(s) ? String(s) : `${Math.floor(s)} and a half`; };
E2.skill({ id: 'II.10.03', name: 'Pictographs with keys', steps: {
  a: { t: 'a key of 2', g: (R) => {
    const ds = pictoData(R, 2, R.int(3, 4)), icon = R.pick(ICONS), col = R.pick(COLS), vis = V10.picto(ds.cats.map((c, i) => ({ label: c, n: ds.vals[i] })), 2, { icon, color: col }), i = R.int(0, ds.cats.length - 1), v = ds.vals[i];
    if (R.bool(0.3)) { const j = (i + 1) % ds.cats.length, [h, l] = ds.vals[i] > ds.vals[j] ? [i, j] : [j, i];
      return num(`How many more chose ${ds.cats[h]} than ${ds.cats[l]}?`, ds.vals[h] - ds.vals[l], `${ds.cats[h]}: ${ds.vals[h] / 2} ${X} 2 = ${ds.vals[h]}. ${ds.cats[l]}: ${ds.vals[l] / 2} ${X} 2 = ${ds.vals[l]}. ${ds.vals[h]} ${M} ${ds.vals[l]} = ${ds.vals[h] - ds.vals[l]}.`, { visual: vis }); }
    if (R.bool(0.4)) return choice(R, `How many chose ${ds.cats[i]}?`, v, [v / 2, v + 2, v / 2 + 2].filter(x => x !== v), `Each symbol means 2: ${v / 2} ${X} 2 = ${v}, not ${v / 2}.`, { visual: vis });
    return num(`How many chose ${ds.cats[i]}?`, v, `Each symbol means 2: ${v / 2} ${X} 2 = ${v}.`, { visual: vis }); } },
  b: { t: 'half symbols', g: (R) => {
    const key = R.pick([2, 4, 6, 10]), ds = pictoData(R, key, R.int(3, 4), { half: true, ok: v => v.filter(x => (x / key) % 1).length >= 1 && v.every(x => x / key <= 7.5) });
    const vis = V10.picto(ds.cats.map((c, i) => ({ label: c, n: ds.vals[i] })), key, { icon: R.pick(ICONS), color: R.pick(COLS) });
    const i = R.pick(ds.vals.map((x, k) => k).filter(k => (ds.vals[k] / key) % 1)), v = ds.vals[i], w = Math.floor(v / key);
    const ex = `${w} whole symbol${w === 1 ? '' : 's'} = ${w} ${X} ${key} = ${w * key}, and half a symbol = ${key / 2}. ${w * key} + ${key / 2} = ${v}.`;
    if (R.bool(0.35)) return choice(R, `How many chose ${ds.cats[i]}?`, v, [w * key, (w + 1) * key, w + 1].filter(x => x !== v), ex, { visual: vis });
    return num(`How many chose ${ds.cats[i]}?`, v, ex, { visual: vis }); } },
  c: { t: 'make one', g: (R) => {
    const key = R.pick([2, 4, 5, 10]), icon = R.pick(ICONS), col = R.pick(COLS), half = key % 2 === 0 && R.bool(0.6);
    const s = half ? R.int(1, 6) + 0.5 : R.int(2, 7), v = s * key, row = n => V10.prow(n, icon, col);
    const pr = `Use the key. Which row shows ${v}?`, ex = `${v} ${D} ${key} = ${half ? `${Math.floor(s)} and a half` : s}, so draw ${symW(v, key)} symbols.`;
    const ds = half ? [Math.floor(s), Math.ceil(s), s + 1] : [s + 1, s - 1 >= 1 ? s - 1 : s + 2, s + 0.5];
    if (!half && v <= 10) ds.unshift(v);
    if (half && v <= 9) ds.unshift(v);
    const key1 = V.svg(170, 36, `<rect x="2" y="2" width="166" height="32" rx="6" fill="${C.faint}"/>` + V.text(14, 18, 'Key:', { size: 14, anchor: 'start', fill: C.muted }) + iconFrag(icon, 66, 18, 22, col) + V.text(82, 18, `= ${key}`, { size: 16, anchor: 'start', weight: 700 }), 'key');
    return choice(R, pr, row(s), ds.filter(x => x !== s).slice(0, 3).map(row), ex, { visual: key1 }); } },
  d: { t: 'compare', g: (R) => {
    const key = R.pick([2, 4, 10]), ds = pictoData(R, key, 4, { half: true, ok: v => v.filter(x => (x / key) % 1).length >= 2 && v.every(x => x / key <= 7.5) });
    const vis = V10.picto(ds.cats.map((c, i) => ({ label: c, n: ds.vals[i] })), key, { icon: R.pick(ICONS), color: R.pick(COLS) }), k = R.int(0, 2);
    const [i, j] = R.sample([0, 1, 2, 3], 2), [h, l] = ds.vals[i] > ds.vals[j] ? [i, j] : [j, i], rd = x => `${symW(ds.vals[x], key)} ${X} ${key} = ${ds.vals[x]}`;
    if (k === 0) { const d = ds.vals[h] - ds.vals[l];
      return R.bool(0.4) ? choice(R, `How many more chose ${ds.cats[h]} than ${ds.cats[l]}?`, d, [d / key, d + key, d - key / 2 > 0 ? d - key / 2 : d + key / 2].filter(x => x !== d), `${ds.cats[h]}: ${rd(h)}. ${ds.cats[l]}: ${rd(l)}. ${ds.vals[h]} ${M} ${ds.vals[l]} = ${d}.`, { visual: vis })
        : num(`How many more chose ${ds.cats[h]} than ${ds.cats[l]}?`, d, `${ds.cats[h]}: ${rd(h)}. ${ds.cats[l]}: ${rd(l)}. ${ds.vals[h]} ${M} ${ds.vals[l]} = ${d}.`, { visual: vis }); }
    if (k === 1) return num(`How many chose ${ds.cats[i]} or ${ds.cats[j]}?`, ds.vals[i] + ds.vals[j], `${ds.cats[i]}: ${rd(i)}. ${ds.cats[j]}: ${rd(j)}. Together ${ds.vals[i] + ds.vals[j]}.`, { visual: vis });
    const tot = sum(ds.vals); return num(`How many votes are shown in all?`, tot, `${sum(ds.vals.map(x => x / key))} symbols ${X} ${key} = ${tot}.`, { visual: vis }); } },
}});

/* ================= II.10.04 Tables and frequency ================= */
const freqTable = (ds, o = {}) => V10.table([ds.t.t, 'Frequency'], ds.cats.map((c, i) => [c, o.q === i ? '?' : ds.vals[i]]).concat(o.total !== undefined ? [['Total', o.total]] : []), { boldLast: o.total !== undefined });
E2.skill({ id: 'II.10.04', name: 'Tables and frequency', steps: {
  a: { t: 'read', g: (R) => {
    const ds = dataset(R, R.int(3, 5), () => R.int(2, 15), { uniqueMax: true, uniqueMin: true }), k = R.int(0, 2);
    if (k === 0) { const i = R.int(0, ds.cats.length - 1);
      const vis = V10.table([ds.t.t, 'Tally', 'Frequency'], ds.cats.map((c, j) => [c, { tally: ds.vals[j] }, j === i ? '?' : ds.vals[j]]));
      return num(`What frequency goes in the box?`, ds.vals[i], `Count the tally for ${ds.cats[i]}: ${Math.floor(ds.vals[i] / 5) ? `${Math.floor(ds.vals[i] / 5)} bundle${Math.floor(ds.vals[i] / 5) === 1 ? '' : 's'} of 5 and ${ds.vals[i] % 5} more` : `${ds.vals[i]} single marks`} = ${ds.vals[i]}.`, { visual: vis }); }
    const vis = freqTable(ds);
    if (k === 1) { const i = R.int(0, ds.cats.length - 1); return num(`How many chose ${ds.cats[i]}?`, ds.vals[i], `Find the ${ds.cats[i]} row: its frequency is ${ds.vals[i]}.`, { visual: vis }); }
    const most = R.bool(), idx = ds.vals.indexOf(most ? Math.max(...ds.vals) : Math.min(...ds.vals));
    return choice(R, `Which was chosen ${most ? 'most' : 'least'} often?`, ds.cats[idx], ds.cats.filter((c, j) => j !== idx).slice(0, 3), `${ds.cats[idx]} has the ${most ? 'highest' : 'lowest'} frequency, ${ds.vals[idx]}.`, { visual: vis }); } },
  b: { t: 'make', g: (R) => {
    const ds = dataset(R, R.int(3, 4), () => R.int(1, 6), { ok: v => sum(v) >= 10 && sum(v) <= 18 }), words = R.shuffle([].concat(...ds.cats.map((c, i) => Array(ds.vals[i]).fill(c))));
    const i = R.int(0, ds.cats.length - 1);
    if (R.bool(0.3)) return num(`${ds.t.ask}? Make a frequency table. What is the total of the Frequency column?`, words.length, `Every answer counts once, so the frequencies add to the number of answers: ${words.length}.`, { visual: V10.chips(words) });
    return num(`${ds.t.ask}? Make a frequency table. What is the frequency for ${ds.cats[i]}?`, ds.vals[i], `Count every "${ds.cats[i]}": ${ds.vals[i]}.`, { visual: V10.chips(words) }); } },
  c: { t: 'totals', g: (R) => {
    const ds = dataset(R, R.int(3, 5), () => R.int(3, 18)), tot = sum(ds.vals), k = R.int(0, 2);
    if (k === 0) return num(`How many people answered in all?`, tot, `Add the frequencies: ${ds.vals.join(' + ')} = ${tot}.`, { visual: freqTable(ds) });
    const i = R.int(0, ds.cats.length - 1), rest = tot - ds.vals[i];
    if (k === 1) return num(`${tot} people answered. What is the missing frequency?`, ds.vals[i], `The others add to ${rest}. ${tot} ${M} ${rest} = ${ds.vals[i]}.`, { visual: freqTable(ds, { q: i }) });
    const asked = tot + R.int(1, 4);
    return num(`${asked} people were asked. How many answers are missing from the table?`, asked - tot, `The table totals ${ds.vals.join(' + ')} = ${tot}. ${asked} ${M} ${tot} = ${asked - tot} missing.`, { visual: freqTable(ds) }); } },
  d: { t: 'compare', g: (R) => {
    const k = R.int(0, 3);
    if (k === 3) { // fraction of the total
      const ds = dataset(R, R.int(3, 4), () => R.int(1, 12), { ok: v => [10, 12, 20, 24, 25, 30].includes(sum(v)) }), tot = sum(ds.vals), i = R.int(0, ds.cats.length - 1), [n, d] = E2.reduce(ds.vals[i], tot);
      return num(`What fraction of the people chose ${ds.cats[i]}? Write it in simplest form.`, frac(ds.vals[i], tot, 'simplest'), `${ds.vals[i]} out of ${tot}: ${fh(ds.vals[i], tot)}${n !== ds.vals[i] ? ` = ${fh(n, d)}` : ''}.`, { visual: freqTable(ds) }); }
    const ds = dataset(R, 4, () => R.int(2, 20), { distinct: true }), vis = freqTable(ds);
    const [i, j, l] = R.sample([0, 1, 2, 3], 3), [h, lo] = ds.vals[i] > ds.vals[j] ? [i, j] : [j, i];
    if (k === 0) return num(`How many more chose ${ds.cats[h]} than ${ds.cats[lo]}?`, ds.vals[h] - ds.vals[lo], `${ds.vals[h]} ${M} ${ds.vals[lo]} = ${ds.vals[h] - ds.vals[lo]}.`, { visual: vis });
    if (k === 1) { const two = ds.vals[i] + ds.vals[j], d = Math.abs(two - ds.vals[l]); if (!d) return again('II.10.04', 'd', R);
      const more = two > ds.vals[l];
      return num(`${cap(ds.cats[i])} and ${ds.cats[j]} together: how many ${more ? 'more' : 'fewer'} than ${ds.cats[l]}?`, d, `${ds.vals[i]} + ${ds.vals[j]} = ${two}. ${more ? `${two} ${M} ${ds.vals[l]}` : `${ds.vals[l]} ${M} ${two}`} = ${d}.`, { visual: vis }); }
    // times as many
    const b = R.int(2, 6), m = R.int(2, 4), ds2 = dataset(R, 3, () => R.int(1, 20)); ds2.vals[0] = b * m; ds2.vals[1] = b; if (ds2.vals[2] === b || ds2.vals[2] === b * m) ds2.vals[2] = b * m + 1;
    return num(`${cap(ds2.cats[0])} was chosen how many times as often as ${ds2.cats[1]}?`, m, `${b * m} ${D} ${b} = ${m}.`, { visual: freqTable(ds2) }); } },
}});

/* ================= II.10.05 The mean as a fair share ================= */
const meanSet = (R, n, lo, hi, o = {}) => { for (let t = 0; t < 500; t++) { const v = Array.from({ length: n }, () => R.int(lo, hi)); if (sum(v) % n) continue; const m = sum(v) / n; if (v.every(x => x === m)) continue; if (o.ok && !o.ok(v, m)) continue; return v; } throw new Error('meanSet'); };
const THINGS = [['stickers', 'has'], ['marbles', 'has'], ['cards', 'has'], ['shells', 'found'], ['pages', 'read'], ['books', 'read']];
E2.skill({ id: 'II.10.05', name: 'The mean as a fair share', steps: {
  a: { t: 'level the towers', g: (R) => {
    const n = R.int(3, 4), v = meanSet(R, n, 1, 8), m = sum(v) / n, vis = V10.towers(v);
    if (R.bool(0.3)) { const mx = Math.max(...v); return num(`Level the towers so they are all the same height. How many cubes come off the tallest tower?`, mx - m, `${sum(v)} cubes ${D} ${n} towers = ${m} each. The tallest has ${mx}, so ${mx} ${M} ${m} = ${mx - m} come off.`, { visual: vis }); }
    return num(`Move cubes until all the towers are the same height. How tall is each tower?`, m, `There are ${sum(v)} cubes in ${n} towers: ${sum(v)} ${D} ${n} = ${m}.`, { visual: vis }); } },
  b: { t: 'total ÷ count', g: (R) => {
    const n = R.int(3, 6), v = meanSet(R, n, 2, n > 4 ? 30 : 50), tot = sum(v), m = tot / n;
    const ex = `Total ${v.join(' + ')} = ${tot}. Divide by ${n} values: ${tot} ${D} ${n} = ${m}.`;
    if (R.bool(0.4)) { const ds = [tot, Math.max(...v), tot % 2 === 0 ? tot / 2 : m + 1, n > 3 && tot % (n - 1) === 0 ? tot / (n - 1) : m + 2];
      return choice(R, `What is the mean of ${list(v)}?`, m, ds, ex + ` Divide by how many values there are, not by 2.`); }
    return num(`What is the mean of ${list(v)}?`, m, ex); } },
  c: { t: 'change one value', g: (R) => {
    const n = R.int(3, 5), v = meanSet(R, n, 2, 20), m = sum(v) / n, k = R.int(0, 2);
    if (k === 0) { const i = R.int(0, n - 1), dlt = n * R.int(1, 3), up = R.bool(0.65) || v[i] - dlt < 0, nv = up ? v[i] + dlt : v[i] - dlt;
      return num(`The mean of ${list(v)} is ${m}. The ${v[i]} changes to ${nv}. What is the new mean?`, up ? m + dlt / n : m - dlt / n, `The total goes ${up ? 'up' : 'down'} by ${dlt}, so the mean goes ${up ? 'up' : 'down'} by ${dlt} ${D} ${n} = ${dlt / n}: ${up ? m + dlt / n : m - dlt / n}.`); }
    if (k === 1) { const m2 = m + R.int(1, 3), nv = (n + 1) * m2 - n * m;
      return num(`The mean of ${list(v)} is ${m}. The value ${nv} is added. What is the new mean?`, m2, `New total ${sum(v)} + ${nv} = ${sum(v) + nv}, over ${n + 1} values: ${sum(v) + nv} ${D} ${n + 1} = ${m2}.`); }
    const add = R.bool() ? m : m + R.pick([n + 1, 2 * (n + 1)]), same = add === m, newM = (sum(v) + add) / (n + 1);
    return tf(`The mean of ${list(v)} is ${m}. Adding the value ${add} keeps the mean at ${m}.`, same, same ? `A value equal to the mean adds exactly one fair share, so the mean stays ${m}.` : `${add} is above the mean, so the mean rises: ${sum(v) + add} ${D} ${n + 1} = ${newM}.`); } },
  d: { t: 'word problems', g: (R) => {
    const k = R.int(0, 2), [thing, verb] = R.pick(THINGS);
    if (k === 0) { const n = R.int(3, 5), v = meanSet(R, n, 3, 25), names = R.sample(NAMES, n), m = sum(v) / n;
      return num(`${names.map((p, i) => `${p} ${verb} ${v[i]}`).join(', ')} ${thing}. If they share them equally, how many does each get?`, m, `Total ${sum(v)} ${thing} ${D} ${n} people = ${m} each.`); }
    if (k === 1) { const n = R.int(3, 6), m = R.int(6, 25), N = R.pick(NAMES);
      return num(`${N}'s mean score on ${n} games is ${m}. What is the total of the ${n} scores?`, n * m, `Mean ${X} count = total: ${m} ${X} ${n} = ${n * m}.`); }
    const n = R.int(3, 4), m = R.int(8, 20), known = Array.from({ length: n - 1 }, () => R.int(m - 6, m + 6)), last = n * m - sum(known);
    if (last < 1 || last > 40) return again('II.10.05', 'd', R);
    return num(`${n} scores have a mean of ${m}. Three are ${list(known.slice(0, n - 1))}`.replace('Three', n - 1 === 3 ? 'Three' : 'Two') + `. What is the missing score?`, last, `The total must be ${m} ${X} ${n} = ${n * m}. ${n * m} ${M} ${sum(known)} = ${last}.`); } },
}});

/* ================= II.10.06 A typical value ================= */
const median = v => v.slice().sort((a, b) => a - b)[(v.length - 1) / 2];
E2.skill({ id: 'II.10.06', name: 'A typical value', steps: {
  a: { t: 'most common', g: (R) => {
    if (R.bool(0.35)) { const c = R.pick(LP), cnt = lpCounts(R, c), vals = Object.keys(cnt).map(Number), mode = vals.find(v => cnt[v] === Math.max(...Object.values(cnt)));
      return num(`What is the mode (the most common value)?`, mode, `The tallest stack is above ${mode}.`, { visual: V10.lplot(c.lo, c.hi, 1, cnt, { title: c.t }) }); }
    for (;;) { const n = R.int(7, 11), mode = R.int(2, 15), v = Array.from({ length: n - 3 }, () => R.int(1, 18)).concat([mode, mode, mode]);
      const c = {}; v.forEach(x => c[x] = (c[x] || 0) + 1); if (Object.keys(c).filter(k => c[k] >= c[mode]).length > 1) continue;
      const s = R.shuffle(v);
      return num(`What is the mode of ${list(s)}?`, mode, `${mode} appears ${c[mode]} times, more than any other value.`); } } },
  b: { t: 'the middle value', g: (R) => {
    const n = R.pick([5, 7, 9]), v = R.shuffle(R.distinct(1, 40, n)), s = v.slice().sort((a, b) => a - b), md = s[(n - 1) / 2], mid = v[(n - 1) / 2];
    const ex = `In order: ${list(s)}. The middle one is ${md}.`;
    if (mid !== md && R.bool(0.5)) return choice(R, `What is the median of ${list(v)}?`, md, [mid, s[(n - 1) / 2 + 1], s[(n - 1) / 2 - 1]], ex + ` Order the data before finding the middle.`);
    return num(`What is the median of ${list(v)}?`, md, ex); } },
  c: { t: 'compare with the mean', g: (R) => {
    for (;;) { const n = R.pick([5, 5, 7]), base = R.int(4, 15), v = Array.from({ length: n - 1 }, () => base + R.int(-3, 3)), rest = sum(v);
      let big = base + R.int(20, 60); big += (n - (rest + big) % n) % n; v.push(big);
      const md = median(v), mn = sum(v) / n; if (mn === md) continue;
      const s = R.shuffle(v), sorted = v.slice().sort((a, b) => a - b);
      if (R.bool(0.4)) return num(`For ${list(s)}: how much greater is the mean than the median?`, mn - md, `Median: ${md} (middle of ${list(sorted)}). Mean: ${sum(v)} ${D} ${n} = ${mn}. ${mn} ${M} ${md} = ${mn - md}.`);
      return num(`Find the median and the mean of ${list(s)}.`, [{ label: 'median', ans: md }, { label: 'mean', ans: mn }], `In order: ${list(sorted)}, middle ${md}. Mean: ${sum(v)} ${D} ${n} = ${mn}. The big value ${big} pulls the mean up.`); } } },
  d: { t: 'which describes it best', g: (R) => {
    const opts = ['the mean', 'the median', 'the mode'], k = R.int(0, 2);
    if (k === 0) { for (;;) { const kind = R.pick([['Ages at a party', 'years', 6, 12], ['Prices of 5 toys', O => '', 3, 12], ['Minutes each kid read', 'minutes', 10, 30]]);
        const v = R.distinct(kind[2], kind[3], 4); let big = kind[3] * R.int(4, 8); v.push(big); if (sum(v) % 5) { big += 5 - sum(v) % 5; v[4] = big; }
        const s = R.shuffle(v), md = median(v), mn = sum(v) / 5;
        return choiceFixed(`${kind[0]}: ${list(s)}. Which typical value describes most of them best?`, opts, 1, `The mean is ${mn}, dragged up by ${big}. The median, ${md}, sits in the middle with most of the values.`); } }
    if (k === 1) { const ds = dataset(R, 4, () => R.int(1, 9), { uniqueMax: true }), mx = ds.cats[ds.vals.indexOf(Math.max(...ds.vals))];
      return choiceFixed(`${ds.t.t}: ${ds.cats.map((c, i) => `${c} ${ds.vals[i]}`).join(', ')}. Which typical value makes sense here?`, opts, 2, `The answers are words, not numbers, so there is no mean or median. The mode is ${mx}.`); }
    const n = R.int(3, 5), v = meanSet(R, n, 2, 20), [thing] = R.pick(THINGS.slice(0, 4)), names = R.sample(NAMES, n);
    return choiceFixed(`${names.join(', ')} have ${list(v)} ${thing}. They share them all equally. Which value tells how many each gets?`, opts, 0, `The mean is the fair share: ${sum(v)} ${D} ${n} = ${sum(v) / n} each.`); } },
}});

/* ================= II.10.07 Line graphs ================= */
const LG = O => [
  O.units === 'imperial' ? { cmp: (x, h, l) => `At ${x}, how many degrees warmer was ${h} than ${l}?`, val: x => `What was the temperature at ${x}, in °F?`, t: 'Temperature (°F)', xs: ['8am', '9am', '10am', '11am', '12pm', '1pm'], step: 5, lo: 10, hi: 18, u: '°F', what: 'the temperature', unit: 'degrees' }
    : { cmp: (x, h, l) => `At ${x}, how many degrees warmer was ${h} than ${l}?`, val: x => `What was the temperature at ${x}, in °C?`, t: 'Temperature (°C)', xs: ['8am', '9am', '10am', '11am', '12pm', '1pm'], step: 2, lo: 5, hi: 15, u: '°C', what: 'the temperature', unit: 'degrees' },
  O.units === 'imperial' ? { cmp: (x, h, l) => `At ${x}, how many inches taller was ${h} than ${l}?`, val: x => `How tall was the plant at ${x}, in inches?`, t: 'Plant height (in)', xs: ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4', 'Wk 5'], step: 2, lo: 1, hi: 12, u: 'in', what: 'the plant', unit: 'inches', grow: 1 }
    : { cmp: (x, h, l) => `At ${x}, how many centimeters taller was ${h} than ${l}?`, val: x => `How tall was the plant at ${x}, in centimeters?`, t: 'Plant height (cm)', xs: ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4', 'Wk 5'], step: 5, lo: 1, hi: 12, u: 'cm', what: 'the plant', unit: 'centimeters', grow: 1 },
  { cmp: (x, h, l) => `On ${x}, how many more books did ${h} sell than ${l}?`, val: x => `How many books were sold on ${x}?`, t: 'Books sold', xs: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], step: 10, lo: 1, hi: 10, u: 'books', what: 'sales', unit: 'books' },
  { cmp: (x, h, l) => `In ${x}, how many more visitors did ${h} have than ${l}?`, val: x => `How many visitors came in ${x}?`, t: 'Visitors to the park', xs: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'], step: 20, lo: 1, hi: 10, u: 'visitors', what: 'visitors', unit: 'visitors' },
];
// series in units of the step (whole steps) → values
const lgSeries = (R, c, o = {}) => { for (let t = 0; t < 500; t++) {
  const n = c.xs.length; let v = [R.int(c.lo, c.hi)];
  for (let i = 1; i < n; i++) v.push(c.grow ? v[i - 1] + R.int(0, 3) : v[i - 1] + R.int(-3, 3));
  if (v.some(x => x < 1 || x > (c.grow ? 12 : c.hi + 2))) continue;
  if (o.ok && !o.ok(v)) continue; return v.map(x => x * c.step); } throw new Error('lgSeries'); };
E2.skill({ id: 'II.10.07', name: 'Line graphs', steps: {
  a: { t: 'read change over time', g: (R, O) => {
    const c = R.pick(LG(O)), v = lgSeries(R, c, { ok: v => new Set(v).size >= 3 }), vis = V10.line(c.xs, [{ vals: v, color: R.pick(COLS) }], { step: c.step, title: c.t }), k = R.int(0, 2);
    if (k === 0) { const i = R.int(0, v.length - 1); return num(c.val(c.xs[i]), v[i], `Go up from ${c.xs[i]} to the point, then across to the scale: ${v[i]}.`, { visual: vis }); }
    const pairs = []; for (let i = 0; i < v.length; i++) for (let j = i + 1; j < v.length; j++) if (v[j] !== v[i]) pairs.push([i, j]);
    const [i, j] = R.pick(pairs), up = v[j] > v[i];
    return num(`From ${c.xs[i]} to ${c.xs[j]}, by how many ${c.unit} did ${c.what} ${up ? (c.grow ? 'grow' : 'go up') : 'go down'}?`, Math.abs(v[j] - v[i]), `${c.xs[i]}: ${v[i]}. ${c.xs[j]}: ${v[j]}. ${up ? `${v[j]} ${M} ${v[i]}` : `${v[i]} ${M} ${v[j]}`} = ${Math.abs(v[j] - v[i])}.`, { visual: vis }); } },
  b: { t: 'plot', g: (R, O) => {
    const c = R.pick(LG(O)), v = lgSeries(R, c, { ok: v => new Set(v).size >= 4 }), col = R.pick(COLS), tbl = V10.table(['', ...c.xs], [[c.u, ...v]], { first: 70, cell: 74 });
    const top = Math.ceil(Math.max(...v) / c.step) * c.step + c.step;
    if (R.bool(0.5)) { // spot the wrong point
      const i = R.int(0, v.length - 1), w = v.slice(); w[i] = v[i] + (v[i] > c.step && R.bool() ? -c.step : c.step);
      return choice(R, `One point was plotted wrong. Which one?`, c.xs[i], R.sample(c.xs.filter((x, k) => k !== i), 3), `The table says ${c.xs[i]} is ${v[i]}, but the point is at ${w[i]}.`, { visual: V.stack([tbl, V10.line(c.xs, [{ vals: w, color: col }], { step: c.step, top })]) }); }
    const g = vs => V10.line(c.xs, [{ vals: vs, color: col }], { step: c.step, top, ph: 140, sp: 50 });
    const i = R.int(0, v.length - 2), sw = v.slice(); [sw[i], sw[i + 1]] = [sw[i + 1], sw[i]];
    const off = v.slice(), j = R.int(0, v.length - 1); off[j] += c.step;
    return choice(R, `Which line graph shows the table?`, g(v), [sw, off].filter(x => x.join() !== v.join()).map(g), `Plot each time's value in order: ${c.xs.map((x, k) => `${x} ${v[k]}`).join(', ')}.`, { visual: tbl }); } },
  c: { t: 'spot a trend', g: (R, O) => {
    const c = R.pick(LG(O)), k = R.int(0, 2);
    if (k === 0) { const v = lgSeries(R, c, { ok: v => { const d = v.slice(1).map((x, i) => x - v[i]); const mx = Math.max(...d); return mx > 0 && d.filter(x => x === mx).length === 1 && d.indexOf(mx) !== d.length - 1; } });
      const d = v.slice(1).map((x, i) => x - v[i]), i = d.indexOf(Math.max(...d)), ivs = c.xs.slice(1).map((x, k) => `${c.xs[k]} to ${x}`);
      return choice(R, `Between which two times did ${c.what} go up the most?`, ivs[i], R.sample(ivs.filter((x, k) => k !== i), 3), `The steepest rise is ${ivs[i]}: up ${d[i]}.`, { visual: V10.line(c.xs, [{ vals: v, color: R.pick(COLS) }], { step: c.step, title: c.t }) }); }
    const trend = c.grow ? (R.bool(0.7) ? 0 : 2) : R.int(0, 2), n = c.xs.length;
    const v = (() => { for (let t = 0; t < 500; t++) { let w;
      if (trend === 2) { const b = R.int(c.lo + 1, c.hi); w = c.xs.map(() => b + R.int(0, 1)); }
      else { w = [R.int(c.lo, c.lo + 2)]; for (let i = 1; i < n; i++) w.push(w[i - 1] + (R.bool(0.8) ? R.int(1, 2) : c.grow ? 0 : R.int(-1, 0))); if (trend === 1) w.reverse(); }
      const d = w.slice(1).map((x, i) => x - w[i]);
      if (trend === 2 ? d.every(x => !x) : Math.abs(w[n - 1] - w[0]) < 4) continue;
      if (Math.max(...w) > (c.grow ? 12 : c.hi + 2)) continue;
      if (trend === 1 && k === 1 && d.filter(x => x < 0).length === n - 1) continue;
      return w.map(x => x * c.step); } throw new Error('trend'); })();
    if (k === 1 && !c.grow) { const d = v.slice(1).map((x, i) => x - v[i]), dn = d.map((x, i) => x < 0 ? i : -1).filter(i => i >= 0);
      if (dn.length === 1) { const ivs = c.xs.slice(1).map((x, k) => `${c.xs[k]} to ${x}`), i = dn[0];
        return choice(R, `Between which two times did ${c.what} go down?`, ivs[i], R.sample(ivs.filter((x, k) => k !== i), 3), `Only from ${ivs[i]} does the line fall.`, { visual: V10.line(c.xs, [{ vals: v, color: R.pick(COLS) }], { step: c.step, title: c.t }) }); } }
    const opts = ['mostly went up', 'mostly went down', 'stayed about the same'];
    return choiceFixed(`Over the whole time, ${c.what}…`, opts, trend, trend === 2 ? `The line stays within one step of the scale: about the same.` : `From ${v[0]} at ${c.xs[0]} to ${v[n - 1]} at ${c.xs[n - 1]}, the line ${trend ? 'falls' : 'climbs'} almost every step.`, { visual: V10.line(c.xs, [{ vals: v, color: R.pick(COLS) }], { step: c.step, title: c.t }) }); } },
  d: { t: 'compare two lines', g: (R, O) => {
    const c = R.pick(LG(O)), [ca, cb] = R.sample(COLS, 2), names = c.grow ? ['Plant A', 'Plant B'] : c.what === 'the temperature' ? ['Town A', 'Town B'] : c.what === 'sales' ? ['Shop A', 'Shop B'] : ['Park A', 'Park B'];
    for (let t = 0; t < 200; t++) {
      const a = lgSeries(R, c), b = lgSeries(R, c), diff = a.map((x, i) => x - b[i]);
      if (diff.some(x => x === 0) && !diff.every(x => x !== 0)) continue;
      const vis = V10.line(c.xs, [{ vals: a, color: ca, name: names[0] }, { vals: b, color: cb, name: names[1] }], { step: c.step, top: Math.ceil(Math.max(...a, ...b) / c.step) * c.step + c.step }), k = R.int(0, 2);
      if (k === 0) { const i = R.int(0, a.length - 1); if (!diff[i]) continue; const [h, l] = diff[i] > 0 ? [0, 1] : [1, 0], hv = [a, b][h][i], lv = [a, b][l][i];
        return num(c.cmp(c.xs[i], names[h], names[l]), hv - lv, `${names[h]}: ${hv}. ${names[l]}: ${lv}. ${hv} ${M} ${lv} = ${hv - lv}.`, { visual: vis }); }
      if (k === 1) { const ad = diff.map(Math.abs), mx = Math.max(...ad); if (ad.filter(x => x === mx).length > 1) continue; const i = ad.indexOf(mx);
        return choice(R, `When were the two lines furthest apart?`, c.xs[i], R.sample(c.xs.filter((x, k) => k !== i), 3), `At ${c.xs[i]} the gap is ${a[i]} ${M} ${b[i]}`.replace(`${a[i]} ${M} ${b[i]}`, a[i] > b[i] ? `${a[i]} ${M} ${b[i]} = ${mx}` : `${b[i]} ${M} ${a[i]} = ${mx}`) + `, the biggest gap.`, { visual: vis }); }
      const cross = diff.slice(1).map((x, i) => Math.sign(x) !== Math.sign(diff[i]) ? i + 1 : -1).filter(i => i > 0);
      if (cross.length !== 1 || diff.some(x => x === 0)) continue;
      const i = cross[0], lead = diff[i] > 0 ? 0 : 1;
      return choice(R, `${names[lead]} was behind at first. When was it first ahead?`, c.xs[i], R.sample(c.xs.filter((x, k) => k !== i && k > 0), 3), `Before ${c.xs[i]}, ${names[lead]}'s line is lower; at ${c.xs[i]} it is higher (${[a, b][lead][i]} vs ${[a, b][1 - lead][i]}).`, { visual: vis });
    }
    return again('II.10.07', 'a', R, O); } },
}});

/* ================= II.10.08 Collect and organize data ================= */
const FACTQ = ['How many days are in a week?', 'What is 6 + 7?', 'How many legs does a spider have?', 'What color is a ripe banana?', 'How many months are in a year?', 'How many sides does a square have?'];
const SCENES = [
  [0, 'Votes for the class pet: cat, dog or fish'], [0, 'The favorite fruit of each kid in class'], [0, 'How many cars of each color passed the school'], [0, 'Which sport each kid likes best'], [0, 'How each kid gets to school'],
  [1, 'The length of each kid\'s pencil, to the nearest ¼ inch'], [1, 'How many pets each kid in class has'], [1, 'How many hours each kid slept last night'], [1, 'How many books each kid read this month'], [1, 'The shoe size of each kid in class'],
  [2, 'The temperature outside every hour of one day'], [2, 'The height of a bean plant every week'], [2, 'The number of visitors to a park each month'], [2, 'A puppy\'s weight every month for a year'], [2, 'The number of books a library lent each day of one week'],
  [0, 'The favorite ice-cream flavor of each kid'], [0, 'Which lunch each kid picked: pizza, pasta or salad'], [0, 'The color of each kid\'s backpack'],
  [1, 'How many letters are in each kid\'s first name'], [1, 'How many brothers and sisters each kid has'], [1, 'How many minutes each kid takes to walk to school'],
  [2, 'The price of a bus ticket each year for ten years'], [2, 'The water in a rain gauge each day of one week'], [2, 'A child\'s height on each birthday'],
];
E2.skill({ id: 'II.10.08', name: 'Collect and organize data', steps: {
  a: { t: 'a survey question', g: (R) => {
    const t = R.pick(TOPICS), cats = R.sample(t.cats, 3);
    if (R.bool(0.5)) return choice(R, `Which is a good survey question for your class?`, `${t.ask}: ${cats.join(', ')} or other?`, [R.pick(FACTQ), `How many pets do you have: 0–1, 1–2 or 2–3?`], `A survey question gets different answers from different people (not one fact), with choices that don't overlap. "Other" catches everyone else.`);
    const noun = R.pick([['books did you read last month', 'books'], ['pets do you have', 'pets'], ['hours did you sleep last night', 'hours'], ['glasses of water did you drink today', 'glasses']]), a = R.int(2, 4);
    const good = `0, 1–${a}, ${a + 1}–${2 * a}, ${2 * a + 1} or more`;
    return choice(R, `"How many ${noun[0]}?" Which set of choices is best?`, good, [`0–${a}, ${a}–${2 * a}, ${2 * a}–${3 * a}`, `1–${a}, ${a + 1}–${2 * a}`, `a few, some, a lot`], `The choices must not overlap and must cover every answer: ${good}. In ${`0–${a}, ${a}–${2 * a}`}, the answer ${a} fits twice.`); } },
  b: { t: 'tally', g: (R) => {
    const k = R.int(0, 2);
    if (k === 0) { const n = R.int(6, 24); return num(`How many do these tally marks show?`, n, `${Math.floor(n / 5)} bundle${Math.floor(n / 5) === 1 ? '' : 's'} of 5 = ${5 * Math.floor(n / 5)}, plus ${n % 5} more = ${n}.`, { visual: V.svg(Math.max(60, tallyW(n) + 20), 40, tallyFrag(n, 10, 6), 'tally marks') }); }
    const ds = dataset(R, R.int(3, 4), () => R.int(1, 7), { ok: v => sum(v) >= 10 && sum(v) <= 18 && Math.max(...v) >= 5 }), words = R.shuffle([].concat(...ds.cats.map((c, i) => Array(ds.vals[i]).fill(c))));
    const i = k === 1 ? R.int(0, ds.cats.length - 1) : ds.vals.indexOf(Math.max(...ds.vals)), v = ds.vals[i];
    if (k === 1) return num(`${ds.t.ask}? How many tally marks go next to ${ds.cats[i]}?`, v, `One mark for every "${ds.cats[i]}": ${v}.`, { visual: V10.chips(words) });
    return num(`${ds.t.ask}? Tally the answers. How many full bundles of 5 does ${ds.cats[i]} get?`, Math.floor(v / 5), `${ds.cats[i]} has ${v} answers: ${Math.floor(v / 5)} bundle${Math.floor(v / 5) === 1 ? '' : 's'} of 5 and ${v % 5} more.`, { visual: V10.chips(words) }); } },
  c: { t: 'choose a display', g: (R) => {
    const [k, s] = R.pick(SCENES), opts = ['bar graph', 'line plot', 'line graph'];
    const why = ['The data are categories with counts: a bar graph compares them.', 'The data are one number per kid: a line plot shows how often each number appears.', 'The data change over time: a line graph shows the change.'];
    return choiceFixed(`Which display fits best? ${s}.`, opts, k, why[k]); } },
  d: { t: 'draw a conclusion', g: (R) => {
    const ds = dataset(R, 4, () => R.int(3, 12), { distinct: true, ok: v => Math.max(...v) * 2 < sum(v) }), tot = sum(ds.vals);
    const i = ds.vals.indexOf(Math.max(...ds.vals)), l = ds.vals.indexOf(Math.min(...ds.vals)), [a, b] = R.sample([0, 1, 2, 3].filter(x => x !== i), 2), [h, lo] = ds.vals[a] > ds.vals[b] ? [a, b] : [b, a], d = ds.vals[h] - ds.vals[lo];
    const vis = R.bool() ? V10.bar(ds.cats, ds.vals, { step: 2, color: R.pick(COLS), title: ds.t.t }) : freqTable(ds);
    const good = R.bool() ? `${cap(ds.cats[i])} was chosen most often.` : `${cap(ds.cats[h])} got ${d} more votes than ${ds.cats[lo]}.`;
    return choice(R, `${tot} kids answered. Which statement do the data support?`, good, [`Most kids chose ${ds.cats[i]}.`, `${cap(ds.cats[l])} was chosen most often.`, `${cap(ds.cats[h])} got ${d + R.pick([2, 3])} more votes than ${ds.cats[lo]}.`].slice(0, 3),
      `${cap(ds.cats[i])} leads with ${ds.vals[i]}, but that is less than half of ${tot}, so "most kids" is wrong. ${cap(ds.cats[h])} ${ds.vals[h]} ${M} ${ds.cats[lo]} ${ds.vals[lo]} = ${d}.`, { visual: vis }); } },
}});

/* ================= II.10.09 Read graphs critically ================= */
E2.skill({ id: 'II.10.09', name: 'Read graphs critically', steps: {
  a: { t: 'check the scale', g: (R) => {
    if (R.bool(0.5)) { // truncated axis
      const base = R.pick([40, 50, 80, 90, 100]), step = R.pick([1, 2]), ds = dataset(R, 3, () => base + step * R.int(1, 6), { distinct: true }), vis = V10.bar(ds.cats, ds.vals, { step, base, color: R.pick(COLS), title: ds.t.t });
      const [a, b] = R.sample([0, 1, 2], 2), [h, l] = ds.vals[a] > ds.vals[b] ? [a, b] : [b, a], d = ds.vals[h] - ds.vals[l];
      if (R.bool()) return num(`How many chose ${ds.cats[h]}?`, ds.vals[h], `The scale starts at ${base}, not 0, and counts by ${step}: the bar reaches ${ds.vals[h]}.`, { visual: vis });
      return num(`How many more chose ${ds.cats[h]} than ${ds.cats[l]}?`, d, `The scale starts at ${base}: ${ds.vals[h]} ${M} ${ds.vals[l]} = ${d}. The bars look much more different than that.`, { visual: vis }); }
    const step = R.pick([20, 25, 50]), ds = dataset(R, 4, () => step * R.int(1, 8) + (step % 2 === 0 && R.bool(0.3) ? step / 2 : 0), { distinct: true }) /* no half-people: halves only when the step is even */, vis = V10.bar(ds.cats, ds.vals, { step, color: R.pick(COLS), title: ds.t.t }), i = R.int(0, 3), v = ds.vals[i];
    const ex = v % step ? `The scale counts by ${step}. The bar ends halfway between ${v - step / 2} and ${v + step / 2}: ${v}.` : `The scale counts by ${step}: the bar reaches ${v}.`;
    return choice(R, `How many chose ${ds.cats[i]}?`, v, [Math.ceil(v / step), v + step, v % step ? v - step / 2 + 1 : v + step / 2].filter(x => x !== v), ex, { visual: vis }); } },
  b: { t: 'misleading graphs', g: (R) => {
    const opts = ['The scale does not start at 0.', 'The steps on the scale are not equal.', 'The bars are different colors.', 'The labels are under the bars.'];
    const kind = R.int(0, 2);
    const trunc = () => { const base = R.pick([50, 80, 90, 100]), ds = dataset(R, 3, () => base + R.int(1, 8), { distinct: true, ok: v => Math.max(...v) - Math.min(...v) >= 4 }); return { ds, g: (o = {}) => V10.bar(ds.cats, ds.vals, Object.assign({ step: 1, base, color: C.blue }, o)), base }; };
    const uneven = () => { const ticks = R.pick([[0, 10, 20, 30, 50, 100], [0, 5, 10, 20, 40, 80], [0, 10, 20, 50, 100, 200]]);
      const ds = dataset(R, 3, () => R.pick(ticks.slice(1)) - (R.bool() ? 0 : ticks[1] / 2), { distinct: true, ok: v => v.some(x => x > ticks[4]) && v.some(x => x <= ticks[2]) }); return { ds, ticks, g: (o = {}) => V10.bar(ds.cats, ds.vals, Object.assign({ ticks, color: C.blue }, o)) }; };
    if (kind === 0) { const T = trunc(), mx = Math.max(...T.ds.vals), mn = Math.min(...T.ds.vals), look = Math.round((mx - T.base) / (mn - T.base) * 10) / 10;
      return choice(R, `Why is this graph misleading?`, opts[0], [opts[1], opts[2], opts[3]], `The scale starts at ${T.base}, so ${mx} looks ${fmt(look)} times as tall as ${mn}, but it is only ${mx - mn} more.`, { visual: T.g({ colors: R.sample(COLS, 3) }) }); }
    if (kind === 1) { const U = uneven();
      return choice(R, `Why is this graph misleading?`, opts[1], [opts[0], opts[2], opts[3]], `The scale jumps ${U.ticks.slice(1).map((t, i) => t - U.ticks[i]).join(', ')}: equal spaces stand for different amounts, so bar heights can't be compared.`, { visual: U.g({ colors: R.sample(COLS, 3) }) }); }
    // which of two graphs misleads (same data)
    const T = trunc(), first = R.bool(), honest = V10.bar(T.ds.cats, T.ds.vals, { step: 20, top: Math.ceil(Math.max(...T.ds.vals) / 20) * 20, color: C.blue, ph: 150, sp: 56, bw: 34 }), bad = T.g({ ph: 150, sp: 56, bw: 34 });
    return choiceFixed(`Both graphs show the same data. Which one is misleading?`, ['Graph A', 'Graph B'], first ? 0 : 1, `Graph ${first ? 'A' : 'B'} starts its scale at ${T.base}, so small differences look huge.`, { visual: V.side(first ? [{ svg: bad, caption: 'Graph A' }, { svg: honest, caption: 'Graph B' }] : [{ svg: honest, caption: 'Graph A' }, { svg: bad, caption: 'Graph B' }]) }); } },
  c: { t: "what a graph can't tell you", g: (R) => {
    const ds = dataset(R, 4, () => R.int(2, 12), { distinct: true }), vis = V10.bar(ds.cats, ds.vals, { step: 2, color: R.pick(COLS), title: ds.t.t + ' (Class 4B)' }), [a, b] = R.sample(ds.cats, 2).sort((x, y) => ds.vals[ds.cats.indexOf(y)] - ds.vals[ds.cats.indexOf(x)]), N = R.pick(NAMES);
    const cant = R.pick([`Why do kids choose ${a}?`, `What did ${N} choose?`, `What do kids in another school choose?`, `Will ${a} be chosen most next year?`]);
    return choice(R, `Which question can this graph NOT answer?`, cant, [`How many chose ${a}?`, `Which was chosen least?`, `How many more chose ${a} than ${b}?`, `How many kids answered?`].slice(0, 3),
      `The graph shows only how many in Class 4B chose each answer. It can't tell reasons, single people, other groups or the future.`, { visual: vis }); } },
  d: { t: 'ask a better question', g: (R) => {
    const t = R.pick(TOPICS), c3 = R.sample(t.cats, 3), k = R.int(0, 2), fav = t.t.replace('Favorite ', '');
    if (k === 0) { const lead = t.ask.startsWith('What is your favorite') ? `Don't you agree ${c3[0]} is the best ${fav}?` : `Isn't taking the ${c3[0]} the best way to get to school?`;
      return choice(R, 'Which is the fairer survey question?', `${t.ask}: ${c3.join(', ')} or other?`, [lead], `"${lead}" pushes people toward one answer. A fair question gives the choices evenly.`); }
    if (k === 1) { const p = R.pick([['Do you read a lot?', 'How many books did you read last month?'], ['Do you sleep enough?', 'How many hours did you sleep last night?'], ['Is your family big?', 'How many people live in your home?'], ['Do you drink lots of water?', 'How many glasses of water did you drink today?'], ['Do you play outside much?', 'How many minutes did you play outside yesterday?']]);
      return choice(R, 'Which question gives data you can count and compare?', p[1], [p[0]], `"${p[0]}" gets yes or no, and people judge it differently. "${p[1]}" gets a number from everyone.`); }
    const a = R.int(2, 5);
    return choice(R, 'Which survey question is better?', `How many pets do you have: 0, 1–${a}, or more than ${a}?`, [`How many pets do you have: 0–${a}, or ${a}–${2 * a}?`, `How many pets do you have: 1–${a}, or ${a + 1}–${2 * a}?`], `Good choices don't overlap and cover every answer, including 0 and "more than ${a}".`); } },
}});
})();

