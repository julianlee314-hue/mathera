/* Era V · Unit V.7 General triangles (V.7.01–V.7.09) */
(function (G) {
  const E = G.E5, V = E.V, C = E.C, M = s => E.mx(s), K = E.K;
  // a bare " < " or " > " in plain text is escaped so it can never be read as a tag
  const esc = t => typeof t === 'string' && !t.startsWith('<svg') ? t.replace(/ < /g, ' &lt; ').replace(/ > /g, ' &gt; ') : t;
  const S = (id, name, steps) => { for (const k of Object.keys(steps)) { const g = steps[k].g; steps[k].g = (R, O) => { const q = g(R, O); q.prompt = esc(q.prompt); q.explain = esc(q.explain); if (q.choices) q.choices = q.choices.map(esc); if (q.items) q.items = q.items.map(esc); return q; }; }
    return E.skill({ id, name, steps }); };

  /* ================= helpers ================= */
  // MathML with degree signs: "sin(40°)" → sin 40°
  const DM = s => M(String(s).replace(/°/g, 'o')).replace(/<mi>o<\/mi>/g, '<mo>°</mo>');
  const rad = K.rad, dg = K.dg, sd = d => Math.sin(rad(d)), cd = d => Math.cos(rad(d));
  const asd = x => dg(Math.asin(Math.max(-1, Math.min(1, x)))), acd = x => dg(Math.acos(Math.max(-1, Math.min(1, x))));
  const n1 = x => Math.round(x * 10) / 10, f1 = x => n1(x).toFixed(1), f2 = x => (Math.round(x * 100) / 100).toFixed(2), f4 = x => x.toFixed(4);
  const edge = (x, k = 10) => { const t = x * k - Math.floor(x * k); return Math.abs(t - 0.5) < 0.15; };   // too close to a rounding edge
  const T3 = R => R.pick(['ABC', 'ABC', 'DEF', 'PQR', 'XYZ', 'RST', 'UVW', 'KMN', 'GHJ']).split('');
  const MP = L => ({ A: L[0], B: L[1], C: L[2] });
  const other = (L, k) => K.POOL.filter(x => !L.includes(x)).slice(k)[0];
  const deg = x => `${x}°`;
  const footL = L => ['H', 'D', 'N'].find(x => !L.includes(x));
  const compass = b => b < 90 ? `N ${b}° E` : b < 180 ? `S ${180 - b}° E` : b < 270 ? `S ${b - 180}° W` : `N ${360 - b}° W`;
  const sq = n => { const [k, r] = E.surd(1, n); return r === 1 ? String(k) : `${k === 1 ? '' : k}sqrt(${r})`; };
  const opp = (L, i) => [L[(i + 1) % 3], L[(i + 2) % 3]].sort().join('');      // side across from vertex i
  const U = O => (O && O.units === 'imperial') ? 'ft' : 'm';
  // triangle from angles (A, B) and a scale k: sides a = k sin A, …
  const byAng = (A, B, k = 6) => { const Cc = 180 - A - B; return { A, B, C: Cc, a: k * sd(A), b: k * sd(B), c: k * sd(Cc) }; };
  const bySide = (a, b, c) => ({ a, b, c, A: acd((b * b + c * c - a * a) / (2 * b * c)), B: acd((a * a + c * c - b * b) / (2 * a * c)), C: acd((a * a + b * b - c * c) / (2 * a * b)) });
  const minAng = (a, b, c) => { const t = bySide(a, b, c); return Math.min(t.A, t.B, t.C); };
  const rt = R => { const r = K.randTri(R); return byAng(r.A, r.B); };
  const valid3 = (a, b, c, m = 1) => a + b > c + m && a + c > b + m && b + c > a + m;
  // one triangle, drawn to scale and turned; labs keyed A,B,C (angles) and AB,BC,CA (sides)
  const triFig = (R, L, t, labs = {}, o = {}) => {
    const n = MP(L), base = K.bySides(t.a, t.b, t.c), P0 = Object.assign({}, base, o.add ? o.add(base) : {});
    const map = Object.assign({}, n, o.map || {}), P = K.renamePts(o.still ? P0 : K.spin(R, P0), map);
    const m = K.triMarks(n, o.ticks || {}, o.right ? { [o.right]: 'R' } : {}, labs);
    return K.fig({ pts: P, segs: [...m.segs, ...(o.segs || [])], angles: [...m.angles, ...(o.angles || [])], w: o.w || 260, label: o.label || 'triangle' });
  };
  // altitude from C to AB (foot H): extra figure parts
  const altOpts = (L, H, lab = 'h') => ({ add: b => ({ H: K.foot(b.C, b.A, b.B) }), map: { H }, segs: [[L[2], H, { dash: true, lab }]], angles: [[L[2], H, L[0], '', { right: true }]] });
  // nice SAS triangles: integer third side with a 60° or 120° angle
  const NICE = []; for (let p = 3; p <= 16; p++) for (let q = 3; q <= 16; q++) for (const A of [60, 120]) { if (p === q) continue; const s2 = p * p + q * q - 2 * p * q * cd(A), s = Math.round(Math.sqrt(s2)); if (Math.abs(s * s - s2) < 1e-9 && minAng(s, p, q) >= 18) NICE.push([p, q, A, s]); }
  const HERON = [[13, 14, 15, 84], [5, 5, 6, 12], [5, 5, 8, 12], [9, 10, 17, 36], [10, 13, 13, 60], [7, 15, 20, 42], [13, 20, 21, 126], [11, 13, 20, 66], [10, 17, 21, 84], [8, 15, 17, 60], [9, 12, 15, 54], [6, 8, 10, 24], [12, 16, 20, 96], [13, 13, 24, 60], [13, 13, 10, 60], [17, 17, 16, 120], [10, 10, 12, 48], [15, 15, 18, 108], [12, 17, 25, 90], [14, 25, 25, 168], [7, 24, 25, 84], [20, 21, 29, 210], [15, 26, 37, 156], [9, 40, 41, 180], [26, 28, 30, 336]];
  const pad3 = x => String(((Math.round(x) % 360) + 360) % 360).padStart(3, '0');
  const lc = L => L.map(x => x.toLowerCase());
  // interval endpoints: the core reads √3 inside an interval but not sqrt(3) as the right endpoint
  const ivs = t => t.replace(/sqrt\((\d+)\)/g, '√$1');
  const red = (n, d) => { const g = E.gcd(n, d); return [n / g, d / g]; };

  // short proofs: lines [statement, reason, deps, [3 wrong reasons], why]; mode 'order' | 'reason' | 'broken' (breaks: [{i, st|rs, why}])
  const twoCol = (rows, hide) => `<table class="dt"><tr><th>#</th><th>Statement</th><th>Reason</th></tr>${rows.map((r, i) => `<tr><td>${i + 1}</td><td>${r[0]}</td><td>${i === hide ? '<b>?</b>' : r[1]}</td></tr>`).join('')}</table>`;
  const proof = (R, mode, cfg) => {
    const L = cfg.lines, fixed = cfg.fixed ?? 1, head = cfg.head, vis = cfg.vis ? { visual: cfg.vis } : {};
    if (mode === 'order') return K.orderQ(R, `${head} Put the steps of the proof in order.`, L.map(l => `${l[0]} <i>(${l[1]})</i>`), L.map(l => l[2]), cfg.oexp, Object.assign({ fixed }, vis));
    if (mode === 'reason') { const cand = L.map((l, i) => i).filter(i => i >= fixed && L[i][3]), k = R.pick(cand), [st, rs, , wr, why] = L[k];
      return E.choice(R, `${head} What is the reason for step ${k + 1}?${twoCol(L.map(l => [l[0], l[1]]), k)}`, rs, wr, `Step ${k + 1}, ${st}, holds because ${why}.`, vis); }
    const b = R.pick(cfg.breaks), rows = L.map((l, i) => i === b.i ? [b.st || l[0], b.rs || l[1]] : [l[0], l[1]]), opts = L.map((l, i) => i).filter(i => i >= fixed);
    return E.choiceFixed(`${head} Exactly one step of this proof is wrong. Which one?${twoCol(rows, -1)}`, opts.map(i => `Step ${i + 1}`), opts.indexOf(b.i), `Step ${b.i + 1} is wrong: ${b.why}.`, vis);
  };

  /* ================= V.7.01 Law of sines ================= */
  S('V.7.01', 'Law of sines', {
    a: { t: 'the formula', g: R => {
      const L = T3(R), mode = R.int(0, 2), vis = triFig(R, L, rt(R));
      if (mode === 0) { const i = R.int(0, 2), s = opp(L, i);
        return E.choice(R, `In the law of sines for △${L.join('')}, which angle is paired with side ${s}?`, `∠${L[i]}`, [`∠${L[(i + 1) % 3]}`, `∠${L[(i + 2) % 3]}`],
          `Each side pairs with the angle across from it. ${s} does not touch ${L[i]}; it is opposite ∠${L[i]}, so the ratio is ${s}/sin ${L[i]}.`, { visual: vis }); }
      if (mode === 1) { const [i, j] = R.sample([0, 1, 2], 2), si = opp(L, i), sj = opp(L, j), a = L[i], b = L[j];
        const right = R.pick([`${si}/sin(${a})=${sj}/sin(${b})`, `sin(${a})/${si}=sin(${b})/${sj}`, `${si}sin(${b})=${sj}sin(${a})`]);
        const wrong = R.sample([`${si}/sin(${b})=${sj}/sin(${a})`, `${si}/cos(${a})=${sj}/cos(${b})`, `${si}/sin(${a})=sin(${b})/${sj}`, `${si}sin(${a})=${sj}sin(${b})`], 3);
        return E.choice(R, `Which equation is true in △${L.join('')}?`, M(right), wrong.map(M), `Each side goes with the sine of the angle opposite it: ${si} with ∠${a} and ${sj} with ∠${b}. ${E.pt(si + '/sin(' + a + ') = ' + sj + '/sin(' + b + ')')}, which cross-multiplies to ${si}·sin ${b} = ${sj}·sin ${a}.`, { visual: vis }); }
      const l = lc(L), k = R.int(0, 2), others = [0, 1, 2].filter(x => x !== k);
      return E.choice(R, `In △${L.join('')}, side ${l[0]} is opposite ∠${L[0]}, side ${l[1]} opposite ∠${L[1]} and side ${l[2]} opposite ∠${L[2]}. Complete the law of sines: ${M(`${l[others[0]]}/sin(${L[others[0]]})=${l[others[1]]}/sin(${L[others[1]]})`)} = ?`,
        M(`${l[k]}/sin(${L[k]})`), [M(`${l[k]}/sin(${L[others[0]]})`), M(`sin(${L[k]})/${l[k]}`), M(`${l[k]}/cos(${L[k]})`)], `All three ratios side/sin(opposite angle) are equal, so the third one is ${l[k]}/sin ${L[k]}.`, { visual: vis }); } },
    b: { t: 'find a side', g: R => { let A, B, a, x;
      do { A = R.int(25, 115); B = R.int(25, 115); a = R.int(5, 20); x = a * sd(B) / sd(A); } while (180 - A - B < 20 || Math.abs(A - B) < 6 || edge(x) || x > 40 || x < 2);
      const L = T3(R), t = byAng(A, B, a / sd(A)), vis = triFig(R, L, t, { A: deg(A), B: deg(B), BC: String(a), CA: 'x' });
      return E.num('Find x to 1 decimal place.', [{ label: 'x =', ans: x, dp: 1 }], `x is opposite the ${B}° angle and ${a} is opposite the ${A}° angle: ${DM(`x/sin(${B}°)=${a}/sin(${A}°)`)}, so x = ${a} sin ${B}° ÷ sin ${A}° ≈ ${f1(x)}.`, { visual: vis }); } },
    c: { t: 'find an angle', g: R => { let A, a, b, B;
      do { A = R.int(30, 120); a = R.int(6, 20); b = R.int(4, a - 1); B = asd(b * sd(A) / a); } while (B < 22 || 180 - A - B < 22 || edge(B) || Math.abs(A - B) < 6);
      const L = T3(R), t = byAng(A, B, a / sd(A)), vis = triFig(R, L, t, { A: deg(A), B: 'x', BC: String(a), CA: String(b) });
      return E.num(`Find ∠${L[1]} to 1 decimal place.`, [{ label: `∠${L[1]} =`, ans: B, dp: 1 }],
        `${DM(`sin(${L[1]})/${b}=sin(${A}°)/${a}`)}, so sin ${L[1]} = ${b} sin ${A}° ÷ ${a} ≈ ${f4(b * sd(A) / a)} and ∠${L[1]} ≈ ${f1(B)}°. It must be acute, because ${b} < ${a} puts it opposite a shorter side than the ${A}° angle.`, { visual: vis }); } },
    d: { t: 'derive it with an altitude', g: R => {
      const L = T3(R), H = footL(L), [A, B, Cc] = L, AC = [A, Cc].sort().join(''), BC = [B, Cc].sort().join(''), AB = [A, B].sort().join(''), mode = R.int(0, 2);
      let An, Bn; do { An = R.int(40, 80); Bn = R.int(40, 80); } while (180 - An - Bn < 35 || Math.abs(An - Bn) < 8);
      const t = byAng(An, Bn), vis = triFig(R, L, t, {}, Object.assign(altOpts(L, H), { label: 'triangle with an altitude' }));
      if (mode === 0) {
        const lines = [`Draw the altitude ${Cc}${H} ⟂ ${AB}, with length h.`, `In right △${A}${H}${Cc}: ${M(`sin(${A})=h/(${AC})`)}, so ${M(`h=${AC}sin(${A})`)}.`, `In right △${B}${H}${Cc}: ${M(`sin(${B})=h/(${BC})`)}, so ${M(`h=${BC}sin(${B})`)}.`,
          `Both equal h: ${M(`${AC}sin(${A})=${BC}sin(${B})`)}.`, `Divide by ${M(`sin(${A})sin(${B})`)}: ${M(`${BC}/sin(${A})=${AC}/sin(${B})`)}.`];
        return K.orderQ(R, `Put the steps of this derivation of the law of sines in order.`, lines, [[], [0], [0], [1, 2], [3]], `The altitude makes two right triangles. Each gives h in terms of a side and a sine (in either order), the two expressions are set equal, and dividing by both sines gives the law of sines.`, { visual: vis }); }
      if (mode === 1) { const useA = R.bool(), right = useA ? `${AC}sin(${A})` : `${BC}sin(${B})`;
        const wrong = useA ? [`${AC}cos(${A})`, `${AB}sin(${A})`, `${BC}sin(${A})`, `${AC}/sin(${A})`] : [`${BC}cos(${B})`, `${AB}sin(${B})`, `${AC}sin(${B})`, `${BC}/sin(${B})`];
        return E.choice(R, `${Cc}${H} is the altitude to ${AB}, with length h. Which expression equals h?`, M(right), R.sample(wrong, 3).map(M),
          `In right △${useA ? A : B}${H}${Cc}, h is opposite ∠${useA ? A : B} and the hypotenuse is ${useA ? AC : BC}, so h = ${useA ? AC : BC}·sin ${useA ? A : B}.`, { visual: vis }); }
      const side = R.int(6, 20), useA = R.bool(), ang = useA ? An : Bn, h = side * sd(ang);
      if (edge(h)) return E.num(`${Cc}${H} is the altitude to ${AB}. ∠${useA ? A : B} = ${ang}° and ${useA ? AC : BC} = ${side}. Find h = ${Cc}${H} to 2 decimal places.`, [{ label: 'h =', ans: h, dp: 2 }], `In the right triangle, h = ${useA ? AC : BC}·sin ${useA ? A : B} = ${side} sin ${ang}° ≈ ${f2(h)}.`, { visual: triFig(R, L, byAng(An, Bn, 1), useA ? { A: deg(An), CA: String(side) } : { B: deg(Bn), BC: String(side) }, altOpts(L, H)) });
      return E.num(`${Cc}${H} is the altitude to ${AB}. Find h = ${Cc}${H} to 1 decimal place.`, [{ label: 'h =', ans: h, dp: 1 }], `In the right triangle, h = ${useA ? AC : BC}·sin ${useA ? A : B} = ${side} sin ${ang}° ≈ ${f1(h)}. This is the first step of the proof of the law of sines.`,
        { visual: triFig(R, L, byAng(An, Bn, 1), useA ? { A: deg(An), CA: String(side) } : { B: deg(Bn), BC: String(side) }, altOpts(L, H)) }); } },
  });

  /* ================= V.7.02 Ambiguous case ================= */
  // the two triangles of the SSA case drawn together: A, ray, C, and the arc of radius a about C
  const ambFig = (R, L, A, a, b, labs = {}) => {
    const h = b * sd(A), AD = b * cd(A), m = Math.sqrt(a * a - h * h), B1 = L[1] + '₁', B2 = L[1] + '₂';
    const P = { [L[0]]: [0, 0], [L[2]]: K.polar(b, A), [B1]: [AD - m, 0], [B2]: [AD + m, 0], _e: [AD + m + 0.18 * b, 0] };
    const Cp = P[L[2]], t1 = Math.atan2(P[B1][1] - Cp[1], P[B1][0] - Cp[0]), t2 = Math.atan2(P[B2][1] - Cp[1], P[B2][0] - Cp[0]), lo = Math.min(t1, t2) - 0.22, hi = Math.max(t1, t2) + 0.22, arc = [];
    for (let i = 0; i <= 14; i++) { const th = lo + (hi - lo) * i / 14; P['_a' + i] = [Cp[0] + a * Math.cos(th), Cp[1] + a * Math.sin(th)]; if (i) arc.push(['_a' + (i - 1), '_a' + i, { dash: true, color: C.muted }]); }
    const Q = K.spin(R, P);
    return K.fig({ pts: Q, segs: [[L[0], '_e'], [L[0], L[2], { lab: labs.b }], [L[2], B1, { ticks: 1, lab: labs.a1, ref: L[0] }], [L[2], B2, { ticks: 1, lab: labs.a2, ref: B1 }], ...arc], angles: [[B2, L[0], L[2], labs.A || '']], w: 290, label: 'the two triangles of the ambiguous case' });
  };
  S('V.7.02', 'Ambiguous case', {
    a: { t: 'SSA setup', g: R => { const L = T3(R), mode = R.int(0, 2);
      if (mode === 0) { const [X, Y, Z] = R.shuffle(L.slice()), s = (p, q) => [p, q].sort().join('');
        const opts = { SSA: `∠${X}, ${s(Y, Z)} and ${s(X, Y)}`, SAS: `${s(X, Y)}, ∠${X} and ${s(X, Z)}`, ASA: `∠${X}, ${s(X, Y)} and ∠${Y}`, SSS: `${s(X, Y)}, ${s(Y, Z)} and ${s(X, Z)}`, AAS: `∠${X}, ∠${Y} and ${s(Y, Z)}` };
        return E.choice(R, `Which set of given parts of △${L.join('')} is the SSA case, the one that can fit two different triangles?`, opts.SSA, R.sample([opts.SAS, opts.ASA, opts.SSS, opts.AAS], 3),
          `SSA is an angle, the side opposite it, and one more side: ∠${X} with ${s(Y, Z)} (across from it) and ${s(X, Y)}. The angle is not between the two sides, so the side ${s(Y, Z)} can swing to two positions.`, { visual: triFig(R, L, rt(R)) }); }
      if (mode === 1) { let A, b, h; do { A = R.int(20, 70); b = R.int(6, 20); h = b * sd(A); } while (edge(h));
        const L2 = [L[0], L[2]].sort().join('');
        const t = byAng(A, 90, b / sd(90)), vis = triFig(R, L, { a: t.a, b: t.b, c: t.c }, { A: deg(A), CA: String(b), BC: 'h' }, { right: 'B', label: 'height from C' });
        return E.num(`In an SSA problem, ∠${L[0]} = ${A}° and ${L2} = ${b}. Find the height h from ${L[2]} to the other arm of ∠${L[0]}, to 1 decimal place.`, [{ label: 'h =', ans: h, dp: 1 }],
          `h = ${L2}·sin ${L[0]} = ${b} sin ${A}° ≈ ${f1(h)}. The side opposite ∠${L[0]} is compared with this height.`, { visual: vis }); }
      const l = lc(L);
      return E.choice(R, `In △${L.join('')}, you know ∠${L[0]}, side ${l[0]} (opposite it) and side ${l[1]}, and ∠${L[0]} is acute. To count the triangles, ${l[0]} is compared with which height?`, M(`${l[1]}sin(${L[0]})`), [M(`${l[1]}cos(${L[0]})`), M(`${l[0]}sin(${L[0]})`), M(`${l[0]}sin(${L[1]})`)],
        `The height from ${L[2]} to the other arm of ∠${L[0]} is ${l[1]}·sin ${L[0]}. If ${l[0]} is shorter, it cannot reach; if it is between that height and ${l[1]}, it reaches in two places.`); } },
    b: { t: 'zero, one or two triangles', g: R => { const k = R.int(0, 2); let A, a, b, h, why;
      for (;;) { const sub = R.int(0, 1); b = R.int(6, 20);
        if (k === 0 && sub === 0) { A = R.int(25, 70); h = b * sd(A); a = R.int(2, 25); if (a < h - 0.4) { why = `h = ${b} sin ${A}° ≈ ${f2(h)}, and ${a} < ${f2(h)}: the side is too short to reach, so no triangle.`; break; } }
        else if (k === 0) { A = R.int(95, 140); a = R.int(3, b - 1); why = `∠${'A'} is obtuse, so the side opposite it must be the longest. ${a} < ${b}, so no triangle.`; break; }
        else if (k === 1 && sub === 0) { A = R.int(25, 75); h = b * sd(A); a = R.int(b, 25); why = `${a} ≥ ${b}, so the side reaches the other arm only once (the second point is behind the vertex): one triangle.`; break; }
        else if (k === 1) { if (R.bool()) { A = 30; b = 2 * R.int(4, 10); a = b / 2; why = `h = ${b} sin 30° = ${a}, exactly the side: it just touches, making one right triangle.`; } else { A = R.int(95, 140); a = R.int(b + 1, 26); why = `∠A is obtuse and ${a} > ${b}, so there is exactly one triangle.`; } break; }
        else { A = R.int(25, 65); h = b * sd(A); a = R.int(Math.ceil(h + 0.4), b - 1); if (a > h + 0.4 && a < b) { why = `h = ${b} sin ${A}° ≈ ${f2(h)}, and ${f2(h)} < ${a} < ${b}: the side reaches the other arm in two places, so two triangles.`; break; } } }
      const L = T3(R), BC = [L[1], L[2]].sort().join(''), AC = [L[0], L[2]].sort().join('');
      return E.choiceFixed(`In △${L.join('')}, ∠${L[0]} = ${A}°, ${BC} = ${a} and ${AC} = ${b}. How many triangles fit these facts?`, ['no triangle', 'one triangle', 'two triangles'], k, why.replace(/∠A/g, '∠' + L[0])); } },
    c: { t: 'find both', g: R => { let A, a, b, B1;
      do { A = R.int(22, 60); b = R.int(7, 20); a = R.int(4, b - 1); B1 = asd(b * sd(A) / a); } while (b * sd(A) > a - 0.4 || edge(B1) || B1 < 20 || B1 - A < 8 || B1 > 82);
      const L = T3(R), BC = [L[1], L[2]].sort().join(''), AC = [L[0], L[2]].sort().join(''), askC = R.bool(0.35);
      const pre = `In △${L.join('')}, ∠${L[0]} = ${A}°, ${BC} = ${a} and ${AC} = ${b}.`, s = `sin ${L[1]} = ${b} sin ${A}° ÷ ${a} ≈ ${f4(b * sd(A) / a)}, so ∠${L[1]} ≈ ${f1(B1)}° or 180° − ${f1(B1)}° = ${f1(180 - B1)}°. Both fit, because ${A}° + ${f1(180 - B1)}° < 180°.`;
      if (askC) return E.num(`${pre} Find both possible values of ∠${L[2]}, to 1 decimal place.`, [{ label: `larger ∠${L[2]} =`, ans: 180 - A - B1, dp: 1 }, { label: `smaller ∠${L[2]} =`, ans: B1 - A, dp: 1 }], `${s} Then ∠${L[2]} = 180° − ${A}° − ∠${L[1]}: ${f1(180 - A - B1)}° or ${f1(B1 - A)}°.`);
      return E.num(`${pre} Find both possible values of ∠${L[1]}, to 1 decimal place.`, [{ label: `acute ∠${L[1]} =`, ans: B1, dp: 1 }, { label: `obtuse ∠${L[1]} =`, ans: 180 - B1, dp: 1 }], s); } },
    d: { t: 'draw them', g: R => { let A, a, b, h, m, AD, ask, ans;
      const L = T3(R), B1 = L[1] + '₁', B2 = L[1] + '₂', AC = L[0] + L[2], CB = L[2] + L[1];
      do { A = R.int(25, 55); b = R.int(8, 18); a = R.int(4, b - 1); h = b * sd(A); AD = b * cd(A); m = Math.sqrt(Math.max(0, a * a - h * h)); ask = R.int(0, 3);
        ans = [AD - m, AD + m, 2 * m, 180 - asd(h / a)][ask]; } while (a < h + 0.8 || AD - m < 0.3 * b || 2 * m < 0.3 * b || edge(ans));
      const what = [`${L[0]}${B1}`, `${L[0]}${B2}`, `${B1}${B2}`, `∠${L[0]}${B1}${L[2]}`][ask];
      const vis = ambFig(R, L, A, a, b, { A: deg(A), b: String(b), a1: String(a), a2: String(a) });
      const base = `The height from ${L[2]} is h = ${b} sin ${A}° ≈ ${f2(h)}; its foot is ${b} cos ${A}° ≈ ${f2(AD)} from ${L[0]}, and from the foot to ${B1} or to ${B2} is √(${a}² − h²) ≈ ${f2(m)}.`;
      const expl = [`${base} So ${L[0]}${B1} = ${f2(AD)} − ${f2(m)} ≈ ${f1(ans)}.`, `${base} So ${L[0]}${B2} = ${f2(AD)} + ${f2(m)} ≈ ${f1(ans)}.`, `${base} So ${B1}${B2} = 2 × ${f2(m)} ≈ ${f1(ans)}.`,
        `sin ${L[1]} = ${b} sin ${A}° ÷ ${a}, so the acute answer is ∠${L[0]}${B2}${L[2]} ≈ ${f1(180 - ans)}°. △${L[2]}${B1}${B2} is isosceles, so ∠${L[0]}${B1}${L[2]} = 180° − ${f1(180 - ans)}° ≈ ${f1(ans)}°.`][ask];
      return E.num(`With ∠${L[0]} = ${A}°, ${AC} = ${b} and ${CB} = ${a}, side ${CB} can swing to two places, ${B1} and ${B2}. Find ${what} to 1 decimal place.`, [{ label: `${what} =`, ans, dp: 1 }], expl, { visual: vis }); } },
    e: { t: 'the range of a side', g: R => { const A = R.pick([30, 45, 60]), type = R.int(0, 2), L = T3(R), BC = [L[1], L[2]].sort().join(''), AC = [L[0], L[2]].sort().join('');
      const sinS = { 30: '1/2', 45: '√2/2', 60: '√3/2' }[A];
      if (type < 2) { const b = 2 * R.int(3, 10), hs = A === 30 ? String(b / 2) : `${b / 2 === 1 ? '' : b / 2}sqrt(${A === 45 ? 2 : 3})`, hp = E.pt(hs);
        if (type === 0) return E.num(`In △${L.join('')}, ∠${L[0]} = ${A}° and ${AC} = ${b}. For which lengths of ${BC} are there exactly two triangles? Give an interval with exact endpoints.`, [{ label: `${BC}:`, interval: ivs(`(${hs},${b})`) }],
          `The height from ${L[2]} is ${b} · ${sinS} = ${hp}. Two triangles need ${BC} longer than the height but shorter than ${AC}: ${hp} < ${BC} < ${b}.`);
        return E.num(`In △${L.join('')}, ∠${L[0]} = ${A}° and ${AC} = ${b}. For which lengths of ${BC} is there no triangle? Give an interval with exact endpoints.`, [{ label: `${BC}:`, interval: ivs(`(0,${hs})`) }],
          `The height from ${L[2]} is ${b} · ${sinS} = ${hp}. A side shorter than the height cannot reach the other arm: 0 < ${BC} < ${hp}.`); }
      const a = A === 60 ? 3 * R.int(2, 6) : R.int(3, 12), top = A === 30 ? String(2 * a) : A === 45 ? `${a === 1 ? '' : a}sqrt(2)` : `${2 * a / 3}sqrt(3)`;
      return E.num(`In △${L.join('')}, ∠${L[0]} = ${A}° and ${BC} = ${a}. For which lengths of ${AC} are there exactly two triangles? Give an interval with exact endpoints.`, [{ label: `${AC}:`, interval: ivs(`(${a},${top})`) }],
        `Two triangles need ${AC}·sin ${A}° < ${a} < ${AC}. The left part gives ${AC} < ${a} ÷ ${sinS} = ${E.pt(top)}, so ${a} < ${AC} < ${E.pt(top)}.`); } },
    f: { t: 'both triangles at once', g: R => { const L = T3(R), BC = [L[1], L[2]].sort().join(''), AC = [L[0], L[2]].sort().join(''), AB = [L[0], L[1]].sort().join('');
      if (R.bool()) { let A, a, b; do { A = R.int(25, 70); b = R.int(6, 16); a = R.int(3, b - 1); } while (b * sd(A) > a - 0.5);
        return E.num(`In △${L.join('')}, ∠${L[0]} = ${A}°, ${AC} = ${b} and ${BC} = ${a}. Two different triangles fit. Find the product of the two possible lengths of ${AB}.`, [{ label: 'product =', ans: b * b - a * a }],
          `The law of cosines gives ${a}² = ${b}² + x² − 2·${b}·x·cos ${A}°, i.e. x² − (${2 * b} cos ${A}°)x + ${b * b - a * a} = 0. Its two roots are the two lengths, and their product is the constant term ${b}² − ${a}² = ${b * b - a * a}, whatever the angle. (Power of a point: ${L[0]} is outside the circle of radius ${a} about ${L[2]}.)`); }
      const A = R.pick([30, 45, 60]); let a, b; do { b = R.int(5, 16); a = R.int(3, b - 1); } while (b * sd(A) > a - 0.5);
      const ans = A === 60 ? String(b) : `${b}sqrt(${A === 30 ? 3 : 2})`;
      return E.num(`In △${L.join('')}, ∠${L[0]} = ${A}°, ${AC} = ${b} and ${BC} = ${a}. Two different triangles fit. Find the exact sum of the two possible lengths of ${AB}.`, [{ label: 'sum =', exact: ans, form: 'simplest' }],
        `The law of cosines gives ${a}² = ${b}² + x² − 2·${b}·x·cos ${A}°, a quadratic in x whose two roots are the two lengths. Their sum is 2·${b}·cos ${A}° = ${E.pt(ans)}; ${BC} = ${a} does not matter.`); } },
  });

  /* ================= V.7.03 Law of cosines ================= */
  const cosExpl = (p, q, A, x2) => `${DM(`x^2=${p}^2+${q}^2-2(${p})(${q})cos(${A}°)`)} = ${p * p + q * q} − ${2 * p * q} cos ${A}° ≈ ${f2(x2)}. Multiply ${2 * p * q} by cos ${A}° before subtracting.`;
  S('V.7.03', 'Law of cosines', {
    a: { t: 'the formula', g: R => { const L = T3(R), l = lc(L);
      if (R.bool(0.4)) { const L2 = L[0] === 'X' ? ['A', 'B', 'C'] : L, [A, B, Cc] = L2, [a, b, c] = lc(L2), ang = R.int(7, 23) * 5, bl = R.int(30, 50) / 10, P = { [Cc]: [0, 0], [B]: [5, 0], [A]: K.polar(bl, ang), _x0: [-0.8, 0], _x1: [6.2, 0] };
        const vis = K.fig({ pts: P, segs: [['_x0', '_x1', { dash: true }], [Cc, B, { lab: a }], [Cc, A, { lab: b }], [A, B, { lab: c }]], angles: [[B, Cc, A, '']], w: 270, label: 'triangle with one vertex at the origin' });
        const lines = [[`${Cc} = (0, 0), ${B} = (${a}, 0) and ${Cc}${A} = ${b}`, 'given', []],
          [`${A} = (${b} cos ${Cc}, ${b} sin ${Cc})`, 'definitions of sine and cosine', [0], ['Pythagorean theorem', 'law of sines', 'distance formula'], `${A} is ${b} from the origin at angle ${Cc} above the x-axis, so its coordinates are ${b} cos ${Cc} and ${b} sin ${Cc}`],
          [`${c}² = (${b} cos ${Cc} − ${a})² + (${b} sin ${Cc})²`, 'distance formula', [1], ['law of sines', 'definitions of sine and cosine', 'midpoint formula'], `${c} is the distance from ${A} to ${B}(${a}, 0)`],
          [`${c}² = ${b}²cos²${Cc} − 2${a}${b} cos ${Cc} + ${a}² + ${b}²sin²${Cc}`, 'expand the squares', [2], [`sin²${Cc} + cos²${Cc} = 1`, 'distance formula', 'law of sines'], 'squaring each bracket gives these terms'],
          [`${c}² = ${a}² + ${b}² − 2${a}${b} cos ${Cc}`, `sin²${Cc} + cos²${Cc} = 1`, [3], ['expand the squares', 'law of sines', `sin ${Cc} + cos ${Cc} = 1`], `${b}²cos²${Cc} + ${b}²sin²${Cc} = ${b}²(sin²${Cc} + cos²${Cc}) = ${b}²`]];
        return proof(R, R.pick(['order', 'order', 'reason', 'broken']), { head: `In △${L2.join('')}, ${a} = ${Cc}${B}, ${b} = ${Cc}${A} and ${c} = ${A}${B}. Put ${Cc} at the origin and ${B} on the positive x-axis. Prove the law of cosines: ${c}² = ${a}² + ${b}² − 2${a}${b} cos ${Cc}.`, lines, vis,
          oexp: `Write ${A}'s coordinates with sine and cosine, use the distance formula for ${c}, expand, and let sin² + cos² = 1 tidy the ${b}² terms.`,
          breaks: [{ i: 1, st: `${A} = (${b} sin ${Cc}, ${b} cos ${Cc})`, why: `the x-coordinate runs along ${Cc}${B}, next to ∠${Cc}, so it is ${b} cos ${Cc}; the height is ${b} sin ${Cc}` },
            { i: 3, st: `${c}² = ${b}²cos²${Cc} + 2${a}${b} cos ${Cc} + ${a}² + ${b}²sin²${Cc}`, why: `(${b} cos ${Cc} − ${a})² = ${b}²cos²${Cc} − 2${a}${b} cos ${Cc} + ${a}²; the middle term is negative` },
            { i: 4, rs: 'law of sines', why: `the ${b}² terms combine because sin²${Cc} + cos²${Cc} = 1 (the Pythagorean identity); no law of sines is used` }] }); }
      if (R.bool(0.6)) { const i = R.int(0, 2), [j, k] = [0, 1, 2].filter(x => x !== i), X = l[i], P = l[j], Q = l[k];
        const right = `${X}^2=${P}^2+${Q}^2-2${P}${Q}cos(${L[i]})`, wrong = [`${X}^2=${P}^2+${Q}^2-2${P}${Q}cos(${L[j]})`, `${X}^2=${P}^2+${Q}^2+2${P}${Q}cos(${L[i]})`, `${X}^2=${P}^2+${Q}^2-${P}${Q}cos(${L[i]})`, `${X}^2=${P}^2+${Q}^2`];
        return E.choice(R, `In △${L.join('')}, each lowercase side is opposite the angle with the same capital letter. Which equation is the law of cosines for ${X}?`, M(right), R.sample(wrong, 3).map(M),
          `The angle used is the one opposite the side on the left, ∠${L[i]}, between sides ${P} and ${Q}: ${X}² = ${P}² + ${Q}² − 2${P}${Q}·cos ${L[i]}.`, { visual: triFig(R, L, rt(R), { BC: l[0], CA: l[1], AB: l[2] }) }); }
      let p, q; const A = R.pick([60, 60, 120, 120, 90]); do { p = R.int(2, 12); q = R.int(2, 12); } while (p === q);
      const ans = Math.round(p * p + q * q - 2 * p * q * cd(A)), cs = { 60: '1/2', 120: '−1/2', 90: '0' }[A];
      return E.num(`Use ${M('c^2=a^2+b^2-2ab*cos(C)')} with a = ${p}, b = ${q} and ∠C = ${A}°. Find c².`, [{ label: 'c² =', ans }],
        `cos ${A}° = ${cs}, so c² = ${p * p} + ${q * q} − 2(${p})(${q})(${cs}) = ${p * p + q * q} ${A === 120 ? '+' : '−'} ${Math.abs(Math.round(2 * p * q * cd(A)))} = ${ans}.`); } },
    b: { t: 'find a side (SAS)', g: R => { let p, q, A, x;
      if (R.bool(0.3)) [p, q, A, x] = R.pick(NICE); else do { p = R.int(4, 18); q = R.int(4, 18); A = R.int(25, 135); x = Math.sqrt(p * p + q * q - 2 * p * q * cd(A)); } while (p === q || edge(x) || Math.abs(A - 90) < 4 || minAng(x, q, p) < 18);
      const L = T3(R), t = { a: x, b: q, c: p }, vis = triFig(R, L, t, { A: deg(A), AB: String(p), CA: String(q), BC: 'x' });
      return E.num('Find x to 1 decimal place.', [{ label: 'x =', ans: x, dp: 1 }], `${cosExpl(p, q, A, x * x)} So x ≈ ${f1(x)}.`, { visual: vis }); } },
    c: { t: 'find an angle (SSS)', g: R => { let a, b, c, ang;
      if (R.bool(0.3)) { const [p, q, A, s] = R.pick(NICE); a = s; b = p; c = q; ang = A; }
      else do { a = R.int(4, 18); b = R.int(4, 18); c = R.int(4, 18); ang = acd((b * b + c * c - a * a) / (2 * b * c)); } while (!valid3(a, b, c, 1.5) || edge(ang) || new Set([a, b, c]).size < 3 || minAng(a, b, c) < 18);
      const L = T3(R), t = { a, b, c }, vis = triFig(R, L, t, { A: 'x', BC: String(a), CA: String(b), AB: String(c) }), cv = (b * b + c * c - a * a) / (2 * b * c);
      return E.num(`Find ∠${L[0]} to 1 decimal place.`, [{ label: `∠${L[0]} =`, ans: ang, dp: 1 }],
        `${DM(`cos(${L[0]})=(${b}^2+${c}^2-${a}^2)/(2(${b})(${c}))`)} = ${b * b + c * c - a * a}/${2 * b * c} ≈ ${f4(cv)}, so ∠${L[0]} ≈ ${f1(ang)}°.`, { visual: vis }); } },
    d: { t: 'Pythagoras as a special case', g: R => {
      if (R.bool(0.25)) { const L = T3(R), l = lc(L);
        return E.choice(R, `In △${L.join('')}, ∠${L[2]} = 90°. What does ${M(`${l[2]}^2=${l[0]}^2+${l[1]}^2-2${l[0]}${l[1]}cos(${L[2]})`)} become?`, M(`${l[2]}^2=${l[0]}^2+${l[1]}^2`), [M(`${l[2]}^2=${l[0]}^2+${l[1]}^2-2${l[0]}${l[1]}`), M(`${l[2]}^2=${l[0]}^2+${l[1]}^2+2${l[0]}${l[1]}`), M(`${l[2]}^2=(${l[0]}-${l[1]})^2`)],
          `cos 90° = 0, so the last term vanishes and the law of cosines becomes the Pythagorean theorem.`, { visual: (() => { const A = R.int(30, 60); return triFig(R, L, byAng(A, 90 - A), { BC: l[0], CA: l[1], AB: l[2] }, { right: 'C' }); })() }); }
      const k = R.int(0, 2); let s;
      if (k === 1) { const tr = R.pick([[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29], [9, 40, 41]]), m = tr[2] <= 13 ? R.int(1, 3) : 1; s = tr.map(v => v * m); }
      else do { s = [R.int(3, 20), R.int(3, 20), R.int(3, 25)].sort((x, y) => x - y); } while (!valid3(...s, 1) || Math.abs(s[0] ** 2 + s[1] ** 2 - s[2] ** 2) < 4 || (k === 0) !== (s[0] ** 2 + s[1] ** 2 > s[2] ** 2) || s[1] === s[2]);
      const sh = R.shuffle(s.slice()), d = s[0] ** 2 + s[1] ** 2 - s[2] ** 2;
      return E.choiceFixed(`A triangle has sides ${sh.join(', ')}. Is its largest angle acute, right or obtuse?`, ['acute', 'right', 'obtuse'], k,
        `Compare the longest side squared with the sum of the other two squares: ${s[2]}² = ${s[2] ** 2} and ${s[0]}² + ${s[1]}² = ${s[0] ** 2 + s[1] ** 2}. ${d > 0 ? 'The sum is bigger, so cos is positive and the angle is acute.' : d === 0 ? 'They are equal, so cos is 0 and the angle is 90°.' : 'The sum is smaller, so cos is negative and the angle is obtuse.'}`); } },
    e: { t: 'the unknown is next to the angle', g: R => { let A, b, c, a;
      do { A = R.pick([60, 120]); b = R.int(2, 16); c = R.int(2, 20); const a2 = b * b + c * c - 2 * b * c * cd(A); a = Math.round(Math.sqrt(a2)); if (Math.abs(a * a - a2) > 1e-9) a = 0; } while (!a || a <= b || b === c || minAng(a, b, c) < 15);
      const L = T3(R), BC = [L[1], L[2]].sort().join(''), AC = [L[0], L[2]].sort().join(''), AB = [L[0], L[1]].sort().join(''), r2 = A === 60 ? b - c : -b - c;
      const vis = triFig(R, L, { a, b, c }, { A: deg(A), BC: String(a), CA: String(b), AB: 'x' });
      return E.num(`In △${L.join('')}, ∠${L[0]} = ${A}°, ${BC} = ${a} and ${AC} = ${b}. Find ${AB}.`, [{ label: `${AB} =`, ans: c }],
        `The law of cosines on the side opposite the ${A}° angle: ${a}² = ${b}² + x² − 2·${b}·x·cos ${A}°, so ${M(`x^2${A === 60 ? '-' : '+'}${b === 1 ? '' : b}x-${a * a - b * b}=0`)}. This factors as (x − ${c})(x ${r2 < 0 ? '+' : '−'} ${Math.abs(r2)}) = 0, and a length is positive, so x = ${c}.`, { visual: vis }); } },
    f: { t: 'two laws of cosines together', g: R => {
      if (R.bool()) { let p, q, d1, d2s; do { p = R.int(3, 12); q = R.int(3, 12); d1 = R.int(Math.abs(p - q) + 1, p + q - 1); d2s = 2 * (p * p + q * q) - d1 * d1; } while (d2s <= (p - q) ** 2 || d2s >= (p + q) ** 2 || d2s === d1 * d1 || p === q || bySide(d1, p, q).A < 40 || bySide(d1, p, q).A > 140);
        const ans = sq(d2s), t = bySide(d1, p, q), th = t.A, P = K.spin(R, { A: [0, 0], B: [p, 0], D: K.polar(q, 180 - th), C: K.add([p, 0], K.polar(q, 180 - th)) }), L = K.lets(R, 4), mp = { A: L[0], B: L[1], C: L[2], D: L[3] };
        const vis = K.fig({ pts: K.renamePts(P, mp), segs: [[L[0], L[1], { lab: String(p) }], [L[1], L[2], { lab: String(q) }], [L[2], L[3]], [L[3], L[0]], [L[1], L[3], { lab: String(d1) }], [L[0], L[2], { dash: true }]], w: 280, label: 'parallelogram with a diagonal' });
        return E.num(`${L.join('')} is a parallelogram with ${L[0]}${L[1]} = ${p}, ${L[1]}${L[2]} = ${q} and diagonal ${L[1]}${L[3]} = ${d1}. Find the exact length of the other diagonal, ${L[0]}${L[2]}.`, [{ label: `${L[0]}${L[2]} =`, exact: ans, form: 'simplest' }],
          `Each diagonal faces one of two angles that add to 180°, and cos(180° − θ) = −cos θ. Adding the two laws of cosines cancels the cosine terms: ${L[0]}${L[2]}² + ${d1}² = 2(${p}² + ${q}²) = ${2 * (p * p + q * q)}. So ${L[0]}${L[2]}² = ${d2s} and ${L[0]}${L[2]} = ${E.pt(ans)}.`, { visual: vis }); }
      let a, b, c, N; do { a = R.int(4, 14); b = R.int(4, 14); c = R.int(4, 14); N = 2 * b * b + 2 * c * c - a * a; } while (!valid3(a, b, c, 1.5) || b === c || minAng(a, b, c) < 22);
      const ans = E.surdStr(0, 1, N, 2), L = T3(R), Mm = ['M', 'D', 'N'].find(x => !L.includes(x)), vis = triFig(R, L, { a, b, c }, { CA: String(b), AB: String(c) }, { add: B => ({ M: K.mid(B.B, B.C) }), map: { M: Mm }, segs: [[L[1], Mm, { ticks: 1 }], [Mm, L[2], { ticks: 1 }], [L[1], L[2], { lab: String(a), at: 0.375, ref: L[0] }], [L[0], Mm, { dash: true }]] });
      return E.num(`In △${L.join('')}, ${[L[0], L[1]].sort().join('')} = ${c}, ${[L[0], L[2]].sort().join('')} = ${b} and ${[L[1], L[2]].sort().join('')} = ${a}. ${Mm} is the midpoint of ${[L[1], L[2]].sort().join('')}. Find the exact length of the median ${L[0]}${Mm}.`, [{ label: `${L[0]}${Mm} =`, exact: ans, form: 'simplest' }],
        `∠${L[1]} is shared by △${L.join('')} and △${L[0]}${L[1]}${Mm}. Writing cos ${L[1]} from each with the law of cosines and setting them equal gives ${L[0]}${Mm}² = (2·${b}² + 2·${c}² − ${a}²)/4 = ${N}/4, so ${L[0]}${Mm} = ${E.pt(ans)}.`, { visual: vis }); } },
  });

  /* ================= V.7.04 Choosing the law ================= */
  S('V.7.04', 'Choosing the law', {
    a: { t: 'SAS and SSS → cosines', g: R => { const L = T3(R), mode = R.pick([0, 0, 1, 2]);
      if (mode === 1) { let s; do { s = [R.int(4, 15), R.int(4, 15), R.int(4, 15)]; } while (!valid3(...s, 1.5) || new Set(s).size < 3 || minAng(...s) < 18);
        const i = s.indexOf(Math.max(...s)), vis = triFig(R, L, { a: s[0], b: s[1], c: s[2] }, { BC: String(s[0]), CA: String(s[1]), AB: String(s[2]) });
        return E.choice(R, 'All three sides are known (SSS). Which angle is best to find first with the law of cosines?', `∠${L[i]}`, [`∠${L[(i + 1) % 3]}`, `∠${L[(i + 2) % 3]}`],
          `Find the largest angle first: ∠${L[i]}, opposite the longest side ${s[i]}. If it is obtuse, the law of cosines shows it, and the other two angles must be acute, so the law of sines is then safe.`, { visual: vis }); }
      if (mode === 2) { const sas = R.bool(); let vis;
        if (sas) { let p, q, A, x; do { p = R.int(4, 15); q = R.int(4, 15); A = R.int(30, 130); x = Math.sqrt(p * p + q * q - 2 * p * q * cd(A)); } while (p === q || minAng(x, q, p) < 20); vis = triFig(R, L, { a: x, b: q, c: p }, { A: deg(A), AB: String(p), CA: String(q) }); }
        else { let t3; do { t3 = [R.int(4, 15), R.int(4, 15), R.int(4, 15)]; } while (!valid3(...t3, 1.5) || minAng(...t3) < 20); vis = triFig(R, L, { a: t3[0], b: t3[1], c: t3[2] }, { BC: String(t3[0]), CA: String(t3[1]), AB: String(t3[2]) }); }
        return E.choice(R, `The marked parts are given (${sas ? 'SAS' : 'SSS'}). Which law starts the solution?`, 'the law of cosines', ['the law of sines', 'the Pythagorean theorem', 'the angle sum (180°)'],
          `With ${sas ? 'SAS' : 'SSS'} no side is known together with its opposite angle, so the law of sines has nothing to start from. The law of cosines works with ${sas ? 'two sides and the angle between them' : 'three sides'}.`, { visual: vis }); }
      if (R.bool()) { let p, q, A; do { p = R.int(4, 16); q = R.int(4, 16); A = R.int(25, 135); } while (p === q || Math.abs(A - 90) < 5 || minAng(Math.sqrt(p * p + q * q - 2 * p * q * cd(A)), q, p) < 18);
        const t = { b: q, c: p, a: Math.sqrt(p * p + q * q - 2 * p * q * cd(A)) }, vis = triFig(R, L, t, { A: deg(A), AB: String(p), CA: String(q), BC: 'x' });
        const right = `x^2=${p}^2+${q}^2-2(${p})(${q})cos(${A}°)`, wrong = [`x^2=${p}^2+${q}^2+2(${p})(${q})cos(${A}°)`, `x^2=(${p * p + q * q}-${2 * p * q})cos(${A}°)`, `x^2=${p}^2+${q}^2-(${p})(${q})cos(${A}°)`, `x^2=${p}^2+${q}^2`];
        return E.choice(R, 'Which equation finds x?', DM(right), R.sample(wrong, 3).map(DM), `SAS: the law of cosines with the angle between the two sides: x² = ${p}² + ${q}² − 2(${p})(${q})·cos ${A}°. Subtracting before multiplying is the classic slip.`, { visual: vis }); }
      let s; do { s = [R.int(4, 15), R.int(4, 15), R.int(4, 15)]; } while (!valid3(...s, 1.5) || new Set(s).size < 3 || minAng(...s) < 18);
      const [a, b, c] = s, vis = triFig(R, L, { a, b, c }, { A: 'x', BC: String(a), CA: String(b), AB: String(c) });
      const right = `cos(x°)=(${b}^2+${c}^2-${a}^2)/(2(${b})(${c}))`, wrong = [`cos(x°)=(${a}^2+${b}^2-${c}^2)/(2(${a})(${b}))`, `cos(x°)=(${b}^2+${c}^2+${a}^2)/(2(${b})(${c}))`, `cos(x°)=(${b}^2+${c}^2-${a}^2)/((${b})(${c}))`];
      return E.choice(R, 'Which equation finds x?', DM(right), wrong.map(DM), `SSS: the angle x is opposite the side ${a}, so ${a}² goes last with a minus sign, over 2·${b}·${c}.`, { visual: vis }); } },
    b: { t: 'AAS, ASA → sines', g: R => { const L = T3(R), asa = R.bool(); let A, B, a, x;
      do { A = R.int(30, 100); B = R.int(30, 100); a = R.int(5, 20); } while (180 - A - B < 25 || Math.abs(A - B) < 6 || Math.abs(180 - 2 * A - B) < 6 || Math.abs(180 - A - 2 * B) < 6);
      const Cc = 180 - A - B, t = byAng(A, B, a / sd(A));
      // ASA: angles B, C and side a between them; find b. AAS: angles A, B, side a; find c.
      if (asa) { x = a * sd(B) / sd(A); const vis = triFig(R, L, t, { B: deg(B), C: deg(Cc), BC: String(a), CA: 'x' });
        if (R.bool() && !edge(x)) return E.num('Find x to 1 decimal place.', [{ label: 'x =', ans: x, dp: 1 }], `ASA: first the third angle, 180° − ${B}° − ${Cc}° = ${A}°, which is opposite ${a}. Then ${DM(`x/sin(${B}°)=${a}/sin(${A}°)`)}, so x ≈ ${f1(x)}.`, { visual: vis });
        return E.choice(R, 'Which equation finds x?', DM(`x/sin(${B}°)=${a}/sin(${A}°)`), [DM(`x/sin(${B}°)=${a}/sin(${Cc}°)`), DM(`x/sin(${Cc}°)=${a}/sin(${B}°)`), DM(`x/sin(${A}°)=${a}/sin(${B}°)`)],
          `ASA: the angle opposite ${a} is not marked. Find it first: 180° − ${B}° − ${Cc}° = ${A}°. Then x (opposite ${B}°) pairs with ${a} (opposite ${A}°).`, { visual: vis }); }
      x = a * sd(Cc) / sd(A); const vis = triFig(R, L, t, { A: deg(A), B: deg(B), BC: String(a), AB: 'x' });
      if (R.bool() && !edge(x)) return E.num('Find x to 1 decimal place.', [{ label: 'x =', ans: x, dp: 1 }], `AAS: x is opposite the unmarked angle, 180° − ${A}° − ${B}° = ${Cc}°. ${DM(`x/sin(${Cc}°)=${a}/sin(${A}°)`)}, so x ≈ ${f1(x)}.`, { visual: vis });
      return E.choice(R, 'Which equation finds x?', DM(`x/sin(${Cc}°)=${a}/sin(${A}°)`), [DM(`x/sin(${B}°)=${a}/sin(${A}°)`), DM(`x/sin(${A}°)=${a}/sin(${Cc}°)`), DM(`x/sin(${Cc}°)=${a}/sin(${B}°)`)],
        `AAS: x is opposite the third angle, 180° − ${A}° − ${B}° = ${Cc}°, and ${a} is opposite ${A}°. So x/sin ${Cc}° = ${a}/sin ${A}°.`, { visual: vis }); } },
    c: { t: 'SSA → careful sines', g: R => { const k = R.pick([0, 2, 3]); let A, a, b, B1;
      for (;;) { b = R.int(6, 18);
        if (k === 0) { A = R.int(30, 80); a = R.int(b + 1, b + 8); }
        else if (k === 2) { A = R.int(25, 60); a = R.int(4, b - 1); if (b * sd(A) > a - 0.5) continue; }
        else { A = R.int(100, 135); a = R.int(4, b - 1); if (b * sd(A) >= a - 0.3) continue; }
        B1 = asd(b * sd(A) / a); if (edge(B1) || B1 < 12 || B1 > 84) continue;
        if (k === 0 && A + 180 - B1 < 181.5) continue; if (k === 3 && A + B1 < 181.5) continue; if (k === 2 && 180 - B1 + A > 178.5) continue; break; }
      const L = T3(R), BC = [L[1], L[2]].sort().join(''), AC = [L[0], L[2]].sort().join(''), b1 = f1(B1), b2 = f1(180 - B1);
      const opts = [`${b1}° only`, `${b2}° only`, `both ${b1}° and ${b2}°`, 'neither: no triangle'];
      const why = [`${A}° + ${b1}° < 180° works, but ${A}° + ${b2}° > 180° does not, so only ${b1}°.`, '', `${A}° + ${b1}° and ${A}° + ${b2}° are both under 180°, so both work: two triangles.`, `Even ${A}° + ${b1}° is more than 180°, so neither works: there is no triangle.`][k];
      return E.choiceFixed(`In △${L.join('')}, ∠${L[0]} = ${A}°, ${BC} = ${a} and ${AC} = ${b}. The law of sines gives sin ${L[1]} ≈ ${f4(b * sd(A) / a)}, so ∠${L[1]} ≈ ${b1}° or ${b2}°. Which values give a triangle?`, opts, k,
        `Check each with the angle sum. ${why}`); } },
    d: { t: 'plan the full solution', g: R => { const L = T3(R), [A, B, Cc] = L, s = (p, q) => [p, q].sort().join(''), cs = R.pick(['SAS', 'SSS', 'ASA', 'AAS']);
      let given, steps, deps, first, wrongFirst;
      if (cs === 'SAS') { const shortB = R.bool(); given = `Given: ${s(A, B)}, ∠${A} and ${s(A, Cc)} (SAS).`;
        const small = shortB ? Cc : B;   // the smaller angle is opposite the shorter given side
        steps = [given, `Find ${s(B, Cc)} with the law of cosines.`, `Find ∠${small} with the law of sines.`, `Find the last angle with the angle sum.`]; deps = [[], [0], [1], [2]];
        first = steps[1]; wrongFirst = [`Find ∠${B} with the law of sines.`, `Find the last angle with the angle sum.`, `Find ${s(B, Cc)} with the law of sines.`];
        given += ` ${s(A, shortB ? B : Cc)} is the shorter given side.`; steps[0] = given; }
      else if (cs === 'SSS') { const big = R.pick(L), o = L.filter(x => x !== big); given = `Given: all three sides; ${opp(L, L.indexOf(big))} is the longest (SSS).`;
        steps = [given, `Find ∠${big} with the law of cosines.`, `Find ∠${o[0]} with the law of sines.`, `Find ∠${o[1]} with the angle sum.`]; deps = [[], [0], [1], [2]];
        first = steps[1]; wrongFirst = [`Find ∠${o[0]} with the law of sines.`, `Find ∠${o[1]} with the angle sum.`, `Find ∠${big} with the law of sines.`]; }
      else if (cs === 'ASA') { given = `Given: ∠${B}, ${s(B, Cc)} and ∠${Cc} (ASA).`;
        steps = [given, `Find ∠${A} with the angle sum.`, `Find ${s(A, Cc)} with the law of sines.`, `Find ${s(A, B)} with the law of sines.`]; deps = [[], [0], [1], [1]];
        first = steps[1]; wrongFirst = [`Find ${s(A, Cc)} with the law of sines.`, `Find ${s(A, Cc)} with the law of cosines.`, `Find ${s(A, B)} with the law of sines.`]; }
      else { given = `Given: ∠${A}, ∠${B} and ${s(B, Cc)} (AAS).`;
        steps = [given, `Find ${s(A, Cc)} with the law of sines.`, `Find ∠${Cc} with the angle sum.`, `Find ${s(A, B)} with the law of sines.`]; deps = [[], [0], [0], [2]];
        first = R.pick([steps[1], steps[2]]); wrongFirst = [`Find ${s(A, B)} with the law of sines.`, `Find ${s(A, Cc)} with the law of cosines.`, `Find ${s(A, B)} with the law of cosines.`]; }
      const why = { SAS: 'the law of cosines gives the third side first; then the law of sines on the smaller angle (opposite the shorter side), which is surely acute; the angle sum finishes', SSS: 'the law of cosines on the largest angle first; the other two are then acute, so the law of sines is safe; the angle sum finishes', ASA: 'the angle sum gives the third angle, and then each side follows from the law of sines (in either order)', AAS: `the side opposite ∠${B} follows straight from the law of sines, and the angle sum gives ∠${Cc}; the last side needs ∠${Cc}` }[cs];
      if (R.bool(0.6)) { const all = K.topo(deps, 1), canon = '0,1,2,3', alts = all.filter(a => a.join() !== canon);
        return E.order(R, `Put the plan for solving △${L.join('')} in order.`, steps, `For ${cs}, ${why}.`, Object.assign({ fixed: 1 }, alts.length ? { alts } : {})); }
      return E.choice(R, `${given} What is the best first step to solve △${L.join('')}?`, first, wrongFirst.filter(w => w !== first && !(cs === 'AAS' && (w === steps[1] || w === steps[2]))), `For ${cs}, ${why}.`); } },
  });

  /* ================= V.7.05 Solve any triangle ================= */
  S('V.7.05', 'Solve any triangle', {
    a: { t: 'first missing part', g: R => { const L = T3(R), cs = R.pick(['SAS', 'SSS', 'ASA', 'AAS']);
      if (cs === 'SAS') { let p, q, A, x; do { p = R.int(4, 18); q = R.int(4, 18); A = R.int(25, 135); x = Math.sqrt(p * p + q * q - 2 * p * q * cd(A)); } while (p === q || edge(x) || minAng(x, q, p) < 18);
        return E.num('Two sides and the angle between them are given. Find x, the first missing part, to 1 decimal place.', [{ label: 'x =', ans: x, dp: 1 }], `SAS → law of cosines. ${cosExpl(p, q, A, x * x)} So x ≈ ${f1(x)}.`, { visual: triFig(R, L, { a: x, b: q, c: p }, { A: deg(A), AB: String(p), CA: String(q), BC: 'x' }) }); }
      if (cs === 'SSS') { let s, ang; do { s = [R.int(4, 18), R.int(4, 18), R.int(4, 18)]; ang = acd((s[1] ** 2 + s[2] ** 2 - s[0] ** 2) / (2 * s[1] * s[2])); } while (!valid3(...s, 1.5) || s[0] <= Math.max(s[1], s[2]) || edge(ang) || minAng(...s) < 15);
        return E.num('All three sides are given. Find the largest angle, x°, to 1 decimal place.', [{ label: 'x =', ans: ang, dp: 1 }],
          `SSS → law of cosines on the largest angle, opposite ${s[0]}: cos x° = (${s[1]}² + ${s[2]}² − ${s[0]}²)/(2·${s[1]}·${s[2]}) = ${s[1] ** 2 + s[2] ** 2 - s[0] ** 2}/${2 * s[1] * s[2]}, so x ≈ ${f1(ang)}.`, { visual: triFig(R, L, { a: s[0], b: s[1], c: s[2] }, { A: 'x°', BC: String(s[0]), CA: String(s[1]), AB: String(s[2]) }) }); }
      let A, B, a; do { A = R.int(30, 100); B = R.int(30, 100); a = R.int(5, 20); } while (180 - A - B < 25 || Math.abs(A - B) < 6);
      const Cc = 180 - A - B, t = byAng(A, B, a / sd(A));
      if (cs === 'ASA') return E.num('Two angles and the side between them are given. Find x, the first missing part.', [{ label: 'x =', ans: A }], `ASA → the angle sum first: x = 180 − ${B} − ${Cc} = ${A}. Then the law of sines gives the sides.`, { visual: triFig(R, L, t, { B: deg(B), C: deg(Cc), BC: String(a), A: 'x°' }) });
      const x = a * sd(B) / sd(A); if (edge(x)) return E.num('Two angles and a side not between them are given. Find x, the first missing part.', [{ label: 'x =', ans: Cc }], `The third angle: x = 180 − ${A} − ${B} = ${Cc}.`, { visual: triFig(R, L, t, { A: deg(A), B: deg(B), BC: String(a), C: 'x°' }) });
      return E.num('Two angles and a side opposite one of them are given (AAS). Find x to 1 decimal place.', [{ label: 'x =', ans: x, dp: 1 }], `AAS → law of sines, since ${a} sits opposite the ${A}° angle: ${DM(`x/sin(${B}°)=${a}/sin(${A}°)`)}, so x ≈ ${f1(x)}.`, { visual: triFig(R, L, t, { A: deg(A), B: deg(B), BC: String(a), CA: 'x' }) }); } },
    b: { t: 'angle sum', g: R => { let A, a, b, B, Cc;
      do { A = R.int(30, 110); a = R.int(7, 20); b = R.int(4, a - 2); B = asd(b * sd(A) / a); Cc = 180 - A - B; } while (B < 25 || Cc < 25 || edge(B) || Math.abs(Cc - B) < 6);
      const L = T3(R), vis = triFig(R, L, byAng(A, B, a / sd(A)), { A: deg(A), BC: String(a), CA: String(b), C: 'x°' });
      return E.num('Find x to 1 decimal place.', [{ label: 'x =', ans: Cc, dp: 1 }],
        `First ∠${L[1]} (opposite ${b}) by the law of sines: sin ${L[1]} = ${b} sin ${A}° ÷ ${a} ≈ ${f4(b * sd(A) / a)}, so ∠${L[1]} ≈ ${f1(B)}° (acute, since ${b} < ${a}). Then x = 180 − ${A} − ${f1(B)} ≈ ${f1(Cc)}.`, { visual: vis }); } },
    c: { t: 'last side', g: R => { let A, B, a, x;
      do { A = R.int(30, 100); B = R.int(30, 100); a = R.int(5, 20); x = a * sd(180 - A - B) / sd(A); } while (180 - A - B < 25 || Math.abs(A - B) < 6 || edge(x) || Math.abs(180 - 2 * A - B) < 5);
      const Cc = 180 - A - B, L = T3(R), sas = R.bool(0.35);
      if (sas) { const b = a * sd(B) / sd(A), bb = R.int(5, 18), aa = R.int(5, 18); let A2 = R.int(30, 120), y = Math.sqrt(aa * aa + bb * bb - 2 * aa * bb * cd(A2));
        let tries = 0; while ((edge(y) || aa === bb || minAng(y, bb, aa) < 18) && tries++ < 50) { A2 = R.int(30, 120); y = Math.sqrt(aa * aa + bb * bb - 2 * aa * bb * cd(A2)); }
        if (!edge(y) && aa !== bb && minAng(y, bb, aa) >= 18) { const B2 = asd(Math.min(aa, bb) * sd(A2) / y), sm = aa < bb ? 'B' : 'C';
          return E.num(`In △${L.join('')}, ${[L[0], L[1]].sort().join('')} = ${aa}, ${[L[0], L[2]].sort().join('')} = ${bb} and ∠${L[0]} = ${A2}°. Find ${[L[1], L[2]].sort().join('')}, the last side, to 1 decimal place.`, [{ label: `${[L[1], L[2]].sort().join('')} =`, ans: y, dp: 1 }],
            `The two known sides surround ∠${L[0]}, so the law of cosines: ${cosExpl(aa, bb, A2, y * y)} So the side ≈ ${f1(y)}.`, { visual: triFig(R, L, { a: y, b: bb, c: aa }, { A: deg(A2), AB: String(aa), CA: String(bb), BC: 'x' }) }); } }
      const vis = triFig(R, L, byAng(A, B, a / sd(A)), { A: deg(A), B: deg(B), BC: String(a), AB: 'x' });
      return E.num('Find x, the last side, to 1 decimal place.', [{ label: 'x =', ans: x, dp: 1 }], `x is opposite the third angle, 180° − ${A}° − ${B}° = ${Cc}°. ${DM(`x/sin(${Cc}°)=${a}/sin(${A}°)`)}, so x ≈ ${f1(x)}.`, { visual: vis }); } },
    d: { t: 'check consistency', g: R => { const mode = R.int(0, 2);
      if (mode === 0) { const yes = R.bool(); let s;
        do { s = [R.int(2, 15), R.int(2, 15), R.int(3, 25)].sort((x, y) => x - y); } while (yes ? !valid3(...s, 0.5) : (s[0] + s[1] >= s[2]));
        const sh = R.shuffle(s.slice()), cv = (s[0] ** 2 + s[1] ** 2 - s[2] ** 2) / (2 * s[0] * s[1]);
        return E.tf(`Can a triangle have sides ${sh.join(', ')}?`, yes, yes ? `Yes: ${s[0]} + ${s[1]} = ${s[0] + s[1]} > ${s[2]}, so the two shorter sides can meet. The law of cosines agrees: cos of the largest angle is ${f4(cv)}, between −1 and 1.` : `No: ${s[0]} + ${s[1]} = ${s[0] + s[1]}, which is not more than ${s[2]}. The law of cosines would give cos = ${f4(cv)}, and no angle has a cosine below −1${cv >= -1 ? ' or equal to −1' : ''}.`, { choices: ['Yes', 'No'] }); }
      if (mode === 1) { const yes = R.bool(); let A, a, b, ok;
        do { A = R.int(25, 140); b = R.int(5, 18); a = R.int(2, 20); ok = A < 90 ? a >= b * sd(A) : a > b; } while (ok !== yes || Math.abs(a - b * sd(A)) < 0.4 || a === b);
        const L = T3(R), BC = [L[1], L[2]].sort().join(''), AC = [L[0], L[2]].sort().join(''), sv = b * sd(A) / a;
        return E.tf(`Can a triangle have ∠${L[0]} = ${A}°, ${BC} = ${a} and ${AC} = ${b}?`, yes,
          A < 90 ? (yes ? `Yes: sin ${L[1]} = ${b} sin ${A}° ÷ ${a} ≈ ${f4(sv)}, which is at most 1, so some angle ${L[1]} works.` : `No: sin ${L[1]} = ${b} sin ${A}° ÷ ${a} ≈ ${f4(sv)}, more than 1, which is impossible. The side ${a} is shorter than the height ${f2(b * sd(A))}.`)
            : (yes ? `Yes: ∠${L[0]} is obtuse, so ${BC} must be the longest side, and ${a} > ${b}.` : `No: ∠${L[0]} is obtuse, so the side opposite it must be the longest side, but ${a} < ${b}.`), { choices: ['Yes', 'No'] }); }
      let A, B; do { A = R.int(30, 100); B = R.int(30, 100); } while (180 - A - B < 25 || Math.abs(A - B) < 6);
      const Cc = 180 - A - B, k = R.int(6, 14) / 10 * R.int(5, 12) / sd(A), t = byAng(A, B, k), sides = [t.a, t.b, t.c].map(n1), angs = [A, B, Cc], bad = R.int(0, 5), shown = angs.concat(sides);
      if (bad < 3) { let d; do d = R.pick([-1, 1]) * R.int(6, 15); while (shown[bad] + d < 10); shown[bad] += d; }
      else shown[bad] = n1(shown[bad] * R.pick([0.62, 0.7, 1.35, 1.5]));
      const sumA = shown[0] + shown[1] + shown[2], rat = [0, 1, 2].map(i => shown[3 + i] / sd(shown[i])), nm = ['∠A', '∠B', '∠C', 'a', 'b', 'c'];
      const opts = nm.map((x, i) => `${x} = ${i < 3 ? shown[i] + '°' : shown[i].toFixed(1)}`), j = bad % 3;
      const why = bad < 3 ? `The angles add to ${sumA}°, not 180°, so an angle is wrong. The ratios a/sin A, b/sin B, c/sin C are ${rat.map(f2).join(', ')}; only the one with ${nm[j]} is off, so ${nm[j]} is wrong.`
        : `The angles add to 180°, so they are fine. The ratios a/sin A, b/sin B, c/sin C are ${rat.map(f2).join(', ')}; the ${nm[bad]} ratio does not match the other two, so ${nm[bad]} is wrong.`;
      return E.choiceFixed(`A student solved △ABC (each lowercase side is opposite the angle with the same capital) and got these values. Exactly one is wrong. Which one?`, opts, bad, why); } },
  });

  /* ================= V.7.06 Area with sine ================= */
  const gramFig = (R, L, p, q, th, labs) => { const P = K.spin(R, { A: [0, 0], B: [p, 0], D: K.polar(q, th), C: K.add([p, 0], K.polar(q, th)) }), mp = { A: L[0], B: L[1], C: L[2], D: L[3] };
    return K.fig({ pts: K.renamePts(P, mp), segs: [[L[0], L[1], { lab: labs.p }], [L[1], L[2]], [L[2], L[3]], [L[3], L[0], { lab: labs.q }]], angles: [[L[1], L[0], L[3], labs.th]], w: 280, label: 'parallelogram' }); };
  S('V.7.06', 'Area with sine', {
    a: { t: '½·ab·sin C', g: R => { let p, q, Cc, ar;
      do { p = R.int(3, 16); q = R.int(3, 16); Cc = R.bool(0.2) ? R.pick([30, 150]) : R.int(20, 160); ar = 0.5 * p * q * sd(Cc); } while (p === q || edge(ar) || Math.abs(Cc - 90) < 4 || minAng(p, q, Math.sqrt(p * p + q * q - 2 * p * q * cd(Cc))) < 20);
      const L = T3(R), t = { a: p, b: q, c: Math.sqrt(p * p + q * q - 2 * p * q * cd(Cc)) }, tt = bySide(t.a, t.b, t.c), decoy = R.bool(0.5);
      const labs = { C: deg(Cc), BC: String(p), CA: String(q) }; if (decoy) labs[R.pick(['A', 'B'])] = null;
      if (decoy) { if (labs.A === null) labs.A = deg(Math.round(tt.A)); else labs.B = deg(Math.round(tt.B)); }
      return E.num('Find the area of the triangle to 1 decimal place.', [{ label: 'area =', ans: ar, dp: 1 }],
        `Use the angle between the two known sides, ${Cc}°: area = ½ · ${p} · ${q} · sin ${Cc}° ≈ ${f1(ar)}.${decoy ? ' The other marked angle is not between those sides, so it is not used.' : ''}`, { visual: triFig(R, L, t, labs) }); } },
    b: { t: 'derive it', g: R => { const L = T3(R), H = footL(L), [A, B, Cc] = L, s = (x, y) => [x, y].sort().join(''); let An, Bn;
      do { An = R.int(40, 80); Bn = R.int(40, 80); } while (180 - An - Bn < 35 || Math.abs(An - Bn) < 8);
      const vis = triFig(R, L, byAng(An, Bn), {}, Object.assign(altOpts(L, H), { label: 'triangle with an altitude' }));
      if (R.bool(0.55)) { const lines = [`Draw the altitude ${Cc}${H} to ${s(A, B)}, with length h.`, `In right △${A}${H}${Cc}: ${M(`h=${s(A, Cc)}sin(${A})`)}.`, `Area = ½ · base · height = ½ · ${s(A, B)} · h.`, `Area = ½ · ${s(A, B)} · ${s(A, Cc)} · sin ${A}.`];
        return K.orderQ(R, `Put the steps of this proof that area = ½ · ${s(A, B)} · ${s(A, Cc)} · sin ${A} in order.`, lines, [[], [0], [0], [1, 2]], `The altitude gives h = ${s(A, Cc)}·sin ${A} and the base-height area formula; those two can come in either order, and substituting h finishes the proof.`, { visual: vis }); }
      const right = `${s(A, Cc)}sin(${A})`, wrong = [`${s(A, Cc)}cos(${A})`, `${s(A, B)}sin(${A})`, `${s(A, Cc)}/sin(${A})`, `${s(B, Cc)}sin(${A})`];
      return E.choice(R, `${Cc}${H} is the height to base ${s(A, B)}. Which expression equals the height, so that area = ½ · ${s(A, B)} · height becomes ½ · ${s(A, B)} · ${s(A, Cc)} · sin ${A}?`, M(right), R.sample(wrong, 3).map(M),
        `In right △${A}${H}${Cc}, the height is opposite ∠${A} with hypotenuse ${s(A, Cc)}, so height = ${s(A, Cc)}·sin ${A}.`, { visual: vis }); } },
    c: { t: 'find a missing side from area', g: R => { const L = T3(R), angMode = R.bool(0.35); let p, q, Cc, ar, ans;
      if (angMode) { do { p = R.int(4, 16); q = R.int(4, 16); Cc = R.int(20, 80); ar = n1(0.5 * p * q * sd(Cc)); ans = asd(2 * ar / (p * q)); } while (p === q || edge(ans) || ar < 3 || minAng(p, q, Math.sqrt(p * p + q * q - 2 * p * q * cd(ans))) < 20);
        return E.num(`A triangle has sides ${p} and ${q}, an acute angle between them, and area ${ar}. Find that angle to 1 decimal place.`, [{ label: 'angle =', ans, dp: 1 }],
          `${ar} = ½ · ${p} · ${q} · sin θ, so sin θ = ${2 * ar}/${p * q} ≈ ${f4(2 * ar / (p * q))} and θ ≈ ${f1(ans)}°.`, { visual: triFig(R, L, { a: p, b: q, c: Math.sqrt(p * p + q * q - 2 * p * q * cd(ans)) }, { C: 'θ', BC: String(p), CA: String(q) }) }); }
      do { p = R.int(4, 16); q = R.int(4, 16); Cc = R.bool(0.3) ? R.pick([30, 150]) : R.int(25, 155); ar = n1(0.5 * p * q * sd(Cc)); ans = 2 * ar / (p * sd(Cc)); } while (p === q || edge(ans) || Math.abs(Cc - 90) < 4 || minAng(p, ans, Math.sqrt(p * p + ans * ans - 2 * p * ans * cd(Cc))) < 20);
      return E.num(`The triangle has area ${ar}. Find x to 1 decimal place.`, [{ label: 'x =', ans, dp: 1 }], `${ar} = ½ · ${p} · x · sin ${Cc}°, so x = ${2 * ar} ÷ (${p} sin ${Cc}°) ≈ ${f1(ans)}.`,
        { visual: triFig(R, L, { a: p, b: ans, c: Math.sqrt(p * p + ans * ans - 2 * p * ans * cd(Cc)) }, { C: deg(Cc), BC: String(p), CA: 'x' }) }); } },
    d: { t: 'parallelogram area', g: R => { const L = K.lets(R, 4), mode = R.int(0, 2); let p, q, th, ar;
      if (mode < 2) { do { p = R.int(4, 16); q = mode === 1 ? p : R.int(3, 14); th = R.int(35, 145); ar = p * q * sd(th); } while ((mode === 0 && (p === q || p > 2.5 * q || q > 2.5 * p)) || edge(ar) || Math.abs(th - 90) < 6);
        return E.num(`Find the area of ${mode ? 'the rhombus' : 'the parallelogram'} ${L.join('')} to 1 decimal place.`, [{ label: 'area =', ans: ar, dp: 1 }],
          `A diagonal splits it into two congruent triangles, each ½ · ${p} · ${q} · sin ${th}°. So area = ${p} · ${q} · sin ${th}° ≈ ${f1(ar)}.${th > 90 ? ` (sin ${th}° = sin ${180 - th}°, so either angle works.)` : ''}`, { visual: gramFig(R, L, p, q, th, { p: String(p), q: String(q), th: deg(th) }) }); }
      let x; do { p = R.int(4, 16); th = R.int(35, 145); ar = R.int(20, 150); x = ar / (p * sd(th)); } while (edge(x) || x < 0.4 * p || x > 2.5 * p || Math.abs(th - 90) < 6);
      return E.num(`Parallelogram ${L.join('')} has area ${ar}. Find x to 1 decimal place.`, [{ label: 'x =', ans: x, dp: 1 }], `Area = ${p} · x · sin ${th}°, so x = ${ar} ÷ (${p} sin ${th}°) ≈ ${f1(x)}.`, { visual: gramFig(R, L, p, x, th, { p: String(p), q: 'x', th: deg(th) }) }); } },
    e: { t: 'triangles sharing an angle', g: R => { const L = K.lets(R, 5), [A, B, Cc, D, Ee] = L, mode = R.int(0, 2); let ad, db, ae, ec;
      do { ad = R.int(2, 9); db = R.int(2, 9); ae = R.int(2, 9); ec = R.int(2, 9); } while (ad + db > 3 * (ae + ec) || ae + ec > 3 * (ad + db) || Math.min(ad, db) < 0.3 * (ad + db) || Math.min(ae, ec) < 0.3 * (ae + ec));
      const c = ad + db, b = ae + ec, al = R.int(45, 85), P0 = { A: [0, 0], B: [c, 0], C: K.polar(b, al) }; P0.D = K.lerp(P0.A, P0.B, ad / c); P0.E = K.lerp(P0.A, P0.C, ae / b);
      const P = K.renamePts(K.spin(R, P0), { A, B, C: Cc, D, E: Ee });
      const vis = K.fig({ pts: P, segs: [[A, D, { lab: String(ad) }], [D, B, { lab: String(db) }], [A, Ee, { lab: String(ae) }], [Ee, Cc, { lab: String(ec) }], [B, Cc], [D, Ee]], center: K.cen3(P[A], P[B], P[Cc]), w: 280, label: 'triangle with a smaller triangle at one corner' });
      const n = ad * ae, d = c * b, pre = `${D} is on ${A}${B} and ${Ee} is on ${A}${Cc}.`, core = `Both triangles use ∠${A}: [${A}${D}${Ee}] = ½ · ${ad} · ${ae} · sin ${A} and [${A}${B}${Cc}] = ½ · ${c} · ${b} · sin ${A}, giving a ratio of ${n}/${d}${E.fracStr(n, d) !== n + '/' + d ? ' = ' + E.fracStr(n, d) : ''}`;
      if (mode === 0) return E.num(`${pre} Find the area of △${A}${D}${Ee} divided by the area of △${A}${B}${Cc}.`, [{ label: 'ratio =', frac: [n, d], form: 'any' }], `${core}.`, { visual: vis });
      const g = d / E.gcd(n, d), T = g * R.int(1, Math.max(1, Math.floor(120 / g))), small = T * n / d;
      if (mode === 1) return E.num(`${pre} The area of △${A}${B}${Cc} is ${T}. Find the area of △${A}${D}${Ee}.`, [{ label: 'area =', ans: small }], `${core}. So [${A}${D}${Ee}] = ${T} · ${E.fracStr(n, d)} = ${small}.`, { visual: vis });
      return E.num(`${pre} The area of △${A}${B}${Cc} is ${T}. Find the area of quadrilateral ${D}${B}${Cc}${Ee}.`, [{ label: 'area =', ans: T - small }], `${core}. So [${A}${D}${Ee}] = ${small} and the quadrilateral is ${T} − ${small} = ${T - small}.`, { visual: vis }); } },
    f: { t: 'hidden sine areas', g: R => {
      if (R.bool()) { const k = R.pick([1, 2]), Sa = R.int(2, 30), ans = Sa * (1 + 3 * k * (k + 1)), L = K.lets(R, 6), [A, B, Cc, D, Ee, F] = L, t = rt(R), P0 = K.bySides(t.a, t.b, t.c);
        P0.D = K.add(P0.B, K.mul(K.sub(P0.B, P0.A), k)); P0.E = K.add(P0.C, K.mul(K.sub(P0.C, P0.B), k)); P0.F = K.add(P0.A, K.mul(K.sub(P0.A, P0.C), k));
        const P = K.renamePts(K.spin(R, P0), { A, B, C: Cc, D, E: Ee, F });
        const vis = K.fig({ pts: P, segs: [[A, B], [B, Cc], [Cc, A], [B, D], [Cc, Ee], [A, F], [D, Ee, { dash: true }], [Ee, F, { dash: true }], [F, D, { dash: true }]], center: K.cen3(P[A], P[B], P[Cc]), w: 290, label: 'triangle with its sides extended' });
        const kk = k === 1 ? 'its own length' : `${k} times its length`;
        return E.num(`△${A}${B}${Cc} has area ${Sa}. Each side is extended past one end by ${kk}: ${B}${D} = ${k === 1 ? '' : k}${A}${B}, ${Cc}${Ee} = ${k === 1 ? '' : k}${B}${Cc} and ${A}${F} = ${k === 1 ? '' : k}${Cc}${A}. Find the area of △${D}${Ee}${F}.`, [{ label: 'area =', ans }],
          `△${D}${B}${Ee} has sides ${k === 1 ? '' : k + '·'}${A}${B} and ${k + 1}·${B}${Cc} around an angle of 180° − ∠${B}, and sin(180° − ∠${B}) = sin ${B}, so its area is ${k * (k + 1)} × ${Sa}. The same holds for the other two corner triangles, so the total is ${Sa} + 3 × ${k * (k + 1) * Sa} = ${ans}.`, { visual: vis }); }
      const th = R.pick([45, 60, 90, 120, 135]); let p, q; do { p = R.int(4, 16); q = R.int(4, 16); } while (p === q || p > 1.6 * q || q > 1.6 * p);
      const r = { 45: 2, 135: 2, 60: 3, 120: 3, 90: 1 }[th], ans = th === 90 ? E.fracStr(p * q, 2) : E.surdStr(0, p * q, r, 4);
      const L = K.lets(R, 5), [A, B, Cc, D, X] = L, pa = p * R.int(3, 6) / 10, pb = q * R.int(3, 6) / 10, u = K.polar(1, 0), v = K.polar(1, th);
      const P = K.renamePts(K.spin(R, { A: K.mul(u, -pa), C: K.mul(u, p - pa), B: K.mul(v, -pb), D: K.mul(v, q - pb), X: [0, 0] }), { A, B, C: Cc, D, X });
      const vis = K.fig({ pts: P, segs: [[A, B], [B, Cc], [Cc, D], [D, A], [A, Cc, { dash: true }], [B, D, { dash: true }]], angles: [[Cc, X, D, deg(th)]], w: 280, label: 'quadrilateral with its diagonals' });
      return E.num(`The diagonals of quadrilateral ${A}${B}${Cc}${D} meet at ${X} at an angle of ${th}°. ${A}${Cc} = ${p} and ${B}${D} = ${q}. Find the exact area of ${A}${B}${Cc}${D}.`, [{ label: 'area =', exact: ans, form: 'simplest' }],
        `The diagonals cut it into four triangles${th === 90 ? ', each with a right angle at ' + X : ` with angles ${th}° or ${180 - th}° at ${X}, all with the same sine`}. Adding ½·(piece)·(piece)·sin ${th}° over the four gives ½ · ${A}${Cc} · ${B}${D} · sin ${th}° = ½ · ${p} · ${q} · sin ${th}° = ${E.pt(ans)}, however the diagonals are split.`, { visual: vis }); } },
  });

  /* ================= V.7.07 Heron's formula ================= */
  S('V.7.07', "Heron's formula", {
    a: { t: 'semi-perimeter', g: R => { let s3; do { s3 = [R.int(3, 30), R.int(3, 30), R.int(3, 30)].map(v => R.bool(0.2) ? v + 0.5 : v); } while (!valid3(...s3, 1));
      const P = s3[0] + s3[1] + s3[2], sP = P / 2;
      if (R.bool(0.3)) { const i = R.int(0, 2), kn = s3.filter((_, j) => j !== i);
        return E.num(`A triangle has semi-perimeter s = ${sP} and two sides ${kn[0]} and ${kn[1]}. Find the third side.`, [{ label: 'side =', ans: s3[i] }], `The perimeter is 2s = ${P}, so the third side is ${P} − ${kn[0]} − ${kn[1]} = ${s3[i]}.`); }
      return E.num(`A triangle has sides ${s3.join(', ')}. Find its semi-perimeter s.`, [{ label: 's =', ans: sP }], `s is half the perimeter: (${s3.join(' + ')}) ÷ 2 = ${P} ÷ 2 = ${sP}, not ${P}.`); } },
    b: { t: 'the formula', g: R => {
      if (R.bool(0.3)) { const l = lc(T3(R)), [a, b, c] = l;
        return E.choice(R, `A triangle has sides ${a}, ${b}, ${c} and semi-perimeter s. Which formula gives its area?`, M(`sqrt(s(s-${a})(s-${b})(s-${c}))`), [M(`s(s-${a})(s-${b})(s-${c})`), M(`sqrt((s-${a})(s-${b})(s-${c}))`), M(`sqrt(2s(2s-${a})(2s-${b})(2s-${c}))`)],
          `Heron's formula: area = √(s(s − ${a})(s − ${b})(s − ${c})), with s = half the perimeter. The square root and the lone factor s are both needed.`); }
      let s3; do { s3 = [R.int(3, 20), R.int(3, 20), R.int(3, 20)]; } while (!valid3(...s3, 1) || (s3[0] + s3[1] + s3[2]) % 2);
      const s = (s3[0] + s3[1] + s3[2]) / 2, P = 2 * s, f = v => `√(${v.join(' · ')})`;
      return E.choice(R, `Which expression gives the area of a triangle with sides ${s3.join(', ')}?`, f([s, s - s3[0], s - s3[1], s - s3[2]]), [f([P, P - s3[0], P - s3[1], P - s3[2]]), [s, s - s3[0], s - s3[1], s - s3[2]].join(' · '), f([s - s3[0], s - s3[1], s - s3[2]])],
        `s = ${P} ÷ 2 = ${s}, so area = √(${s}(${s} − ${s3[0]})(${s} − ${s3[1]})(${s} − ${s3[2]})) = √(${s} · ${s - s3[0]} · ${s - s3[1]} · ${s - s3[2]}). Using the whole perimeter ${P} is the classic slip.`); } },
    c: { t: 'apply it', g: R => { const L = T3(R); let s3, ar, nice = R.bool(0.55);
      if (nice) { const h = R.pick(HERON); s3 = R.shuffle(h.slice(0, 3)); ar = h[3]; }
      else do { s3 = [R.int(3, 20), R.int(3, 20), R.int(3, 20)]; const s = (s3[0] + s3[1] + s3[2]) / 2; ar = Math.sqrt(s * (s - s3[0]) * (s - s3[1]) * (s - s3[2])); } while (!valid3(...s3, 1.5) || edge(ar) || Number.isInteger(ar) || minAng(...s3) < 18);
      const s = (s3[0] + s3[1] + s3[2]) / 2, pr = s * (s - s3[0]) * (s - s3[1]) * (s - s3[2]);
      return E.num(`Find the area of the triangle${nice ? '' : ' to 1 decimal place'}.`, [nice ? { label: 'area =', ans: ar } : { label: 'area =', ans: ar, dp: 1 }],
        `s = ${2 * s} ÷ 2 = ${s}. Area = √(${s} · ${s - s3[0]} · ${s - s3[1]} · ${s - s3[2]}) = √${pr} ${nice ? '=' : '≈'} ${nice ? ar : f1(ar)}.`, { visual: triFig(R, L, { a: s3[0], b: s3[1], c: s3[2] }, { BC: String(s3[0]), CA: String(s3[1]), AB: String(s3[2]) }) }); } },
    d: { t: 'compare with ½ab sin C', g: R => { const L = T3(R), mode = R.int(0, 2), h = R.pick(HERON), s3 = R.shuffle(h.slice(0, 3)), ar = h[3], s = (s3[0] + s3[1] + s3[2]) / 2;
      const heron = `Heron: s = ${s}, area = √(${s} · ${s - s3[0]} · ${s - s3[1]} · ${s - s3[2]}) = ${ar}.`, vis = triFig(R, L, { a: s3[0], b: s3[1], c: s3[2] }, { BC: String(s3[0]), CA: String(s3[1]), AB: String(s3[2]) });
      if (mode === 0) { const i = R.int(0, 2), [j, k] = [0, 1, 2].filter(x => x !== i), n = 2 * ar, d = s3[j] * s3[k];
        return E.num(`Find sin ${L[i]} as a fraction.`, [{ label: `sin ${L[i]} =`, frac: red(n, d), form: 'simplest' }], `${heron} Also area = ½ · ${s3[j]} · ${s3[k]} · sin ${L[i]}, so sin ${L[i]} = ${n}/${d}${E.fracStr(n, d) !== n + '/' + d ? ' = ' + E.fracStr(n, d) : ''}.`, { visual: vis }); }
      if (mode === 1) { const i = s3.indexOf(Math.max(...s3)), hh = 2 * ar / s3[i], ex = Math.abs(hh * 100 - Math.round(hh * 100)) < 1e-9;
        if (!ex && edge(hh)) return E.num(`Find the height to the longest side as a fraction.`, [{ label: 'height =', frac: [2 * ar, s3[i]], form: 'any' }], `${heron} Area = ½ · ${s3[i]} · height, so height = ${2 * ar}/${s3[i]} = ${E.fracStr(2 * ar, s3[i])}.`, { visual: vis });
        return E.num(`Find the height to the longest side${ex ? '' : ' to 1 decimal place'}.`, [ex ? { label: 'height =', ans: Math.round(hh * 100) / 100 } : { label: 'height =', ans: hh, dp: 1 }],
          `${heron} Area = ½ · ${s3[i]} · height, so height = ${2 * ar} ÷ ${s3[i]} ${ex ? '=' : '≈'} ${ex ? Math.round(hh * 100) / 100 : f1(hh)}.`, { visual: vis }); }
      const i = s3.indexOf(Math.min(...s3)), [j, k] = [0, 1, 2].filter(x => x !== i), ang = asd(2 * ar / (s3[j] * s3[k]));
      if (edge(ang)) { const n = 2 * ar, d = s3[j] * s3[k]; return E.num(`Find sin ${L[i]} as a fraction.`, [{ label: `sin ${L[i]} =`, frac: red(n, d), form: 'simplest' }], `${heron} Also area = ½ · ${s3[j]} · ${s3[k]} · sin ${L[i]}, so sin ${L[i]} = ${E.fracStr(n, d)}.`, { visual: vis }); }
      return E.num(`Find the smallest angle, ∠${L[i]}, to 1 decimal place.`, [{ label: `∠${L[i]} =`, ans: ang, dp: 1 }],
        `${heron} Then ${ar} = ½ · ${s3[j]} · ${s3[k]} · sin ${L[i]}, so sin ${L[i]} = ${2 * ar}/${s3[j] * s3[k]} and ∠${L[i]} ≈ ${f1(ang)}°. It is acute, being opposite the shortest side.`, { visual: vis }); } },
  });

  /* ================= V.7.08 Bearings & navigation ================= */
  const dirOf = b => [Math.sin(rad(b)), Math.cos(rad(b))];
  const route = (b1, d1, b2, d2, f = dirOf) => { const A = [0, 0], B = K.add(A, K.mul(f(b1), d1)); return { A, B, C: K.add(B, K.mul(f(b2), d2)) }; };
  const routeFig = (P, L, o = {}) => {
    const sz = Math.max(K.dist(P.A, P.B), K.dist(P.B, P.C)) * 0.3, pts = { [L[0]]: P.A, [L[1]]: P.B, [L[2]]: P.C, _na: K.add(P.A, [0, sz]), _nb: K.add(P.B, [0, sz]), _ta: K.add(P.A, [0, sz * 1.25]), _tb: K.add(P.B, [0, sz * 1.25]) };
    const segs = [[L[0], '_na', { dash: true, color: C.muted }], [L[1], '_nb', { dash: true, color: C.muted }], [L[0], L[1], { lab: o.l1 }], [L[1], L[2], { lab: o.l2 }]];
    if (o.close) segs.push([L[0], L[2], { dash: true, lab: o.l3 }]);
    const angles = []; if (o.b1 !== undefined && o.b1 <= 170) angles.push(['_na', L[0], L[1], deg(o.b1)]); if (o.b2 !== undefined && o.b2 <= 170) angles.push(['_nb', L[1], L[2], deg(o.b2)]);
    return K.fig({ pts, segs, angles, text: [[pts._ta, 'N', { size: 12, fill: C.muted }], [pts._tb, 'N', { size: 12, fill: C.muted }]], w: o.w || 270, label: 'route with north lines' });
  };
  const turnAng = (b1, b2) => { let d = ((b1 + 180 - b2) % 360 + 360) % 360; return d > 180 ? 360 - d : d; };
  const pickRoute = R => { let b1, b2, ang; do { b1 = 5 * R.int(1, 71); b2 = 5 * R.int(1, 71); ang = turnAng(b1, b2); } while (ang < 30 || ang > 135 || b1 % 90 === 0 || b2 % 90 === 0 || b1 % 180 < 35 || b1 % 180 > 145 || b2 % 180 < 35 || b2 % 180 > 145); return { b1, b2, ang }; };
  const PL = R => R.pick([['A', 'B', 'C'], ['P', 'Q', 'R'], ['H', 'J', 'K'], ['S', 'T', 'U']]);
  S('V.7.08', 'Bearings & navigation', {
    a: { t: 'bearing notation', g: R => { const mode = R.int(0, 2);
      if (mode === 0) { const toMath = R.bool(); let b; do b = 5 * R.int(1, 71); while (b % 90 === 0 || b === 45 || b === 225);
        const m = ((90 - b) % 360 + 360) % 360;
        if (toMath) return E.num(`A direction has bearing ${pad3(b)}°. What is its math angle, measured counterclockwise from east (0° to 360°)?`, [{ label: 'math angle =', ans: m }], `Bearings run clockwise from north; math angles run counterclockwise from east. Math angle = 90° − bearing (plus 360° if needed): 90 − ${b}${m !== 90 - b ? ' + 360' : ''} = ${m}°.`);
        return E.num(`A direction has math angle ${m}° (counterclockwise from east). What is its bearing?`, [{ label: 'bearing =', ans: b }], `Bearing = 90° − math angle (plus 360° if needed): 90 − ${m}${b !== 90 - m ? ' + 360' : ''} = ${b}, written ${pad3(b)}°.`); }
      if (mode === 1) { const a = R.int(5, 85), q = R.int(0, 3), lab = ['N', 'S', 'S', 'N'][q] + ' ' + a + '° ' + ['E', 'E', 'W', 'W'][q], ans = [a, 180 - a, 180 + a, 360 - a][q];
        return E.num(`Write the direction ${lab} as a bearing.`, [{ label: 'bearing =', ans }], `${lab} means start facing ${q === 0 || q === 3 ? 'north' : 'south'} and turn ${a}° toward ${q < 2 ? 'east' : 'west'}. Clockwise from north that is ${['', '180° − ', '180° + ', '360° − '][q]}${a}° = ${pad3(ans)}°.`); }
      const b = R.int(1, 71) * 5, back = (b + 180) % 360, L = R.pick([['A', 'B'], ['P', 'Q'], ['H', 'K']]);
      return E.num(`${L[1]} is on a bearing of ${pad3(b)}° from ${L[0]}. What is the bearing of ${L[0]} from ${L[1]}?`, [{ label: 'bearing =', ans: back }], `The way back points the opposite way: ${b}° ${b < 180 ? '+' : '−'} 180° = ${pad3(back)}°.`); } },
    b: { t: 'draw the route', g: R => { const { b1, b2, ang } = pickRoute(R), d1 = R.int(4, 12) * 5, d2 = R.int(Math.max(4, Math.ceil(d1 / 15)), Math.min(12, Math.floor(d1 / 5 * 2.5))) * 5, L = PL(R), un = R.pick(['km', 'mi', 'nautical miles']);
      const pre = `A boat sails from ${L[0]} on a bearing of ${pad3(b1)}° to ${L[1]}, then on a bearing of ${pad3(b2)}° to ${L[2]}.`;
      if (R.bool()) return E.num(`${pre} Find ∠${L[0]}${L[1]}${L[2]}, the angle inside the triangle at ${L[1]}.`, [{ label: `∠${L[0]}${L[1]}${L[2]} =`, ans: ang }],
        `At ${L[1]}, the way back to ${L[0]} has bearing ${b1}° ${b1 < 180 ? '+' : '−'} 180° = ${pad3((b1 + 180) % 360)}°. The angle between bearings ${pad3((b1 + 180) % 360)}° and ${pad3(b2)}° is ${ang}°.`, { visual: routeFig(route(b1, d1, b2, d2), L, { b1, b2 }) });
      const pics = [dirOf, b => [Math.cos(rad(b)), Math.sin(rad(b))], b => [-Math.sin(rad(b)), Math.cos(rad(b))], b => [Math.sin(rad(b)), -Math.cos(rad(b))]].map(f => routeFig(route(b1, d1, b2, d2, f), L, { w: 170 }));
      if (new Set(pics).size < 4) return E.num(`${pre} Find ∠${L[0]}${L[1]}${L[2]}, the angle inside the triangle at ${L[1]}.`, [{ label: `∠${L[0]}${L[1]}${L[2]} =`, ans: ang }], `At ${L[1]}, the way back to ${L[0]} has bearing ${pad3((b1 + 180) % 360)}°, and the angle between that and ${pad3(b2)}° is ${ang}°.`, { visual: routeFig(route(b1, d1, b2, d2), L, { b1, b2 }) });
      return E.choice(R, `${pre} The legs are ${d1} and ${d2} ${un} long. Which picture shows the route? (North is up.)`, pics[0], pics.slice(1),
        `Bearings turn clockwise from north: ${pad3(b1)}° is ${compass(b1)} and ${pad3(b2)}° is ${compass(b2)}. The other pictures measure from east, or turn counterclockwise.`); } },
    c: { t: 'solve for distance', g: R => { let r, d1, d2, x; do { r = pickRoute(R); d1 = R.int(4, 30) * 5; d2 = R.int(4, 30) * 5; x = Math.sqrt(d1 * d1 + d2 * d2 - 2 * d1 * d2 * cd(r.ang)); } while (edge(x) || d1 > 3 * d2 || d2 > 3 * d1);
      const L = PL(R), un = R.pick(['km', 'mi']);
      return E.num(`A ship sails ${d1} ${un} from ${L[0]} on a bearing of ${pad3(r.b1)}° to ${L[1]}, then ${d2} ${un} on a bearing of ${pad3(r.b2)}° to ${L[2]}. How far is ${L[2]} from ${L[0]}, to 1 decimal place?`, [{ label: 'distance =', ans: x, dp: 1 }],
        `The angle at ${L[1]} is ${r.ang}° (between the back bearing ${pad3((r.b1 + 180) % 360)}° and ${pad3(r.b2)}°). Law of cosines: d² = ${d1}² + ${d2}² − 2(${d1})(${d2}) cos ${r.ang}° ≈ ${f2(x * x)}, so d ≈ ${f1(x)} ${un}.`, { visual: routeFig(route(r.b1, d1, r.b2, d2), L, { b1: r.b1, b2: r.b2, l1: String(d1), l2: String(d2), close: true, l3: 'd' }) }); } },
    d: { t: 'solve for heading', g: R => { let r, d1, d2, P, brg, x, angA;
      do { r = pickRoute(R); d1 = R.int(4, 30) * 5; d2 = R.int(4, 30) * 5; P = route(r.b1, d1, r.b2, d2); brg = (dg(Math.atan2(P.C[0], P.C[1])) + 360) % 360; x = K.dist(P.A, P.C); angA = K.ang3(P.B, P.A, P.C); } while (edge(brg, 1) || edge(angA, 1) || angA < 5 || d1 > 3 * d2 || d2 > 3 * d1);
      const L = PL(R), back = R.bool(0.35), ans = back ? (brg + 180) % 360 : brg, cw = (((brg - r.b1) % 360) + 360) % 360 < 180;
      return E.num(`A plane flies ${d1} km from ${L[0]} on a bearing of ${pad3(r.b1)}° to ${L[1]}, then ${d2} km on a bearing of ${pad3(r.b2)}° to ${L[2]}. Find the bearing ${back ? `of ${L[0]} from ${L[2]} (the heading home)` : `of ${L[2]} from ${L[0]}`}, to the nearest degree.`, [{ label: 'bearing =', ans, dp: 0 }],
        `The angle at ${L[1]} is ${r.ang}°, so ${L[0]}${L[2]}² = ${d1}² + ${d2}² − 2(${d1})(${d2}) cos ${r.ang}°, giving ${L[0]}${L[2]} ≈ ${f2(x)}. Law of sines: sin ∠${L[0]} = ${d2} sin ${r.ang}° ÷ ${f2(x)}, so ∠${L[1]}${L[0]}${L[2]} ≈ ${f1(angA)}°. ${L[2]} is ${cw ? 'clockwise' : 'counterclockwise'} from the first leg, so the bearing of ${L[2]} from ${L[0]} is ${r.b1}° ${cw ? '+' : '−'} ${f1(angA)}° ≈ ${pad3(brg)}°${back ? `, and the way home is ${pad3(brg)}° ${brg < 180 ? '+' : '−'} 180° ≈ ${pad3(ans)}°` : ''}.`,
        { visual: routeFig(P, L, { b1: r.b1, b2: r.b2, l1: String(d1), l2: String(d2), close: true }) }); } },
  });

  /* ================= V.7.09 Surveying problems ================= */
  const towerFig = (R, L, d, al, be, labs = {}) => { const h = d * sd(al) * sd(be) / sd(be - al), xF = d + h / Math.tan(rad(be)), fl = R.bool();
    const P = K.xform({ P: [0, 0], Q: [d, 0], F: [xF, 0], T: [xF, h] }, 0, fl), mp = { P: L[0], Q: L[1], F: L[2], T: L[3] }, Q = K.renamePts(P, mp);
    return K.fig({ pts: Q, segs: [[L[0], L[1], { lab: labs.d }], [L[1], L[2]], [L[2], L[3], { lab: labs.h }], [L[0], L[3]], [L[1], L[3], { lab: labs.qt }]], angles: [[L[1], L[0], L[3], deg(al)], [L[2], L[1], L[3], deg(be)], [L[3], L[2], L[1], '', { right: true }]], w: 290, label: 'two angles of elevation to the top of a tower' }); };
  S('V.7.09', 'Surveying problems', {
    a: { t: 'inaccessible distances', g: (R, O) => { let A, B, d, x, toA; const u = U(O);
      do { A = R.int(35, 85); B = R.int(35, 85); d = R.int(4, 30) * 10; toA = R.bool(); x = d * sd(toA ? B : A) / sd(180 - A - B); } while (180 - A - B < 15 || edge(x) || A === B);
      const L = K.lets(R, 3), Cc = 180 - A - B, t = byAng(A, B, d / sd(Cc)), tgt = toA ? L[0] + L[2] : L[1] + L[2];
      const vis = triFig(R, L, t, { A: deg(A), B: deg(B), AB: `${d} ${u}` });
      return E.num(`A tree ${L[2]} stands across a river. From ${L[0]} and ${L[1]}, ${d} ${u} apart on this bank, the angles to the tree are ∠${L[0]} = ${A}° and ∠${L[1]} = ${B}°. Find ${tgt} to 1 decimal place.`, [{ label: `${tgt} =`, ans: x, dp: 1 }],
        `The angle at the tree is 180° − ${A}° − ${B}° = ${Cc}°, and it faces the baseline. ${DM(`${tgt}/sin(${toA ? B : A}°)=${d}/sin(${Cc}°)`)}, so ${tgt} ≈ ${f1(x)} ${u}.`, { visual: vis }); } },
    b: { t: 'two observation points', g: (R, O) => { let al, be, d, h, qt, askH; const u = U(O);
      do { al = R.int(15, 45); be = R.int(al + 10, 68); d = R.int(2, 20) * 10; h = d * sd(al) * sd(be) / sd(be - al); qt = d * sd(al) / sd(be - al); askH = R.bool(0.65); } while (edge(askH ? h : qt) || h > 3 * d || h / Math.tan(rad(be)) < 0.3 * d);
      const L = K.lets(R, 4), [P, Q, F, T] = L, vis = towerFig(R, L, d, al, be, { d: `${d} ${u}`, h: askH ? 'h' : undefined });
      const step = `∠${P}${T}${Q} = ${be}° − ${al}° = ${be - al}° (exterior angle of △${P}${Q}${T}). Law of sines: ${Q}${T} = ${d} sin ${al}° ÷ sin ${be - al}° ≈ ${f2(qt)}.`;
      return E.num(`From ${P} the angle of elevation of the top ${T} of a tower is ${al}°. From ${Q}, ${d} ${u} closer, it is ${be}°. Find ${askH ? `the height h = ${F}${T}` : `the distance ${Q}${T}`} to 1 decimal place.`, [{ label: askH ? 'h =' : `${Q}${T} =`, ans: askH ? h : qt, dp: 1 }],
        askH ? `${step} Then h = ${Q}${T} · sin ${be}° ≈ ${f1(h)} ${u}.` : `${step} So ${Q}${T} ≈ ${f1(qt)} ${u}.`, { visual: vis }); } },
    c: { t: 'land area', g: (R, O) => { const u = U(O), mode = R.int(0, 2), L = K.lets(R, 4);
      if (mode === 0) { let p, q, an, ar; do { p = R.int(3, 25) * 10; q = R.int(3, 25) * 10; an = R.int(30, 150); ar = 0.5 * p * q * sd(an); } while (p === q || edge(ar, 1) || minAng(p, q, Math.sqrt(p * p + q * q - 2 * p * q * cd(an))) < 18);
        return E.num(`A triangular plot has sides ${p} ${u} and ${q} ${u} with an angle of ${an}° between them. Find its area to the nearest square ${u === 'm' ? 'meter' : 'foot'}.`, [{ label: 'area =', ans: ar, dp: 0 }], `Area = ½ · ${p} · ${q} · sin ${an}° ≈ ${Math.round(ar)} ${u}².`,
          { visual: triFig(R, L, { a: p, b: q, c: Math.sqrt(p * p + q * q - 2 * p * q * cd(an)) }, { C: deg(an), BC: `${p} ${u}`, CA: `${q} ${u}` }) }); }
      if (mode === 1) { let s3, ar; do { s3 = [R.int(4, 30) * 10, R.int(4, 30) * 10, R.int(4, 30) * 10]; const s = (s3[0] + s3[1] + s3[2]) / 2; ar = Math.sqrt(s * (s - s3[0]) * (s - s3[1]) * (s - s3[2])); } while (!valid3(...s3, 30) || edge(ar, 1) || minAng(...s3) < 18);
        const s = (s3[0] + s3[1] + s3[2]) / 2;
        return E.num(`A triangular field has sides ${s3.join(' ' + u + ', ')} ${u}. Find its area to the nearest square ${u === 'm' ? 'meter' : 'foot'}.`, [{ label: 'area =', ans: ar, dp: 0 }], `Heron: s = ${s}, area = √(${s} · ${s - s3[0]} · ${s - s3[1]} · ${s - s3[2]}) ≈ ${Math.round(ar)} ${u}².`,
          { visual: triFig(R, L, { a: s3[0], b: s3[1], c: s3[2] }, { BC: `${s3[0]}`, CA: `${s3[1]}`, AB: `${s3[2]}` }) }); }
      let dd, x, y, a1, a2, ar; do { dd = R.int(8, 30) * 10; x = R.int(5, 25) * 10; y = R.int(5, 25) * 10; a1 = R.int(25, 70); a2 = R.int(25, 70); ar = 0.5 * dd * (x * sd(a1) + y * sd(a2)); } while (edge(ar, 1) || x === y || a1 === a2 || a1 + a2 > 130 || x < 0.5 * dd || y < 0.5 * dd || x > 1.2 * dd || y > 1.2 * dd);
      const [A, B, Cc, D] = L, P0 = { A: [0, 0], C: [dd, 0], B: K.polar(x, -a1), D: K.polar(y, a2) }, P = K.renamePts(K.spin(R, P0), { A, B, C: Cc, D });
      const vis = K.fig({ pts: P, segs: [[A, B, { lab: String(x) }], [B, Cc], [Cc, D], [D, A, { lab: String(y) }], [A, Cc, { dash: true, lab: String(dd) }]], angles: [[Cc, A, B, deg(a1)], [D, A, Cc, deg(a2)]], w: 280, label: 'four-sided plot split by a diagonal' });
      return E.num(`A plot ${A}${B}${Cc}${D} is split by the diagonal ${A}${Cc} = ${dd} ${u}. ${A}${B} = ${x} ${u}, ${A}${D} = ${y} ${u}, ∠${Cc}${A}${B} = ${a1}° and ∠${D}${A}${Cc} = ${a2}°. Find the area of the plot to the nearest square ${u === 'm' ? 'meter' : 'foot'}.`, [{ label: 'area =', ans: ar, dp: 0 }],
        `Two triangles, each with two sides and the angle between them: ½ · ${dd} · ${x} · sin ${a1}° + ½ · ${dd} · ${y} · sin ${a2}° ≈ ${f1(0.5 * dd * x * sd(a1))} + ${f1(0.5 * dd * y * sd(a2))} ≈ ${Math.round(ar)} ${u}².`, { visual: vis }); } },
    d: { t: 'check reasonableness', g: (R, O) => { const u = U(O); let A, B, Cc, d, x, cand;
      for (;;) { A = R.int(35, 80); B = R.int(35, 85); Cc = 180 - A - B; d = R.int(5, 30) * 10; if (Cc < 15 || Math.abs(B - Cc) < 10 || Math.abs(A - B) < 6) continue; x = d * sd(B) / sd(Cc);
        const bad = v => v <= 0 || (v - d) * (B - Cc) <= 0 || v > d / sd(Cc) + 1e-6;
        cand = [d * sd(Cc) / sd(B), d * sd(B), d * sd(B) / sd(A), d * Math.sin(B) / Math.sin(Cc)].map(n1).filter(v => bad(v) && Math.abs(v - n1(x)) > 2);
        cand = [...new Set(cand)]; if (cand.length >= 3) break; }
      const L = K.lets(R, 3), sgn = B > Cc;
      return E.choice(R, `From ${L[0]} and ${L[1]}, ${d} ${u} apart, a surveyor sights ${L[2]}: ∠${L[0]} = ${A}° and ∠${L[1]} = ${B}°. Which value of ${L[0]}${L[2]} is reasonable?`, `${f1(x)} ${u}`, R.sample(cand, 3).map(v => `${v.toFixed(1)} ${u}`),
        `∠${L[2]} = ${Cc}° faces the baseline ${d} ${u}, and ${L[0]}${L[2]} faces ∠${L[1]} = ${B}°. ${sgn ? `${B}° > ${Cc}°, so ${L[0]}${L[2]} must be longer than ${d}` : `${B}° < ${Cc}°, so ${L[0]}${L[2]} must be shorter than ${d}`}, and no side can exceed ${d} ÷ sin ${Cc}° ≈ ${f1(d / sd(Cc))}. Only ${f1(x)} = ${d} sin ${B}° ÷ sin ${Cc}° passes.`, { visual: triFig(R, L, byAng(A, B, d / sd(Cc)), { A: deg(A), B: deg(B), AB: `${d} ${u}` }) }); } },
  });
})(typeof window !== 'undefined' ? window : globalThis);
