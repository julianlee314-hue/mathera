/* Era III · optional brave steps e (★ Brave) and f (★★ Legend) for selected skills.
   Loaded after s0–s2. Each call attaches e and f to an existing skill. */
(function () {
  const B = (id, e, f) => { const s = E3.byId[id]; if (!s) throw new Error('brave: no skill ' + id); if (s.steps.e) throw new Error('brave: duplicate ' + id); s.steps.e = e; s.steps.f = f; };
  const { num, choice, fmt, frac, fh, gcd } = E3;
  const lcm = (a, b) => a / gcd(a, b) * b;
  /* ---------- local helpers ---------- */
  const N = v => fmt(v);                                   // −3, 1,200
  const P = v => v < 0 ? `(${fmt(v)})` : fmt(v);            // (−3) after an operator
  const sg = v => v < 0 ? `− ${fmt(-v)}` : `+ ${fmt(v)}`;   // "x + 3" / "x − 3"
  const nz = (R, lo, hi) => { let v; do v = R.int(lo, hi); while (v === 0); return v; };
  const I = s => `<i>${s}</i>`;
  const sup = (b, e) => `${b}<sup>${e}</sup>`;
  const ol = s => `<span style="text-decoration:overline">${s}</span>`;
  const FR = (n, d) => { if (d < 0) { n = -n; d = -d; } const g = gcd(n, d); n /= g; d /= g; return d === 1 ? fmt(n) : (n < 0 ? '−' : '') + fh(Math.abs(n), d); };
  // linear combination: lin([[2,'x'],[-1,'y'],[3,'']]) → 2x − y + 3
  const lin = pairs => pairs.filter(([c]) => c !== 0).map(([c, v], i) => { const a = Math.abs(c), body = (a === 1 && v ? '' : String(a)) + (v ? I(v) : ''); return i === 0 ? (c < 0 ? '−' : '') + body : (c < 0 ? ' − ' : ' + ') + body; }).join('') || '0';
  const money = (v, O) => { const s = Number.isInteger(v) ? fmt(v) : fmt(v, { dp: 2 }); return O.coins === 'THB' ? `${s} baht` : `$${s}`; };
  const K = O => O.coins === 'THB' ? 10 : 1;
  const U = O => O.units === 'imperial'
    ? { s: 'in', b: 'ft', far: 'miles', sp: 'mph', vol: 'gal', kg: 'lb' }
    : { s: 'cm', b: 'm', far: 'km', sp: 'km/h', vol: 'L', kg: 'kg' };
  const LT = '&lt;', opS = o => o === '<' ? LT : o === '>' ? '&gt;' : o;
  const th = n => n + (n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] || 'th');
  const NAMES = [['Ana', 'Ben'], ['Mia', 'Raj'], ['Kim', 'Leo'], ['Zoe', 'Sam'], ['Ivy', 'Tom'], ['Noor', 'Eli']];
  const coprime = (R, lo, hi) => { for (let t = 0; t < 200; t++) { const a = R.int(lo, hi), b = R.int(lo, hi); if (a !== b && gcd(a, b) === 1) return [a, b]; } return [2, 3]; };
  const pickOK = (R, make, ok, fb) => { for (let t = 0; t < 400; t++) { const v = make(); if (ok(v)) return v; } return fb; };

  /* =================== III.1 Integers and rationals =================== */
  B('III.1.03',
    { t: 'solve |x − a| = b', g: R => {
      const a = nz(R, -9, 9), k = R.int(0, 2), ab = `|${I('x')} ${sg(-a)}|`;
      if (k === 0) { const b = R.int(1, 12);
        return num(`Find both numbers ${I('x')} with ${ab} = ${b}.`, [{ label: 'smaller x =', ans: a - b }, { label: 'larger x =', ans: a + b }],
          `${ab} is the distance from ${I('x')} to ${N(a)}. Go ${b} each way: ${N(a)} − ${b} = ${N(a - b)} and ${N(a)} + ${b} = ${N(a + b)}.`); }
      const b = R.int(2, 9), strict = k === 1, cnt = strict ? 2 * b - 1 : 2 * b + 1, lo = a - b + (strict ? 1 : 0), hi = a + b - (strict ? 1 : 0);
      return num(`How many integers ${I('x')} make ${ab} ${strict ? LT : '≤'} ${b} true?`, cnt,
        `${I('x')} must be ${strict ? 'less than' : 'at most'} ${b} away from ${N(a)}: the integers ${N(lo)} to ${N(hi)}. That is ${cnt} integers.`); } },
    { t: 'distances on a line', g: R => {
      const k = R.int(0, 2);
      if (k === 0) { const [a, b, c] = R.distinct(-12, 15, 3).sort((x, y) => x - y);
        const ex = [a, b, c].map(v => `|${I('x')} ${sg(-v)}|`).join(' + ');
        return num(`What is the smallest possible value of ${ex}?`, c - a,
          `Each term is a distance from ${I('x')}. Put ${I('x')} at the middle point, ${N(b)}: ${b - a} + 0 + ${c - b} = ${c - a}. Moving away from ${N(b)} only adds distance.`); }
      if (k === 1) { const [a, b] = R.distinct(-10, 12, 2).sort((x, y) => x - y);
        return num(`How many integers ${I('x')} satisfy |${I('x')} ${sg(-a)}| + |${I('x')} ${sg(-b)}| = ${b - a}?`, b - a + 1,
          `The left side is the distance from ${I('x')} to ${N(a)} plus the distance to ${N(b)}. It equals ${b - a} exactly when ${I('x')} is between them: ${N(a)} to ${N(b)}, so ${b - a + 1} integers.`); }
      const [a, b, c, d] = R.distinct(-12, 15, 4).sort((x, y) => x - y);
      const ex = [a, b, c, d].map(v => `|${I('x')} ${sg(-v)}|`).join(' + ');
      return num(`What is the smallest possible value of ${ex}?`, d - a + c - b,
        `Pair the outside points and the inside points. For any ${I('x')} from ${N(b)} to ${N(c)}, the total is (${N(d)} − ${P(a)}) + (${N(c)} − ${P(b)}) = ${d - a} + ${c - b} = ${d - a + c - b}.`); } });

  B('III.1.04',
    { t: 'find the missing number', g: R => {
      if (R.bool(0.3)) { const a = nz(R, -30, 30), x = nz(R, -30, 30), S = a - x;
        return num(`${N(a)} − □ = ${N(S)}. What is □?`, x, `Subtracting □ took ${N(a)} to ${N(S)}, so □ = ${N(a)} − ${P(S)} = ${N(x)}.`); }
      const t = [nz(R, -30, 30), nz(R, -30, 30), nz(R, -30, 30)], p = R.int(0, 2), S = t[0] + t[1] + t[2], known = S - t[p];
      const shown = t.map((v, i) => i === p ? '□' : (i ? P(v) : N(v))).join(' + ');
      return num(`${shown} = ${N(S)}. What is □?`, t[p], `The known numbers add to ${N(known)}. So □ = ${N(S)} − ${P(known)} = ${N(t[p])}.`); } },
    { t: 'pair them up', g: R => {
      if (R.bool()) { const n = R.int(15, 99), ans = n % 2 ? (n + 1) / 2 : -n / 2;
        const ex = n % 2 ? `(1 − 2) + (3 − 4) + … + (${n - 2} − ${n - 1}) is ${(n - 1) / 2} pairs of −1, then add ${n}: ${N(-(n - 1) / 2)} + ${n} = ${ans}.` : `(1 − 2) + (3 − 4) + … + (${n - 1} − ${n}) is ${n / 2} pairs of −1, so ${N(ans)}.`;
        return num(`Find 1 − 2 + 3 − 4 + … ${n % 2 ? '+' : '−'} ${n}. The signs alternate.`, ans, ex); }
      const [a, b] = R.distinct(8, 60, 2), sum = (b * (b + 1) - a * (a + 1)) / 2;
      const ex = b > a ? `Each −k cancels +k up to ${a}. What is left is ${a + 1} + … + ${b} = ${b - a} numbers averaging ${fmt((a + 1 + b) / 2)}: ${N(sum)}.`
        : `Each −k cancels +k up to ${b}. What is left is −${b + 1} − … − ${a}: ${a - b} numbers averaging −${fmt((a + b + 1) / 2)}, so ${N(sum)}.`;
      return num(`Add all the integers from −${a} to ${b}.`, sum, ex); } });

  // order of operations: evaluate a flat list with × first, then + and − left to right
  const evFlat = (ns, os) => { const v = [ns[0]], o = []; os.forEach((op, i) => { if (op === '×') v[v.length - 1] *= ns[i + 1]; else { o.push(op); v.push(ns[i + 1]); } }); let r = v[0]; o.forEach((op, j) => { r = op === '+' ? r + v[j + 1] : r - v[j + 1]; }); return r; };
  const showFlat = (ns, os, br) => ns.map((n, i) => { const first = i === 0 || (br && i === br[0]); let s = first ? N(n) : P(n); if (br && i === br[0]) s = '(' + s; if (br && i === br[1]) s += ')'; return (i ? ` ${os[i - 1]} ` : '') + s; }).join('');
  const SPANS = [[0, 1], [1, 2], [2, 3], [0, 2], [1, 3]];
  const evBr = (ns, os, [i, j]) => { const inner = evFlat(ns.slice(i, j + 1), os.slice(i, j)); return { inner, v: evFlat([...ns.slice(0, i), inner, ...ns.slice(j + 1)], [...os.slice(0, i), ...os.slice(j)]) }; };
  B('III.1.08',
    { t: 'place the brackets', g: R => {
      for (let t = 0; t < 300; t++) {
        const ns = [0, 0, 0, 0].map(() => nz(R, -9, 9)); if (ns.every(v => v > 0)) ns[R.int(0, 3)] *= -1;
        const os = [0, 0, 0].map(() => R.pick(['+', '−', '×'])); if (!os.includes('×')) os[R.int(0, 2)] = '×';
        const flat = evFlat(ns, os), vals = SPANS.map(s => evBr(ns, os, s).v), c = R.int(0, 4), tv = vals[c];
        if (tv === flat || vals.filter(v => v === tv).length > 1) continue;
        const strs = SPANS.map(s => showFlat(ns, os, s)), inner = evBr(ns, os, SPANS[c]).inner;
        return choice(R, `Where do the brackets go to make the value ${N(tv)}?`, strs[c], strs.filter((_, i) => i !== c),
          `${strs[c]}: the brackets give ${N(inner)} first, then × before + and −, for ${N(tv)}. With no brackets it is ${N(flat)}.`);
      }
      return choice(R, 'Where do the brackets go to make the value 35?', '(3 + 4) × 5', ['3 + (4 × 5)'], '(3 + 4) × 5 = 7 × 5 = 35. With no brackets it is 23.'); } },
    { t: 'choose the signs', g: R => {
      const ns = [0, 0, 0, 0].map(() => nz(R, -6, 6)); if (ns.every(v => v > 0)) ns[R.int(0, 3)] *= -1; if (ns.every(v => v < 0)) ns[R.int(0, 3)] *= -1;
      const big = R.bool(), OPS = ['+', '−', '×']; let best = null, bo = null;
      for (const a of OPS) for (const b of OPS) for (const c of OPS) { const v = evFlat(ns, [a, b, c]); if (best === null || (big ? v > best : v < best)) { best = v; bo = [a, b, c]; } }
      return num(`Put +, − or × in each box to make ${N(ns[0])} □ ${P(ns[1])} □ ${P(ns[2])} □ ${P(ns[3])} as ${big ? 'large' : 'small'} as possible. What is that value?`, best,
        `The best is ${showFlat(ns, bo)} = ${N(best)}. Multiplying numbers with ${big ? 'the same sign makes big positives' : 'opposite signs makes big negatives'}, and × is done before + and −.`); } });

  B('III.1.13',
    { t: 'a delayed repeat', g: R => {
      if (R.bool(0.6)) { const a = R.int(0, 9); let b; do b = R.int(1, 8); while (b === a);
        const n = 9 * a + b;
        return num(`Write 0.${a}${ol(b)} = 0.${a}${b}${b}${b}… as a fraction in simplest form.`, [frac(n, 90, 'simplest')],
          `Let x = 0.${a}${b}${b}…. Then 100x − 10x = ${a}${b}.${b}… − ${a}.${b}… = ${n}, so x = ${fh(n, 90)} = ${FR(n, 90)}.`); }
      let a, b, c; do { a = R.int(1, 9); b = R.int(0, 9); c = R.int(0, 9); } while (b === c);
      const n = 100 * a + 10 * b + c - a;
      return num(`Write 0.${a}${ol(`${b}${c}`)} = 0.${a}${b}${c}${b}${c}… as a fraction in simplest form.`, [frac(n, 990, 'simplest')],
        `Let x = 0.${a}${b}${c}${b}${c}…. Then 1000x − 10x = ${a}${b}${c}.${b}${c}… − ${a}.${b}${c}… = ${n}, so x = ${fh(n, 990)} = ${FR(n, 990)}.`); } },
    { t: 'repeating blocks', g: R => {
      if (R.bool()) { const [a, b] = R.distinct(1, 9, 2), ab = 10 * a + b, ba = 10 * b + a;
        return num(`Find 0.${ol(`${a}${b}`)} + 0.${ol(`${b}${a}`)} as a fraction in simplest form.`, [frac(a + b, 9, 'simplest')],
          `0.${ol(`${a}${b}`)} = ${fh(ab, 99)} and 0.${ol(`${b}${a}`)} = ${fh(ba, 99)}. The sum is ${fh(ab + ba, 99)} = ${fh(`11 × ${a + b}`, 99)} = ${FR(a + b, 9)}.`); }
      const d = R.pick([7, 13]); const k = R.int(1, d - 1);
      const digs = []; let r = k; for (let i = 0; i < 6; i++) { r *= 10; digs.push(Math.floor(r / d)); r %= d; }
      const Pn = R.int(20, 300), q = Math.floor(Pn / 6), rem = Pn % 6, dig = digs[(rem || 6) - 1];
      return num(`What is the ${th(Pn)} digit after the decimal point in ${fh(k, d)}?`, dig,
        `${fh(k, d)} = 0.${ol(digs.join(''))}, a block of 6 digits. ${Pn} = 6 × ${rem ? q : q - 1} + ${rem || 6}, so it is digit ${rem || 6} of the block: ${dig}.`); } });

  /* =================== III.2 Ratio and rate =================== */
  B('III.2.07',
    { t: 'unknown in the numerator', g: R => {
      if (R.bool()) { const [c, d] = pickOK(R, () => [R.int(1, 9), R.int(2, 9)], ([c, d]) => gcd(c, d) === 1 && c !== d, [2, 3]);
        const t = R.int(1, 4), b = d * t, a = nz(R, -9, 9), x = c * t - a;
        return num(`Solve ${fh(`${I('x')} ${sg(a)}`, b)} = ${fh(c, d)}.`, [{ label: 'x =', ans: x }],
          `Cross-multiply: ${d}(${I('x')} ${sg(a)}) = ${c} × ${b} = ${c * b}. So ${I('x')} ${sg(a)} = ${c * t}, and ${I('x')} = ${N(x)}.`); }
      let b, f; do { b = R.int(2, 9); f = R.int(2, 9); } while (b === f);
      const s = nz(R, -5, 6), x = R.int(-8, 15), a = b * s - x, e = x - f * s;
      return num(`Solve ${fh(`${I('x')} ${sg(a)}`, b)} = ${fh(`${I('x')} ${sg(-e)}`, f)}.`, [{ label: 'x =', ans: x }],
        `Cross-multiply: ${f}(${I('x')} ${sg(a)}) = ${b}(${I('x')} ${sg(-e)}), so ${f}${I('x')} ${sg(f * a)} = ${b}${I('x')} ${sg(-b * e)}. Then ${lin([[f - b, 'x']])} = ${N(-b * e - f * a)}, so ${I('x')} = ${N(x)}.`); } },
    { t: 'add the same to both', g: R => {
      for (let t0 = 0; t0 < 400; t0++) {
        const [c, d] = coprime(R, 1, 9), t = R.int(2, 12), x = R.int(1, 20), sub = R.bool(0.35);
        const a = sub ? c * t + x : c * t - x, b = sub ? d * t + x : d * t - x;
        if (a < 1 || b < 1 || a === b || a > 150 || b > 150) continue;
        const gap = Math.abs(b - a), pg = Math.abs(d - c);
        return num(`What number must be ${sub ? 'taken away from' : 'added to'} both ${a} and ${b} to make the ratio ${c} : ${d}?`, x,
          `${sub ? 'Taking away' : 'Adding'} the same number keeps the gap, ${gap}. In ${c} : ${d} the gap is ${pg} part${pg > 1 ? 's' : ''}, so 1 part = ${t}. The first number must become ${c} × ${t} = ${c * t}, so the number is ${x}.`);
      }
      return num('What number must be added to both 3 and 8 to make the ratio 2 : 3?', 7, 'The gap 5 is 1 part, so 1 part = 5. 3 must become 10, so add 7.'); } });

  B('III.2.12',
    { t: 'from the difference', g: (R, O) => {
      const [p, q] = R.pick(NAMES), k = K(O);
      if (R.bool()) { let a, b; do { [a, b] = coprime(R, 1, 9); } while (a >= b); const u = R.int(2, 25) * k, D = (b - a) * u, tot = (a + b) * u;
        return num(`${p} and ${q} share some money in the ratio ${a} : ${b}. ${q} gets ${money(D, O)} more than ${p}. How much is shared in all, in ${O.coins === 'THB' ? 'baht' : 'dollars'}?`, tot,
          `The gap is ${b - a} part${b - a > 1 ? 's' : ''} = ${money(D, O)}, so 1 part = ${money(u, O)}. All ${a + b} parts: ${money(tot, O)}.`); }
      const [a, b, c] = R.distinct(1, 9, 3).sort((x, y) => x - y), u = R.int(2, 15) * k, D = (c - a) * u;
      return num(`Three friends share money in the ratio ${a} : ${b} : ${c}. The largest share is ${money(D, O)} more than the smallest. How much is the middle share, in ${O.coins === 'THB' ? 'baht' : 'dollars'}?`, b * u,
        `Largest − smallest = ${c} − ${a} = ${c - a} parts = ${money(D, O)}, so 1 part = ${money(u, O)}. The middle share is ${b} parts: ${money(b * u, O)}.`); } },
    { t: 'after a transfer', g: R => {
      const [A1, A2] = R.pick(NAMES), item = R.pick(['stickers', 'marbles', 'cards']);
      for (let t = 0; t < 500; t++) {
        const [p, q] = coprime(R, 1, 7), k = R.int(2, 10), n = R.int(1, p * k - 1), A = p * k - n, Bv = q * k + n, g = gcd(A, Bv), r = A / g, s = Bv / g;
        if (r + s > 12 || n % 1) continue;
        const T = (p + q) * k;
        return num(`${A1} and ${A2} have ${item} in the ratio ${p} : ${q}. After ${A1} gives ${A2} ${n} ${item}, the ratio is ${r} : ${s}. How many ${item} did ${A1} have at first?`, p * k,
          `The total never changes. ${A1}'s share drops from ${fh(p, p + q)} to ${fh(r, r + s)} of it, a drop of ${FR(p * (r + s) - r * (p + q), (p + q) * (r + s))}. That is ${n}, so the total is ${T} and ${A1} had ${fh(p, p + q)} × ${T} = ${p * k}.`);
      }
      return num(`${A1} and ${A2} have ${item} in the ratio 5 : 3. After ${A1} gives ${A2} 4 ${item}, the ratio is 1 : 1. How many ${item} did ${A1} have at first?`, 20, `The total never changes. ${A1}'s share drops from 5/8 to 1/2, a drop of 1/8. That is 4, so the total is 32 and ${A1} had 20.`); } });

  const AVG = [[30, 60], [40, 60], [20, 30], [12, 24], [10, 15], [60, 90], [45, 90], [10, 40], [6, 12], [20, 80], [36, 45], [24, 40], [30, 45], [30, 70], [15, 60], [28, 70]];
  B('III.2.13',
    { t: 'average speed trap', g: (R, O) => {
      const u = U(O), [s1, s2] = R.pick(AVG), [v1, v2] = R.bool() ? [s1, s2] : [s2, s1], avg = 2 * v1 * v2 / (v1 + v2), d = lcm(v1, v2) * R.int(1, 2), t1 = d / v1, t2 = d / v2;
      if (R.bool(0.65)) return num(`You drive ${d} ${u.far} to a town at ${v1} ${u.sp} and back at ${v2} ${u.sp}. What is your average speed for the whole trip, in ${u.sp}?`, avg,
        `Times: ${d} ÷ ${v1} = ${t1} h and ${d} ÷ ${v2} = ${t2} h. Average = total distance ÷ total time = ${2 * d} ÷ ${t1 + t2} = ${fmt(avg)} ${u.sp}, not ${fmt((v1 + v2) / 2)}.`);
      return num(`You drive to a town at ${v1} ${u.sp}. How fast must you drive back to average ${fmt(avg)} ${u.sp} for the round trip, in ${u.sp}?`, v2,
        `Try ${d} ${u.far} each way. The round trip at ${fmt(avg)} ${u.sp} takes ${2 * d} ÷ ${fmt(avg)} = ${t1 + t2} h. Going took ${t1} h, so coming back takes ${t2} h: ${d} ÷ ${t2} = ${v2} ${u.sp}.`); } },
    { t: 'catch up, or the bird', g: (R, O) => {
      const u = U(O), [A, Bn] = R.pick(NAMES);
      if (R.bool()) {
        const [v1, h, t, g] = pickOK(R, () => { const v1 = R.int(6, 12) * 5, h = R.int(1, 3), t = R.int(1, 6); return [v1, h, t, v1 * h / t]; }, ([v1, h, t, g]) => Number.isInteger(g) && g >= 5, [40, 1, 2, 20]);
        const v2 = v1 + g;
        return num(`${A} leaves town driving at ${v1} ${u.sp}. ${Bn} leaves ${h} hour${h > 1 ? 's' : ''} later on the same road at ${v2} ${u.sp}. How many hours after ${Bn} leaves does ${Bn} catch up?`, t,
          `When ${Bn} leaves, ${A} is ${v1} × ${h} = ${v1 * h} ${u.far} ahead. ${Bn} gains ${v2} − ${v1} = ${g} ${u.far} each hour: ${v1 * h} ÷ ${g} = ${t} hour${t > 1 ? 's' : ''}.`);
      }
      const v1 = R.int(2, 9) * 10, v2 = R.int(2, 9) * 10, t = R.pick([1, 1.5, 2, 2.5, 3]), D = t * (v1 + v2), w = R.int(10, 20) * 10;
      return num(`Two trains ${fmt(D)} ${u.far} apart head toward each other at ${v1} and ${v2} ${u.sp}. A bird flies back and forth between them at ${w} ${u.sp} until they meet. How far does the bird fly, in ${u.far}?`, w * t,
        `Don't follow the zigzags. The trains meet after ${fmt(D)} ÷ ${v1 + v2} = ${fmt(t)} h, and the bird flies the whole time: ${w} × ${fmt(t)} = ${fmt(w * t)} ${u.far}.`); } });

  const TRIO = [['red', 'blue', 'green', 'marbles'], ['cats', 'dogs', 'rabbits', 'pets'], ['apples', 'pears', 'plums', 'fruits'], ['pens', 'pencils', 'erasers', 'items']];
  B('III.2.15',
    { t: 'link two ratios', g: R => {
      const [x, y, z, what] = R.pick(TRIO);
      const [p, q, r, s] = pickOK(R, () => [R.int(1, 7), R.int(1, 7), R.int(1, 7), R.int(1, 7)], ([p, q, r, s]) => p !== q && r !== s && q !== r, [2, 3, 4, 5]);
      const g = gcd(p * r, q * s), A0 = p * r / g, C0 = q * s / g, u = R.int(1, 6), Av = A0 * u, Cv = C0 * u;
      return num(`The ratio of ${x} to ${y} is ${p} : ${q}, and ${y} to ${z} is ${r} : ${s}. There are ${Av} ${x}. How many ${z} are there?`, Cv,
        `Make the ${y} match: ${r > 1 ? `${p} : ${q} = ${p * r} : ${q * r}` : `${p} : ${q}`} and ${q > 1 ? `${r} : ${s} = ${q * r} : ${q * s}` : `${r} : ${s}`}. So ${x} : ${z} = ${p * r} : ${q * s}${g > 1 ? ` = ${A0} : ${C0}` : ''}. ${Av} ${x} means ${Cv} ${z}.`); } },
    { t: 'mix two groups', g: R => {
      const [a, b] = coprime(R, 1, 5), t = R.int(1, 4), M = R.int(62, 84), X = M - b * t, Y = M + a * t, sw = R.bool(), G = sw ? ['girls', 'boys'] : ['boys', 'girls'];
      if (R.bool()) return num(`In a class, ${G[0]} : ${G[1]} = ${a} : ${b}. The ${G[0]}' mean score is ${X} and the ${G[1]}' mean is ${Y}. What is the mean for the whole class?`, M,
        `Picture ${a + b} students: ${a} scoring ${X} and ${b} scoring ${Y}. Total ${a * X + b * Y} ÷ ${a + b} = ${M}.`);
      return num(`In a class, the ${G[0]}' mean score is ${X}, the ${G[1]}' mean is ${Y}, and the class mean is ${M}. What fraction of the class are ${G[0]}?`, [frac(a, a + b)],
        `${M} is ${M - X} above ${X} and ${Y - M} below ${Y}. The groups balance: ${G[0]} : ${G[1]} = ${Y - M} : ${M - X}${Y - M !== a ? ` = ${a} : ${b}` : ''}, so ${G[0]} are ${fh(a, a + b)}.`); } });

  /* =================== III.3 Percent =================== */
  B('III.3.04',
    { t: 'work backwards twice', g: (R, O) => {
      const nm = R.pick(['Ana', 'Mia', 'Kim', 'Zoe', 'Ivy']), k = K(O);
      for (let t = 0; t < 300; t++) {
        const p = R.pick([10, 20, 25, 30, 40, 50, 60, 75]), q = R.pick([10, 20, 25, 40, 50, 60, 75, 80]), S = R.int(2, 60) * 10 * k;
        const mid = S * (100 - p) / 100, L = mid * (100 - q) / 100;
        if (!Number.isInteger(mid) || !Number.isInteger(L)) continue;
        return num(`${nm} spent ${p}% of her money on a book, then ${q}% of what was left on lunch. She has ${money(L, O)} left. How much did she start with, in ${O.coins === 'THB' ? 'baht' : 'dollars'}?`, S,
          `After lunch she has ${100 - q}% of ${money(mid, O)}: ${money(L, O)} ÷ ${fmt((100 - q) / 100)} = ${money(mid, O)}. That is ${100 - p}% of the start: ${money(mid, O)} ÷ ${fmt((100 - p) / 100)} = ${money(S, O)}.`);
      }
      return num(`${nm} spent 50% of her money on a book, then 50% of what was left on lunch. She has ${money(10 * k, O)} left. How much did she start with, in ${O.coins === 'THB' ? 'baht' : 'dollars'}?`, 40 * k, `Double twice: ${money(10 * k, O)} → ${money(20 * k, O)} → ${money(40 * k, O)}.`); } },
    { t: 'the gap tells the whole', g: (R, O) => {
      if (R.bool()) { const u = U(O).vol;
        for (let t = 0; t < 300; t++) { const p1 = R.int(1, 12) * 5, p2 = R.int(p1 / 5 + 2, 19) * 5, C = R.int(2, 40) * 20, A = (p2 - p1) * C / 100;
          if (!Number.isInteger(A)) continue;
          return num(`A tank is ${p1}% full. After ${A} ${u} are added, it is ${p2}% full. What is its capacity, in ${u}?`, C,
            `The ${A} ${u} filled ${p2}% − ${p1}% = ${p2 - p1}% of the tank. So capacity = ${A} ÷ ${fmt((p2 - p1) / 100)} = ${C} ${u}.`); }
        return num(`A tank is 30% full. After 45 ${u} are added, it is 75% full. What is its capacity, in ${u}?`, 100, `45 ${u} is 45% of the tank, so it holds 100 ${u}.`); }
      for (let t = 0; t < 300; t++) { const p1 = R.pick([10, 15, 20, 25, 30, 40]), p2 = p1 + R.pick([5, 10, 15, 20, 25, 30]), x = R.int(2, 40) * 20, D = (p2 - p1) * x / 100;
        if (!Number.isInteger(D)) continue;
        return num(`${p2}% of a number is ${D} more than ${p1}% of it. What is the number?`, x,
          `The difference, ${p2}% − ${p1}% = ${p2 - p1}% of the number, is ${D}. So the number is ${D} ÷ ${fmt((p2 - p1) / 100)} = ${x}.`); }
      return num('40% of a number is 30 more than 25% of it. What is the number?', 200, 'The difference, 15% of the number, is 30. So the number is 30 ÷ 0.15 = 200.'); } });

  const DISC = []; for (const a of [10, 20, 25, 30, 40, 50]) for (const b of [10, 20, 25, 30, 40, 50]) if ((100 - a) * (100 - b) % 100 === 0) DISC.push([a, b]);
  B('III.3.09',
    { t: 'stacked discounts', g: R => {
      const [a, b] = R.pick(DISC), pay = (100 - a) * (100 - b) / 100, single = 100 - pay;
      if (R.bool(0.6)) return num(`A store takes ${a}% off, then another ${b}% off the new price. What single percent discount is the same?`, single,
        `You pay ${100 - b}% of ${100 - a}%: ${fmt((100 - a) / 100)} × ${fmt((100 - b) / 100)} = ${fmt(pay / 100)}. That is ${fmt(pay)}% of the price, so ${fmt(single)}% off, not ${a + b}%.`);
      return num(`After ${a}% off, a store takes a second discount off the new price. The total saving is ${fmt(single)}% of the original. What was the second discount, in %?`, b,
        `You pay ${fmt(pay)}% of the original, which is ${fmt(pay)} ÷ ${100 - a} = ${fmt((100 - b) / 100)} of the first sale price. So the second discount is ${b}%.`); } },
    { t: 'find the price', g: (R, O) => {
      const k = K(O), F = R.pick([[1, 2, 'half'], [1, 4, 'a quarter'], [3, 5, 'three fifths']]);
      for (let t = 0; t < 400; t++) {
        const p = R.pick([10, 15, 20, 25, 30, 35]), x = R.int(2, 40) * 10 * k, D = x * (100 - p) / 100 - x * F[0] / F[1];
        if (D <= 0 || !Number.isInteger(D * 100) || Math.abs(D * 100 - Math.round(D * 100)) > 1e-9) continue;
        const gp = (100 - p) / 100 - F[0] / F[1];
        return num(`After ${p}% off, a coat costs ${money(D, O)} more than ${F[2]} of its original price. What was the original price, in ${O.coins === 'THB' ? 'baht' : 'dollars'}?`, x,
          `The sale price is ${fmt((100 - p) / 100)} of the original, and ${F[2]} is ${fmt(F[0] / F[1])}. The difference, ${fmt(gp)} of the price, is ${money(D, O)}: ${money(D, O)} ÷ ${fmt(gp)} = ${money(x, O)}.`);
      }
      return num(`After 20% off, a coat costs ${money(12 * k, O)} more than half of its original price. What was the original price, in ${O.coins === 'THB' ? 'baht' : 'dollars'}?`, 40 * k, `0.8 − 0.5 = 0.3 of the price is ${money(12 * k, O)}, so the price is ${money(40 * k, O)}.`); } });

  B('III.3.12',
    { t: 'find the rate, time or amount', g: (R, O) => {
      const k = K(O), Pm = R.int(2, 40) * 100 * k, r = R.int(2, 9), n = R.int(2, 6), I = Pm * r * n / 100, T = Pm + I, kd = R.int(0, 2);
      if (kd === 0) return num(`${money(Pm, O)} grows to ${money(T, O)} with simple interest over ${n} years. What is the yearly interest rate, in %?`, r,
        `Interest = ${money(T, O)} − ${money(Pm, O)} = ${money(I, O)}, or ${money(I / n, O)} a year. ${money(I / n, O)} ÷ ${money(Pm, O)} = ${r}%.`);
      if (kd === 1) return num(`${money(Pm, O)} earns ${r}% simple interest a year. After how many years is the total ${money(T, O)}?`, n,
        `Each year earns ${r}% of ${money(Pm, O)} = ${money(Pm * r / 100, O)}. The interest is ${money(I, O)}, so ${money(I, O)} ÷ ${money(Pm * r / 100, O)} = ${n} years.`);
      return num(`Money at ${r}% simple interest earns ${money(I, O)} in ${n} years. How much was put in, in ${O.coins === 'THB' ? 'baht' : 'dollars'}?`, Pm,
        `${n} years at ${r}% is ${r * n}% of the amount. ${money(I, O)} ÷ ${fmt(r * n / 100)} = ${money(Pm, O)}.`); } },
    { t: 'split between two accounts', g: (R, O) => {
      const k = K(O), [a, b] = R.distinct(2, 9, 2).sort((x, y) => y - x), A = R.int(1, 30) * 100 * k, Bm = R.int(1, 30) * 100 * k, T = A + Bm, I = (a * A + b * Bm) / 100, low = b * T / 100;
      return num(`You invest ${money(T, O)}: some at ${a}% and the rest at ${b}% simple interest a year. After one year you have earned ${money(I, O)}. How much did you invest at ${a}%, in ${O.coins === 'THB' ? 'baht' : 'dollars'}?`, A,
        `If it were all at ${b}%, you'd earn ${money(low, O)}. The extra ${money(I - low, O)} is the extra ${a - b}% on the ${a}% part: ${money(I - low, O)} ÷ ${fmt((a - b) / 100)} = ${money(A, O)}.`); } });

  const UNDO_FALL = [[20, 25], [50, 100], [60, 150], [75, 300], [80, 400], [36, 56.25], [37.5, 60], [68, 212.5], [84, 525], [90, 900], [96, 2400], [92, 1150], [87.5, 700], [95, 1900]];
  B('III.3.14',
    { t: 'up then down', g: R => {
      let p, q; do { p = R.int(1, 6) * 10; q = R.int(1, 6) * 10; } while (p === q && R.bool(0.5));
      const upFirst = R.bool(), f = (1 + p / 100) * (1 - q / 100), net = Math.round((f - 1) * 1000) / 10;
      const first = upFirst ? `rises ${p}%` : `falls ${q}%`, second = upFirst ? `falls ${q}%` : `rises ${p}%`;
      return num(`A price ${first}, then the new price ${second}. What is the overall percent change? Use a negative number for a decrease.`, net,
        `Multiply: ${upFirst ? `${fmt(1 + p / 100)} × ${fmt(1 - q / 100)}` : `${fmt(1 - q / 100)} × ${fmt(1 + p / 100)}`} = ${fmt(f)}, so the change is ${fmt(net)}%${net < 0 ? ' (a decrease)' : ''}, not ${N(upFirst ? p - q : -q + p)}%.`); } },
    { t: 'undo a change', g: R => {
      const kd = R.int(0, 2);
      if (kd === 0) { const [p, r] = R.pick(UNDO_FALL);
        return num(`A price falls ${fmt(p)}%. By what percent must the new price rise to get back to the start?`, r,
          `After the fall it is ${fmt(100 - p)}% of the start. To get back, multiply by 100 ÷ ${fmt(100 - p)} = ${fmt(1 + r / 100)}: a rise of ${fmt(r)}%.`); }
      if (kd === 1) { const [r, p] = R.pick(UNDO_FALL);
        return num(`A price rises ${fmt(p)}%. Later it is back to the original price. By what percent did it fall?`, r,
          `After the rise it is ${fmt(100 + p)}% of the original. Falling back to 100% loses ${fmt(p)} of those ${fmt(100 + p)} parts: ${fmt(p)} ÷ ${fmt(100 + p)} = ${fmt(r)}%.`); }
      const p = R.int(1, 10) * 10, down = p < 100 && R.bool(0.4), f = down ? (1 - p / 100) ** 2 : (1 + p / 100) ** 2, ch = Math.round(Math.abs(f - 1) * 1000) / 10;
      return num(`A town's population ${down ? 'shrinks' : 'grows'} ${p}% one year and ${p}% again the next. What is the total percent ${down ? 'decrease' : 'increase'}?`, ch,
        `Multiply twice: ${fmt(down ? 1 - p / 100 : 1 + p / 100)} × ${fmt(down ? 1 - p / 100 : 1 + p / 100)} = ${fmt(f)}, a ${down ? 'decrease' : 'increase'} of ${fmt(ch)}%, not ${2 * p}%.`); } });

  B('III.3.17',
    { t: 'undo markup and tax', g: (R, O) => {
      const k = K(O);
      for (let t = 0; t < 400; t++) {
        const p = R.pick([20, 25, 40, 50, 60, 80, 100]), tx = R.pick([5, 8, 10]), C = R.int(2, 60) * 5 * k, cents = C * (100 + p) * (100 + tx) / 100;
        if (!Number.isInteger(cents)) continue;
        const mid = C * (100 + p) / 100, F = cents / 100;
        return num(`A shop marks up its cost by ${p}%. Then ${tx}% sales tax is added. A customer pays ${money(F, O)}. What did the shop pay, in ${O.coins === 'THB' ? 'baht' : 'dollars'}?`, C,
          `Undo in reverse. Tax: ${money(F, O)} ÷ ${fmt(1 + tx / 100)} = ${money(mid, O)}. Markup: ${money(mid, O)} ÷ ${fmt(1 + p / 100)} = ${money(C, O)}.`);
      }
      return num(`A shop marks up its cost by 50%. Then 10% sales tax is added. A customer pays ${money(33 * k, O)}. What did the shop pay, in ${O.coins === 'THB' ? 'baht' : 'dollars'}?`, 20 * k, `${money(33 * k, O)} ÷ 1.1 = ${money(30 * k, O)}, then ÷ 1.5 = ${money(20 * k, O)}.`); } },
    { t: 'the part that stays fixed', g: (R, O) => {
      const u = U(O);
      if (R.bool()) {
        const imp = O.units === 'imperial', unit = imp ? 'lb' : 'g';
        for (let t = 0; t < 400; t++) { const a = R.int(1, 6) * 10, b = R.int(a / 10 + 1, 8) * 10, W = imp ? R.int(2, 30) * 5 : R.int(2, 16) * 50, x = W * (b - a) / (100 - b);
          if (!Number.isInteger(x)) continue;
          const other = W * (100 - a) / 100;
          return num(`A bag of nuts weighs ${W} ${unit} and is ${a}% almonds. How many ${unit} of almonds must you add to make it ${b}% almonds?`, x,
            `The other nuts, ${fmt(other)} ${unit}, don't change. They must become ${100 - b}% of the new bag: ${fmt(other)} ÷ ${fmt((100 - b) / 100)} = ${W + x} ${unit}. So add ${x} ${unit}.`); }
        return num(`A 200 g bag of nuts is 40% almonds. How many g of almonds must you add to make it 60% almonds?`, 100, 'The other 120 g must be 40% of the new bag: 300 g. Add 100 g.');
      }
      for (let t = 0; t < 400; t++) { const p1 = R.pick([90, 95, 96, 98, 99]), p2 = R.pick([50, 60, 75, 80, 90, 95, 96, 98].filter(v => v < p1)), W = R.int(1, 20) * 10;
        const solid = W * (100 - p1) / 100, nw = solid * 100 / (100 - p2);
        if (!Number.isInteger(solid * 1000) || !Number.isInteger(nw * 1000) || nw === W) continue;
        return num(`${W} ${u.kg} of fresh fruit is ${p1}% water. After drying, it is ${p2}% water. What does it weigh now, in ${u.kg}?`, nw,
          `The dry part, ${100 - p1}% of ${W} = ${fmt(solid)} ${u.kg}, doesn't change. Now it is ${100 - p2}% of the fruit: ${fmt(solid)} ÷ ${fmt((100 - p2) / 100)} = ${fmt(nw)} ${u.kg}.`); }
      return num(`100 ${u.kg} of fresh fruit is 99% water. After drying, it is 98% water. What does it weigh now, in ${u.kg}?`, 50, `The dry 1 ${u.kg} is now 2%, so the fruit weighs 50 ${u.kg}.`); } });
  /* =================== III.4 Exponents and roots =================== */
  B('III.4.01',
    { t: 'add equal powers', g: R => {
      if (R.bool()) { const b = R.int(2, 5), n = R.int(3, 12), terms = Array(b).fill(sup(b, n)).join(' + ');
        return num(`${terms} = ${sup(b, 'k')}. What is k?`, n + 1, `${b} copies of ${sup(b, n)} is ${b} × ${sup(b, n)} = ${sup(b, n + 1)}, so k = ${n + 1}.`); }
      const r = R.pick([2, 3]), j = r === 2 ? R.pick([2, 3]) : R.pick([2, 3]), i = r === 2 ? R.pick([1, 2]) : 1, Bs = r ** j, c = r ** i, n = R.int(2, 9), k = j * n + i;
      const terms = Array(c).fill(sup(Bs, n)).join(' + ');
      return num(`${terms} = ${sup(r, 'k')}. What is k?`, k, `${c} copies make ${c} × ${sup(Bs, n)} = ${sup(r, i)} × ${sup(r, j * n)} = ${sup(r, k)}, since ${Bs} = ${sup(r, j)}. So k = ${k}.`); } },
    { t: 'the last digit cycles', g: R => {
      const cyc = b => { const c = []; let v = 1; for (let i = 0; i < 4; i++) { v = v * b % 10; c.push(v); } const L = [1, 2, 4].find(L => c.every((x, i) => x === c[i % L])); return { c: c.slice(0, L), L }; };
      const dig = (b, n) => { const { c, L } = cyc(b % 10); return c[(n - 1) % L]; };
      const why = (b, n) => { const { c, L } = cyc(b % 10), r = n % L; return `the ones digits of ${b}, ${sup(b, 2)}, ${sup(b, 3)}, … repeat ${c.join(', ')}${L > 1 ? ` every ${L}` : ''}; ${n} ÷ ${L} leaves ${r}, so ${sup(b, n)} ends in ${dig(b, n)}`; };
      const N0 = R.int(20, 2030);
      if (R.bool(0.65)) { const b = R.pick([2, 3, 7, 8, 4, 9, 12, 13, 17, 18]);
        return num(`What is the ones digit of ${sup(b, N0)}?`, dig(b, N0), `Only ones digits matter: ${why(b, N0)}.`); }
      const [a, b] = R.sample([2, 3, 7, 8], 2), s = (dig(a, N0) + dig(b, N0)) % 10;
      return num(`What is the ones digit of ${sup(a, N0)} + ${sup(b, N0)}?`, s, `For ${a}: ${why(a, N0)}. For ${b}: ${why(b, N0)}. ${dig(a, N0)} + ${dig(b, N0)} ends in ${s}.`); } });

  const PW = { 2: [[2, 1], [4, 2], [8, 3], [16, 4], [32, 5]], 3: [[3, 1], [9, 2], [27, 3], [81, 4]] };
  B('III.4.04',
    { t: 'change to one base', g: R => {
      const r = R.pick([2, 3]), [[B1, j1], [B2, j2]] = R.sample(PW[r].slice(r === 2 ? 1 : 0), 2), e1 = R.int(2, 8), e2 = R.int(2, 8), div = R.bool(0.3), k = div ? j1 * e1 - j2 * e2 : j1 * e1 + j2 * e2;
      return num(`${sup(B1, e1)} ${div ? '÷' : '·'} ${sup(B2, e2)} = ${sup(r, 'k')}. What is k?`, k,
        `${B1} = ${sup(r, j1)} and ${B2} = ${sup(r, j2)}, so this is ${sup(r, j1 * e1)} ${div ? '÷' : '·'} ${sup(r, j2 * e2)} = ${sup(r, k)}. ${div ? 'Subtract' : 'Add'} the exponents: k = ${N(k)}.`); } },
    { t: 'count the digits, or solve', g: R => {
      if (R.bool()) {
        const four = R.bool(0.3); let a, b;
        if (R.bool()) { b = R.int(5, 20); const d = R.int(1, 9); a = b + d; } else { a = R.int(5, 20); b = a + R.int(1, 5); }
        if (four && a % 2) a += 1;
        const two = a, sh = four ? `${sup(4, a / 2)} × ${sup(5, b)}` : `${sup(2, a)} × ${sup(5, b)}`;
        const m0 = Math.min(two, b), lead = two > b ? 2 ** (two - b) : 5 ** (b - two), D = String(lead).length + m0;
        return num(`How many digits does ${sh} have when written out?`, D,
          `${four ? `${sup(4, a / 2)} = ${sup(2, a)}. ` : ''}Pair each 2 with a 5 to make a 10: ${sup(2, two)} × ${sup(5, b)} = ${lead} × ${sup(10, m0)}. That is ${lead} followed by ${m0} zeros: ${D} digits.`);
      }
      for (let t = 0; t < 400; t++) {
        const r = R.pick([2, 3]), js = r === 2 ? R.sample([1, 2, 3, 4], 2) : R.sample([1, 2, 3], 2), [j1, j2] = js, x = R.int(-3, 8), c2 = nz(R, -4, 4), c1 = j2 * (x + c2) / j1 - x;
        if (!Number.isInteger(c1) || c1 === 0 || Math.abs(c1) > 9) continue;
        const B1 = r ** j1, B2 = r ** j2;
        return num(`Find ${I('x')} if ${sup(B1, `(x ${sg(c1)})`)} = ${sup(B2, `(x ${sg(c2)})`)}.`, [{ label: 'x =', ans: x }],
          `Write both as powers of ${r}: ${B1} = ${sup(r, j1)} and ${B2} = ${sup(r, j2)}. So ${j1}(${I('x')} ${sg(c1)}) = ${j2}(${I('x')} ${sg(c2)}), which gives ${I('x')} = ${N(x)}.`);
      }
      return num(`Find ${I('x')} if ${sup(9, 'x')} = ${sup(27, '(x − 2)')}.`, [{ label: 'x =', ans: 6 }], `9 = 3² and 27 = 3³, so 2x = 3(x − 2) and x = 6.`); } });

  const perms3 = a => [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]].map(p => p.map(i => a[i]));
  B('III.4.06',
    { t: 'match the exponents', g: R => {
      const [a, p, b, q, g] = pickOK(R, () => { const [a, b] = R.sample([2, 3, 5, 6, 7, 10], 2), p = R.int(1, 4), q = R.int(1, 4); return [a, p, b, q, R.int(5, 30)]; },
        ([a, p, b, q, g]) => gcd(p, q) === 1 && p + q > 2 && a ** p !== b ** q && p * g <= 120 && q * g <= 120 && (a ** p > b ** q) === (p < q), [2, 3, 3, 2, 10]);
      const X = sup(a, p * g), Y = sup(b, q * g), big = a ** p > b ** q;
      return choice(R, `Which is larger: ${X} or ${Y}?`, big ? X : Y, [big ? Y : X, 'They are equal'],
        `Use the same exponent, ${g}: ${X} = ${sup(`(${sup(a, p)})`, g)} = ${sup(a ** p, g)}${q > 1 ? ` and ${Y} = ${sup(`(${sup(b, q)})`, g)} = ${sup(b ** q, g)}` : ''}. ${Math.max(a ** p, b ** q)} > ${Math.min(a ** p, b ** q)}, so ${big ? X : Y} is larger.`); } },
    { t: 'order huge powers', g: R => {
      if (R.bool()) {
        for (let t = 0; t < 400; t++) {
          const r = R.pick([2, 3]), ent = R.sample(PW[r].slice(0, r === 2 ? 5 : 3), 3), ex = ent.map(() => R.int(4, 40)), T = ent.map(([, j], i) => j * ex[i]);
          if (new Set(T).size < 3) continue;
          const byShown = [0, 1, 2].sort((i, k) => ex[i] - ex[k]).join(), byTrue = [0, 1, 2].sort((i, k) => T[i] - T[k]);
          if (byShown === byTrue.join()) continue;
          const S = ent.map(([Bv], i) => sup(Bv, ex[i])), right = byTrue.map(i => S[i]).join(' &lt; ');
          const wrong = R.sample(perms3(S).map(p => p.join(' &lt; ')).filter(s => s !== right), 3);
          return choice(R, `Order from least to greatest: ${S.join(', ')}`, right, wrong,
            `Write each as a power of ${r}: ${ent.filter(([Bv]) => Bv !== r).map(([Bv, j]) => { const i = ent.findIndex(e => e[0] === Bv); return `${S[i]} = ${sup(r, T[i])}`; }).join(', ')}. Compare the exponents.`);
        }
      }
      for (let t = 0; t < 400; t++) {
        const bs = R.sample([2, 3, 5, 6, 7, 10, 11], 3), ps = bs.map(() => R.int(1, 4)), vs = bs.map((b, i) => b ** ps[i]), g = R.int(5, 20);
        if (new Set(vs).size < 3 || gcd(gcd(ps[0], ps[1]), ps[2]) !== 1 || ps.every(p => p === 1)) continue;
        const S = bs.map((b, i) => sup(b, ps[i] * g)), ord = [0, 1, 2].sort((i, k) => vs[i] - vs[k]), right = ord.map(i => S[i]).join(' &lt; ');
        const wrong = R.sample(perms3(S).map(p => p.join(' &lt; ')).filter(s => s !== right), 3);
        return choice(R, `Order from least to greatest: ${S.join(', ')}`, right, wrong,
          `Use the same exponent, ${g}: ${S.map((s, i) => `${s} = ${sup(vs[i], g)}`).join(', ')}. Now compare ${vs.join(', ')}.`);
      }
      return choice(R, 'Order from least to greatest: 2^30, 3^20, 5^10', '5^10 &lt; 2^30 &lt; 3^20', ['2^30 &lt; 3^20 &lt; 5^10'], 'Use exponent 10: 5^10, 8^10, 9^10.'); } });

  const isSq = n => Number.isInteger(Math.sqrt(n));
  B('III.4.11',
    { t: 'count between roots', g: R => {
      if (R.bool()) {
        const [a, b] = pickOK(R, () => { const a = R.int(2, 150); return [a, a + R.int(20, 200)]; }, ([a, b]) => !isSq(a) && !isSq(b), [10, 90]);
        const lo = Math.floor(Math.sqrt(a)) + 1, hi = Math.floor(Math.sqrt(b)), cnt = hi - lo + 1;
        return num(`How many whole numbers are between √${a} and √${b}?`, cnt,
          `${lo - 1}² = ${(lo - 1) ** 2} ${LT} ${a} ${LT} ${lo * lo} = ${lo}², so √${a} is between ${lo - 1} and ${lo}. Also ${hi}² = ${hi * hi} ${LT} ${b} ${LT} ${(hi + 1) ** 2}. So the whole numbers ${lo} to ${hi}: ${cnt}.`); }
      const [A, Bv] = R.distinct(2, 20, 2).sort((x, y) => x - y), cnt = Bv * Bv - A * A - 1;
      return num(`How many whole numbers ${I('n')} have √${I('n')} between ${A} and ${Bv}?`, cnt,
        `Square everything: ${A * A} ${LT} ${I('n')} ${LT} ${Bv * Bv}. So ${I('n')} runs from ${A * A + 1} to ${Bv * Bv - 1}: ${cnt} numbers.`); } },
    { t: 'roots by insight', g: R => {
      const kd = R.int(0, 2);
      if (kd === 0) { const [k, s, t] = pickOK(R, () => [R.pick([2, 3, 5, 6, 7]), R.int(1, 7), R.int(1, 7)], ([k, s, t]) => s !== t && k * s * s <= 300 && k * t * t <= 300 && k * s * s > 10, [3, 2, 3]);
        const a = k * s * s, b = k * t * t;
        return num(`Find √(${a} × ${b}) without a calculator.`, k * s * t,
          `${a} = ${k} × ${s * s} and ${b} = ${k} × ${t * t}, so ${a} × ${b} = ${k}² × ${s}² × ${t}². The root is ${k} × ${s} × ${t} = ${k * s * t}.`); }
      if (kd === 1) { const n = R.int(8, 40);
        return num(`Find √(1 + 3 + 5 + … + ${2 * n - 1}).`, n, `The first ${n} odd numbers add to ${n}² = ${n * n} (they fill a square of side ${n}), so the root is ${n}.`); }
      const Nn = R.int(30, 400), fl = Math.floor(Math.sqrt(Nn));
      return num(`For how many whole numbers ${I('n')} from 0 to ${Nn} is √(${Nn} − ${I('n')}) a whole number?`, fl + 1,
        `${Nn} − ${I('n')} must be a perfect square from 0 to ${Nn}: 0², 1², …, ${fl}² = ${fl * fl}. That is ${fl + 1} values.`); } });

  B('III.4.17',
    { t: 'run the growth backwards', g: R => {
      const f = R.pick([2, 3]), h = R.int(1, 4), verb = f === 2 ? 'doubles' : 'triples', hr = h === 1 ? 'hour' : `${h} hours`;
      if (R.bool()) { const k = f === 2 ? R.int(3, 6) : R.int(3, 5), S = R.int(5, 50), X = S * f ** k;
        return num(`A colony of bacteria ${verb} every ${hr}. After ${h * k} hours there are ${fmt(X)}. How many were there at the start?`, S,
          `${h * k} hours is ${k} ${f === 2 ? 'doublings' : 'triplings'}. ${fmt(X)} ÷ ${sup(f, k)} = ${fmt(X)} ÷ ${f ** k} = ${S}.`); }
      const S = R.int(3, 40), k = f === 2 ? R.int(3, 7) : R.int(3, 5), X = R.int(S * f ** (k - 1), S * f ** k - 1), vals = []; for (let i = 0; i <= k; i++) vals.push(S * f ** i);
      return num(`A colony starts with ${S} bacteria and ${verb} every ${hr}. After how many hours are there first more than ${fmt(X)}?`, h * k,
        `Every ${hr}: ${vals.map(fmt).join(', ')}. The first above ${fmt(X)} is after ${k} steps, which is ${h * k} hours.`); } },
    { t: 'think backwards from full', g: R => {
      if (R.bool()) { const f = R.pick([2, 3]), Nd = R.int(12, 60), j = R.int(1, 3);
        return num(`A water lily patch ${f === 2 ? 'doubles' : 'triples'} in size every day. It covers the whole pond on day ${Nd}. On what day did it cover ${fh(1, f ** j)} of the pond?`, Nd - j,
          `Go back one day at a time: each day back is ${fh(1, f)} as much. ${fh(1, f ** j)} is ${j} step${j > 1 ? 's' : ''} back from full: day ${Nd} − ${j} = ${Nd - j}.`); }
      const Nm = R.int(30, 90), j = R.int(1, 4);
      return num(`One bacterium is put in a jar. The bacteria double every minute, and the jar is full after ${Nm} minutes. If you start with ${2 ** j} bacteria instead, after how many minutes is the jar full?`, Nm - j,
        `${2 ** j} = ${sup(2, j)}, so you start ${j} doubling${j > 1 ? 's' : ''} ahead: ${Nm} − ${j} = ${Nm - j} minutes.`); } });

  /* =================== III.5 Expressions =================== */
  const VARS = [['a', 'b'], ['x', 'y'], ['m', 'n'], ['p', 'q']];
  B('III.5.03',
    { t: 'evaluate without solving', g: R => {
      const [x, y] = R.pick(VARS), a = nz(R, -5, 5), b = nz(R, -5, 5), k = R.pick([2, 3, 4, 5, -2, -3]), c = nz(R, -12, 12), v = nz(R, -12, 12), ans = k * v + c;
      return num(`If ${lin([[a, x], [b, y]])} = ${N(v)}, what is ${lin([[k * a, x], [k * b, y], [c, '']])}?`, ans,
        `${lin([[k * a, x], [k * b, y]])} = ${N(k)}(${lin([[a, x], [b, y]])}) = ${N(k)} × ${P(v)} = ${N(k * v)}. Then ${sg(c)} gives ${N(ans)}.`); } },
    { t: 'square the sum', g: R => {
      const [x, y] = R.distinct(-8, 12, 2), s = x + y, p = x * y, d = x - y, kd = R.int(0, 2), X = I('x'), Y = I('y');
      if (kd === 0) return num(`If ${X} + ${Y} = ${N(s)} and ${X}${Y} = ${N(p)}, what is ${X}² + ${Y}²?`, s * s - 2 * p,
        `(${X} + ${Y})² = ${X}² + 2${X}${Y} + ${Y}², so ${X}² + ${Y}² = ${P(s)}² − 2 × ${P(p)} = ${s * s} ${sg(-2 * p)} = ${N(s * s - 2 * p)}.`);
      if (kd === 1) return num(`If ${X} + ${Y} = ${N(s)} and ${X}${Y} = ${N(p)}, what is (${X} − ${Y})²?`, d * d,
        `(${X} − ${Y})² = (${X} + ${Y})² − 4${X}${Y} = ${P(s)}² − 4 × ${P(p)} = ${s * s} ${sg(-4 * p)} = ${d * d}.`);
      return num(`If ${X} − ${Y} = ${N(d)} and ${X}${Y} = ${N(p)}, what is ${X}² + ${Y}²?`, x * x + y * y,
        `(${X} − ${Y})² = ${X}² − 2${X}${Y} + ${Y}², so ${X}² + ${Y}² = ${P(d)}² + 2 × ${P(p)} = ${d * d} ${sg(2 * p)} = ${N(x * x + y * y)}.`); } });

  B('III.5.08',
    { t: 'find the missing number', g: R => {
      if (R.bool()) { const a = R.int(2, 7), b = R.int(1, 5), v = R.int(1, 9), c = nz(R, -10, 10), cst = c - a * v;
        return num(`What number goes in the box so that ${a}(${lin([[b, 'x']])} − □) ${sg(c)} = ${lin([[a * b, 'x'], [cst, '']])} for every ${I('x')}?`, v,
          `Expand: ${lin([[a * b, 'x']])} − ${a}□ ${sg(c)}. The numbers must match: −${a}□ ${sg(c)} = ${N(cst)}, so ${a}□ = ${a * v} and □ = ${v}.`); }
      const k = R.int(2, 7), b = R.int(1, 5), c = nz(R, -9, 9), e = pickOK(R, () => R.int(1, 9), e => k * b - e !== 0, 1);
      return num(`What number goes in the box so that □(${lin([[b, 'x'], [c, '']])}) − ${lin([[e, 'x']])} = ${lin([[k * b - e, 'x'], [k * c, '']])} for every ${I('x')}?`, k,
        `Match the numbers: □ × ${P(c)} = ${N(k * c)}, so □ = ${k}. Check the ${I('x')} terms: ${k} × ${b} − ${e} = ${N(k * b - e)}.`); } },
    { t: 'two hidden numbers', g: R => {
      const [a, c] = pickOK(R, () => [R.int(2, 9), R.int(2, 6)], ([a, c]) => a !== c, [5, 2]), b = nz(R, -6, 9), d = nz(R, -6, 9), e = a - c, f = a * b + c * d;
      return num(`For every ${I('x')}, ${I('a')}(${I('x')} + ${I('b')}) − ${c}(${I('x')} ${sg(-d)}) = ${lin([[e, 'x'], [f, '']])}. Find ${I('a')} and ${I('b')}.`, [{ label: 'a =', ans: a }, { label: 'b =', ans: b }],
        `Match the ${I('x')} terms: ${I('a')} − ${c} = ${N(e)}, so ${I('a')} = ${a}. Match the numbers: ${a}${I('b')} ${sg(c * d)} = ${N(f)}, so ${a}${I('b')} = ${N(a * b)} and ${I('b')} = ${N(b)}.`); } });

  const SHAPES = [['square', 'squares', 4], ['triangle', 'triangles', 3], ['hexagon', 'hexagons', 6], ['pentagon', 'pentagons', 5]];
  B('III.5.13',
    { t: 'which term?', g: R => {
      const a = nz(R, -20, 30), d = nz(R, -9, 9), n = R.int(12, 80), v = a + (n - 1) * d, terms = [0, 1, 2, 3].map(i => N(a + i * d)).join(', ');
      return num(`Which term of ${terms}, … is ${N(v)}?`, n,
        `Each term ${d > 0 ? 'adds' : 'subtracts'} ${Math.abs(d)}. From ${N(a)} to ${N(v)} is ${N(v - a)} = ${n - 1} × ${P(d)}, so it is term ${n}.`); } },
    { t: 'build it, or find the overlap', g: R => {
      if (R.bool()) { const [one, many, s] = R.pick(SHAPES), Nt = R.int(30, 200), n = Math.floor((Nt - 1) / (s - 1));
        return num(`A row of 1 ${one} uses ${s} toothpicks and a row of 2 ${many} uses ${2 * s - 1}. Each new ${one} shares a side. With ${Nt} toothpicks, what is the longest row you can build?`, n,
          `A row of ${I('n')} uses ${s - 1}${I('n')} + 1 toothpicks. ${s - 1}${I('n')} + 1 ≤ ${Nt} gives ${I('n')} ≤ ${fmt(Math.floor((Nt - 1) / (s - 1) * 100) / 100)}${(Nt - 1) % (s - 1) ? '…' : ''}, so ${n} ${many} (using ${(s - 1) * n + 1}).`); }
      for (let t = 0; t < 400; t++) {
        const a1 = R.int(1, 9), d1 = R.int(2, 9), a2 = R.int(1, 9), d2 = R.int(2, 9), Nt = R.int(80, 300);
        if (d1 === d2 || a1 === a2) continue;
        const com = []; for (let v = a1; v <= Nt; v += d1) if (v >= a2 && (v - a2) % d2 === 0) com.push(v);
        if (com.length < 2) continue;
        const L = lcm(d1, d2), s1 = [0, 1, 2].map(i => a1 + i * d1).join(', '), s2 = [0, 1, 2].map(i => a2 + i * d2).join(', ');
        return num(`How many numbers up to ${Nt} are in both ${s1}, … and ${s2}, …?`, com.length,
          `The first shared number is ${com[0]}. After that they meet every lcm(${d1}, ${d2}) = ${L}: ${com[0]}, ${com[0] + L}, …, ${com[com.length - 1]}. That is ${com.length} numbers.`);
      }
      return num('How many numbers up to 100 are in both 3, 8, 13, … and 5, 11, 17, …?', 3, 'The first shared number is 23. They meet every 30: 23, 53, 83. That is 3 numbers.'); } });

  B('III.5.15',
    { t: 'undo the trick', g: R => {
      for (let t = 0; t < 400; t++) {
        const x = R.int(2, 20), a = R.int(2, 6), b = R.int(1, 20), v = a * x + b, cs = [2, 3, 4, 5, 6, 7, 8, 9].filter(c => v % c === 0);
        if (!cs.length) continue;
        const c = R.pick(cs), d = R.int(1, 15), out = v / c - d;
        return num(`I think of a number. I multiply it by ${a}, add ${b}, divide by ${c}, then subtract ${d}. I get ${N(out)}. What was my number?`, x,
          `Undo each step in reverse: ${N(out)} + ${d} = ${v / c}; × ${c} = ${v}; − ${b} = ${a * x}; ÷ ${a} = ${x}.`);
      }
      return num('I think of a number. I multiply it by 3, add 4, divide by 2, then subtract 5. I get 3. What was my number?', 4, 'Undo in reverse: 3 + 5 = 8; × 2 = 16; − 4 = 12; ÷ 3 = 4.'); } },
    { t: 'digits in disguise', g: R => {
      const kd = R.int(0, 2);
      if (kd === 0) { const d = R.int(1, 8), cnt = 9 - d, ex = []; for (let b = 1; b <= 9 - d; b++) ex.push(`${b + d}${b}`);
        return num(`A two-digit number with no zero digit, minus the number with its digits reversed, is ${9 * d}. How many two-digit numbers work?`, cnt,
          `(10${I('a')} + ${I('b')}) − (10${I('b')} + ${I('a')}) = 9(${I('a')} − ${I('b')}), so ${I('a')} − ${I('b')} = ${d}. That gives ${ex.join(', ')}: ${cnt}.`); }
      if (kd === 1) { const s = R.int(3, 17), cnt = s <= 10 ? s - 1 : 19 - s;
        return num(`A two-digit number with no zero digit, plus the number with its digits reversed, is ${11 * s}. How many two-digit numbers work?`, cnt,
          `(10${I('a')} + ${I('b')}) + (10${I('b')} + ${I('a')}) = 11(${I('a')} + ${I('b')}), so the digits add to ${s}. With digits 1 to 9 there are ${cnt} such numbers.`); }
      const d = R.int(1, 8);
      return num(`A three-digit number's first digit is ${d} more than its last digit. Reverse its digits and subtract the smaller number from the larger. What do you get?`, 99 * d,
        `(100${I('a')} + 10${I('b')} + ${I('c')}) − (100${I('c')} + 10${I('b')} + ${I('a')}) = 99(${I('a')} − ${I('c')}) = 99 × ${d} = ${99 * d}, whatever the middle digit.`); } });

  /* =================== III.6 Equations and inequalities =================== */
  const divisors = n => { const d = []; for (let i = 1; i <= n; i++) if (n % i === 0) d.push(i); return d; };
  B('III.6.06',
    { t: 'find the parameter', g: R => {
      const [a, x0, q, p] = pickOK(R, () => { const a = nz(R, -6, 9), x0 = nz(R, -6, 8), q = R.int(2, 7); return [a, x0, q, q * x0 - a * (x0 + 1)]; }, ([a, x0, q, p]) => x0 !== -1 && p !== 0 && Math.abs(p) <= 60, [2, 3, 4, 4]);
      return num(`${I('x')} = ${N(x0)} is a solution of ${I('a')}${I('x')} ${sg(p)} = ${q}${I('x')} − ${I('a')}. Find ${I('a')}.`, [{ label: 'a =', ans: a }],
        `Put ${I('x')} = ${N(x0)}: ${lin([[x0, 'a']])} ${sg(p)} = ${N(q * x0)} − ${I('a')}. So ${lin([[x0 + 1, 'a']])} = ${N(q * x0 - p)}, and ${I('a')} = ${N(a)}.`); } },
    { t: 'count the good k', g: R => {
      const M = R.pick([12, 18, 20, 24, 28, 30, 36, 16, 40, 42, 45, 48]), a = nz(R, -9, 9), b = R.int(1, 6), c = a + M, ds = divisors(M);
      return num(`For how many positive integers ${I('k')} does ${I('k')}${I('x')} ${sg(a)} = ${lin([[b, 'x'], [c, '']])} have a solution ${I('x')} that is a positive integer?`, ds.length,
        `Collect terms: (${I('k')} − ${b})${I('x')} = ${M}. For a positive whole ${I('x')}, ${I('k')} − ${b} must be a positive divisor of ${M}: ${ds.join(', ')}. That gives ${ds.length} values of ${I('k')}.`); } });

  B('III.6.07',
    { t: 'consecutive integers', g: R => {
      if (R.bool()) { const odd = R.bool(), m0 = R.int(-15, 30) * 2 + (odd ? 1 : 0), S = 3 * m0;
        return num(`Three consecutive ${odd ? 'odd' : 'even'} integers add up to ${N(S)}. What is the largest?`, m0 + 2,
          `Call them ${I('m')} − 2, ${I('m')}, ${I('m')} + 2. The sum is 3${I('m')} = ${N(S)}, so ${I('m')} = ${N(m0)} and the largest is ${N(m0 + 2)}.`); }
      const n = R.int(4, 6), s = R.int(-20, 40), S = n * s + n * (n - 1) / 2;
      return num(`${n} consecutive integers add up to ${N(S)}. What is the smallest?`, s,
        `Call them ${I('s')}, ${I('s')} + 1, …, ${I('s')} + ${n - 1}. The sum is ${n}${I('s')} + ${n * (n - 1) / 2} = ${N(S)}, so ${n}${I('s')} = ${N(S - n * (n - 1) / 2)} and ${I('s')} = ${N(s)}.`); } },
    { t: 'classic puzzles', g: (R, O) => {
      const kd = R.int(0, 2);
      if (kd === 0) { const H = R.int(10, 40), c = R.int(1, H - 1), L = 2 * H + 2 * c;
        return num(`A farm has only chickens and cows. Together they have ${H} heads and ${L} legs. How many cows are there?`, c,
          `If all ${H} were chickens there would be ${2 * H} legs. Each cow adds 2 more: (${L} − ${2 * H}) ÷ 2 = ${c} cows.`); }
      if (kd === 1) { const [t, m0, n0, x] = pickOK(R, () => { const t = R.pick([2, 3]), m0 = R.int(2, 12), n0 = R.int(2, 20); return [t, m0, n0, (n0 + t * m0) / (t - 1)]; }, ([t, m0, n0, x]) => Number.isInteger(x) && x > m0, [2, 3, 4, 10]);
        const nm = R.pick(['Ana', 'Mia', 'Kim', 'Zoe', 'Ivy']);
        return num(`In ${n0} years, ${nm} will be ${t === 2 ? 'twice' : 'three times'} as old as she was ${m0} years ago. How old is she now?`, x,
          `Let her age be ${I('a')}: ${I('a')} + ${n0} = ${t}(${I('a')} − ${m0}). So ${I('a')} + ${n0} = ${t}${I('a')} − ${t * m0}, ${t > 2 ? `${lin([[t - 1, 'a']])} = ${n0 + t * m0}, and ` : ''}${I('a')} = ${x}.`); }
      const n0 = R.int(8, 30), q = R.int(1, n0 - 1);
      if (O.coins === 'THB') { const V = 5 * (n0 - q) + 10 * q;
        return num(`You have ${n0} coins, all 5-baht and 10-baht coins, worth ${V} baht. How many 10-baht coins do you have?`, q,
          `If all ${n0} were 5-baht coins they'd be worth ${5 * n0} baht. Each 10-baht coin adds 5 more: (${V} − ${5 * n0}) ÷ 5 = ${q}.`); }
      const V = 10 * (n0 - q) + 25 * q;
      return num(`You have ${n0} coins, all dimes and quarters, worth ${money(V / 100, O)}. How many quarters do you have?`, q,
        `If all ${n0} were dimes they'd be worth ${money(n0 / 10, O)}. Each quarter adds 15¢ more: (${V} − ${10 * n0})¢ ÷ 15¢ = ${q}.`); } });

  const FLIP = { '<': '>', '>': '<', '≤': '≥', '≥': '≤' };
  const holds = (l, op, r) => op === '<' ? l < r : op === '>' ? l > r : op === '≤' ? l <= r : l >= r;
  B('III.6.10',
    { t: 'flip, then the best integer', g: R => {
      const a = R.int(1, 20), b = R.int(2, 9), c = R.int(-20, 20), op = R.pick(['<', '>', '≤', '≥']), op2 = FLIP[op], t = (a - c) / b;
      const upper = op2 === '<' || op2 === '≤', ans = op2 === '<' ? Math.ceil(t) - 1 : op2 === '≤' ? Math.floor(t) : op2 === '>' ? Math.floor(t) + 1 : Math.ceil(t);
      return num(`What is the ${upper ? 'largest' : 'smallest'} integer ${I('x')} with ${a} − ${b}${I('x')} ${opS(op)} ${N(c)}?`, ans,
        `Subtract ${a}: −${b}${I('x')} ${opS(op)} ${N(c - a)}. Dividing by −${b} flips the sign: ${I('x')} ${opS(op2)} ${FR(a - c, b)}. The ${upper ? 'largest' : 'smallest'} integer is ${N(ans)}.`); } },
    { t: 'count the integers', g: R => {
      for (let t0 = 0; t0 < 400; t0++) {
        const c = R.pick([-5, -4, -3, -2, 2, 3, 4, 5]), p = nz(R, -10, 10), L = R.int(-30, 20), Uu = L + R.int(8, 40), o1 = R.pick(['<', '≤']), o2 = R.pick(['<', '≤']);
        const xs = []; for (let x = -300; x <= 300; x++) { const m0 = p + c * x; if (holds(L, o1, m0) && holds(m0, o2, Uu)) xs.push(x); }
        if (xs.length < 2 || xs.length > 30) continue;
        const ex = lin([[p, ''], [c, 'x']]);
        const iv = c > 0 ? `${FR(L - p, c)} ${opS(o1)} ${I('x')} ${opS(o2)} ${FR(Uu - p, c)}` : `${FR(Uu - p, c)} ${opS(o2)} ${I('x')} ${opS(o1)} ${FR(L - p, c)}`;
        return num(`How many integers ${I('x')} satisfy ${N(L)} ${opS(o1)} ${ex} ${opS(o2)} ${N(Uu)}?`, xs.length,
          `${p < 0 ? `Add ${-p} to` : `Subtract ${p} from`} all three parts, then divide by ${N(c)}${c < 0 ? ', flipping the signs' : ''}: ${iv}. The integers are ${N(xs[0])} to ${N(xs[xs.length - 1])}: ${xs.length}.`);
      }
      return num('How many integers x satisfy −3 ≤ 5 − 2x < 11?', 7, 'Subtract 5: −8 ≤ −2x < 6. Divide by −2: −3 < x ≤ 4. That is −2 to 4: 7 integers.'); } });
  /* =================== III.7 Functions and lines =================== */
  const opWord = ([o, v]) => o === '×' ? `multiplies by ${v}` : o === '+' ? `adds ${v}` : `subtracts ${v}`;
  const opDo = ([o, v], x) => o === '×' ? x * v : o === '+' ? x + v : x - v;
  const opUndo = ([o, v]) => o === '×' ? ['÷', v] : o === '+' ? ['−', v] : ['+', v];
  B('III.7.01',
    { t: 'two machines backwards', g: R => {
      const pm = () => [R.pick(['+', '−']), R.int(1, 12)], A = R.bool() ? [['×', R.int(2, 5)], pm()] : [pm(), ['×', R.int(2, 5)]], Bm = R.bool() ? [pm(), ['×', R.int(2, 5)]] : [['×', R.int(2, 5)], pm()];
      const ops = [...A, ...Bm], x = R.int(-9, 12); let out = x; ops.forEach(o => { out = opDo(o, out); });
      let v = out; const steps = ops.slice().reverse().map(o => { const [u, w] = opUndo(o); v = u === '÷' ? v / w : u === '+' ? v + w : v - w; return `${u} ${w} = ${N(v)}`; });
      return num(`Machine A ${opWord(A[0])}, then ${opWord(A[1])}. Machine B ${opWord(Bm[0])}, then ${opWord(Bm[1])}. A number goes through A and then B, and ${N(out)} comes out. What number went in?`, x,
        `Undo every step in reverse order, starting from ${N(out)}: ${steps.join('; ')}. So ${N(x)} went in.`); } },
    { t: 'a machine that loops', g: R => {
      for (let t = 0; t < 400; t++) {
        const k = R.pick([3, 5, 7]), N0 = R.int(10, 99), seq = [N0], seen = new Map([[N0, 0]]);
        let i0 = -1, j = 0; while (j < 40) { const v = seq[j] % 2 ? seq[j] + k : seq[j] / 2; j++; seq.push(v); if (seen.has(v)) { i0 = seen.get(v); break; } seen.set(v, j); }
        if (i0 < 0 || j > 14) continue;
        const L = j - i0, Pn = R.int(Math.max(30, j + 5), 150), ans = seq[i0 + (Pn - i0) % L];
        return num(`A machine halves an even number and adds ${k} to an odd number. Start with ${N0} and feed each output back in. What comes out after ${Pn} passes?`, ans,
          `${seq.join(' → ')}. From pass ${i0} it repeats every ${L}, and ${Pn} − ${i0} = ${Pn - i0} leaves remainder ${(Pn - i0) % L} when divided by ${L}, so the output is ${ans}.`);
      }
      return num('A machine halves an even number and adds 3 to an odd number. Start with 10 and feed each output back in. What comes out after 50 passes?', 4, '10 → 5 → 8 → 4 → 2 → 1 → 4. From pass 3 it repeats every 3, and 50 − 3 = 47 leaves remainder 2, so the output is 1.'); } });

  B('III.7.04',
    { t: 'find the missing coordinate', g: R => {
      const [p, q] = pickOK(R, () => [nz(R, -5, 5), R.int(1, 4)], ([p, q]) => gcd(p, q) === 1, [2, 3]), a = R.int(-6, 6), b = R.int(-6, 6), t = nz(R, -3, 3), c = a + q * t, k = b + p * t, ms = FR(p, q);
      if (R.bool()) return num(`A line with slope ${ms} passes through (${N(a)}, ${N(b)}) and (${N(c)}, ${I('k')}). Find ${I('k')}.`, [{ label: 'k =', ans: k }],
        `The run is ${N(c)} − ${P(a)} = ${N(c - a)}. Rise = slope × run = ${ms} × ${P(c - a)} = ${N(k - b)}. So ${I('k')} = ${N(b)} ${sg(k - b)} = ${N(k)}.`);
      return num(`A line with slope ${ms} passes through (${N(a)}, ${N(b)}) and (${I('h')}, ${N(k)}). Find ${I('h')}.`, [{ label: 'h =', ans: c }],
        `The rise is ${N(k)} − ${P(b)} = ${N(k - b)}. Run = rise ÷ slope = ${N(k - b)} ÷ ${ms} = ${N(c - a)}. So ${I('h')} = ${N(a)} ${sg(c - a)} = ${N(c)}.`); } },
    { t: 'lattice points on a segment', g: R => {
      const [x1, y1, dx, dy] = pickOK(R, () => [R.int(-8, 8), R.int(-8, 8), R.int(-24, 24), R.int(-24, 24)], ([, , dx, dy]) => dx !== 0 && dy !== 0 && gcd(dx, dy) >= 2, [0, 0, 12, 8]);
      const g = gcd(dx, dy), x2 = x1 + dx, y2 = y1 + dy;
      return num(`How many points with whole-number coordinates lie on the segment from (${N(x1)}, ${N(y1)}) to (${N(x2)}, ${N(y2)}), counting both ends?`, g + 1,
        `The segment moves ${N(dx)} in x and ${N(dy)} in y. gcd(${Math.abs(dx)}, ${Math.abs(dy)}) = ${g}, so it splits into ${g} equal steps of (${N(dx / g)}, ${N(dy / g)}). That gives ${g + 1} points.`); } });

  const slopeX = (p, q) => q === 1 ? lin([[p, 'x']]) : `${p < 0 ? '−' : ''}${fh(Math.abs(p), q)}${I('x')}`;
  B('III.7.06',
    { t: 'parallel, or the x-intercept', g: R => {
      if (R.bool()) {
        const [p, q] = pickOK(R, () => [nz(R, -4, 4), R.int(1, 3)], ([p, q]) => gcd(p, q) === 1, [2, 1]), b0 = nz(R, -9, 9), t = nz(R, -3, 3), x0 = q * t, y0 = R.int(-9, 9), b = y0 - p * t;
        return num(`A line is parallel to ${I('y')} = ${slopeX(p, q)} ${sg(b0)} and passes through (${N(x0)}, ${N(y0)}). What is its y-intercept?`, b,
          `Parallel lines have the same slope, ${FR(p, q)}. So ${N(y0)} = ${FR(p, q)} × ${P(x0)} + ${I('b')} = ${N(p * t)} + ${I('b')}, and ${I('b')} = ${N(b)}.`); }
      const m0 = nz(R, -4, 4), r = R.int(-8, 8), [s1, s2] = R.sample([-4, -3, -2, -1, 1, 2, 3, 4], 2), x1 = r + s1, x2 = r + s2, y1 = m0 * s1, y2 = m0 * s2;
      return num(`The line through (${N(x1)}, ${N(y1)}) and (${N(x2)}, ${N(y2)}) crosses the x-axis at (${I('a')}, 0). Find ${I('a')}.`, [{ label: 'a =', ans: r }],
        `Slope = (${N(y2)} − ${P(y1)}) ÷ (${N(x2)} − ${P(x1)}) = ${N(m0)}. From (${N(x1)}, ${N(y1)}), y must change by ${N(-y1)}, so x changes by ${N(-y1)} ÷ ${P(m0)} = ${N(-s1)}. So ${I('a')} = ${N(r)}.`); } },
    { t: 'triangles from lines', g: R => {
      if (R.bool()) { const [p, q] = R.distinct(2, 12, 2), g = gcd(p, q), a = q / g, b = p / g, c = p * q / g;
        return num(`What is the area of the triangle formed by the line ${lin([[a, 'x'], [b, 'y']])} = ${c} and the two axes?`, p * q / 2,
          `Where ${I('y')} = 0, ${I('x')} = ${c} ÷ ${a} = ${p}. Where ${I('x')} = 0, ${I('y')} = ${c} ÷ ${b} = ${q}. Area = ½ × ${p} × ${q} = ${fmt(p * q / 2)}.`); }
      const h = nz(R, -6, 6), [m1, m2] = R.distinct(-4, 4, 2), k = R.int(-6, 6), b1 = k - m1 * h, b2 = k - m2 * h, A = Math.abs(b1 - b2) * Math.abs(h) / 2;
      const L1 = lin([[m1, 'x'], [b1, '']]), L2 = lin([[m2, 'x'], [b2, '']]);
      return num(`The lines ${I('y')} = ${L1} and ${I('y')} = ${L2} and the y-axis form a triangle. What is its area?`, A,
        `The lines meet where ${L1} = ${L2}: ${I('x')} = ${N(h)}. On the y-axis they are at ${N(b1)} and ${N(b2)}, a side of ${Math.abs(b1 - b2)}. The height is ${Math.abs(h)}, so the area is ½ × ${Math.abs(b1 - b2)} × ${Math.abs(h)} = ${fmt(A)}.`); } });

  /* =================== III.8 Geometry =================== */
  B('III.8.03',
    { t: 'angles with a rule', g: R => {
      const kd = R.int(0, 2);
      if (kd === 0) { const [a, b, c] = pickOK(R, () => [R.int(1, 9), R.int(1, 9), R.int(1, 9)], ([a, b, c]) => 180 % (a + b + c) === 0 && !(a === b && b === c), [2, 3, 4]);
        const u = 180 / (a + b + c), big = R.bool(), v = (big ? Math.max(a, b, c) : Math.min(a, b, c)) * u;
        return num(`A triangle's angles are in the ratio ${a} : ${b} : ${c}. What is the ${big ? 'largest' : 'smallest'} angle, in degrees?`, v,
          `${a + b + c} parts make 180°, so 1 part = ${u}°. The ${big ? 'largest' : 'smallest'} is ${big ? Math.max(a, b, c) : Math.min(a, b, c)} × ${u} = ${v}°.`); }
      if (kd === 1) { const [k, x, p] = pickOK(R, () => { const k = R.int(2, 4), x = R.int(10, 40); return [k, x, 180 - (k + 2) * x]; }, ([k, x, p]) => p !== 0 && x + p > 0, [2, 30, 60]);
        const angs = [x, k * x, x + p], mx = Math.max(...angs);
        return num(`A triangle's angles are ${I('x')}°, ${k}${I('x')}° and (${I('x')} ${sg(p)})°. What is the largest angle, in degrees?`, mx,
          `They add to 180: ${k + 2}${I('x')} ${sg(p)} = 180, so ${I('x')} = ${x}. The angles are ${angs.join('°, ')}°, and the largest is ${mx}°.`); }
      const [E, d] = pickOK(R, () => [R.int(60, 170), R.int(4, 60)], ([E, d]) => (E + d) % 2 === 0 && d < E, [100, 20]), A = (E + d) / 2;
      return num(`The exterior angle at C of triangle ABC is ${E}°. Angle A is ${d}° more than angle B. Find angle A, in degrees.`, A,
        `An exterior angle equals the two far inside angles: A + B = ${E}°. With A − B = ${d}°, A = (${E} + ${d}) ÷ 2 = ${A}°.`); } },
    { t: 'bisectors and isosceles chains', g: R => {
      const kd = R.int(0, 2);
      if (kd === 0) { const x = R.int(10, 70) * 2;
        return num(`In triangle ABC, ∠A = ${x}°. The bisectors of ∠B and ∠C meet at I. Find ∠BIC, in degrees.`, 90 + x / 2,
          `∠B + ∠C = ${180 - x}°, so half of each adds to ${(180 - x) / 2}°. In triangle BIC, ∠BIC = 180 − ${(180 - x) / 2} = ${90 + x / 2}°.`); }
      if (kd === 1) { const x = R.int(10, 70) * 2;
        return num(`In triangle ABC, ∠A = ${x}°. The bisectors of the exterior angles at B and C meet at E. Find ∠BEC, in degrees.`, 90 - x / 2,
          `The exterior angles at B and C add to 360 − (∠B + ∠C) = 180 + ${x} = ${180 + x}°. Their halves add to ${(180 + x) / 2}°, so ∠BEC = 180 − ${(180 + x) / 2} = ${90 - x / 2}°.`); }
      const x = R.int(10, 29) * 2, be = (180 - x) / 2;
      return num(`In triangle ABC, AB = AC and ∠A = ${x}°. Point D is on AC with BD = BC. Find ∠ABD, in degrees.`, be - x,
        `The base angles are (180 − ${x}) ÷ 2 = ${be}°. Triangle BCD is isosceles too, so ∠BDC = ∠C = ${be}° and ∠DBC = 180 − 2 × ${be} = ${x}°. So ∠ABD = ${be} − ${x} = ${be - x}°.`); } });

  B('III.8.07',
    { t: 'cut-outs and perimeter', g: (R, O) => {
      const u = U(O).s, a = R.int(8, 20), b = R.int(6, 16);
      if (R.bool()) { const c = R.int(2, a - 2), d = R.int(2, b - 2);
        return num(`A rectangle measures ${a} ${u} by ${b} ${u}. A piece ${c} ${u} by ${d} ${u} is cut from one corner. Find the area and perimeter of what is left.`, [{ label: 'area =', ans: a * b - c * d }, { label: 'perimeter =', ans: 2 * (a + b) }],
          `Area: ${a * b} − ${c * d} = ${a * b - c * d} ${u}². Perimeter: the two new edges just replace the two cut edges, so it is still 2(${a} + ${b}) = ${2 * (a + b)} ${u}.`); }
      const c = R.int(2, a - 4), d = R.int(2, b - 2);
      return num(`A rectangle measures ${a} ${u} by ${b} ${u}. A notch ${c} ${u} wide and ${d} ${u} deep is cut from the middle of one ${a} ${u} side. Find the area and perimeter of what is left.`, [{ label: 'area =', ans: a * b - c * d }, { label: 'perimeter =', ans: 2 * (a + b) + 2 * d }],
        `Area: ${a * b} − ${c * d} = ${a * b - c * d} ${u}². Perimeter: the notch floor replaces the gap, but its two sides add 2 × ${d}: ${2 * (a + b)} + ${2 * d} = ${2 * (a + b) + 2 * d} ${u}.`); } },
    { t: 'a square in a square', g: (R, O) => {
      const u = U(O).s;
      if (R.bool()) { const [a, b] = R.distinct(1, 9, 2);
        return num(`A square has side ${a + b} ${u}. On each side, mark the point ${a} ${u} from a corner, going around the square the same way. Joining the four points makes a tilted square. What is its area, in ${u}²?`, a * a + b * b,
          `Cut off 4 right triangles with legs ${a} and ${b}: ${(a + b) ** 2} − 4 × ½ × ${a} × ${b} = ${(a + b) ** 2} − ${2 * a * b} = ${a * a + b * b} ${u}².`); }
      const [S, s] = pickOK(R, () => [R.int(6, 20), R.int(1, 12)], ([S, s]) => S > s + 1 && (S - s) % 2 === 0, [10, 4]);
      return num(`Four identical rectangles are placed around a square hole to make a big square. The big square has side ${S} ${u} and the hole has side ${s} ${u}. What is the area of one rectangle, in ${u}²?`, (S * S - s * s) / 4,
        `The four rectangles fill the big square minus the hole: ${S * S} − ${s * s} = ${S * S - s * s}. One rectangle is a quarter: ${fmt((S * S - s * s) / 4)} ${u}².`); } });

  B('III.8.10',
    { t: 'rings and radii', g: (R, O) => {
      const u = U(O).s, kd = R.int(0, 2);
      if (kd === 0) { const [r, Rr] = R.distinct(1, 12, 2).sort((x, y) => x - y);
        return num(`Two circles share a center. Their radii are ${Rr} ${u} and ${r} ${u}. The ring between them has area ${I('k')}π ${u}². What is ${I('k')}?`, [{ label: 'k =', ans: Rr * Rr - r * r }],
          `Big circle minus small circle: π × ${Rr}² − π × ${r}² = (${Rr * Rr} − ${r * r})π = ${Rr * Rr - r * r}π.`); }
      if (kd === 1) { const r = R.int(2, 15);
        return num(`A circle has circumference ${2 * r}π ${u}. Its area is ${I('k')}π ${u}². What is ${I('k')}?`, [{ label: 'k =', ans: r * r }],
          `C = 2πr = ${2 * r}π, so r = ${r}. Area = π × ${r}² = ${r * r}π.`); }
      const r = R.int(2, 15);
      return num(`A circle has area ${r * r}π ${u}². Its circumference is ${I('k')}π ${u}. What is ${I('k')}?`, [{ label: 'k =', ans: 2 * r }],
        `πr² = ${r * r}π, so r = ${r}. C = 2π × ${r} = ${2 * r}π.`); } },
    { t: 'circles and squares', g: (R, O) => {
      const u = U(O).s, kd = R.int(0, 2);
      if (kd === 0) { const S = R.int(2, 40) * 2;
        return num(`A square with area ${S} ${u}² fits exactly inside a circle, with its corners on the circle. The circle's area is ${I('k')}π ${u}². What is ${I('k')}?`, [{ label: 'k =', ans: S / 2 }],
          `The square's diagonal is the diameter. diagonal² = side² + side² = 2 × ${S} = ${2 * S}, so (2r)² = ${2 * S} and r² = ${S / 2}. Area = ${S / 2}π.`); }
      if (kd === 1) { const S = R.int(1, 30) * 4;
        return num(`A circle fits exactly inside a square with area ${S} ${u}², touching all four sides. The circle's area is ${I('k')}π ${u}². What is ${I('k')}?`, [{ label: 'k =', ans: S / 4 }],
          `The diameter equals the side, so (2r)² = ${S} and r² = ${S / 4}. Area = ${S / 4}π.`); }
      const L = R.int(2, 15) * 2;
      return num(`Two circles share a center. A chord of the big circle is ${L} ${u} long and just touches the small circle. The ring between them has area ${I('k')}π ${u}². What is ${I('k')}?`, [{ label: 'k =', ans: L * L / 4 }],
        `Half the chord (${L / 2}), the small radius r and the big radius R make a right triangle: R² − r² = ${L / 2}² = ${L * L / 4}. Ring area = π(R² − r²) = ${L * L / 4}π, whatever the radii are.`); } });

  const SC = [[2, 'doubled'], [3, 'tripled'], [1 / 2, 'halved'], [1 / 3, 'cut to a third']];
  B('III.8.12',
    { t: 'whole cubes, or scaling', g: (R, O) => {
      const u = U(O).s;
      if (R.bool()) { const s = R.pick([2, 3]), [a, b, c] = pickOK(R, () => [R.int(3, 15), R.int(3, 15), R.int(3, 15)], d => d.some(v => v % s), [5, 6, 7]);
        const f = [a, b, c].map(v => Math.floor(v / s)), ans = f[0] * f[1] * f[2], naive = Math.floor(a * b * c / s ** 3);
        return num(`How many ${s} ${u} cubes can fit inside a box that is ${a} × ${b} × ${c} ${u}?`, ans,
          `Along the edges fit ${f[0]}, ${f[1]} and ${f[2]} whole cubes; the leftover gaps can't hold a cube. ${f[0]} × ${f[1]} × ${f[2]} = ${ans}${naive !== ans ? `, not ${a * b * c} ÷ ${s ** 3} ≈ ${naive}` : ''}.`); }
      const [f1, f2, f3] = [R.pick(SC), R.pick(SC), R.pick(SC)], prod = f1[0] * f2[0] * f3[0], V = R.int(1, 12) * 36, ans = Math.round(V * prod), fs = [f1, f2, f3].map(f => f[0] < 1 ? fh(1, Math.round(1 / f[0])) : f[0]);
      return num(`A box has volume ${V} ${u}³. Its length is ${f1[1]}, its width is ${f2[1]}, and its height is ${f3[1]}. What is its new volume, in ${u}³?`, ans,
        `Volume = length × width × height, so it is multiplied by ${fs.join(' × ')}: ${V} → ${ans} ${u}³.`); } },
    { t: 'volume by insight', g: (R, O) => {
      const u = U(O).s;
      if (R.bool()) { const [a, b, c] = R.distinct(2, 12, 3), V = a * b * c;
        return num(`A box has faces with areas ${a * b}, ${b * c} and ${a * c} ${u}². What is its volume, in ${u}³?`, V,
          `Multiply the three areas: (${I('ab')})(${I('bc')})(${I('ca')}) = (${I('abc')})² = ${a * b * b * c * a * c}. So the volume is √${a * b * b * c * a * c} = ${V} ${u}³ (the edges are ${[a, b, c].sort((x, y) => x - y).join(', ')}).`); }
      const opts = []; for (const s of [4, 6, 8, 10]) for (const r of [1, 2, 3, 4]) { const base = s ** 3 / r; if (!Number.isInteger(base)) continue; for (let L = s + 1; L * L <= base; L++) if (base % L === 0 && base / L > s) opts.push([s, r, L, base / L]); }
      const [s, r, L, W] = R.pick(opts), h = R.int(s, s + 10);
      return num(`A tank has a base of ${L} × ${W} ${u} and water ${h} ${u} deep. A solid cube with ${s} ${u} edges sinks to the bottom. How deep is the water now, in ${u}?`, h + r,
        `The cube pushes up ${s}³ = ${s ** 3} ${u}³ of water, spread over the ${L * W} ${u}² base: ${s ** 3} ÷ ${L * W} = ${r} ${u}. New depth: ${h} + ${r} = ${h + r} ${u}.`); } });

  const TRIP = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [6, 8, 10], [9, 12, 15], [20, 21, 29], [12, 16, 20], [15, 20, 25], [10, 24, 26], [9, 40, 41], [12, 35, 37]];
  B('III.8.15',
    { t: 'two right triangles inside', g: (R, O) => {
      const u = U(O).s, [x, y, c] = R.pick(TRIP), [a0, b0] = R.bool() ? [x, y] : [y, x];
      if (R.bool()) return num(`An isosceles triangle has sides ${c}, ${c} and ${2 * a0} ${u}. What is its area, in ${u}²?`, a0 * b0,
        `The height cuts the base in half, ${a0}. Height = √(${c}² − ${a0}²) = √${c * c - a0 * a0} = ${b0}. Area = ½ × ${2 * a0} × ${b0} = ${a0 * b0} ${u}².`);
      return num(`A rhombus has diagonals ${2 * a0} ${u} and ${2 * b0} ${u}. How long is each side, in ${u}?`, c,
        `The diagonals cut each other in half at right angles, making right triangles with legs ${a0} and ${b0}. Side = √(${a0 * a0} + ${b0 * b0}) = ${c} ${u}.`); } },
    { t: 'sliding ladder, or no sides needed', g: (R, O) => {
      const u = U(O).b;
      if (R.bool()) { const cs = [10, 13, 15, 17, 20, 25, 26, 29, 30, 34, 50, 65], c = R.pick(cs), xs = []; for (let x = 1; x < c; x++) if (isSq(c * c - x * x)) xs.push(x);
        const [x1, x2] = R.sample(xs, 2).sort((p, q) => p - q), y1 = Math.sqrt(c * c - x1 * x1), y2 = Math.sqrt(c * c - x2 * x2);
        return num(`A ${c} ${u} ladder leans against a wall with its foot ${x1} ${u} from the wall. The foot slides out to ${x2} ${u} from the wall. How far does the top slide down, in ${u}?`, y1 - y2,
          `Top before: √(${c}² − ${x1}²) = ${y1}. Top after: √(${c}² − ${x2}²) = ${y2}. It slides ${y1} − ${y2} = ${y1 - y2} ${u}.`); }
      const [l, w] = R.distinct(2, 15, 2), d2 = l * l + w * w, P2 = 2 * (l + w), ds = isSq(d2) ? String(Math.sqrt(d2)) : `√${d2}`;
      return num(`A rectangle has perimeter ${P2} ${u} and a diagonal of ${ds} ${u}. What is its area, in ${u}²?`, l * w,
        `${I('l')} + ${I('w')} = ${l + w} and ${I('l')}² + ${I('w')}² = ${d2}. Since (${I('l')} + ${I('w')})² = ${I('l')}² + ${I('w')}² + 2${I('lw')}: 2${I('lw')} = ${(l + w) ** 2} − ${d2} = ${2 * l * w}, so the area is ${l * w} ${u}².`); } });

  const KF = [[2, 1], [3, 1], [4, 1], [1, 2], [1, 3], [3, 2], [2, 3], [5, 2], [4, 3], [3, 4], [5, 3]];
  const PHOTO = [[2, 3, 125], [4, 5, 56.25], [1, 2, 300], [2, 5, 525], [1, 3, 800], [5, 6, 44], [4, 7, 206.25], [5, 7, 96], [5, 8, 156], [5, 9, 224], [10, 11, 21], [10, 13, 69]];
  B('III.8.22',
    { t: 'from areas to scale', g: (R, O) => {
      const u = U(O).s;
      if (R.bool(0.6)) { const [p, q] = R.pick(KF), t = R.int(1, 6), A = q * q * t, Bv = p * p * t;
        return num(`A shape has area ${A} ${u}². After a dilation its area is ${Bv} ${u}². What is the scale factor?`, [frac(p, q)],
          `Area scales by the square of the scale factor: ${Bv} ÷ ${A} = ${FR(p * p, q * q)}, so the scale factor is ${FR(p, q)}.`); }
      const k = R.int(2, 5), Pp = R.int(6, 40);
      return num(`A dilation makes a shape's area ${k * k} times as big. Its perimeter was ${Pp} ${u}. What is it now, in ${u}?`, Pp * k,
        `Area × ${k * k} means the scale factor is √${k * k} = ${k}. Lengths, like the perimeter, scale by ${k}: ${Pp} × ${k} = ${Pp * k} ${u}.`); } },
    { t: 'find the center, or the area change', g: (R, O) => {
      if (R.bool()) {
        for (let t = 0; t < 400; t++) {
          const h = R.int(-4, 4), k = R.int(-4, 4), f = R.pick([2, 3, -1, -2]), A = [R.int(-4, 4), R.int(-4, 4)], Bp = [R.int(-4, 4), R.int(-4, 4)];
          if ((A[0] === Bp[0] && A[1] === Bp[1]) || (A[0] === h && A[1] === k) || (Bp[0] === h && Bp[1] === k)) continue;
          const im = ([x, y]) => [h + f * (x - h), k + f * (y - k)], A2 = im(A), B2 = im(Bp);
          if ([...A2, ...B2].some(v => Math.abs(v) > 16)) continue;
          const pt = ([x, y]) => `(${N(x)}, ${N(y)})`, dx = Bp[0] - A[0], dy = Bp[1] - A[1];
          return num(`A dilation maps A${pt(A)} to A′${pt(A2)} and B${pt(Bp)} to B′${pt(B2)}. Find the center of the dilation.`, [{ label: 'x =', ans: h }, { label: 'y =', ans: k }],
            `A to B moves (${N(dx)}, ${N(dy)}) and A′ to B′ moves (${N(f * dx)}, ${N(f * dy)}), so the scale factor is ${N(f)}. The center C has A′ − C = ${N(f)}(A − C), so C = (A′ − ${P(f)}A) ÷ ${1 - f} = (${N(h)}, ${N(k)}).`);
        }
        return num('A dilation maps A(1, 1) to A′(2, 2) and B(2, 1) to B′(4, 2). Find the center of the dilation.', [{ label: 'x =', ans: 0 }, { label: 'y =', ans: 0 }], 'The scale factor is 2, and C = (A′ − 2A) ÷ (1 − 2) = (0, 0).');
      }
      const u = U(O).s, [r0, r1, pc] = R.pick(PHOTO), t = R.int(1, 3), w = r0 * t, W = r1 * t, h = R.int(w + 1, w + 12);
      return num(`A photo is ${w} ${u} by ${h} ${u}. It is enlarged so that the ${w} ${u} side becomes ${W} ${u}. By what percent does its area increase?`, pc,
        `The scale factor is ${W} ÷ ${w} = ${FR(r1, r0)}, so the area is multiplied by (${FR(r1, r0)})² = ${fmt(1 + pc / 100)}. That is an increase of ${fmt(pc)}%.`); } });

  /* =================== III.9 Statistics and probability =================== */
  B('III.9.02',
    { t: 'the missing value', g: R => {
      if (R.bool()) {
        for (let t = 0; t < 400; t++) { const n = R.int(4, 7), vs = Array.from({ length: n - 1 }, () => R.int(10, 40)), M = R.int(15, 35), x = n * M - vs.reduce((a, b) => a + b, 0);
          if (x < 1 || x > 60) continue;
          return num(`The mean of ${n} numbers is ${M}. ${n - 1} of them are ${vs.join(', ')}. What is the missing number?`, x,
            `The ${n} numbers add to ${n} × ${M} = ${n * M}. The known ones add to ${n * M - x}, so the missing one is ${n * M} − ${n * M - x} = ${x}.`); }
      }
      for (let t = 0; t < 400; t++) { const n = R.int(3, 5), vs = Array.from({ length: n }, () => R.int(60, 95)), s = vs.reduce((a, b) => a + b, 0), T = Math.ceil(s / n) + R.int(1, 6), x = T * (n + 1) - s;
        if (x < 60 || x > 100) continue;
        return num(`Your test scores are ${vs.join(', ')}. What must you score on the next test to make your mean exactly ${T}?`, x,
          `${n + 1} tests with mean ${T} add to ${n + 1} × ${T} = ${T * (n + 1)}. You have ${s}, so you need ${T * (n + 1)} − ${s} = ${x}.`); }
      return num('Your test scores are 80, 90. What must you score on the next test to make your mean exactly 88?', 94, '3 × 88 = 264, and 264 − 170 = 94.'); } },
    { t: 'means that move', g: R => {
      if (R.bool()) { const [n, M, M2] = pickOK(R, () => [R.int(5, 12), R.int(10, 40), R.int(10, 40)], ([n, M, M2]) => M !== M2 && n * M - (n - 1) * M2 >= 1 && n * M - (n - 1) * M2 <= 99, [5, 20, 18]), x = n * M - (n - 1) * M2;
        return num(`The mean of ${n} numbers is ${M}. When one number is removed, the mean of the rest is ${M2}. What number was removed?`, x,
          `Totals: ${n} × ${M} = ${n * M} before and ${n - 1} × ${M2} = ${(n - 1) * M2} after. The removed number is ${n * M} − ${(n - 1) * M2} = ${x}.`); }
      const [n, M, d] = pickOK(R, () => [R.int(4, 12), R.int(10, 40), nz(R, -3, 4)], ([n, M, d]) => M + (n + 1) * d > 0, [5, 20, 2]), x = M + (n + 1) * d;
      return num(`The mean of ${n} numbers is ${M}. Adding one more number ${d > 0 ? 'raises' : 'lowers'} the mean to ${M + d}. What number was added?`, x,
        `New total: ${n + 1} × ${M + d} = ${(n + 1) * (M + d)}. Old total: ${n} × ${M} = ${n * M}. The new number is ${(n + 1) * (M + d)} − ${n * M} = ${x}.`); } });

  B('III.9.03',
    { t: 'mean equals median', g: R => {
      const [a, b, c, d, x] = pickOK(R, () => { const v = R.distinct(1, 30, 4).sort((p, q) => p - q); return [...v, 5 * v[2] - v.reduce((p, q) => p + q, 0)]; }, v => v[4] > v[3] && v[4] <= 90, [2, 4, 10, 12, 22]);
      return num(`The numbers ${R.shuffle([a, b, c, d]).join(', ')} and ${I('x')} have a mean equal to their median. ${I('x')} is the largest of the five. What is ${I('x')}?`, x,
        `With ${I('x')} largest, the median is ${c}. So the five numbers add to 5 × ${c} = ${5 * c}, and ${I('x')} = ${5 * c} − ${a + b + c + d} = ${x}.`); } },
    { t: 'the largest possible', g: R => {
      const [mo, md, e, M] = pickOK(R, () => { const mo = R.int(1, 10), md = mo + R.int(1, 10), e = md + R.int(2, 30); return [mo, md, e, (2 * mo + 2 * md + 1 + e) / 5]; }, v => Number.isInteger(v[3]), [3, 5, 9, 5]);
      return num(`A list of five positive whole numbers has mean ${M}, median ${md}, and a single mode of ${mo}. What is the largest possible number in the list?`, e,
        `The mode ${mo} is below the median, so it fills both lower places: ${mo}, ${mo}, ${md}, ?, ?. Keep the fourth as small as it can be, ${md + 1} (${md} would tie as a mode). The total is 5 × ${M} = ${5 * M}, so the largest is ${5 * M} − ${2 * mo + 2 * md + 1} = ${e}.`); } });

  B('III.9.13',
    { t: 'work back to the count', g: R => {
      const r = R.int(2, 12), b = R.int(1, 20), g = gcd(r, r + b), p = r / g, q = (r + b) / g;
      return num(`A bag has ${r} red marbles and some blue ones. The probability of picking red is ${fh(p, q)}. How many blue marbles are there?`, b,
        `${r} is ${fh(p, q)} of the total, so the total is ${r} ÷ ${fh(p, q)} = ${r + b}. Blue: ${r + b} − ${r} = ${b}.`); } },
    { t: 'change the odds, or count', g: R => {
      if (R.bool()) { const [r, b, x] = pickOK(R, () => [R.int(1, 10), R.int(2, 12), R.int(1, 20)], ([r, b, x]) => (r + b + x) / gcd(r + x, r + b + x) <= 12, [2, 4, 4]);
        const g = gcd(r + x, r + b + x), p = (r + x) / g, q = (r + b + x) / g;
        return num(`A bag has ${r} red and ${b} blue marbles. How many red marbles must be added so the probability of red is ${fh(p, q)}?`, x,
          `The ${b} blue stay and must be ${fh(q - p, q)} of the bag, so the bag holds ${b} ÷ ${fh(q - p, q)} = ${r + b + x}. Add ${r + b + x} − ${r + b} = ${x} red.`); }
      const [a, b] = pickOK(R, () => R.distinct(2, 7, 2).sort((p, q) => p - q), ([a, b]) => b % a !== 0, [2, 3]), Nn = R.int(30, 100), L = lcm(a, b);
      const ca = Math.floor(Nn / a), cb = Math.floor(Nn / b), cl = Math.floor(Nn / L), cnt = ca + cb - cl;
      return num(`A whole number from 1 to ${Nn} is picked at random. What is the probability that it is a multiple of ${a} or ${b}?`, [frac(cnt, Nn)],
        `Multiples of ${a}: ${ca}. Of ${b}: ${cb}. Both (multiples of ${L}) were counted twice: ${cl}. So ${ca} + ${cb} − ${cl} = ${cnt}, and the probability is ${FR(cnt, Nn)}.`); } });

  const choose = (n, k) => { let r = 1; for (let i = 1; i <= k; i++) r = r * (n - k + i) / i; return Math.round(r); };
  B('III.9.15',
    { t: 'count with a rule', g: R => {
      if (R.bool()) { const n = R.int(4, 8), k = R.int(2, Math.min(4, n - 1)), fs = Array.from({ length: k }, (_, i) => n - i), ans = fs.reduce((a, b) => a * b, 1);
        return num(`How many ${k}-digit codes can you make from the digits 1 to ${n} if no digit repeats?`, ans,
          `${n} choices for the first digit, then one fewer each time: ${fs.join(' × ')} = ${ans}.`); }
      const S = R.int(3, 11), pairs = []; for (let a = 1; a <= 6; a++) { const b = S - a; if (b >= 1 && b <= 6) pairs.push(`(${a}, ${b})`); }
      return num(`Two dice are rolled. In how many of the 36 outcomes is the sum ${S}?`, pairs.length, `List first die, second die: ${pairs.join(', ')}. That is ${pairs.length}.`); } },
    { t: 'count every way', g: R => {
      const kd = R.int(0, 2);
      if (kd === 0) { const S = R.int(2, 9), ans = S * (S + 1) / 2;
        return num(`How many three-digit numbers have digits that add up to ${S}?`, ans,
          `Pick the first digit h from 1 to ${S}. The last two digits must add to ${S} − h, which can be done ${S} − h + 1 ways. Total: ${Array.from({ length: S }, (_, i) => S - i).join(' + ')} = ${ans}.`); }
      if (kd === 1) { const S = R.int(4, 10), per = []; let tot = 0;
        for (let f = 1; f <= 6; f++) { let c = 0; for (let a = 1; a <= 6; a++) { const b = S - f - a; if (b >= 1 && b <= 6) c++; } if (c) per.push(`${f}: ${c}`); tot += c; }
        return num(`Three dice are rolled. In how many of the 216 outcomes is the sum ${S}?`, tot,
          `Fix the first die, then count the ways the other two make the rest. First die ${per.join(', ')}. Total ${tot}.`); }
      const a = R.int(2, 5), b = R.int(2, 5), ans = choose(a + b, a);
      return num(`On a grid, you walk from one corner of a ${a} by ${b} rectangle to the opposite corner, moving only right or up along grid lines. How many different paths are there?`, ans,
        `Every path is ${a + b} moves: ${a} rights and ${b} ups. Choose which ${a} of the ${a + b} moves are rights: ${ans} ways.`); } });

  B('III.9.16',
    { t: 'without putting back', g: R => {
      const r = R.int(2, 7), b = R.int(2, 7), n = r + b, kd = R.int(0, 2), tot = n * (n - 1);
      const head = `A bag holds ${r} red and ${b} blue marbles. You pick two without putting the first back.`;
      if (kd === 0) return num(`${head} What is the probability both are red? Give a fraction.`, [frac(r * (r - 1), tot)],
        `${fh(r, n)} × ${fh(r - 1, n - 1)} = ${fh(r * (r - 1), tot)} = ${FR(r * (r - 1), tot)}. After one red is gone, only ${r - 1} of ${n - 1} are red.`);
      if (kd === 1) return num(`${head} What is the probability of one of each color? Give a fraction.`, [frac(2 * r * b, tot)],
        `Red then blue: ${fh(r, n)} × ${fh(b, n - 1)}. Blue then red: ${fh(b, n)} × ${fh(r, n - 1)}. Together ${fh(2 * r * b, tot)} = ${FR(2 * r * b, tot)}.`);
      return num(`${head} What is the probability they are the same color? Give a fraction.`, [frac(r * (r - 1) + b * (b - 1), tot)],
        `Both red: ${fh(r * (r - 1), tot)}. Both blue: ${fh(b * (b - 1), tot)}. Add: ${fh(r * (r - 1) + b * (b - 1), tot)} = ${FR(r * (r - 1) + b * (b - 1), tot)}.`); } },
    { t: 'two dice, one clever count', g: R => {
      const Nd = R.pick([4, 6, 8]), T = Nd * Nd, dice = Nd === 6 ? 'Two fair dice are rolled.' : `Two fair ${Nd}-sided dice, numbered 1 to ${Nd}, are rolled.`, kd = R.int(0, 2);
      if (kd === 0) { const k = R.int(2, Nd);
        return num(`${dice} What is the probability that the highest number showing is ${k}? Give a fraction.`, [frac(2 * k - 1, T)],
          `Both dice are at most ${k} in ${k}² = ${k * k} ways, and both at most ${k - 1} in ${(k - 1) ** 2}. So the highest is exactly ${k} in ${2 * k - 1} of ${T} outcomes: ${FR(2 * k - 1, T)}.`); }
      if (kd === 1) { const d = R.int(1, Nd - 1), c = 2 * (Nd - d);
        return num(`${dice} What is the probability that the two numbers differ by exactly ${d}? Give a fraction.`, [frac(c, T)],
          `The smaller number can be 1 to ${Nd - d}, and either die can be the larger: 2 × ${Nd - d} = ${c} of ${T} outcomes, so ${FR(c, T)}.`); }
      const mm = R.pick([3, 4, 5].filter(v => v <= Nd)); let c = 0; for (let a = 1; a <= Nd; a++) for (let b = 1; b <= Nd; b++) if ((a + b) % mm === 0) c++;
      const sums = []; for (let s = mm; s <= 2 * Nd; s += mm) { let w = 0; for (let a = 1; a <= Nd; a++) { const b = s - a; if (b >= 1 && b <= Nd) w++; } sums.push(`${s} (${w})`); }
      return num(`${dice} What is the probability that the sum is a multiple of ${mm}? Give a fraction.`, [frac(c, T)],
        `Count the ways for each multiple of ${mm}: ${sums.join(', ')}. That is ${c} of ${T}: ${FR(c, T)}.`); } });
})();
