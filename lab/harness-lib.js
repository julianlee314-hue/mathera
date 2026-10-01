// Mathera · Eras I–III correctness harness (plan item 1.1)
// Usage: node harness.js [seedsPerCombo] [defaultSeeds]
const fs = require('fs'), vm = require('vm');
for (const f of ['s0.js', 's1.js', 's2.js', 'b1.js', 'b2.js', 'b3.js']) vm.runInThisContext(fs.readFileSync(f, 'utf8'), { filename: f });
const ENG = { I: E1, II: E2, III: E3 };
const eraOf = id => id.split('.')[0];
const CHECK = id => (ENG[eraOf(id)].check || E2.check);
const SHOW = id => (ENG[eraOf(id)].show || E2.show);

const COMBOS = [];
for (const coins of ['US', 'THB']) for (const units of ['metric', 'imperial']) for (const clock of ['12h', '24h']) COMBOS.push({ coins, units, clock });

/* ---------- text helpers ---------- */
const ENT = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&nbsp;': ' ', '&times;': '×', '&divide;': '÷', '&minus;': '−' };
function plain(html) {
  let s = String(html);
  s = s.replace(/<svg[\s\S]*?<\/svg>/g, ' [pic] ');
  s = s.replace(/<(var|span) style="[^"]*overline[^"]*">([^<]*)<\/(var|span)>/g, '‾($2)');
  for (let k = 0; k < 4; k++) s = s.replace(/<span class="fr"><sup>([\s\S]*?)<\/sup>⁄<sub>([\s\S]*?)<\/sub><\/span>/g, (_, a, b) => { const A = a.replace(/<[^>]+>/g, ''), B = b.replace(/<[^>]+>/g, ''); return (/[^\w.]/.test(A.trim()) ? `(${A})` : A) + '/' + (/[^\w.]/.test(B.trim()) ? `(${B})` : B); });
  s = s.replace(/<sup>([^<]*)<\/sup>/g, '^$1');
  s = s.replace(/<[^>]+>/g, '');
  s = s.replace(/&[a-z#0-9]+;/g, e => ENT[e] || e);
  return s.replace(/\s+/g, ' ').trim();
}
const typed = s => String(s).split(' = ')[0].replace(/−/g, '-').replace(/·/g, '*');

/* ---------- exact rationals ---------- */
const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };
const Q = (n, d = 1) => { if (d < 0) { n = -n; d = -d; } const g = gcd(n, d); return { n: n / g, d: d / g }; };
const add = (a, b) => Q(a.n * b.d + b.n * a.d, a.d * b.d), sub = (a, b) => Q(a.n * b.d - b.n * a.d, a.d * b.d);
const mul = (a, b) => Q(a.n * b.n, a.d * b.d), div = (a, b) => (b.n === 0 ? null : Q(a.n * b.d, a.d * b.n));
const eq = (a, b) => a && b && a.n * b.d === b.n * a.d;
const cmp = (a, b) => Math.sign(a.n * b.d - b.n * a.d);
const val = q => q.n / q.d;
function numQ(tok) { // "1,200" "2.5" "3/4" "1 3/4" "−3" → Q or null
  let s = tok.trim().replace(/[−–]/g, '-').replace(/,(?=\d{3}\b)/g, ''); let neg = false;
  if (s[0] === '-') { neg = true; s = s.slice(1).trim(); }
  let m, r = null;
  if ((m = /^(\d+)$/.exec(s))) r = Q(+m[1]);
  else if ((m = /^(\d*)\.(\d+)$/.exec(s))) r = Q(+((m[1] || '0') + m[2]), 10 ** m[2].length);
  else if ((m = /^(\d+)\/(\d+)$/.exec(s))) r = +m[2] ? Q(+m[1], +m[2]) : null;
  else if ((m = /^(\d+) (\d+)\/(\d+)$/.exec(s))) r = +m[3] ? Q(+m[1] * +m[3] + +m[2], +m[3]) : null;
  if (r && neg) r = Q(-r.n, r.d);
  return r;
}
function fieldQ(f) { return f.frac ? Q(f.frac[0], f.frac[1]) : (f.ans !== undefined ? Q(Math.round(f.ans * 1000), 1000) : null); }
function choiceValue(c) { // numeric value of a choice, or null. Money/percent tagged.
  const s = plain(c);
  let m;
  if ((m = /^(−?-?)\$?\s?(\d[\d,]*(?:\.\d+)?)$/.exec(s))) return { v: numQ(m[1] + m[2]), tag: s.includes('$') ? 'money' : 'num' };
  if ((m = /^(−?-?\d[\d,]*(?:\.\d+)?|−?-?\d+ \d+\/\d+|−?-?\d+\/\d+)$/.exec(s))) return { v: numQ(m[1]), tag: 'num' };
  if ((m = /^(−?-?\d[\d,]*(?:\.\d+)?)\s?%$/.exec(s))) { const q = numQ(m[1]); return q && { v: Q(q.n, q.d * 100), tag: 'pct' }; }
  if ((m = /^(\d+)¢$/.exec(s))) return { v: Q(+m[1], 100), tag: 'money' };
  if ((m = /^฿\s?(\d[\d,]*(?:\.\d+)?)$/.exec(s))) return { v: numQ(m[1]), tag: 'baht' };
  return null;
}

/* ---------- independent solver ---------- */
// arithmetic expression over rationals: + − × ÷ * / · ( ) ^ and unary minus
function evalExpr(src) {
  const s = src.replace(/[−–]/g, '-').replace(/[×·⋅]/g, '*').replace(/÷/g, '/').replace(/,(?=\d{3}\b)/g, '').replace(/\s+/g, '');
  if (!/^[0-9.+\-*/()^]+$/.test(s) || !/\d/.test(s)) return null;
  let i = 0;
  const E = () => { let a = T(); while (a && (s[i] === '+' || s[i] === '-')) { const o = s[i++]; const b = T(); if (!b) return null; a = o === '+' ? add(a, b) : sub(a, b); } return a; };
  const T = () => { let a = U(); while (a && (s[i] === '*' || s[i] === '/')) { const o = s[i++]; const b = U(); if (!b) return null; a = o === '*' ? mul(a, b) : div(a, b); } return a; };
  const U = () => { if (s[i] === '-') { i++; const u = U(); return u && Q(-u.n, u.d); } return P(); };
  const P = () => { const b = A(); if (!b) return null; if (s[i] === '^') { i++; const e = U(); if (!e || e.d !== 1 || e.n < 0 || e.n > 12) return null; let r = Q(1); for (let k = 0; k < e.n; k++) r = mul(r, b); return r; } return b; };
  const A = () => {
    if (s[i] === '(') { i++; const v = E(); if (s[i] !== ')') return null; i++; return v; }
    const m = /^(\d+\.?\d*|\.\d+)/.exec(s.slice(i)); if (!m) return null; i += m[0].length;
    const [a, b] = m[0].split('.'); return b ? Q(+(a + b), 10 ** b.length) : Q(+a);
  };
  const v = E(); return v && i === s.length ? v : null;
}
const NUMTOK = String.raw`[−-]?\d[\d,]*(?:\.\d+)?(?: \d+/\d+)?(?:/\d+)?`;
const PLACES = { one: 1, ones: 1, ten: 10, hundred: 100, thousand: 1000, 'ten thousand': 1e4, 'hundred thousand': 1e5, million: 1e6, 'whole number': 1, tenth: 0.1, hundredth: 0.01, thousandth: 0.001 };
function solverText(html) {
  let s = String(html).replace(/(\d+)\s*<span class="fr"><sup>([^<]*)<\/sup>⁄<sub>([^<]*)<\/sub><\/span>/g, '($1+$2/$3)')
    .replace(/<span class="fr"><sup>([^<]*)<\/sup>⁄<sub>([^<]*)<\/sub><\/span>/g, '($1/$2)');
  return plain(s).replace(/\s*\[pic\]\s*/g, ' ').trim();
}
function solve(q) {
  const p = solverText(q.prompt);
  // 1) bare arithmetic: "What is 34 + 58?"  "12 × 7 = ?"
  if (q.kind === 'num' && q.fields.length === 1 && q.fields[0].expr === undefined) {
    const sentences = p.split(/(?<=[.?!])\s+(?=[A-Z0-9(])/); const last = sentences[sentences.length - 1].replace(/^(?:So|Then|Now)\s*,?\s*/, '');
    const cand = [p, last].map(t => { const parts = t.split('='); return parts.length > 2 && /^\s*(\?|_+|□|▢)?\s*[?.]?\s*$/.test(parts[parts.length - 1]) ? parts[parts.length - 2] + '= ?' : t; });
    let m = null; for (const t of cand) { m = /^(?:What is|Work out|Calculate|Find|Compute|Evaluate|Simplify|Add|Subtract|Multiply|Divide)?\s*:?\s*([−\-\d.,()+×÷*/·^ ]+?)\s*(?:=\s*(?:\?|_+|□|▢|☐)?)?\s*[?.]?$/.exec(t); if (m) break; }
    if (m && /[+×÷*/·^]|\d\s*[−-]\s*\d/.test(m[1].replace(/^\s*[−-]/, ''))) { const v = evalExpr(m[1]); if (v) return { kind: 'expr', want: v, how: m[1] }; }
    // 2) missing number: "a op ? = c", "? op b = c", "a op b = ?"
    m = /^(?:.*?[:.]\s)?([−\-\d.,/]+|\?|□|▢|_+)\s*([+−\-×÷*/])\s*([−\-\d.,/]+|\?|□|▢|_+)\s*=\s*([−\-\d.,/]+|\?|□|▢|_+)\s*\.?$/.exec(p);
    if (m) {
      const isQ = t => /^(\?|□|▢|_+)$/.test(t); const [a, op, b, c] = [m[1], m[2], m[3], m[4]];
      if ([a, b, c].filter(isQ).length === 1) {
        const A = isQ(a) ? null : numQ(a), B = isQ(b) ? null : numQ(b), Cc = isQ(c) ? null : numQ(c);
        const o = op.replace('−', '-').replace('×', '*').replace('÷', '/');
        const f = { '+': add, '-': sub, '*': mul, '/': div }[o];
        let w = null;
        if (isQ(c) && A && B) w = f(A, B);
        else if (isQ(a) && B && Cc) w = { '+': () => sub(Cc, B), '-': () => add(Cc, B), '*': () => div(Cc, B), '/': () => mul(Cc, B) }[o]();
        else if (isQ(b) && A && Cc) w = { '+': () => sub(Cc, A), '-': () => sub(A, Cc), '*': () => div(Cc, A), '/': () => div(A, Cc) }[o]();
        if (w) return { kind: 'missing', want: w, how: m[0] };
      }
    }
    // 3) rounding
    m = /^Round (\S+) to the nearest (ten thousand|hundred thousand|whole number|million|thousand|hundred|ten|one|tenth|hundredth|thousandth|[\d,]+)\b/i.exec(p);
    if (m) { const x = numQ(m[1].replace(/[.,]$/, '')); const u = PLACES[m[2].toLowerCase()] || +m[2].replace(/,/g, ''); if (x && u) { const k = Math.floor(val(x) / u + 0.5 + 1e-9); return { kind: 'round', want: Q(Math.round(k * u * 1000), 1000), how: m[0] }; } }
    // 3b) write a fraction as a decimal / mixed number / improper fraction / percent
    m = /^Write (\(\d+\/\d+\)|\(\d+\+\d+\/\d+\)|[\d.]+%?) as an? (decimal|mixed number|improper fraction|fraction|percent|whole number)/i.exec(p);
    if (m) { let x = m[1].endsWith('%') ? (q => q && Q(q.n, q.d * 100))(numQ(m[1].slice(0, -1))) : evalExpr(m[1]); if (x) { if (/percent/i.test(m[2])) x = mul(x, Q(100)); return { kind: 'convert', want: x, how: m[0] }; } }
    // 3c) place value: value of the digit d in N
    m = /value of the (?:digit )?(\d) in ([\d,]+(?:\.\d+)?)/.exec(p);
    if (m) { const N = m[2].replace(/,/g, ''), [ip, fp = ''] = N.split('.'); const hits = [];
      [...ip].forEach((c, k) => { if (c === m[1]) hits.push(Q(+c * 10 ** (ip.length - 1 - k))); }); [...fp].forEach((c, k) => { if (c === m[1]) hits.push(Q(+c, 10 ** (k + 1))); });
      if (hits.length === 1) return { kind: 'placevalue', want: hits[0], how: m[0] }; }
    // 4) percent of
    m = new RegExp(`(?:What is|Find|Work out)\\s+(${NUMTOK})\\s?% of (${NUMTOK})`).exec(p);
    if (m) { const a = numQ(m[1]), b = numQ(m[2]); if (a && b) return { kind: 'pctof', want: mul(Q(a.n, a.d * 100), b), how: m[0] }; }
    // 5) gcf / lcm of two or three numbers
    m = /^(?:What is|Find) the (greatest common factor|GCF|highest common factor|HCF|least common multiple|LCM)\s+of\s+(\d+)(?:,\s*(\d+))?\s*,?\s*and\s+(\d+)/i.exec(p);
    if (m) { const ns = [m[2], m[3], m[4]].filter(Boolean).map(Number); const lc = /least|LCM/i.test(m[1]);
      const r = ns.reduce((x, y) => lc ? x / gcd(x, y) * y : gcd(x, y)); return { kind: lc ? 'lcm' : 'gcf', want: Q(r), how: m[0] }; }
  }
  // 6a) multiple choice on a bare expression: "34 + 58 = ?" with numeric choices
  if (q.kind === 'choice') {
    const m = /^(?:What is|Work out|Calculate|Find|Evaluate)?\s*:?\s*([−\-\d.,()+×÷*/·^ ]+?)\s*(?:=\s*(?:\?|_+|□|▢)?)?\s*[?.]?$/.exec(p);
    if (m && /[+×÷*/·^]|\d\s*[−-]\s*\d/.test(m[1].replace(/^\s*[−-]/, ''))) {
      const v = evalExpr(m[1]), vs = q.choices.map(choiceValue);
      if (v && vs.every(x => x && x.v)) { const hits = vs.map((x, k) => eq(x.v, v) ? k : -1).filter(k => k >= 0); if (hits.length === 1) return { kind: 'exprchoice', wantIndex: hits[0], how: m[1] }; if (hits.length === 0) return { kind: 'exprchoice-none', wantIndex: -1, how: m[1] }; }
    }
  }
  // 6b) true / false on an equation or inequality between two expressions
  if (q.kind === 'choice' && q.choices.length === 2 && plain(q.choices[0]) === 'True' && plain(q.choices[1]) === 'False') {
    const body = p.replace(/^(?:True or false|Is this true)\s*[:?]\s*/i, '').replace(/[?.]$/, '');
    const m = /^([−\-\d.,()+×÷*/·^ ]+?)\s*(=|≠|<|>|≤|≥)\s*([−\-\d.,()+×÷*/·^ ]+)$/.exec(body);
    if (m) { const a = numQ(m[1]) || evalExpr(m[1]), b = numQ(m[3]) || evalExpr(m[3]);
      if (a && b) { const c = cmp(a, b); const t = { '=': c === 0, '≠': c !== 0, '<': c < 0, '>': c > 0, '≤': c <= 0, '≥': c >= 0 }[m[2]]; return { kind: 'truefalse', wantIndex: t ? 0 : 1, how: body }; } }
  }
  // 6c) rounding with numeric choices
  if (q.kind === 'choice') { const m = /^Round (\S+) to the nearest (ten thousand|hundred thousand|whole number|million|thousand|hundred|ten|one|tenth|hundredth|thousandth|[\d,]+)\b/i.exec(p);
    if (m) { const x = numQ(m[1].replace(/[.,]$/, '')); const u = PLACES[m[2].toLowerCase()] || +m[2].replace(/,/g, ''); const vs = q.choices.map(choiceValue);
      if (x && u && vs.every(v => v && v.v)) { const w = Q(Math.round(Math.floor(val(x) / u + 0.5 + 1e-9) * u * 1000), 1000); const k = vs.findIndex(v => eq(v.v, w)); return { kind: 'roundchoice', wantIndex: k, how: m[0] }; } } }
  // 6) compare two numbers with < = >
  if (q.kind === 'choice' && q.choices.length === 3 && ['<', '=', '>'].every(c => q.choices.map(plain).includes(c))) {
    const body = p.replace(/^[^:?]*[:?]\s*/, '');
    const parts = body.split(/\s*(?:\?|□|▢|☐|_+|○|◯)\s*/).filter(x => x.trim());
    if (parts.length === 2) { const a = numQ(parts[0]) || evalExpr(parts[0]), b = numQ(parts[1]) || evalExpr(parts[1]);
      if (a && b) { const r = ['<', '=', '>'][cmp(a, b) + 1]; return { kind: 'compare', wantChoice: r, how: body }; } }
  }
  // 7) greatest / smallest among numeric choices
  if (q.kind === 'choice' && /\b(greatest|largest|biggest|smallest|least)\b/i.test(p) && !/common|factor|multiple|place|digit|value of the/i.test(p)) {
    const vs = q.choices.map(choiceValue);
    if (vs.every(x => x && x.v) && new Set(vs.map(x => x.tag)).size === 1) {
      const big = /greatest|largest|biggest/i.test(p);
      let best = 0; vs.forEach((x, k) => { if (cmp(x.v, vs[best].v) * (big ? 1 : -1) > 0) best = k; });
      const ties = vs.filter(x => eq(x.v, vs[best].v)).length;
      if (ties === 1) return { kind: big ? 'max' : 'min', wantIndex: best, how: p };
    }
  }
  return null;
}

// substitute the app's answer back into "Solve <equation>" and check both sides match
function substCheck(q) {
  if (q.kind !== 'num') return null;
  const p = solverText(q.prompt);
  const m = /\bSolve\s*:?\s*(.+?)(?:\.\s|\.$|\s+Give\b|\s+for\b|\s+to\b|$)/.exec(p); if (!m) return null;
  const eqn = m[1].replace(/²/g, '^2').replace(/³/g, '^3'); if ((eqn.match(/=/g) || []).length !== 1 || /[<>≤≥]/.test(eqn)) return null;
  const env = {}; let used = 0;
  const letters = [...new Set((eqn.match(/(?<![A-Za-z])[A-Za-z](?![A-Za-z])/g) || []))];
  for (const f of q.fields) { let lm = /^(?:positive |negative |smaller |larger |first |second )?([A-Za-z])\s*=$/.exec(plain(f.label || '')); if (!f.label && q.fields.length === 1 && letters.length === 1) lm = [0, letters[0]]; if (!lm || f.expr !== undefined) return null; const v = fieldQ(f); if (!v) return null; (env[lm[1]] = env[lm[1]] || []).push(v); used++; }
  const vars = Object.keys(env); if (vars.length !== 1) return null; const x = vars[0];
  if (!new RegExp(`(^|[^A-Za-z])${x}([^A-Za-z]|$)`).test(eqn)) return null;
  const out = [];
  for (const v of env[x]) {
    const lit = `(${v.n}/${v.d})`;
    let e = eqn.replace(new RegExp(`(?<![A-Za-z])${x}(?![A-Za-z])`, 'g'), lit).replace(/(\d|\))\s*\(/g, '$1*(').replace(/\)\s*(\d)/g, ')*$1');
    const [L, R] = e.split('='); const a = evalExpr(L), b = evalExpr(R); if (!a || !b) return null;
    out.push({ ok: eq(a, b), how: `${eqn} with ${x} = ${v.n}/${v.d}: ${a.n}/${a.d} vs ${b.n}/${b.d}` });
  }
  return out;
}


module.exports={ENG,eraOf,CHECK,SHOW,COMBOS,plain,typed,Q,add,sub,mul,div,eq,cmp,val,numQ,fieldQ,choiceValue,evalExpr,solverText,solve,substCheck};
