/* Era I · optional brave steps e (★ Brave) and f (★★ Legend) for selected skills.
   Loaded after s0–s2. Each call attaches e and f to an existing skill. */
(function () {
  const B = (id, e, f) => { const s = E1.byId[id]; if (!s) throw new Error('brave: no skill ' + id); if (s.steps.e) throw new Error('brave: duplicate ' + id); s.steps.e = e; s.steps.f = f; };
  const { num, choice, V, C } = E1;

  /* ---------- small helpers ---------- */
  const NM = ['Mia', 'Kai', 'Zoe', 'Ben', 'Ivy', 'Sam', 'Raj', 'Kim', 'Tom', 'Ava', 'Leo', 'Ann'];
  const rng = (a, b) => Array.from({ length: Math.max(0, b - a + 1) }, (_, i) => a + i);
  const ord = n => E1.ordinal(n);
  const nth = d => d + ((d % 100 >= 11 && d % 100 <= 13) ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' }[d % 10] || 'th'));
  const and = a => a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1];
  const pad2 = n => (n < 10 ? '0' : '') + n;
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const perms = a => a.length <= 1 ? [a.slice()] : a.flatMap((x, i) => perms(a.slice(0, i).concat(a.slice(i + 1))).map(p => [x, ...p]));
  const money = (O, n) => O.coins === 'THB' ? n + ' baht' : n + '¢';
  const LEN = O => O.units === 'imperial' ? 'in' : 'cm';
  const PAL = [C.red, C.blue, C.amber, C.teal, C.violet];
  const cname = c => E1.colorName[c];

  // a level seesaw balance with items on each side: 'circle' | 'square' | 'triangle' | 'cube'
  const SHC = { circle: C.red, square: C.blue, triangle: C.amber };
  const pan = (items, cx, base) => {
    const rows = []; let row = [], w = 0;
    items.forEach(k => { const iw = k === 'cube' ? 17 : 28; if (w + iw > 112 && row.length) { rows.push(row); row = []; w = 0; } row.push(k); w += iw; });
    if (row.length) rows.push(row);
    let b = '';
    rows.forEach((r, ri) => {
      const ws = r.map(k => k === 'cube' ? 17 : 28), tot = ws.reduce((x, y) => x + y, 0); let x = cx - tot / 2;
      const y = base - 14 - ri * 28;
      r.forEach((k, i) => { const m = x + ws[i] / 2;
        b += k === 'cube' ? `<rect x="${m - 7}" y="${y - 7}" width="14" height="14" rx="2" fill="#DCE9F7" stroke="${C.ink}" stroke-width="1.3"/>` : V.cnt_shape(k, m, y, 11, SHC[k]);
        x += ws[i]; });
    });
    return b;
  };
  const bal = (L, Rt) => {
    const W = 290, base = 112, H = 150;
    const b = pan(L, 75, base) + pan(Rt, 215, base) +
      `<line x1="12" y1="${base}" x2="${W - 12}" y2="${base}" stroke="${C.ink}" stroke-width="6" stroke-linecap="round"/>` +
      `<path d="M${W / 2} ${base + 3} L${W / 2 - 18} ${H - 4} H${W / 2 + 18} Z" fill="${C.muted}"/>`;
    return V.svg(W, H, b, 'balance: ' + L.join(' ') + ' | ' + Rt.join(' '));
  };

  // colored-circle pattern: seq of colors, then "…"
  const patVis = seq => V.svg(seq.length * 30 + 40, 34, seq.map((c, i) => V.dot(17 + i * 30, 17, 12, c)).join('') + V.text(seq.length * 30 + 18, 17, '…', { size: 22, weight: 700 }), 'pattern');

  /* ================= I.1 Counting ================= */
  B('I.1.11',
    { t: 'work backwards', g: R => {
      const k = R.int(2, 5), s = R.int(1, 14), end = s + k;
      if (R.bool()) return num(`You count on ${k} and land on ${end}. What number did you start on?`, s,
        `Count back ${k} from ${end}: ${rng(s, end - 1).reverse().join(', ')}. You started on ${s}.`, { visual: V.numline({ from: Math.max(0, s - 2), to: end + 2 }) });
      return num(`Start on ${s}. Count on until you land on ${end}. How many did you count on?`, k,
        `Count on from ${s}: ${rng(s + 1, end).join(', ')}. That is ${k} numbers.`);
    } },
    { t: 'will the frog land there?', g: R => {
      const j = R.int(2, 5), a = R.int(0, 4), m = R.int(3, 6), ans = a + j * m;
      const seq = new Set(rng(0, m + 3).map(i => a + i * j));
      const pool = rng(a + j + 1, ans + j + 3).filter(x => !seq.has(x));
      return choice(R, `A frog starts on ${a}. It jumps ${j} each time: ${a}, ${a + j}, ${a + 2 * j}, … Which number will it land on?`, ans, R.sample(pool, 3),
        `Keep jumping by ${j}: ${rng(0, m).map(i => a + i * j).join(', ')}. It lands on ${ans}.`);
    } });

  B('I.1.13',
    { t: 'and then…', g: R => {
      const n0 = R.int(9, 15), k = R.int(3, 4); let n = n0; const mv = [], path = [n0];
      for (let i = 0; i < k; i++) { const d = R.pick([1, 1, -1, -1, 2, -2]); mv.push(d); n += d; path.push(n); }
      const say = d => `${Math.abs(d)} ${d > 0 ? 'more' : 'less'}`;
      return num(`Start on ${n0}. Go ${mv.map(say).join(', then ')}. Where are you now?`, n, `${path.join(' → ')}. You end on ${n}.`);
    } },
    { t: 'number puzzle', g: R => {
      if (R.bool()) {
        const a = R.int(2, 14), S = 2 * a + 1, big = R.bool();
        return num(`Two numbers are next to each other when you count. They add up to ${S}. What is the ${big ? 'bigger' : 'smaller'} one?`, big ? a + 1 : a,
          `Half of ${S} is between ${a} and ${a + 1}, and ${a} + ${a + 1} = ${S}. The ${big ? 'bigger' : 'smaller'} one is ${big ? a + 1 : a}.`);
      }
      const [x, y, z] = R.sample(NM, 3), c = R.int(4, 12), d1 = R.pick([1, -1, 2, -2]), d2 = R.pick([1, -1, 2, -2]);
      const b = c + d2, a = b + d1, rel = d => `${Math.abs(d)} ${d > 0 ? 'more' : 'fewer'} than`;
      return num(`${z} has ${c} shells. ${y} has ${rel(d2)} ${z}. ${x} has ${rel(d1)} ${y}. How many shells does ${x} have?`, a,
        `${z} has ${c}, so ${y} has ${b}, so ${x} has ${a}.`);
    } });

  B('I.1.14',
    { t: 'work backwards', g: R => {
      if (R.bool()) {
        const s = R.int(60, 99), seq = rng(0, 4).map(i => s - 10 * i);
        const h = R.sample([1, 2, 3, 4], 2).sort((x, y) => x - y);
        const items = seq.map((v, i) => i === h[0] ? { tag: 'A' } : i === h[1] ? { tag: 'B' } : v);
        return num('Count back by 10s. Fill in A and B.', [{ label: 'A', ans: seq[h[0]] }, { label: 'B', ans: seq[h[1]] }],
          `Take away 10 each time: ${seq.join(', ')}.`, { visual: V.cnt_seq(items) });
      }
      const k = R.int(3, 5), end = R.int(10 * (k - 1) + 1, 99), start = end - 10 * (k - 1), who = R.pick(NM);
      return num(`${who} counts by 10s. The ${ord(k)} number ${who} says is ${end}. What number did ${who} start on?`, start,
        `Count back by 10s: ${rng(0, k - 1).map(i => end - 10 * i).join(', ')}. The start was ${start}.`);
    } },
    { t: 'count what you say', g: R => {
      if (R.bool()) {
        const a = R.int(1, 9), k = R.int(3, 9), b = a + 10 * k;
        return num(`Count by 10s from ${a} to ${b}. How many numbers do you say?`, k + 1,
          `${rng(0, k).map(i => a + 10 * i).join(', ')}: that is ${k + 1} numbers, not ${k}.`);
      }
      const d = R.int(1, 9), N = R.int(30, 99), hits = rng(1, N).filter(x => x % 10 === d);
      return num(`How many numbers from 1 to ${N} have ${d} in the ones place?`, hits.length, `${hits.join(', ')}: that is ${hits.length}.`);
    } });

  B('I.1.16',
    { t: 'spot the mistake', g: R => {
      const s = R.int(1, 20), seq = rng(0, 4).map(i => s + 2 * i), bad = R.int(1, 4), wrong = seq[bad] + R.pick([1, -1]);
      const shown = seq.slice(); shown[bad] = wrong;
      return choice(R, `Counting by 2s: ${shown.join(', ')}. Which number is wrong?`, wrong, R.sample(shown.filter((_, i) => i !== bad), 3),
        `Count by 2s from ${s}: ${seq.join(', ')}. ${wrong} should be ${seq[bad]}.`);
    } },
    { t: 'count them between', g: R => {
      const even = R.bool(); let a = R.int(1, 15); if ((a % 2 === 0) === even) a++;
      const b = a + 2 * R.int(3, 7), hits = rng(a + 1, b - 1).filter(x => (x % 2 === 0) === even);
      return num(`How many ${even ? 'even' : 'odd'} numbers are between ${a} and ${b}?`, hits.length, `${hits.join(', ')}: that is ${hits.length}.`);
    } });

  /* ================= I.2 Comparing and the number line ================= */
  B('I.2.05',
    { t: 'halfway between', g: R => {
      let a, b; do { a = R.int(0, 14); b = a + 2 * R.int(2, 6); } while (b > 20);
      const m = (a + b) / 2, d = b - a;
      return num(`Which number is exactly halfway between ${a} and ${b}?`, m,
        `From ${a} to ${b} is ${d} steps. Half of ${d} is ${d / 2}, and ${a} + ${d / 2} = ${m}.`, { visual: V.numline({ from: 0, to: 20, marks: [a, b] }) });
    } },
    { t: 'equal jumps', g: R => {
      const j = R.int(2, 5), k = R.int(2, 4), a = R.int(0, 20 - j * k), b = a + j * k, back = R.bool(0.3);
      const [p, q] = back ? [b, a] : [a, b], hops = rng(0, k).map(i => back ? b - i * j : a + i * j).join(', ');
      const vis = { visual: V.numline({ from: 0, to: 20, marks: [a, b] }) };
      if (R.bool()) return num(`A frog goes from ${p} to ${q} in ${k} equal jumps. How long is each jump?`, j,
        `From ${p} to ${q} is ${b - a}. ${k} jumps of ${j} fit: ${hops}.`, vis);
      return num(`A frog jumps ${j} each time. It goes from ${p} to ${q}. How many jumps?`, k, `${hops}: that is ${k} jumps.`, vis);
    } });

  B('I.2.07',
    { t: 'how many in front', g: R => {
      const n = R.int(5, 10), k = R.int(2, n - 1), who = R.pick(NM), behind = R.bool();
      return num(`${n} kids stand in a line. ${who} is ${ord(k)}. How many kids are ${behind ? 'behind' : 'in front of'} ${who}?`, behind ? n - k : k - 1,
        behind ? `${k} kids are up to and including ${who}. ${n} − ${k} = ${n - k} are behind.` : `${who} is ${ord(k)}, so ${k} − 1 = ${k - 1} kids are in front.`);
    } },
    { t: 'from the front and back', g: R => {
      if (R.bool()) {
        const p = R.int(2, 8), q = R.int(2, 8), who = R.pick(NM);
        return num(`${who} is ${ord(p)} from the front and ${ord(q)} from the back. How many kids are in the line?`, p + q - 1,
          `${p} + ${q} = ${p + q} counts ${who} twice. So there are ${p + q} − 1 = ${p + q - 1} kids.`);
      }
      const [x, y] = R.sample(NM, 2), p = R.int(1, 6), q = R.int(p + 2, 10), btw = q - p - 1;
      return num(`${x} is ${ord(p)} in line. ${y} is ${ord(q)}. How many kids stand between them?`, btw,
        btw === 1 ? `Only the ${ord(p + 1)} kid is between them: 1.` : `The ${ord(p + 1)} to the ${ord(q - 1)} are between: ${q} − ${p} − 1 = ${btw}.`);
    } });

  B('I.2.12',
    { t: 'work backwards', g: R => {
      const [x, y] = R.sample(NM, 2), d = R.int(2, 7), small = R.int(2, 12), big = small + d;
      if (R.bool()) return num(`${x} has ${d} more stickers than ${y}. ${x} has ${big}. How many does ${y} have?`, small, `${y} has ${d} fewer: ${big} − ${d} = ${small}.`);
      return num(`${y} has ${d} fewer stickers than ${x}. ${y} has ${small}. How many does ${x} have?`, big, `${x} has ${d} more: ${small} + ${d} = ${big}.`);
    } },
    { t: 'share to make them equal', g: R => {
      const [x, y] = R.sample(NM, 2), t = R.int(0, 2);
      if (t === 0) { const g = R.int(1, 5);
        return num(`${x} gives ${y} ${g} marble${g > 1 ? 's' : ''}. Now they have the same. How many more did ${x} have at first?`, 2 * g,
          `${x} lost ${g} and ${y} got ${g}, so the gap closed by ${g} + ${g} = ${2 * g}.`); }
      if (t === 1) { const g = R.int(1, 5), e = R.int(3, 10);
        return num(`${x} gives ${y} ${g} marble${g > 1 ? 's' : ''}. Now they each have ${e}. How many did ${x} have at first?`, e + g,
          `Undo it: ${x} gets the ${g} back. ${e} + ${g} = ${e + g}.`); }
      const s = R.int(2, 8), d = R.int(1, 6), T = 2 * s + d;
      return num(`${x} and ${y} have ${T} marbles in all. ${x} has ${d} more than ${y}. How many does ${x} have?`, s + d,
        `Take away the ${d} extra: ${T} − ${d} = ${2 * s}. Half is ${s}, so ${y} has ${s} and ${x} has ${s} + ${d} = ${s + d}.`);
    } });

  /* ================= I.3 Place value ================= */
  const tu = (a, b) => `${a} ${a === 1 ? 'ten' : 'tens'} ${b} ${b === 1 ? 'one' : 'ones'}`;
  B('I.3.05',
    { t: 'which one is different?', g: R => {
      const n = R.int(21, 59), t = Math.floor(n / 10), o = n % 10;
      const ways = [[t, o], [t - 1, o + 10], [t - 2, o + 20]];
      const w = R.pick([[t - 1, o], [t + 1, o], [t - 1, o + 1], [t - 2, o + 10]]);
      return choice(R, `Which one is NOT ${n}?`, tu(...w), ways.map(p => tu(...p)),
        `${tu(...w)} is ${10 * w[0] + w[1]}, not ${n}. The others all make ${n}.`);
    } },
    { t: 'count every way', g: R => {
      const n = R.int(12, 59), t = Math.floor(n / 10);
      if (t < 2 || R.bool(0.6)) return num(`You show ${n} with tens and ones blocks. You may use lots of ones. How many different ways are there?`, t + 1,
        `You can use ${rng(0, t).join(' or ')} tens, with ones for the rest. That is ${t + 1} ways.`);
      return num(`How many ways can you show ${n} with tens and ones blocks, using at least one ten?`, t,
        `You can use ${rng(1, t).join(' or ')} tens, with ones for the rest. That is ${t} ways.`);
    } });

  B('I.3.07',
    { t: 'mixed-up order', g: R => {
      const h = R.int(1, 9), t = R.bool(0.25) ? 0 : R.int(1, 9), o = R.bool(0.2) ? 0 : R.int(0, 9), v = 100 * h + 10 * t + o;
      const pw = (n, w) => `${n} ${n === 1 ? w : w + 's'}`, parts = R.shuffle([[h, 'hundred'], [t, 'ten'], [o, 'one']]).map(([n, w]) => pw(n, w));
      return num(`I have ${and(parts)}. What number am I?`, v, `Hundreds first: ${pw(h, 'hundred')}, ${pw(t, 'ten')} and ${pw(o, 'one')} is ${v}.`);
    } },
    { t: 'digit cards', g: R => {
      const ds = R.bool() ? [0, ...R.distinct(1, 9, 2)] : R.distinct(1, 9, 3);
      const all = perms(ds).filter(p => p[0] !== 0).map(p => 100 * p[0] + 10 * p[1] + p[2]);
      let kind = R.int(0, 2); const evens = all.filter(v => v % 2 === 0); if (kind === 2 && !evens.length) kind = 0;
      const ans = kind === 1 ? Math.min(...all) : Math.max(...(kind === 2 ? evens : all));
      const what = ['biggest 3-digit number', 'smallest 3-digit number', 'biggest even 3-digit number'][kind];
      const why = kind === 0 ? `Put the biggest digit first, then the next biggest: ${ans}.`
        : kind === 2 ? `The ones digit must be even. Keep the big digits in front: ${ans}.`
        : ds.includes(0) ? `0 can't go first. Start with the smallest other digit, then 0: ${ans}.` : `Put the smallest digit first, then the next smallest: ${ans}.`;
      return num(`Use the cards ${R.shuffle(ds).join(', ')} once each. Make the ${what}.`, ans, why);
    } });

  // "□" place-value comparison templates. B-type (box in the tens) only with ">" so 0 is never a question.
  const boxT = (R, three) => {
    const op = R.pick(['>', '<']), k = three ? R.int(0, 2) : R.int(0, 1);
    if (k === 0) { const t = R.int(1, 9), N = 10 * t + R.int(0, 9) + R.pick([0, 0, 0, 10, -10]);
      return { s: `${t}□`, fn: d => 10 * t + d, ds: rng(0, 9), op, N: Math.max(10, Math.min(99, N)) }; }
    if (k === 1) { const u = R.int(0, 9); return { s: `□${u}`, fn: d => 10 * d + u, ds: rng(1, 9), op: '>', N: R.int(20, 89) }; }
    const h = R.int(1, 9), u = R.int(0, 9); return { s: `${h}□${u}`, fn: d => 100 * h + 10 * d + u, ds: rng(0, 9), op, N: 100 * h + R.int(5, 95) };
  };
  const holds = (T, d) => T.op === '>' ? T.fn(d) > T.N : T.fn(d) < T.N;
  B('I.3.12',
    { t: 'missing digit', g: R => {
      let T, S, X, n = 0;
      do { T = boxT(R, false); S = T.ds.filter(d => holds(T, d)); X = T.ds.filter(d => !holds(T, d)); } while ((S.length < 1 || X.length < 3) && ++n < 200);
      if (S.length < 1 || X.length < 3) { T = { s: '5□', fn: d => 50 + d, ds: rng(0, 9), op: '>', N: 57 }; S = [8, 9]; X = rng(0, 7); }
      const ans = R.pick(S), wr = R.sample(X, 3);
      return choice(R, `Which digit can go in the box? ${T.s} ${T.op} ${T.N}`, String(ans), wr.map(String),
        `${T.fn(ans)} ${T.op} ${T.N} is true, but ${and(wr.map(d => String(T.fn(d))))} are not.`);
    } },
    { t: 'how many digits fit?', g: R => {
      let T, S, n = 0;
      do { T = boxT(R, true); S = T.ds.filter(d => holds(T, d)); } while ((S.length < 1 || S.length > 8) && ++n < 200);
      if (S.length < 1 || S.length > 8) { T = { s: '3□', fn: d => 30 + d, ds: rng(0, 9), op: '<', N: 36 }; S = rng(0, 5); }
      return num(`How many different digits can go in the box? ${T.s} ${T.op} ${T.N}`, S.length,
        `The box can be ${and(S.map(String))}: ${S.length === 1 ? 'just 1 digit' : `that is ${S.length} digits`}. ${S.length === T.ds.length ? '' : `For example ${T.fn(S[0])} ${T.op} ${T.N}.`}`.trim());
    } });

  /* ================= I.4 Addition and subtraction ================= */
  B('I.4.07',
    { t: 'three parts make 10', g: R => {
      const a = R.int(1, 6), b = R.int(1, 8 - a), parts = R.shuffle([a, b, 10 - a - b]), pos = R.int(0, 2), ans = parts[pos];
      const sh = parts.map((x, i) => i === pos ? '?' : x).join(' + ');
      return num(R.bool() ? `${sh} = 10` : `10 = ${sh}`, ans, `The other two make ${10 - ans}, and ${10 - ans} + ${ans} = 10.`);
    } },
    { t: 'count every way', g: R => {
      const n = R.int(4, 10), t = R.int(0, 2), h = Math.floor(n / 2);
      if (t === 0) return num(`Put ${n} apples in a red basket and a blue basket. A basket may be empty. How many ways are there?`, n + 1,
        `The red basket can hold 0, 1, 2, … up to ${n} apples. That is ${n + 1} ways.`);
      if (t === 1) return num(`Put ${n} apples in a red basket and a blue basket. Each basket gets at least 1. How many ways are there?`, n - 1,
        `The red basket can hold 1, 2, … up to ${n - 1} apples. That is ${n - 1} ways.`);
      const w = rng(h + 1, n);
      return num(`Put ${n} apples in a red basket and a blue basket. The red basket gets more. How many ways are there?`, w.length,
        `Red can have ${and(w.map(String))}. That is ${w.length} way${w.length > 1 ? 's' : ''}.`);
    } });

  B('I.4.08',
    { t: 'work backwards', g: R => {
      const n = R.int(2, 10), t = R.int(0, 2);
      if (t === 0) return num(`Double my number is ${2 * n}. What is my number?`, n, `${n} + ${n} = ${2 * n}, so my number is ${n}.`);
      if (t === 1) return num(`I double my number, then add 1. I get ${2 * n + 1}. What is my number?`, n, `Undo it: ${2 * n + 1} − 1 = ${2 * n}, and ${n} + ${n} = ${2 * n}.`);
      return num(`I double my number, then take away 2. I get ${2 * n - 2}. What is my number?`, n, `Undo it: ${2 * n - 2} + 2 = ${2 * n}, and ${n} + ${n} = ${2 * n}.`);
    } },
    { t: 'same, then more', g: R => {
      const [x, y] = R.sample(NM, 2), n = R.int(2, 9), k = R.int(1, Math.min(5, n - 1)), gain = R.bool(), T = gain ? 2 * n + k : 2 * n - k, askY = R.bool();
      const undo = gain ? `Take away the ${k} extra: ${T} − ${k} = ${2 * n}.` : `Put back the ${k}: ${T} + ${k} = ${2 * n}.`;
      const a = askY ? n : (gain ? n + k : n - k);
      return num(`${x} and ${y} have the same number of cards. Then ${x} ${gain ? 'gets' : 'loses'} ${k}${gain ? ' more' : ''}. Now they have ${T} in all. How many does ${askY ? y : x} have now?`, a,
        `${undo} Half of ${2 * n} is ${n}, so ${y} has ${n}${askY ? '.' : ` and ${x} has ${n} ${gain ? '+' : '−'} ${k} = ${a}.`}`);
    } });

  B('I.4.16',
    { t: 'which one is not in the family?', g: R => {
      let a, b; do { a = R.int(2, 9); b = R.int(2, 9); } while (a === b);
      const c = a + b, good = [`${a} + ${b} = ${c}`, `${b} + ${a} = ${c}`, `${c} − ${a} = ${b}`, `${c} − ${b} = ${a}`];
      const hi = Math.max(a, b), lo = Math.min(a, b), bads = [`${hi} − ${lo} = ${hi - lo}`, `${hi} + ${hi - lo} = ${2 * hi - lo}`];
      if (c + lo <= 20) bads.push(`${c} + ${lo} = ${c + lo}`);
      const bad = R.pick(bads.filter(q => q.match(/\d+/g).some(x => ![a, b, c].includes(+x))));
      return choice(R, `Which is NOT in the fact family of ${a}, ${b} and ${c}?`, bad, R.sample(good, 3),
        `The family is ${a} + ${b} = ${c}, ${b} + ${a} = ${c}, ${c} − ${a} = ${b} and ${c} − ${b} = ${a}. ${bad} is true, but it uses ${bad.match(/\d+/g).find(x => ![a, b, c].includes(+x))}.`);
    } },
    { t: 'the missing member', g: R => {
      let a, b; do { a = R.int(2, 12); b = R.int(1, 9); } while (a === b || a + b > 20 || Math.max(a, b) === 2 * Math.min(a, b));
      const hi = Math.max(a, b), lo = Math.min(a, b), big = R.bool(), ans = big ? a + b : hi - lo;
      return num(`A fact family uses ${a}, ${b} and one more number. What is the ${big ? 'biggest' : 'smallest'} that number could be?`, ans,
        `It could be ${a + b} (${lo} + ${hi} = ${a + b}) or ${hi - lo} (${lo} + ${hi - lo} = ${hi}). The ${big ? 'biggest' : 'smallest'} is ${ans}.`);
    } });

  B('I.4.18',
    { t: 'missing on both sides', g: R => {
      const S = R.int(8, 18); let l1, r1; do { l1 = R.int(2, S - 2); r1 = R.int(1, S - 1); } while (r1 === l1 || r1 === S - l1);
      const L = [l1, S - l1], Rt = [r1, S - r1], side = R.int(0, 1), pos = R.int(0, 1), arr = [L.slice(), Rt.slice()], ans = arr[side][pos];
      arr[side][pos] = '?';
      const str = s => s.join(' + '), other = side === 0 ? Rt : L, known = arr[side][1 - pos];
      return num(`Make it balance: ${str(arr[0])} = ${str(arr[1])}`, ans,
        `${str(other)} = ${S}. So ${known} + ? = ${S}, and ? = ${S} − ${known} = ${ans}.`);
    } },
    { t: 'shape balance puzzle', g: R => {
      const [P, Q] = R.sample(['circle', 'square', 'triangle'], 2), t = R.int(0, 3), cubes = k => Array(k).fill('cube');
      let v1, v2, ans, ask, why;
      if (t === 0) { const n = 2 * R.int(2, 6); v1 = bal([P, P], [Q]); v2 = bal([Q], cubes(n)); ans = n / 2; ask = P;
        why = `One ${Q} is ${n} cubes, so two ${P}s are ${n} cubes. Half of ${n} is ${n / 2}.`; }
      else if (t === 1) { const k = R.int(1, 4), m = R.int(2, 6); v1 = bal([Q], [P, ...cubes(k)]); v2 = bal([P], cubes(m)); ans = m + k; ask = Q;
        why = `A ${P} is ${m} cubes, so a ${Q} is ${m} + ${k} = ${m + k} cubes.`; }
      else if (t === 2) { const m = R.int(2, 5); v1 = bal([Q], [P, P]); v2 = bal([P], cubes(m)); ans = 2 * m; ask = Q;
        why = `A ${P} is ${m} cubes, so a ${Q} is ${m} + ${m} = ${2 * m} cubes.`; }
      else { const k = R.int(2, 6); const s = bal([P, P], [P, ...cubes(k)]); ans = k; ask = P;
        return num(`The scale is balanced. How many cubes weigh the same as one ${P}?`, ans,
          `Take one ${P} off each side. It still balances: one ${P} = ${k} cubes.`, { visual: s }); }
      return num(`Both scales are balanced. How many cubes weigh the same as one ${ask}?`, ans, why, { visual: V.stack([v1, v2], { gap: 10 }) });
    } });

  B('I.4.22',
    { t: 'missing digit', g: R => {
      const a = R.int(11, 69), b = R.int(11, 98 - a), s = a + b, which = R.int(0, 3);
      const A = String(a).split(''), Bd = String(b).split(''), d = which < 2 ? +A[which] : +Bd[which - 2];
      if (which < 2) A[which] = '□'; else Bd[which - 2] = '□';
      const full = which < 2 ? a : b, other = which < 2 ? b : a;
      return num(`What digit goes in the box? ${A.join('')} + ${Bd.join('')} = ${s}`, d, `${s} − ${other} = ${full}, so the missing digit is ${d}.`);
    } },
    { t: 'digit cards: best sum', g: R => {
      const ds = R.distinct(1, 9, 4), big = R.bool(); let best = null, bx, by;
      perms(ds).forEach(p => { const x = 10 * p[0] + p[1], y = 10 * p[2] + p[3], s = x + y; if (best === null || (big ? s > best : s < best)) { best = s; bx = Math.max(x, y); by = Math.min(x, y); } });
      return num(`Use ${ds.join(', ')} once each to make two 2-digit numbers. What is the ${big ? 'biggest' : 'smallest'} sum you can get?`, best,
        `Put the two ${big ? 'biggest' : 'smallest'} digits in the tens place: ${bx} + ${by} = ${best}.`);
    } });

  B('I.4.23',
    { t: 'work backwards', g: R => {
      const b = R.int(11, 49), c = R.int(11, 49), a = b + c, t = R.int(0, 2), who = R.pick(NM);
      if (t === 0) return num(`? − ${b} = ${c}`, a, `Add back what was taken: ${c} + ${b} = ${a}.`);
      if (t === 1) return num(`${a} − ? = ${c}`, b, `${a} − ${c} = ${b}. Check: ${a} − ${b} = ${c}.`);
      return num(`${who} had some stickers and gave away ${b}. Now ${who} has ${c}. How many were there at first?`, a, `Add back the ${b}: ${c} + ${b} = ${a}.`);
    } },
    { t: 'digit cards: difference', g: R => {
      const ds = R.distinct(1, 9, 4), big = R.bool(); let best = null, bx, by;
      perms(ds).forEach(p => { const x = 10 * p[0] + p[1], y = 10 * p[2] + p[3]; if (x <= y) return; const d = x - y; if (best === null || (big ? d > best : d < best)) { best = d; bx = x; by = y; } });
      return num(`Use ${ds.join(', ')} once each to make two 2-digit numbers. What is the ${big ? 'biggest' : 'smallest'} difference you can get?`, best,
        big ? `Make the biggest and the smallest numbers: ${bx} − ${by} = ${best}.` : `Use tens digits close together, big ones digit below, small ones digit on top: ${bx} − ${by} = ${best}.`);
    } });

  /* ================= I.5 Patterns and logic ================= */
  const UNITS2 = ['AB', 'ABB', 'AAB', 'ABC'], UNITSF = ['ABC', 'ABB', 'AAB', 'ABBC', 'ABCD', 'AABC'];
  const mkPat = (R, units) => { const u = R.pick(units), cols = R.sample(PAL, 4), unit = u.split('').map(ch => cols[ch.charCodeAt(0) - 65]); return unit; };
  B('I.5.02',
    { t: 'count in the pattern', g: R => {
      const unit = mkPat(R, UNITS2), L = unit.length, X = R.pick([...new Set(unit)]), per = unit.filter(c => c === X).length;
      const reps = R.int(2, 4), r = R.int(1, L - 1), N = reps * L + r, first = rng(0, N - 1).map(i => unit[i % L]), ans = first.filter(c => c === X).length;
      const extra = unit.slice(0, r).filter(c => c === X).length;
      return num(`The pattern ${unit.map(cname).join(', ')} repeats. How many ${cname(X)} dots are in the first ${N}?`, ans,
        `Each group of ${L} has ${per} ${cname(X)}. ${reps} groups have ${reps * per}, and the last ${r} dot${r > 1 ? 's' : ''} add${r > 1 ? '' : 's'} ${extra}. That is ${ans}.`, { visual: patVis(unit.concat(unit)) });
    } },
    { t: 'far ahead', g: R => {
      const unit = mkPat(R, UNITSF), L = unit.length, N = R.int(10, 20), ans = unit[(N - 1) % L], ends = rng(1, Math.floor(N / L)).map(k => k * L);
      const cs = [...new Set(unit)].map(cname), pos = (N - 1) % L + 1;
      return choice(R, `The pattern ${unit.map(cname).join(', ')} keeps going. What color is the ${nth(N)} dot?`, cname(ans), cs.filter(c => c !== cname(ans)),
        `The pattern starts again after every ${L}. ${ends.length ? `A group ends at ${ends.join(', ')}. ` : ''}The ${nth(N)} is number ${pos} in its group: ${cname(ans)}.`, { visual: patVis(unit.concat(unit)) });
    } });

  B('I.5.05',
    { t: 'two missing numbers', g: R => {
      const step = R.int(2, 5), down = R.bool(0.65), start = down ? R.int(4 * step + 1, 40) : R.int(0, 20), seq = rng(0, 4).map(i => down ? start - i * step : start + i * step);
      let h; do { h = R.sample([0, 1, 2, 3, 4], 2).sort((x, y) => x - y); } while (![0, 1, 2, 3].some(i => !h.includes(i) && !h.includes(i + 1)));
      const items = seq.map((v, i) => i === h[0] ? { tag: 'A' } : i === h[1] ? { tag: 'B' } : v);
      return num(`Find the rule. Fill in A and B: ${items.map(v => typeof v === 'object' ? v.tag : v).join(', ')}`, [{ label: 'A', ans: seq[h[0]] }, { label: 'B', ans: seq[h[1]] }],
        `The numbers go ${down ? 'down' : 'up'} by ${step}: ${seq.join(', ')}.`, { visual: V.cnt_seq(items) });
    } },
    { t: 'the hidden rule', g: R => {
      const t = R.int(0, 4); let s, why;
      if (t === 0) { let a, b; do { a = R.int(1, 3); b = R.int(1, 3); } while (a === b); let v = R.int(1, 5); s = [v]; for (let i = 0; i < 6; i++) { v += i % 2 ? b : a; s.push(v); } why = `It goes + ${a}, + ${b}, + ${a}, + ${b}, …`; }
      else if (t === 1) { let v = R.int(1, 10); s = [v]; for (let i = 1; i <= 5; i++) { v += i; s.push(v); } why = 'It goes + 1, + 2, + 3, + 4, + 5: add one more each time.'; }
      else if (t === 2) { let v = R.int(1, 3); s = [v]; for (let i = 0; i < 4; i++) { v *= 2; s.push(v); } why = 'Each number is double the one before.'; }
      else if (t === 3) { const a = R.int(1, 6); s = [a, a + 1, a + 2, a + 1, a + 2, a + 3, a + 2, a + 3, a + 4]; why = `It counts 3 in a row, then starts 1 higher: ${a + 2}, ${a + 3}, ${a + 4}.`; }
      else { const up = R.int(2, 4), dn = 1; let v = R.int(1, 6); s = [v]; for (let i = 0; i < 6; i++) { v += i % 2 ? -dn : up; s.push(v); } why = `It goes + ${up}, then − 1, again and again.`; }
      const ans = s[s.length - 1], shown = s.slice(0, -1);
      return num(`What comes next? ${shown.join(', ')}, ?`, ans, `${why} Next is ${ans}.`, { visual: V.shp_numrow([...shown, null]) });
    } });

  // race puzzles: unique order from clues (checked over every order)
  const race = (R, n, maxC) => {
    const who = R.sample(NM, n), all = perms(who);
    for (let tries = 0; tries < 300; tries++) {
      const order = R.shuffle(who), P = (o, x) => o.indexOf(x), pool = [];
      who.forEach(x => who.forEach(y => { if (x === y) return;
        if (P(order, x) < P(order, y)) pool.push({ s: `${x} finished before ${y}.`, f: o => P(o, x) < P(o, y), w: 3 });
        if (P(order, x) === P(order, y) + 1) pool.push({ s: `${x} finished right after ${y}.`, f: o => P(o, x) === P(o, y) + 1, w: 3 }); }));
      who.forEach(x => { const p = P(order, x);
        if (p !== n - 1) pool.push({ s: `${x} was not last.`, f: o => P(o, x) !== n - 1, w: 2 });
        if (p !== 0) pool.push({ s: `${x} was not first.`, f: o => P(o, x) !== 0, w: 2 });
        if (p === n - 1) pool.push({ s: `${x} was last.`, f: o => P(o, x) === n - 1, w: 1 }); });
      const bag = R.shuffle(pool.flatMap(c => Array(c.w).fill(c))), clues = [];
      let left = all;
      for (const c of bag) { if (clues.includes(c)) continue; const nl = left.filter(c.f); if (nl.length === left.length) continue; clues.push(c); left = nl; if (left.length === 1 || clues.length >= maxC) break; }
      if (left.length === 1) return { order, clues: R.shuffle(clues).map(c => c.s) };
    }
    const order = R.shuffle(who); return { order, clues: order.slice(1).map((x, i) => `${x} finished right after ${order[i]}.`) };
  };
  B('I.5.14',
    { t: 'use a "not" clue', g: R => {
      let r, n = 0; do r = race(R, 3, 2); while (!r.clues.some(c => /not/.test(c)) && ++n < 60);
      const k = R.int(0, 2), ans = r.order[k];
      return choice(R, `3 kids ran a race. ${r.clues.join(' ')} Who was ${ord(k + 1)}?`, ans, r.order.filter(x => x !== ans),
        `The order is ${r.order.join(', ')}. So ${ans} was ${ord(k + 1)}.`);
    } },
    { t: 'four in a race', g: R => {
      const r = race(R, 4, 3), k = R.int(0, 3), ans = r.order[k];
      return choice(R, `4 kids ran a race. ${r.clues.join(' ')} Who was ${ord(k + 1)}?`, ans, r.order.filter(x => x !== ans),
        `Only one order fits every clue: ${r.order.join(', ')}. So ${ans} was ${ord(k + 1)}.`);
    } });

  const dsum = v => Math.floor(v / 10) + v % 10;
  B('I.5.15',
    { t: 'three clues', g: R => {
      for (let tries = 0; tries < 200; tries++) {
        const x = R.int(12, 60), a = Math.max(1, x - R.int(2, 6)), b = x + R.int(2, 6);
        const btw = { s: `It is between ${a} and ${b}.`, f: v => v > a && v < b };
        const pool = [{ s: `It is ${x % 2 ? 'odd' : 'even'}.`, f: v => v % 2 === x % 2 }, { s: `Its digits add up to ${dsum(x)}.`, f: v => v >= 10 && dsum(v) === dsum(x) }];
        if (Math.floor(x / 10) !== x % 10) { const big = Math.floor(x / 10) > x % 10; pool.push({ s: `Its tens digit is ${big ? 'bigger' : 'smaller'} than its ones digit.`, f: v => v >= 10 && (big ? Math.floor(v / 10) > v % 10 : Math.floor(v / 10) < v % 10) }); }
        const two = R.sample(pool, 2), cl = [btw, ...two], left = rng(1, 99).filter(v => cl.every(c => c.f(v)));
        if (left.length === 1 && rng(1, 99).filter(v => btw.f(v) && two[0].f(v)).length > 1 && rng(1, 99).filter(v => btw.f(v) && two[1].f(v)).length > 1)
          return num(`I am a number. ${cl.map(c => c.s).join(' ')} What number am I?`, x,
            `Between ${a} and ${b} are ${rng(a + 1, b - 1).join(', ')}. Only ${x} fits every clue.`);
      }
      return num('I am a number. It is between 20 and 30. It is odd. Its digits add up to 7. What number am I?', 25, 'Between 20 and 30, the digits add to 7 only for 25, and 25 is odd.');
    } },
    { t: 'digit riddle', g: R => {
      const t = R.int(0, 2);
      if (t === 2) { const o = R.int(1, 4), x = 20 * o + o;
        return num(`I am a 2-digit number. My tens digit is double my ones digit. My digits add up to ${3 * o}. What number am I?`, x,
          `Tens is double ones, so the digits are 2 parts and 1 part: ${3 * o} = ${2 * o} + ${o}. I am ${x}.`); }
      let T, O; do { T = R.int(1, 9); O = R.int(0, 9); } while (T === O || T + O > 15 || (t === 1 && O <= T) || (t === 0 && T <= O));
      const s = T + O, k = Math.abs(T - O), x = 10 * T + O;
      const c2 = t === 0 ? `My tens digit is ${k} more than my ones digit.` : `My ones digit is ${k} more than my tens digit.`;
      return num(`I am a 2-digit number. My digits add up to ${s}. ${c2} What number am I?`, x,
        `Try digit pairs that add to ${s}: ${T} and ${O} are ${k} apart the right way. I am ${x}.`);
    } });

  /* ================= I.6 Shapes ================= */
  const SIDES = { triangle: 3, square: 4, hexagon: 6 };
  const shapesVis = list => V.svg(list.length * 62 + 4, 64, list.map((k, i) => V.shp_draw(k, 33 + i * 62, 32, 26, { fill: { triangle: C.amber, square: C.blue, hexagon: C.teal }[k] })).join(''), 'shapes');
  B('I.6.02',
    { t: 'sides in all', g: R => {
      if (R.bool()) {
        const a = R.int(1, 3), b = R.int(1, 3), what = R.pick(['sides', 'corners']), list = [...Array(a).fill('triangle'), ...Array(b).fill('square')];
        return num(`${a} triangle${a > 1 ? 's' : ''} and ${b} square${b > 1 ? 's' : ''}. How many ${what} in all?`, 3 * a + 4 * b,
          `${list.map(k => SIDES[k]).join(' + ')} = ${3 * a + 4 * b}.`, { visual: shapesVis(list) });
      }
      const b = R.int(1, 4), what = R.pick(['sides', 'corners']), tot = 3 + 4 * b;
      return num(`A triangle and some squares have ${tot} ${what} in all. How many squares are there?`, b,
        `The triangle has 3. ${tot} − 3 = ${4 * b}, and ${Array(b).fill(4).join(' + ')} = ${4 * b}. So ${b} square${b > 1 ? 's' : ''}.`);
    } },
    { t: 'shapes and sides puzzle', g: R => {
      const [p, q] = R.pick([['triangle', 'square'], ['triangle', 'hexagon'], ['square', 'hexagon']]), sp = SIDES[p], sq = SIDES[q];
      const n = R.int(3, 6), k = R.int(1, n - 1), tot = sp * (n - k) + sq * k;
      return num(`There are ${n} shapes. Some are ${p}s and some are ${q}s. They have ${tot} sides in all. How many ${q}s are there?`, k,
        `If all ${n} were ${p}s: ${n * sp} sides. There are ${tot - n * sp} more, and each ${q} adds ${sq - sp}. So ${k} ${q}${k > 1 ? 's' : ''}.`);
    } });

  const stripVis = (n, vert, col) => { const c = 46, W = vert ? c + 4 : n * c + 4, H = vert ? n * c + 4 : c + 4;
    let b = `<rect x="2" y="2" width="${W - 4}" height="${H - 4}" fill="${col}" fill-opacity="0.25" stroke="${C.ink}" stroke-width="2.5"/>`;
    for (let i = 1; i < n; i++) b += vert ? `<line x1="2" y1="${2 + i * c}" x2="${W - 2}" y2="${2 + i * c}" stroke="${C.ink}" stroke-width="2.5"/>` : `<line x1="${2 + i * c}" y1="2" x2="${2 + i * c}" y2="${H - 2}" stroke="${C.ink}" stroke-width="2.5"/>`;
    return V.svg(W, H, b, 'rectangle cut into strips'); };
  const triVis = (k, cross, col) => { const ax = 130, ay = 10, by = 170;
    let b = `<polygon points="${ax},${ay} 250,${by} 10,${by}" fill="${col}" fill-opacity="0.25" stroke="${C.ink}" stroke-width="2.5" stroke-linejoin="round"/>`;
    for (let i = 1; i <= k; i++) { const x = Math.round(10 + 240 * i / (k + 1)); b += `<line x1="${ax}" y1="${ay}" x2="${x}" y2="${by}" stroke="${C.ink}" stroke-width="2.5"/>`; }
    if (cross) b += `<line x1="62.5" y1="100" x2="197.5" y2="100" stroke="${C.ink}" stroke-width="2.5"/>`;
    return V.svg(260, 180, b, 'triangle with lines'); };
  B('I.6.07',
    { t: 'count every rectangle', g: R => {
      const n = R.int(3, 5), vert = R.bool(), col = R.pick(PAL), T = n * (n + 1) / 2;
      const parts = rng(1, n).map(s => `${n - s + 1}`);
      return num(R.pick(['How many rectangles can you find? Count big ones too.', 'Count every rectangle, big and small.', 'How many rectangles are in the picture, big and small?']), T,
        `${n} small, ${n - 1} made of 2, … and 1 big one: ${parts.join(' + ')} = ${T}.`, { visual: stripVis(n, vert, col) });
    } },
    { t: 'count every triangle', g: R => {
      const cross = R.bool(0.35), k = cross ? R.int(1, 2) : R.int(1, 3), T = (k + 1) * (k + 2) / 2, col = R.pick(PAL), ans = cross ? 2 * T : T;
      const row = rng(1, k + 1).reverse().join(' + ');
      return num(R.bool() ? 'How many triangles can you find? Count big ones too.' : 'Count every triangle, big and small.', ans,
        cross ? `Triangles on the bottom line: ${row} = ${T}. Triangles on the middle line: ${T} more. ${T} + ${T} = ${ans}.`
          : `Along the bottom: ${k + 1} small, ${k} made of 2, …, 1 big: ${row} = ${T}.`, { visual: triVis(k, cross, col) });
    } });

  const hS = d => d > 0 ? `→ ${d}` : `← ${-d}`, vS = d => d > 0 ? `↑ ${d}` : `↓ ${-d}`;
  B('I.6.10',
    { t: 'the way back', g: R => {
      let dx, dy; do { dx = R.int(1, 5) * R.pick([1, -1]); dy = R.int(1, 4) * R.pick([1, -1]); } while (Math.abs(dx) === Math.abs(dy));
      const w = (x, y) => `${hS(x)}, then ${vS(y)}`, sx = Math.sign(dx), sy = Math.sign(dy);
      return choice(R, `The robot went ${w(dx, dy)} to reach the star. Which way takes it back to the start?`, w(-dx, -dy),
        [w(dx, dy), w(-dx, dy), w(dx, -dy), w(-sx * Math.abs(dy), -sy * Math.abs(dx))],
        `Undo each move: ${hS(dx)} is undone by ${hS(-dx)}, and ${vS(dy)} by ${vS(-dy)}.`);
    } },
    { t: 'where does it end up?', g: R => {
      const askX = R.bool(), a = R.int(1, 4), c = R.int(0, 3), bL = R.int(1, a + c - 1), u = R.int(1, 3);
      const hm = [a, -bL]; if (c) hm.push(c);
      const vm = R.bool() ? [u, -u] : [-u, u];
      const H = askX ? hm : vm.map(x => x), Vv = askX ? vm : hm;   // when asking "up", swap roles
      const moves = R.shuffle([...H.map(hS), ...Vv.map(vS)]), net = a + c - bL;
      const pos = hm.filter(x => x > 0).reduce((x, y) => x + y, 0);
      return num(`The robot goes ${moves.join(', ')}. How many squares ${askX ? 'right' : 'up'} of the start is it now?`, net,
        askX ? `Right ${pos}, left ${bL}: ${pos} − ${bL} = ${net}. Up ${u} and down ${u} cancel.` : `Up ${pos}, down ${bL}: ${pos} − ${bL} = ${net}. Right ${u} and left ${u} cancel.`);
    } });

  B('I.6.12',
    { t: 'quarters backwards', g: R => {
      const q = R.int(1, 5), t = R.int(0, 2), th = R.pick(['cookies', 'apples', 'beads', 'stickers', 'grapes']);
      if (t === 0) return num(`A quarter of the ${th} is ${q}. How many ${th} are there in all?`, 4 * q, `4 quarters make the whole: ${q} + ${q} + ${q} + ${q} = ${4 * q}.`);
      if (t === 1) return num(`What is 3 quarters of ${4 * q} ${th}?`, 3 * q, `A quarter of ${4 * q} is ${q}. 3 quarters is ${q} + ${q} + ${q} = ${3 * q}.`);
      return num(`A quarter of the ${th} is ${q}. How many is half of the ${th}?`, 2 * q, `Half is 2 quarters: ${q} + ${q} = ${2 * q}.`);
    } },
    { t: 'half, then half again', g: R => {
      const who = R.pick(NM), t = R.int(0, 2);
      if (t === 0) { const r = R.int(2, 5);
        return num(`${who} ate half of the grapes. Then ${who} ate half of what was left. ${r} are left. How many were there at first?`, 4 * r,
          `Work backwards: ${r} was half, so before that ${2 * r}. ${2 * r} was half, so at first ${4 * r}.`); }
      if (t === 1) { const r = R.int(1, 6), k = R.int(1, 4);
        return num(`${who} gave away half of the stickers, then ${k} more. ${who} has ${r} left. How many were there at first?`, 2 * (r + k),
          `Work backwards: ${r} + ${k} = ${r + k} was half, so at first ${r + k} + ${r + k} = ${2 * (r + k)}.`); }
      const g = R.int(1, 5);
      return num(`Half of a class are girls. Half of the girls wear glasses. ${g} girls wear glasses. How many kids are in the class?`, 4 * g,
        `${g} is half of the girls, so there are ${2 * g} girls. They are half the class: ${2 * g} + ${2 * g} = ${4 * g}.`);
    } });

  /* ================= I.7 Measurement, money and time ================= */
  B('I.7.04',
    { t: 'work backwards', g: (R, O) => {
      const u = LEN(O);
      if (R.bool()) { const a = R.int(2, 12), b = R.int(2, 9);
        return num(`A ribbon was cut into 2 pieces. One piece is ${a} ${u}. The ribbon was ${a + b} ${u} long. How long is the other piece?`, b,
          `${a + b} − ${a} = ${b}, so the other piece is ${b} ${u}.`); }
      const [x, y] = R.sample(NM, 2), d = R.int(2, 7), s = R.int(2, 12);
      return num(`${x}'s rope is ${d} ${u} longer than ${y}'s. ${x}'s rope is ${s + d} ${u}. How long is ${y}'s rope?`, s,
        `${y}'s is ${d} ${u} shorter: ${s + d} − ${d} = ${s}.`);
    } },
    { t: 'measure with two sticks', g: (R, O) => {
      const u = LEN(O), a = R.int(1, 4), b = R.bool(0.35) ? 2 * a : R.int(a + 1, 9), set = new Set([a, b, a + b, b - a]);
      return num(`You have two sticks, ${a} ${u} and ${b} ${u} long, but no ruler. How many different lengths can you measure?`, set.size,
        `${a}, ${b}, end to end ${a + b}, and the difference ${b} − ${a} = ${b - a}.${b - a === a ? ` But ${b - a} is the same as the short stick.` : ''} That is ${set.size} lengths.`);
    } });

  const tm = (h, m) => `${h}:${pad2(m)}`;
  B('I.7.09',
    { t: 'how long?', g: R => {
      const h = R.int(1, 10), m1 = 5 * R.int(0, 10), dur = 5 * R.int(3, 11), e = m1 + dur, h2 = e >= 60 ? h + 1 : h, m2 = e % 60;
      return num(`A show starts at ${tm(h, m1)} and ends at ${tm(h2, m2)}. How many minutes long is it?`, dur,
        e >= 60 && m2 > 0 ? `${tm(h, m1)} to ${h + 1}:00 is ${60 - m1} minutes. Then ${m2} more: ${60 - m1} + ${m2} = ${dur}.` : `Count by 5s from ${tm(h, m1)} to ${tm(h2, m2)}: ${dur} minutes.`);
    } },
    { t: 'the fast clock', g: R => {
      const off = R.pick([5, 10, 15, 20]), fast = R.bool(), h = R.int(1, 10), m = 5 * R.int(0, 11), T = h * 60 + m;
      const f = x => { const y = ((x % 720) + 720) % 720; return tm(Math.floor(y / 60) || 12, y % 60); };
      const real = fast ? T - off : T + off;
      return choice(R, `A clock is ${off} minutes ${fast ? 'fast' : 'slow'}. It shows ${f(T)}. What is the real time?`, f(real), [f(fast ? T + off : T - off), f(T), f(real + (fast ? -5 : 5))],
        fast ? `Fast means it is ahead, so take ${off} minutes away: ${f(real)}.` : `Slow means it is behind, so add ${off} minutes: ${f(real)}.`);
    } });

  B('I.7.10',
    { t: 'and then…', g: R => {
      const d = R.int(0, 6), t = R.int(0, 2), k = R.int(2, 5);
      const opts = ans => R.sample(DAYS.filter(x => x !== ans), 3);
      if (t === 0) { const ans = DAYS[(d + k) % 7];
        return choice(R, `Today is ${DAYS[d]}. What day is it ${k} days from now?`, ans, opts(ans), `Count on ${k}: ${rng(1, k).map(i => DAYS[(d + i) % 7]).join(', ')}.`); }
      if (t === 1) { const ans = DAYS[(d + 2) % 7];
        return choice(R, `Yesterday was ${DAYS[d]}. What day is tomorrow?`, ans, opts(ans), `Yesterday ${DAYS[d]}, today ${DAYS[(d + 1) % 7]}, tomorrow ${ans}.`); }
      const ans = DAYS[(d + k) % 7];
      return choice(R, `${k} days ago it was ${DAYS[d]}. What day is it today?`, ans, opts(ans), `Count on ${k} from ${DAYS[d]}: ${rng(1, k).map(i => DAYS[(d + i) % 7]).join(', ')}.`);
    } },
    { t: 'same day each week', g: R => {
      const d0 = R.int(1, 9), wd = R.int(0, 6); let tg; do tg = d0 + R.int(5, 21); while (tg > 30);
      const base = d0 + 7 * Math.floor((tg - d0) / 7), off = tg - base, ans = DAYS[(wd + tg - d0) % 7];
      const list = rng(0, (base - d0) / 7).map(i => d0 + 7 * i).join(', ');
      return choice(R, `The ${nth(d0)} of a month is a ${DAYS[wd]}. What day of the week is the ${nth(tg)}?`, ans, R.sample(DAYS.filter(x => x !== ans), 3),
        `Every 7 days it is ${DAYS[wd]} again: ${list}.${off ? ` The ${nth(tg)} is ${off} day${off > 1 ? 's' : ''} after the ${nth(base)}: ${ans}.` : ` So the ${nth(tg)} is a ${ans}.`}`);
    } });

  const fmtWay = (O, w) => w.map(([v, c]) => c === 1 ? money(O, v) : `${c} × ${money(O, v)}`).join(' + ');
  const waysOf = (N, coins) => { const out = []; const go = (i, left, acc) => { if (i === coins.length - 1) { if (left % coins[i] === 0) out.push([...acc, [coins[i], left / coins[i]]].filter(x => x[1])); return; } for (let c = Math.floor(left / coins[i]); c >= 0; c--) go(i + 1, left - c * coins[i], [...acc, [coins[i], c]]); }; go(0, N, []); return out; };
  B('I.7.12',
    { t: 'fewest coins', g: (R, O) => {
      const us = O.coins !== 'THB', coins = us ? [25, 10, 5, 1] : [10, 5, 2, 1], amt = us ? R.int(6, 60) : R.int(6, 30);
      let left = amt; const used = []; coins.forEach(c => { while (left >= c) { used.push(c); left -= c; } });
      return num(`What is the fewest coins you need to make ${money(O, amt)}?`, used.length,
        `Use the biggest coin you can each time: ${used.map(v => money(O, v)).join(' + ')}. That is ${used.length} coins.`);
    } },
    { t: 'count every way', g: (R, O) => {
      const us = O.coins !== 'THB', sets = us ? [[10, 5, 1], [5, 1], [10, 5]] : [[5, 2, 1], [2, 1], [5, 1]];
      let coins, N, W, n = 0;
      do { coins = R.pick(sets); N = us ? R.int(5, 25) : R.int(3, 12); W = waysOf(N, coins); } while ((W.length < 3 || W.length > 6) && ++n < 200);
      if (W.length < 3 || W.length > 6) { coins = us ? [10, 5, 1] : [5, 2, 1]; N = us ? 10 : 5; W = waysOf(N, coins); }
      const cl = coins.slice().reverse().map(v => money(O, v));
      return num(`How many ways can you make ${money(O, N)} with ${and(cl)} coins?`, W.length,
        `${W.map(w => fmtWay(O, w)).join('; ')}. That is ${W.length} ways.`);
    } });
})();
