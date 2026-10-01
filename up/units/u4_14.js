/* Era IV · Unit IV.14 Counting & probability (IV.14.01–IV.14.12) */
(function (G) {
  const E = G.E4, V = E.V, C = E.C, M = s => E.mx(s);
  const S = (id, name, steps) => E.skill({ id, name, steps });
  const gg = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };
  const fact = n => { let p = 1; for (let i = 2; i <= n; i++) p *= i; return p; };
  const nP = (n, r) => { let p = 1; for (let i = 0; i < r; i++) p *= n - i; return p; };
  const nC = (n, r) => { if (r < 0 || r > n) return 0; r = Math.min(r, n - r); let c = 1; for (let i = 0; i < r; i++) c = c * (n - i) / (i + 1); return Math.round(c); };
  const fr = (n, d) => { if (d < 0) { n = -n; d = -d; } const g = gg(n, d); return { frac: [n / g, d / g], form: 'any' }; };
  const fs = (n, d) => E.fracStr(n, d);                                // '3/8'
  const FM = (n, d) => M(fs(n, d));                                    // typeset reduced fraction
  const F = (n, d) => { const s = fs(n, d); return s.includes('/') ? M(s) : s; };
  const cl = x => +(+x).toFixed(9);                                    // strip float noise
  const dc = x => String(cl(x));                                       // decimal as text
  const fm = x => E.fmt(x);                                            // 13983816 → 13,983,816
  const mi = s => `<mrow>${/^\d+$/.test(String(s)) ? `<mn>${s}</mn>` : `<mi>${s}</mi>`}</mrow>`;
  const BN = (n, r) => `<math><mrow><mo>(</mo><mfrac linethickness="0">${mi(n)}${mi(r)}</mfrac><mo>)</mo></mrow></math>`;          // binomial coefficient
  const PN = (n, r) => `<math><mmultiscripts><mi>P</mi>${mi(r)}<none/><mprescripts/><none/>${mi(n)}</mmultiscripts></math>`;          // ⁿPᵣ
  const prodTxt = (n, r) => Array.from({ length: r }, (_, i) => n - i).join(' × ');
  const cur = O => (O && O.coins === 'THB') ? '฿' : '$';
  const money = (O, x) => (x < 0 ? '−' : '') + cur(O) + E.fmt(Math.abs(cl(x)), { dp: Number.isInteger(cl(x)) ? 0 : 2 });
  const NAMES = ['Ana', 'Ben', 'Chloe', 'Dev', 'Emma', 'Farid', 'Grace', 'Hugo', 'Ivy', 'Jon', 'Kai', 'Lena', 'Maya', 'Noah', 'Omar', 'Priya', 'Rosa', 'Sam', 'Tara', 'Yuki'];
  const two = R => R.sample(NAMES, 2);
  // multiset arrangements of a word
  const counts = w => { const m = {}; for (const ch of w) m[ch] = (m[ch] || 0) + 1; return m; };
  const arr = w => { const m = counts(w); return Object.values(m).reduce((t, k) => t / fact(k), fact(w.length)); };
  const REP = ['BOOK', 'LETTER', 'BANANA', 'APPLE', 'COFFEE', 'BALLOON', 'PEPPER', 'SUCCESS', 'TOMATO', 'COOKIE', 'GOOGLE', 'ASSESS', 'CHEESE', 'LLAMA', 'KAYAK', 'LEVEL', 'ALGEBRA', 'CALCULUS', 'PARALLEL', 'MISSISSIPPI', 'STATISTICS', 'TATTOO', 'COMMITTEE', 'BOOKKEEPER', 'NOON', 'PIZZAZZ', 'EERIE', 'REFERRER'];
  const repTxt = w => Object.entries(counts(w)).filter(([, k]) => k > 1).map(([c, k]) => `${k} ${c}'s`).join(', ');
  const table = (rows) => `<table class="dt">${rows.map(r => `<tr>${r.map((c, j) => j === 0 ? `<th>${c}</th>` : `<td>${c}</td>`).join('')}</tr>`).join('')}</table>`;

  /* IV.14.01 Factorials & counting */
  const DISTINCT = ['MATH', 'PRIME', 'LOGIC', 'NUMBER', 'FACTOR', 'PLANET', 'CHAIR', 'GRAPHS', 'TRIANGLE', 'HONESTY', 'SQUARE', 'DOZEN', 'CUBE', 'WALTZ'];
  S('IV.14.01', 'Factorials & counting', {
    a: { t: 'the multiplication principle', g: R => { const a = R.int(2, 9), b = R.int(2, 9), c = R.int(2, 8), k = R.int(0, 5);
      if (k === 5) { const n = R.int(3, 10); return E.num(`A quiz has ${n} true-or-false questions. In how many different ways can all ${n} be answered?`, [{ ans: 2 ** n }], `Each question has 2 choices, so multiply: 2 × 2 × … × 2 = ${M('2^' + n)} = ${fm(2 ** n)}.`); }
      if (k === 4) return E.num(`There are ${a} roads from Ashby to Brook and ${b} roads from Brook to Carlow. How many different routes go from Ashby to Carlow through Brook?`, [{ ans: a * b }], `Each of the ${a} first roads pairs with each of the ${b} second roads: ${a} × ${b} = ${a * b}, not ${a} + ${b}.`);
      const txt = [`A café offers ${a} starters, ${b} mains and ${c} desserts. How many different three-course meals (one of each) can you order?`,
        `You own ${a} shirts, ${b} pairs of pants and ${c} pairs of shoes. How many different outfits of one of each can you make?`,
        `A sandwich shop has ${a} breads, ${b} fillings and ${c} sauces. How many sandwiches with one bread, one filling and one sauce are possible?`,
        `A lock code is one of ${a} colors, then one of ${b} letters, then one of ${c} digits. How many codes are possible?`][k];
      return E.num(txt, [{ ans: a * b * c }], `Multiply the choices at each stage: ${a} × ${b} × ${c} = ${a * b * c}. Adding (${a + b + c}) would count single choices, not whole combinations.`); } },
    b: { t: 'n!', g: R => { const k = R.int(0, 2);
      if (k === 0) { const n = R.int(0, 10);
        return E.num(`Evaluate ${M(n + '!')}.`, [{ ans: fact(n) }], n === 0 ? '0! = 1 by definition: there is exactly one way to arrange nothing.' : n === 1 ? '1! = 1.' : `${n}! = ${n <= 7 ? prodTxt(n, n) : `${n} × ${n - 1} × … × 2 × 1`} = ${fm(fact(n))}.`); }
      if (k === 1) { const n = R.int(3, 10);
        return E.num(`If ${M('n!')} = ${fact(n)}, what is n?`, [{ label: 'n =', ans: n }], `Multiply 1 × 2 × 3 × … until you reach ${fm(fact(n))}: that takes you up to ${n}, so n = ${n}.`); }
      const n = R.int(6, 12);
      return E.num(`Given that ${M((n - 1) + '!')} = ${fm(fact(n - 1))}, find ${M(n + '!')}.`, [{ ans: fact(n) }], `${n}! = ${n} × ${n - 1}! = ${n} × ${fm(fact(n - 1))} = ${fm(fact(n))}. No need to start again from 1.`); } },
    c: { t: 'arrange every object', g: R => { const k = R.int(0, 4), n = R.int(3, 9);
      if (k === 4) { const w = R.pick(DISTINCT);
        return E.num(`How many different arrangements of the letters of ${w} are there? (Every letter is different.)`, [{ ans: fact(w.length) }], `${w.length} different letters in ${w.length} places: ${w.length}! = ${fm(fact(w.length))}.`); }
      const txt = [`In how many ways can ${n} different books be arranged in a row on a shelf?`, `${n} runners finish a race with no ties. In how many different orders can they finish?`,
        `In how many ways can ${n} people stand in a line for a photo?`, `A playlist has ${n} different songs. In how many orders can all ${n} be played?`][k];
      return E.num(txt, [{ ans: fact(n) }], `${n} choices for the first spot, ${n - 1} for the next, and so on: ${n}! = ${prodTxt(n, n)} = ${fm(fact(n))}.`); } },
    d: { t: 'simplify factorial expressions', g: R => { const k = R.int(0, 2);
      if (k === 0) { const n = R.int(5, 12), m = n - R.int(1, 3);
        return E.num(`Evaluate ${M(`(${n}!)/(${m}!)`)}.`, [{ ans: nP(n, n - m) }], `The ${m}! cancels, leaving ${n - m === 1 ? n : prodTxt(n, n - m) + ' = ' + nP(n, n - m)}. Factorials cancel; don't divide ${n} by ${m}.`); }
      if (k === 1) { const n = R.int(5, 10), m = R.int(2, n - 2);
        return E.num(`Evaluate ${M(`(${n}!)/(${m}!${n - m}!)`)}.`, [{ ans: nC(n, m) }], `Cancel ${Math.max(m, n - m)}!: ${prodTxt(n, Math.min(m, n - m))} ÷ ${Math.min(m, n - m)}! = ${nP(n, Math.min(m, n - m))} ÷ ${fact(Math.min(m, n - m))} = ${nC(n, m)}.`); }
      const F5 = [['(n+1)!/(n!)', 'n+1', '(n+1)! = (n+1)·n!, so the n! cancels'], ['(n!)/((n-1)!)', 'n', 'n! = n·(n−1)!, so (n−1)! cancels'], ['(n+2)!/(n!)', '(n+2)(n+1)', '(n+2)! = (n+2)(n+1)·n!'],
        ['(n+1)!/((n-1)!)', '(n+1)n', '(n+1)! = (n+1)·n·(n−1)!'], ['(n!)/((n-2)!)', 'n(n-1)', 'n! = n(n−1)·(n−2)!'], ['(n+3)!/((n+1)!)', '(n+3)(n+2)', '(n+3)! = (n+3)(n+2)·(n+1)!']];
      const [ex, ans, why] = R.pick(F5);
      return E.num(`Simplify ${M(ex)}. (n is a whole number large enough for every factorial.)`, [{ expr: ans }], `${why}, leaving ${E.pt(ans)}.`); } },
    e: { t: 'solve a factorial equation', g: R => { const k = R.int(0, 3);
      const forms = [[n => n * (n - 1), 'n!/((n-2)!)', 'n(n − 1)', 4, 15], [n => (n + 1) * n, '(n+1)!/((n-1)!)', '(n + 1)n', 3, 14], [n => n * (n - 1) * (n - 2), 'n!/((n-3)!)', 'n(n − 1)(n − 2)', 4, 11], [n => (n + 2) * (n + 1), '(n+2)!/(n!)', '(n + 2)(n + 1)', 2, 13]];
      const [f, ex, pr, lo, hi] = forms[k], n = R.int(lo, hi), V0 = f(n);
      return E.num(`Solve for the whole number n: ${M(ex + '=' + V0)}.`, [{ label: 'n =', ans: n }], `The factorials cancel to ${pr} = ${V0}, a product of consecutive whole numbers. Try values near the ${k === 2 ? 'cube' : 'square'} root: n = ${n} works, and the product only grows with n.`); } },
    f: { t: 'factorial insight', g: R => { const k = R.int(0, 2);
      if (k === 0) { const n = R.int(20, 320); const t = [5, 25, 125].map(p => Math.floor(n / p)), z = t.reduce((a, b) => a + b, 0);
        return E.num(`How many zeros are at the end of ${M(n + '!')}?`, [{ ans: z }], `Each end zero needs a factor 10 = 2 × 5, and 2s are plentiful, so count the 5s: ⌊${n}/5⌋ + ⌊${n}/25⌋${t[2] ? ` + ⌊${n}/125⌋` : ''} = ${t.filter((x, i) => i < 2 || x).join(' + ')} = ${z}.`); }
      if (k === 1) { const p = R.pick([2, 3]), n = R.int(10, 40); const t = [p, p * p, p ** 3, p ** 4, p ** 5].map(q => Math.floor(n / q)).filter(x => x), z = t.reduce((a, b) => a + b, 0);
        return E.num(`What is the largest whole number k such that ${M(p + '^k')} divides ${M(n + '!')}?`, [{ label: 'k =', ans: z }], `Count factors of ${p} in 1 × 2 × … × ${n}: multiples of ${p}, then extra ones from ${p}², ${p}³, …: ${t.join(' + ')} = ${z}.`); }
      const n = R.int(4, 8);
      return E.num(`Find the exact value of 1·1! + 2·2! + 3·3! + … + ${n}·${n}!.`, [{ ans: fact(n + 1) - 1 }], `Since k·k! = (k + 1)! − k!, the sum telescopes to ${n + 1}! − 1! = ${fm(fact(n + 1))} − 1 = ${fm(fact(n + 1) - 1)}.`); } },
  });

  /* IV.14.02 Permutations */
  S('IV.14.02', 'Permutations', {
    a: { t: 'arrange r of n', g: R => { const k = R.int(0, 4), n = R.int(5, 12);
      const [txt, r] = [[`${n} runners are in a race. In how many ways can gold, silver and bronze be awarded (no ties)?`, 3], [`A club of ${n} members elects a president and a vice-president (different people). How many outcomes are possible?`, 2],
        [`A club of ${n} members elects a president, a vice-president and a treasurer (all different). How many outcomes are possible?`, 3], [`In how many ways can 4 of ${n} different books be placed in a row on a shelf?`, 4],
        [`A DJ picks and orders 3 of ${n} different songs for an opening set. How many sets are possible?`, 3]][k];
      return E.num(txt, [{ ans: nP(n, r) }], `${n} choices for the first place, ${n - 1} for the second${r > 2 ? ', and so on' : ''}: ${prodTxt(n, r)} = ${fm(nP(n, r))}.`); } },
    b: { t: 'the ⁿPᵣ formula', g: R => { const n = R.int(4, 11), r = R.int(1, Math.min(n, 6));
      return E.num(`Evaluate ${PN(n, r)}.`, [{ ans: nP(n, r) }], `${PN(n, r)} = ${M(`(${n}!)/(${n - r}!)`)} = ${prodTxt(n, r)} = ${fm(nP(n, r))}.`); } },
    c: { t: 'with repeated letters', g: R => { const w = R.pick(REP), v = arr(w), ks = Object.values(counts(w)).filter(k => k > 1);
      return E.num(`How many different arrangements of the letters of ${w} are there?`, [{ ans: v }], `${w.length} letters with ${repTxt(w)}: ${M(`(${w.length}!)/(${ks.map(k => k + '!').join('')})`)} = ${fm(v)}. Swapping identical letters makes no new word, so don't use ${w.length}! = ${fm(fact(w.length))}.`); } },
    d: { t: 'circular arrangements', g: R => { const k = R.int(0, 3);
      if (k === 3) { const n = R.int(4, 9);
        return E.num(`${n} different beads are threaded onto a bracelet. Turning the bracelet around or flipping it over gives the same bracelet. How many different bracelets are possible?`, [{ ans: fact(n - 1) / 2 }], `Around a circle there are (${n} − 1)! = ${fm(fact(n - 1))} arrangements; flipping pairs them up, so ${fm(fact(n - 1))} ÷ 2 = ${fm(fact(n - 1) / 2)}.`); }
      const n = R.int(4, 10);
      const txt = [`${n} people sit around a round table. Seatings that differ only by a rotation count as the same. How many seatings are possible?`, `${n} children stand in a circle for a game. Only who stands next to whom matters (rotations are the same). How many circles are possible?`, `${n} different keys are placed on a circular key ring, which can turn but not flip over. How many arrangements are possible?`][k];
      return E.num(txt, [{ ans: fact(n - 1) }], `Fix one ${k === 2 ? 'key' : 'person'} to remove the rotations, then arrange the other ${n - 1}: (${n} − 1)! = ${fm(fact(n - 1))}, not ${n}! = ${fm(fact(n))}.`); } },
    e: { t: 'add a restriction, or run it backwards', g: R => { const k = R.int(0, 2);
      if (k === 0) { const m = R.int(4, 9), r = R.int(3, 4);
        return E.num(`Using the digits 0, 1, …, ${m}, each at most once, how many ${r}-digit numbers can be made? (A number can't start with 0.)`, [{ ans: m * nP(m, r - 1) }], `The first digit has ${m} choices (not 0). Then 0 is back in play: ${prodTxt(m, r - 1)} for the rest. Total ${m} × ${nP(m, r - 1)} = ${fm(m * nP(m, r - 1))}.`); }
      if (k === 1) { const r = R.pick([2, 2, 3]), n = r === 2 ? R.int(5, 20) : R.int(4, 12);
        return E.num(`If ${PN('n', r)} = ${nP(n, r)}, what is n?`, [{ label: 'n =', ans: n }], `${PN('n', r)} = ${r === 2 ? 'n(n − 1)' : 'n(n − 1)(n − 2)'} = ${nP(n, r)}, a product of ${r} consecutive whole numbers: ${prodTxt(n, r)}. So n = ${n}.`); }
      const n = R.int(5, 9), [a, b] = two(R);
      return E.num(`${n} people, including ${a} and ${b}, sit around a round table (rotations count as the same). In how many seatings do ${a} and ${b} sit next to each other?`, [{ ans: 2 * fact(n - 2) }], `Glue ${a} and ${b} into one block: ${n - 1} units around a circle give (${n - 2})! = ${fm(fact(n - 2))}, and the pair can swap: 2 × ${fm(fact(n - 2))} = ${fm(2 * fact(n - 2))}.`); } },
    f: { t: 'no two alike side by side', g: R => { let w, ch, v;
      do { w = R.pick(REP); const m = counts(w); ch = R.pick(Object.keys(m).filter(c => m[c] > 1)); const kk = m[ch], rest = w.split('').filter(c => c !== ch).join(''); v = arr(rest) * nC(rest.length + 1, kk); } while (!v);
      const kk = counts(w)[ch], rest = w.split('').filter(c => c !== ch).join(''), A = arr(rest);
      return E.num(`How many arrangements of the letters of ${w} have no two ${ch}'s next to each other?`, [{ ans: v }], `Arrange the other ${rest.length} letters first: ${fm(A)} ways. They leave ${rest.length + 1} gaps (ends included); put the ${kk} ${ch}'s in different gaps: ${BN(rest.length + 1, kk)} = ${nC(rest.length + 1, kk)}. Total ${fm(A)} × ${nC(rest.length + 1, kk)} = ${fm(v)}.`); } },
  });

  /* IV.14.03 Combinations */
  S('IV.14.03', 'Combinations', {
    a: { t: 'choose r of n', g: R => { const k = R.int(0, 4), n = R.int(5, 15), r = R.int(2, 4);
      const txt = [`A pizza place offers ${n} toppings. How many different pizzas with ${r} different toppings are possible?`, `A coach picks ${r} of ${n} players for a relay squad (no positions). How many squads are possible?`,
        `You can pack ${r} of your ${n} books for a trip. How many different selections are there?`, `You may invite ${r} of your ${n} friends to a movie. How many different groups can you invite?`, `A ${r}-person committee is chosen from ${n} volunteers. How many committees are possible?`][k];
      return E.num(txt, [{ ans: nC(n, r) }], `Order doesn't matter, so divide the ordered count by ${r}!: ${BN(n, r)} = ${nP(n, r)} ÷ ${fact(r)} = ${nC(n, r)}.`); } },
    b: { t: 'the ⁿCᵣ formula', g: R => { const n = R.int(4, 12), r = R.int(0, n);
      return E.num(`Evaluate ${BN(n, r)}.`, [{ ans: nC(n, r) }], r === 0 || r === n ? `There is exactly one way to choose ${r === 0 ? 'nothing' : 'everything'}: ${M(`(${n}!)/(${r}!${n - r}!)`)} = 1.` : `${BN(n, r)} = ${M(`(${n}!)/(${r}!${n - r}!)`)}${Math.min(r, n - r) > 1 ? ` = ${nP(n, Math.min(r, n - r))} ÷ ${fact(Math.min(r, n - r))}` : ''} = ${nC(n, r)}.`); } },
    c: { t: 'does order matter?', g: R => { const ord = R.bool(), n = R.int(6, 12), r = R.int(2, 4);
      const OM = [`${n} students enter a contest. In how many ways can 1st, 2nd${r > 2 ? ', 3rd' : ''}${r > 3 ? ' and 4th' : ''} prizes be given?`, `From ${n} club members, how many ways are there to fill ${r} different jobs (one person each)?`,
        `How many ways can ${r} of ${n} different trophies be lined up on a shelf?`, `How many ${r}-digit codes use different digits chosen from ${n} buttons?`, `In how many ways can ${r} of ${n} people stand in a line?`];
      const ON = [`How many ways can ${r} of ${n} students be chosen for a trip?`, `How many ${r}-card hands can be dealt from ${n} different cards?`, `How many ways can you choose ${r} of ${n} questions to answer on a test?`,
        `How many ways can ${r} of ${n} flavors be picked for a mixed tub?`, `How many ${r}-person teams can be formed from ${n} people?`];
      const txt = R.pick(ord ? OM : ON);
      return E.choiceFixed(`${txt} Which count is right?`, [`order matters: ${PN(n, r)} = ${nP(n, r)}`, `order doesn't matter: ${BN(n, r)} = ${nC(n, r)}`], ord ? 0 : 1,
        ord ? `Swapping two people or items gives a different outcome here, so order matters: ${fm(nP(n, r))}.` : `Swapping the chosen ones gives the same selection, so order doesn't matter: ${nC(n, r)}.`); } },
    d: { t: "link to Pascal's triangle", g: R => { const k = R.int(0, 2);
      if (k === 0) { const n = R.int(4, 9), j = R.int(1, n); const row = Array.from({ length: n + 1 }, (_, i) => nC(n, i));
        return E.num(`Row ${n} of Pascal's triangle is ${row.join(', ')}. Counting from 0, what is entry ${j} of row ${n + 1}?`, [{ ans: nC(n + 1, j) }], `Each entry is the sum of the two above it: ${row[j - 1]} + ${row[j]} = ${nC(n + 1, j)}, which is ${BN(n + 1, j)}.`); }
      if (k === 1) { const n = R.int(5, 12), r = R.int(1, n - 2);
        return E.num(`Find the value of ${BN(n, r)} + ${BN(n, r + 1)}.`, [{ ans: nC(n + 1, r + 1) }], `Pascal's rule: two neighbors in row ${n} add to the entry below, ${BN(n + 1, r + 1)} = ${nC(n + 1, r + 1)} (check: ${nC(n, r)} + ${nC(n, r + 1)}).`); }
      const n = R.int(3, 12);
      return E.num(`What is the sum of all the entries in row ${n} of Pascal's triangle? (Row 0 is just 1.)`, [{ ans: 2 ** n }], `Row ${n} counts the subsets of ${n} objects by size, and there are ${M('2^' + n)} = ${fm(2 ** n)} subsets in all.`); } },
    e: { t: 'run it backwards', g: R => { const k = R.int(0, 2);
      if (k === 0) { const n = R.int(5, 25);
        return E.num(`If ${BN('n', 2)} = ${nC(n, 2)}, what is n?`, [{ label: 'n =', ans: n }], `${BN('n', 2)} = n(n − 1)/2 = ${nC(n, 2)}, so n(n − 1) = ${n * (n - 1)} = ${n} × ${n - 1}. n = ${n}.`); }
      if (k === 1) { const n = R.int(5, 22);
        return E.num(`At a party, everyone shook hands exactly once with everyone else. There were ${nC(n, 2)} handshakes. How many people were at the party?`, [{ ans: n }], `Each handshake is a pair: ${BN('n', 2)} = n(n − 1)/2 = ${nC(n, 2)}, so n(n − 1) = ${n * (n - 1)} and n = ${n}.`); }
      const r = R.int(2, 8), s = r + R.int(1, 6);
      return E.num(`If ${BN('n', r)} = ${BN('n', s)}, what is n?`, [{ label: 'n =', ans: r + s }], `By symmetry ${BN('n', 'r')} = ${BN('n', 'n-r')}. Since ${r} ≠ ${s}, we need ${s} = n − ${r}, so n = ${r + s}.`); } },
    f: { t: 'count it cleverly', g: R => { const k = R.int(0, 4);
      if (k === 0) { const n = R.int(6, 20);
        return E.num(`How many diagonals does a convex polygon with ${n} sides have?`, [{ ans: nC(n, 2) - n }], `Any 2 of the ${n} vertices make a segment: ${BN(n, 2)} = ${nC(n, 2)}. Remove the ${n} sides: ${nC(n, 2) - n}.`); }
      if (k === 1) { const a = R.int(2, 6), b = R.int(2, 6);
        return E.num(`On a grid you walk from (0, 0) to (${a}, ${b}) taking unit steps right or up only. How many different paths are there?`, [{ ans: nC(a + b, a) }], `Every path is ${a + b} steps with exactly ${a} of them "right": choose which, ${BN(a + b, a)} = ${nC(a + b, a)}.`); }
      if (k === 2) { const a = R.int(3, 6), b = R.int(3, 6), p = R.int(1, a - 1), q = R.int(1, b - 1), v = nC(p + q, p) * nC(a - p + b - q, a - p);
        return E.num(`Walking from (0, 0) to (${a}, ${b}) with unit steps right or up only, how many paths pass through (${p}, ${q})?`, [{ ans: v }], `Split at (${p}, ${q}): ${BN(p + q, p)} = ${nC(p + q, p)} ways there, then ${BN(a - p + b - q, a - p)} = ${nC(a - p + b - q, a - p)} ways on. Multiply: ${v}.`); }
      if (k === 3) { const n = R.int(5, 20), pos = R.bool();
        return pos ? E.num(`How many solutions does ${M(`x+y+z=${n}`)} have in positive whole numbers?`, [{ ans: nC(n - 1, 2) }], `Line up ${n} stars and place 2 bars in the ${n - 1} gaps between them: ${BN(n - 1, 2)} = ${nC(n - 1, 2)}.`)
          : E.num(`How many solutions does ${M(`x+y+z=${n}`)} have in whole numbers, with zero allowed?`, [{ ans: nC(n + 2, 2) }], `Arrange ${n} stars and 2 bars in a row of ${n + 2} spots: ${BN(n + 2, 2)} = ${nC(n + 2, 2)}.`); }
      const n = R.int(5, 12);
      return E.num(`All diagonals of a convex ${n}-sided polygon are drawn, and no three meet at one point inside. How many crossing points are inside the polygon?`, [{ ans: nC(n, 4) }], `Each crossing comes from exactly one set of 4 vertices (its two diagonals), so count the sets: ${BN(n, 4)} = ${nC(n, 4)}.`); } },
  });

  /* IV.14.04 Counting with conditions */
  S('IV.14.04', 'Counting with conditions', {
    a: { t: 'must include or exclude', g: R => { const n = R.int(7, 14), r = R.int(3, 5), [a, b] = two(R), k = R.int(0, 2);
      if (k === 0) return E.num(`A team of ${r} is chosen from ${n} people, one of them ${a}. How many teams include ${a}?`, [{ ans: nC(n - 1, r - 1) }], `Put ${a} in, then choose the other ${r - 1} from the remaining ${n - 1}: ${BN(n - 1, r - 1)} = ${nC(n - 1, r - 1)}.`);
      if (k === 1) return E.num(`A team of ${r} is chosen from ${n} people, one of them ${a}. How many teams leave ${a} out?`, [{ ans: nC(n - 1, r) }], `Choose all ${r} from the other ${n - 1} people: ${BN(n - 1, r)} = ${nC(n - 1, r)}.`);
      return E.num(`A team of ${r} is chosen from ${n} people, including ${a} and ${b}. How many teams include both ${a} and ${b}?`, [{ ans: nC(n - 2, r - 2) }], `Both are in, so choose the other ${r - 2} from the remaining ${n - 2}: ${BN(n - 2, r - 2)} = ${nC(n - 2, r - 2)}.`); } },
    b: { t: '"at least" by the complement', g: R => { const k = R.int(0, 2);
      if (k < 2) { const r = R.int(3, 4), bo = R.int(r, 8), gi = R.int(r, 8), [X, Y] = k ? ['girl', 'boy'] : ['boy', 'girl'], nx = k ? gi : bo, ny = k ? bo : gi, tot = nC(bo + gi, r), none = nC(ny, r);
        return E.num(`A committee of ${r} is chosen from ${bo} boys and ${gi} girls. How many committees have at least one ${X}?`, [{ ans: tot - none }], `Total minus committees with no ${X}: ${BN(bo + gi, r)} − ${BN(ny, r)} = ${tot} − ${none} = ${tot - none}. Fixing one ${X} and choosing the rest freely counts some committees twice.`); }
      const n = R.int(2, 4), d = R.int(0, 9);
      return E.num(`How many ${n}-digit codes (digits 0–9, repeats allowed, leading 0 fine) contain at least one ${d}?`, [{ ans: 10 ** n - 9 ** n }], `All codes minus codes with no ${d}: ${M(`10^${n}-9^${n}`)} = ${fm(10 ** n)} − ${fm(9 ** n)} = ${fm(10 ** n - 9 ** n)}.`); } },
    c: { t: 'objects kept together', g: R => { const k = R.int(0, 2), n = R.int(5, 8), [a, b] = two(R);
      if (k === 0) return E.num(`${n} people, including ${a} and ${b}, stand in a line. In how many orders are ${a} and ${b} next to each other?`, [{ ans: 2 * fact(n - 1) }], `Glue ${a} and ${b} into one block: ${n - 1} units give ${n - 1}! = ${fm(fact(n - 1))}; the pair can swap, so × 2 = ${fm(2 * fact(n - 1))}.`);
      if (k === 1) { const m = R.int(2, 3);
        return E.num(`${n} different books, ${m} of them math books, go on a shelf. In how many ways can they be arranged with the math books all together?`, [{ ans: fact(m) * fact(n - m + 1) }], `Treat the math books as one block: ${n - m + 1} units give ${n - m + 1}! = ${fm(fact(n - m + 1))}; inside the block ${m}! = ${fact(m)}. Total ${fm(fact(m) * fact(n - m + 1))}.`); }
      return E.num(`${n} people, including ${a} and ${b}, stand in a line. In how many orders are ${a} and ${b} NOT next to each other?`, [{ ans: fact(n) - 2 * fact(n - 1) }], `All orders minus the "together" ones: ${n}! − 2 × ${n - 1}! = ${fm(fact(n))} − ${fm(2 * fact(n - 1))} = ${fm(fact(n) - 2 * fact(n - 1))}.`); } },
    d: { t: 'committees with rules', g: R => { const k = R.int(0, 2);
      if (k === 0) { const w = R.int(4, 8), m = R.int(4, 8), r = R.int(3, 5), j = R.int(1, r - 1);
        return E.num(`A committee of ${r} is chosen from ${w} women and ${m} men. How many committees have exactly ${j} ${j === 1 ? 'woman' : 'women'}?`, [{ ans: nC(w, j) * nC(m, r - j) }], `Choose the women and the men separately, then multiply: ${BN(w, j)} × ${BN(m, r - j)} = ${nC(w, j)} × ${nC(m, r - j)} = ${nC(w, j) * nC(m, r - j)}.`); }
      if (k === 1) { const w = R.int(3, 7), m = R.int(3, 7), r = R.int(3, 4); const terms = []; for (let j = 2; j <= Math.min(r, w); j++) terms.push([j, nC(w, j) * nC(m, r - j)]); const v = terms.reduce((s, t) => s + t[1], 0);
        return E.num(`A committee of ${r} is chosen from ${w} women and ${m} men. How many committees have at least 2 women?`, [{ ans: v }], `Add the cases: ${terms.map(([j]) => `${j} women: ${nC(w, j)} × ${nC(m, r - j)}`).join('; ')}. Total ${terms.map(t => t[1]).join(' + ')} = ${v}.`); }
      const n = R.int(7, 13), r = R.int(3, 5), [a, b] = two(R);
      return E.num(`A committee of ${r} is chosen from ${n} people. ${a} must be on it, but ${b} must not. How many committees are possible?`, [{ ans: nC(n - 2, r - 1) }], `${a} is in and ${b} is out, so choose ${r - 1} more from the other ${n - 2}: ${BN(n - 2, r - 1)} = ${nC(n - 2, r - 1)}.`); } },
  });

  /* IV.14.05 Probability by counting */
  const FF = (n, d) => { const s = fs(n, d); return M(`${n}/${d}`) + (s !== `${n}/${d}` ? ' = ' + (s.includes('/') ? M(s) : s) : ''); };   // n/d = reduced
  const CARDS = [['a king', 4], ['a heart', 13], ['a face card (jack, queen or king)', 12], ['a red card', 26], ['a red ace', 2], ['a black face card', 6], ['a number card from 2 to 10', 36], ['an ace or a king', 8],
    ['the queen of spades', 1], ['a red number card from 2 to 10', 18], ['a diamond or a club', 26], ['an even number card (2, 4, 6, 8 or 10)', 20], ['a spade that is not a face card', 10]];
  const PRIMES = [2, 3, 5, 7, 11, 13];
  S('IV.14.05', 'Probability by counting', {
    a: { t: 'equally likely outcomes', g: R => { const k = R.int(0, 2);
      if (k === 0) { const cols = ['red', 'blue', 'green'], n = [R.int(1, 9), R.int(1, 9), R.int(1, 9)], j = R.int(0, 2), N = n[0] + n[1] + n[2];
        return E.num(`A bag holds ${n[0]} red, ${n[1]} blue and ${n[2]} green marbles. One is picked at random. What is the probability it is ${cols[j]}?`, [fr(n[j], N)], `${n[j]} of the ${N} equally likely marbles are ${cols[j]}: ${FF(n[j], N)}.`); }
      if (k === 1) { const N = R.int(10, 50), d = R.int(2, 9), c = Math.floor(N / d);
        return E.num(`A whole number from 1 to ${N} is chosen at random. What is the probability it is a multiple of ${d}?`, [fr(c, N)], `The multiples are ${d}, ${2 * d}, …, ${c * d}: ${c} of the ${N} numbers, so ${FF(c, N)}.`); }
      const n = R.int(5, 13), pr = PRIMES.filter(p => p <= n);
      return E.num(`A spinner has ${n} equal sections numbered 1 to ${n}. What is the probability it lands on a prime number?`, [fr(pr.length, n)], `The primes up to ${n} are ${pr.join(', ')}: ${pr.length} of ${n} sections, so ${FF(pr.length, n)}. (1 is not prime.)`); } },
    b: { t: 'cards and dice', g: R => { const k = R.int(0, 2);
      if (k === 0) { const s = R.int(2, 12), c = 6 - Math.abs(s - 7);
        return E.num(`Two fair dice are rolled. What is the probability that the sum is ${s}?`, [fr(c, 36)], `There are 36 equally likely (first, second) pairs, and ${c} of them sum to ${s}: ${FF(c, 36)}. The 11 possible sums are not equally likely.`); }
      if (k === 1) { const j = R.int(0, 2);
        if (j === 0) { const s = R.int(8, 12); let c = 0; for (let t = s; t <= 12; t++) c += 6 - Math.abs(t - 7);
          return E.num(`Two fair dice are rolled. What is the probability that the sum is at least ${s}?`, [fr(c, 36)], `Count the pairs with sum ${s} to 12: ${c} of the 36 equally likely pairs, so ${FF(c, 36)}.`); }
        if (j === 1) { const s = R.int(3, 6); let c = 0; for (let t = 2; t <= s; t++) c += 6 - Math.abs(t - 7);
          return E.num(`Two fair dice are rolled. What is the probability that the sum is at most ${s}?`, [fr(c, 36)], `Count the pairs with sum 2 to ${s}: ${c} of the 36 equally likely pairs, so ${FF(c, 36)}.`); }
        const v = R.int(1, 5);
        return E.num(`Two fair dice are rolled. What is the probability that both show a number greater than ${v}?`, [fr((6 - v) ** 2, 36)], `Each die has ${6 - v} good faces, so ${6 - v} × ${6 - v} = ${(6 - v) ** 2} of the 36 pairs: ${FF((6 - v) ** 2, 36)}.`); }
      const [ev, c] = R.pick(CARDS);
      return E.num(`One card is drawn at random from a standard 52-card deck. What is the probability it is ${ev}?`, [fr(c, 52)], `${c} of the 52 cards qualify: ${FF(c, 52)}.`); } },
    c: { t: 'using combinations', g: R => { const k = R.int(0, 3), r = R.int(3, 7), b = R.int(2, 7), N = r + b;
      if (k === 0) return E.num(`A bag has ${r} red and ${b} blue marbles. Two are drawn at the same time. What is the probability both are red?`, [fr(nC(r, 2), nC(N, 2))], `Pairs of reds over all pairs: ${BN(r, 2)} ÷ ${BN(N, 2)} = ${FF(nC(r, 2), nC(N, 2))}.`);
      if (k === 1) return E.num(`A bag has ${r} red and ${b} blue marbles. Two are drawn at the same time. What is the probability they are different colors?`, [fr(r * b, nC(N, 2))], `One red and one blue: ${r} × ${b} = ${r * b} pairs, out of ${BN(N, 2)} = ${nC(N, 2)}: ${FF(r * b, nC(N, 2))}.`);
      if (k === 2) return E.num(`A bag has ${r} red and ${b} blue marbles. Three are drawn at the same time. What is the probability all three are red?`, [fr(nC(r, 3), nC(N, 3))], `${BN(r, 3)} ÷ ${BN(N, 3)} = ${FF(nC(r, 3), nC(N, 3))}.`);
      const g = R.int(2, 6);
      return E.num(`3 students are chosen at random from ${b + 2} boys and ${g} girls. What is the probability exactly one girl is chosen?`, [fr(g * nC(b + 2, 2), nC(b + 2 + g, 3))], `Choose 1 girl and 2 boys: ${g} × ${BN(b + 2, 2)} = ${g * nC(b + 2, 2)}, out of ${BN(b + 2 + g, 3)} = ${nC(b + 2 + g, 3)}: ${FF(g * nC(b + 2, 2), nC(b + 2 + g, 3))}.`); } },
    d: { t: 'lottery odds', g: R => { const N = R.int(20, 49), k = R.int(3, 6), j = R.int(0, 2), T = nC(N, k);
      const head = `A lottery draws ${k} different numbers from 1 to ${N}. You pick ${k} different numbers.`;
      if (j === 0) return E.num(`${head} What is the probability you match all ${k}?`, [fr(1, T)], `Only 1 of the ${BN(N, k)} = ${fm(T)} equally likely draws matches your ticket: ${M('1/' + T)}.`);
      if (j === 1) return E.num(`${head} What is the probability you match exactly ${k - 1} of them?`, [fr(k * (N - k), T)], `Choose which ${k - 1} of your numbers are drawn, ${BN(k, k - 1)} = ${k}, and 1 of the ${N - k} others: ${k} × ${N - k} = ${k * (N - k)} draws out of ${fm(T)}: ${FF(k * (N - k), T)}.`);
      return E.num(`${head} What is the probability you match none of them?`, [fr(nC(N - k, k), T)], `All ${k} drawn numbers must come from the ${N - k} you didn't pick: ${BN(N - k, k)} ÷ ${BN(N, k)} = ${fm(nC(N - k, k))}/${fm(T)} = ${E.pt(fs(nC(N - k, k), T))}.`); } },
    e: { t: 'work backwards', g: R => { const k = R.int(0, 1);
      if (k === 0) { const r = R.int(2, 8), x = R.int(1, 20);
        return E.num(`A bag has ${r} red marbles and some blue ones. The probability of picking red is ${FM(r, r + x)}. How many blue marbles are there?`, [{ ans: x }], `${FM(r, r + x)} = ${M(`${r}/(${r}+b)`)}, so ${r} + b = ${r + x} and b = ${x}.`); }
      const N = R.int(6, 15), r = R.int(2, N - 1), p = fs(r * (r - 1), N * (N - 1));
      return E.num(`A bag has ${N} marbles, some of them red. Two are drawn without replacement. The probability both are red is ${F(r * (r - 1), N * (N - 1))}. How many red marbles are there?`, [{ ans: r }], `${M(`(r(r-1))/(${N}*${N - 1})`)} = ${E.pt(p)}, so r(r − 1) = ${r * (r - 1)} = ${r} × ${r - 1}, and r = ${r}.`); } },
    f: { t: 'count with insight', g: R => { const k = R.int(0, 2);
      if (k === 0) { const n = R.int(6, 20), e = Math.floor(n / 2), o = n - e, g = nC(e, 2) + nC(o, 2);
        return E.num(`Two different numbers are chosen at random from 1 to ${n}. What is the probability their sum is even?`, [fr(g, nC(n, 2))], `An even sum needs two evens or two odds. There are ${e} evens and ${o} odds: ${BN(e, 2)} + ${BN(o, 2)} = ${g} good pairs out of ${BN(n, 2)} = ${nC(n, 2)}: ${FF(g, nC(n, 2))}.`); }
      if (k === 1) { const m = R.int(3, 8), n = 2 * m;
        return E.num(`Three different vertices of a regular ${n}-sided polygon are chosen at random. What is the probability they form a right triangle?`, [fr(m * (n - 2), nC(n, 3))], `The polygon sits in a circle, so the triangle is right exactly when one side is a diameter. There are ${m} diameters and ${n - 2} choices of third vertex: ${m * (n - 2)} of ${BN(n, 3)} = ${nC(n, 3)}, so ${FF(m * (n - 2), nC(n, 3))}.`); }
      const s0 = R.int(3, 8), hi = R.bool(), s = hi ? 21 - s0 : s0, c = nC(s0 - 1, 2);
      return E.num(`Three fair dice are rolled. What is the probability that the sum is ${s}?`, [fr(c, 216)], `${hi ? `Turning every die upside down (x → 7 − x) swaps sum ${s} with sum ${s0}. ` : ''}Sum ${s0} means a + b + c = ${s0} with each at least 1; no die can exceed 6, so it's stars and bars: ${BN(s0 - 1, 2)} = ${c} of 216 outcomes, ${FF(c, 216)}.`); } },
  });

  /* IV.14.06 Addition rule */
  const venn = (a, both, b, none, la, lb) => V.geo({ pts: { P: [-1.1, 0], Q: [1.1, 0], c1: [-3.4, -2.4], c2: [3.4, -2.4], c3: [3.4, 2.4], c4: [-3.4, 2.4] }, labels: false, w: 300,
    segs: [['c1', 'c2', { width: 1.4 }], ['c2', 'c3', { width: 1.4 }], ['c3', 'c4', { width: 1.4 }], ['c4', 'c1', { width: 1.4 }]], circles: [{ c: 'P', r: 1.9, color: C.blue }, { c: 'Q', r: 1.9, color: C.red }],
    text: [[-1.9, 0, String(a)], [0, 0, String(both)], [1.9, 0, String(b)], [2.8, -2.0, String(none)], [-2.6, 2.0, la], [2.6, 2.0, lb]], label: 'Venn diagram' });
  const SPIN = [['a number less than ', x => a => a < x], ['a number greater than ', x => a => a > x], ['an even number', () => a => a % 2 === 0], ['a multiple of 3', () => a => a % 3 === 0], ['a prime number', () => a => PRIMES.includes(a)], ['', x => a => a === x]];
  S('IV.14.06', 'Addition rule', {
    a: { t: '"or" events', g: R => { const n = R.int(6, 12); let A, B, ia, ib;
      const mk = i => { const t = SPIN[i], x = i === 0 ? R.int(3, 5) : i === 1 ? R.int(n - 3, n - 1) : i === 5 ? R.int(1, n) : null; return { d: (i === 5 ? ([8, 11].includes(x) ? 'an ' : 'a ') : t[0]) + (x === null ? '' : x), f: t[1](x) }; };
      let xs; do { [ia, ib] = R.sample([0, 1, 2, 3, 4, 5], 2); A = mk(ia); B = mk(ib); xs = []; for (let x = 1; x <= n; x++) if (A.f(x) || B.f(x)) xs.push(x); } while (A.d === B.d || xs.length < 2 || xs.length >= n);
      return E.num(`A spinner has ${n} equal sections numbered 1 to ${n}. What is the probability of spinning ${A.d} or ${B.d}?`, [fr(xs.length, n)], `List every number that fits either one, counting each only once: ${xs.join(', ')}. That is ${xs.length} of ${n}: ${FF(xs.length, n)}.`); } },
    b: { t: 'mutually exclusive events', g: R => { const k = R.int(0, 2), ctx = R.pick([['Maya walks to school today', 'Maya takes the bus today'], ['the team wins the match', 'the team draws the match'], ['Sam gets an A', 'Sam gets a B'], ['the spinner lands on red', 'the spinner lands on blue'], ['the train is early', 'the train is late']]);
      let p, q; do { p = R.int(5, 60); q = R.int(5, 60); } while (p + q > 95 || p % 5 && R.bool(0.5));
      if (k === 0) return E.num(`P(${ctx[0]}) = ${dc(p / 100)} and P(${ctx[1]}) = ${dc(q / 100)}, and these can't both happen. What is the probability that one or the other happens?`, [{ ans: cl((p + q) / 100) }], `Mutually exclusive events have no overlap, so just add: ${dc(p / 100)} + ${dc(q / 100)} = ${dc((p + q) / 100)}.`);
      if (k === 1) return E.num(`Events A and B are mutually exclusive, with P(A) = ${dc(p / 100)} and P(A or B) = ${dc((p + q) / 100)}. Find P(B).`, [{ ans: cl(q / 100) }], `With no overlap, P(A or B) = P(A) + P(B), so P(B) = ${dc((p + q) / 100)} − ${dc(p / 100)} = ${dc(q / 100)}.`);
      return E.num(`A spinner lands on red, blue or green. P(red) = ${dc(p / 100)} and P(blue) = ${dc(q / 100)}. What is P(red or green)?`, [{ ans: cl((100 - q) / 100) }], `P(green) = 1 − ${dc(p / 100)} − ${dc(q / 100)} = ${dc((100 - p - q) / 100)}. Red and green can't both happen, so P(red or green) = ${dc(p / 100)} + ${dc((100 - p - q) / 100)} = ${dc((100 - q) / 100)}.`); } },
    c: { t: 'subtract the overlap', g: R => { const k = R.int(0, 2);
      if (k === 0) { const [A, B, a, b, ab] = R.pick([['a heart', 'a king', 13, 4, 1], ['a red card', 'a face card', 26, 12, 6], ['a spade', 'an ace', 13, 4, 1], ['a club', 'a face card', 13, 12, 3], ['a red card', 'an ace', 26, 4, 2], ['a black card', 'a queen', 26, 4, 2], ['a diamond', 'a number card from 2 to 10', 13, 36, 9], ['a face card', 'a heart', 12, 13, 3]]);
        return E.num(`One card is drawn from a standard 52-card deck. What is the probability it is ${A} or ${B}?`, [fr(a + b - ab, 52)], `${M(`${a}/52+${b}/52-${ab}/52`)} = ${FF(a + b - ab, 52)}. The ${ab} card${ab > 1 ? 's' : ''} that ${ab > 1 ? 'are' : 'is'} both would otherwise be counted twice.`); }
      if (k === 1) { const N = R.int(20, 60); let a, b; do { [a, b] = R.sample([2, 3, 4, 5, 6, 7], 2).sort((x, y) => x - y); } while (b % a === 0); const L = a * b / gg(a, b), na = Math.floor(N / a), nb = Math.floor(N / b), nab = Math.floor(N / L);
        return E.num(`A whole number from 1 to ${N} is chosen at random. What is the probability it is a multiple of ${a} or a multiple of ${b}?`, [fr(na + nb - nab, N)], `${na} multiples of ${a}, ${nb} of ${b}, and ${nab} of both (multiples of ${L}): ${na} + ${nb} − ${nab} = ${na + nb - nab}, so ${FF(na + nb - nab, N)}.`); }
      let p, q, r; do { p = R.int(2, 8) * 10; q = R.int(2, 8) * 10; r = R.int(1, 6) * 5; } while (r >= Math.min(p, q) || p + q - r > 100);
      return E.num(`P(A) = ${dc(p / 100)}, P(B) = ${dc(q / 100)} and P(A and B) = ${dc(r / 100)}. Find P(A or B).`, [{ ans: cl((p + q - r) / 100) }], `P(A or B) = P(A) + P(B) − P(A and B) = ${dc(p / 100)} + ${dc(q / 100)} − ${dc(r / 100)} = ${dc((p + q - r) / 100)}.`); } },
    d: { t: 'Venn diagrams', g: R => { const a = R.int(2, 15), ab = R.int(1, 10), b = R.int(2, 15), no = R.int(1, 12), N = a + ab + b + no, k = R.int(0, 3), [la, lb] = R.pick([['Soccer', 'Chess'], ['Cats', 'Dogs'], ['Math', 'Art'], ['Tea', 'Coffee'], ['Band', 'Choir']]);
      const ask = [[`${la.toLowerCase()} or ${lb.toLowerCase()} (or both)`, a + ab + b, `${a} + ${ab} + ${b} = ${a + ab + b}`], [`neither`, no, `only the ${no} outside both circles`], [`${la.toLowerCase()} but not ${lb.toLowerCase()}`, a, `only the ${a} in the left part of the ${la} circle`], [`both`, ab, `only the ${ab} in the overlap`]][k];
      return E.num(`The Venn diagram shows the choices of ${N} people (${la} and ${lb}). One person is chosen at random. What is the probability they chose ${ask[0]}?`, [fr(ask[1], N)], `Count ${ask[2]}, out of ${a} + ${ab} + ${b} + ${no} = ${N}: ${FF(ask[1], N)}.`, { visual: venn(a, ab, b, no, la, lb) }); } },
  });

  /* IV.14.07 Complements & "at least one" */
  const ev7 = [['it rains tomorrow', 'it does not rain tomorrow'], ['the bus is late', 'the bus is not late'], ['a seed sprouts', 'the seed does not sprout'], ['a light bulb is faulty', 'the bulb is not faulty'], ['the team wins', 'the team does not win'], ['a flight is full', 'the flight is not full']];
  S('IV.14.07', 'Complements & "at least one"', {
    a: { t: 'P(not A)', g: R => { const k = R.int(0, 2);
      if (k === 0) { const [a, na] = R.pick(ev7), p = R.int(1, 19) * 5;
        return E.num(`The probability that ${a} is ${dc(p / 100)}. What is the probability that ${na}?`, [{ ans: cl(1 - p / 100) }], `The two outcomes cover everything, so P(not A) = 1 − ${dc(p / 100)} = ${dc(1 - p / 100)}.`); }
      if (k === 1) { const d = R.int(3, 12); const n = R.int(1, d - 1); const [a, na] = R.pick(ev7);
        return E.num(`The probability that ${a} is ${FM(n, d)}. What is the probability that ${na}?`, [fr(d - n, d)], `1 − ${FM(n, d)} = ${FM(d - n, d)}.`); }
      const [ev, c] = R.pick(CARDS);
      return E.num(`One card is drawn from a standard 52-card deck. What is the probability it is NOT ${ev}?`, [fr(52 - c, 52)], `P(${ev}) = ${M(c + '/52')}, so P(not) = 1 − ${M(c + '/52')} = ${FF(52 - c, 52)}.`); } },
    b: { t: 'at least one, by the complement', g: R => { const k = R.int(0, 2);
      if (k === 0) { const n = R.int(2, 7);
        return E.num(`${n} fair coins are tossed. What is the probability of at least one head?`, [fr(2 ** n - 1, 2 ** n)], `The only way to fail is all tails: ${M(`(1/2)^${n}`)} = ${M('1/' + 2 ** n)}. So 1 − ${M('1/' + 2 ** n)} = ${FM(2 ** n - 1, 2 ** n)}.`); }
      if (k === 1) { const n = R.int(2, 4), f = R.int(1, 6);
        return E.num(`A fair die is rolled ${n} times. What is the probability of at least one ${f}?`, [fr(6 ** n - 5 ** n, 6 ** n)], `P(no ${f} at all) = ${M(`(5/6)^${n}`)} = ${M(`${5 ** n}/${6 ** n}`)}, so 1 − that = ${FF(6 ** n - 5 ** n, 6 ** n)}. It is not ${n} × ${M('1/6')}.`); }
      const r = R.int(2, 6), b = R.int(3, 8), m = R.int(2, 3), N = r + b;
      return E.num(`A bag has ${r} red and ${b} blue marbles. ${m} are drawn at the same time. What is the probability that at least one is red?`, [fr(nC(N, m) - nC(b, m), nC(N, m))], `P(no red) = ${BN(b, m)} ÷ ${BN(N, m)} = ${M(`${nC(b, m)}/${nC(N, m)}`)}, so P(at least one red) = ${FF(nC(N, m) - nC(b, m), nC(N, m))}.`); } },
    c: { t: 'repeated trials', g: R => { const p = R.pick([0.5, 0.6, 0.7, 0.75, 0.8, 0.85, 0.9, 0.95]), n = R.int(2, 6), k = R.int(0, 2), q = cl(1 - p);
      const [lead, what, fail] = R.pick([[`A basketball player makes each free throw with probability ${p}, independently.`, `${n} free throws`, 'at least one miss'], [`Each seed in a packet sprouts with probability ${p}, independently.`, `${n} seeds`, 'at least one seed that fails to sprout'], [`Each part from a machine passes inspection with probability ${p}, independently.`, `${n} parts`, 'at least one part that fails']]);
      if (k === 0) return E.num(`${lead} Out of ${what}, what is the probability of ${fail}? Round to 3 decimal places.`, [{ ans: cl(1 - p ** n), dp: 3 }], `P(no failures) = ${M(`${p}^${n}`)} ≈ ${(p ** n).toFixed(4)}, so P(at least one failure) = 1 − that ≈ ${(1 - p ** n).toFixed(3)}. Multiplying ${n} × ${q} would be wrong.`);
      if (k === 1) return E.num(`${lead} Out of ${what}, what is the probability that at least one succeeds? Round to 3 decimal places.`, [{ ans: cl(1 - q ** n), dp: 3 }], `P(none succeed) = ${M(`${q}^${n}`)} ≈ ${(q ** n).toFixed(4)}, so P(at least one) ≈ ${(1 - q ** n).toFixed(3)}.`);
      return E.num(`${lead} Out of ${what}, what is the probability that every one succeeds? Round to 3 decimal places.`, [{ ans: cl(p ** n), dp: 3 }], `Multiply the independent chances: ${M(`${p}^${n}`)} ≈ ${(p ** n).toFixed(3)}. Its complement, ${(1 - p ** n).toFixed(3)}, is P(at least one failure).`); } },
    d: { t: 'the birthday problem', g: R => { const k = R.int(0, 3);
      if (k === 3) { const n = R.pick([5, 10, 15, 20, 23, 25, 30, 35, 40, 50]); let q = 1; for (let i = 0; i < n; i++) q *= (365 - i) / 365;
        return E.num(`${n} people are in a room. Ignoring leap years and assuming all 365 birthdays are equally likely, what is the probability that at least two share a birthday? Round to 3 decimal places.`, [{ ans: +(1 - q).toFixed(6), dp: 3 }], `P(all different) = (365/365) × (364/365) × … × (${366 - n}/365) ≈ ${q.toFixed(4)}, so P(a shared birthday) ≈ ${(1 - q).toFixed(3)}.`); }
      const [d, lo, hi, txt, what] = [[7, 2, 5, n => `${n} people are each born on a random day of the week (all 7 equally likely). What is the probability that at least two were born on the same day of the week?`, 'days'],
        [12, 2, 5, n => `${n} people each have a birthday month chosen at random (all 12 equally likely). What is the probability that at least two share a month?`, 'months'],
        [6, 2, 6, n => `${n} people each roll a fair die. What is the probability that at least two of them roll the same number?`, 'numbers']][k], n = R.int(lo, hi);
      const all = nP(d, n), T = d ** n;
      return E.num(txt(n), [fr(T - all, T)], `P(all ${what} different) = ${prodTxt(d, n)} ÷ ${M(`${d}^${n}`)} = ${M(`${all}/${T}`)}. So P(at least two match) = 1 − that = ${FF(T - all, T)}.`); } },
    e: { t: 'run it backwards', g: R => { const k = R.int(0, 2);
      if (k === 0) { const q = R.int(1, 9), n = R.int(2, 3), P = cl(1 - (q / 10) ** n), ctx = R.pick(['A player takes shots that each score', 'Each seed sprouts', 'Each ticket wins a prize']);
        return E.num(`${ctx} with the same probability p, independently. With ${n} tries, P(at least one success) = ${P}. Find p.`, [{ label: 'p =', ans: cl(1 - q / 10) }], `P(no success) = ${M(`(1-p)^${n}`)} = 1 − ${P} = ${cl((q / 10) ** n)} = ${M(`${q / 10}^${n}`)}, so 1 − p = ${q / 10} and p = ${cl(1 - q / 10)}.`); }
      if (k === 1) { const [t, n] = R.pick([['0.75', 2], ['0.8', 3], ['0.9', 4], ['0.95', 5], ['0.97', 6], ['0.99', 7], ['0.995', 8], ['0.999', 10]]), m = cl(1 - +t);
        return E.num(`What is the smallest number of fair coin tosses so that the probability of at least one head is at least ${t}?`, [{ ans: n }], `Need P(all tails) = ${M('(1/2)^n')} ≤ 1 − ${t} = ${m}. ${M(`(1/2)^${n - 1}`)} = ${M('1/' + 2 ** (n - 1))} is too big, but ${M(`(1/2)^${n}`)} = ${M('1/' + 2 ** n)} ≤ ${m}. So n = ${n}.`); }
      const [d, n] = R.pick([[6, 4], [4, 3], [3, 2], [5, 4]]);
      return E.num(`A fair ${d}-sided die is rolled repeatedly. What is the smallest number of rolls so that the chance of at least one ${d} is more than ${M('1/2')}?`, [{ ans: n }], `Need ${M(`((${d - 1})/${d})^n<1/2`)}. ${M(`((${d - 1})/${d})^${n - 1}`)} = ${M(`${(d - 1) ** (n - 1)}/${d ** (n - 1)}`)} is still at least ${M('1/2')}, but ${M(`((${d - 1})/${d})^${n}`)} = ${M(`${(d - 1) ** n}/${d ** n}`)} is below it. So ${n} rolls.`); } },
    f: { t: 'complement with insight', g: R => { const k = R.int(0, 2);
      if (k < 2) { const n = R.int(3, 10); const a = [0, 2, 3]; for (let i = 3; i <= n; i++) a[i] = a[i - 1] + a[i - 2]; const T = 2 ** n;
        return k === 0 ? E.num(`A fair coin is tossed ${n} times. What is the probability that no two heads come up in a row?`, [fr(a[n], T)], `Let a(n) count good sequences. One ending in T extends a good n − 1 sequence; one ending in H must end TH. So a(n) = a(n − 1) + a(n − 2), with a(1) = 2, a(2) = 3: a(${n}) = ${a[n]}. P = ${FF(a[n], T)}.`)
          : E.num(`A fair coin is tossed ${n} times. What is the probability of at least two heads in a row somewhere?`, [fr(T - a[n], T)], `Complement: sequences with no HH follow a(n) = a(n − 1) + a(n − 2), a(1) = 2, a(2) = 3, giving a(${n}) = ${a[n]}. So P = 1 − ${M(`${a[n]}/${T}`)} = ${FF(T - a[n], T)}.`); }
      const n = R.int(2, 4), [m, p, q] = R.pick([[6, 2, 3], [10, 2, 5], [15, 3, 5]]), cnt = f => [1, 2, 3, 4, 5, 6].filter(f).length;
      const A = cnt(x => x % p), B = cnt(x => x % q), AB = cnt(x => x % p && x % q), T = 6 ** n, good = T - A ** n - B ** n + AB ** n;
      return E.num(`${n} fair dice are rolled and the numbers are multiplied. What is the probability the product is a multiple of ${m}?`, [fr(good, T)], `Complement with inclusion–exclusion: fail if no die has a factor ${p} (${M(`(${A}/6)^${n}`)}) or no die has a factor ${q} (${M(`(${B}/6)^${n}`)}), adding back both (${M(`(${AB}/6)^${n}`)}). So P = ${M(`(${T}-${A ** n}-${B ** n}+${AB ** n})/${T}`)} = ${FF(good, T)}.`); } },
  });

  /* IV.14.08 Independent events */
  const DIE = [['a 6', 1], ['an even number', 3], ['a number greater than 4', 2], ['a prime number', 3], ['a 1 or a 2', 2], ['a number less than 5', 4]];
  const FRS = [[1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [1, 6], [5, 6]];
  S('IV.14.08', 'Independent events', {
    a: { t: 'the multiplication rule', g: R => { const k = R.int(0, 2);
      if (k === 0) { const [ev, c] = R.pick(DIE), side = R.pick(['heads', 'tails']);
        return E.num(`A fair coin is tossed and a fair die is rolled. What is the probability of ${side} and ${ev}?`, [fr(c, 12)], `The coin and die don't affect each other, so multiply: ${M('1/2')} × ${M(c + '/6')} = ${FF(c, 12)}.`); }
      if (k === 1) { const [ev, c] = R.pick(CARDS.slice(0, 8)), [e2, c2] = R.pick(DIE);
        return E.num(`A card is drawn from a standard deck and a fair die is rolled. What is the probability of ${ev} and ${e2}?`, [fr(c * c2, 312)], `Independent, so multiply: ${M(c + '/52')} × ${M(c2 + '/6')} = ${FF(c * c2, 312)}.`); }
      const p = R.int(1, 9), q = R.int(1, 9);
      return E.num(`A and B are independent, with P(A) = ${dc(p / 10)} and P(B) = ${dc(q / 10)}. Find P(A and B).`, [{ ans: cl(p * q / 100) }], `For independent events, P(A and B) = P(A) × P(B) = ${dc(p / 10)} × ${dc(q / 10)} = ${dc(p * q / 100)}.`); } },
    b: { t: 'test for independence', g: R => { const yes = R.bool(); let p, q, r;
      do { p = R.int(2, 9); q = R.int(2, 9); r = yes ? p * q : p * q + R.pick([-10, -6, -5, -4, -2, 2, 4, 5, 6, 10]); } while (r <= 0 || r >= 10 * Math.min(p, q) || r < 10 * (p + q) - 100);
      return E.choiceFixed(`P(A) = ${dc(p / 10)}, P(B) = ${dc(q / 10)} and P(A and B) = ${dc(r / 100)}. Are A and B independent?`, ['Yes', 'No'], yes ? 0 : 1,
        `Check: P(A) × P(B) = ${dc(p / 10)} × ${dc(q / 10)} = ${dc(p * q / 100)}, which ${yes ? 'equals' : 'is not'} P(A and B) = ${dc(r / 100)}, so they are ${yes ? '' : 'not '}independent.`); } },
    c: { t: 'with replacement', g: R => { const r = R.int(2, 8), b = R.int(2, 8), N = r + b, k = R.int(0, 2);
      const head = `A bag has ${r} red and ${b} blue marbles. One is drawn, put back, and a second is drawn.`;
      if (k === 0) return E.num(`${head} What is the probability both are red?`, [fr(r * r, N * N)], `Putting it back keeps the draws independent: ${FM(r, N)} × ${FM(r, N)} = ${FF(r * r, N * N)}.`);
      if (k === 1) return E.num(`${head} What is the probability the first is red and the second is blue?`, [fr(r * b, N * N)], `Independent draws: ${FM(r, N)} × ${FM(b, N)} = ${FF(r * b, N * N)}.`);
      return E.num(`${head} What is the probability they are different colors?`, [fr(2 * r * b, N * N)], `Red then blue or blue then red: 2 × ${FM(r, N)} × ${FM(b, N)} = ${FF(2 * r * b, N * N)}.`); } },
    d: { t: 'independent vs mutually exclusive', g: R => { const kind = R.int(0, 2); let p, q, r;
      do { p = R.int(1, 8); q = R.int(1, 8); r = kind === 0 ? p * q : kind === 1 ? 0 : p * q + R.pick([-5, -3, -2, 2, 3, 5, 10]); } while (r < 0 || r > 10 * Math.min(p, q) || r < 10 * (p + q) - 100 || (kind === 2 && r === 0) || (kind === 1 && p + q > 10));
      return E.choiceFixed(`P(A) = ${dc(p / 10)}, P(B) = ${dc(q / 10)} and P(A and B) = ${dc(r / 100)}. Which best describes A and B?`, ['independent', 'mutually exclusive', 'neither'], kind,
        [`P(A) × P(B) = ${dc(p * q / 100)} = P(A and B), so they are independent (and they can happen together, so not mutually exclusive).`, `P(A and B) = 0, so they can't happen together: mutually exclusive. They are not independent, since P(A) × P(B) = ${dc(p * q / 100)} ≠ 0.`, `P(A and B) = ${dc(r / 100)} is not 0 and not P(A) × P(B) = ${dc(p * q / 100)}, so neither.`][kind]); } },
    e: { t: 'find the missing probability', g: R => { const p = R.int(1, 8), q = R.int(1, 8), k = R.int(0, 2);
      if (k === 0) return E.num(`A and B are independent. P(A) = ${dc(p / 10)} and P(A or B) = ${dc((10 * p + 10 * q - p * q) / 100)}. Find P(B).`, [{ ans: cl(q / 10) }], `P(A or B) = P(A) + P(B) − P(A)P(B), so P(B)(1 − ${dc(p / 10)}) = ${dc((10 * p + 10 * q - p * q) / 100)} − ${dc(p / 10)} = ${dc(q * (10 - p) / 100)}. P(B) = ${dc(q * (10 - p) / 100)} ÷ ${dc(1 - p / 10)} = ${dc(q / 10)}.`);
      if (k === 1) return E.num(`A and B are independent. P(A) = ${dc(p / 10)} and P(A and B) = ${dc(p * q / 100)}. Find P(B).`, [{ ans: cl(q / 10) }], `P(A and B) = P(A)P(B), so P(B) = ${dc(p * q / 100)} ÷ ${dc(p / 10)} = ${dc(q / 10)}.`);
      return E.num(`A and B are independent. P(A) = ${dc(p / 10)} and the probability that neither happens is ${dc((10 - p) * (10 - q) / 100)}. Find P(B).`, [{ ans: cl(q / 10) }], `Their complements are independent too: ${dc((10 - p) * (10 - q) / 100)} = ${dc(1 - p / 10)} × P(not B), so P(not B) = ${dc(1 - q / 10)} and P(B) = ${dc(q / 10)}.`); } },
    f: { t: 'a game that could go on forever', g: R => { const k = R.int(0, 1);
      if (k === 0) { const [a1, a2] = R.pick(FRS), [b1, b2] = R.pick(FRS), num = a1 * b2, den = a2 * b2 - (a2 - a1) * (b2 - b1);
        return E.num(`Ali and Bea take turns shooting at a target, Ali first. Ali hits with probability ${FM(a1, a2)} and Bea with probability ${FM(b1, b2)}, independently each shot. The first to hit wins. What is the probability that Ali wins?`, [fr(num, den)],
          `Either Ali hits at once, or both miss (probability ${FM((a2 - a1) * (b2 - b1), a2 * b2)}) and the game starts over. So P = ${FM(a1, a2)} + ${FM((a2 - a1) * (b2 - b1), a2 * b2)}P, giving P = ${FM(a1, a2)} ÷ (1 − ${FM((a2 - a1) * (b2 - b1), a2 * b2)}) = ${FM(num, den)}.`); }
      const [d, ev] = R.pick([[2, 'flip heads on a fair coin'], [6, 'roll a 6 on a fair die'], [3, 'roll a 1 or 2 on a fair die'], [4, 'draw a heart (the card is put back each time)'], [13, 'draw an ace (the card is put back each time)'], [5, 'spin red on a spinner with 5 equal colors']]);
      const pos = R.int(1, 3), T = d ** 3 - (d - 1) ** 3, nu = (d - 1) ** (pos - 1) * d ** (3 - pos);
      return E.num(`Three players take turns, in order, trying to ${ev}. The first to succeed wins. What is the probability that the ${['first', 'second', 'third'][pos - 1]} player wins?`, [fr(nu, T)],
        `Let p = ${FM(1, d)}. Player ${pos} wins in round one with probability ${pos > 1 ? M(`(${d - 1}/${d})^${pos - 1}`) + ' × ' + FM(1, d) : FM(1, d)}; each full round of misses (${M(`(${d - 1}/${d})^3`)}) restarts the game. Geometric series: P = ${FM(nu, T)}.`); } },
  });

  /* IV.14.09 Conditional probability */
  const CTX9 = [['it rains', 'the sky is cloudy'], ['a student passes', 'the student studied'], ['a person has a cough', 'the person has a cold'], ['the alarm rings', 'there is a fire'], ['a card is a king', 'the card is a face card'],
    ['a patient is sick', 'the test is positive'], ['a car is red', 'the car is a sports car'], ['a flight is late', 'it is snowing']];
  const DIEC = [['the roll is even', x => x % 2 === 0], ['the roll is odd', x => x % 2 === 1], ['the roll is greater than 2', x => x > 2], ['the roll is at most 4', x => x <= 4], ['the roll is prime', x => PRIMES.includes(x)], ['the roll is not a 6', x => x !== 6]];
  const DIEE = [['a 6', x => x === 6], ['greater than 3', x => x > 3], ['a prime', x => PRIMES.includes(x)], ['a 2', x => x === 2], ['less than 3', x => x < 3], ['a multiple of 3', x => x % 3 === 0], ['a 1', x => x === 1], ['even', x => x % 2 === 0]];
  const CARD9 = [['a face card', 12, 'a king', 4], ['a heart', 13, 'a face card', 3], ['red', 26, 'a heart', 13], ['a king', 4, 'red', 2], ['a number card from 2 to 10', 36, 'an even number', 20], ['a spade', 13, 'an ace', 1], ['black', 26, 'a queen', 2], ['a face card', 12, 'red', 6], ['an ace', 4, 'a spade', 1], ['a diamond', 13, 'a number card from 2 to 10', 9]];
  const TW = [[['is in Grade 10', 'is in Grade 11'], ['plays a sport', "doesn't play a sport"], ['Grade 10', 'Grade 11'], ['Sport', 'No sport'], 'students'],
    [['is an adult', 'is a child'], ['liked the film', "didn't like the film"], ['Adult', 'Child'], ['Liked it', "Didn't"], 'viewers'],
    [['took the morning train', 'took the evening train'], ['arrived on time', 'arrived late'], ['Morning', 'Evening'], ['On time', 'Late'], 'passengers']];
  S('IV.14.09', 'Conditional probability', {
    a: { t: 'what P(A | B) means', g: R => { const k = R.int(0, 2);
      if (k === 0) { const [A, B] = R.pick(CTX9), flip = R.bool(), [X, Y] = flip ? [B, A] : [A, B];
        return E.choice(R, `Let A = "${A}" and B = "${B}". What does ${flip ? 'P(B | A)' : 'P(A | B)'} mean?`, `the probability that ${X}, given that ${Y}`, [`the probability that ${Y}, given that ${X}`, `the probability that ${X} and ${Y}`, `the probability that ${X} or ${Y}`],
          `The event after the bar is the one we know happened: we look only at cases where ${Y}, and ask how often ${X}.`); }
      if (k === 1) { let c, e, B, AB; do { c = R.pick(DIEC); e = R.pick(DIEE); B = [1, 2, 3, 4, 5, 6].filter(c[1]); AB = B.filter(e[1]); } while (!AB.length || AB.length === B.length);
        return E.num(`A fair die is rolled. Given that ${c[0]}, what is the probability that it is ${e[0]}?`, [fr(AB.length, B.length)], `Only ${B.join(', ')} are possible now, and ${AB.length > 1 ? AB.join(', ') + ' fit' : 'only ' + AB[0] + ' fits'}: ${FF(AB.length, B.length)}.`); }
      const [b, nb, a, nab] = R.pick(CARD9);
      return E.num(`A card is drawn from a standard 52-card deck. Given that it is ${b}, what is the probability that it is ${a}?`, [fr(nab, nb)], `Only the ${nb} cards that are ${b} count now, and ${nab} of them ${nab > 1 ? 'are' : 'is'} ${a}: ${FF(nab, nb)}.`); } },
    b: { t: 'from a two-way table', g: R => { const [rd, cd, rl, cl2, who] = R.pick(TW), n = [[R.int(5, 40), R.int(5, 40)], [R.int(5, 40), R.int(5, 40)]], i = R.int(0, 1), j = R.int(0, 1), byRow = R.bool();
      const tab = table([['', ...cl2, 'Total'], [rl[0], n[0][0], n[0][1], n[0][0] + n[0][1]], [rl[1], n[1][0], n[1][1], n[1][0] + n[1][1]], ['Total', n[0][0] + n[1][0], n[0][1] + n[1][1], n[0][0] + n[0][1] + n[1][0] + n[1][1]]]);
      if (byRow) { const tot = n[i][0] + n[i][1];
        return E.num(`The table shows ${who}. One is chosen at random. Given that the person ${rd[i]}, what is the probability that the person ${cd[j]}?${tab}`, [fr(n[i][j], tot)], `Look only at the ${rl[i]} row: ${n[i][j]} of its ${tot}, so ${FF(n[i][j], tot)}.`); }
      const tot = n[0][j] + n[1][j];
      return E.num(`The table shows ${who}. One is chosen at random. Given that the person ${cd[j]}, what is the probability that the person ${rd[i]}?${tab}`, [fr(n[i][j], tot)], `Look only at the ${cl2[j]} column: ${n[i][j]} of its ${tot}, so ${FF(n[i][j], tot)}. Don't divide by the row total; the condition picks the column.`); } },
    c: { t: 'the formula', g: R => { const b = R.int(2, 9), a = R.int(1, 9), k = R.int(0, 2), ab = a * b;
      if (k === 0) return E.num(`P(A and B) = ${dc(ab / 100)} and P(B) = ${dc(b / 10)}. Find P(A | B).`, [{ ans: cl(a / 10) }], `P(A | B) = P(A and B) ÷ P(B) = ${dc(ab / 100)} ÷ ${dc(b / 10)} = ${dc(a / 10)}.`);
      if (k === 1) return E.num(`P(B) = ${dc(b / 10)} and P(A | B) = ${dc(a / 10)}. Find P(A and B).`, [{ ans: cl(ab / 100) }], `Rearrange: P(A and B) = P(A | B) × P(B) = ${dc(a / 10)} × ${dc(b / 10)} = ${dc(ab / 100)}.`);
      return E.num(`P(A) = ${dc(b / 10)} and P(A and B) = ${dc(ab / 100)}. Find P(B | A).`, [{ ans: cl(a / 10) }], `Now A is the condition: P(B | A) = P(A and B) ÷ P(A) = ${dc(ab / 100)} ÷ ${dc(b / 10)} = ${dc(a / 10)}.`); } },
    d: { t: 'without replacement', g: R => { const k = R.int(0, 2);
      if (k < 2) { const r = R.int(3, 9), b = R.int(3, 9), N = r + b;
        return k === 0 ? E.num(`A bag has ${r} red and ${b} blue marbles. Two are drawn without replacement. Given that the first is red, what is the probability the second is also red?`, [fr(r - 1, N - 1)], `After a red is removed, ${r - 1} red remain among ${N - 1} marbles: ${FF(r - 1, N - 1)}.`)
          : E.num(`A bag has ${r} red and ${b} blue marbles. Two are drawn without replacement. Given that the first is blue, what is the probability the second is red?`, [fr(r, N - 1)], `After a blue is removed, all ${r} red remain among ${N - 1} marbles: ${FF(r, N - 1)}.`); }
      const DK = [['an ace', c => c[0] === 1], ['a heart', c => c[1] === 0], ['a king', c => c[0] === 13], ['a face card', c => c[0] > 10], ['a red card', c => c[1] < 2], ['a club', c => c[1] === 2], ['a spade', c => c[1] === 3], ['a queen', c => c[0] === 12], ['a black card', c => c[1] > 1]];
      const deck = []; for (let r = 1; r <= 13; r++) for (let t = 0; t < 4; t++) deck.push([r, t]);
      let A, B, nA, nB, nAB; do { [A, B] = R.sample(DK, 2); nA = deck.filter(A[1]).length; nB = deck.filter(B[1]).length; nAB = deck.filter(c => A[1](c) && B[1](c)).length; } while (nAB !== 0 && nAB !== nA);
      if (R.bool(0.4)) { B = A; nB = nA; nAB = nA; }
      const left = nAB ? nB - 1 : nB;
      return E.num(`Two cards are drawn from a standard deck without replacement. Given that the first is ${A[0]}, what is the probability the second is ${B === A ? 'also ' : ''}${B[0]}?`, [fr(left, 51)],
        nAB ? `The first card was one of the ${nB} (${B[0].replace(/^an? /, '')}s), so ${left} remain among 51 cards: ${FF(left, 51)}.` : `The first card can't be ${B[0]}, so all ${nB} are still among the 51 cards left: ${FF(left, 51)}.`); } },
  });

  /* IV.14.10 Tree diagrams */
  const tree = (p, pn, q, qn, r, rn, L = ['A', 'A′', 'B', 'B′']) => V.geo({ pts: { S: [0, 0], A: [4, 2.4], N: [4, -2.4], AB: [8, 3.6], AN: [8, 1.2], NB: [8, -1.2], NN: [8, -3.6] }, labels: false, w: 320,
    segs: [['S', 'A'], ['S', 'N'], ['A', 'AB'], ['A', 'AN'], ['N', 'NB'], ['N', 'NN']].map(([u, v]) => [u, v, { width: 1.8 }]),
    text: [[1.5, 1.75, p], [1.5, -1.75, pn], [5.8, 3.5, q], [5.8, 1.3, qn], [5.8, -1.3, r], [5.8, -3.5, rn], [4, 3.05, L[0]], [4, -3.05, L[1]], [8.6, 3.6, L[2]], [8.6, 1.2, L[3]], [8.6, -1.2, L[2]], [8.6, -3.6, L[3]]], label: 'tree diagram' });
  const tpd = (p, q, r) => tree(dc(p / 10), dc(1 - p / 10), dc(q / 10), dc(1 - q / 10), dc(r / 10), dc(1 - r / 10));
  const CTX10 = [['it rains', 'the bus is late'], ['Kai studies', 'Kai passes the test'], ['the first serve is in', 'the point is won'], ['the alarm goes off', 'Rosa is on time'], ['a part comes from Machine X', 'the part is faulty'], ['the team trains hard', 'the team wins']];
  const tlead = (c, p, q, r) => `In the tree, A = "${c[0]}" and B = "${c[1]}"; ′ means "not". P(A) = ${dc(p / 10)}, P(B | A) = ${dc(q / 10)} and P(B | A′) = ${dc(r / 10)}.`;
  S('IV.14.10', 'Tree diagrams', {
    a: { t: 'multiply along branches', g: R => { const p = R.int(1, 9), q = R.int(1, 9), r = R.int(1, 9), c = R.pick(CTX10), k = R.int(0, 3);
      const pick = [['A and B', p * q, `${dc(p / 10)} × ${dc(q / 10)}`], ['A and B′', p * (10 - q), `${dc(p / 10)} × ${dc(1 - q / 10)}`], ['A′ and B', (10 - p) * r, `${dc(1 - p / 10)} × ${dc(r / 10)}`], ['A′ and B′', (10 - p) * (10 - r), `${dc(1 - p / 10)} × ${dc(1 - r / 10)}`]][k];
      return E.num(`${tlead(c, p, q, r)} Find P(${pick[0]}).`, [{ ans: cl(pick[1] / 100) }], `Follow the path and multiply along it: ${pick[2]} = ${dc(pick[1] / 100)}. Don't add along a path.`, { visual: tpd(p, q, r) }); } },
    b: { t: 'add the paths', g: R => { const p = R.int(1, 9), q = R.int(1, 9), r = R.int(1, 9), c = R.pick(CTX10), neg = R.bool(0.3);
      const v = neg ? p * (10 - q) + (10 - p) * (10 - r) : p * q + (10 - p) * r;
      return E.num(`${tlead(c, p, q, r)} Find P(${neg ? 'B′' : 'B'}), the total probability that ${neg ? 'B does not happen' : c[1]}.`, [{ ans: cl(v / 100) }],
        `Two paths end in ${neg ? 'B′' : 'B'}. Multiply along each, then add: ${neg ? `${dc(p / 10)} × ${dc(1 - q / 10)} + ${dc(1 - p / 10)} × ${dc(1 - r / 10)}` : `${dc(p / 10)} × ${dc(q / 10)} + ${dc(1 - p / 10)} × ${dc(r / 10)}`} = ${dc(v / 100)}.`, { visual: tpd(p, q, r) }); } },
    c: { t: 'conditional branches', g: R => { const r = R.int(2, 7), b = R.int(2, 7), N = r + b, k = R.int(0, 2);
      const vis = tree(fs(r, N), fs(b, N), fs(r - 1, N - 1), fs(b, N - 1), fs(r, N - 1), fs(b - 1, N - 1), ['R', 'B', 'R', 'B']);
      const mm = (a, b2, c, d) => `${M(a + '/' + b2)} × ${M(c + '/' + d)}`;
      const ask = [['both are red', r * (r - 1), mm(r, N, r - 1, N - 1)], ['they are different colors', 2 * r * b, `${mm(r, N, b, N - 1)} + ${mm(b, N, r, N - 1)}`], ['they are the same color', r * (r - 1) + b * (b - 1), `${mm(r, N, r - 1, N - 1)} + ${mm(b, N, b - 1, N - 1)}`]][k];
      return E.num(`A bag has ${r} red and ${b} blue marbles. Two are drawn without replacement, as in the tree (first draw, then second). What is the probability ${ask[0]}?`, [fr(ask[1], N * (N - 1))], `The second branches change because one marble is gone. ${ask[2]} = ${FF(ask[1], N * (N - 1))}.`, { visual: vis }); } },
    d: { t: 'reverse a tree', g: R => { const p = R.int(1, 9), q = R.int(1, 9), r = R.int(1, 9), c = R.pick(CTX10), num = p * q, den = p * q + (10 - p) * r;
      return E.num(`${tlead(c, p, q, r)} Given that B happened, what is the probability that A happened? Give an exact answer.`, [fr(num, den)], `P(A | B) = P(A and B) ÷ P(B) = ${dc(num / 100)} ÷ (${dc(num / 100)} + ${dc((10 - p) * r / 100)}) = ${M(`${num}/${den}`)}${fs(num, den) !== `${num}/${den}` ? ' = ' + F(num, den) : ''}.`, { visual: tpd(p, q, r) }); } },
  });

  /* IV.14.11 Bayes' theorem */
  S("IV.14.11", "Bayes' theorem", {
    a: { t: 'the formula', g: R => { let x, y, z; do { x = R.int(2, 19) * 5; y = R.int(1, 18) * 5; z = R.int(1, 18) * 5; } while (x * y > 100 * z || z * 100 - x * y > (100 - y) * 100 || x * y === 100 * z);
      return E.num(`P(B | A) = ${dc(x / 100)}, P(A) = ${dc(y / 100)} and P(B) = ${dc(z / 100)}. Use Bayes' theorem to find P(A | B). Give an exact answer.`, [fr(x * y, 100 * z)], `P(A | B) = P(B | A)P(A) ÷ P(B) = ${dc(x / 100)} × ${dc(y / 100)} ÷ ${dc(z / 100)} = ${dc(x * y / 10000)} ÷ ${dc(z / 100)} = ${E.pt(fs(x * y, 100 * z))}.`); } },
    b: { t: 'medical test problems', g: R => { const d = R.pick([1, 2, 3, 4, 5, 10]), s = R.pick([80, 85, 90, 95, 98, 99]), f = R.pick([1, 2, 3, 5, 8, 10]), tp = d * s, fp = (100 - d) * f, v = tp / (tp + fp);
      return E.num(`A disease affects ${d}% of people. A test is positive for ${s}% of people who have it and for ${f}% of people who don't. A random person tests positive. What is the probability they have the disease? Round to 3 decimal places.`, [{ ans: +v.toFixed(6), dp: 3 }],
        `P(sick | +) = ${M(`(${dc(d / 100)}*${dc(s / 100)})/(${dc(d / 100)}*${dc(s / 100)}+${dc(1 - d / 100)}*${dc(f / 100)})`)} = ${dc(tp / 10000)} ÷ ${dc((tp + fp) / 10000)} ≈ ${v.toFixed(3)}.`); } },
    c: { t: 'the base-rate trap', g: R => { let N, s, f, v; do { N = R.pick([100, 200, 250, 500, 1000]); s = R.pick([90, 95, 98, 99]); f = R.pick([1, 2, 5, 10]); v = (s / N) / (s / N + f * (N - 1) / N); } while (v < 0.02 || v > 0.6);
      const pc = Math.round(100 * v), opts = [s, 100 - f, 50].filter(x => x !== pc);
      return E.choice(R, `A disease affects 1 in ${fm(N)} people. A test detects ${s}% of cases and wrongly flags ${f}% of healthy people. Someone tests positive. About how likely is it that they have the disease?`, `about ${pc}%`, opts.map(x => `about ${x}%`).concat(pc === 1 ? [] : [`about ${Math.max(1, Math.round(pc / 3))}%`]).slice(0, 3),
        `Picture ${fm(100 * N)} people: ${100} are sick and about ${cl(s)} test positive; of the ${fm(100 * N - 100)} healthy, about ${fm(cl(f * (N - 1)))} test positive. So ${s} ÷ (${s} + ${fm(cl(f * (N - 1)))}) ≈ ${pc}%. The rare disease drags it far below ${s}%.`); } },
    d: { t: 'with a tree or a table', g: R => { const P = 10000, d = R.pick([1, 2, 4, 5, 10]), s = R.pick([80, 90, 95]), f = R.pick([2, 4, 5, 10]);
      const sick = P * d / 100, tp = sick * s / 100, fp = (P - sick) * f / 100;
      return E.num(`Out of ${fm(P)} people, ${d}% have a condition. A test is positive for ${s}% of those with it and ${f}% of those without it. How many people test positive, and what is P(has it | positive)?`, [{ label: 'number positive =', ans: tp + fp }, { label: 'P(has it | positive) =', ...fr(tp, tp + fp) }],
        `${fm(sick)} have it and ${fm(tp)} of them test positive; ${fm(P - sick)} don't and ${fm(fp)} of them test positive. Positives: ${fm(tp + fp)}, of which ${fm(tp)} truly have it: ${FF(tp, tp + fp)}.`); } },
  });

  /* IV.14.12 Expected value */
  const tabX = (xs, ps, xl = 'value', pl = 'probability') => table([[xl, ...xs.map(x => String(x))], [pl, ...ps.map(p => typeof p === 'number' ? dc(p) : `<i>${p}</i>`)]]);
  S('IV.14.12', 'Expected value', {
    a: { t: 'a weighted average of outcomes', g: R => { const k = R.int(0, 1);
      if (k === 0) { const m = R.int(3, 4), xs = R.distinct(0, 10, m).sort((a, b) => a - b); let ps; do { ps = Array.from({ length: m - 1 }, () => R.int(1, 5)); } while (ps.reduce((a, b) => a + b, 0) > 9); ps.push(10 - ps.reduce((a, b) => a + b, 0)); const P = ps.map(p => p / 10), ev = xs.reduce((s, x, i) => s + x * ps[i], 0) / 10;
        return E.num(`A random variable X has this distribution. Find E(X).${tabX(xs, P)}`, [{ ans: cl(ev) }], `Multiply each value by its probability and add: ${xs.map((x, i) => `${x}(${dc(P[i])})`).join(' + ')} = ${dc(ev)}. Not the plain average of the values.`); }
      const n = R.int(4, 12);
      return E.num(`A fair spinner has ${n} equal sections numbered 1 to ${n}. What is the expected value of a spin?`, [{ ans: cl((n + 1) / 2) }], `Each number has probability ${M('1/' + n)}: (1 + 2 + … + ${n}) ÷ ${n} = ${n * (n + 1) / 2} ÷ ${n} = ${dc((n + 1) / 2)}.`); } },
    b: { t: 'fair games', g: (R, O) => { const k = R.int(0, 1), [nm, m, d] = R.pick([['roll a 6 on a die', 1, 6], ['roll a 5 or 6 on a die', 2, 6], ['flip heads on a coin', 1, 2], ['draw a heart from a deck', 1, 4], ['spin red on a 5-color spinner', 1, 5], ['roll a double with two dice', 1, 6], ['draw an ace from a deck', 1, 13]]);
      if (k === 0) { let c, W; do { c = R.int(1, 10); W = R.int(2, 30); } while (W * m / d === c);
        const ev = cl(W * m / d - c), exact = Number.isInteger(W * m * 100 / d);
        return E.num(`You pay ${money(O, c)} to play. If you ${nm}, you win ${money(O, W)}; otherwise you win nothing. What is your expected net gain per game?${exact ? '' : ' Round to the nearest cent.'}`, [exact ? { ans: ev } : { ans: ev, dp: 2 }],
          `E(prize) = ${money(O, W)} × ${FM(m, d)} = ${money(O, W * m / d)}${exact ? '' : ' (about)'}; minus the ${money(O, c)} cost gives ${exact ? money(O, ev) : money(O, +ev.toFixed(2))} per game${ev < 0 ? ', a loss on average' : ''}.`); }
      const W = R.int(1, 12) * d, c = W * m / d;
      return E.num(`It costs ${money(O, c)} to play a game. If you ${nm}, you win a prize; otherwise nothing. How big must the prize be for the game to be fair?`, [{ label: `prize = ${cur(O)}`, ans: W }], `Fair means E(prize) = cost: prize × ${FM(m, d)} = ${c}, so prize = ${c} × ${FM(d, m)} = ${W}.`); } },
    c: { t: 'insurance and lotteries', g: (R, O) => { const k = R.int(0, 1);
      if (k === 0) { const X = R.pick([10000, 20000, 50000, 100000, 200000]), q = R.pick([1, 2, 5, 10]) / 1000, Pm = q * X + R.int(1, 12) * 25, ev = cl(Pm - q * X), who = R.bool();
        return E.num(`An insurer sells a one-year policy for ${money(O, Pm)} that pays ${money(O, X)} if a claim happens, which has probability ${q}. What is the ${who ? "insurer's expected profit" : "customer's expected net gain"} per policy?`, [{ ans: who ? ev : cl(-ev) }],
          `Expected payout = ${q} × ${money(O, X)} = ${money(O, q * X)}. ${who ? `Profit = ${money(O, Pm)} − ${money(O, q * X)} = ${money(O, ev)}.` : `Customer: ${money(O, q * X)} − ${money(O, Pm)} = ${money(O, -ev)}; people pay for peace of mind, not for a positive expected value.`}`); }
      let c, N1, P1, N2, P2, ev; do { c = R.pick([1, 2, 5]); N1 = R.pick([1000, 2000, 5000, 10000]); P1 = R.pick([500, 1000, 2000, 5000]); N2 = R.pick([50, 100, 200]); P2 = R.pick([10, 20, 50]); ev = cl(P1 / N1 + P2 / N2 - c); } while (ev >= 0);
      return E.num(`A lottery ticket costs ${money(O, c)}. It wins ${money(O, P1)} with probability ${M('1/' + N1)} and ${money(O, P2)} with probability ${M('1/' + N2)}; otherwise nothing. What is the expected net gain per ticket?`, [{ ans: ev }],
        `E(prize) = ${P1}/${N1} + ${P2}/${N2} = ${dc(P1 / N1)} + ${dc(P2 / N2)} = ${dc(P1 / N1 + P2 / N2)}. Subtract the ${money(O, c)} cost: ${money(O, ev)} per ticket.`); } },
    d: { t: 'decide by expected value', g: (R, O) => { const wantA = R.bool(); let a, p, W, L, eA, eB;
      do { a = R.int(2, 20) * 5; p = R.int(1, 9); W = R.int(2, 40) * 10; L = R.pick([0, 0, 10, 20]); eA = a; eB = cl((p * W + (10 - p) * L) / 10); } while (eA === eB || (eA > eB) !== wantA || Math.abs(eA - eB) > 40);
      return E.choiceFixed(`Option A: get ${money(O, a)} for sure. Option B: a ${dc(p / 10)} chance of ${money(O, W)}, otherwise ${money(O, L)}. Which option has the higher expected value?`, ['Option A', 'Option B'], wantA ? 0 : 1,
        `E(A) = ${money(O, eA)}. E(B) = ${dc(p / 10)} × ${W} + ${dc(1 - p / 10)} × ${L} = ${money(O, eB)}. So Option ${wantA ? 'A' : 'B'} is higher on average.`); } },
    e: { t: 'find the missing probabilities', g: R => { const k = R.int(0, 1);
      if (k === 0) { let a, b, p, q; do { a = R.int(1, 4); b = R.int(1, 4); p = R.int(1, 5); q = 10 - a - b - p; } while (q < 1);
        const Ev = cl((p + 2 * q + 3 * b) / 10);
        return E.num(`X takes the values 0, 1, 2, 3 with probabilities ${dc(a / 10)}, p, q, ${dc(b / 10)}. If E(X) = ${Ev}, find p and q.${tabX([0, 1, 2, 3], [a / 10, 'p', 'q', b / 10].map(v => typeof v === 'number' ? cl(v) : v))}`, [{ label: 'p =', ans: cl(p / 10) }, { label: 'q =', ans: cl(q / 10) }],
          `Probabilities sum to 1: p + q = ${dc((p + q) / 10)}. The mean gives p + 2q + ${dc(3 * b / 10)} = ${Ev}, so p + 2q = ${dc((p + 2 * q) / 10)}. Subtract: q = ${dc(q / 10)}, then p = ${dc(p / 10)}.`); }
      const xs = R.distinct(1, 9, 3).sort((a, b) => a - b), ps = R.pick([[2, 3, 5], [5, 3, 2], [1, 4, 5], [3, 3, 4], [4, 4, 2], [2, 5, 3]]), j = R.int(0, 2), Ev = cl(xs.reduce((s, x, i) => s + x * ps[i], 0) / 10);
      const shown = xs.map((x, i) => i === j ? 'x' : x);
      return E.num(`A random variable has E(X) = ${Ev} and this distribution. Find the missing value x.${tabX(shown, ps.map(p => p / 10))}`.replace('<td>x</td>', '<td><i>x</i></td>'), [{ label: 'x =', ans: xs[j] }],
        `${xs.map((x, i) => i === j ? `${dc(ps[i] / 10)}x` : `${x}(${dc(ps[i] / 10)})`).join(' + ')} = ${Ev}, so ${dc(ps[j] / 10)}x = ${dc(ps[j] * xs[j] / 10)} and x = ${xs[j]}.`); } },
    f: { t: 'linearity and waiting', g: R => { const k = R.int(0, 3);
      if (k === 0) { const n = R.int(3, 20), both = R.bool();
        return E.num(`${n} people stand in a row and each flips a fair coin. What is the expected number of neighboring pairs in which ${both ? 'both people get heads' : 'the two people get the same result'}?`, [both ? fr(n - 1, 4) : fr(n - 1, 2)], `There are ${n - 1} neighboring pairs, and each one ${both ? 'is HH with probability ' + M('1/4') : 'matches with probability ' + M('1/2')}. Expected values add even though the pairs overlap: ${n - 1} × ${both ? M('1/4') : M('1/2')} = ${F(n - 1, both ? 4 : 2)}.`); }
      if (k === 1) { const n = R.int(3, 30);
        return E.num(`${n} people put their hats in a pile and each takes one back at random. What is the expected number of people who get their own hat?`, [{ ans: 1 }], `Each person gets their own hat with probability ${M('1/' + n)}. Add over all ${n} people (linearity of expectation): ${n} × ${M('1/' + n)} = 1, whatever the number of people.`); }
      if (k === 2) { const m = R.int(2, 4), num = 6 ** m - 5 ** m, den = 6 ** (m - 1);
        return E.num(`${m} fair dice are rolled. What is the expected number of different faces that appear?`, [fr(num, den)], `Each of the 6 faces appears with probability ${M(`1-(5/6)^${m}`)}. Add over the 6 faces: 6 × (1 − ${M(`${5 ** m}/${6 ** m}`)}) = ${FF(num, den)}.`); }
      const [ev, d] = R.pick([['a 6 with a fair die', 6], ['heads with a fair coin', 2], ['a 1 or 2 with a fair die', 3], ['a heart, drawing a card from a full deck each time', 4], ['an ace, drawing a card from a full deck each time', 13], ['a double with two dice', 6], ['a sum of 7 with two dice', 6], ['a sum of 12 with two dice', 36], ['red on a spinner with 5 equal colors', 5], ['a total of 11 with two dice', 18]]);
      return E.num(`You keep trying until you get ${ev}. What is the expected number of tries, including the successful one?`, [{ ans: d }], `Each try succeeds with probability p = ${M('1/' + d)}. Then E = 1 + (1 − p)E, since a failed try wastes one and restarts. So E = 1/p = ${d}.`); } },
  });
})(typeof window !== 'undefined' ? window : globalThis);
