/* Era IV · Unit IV.1 Equations & inequalities (IV.1.01–IV.1.05) */
(function (G) {
  const E = G.E4, V = E.V, C = E.C, M = s => E.mx(s);
  const nz = (R, lo, hi) => { let v; do v = R.int(lo, hi); while (v === 0); return v; };
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
  const lcm = (a, b) => a / gcd(a, b) * b;
  const sg = n => n < 0 ? `− ${-n}` : `+ ${n}`;
  const S = (id, name, steps) => E.skill({ id, name, steps });
  // exact decimal text for n / 10^k
  const dec = (n, k) => { if (!k) return String(n); const s = String(Math.abs(n)).padStart(k + 1, '0'); let r = s.slice(0, -k) + '.' + s.slice(-k); r = r.replace(/0+$/, '').replace(/\.$/, ''); return (n < 0 ? '-' : '') + r; };
  const dp = s => (String(s).split('.')[1] || '').length;
  // interval text from ends: lo/hi may be ±Infinity
  const ivs = (lo, hi, lc, hc) => `${lo === -Infinity ? '(-inf' : (lc ? '[' : '(') + lo}, ${hi === Infinity ? 'inf)' : hi + (hc ? ']' : ')')}`;
  const rel = (dir, cl) => dir === '<' ? (cl ? '<=' : '<') : (cl ? '>=' : '>');
  // number line picture: pieces [{lo, hi, lc, hc}] (lo/hi may be ±Infinity)
  const nline = (from, to, pieces, lab) => {
    const W = 340, H = 64, pad = 22, y = 26, X = v => pad + (v - from) / (to - from) * (W - 2 * pad);
    let b = `<line x1="${pad - 12}" y1="${y}" x2="${W - pad + 12}" y2="${y}" stroke="${C.ink}" stroke-width="1.6"/>`;
    b += `<path d="M${pad - 12} ${y} l8 -5 v10 z M${W - pad + 12} ${y} l-8 -5 v10 z" fill="${C.ink}"/>`;
    for (let v = from; v <= to; v++) { b += `<line x1="${X(v)}" y1="${y - 5}" x2="${X(v)}" y2="${y + 5}" stroke="${C.ink}" stroke-width="1.4"/>`; b += V.text(X(v), y + 20, String(v).replace('-', '−'), { size: 11, fill: C.muted }); }
    for (const p of pieces) {
      const x1 = p.lo === -Infinity ? pad - 12 : X(p.lo), x2 = p.hi === Infinity ? W - pad + 12 : X(p.hi);
      b += `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="${C.blue}" stroke-width="5"/>`;
      if (p.lo === -Infinity) b += `<path d="M${pad - 14} ${y} l11 -8 v16 z" fill="${C.blue}"/>`;
      if (p.hi === Infinity) b += `<path d="M${W - pad + 14} ${y} l-11 -8 v16 z" fill="${C.blue}"/>`;
      [[p.lo, p.lc], [p.hi, p.hc]].forEach(([v, cl]) => { if (isFinite(v)) b += `<circle cx="${X(v)}" cy="${y}" r="6" fill="${cl ? C.blue : C.paper}" stroke="${C.blue}" stroke-width="2.5"/>`; });
    }
    return V.svg(W, H, b, lab || 'number line graph');
  };
  const mulT = (k, a) => `${k === 1 ? '' : k}${a === 0 ? 'x' : '(' + E.poly([1, a]) + ')'}`;
  const cf = s => s === '1' ? '' : s;
  const absx = (p, q) => `abs(${E.poly([p, q])})`;

  /* IV.1.01 Fractions & decimals in equations */
  const DEN = [2, 3, 4, 5, 6, 8, 9, 10, 12];
  const cop = (R, lo, hi, d) => { let v; do v = nz(R, lo, hi); while (gcd(v, d) !== 1); return v; };
  const fracEq = R => { let p, q, r, L; do { p = R.pick(DEN); q = R.pick(DEN); r = R.pick(DEN); L = lcm(lcm(p, q), r); } while (L > 36 || (p === q && q === r)); const n1 = R.bool(0.6) ? 1 : cop(R, 2, 5, p), b = cop(R, -7, 7, q), c = cop(R, -11, 11, r);
    const t1 = n1 === 1 ? `x/${p}` : `${n1}x/${p}`, eq = `${t1}${b > 0 ? '+' : '-'}${Math.abs(b)}/${q}=${c}/${r}`;
    return { p, q, r, L, n1, b, c, eq, A: L / p * n1, B: L * b / q, Cc: L * c / r }; };
  const fracSol = R => { let p, q; do { p = R.pick([2, 3, 4, 5, 6]); q = R.pick([2, 3, 4, 5, 6]); } while (p === q); const x0 = R.int(-6, 9), u = R.int(-3, 5), v = R.int(-3, 5), plus = R.bool(0.6);
    const a = p * u - x0, b = q * v - x0, c = plus ? u + v : u - v, L = lcm(p, q);
    const top = k => k === 0 ? 'x' : `(${E.poly([1, k])})`, eq = `${top(a)}/${p}${plus ? '+' : '-'}${top(b)}/${q}=${c}`;
    const P = L / p, Qm = (plus ? 1 : -1) * L / q, k = P + Qm, m = P * a + Qm * b;
    return { p, q, x0, a, b, c, plus, L, eq, P, Qm, k, m }; };
  S('IV.1.01', 'Fractions & decimals in equations', {
    a: { t: 'clear fractions with the LCD', g: R => { const f = fracEq(R); const ax = E.poly([f.A, 0]), fb = `${f.b > 0 ? '+' : '-'}${Math.abs(f.b)}/${f.q}`;
      const P = s => E.pt(s), right = P(`${E.poly([f.A, f.B])}=${f.Cc}`), wrong = [P(`${ax}${fb}=${f.Cc}`), P(`${ax}${fb}=${f.c}/${f.r}`), P(`${E.poly([f.A, f.B])}=${f.c}/${f.r}`)];
      return E.choice(R, `Multiply every term of ${M(f.eq)} by the LCD. Which equation do you get?`, right, wrong, `The LCD of ${[...new Set([f.p, f.q, f.r])].join(', ').replace(/, (\d+)$/, ' and $1')} is ${f.L}. Every term gets multiplied: ${M(`${E.poly([f.A, f.B])}=${f.Cc}`)}.`); } },
    b: { t: 'clear decimals by powers of 10', g: R => { let ks, ns; do { ks = [R.int(0, 2), R.int(0, 2), R.int(0, 2)]; ns = ks.map((k, i) => { let n; do n = i === 0 ? R.int(1, 99) : nz(R, -999, 999); while (k > 0 && n % 10 === 0 || Math.abs(n) >= 10 ** (k + 1) * (i ? 5 : 1)); return n; }); } while (Math.max(...ks) === 0 || ns[0] === 10 ** ks[0]);
      const K = Math.max(...ks), P = 10 ** K, co = ns.map((n, i) => n * 10 ** (K - ks[i])), t = ns.map((n, i) => dec(n, ks[i]));
      const eq = `${t[0]}x${ns[1] > 0 ? '+' : ''}${t[1]}=${t[2]}`;
      return E.num(`To clear the decimals in ${M(eq)}, multiply every term by the smallest power of 10 that works. The result is ${M('ax+b=c')} with whole numbers.`, [{ label: 'multiply by', ans: P }, { label: 'a =', ans: co[0] }, { label: 'b =', ans: co[1] }, { label: 'c =', ans: co[2] }],
        `The most decimal places is ${K}, so multiply every term by ${P}: ${M(`${E.poly([co[0], co[1]])}=${co[2]}`)}.`); } },
    c: { t: 'solve the cleaned equation', g: R => { if (R.bool(0.6)) { const f = fracSol(R);
        return E.num(`Solve ${M(f.eq)}.`, [{ label: 'x =', ans: f.x0 }], `Multiply by ${f.L}: ${M(`${mulT(f.P, f.a)}${f.plus ? '+' : '-'}${mulT(Math.abs(f.Qm), f.b)}=${f.L * f.c}`)}, so ${M(`${E.poly([f.k, f.m])}=${f.L * f.c}`)} and x = ${f.x0}.`); }
      let m1, m2; do { m1 = R.int(1, 19); m2 = R.int(1, 19); } while (m1 === m2 || m1 % 10 === 0 && m2 % 10 === 0); const x0 = R.int(-8, 8), b1 = nz(R, -45, 45), b2 = (m1 - m2) * x0 + b1;
      const eq = `${cf(dec(m1, 1))}x${b1 > 0 ? '+' : ''}${dec(b1, 1)}=${cf(dec(m2, 1))}x${b2 ? (b2 > 0 ? '+' : '') + dec(b2, 1) : ''}`;
      return E.num(`Solve ${M(eq)}.`, [{ label: 'x =', ans: x0 }], `Multiply every term by 10: ${M(`${E.poly([m1, b1])}=${E.poly([m2, b2])}`)}. Then ${M(`${E.poly([m1 - m2, 0])}=${b2 - b1}`)}, so x = ${x0}.`); } },
    d: { t: 'check with the original', g: R => { const f = fracSol(R), ok = R.bool(0.5), w = ok ? f.x0 : f.x0 + nz(R, -3, 3);
      const v1 = E.fracStr(w + f.a, f.p), v2 = E.fracStr(w + f.b, f.q), tot = E.fracStr((w + f.a) * f.q + (f.plus ? 1 : -1) * (w + f.b) * f.p, f.p * f.q);
      return E.tf(`Mia cleared the fractions in ${M(f.eq)} and got x = ${w}. Is that a solution of the original equation?`, ok,
        `Substitute x = ${w}: ${M(`${v1}${f.plus ? '+' : '-'}${v2.startsWith('-') ? '(' + v2 + ')' : v2}=${tot}`)}${ok ? `, which equals ${f.c}. Yes.` : `, not ${f.c}. No.`}`, { choices: ['Yes', 'No'] }); } },
    e: { t: 'a parameter: no solution, or every x', g: R => { let p, q; do { p = R.int(2, 7); q = R.int(2, 7); } while (p === q);
      const k = E.fracStr(p, q), bin = (s, n) => n ? `(${s}${n > 0 ? '+' : ''}${n})` : s;
      if (R.bool()) { let a, b; do { a = nz(R, -9, 9); b = R.int(-9, 9); } while (p * b === q * a);
        const t1 = bin('kx', a), t2 = bin('x', b);
        return E.num(`For which value of k does ${M(`${t1}/${p}=${t2}/${q}`)} have no solution?`, [{ label: 'k =', exact: k }],
          `Cross-multiply: ${M(`${q}${t1}=${p}${t2}`)}, so ${M(`(${q}k-${p})x=${p * b - q * a}`)}. There is no solution when the left side is always 0 but the right side is ${p * b - q * a}, not 0: ${q}k = ${p}, so k = ${E.pt(k)}.`); }
      const u = nz(R, -3, 3), a = p * u, m = q * u, t1 = bin('kx', a);
      return E.num(`The equation ${M(`${t1}/${p}=(x+m)/${q}`)} is true for every x. Find k and m.`, [{ label: 'k =', exact: k }, { label: 'm =', ans: m }],
        `Cross-multiply: ${M(`${q}${t1}=${p}(x+m)`)}. For every x, the x-terms and the numbers must match: ${q}k = ${p} and ${q * a} = ${p}m. So k = ${E.pt(k)} and m = ${m}.`); } },
    f: { t: 'a telescoping sum', g: R => { const kind = R.int(0, 2); let n, dens, num, den, why;
      if (kind === 0) { n = R.int(4, 6); dens = [...Array(n)].map((_, i) => (i + 1) * (i + 2)); num = n; den = n + 1; why = `Each 1/(k(k + 1)) = 1/k − 1/(k + 1), so the left side telescopes to x(1 − 1/${n + 1}) = ${n}x/${n + 1}`; }
      else if (kind === 1) { n = R.int(3, 5); dens = [...Array(n)].map((_, i) => (2 * i + 1) * (2 * i + 3)); num = n; den = 2 * n + 1; why = `Each 1/((2k − 1)(2k + 1)) = ½(1/(2k − 1) − 1/(2k + 1)), so the left side telescopes to ½x(1 − 1/${2 * n + 1}) = ${n}x/${2 * n + 1}`; }
      else { n = R.int(3, 6); dens = [...Array(n)].map((_, i) => 2 ** (i + 1)); num = 2 ** n - 1; den = 2 ** n; why = `½ + ¼ + ⋯ + 1/${2 ** n} = 1 − 1/${2 ** n}, so the left side is ${num}x/${den}`; }
      const m = nz(R, kind === 2 && n > 4 ? -3 : -6, kind === 2 && n > 4 ? 3 : 6), x0 = m * den, c = m * num;
      return E.num(`Solve ${M(dens.map(d => `x/${d}`).join('+') + '=' + c)}.`, [{ label: 'x =', ans: x0 }], `${why}. So x = ${c} × ${den}/${num} = ${x0}.`); } },
  });

  /* IV.1.02 Literal equations */
  const FORM = [['P=2l+2w', 'w', '(P-2l)/2', 'subtract 2l, then divide the whole side by 2'], ['P=2l+2w', 'l', '(P-2w)/2', 'subtract 2w, then divide the whole side by 2'],
    ['A=lw', 'w', 'A/l', 'divide both sides by l'], ['A=lw', 'l', 'A/w', 'divide both sides by w'], ['d=rt', 't', 'd/r', 'divide both sides by r'], ['d=rt', 'r', 'd/t', 'divide both sides by t'],
    ['y=mx+b', 'x', '(y-b)/m', 'subtract b, then divide by m'], ['y=mx+b', 'b', 'y-mx', 'subtract mx'], ['y=mx+b', 'm', '(y-b)/x', 'subtract b, then divide by x'],
    ['A=1/2bh', 'h', '2A/b', 'multiply by 2, then divide by b'], ['A=1/2bh', 'b', '2A/h', 'multiply by 2, then divide by h'],
    ['I=Prt', 'r', 'I/(Pt)', 'divide both sides by Pt'], ['I=Prt', 't', 'I/(Pr)', 'divide both sides by Pr'], ['I=Prt', 'P', 'I/(rt)', 'divide both sides by rt'],
    ['C=2pir', 'r', 'C/(2pi)', 'divide both sides by 2π'], ['V=lwh', 'h', 'V/(lw)', 'divide both sides by lw'], ['V=lwh', 'w', 'V/(lh)', 'divide both sides by lh'],
    ['P=a+b+c', 'c', 'P-a-b', 'subtract a and b'], ['A=(a+b)h/2', 'h', '2A/(a+b)', 'multiply by 2, then divide by (a + b)'], ['S=2pirh', 'h', 'S/(2pir)', 'divide both sides by 2πr'],
    ['F=ma', 'a', 'F/m', 'divide both sides by m'], ['F=ma', 'm', 'F/a', 'divide both sides by a'], ['y=kx', 'k', 'y/x', 'divide both sides by x'], ['A=P+Prt', 'r', '(A-P)/(Pt)', 'subtract P, then divide by Pt']];
  const SCI = [['motion', 'v=u+at', 'a', '(v-u)/t', 'subtract u, then divide by t'], ['motion', 'v=u+at', 't', '(v-u)/a', 'subtract u, then divide by a'], ['motion', 'v=u+at', 'u', 'v-at', 'subtract at'],
    ['temperature', 'F=9/5C+32', 'C', '5(F-32)/9', 'subtract 32, then multiply by 5/9'], ['temperature', 'C=5/9(F-32)', 'F', '9/5C+32', 'multiply by 9/5, then add 32'],
    ['kinetic energy', 'E=1/2mv^2', 'm', '2E/v^2', 'multiply by 2, then divide by v²'], ['gas law', 'PV=nRT', 'T', 'PV/(nR)', 'divide both sides by nR'], ['gas law', 'PV=nRT', 'V', 'nRT/P', 'divide both sides by P'],
    ['gas law', 'PV=nRT', 'n', 'PV/(RT)', 'divide both sides by RT'], ['density', 'D=m/V', 'V', 'm/D', 'multiply by V, then divide by D'], ['density', 'D=m/V', 'm', 'DV', 'multiply both sides by V'],
    ["Ohm's law", 'V=IR', 'R', 'V/I', 'divide both sides by I'], ["Ohm's law", 'V=IR', 'I', 'V/R', 'divide both sides by R'], ['free fall', 'd=1/2gt^2', 'g', '2d/t^2', 'multiply by 2, then divide by t²'],
    ['work', 'W=Fd', 'd', 'W/F', 'divide both sides by F'], ['momentum', 'p=mv', 'v', 'p/m', 'divide both sides by m'], ['power', 'P=W/t', 't', 'W/P', 'multiply by t, then divide by P'],
    ['power', 'P=W/t', 'W', 'Pt', 'multiply both sides by t'], ['pressure', 'P=F/A', 'A', 'F/P', 'multiply by A, then divide by P'], ['pressure', 'P=F/A', 'F', 'PA', 'multiply both sides by A'],
    ['average speed', 's=(u+v)t/2', 't', '2s/(u+v)', 'multiply by 2, then divide by (u + v)'], ['average speed', 's=(u+v)t/2', 'v', '2s/t-u', 'multiply by 2, divide by t, then subtract u'], ['weight', 'W=mg', 'g', 'W/m', 'divide both sides by m'],
    ['electric power', 'P=I^2R', 'R', 'P/I^2', 'divide both sides by I²'], ['spring energy', 'E=1/2kx^2', 'k', '2E/x^2', 'multiply by 2, then divide by x²'],
    ['motion', 'd=vt+1/2at^2', 'a', '2(d-vt)/t^2', 'subtract vt, multiply by 2, then divide by t²'], ['motion', 'v^2=u^2+2ad', 'd', '(v^2-u^2)/(2a)', 'subtract u², then divide by 2a']];
  const SCI2 = SCI.filter(s => /then/.test(s[4]));   // two-step rearrangements, so step c climbs past a and b
  S('IV.1.02', 'Literal equations', {
    a: { t: 'solve a formula for one letter', g: R => { const [f, v, ans, how] = R.pick(FORM);
      return E.num(`Solve ${M(f)} for ${v}.`, [{ label: `${v} =`, expr: ans }], `To get ${v} alone, ${how}: ${M(v + '=' + ans)}.`); } },
    b: { t: 'treat other letters as numbers', g: R => { const L = R.pick(['a', 'k', 'm', 'p']), kind = R.int(0, 3);
      if (kind === 0) { const n = nz(R, -9, 9); let m; do m = R.int(-12, 12); while (m === n); return E.num(`Solve ${M(`${L}x${n > 0 ? '+' : ''}${n}=${m}`)} for x.`, [{ label: 'x =', expr: `${m - n}/${L}` }], `Treat ${L} like a number: subtract ${n}, then divide by ${L}. ${M(`x=${m - n}/${L}`)}.`.replace('subtract -', 'add ')); }
      if (kind === 1) { const n = R.int(2, 9), m = nz(R, -12, 12); return E.num(`Solve ${M(`${n}x=${L}x${m > 0 ? '+' : ''}${m}`)} for x.`, [{ label: 'x =', expr: `${m}/(${n}-${L})` }], `Collect the x-terms: ${M(`(${n}-${L})x=${m}`)}, then divide by ${M(`${n}-${L}`)}: ${M(`x=${m}/(${n}-${L})`)}.`); }
      if (kind === 2) { const n = R.int(2, 9), m = nz(R, -15, 15), ans = `${L}+${E.fracStr(m, n)}`.replace('+-', '-'); return E.num(`Solve ${M(`${n}(x-${L})=${m}`)} for x.`, [{ label: 'x =', expr: ans }], `Divide by ${n}, then add ${L}: ${M('x=' + ans)}.`); }
      const a0 = nz(R, -6, 6), b0 = R.pick([2, 3, 4, 5]), c0 = R.int(-12, 12), g = gcd(gcd(a0, c0), b0), a = a0 / g, b = b0 / g, c = c0 / g;
      const top = c === 0 ? E.poly([-a, 0]) : `${c}${-a > 0 ? '+' : '-'}${Math.abs(a) === 1 ? '' : Math.abs(a)}x`, ans = b === 1 ? top : `(${top})/${b}`;
      return E.num(`Solve ${M(`${E.poly([a0, 0])}+${b0}y=${c0}`)} for y.`, [{ label: 'y =', expr: ans }], `Treat x like a number: subtract ${E.pt(E.poly([a0, 0]))}, then divide by ${b0}. ${M('y=' + ans)}.`.replace('subtract −', 'add ').replace('divide by 1.', 'done.')); } },
    c: { t: 'rearrange science formulas', g: R => { const [ctx, f, v, ans, how] = R.pick(R.bool(0.75) ? SCI2 : SCI);
      return E.num(`Use the ${ctx} formula ${M(f)}. Solve it for ${v}.`, [{ label: `${v} =`, expr: ans }], `Treat the other letters as numbers and ${how}: ${M(v + '=' + ans)}.`); } },
    d: { t: 'state restrictions (no dividing by 0)', g: R => { const kind = R.int(0, 4), n = R.int(1, 9); let m; do m = nz(R, -12, 12); while (m === n); const L = R.pick(['a', 'k', 'm']);
      let eq, sol, right, wrong, why;
      if (kind === 0) { eq = `${L}x+${n}=${m}`; sol = `(${m - n})/${L}`; right = M(`${L}!=0`); wrong = [M('x!=0'), M(`${L}!=${m - n}`), M(`${L}!=${-n}`)]; why = `You divide by ${L}, so ${L} can't be 0.`; }
      else if (kind === 1) { eq = `(${L}-${n})x=${m}`; sol = `${m}/(${L}-${n})`; right = M(`${L}!=${n}`); wrong = [M(`${L}!=0`), M(`${L}!=${-n}`), M('x!=0')]; why = `You divide by ${L} − ${n}, which is 0 when ${L} = ${n}.`; }
      else if (kind === 2) { eq = `ax=bx+${n}`; sol = `${n}/(a-b)`; right = M('a!=b'); wrong = [M('a!=0'), M('b!=0'), M('a!=-b')]; why = 'You divide by a − b, which is 0 when a = b.'; }
      else if (kind === 3) { eq = `${L}(x-${n})=${m}`; sol = `${m}/${L}+${n}`; right = M(`${L}!=0`); wrong = [M(`x!=${n}`), M(`${L}!=${m}`), M(`${L}!=${n}`)]; why = `You divide by ${L} first, so ${L} can't be 0.`; }
      else { const k = R.pick([2, 3, 4, 5]); eq = `(${L}+${n})x=${k}${L}`; sol = `${k}${L}/(${L}+${n})`; right = M(`${L}!=${-n}`); wrong = [M(`${L}!=${n}`), M(`${L}!=0`), M(`x!=${k}`)]; why = `You divide by ${L} + ${n}, which is 0 when ${L} = ${-n}.`; }
      return E.choice(R, `Solving ${M(eq)} for x gives ${M('x=' + sol)}. What restriction is needed?`, right, wrong, why); } },
    e: { t: 'the letter appears twice', g: R => { const kind = R.int(0, 2), L = R.pick(['a', 'k', 'm', 'p']), lt = n => n === 0 ? L : `${L}${n > 0 ? '+' : '-'}${Math.abs(n)}`;
      if (kind === 0) { let p, q; do { p = nz(R, -9, 9); q = nz(R, -5, 5); } while (p === q);
        const ans = `(${lt(-p)})/(${lt(-q)})`;
        return E.num(`Solve ${M(`${L}x${p > 0 ? '+' : ''}${p}=${q === 1 ? '' : q === -1 ? '-' : q}x+${L}`)} for x.`, [{ label: 'x =', expr: ans }], `x appears on both sides, so collect the x-terms and factor out x: ${M(`(${lt(-q)})x=${lt(-p)}`)}. Divide: ${M('x=' + ans)}.`); }
      if (kind === 1) { const [f, v, ans, how] = R.pick([['A=P+Prt', 'P', 'A/(1+rt)', 'A = P(1 + rt)'], ['T=mg-ma', 'm', 'T/(g-a)', 'T = m(g − a)'], ['A=2lw+2lh+2wh', 'l', '(A-2wh)/(2w+2h)', 'A − 2wh = l(2w + 2h)'],
          ['E=mgh+1/2mv^2', 'm', '2E/(2gh+v^2)', '2E = m(2gh + v²)'], ['ax+b=cx+d', 'x', '(d-b)/(a-c)', 'ax − cx = d − b, so x(a − c) = d − b'], ['ax=b(x+c)', 'x', 'bc/(a-b)', 'ax − bx = bc, so x(a − b) = bc'], ['y=x+xz', 'x', 'y/(1+z)', 'y = x(1 + z)']]);
        return E.num(`Solve ${M(f)} for ${v}.`, [{ label: `${v} =`, expr: ans }], `${v} appears twice, so factor it out: ${how}. Then divide: ${M(v + '=' + ans)}.`); }
      const p = R.int(2, 6), q = nz(R, -9, 9), ans = `(${p}${L}${q > 0 ? '+' : '-'}${Math.abs(q)})/(${p}-${L})`;
      return E.num(`Solve ${M(`${p}(x-${L})=${L}x${q > 0 ? '+' : ''}${q}`)} for x.`, [{ label: 'x =', expr: ans }], `Expand: ${M(`${p}x-${p}${L}=${L}x${q > 0 ? '+' : ''}${q}`)}. Collect the x-terms and factor: ${M(`(${p}-${L})x=${p}${L}${q > 0 ? '+' : '-'}${Math.abs(q)}`)}, so ${M('x=' + ans)}.`); } },
    f: { t: 'find a ratio, not the letters', g: R => { const xy = (a, b) => `${a === 1 ? '' : a}x${b > 0 ? '+' : '-'}${Math.abs(b) === 1 ? '' : Math.abs(b)}y`, cfn = n => n === 1 ? '' : n === -1 ? '-' : String(n);
      if (R.bool(0.65)) { let a, b, c, d, k; do { a = R.int(1, 5); b = nz(R, -5, 5); c = R.int(1, 3); d = nz(R, -4, 4); k = nz(R, -3, 5); } while (k === 1 || a * d - b * c === 0 || a - k * c === 0 || k * d - b === 0);
        const top = xy(a, b), bot = xy(c, d), t = E.fracStr(k * d - b, a - k * c);
        return E.num(`If ${M(`(${top})/(${bot})=${k}`)}, find the value of ${M('x/y')}.`, [{ label: 'x/y =', exact: t }], `Multiply out: ${M(`${top}=${k}(${bot})`)}, so ${M(`${cfn(a - k * c)}x=${cfn(k * d - b)}y`)} and x/y = ${E.pt(t)}. You never need x or y themselves.`); }
      let a, d; do { a = R.int(1, 6); d = nz(R, -5, 5); } while (a === d);
      const dk = `${d > 0 ? '-' : '+'}${Math.abs(d) === 1 ? '' : Math.abs(d)}k`, ans = `(${a}${dk})/(k-1)`;
      return E.num(`If ${M(`(x+${a === 1 ? '' : a}y)/(${xy(1, d)})=k`)}, write ${M('x/y')} in terms of k.`, [{ label: 'x/y =', expr: ans }], `Multiply out: ${M(`x+${a === 1 ? '' : a}y=kx${d > 0 ? '+' : '-'}${Math.abs(d) === 1 ? '' : Math.abs(d)}ky`)}. Group: ${M(`(${a}${dk})y=(k-1)x`)}, so ${M('x/y=' + ans)}.`); } },
  });

  /* IV.1.03 Absolute value equations */
  S('IV.1.03', 'Absolute value equations', {
    a: { t: 'meaning as distance', g: R => { const a = nz(R, -9, 9); let d; do d = R.int(1, 9); while (d === a || d === -a); const lhs = absx(1, -a);
      if (R.bool()) return E.choice(R, `What does ${M(lhs + '=' + d)} mean?`, `x is ${d} units from ${a}`, [`x is ${d} units from ${-a}`, `x is ${a} units from ${d}`, `x is ${d} units from 0`], `|x − a| is the distance from x to a. Here a = ${a}, so x is ${d} units from ${a}.`);
      return E.choice(R, `On a number line, x is ${d} units from ${a}. Which equation says this?`, M(lhs + '=' + d), [M(absx(1, a) + '=' + d), M(absx(1, -d) + '=' + Math.abs(a)), M(`abs(x)=${d + Math.abs(a)}`)], `The distance from x to ${a} is ${M(lhs)}, so ${M(lhs + '=' + d)}.`); } },
    b: { t: 'split into two cases', g: R => { const p = R.pick([1, 1, 1, 2, 3, -1, 2]), q = R.int(-9, 9), d = R.int(1, 12); const s1 = E.fracStr(d - q, p), s2 = E.fracStr(-d - q, p), L = E.poly([p, q]);
      return E.num(`Solve ${M(absx(p, q) + '=' + d)}.`, [{ label: 'x =', set: [s1, s2] }], `Split: ${M(L + '=' + d)} or ${M(L + '=' + -d)}, so x = ${s1} or x = ${s2}.`); } },
    c: { t: 'isolate the absolute value first', g: R => { const k = R.int(2, 5), p = R.pick([1, 1, 2, 3]), q = R.int(-8, 8), d = R.int(1, 9), m = nz(R, -12, 12), n = k * d + m; const s1 = E.fracStr(d - q, p), s2 = E.fracStr(-d - q, p), L = E.poly([p, q]);
      return E.num(`Solve ${M(`${k}${absx(p, q)}${m > 0 ? '+' : ''}${m}=${n}`)}.`, [{ label: 'x =', set: [s1, s2] }], `Isolate first: ${M(`${k}${absx(p, q)}=${n - m}`)}, so ${M(absx(p, q) + '=' + d)}. Then ${M(L + '=' + d)} or ${M(L + '=' + -d)}: x = ${s1} or x = ${s2}.`); } },
    d: { t: 'reject impossible cases', g: R => {
      if (R.bool(0.3)) { const k = R.int(1, 4), p = R.pick([1, 2]), q = R.int(-8, 8), m = R.int(-6, 9), zero = R.bool(0.3), d = zero ? 0 : -R.int(1, 6), n = k * d + m, s = E.fracStr(-q, p);
        const eq = `${k === 1 ? '' : k}${absx(p, q)}${m ? (m > 0 ? '+' : '') + m : ''}=${n}`;
        return E.num(`Solve ${M(eq)}. Type "no solution" if there is none.`, [{ label: 'x =', set: zero ? [s] : [] }], zero ? `Isolating gives ${M(absx(p, q) + '=0')}, so there is only one case: x = ${s}.` : `Isolating gives ${M(absx(p, q) + '=' + d)}. An absolute value is never negative, so there is no solution.`); }
      let m, a, x1, c, x2; do { m = R.pick([2, 3, -2, -3, 2, 4]); a = R.int(-6, 6); x1 = R.int(-6, 6); c = x1 * (1 - m) + a; x2 = (-c - a) / (1 + m); } while (!Number.isInteger(x2) || x2 === x1 || Math.abs(c) > 20);
      const rhs = E.poly([m, c]), v1 = m * x1 + c, v2 = m * x2 + c, good = [x1, x2].filter(x => m * x + c >= 0).map(String);
      const note = v => v >= 0 ? 'keep' : 'negative, so reject';
      return E.num(`Solve ${M(absx(1, a) + '=' + rhs)}. Check each case, and type "no solution" if none work.`, [{ label: 'x =', set: good }],
        `Case ${M(E.poly([1, a]) + '=' + rhs)} gives x = ${x1}; there the right side is ${v1} (${note(v1)}). Case ${M(`${E.poly([1, a])}=-(${rhs})`)} gives x = ${x2}; the right side is ${v2} (${note(v2)}).`); } },
    e: { t: 'absolute value on both sides', g: R => { let p, r, q, s; do { p = R.pick([1, 1, 2, 3]); r = R.pick([1, 1, 2, 3]); q = R.int(-9, 9); s = R.int(-9, 9); } while ((p === r && q === s) || (p === r && R.bool(0.6)));
      const A = E.poly([p, q]), B = E.poly([r, s]), x2 = E.fracStr(-(s + q), p + r), x1 = p === r ? null : E.fracStr(s - q, p - r);
      const sol = x1 === null || E.value(x1)[0] === E.value(x2)[0] ? [x2] : [x1, x2];
      return E.num(`Solve ${M(`abs(${A})=abs(${B})`)}.`, [{ label: 'x =', set: sol }], `Equal absolute values means the insides are equal or opposite. ${M(`${A}=${B}`)} ${x1 === null ? `gives ${q} = ${s}, which is impossible` : `gives x = ${x1}`}; ${M(`${A}=-(${B})`)} gives x = ${x2}.`); } },
    f: { t: 'find all: distances and nested bars', g: R => {
      if (R.bool()) { const a = R.int(-6, 4), d = R.int(1, 8), b = a + d, big = d === 1 || R.bool(0.75), c = big ? d + R.int(1, 6) : R.int(1, d - 1);
        const eq = `${absx(1, -a)}+${absx(1, -b)}=${c}`, s1 = E.fracStr(a + b - c, 2), s2 = E.fracStr(a + b + c, 2);
        return E.num(`Solve ${M(eq)}. Type "no solution" if there is none.`, [{ label: 'x =', set: big ? [s1, s2] : [] }], big
          ? `The left side is the total distance from x to ${a} and to ${b}. Between them it is always ${d}, so x is outside: ${M(E.poly([2, -(a + b)]) + '=' + c)} gives x = ${s2}, and ${M(E.poly([-2, a + b]) + '=' + c)} gives x = ${s1}.`
          : `The left side is the total distance from x to ${a} and to ${b}. It is never less than the gap ${d}, and ${c} < ${d}, so there is no solution.`); }
      const a = R.int(-5, 5), b = R.int(1, 6), c = R.int(1, 6), inA = absx(1, -a), vals = [b + c, b - c].filter(v => v >= 0);
      const sol = [...new Set(vals.flatMap(v => v === 0 ? [a] : [a - v, a + v]))].map(String);
      return E.num(`Find all solutions of ${M(`abs(${inA}-${b})=${c}`)}.`, [{ label: 'x =', set: sol }],
        `Peel the outer bars: ${M(`${inA}-${b}=${c}`)} or ${M(`${inA}-${b}=${-c}`)}, so ${M(`${inA}=${b + c}`)} or ${M(`${inA}=${b - c}`)}. ${b - c < 0 ? 'The second is impossible. ' : b - c === 0 ? 'The second gives only x = ' + a + '. ' : ''}So x = ${sol.join(', ')}: ${sol.length} solutions.`); } },
  });

  /* IV.1.04 Compound inequalities */
  S('IV.1.04', 'Compound inequalities', {
    a: { t: '"and" as overlap', g: R => { let c1, c2, lo, hi, lc, hc;
      do { c1 = { d: R.pick(['<', '>']), v: R.int(-9, 9), cl: R.bool() }; c2 = { d: R.bool(0.65) ? (c1.d === '<' ? '>' : '<') : c1.d, v: R.int(-9, 9), cl: R.bool() };
        const gt = [c1, c2].filter(c => c.d === '>').sort((x, y) => y.v - x.v), lt = [c1, c2].filter(c => c.d === '<').sort((x, y) => x.v - y.v);
        lo = gt.length ? gt[0].v : -Infinity; lc = gt.length ? gt[0].cl : false; hi = lt.length ? lt[0].v : Infinity; hc = lt.length ? lt[0].cl : false; } while (c1.v === c2.v || !(lo < hi));
      const iv = ivs(lo, hi, lc, hc), t1 = M('x' + rel(c1.d, c1.cl) + c1.v), t2 = M('x' + rel(c2.d, c2.cl) + c2.v);
      return E.num(`Solve ${t1} and ${t2}. Answer in interval notation.`, [{ interval: iv }], `"And" keeps only the overlap, the numbers that satisfy both: ${E.pt(iv)}.`); } },
    b: { t: '"or" as union', g: R => { let c1, c2, pieces;
      do { c1 = { d: '<', v: R.int(-9, 9), cl: R.bool() }; c2 = { d: '>', v: R.int(-9, 9), cl: R.bool() }; if (R.bool(0.35)) c1.d = c2.d = R.pick(['<', '>']); } while (c1.v === c2.v || (c1.d !== c2.d && c1.v >= c2.v));
      let iv;
      if (c1.d !== c2.d) iv = `${ivs(-Infinity, c1.v, false, c1.cl)}U${ivs(c2.v, Infinity, c2.cl, false)}`;
      else if (c1.d === '<') { const w = c1.v > c2.v ? c1 : c2; iv = ivs(-Infinity, w.v, false, w.cl); } else { const w = c1.v < c2.v ? c1 : c2; iv = ivs(w.v, Infinity, w.cl, false); }
      const [f1, f2] = R.bool() ? [c1, c2] : [c2, c1];
      return E.num(`Solve ${M('x' + rel(f1.d, f1.cl) + f1.v)} or ${M('x' + rel(f2.d, f2.cl) + f2.v)}. Answer in interval notation.`, [{ interval: iv }], `"Or" keeps every number that satisfies at least one part, the union: ${E.pt(iv)}.`); } },
    c: { t: 'solve three-part inequalities', g: R => { const p = R.pick([2, 3, 4, -2, -3, 1, -1, 5]), q = R.int(-9, 9), lo = R.int(-8, 4), hi = lo + R.int(1, 7), sL = R.bool(), sR = R.bool();
      const mid = E.poly([p, q]), left = p > 0 ? p * lo + q : p * hi + q, right = p > 0 ? p * hi + q : p * lo + q;
      const loC = p > 0 ? !sL : !sR, hiC = p > 0 ? !sR : !sL, iv = ivs(lo, hi, loC, hiC);
      return E.num(`Solve ${M(`${left}${sL ? '<' : '<='}${mid}${sR ? '<' : '<='}${right}`)}. Answer in interval notation.`, [{ interval: iv }],
        `${[q ? (q > 0 ? `subtract ${q} from` : `add ${-q} to`) + ' all three parts' : '', p === 1 ? '' : p === -1 ? 'multiply by −1, flipping both signs' : `divide by ${p}${p < 0 ? ', flipping both signs' : ''}`].filter(Boolean).join(', then ').replace(/^./, ch => ch.toUpperCase())}: ${M(`${lo}${loC ? '<=' : '<'}x${hiC ? '<=' : '<'}${hi}`)}.`); } },
    d: { t: 'graph and write intervals', g: R => { const kind = R.int(0, 2); let pieces, iv;
      const a = R.int(-6, 3), b = a + R.int(2, 6), lc = R.bool(), hc = R.bool();
      if (kind === 0) { pieces = [{ lo: a, hi: b, lc, hc }]; iv = ivs(a, b, lc, hc); }
      else if (kind === 1) { pieces = [{ lo: -Infinity, hi: a, hc: lc }, { lo: b, hi: Infinity, lc: hc }]; iv = `${ivs(-Infinity, a, false, lc)}U${ivs(b, Infinity, hc, false)}`; }
      else if (R.bool()) { pieces = [{ lo: a, hi: Infinity, lc }]; iv = ivs(a, Infinity, lc, false); } else { pieces = [{ lo: -Infinity, hi: b, hc }]; iv = ivs(-Infinity, b, false, hc); }
      return E.num(R.pick(['Write the set shown on the number line in interval notation.', 'The number line shows the solution of a compound inequality. Write it in interval notation.']), [{ interval: iv }], `Filled dots are included, so use [ or ]; open dots are not, so use ( or ). Arrows run to infinity. ${E.pt(iv)}.`, { visual: nline(-8, 8, pieces, 'solution set on a number line') }); } },
  });

  /* IV.1.05 Absolute value inequalities */
  const RULER = [['the length of a bolt', 'mm', [25, 30, 40, 50], [0.2, 0.5, 0.1, 0.25]], ['an oven temperature', '°C', [180, 200, 220, 160], [5, 4, 8, 10]], ['the mass of a bag of rice', 'g', [500, 1000, 250, 750], [8, 12, 15, 5]],
    ['the diameter of a pipe', 'mm', [12, 20, 16, 8], [0.05, 0.1, 0.02, 0.15]], ['the temperature of a pool', '°C', [27, 28, 26, 25], [1.5, 0.5, 1, 2]], ['the mass of a tablet', 'mg', [200, 400, 500, 250], [6, 10, 4, 12]]];
  S('IV.1.05', 'Absolute value inequalities', {
    a: { t: 'less-than becomes "and"', g: R => { const a = nz(R, -9, 9), d = R.int(1, 9), cl = R.bool(), iv = ivs(a - d, a + d, cl, cl);
      return E.num(`Solve ${M(absx(1, -a) + (cl ? '<=' : '<') + d)}. Answer in interval notation.`, [{ interval: iv }], `Less-than means "and": ${M(`${-d}${cl ? '<=' : '<'}${E.poly([1, -a])}${cl ? '<=' : '<'}${d}`)}, so ${M(`${a - d}${cl ? '<=' : '<'}x${cl ? '<=' : '<'}${a + d}`)}.`); } },
    b: { t: 'greater-than becomes "or"', g: R => { const a = nz(R, -9, 9), d = R.int(1, 9), cl = R.bool(), iv = `${ivs(-Infinity, a - d, false, cl)}U${ivs(a + d, Infinity, cl, false)}`, L = E.poly([1, -a]);
      return E.num(`Solve ${M(absx(1, -a) + (cl ? '>=' : '>') + d)}. Answer in interval notation.`, [{ interval: iv }], `Greater-than means "or": ${M(L + (cl ? '<=' : '<') + -d)} or ${M(L + (cl ? '>=' : '>') + d)}, so ${M('x' + (cl ? '<=' : '<') + (a - d))} or ${M('x' + (cl ? '>=' : '>') + (a + d))}.`); } },
    c: { t: 'solve and graph', g: R => { const less = R.bool(), cl = R.bool(), op = less ? (cl ? '<=' : '<') : (cl ? '>=' : '>');
      if (R.bool()) { const p = R.pick([2, 3, 4, -2]), q = R.int(-9, 9), d = R.int(1, 9), k = R.pick([1, 1, 2, 3]), m = k === 1 ? 0 : nz(R, -8, 8);
        const e1 = E.fracStr(-d - q, p), e2 = E.fracStr(d - q, p), [lo, hi] = E.value(e1)[0] < E.value(e2)[0] ? [e1, e2] : [e2, e1];
        const iv = less ? ivs(lo, hi, cl, cl) : `${ivs(-Infinity, lo, false, cl)}U${ivs(hi, Infinity, cl, false)}`;
        const eq = `${k === 1 ? '' : k}${absx(p, q)}${m ? (m > 0 ? '+' : '') + m : ''}${op}${k * d + m}`;
        return E.num(`Solve ${M(eq)}. Answer in interval notation.`, [{ interval: iv }], `${k > 1 ? `Isolate: ${M(absx(p, q) + op + d)}. ` : ''}${less ? `${M(`${-d}${op}${E.poly([p, q])}${op}${d}`)}` : `${M(E.poly([p, q]) + (cl ? '<=' : '<') + -d)} or ${M(E.poly([p, q]) + op + d)}`}${p < 0 ? ' (dividing by a negative flips the signs)' : ''}, giving ${E.pt(iv)}.`); }
      const c = nz(R, -4, 4), w = R.int(1, 4), p = R.pick([1, 2, 3]), q = -p * c, d = p * w;
      const pic = (lo, hi, ls, cc) => nline(-8, 8, ls ? [{ lo, hi, lc: cc, hc: cc }] : [{ lo: -Infinity, hi: lo, hc: cc }, { lo: hi, hi: Infinity, lc: cc }], 'number line graph');
      const right = pic(c - w, c + w, less, cl), wrong = [pic(c - w, c + w, !less, cl), pic(c - w, c + w, less, !cl), pic(-c - w, -c + w, less, cl)];
      return E.choice(R, `Which graph shows the solution of ${M(absx(p, q) + op + d)}?`, right, wrong, `${p > 1 ? `Divide by ${p}: ${M(absx(1, -c) + op + w)}. ` : ''}x is ${less ? (cl ? 'at most' : 'less than') : (cl ? 'at least' : 'more than')} ${w} from ${c}, so it lies ${less ? 'between' : 'outside'} ${c - w} and ${c + w}, ${cl ? 'endpoints included' : 'endpoints not included'}.`); } },
    d: { t: 'tolerance word problems', g: R => { const [what, unit, cs, ts] = R.pick(RULER), i = R.int(0, 3), c = cs[i], t = R.pick(ts), mode = R.int(0, 2);
      const k = Math.max(dp(t), 0), P = 10 ** k, lo = dec(Math.round(c * P - t * P), k), hi = dec(Math.round(c * P + t * P), k), sp = unit.startsWith('°') ? '' : ' ';
      if (mode === 0) return E.num(`The target for ${what} is ${c}${sp}${unit}, give or take ${t}${sp}${unit}. Write the acceptable values as an interval.`, [{ interval: `[${lo}, ${hi}]` }], `${M(`abs(x-${c})<=${t}`)} means ${M(`${-t}<=x-${c}<=${t}`)}, so ${lo} ≤ x ≤ ${hi}.`);
      if (mode === 1) return E.num(`The target for ${what} is ${c}${sp}${unit}. A value x passes when ${M(`abs(x-${c})<=${t}`)}. What are the smallest and largest values that pass?`, [{ label: 'smallest =', ans: +lo }, { label: 'largest =', ans: +hi }], `${M(`${-t}<=x-${c}<=${t}`)}, so x runs from ${c} − ${t} = ${lo} to ${c} + ${t} = ${hi}.`);
      return E.num(`The acceptable values for ${what} run from ${lo} to ${hi}${sp}${unit}. Write this as ${M('abs(x-m)<=t')}.`, [{ label: 'm =', ans: c }, { label: 't =', ans: t }], `The middle is m = (${lo} + ${hi})/2 = ${c}, and the tolerance is half the width: t = ${hi} − ${c} = ${t}.`); } },
  });
})(typeof window !== 'undefined' ? window : globalThis);
