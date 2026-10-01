/* Era II · optional brave steps e (★ Brave) and f (★★ Legend) for selected skills.
   Loaded after s0–s2. Each call attaches e and f to an existing skill. */
(function () {
  const B = (id, e, f) => { const s = E2.byId[id]; if (!s) throw new Error('brave: no skill ' + id); if (s.steps.e) throw new Error('brave: duplicate ' + id); for (const st of [e, f]) { const g0 = st.g; st.g = (R, O) => E2.tidy(g0(R, O)); } s.steps.e = e; s.steps.f = f; };
  // B('X.N.NN', { t: '…', g: (R, O) => … }, { t: '…', g: (R, O) => … });
  const { num, choice, tf, fmt, frac, fh, gcd, lcm } = E2;

  /* ---------- shared helpers ---------- */
  const F = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');          // commas from 1,000
  const gen = (f, ok, max = 5000) => { for (let i = 0; i < max; i++) { const x = f(); if (ok(x)) return x; } throw new Error('brave gen failed'); };
  const NAMES = ['Mia', 'Leo', 'Ana', 'Raj', 'Kim', 'Sam', 'Zoe', 'Eli', 'Nia', 'Ben', 'Ava', 'Kai'];
  const PL = ['ones', 'tens', 'hundreds', 'thousands', 'ten thousands'];
  const perms = arr => arr.length <= 1 ? [arr.slice()] : arr.flatMap((x, i) => perms(arr.slice(0, i).concat(arr.slice(i + 1))).map(p => [x, ...p]));
  const digitsOf = (n, L) => String(n).padStart(L, '0').split('').map(Number).reverse(); // ones first
  const box = '□';
  const LEN = O => O.units === 'imperial' ? 'in' : 'cm';
  const sq = n => n * n;
  const listAnd = a => a.length === 1 ? String(a[0]) : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1];
  const factStr = n => { const out = []; let m = n; for (let p = 2; p * p <= m; p++) while (m % p === 0) { out.push(p); m /= p; } if (m > 1) out.push(m); return out; };
  const nFactors = n => { let c = 0; for (let k = 1; k <= n; k++) if (n % k === 0) c++; return c; };
  const isPrime = n => n > 1 && nFactors(n) === 2;
  const ceilDiv = (a, b) => Math.floor((a + b - 1) / b);

  // column puzzle with two hidden digits (one in each number, different columns). op '+' or '−'.
  // A, B, Res are integers; L = number of columns shown for A and B; fmtN turns an array of digit strings (high→low) into text.
  function hidePair(R, A, B, op, L, placeNames, fmtN) {
    const res = op === '+' ? A + B : A - B;
    const a = digitsOf(A, L), b = digitsOf(B, L), bl = String(B).length;
    const pa = R.int(0, L - 1); let pb; do pb = R.int(0, bl - 1); while (pb === pa);
    // carry / borrow into each column
    const cin = [0];
    for (let p = 0; p < L; p++) cin.push(op === '+' ? (a[p] + b[p] + cin[p] >= 10 ? 1 : 0) : (a[p] - cin[p] - b[p] < 0 ? 1 : 0));
    const show = (d, p, len) => fmtN(d.slice(0, len).map((x, i) => i === p ? box : String(x)).reverse());
    const rd = digitsOf(res, L + 1);
    const why = (who, p) => {
      const c = cin[p], s = rd[p], nm = placeNames[p], x = who === 'A' ? a[p] : b[p];
      if (op === '+') { const other = who === 'A' ? b[p] : a[p]; return `${nm}: ${box} + ${other}${c ? ' + 1 carried' : ''} ends in ${s}, so ${box} = ${x}`; }
      if (who === 'A') return `${nm}: ${box} take away ${b[p]}${c ? ' and the 1 borrowed' : ''} leaves ${s}, so ${box} = ${x}`;
      return `${nm}: ${a[p]}${c ? ' (less the 1 borrowed)' : ''} take away ${box} leaves ${s}, so ${box} = ${x}`;
    };
    return { res, aTxt: show(a, pa, String(A).length), bTxt: show(b, pb, bl), da: a[pa], db: b[pb], whyA: why('A', pa), whyB: why('B', pb), pa, pb };
  }
  const nCarries = (A, B, L) => { const a = digitsOf(A, L), b = digitsOf(B, L); let c = 0, n = 0; for (let p = 0; p < L; p++) { c = a[p] + b[p] + c >= 10 ? 1 : 0; n += c; } return n; };
  const nBorrows = (A, B, L) => { const a = digitsOf(A, L), b = digitsOf(B, L); let c = 0, n = 0; for (let p = 0; p < L; p++) { c = a[p] - c - b[p] < 0 ? 1 : 0; n += c; } return n; };

  // money: US in cents, THB in whole baht
  const THB = O => O.coins === 'THB';
  const M = (O, c) => THB(O) ? `${F(c)} baht` : `$${(c / 100).toFixed(2)}`;
  const Mf = (O, c) => THB(O) ? { label: 'baht', ans: c } : { label: '$', ans: c / 100 };

  // tiny evaluator for + − × and brackets (integers)
  function evalStr(s) {
    s = s.replace(/\s+/g, ''); let i = 0;
    const E = () => { let v = T(); while (s[i] === '+' || s[i] === '−') { const o = s[i++]; const w = T(); v = o === '+' ? v + w : v - w; } return v; };
    const T = () => { let v = P(); while (s[i] === '×') { i++; v *= P(); } return v; };
    const P = () => { if (s[i] === '(') { i++; const v = E(); i++; return v; } const m = /^\d+/.exec(s.slice(i)); i += m[0].length; return +m[0]; };
    return E();
  }

  /* =================== II.1 Place value to millions =================== */

  B('II.1.06',
    { t: 'work backwards', g: R => {
      const u = R.pick([100, 1000, 10000]), T = u * (u === 10000 ? R.int(2, 99) : R.int(11, 99)), lo = T - u / 2, hi = T + u / 2 - 1;
      return num(`A whole number rounds to ${F(T)} when rounded to the nearest ${F(u)}. What are the smallest and largest it could be?`, [{ label: 'smallest', ans: lo }, { label: 'largest', ans: hi }],
        `${F(lo)} is halfway, so it rounds up to ${F(T)}. ${F(hi)} still rounds down, but ${F(hi + 1)} would round up to ${F(T + u)}.`);
    } },
    { t: 'digits that round right', g: R => {
      const r1000 = n => Math.floor((n + 500) / 1000) * 1000;
      const { ds, T, ok } = gen(() => {
        const ds = R.sample([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], 5).sort((x, y) => x - y);
        const all = perms(ds).filter(p => p[0] !== 0).map(p => +p.join(''));
        const T = r1000(R.pick(all)); return { ds, T, ok: all.filter(n => r1000(n) === T) };
      }, o => o.ok.length >= 3);
      const big = R.bool(), ans = big ? Math.max(...ok) : Math.min(...ok);
      return num(`Use each of the digits ${ds.join(', ')} once to make a 5-digit number that rounds to ${F(T)} (nearest thousand). What is the ${big ? 'largest' : 'smallest'} number you can make?`, [{ ans }],
        `It must be from ${F(T - 500)} to ${F(T + 499)}. ${ok.length} numbers work; the ${big ? 'largest' : 'smallest'} is ${F(ans)}.`);
    } });

  B('II.1.09',
    { t: 'missing digits', g: R => {
      const L = R.pick([3, 4]);
      const [A, Bn] = gen(() => [R.int(10 ** (L - 1), 10 ** L - 1), R.int(10 ** (L - 1), 10 ** L - 1)], ([a, b]) => nCarries(a, b, L) >= 2);
      const h = hidePair(R, A, Bn, '+', L, ['Ones', 'Tens', 'Hundreds', 'Thousands'], d => d.join(''));
      return num(`Find the missing digits: ${h.aTxt} + ${h.bTxt} = ${h.res}`, [{ label: 'first □', ans: h.da }, { label: 'second □', ans: h.db }],
        `Work from the ones, carrying as you go. ${h.pa < h.pb ? h.whyA + '. ' + h.whyB : h.whyB + '. ' + h.whyA}. Check: ${A} + ${Bn} = ${h.res}.`);
    } },
    { t: 'digit puzzle', g: R => {
      if (R.bool()) {
        const k = R.int(3, 17), lo = Math.max(1, k - 9), hi = Math.min(9, k - 1), cnt = hi - lo + 1;
        const ex = []; for (let A = lo; A <= hi; A++) ex.push(10 * A + (k - A));
        return num(`A two-digit number plus the number with its digits swapped makes ${11 * k}. How many two-digit numbers work? (Both numbers must have two digits.)`, [{ ans: cnt }],
          `AB + BA = 10A + B + 10B + A = 11 × (A + B), so A + B = ${k}. The numbers are ${ex.length > 5 ? ex.slice(0, 2).join(', ') + ', …, ' + ex[ex.length - 1] : listAnd(ex)}: ${cnt} in all.`);
      }
      const big = R.bool(), zero = R.bool(0.4);
      const ds = zero ? [0, ...R.sample([1, 2, 3, 4, 5, 6, 7, 8, 9], 5)] : R.sample([1, 2, 3, 4, 5, 6, 7, 8, 9], 6);
      let best = null, bp;
      for (const p of perms(ds)) { if (p[0] === 0 || p[3] === 0) continue; const x = +p.slice(0, 3).join(''), y = +p.slice(3).join(''); if (x > y) continue; const s = x + y; if (best === null || (big ? s > best : s < best)) { best = s; bp = [x, y]; } }
      return num(`Use each of the digits ${ds.slice().sort((a, b) => a - b).join(', ')} once to make two 3-digit numbers. What is the ${big ? 'largest' : 'smallest'} sum you can get?`, [{ ans: best }],
        `Hundreds count 100 times and tens 10 times, so the ${big ? 'largest' : 'smallest'} digits go in the hundreds, then the tens${!big && zero ? ' (but 0 cannot go first)' : ''}. Best: ${bp[0]} + ${bp[1]} = ${F(best)}.`);
    } });

  B('II.1.11',
    { t: 'missing digits', g: R => {
      const L = R.pick([3, 4]);
      const [A, Bn] = gen(() => { const a = R.int(10 ** (L - 1) * 2, 10 ** L - 1), b = R.int(10 ** (L - 1), a - 1); return [a, b]; }, ([a, b]) => b >= 10 ** (L - 1) && nBorrows(a, b, L) >= 2);
      const h = hidePair(R, A, Bn, '−', L, ['Ones', 'Tens', 'Hundreds', 'Thousands'], d => d.join(''));
      return num(`Find the missing digits: ${h.aTxt} − ${h.bTxt} = ${h.res}`, [{ label: 'first □', ans: h.da }, { label: 'second □', ans: h.db }],
        `Work from the ones, borrowing as you go. ${h.pa < h.pb ? h.whyA + '. ' + h.whyB : h.whyB + '. ' + h.whyA}. Check: ${h.res} + ${Bn} = ${A}.`);
    } },
    { t: 'reverse and subtract', g: R => {
      const kind = R.int(0, 2), k = R.int(1, 8);
      if (kind === 0) {
        const ans = 10 * (9 - k);
        return num(`ABC is a 3-digit number and CBA is the same digits reversed (also 3 digits). How many numbers ABC have ABC − CBA = ${99 * k}?`, [{ ans }],
          `ABC − CBA = 100A + C − 100C − A = 99 × (A − C), so A − C = ${k}. C can be 1 to ${9 - k} and B can be any of 10 digits: ${9 - k} × 10 = ${ans}.`);
      }
      const ex = []; for (let s = 1; s + k <= 9; s++) ex.push(kind === 1 ? 10 * (s + k) + s : 10 * s + s + k);
      return num(`How many two-digit numbers get ${9 * k} ${kind === 1 ? 'smaller' : 'bigger'} when you swap their digits? (The new number must also have two digits.)`, [{ ans: 9 - k }],
        `Swapping changes the number by 9 × (the difference of the digits), so the digits differ by ${k}, with the ${kind === 1 ? 'tens' : 'ones'} digit bigger: ${ex.length > 5 ? ex.slice(0, 2).join(', ') + ', …, ' + ex[ex.length - 1] : listAnd(ex)}. That is ${9 - k}.`);
    } });

  /* =================== II.2 Multiplication =================== */

  B('II.2.08',
    { t: 'group it cleverly', g: R => {
      if (R.bool(0.6)) {
        const [p, q] = R.pick([[4, 25], [2, 50], [5, 20], [8, 125], [4, 250], [2, 500], [5, 200], [25, 4], [50, 2], [20, 5]]), m = gen(() => R.int(11, 99), x => x % 10 !== 0);
        const ans = p * q * m;
        return num(`Find ${p} × ${m} × ${q} the clever way.`, [{ ans }], `Swap and group: ${p} × ${q} = ${p * q}, then ${p * q} × ${m} = ${F(ans)}.`);
      }
      const k = R.pick([99, 101, 999, 1001, 9, 11]), m = R.int(12, 89), big = k > 50 ? (k > 500 ? 1000 : 100) : 10, ans = m * k;
      return num(`Find ${m} × ${k} the clever way.`, [{ ans }], `${k} = ${big} ${k < big ? '− 1' : '+ 1'}, so ${m} × ${k} = ${F(m * big)} ${k < big ? '−' : '+'} ${m} = ${F(ans)}.`);
    } },
    { t: 'spot the shared factor', g: R => {
      const kind = R.int(0, 3), a = gen(() => R.int(12, 98), x => x % 10 !== 0);
      if (kind === 0) { const tot = R.pick([10, 100, 100, 1000]), b = R.int(Math.ceil(tot * 0.15), Math.floor(tot * 0.85)), c = tot - b, ans = a * tot;
        const ex = R.bool() ? `${a} × ${b} + ${a} × ${c}` : `${b} × ${a} + ${a} × ${c}`;
        return num(`Work out ${ex} without long multiplication.`, [{ ans }], `Both parts have ${a}: ${a} × (${b} + ${c}) = ${a} × ${tot} = ${F(ans)}.`); }
      if (kind === 1) { const gap = R.pick([10, 100, 20]), c = R.int(11, 89), b = c + gap, ans = a * gap;
        return num(`Work out ${a} × ${b} − ${a} × ${c} without long multiplication.`, [{ ans }], `Both parts have ${a}: ${a} × (${b} − ${c}) = ${a} × ${gap} = ${F(ans)}.`); }
      if (kind === 2) { const tot = R.pick([100, 1000]), b = R.int(Math.ceil(tot * 0.15), Math.floor(tot * 0.85)), ans = tot - b;
        return num(`${a} × ${b} + ${a} × □ = ${F(a * tot)}. What is □?`, [{ ans }], `${F(a * tot)} = ${a} × ${tot}, so ${b} + □ = ${tot} and □ = ${ans}.`); }
      const n = R.pick([9, 19, 29, 39, 49, 59, 69, 79, 89, 99, 999, 199]), ans = n * (n + 1);
      return num(`Work out ${n} × ${n} + ${n} without long multiplication.`, [{ ans }], `${n} × ${n} + ${n} × 1 = ${n} × (${n} + 1) = ${n} × ${n + 1} = ${F(ans)}.`);
    } });

  B('II.2.12',
    { t: 'missing digit', g: R => {
      const A = R.int(12, 98), Bn = R.int(12, 98), P = A * Bn;
      if (R.bool(0.65)) { const pos = R.int(0, 1), s = String(A).split(''), d = +s[pos]; s[pos] = box;
        return num(`${s.join('')} × ${Bn} = ${F(P)}. What is the missing digit?`, [{ ans: d }], `Try it: ${A} × ${Bn} = ${F(P)}, so the digit is ${d}. (${pos === 1 ? `The ones digits must give a product ending in ${P % 10}.` : `Estimate: ${F(P)} ÷ ${Bn} is about ${Math.round(P / Bn / 10) * 10}.`})`); }
      const s = String(P).split(''), pos = R.int(1, s.length - 2), d = +s[pos]; s[pos] = box;
      return num(`${A} × ${Bn} = ${s.join('')}. What is the missing digit?`, [{ ans: d }], `${A} × ${Bn} = ${A} × ${Bn - Bn % 10} + ${A} × ${Bn % 10} = ${F(A * (Bn - Bn % 10))} + ${A * (Bn % 10)} = ${F(P)}, so the digit is ${d}.`);
    } },
    { t: 'best product', g: R => {
      const big = R.bool(), ds = R.sample([1, 2, 3, 4, 5, 6, 7, 8, 9], 4);
      let best = null, bp;
      for (const p of perms(ds)) { const x = 10 * p[0] + p[1], y = 10 * p[2] + p[3]; if (x > y) continue; const v = x * y; if (best === null || (big ? v > best : v < best)) { best = v; bp = p; } }
      const alt = [10 * bp[0] + bp[3], 10 * bp[2] + bp[1]], altV = alt[0] * alt[1];
      return num(`Use each of the digits ${ds.slice().sort((a, b) => a - b).join(', ')} once to make two 2-digit numbers. What is the ${big ? 'largest' : 'smallest'} product you can get?`, [{ ans: best }],
        `Put the two ${big ? 'largest' : 'smallest'} digits in the tens places. Then ${10 * bp[0] + bp[1]} × ${10 * bp[2] + bp[3]} = ${F(best)} ${big ? 'beats' : 'is less than'} ${Math.min(...alt)} × ${Math.max(...alt)} = ${F(altV)}.`);
    } });

  B('II.2.14',
    { t: 'work backwards', g: R => {
      const nm = R.pick(NAMES), n = R.int(3, 30), k = R.int(3, 9), c = R.int(4, 40), kind = R.int(0, 2);
      if (kind === 0) { const r = n * k + c; return num(`${nm} thinks of a number, multiplies it by ${k}, then adds ${c}. The answer is ${r}. What was the number?`, [{ ans: n }], `Undo the steps backwards: ${r} − ${c} = ${r - c}, then ${r - c} ÷ ${k} = ${n}.`); }
      if (kind === 1) { const m = n + c, r = (n + c) * k; return num(`${nm} thinks of a number, adds ${c}, then multiplies by ${k}. The answer is ${r}. What was the number?`, [{ ans: n }], `Undo the steps backwards: ${r} ÷ ${k} = ${m}, then ${m} − ${c} = ${n}.`); }
      const n2 = Math.max(n, Math.ceil(c / k) + 1), r = n2 * k - c;
      return num(`${nm} thinks of a number, multiplies it by ${k}, then takes away ${c}. The answer is ${r}. What was the number?`, [{ ans: n2 }], `Undo the steps backwards: ${r} + ${c} = ${r + c}, then ${r + c} ÷ ${k} = ${n2}.`);
    } },
    { t: 'heads and legs', g: R => {
      const S = R.pick([['chickens', 'cows', 2, 4, 'animals', 'heads', 'legs'], ['bikes', 'tricycles', 2, 3, 'cycles', 'seats', 'wheels'], ['beetles', 'spiders', 6, 8, 'bugs', 'bodies', 'legs'], ['motorbikes', 'cars', 2, 4, 'vehicles', 'drivers', 'wheels'], ['stools', 'chairs', 3, 4, 'seats', 'seats', 'legs']]);
      const [A, Bk, a, b, grp] = S, nA = R.int(2, 15), nB = R.int(2, 15), H = nA + nB, L = nA * a + nB * b, askB = R.bool();
      const exA = `If all ${H} were ${A}, there would be ${H * a} ${S[6]}. Each of the ${Bk} adds ${b - a} more: (${L} − ${H * a}) ÷ ${b - a} = ${nB} ${Bk}`;
      return num(`There are ${H} ${grp}, all ${A} or ${Bk}. Together they have ${L} ${S[6]}. How many are ${askB ? Bk : A}?`, [{ ans: askB ? nB : nA }],
        askB ? exA + '.' : `${exA}, so ${H} − ${nB} = ${nA} ${A}.`);
    } });

  B('II.2.15',
    { t: 'only the ones digit', g: R => {
      const xs = [0, 1, 2].map(() => gen(() => R.int(12, 99), x => x % 10 > 1 && x % 10 !== 5));
      const p1 = (xs[0] % 10) * (xs[1] % 10), ans = (p1 % 10) * (xs[2] % 10) % 10;
      return num(`Without multiplying it all out, what is the ones digit of ${xs.join(' × ')}?`, [{ ans }],
        `Only the ones digits matter: ${xs[0] % 10} × ${xs[1] % 10} = ${p1}, keep ${p1 % 10}; ${p1 % 10} × ${xs[2] % 10} = ${(p1 % 10) * (xs[2] % 10)}, keep ${ans}.`);
    } },
    { t: 'the hidden cycle', g: R => {
      if (R.bool(0.6)) {
        const b = R.pick([2, 3, 4, 7, 8, 9]), n = R.int(10, 60), cyc = []; let d = b % 10; do { cyc.push(d); d = d * b % 10; } while (d !== cyc[0]);
        const L = cyc.length, r = n % L, ans = cyc[(n - 1) % L];
        return num(`What is the ones digit of ${b} × ${b} × ${b} × … × ${b}, with ${n} ${b}s?`, [{ ans }],
          `The ones digits go ${cyc.join(', ')}, then repeat every ${L}. ${n} = ${L} × ${Math.floor(n / L)}${r ? ' + ' + r : ''}, so it is number ${r || L} in the cycle: ${ans}.`);
      }
      const N = R.int(10, 60), z = Math.floor(N / 5) + Math.floor(N / 25);
      return num(`How many zeros are at the end of 1 × 2 × 3 × … × ${N}?`, [{ ans: z }],
        `Each zero needs a 2 × 5, and there are plenty of 2s, so count the 5s: ${Math.floor(N / 5)} multiples of 5${N >= 25 ? `, plus ${Math.floor(N / 25)} extra from ${N >= 50 ? '25 and 50' : '25'} (${N >= 50 ? 'each is' : 'it is'} 5 × 5)` : ''}. That makes ${z}.`);
    } });

  /* =================== II.3 Division =================== */

  B('II.3.06',
    { t: 'largest and smallest', g: R => {
      const d = R.int(3, 9), kind = R.int(0, 2);
      if (kind === 0) { const q = R.int(6, 40), ans = q * d + d - 1;
        return num(`A number divided by ${d} gives ${q} with a remainder. What is the largest the number can be?`, [{ ans }], `The remainder is at most ${d - 1}, so ${q} × ${d} + ${d - 1} = ${ans}.`); }
      const r = R.int(1, d - 1);
      if (kind === 1) { let n = 100; while (n % d !== r) n++;
        return num(`What is the smallest 3-digit number that leaves a remainder of ${r} when divided by ${d}?`, [{ ans: n }], `100 ÷ ${d} = ${Math.floor(100 / d)} R ${100 % d}. Step up to remainder ${r}: ${n} = ${d} × ${Math.floor(n / d)} + ${r}.`); }
      let n = 99; while (n % d !== r) n--;
      return num(`What is the largest 2-digit number that leaves a remainder of ${r} when divided by ${d}?`, [{ ans: n }], `99 ÷ ${d} = ${Math.floor(99 / d)} R ${99 % d}. Step down to remainder ${r}: ${n} = ${d} × ${Math.floor(n / d)} + ${r}.`);
    } },
    { t: 'two remainder clues', g: R => {
      if (R.bool(0.6)) {
        const o = gen(() => { const a = R.int(3, 9), b = R.int(3, 9), L = lcm(a, b), n = R.int(12, 150); if (a === b || L < 20) return null;
          const lo = 10 * Math.floor(n / 10), hi = lo + 10 * Math.floor(L / 10) - 1, sols = []; for (let x = lo; x <= hi; x++) if (x % a === n % a && x % b === n % b) sols.push(x);
          return { a, b, n, lo, hi, sols }; }, o => o && o.lo >= 10 && o.sols.length === 1);
        const { a, b, n, lo, hi } = o;
        return num(`I am a number from ${lo} to ${hi}. Divided by ${a} I leave ${n % a}. Divided by ${b} I leave ${n % b}. What number am I?`, [{ ans: n }],
          `List the numbers from ${lo} with remainder ${n % a} when divided by ${a}, and test each with ${b}: ${n} = ${a} × ${Math.floor(n / a)} + ${n % a} = ${b} × ${Math.floor(n / b)} + ${n % b}.`);
      }
      const set = R.pick([[2, 3, 4], [2, 3, 4, 5], [3, 4, 5], [2, 3, 4, 5, 6], [4, 6], [3, 5], [2, 5, 7], [3, 4], [4, 5, 6], [2, 3, 5]]);
      const r = R.int(1, Math.min(...set) - 1), L = set.reduce((x, y) => lcm(x, y)), ans = L + r;
      return num(`What is the smallest number bigger than ${r} that leaves a remainder of ${r} when divided by ${listAnd(set)}?`, [{ ans }],
        `The number minus ${r} must be a multiple of ${listAnd(set)}. The LCM is ${L}, so the number is ${L} + ${r} = ${ans}.`);
    } });

  B('II.3.07',
    { t: 'several steps', g: R => {
      const kind = R.int(0, 2);
      if (kind === 0) { const c = R.pick([30, 35, 40, 45, 50]), [s, t] = gen(() => [R.int(90, 300), R.int(5, 20)], ([s, t]) => (s + t) % c !== 0), n = s + t, ans = ceilDiv(n, c);
        return num(`${s} students and ${t} teachers go on a trip. Each bus holds ${c} people. How many buses are needed?`, [{ ans }], `${s} + ${t} = ${n} people. ${n} ÷ ${c} = ${Math.floor(n / c)} R ${n % c}, and the ${n % c} left still need a bus: ${ans}.`); }
      if (kind === 1) { const c = R.pick([6, 8, 10, 12]), n = gen(() => R.int(40, 200), x => x % c !== 0), ans = c - n % c;
        return num(`${n} eggs are packed in boxes of ${c}. How many more eggs are needed to fill the last box?`, [{ ans }], `${n} ÷ ${c} = ${Math.floor(n / c)} R ${n % c}. The last box has ${n % c}, so it needs ${c} − ${n % c} = ${ans} more.`); }
      const nm = R.pick(NAMES), p = R.int(6, 25), N = gen(() => R.int(80, 400), x => x % p !== 0), ans = ceilDiv(N, p);
      return num(`A book has ${N} pages. ${nm} reads ${p} pages a day. On which day does ${nm} read the last page?`, [{ ans }], `${N} ÷ ${p} = ${Math.floor(N / p)} R ${N % p}. After ${Math.floor(N / p)} days, ${N % p} pages are left for the next day: day ${ans}.`);
    } },
    { t: 'the hidden cycle', g: R => {
      if (R.bool()) {
        const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], s = R.int(0, 6), n = R.int(20, 400), r = n % 7, ans = DAYS[(s + r) % 7];
        return choice(R, `Today is ${DAYS[s]}. What day of the week will it be ${n} days from now?`, ans, R.sample(DAYS.filter(d => d !== ans), 3),
          `${n} = 7 × ${Math.floor(n / 7)}${r ? ' + ' + r : ''}. Whole weeks bring you back to ${DAYS[s]}${r ? `; ${r} more day${r > 1 ? 's' : ''} is ${ans}` : ''}.`);
      }
      const cols = R.sample(['red', 'blue', 'green', 'yellow'], 3), ks = cols.map(() => R.int(1, 4)), L = ks[0] + ks[1] + ks[2], N = R.int(30, 100), ci = R.int(0, 2);
      const full = Math.floor(N / L), rem = N % L, start = ci === 0 ? 0 : ci === 1 ? ks[0] : ks[0] + ks[1], extra = Math.max(0, Math.min(ks[ci], rem - start)), ans = full * ks[ci] + extra;
      return num(`Beads are threaded in a repeating pattern: ${ks[0]} ${cols[0]}, ${ks[1]} ${cols[1]}, ${ks[2]} ${cols[2]}, then again. How many ${cols[ci]} beads are in the first ${N}?`, [{ ans }],
        `One round is ${L} beads. ${N} = ${L} × ${full} + ${rem}. That gives ${full} × ${ks[ci]} = ${full * ks[ci]} ${cols[ci]}, plus ${extra} in the last ${rem}: ${ans}.`);
    } });

  B('II.3.10',
    { t: 'missing digits', g: R => {
      const o = gen(() => {
        const d = R.int(3, 9), q = R.int(100, Math.floor(9999 / d)), D = d * q, sD = String(D), sQ = String(q);
        const i = R.int(0, sD.length - 1), j = R.int(0, sQ.length - 1);
        let hits = 0;
        for (let x = 0; x <= 9; x++) for (let y = 0; y <= 9; y++) {
          if ((i === 0 && x === 0) || (j === 0 && y === 0)) continue;
          const D2 = +(sD.slice(0, i) + x + sD.slice(i + 1)), q2 = +(sQ.slice(0, j) + y + sQ.slice(j + 1)); if (D2 === d * q2) hits++;
        }
        return { d, q, D, i, j, hits, sD, sQ };
      }, o => o.hits === 1);
      const { d, q, D, i, j, sD, sQ } = o, pD = sD.slice(0, i) + box + sD.slice(i + 1), pQ = sQ.slice(0, j) + box + sQ.slice(j + 1);
      return num(`${pD} ÷ ${d} = ${pQ}, with no remainder. Find both missing digits.`, [{ label: 'in the number divided', ans: +sD[i] }, { label: 'in the answer', ans: +sQ[j] }],
        `Try each digit in the answer and multiply by ${d}: only ${q} × ${d} = ${D} fits ${pD}.`);
    } },
    { t: 'count them', g: R => {
      const d = R.pick([3, 4, 6, 7, 8, 9, 11, 12, 15]), lo = R.int(10, 300), hi = lo + R.int(60, 700), rem = R.bool(0.35) ? R.int(1, d - 1) : 0;
      let first = lo; while (first % d !== rem) first++; let last = hi; while (last % d !== rem) last--;
      const ans = (last - first) / d + 1;
      return num(rem ? `How many whole numbers from ${lo} to ${hi} leave a remainder of ${rem} when divided by ${d}?` : `How many whole numbers from ${lo} to ${hi} are divisible by ${d}?`, [{ ans }],
        `The first is ${first} and the last is ${last}; they go up by ${d}. (${last} − ${first}) ÷ ${d} + 1 = ${ans}.`);
    } });

  B('II.3.12',
    { t: 'missing digit', g: R => {
      const o = gen(() => {
        const k = R.pick([3, 4, 6, 9, 9]), L = R.int(4, 5), s = String(R.int(10 ** (L - 1), 10 ** L - 1)).split('');
        const pos = k === 4 ? R.int(L - 2, L - 1) : R.int(1, L - 1), ok = [];
        for (let x = 0; x <= 9; x++) { const t = s.slice(); t[pos] = x; if (+t.join('') % k === 0) ok.push(x); }
        return { k, s, pos, ok };
      }, o => o.ok.length >= 1 && o.ok.length <= 5);
      const { k, s, pos, ok } = o, pat = s.map((c, i) => i === pos ? box : c).join(''), big = R.bool(), ans = ok.length === 1 ? ok[0] : big ? Math.max(...ok) : Math.min(...ok);
      const known = s.reduce((t, c, i) => i === pos ? t : t + +c, 0);
      const rule = k === 4 ? 'The last two digits must make a multiple of 4' : k === 6 ? `It must be even and its digit sum (${known} + □) a multiple of 3` : `The digit sum ${known} + □ must be a multiple of ${k}`;
      return num(ok.length === 1 ? `${pat} is divisible by ${k}. What digit goes in the box?` : `${pat} is divisible by ${k}. What is the ${big ? 'largest' : 'smallest'} digit that can go in the box?`, [{ ans }],
        `${rule}. So □ can be ${listAnd(ok).replace(' and ', ok.length > 1 ? ' or ' : ' and ')}${ok.length > 1 ? `; the ${big ? 'largest' : 'smallest'} is ${ans}` : ''}.`);
    } },
    { t: 'count every way', g: R => {
      if (R.bool()) {
        const [a, b] = R.pick([[2, 3], [3, 5], [2, 5], [3, 4], [4, 6], [2, 7], [3, 7], [5, 3], [4, 5], [6, 9]]), N = R.int(4, 20) * 10, Lb = lcm(a, b), ans = Math.floor(N / a) - Math.floor(N / Lb);
        return num(`How many numbers from 1 to ${N} are divisible by ${a} but not by ${b}?`, [{ ans }],
          `There are ${Math.floor(N / a)} multiples of ${a}. The ones also divisible by ${b} are the multiples of ${Lb}: ${Math.floor(N / Lb)}. ${Math.floor(N / a)} − ${Math.floor(N / Lb)} = ${ans}.`);
      }
      const o = gen(() => {
        const k = R.pick([12, 15, 18, 36, 45]), s = String(R.int(1000, 9999)).split(''), p1 = R.int(1, 2), p2 = 3, hits = [];
        for (let x = 0; x <= 9; x++) for (let y = 0; y <= 9; y++) { const t = s.slice(); t[p1] = x; t[p2] = y; if (+t.join('') % k === 0) hits.push(t.join('')); }
        return { k, s, p1, p2, hits };
      }, o => o.hits.length >= 2 && o.hits.length <= 8);
      const { k, s, p1, p2, hits } = o, pat = s.map((c, i) => i === p1 || i === p2 ? box : c).join('');
      const tests = { 12: 'by 3 and by 4', 15: 'by 3 and by 5', 18: 'by 2 and by 9', 36: 'by 4 and by 9', 45: 'by 5 and by 9' }[k];
      return num(`Fill each box with a digit (they may be the same) so that ${pat} is divisible by ${k}. How many ways are there?`, [{ ans: hits.length }],
        `It must be divisible ${tests}. Checking the last digit first, the numbers are ${listAnd(hits)}: ${hits.length} ways.`);
    } });

  /* =================== II.4 Factors & multiples =================== */

  B('II.4.05',
    { t: 'make it a square', g: R => {
      const n = gen(() => [2, 3, 5, 7].reduce((m, p) => m * p ** R.pick([0, 0, 1, 1, 2, 3]), 1), n => n >= 12 && n <= 1000 && !Number.isInteger(Math.sqrt(n)) && new Set(factStr(n)).size < factStr(n).length);
      const f = factStr(n), cnt = {}; f.forEach(p => cnt[p] = (cnt[p] || 0) + 1);
      const odd = Object.keys(cnt).filter(p => cnt[p] % 2).map(Number), ans = odd.reduce((a, b) => a * b, 1), r = Math.sqrt(n * ans);
      return num(`What is the smallest whole number you can multiply ${n} by to get a square number?`, [{ ans }],
        `${n} = ${f.join(' × ')}. In a square every prime appears an even number of times, so multiply by ${odd.join(' × ')}${odd.length > 1 ? ' = ' + ans : ''}: ${n} × ${ans} = ${F(n * ans)} = ${r} × ${r}.`);
    } },
    { t: 'count the factors', g: R => {
      if (R.bool(0.6)) {
        const n = gen(() => [2, 3, 5, 7].reduce((m, p) => m * p ** R.pick([0, 1, 1, 2, 3]), 1), n => n >= 24 && n <= 1000 && new Set(factStr(n)).size >= 2);
        const f = factStr(n), cnt = {}; f.forEach(p => cnt[p] = (cnt[p] || 0) + 1); const ps = Object.keys(cnt), ans = ps.reduce((a, p) => a * (cnt[p] + 1), 1);
        return num(`${n} = ${f.join(' × ')}. How many factors does ${n} have?`, [{ ans }],
          `A factor uses ${ps.map(p => `${p} from 0 to ${cnt[p]} times (${cnt[p] + 1} ways)`).join(', ')}. ${ps.map(p => cnt[p] + 1).join(' × ')} = ${ans}.`);
      }
      const N = R.int(20, 400), ps = [2, 3, 5, 7, 11, 13, 17, 19].filter(p => p * p <= N);
      return num(`How many numbers from 1 to ${N} have exactly 3 factors?`, [{ ans: ps.length }],
        `Only squares of primes have exactly 3 factors (1, p and p × p): ${listAnd(ps.map(p => p * p))}. That is ${ps.length}.`);
    } });

  B('II.4.09',
    { t: 'three at once', g: R => {
      const [a, b, c] = gen(() => R.sample([2, 3, 4, 5, 6, 8, 9, 10, 12, 15], 3).sort((x, y) => x - y), ([a, b, c]) => { const L = lcm(lcm(a, b), c); return L <= 180 && L < a * b * c; });
      const L1 = lcm(a, b), L = lcm(L1, c), ctx = R.int(0, 2);
      const p = [`Three lights flash every ${a}, ${b} and ${c} seconds. They all flash together now. After how many seconds do they next all flash together?`,
        `Three buses leave the station every ${a}, ${b} and ${c} minutes. They all leave together at 8:00. How many minutes later do they next all leave together?`,
        `What is the smallest number that ${a}, ${b} and ${c} all divide into exactly?`][ctx];
      return num(p, [{ ans: L }], `Find the LCM: LCM(${a}, ${b}) = ${L1}, then LCM(${L1}, ${c}) = ${L}.`);
    } },
    { t: 'count every way', g: R => {
      if (R.bool()) {
        const [a, b] = R.pick([[2, 3], [3, 4], [4, 6], [2, 5], [3, 5], [4, 10], [6, 8], [6, 9], [5, 7], [4, 5]]), N = R.int(5, 20) * 10, L = lcm(a, b), ans = Math.floor(N / a) + Math.floor(N / b) - Math.floor(N / L);
        return num(`How many numbers from 1 to ${N} are multiples of ${a} or of ${b} (or both)?`, [{ ans }],
          `${Math.floor(N / a)} multiples of ${a} plus ${Math.floor(N / b)} of ${b}, but the ${Math.floor(N / L)} multiples of ${L} were counted twice: ${Math.floor(N / a)} + ${Math.floor(N / b)} − ${Math.floor(N / L)} = ${ans}.`);
      }
      const [a, b] = gen(() => [R.int(4, 12), R.int(4, 12)], ([a, b]) => a < b && lcm(a, b) < a * b && lcm(a, b) <= 60), L = lcm(a, b), T = R.pick([60, 90, 120, 180]), ans = Math.floor(T / L);
      return num(`Two runners start together. One runs a lap every ${a} minutes, the other every ${b} minutes. How many times in the first ${T} minutes do they cross the start line together (not counting the start)?`, [{ ans }],
        `They meet every LCM(${a}, ${b}) = ${L} minutes. ${T} ÷ ${L} = ${ans}${T % L ? ' R ' + T % L : ''}, so ${ans} times.`);
    } });

  B('II.4.12',
    { t: 'two or more clues', g: R => {
      const cands = Array.from({ length: 90 }, (_, i) => i + 10), ds = n => Math.floor(n / 10) + n % 10;
      const o = gen(() => {
        const n = R.int(10, 99), pool = [];
        for (const k of [3, 4, 6, 7, 8, 9]) if (n % k === 0) pool.push({ t: `I am a multiple of ${k}`, c: `a multiple of ${k}`, f: x => x % k === 0 });
        pool.push({ t: `My digits add up to ${ds(n)}`, c: `its digits add to ${ds(n)}`, f: x => ds(x) === ds(n) });
        pool.push(n % 2 ? { t: 'I am odd', c: 'odd', f: x => x % 2 === 1 } : { t: 'I am even', c: 'even', f: x => x % 2 === 0 });
        if (isPrime(n)) pool.push({ t: 'I am prime', c: 'prime', f: isPrime });
        else pool.push({ t: `I have exactly ${nFactors(n)} factors`, c: `it has ${nFactors(n)} factors`, f: x => nFactors(x) === nFactors(n) });
        const tn = Math.floor(n / 10), on = n % 10;
        if (tn !== on) pool.push(tn > on ? { t: 'My tens digit is bigger than my ones digit', c: 'its tens digit is bigger', f: x => Math.floor(x / 10) > x % 10 } : { t: 'My tens digit is smaller than my ones digit', c: 'its tens digit is smaller', f: x => Math.floor(x / 10) < x % 10 });
        const cl = R.shuffle(pool), used = []; let left = cands;
        for (const c of cl) { if (left.length === 1) break; const nl = left.filter(c.f); if (nl.length < left.length) { used.push(c); left = nl; } }
        return { n, used, left };
      }, o => o.left.length === 1 && o.used.length >= 2 && o.used.length <= 4);
      const { n, used } = o;
      return num(`I am a two-digit number. ${used.map(c => c.t).join('. ')}. What number am I?`, [{ ans: n }],
        `Filter the two-digit numbers clue by clue. Only ${n} fits: ${used.map(c => c.c).join('; ')}.`);
    } },
    { t: 'sum and product', g: R => {
      const kind = R.int(0, 2);
      if (kind === 0) { const [a, b] = gen(() => [R.int(2, 20), R.int(2, 20)], ([a, b]) => a < b);
        return num(`Two whole numbers have a sum of ${a + b} and a product of ${a * b}. What is the larger number?`, [{ ans: b }], `Look at factor pairs of ${a * b}: only ${a} × ${b} adds up to ${a + b}. The larger is ${b}.`); }
      if (kind === 1) { const n = R.int(6, 31);
        return num(`The product of two whole numbers next to each other (like 4 and 5) is ${n * (n + 1)}. What is their sum?`, [{ ans: 2 * n + 1 }], `${n} × ${n} = ${n * n} is close, and ${n} × ${n + 1} = ${n * (n + 1)}. The sum is ${n} + ${n + 1} = ${2 * n + 1}.`); }
      const m = R.int(3, 12), P = (m - 1) * m * (m + 1);
      return num(`The product of three whole numbers in a row (like 4, 5, 6) is ${F(P)}. What is the middle number?`, [{ ans: m }], `The middle number times itself three times should be close to ${F(P)}: ${m} × ${m} × ${m} = ${F(m ** 3)}. Check: ${m - 1} × ${m} × ${m + 1} = ${F(P)}.`);
    } });

  /* =================== II.5 Fractions I =================== */

  B('II.5.04',
    { t: 'work backwards', g: R => {
      const b = R.int(3, 10), a = gen(() => R.int(2, b - 1), a => gcd(a, b) === 1), k = R.int(2, 12), N = b * k, v = a * k;
      const ex = `${fh(1, b)} is ${v} ÷ ${a} = ${k}, so the whole is ${k} × ${b} = ${N}.`;
      if (R.bool()) return num(`${fh(a, b)} of a number is ${v}. What is the number?`, [{ ans: N }], ex);
      const nm = R.pick(NAMES);
      return num(`${nm} has read ${fh(a, b)} of a book. That is ${v} pages. How many pages does the book have?`, [{ ans: N }], ex);
    } },
    { t: 'a fraction puzzle', g: R => {
      if (R.bool()) {
        const nm = R.pick(NAMES), a = R.int(2, 6), b = R.int(2, 6), k = R.int(1, 5), x = a * b * k, r1 = x / a * (a - 1), L = r1 / b * (b - 1);
        return num(`${nm} had some stickers. ${nm} gave away ${fh(1, a)} of them, then ${fh(1, b)} of the ones left. Now ${nm} has ${L}. How many were there at first?`, [{ ans: x }],
          `Work backwards. ${L} is ${fh(b - 1, b)} of what was left, so that was ${L} ÷ ${b - 1} × ${b} = ${r1}. And ${r1} is ${fh(a - 1, a)} of the start: ${r1} ÷ ${a - 1} × ${a} = ${x}.`);
      }
      const [a, b, p, q, t] = gen(() => { const b = R.int(2, 5), q = R.int(2, 5); return [R.int(1, b - 1), b, R.int(1, q - 1), q, R.int(1, 3)]; }, ([a, b, p, q, t]) => b * q * t <= 40 && b * q * t >= 12);
      const G = a * q * t, T = b * q * t, gl = p * a * t;
      return num(`${fh(a, b)} of a class are girls. ${fh(p, q)} of the girls wear glasses. ${gl} girls wear glasses. How many students are in the class?`, [{ ans: T }],
        `${gl} is ${fh(p, q)} of the girls, so there are ${gl} ÷ ${p} × ${q} = ${G} girls. ${G} is ${fh(a, b)} of the class: ${G} ÷ ${a} × ${b} = ${T}.`);
    } });

  B('II.5.08',
    { t: 'two clues', g: R => {
      const q = R.int(3, 9), p = gen(() => R.int(1, q - 1), p => gcd(p, q) === 1), k = R.int(2, 9), sum = R.bool();
      return num(sum ? `A fraction is equal to ${fh(p, q)}. Its top and bottom add up to ${(p + q) * k}. What is the fraction?` : `A fraction is equal to ${fh(p, q)}. Its bottom is ${(q - p) * k} more than its top. What is the fraction?`,
        [{ label: 'top', ans: p * k }, { label: 'bottom', ans: q * k }],
        `In ${fh(p, q)} the ${sum ? `parts add to ${p + q}` : `gap is ${q - p}`}. ${sum ? (p + q) * k : (q - p) * k} is ${k} times that, so multiply top and bottom by ${k}: ${fh(p * k, q * k)}.`);
    } },
    { t: 'add to top and bottom', g: R => {
      const o = gen(() => { const b = R.int(3, 12), a = R.int(1, b - 1), x = R.int(1, 12), g = gcd(a + x, b + x); return { a, b, x, p: (a + x) / g, q: (b + x) / g, g }; },
        o => gcd(o.a, o.b) === 1 && o.q <= 12 && o.g > 1);
      const { a, b, x, p, q, g } = o;
      return num(`What number can you add to both the top and the bottom of ${fh(a, b)} to get a fraction equal to ${fh(p, q)}?`, [{ ans: x }],
        `Adding the same number keeps the gap ${b - a}. In ${fh(p, q)} the gap is ${q - p}, so scale it by ${g}: ${fh(p * g, q * g)}. From ${a} to ${p * g} you add ${x}.`);
    } });

  B('II.5.11',
    { t: 'the missing number', g: R => {
      const o = gen(() => { const b = R.int(2, 9), a = R.int(1, b - 1), d = R.int(3, 15); return { a, b, d }; }, o => gcd(o.a, o.b) === 1 && o.d !== o.b && o.a * o.d > o.b);
      const { a, b, d } = o, big = R.bool();
      if (big) { const n = Math.ceil(a * d / b) - 1;
        return num(`What is the largest whole number n that makes ${fh('n', d)} &lt; ${fh(a, b)} true?`, [{ ans: n }], `Cross-multiply: n × ${b} &lt; ${a} × ${d} = ${a * d}. ${n} × ${b} = ${n * b} works, but ${n + 1} × ${b} = ${(n + 1) * b} does not. So n = ${n}.`); }
      const n = Math.floor(a * d / b) + 1;
      return num(`What is the smallest whole number n that makes ${fh('n', d)} &gt; ${fh(a, b)} true?`, [{ ans: n }], `Cross-multiply: n × ${b} &gt; ${a} × ${d} = ${a * d}. ${n} × ${b} = ${n * b} works, but ${n - 1} × ${b} = ${(n - 1) * b} does not. So n = ${n}.`);
    } },
    { t: 'count every way', g: R => {
      if (R.bool(0.6)) {
        const o = gen(() => { const b = R.int(2, 10), a = R.int(1, b - 1), e = R.int(2, 10), c = R.int(1, e - 1), d = R.int(6, 24); let lo = 0, hi = 0, cnt = 0;
          for (let n = 1; n < d * 2; n++) if (n * b > a * d && n * e < c * d) { cnt++; if (!lo) lo = n; hi = n; } return { a, b, c, e, d, cnt, lo, hi }; },
          o => gcd(o.a, o.b) === 1 && gcd(o.c, o.e) === 1 && o.a * o.e < o.c * o.b && o.cnt >= 2 && o.cnt <= 12);
        const { a, b, c, e, d, cnt, lo, hi } = o;
        return num(`How many fractions ${fh('n', d)}, with n a whole number, are between ${fh(a, b)} and ${fh(c, e)}? (Do not count the ends.)`, [{ ans: cnt }],
          `n must make n × ${b} &gt; ${a * d} and n × ${e} &lt; ${c * d}. So n = ${lo} to ${hi}: ${cnt} fractions.`);
      }
      const o = gen(() => { const b = R.int(2, 12), a = R.int(1, 3), e = R.int(4, 40), c = 1; let cnt = 0, lo = 0, hi = 0; for (let n = 1; n < 60; n++) if (n * a > b && n * c < e) { cnt++; if (!lo) lo = n; hi = n; } return { a, b, e, cnt, lo, hi }; },
        o => gcd(o.a, o.b) === 1 && o.a < o.b && o.cnt >= 2 && o.cnt <= 15);
      const { a, b, e, cnt, lo, hi } = o;
      return num(`How many whole numbers n make ${fh(1, 'n')} smaller than ${fh(a, b)} but bigger than ${fh(1, e)}?`, [{ ans: cnt }],
        `${fh(1, 'n')} &lt; ${fh(a, b)} means n × ${a} &gt; ${b}, and ${fh(1, 'n')} &gt; ${fh(1, e)} means n &lt; ${e}. So n = ${lo} to ${hi}: ${cnt} numbers.`);
    } });

  B('II.5.13',
    { t: 'the hidden denominator', g: R => {
      const d = R.int(3, 12), w = R.int(2, 9), r = R.int(1, d - 1), N = w * d + r;
      if (R.bool(0.6)) return num(`The same number goes in both boxes: ${fh(N, box)} = ${w} ${fh(r, box)}. What is it?`, [{ ans: d }],
        `${N} = ${w} × □ + ${r}, so ${w} × □ = ${N - r} and □ = ${d}.`);
      const m = R.int(2, 3), ans = N * m;
      return num(`${fh(box, d * m)} = ${w} ${fh(r, d)}. What number goes in the box?`, [{ ans }],
        `${w} ${fh(r, d)} = ${fh(N, d)}. To get a bottom of ${d * m}, multiply top and bottom by ${m}: ${fh(ans, d * m)}.`);
    } },
    { t: 'count every way', g: R => {
      const o = gen(() => { const S = R.int(10, 30), t = R.pick([1, 1, 2]), L = []; for (let b = 2; b < S; b++) { const a = S - b; if (a > t * b && gcd(a, b) === 1) L.push([a, b]); } return { S, t, L }; },
        o => o.L.length >= 2 && o.L.length <= 10);
      const { S, t, L } = o;
      return num(`How many fractions in simplest form, with a bottom bigger than 1, have top + bottom = ${S} and are greater than ${t}?`, [{ ans: L.length }],
        `Greater than ${t} means top > ${t === 1 ? '' : '2 × '}bottom. Checking bottoms 2, 3, 4, …: ${listAnd(L.map(([a, b]) => `${a}/${b}`))}. That is ${L.length}.`);
    } });

  /* =================== II.6 Fractions II =================== */

  B('II.6.03',
    { t: 'unit fraction pieces', g: R => {
      const [a, b] = gen(() => [R.int(2, 10), R.int(3, 12)], ([a, b]) => a < b), [p, q] = E2.reduce(a + b, a * b), hideA = R.bool(0.3);
      const k = hideA ? b : a, h = hideA ? a : b, [dn, dd] = [p * k - q, q * k];
      return num(hideA ? `${fh(1, box)} + ${fh(1, b)} = ${fh(p, q)}. What number goes in the box?` : `${fh(1, a)} + ${fh(1, box)} = ${fh(p, q)}. What number goes in the box?`, [{ ans: h }],
        `${fh(p, q)} − ${fh(1, k)} = ${fh(p * k, q * k)} − ${fh(q, q * k)} = ${fh(dn, dd)} = ${fh(1, h)}. So □ = ${h}.`);
    } },
    { t: 'split a unit fraction', g: R => {
      if (R.bool(0.45)) { const n = R.int(2, 12), ans = n * (n + 1);
        return num(`Write ${fh(1, n)} = ${fh(1, 'a')} + ${fh(1, 'b')}, where a and b are different whole numbers and a < b. What is the largest b can be?`, [{ ans }],
          `a must be more than ${n}. The smallest choice a = ${n + 1} leaves the most for 1/b to be small: ${fh(1, n)} − ${fh(1, n + 1)} = ${fh(1, ans)}. So b = ${ans}.`); }
      const n = R.pick([4, 6, 8, 9, 10, 12]), ways = [];
      for (let a = n + 1; a < 2 * n; a++) if ((n * a) % (a - n) === 0) ways.push([a, n * a / (a - n)]);
      const ans = Math.min(...ways.map(w => w[1]));
      return num(`Write ${fh(1, n)} = ${fh(1, 'a')} + ${fh(1, 'b')}, where a and b are different whole numbers and a < b. What is the smallest b can be?`, [{ ans }],
        `a must be between ${n} and ${2 * n}. The ways are ${listAnd(ways.map(([a, b]) => `1/${a} + 1/${b}`))}. The smallest b is ${ans}.`);
    } });

  B('II.6.06',
    { t: 'missing numerator', g: R => {
      const o = gen(() => { const b = R.int(2, 10), d = R.int(2, 10), a = R.int(1, b - 1), x = R.int(1, d - 1); return { a, b, d, x }; }, o => o.b !== o.d && gcd(o.a, o.b) === 1 && o.b % o.d !== 0 && o.d % o.b !== 0);
      const { a, b, d, x } = o, L = lcm(b, d), [p, q] = E2.reduce(a * d + x * b, b * d);
      return num(`${fh(a, b)} + ${fh(box, d)} = ${fh(p, q)}. What number goes in the box?`, [{ ans: x }],
        `Use bottom ${L}: ${q === L ? '' : `${fh(p, q)} = ${fh(p * L / q, L)} and `}${fh(a, b)} = ${fh(a * L / b, L)}. The difference is ${fh(x * L / d, L)} = ${fh(x, d)}, so □ = ${x}.`);
    } },
    { t: 'the cancelling trick', g: R => {
      const kind = R.int(0, 2);
      if (kind === 0) { const n = R.int(4, 12);
        return num(`Add: ${fh(1, 2)} + ${fh(1, 6)} + ${fh(1, 12)} + ${fh(1, 20)} + … + ${fh(1, n * (n + 1))}. (The bottoms are 1 × 2, 2 × 3, 3 × 4, …)`, [frac(n, n + 1)],
          `Each piece splits: ${fh(1, 6)} = ${fh(1, 2)} − ${fh(1, 3)}, ${fh(1, 12)} = ${fh(1, 3)} − ${fh(1, 4)}, … Everything cancels except 1 − ${fh(1, n + 1)} = ${fh(n, n + 1)}.`); }
      if (kind === 1) { const k = R.int(4, 8), D = 2 ** k;
        return num(`Add: ${fh(1, 2)} + ${fh(1, 4)} + ${fh(1, 8)} + … + ${fh(1, D)}.`, [frac(D - 1, D)],
          `Each step fills half of what is left of 1. After ${fh(1, D)} only ${fh(1, D)} is missing: 1 − ${fh(1, D)} = ${fh(D - 1, D)}.`); }
      const n = R.int(4, 9);
      return num(`Add: ${fh(1, 3)} + ${fh(1, 15)} + ${fh(1, 35)} + … + ${fh(1, (2 * n - 1) * (2 * n + 1))}. (The bottoms are 1 × 3, 3 × 5, 5 × 7, …)`, [frac(n, 2 * n + 1)],
        `Each piece is half a difference: ${fh(1, 15)} = ½ × (${fh(1, 3)} − ${fh(1, 5)}). Everything cancels except ½ × (1 − ${fh(1, 2 * n + 1)}) = ½ × ${fh(2 * n, 2 * n + 1)} = ${fh(n, 2 * n + 1)}.`);
    } });

  B('II.6.10',
    { t: 'missing numerator', g: R => {
      const o = gen(() => { const b = R.int(2, 9), a = R.int(1, b - 1), q = R.int(2, 9), p = R.int(1, 9); const [c, d] = E2.reduce(a * p, b * q); return { a, b, p, q, c, d }; },
        o => o.a >= 2 && gcd(o.a, o.b) === 1 && gcd(o.p, o.q) === 1 && o.d < o.b * o.q && o.p !== o.q);
      const { a, b, p, q, c, d } = o, bq = b * q;
      return num(`${fh(a, b)} × ${fh(box, q)} = ${fh(c, d)}. What number goes in the box?`, [{ ans: p }],
        `${fh(a, b)} × ${fh(box, q)} = ${fh(`${a} × □`, bq)}, and ${fh(c, d)} = ${fh(c * bq / d, bq)}. So ${a} × □ = ${c * bq / d} and □ = ${p}.`);
    } },
    { t: 'the cancelling product', g: R => {
      const kind = R.int(0, 2), n = R.int(5, 30);
      if (kind === 0) return num(`Work out (1 − ${fh(1, 2)}) × (1 − ${fh(1, 3)}) × (1 − ${fh(1, 4)}) × … × (1 − ${fh(1, n)}).`, [frac(1, n)],
        `The brackets are ${fh(1, 2)} × ${fh(2, 3)} × ${fh(3, 4)} × … × ${fh(n - 1, n)}. Each top cancels the bottom before it, leaving ${fh(1, n)}.`);
      if (kind === 1) return num(`Work out (1 + ${fh(1, 2)}) × (1 + ${fh(1, 3)}) × (1 + ${fh(1, 4)}) × … × (1 + ${fh(1, n)}).`, [frac(n + 1, 2)],
        `The brackets are ${fh(3, 2)} × ${fh(4, 3)} × ${fh(5, 4)} × … × ${fh(n + 1, n)}. Each bottom cancels the top before it, leaving ${fh(n + 1, 2)}${(n + 1) % 2 ? '' : ' = ' + (n + 1) / 2}.`);
      return num(`Work out ${fh(2, 3)} × ${fh(3, 4)} × ${fh(4, 5)} × … × ${fh(n - 1, n)}.`, [frac(2, n)],
        `Each top cancels the bottom before it. Only the first top, 2, and the last bottom, ${n}, are left: ${fh(2, n)}.`);
    } });

  B('II.6.14',
    { t: 'work backwards', g: R => {
      const o = gen(() => { const b = R.int(2, 8), d = R.int(2, 8), a = R.int(1, b - 1), c = R.int(1, d - 1); return { a, b, c, d }; }, o => o.a * o.d < o.c * o.b && o.b !== o.d && gcd(o.a, o.b) === 1 && gcd(o.c, o.d) === 1);
      const { a, b, c, d } = o, L = lcm(b, d), dn = c * L / d - a * L / b, m = R.int(1, 6), C = L * m, A = dn * m;
      return num(`A jar is ${fh(a, b)} full of beads. After ${A} more beads go in, it is ${fh(c, d)} full. How many beads fill the jar?`, [{ ans: C }],
        `The ${A} beads fill ${fh(c, d)} − ${fh(a, b)} = ${fh(c * L / d, L)} − ${fh(a * L / b, L)} = ${fh(dn, L)} of the jar. So ${fh(1, L)} is ${A} ÷ ${dn} = ${m} beads, and the jar holds ${L} × ${m} = ${C}.`);
    } },
    { t: 'a fraction puzzle', g: (R, O) => {
      const imp = O.units === 'imperial';
      if (R.bool(0.6)) {
        const [k, m] = R.pick([[1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [2, 5], [3, 5]]), u = imp ? 'oz' : 'g';
        const Bt = imp ? R.int(4, 20) : R.int(10, 60) * 10, W = imp ? m * R.int(3, 12) : m * 10 * R.int(3, 20), full = Bt + W, part = Bt + W * k / m;
        return num(`A bottle full of water weighs ${F(full)} ${u}. When it is ${fh(k, m)} full, it weighs ${F(part)} ${u}. How much does the empty bottle weigh, in ${u}?`, [{ ans: Bt }],
          `The missing ${fh(m - k, m)} of the water weighs ${F(full)} − ${F(part)} = ${F(full - part)} ${u}, so all the water weighs ${F(full - part)} ÷ ${m - k} × ${m} = ${F(W)} ${u}. The bottle is ${F(full)} − ${F(W)} = ${F(Bt)} ${u}.`);
      }
      const u = imp ? 'ft' : 'm', [a, b] = gen(() => [R.int(2, 6), R.int(2, 6)], ([a, b]) => a !== b && 1 / a + 1 / b < 1), L = lcm(a, b), rn = L - L / a - L / b, t = R.int(1, 4), T = L * t, top = rn * t;
      return num(`A pole stands in a pond. ${fh(1, a)} of it is in the mud, ${fh(1, b)} is in the water, and the top ${top} ${u} is above the water. How long is the pole, in ${u}?`, [{ ans: T }],
        `Mud and water make ${fh(L / a, L)} + ${fh(L / b, L)} = ${fh(L / a + L / b, L)}, so the top ${top} ${u} is ${fh(rn, L)} of the pole. ${fh(1, L)} is ${t} ${u}, so the pole is ${L} × ${t} = ${T} ${u}.`);
    } });

  /* =================== II.7 Decimals =================== */
  const dec = (n, dp) => { const s = String(n).padStart(dp + 1, '0'); return dp ? s.slice(0, -dp) + '.' + s.slice(-dp) : s; }; // integer n in units of 10^-dp

  B('II.7.05',
    { t: 'missing digit', g: R => {
      const o = gen(() => {
        const w = R.int(0, 9), pos = R.int(1, 3), dA = String(R.int(0, 999)).padStart(3, '0').split('');
        const Bv = w * 1000 + R.int(0, 999) + R.pick([0, 1000, -1000]) * (R.bool(0.2) ? 1 : 0), Bdp = R.pick([2, 3]), Bn = Bdp === 2 ? Math.round(Bv / 10) * 10 : Bv, sign = R.pick(['>', '<']);
        const ok = []; for (let x = 0; x <= 9; x++) { const t = dA.slice(); t[pos - 1] = x; const v = w * 1000 + +t.join(''); if (sign === '>' ? v > Bn : v < Bn) ok.push(x); }
        return { w, pos, dA, Bn, Bdp, sign, ok };
      }, o => o.Bn >= 0 && o.ok.length >= 1 && o.ok.length <= 9);
      const { w, pos, dA, Bn, Bdp, sign, ok } = o, pat = w + '.' + dA.map((c, i) => i === pos - 1 ? box : c).join(''), Bs = dec(Bdp === 2 ? Bn / 10 : Bn, Bdp);
      return num(`How many digits can go in the box to make ${pat} ${sign === '>' ? '&gt;' : '&lt;'} ${Bs} true?`, [{ ans: ok.length }],
        `Compare place by place, trying 0 to 9 in the box. The digits that work are ${listAnd(ok)}: ${ok.length} of them.`);
    } },
    { t: 'count every way', g: R => {
      const o = gen(() => { const s = R.pick([10, 100]), lo = R.int(0, 9000), hi = lo + R.int(s === 10 ? 20 : 150, s === 10 ? 300 : 2500); let first = lo + 1; while (first % s) first++; let last = hi - 1; while (last % s) last--; return { s, lo, hi, first, last, cnt: (last - first) / s + 1 }; },
        o => o.cnt >= 3 && o.cnt <= 40 && (o.lo % o.s !== 0 || o.hi % o.s !== 0));
      const { s, lo, hi, first, last, cnt } = o, S = n => String(+(n / 1000).toFixed(3)), dp = s === 10 ? 'two' : 'one';
      return num(`How many numbers with at most ${dp} decimal place${dp === 'one' ? '' : 's'} are between ${S(lo)} and ${S(hi)}? (Do not count the ends.)`, [{ ans: cnt }],
        `Count in ${s === 10 ? 'hundredths' : 'tenths'}: the first is ${S(first)} and the last is ${S(last)}. That is ${last / s} − ${first / s} + 1 = ${cnt} numbers.`);
    } });

  B('II.7.07',
    { t: 'missing digits', g: R => {
      const L = R.pick([3, 4]);
      const [A, Bn] = gen(() => [R.int(10 ** (L - 1), 10 ** L - 1), R.int(10 ** (L - 1), 10 ** L - 1)], ([a, b]) => nCarries(a, b, L) >= 2);
      const pl = ['Hundredths', 'Tenths', 'Ones', 'Tens'], ins = d => d.slice(0, -2).join('') + '.' + d.slice(-2).join('');
      const h = hidePair(R, A, Bn, '+', L, pl, ins);
      return num(`Find the missing digits: ${h.aTxt} + ${h.bTxt} = ${dec(h.res, 2)}`, [{ label: 'first □', ans: h.da }, { label: 'second □', ans: h.db }],
        `Line up the points and work from the right, carrying as you go. ${h.pa < h.pb ? h.whyA + '. ' + h.whyB : h.whyB + '. ' + h.whyA}. Check: ${dec(A, 2)} + ${dec(Bn, 2)} = ${dec(h.res, 2)}.`);
    } },
    { t: 'closest sum', g: R => {
      const o = gen(() => {
        const ds = R.sample([1, 2, 3, 4, 5, 6, 7, 8, 9], 4), T = R.int(5, 15); let best = null, bp, bestSums = new Set();
        for (const p of perms(ds)) { const s = 10 * (p[0] + p[2]) + p[1] + p[3], dist = Math.abs(s - 10 * T); if (best === null || dist < best) { best = dist; bp = p; bestSums = new Set([s]); } else if (dist === best) bestSums.add(s); }
        return { ds, T, bp, best, bestSums };
      }, o => o.bestSums.size === 1 && o.best > 0);
      const { ds, T, bp, best } = o, s = 10 * (bp[0] + bp[2]) + bp[1] + bp[3];
      return num(`Put the digits ${ds.slice().sort((a, b) => a - b).join(', ')} in the boxes, one each: □.□ + □.□. What sum closest to ${T} can you make?`, [{ ans: s / 10 }],
        `The ones digits give whole numbers and the tenths give tenths. The best is ${bp[0]}.${bp[1]} + ${bp[2]}.${bp[3]} = ${dec(s, 1)}, which is ${dec(best, 1)} from ${T}; no sum gets closer.`);
    } });

  B('II.7.11',
    { t: 'work backwards', g: R => {
      const o = gen(() => { const p = R.int(0, 1), q = R.int(1, 2), X = R.int(2, p ? 99 : 12), A = R.int(2, q === 1 ? 9 : 40); return { p, q, X, A }; }, o => o.p + o.q <= 3 && o.X % 10 !== 0 && o.A % 10 !== 0);
      const { p, q, X, A } = o, xs = dec(X, p), as = dec(A, q), cs = String(+((X * A) / 10 ** (p + q)).toFixed(3)), bothL = R.bool();
      return num(bothL ? `Find □: ${as} × □ = ${cs}` : `Find □: □ × ${as} = ${cs}`, [{ ans: +(X / 10 ** p).toFixed(3) }],
        `□ = ${cs} ÷ ${as}. Think ${X * A} ÷ ${A} = ${X}, then place the point: ${as} has ${q} decimal place${q > 1 ? 's' : ''} and ${cs} has ${p + q}, so □ = ${xs}.`);
    } },
    { t: 'one product, two uses', g: R => {
      const o = gen(() => { const a = R.int(12, 98), b = R.int(12, 98), e = [0, 1, 2, 3].map(() => R.int(-2, 1)), op = R.pick(['+', '−']); return { a, b, e, op }; },
        o => { const s1 = o.e[0] + o.e[1], s2 = o.e[2] + o.e[3]; return o.a % 10 && o.b % 10 && s1 >= -3 && s2 >= -3 && s1 !== s2 && (o.op === '+' || s1 > s2) && !(o.e[0] === o.e[2] && o.e[1] === o.e[3]); });
      const { a, b, e, op } = o, P = a * b, sc = (x, k) => String(+(x * 10 ** k).toFixed(3)), s1 = e[0] + e[1], s2 = e[2] + e[3];
      const t1 = P * 10 ** (s1 + 3), t2 = P * 10 ** (s2 + 3), ans = (op === '+' ? t1 + t2 : t1 - t2) / 1000;
      return num(`${a} × ${b} = ${F(P)}. Use it to work out ${sc(a, e[0])} × ${sc(b, e[1])} ${op} ${sc(a, e[2])} × ${sc(b, e[3])}.`, [{ ans }],
        `Place the points: ${sc(a, e[0])} × ${sc(b, e[1])} = ${fmt(t1 / 1000)} and ${sc(a, e[2])} × ${sc(b, e[3])} = ${fmt(t2 / 1000)}. ${fmt(t1 / 1000)} ${op} ${fmt(t2 / 1000)} = ${fmt(ans)}.`);
    } });

  B('II.7.14',
    { t: 'several steps', g: (R, O) => {
      const th = THB(O), unit = th ? 1 : 5, rp = (lo, hi) => R.int(lo, hi) * unit;
      if (R.bool()) {
        const [x, y] = R.sample(['pens', 'notebooks', 'rulers', 'erasers', 'folders', 'markers'], 2), a = R.int(2, 6), b = R.int(2, 5), p = th ? rp(5, 60) : rp(10, 120), n = th ? rp(5, 90) : rp(10, 180), tot = a * p + b * n;
        return num(`${a} ${x} and ${b} ${y} cost ${M(O, tot)} in all. One of the ${y} costs ${M(O, n)}. How much does one of the ${x} cost?`, [Mf(O, p)],
          `The ${y} cost ${b} × ${M(O, n)} = ${M(O, b * n)}. That leaves ${M(O, tot)} − ${M(O, b * n)} = ${M(O, a * p)} for ${a} ${x}: ${M(O, a * p)} ÷ ${a} = ${M(O, p)}.`);
      }
      const k = R.int(3, 8), p = th ? rp(8, 60) : rp(40, 240), bill = th ? R.pick([500, 1000]) : R.pick([2000, 5000]), ok = bill > k * p;
      const pp = ok ? p : Math.floor(bill / k / (2 * unit)) * unit, ch = bill - k * pp;
      return num(`${R.pick(NAMES)} buys ${k} juices and pays with ${M(O, bill)}. The change is ${M(O, ch)}. How much is one juice?`, [Mf(O, pp)],
        `The juices cost ${M(O, bill)} − ${M(O, ch)} = ${M(O, k * pp)}. One juice is ${M(O, k * pp)} ÷ ${k} = ${M(O, pp)}.`);
    } },
    { t: 'a money puzzle', g: (R, O) => {
      const th = THB(O), unit = th ? 1 : 5;
      if (R.bool()) {
        const [big, small] = R.pick([['bat', 'ball'], ['book', 'bookmark'], ['kite', 'string'], ['lamp', 'bulb'], ['cup', 'saucer']]), s = R.int(th ? 5 : 2, th ? 60 : 60) * unit, d = R.int(th ? 10 : 10, th ? 200 : 200) * unit, T = 2 * s + d;
        return num(`A ${big} and a ${small} cost ${M(O, T)} together. The ${big} costs ${M(O, d)} more than the ${small}. How much is the ${small}?`, [Mf(O, s)],
          `Take away the extra: ${M(O, T)} − ${M(O, d)} = ${M(O, 2 * s)} is two ${small}s' worth, so the ${small} is ${M(O, s)} (and the ${big} ${M(O, s + d)}).`);
      }
      const [x, y] = R.pick([['apples', 'pears'], ['buns', 'drinks'], ['pens', 'pencils'], ['stamps', 'cards']]), a = R.int(th ? 5 : 4, th ? 40 : 40) * unit, b = R.int(th ? 5 : 4, th ? 40 : 40) * unit;
      const X = 2 * a + 3 * b, Y = 3 * a + 2 * b;
      return num(`2 ${x} and 3 ${y} cost ${M(O, X)}. 3 ${x} and 2 ${y} cost ${M(O, Y)}. How much do 1 ${x.slice(0, -1)} and 1 ${y.slice(0, -1)} cost together?`, [Mf(O, a + b)],
        `Put both orders together: 5 ${x} and 5 ${y} cost ${M(O, X)} + ${M(O, Y)} = ${M(O, X + Y)}. One of each is ${M(O, X + Y)} ÷ 5 = ${M(O, a + b)}.`);
    } });

  /* =================== II.8 Expressions =================== */

  B('II.8.01',
    { t: 'place the brackets', g: R => {
      const o = gen(() => {
        const n = [0, 1, 2, 3].map(() => R.int(2, 9)), op = [0, 1, 2].map(() => R.pick(['+', '−', '×']));
        const [a, b, c, d] = n, [o1, o2, o3] = op, plain = `${a} ${o1} ${b} ${o2} ${c} ${o3} ${d}`;
        const pl = [`(${a} ${o1} ${b}) ${o2} ${c} ${o3} ${d}`, `${a} ${o1} (${b} ${o2} ${c}) ${o3} ${d}`, `${a} ${o1} ${b} ${o2} (${c} ${o3} ${d})`,
          `(${a} ${o1} ${b} ${o2} ${c}) ${o3} ${d}`, `${a} ${o1} (${b} ${o2} ${c} ${o3} ${d})`, `(${a} ${o1} ${b}) ${o2} (${c} ${o3} ${d})`];
        const pv = evalStr(plain), vals = pl.map(evalStr), seen = new Map();
        pl.forEach((s, i) => { if (!seen.has(vals[i])) seen.set(vals[i], s); });
        const good = pl.filter((s, i) => vals[i] >= 0 && vals[i] !== pv && vals.filter(v => v === vals[i]).length === 1);
        return { plain, pv, seen, good, vals, pl, op };
      }, o => o.good.length >= 1 && o.seen.size >= 3 && o.op.includes('×'));
      const pick = R.pick(o.good), T = evalStr(pick), ds = [...o.seen.values()].filter(s => s !== pick).slice(0, 3);
      return choice(R, `Which one has the value ${T}?`, pick, ds, `Brackets first: ${pick} = ${T}. Without brackets, ${o.plain} = ${o.pv}.`);
    } },
    { t: 'choose the signs', g: R => {
      if (R.bool()) {
        const n = [0, 1, 2, 3].map(() => R.int(2, 9)); let best = -1e9, bs = '';
        for (const p of perms(['+', '−', '×'])) { const s = `${n[0]} ${p[0]} ${n[1]} ${p[1]} ${n[2]} ${p[2]} ${n[3]}`, v = evalStr(s); if (v > best) { best = v; bs = s; } }
        return num(`Put +, − and × in the boxes, one of each: ${n[0]} □ ${n[1]} □ ${n[2]} □ ${n[3]}. What is the largest value you can make?`, [{ ans: best }],
          `There are only 6 orders to try (× first!). The best is ${bs} = ${best}.`);
      }
      const o = gen(() => {
        const n = [0, 1, 2, 3].map(() => R.int(1, 9)), all = [];
        for (const x of ['+', '−', '×']) for (const y of ['+', '−', '×']) for (const z of ['+', '−', '×']) { const s = `${n[0]} ${x} ${n[1]} ${y} ${n[2]} ${z} ${n[3]}`; all.push([s, evalStr(s)]); }
        const T = R.pick(all)[1], hits = all.filter(a => a[1] === T).map(a => a[0]);
        return { n, T, hits };
      }, o => o.T >= 0 && o.hits.length >= 2 && o.hits.length <= 5);
      const { n, T, hits } = o;
      return num(`Each box gets +, − or × (signs may repeat): ${n[0]} □ ${n[1]} □ ${n[2]} □ ${n[3]} = ${T}. How many ways work? (Do × before + and −.)`, [{ ans: hits.length }],
        `Checking all 27 ways, these work: ${hits.join('; ')}. That is ${hits.length}.`);
    } });

  B('II.8.04',
    { t: 'which term?', g: R => {
      const s = R.int(1, 20), d = R.int(2, 9), n = R.int(15, 60), v = s + (n - 1) * d;
      return num(`${s}, ${s + d}, ${s + 2 * d}, ${s + 3 * d}, … Which term is ${v}?`, [{ ans: n }],
        `From ${s} to ${v} is ${v - s} = ${n - 1} steps of ${d}. Term 1 plus ${n - 1} steps is term ${n}.`);
    } },
    { t: 'count and add cleverly', g: R => {
      const kind = R.int(0, 2);
      if (kind === 0) { const n = R.int(4, 20) * 5, ans = n * (n + 1) / 2;
        return num(`What is 1 + 2 + 3 + … + ${n}?`, [{ ans }], `Pair the ends: 1 + ${n} = 2 + ${n - 1} = … = ${n + 1}. ${n} numbers make ${n} ÷ 2 pairs: ${n} × ${n + 1} ÷ 2 = ${F(ans)}.`); }
      if (kind === 1) { const n = R.int(10, 50), ans = n * n;
        return num(`What is 1 + 3 + 5 + … + ${2 * n - 1}? (all the odd numbers up to ${2 * n - 1})`, [{ ans }], `There are ${n} odd numbers. Pair the ends: 1 + ${2 * n - 1} = ${2 * n}, and ${n} numbers make ${n} ÷ 2 pairs: ${n} × ${2 * n} ÷ 2 = ${F(ans)}.`); }
      const N = R.int(20, 400); let cnt = 0; for (let k = 1; k <= N; k++) cnt += String(k).length;
      const two = Math.min(N, 99) - 9, three = Math.max(0, N - 99);
      return num(`How many digits do you write to list all the numbers from 1 to ${N}?`, [{ ans: cnt }],
        `1 to 9: 9 digits. 10 to ${Math.min(N, 99)}: ${two} × 2 = ${two * 2}.${three ? ` 100 to ${N}: ${three} × 3 = ${three * 3}.` : ''} Total ${F(cnt)}.`);
    } });

  B('II.8.09',
    { t: 'swap one for another', g: R => {
      const t = R.int(2, 12);
      if (R.bool()) { const k = R.int(2, 4), m = R.int(1, 3), T = (k + m) * t, askSq = R.bool();
        return num(`${Array(k).fill('▲').join(' + ')} = ■ and ■ + ${m > 1 ? m + ' × ' : ''}▲ = ${T}. What is ${askSq ? '■' : '▲'}?`, [{ ans: askSq ? k * t : t }],
          `Swap ■ for ${k} ▲: ${k + m} ▲ = ${T}, so ▲ = ${t}${askSq ? ` and ■ = ${k} × ${t} = ${k * t}` : ''}.`); }
      const c = R.int(2, 15), T = 2 * t + c, askSq = R.bool();
      return num(`■ = ▲ + ${c} and ■ + ▲ = ${T}. What is ${askSq ? '■' : '▲'}?`, [{ ans: askSq ? t + c : t }],
        `Swap ■ for ▲ + ${c}: 2 ▲ + ${c} = ${T}, so 2 ▲ = ${T - c} and ▲ = ${t}${askSq ? `. Then ■ = ${t + c}` : ''}.`);
    } },
    { t: 'three unknowns', g: R => {
      const [x, y, z] = R.sample(Array.from({ length: 19 }, (_, i) => i + 2), 3), s1 = x + y, s2 = y + z, s3 = x + z, S = x + y + z, ask = R.int(0, 3);
      const nm = ['▲ + ■ + ●', '▲', '■', '●'][ask], ans = [S, x, y, z][ask];
      const rest = ['', `▲ = ${S} − (■ + ●) = ${S} − ${s2} = ${x}`, `■ = ${S} − (▲ + ●) = ${S} − ${s3} = ${y}`, `● = ${S} − (▲ + ■) = ${S} − ${s1} = ${z}`][ask];
      return num(`▲ + ■ = ${s1}, ■ + ● = ${s2} and ▲ + ● = ${s3}. What is ${nm}?`, [{ ans }],
        `Add all three: each shape is counted twice, so 2 × (▲ + ■ + ●) = ${s1 + s2 + s3} and ▲ + ■ + ● = ${S}${ask ? '. Then ' + rest : ''}.`);
    } });

  /* =================== II.9 Measurement & geometry =================== */

  B('II.9.06',
    { t: 'work backwards', g: (R, O) => {
      const u = LEN(O), w = R.int(2, 15);
      if (R.bool()) { const k = R.int(2, 5), l = k * w, P = 2 * (l + w);
        return num(`A rectangle is ${k} times as long as it is wide. Its perimeter is ${P} ${u}. What is its area, in ${u}²?`, [{ ans: l * w }],
          `The perimeter is ${2 * (k + 1)} widths, so the width is ${P} ÷ ${2 * (k + 1)} = ${w} ${u} and the length ${l} ${u}. Area = ${l} × ${w} = ${l * w} ${u}².`); }
      const m = R.int(2, 12), l = w + m, P = 2 * (l + w);
      return num(`A rectangle is ${m} ${u} longer than it is wide. Its perimeter is ${P} ${u}. What is its area, in ${u}²?`, [{ ans: l * w }],
        `Length + width = ${P} ÷ 2 = ${l + w}. Take away the extra ${m}: 2 widths = ${2 * w}, so width ${w}, length ${l}. Area = ${l} × ${w} = ${l * w} ${u}².`);
    } },
    { t: 'cut and join', g: (R, O) => {
      const u = LEN(O);
      if (R.bool()) { const k = R.int(2, 6), t = R.int(1, 6), s = k * t, ans = 2 * (s + t);
        return num(`A square with a perimeter of ${4 * s} ${u} is cut into ${k} equal strips. What is the perimeter of one strip, in ${u}?`, [{ ans }],
          `The side is ${4 * s} ÷ 4 = ${s} ${u}. Each strip is ${s} by ${s} ÷ ${k} = ${t}, so its perimeter is 2 × (${s} + ${t}) = ${ans} ${u}.`); }
      const n = R.int(2, 6), s = R.int(2, 12), Pr = (2 * n + 2) * s;
      return num(`${n} equal squares are placed in a row to make a rectangle with a perimeter of ${Pr} ${u}. What is the perimeter of one square, in ${u}?`, [{ ans: 4 * s }],
        `The rectangle is ${n} sides long and 1 side wide, so its perimeter is ${2 * n + 2} sides. One side is ${Pr} ÷ ${2 * n + 2} = ${s}, and a square's perimeter is 4 × ${s} = ${4 * s} ${u}.`);
    } });

  B('II.9.08',
    { t: 'work backwards', g: (R, O) => {
      const u = LEN(O);
      if (R.bool()) { const a = R.int(2, 15), b = gen(() => R.int(2, 15), b => b !== a), A = a * b, P = 2 * (a + b);
        return num(`A rectangle has an area of ${A} ${u}² and one side of ${a} ${u}. What is its perimeter, in ${u}?`, [{ ans: P }],
          `The other side is ${A} ÷ ${a} = ${b} ${u}. Perimeter = 2 × (${a} + ${b}) = ${P} ${u}.`); }
      const s = R.pick([4, 6, 8, 9, 10, 12]), [a, b] = gen(() => { const a = R.int(2, s - 1); return [a, s * s / a]; }, ([a, b]) => Number.isInteger(b) && b !== s);
      return num(`A square has the same area as a ${a} ${u} by ${b} ${u} rectangle. What is the perimeter of the square, in ${u}?`, [{ ans: 4 * s }],
        `The area is ${a} × ${b} = ${s * s} ${u}². ${s} × ${s} = ${s * s}, so the side is ${s} and the perimeter is 4 × ${s} = ${4 * s} ${u}.`);
    } },
    { t: 'borders and strips', g: (R, O) => {
      const u = O.units === 'imperial' ? 'ft' : 'm';
      if (R.bool()) { const L = R.int(5, 20), W = R.int(3, L), p = R.int(1, 3), ans = (L + 2 * p) * (W + 2 * p) - L * W;
        return num(`A ${L} ${u} by ${W} ${u} garden has a path ${p} ${u} wide all the way around the outside. What is the area of the path, in ${u}²?`, [{ ans }],
          `Garden and path together: ${L + 2 * p} × ${W + 2 * p} = ${(L + 2 * p) * (W + 2 * p)} ${u}². Take away the garden, ${L * W}: ${ans} ${u}².`); }
      const k = R.int(2, 5), t = R.int(1, 5), s = k * t, P = 2 * (s + t);
      return num(`A square is cut into ${k} equal strips. Each strip has a perimeter of ${P} ${u}. What is the area of the square, in ${u}²?`, [{ ans: s * s }],
        `A strip is 1 side long and ${fh(1, k)} of a side wide, so its perimeter is ${2 * k + 2} × (${fh(1, k)} side). ${fh(1, k)} side = ${P} ÷ ${2 * k + 2} = ${t}, so the side is ${s} and the area ${s} × ${s} = ${s * s} ${u}².`);
    } });

  B('II.9.09',
    { t: 'two clues', g: (R, O) => {
      const u = LEN(O), [a, b] = gen(() => [R.int(2, 14), R.int(3, 15)], ([a, b]) => a < b);
      return num(`A rectangle with whole-number sides has an area of ${a * b} ${u}² and a perimeter of ${2 * (a + b)} ${u}. How long are its sides?`, [{ label: 'shorter', ans: a }, { label: 'longer', ans: b }],
        `Length + width = ${2 * (a + b)} ÷ 2 = ${a + b}. The factor pair of ${a * b} that adds to ${a + b} is ${a} × ${b}.`);
    } },
    { t: 'count every way', g: (R, O) => {
      const u = LEN(O);
      if (R.bool()) {
        const o = gen(() => { const S = R.int(8, 20), A = R.int(S, S * S / 4 - 1), L = []; for (let a = 1; 2 * a <= S; a++) if (a * (S - a) > A) L.push([a, S - a]); return { S, A, L }; }, o => o.L.length >= 2 && o.L.length < Math.floor(o.S / 2));
        const { S, A, L } = o;
        return num(`How many different rectangles with whole-number sides have a perimeter of ${2 * S} ${u} and an area of more than ${A} ${u}²? (3 by 5 and 5 by 3 count as one.)`, [{ ans: L.length }],
          `The sides add to ${S}. Areas above ${A}: ${L.map(([a, b]) => `${a} × ${b} = ${a * b}`).join(', ')}. That is ${L.length}.`);
      }
      const o = gen(() => { const N = R.int(24, 100), prs = []; for (let a = 1; a * a <= N; a++) if (N % a === 0) prs.push([a, N / a]); const Q = 2 * R.pick(prs.map(([a, b]) => a + b)) + R.int(1, 3) * 2; return { N, Q, prs, L: prs.filter(([a, b]) => 2 * (a + b) < Q) }; },
        o => o.prs.length >= 3 && o.L.length >= 2 && o.L.length < o.prs.length);
      const { N, Q, L } = o;
      return num(`How many different rectangles with whole-number sides have an area of ${N} ${u}² and a perimeter of less than ${Q} ${u}? (3 by 5 and 5 by 3 count as one.)`, [{ ans: L.length }],
        `Factor pairs of ${N} with perimeter under ${Q}: ${L.map(([a, b]) => `${a} × ${b} (perimeter ${2 * (a + b)})`).join(', ')}. That is ${L.length}.`);
    } });

  B('II.9.11',
    { t: 'cubes in a box', g: (R, O) => {
      const u = LEN(O), c = R.pick([2, 3, 4, 5]), [x, y, z] = [R.int(2, 6), R.int(2, 6), R.int(1, 5)], ans = x * y * z;
      return num(`How many cubes with ${c} ${u} edges fit exactly in a box ${c * x} ${u} by ${c * y} ${u} by ${c * z} ${u}?`, [{ ans }],
        `Along the edges fit ${c * x} ÷ ${c} = ${x}, ${c * y} ÷ ${c} = ${y} and ${c * z} ÷ ${c} = ${z} cubes. ${x} × ${y} × ${z} = ${ans}.`);
    } },
    { t: 'the painted cube', g: R => {
      const n = R.int(3, 8), j = R.pick([0, 1, 1, 2, 2, 3]), m = n - 2, ans = [m ** 3, 6 * m * m, 12 * m, 8][j];
      const why = [`The unpainted cubes form the inside, a ${m} × ${m} × ${m} cube: ${ans}.`, `Each of the 6 faces has a ${m} × ${m} middle: 6 × ${m * m} = ${ans}.`, `Each of the 12 edges has ${m} cube${m > 1 ? 's' : ''} between its corners: 12 × ${m} = ${ans}.`, `Only the 8 corner cubes have 3 painted faces.`][j];
      return num(`A ${n} × ${n} × ${n} cube is built from small cubes and painted on the outside. How many small cubes have ${j === 0 ? 'no painted faces' : `exactly ${j} painted face${j > 1 ? 's' : ''}`}?`, [{ ans }], why);
    } });

  B('II.9.15',
    { t: 'split the angle', g: R => {
      const kind = R.int(0, 2);
      if (kind === 0) { const [tot, k] = R.pick([[90, 2], [90, 4], [90, 5], [90, 8], [180, 2], [180, 3], [180, 4], [180, 5], [180, 8], [180, 9], [180, 11], [90, 9]]), x = tot / (k + 1), big = R.bool();
        return num(`Two angles together make a ${tot === 90 ? 'right' : 'straight'} angle. One is ${k} times the other. How big is the ${big ? 'larger' : 'smaller'} angle, in degrees?`, [{ ans: big ? k * x : x }],
          `The two angles are ${k + 1} equal parts of ${tot}°: ${tot} ÷ ${k + 1} = ${x}°. The larger is ${k} × ${x} = ${k * x}°.`); }
      if (kind === 1) { const tot = R.pick([90, 180]), m = 2 * R.int(3, tot === 90 ? 30 : 60), x = (tot - m) / 2, big = R.bool();
        return num(`Two angles together make a ${tot === 90 ? 'right' : 'straight'} angle. One is ${m}° bigger than the other. How big is the ${big ? 'larger' : 'smaller'} angle, in degrees?`, [{ ans: big ? x + m : x }],
          `Take away the extra ${m}°: ${tot} − ${m} = ${tot - m} splits into two equal angles of ${x}°. The larger is ${x} + ${m} = ${x + m}°.`); }
      const [a, b, c] = R.pick([[1, 2, 3], [1, 2, 5], [1, 3, 5], [1, 1, 4], [2, 3, 4], [1, 2, 6], [1, 3, 8], [2, 3, 7], [1, 4, 7], [3, 4, 5]]), x = 360 / (a + b + c);
      return num(`Three angles around a point are in the ratio ${a} : ${b} : ${c}, so they are ${a === 1 ? '' : a}x, ${b === 1 ? '' : b}x and ${c}x. How big is the largest angle, in degrees?`, [{ ans: c * x }],
        `Around a point is 360°. ${a + b + c}x = 360, so x = ${x}° and the largest is ${c} × ${x} = ${c * x}°.`);
    } },
    { t: 'clock hands', g: R => {
      const h = R.int(1, 12), m = R.pick([0, 10, 20, 30, 40, 50]), mA = 6 * m, hA = (30 * h) % 360 + m / 2, d = Math.abs(hA - mA), ans = Math.min(d, 360 - d);
      return num(`What is the smaller angle between the hour hand and the minute hand at ${h}:${String(m).padStart(2, '0')}?`, [{ ans }],
        `From 12, the minute hand is at ${mA}°. The hour hand moves 30° each hour and ½° each minute: ${hA}°. The gap is ${d}°${d > 180 ? `, so the smaller angle is 360 − ${d} = ${ans}°` : ''}.`);
    } });

  /* =================== II.10 Data =================== */

  B('II.10.04',
    { t: 'fill the two-way table', g: R => {
      const T = R.int(20, 36), G = R.int(8, T - 8), Bn = T - G, gw = R.int(2, G - 2), bw = R.int(2, Bn - 2), ask = R.int(0, 2);
      const q = ['How many boys do not walk?', 'How many girls do not walk?', 'How many students do not walk?'][ask], ans = [Bn - bw, G - gw, T - gw - bw][ask];
      const ex = ['There are ' + T + ' − ' + G + ' = ' + Bn + ' boys, so ' + Bn + ' − ' + bw + ' = ' + ans + ' boys do not walk.', `${G} − ${gw} = ${ans} girls do not walk.`, `${gw} + ${bw} = ${gw + bw} walk, so ${T} − ${gw + bw} = ${ans} do not.`][ask];
      return num(`A class has ${T} students: ${G} girls and the rest boys. ${gw} girls and ${bw} boys walk to school. ${q}`, [{ ans }], ex);
    } },
    { t: 'overlapping groups', g: R => {
      const o = gen(() => { const T = R.int(20, 40), n = R.int(0, 6), a = R.int(6, T - n - 2), b = R.int(6, T - n - 2), x = a + b - (T - n); return { T, n, a, b, x }; }, o => o.x >= 1 && o.x < Math.min(o.a, o.b));
      const { T, n, a, b, x } = o, ask = R.int(0, 2), [p, q] = R.pick([['cats', 'dogs'], ['soccer', 'swimming'], ['apples', 'bananas'], ['drawing', 'music']]);
      if (ask === 0) return num(`${T} kids were asked. ${a} like ${p}, ${b} like ${q}, and ${n} like neither. How many like both?`, [{ ans: x }],
        `${T} − ${n} = ${T - n} like at least one. ${a} + ${b} = ${a + b} counts the "both" kids twice, so both = ${a + b} − ${T - n} = ${x}.`);
      if (ask === 1) return num(`${T} kids were asked. ${a} like ${p}, ${b} like ${q}, and ${x} like both. How many like neither?`, [{ ans: n }],
        `At least one: ${a} + ${b} − ${x} = ${T - n} (the "both" kids were counted twice). Neither: ${T} − ${T - n} = ${n}.`);
      return num(`${T} kids were asked. ${a} like ${p}, ${b} like ${q}, and ${n} like neither. How many like ${p} but not ${q}?`, [{ ans: a - x }],
        `Both = ${a} + ${b} − (${T} − ${n}) = ${x}. So ${p} only = ${a} − ${x} = ${a - x}.`);
    } });

  B('II.10.05',
    { t: 'work backwards', g: R => {
      const o = gen(() => { const n = R.int(3, 5), Mn = R.int(60, 95), sc = Array.from({ length: n - 1 }, () => R.int(55, 100)), last = n * Mn - sc.reduce((a, b) => a + b, 0); return { n, Mn, sc, last }; }, o => o.last >= 40 && o.last <= 100);
      const { n, Mn, sc, last } = o, nm = R.pick(NAMES), s = sc.reduce((a, b) => a + b, 0);
      return num(`${nm}'s mean score on ${n} tests is ${Mn}. The first ${n - 1} scores are ${listAnd(sc)}. What was the last score?`, [{ ans: last }],
        `The total must be ${n} × ${Mn} = ${n * Mn}. The first ${n - 1} add to ${s}, so the last is ${n * Mn} − ${s} = ${last}.`);
    } },
    { t: 'a mean puzzle', g: R => {
      if (R.bool()) {
        const o = gen(() => { const k = R.int(4, 9), M1 = R.int(8, 30), M2 = M1 + R.pick([-3, -2, -1, 1, 2, 3]), x = k * M1 - (k - 1) * M2; return { k, M1, M2, x }; }, o => o.x >= 1 && o.x <= 99 && o.M2 > 0);
        const { k, M1, M2, x } = o;
        return num(`The mean of ${k} numbers is ${M1}. One number is removed, and the mean of the rest is ${M2}. What number was removed?`, [{ ans: x }],
          `Before: total ${k} × ${M1} = ${k * M1}. After: ${k - 1} × ${M2} = ${(k - 1) * M2}. The removed number is ${k * M1} − ${(k - 1) * M2} = ${x}.`);
      }
      const o = gen(() => { const k = R.int(3, 8), M1 = R.int(8, 30), M2 = M1 + R.pick([-2, -1, 1, 2, 3]), x = (k + 1) * M2 - k * M1; return { k, M1, M2, x }; }, o => o.x >= 0 && o.x <= 99);
      const { k, M1, M2, x } = o;
      return num(`The mean of ${k} numbers is ${M1}. One more number is added, and the mean becomes ${M2}. What number was added?`, [{ ans: x }],
        `Before: total ${k} × ${M1} = ${k * M1}. After: ${k + 1} × ${M2} = ${(k + 1) * M2}. The new number is ${(k + 1) * M2} − ${k * M1} = ${x}.`);
    } });

  B('II.10.06',
    { t: 'make mean equal median', g: R => {
      const med5 = a => a.slice().sort((x, y) => x - y)[2];
      const o = gen(() => { const v = R.sample(Array.from({ length: 30 }, (_, i) => i + 1), 4), sols = []; for (let x = 0; x <= 200; x++) { const a = [...v, x]; if (a.reduce((s, t) => s + t, 0) === 5 * med5(a)) sols.push(x); } return { v, sols }; }, o => o.sols.length === 1);
      const { v, sols: [x] } = o, a = [...v, x].sort((p, q) => p - q), md = a[2];
      return num(`The numbers ${v.join(', ')} and □ have a mean equal to their median. □ is a whole number. What is □?`, [{ ans: x }],
        `With □ = ${x} the list in order is ${a.join(', ')}: the median is ${md} and the mean is ${5 * md} ÷ 5 = ${md}. No other whole number works.`);
    } },
    { t: 'build the data', g: R => {
      const o = gen(() => { const md = R.int(4, 14), mo = R.int(1, md - 1), Mn = R.int(md - 2, md + 6), Rr = 5 * Mn - 2 * mo - md; return { md, mo, Mn, Rr }; }, o => o.Mn > 0 && o.Rr >= 2 * o.md + 4);
      const { md, mo, Mn, Rr } = o, big = R.bool(), maxE = Rr - md - 1, minE = Math.floor(Rr / 2) + 1, ans = big ? maxE : minE;
      return num(`Five positive whole numbers have a mean of ${Mn}, a median of ${md}, and a mode of ${mo} (only one mode). What is the ${big ? 'largest' : 'smallest'} the biggest number can be?`, [{ ans }],
        `The sum is 5 × ${Mn} = ${5 * Mn}. The mode ${mo} is below the median, so the list is ${mo}, ${mo}, ${md}, then two different numbers above ${md} adding to ${Rr}. ${big ? `Make the fourth as small as possible (${md + 1}), so the biggest is ${maxE}` : `Make them as close as possible: ${Rr - minE} and ${minE}`}.`);
    } });
})();
