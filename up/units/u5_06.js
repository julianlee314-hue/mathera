/* Era V · Unit V.6 Right-triangle trig (V.6.01–V.6.14) */
(function (G) {
  const E = G.E5, V = E.V, C = E.C, M = s => E.mx(s), K = E.K;
  const S = (id, name, steps) => E.skill({ id, name, steps });

  /* ================= helpers ================= */
  // MathML that understands degrees, θ, inverse trig and words: TM('x=12sin(35°)'), TM('arcsin(0.4)'), TM('sin(θ)=[[opposite]]/[[hypotenuse]]')
  const TM = s => {
    const keep = [], tok = v => { keep.push(v); return String(9876500 + keep.length - 1); };
    const t = String(s).replace(/\[\[([^\]]+)\]\]/g, (m, w) => tok({ w })).replace(/(\d+(?:\.\d+)?)°/g, (m, n) => tok({ d: n })).replace(/θ/g, 'w');
    let h = M(t);
    keep.forEach((k, i) => { h = h.split(`<mn>${9876500 + i}</mn>`).join(k.w ? `<mtext>${k.w}</mtext>` : `<mn>${k.d}°</mn>`); });
    return h.replace(/<mi>w<\/mi>/g, '<mi>θ</mi>').replace(/<mi>arc(sin|cos|tan)<\/mi>/g, '<msup><mi>$1</mi><mrow><mo>−</mo><mn>1</mn></mrow></msup>');
  };
  const fx = (x, dp = 1) => String(+x.toFixed(dp));                       // display a rounded number
  const okR = (x, dp = 1) => { const v = Math.abs(x) * Math.pow(10, dp), fr = v - Math.floor(v); return Math.abs(fr - 0.5) > 0.06; };   // not near a rounding tie
  const trig = (f, d) => Math[f](K.rad(d));
  const inv = (f, v) => K.dg(Math['a' + f](v));
  const unitOf = O => O && O.units === 'imperial' ? 'ft' : 'm';
  const NAME = { sin: 'sine', cos: 'cosine', tan: 'tangent' };
  const ROLE = { opp: 'opposite', adj: 'adjacent', hyp: 'hypotenuse' };
  const PAIR = { sin: ['opp', 'hyp'], cos: ['adj', 'hyp'], tan: ['opp', 'adj'] };
  const TRIP = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29], [9, 40, 41], [12, 35, 37]];
  const nm2 = (p, q) => [p, q].sort().join('');
  const ex = (num, sq = 1, den = 1) => E.surdStr(0, num, sq, den);       // num·√sq/den, reduced
  const rt = q => ex(1, q);                                                // √q simplified
  const ratioEx = (sx, sy) => E.surdStr(0, 1, sx * sy, sy);                // √sx / √sy, exact and reduced
  const pt = s => E.pt(s);
  // all three sides from θ and one known side
  const sidesFrom = (th, role, v) => { const h = role === 'hyp' ? v : role === 'opp' ? v / trig('sin', th) : v / trig('cos', th); return { hyp: h, opp: h * trig('sin', th), adj: h * trig('cos', th) }; };
  const pickTrip = R => { const t = R.pick(TRIP), k = t[2] <= 13 ? R.int(1, 3) : 1, sw = R.bool(); return { opp: (sw ? t[1] : t[0]) * k, adj: (sw ? t[0] : t[1]) * k, hyp: t[2] * k }; };

  /* ----- figures ----- */
  // right triangle: right angle at C, the angle of interest at A. a = BC (opposite A), b = CA (adjacent to A).
  // labs: {AB, BC, CA, A, B} — side labels and angle labels. o.still keeps the base level (only mirrored).
  const rtri = (R, a, b, labs = {}, o = {}) => {
    const L = o.L || K.trio(R), n = { A: L[0], B: L[1], C: L[2] }, base = { A: [b, 0], B: [0, a], C: [0, 0] };
    const P = K.renamePts(o.still ? K.xform(base, 0, R.bool()) : K.spin(R, base), n);
    const segs = [[n.A, n.B, { lab: labs.AB }], [n.B, n.C, { lab: labs.BC }], [n.C, n.A, { lab: labs.CA }]];
    const angles = [[n.A, n.C, n.B, '', { right: true }]];
    if (labs.A !== undefined) angles.push([n.B, n.A, n.C, labs.A]);
    if (labs.B !== undefined) angles.push([n.C, n.B, n.A, labs.B, { n: labs.A !== undefined ? 2 : 1 }]);
    const side = { hyp: nm2(n.A, n.B), opp: nm2(n.B, n.C), adj: nm2(n.C, n.A) };
    return { n, P, side, vis: K.fig({ pts: P, segs, angles, w: o.w || 250, label: o.label || 'right triangle' }) };
  };
  const labsRole = r => ({ AB: r.hyp, BC: r.opp, CA: r.adj });
  // triangle split by the altitude AD: angle Bd at B, Cd at C, altitude h
  const altFig = (R, Bd, Cd, h, labs, L) => {
    const bd = h / trig('tan', Bd), dc = h / trig('tan', Cd), base = { A: [bd, h], B: [0, 0], C: [bd + dc, 0], D: [bd, 0] };
    const [A, B, Cc, D] = L, P = K.renamePts(K.spin(R, base), { A, B, C: Cc, D });
    return K.fig({ pts: P, segs: [[A, B, { lab: labs.AB }], [B, D, { lab: labs.BD }], [D, Cc, { lab: labs.DC }], [Cc, A, { lab: labs.CA }], [A, D, { dash: true, lab: labs.AD }]],
      angles: [[A, D, B, '', { right: true }], [A, B, D, labs.B || ''], [D, Cc, A, labs.C || '', { n: 2 }]], w: 280, label: 'triangle split by an altitude' });
  };

  /* ----- short proofs: lines [statement, reason, deps, [3 wrong reasons], why]; mode 'order' | 'reason' | 'broken' (breaks: [{i, st|rs, why}]) ----- */
  const twoCol = (rows, hide) => `<table class="dt"><tr><th>#</th><th>Statement</th><th>Reason</th></tr>${rows.map((r, i) => `<tr><td>${i + 1}</td><td>${r[0]}</td><td>${i === hide ? '<b>?</b>' : r[1]}</td></tr>`).join('')}</table>`;
  const proof = (R, mode, cfg) => {
    const L = cfg.lines, fixed = cfg.fixed ?? 1, head = cfg.head, vis = cfg.vis ? { visual: cfg.vis } : {};
    if (mode === 'order') return K.orderQ(R, `${head} Put the steps of the proof in order.`, L.map(l => `${l[0]} <i>(${l[1]})</i>`), L.map(l => l[2]), cfg.oexp, Object.assign({ fixed }, vis));
    if (mode === 'reason') { const cand = L.map((l, i) => i).filter(i => i >= fixed && L[i][3]), k = R.pick(cand), [st, rs, , wr, why] = L[k];
      return E.choice(R, `${head} What is the reason for step ${k + 1}?${twoCol(L.map(l => [l[0], l[1]]), k)}`, rs, wr, `Step ${k + 1}, ${st}, holds because ${why}.`, vis); }
    const b = R.pick(cfg.breaks), rows = L.map((l, i) => i === b.i ? [b.st || l[0], b.rs || l[1]] : [l[0], l[1]]), opts = L.map((l, i) => i).filter(i => i >= fixed);
    return E.choiceFixed(`${head} Exactly one step of this proof is wrong. Which one?${twoCol(rows, -1)}`, opts.map(i => `Step ${i + 1}`), opts.indexOf(b.i), `Step ${b.i + 1} is wrong: ${b.why}.`, vis);
  };
  const pmode = R => R.pick(['order', 'order', 'reason', 'broken']);

  /* ================= V.6.01 Naming the sides ================= */
  const sideFig = (R, o = {}) => { const th = R.int(26, 64); return rtri(R, Math.sin(K.rad(th)), Math.cos(K.rad(th)), o.labs || {}, o); };
  const textTri = R => { const L = K.trio(R), r = R.int(0, 2), others = L.filter((_, i) => i !== r); return { L, r: L[r], o: others }; };
  S('V.6.01', 'Naming the sides', {
    a: { t: 'hypotenuse', g: R => {
      if (R.bool(0.35)) { const { L, r, o } = textTri(R), hyp = nm2(o[0], o[1]);
        return E.choice(R, `In △${L.join('')}, ∠${r} = 90°. Which side is the hypotenuse?`, hyp, [nm2(r, o[0]), nm2(r, o[1])], `The hypotenuse is the side opposite the right angle. ∠${r} is the right angle, so the hypotenuse is ${hyp}, the side that does not touch ${r}.`); }
      const f = sideFig(R), { side, n } = f;
      return E.choice(R, `Which side of △${n.A}${n.B}${n.C} is the hypotenuse?`, side.hyp, [side.opp, side.adj], `The hypotenuse is opposite the right angle at ${n.C}. It is ${side.hyp}, and it is always the longest side.`, { visual: f.vis }); } },
    b: { t: 'opposite', g: R => {
      if (R.bool(0.35)) { const { L, r, o } = textTri(R), [a, b] = R.shuffle(o.slice()), opp = nm2(r, b);
        return E.choice(R, `In △${L.join('')}, ∠${r} = 90°. Which side is opposite ∠${a}?`, opp, [nm2(r, a), nm2(a, b)], `The side opposite ∠${a} is the one that does not touch ${a}: ${opp}.`); }
      const useTh = R.bool(), f = sideFig(R, { labs: useTh ? { A: 'θ' } : {} }), { side, n } = f, ang = useTh ? 'θ' : `∠${n.A}`;
      return E.choice(R, `Which side is opposite ${ang}?`, side.opp, [side.adj, side.hyp], `The opposite side is across from ${ang}; it does not touch ${n.A}. That is ${side.opp}.`, { visual: f.vis }); } },
    c: { t: 'adjacent', g: R => {
      if (R.bool(0.35)) { const { L, r, o } = textTri(R), [a, b] = R.shuffle(o.slice()), adj = nm2(r, a);
        return E.choice(R, `In △${L.join('')}, ∠${r} = 90°. Which side is adjacent to ∠${a}?`, adj, [nm2(a, b), nm2(r, b)], `Two sides touch ${a}: ${adj} and ${nm2(a, b)}. ${nm2(a, b)} is the hypotenuse (opposite the right angle), so the adjacent side is the leg ${adj}.`); }
      const useTh = R.bool(), f = sideFig(R, { labs: useTh ? { A: 'θ' } : {} }), { side, n } = f, ang = useTh ? 'θ' : `∠${n.A}`;
      return E.choice(R, `Which side is adjacent to ${ang}?`, side.adj, [side.hyp, side.opp], `Both ${side.adj} and ${side.hyp} touch ${n.A}, but ${side.hyp} is the hypotenuse. Adjacent means the leg next to the angle: ${side.adj}.`, { visual: f.vis }); } },
    d: { t: 'they change with the angle', g: R => {
      const OPTS = ['opposite', 'adjacent', 'hypotenuse'], want = R.int(0, 2), f = sideFig(R, { labs: { A: '', B: '' } }), { side, n } = f;
      // relative to B: opposite is CA, adjacent is BC, hypotenuse AB
      const sd = [side.adj, side.opp, side.hyp][want], fromA = ['adjacent', 'opposite', 'hypotenuse'][want];
      const lead = want < 2 && R.bool(0.6) ? `${sd} is ${fromA === 'adjacent' ? 'adjacent to' : 'opposite'} ∠${n.A}. ` : '';
      return E.choiceFixed(`${lead}Relative to ∠${n.B}, what is side ${sd}?`, OPTS, want,
        want === 2 ? `${sd} is opposite the right angle, so it is the hypotenuse from either acute angle.` : `From ∠${n.B}, ${sd} ${want === 0 ? 'is across the triangle, not touching ' + n.B + ', so it is opposite' : 'is the leg touching ' + n.B + ', so it is adjacent'}. The two legs swap names when you switch angles; from ∠${n.A} it is ${fromA}.`, { visual: f.vis }); } },
  });

  /* ================= V.6.02 Trig ratios from similarity ================= */
  const ratioTxt = (f, o) => ({ sin: [o.opp, o.hyp], cos: [o.adj, o.hyp], tan: [o.opp, o.adj] })[f];
  S('V.6.02', 'Trig ratios from similarity', {
    a: { t: 'same angle, same ratio', g: R => {
      if (R.bool(0.35)) { const f = R.pick(['sin', 'cos', 'tan']), L = K.lets(R, 6), [A, B, Cc, D, Ee, F] = L, t = R.int(28, 62), m = R.pick([1.45, 1.6, 0.62, 0.7]), c = Math.cos(K.rad(t)), s = Math.sin(K.rad(t));
        const P = K.pairPts(R, { A: [c, 0], B: [0, s], C: [0, 0] }, { A: [m * c, 0], B: [0, m * s], C: [0, 0] }, { A, B, C: Cc }, { A: D, B: Ee, C: F });
        const tri = n => ({ segs: [[n[0], n[1]], [n[1], n[2]], [n[2], n[0]]], angles: [[n[0], n[2], n[1], '', { right: true }], [n[1], n[0], n[2], 'θ']] }), T1 = tri([A, B, Cc]), T2 = tri([D, Ee, F]);
        const vis = K.fig({ pts: P, segs: [...T1.segs, ...T2.segs], angles: [...T1.angles, ...T2.angles], w: 340, label: 'two right triangles with the same angle θ' });
        const sd = { sin: [[B + Cc, A + B], [Ee + F, D + Ee]], cos: [[A + Cc, A + B], [D + F, D + Ee]], tan: [[B + Cc, A + Cc], [Ee + F, D + F]] }[f], [[t1, b1], [t2, b2]] = sd;
        const others = ['sin', 'cos', 'tan'].filter(g => g !== f).map(g => `definition of ${NAME[g]}`);
        const lines = [[`∠${Cc} = ∠${F} = 90° and ∠${A} = ∠${D} = θ`, 'given', []],
          [`△${A}${B}${Cc} ∼ △${D}${Ee}${F}`, 'AA similarity', [0], ['SAS similarity', 'SSS similarity', 'ASA congruence'], 'two pairs of angles are equal: the right angles and θ'],
          [`${t1}/${t2} = ${b1}/${b2}`, 'corresponding sides of similar triangles are proportional', [1], ['CPCTC', 'AA similarity', 'reflexive property'], 'the triangles are similar, so matching sides are in the same ratio'],
          [`${t1}/${b1} = ${t2}/${b2}`, 'multiplication property of equality', [2], ['corresponding sides of similar triangles are proportional', 'AA similarity', 'reflexive property'], `multiplying both sides by ${t2}/${b1} gives it`],
          [`${f} ${A} = ${f} ${D}`, `definition of ${NAME[f]}`, [3], [...others, 'AA similarity'], `${f} ${A} = ${t1}/${b1} and ${f} ${D} = ${t2}/${b2}`]];
        return proof(R, pmode(R), { head: `Given: ${lines[0][0]}. Prove: ${f} ${A} = ${f} ${D}, so the ${NAME[f]} of θ does not depend on the size of the triangle.`, lines, vis,
          oexp: `Equal angles make the triangles similar (AA), similar triangles have proportional sides, and rearranging puts each triangle's two sides in one ratio: that ratio is the ${NAME[f]}.`,
          breaks: [{ i: 1, rs: 'ASA congruence', why: 'only angles are known and the triangles can be different sizes, so they are similar (AA similarity), not congruent' },
            { i: 2, rs: 'CPCTC', why: 'CPCTC needs congruent triangles; these are only similar, so matching sides are proportional, not equal' },
            { i: 3, st: `${t1}/${b1} = ${b2}/${t2}`, why: `multiplying ${t1}/${t2} = ${b1}/${b2} by ${t2}/${b1} gives ${t1}/${b1} = ${t2}/${b2}; the second ratio is upside down` }] }); }
      if (R.bool(0.3)) { const yes = R.bool(), f = R.pick(['sin', 'cos', 'tan']), [t, b] = PAIR[f], k = R.int(2, 5);
        const st = yes ? R.pick([`Two right triangles have the same acute angle θ. The ratio ${ROLE[t]} ÷ ${ROLE[b]} is the same in both.`, `A right triangle is enlarged by a scale factor of ${k}. Its ${NAME[f]} ratio for θ does not change.`])
          : R.pick([`Two right triangles have the same acute angle θ. The bigger one has the larger ratio ${ROLE[t]} ÷ ${ROLE[b]}.`, `A right triangle is enlarged by a scale factor of ${k}. Its ${NAME[f]} ratio for θ becomes ${k} times as big.`]);
        return E.tf(`True or false? ${st}`, yes, `Same angles make similar triangles, so every side is scaled by the same factor. The factor cancels in ${ROLE[t]} ÷ ${ROLE[b]}, so the ratio stays the same.`); }
      const t = R.pick([[3, 4, 5], [5, 12, 13], [8, 15, 17], [20, 21, 29]]), sw = R.bool(), s1 = { opp: sw ? t[1] : t[0], adj: sw ? t[0] : t[1], hyp: t[2] }, m = R.pick([2, 2, 3]), s2 = { opp: s1.opp * m, adj: s1.adj * m, hyp: s1.hyp * m };
      const kn = R.pick(['opp', 'adj', 'hyp']), ask = R.pick(['opp', 'adj', 'hyp'].filter(r => r !== kn)), L = K.lets(R, 6), n1 = { A: L[0], B: L[1], C: L[2] }, n2 = { A: L[3], B: L[4], C: L[5] };
      const P = K.pairPts(R, { A: [s1.adj, 0], B: [0, s1.opp], C: [0, 0] }, { A: [s2.adj, 0], B: [0, s2.opp], C: [0, 0] }, n1, n2);
      const l1 = labsRole({ opp: String(s1.opp), adj: String(s1.adj), hyp: String(s1.hyp) }), l2 = labsRole({ [kn]: String(s2[kn]), [ask]: 'x' });
      const tri = (n, lb) => ({ segs: [[n.A, n.B, { lab: lb.AB }], [n.B, n.C, { lab: lb.BC }], [n.C, n.A, { lab: lb.CA }]], angles: [[n.A, n.C, n.B, '', { right: true }], [n.B, n.A, n.C, 'θ']] });
      const T1 = tri(n1, l1), T2 = tri(n2, l2), vis = K.fig({ pts: P, segs: [...T1.segs, ...T2.segs], angles: [...T1.angles, ...T2.angles], w: 340, label: 'two similar right triangles' });
      return E.num('Both right triangles have the same angle θ. Find x.', [{ label: 'x =', ans: s2[ask] }],
        `Same angle θ, so the triangles are similar and the ratio ${ROLE[ask]} ÷ ${ROLE[kn]} matches: ${M(`x/${s2[kn]}=${s1[ask]}/${s1[kn]}`)}, so x = ${s2[kn]} × ${s1[ask]}/${s1[kn]} = ${s2[ask]}.`, { visual: vis }); } },
    b: { t: 'measure and compare', g: R => {
      if (R.bool(0.4)) { const th = R.int(25, 65), f = R.pick(['sin', 'cos', 'tan']), [t, b] = PAIR[f]; let oth;
        do oth = th + R.pick([-1, 1]) * R.int(8, 18); while (oth < 15 || oth > 75);
        const bad = R.int(0, 2), hs = R.distinct(4, 16, 3), rows = [0, 1, 2].map(i => { const a = i === bad ? oth : th, hb = hs[i], s = sidesFrom(a, 'hyp', hb), v = { opp: +s.opp.toFixed(1), adj: +s.adj.toFixed(1), hyp: hb }; return { v, r: v[t] / v[b] }; });
        const good = rows.filter((_, i) => i !== bad).map(x => x.r);
        if (Math.abs(rows[bad].r - good[0]) < 0.08 || Math.abs(rows[bad].r - good[1]) < 0.08) return S_02b(R);
        const tab = `<table class="dt"><tr><th>Triangle</th><th>${ROLE[t]}</th><th>${ROLE[b]}</th></tr>${rows.map((x, i) => `<tr><td>${i + 1}</td><td>${x.v[t]}</td><td>${x.v[b]}</td></tr>`).join('')}</table>`;
        return E.choice(R, `The sides of three right triangles were measured. Two of them have the same acute angle θ. Which triangle has a different angle θ?${tab}`, `Triangle ${bad + 1}`, [0, 1, 2].filter(i => i !== bad).map(i => `Triangle ${i + 1}`),
          `Compare ${ROLE[t]} ÷ ${ROLE[b]}: ${rows.map((x, i) => `${i + 1}: ${fx(x.r, 2)}`).join(', ')}. Equal angles give equal ratios, so triangle ${bad + 1} is the odd one out.`); }
      return S_02b(R); } },
    c: { t: 'SOH-CAH-TOA', g: R => {
      const s = pickTrip(R), f = R.pick(['sin', 'cos', 'tan']), fr = (p, q) => M(E.fracStr(p, q)), [p, q] = ratioTxt(f, s);
      const wrong = { sin: [ratioTxt('cos', s), ratioTxt('tan', s), [s.hyp, s.opp]], cos: [ratioTxt('sin', s), [s.adj, s.opp], [s.hyp, s.adj]], tan: [ratioTxt('sin', s), ratioTxt('cos', s), [s.adj, s.opp]] }[f];
      const useTh = R.bool(), lab = labsRole({ opp: String(s.opp), adj: String(s.adj), hyp: String(s.hyp) }), fg = rtri(R, s.opp, s.adj, { ...lab, A: useTh ? 'θ' : undefined }), ang = useTh ? 'θ' : fg.n.A;
      const [t, b] = PAIR[f];
      return E.choice(R, `What is ${TM(`${f}(${useTh ? 'θ' : 'A'})`).replace('<mi>A</mi>', `<mi>${ang}</mi>`)}?`, fr(p, q), wrong.map(w => fr(w[0], w[1])),
        `${f === 'sin' ? 'SOH: sine = opposite/hypotenuse' : f === 'cos' ? 'CAH: cosine = adjacent/hypotenuse' : 'TOA: tangent = opposite/adjacent (no hypotenuse)'}. Relative to ${useTh ? 'θ' : '∠' + ang}, that is ${s[t]}/${s[b]}${E.fracStr(p, q) !== p + '/' + q ? ' = ' + pt(E.fracStr(p, q)) : ''}.`, { visual: fg.vis }); } },
    d: { t: 'write all three ratios', g: R => {
      let sq; // squared sides
      if (R.bool(0.65)) { const s = pickTrip(R); sq = { opp: s.opp ** 2, adj: s.adj ** 2, hyp: s.hyp ** 2 }; }
      else { let a, b, c; do { a = R.int(1, 7); b = R.int(1, 7); c = a * a + b * b; } while (a === b || Number.isInteger(Math.sqrt(c))); sq = R.bool() ? { opp: a * a, adj: b * b, hyp: c } : { opp: a * a, adj: c - a * a, hyp: c }; if (sq.adj === sq.opp) sq.adj = b * b; }
      const roles = ['opp', 'adj', 'hyp'], miss = R.pick(roles), lab = {}; roles.forEach(r => lab[r] = r === miss ? undefined : pt(rt(sq[r])));
      const fg = rtri(R, Math.sqrt(sq.opp), Math.sqrt(sq.adj), { ...labsRole(lab), A: 'θ' });
      const sv = ratioEx(sq.opp, sq.hyp), cv = ratioEx(sq.adj, sq.hyp), tv = ratioEx(sq.opp, sq.adj);
      const third = miss === 'hyp' ? `${pt(rt(sq.opp))}² + ${pt(rt(sq.adj))}² = ${sq.hyp}` : `${pt(rt(sq.hyp))}² − ${pt(rt(sq[miss === 'opp' ? 'adj' : 'opp']))}² = ${sq[miss]}`;
      return E.num('Find sin θ, cos θ and tan θ. Give exact answers.', [{ label: 'sin θ =', exact: sv }, { label: 'cos θ =', exact: cv }, { label: 'tan θ =', exact: tv }],
        `Pythagoras gives the missing side: ${third}, so it is ${pt(rt(sq[miss]))}. Then sin θ = opp/hyp = ${pt(sv)}, cos θ = adj/hyp = ${pt(cv)}, tan θ = opp/adj = ${pt(tv)}.`, { visual: fg.vis }); } },
  });
  // V.6.02 b: one measured triangle, compute a ratio
  function S_02b(R) {
    const th = R.int(25, 65), f = R.pick(['sin', 'cos', 'tan']), [t, b] = PAIR[f], H = R.int(5, 15), s = sidesFrom(th, 'hyp', H);
    const v = { opp: +s.opp.toFixed(1), adj: +s.adj.toFixed(1), hyp: H }, r = v[t] / v[b];
    if (!okR(r, 2)) return S_02b(R);
    const fg = rtri(R, s.opp, s.adj, { ...labsRole({ opp: String(v.opp), adj: String(v.adj), hyp: String(v.hyp) }), A: th + '°' });
    return E.num(`The sides of this right triangle were measured. Find ${ROLE[t]} ÷ ${ROLE[b]} for the ${th}° angle, to 2 decimal places.`, [{ ans: r, dp: 2 }],
      `${v[t]} ÷ ${v[b]} ≈ ${fx(r, 2)}. Every right triangle with a ${th}° angle gives about this same ratio; it is ${f} ${th}° ≈ ${fx(trig(f, th), 2)}.`, { visual: fg.vis });
  }

  /* ================= V.6.03–05 Find a side with sine / cosine / tangent ================= */
  const chooseQ = (R, fn) => {
    const th = R.int(22, 68), yn = R.bool(); let f2;
    if (yn) f2 = R.bool() ? fn : R.pick(Object.keys(PAIR).filter(f => f !== fn)); else f2 = R.pick(['sin', 'cos', 'tan']);
    const [r1, r2] = R.shuffle(PAIR[f2].slice()), v = R.int(5, 24), s = sidesFrom(th, r1, v), fg = rtri(R, s.opp, s.adj, { ...labsRole({ [r1]: String(v), [r2]: 'x' }), A: th + '°' });
    const why = `From the ${th}° angle, ${v} is the ${ROLE[r1]} and x is the ${ROLE[r2]}. ${NAME[f2][0].toUpperCase() + NAME[f2].slice(1)} links the ${ROLE[PAIR[f2][0]]} and the ${ROLE[PAIR[f2][1]]}`;
    if (yn) return E.tf(`Should you use ${NAME[fn]} to find x?`, f2 === fn, `${why}, so ${f2 === fn ? 'yes' : `use ${NAME[f2]}, not ${NAME[fn]}`}.`, { choices: ['Yes', 'No'], visual: fg.vis });
    return E.choice(R, 'Which should you use to find x?', NAME[f2], ['sine', 'cosine', 'tangent', 'the Pythagorean theorem'].filter(x => x !== NAME[f2]),
      `${why}. (The Pythagorean theorem needs two known sides.)`, { visual: fg.vis });
  };
  const setQ = (R, fn) => {
    const th = R.int(22, 68), top = R.bool(), [rt0, rb] = PAIR[fn], kn = top ? rb : rt0, unk = top ? rt0 : rb, v = R.int(4, 25), s = sidesFrom(th, kn, v);
    const fr = top ? `x/${v}` : `${v}/x`, flip = top ? `${v}/x` : `x/${v}`, others = Object.keys(PAIR).filter(f => f !== fn);
    const fg = rtri(R, s.opp, s.adj, { ...labsRole({ [kn]: String(v), [unk]: 'x' }), A: th + '°' });
    return E.choice(R, 'Which equation is correct?', TM(`${fn}(${th}°)=${fr}`), [TM(`${fn}(${th}°)=${flip}`), ...others.map(g => TM(`${g}(${th}°)=${fr}`))],
      `x is the ${ROLE[unk]} and ${v} is the ${ROLE[kn]}. ${TM(`${fn}(θ)=[[${ROLE[rt0]}]]/[[${ROLE[rb]}]]`)}, so ${TM(`${fn}(${th}°)=${fr}`)}.`, { visual: fg.vis });
  };
  const CTX = {
    sin: [(v, th, u) => `A ramp rises ${v} ${u} and makes a ${th}° angle with the ground. How long is the ramp?`, (v, th, u) => `A kite flies ${v} ${u} above the ground. Its straight string makes a ${th}° angle with the ground. How long is the string?`],
    cos: [(v, th, u) => `The foot of a ladder is ${v} ${u} from a wall, and the ladder makes a ${th}° angle with the ground. How long is the ladder?`, (v, th, u) => `A guy wire is fixed to the ground ${v} ${u} from the foot of a pole and makes a ${th}° angle with the ground. How long is the wire?`],
    tan: [(v, th, u) => `A ${v} ${u} pole stands on level ground. The sun is ${th}° above the horizon. How long is the pole’s shadow?`, (v, th, u) => `A ladder reaches ${v} ${u} up a wall and makes a ${th}° angle with the ground. How far is its foot from the wall?`],
  };
  const CTXR = { sin: [[4, 15, 1, 4], [30, 70, 10, 60]], cos: [[60, 78, 1, 3], [45, 70, 3, 15]], tan: [[25, 65, 2, 12], [60, 78, 3, 9]] };   // [thLo, thHi, vLo, vHi]
  const solveQ = (R, fn, top, O) => {
    const [rt0, rb] = PAIR[fn], kn = top ? rb : rt0, unk = top ? rt0 : rb;
    if (!top && R.bool(0.4)) { const k = R.int(0, 1), [a, b, lo, hi] = CTXR[fn][k], th = R.int(a, b), v = hi <= 4 ? R.int(lo * 10, hi * 10) / 10 : R.int(lo, hi), x = v / trig(fn, th), u = unitOf(O);
      if (!okR(x)) return solveQ(R, fn, top, O);
      return E.num(`${CTX[fn][k](v, th, u)} Give your answer to 1 decimal place.`, [{ ans: x, dp: 1 }],
        `The ${ROLE[kn]} is ${v} and the ${ROLE[unk]} is unknown: ${TM(`${fn}(${th}°)=${v}/x`)}, so ${TM(`x=${v}/${fn}(${th}°)≈${fx(x)}`)} ${u}.`); }
    const th = R.int(18, 72), v = R.bool(0.3) ? R.int(25, 180) / 10 : R.int(4, 30), x = top ? v * trig(fn, th) : v / trig(fn, th);
    if (!okR(x)) return solveQ(R, fn, top, O);
    const s = sidesFrom(th, kn, v), fg = rtri(R, s.opp, s.adj, { ...labsRole({ [kn]: String(v), [unk]: 'x' }), A: th + '°' });
    const wrongNote = !top ? ` (Multiplying would give ${fx(v * trig(fn, th))}, but the hypotenuse must be longer than ${v}.)` : '';
    return E.num('Find x to 1 decimal place.', [{ label: 'x =', ans: x, dp: 1 }],
      top ? `${TM(`${fn}(${th}°)=x/${v}`)}, so ${TM(`x=${v}${fn}(${th}°)≈${fx(x)}`)}.` : `${TM(`${fn}(${th}°)=${v}/x`)}. The unknown is on the bottom, so divide: ${TM(`x=${v}/${fn}(${th}°)≈${fx(x)}`)}.${fn === 'tan' ? '' : wrongNote}`, { visual: fg.vis });
  };
  [['V.6.03', 'Find a side with sine', 'sin'], ['V.6.04', 'Find a side with cosine', 'cos'], ['V.6.05', 'Find a side with tangent', 'tan']].forEach(([id, name, fn]) => S(id, name, {
    a: { t: `choose ${NAME[fn]}`, g: R => chooseQ(R, fn) },
    b: { t: 'set up', g: R => setQ(R, fn) },
    c: { t: 'unknown on top', g: (R, O) => solveQ(R, fn, true, O) },
    d: { t: 'unknown on the bottom', g: (R, O) => solveQ(R, fn, false, O) },
  }));

  /* ================= V.6.06 Find an angle ================= */
  const SPEC = [['sin', '1/2', 30], ['sin', 'sqrt(2)/2', 45], ['sin', 'sqrt(3)/2', 60], ['cos', '1/2', 60], ['cos', 'sqrt(2)/2', 45], ['cos', 'sqrt(3)/2', 30], ['tan', '1', 45], ['tan', 'sqrt(3)', 60], ['tan', 'sqrt(3)/3', 30]];
  S('V.6.06', 'Find an angle', {
    a: { t: 'inverse trig meaning', g: R => {
      if (R.bool(0.45)) { const f = R.pick(['sin', 'cos', 'tan']), v = R.pick(['0.2', '0.3', '0.4', '0.6', '0.7', '0.8', '0.25', '0.75']);
        return E.choice(R, `What does ${TM(`arc${f}(${v})`)} mean?`, `the angle whose ${NAME[f]} is ${v}`, [`1 ÷ ${f} ${v}`, `the ${NAME[f]} of a ${v}° angle`, `−${f} ${v}`],
          `The inverse ${NAME[f]} runs ${f} backwards: it takes a ratio and gives the angle with that ${NAME[f]}. It is not 1 ÷ ${f} ${v}.`); }
      const [f, v, a] = R.pick(SPEC);
      return E.num(`Find ${TM(`arc${f}(${v})`)} in degrees.`, [{ ans: a }], `${TM(`${f}(${a}°)=${v}`)}, so the angle whose ${NAME[f]} is ${pt(v)} is ${a}°.`); } },
    b: { t: 'sin⁻¹, cos⁻¹, tan⁻¹', g: R => {
      const f = R.pick(['sin', 'cos', 'tan']), v = f === 'tan' ? R.int(15, 400) / 100 : R.int(8, 96) / 100, a = inv(f, v);
      if (!okR(a)) return E.byId['V.6.06'].steps.b.g(R);
      const asTh = R.bool();
      return E.num(asTh ? `${TM(`${f}(θ)=${v}`)} and θ is acute. Find θ to 1 decimal place.` : `Find ${TM(`arc${f}(${v})`)} to 1 decimal place.`, [{ label: asTh ? 'θ =' : undefined, ans: a, dp: 1 }].map(x => { if (!x.label) delete x.label; return x; }),
        `${TM(`θ=arc${f}(${v})≈${fx(a)}°`)}. Use the ${f}⁻¹ key; 1 ÷ ${f} ${v} is a different thing.`); } },
    c: { t: 'choose the ratio', g: R => {
      const f = R.pick(['sin', 'cos', 'tan']); let s;
      if (f === 'tan') { let a, b; do { a = R.int(3, 20); b = R.int(3, 20); } while (a === b || Math.max(a, b) > 3.2 * Math.min(a, b)); s = { opp: a, adj: b, hyp: Math.hypot(a, b) }; }
      else { let H, l; do { H = R.int(6, 25); l = R.int(Math.ceil(H * 0.3), Math.floor(H * 0.92)); } while (l >= H); s = f === 'sin' ? { opp: l, hyp: H, adj: Math.sqrt(H * H - l * l) } : { adj: l, hyp: H, opp: Math.sqrt(H * H - l * l) }; }
      const [t, b] = PAIR[f], a = inv(f, s[t] / s[b]); if (!okR(a)) return S_06c(R);
      const fg = rtri(R, s.opp, s.adj, { ...labsRole({ [t]: String(s[t]), [b]: String(s[b]) }), A: 'θ' });
      return E.num('Find θ to 1 decimal place.', [{ label: 'θ =', ans: a, dp: 1 }], `The known sides are the ${ROLE[t]} and the ${ROLE[b]}, so use ${NAME[f]}: ${TM(`θ=arc${f}(${s[t]}/${s[b]})≈${fx(a)}°`)}.`, { visual: fg.vis }); } },
    d: { t: 'round sensibly', g: (R, O) => {
      const u = unitOf(O), k = R.int(0, 3); let f, p, q, txt;
      if (k === 0) { const L = R.int(30, 70) / 10, d = R.int(Math.ceil(L * 2), Math.floor(L * 4.5)) / 10; f = 'cos'; p = d; q = L; txt = `A ${L} ${u} ladder leans against a wall with its foot ${d} ${u} from the wall. What angle does it make with the ground?`; }
      else if (k === 1) { const L = R.int(30, 120) / 10, h = R.int(3, Math.floor(L * 3)) / 10; f = 'sin'; p = h; q = L; txt = `A ${L} ${u} ramp rises ${h} ${u}. What angle does it make with the ground?`; }
      else if (k === 2) { const h = R.int(2, 30), s0 = R.int(2, 40); f = 'tan'; p = h; q = s0; txt = `A ${h} ${u} flagpole casts a ${s0} ${u} shadow. What is the angle of elevation of the sun?`; }
      else { const L = R.int(20, 80), h = R.int(Math.ceil(L * 0.3), Math.floor(L * 0.9)); f = 'sin'; p = h; q = L; txt = `A kite on a ${L} ${u} string is ${h} ${u} above the ground. What angle does the string make with the ground?`; }
      const a = inv(f, p / q); if (!okR(a, 0) || p >= q && f !== 'tan') return S_06d(R, O);
      const early = inv(f, +(p / q).toFixed(1)), diff = Math.round(early) !== Math.round(a);
      return E.num(`${txt} Give the angle to the nearest degree.`, [{ ans: a, dp: 0 }],
        `${TM(`θ=arc${f}(${p}/${q})≈${fx(a, 2)}°`)}, so about ${Math.round(a)}°. Keep the full ratio in the calculator${diff ? `: rounding ${fx(p / q, 3)} to ${(p / q).toFixed(1)} first gives ${Math.round(early)}°, which is wrong` : ' and round only at the end'}.`); } },
  });
  function S_06c(R) { return E.byId['V.6.06'].steps.c.g(R); }
  function S_06d(R, O) { return E.byId['V.6.06'].steps.d.g(R, O); }

  /* ================= V.6.07 Solve a right triangle ================= */
  const TRIPF = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29]];
  S('V.6.07', 'Solve a right triangle', {
    a: { t: 'all sides and angles', g: R => {
      const k = R.int(0, 9);
      if (k < 5) { const A = R.int(12, 78), fg = rtri(R, Math.sin(K.rad(A)), Math.cos(K.rad(A)), { A: A + '°', B: '?' }), n = fg.n;
        return E.num(`Find ∠${n.B}.`, [{ label: `∠${n.B} =`, ans: 90 - A }], `The two acute angles of a right triangle add to 90°: ∠${n.B} = 90° − ${A}° = ${90 - A}°.`, { visual: fg.vis }); }
      if (k < 8) { const yes = R.bool(), a = R.int(15, 70), b = yes ? 90 - a : 90 - a + R.pick([-1, 1]) * R.int(5, 15);
        return E.tf(`True or false? A right triangle can have acute angles of ${a}° and ${b}°.`, yes, yes ? `${a}° + ${b}° = 90°, as the two acute angles must.` : `${a}° + ${b}° = ${a + b}°, but the acute angles must add to 90° (the right angle takes the other 90°).`); }
      return E.choice(R, 'What does it mean to solve a right triangle?', 'find all three sides and all three angles', ['find only the missing side', 'find only the two acute angles', 'find the area and the perimeter'],
        'Solving means finding every side and every angle. The right angle is already known, so the work is the two acute angles and the missing sides.'); } },
    b: { t: 'given two sides', g: R => {
      let a, b, c, legs = R.bool();
      if (legs) { do { a = R.int(3, 20); b = R.int(3, 20); } while (a === b || Math.max(a, b) > 3 * Math.min(a, b)); c = Math.hypot(a, b); }
      else { do { c = R.int(6, 25); a = R.int(Math.ceil(c * 0.3), Math.floor(c * 0.9)); } while (a >= c); b = Math.sqrt(c * c - a * a); if (R.bool()) [a, b] = [b, a]; }
      const A = K.dg(Math.atan2(a, b)), miss = legs ? 'hyp' : (Number.isInteger(a) ? 'adj' : 'opp'), mv = legs ? c : miss === 'adj' ? b : a;
      if (!okR(A) || !okR(90 - A) || !okR(mv)) return S_07b(R);
      const lab = { opp: Number.isInteger(a) && miss !== 'opp' ? String(a) : undefined, adj: miss !== 'adj' ? String(b) : undefined, hyp: legs ? undefined : String(c) };
      const fg = rtri(R, a, b, labsRole(lab)), n = fg.n, ms = fg.side[miss];
      const sideW = legs ? `${ms} = √(${a}² + ${b}²) ≈ ${fx(c)}` : `${ms} = √(${c}² − ${fx(miss === 'adj' ? a : b)}²) ≈ ${fx(mv)}`;
      const angW = legs ? TM(`arctan(${a}/${b})`) : miss === 'adj' ? TM(`arcsin(${a}/${c})`) : TM(`arccos(${b}/${c})`);
      return E.num(`Solve the triangle: find ${ms}, ∠${n.A} and ∠${n.B}. Round to 1 decimal place.`, [{ label: `${ms} =`, ans: mv, dp: 1 }, { label: `∠${n.A} =`, ans: A, dp: 1 }, { label: `∠${n.B} =`, ans: 90 - A, dp: 1 }],
        `${sideW}. ∠${n.A} = ${angW} ≈ ${fx(A)}°, and ∠${n.B} = 90° − ∠${n.A} ≈ ${fx(90 - A)}°.`, { visual: fg.vis }); } },
    c: { t: 'given a side and angle', g: R => {
      const A = R.int(18, 72), kn = R.pick(['opp', 'adj', 'hyp']), v = R.int(4, 30), s = sidesFrom(A, kn, v), others = ['opp', 'adj', 'hyp'].filter(r => r !== kn);
      if (others.some(r => !okR(s[r]))) return S_07c(R);
      const fg = rtri(R, s.opp, s.adj, { ...labsRole({ [kn]: String(v) }), A: A + '°' }), n = fg.n;
      const how = r => { const f = ['opp', 'hyp'].every(x => [r, kn].includes(x)) ? 'sin' : ['adj', 'hyp'].every(x => [r, kn].includes(x)) ? 'cos' : 'tan', top = PAIR[f][0] === r;
        return `${fg.side[r]} = ${top ? `${v} ${f} ${A}°` : `${v} ÷ ${f} ${A}°`} ≈ ${fx(s[r])}`; };
      return E.num(`Solve the triangle: find ∠${n.B}, ${fg.side[others[0]]} and ${fg.side[others[1]]}. Round lengths to 1 decimal place.`, [{ label: `∠${n.B} =`, ans: 90 - A }, { label: `${fg.side[others[0]]} =`, ans: s[others[0]], dp: 1 }, { label: `${fg.side[others[1]]} =`, ans: s[others[1]], dp: 1 }],
        `∠${n.B} = 90° − ${A}° = ${90 - A}°. ${how(others[0])} and ${how(others[1])}.`, { visual: fg.vis }); } },
    d: { t: 'check with Pythagoras', g: R => {
      const A = R.int(25, 65), c = R.int(6, 30), good = R.bool(), err = good ? -1 : R.int(0, 2), n = { A: 'A', B: 'B', C: 'C' };
      let opp = c * trig('sin', A), adj = c * trig('cos', A), B = 90 - A;
      if (err === 0) opp = c * trig('tan', A); else if (err === 1) adj = c / trig('cos', A); else if (err === 2) B = 180 - A;
      const o1 = +opp.toFixed(1), a1 = +adj.toFixed(1), sum = o1 * o1 + a1 * a1, rel = Math.abs(sum - c * c) / (c * c);
      if ((err === 0 || err === 1) && rel < 0.1) return S_07d(R);
      const L = K.trio(R), nm = { A: L[0], B: L[1], C: L[2] };
      const tab = `<table class="dt"><tr><th>${nm.B}${nm.C}</th><td>${o1}</td></tr><tr><th>${nm.A}${nm.C}</th><td>${a1}</td></tr><tr><th>∠${nm.B}</th><td>${B}°</td></tr></table>`;
      const py = `${o1}² + ${a1}² ≈ ${fx(sum)}, and ${nm.A}${nm.B}² = ${c * c}`;
      return E.tf(`In △${L.join('')}, ∠${nm.C} = 90°, ${nm.A}${nm.B} = ${c} and ∠${nm.A} = ${A}°. A student’s solution is below. Check it with Pythagoras and the angle sum. Is it correct?${tab}`, good,
        good ? `${py}: they match (up to rounding). ${A}° + ${B}° = 90° too, so it checks out.` : err === 2 ? `${py} match, but ${A}° + ${B}° = ${A + B}°, not 90°. ∠${nm.B} should be ${90 - A}°.` : `${py}. These should be equal, so a side is wrong: ${err === 0 ? `${nm.B}${nm.C} = ${c} sin ${A}° ≈ ${fx(c * trig('sin', A))}, not ${c} tan ${A}°` : `${nm.A}${nm.C} = ${c} cos ${A}° ≈ ${fx(c * trig('cos', A))}, not ${c} ÷ cos ${A}°`}.`, { choices: ['Yes', 'No'] }); } },
    e: { t: 'two right triangles in one', g: R => {
      let Bd, Cd; do { Bd = R.int(30, 75); Cd = R.int(30, 75); } while (Math.abs(Bd - Cd) < 8);
      const c = R.int(6, 25), h = c * trig('sin', Bd), bd = c * trig('cos', Bd), dc = h / trig('tan', Cd), ac = h / trig('sin', Cd), ask = R.bool() ? 'CA' : 'BC', ans = ask === 'CA' ? ac : bd + dc;
      if (!okR(ans)) return S_07e(R);
      const L = K.lets(R, 4), [A, B, Cc, D] = L, vis = altFig(R, Bd, Cd, h, { AB: String(c), [ask === 'CA' ? 'CA' : 'BD']: ask === 'CA' ? '?' : undefined, B: Bd + '°', C: Cd + '°' }, L);
      const tgt = ask === 'CA' ? nm2(A, Cc) : nm2(B, Cc);
      return E.num(`${A}${D} is the altitude of △${A}${B}${Cc}. ${nm2(A, B)} = ${c}, ∠${B} = ${Bd}° and ∠${Cc} = ${Cd}°. Find ${tgt} to 1 decimal place.`, [{ label: `${tgt} =`, ans, dp: 1 }],
        `In right △${A}${B}${D}: ${A}${D} = ${c} sin ${Bd}° ≈ ${fx(h, 3)}${ask === 'BC' ? ` and ${B}${D} = ${c} cos ${Bd}° ≈ ${fx(bd, 3)}` : ''}. In right △${A}${D}${Cc}: ${ask === 'CA' ? `${tgt} = ${A}${D} ÷ sin ${Cd}° ≈ ${fx(ac)}` : `${D}${Cc} = ${A}${D} ÷ tan ${Cd}° ≈ ${fx(dc, 3)}, so ${tgt} ≈ ${fx(bd + dc)}`}.`, { visual: vis }); } },
    f: { t: 'hidden triangles, no calculator', g: R => {
      if (R.bool(0.4)) { // altitude to the hypotenuse cuts it into p²t and q²t
        const tr = R.pick([[3, 4, 5], [3, 4, 5], [5, 12, 13], [8, 15, 17]]), [p, q] = R.shuffle(tr.slice(0, 2)), t = tr[2] === 5 ? R.int(1, 4) : 1, m = p * p * t, n0 = q * q * t, h = p * q * t, L = K.lets(R, 4), [A, B, Cc, D] = L, ask = R.int(0, 2);
        const base = { A: [0, 0], B: [m + n0, 0], C: [m, h], D: [m, 0] }, P = K.renamePts(K.spin(R, base), { A, B, C: Cc, D });
        const vis = K.fig({ pts: P, segs: [[A, D, { lab: String(m) }], [D, B, { lab: String(n0) }], [B, Cc], [Cc, A], [Cc, D, { dash: true }]], angles: [[A, Cc, B, '', { right: true }], [Cc, D, B, '', { right: true }]], w: 300, label: 'right triangle with the altitude to its hypotenuse' });
        const ansF = [[q, p], null, null][ask], nmA = `tan ${A}`;
        if (ask === 0) return E.num(`∠${A}${Cc}${B} = 90° and ${Cc}${D} ⟂ ${A}${B}, with ${A}${D} = ${m} and ${D}${B} = ${n0}. Find ${nmA} exactly.`, [{ label: `${nmA} =`, frac: ansF, form: 'any' }],
          `△${A}${D}${Cc} ~ △${Cc}${D}${B}, so ${Cc}${D}² = ${A}${D} · ${D}${B} = ${m * n0} and ${Cc}${D} = ${h}. Then ${nmA} = ${Cc}${D}/${A}${D} = ${h}/${m} = ${pt(E.fracStr(q, p))}.`, { visual: vis });
        const wantB = ask === 2, val = wantB ? q * t * (p * p + q * q) / Math.sqrt(p * p + q * q) : p * t * Math.sqrt(p * p + q * q), sideN = wantB ? nm2(B, Cc) : nm2(A, Cc);
        return E.num(`∠${A}${Cc}${B} = 90° and ${Cc}${D} ⟂ ${A}${B}, with ${A}${D} = ${m} and ${D}${B} = ${n0}. Find ${sideN}.`, [{ label: `${sideN} =`, ans: Math.round(val) }],
          `Each leg is the mean proportional of the hypotenuse and its own segment: ${sideN}² = ${wantB ? n0 : m} × ${m + n0} = ${Math.round(val) ** 2}, so ${sideN} = ${Math.round(val)}.`, { visual: vis }); }
      const giv = R.int(0, 3), [p, q, r] = giv === 0 ? R.pick(TRIPF.slice(0, 2)) : R.pick(TRIPF), sw = R.bool(), a0 = sw ? q : p, b0 = sw ? p : q, k = giv === 0 ? r : R.int(2, 6), a = a0 * k, b = b0 * k, c = r * k, fn = R.pick(['sin', 'cos', 'tan']);
      const want = R.pick([0, 1, 2].filter(x => x !== ({ 2: 1, 3: 2 })[giv]));
      const GV = [[`the altitude to the hypotenuse is ${a * b / c}`, 'altitude'], [`the inradius is ${(a + b - c) / 2}`, 'inradius'], [`the perimeter is ${a + b + c}`, 'perimeter'], [`the area is ${a * b / 2}`, 'area']][giv];
      const WT = [['hypotenuse', c], ['perimeter', a + b + c], ['area', a * b / 2]];
      const rat = fn === 'sin' ? E.fracStr(a0, r) : fn === 'cos' ? E.fracStr(b0, r) : E.fracStr(a0, b0);
      const scale = { altitude: `${a0}·${b0}/${r} = ${pt(E.fracStr(a0 * b0, r))}`, inradius: `(${a0} + ${b0} − ${r})/2 = ${(a0 + b0 - r) / 2}`, perimeter: `${a0 + b0 + r}`, area: `${a0}·${b0}/2 = ${a0 * b0 / 2}` }[GV[1]];
      const unitV = { altitude: a0 * b0 / r, inradius: (a0 + b0 - r) / 2, perimeter: a0 + b0 + r, area: a0 * b0 / 2 }[GV[1]], gv = { altitude: a * b / c, inradius: (a + b - c) / 2, perimeter: a + b + c, area: a * b / 2 }[GV[1]];
      const kk = k, scl = GV[1] === 'area' ? `so k² = ${gv}/${unitV} = ${kk * kk} and k = ${kk}` : `so k = ${gv} ÷ ${pt(E.fracStr(Math.round(unitV * r), r))} = ${kk}`;
      return E.num(`In a right triangle with acute angle A, ${fn} A = ${pt(rat)} and ${GV[0]}. Find the ${WT[want][0]}.`, [{ ans: WT[want][1] }],
        `${fn} A = ${pt(rat)} means the sides are ${a0}k, ${b0}k, ${r}k (opposite A, adjacent, hypotenuse). For k = 1 the ${GV[1]} would be ${scale}, ${scl}. The ${WT[want][0]} is ${WT[want][1]}.`); } },
  });
  function S_07b(R) { return E.byId['V.6.07'].steps.b.g(R); }
  function S_07c(R) { return E.byId['V.6.07'].steps.c.g(R); }
  function S_07d(R) { return E.byId['V.6.07'].steps.d.g(R); }
  function S_07e(R) { return E.byId['V.6.07'].steps.e.g(R); }
  function S_07f(R) { return E.byId['V.6.07'].steps.f.g(R); }

  /* ================= V.6.08 45–45–90 triangles ================= */
  const isoRt = (R, labs) => rtri(R, 1, 1, { AB: labs.hyp, BC: labs.l1, CA: labs.l2, A: labs.A, B: labs.B }, { label: '45–45–90 triangle' });
  const sq2 = k => `${k}sqrt(2)`;
  S('V.6.08', '45–45–90 triangles', {
    a: { t: 'ratio 1 : 1 : √2', g: R => {
      if (R.bool(0.35)) { const L = K.trio(R), n = { A: L[0], B: L[1], C: L[2] }, s = R.pick(['s', 'a', 'k']), fg = rtri(R, 1, 1, { CA: s, A: '45°', B: '45°' }, { L, label: '45–45–90 triangle' });
        const AC = nm2(n.A, n.C), BC = nm2(n.B, n.C), AB = nm2(n.A, n.B);
        const lines = [[`∠${n.C} = 90°, ∠${n.A} = ∠${n.B} = 45° and ${AC} = ${s}`, 'given', []],
          [`${BC} = ${AC} = ${s}`, 'converse of the isosceles triangle theorem', [0], ['isosceles triangle theorem', 'Pythagorean theorem', 'definition of right triangle'], 'sides opposite equal angles are equal'],
          [`${AB}² = ${AC}² + ${BC}²`, 'Pythagorean theorem', [0], ['converse of the Pythagorean theorem', 'isosceles triangle theorem', 'triangle sum theorem'], `the triangle has a right angle at ${n.C}, and ${AB} is the hypotenuse`],
          [`${AB}² = ${s}² + ${s}² = 2${s}²`, 'substitution', [1, 2], ['Pythagorean theorem', 'given', 'reflexive property'], `both legs equal ${s}`],
          [`${AB} = ${s}√2`, 'take the positive square root', [3], ['substitution', 'Pythagorean theorem', 'converse of the isosceles triangle theorem'], `√(2${s}²) = ${s}√2, and a length is positive`]];
        return proof(R, pmode(R), { head: `Given: ${lines[0][0]}. Prove: ${AB} = ${s}√2, so the sides are in the ratio 1 : 1 : √2.`, lines, vis: fg.vis,
          oexp: 'Equal angles give equal legs, and Pythagoras is true in any right triangle; those two can come in either order. Substituting gives 2s², and the square root gives s√2.',
          breaks: [{ i: 1, rs: 'isosceles triangle theorem', why: 'that theorem goes from equal sides to equal angles; here equal angles give equal sides, which is its converse' },
            { i: 3, st: `${AB}² = ${s} + ${s} = 2${s}`, why: `each leg is ${s}, so its square is ${s}²: ${AB}² = ${s}² + ${s}² = 2${s}²` },
            { i: 4, st: `${AB} = 2${s}`, why: `√(2${s}²) = ${s}√2, not 2${s}` }] }); }
      if (R.bool(0.3)) return E.choice(R, 'The sides of a 45°–45°–90° triangle are in which ratio?', '1 : 1 : √2', ['1 : 1 : 2', '1 : √2 : 2', '1 : √3 : 2'],
        'The legs are equal (1 and 1), and Pythagoras gives the hypotenuse √(1² + 1²) = √2.');
      const k = R.int(2, 30), right = `${k}, ${k}, ${k}√2`;
      return E.choice(R, 'Which could be the side lengths of a 45°–45°–90° triangle?', right, [`${k}, ${k}, ${2 * k}`, `${k}, ${k}√2, ${k}√2`, `${k}, ${k}√3, ${2 * k}`],
        `The legs are equal and the hypotenuse is √2 times a leg: ${k}, ${k}, ${k}√2. The √2 goes on the hypotenuse, the longest side.`); } },
    b: { t: 'from a leg', g: R => {
      const surdLeg = R.bool(0.25), k = R.int(2, 15), legS = surdLeg ? sq2(k) : String(k), hyp = surdLeg ? String(2 * k) : sq2(k), askLeg = R.bool(0.2);
      const fg = isoRt(R, { l1: pt(legS), l2: askLeg ? '?' : undefined, hyp: askLeg ? undefined : '?', A: '45°' });
      if (askLeg) return E.num(`Find the length marked ?.`, [{ exact: legS }], `The two legs of a 45°–45°–90° triangle are equal, so it is ${pt(legS)}.`, { visual: fg.vis });
      return E.num(`Find the hypotenuse. Give an exact answer.`, [{ label: 'hypotenuse =', exact: hyp }], `Hypotenuse = leg × √2 = ${pt(legS)} × √2 = ${pt(hyp)}.`, { visual: fg.vis }); } },
    c: { t: 'from the hypotenuse', g: R => {
      const surd = R.bool(0.3), k = R.int(2, 16), hypS = surd ? sq2(k) : String(k), leg = surd ? String(k) : ex(k, 2, 2);
      const fg = isoRt(R, { hyp: pt(hypS), l1: '?', A: '45°' });
      return E.num(`Find the length of a leg. Give an exact answer.`, [{ label: 'leg =', exact: leg }],
        `Leg = hypotenuse ÷ √2 = ${pt(hypS)}/√2 = ${pt(leg)}.${surd ? '' : ` (The √2 belongs on the hypotenuse, so a leg is less than ${k}, not ${k}√2.)`}`, { visual: fg.vis }); } },
    d: { t: 'square diagonals', g: (R, O) => {
      const u = unitOf(O), kind = R.int(0, 3), s = R.int(2, 20), d = R.int(2, 20), L = K.lets(R, 4), [A, B, Cc, D] = L;
      const P = K.renamePts(K.spin(R, { A: [0, 0], B: [1, 0], C: [1, 1], D: [0, 1] }), { A, B, C: Cc, D });
      const known = kind === 0 ? 'side' : 'diag', vis = K.fig({ pts: P, segs: [[A, B, { ticks: 1, lab: known === 'side' ? String(s) : undefined }], [B, Cc, { ticks: 1 }], [Cc, D, { ticks: 1 }], [D, A, { ticks: 1 }], [A, Cc, { dash: true, lab: known === 'diag' ? String(d) : '?', ref: B }]], angles: [[A, B, Cc, '', { right: true }]], label: 'square with a diagonal' });
      if (kind === 0) return E.num(`${A}${B}${Cc}${D} is a square with side ${s} ${u}. Find the diagonal ${A}${Cc}. Give an exact answer.`, [{ label: `${A}${Cc} =`, exact: sq2(s) }], `The diagonal cuts the square into two 45°–45°–90° triangles with legs ${s}, so ${A}${Cc} = ${s}√2 ${u}.`, { visual: vis });
      if (kind === 1 || kind === 3) return E.num(`${A}${B}${Cc}${D} is a square with diagonal ${A}${Cc} = ${d} ${u}. Find the side length. Give an exact answer.`, [{ label: 'side =', exact: ex(d, 2, 2) }], `The diagonal is the hypotenuse of a 45°–45°–90° triangle, so side = ${d}/√2 = ${pt(ex(d, 2, 2))} ${u}.`, { visual: vis });
      return E.num(`${A}${B}${Cc}${D} is a square with diagonal ${A}${Cc} = ${d} ${u}. Find its area.`, [{ label: 'area =', frac: [d * d, 2], form: 'any' }], `Side = ${d}/√2, so area = (${d}/√2)² = ${d * d}/2${d % 2 ? '' : ' = ' + d * d / 2} ${u}².`, { visual: vis }); } },
  });

  /* ================= V.6.09 30–60–90 triangles ================= */
  // short leg opposite 30° at A: a = BC = 1 (opposite A=30°), b = CA = √3
  const t369 = (R, labs) => rtri(R, 1, Math.sqrt(3), { BC: labs.s, CA: labs.l, AB: labs.h, A: labs.A ?? '30°', B: labs.B ?? '60°' }, { label: '30–60–90 triangle' });
  const sq3 = k => `${k}sqrt(3)`;
  S('V.6.09', '30–60–90 triangles', {
    a: { t: 'ratio 1 : √3 : 2', g: R => {
      if (R.bool(0.35)) { const L = K.lets(R, 4), [A, B, F, D] = L, s = R.pick(['s', 'a', 'k']), P = K.renamePts(K.spin(R, { A: [1, Math.sqrt(3)], B: [0, 0], F: [1, 0], D: [2, 0] }), { A, B, F, D });
        const vis = K.fig({ pts: P, segs: [[A, B, { ticks: 1, lab: `2${s}` }], [B, F], [F, D], [B, D, { ticks: 1 }], [D, A, { ticks: 1 }], [A, F, { dash: true }]], angles: [[A, F, B, '', { right: true }], [F, B, A, '60°'], [B, A, F, '30°']], label: 'equilateral triangle with its height' });
        const lines = [[`△${A}${B}${D} is equilateral with side 2${s}, and ${A}${F} ⊥ ${B}${D}`, 'given', []],
          [`${B}${F} = ${F}${D} = ${s}`, 'the altitude of an isosceles triangle bisects the base', [0], ['midsegment theorem', 'Pythagorean theorem', 'definition of perpendicular'], `${A}${B} = ${A}${D}, so the altitude from ${A} cuts the base ${B}${D} = 2${s} in half`],
          [`${A}${B}² = ${A}${F}² + ${B}${F}²`, 'Pythagorean theorem', [0], ['converse of the Pythagorean theorem', 'midsegment theorem', 'triangle sum theorem'], `△${A}${B}${F} has a right angle at ${F}, and ${A}${B} is its hypotenuse`],
          [`(2${s})² = ${A}${F}² + ${s}², so ${A}${F}² = 3${s}²`, 'substitution', [1, 2], ['Pythagorean theorem', 'given', 'midsegment theorem'], `${A}${B} = 2${s} and ${B}${F} = ${s}, and 4${s}² − ${s}² = 3${s}²`],
          [`${A}${F} = ${s}√3`, 'take the positive square root', [3], ['substitution', 'Pythagorean theorem', 'midsegment theorem'], `√(3${s}²) = ${s}√3, and a length is positive`]];
        return proof(R, pmode(R), { head: `Given: ${lines[0][0]}. Prove: ${A}${F} = ${s}√3, so 30°–60°–90° △${A}${B}${F} has sides ${s}, ${s}√3 and 2${s}.`, lines, vis,
          oexp: `The altitude halves the base, and Pythagoras holds in right △${A}${B}${F}; those can come in either order. Substituting gives 3${s}², and the square root gives ${s}√3.`,
          breaks: [{ i: 1, rs: 'midsegment theorem', why: `${A}${F} is an altitude, not a midsegment; it halves the base because the altitude of an isosceles triangle bisects the base` },
            { i: 3, st: `(2${s})² = ${A}${F}² + ${s}², so ${A}${F}² = ${s}²`, why: `(2${s})² = 4${s}², not 2${s}², so ${A}${F}² = 4${s}² − ${s}² = 3${s}²` },
            { i: 4, st: `${A}${F} = 3${s}`, why: `√(3${s}²) = ${s}√3, not 3${s}` }] }); }
      if (R.bool(0.3)) return E.choice(R, 'In a 30°–60°–90° triangle, the sides opposite 30°, 60° and 90° are in which ratio?', '1 : √3 : 2', ['1 : 2 : √3', '1 : 1 : √2', '1 : 2 : 3'],
        'The short leg is opposite 30°, the hypotenuse is twice it, and Pythagoras gives the long leg √(2² − 1²) = √3.');
      const k = R.int(2, 12), opp = R.pick([60, 90]), right = opp === 60 ? `${k}√3` : String(2 * k);
      const fg = t369(R, { s: String(k) });
      return E.choice(R, `The short leg is ${k}. How long is the side opposite the ${opp}° angle?`, right, opp === 60 ? [String(2 * k), `${k}√2`, `${2 * k}√3`] : [`${k}√3`, `${k}√2`, `${2 * k}√3`],
        `The sides opposite 30°, 60°, 90° are ${k}, ${k}√3, ${2 * k}. ${opp === 60 ? 'The √3 goes on the longer leg, opposite 60°.' : 'The hypotenuse is exactly twice the short leg.'}`, { visual: fg.vis }); } },
    b: { t: 'from the short leg', g: R => {
      const k = R.int(2, 20), fg = t369(R, { s: String(k), l: '?', h: '?' });
      return E.num('The side opposite 30° is given. Find the other two sides. Give exact answers.', [{ label: 'hypotenuse =', exact: String(2 * k) }, { label: 'long leg =', exact: sq3(k) }],
        `Hypotenuse = 2 × ${k} = ${2 * k}. Long leg (opposite 60°) = ${k}√3.`, { visual: fg.vis }); } },
    c: { t: 'from the other sides', g: R => {
      const kind = R.int(0, 2);
      if (kind === 0) { const h = R.int(3, 24), sh = E.fracStr(h, 2), lg = ex(h, 3, 2), fg = t369(R, { h: String(h), s: '?', l: '?' });
        return E.num('Find both legs. Give exact answers.', [{ label: 'short leg =', exact: sh }, { label: 'long leg =', exact: lg }], `Short leg = ${h} ÷ 2 = ${pt(sh)}. Long leg = short leg × √3 = ${pt(lg)}.`, { visual: fg.vis }); }
      const surd = kind === 1, k = R.int(2, 15), lgS = surd ? sq3(k) : String(k), sh = surd ? String(k) : ex(k, 3, 3), hy = surd ? String(2 * k) : ex(2 * k, 3, 3), fg = t369(R, { l: pt(lgS), s: '?', h: '?' });
      return E.num('Find the short leg and the hypotenuse. Give exact answers.', [{ label: 'short leg =', exact: sh }, { label: 'hypotenuse =', exact: hy }],
        `Short leg = long leg ÷ √3 = ${pt(lgS)}/√3 = ${pt(sh)}. Hypotenuse = 2 × short leg = ${pt(hy)}.`, { visual: fg.vis }); } },
    d: { t: 'equilateral heights', g: (R, O) => {
      const u = unitOf(O), kind = R.int(0, 3), L = K.lets(R, 4), [A, B, Cc, D] = L, P = K.renamePts(K.spin(R, { A: [1, Math.sqrt(3)], B: [0, 0], C: [2, 0], D: [1, 0] }), { A, B, C: Cc, D });
      const s = R.int(2, 20), m = R.int(2, 12), labS = kind === 0 || kind === 3 ? String(s) : undefined, labH = kind === 1 ? String(m) : kind === 2 ? pt(sq3(m)) : '?';
      const vis = K.fig({ pts: P, segs: [[A, B, { ticks: 1, lab: labS }], [B, D], [D, Cc], [B, Cc, { ticks: 1 }], [Cc, A, { ticks: 1 }], [A, D, { dash: true, lab: kind === 0 ? '?' : undefined }]], angles: [[A, D, B, '', { right: true }]], label: 'equilateral triangle with its height' });
      const pre = `△${A}${B}${Cc} is equilateral and ${A}${D} is its height.`;
      if (kind === 0) return E.num(`${pre} Each side is ${s} ${u}. Find ${A}${D}. Give an exact answer.`, [{ label: `${A}${D} =`, exact: ex(s, 3, 2) }], `${A}${D} splits it into two 30°–60°–90° triangles with short leg ${pt(E.fracStr(s, 2))} and hypotenuse ${s}, so ${A}${D} = ${pt(E.fracStr(s, 2))}·√3 = ${pt(ex(s, 3, 2))} ${u}.`, { visual: vis });
      if (kind === 3) return E.num(`${pre} Each side is ${s} ${u}. Find the area of the triangle. Give an exact answer.`, [{ label: 'area =', exact: ex(s * s, 3, 4) }], `The height is ${pt(ex(s, 3, 2))}, so the area is ½ × ${s} × ${pt(ex(s, 3, 2))} = ${pt(ex(s * s, 3, 4))} ${u}².`, { visual: vis });
      const side = kind === 1 ? ex(2 * m, 3, 3) : String(2 * m);
      return E.num(`${pre} ${A}${D} = ${labH} ${u}. Find the side length. Give an exact answer.`, [{ label: 'side =', exact: side }], `${A}${D} is the long leg of a 30°–60°–90° triangle, so the short leg ${B}${D} = ${labH}/√3 = ${pt(kind === 1 ? ex(m, 3, 3) : String(m))}. The side is twice that: ${pt(side)} ${u}.`, { visual: vis }); } },
    e: { t: 'two special triangles together', g: R => {
      const kind = R.int(0, 2), L = K.lets(R, 4), [A, B, Cc, D] = L, k = R.int(2, 12);
      let Bd, Cd, h, given, ask, ans, why;
      if (kind === 0) { Bd = 45; Cd = 60; h = k; given = { AB: pt(sq2(k)) }; ask = R.pick(['BC', 'CA']); ans = ask === 'BC' ? E.surdStr(3 * k, k, 3, 3) : ex(2 * k, 3, 3);
        why = `△${A}${B}${D} is 45°–45°–90°, so ${A}${D} = ${B}${D} = ${k}. In 30°–60°–90° △${A}${D}${Cc}, ${A}${D} is the long leg, so ${D}${Cc} = ${k}/√3 = ${pt(ex(k, 3, 3))} and ${nm2(A, Cc)} = ${pt(ex(2 * k, 3, 3))}.${ask === 'BC' ? ` So ${nm2(B, Cc)} = ${k} + ${pt(ex(k, 3, 3))} = ${pt(ans)}.` : ''}`; }
      else if (kind === 1) { Bd = 45; Cd = 60; h = k * Math.sqrt(3); given = { CA: String(2 * k) }; ask = R.pick(['BC', 'AB']); ans = ask === 'BC' ? E.surdStr(k, k, 3, 1) : ex(k, 6);
        why = `In 30°–60°–90° △${A}${D}${Cc}, ${D}${Cc} = ${k} and ${A}${D} = ${k}√3. △${A}${B}${D} is 45°–45°–90°, so ${B}${D} = ${k}√3 and ${nm2(A, B)} = ${k}√3·√2 = ${pt(ex(k, 6))}.${ask === 'BC' ? ` So ${nm2(B, Cc)} = ${k}√3 + ${k} = ${pt(ans)}.` : ''}`; }
      else { Bd = 30; Cd = 45; h = k; given = { AD: String(k) }; ask = R.pick(['BC', 'AB', 'CA']); ans = ask === 'BC' ? E.surdStr(k, k, 3, 1) : ask === 'AB' ? String(2 * k) : sq2(k);
        why = `In 30°–60°–90° △${A}${B}${D}, ${A}${D} = ${k} is the short leg, so ${B}${D} = ${k}√3 and ${nm2(A, B)} = ${2 * k}. △${A}${D}${Cc} is 45°–45°–90°, so ${D}${Cc} = ${k} and ${nm2(A, Cc)} = ${k}√2.${ask === 'BC' ? ` So ${nm2(B, Cc)} = ${k}√3 + ${k} = ${pt(ans)}.` : ''}`; }
      const labs = { ...given, B: Bd + '°', C: Cd + '°' };
      const vis = altFig(R, Bd, Cd, h, labs, L), tgt = { BC: nm2(B, Cc), AB: nm2(A, B), CA: nm2(A, Cc) }[ask], gvN = Object.keys(given)[0], gvTxt = { AB: nm2(A, B), CA: nm2(A, Cc), AD: A + D }[gvN];
      return E.num(`${A}${D} is the altitude of △${A}${B}${Cc}, with ∠${B} = ${Bd}°, ∠${Cc} = ${Cd}° and ${gvTxt} = ${given[gvN]}. Find ${tgt}. Give an exact answer.`, [{ label: `${tgt} =`, exact: ans }], why, { visual: vis }); } },
    f: { t: 'equilateral and hexagon puzzles', g: R => {
      const kind = R.int(0, 2);
      if (kind === 0) { const d = R.distinct(1, 9, 3), H = d[0] + d[1] + d[2], side = ex(2 * H, 3, 3);
        return E.num(`A point inside an equilateral triangle is ${d[0]}, ${d[1]} and ${d[2]} units from its three sides. Find the side length of the triangle. Give an exact answer.`, [{ label: 'side =', exact: side }],
          `Join the point to the vertices: the three small triangles have heights ${d.join(', ')} and the same base s, so ½s(${d.join(' + ')}) = ½s·h. The distances add up to the height: h = ${H}. Then s = 2h/√3 = ${pt(side)}.`); }
      if (kind === 1) { const s = R.int(2, 9), ar = ex(3 * s * s, 3, 2), back = R.bool();
        if (back) return E.num(`A regular hexagon has area ${pt(ar)}. Find its side length.`, [{ label: 'side =', ans: s }], `A regular hexagon is six equilateral triangles, each of area (√3/4)s². So (3√3/2)s² = ${pt(ar)}, s² = ${s * s} and s = ${s}.`);
        return E.num(`A regular hexagon has side ${s}. Find its area. Give an exact answer.`, [{ label: 'area =', exact: ar }], `It is six equilateral triangles of side ${s}, each with area (√3/4)·${s * s}. Total: 6 × ${pt(ex(s * s, 3, 4))} = ${pt(ar)}.`); }
      const m = R.int(2, 10), side = ex(m, 3, 3), ar = ex(3 * m * m, 3, 6);
      return E.num(`A regular hexagon has a short diagonal (joining two vertices with one vertex between them) of length ${m}. Find its area. Give an exact answer.`, [{ label: 'area =', exact: ar }],
        `The short diagonal and two sides make a 30°–30°–120° triangle; its height splits it into two 30°–60°–90° triangles, so the diagonal is s√3. Then s = ${m}/√3 and the area is (3√3/2)s² = (3√3/2)(${m * m}/3) = ${pt(ar)}.`); } },
  });

  /* ================= V.6.10 Elevation & depression ================= */
  const flipX = (R, pts) => { if (!R.bool()) return pts; const o = {}; for (const k in pts) o[k] = [-pts[k][0], pts[k][1]]; return o; };
  // observer _O on the ground at the origin; object of height h at distance d
  const elevFig = (R, d, h, labs) => { const P = flipX(R, { _O: [0, 0], _B: [d, 0], _T: [d, h] });
    return K.fig({ pts: P, segs: [['_O', '_B', { lab: labs.d }], ['_B', '_T', { lab: labs.h, width: 3 }], ['_O', '_T', { dash: true, lab: labs.los }]], angles: [['_T', '_B', '_O', '', { right: true }], ['_B', '_O', '_T', labs.th]], center: [d * 0.6, h * 0.3], w: 270, label: 'angle of elevation' }); };
  const deprFig = (R, d, h, labs) => { const P = flipX(R, { _C: [0, h], _F: [0, 0], _B: [d, 0], _H: [d * 0.75, h] });
    return K.fig({ pts: P, segs: [['_C', '_F', { lab: labs.h, width: 3 }], ['_F', '_B', { lab: labs.d }], ['_C', '_B', { dash: true, lab: labs.los }], ['_C', '_H', { dash: true }]], angles: [['_C', '_F', '_B', '', { right: true }], ['_H', '_C', '_B', labs.th]], center: [d * 0.4, h * 0.4], w: 270, label: 'angle of depression' }); };
  const walkFig = (R, d, X, h, a, b) => { const P = flipX(R, { A: [0, 0], B: [d, 0], _F: [X, 0], _T: [X, h] });
    return K.fig({ pts: P, segs: [['A', 'B', { lab: String(d) }], ['B', '_F'], ['_F', '_T', { lab: 'h', width: 3 }], ['A', '_T', { dash: true }], ['B', '_T', { dash: true }]], angles: [['_T', '_F', 'B', '', { right: true }], ['_F', 'A', '_T', a + '°'], ['_F', 'B', '_T', b + '°', { n: 2 }]], center: [X * 0.7, h * 0.3], w: 300, label: 'two angles of elevation' }); };
  S('V.6.10', 'Elevation & depression', {
    a: { t: 'draw the picture', g: R => {
      const OPTS = ['angle of elevation', 'angle of depression', 'neither'], want = R.int(0, 2), up = want === 0 ? true : want === 1 ? false : R.bool(), a = R.int(20, 65), r = 3;
      const T = K.polar(r, up ? a : -a), base = { O: [0, 0], T, _h: [r * 1.1, 0], _v: [0, up ? r : -r] };
      const P = flipX(R, base), fromV = want === 2, vis = K.fig({ pts: P, segs: [['O', '_h', { dash: true }], ['O', 'T'], ...(fromV ? [['O', '_v', { dash: true }]] : [])], angles: [fromV ? ['_v', 'O', 'T', (90 - a) + '°'] : ['_h', 'O', 'T', a + '°']], text: [[K.lerp(P.O, P._h, 0.8).map((v, i) => i ? v + (up ? -0.3 : 0.3) : v), 'horizontal', { size: 12, fill: C.muted }]], w: 240, label: 'line of sight from O to T' });
      return E.choiceFixed(`An observer at O looks ${up ? 'up' : 'down'} at T. What is the marked angle?`, OPTS, want,
        want === 2 ? `The marked angle is measured from the vertical. Elevation and depression are always measured from the horizontal; here that angle would be ${a}°.` : `It is measured from the horizontal ${up ? 'up' : 'down'} to the line of sight, so it is the angle of ${up ? 'elevation' : 'depression'}.`, { visual: vis }); } },
    b: { t: 'angle of elevation', g: (R, O) => {
      const u = unitOf(O), kind = R.int(0, 2), th = R.int(15, 70), d = R.int(8, 80), h = d * trig('tan', th);
      if (kind === 0) { if (!okR(h)) return S_10b(R, O); const vis = elevFig(R, d, h, { d: String(d), h: 'h', th: th + '°' });
        return E.num(`From a point ${d} ${u} from the foot of a tower, the angle of elevation of the top is ${th}°. Find the height h to 1 decimal place.`, [{ label: 'h =', ans: h, dp: 1 }], `${TM(`tan(${th}°)=h/${d}`)}, so ${TM(`h=${d}tan(${th}°)≈${fx(h)}`)} ${u}.`, { visual: vis }); }
      if (kind === 1) { const e = R.int(14, 18) / 10, tot = e + h; if (!okR(tot)) return S_10b(R, O);
        return E.num(`Standing ${d} ${u} from a tree, Maya sees its top at an angle of elevation of ${th}°. Her eyes are ${e} ${u} above the ground. How tall is the tree, to 1 decimal place?`, [{ ans: tot, dp: 1 }],
          `Above eye level the tree rises ${d} tan ${th}° ≈ ${fx(h, 2)} ${u}. Add the eye height: ${fx(h, 2)} + ${e} ≈ ${fx(tot)} ${u}.`); }
      const H = R.int(5, 60), D = R.int(8, 90), a = inv('tan', H / D); if (!okR(a)) return S_10b(R, O);
      return E.num(`A ${H} ${u} building is ${D} ${u} away. What is the angle of elevation of its top from the ground? Give it to 1 decimal place.`, [{ ans: a, dp: 1 }], `${TM(`tan(θ)=${H}/${D}`)}, so ${TM(`θ=arctan(${H}/${D})≈${fx(a)}°`)}.`, { visual: elevFig(R, D, H, { d: String(D), h: String(H), th: 'θ' }) }); } },
    c: { t: 'angle of depression', g: (R, O) => {
      const u = unitOf(O), kind = R.int(0, 2), th = R.int(10, 60), h = R.int(15, 120);
      if (kind === 0) { const d = h / trig('tan', th); if (!okR(d)) return S_10c(R, O);
        return E.num(`From the top of a ${h} ${u} cliff, the angle of depression to a boat is ${th}°. How far is the boat from the foot of the cliff, to 1 decimal place?`, [{ ans: d, dp: 1 }],
          `The angle of depression equals the angle of elevation from the boat (alternate angles), ${th}°. So ${TM(`tan(${th}°)=${h}/d`)} and ${TM(`d=${h}/tan(${th}°)≈${fx(d)}`)} ${u}.`, { visual: deprFig(R, d, h, { h: String(h), d: 'd', th: th + '°' }) }); }
      if (kind === 1) { const L = h / trig('sin', th), d = h / trig('tan', th); if (!okR(L)) return S_10c(R, O);
        return E.num(`A drone hovers ${h} ${u} above the ground. The angle of depression from the drone to a car is ${th}°. How far is the drone from the car in a straight line, to 1 decimal place?`, [{ ans: L, dp: 1 }],
          `The angle at the car is also ${th}°, and the height ${h} is opposite it: ${TM(`sin(${th}°)=${h}/L`)}, so ${TM(`L=${h}/sin(${th}°)≈${fx(L)}`)} ${u}.`, { visual: deprFig(R, d, h, { h: String(h), los: 'L', th: th + '°' }) }); }
      const d = R.int(20, 200), a = inv('tan', h / d); if (!okR(a)) return S_10c(R, O);
      return E.num(`A lighthouse is ${h} ${u} tall. A ship is ${d} ${u} from its foot. Find the angle of depression from the top of the lighthouse to the ship, to 1 decimal place.`, [{ ans: a, dp: 1 }],
        `It equals the angle of elevation from the ship: ${TM(`θ=arctan(${h}/${d})≈${fx(a)}°`)}.`, { visual: deprFig(R, d, h, { h: String(h), d: String(d), th: 'θ' }) }); } },
    d: { t: 'two-triangle problems', g: (R, O) => {
      const u = unitOf(O);
      if (R.bool()) { let a, b; do { a = R.int(15, 50); b = R.int(a + 8, 72); } while (b - a > 35);
        const d = R.int(10, 80), h = d * trig('tan', a) * trig('tan', b) / (trig('tan', b) - trig('tan', a)), X = h / trig('tan', a); if (!okR(h)) return S_10d(R, O);
        return E.num(`From A, the angle of elevation of the top of a tower is ${a}°. After walking ${d} ${u} straight toward the tower to B, it is ${b}°. Find the height h to 1 decimal place.`, [{ label: 'h =', ans: h, dp: 1 }],
          `Let x be the distance from B to the tower: h = x tan ${b}° = (x + ${d}) tan ${a}°. So x = ${d} tan ${a}° ÷ (tan ${b}° − tan ${a}°) ≈ ${fx(h / trig('tan', b), 2)}, and h ≈ ${fx(h)} ${u}.`, { visual: walkFig(R, d, X, h, a, b) }); }
      const h = R.int(10, 40), a = R.int(10, 40), b = R.int(15, 50), x = h / trig('tan', b), H = h + x * trig('tan', a); if (!okR(H)) return S_10d(R, O);
      const P = flipX(R, { _Q: [0, 0], _P: [0, h], _F: [x, 0], _T: [x, H], _E: [x, h] });
      const vis = K.fig({ pts: P, segs: [['_Q', '_P', { lab: String(h), width: 3 }], ['_Q', '_F'], ['_F', '_T', { lab: 'H', width: 3 }], ['_P', '_T', { dash: true }], ['_P', '_F', { dash: true }], ['_P', '_E', { dash: true }]], angles: [['_E', '_P', '_T', a + '°', { r: 46 }], ['_E', '_P', '_F', b + '°', { n: 2 }], ['_T', '_F', '_Q', '', { right: true }]], center: [x * 0.5, h * 0.5], w: 260, label: 'two buildings' });
      return E.num(`From the roof of a ${h} ${u} building, the angle of elevation of the top of a taller tower is ${a}° and the angle of depression of its foot is ${b}°. Find the tower’s height H to 1 decimal place.`, [{ label: 'H =', ans: H, dp: 1 }],
        `The gap is x = ${h} ÷ tan ${b}° ≈ ${fx(x, 2)} ${u}. The tower rises x tan ${a}° ≈ ${fx(x * trig('tan', a), 2)} above the roof, so H ≈ ${h} + ${fx(x * trig('tan', a), 2)} ≈ ${fx(H)} ${u}.`, { visual: vis }); } },
    e: { t: 'exact values, two angles', g: (R, O) => {
      const u = unitOf(O), [a, b] = R.pick([[30, 60], [45, 60], [30, 45]]), d = R.int(2, 20), askH = R.bool(0.65);
      const H = { '30,60': ex(d, 3, 2), '45,60': E.surdStr(3 * d, d, 3, 2), '30,45': E.surdStr(d, d, 3, 2) }[a + ',' + b];
      const Xs = { '30,60': E.fracStr(d, 2), '45,60': E.surdStr(d, d, 3, 2), '30,45': E.surdStr(d, d, 3, 2) }[a + ',' + b];
      const hv = E.value(H)[0], xv = E.value(Xs)[0];
      const T = { 30: '1/√3', 45: '1', 60: '√3' };
      return E.num(`From A, the angle of elevation of the top of a tower is ${a}°. After walking ${d} ${u} toward it to B, the angle is ${b}°. Find ${askH ? 'the height h of the tower' : 'the distance from B to the foot of the tower'}. Give an exact answer.`, [{ exact: askH ? H : Xs }],
        `Let x be the distance from B. h = x·tan ${b}° = (x + ${d})·tan ${a}°, with tan ${a}° = ${T[a]} and tan ${b}° = ${T[b]}. Solving gives x = ${pt(Xs)} and h = ${pt(H)} ${u}.`, { visual: walkFig(R, d, xv + d, hv, a, b) }); } },
    f: { t: 'flagpoles and 3-D sightings', g: (R, O) => {
      const u = unitOf(O);
      if (R.bool()) { const [a, b] = R.pick([[45, 30], [60, 30], [45, 60], [60, 45], [30, 60]]), cot2 = { 30: [3, 1], 45: [1, 1], 60: [1, 3] }, d = R.int(2, 30);
        const num = cot2[a][0] * cot2[b][1] + cot2[b][0] * cot2[a][1], den = cot2[a][1] * cot2[b][1], h = E.surdStr(0, d, den * num, num);   // h = d / √(cot²a + cot²b)
        return E.num(`A tower stands on level ground. From A, due south of the tower, its top has an angle of elevation of ${a}°. From B, due east of the tower, the angle is ${b}°. A and B are ${d} ${u} apart. Find the height of the tower. Give an exact answer.`, [{ label: 'height =', exact: h }],
          `If the height is h, A is h·cot ${a}° from the foot and B is h·cot ${b}°. South and east are at right angles, so h²(cot² ${a}° + cot² ${b}°) = ${d}², that is h² · ${pt(E.fracStr(num, den))} = ${d * d}. So h = ${pt(h)} ${u}.`); }
      const [a, b] = R.pick([[45, 60], [30, 60], [30, 45]]), h = R.int(3, 30), pole = a === 30 && b === 60 ? String(2 * h) : `${h}sqrt(3)-${h}`;
      const x = h / trig('tan', a), p = E.value(pole)[0], P = flipX(R, { P: [0, 0], _F: [x, 0], _B: [x, h], _T: [x, h + p] });
      const vis = K.fig({ pts: P, segs: [['P', '_F'], ['_F', '_B', { lab: String(h), width: 3 }], ['_B', '_T', { lab: '?', color: C.blue, width: 3 }], ['P', '_B', { dash: true }], ['P', '_T', { dash: true }]], angles: [['_F', 'P', '_B', a + '°', { r: 34 }], ['_F', 'P', '_T', b + '°', { r: 58, n: 1, color: C.blue }], ['P', '_F', '_B', '', { right: true }]], center: [x * 0.6, h * 0.4], w: 260, label: 'flagpole on a building' });
      return E.num(`A flagpole stands on top of a ${h} ${u} building. From a point P on the ground, the angles of elevation of the bottom and top of the pole are ${a}° and ${b}°. How tall is the pole? Give an exact answer.`, [{ label: 'pole =', exact: pole }],
        `P is ${h}·cot ${a}° = ${pt(a === 45 ? String(h) : sq3(h))} from the building. The top is that distance × tan ${b}° = ${pt(a === 45 ? sq3(h) : b === 60 ? String(3 * h) : sq3(h))} high, so the pole is ${pt(a === 45 ? sq3(h) : b === 60 ? String(3 * h) : sq3(h))} − ${h}${pole === String(2 * h) ? ' = ' + pole : ''} ${u}.`, { visual: vis }); } },
  });
  function S_10b(R, O) { return E.byId['V.6.10'].steps.b.g(R, O); }
  function S_10c(R, O) { return E.byId['V.6.10'].steps.c.g(R, O); }
  function S_10d(R, O) { return E.byId['V.6.10'].steps.d.g(R, O); }

  /* ================= V.6.11 Cofunctions ================= */
  const CO = { sin: 'cos', cos: 'sin', tan: 'cot', cot: 'tan', sec: 'csc', csc: 'sec' }, FULL = { sin: 'sine', cos: 'cosine', tan: 'tangent', cot: 'cotangent', sec: 'secant', csc: 'cosecant' };
  S('V.6.11', 'Cofunctions', {
    a: { t: 'sin A = cos(90° − A)', g: R => {
      const f = R.pick(['sin', 'cos']); let a; do a = R.int(5, 85); while (a === 45); const g = CO[f];
      return E.num(`${TM(`${f}(${a}°)=${g}(x)`).replace('<mi>x</mi>', '<mi>x</mi><mo>°</mo>')}, where x is between 0 and 90. Find x.`, [{ label: 'x =', ans: 90 - a }], `${TM(`${f}(A)=${g}(90°-A)`)}, so x = 90 − ${a} = ${90 - a}.`); } },
    b: { t: 'why it works', g: R => {
      if (R.bool(0.4)) { const fg = rtri(R, 3, 4 + R.int(0, 3), {}, {}), n = fg.n, f = R.pick(['sin', 'cos']), g = CO[f], side = f === 'sin' ? fg.side.opp : fg.side.adj, hyp = fg.side.hyp, wrongSide = f === 'sin' ? fg.side.adj : fg.side.opp;
        const lines = [[`∠${n.C} = 90°`, 'given', []],
          [`∠${n.B} = 90° − ∠${n.A}`, 'triangle sum theorem', [0], ['vertical angles', `definition of ${FULL[f]}`, 'Pythagorean theorem'], `the angles add to 180° and ∠${n.C} takes 90°`],
          [`${f} ${n.A} = ${side}/${hyp}`, `definition of ${FULL[f]}`, [], [`definition of ${FULL[g]}`, 'definition of tangent', 'triangle sum theorem'], `${side} is ${f === 'sin' ? 'opposite' : 'adjacent to'} ∠${n.A} and ${hyp} is the hypotenuse`],
          [`${g} ${n.B} = ${side}/${hyp}`, `definition of ${FULL[g]}`, [], [`definition of ${FULL[f]}`, 'definition of tangent', 'triangle sum theorem'], `${side} is ${f === 'sin' ? 'adjacent to' : 'opposite'} ∠${n.B} and ${hyp} is the hypotenuse`],
          [`${f} ${n.A} = ${g} ${n.B}`, 'transitive property of equality', [2, 3], ['triangle sum theorem', `definition of ${FULL[g]}`, 'vertical angles'], 'both equal the same ratio'],
          [`${f} ${n.A} = ${g}(90° − ${n.A})`, 'substitution', [1, 4], ['triangle sum theorem', `definition of ${FULL[f]}`, 'Pythagorean theorem'], `∠${n.B} = 90° − ∠${n.A}`]];
        return proof(R, pmode(R), { head: `Given: right △${n.A}${n.B}${n.C} with ∠${n.C} = 90°. Prove: ${f} ${n.A} = ${g}(90° − ${n.A}).`, lines, vis: fg.vis,
          oexp: `The angle fact and the two ratios can come in any order. The same leg ${side} is ${f === 'sin' ? 'opposite' : 'adjacent to'} ∠${n.A} and ${f === 'sin' ? 'adjacent to' : 'opposite'} ∠${n.B}, so the ratios match, and ∠${n.B} is the complement of ∠${n.A}.`,
          breaks: [{ i: 3, rs: `definition of ${FULL[f]}`, why: `${side} is ${f === 'sin' ? 'adjacent to' : 'opposite'} ∠${n.B}, so ${side}/${hyp} is ${g} ${n.B} by the definition of ${FULL[g]}` },
            { i: 1, rs: 'vertical angles', why: `∠${n.A} and ∠${n.B} are not vertical angles; they add to 90° because the angles of the triangle add to 180° (triangle sum theorem)` },
            { i: 2, st: `${f} ${n.A} = ${wrongSide}/${hyp}`, why: `${f === 'sin' ? 'the side opposite' : 'the side adjacent to'} ∠${n.A} is ${side}, so ${f} ${n.A} = ${side}/${hyp}` }] }); }
      const kind = R.int(0, 2);
      if (kind === 0) { const s = pickTrip(R), fg = rtri(R, s.opp, s.adj, labsRole({ opp: String(s.opp), adj: String(s.adj), hyp: String(s.hyp) })), n = fg.n, f = R.pick(['sin', 'cos']);
        const val = f === 'sin' ? [s.opp, s.hyp] : [s.adj, s.hyp];
        return E.num(`${f} ${n.A} = ${pt(E.fracStr(...val))}. What is ${CO[f]} ${n.B}?`, [{ label: `${CO[f]} ${n.B} =`, frac: val, form: 'any' }],
          `${f === 'sin' ? `The side opposite ${n.A} (${fg.side.opp}) is adjacent to ${n.B}` : `The side adjacent to ${n.A} (${fg.side.adj}) is opposite ${n.B}`}, and the hypotenuse is shared. So ${CO[f]} ${n.B} = ${f} ${n.A} = ${pt(E.fracStr(...val))}.`, { visual: fg.vis }); }
      if (kind === 1) { let a; do a = R.int(10, 80); while (a === 45); const f = R.pick(['sin', 'cos']), v = trig(f, a).toFixed(3);
        return E.num(`${f} ${a}° ≈ ${v}. Without a calculator, find ${CO[f]} ${90 - a}°.`, [{ ans: +v }], `${a}° and ${90 - a}° are complements, the two acute angles of one right triangle. So ${CO[f]} ${90 - a}° = ${f} ${a}° ≈ ${v}.`); }
      const fg = rtri(R, 3, 4 + R.int(0, 3)), n = fg.n;
      return E.choice(R, `In this right triangle, why is sin ${n.A} = cos ${n.B}?`, `The side opposite ${n.A} is the side adjacent to ${n.B}.`, [`∠${n.A} and ∠${n.B} are equal.`, 'Sine and cosine are always equal.', `The hypotenuse is opposite both ${n.A} and ${n.B}.`],
        `sin ${n.A} = ${fg.side.opp}/${fg.side.hyp} and cos ${n.B} = ${fg.side.opp}/${fg.side.hyp}: the same leg is opposite ${n.A} and adjacent to ${n.B}.`, { visual: fg.vis }); } },
    c: { t: 'solve with it', g: R => {
      let x, a, b, c, d; const f = R.pick(['sin', 'tan', 'sec']);
      do { x = R.int(3, 25); a = R.int(1, 4); c = R.int(1, 4); b = R.int(-10, 30); d = 90 - (a + c) * x - b; } while (a * x + b <= 2 || c * x + d <= 2 || a * x + b >= 88 || c * x + d >= 88 || Math.abs(d) > 40);
      const L1 = E.poly([a, b]), L2 = E.poly([c, d]);
      return E.num(`Solve for x: ${M(`${f}(${L1})`).replace('</mrow></math>', '<mo>°</mo></mrow></math>')} = ${M(`${CO[f]}(${L2})`).replace('</mrow></math>', '<mo>°</mo></mrow></math>')}. (Both angles are acute and in degrees.)`, [{ label: 'x =', ans: x }],
        `A ${f === 'sin' ? 'sine' : f === 'tan' ? 'tangent' : 'secant'} equals the ${CO[f] === 'cos' ? 'cosine' : CO[f] === 'cot' ? 'cotangent' : 'cosecant'} of the complement, so the angles add to 90°: ${M(`(${L1})+(${L2})=90`)}, ${M(`${E.poly([a + c, b + d])}=90`)}, x = ${x}.`); } },
    d: { t: 'the "co" in cosine', g: R => {
      const f = R.pick(['sin', 'cos', 'tan', 'cot', 'sec', 'csc']); let a; do a = R.int(10, 80); while (a === 45);
      if (R.bool(0.4)) return E.num(`${TM(`${f}(${a}°)=${CO[f]}(x)`).replace('<mi>x</mi>', '<mi>x</mi><mo>°</mo>')}, with x between 0 and 90. Find x.`, [{ label: 'x =', ans: 90 - a }],
        `“Co” means complement: the ${FULL[CO[f]]} of an angle is the ${FULL[f]} of its complement. So x = 90 − ${a} = ${90 - a}.`);
      return E.choice(R, `Which is equal to ${TM(`${f}(${a}°)`)}?`, TM(`${CO[f]}(${90 - a}°)`), [TM(`${CO[f]}(${a}°)`), TM(`${CO[f]}(${180 - a}°)`), TM(`${f}(${90 - a}°)`)],
        `Cofunctions of complementary angles are equal, and complements add to 90°, not 180°: ${f} ${a}° = ${CO[f]} ${90 - a}°.`); } },
  });

  /* ================= V.6.12 Pythagorean identity ================= */
  S('V.6.12', 'Pythagorean identity', {
    a: { t: 'sin² + cos² = 1 from the triangle', g: R => {
      if (R.bool(0.4)) { const fg = rtri(R, 3, 4 + R.int(0, 3), { A: 'θ' }), n = fg.n, { opp, adj, hyp } = fg.side;
        const lines = [[`∠${n.C} = 90° and θ = ∠${n.A}`, 'given', []],
          [`${opp}² + ${adj}² = ${hyp}²`, 'Pythagorean theorem', [0], ['converse of the Pythagorean theorem', 'definition of sine', 'substitution'], `the triangle has a right angle at ${n.C}, and ${hyp} is the hypotenuse`],
          [`(${opp}/${hyp})² + (${adj}/${hyp})² = 1`, 'division property of equality', [1], ['Pythagorean theorem', 'substitution', 'definition of cosine'], `dividing both sides by ${hyp}² gives it`],
          [`sin θ = ${opp}/${hyp} and cos θ = ${adj}/${hyp}`, 'definitions of sine and cosine', [0], ['Pythagorean theorem', 'division property of equality', 'substitution'], `${opp} is opposite θ, ${adj} is adjacent to it, and ${hyp} is the hypotenuse`],
          ['sin²θ + cos²θ = 1', 'substitution', [2, 3], ['Pythagorean theorem', 'division property of equality', 'definitions of sine and cosine'], 'sin θ and cos θ replace the two ratios']];
        return proof(R, pmode(R), { head: `Given: right △${n.A}${n.B}${n.C} with ∠${n.C} = 90° and θ = ∠${n.A}. Prove: sin²θ + cos²θ = 1.`, lines, vis: fg.vis,
          oexp: 'Pythagoras divided by the hypotenuse squared gives two squared ratios that add to 1; those ratios are sin θ and cos θ (the definitions can come at any point before the end).',
          breaks: [{ i: 2, st: `${opp}/${hyp} + ${adj}/${hyp} = 1`, why: `dividing ${opp}² + ${adj}² = ${hyp}² by ${hyp}² gives (${opp}/${hyp})² + (${adj}/${hyp})² = 1; the squares stay` },
            { i: 3, st: `sin θ = ${adj}/${hyp} and cos θ = ${opp}/${hyp}`, why: `${opp} is opposite θ and ${adj} is adjacent, so sin θ = ${opp}/${hyp} and cos θ = ${adj}/${hyp}` },
            { i: 1, rs: 'converse of the Pythagorean theorem', why: 'the right angle is known and the side equation is what we want, so this is the Pythagorean theorem itself; the converse goes from the side equation to the right angle' }] }); }
      if (R.bool(0.35)) return E.choice(R, 'Why is sin²θ + cos²θ = 1 for an acute angle θ in a right triangle?', 'opposite² + adjacent² = hypotenuse², and dividing by hypotenuse² gives it', ['sin θ + cos θ = 1, and squaring keeps it true', 'the two acute angles add to 90°', 'sin θ and cos θ are always less than 1'],
        'sin θ = opp/hyp and cos θ = adj/hyp, so sin²θ + cos²θ = (opp² + adj²)/hyp² = hyp²/hyp² = 1 by Pythagoras.');
      const s = pickTrip(R), fg = rtri(R, s.opp, s.adj, { ...labsRole({ opp: String(s.opp), adj: String(s.adj), hyp: String(s.hyp) }), A: 'θ' });
      return E.num('Find sin θ and cos θ, then sin²θ + cos²θ.', [{ label: 'sin θ =', frac: [s.opp, s.hyp], form: 'any' }, { label: 'cos θ =', frac: [s.adj, s.hyp], form: 'any' }, { label: 'sin²θ + cos²θ =', ans: 1 }],
        `sin θ = ${s.opp}/${s.hyp}, cos θ = ${s.adj}/${s.hyp}. Then (${s.opp * s.opp} + ${s.adj * s.adj})/${s.hyp * s.hyp} = ${s.hyp * s.hyp}/${s.hyp * s.hyp} = 1, because ${s.opp}² + ${s.adj}² = ${s.hyp}².`, { visual: fg.vis }); } },
    b: { t: 'find cos from sin', g: R => {
      const from = R.pick(['sin', 'cos']), to = CO[from]; let p, q;
      if (R.bool(0.55)) { const s = pickTrip(R); p = s.opp; q = s.hyp; } else { do { q = R.int(3, 11); p = R.int(1, q - 1); } while (Number.isInteger(Math.sqrt(q * q - p * p)) || E.gcd(p, q) > 1); }
      const ans = ex(1, q * q - p * p, q);
      return E.num(`θ is acute and ${from} θ = ${pt(E.fracStr(p, q))}. Find ${to} θ. Give an exact answer.`, [{ label: `${to} θ =`, exact: ans }],
        `${to}²θ = 1 − (${pt(E.fracStr(p, q))})² = ${pt(E.fracStr(q * q - p * p, q * q))}, and ${to} θ > 0 for an acute angle, so ${to} θ = ${pt(ans)}.`); } },
    c: { t: 'find tan from both', g: R => {
      const from = R.pick(['sin', 'cos']); let p, q;
      if (R.bool(0.55)) { const s = pickTrip(R); p = s.opp; q = s.hyp; } else { do { q = R.int(3, 11); p = R.int(1, q - 1); } while (Number.isInteger(Math.sqrt(q * q - p * p)) || E.gcd(p, q) > 1); }
      const o = q * q - p * p, other = ex(1, o, q), tan = from === 'sin' ? E.surdStr(0, p, o, o) : E.surdStr(0, 1, o, p);
      return E.num(`θ is acute and ${from} θ = ${pt(E.fracStr(p, q))}. Find tan θ. Give an exact answer.`, [{ label: 'tan θ =', exact: tan }],
        `First ${CO[from]} θ = √(1 − (${pt(E.fracStr(p, q))})²) = ${pt(other)}. Then tan θ = sin θ ÷ cos θ = ${pt(from === 'sin' ? E.fracStr(p, q) : other)} ÷ ${pt(from === 'sin' ? other : E.fracStr(p, q))} = ${pt(tan)}.`); } },
    d: { t: 'check exact values', g: R => {
      const yes = R.bool();
      const T = [['3/5', '4/5'], ['5/13', '12/13'], ['8/17', '15/17'], ['0.6', '0.8'], ['0.28', '0.96'], ['1/2', 'sqrt(3)/2'], ['sqrt(2)/2', 'sqrt(2)/2'], ['1/3', '2sqrt(2)/3'], ['2/3', 'sqrt(5)/3'], ['7/25', '24/25']];
      const F = [['3/5', '2/5'], ['0.6', '0.4'], ['1/2', '1/2'], ['sqrt(3)/2', 'sqrt(2)/2'], ['0.5', '0.8'], ['5/13', '8/13'], ['1/3', '2/3'], ['0.3', '0.7'], ['4/5', '4/5'], ['sqrt(2)/2', '1/2']];
      let [s, c] = R.pick(yes ? T : F); if (R.bool()) [s, c] = [c, s];
      const sv = E.value(s)[0], cv = E.value(c)[0], tot = sv * sv + cv * cv, sum1 = Math.abs(sv + cv - 1) < 1e-9;
      return E.tf(`Could sin θ = ${pt(s)} and cos θ = ${pt(c)} for the same angle θ?`, yes,
        `Check sin²θ + cos²θ: (${pt(s)})² + (${pt(c)})² = ${yes ? '1, so yes.' : fx(tot, 4)}${yes ? '' : `, not 1, so no.${sum1 ? ' (They add to 1, but the identity is about squares.)' : ''}`}`, { choices: ['Yes', 'No'] }); } },
    e: { t: 'run it backwards: from tan', g: R => {
      let p, q; do { p = R.int(1, 9); q = R.int(1, 9); } while (p === q || E.gcd(p, q) > 1);
      const hh = p * p + q * q, sv = ex(p, hh, hh), cv = ex(q, hh, hh);
      return E.num(`θ is acute and tan θ = ${pt(E.fracStr(p, q))}. Find sin θ and cos θ. Give exact answers.`, [{ label: 'sin θ =', exact: sv }, { label: 'cos θ =', exact: cv }],
        `Draw a right triangle with opposite ${p} and adjacent ${q}; the hypotenuse is √(${p * p} + ${q * q}) = ${pt(rt(hh))}. So sin θ = ${p}/${pt(rt(hh))} = ${pt(sv)} and cos θ = ${q}/${pt(rt(hh))} = ${pt(cv)}.`); } },
    f: { t: 'sin θ + cos θ, competition style', g: R => {
      const minus = R.bool(0.3); let m, n;
      if (minus) { do { n = R.int(3, 13); m = R.int(1, n - 1); } while (E.gcd(m, n) > 1); }
      else { do { n = R.int(3, 13); m = R.int(n + 1, Math.floor(n * Math.SQRT2)); } while (m * m > 2 * n * n || E.gcd(m, n) > 1 || m <= n); }
      const kind = R.int(0, 2); if (kind === 2 && n > 8) return E.byId['V.6.12'].steps.f.g(R);
      const P = minus ? [n * n - m * m, 2 * n * n] : [m * m - n * n, 2 * n * n];   // sinθ·cosθ = P
      const red = (a, b) => { const g = E.gcd(a, b); return [a / g, b / g]; }, PR = red(...P);
      const lhs = `sin θ ${minus ? '−' : '+'} cos θ = ${m}/${n}`, sq = `Square it: 1 ${minus ? '−' : '+'} 2 sin θ cos θ = ${m * m}/${n * n}, so sin θ cos θ = ${pt(E.fracStr(PR[0], PR[1]))}`;
      if (kind === 0) return E.num(`${lhs}. Find sin θ · cos θ.`, [{ frac: PR, form: 'any' }], `${sq}.`);
      if (kind === 1) { const A = red(PR[1], PR[0]); return E.num(`${lhs}. Find tan θ + 1/tan θ.`, [{ frac: A, form: 'any' }], `${sq}. And tan θ + 1/tan θ = (sin²θ + cos²θ)/(sin θ cos θ) = 1 ÷ ${pt(E.fracStr(PR[0], PR[1]))} = ${pt(E.fracStr(A[0], A[1]))}.`); }
      const A = red(PR[1] * PR[1] - 2 * PR[0] * PR[0], PR[1] * PR[1]);
      return E.num(`${lhs}. Find sin⁴θ + cos⁴θ.`, [{ frac: A, form: 'any' }], `${sq}. Then sin⁴θ + cos⁴θ = (sin²θ + cos²θ)² − 2 sin²θ cos²θ = 1 − 2(${pt(E.fracStr(PR[0], PR[1]))})² = ${pt(E.fracStr(A[0], A[1]))}.`); } },
  });

  /* ================= V.6.13 Reciprocal ratios ================= */
  const REC = { csc: 'sin', sec: 'cos', cot: 'tan' }, RECN = { csc: 'cosecant', sec: 'secant', cot: 'cotangent' };
  const recipQ = (R, g) => {
    const f = REC[g], kind = R.int(0, 9);
    if (kind < 3) return E.choice(R, `Which is ${TM(`${g}(θ)`)}?`, TM(`1/${f}(θ)`), Object.values(REC).filter(x => x !== f).map(x => TM(`1/${x}(θ)`)).concat([TM(`${f}(θ)`)]),
      `${RECN[g][0].toUpperCase() + RECN[g].slice(1)} is the reciprocal of ${NAME[f]}: ${TM(`${g}(θ)=1/${f}(θ)`)}.${g === 'sec' ? ' (Secant goes with cosine, not sine.)' : g === 'csc' ? ' (Cosecant goes with sine, even though it shares the “co” of cosine.)' : ''}`);
    const s = pickTrip(R), [t, b] = PAIR[f];
    if (kind < 6) return E.num(`θ is acute and ${f} θ = ${pt(E.fracStr(s[t], s[b]))}. Find ${g} θ.`, [{ label: `${g} θ =`, frac: [s[b], s[t]], form: 'any' }], `${g} θ = 1/${f} θ = ${pt(E.fracStr(s[b], s[t]))}: flip the fraction.`);
    const fg = rtri(R, s.opp, s.adj, { ...labsRole({ opp: String(s.opp), adj: String(s.adj), hyp: String(s.hyp) }), A: 'θ' });
    return E.num(`Find ${g} θ.`, [{ label: `${g} θ =`, frac: [s[b], s[t]], form: 'any' }], `${f} θ = ${ROLE[t]}/${ROLE[b]} = ${s[t]}/${s[b]}, so ${g} θ = ${ROLE[b]}/${ROLE[t]} = ${s[b]}/${s[t]}${E.fracStr(s[b], s[t]) !== s[b] + '/' + s[t] ? ' = ' + pt(E.fracStr(s[b], s[t])) : ''}.`, { visual: fg.vis });
  };
  S('V.6.13', 'Reciprocal ratios', {
    a: { t: 'cosecant', g: R => recipQ(R, 'csc') },
    b: { t: 'secant', g: R => recipQ(R, 'sec') },
    c: { t: 'cotangent', g: R => recipQ(R, 'cot') },
    d: { t: 'evaluate from a triangle', g: R => {
      let sq;
      if (R.bool(0.55)) { const s = pickTrip(R); sq = { opp: s.opp ** 2, adj: s.adj ** 2, hyp: s.hyp ** 2 }; }
      else { let a, b; do { a = R.int(1, 7); b = R.int(1, 7); } while (a === b || Number.isInteger(Math.hypot(a, b))); sq = { opp: a * a, adj: b * b, hyp: a * a + b * b }; }
      const roles = ['opp', 'adj', 'hyp'], miss = R.pick(roles), lab = {}; roles.forEach(r => lab[r] = r === miss ? undefined : pt(rt(sq[r])));
      const fg = rtri(R, Math.sqrt(sq.opp), Math.sqrt(sq.adj), { ...labsRole(lab), A: 'θ' });
      const cs = ratioEx(sq.hyp, sq.opp), se = ratioEx(sq.hyp, sq.adj), ct = ratioEx(sq.adj, sq.opp);
      return E.num('Find csc θ, sec θ and cot θ. Give exact answers.', [{ label: 'csc θ =', exact: cs }, { label: 'sec θ =', exact: se }, { label: 'cot θ =', exact: ct }],
        `The missing side is ${pt(rt(sq[miss]))} (Pythagoras). csc θ = hyp/opp = ${pt(cs)}, sec θ = hyp/adj = ${pt(se)}, cot θ = adj/opp = ${pt(ct)}.`, { visual: fg.vis }); } },
  });

  /* ================= V.6.14 Calculator trig ================= */
  S('V.6.14', 'Calculator trig', {
    a: { t: 'degree vs radian mode', g: R => {
      let a, f, dv, rv; do { a = R.int(10, 85); f = R.pick(['sin', 'cos', 'tan']); dv = Math[f](K.rad(a)); rv = Math[f](a); } while (Math.abs(dv - rv) < 0.15 || Math.abs(rv) > 9);
      const rad = R.bool(), shown = (rad ? rv : dv).toFixed(3);
      return E.choiceFixed(`A calculator shows ${f} ${a} = ${shown}. Which mode is it in?`, ['degree mode', 'radian mode'], rad ? 1 : 0,
        `In degree mode ${f} ${a}° = ${dv.toFixed(3)}. In radian mode it treats ${a} as ${a} radians and shows ${rv.toFixed(3)}. So this is ${rad ? 'radian' : 'degree'} mode.`); } },
    b: { t: 'inverse keys', g: R => {
      const f = R.pick(['sin', 'cos', 'tan']), v = f === 'tan' ? R.int(15, 400) / 100 : R.int(8, 96) / 100;
      if (R.bool()) return E.choice(R, `${TM(`${f}(θ)=${v}`)}. Which calculator entry gives θ?`, `${f}⁻¹(${v})`, [`1 ÷ ${f}(${v})`, `${f}(${v})`, `${CO[f] === 'cot' ? 'cos' : CO[f]}⁻¹(${v})`],
        `To go from a ratio back to an angle, use the inverse key: θ = ${f}⁻¹(${v}). The ⁻¹ means inverse, not 1 ÷ ${f}.`);
      const a = inv(f, v); if (!okR(a)) return S_14b(R);
      return E.num(`${TM(`${f}(θ)=${v}`)}. Use your calculator to find θ in degrees, to 1 decimal place.`, [{ label: 'θ =', ans: a, dp: 1 }], `In degree mode, ${f}⁻¹(${v}) ≈ ${fx(a)}°.`); } },
    c: { t: 'rounding in steps', g: R => {
      const L = R.int(6, 30), A = R.int(20, 70), B = R.int(15, 70), f1 = R.pick(['sin', 'cos']), x = L * trig(f1, A), y = x / trig('tan', B), yr = +x.toFixed(1) / trig('tan', B);
      if (!okR(y) || fx(yr) === fx(y)) return S_14c(R);
      return E.num(`First find ${TM(`a=${L}${f1}(${A}°)`)}. Then use it to find ${TM(`b=a/tan(${B}°)`)}. Give b to 1 decimal place, rounding only at the end.`, [{ label: 'b =', ans: y, dp: 1 }],
        `Keep a ≈ ${x.toFixed(4)} in the calculator: b = ${x.toFixed(4)} ÷ tan ${B}° ≈ ${fx(y)}. Rounding a to ${fx(x)} first would give ${fx(yr)}.`); } },
    d: { t: 'exact vs approximate', g: R => {
      const yes = R.bool(), kind = R.int(0, 2), [f, v, a] = R.pick(SPEC.filter(x => x[1] !== '1/2' && x[1] !== '1'));
      if (kind === 0) return E.num(`Find ${f} ${a}° exactly.`, [{ label: `${f} ${a}° =`, exact: v }], `${f} ${a}° = ${pt(v)} exactly (from the special triangles). A calculator shows ${fx(E.value(v)[0], 4)}, which is only an approximation.`);
      if (kind === 1) { const dec = E.value(v)[0].toFixed(3);
        return E.tf(`True or false? ${f} ${a}° is exactly ${yes ? pt(v) : dec}.`, yes, yes ? `${pt(v)} is the exact value; ${dec} is a rounded approximation.` : `${dec} is rounded. The exact value is ${pt(v)}, which never ends as a decimal.`); }
      const h = 2 * R.int(1, 10), ang = R.pick([30, 45, 60]), want = R.pick(['opp', 'adj']);
      const ans = want === 'opp' ? (ang === 30 ? String(h / 2) : ang === 45 ? ex(h, 2, 2) : ex(h, 3, 2)) : (ang === 30 ? ex(h, 3, 2) : ang === 45 ? ex(h, 2, 2) : String(h / 2));
      const fg = rtri(R, h * trig('sin', ang), h * trig('cos', ang), { ...labsRole({ hyp: String(h), [want]: 'x' }), A: ang + '°' });
      const fn = want === 'opp' ? 'sin' : 'cos';
      return E.num('Find x. Give an exact answer.', [{ label: 'x =', exact: ans }], `x = ${h} ${fn} ${ang}° = ${h} × ${pt(SPEC.find(s => s[0] === fn && s[2] === ang)[1])} = ${pt(ans)}${/sqrt/.test(ans) ? `, exact (a calculator gives only ${fx(E.value(ans)[0], 3)})` : ''}.`, { visual: fg.vis }); } },
  });
  function S_14b(R) { return E.byId['V.6.14'].steps.b.g(R); }
  function S_14c(R) { return E.byId['V.6.14'].steps.c.g(R); }
})(typeof window !== 'undefined' ? window : globalThis);
