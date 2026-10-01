/* Era IV · Unit IV.15 Data & distributions (IV.15.01–IV.15.10) */
(function (G) {
  const E = G.E4, V = E.V, C = E.C, M = s => E.mx(s);
  const S = (id, name, steps) => E.skill({ id, name, steps });
  const nz = (R, lo, hi) => { let v; do v = R.int(lo, hi); while (v === 0); return v; };
  const cl = x => +(+x).toFixed(9);                                   // strip float noise
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };
  const fr = (n, d) => { if (d < 0) { n = -n; d = -d; } const g = gcd(n, d); return { frac: [n / g, d / g], form: 'any' }; };
  const fs = (n, d) => E.pt(E.fracStr(n, d));                          // pretty reduced fraction for text
  const isSq = v => v >= 0 && Number.isInteger(v) && Math.round(Math.sqrt(v)) ** 2 === v;
  const dec3 = v => Math.abs(Math.round(v * 1000) - v * 1000) < 1e-6;   // at most 3 decimal places
  const sum = a => a.reduce((s, v) => s + v, 0);
  const list = xs => xs.map(x => String(cl(x))).join(', ');
  const tbl = rows => `<table class="dt">${rows.map(([h, ...vs]) => `<tr><th>${h}</th>${vs.map(v => `<td>${String(v).replace(/^-/, '−')}</td>`).join('')}</tr>`).join('')}</table>`;
  // n integer deviations in [−lim, lim] that add to 0 (not all 0), passing ok(d, sumOfSquares)
  const devs = (R, n, lim, ok) => { for (let t = 0; t < 40000; t++) { const d = []; for (let i = 0; i < n - 1; i++) d.push(R.int(-lim, lim)); const last = -sum(d);
      if (Math.abs(last) > lim) continue; d.push(last); const ss = sum(d.map(v => v * v)); if (ss === 0) continue; if (!ok || ok(d, ss)) return d; } throw new Error('devs: no data set found'); };
  const eqf = (n, d) => { const g = gcd(n, d); return `${n}/${d}` + (g !== 1 || d === 1 ? ` = ${fs(n, d)}` : ''); };   // '54/4 = 27/2', '54/5'
  const neg = v => String(v).replace(/^-/, '−');
  const ord = n => n + ([11, 12, 13].includes(n % 100) ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] || 'th');
  const sup = e => String(e).split('').map(c => '⁰¹²³⁴⁵⁶⁷⁸⁹'[c]).join('');
  const pp = t => t.replace(/<=/g, ' ≤ ').replace(/>=/g, ' ≥ ').replace(/</g, ' &lt; ').replace(/>/g, ' &gt; ').replace(/=/g, ' = ').replace(/(\d)-(\d)/g, '$1 − $2').replace(/\^(\d+)/g, (m, e) => sup(e));   // probability statements as plain text
  const pw = (b, e) => e === 0 ? '' : e === 1 ? b : b + sup(e);
  const sqList = d => d.map(v => v * v).join(' + ');

  /* IV.15.01 Standard deviation */
  S('IV.15.01', 'Standard deviation', {
    a: { t: 'deviations from the mean', g: R => { const n = R.int(4, 6), m = R.int(8, 40), d = devs(R, n, 7, d => d.some(v => v < 0)), xs = d.map(v => m + v);
      let j; do j = R.int(0, n - 1); while (d[j] === 0 && R.bool(0.9));
      return E.num(`The data are ${list(xs)}. Find the mean, then the deviation of the value ${xs[j]} from the mean.`, [{ label: 'mean =', ans: m }, { label: 'deviation =', ans: d[j] }],
        `Mean = ${sum(xs)} ÷ ${n} = ${m}. Deviation = value − mean = ${xs[j]} − ${m} = ${d[j]}. (All the deviations add to 0.)`); } },
    b: { t: 'variance', g: R => { const n = R.int(4, 6), m = R.int(5, 30), d = devs(R, n, 5), xs = d.map(v => m + v), ss = sum(d.map(v => v * v));
      return E.num(`Find the population variance σ² of ${list(xs)}.`, [{ label: 'σ² =', ...fr(ss, n) }],
        `The mean is ${m}. Deviations: ${list(d)}. Square them first: ${sqList(d)} = ${ss}. Then σ² = ${eqf(ss, n)}.`); } },
    c: { t: 'standard deviation', g: R => { const n = R.int(4, 6), m = R.int(6, 40), clean = R.bool(0.7);
      const d = devs(R, n, 6, (d, ss) => clean ? ss % n === 0 && isSq(ss / n) : !(ss % n === 0 && isSq(ss / n))), xs = d.map(v => m + v), ss = sum(d.map(v => v * v)), sd = Math.sqrt(ss / n);
      return E.num(`Find the population standard deviation σ of ${list(xs)}.${clean ? '' : ' Round to 2 decimal places.'}`, [clean ? { label: 'σ =', ans: sd } : { label: 'σ =', ans: sd, dp: 2 }],
        `Mean ${m}; squared deviations ${sqList(d)} = ${ss}; σ² = ${eqf(ss, n)}, so σ = ${clean ? '√' + sd * sd + ' = ' + sd : '√(' + fs(ss, n) + ') ≈ ' + sd.toFixed(2)}.`); } },
    d: { t: 'population vs sample', g: R => { const kind = R.int(0, 2);
      if (kind === 2) { const samp = R.bool(), N = R.int(12, 40);
        const ctx = samp ? R.pick([`${N} bulbs tested from a factory's whole output`, `${N} randomly chosen voters, used to estimate the spread for the whole city`, `${N} students surveyed from a school of ${N * 30}`, `${N} fish caught to estimate the spread of lengths in a lake`, `${N} bags pulled off a production line to check the whole day's output`])
          : R.pick([`the heights of all ${N} students in a class, and you only care about this class`, `the scores of every one of the ${N} players on a team`, `the ages of all ${N} members of a club, and you want the club's own spread`, `the marks of all ${N} students who took a test, reported for that test only`]);
        return E.choiceFixed(`You have ${ctx}. Which divisor gives the right standard deviation?`, ['divide by n (population σ)', 'divide by n − 1 (sample s)'], samp ? 1 : 0,
          samp ? 'The data are a sample used to estimate a larger population, so use s with n − 1.' : 'The data are the whole group you care about, so use the population σ with n.'); }
      const n = R.int(4, 7), m = R.int(6, 40);
      if (kind === 0) { const d = devs(R, n, 6, (d, ss) => ss % (n - 1) === 0 && isSq(ss / (n - 1))), xs = d.map(v => m + v), ss = sum(d.map(v => v * v)), s = Math.sqrt(ss / (n - 1));
        return E.num(`The values ${list(xs)} are a sample. Find the sample standard deviation s.`, [{ label: 's =', ans: s }],
          `Mean ${m}; squared deviations add to ${ss}. For a sample divide by n − 1 = ${n - 1}: s² = ${ss / (n - 1)}, so s = ${s}.`); }
      const d = devs(R, n, 5), xs = d.map(v => m + v), ss = sum(d.map(v => v * v));
      return E.num(`For the data ${list(xs)}, find the population variance σ² and the sample variance s².`, [{ label: 'σ² =', ...fr(ss, n) }, { label: 's² =', ...fr(ss, n - 1) }],
        `Mean ${m}; the squared deviations add to ${ss}. σ² = ${eqf(ss, n)} and s² = ${eqf(ss, n - 1)}. The sample version is a little larger.`); } },
  });

  /* IV.15.02 Summary statistics */
  const clsAt = (f, p) => { let c = 0; for (let i = 0; i < f.length; i++) { c += f[i]; if (c >= p) return i; } };   // class holding the p-th value
  const FT = [['Goals scored', 0], ['Children in family', 0], ['Books read', 1], ['Pets owned', 0], ['Shoe size', 5], ['Score on a 10-point quiz', 5], ['Siblings', 0], ['Number rolled', 1]];
  S('IV.15.02', 'Summary statistics', {
    a: { t: 'from a frequency table', g: R => { const [lab, st] = R.pick(FT), k = R.int(4, 6), xs = Array.from({ length: k }, (_, i) => st + i), kind = R.int(0, 2);
      let f, N, T; do { f = xs.map(() => R.int(1, 9)); N = sum(f); T = sum(f.map((v, i) => v * xs[i])); } while ((kind === 0 && (T * 100) % N !== 0) || (kind === 2 && f.filter(v => v === Math.max(...f)).length > 1));
      const t = tbl([[lab, ...xs], ['Frequency', ...f]]);
      if (kind === 0) return E.num(`Find the mean of the data in this table.${t}`, [{ label: 'mean =', ans: cl(T / N) }], `Σfx = ${f.map((v, i) => v + '×' + xs[i]).join(' + ')} = ${T}, and Σf = ${N}. Mean = ${T}/${N} = ${cl(T / N)}.`);
      if (kind === 2) { const mo = xs[f.indexOf(Math.max(...f))]; return E.num(`What is the mode of the data in this table?${t}`, [{ label: 'mode =', ans: mo }], `The mode is the value with the highest frequency: ${mo} appears ${Math.max(...f)} times.`); }
      const at = p => { let c = 0; for (let i = 0; i < k; i++) { c += f[i]; if (c >= p) return xs[i]; } }, med = N % 2 ? at((N + 1) / 2) : (at(N / 2) + at(N / 2 + 1)) / 2;
      return E.num(`Find the median of the data in this table.${t}`, [{ label: 'median =', ans: med }], `There are ${N} values, so the median is ${N % 2 ? `the ${ord((N + 1) / 2)} value` : `halfway between the ${ord(N / 2)} and ${ord(N / 2 + 1)} values`}. Counting up the frequencies gives ${med}.`); } },
    b: { t: 'estimates from grouped data', g: R => { const w = R.pick([5, 10, 10, 20]), st = w * R.int(0, 4), k = R.int(4, 5), lo = Array.from({ length: k }, (_, i) => st + i * w), mid = lo.map(a => a + w / 2), kind = R.pick([0, 0, 0, 1, 2]);
      let f, N, T; do { f = lo.map(() => R.int(1, 15)); N = sum(f); T = sum(f.map((v, i) => v * mid[i])); } while ((kind === 0 && (T * 100) % N !== 0) || (kind === 1 && f.filter(v => v === Math.max(...f)).length > 1) || (kind === 2 && clsAt(f, Math.floor((N + 1) / 2)) !== clsAt(f, Math.ceil((N + 1) / 2))));
      const cls = lo.map(a => `${a}–${a + w}`), t = tbl([['Time (min)', ...cls], ['Frequency', ...f]]);
      if (kind === 0) return E.num(`Estimate the mean from this grouped table. (Each class includes its lower end, not its upper end.)${t}`, [{ label: 'mean ≈', ans: cl(T / N) }],
        `Use the midpoints ${mid.join(', ')}: Σf·mid = ${T} and Σf = ${N}, so the estimate is ${T}/${N} = ${cl(T / N)}. It's only an estimate, since we don't know the exact values.`);
      if (kind === 1) { const i = f.indexOf(Math.max(...f)); return E.choiceFixed(`Which is the modal class?${t}`, cls, i, `The modal class has the highest frequency: ${cls[i]} with ${f[i]}.`); }
      const i = clsAt(f, Math.floor((N + 1) / 2));
      return E.choiceFixed(`Which class contains the median?${t}`, cls, i, `There are ${N} values, so the median is the value in position (${N} + 1)/2 = ${(N + 1) / 2}. Running totals: ${f.map((_, j) => sum(f.slice(0, j + 1))).join(', ')}, so it falls in ${cls[i]}.`); } },
    c: { t: 'from Σx and Σx²', g: R => { const n = R.int(5, 30), mu = R.int(2, 30), clean = R.bool(0.7), s = R.int(1, 9), v = clean ? s * s : R.pick([2, 3, 5, 6, 7, 8, 10, 12, 15]);
      const Sx = n * mu, Sx2 = n * (v + mu * mu);
      return E.num(`A data set has n = ${n}, Σx = ${Sx} and Σx² = ${Sx2}. Find the mean and the population ${clean ? 'standard deviation' : 'variance'}.`, [{ label: 'mean =', ans: mu }, clean ? { label: 'σ =', ans: s } : { label: 'σ² =', ans: v }],
        `Mean = ${Sx}/${n} = ${mu}. σ² = Σx²/n − x̄² = ${Sx2}/${n} − ${mu}² = ${v + mu * mu} − ${mu * mu} = ${v}${clean ? `, so σ = ${s}` : ''}.`); } },
    d: { t: 'adding to or scaling the data', g: R => { const mu = R.int(10, 80), sd = R.int(2, 15), kind = R.int(0, 4);
      const [a, b] = [[1, R.int(3, 20)], [1, -R.int(2, 9)], [R.pick([2, 3, 4, 5, 10]), 0], [R.pick([2, 3, 0.5, 1.5]), R.pick([5, 10, -4, 20])], [R.pick([-1, -2, -3]), R.pick([100, 50, 200])]][kind];
      const rule = kind === 0 ? `Every value is increased by ${b}.` : kind === 1 ? `Every value is decreased by ${-b}.` : kind === 2 ? `Every value is multiplied by ${a}.`
        : kind === 3 ? `Every value x is replaced by ${M(`${a}x${b > 0 ? '+' : ''}${b}`)}.` : `Every value x is replaced by ${M(`${b}-${a === -1 ? '' : -a}x`)}.`;
      const nm = cl(a * mu + b), ns = cl(Math.abs(a) * sd);
      return E.num(`A data set has mean ${mu} and standard deviation ${sd}. ${rule} Find the new mean and standard deviation.`, [{ label: 'new mean =', ans: nm }, { label: 'new SD =', ans: ns }],
        a === 1 ? `Adding a constant shifts every value, so the mean moves to ${nm}, but the spread is unchanged: the SD stays ${ns}.` : `The mean follows the rule: ${neg(a)} × ${mu}${b ? (b > 0 ? ' + ' + b : ' − ' + -b) : ''} = ${nm}. The SD is multiplied by ${a < 0 ? `|${neg(a)}| = ${-a}` : a}${b ? ', and adding a constant does not change spread' : ''}: ${sd} × ${Math.abs(a)} = ${ns}.`); } },
    e: { t: 'combine two groups', g: R => { let n1, n2, m1, m2, v1, v2, N, Mn;
      do { n1 = R.int(2, 12); n2 = R.int(2, 12); m1 = R.int(5, 30); m2 = R.int(5, 30); v1 = R.int(1, 25); v2 = R.int(1, 25); N = n1 + n2; Mn = (n1 * m1 + n2 * m2) / N; } while (m1 === m2 || !Number.isInteger(Mn));
      const Q = n1 * (v1 + m1 * m1) + n2 * (v2 + m2 * m2), vn = [Q - N * Mn * Mn, N];
      return E.num(`Group A: ${n1} values, mean ${m1}, population variance ${v1}. Group B: ${n2} values, mean ${m2}, population variance ${v2}. Find the mean and population variance of all ${N} values together.`, [{ label: 'mean =', ans: Mn }, { label: 'σ² =', ...fr(...vn) }],
        `Totals: Σx = ${n1 * m1} + ${n2 * m2} = ${N * Mn}, so the mean is ${Mn}. Σx² = n(σ² + mean²) for each group: ${n1 * (v1 + m1 * m1)} + ${n2 * (v2 + m2 * m2)} = ${Q}. σ² = ${Q}/${N} − ${Mn}² = ${fs(...vn)}.`); } },
    f: { t: 'fix a misrecorded value', g: R => { let n, mu, v, x, u, k, nm, Q, vn;
      do { n = R.int(5, 20); mu = R.int(10, 50); v = R.pick([4, 9, 16, 25, 36, 5, 10, 12, 20]); k = nz(R, -3, 3); x = mu + R.int(-8, 8); u = x + n * k; nm = mu + k; Q = n * (v + mu * mu) - x * x + u * u; vn = Q - n * nm * nm; }
      while ((x - mu) ** 2 > v * (n - 1) || u <= 0 || vn <= 0);
      return E.num(`A data set of ${n} values has mean ${mu} and population variance ${v}. Then one value recorded as ${x} is found to be really ${u}. Find the correct mean and population variance.`, [{ label: 'mean =', ans: nm }, { label: 'σ² =', ...fr(vn, n) }],
        `Σx = ${n * mu} − ${x} + ${u} = ${n * nm}, so the mean is ${nm}. Σx² = ${n}(${v} + ${mu}²) − ${x}² + ${u}² = ${Q}. σ² = ${Q}/${n} − ${nm}² = ${fs(vn, n)}.`); } },
  });

  /* IV.15.03 z-scores */
  const SDS = [2, 4, 5, 8, 10, 12, 15, 20];
  const zOf = (R, sd) => { let z; do z = R.pick([0.5, 1, 1.5, 2, 2.5, 0.25, 0.75, 1.25, 1.75, 3, 0.2, 0.4, 0.6, 1.2, 1.4, 1.8, 2.2]) * (R.bool() ? 1 : -1); while (!Number.isInteger(z * sd)); return z; };
  S('IV.15.03', 'z-scores', {
    a: { t: 'standardize a value', g: R => { const sd = R.pick(SDS), mu = R.int(20, 90), z = zOf(R, sd), x = mu + z * sd;
      return E.num(`A distribution has mean ${mu} and standard deviation ${sd}. Find the z-score of ${x}.`, [{ label: 'z =', ans: z }],
        `Subtract the mean first, then divide: z = (${x} − ${mu})/${sd} = ${x - mu}/${sd} = ${z}.`); } },
    b: { t: 'compare across groups', g: R => { const pair = R.pick([['math', 'science'], ['history', 'French'], ['the long jump', 'the high jump'], ['test A', 'test B'], ['reading', 'writing'], ['chemistry', 'biology']]), sw = R.bool() ? pair : [pair[1], pair[0]];
      let s1, s2, m1, m2, z1, z2; do { s1 = R.pick(SDS); s2 = R.pick(SDS); m1 = R.int(40, 80); m2 = R.int(40, 80); z1 = zOf(R, s1); z2 = zOf(R, s2); } while (Math.abs(z1 - z2) < 0.2 || m1 + z1 * s1 === m2 + z2 * s2 || m1 === m2);
      const x1 = m1 + z1 * s1, x2 = m2 + z2 * s2, best = z1 > z2 ? 0 : 1;
      return E.choiceFixed(`Jo scored ${x1} in ${sw[0]} (mean ${m1}, SD ${s1}) and ${x2} in ${sw[1]} (mean ${m2}, SD ${s2}). In which did Jo do better compared with the group?`, [sw[0], sw[1]], best,
        `Compare z-scores: ${sw[0]} z = (${x1} − ${m1})/${s1} = ${z1}; ${sw[1]} z = (${x2} − ${m2})/${s2} = ${z2}. The higher z is in ${best ? sw[1] : sw[0]}.`); } },
    c: { t: 'unusual values', g: R => { const sd = R.pick(SDS), mu = R.int(30, 90), okz = z => Number.isInteger(z * sd);
      const zu = R.pick([2.25, 2.5, 3, 2.2, 2.4, 2.6, 2.8, 3.2, 3.5, 4].filter(okz)) * (R.bool() ? 1 : -1), zs = [zu, ...R.sample([-1.75, -1.5, -1, -0.5, 0, 0.25, 0.5, 1, 1.25, 1.5, 1.8, -1.2, 0.8, -0.4, 1.6, -0.6, 0.4].filter(okz), 3)];
      const xs = zs.map(z => cl(mu + z * sd));
      return E.choice(R, `Values more than 2 standard deviations from the mean are called unusual. A distribution has mean ${mu} and SD ${sd}. Which value is unusual?`, String(xs[0]), xs.slice(1).map(String),
        `Unusual means outside ${mu - 2 * sd} to ${mu + 2 * sd}. ${xs[0]} has z = (${xs[0]} − ${mu})/${sd} = ${cl(zs[0])}, so it is unusual; the others have |z| < 2.`); } },
    d: { t: 'back to raw scores', g: R => { let sd, mu, z; do { sd = R.pick(SDS); mu = R.int(20, 90); z = zOf(R, sd); } while (mu + z * sd <= 0); const x = mu + z * sd, kind = R.pick([0, 0, 3, 3, 1, 2]);
      if (kind === 3) { const what = R.pick([['Test scores', 'score'], ['Plant heights (cm)', 'height'], ['Delivery times (min)', 'time'], ['Package weights (g)', 'weight']]);
        return E.num(`${what[0]} have mean ${mu} and standard deviation ${sd}. A ${what[1]} is ${Math.abs(z)} standard deviation${Math.abs(z) === 1 ? '' : 's'} ${z > 0 ? 'above' : 'below'} the mean. What is it?`, [{ label: what[1] + ' =', ans: x }],
          `${z > 0 ? 'Above' : 'Below'} the mean means z = ${z}. x = μ + zσ = ${mu} + (${z})(${sd}) = ${x}.`); }
      if (kind === 0) return E.num(`Scores have mean ${mu} and standard deviation ${sd}. What score has z = ${z}?`, [{ label: 'score =', ans: x }], `x = μ + zσ = ${mu} + (${z})(${sd}) = ${x}.`);
      if (kind === 1) return E.num(`A score of ${x} has z = ${z} in a group with mean ${mu}. What is the standard deviation?`, [{ label: 'σ =', ans: sd }], `z = (x − μ)/σ, so σ = (${x} − ${mu})/${z < 0 ? '(' + z + ')' : z} = ${x - mu}/${z < 0 ? '(' + z + ')' : z} = ${sd}.`);
      return E.num(`A score of ${x} has z = ${z} in a group with standard deviation ${sd}. What is the mean?`, [{ label: 'μ =', ans: mu }], `μ = x − zσ = ${x} − (${z})(${sd}) = ${mu}.`); } },
    e: { t: 'two z-scores give μ and σ', g: R => { const sd = R.pick(SDS), mu = R.int(30, 90); let z1, z2; do { z1 = zOf(R, sd); z2 = zOf(R, sd); } while (z1 === z2);
      const x1 = mu + z1 * sd, x2 = mu + z2 * sd;
      return E.num(`In a distribution, ${x1} has z-score ${z1} and ${x2} has z-score ${z2}. Find the mean and standard deviation.`, [{ label: 'μ =', ans: mu }, { label: 'σ =', ans: sd }],
        `x = μ + zσ gives ${x1} = μ + (${z1})σ and ${x2} = μ + (${z2})σ. Subtract: ${cl(x1 - x2)} = (${cl(z1 - z2)})σ, so σ = ${sd} and μ = ${mu}.`); } },
    f: { t: 'z-scores behind the scenes', g: R => { const kind = R.int(0, 2);
      if (kind === 0) { const z = zOf(R, 20), a = R.pick([2, 3, 0.5, 1.8, 10, -1, -2, -0.5, -3]), b = R.pick([5, 32, -10, 100, 50]);
        return E.num(`Kai's score has z-score ${z}. Every score in the group is then changed by the rule ${M(`y=${a === -1 ? '-' : a}x${b > 0 ? '+' : ''}${b}`)}. What is Kai's new z-score?`, [{ label: 'z =', ans: cl(Math.sign(a) * z) }],
          `The rule changes Kai's distance from the mean and the SD by the same factor |${neg(a)}|, so z keeps its size. ${a < 0 ? 'A negative multiplier flips the order, so the sign flips' : 'A positive multiplier keeps the order, so z is unchanged'}: ${cl(Math.sign(a) * z)}.`); }
      if (kind === 1) { const n = R.int(4, 60);
        return E.num(`All ${n} values in a data set are turned into z-scores using the mean and the population standard deviation. Find the sum of the z-scores and the sum of their squares.`, [{ label: 'Σz =', ans: 0 }, { label: 'Σz² =', ans: n }],
          `Σz = Σ(x − μ)/σ = 0/σ = 0. Σz² = Σ(x − μ)²/σ² = nσ²/σ² = ${n}.`); }
      const n = R.int(4, 6), m = R.int(20, 60), d = devs(R, n, 8, (d, ss) => ss % n === 0 && isSq(ss / n) && d.every(v => Number.isInteger(v * 100 / Math.sqrt(ss / n)))), sd = Math.sqrt(sum(d.map(v => v * v)) / n), z = d.map(v => cl(v / sd));
      return E.num(`A data set of ${n} values has z-scores ${list(z.slice(0, -1))} and one more. What is the missing z-score?`, [{ label: 'z =', ans: z[n - 1] }],
        `z-scores always add to 0, because the deviations do. The known ones add to ${cl(-z[n - 1])}, so the last is ${z[n - 1]}.`); } },
  });
  /* IV.15.04 Random variables */
  // k positive whole parts adding to T (probabilities in units of 1/T)
  const parts = (R, k, T) => { const cut = R.distinct(1, T - 1, k - 1).sort((a, b) => a - b); return [...cut, T].map((c, i) => c - (i ? cut[i - 1] : 0)); };
  const pdTbl = (xs, ps, lab = 'x') => tbl([[lab, ...xs], ['P(X = ' + lab + ')', ...ps.map(p => typeof p === 'number' ? String(cl(p)) : p)]]);
  const RVX = [[0, 1, 2, 3], [1, 2, 3, 4], [0, 1, 2, 3, 4], [1, 2, 3, 4, 5], [2, 4, 6, 8], [0, 5, 10], [-2, 0, 3, 5], [1, 3, 5, 7], [0, 10, 20, 50], [-5, 0, 5, 10]];
  S('IV.15.04', 'Random variables', {
    a: { t: 'a discrete distribution table', g: R => { const xs = R.pick(RVX), k = xs.length, u = parts(R, k, 20), ps = u.map(v => v / 20), kind = R.int(0, 3), i = R.int(1, k - 2);
      const q = [[`P(X = ${xs[i]})`, [i]], [`P(X ≤ ${xs[i]})`, xs.map((_, j) => j).filter(j => j <= i)], [`P(X > ${xs[i]})`, xs.map((_, j) => j).filter(j => j > i)], [`P(X ≥ ${xs[i]})`, xs.map((_, j) => j).filter(j => j >= i)]][kind];
      const ans = cl(sum(q[1].map(j => ps[j])));
      return E.num(`X has this probability distribution. Find ${q[0]}.${pdTbl(xs, ps)}`, [{ label: q[0] + ' =', ans }], kind === 0 ? `Read it straight from the table: ${ans}.` : `Add the probabilities for the x-values that fit: ${q[1].map(j => cl(ps[j])).join(' + ')} = ${ans}.`); } },
    b: { t: 'probabilities sum to 1', g: R => { const xs = R.pick(RVX), k = xs.length;
      if (R.bool(0.5)) { const u = parts(R, k, 20), ps = u.map(v => v / 20), j = R.int(0, k - 1);
        return E.num(`The table shows a probability distribution with one entry missing. Find the missing probability.${pdTbl(xs, ps.map((p, i) => i === j ? '?' : p))}`, [{ ans: ps[j] }],
          `The probabilities must add to 1: 1 − (${ps.filter((_, i) => i !== j).map(cl).join(' + ')}) = ${cl(ps[j])}.`); }
      const c = xs.map(() => R.int(1, 5)), T = sum(c), ck = c.map(v => (v === 1 ? '' : v) + 'k');
      return E.num(`X has the distribution below, where k is a constant. Find k.${pdTbl(xs, ck)}`, [{ label: 'k =', ...fr(1, T) }], `All the probabilities add to 1: ${ck.join(' + ')} = ${T}k = 1, so k = 1/${T}.`); } },
    c: { t: 'the mean E(X)', g: R => { const xs = R.pick(RVX), k = xs.length, ps = parts(R, k, R.pick([10, 20])).map((v, _, a) => v / sum(a)), mu = cl(sum(xs.map((x, i) => x * ps[i])));
      const game = xs.some(x => x < 0);
      return E.num(`${game ? 'X is the profit in dollars from one play of a game. ' : ''}Find E(X) for this distribution.${pdTbl(xs, ps)}`, [{ label: 'E(X) =', ans: mu }],
        `E(X) = Σx·P(X = x) = ${xs.map((x, i) => `${neg(x)}(${cl(ps[i])})`).join(' + ')} = ${mu}.${Number.isInteger(mu) || xs.includes(mu) ? '' : ' It need not be a value X can take.'}`); } },
    d: { t: 'the variance of X', g: R => { const xs = R.pick(RVX.filter(a => Math.max(...a.map(Math.abs)) <= 10)), k = xs.length, ps = parts(R, k, 10).map(v => v / 10);
      const mu = cl(sum(xs.map((x, i) => x * ps[i]))), ex2 = cl(sum(xs.map((x, i) => x * x * ps[i]))), v = cl(ex2 - mu * mu);
      return E.num(`Find the mean and the variance of X.${pdTbl(xs, ps)}`, [{ label: 'E(X) =', ans: mu }, { label: 'Var(X) =', ans: v }],
        `E(X) = ${mu}. E(X²) = ${xs.map((x, i) => `${x * x}(${cl(ps[i])})`).join(' + ')} = ${ex2}. Var(X) = E(X²) − [E(X)]² = ${ex2} − ${cl(mu * mu)} = ${v}.`); } },
  });

  /* IV.15.05 The binomial setting */
  const CONDS = ['each trial has just two outcomes, success or failure', 'there is a fixed number of trials, n', 'the trials are independent', 'the probability of success p is the same on every trial'];
  const NONC = ['p must equal 1/2', 'there must be at least 30 trials', 'the data must be normally distributed', 'the trials go on until the first success', 'the mean must equal the median', 'every trial must be done at the same moment', 'success must be more likely than failure'];
  const FAILS = ['a fixed number of trials', 'only two outcomes on each trial', 'independent trials with the same p', 'p must be 1/2'];
  S('IV.15.05', 'The binomial setting', {
    a: { t: 'the four conditions', g: R => { if (R.bool()) return E.choice(R, 'Which of these is one of the four conditions for a binomial setting?', R.pick(CONDS), R.sample(NONC, 3), 'The four conditions: two outcomes, a fixed n, independent trials, and the same p each time (BINS).');
      return E.choice(R, 'Which of these is NOT a condition for a binomial setting?', R.pick(NONC), R.sample(CONDS, 3), 'The four conditions are two outcomes, a fixed n, independent trials and the same p each time. Nothing else is required.'); } },
    b: { t: 'n and p', g: R => { const n = R.int(5, 40), sc = R.pick([
        [`A fair die is rolled ${n} times and X counts the sixes.`, [1, 6], 'a six has chance 1/6'],
        [`A fair coin is tossed ${n} times and X counts the heads.`, [1, 2], 'heads has chance 1/2'],
        [`A student guesses all ${n} questions on a quiz where each question has 4 choices, one right. X counts correct answers.`, [1, 4], 'each guess is right with chance 1/4'],
        [`A player who makes 70% of free throws shoots ${n} times. X counts the makes.`, [7, 10], 'p = 70% = 0.7'],
        [`${n} seeds are planted, each sprouting with probability 0.85. X counts the seeds that sprout.`, [17, 20], 'p = 0.85'],
        [`A spinner with 5 equal sectors, one red, is spun ${n} times. X counts the reds.`, [1, 5], 'red is 1 sector of 5'],
        [`A fair die is rolled ${n} times and X counts the rolls greater than 4.`, [1, 3], '5 or 6 is 2 of 6 outcomes'],
        [`${n} light bulbs are checked, each faulty with probability 0.03. X counts the faulty bulbs.`, [3, 100], 'p = 0.03'],
      ]);
      return E.num(`${sc[0]} X is binomial. What are n and p?`, [{ label: 'n =', ans: n }, { label: 'p =', frac: sc[1], form: 'any' }], `There are ${n} trials, and ${sc[2]}, so X ~ B(${n}, ${fs(...sc[1])}).`); } },
    c: { t: 'spot a binomial situation', g: R => { const n = R.int(5, 30), yes = R.bool();
      const Y = [[`A fair coin is tossed ${n} times; X = number of tails.`, 'fixed n, two outcomes, independent tosses, p = 1/2'], [`A die is rolled ${n} times; X = number of 1s.`, 'fixed n, independent rolls, p = 1/6 each time'], [`${n} cards are drawn from a deck, each replaced and shuffled before the next; X = number of hearts.`, 'with replacement, p = 1/4 on every independent draw'],
        [`A quiz has ${n} multiple-choice questions with 5 options each; a student guesses every one. X = number right.`, 'fixed n, independent guesses, p = 1/5'], [`${n} people are chosen at random from a large city where 30% ride the bus; X = number who ride the bus.`, 'a large population makes the draws nearly independent with p ≈ 0.3']];
      const N = [[`A die is rolled until a 6 appears; X = number of rolls.`, 'the number of trials is not fixed'], [`${Math.min(n, 10)} cards are drawn from a deck without replacement; X = number of aces.`, 'without replacement the chance changes after each draw, so trials are not independent'],
        [`A die is rolled ${n} times; X = the total of the numbers.`, 'X adds up scores rather than counting successes'], [`${Math.min(n, 8)} marbles are taken without replacement from a bag of 6 red and ${Math.min(n, 8) + 2} blue; X = number of red.`, 'the bag is small and the draws change p'],
        [`A basketball player shoots ${n} free throws, getting more tired and missing more with each shot; X = number made.`, 'p is not the same on every trial']];
      const [s, why] = R.pick(yes ? Y : N);
      return E.choiceFixed(`Is X binomial? ${s}`, ['Yes', 'No'], yes ? 0 : 1, yes ? `Yes: ${why}.` : `No: ${why}.`); } },
    d: { t: 'when it fails', g: R => { const n = R.int(5, 20), kind = R.int(0, 2), sc = [
        R.pick([`A die is rolled until the first 6; X = number of rolls.`, `A coin is tossed until it shows heads ${R.int(2, 4)} times; X = number of tosses.`, `Free throws are shot until the first miss; X = number of shots.`]),
        R.pick([`A die is rolled ${n} times; X = the sum of the rolls.`, `${n} students each record their favorite of 4 colors; X = the most popular color.`, `A spinner numbered 1 to 5 is spun ${n} times; X = the largest number seen.`]),
        R.pick([`${Math.min(n, 5)} cards are drawn from a deck without replacement; X = number of hearts.`, `${Math.min(n, 6)} names are picked without replacement from a hat of ${Math.min(n, 6) + 4} names, 5 of them girls; X = number of girls.`, `A player takes ${n} shots, and her chance of scoring drops after every miss; X = number of goals.`])][kind];
      return E.choice(R, `This is not a binomial setting. Which condition fails? ${sc}`, FAILS[kind], FAILS.filter((_, i) => i !== kind),
        ['The number of trials is not fixed in advance.', 'Each trial does not end in just success or failure; X is not a count of successes.', 'The chance on one trial depends on earlier trials, so the trials are not independent with a fixed p.'][kind]); } },
  });

  /* IV.15.06 Binomial probabilities */
  const Cn = (n, k) => { let r = 1; for (let i = 1; i <= k; i++) r = r * (n - k + i) / i; return Math.round(r); };
  const PF = [[1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [1, 6], [5, 6]];
  const bpf = (n, [a, b], k) => [Cn(n, k) * a ** k * (b - a) ** (n - k), b ** n];            // exact P(X = k) as [num, den]
  const bp = (n, p, k) => Cn(n, k) * p ** k * (1 - p) ** (n - k);
  const ptxt = ([a, b]) => `${a}/${b}`;
  const safe3 = v => Math.abs((v * 1000) % 1 - 0.5) > 0.03;              // not on a rounding knife-edge at 3 dp
  S('IV.15.06', 'Binomial probabilities', {
    a: { t: 'P(X = k) formula', g: R => { const n = R.int(3, 6), k = R.int(0, n), dec = R.bool(0.35);
      if (dec) { const p = R.pick([0.1, 0.2, 0.3, 0.4, 0.6, 0.7, 0.8, 0.9]), v = bp(n, p, k);
        return E.num(`X ~ B(${n}, ${p}). Find P(X = ${k}). Round to 4 decimal places.`, [{ ans: v, dp: 4 }], `P(X = ${k}) = C(${n}, ${k})${pw(`(${p})`, k)}${pw(`(${cl(1 - p)})`, n - k)} = ${Cn(n, k)} × ${cl(p ** k)} × ${cl((1 - p) ** (n - k))} ${Number.isInteger(cl(v * 1e4)) ? '=' : '≈'} ${v.toFixed(4)}.`); }
      const p = R.pick(PF), [a, b] = bpf(n, p, k);
      return E.num(`X ~ B(${n}, ${ptxt(p)}). Find P(X = ${k}) as an exact fraction.`, [fr(a, b)], `P(X = ${k}) = C(${n}, ${k})${pw(`(${ptxt(p)})`, k)}${pw(`(${p[1] - p[0]}/${p[1]})`, n - k)} = ${Cn(n, k)} × ${p[0] ** k * (p[1] - p[0]) ** (n - k)}/${b} = ${fs(a, b)}.`); } },
    b: { t: 'cumulative probabilities', g: R => { const n = R.int(3, 5), k = R.int(1, n - 1), p = R.pick(PF), terms = Array.from({ length: k + 1 }, (_, j) => bpf(n, p, j)), A = sum(terms.map(t => t[0])), B = p[1] ** n;
      return E.num(`X ~ B(${n}, ${ptxt(p)}). Find ${pp('P(X<=' + k + ')')} as an exact fraction.`, [fr(A, B)], `Add P(X = 0) through P(X = ${k}): (${terms.map(t => t[0]).join(' + ')})/${B} = ${A}/${B}${gcd(A, B) > 1 ? ' = ' + fs(A, B) : ''}.`); } },
    c: { t: 'at least and at most', g: R => { const n = R.int(3, 7), p = R.pick(PF), kind = R.int(0, 2), B = p[1] ** n, q = p[1] - p[0];
      if (kind === 0) { const A = B - q ** n; return E.num(`X ~ B(${n}, ${ptxt(p)}). Find the probability of at least one success, as an exact fraction.`, [fr(A, B)], `Use the complement: P(X ≥ 1) = 1 − P(X = 0) = 1 − (${q}/${p[1]})${sup(n)} = 1 − ${q ** n}/${B} = ${fs(A, B)}.`); }
      if (kind === 1) { const A = B - p[0] ** n; return E.num(`X ~ B(${n}, ${ptxt(p)}). Find ${pp('P(X<=' + (n - 1) + ')')} as an exact fraction.`, [fr(A, B)], `At most ${n - 1} means "not all ${n}": 1 − P(X = ${n}) = 1 − (${ptxt(p)})${sup(n)} = 1 − ${p[0] ** n}/${B} = ${fs(A, B)}.`); }
      const P0 = q ** n, P1 = n * p[0] * q ** (n - 1), A = B - P0 - P1;
      return E.num(`X ~ B(${n}, ${ptxt(p)}). Find ${pp('P(X>=2)')} as an exact fraction.`, [fr(A, B)], `1 − P(X = 0) − P(X = 1) = 1 − ${P0}/${B} − ${P1}/${B} = ${fs(A, B)}.`); } },
    d: { t: 'with technology', g: R => { let n, p, kind, k, k2, v, q;
      do { n = R.int(10, 30); p = R.pick([0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.9]); kind = R.int(0, 3); const mu = Math.round(n * p); k = Math.max(0, Math.min(n, mu + R.int(-3, 3))); k2 = Math.min(n, k + R.int(2, 5));
        const P = j => bp(n, p, j), rng = (a, b) => { let s = 0; for (let j = a; j <= b; j++) s += P(j); return s; };
        [v, q] = [[P(k), `P(X = ${k})`], [rng(0, k), `P(X ≤ ${k})`], [rng(k, n), `P(X ≥ ${k})`], [rng(k, k2), `P(${k} ≤ X ≤ ${k2})`]][kind]; } while (!safe3(v) || k === k2 && kind === 3 || v < 0.0005 || v > 0.9995);
      return E.num(`X ~ B(${n}, ${p}). Use technology to find ${q}. Round to 3 decimal places.`, [{ ans: v, dp: 3 }],
        [`binompdf(${n}, ${p}, ${k}) ≈ ${v.toFixed(3)}.`, `binomcdf(${n}, ${p}, ${k}) ≈ ${v.toFixed(3)}.`, `P(X ≥ ${k}) = 1 − P(X ≤ ${k - 1}) = 1 − binomcdf(${n}, ${p}, ${k - 1}) ≈ ${v.toFixed(3)}.`, `binomcdf(${n}, ${p}, ${k2}) − binomcdf(${n}, ${p}, ${k - 1}) ≈ ${v.toFixed(3)}.`][kind]); } },
    e: { t: 'how many trials are needed?', g: R => { let p, t, n, qn;
      do { p = R.pick([[1, 2], [1, 3], [1, 4], [1, 5], [2, 5], [3, 10], [1, 10], [2, 3], [3, 4], [1, 6]]); t = R.pick([0.5, 0.75, 0.8, 0.9, 0.95, 0.99]); const q = 1 - p[0] / p[1]; n = 1; while (1 - q ** n < t) n++; qn = q ** n; } while (n > 8 || n < 2 || Math.abs(1 - qn - t) < 0.002 || Math.abs(1 - qn / (1 - p[0] / p[1]) - t) < 0.002);
      const qq = p[1] - p[0], q1 = (qq / p[1]) ** (n - 1);
      return E.num(`Each trial succeeds with probability ${ptxt(p)}. What is the smallest number of trials n that makes P(at least one success) at least ${t}?`, [{ label: 'n =', ans: n }],
        `We need 1 − (${qq}/${p[1]})ⁿ ≥ ${t}, so (${qq}/${p[1]})ⁿ ≤ ${cl(1 - t)}. With n = ${n - 1} it is ${q1.toFixed(4)}, too big; with n = ${n} it is ${qn.toFixed(4)}. So n = ${n}.`); } },
    f: { t: 'the most likely count', g: R => { if (R.bool()) { const n = R.int(3, 15), a = R.int(0, n - 1);
        return E.num(`X ~ B(${n}, p). For what value of p is ${pp(`P(X=${a})=P(X=${a + 1})`)}?`, [{ label: 'p =', ...fr(a + 1, n + 1) }],
          `C(${n}, ${a})${pw('p', a)}${pw('(1 − p)', n - a)} = C(${n}, ${a + 1})${pw('p', a + 1)}${pw('(1 − p)', n - a - 1)}. Cancel to get ${Cn(n, a)}(1 − p) = ${Cn(n, a + 1)}p, so p = ${fs(a + 1, n + 1)}.`); }
      const n = R.int(5, 20), p = R.pick([[1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [1, 6], [3, 10], [7, 10]]);
      const w = j => BigInt(Cn(n, j)) * BigInt(p[0]) ** BigInt(j) * BigInt(p[1] - p[0]) ** BigInt(n - j); let best = 0n; for (let j = 0; j <= n; j++) if (w(j) > best) best = w(j);
      const modes = []; for (let j = 0; j <= n; j++) if (w(j) === best) modes.push(j); const np1 = (n + 1) * p[0] / p[1];
      return E.num(`X ~ B(${n}, ${ptxt(p)}). Which value of X is most likely? If two values tie, give both.`, [{ label: 'X =', set: modes.map(String) }],
        `P(X = k + 1)/P(X = k) = (${n} − k)p/((k + 1)(1 − p)) is at least 1 while k + 1 ≤ (n + 1)p = ${fs((n + 1) * p[0], p[1])}. ${modes.length === 2 ? `That is a whole number, so ${modes[0]} and ${modes[1]} tie.` : `So the probabilities rise up to k = ${modes[0]} and then fall.`}`); } },
  });
  /* IV.15.07 Binomial mean & spread */
  const PD = [0.1, 0.2, 0.25, 0.3, 0.4, 0.5, 0.6, 0.7, 0.75, 0.8, 0.9];
  const SQB = []; for (let n = 4; n <= 400; n++) for (const p of PD) { const v = cl(n * p * (1 - p)); if (isSq(v) && v > 0) SQB.push([n, p, Math.sqrt(v)]); }   // np(1−p) a perfect square
  S('IV.15.07', 'Binomial mean & spread', {
    a: { t: 'np', g: R => { const n = R.int(8, 200), p = R.pick(PD.concat([0.05, 0.15, 0.35, 0.45, 0.65])), mu = cl(n * p), ctx = R.int(0, 2);
      const pr = [`X ~ B(${n}, ${p}). What is the mean of X?`, `A trial with success probability ${p} is repeated ${n} times. What is the expected number of successes?`, `${n} people are surveyed; each says yes with probability ${p}. What is the expected number of yeses?`][ctx];
      return E.num(pr, [{ label: 'μ =', ans: mu }], `μ = np = ${n} × ${p} = ${mu}.`); } },
    b: { t: '√(np(1 − p))', g: R => { if (R.bool(0.6)) { const [n, p, s] = R.pick(SQB);
        return E.num(`X ~ B(${n}, ${p}). Find the standard deviation of X.`, [{ label: 'σ =', ans: s }], `σ = √(np(1 − p)) = √(${n} × ${p} × ${cl(1 - p)}) = √${s * s} = ${s}. Take the square root at the end.`); }
      const n = R.int(10, 150), p = R.pick(PD), v = cl(n * p * (1 - p)), s = Math.sqrt(v);
      return E.num(`X ~ B(${n}, ${p}). Find the standard deviation of X. Round to 2 decimal places.`, [{ label: 'σ =', ans: s, dp: 2 }], `σ = √(np(1 − p)) = √(${n} × ${p} × ${cl(1 - p)}) = √${v} ≈ ${s.toFixed(2)}.`); } },
    c: { t: 'interpret them', g: R => { if (R.bool(0.5)) { const [n, p, s] = R.pick(SQB.filter(([n, p, s]) => Number.isInteger(n * p) && n <= 200 && n * p - 3 * s - 1 >= 0 && n * p + 3 * s + 1 <= n)), mu = cl(n * p), unusual = R.bool();
        let k; do k = unusual ? mu + (R.bool() ? 1 : -1) * R.int(2 * s + 1, 3 * s + 1) : mu + R.int(-2 * s + 1, 2 * s - 1); while (k < 0 || k > n);
        return E.choiceFixed(`X ~ B(${n}, ${p}), so μ = ${mu} and σ = ${s}. Would getting ${k} successes be unusual (more than 2σ from the mean)?`, ['Yes', 'No'], unusual ? 0 : 1,
          `The usual range is μ ± 2σ = ${mu - 2 * s} to ${mu + 2 * s}. ${k} is ${unusual ? 'outside it, so it is unusual' : 'inside it, so it is not unusual'}.`); }
      const n = R.pick([20, 40, 50, 60, 80, 100, 120, 200]), p = R.pick([0.1, 0.2, 0.25, 0.3, 0.4, 0.5, 0.6]), mu = cl(n * p), what = R.pick(['heads', 'defective parts', 'people who say yes', 'free throws made', 'seeds that sprout']);
      return E.choice(R, `X counts ${what} in ${n} trials, with p = ${p}, so μ = np = ${mu}. What does μ = ${mu} mean?`, `Over many repeats of the ${n} trials, the average count is about ${mu}.`,
        [`Every set of ${n} trials gives exactly ${mu}.`, `${mu} is the largest count possible.`, `The chance of getting ${mu} is 50%.`], `The mean is a long-run average; single results vary around it.`); } },
    d: { t: 'the shape of the distribution', g: R => { const kind = R.int(0, 2), n = R.int(5, 30), p = kind === 1 ? 0.5 : kind === 0 ? R.pick([0.05, 0.1, 0.15, 0.2, 0.25, 0.3]) : R.pick([0.7, 0.75, 0.8, 0.85, 0.9, 0.95]);
      return E.choiceFixed(`What is the shape of the distribution of X ~ B(${n}, ${p})?`, ['skewed right', 'symmetric', 'skewed left'], kind,
        [`p = ${p} is below 0.5, so most of the probability sits at low counts with a tail to the right.`, 'p = 0.5 makes the distribution a mirror image about n/2.', `p = ${p} is above 0.5, so most of the probability sits at high counts with a tail to the left.`][kind]); } },
    e: { t: 'find n and p from μ and σ²', g: R => { let n, p, mu, v; do { n = R.int(5, 200); p = R.pick([0.1, 0.2, 0.25, 0.3, 0.4, 0.5, 0.6, 0.7, 0.75, 0.8, 0.9]); mu = cl(n * p); v = cl(n * p * (1 - p)); } while (!dec3(v));
      return E.num(`X is binomial with mean ${mu} and variance ${v}. Find n and p.`, [{ label: 'n =', ans: n }, { label: 'p =', ans: p }],
        `Divide: np(1 − p)/np = 1 − p = ${v}/${mu} = ${cl(1 - p)}, so p = ${p}. Then n = ${mu}/${p} = ${n}.`); } },
    f: { t: 'mean of X²', g: R => { let n, p, mu, v; do { n = R.int(4, 60); p = R.pick([0.1, 0.2, 0.25, 0.4, 0.5, 0.6, 0.75, 0.8]); mu = cl(n * p); v = cl(n * p * (1 - p)); } while (!dec3(v));
      const m2 = cl(v + mu * mu);
      if (R.bool()) return E.num(`X ~ B(${n}, ${p}). Find ${M('E(X^2)')}.`, [{ ans: m2 }], `Rearrange Var(X) = E(X²) − μ²: E(X²) = np(1 − p) + (np)² = ${v} + ${mu}² = ${m2}.`);
      return E.num(`X is binomial with E(X) = ${mu} and ${M('E(X^2)=' + m2)}. Find n and p.`, [{ label: 'n =', ans: n }, { label: 'p =', ans: p }],
        `Var(X) = ${m2} − ${mu}² = ${v}. Then 1 − p = ${v}/${mu} = ${cl(1 - p)}, so p = ${p} and n = ${mu}/${p} = ${n}.`); } },
  });

  /* IV.15.08 The normal distribution */
  const bell = (mu, sd, o = {}) => V.graph({ x: [mu - 4 * sd, mu + 4 * sd], y: [0, 1.15], w: 320, h: 170, ticks: sd, yticks: 10, fns: [{ f: x => Math.exp(-(((x - mu) / sd) ** 2) / 2), color: C.blue }],
    shade: o.shade ? { f: x => Math.exp(-(((x - mu) / sd) ** 2) / 2), from: Math.max(mu - 4 * sd, o.shade[0]), to: Math.min(mu + 4 * sd, o.shade[1]) } : undefined, label: 'normal curve' });
  const BAND = [0.15, 2.35, 13.5, 34, 34, 13.5, 2.35, 0.15];                 // % in (−∞,−3σ), (−3σ,−2σ), … (3σ,∞)
  const pctBetween = (a, b) => cl(sum(BAND.slice(a + 4, b + 4)));              // a, b in −4..4 (±4 = ±∞)
  const NSD = [2, 3, 4, 5, 6, 8, 10, 12, 15, 20];
  S('IV.15.08', 'The normal distribution', {
    a: { t: 'the bell curve', g: R => { const kind = R.int(0, 2), sd = R.pick(NSD), mu = sd * R.int(3, 12);
      if (kind === 0) return E.num(`The graph shows a normal distribution. What is its mean?`, [{ label: 'μ =', ans: mu }], `A normal curve peaks at its mean, which is also the median and the mode: μ = ${mu}.`, { visual: bell(mu, sd) });
      if (kind === 1) return E.num(`X ~ N(${mu}, ${sd * sd}). A normal curve changes from bending down to bending up (its inflection points) one standard deviation from the mean. Where are they?`, [{ label: 'x =', set: [String(mu - sd), String(mu + sd)] }],
        `σ = √${sd * sd} = ${sd}, so the inflection points are at ${mu} ± ${sd}: ${mu - sd} and ${mu + sd}.`);
      const F = [['In a normal distribution, the mean, median and mode are…', 'all equal', ['mean > median > mode', 'mode > median > mean', 'unrelated'], 'The curve is symmetric with one peak, so all three sit in the middle.'],
        ['The total area under a normal curve is…', '1', ['0.5', '100', 'it depends on σ'], 'It is a probability distribution, so the whole area is 1 (100%).'],
        ['Making σ larger (keeping μ fixed) makes the normal curve…', 'wider and flatter', ['narrower and taller', 'slide to the right', 'lose its symmetry'], 'More spread means the same area of 1 is stretched wider, so the peak drops.'],
        ['Making μ larger (keeping σ fixed) makes the normal curve…', 'slide to the right', ['wider and flatter', 'narrower and taller', 'skewed right'], 'μ is the center; the shape depends only on σ.'],
        ['A normal curve is symmetric about…', 'its mean', ['the y-axis', 'x = 1', 'one standard deviation'], 'The mean is the line of symmetry.'],
        ['The tails of a normal curve…', 'get closer and closer to the x-axis but never touch it', ['touch the x-axis at μ ± 3σ', 'rise again after 3σ', 'stop at the smallest and largest data values'], 'Every value has some tiny probability density, so the curve never reaches 0.']];
      const [q, r, w, why] = R.pick(F); return E.choice(R, q, r, w, why); } },
    b: { t: 'the 68–95–99.7 rule', g: R => { const sd = R.pick(NSD), mu = sd * R.int(4, 15), kind = R.int(0, 2); let a, b;
      if (kind === 0) { do { a = R.int(-3, 2); b = R.int(a + 1, 3); } while (a === -b && R.bool(0.4)); } else if (kind === 1) { a = R.int(-3, 3); b = 4; } else { a = -4; b = R.int(-3, 3); }
      const pc = pctBetween(a, b), v = k => mu + k * sd, q = kind === 0 ? `between ${v(a)} and ${v(b)}` : kind === 1 ? `above ${v(a)}` : `below ${v(b)}`;
      return E.num(`X is normal with mean ${mu} and standard deviation ${sd}. Using the 68–95–99.7 rule, what percent of values lie ${q}?`, [{ label: 'percent =', ans: pc }],
        `In standard deviations that is ${kind === 0 ? `from z = ${a} to z = ${b}` : kind === 1 ? `above z = ${a}` : `below z = ${b}`}. The rule splits the curve into 34, 13.5, 2.35 and 0.15 percent on each side, which add to ${pc}%.`, { visual: bell(mu, sd, { shade: [a === -4 ? -1e9 : v(a), b === 4 ? 1e9 : v(b)] }) }); } },
    c: { t: 'mean and standard deviation', g: R => { const sd = R.pick(NSD), mu = R.int(10, 150), kind = R.int(0, 2);
      if (kind === 0) return E.num(`X ~ N(${mu}, ${sd * sd}). What are the mean and standard deviation of X?`, [{ label: 'μ =', ans: mu }, { label: 'σ =', ans: sd }], `In N(μ, σ²) the second number is the variance: σ² = ${sd * sd}, so σ = ${sd}, not ${sd * sd}.`);
      const k = kind === 1 ? 2 : 1, pc = kind === 1 ? 95 : 68;
      return E.num(`For a normal distribution, the middle ${pc}% of values lie between ${mu - k * sd} and ${mu + k * sd}. Find the mean and standard deviation.`, [{ label: 'μ =', ans: mu }, { label: 'σ =', ans: sd }],
        `The mean is halfway: (${mu - k * sd} + ${mu + k * sd})/2 = ${mu}. The middle ${pc}% spans ${k * 2} standard deviations, so σ = ${2 * k * sd}/${2 * k} = ${sd}.`); } },
    d: { t: 'is it roughly normal?', g: R => { const yes = R.bool(), kind = R.int(0, 2), sd = R.pick([4, 5, 8, 10, 12, 15]), mu = sd * R.int(5, 10);
      if (kind === 0) { const [p1, p2] = yes ? [R.int(66, 70), R.pick([94, 95, 96])] : R.pick([[R.int(50, 58), R.int(97, 100)], [R.int(80, 88), R.int(89, 92)], [R.int(58, 62), R.int(84, 88)]]);
        return E.choiceFixed(`In a large data set, ${p1}% of values are within 1 SD of the mean and ${p2}% are within 2 SD. Is a normal model reasonable?`, ['Yes', 'No'], yes ? 0 : 1,
          yes ? `${p1}% and ${p2}% are close to the 68% and 95% a normal model predicts.` : `A normal model predicts about 68% and 95%; ${p1}% and ${p2}% are too far off.`); }
      if (kind === 1) { const what = R.pick(['Waiting times (in minutes)', 'Numbers of phone calls per day', 'Amounts spent (in dollars)', 'Daily minutes of homework', 'Commute distances (in km)']), m = yes ? R.int(40, 80) : R.int(8, 20), s = yes ? R.int(3, Math.floor(m / 4)) : R.int(m, 2 * m);
        return E.choiceFixed(`${what} for a large group have mean ${m} and standard deviation ${s}. The values can never be negative. Is a normal model reasonable?`, ['Yes', 'No'], yes ? 0 : 1,
          yes ? `0 is ${cl(m / s).toFixed(1)} SDs below the mean, far in the tail, so the no-negatives limit doesn't spoil a normal shape.` : `0 is only ${cl(m / s).toFixed(1)} SD below the mean, so a normal model would put at least 16% of values below 0, which is impossible here; the data must be skewed right.`); }
      const med = mu, mean = yes ? mu + R.pick([-1, 0, 1]) * 0.5 : mu + R.pick([-1, 1]) * R.int(Math.ceil(sd * 0.6), sd);
      return E.choiceFixed(`A histogram of a large data set is single-peaked. The mean is ${mean}, the median is ${med} and the SD is ${sd}. Is a normal model reasonable?`, ['Yes', 'No'], yes ? 0 : 1,
        yes ? `The mean and median are almost equal, as in a symmetric normal distribution.` : `The mean is ${Math.abs(mean - med)} away from the median, over half an SD; that signals skew${mean > med ? ' to the right' : ' to the left'}, not a normal shape.`); } },
    e: { t: 'run the rule backwards', g: R => { const sd = R.pick(NSD), mu = sd * R.int(4, 15), up = [[1, 16], [2, 2.5], [3, 0.15], [-1, 84], [-2, 97.5], [0, 50]];
      let A, B; do { A = R.pick(up); B = R.pick(up); } while (A[0] === B[0]);
      const st = ([k, p], dir) => dir ? `${p}% of values lie above ${mu + k * sd}` : `${cl(100 - p)}% of values lie below ${mu + k * sd}`;
      const d1 = R.bool(), d2 = R.bool();
      return E.num(`For a normal distribution, ${st(A, d1)} and ${st(B, d2)}. Use the 68–95–99.7 rule to find the mean and standard deviation.`, [{ label: 'μ =', ans: mu }, { label: 'σ =', ans: sd }],
        `The rule places ${mu + A[0] * sd} at μ ${A[0] < 0 ? '−' : '+'} ${Math.abs(A[0])}σ and ${mu + B[0] * sd} at μ ${B[0] < 0 ? '−' : '+'} ${Math.abs(B[0])}σ. The gap ${Math.abs(A[0] - B[0]) * sd} is ${Math.abs(A[0] - B[0])}σ, so σ = ${sd} and μ = ${mu}.`.replace(/μ [+−] 0σ/g, 'μ').replace(/ 1σ/g, ' σ')); } },
    f: { t: 'conditional chances from the rule', g: R => { const kind = R.int(0, 1);
      if (kind === 0) { let a, b, c; do { a = R.int(-2, 2); b = R.int(a + 1, 4); c = R.int(-2, a); } while (c === a && b === 4);
        const num = Math.round(pctBetween(a, b) * 100), den = Math.round(pctBetween(c, 4) * 100), zt = k => k === 4 ? '∞' : k === -4 ? '−∞' : (k ? (k > 0 ? 'μ + ' : 'μ − ') + (Math.abs(k) === 1 ? '' : Math.abs(k)) + 'σ' : 'μ');
        const inner = b === 4 ? `X is above ${zt(a)}` : `X is between ${zt(a)} and ${zt(b)}`;
        return E.num(`X is normal. Given that X is above ${zt(c)}, what is the probability that ${inner}? Use the 68–95–99.7 rule and give an exact fraction.`, [fr(num, den)],
          `P(${inner.replace('X is ', '')}) = ${num / 100}% and P(X above ${zt(c)}) = ${den / 100}%. The first region lies inside the second, so the answer is ${num / 100}/${den / 100} = ${fs(num, den)}.`.replace('P(between', 'P(X between').replace('P(above', 'P(X above')); }
      const k = R.int(1, 2), m = R.int(2, 3), p = [16, 2.5][k - 1] * 100, D = 10000, both = R.bool();
      const A = both ? p ** m : D ** m - (D - p) ** m, B = D ** m;
      return E.num(`X is normal. ${E.words(m)[0].toUpperCase() + E.words(m).slice(1)} values are chosen independently. Using the 68–95–99.7 rule, what is the probability that ${both ? 'all of them are' : 'at least one of them is'} above μ + ${k === 1 ? '' : k}σ? Give an exact fraction.`, [fr(A, B)],
        `Each is above μ + ${k === 1 ? '' : k}σ with probability ${p / 100}% = ${fs(p, D)}. ${both ? `All ${m}: (${fs(p, D)})${sup(m)}` : `At least one: 1 − (1 − ${fs(p, D)})${sup(m)}`} = ${fs(A, B)}.`); } },
  });
  /* IV.15.09 Normal probabilities */
  const Phi = z => { const a = Math.abs(z), N = 2000, h = a / N; let t = 0; for (let i = 0; i <= N; i++) { const x = i * h; t += (i === 0 || i === N ? 1 : i % 2 ? 4 : 2) * Math.exp(-x * x / 2); } return 0.5 + Math.sign(z) * t * h / 3 / Math.sqrt(2 * Math.PI); };
  const invPhi = p => { let lo = -7, hi = 7; for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if (Phi(m) < p) lo = m; else hi = m; } return (lo + hi) / 2; };
  const t4 = v => v.toFixed(4), z2 = v => v.toFixed(2);
  const safe = (v, dp, mg) => Math.abs(((v * 10 ** dp) % 1 + 1) % 1 - 0.5) > mg;   // v is not near a rounding boundary at dp places
  const NS = [2, 4, 5, 10, 20, 25, 50];
  const zpick = (R, sd, lo = 0.05, hi = 2.5) => { let d; do d = R.int(-Math.round(hi * sd), Math.round(hi * sd)); while (Math.abs(d / sd) < lo); return d; };
  const ZN = [0.5, 1, 1.5, 2, 2.5, 0.25, 0.75, 1.25, 1.75, 0.2, 0.4, 0.6, 0.8, 1.2, 1.4, 1.6, 1.8, 2.2];
  S('IV.15.09', 'Normal probabilities', {
    a: { t: 'with z-scores', g: R => { let sd, mu, d, v, z, below; do { sd = R.pick(NS); mu = R.int(4, 40) * 5; d = zpick(R, sd); z = cl(d / sd); below = R.bool(); v = below ? Phi(z) : 1 - Phi(z); } while (!safe(v, 3, 0.12));
      const x = mu + d;
      return E.num(`X ~ N(${mu}, ${sd}²). Find ${below ? pp(`P(X<${x})`) : pp(`P(X>${x})`)}. Round to 3 decimal places.`, [{ ans: v, dp: 3 }],
        `z = (${x} − ${mu})/${sd} = ${z2(z)}. The table gives ${pp(`P(Z<${z2(z)})=${t4(Phi(z))}`)}${below ? '' : `, so ${pp(`P(Z>${z2(z)})=1-${t4(Phi(z))}=${t4(1 - Phi(z))}`)}`}. Answer ≈ ${v.toFixed(3)}.`); } },
    b: { t: 'between two values', g: R => { let sd, mu, d1, d2, v; do { sd = R.pick(NS); mu = R.int(4, 40) * 5; d1 = zpick(R, sd, 0.05, 2.5); d2 = zpick(R, sd, 0.05, 2.5); if (d1 > d2) [d1, d2] = [d2, d1]; v = Phi(d2 / sd) - Phi(d1 / sd); } while (d2 - d1 < sd * 0.3 || !safe(v, 3, 0.15));
      const a = mu + d1, b = mu + d2, za = cl(d1 / sd), zb = cl(d2 / sd);
      return E.num(`X ~ N(${mu}, ${sd}²). Find ${pp(`P(${a}<X<${b})`)}. Round to 3 decimal places.`, [{ ans: v, dp: 3 }],
        `z-scores: (${a} − ${mu})/${sd} = ${z2(za)} and (${b} − ${mu})/${sd} = ${z2(zb)}. Subtract the areas to the left: ${t4(Phi(zb))} − ${t4(Phi(za))} ≈ ${v.toFixed(3)}.`); } },
    c: { t: 'inverse normal: find a value', g: R => { let mu, sd, p, zr, x, kind; const PS = [0.9, 0.95, 0.975, 0.99, 0.8, 0.75, 0.1, 0.05, 0.025, 0.01, 0.2, 0.25, 0.85, 0.15];
      do { mu = R.int(20, 200); sd = R.int(2, 20); p = R.pick(PS); kind = R.int(0, 2); zr = invPhi(p); x = mu + zr * sd; } while (Math.round(mu + (Math.round(zr * 100) / 100) * sd) !== Math.round(x) || Math.round(mu + (Math.round(zr * 1000) / 1000) * sd) !== Math.round(x) || !safe(x, 0, 0.06));
      const pc = Math.round(p * 1000) / 10, q = kind === 0 ? `Find the value x with ${pp(`P(X<x)=${p}`)}.` : kind === 1 ? `Find the cutoff for the top ${cl(100 - pc)}% of values.` : `Find the cutoff for the bottom ${pc}% of values.`;
      return E.num(`X ~ N(${mu}, ${sd}²). ${q} Round to the nearest whole number.`, [{ label: 'x ≈', ans: x, dp: 0 }],
        `${kind === 1 ? `The top ${cl(100 - pc)}% means ${pc}% lie below. ` : ''}The z with area ${p} to its left is about ${z2(zr)}. Then x = μ + zσ = ${mu} + (${z2(zr)})(${sd}) ≈ ${Math.round(x)}.`); } },
    d: { t: 'with technology', g: R => { const kind = R.int(0, 2); let mu, sd, a, b, v, p, x;
      if (kind === 2) { do { mu = R.int(30, 500); sd = R.int(3, 40); p = R.int(1, 99) / 100; x = mu + invPhi(p) * sd; } while (!safe(x, 1, 0.1) || p === 0.5);
        return E.num(`X ~ N(${mu}, ${sd}²). Use technology to find x with ${pp(`P(X<x)=${p}`)}. Round to 1 decimal place.`, [{ label: 'x ≈', ans: x, dp: 1 }], `invNorm(${p}, ${mu}, ${sd}) ≈ ${x.toFixed(1)}.`); }
      do { mu = R.int(30, 500); sd = R.int(3, 40); a = mu + R.int(-2 * sd, 2 * sd); b = a + R.int(1, 2 * sd); v = kind === 0 ? Phi((b - mu) / sd) - Phi((a - mu) / sd) : 1 - Phi((a - mu) / sd); } while (!safe(v, 3, 0.05) || v < 0.001 || v > 0.999);
      return E.num(`X ~ N(${mu}, ${sd}²). Use technology to find ${kind === 0 ? pp(`P(${a}<X<${b})`) : pp(`P(X>${a})`)}. Round to 3 decimal places.`, [{ ans: v, dp: 3 }],
        `normalcdf(${kind === 0 ? a + ', ' + b : a + ', 10^99'}, ${mu}, ${sd}) ≈ ${v.toFixed(3)}.`); } },
  });

  /* IV.15.10 Scatter plots & correlation */
  const corr = P => { const n = P.length, mx = sum(P.map(p => p[0])) / n, my = sum(P.map(p => p[1])) / n; let sxy = 0, sxx = 0, syy = 0; for (const [x, y] of P) { sxy += (x - mx) * (y - my); sxx += (x - mx) ** 2; syy += (y - my) ** 2; } return sxy / Math.sqrt(sxx * syy); };
  const noise = R => (R.int(0, 1000) + R.int(0, 1000) + R.int(0, 1000)) / 1500 - 1;
  // n points on y = 6 + b(x − 5.5) + c(x − 5.5)² + s·noise, kept inside the window
  const cloud = (R, n, b, s, c = 0) => Array.from({ length: n }, () => { const x = R.int(5, 105) / 10; let y = 6 + b * (x - 5.5) + c * (x - 5.5) ** 2 + s * noise(R) * 2.2; y = Math.max(0.4, Math.min(11.6, y)); return [x, Math.round(y * 10) / 10]; });
  const scat = (P, lab) => V.graph({ x: [0, 11], y: [0, 12], w: 260, h: 240, ticks: 2, points: P.map(([x, y], i) => [x, y, lab && i === P.length - 1 ? lab : undefined]), label: 'scatter plot' });
  const gen = (R, ok, make) => { for (let t = 0; t < 5000; t++) { const P = make(); const r = corr(P); if (isFinite(r) && ok(r, P)) return [P, r]; } throw new Error('scatter: no data'); };
  S('IV.15.10', 'Scatter plots & correlation', {
    a: { t: 'direction, form and strength', g: R => { const kind = R.int(0, 2), n = R.int(12, 18);
      if (kind === 0) { const ans = R.int(0, 2), b = [0.8, -0.8, 0][ans] * R.pick([0.7, 1, 1.2]), s = ans === 2 ? 2.5 : R.pick([0.6, 1, 1.4]);
        const [P] = gen(R, r => ans === 0 ? r > 0.6 : ans === 1 ? r < -0.6 : Math.abs(r) < 0.12, () => cloud(R, n, b, s));
        return E.choiceFixed('Describe the direction of the association in this scatter plot.', ['positive', 'negative', 'no association'], ans, ['As x increases, y tends to increase: positive.', 'As x increases, y tends to decrease: negative.', 'The points show no upward or downward trend.'][ans], { visual: scat(P) }); }
      if (kind === 1) { const curved = R.bool(), up = R.bool() ? 1 : -1;
        const [P] = gen(R, (r, P) => curved ? Math.abs(r) < 0.5 : Math.abs(r) > 0.9, () => curved ? cloud(R, n, R.pick([-0.3, 0, 0.3]), 0.3, up * R.pick([0.3, 0.35, 0.4])).map(([x, y]) => [x, up > 0 ? Math.max(0.4, y - 3.5) : Math.min(11.6, y + 3.5)]) : cloud(R, n, up * R.pick([0.7, 0.9, 1.1]), 0.5));
        return E.choiceFixed('Is the form of this scatter plot linear or curved?', ['linear', 'curved'], curved ? 1 : 0, curved ? 'The points bend: they follow a curve, not a straight line.' : 'The points cluster around a straight line.', { visual: scat(P) }); }
      const strong = R.bool(), sg = R.bool() ? 1 : -1;
      const [P, r] = gen(R, r => strong ? Math.abs(r) > 0.92 : Math.abs(r) > 0.3 && Math.abs(r) < 0.6, () => cloud(R, n, sg * R.pick([0.6, 0.8, 1]), strong ? 0.5 : 2.4));
      return E.choiceFixed('Is the linear association in this scatter plot strong or weak?', ['strong', 'weak'], strong ? 0 : 1, strong ? `The points lie close to a line (r ≈ ${r.toFixed(2)}).` : `The points are widely scattered around the trend (r ≈ ${r.toFixed(2)}).`, { visual: scat(P) }); } },
    b: { t: 'the correlation coefficient r', g: R => { if (R.bool(0.6)) { const T = [-0.9, -0.5, 0, 0.5, 0.9], i = R.int(0, 4), n = R.int(14, 20), tgt = T[i];
        const [P, r] = gen(R, r => Math.abs(r - tgt) < 0.07, () => cloud(R, n, tgt === 0 ? 0 : Math.sign(tgt) * R.pick([0.6, 0.8, 1]), Math.abs(tgt) === 0.9 ? 1 : Math.abs(tgt) === 0.5 ? 2.6 : 2.5));
        return E.choiceFixed('Which value of r best fits this scatter plot?', T.map(neg), i, `${tgt === 0 ? 'There is no linear trend' : `The trend is ${tgt > 0 ? 'upward' : 'downward'} and ${Math.abs(tgt) > 0.7 ? 'tight' : 'loose'}`}; the actual r is about ${neg(r.toFixed(2))}.`, { visual: scat(P) }); }
      const v = R.pick([0.3, 0.45, 0.6, 0.72, 0.85, 0.91]), w = R.pick([0.2, 0.4, 0.55, 0.8]);
      const TS = [[`r is always between −1 and 1.`, 'It is a standardized measure, so −1 ≤ r ≤ 1.'], [`r = −${v} shows a stronger linear relationship than r = ${cl(v - 0.1)}.`, 'Strength is the size |r|; the sign only gives direction.'], ['r = 0 means there is no linear relationship.', 'r measures only straight-line association.'], ['A strong curved pattern can have r close to 0.', 'r only measures linear association, so a U-shape can give r ≈ 0.'], ['Changing heights from cm to inches does not change r.', 'r has no units, so linear changes of units leave it unchanged.'], ['Swapping which variable is x and which is y leaves r unchanged.', 'The formula for r treats x and y the same way.']];
      const FS = [[`r = ${w} shows a stronger relationship than r = −${cl(w + 0.1)}.`, `Strength is |r|: ${cl(w + 0.1)} > ${w}.`], ['r = 1 means that y = x.', 'r = 1 means the points lie exactly on some line with positive slope, not necessarily y = x.'], ['Changing heights from cm to inches changes r.', 'r has no units, so it does not change.'], ['r can be 1.5 if the relationship is very strong.', 'r is always between −1 and 1.'], ['r = 0 means there is no relationship of any kind.', 'r only detects linear association; a curve can still be there.'], [`A negative r like −${v} means the relationship is weak.`, 'Negative gives the direction, not the strength.']];
      const tr = R.bool(), [st, why] = R.pick(tr ? TS : FS);
      return E.tf(`True or false? ${st}`, tr, `${tr ? 'True' : 'False'}. ${why}`); } },
    c: { t: 'correlation vs causation', g: R => { const SC = [['ice cream sales', 'drownings', 'hot weather'], ['shoe size', 'reading score among children aged 5 to 12', 'age'], ['the number of firefighters at a fire', 'the damage done', 'the size of the fire'], ['umbrella sales', 'car accidents', 'rainy weather'], ['heating bills', 'hot chocolate sales', 'cold weather'], ['the number of churches in a town', 'the number of bars in the town', 'the town\'s population'], ['the number of TV sets per person in a country', 'life expectancy there', 'the country\'s wealth'], ['sunscreen sales', 'sunburn cases', 'sunny weather'], ['the number of lifeguards on duty', 'the number of beach injuries', 'the number of people at the beach'], ['coffee sales at a stadium', 'the number of fans wearing jackets', 'cold weather'], ['the number of cars a family owns', 'the number of bathrooms in the family home', 'family income']];
      const [A, B, Z] = R.pick(SC);
      if (R.bool()) return E.choice(R, `Across many cases, ${A} and ${B} are strongly positively correlated. What is the best explanation?`,
        `A lurking variable, ${Z}, affects both.`, [`Increasing ${A} would increase ${B}.`, `Increasing ${B} would increase ${A}.`, 'The correlation must be a coincidence.'], `Correlation alone can't show cause; ${Z} can drive both variables.`);
      return E.choice(R, `A study finds a strong correlation between ${A} and ${B}. Which conclusion is justified?`, 'The two are associated, but a controlled experiment is needed to show cause.',
        [`Changing ${A} will change ${B}.`, `There is a cause-and-effect link from ${A} to ${B}.`, 'Correlation this strong proves causation.'], `Observational data show association only. Here ${Z} is a likely lurking variable.`); } },
    d: { t: 'outliers and influence', g: R => { const off = R.bool(), sg = R.bool() ? 1 : -1, n = R.int(10, 14); let P, r0, r1;
      for (let t = 0; t < 5000; t++) { const base = cloud(R, n, sg * R.pick([0.6, 0.8]), 0.9).map(([x, y]) => [Math.min(x, 8.5), y]);
        const extra = off ? [R.pick([1.5, 2.5, 8, 9]), 0] : [10.5, 0]; const lineY = 6 + sg * 0.7 * (extra[0] - 5.5);
        extra[1] = off ? (lineY > 6 ? R.pick([1, 1.5, 2]) : R.pick([10, 10.5, 11])) : Math.max(0.5, Math.min(11.5, lineY));
        P = [...base.map(([x, y]) => [Math.round(x * 10) / 10, y]), extra]; r1 = corr(P); r0 = corr(P.slice(0, -1));
        if ((off ? Math.abs(r0) - Math.abs(r1) : Math.abs(r1) - Math.abs(r0)) > 0.08 && Math.abs(r0) > 0.55) break; }
      const stronger = Math.abs(r0) > Math.abs(r1);
      return E.choiceFixed('If point P is removed, does the linear association become stronger or weaker?', ['stronger', 'weaker'], stronger ? 0 : 1,
        stronger ? `P is far from the trend, so it drags r toward 0: r ≈ ${neg(r1.toFixed(2))} with P and ${neg(r0.toFixed(2))} without it.` : `P lies far out but in line with the trend, so it strengthens r: r ≈ ${neg(r1.toFixed(2))} with P and only ${neg(r0.toFixed(2))} without it.`, { visual: scat(P, 'P') }); } },
  });
})(typeof window !== 'undefined' ? window : globalThis);
