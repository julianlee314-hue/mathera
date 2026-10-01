
/* Mathera · Era I question core
   Shared by every unit file. Works in the browser (window.E1) and in Node (globalThis.E1).

   QUESTION FORMAT (what every step generator returns)
   {
     prompt:  string   short plain sentence; may contain <b>..</b>. No lore needed to answer.
     visual?: string   one SVG string (use V.* helpers), shown above the answer area
     kind:    'num' | 'choice'
     // kind 'num'   → fields: [{label?:string, ans:integer}]   (1–4 fields, whole numbers only)
     // kind 'choice'→ choices: string[] (plain text OR SVG strings), ans: index of the right one
     explain: string   one or two short sentences shown after answering
   }
   A step generator is  (R, O) => question   where R is the seeded random helper and
   O is the House Rules options object ({coins:'US'|'THB', units:'metric'|'imperial', clock:'12h'|'24h'}).
*/
(function (G) {
  const E1 = G.E1 = G.E1 || {};
  E1.skills = E1.skills || [];
  E1.byId = E1.byId || {};

  /* ---------- registry ---------- */
  // E1.skill({id:'I.1.01', name:'Count objects one by one', steps:{a:{t:'touch and count to 3', g:(R,O)=>q}, b:..., c:..., d:...}})
  E1.skill = function (def) {
    if (E1.byId[def.id]) throw new Error('duplicate skill ' + def.id);
    E1.skills.push(def); E1.byId[def.id] = def; return def;
  };
  E1.OPTS = { coins: 'US', units: 'metric', clock: '12h' };

  /* ---------- seeded random ---------- */
  E1.rng = function (seed) {
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
  E1.num = (prompt, ans, explain, extra = {}) => Object.assign({
    prompt, kind: 'num', explain,
    fields: Array.isArray(ans) ? ans.map(a => typeof a === 'object' ? a : { ans: a }) : [{ ans }],
  }, extra);
  // multiple choice: correct + distractors (duplicates of correct or each other are removed), shuffled
  E1.choice = (R, prompt, correct, distractors, explain, extra = {}) => {
    const seen = new Set([String(correct)]); const ds = [];
    for (const d of distractors) { const k = String(d); if (!seen.has(k)) { seen.add(k); ds.push(d); } }
    const all = R.shuffle([correct, ...ds]);
    return Object.assign({ prompt, kind: 'choice', choices: all.map(String), ans: all.findIndex(x => String(x) === String(correct)), explain }, extra);
  };
  // fixed-order choice (e.g. 'odd','even' or '<','=','>') — keeps the given order
  E1.choiceFixed = (prompt, options, correctIndex, explain, extra = {}) =>
    Object.assign({ prompt, kind: 'choice', choices: options.map(String), ans: correctIndex, explain }, extra);
  E1.tf = (prompt, isTrue, explain, extra = {}) => E1.choiceFixed(prompt, ['True', 'False'], isTrue ? 0 : 1, explain, extra);

  /* ---------- number words ---------- */
  const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  E1.words = function words(n) {
    if (n < 20) return ONES[n];
    if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? '-' + ONES[n % 10] : '');
    if (n < 1000) return ONES[Math.floor(n / 100)] + ' hundred' + (n % 100 ? ' ' + words(n % 100) : '');
    if (n === 1000) return 'one thousand';
    throw new Error('words: out of range ' + n);
  };
  E1.ordinal = n => ['zeroth', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth'][n];
  E1.plural = (n, one, many) => n + ' ' + (n === 1 ? one : (many || one + 's'));

  /* ---------- palette ---------- */
  const C = E1.C = {
    ink: '#15171C', muted: '#646A75', line: '#C9CDD4', faint: '#EEF0F3', paper: '#FFFFFF',
    red: '#E0735A', amber: '#E2A13B', olive: '#9BAE45', teal: '#3E9D8F', blue: '#4A8FD1', violet: '#8A6CC9', pink: '#C9628E',
  };
  C.set = [C.red, C.blue, C.amber, C.teal, C.violet, C.olive, C.pink];
  E1.colorName = { [C.red]: 'red', [C.blue]: 'blue', [C.amber]: 'yellow', [C.teal]: 'green', [C.violet]: 'purple', [C.olive]: 'olive', [C.pink]: 'pink' };

  /* ---------- SVG visuals ---------- */
  const V = E1.V = {};
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
      const R = o.R || E1.rng(n * 7919 + 1), W = o.w || 300, H = o.h || 160;
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

  /* ---------- validation (used by tests and the page in dev) ---------- */
  E1.validate = function (q, where) {
    const bad = m => { throw new Error(where + ': ' + m); };
    if (!q || typeof q !== 'object') bad('no question object');
    if (typeof q.prompt !== 'string' || !q.prompt.trim()) bad('empty prompt');
    if (/undefined|NaN|\[object/.test(q.prompt)) bad('prompt has undefined/NaN: ' + q.prompt);
    if (typeof q.explain !== 'string' || !q.explain.trim()) bad('missing explain');
    if (/undefined|NaN|\[object/.test(q.explain)) bad('explain has undefined/NaN: ' + q.explain);
    if (q.visual !== undefined) { if (typeof q.visual !== 'string' || !q.visual.startsWith('<svg')) bad('visual not svg'); if (/NaN|undefined/.test(q.visual)) bad('visual has NaN/undefined'); }
    if (q.kind === 'num') {
      if (!Array.isArray(q.fields) || !q.fields.length || q.fields.length > 4) bad('fields 1-4');
      q.fields.forEach(f => { if (!Number.isInteger(f.ans)) bad('non-integer answer ' + f.ans); if (f.ans < 0 || f.ans > 100000) bad('answer out of range ' + f.ans); });
    } else if (q.kind === 'choice') {
      if (!Array.isArray(q.choices) || q.choices.length < 2 || q.choices.length > 6) bad('choices 2-6, got ' + (q.choices && q.choices.length));
      if (new Set(q.choices).size !== q.choices.length) bad('duplicate choices ' + q.choices.join(' / '));
      if (!Number.isInteger(q.ans) || q.ans < 0 || q.ans >= q.choices.length) bad('bad choice index');
      q.choices.forEach(c => { if (/undefined|NaN|\[object/.test(c)) bad('choice has undefined/NaN'); });
    } else bad('unknown kind ' + q.kind);
    return true;
  };
})(typeof window !== 'undefined' ? window : globalThis);

/* Era I · Unit I.1 Counting (I.1.01–I.1.16) */
(function () {
  const { num, choice, choiceFixed, tf, words, V, C } = E1;

  /* ---------- visual helpers (prefix V.cnt_) ---------- */
  // one flat shape centered at x,y; s ≈ radius
  V.cnt_shape = V.cnt_shape || function (kind, x, y, s, fill) {
    if (kind === 'square') return `<rect x="${x - s * 0.85}" y="${y - s * 0.85}" width="${s * 1.7}" height="${s * 1.7}" rx="3" fill="${fill}"/>`;
    if (kind === 'triangle') return `<polygon points="${x},${y - s} ${x + s},${y + s * 0.8} ${x - s},${y + s * 0.8}" fill="${fill}"/>`;
    if (kind === 'star') {
      const p = [];
      for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? s * 0.45 : s * 1.05; p.push((x + rr * Math.cos(a)).toFixed(1) + ',' + (y + rr * Math.sin(a)).toFixed(1)); }
      return `<polygon points="${p.join(' ')}" fill="${fill}"/>`;
    }
    return V.dot(x, y, s, fill);
  };
  // n shapes in rows of `per`; o.labels puts small text under each; o.gap5 adds a gap after every 5
  V.cnt_objs = function (n, o = {}) {
    const s = o.s || 12, g = s * 2 + 8, per = o.per || 10, lab = o.labels, lh = lab ? 22 : 0, ex = o.gap5 ? 12 : 0;
    const cols = Math.min(n, per), rows = Math.max(1, Math.ceil(n / per));
    const X = i => g / 2 + (i % per) * g + Math.floor((i % per) / 5) * ex, Y = i => g / 2 + Math.floor(i / per) * (g + lh);
    let body = '';
    for (let i = 0; i < n; i++) {
      const f = Array.isArray(o.color) ? o.color[i] : (o.color || C.red);
      body += V.cnt_shape(o.shape || 'circle', X(i), Y(i), s, f);
      if (lab && lab[i] !== undefined && lab[i] !== '') body += V.text(X(i), Y(i) + s + 12, lab[i], { size: 14, fill: C.muted, weight: 600 });
    }
    const W = Math.max(1, cols * g + (cols > 5 ? ex : 0)), H = rows * (g + lh);
    return V.svg(W, H, body, 'objects to count');
  };
  // n shapes scattered (seeded by R)
  V.cnt_scatter = function (n, R, o = {}) {
    const s = o.s || 12, W = o.w || 300, H = o.h || 170, pts = [];
    let tries = 0;
    while (pts.length < n && tries < 8000) { tries++; const p = [s + 4 + R.f() * (W - 2 * s - 8), s + 4 + R.f() * (H - 2 * s - 8)]; if (pts.every(q => Math.hypot(q[0] - p[0], q[1] - p[1]) > 2 * s + 7)) pts.push(p); }
    if (pts.length < n) throw new Error('cnt_scatter could not place ' + n);
    return V.svg(W, H, pts.map((p, i) => V.cnt_shape(o.shape || 'circle', +p[0].toFixed(1), +p[1].toFixed(1), s, Array.isArray(o.color) ? o.color[i] : (o.color || C.red))).join(''), 'objects to count');
  };
  // a row of boxes; item null → blank '?', item {tag:'A'} → blank with a letter
  V.cnt_seq = function (items) {
    const txt = it => it === null ? '?' : (typeof it === 'object' ? it.tag : String(it));
    const long = Math.max(...items.map(it => txt(it).length));
    const size = long > 6 ? 15 : 20, bw = Math.max(48, long * (size * 0.6) + 18), gap = 8, h = 46;
    let body = '';
    items.forEach((it, i) => {
      const x = 2 + i * (bw + gap), blank = it === null || typeof it === 'object';
      body += `<rect x="${x}" y="2" width="${bw}" height="${h}" rx="8" fill="${blank ? C.faint : C.paper}" stroke="${blank ? C.amber : C.ink}" stroke-width="${blank ? 3 : 2}"/>`;
      body += V.text(x + bw / 2, 2 + h / 2, txt(it), { size, weight: blank ? 700 : 600, fill: blank ? C.muted : C.ink });
    });
    return V.svg(items.length * (bw + gap) - gap + 4, h + 4, body, 'number sequence');
  };
  // a big numeral card
  V.cnt_card = t => V.svg(110, 84, `<rect x="3" y="3" width="104" height="78" rx="12" fill="${C.paper}" stroke="${C.ink}" stroke-width="2.5"/>` + V.text(55, 43, t, { size: 40, weight: 700 }), 'number card');
  // a cup with a number on it (the objects are hidden inside)
  V.cnt_cup = (n, color = C.blue) => V.svg(100, 100, `<path d="M8 12 H92 L80 94 H20 Z" fill="${color}"/>` + V.text(50, 52, n, { size: 30, weight: 700, fill: C.paper }), 'cup');
  // k bars of ten cubes, plus loose ones
  V.cnt_tens = V.cnt_tens || function (k, ones = 0, color = C.blue) {
    const c = 14, gap = 8; let body = '', x = 4;
    for (let i = 0; i < k; i++) {
      for (let j = 0; j < 10; j++) body += `<rect x="${x}" y="${4 + j * c}" width="${c}" height="${c}" fill="${color}" stroke="${C.paper}" stroke-width="1.5"/>`;
      body += `<rect x="${x}" y="4" width="${c}" height="${c * 10}" fill="none" stroke="${C.ink}" stroke-width="1.5"/>`;
      x += c + gap;
    }
    if (ones) { x += 6; for (let j = 0; j < ones; j++) { const cx = x + Math.floor(j / 5) * (c + 6), cy = 4 + c * 10 - (j % 5 + 1) * (c + 4) + 4; body += `<rect x="${cx}" y="${cy}" width="${c}" height="${c}" fill="${color}" stroke="${C.ink}" stroke-width="1.5"/>`; } x += Math.ceil(ones / 5) * (c + 6); }
    return V.svg(Math.max(20, x), c * 10 + 8, body, 'tens and ones');
  };
  // k open hands (5 fingers each), rows of 4
  V.cnt_hands = function (k, color = C.amber) {
    const w = 94, h = 112, per = 4; let body = '';
    for (let i = 0; i < k; i++) {
      const x0 = (i % per) * w + 6, y0 = Math.floor(i / per) * h;
      body += `<rect x="${x0 + 4}" y="${y0 + 60}" width="66" height="44" rx="16" fill="${color}"/>`;
      [30, 40, 44, 40].forEach((len, f) => body += `<rect x="${x0 + 6 + f * 16}" y="${y0 + 64 - len}" width="13" height="${len + 8}" rx="6.5" fill="${color}"/>`);
      body += `<rect x="${x0 + 66}" y="${y0 + 58}" width="13" height="30" rx="6.5" fill="${color}" transform="rotate(35 ${x0 + 72} ${y0 + 80})"/>`;
    }
    return V.svg(Math.min(k, per) * w + 8, Math.ceil(k / per) * h, body, 'hands');
  };
  // k coins with a value printed on them, rows of 5
  V.cnt_coins = function (k, label) {
    const d = 52; let body = '';
    for (let i = 0; i < k; i++) { const x = (i % 5) * d + d / 2, y = Math.floor(i / 5) * d + d / 2; body += `<circle cx="${x}" cy="${y}" r="22" fill="#D5D8DE" stroke="${C.muted}" stroke-width="2"/>` + V.text(x, y, label, { size: 15, weight: 700 }); }
    return V.svg(Math.min(k, 5) * d, Math.ceil(k / 5) * d, body, 'coins');
  };
  // k pairs of shapes, each pair in a rounded box, rows of 5
  V.cnt_pairs = function (k, shape, color) {
    const w = 72, h = 50; let body = '';
    for (let i = 0; i < k; i++) {
      const x = (i % 5) * w + 4, y = Math.floor(i / 5) * h + 4;
      body += `<rect x="${x}" y="${y}" width="${w - 8}" height="${h - 8}" rx="14" fill="none" stroke="${C.line}" stroke-width="2"/>` + V.cnt_shape(shape, x + 18, y + 21, 11, color) + V.cnt_shape(shape, x + w - 26, y + 21, 11, color);
    }
    return V.svg(Math.min(k, 5) * w, Math.ceil(k / 5) * h + 2, body, 'pairs');
  };
  // one digit: normal, mirrored or upside down
  V.cnt_digit = function (d, mode) {
    const t = mode === 'mirror' ? ' transform="translate(90,0) scale(-1,1)"' : mode === 'flip' ? ' transform="rotate(180 45 50)"' : '';
    return V.svg(90, 100, `<rect x="2" y="2" width="86" height="96" rx="10" fill="${C.paper}" stroke="${C.line}" stroke-width="2"/><g${t}>${V.text(45, 52, d, { size: 64, weight: 600 })}</g>`, 'digit');
  };
  // a plate with n shapes on it
  V.cnt_plate = function (n, shape, color) {
    let body = `<ellipse cx="70" cy="46" rx="64" ry="38" fill="${C.faint}" stroke="${C.line}" stroke-width="2"/><ellipse cx="70" cy="46" rx="46" ry="25" fill="none" stroke="${C.line}" stroke-width="1.5"/>`;
    const xs = [[], [70], [57, 83], [46, 70, 94], [36, 59, 82, 105]][n];
    xs.forEach(x => body += V.cnt_shape(shape, x, 46, 9, color));
    return V.svg(140, 92, body, 'plate');
  };
  // dice-style pattern of n (1–6) colored dots, no border
  V.cnt_pip = function (n, color) {
    const P = { 1: [[1, 1]], 2: [[0, 0], [2, 2]], 3: [[0, 0], [1, 1], [2, 2]], 4: [[0, 0], [2, 0], [0, 2], [2, 2]], 5: [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]], 6: [[0, 0], [2, 0], [0, 1], [2, 1], [0, 2], [2, 2]] }[n];
    return V.svg(100, 100, `<rect x="3" y="3" width="94" height="94" rx="14" fill="none" stroke="${C.line}" stroke-width="2"/>` + P.map(([i, j]) => V.dot(22 + i * 28, 22 + j * 28, 10, color)).join(''), 'dot pattern');
  };

  /* ---------- small helpers ---------- */
  const SHAPES = ['circle', 'square', 'triangle', 'star'];
  const NAME = { circle: 'dots', square: 'squares', triangle: 'triangles', star: 'stars' };
  const look = R => ({ shape: R.pick(SHAPES), color: R.pick(C.set) });
  const upTo = n => n <= 6 ? Array.from({ length: n }, (_, i) => i + 1).join(', ') : `1, 2, 3 … ${n}`;
  const cap = s => s[0].toUpperCase() + s.slice(1);
  const rev = n => +String(n).split('').reverse().join('');
  // a sequence question: vals shown, blank at given indexes; one blank → one answer, several → labelled A, B, C
  const seqQ = (prompt, vals, blanks, explain) => {
    const tags = 'ABC';
    const items = vals.map((v, i) => { const b = blanks.indexOf(i); return b < 0 ? v : (blanks.length === 1 ? null : { tag: tags[b] }); });
    const ans = blanks.length === 1 ? vals[blanks[0]] : blanks.map((i, b) => ({ label: tags[b], ans: vals[i] }));
    return num(prompt, ans, explain, { visual: V.cnt_seq(items) });
  };
  // run of `len` numbers from `start` with step; one random blank (not always the last)
  const run = (start, step, len) => Array.from({ length: len }, (_, i) => start + i * step);
  const oneBlank = (R, prompt, vals, how) => { const b = R.int(0, vals.length - 1); return seqQ(prompt, vals, [b], `${how}: ${vals.join(', ')}. The missing number is ${vals[b]}.`); };
  const cnt = (n, noun) => `Touch each one and count: ${upTo(n)}. There ${n === 1 ? 'is' : 'are'} ${n}.`;

  /* ================= I.1.01 ================= */
  const countRow = (lo, hi) => R => { const n = R.int(lo, hi), L = look(R); return num(`How many ${NAME[L.shape]}?`, n, cnt(n), { visual: V.cnt_objs(n, { shape: L.shape, color: L.color }) }); };
  E1.skill({ id: 'I.1.01', name: 'Count objects one by one', steps: {
    a: { t: 'touch and count to 3', g: countRow(1, 3) },
    b: { t: 'to 5', g: countRow(2, 5) },
    c: { t: 'to 10', g: countRow(6, 10) },
    d: { t: 'scattered objects to 10', g: R => { const n = R.int(5, 10), L = look(R); return num(`How many ${NAME[L.shape]}?`, n, `Count each one once, and keep track of which you have counted. There are ${n}.`, { visual: V.cnt_scatter(n, R, { shape: L.shape, color: L.color }) }); } },
  } });

  /* ================= I.1.02 ================= */
  const wordSeq = (R, lo, hi, len) => {
    const s = R.int(lo, hi - len + 1), vals = run(s, 1, len), b = R.int(0, len - 1), n = vals[b];
    const items = vals.map((v, i) => i === b ? null : words(v));
    return choice(R, 'Which word goes in the gap?', words(n), [words(n + 1), words(Math.max(0, n - 1)), words(n + 2)].slice(0, 3), `Say them in order: ${vals.map(words).join(', ')}. The gap is ${words(n)}.`, { visual: V.cnt_seq(items) });
  };
  E1.skill({ id: 'I.1.02', name: 'Number words in order', steps: {
    a: { t: 'to 3', g: R => {
      if (R.bool()) { const n = R.int(1, 3), c = R.pick(C.set); return choice(R, 'Count the dots. Which word?', words(n), ['one', 'two', 'three', 'four'], `Count: ${Array.from({ length: n }, (_, i) => words(i + 1)).join(', ')}. That is ${words(n)}.`, { visual: V.dots(n, { color: c }) }); }
      const b = R.int(0, 2), items = ['one', 'two', 'three'].map((w, i) => i === b ? null : w);
      return choice(R, 'Which word goes in the gap?', words(b + 1), ['one', 'two', 'three', 'four'], `We say one, two, three. The gap is ${words(b + 1)}.`, { visual: V.cnt_seq(items) });
    } },
    b: { t: 'to 5', g: R => R.bool(0.35) ? (() => { const n = R.int(1, 4); return choice(R, `Which word comes after <b>${words(n)}</b>?`, words(n + 1), [n > 1 ? words(n - 1) : 'three', words(n + 2), n > 1 ? words(n + 3) : 'five'], `Count: ${words(n)}, ${words(n + 1)}. ${cap(words(n + 1))} comes next.`); })() : wordSeq(R, 1, 5, R.pick([3, 4])) },
    c: { t: 'to 10', g: R => R.bool(0.35) ? (() => { const n = R.int(4, 9); return choice(R, `Which word comes after <b>${words(n)}</b>?`, words(n + 1), [words(n - 1), words(n + 2), words(n)].slice(0, 2), `Count: ${words(n)}, ${words(n + 1)}. ${cap(words(n + 1))} comes next.`); })() : wordSeq(R, 3, 10, 4) },
    d: { t: 'starting from any number', g: R => {
      const k = R.pick([2, 3]), s = R.int(2, 10 - k), nx = run(s + 1, 1, k).map(words).join(', ');
      return choice(R, `Start at <b>${words(s)}</b>. What are the next ${k} words?`, nx,
        [s - k >= 0 ? run(s - 1, -1, k).map(words).join(', ') : run(s + 1, 1, k).reverse().map(words).join(', '), run(s + 2, 1, k).map(words).join(', '), [s + 1, s + 3, s + 4].slice(0, k).map(words).join(', ')],
        `Count on from ${words(s)}: ${words(s)}, ${nx}.`);
    } },
  } });

  /* ================= I.1.03 ================= */
  const afterBefore = (R, lo, hi) => {
    if (R.bool()) { const n = R.int(lo, hi - 1); return num(`What number comes after ${n}?`, n + 1, `Count: ${n}, ${n + 1}. ${n + 1} comes next.`); }
    const n = R.int(lo + 1, hi); return num(`What number comes just before ${n}?`, n - 1, `Count: ${n - 1}, ${n}. ${n - 1} comes just before.`);
  };
  const teenQ = R => {
    const n = R.int(11, 19), w = words(n), f = R.int(0, 2);
    if (f === 0) return choice(R, `Which number is <b>${w}</b>?`, n, [rev(n) === n ? n + 10 : rev(n), (n % 10) * 10 || 20, n % 10 || 10], `${cap(w)} is 1 ten and ${n % 10} ${n % 10 === 1 ? 'one' : 'ones'}: ${n}.`);
    if (f === 1) return choice(R, 'Which word is this number?', w, [n > 12 ? words((n % 10) * 10) : words(n + 10), words(n % 10), words(n + 1)], `${n} is 1 ten and ${n % 10} ${n % 10 === 1 ? 'one' : 'ones'}. We say ${w}.`, { visual: V.cnt_card(n) });
    return num(`${n} is 10 and how many more?`, n - 10, `${n} = 10 + ${n - 10}. The 1 means one ten; the ${n - 10} means ${n - 10} one${n === 11 ? '' : 's'}.`);
  };
  E1.skill({ id: 'I.1.03', name: 'Count to 20', steps: {
    a: { t: '10 to 15', g: R => R.bool(0.6) ? oneBlank(R, 'What number is missing?', run(R.int(10, 12), 1, 4), 'Count on') : afterBefore(R, 10, 15) },
    b: { t: '15 to 20', g: R => R.bool(0.6) ? oneBlank(R, 'What number is missing?', run(R.int(15, 17), 1, 4), 'Count on') : afterBefore(R, 15, 20) },
    c: { t: 'the teen pattern', g: teenQ },
    d: { t: 'count 20 objects', g: R => { const n = R.int(13, 20), L = look(R); return num(`How many ${NAME[L.shape]}?`, n, `A full row is 10. Count on from 10: ${run(11, 1, n - 10).join(', ')}. There are ${n}.`, { visual: V.cnt_objs(n, { shape: L.shape, color: L.color, gap5: true, s: 11 }) }); } },
  } });

  /* ================= I.1.04 ================= */
  E1.skill({ id: 'I.1.04', name: 'Count to 50', steps: {
    a: { t: 'decade names', g: R => {
      const t = R.int(1, 5), n = t * 10, w = words(n);
      if (R.bool()) return choice(R, `Which number is <b>${w}</b>?`, n, [t === 1 ? 11 : 10 + t, t, n + 10], `${cap(w)} means ${t} ten${t > 1 ? 's' : ''}: ${n}.`);
      return choice(R, 'Which word is this number?', w, [words(t === 1 ? 11 : 10 + t), words(t), words(n + 10)], `${n} is ${t} ten${t > 1 ? 's' : ''}. We say ${w}.`, { visual: V.cnt_card(n) });
    } },
    b: { t: 'count within a decade', g: R => { const t = R.int(1, 4) * 10, s = t + R.int(1, 5); return oneBlank(R, 'What number is missing?', run(s, 1, 4), 'Count on'); } },
    c: { t: 'cross a decade (29 → 30)', g: R => {
      const t = R.int(1, 4) * 10;
      if (R.bool(0.4)) { const n = t + 9; return choice(R, `What comes after ${n}?`, n + 1, [n - 9, t + 10 + 9, Number(`${t / 10}10`)], `After ${t / 10} ten${t > 10 ? 's' : ''} and 9 ones comes a new ten: ${n + 1}.`); }
      const s = t + 10 - R.int(2, 3), vals = run(s, 1, 4), b = vals.indexOf(t + 10);
      return seqQ('What number is missing?', vals, [b], `After ${t + 9} comes a new ten: ${vals.join(', ')}.`);
    } },
    d: { t: '1 to 50', g: R => { const s = R.int(1, 46), vals = run(s, 1, 5), bl = R.sample([0, 1, 2, 3, 4], 2).sort((a, b) => a - b); return seqQ('Fill in A and B.', vals, bl, `Count on: ${vals.join(', ')}.`); } },
  } });

  /* ================= I.1.05 ================= */
  E1.skill({ id: 'I.1.05', name: 'Count to 120', steps: {
    a: { t: '50 to 100', g: R => oneBlank(R, 'What number is missing?', run(R.int(50, 97), 1, 4), 'Count on') },
    b: { t: 'cross 100', g: R => {
      if (R.bool(0.35)) return choice(R, 'What comes after 99?', 100, [910, 1000, 90], 'After 9 tens and 9 ones we have 10 tens: 100.');
      const s = R.int(97, 100), vals = run(s, 1, 4), b = R.bool(0.6) ? vals.indexOf(100) : R.int(0, 3);
      return seqQ('What number is missing?', vals, [b], `Count on past 100: ${vals.join(', ')}.`);
    } },
    c: { t: '100 to 120', g: R => {
      if (R.bool(0.4)) { const n = R.int(101, 119), w = words(n), o = n - 100; return choice(R, `Which number is <b>${w}</b>?`, n, [Number('100' + o), o < 10 ? o * 10 + 100 : n + 10, o], `${cap(w)} is 100 and ${o} more: ${n}.`); }
      return oneBlank(R, 'What number is missing?', run(R.int(100, 117), 1, 4), 'Count on');
    } },
    d: { t: 'count on from any number', g: R => { const s = R.bool() ? R.int(2, 11) * 10 - R.int(1, 2) : R.int(20, 116); const vals = run(s, 1, 4); return seqQ('Keep counting. Fill in A and B.', vals, [2, 3], `Count on from ${s}: ${vals.join(', ')}.`); } },
  } });

  /* ================= I.1.06 (read + write numerals) ================= */
  const pickFrame = (R, n, size, lo, hi) => {
    const ds = [n - 1, n + 1, n + 2, n - 2].filter(d => d >= lo && d <= hi).slice(0, 2), c = R.pick(C.set);
    const opts = R.shuffle([n, ...ds]);
    return choiceFixed('Which one shows this number?', opts.map(k => V.frame(k, { size, color: c, frames: 1 })), opts.indexOf(n), `${n} means ${n} counter${n === 1 ? '' : 's'}${n === 0 ? ': an empty frame' : ''}. Count the counters in each frame.`, { visual: V.cnt_card(n) });
  };
  const wordFor = (R, n, lo, hi) => choice(R, 'Which word is this number?', words(n), [n + 1, n - 1, n + 2].filter(d => d >= lo && d <= hi).map(words), `This number is ${words(n)}.`, { visual: V.cnt_card(n) });
  const read06d = R => {
    const n = R.int(3, 20), c = R.pick(C.set);
    const vis = n > 10 || R.bool() ? V.frame(n, { color: c }) : V.cnt_objs(n, { shape: R.pick(SHAPES), color: c, gap5: true });
    return choice(R, 'Which number matches?', n, [n + 1, n - 1, n > 10 && rev(n) !== n ? rev(n) : n + 2], `${n > 10 ? 'One full ten-frame is 10. Count on the rest' : 'Count them'}: there are ${n}.`, { visual: vis });
  };
  const write07d = R => {
    const n = R.int(10, 20), c = R.pick(C.set);
    const vis = R.bool() ? V.frame(n, { color: c }) : V.cnt_objs(n, { shape: R.pick(SHAPES), color: c, gap5: true, s: 11 });
    return num('How many? Write the number.', n, `Count 10, then count on: there are ${n}. We write ${n}.`, { visual: vis });
  };
  E1.skill({ id: 'I.1.06', name: 'Read and write numerals to 20', steps: {
    a: { t: 'read 0–10', g: R => { const n = R.int(0, 10); return n <= 5 ? (R.bool(0.6) ? pickFrame(R, n, 5, 0, 5) : wordFor(R, n, 0, 6)) : (R.bool(0.6) ? pickFrame(R, n, 10, 4, 10) : wordFor(R, n, 5, 11)); } },
    b: { t: 'read 11–20', g: R => {
      const n = R.int(11, 20);
      if (R.bool()) return choice(R, 'Which word is this number?', words(n), [n === 20 ? 'twelve' : n > 12 ? words((n % 10) * 10) : words(n + 1), words(n === 20 ? 19 : n + 1), words(n % 10 || 2)], `${n} is ${n === 20 ? '2 tens' : '1 ten and ' + (n % 10) + (n % 10 === 1 ? ' one' : ' ones')}. We say ${words(n)}.`, { visual: V.cnt_card(n) });
      return choice(R, `Find <b>${words(n)}</b>.`, n, [rev(n) === n || rev(n) < 10 ? n + 1 : rev(n), n % 10 ? (n % 10) * 10 : 12, n - 1], `${cap(words(n))} is written ${n}: ${n === 20 ? '2 tens and 0 ones' : '1 ten, then ' + (n % 10) + (n % 10 === 1 ? ' one' : ' ones')}.`);
    } },
    c: { t: 'pick the numeral written the right way', g: R => {
      const d = R.pick([1, 2, 3, 4, 5, 6, 7, 9]), modes = ['norm', 'mirror'].concat(d === 3 || d === 6 || d === 9 ? [] : ['flip']);
      const opts = R.shuffle(modes);
      return choiceFixed(`Which <b>${d}</b> is written the right way?`, opts.map(m => V.cnt_digit(d, m)), opts.indexOf('norm'), `Check which way the ${d} faces. The others are flipped or upside down.`);
    } },
    d: { t: 'match numeral to amount', g: R => R.bool() ? read06d(R) : write07d(R) },
  } });

  /* ================= I.1.07 ================= */
  E1.skill({ id: 'I.1.07', name: 'How many in all', steps: {
    a: { t: 'the last number counted tells how many', g: R => {
      const n = R.int(3, 8), L = look(R);
      return num(`We counted them. How many ${NAME[L.shape]} in all?`, n, `The last number we said was ${n}, so there are ${n} in all.`, { visual: V.cnt_objs(n, { shape: L.shape, color: L.color, labels: run(1, 1, n) }) });
    } },
    b: { t: 'answer without recounting', g: R => {
      const n = R.int(5, 12), L = look(R);
      return choice(R, `Mia counted these: ${upTo(n)}. How many?`, n, [n + 1, n - 1, 1], `Mia's last number was ${n}. That tells how many: ${n}. No need to count again.`, { visual: V.cnt_scatter(n, R, { shape: L.shape, color: L.color, s: 11 }) });
    } },
    c: { t: 'count out a given number', g: R => {
      const n = R.int(4, 10), L = look(R), opts = R.shuffle([n, n - 1, n + 1]);
      return choiceFixed(`Which box has exactly ${n}?`, opts.map(k => V.cnt_objs(k, { shape: L.shape, color: L.color, per: 5, s: 10 })), opts.indexOf(n), `Count each box. Stop when you get to ${n}: that box has exactly ${n}.`);
    } },
    d: { t: 'same total in any order', g: R => {
      const n = R.int(4, 10), L = look(R), vis = V.cnt_objs(n, { shape: L.shape, color: R.sample(C.set, 7).concat(R.sample(C.set, 3)).slice(0, n) });
      if (R.bool()) return num(`Counted from the left, there are ${n}. How many from the right?`, n, `Counting in a different order does not change how many. Still ${n}.`, { visual: vis });
      const said = R.pick([n, n, n + 1, n - 1]);
      return choiceFixed(`From the left: ${n}. Leo counts from the right: ${said}. Is he right?`, ['Yes', 'No'], said === n ? 0 : 1, said === n ? `Yes. From the left or the right, there are ${n}.` : `No. From either end there are ${n}, not ${said}.`, { visual: vis });
    } },
  } });

  /* ================= I.1.08 ================= */
  E1.skill({ id: 'I.1.08', name: 'Zero', steps: {
    a: { t: 'zero means none', g: R => {
      const L = look(R), others = R.sample([1, 2, 3, 4], R.pick([2, 3])), opts = R.shuffle([0, ...others]);
      return choiceFixed(R.pick(['Which plate has zero?', 'Which plate has none?', 'Which plate has 0?']), opts.map(k => V.cnt_plate(k, L.shape, L.color)), opts.indexOf(0), 'Zero means none. The empty plate has 0.');
    } },
    b: { t: 'show zero', g: R => {
      const c = R.pick(C.set), kind = R.int(0, 2), ds = R.sample([1, 2, 3], 2), opts = R.shuffle([0, ...ds]);
      const pic = k => kind === 0 ? V.frame(k, { size: 5, color: c }) : kind === 1 ? V.dots(k, { layout: 'fingers', color: c }) : V.frame(k, { color: c });
      return choiceFixed('Which one shows 0?', opts.map(pic), opts.indexOf(0), kind === 1 ? 'No fingers up shows 0.' : 'Zero means nothing there. The empty one shows 0.');
    } },
    c: { t: 'write 0', g: R => {
      const f = R.int(0, 2);
      if (f === 0) { const c = R.pick(C.set), size = R.pick([5, 10]); return num('How many counters? Write the number.', 0, 'There are no counters. We write 0.', { visual: V.frame(0, { size, color: c }) }); }
      if (f === 1) { const [a, b] = R.sample(C.set.filter(x => x !== C.olive), 2), n = R.int(2, 6), L = R.pick(SHAPES); return num(`How many ${E1.colorName[b]} ${NAME[L]}?`, 0, `All the ${NAME[L]} are ${E1.colorName[a]}. There are no ${E1.colorName[b]} ones, so we write 0.`, { visual: V.cnt_objs(n, { shape: L, color: a }) }); }
      const n = R.int(2, 6), food = R.pick(['grapes', 'cookies', 'cherries', 'nuts']); return num(`${n} ${food} on a plate. All are eaten. How many now?`, 0, `${n} take away all ${n} leaves none. We write 0.`, { visual: V.cnt_plate(0, 'circle', C.red) });
    } },
    d: { t: 'zero when counting back', g: R => {
      if (R.bool(0.3)) return choice(R, 'Counting back, what comes after 1?', 0, [2, 10, 11], 'Count back: 3, 2, 1, 0. After 1 comes 0.');
      const s = R.int(3, 6), vals = run(s, -1, s + 1), len = vals.length, b = R.bool(0.6) ? len - 1 : R.int(1, len - 2);
      return seqQ('Count back. What number is missing?', vals, [b], `Count back: ${vals.join(', ')}.`);
    } },
  } });

  /* ================= I.1.09 (flash) ================= */
  const F = 1500;
  E1.skill({ id: 'I.1.09', name: 'See amounts to 5 at a glance', steps: {
    a: { t: '1–3', g: R => { const n = R.int(1, 3), c = R.pick(C.set); return num('Quick look! How many dots?', n, `You can see ${n} at once without counting.`, { visual: V.dots(n, { layout: 'scatter', R, color: c, w: 200, h: 120 }), flash: F }); } },
    b: { t: '4–5', g: R => { const n = R.int(4, 5), c = R.pick(C.set); return num('Quick look! How many dots?', n, n === 4 ? 'Two and two make 4.' : 'Two and three make 5.', { visual: V.dots(n, { layout: 'scatter', R, color: c, w: 200, h: 120 }), flash: F }); } },
    c: { t: 'dice patterns', g: R => { const n = R.int(1, 5); return choice(R, 'Quick look! How many dots on the dice?', n, [n + 1, n - 1 || 3, n + 2], `This dice pattern is ${n}. ${n === 5 ? 'Four corners and one in the middle.' : n === 4 ? 'One in each corner.' : ''}`.trim(), { visual: V.dots(n, { layout: 'dice' }), flash: F }); } },
    d: { t: 'fingers', g: R => { const n = R.int(1, 5), c = R.pick(C.set); return num('Quick look! How many fingers are up?', n, n === 5 ? 'A whole hand is 5.' : `${n} finger${n === 1 ? '' : 's'} up${n >= 3 ? `, ${5 - n} down` : ''}: that is ${n}.`, { visual: V.dots(n, { layout: 'fingers', color: c }), flash: F }); } },
  } });

  /* ================= I.1.10 (flash) ================= */
  E1.skill({ id: 'I.1.10', name: 'See amounts to 10 at a glance', steps: {
    a: { t: 'five-frame', g: R => { const n = R.int(2, 10), c = R.pick(C.set); return num('Quick look! How many counters?', n, n > 5 ? `One full five-frame is 5, and ${n - 5} more: ${n}.` : n === 5 ? 'The frame is full: 5.' : `The frame has ${5 - n} empty, so ${n}.`, { visual: V.frame(n, { size: 5, color: c }), flash: F }); } },
    b: { t: 'ten-frame', g: R => { const n = R.int(3, 10), c = R.pick(C.set); return num('Quick look! How many counters?', n, n >= 5 ? `The top row is 5${n > 5 ? `, and ${n - 5} more` : ''}: ${n}.` : `${n} in the top row.`, { visual: V.frame(n, { color: c }), flash: F }); } },
    c: { t: 'two groups (5 and 3)', g: R => { const k = R.int(1, 5), [a, b] = R.sample(C.set, 2); return num('Quick look! How many dots in all?', 5 + k, `5 and ${k} make ${5 + k}.`, { visual: V.side([V.cnt_pip(5, a), V.cnt_pip(k, b)]), flash: F }); } },
    d: { t: 'any arrangement', g: R => {
      const kind = R.int(0, 3), [a, b] = R.sample(C.set, 2);
      if (kind === 0) { const n = R.int(6, 10); return num('Quick look! How many dots?', n, `A row of 5 and ${n - 5} more: ${n}.`, { visual: V.dots(n, { layout: 'grid', color: a }), flash: F }); }
      if (kind === 1) { const x = R.int(2, 5), y = R.int(Math.max(1, 6 - x), 5); return num('Quick look! How many dots in all?', x + y, `${x} and ${y} make ${x + y}.`, { visual: V.side([V.cnt_pip(x, a), V.cnt_pip(y, b)]), flash: F }); }
      if (kind === 2) { const n = R.int(6, 10); return num('Quick look! How many fingers are up?', n, `One whole hand is 5, and ${n - 5} more: ${n}.`, { visual: V.dots(n, { layout: 'fingers', color: a }), flash: F }); }
      const x = R.int(2, 6), y = R.int(Math.max(1, 5 - x), 10 - x); return num('Quick look! How many counters in all?', x + y, `${x} and ${y} make ${x + y}.`, { visual: V.frame(x, { n2: y, color: a, color2: b }), flash: F });
    } },
  } });

  /* ================= I.1.11 ================= */
  const cupPlus = (R, n, k, lead) => { const [a, b] = R.sample(C.set, 2); return num(`${n} in the cup and ${k} more. How many in all?`, n + k, `Start at ${n} and count on ${k}: ${run(n + 1, 1, k).join(', ')}. There are ${n + k}.`, { visual: V.side([V.cnt_cup(n, a), V.cnt_objs(k, { color: b, s: 13 })], { gap: 20 }) }); };
  E1.skill({ id: 'I.1.11', name: 'Count on', steps: {
    a: { t: 'on 1 (to 10)', g: R => cupPlus(R, R.int(3, 9), 1) },
    b: { t: 'on 2 (to 10)', g: R => cupPlus(R, R.int(3, 8), 2) },
    c: { t: 'from a number shown', g: R => { const n = R.int(5, 20), k = R.int(1, 4), c = R.pick(C.set); return num(`Start at ${n}. Count on the dots. What do you get?`, n + k, `${n}, then ${run(n + 1, 1, k).join(', ')}. You get ${n + k}.`, { visual: V.side([V.cnt_card(n), V.dots(k, { color: c })], { gap: 20 }) }); } },
    d: { t: 'from the bigger number', g: R => {
      const big = R.int(6, 15), sm = R.int(1, 4);
      if (R.bool(0.35)) { const opts = R.bool() ? [sm, big] : [big, sm]; return choiceFixed(`Put ${opts[0]} and ${opts[1]} together. Which is best to start from?`, opts, opts.indexOf(big), `Start at the bigger number, ${big}, and count on just ${sm}.`); }
      const [a, b] = R.sample(C.set, 2), parts = [V.cnt_objs(sm, { color: b, s: 13 }), V.cnt_cup(big, a)];
      return num('How many in all? Start from the bigger number.', big + sm, `Start at ${big} and count on ${sm}: ${run(big + 1, 1, sm).join(', ')}. That is ${big + sm}.`, { visual: V.side(R.bool() ? parts : parts.reverse(), { gap: 20 }) });
    } },
  } });

  /* ================= I.1.12 ================= */
  const backSeq = (R, s, len) => { const vals = run(s, -1, len), b = R.int(1, len - 1); return seqQ('Count back. What number is missing?', vals, [b], `Count back: ${vals.join(', ')}.`); };
  E1.skill({ id: 'I.1.12', name: 'Count back', steps: {
    a: { t: 'from 5', g: R => {
      if (R.bool(0.35)) { const k = R.int(1, 4); return num(`Start at 5. Take ${k} jump${k > 1 ? 's' : ''} back. Where do you land?`, 5 - k, `Count back from 5: ${run(4, -1, k).join(', ')}. You land on ${5 - k}.`, { visual: V.numline({ from: 0, to: 5, marks: [5] }) }); }
      if (R.bool(0.25)) { const n = R.int(1, 4); return num(`Count back from 5. What comes after ${n + 1}?`, n, `Count back: ${run(5, -1, 6 - n).join(', ')}. After ${n + 1} comes ${n}.`); }
      return backSeq(R, 5, R.int(4, 6));
    } },
    b: { t: 'from 10', g: R => backSeq(R, R.int(7, 10), R.int(4, 5)) },
    c: { t: 'from 20', g: R => backSeq(R, R.int(12, 20), R.int(4, 5)) },
    d: { t: 'count back across 10 (12 → 8)', g: R => {
      if (R.bool(0.4)) { const st = R.int(11, 14), k = R.int(st - 9, 5); return num(`Start at ${st}. Count back ${k}. Where do you land?`, st - k, `Count back ${k} from ${st}: ${run(st - 1, -1, k).join(', ')}. You land on ${st - k}.`, { visual: V.numline({ from: 5, to: 15, marks: [st] }) }); }
      const st = R.int(11, 14), len = st - 10 + R.int(2, 3), vals = run(st, -1, len), cand = [];
      vals.forEach((v, i) => { if (i > 0 && v >= 9 && v <= 11) cand.push(i); });
      const b = R.pick(cand); return seqQ('Count back. What number is missing?', vals, [b], `Count back past 10: ${vals.join(', ')}. The missing number is ${vals[b]}.`);
    } },
  } });

  /* ================= I.1.13 ================= */
  const moreLess = (R, n, more, vis) => num(`What is 1 ${more ? 'more' : 'less'} than ${n}?`, more ? n + 1 : n - 1, more ? `Count on 1: ${n}, ${n + 1}.` : `Count back 1: ${n}, ${n - 1}.`, vis ? { visual: vis } : {});
  E1.skill({ id: 'I.1.13', name: 'One more, one less', steps: {
    a: { t: 'one more to 10', g: R => { const n = R.int(1, 9); return moreLess(R, n, true, R.bool(0.7) ? V.frame(n, { color: R.pick(C.set) }) : null); } },
    b: { t: 'one less to 10', g: R => { const n = R.int(1, 10); return moreLess(R, n, false, R.bool(0.7) ? V.frame(n, { color: R.pick(C.set) }) : null); } },
    c: { t: 'to 20', g: R => { const n = R.int(10, 19), more = R.bool(); return moreLess(R, more ? n : n + 1, more, R.bool() ? V.numline({ from: 10, to: 20, marks: [more ? n : n + 1] }) : null); } },
    d: { t: 'to 100', g: R => { const more = R.bool(), n = R.bool(0.4) ? (more ? R.int(1, 9) * 10 + 9 : R.int(2, 9) * 10) : R.int(11, 98); return moreLess(R, n, more, null); } },
  } });

  /* ================= skip counting ================= */
  const skipQ = (R, step, lo, hi, len) => {
    const f = R.int(0, 4);
    if (f === 4) { const n = lo + R.int(1, (hi - lo) / step) * step; return num(`Count by ${step}s. What comes just before ${n}?`, n - step, `${n - step}, then ${n}. Each jump adds ${step}.`); }
    const top = hi - (len - 1) * step, s = lo + R.int(0, Math.max(0, (top - lo) / step)) * step;
    if (f <= 1) return oneBlank(R, `Count by ${step}s. What number is missing?`, run(s, step, len), `Count by ${step}s`);
    if (f === 2) { const n = lo + R.int(0, (hi - lo) / step - 1) * step; return num(`Count by ${step}s. What comes after ${n}?`, n + step, `${n}, then ${n + step}. Each jump adds ${step}.`); }
    const f0 = Math.max(0, lo - step), from = f0 + R.int(0, Math.max(0, (hi - 6 * step - f0) / step)) * step, to = Math.min(from + step * 6, hi), vals = run(from, step, (to - from) / step + 1), ask = R.pick(vals.slice(1));
    return num(`Count by ${step}s. What number goes at the dot?`, ask, `Count by ${step}s along the line: ${vals.slice(0, vals.indexOf(ask) + 1).join(', ')}.`, { visual: V.numline({ from, to, step, ask, hide: [ask], width: Math.min(600, vals.length * 50 + 40) }) });
  };
  E1.skill({ id: 'I.1.14', name: 'Skip count by 10s', steps: {
    a: { t: '10 to 50', g: R => skipQ(R, 10, 10, 50, 4) },
    b: { t: 'to 100', g: R => skipQ(R, 10, 10, 100, 5) },
    c: { t: 'from any number (7, 17, 27…)', g: R => { const s = R.int(0, 4) * 10 + R.int(1, 9), len = R.int(4, 5), vals = run(s, 10, len); return R.bool(0.6) ? oneBlank(R, 'Count by 10s. What number is missing?', vals, 'Count by 10s. The ones digit stays the same') : seqQ('Count by 10s from ' + s + '. Fill in A and B.', vals, [len - 2, len - 1], `Count by 10s: ${vals.join(', ')}. Only the tens digit changes.`); } },
    d: { t: 'count groups of ten', g: R => { const k = R.int(2, 9), c = R.pick(C.set); return num('Each bar has 10 cubes. How many cubes?', 10 * k, `Count by 10s: ${run(10, 10, k).join(', ')}. There are ${10 * k}.`, { visual: V.cnt_tens(k, 0, c) }); } },
  } });
  E1.skill({ id: 'I.1.15', name: 'Skip count by 5s', steps: {
    a: { t: '5 to 25', g: R => skipQ(R, 5, 5, 25, 4) },
    b: { t: 'to 50', g: R => skipQ(R, 5, 5, 50, 5) },
    c: { t: 'to 100', g: R => skipQ(R, 5, 30, 100, 5) },
    d: { t: 'count hands or 5-coins', g: (R, O) => {
      if (R.bool()) { const k = R.int(2, 6), c = R.pick([C.amber, C.pink, C.red, C.violet]); return num('How many fingers?', 5 * k, `Each hand has 5. Count by 5s: ${run(5, 5, k).join(', ')}.`, { visual: V.cnt_hands(k, c) }); }
      const k = R.int(2, 10), us = O.coins !== 'THB', unit = us ? 'cents' : 'baht';
      return num(`Each coin is 5 ${unit}. How many ${unit} in all?`, 5 * k, `Count by 5s: ${run(5, 5, k).join(', ')}. That is ${5 * k} ${unit}.`, { visual: V.cnt_coins(k, us ? '5¢' : '5฿') });
    } },
  } });
  E1.skill({ id: 'I.1.16', name: 'Skip count by 2s', steps: {
    a: { t: 'even numbers to 10', g: R => skipQ(R, 2, 2, 10, 4) },
    b: { t: 'to 20', g: R => skipQ(R, 2, 2, 20, 5) },
    c: { t: 'count pairs', g: R => { const k = R.int(2, 10), L = look(R); return num(`Count by 2s. How many ${NAME[L.shape]}?`, 2 * k, `Each box has 2. Count by 2s: ${run(2, 2, k).join(', ')}.`, { visual: V.cnt_pairs(k, L.shape, L.color) }); } },
    d: { t: 'from any even number', g: R => { const s = R.int(10, 45) * 2, len = 5, vals = run(s, 2, len); return R.bool() ? oneBlank(R, 'Count by 2s. What number is missing?', vals, 'Count by 2s') : seqQ('Count by 2s. Fill in A and B.', vals, [3, 4], `Count by 2s from ${s}: ${vals.join(', ')}.`); } },
  } });
})();

/* Era I · Unit I.2 Comparing & ordering (I.2.01–I.2.12) */
(function () {
  const { num, choice, choiceFixed, tf, words, V, C } = E1;

  /* ---------- visual helpers (prefix V.cnt_) ---------- */
  V.cnt_shape = V.cnt_shape || function (kind, x, y, s, fill) {
    if (kind === 'square') return `<rect x="${x - s * 0.85}" y="${y - s * 0.85}" width="${s * 1.7}" height="${s * 1.7}" rx="3" fill="${fill}"/>`;
    if (kind === 'triangle') return `<polygon points="${x},${y - s} ${x + s},${y + s * 0.8} ${x - s},${y + s * 0.8}" fill="${fill}"/>`;
    if (kind === 'star') {
      const p = [];
      for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? s * 0.45 : s * 1.05; p.push((x + rr * Math.cos(a)).toFixed(1) + ',' + (y + rr * Math.sin(a)).toFixed(1)); }
      return `<polygon points="${p.join(' ')}" fill="${fill}"/>`;
    }
    return V.dot(x, y, s, fill);
  };
  V.cnt_tens = V.cnt_tens || function (k, ones = 0, color = C.blue) {
    const c = 14, gap = 8; let body = '', x = 4;
    for (let i = 0; i < k; i++) {
      for (let j = 0; j < 10; j++) body += `<rect x="${x}" y="${4 + j * c}" width="${c}" height="${c}" fill="${color}" stroke="${C.paper}" stroke-width="1.5"/>`;
      body += `<rect x="${x}" y="4" width="${c}" height="${c * 10}" fill="none" stroke="${C.ink}" stroke-width="1.5"/>`;
      x += c + gap;
    }
    if (ones) { x += 6; for (let j = 0; j < ones; j++) { const cx = x + Math.floor(j / 5) * (c + 6), cy = 4 + c * 10 - (j % 5 + 1) * (c + 4) + 4; body += `<rect x="${cx}" y="${cy}" width="${c}" height="${c}" fill="${color}" stroke="${C.ink}" stroke-width="1.5"/>`; } x += Math.ceil(ones / 5) * (c + 6); }
    return V.svg(Math.max(20, x), c * 10 + 8, body, 'tens and ones');
  };
  // two rows lined up one-to-one; o.lines draws matching lines between pairs
  V.cnt_match = function (n1, n2, c1, c2, o = {}) {
    const g = 34, s = 11, y1 = 18, y2 = o.lines ? 78 : 58; let body = '';
    if (o.lines) for (let i = 0; i < Math.min(n1, n2); i++) body += `<line x1="${g / 2 + i * g}" y1="${y1 + s}" x2="${g / 2 + i * g}" y2="${y2 - s}" stroke="${C.line}" stroke-width="2.5"/>`;
    for (let i = 0; i < n1; i++) body += V.cnt_shape(o.shape || 'circle', g / 2 + i * g, y1, s, c1);
    for (let i = 0; i < n2; i++) body += V.cnt_shape(o.shape || 'circle', g / 2 + i * g, y2, s, c2);
    return V.svg(Math.max(n1, n2, 1) * g, y2 + 18, body, 'two rows');
  };
  // a row of n shapes with a chosen spacing
  V.cnt_srow = (n, color, gap, shape = 'circle') => V.svg(Math.max(1, n * gap), 28, Array.from({ length: n }, (_, i) => V.cnt_shape(shape, gap / 2 + i * gap, 14, 11, color)).join(''), 'row');
  // two cube trains, left-aligned
  V.cnt_trains = function (n1, n2, c1, c2) {
    const c = 20, X = i => 4 + i * (c + 2) + Math.floor(i / 5) * 5; let body = '';
    [[n1, c1, 4], [n2, c2, 34]].forEach(([n, col, y]) => { for (let i = 0; i < n; i++) body += `<rect x="${X(i)}" y="${y}" width="${c}" height="${c}" rx="3" fill="${col}"/>`; });
    return V.svg(X(Math.max(n1, n2)) + 4, 58, body, 'two cube trains');
  };
  // a queue: colors[i] is person i (i=0 at the front, on the left); 'front' marked
  V.cnt_line = function (colors) {
    const cw = 38, x0 = 56; let body = `<polygon points="6,40 20,30 20,50" fill="${C.ink}"/>` + V.text(30, 72, 'front', { size: 13, fill: C.muted, weight: 700 }) + `<line x1="42" y1="10" x2="42" y2="64" stroke="${C.line}" stroke-width="2" stroke-dasharray="4 3"/>`;
    colors.forEach((col, i) => { const cx = x0 + i * cw + cw / 2; body += V.dot(cx, 18, 9, col) + `<rect x="${cx - 11}" y="30" width="22" height="32" rx="9" fill="${col}"/>`; });
    return V.svg(x0 + colors.length * cw + 4, 80, body, 'people in a line');
  };
  // number line with letter tags at chosen values. o: from,to,labels(array of values to label),tags {value:'A'},marks,width
  V.cnt_nl = function (o) {
    const from = o.from, to = o.to, W = o.width || Math.min(580, (to - from) * 36 + 44), pad = 22, y = 44;
    const X = v => pad + (v - from) / (to - from) * (W - 2 * pad);
    let body = `<line x1="${pad - 10}" y1="${y}" x2="${W - pad + 10}" y2="${y}" stroke="${C.ink}" stroke-width="2"/>`;
    for (let v = from; v <= to; v++) {
      body += `<line x1="${X(v)}" y1="${y - 7}" x2="${X(v)}" y2="${y + 7}" stroke="${C.ink}" stroke-width="2"/>`;
      if ((o.labels || []).includes(v)) body += V.text(X(v), y + 22, v, { size: 14 });
    }
    (o.marks || []).forEach(v => body += V.dot(X(v), y, 7, C.red));
    Object.entries(o.tags || {}).forEach(([v, t]) => { body += `<circle cx="${X(+v)}" cy="${y - 24}" r="11" fill="${C.amber}"/>` + V.text(X(+v), y - 24, t, { size: 13, weight: 700 }) + `<line x1="${X(+v)}" y1="${y - 13}" x2="${X(+v)}" y2="${y - 8}" stroke="${C.amber}" stroke-width="2"/>`; });
    return V.svg(W, y + 34, body, 'number line');
  };

  /* ---------- small helpers ---------- */
  const SHAPES = ['circle', 'square', 'triangle', 'star'];
  const NAME = { circle: 'dots', square: 'squares', triangle: 'triangles', star: 'stars' };
  const PCOL = [C.red, C.blue, C.amber, C.teal, C.violet, C.pink]; // colors with plain kid names
  const cn = c => E1.colorName[c];
  const cap = s => s[0].toUpperCase() + s.slice(1);
  const KIDS = ['Ana', 'Ben', 'Mia', 'Leo', 'Zoe', 'Sam', 'Ivy', 'Max', 'Kai', 'Lily'];
  const THINGS = ['shells', 'stickers', 'marbles', 'books', 'cards', 'beads', 'stamps', 'shells'];
  const rev = n => +String(n).split('').reverse().join('');
  const two = (R, lo, hi) => R.distinct(lo, hi, 2);
  const LT = '&lt;', GT = '&gt;';
  const groupPic = (n, c, shape) => V.dots(n, { layout: 'grid', color: c, r: 10 }).replace(/<circle[^>]*>/g, m => shape === 'circle' ? m : (() => { const [, x, y] = /cx="([\d.]+)" cy="([\d.]+)"/.exec(m); return V.cnt_shape(shape, +x, +y, 10, c); })());
  const pairCaption = (a, b, c1, c2, shape) => V.side([{ caption: String(a), svg: groupPic(a, c1, shape) }, { caption: String(b), svg: groupPic(b, c2, shape) }], { gap: 40 });

  /* ================= I.2.01 ================= */
  E1.skill({ id: 'I.2.01', name: 'More or fewer by matching', steps: {
    a: { t: 'match two small sets', g: R => {
      const [c1, c2] = R.sample(PCOL, 2), n1 = R.int(1, 5), n2 = R.bool(0.2) ? n1 : R.int(1, 5), sh = R.pick(SHAPES);
      const ans = n1 > n2 ? 0 : n2 > n1 ? 1 : 2;
      return choiceFixed('Match them up. Which row has some left over?', [cap(cn(c1)), cap(cn(c2)), 'Neither'], ans, ans === 2 ? 'Every one has a partner, so nothing is left over.' : `${Math.min(n1, n2)} pair${Math.min(n1, n2) === 1 ? ' matches' : 's match'}. The ${cn(ans ? c2 : c1)} row has ${Math.abs(n1 - n2)} left over.`, { visual: V.cnt_match(n1, n2, c1, c2, { lines: true, shape: sh }) });
    } },
    b: { t: 'which has more', g: R => {
      const [c1, c2] = R.sample(PCOL, 2), [n1, n2] = two(R, 2, 9), sh = R.pick(SHAPES);
      return choiceFixed('Which row has more?', [cap(cn(c1)), cap(cn(c2))], n1 > n2 ? 0 : 1, `Match them one to one. The ${cn(n1 > n2 ? c1 : c2)} row has some left over, so it has more.`, { visual: V.cnt_match(n1, n2, c1, c2, { shape: sh }) });
    } },
    c: { t: 'which has fewer', g: R => {
      const [c1, c2] = R.sample(PCOL, 2), [n1, n2] = two(R, 2, 9), sh = R.pick(SHAPES);
      return choiceFixed('Which row has fewer?', [cap(cn(c1)), cap(cn(c2))], n1 < n2 ? 0 : 1, `Match them one to one. The ${cn(n1 < n2 ? c1 : c2)} row runs out first, so it has fewer.`, { visual: V.cnt_match(n1, n2, c1, c2, { shape: sh }) });
    } },
    d: { t: 'how many more', g: R => {
      const [c1, c2] = R.sample(PCOL, 2), a = R.int(3, 10), b = R.int(Math.max(1, a - 5), a - 1), top = R.bool(), n1 = top ? a : b, n2 = top ? b : a, sh = R.pick(SHAPES);
      const big = top ? c1 : c2, sm = top ? c2 : c1;
      return num(`How many more ${cn(big)} than ${cn(sm)}?`, a - b, `${b} ${b === 1 ? 'matches' : 'match'} up. ${a - b} ${cn(big)} ${a - b === 1 ? 'is' : 'are'} left over, so ${a - b} more.`, { visual: V.cnt_match(n1, n2, c1, c2, { lines: true, shape: sh }) });
    } },
  } });

  /* ================= I.2.02 ================= */
  E1.skill({ id: 'I.2.02', name: 'Equal groups', steps: {
    a: { t: 'same number', g: R => {
      const [c1, c2] = R.sample(PCOL, 2), n1 = R.int(2, 7), n2 = R.bool() ? n1 : n1 + R.pick([-1, 1]), sh = R.pick(SHAPES);
      return choiceFixed('Do the rows have the same number?', ['Yes', 'No'], n1 === n2 ? 0 : 1, n1 === n2 ? `Each one has a partner. Both rows have ${n1}.` : `They do not match up: ${n1} and ${n2}.`, { visual: V.cnt_match(n1, n2, c1, c2, { shape: sh }) });
    } },
    b: { t: 'make a set equal', g: R => {
      const [c1, c2] = R.sample(PCOL, 2), a = R.int(3, 9), b = R.int(Math.max(1, a - 4), a - 1), sh = R.pick(SHAPES);
      return num(`How many more ${cn(c2)} to make them the same?`, a - b, `${cn(c1)} has ${a}, ${cn(c2)} has ${b}. Add ${a - b} to make ${a}.`.replace(/^./, m => m.toUpperCase()), { visual: V.cnt_match(a, b, c1, c2, { shape: sh }) });
    } },
    c: { t: 'equal but arranged differently', g: R => {
      const n = R.int(4, 9), c = R.pick(PCOL), opts = R.shuffle([n, n - 1, n + 1]), lays = R.shuffle(['grid', 'scatter', 'grid3']);
      const pic = (k, i) => lays[i] === 'scatter' ? V.dots(k, { layout: 'scatter', R, color: c, r: 9, w: 170, h: 110 }) : V.dots(k, { layout: 'grid', per: lays[i] === 'grid3' ? 3 : 5, color: c, r: 9 });
      return choiceFixed(`Which has the same number as the row?`, opts.map(pic), opts.indexOf(n), `The row has ${n}. Count each group: the one with ${n} is the same, even though it looks different.`, { visual: V.dots(n, { color: c, r: 9 }) });
    } },
    d: { t: 'check by counting', g: R => {
      const c = R.pick(PCOL), m = R.int(5, 9), long = R.pick([m, m - 1, m + 1, m + 1]), sh = R.pick(SHAPES);
      const vis = V.stack([V.cnt_srow(long, c, 52, sh), V.cnt_srow(m, c, 26, sh)], { gap: 14 });
      if (R.bool(0.4)) return num('Count to check. How many in each row?', [{ label: 'top', ans: long }, { label: 'bottom', ans: m }], `Top: ${long}. Bottom: ${m}. Spreading out does not change how many.`, { visual: vis });
      return choiceFixed('The top row is longer. Does it have more?', ['Yes', 'No'], long > m ? 0 : 1, long > m ? `Yes. Count: top ${long}, bottom ${m}.` : long === m ? `No. Count: both have ${m}. They are just spread out differently.` : `No. Count: top ${long}, bottom ${m}. Longer does not mean more.`, { visual: vis });
    } },
  } });

  /* ================= I.2.03 ================= */
  const ALL = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
  E1.skill({ id: 'I.2.03', name: 'Number line 0–10', steps: {
    a: { t: 'numbers in place', g: R => {
      const v = R.int(1, 9), m = R.int(0, 2), labels = ALL(0, 10).filter(x => x !== v && (m === 0 || (m === 1 ? x % 2 === v % 2 || x % 5 === 0 : x % 5 === 0)));
      return num('What number goes at the tag?', v, m === 2 ? `Count on from ${v < 5 ? 0 : 5} to the tag: ${v}.` : `The numbers go up by 1 from left to right, so the tag is at ${v}.`, { visual: V.cnt_nl({ from: 0, to: 10, labels, tags: { [v]: '?' } }) });
    } },
    b: { t: 'find a number', g: R => {
      const v = R.pick([1, 2, 3, 4, 6, 7, 8, 9]), others = R.sample(ALL(1, 9).filter(x => x !== v), 2), pos = [v, ...others].sort((a, b) => a - b), tags = {}, L = 'ABC';
      pos.forEach((p, i) => tags[p] = L[i]);
      return choiceFixed(`Which letter is at <b>${v}</b>?`, ['A', 'B', 'C'], pos.indexOf(v), `Count the marks from 0: ${v} is ${v} step${v === 1 ? '' : 's'} along, at ${tags[v]}.`, { visual: V.cnt_nl({ from: 0, to: 10, labels: [0, 5, 10], tags }) });
    } },
    c: { t: 'jumps of 1', g: R => {
      const k = R.int(2, 4), fwd = R.bool(), s = fwd ? R.int(0, 10 - k) : R.int(k, 10), e = fwd ? s + k : s - k;
      const jumps = Array.from({ length: k }, (_, i) => fwd ? [s + i, s + i + 1] : [s - i, s - i - 1]);
      return num(`Start at ${s}. Jump ${k} ${fwd ? 'forward' : 'back'}. Where do you land?`, e, `${fwd ? 'Count on' : 'Count back'} ${k} from ${s}: ${jumps.map(j => j[1]).join(', ')}. You land on ${e}.`, { visual: V.numline({ from: 0, to: 10, jumps, ask: e, labels: [0, 10, s], hide: [e] }) });
    } },
    d: { t: 'missing numbers', g: R => {
      const [p, q] = R.distinct(1, 9, 2).sort((a, b) => a - b);
      return num('What numbers go at A and B?', [{ label: 'A', ans: p }, { label: 'B', ans: q }], `Count along the line from 0: A is ${p} and B is ${q}.`, { visual: V.cnt_nl({ from: 0, to: 10, labels: ALL(0, 10).filter(x => x !== p && x !== q), tags: { [p]: 'A', [q]: 'B' } }) });
    } },
  } });

  /* ================= I.2.04 ================= */
  const bigSmall = (a, b, big) => big ? (a > b ? 0 : 1) : (a < b ? 0 : 1);
  E1.skill({ id: 'I.2.04', name: 'Compare numbers to 10', steps: {
    a: { t: 'the bigger number', g: R => { const [a, b] = two(R, 1, 10), [c1, c2] = R.sample(PCOL, 2), sh = R.pick(SHAPES); return choiceFixed('Which number is bigger?', [a, b], bigSmall(a, b, true), `${Math.max(a, b)} has more than ${Math.min(a, b)}, so ${Math.max(a, b)} is bigger.`, { visual: pairCaption(a, b, c1, c2, sh) }); } },
    b: { t: 'the smaller number', g: R => { const [a, b] = two(R, 1, 10), [c1, c2] = R.sample(PCOL, 2), sh = R.pick(SHAPES); return choiceFixed('Which number is smaller?', [a, b], bigSmall(a, b, false), `${Math.min(a, b)} has fewer than ${Math.max(a, b)}, so ${Math.min(a, b)} is smaller.`, { visual: pairCaption(a, b, c1, c2, sh) }); } },
    c: { t: 'using the number line', g: R => {
      const [a, b] = two(R, 0, 10), big = R.bool(), hi = Math.max(a, b), lo = Math.min(a, b);
      return choiceFixed(`Which is ${big ? 'bigger' : 'smaller'}? Use the number line.`, [a, b], bigSmall(a, b, big), `On the number line, ${hi} is further right than ${lo}. Further right means bigger, so ${big ? hi + ' is bigger' : lo + ' is smaller'}.`, { visual: V.numline({ from: 0, to: 10, marks: [a, b] }) });
    } },
    d: { t: 'without objects', g: R => {
      const big = R.bool();
      if (R.bool(0.3)) { const ns = R.distinct(0, 10, 3); const ans = big ? Math.max(...ns) : Math.min(...ns); return choiceFixed(`Which is the ${big ? 'biggest' : 'smallest'}?`, ns, ns.indexOf(ans), `Count: ${ns.slice().sort((x, y) => x - y).join(', ')}. ${ans} is ${big ? 'last, so biggest' : 'first, so smallest'}.`); }
      const a = R.int(0, 9), [x, y] = R.bool() ? R.shuffle([a, a + 1]) : two(R, 0, 10);
      return choiceFixed(`Which is ${big ? 'bigger' : 'smaller'}: ${x} or ${y}?`, [x, y], bigSmall(x, y, big), `${Math.min(x, y)} comes before ${Math.max(x, y)} when we count, so ${big ? Math.max(x, y) : Math.min(x, y)} is ${big ? 'bigger' : 'smaller'}.`);
    } },
  } });

  /* ================= I.2.05 ================= */
  E1.skill({ id: 'I.2.05', name: 'Number line 0–20', steps: {
    a: { t: 'place teen numbers', g: R => {
      const v = R.pick([11, 12, 13, 14, 16, 17, 18, 19]);
      if (R.bool()) return num('What number goes at the dot?', v, `Start at 10 ${v < 15 ? '' : 'or 15 '}and count on to the dot: ${v}.`, { visual: V.cnt_nl({ from: 0, to: 20, labels: [0, 5, 10, 15, 20], tags: { [v]: '?' } }) });
      const o = R.sample([11, 12, 13, 14, 16, 17, 18, 19].filter(x => Math.abs(x - v) >= 1 && x !== v), 2), pos = [v, ...o].sort((a, b) => a - b), tags = {};
      pos.forEach((p, i) => tags[p] = 'ABC'[i]);
      return choiceFixed(`Which letter is at <b>${v}</b>?`, ['A', 'B', 'C'], pos.indexOf(v), `${v} is 10 and ${v - 10}. Start at 10 and count ${v - 10} mark${v - 10 === 1 ? '' : 's'}: letter ${tags[v]}.`, { visual: V.cnt_nl({ from: 0, to: 20, labels: [0, 5, 10, 15, 20], tags }) });
    } },
    b: { t: 'between', g: R => {
      if (R.bool(0.35)) { const a = R.int(8, 15), g = R.int(3, 5); return num(`How many numbers are between ${a} and ${a + g}?`, g - 1, `The numbers between are ${ALL(a + 1, a + g - 1).join(', ')}. That is ${g - 1}.`); }
      const a = R.int(9, 18); return num(`What number is between ${a} and ${a + 2}?`, a + 1, `Count: ${a}, ${a + 1}, ${a + 2}. ${a + 1} is in the middle.`);
    } },
    c: { t: 'before and after', g: R => {
      const f = R.int(0, 2);
      if (f === 0) { const n = R.int(12, 18); return num(`What is 2 before ${n}? What is 2 after ${n}?`, [{ label: '2 before', ans: n - 2 }, { label: '2 after', ans: n + 2 }], `Count back 2: ${n - 1}, ${n - 2}. Count on 2: ${n + 1}, ${n + 2}.`); }
      if (f === 1) { const n = R.int(12, 18); return num(`A is 2 before ${n}. B is 2 after ${n}. What are they?`, [{ label: 'A', ans: n - 2 }, { label: 'B', ans: n + 2 }], `Count back 2 from ${n} to get ${n - 2}. Count on 2 to get ${n + 2}.`, { visual: V.cnt_nl({ from: 10, to: 20, labels: [10, n, 20].filter(x => x !== n - 2 && x !== n + 2), tags: { [n - 2]: 'A', [n + 2]: 'B' } }) }); }
      const g = R.int(4, 7), a = R.int(10, 20 - g), b = a + g;
      return num(`How many numbers are between ${a} and ${b}?`, g - 1, `The numbers between are ${ALL(a + 1, b - 1).join(', ')}. Don't count ${a} or ${b}. That is ${g - 1}.`);
    } },
    d: { t: 'jumps forward and back', g: R => {
      const k = R.int(2, 6), fwd = R.bool(), s = fwd ? R.int(3, 20 - k) : R.int(k + 2, 20), e = fwd ? s + k : s - k;
      if (R.bool(0.4)) return num(`Start at ${s}. Jump ${k} ${fwd ? 'forward' : 'back'}. Where do you land?`, e, `${fwd ? 'Count on' : 'Count back'} ${k} from ${s}: you land on ${e}.`);
      const jumps = Array.from({ length: k }, (_, i) => fwd ? [s + i, s + i + 1] : [s - i, s - i - 1]);
      return num(`Start at ${s}. Jump ${k} ${fwd ? 'forward' : 'back'}. Where do you land?`, e, `${fwd ? 'Count on' : 'Count back'} ${k} from ${s}: ${jumps.map(j => j[1]).join(', ')}.`, { visual: V.numline({ from: Math.max(0, Math.min(s, e) - 2), to: Math.min(20, Math.max(s, e) + 2), jumps, ask: e, hide: [e] }) });
    } },
  } });

  /* ================= I.2.06 ================= */
  const orderQ = (R, ns) => {
    const up = R.bool(0.65), s = ns.slice().sort((a, b) => up ? a - b : b - a), f = a => a.join(', ');
    const swap = s.slice(); const i = R.int(0, s.length - 2); [swap[i], swap[i + 1]] = [swap[i + 1], swap[i]];
    let mix = R.shuffle(ns); if (f(mix) === f(s)) mix = swap.slice().reverse();
    return choice(R, up ? 'Which shows smallest to biggest?' : 'Which shows biggest to smallest?', f(s), [f(s.slice().reverse()), f(swap), f(mix)], `${up ? 'Smallest' : 'Biggest'} is ${s[0]}, ${up ? 'biggest' : 'smallest'} is ${s[s.length - 1]}: ${f(s)}.`);
  };
  E1.skill({ id: 'I.2.06', name: 'Order numbers', steps: {
    a: { t: 'three numbers to 10', g: R => orderQ(R, R.distinct(0, 10, 3)) },
    b: { t: 'to 20', g: R => orderQ(R, [R.int(1, 9), ...R.distinct(10, 20, 2)]) },
    c: { t: 'greatest and least', g: R => { const ns = R.distinct(1, 30, 4); return num(`${ns.join(', ')}. Which is greatest? Which is least?`, [{ label: 'greatest', ans: Math.max(...ns) }, { label: 'least', ans: Math.min(...ns) }], `In counting order: ${ns.slice().sort((a, b) => a - b).join(', ')}. Least is first, greatest is last.`); } },
    d: { t: 'to 100', g: R => {
      const [t, o] = R.distinct(1, 9, 2), a = t * 10 + o; let c; do { c = R.int(10, 99); } while (c === a || c === rev(a));
      return orderQ(R, [a, rev(a), c]);
    } },
  } });

  /* ================= I.2.07 ================= */
  const ord = E1.ordinal;
  E1.skill({ id: 'I.2.07', name: 'Ordinal numbers', steps: {
    a: { t: 'first, second, third', g: R => {
      const cols = R.sample(PCOL, 3), k = R.int(1, 3);
      if (R.bool()) return choice(R, `Which color is <b>${ord(k)}</b> in line?`, cap(cn(cols[k - 1])), cols.map(c => cap(cn(c))), `Start at the front: first ${cn(cols[0])}, second ${cn(cols[1])}, third ${cn(cols[2])}.`, { visual: V.cnt_line(cols) });
      return choiceFixed(`Where is the ${cn(cols[k - 1])} one?`, ['first', 'second', 'third'], k - 1, `Count from the front: ${cols.slice(0, k).map(cn).join(', ')}. ${cap(cn(cols[k - 1]))} is ${ord(k)}.`, { visual: V.cnt_line(cols) });
    } },
    b: { t: 'to tenth', g: R => {
      const n = R.int(6, 10), k = R.int(3, n), c = R.pick(PCOL), cols = Array.from({ length: n }, (_, i) => i === k - 1 ? c : C.line);
      return choice(R, `Where is the ${cn(c)} one in line?`, ord(k), [ord(k - 1), ord(Math.min(10, k + 1)), ord(n - k + 1)], `Count from the front: first, second, … ${ord(k)}. The ${cn(c)} one is ${ord(k)}.`, { visual: V.cnt_line(cols) });
    } },
    c: { t: 'position in a line', g: R => {
      const n = R.int(5, 10), k = R.int(2, n - 1), c = R.pick(PCOL), cols = Array.from({ length: n }, (_, i) => i === k - 1 ? c : C.line), front = R.bool();
      return num(front ? `How many people are in front of the ${cn(c)} one?` : `How many people are behind the ${cn(c)} one?`, front ? k - 1 : n - k, front ? `The ${cn(c)} one is ${ord(k)}, so ${k - 1} ${k - 1 === 1 ? 'is' : 'are'} in front.` : `There are ${n} in all. The ${cn(c)} one is ${ord(k)}, so ${n - k} ${n - k === 1 ? 'is' : 'are'} behind.`, { visual: V.cnt_line(cols) });
    } },
    d: { t: 'last and next-to-last', g: R => {
      const n = R.int(4, 6), cols = R.sample(PCOL, n);
      if (R.bool(0.4)) { const which = R.int(0, 2), idx = [n - 1, n - 2, 0][which]; return choiceFixed(`Where is the ${cn(cols[idx])} one?`, ['first', 'next-to-last', 'last'], [2, 1, 0][which], `The front is on the left. The one at the very back is last; the one just before it is next-to-last.`, { visual: V.cnt_line(cols) }); }
      const last = R.bool();
      return choice(R, `Which color is <b>${last ? 'last' : 'next-to-last'}</b>?`, cap(cn(cols[last ? n - 1 : n - 2])), [cap(cn(cols[last ? n - 2 : n - 1])), cap(cn(cols[0])), cap(cn(cols[last ? 1 : n - 3]))], last ? `Last is at the back, far from the front: ${cn(cols[n - 1])}.` : `Next-to-last is just before the last one: ${cn(cols[n - 2])}.`, { visual: V.cnt_line(cols) });
    } },
  } });

  /* ================= I.2.08 ================= */
  const story = (R, a, b, lead) => {
    const [p, q] = R.sample(KIDS, 2), th = R.pick(THINGS), more = R.bool();
    const ans = more ? (a > b ? 0 : 1) : (a < b ? 0 : 1);
    return choiceFixed(`${p} has ${a} ${th}. ${q} has ${b}. Who has ${more ? 'more' : 'fewer'}?`, [p, q], ans, `${Math.max(a, b)} is more than ${Math.min(a, b)}${lead ? ' (' + lead(a, b) + ')' : ''}, so ${more ? (a > b ? p : q) : (a < b ? p : q)} has ${more ? 'more' : 'fewer'}.`);
  };
  E1.skill({ id: 'I.2.08', name: 'Compare to 20', steps: {
    a: { t: 'using tens and ones', g: R => {
      const [a, b] = two(R, 11, 20), [c1, c2] = R.sample(PCOL, 2), big = R.bool(0.7), pic = (n, c) => V.cnt_tens(Math.floor(n / 10), n % 10, c);
      return choiceFixed(`Which is ${big ? 'more' : 'less'}?`, [a, b], bigSmall(a, b, big), (a === 20 || b === 20 ? `20 is 2 tens. ${Math.min(a, b)} is only 1 ten and ${Math.min(a, b) % 10} ${Math.min(a, b) % 10 === 1 ? 'one' : 'ones'}` : `Both have 1 ten. Compare the ones: ${Math.max(a, b)} has more ones`) + `, so ${big ? Math.max(a, b) : Math.min(a, b)} is ${big ? 'more' : 'less'}.`, { visual: V.side([{ caption: String(a), svg: pic(a, c1) }, { caption: String(b), svg: pic(b, c2) }], { gap: 50 }) });
    } },
    b: { t: 'on the number line', g: R => {
      const [a, b] = two(R, 0, 20), big = R.bool();
      return choiceFixed(`Which is ${big ? 'bigger' : 'smaller'}: ${a} or ${b}?`, [a, b], bigSmall(a, b, big), `On the number line, numbers get bigger to the right. ${Math.max(a, b)} is further right, so ${big ? Math.max(a, b) : Math.min(a, b)} is ${big ? 'bigger' : 'smaller'}.`, { visual: V.numline({ from: 0, to: 20, marks: [a, b], labels: 'all', width: 580 }) });
    } },
    c: { t: '"is more than"', g: R => {
      if (R.bool()) { const [a, b] = two(R, 5, 20), s = R.bool() ? [a, b] : [b, a]; return tf(`${s[0]} is more than ${s[1]}.`, s[0] > s[1], s[0] > s[1] ? `True. ${s[0]} comes after ${s[1]} when we count.` : `False. ${s[0]} comes before ${s[1]}, so ${s[0]} is less.`); }
      const n = R.int(8, 18), up = R.int(1, 20 - n), dn = R.int(1, Math.min(6, n - 1));
      return choice(R, `Which number is more than ${n}?`, n + up, [n - dn, n, n - Math.min(dn + 2, n)], `Numbers after ${n} are more than ${n}. ${n + up} comes after ${n}.`);
    } },
    d: { t: 'story problems', g: R => { const [a, b] = two(R, 5, 20); return story(R, a, b); } },
  } });

  /* ================= I.2.09 ================= */
  E1.skill({ id: 'I.2.09', name: 'Compare to 100', steps: {
    a: { t: 'tens first', g: R => {
      let a, b;
      if (R.bool(0.5)) { a = R.int(1, 8) * 10 + R.int(1, 9); b = rev(a); if (Math.floor(a / 10) === Math.floor(b / 10) || b < 10) b = a + 20 > 99 ? a - 20 : a + 20; }
      else { a = R.int(12, 98); do { b = R.int(12, 98); } while (Math.floor(b / 10) === Math.floor(a / 10)); }
      const [c1, c2] = R.sample(PCOL, 2), big = R.bool(0.7);
      const pic = (n, c) => V.cnt_tens(Math.floor(n / 10), n % 10, c);
      const vis = R.bool(0.5) ? { visual: V.side([{ caption: String(a), svg: pic(a, c1) }, { caption: String(b), svg: pic(b, c2) }], { gap: 30 }) } : {};
      return choiceFixed(`Which is ${big ? 'bigger' : 'smaller'}: ${a} or ${b}?`, [a, b], bigSmall(a, b, big), `Look at the tens first: ${Math.floor(Math.max(a, b) / 10)} tens is more than ${Math.floor(Math.min(a, b) / 10)} ten${Math.floor(Math.min(a, b) / 10) === 1 ? '' : 's'}. So ${big ? Math.max(a, b) : Math.min(a, b)} is ${big ? 'bigger' : 'smaller'}.`, vis);
    } },
    b: { t: 'same tens, compare ones', g: R => {
      const t = R.int(1, 9) * 10, [x, y] = R.distinct(0, 9, 2), a = t + x, b = t + y, big = R.bool();
      return choiceFixed(`Which is ${big ? 'bigger' : 'smaller'}: ${a} or ${b}?`, [a, b], bigSmall(a, b, big), `Both have ${t / 10} ten${t === 10 ? '' : 's'}. Compare the ones: ${Math.max(x, y)} is more than ${Math.min(x, y)}, so ${big ? Math.max(a, b) : Math.min(a, b)} is ${big ? 'bigger' : 'smaller'}.`);
    } },
    c: { t: 'which is closest', g: R => {
      if (R.bool(0.4)) { const t = R.int(1, 9) * 10, o = R.pick([1, 2, 3, 4, 6, 7, 8, 9]), n = t + o; return choiceFixed(`Is ${n} closer to ${t} or ${t + 10}?`, [t, t + 10], o < 5 ? 0 : 1, `${n} is ${o} from ${t} and ${10 - o} from ${t + 10}. It is closer to ${o < 5 ? t : t + 10}.`); }
      const T = R.int(2, 9) * 10, [d1, d2, d3] = R.distinct(1, 9, 3).sort((a, b) => a - b), sg = () => R.pick([-1, 1]);
      const c = T + sg() * d1; let o1 = T + sg() * d2, o2 = T + sg() * d3;
      return choice(R, `Which number is closest to ${T}?`, c, [o1, o2], `${c} is only ${d1} away from ${T}. The others are ${d2} and ${d3} away.`);
    } },
    d: { t: 'story problems', g: R => { let a = R.int(21, 99), b = R.bool(0.4) && rev(a) !== a && rev(a) > 9 ? rev(a) : R.int(21, 99); if (a === b) b = a > 50 ? a - 11 : a + 11; return story(R, a, b, (x, y) => Math.floor(x / 10) !== Math.floor(y / 10) ? 'compare the tens first' : 'same tens, so compare the ones'); } },
  } });

  /* ================= I.2.10 ================= */
  const SIGNS = ['<', '=', '>'];
  const signQ = (a, b, extra = {}) => {
    const i = a < b ? 0 : a === b ? 1 : 2, word = ['is less than', 'is equal to', 'is greater than'][i];
    return choiceFixed(`Which sign goes in the box? <b>${a} ☐ ${b}</b>`, SIGNS, i, `${a} ${word} ${b}, so ${a} ${['&lt;', '=', '&gt;'][i]} ${b}.${i !== 1 ? ' The open side faces the bigger number.' : ''}`, extra);
  };
  E1.skill({ id: 'I.2.10', name: 'Symbols =, > and <', steps: {
    a: { t: '= means "the same as"', g: R => {
      const [c1, c2] = R.sample(PCOL, 2), a = R.int(2, 8), b = R.bool() ? a : a + R.pick([-1, 1]), sh = R.pick(SHAPES);
      const vis = { visual: V.side([groupPic(a, c1, sh), groupPic(b, c2, sh)], { gap: 40 }) };
      if (R.bool()) return tf(`Is this true? <b>${a} = ${b}</b>`, a === b, a === b ? `True. Both groups have ${a}. = means "the same as".` : `False. ${a} and ${b} are not the same, so we cannot use =.`, vis);
      const opts = R.shuffle([a, a - 1, a + 1]); return choiceFixed(`Which group makes this true? <b>${a} = ?</b>`, opts.map(k => groupPic(k, c2, sh)), opts.indexOf(a), `= means "the same as". The group with ${a} is the same as ${a}.`);
    } },
    b: { t: '> and <', g: R => {
      const [a, b0] = two(R, 1, 10), b = R.bool(0.15) ? a : b0;
      const [c1, c2] = R.sample(PCOL, 2), sh = R.pick(SHAPES);
      return signQ(a, b, { visual: V.side([groupPic(a, c1, sh), groupPic(b, c2, sh)], { gap: 40 }) });
    } },
    c: { t: 'write comparisons to 20', g: R => { const a = R.int(0, 20), b = R.bool(0.15) ? a : R.int(0, 20); return signQ(a, b); } },
    d: { t: 'to 100', g: R => {
      const a = R.int(10, 99), f = R.pick([0, 0, 1, 1, 2, 3, 3]);
      const b = f === 0 && rev(a) > 9 && rev(a) !== a ? rev(a) : f === 1 ? Math.floor(a / 10) * 10 + R.int(0, 9) : f === 2 ? a : R.int(10, 99);
      if (a !== b && R.bool(0.3)) { const g = a > b ? '>' : '<', w = a > b ? '<' : '>'; return choice(R, 'Which one is true?', `${a} ${g} ${b}`, [`${a} ${w} ${b}`, `${a} = ${b}`], `${Math.max(a, b)} is greater. The open side of the sign faces it: ${a} ${g === '<' ? '&lt;' : '&gt;'} ${b}.`); }
      return signQ(a, b);
    } },
  } });

  /* ================= I.2.11 ================= */
  const frame10 = c => V.frame(10, { color: c });
  E1.skill({ id: 'I.2.11', name: 'Estimate a quantity', steps: {
    a: { t: 'more or less than 10', g: R => {
      const more = R.bool(), n = more ? R.int(15, 22) : R.int(3, 6), c = R.pick(PCOL);
      return choiceFixed('Quick look! More or less than 10?', ['Less than 10', 'More than 10'], more ? 1 : 0, `There are ${n}. The frame shows what 10 looks like; ${more ? 'this is much more' : 'this is much less'}.`, { visual: V.side([{ caption: '10', svg: frame10(C.line) }, { caption: '?', svg: V.dots(n, { layout: 'scatter', R, color: c, r: 8, w: 260, h: 160 }) }]), flash: 2000 });
    } },
    b: { t: 'about 20', g: R => {
      const t = R.pick([5, 20, 20, 50]), n = t + R.int(-2, 2), c = R.pick(PCOL);
      return choiceFixed('Quick look! About how many dots?', ['About 5', 'About 20', 'About 50'], [5, 20, 50].indexOf(t), `There are ${n}. That is about ${t}.`, { visual: V.dots(n, { layout: 'scatter', R, color: c, r: 7, w: 360, h: 200 }), flash: 2000 });
    } },
    c: { t: 'check by counting', g: R => {
      const n = R.int(11, 20), c = R.pick(PCOL), g = n + R.pick([-3, -2, 2, 3, 4]);
      return num(`Sam guessed ${g}. Count to check. How many are there?`, n, `Count carefully: there are ${n}. Sam's guess of ${g} was ${Math.abs(g - n)} ${g > n ? 'too many' : 'too few'}.`, { visual: V.dots(n, { layout: 'scatter', R, color: c, r: 9, w: 320, h: 180 }) });
    } },
    d: { t: 'make a better guess', g: R => {
      const t = R.pick([20, 40, 60]), n = t + R.int(-2, 2), c = R.pick(PCOL);
      const g0 = R.pick([10, 100]); return choiceFixed(`Sam guessed ${g0}. The frame holds 10. Better guess?`, ['About 20', 'About 40', 'About 60'], [20, 40, 60].indexOf(t), `There are ${n}. That is about ${t / 10} full frames of 10, so about ${t}. ${g0} was too ${g0 < t ? 'few' : 'many'}.`, { visual: V.side([{ caption: '10', svg: frame10(c) }, { caption: '?', svg: V.dots(n, { layout: 'scatter', R, color: c, r: 6, w: 340, h: 230 }) }]), flash: 3000 });
    } },
  } });

  /* ================= I.2.12 ================= */
  const trainQ = (R, lo, hi) => {
    const [c1, c2] = R.sample(PCOL, 2), a = R.int(lo, hi), b = R.int(Math.max(1, a - 8), a - 1), top = R.bool(), more = R.bool();
    const big = top ? c1 : c2, sm = top ? c2 : c1;
    return num(more ? `How many more ${cn(big)} than ${cn(sm)}?` : `How many fewer ${cn(sm)} than ${cn(big)}?`, a - b, `The first ${b === 1 ? 'cube lines' : b + ' cubes line'} up. The ${cn(big)} train has ${a - b} extra.`, { visual: V.cnt_trains(top ? a : b, top ? b : a, c1, c2) });
  };
  E1.skill({ id: 'I.2.12', name: 'How many more, how many fewer', steps: {
    a: { t: 'count the difference to 10', g: R => trainQ(R, 3, 10) },
    b: { t: 'to 20', g: R => trainQ(R, 11, 20) },
    c: { t: 'with a number line', g: R => {
      const b = R.int(0, 16), a = R.int(b + 2, Math.min(20, b + 8)), more = R.bool();
      const lo = Math.max(0, b - 2), hi = Math.min(20, Math.max(a + 2, lo + 10)); return num(more ? `${a} is how many more than ${b}?` : `${b} is how many less than ${a}?`, a - b, `Count the jumps from ${b} to ${a} on the line: ${a - b}.`, { visual: V.numline({ from: lo, to: hi, marks: [a, b] }) });
    } },
    d: { t: 'story problems', g: R => {
      const [p, q] = R.sample(KIDS, 2), th = R.pick(THINGS), a = R.int(8, 20), b = R.int(Math.max(2, a - 9), a - 1), more = R.bool();
      return num(more ? `${p} has ${a} ${th}. ${q} has ${b}. How many more does ${p} have?` : `${p} has ${a} ${th}. ${q} has ${b}. How many fewer does ${q} have?`, a - b, `Count up from ${b} to ${a}: that is ${a - b}. ${a} − ${b} = ${a - b}.`);
    } },
  } });
})();

/* Era I · Unit I.3 Place value */
(function(){ const {num, choice, choiceFixed, tf, words, V, C} = E1;

/* ---------- pv_ visual helpers (shared with i4.js; guarded so either file can load first) ---------- */
// base-ten blocks: flats (hundreds), rods (tens), unit cubes (ones). o may exceed 9 (unbundled ones).
V.pv_blocks = V.pv_blocks || function ({h = 0, t = 0, o = 0}, opt = {}) {
  const u = opt.u || (h ? 8 : 12), L = 10 * u, pad = 4, sg = Math.max(18, 2 * u), rg = 6, cg = 4;
  const st = `stroke="${C.ink}" stroke-width="1.2"`, gl = `stroke="#FFFFFF" stroke-width="1" stroke-opacity="0.75"`;
  const flat = (x, y) => { let s = `<rect x="${x}" y="${y}" width="${L}" height="${L}" fill="${C.teal}" ${st}/>`;
    for (let i = 1; i < 10; i++) s += `<line x1="${x + i * u}" y1="${y + 1}" x2="${x + i * u}" y2="${y + L - 1}" ${gl}/><line x1="${x + 1}" y1="${y + i * u}" x2="${x + L - 1}" y2="${y + i * u}" ${gl}/>`;
    return s; };
  const rod = (x, y) => { let s = `<rect x="${x}" y="${y}" width="${u}" height="${L}" fill="${C.blue}" ${st}/>`;
    for (let i = 1; i < 10; i++) s += `<line x1="${x + 1}" y1="${y + i * u}" x2="${x + u - 1}" y2="${y + i * u}" ${gl}/>`;
    return s; };
  const cube = (x, y) => `<rect x="${x}" y="${y}" width="${u}" height="${u}" fill="${C.red}" ${st}/>`;
  const fW = n => n ? n * (L + rg) - rg : 0, rW = t ? t * (u + rg) - rg : 0, oc = Math.ceil(o / 5), oW = o ? oc * (u + cg) - cg : 0;
  const drawTO = (x, y) => { let s = '';
    for (let i = 0; i < t; i++) s += rod(x + i * (u + rg), y);
    x += rW + (t && o ? sg : 0);
    for (let i = 0; i < o; i++) { const c = Math.floor(i / 5), r = i % 5; s += cube(x + c * (u + cg), y + L - (r + 1) * (u + cg) + cg); }
    return s; };
  const parts = [fW(h), rW, oW].filter(w => w > 0), one = parts.reduce((a, b) => a + b, 0) + sg * (parts.length - 1);
  let body = '', W, H;
  if (one + 2 * pad <= (opt.maxW || 380)) {
    let x = pad; for (let i = 0; i < h; i++) body += flat(x + i * (L + rg), pad);
    x += fW(h) + (h && (t || o) ? sg : 0); body += drawTO(x, pad);
    W = Math.max(one, 1) + 2 * pad; H = L + 2 * pad;
  } else {
    const per = 5, rows = Math.ceil(h / per);
    for (let i = 0; i < h; i++) body += flat(pad + (i % per) * (L + rg), pad + Math.floor(i / per) * (L + rg));
    const y = pad + rows * (L + rg) + (t || o ? 8 : -rg);
    if (t || o) body += drawTO(pad, y);
    W = Math.max(fW(Math.min(h, per)), rW + oW + (t && o ? sg : 0)) + 2 * pad; H = y + (t || o ? L : 0) + pad;
  }
  return V.svg(W, H, body, 'base-ten blocks');
};
// loose sticks (groups of 5) with optional bundles of 10 tied with a band
V.pv_sticks = function (n, bundles = 0) {
  let body = '', x = 6; const h = 56, y = 6;
  for (let b = 0; b < bundles; b++) {
    for (let i = 0; i < 10; i++) body += `<rect x="${x + i * 5}" y="${y}" width="5" height="${h}" rx="2" fill="${C.amber}" stroke="${C.ink}" stroke-width="0.8"/>`;
    body += `<rect x="${x - 3}" y="${y + h / 2 - 5}" width="${56}" height="10" rx="3" fill="${C.red}"/>`; x += 72;
  }
  for (let i = 0; i < n; i++) { body += `<rect x="${x}" y="${y}" width="6" height="${h}" rx="3" fill="${C.amber}" stroke="${C.ink}" stroke-width="0.8"/>`; x += (i % 5 === 4) ? 24 : 13; }
  return V.svg(x, h + 12, body, 'sticks');
};
// part of a hundred chart (1–100, rows of 10). state(v) → 'show' | 'blank' | 'ask' | 'mark' | 'hl'
V.pv_chart = function ({from, rows, c0 = 0, cols = 10, state = () => 'show'}) {
  const s = 40; let body = '';
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const v = from + r * 10 + c0 + c, x = 2 + c * s, y = 2 + r * s, k = state(v);
    const fill = k === 'ask' || k === 'mark' ? C.amber : k === 'hl' ? '#CFE3F6' : C.paper;
    body += `<rect x="${x}" y="${y}" width="${s}" height="${s}" fill="${fill}" stroke="${C.line}" stroke-width="1.5"/>`;
    if (k === 'show' || k === 'hl') body += V.text(x + s / 2, y + s / 2, v, {size: 15});
    if (k === 'ask') body += V.text(x + s / 2, y + s / 2, '?', {size: 18, weight: 700});
  }
  return V.svg(cols * s + 4, rows * s + 4, body, 'hundred chart');
};

/* ---------- small helpers ---------- */
const T = n => Math.floor(n / 10) % 10, O = n => n % 10, H = n => Math.floor(n / 100);
const pl = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
const rev = n => O(n) * 10 + T(n);
const tensOnes = n => [{label: 'tens', ans: T(n)}, {label: 'ones', ans: O(n)}];
const blk = n => V.pv_blocks({h: H(n), t: T(n), o: O(n)});
const rowStart = v => Math.floor((v - 1) / 10) * 10 + 1;

E1.skill({ id: 'I.3.01', name: 'Ten ones make a ten', steps: {
  a: { t: 'bundle 10 sticks', g: (R) => {
    if (R.bool()) { const n = R.int(3, 9);
      return num('How many more sticks make a bundle of 10?', 10 - n, `There are ${n} sticks. ${n} and ${10 - n} make 10.`, {visual: V.pv_sticks(n)}); }
    const k = R.int(1, 9);
    if (R.bool(0.35)) return num('1 bundle is 10 sticks. How many sticks in all?', 10 + k, `The bundle is 10. Count on ${k}: ${10 + k}.`, {visual: V.pv_sticks(k, 1)});
    return num('Bundle 10 sticks. How many are left over?', k, `There are ${10 + k} sticks. 10 go in the bundle and ${k} ${k === 1 ? 'is' : 'are'} left.`, {visual: V.pv_sticks(10 + k)}); } },
  b: { t: 'fill a ten-frame', g: (R) => {
    const n = R.int(1, 9), a = R.bool() ? n : R.int(1, n), b = n - a;
    return num('How many more to fill the ten-frame?', 10 - n, `${n} ${n === 1 ? 'box is' : 'boxes are'} full, ${10 - n} ${10 - n === 1 ? 'is' : 'are'} empty. ${n} + ${10 - n} = 10.`, {visual: V.frame(a, {n2: b, frames: 1})}); } },
  c: { t: 'say "one ten"', g: (R) => {
    const n = R.bool() ? 10 : R.pick([8, 9, 11, 12]), kind = R.pick(['frame', 'dots', 'sticks', 'cubes']);
    const vis = kind === 'frame' ? V.frame(n) : kind === 'dots' ? V.dots(n, {layout: 'grid', color: R.pick(C.set)}) : kind === 'sticks' ? V.pv_sticks(n) : V.pv_blocks({o: n});
    return tf('This is 1 ten.', n === 10, n === 10 ? 'There are 10. 10 ones make 1 ten.' : `There are ${n}, not 10. 1 ten is exactly 10 ones.`, {visual: vis}); } },
  d: { t: '10 ones = 1 ten', g: (R) => {
    const k = R.int(1, 9), f = R.int(0, 2);
    if (f === 0) return num(`${10 * k} ones = ? ${k === 1 ? 'ten' : 'tens'}`, k, `Every 10 ones make 1 ten. ${10 * k} ones is ${pl(k, 'ten')}.`);
    if (f === 1) return num(`${pl(k, 'ten')} = ? ones`, 10 * k, `Each ten is 10 ones. ${pl(k, 'ten')} is ${10 * k} ones.`);
    return num(`? ones = ${pl(k, 'ten')}`, 10 * k, `Each ten is 10 ones, so ${pl(k, 'ten')} is ${10 * k} ones.`, {visual: V.pv_blocks({t: k})}); } },
}});

const teenQ = (R, k) => {
  const n = 10 + k, vis = R.bool() ? V.frame(10, {n2: k, frames: 2}) : V.pv_blocks({t: 1, o: k});
  if (R.bool(0.2)) return num(`1 ten and ${pl(k, 'one')} = ?`, n, `1 ten is 10. 10 + ${k} = ${n}.`);
  return R.bool() ? num('How many in all?', n, `1 ten is 10. 10 and ${k} more is ${n}.`, {visual: vis})
    : num('How many tens and ones?', [{label: 'tens', ans: 1}, {label: 'ones', ans: k}], `There is 1 full ten and ${pl(k, 'one')} left: ${n}.`, {visual: vis});
};
E1.skill({ id: 'I.3.02', name: 'Teen numbers are a ten and some ones', steps: {
  a: { t: '11–15', g: (R) => teenQ(R, R.int(1, 5)) },
  b: { t: '16–19', g: (R) => teenQ(R, R.int(6, 9)) },
  c: { t: 'build teen numbers', g: (R) => {
    const k = R.int(1, 9), n = 10 + k;
    if (R.bool(0.4)) return num(`Build ${n}. 1 ten and how many ones?`, k, `${n} is 10 and ${k} more, so ${pl(k, 'one')}.`);
    const B = (t, o) => V.pv_blocks({t, o}, {u: 10});
    const ds = k > 1 ? [B(k, 1), B(0, k), B(1, k === 9 ? 8 : k + 1)] : [B(1, 0), B(1, 2), B(0, 1)];
    return choice(R, `Which shows ${n}?`, B(1, k), ds,
      `${n} is 1 ten (a rod) and ${pl(k, 'one')} (small cubes).`); } },
  d: { t: 'read teens from blocks', g: (R) => {
    const k = R.int(1, 9), n = 10 + k, vis = V.pv_blocks({t: 1, o: k});
    if (R.bool()) return num('What number do the blocks show?', n, `1 ten is 10, plus ${pl(k, 'one')} makes ${n}.`, {visual: vis});
    return choice(R, 'What number do the blocks show?', n, [rev(n), n + 1, n - 1], `1 ten and ${pl(k, 'one')} is ${n}. The tens digit comes first.`, {visual: vis}); } },
}});

const tenSeq = t => Array.from({length: t}, (_, i) => 10 * (i + 1)).join(', ');
E1.skill({ id: 'I.3.03', name: 'Tens and ones to 50', steps: {
  a: { t: 'name the tens', g: (R) => {
    const t = R.int(1, 5), f = R.int(0, 2);
    if (f === 0) return num('How many? Count by tens.', 10 * t, `Count the rods: ${tenSeq(t)}.`, {visual: V.pv_blocks({t})});
    if (f === 1) return choice(R, `Which number is ${pl(t, 'ten')}?`, 10 * t, [t, 10 + t, 10 * (t + 1)], `${pl(t, 'ten')} is ${tenSeq(t)}: ${10 * t}.`);
    return choice(R, `What do we call ${pl(t, 'ten')}?`, words(10 * t), [words(t), words(10 + t), words(10 * (t + 1))], `Count by tens: ${tenSeq(t)}. ${pl(t, 'ten')} is ${words(10 * t)}.`); } },
  b: { t: 'count tens, then ones', g: (R) => {
    const t = R.int(1, 4), o = R.int(1, 9), n = 10 * t + o, vis = V.pv_blocks({t, o});
    if (R.bool()) return num('Count the tens, then the ones.', tensOnes(n), `There ${t === 1 ? 'is' : 'are'} ${pl(t, 'rod')} (tens) and ${pl(o, 'cube')} (ones).`, {visual: vis});
    return num('How many in all?', n, `Count tens: ${tenSeq(t)}. Then count on ${o}: ${o === 1 ? n : `${10 * t + 1} … ${n}`}.`, {visual: vis}); } },
  c: { t: 'build a number', g: (R) => {
    const n = R.int(11, 50), t = T(n), o = O(n);
    if (R.bool() && o > 0 && t !== o) { const B = (a, b) => V.pv_blocks({t: a, o: b}, {u: 10});
      return choice(R, `Which blocks show ${n}?`, B(t, o), [B(o, t), B(t, o === 9 ? 8 : o + 1), B(t === 1 ? 2 : t - 1, o)],
        `${n} is ${pl(t, 'ten')} (rods) and ${pl(o, 'one')} (cubes).`); }
    return num(`Build ${n}. How many tens and ones?`, tensOnes(n), `${n} has ${T(n)} in the tens place and ${O(n)} in the ones place.`); } },
  d: { t: 'read blocks', g: (R) => {
    const t = R.int(1, 4), o = R.int(1, 9), n = 10 * t + o;
    return choice(R, 'What number do the blocks show?', n, [rev(n), n + 10, n - 1], `${pl(t, 'ten')} is ${10 * t}, and ${pl(o, 'one')} more makes ${n}.`, {visual: V.pv_blocks({t, o})}); } },
}});

const twoDig = R => { const t = R.int(1, 9); let o = R.int(1, 9); if (o === t) o = o === 9 ? 1 : o + 1; return 10 * t + o; };
E1.skill({ id: 'I.3.04', name: 'Tens and ones to 99', steps: {
  a: { t: 'what each digit means', g: (R) => {
    const n = twoDig(R), tens = R.bool(), d = tens ? T(n) : O(n);
    return choice(R, `In ${n}, what does the ${d} mean?`, pl(d, tens ? 'ten' : 'one'), [pl(d, tens ? 'one' : 'ten')],
      `In ${n}, the left digit is tens and the right digit is ones. So ${d} means ${pl(d, tens ? 'ten' : 'one')}.`); } },
  b: { t: 'value of each digit', g: (R) => {
    const n = twoDig(R), tens = R.bool(), d = tens ? T(n) : O(n);
    return num(`What is the value of the ${d} in ${n}?`, tens ? 10 * d : d, tens ? `The ${d} is in the tens place: ${pl(d, 'ten')} = ${10 * d}.` : `The ${d} is in the ones place, so it is worth ${d}.`); } },
  c: { t: 'build any number', g: (R) => {
    const n = R.int(20, 99), f = R.int(0, 2), t = T(n), o = O(n);
    if (f === 0) return num(`Build ${n}. How many tens and ones?`, tensOnes(n), `${n} = ${pl(t, 'ten')} and ${pl(o, 'one')}.`);
    if (f === 1) return num(`? tens and ${pl(o, 'one')} = ${n}`, t, `The tens digit of ${n} is ${t}.`);
    return num(`${t} tens and ${pl(o, 'one')} = ?`, n, `${t} tens is ${10 * t}. ${10 * t} + ${o} = ${n}.`); } },
  d: { t: '34 vs 43', g: (R) => {
    const n = twoDig(R), t = T(n), o = O(n);
    if (R.bool()) return choice(R, 'What number do the blocks show?', n, [rev(n)], `${pl(t, 'ten')} and ${pl(o, 'one')}. Tens come first: ${n}, not ${rev(n)}.`, {visual: V.pv_blocks({t, o})});
    return choice(R, `Which has ${pl(t, 'ten')} and ${pl(o, 'one')}?`, n, [rev(n)], `Write the tens digit first, then the ones digit: ${n}.`); } },
}});

E1.skill({ id: 'I.3.05', name: 'Bundle and unbundle', steps: {
  a: { t: 'bundle ones into a ten', g: (R) => {
    const t = R.int(1, 4), o = R.int(10, 17);
    return num('Bundle 10 ones into a ten. Now how many tens and ones?', [{label: 'tens', ans: t + 1}, {label: 'ones', ans: o - 10}],
      `10 of the ${o} ones make 1 more ten. Now ${pl(t + 1, 'ten')} and ${pl(o - 10, 'one')}.`, {visual: V.pv_blocks({t, o})}); } },
  b: { t: 'break a ten into ones', g: (R) => {
    const t = R.int(2, 6), o = R.int(0, 8);
    return num('Break 1 ten into ones. Now how many tens and ones?', [{label: 'tens', ans: t - 1}, {label: 'ones', ans: o + 10}],
      `1 ten becomes 10 ones: ${pl(t - 1, 'ten')} left, and ${o} + 10 = ${o + 10} ones.`, {visual: V.pv_blocks({t, o})}); } },
  c: { t: 'show a number two ways', g: (R) => {
    const t = R.int(2, 8), o = R.int(0, 9), n = 10 * t + o, w = (a, b) => `${pl(a, 'ten')} ${pl(b, 'one')}`;
    return choice(R, `Which also shows ${n}?`, w(t - 1, o + 10), [w(t, o + 10), w(t - 1, o), w(t + 1, o + 10 > 9 ? o : o + 1)],
      `Break 1 ten into 10 ones: ${pl(t - 1, 'ten')} and ${o + 10} ones is still ${n}.`, {visual: V.pv_blocks({t, o})}); } },
  d: { t: '3 tens 12 ones = 42', g: (R) => {
    const t = R.int(1, 7), o = R.int(10, 19), n = 10 * t + o;
    if (R.bool()) return num(`${pl(t, 'ten')} ${o} ones = ?`, n, `${o} ones is 1 ten and ${pl(o - 10, 'one')}. So ${pl(t + 1, 'ten')} ${pl(o - 10, 'one')} = ${n}.`);
    return num(`? tens ${o} ones = ${n}`, t, `${o} ones is 1 ten and ${o - 10}. ${n} has ${T(n)} tens, so we need ${T(n)} − 1 = ${t}.`); } },
}});

E1.skill({ id: 'I.3.06', name: 'Hundreds', steps: {
  a: { t: 'ten tens make a hundred', g: (R) => {
    const f = R.int(0, 2), k = R.int(3, 9);
    if (f === 0) return num('How many more tens make 100?', 10 - k, `There are ${k} tens. 10 tens make 100, and ${k} + ${10 - k} = 10.`, {visual: V.pv_blocks({t: k})});
    if (f === 1) return num(`${pl(k, 'ten')} + ? tens = 100`, 10 - k, `100 is 10 tens. ${k} + ${10 - k} = 10.`);
    return num(`100 = ${pl(k, 'ten')} + ? tens`, 10 - k, `100 is 10 tens, so ${10 - k} more tens.`); } },
  b: { t: 'count hundreds to 900', g: (R) => {
    const h = R.int(1, 9), f = R.int(0, 2), seq = Array.from({length: h}, (_, i) => 100 * (i + 1)).join(', ');
    if (f === 0) return num('How many? Count by hundreds.', 100 * h, `Count the flats: ${seq}.`, {visual: V.pv_blocks({h})});
    if (f === 1) return num(`${pl(h, 'hundred')} = ?`, 100 * h, `Count by hundreds: ${seq}.`);
    return num(`? hundreds = ${100 * h}`, h, `${100 * h} is ${words(h)} hundred: ${h} hundred${h === 1 ? '' : 's'}.`); } },
  c: { t: 'build 3-digit numbers', g: (R) => {
    const n = R.int(101, 999);
    return num(`Build ${n}. How many hundreds, tens and ones?`, [{label: 'hundreds', ans: H(n)}, {label: 'tens', ans: T(n)}, {label: 'ones', ans: O(n)}],
      `Read the digits of ${n} from left: ${H(n)} hundred${H(n) === 1 ? '' : 's'}, ${T(n)} ten${T(n) === 1 ? '' : 's'}, ${O(n)} one${O(n) === 1 ? '' : 's'}.`); } },
  d: { t: 'read 3-digit numbers', g: (R) => {
    const h = R.int(1, 5), t = R.int(1, 9), o = R.int(1, 9), n = 100 * h + 10 * t + o;
    return choice(R, 'What number do the blocks show?', n, [100 * h + 10 * o + t, 100 * o + 10 * t + h, n + 100],
      `${pl(h, 'hundred')}, ${pl(t, 'ten')}, ${pl(o, 'one')}: ${100 * h} + ${10 * t} + ${o} = ${n}.`, {visual: V.pv_blocks({h, t, o})}); } },
}});

const threeDistinct = R => { const [a, b, c] = R.distinct(1, 9, 3); return 100 * a + 10 * b + c; };
const digitQ = (place) => (R) => {
  const n = threeDistinct(R), d = place === 'hundreds' ? H(n) : place === 'tens' ? T(n) : O(n);
  const pos = place === 'hundreds' ? 'first (left)' : place === 'tens' ? 'middle' : 'last (right)';
  return num(`What is the ${place} digit in ${n}?`, d, `The ${place} digit is the ${pos} digit: ${d}.`);
};
E1.skill({ id: 'I.3.07', name: 'Three-digit place value', steps: {
  a: { t: 'the hundreds digit', g: digitQ('hundreds') },
  b: { t: 'the tens and ones digits', g: (R) => R.bool() ? digitQ('tens')(R) : digitQ('ones')(R) },
  c: { t: 'the value of a digit (the 4 in 347 is 40)', g: (R) => {
    const n = threeDistinct(R), p = R.int(0, 2), place = ['ones', 'tens', 'hundreds'][p], d = [O(n), T(n), H(n)][p], val = d * [1, 10, 100][p];
    return choice(R, `What is the <b>${d}</b> worth in ${n}?`, val, [d, 10 * d, 100 * d, n],
      `The ${d} is in the ${place} place, so it is worth ${pl(d, place.slice(0, -1))}: ${val}.`); } },
  d: { t: 'zero as a placeholder', g: (R) => {
    const h = R.int(1, 9), x = R.int(1, 9), f = R.int(0, 2);
    if (f === 0) return choice(R, `Which is ${pl(h, 'hundred')}, 0 tens, ${pl(x, 'one')}?`, `${h}0${x}`, [`${h}${x}`, `${h}${x}0`],
      `Write 0 to hold the tens place: ${h}0${x}.`);
    if (f === 1) return choice(R, `Which is ${pl(h, 'hundred')} and ${pl(x, 'ten')}?`, `${h}${x}0`, [`${h}${x}`, `${h}0${x}`],
      `There are 0 ones, so write 0 in the ones place: ${h}${x}0.`);
    return num(`What is the tens digit in ${h}0${x}?`, 0, `The middle digit is 0, so there are 0 tens.`); } },
}});

E1.skill({ id: 'I.3.08', name: 'Expanded form', steps: {
  a: { t: '2-digit (40 + 7)', g: (R) => {
    const n = twoDig(R), t = T(n), o = O(n), f = R.int(0, 2);
    if (f === 0) return num(`${n} = ${10 * t} + ?`, o, `${n} is ${10 * t} and ${o} more.`);
    if (f === 1) return num(`${n} = ? + ${o}`, 10 * t, `The ${t} in ${n} means ${pl(t, 'ten')}, which is ${10 * t}.`);
    return choice(R, `Which is ${n}?`, `${10 * t} + ${o}`, [`${t} + ${o}`, `${10 * o} + ${t}`, `${10 * t} + ${10 * o}`], `${n} is ${pl(t, 'ten')} and ${pl(o, 'one')}: ${10 * t} + ${o}.`); } },
  b: { t: '3-digit', g: (R) => {
    const n = threeDistinct(R), p = [100 * H(n), 10 * T(n), O(n)], i = R.int(0, 2);
    const s = p.map((v, j) => j === i ? '?' : v).join(' + ');
    return num(`${n} = ${s}`, p[i], `${n} = ${p.join(' + ')}.`); } },
  c: { t: 'expanded to standard', g: (R) => {
    const n = 100 * R.int(1, 9) + 10 * R.int(1, 9) + R.int(1, 9), p = [100 * H(n), 10 * T(n), O(n)], q = R.bool(0.3) ? R.shuffle(p) : p;
    return num(`${q.join(' + ')} = ?`, n, `${pl(H(n), 'hundred')}, ${pl(T(n), 'ten')} and ${pl(O(n), 'one')} make ${n}.`); } },
  d: { t: 'with zeros (305)', g: (R) => {
    const h = R.int(1, 9), x = R.int(1, 9), zeroTens = R.bool(), n = zeroTens ? 100 * h + x : 100 * h + 10 * x, part = n - 100 * h, f = R.int(0, 2);
    if (f === 0) return num(`${n} = ${100 * h} + ?`, part, `${n} has ${zeroTens ? '0 tens' : '0 ones'}, so ${n} = ${100 * h} + ${part}.`);
    if (f === 1) return num(`${100 * h} + ${part} = ?`, n, `${pl(h, 'hundred')} and ${part}: put 0 in the ${zeroTens ? 'tens' : 'ones'} place. ${n}.`);
    const ds = zeroTens ? [`${100 * h} + ${10 * x}`, `${10 * h} + ${x}`] : [`${100 * h} + ${x}`, `${10 * h} + ${x}`];
    return choice(R, `Which is ${n}?`, `${100 * h} + ${part}`, ds, `${n} = ${100 * h} + ${part}. The 0 shows there are no ${zeroTens ? 'tens' : 'ones'}.`); } },
}});

E1.skill({ id: 'I.3.09', name: 'Number names', steps: {
  a: { t: 'read to 100', g: (R) => {
    const n = R.int(11, 99), ds = [n + 10 > 99 ? n - 10 : n + 10, n + 1];
    if (O(n) > 0 && rev(n) !== n) ds.unshift(rev(n));
    if (n >= 13 && n <= 19) ds.unshift(10 * (n - 10));
    return choice(R, `Which number is <b>${words(n)}</b>?`, n, ds.slice(0, 3), `${words(n)[0].toUpperCase() + words(n).slice(1)} is ${n}.`); } },
  b: { t: 'write to 20 in words', g: (R) => {
    const n = R.bool(0.75) ? R.int(11, 20) : R.int(0, 10); let ds;
    if (n >= 13 && n <= 19) ds = [words(10 * (n - 10)), words(n - 10), words(n + 1)];
    else if (n >= 2 && n <= 9) ds = [words(n + 10), words(n + 1), words(n - 1)];
    else ds = [words(Math.max(0, n - 1)), words(Math.min(20, n + 1)), words(n === 20 ? 12 : n === 10 ? 1 : (n + 2) % 21)];
    return choice(R, `Which word is ${n}?`, words(n), ds, `${n} is written ${words(n)}.`); } },
  c: { t: 'write to 100', g: (R) => {
    const n = R.int(21, 99), ds = [words(n + 10 > 99 ? n - 10 : n + 10), words(n === 99 ? 98 : n + 1)];
    if (O(n) > 1) ds.unshift(words(rev(n)));
    return choice(R, `How do you write ${n} in words?`, words(n), ds, `${10 * T(n)} is ${words(10 * T(n))}${O(n) ? `, so ${n} is ${words(n)}` : ''}.`); } },
  d: { t: 'read and write to 1,000', g: (R) => {
    const h = R.int(1, 9), t = R.pick([0, R.int(1, 9)]), o = R.int(t ? 0 : 1, 9), n = 100 * h + 10 * t + o, sw = 100 * h + 10 * o + t;
    const other = n + 100 <= 999 ? n + 100 : n - 100;
    if (R.bool(0.15)) return choice(R, 'Which number is <b>one thousand</b>?', 1000, [100, 10000, 101], 'One thousand is 10 hundreds: 1000.');
    if (R.bool()) { const ds = [sw, other]; if (t === 0) ds.push(`${h}00${o}`); else ds.push(10 * h + o);
      return choice(R, `Which number is <b>${words(n)}</b>?`, n, ds, `${words(n)}: ${pl(h, 'hundred')}, ${pl(t, 'ten')}, ${pl(o, 'one')} = ${n}.`); }
    return choice(R, `How do you write ${n} in words?`, words(n), [words(sw), words(other), words(n + 10 <= 999 ? n + 10 : n - 10)], `${n} = ${100 * h} + ${n % 100}, so say ${words(100 * h)} ${words(n % 100)}.`); } },
}});

E1.skill({ id: 'I.3.10', name: '10 more, 10 less', steps: {
  a: { t: 'on a hundred chart', g: (R) => {
    const v = R.int(11, 90), more = R.bool(), q = more ? v + 10 : v - 10, rs = rowStart(v) - 10;
    return num(`What number is in the ? box?`, q, `The ? is one row ${more ? 'below' : 'above'} ${v}. One row ${more ? 'down is 10 more' : 'up is 10 less'}: ${q}.`,
      {visual: V.pv_chart({from: rs, rows: 3, state: x => x === q ? 'ask' : x === v ? 'hl' : rowStart(x) === rowStart(q) ? 'blank' : 'show'})}); } },
  b: { t: 'in your head', g: (R) => {
    const v = R.int(10, 89), more = R.bool(), q = more ? v + 10 : v - 10;
    return num(`10 ${more ? 'more' : 'less'} than ${v} is ?`, q, `Change the tens digit by 1: ${v} → ${q}. The ones stay ${O(v)}.`); } },
  c: { t: '100 more and less', g: (R) => {
    const v = R.int(100, 899), more = R.bool(), q = more ? v + 100 : v - 100;
    return num(`100 ${more ? 'more' : 'less'} than ${v} is ?`, q, `Change the hundreds digit by 1: ${v} → ${q}.`); } },
  d: { t: 'across a hundred (95 → 105)', g: (R) => {
    const h = R.bool() ? 0 : R.int(1, 8), o = R.int(1, 9), more = R.bool(), hun = 100 * (h + 1);
    const v = more ? hun - 10 + o : hun + o, q = more ? v + 10 : v - 10;
    const why = more ? `Count on 10 from ${v}: ${10 - o} more makes ${hun}, then ${o} more makes ${q}.` : `Count back 10 from ${v}: ${o} back makes ${hun}, then ${10 - o} more back makes ${q}.`;
    if (R.bool(0.6)) return num(`10 ${more ? 'more' : 'less'} than ${v} is ?`, q, why);
    return choice(R, `What is 10 ${more ? 'more' : 'less'} than ${v}?`, q, more ? [v + 1, q + 10, v + 100] : [v - 1, q - 10, v + 10], why); } },
}});

E1.skill({ id: 'I.3.11', name: 'The hundred chart', steps: {
  a: { t: 'find numbers', g: (R) => {
    const rs = R.pick([1, 11, 21, 31, 41, 51, 61, 71]), v = rs + 10 * R.int(0, 2) + R.int(2, 9);
    return num('What number goes in the yellow box?', v, `The row starts at ${rowStart(v)}. Count along: ${rowStart(v)}, ${rowStart(v) + 1} … ${v}.`,
      {visual: V.pv_chart({from: rs, rows: 3, state: x => x === v ? 'mark' : (x - 1) % 10 === 0 ? 'show' : 'blank'})}); } },
  b: { t: 'rows and columns', g: (R) => {
    const v = R.int(12, 89), c = (v - 1) % 10; const vv = (c === 0 || c === 9) ? v + (c === 0 ? 1 : -1) : v;
    const dir = R.pick(['below', 'above', 'right', 'left']), q = {below: vv + 10, above: vv - 10, right: vv + 1, left: vv - 1}[dir];
    const phrase = {below: 'just below', above: 'just above', right: 'just right of', left: 'just left of'}[dir];
    return num(`What number is ${phrase} ${vv}?`, q, dir === 'below' || dir === 'above' ? `A column goes up or down by 10: ${q}.` : `Along a row, numbers go up by 1: ${q}.`,
      {visual: V.pv_chart({from: vv - 11, rows: 3, cols: 3, state: x => x === vv ? 'hl' : x === q ? 'ask' : 'blank'})}); } },
  c: { t: 'missing numbers', g: (R) => {
    const rs = R.pick([1, 11, 21, 31, 41, 51, 61, 71]), cells = R.distinct(rs, rs + 29, 5), q = cells[0];
    return num('What number goes in the ? box?', q, `Count along the row, or use the number above or below (10 apart): ${q}.`,
      {visual: V.pv_chart({from: rs, rows: 3, state: x => x === q ? 'ask' : cells.includes(x) ? 'blank' : 'show'})}); } },
  d: { t: 'patterns', g: (R) => {
    const v = R.int(12, 89);
    if (R.bool()) {
      const ks = [-3, -2, -1, 1, 2, 3].filter(k => v + 10 * k >= 1 && v + 10 * k <= 100), c = v + 10 * R.pick(ks);
      const ds = [rev(v), v + 1, v - 1, v + 11, v + 9].filter(x => x >= 1 && x <= 100 && x % 10 !== v % 10);
      return choice(R, `Which is in the same column as ${v}?`, c, R.sample(ds, 3), `Numbers in a column all end in ${v % 10}; they go up by 10.`);
    }
    const rs = rowStart(v), same = R.pick(Array.from({length: 10}, (_, i) => rs + i).filter(x => x !== v));
    const ds = [v + 10, v - 10, rev(v), same + 10].filter(x => x >= 1 && x <= 100 && rowStart(x) !== rs);
    return choice(R, `Which is in the same row as ${v}?`, same, R.sample(ds, 3), `The row with ${v} goes from ${rs} to ${rs + 9}.`); } },
}});

const cmpQ = (R, a, b) => {
  const f = R.int(0, 2), big = Math.max(a, b), small = Math.min(a, b);
  const why = (x, y) => { const [sx, sy] = [String(x), String(y)]; let i = 0; while (sx[i] === sy[i]) i++;
    const place = ['hundreds', 'tens', 'ones'].slice(3 - sx.length)[i]; return `Compare the ${place}: ${sx[i]} ${+sx[i] > +sy[i] ? '>' : '<'} ${sy[i]}.`; };
  if (f === 0) return choiceFixed('Which is greater?', [a, b], a > b ? 0 : 1, `${why(a, b)} So ${big} is greater.`);
  if (f === 1) return choiceFixed('Which is less?', [a, b], a < b ? 0 : 1, `${why(a, b)} So ${small} is less.`);
  if (R.bool(0.2)) return choiceFixed(`Which sign goes in the box? ${a} □ ${a}`, ['<', '=', '>'], 1, `Every digit is the same, so ${a} = ${a}.`);
  return choiceFixed(`Which sign goes in the box? ${a} □ ${b}`, ['<', '=', '>'], a < b ? 0 : 2, `${why(a, b)} So ${a} ${a < b ? '<' : '>'} ${b}.`);
};
E1.skill({ id: 'I.3.12', name: 'Compare using place value', steps: {
  a: { t: '2-digit by tens', g: (R) => { const [t1, t2] = R.distinct(1, 9, 2); return cmpQ(R, 10 * t1 + R.int(0, 9), 10 * t2 + R.int(0, 9)); } },
  b: { t: '2-digit vs 3-digit', g: (R) => {
    const two = R.int(70, 99), three = R.bool(0.7) ? 100 + R.int(0, 29) : 100 * R.int(1, 3) + R.int(0, 19), [a, b] = R.bool() ? [two, three] : [three, two], f = R.int(0, 2);
    const why = `${three} has 3 digits, so it has ${pl(H(three), 'hundred')}. ${two} has only 2 digits: no hundreds.`;
    if (f === 0) return choiceFixed('Which is greater?', [a, b], a > b ? 0 : 1, `${why} So ${three} is greater.`);
    if (f === 1) return choiceFixed('Which is less?', [a, b], a < b ? 0 : 1, `${why} So ${two} is less.`);
    if (R.bool(0.2)) return choiceFixed(`Which sign goes in the box? ${a} □ ${a}`, ['<', '=', '>'], 1, `The two numbers are exactly the same, so ${a} = ${a}.`);
    return choiceFixed(`Which sign goes in the box? ${a} □ ${b}`, ['<', '=', '>'], a < b ? 0 : 2, `${why} So ${a} ${a < b ? '<' : '>'} ${b}.`); } },
  c: { t: 'same leading digit', g: (R) => {
    if (R.bool()) { const t = R.int(1, 9), [o1, o2] = R.distinct(0, 9, 2); return cmpQ(R, 10 * t + o1, 10 * t + o2); }
    const h = R.int(1, 9), [t1, t2] = R.distinct(0, 9, 2); return cmpQ(R, 100 * h + 10 * t1 + R.int(0, 9), 100 * h + 10 * t2 + R.int(0, 9)); } },
  d: { t: 'order a list', g: (R) => {
    let xs;
    if (R.bool()) { const [a, b] = R.distinct(1, 9, 2); xs = [10 * a + b, 10 * b + a, 10 * a + R.int(0, 9), R.int(10, 99)]; }
    else { const h = R.int(1, 8), [a, b] = R.distinct(0, 9, 2); xs = [100 * h + 10 * a + b, 100 * h + 10 * b + a, 100 * (h + 1) + R.int(0, 99), 100 * h + R.int(0, 99)]; }
    xs = [...new Set(xs)].slice(0, 3); if (xs.length < 3) xs.push(Math.max(...xs) + R.int(1, 9));
    const s = xs.slice().sort((p, q) => p - q), J = a => a.join(', ');
    const byOnes = xs.slice().sort((p, q) => O(p) - O(q) || p - q);
    return choice(R, 'Which list goes from least to greatest?', J(s), R.sample([J(s.slice().reverse()), J([s[1], s[0], s[2]]), J([s[0], s[2], s[1]]), J(byOnes)].filter(x => x !== J(s)), 3),
      `Compare the first digits, then the next ones: ${J(s)}.`); } },
}});
})();

/* Era I · Unit I.4 Addition & subtraction */
(function(){ const {num, choice, choiceFixed, tf, words, V, C} = E1;
const M = '−'; // real minus sign for display

/* ---------- pv_ visual helpers ---------- */
// base-ten blocks (same definition as in i3.js; guarded so either file can load first)
V.pv_blocks = V.pv_blocks || function ({h = 0, t = 0, o = 0}, opt = {}) {
  const u = opt.u || (h ? 8 : 12), L = 10 * u, pad = 4, sg = Math.max(18, 2 * u), rg = 6, cg = 4;
  const st = `stroke="${C.ink}" stroke-width="1.2"`, gl = `stroke="#FFFFFF" stroke-width="1" stroke-opacity="0.75"`;
  const flat = (x, y) => { let s = `<rect x="${x}" y="${y}" width="${L}" height="${L}" fill="${C.teal}" ${st}/>`;
    for (let i = 1; i < 10; i++) s += `<line x1="${x + i * u}" y1="${y + 1}" x2="${x + i * u}" y2="${y + L - 1}" ${gl}/><line x1="${x + 1}" y1="${y + i * u}" x2="${x + L - 1}" y2="${y + i * u}" ${gl}/>`;
    return s; };
  const rod = (x, y) => { let s = `<rect x="${x}" y="${y}" width="${u}" height="${L}" fill="${C.blue}" ${st}/>`;
    for (let i = 1; i < 10; i++) s += `<line x1="${x + 1}" y1="${y + i * u}" x2="${x + u - 1}" y2="${y + i * u}" ${gl}/>`;
    return s; };
  const cube = (x, y) => `<rect x="${x}" y="${y}" width="${u}" height="${u}" fill="${C.red}" ${st}/>`;
  const fW = n => n ? n * (L + rg) - rg : 0, rW = t ? t * (u + rg) - rg : 0, oc = Math.ceil(o / 5), oW = o ? oc * (u + cg) - cg : 0;
  const drawTO = (x, y) => { let s = '';
    for (let i = 0; i < t; i++) s += rod(x + i * (u + rg), y);
    x += rW + (t && o ? sg : 0);
    for (let i = 0; i < o; i++) { const c = Math.floor(i / 5), r = i % 5; s += cube(x + c * (u + cg), y + L - (r + 1) * (u + cg) + cg); }
    return s; };
  const parts = [fW(h), rW, oW].filter(w => w > 0), one = parts.reduce((a, b) => a + b, 0) + sg * (parts.length - 1);
  let body = '', W, H;
  if (one + 2 * pad <= (opt.maxW || 380)) {
    let x = pad; for (let i = 0; i < h; i++) body += flat(x + i * (L + rg), pad);
    x += fW(h) + (h && (t || o) ? sg : 0); body += drawTO(x, pad);
    W = Math.max(one, 1) + 2 * pad; H = L + 2 * pad;
  } else {
    const per = 5, rows = Math.ceil(h / per);
    for (let i = 0; i < h; i++) body += flat(pad + (i % per) * (L + rg), pad + Math.floor(i / per) * (L + rg));
    const y = pad + rows * (L + rg) + (t || o ? 8 : -rg);
    if (t || o) body += drawTO(pad, y);
    W = Math.max(fW(Math.min(h, per)), rW + oW + (t && o ? sg : 0)) + 2 * pad; H = y + (t || o ? L : 0) + pad;
  }
  return V.svg(W, H, body, 'base-ten blocks');
};
// story dots. mode 'add': a red then b blue (two groups). 'sub': a dots, the last b faded and crossed out.
// 'part': a filled dots, then b empty circles (a missing part).
V.pv_story = function (a, b, mode = 'add') {
  const r = 11, g = 28, per = 5;
  const grid = (n, x0, fn) => { let s = ''; for (let i = 0; i < n; i++) s += fn(x0 + g / 2 + (i % per) * g, g / 2 + Math.floor(i / per) * g, i); return s; };
  const gw = n => Math.min(n, per) * g, gh = n => Math.max(1, Math.ceil(n / per)) * g;
  if (mode === 'add') {
    const x2 = gw(a) + 26, body = grid(a, 0, (x, y) => V.dot(x, y, r, C.red)) + grid(b, x2, (x, y) => V.dot(x, y, r, C.blue));
    return V.svg(x2 + gw(b), Math.max(gh(a), gh(b)), body, `${a} red and ${b} blue dots`);
  }
  if (mode === 'hide') { // a dots, then a fixed-size cover hiding the missing part (size never shows how many)
    const x0 = a ? gw(a) + 16 : 0, bw = 76, bh = 52;
    const body = grid(a, 0, (x, y) => V.dot(x, y, r, C.red)) + `<rect x="${x0}" y="2" width="${bw}" height="${bh}" rx="10" fill="${C.faint}" stroke="${C.muted}" stroke-width="2"/>` + V.text(x0 + bw / 2, 2 + bh / 2, '?', {size: 24, weight: 700, fill: C.muted});
    return V.svg(x0 + bw + 2, Math.max(gh(a), bh + 4), body, `${a} dots and a hidden group`);
  }
  const n = mode === 'sub' ? a : a + b;
  const body = grid(n, 0, (x, y, i) => {
    if (mode === 'part') return i < a ? V.dot(x, y, r, C.red) : `<circle cx="${x}" cy="${y}" r="${r - 1}" fill="${C.paper}" stroke="${C.muted}" stroke-width="2" stroke-dasharray="4 3"/>`;
    if (i < a - b) return V.dot(x, y, r, C.red);
    const d = r - 3;
    return `<circle cx="${x}" cy="${y}" r="${r}" fill="${C.red}" fill-opacity="0.25"/><path d="M${x - d} ${y - d}L${x + d} ${y + d}M${x + d} ${y - d}L${x - d} ${y + d}" stroke="${C.ink}" stroke-width="2.5" stroke-linecap="round"/>`;
  });
  return V.svg(gw(n), gh(n), body, mode === 'sub' ? `${a} dots, ${b} crossed out` : `${a} dots and ${b} empty circles`);
};
// number bond: whole on top, two parts below. Any value may be '?'.
V.pv_bond = function (whole, a, b) {
  const node = (x, y, v) => { const q = v === '?';
    return `<circle cx="${x}" cy="${y}" r="30" fill="${q ? C.amber : C.paper}" stroke="${C.ink}" stroke-width="2.5"/>` + V.text(x, y, v, {size: 22, weight: q ? 700 : 600}); };
  const body = `<line x1="120" y1="40" x2="52" y2="136" stroke="${C.ink}" stroke-width="2.5"/><line x1="120" y1="40" x2="188" y2="136" stroke="${C.ink}" stroke-width="2.5"/>`
    + node(120, 36, whole) + node(52, 136, a) + node(188, 136, b);
  return V.svg(240, 170, body, 'number bond');
};
// two-pan balance with an expression (string) on each pan. Always drawn level.
V.pv_balance = function (left, right) {
  const pan = (cx, s) => { const q = s === '?';
    return `<line x1="${cx}" y1="44" x2="${cx - 64}" y2="112" stroke="${C.muted}" stroke-width="2"/><line x1="${cx}" y1="44" x2="${cx + 64}" y2="112" stroke="${C.muted}" stroke-width="2"/>`
      + `<path d="M${cx - 72} 112 Q${cx} 140 ${cx + 72} 112 Z" fill="${C.faint}" stroke="${C.ink}" stroke-width="2.5"/>`
      + (q ? `<circle cx="${cx}" cy="96" r="15" fill="${C.amber}"/>` : '') + V.text(cx, 96, s, {size: 22, weight: 700}); };
  const body = `<polygon points="200,40 180,160 220,160" fill="${C.line}"/><rect x="150" y="158" width="100" height="8" rx="3" fill="${C.muted}"/>`
    + `<rect x="${90 - 4}" y="38" width="${220 + 8}" height="8" rx="4" fill="${C.ink}"/><circle cx="200" cy="42" r="6" fill="${C.ink}"/>` + pan(90, left) + pan(310, right);
  return V.svg(400, 170, body, 'balance');
};
// open number line: start, then signed steps (all the same sign). Labels on arcs. Not to scale.
// o.mid: show intermediate landing numbers; o.ask: show '?' at the end; o.arc: false hides arc labels
V.pv_open = function (start, steps, o = {}) {
  const W = o.width || 460, pad = 34, y = 92, back = steps[0] < 0, pts = [start];
  steps.forEach(s => pts.push(pts[pts.length - 1] + s));
  const wts = steps.map(s => 6 + Math.abs(s)), tot = wts.reduce((a, b) => a + b, 0), xs = [0];
  wts.forEach(w => xs.push(xs[xs.length - 1] + w / tot * (W - 2 * pad)));
  const X = i => back ? W - pad - xs[i] : pad + xs[i];
  let body = `<line x1="8" y1="${y}" x2="${W - 8}" y2="${y}" stroke="${C.ink}" stroke-width="2"/>`;
  steps.forEach((s, i) => { const x1 = X(i), x2 = X(i + 1), mx = (x1 + x2) / 2, hh = Math.min(34, 12 + Math.abs(x2 - x1) * 0.3);
    body += `<path d="M${x1} ${y - 6} Q${mx} ${y - 6 - hh * 2} ${x2} ${y - 6}" fill="none" stroke="${C.teal}" stroke-width="2.5"/><circle cx="${x2}" cy="${y - 6}" r="3.5" fill="${C.teal}"/>`;
    if (o.arc !== false) body += V.text(mx, y - 14 - hh, (s > 0 ? '+' : M) + Math.abs(s), {size: 14, fill: C.teal, weight: 700}); });
  pts.forEach((v, i) => { const x = X(i), last = i === pts.length - 1;
    body += `<line x1="${x}" y1="${y - 7}" x2="${x}" y2="${y + 7}" stroke="${C.ink}" stroke-width="2"/>`;
    if (last && o.ask) body += `<circle cx="${x}" cy="${y + 24}" r="12" fill="${C.amber}"/>` + V.text(x, y + 24, '?', {size: 15, weight: 700});
    else if (i === 0 || last || o.mid) body += V.text(x, y + 24, v, {size: 15}); });
  return V.svg(W, y + 42, body, 'open number line');
};
// two pictures with a symbol between them
V.pv_join = function (A, B, sym = '+') {
  const h = s => +/viewBox="0 0 [\d.]+ ([\d.]+)"/.exec(s)[1], H = Math.max(h(A), h(B));
  return V.side([A, V.svg(24, H, V.text(12, H / 2, sym, {size: 28, weight: 700})), B], {gap: 12});
};
const pl = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
const dbl = n => V.stack([V.dots(n, {color: C.red}), V.dots(n, {color: C.blue})], {gap: 6});
const blk2 = n => V.pv_blocks({t: Math.floor(n / 10), o: n % 10});

/* ---------- stories ---------- */
const ADD = [
  (a, b) => [`${a} birds sit on a wire. ${b} more land.`, 'How many birds now?'],
  (a, b) => [`${a} red balls and ${b} blue balls.`, 'How many balls in all?'],
  (a, b) => [`You have ${a} apples. You get ${b} more.`, 'How many apples now?'],
  (a, b) => [`${a} kids play. ${b} more kids join.`, 'How many kids now?'],
  (a, b) => [`${a} fish swim. ${b} more swim in.`, 'How many fish now?'],
  (a, b) => [`${a} cars are parked. ${b} more park.`, 'How many cars now?'],
];
const SUB = [
  (a, b) => [`${a} birds sit on a wire. ${b} fly away.`, 'How many are left?'],
  (a, b) => [`You have ${a} cookies. You eat ${b}.`, 'How many are left?'],
  (a, b) => [`${a} balloons. ${b} pop.`, 'How many are left?'],
  (a, b) => [`${a} frogs sit on a log. ${b} jump off.`, 'How many are left?'],
  (a, b) => [`You have ${a} stickers. You give away ${b}.`, 'How many are left?'],
  (a, b) => [`${a} apples on a tree. ${b} fall off.`, 'How many are left?'],
];
const story = (R, set, a, b) => R.pick(set)(a, b);
const seqUp = (a, k) => Array.from({length: k}, (_, i) => a + i + 1).join(', ');
const seqDn = (a, k) => Array.from({length: k}, (_, i) => a - i - 1).join(', ');
const addSent = (a, b) => `${a} + ${b} = ${a + b}`, subSent = (a, b) => `${a} ${M} ${b} = ${a - b}`;
const pair2 = (R, lo, hi, min = 1) => { const s = R.int(lo, hi), a = R.int(min, s - min); return [a, s - a]; };
const mk10 = (a, b) => { const need = 10 - a; return `${a} + ${need} = 10. ${b} is ${need} + ${b - need}, so 10 + ${b - need} = ${a + b}.`; };

/* ---------- I.4.01 – I.4.05 ---------- */
const joinQ = (R, lo, hi) => { const [a, b] = pair2(R, lo, hi);
  return num(R.pick(['How many dots in all?', 'Red and blue together: how many?']), a + b, `Count all of them: ${a} red and ${b} blue make ${a + b}.`, {visual: V.pv_story(a, b)}); };
E1.skill({ id: 'I.4.01', name: 'Put together', steps: {
  a: { t: 'join two groups to 5', g: (R) => joinQ(R, 2, 5) },
  b: { t: 'to 10', g: (R) => joinQ(R, 6, 10) },
  c: { t: 'count all', g: (R) => {
    const [a, b] = pair2(R, 5, 10), cols = R.shuffle([...Array(a).fill(C.red), ...Array(b).fill(C.blue)]);
    return num(`${a} red and ${b} blue. How many dots in all?`, a + b, `Count every dot once, red and blue: ${a + b}.`,
      {visual: V.dots(a + b, {layout: 'scatter', color: cols, R, w: 300, h: 150})}); } },
  d: { t: 'the plus sign', g: (R) => {
    const [a, b] = pair2(R, 3, 10), s = a + b, pic = V.pv_story(a, b);
    if (R.bool()) return num(`${a} + ${b} = ?`, s, `+ means put together. ${a} and ${b} more make ${s}.`, {visual: pic});
    return choice(R, 'Which matches the picture?', addSent(a, b), [a >= b ? subSent(a, b) : subSent(b, a), `${a} + ${b} = ${s + 1}`, addSent(s, b)],
      `There ${a === 1 ? 'is' : 'are'} ${a} red and ${b} blue: ${addSent(a, b)}.`, {visual: pic}); } },
}});

const leftQ = (R, lo, hi) => { const n = R.int(lo, hi), k = R.int(1, n);
  return num(`${n} dots. ${k} ${k === 1 ? 'is' : 'are'} crossed out. ${R.pick(['How many are left?', 'How many are not crossed out?'])}`, n - k, `Count the dots not crossed out: ${n} take away ${k} is ${n - k}.`, {visual: V.pv_story(n, k, 'sub')}); };
E1.skill({ id: 'I.4.02', name: 'Take away', steps: {
  a: { t: 'take away within 5', g: (R) => leftQ(R, 2, 5) },
  b: { t: 'within 10', g: (R) => leftQ(R, 6, 10) },
  c: { t: "count what's left", g: (R) => {
    const n = R.int(4, 10), k = R.int(2, n - 1), [s, q] = story(R, SUB, n, k);
    return num(`${s} ${q}`, n - k, `Cross out ${k} of the ${n}. Count the rest: ${n - k}.`, {visual: V.pv_story(n, k, 'sub')}); } },
  d: { t: 'the minus sign', g: (R) => {
    const n = R.int(3, 10), k = R.int(1, n - 1), pic = V.pv_story(n, k, 'sub');
    if (R.bool()) return num(`${n} ${M} ${k} = ?`, n - k, `${M} means take away. ${n} take away ${k} leaves ${n - k}.`, {visual: pic});
    return choice(R, 'Which matches the picture?', subSent(n, k), [addSent(n, k), subSent(n, k + 1), `${n} ${M} ${k} = ${n - k + 1}`],
      `There were ${n} and ${k} ${k === 1 ? 'is' : 'are'} crossed out: ${subSent(n, k)}.`, {visual: pic}); } },
}});

E1.skill({ id: 'I.4.03', name: 'Addition stories', steps: {
  a: { t: 'act it out', g: (R) => {
    const [a, b] = pair2(R, 4, 10, 2), [s, q] = story(R, ADD, a, b);
    return num(`${s} ${q}`, a + b, `Start with ${a}, then count on ${b}: ${seqUp(a, b)}.`, {visual: V.pv_story(a, b)}); } },
  b: { t: 'draw it', g: (R) => {
    const [a, b] = pair2(R, 4, 10, 2), [s] = story(R, ADD, a, b);
    return choice(R, `${s} Which picture shows it?`, V.pv_story(a, b), [V.pv_story(a, b + 1), V.pv_story(a - 1, b), V.pv_story(a + b, b, 'sub')],
      `Draw ${a} and then ${b} more: ${a} red and ${b} blue.`); } },
  c: { t: 'write the number sentence', g: (R) => {
    const [a, b] = pair2(R, 4, 10, 2), [s] = story(R, ADD, a, b);
    return choice(R, `${s} Pick the number sentence.`, addSent(a, b), [a > b ? subSent(a, b) : subSent(b, a), addSent(a + b, b), `${a} + ${b} = ${a + b - 1}`],
      `${a} and ${b} more is ${addSent(a, b)}.`); } },
  d: { t: 'solve without pictures', g: (R) => {
    const [a, b] = pair2(R, 8, 20, 2), [s, q] = story(R, ADD, a, b);
    return num(`${s} ${q}`, a + b, `${addSent(a, b)}.`); } },
}});

E1.skill({ id: 'I.4.04', name: 'Subtraction stories', steps: {
  a: { t: 'act it out', g: (R) => {
    const n = R.int(4, 10), k = R.int(2, n - 1), [s, q] = story(R, SUB, n, k);
    return num(`${s} ${q}`, n - k, `Start with ${n}. Take away ${k}: count back ${seqDn(n, k)}.`, {visual: V.pv_story(n, k, 'sub')}); } },
  b: { t: 'draw it', g: (R) => {
    const n = R.int(4, 10), k = R.int(2, n - 1), [s] = story(R, SUB, n, k);
    return choice(R, `${s} Which picture shows it?`, V.pv_story(n, k, 'sub'), [V.pv_story(n, k === n - 1 ? k - 1 : k + 1, 'sub'), V.pv_story(n - 1, k, 'sub'), V.pv_story(n, k)],
      `Draw ${n} dots and cross out ${k}.`); } },
  c: { t: 'write the number sentence', g: (R) => {
    const n = R.int(4, 10), k = R.int(2, n - 1), [s] = story(R, SUB, n, k);
    return choice(R, `${s} Pick the number sentence.`, subSent(n, k), [addSent(n, k), `${n} ${M} ${k} = ${n - k + 1}`, subSent(n + k, k)],
      `Start with ${n}, take away ${k}: ${subSent(n, k)}.`); } },
  d: { t: 'solve without pictures', g: (R) => {
    const n = R.int(8, 20), k = R.int(2, n - 2), [s, q] = story(R, SUB, n, k);
    return num(`${s} ${q}`, n - k, `${subSent(n, k)}.`); } },
}});

E1.skill({ id: 'I.4.05', name: 'Part–part–whole', steps: {
  a: { t: 'two parts make a whole', g: (R) => {
    const w = R.int(4, 10), a = R.int(1, w - 1), b = w - a;
    return choice(R, `Which two parts make ${w}?`, `${a} and ${b}`, [`${a} and ${b + 1}`, `${a + 1} and ${b + 1}`, `${a} and ${b - 1}`, `${a - 1} and ${b}`].filter(s => !/-/.test(s)).slice(0, 3),
      `${a} + ${b} = ${w}, so ${a} and ${b} make ${w}.`, {visual: V.dots(w, {layout: 'grid', color: C.teal})}); } },
  b: { t: 'find the whole', g: (R) => {
    const [a, b] = pair2(R, 4, 10);
    return num(`One part is ${a}. The other part is ${b}. What is the whole?`, a + b, `Put the parts together: ${addSent(a, b)}.`, {visual: V.pv_story(a, b)}); } },
  c: { t: 'find a missing part', g: (R) => {
    const w = R.int(4, 10), a = R.int(1, w - 1);
    return num(`The whole is ${w}. One part is ${a}. What is the other part?`, w - a, `${a} + ? = ${w}. Count on from ${a} to ${w}: ${seqUp(a, w - a)}. That is ${w - a}.`, {visual: V.pv_story(a, w - a, 'hide')}); } },
  d: { t: 'the part–whole diagram', g: (R) => {
    const w = R.int(6, 20), a = R.int(1, w - 1), b = w - a, at = R.int(0, 2);
    const ans = [w, a, b][at], vis = V.pv_bond(at === 0 ? '?' : w, at === 1 ? '?' : a, at === 2 ? '?' : b);
    return num('What number goes in the ? circle?', ans, at === 0 ? `The whole is both parts together: ${addSent(a, b)}.` : `Whole ${M} known part = missing part: ${w} ${M} ${at === 1 ? b : a} = ${ans}.`, {visual: vis}); } },
}});

/* ---------- number bonds ---------- */
const bondQ = (R, w) => {
  const a = R.bool(0.8) ? R.int(1, w - 1) : R.pick([0, w]), b = w - a, f = R.int(0, 2);
  if (f === 0) { const left = R.bool();
    return num(`What goes in the ? circle?`, left ? a : b, `${a} and ${b} make ${w}. ${w} ${M} ${left ? b : a} = ${left ? a : b}.`, {visual: V.pv_bond(w, left ? '?' : a, left ? b : '?')}); }
  if (f === 1) return num(`${a} + ? = ${w}`, b, `Count on from ${a} to ${w}: that is ${b}.`, {visual: V.pv_story(a, b, 'hide')});
  return choice(R, `Which pair makes ${w}?`, `${a} and ${b}`, [`${a} and ${b + 1}`, `${a + 1} and ${b + 1}`, b > 0 ? `${a} and ${b - 1}` : `${a + 1} and ${b + 2}`], `${a} + ${b} = ${w}.`);
};
const ways5 = [[0, 5], [1, 4], [2, 3], [3, 2], [4, 1], [5, 0]];
E1.skill({ id: 'I.4.06', name: 'Number bonds to 5', steps: {
  a: { t: 'ways to make 3', g: (R) => bondQ(R, 3) },
  b: { t: '4', g: (R) => bondQ(R, 4) },
  c: { t: '5', g: (R) => bondQ(R, 5) },
  d: { t: 'all ways to make 5', g: (R) => {
    if (R.bool()) { const i = R.int(0, 5), right = R.bool();
      const list = ways5.map(([x, y], j) => j === i ? (right ? `${x} + ?` : `? + ${y}`) : `${x} + ${y}`).join(', ');
      return num(`Ways to make 5: ${list}`, right ? ways5[i][1] : ways5[i][0], `${ways5[i][0]} + ${ways5[i][1]} = 5.`); }
    const bad = R.pick([[1, 3], [2, 2], [3, 3], [4, 2], [0, 4], [1, 5], [2, 4], [3, 1]]), good = R.sample(ways5, 3).map(([x, y]) => `${x} and ${y}`);
    return choice(R, 'Which does NOT make 5?', `${bad[0]} and ${bad[1]}`, good, `${bad[0]} + ${bad[1]} = ${bad[0] + bad[1]}, not 5.`); } },
}});

E1.skill({ id: 'I.4.07', name: 'Number bonds to 10', steps: {
  a: { t: '6', g: (R) => bondQ(R, 6) },
  b: { t: '7 and 8', g: (R) => bondQ(R, R.pick([7, 8])) },
  c: { t: '9 and 10', g: (R) => bondQ(R, R.pick([9, 10])) },
  d: { t: 'the missing partner of 10', g: (R) => {
    const a = R.int(1, 9), f = R.int(0, 2), p = [`${a} + ? = 10`, `? + ${a} = 10`, `10 = ${a} + ?`][f];
    return num(p, 10 - a, `${a} and ${10 - a} are partners: ${a} + ${10 - a} = 10.`); } },
}});

/* ---------- 0 and 1, doubles, near doubles, make ten ---------- */
// + 0, + 1, − 0, − 1 (from the old "Adding and taking 0 and 1" skill; now mixed into I.4.11a and I.4.13a)
const plus0 = (R) => { const n = R.int(0, 20); return num(R.bool() ? `${n} + 0 = ?` : `0 + ${n} = ?`, n, `Adding 0 adds nothing. It stays ${n}.`); };
const plus1 = (R) => { const n = R.int(0, 19); return num(R.bool() ? `${n} + 1 = ?` : `1 + ${n} = ?`, n + 1, `+ 1 is the next number: ${n + 1}.`); };
const minus0 = (R) => { const n = R.int(0, 20);
  return R.bool(0.7) ? num(`${n} ${M} 0 = ?`, n, `Taking away 0 takes nothing. It stays ${n}.`) : num(`${n} ${M} ? = ${n}`, 0, `Nothing was taken away, so the missing number is 0.`); };
const minus1 = (R) => { const n = R.int(1, 20);
  return R.bool(0.7) ? num(`${n} ${M} 1 = ?`, n - 1, `${M} 1 is the number just before: ${n - 1}.`) : num(`${n} ${M} ? = ${n - 1}`, 1, `${n - 1} is just before ${n}, so 1 was taken away.`); };

const doubleQ = (R, lo, hi) => { const n = R.int(lo, hi), f = R.int(0, 2);
  if (f === 0) return num(`${n} + ${n} = ?`, 2 * n, `Double ${n}: ${n} + ${n} = ${2 * n}.`, {visual: dbl(n)});
  if (f === 1) return num(`Double ${n} is ?`, 2 * n, `Double means two of the same: ${n} + ${n} = ${2 * n}.`);
  if (R.bool()) return num('Two rows are the same. How many dots?', 2 * n, `${n} in each row: ${n} + ${n} = ${2 * n}.`, {visual: dbl(n)});
  return n <= 5 ? num('Both dice match. How many dots in all?', 2 * n, `Double ${n}: ${n} + ${n} = ${2 * n}.`, {visual: V.side([V.dots(n, {layout: 'dice'}), V.dots(n, {layout: 'dice'})])})
    : num('How many counters in all?', 2 * n, `${n} red and ${n} blue: double ${n} is ${2 * n}.`, {visual: V.frame(n, {n2: n})}); };
const DSTORY = [
  n => `Sam has ${n} cars. Ana has ${n} too. How many cars in all?`,
  n => `${n} red socks and ${n} blue socks. How many socks?`,
  n => `A box has 2 rows of ${n} eggs. How many eggs?`,
  n => `You read ${n} pages today and ${n} tomorrow. How many pages?`,
  n => `2 kids each have ${n} shells. How many shells?`,
];
E1.skill({ id: 'I.4.08', name: 'Doubles', steps: {
  a: { t: 'to 5 + 5', g: (R) => doubleQ(R, 1, 5) },
  b: { t: 'to 10 + 10', g: (R) => doubleQ(R, 6, 10) },
  c: { t: 'from memory', g: (R) => {
    const n = R.int(1, 10), f = R.int(0, 2);
    if (f === 0) return num(`${n} + ${n} = ?`, 2 * n, `Double ${n} is ${2 * n}.`);
    if (f === 1) return num(`${2 * n} is double what?`, n, `${n} + ${n} = ${2 * n}.`);
    return choice(R, `Which is a double?`, `${n} + ${n}`, [`${n} + ${n + 1}`, `${n + 1} + ${n + 2}`, `${n} + ${n + 2}`], `A double adds a number to itself: ${n} + ${n}.`); } },
  d: { t: 'doubles stories', g: (R) => {
    const n = R.int(2, 10); return num(R.pick(DSTORY)(n), 2 * n, `Two groups of ${n} is a double: ${n} + ${n} = ${2 * n}.`); } },
}});

const nearQ = (R, n, plus) => { const a = n, b = plus ? n + 1 : n - 1, [x, y] = R.bool() ? [a, b] : [b, a];
  return num(`${R.bool() ? 'Use a double. ' : ''}${x} + ${y} = ?`, a + b, `${n} + ${n} = ${2 * n}, and 1 ${plus ? 'more' : 'less'} is ${a + b}.`); };
E1.skill({ id: 'I.4.09', name: 'Near doubles', steps: {
  a: { t: 'double plus one', g: (R) => nearQ(R, R.int(1, 9), true) },
  b: { t: 'double minus one', g: (R) => nearQ(R, R.int(2, 10), false) },
  c: { t: 'pick the right double', g: (R) => {
    const m = R.int(2, 9), [x, y] = R.bool() ? [m, m + 1] : [m + 1, m], useM = R.bool(), d = useM ? m : m + 1;
    const ds = (useM ? [m - 1, m + 2, m + 3] : [m - 1, m + 2, m + 3]).filter(v => v >= 1).map(v => `${v} + ${v}`);
    return choice(R, `Which double helps with ${x} + ${y}?`, `${d} + ${d}`, ds.slice(0, 3),
      `${x} + ${y} is next to ${d} + ${d} = ${2 * d}. Then ${useM ? 'add' : 'take away'} 1: ${x + y}.`); } },
  d: { t: 'mixed', g: (R) => {
    const k = R.int(0, 2); if (k === 0) { const n = R.int(3, 10); return num(`${n} + ${n} = ?`, 2 * n, `It is a double: ${2 * n}.`); }
    return nearQ(R, R.int(3, 9), k === 1); } },
}});

const tf2 = (a, b) => V.stack([V.frame(a, {frames: 1}), V.frame(b, {frames: 1, color: C.blue})], {gap: 12});
E1.skill({ id: 'I.4.10', name: 'Make ten', steps: {
  a: { t: 'split to make ten (8 + 5 = 8 + 2 + 3)', g: (R) => {
    const a = R.int(6, 9), b = R.int(11 - a, 9), need = 10 - a, rest = b - need, vis = {visual: tf2(a, b)};
    const why = `${a} needs ${need} to make 10. Split ${b} into ${need} and ${rest}: ${a} + ${need} = 10, then 10 + ${rest} = ${a + b}.`;
    if (R.bool()) return num(`Split ${b} to make ten. ${a} + ${b} = ${a} + ? + ?`, [{label: `${a} +`, ans: need}, {label: '+', ans: rest}], why, vis);
    const ds = [[need + 1, rest - 1], [need - 1, rest + 1], [need, rest + 1]].filter(([x, y]) => x >= 1 && y >= 1).map(([x, y]) => `${a} + ${x} + ${y}`);
    return choice(R, `${a} + ${b}: which split makes ten first?`, `${a} + ${need} + ${rest}`, ds, why, vis); } },
  b: { t: '9 + n', g: (R) => {
    const n = R.int(2, 9), vis = {visual: tf2(9, n)};
    if (R.bool()) return num(`9 + ${n} = 10 + ?`, n - 1, `Move 1 from ${n} to fill the ten: 9 + 1 = 10, and ${n - 1} is left.`, vis);
    return num(R.bool() ? `9 + ${n} = ?` : `${n} + 9 = ?`, 9 + n, mk10(9, n), vis); } },
  c: { t: '8 + n', g: (R) => {
    const n = R.int(3, 9), vis = {visual: tf2(8, n)};
    if (R.bool()) return num(`8 + ${n} = 10 + ?`, n - 2, `Move 2 from ${n} to fill the ten: 8 + 2 = 10, and ${n - 2} is left.`, vis);
    return num(R.bool() ? `8 + ${n} = ?` : `${n} + 8 = ?`, 8 + n, mk10(8, n), vis); } },
  d: { t: '7 + n and beyond', g: (R) => {
    const a = R.pick([6, 7, 7, 8, 9]), b = R.int(11 - a, 9);
    if (R.bool(0.3)) return num(`${a} + ${b} = 10 + ?`, a + b - 10, mk10(a, b));
    return num(R.bool() ? `${a} + ${b} = ?` : `${b} + ${a} = ?`, a + b, mk10(a, b)); } },
}});

/* ---------- counting strategies ---------- */
const hopLine = (a, k, back) => { const e = back ? a - k : a + k, lo = Math.max(0, Math.min(a, e) - 2), hi = Math.max(a, e) + 2;
  return V.numline({from: lo, to: hi, jumps: Array.from({length: k}, (_, i) => back ? [a - i, a - i - 1] : [a + i, a + i + 1]), ask: e, labels: Array.from({length: hi - lo + 1}, (_, i) => lo + i).filter(v => back ? v >= a : v <= a), width: Math.min(560, (hi - lo) * 36 + 44)}); };
const onQ = (R, a, k, pic = true) => num(`${a} + ${k} = ?`, a + k, `Start at ${a}. Count on ${k}: ${seqUp(a, k)}.`, pic ? {visual: hopLine(a, k)} : {});
const backQ = (R, a, k, pic = true) => num(`${a} ${M} ${k} = ?`, a - k, `Start at ${a}. Count back ${k}: ${seqDn(a, k)}.`, pic ? {visual: hopLine(a, k, true)} : {});
E1.skill({ id: 'I.4.11', name: 'Count on to add', steps: {
  a: { t: '+ 0, + 1 and + 2', g: (R) => { const f = R.int(0, 4); return f === 0 ? plus0(R) : f === 1 ? plus1(R) : onQ(R, R.int(1, 10), R.int(1, 2)); } },
  b: { t: '+ 3', g: (R) => { const a = R.int(4, 17);
    return R.bool() ? onQ(R, a, 3) : num(`3 + ${a} = ?`, a + 3, `Start at the bigger number, ${a}. Count on 3: ${seqUp(a, 3)}.`, {visual: hopLine(a, 3)}); } },
  c: { t: 'start from the bigger number', g: (R) => {
    const s = R.int(1, 3), b = R.int(5, 12);
    if (R.bool()) { const sw = R.bool(); return choiceFixed(`${sw ? b : s} + ${sw ? s : b}: which number do you start from?`, sw ? [b, s] : [s, b], sw ? 0 : 1, `Start from the bigger number, ${b}, and count on ${s}: ${seqUp(b, s)}.`); }
    return num(`${s} + ${b} = ?`, s + b, `Start at the bigger number, ${b}. Count on ${s}: ${seqUp(b, s)}.`); } },
  d: { t: 'within 20', g: (R) => {
    const s = R.int(2, 4), b = R.int(10, 20 - s);
    if (R.bool()) return onQ(R, b, s, R.bool());
    return num(`${s} + ${b} = ?`, s + b, `Start at ${b}. Count on ${s}: ${seqUp(b, s)}.`); } },
}});

E1.skill({ id: 'I.4.12', name: 'Add in any order', steps: {
  a: { t: '3 + 5 = 5 + 3', g: (R) => {
    const [a, b] = R.distinct(1, 9, 2);
    if (R.bool()) return num(`${a} + ${b} = ${b} + ?`, a, `You can add in any order: ${a} + ${b} = ${b} + ${a}.`);
    const ok = R.bool(), c = ok ? a : R.pick([a + 1, a - 1 || a + 2]);
    return tf(`${a} + ${b} = ${b} + ${c}`, ok, ok ? `Same numbers, other order: both are ${a + b}.` : `${a} + ${b} = ${a + b} but ${b} + ${c} = ${b + c}.`); } },
  b: { t: 'three numbers', g: (R) => {
    const a = R.int(1, 9), b = R.int(1, 9), c = R.int(1, Math.min(9, 20 - a - b) || 1);
    return num(`${a} + ${b} + ${c} = ?`, a + b + c, `${a} + ${b} = ${a + b}, then ${a + b} + ${c} = ${a + b + c}.`); } },
  c: { t: 'make ten first', g: (R) => {
    const x = R.int(1, 9); let y = R.int(1, 9); while (y === x || y === 10 - x) y = y % 9 + 1;
    const [p, q, r] = R.bool() ? [x, y, 10 - x] : [x, 10 - x, y];
    if (R.bool(0.35)) return choice(R, `${p} + ${q} + ${r}: which two make 10?`, `${x} and ${10 - x}`, [`${x} and ${y}`, `${y} and ${10 - x}`], `${x} + ${10 - x} = 10.`);
    return num(`${p} + ${q} + ${r} = ?`, 10 + y, `Make ten first: ${x} + ${10 - x} = 10. Then 10 + ${y} = ${10 + y}.`); } },
  d: { t: 'look for doubles (4 + 7 + 4)', g: (R) => {
    const x = R.int(2, 8), y = R.pick(Array.from({length: Math.min(9, 20 - 2 * x)}, (_, i) => i + 1).filter(v => v !== x && v !== 10 - x));
    const [p, q, r] = R.pick([[x, y, x], [x, y, x], [y, x, x], [x, x, y]]), t = 2 * x + y;
    const why = `Spot the double: ${x} + ${x} = ${2 * x}. Then ${2 * x} + ${y} = ${t}.`;
    if (R.bool(0.35)) return choice(R, `${p} + ${q} + ${r}: which is the easiest first step?`, `${x} + ${x} = ${2 * x}`, [`${x} + ${y} = ${x + y}`], why);
    return num(`${p} + ${q} + ${r} = ?`, t, why); } },
}});

E1.skill({ id: 'I.4.13', name: 'Subtract by counting back', steps: {
  a: { t: '− 0, − 1 and − 2', g: (R) => { const f = R.int(0, 4); return f === 0 ? minus0(R) : f === 1 ? minus1(R) : backQ(R, R.int(3, 14), R.int(1, 2)); } },
  b: { t: '− 3', g: (R) => { const a = R.int(4, 15);
    return R.bool() ? backQ(R, a, 3) : num(`Count back 3 from ${a}. Where do you land?`, a - 3, `${a} → ${seqDn(a, 3)}. You land on ${a - 3}.`, {visual: hopLine(a, 3, true)}); } },
  c: { t: 'within 20', g: (R) => backQ(R, R.int(12, 20), R.int(2, 4), R.bool()) },
  d: { t: 'when counting back is easiest', g: (R) => {
    const a = R.int(11, 20), k = R.int(1, 3), j = R.int(1, 3), mid = R.int(5, a - 5);
    return choice(R, 'Which is easiest to solve by counting back?', `${a} ${M} ${k}`, [`${a} ${M} ${a - j}`, `${a} ${M} ${mid === k ? mid + 1 : mid}`],
      `Counting back is easy when you take away a small number, like ${k}: ${seqDn(a, k)}.`); } },
}});

E1.skill({ id: 'I.4.14', name: 'Subtract by counting up', steps: {
  a: { t: 'think addition', g: (R) => {
    const a = R.int(4, 10), b = R.int(1, a - 1);
    return num(`Think addition to solve ${a} ${M} ${b}.`, [{label: `${b} + ? = ${a}`, ans: a - b}, {label: `${a} ${M} ${b} =`, ans: a - b}], `${b} + ${a - b} = ${a}, so ${a} ${M} ${b} = ${a - b}.`); } },
  b: { t: 'up to 10', g: (R) => {
    const a = R.int(6, 10), b = R.int(Math.max(2, a - 4), a - 1);
    return num(`${a} ${M} ${b} = ?  Count up from ${b}.`, a - b, `From ${b} up to ${a}: ${seqUp(b, a - b)}. That is ${a - b} step${a - b === 1 ? '' : 's'}.`,
      {visual: V.numline({from: Math.max(0, b - 2), to: Math.min(12, a + 2), marks: [b, a], width: 360})}); } },
  c: { t: 'up through 10', g: (R) => {
    const b = R.int(6, 9), a = R.int(11, b + 9);
    return num(`${a} ${M} ${b} = ?  Count up from ${b}.`, a - b, `${b} to 10 is ${10 - b}. 10 to ${a} is ${a - 10}. ${10 - b} + ${a - 10} = ${a - b}.`,
      {visual: V.pv_open(b, [10 - b, a - 10], {mid: true, arc: false})}); } },
  d: { t: 'choose a strategy', g: (R) => {
    const a = R.int(11, 20);
    if (R.bool()) { const k = R.int(1, 3); return choiceFixed(`${a} ${M} ${k}: count back or count up?`, ['Count back', 'Count up'], 0, `${k} is small, so count back ${k}: ${seqDn(a, k)}. Answer ${a - k}.`); }
    const d = R.int(1, 3), b = a - d; return choiceFixed(`${a} ${M} ${b}: count back or count up?`, ['Count back', 'Count up'], 1, `${b} is close to ${a}, so count up: ${seqUp(b, d)}. Answer ${d}.`); } },
}});

const tenFull = () => V.frame(10, {frames: 1});
E1.skill({ id: 'I.4.15', name: 'Subtract through ten', steps: {
  a: { t: '10 minus a number', g: (R) => {
    const n = R.int(1, 9), f = R.int(0, 2), why = `${n} and ${10 - n} make 10, so 10 ${M} ${n} = ${10 - n}.`;
    if (f === 0) return num(`10 ${M} ${n} = ?`, 10 - n, why, {visual: tenFull()});
    if (f === 1) return num(`10 ${M} ? = ${10 - n}`, n, why, {visual: tenFull()});
    return num(`The ten-frame is full. Take away ${n}. How many are left?`, 10 - n, why, {visual: tenFull()}); } },
  b: { t: 'take away to reach 10 (14 − 4)', g: (R) => {
    const t = R.int(11, 19), o = t - 10, why = `${t} is 10 and ${o}. Take away the ${o} and 10 is left.`;
    if (R.bool()) return num(`${t} ${M} ${o} = ?`, 10, why, R.bool() ? {visual: V.frame(10, {n2: o, frames: 2})} : {});
    return num(`${t} ${M} ? = 10`, o, why); } },
  c: { t: 'take away across 10 (14 − 6 = 14 − 4 − 2)', g: (R) => {
    const t = R.int(11, 18), o = t - 10, n = R.int(o + 1, 9), rest = n - o, x = t - n;
    const why = `${t} ${M} ${o} = 10. ${n} is ${o} and ${rest}, so take ${rest} more: 10 ${M} ${rest} = ${x}.`;
    if (R.bool()) return num(`${t} ${M} ${n} = ?  Go through 10.`, x, why, {visual: V.pv_open(t, [-o, -rest], {mid: true, ask: true})});
    return num(`Get to 10 first: ${t} ${M} ${n} = ${t} ${M} ${o} ${M} ?`, [{label: '?', ans: rest}, {label: `${t} ${M} ${n} =`, ans: x}], why); } },
  d: { t: 'choose a strategy', g: (R) => {
    const opts = ['Count back', 'Count up', 'Go through 10'], k = R.int(0, 2);
    if (k === 0) { const a = R.int(12, 19), n = R.int(1, Math.min(2, a - 10));
      return choiceFixed(`${a} ${M} ${n}: which way is easiest?`, opts, 0, `${n} is small, so count back: ${seqDn(a, n)}. Answer ${a - n}.`); }
    if (k === 1) { const a = R.int(13, 19), d = R.int(1, Math.min(3, a - 10)), b = a - d;
      return choiceFixed(`${a} ${M} ${b}: which way is easiest?`, opts, 1, `${b} is close to ${a}, so count up: ${seqUp(b, d)}. Answer ${d}.`); }
    const a = R.int(12, 18), o = a - 10, n = R.int(Math.max(6, o + 1), Math.min(9, a - 6));
    return choiceFixed(`${a} ${M} ${n}: which way is easiest?`, opts, 2, `${n} is big and not close to ${a}. Go through 10: ${a} ${M} ${o} = 10, then 10 ${M} ${n - o} = ${a - n}.`); } },
}});

/* ---------- families, missing addends, equality ---------- */
const trip = R => { const [a, b] = R.distinct(1, 9, 2); return [a, b, a + b]; };
E1.skill({ id: 'I.4.16', name: 'Fact families', steps: {
  a: { t: 'related additions', g: (R) => {
    const [a, b, s] = trip(R);
    if (R.bool()) return num(`${addSent(a, b)}. So ${b} + ${a} = ?`, s, `Switch the order, same total: ${s}.`);
    return choice(R, `Which is in the same family as ${addSent(a, b)}?`, addSent(b, a), [addSent(a, s), addSent(b, s), `${a} + ${b} = ${s + 1}`], `The family uses ${a}, ${b} and ${s}: ${addSent(b, a)}.`); } },
  b: { t: 'related subtractions', g: (R) => {
    const [a, b, s] = trip(R);
    if (R.bool()) return num(`${addSent(a, b)}. So ${s} ${M} ${a} = ?`, b, `Take one part away from ${s} to get the other part: ${b}.`);
    return choice(R, `Which is in the same family as ${addSent(a, b)}?`, subSent(s, b), [subSent(s + b, b), `${s} ${M} ${b} = ${a + 1}`, addSent(s, a)], `${s} take away ${b} leaves ${a}.`); } },
  c: { t: 'write a family', g: (R) => {
    const [a, b, s] = trip(R);
    return num(`Finish the fact family for ${a}, ${b} and ${s}.`, [{label: `${a} + ${b} =`, ans: s}, {label: `${b} + ${a} =`, ans: s}, {label: `${s} ${M} ${a} =`, ans: b}, {label: `${s} ${M} ${b} =`, ans: a}],
      `Adding the parts gives ${s}. Taking one part from ${s} leaves the other.`); } },
  d: { t: 'use a family to solve', g: (R) => {
    const [a, b, s] = trip(R), f = R.int(0, 2);
    if (f === 0) return num(`${addSent(a, b)}. So ? ${M} ${a} = ${b}`, s, `The whole is ${s}: ${s} ${M} ${a} = ${b}.`);
    if (f === 1) return num(`${addSent(a, b)}. So ${s} ${M} ? = ${a}`, b, `Take ${b} from ${s} to leave ${a}.`);
    return num(`${subSent(s, a)}. So ${a} + ? = ${s}`, b, `Same family: ${a} + ${b} = ${s}.`); } },
}});

E1.skill({ id: 'I.4.17', name: 'Missing addends', steps: {
  a: { t: '3 + ? = 5', g: (R) => { const w = R.int(2, 5), a = R.int(1, w - 1);
    return num(R.bool() ? `${a} + ? = ${w}` : `You have ${a}. How many more to make ${w}?`, w - a, `Count on from ${a} to ${w}: that is ${w - a} more.`, {visual: V.pv_story(a, w - a, 'hide')}); } },
  b: { t: 'within 10', g: (R) => { const w = R.int(5, 10), a = R.int(1, w - 1);
    return num(`${a} + ? = ${w}`, w - a, `${w} ${M} ${a} = ${w - a}, so ${a} + ${w - a} = ${w}.`, R.bool() ? {visual: V.pv_story(a, w - a, 'hide')} : {}); } },
  c: { t: 'within 20', g: (R) => { const w = R.int(11, 20), a = R.int(2, w - 2);
    return num(`${a} + ? = ${w}`, w - a, `${w} ${M} ${a} = ${w - a}, so ${a} + ${w - a} = ${w}.`); } },
  d: { t: '? + 4 = 9', g: (R) => { const w = R.int(8, 20), b = R.int(2, w - 2);
    return num(`? + ${b} = ${w}`, w - b, `${w} ${M} ${b} = ${w - b}. Check: ${w - b} + ${b} = ${w}.`); } },
}});

E1.skill({ id: 'I.4.18', name: 'The equal sign as a balance', steps: {
  a: { t: '5 = 5', g: (R) => {
    const n = R.int(1, 20);
    if (R.bool()) return num(`Make it balance: ${n} = ?`, n, `= means the same as. Both sides must be ${n}.`, {visual: V.pv_balance(String(n), '?')});
    const ok = R.bool(), m = ok ? n : n + R.pick([1, 2]);
    return tf(`${n} = ${m}`, ok, ok ? 'Both sides are the same.' : `${n} and ${m} are not the same.`); } },
  b: { t: '5 = 2 + 3', g: (R) => {
    const s = R.int(3, 12), a = R.int(1, s - 1), b = s - a;
    if (R.bool()) return num(`Make it balance: ${s} = ${a} + ?`, b, `${a} + ${b} = ${s}, so both sides are ${s}.`, {visual: V.pv_balance(String(s), `${a} + ?`)});
    return num(`Make it balance: ? = ${a} + ${b}`, s, `${a} + ${b} = ${s}, so the left side is ${s}.`, {visual: V.pv_balance('?', `${a} + ${b}`)}); } },
  c: { t: '4 + 1 = 3 + 2', g: (R) => {
    const s = R.int(4, 15), a = R.int(1, s - 1), c = R.pick([...Array(s - 1).keys()].map(i => i + 1).filter(v => v !== a));
    return num(`Make it balance: ${a} + ${s - a} = ${c} + ?`, s - c, `The left side is ${s}. ${c} + ${s - c} = ${s} too.`, {visual: V.pv_balance(`${a} + ${s - a}`, `${c} + ?`)}); } },
  d: { t: 'true or false equations', g: (R) => {
    const s = R.int(4, 18), a = R.int(1, s - 1), c = R.int(1, s - 1), ok = R.bool(), off = ok ? 0 : R.pick([1, -1]), f = R.int(0, 3);
    let eq, L, Rt;
    if (f === 0) { Rt = s + off; eq = `${a} + ${s - a} = ${c} + ${Rt - c}`; if (Rt - c < 0) { Rt = s + 1; eq = `${a} + ${s - a} = ${c} + ${Rt - c}`; } L = s; }
    else if (f === 1) { Rt = s + off; eq = `${Rt} = ${a} + ${s - a}`; L = s; }
    else if (f === 2) { Rt = a + off; eq = `${s} ${M} ${s - a} = ${Rt}`; L = a; }
    else { Rt = s + off; eq = `${a} + ${s - a} = ${s - a} + ${a + off}`; L = s; }
    const truth = L === Rt;
    return tf(eq, truth, truth ? `Both sides equal ${L}.` : `One side is ${L}, the other is ${Rt}. They are not the same.`); } },
}});

/* ---------- facts within 20 ---------- */
const addFact = (a, b) => num(`${a} + ${b} = ?`, a + b, a + b > 10 && a < 10 && b < 10 ? mk10(Math.max(a, b), Math.min(a, b)) : `${addSent(a, b)}.`);
E1.skill({ id: 'I.4.19', name: 'Addition facts within 20', steps: {
  a: { t: 'within 10', g: (R) => { const [a, b] = pair2(R, 2, 10); return addFact(a, b); } },
  b: { t: 'crossing 10', g: (R) => { const a = R.int(2, 9), b = R.int(Math.max(2, 11 - a), 9); return addFact(a, b); } },
  c: { t: 'mixed', g: (R) => { const [a, b] = pair2(R, 5, 20); return addFact(a, b); } },
  d: { t: 'from memory', g: (R) => { const a = R.int(3, 10), b = R.int(3, 10); return addFact(a, b); } },
}});
const subFact = (a, b) => { const x = a - b, cross = a > 10 && a % 10 < b && b < 10;
  return num(`${a} ${M} ${b} = ?`, x, cross ? `Take ${a - 10} to get to 10, then ${b - (a - 10)} more: 10 ${M} ${b - (a - 10)} = ${x}.` : `${subSent(a, b)}. Check: ${b} + ${x} = ${a}.`); };
E1.skill({ id: 'I.4.20', name: 'Subtraction facts within 20', steps: {
  a: { t: 'within 10', g: (R) => { const a = R.int(3, 10); return subFact(a, R.int(1, a - 1)); } },
  b: { t: 'from teens', g: (R) => { const a = R.int(11, 19); return R.bool(0.2) ? subFact(a, 10) : subFact(a, R.int(1, a % 10)); } },
  c: { t: 'crossing 10', g: (R) => { const a = R.int(11, 17); return subFact(a, R.int(a % 10 + 1, 9)); } },
  d: { t: 'from memory', g: (R) => { const a = R.int(6, 20); return subFact(a, R.int(2, Math.min(a - 1, 10))); } },
}});

/* ---------- tens and two-digit work ---------- */
E1.skill({ id: 'I.4.21', name: 'Add and subtract tens', steps: {
  a: { t: '10 + 20', g: (R) => { const a = R.int(1, 4), b = R.int(1, 6 - a);
    return num(`${10 * a} + ${10 * b} = ?`, 10 * (a + b), `${pl(a, 'ten')} + ${pl(b, 'ten')} = ${a + b} tens = ${10 * (a + b)}.`, R.bool() ? {visual: V.pv_join(V.pv_blocks({t: a}), V.pv_blocks({t: b}))} : {}); } },
  b: { t: '30 + 40', g: (R) => { const a = R.int(2, 8), b = R.int(2, 10 - a);
    return num(`${10 * a} + ${10 * b} = ?`, 10 * (a + b), `${a} + ${b} = ${a + b}, so ${a} tens + ${b} tens = ${10 * (a + b)}.`); } },
  c: { t: '23 + 10', g: (R) => { let n0; do n0 = R.int(11, 79); while (n0 % 10 === 0); const n = n0, k = R.int(1, Math.min(3, 9 - Math.floor(n / 10))) || 1;
    return num(`${n} + ${10 * k} = ?`, n + 10 * k, `Add ${k} to the tens digit: ${Math.floor(n / 10)} + ${k} = ${Math.floor(n / 10) + k} tens. ${n + 10 * k}.`, R.bool() ? {visual: blk2(n)} : {}); } },
  d: { t: '45 − 30', g: (R) => { const n = R.int(21, 99), k = R.int(1, Math.floor(n / 10) - (n % 10 ? 0 : 1));
    return num(`${n} ${M} ${10 * k} = ?`, n - 10 * k, `Take ${k} from the tens digit: ${Math.floor(n / 10)} ${M} ${k} = ${pl(Math.floor(n / 10) - k, 'ten')}. The ones stay ${n % 10}. ${n - 10 * k}.`); } },
}});

const twoAdd = (R, regroup) => { let a, b;
  do { a = R.int(11, 69); b = R.int(11, 49); } while (a + b > 99 || ((a % 10 + b % 10 >= 10) !== regroup) || a % 10 === 0 || b % 10 === 0);
  return [a, b]; };
const twoSub = (R, regroup) => { let a, b;
  do { a = R.int(21, 99); b = R.int(11, a - 5); } while (((a % 10 < b % 10) !== regroup) || b % 10 === 0);
  return [a, b]; };
const splitSteps = n => [...Array(Math.floor(n / 10)).fill(10), ...(n % 10 ? [n % 10] : [])];
E1.skill({ id: 'I.4.22', name: 'Two-digit addition with models', steps: {
  a: { t: 'no regrouping', g: (R) => { const [a, b] = twoAdd(R, false), T = x => Math.floor(x / 10);
    return num(`${a} + ${b} = ?`, a + b, `Tens: ${T(a)} + ${T(b)} = ${T(a) + T(b)}. Ones: ${a % 10} + ${b % 10} = ${a % 10 + b % 10}. So ${a + b}.`, {visual: V.pv_join(blk2(a), blk2(b))}); } },
  b: { t: 'regroup ones into a ten', g: (R) => { const [a, b] = twoAdd(R, true), T = x => Math.floor(x / 10), o = a % 10 + b % 10;
    return num(`${a} + ${b} = ?`, a + b, `Ones: ${a % 10} + ${b % 10} = ${o}. Bundle 10 ones into a ten: ${pl(T(a) + T(b) + 1, 'ten')} and ${pl(o - 10, 'one')} = ${a + b}.`, {visual: V.pv_join(blk2(a), blk2(b))}); } },
  c: { t: 'on an open number line', g: (R) => { const [a, b] = twoAdd(R, R.bool()), st = splitSteps(b);
    return num(`${a} + ${b} = ?`, a + b, `Jump ${st.map(s => '+' + s).join(', ')} from ${a}: ${st.reduce((acc, s) => { acc.push(acc[acc.length - 1] + s); return acc; }, [a]).join(' → ')}.`, {visual: V.pv_open(a, st, {ask: true})}); } },
  d: { t: 'story problems', g: (R) => { const [a, b] = twoAdd(R, R.bool()), [s, q] = story(R, ADD, a, b);
    return num(`${s} ${q}`, a + b, `${addSent(a, b)}.`); } },
}});
E1.skill({ id: 'I.4.23', name: 'Two-digit subtraction with models', steps: {
  a: { t: 'no regrouping', g: (R) => { const [a, b] = twoSub(R, false), T = x => Math.floor(x / 10);
    return num(`${a} ${M} ${b} = ?`, a - b, `Take away ${pl(T(b), 'ten')} and ${pl(b % 10, 'one')}: ${pl(T(a) - T(b), 'ten')} and ${pl(a % 10 - b % 10, 'one')} = ${a - b}.`, {visual: blk2(a)}); } },
  b: { t: 'break a ten', g: (R) => { const [a, b] = twoSub(R, true), T = x => Math.floor(x / 10);
    return num(`${a} ${M} ${b} = ?`, a - b, `Not enough ones: break a ten, so ${a} is ${pl(T(a) - 1, 'ten')} ${a % 10 + 10} ones. Take ${pl(T(b), 'ten')} and ${pl(b % 10, 'one')}: ${a - b}.`, {visual: blk2(a)}); } },
  c: { t: 'on an open number line', g: (R) => { const [a, b] = twoSub(R, R.bool()), st = splitSteps(b).map(s => -s);
    return num(`${a} ${M} ${b} = ?`, a - b, `Jump back ${st.map(s => M + (-s)).join(', ')} from ${a}: ${st.reduce((acc, s) => { acc.push(acc[acc.length - 1] + s); return acc; }, [a]).join(' → ')}.`, {visual: V.pv_open(a, st, {ask: true})}); } },
  d: { t: 'story problems', g: (R) => { const [a, b] = twoSub(R, R.bool()), [s, q] = story(R, SUB, a, b);
    return num(`${s} ${q}`, a - b, `${subSent(a, b)}.`); } },
}});
})();

/* Era I · Unit I.5 Patterns & logic (I.5.01–I.5.15) */
(function () {
  const { num, choice, choiceFixed, tf, V, C } = E1;

  /* ---------- shared shape helpers (prefix V.shp_). Defined identically in i5.js and i6.js, guarded, so either file works alone. ---------- */
  const f1 = v => +(+v).toFixed(1);
  // lighten (t>0) or darken (t<0) a #rrggbb color
  V.shp_mix = V.shp_mix || function (hex, t) {
    const n = parseInt(hex.slice(1), 16), ch = [n >> 16, n >> 8 & 255, n & 255];
    return '#' + ch.map(c => Math.round(t >= 0 ? c + (255 - c) * t : c * (1 + t)).toString(16).padStart(2, '0')).join('');
  };
  // unit outlines (y points down). Curved kinds are drawn as fine polygons so rotate/stretch work the same way.
  V.shp_unit = V.shp_unit || (function () {
    const reg = (n, a0) => Array.from({ length: n }, (_, i) => { const a = a0 + i * 2 * Math.PI / n; return [Math.cos(a), Math.sin(a)]; });
    const arc = (a0, a1, n, rx = 1, ry = 1) => Array.from({ length: n + 1 }, (_, i) => { const a = a0 + (a1 - a0) * i / n; return [rx * Math.cos(a), ry * Math.sin(a)]; });
    return {
      circle: () => arc(0, 2 * Math.PI, 48).slice(0, 48),
      oval: () => arc(0, 2 * Math.PI, 48, 1, 0.58).slice(0, 48),
      semicircle: () => arc(Math.PI, 2 * Math.PI, 24),
      triangle: () => reg(3, -Math.PI / 2),
      square: () => [[-1, -1], [1, -1], [1, 1], [-1, 1]],
      rectangle: () => [[-1.7, -1], [1.7, -1], [1.7, 1], [-1.7, 1]],
      rhombus: () => [[0, -1.35], [0.8, 0], [0, 1.35], [-0.8, 0]],
      trapezoid: () => [[-0.5, -0.866], [0.5, -0.866], [1, 0], [-1, 0]],
      pentagon: () => reg(5, -Math.PI / 2),
      hexagon: () => reg(6, 0),
      octagon: () => reg(8, Math.PI / 8),
      star: () => Array.from({ length: 10 }, (_, i) => { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 0.45 : 1; return [r * Math.cos(a), r * Math.sin(a)]; }),
    };
  })();
  V.shp_sides = V.shp_sides || { circle: 0, oval: 0, semicircle: 1, triangle: 3, square: 4, rectangle: 4, rhombus: 4, trapezoid: 4, pentagon: 5, hexagon: 6, octagon: 8, star: 10 };
  // points of a kind (or a raw point list) → stretched (sx,sy), rotated (rot°), then either fitted into a 2r box at cx,cy or scaled by o.scale around cx,cy
  V.shp_pts = V.shp_pts || function (kind, cx, cy, r, o = {}) {
    let p = Array.isArray(kind) ? kind.map(q => q.slice()) : V.shp_unit[kind]();
    const sx = o.sx || 1, sy = o.sy || 1, a = (o.rot || 0) * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
    p = p.map(([x, y]) => [x * sx, y * sy]).map(([x, y]) => [x * c - y * s, x * s + y * c]);
    if (o.scale) return p.map(([x, y]) => [cx + x * o.scale, cy + y * o.scale]);
    const xs = p.map(q => q[0]), ys = p.map(q => q[1]), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const k = 2 * r / Math.max(x1 - x0, y1 - y0), mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
    return p.map(([x, y]) => [cx + (x - mx) * k, cy + (y - my) * k]);
  };
  V.shp_poly = V.shp_poly || function (pts, o = {}) {
    const fill = o.fill || C.blue, stroke = o.stroke || (fill === 'none' ? C.ink : V.shp_mix(fill, -0.28));
    return `<polygon points="${pts.map(q => f1(q[0]) + ',' + f1(q[1])).join(' ')}" fill="${fill}" stroke="${stroke}" stroke-width="${o.sw || 2.5}" stroke-linejoin="round"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}/>`;
  };
  // one flat shape as an SVG fragment
  V.shp_draw = V.shp_draw || function (kind, cx, cy, r, o = {}) { return V.shp_poly(V.shp_pts(kind, cx, cy, r, o), o); };
  // one shape as its own small SVG (for picture choices)
  V.shp_icon = V.shp_icon || function (kind, o = {}) {
    const w = o.w || 90, h = o.h || w, r = o.r || Math.min(w, h) * 0.4;
    return V.svg(w, h, V.shp_draw(kind, w / 2, h / 2, r, o), o.label || 'shape');
  };

  /* ---------- I.5 helpers ---------- */
  const COLS = [C.red, C.blue, C.amber, C.teal, C.violet];
  const cn = c => E1.colorName[c];
  const PSH = ['circle', 'square', 'triangle', 'star', 'hexagon', 'rhombus'];
  const plur = k => k + 's';
  const aan = w => (/^[aeiou]/.test(w) ? 'an ' : 'a ') + w;
  const key = it => it ? it.k + it.c + (it.big === false ? 's' : '') : '?';
  const seqKey = s => s.map(key).join('|');

  // a strip of items {k,c}; null = '?' slot
  V.shp_strip = function (items, o = {}) {
    const cell = o.cell || 50, r = cell * 0.36, pad = 2;
    let body = '';
    items.forEach((it, i) => {
      const x = pad + i * cell + cell / 2, y = pad + cell / 2;
      if (!it) body += `<rect x="${x - cell * 0.44}" y="${y - cell * 0.44}" width="${cell * 0.88}" height="${cell * 0.88}" rx="6" fill="${C.faint}" stroke="${C.muted}" stroke-width="2" stroke-dasharray="5 4"/>` + V.text(x, y, '?', { size: cell * 0.5, weight: 700, fill: C.muted });
      else body += V.shp_draw(it.k, x, y, it.big === false ? r * 0.55 : r, { fill: it.c, sw: cell < 30 ? 1.5 : 2.5 });
    });
    return V.svg(items.length * cell + 2 * pad, cell + 2 * pad, body, 'pattern');
  };
  // numbered boxes; null = '?'
  V.shp_numrow = function (arr) {
    const w = 54, g = 10;
    let body = '';
    arr.forEach((v, i) => {
      const x = 2 + i * (w + g);
      body += `<rect x="${x}" y="2" width="${w}" height="46" rx="8" fill="${v === null ? C.faint : C.paper}" stroke="${v === null ? C.amber : C.ink}" stroke-width="2"${v === null ? ' stroke-dasharray="5 4"' : ''}/>` + V.text(x + w / 2, 25, v === null ? '?' : v, { size: 22, weight: 700, fill: v === null ? C.muted : C.ink });
    });
    return V.svg(arr.length * (w + g) - g + 4, 50, body, 'number pattern');
  };
  // towers of squares; heights array, null = '?' slot; o.labels numbers under towers
  V.shp_towers = function (hs, o = {}) {
    const s = o.s || 16, gap = 26, maxH = Math.max(3, ...hs.filter(h => h !== null)), lab = o.labels ? 22 : 0, H = maxH * s + 8 + lab;
    let body = '';
    hs.forEach((h, i) => {
      const x = 6 + i * (s + gap);
      if (h === null) body += `<rect x="${x - 4}" y="${H - lab - 4 - 3 * s}" width="${s + 8}" height="${3 * s}" rx="5" fill="${C.faint}" stroke="${C.muted}" stroke-width="2" stroke-dasharray="4 3"/>` + V.text(x + s / 2, H - lab - 4 - 1.5 * s, '?', { size: 18, weight: 700, fill: C.muted });
      else for (let j = 0; j < h; j++) body += `<rect x="${x}" y="${H - lab - 4 - (j + 1) * s}" width="${s}" height="${s}" fill="${o.color || C.teal}" stroke="${C.paper}" stroke-width="1.5"/>`;
      if (lab) body += V.text(x + s / 2, H - 10, o.labels[i], { size: 13, fill: C.muted });
    });
    return V.svg(6 + hs.length * (s + gap) - gap + 10, H, body, 'towers');
  };
  // boxes of items side by side; groups: [[item..],..], labels: ['1','2'..]
  V.shp_boxes = function (groups, labels, o = {}) {
    const cell = 40, per = o.per || 3, bw = per * cell + 12;
    const rows = Math.max(...groups.map(g => Math.ceil(g.length / per))), bh = rows * cell + 12;
    let body = '';
    groups.forEach((g, b) => {
      const x0 = 2 + b * (bw + 16);
      body += V.text(x0 + bw / 2, 11, labels[b], { size: 15, weight: 700 });
      body += `<rect x="${x0}" y="24" width="${bw}" height="${bh}" rx="10" fill="${C.faint}" stroke="${C.line}" stroke-width="2"/>`;
      g.forEach((it, i) => body += V.shp_draw(it.k, x0 + 6 + (i % per) * cell + cell / 2, 30 + Math.floor(i / per) * cell + cell / 2, it.big === false ? 8 : 15, { fill: it.c, sw: 2 }));
    });
    return V.svg(groups.length * (bw + 16) - 16 + 4, bh + 26, body, 'sorting boxes');
  };
  // items spread on a grid (no overlaps)
  V.shp_scatter = function (items, R, cols = 5) {
    const cell = 48, rows = Math.ceil(items.length / cols), slots = R.shuffle(Array.from({ length: cols * rows }, (_, i) => i));
    let body = '';
    items.forEach((it, i) => {
      const s = slots[i], x = (s % cols) * cell + cell / 2 + (R.f() - 0.5) * 8, y = Math.floor(s / cols) * cell + cell / 2 + (R.f() - 0.5) * 8;
      body += V.shp_draw(it.k, x, y, it.big === false ? 9 : 16, { fill: it.c, sw: 2, rot: it.rot || 0 });
    });
    return V.svg(cols * cell, rows * cell, body, 'shapes');
  };
  const item = (k, c, big) => ({ k, c, big });
  const icon = (it, w = 70) => V.shp_icon(it.k, { fill: it.c, w, r: it.big === false ? w * 0.2 : w * 0.38, rot: it.rot || 0 });
  // pattern units as index lists
  const UNITS = { AB: [0, 1], AAB: [0, 0, 1], ABB: [0, 1, 1], ABC: [0, 1, 2], AABB: [0, 0, 1, 1], AABC: [0, 0, 1, 2], ABCC: [0, 1, 2, 2], ABBC: [0, 1, 1, 2] };
  // n distinct items: mode 'color' (same shape), 'shape' (same color) or 'both'
  const itemsFor = (R, n, mode) => {
    const cs = R.sample(COLS, n), ks = R.sample(PSH, n), k0 = R.pick(PSH), c0 = R.pick(COLS);
    return Array.from({ length: n }, (_, i) => item(mode === 'color' ? k0 : ks[i], mode === 'shape' ? c0 : cs[i]));
  };
  const nm = (it, mode) => mode === 'color' ? cn(it.c) : mode === 'shape' ? it.k : cn(it.c) + ' ' + it.k;
  const build = (u, its, len) => Array.from({ length: len }, (_, i) => its[u[i % u.length]]);
  const unitWords = (u, its, mode) => u.map(i => nm(its[i], mode)).join(', ');
  const isPeriodic = s => { for (let p = 1; p <= s.length / 2; p++) { let ok = true; for (let i = p; i < s.length; i++) if (key(s[i]) !== key(s[i - p])) { ok = false; break; } if (ok) return true; } return false; };
  const stripC = s => V.shp_strip(s, { cell: s.length > 6 ? 16 : 20 });
  // n distinct stripped choice sequences from a candidate maker, avoiding the given keys
  const uniq = (make, avoid, n, tries = 200) => {
    const seen = new Set(avoid), out = [];
    for (let t = 0; t < tries && out.length < n; t++) { const s = make(t); if (!s) continue; const k = seqKey(s); if (!seen.has(k)) { seen.add(k); out.push(s); } }
    return out;
  };
  const NAMES = ['Ann', 'Ben', 'Mia', 'Sam', 'Leo', 'Zoe', 'Kim', 'Max', 'Ava', 'Tom', 'Eva', 'Raj'];
  const YN = ['yes', 'no'];

  /* ---------- I.5.01 Copy a pattern ---------- */
  const copyQ = (R, uname, mode) => {
    const u = UNITS[uname], its = itemsFor(R, Math.max(...u) + 1, mode), len = 6, s = build(u, its, len);
    const ds = uniq(t => {
      const c = s.slice(), kind = t % 3;
      if (kind === 0) { const i = R.int(0, len - 2); [c[i], c[i + 1]] = [c[i + 1], c[i]]; }
      else if (kind === 1) return build(u, its, len + 1).slice(1);
      else { const i = R.int(1, len - 1); c[i] = R.pick(its.filter(x => x !== c[i])); }
      return c;
    }, [seqKey(s)], 3);
    return choice(R, 'Which strip matches it exactly?', stripC(s), ds.map(stripC), `Check spot by spot: ${unitWords(u, its, mode)}, then again.`, { visual: V.shp_strip(s) });
  };
  E1.skill({ id: 'I.5.01', name: 'Copy a pattern', steps: {
    a: { t: 'AB colors', g: R => copyQ(R, 'AB', 'color') },
    b: { t: 'AB shapes', g: R => copyQ(R, 'AB', 'shape') },
    c: { t: 'ABB', g: R => copyQ(R, R.pick(['ABB', 'AAB']), R.pick(['color', 'shape', 'both'])) },
    d: { t: 'ABC', g: R => copyQ(R, 'ABC', R.pick(['color', 'shape', 'both'])) },
  } });

  /* ---------- I.5.02 Extend a repeating pattern ---------- */
  const nextQ = (R, uname) => {
    const u = UNITS[uname], n = Math.max(...u) + 1, mode = R.pick(['color', 'shape', 'both']), its = itemsFor(R, n + 1, mode);
    const L = u.length * 2 + R.int(0, u.length - 1), s = build(u, its, L + 1), ans = s[L];
    const vis = V.shp_strip([...s.slice(0, L), null], { cell: L > 8 ? 42 : 50 });
    return choice(R, 'What comes next?', icon(ans), its.filter(x => x !== ans).map(x => icon(x)), `The part that repeats is ${unitWords(u, its, mode)}. Next comes ${nm(ans, mode)}.`, { visual: vis });
  };
  E1.skill({ id: 'I.5.02', name: 'Extend a repeating pattern', steps: {
    a: { t: 'AB', g: R => nextQ(R, 'AB') },
    b: { t: 'AAB', g: R => nextQ(R, R.pick(['AAB', 'ABB'])) },
    c: { t: 'ABC', g: R => nextQ(R, R.pick(['ABC', 'ABC', 'AABC', 'ABCC'])) },
    d: { t: 'find the part that repeats', g: R => {
      const un = R.pick(['AB', 'AAB', 'ABB', 'ABC', 'AABB']), u = UNITS[un], mode = R.pick(['color', 'shape', 'both']), its = itemsFor(R, 3, mode);
      const s = build(u, its, u.length * (u.length > 3 ? 2 : 3)), unit = build(u, its, u.length);
      const rots = new Set(u.map((_, r) => seqKey(unit.slice(r).concat(unit.slice(0, r)))));
      const cands = [unit.slice(0, -1), build(u, its, u.length + 1), ...R.shuffle(Object.keys(UNITS)).map(k => build(UNITS[k], its, UNITS[k].length))]
        .filter(x => x.length > 1 && !rots.has(seqKey(x)) && !isPeriodic(x));
      const ds = uniq(t => cands[t], [seqKey(unit)], 3, cands.length);
      const sm = x => V.shp_strip(x, { cell: 22 });
      return choice(R, 'Which part repeats?', sm(unit), ds.map(sm), `${(w => w[0].toUpperCase() + w.slice(1))(unitWords(u, its, mode))} comes again and again, so that is the part that repeats.`, { visual: V.shp_strip(s, { cell: s.length > 8 ? 40 : 48 }) });
    } },
  } });

  /* ---------- I.5.03 Patterns and rules ---------- */
  const whichPattern = (R, nItems) => {
    const isPat = R.bool(), mode = R.pick(isPat ? ['color', 'shape', 'both'] : ['color', 'shape']), its = itemsFor(R, nItems, mode);
    const un = nItems === 2 ? R.pick(['AB', 'AAB', 'ABB', 'AABB']) : R.pick(['ABC', 'AABC', 'ABCC', 'ABBC']), u = UNITS[un];
    const len = nItems === 2 ? (u.length === 2 ? 6 : u.length * 2) : Math.min(8, u.length * 2), s = build(u, its, len);
    if (isPat) {
      const ds = uniq(() => { const c = Array.from({ length: len }, () => R.pick(its)); return its.every(x => c.includes(x)) && !isPeriodic(c) ? c : null; }, [seqKey(s)], 3);
      return choice(R, 'Which one is a pattern?', stripC(s), ds.map(stripC), `In a pattern a part repeats: ${unitWords(u, its, mode)}, then again.`);
    }
    const others = Object.keys(UNITS).filter(k => k !== un && Math.max(...UNITS[k]) + 1 === nItems);
    const ds = uniq(t => t < 2 ? build(UNITS[R.pick(others)], its, len) : (() => { const c = Array.from({ length: len }, () => R.pick(its)); return isPeriodic(c) ? null : c; })(), [seqKey(s)], 3);
    return choice(R, `Which one follows the rule: <b>${unitWords(u, its, mode)}</b>, repeat?`, stripC(s), ds.map(stripC), `Say the rule as you check each strip: ${unitWords(u, its, mode)}, then again.`);
  };
  E1.skill({ id: 'I.5.03', name: 'Patterns and rules', steps: {
    a: { t: 'with 2 items', g: R => whichPattern(R, 2) },
    b: { t: 'with 3 items', g: R => whichPattern(R, 3) },
    c: { t: 'fix the mistake', g: R => {
      const un = R.pick(['AB', 'AAB', 'ABB', 'ABC', 'AABB']), u = UNITS[un], mode = R.pick(['color', 'shape', 'both']), n = Math.max(...u) + 1, its = itemsFor(R, n + 1, mode);
      const len = u.length * (u.length > 3 ? 2 : 3) + (u.length === 2 ? 1 : 0), s = build(u, its.slice(0, n), len);
      const i = R.int(u.length, len - 1), right = s[i], wrong = R.pick(its.filter(x => x !== right)), bad = s.slice(); bad[i] = wrong;
      const cell = len > 8 ? 44 : 50, why = `The part that repeats is ${unitWords(u, its, mode)}. Spot ${i + 1} should be ${nm(right, mode)}, not ${nm(wrong, mode)}.`;
      if (R.bool()) {
        const nums = V.row(len, cell, 22, (x, y, j) => V.text(x + 2, y, j + 1, { size: 14, fill: C.muted }));
        return num('One is wrong. Which spot is it?', i + 1, why, { visual: V.stack([V.shp_strip(bad, { cell }), nums], { gap: 2 }) });
      }
      const x = 2 + i * cell, mark = `<rect x="${x + 1}" y="1" width="${cell - 2}" height="${cell + 2}" rx="8" fill="none" stroke="${C.ink}" stroke-width="2.5" stroke-dasharray="6 4"/>`;
      const vis = V.shp_strip(bad, { cell }).replace('</svg>', mark + '</svg>');
      return choice(R, 'The shape in the dashed box is wrong. What should it be?', icon(right), its.filter(x => x !== right).map(x => icon(x)), why, { visual: vis });
    } },
    d: { t: 'same rule, new items', g: R => {
      const pool = ['AB', 'AAB', 'ABB', 'ABC', 'AABB'], un = R.pick(pool), u = UNITS[un];
      const A = itemsFor(R, 3, 'color'), B = itemsFor(R, 3, 'shape');
      if (B[0].k === A[0].k) B.forEach((x, i) => x.k = PSH.filter(k => k !== A[0].k)[i]);
      const len = 6, s = build(u, A, len), t = build(u, B, len);
      const ds = R.shuffle(pool.filter(k => k !== un)).slice(0, 3).map(k => build(UNITS[k], B, len));
      return choice(R, 'Which one has the same rule?', stripC(t), ds.map(stripC), `Both go ${u.map(i => 'ABC'[i]).join(' ')}: ${unitWords(u, A, 'color')} matches ${unitWords(u, B, 'shape')}.`, { visual: V.shp_strip(s, { cell: 44 }) });
    } },
  } });

  /* ---------- I.5.04 Growing patterns ---------- */
  const tower = (R, step, shown) => {
    const s0 = R.int(1, step > 1 ? 3 : 4), hs = Array.from({ length: shown }, (_, i) => s0 + i * step);
    return { hs, next: s0 + shown * step, s0, col: R.pick(COLS) };
  };
  E1.skill({ id: 'I.5.04', name: 'Growing patterns', steps: {
    a: { t: 'one more each time', g: R => { const T = tower(R, 1, R.int(3, 4)); return num('How many squares in the next tower?', T.next, `Each tower has 1 more. ${T.hs[T.hs.length - 1]} + 1 = ${T.next}.`, { visual: V.shp_towers([...T.hs, null], { color: T.col }) }); } },
    b: { t: 'towers growing by 2', g: R => { const T = tower(R, 2, R.int(3, 4)); return num('How many squares in the next tower?', T.next, `Each tower has 2 more. ${T.hs[T.hs.length - 1]} + 2 = ${T.next}.`, { visual: V.shp_towers([...T.hs, null], { color: T.col }) }); } },
    c: { t: 'predict the next', g: R => {
      const d = R.int(1, 3), T = tower(R, d, 3), k = R.pick([5, 5, 6]), ans = T.s0 + (k - 1) * d;
      return num(`How many squares in tower ${k}?`, ans, `Keep adding ${d}: ${Array.from({ length: k }, (_, i) => T.s0 + i * d).join(', ')}.`, { visual: V.shp_towers(T.hs, { color: T.col, labels: [1, 2, 3] }) });
    } },
    d: { t: 'describe the rule', g: R => {
      const d = R.pick([1, 2, 3, -1, -2]), n = R.int(3, 4), s0 = d < 0 ? R.int(-d * (n - 1) + 1, -d * (n - 1) + 3) : R.int(1, 3), hs = Array.from({ length: n }, (_, i) => s0 + i * d);
      const txt = x => x > 0 ? `Add ${x} each time` : `Take away ${-x} each time`;
      const ds = [1, 2, 3, -1, -2].filter(x => x !== d).map(txt);
      return choice(R, 'What is the rule?', txt(d), R.sample(ds, 2).concat(d > 0 ? [] : []), `${hs[0]}, then ${hs[1]}, then ${hs[2]}: ${d > 0 ? 'up' : 'down'} ${Math.abs(d)} each time.`, { visual: V.shp_towers(hs, { color: R.pick(COLS) }) });
    } },
  } });

  /* ---------- I.5.05 Number patterns ---------- */
  const numPat = (R, step, start, hide) => {
    const s = Array.from({ length: 5 }, (_, i) => start + i * step), h = hide === undefined ? 4 : hide;
    return num('What number goes in the box?', s[h], `The numbers go up by ${step}. ${h === 0 ? s[1] + ' − ' + step : s[h - 1] + ' + ' + step} = ${s[h]}.`, { visual: V.shp_numrow(s.map((v, i) => i === h ? null : v)) });
  };
  E1.skill({ id: 'I.5.05', name: 'Number patterns', steps: {
    a: { t: '+ 1', g: R => numPat(R, 1, R.int(1, 25)) },
    b: { t: '+ 2', g: R => numPat(R, 2, R.int(0, 22)) },
    c: { t: '+ 5 and + 10', g: R => R.bool() ? numPat(R, 5, 5 * R.int(0, 10)) : numPat(R, 10, R.int(1, 50)) },
    d: { t: 'find the missing number', g: R => { const st = R.pick([1, 2, 5, 10]); return numPat(R, st, st === 5 ? 5 * R.int(0, 12) : R.int(1, st === 10 ? 45 : 30), R.int(1, 3)); } },
  } });

  /* ---------- I.5.06 Sort by one attribute ---------- */
  const sortSet = (R, attr, nb) => {
    const shapes = R.sample(['circle', 'square', 'triangle', 'star', 'hexagon'], 3), cols = R.sample(COLS, 3), boxCols = R.sample(COLS, nb), boxK = R.sample(['circle', 'square', 'triangle', 'star', 'hexagon'], nb);
    const groups = Array.from({ length: nb }, (_, b) => R.shuffle([0, 1, 2]).map(j =>
      attr === 'color' ? item(shapes[j], boxCols[b]) : attr === 'shape' ? item(boxK[b], cols[j]) : item(shapes[j], cols[(j + b) % 3], b === 0)));
    return { groups, boxCols, boxK, shapes, cols };
  };
  const whereQ = (R, attr) => {
    const nb = attr === 'size' ? 2 : R.int(2, 3), S = sortSet(R, attr, nb), j = R.int(0, nb - 1);
    const nw = attr === 'color' ? item(R.pick(PSH), S.boxCols[j]) : attr === 'shape' ? item(S.boxK[j], R.pick(COLS)) : item(R.pick(S.shapes), R.pick(COLS), j === 0);
    const labels = S.groups.map((_, i) => 'Box ' + (i + 1));
    const why = attr === 'color' ? `It is ${cn(nw.c)}, like the shapes in box ${j + 1}.` : attr === 'shape' ? `It is ${aan(nw.k)}, like the shapes in box ${j + 1}.` : `It is ${nw.big ? 'big' : 'small'}, like the shapes in box ${j + 1}.`;
    const nwSvg = V.svg(70, 70, V.shp_draw(nw.k, 35, 35, nw.big === false ? 8 : 15, { fill: nw.c, sw: 2 }));
    return choiceFixed('Which box does the new one go in?', labels, j, why, { visual: V.side([{ svg: nwSvg, caption: 'New' }, V.shp_boxes(S.groups, labels.map((_, i) => String(i + 1)))], { gap: 20 }) });
  };
  E1.skill({ id: 'I.5.06', name: 'Sort by one attribute', steps: {
    a: { t: 'by color', g: R => whereQ(R, 'color') },
    b: { t: 'by shape', g: R => whereQ(R, 'shape') },
    c: { t: 'by size', g: R => whereQ(R, 'size') },
    d: { t: 'name the rule', g: R => {
      const attr = R.pick(['color', 'shape', 'size']), S = sortSet(R, attr, 2), opts = ['by color', 'by shape', 'by size'];
      const why = { color: 'Each box has one color, but mixed shapes.', shape: 'Each box has one shape, but mixed colors.', size: 'One box has big shapes, the other small ones.' }[attr];
      return choiceFixed('How were these sorted?', opts, opts.indexOf('by ' + attr), why, { visual: V.shp_boxes(S.groups, ['1', '2']) });
    } },
  } });

  /* ---------- I.5.07 Sort by two attributes ---------- */
  const TWO_K = ['circle', 'square', 'triangle', 'star'];
  const VENN_OPTS = ['A', 'B', 'C', 'D'];
  V.shp_venn = function (l, r) {
    let b = `<rect x="2" y="2" width="296" height="176" rx="10" fill="${C.paper}" stroke="${C.line}" stroke-width="2"/>`;
    b += `<circle cx="115" cy="100" r="66" fill="${V.shp_mix(C.blue, 0.85)}" fill-opacity="0.8" stroke="${C.blue}" stroke-width="2.5"/>`;
    b += `<circle cx="185" cy="100" r="66" fill="${V.shp_mix(C.amber, 0.8)}" fill-opacity="0.6" stroke="${C.amber}" stroke-width="2.5"/>`;
    b += V.text(95, 20, l, { size: 15, weight: 700 }) + V.text(205, 20, r, { size: 15, weight: 700 });
    b += V.text(82, 100, 'A', { size: 20, weight: 700, fill: C.muted }) + V.text(150, 100, 'B', { size: 20, weight: 700, fill: C.muted }) + V.text(218, 100, 'C', { size: 20, weight: 700, fill: C.muted }) + V.text(278, 160, 'D', { size: 20, weight: 700, fill: C.muted });
    return V.svg(300, 180, b, 'sorting circles');
  };
  E1.skill({ id: 'I.5.07', name: 'Sort by two attributes', steps: {
    a: { t: 'color and shape', g: R => {
      const [c, c2] = R.sample(COLS, 2), [k, k2] = R.sample(TWO_K, 2), n = R.int(1, 4);
      const its = [...Array(n)].map(() => item(k, c));
      const nSameC = R.int(2, 3), nSameK = R.int(2, 3);
      for (let i = 0; i < nSameC; i++) its.push(item(k2, c));
      for (let i = 0; i < nSameK; i++) its.push(item(k, c2));
      if (R.bool()) its.push(item(k2, c2));
      return num(`How many <b>${cn(c)} ${plur(k)}</b>?`, n, `Look for shapes that are ${cn(c)} and also ${plur(k)}: there ${n === 1 ? 'is 1' : 'are ' + n}.`, { visual: V.shp_scatter(its, R) });
    } },
    b: { t: 'two-circle sorting', g: R => {
      const c = R.pick(COLS), k = R.pick(TWO_K), inC = R.bool(), inK = R.bool();
      const it = item(inK ? k : R.pick(TWO_K.filter(x => x !== k)), inC ? c : R.pick(COLS.filter(x => x !== c)));
      const idx = inC && inK ? 1 : inC ? 0 : inK ? 2 : 3;
      const why = [`It is ${cn(c)} but not ${aan(k)}: A.`, `It is ${cn(c)} and ${aan(k)}: the middle, B.`, `It is ${aan(k)} but not ${cn(c)}: C.`, `It is not ${cn(c)} and not ${aan(k)}: outside, D.`][idx];
      return choiceFixed('Where does this shape go?', VENN_OPTS, idx, why, { visual: V.side([{ svg: icon(it, 64), caption: 'Shape' }, V.shp_venn(cn(c), plur(k))], { gap: 16 }) });
    } },
    c: { t: "which one doesn't belong", g: R => {
      const FAM = { 3: [['triangle', 0, 1, 1], ['triangle', 180, 1, 1], ['triangle', 0, 0.6, 1.4], ['triangle', 90, 1, 1]], 4: [['square', 0], ['rectangle', 0], ['rhombus', 0], ['trapezoid', 0]], 6: [['hexagon', 0], ['hexagon', 30], ['hexagon', 0, 1.4, 0.8]], 0: [['circle', 0], ['oval', 0], ['oval', 90]] };
      const fams = ['3', '4', '6', '0'], f = R.pick(fams), c = R.pick(COLS), mk = (d, col, lab) => V.shp_icon(d[0], { fill: col, w: 80, rot: d[1], sx: d[2] || 1, sy: d[3] || 1, label: lab || 'shape' });
      const good = R.sample(FAM[f], 3).map(d => mk(d, c));
      const byColor = R.bool(), fn = { 3: '3 sides', 4: '4 sides', 6: '6 sides', 0: 'no corners' };
      let odd, why;
      if (byColor) { const d0 = R.pick(FAM[f]), c2 = R.pick(COLS.filter(x => x !== c)); good.splice(0, 3, mk(d0, c, 'shape 1'), mk(d0, c, 'shape 2'), mk(d0, c, 'shape 3')); odd = mk(d0, c2); why = `All 4 are the same shape. The others are ${cn(c)}. This one is ${cn(c2)}.`; }
      else { const f2 = R.pick(fams.filter(x => x !== f)); odd = mk(R.pick(FAM[f2]), c); why = `The others have ${fn[f]}. This one has ${fn[f2]}.`; }
      return choice(R, 'Which one does not belong?', odd, good, why);
    } },
    d: { t: 'guess my rule', g: R => {
      const [c, c2, c3] = R.sample(COLS, 3), [k, k2, k3] = R.sample(TWO_K, 3);
      const yes = [item(k, c), item(k, c), item(k, c)].map((x, i) => (x.big = i !== 1, x));
      const no = R.shuffle([item(k2, c), item(k, c2), item(k3, c), item(k, c3)]);
      return choice(R, 'What is the rule for the Yes box?', `${cn(c)} ${plur(k)}`, [`all ${plur(k)}`, `all ${cn(c)} shapes`, `${cn(c2)} ${plur(k)}`], `Every Yes shape is ${cn(c)} and ${aan(k)}. The No box has ${cn(c)} shapes and ${plur(k)} that miss one part.`, { visual: V.shp_boxes([yes, no], ['Yes', 'No'], { per: 2 }) });
    } },
  } });

  /* ---------- I.5.08 Odd and even ---------- */
  V.shp_pairs = function (n, color) {
    const p = Math.floor(n / 2), g = 34;
    let b = '';
    for (let i = 0; i < p; i++) b += `<rect x="${4 + i * g}" y="4" width="28" height="60" rx="14" fill="none" stroke="${C.line}" stroke-width="2"/>` + V.dot(18 + i * g, 20, 10, color) + V.dot(18 + i * g, 48, 10, color);
    if (n % 2) b += V.dot(18 + p * g + 6, 20, 10, color);
    return V.svg(Math.max(40, p * g + (n % 2 ? g + 6 : 0) + 6), 68, b, 'pairs');
  };
  const oe = n => n % 2 ? 'odd' : 'even';
  E1.skill({ id: 'I.5.08', name: 'Odd and even', steps: {
    a: { t: 'pair up objects', g: R => { const n = R.int(3, 13); return num('Make pairs of 2. How many pairs?', Math.floor(n / 2), `${n} dots make ${E1.plural(Math.floor(n / 2), 'pair')}${n % 2 ? ' with 1 left over' : ''}.`, { visual: V.dots(n, { layout: 'grid', per: Math.ceil(n / 2), color: R.pick(COLS) }) }); } },
    b: { t: 'one left over means odd', g: R => { const n = R.int(3, 15); return choiceFixed(`Is <b>${n}</b> odd or even?`, ['odd', 'even'], n % 2 ? 0 : 1, n % 2 ? `1 dot is left over, so ${n} is odd.` : `Every dot has a partner, so ${n} is even.`, { visual: V.shp_pairs(n, R.pick(COLS)) }); } },
    c: { t: 'evens to 20', g: R => {
      if (R.bool()) { const s = 2 * R.int(0, 6), h = R.int(1, 4), seq = [0, 1, 2, 3, 4].map(i => s + 2 * i); return num('Count by 2s. What number is missing?', seq[h], `Even numbers go up by 2: ${seq[h - 1]} + 2 = ${seq[h]}.`, { visual: V.shp_numrow(seq.map((v, i) => i === h ? null : v)) }); }
      const e = 2 * R.int(1, 10), odds = R.sample([1, 3, 5, 7, 9, 11, 13, 15, 17, 19], 3);
      return choice(R, 'Which number is even?', e, odds, `${e} ends in ${e % 10}, so it splits into pairs with none left over.`);
    } },
    d: { t: 'is this number odd or even?', g: R => { const n = R.int(10, 99); return choiceFixed(`Is <b>${n}</b> odd or even?`, ['odd', 'even'], n % 2 ? 0 : 1, `Look at the ones digit: ${n % 10} is ${oe(n % 10)}, so ${n} is ${oe(n)}.`); } },
  } });

  /* ---------- I.5.09 Same and different ---------- */
  const randItem = R => item(R.pick(PSH), R.pick(COLS));
  const diffOne = (R, it, attr) => attr === 'color' ? item(it.k, R.pick(COLS.filter(c => c !== it.c)), it.big) : attr === 'shape' ? item(R.pick(PSH.filter(k => k !== it.k)), it.c, it.big) : item(it.k, it.c, !(it.big !== false));
  const pair = (it, jt) => { const b = V.shp_draw(it.k, 50, 50, it.big === false ? 18 : 36, { fill: it.c }) + V.shp_draw(jt.k, 170, 50, jt.big === false ? 18 : 36, { fill: jt.c }); return V.svg(220, 100, b, 'two shapes'); };
  E1.skill({ id: 'I.5.09', name: 'Same and different', steps: {
    a: { t: 'spot differences', g: R => {
      const top = [...Array(5)].map(() => randItem(R)), k = R.int(1, 3), pos = R.sample([0, 1, 2, 3, 4], k), bot = top.slice();
      pos.forEach(p => bot[p] = diffOne(R, top[p], R.pick(['color', 'shape'])));
      return num('How many differences?', k, `Compare top and bottom one by one: ${k} ${k === 1 ? 'spot is' : 'spots are'} different.`, { visual: V.stack([V.shp_strip(top, { cell: 48 }), V.shp_strip(bot, { cell: 48 })], { gap: 14 }) });
    } },
    b: { t: 'spot sameness', g: R => {
      const t = item(R.pick(PSH), R.pick(COLS), true);
      const ds = [diffOne(R, t, 'color'), diffOne(R, t, 'shape'), diffOne(R, t, 'size')];
      return choice(R, 'Which one is the same as this?', icon(t, 80), ds.map(d => icon(d, 80)), 'It must match in color, shape and size.', { visual: icon(t, 90) });
    } },
    c: { t: 'compare two pictures', g: R => {
      const opts = ['color', 'shape', 'size'], a = R.pick(opts), t = item(R.pick(PSH), R.pick(COLS), R.bool()), u = diffOne(R, t, a);
      return choiceFixed('What is different?', opts, opts.indexOf(a), `Only the ${a} changes. The rest is the same.`, { visual: pair(t, u) });
    } },
    d: { t: 'choose the right description', g: R => {
      const same = R.pick(['color', 'shape', 'size']), t = item(R.pick(PSH), R.pick(COLS), R.bool());
      let u = t; ['color', 'shape', 'size'].filter(x => x !== same).forEach(x => u = diffOne(R, u, x));
      const st = { color: `Both are ${cn(t.c)}.`, shape: `Both are ${plur(t.k)}.`, size: `Both are ${t.big === false ? 'small' : 'big'}.` };
      return choice(R, 'Which sentence is true?', st[same], ['color', 'shape', 'size'].filter(x => x !== same).map(x => st[x]), `They share only their ${same}.`, { visual: pair(t, u) });
    } },
  } });

  /* ---------- I.5.10 True or false ---------- */
  E1.skill({ id: 'I.5.10', name: 'True or false', steps: {
    a: { t: 'about pictures', g: R => {
      const [c1, c2] = R.sample(COLS, 2), [k1, k2] = R.sample(['circle', 'square', 'triangle', 'star'], 2), its = [];
      const n = R.int(4, 8); for (let i = 0; i < n; i++) its.push(item(R.pick([k1, k2]), R.pick([c1, c2])));
      its[R.int(0, n - 1)] = item(k1, c1); // every question is about something that is there
      if (R.bool()) {
        const byC = R.bool(), real = its.filter(x => byC ? x.c === c1 : x.k === k1).length, say = R.bool() ? real : real + (real > 1 ? R.pick([-1, 1]) : 1);
        const what = byC ? `${cn(c1)} shapes` : plur(k1);
        return tf(`True or false? There ${say === 1 ? 'is' : 'are'} ${say} ${say === 1 ? what.replace(/s$/, '') : what}.`, say === real, `Count the ${what}: there ${real === 1 ? 'is' : 'are'} ${real}.`, { visual: V.shp_strip(its, { cell: 44 }) });
      }
      const i = R.int(0, n - 1), sayK = R.bool() ? its[i].k : [k1, k2].find(k => k !== its[i].k);
      return tf(`True or false? Shape number ${i + 1} is ${aan(sayK)}.`, sayK === its[i].k, `Count from the left to shape ${i + 1}: it is ${aan(its[i].k)}.`, { visual: V.shp_strip(its, { cell: 44 }) });
    } },
    b: { t: 'about numbers', g: R => {
      const t = R.int(0, 3), ok = R.bool();
      if (t === 0) { const a = R.int(1, 9), b = R.int(1, 9), s = ok ? a + b : a + b + R.pick([-1, 1]); return tf(`True or false? ${a} + ${b} = ${s}`, s === a + b, `${a} + ${b} = ${a + b}.`); }
      if (t === 1) { const [a, b] = R.distinct(1, 30, 2); return tf(`True or false? ${a} is bigger than ${b}.`, a > b, `${Math.max(a, b)} comes later when counting, so it is bigger.`); }
      if (t === 2) { const m = R.int(1, 30), n = ok ? m + 1 : m + R.pick([-1, 2]); return tf(`True or false? ${n} comes just after ${m}.`, n === m + 1, `Just after ${m} comes ${m + 1}.`); }
      const n = R.int(2, 40); const say = R.pick(['odd', 'even']); return tf(`True or false? ${n} is ${say}.`, oe(n) === say, `${n} ends in ${n % 10}, so it is ${oe(n)}.`);
    } },
    c: { t: 'fix a false statement', g: R => {
      const t = R.int(0, 2);
      if (t === 0) { const a = R.int(2, 9), b = R.int(1, 9), w = a + b + R.pick([-2, -1, 1, 2]); return num(`${a} + ${b} = ${w} is false. What is ${a} + ${b}?`, a + b, `Count on ${b} from ${a}: ${a + b}.`); }
      if (t === 1 && R.bool(0.25)) { const a = R.int(1, 50), wrong = R.pick(['<', '>']); return choiceFixed(`${a} ${wrong} ${a} is false. Which sign makes it true?`, ['<', '=', '>'], 1, `Both sides are ${a}, so ${a} = ${a}.`); }
      if (t === 1) { const [a, b] = R.distinct(1, 50, 2), wrong = a < b ? '>' : '<'; return choiceFixed(`${a} ${wrong} ${b} is false. Which sign makes it true?`, ['<', '=', '>'], a < b ? 0 : 2, `${Math.min(a, b)} is less than ${Math.max(a, b)}, so ${a} ${a < b ? '<' : '>'} ${b}.`); }
      const n = R.int(3, 10), w = n + R.pick([-1, 1, 2]), c = R.pick(COLS);
      return num(`The card says ${w} dots. That is false. How many are there?`, n, `Count them one by one: ${n}.`, { visual: V.dots(n, { layout: 'grid', color: c }) });
    } },
    d: { t: 'choose the reason', g: R => {
      const t = R.int(0, 2);
      if (t === 0) { const n = 2 * R.int(1, 9) + 1; return choice(R, `Why is this false? <b>${n} is even.</b>`, `${n} has 1 left over in pairs.`, [`${n} is less than 20.`, `${n} has no pairs.`], `Put ${n} in pairs: 1 is left over, so it is odd.`); }
      if (t === 1) { const a = R.int(2, 9), b = R.int(1, 9), w = a + b + R.pick([-1, 1, 2]); return choice(R, `Why is this false? <b>${a} + ${b} = ${w}</b>`, `${a} + ${b} makes ${a + b}.`, [`${a} + ${b} makes ${w}.`, `You can't add ${a} and ${b}.`], `Count on from ${a}: ${a + b}, not ${w}.`); }
      const [a, b] = R.distinct(1, 30, 2).sort((x, y) => x - y);
      return choice(R, `Why is this false? <b>${a} is bigger than ${b}.</b>`, `${a} comes before ${b} when counting.`, [`${a} comes after ${b} when counting.`, `${a} and ${b} are the same.`], `${a} comes first, so ${a} is smaller than ${b}.`);
    } },
  } });

  /* ---------- I.5.11 Always, sometimes, never ---------- */
  const ASN = ['always', 'sometimes', 'never'];
  const SHAPE_ST = [
    ['A triangle has 3 sides.', 0, 'Every triangle has 3 sides. That is what makes it a triangle.'],
    ['A square has 4 corners.', 0, 'Every square has 4 corners.'],
    ['A circle has corners.', 2, 'A circle is one curved line. It has no corners.'],
    ['A hexagon has 6 sides.', 0, 'Every hexagon has 6 sides.'],
    ['A rectangle has 5 sides.', 2, 'A rectangle always has 4 sides, never 5.'],
    ['A shape with 4 sides is a square.', 1, 'A square has 4 sides, but so does a long rectangle.'],
    ['A triangle is red.', 1, 'Some triangles are red, but they can be any color.'],
    ['A square has 4 equal sides.', 0, 'All 4 sides of a square are the same length.'],
    ['A circle has straight sides.', 2, 'A circle is curved all the way round.'],
    ['A shape with 3 corners is a triangle.', 0, '3 corners means 3 sides, so it is a triangle.'],
    ['A rectangle is long and thin.', 1, 'Some rectangles are long and thin. A square is a rectangle that is not.'],
    ['A pentagon has 5 corners.', 0, 'Every pentagon has 5 sides and 5 corners.'],
    ['A square is round.', 2, 'A square has straight sides and corners, so it is never round.'],
    ['A shape with 6 sides is a hexagon.', 0, 'Any flat shape with 6 sides is a hexagon.'],
    ['A triangle has 4 corners.', 2, 'A triangle always has 3 corners.'],
    ['A shape with 4 sides has 4 corners.', 0, 'Each side meets the next one at a corner, so 4 sides make 4 corners.'],
    ['An oval has corners.', 2, 'An oval is curved all the way round.'],
    ['A triangle points up.', 1, 'A triangle can be turned to point any way.'],
    ['A shape is blue.', 1, 'Some shapes are blue, but shapes can be any color.'],
    ['A big shape has more sides than a small one.', 1, 'A big hexagon has more sides than a small square, but a big triangle has fewer.'],
    ['A square is a rectangle.', 0, 'A square has 4 square corners, so it is a special rectangle.'],
    ['A triangle has a curved side.', 2, 'All 3 sides of a triangle are straight.'],
    ['A rectangle has 4 square corners.', 0, 'Every rectangle has 4 square corners.'],
    ['A shape with 4 sides is a rectangle.', 1, 'Some are rectangles, but a rhombus or a trapezoid also has 4 sides.'],
    ['A circle is round.', 0, 'A circle is round all the way around.'],
    ['A hexagon has 5 corners.', 2, 'A hexagon always has 6 corners.'],
    ['A triangle has 3 sides of the same length.', 1, 'Some triangles have 3 equal sides, but many do not.'],
    ['A pentagon has 6 sides.', 2, 'A pentagon always has 5 sides.'],
    ['A shape with 5 sides is a pentagon.', 0, 'Any flat shape with 5 straight sides is a pentagon.'],
    ['A square is big.', 1, 'Squares can be any size.']];
  const exSides = { square: 4, rectangle: 4, rhombus: 4, trapezoid: 4, triangle: 3, pentagon: 5, hexagon: 6, circle: 0 };
  E1.skill({ id: 'I.5.11', name: 'Always, sometimes, never', steps: {
    a: { t: 'about shapes', g: R => { const [s, a, e] = R.pick(SHAPE_ST); return choiceFixed(`Always, sometimes or never? <b>${s}</b>`, ASN, a, e); } },
    b: { t: 'about numbers', g: R => {
      const k = R.int(3, 20), d = R.int(0, 9), m = R.int(1, 9);
      const L = [[`A number bigger than ${k} is even.`, 1, `${k + 1} and ${k + 2} are both bigger than ${k}; one is odd and one is even.`],
        [`A number less than ${k} is less than ${k + m}.`, 0, `Anything below ${k} is below ${k + m} too.`],
        [`An even number ends in ${d}.`, d % 2 ? 2 : 1, d % 2 ? `Even numbers end in 0, 2, 4, 6 or 8, never ${d}.` : `Some even numbers end in ${d}, others end in another even digit.`],
        ['An odd number + 1 is even.', 0, 'The left-over one gets a partner, so it is even.'],
        ['An even number + 2 is odd.', 2, 'Adding a pair keeps it even.'],
        [`A number that ends in ${2 * R.int(0, 4) + 1} is even.`, 2, 'Numbers ending in 1, 3, 5, 7 or 9 are odd.'],
        [`A number between ${k} and ${k + 3} is odd.`, 1, `${k + 1} and ${k + 2} are between; one is odd, one is even.`],
        ['Adding 0 changes a number.', 2, 'Adding 0 adds nothing, so the number stays the same.'],
        ['Taking away 1 makes a number smaller.', 0, 'You have 1 less than before.'],
        [`${m} more than a number is bigger than it.`, 0, `Adding ${m} always makes it bigger.`]];
      const [s, a, e] = R.pick(L); return choiceFixed(`Always, sometimes or never? <b>${s}</b>`, ASN, a, e);
    } },
    c: { t: 'give an example', g: R => {
      if (R.bool(0.4)) {
        const want = R.pick([3, 4, 5, 6]), ks = Object.keys(exSides), good = R.pick(ks.filter(k => exSides[k] === want)), bad = R.sample(ks.filter(k => exSides[k] !== want), 3), c = R.pick(COLS);
        return choice(R, `Which shape has ${want} sides?`, V.shp_icon(good, { fill: c, w: 80 }), bad.map(k => V.shp_icon(k, { fill: c, w: 80 })), `Count the sides: this one has ${want}.`);
      }
      const k = R.int(6, 30), ev = R.bool(), big = R.bool(), par = x => (x % 2 === 0) === ev;
      const pickN = (lo, hi, p) => { const c = []; for (let x = lo; x <= hi; x++) if (p(x)) c.push(x); return R.pick(c); };
      const inR = big ? [k + 1, k + 15] : [1, k - 1], outR = big ? [1, k - 1] : [k + 1, k + 15];
      const good = pickN(inR[0], inR[1], par), ds = [pickN(inR[0], inR[1], x => !par(x)), pickN(outR[0], outR[1], par), pickN(outR[0], outR[1], x => !par(x))];
      return choice(R, `Pick ${ev ? 'an even' : 'an odd'} number ${big ? 'bigger' : 'smaller'} than ${k}.`, good, ds, `${good} is ${ev ? 'even' : 'odd'} and ${big ? 'bigger' : 'smaller'} than ${k}.`);
    } },
    d: { t: 'give a counterexample', g: R => {
      const t = R.int(0, 3), c = R.pick(COLS), ic = (k, o = {}) => V.shp_icon(k, Object.assign({ fill: c, w: 80 }, o));
      if (t === 0) { const k = R.int(5, 20), pk = (p, lo, hi) => { const a = []; for (let x = lo; x <= hi; x++) if (p(x)) a.push(x); return R.pick(a); };
        const good = pk(x => x % 2 === 1, k + 1, k + 20), e1 = pk(x => x % 2 === 0, k + 1, k + 20), e2 = pk(x => x % 2 === 1, 1, k - 1);
        return choice(R, `Claim: every number bigger than ${k} is even. Which number breaks the claim?`, good, [e1, e2, pk(x => x % 2 === 0 && x !== e1, k + 1, k + 20)], `${good} is bigger than ${k} but it is odd.`); }
      if (t === 1) { const good = R.pick(['rectangle', 'rhombus', 'trapezoid']);
        return choice(R, 'Claim: every shape with 4 sides is a square. Which shape breaks the claim?', ic(good), [ic('square'), ic('square', { rot: 45 }), ic('triangle')], `This ${good} has 4 sides, but it is not a square.`); }
      if (t === 2) return choice(R, 'Claim: every triangle points up. Which shape breaks the claim?', ic('triangle', { rot: R.pick([90, 180, 270]) }), [ic('triangle'), ic('triangle', { sx: 0.6, sy: 1.3 }), ic('square', { rot: 45 })], 'This triangle points another way, but it is still a triangle.');
      const [c1, c2] = R.sample(COLS, 2), k2 = R.pick(['square', 'triangle', 'star']);
      return choice(R, `Claim: every ${cn(c1)} shape is a circle. Which shape breaks the claim?`, V.shp_icon(k2, { fill: c1, w: 80 }), [V.shp_icon('circle', { fill: c1, w: 80 }), V.shp_icon(k2, { fill: c2, w: 80 }), V.shp_icon('circle', { fill: c2, w: 80 })], `This ${k2} is ${cn(c1)}, but it is not a circle.`);
    } },
  } });

  /* ---------- I.5.12 If–then ---------- */
  const EVERY = [['If it rains, we take an umbrella.', 'It rains.', 'We take an umbrella.'], ['If the light is red, cars stop.', 'The light is red.', 'Cars stop.'], ['If you are cold, you put on a coat.', 'You are cold.', 'You put on a coat.'], ['If the bell rings, class starts.', 'The bell rings.', 'Class starts.'], ['If it is dark, we turn on the lamp.', 'It is dark.', 'We turn on the lamp.'], ['If the dog is hungry, we feed it.', 'The dog is hungry.', 'We feed the dog.'], ['If you drop a ball, it falls.', 'You drop a ball.', 'The ball falls.'], ['If ice gets warm, it melts.', 'The ice gets warm.', 'The ice melts.'], ['If the plant is dry, we water it.', 'The plant is dry.', 'We water the plant.'], ['If you win, you get a sticker.', 'You win.', 'You get a sticker.'], ['If the cup is full, we stop pouring.', 'The cup is full.', 'We stop pouring.'], ['If it snows, we wear boots.', 'It snows.', 'We wear boots.']];
  const RULES = [
    [k => `is more than ${k}`, k => `is not more than ${k}`, (n, k) => n > k], [k => `is less than ${k}`, k => `is not less than ${k}`, (n, k) => n < k],
    [() => 'is even', () => 'is not even', n => n % 2 === 0], [() => 'is odd', () => 'is not odd', n => n % 2 === 1], [() => 'ends in 5', () => 'does not end in 5', n => n % 10 === 5]];
  const PRIZE = [['gets a star', n => `Does ${n} get a star?`], ['is colored blue', n => `Is ${n} colored blue?`], ['gets a clap', n => `Does ${n} get a clap?`]];
  E1.skill({ id: 'I.5.12', name: 'If–then', steps: {
    a: { t: 'everyday if–then', g: R => { const [r, f, res] = R.pick(EVERY); return choice(R, `${r} ${f} What happens?`, res, R.sample(EVERY.filter(e => e[2] !== res), 2).map(e => e[2]), `The rule says: ${r.toLowerCase()} ${f} So: ${res.toLowerCase()}`); } },
    b: { t: 'with numbers', g: R => {
      const [txt, neg, p] = R.pick(RULES), k = R.int(5, 20), want = R.bool(), pool = Array.from({ length: 40 }, (_, i) => i + 1).filter(x => p(x, k) === want), n = R.pick(pool), yes = p(n, k), [prize, ask] = R.pick(PRIZE);
      return choiceFixed(`If a number ${txt(k)}, it ${prize}. ${ask(n)}`, YN, yes ? 0 : 1, `${n} ${yes ? txt(k) : neg(k)}, so the answer is ${yes ? 'yes' : 'no'}.`);
    } },
    c: { t: 'follow a rule', g: R => {
      if (R.bool()) { const k = R.int(6, 15), a = R.int(1, 5), b = R.int(1, 5), n = R.int(Math.max(b, 1), 20), out = n < k ? n + a : n - b;
        return num(`If the number is less than ${k}, add ${a}. If not, take away ${b}. Start with ${n}.`, out, `${n} is ${n < k ? '' : 'not '}less than ${k}, so ${n} ${n < k ? '+ ' + a : '− ' + b} = ${out}.`); }
      const a = R.int(1, 3), b = R.int(4, 6), n = R.int(1, 30), out = n % 2 ? n + a : n + b;
      return num(`If the number is odd, add ${a}. If it is even, add ${b}. Start with ${n}.`, out, `${n} is ${oe(n)}, so add ${n % 2 ? a : b}: ${out}.`);
    } },
    d: { t: 'test a rule', g: R => {
      const t = R.int(0, 2);
      if (t === 0) { const want = R.pick([3, 4]), ks = Object.keys(exSides), c = R.pick(COLS), good = R.sample(ks.filter(k => exSides[k] === want), want === 3 ? 1 : 3), bad = R.pick(ks.filter(k => exSides[k] !== want && k !== 'circle'));
        const g3 = want === 3 ? [V.shp_icon('triangle', { fill: c, w: 80 }), V.shp_icon('triangle', { fill: c, w: 80, rot: 180 }), V.shp_icon('triangle', { fill: c, w: 80, sx: 0.6, sy: 1.3 })] : good.map(k => V.shp_icon(k, { fill: c, w: 80 }));
        return choice(R, `Rule: every shape here has ${want} sides. Which one breaks it?`, V.shp_icon(bad, { fill: c, w: 80 }), g3, `This one has ${exSides[bad]} sides, not ${want}.`); }
      if (t === 1) { const [c, c2] = R.sample(COLS, 2), ks = R.sample(PSH, 4);
        return choice(R, `Rule: every shape here is ${cn(c)}. Which one breaks it?`, V.shp_icon(ks[3], { fill: c2, w: 80 }), ks.slice(0, 3).map(k => V.shp_icon(k, { fill: c, w: 80 })), `This one is ${cn(c2)}, not ${cn(c)}.`); }
      const [txt, neg, p] = R.pick(RULES.slice(0, 4)), k = R.int(8, 20), yes = [], no = [];
      for (let x = 1; x <= 40; x++) (p(x, k) ? yes : no).push(x);
      const bad = R.pick(no);
      return choice(R, `Rule: every number here ${txt(k)}. Which one breaks it?`, bad, R.sample(yes, 3), `${bad} ${neg(k)}.`);
    } },
  } });

  /* ---------- I.5.13 Logic grid puzzles ---------- */
  const THINGS = [['cat', 'dog', 'fish'], ['apple', 'pear', 'plum'], ['kite', 'ball', 'drum'], ['bike', 'car', 'boat'], ['red hat', 'blue hat', 'green hat']];
  V.shp_lgrid = function (names, things) {
    const cw = 76, nw = 56, rh = 30, W = nw + things.length * cw + 4, H = rh * (names.length + 1) + 4;
    let b = '';
    things.forEach((t, j) => b += V.text(nw + j * cw + cw / 2 + 2, rh / 2 + 2, t, { size: 13, weight: 700 }));
    names.forEach((n, i) => { b += V.text(4, rh * (i + 1.5) + 2, n, { size: 14, weight: 700, anchor: 'start' }); things.forEach((_, j) => b += `<rect x="${nw + j * cw + 2}" y="${rh * (i + 1) + 2}" width="${cw}" height="${rh}" fill="${C.paper}" stroke="${C.line}" stroke-width="1.5"/>`); });
    return V.svg(W, H, b, 'logic grid');
  };
  const puzzle3 = (R, style) => {
    const P = R.sample(NAMES, 3), T = R.pick(THINGS), has = R.shuffle([0, 1, 2]); // person i has T[has[i]]
    let clues;
    if (style === 'b') clues = [`${P[0]} has the ${T[has[0]]}.`, `${P[1]} does not have the ${T[has[2]]}.`];
    else clues = R.shuffle([`${P[0]} does not have the ${T[has[1]]}.`, `${P[0]} does not have the ${T[has[2]]}.`, `${P[1]} does not have the ${T[has[2]]}.`]);
    return { P, T, has, clues, vis: V.shp_lgrid(R.shuffle(P), T) };
  };
  E1.skill({ id: 'I.5.13', name: 'Logic grid puzzles', steps: {
    a: { t: '2 by 2', g: R => {
      const P = R.sample(NAMES, 2), T = R.sample(R.pick(THINGS), 2), neg = R.bool(), who = R.int(0, 1), th = R.int(0, 1);
      // P[who] has T[th] (neg clue: P[who] does not have T[1-th])
      const clue = neg ? `${P[who]} does not have the ${T[1 - th]}.` : `${P[who]} has the ${T[th]}.`;
      const other = P[1 - who];
      if (R.bool()) return choice(R, `${clue} Who has the ${T[1 - th]}?`, other, [P[who]], `${P[who]} has the ${T[th]}, so ${other} has the ${T[1 - th]}.`, { visual: V.shp_lgrid(P, T) });
      return choice(R, `${clue} What does ${other} have?`, 'the ' + T[1 - th], ['the ' + T[th]], `${P[who]} has the ${T[th]}, so ${other} has the ${T[1 - th]}.`, { visual: V.shp_lgrid(P, T) });
    } },
    b: { t: '3 by 3', g: R => {
      const Z = puzzle3(R, 'b'), { P, T, has } = Z, why = `${P[0]} has the ${T[has[0]]}. ${P[1]} can't have the ${T[has[2]]}, so ${P[1]} has the ${T[has[1]]}. ${P[2]} has the ${T[has[2]]}.`;
      if (R.bool()) { const i = R.int(1, 2); return choice(R, `${Z.clues.join(' ')} Who has the ${T[has[i]]}?`, P[i], P.filter((_, j) => j !== i), why, { visual: Z.vis }); }
      return choice(R, `${Z.clues.join(' ')} What does ${P[2]} have?`, 'the ' + T[has[2]], ['the ' + T[has[0]], 'the ' + T[has[1]]], why, { visual: Z.vis });
    } },
    c: { t: 'use every clue', g: R => {
      const Z = puzzle3(R, 'c'), { P, T, has } = Z, why = `${P[0]} must have the ${T[has[0]]}. Then ${P[1]} has the ${T[has[1]]}, and ${P[2]} has the ${T[has[2]]}.`;
      if (R.bool()) return choice(R, `${Z.clues.join(' ')} What does ${P[2]} have?`, 'the ' + T[has[2]], ['the ' + T[has[0]], 'the ' + T[has[1]]], why, { visual: Z.vis });
      return choice(R, `${Z.clues.join(' ')} Who has the ${T[has[1]]}?`, P[1], [P[0], P[2]], why, { visual: Z.vis });
    } },
    d: { t: 'choose the reason', g: R => {
      // Pick the reason that shows who has what (4 targets across the two puzzle styles).
      const st = R.pick(['b', 'c']), Z = puzzle3(R, st), { P, T, has } = Z, t = R.int(0, 1), th = k => T[has[k]];
      let who, it, ok, bad, why;
      if (st === 'b' && t === 0) { who = P[1]; it = th(1); ok = `${P[0]} has the ${th(0)}, and ${P[1]} can't have the ${th(2)}.`; bad = [`${P[2]} has the ${th(0)}, and ${P[1]} can't have the ${th(1)}.`, `${P[0]} has the ${th(2)}, and ${P[1]} can't have the ${th(0)}.`]; why = `${P[0]} has the ${th(0)}, and ${P[1]} can't have the ${th(2)}. Only the ${th(1)} is left for ${P[1]}.`; }
      else if (st === 'b') { who = P[2]; it = th(2); ok = `${P[0]} has the ${th(0)}, and ${P[1]} has the ${th(1)}.`; bad = [`${P[0]} has the ${th(2)}, and ${P[1]} has the ${th(1)}.`, `${P[1]} has the ${th(2)}, and ${P[0]} has the ${th(1)}.`]; why = `${P[0]} has the ${th(0)}. ${P[1]} can't have the ${th(2)}, so ${P[1]} has the ${th(1)}. Only the ${th(2)} is left for ${P[2]}.`; }
      else if (t === 0) { who = P[2]; it = th(2); ok = `${P[0]} and ${P[1]} can't have the ${th(2)}.`; bad = [`${P[2]} and ${P[1]} can't have the ${th(2)}.`, `${P[0]} and ${P[2]} can't have the ${th(2)}.`]; why = `The clues say ${P[0]} and ${P[1]} can't have the ${th(2)}. So ${P[2]} has it.`; }
      else { who = P[0]; it = th(0); ok = `${P[0]} can't have the ${th(1)} or the ${th(2)}.`; bad = [`${P[0]} can't have the ${th(0)} or the ${th(1)}.`, `${P[0]} can't have the ${th(0)} or the ${th(2)}.`]; why = `The clues say ${P[0]} can't have the ${th(1)} or the ${th(2)}. Only the ${th(0)} is left.`; }
      return choice(R, `${Z.clues.join(' ')} ${who} has the ${it}. Why?`, ok, bad, why, { visual: Z.vis });
    } },
  } });

  /* ---------- I.5.14 Order by clues ---------- */
  const CMP = [['taller', 'shorter', 'tallest', 'shortest'], ['older', 'younger', 'oldest', 'youngest'], ['faster', 'slower', 'fastest', 'slowest'], ['heavier', 'lighter', 'heaviest', 'lightest']];
  E1.skill({ id: 'I.5.14', name: 'Order by clues', steps: {
    a: { t: 'taller and shorter clues', g: R => {
      const [A, B] = R.sample(NAMES, 2), w = R.pick(CMP.slice(0, 2)), flip = R.bool(), askUp = R.bool();
      const clue = flip ? `${B} is ${w[1]} than ${A}.` : `${A} is ${w[0]} than ${B}.`;
      return choice(R, `${clue} Who is ${askUp ? w[0] : w[1]}?`, askUp ? A : B, [askUp ? B : A], `${A} is ${w[0]} and ${B} is ${w[1]}.`);
    } },
    b: { t: 'first and last clues', g: R => {
      const P = R.sample(NAMES, 3), t = R.int(0, 2); // order P[0],P[1],P[2]
      if (t === 0) return choice(R, `3 kids stand in a line. ${P[0]} is first. ${P[2]} is last. Who is in the middle?`, P[1], [P[0], P[2]], `First and last are taken, so ${P[1]} is in the middle.`);
      if (t === 1) return choice(R, `3 kids stand in a line. ${P[1]} is in the middle. ${P[0]} is first. Who is last?`, P[2], [P[0], P[1]], `Only ${P[2]} is left, so ${P[2]} is last.`);
      return choice(R, `3 kids stand in a line. ${P[2]} is last. ${P[1]} is not first. Who is first?`, P[0], [P[1], P[2]], `${P[2]} is last and ${P[1]} is not first, so ${P[0]} is first.`);
    } },
    c: { t: 'three people', g: R => {
      const P = R.sample(NAMES, 3), w = R.pick(CMP); // P[0] most … P[2] least
      const c1 = R.bool() ? `${P[0]} is ${w[0]} than ${P[1]}.` : `${P[1]} is ${w[1]} than ${P[0]}.`, c2 = R.bool() ? `${P[1]} is ${w[0]} than ${P[2]}.` : `${P[2]} is ${w[1]} than ${P[1]}.`;
      const q = R.int(0, 2), ask = [w[2], 'in the middle', w[3]][q];
      return choice(R, `${R.shuffle([c1, c2]).join(' ')} Who is ${ask}?`, P[q], P.filter((_, i) => i !== q), `In order: ${P[0]}, ${P[1]}, ${P[2]}. So ${P[q]} is ${ask}.`);
    } },
    d: { t: 'with numbers', g: R => {
      const P = R.sample(NAMES, 3), a = R.int(4, 12), m = R.int(1, 4), l = R.int(1, 3), v = [a, a + m, a - l];
      const txt = `${P[0]} has ${a} shells. ${P[1]} has ${m} more than ${P[0]}. ${P[2]} has ${l} fewer than ${P[0]}.`;
      const t = R.int(0, 2);
      if (t === 2) return num(`${txt} How many does ${P[1]} have?`, a + m, `${a} + ${m} = ${a + m}.`);
      const most = t === 0, idx = most ? 1 : 2;
      return choice(R, `${txt} Who has the ${most ? 'most' : 'fewest'}?`, P[idx], P.filter((_, i) => i !== idx), `${P[0]} has ${v[0]}, ${P[1]} has ${v[1]}, ${P[2]} has ${v[2]}.`);
    } },
  } });

  /* ---------- I.5.15 Guess my number ---------- */
  const CL = {
    btw: (a, b) => [`It is between ${a} and ${b}.`, x => x > a && x < b],
    par: e => [`It is ${e ? 'even' : 'odd'}.`, x => (x % 2 === 0) === e],
    gt: a => [`It is more than ${a}.`, x => x > a],
    lt: b => [`It is less than ${b}.`, x => x < b],
    end: d => [`It ends in ${d}.`, x => x % 10 === d],
  };
  const matches = set => { const m = []; for (let x = 0; x <= 100; x++) if (set.every(c => c[1](x))) m.push(x); return m; };
  E1.skill({ id: 'I.5.15', name: 'Guess my number', steps: {
    a: { t: 'bigger or smaller clues', g: R => { const n = R.int(2, 40); return R.bool() ? num(`My number is bigger than ${n - 1} and smaller than ${n + 1}. What is it?`, n, `Only ${n} is between ${n - 1} and ${n + 1}.`) : num(`My number is smaller than ${n + 1} and bigger than ${n - 1}. What is it?`, n, `${n - 1}, ?, ${n + 1}: the number is ${n}.`); } },
    b: { t: 'odd or even clues', g: R => { const a = R.int(1, 40), n = R.pick([a + 1, a + 2]); return num(`My number is between ${a} and ${a + 3}. It is ${oe(n)}. What is it?`, n, `${a + 1} and ${a + 2} are between. Only ${n} is ${oe(n)}.`); } },
    c: { t: 'two clues together', g: R => {
      const t = R.int(0, 2);
      if (t === 0) { const k = R.int(1, 8), d = R.int(1, 9), n = 10 * k + d; return num(`My number is between ${10 * k} and ${10 * k + 10}. It ends in ${d}. What is it?`, n, `Between ${10 * k} and ${10 * k + 10}, only ${n} ends in ${d}.`); }
      if (t === 1) { let a; do a = R.int(3, 60); while (a % 5 === 0 || a % 5 === 4); const n = 5 * Math.ceil(a / 5); return num(`You say my number when you count by 5s. It is between ${a} and ${a + 5}. What is it?`, n, `Counting by 5s, only ${n} is between ${a} and ${a + 5}.`); }
      const n = R.int(5, 50), e = n % 2 === 0; return num(`My number is more than ${n - 2} and less than ${n + 2}. It is ${e ? 'even' : 'odd'}. What is it?`, n, `${n - 1}, ${n}, ${n + 1} fit. Only ${n} is ${e ? 'even' : 'odd'}.`);
    } },
    d: { t: 'choose good clues', g: R => {
      const n = R.int(4, 40), e = n % 2 === 0;
      const goods = [[CL.btw(n - 1, n + 1)], [CL.btw(n - 2, n + 2), CL.par(e)], [CL.gt(n - 1), CL.lt(n + 1)], [CL.btw(n - 2, n + 1), CL.par(e)], [CL.btw(n - 1, n + 2), CL.par(e)]];
      const bads = [[CL.par(e)], [CL.gt(n - 3), CL.lt(n + 3)], [CL.btw(n - 3, n + 3), CL.par(e)], [CL.lt(n + 1), CL.par(e)], [CL.btw(n, n + 3)], [CL.gt(n - 1), CL.par(e)], [CL.end(n % 10)], [CL.btw(n - 1, n + 1), CL.par(!e)]];
      const good = R.pick(goods), txt = s => s.map(c => c[0]).join(' ');
      const m = matches(good); if (m.length !== 1 || m[0] !== n) throw new Error('I.5.15d bad good clue');
      const bad = R.sample(bads.filter(s => { const q = matches(s); return !(q.length === 1 && q[0] === n); }), 2);
      return choice(R, `Which clues point to only <b>${n}</b>?`, txt(good), bad.map(txt), `Only ${n} fits every clue: ${txt(good)}`);
    } },
  } });
})();

/* Era I · Unit I.6 Shape & space (I.6.01–I.6.14)
   Uses the shared V.shp_* flat-shape helpers (same guarded block as i5.js); everything else lives under S6 inside this file. */
(function () {
  const { num, choice, choiceFixed, tf, V, C } = E1;

  /* ---------- shared shape helpers (prefix V.shp_). Defined identically in i5.js and i6.js, guarded, so either file works alone. ---------- */
  const f1 = v => +(+v).toFixed(1);
  // lighten (t>0) or darken (t<0) a #rrggbb color
  V.shp_mix = V.shp_mix || function (hex, t) {
    const n = parseInt(hex.slice(1), 16), ch = [n >> 16, n >> 8 & 255, n & 255];
    return '#' + ch.map(c => Math.round(t >= 0 ? c + (255 - c) * t : c * (1 + t)).toString(16).padStart(2, '0')).join('');
  };
  // unit outlines (y points down). Curved kinds are drawn as fine polygons so rotate/stretch work the same way.
  V.shp_unit = V.shp_unit || (function () {
    const reg = (n, a0) => Array.from({ length: n }, (_, i) => { const a = a0 + i * 2 * Math.PI / n; return [Math.cos(a), Math.sin(a)]; });
    const arc = (a0, a1, n, rx = 1, ry = 1) => Array.from({ length: n + 1 }, (_, i) => { const a = a0 + (a1 - a0) * i / n; return [rx * Math.cos(a), ry * Math.sin(a)]; });
    return {
      circle: () => arc(0, 2 * Math.PI, 48).slice(0, 48),
      oval: () => arc(0, 2 * Math.PI, 48, 1, 0.58).slice(0, 48),
      semicircle: () => arc(Math.PI, 2 * Math.PI, 24),
      triangle: () => reg(3, -Math.PI / 2),
      square: () => [[-1, -1], [1, -1], [1, 1], [-1, 1]],
      rectangle: () => [[-1.7, -1], [1.7, -1], [1.7, 1], [-1.7, 1]],
      rhombus: () => [[0, -1.35], [0.8, 0], [0, 1.35], [-0.8, 0]],
      trapezoid: () => [[-0.5, -0.866], [0.5, -0.866], [1, 0], [-1, 0]],
      pentagon: () => reg(5, -Math.PI / 2),
      hexagon: () => reg(6, 0),
      octagon: () => reg(8, Math.PI / 8),
      star: () => Array.from({ length: 10 }, (_, i) => { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 0.45 : 1; return [r * Math.cos(a), r * Math.sin(a)]; }),
    };
  })();
  V.shp_sides = V.shp_sides || { circle: 0, oval: 0, semicircle: 1, triangle: 3, square: 4, rectangle: 4, rhombus: 4, trapezoid: 4, pentagon: 5, hexagon: 6, octagon: 8, star: 10 };
  // points of a kind (or a raw point list) → stretched (sx,sy), rotated (rot°), then either fitted into a 2r box at cx,cy or scaled by o.scale around cx,cy
  V.shp_pts = V.shp_pts || function (kind, cx, cy, r, o = {}) {
    let p = Array.isArray(kind) ? kind.map(q => q.slice()) : V.shp_unit[kind]();
    const sx = o.sx || 1, sy = o.sy || 1, a = (o.rot || 0) * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
    p = p.map(([x, y]) => [x * sx, y * sy]).map(([x, y]) => [x * c - y * s, x * s + y * c]);
    if (o.scale) return p.map(([x, y]) => [cx + x * o.scale, cy + y * o.scale]);
    const xs = p.map(q => q[0]), ys = p.map(q => q[1]), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const k = 2 * r / Math.max(x1 - x0, y1 - y0), mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
    return p.map(([x, y]) => [cx + (x - mx) * k, cy + (y - my) * k]);
  };
  V.shp_poly = V.shp_poly || function (pts, o = {}) {
    const fill = o.fill || C.blue, stroke = o.stroke || (fill === 'none' ? C.ink : V.shp_mix(fill, -0.28));
    return `<polygon points="${pts.map(q => f1(q[0]) + ',' + f1(q[1])).join(' ')}" fill="${fill}" stroke="${stroke}" stroke-width="${o.sw || 2.5}" stroke-linejoin="round"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}/>`;
  };
  // one flat shape as an SVG fragment
  V.shp_draw = V.shp_draw || function (kind, cx, cy, r, o = {}) { return V.shp_poly(V.shp_pts(kind, cx, cy, r, o), o); };
  // one shape as its own small SVG (for picture choices)
  V.shp_icon = V.shp_icon || function (kind, o = {}) {
    const w = o.w || 90, h = o.h || w, r = o.r || Math.min(w, h) * 0.4;
    return V.svg(w, h, V.shp_draw(kind, w / 2, h / 2, r, o), o.label || 'shape');
  };


  /* ================= I.6 helpers (S6) ================= */
  const S6 = {};
  const mix = V.shp_mix, U = V.shp_unit;
  const COLS = [C.red, C.blue, C.amber, C.teal, C.violet, C.pink];
  const cn = c => E1.colorName[c];
  const aan = w => (/^[aeiou]/.test(w) ? 'an ' : 'a ') + w;
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  const P2 = pts => pts.map(q => f1(q[0]) + ',' + f1(q[1])).join(' ');
  const INK = `stroke="${C.ink}" stroke-width="2" stroke-linejoin="round" vector-effect="non-scaling-stroke"`;
  const pl = w => w === 'rhombus' ? 'rhombuses' : w + 's', plural = (n, w) => n + ' ' + (n === 1 ? w : pl(w));
  const yn = (prompt, yes, explain, extra) => choiceFixed(prompt, ['yes', 'no'], yes ? 0 : 1, explain, extra);
  const h3 = Math.sqrt(3) / 2;

  // bounding box accumulator
  const BB = () => { const b = { x0: 1e9, y0: 1e9, x1: -1e9, y1: -1e9 }; b.add = (x, y) => { b.x0 = Math.min(b.x0, x); b.y0 = Math.min(b.y0, y); b.x1 = Math.max(b.x1, x); b.y1 = Math.max(b.y1, y); return b; }; b.pts = ps => { ps.forEach(p => b.add(p[0], p[1])); return b; }; return b; };
  // wrap a body drawn in local coords: natural size (no o.w) or fitted & centered into w×h
  S6.wrap = (body, b, o = {}) => {
    const pad = o.pad === undefined ? 6 : o.pad, bw = Math.max(1, b.x1 - b.x0), bh = Math.max(1, b.y1 - b.y0);
    if (!o.w) return V.svg(Math.ceil(bw + 2 * pad), Math.ceil(bh + 2 * pad), `<g transform="translate(${f1(pad - b.x0)} ${f1(pad - b.y0)})">${body}</g>`, o.label || '');
    const w = o.w, h = o.h || w, k = Math.min((w - 2 * pad) / bw, (h - 2 * pad) / bh, o.kmax || 99);
    return V.svg(w, h, `<g transform="translate(${f1(w / 2 - k * (b.x0 + b.x1) / 2)} ${f1(h / 2 - k * (b.y0 + b.y1) / 2)}) scale(${+k.toFixed(3)})">${body}</g>`, o.label || '');
  };

  /* ---- flat shapes ---- */
  const TRI = { eq: U.triangle(), right: [[-1, 0.8], [1, 0.8], [-1, -0.8]], tall: [[-0.35, 1.2], [0.35, 1.2], [0, -1.2]], scal: [[-1, 0.6], [1.2, 0.6], [-0.4, -0.7]], obt: [[-0.6, 0.5], [1.2, 0.5], [-1.3, -0.5]], wide: [[-1.5, 0.35], [1.5, 0.35], [0.3, -0.35]] };
  const TRIK = Object.keys(TRI);
  const SIDES = { circle: 0, oval: 0, triangle: 3, square: 4, rectangle: 4, rhombus: 4, trapezoid: 4, pentagon: 5, hexagon: 6, octagon: 8 };
  // raw outline of a named kind (random variant unless o fixes it)
  S6.pts = (R, kind, o = {}) => {
    switch (kind) {
      case 'triangle': return TRI[o.tri || R.pick(TRIK)];
      case 'rectangle': { const a = o.a || R.pick([1.5, 1.8, 2.2]), p = [[-a, -1], [a, -1], [a, 1], [-a, 1]]; return (o.tall === undefined ? R.bool(0.3) : o.tall) ? p.map(([x, y]) => [y, x]) : p; }
      case 'hexagon': return (o.reg || R.bool(0.7)) ? U.hexagon() : U.hexagon().map(([x, y]) => [x * 1.35, y]);
      case 'trapezoid': return R.bool(0.7) ? U.trapezoid() : [[-1, 0.6], [1, 0.6], [0.1, -0.6], [-1, -0.6]];
      case 'rhombus': return R.bool() ? U.rhombus() : U.rhombus().map(([x, y]) => [y, x]);
      default: return U[kind]();
    }
  };
  S6.icon = (pts, o = {}) => V.shp_icon(pts, { w: o.w || 90, h: o.h, fill: o.fill || C.blue, rot: o.rot || 0, r: o.r, dash: o.dash, stroke: o.stroke, sw: o.sw });
  const kIcon = (R, kind, fill, o = {}) => S6.icon(S6.pts(R, kind, o), Object.assign({ fill }, o));
  // irregular n-gon with clear corners
  S6.irreg = (R, n) => {
    for (let t = 0; t < 400; t++) {
      const st = 2 * Math.PI / n, a0 = R.f() * st;
      const p = Array.from({ length: n }, (_, i) => { const a = a0 + i * st + (R.f() - 0.5) * st * 0.5, r = 0.72 + R.f() * 0.28; return [r * Math.cos(a), r * Math.sin(a)]; });
      const ok = p.every((q, i) => { const a = p[(i + n - 1) % n], b = p[(i + 1) % n], v1 = [a[0] - q[0], a[1] - q[1]], v2 = [b[0] - q[0], b[1] - q[1]]; const ang = Math.acos((v1[0] * v2[0] + v1[1] * v2[1]) / Math.hypot(...v1) / Math.hypot(...v2)) * 180 / Math.PI; return ang < 150 && ang > 35; })
        && p.every((q, i) => Math.hypot(q[0] - p[(i + 1) % n][0], q[1] - p[(i + 1) % n][1]) > 0.35);
      if (ok) return p;
    }
    throw new Error('irreg failed ' + n);
  };
  const CONC = { 4: [[0, -1], [1, 1], [0, 0.3], [-1, 1]], 5: [[0, 0], [2, 0], [2, 1.5], [1, 0.8], [0, 1.5]], 6: [[0, 0], [2, 0], [2, 1], [1, 1], [1, 2], [0, 2]], 7: [[0, -0.4], [1.2, -0.4], [1.2, -1], [2.3, 0], [1.2, 1], [1.2, 0.4], [0, 0.4]], 8: [[0, 0], [3, 0], [3, 1], [2, 1], [2, 2.4], [1, 2.4], [1, 1], [0, 1]] };
  S6.nGon = (R, n) => (CONC[n] && R.bool(0.35)) ? CONC[n] : S6.irreg(R, n);

  // 'not-shapes': mode 'gap' (not closed) or 'curve' (one side bent out, or in with o.inward)
  S6.notShape = (pts, mode, o = {}) => {
    const n = pts.length, i = o.side || 0, col = o.fill || C.blue, pt = q => f1(q[0]) + ' ' + f1(q[1]);
    const cx = pts.reduce((s, q) => s + q[0], 0) / n, cy = pts.reduce((s, q) => s + q[1], 0) / n;
    if (mode === 'gap') {
      const s = (i + 1) % n; let d = 'M' + pt(pts[s]);
      for (let k = 1; k < n; k++) d += ' L' + pt(pts[(s + k) % n]);
      const a = pts[i], b = pts[s]; d += ' L' + pt([a[0] + (b[0] - a[0]) * 0.5, a[1] + (b[1] - a[1]) * 0.5]);
      return `<path d="${d}" fill="none" stroke="${mix(col, -0.28)}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>`;
    }
    let d = 'M' + pt(pts[0]);
    for (let k = 0; k < n; k++) {
      const a = pts[k], b = pts[(k + 1) % n];
      if (k === i) {
        const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, L = Math.hypot(b[0] - a[0], b[1] - a[1]); let nx = -(b[1] - a[1]) / L, ny = (b[0] - a[0]) / L;
        if (nx * (mx - cx) + ny * (my - cy) < 0) { nx = -nx; ny = -ny; }
        const s = (o.inward ? -0.7 : 1) * L * 0.5; d += ` Q${pt([mx + nx * s, my + ny * s])} ${pt(b)}`;
      } else d += ' L' + pt(b);
    }
    return `<path d="${d} Z" fill="${col}" stroke="${mix(col, -0.28)}" stroke-width="2.5" stroke-linejoin="round"/>`;
  };
  S6.notIcon = (pts, mode, o = {}) => { const w = o.w || 90; return V.svg(w, w, S6.notShape(V.shp_pts(pts, w / 2, w / 2 + (mode === 'curve' && !o.inward ? 0 : 0), w * (mode === 'curve' && !o.inward ? 0.3 : 0.36), { rot: o.rot || 0 }), mode, o), 'shape'); };

  /* ---- solids (flat isometric drawings) ---- */
  const iso = (x, y, z, u) => [(x - y) * h3 * u, (x + y) * 0.5 * u - z * u];
  const ply = (pts, fill, b) => { if (b) b.pts(pts); return `<polygon points="${P2(pts)}" fill="${fill}" ${INK}/>`; };
  const tints = col => [mix(col, 0.72), mix(col, 0.45), mix(col, 0.18)];
  const HL = C.amber;
  // one solid with its base center at screen (o.ox,o.oy); adds to bbox b. o.hl = face to color yellow
  S6.solidBody = (kind, o, b) => {
    const u = o.u || 40, [t1, t2, t3] = tints(o.fill || C.blue), hl = f => o.hl === f, ox = o.ox || 0, oy = o.oy || 0;
    const Q = (x, y, z) => { const p = iso(x, y, z, u); return [p[0] + ox, p[1] + oy]; };
    if (kind === 'cube' || kind === 'box') {
      const [a, bb, h] = kind === 'cube' ? [1, 1, 1] : (o.dims || [2, 1, 1.3]), A = a / 2, B = bb / 2;
      const top = [Q(-A, -B, h), Q(A, -B, h), Q(A, B, h), Q(-A, B, h)], rt = [Q(A, -B, 0), Q(A, B, 0), Q(A, B, h), Q(A, -B, h)], lf = [Q(-A, B, 0), Q(A, B, 0), Q(A, B, h), Q(-A, B, h)];
      return ply(lf, hl('left') ? HL : t2, b) + ply(rt, hl('right') ? HL : t3, b) + ply(top, hl('top') ? HL : t1, b);
    }
    if (kind === 'pyramid') {
      const A = o.pa || 0.6, ap = Q(0, 0, o.ph || 1.3);
      return ply([Q(-A, A, 0), Q(A, A, 0), ap], hl('left') ? HL : t2, b) + ply([Q(A, -A, 0), Q(A, A, 0), ap], hl('right') ? HL : t3, b);
    }
    const r = (o.r || 0.8) * u, ry = r * 0.35, cx = ox, cy = oy, F = f1;
    if (kind === 'cylinder') {
      const H = (o.ch || 1.3) * u; b.add(cx - r, cy - H - ry).add(cx + r, cy + ry);
      return `<path d="M${F(cx - r)} ${F(cy - H)} L${F(cx - r)} ${F(cy)} A${F(r)} ${F(ry)} 0 0 0 ${F(cx + r)} ${F(cy)} L${F(cx + r)} ${F(cy - H)} Z" fill="${t2}" ${INK}/><ellipse cx="${F(cx)}" cy="${F(cy - H)}" rx="${F(r)}" ry="${F(ry)}" fill="${hl('top') ? HL : t1}" ${INK}/>`;
    }
    if (kind === 'cone') {
      const H = (o.ch || 1.5) * u;
      if (o.inv) { b.add(cx - r, cy - H - ry).add(cx + r, cy); return `<path d="M${F(cx - r)} ${F(cy - H)} L${F(cx)} ${F(cy)} L${F(cx + r)} ${F(cy - H)} Z" fill="${t2}" ${INK}/><ellipse cx="${F(cx)}" cy="${F(cy - H)}" rx="${F(r)}" ry="${F(ry)}" fill="${hl('top') ? HL : t1}" ${INK}/>`; }
      b.add(cx - r, cy - H).add(cx + r, cy + ry);
      return `<path d="M${F(cx)} ${F(cy - H)} L${F(cx - r)} ${F(cy)} A${F(r)} ${F(ry)} 0 0 0 ${F(cx + r)} ${F(cy)} Z" fill="${t2}" ${INK}/><path d="M${F(cx - r)} ${F(cy)} A${F(r)} ${F(ry)} 0 0 1 ${F(cx + r)} ${F(cy)}" fill="none" stroke="${C.ink}" stroke-width="1.2" stroke-dasharray="4 3" vector-effect="non-scaling-stroke"/>`;
    }
    if (kind === 'sphere') {
      const R0 = (o.r || 0.85) * u, c0 = cy - R0; b.add(cx - R0, c0 - R0).add(cx + R0, c0 + R0);
      return `<circle cx="${F(cx)}" cy="${F(c0)}" r="${F(R0)}" fill="${t1}" ${INK}/>` +
        `<path d="M${F(cx - R0)} ${F(c0)} A${F(R0)} ${F(R0 * 0.3)} 0 0 0 ${F(cx + R0)} ${F(c0)}" fill="none" stroke="${t3}" stroke-width="1.5" vector-effect="non-scaling-stroke"/>` +
        `<path d="M${F(cx - R0)} ${F(c0)} A${F(R0)} ${F(R0 * 0.3)} 0 0 1 ${F(cx + R0)} ${F(c0)}" fill="none" stroke="${t3}" stroke-width="1.2" stroke-dasharray="4 3" vector-effect="non-scaling-stroke"/>` +
        `<ellipse cx="${F(cx - R0 * 0.38)}" cy="${F(c0 - R0 * 0.45)}" rx="${F(R0 * 0.2)}" ry="${F(R0 * 0.12)}" fill="${C.paper}" opacity="0.8"/>`;
    }
    throw new Error('solid ' + kind);
  };
  S6.solid = (kind, o = {}) => { const b = BB(), body = S6.solidBody(kind, o, b); return S6.wrap(body, b, { w: o.w || 100, h: o.h, kmax: o.kmax || 1.15, label: 'solid' }); };
  const SOLN = { cube: 'cube', box: 'rectangular prism', sphere: 'sphere', cone: 'cone', cylinder: 'cylinder', pyramid: 'pyramid' };
  const FACES = { cube: 6, box: 6, pyramid: 5, cylinder: 2, cone: 1, sphere: 0 };
  const BOXDIMS = [[2.2, 1, 1], [2.4, 1.2, 0.8], [1, 1, 2.2], [2.2, 1.1, 1.3]];
  const solidPic = (R, k, fill, o = {}) => S6.solid(k, Object.assign({ fill, dims: k === 'box' ? R.pick(BOXDIMS) : undefined, w: 96 }, o));

  /* ---- cube buildings ---- */
  // cube buildings in a front (oblique) view: front faces are true squares, tops and right sides go back up-right
  S6.cubes = (list, o = {}) => {
    const u = o.u || 26, k = o.k || 0.42, [t1, t2, t3] = tints(o.fill || C.teal), b = BB();
    const P = (x, d, z) => [(x + k * d) * u, (-z - k * d) * u]; // d = depth: bigger is further back
    if (o.iso) { // floor plans: isometric view so every top is a clear diamond
      const body = list.slice().sort((p, q) => (p[0] + p[1] + p[2]) - (q[0] + q[1] + q[2])).map(([x, y, z]) => {
        const Q = (i, j, m) => iso(x + i, y + j, z + m, u);
        return ply([Q(0, 1, 0), Q(1, 1, 0), Q(1, 1, 1), Q(0, 1, 1)], t2, b) + ply([Q(1, 0, 0), Q(1, 1, 0), Q(1, 1, 1), Q(1, 0, 1)], t3, b) + ply([Q(0, 0, 1), Q(1, 0, 1), Q(1, 1, 1), Q(0, 1, 1)], t1, b);
      }).join('');
      return S6.wrap(body, b, { label: 'cube building' });
    }
    const body = list.slice().sort((p, q) => (q[1] - p[1]) || (p[2] - q[2]) || (p[0] - q[0])).map(([x, d, z]) => {
      const Q = (i, j, m) => P(x + i, d + j, z + m);
      return ply([Q(0, 0, 0), Q(1, 0, 0), Q(1, 0, 1), Q(0, 0, 1)], t2, b) + ply([Q(1, 0, 0), Q(1, 1, 0), Q(1, 1, 1), Q(1, 0, 1)], t3, b) + ply([Q(0, 0, 1), Q(1, 0, 1), Q(1, 1, 1), Q(0, 1, 1)], t1, b);
    }).join('');
    return S6.wrap(body, b, { label: 'cube building' });
  };
  const wallCubes = hs => hs.flatMap((h, i) => Array.from({ length: h }, (_, z) => [i, 0, z]));
  const floorCubes = cells => cells.map(([x, y]) => [x, y, 0]);
  const randFloor = (R, n) => {
    const cells = [[0, 0]], has = (x, y) => cells.some(c => c[0] === x && c[1] === y);
    let t = 0;
    while (cells.length < n && t++ < 500) { const [x, y] = R.pick(cells), [dx, dy] = R.pick([[1, 0], [-1, 0], [0, 1], [0, -1]]), nx = x + dx, ny = y + dy; if (!has(nx, ny) && Math.abs(nx) <= 2 && Math.abs(ny) <= 1) cells.push([nx, ny]); }
    return cells;
  };
  // canonical key of a floor plan up to moves, turns and flips
  const floorKey = cells => {
    const forms = [];
    for (let s = 0; s < 8; s++) {
      const m = cells.map(([x, y]) => { let a = x, b = y; if (s & 4) a = -a; for (let r = 0; r < (s & 3); r++) [a, b] = [-b, a]; return [a, b]; });
      const mx = Math.min(...m.map(c => c[0])), my = Math.min(...m.map(c => c[1]));
      forms.push(m.map(([a, b]) => (a - mx) + ',' + (b - my)).sort().join(' '));
    }
    return forms.sort()[0];
  };

  /* ---- equal / unequal parts ---- */
  const clipHP = (P, a, b, c) => { const out = [], n = P.length; for (let i = 0; i < n; i++) { const p = P[i], q = P[(i + 1) % n], dp = a * p[0] + b * p[1] + c, dq = a * q[0] + b * q[1] + c; if (dp >= 0) out.push(p); if ((dp >= 0) !== (dq >= 0)) { const t = dp / (dp - dq); out.push([p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1])]); } } return out; };
  const keepLeft = (P, p, q) => clipHP(P, -(q[1] - p[1]), q[0] - p[0], (q[1] - p[1]) * p[0] - (q[0] - p[0]) * p[1]);
  const cut = (P, p, q) => [keepLeft(P, p, q), keepLeft(P, q, p)];
  const areaOf = P => Math.abs(P.reduce((s, p, i) => { const q = P[(i + 1) % P.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0)) / 2;
  const circ = (r, n = 96) => Array.from({ length: n }, (_, i) => [r * Math.cos(2 * Math.PI * i / n), r * Math.sin(2 * Math.PI * i / n)]);
  const BASES = { rect: () => [[-62, -38], [62, -38], [62, 38], [-62, 38]], square: () => [[-42, -42], [42, -42], [42, 42], [-42, 42]], circle: () => circ(46), tri: () => [[-52, 40], [52, 40], [0, -48]] };
  const strips = (P, fr, axis) => {
    const xs = P.map(p => axis === 'v' ? p[0] : p[1]), lo = Math.min(...xs), hi = Math.max(...xs), parts = []; let acc = 0, rest = P;
    fr.forEach((f, i) => { if (i === fr.length - 1) { parts.push(rest); return; } acc += f; const t = lo + (hi - lo) * acc; const [A, B] = axis === 'v' ? cut(rest, [t, -999], [t, 999]) : cut(rest, [999, t], [-999, t]); parts.push(A); rest = B; });
    return parts;
  };
  const sectors = (P, angs) => angs.map((a, i) => { const b2 = i === angs.length - 1 ? angs[0] + 360 : angs[i + 1], d = x => [Math.cos(x * Math.PI / 180) * 999, Math.sin(x * Math.PI / 180) * 999]; return keepLeft(keepLeft(P, [0, 0], d(a)), d(b2), [0, 0]); });
  const through = (p, q) => { const d = [q[0] - p[0], q[1] - p[1]]; return [[p[0] - d[0] * 20, p[1] - d[1] * 20], [q[0] + d[0] * 20, q[1] + d[1] * 20]]; };
  // split a base shape into n parts, equal or not. Returns {parts, sh}. Areas are checked.
  S6.split = (R, n, equal, shapes) => {
    const sh = R.pick(shapes || (n === 2 ? ['rect', 'square', 'circle', 'tri'] : ['rect', 'square', 'circle'])), P = BASES[sh]();
    let parts;
    if (sh === 'circle') {
      if (n === 2 && !equal) {
        const off = R.pick([0.3, 0.38, 0.45]) * 46 * R.pick([-1, 1]), a = R.pick([0, 45, 90, 135]) * Math.PI / 180, nx = Math.cos(a), ny = Math.sin(a);
        parts = cut(P, [nx * off - ny * 999, ny * off + nx * 999], [nx * off + ny * 999, ny * off - nx * 999]);
      } else {
        const a0 = R.pick(n === 2 ? [0, 45, 90, 135] : n === 4 ? [0, 45] : [-90, -30, 0]);
        const spans = equal ? Array(n).fill(360 / n) : R.shuffle(R.pick({ 3: [[90, 150, 120], [80, 120, 160]], 4: [[60, 120, 90, 90], [45, 135, 90, 90], [60, 100, 80, 120]] }[n]));
        let acc = a0; parts = sectors(P, spans.map(s => { const v = acc; acc += s; return v; }));
      }
    } else if (sh === 'tri') {
      const xo = equal ? 0 : R.pick([-1, 1]) * 0.42 * 52;
      parts = cut(P, ...through([0, -48], [xo, 40]));
    } else {
      const ax = () => R.pick(['v', 'h']);
      if (n === 2) {
        const m = equal ? R.pick(['v', 'h', 'd']) : R.pick(sh === 'square' ? ['s', 's', 'c'] : ['s']);
        if (m === 'd') { const i = R.int(0, 1); parts = cut(P, ...through(P[i], P[i + 2])); }
        else if (m === 'c') { const i = R.int(0, 3), a = P[i], b = P[(i + 2) % 4], c = P[(i + 3) % 4]; parts = cut(P, ...through(a, [(b[0] + c[0]) / 2, (b[1] + c[1]) / 2])); }
        else if (m === 's') { const f = R.pick([0.28, 0.33, 0.67, 0.72]); parts = strips(P, [f, 1 - f], ax()); }
        else parts = strips(P, [0.5, 0.5], m);
      } else if (n === 3) parts = strips(P, equal ? [1 / 3, 1 / 3, 1 / 3] : R.shuffle([0.2, 0.45, 0.35]), sh === 'rect' ? 'v' : ax());
      else {
        const m = equal ? R.pick(sh === 'square' ? ['g', 'x', 's'] : ['g', 's']) : R.pick(['s', 'g']);
        if (m === 's') parts = strips(P, equal ? [0.25, 0.25, 0.25, 0.25] : R.shuffle([0.13, 0.3, 0.2, 0.37]), sh === 'rect' ? 'v' : ax());
        else if (m === 'x') { const [A, B] = cut(P, ...through(P[0], P[2])); parts = [...cut(A, ...through(P[1], P[3])), ...cut(B, ...through(P[1], P[3]))]; }
        else { const hw = sh === 'rect' ? 62 : 42, hh = sh === 'rect' ? 38 : 42, a = equal ? 0 : R.pick([-1, 1]) * 0.4 * hw, c = equal ? 0 : R.pick([-1, 1]) * 0.35 * hh; const [A, B] = cut(P, [a, -999], [a, 999]); parts = [...cut(A, [999, c], [-999, c]), ...cut(B, [999, c], [-999, c])]; }
      }
    }
    parts = parts.filter(p => p.length >= 3 && areaOf(p) > 1);
    const ar = parts.map(areaOf), ratio = Math.max(...ar) / Math.min(...ar);
    if (parts.length !== n) throw new Error('split made ' + parts.length + ' parts, wanted ' + n);
    if (equal && ratio > 1.03) throw new Error('split parts not equal');
    if (!equal && ratio < 1.25) throw new Error('split parts too close');
    return { parts, sh };
  };
  S6.parts = (parts, o = {}) => {
    const b = BB(), shade = o.shade || [];
    const body = parts.map((p, i) => { b.pts(p); return `<polygon points="${P2(p)}" fill="${shade.includes(i) ? (o.fill || C.blue) : C.paper}" stroke="${C.ink}" stroke-width="2.5" stroke-linejoin="round"/>`; }).join('');
    return S6.wrap(body, b, { w: o.w || 140, h: o.h || 110, kmax: 1, label: 'shape in parts' });
  };
  const SHN = { rect: 'rectangle', square: 'square', circle: 'circle', tri: 'triangle' };

  /* ---- pattern blocks ---- */
  const PB = { hex: { col: C.amber, area: 6, name: 'hexagon' }, trap: { col: C.red, area: 3, name: 'trapezoid' }, rhomb: { col: C.blue, area: 2, name: 'rhombus' }, sq: { col: C.violet, area: 0, name: 'square' }, tri: { col: C.teal, area: 1, name: 'triangle' } };
  const PBORD = ['hex', 'trap', 'rhomb', 'sq', 'tri'];
  const HV = i => [Math.cos(i * Math.PI / 3), Math.sin(i * Math.PI / 3)];
  const hexGroups = (groups, s0 = 0) => { let i = s0; return groups.map(g => { const pts = g === 6 ? [0, 1, 2, 3, 4, 5].map(HV) : g === 1 ? [[0, 0], HV(i), HV(i + 1)] : g === 2 ? [[0, 0], HV(i), HV(i + 1), HV(i + 2)] : [HV(i), HV(i + 1), HV(i + 2), HV(i + 3)]; i += g; return { k: { 1: 'tri', 2: 'rhomb', 3: 'trap', 6: 'hex' }[g], pts }; }); };
  const PIECE = { tri: [[0, 0], [1, 0], [0.5, -h3]], rhomb: [[0, 0], [1, 0], [1.5, -h3], [0.5, -h3]], trap: [[0, 0], [2, 0], [1.5, -h3], [0.5, -h3]], hex: [[0.5, 0], [1.5, 0], [2, -h3], [1.5, -2 * h3], [0.5, -2 * h3], [0, -h3]], sq: [[0, 0], [1, 0], [1, -1], [0, -1]] };
  // draw pieces [{k,pts}] (unit coords). o.outline: one outline, no seams. o.same: all one color with seams.
  S6.blocks = (pieces, o = {}) => {
    const s = o.s || 44, b = BB(), sc = p => p.map(q => [q[0] * s, q[1] * s]);
    let body;
    if (o.outline) {
      const fill = o.fill || C.faint;
      body = pieces.map(p => `<polygon points="${P2(sc(p.pts))}" fill="${C.ink}" stroke="${C.ink}" stroke-width="5" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>`).join('') +
        pieces.map(p => `<polygon points="${P2(sc(p.pts))}" fill="${fill}" stroke="${fill}" stroke-width="1" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>`).join('');
    } else body = pieces.map((p, i) => `<polygon points="${P2(sc(p.pts))}" fill="${o.same ? o.same : o.cols ? o.cols[i % o.cols.length] : PB[p.k].col}" stroke="${C.ink}" stroke-width="2" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>`).join('');
    pieces.forEach(p => b.pts(sc(p.pts)));
    return o.w ? S6.wrap(body, b, { w: o.w, h: o.h, kmax: o.kmax || 3, pad: 8, label: 'shape' }) : S6.wrap(body, b, { pad: 6 + (o.outline ? 3 : 0), label: 'shape' });
  };
  // a set of loose pattern blocks, in rows of up to 4
  S6.pieceSet = ks => {
    const s = 20, rowH = 2 * h3 * s + 8; let x = 4, row = 0, body = '', W = 0;
    const sorted = ks.slice().sort((a, b) => PBORD.indexOf(a) - PBORD.indexOf(b));
    sorted.forEach((k, i) => {
      if (i && i % 4 === 0) { row++; x = 4; }
      const p = PIECE[k], w = Math.max(...p.map(q => q[0])), y0 = 4 + row * rowH + 2 * h3 * s;
      body += `<polygon points="${P2(p.map(q => [x + q[0] * s, y0 + q[1] * s]))}" fill="${PB[k].col}" stroke="${C.ink}" stroke-width="1.5" stroke-linejoin="round"/>`;
      x += w * s + 7; W = Math.max(W, x);
    });
    return V.svg(Math.ceil(W), Math.ceil((row + 1) * rowH + 2), body, 'blocks');
  };
  const areaKey = ks => ks.filter(k => k === 'sq').length + '|' + ks.reduce((s, k) => s + PB[k].area, 0);
  const setText = ks => { const c = {}; ks.forEach(k => c[k] = (c[k] || 0) + 1); return PBORD.filter(k => c[k]).map(k => plural(c[k], PB[k].name)).join(', '); };

  /* ---- scenes, grids ---- */
  const OBJ = ['ball', 'box', 'star', 'tree', 'car'];
  S6.obj = (k, x, y, s) => {
    const r = s * 0.46, F = f1;
    switch (k) {
      case 'ball': return `<circle cx="${F(x)}" cy="${F(y)}" r="${F(r * 0.9)}" fill="${C.red}" stroke="${mix(C.red, -0.3)}" stroke-width="2"/><path d="M${F(x - r * 0.9)} ${F(y)} Q${F(x)} ${F(y + r * 0.6)} ${F(x + r * 0.9)} ${F(y)}" fill="none" stroke="${C.paper}" stroke-width="2.5"/>`;
      case 'box': { const a = r * 0.85, bc = mix(C.amber, -0.3); return `<rect x="${F(x - a)}" y="${F(y - a)}" width="${F(2 * a)}" height="${F(2 * a)}" rx="3" fill="${bc}" stroke="${mix(bc, -0.35)}" stroke-width="2"/><line x1="${F(x - a)}" y1="${F(y - a * 0.45)}" x2="${F(x + a)}" y2="${F(y - a * 0.45)}" stroke="${mix(bc, -0.35)}" stroke-width="2"/>`; }
      case 'star': return V.shp_draw('star', x, y, r, { fill: C.amber, sw: 2 });
      case 'tree': return `<rect x="${F(x - r * 0.16)}" y="${F(y + r * 0.35)}" width="${F(r * 0.32)}" height="${F(r * 0.65)}" fill="${mix(C.amber, -0.5)}"/><polygon points="${P2([[x, y - r], [x + r * 0.78, y + r * 0.45], [x - r * 0.78, y + r * 0.45]])}" fill="${C.teal}" stroke="${mix(C.teal, -0.3)}" stroke-width="2" stroke-linejoin="round"/>`;
      case 'car': return `<polygon points="${P2([[x - r * 0.5, y - r * 0.15], [x - r * 0.3, y - r * 0.6], [x + r * 0.35, y - r * 0.6], [x + r * 0.55, y - r * 0.15]])}" fill="${mix(C.blue, 0.4)}" stroke="${mix(C.blue, -0.3)}" stroke-width="2" stroke-linejoin="round"/><rect x="${F(x - r)}" y="${F(y - r * 0.18)}" width="${F(2 * r)}" height="${F(r * 0.6)}" rx="5" fill="${C.blue}" stroke="${mix(C.blue, -0.3)}" stroke-width="2"/><circle cx="${F(x - r * 0.55)}" cy="${F(y + r * 0.45)}" r="${F(r * 0.24)}" fill="${C.ink}"/><circle cx="${F(x + r * 0.55)}" cy="${F(y + r * 0.45)}" r="${F(r * 0.24)}" fill="${C.ink}"/>`;
    }
  };
  // objects at cell positions [{k, c, r}] on a grid of s-sized cells; o.ground draws a floor line
  S6.scene = (items, cols, rows, o = {}) => {
    const s = o.s || 64; let body = '';
    if (o.ground) body += `<line x1="0" y1="${rows * s - 6}" x2="${cols * s}" y2="${rows * s - 6}" stroke="${C.line}" stroke-width="3"/>`;
    items.forEach(it => body += S6.obj(it.k, it.c * s + s / 2, it.r * s + s / 2, s * (it.sc || 1)));
    return V.svg(cols * s, rows * s, body, 'picture');
  };
  const DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]], DIRN = ['up', 'right', 'down', 'left'], ARR = ['↑', '→', '↓', '←'];
  S6.robot = (x, y, r, dir) => {
    const a = [-90, 0, 90, 180][dir] * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a);
    const tip = [x + ca * r * 0.72, y + sa * r * 0.72], bl = [x - ca * r * 0.4 - sa * r * 0.52, y - sa * r * 0.4 + ca * r * 0.52], br = [x - ca * r * 0.4 + sa * r * 0.52, y - sa * r * 0.4 - ca * r * 0.52];
    return `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(r)}" fill="${C.teal}" stroke="${mix(C.teal, -0.35)}" stroke-width="2"/><polygon points="${P2([tip, bl, br])}" fill="${C.paper}"/>`;
  };
  S6.robotIcon = dir => V.svg(56, 56, S6.robot(28, 28, 22, dir), 'robot facing ' + DIRN[dir]);
  S6.grid = (cols, rows, items, o = {}) => {
    const c = o.cell || 44, X = i => 2 + i * c; let body = `<rect x="2" y="2" width="${cols * c}" height="${rows * c}" fill="${C.paper}"/>`;
    for (let i = 1; i < cols; i++) body += `<line x1="${X(i)}" y1="2" x2="${X(i)}" y2="${X(0) + rows * c}" stroke="${C.line}" stroke-width="1.5"/>`;
    for (let j = 1; j < rows; j++) body += `<line x1="2" y1="${X(j)}" x2="${2 + cols * c}" y2="${X(j)}" stroke="${C.line}" stroke-width="1.5"/>`;
    body += `<rect x="2" y="2" width="${cols * c}" height="${rows * c}" fill="none" stroke="${C.ink}" stroke-width="2"/>`;
    items.forEach(it => {
      const x = X(it.x) + c / 2, y = X(it.y) + c / 2;
      if (it.t === 'robot') body += S6.robot(x, y, c * 0.36, it.dir);
      else if (it.t === 'star') body += V.shp_draw('star', x, y, c * 0.38, { fill: C.amber, sw: 2 });
      else if (it.t === 'rock') body += `<rect x="${f1(x - c * 0.36)}" y="${f1(y - c * 0.3)}" width="${f1(c * 0.72)}" height="${f1(c * 0.6)}" rx="10" fill="${C.muted}"/>`;
      else if (it.t === 'letter') body += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(c * 0.34)}" fill="${C.faint}" stroke="${C.muted}" stroke-width="1.5"/>` + V.text(x, y, it.ch, { size: 18, weight: 700 });
    });
    return V.svg(cols * c + 4, rows * c + 4, body, 'grid');
  };

  /* ---- symmetry pictures ---- */
  const cellKey = (x, y) => x + ',' + y;
  S6.cellPic = (W, H, set, o = {}) => {
    const c = o.cell || 26, col = o.fill || C.blue; let body = '';
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) body += `<rect x="${2 + x * c}" y="${2 + y * c}" width="${c}" height="${c}" fill="${set.has(cellKey(x, y)) ? col : C.paper}" stroke="${C.line}" stroke-width="1"/>`;
    body += `<rect x="2" y="2" width="${W * c}" height="${H * c}" fill="none" stroke="${C.ink}" stroke-width="2"/>`;
    if (o.v !== undefined) body += `<line x1="${2 + o.v * c}" y1="-4" x2="${2 + o.v * c}" y2="${H * c + 8}" stroke="${C.red}" stroke-width="3" stroke-dasharray="7 5"/>`;
    if (o.h !== undefined) body += `<line x1="-4" y1="${2 + o.h * c}" x2="${W * c + 8}" y2="${2 + o.h * c}" stroke="${C.red}" stroke-width="3" stroke-dasharray="7 5"/>`;
    const ex = (o.v !== undefined || o.h !== undefined) ? 6 : 0;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-ex} ${-ex} ${W * c + 4 + 2 * ex} ${H * c + 4 + 2 * ex}" width="${W * c + 4 + 2 * ex}" height="${H * c + 4 + 2 * ex}" role="img" aria-label="grid picture" style="max-width:100%;height:auto" font-family="system-ui,sans-serif">${body}</svg>`;
  };
  const randHalf = (R, w, h) => {
    for (let t = 0; t < 200; t++) {
      const s = new Set(); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (R.bool(0.45)) s.add(cellKey(x, y));
      const edge = [...s].filter(k => +k.split(',')[0] === w - 1).length;
      if (s.size >= 5 && s.size <= w * h - 3 && edge >= 2) return s;
    }
    throw new Error('randHalf');
  };
  const mapSet = (s, f) => new Set([...s].map(k => { const [x, y] = k.split(',').map(Number); return cellKey(...f(x, y)); }));
  const setKey = s => [...s].sort().join(' ');
  // reflect point q across line through p1,p2
  const reflect = (q, p1, p2) => { const dx = p2[0] - p1[0], dy = p2[1] - p1[1], L = dx * dx + dy * dy, t = ((q[0] - p1[0]) * dx + (q[1] - p1[1]) * dy) / L, fx = p1[0] + t * dx, fy = p1[1] + t * dy; return [2 * fx - q[0], 2 * fy - q[1]]; };
  const isSymLine = (pts, p1, p2) => pts.every(q => { const r = reflect(q, p1, p2); return pts.some(s => Math.hypot(s[0] - r[0], s[1] - r[1]) < 1e-6 * 100); });
  // polygon with a dashed line; pts already in screen coords
  S6.lineShape = (pts, p1, p2, o = {}) => {
    const w = o.w || 120, h = o.h || 110, d = [p2[0] - p1[0], p2[1] - p1[1]], L = Math.hypot(...d), e = [d[0] / L * 12, d[1] / L * 12];
    return V.svg(w, h, V.shp_poly(pts, { fill: o.fill || C.blue }) + `<line x1="${f1(p1[0] - e[0])}" y1="${f1(p1[1] - e[1])}" x2="${f1(p2[0] + e[0])}" y2="${f1(p2[1] + e[1])}" stroke="${C.ink}" stroke-width="3" stroke-dasharray="7 5"/>`, 'shape with a line');
  };
  // candidate fold lines through a shape fitted in w×h: returns [{p1,p2,sym}]
  const SYMSH = { rectangle: () => [[-1.6, -1], [1.6, -1], [1.6, 1], [-1.6, 1]], square: () => U.square(), isoTri: () => [[-0.9, 0.9], [0.9, 0.9], [0, -1.1]], eqTri: () => U.triangle(), rightTri: () => TRI.right, hexagon: () => U.hexagon(), circle: () => U.circle(), rhombus: () => U.rhombus(), rightTrap: () => [[-1, 0.6], [1, 0.6], [0.1, -0.6], [-1, -0.6]], parallelogram: () => [[-1.3, 0.7], [0.6, 0.7], [1.3, -0.7], [-0.6, -0.7]], kite: () => [[0, -1.2], [0.8, -0.3], [0, 1.2], [-0.8, -0.3]], pentagon: () => U.pentagon() };
  const foldLines = (pts) => {
    const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]), cx = xs.reduce((a, b) => a + b) / xs.length, cy = ys.reduce((a, b) => a + b) / ys.length;
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys), hw = (x1 - x0) / 2, hh = (y1 - y0) / 2, r = Math.max(hw, hh);
    const L = [
      [[cx, y0], [cx, y1]], [[x0, cy], [x1, cy]], [[cx - r * 0.75, cy - r * 0.75], [cx + r * 0.75, cy + r * 0.75]], [[cx + r * 0.75, cy - r * 0.75], [cx - r * 0.75, cy + r * 0.75]],
      [[cx + hw * 0.4, y0], [cx + hw * 0.4, y1]], [[x0, cy + hh * 0.4], [x1, cy + hh * 0.4]],
    ];
    // diagonals of a rectangle-like box through its corners too
    L.push([[x0, y0], [x1, y1]]);
    return L.map(([p1, p2]) => ({ p1, p2, sym: isSymLine(pts, p1, p2) }));
  };

  /* ================= I.6.01 Name flat shapes ================= */
  const NAMES = ['circle', 'oval', 'triangle', 'square', 'rectangle', 'pentagon', 'hexagon'];
  const DESC = { circle: 'A circle is perfectly round with no corners.', oval: 'An oval is round but stretched, like an egg.', triangle: 'A triangle has 3 straight sides and 3 corners.', square: 'A square has 4 equal sides and 4 square corners.', rectangle: 'A rectangle has 4 square corners, with 2 long sides and 2 short sides.', pentagon: 'A pentagon has 5 straight sides.', hexagon: 'A hexagon has 6 straight sides.', rhombus: 'A rhombus has 4 equal sides but slanted corners.', trapezoid: 'A trapezoid has 4 sides. Only 2 of its sides run the same way, like train tracks.', octagon: 'An octagon has 8 sides.' };
  // name-it or pick-it question for a target kind
  const nameQ = (R, kind, confuse, o = {}) => {
    const col = R.pick(COLS), rot = o.rot ? o.rot(R) : 0;
    if (R.bool()) {
      const ds = R.sample(confuse, Math.min(3, confuse.length));
      return choice(R, `Which one is ${aan(kind)}?`, kIcon(R, kind, col, { rot, tri: o.tri }), ds.map(k => kIcon(R, k, col, { rot: o.rot ? o.rot(R) : 0 })), DESC[kind]);
    }
    const ds = R.sample(o.all ? confuse : confuse.filter(k => NAMES.includes(k)), 2);
    return choice(R, 'What shape is this?', kind, ds, DESC[kind], { visual: kIcon(R, kind, col, { rot, w: 130, tri: o.tri }) });
  };
  E1.skill({ id: 'I.6.01', name: 'Name flat shapes', steps: {
    a: { t: 'circle', g: R => nameQ(R, 'circle', ['oval', 'square', 'triangle', 'hexagon', 'pentagon']) },
    b: { t: 'square and rectangle', g: R => { const k = R.pick(['square', 'rectangle']); return nameQ(R, k, [k === 'square' ? 'rectangle' : 'square', k === 'square' ? 'rectangle' : 'square', 'triangle', 'circle', 'oval'].filter((x, i, a) => a.indexOf(x) === i)); } },
    c: { t: 'triangle', g: R => nameQ(R, 'triangle', ['square', 'rectangle', 'pentagon', 'circle', 'rhombus', 'trapezoid'], { rot: R2 => R2.pick([0, 0, 30, 90, 180, 200]) }) },
    d: { t: 'hexagon, rhombus and trapezoid', g: R => {
      const k = R.pick(['hexagon', 'hexagon', 'rhombus', 'trapezoid']);
      if (k === 'hexagon' && R.bool(0.25)) return choice(R, 'How many sides does a hexagon have?', 6, [5, 8, 4], 'Hexa means 6: a hexagon has 6 sides.', { visual: kIcon(R, 'hexagon', R.pick(COLS), { rot: R.pick([0, 30, 90]), w: 110 }) });
      const conf = { hexagon: ['pentagon', 'octagon', 'rhombus', 'circle', 'trapezoid'], rhombus: ['square', 'trapezoid', 'rectangle', 'hexagon'], trapezoid: ['rhombus', 'rectangle', 'triangle', 'hexagon'] }[k];
      return nameQ(R, k, conf, { rot: R2 => R2.pick([0, 0, 15, 90]), all: true });
    } },
  } });

  /* ================= I.6.02 Shape features ================= */
  const featShape = (R, pool) => { const k = R.pick(pool); return { k, pts: S6.pts(R, k), n: SIDES[k] }; };
  const POLY = ['triangle', 'square', 'rectangle', 'pentagon', 'hexagon', 'rhombus', 'trapezoid'];
  E1.skill({ id: 'I.6.02', name: 'Shape features', steps: {
    a: { t: 'sides', g: R => { const s = featShape(R, POLY); return num('How many sides?', s.n, `Count each straight side once, going around: ${s.n}.`, { visual: S6.icon(s.pts, { fill: R.pick(COLS), rot: R.pick([0, 0, 20, 45, 90]), w: 130 }) }); } },
    b: { t: 'corners', g: R => { const s = R.bool(0.7) ? featShape(R, POLY) : (n => ({ pts: S6.irreg(R, n), n }))(R.int(3, 6)); return num('How many corners?', s.n, `A corner is where 2 sides meet. Touch each one: ${s.n}.`, { visual: S6.icon(s.pts, { fill: R.pick(COLS), rot: R.pick([0, 0, 20, 45, 90]), w: 130 }) }); } },
    c: { t: 'straight or curved', g: R => {
      const kind = R.pick(['straight', 'straight', 'curved', 'both']);
      const arch = [[-1, 1], [1, 1], ...Array.from({ length: 25 }, (_, i) => { const a = -Math.PI * i / 24; return [Math.cos(a), Math.sin(a)]; })];
      const quarter = [[0, 0], ...Array.from({ length: 19 }, (_, i) => { const a = Math.PI / 2 * i / 18; return [Math.cos(a), Math.sin(a)]; })];
      const pts = kind === 'straight' ? S6.pts(R, R.pick(POLY)) : kind === 'curved' ? S6.pts(R, R.pick(['circle', 'oval'])) : R.pick([U.semicircle(), arch, quarter]);
      const ex = { straight: 'Every side is a straight line.', curved: 'It is round all the way: its side is curved, with no straight parts.', both: 'Part of it is a straight line and part of it is curved.' }[kind];
      return choiceFixed('Are its sides straight, curved, or both?', ['straight', 'curved', 'both'], ['straight', 'curved', 'both'].indexOf(kind), ex, { visual: S6.icon(pts, { fill: R.pick(COLS), rot: R.pick([0, 90, 180, 270]), w: 120 }) });
    } },
    d: { t: 'count sides and corners', g: R => {
      const n = R.int(3, 8), pts = R.bool(0.4) && n <= 6 ? S6.pts(R, { 3: 'triangle', 4: R.pick(['square', 'rhombus', 'trapezoid']), 5: 'pentagon', 6: 'hexagon' }[n]) : S6.nGon(R, n);
      return num('Count the sides and the corners.', [{ label: 'sides', ans: n }, { label: 'corners', ans: n }], `It has ${n} sides and ${n} corners. A flat shape with straight sides has as many corners as sides.`, { visual: S6.icon(pts, { fill: R.pick(COLS), rot: R.int(0, 7) * 45, w: 140 }) });
    } },
  } });

  /* ================= I.6.03 Shapes in any position ================= */
  E1.skill({ id: 'I.6.03', name: 'Shapes in any position', steps: {
    a: { t: 'turned squares', g: R => {
      const col = R.pick(COLS), rot = R.pick([15, 25, 30, 45, 45, 60, 70]), m = R.int(0, 2);
      if (m === 0) return choice(R, 'Which one is a square?', S6.icon(U.square(), { fill: col, rot }), [S6.icon(S6.pts(R, 'rectangle', { a: 1.7 }), { fill: col, rot: R.pick([20, 40, 60]) }), S6.icon(U.rhombus(), { fill: col, rot: R.pick([0, 30]) }), kIcon(R, 'trapezoid', col, { rot: R.pick([0, 45]) })], 'A square stays a square when you turn it: 4 equal sides and 4 square corners.');
      if (m === 1) return choice(R, 'What shape is this?', 'square', ['rectangle', 'triangle', 'hexagon'].slice(0, 2 + R.int(0, 1)), 'It is only turned. It still has 4 equal sides and 4 square corners, so it is a square.', { visual: S6.icon(U.square(), { fill: col, rot, w: 130 }) });
      const yes = R.bool(0.5);
      return yn('Is this a square?', yes, yes ? 'Yes. It is just turned: 4 equal sides and 4 square corners.' : 'No. Its sides are equal, but its corners are not square corners.', { visual: S6.icon(yes ? U.square() : U.rhombus(), { fill: col, rot: yes ? rot : R.pick([0, 90, 20]), w: 130 }) });
    } },
    b: { t: 'tall, thin triangles', g: R => {
      const col = R.pick(COLS), tri = R.pick(['tall', 'wide', 'obt', 'scal', 'right']), rot = R.pick([0, 30, 90, 150, 180, 250]), m = R.int(0, 2);
      if (m === 0) return choice(R, 'Which one is a triangle?', S6.icon(TRI[tri], { fill: col, rot }), [S6.icon([[-0.35, -1.2], [0.35, -1.2], [0.35, 1.2], [-0.35, 1.2]], { fill: col, rot: R.pick([0, 30]) }), S6.icon([[0, -1.3], [0.3, 0], [0, 1.3], [-0.3, 0]], { fill: col, rot: R.pick([0, 20]) }), S6.icon([[-0.4, 1.2], [0.4, 1.2], [0.22, -1.2], [-0.22, -1.2]], { fill: col, rot: R.pick([0, 90]) })], 'Count the sides: only the triangle has exactly 3 straight sides and 3 corners.');
      if (m === 1) return choice(R, 'What shape is this?', 'triangle', ['rectangle', 'square', 'hexagon'].slice(0, 2), 'It is thin and turned, but it has 3 straight sides and 3 corners. It is a triangle.', { visual: S6.icon(TRI[tri], { fill: col, rot, w: 130 }) });
      const yes = R.bool(0.5), thin4 = [[-0.4, 1.2], [0.4, 1.2], [0.22, -1.2], [-0.22, -1.2]];
      return yn('Is this a triangle?', yes, yes ? 'Yes. Long or short, a shape with 3 straight sides and 3 corners is a triangle.' : 'No. Look at the top: it has 4 corners, so it is not a triangle.', { visual: S6.icon(yes ? TRI[tri] : thin4, { fill: col, rot: yes ? rot : R.pick([0, 180]), w: 130 }) });
    } },
    c: { t: 'not-shapes (open or curved)', g: R => {
      const k = R.pick(['triangle', 'square', 'rectangle']), base = k === 'triangle' ? TRI[R.pick(['eq', 'right', 'scal'])] : S6.pts(R, k, { tall: false }), col = R.pick(COLS), n = base.length;
      if (R.bool(0.6)) {
        const ds = [S6.notIcon(base, 'gap', { fill: col, side: R.int(0, n - 1) }), S6.notIcon(base, 'curve', { fill: col, side: R.int(0, n - 1) }), S6.notIcon(base, 'curve', { fill: col, side: R.int(0, n - 1), inward: true })];
        return choice(R, `Which one is a real ${k}?`, S6.icon(base, { fill: col }), R.sample(ds, R.int(2, 3)), `A ${k} is closed all the way round and every side is straight.`);
      }
      const mode = R.pick(['gap', 'curve', 'curve']), inward = R.bool();
      if (R.bool(0.45)) return yn(`Is this ${aan(k)}?`, true, `Yes. It is closed all the way round and every side is straight.`, { visual: S6.icon(base, { fill: col, w: 120 }) });
      return yn(`Is this ${aan(k)}?`, false, mode === 'gap' ? 'No. It has a gap, so it is not closed. A shape must be closed.' : `No. One side is curved. A ${k} has only straight sides.`, { visual: S6.notIcon(base, mode, { fill: col, side: R.int(0, n - 1), inward, w: 120 }) });
    } },
    d: { t: 'what makes a shape that shape', g: R => {
      const k = R.pick(['triangle', 'square', 'rectangle', 'circle', 'hexagon', 'pentagon']), col = R.pick(COLS), c = cn(col);
      const W = { triangle: ['3 straight sides and 3 corners', ['it points up', `it is ${c}`, '4 straight sides']], square: ['4 equal sides and 4 square corners', ['it sits flat', `it is ${c}`, '2 long sides and 2 short sides']], rectangle: ['4 square corners, 2 long and 2 short sides', ['it is lying down', `it is ${c}`, '4 equal sides and no square corners']], circle: ['it is round with no corners', ['it is big', `it is ${c}`, 'it has 1 corner']], hexagon: ['6 straight sides and 6 corners', ['it is big', `it is ${c}`, '5 straight sides and 5 corners']], pentagon: ['5 straight sides and 5 corners', ['it looks like a house', `it is ${c}`, '6 straight sides and 6 corners']] }[k];
      const rot = k === 'triangle' ? R.pick([180, 90, 200]) : R.pick([0, 20, 90]);
      return choice(R, `Why is this ${aan(k)}?`, W[0], R.sample(W[1], 2), `Color, size and which way it points don't matter. ${DESC[k]}`, { visual: S6.icon(S6.pts(R, k, { tri: 'scal' }), { fill: col, rot, w: R.pick([90, 130]) }) });
    } },
  } });

  /* ================= I.6.04 Name solid shapes ================= */
  const SOL = ['cube', 'sphere', 'cone', 'cylinder', 'box', 'pyramid'];
  const SDESC = { cube: 'A cube has 6 square faces, like a dice.', sphere: 'A sphere is round all over, like a ball.', cone: 'A cone has a round flat face and a point.', cylinder: 'A cylinder has 2 round flat faces and a curved side, like a can.', box: 'A rectangular prism is a box shape with 6 rectangle faces.', pyramid: 'A pyramid has a flat base and triangle faces that meet at a point.' };
  const FLATTWIN = { cube: 'square', sphere: 'circle', cone: 'triangle', cylinder: 'rectangle', box: 'rectangle', pyramid: 'triangle' };
  const solidQ = (R, k, pool, o = {}) => {
    const col = R.pick([C.blue, C.teal, C.violet, C.red]);
    if (R.bool()) {
      const ds = R.sample(pool, 2).map(d => solidPic(R, d, col));
      if (o.flat) ds.push(kIcon(R, FLATTWIN[k], col, { w: 96, r: 30, tri: 'eq', tall: false }));
      return choice(R, `Which one is ${aan(SOLN[k] === 'rectangular prism' ? 'box shape (rectangular prism)' : SOLN[k])}?`, solidPic(R, k, col), ds, SDESC[k] + (o.flat ? ` The flat ${FLATTWIN[k]} is not a solid.` : ''));
    }
    return choice(R, 'What solid shape is this?', SOLN[k], R.sample(pool, 2).map(d => SOLN[d]), SDESC[k], { visual: solidPic(R, k, col, { w: 130, inv: k === 'cone' && R.bool(0.3) }) });
  };
  E1.skill({ id: 'I.6.04', name: 'Name solid shapes', steps: {
    a: { t: 'cube', g: R => solidQ(R, 'cube', ['sphere', 'cylinder', 'cone', 'pyramid'], { flat: true }) },
    b: { t: 'sphere', g: R => solidQ(R, 'sphere', ['cube', 'cylinder', 'cone'], { flat: true }) },
    c: { t: 'cone and cylinder', g: R => { const k = R.pick(['cone', 'cylinder']); return solidQ(R, k, [k === 'cone' ? 'cylinder' : 'cone', 'pyramid', 'sphere', 'cube'].slice(0, 3)); } },
    d: { t: 'box shape (rectangular prism)', g: R => solidQ(R, 'box', ['cube', 'cylinder', 'pyramid']) },
  } });

  /* ================= I.6.05 Solid shape features ================= */
  const ITEMS = { sphere: ['a ball', 'an orange', 'a marble', 'a globe'], cube: ['a sugar cube', 'a toy block', 'an ice cube'], cylinder: ['a tin can', 'a candle', 'a drum', 'a glue stick'], cone: ['an ice cream cone', 'a party hat', 'a traffic cone'], box: ['a cereal box', 'a brick', 'a shoebox', 'a book'], pyramid: ['the pyramids in Egypt'] };
  E1.skill({ id: 'I.6.05', name: 'Solid shape features', steps: {
    a: { t: 'roll, stack or slide', g: R => {
      const col = R.pick([C.blue, C.teal, C.violet, C.red]), m = R.int(0, 3), pic = k => solidPic(R, k, col);
      if (m === 0) { const k = R.pick(['sphere', 'cylinder']); return choice(R, 'Which one can roll?', pic(k), R.sample(['cube', 'box', 'pyramid'], 2).map(pic), `A ${SOLN[k]} has a curved surface, so it can roll. Flat faces make shapes slide, not roll.`); }
      if (m === 1) { const k = R.pick(['cube', 'box', 'pyramid']); return choice(R, "Which one can't roll?", pic(k), ['sphere', 'cylinder'].map(pic), `A ${SOLN[k]} has only flat faces and no curved part, so it can't roll.`); }
      if (m === 2) return choice(R, 'Which one can roll and also stack?', pic('cylinder'), R.sample(['sphere', 'cube', 'box', 'pyramid'], 2).map(pic), 'A cylinder rolls on its curved side and stacks on its flat circle faces.');
      const cases = [['sphere', 'stack', false], ['sphere', 'roll', true], ['cube', 'roll', false], ['cube', 'stack', true], ['cylinder', 'roll', true], ['cylinder', 'stack', true], ['box', 'slide', true], ['box', 'roll', false], ['pyramid', 'roll', false], ['cube', 'slide', true]];
      const [k, v, yes] = R.pick(cases);
      const why = { roll: yes ? 'It has a curved surface, so it rolls.' : 'It has no curved surface, so it cannot roll.', stack: yes ? 'It has flat faces top and bottom, so things can sit on it.' : 'It has no flat face, so things slide off it.', slide: 'It has a flat face to slide on.' }[v];
      return yn(`Can a ${SOLN[k]} ${v}?`, yes, (yes ? 'Yes. ' : 'No. ') + why, { visual: pic(k) });
    } },
    b: { t: 'faces', g: R => {
      const k = R.pick(SOL), n = FACES[k];
      const ex = { cube: 'A cube has 6 flat faces: top, bottom and 4 sides (some are hidden at the back).', box: 'A box has 6 flat faces: top, bottom and 4 sides (some are hidden at the back).', pyramid: 'A pyramid has 5 flat faces: 1 square on the bottom and 4 triangles.', cylinder: 'A cylinder has 2 flat faces: the top and the bottom circles. Its side is curved.', cone: 'A cone has 1 flat face: the circle at the bottom. The rest is curved.', sphere: 'A sphere is curved all over, so it has 0 flat faces.' }[k];
      return num('How many flat faces does it have?', n, ex, { visual: solidPic(R, k, R.pick([C.blue, C.teal, C.violet, C.red]), { w: 130 }) });
    } },
    c: { t: 'faces are flat shapes', g: R => {
      const cs = [['cube', 'top', 'square'], ['cube', 'left', 'square'], ['cube', 'right', 'square'], ['box', 'top', 'rectangle'], ['box', 'left', 'rectangle'], ['box', 'right', 'rectangle'], ['cylinder', 'top', 'circle'], ['cone', 'top', 'circle'], ['pyramid', 'left', 'triangle'], ['pyramid', 'right', 'triangle']];
      const [k, f, ans] = R.pick(cs), col = R.pick([C.blue, C.teal, C.violet, C.red]);
      const vis = S6.solid(k, { fill: col, hl: f, dims: [2.1, 1, 1.4], inv: k === 'cone', w: 140 });
      const tilt = k === 'cube' || k === 'box' ? ' It looks slanted in the picture.' : k === 'cone' || k === 'cylinder' ? ' It looks squashed in the picture.' : '';
      return choice(R, 'What flat shape is the yellow face?', ans, R.sample(['square', 'rectangle', 'circle', 'triangle'].filter(x => x !== ans), 3), `The yellow face is ${aan(ans)}.${tilt}`, { visual: vis });
    } },
    d: { t: 'solids around you', g: R => {
      const k = R.pick(SOL.filter(x => x !== 'pyramid')), it = R.pick(ITEMS[k]);
      if (R.bool(0.6)) return choice(R, `${cap(it)} is shaped like a…`, SOLN[k], R.sample(SOL.filter(x => x !== k), 2).map(x => SOLN[x]), `${cap(it)} is shaped like ${aan(SOLN[k])}. ${SDESC[k]}`);
      const others = R.sample(SOL.filter(x => x !== k && !(k === 'cube' && x === 'box') && !(k === 'box' && x === 'cube')), 2).map(x => R.pick(ITEMS[x]));
      return choice(R, `Which one is shaped like ${aan(SOLN[k])}?`, it, others, `${cap(it)} is shaped like ${aan(SOLN[k])}. ${SDESC[k]}`);
    } },
  } });

  /* ================= I.6.06 Put shapes together ================= */
  const COMPOSE = [
    { a: 'triangles', ans: 'square', pieces: () => [[[0, 0], [2, 0], [2, 2]], [[0, 0], [2, 2], [0, 2]]] },
    { a: 'triangles', ans: 'square', pieces: () => [[[0, 0], [2, 0], [0, 2]], [[2, 0], [2, 2], [0, 2]]] },
    { a: 'triangles', ans: 'triangle', pieces: () => [[[0, 2], [2, 0], [2, 2]], [[2, 0], [4, 2], [2, 2]]] },
    { a: 'triangles', ans: 'rectangle', pieces: () => [[[0, 0], [3, 0], [0, 1.6]], [[3, 0], [3, 1.6], [0, 1.6]]] },
    { a: 'squares', ans: 'rectangle', pieces: () => [[[0, 0], [1.5, 0], [1.5, 1.5], [0, 1.5]], [[1.5, 0], [3, 0], [3, 1.5], [1.5, 1.5]]] },
    { a: 'squares', ans: 'rectangle', pieces: () => [[[0, 0], [1.3, 0], [1.3, 1.3], [0, 1.3]], [[0, 1.3], [1.3, 1.3], [1.3, 2.6], [0, 2.6]]] },
    { a: 'rectangles', ans: 'square', pieces: () => [[[0, 0], [1, 0], [1, 2], [0, 2]], [[1, 0], [2, 0], [2, 2], [1, 2]]] },
    { a: 'triangles', ans: 'rhombus', pieces: () => [PIECE.tri.map(p => [p[0] * 1.6, p[1] * 1.6]), [[0.8, -h3 * 1.6], [1.6, 0], [2.4, -h3 * 1.6]]] },
  ];
  // composites whose pieces are pattern blocks (for 'fill an outline')
  const FILLS = [
    () => [{ k: 'sq', pts: [[0, 0], [1, 0], [1, 1], [0, 1]] }, { k: 'tri', pts: [[0, 0], [1, 0], [0.5, -h3]] }],
    () => [{ k: 'sq', pts: [[0, 0], [1, 0], [1, 1], [0, 1]] }, { k: 'sq', pts: [[0, 1], [1, 1], [1, 2], [0, 2]] }, { k: 'tri', pts: [[0, 0], [1, 0], [0.5, -h3]] }],
    () => [{ k: 'sq', pts: [[0, 0], [1, 0], [1, 1], [0, 1]] }, { k: 'tri', pts: [[0, 0], [0, 1], [-h3, 0.5]] }, { k: 'tri', pts: [[1, 0], [1 + h3, 0.5], [1, 1]] }],
    () => [{ k: 'sq', pts: [[0, 0], [1, 0], [1, 1], [0, 1]] }, { k: 'sq', pts: [[1, 0], [2, 0], [2, 1], [1, 1]] }, { k: 'tri', pts: [[0, 0], [1, 0], [0.5, -h3]] }, { k: 'tri', pts: [[1, 0], [2, 0], [1.5, -h3]] }],
    R => hexGroups(R.pick([[3, 3], [2, 2, 2], [3, 2, 1], [1, 2, 3], [2, 1, 2, 1], [1, 1, 1, 3]]), R.int(0, 5)),
    R => [...hexGroups([6]), { k: 'tri', pts: [HV(4), HV(5), [0, -2 * h3]] }],
    R => [...hexGroups([6]), { k: 'sq', pts: [HV(1), HV(2), [HV(2)[0], HV(2)[1] + 1], [HV(1)[0], HV(1)[1] + 1]] }],
    R => R.pick([[{ k: 'trap', pts: [[0, 0], [2, 0], [1.5, -h3], [0.5, -h3]] }, { k: 'tri', pts: [[0.5, -h3], [1.5, -h3], [1, -2 * h3]] }], [{ k: 'rhomb', pts: [[0.5, -h3], [1, 0], [2, 0], [1.5, -h3]] }, { k: 'tri', pts: [[0, 0], [1, 0], [0.5, -h3]] }, { k: 'tri', pts: [[0.5, -h3], [1.5, -h3], [1, -2 * h3]] }]]),
    R => [{ k: 'rhomb', pts: [[0, 0], [1, 0], [1.5, -h3], [0.5, -h3]] }, { k: 'sq', pts: [[0, 0], [1, 0], [1, 1], [0, 1]] }],
  ];
  const HEXSETS = [[6], [3, 3], [2, 2, 2], [1, 1, 1, 1, 1, 1], [3, 2, 1], [3, 1, 1, 1], [2, 2, 1, 1], [2, 1, 1, 1, 1]];
  const TRAPSETS = [[3], [2, 1], [1, 1, 1]];
  const gk = g => ({ 1: 'tri', 2: 'rhomb', 3: 'trap', 6: 'hex' }[g]);
  const wrongSets = (R, ks, target, n) => {
    const out = [], seen = new Set([areaKey(ks)]);
    const muts = [s => s.concat('tri'), s => s.length > 1 ? s.slice(1) : null, s => s.map((k, i) => i === 0 && k === 'tri' ? 'sq' : k), s => s.map((k, i) => i === s.length - 1 && k === 'sq' ? 'tri' : k), s => s.map((k, i) => i === 0 && k === 'rhomb' ? 'trap' : k), s => s.map(k => k === 'trap' ? 'rhomb' : k), s => s.concat('rhomb'), s => s.filter((k, i) => !(k === 'tri' && i === s.indexOf('tri'))), s => s.concat('sq')];
    for (const m of R.shuffle(muts)) { const s = m(ks.slice()); if (!s || !s.length || s.length > 8) continue; const key = areaKey(s); if (!seen.has(key)) { seen.add(key); out.push(s); } if (out.length >= n) break; }
    return out;
  };
  E1.skill({ id: 'I.6.06', name: 'Put shapes together', steps: {
    a: { t: 'two triangles make a square', g: R => {
      const c = R.bool(0.5) ? COMPOSE[R.int(0, 1)] : R.pick(COMPOSE), cols = R.sample(COLS, 2), vis = S6.blocks(c.pieces().map(pts => ({ pts })), { cols, s: 46 });
      const ds = R.sample(['square', 'rectangle', 'triangle', 'circle', 'hexagon', 'rhombus'].filter(x => x !== c.ans && !(c.ans === 'rhombus' && x === 'square')), 2);
      return choice(R, `These 2 ${c.a} make which shape?`, c.ans, ds, `Look at the outside edge of the whole picture. ${DESC[c.ans]}`, { visual: vis });
    } },
    b: { t: 'pattern blocks', g: R => {
      const T = R.pick([['hex', 'tri', 6], ['hex', 'rhomb', 3], ['hex', 'trap', 2], ['trap', 'tri', 3], ['rhomb', 'tri', 2], ['big', 'tri', 4]]), [tk, pk, n] = T;
      const tp = tk === 'big' ? [[0, 0], [2, 0], [1, -2 * h3]] : tk === 'hex' ? PIECE.hex : PIECE[tk], flip = R.bool() && tk !== 'hex';
      const tpts = flip ? tp.map(([x, y]) => [x, -y]) : tp;
      const target = S6.blocks([{ pts: tpts }], { outline: true, s: 50 }), piece = S6.blocks([{ k: pk, pts: PIECE[pk] }], { s: 50 });
      const tname = tk === 'big' ? 'big triangle' : PB[tk].name;
      return num(`How many ${cn(PB[pk].col)} ${pl(PB[pk].name)} cover the ${tname}?`, n, `${n} ${pl(PB[pk].name)} fit inside the ${tname} with no gaps and no overlaps.`, { visual: V.side(R.bool() ? [target, piece] : [piece, target], { gap: 30 }) });
    } },
    c: { t: 'fill an outline', g: R => {
      const pcs = R.pick(FILLS)(R), ks = pcs.map(p => p.k), vis = S6.blocks(pcs, { outline: true, s: 44 });
      const ds = wrongSets(R, ks, null, 2);
      return choice(R, 'Which blocks fill this outline exactly?', S6.pieceSet(ks), ds.map(S6.pieceSet), `Use ${setText(ks)}: they fit together with no gaps and nothing left over.`, { visual: vis });
    } },
    d: { t: 'many ways', g: R => {
      const hex = R.bool(0.7), sets = hex ? HEXSETS : TRAPSETS, shown = R.pick(sets), other = R.pick(sets.filter(s => s !== shown));
      const vis = S6.blocks(hexGroups(R.shuffle(shown), hex ? R.int(0, 5) : 3), { s: 50 }), ks = other.map(gk), ds = wrongSets(R, ks, null, 2);
      return choice(R, `Which other blocks also make this ${hex ? 'hexagon' : 'trapezoid'}?`, S6.pieceSet(ks), ds.map(S6.pieceSet), `It can be made from ${setText(shown.map(gk))}, or from ${setText(ks)}. There is more than one way!`, { visual: vis });
    } },
  } });

  /* ================= I.6.07 Take shapes apart ================= */
  const APART = [
    { id: 'sqDiag', text: '2 triangles', out: 'square', no: ['circle', 'hexagon', 'pentagon', 'oval'], pc: R => R.bool() ? [[[0, 0], [2, 0], [2, 2]], [[0, 0], [2, 2], [0, 2]]] : [[[0, 0], [2, 0], [0, 2]], [[2, 0], [2, 2], [0, 2]]] },
    { id: 'sqX', text: '4 triangles', out: 'square', no: ['circle', 'hexagon', 'pentagon', 'oval'], pc: () => [[[0, 0], [2, 0], [1, 1]], [[2, 0], [2, 2], [1, 1]], [[2, 2], [0, 2], [1, 1]], [[0, 2], [0, 0], [1, 1]]] },
    { id: 'sqMid', text: '2 rectangles', out: 'square', no: ['circle', 'triangle', 'hexagon', 'pentagon'], pc: R => R.bool() ? [[[0, 0], [1, 0], [1, 2], [0, 2]], [[1, 0], [2, 0], [2, 2], [1, 2]]] : [[[0, 0], [2, 0], [2, 1], [0, 1]], [[0, 1], [2, 1], [2, 2], [0, 2]]] },
    { id: 'sq4', text: '4 squares', out: 'square', no: ['circle', 'triangle', 'hexagon', 'pentagon'], pc: () => [[0, 0], [1, 0], [0, 1], [1, 1]].map(([x, y]) => [[x, y], [x + 1, y], [x + 1, y + 1], [x, y + 1]]) },
    { id: 'house', text: '1 square, 1 triangle', out: 'pentagon', no: ['circle', 'hexagon', 'oval', 'rectangle'], pc: () => [[[0, 0], [2, 0], [2, 2], [0, 2]], [[0, 0], [2, 0], [1, -2 * h3]]] },
    { id: 'trap', text: '1 rectangle, 2 triangles', out: 'trapezoid', no: ['circle', 'hexagon', 'oval', 'pentagon'], pc: () => [[[0, 1.6], [1, 0], [1, 1.6]], [[1, 0], [2.4, 0], [2.4, 1.6], [1, 1.6]], [[2.4, 0], [3.4, 1.6], [2.4, 1.6]]] },
    { id: 'hexRect', text: '1 rectangle, 2 triangles', out: 'hexagon', no: ['circle', 'square', 'triangle', 'oval'], pc: () => [[[-1, 0], [-0.5, -h3], [-0.5, h3]], [[-0.5, -h3], [0.5, -h3], [0.5, h3], [-0.5, h3]], [[0.5, -h3], [1, 0], [0.5, h3]]] },
    { id: 'hex2', text: '2 trapezoids', out: 'hexagon', no: ['circle', 'square', 'triangle', 'oval'], pc: () => hexGroups([3, 3]).map(p => p.pts) },
    { id: 'rect2', text: '2 squares', out: 'rectangle', no: ['circle', 'triangle', 'hexagon', 'oval'], pc: () => [[[0, 0], [1, 0], [1, 1], [0, 1]], [[1, 0], [2, 0], [2, 1], [1, 1]]] },
    { id: 'tri4', text: '4 triangles', out: 'triangle', no: ['circle', 'square', 'oval', 'rectangle'], pc: () => [[[0, 0], [1, 0], [0.5, -h3]], [[1, 0], [2, 0], [1.5, -h3]], [[0.5, -h3], [1.5, -h3], [1, -2 * h3]], [[1, 0], [1.5, -h3], [0.5, -h3]]] },
    { id: 'rocket', text: '1 rectangle, 1 triangle', out: 'pentagon', no: ['circle', 'square', 'hexagon', 'oval'], pc: () => [[[0, 0], [2, 0], [2, 1], [0, 1]], [[2, 0], [2.9, 0.5], [2, 1]]] },
  ];
  const TEXTS = [...new Set(APART.map(a => a.text).concat(['1 square, 2 triangles', '3 triangles', '2 circles']))];
  E1.skill({ id: 'I.6.07', name: 'Take shapes apart', steps: {
    a: { t: 'cut a square', g: R => {
      const C4 = [['d', '2 triangles'], ['m', '2 rectangles'], ['o', '2 rectangles'], ['x', '4 triangles'], ['p', '4 squares'], ['r', '2 squares']];
      const [m, ans] = R.pick(C4), col = R.pick(COLS), rect = m === 'r', w = rect ? 100 : 90, h = rect ? 50 : 90, x0 = 20, y0 = 16;
      const Ls = { d: R.bool() ? [[0, 0, 1, 1]] : [[1, 0, 0, 1]], m: R.bool() ? [[0.5, 0, 0.5, 1]] : [[0, 0.5, 1, 0.5]], o: R.bool() ? [[0.3, 0, 0.3, 1]] : [[0, 0.7, 1, 0.7]], x: [[0, 0, 1, 1], [1, 0, 0, 1]], p: [[0.5, 0, 0.5, 1], [0, 0.5, 1, 0.5]], r: [[0.5, 0, 0.5, 1]] }[m];
      let body = `<rect x="${x0}" y="${y0}" width="${w}" height="${h}" fill="${mix(col, 0.35)}" stroke="${mix(col, -0.3)}" stroke-width="2.5"/>`;
      Ls.forEach(([a, b, c, d]) => body += `<line x1="${x0 + a * w}" y1="${y0 + b * h}" x2="${x0 + c * w}" y2="${y0 + d * h}" stroke="${C.ink}" stroke-width="2.5" stroke-dasharray="7 5"/>`);
      const ds = R.sample(['2 triangles', '2 rectangles', '4 triangles', '4 squares', '2 squares', '3 triangles'].filter(x => x !== ans && !(ans === '2 squares' && x === '2 rectangles') && !(ans === '2 rectangles' && x === '2 squares' && m === 'o')), 2);
      return choice(R, `Cut the ${rect ? 'rectangle' : 'square'} on the dashed line${Ls.length > 1 ? 's' : ''}. What do you get?`, ans, ds, `Look at each piece after the cut: you get ${ans}.`, { visual: V.svg(x0 * 2 + w, y0 * 2 + h, body, 'shape with cut lines') });
    } },
    b: { t: 'find smaller shapes', g: R => {
      const a = R.pick(APART), vis = S6.blocks(a.pc(R).map(pts => ({ pts })), { same: mix(R.pick(COLS), 0.4), s: 50 });
      const ds = R.sample(TEXTS.filter(t => t !== a.text && !(a.id === 'sqX' && t === '2 triangles') && !(a.id === 'sq4' && t === '2 rectangles') && !(a.id === 'tri4' && t === '1 square, 1 triangle')), 2);
      return choice(R, 'Which smaller shapes make this shape?', a.text, ds, `Follow the lines inside: it is made of ${a.text}.`, { visual: vis });
    } },
    c: { t: 'count triangles in a picture', g: R => {
      if (R.bool(0.3)) {
        const a = R.pick(APART.filter(x => ['sqX', 'tri4', 'sqDiag'].includes(x.id)).concat([{ text: '6 triangles', pc: () => hexGroups([1, 1, 1, 1, 1, 1]).map(p => p.pts) }])), n = +a.text[0];
        return num('How many small triangles?', n, `Count the small triangles one at a time: ${n}.`, { visual: S6.blocks(a.pc(R).map(pts => ({ pts })), { same: mix(R.pick(COLS), 0.4), s: 50 }) });
      }
      const nt = R.int(2, 6), no = R.int(2, 9 - nt), items = [];
      for (let i = 0; i < nt; i++) items.push({ pts: TRI[R.pick(TRIK)], rot: R.int(0, 11) * 30 });
      for (let i = 0; i < no; i++) { const k = R.pick(['square', 'circle', 'rectangle', 'rhombus', 'pentagon', 'trapezoid', 'hexagon']); items.push({ pts: k === 'trapezoid' ? U.trapezoid() : S6.pts(R, k), rot: R.int(0, 3) * 30 }); }
      const cols = 5, cell = 64, slots = R.shuffle(Array.from({ length: 10 }, (_, i) => i));
      const body = items.map((it, i) => V.shp_draw(it.pts, (slots[i] % cols) * cell + cell / 2, Math.floor(slots[i] / cols) * cell + cell / 2, 22, { fill: R.pick(COLS), rot: it.rot, sw: 2 })).join('');
      return num('How many triangles?', nt, `Only count shapes with exactly 3 sides. There are ${nt}.`, { visual: V.svg(cols * cell, 2 * cell, body, 'shapes') });
    } },
    d: { t: 'rebuild the shape', g: R => {
      const a = R.pick(APART), pc = a.pc(R), all = pc.flat(), cx = all.reduce((s, p) => s + p[0], 0) / all.length, cy = all.reduce((s, p) => s + p[1], 0) / all.length;
      const exploded = pc.map(pts => { const mx = pts.reduce((s, p) => s + p[0], 0) / pts.length - cx, my = pts.reduce((s, p) => s + p[1], 0) / pts.length - cy, L = Math.hypot(mx, my) || 1; return { pts: pts.map(([x, y]) => [x + mx / L * 0.35, y + my / L * 0.35]) }; });
      const vis = S6.blocks(exploded, { cols: R.sample(COLS, 4), s: 42 }), outl = pts => S6.blocks([{ pts }], { outline: true, w: 90, h: 90, fill: mix(C.blue, 0.75) });
      return choice(R, 'Push the pieces together. Which shape do they make?', S6.blocks(pc.map(pts => ({ pts })), { outline: true, w: 90, h: 90, fill: mix(C.blue, 0.75) }), R.sample(a.no, 2).map(k => outl(S6.pts(R, k, { tri: 'eq', tall: false }))), `Slide the pieces (${a.text}) back together: they make ${aan(a.out)}.`, { visual: vis });
    } },
  } });

  /* ================= I.6.08 Solids from blocks ================= */
  const hsKey = hs => hs.join(',');
  const TOWER_NAMES = { cube: 'cube', box: 'box', cylinder: 'cylinder', cone: 'cone', sphere: 'ball', pyramid: 'pyramid' };
  S6.tower = (pieces, cols) => {
    const b = BB(), u = 38; let z = 0, body = '';
    pieces.forEach((k, i) => {
      const o = { u, fill: cols[i], ox: 0, oy: -z * u };
      if (k === 'cube') { body += S6.solidBody('cube', o, b); z += 1; }
      else if (k === 'box') { body += S6.solidBody('box', Object.assign(o, { dims: [2, 1.2, 0.7] }), b); z += 0.7; }
      else if (k === 'cylinder') { body += S6.solidBody('cylinder', Object.assign(o, { r: 0.55, ch: 0.9 }), b); z += 0.9; }
      else if (k === 'cone') body += S6.solidBody('cone', Object.assign(o, { r: 0.55, ch: 1.1 }), b);
      else if (k === 'sphere') body += S6.solidBody('sphere', Object.assign(o, { r: 0.5 }), b);
      else if (k === 'pyramid') body += S6.solidBody('pyramid', Object.assign(o, { pa: 0.5, ph: 1.1 }), b);
    });
    return S6.wrap(body, b, { label: 'tower of solids' });
  };
  const towerText = ps => { const c = {}; ps.forEach(k => c[k] = (c[k] || 0) + 1); return ['box', 'cube', 'cylinder', 'pyramid', 'cone', 'sphere'].filter(k => c[k]).map(k => plural(c[k], TOWER_NAMES[k])).join(', '); };
  E1.skill({ id: 'I.6.08', name: 'Solids from blocks', steps: {
    a: { t: 'with blocks', g: R => {
      if (R.bool()) { const n = R.int(2, 6); return num('How many blocks are in this tower?', n, `Count from the bottom up: ${n} blocks.`, { visual: S6.cubes(wallCubes([n]), { fill: R.pick(COLS) }) }); }
      const n = R.int(2, 5); return num('How many blocks are in this row?', n, `Count along the row: ${n} blocks.`, { visual: S6.cubes(wallCubes(Array(n).fill(1)), { fill: R.pick(COLS) }) });
    } },
    b: { t: 'copy a model', g: R => {
      const col = R.pick(COLS);
      if (R.bool(0.6)) {
        const len = R.int(2, 4), hs = Array.from({ length: len }, () => R.int(1, 3)), rev = hsKey(hs.slice().reverse()), seen = new Set([hsKey(hs), rev]), ds = [];
        const muts = [s => { const i = R.int(0, s.length - 1); s[i] = s[i] === 3 ? 2 : s[i] + (R.bool() ? 1 : -1); return s; }, s => { const i = R.int(0, s.length - 2); [s[i], s[i + 1]] = [s[i + 1], s[i]]; return s; }, s => s.concat(R.int(1, 2)), s => s.length > 2 ? s.slice(1) : s.concat(1)];
        for (let t = 0; t < 60 && ds.length < 2; t++) { const s = R.pick(muts)(hs.slice()); if (s.some(h => h < 1)) continue; const k = hsKey(s); if (!seen.has(k) && !seen.has(hsKey(s.slice().reverse()))) { seen.add(k); ds.push(s); } }
        const pic = h => S6.cubes(wallCubes(h), { fill: col, u: 20 });
        return choice(R, 'Which one is built the same as the model?', pic(hs), ds.map(pic), `Check each column from left to right: ${hs.join(', ')} blocks high.`, { visual: S6.cubes(wallCubes(hs), { fill: col }) });
      }
      const cells = randFloor(R, R.int(3, 6)), key = floorKey(cells), ds = [], seen = new Set([key]);
      for (let t = 0; t < 80 && ds.length < 2; t++) {
        let s = cells.map(c => c.slice()); const m = R.int(0, 2);
        if (m === 0) s.pop(); else if (m === 1) s = randFloor(R, cells.length); else { const [x, y] = R.pick(s), [dx, dy] = R.pick([[1, 0], [-1, 0], [0, 1], [0, -1]]); if (!s.some(c => c[0] === x + dx && c[1] === y + dy)) s.push([x + dx, y + dy]); }
        const k = floorKey(s); if (!seen.has(k) && s.length >= 2) { seen.add(k); ds.push(s); }
      }
      const pic = c => S6.cubes(floorCubes(c), { fill: col, u: 20, iso: 1 });
      return choice(R, 'Which one is built the same as the model?', pic(cells), ds.map(pic), `The model has ${cells.length} blocks in this shape. Check the number and where each block sits.`, { visual: S6.cubes(floorCubes(cells), { fill: col, iso: 1 }) });
    } },
    c: { t: 'from a picture', g: R => {
      const bot = R.pick(['box', 'cube', 'cylinder']), n = R.int(2, 3), ps = [bot];
      if (n === 3) ps.push(R.pick(['cube', 'cylinder']));
      const below = ps[ps.length - 1]; ps.push(R.pick(['cone', 'sphere', 'cube', 'cylinder'].concat(below === 'cube' || below === 'box' ? ['pyramid'] : [])));
      const ans = towerText(ps), swap = { box: 'cube', cube: R.pick(['box', 'cylinder']), cylinder: 'cube', cone: 'pyramid', sphere: 'cone', pyramid: 'cone' };
      const cands = [ps.map((k, i) => i === ps.length - 1 ? swap[k] : k), ps.map((k, i) => i === 0 ? swap[k] : k), ps.slice(1), ps.concat('cube'), ps.map((k, i) => i === 1 ? swap[k] : k)];
      const ds = [...new Set(cands.map(towerText))].filter(t => t !== ans);
      return choice(R, 'Which blocks were used to build this?', ans, R.sample(ds, 2), `From the bottom up: ${ps.map(k => TOWER_NAMES[k]).join(', then ')}.`, { visual: S6.tower(ps, R.sample([C.blue, C.teal, C.violet, C.red, C.pink], ps.length)) });
    } },
    d: { t: 'count the cubes', g: R => {
      const m = R.int(0, 2); let cubes, how, ko;
      if (m === 0) { const hs = Array.from({ length: R.int(3, 5) }, () => R.int(1, 3)); cubes = wallCubes(hs); how = `Count each column: ${hs.join(' + ')} = ${cubes.length}.`; }
      else if (m === 1) { const n = R.int(3, 4), up = R.bool(), hs = Array.from({ length: n }, (_, i) => up ? i + 1 : n - i); cubes = wallCubes(hs); how = `It is a staircase: ${hs.join(' + ')} = ${cubes.length}.`; }
      else { cubes = floorCubes(randFloor(R, R.int(5, 9))); ko = 1; how = `It is one layer, so count the tops: ${cubes.length}.`; }
      return num('How many cubes? Every cube can be seen.', cubes.length, how, { visual: S6.cubes(cubes, { fill: R.pick(COLS), iso: ko }) });
    } },
  } });

  /* ================= I.6.09 Position words ================= */
  E1.skill({ id: 'I.6.09', name: 'Position words', steps: {
    a: { t: 'above and below', g: R => {
      const [A, B] = R.sample(OBJ, 2), up = R.bool(), col = R.int(0, 1);
      const vis = S6.scene([{ k: A, c: col, r: up ? 0 : 2 }, { k: B, c: col, r: up ? 2 : 0 }], 2, 3, { s: 60 });
      return choiceFixed(`Where is the ${A}?`, [`above the ${B}`, `below the ${B}`], up ? 0 : 1, `The ${A} is ${up ? 'higher up, so it is above' : 'lower down, so it is below'} the ${B}.`, { visual: vis });
    } },
    b: { t: 'beside and between', g: R => {
      const m = R.int(0, 2);
      if (m === 0) {
        const os = R.sample(OBJ, 3);
        return choice(R, `What is between the ${os[0]} and the ${os[2]}?`, os[1], [os[0], os[2]], `The ${os[1]} is in the middle, with the ${os[0]} on one side and the ${os[2]} on the other.`, { visual: S6.scene(R.bool() ? os.map((k, i) => ({ k, c: i, r: 0 })) : os.map((k, i) => ({ k, c: 2 - i, r: 0 })), 3, 1, { s: 70 }) });
      }
      if (m === 1) {
        const os = R.sample(OBJ, 4), cs = [0, 1, 2, 3];
        return choice(R, `What is between the ${os[1]} and the ${os[3]}?`, os[2], [os[0], os[1]], `Find the ${os[1]} and the ${os[3]}. The ${os[2]} is in the middle of them.`, { visual: S6.scene(os.map((k, i) => ({ k, c: cs[i], r: 0 })), 4, 1, { s: 66 }) });
      }
      const [A, B, D] = R.sample(OBJ, 3), side = R.bool(), where = R.pick(['beside', 'above', 'below']);
      const items = [{ k: B, c: 1, r: 1 }, { k: A, c: where === 'beside' ? (side ? 2 : 0) : 1, r: where === 'above' ? 0 : where === 'below' ? 2 : 1 }, { k: D, c: side ? 0 : 2, r: R.pick([0, 2]) }];
      return choiceFixed(`Where is the ${A}?`, [`above the ${B}`, `beside the ${B}`, `below the ${B}`], ['above', 'beside', 'below'].indexOf(where), `The ${A} is ${where === 'beside' ? 'next to the ' + B + ', at the same height' : where + ' the ' + B}.`, { visual: S6.scene(items, 3, 3, { s: 58 }) });
    } },
    c: { t: 'in front and behind', g: R => {
      const [A, B] = R.sample(['ball', 'box', 'tree', 'car'], 2), front = R.bool(), s = 84, dx = R.pick([-1, 1]) * s * 0.42;
      const back = front ? B : A, fr = front ? A : B, W = 240, H = 130;
      const body = `<line x1="0" y1="${H - 8}" x2="${W}" y2="${H - 8}" stroke="${C.line}" stroke-width="3"/>` + S6.obj(back, W / 2 + dx, H - 8 - s * 0.5 - 14, s * 0.92) + S6.obj(fr, W / 2 - dx * 0.3, H - 8 - s * 0.45, s);
      return choiceFixed(`Where is the ${A}?`, [`in front of the ${B}`, `behind the ${B}`], front ? 0 : 1, front ? `The ${A} is not covered. It hides part of the ${B}, so it is in front.` : `Part of the ${A} is hidden by the ${B}, so the ${A} is behind it.`, { visual: V.svg(W, H, body, 'picture') });
    } },
    d: { t: 'left and right', g: R => {
      const n = R.int(3, 4), os = R.sample(OBJ, n), vis = S6.scene(os.map((k, i) => ({ k, c: i, r: 0 })), n, 1, { s: 70 });
      if (R.bool()) {
        const i = R.int(0, n - 1), j = R.pick([...Array(n).keys()].filter(x => x !== i)), left = i < j;
        return choiceFixed(`As you look at it, is the ${os[i]} left or right of the ${os[j]}?`, ['left', 'right'], left ? 0 : 1, `Your left is the side of your left hand. The ${os[i]} is on the ${left ? 'left' : 'right'} side of the ${os[j]}.`, { visual: vis });
      }
      const goLeft = R.bool(), i = goLeft ? R.int(1, n - 1) : R.int(0, n - 2), ans = os[goLeft ? i - 1 : i + 1], other = os[goLeft ? i + 1 : i - 1];
      return choice(R, `As you look at it, what is just to the ${goLeft ? 'left' : 'right'} of the ${os[i]}?`, ans, [other, os[i]].filter(Boolean), `Start at the ${os[i]} and look one step to your ${goLeft ? 'left' : 'right'}: the ${ans}.`, { visual: vis });
    } },
  } });

  /* ================= I.6.10 Directions on a grid ================= */
  const bfs = (cols, rows, rocks, s, t) => {
    const key = (x, y) => x + ',' + y, rk = new Set(rocks.map(r => key(r[0], r[1]))), dist = { [key(...s)]: 0 }, q = [s];
    while (q.length) { const [x, y] = q.shift(); if (x === t[0] && y === t[1]) return dist[key(x, y)]; for (const [dx, dy] of DIRS) { const nx = x + dx, ny = y + dy, k = key(nx, ny); if (nx < 0 || ny < 0 || nx >= cols || ny >= rows || rk.has(k) || k in dist) continue; dist[k] = dist[key(x, y)] + 1; q.push([nx, ny]); } }
    return -1;
  };
  E1.skill({ id: 'I.6.10', name: 'Directions on a grid', steps: {
    a: { t: 'forward and back', g: R => {
      const dir = R.int(0, 3), horiz = dir % 2 === 1, cols = horiz ? 7 : 3, rows = horiz ? 3 : 6, len = horiz ? cols : rows, [dx, dy] = DIRS[dir];
      const fwd = R.bool(0.65), k = R.int(1, 4), sgn = fwd ? 1 : -1;
      // position along the line so that the target fits
      const lo = fwd ? (dx + dy < 0 ? k : 0) : (dx + dy < 0 ? 0 : k), hi = fwd ? (dx + dy < 0 ? len - 1 : len - 1 - k) : (dx + dy < 0 ? len - 1 - k : len - 1);
      const p = R.int(lo, hi), other = horiz ? R.int(0, rows - 1) : R.int(0, cols - 1);
      const at = q => horiz ? [q, other] : [other, q], step = dx + dy, rob = at(p);
      if (R.bool(0.55) || !fwd) {
        const st = at(p + sgn * step * k);
        return num(`How many steps ${fwd ? 'forward' : 'back'} to reach the star?`, k, `The robot faces ${DIRN[dir]}. ${fwd ? 'Forward' : 'Back'} is ${fwd ? 'the way it faces' : 'the other way'}: ${plural(k, 'step')}.`, { visual: S6.grid(cols, rows, [{ t: 'robot', x: rob[0], y: rob[1], dir }, { t: 'star', x: st[0], y: st[1] }]) });
      }
      const opts = [k, k + 1, k - 1, -k].filter(v => v !== 0 && p + v * step >= 0 && p + v * step < len);
      const chosen = [k, ...R.sample(opts.filter(v => v !== k), 2)], letters = R.shuffle(['A', 'B', 'C']).slice(0, chosen.length);
      const items = [{ t: 'robot', x: rob[0], y: rob[1], dir }, ...chosen.map((v, i) => { const q = at(p + v * step); return { t: 'letter', x: q[0], y: q[1], ch: letters[i] }; })];
      return choice(R, `The robot goes forward ${k}. Where does it stop?`, letters[0], letters.slice(1), `Forward is the way the robot faces (${DIRN[dir]}). Count ${plural(k, 'square')}: it stops on ${letters[0]}.`, { visual: S6.grid(cols, rows, items) });
    } },
    b: { t: "turns (the character's left and right)", g: R => {
      const d = R.int(0, 3), T = R.pick([['turns right', 1], ['turns left', 3], ['turns around', 2], ['turns right 2 times', 2], ['turns left, then right', 0], ['turns right', 1], ['turns left', 3]]), nd = (d + T[1]) % 4;
      return choiceFixed(`The robot ${T[0]}. Which way does it face now?`, [0, 1, 2, 3].map(S6.robotIcon), nd, `It starts facing ${DIRN[d]}. Right and left mean the robot's own right and left. After it ${T[0]}, it faces ${DIRN[nd]}.`, { visual: S6.grid(3, 3, [{ t: 'robot', x: 1, y: 1, dir: d }]) });
    } },
    c: { t: 'short routes', g: R => {
      for (let t = 0; t < 200; t++) {
        const cols = R.int(5, 6), rows = R.int(4, 5), s = [R.int(0, cols - 1), R.int(0, rows - 1)], e = [R.int(0, cols - 1), R.int(0, rows - 1)], nr = R.int(0, 4), rocks = [];
        for (let i = 0; i < nr; i++) { const r = [R.int(0, cols - 1), R.int(0, rows - 1)]; if ((r[0] !== s[0] || r[1] !== s[1]) && (r[0] !== e[0] || r[1] !== e[1]) && !rocks.some(q => q[0] === r[0] && q[1] === r[1])) rocks.push(r); }
        const d = bfs(cols, rows, rocks, s, e), man = Math.abs(s[0] - e[0]) + Math.abs(s[1] - e[1]);
        if (d < 3 || d > 9) continue;
        return num('What is the fewest steps to the star?', d, `Move one square at a time (no corner jumps)${rocks.length ? ' and go around the rocks' : ''}. The shortest way is ${d} steps${d > man ? ', because a rock is in the way' : ''}.`, { visual: S6.grid(cols, rows, [{ t: 'robot', x: s[0], y: s[1], dir: 1 }, { t: 'star', x: e[0], y: e[1] }, ...rocks.map(r => ({ t: 'rock', x: r[0], y: r[1] }))], { cell: 42 }) });
      }
      throw new Error('route');
    } },
    d: { t: 'give directions', g: R => {
      const cols = 6, rows = 5; let s, e;
      do { s = [R.int(0, cols - 1), R.int(0, rows - 1)]; e = [R.int(0, cols - 1), R.int(0, rows - 1)]; } while (s[0] === e[0] || s[1] === e[1]);
      const dx = e[0] - s[0], dy = e[1] - s[1], hx = dx > 0 ? '→' : '←', vy = dy > 0 ? '↓' : '↑', ax = Math.abs(dx), ay = Math.abs(dy);
      const txt = (h, a, v, b) => `${h} ${a}, then ${v} ${b}`, ans = txt(hx, ax, vy, ay);
      const ds = [txt(hx, ay, vy, ax), txt(hx === '→' ? '←' : '→', ax, vy, ay), txt(hx, ax, vy === '↑' ? '↓' : '↑', ay), txt(hx, ax + 1, vy, ay)];
      return choice(R, 'Which directions take the robot to the star?', ans, R.sample(ds.filter(x => x !== ans), 3), `The star is ${ax} square${ax > 1 ? 's' : ''} ${dx > 0 ? 'right' : 'left'} and ${ay} square${ay > 1 ? 's' : ''} ${dy > 0 ? 'down' : 'up'}.`, { visual: S6.grid(cols, rows, [{ t: 'robot', x: s[0], y: s[1], dir: dx > 0 ? 1 : 3 }, { t: 'star', x: e[0], y: e[1] }], { cell: 42 }) });
    } },
  } });

  /* ================= I.6.11 Halves ================= */
  const partPic = (R, n, eq, o = {}) => { const s = S6.split(R, n, eq, o.shapes); return { svg: S6.parts(s.parts, { shade: o.shade ? [R.int(0, n - 1)] : [], fill: o.fill, w: o.w, h: o.h }), sh: s.sh }; };
  E1.skill({ id: 'I.6.11', name: 'Halves', steps: {
    a: { t: 'equal parts', g: R => {
      const n = R.int(2, 4), eq = R.bool(), col = R.pick(COLS);
      if (R.bool(0.6)) { const p = partPic(R, n, eq, { w: 150, h: 120 }); return choiceFixed(`Are these ${n} parts equal?`, ['yes', 'no'], eq ? 0 : 1, eq ? `Yes. All ${n} parts are the same size.` : 'No. Some parts are bigger than others.', { visual: p.svg }); }
      return choice(R, 'Which one has equal parts?', partPic(R, n, true, { shade: true, fill: col, w: 110, h: 90 }).svg, [partPic(R, n, false, { shade: true, fill: col, w: 110, h: 90 }).svg, partPic(R, n, false, { shade: true, fill: col, w: 110, h: 90 }).svg], 'Equal parts are all exactly the same size.');
    } },
    b: { t: 'halves of shapes', g: R => {
      const col = R.pick(COLS), pp = (n, e) => partPic(R, n, e, { shade: true, fill: col, w: 110, h: 90 }).svg;
      if (R.bool(0.35)) { const eq = R.bool(); return yn('Is the shaded part one half?', eq, eq ? 'Yes. The shape is cut into 2 equal parts and 1 is shaded.' : 'No. The 2 parts are not the same size, so they are not halves.', { visual: partPic(R, 2, eq, { shade: true, fill: col, w: 150, h: 120 }).svg }); }
      return choice(R, 'Which shape is cut in half?', pp(2, true), [pp(2, false), R.bool() ? pp(4, true) : pp(3, true)], 'Halves are 2 equal parts. Look for exactly 2 parts that are the same size.');
    } },
    c: { t: 'half of a set', g: R => {
      const n = 2 * R.int(1, 7), col = R.pick(COLS);
      if (R.bool(0.3)) return num(`${n} birds. Half fly away. How many fly away?`, n / 2, `Share ${n} into 2 equal groups: ${n / 2} and ${n / 2}.`, { visual: V.dots(n, { layout: n > 7 ? 'grid' : 'row', color: col, per: 5 }) });
      return num(`How many is half of ${n}?`, n / 2, `Share ${n} into 2 equal groups: ${n / 2} and ${n / 2}.`, { visual: V.dots(n, { layout: n > 7 ? 'grid' : 'row', color: col, per: 5 }) });
    } },
    d: { t: "spot parts that aren't halves", g: R => {
      const col = R.pick(COLS), pp = e => partPic(R, 2, e, { shade: true, fill: col, w: 110, h: 90 }).svg;
      return choice(R, 'Which one is NOT cut into halves?', pp(false), [pp(true), pp(true), pp(true)], 'Halves must be the same size. In this one, one part is bigger than the other.');
    } },
  } });

  /* ================= I.6.12 Quarters ================= */
  const halfHalf = (R, shadeQ, col) => {
    const sh = R.pick(['rect', 'square', 'circle']), P = BASES[sh]();
    let parts;
    if (sh === 'circle') { const a0 = R.pick([0, 90, 180, 270]); parts = sectors(P, [a0, a0 + 180, a0 + 270]); }
    else { const [A, B] = R.bool() ? strips(P, [0.5, 0.5], 'v') : strips(P, [0.5, 0.5], 'h'); const vert = B[0][0] !== A[0][0] || true; parts = [A, ...strips(B, [0.5, 0.5], sh === 'rect' ? (R.bool() ? 'h' : 'v') : R.pick(['h', 'v']))]; }
    const ar = parts.map(areaOf), tot = ar.reduce((a, b) => a + b), qi = ar.findIndex(a => Math.abs(a / tot - 0.25) < 0.01), hi = ar.findIndex(a => Math.abs(a / tot - 0.5) < 0.01);
    if (qi < 0 || hi < 0) throw new Error('halfHalf');
    return S6.parts(parts, { shade: [shadeQ ? qi : hi], fill: col, w: 150, h: 120 });
  };
  E1.skill({ id: 'I.6.12', name: 'Quarters', steps: {
    a: { t: 'half of a half', g: R => {
      const m = R.int(0, 2), col = R.pick(COLS);
      if (m === 0) { const q = R.bool(0.65); return choiceFixed('What part of the whole is shaded?', ['one half', 'one quarter', 'one third'], q ? 1 : 0, q ? 'The shape was cut in half, then that half was cut in half again. Half of a half is one quarter.' : 'The shaded part is one of 2 equal halves of the whole shape.', { visual: halfHalf(R, q, col) }); }
      if (m === 1) { const k = R.int(1, 6), n = 4 * k; return num(`Half of ${n} is ${2 * k}. What is half of ${2 * k}?`, k, `Half of ${2 * k} is ${k}. So half of a half of ${n} is ${k}, a quarter of ${n}.`); }
      return choice(R, 'Cut a shape in half, then cut each half in half. How many parts?', 4, [2, 3, 8], 'Each of the 2 halves makes 2 parts: 2 + 2 = 4 quarters.', { visual: partPic(R, 2, true, { shapes: ['rect', 'square', 'circle'], w: 130, h: 100 }).svg });
    } },
    b: { t: 'fourths of shapes', g: R => {
      const col = R.pick(COLS), pp = (n, e) => partPic(R, n, e, { shade: true, fill: col, w: 110, h: 90 }).svg;
      if (R.bool(0.35)) { const eq = R.bool(); return yn('Is the shaded part one quarter?', eq, eq ? 'Yes. There are 4 equal parts and 1 is shaded.' : 'No. The 4 parts are not all the same size.', { visual: partPic(R, 4, eq, { shade: true, fill: col, w: 150, h: 120 }).svg }); }
      return choice(R, 'Which shape is cut into quarters?', pp(4, true), [pp(4, false), R.bool() ? pp(2, true) : pp(3, true)], 'Quarters are 4 equal parts. Check there are 4 parts and they are all the same size.');
    } },
    c: { t: 'a quarter of a set', g: R => {
      const k = R.int(1, 5), n = 4 * k, col = R.pick(COLS);
      return num(R.bool() ? `How many is a quarter of ${n}?` : `Share ${n} into 4 equal groups. How many in each?`, k, `Share ${n} into 4 equal groups: ${k} in each. So a quarter of ${n} is ${k}.`, { visual: V.dots(n, { layout: n > 8 ? 'grid' : 'row', per: 5, color: col }) });
    } },
    d: { t: 'compare halves and quarters', g: R => {
      const m = R.int(0, 2), col = R.pick(COLS);
      if (m === 0) {
        const sh = R.pick(['rect', 'square', 'circle']), h = partPic(R, 2, true, { shapes: [sh], shade: true, fill: col, w: 110, h: 90 }).svg, q = partPic(R, 4, true, { shapes: [sh], shade: true, fill: col, w: 110, h: 90 }).svg;
        return choice(R, 'Which shaded part is bigger?', h, [q], 'The same shape cut into 2 parts gives bigger parts than cut into 4. A half is bigger than a quarter.');
      }
      if (m === 1) { const thing = R.pick(['pizza', 'cake', 'sandwich', 'pie', 'cookie']); const more = R.bool(); return choiceFixed(`Which is ${more ? 'more' : 'less'} of the same ${thing}?`, ['a half', 'a quarter', 'they are the same'], more ? 0 : 1, `Cut into 2 parts, each piece is bigger than when cut into 4. A half is more than a quarter.`); }
      const Q = R.pick([['How many quarters make a half?', 2, 'Half of a half is a quarter, so 2 quarters make a half.'], ['How many quarters make a whole?', 4, 'A whole cut into quarters has 4 equal parts.'], ['How many halves make a whole?', 2, 'A whole cut into halves has 2 equal parts.']]);
      return num(Q[0], Q[1], Q[2], { visual: partPic(R, 4, true, { shapes: ['circle', 'square'], w: 120, h: 100 }).svg });
    } },
  } });

  /* ================= I.6.13 Symmetry ================= */
  const symShape = (R, o = {}) => {
    const k = R.pick(Object.keys(SYMSH)), pts = V.shp_pts(SYMSH[k](), 60, 55, 40), L = foldLines(pts);
    return { k, pts, L };
  };
  E1.skill({ id: 'I.6.13', name: 'Symmetry', steps: {
    a: { t: 'fold to match', g: R => {
      const col = R.pick(COLS);
      if (R.bool()) {
        const half = randHalf(R, 3, 5), yes = R.bool(), right = yes ? mapSet(half, (x, y) => [5 - x, y]) : (R.bool() ? mapSet(half, (x, y) => [x + 3, y]) : (() => { const m = mapSet(half, (x, y) => [5 - x, y]), k = cellKey(R.int(3, 5), R.int(0, 4)); m.has(k) ? m.delete(k) : m.add(k); return m; })());
        const full = new Set([...half, ...right]), sym = setKey(full) === setKey(mapSet(full, (x, y) => [5 - x, y]));
        return choiceFixed('Fold on the dashed line. Do the 2 sides match?', ['yes', 'no'], sym ? 0 : 1, sym ? 'Yes. Each square on one side has a partner the same distance from the line on the other side.' : 'No. Some squares have no partner in the same place on the other side.', { visual: S6.cellPic(6, 5, full, { v: 3, fill: col }) });
      }
      const s = symShape(R), want = R.bool(), pool = s.L.filter(l => l.sym === want), l = pool.length ? R.pick(pool) : R.pick(s.L);
      return choiceFixed('Fold on the dashed line. Do the 2 sides match?', ['yes', 'no'], l.sym ? 0 : 1, l.sym ? 'Yes. The 2 sides are mirror images, so they fold exactly on top of each other.' : 'No. One side sticks out past the other when you fold, so they do not match.', { visual: S6.lineShape(s.pts, l.p1, l.p2, { fill: col }) });
    } },
    b: { t: 'the line of symmetry', g: R => {
      const col = R.pick(COLS);
      if (R.bool()) {
        const half = randHalf(R, 3, 6), full = new Set([...half, ...mapSet(half, (x, y) => [5 - x, y])]);
        const cands = [{ v: 3 }, { v: 2 }, { v: 4 }, { h: 3 }, { v: 1 }].map(c => ({ c, sym: c.v !== undefined ? setKey(full) === setKey(mapSet(full, (x, y) => [2 * c.v - 1 - x, y])) && [...full].every(k => { const x = +k.split(',')[0]; return 2 * c.v - 1 - x >= 0 && 2 * c.v - 1 - x < 6; }) : setKey(full) === setKey(mapSet(full, (x, y) => [x, 5 - y])) }));
        const good = cands[0], bad = R.sample(cands.filter(c => !c.sym), 2), pic = c => S6.cellPic(6, 6, full, Object.assign({ cell: 15, fill: col }, c.c));
        return choice(R, 'Which dashed line is a line of symmetry?', pic(good), bad.map(pic), 'Fold on the right line and both sides match square for square.');
      }
      let s; do s = symShape(R); while (!s.L.some(l => l.sym) || s.L.filter(l => !l.sym).length < 2);
      const good = R.pick(s.L.filter(l => l.sym)), bad = R.sample(s.L.filter(l => !l.sym), 2), pic = l => S6.lineShape(s.pts, l.p1, l.p2, { fill: col });
      return choice(R, 'Which dashed line is a line of symmetry?', pic(good), bad.map(pic), 'A line of symmetry cuts a shape into 2 matching halves that fold exactly onto each other.');
    } },
    c: { t: 'complete a picture', g: R => {
      const col = R.pick(COLS);
      for (let t = 0; t < 50; t++) {
        const half = randHalf(R, 3, 5), mir = mapSet(half, (x, y) => [2 - x, y]), cands = [half, mapSet(mir, (x, y) => [x, 4 - y]), (() => { const m = new Set(mir), k = cellKey(R.int(0, 2), R.int(0, 4)); m.has(k) ? m.delete(k) : m.add(k); return m; })()];
        const ds = [], seen = new Set([setKey(mir)]); cands.forEach(c => { const k = setKey(c); if (!seen.has(k) && c.size) { seen.add(k); ds.push(c); } });
        if (ds.length < 2) continue;
        const pic = s => S6.cellPic(3, 5, s, { cell: 16, fill: col });
        return choice(R, 'Which half completes the picture?', pic(mir), ds.slice(0, 3).map(pic), 'The missing half is a mirror image: each square is the same distance from the line, on the other side.', { visual: S6.cellPic(6, 5, half, { v: 3, fill: col }) });
      }
      throw new Error('complete');
    } },
    d: { t: 'symmetry around you', g: R => {
      if (R.bool(0.6)) {
        const SYM = ['A', 'H', 'M', 'O', 'T', 'U', 'V', 'W', 'X', 'Y', '8', '0'], NON = ['F', 'G', 'J', 'L', 'N', 'P', 'R', 'S', 'Z', '2', '4', '7'];
        if (R.bool()) { const a = R.pick(SYM); return choice(R, 'Which one has a line of symmetry?', a, R.sample(NON, 3), `${a} can be folded down the middle so both sides match.`); }
        const a = R.pick(NON); return choice(R, 'Which one has NO line of symmetry?', a, R.sample(SYM, 3), `However you fold ${a}, the 2 sides do not match.`);
      }
      const col = R.pick(COLS), F = f1;
      const pic = { heart: `<path d="M45 78 L14 46 A17 17 0 0 1 45 24 A17 17 0 0 1 76 46 Z" fill="${C.red}" stroke="${mix(C.red, -0.3)}" stroke-width="2.5" stroke-linejoin="round"/>`, house: `<polygon points="45,10 78,40 70,40 70,80 20,80 20,40 12,40" fill="${mix(C.amber, 0.2)}" stroke="${mix(C.amber, -0.4)}" stroke-width="2.5" stroke-linejoin="round"/><rect x="37" y="56" width="16" height="24" fill="${C.blue}"/>`, tree: S6.obj('tree', 45, 45, 90), butterfly: `<ellipse cx="30" cy="38" rx="17" ry="22" fill="${C.violet}" stroke="${mix(C.violet, -0.3)}" stroke-width="2"/><ellipse cx="60" cy="38" rx="17" ry="22" fill="${C.violet}" stroke="${mix(C.violet, -0.3)}" stroke-width="2"/><ellipse cx="32" cy="66" rx="12" ry="12" fill="${C.pink}"/><ellipse cx="58" cy="66" rx="12" ry="12" fill="${C.pink}"/><rect x="42" y="22" width="6" height="56" rx="3" fill="${C.ink}"/>`,
        flag: `<rect x="16" y="10" width="5" height="72" fill="${C.ink}"/><polygon points="21,12 76,24 21,40" fill="${C.red}"/>`, boot: `<polygon points="28,10 52,10 52,56 80,62 80,80 28,80" fill="${mix(C.amber, -0.3)}" stroke="${C.ink}" stroke-width="2" stroke-linejoin="round"/>`, sailboat: `<polygon points="44,8 44,56 16,56" fill="${C.blue}"/><polygon points="50,20 50,56 70,56" fill="${mix(C.blue, 0.5)}"/><polygon points="10,62 80,62 68,78 22,78" fill="${mix(C.amber, -0.3)}"/>`, moonkey: `<circle cx="30" cy="45" r="18" fill="none" stroke="${C.amber}" stroke-width="8"/><rect x="46" y="41" width="36" height="8" fill="${C.amber}"/><rect x="66" y="49" width="7" height="12" fill="${C.amber}"/>` };
      const S = ['heart', 'house', 'tree', 'butterfly'], N = ['flag', 'boot', 'sailboat', 'moonkey'], sv = k => V.svg(90, 90, pic[k], 'picture');
      const a = R.pick(S);
      return choice(R, 'Which picture has a line of symmetry?', sv(a), R.sample(N, 2).map(sv), `A line down the middle of the ${a} makes 2 matching halves.`);
    } },
  } });

  /* ================= I.6.14 Shape riddles ================= */
  const RP = { circle: { s: 0 }, oval: { s: 0 }, triangle: { s: 3 }, square: { s: 4, sq: 1 }, rectangle: { s: 4, sq: 1 }, rhombus: { s: 4 }, trapezoid: { s: 4 }, pentagon: { s: 5 }, hexagon: { s: 6 } };
  const CLUES = [['I have 3 sides.', p => p.s === 3], ['I have 3 corners.', p => p.s === 3], ['I have 5 sides.', p => p.s === 5], ['I have 5 corners.', p => p.s === 5], ['I have 6 sides.', p => p.s === 6], ['I have 6 corners.', p => p.s === 6], ['I have no corners.', p => p.s === 0], ['I have 4 sides.', p => p.s === 4], ['I have 4 square corners.', p => !!p.sq]];
  const TWO = [
    ['square', ['I have 4 square corners.', 'All my sides are the same length.'], ['rectangle', 'rhombus', 'triangle']],
    ['rectangle', ['I have 4 square corners.', '2 of my sides are long and 2 are short.'], ['square', 'trapezoid', 'rhombus']],
    ['circle', ['I have no corners.', 'I am perfectly round.'], ['oval', 'hexagon', 'square']],
    ['oval', ['I have no corners.', 'I am stretched, like an egg.'], ['circle', 'rectangle', 'rhombus']],
    ['pentagon', ['I have more than 4 sides.', 'I have fewer than 6 sides.'], ['hexagon', 'square', 'triangle']],
    ['hexagon', ['I have more than 5 corners.', 'I have fewer than 7 corners.'], ['pentagon', 'octagon', 'circle']],
    ['S:cylinder', ['I can roll.', 'I have 2 flat faces.'], ['sphere', 'cone', 'cube']],
    ['S:sphere', ['I can roll.', 'I have no flat faces.'], ['cylinder', 'cone', 'cube']],
    ['S:cube', ['I have 6 faces.', 'All my faces are squares.'], ['box', 'pyramid', 'cylinder']],
    ['S:cone', ['I have just 1 flat face.', 'I have a point.'], ['pyramid', 'cylinder', 'sphere']],
    ['S:pyramid', ['I have a point.', 'My faces are a square and 4 triangles.'], ['cone', 'cube', 'box']],
  ];
  const RID = { triangle: 'I have 3 sides and 3 corners.', square: 'I have 4 equal sides and 4 square corners.', rectangle: 'I have 4 square corners. 2 sides are long, 2 are short.', circle: 'I am round. I have no corners.', oval: 'I am round like an egg. I have no corners.', pentagon: 'I have 5 sides and 5 corners.', hexagon: 'I have 6 sides and 6 corners.', 'S:cube': 'I am a solid with 6 square faces.', 'S:cylinder': 'I roll. I have 2 flat circle faces.', 'S:cone': 'I roll. I have 1 flat face and a point.', 'S:sphere': 'I roll. I have no flat faces at all.', 'S:pyramid': 'I have a square face and 4 triangle faces.', 'S:box': 'I have 6 rectangle faces, like a cereal box.' };
  const rpic = (R, k, col) => k.startsWith('S:') ? solidPic(R, k.slice(2), col) : kIcon(R, k, col, { tall: false, tri: 'eq' });
  E1.skill({ id: 'I.6.14', name: 'Shape riddles', steps: {
    a: { t: 'guess from features', g: R => {
      const [clue, f] = R.pick(CLUES), yes = Object.keys(RP).filter(k => f(RP[k])), no = Object.keys(RP).filter(k => !f(RP[k])), k = R.pick(yes), col = R.pick(COLS);
      if (R.bool(0.5) && NAMES.includes(k)) return choice(R, `${clue} What am I?`, k, R.sample(no.filter(x => NAMES.includes(x)), 2), `${DESC[k]}`);
      return choice(R, `${clue} Which shape am I?`, kIcon(R, k, col, { tall: false }), R.sample(no, 2).map(x => kIcon(R, x, col, { tall: false })), `${DESC[k]}`);
    } },
    b: { t: 'two clues', g: R => {
      const [k, cl, ds] = R.pick(TWO), col = R.pick([C.blue, C.teal, C.violet, C.red]), solid = k.startsWith('S:'), ans = solid ? k.slice(2) : k;
      const dd = R.sample(ds, 2);
      if (R.bool(0.6)) return choice(R, `${cl[0]} ${cl[1]} Which am I?`, rpic(R, k, col), dd.map(d => rpic(R, solid ? 'S:' + d : d, col)), `Only one shape fits both clues: the ${solid ? SOLN[ans] : ans}.`);
      return choice(R, `${cl[0]} ${cl[1]} What am I?`, solid ? SOLN[ans] : ans, dd.map(d => solid ? SOLN[d] : d), `The ${solid ? SOLN[ans] : ans} fits both clues. The others only fit one or none.`);
    } },
    c: { t: 'which riddle fits', g: R => {
      const keys = Object.keys(RID), flat = R.bool(0.6), pool = keys.filter(k => k.startsWith('S:') !== flat), k = R.pick(pool), col = R.pick([C.blue, C.teal, C.violet, C.red]);
      const vis = k.startsWith('S:') ? solidPic(R, k.slice(2), col, { w: 120 }) : kIcon(R, k, col, { w: 120, tall: false, rot: R.pick([0, 0, 30]) });
      return choice(R, 'Which riddle is about this shape?', RID[k], R.sample(pool.filter(x => x !== k), 2).map(x => RID[x]), `Check each clue against the shape. "${RID[k]}" is true for it.`, { visual: vis });
    } },
    d: { t: 'sort shapes by riddle', g: R => {
      const [clue, f] = R.pick([CLUES[0], CLUES[6], CLUES[7], ['I have more than 4 corners.', p => p.s > 4], CLUES[8]]);
      const kinds = Object.keys(RP), n = R.int(6, 8), items = Array.from({ length: n }, () => R.pick(kinds));
      const cnt = items.filter(k => f(RP[k])).length;
      if (!cnt) items[0] = R.pick(kinds.filter(k => f(RP[k])));
      const ans = items.filter(k => f(RP[k])).length, cols = 4, cell = 70, slots = R.shuffle([...Array(8).keys()]);
      const body = items.map((k, i) => V.shp_draw(S6.pts(R, k), (slots[i] % cols) * cell + cell / 2, Math.floor(slots[i] / cols) * cell + cell / 2, 24, { fill: R.pick(COLS), rot: R.pick([0, 0, 45, 90]), sw: 2 })).join('');
      return num(`Riddle: "${clue}" How many shapes fit?`, ans, `Check each shape against the riddle. ${ans} of them ${ans === 1 ? 'fits' : 'fit'}.`, { visual: V.svg(cols * cell, 2 * cell, body, 'shapes') });
    } },
  } });
})();

/* Mathera · Era I · Unit I.7 Measure & data (I.7.01–I.7.16)
   Visual helpers live under V.msr_*. Money is always worked in cents (US) or baht (THB). */
(function(){ const {num, choice, choiceFixed, tf, V, C} = E1;

/* ================= shared helpers ================= */
const P1 = v => Math.round(v * 10) / 10;
const rad = d => d * Math.PI / 180;
const pt = (cx, cy, r, deg) => [P1(cx + r * Math.sin(rad(deg))), P1(cy - r * Math.cos(rad(deg)))];
const COLS = [C.red, C.blue, C.amber, C.teal, C.violet];
const cname = c => E1.colorName[c];
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const yn = (prompt, yes, explain, extra) => choiceFixed(prompt, ['Yes', 'No'], yes ? 0 : 1, explain, extra);
const pad2 = n => (n < 10 ? '0' : '') + n;
const nth = d => d + ((d % 100 >= 11 && d % 100 <= 13) ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' }[d % 10] || 'th'));
const U = O => O.units === 'imperial'
  ? { ab: 'in', one: 'inch', many: 'inches', max: 6 }
  : { ab: 'cm', one: 'centimeter', many: 'centimeters', max: 12 };
const nxt = h => h % 12 + 1, prv = h => (h + 10) % 12 + 1;   // 12-hour next / previous
const h12 = H => (H % 12) || 12;

/* ---------- clocks ---------- */
// analog clock: h (1–12 or 0–23), m minutes. o.noMin / o.noHour hide a hand; o.hA / o.mA override hand angles (degrees from 12)
V.msr_clock = function (h, m, o = {}) {
  const S = o.size || 180, c = S / 2, R0 = c - 5;
  let b = `<circle cx="${c}" cy="${c}" r="${R0}" fill="${C.paper}" stroke="${C.ink}" stroke-width="4"/>`;
  for (let i = 0; i < 60; i++) {
    const big = i % 5 === 0, [x1, y1] = pt(c, c, R0 - 3, i * 6), [x2, y2] = pt(c, c, R0 - (big ? 11 : 7), i * 6);
    b += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${big ? C.ink : C.line}" stroke-width="${big ? 2.5 : 1.5}"/>`;
  }
  for (let n = 1; n <= 12; n++) { const [x, y] = pt(c, c, R0 - 24, n * 30); b += V.text(x, y, n, { size: P1(S * 0.085), weight: 600 }); }
  const hA = o.hA !== undefined ? o.hA : ((h % 12) + m / 60) * 30, mA = o.mA !== undefined ? o.mA : m * 6;
  if (!o.noHour) { const [x, y] = pt(c, c, R0 * 0.42, hA); b += `<line x1="${c}" y1="${c}" x2="${x}" y2="${y}" stroke="${C.ink}" stroke-width="7" stroke-linecap="round"/>`; }
  if (!o.noMin) { const [x, y] = pt(c, c, R0 * 0.62, mA); b += `<line x1="${c}" y1="${c}" x2="${x}" y2="${y}" stroke="${C.blue}" stroke-width="4" stroke-linecap="round"/>`; }
  b += V.dot(c, c, 6, C.ink);
  return V.svg(S, S, b, 'analog clock');
};
// digital clock display showing the string s (e.g. "3:30" or "14:30")
V.msr_digital = function (s, o = {}) {
  const w = o.w || Math.max(150, s.length * 26 + 40), h = 76;
  const b = `<rect x="3" y="3" width="${w - 6}" height="${h - 6}" rx="14" fill="${C.ink}"/>` +
    `<rect x="11" y="11" width="${w - 22}" height="${h - 22}" rx="8" fill="#232730"/>` +
    `<text x="${w / 2}" y="${h / 2 + 1}" font-size="40" fill="#8FE3CF" text-anchor="middle" dominant-baseline="central" font-weight="700" font-family="ui-monospace,Menlo,Consolas,monospace">${V.esc(s)}</text>`;
  return V.svg(w, h, b, 'digital clock ' + s);
};
const t12 = (h, m) => `${h}:${pad2(m)}`;
const t24 = (H, m) => `${pad2(H)}:${pad2(m)}`;

/* ---------- money ---------- */
const GREY = { f: '#E6E8EB', s: '#8C929B' }, GOLD = { f: '#F2DFA0', s: '#B08D2E' }, COPPER = { f: '#E6B28C', s: '#A86F45' };
const PIECE = {
  US: {
    1: { r: 19, ...COPPER, t: '1¢' }, 5: { r: 22, ...GREY, t: '5¢' }, 10: { r: 17, ...GREY, t: '10¢' }, 25: { r: 25, ...GREY, t: '25¢' },
    100: { note: 1, f: '#E2EEDA', s: '#5F8A4A', t: '$1' }, 500: { note: 1, f: '#E2EEDA', s: '#5F8A4A', t: '$5' },
  },
  THB: {
    1: { r: 17, ...GREY, t: '1฿' }, 2: { r: 19, ...GOLD, t: '2฿' }, 5: { r: 21, ...GREY, t: '5฿' }, 10: { r: 25, ...GOLD, ring: GREY.f, t: '10฿' },
    20: { note: 1, f: '#DCEFD8', s: '#4E9150', t: '20฿' }, 50: { note: 1, f: '#DBE7F6', s: '#3F77B3', t: '50฿' }, 100: { note: 1, f: '#F6DDD8', s: '#BD5646', t: '100฿' },
  },
};
const SETS = { US: { coins: [1, 5, 10, 25], notes: [100, 500] }, THB: { coins: [1, 2, 5, 10], notes: [20, 50, 100] } };
const USNAME = { 1: 'penny', 5: 'nickel', 10: 'dime', 25: 'quarter' };
const pieceW = (v, set) => PIECE[set][v].note ? 96 : PIECE[set][v].r * 2;
const pieceH = (v, set) => PIECE[set][v].note ? 48 : PIECE[set][v].r * 2;
// one coin or note centered on (x,y)
V.msr_piece = function (v, set, x, y) {
  const p = PIECE[set][v];
  if (p.note) {
    return `<rect x="${x - 46}" y="${y - 23}" width="92" height="46" rx="5" fill="${p.f}" stroke="${p.s}" stroke-width="2.5"/>` +
      `<rect x="${x - 38}" y="${y - 15}" width="76" height="30" rx="3" fill="none" stroke="${p.s}" stroke-width="1" opacity="0.6"/>` +
      V.text(x, y, p.t, { size: 18, weight: 700, fill: C.ink });
  }
  let b = `<circle cx="${x}" cy="${y}" r="${p.r}" fill="${p.ring || p.f}" stroke="${p.s}" stroke-width="2.5"/>`;
  if (p.ring) b += `<circle cx="${x}" cy="${y}" r="${p.r - 6}" fill="${p.f}" stroke="${p.s}" stroke-width="1"/>`;
  else b += `<circle cx="${x}" cy="${y}" r="${p.r - 4}" fill="none" stroke="${p.s}" stroke-width="1" opacity="0.6"/>`;
  return b + V.text(x, y, p.t, { size: Math.max(12, Math.round(p.r * 0.62)), weight: 700 });
};
// a row (wrapping) of coins / notes; values in cents (US) or baht (THB)
V.msr_money = function (vals, set, o = {}) {
  const maxW = o.maxW || 560, gap = 10, rowH = 58;
  let x = 4, y = 0, W = 0, b = '';
  vals.forEach(v => {
    const w = pieceW(v, set);
    if (x + w > maxW && x > 4) { x = 4; y += rowH; }
    b += V.msr_piece(v, set, x + w / 2, y + rowH / 2); x += w + gap; W = Math.max(W, x - gap + 4);
  });
  return V.svg(Math.max(W, 20), y + rowH, b, 'money');
};
// price tag
V.msr_tag = function (s) {
  const w = s.length * 13 + 44, h = 44;
  return V.svg(w + 4, h + 4, `<path d="M2 ${h / 2 + 2} L20 4 H${w + 2} V${h} H20 Z" fill="${C.faint}" stroke="${C.ink}" stroke-width="2"/>` +
    V.dot(18, h / 2 + 2, 4, C.paper) + `<circle cx="18" cy="${h / 2 + 2}" r="4" fill="none" stroke="${C.ink}" stroke-width="1.5"/>` +
    V.text(w / 2 + 16, h / 2 + 2, s, { size: 20, weight: 700 }), 'price ' + s);
};
const money = (O, n) => O.coins === 'US' ? (n >= 100 && n % 100 === 0 ? '$' + n / 100 : n + '¢') : n + ' baht';
const unitWord = O => O.coins === 'US' ? 'cents' : 'baht';

/* ---------- lengths ---------- */
// strips/pencils in rows. items: [{from,len,color,kind:'pencil'|'strip', units:[{x,w,type:'clip'|'cube'|'big'}], label}]
// o.u = px per unit, o.span = width in units, o.grid = draw faint unit grid
V.msr_strips = function (items, o = {}) {
  const u = o.u || 40, span = o.span || Math.max(...items.map(it => it.from + it.len)) + 0.2, L = o.left || (items.some(it => it.label) ? 34 : 8);
  const W = P1(L + span * u + 8);
  let y = 8, b = '';
  const X = v => P1(L + v * u);
  const rows = [];
  items.forEach(it => { rows.push(y); y += 22 + (it.units ? 26 : 0) + 12; });
  const H = y - 4;
  if (o.grid) for (let v = 0; v <= Math.floor(span); v++) b += `<line x1="${X(v)}" y1="2" x2="${X(v)}" y2="${H - 2}" stroke="${C.line}" stroke-width="1" stroke-dasharray="3 3"/>`;
  items.forEach((it, i) => {
    const y0 = rows[i], x0 = X(it.from), x1 = X(it.from + it.len), col = it.color || C.red;
    if (it.label) b += V.text(14, y0 + 11, it.label, { size: 15, weight: 700 });
    if ((it.kind || 'strip') === 'pencil') {
      const tip = Math.min(18, (x1 - x0) / 3);
      b += `<rect x="${x0}" y="${y0 + 2}" width="${P1(Math.min(8, (x1 - x0) / 5))}" height="18" rx="2" fill="${C.pink}"/>` +
        `<rect x="${P1(x0 + Math.min(8, (x1 - x0) / 5))}" y="${y0 + 2}" width="${P1(x1 - x0 - tip - Math.min(8, (x1 - x0) / 5))}" height="18" fill="${col}"/>` +
        `<path d="M${P1(x1 - tip)} ${y0 + 2} L${x1} ${y0 + 11} L${P1(x1 - tip)} ${y0 + 20} Z" fill="#EBD3AE"/>` +
        `<path d="M${P1(x1 - tip / 3)} ${P1(y0 + 11 - 3)} L${x1} ${y0 + 11} L${P1(x1 - tip / 3)} ${P1(y0 + 11 + 3)} Z" fill="${C.ink}"/>`;
    } else b += `<rect x="${x0}" y="${y0 + 2}" width="${P1(x1 - x0)}" height="18" rx="4" fill="${col}"/>`;
    (it.units || []).forEach((un, k) => {
      const ux = X(un.x), uw = P1(un.w * u), uy = y0 + 28;
      if (un.type === 'cube') b += `<rect x="${ux}" y="${uy}" width="${uw}" height="18" fill="${k % 2 ? C.faint : '#DCE9F7'}" stroke="${C.ink}" stroke-width="1.5"/>`;
      else if (un.type === 'big') b += `<rect x="${P1(ux + 1)}" y="${uy}" width="${P1(uw - 2)}" height="18" rx="3" fill="#F3E1A8" stroke="${C.ink}" stroke-width="1.5"/>`;
      else b += `<rect x="${P1(ux + 1.5)}" y="${uy}" width="${P1(uw - 3)}" height="16" rx="8" fill="none" stroke="${C.muted}" stroke-width="2"/>` +
        `<rect x="${P1(ux + 6)}" y="${uy + 4}" width="${P1(Math.max(4, uw - 16))}" height="8" rx="4" fill="none" stroke="${C.muted}" stroke-width="1.6"/>`;
    });
  });
  return V.svg(W, H, b, o.label || 'lengths');
};
// ruler in 'cm' or 'in' with bars above. o.bars [{from,to,color,label}], o.dot = position to mark on the ruler, o.max
V.msr_ruler = function (unit, o = {}) {
  const P = unit === 'cm' ? 36 : 72, max = o.max || (unit === 'cm' ? 12 : 6), pad = 34, W = pad * 2 + max * P;
  const X = v => P1(pad + v * P), bars = o.bars || [];
  let y = 10, b = '';
  const tops = bars.map(() => { const t = y; y += 28; return t; });
  const top = Math.max(y, 22) + 6;
  b += `<rect x="${pad - 16}" y="${top}" width="${max * P + 32}" height="48" rx="4" fill="#F7EDD2" stroke="${C.ink}" stroke-width="2"/>`;
  const sub = unit === 'cm' ? 2 : 4;
  for (let i = 0; i <= max * sub; i++) {
    const v = i / sub, whole = i % sub === 0, half = !whole && (i * 2) % sub === 0;
    const len = whole ? 18 : half ? 12 : 7;
    b += `<line x1="${X(v)}" y1="${top}" x2="${X(v)}" y2="${top + len}" stroke="${C.ink}" stroke-width="${whole ? 2 : 1.2}"/>`;
    if (whole) b += V.text(X(v), top + 31, v, { size: 14, weight: 600 });
  }
  b += V.text(X(max) + 2, top + 62, unit, { size: 14, fill: C.muted, anchor: 'end' });
  bars.forEach((br, i) => {
    const t = tops[i];
    b += `<rect x="${X(br.from)}" y="${t}" width="${P1((br.to - br.from) * P)}" height="16" rx="3" fill="${br.color || C.red}"/>`;
    if (br.label) b += V.text(pad - 22, t + 8, br.label, { size: 15, weight: 700 });
    if (o.guides !== false) [br.from, br.to].forEach(v => b += `<line x1="${X(v)}" y1="${t + 16}" x2="${X(v)}" y2="${top}" stroke="${C.muted}" stroke-width="1" stroke-dasharray="3 3"/>`);
  });
  if (o.dot !== undefined) b += V.dot(X(o.dot), top - 6, 6, C.red);
  return V.svg(W, top + 72, b, 'ruler in ' + unit);
};

/* ---------- weight & capacity ---------- */
const OBJ = [{ n: 'ball', s: 'circle' }, { n: 'box', s: 'square' }, { n: 'cone', s: 'tri' }];
const objFrag = (ob, x, yb) => {  // ob {s,color,size}; drawn sitting on y = yb, centered on x
  if (ob.s === 'cubes') { let b = ''; for (let k = 0; k < ob.n; k++) b += `<rect x="${P1(x - 37.5 + (k % 5) * 15)}" y="${P1(yb - 15 - Math.floor(k / 5) * 15)}" width="14" height="14" rx="2" fill="#DCE9F7" stroke="${C.ink}" stroke-width="1.3"/>`; return b; }
  const z = ob.size || 34;
  if (ob.s === 'circle') return V.dot(x, P1(yb - z / 2), z / 2, ob.color);
  if (ob.s === 'square') return `<rect x="${P1(x - z / 2)}" y="${P1(yb - z)}" width="${z}" height="${z}" rx="3" fill="${ob.color}"/>`;
  return `<path d="M${P1(x - z / 2)} ${yb} L${x} ${P1(yb - z * 1.1)} L${P1(x + z / 2)} ${yb} Z" fill="${ob.color}"/>`;
};
// two-pan balance. tilt: 1 = left side down (left heavier), -1 = right down, 0 = level
V.msr_balance = function (L, Rt, tilt, o = {}) {
  const W = 300, H = 196, px = 150, py = 64, arm = 104, th = rad(tilt * 11);
  const ends = [[P1(px - arm * Math.cos(th)), P1(py + arm * Math.sin(th))], [P1(px + arm * Math.cos(th)), P1(py - arm * Math.sin(th))]];
  let b = `<rect x="${px - 50}" y="176" width="100" height="12" rx="4" fill="${C.muted}"/><rect x="${px - 5}" y="${py}" width="10" height="114" fill="${C.muted}"/>`;
  b += `<line x1="${ends[0][0]}" y1="${ends[0][1]}" x2="${ends[1][0]}" y2="${ends[1][1]}" stroke="${C.ink}" stroke-width="6" stroke-linecap="round"/>`;
  b += `<path d="M${px - 12} ${py - 14} L${px} ${py - 2} L${px + 12} ${py - 14}" fill="${C.ink}"/>`;
  [L, Rt].forEach((ob, i) => {
    const [ex, ey] = ends[i], pyb = P1(ey + 56);
    b += objFrag(ob, ex, pyb - 1);
    b += `<line x1="${ex}" y1="${ey}" x2="${ex - 36}" y2="${pyb}" stroke="${C.muted}" stroke-width="1.5"/><line x1="${ex}" y1="${ey}" x2="${ex + 36}" y2="${pyb}" stroke="${C.muted}" stroke-width="1.5"/>`;
    b += `<path d="M${ex - 42} ${pyb} Q${ex} ${P1(pyb + 24)} ${ex + 42} ${pyb} Z" fill="${C.line}" stroke="${C.ink}" stroke-width="2"/>`;
    b += V.dot(ex, ey, 4, C.ink);
  });
  return V.svg(W, H, b, 'balance scale');
};
// containers, each with the cups it fills drawn underneath. list [{shape:'jug'|'glass'|'bowl'|'vase', w,h, color, label, cups}]
const contFrag = (c, x, yb) => {
  const w = c.w, h = c.h, col = c.color, st = `fill="${col}" fill-opacity="0.22" stroke="${C.ink}" stroke-width="2.5"`;
  if (c.shape === 'glass') return `<path d="M${P1(x - w / 2)} ${yb - h} L${P1(x - w * 0.36)} ${yb} H${P1(x + w * 0.36)} L${P1(x + w / 2)} ${yb - h}" ${st}/>`;
  if (c.shape === 'bowl') return `<path d="M${P1(x - w / 2)} ${yb - h} Q${P1(x - w / 2)} ${yb} ${x} ${yb} Q${P1(x + w / 2)} ${yb} ${P1(x + w / 2)} ${yb - h} Z" ${st}/>`;
  if (c.shape === 'vase') return `<path d="M${P1(x - w * 0.22)} ${yb - h} Q${P1(x - w * 0.22)} ${P1(yb - h * 0.7)} ${P1(x - w / 2)} ${P1(yb - h * 0.4)} Q${P1(x - w / 2)} ${yb} ${x} ${yb} Q${P1(x + w / 2)} ${yb} ${P1(x + w / 2)} ${P1(yb - h * 0.4)} Q${P1(x + w * 0.22)} ${P1(yb - h * 0.7)} ${P1(x + w * 0.22)} ${yb - h}" ${st}/>`;
  return `<rect x="${P1(x - w / 2)}" y="${yb - h}" width="${w}" height="${h}" rx="6" ${st}/>` +
    `<path d="M${P1(x + w / 2)} ${P1(yb - h * 0.75)} q${P1(Math.min(24, w * 0.4))} 0 ${P1(Math.min(24, w * 0.4))} ${P1(h * 0.25)} t${P1(-Math.min(24, w * 0.4))} ${P1(h * 0.25)}" fill="none" stroke="${C.ink}" stroke-width="2.5"/>`;
};
const cupFrag = (x, y) => `<path d="M${x - 7} ${y - 8} L${x - 5} ${y + 8} H${x + 5} L${x + 7} ${y - 8} Z" fill="${C.blue}" fill-opacity="0.35" stroke="${C.ink}" stroke-width="1.5"/>`;
V.msr_containers = function (list) {
  const cw = 150, top = 110, maxRows = Math.max(...list.map(c => Math.ceil((c.cups || 0) / 5)));
  let b = '';
  list.forEach((c, i) => {
    const x = cw * i + cw / 2;
    b += contFrag(c, x, top);
    b += V.text(x, top + 18, c.label, { size: 16, weight: 700 });
    for (let k = 0; k < (c.cups || 0); k++) b += cupFrag(x - 44 + (k % 5) * 22, top + 46 + Math.floor(k / 5) * 22);
  });
  return V.svg(cw * list.length, top + 36 + maxRows * 22, b, 'containers and cups');
};

/* ---------- calendar ---------- */
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MLEN = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
// month grid. start = weekday of the 1st (0 = Sunday). o.ring: days to circle
V.msr_cal = function (name, start, days, o = {}) {
  const cw = 46, ch = 36, x0 = 4, y0 = 58, rows = Math.ceil((start + days) / 7), W = cw * 7 + 8;
  let b = V.text(W / 2, 16, name, { size: 18, weight: 700 });
  DAYS.forEach((d, i) => b += `<rect x="${x0 + i * cw}" y="30" width="${cw}" height="26" fill="${C.faint}" stroke="${C.line}"/>` + V.text(x0 + i * cw + cw / 2, 43, d.slice(0, 3), { size: 13, weight: 700, fill: C.muted }));
  for (let r = 0; r < rows; r++) for (let c = 0; c < 7; c++) {
    const d = r * 7 + c - start + 1, x = x0 + c * cw, y = y0 + r * ch;
    b += `<rect x="${x}" y="${y}" width="${cw}" height="${ch}" fill="${C.paper}" stroke="${C.line}"/>`;
    if (d >= 1 && d <= days) {
      if ((o.ring || []).includes(d)) b += `<circle cx="${x + cw / 2}" cy="${y + ch / 2}" r="14" fill="none" stroke="${C.red}" stroke-width="2.5"/>`;
      b += V.text(x + cw / 2, y + ch / 2, d, { size: 15 });
    }
  }
  return V.svg(W, y0 + rows * ch + 4, b, name + ' calendar');
};

/* ---------- tallies & graphs ---------- */
const tallyFrag = (n, x, y, h = 28) => {
  let b = '';
  const g = Math.floor(n / 5), r = n % 5;
  for (let k = 0; k < g; k++) {
    const gx = x + k * 46;
    for (let i = 0; i < 4; i++) b += `<line x1="${gx + i * 8}" y1="${y}" x2="${gx + i * 8}" y2="${y + h}" stroke="${C.ink}" stroke-width="2.5" stroke-linecap="round"/>`;
    b += `<line x1="${gx - 5}" y1="${y + h - 5}" x2="${gx + 29}" y2="${y + 5}" stroke="${C.ink}" stroke-width="2.5" stroke-linecap="round"/>`;
  }
  for (let i = 0; i < r; i++) b += `<line x1="${x + g * 46 + i * 8}" y1="${y}" x2="${x + g * 46 + i * 8}" y2="${y + h}" stroke="${C.ink}" stroke-width="2.5" stroke-linecap="round"/>`;
  return b;
};
const tallyW = n => Math.floor(n / 5) * 46 + (n % 5) * 8;
V.msr_tally = n => V.svg(Math.max(30, tallyW(n) + 14), 40, tallyFrag(n, 10, 6), 'tally marks');
// tally chart: rows [{label, n, color?}]
V.msr_tallyChart = function (rows, o = {}) {
  const lw = 104, rh = 40, maxT = Math.max(...rows.map(r => tallyW(r.n))), W = lw + Math.max(120, maxT + 30);
  let b = `<rect x="1" y="1" width="${W - 2}" height="${rows.length * rh}" fill="${C.paper}" stroke="${C.ink}" stroke-width="1.5"/><line x1="${lw}" y1="1" x2="${lw}" y2="${rows.length * rh + 1}" stroke="${C.ink}" stroke-width="1.5"/>`;
  rows.forEach((r, i) => {
    const y = i * rh;
    if (i) b += `<line x1="1" y1="${y + 1}" x2="${W - 1}" y2="${y + 1}" stroke="${C.line}"/>`;
    if (r.color) b += `<rect x="10" y="${y + 13}" width="14" height="14" rx="3" fill="${r.color}"/>`;
    b += V.text(r.color ? 30 : 10, y + rh / 2 + 1, r.label, { size: 15, anchor: 'start' });
    b += tallyFrag(r.n, lw + 16, y + 7, 26);
  });
  return V.svg(W, rows.length * rh + 2, b, 'tally chart');
};
const iconFrag = (kind, x, y, s, col) => {
  if (kind === 'square') return `<rect x="${P1(x - s / 2)}" y="${P1(y - s / 2)}" width="${s}" height="${s}" rx="3" fill="${col}"/>`;
  if (kind === 'star') {
    let d = ''; for (let i = 0; i < 10; i++) { const rr = i % 2 ? s * 0.24 : s * 0.55, [px, py] = pt(x, y + s * 0.05, rr, i * 36); d += (i ? 'L' : 'M') + px + ' ' + py; }
    return `<path d="${d}Z" fill="${col}"/>`;
  }
  if (kind === 'face') return V.dot(x, y, s / 2, col) + V.dot(P1(x - s * 0.17), P1(y - s * 0.1), 1.8, C.ink) + V.dot(P1(x + s * 0.17), P1(y - s * 0.1), 1.8, C.ink) +
    `<path d="M${P1(x - s * 0.2)} ${P1(y + s * 0.1)} Q${x} ${P1(y + s * 0.32)} ${P1(x + s * 0.2)} ${P1(y + s * 0.1)}" fill="none" stroke="${C.ink}" stroke-width="1.5"/>`;
  return V.dot(x, y, s / 2, col);
};
// picture graph: rows [{label,n}] where n is a multiple of key. o.icon, o.color
V.msr_picto = function (rows, key, o = {}) {
  const lw = 90, rh = 36, sp = 30, icon = o.icon || 'face', col = o.color || C.amber;
  const maxI = Math.max(...rows.map(r => r.n / key)), W = Math.max(250, lw + maxI * sp + 14);
  let b = '';
  rows.forEach((r, i) => {
    const y = i * rh + rh / 2 + 2;
    b += V.text(8, y, r.label, { size: 15, anchor: 'start' });
    for (let k = 0; k < r.n / key; k++) b += iconFrag(icon, lw + sp / 2 + k * sp, y, 22, col);
    b += `<line x1="0" y1="${i * rh + rh + 2}" x2="${W}" y2="${i * rh + rh + 2}" stroke="${C.line}"/>`;
  });
  b += `<line x1="${lw - 6}" y1="0" x2="${lw - 6}" y2="${rows.length * rh + 2}" stroke="${C.ink}" stroke-width="1.5"/>`;
  const ky = rows.length * rh + 26;
  b += `<rect x="${W - 150}" y="${ky - 16}" width="146" height="32" rx="6" fill="${C.faint}"/>` + V.text(W - 138, ky, 'Key:', { size: 14, anchor: 'start', fill: C.muted }) +
    iconFrag(icon, W - 84, ky, 20, col) + V.text(W - 68, ky, `= ${key}`, { size: 16, anchor: 'start', weight: 700 });
  return V.svg(W, ky + 20, b, 'picture graph');
};
// vertical bar graph with a scale. o.step (scale step), o.colors
V.msr_bargraph = function (cats, vals, o = {}) {
  const step = o.step || 1, top = Math.max(step * 2, Math.ceil(Math.max(...vals) / step) * step + (o.headroom ? step : 0));
  const L = 40, T = 12, PH = 180, bw = 42, sp = 68, W = L + cats.length * sp + 10;
  const Y = v => P1(T + PH - v / top * PH);
  let b = '';
  const every = top / step > 10 ? 2 : 1;
  for (let v = 0; v <= top; v += step) {
    b += `<line x1="${L}" y1="${Y(v)}" x2="${W - 4}" y2="${Y(v)}" stroke="${v ? C.faint : C.ink}" stroke-width="${v ? 1.5 : 2}"/>`;
    if ((v / step) % every === 0) b += V.text(L - 8, Y(v), v, { size: 13, anchor: 'end', fill: C.muted });
  }
  cats.forEach((c, i) => {
    const x = L + 13 + i * sp, col = o.colors ? o.colors[i] : (o.color || C.teal);
    if (vals[i] > 0) b += `<rect x="${x}" y="${Y(vals[i])}" width="${bw}" height="${P1(Y(0) - Y(vals[i]))}" fill="${col}"/>`;
    b += V.text(x + bw / 2, T + PH + 16, c, { size: 13 });
  });
  b += `<line x1="${L}" y1="${T}" x2="${L}" y2="${Y(0)}" stroke="${C.ink}" stroke-width="2"/>`;
  return V.svg(W, T + PH + 30, b, 'bar graph');
};

/* ---------- data topics ---------- */
const TOPICS = [
  { cats: ['cat', 'dog', 'fish', 'bird', 'rabbit'], q: 'Which pet do most kids have?', ask: 'What pet do you have?' },
  { cats: ['apple', 'banana', 'grape', 'pear', 'orange'], q: 'Which fruit do kids like best?', ask: 'What is your favorite fruit?' },
  { cats: ['spring', 'summer', 'fall', 'winter'], q: 'Which season do kids like best?', ask: 'What is your favorite season?' },
  { cats: ['soccer', 'tennis', 'swim', 'dance'], q: 'Which sport do kids like best?', ask: 'What is your favorite sport?' },
  { cats: ['milk', 'juice', 'water', 'cocoa'], q: 'Which drink do kids like best?', ask: 'What is your favorite drink?' },
  { cats: ['bus', 'car', 'walk', 'bike'], q: 'How do most kids get to school?', ask: 'How do you get to school?' },
];
const ONE_ANSWER = ['How many legs does a cat have?', 'What is 5 + 3?', 'What day is today?', 'How many days are in a week?', 'What color is the sky?'];
// k categories from a topic with values in [lo,hi]; opts.uniqueMax / uniqueMin / distinct
function dataset(R, k, lo, hi, opts = {}) {
  const t = R.pick(TOPICS), cats = R.sample(t.cats, k);
  for (let tries = 0; tries < 200; tries++) {
    const vals = cats.map(() => R.int(lo, hi) * (opts.mult || 1));
    const mx = Math.max(...vals), mn = Math.min(...vals);
    if (opts.distinct && new Set(vals).size < k) continue;
    if (opts.uniqueMax && vals.filter(v => v === mx).length > 1) continue;
    if (opts.uniqueMin && vals.filter(v => v === mn).length > 1) continue;
    return { t, cats, vals };
  }
  const vals = cats.map((_, i) => (lo + i) * (opts.mult || 1));
  return { t, cats, vals: R.shuffle(vals) };
}
const maxIdx = v => v.indexOf(Math.max(...v)), minIdx = v => v.indexOf(Math.min(...v));
// wrong versions of a dataset for "which graph matches" choices
function wrongVals(R, vals, step = 1) {
  const out = [];
  const sw = vals.slice(); const [i, j] = R.sample(vals.map((_, k) => k).filter(k => true), 2);
  if (sw[i] !== sw[j]) { [sw[i], sw[j]] = [sw[j], sw[i]]; out.push(sw); }
  const o1 = vals.slice(); const k = R.int(0, vals.length - 1); o1[k] = o1[k] + (o1[k] > step ? R.pick([-step, step]) : step); out.push(o1);
  const o2 = vals.slice(); const k2 = (k + 1) % vals.length; o2[k2] = o2[k2] + (o2[k2] > step ? -step : step); out.push(o2);
  return out.filter(w => w.join() !== vals.join());
}

/* ================= I.7.01 Compare lengths ================= */
E1.skill({ id: 'I.7.01', name: 'Compare lengths', steps: {
  a: { t: 'longer or shorter', g: (R, O) => {
    const [c1, c2] = R.sample(COLS, 2), [l1, l2] = R.distinct(3, 11, 2), long = R.bool(), kind = R.pick(['pencil', 'strip']);
    const win = (long ? l1 > l2 : l1 < l2) ? c1 : c2, lose = win === c1 ? c2 : c1;
    return choice(R, `Which is ${long ? 'longer' : 'shorter'}?`, cname(win), [cname(lose)],
      `The left ends line up. The ${cname(win)} one ends ${long ? 'further right' : 'first'}, so it is ${long ? 'longer' : 'shorter'}.`,
      { visual: V.msr_strips([{ from: 0, len: l1, color: c1, kind }, { from: 0, len: l2, color: c2, kind }]) });
  } },
  b: { t: 'line up the ends', g: (R, O) => {
    const [c1, c2] = R.sample(COLS, 2);
    if (R.bool(0.45)) {  // pick the fair comparison
      const l1 = R.int(3, 7), l2 = l1 + R.pick([-2, -1, 1, 2]), s = R.int(1, 3);
      const mk = (a, b2) => V.msr_strips([{ from: a, len: l1, color: c1 }, { from: b2, len: l2, color: c2 }], { u: 22, span: 11 });
      const fair = mk(0, 0), bad1 = mk(0, s), bad2 = mk(s, 0);
      return choice(R, 'Which picture compares the lengths fairly?', fair, [bad1, bad2],
        'To compare, both left ends must start at the same place.');
    }
    // not lined up: the shorter one sticks out further
    const lL = R.int(4, 8), lS = lL - R.int(1, 2), s = lL - lS + R.int(1, 2), long = R.bool(), kind = R.pick(['pencil', 'strip']);
    const topLong = R.bool();
    const items = [{ from: 0, len: lL, color: c1, kind }, { from: s, len: lS, color: c2, kind }];
    if (!topLong) items.reverse();
    const win = long ? c1 : c2, lose = long ? c2 : c1;
    return choice(R, `Use the grid. Which is ${long ? 'longer' : 'shorter'}?`, cname(win), [cname(lose)],
      `The ends do not line up, so count the grid spaces. The ${cname(c1)} one is ${lL} long and the ${cname(c2)} one is ${lS} long.`,
      { visual: V.msr_strips(items, { grid: true, span: Math.max(lL, s + lS) }) });
  } },
  c: { t: 'order three objects', g: (R, O) => {
    const cs = R.sample(COLS, 3), ls = R.distinct(2, 12, 3), kind = R.pick(['pencil', 'strip']);
    const vis = V.msr_strips(cs.map((c, i) => ({ from: 0, len: ls[i], color: c, kind })));
    const ord = [0, 1, 2].sort((a, b) => ls[a] - ls[b]), nm = i => cname(cs[i]);
    const mode = R.int(0, 3);
    const why = `Shortest to longest: ${ord.map(nm).join(', ')}.`;
    if (mode === 0) return choice(R, 'Which is the longest?', nm(ord[2]), [nm(ord[1]), nm(ord[0])], why, { visual: vis });
    if (mode === 1) return choice(R, 'Which is the shortest?', nm(ord[0]), [nm(ord[1]), nm(ord[2])], why, { visual: vis });
    if (mode === 2) return choice(R, 'Which one is in the middle?', nm(ord[1]), [nm(ord[0]), nm(ord[2])], why, { visual: vis });
    const s = a => a.map(nm).join(', ');
    return choice(R, 'Order them from shortest to longest.', s(ord), [s([ord[2], ord[1], ord[0]]), s([ord[1], ord[0], ord[2]]), s([ord[0], ord[2], ord[1]])], why, { visual: vis });
  } },
  d: { t: 'compare using a third object', g: (R, O) => {
    if (R.bool()) {  // two separate pictures, each against the same gray string
      const [c1, c2] = R.sample(COLS, 2), S = R.int(4, 7), a = S + R.int(1, 2), b = S - R.int(1, 2), aFirst = R.bool();
      const panel = (len, col) => V.msr_strips([{ from: 0, len, color: col }, { from: 0, len: S, color: C.muted }], { u: 26, span: 9.3 });
      const pA = { svg: panel(a, c1), caption: cname(c1) + ' and string' }, pB = { svg: panel(b, c2), caption: cname(c2) + ' and string' };
      const long = R.bool(), win = long ? c1 : c2, lose = long ? c2 : c1;
      return choice(R, `Each was checked with the gray string. Which is ${long ? 'longer' : 'shorter'}?`, cname(win), [cname(lose)],
        `${cap(cname(c1))} is longer than the string. ${cap(cname(c2))} is shorter than the string. So ${cname(win)} is ${long ? 'longer' : 'shorter'}.`,
        { visual: V.stack(aFirst ? [pA, pB] : [pB, pA]) });
    }
    const [x, y, z] = R.sample(['rope', 'stick', 'pen', 'ribbon', 'belt', 'straw', 'scarf', 'spoon'], 3), long = R.bool();
    const q = long ? 'longest' : 'shortest';
    return choice(R, `The ${x} is longer than the ${y}. The ${y} is longer than the ${z}. Which is ${q}?`,
      long ? x : z, [y, long ? z : x],
      `${cap(x)} > ${y} > ${z}, so the ${long ? x : z} is ${q}.`);
  } },
} });

/* ================= I.7.02 Measure with units ================= */
const clipsRow = (n, from = 0, w = 1) => Array.from({ length: n }, (_, i) => ({ x: from + i * w, w, type: 'clip' }));
E1.skill({ id: 'I.7.02', name: 'Measure with units', steps: {
  a: { t: 'no gaps or overlaps', g: (R, O) => {
    const n = R.int(3, 7), col = R.pick(COLS), u = 40;
    const good = clipsRow(n);
    const gapsM = n - 1, gaps = Array.from({ length: gapsM }, (_, i) => ({ x: i * (n / gapsM) + (n / gapsM - 1) / 2, w: 1, type: 'clip' }));
    const overM = n + R.int(1, 2), over = Array.from({ length: overM }, (_, i) => ({ x: i * ((n - 1) / (overM - 1)), w: 1, type: 'clip' }));
    const off = clipsRow(n, 0.5);
    const draw = (units, uu = u) => V.msr_strips([{ from: 0, len: n, color: col, units }], { u: uu, span: n + 0.8 });
    if (R.bool(0.4)) {
      const k = R.bool() ? 0 : R.int(1, 3), pics = [good, gaps, over, off][k];
      return yn('Is this measured the right way?', k === 0,
        k === 0 ? 'Yes. The clips start at the end and touch, with no gaps or overlaps.'
          : ['', 'No. There are gaps between the clips.', 'No. The clips overlap each other.', 'No. The clips do not start at the end.'][k],
        { visual: draw(pics) });
    }
    const wrong = R.sample([draw(gaps, 30), draw(over, 30), draw(off, 30)], 2);
    return choice(R, 'Which is measured the right way?', draw(good, 30), wrong,
      `Clips must start at the end and touch each other: no gaps and no overlaps.`);
  } },
  b: { t: 'paper clips end to end', g: (R, O) => {
    const n = R.int(2, 8), col = R.pick(COLS), kind = R.pick(['pencil', 'strip']), obj = kind === 'pencil' ? 'pencil' : 'ribbon';
    return num(`How many paper clips long is the ${obj}?`, n, `The clips go end to end from one end to the other. Count them: ${n}.`,
      { visual: V.msr_strips([{ from: 0, len: n, color: col, kind, units: clipsRow(n) }], { u: 44 }) });
  } },
  c: { t: 'count the units', g: (R, O) => {
    if (R.bool(0.6)) {
      const n = R.int(6, 14), col = R.pick(COLS), kind = R.pick(['pencil', 'strip']), cube = R.bool();
      const units = Array.from({ length: n }, (_, i) => ({ x: i, w: 1, type: cube ? 'cube' : 'clip' }));
      return num(`How many ${cube ? 'cubes' : 'clips'} long is it?`, n, `Count every unit from one end to the other: ${n}.${n > 10 ? ' Count on from 10.' : ''}`,
        { visual: V.msr_strips([{ from: 0, len: n, color: col, kind, units }], { u: n > 10 ? 36 : 42 }) });
    }
    const [c1, c2] = R.sample(COLS, 2), [a, b] = R.distinct(2, 9, 2).sort((p, q) => q - p);
    const top = R.bool();
    const items = [{ from: 0, len: a, color: c1, units: clipsRow(a) }, { from: 0, len: b, color: c2, units: clipsRow(b) }];
    return num(`How many clips longer is ${cname(c1)} than ${cname(c2)}?`, a - b,
      `${cap(cname(c1))} is ${a} clips and ${cname(c2)} is ${b} clips. ${a} − ${b} = ${a - b}.`,
      { visual: V.msr_strips(top ? items : items.reverse(), { u: 40 }) });
  } },
  d: { t: 'bigger units give smaller counts', g: (R, O) => {
    const mode = R.int(0, 2);
    if (mode === 0) {
      const big = R.int(2, 5), n = big * 2, col = R.pick(COLS);
      const vis = V.msr_strips([
        { from: 0, len: n, color: col, units: clipsRow(n), label: 'A' },
        { from: 0, len: n, color: col, units: Array.from({ length: big }, (_, i) => ({ x: i * 2, w: 2, type: 'big' })), label: 'B' }], { u: 34 });
      const sm = R.bool();
      return R.bool() ? choiceFixed(`Same strip, two units. Which count is ${sm ? 'smaller' : 'bigger'}?`, ['A', 'B', 'the same'], sm ? 1 : 0,
        `A uses small clips: ${n}. B uses big blocks: ${big}. ${sm ? 'Bigger units give a smaller count.' : 'Smaller units give a bigger count.'}`, { visual: vis })
        : num('A uses small clips. How many big blocks long is B?', big, `Each big block is as long as 2 clips. ${n} clips make ${big} big blocks.`, { visual: vis });
    }
    if (mode === 1) {
      const [s, b] = R.pick([['paper clips', 'pencils'], ['cubes', 'books'], ['beans', 'spoons'], ['coins', 'shoes'], ['buttons', 'rulers']]);
      const small = R.bool(), thing = R.pick(['the table', 'the door', 'the rug', 'the bed', 'the desk']);
      return choiceFixed(`Measure ${thing} with ${s}, then with ${b}. Which count is ${small ? 'smaller' : 'bigger'}?`, [s, b, 'the same'], small ? 1 : 0,
        `${cap(b)} are longer than ${s}, so you need fewer of them. Bigger units give smaller counts.`);
    }
    const big = R.int(2, 6), per = R.pick([2, 2, 3]);
    return num(`A desk is ${big} long blocks. 1 long block = ${per} cubes. How many cubes long?`, big * per,
      `Each long block is ${per} cubes. ${big} blocks of ${per} is ${big * per} cubes.`,
      { visual: V.msr_strips([{ from: 0, len: big * per, color: C.amber, units: Array.from({ length: big }, (_, i) => ({ x: i * per, w: per, type: 'big' })) }], { u: big * per > 12 ? 26 : 32 }) });
  } },
} });

/* ================= I.7.03 Measure with a ruler ================= */
E1.skill({ id: 'I.7.03', name: 'Measure with a ruler', steps: {
  a: { t: 'centimeters or inches', g: (R, O) => {
    const u = U(O), n = R.int(1, u.max - 1), col = R.pick(COLS);
    if (R.bool(0.2)) return choiceFixed(`What unit does this ruler use?`, ['centimeters', 'inches'], u.ab === 'cm' ? 0 : 1,
      `Look at the small letters on the ruler: "${u.ab}" means ${u.many}.`, { visual: V.msr_ruler(u.ab, { bars: [{ from: 0, to: n, color: col }] }) });
    return num(`How long is the bar?`, [{ label: u.ab, ans: n }], `The bar starts at 0 and ends at ${n}, so it is ${n} ${n === 1 ? u.one : u.many} long.`,
      { visual: V.msr_ruler(u.ab, { bars: [{ from: 0, to: n, color: col }] }) });
  } },
  b: { t: 'start at zero', g: (R, O) => {
    const u = U(O), s = R.int(1, u.ab === 'cm' ? 4 : 2), n = R.int(1, u.max - s), col = R.pick(COLS);
    return num(`The bar does not start at 0. How long is it?`, [{ label: u.ab, ans: n }],
      `It goes from ${s} to ${s + n}. Count the spaces, or ${s + n} − ${s} = ${n}.`,
      { visual: V.msr_ruler(u.ab, { bars: [{ from: s, to: s + n, color: col }] }) });
  } },
  c: { t: 'to the nearest unit', g: (R, O) => {
    const u = U(O), n = R.int(1, u.max - 1), f = u.ab === 'cm' ? R.pick([0.2, 0.3, 0.7, 0.8]) : R.pick([0.25, 0.75]), col = R.pick(COLS);
    const L = n + f, ans = f < 0.5 ? n : n + 1;
    return num(`About how long is the bar, to the nearest ${u.one}?`, [{ label: u.ab, ans }],
      `The end is between ${n} and ${n + 1}, closer to ${ans}. So it is about ${ans} ${ans === 1 ? u.one : u.many}.`,
      { visual: V.msr_ruler(u.ab, { bars: [{ from: 0, to: L, color: col }] }) });
  } },
  d: { t: 'draw a line of a given length', g: (R, O) => {
    const u = U(O);
    if (R.bool()) {
      const s = R.int(0, u.ab === 'cm' ? 4 : 2), n = R.int(2, u.max - s);
      return num(`Start the line at ${s}. Make it ${n} ${u.ab} long. Where do you stop?`, s + n,
        `Count ${n} ${u.many} on from ${s}: ${s} + ${n} = ${s + n}.`, { visual: V.msr_ruler(u.ab, { dot: s }) });
    }
    // which line is n long? one starts at 0, a trap ends at n but starts later, one is off by 1
    const n = R.int(u.ab === 'cm' ? 4 : 3, u.max - 1), sT = R.int(1, 2), sB = R.int(0, u.max - n - 1 >= 1 ? 1 : 0);
    const lines = R.shuffle([{ from: sB, to: sB + n, ok: 1 }, { from: sT, to: n }, { from: 0, to: n + R.pick([-1, 1]) }]);
    const labs = ['A', 'B', 'C'], k = lines.findIndex(l => l.ok);
    return choiceFixed(`Which line is ${n} ${u.ab} long?`, labs, k,
      `Line ${labs[k]} goes from ${lines[k].from} to ${lines[k].to}. That is ${n} ${u.many}.`,
      { visual: V.msr_ruler(u.ab, { bars: lines.map((l, i) => ({ from: l.from, to: l.to, color: [C.red, C.blue, C.teal][i], label: labs[i] })) }) });
  } },
} });

/* ================= I.7.04 Length stories ================= */
// bars with written lengths. mode 'join': end to end in one row, bracket '?' under the total.
// mode 'rows': one bar per row, left ends lined up, bracket '?' over the extra part of the longest.
V.msr_lenBars = function (bars, unit, mode) {
  const tot = mode === 'join' ? bars.reduce((a, b) => a + b.len, 0) : Math.max(...bars.map(b => b.len));
  const u = P1(Math.min(unit === 'cm' ? 30 : 60, 440 / tot)), L = 12, W = P1(L + tot * u + 60);
  let b = '', H;
  if (mode === 'join') {
    let x = L;
    bars.forEach(br => { const w = P1(br.len * u); b += `<rect x="${P1(x)}" y="30" width="${w}" height="20" rx="4" fill="${br.color}" stroke="${C.paper}" stroke-width="2"/>` + V.text(P1(x + w / 2), 16, `${br.len} ${unit}`, { size: 15, weight: 700 }); x += w; });
    const x1 = P1(L + tot * u);
    b += `<path d="M${L} 58 V66 H${x1} V58" fill="none" stroke="${C.muted}" stroke-width="2"/>` + V.text(P1((L + x1) / 2), 80, '?', { size: 17, weight: 700, fill: C.muted });
    H = 92;
  } else {
    const mn = Math.min(...bars.map(br => br.len));
    b += `<path d="M${P1(L + mn * u)} 24 V16 H${P1(L + tot * u)} V24" fill="none" stroke="${C.muted}" stroke-width="2"/>` + V.text(P1(L + (mn + tot) / 2 * u), 6, '?', { size: 15, weight: 700, fill: C.muted });
    bars.forEach((br, i) => { const y = 30 + i * 34, w = P1(br.len * u); b += `<rect x="${L}" y="${y}" width="${w}" height="20" rx="4" fill="${br.color}"/>` + V.text(P1(L + w + 8), y + 10, `${br.len} ${unit}`, { size: 15, weight: 700, anchor: 'start' }); });
    H = 30 + bars.length * 34;
  }
  return V.svg(W, H, b, 'bars with lengths');
};
const THINGS = ['ribbon', 'stick', 'string', 'rope'];
// everyday objects: [name, cm, inches]
const EST = [['paper clip', 3, 1], ['crayon', 9, 4], ['pencil', 15, 7], ['eraser', 5, 2], ['spoon', 15, 6], ['shoe', 20, 9], ['book', 25, 10], ['key', 6, 2], ['toothbrush', 18, 7], ['door', 200, 80], ['bed', 190, 75], ['fork', 18, 7], ['grown-up\'s arm', 60, 24], ['bus', 1000, 400]];
const LADDER = { cm: [1, 3, 10, 20, 50, 100, 200, 500, 1000], in: [1, 2, 5, 10, 20, 50, 100, 400] };
E1.skill({ id: 'I.7.04', name: 'Length stories', steps: {
  a: { t: 'add two lengths', g: (R, O) => {
    const u = U(O), [c1, c2] = R.sample(COLS, 2), m = R.int(0, 2), cm = u.ab === 'cm';
    if (m === 0) {
      const a = R.int(1, u.max - 2), b = R.int(1, u.max - 1);
      return num('Measure both bars. How long are they together?', [{ label: u.ab, ans: a + b }], `Red is ${a} ${u.ab} and blue is ${b} ${u.ab}. ${a} + ${b} = ${a + b}.`,
        { visual: V.msr_ruler(u.ab, { bars: [{ from: 0, to: a, color: C.red }, { from: 0, to: b, color: C.blue }] }) });
    }
    const a = R.int(2, cm ? 9 : 6), b = R.int(2, cm ? 9 : 6), th = R.pick(THINGS);
    if (m === 1) return num(`Put the 2 ${th}s end to end. How long in all?`, [{ label: u.ab, ans: a + b }], `Add the two lengths: ${a} + ${b} = ${a + b} ${u.many}.`,
      { visual: V.msr_lenBars([{ len: a, color: c1 }, { len: b, color: c2 }], u.ab, 'join') });
    return num(`A ${th} is ${a} ${u.ab}. You add ${b} ${u.ab} more. How long now?`, [{ label: u.ab, ans: a + b }], `${a} + ${b} = ${a + b}, so it is ${a + b} ${u.many} long.`);
  } },
  b: { t: 'how much longer', g: (R, O) => {
    const u = U(O), [c1, c2] = R.sample(COLS, 2), m = R.int(0, 2), cm = u.ab === 'cm';
    if (m === 0) {
      const [a, b] = R.distinct(1, u.max, 2), [lg, sh] = a > b ? [a, b] : [b, a], redLong = R.bool();
      const bars = redLong ? [{ from: 0, to: lg, color: C.red }, { from: 0, to: sh, color: C.blue }] : [{ from: 0, to: sh, color: C.red }, { from: 0, to: lg, color: C.blue }];
      const L = redLong ? 'red' : 'blue', S = redLong ? 'blue' : 'red';
      return num(`How much longer is the ${L} bar than the ${S} bar?`, [{ label: u.ab, ans: lg - sh }], `${cap(L)} is ${lg} ${u.ab} and ${S} is ${sh} ${u.ab}. ${lg} − ${sh} = ${lg - sh}.`,
        { visual: V.msr_ruler(u.ab, { bars }) });
    }
    const [a, b] = R.distinct(cm ? 3 : 2, cm ? 18 : 12, 2).sort((p, q) => q - p), th = R.pick(THINGS);
    if (m === 1) {
      const top = R.bool(), bars = top ? [{ len: a, color: c1 }, { len: b, color: c2 }] : [{ len: b, color: c2 }, { len: a, color: c1 }];
      return num(`How much longer is the ${cname(c1)} ${th}?`, [{ label: u.ab, ans: a - b }], `${a} − ${b} = ${a - b}. The ${cname(c1)} ${th} is ${a - b} ${a - b === 1 ? u.one : u.many} longer.`,
        { visual: V.msr_lenBars(bars, u.ab, 'rows') });
    }
    const [x, y] = R.sample(THINGS, 2);
    return num(`A ${x} is ${a} ${u.ab}. A ${y} is ${b} ${u.ab}. How much longer is the ${x}?`, [{ label: u.ab, ans: a - b }], `Take away the shorter length: ${a} − ${b} = ${a - b} ${a - b === 1 ? u.one : u.many}.`);
  } },
  c: { t: 'estimate a length', g: (R, O) => {
    const u = U(O), cm = u.ab === 'cm';
    if (R.bool(0.55)) {
      const it = R.pick(EST), v = cm ? it[1] : it[2];
      const ds = R.sample(LADDER[u.ab].filter(x => x / v >= 2.5 || v / x >= 2.5), 2).map(x => `${x} ${u.ab}`);
      return choice(R, `About how long is a real ${it[0]}?`, `${v} ${u.ab}`, ds, `${cap(art(it[0]))} is about ${v} ${u.many} long. The other answers are much too short or too long.`);
    }
    const n = R.int(cm ? 4 : 2, cm ? 12 : 6), px = cm ? 32 : 64, col = R.pick(COLS);
    const body = `<rect x="10" y="10" width="${n * px}" height="20" rx="4" fill="${col}"/>` +
      `<rect x="10" y="50" width="${px}" height="20" rx="4" fill="${C.muted}"/>` + V.text(10 + px + 8, 60, `= 1 ${u.ab}`, { size: 15, weight: 700, anchor: 'start' });
    const ds = [Math.max(1, Math.round(n / 2)), n * 2].filter(x => x !== n).map(x => `${x} ${u.ab}`);
    return choice(R, `The gray bar is 1 ${u.ab}. About how long is the ${cname(col)} bar?`, `${n} ${u.ab}`, ds,
      `About ${n} gray bars fit along the ${cname(col)} bar, so it is about ${n} ${u.many}.`, { visual: V.svg(Math.max(n * px + 20, px + 90), 80, body, 'bar and 1 unit') });
  } },
  d: { t: 'check an estimate with a ruler', g: (R, O) => {
    const u = U(O), n = R.int(2, u.max), col = R.pick(COLS), who = R.pick(['Sam', 'Mia', 'Leo', 'Ana', 'Ben', 'Kai']);
    const vis = V.msr_ruler(u.ab, { bars: [{ from: 0, to: n, color: col }] });
    if (R.bool(0.3)) {
      const g = Math.max(1, n + R.pick([-2, -1, 0, 1, 2, 3])), k = g < n ? 0 : g === n ? 1 : 2;
      return choiceFixed(`${who} guessed the bar is ${g} ${u.ab}. Measure it. Was the guess…`, ['too small', 'just right', 'too big'], k,
        `The bar is ${n} ${u.ab}. ${g} is ${['less than', 'the same as', 'more than'][k]} ${n}.`, { visual: vis });
    }
    let g; do { g = R.int(1, u.max + 2); } while (g === n);
    const off = Math.abs(g - n);
    if (R.bool()) return num(`${who} guessed ${g} ${u.ab}. Measure the bar. How far off was the guess?`, [{ label: u.ab, ans: off }],
      `The bar is ${n} ${u.ab}. From ${Math.min(g, n)} to ${Math.max(g, n)} is ${off}.`, { visual: vis });
    return num(`${who} guessed ${g} ${u.ab}. How long is the bar really? How far off was the guess?`, [{ label: 'bar', ans: n }, { label: 'off by', ans: off }],
      `The bar is ${n} ${u.ab}. From ${Math.min(g, n)} to ${Math.max(g, n)} is ${off}.`, { visual: vis });
  } },
} });

/* ================= I.7.05 Compare weight ================= */
const WEIGHT = [['feather', 1], ['leaf', 1], ['pencil', 2], ['spoon', 2], ['apple', 3], ['sock', 2], ['book', 4], ['shoe', 4], ['cat', 6], ['dog', 7], ['bike', 8], ['car', 11], ['horse', 11], ['elephant', 13], ['chair', 7], ['bag of rice', 6]];
const art = s => (/^[aeiou]/.test(s) ? 'an ' : 'a ') + s;
const mkObjs = (R, k) => { const cs = R.sample(COLS, k), sh = R.sample(OBJ, k); return cs.map((c, i) => ({ color: c, s: sh[i].s, name: `${cname(c)} ${sh[i].n}`, size: R.int(24, 44) })); };
E1.skill({ id: 'I.7.05', name: 'Compare weight', steps: {
  a: { t: 'heavier or lighter', g: (R, O) => {
    const heavy = R.bool();
    if (R.bool(0.3)) {
      let tr; do { tr = R.sample(WEIGHT, 3).sort((a, b) => a[1] - b[1]); } while (tr[1][1] - tr[0][1] < 2 || tr[2][1] - tr[1][1] < 2);
      const ans = heavy ? tr[2][0] : tr[0][0];
      return choice(R, `Which is the ${heavy ? 'heaviest' : 'lightest'}?`, ans, [tr[1][0], heavy ? tr[0][0] : tr[2][0]],
        `From lightest to heaviest: ${tr.map(t => t[0]).join(', ')}.`);
    }
    let p; do { p = R.sample(WEIGHT, 2); } while (Math.abs(p[0][1] - p[1][1]) < 3);
    const [hv, lt] = p[0][1] > p[1][1] ? p : [p[1], p[0]];
    return choice(R, `Which is ${heavy ? 'heavier' : 'lighter'}?`, heavy ? hv[0] : lt[0], [heavy ? lt[0] : hv[0]],
      `${cap(art(hv[0]))} is much heavier than ${art(lt[0])}.`);
  } },
  b: { t: 'balance scale', g: (R, O) => {
    const [a, b] = mkObjs(R, 2), t = R.pick([1, 1, -1, -1, 0]);
    const vis = V.msr_balance(a, b, t);
    if (t === 0) return choiceFixed('What does the scale show?', [`the ${a.name} is heavier`, `the ${b.name} is heavier`, 'they weigh the same'], 2,
      'The scale is level, so both sides weigh the same.', { visual: vis });
    const heavy = R.bool(), hv = t === 1 ? a : b, lt = t === 1 ? b : a;
    return choice(R, `Which is ${heavy ? 'heavier' : 'lighter'}?`, `the ${(heavy ? hv : lt).name}`, [`the ${(heavy ? lt : hv).name}`],
      `The heavier side goes down. The ${hv.name} side is down, so the ${(heavy ? hv : lt).name} is ${heavy ? 'heavier' : 'lighter'}.`, { visual: vis });
  } },
  c: { t: 'weigh with cubes', g: (R, O) => {
    const [a, b] = mkObjs(R, 2);
    if (R.bool(0.55)) {
      const n = R.int(2, 12), onL = R.bool(), cubes = { s: 'cubes', n };
      return num(`The scale is level. How many cubes does the ${a.name} weigh?`, n, `The two sides balance, so the ${a.name} weighs the same as the cubes. Count them: ${n}.`,
        { visual: V.msr_balance(onL ? a : cubes, onL ? cubes : a, 0) });
    }
    const [na, nb] = R.distinct(2, 10, 2), hv = na > nb ? a : b, lt = hv === a ? b : a;
    const vis = V.side([V.msr_balance(a, { s: 'cubes', n: na }, 0), V.msr_balance(b, { s: 'cubes', n: nb }, 0)], { gap: 0 });
    const why = `The ${a.name} weighs ${na} cubes. The ${b.name} weighs ${nb} cubes.`;
    if (R.bool()) { const heavy = R.bool(); return choice(R, `Which is ${heavy ? 'heavier' : 'lighter'}?`, `the ${(heavy ? hv : lt).name}`, [`the ${(heavy ? lt : hv).name}`], `${why} So the ${(heavy ? hv : lt).name} is ${heavy ? 'heavier' : 'lighter'}.`, { visual: vis }); }
    return num(`How many cubes heavier is the ${hv.name}?`, Math.abs(na - nb), `${why} ${Math.max(na, nb)} − ${Math.min(na, nb)} = ${Math.abs(na - nb)}.`, { visual: vis });
  } },
  d: { t: 'order by weight', g: (R, O) => {
    const ob = mkObjs(R, 3);  // ob[0] > ob[1] > ob[2]
    const b1 = R.bool() ? V.msr_balance(ob[0], ob[1], 1) : V.msr_balance(ob[1], ob[0], -1);
    const b2 = R.bool() ? V.msr_balance(ob[1], ob[2], 1) : V.msr_balance(ob[2], ob[1], -1);
    const vis = V.side(R.bool() ? [b1, b2] : [b2, b1], { gap: 0 });
    const why = `The ${ob[0].name} is heavier than the ${ob[1].name}, and the ${ob[1].name} is heavier than the ${ob[2].name}.`;
    const m = R.int(0, 2), nm = o => 'the ' + o.name;
    if (m === 0) return choice(R, 'Which is the heaviest?', nm(ob[0]), [nm(ob[1]), nm(ob[2])], why, { visual: vis });
    if (m === 1) return choice(R, 'Which is the lightest?', nm(ob[2]), [nm(ob[1]), nm(ob[0])], why, { visual: vis });
    const s = a => a.map(o => o.name).join(', ');
    return choice(R, 'Order from heaviest to lightest.', s([ob[0], ob[1], ob[2]]), [s([ob[2], ob[1], ob[0]]), s([ob[1], ob[0], ob[2]])], why, { visual: vis });
  } },
} });

/* ================= I.7.06 Compare capacity ================= */
// "pour" picture: container A (now empty) → container B after all of A's water was poured in. spill: B overflowed.
V.msr_pour = function (spill, level, cA, cB) {
  const jar = (x, w, h, col) => `<path d="M${x} ${130 - h} V124 Q${x} 130 ${x + 6} 130 H${x + w - 6} Q${x + w} 130 ${x + w} 124 V${130 - h}" fill="none" stroke="${C.ink}" stroke-width="3"/>` + `<rect x="${x - 3}" y="${127 - h}" width="${w + 6}" height="3" fill="${col}"/>`;
  const wA = cA.w, hA = cA.h, wB = cB.w, hB = cB.h, xA = 20, xB = 200;
  let b = jar(xA, wA, hA, cA.color) + V.text(xA + wA / 2, 150, 'A', { size: 16, weight: 700 });
  b += `<path d="M${xA + wA + 14} 80 H${xB - 22}" stroke="${C.muted}" stroke-width="3"/><path d="M${xB - 30} 72 L${xB - 16} 80 L${xB - 30} 88 Z" fill="${C.muted}"/>`;
  const wl = spill ? hB : P1(hB * level);
  b += `<rect x="${xB + 2}" y="${P1(129 - wl)}" width="${wB - 4}" height="${wl}" rx="3" fill="${C.blue}" fill-opacity="0.45"/>`;
  if (spill) b += `<ellipse cx="${xB + wB + 22}" cy="134" rx="26" ry="5" fill="${C.blue}" fill-opacity="0.45"/><path d="M${xB + wB} ${130 - hB} q10 4 12 20" fill="none" stroke="${C.blue}" stroke-opacity="0.6" stroke-width="4"/>`;
  b += jar(xB, wB, hB, cB.color) + V.text(xB + wB / 2, 150, 'B', { size: 16, weight: 700 });
  return V.svg(xB + wB + 56, 160, b, 'pouring from A into B');
};
E1.skill({ id: 'I.7.06', name: 'Compare capacity', steps: {
  a: { t: 'holds more or less', g: (R, O) => {
    const more = R.bool(), word = more ? 'more' : 'less';
    if (R.bool()) {  // pour A into B
      const spill = R.bool(), big = { w: R.int(66, 80), h: R.int(86, 104) }, small = { w: R.int(46, 58), h: R.int(52, 70) }, [k1, k2] = R.sample(COLS, 2);
      const cA = Object.assign({ color: k1 }, spill ? big : small), cB = Object.assign({ color: k2 }, spill ? small : big);
      const bigger = spill ? 'A' : 'B', ans = more ? bigger : (bigger === 'A' ? 'B' : 'A');
      return choiceFixed(`All the water in A was poured into B. Which holds ${word}?`, ['A', 'B'], ans === 'A' ? 0 : 1,
        (spill ? `B spilled over, so A had more water than B can hold. A holds more.` : `All of A's water fit in B with room left over. B holds more.`) + (more ? '' : ` So ${ans} holds less.`),
        { visual: V.msr_pour(spill, R.pick([0.4, 0.5, 0.6, 0.7]), cA, cB) });
    }
    const [s1, s2] = R.sample(['jug', 'glass', 'bowl', 'vase'], 2), [c1, c2] = R.sample(COLS, 2), big = R.bool();
    const sz = b => b ? { w: R.int(110, 130), h: R.int(95, 105) } : { w: R.int(44, 56), h: R.int(38, 48) };
    const list = [Object.assign({ label: 'A', shape: s1, color: c1 }, sz(big)), Object.assign({ label: 'B', shape: s2, color: c2 }, sz(!big))];
    const bigL = big ? 'A' : 'B', ans = more ? bigL : (bigL === 'A' ? 'B' : 'A');
    return choiceFixed(`Which holds ${word}?`, ['A', 'B'], ans === 'A' ? 0 : 1, `${bigL} is much bigger, so it holds more. The small one holds less.`, { visual: V.msr_containers(list) });
  } },
  b: { t: 'fill with cups', g: (R, O) => {
    const n = R.int(2, 15), c = { label: '', cups: n, shape: R.pick(['jug', 'glass', 'bowl', 'vase']), color: R.pick(COLS), w: R.int(66, 84), h: R.int(62, 78) };
    const obj = { jug: 'jug', glass: 'glass', bowl: 'bowl', vase: 'vase' }[c.shape];
    return num(`It took these cups of water to fill the ${obj}. How many cups does it hold?`, n, `Count the cups${n > 5 ? ' by rows of 5' : ''}: ${n}. The ${obj} holds ${n} cups.`, { visual: V.msr_containers([c]) });
  } },
  c: { t: 'compare by cups', g: (R, O) => {
    const k = R.pick([2, 2, 3]), cups = R.distinct(2, 9, k), labs = ['A', 'B', 'C'].slice(0, k);
    const shapes = R.sample(['jug', 'glass', 'bowl', 'vase'], k), cols = R.sample(COLS, k);
    const list = labs.map((l, i) => ({ label: l, cups: cups[i], shape: shapes[i], color: cols[i], w: R.int(66, 84), h: R.int(62, 78) }));  // similar sizes: the cups, not the look, decide
    const more = R.bool(), best = more ? cups.indexOf(Math.max(...cups)) : cups.indexOf(Math.min(...cups));
    const word = k === 2 ? (more ? 'more' : 'less') : (more ? 'the most' : 'the least');
    return choiceFixed(`Each one was filled with cups of water. Which holds ${word}?`, labs, best,
      `${labs.map((l, i) => `${l} fills ${cups[i]} cups`).join(', ')}. So ${labs[best]} holds ${word}.`,
      { visual: V.msr_containers(list) });
  } },
  d: { t: 'order by capacity', g: (R, O) => {
    const cups = R.distinct(2, 9, 3), labs = ['A', 'B', 'C'], shapes = R.sample(['jug', 'glass', 'bowl', 'vase'], 3), cols = R.sample(COLS, 3), txt = R.bool(0.4);
    const list = labs.map((l, i) => ({ label: txt ? `${l}: ${cups[i]} cups` : l, cups: txt ? 0 : cups[i], shape: shapes[i], color: cols[i], w: R.int(66, 84), h: R.int(62, 78) }));
    const up = [0, 1, 2].sort((a, b) => cups[a] - cups[b]), asc = R.bool(), ord = asc ? up : up.slice().reverse();
    const s = a => a.map(i => labs[i]).join(', ');
    const ds = [s(ord.slice().reverse()), s([ord[1], ord[0], ord[2]]), s([ord[0], ord[2], ord[1]])];
    return choice(R, `Order them from ${asc ? 'least' : 'most'} water to ${asc ? 'most' : 'least'}.`, s(ord), R.sample(ds, 2),
      `${labs.map((l, i) => `${l} holds ${cups[i]}`).join(', ')}. ${asc ? 'Least to most' : 'Most to least'}: ${s(ord)}.`, { visual: V.msr_containers(list) });
  } },
} });

/* ================= I.7.07 Time to the hour ================= */
const ctxOf = H => H < 12 ? 'morning' : H < 18 ? 'afternoon' : 'evening';
E1.skill({ id: 'I.7.07', name: 'Time to the hour', steps: {
  a: { t: 'the hour hand', g: (R, O) => {
    const h = R.int(1, 12), m = R.int(0, 2);
    if (m === 0) return num('The short hand is the hour hand. What number does it point to?', h, `The short hand points straight at ${h}.`, { visual: V.msr_clock(h, 0, { noMin: true }) });
    if (m === 1) return num('What number does the hour hand point to?', h, `The hour hand is the short hand. It points to ${h}.`, { visual: V.msr_clock(h, 0) });
    return choiceFixed('Which hand is the hour hand?', ['the short hand', 'the long hand'], 0, `The hour hand is the short one. Here it points to ${h}.`, { visual: V.msr_clock(h, 0) });
  } },
  b: { t: "read o'clock", g: (R, O) => {
    const h = R.int(1, 11) + (R.bool(0.1) ? 1 : 0);
    return choice(R, 'What time is it?', `${h} o'clock`, [`${nxt(h)} o'clock`, `12 o'clock`, `${prv(h)} o'clock`].filter(s => s !== `${h} o'clock`).slice(0, 3),
      `The long hand is on 12, so it is an o'clock time. The short hand points to ${h}: ${h} o'clock.`, { visual: V.msr_clock(h, 0) });
  } },
  c: { t: 'analog and digital', g: (R, O) => {
    const is24 = O.clock === '24h';
    if (R.bool()) {  // digital → pick the clock
      const H = is24 ? R.int(1, 22) : R.int(1, 12), h = h12(H);
      const shown = is24 ? t24(H, 0) : t12(h, 0);
      const wrong = [V.msr_clock(nxt(h), 0), V.msr_clock(prv(h), 0)];
      if (h !== 12) wrong.push(V.msr_clock(0, 0, { hA: 0, mA: h * 30 }));
      return choice(R, 'Which clock shows this time?', V.msr_clock(h, 0), R.sample(wrong, 2),
        `${shown} is ${h} o'clock: short hand on ${h}, long hand on 12.`, { visual: V.msr_digital(shown) });
    }
    if (is24) {
      const H = R.int(6, 21), h = h12(H), c = ctxOf(H);
      return choice(R, `It is ${c}. Which digital time matches the clock?`, t24(H, 0), [t24((H + 12) % 24, 0), t24(H + 1, 0), `12:${pad2(h)}`],
        `The clock shows ${h} o'clock. In the ${c} that is ${t24(H, 0)}.`, { visual: V.msr_clock(h, 0) });
    }
    const h = R.int(1, 12);
    return choice(R, 'Which digital time matches the clock?', t12(h, 0), [t12(nxt(h), 0), `12:${pad2(h)}`, `${h}:12`].filter(s => s !== t12(h, 0)),
      `It is ${h} o'clock. On a digital clock that is ${t12(h, 0)}.`, { visual: V.msr_clock(h, 0) });
  } },
  d: { t: 'show a time', g: (R, O) => {
    const h = R.int(1, 11), is24 = O.clock === '24h' && R.bool();
    const H = is24 && R.bool() ? h + 12 : h;
    const label = is24 ? t24(H, 0) : `${h} o'clock`;
    const wrong = [V.msr_clock(0, 0, { hA: 0, mA: h * 30 }), V.msr_clock(nxt(h), 0), V.msr_clock(h, 0, { mA: 180 })];
    return choice(R, `Which clock shows ${label}?`, V.msr_clock(h, 0), R.sample(wrong, 2),
      `${is24 ? label + ' is ' + h + " o'clock. " : ''}For ${h} o'clock the short hand points to ${h} and the long hand points to 12.`);
  } },
} });

/* ================= I.7.08 Time to the half hour ================= */
const halfWords = h => `half past ${h}`;
E1.skill({ id: 'I.7.08', name: 'Time to the half hour', steps: {
  a: { t: 'half past', g: (R, O) => {
    const h = R.int(1, 12);
    return choice(R, 'What time is it?', halfWords(h), [halfWords(nxt(h)), `${h} o'clock`, `6 o'clock`].filter(s => s !== halfWords(h)),
      `The long hand is on 6: half past. The short hand is just past ${h}, so it is half past ${h}.`, { visual: V.msr_clock(h, 30) });
  } },
  b: { t: 'minute hand at 6', g: (R, O) => {
    const h = R.int(1, 12), half = R.bool(0.6);
    if (R.bool(0.3)) return num(`It is half past ${h}. What number does the long hand point to?`, 6, 'At half past, the long hand has gone half way round. It points to 6.', { visual: V.msr_clock(h, 30, { noMin: true }) });
    return num('Look at the short hand. Where should the long hand point?',
      half ? 6 : 12, half ? `The short hand is half way from ${h} to ${nxt(h)}, so it is half past ${h}. The long hand is on 6.` : `The short hand is right on ${h}, so it is ${h} o'clock. The long hand is on 12.`,
      { visual: V.msr_clock(h, half ? 30 : 0, { noMin: true }) });
  } },
  c: { t: 'on a digital clock', g: (R, O) => {
    const is24 = O.clock === '24h', h = R.int(1, 12);
    if (R.bool(0.35)) {  // digital → words
      const H = is24 ? h + (R.bool() && h < 12 ? 12 : 0) : h, shown = is24 ? t24(H, 30) : t12(h, 30);
      return choice(R, 'What time is this?', halfWords(h), [halfWords(nxt(h)), `${h} o'clock`, halfWords(prv(h))].filter(s => s !== halfWords(h)),
        `:30 means 30 minutes past the hour. ${shown} is half past ${h}.`, { visual: V.msr_digital(shown) });
    }
    if (is24) {
      const H = R.int(6, 21), hh = h12(H), c = ctxOf(H);
      return choice(R, `It is ${c}. Which digital time matches?`, t24(H, 30), [t24((H + 12) % 24, 30), t24((H + 1) % 24, 30), t24(H, 6)],
        `The clock shows half past ${hh}. In the ${c} that is ${t24(H, 30)}.`, { visual: V.msr_clock(hh, 30) });
    }
    return choice(R, 'Which digital time matches the clock?', t12(h, 30), [t12(nxt(h), 30), t12(h, 6), t12(6, h * 5 % 60)].filter(s => s !== t12(h, 30)),
      `It is half past ${h}. Half past is 30 minutes, so ${t12(h, 30)}.`, { visual: V.msr_clock(h, 30) });
  } },
  d: { t: 'show half past', g: (R, O) => {
    const h = R.pick([1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 12]);
    const wrong = [V.msr_clock(h, 30, { hA: (h % 12) * 30 }), V.msr_clock(prv(h), 30), V.msr_clock(0, 0, { hA: 180, mA: ((h % 12) + 0.5) * 30 })];
    const label = O.clock === '24h' && R.bool() && h < 12 ? t24(h + 12, 30) : halfWords(h);
    return choice(R, `Which clock shows ${label}?`, V.msr_clock(h, 30), R.sample(wrong, 2),
      `At half past ${h} the long hand is on 6 and the short hand is half way between ${h} and ${nxt(h)}.`);
  } },
} });

/* ================= I.7.09 Time to five minutes ================= */
E1.skill({ id: 'I.7.09', name: 'Time to five minutes', steps: {
  a: { t: 'count by 5s round the clock', g: (R, O) => {
    const n = R.int(1, 11); let h; do h = R.int(1, 12); while (h === n || h === n - 1);
    if (R.bool(0.3)) return num(`Count by 5s round the clock. Which number means ${n * 5} minutes?`, n,
      `Count 5, 10, 15 … until ${n * 5}. That is ${n} jump${n === 1 ? '' : 's'}, so the number is ${n}.`, { visual: V.msr_clock(h, 0, { noMin: true, noHour: true }) });
    return num('How many minutes past the hour?', n * 5,
      `The long hand is on ${n}. Count by 5s: ${Array.from({ length: n }, (_, i) => (i + 1) * 5).join(', ')}.`, { visual: V.msr_clock(h, n * 5) });
  } },
  b: { t: 'read any 5-minute time', g: (R, O) => {
    const h = R.int(1, 12), m = R.int(1, 11) * 5;
    if (R.bool(0.3)) {
      const wrong = [V.msr_clock(nxt(h), m), V.msr_clock(0, 0, { hA: (m / 5) * 30 + 15, mA: (h % 12) * 30 })];
      if (60 - m !== m) wrong.push(V.msr_clock(h, 60 - m));
      const shown = O.clock === '24h' && h < 12 && R.bool() ? t24(h + 12, m) : t12(h, m);
      const w = R.sample(wrong, 2);
      return choice(R, 'Which clock shows this time?', V.msr_clock(h, m), w,
        `${shown}: the short hand is past ${h}, and the long hand is on ${m / 5} (${m / 5} fives = ${m}).`, { visual: V.msr_digital(shown) });
    }
    return num('What time is it?', [{ label: 'hour', ans: h }, { label: 'minutes', ans: m }],
      `The short hand is just past ${h}, so the hour is ${h}. The long hand is on ${m / 5}: ${m / 5} fives are ${m}. It is ${t12(h, m)}.`,
      { visual: V.msr_clock(h, m) });
  } },
  c: { t: 'quarter past and quarter to', g: (R, O) => {
    const h = R.int(1, 12), past = R.bool(), m = past ? 15 : 45;
    const right = past ? `quarter past ${h}` : `quarter to ${nxt(h)}`;
    if (R.bool(0.3)) {
      const wrong = [V.msr_clock(h, past ? 45 : 15), V.msr_clock(h, 30), V.msr_clock(nxt(h), 15)];
      return choice(R, `Which clock shows ${right}?`, V.msr_clock(h, m), R.sample(wrong, 2),
        past ? `Quarter past ${h}: the long hand is on 3 and the short hand just past ${h}.` : `Quarter to ${nxt(h)}: the long hand is on 9 and the short hand is nearly at ${nxt(h)}.`);
    }
    return choice(R, 'What time is it?', right, [past ? `quarter to ${h}` : `quarter past ${h}`, past ? `quarter to ${nxt(h)}` : `quarter to ${h}`, `half past ${h}`],
      past ? `The long hand is on 3: 15 minutes, a quarter of the way round. It is quarter past ${h}.` : `The long hand is on 9: 15 minutes before the hour. The short hand is nearly at ${nxt(h)}, so it is quarter to ${nxt(h)}.`,
      { visual: V.msr_clock(h, m) });
  } },
  d: { t: 'a.m. and p.m.', g: (R, O) => {
    const ACT = [['eat breakfast', 'am', 6, 8], ['wake up', 'am', 6, 7], ['go to school', 'am', 7, 8], ['have a snack at school', 'am', 9, 10],
      ['eat dinner', 'pm', 5, 7], ['go to bed', 'pm', 7, 9], ['play after school', 'pm', 3, 5], ['take a bath', 'pm', 6, 8], ['look at the stars', 'pm', 8, 10], ['see the sunrise', 'am', 5, 6]];
    const [act, ap, lo, hi] = R.pick(ACT), h = R.int(lo, hi), m = R.int(0, 11) * 5, H = ap === 'pm' ? h + 12 : h;
    if (O.clock === '24h') {
      const k = R.int(0, 2);
      if (k === 0) {
        const HH = R.pick([R.int(6, 10), R.int(13, 16), R.int(19, 22)]), mm = R.int(0, 11) * 5, part = ctxOf(HH);
        return choiceFixed('Is this time in the morning, afternoon or evening?', ['morning', 'afternoon', 'evening'], ['morning', 'afternoon', 'evening'].indexOf(part),
          HH < 12 ? `${t24(HH, mm)} is before 12:00, so it is morning.` : `${t24(HH, mm)} is ${HH - 12}:${pad2(mm)} after noon, in the ${part}.`, { visual: V.msr_digital(t24(HH, mm)) });
      }
      if (k === 1) return choice(R, `Which time do you ${act}?`, t24(H, m), [t24((H + 12) % 24, m)],
        ap === 'am' ? `You ${act} in the morning, so it is before 12:00.` : `You ${act} in the afternoon or evening, so it is after 12:00: ${h} + 12 = ${H}.`);
      const hp = R.int(1, 11);
      return choice(R, `What is ${hp}:${pad2(m)} p.m. on a 24-hour clock?`, t24(hp + 12, m), [t24(hp, m), t24(hp + 10, m), t24(hp + 11, m)],
        `p.m. means after noon, so add 12: ${hp} + 12 = ${hp + 12}.`);
    }
    if (R.bool(0.65)) return choiceFixed(`You ${act} at ${t12(h, m)}. Is it a.m. or p.m.?`, ['a.m.', 'p.m.'], ap === 'am' ? 0 : 1,
      ap === 'am' ? `a.m. is from midnight to noon. You ${act} in the morning, so it is a.m.` : `p.m. is from noon to midnight. You ${act} later in the day, so it is p.m.`,
      { visual: V.msr_digital(t12(h, m)) });
    const pick = R.int(0, 2), hh = [R.int(6, 10), R.int(1, 4), R.int(7, 10)][pick], mm = R.int(0, 11) * 5, sfx = pick === 0 ? 'a.m.' : 'p.m.';
    return choiceFixed(`${t12(hh, mm)} ${sfx} is in the …`, ['morning', 'afternoon', 'evening'], pick,
      pick === 0 ? 'a.m. times before noon are in the morning.' : pick === 1 ? `${hh} p.m. is soon after noon, in the afternoon.` : `${hh} p.m. is late in the day, in the evening.`);
  } },
} });

/* ================= I.7.10 Days, weeks and the calendar ================= */
E1.skill({ id: 'I.7.10', name: 'Days, weeks and the calendar', steps: {
  a: { t: 'days of the week', g: (R, O) => {
    const i = R.int(0, 6), m = R.int(0, 3), D = k => DAYS[(k + 14) % 7];
    if (m === 0) return choice(R, `What day comes after ${D(i)}?`, D(i + 1), [D(i - 1), D(i + 2), D(i)], `The days go ${D(i - 1)}, ${D(i)}, ${D(i + 1)}.`);
    if (m === 1) return choice(R, `What day comes before ${D(i)}?`, D(i - 1), [D(i + 1), D(i - 2), D(i)], `The days go ${D(i - 1)}, ${D(i)}, ${D(i + 1)}.`);
    if (m === 2) return choice(R, `What day is between ${D(i - 1)} and ${D(i + 1)}?`, D(i), [D(i + 2), D(i - 2), D(i + 3)], `${D(i - 1)}, ${D(i)}, ${D(i + 1)}.`);
    const k = R.int(2, 3);
    return choice(R, `Today is ${D(i)}. What day is it in ${k} days?`, D(i + k), [D(i + k - 1), D(i + k + 1), D(i - k)],
      `Count on ${k}: ${Array.from({ length: k }, (_, j) => D(i + j + 1)).join(', ')}.`);
  } },
  b: { t: 'months', g: (R, O) => {
    const i = R.int(0, 11), m = R.int(0, 3), M = k => MONTHS[(k + 24) % 12];
    if (m === 0) return choice(R, `What month comes after ${M(i)}?`, M(i + 1), [M(i - 1), M(i + 2)], `The months go ${M(i - 1)}, ${M(i)}, ${M(i + 1)}.`);
    if (m === 1) return choice(R, `What month comes before ${M(i)}?`, M(i - 1), [M(i + 1), M(i - 2)], `The months go ${M(i - 1)}, ${M(i)}, ${M(i + 1)}.`);
    if (m === 2) { const n = R.int(1, 12); return choice(R, `Which is month number ${n} of the year?`, M(n - 1), [M(n), M(n - 2), M(n + 1)], `Count from January: ${MONTHS.slice(0, n).join(', ')}.`.replace(/(([^,]*,){4}).*,/, '$1 …,')); }
    const ask = R.pick([['How many months are in a year?', 12, 'January to December is 12 months.'], ['How many days are in a week?', 7, 'Sunday to Saturday is 7 days.'], [`How many days are in ${M(i)}?`, MLEN[i], `${M(i)} has ${MLEN[i]} days${i === 1 ? ' (29 in a leap year)' : ''}.`]]);
    return num(ask[0], ask[1], ask[2]);
  } },
  c: { t: 'read a calendar', g: (R, O) => {
    const mi = R.int(0, 11), st = R.int(0, 6), len = MLEN[mi], name = MONTHS[mi], vis = V.msr_cal(name, st, len);
    const dow = d => (st + d - 1) % 7, m = R.int(0, 3);
    if (m === 0) {
      const d = R.int(1, len), w = dow(d);
      return choice(R, `What day of the week is ${name} ${d}?`, DAYS[w], [DAYS[(w + 1) % 7], DAYS[(w + 6) % 7]], `Find ${d} and look up to the top of its column: ${DAYS[w]}.`, { visual: vis });
    }
    if (m === 1) {
      const w = R.int(0, 6), cnt = Array.from({ length: len }, (_, k) => k + 1).filter(d => dow(d) === w).length;
      return num(`How many ${DAYS[w]}s are in ${name}?`, cnt, `Count the dates in the ${DAYS[w].slice(0, 3)} column: ${cnt}.`, { visual: vis });
    }
    if (m === 2) {
      const w = R.int(0, 6), first = ((w - st + 7) % 7) + 1, k = R.int(1, 3);
      return num(`What is the date of the ${['first', 'second', 'third'][k - 1]} ${DAYS[w]}?`, first + 7 * (k - 1),
        `Go down the ${DAYS[w].slice(0, 3)} column: ${Array.from({ length: k }, (_, j) => first + 7 * j).join(', ')}.`, { visual: vis });
    }
    return num(`How many days are in ${name}?`, len, `The last date in ${name} is ${len}.`, { visual: V.msr_cal(name, st, len) });
  } },
  d: { t: 'before and after dates', g: (R, O) => {
    const mi = R.int(0, 11), st = R.int(0, 6), len = MLEN[mi], name = MONTHS[mi], m = R.int(0, 3), vis = R.bool(0.6);
    if (m === 0) { const d = R.int(1, len - 7); return num(`What date is 1 week after ${name} ${d}?`, d + 7, `A week is 7 days. ${d} + 7 = ${d + 7}.`, vis ? { visual: V.msr_cal(name, st, len, { ring: [d] }) } : {}); }
    if (m === 1) { const d = R.int(8, len); return num(`What date is 1 week before ${name} ${d}?`, d - 7, `A week is 7 days. ${d} − 7 = ${d - 7}.`, vis ? { visual: V.msr_cal(name, st, len, { ring: [d] }) } : {}); }
    const k = R.int(2, 4), after = m === 2, d = after ? R.int(1, len - k) : R.int(k + 1, len);
    return num(`What date is ${k} days ${after ? 'after' : 'before'} ${name} ${d}?`, after ? d + k : d - k,
      `Count ${after ? 'on' : 'back'} ${k} from ${d}: ${Array.from({ length: k }, (_, j) => after ? d + j + 1 : d - j - 1).join(', ')}.`, vis ? { visual: V.msr_cal(name, st, len, { ring: [d] }) } : {});
  } },
} });

/* ================= I.7.11 Coins ================= */
const pieceSvg = (v, set) => V.msr_money([v], set);
const padW = (svg, W) => { const m = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(svg), w = +m[1], h = +m[2]; return w >= W ? svg : V.svg(W, h, V.nest(svg, P1((W - w) / 2), 0)); };
const payVis = (O, p, pay) => V.side([{ svg: padW(V.msr_tag(money(O, p)), 110), caption: 'Cost' }, { svg: padW(V.msr_money([pay], O.coins), 110), caption: 'You pay' }]);
E1.skill({ id: 'I.7.11', name: 'Coins', steps: {
  a: { t: 'name the coins', g: (R, O) => {
    const set = O.coins, S = SETS[set];
    if (set === 'US') {
      const m = R.int(0, 2), v = R.pick(S.coins);
      if (m === 0) return choice(R, `Which coin is the ${USNAME[v]}?`, pieceSvg(v, set), R.sample(S.coins.filter(c => c !== v), 2).map(c => pieceSvg(c, set)),
        `A ${USNAME[v]} is worth ${v}¢.`);
      if (m === 1) return choice(R, 'What is this coin called?', USNAME[v], S.coins.filter(c => c !== v).map(c => USNAME[c]),
        `The coin says ${v}¢. The ${v}¢ coin is the ${USNAME[v]}.`, { visual: pieceSvg(v, set) });
      const n = R.pick(S.notes);
      return choice(R, 'Which one is a note, not a coin?', pieceSvg(n, set), R.sample(S.coins, 2).map(c => pieceSvg(c, set)),
        `Coins are round metal. ${money(O, n)} is a paper note.`);
    }
    const m = R.int(0, 2);
    if (m === 0) { const v = R.pick([...S.coins, ...S.notes]); return choiceFixed(`Is ${v} baht a coin or a note?`, ['coin', 'note'], v >= 20 ? 1 : 0, `Coins are 1, 2, 5 and 10 baht. Notes are 20, 50 and 100 baht.`); }
    if (m === 1) { const n = R.pick(S.notes); return choice(R, 'Which one is a note, not a coin?', pieceSvg(n, set), R.sample(S.coins, 2).map(c => pieceSvg(c, set)), `The ${n} baht is a paper note. The others are coins.`); }
    const v = R.pick(S.coins);
    return choice(R, `Which is the ${v} baht coin?`, pieceSvg(v, set), R.sample(S.coins.filter(c => c !== v), 2).map(c => pieceSvg(c, set)), `Look for the coin that says ${v}.`);
  } },
  b: { t: 'their values', g: (R, O) => {
    const set = O.coins, S = SETS[set], m = R.int(0, 2);
    if (m === 0) {
      const three = R.sample(S.coins, 3), most = R.bool(), best = most ? Math.max(...three) : Math.min(...three);
      return choice(R, `Which coin is worth the ${most ? 'most' : 'least'}?`, pieceSvg(best, set), three.filter(v => v !== best).map(v => pieceSvg(v, set)),
        set === 'US' ? `Look at the value, not the size: ${three.map(v => `${USNAME[v]} ${v}¢`).join(', ')}.` : `Compare the numbers: ${three.join(', ')} baht.`);
    }
    if (set === 'US') {
      if (m === 1) { const v = R.pick(S.coins); return num(`How many cents is a ${USNAME[v]} worth?`, v, `A ${USNAME[v]} is ${v}¢.`); }
      const [a, b] = R.pick([[1, 5], [1, 10], [5, 10], [5, 25], [1, 25]]);
      return num(`How many ${USNAME[a] === 'penny' ? 'pennies' : USNAME[a] + 's'} make 1 ${USNAME[b]}?`, b / a, `A ${USNAME[b]} is ${b}¢ and a ${USNAME[a]} is ${a}¢. ${b / a} × ${a}¢ = ${b}¢.`);
    }
    const [a, b] = R.pick([[1, 2], [1, 5], [1, 10], [5, 10], [2, 10], [10, 20], [10, 50], [10, 100], [20, 100], [50, 100]]);
    return num(`How many ${a} baht ${a >= 20 ? 'notes' : 'coins'} make ${b} baht?`, b / a, `Count by ${a}s up to ${b}: that is ${b / a}.`, { visual: V.msr_money([b], set) });
  } },
  c: { t: 'count same coins', g: (R, O) => {
    const set = O.coins, v = R.pick(SETS[set].coins), n = v === 25 ? R.int(2, 3) : R.int(2, 9);
    return num(`How many ${unitWord(O)} in all?`, v * n, `Count by ${v}s: ${Array.from({ length: n }, (_, i) => (i + 1) * v).join(', ')}. That is ${money(O, v * n)}.`,
      { visual: V.msr_money(Array(n).fill(v), set) });
  } },
  d: { t: 'count mixed coins', g: (R, O) => {
    const set = O.coins, S = SETS[set];
    let vals, tot;
    do {
      const types = R.sample(S.coins, R.int(2, 3)).sort((a, b) => b - a);
      vals = []; types.forEach(t => { for (let k = R.int(1, 3); k > 0; k--) vals.push(t); });
      if (set === 'THB' && R.bool(0.25)) vals.unshift(20);
      tot = vals.reduce((a, b) => a + b, 0);
    } while (tot >= 100);
    const shown = R.bool(0.3) ? R.shuffle(vals) : vals;
    const run = []; let s = 0; vals.forEach(v => { s += v; run.push(s); });
    return num(`How many ${unitWord(O)} in all?`, tot, `Start with the biggest and count on: ${run.join(', ')}. That is ${money(O, tot)}.`,
      { visual: V.msr_money(shown, set) });
  } },
} });

/* ================= I.7.12 Make amounts and change ================= */
const keyOf = a => a.slice().sort((x, y) => y - x).join(',');
function compose(R, amt, coins, maxN = 8) {  // random multiset of coins summing to amt
  for (let t = 0; t < 60; t++) {
    let r = amt; const out = [];
    while (r > 0 && out.length < maxN) { const ok = coins.filter(c => c <= r); const c = R.pick(ok.length > 1 && R.bool(0.6) ? ok.slice(-2) : ok); out.push(c); r -= c; }
    if (r === 0) return out.sort((a, b) => b - a);
  }
  return null;
}
E1.skill({ id: 'I.7.12', name: 'Make amounts and change', steps: {
  a: { t: 'make a total with coins', g: (R, O) => {
    const set = O.coins, coins = SETS[set].coins;
    let amt, good;
    do { amt = set === 'US' ? R.int(6, 60) : R.int(4, 40); good = compose(R, amt, coins, 6); } while (!good || good.length < 2);
    const wrongs = [];
    const w1 = good.slice(); w1.pop(); if (w1.length) wrongs.push(w1);
    const w2 = good.slice(); const i = R.int(0, w2.length - 1); const alt = coins.filter(c => c !== w2[i]); w2[i] = R.pick(alt); wrongs.push(w2.sort((a, b) => b - a));
    const w3 = good.concat([R.pick(coins.slice(0, 2))]).sort((a, b) => b - a); wrongs.push(w3);
    const sum = a => a.reduce((x, y) => x + y, 0);
    const ws = wrongs.filter(w => sum(w) !== amt);
    return choice(R, `Which coins make ${money(O, amt)}?`, V.msr_money(good, set, { maxW: 330 }), R.sample(ws, 2).map(w => V.msr_money(w, set, { maxW: 330 })),
      `Count on from the biggest coin: ${good.map((v, k) => sum(good.slice(0, k + 1))).join(', ')}. That makes ${money(O, amt)}.`);
  } },
  b: { t: 'two ways to make it', g: (R, O) => {
    const set = O.coins, coins = SETS[set].coins, sum = a => a.reduce((x, y) => x + y, 0);
    let amt, A, B, t = 0;
    do { amt = set === 'US' ? R.pick([10, 15, 20, 25, 30, 35, 40, 50]) : R.int(6, 30); A = compose(R, amt, coins, 7); B = compose(R, amt, coins, 7); t++; }
    while (!A || !B || keyOf(A) === keyOf(B));
    if (R.bool(0.4)) {
      const same = R.bool();
      let B2 = B;
      if (!same) { B2 = B.slice(); const i = R.int(0, B2.length - 1); const alt = coins.filter(c => c !== B2[i]); B2[i] = R.pick(alt); B2.sort((a, b) => b - a); }
      return yn(`Do both groups make ${money(O, amt)}?`, sum(B2) === amt,
        `Group A makes ${money(O, sum(A))}. Group B makes ${money(O, sum(B2))}.`,
        { visual: V.stack([{ svg: V.msr_money(A, set), caption: 'Group A' }, { svg: V.msr_money(B2, set), caption: 'Group B' }]) });
    }
    const w = [], w1 = B.slice(); w1.pop(); if (w1.length) w.push(w1);
    const w2 = B.slice(); const i = R.int(0, w2.length - 1); w2[i] = R.pick(coins.filter(c => c !== w2[i])); w.push(w2.sort((a, b) => b - a));
    const ws = w.filter(x => sum(x) !== amt);
    if (!ws.length) ws.push(B.concat([coins[0]]));
    return choice(R, `This makes ${money(O, amt)}. Which is another way?`, V.msr_money(B, set, { maxW: 330 }), ws.map(x => V.msr_money(x, set, { maxW: 330 })),
      `${B.join(' + ')} = ${amt}, so it also makes ${money(O, amt)}.`, { visual: V.msr_money(A, set) });
  } },
  c: { t: 'change from 10', g: (R, O) => {
    const set = O.coins, p = R.int(1, 9), ch = 10 - p;
    const pay = set === 'US' ? 'a dime (10¢)' : 'a 10 baht coin';
    const buy = R.bool();
    return num(buy ? `It costs ${money(O, p)}. You pay with ${pay}. How much change?` : `You have ${money(O, 10)}. You spend ${money(O, p)}. How much is left?`,
      ch, `Count up from ${p} to 10: that is ${ch}. ${p} + ${ch} = 10.`, { visual: buy ? payVis(O, p, 10) : V.msr_money([10], O.coins) });
  } },
  d: { t: 'change from a note', g: (R, O) => {
    const set = O.coins;
    let note, p;
    if (set === 'US') { note = 100; p = R.bool(0.7) ? R.int(1, 19) * 5 : R.int(11, 99); }
    else if (R.bool()) { note = 20; p = R.int(3, 19); }
    else { note = 100; p = R.bool(0.7) ? R.int(2, 19) * 5 : R.int(11, 99); }
    const ch = note - p, nx = Math.ceil(p / 10) * 10;
    const vis = payVis(O, p, note);
    const how = nx === p || nx === note ? `Count up from ${p} to ${note}: ${ch}.` : `Count up: ${p} to ${nx} is ${nx - p}, then ${nx} to ${note} is ${note - nx}. ${nx - p} + ${note - nx} = ${ch}.`;
    return num(set === 'US' ? `It costs ${p}¢. You pay $1. How many cents change?` : `It costs ${p} baht. You pay ${note} baht. How much change?`, ch,
      (set === 'US' ? '$1 is 100¢. ' : '') + how, { visual: vis });
  } },
} });

/* ================= I.7.13 Tally charts ================= */
E1.skill({ id: 'I.7.13', name: 'Tally charts', steps: {
  a: { t: 'read tallies', g: (R, O) => {
    const n = R.int(1, 24);
    return num('How many tally marks?', n, n >= 5 ? `Each crossed group is 5. Count by 5s, then the ones: ${n}.` : `Count the marks: ${n}.`, { visual: V.msr_tally(n) });
  } },
  b: { t: 'tally in groups of 5', g: (R, O) => {
    if (R.bool(0.55)) {
      const n = R.int(6, 19);
      return choice(R, `Which tally shows ${n}?`, V.msr_tally(n), R.sample([n - 1, n + 1, n > 10 ? n - 5 : n + 5], 2).map(V.msr_tally),
        `${n} is ${Math.floor(n / 5)} group${n >= 10 ? 's' : ''} of 5${n % 5 ? ` and ${n % 5} more` : ''}.`);
    }
    const n = R.int(10, 29);
    return num('Count by 5s, then count on. How many?', n, `${Math.floor(n / 5)} groups of 5: ${Array.from({ length: Math.floor(n / 5) }, (_, i) => (i + 1) * 5).join(', ')}. Then ${n % 5} more: ${n}.`, { visual: V.msr_tally(n) });
  } },
  c: { t: 'collect data', g: (R, O) => {
    const k = 3, cs = R.sample(COLS, k), ns = R.distinct(2, 7, k), data = R.shuffle(cs.flatMap((c, i) => Array(ns[i]).fill(c)));
    const per = 8, vis = V.svg(per * 36 + 8, Math.ceil(data.length / per) * 36 + 4, data.map((c, i) => V.dot(22 + (i % per) * 36, 20 + Math.floor(i / per) * 36, 13, c)).join(''), 'votes');
    if (R.bool(0.5)) {
      const i = R.int(0, k - 1);
      return num(`Kids voted for a color. Tally the votes. How many for ${cname(cs[i])}?`, ns[i], `Make one tally mark for each ${cname(cs[i])} dot: ${ns[i]}.`, { visual: vis });
    }
    const chart = v => V.msr_tallyChart(cs.map((c, i) => ({ label: cname(c), n: v[i], color: c })));
    return choice(R, 'Kids voted for a color. Which tally chart matches?', chart(ns), wrongVals(R, ns).slice(0, 2).map(chart),
      `Count each color: ${cs.map((c, i) => `${cname(c)} ${ns[i]}`).join(', ')}.`, { visual: vis });
  } },
  d: { t: 'answer questions', g: (R, O) => {
    const k = R.pick([3, 4]), { cats, vals } = dataset(R, k, 1, 14, { uniqueMax: true, uniqueMin: true });
    const vis = V.msr_tallyChart(cats.map((c, i) => ({ label: c, n: vals[i] }))), m = R.int(0, 3);
    const list = cats.map((c, i) => `${c} ${vals[i]}`).join(', ');
    if (m === 0) return choice(R, 'Which got the most votes?', cats[maxIdx(vals)], cats.filter((_, i) => i !== maxIdx(vals)), `Count each row: ${list}.`, { visual: vis });
    if (m === 1) return choice(R, 'Which got the fewest votes?', cats[minIdx(vals)], cats.filter((_, i) => i !== minIdx(vals)), `Count each row: ${list}.`, { visual: vis });
    if (m === 2) {
      const [i, j] = R.sample([...Array(k).keys()], 2), [a, b] = vals[i] >= vals[j] ? [i, j] : [j, i];
      return num(`How many more votes for ${cats[a]} than ${cats[b]}?`, vals[a] - vals[b], `${cap(cats[a])} has ${vals[a]} and ${cats[b]} has ${vals[b]}. ${vals[a]} − ${vals[b]} = ${vals[a] - vals[b]}.`, { visual: vis });
    }
    const tot = vals.reduce((a, b) => a + b, 0);
    return num('How many votes in all?', tot, `Add the rows: ${vals.join(' + ')} = ${tot}.`, { visual: vis });
  } },
} });

/* ================= I.7.14 Picture graphs ================= */
const pRows = (cats, vals) => cats.map((c, i) => ({ label: c, n: vals[i] }));
E1.skill({ id: 'I.7.14', name: 'Picture graphs', steps: {
  a: { t: 'read', g: (R, O) => {
    const { cats, vals } = dataset(R, R.pick([3, 4]), 1, 8), i = R.int(0, cats.length - 1), icon = R.pick(['face', 'star', 'circle', 'square']), color = R.pick(COLS);
    return num(`How many chose ${cats[i]}?`, vals[i], `Each picture is 1. Count the pictures in the ${cats[i]} row: ${vals[i]}.`,
      { visual: V.msr_picto(pRows(cats, vals), 1, { icon, color }) });
  } },
  b: { t: 'make', g: (R, O) => {
    const icon = R.pick(['face', 'star', 'circle', 'square']), color = R.pick(COLS), m = R.int(0, 2);
    if (m === 0) {
      const n = R.int(1, 8) * 2;
      return num(`Key: each picture = 2. How many pictures show ${n}?`, n / 2, `Count by 2s to ${n}: ${Array.from({ length: n / 2 }, (_, i) => (i + 1) * 2).join(', ')}. That is ${n / 2} picture${n === 2 ? '' : 's'}.`,
        { visual: V.svg(150, 40, `<rect x="2" y="4" width="146" height="32" rx="6" fill="${C.faint}"/>` + V.text(14, 20, 'Key:', { size: 14, anchor: 'start', fill: C.muted }) + iconFrag(icon, 68, 20, 20, color) + V.text(84, 20, '= 2', { size: 16, anchor: 'start', weight: 700 }), 'key') });
    }
    const { cats, vals } = dataset(R, 3, 1, 7, { distinct: true });
    const tally = V.msr_tallyChart(pRows(cats, vals));
    if (m === 1) {
      const i = R.int(0, 2);
      return num(`Make a picture graph (1 picture = 1). How many pictures for ${cats[i]}?`, vals[i], `The tally for ${cats[i]} is ${vals[i]}, so draw ${vals[i]} picture${vals[i] === 1 ? '' : 's'}.`, { visual: tally });
    }
    const g = v => V.msr_picto(pRows(cats, v), 1, { icon, color });
    return choice(R, 'Which picture graph matches the tally chart?', g(vals), wrongVals(R, vals).slice(0, 2).map(g),
      `Match each row: ${cats.map((c, i) => `${c} ${vals[i]}`).join(', ')}.`, { visual: tally });
  } },
  c: { t: 'compare categories', g: (R, O) => {
    const key = R.pick([1, 1, 2]), { cats, vals } = dataset(R, R.pick([3, 4]), 1, 7, { uniqueMax: true, uniqueMin: true, mult: key });
    const vis = V.msr_picto(pRows(cats, vals), key, { icon: R.pick(['face', 'star', 'circle', 'square']), color: R.pick(COLS) }), m = R.int(0, 2);
    const why = `Compare the rows: ${cats.map((c, i) => `${c} ${vals[i]}`).join(', ')}.`;
    if (m === 0) return choice(R, 'Which was chosen the most?', cats[maxIdx(vals)], cats.filter((_, i) => i !== maxIdx(vals)), why, { visual: vis });
    if (m === 1) return choice(R, 'Which was chosen the fewest times?', cats[minIdx(vals)], cats.filter((_, i) => i !== minIdx(vals)), why, { visual: vis });
    let i, j; do { [i, j] = R.sample([...Array(cats.length).keys()], 2); } while (vals[i] === vals[j]);
    const more = R.bool(), ans = (vals[i] > vals[j]) === more ? cats[i] : cats[j];
    return choice(R, `Which got ${more ? 'more' : 'fewer'}: ${cats[i]} or ${cats[j]}?`, ans, [ans === cats[i] ? cats[j] : cats[i]], why, { visual: vis });
  } },
  d: { t: 'how many more', g: (R, O) => {
    const key = R.pick([1, 2]), { cats, vals } = dataset(R, R.pick([3, 4]), 1, 8, { distinct: true, mult: key });
    const [i, j] = R.sample([...Array(cats.length).keys()], 2), [a, b] = vals[i] > vals[j] ? [i, j] : [j, i], more = R.bool();
    return num(more ? `How many more chose ${cats[a]} than ${cats[b]}?` : `How many fewer chose ${cats[b]} than ${cats[a]}?`, vals[a] - vals[b],
      `${key === 2 ? 'Each picture is 2. ' : ''}${cap(cats[a])} has ${vals[a]} and ${cats[b]} has ${vals[b]}. ${vals[a]} − ${vals[b]} = ${vals[a] - vals[b]}.`,
      { visual: V.msr_picto(pRows(cats, vals), key, { icon: R.pick(['face', 'star', 'circle', 'square']), color: R.pick(COLS) }) });
  } },
} });

/* ================= I.7.15 Bar graphs ================= */
E1.skill({ id: 'I.7.15', name: 'Bar graphs', steps: {
  a: { t: 'read', g: (R, O) => {
    const { cats, vals } = dataset(R, R.pick([3, 4]), 1, 10), i = R.int(0, cats.length - 1);
    return num(`How many chose ${cats[i]}?`, vals[i], `Go to the top of the ${cats[i]} bar and across to the scale: ${vals[i]}.`,
      { visual: V.msr_bargraph(cats, vals, { color: R.pick(COLS) }) });
  } },
  b: { t: 'make', g: (R, O) => {
    const { cats, vals } = dataset(R, 3, 1, 9, { distinct: true }), tally = V.msr_tallyChart(pRows(cats, vals));
    if (R.bool(0.4)) {
      const i = R.int(0, 2);
      return num(`Make a bar graph. How tall is the bar for ${cats[i]}?`, vals[i], `The tally for ${cats[i]} is ${vals[i]}, so the bar goes up to ${vals[i]}.`, { visual: tally });
    }
    const col = R.pick(COLS), g = v => V.msr_bargraph(cats, v, { color: col, step: 1 });
    const top = Math.max(...vals) + 1;
    const g2 = v => V.msr_bargraph(cats, v, { color: col, step: 1, headroom: Math.max(...v) < top });
    return choice(R, 'Which bar graph matches the tally chart?', g2(vals), wrongVals(R, vals).slice(0, 2).map(g2),
      `Each bar should reach its tally: ${cats.map((c, i) => `${c} ${vals[i]}`).join(', ')}.`, { visual: tally });
  } },
  c: { t: 'compare bars', g: (R, O) => {
    const { cats, vals } = dataset(R, R.pick([3, 4]), 1, 10, { uniqueMax: true, uniqueMin: true }), m = R.int(0, 2);
    const vis = V.msr_bargraph(cats, vals, { color: R.pick(COLS) }), why = `Read each bar: ${cats.map((c, i) => `${c} ${vals[i]}`).join(', ')}.`;
    if (m === 0) return choice(R, 'Which has the tallest bar?', cats[maxIdx(vals)], cats.filter((_, i) => i !== maxIdx(vals)), why, { visual: vis });
    if (m === 1) return choice(R, 'Which was chosen the fewest times?', cats[minIdx(vals)], cats.filter((_, i) => i !== minIdx(vals)), why, { visual: vis });
    let i, j; do { [i, j] = R.sample([...Array(cats.length).keys()], 2); } while (vals[i] === vals[j]);
    const [a, b] = vals[i] > vals[j] ? [i, j] : [j, i];
    return num(`How many more chose ${cats[a]} than ${cats[b]}?`, vals[a] - vals[b], `${vals[a]} − ${vals[b]} = ${vals[a] - vals[b]}.`, { visual: vis });
  } },
  d: { t: 'find the total', g: (R, O) => {
    const step = R.pick([1, 2]), { cats, vals } = dataset(R, R.pick([3, 4]), 1, step === 2 ? 8 : 9, { mult: step });
    const vis = V.msr_bargraph(cats, vals, { step, color: R.pick(COLS) });
    if (R.bool(0.35)) {
      const [i, j] = R.sample([...Array(cats.length).keys()], 2);
      return num(`How many chose ${cats[i]} or ${cats[j]}?`, vals[i] + vals[j], `${cap(cats[i])} is ${vals[i]} and ${cats[j]} is ${vals[j]}. ${vals[i]} + ${vals[j]} = ${vals[i] + vals[j]}.`, { visual: vis });
    }
    const tot = vals.reduce((a, b) => a + b, 0);
    return num('How many votes in all?', tot, `${step === 2 ? 'The scale counts by 2s. ' : ''}Add every bar: ${vals.join(' + ')} = ${tot}.`, { visual: vis });
  } },
} });

/* ================= I.7.16 Ask a question with data ================= */
E1.skill({ id: 'I.7.16', name: 'Ask a question with data', steps: {
  a: { t: 'pick a question', g: (R, O) => {
    if (R.bool(0.45)) {
      const t = R.pick(TOPICS);
      return choice(R, 'Which question could you ask your class to collect data?', t.ask, R.sample(ONE_ANSWER, 2),
        `"${t.ask}" gets different answers from different kids. The others have just one right answer.`);
    }
    const { t, cats, vals } = dataset(R, 3, 1, 8), others = TOPICS.filter(x => x !== t);
    const vis = R.bool() ? V.msr_bargraph(cats, vals, { color: R.pick(COLS) }) : V.msr_picto(pRows(cats, vals), 1, { icon: R.pick(['face', 'star']), color: R.pick(COLS) });
    return choice(R, 'Which question does this graph answer?', t.q, [R.pick(others).q, R.pick(ONE_ANSWER)],
      `The graph shows ${cats.join(', ')}, so it answers "${t.q}"`, { visual: vis });
  } },
  b: { t: 'sort answers into a tally', g: (R, O) => {
    const t = R.pick(TOPICS), k = R.pick([3, 3, 4]), cats = R.sample(t.cats, k), ns = R.distinct(2, k === 3 ? 8 : 6, k), data = R.shuffle(cats.flatMap((c, i) => Array(ns[i]).fill(c)));
    const per = 5, cw = 80, vis = V.svg(per * cw + 4, Math.ceil(data.length / per) * 30 + 4, data.map((c, i) => `<rect x="${4 + (i % per) * cw}" y="${4 + Math.floor(i / per) * 30}" width="${cw - 8}" height="24" rx="12" fill="${C.faint}" stroke="${C.line}"/>` + V.text(4 + (i % per) * cw + (cw - 8) / 2, 16 + Math.floor(i / per) * 30, c, { size: 14 })).join(''), 'answers');
    const chart = v => V.msr_tallyChart(pRows(cats, v));
    return choice(R, `You asked: "${t.ask}" Which tally matches the answers?`, chart(ns), wrongVals(R, ns).slice(0, 2).map(chart),
      `Make one mark for each answer: ${cats.map((c, i) => `${c} ${ns[i]}`).join(', ')}.`, { visual: vis });
  } },
  c: { t: 'which graph fits the question', g: (R, O) => {
    const ts = R.sample(TOPICS, 3), t = ts[0], col = R.pick(COLS), bar = R.bool(), icon = R.pick(['face', 'star', 'circle']), cs = ts.map(x => R.sample(x.cats, 3));
    if (R.bool(0.4)) {
      const lab = k => 'votes for ' + cs[k].join(', ');
      return choice(R, `You want to know: "${t.q}" Which data do you need?`, lab(0), [lab(1), lab(2)],
        `To answer "${t.q}" you need ${lab(0)}.`);
    }
    const g = k => { const vals = cs[k].map(() => R.int(1, 6)); return bar ? V.msr_bargraph(cs[k], vals, { color: col }) : V.msr_picto(pRows(cs[k], vals), 1, { icon, color: col }); };
    return choice(R, `Which graph answers: "${t.q}"`, g(0), [g(1), g(2)],
      `Read the labels. The graph about ${cs[0].join(', ')} answers "${t.q}"`);
  } },
  d: { t: 'say what it shows', g: (R, O) => {
    const { cats, vals } = dataset(R, R.pick([3, 4]), 1, 9, { uniqueMax: true, distinct: true });
    const vis = R.bool(0.7) ? V.msr_bargraph(cats, vals, { color: R.pick(COLS) }) : V.msr_picto(pRows(cats, vals), 1, { icon: R.pick(['face', 'star']), color: R.pick(COLS) });
    const hi = maxIdx(vals), lo = minIdx(vals), k = cats.length;
    const [i, j] = R.sample([...Array(k).keys()], 2), [a, b] = vals[i] > vals[j] ? [i, j] : [j, i];
    const c = R.int(0, k - 1), notHi = R.pick([...Array(k).keys()].filter(x => x !== hi));
    const trues = [`${cap(cats[hi])} got the most.`, `${cap(cats[a])} got more than ${cats[b]}.`, `${cap(cats[c])} got ${vals[c]}.`, `${cap(cats[lo])} got the fewest.`];
    const falses = [`${cap(cats[notHi])} got the most.`, `${cap(cats[b])} got more than ${cats[a]}.`, `${cap(cats[c])} got ${vals[c] + R.pick([1, 2])}.`];
    const ti = R.int(0, 3);
    return choice(R, 'Which sentence is true?', trues[ti], R.sample(falses, 2),
      `Read the graph: ${cats.map((x, n) => `${x} ${vals[n]}`).join(', ')}.`, { visual: vis });
  } },
} });
})();

