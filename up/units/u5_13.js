/* Era V · Unit V.13 Transformations (V.13.01–V.13.12) */
(function (G) {
  const E = G.E5, V = E.V, C = E.C, M = s => E.mx(s), K = E.K;
  const S = (id, name, steps) => E.skill({ id, name, steps });
  const r2 = K.r2;

  /* ================= numbers and text ================= */
  const nz = (R, lo, hi) => { let v; do v = R.int(lo, hi); while (!v); return v; };
  const sg = n => String(n).replace('-', '−');
  const pt = p => `(${p[0]}, ${p[1]})`;
  const vec = v => `⟨${sg(v[0])}, ${sg(v[1])}⟩`;
  const PF = (p, label) => Object.assign({ point: [String(p[0]), String(p[1])] }, label ? { label } : {});
  const VF = v => [{ label: 'a =', ans: v[0] }, { label: 'b =', ans: v[1] }];
  const plus = n => n < 0 ? ` − ${-n}` : ` + ${n}`;                       // " + 3" / " − 3"
  const sq = n => Number.isInteger(Math.sqrt(n)) ? String(Math.sqrt(n)) : `√${n}`;
  const d2 = (P, Q) => (P[0] - Q[0]) ** 2 + (P[1] - Q[1]) ** 2;
  const eqP = (P, Q) => Math.abs(P[0] - Q[0]) < 1e-9 && Math.abs(P[1] - Q[1]) < 1e-9;
  const fx = x => Math.abs(x) < 1e-9 ? 0 : Math.round(x * 1e6) / 1e6;
  const mvTxt = v => [v[0] ? `${Math.abs(v[0])} unit${Math.abs(v[0]) > 1 ? 's' : ''} ${v[0] > 0 ? 'right' : 'left'}` : '', v[1] ? `${Math.abs(v[1])} unit${Math.abs(v[1]) > 1 ? 's' : ''} ${v[1] > 0 ? 'up' : 'down'}` : ''].filter(Boolean).join(' and ');
  const yn = (prompt, yes, why, o = {}) => E.tf(prompt, yes, why, Object.assign({ choices: ['Yes', 'No'] }, o));
  const ord = { 1: 'once', 2: 'twice', 3: 'three times', 4: 'four times' };
  // proof helpers: a two-column table with one reason hidden, numbered lines, three distinct wrong options
  const tbl = (rows, hide) => `<table class="dt"><tr><th>#</th><th>Statement</th><th>Reason</th></tr>${rows.map((r, i) => `<tr><td>${i + 1}</td><td>${r[0]}</td><td>${i === hide ? '<b>?</b>' : r[1]}</td></tr>`).join('')}</table>`;
  const numbered = lines => `<table class="dt">${lines.map((l, i) => `<tr><th>${i + 1}</th><td>${l}</td></tr>`).join('')}</table>`;
  const uniq3 = (ok, cands) => [...new Set(cands.filter(x => x !== ok))].slice(0, 3);
  const withR = rows => rows.map(r => `${r[0]} <i>(${r[1]})</i>`);

  /* ================= affine maps: x′ = m·x + t ================= */
  const I2 = [1, 0, 0, 1];
  const AF = (m, t = [0, 0]) => ({ m, t });
  const ap = (F, p) => [fx(F.m[0] * p[0] + F.m[1] * p[1] + F.t[0]), fx(F.m[2] * p[0] + F.m[3] * p[1] + F.t[1])];
  const mm = (A, B) => [A[0] * B[0] + A[1] * B[2], A[0] * B[1] + A[1] * B[3], A[2] * B[0] + A[3] * B[2], A[2] * B[1] + A[3] * B[3]];   // A·B: B first
  const mv = (A, p) => [fx(A[0] * p[0] + A[1] * p[1]), fx(A[2] * p[0] + A[3] * p[1])];
  const cmp = (G2, F) => AF(mm(G2.m, F.m), ap(G2, F.t));                 // F first, then G2
  const tr = v => AF(I2, v);
  const about = (m, c) => AF(m, [c[0] - (m[0] * c[0] + m[1] * c[1]), c[1] - (m[2] * c[0] + m[3] * c[1])]);
  const sameF = (F, G2) => F.m.every((x, i) => Math.abs(x - G2.m[i]) < 1e-9) && eqP(F.t, G2.t);
  // the eight symmetries of the square, about the origin
  const D4 = [
    { k: 'rx', m: [1, 0, 0, -1], n: 'a reflection in the x-axis', r: '(x, −y)', sh: 'reflect in the x-axis' },
    { k: 'ry', m: [-1, 0, 0, 1], n: 'a reflection in the y-axis', r: '(−x, y)', sh: 'reflect in the y-axis' },
    { k: 'rd', m: [0, 1, 1, 0], n: 'a reflection in the line y = x', r: '(y, x)', sh: 'reflect in the line y = x' },
    { k: 'ra', m: [0, -1, -1, 0], n: 'a reflection in the line y = −x', r: '(−y, −x)', sh: 'reflect in the line y = −x' },
    { k: 'r90', m: [0, -1, 1, 0], n: 'a rotation of 90° counterclockwise about the origin', r: '(−y, x)', sh: 'rotate 90° counterclockwise about the origin' },
    { k: 'r180', m: [-1, 0, 0, -1], n: 'a rotation of 180° about the origin', r: '(−x, −y)', sh: 'rotate 180° about the origin' },
    { k: 'r270', m: [0, 1, -1, 0], n: 'a rotation of 90° clockwise about the origin', r: '(y, −x)', sh: 'rotate 90° clockwise about the origin' },
    { k: 'id', m: [1, 0, 0, 1], n: 'the identity (every point stays put)', r: '(x, y)', sh: 'do nothing' },
  ];
  const D = {}; D4.forEach(d => D[d.k] = d);
  const byM = m => D4.find(d => d.m.every((x, i) => Math.abs(x - m[i]) < 1e-9));
  const ng = s => s[0] === '−' ? s.slice(1) : '−' + s;
  const sym = (m, u, v) => [m[0] ? (m[0] > 0 ? u : ng(u)) : (m[1] > 0 ? v : ng(v)), m[2] ? (m[2] > 0 ? u : ng(u)) : (m[3] > 0 ? v : ng(v))];
  const symT = (m, u = 'x', v = 'y') => `(${sym(m, u, v).join(', ')})`;
  const ROT = { 90: [0, -1, 1, 0], 180: [-1, 0, 0, -1], 270: [0, 1, -1, 0] };
  const rotName = a => a === 90 ? '90° counterclockwise' : a === 270 ? '90° clockwise' : '180°';

  /* ================= coordinate-grid figure =================
     o: {polys:[{p:[[x,y]…], names:[…], color, dash}], pts:[[x,y,label,color]], lines:[{x:k}|{f:x=>y}, lab], arrows:[[P,Q,color]], extra:[[x,y]], w, label} */
  const halo = s => s.replace('<text ', '<text paint-order="stroke" stroke="#fff" stroke-width="3.5" stroke-linejoin="round" ');
  const gfig = o => {
    const ps = [[0, 0]]; (o.polys || []).forEach(p => ps.push(...p.p)); (o.pts || []).forEach(p => ps.push([p[0], p[1]])); (o.extra || []).forEach(p => ps.push(p));
    const xs = ps.map(p => p[0]), ys = ps.map(p => p[1]);
    let x0 = Math.floor(Math.min(...xs)) - 1, x1 = Math.ceil(Math.max(...xs)) + 1, y0 = Math.floor(Math.min(...ys)) - 1, y1 = Math.ceil(Math.max(...ys)) + 1;
    const Sz = Math.max(x1 - x0, y1 - y0, 8); x0 -= Math.floor((Sz - (x1 - x0)) / 2); y0 -= Math.floor((Sz - (y1 - y0)) / 2);
    const W = o.w || 290, tk = Sz > 15 ? 2 : 1, fns = [], vl = [];
    (o.lines || []).forEach(L => { if (L.x !== undefined) vl.push({ x: L.x, color: L.color || C.teal, dash: true }); else fns.push({ f: L.f, color: L.color || C.teal, dash: true }); });
    const svg = V.graph({ x: [x0, x0 + Sz], y: [y0, y0 + Sz], w: W, h: W, ticks: tk, labels: true, fns, vlines: vl, label: o.label || 'figures on a coordinate grid' });
    const pad = 18, X = x => r2(pad + (x - x0) / Sz * (W - 2 * pad)), Y = y => r2(W - pad - (y - y0) / Sz * (W - 2 * pad));
    let b = '', labs = '';
    (o.arrows || []).forEach(([P, Q, col = C.muted]) => { const a = [X(P[0]), Y(P[1])], z = [X(Q[0]), Y(Q[1])], u = K.unit(K.sub(z, a)), w = [-u[1], u[0]], t1 = K.add(K.sub(z, K.mul(u, 9)), K.mul(w, 5)), t2 = K.sub(K.sub(z, K.mul(u, 9)), K.mul(w, 5));
      b += `<line x1="${a[0]}" y1="${a[1]}" x2="${r2(z[0] - u[0] * 3)}" y2="${r2(z[1] - u[1] * 3)}" stroke="${col}" stroke-width="2" stroke-dasharray="5 4"/><path d="M${r2(t1[0])} ${r2(t1[1])} L${z[0]} ${z[1]} L${r2(t2[0])} ${r2(t2[1])}" fill="none" stroke="${col}" stroke-width="2"/>`; });
    (o.polys || []).forEach((pl, j) => { const col = pl.color || [C.blue, C.red, C.violet][j % 3], q = pl.p.map(p => [X(p[0]), Y(p[1])]);
      b += `<polygon points="${q.map(p => p.join(',')).join(' ')}" fill="${col}" fill-opacity="0.16" stroke="${col}" stroke-width="2.4" stroke-linejoin="round"${pl.dash ? ' stroke-dasharray="6 4"' : ''}/>`;
      const cx = q.reduce((s, p) => s + p[0], 0) / q.length, cy = q.reduce((s, p) => s + p[1], 0) / q.length;
      q.forEach((p, i) => { b += V.dot(p[0], p[1], 3.2, col); const nm = (pl.names || [])[i]; if (!nm) return; const u = K.unit([p[0] - cx, p[1] - cy]);
        labs += halo(V.text(r2(p[0] + u[0] * 13), r2(p[1] + u[1] * 13), nm, { size: 13, weight: 700, fill: C.ink })); }); });
    (o.pts || []).forEach(([x, y, lab, col]) => { b += V.dot(X(x), Y(y), 4, col || C.ink); if (lab) labs += halo(V.text(r2(X(x) + 9), r2(Y(y) - 11), lab, { size: 13, weight: 700, anchor: 'start', fill: C.ink })); });
    (o.lines || []).forEach(L => { if (!L.lab) return; let lx, ly;
      if (L.x !== undefined) { lx = X(L.x) + 5; ly = pad + 10; }
      else { for (let x = x0 + Sz - 0.6; x > x0; x -= 0.25) { const y = L.f(x); if (y > y0 + 0.6 && y < y0 + Sz - 0.6) { lx = X(x) - 4; ly = Y(y) - 12; break; } } }
      if (lx !== undefined) labs += halo(V.text(r2(lx), r2(ly), L.lab, { size: 12.5, weight: 700, anchor: L.x !== undefined ? 'start' : 'end', fill: L.color || C.teal })); });
    return svg.replace(/<\/g><\/svg>$/, b + labs + '</g></svg>');
  };
  // a scalene triangle with whole-number vertices, big enough to see its shape
  const gtri = (R, lo = -3, hi = 3) => { let T;
    do T = [0, 1, 2].map(() => [R.int(lo, hi), R.int(lo, hi)]);
    while (Math.abs((T[1][0] - T[0][0]) * (T[2][1] - T[0][1]) - (T[2][0] - T[0][0]) * (T[1][1] - T[0][1])) < 6 || new Set([d2(T[0], T[1]), d2(T[1], T[2]), d2(T[2], T[0])]).size < 3 || Math.min(d2(T[0], T[1]), d2(T[1], T[2]), d2(T[2], T[0])) < 4);
    return T; };
  const inBox = (pts, b) => pts.every(p => Math.abs(p[0]) <= b && Math.abs(p[1]) <= b);
  const triTxt = (L, T) => L.map((c, i) => `${c}${pt(T[i])}`).join(', ');
  const primes = L => L.map(c => c + '′');
  // a random isometry for "spot the image" pictures
  const isoRand = R => { const t = R.int(0, 4);
    if (t === 0) { let v; do v = [R.int(-5, 5), R.int(-5, 5)]; while (Math.abs(v[0]) + Math.abs(v[1]) < 4); return { F: tr(v), n: `a translation by ${vec(v)}` }; }
    if (t === 1) { const k = R.int(-1, 1); return { F: AF([-1, 0, 0, 1], [2 * k, 0]), n: k ? `a reflection in the line x = ${k}` : 'a reflection in the y-axis', line: { x: k } }; }
    if (t === 2) { const k = R.int(-1, 1); return { F: AF([1, 0, 0, -1], [0, 2 * k]), n: k ? `a reflection in the line y = ${k}` : 'a reflection in the x-axis', line: { f: () => k } }; }
    if (t === 3) return { F: AF(D.r90.m), n: 'a rotation of 90° counterclockwise about the origin' };
    return { F: AF(D.r180.m), n: 'a rotation of 180° about the origin' }; };

  /* ================= V.13.01 Rigid motions defined ================= */
  S('V.13.01', 'Rigid motions defined', {
    a: { t: 'preimage and image', g: R => { const kind = R.int(0, 2);
      if (kind === 2) { const truth = R.bool(), p = [nz(R, -6, 6), nz(R, -6, 6)], q = [nz(R, -6, 6), nz(R, -6, 6)], P = `P${pt(p)}`, Q = `P′${pt(q)}`;
        const T = [[`A transformation maps ${P} to ${Q}. Then P′ is the image of P.`, 'The image is the point after the move, here P′.'], [`A transformation maps ${P} to ${Q}. Then P is the preimage of P′.`, 'The preimage is the point before the move, here P.'],
          [`In the notation T(P) = P′, the point P′ is the image.`, 'T(P) is where T sends P, so P′ is the image.'], ['The image of a figure is the figure after the transformation.', 'Image means "after"; preimage means "before".']];
        const F = [[`A transformation maps ${P} to ${Q}. Then P′ is the preimage of P.`, 'P′ comes after the move, so it is the image; P is the preimage.'], [`A transformation maps ${P} to ${Q}. Then P is the image of P′.`, 'P is where the move starts, so P is the preimage and P′ is the image.'],
          [`In the notation T(P) = P′, the point P′ is the preimage.`, 'T(P) is the output of T, so P′ is the image and P is the preimage.'], ['The preimage of a figure is the figure after the transformation.', 'The preimage is the figure before the move; the image is after.']];
        const [st, why] = R.pick(truth ? T : F); return E.tf(`True or false? ${st}`, truth, why); }
      let T, iso, T2; do { T = gtri(R); iso = isoRand(R); T2 = T.map(p => ap(iso.F, p)); } while (T2.some(p => T.some(q => eqP(p, q))));   // no shared vertices, so labels stay apart
      const L = K.lets(R, 6), A = L.slice(0, 3), B = L.slice(3);
      const vis = gfig({ polys: [{ p: T, names: A }, { p: T2, names: B }], lines: iso.line ? [iso.line] : [], label: 'a triangle and its image on a grid' });
      const i = R.int(0, 2), back = R.bool(0.35);
      if (kind === 0) return back ? E.choice(R, `△${A.join('')} is mapped onto △${B.join('')}. Which point is the preimage of ${B[i]}?`, A[i], A.filter((_, j) => j !== i).concat(B[i]), `The letters match in order, ${A.map((c, j) => c + '→' + B[j]).join(', ')}, so ${B[i]} is the image of ${A[i]}: ${A[i]} is its preimage.`, { visual: vis })
        : E.choice(R, `△${A.join('')} is mapped onto △${B.join('')}. Which point is the image of ${A[i]}?`, B[i], B.filter((_, j) => j !== i).concat(A[i]), `The letters match in order, ${A.map((c, j) => c + '→' + B[j]).join(', ')}, so the image of ${A[i]} is ${B[i]}.`, { visual: vis });
      return E.num(`△${A.join('')} is mapped onto △${B.join('')}. What are the coordinates of the image of ${A[i]}?`, [PF(T2[i], `${B[i]} =`)], `The letters match in order, so ${A[i]} goes to ${B[i]}, which is at ${pt(T2[i])}. (The move is ${iso.n}.)`, { visual: vis }); } },
    b: { t: 'isometry', g: R => { const kind = R.int(0, 2);
      if (kind === 0) { const yes = R.bool(), a = nz(R, -5, 5), b = nz(R, -5, 5), k = R.pick([2, 3]);
        const Y = [[`(x${plus(a)}, y${plus(b)})`, p => [p[0] + a, p[1] + b], `a translation by ${vec([a, b])}`], [`(−x, y${plus(b)})`, p => [-p[0], p[1] + b], 'a reflection in the y-axis followed by a translation'],
          [`(y, x)`, p => [p[1], p[0]], 'a reflection in the line y = x'], [`(−y${plus(a)}, x)`, p => [-p[1] + a, p[0]], 'a 90° rotation followed by a translation'], [`(x${plus(a)}, −y)`, p => [p[0] + a, -p[1]], 'a reflection in the x-axis followed by a translation'], [`(−x, −y)`, p => [-p[0], -p[1]], 'a 180° rotation about the origin']];
        const N = [[`(${k}x, ${k}y)`, p => [k * p[0], k * p[1]]], [`(x, ${k}y)`, p => [p[0], k * p[1]]], [`(${k}x, y${plus(b)})`, p => [k * p[0], p[1] + b]], [`(x + y, y)`, p => [p[0] + p[1], p[1]]], [`(−${k}x, y)`, p => [-k * p[0], p[1]]], [`(x${plus(a)}, ${k}y)`, p => [p[0] + a, k * p[1]]]];
        if (yes) { const [r, , nm] = R.pick(Y); return yn(`Is the transformation (x, y) → ${r} an isometry?`, true, `Yes: it is ${nm}, so every distance stays the same.`); }
        const [r, f] = R.pick(N), pr = [[[0, 0], [1, 0]], [[0, 0], [0, 1]], [[0, 0], [1, 1]]].find(([p, q]) => Math.abs(d2(f(p), f(q)) - d2(p, q)) > 1e-9), [p, q] = pr;
        return yn(`Is the transformation (x, y) → ${r} an isometry?`, false, `No: ${pt(p)} and ${pt(q)} are ${sq(d2(p, q))} apart, but their images ${pt(f(p))} and ${pt(f(q))} are ${sq(d2(f(p), f(q)))} apart. An isometry keeps every distance.`); }
      if (kind === 1) { const yes = R.bool(), D0 = R.pick([[3, 4], [5, 12], [6, 8], [1, 2], [2, 3], [1, 3], [2, 4]]), A = [R.int(-5, 5), R.int(-5, 5)], A2 = [R.int(-5, 5), R.int(-5, 5)];
        const flip = v => { let w = R.bool() ? [v[1], v[0]] : v.slice(); return [w[0] * R.pick([1, -1]), w[1] * R.pick([1, -1])]; };
        let d1 = flip(D0), dd; if (yes) dd = flip(D0); else do dd = R.bool() ? flip(D0.map(x => 2 * x)) : flip(R.pick([[1, 1], [2, 2], [1, 4], [3, 3], [4, 5], [2, 5]])); while (dd[0] ** 2 + dd[1] ** 2 === D0[0] ** 2 + D0[1] ** 2);
        const B = [A[0] + d1[0], A[1] + d1[1]], B2 = [A2[0] + dd[0], A2[1] + dd[1]], L1 = d2(A, B), L2 = d2(A2, B2);
        return yn(`A transformation T maps A${pt(A)} to A′${pt(A2)} and B${pt(B)} to B′${pt(B2)}. Could T be an isometry?`, yes, `AB = √(${d1[0] ** 2} + ${d1[1] ** 2}) = ${sq(L1)} and A′B′ = √(${dd[0] ** 2} + ${dd[1] ** 2}) = ${sq(L2)}. ${yes ? 'The distance is kept, so T could be an isometry.' : 'The distance changed, so T is not an isometry.'}`); }
      const k = R.pick([2, 3, 4, '1/2', '1/3']), v = [nz(R, -6, 6), nz(R, -6, 6)], ang = R.pick([60, 90, 120, 180]);
      const rig = [`a translation by ${vec(v)}`, `a reflection in the line y = ${R.int(-4, 4)}`, `a rotation of ${ang}° about ${pt([R.int(-3, 3), R.int(-3, 3)])}`, 'a reflection in the line y = x'];
      if (R.bool()) return E.choice(R, 'Which transformation is NOT an isometry?', `a dilation with scale factor ${k}`, R.sample(rig, 3), `A dilation with factor ${k} multiplies every distance by ${k}, so it changes size. Translations, reflections and rotations keep every distance.`);
      return E.choice(R, 'Which transformation is an isometry?', R.pick(rig), [`a dilation with scale factor ${k}`, `a horizontal stretch by a factor of ${R.pick([2, 3])}`, `a dilation with scale factor ${R.pick([5, '1/4'])}`], 'Translations, reflections and rotations keep every distance the same. Dilations and stretches change some distances.'); } },
    c: { t: 'what is preserved', g: R => { const kind = R.int(0, 5);
      if (kind >= 4) { // proof: keeping distances means keeping angles
        const L = K.trio(R), Lp = primes(L), [A, B, Cc] = L, [A2, B2, C2] = Lp, mv0 = R.pick(['A rotation', 'A reflection', 'A translation', 'A glide reflection']), RM = 'rigid motions keep distances';
        const rows = [[`${mv0} maps △${L.join('')} onto △${Lp.join('')}`, 'given'], [`${A2}${B2} = ${A}${B}`, RM], [`${B2}${C2} = ${B}${Cc}`, RM], [`${A2}${C2} = ${A}${Cc}`, RM], [`△${Lp.join('')} ≅ △${L.join('')}`, 'SSS'], [`∠${A2}${B2}${C2} = ∠${A}${B}${Cc}`, 'CPCTC']];
        if (kind === 4) return K.orderQ(R, `Prove that a rigid motion keeps the size of ∠${A}${B}${Cc}: put the steps in order.`, withR(rows), [[], [0], [0], [0], [1, 2, 3], [4]],
          'The three distance lines can come in any order. Together they give SSS, and then the matching angles are equal by CPCTC. So a rigid motion keeps angles because it keeps distances.', { fixed: 1 });
        // the table merges the three distance lines, so no shown reason gives the hidden one away
        const rows2 = [rows[0], [`${rows[1][0]}, ${rows[2][0]} and ${rows[3][0]}`, RM], rows[4], rows[5]], j = R.pick([1, 2, 3]), W = { 1: ['rigid motions keep orientation', 'CPCTC', 'reflexive property'], 2: ['SAS', 'ASA', 'AAA'], 3: ['SSS', RM, 'vertical angles'] }[j];
        return E.choice(R, `This proof shows that a rigid motion keeps the size of ∠${A}${B}${Cc}. What is the missing reason?${tbl(rows2, j)}`, rows2[j][1], W,
          { 1: 'A rigid motion keeps every distance, so each side keeps its length. (Reflections reverse orientation, so that is not a reason.)', 2: 'Three pairs of equal sides: SSS. No angle is known yet, and AAA never proves congruence.', 3: 'The triangles are congruent, so their corresponding angles are equal: CPCTC.' }[j]); }
      if (kind === 0) { const L = K.lets(R, 6), mv0 = R.pick(['a rotation', 'a reflection', 'a translation', 'a glide reflection']), a = R.int(3, 15), b = R.int(3, 15), ang = R.int(25, 110), ask = R.int(0, 2);
        const q = [[`${L[3]}${L[4]}`, a, `${L[0]}${L[1]} = ${a}`, 'A rigid motion keeps lengths'], [`∠${L[4]}`, ang, `∠${L[1]} = ${ang}°`, 'A rigid motion keeps angle measures'], [`the perimeter of △${L.slice(3).join('')}`, a + b + 9, `the perimeter of △${L.slice(0, 3).join('')} is ${a + b + 9}`, 'A rigid motion keeps every length, so it keeps the perimeter']][ask];
        return E.num(`${mv0[0].toUpperCase() + mv0.slice(1)} maps △${L.slice(0, 3).join('')} onto △${L.slice(3).join('')}, and ${q[2]}. Find ${q[0]}.`, [{ label: `${q[0].replace('the perimeter of ', 'perimeter ')} =`, ans: q[1] }], `${q[3]}: ${q[0]} = ${q[1]}${ask === 1 ? '°' : ''}.`); }
      if (kind === 1) { const P = ['the distance between any two points', 'the size of every angle', 'the area of a figure', 'parallel lines staying parallel', 'the perimeter of a figure', 'points on a line staying on a line'], N = ['the clockwise order of the vertices (orientation)', 'the coordinates of each point', 'the slope of each side', 'the direction the figure faces'];
        if (R.bool()) return E.choice(R, 'Which property is kept by every rigid motion?', R.pick(P), R.sample(N, 3), 'Rigid motions keep distances, so they keep angles, areas, perimeters, parallels and lines too. They can move, turn or flip a figure, changing its position, slopes and orientation.');
        const n = R.pick(N); return E.choice(R, 'Which property is NOT always kept by a rigid motion?', n, R.sample(P, 3), `Rigid motions keep every distance and everything built from distances. But a rigid motion can move or turn a figure, and a reflection flips it, so ${n} can change.`); }
      if (kind === 2) { const cw = R.bool(), m = R.pick(['a reflection in a line', 'a rotation of 90°', 'a translation', 'a reflection in a line', 'a rotation of 180°', 'a glide reflection']), flips = m.includes('reflection');
        const res = flips !== cw ? 'clockwise' : 'counterclockwise';
        return E.choiceFixed(`The vertices A, B, C of a triangle go ${cw ? 'clockwise' : 'counterclockwise'}. After ${m}, in which direction do A′, B′, C′ go?`, ['clockwise', 'counterclockwise'], res === 'clockwise' ? 0 : 1, flips ? `${m[0].toUpperCase() + m.slice(1)} flips the figure, which reverses orientation, so the order becomes ${res}.` : `${m[0].toUpperCase() + m.slice(1)} slides or turns without flipping, so the orientation stays ${res}.`); }
      const k = R.pick([2, 3, 4, '1/2']);
      if (R.bool()) return E.choice(R, `Which property is NOT kept by a dilation with scale factor ${k}?`, R.pick(['the length of each side', 'the area of a figure', 'the perimeter of a figure']), ['the size of every angle', 'parallel lines staying parallel', 'points on a line staying on a line'], `A dilation keeps the shape (angles, parallels, lines) but multiplies lengths by ${k}, so lengths, perimeter and area change. That is why it is not a rigid motion.`);
      return E.choice(R, `Which property IS kept by a dilation with scale factor ${k}?`, R.pick(['the size of every angle', 'parallel lines staying parallel']), ['the length of each side', 'the area of a figure', 'the perimeter of a figure'], `A dilation keeps the shape, so angles and parallels stay, but every length is multiplied by ${k}.`); } },
    d: { t: 'function notation for moves', g: R => { const kind = R.int(0, 3), a = nz(R, -6, 6), b = nz(R, -6, 6), p = [nz(R, -7, 7), nz(R, -7, 7)];
      if (kind === 0) { const q = [p[0] + a, p[1] + b]; return E.num(`T(x, y) = (x${plus(a)}, y${plus(b)}). Find T${pt(p)}.`, [PF(q, 'T =')], `${a > 0 ? `Add ${a} to x` : `Subtract ${-a} from x`} and ${b > 0 ? `add ${b} to y` : `subtract ${-b} from y`}: T${pt(p)} = (${p[0]}${plus(a)}, ${p[1]}${plus(b)}) = ${pt(q)}.`); }
      if (kind === 1) { const d = R.pick(D4.slice(0, 7)), q = mv(d.m, p), inv = byM([d.m[0], d.m[2], d.m[1], d.m[3]]);
        return E.num(`T(x, y) = ${d.r}, and T(P) = ${pt(q)}. Find P.`, [PF(p, 'P =')], `T is ${d.n}. Undo it with ${inv === d ? 'the same move' : inv.n}: P = ${pt(p)}. Check: T${pt(p)} = ${pt(q)}.`); }
      if (kind === 2) { const d = R.pick(D4.slice(0, 7)), wrong = R.sample(D4.slice(0, 7).filter(x => x !== d), 3);
        return E.choice(R, `T(x, y) = ${d.r}. What does T do?`, d.n.replace(/^a /, ''), wrong.map(w => w.n.replace(/^a /, '')), `T sends (x, y) to ${d.r}, which is the rule for ${d.n}.`); }
      const d = R.pick([D.r90, D.ry, D.rx, D.rd]), q1 = mv(d.m, p), q = [q1[0] + a, q1[1] + b];
      return E.num(`R(x, y) = ${d.r} and T(x, y) = (x${plus(a)}, y${plus(b)}). Find T(R${pt(p)}).`, [PF(q)], `Work from the inside out: R${pt(p)} = ${pt(q1)}, then T${pt(q1)} = ${pt(q)}.`); } },
  });

  /* ================= V.13.02 Translation vectors ================= */
  S('V.13.02', 'Translation vectors', {
    a: { t: 'vector notation', g: R => { let v; do v = [R.int(-8, 8), R.int(-8, 8)]; while (!v[0] && !v[1]);
      if (R.bool()) return E.num(`A translation moves every point ${mvTxt(v)}. Write its vector ⟨a, b⟩.`, VF(v), `Right is positive and left is negative for a; up is positive and down is negative for b. So the vector is ${vec(v)}.`);
      do v = [nz(R, -8, 8), nz(R, -8, 8)]; while (Math.abs(v[0]) === Math.abs(v[1]));
      return E.choice(R, `What does the translation ${vec(v)} do to every point?`, `moves it ${mvTxt(v)}`, [[-v[0], v[1]], [v[0], -v[1]], [v[1], v[0]]].map(w => `moves it ${mvTxt(w)}`), `The first number is the horizontal move and the second the vertical move: ${vec(v)} moves ${mvTxt(v)}.`); } },
    b: { t: 'apply', g: R => { const v = [nz(R, -6, 6), nz(R, -6, 6)];
      if (R.bool()) { const p = [R.int(-8, 8), R.int(-8, 8)], q = [p[0] + v[0], p[1] + v[1]], nm = R.pick(['P', 'A', 'Q', 'K']);
        return E.num(`Translate ${nm}${pt(p)} by ${vec(v)}. Find ${nm}′.`, [PF(q, `${nm}′ =`)], `(x, y) → (x${plus(v[0])}, y${plus(v[1])}): ${nm}′ = (${p[0]}${plus(v[0])}, ${p[1]}${plus(v[1])}) = ${pt(q)}.`); }
      const T = gtri(R), L = K.trio(R), i = R.int(0, 2), q = [T[i][0] + v[0], T[i][1] + v[1]];
      return E.num(`△${L.join('')} is translated by ${vec(v)}. Find the image of ${L[i]}.`, [PF(q, `${L[i]}′ =`)], `${L[i]} is at ${pt(T[i])}. Add the vector: ${L[i]}′ = ${pt(q)}.`, { visual: gfig({ polys: [{ p: T, names: L }], label: 'a triangle on a grid' }) }); } },
    c: { t: 'find the vector', g: R => { let v; do v = [nz(R, -7, 7), nz(R, -7, 7)]; while (Math.abs(v[0]) === Math.abs(v[1]));
      const kind = R.int(0, 2);
      if (kind === 0) { const p = [R.int(-6, 6), R.int(-6, 6)], q = [p[0] + v[0], p[1] + v[1]];
        return E.choice(R, `A translation maps A${pt(p)} to A′${pt(q)}. What is its vector?`, vec(v), [vec([-v[0], -v[1]]), vec([v[1], v[0]]), vec([-v[1], -v[0]])], `Subtract preimage from image: ⟨${q[0]} − ${sg(p[0]).replace('−', '(−') + (p[0] < 0 ? ')' : '')}, ${q[1]} − ${sg(p[1]).replace('−', '(−') + (p[1] < 0 ? ')' : '')}⟩ = ${vec(v)}.`); }
      if (kind === 1) { const T = gtri(R, -4, 2), T2 = T.map(p => [p[0] + v[0], p[1] + v[1]]); if (!inBox(T2, 9)) return E.num(`A translation maps A${pt(T[0])} to A′${pt(T2[0])}. Write its vector ⟨a, b⟩.`, VF(v), `Image minus preimage: ${vec(v)}.`);
        const L = K.trio(R); return E.num(`△${L.join('')} is translated onto △${primes(L).join('')}. Write the translation vector ⟨a, b⟩.`, VF(v), `Follow any vertex: ${L[0]}${pt(T[0])} goes to ${L[0]}′${pt(T2[0])}, so the vector is image − preimage = ${vec(v)}.`, { visual: gfig({ polys: [{ p: T, names: L }, { p: T2, names: primes(L) }], label: 'a triangle and its translated image' }) }); }
      const A = [R.int(-6, 6), R.int(-6, 6)], A2 = [A[0] + v[0], A[1] + v[1]], B = [R.int(-6, 6), R.int(-6, 6)], B2 = [B[0] + v[0], B[1] + v[1]];
      return E.num(`A translation maps A${pt(A)} to A′${pt(A2)}. Where does it map B${pt(B)}?`, [PF(B2, 'B′ =')], `The vector is A′ − A = ${vec(v)}. Then B′ = ${pt(B)} + ${vec(v)} = ${pt(B2)}.`); } },
    d: { t: 'compose two translations', g: R => { const u = [nz(R, -6, 6), nz(R, -6, 6)], w = [nz(R, -6, 6), nz(R, -6, 6)], s = [u[0] + w[0], u[1] + w[1]], kind = R.int(0, 2);
      if (kind === 0) { const p = [R.int(-6, 6), R.int(-6, 6)], q = [p[0] + s[0], p[1] + s[1]];
        return E.num(`P${pt(p)} is translated by ${vec(u)} and then by ${vec(w)}. Find the final image P″.`, [PF(q, 'P″ =')], `Two translations add: ${vec(u)} + ${vec(w)} = ${vec(s)}. So P″ = ${pt(q)}.`); }
      if (kind === 1) { if (!s[0] && !s[1]) return E.num(`A translation by ${vec(u)} is followed by a translation by ${vec(w)}. Write the single translation ⟨a, b⟩ with the same effect.`, VF(s), `Add the vectors: ⟨0, 0⟩, so every point ends where it started.`);
        return E.num(`A translation by ${vec(u)} is followed by a translation by ${vec(w)}. Write the single translation ⟨a, b⟩ with the same effect.`, VF(s), `Add the vectors part by part: ⟨${sg(u[0])}${plus(w[0])}, ${sg(u[1])}${plus(w[1])}⟩ = ${vec(s)}.`); }
      const p = [R.int(-6, 6), R.int(-6, 6)], q = [p[0] + s[0], p[1] + s[1]];
      return E.num(`P${pt(p)} is translated by ${vec(u)} and then by a second translation, ending at ${pt(q)}. Write the second vector ⟨a, b⟩.`, VF(w), `The total move is ${pt(q)} − ${pt(p)} = ${vec(s)}. Take away the first vector: ${vec(s)} − ${vec(u)} = ${vec(w)}.`); } },
  });

  /* ================= V.13.03 Reflections precisely ================= */
  // mirror lines: {txt, F, line:{x}|{f}, m (slope or null), c}
  const mirror = (type, c) => [
    { txt: c ? `x = ${c}` : 'x = 0 (the y-axis)', F: AF([-1, 0, 0, 1], [2 * c, 0]), line: { x: c }, eq: `x=${c}` },
    { txt: c ? `y = ${c}` : 'y = 0 (the x-axis)', F: AF([1, 0, 0, -1], [0, 2 * c]), line: { f: () => c }, eq: `y=${c}` },
    { txt: `y = x${c ? plus(c) : ''}`, F: AF([0, 1, 1, 0], [-c, c]), line: { f: x => x + c }, eq: `y=x${c ? (c > 0 ? '+' : '') + c : ''}` },
    { txt: `y = −x${c ? plus(c) : ''}`, F: AF([0, -1, -1, 0], [c, c]), line: { f: x => -x + c }, eq: `y=-x${c ? (c > 0 ? '+' : '') + c : ''}` },
  ][type];
  S('V.13.03', 'Reflections precisely', {
    a: { t: 'perpendicular bisector definition', g: R => { const kind = R.pick([0, 1, 2, 3, 4, 5, 6, 5, 6]), d = R.int(2, 9) + (R.bool(0.4) ? 0.5 : 0);
      if (kind >= 5) { // proof: every point of the mirror is equally far from P and P′
        const pp = K.spin(R, { _l1: [-3.2, 0], _l2: [3.2, 0], P: [0.4, 1.6], M: [0.4, 0], 'P′': [0.4, -1.6], Q: [2.5, 0], _t: [3.55, 0] });
        const pv = K.fig({ pts: pp, segs: [['_l1', '_l2'], ['P', 'M', { ticks: 1, dash: true }], ['M', 'P′', { ticks: 1, dash: true }], ['Q', 'P', { color: C.blue }], ['Q', 'P′', { color: C.blue }]],
          angles: [['P', 'M', 'Q', '', { right: true }]], text: [[pp._t, 'ℓ', { size: 15, weight: 700 }]], w: 240, label: 'a point on the mirror joined to a point and its image' });
        const DR = 'definition of reflection', rows = [['P′ is the reflection of P in ℓ, PP′ meets ℓ at M, and Q is another point on ℓ', 'given'], ['PM = P′M', DR], ['∠QMP = ∠QMP′ = 90°', DR], ['QM = QM', 'reflexive property'], ['△QMP ≅ △QMP′', 'SAS'], ['QP = QP′', 'CPCTC']];
        if (kind === 5) return K.orderQ(R, 'Prove that a point Q on the mirror ℓ is as far from P as from its image P′: put the steps in order.', withR(rows), [[], [0], [0], [], [1, 2, 3], [4]],
          'ℓ is the perpendicular bisector of PP′, which gives the equal halves and the right angles, and QM is shared. That is SAS, so QP = QP′ by CPCTC. The three lines before SAS can come in any order.', { fixed: 1, visual: pv });
        const rows2 = [rows[0], ['PM = P′M and ∠QMP = ∠QMP′ = 90°', DR], rows[3], rows[4], rows[5]], j = R.pick([1, 2, 3, 4]), W = { 1: ['reflexive property', 'CPCTC', 'vertical angles'], 2: [DR, 'CPCTC', 'SAS'], 3: ['SSS', 'ASA', 'SSA'], 4: ['SAS', DR, 'reflexive property'] }[j];
        return E.choice(R, `This proof shows that a point Q on the mirror is as far from P as from P′. What is the missing reason?${tbl(rows2, j)}`, rows2[j][1], W,
          { 1: 'A reflection makes ℓ the perpendicular bisector of PP′: M is the midpoint, and the angles at M are right angles.', 2: 'A segment shared by two triangles equals itself.', 3: 'Two sides and the angle between them (PM, the right angle, QM) match: SAS. QP = QP′ is what we are proving, so SSS is not available.', 4: 'The triangles are congruent, so the corresponding sides QP and QP′ are equal.' }[j], { visual: pv }); }
      const pts = { _l1: [-3.2, 0], _l2: [3.2, 0], P: [0.4, 1.6], M: [0.4, 0], 'P′': [0.4, -1.6], _t: [3.55, 0] }, Q = K.spin(R, pts);
      const segs = [['_l1', '_l2'], ['P', 'M', { ticks: 1, dash: true, lab: kind === 0 ? `${d} cm` : undefined }], ['M', 'P′', { ticks: 1, dash: true }]];
      const vis = K.fig({ pts: Q, segs, angles: [['P', 'M', '_l2', '', { right: true }]], text: [[Q._t, 'ℓ', { size: 15, weight: 700 }]], w: 240, label: 'a point reflected in a line' });
      if (kind === 0) return E.num(`P′ is the reflection of P in line ℓ, and P is ${d} cm from ℓ. Find PP′.`, [{ label: 'PP′ =', ans: 2 * d }], `ℓ is the perpendicular bisector of PP′, so P′ is also ${d} cm from ℓ: PP′ = 2 × ${d} = ${2 * d} cm.`, { visual: vis });
      if (kind === 1) return E.num(`P′ is the reflection of P in line ℓ, and PP′ = ${2 * d} cm. How far is P from ℓ?`, [{ label: 'distance =', ans: d }], `ℓ bisects PP′, so P is half of ${2 * d}, which is ${d} cm, from ℓ.`, { visual: vis });
      if (kind === 2) { const opts = ['ℓ is the perpendicular bisector of PP′', 'ℓ is parallel to PP′', 'ℓ passes through P', 'ℓ bisects PP′ at some angle, not always 90°'];
        return E.choice(R, `P′ is the reflection of P in line ℓ (P not on ℓ). Which statement must be true?`, opts[0], opts.slice(1), 'That is the definition of a reflection: ℓ cuts PP′ in half and at a right angle.', { visual: vis }); }
      if (kind === 3) { if (R.bool()) return E.num(`P′ is the reflection of P in line ℓ. What angle does segment PP′ make with ℓ?`, [{ label: 'angle =', ans: 90 }], 'ℓ is the perpendicular bisector of PP′, so they meet at 90°.', { visual: vis });
        return E.choice(R, `Point Q lies on the mirror line ℓ. Where is its reflection Q′?`, 'at Q itself', ['on the other side of ℓ, the same distance away', 'nowhere: points on ℓ have no image', 'at the foot of the perpendicular from Q to the y-axis'], 'Q is 0 away from ℓ, so its image is also 0 away, on the line: Q′ = Q. Points on the mirror stay put.'); }
      let x, a, b, c2, e; do { x = R.int(2, 9); a = R.int(2, 5); c2 = R.int(1, 4); b = R.int(-6, 9); e = (a - c2) * x + b; } while (a === c2 || e <= 0 || a * x + b <= 0);
      return E.num(`P′ is the reflection of P in line ℓ, and PP′ meets ℓ at M. PM = ${M(`${a}x${b ? (b > 0 ? '+' : '') + b : ''}`)} and MP′ = ${M(`${c2 === 1 ? '' : c2}x+${e}`)}. Find x.`, [{ label: 'x =', ans: x }], `ℓ bisects PP′, so PM = MP′: ${a}x${b ? plus(b) : ''} = ${c2 === 1 ? '' : c2}x + ${e}, so ${a - c2 === 1 ? '' : a - c2}x = ${e - b} and x = ${x}.`, { visual: vis }); } },
    b: { t: 'over any line', g: R => { const type = R.int(0, 3), c = R.int(-3, 3), m = mirror(type, c); let p;
      do p = [R.int(-6, 6), R.int(-6, 6)]; while (eqP(ap(m.F, p), p) || !inBox([ap(m.F, p)], 9));
      const q = ap(m.F, p), nm = R.pick(['P', 'A', 'Q', 'B']);
      const why = type === 0 ? `The mirror is vertical, so y stays ${p[1]}. ${nm} is ${Math.abs(p[0] - c)} from the line, so ${nm}′ is ${Math.abs(p[0] - c)} on the other side: x = ${q[0]}.`
        : type === 1 ? `The mirror is horizontal, so x stays ${p[0]}. ${nm} is ${Math.abs(p[1] - c)} from the line, so ${nm}′ is ${Math.abs(p[1] - c)} on the other side: y = ${q[1]}.`
          : type === 2 ? `For y = x${c ? plus(c) : ''}, (x, y) → (y${c ? plus(-c) : ''}, x${c ? plus(c) : ''}). Check: the midpoint (${(p[0] + q[0]) / 2}, ${(p[1] + q[1]) / 2}) is on the line and ${nm}${nm}′ has slope −1, perpendicular to it.`
            : `For y = −x${c ? plus(c) : ''}, (x, y) → (${c ? c + ' − y' : '−y'}, ${c ? c + ' − x' : '−x'}). Check: the midpoint (${(p[0] + q[0]) / 2}, ${(p[1] + q[1]) / 2}) is on the line and ${nm}${nm}′ has slope 1, perpendicular to it.`;
      return E.num(`Reflect ${nm}${pt(p)} in the line ${m.txt}. Find ${nm}′.`, [PF(q, `${nm}′ =`)], why, { visual: gfig({ pts: [[p[0], p[1], nm]], lines: [Object.assign({ lab: m.txt.replace(/ \(.*\)/, '') }, m.line)], extra: [q], label: 'a point and a mirror line' }) }); } },
    c: { t: 'find the line', g: R => { const type = R.int(0, 5); let m, p, q, eq, txt, why;
      if (type <= 3) { const c = R.int(-4, 4); m = mirror(type, c); do p = [R.int(-6, 6), R.int(-6, 6)]; while (eqP(ap(m.F, p), p)); q = ap(m.F, p); eq = m.eq; txt = m.txt.replace(/ \(.*\)/, '');
        const md = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
        why = type === 0 ? `PP′ is horizontal, so the mirror is the vertical line through the midpoint ${pt(md)}: ${txt}.` : type === 1 ? `PP′ is vertical, so the mirror is the horizontal line through the midpoint ${pt(md)}: ${txt}.`
          : `The midpoint is ${pt(md)} and PP′ has slope ${type === 2 ? '−1' : '1'}, so the mirror has slope ${type === 2 ? '1' : '−1'} through ${pt(md)}: ${txt}.`; }
      else { const s = R.pick([2, -2]); let c, P0; do { c = R.int(-4, 4); P0 = [R.int(-6, 6), R.int(-6, 6)]; const k = (s * P0[0] - P0[1] + c) / (s * s + 1); q = [P0[0] - 2 * s * k, P0[1] + 2 * k]; } while (!Number.isInteger(q[0]) || !Number.isInteger(q[1]) || eqP(q, P0) || !inBox([q], 9) || !Number.isInteger((P0[0] + q[0]) / 2 * 2));
        p = P0; eq = `y=${s}x${c ? (c > 0 ? '+' : '') + c : ''}`; txt = `y = ${sg(s)}x${c ? plus(c) : ''}`; const md = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
        why = `The midpoint of PP′ is ${pt(md)}. PP′ has slope ${sg(E.fracStr(q[1] - p[1], q[0] - p[0]))}, so the mirror has the negative reciprocal slope ${sg(s)} and passes through ${pt(md)}: ${txt}.`; }
      return E.num(`P${pt(p)} reflects to P′${pt(q)}. Find the equation of the mirror line.`, [{ eqn: eq }], why, { visual: gfig({ pts: [[p[0], p[1], 'P'], [q[0], q[1], 'P′']], label: 'a point and its mirror image' }) }); } },
    d: { t: 'reflections in coordinates', g: R => { const kind = R.int(0, 2), RX = [D.rx, D.ry, D.rd, D.ra];
      if (kind === 0) { const d = R.pick(RX); return E.choice(R, `Which rule reflects every point in ${d.n.replace('a reflection in ', '')}?`, `(x, y) → ${d.r}`, RX.filter(x => x !== d).map(x => `(x, y) → ${x.r}`), d === D.ry ? 'Over the y-axis, the coordinate along the mirror (y) stays and x changes sign: (−x, y).' : d === D.rx ? 'Over the x-axis, the coordinate along the mirror (x) stays and y changes sign: (x, −y).' : d === D.rd ? 'Over y = x, the coordinates swap: (y, x).' : 'Over y = −x, the coordinates swap and both change sign: (−y, −x).'); }
      const T = gtri(R, -5, 5), L = K.trio(R), i = R.int(0, 2);
      if (kind === 1) { const d = R.pick(RX), T2 = T.map(p => mv(d.m, p)), lines = { rx: { f: () => 0 }, ry: { x: 0 }, rd: { f: x => x, lab: 'y = x' }, ra: { f: x => -x, lab: 'y = −x' } };
        return E.num(`△${L.join('')} is reflected in ${d.n.replace('a reflection in ', '')}. Find the image of ${L[i]}.`, [PF(T2[i], `${L[i]}′ =`)], `The rule is (x, y) → ${d.r}, so ${L[i]}${pt(T[i])} → ${pt(T2[i])}.`, { visual: gfig({ polys: [{ p: T, names: L }], lines: [lines[d.k]], label: 'a triangle and a mirror line' }) }); }
      const d = R.pick(RX), q = mv(d.m, T[i]), back = d;   // reflections undo themselves
      return E.num(`Reflecting a point in ${d.n.replace('a reflection in ', '')} gives ${pt(q)}. Find the original point.`, [PF(T[i])], `A reflection undoes itself: reflect ${pt(q)} back with (x, y) → ${back.r} to get ${pt(T[i])}.`); } },
  });

  /* ================= V.13.04 Rotations about any point ================= */
  const rotC = (a, c) => about(ROT[a], c);
  S('V.13.04', 'Rotations about any point', {
    a: { t: 'center and angle', g: R => { const kind = R.int(0, 3);
      if (kind === 0) { const th = R.pick([30, 40, 45, 60, 70, 80, 100, 110, 120, 135, 150, 200, 210, 225, 240, 300, 315]), cw = R.bool();
        return E.num(`A rotation of ${th}° ${cw ? 'clockwise' : 'counterclockwise'} has the same effect as a rotation of how many degrees ${cw ? 'counterclockwise' : 'clockwise'}?`, [{ label: 'angle =', ans: 360 - th }], `Turning ${th}° one way lands where turning 360° − ${th}° = ${360 - th}° the other way does.`); }
      if (kind === 1) { const th = R.pick([40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140]), r = R.int(3, 12), al = R.int(0, 71) * 5;
        const pts = { O: [0, 0], P: K.polar(3, al), 'P′': K.polar(3, al + th) }, vis = K.fig({ pts, segs: [['O', 'P', { ticks: 1, lab: String(r) }], ['O', 'P′', { ticks: 1 }]], angles: [['P', 'O', 'P′', `${th}°`]], w: 230, label: 'a point rotated about a center' });
        if (R.bool()) return E.num(`P is rotated ${th}° counterclockwise about O to P′. OP = ${r}. Find OP′.`, [{ label: 'OP′ =', ans: r }], `A rotation keeps every point the same distance from the center, so OP′ = OP = ${r}.`, { visual: vis });
        return E.num(`P is rotated counterclockwise about O to P′, as shown. What is the angle of rotation?`, [{ label: 'angle =', ans: th }], `The angle of rotation is the angle POP′ at the center: ${th}°.`, { visual: vis }); }
      if (kind === 2) { const d = R.int(3, 15), th = R.pick([45, 60, 90, 120, 180]);
        return E.num(`Points P and Q are ${d} cm apart. Both are rotated ${th}° about a point O to P′ and Q′. Find P′Q′.`, [{ label: 'P′Q′ =', ans: d }], `A rotation is a rigid motion, so it keeps distances: P′Q′ = PQ = ${d} cm.`); }
      let p; do p = [nz(R, -5, 5), nz(R, -5, 5)]; while (Math.abs(p[0]) === Math.abs(p[1]));
      const a = R.pick([90, 180, 270]), q = mv(ROT[a], p);
      return E.choiceFixed(`Which rotation about the origin O maps P${pt(p)} to P′${pt(q)}?`, ['90° counterclockwise', '90° clockwise', '180°'], a === 90 ? 0 : a === 270 ? 1 : 2, `${a === 180 ? `Both coordinates changed sign, (x, y) → (−x, −y): 180°.` : `The coordinates swapped with one sign change: (x, y) → ${a === 90 ? '(−y, x), 90° counterclockwise' : '(y, −x), 90° clockwise'}.`}`, { visual: gfig({ pts: [[p[0], p[1], 'P'], [q[0], q[1], 'P′'], [0, 0, 'O', C.muted]], label: 'a point and its image under a rotation' }) }); } },
    b: { t: 'around the origin rules', g: R => { const kind = R.int(0, 2), a = R.pick([90, 180, 270]);
      if (kind === 0) { const RR = [D.r90, D.r180, D.r270], d = RR[[90, 180, 270].indexOf(a)];
        return E.choice(R, `Which rule rotates every point ${rotName(a)} about the origin?`, `(x, y) → ${d.r}`, [D.r90, D.r180, D.r270, D.ry, D.rd].filter(x => x !== d).slice(0, 3).map(x => `(x, y) → ${x.r}`), `${rotName(a)[0].toUpperCase() + rotName(a).slice(1)} about the origin: (x, y) → ${d.r}. ${a === 90 ? 'Check with (1, 0): it turns to (0, 1).' : a === 270 ? 'Check with (1, 0): it turns to (0, −1).' : 'Both coordinates change sign.'}`); }
      let p; do p = [nz(R, -7, 7), nz(R, -7, 7)]; while (Math.abs(p[0]) === Math.abs(p[1]));
      const q = mv(ROT[a], p), rule = a === 90 ? '(−y, x)' : a === 270 ? '(y, −x)' : '(−x, −y)';
      if (kind === 1) return E.num(`Rotate P${pt(p)} ${rotName(a)} about the origin. Find P′.`, [PF(q, 'P′ =')], `Use ${rule}: P′ = ${pt(q)}.`);
      const T = gtri(R, -4, 4), L = K.trio(R), i = R.int(0, 2), T2 = T.map(z => mv(ROT[a], z));
      return E.num(`△${L.join('')} is rotated ${rotName(a)} about the origin. Find the image of ${L[i]}.`, [PF(T2[i], `${L[i]}′ =`)], `Use (x, y) → ${rule}: ${L[i]}${pt(T[i])} → ${pt(T2[i])}.`, { visual: gfig({ polys: [{ p: T, names: L }], pts: [[0, 0, 'O', C.muted]], label: 'a triangle to rotate about the origin' }) }); } },
    c: { t: 'around other points', g: R => { const a = R.pick([90, 180, 270]); let c, p, q;
      do { c = [nz(R, -4, 4), nz(R, -4, 4)]; p = [R.int(-6, 6), R.int(-6, 6)]; q = ap(rotC(a, c), p); } while (eqP(p, c) || !inBox([q], 9) || (p[0] === c[0] || p[1] === c[1]) && R.bool(0.7));
      const dv = [p[0] - c[0], p[1] - c[1]], rv = mv(ROT[a], dv);
      return E.num(`Rotate P${pt(p)} ${rotName(a)} about C${pt(c)}. Find P′.`, [PF(q, 'P′ =')], `Shift so C is the origin: P − C = ${pt(dv)}. Rotate: ${pt(rv)}. Shift back: P′ = ${pt(rv)} + ${pt(c)} = ${pt(q)}. (The origin rule alone would wrongly give ${pt(mv(ROT[a], p))}.)`, { visual: gfig({ pts: [[p[0], p[1], 'P'], [c[0], c[1], 'C', C.teal]], extra: [q], label: 'a point and a center of rotation' }) }); } },
    d: { t: 'find the center', g: R => { const a = R.pick([90, 180, 270, 180]); let c, A, B, A2, B2;
      do { c = [R.int(-4, 4), R.int(-4, 4)]; A = [R.int(-6, 6), R.int(-6, 6)]; B = [R.int(-6, 6), R.int(-6, 6)]; A2 = ap(rotC(a, c), A); B2 = ap(rotC(a, c), B); } while (eqP(A, c) || eqP(B, c) || eqP(A, B) || (A[0] - c[0]) * (B[1] - c[1]) === (A[1] - c[1]) * (B[0] - c[0]) || !inBox([A2, B2], 9) || eqP(c, [0, 0]) && R.bool(0.8));   // A, B, C not collinear, or the two bisectors coincide
      if (a !== 180 && R.bool(0.45)) { // proof: why the center is where the perpendicular bisectors meet
        const RK = 'a rotation keeps distances from its center', CV = 'converse of the perpendicular bisector theorem', vis = gfig({ pts: [[A[0], A[1], 'A'], [A2[0], A2[1], 'A′'], [B[0], B[1], 'B'], [B2[0], B2[1], 'B′']], label: 'two points and their images under a rotation' });
        const rows = [[`A rotation of ${rotName(a)} about a center C maps A${pt(A)} to A′${pt(A2)} and B${pt(B)} to B′${pt(B2)}`, 'given'], ['CA = CA′', RK], ['C is on the perpendicular bisector of AA′', CV], ['CB = CB′', RK], ['C is on the perpendicular bisector of BB′', CV], [`C is where the two perpendicular bisectors meet, ${pt(c)}`, 'lines 3 and 5']];
        if (R.bool()) return K.orderQ(R, 'Put the steps in order to show where the center of rotation is.', withR(rows), [[], [0], [1], [0], [3], [2, 4]],
          `Each point and its image are equally far from C, so C lies on both perpendicular bisectors; the A lines and the B lines can interleave. The bisectors meet at ${pt(c)}.`, { fixed: 1, visual: vis });
        const rows2 = [rows[0], ['CA = CA′ and CB = CB′', RK], ['C is on the perpendicular bisector of AA′ and on that of BB′', CV], [`C is where the two perpendicular bisectors meet, ${pt(c)}`, 'line 3']];
        const j = R.pick([1, 2]), W = j === 1 ? ['a rotation keeps orientation', 'perpendicular bisector theorem', 'CPCTC'] : ['perpendicular bisector theorem', RK, 'definition of midpoint'];
        return E.choice(R, `What is the missing reason in this argument?${tbl(rows2, j)}`, rows2[j][1], W, j === 1 ? 'A rotation turns every point about C without changing its distance from C.'
          : 'C is equally far from the two endpoints, and a point equidistant from the endpoints lies on the perpendicular bisector: that is the converse. The theorem itself goes the other way, from the bisector to equal distances.', { visual: vis }); }
      if (a === 180) return E.num(`A rotation of 180° maps A${pt(A)} to A′${pt(A2)}. Find the center of rotation.`, [PF(c, 'center =')], `A half-turn sends each point straight through the center to the other side, so the center is the midpoint of AA′: ((${A[0]}${plus(A2[0])})/2, (${A[1]}${plus(A2[1])})/2) = ${pt(c)}.`, { visual: gfig({ pts: [[A[0], A[1], 'A'], [A2[0], A2[1], 'A′']], label: 'a point and its image under a half-turn' }) });
      return E.num(`A rotation of ${rotName(a)} maps A${pt(A)} to A′${pt(A2)} and B${pt(B)} to B′${pt(B2)}. Find the center of rotation.`, [PF(c, 'center =')], `The center is the same distance from A and A′, and from B and B′, so it lies on both perpendicular bisectors; they meet at ${pt(c)}. Check: A − C = ${pt([A[0] - c[0], A[1] - c[1]])} turns to ${pt([A2[0] - c[0], A2[1] - c[1]])} = A′ − C.`, { visual: gfig({ pts: [[A[0], A[1], 'A'], [A2[0], A2[1], 'A′'], [B[0], B[1], 'B'], [B2[0], B2[1], 'B′']], label: 'two points and their images under a rotation' }) }); } },
    e: { t: 'a turn and a slide make one turn', g: R => { const a = R.pick([90, 180, 270]), first = R.bool(); let c, v;
      do { c = [R.int(-4, 4), R.int(-4, 4)]; const rc = mv(ROT[a], c); const inv = mv(ROT[360 - a], c); v = first ? [c[0] - rc[0], c[1] - rc[1]] : [inv[0] - c[0], inv[1] - c[1]]; } while (eqP(c, [0, 0]) || !v[0] && !v[1]);
      const Fm = first ? cmp(tr(v), AF(ROT[a])) : cmp(AF(ROT[a]), tr(v));
      if (!eqP(ap(Fm, c), c)) throw new Error('V.13.04.e center check');
      const p = [R.int(-3, 3), R.int(-3, 3)], q = ap(Fm, p);
      return E.num(first ? `Rotate ${rotName(a)} about the origin, then translate by ${vec(v)}. The result is a single rotation of ${rotName(a)}. Find its center.` : `Translate by ${vec(v)}, then rotate ${rotName(a)} about the origin. The result is a single rotation of ${rotName(a)}. Find its center.`,
        [PF(c, 'center =')], `The center is the one point that ends where it starts. Test ${pt(c)}: ${first ? `rotating gives ${pt(mv(ROT[a], c))}, then adding ${vec(v)} gives ${pt(c)}` : `translating gives ${pt([c[0] + v[0], c[1] + v[1]])}, then rotating gives ${pt(c)}`}. (Solve for it by writing the composition as a rule in x and y and setting it equal to (x, y).)`); } },
    f: { t: 'two turns about different centers', g: R => { const kind = R.int(0, 2); let A, B;
      if (kind === 0) { let cc; do { A = [R.int(-4, 4), R.int(-4, 4)]; B = [R.int(-4, 4), R.int(-4, 4)]; const rd = mv(ROT[90], [A[0] - B[0], A[1] - B[1]]); cc = [(A[0] + B[0] + rd[0]) / 2, (A[1] + B[1] + rd[1]) / 2]; } while (eqP(A, B) || !Number.isInteger(cc[0]) || !Number.isInteger(cc[1]));
        const Fm = cmp(rotC(90, B), rotC(90, A)); const c = ap(Fm, [0, 0]).map(x => x / 2);
        return E.num(`Rotate 90° counterclockwise about A${pt(A)}, then 90° counterclockwise about B${pt(B)}. The result is a rotation of 180°. Find its center.`, [PF(c, 'center =')], `A half-turn sends each point to the other side of its center, so the center is the midpoint of any point and its image. The origin goes to ${pt(ap(rotC(90, A), [0, 0]))}, then to ${pt(ap(Fm, [0, 0]))}; the midpoint is ${pt(c)}.`); }
      do { A = [R.int(-4, 4), R.int(-4, 4)]; B = [R.int(-4, 4), R.int(-4, 4)]; } while (eqP(A, B));
      const p = [R.int(-5, 5), R.int(-5, 5)];
      if (kind === 1) { const Fm = cmp(rotC(180, B), rotC(180, A)), q = ap(Fm, p), v = [2 * (B[0] - A[0]), 2 * (B[1] - A[1])];
        return E.num(`P${pt(p)} is rotated 180° about A${pt(A)}, then 180° about B${pt(B)}. Where does P end up?`, [PF(q, 'P″ =')], `Two half-turns make a translation by twice the vector from A to B: 2${vec([B[0] - A[0], B[1] - A[1]])} = ${vec(v)}. So P″ = ${pt(q)}.`); }
      const Fm = cmp(rotC(270, B), rotC(90, A)), q = ap(Fm, p), v = K.sub(ap(Fm, [0, 0]), [0, 0]);
      return E.num(`P${pt(p)} is rotated 90° counterclockwise about A${pt(A)}, then 90° clockwise about B${pt(B)}. Where does P end up?`, [PF(q, 'P″ =')], `The turns cancel (+90° − 90° = 0°), so the result is a translation. Track the origin: it ends at ${pt(v)}, so the vector is ${vec(v)} and P″ = ${pt(p)} + ${vec(v)} = ${pt(q)}.`); } },
  });

  /* ================= V.13.05 Compositions ================= */
  const MOVES = R => { const v = [nz(R, -5, 5), nz(R, -5, 5)];
    return [{ F: AF(D.rx.m), n: 'reflect in the x-axis', inv: 'reflect in the x-axis', k: 'rx' }, { F: AF(D.ry.m), n: 'reflect in the y-axis', inv: 'reflect in the y-axis', k: 'ry' },
      { F: AF(D.r90.m), n: 'rotate 90° counterclockwise about the origin', inv: 'rotate 90° clockwise about the origin', k: 'r90' }, { F: AF(D.r180.m), n: 'rotate 180° about the origin', inv: 'rotate 180° about the origin', k: 'r180' },
      { F: tr(v), n: `translate by ${vec(v)}`, inv: `translate by ${vec([-v[0], -v[1]])}`, k: 't' }]; };
  const isId = F => sameF(F, AF(I2));
  const inv = F => { const [a, b, c, d] = F.m, det = a * d - b * c, m = [d / det, -b / det, -c / det, a / det]; return AF(m, mv(m, [-F.t[0], -F.t[1]])); };
  const LINES4 = [{ a: 0, eq: 'y=0', txt: 'the x-axis', line: { f: () => 0 } }, { a: 45, eq: 'y=x', txt: 'the line y = x', line: { f: x => x } }, { a: 90, eq: 'x=0', txt: 'the y-axis', line: { x: 0 } }, { a: 135, eq: 'y=-x', txt: 'the line y = −x', line: { f: x => -x } }];
  const reflAt = a => { const c = Math.round(Math.cos(2 * a * Math.PI / 180)), s = Math.round(Math.sin(2 * a * Math.PI / 180)); return AF([c, s, s, -c]); };   // reflection in the line through O at angle a
  const turnTxt = d => { d = ((d % 360) + 360) % 360; return d === 0 ? 'a full turn (0°), so nothing moves' : d === 180 ? 'a rotation of 180°' : d === 90 ? 'a rotation of 90° counterclockwise' : 'a rotation of 90° clockwise (270° counterclockwise)'; };
  S('V.13.05', 'Compositions', {
    a: { t: 'order matters', g: R => { const k6 = R.int(0, 5), kind = k6 >> 1, NM = R.pick([['f', 'g'], ['S', 'T'], ['r', 't'], ['p', 'q'], ['m', 'n'], ['A', 'B']]);
      if (kind === 2) return E.choice(R, `In the composition ${NM[1]} ∘ ${NM[0]}, which transformation is done first?`, `${NM[0]}, then ${NM[1]}`, [`${NM[1]}, then ${NM[0]}`, 'both at the same time', 'it depends on the transformations'], `${NM[1]} ∘ ${NM[0]} means ${NM[1]}(${NM[0]}(P)): ${NM[0]} acts on P first, then ${NM[1]} acts on the result. Reading left to right gets it backwards.`);
      if (kind === 0) { let f, g, p; do { const ms = R.sample(MOVES(R), 2); f = ms[0]; g = ms[1]; p = [nz(R, -6, 6), nz(R, -6, 6)]; } while (eqP(ap(g.F, ap(f.F, p)), ap(f.F, ap(g.F, p))));
        const q1 = ap(f.F, p), q = ap(g.F, q1), w = ap(f.F, ap(g.F, p));
        return E.num(`${NM[0]}: ${f.n}. ${NM[1]}: ${g.n}. Find (${NM[1]} ∘ ${NM[0]})(P) for P${pt(p)}.`, [PF(q)], `${NM[1]} ∘ ${NM[0]} means ${NM[0]} first: ${NM[0]}(P) = ${pt(q1)}, then ${NM[1]} gives ${pt(q)}. (The other order would give ${pt(w)}.)`); }
      const yes = k6 % 2 === 1, a = nz(R, -5, 5), b = nz(R, -5, 5);
      const C2 = [[D.rx, D.ry], [D.rx, D.r180], [D.ry, D.r180], [D.r90, D.r180], ['t', 't'], [D.rx, 'tx'], [D.ry, 'ty']], N2 = [[D.rx, 't'], [D.ry, 't'], [D.r90, D.rx], [D.r90, D.ry], [D.r90, 't'], [D.r180, 't'], [D.rx, D.rd]];
      const mk = (x, j) => x === 't' ? (j ? { F: tr([b, a]), n: `translate by ${vec([b, a])}` } : { F: tr([a, b]), n: `translate by ${vec([a, b])}` }) : x === 'tx' ? { F: tr([a, 0]), n: `translate by ${vec([a, 0])}` } : x === 'ty' ? { F: tr([0, b]), n: `translate by ${vec([0, b])}` } : { F: AF(x.m), n: x.sh };
      let f, g, p; const pr = R.pick(yes ? C2 : N2), sw = R.bool();
      do { f = mk(pr[sw ? 1 : 0], 0); g = mk(pr[sw ? 0 : 1], 1); p = [nz(R, -6, 6), nz(R, -6, 6)]; } while (!yes && eqP(ap(g.F, ap(f.F, p)), ap(f.F, ap(g.F, p))));
      const q1 = ap(g.F, ap(f.F, p)), q2 = ap(f.F, ap(g.F, p));
      return yn(`Start with P${pt(p)}. Do you get the same image if you ${f.n} and then ${g.n}, as if you do them in the other order?`, eqP(q1, q2), `In the given order P goes to ${pt(ap(f.F, p))}, then ${pt(q1)}. In the other order it goes to ${pt(ap(g.F, p))}, then ${pt(q2)}. ${eqP(q1, q2) ? 'Same point: these two moves happen to commute.' : 'Different points, so the order matters here.'}`); } },
    b: { t: 'two reflections = translation or rotation', g: R => { const kind = R.int(0, 2);
      if (kind === 0) { let a, b; do { a = R.int(-5, 5); b = R.int(-5, 5); } while (a === b); const vert = R.bool(), v = vert ? [2 * (b - a), 0] : [0, 2 * (b - a)], ax = vert ? 'x' : 'y';
        return E.num(`Reflect in the line ${ax} = ${a}, then in the line ${ax} = ${b}. The result is a translation. Write its vector ⟨a, b⟩.`, VF(v), `Parallel mirrors make a translation perpendicular to them, twice the gap from the first line to the second: 2 × (${b} − ${sg(a).replace('−', '(−') + (a < 0 ? ')' : '')}) = ${2 * (b - a)}, so ${vec(v)}.`, { visual: gfig({ lines: [Object.assign({ lab: `${ax} = ${a}` }, vert ? { x: a } : { f: () => a }), Object.assign({ lab: `${ax} = ${b}`, color: C.violet }, vert ? { x: b } : { f: () => b })], extra: [[0, 0]], label: 'two parallel mirror lines' }) }); }
      if (kind === 1) { const th = R.int(25, 80), al = R.int(0, 35) * 5, pts = { P: [0, 0], _a1: K.polar(-2.6, al), _a2: K.polar(2.6, al), _b1: K.polar(-2.6, al + th), _b2: K.polar(2.6, al + th), _ta: K.polar(3.05, al), _tb: K.polar(3.05, al + th) };
        const vis = K.fig({ pts, segs: [['_a1', '_a2'], ['_b1', '_b2']], angles: [['_a2', 'P', '_b2', `${th}°`]], text: [[pts._ta, 'ℓ', { size: 15, weight: 700 }], [pts._tb, 'm', { size: 15, weight: 700 }]], w: 230, label: 'two mirror lines crossing at P' });
        return E.num(`Lines ℓ and m cross at P at an angle of ${th}°. Reflect a figure in ℓ, then in m. The result is a rotation about P. By how many degrees?`, [{ label: 'angle =', ans: 2 * th }], `Two reflections in crossing lines make a rotation about the crossing point by twice the angle between them: 2 × ${th}° = ${2 * th}°.`, { visual: vis }); }
      const c = R.int(0, 2);
      if (c === 0) { let a, b; do { a = R.int(-4, 4); b = R.int(-4, 4); } while (a === b); const ax = R.pick(['x', 'y']), v = ax === 'x' ? [2 * (b - a), 0] : [0, 2 * (b - a)], h = ax === 'x' ? [b - a, 0] : [0, b - a], r = ax === 'x' ? [-v[0], 0] : [0, -v[1]];
        return E.choice(R, `Reflect in the line ${ax} = ${a}, then in the line ${ax} = ${b}. Which single transformation has the same effect?`, `a translation by ${vec(v)}`, [`a translation by ${vec(h)}`, `a translation by ${vec(r)}`, `a rotation of 180° about ${ax === 'x' ? pt([(a + b) / 2, 0]) : pt([0, (a + b) / 2])}`], `The mirrors are parallel, so the result is a translation perpendicular to them by twice the gap, from the first line toward the second: ${vec(v)}.`); }
      if (c === 1) { const a = R.int(-4, 4), b = R.int(-4, 4), sw = R.bool(), first = sw ? `y = ${b}` : `x = ${a}`, second = sw ? `x = ${a}` : `y = ${b}`;
        return E.choice(R, `Reflect in the line ${first}, then in the line ${second}. Which single transformation has the same effect?`, `a rotation of 180° about ${pt([a, b])}`, [`a rotation of 90° about ${pt([a, b])}`, `a translation by ${vec([2 * a, 2 * b])}`, `a reflection in the line y = x${b - a ? plus(b - a) : ''}`], `The mirrors cross at ${pt([a, b])} at 90°, so the result is a rotation about ${pt([a, b])} by 2 × 90° = 180°.`); }
      const [l1, l2] = R.sample(LINES4, 2), dA = ((l2.a - l1.a) % 180 + 180) % 180, rot = 2 * dA, opts = { 90: 'a rotation of 90° counterclockwise about the origin', 180: 'a rotation of 180° about the origin', 270: 'a rotation of 90° clockwise about the origin' };
      return E.choice(R, `Reflect in ${l1.txt}, then in ${l2.txt}. Which single transformation has the same effect?`, opts[rot], Object.values(opts).filter(x => x !== opts[rot]).concat(['a translation along the line y = x']), `The mirrors cross at the origin. Turning from ${l1.txt} to ${l2.txt} counterclockwise takes ${dA}°, so the result is a rotation by 2 × ${dA}° = ${rot}° counterclockwise${rot === 270 ? ', which is 90° clockwise' : ''}.`); } },
    c: { t: 'describe a composition', g: R => { let f, g, h, hr; do { [f, g] = R.sample(D4.slice(0, 7), 2); h = byM(mm(g.m, f.m)); hr = byM(mm(f.m, g.m)); } while (h === hr && R.bool(0.7));
      const wrong = (hr !== h ? [hr] : []).concat(R.shuffle(D4.filter(d => d !== h && d !== hr))).slice(0, 3), s1 = sym(f.m, 'x', 'y');
      return E.choice(R, `First ${f.sh}, then ${g.sh}. Which single transformation has the same effect?`, h.n, wrong.map(w => w.n), `Track (x, y): ${f.sh} gives (${s1.join(', ')}), then ${g.sh} gives ${symT(g.m, ...s1)}. That is the rule for ${h.n}.${hr !== h ? ` (The other order gives ${hr.n}.)` : ''}`); } },
    d: { t: 'undo one', g: R => { const kind = R.int(0, 2);
      if (kind === 0) { const [f, g] = R.sample(MOVES(R), 2), p = [nz(R, -6, 6), nz(R, -6, 6)], q1 = ap(f.F, p), q = ap(g.F, q1);
        return E.num(`A point is moved: first ${f.n}, then ${g.n}. It lands at ${pt(q)}. Where did it start?`, [PF(p, 'start =')], `Undo the moves in reverse order. Undo the second (${g.inv}): ${pt(q)} → ${pt(q1)}. Undo the first (${f.inv}): ${pt(q1)} → ${pt(p)}.`); }
      if (kind === 1) { const m = R.int(0, 3), v = [nz(R, -6, 6), nz(R, -6, 6)];
        if (m === 0) { const w = Math.abs(v[0]) === Math.abs(v[1]) ? [v[0] + 1, v[1]] : [v[1], v[0]]; return E.choice(R, `Which single transformation undoes the translation by ${vec(v)}?`, `the translation by ${vec([-v[0], -v[1]])}`, [`the translation by ${vec(v)}`, `the translation by ${vec([-v[0], v[1]])}`, `the translation by ${vec([-w[0], -w[1]])}`], `To undo a slide, slide back by the opposite vector: ${vec([-v[0], -v[1]])}.`); }
        if (m === 1) { const cw = R.bool(); return E.choice(R, `Which single transformation undoes a rotation of 90° ${cw ? 'clockwise' : 'counterclockwise'} about the origin?`, `a rotation of 90° ${cw ? 'counterclockwise' : 'clockwise'} about the origin`, [`a rotation of 90° ${cw ? 'clockwise' : 'counterclockwise'} about the origin`, 'a rotation of 180° about the origin', 'a reflection in the y-axis'], `Turn back the same amount the other way: 90° ${cw ? 'counterclockwise' : 'clockwise'}. (Or turn 270° more in the same direction.)`); }
        const d = R.pick([D.rx, D.ry, D.rd, D.ra]), others = [D.rx, D.ry, D.rd, D.ra].filter(x => x !== d);
        return E.choice(R, `Which single transformation undoes ${d.n}?`, d.n, R.sample(others, 2).map(x => x.n).concat('a rotation of 180° about the origin'), `Reflecting twice in the same line puts every point back, so a reflection undoes itself.`); }
      let f, g; do [f, g] = R.sample(MOVES(R), 2); while (sameF(cmp(g.F, f.F), cmp(f.F, g.F)));
      const tot = cmp(g.F, f.F), cand = [[`${f.inv}, then ${g.inv}`, cmp(inv(g.F), inv(f.F))], [`${g.n}, then ${f.n}`, cmp(f.F, g.F)], [`${f.n}, then ${g.n}`, tot]].filter(([, F]) => !isId(cmp(F, tot))).map(c => c[0]).concat([`${g.inv} only`, `${f.inv} only`]);
      return E.choice(R, `A figure is moved: first ${f.n}, then ${g.n}. Which sequence moves it back?`, `${g.inv}, then ${f.inv}`, cand.slice(0, 3), `Undo the last move first: ${g.inv}, then ${f.inv}. Like taking off shoes and socks, the order reverses.`); } },
    e: { t: 'run backwards: find the second mirror', g: R => { if (R.bool()) { const a = R.int(-4, 4), t = 2 * nz(R, -4, 4), vert = R.bool(), ax = vert ? 'x' : 'y', b = a + t / 2;
        return E.num(`Reflect in the line ${ax} = ${a}, then in a line ℓ. The result is a translation by ${vec(vert ? [t, 0] : [0, t])}. Find the equation of ℓ.`, [{ eqn: `${ax}=${b}` }], `Parallel mirrors give a translation of twice the gap, from the first line toward the second. The gap is ${t} ÷ 2 = ${t / 2}, so ℓ is ${ax} = ${a}${plus(t / 2)} = ${b}.`); }
      const l1 = R.pick(LINES4), rot = R.pick([90, 180, 270]), l2 = LINES4.find(l => l.a === ((l1.a + rot / 2) % 180));
      return E.num(`Reflect in ${l1.txt}, then in a line ℓ through the origin. The result is a rotation of ${rotName(rot)} about the origin. Find the equation of ℓ.`, [{ eqn: l2.eq }], `Two reflections in crossing lines rotate by twice the angle from the first line to the second. ${rot === 180 ? '180°' : rot === 90 ? '90° counterclockwise' : '90° clockwise, which is 270° counterclockwise,'} needs a turn of ${rot / 2}° counterclockwise from ${l1.txt}, which reaches ${l2.txt}.`); } },
    f: { t: 'many reflections, one move', g: R => { const p = [nz(R, -5, 5), nz(R, -5, 5)];
      if (R.bool()) { let a, b, c, d; do { [a, b, c, d] = [R.int(-4, 4), R.int(-4, 4), R.int(-4, 4), R.int(-4, 4)]; } while (a === c || b === d);
        const seq = [AF([-1, 0, 0, 1], [2 * a, 0]), AF([1, 0, 0, -1], [0, 2 * b]), AF([-1, 0, 0, 1], [2 * c, 0]), AF([1, 0, 0, -1], [0, 2 * d])], q = seq.reduce((z, F) => ap(F, z), p), v = [2 * (c - a), 2 * (d - b)];
        if (!eqP(q, [p[0] + v[0], p[1] + v[1]])) throw new Error('V.13.05.f pairing');
        return E.num(`Reflect P${pt(p)} in the line x = ${a}, then in y = ${b}, then in x = ${c}, then in y = ${d}. Where does P end up?`, [PF(q, 'final =')], `A reflection in a vertical line and one in a horizontal line can swap order, so pair x = ${a} with x = ${c} (a translation by ${vec([v[0], 0])}) and y = ${b} with y = ${d} (a translation by ${vec([0, v[1]])}). Total ${vec(v)}: P ends at ${pt(q)}.`); }
      const [l1, l2] = R.sample(LINES4, 2), N = R.pick([4, 6, 8, 10, 5, 7, 9]), dA = ((l2.a - l1.a) % 180 + 180) % 180, k = Math.floor(N / 2), tot = (2 * dA * k) % 360;
      let z = p; for (let i = 0; i < N; i++) z = ap(reflAt(i % 2 ? l2.a : l1.a), z);
      return E.num(`P${pt(p)} is reflected in ${l1.txt}, then in ${l2.txt}, then in ${l1.txt}, then in ${l2.txt}, and so on, alternating, ${N} reflections in all. Where does P end up?`, [PF(z, 'final =')], `Each pair (${l1.txt.replace('the ', '')} then ${l2.txt.replace('the ', '')}) is a rotation of 2 × ${dA}° = ${2 * dA}° counterclockwise about the origin. ${N} reflections make ${k} pairs${N % 2 ? ' and one more reflection' : ''}: ${k} × ${2 * dA}° = ${2 * dA * k}°, which is ${turnTxt(tot)}${N % 2 ? `, followed by a reflection in ${l1.txt}` : ''}. So P ends at ${pt(z)}.`); } },
  });

  /* ================= V.13.06 Glide reflections ================= */
  const FOOT = `<g fill="${C.ink}" fill-opacity="0.78"><ellipse cx="-13" cy="0" rx="7.5" ry="6"/><ellipse cx="-3" cy="-2.6" rx="9" ry="4.2"/><ellipse cx="6" cy="0.5" rx="8.5" ry="7.6"/>`
    + `<circle cx="18.5" cy="4.6" r="3.8"/><circle cx="19" cy="-1.6" r="2.6"/><circle cx="17.6" cy="-5.6" r="2.3"/><circle cx="15.4" cy="-8.8" r="2"/><circle cx="12.6" cy="-11" r="1.8"/></g>`;
  const footFig = () => { const W = 330, H = 150, cy = 75, step = 58, x0 = 38; let b = `<line x1="8" y1="${cy}" x2="${W - 8}" y2="${cy}" stroke="${C.muted}" stroke-width="1.5" stroke-dasharray="6 5"/>`;
    for (let i = 0; i < 5; i++) { const x = x0 + i * step, up = i % 2 === 0, y = up ? cy - 24 : cy + 24;
      b += `<g transform="translate(${x} ${y}) scale(1 ${up ? 1 : -1})">${FOOT}</g>` + V.text(x + 2, up ? y - 25 : y + 25, String(i + 1), { size: 13, weight: 700, fill: C.blue }); }
    return V.svg(W, H, b, 'a trail of footprints, numbered 1 to 5'); };
  const KINDS4 = ['translation', 'reflection', 'rotation', 'glide reflection'];
  S('V.13.06', 'Glide reflections', {
    a: { t: 'definition', g: R => {
      const mode = R.pick([0, 1, 1, 2, 2, 2]);
      if (mode === 1) { const yes = R.bool(), lt = R.int(0, 2), k = R.int(-4, 4), a = nz(R, -5, 5), b = nz(R, -5, 5);
        const line = lt === 0 ? `y=${k}` : lt === 1 ? `x=${k}` : R.pick(['y=x', 'y=-x']), neg = line === 'y=-x';
        const v = yes ? (lt === 0 ? [a, 0] : lt === 1 ? [0, b] : [a, neg ? -a : a]) : (lt === 0 ? [0, b] : lt === 1 ? [a, 0] : R.bool() ? [a, neg ? a : -a] : [a, a === b || (neg && a === -b) ? b + (b > 0 ? 1 : -1) : b]);
        const dir = lt === 0 ? 'horizontal' : lt === 1 ? 'vertical' : `along ${neg ? '⟨1, −1⟩' : '⟨1, 1⟩'}`;
        return yn(`A move reflects every point in the line ${M(line)}, then translates it by ${vec(v)}. Is this a glide reflection?`, yes,
          yes ? `Yes: the line ${E.pt(line)} runs ${dir}, and ${vec(v)} points the same way, so the slide is along the mirror.` : `No: the line ${E.pt(line)} runs ${dir}, but ${vec(v)} does not point along it. A glide reflection needs the slide parallel to the mirror.`); }
      if (mode === 0) return E.choice(R, 'Which describes a glide reflection?', 'a reflection in a line, followed by a translation along that line', ['a reflection in a line, followed by a translation perpendicular to that line', 'a rotation followed by a translation', 'two reflections in parallel lines'], 'A glide reflection flips in a line and then slides parallel to it, like footprints along a path. (Two reflections in parallel lines make a plain translation.)');
      const truth = R.bool(), T = ['A glide reflection is an isometry.', 'A glide reflection reverses orientation: clockwise vertices become counterclockwise.', 'In a glide reflection, the translation is parallel to the mirror line.', 'In a glide reflection, the reflection and the translation can be done in either order.', 'The midpoint of each point and its image under a glide reflection lies on the mirror line.', 'Doing the same glide reflection twice gives a translation.'];
      const F = ['A glide reflection is a kind of rotation.', 'A glide reflection keeps orientation the same.', 'In a glide reflection, the translation is perpendicular to the mirror line.', 'A glide reflection with a nonzero slide leaves some point fixed.', 'Doing the same glide reflection twice gives a reflection.', 'A glide reflection changes the size of a figure.'];
      const W = { 0: 'Both parts keep distances, so the whole move does.', 1: 'The reflection part flips the figure, so orientation reverses.', 2: 'That is the definition: the slide runs along the mirror line.', 3: 'A slide along the mirror does not change distances to it, so the two parts commute.', 4: 'The reflection puts the midpoint on the line and the slide keeps it there, moved along.', 5: 'The two flips cancel and the two slides add: a translation by twice the slide.' };
      const WF = { 0: 'It flips the figure (orientation reverses), which no rotation does.', 1: 'The reflection part reverses orientation.', 2: 'The slide must run along (parallel to) the mirror line.', 3: 'Every point slides along, so no point stays put.', 4: 'The two flips cancel, leaving a translation by twice the slide.', 5: 'Reflections and translations both keep size, so the glide does too.' };
      const i = R.int(0, 5); return E.tf(`True or false? ${truth ? T[i] : F[i]}`, truth, truth ? W[i] : WF[i]); } },
    b: { t: 'apply', g: R => { const type = R.int(0, 2), k = R.int(-3, 3), t = nz(R, -5, 5), twice = R.bool(0.25); let F, line, txt, why;
      if (type === 0) { F = cmp(tr([t, 0]), AF([1, 0, 0, -1], [0, 2 * k])); line = { f: () => k }; txt = `reflect in the line y = ${k}, then translate by ${vec([t, 0])}`; }
      else if (type === 1) { F = cmp(tr([0, t]), AF([-1, 0, 0, 1], [2 * k, 0])); line = { x: k }; txt = `reflect in the line x = ${k}, then translate by ${vec([0, t])}`; }
      else { F = cmp(tr([t, t]), AF(D.rd.m)); line = { f: x => x, lab: 'y = x' }; txt = `reflect in the line y = x, then translate by ${vec([t, t])}`; }
      let p; do p = [R.int(-5, 5), R.int(-5, 5)]; while (!inBox([ap(F, p), ap(F, ap(F, p))], 10));
      const q1 = ap(type === 0 ? AF([1, 0, 0, -1], [0, 2 * k]) : type === 1 ? AF([-1, 0, 0, 1], [2 * k, 0]) : AF(D.rd.m), p), q = ap(F, p), q2 = ap(F, q);
      if (twice) return E.num(`A glide reflection G: ${txt}. Apply G twice to P${pt(p)}.`, [PF(q2, 'G(G(P)) =')], `Once: P → ${pt(q)}. Twice: → ${pt(q2)}. The flips cancel and the slides add, so G twice is a translation by ${vec(type === 0 ? [2 * t, 0] : type === 1 ? [0, 2 * t] : [2 * t, 2 * t])}.`, { visual: gfig({ pts: [[p[0], p[1], 'P']], lines: [line], extra: [q2], label: 'a point and a glide line' }) });
      return E.num(`Apply the glide reflection to P${pt(p)}: ${txt}.`, [PF(q, 'P′ =')], `Reflect: ${pt(p)} → ${pt(q1)}. Slide along the line: → ${pt(q)}.`, { visual: gfig({ pts: [[p[0], p[1], 'P']], lines: [line], extra: [q], label: 'a point and a glide line' }) }); } },
    c: { t: 'footprints example', g: R => { const vis = footFig(), kind = R.int(0, 2);
      if (kind === 0) { const odd = R.bool(); let i, j; do { i = R.int(1, 4); j = R.int(i + 1, 5); } while ((j - i) % 2 !== (odd ? 1 : 0));
        return E.choiceFixed(`Which single transformation maps footprint ${i} onto footprint ${j}?`, KINDS4, odd ? 3 : 0, odd ? `Footprint ${i} is a ${i % 2 ? 'left' : 'right'} foot and ${j} is a ${j % 2 ? 'left' : 'right'} foot, so the move flips (a reflection in the path line) and slides along the path: a glide reflection.` : `Both are ${i % 2 ? 'left' : 'right'} feet facing the same way, so a slide along the path does it: a translation.`, { visual: vis }); }
      const s = R.int(25, 45), i = R.int(1, 3), j = R.int(i + 1, 5);
      if (kind === 1) return E.num(`The glide reflection that maps each footprint onto the next slides ${s} cm along the path. How far along the path is footprint ${j} from footprint ${i}?`, [{ label: 'distance =', ans: (j - i) * s }], `${j - i} glides of ${s} cm each: ${j - i} × ${s} = ${(j - i) * s} cm.${(j - i) % 2 ? '' : ' (An even number of glides is a translation: the flips cancel.)'}`, { visual: vis });
      return E.choice(R, 'Why is the move from footprint 1 to footprint 2 a glide reflection and not a rotation?', 'A left foot becomes a right foot, so the figure is flipped; rotations never flip.', ['Footprint 2 is farther along the path.', 'Footprint 2 points in the same direction as footprint 1.', 'Rotations change the size of a figure.'], 'Rotations and translations keep orientation. Turning a left footprint never makes a right one; only a reflection, here with a slide, can.', { visual: vis }); } },
    d: { t: 'identify from a picture', g: R => { const type = R.int(0, 3); let T, F, why, line;
      for (;;) { T = gtri(R, -3, 3);
        if (type === 0) { let v; do v = [R.int(-6, 6), R.int(-6, 6)]; while (Math.abs(v[0]) + Math.abs(v[1]) < 5); F = tr(v); why = `Same orientation and same direction: every vertex moved by ${vec(v)}. A translation.`; }
        else if (type === 1) { const m = mirror(R.int(0, 3), R.int(-2, 2)); F = m.F; line = m; why = `The orientation is reversed, and the line ${m.txt} is the perpendicular bisector of every segment from a vertex to its image. A reflection.`; }
        else if (type === 2) { const a = R.pick([90, 180, 270]), c = [R.int(-2, 2), R.int(-2, 2)]; F = rotC(a, c); why = `The orientation is the same but the triangle is turned: a rotation of ${rotName(a)} about ${pt(c)}.`; }
        else { const t = nz(R, -6, 6), k = R.int(-2, 2), h = R.bool(); if (Math.abs(t) < 3) continue; F = h ? cmp(tr([t, 0]), AF([1, 0, 0, -1], [0, 2 * k])) : cmp(tr([0, t]), AF([-1, 0, 0, 1], [2 * k, 0]));
          why = `The orientation is reversed, but no single mirror works: the midpoints of the vertex-to-image segments all lie on ${h ? 'y' : 'x'} = ${k}. It is a reflection in that line plus a slide of ${Math.abs(t)} along it. A glide reflection.`; }
        const T2 = T.map(p => ap(F, p)); if (!inBox(T2, 8) || T2.some(p => T.some(q => eqP(p, q)))) continue; break; }
      const L = K.trio(R), T2 = T.map(p => ap(F, p));
      return E.choiceFixed(`Which single transformation maps △${L.join('')} onto △${primes(L).join('')}?`, KINDS4, type, why, { visual: gfig({ polys: [{ p: T, names: L }, { p: T2, names: primes(L) }], label: 'a triangle and its image' }) }); } },
  });

  /* ================= V.13.07 Symmetry ================= */
  const reg = n => [...Array(n).keys()].map(i => K.polar(1.6, 90 + 360 * i / n));
  const SHAPES = [
    { n: 'square', p: [[-1, -1], [1, -1], [1, 1], [-1, 1]], L: 4, O: 4 }, { n: 'rectangle', p: [[-1.7, -1], [1.7, -1], [1.7, 1], [-1.7, 1]], L: 2, O: 2, why: 'the lines through the midpoints of opposite sides (not the diagonals)' },
    { n: 'rhombus', p: [[0, -1.1], [1.8, 0], [0, 1.1], [-1.8, 0]], L: 2, O: 2, why: 'the two diagonals' }, { n: 'parallelogram', p: [[-1.7, -0.9], [0.9, -0.9], [1.7, 0.9], [-0.9, 0.9]], L: 0, O: 2, why: 'none: folding along a diagonal or a midline does not match it up' },
    { n: 'kite', p: [[0, 1.2], [1, 0.4], [0, -1.9], [-1, 0.4]], L: 1, O: 1, why: 'the long diagonal only' }, { n: 'isosceles trapezoid', p: [[-1.8, -0.9], [1.8, -0.9], [0.9, 0.9], [-0.9, 0.9]], L: 1, O: 1, why: 'the line through the midpoints of the parallel sides' },
    { n: 'isosceles triangle', p: [[-1, -1], [1, -1], [0, 2]], L: 1, O: 1, why: 'the line from the top vertex to the middle of the base' }, { n: 'equilateral triangle', p: reg(3), L: 3, O: 3 },
    { n: 'scalene triangle', p: [[-1.4, -0.9], [1.6, -0.9], [-0.2, 1.3]], L: 0, O: 1, why: 'none, since no two sides match' }, { n: 'regular pentagon', p: reg(5), L: 5, O: 5 }, { n: 'regular hexagon', p: reg(6), L: 6, O: 6 }, { n: 'regular octagon', p: reg(8), L: 8, O: 8 },
  ];
  const shapeFig = (R, s) => { const P = {}; s.p.forEach((q, i) => P['_' + i] = q); const Q = K.spin(R, P), ks = Object.keys(Q);
    return K.fig({ pts: Q, segs: ks.map((k, i) => [k, ks[(i + 1) % ks.length]]), polys: [[...ks, { fill: C.blue, opacity: 0.15 }]], w: 200, label: s.n }); };
  const an = w => /^[aeiou]/.test(w) ? 'an' : 'a';
  S('V.13.07', 'Symmetry', {
    a: { t: 'line symmetry', g: R => { const s = R.pick(SHAPES);
      return E.num(`How many lines of symmetry does this ${s.n} have?`, [{ label: 'lines =', ans: s.L }], s.why ? `${s.L === 0 ? 'It has no lines of symmetry' : `It has ${s.L}: ${s.why}`}.` : `A regular polygon with ${s.p.length} sides has ${s.L} lines of symmetry: ${s.p.length % 2 ? 'one through each vertex and the middle of the opposite side' : 'half through opposite vertices and half through the midpoints of opposite sides'}.`, { visual: shapeFig(R, s) }); } },
    b: { t: 'rotational symmetry and order', g: R => { const s = R.pick(SHAPES), ang = s.O > 1 && R.bool(0.4);
      if (ang) return E.num(`What is the smallest angle you can rotate this ${s.n} about its center so that it fits onto itself?`, [{ label: 'angle =', ans: 360 / s.O }], `It fits onto itself ${s.O} times in a full turn (order ${s.O}), so the smallest angle is 360° ÷ ${s.O} = ${360 / s.O}°.`, { visual: shapeFig(R, s) });
      return E.num(`What is the order of rotational symmetry of this ${s.n}? (Order 1 means it only fits onto itself after a full turn.)`, [{ label: 'order =', ans: s.O }], s.O === 1 ? 'Only the full 360° turn fits it onto itself, so the order is 1: no rotational symmetry.' : `It fits onto itself ${s.O} times in one full turn, every ${360 / s.O}°, so the order is ${s.O}.`, { visual: shapeFig(R, s) }); } },
    c: { t: 'point symmetry', g: R => { const kind = R.int(0, 2);
      if (kind === 2) { const p = [nz(R, -8, 8), nz(R, -8, 8)], o = R.bool() ? [0, 0] : [R.int(-3, 3), R.int(-3, 3)], q = [2 * o[0] - p[0], 2 * o[1] - p[1]];
        return E.num(`A figure has point symmetry about ${eqP(o, [0, 0]) ? 'the origin' : pt(o)}. It contains the point ${pt(p)}. Which other point must it contain?`, [PF(q)], `Point symmetry is a 180° rotation about the center, so ${pt(p)} goes through ${pt(o)} to the same distance on the other side: ${pt(q)}.`); }
      if (kind === 1) { const yes = R.bool(), w = yes ? R.pick(['H', 'N', 'S', 'Z', 'X', 'O', 'I']) : R.pick(['A', 'T', 'M', 'E', 'K', 'V', 'Y', 'C']);
        return yn(`Does the capital letter ${w} have point symmetry?`, yes, yes ? `Yes: turned 180° upside down, ${w} looks the same.` : `No: turned 180°, ${w} looks different (it is upside down).`, { visual: V.svg(110, 90, V.text(55, 47, w, { size: 72, weight: 700, fill: C.ink }), `the letter ${w}`) }); }
      const yes = R.bool(), s = R.pick(SHAPES.filter(x => (x.O % 2 === 0) === yes));
      return yn(`Does this ${s.n} have point symmetry?`, yes, yes ? `Yes: its rotational symmetry has even order (${s.O}), so a 180° turn about its center fits it onto itself.` : `No: a 180° turn does not fit it onto itself (its rotational order is ${s.O}, which is odd).`, { visual: shapeFig(R, s) }); } },
    d: { t: 'symmetry of regular polygons', g: R => { const n = R.pick([3, 4, 5, 6, 8, 9, 10, 12, 15, 18, 20]), kind = R.int(0, 3);
      if (kind === 0) return E.num(`A regular polygon has ${n} sides. Find the smallest angle of rotational symmetry.`, [{ label: 'angle =', ans: 360 / n }], `It fits onto itself ${n} times per turn, so the smallest angle is 360° ÷ ${n} = ${360 / n}°.`);
      if (kind === 1) return E.num(`The smallest angle of rotational symmetry of a regular polygon is ${360 / n}°. How many lines of symmetry does it have?`, [{ label: 'lines =', ans: n }], `360° ÷ ${360 / n}° = ${n}, so it has ${n} sides, and a regular polygon with ${n} sides has ${n} lines of symmetry.`);
      if (kind === 2) return E.num(`A regular polygon has ${n} lines of symmetry. What is the order of its rotational symmetry?`, [{ label: 'order =', ans: n }], `${n} lines of symmetry means ${n} sides, and a regular polygon with ${n} sides fits onto itself ${n} times per turn.`);
      const yes = R.bool(), m = R.pick(yes ? [4, 6, 8, 10, 12, 18, 20, 24] : [3, 5, 7, 9, 11, 13, 15]);
      return yn(`Does a regular polygon with ${m} sides have point symmetry?`, yes, yes ? `Yes: ${m} is even, so 180° = ${m / 2} × ${360 / m}° is one of its symmetry rotations.` : `No: its symmetry rotations are multiples of 360° ÷ ${m}, and 180° is not one because ${m} is odd.`); } },
  });

  /* ================= V.13.08 Dilations about any center ================= */
  const dil = (k, c) => AF([k, 0, 0, k], [c[0] * (1 - k), c[1] * (1 - k)]);
  const kTxt = k => k === 0.5 ? '1/2' : k === -0.5 ? '−1/2' : k === 1.5 ? '3/2' : sg(k);
  const lineEq = (m, b) => `y=${m === 1 ? '' : m === -1 ? '-' : m}x${b ? (b > 0 ? '+' : '') + b : ''}`;
  const lineTxt = (m, b) => `y = ${m === 1 ? '' : m === -1 ? '−' : sg(m)}x${b ? plus(b) : ''}`;
  S('V.13.08', 'Dilations about any center', {
    a: { t: 'center and factor', g: R => { const kind = R.int(0, 2), al = R.int(0, 71) * 5;
      const pic = (d, k, labP, labP2) => K.fig({ pts: { O: [0, 0], P: K.polar(d, al), 'P′': K.polar(d * k, al) }, segs: [['O', k > 1 ? 'P′' : 'P'], ['O', 'P', { lab: labP }], ['O', 'P′', { color: 'none', lab: labP2 }]], w: 240, label: 'a dilation of a point from a center' });
      if (kind === 0) { const d = R.int(2, 9), k = R.pick([2, 3, 0.5, 1.5, 2.5, 4]); if (k === 0.5 && d % 2) return E.num(`A dilation with center O and scale factor ${kTxt(k)} maps P to P′. OP = ${2 * d}. Find OP′.`, [{ label: 'OP′ =', ans: d }], `OP′ = ${kTxt(k)} × OP = ${kTxt(k)} × ${2 * d} = ${d}.`, { visual: pic(2 * d, k) });
        return E.num(`A dilation with center O and scale factor ${kTxt(k)} maps P to P′. OP = ${d}. Find OP′.`, [{ label: 'OP′ =', ans: k * d }], `Distances from the center are multiplied by the factor: OP′ = ${kTxt(k)} × ${d} = ${k * d}.`, { visual: pic(d, k) }); }
      if (kind === 1) { const d = R.pick([2, 4, 5, 8, 10]), k = R.pick([1.5, 2, 2.5, 3, 0.5, 4, 0.25, 0.75].filter(x => Number.isInteger(x * d * 4) && x * d >= 1)), D2 = k * d;
        return E.num(`A dilation with center O maps P to P′. OP = ${d} and OP′ = ${D2}. Find the scale factor.`, [{ label: 'k =', ans: k }], `k = OP′ ÷ OP = ${D2} ÷ ${d} = ${k}.`, { visual: pic(d, k) }); }
      const big = R.bool(), k = R.pick(big ? ['2', '3', '5/2', '1.5', '4/3', '6'] : ['1/2', '1/3', '2/3', '0.8', '3/4', '0.25']);
      return E.choiceFixed(`A dilation has scale factor ${k}. Is the image an enlargement or a reduction?`, ['an enlargement', 'a reduction'], big ? 0 : 1, big ? `${k} is greater than 1, so every distance from the center grows: an enlargement.` : `${k} is between 0 and 1, so every distance from the center shrinks: a reduction.`); } },
    b: { t: 'apply in coordinates', g: R => { const org = R.bool(0.35), k = R.pick([2, 3, 0.5, 2, 3]); let c, p, q;
      do { c = org ? [0, 0] : [R.int(-4, 4), R.int(-4, 4)]; p = [R.int(-5, 5), R.int(-5, 5)]; q = ap(dil(k, c), p); } while (eqP(p, c) || !Number.isInteger(q[0]) || !Number.isInteger(q[1]) || !inBox([q], 10) || !org && eqP(c, [0, 0]));
      const dv = [p[0] - c[0], p[1] - c[1]];
      if (org) return E.num(`Dilate P${pt(p)} about the origin with scale factor ${kTxt(k)}. Find P′.`, [PF(q, 'P′ =')], `About the origin, multiply both coordinates by ${kTxt(k)}: P′ = ${pt(q)}.`, { visual: gfig({ pts: [[p[0], p[1], 'P'], [0, 0, 'O', C.teal]], extra: [q], label: 'a point and a center of dilation' }) });
      return E.num(`Dilate P${pt(p)} about C${pt(c)} with scale factor ${kTxt(k)}. Find P′.`, [PF(q, 'P′ =')], `Measure from the center: P − C = ${pt(dv)}. Multiply by ${kTxt(k)}: ${pt(dv.map(x => fx(x * k)))}. Add C back: P′ = ${pt(q)}. (Just multiplying P by ${kTxt(k)} would give ${pt(p.map(x => fx(x * k)))}, wrong.)`, { visual: gfig({ pts: [[p[0], p[1], 'P'], [c[0], c[1], 'C', C.teal]], extra: [q], label: 'a point and a center of dilation' }) }); } },
    c: { t: 'negative scale factors', g: R => { const kind = R.int(0, 3);
      if (kind === 3) { const opts = ['a rotation of 180° about the origin', 'a reflection in the x-axis', 'a reflection in the y-axis', 'a reflection in the line y = −x'];
        return E.choice(R, 'A dilation about the origin with scale factor −1 is the same as which transformation?', opts[0], opts.slice(1), 'Factor −1 sends (x, y) to (−x, −y): every point goes through the origin to the same distance on the other side. That is a 180° rotation.'); }
      if (kind === 2) { const k = R.pick([-2, -3, -0.5]), kk = Math.abs(k), far = kk === 0.5 ? 'half as far' : kk === 2 ? 'twice as far' : 'three times as far', w = kk === 0.5 ? 'twice as far' : 'half as far';
        return E.choice(R, `A dilation has center C and scale factor ${kTxt(k)}. Where is the image P′ of a point P?`, `on the line PC, on the other side of C, ${far} from C as P`, [`on ray CP, on the same side as P, ${far} from C as P`, `on the line PC, on the other side of C, ${w} from C as P`, `on the line PC, on the other side of C, the same distance from C as P`], `The minus sign sends P′ to the opposite side of C, and the size ${kk} makes it ${far} from C.`); }
      const k = R.pick([-1, -2, -3, -0.5, -2]), org = kind === 0; let c, p, q;
      do { c = org ? [0, 0] : [R.int(-3, 3), R.int(-3, 3)]; p = [R.int(-5, 5), R.int(-5, 5)]; q = ap(dil(k, c), p); } while (eqP(p, c) || !Number.isInteger(q[0]) || !Number.isInteger(q[1]) || !inBox([q], 10) || !org && eqP(c, [0, 0]));
      const dv = [p[0] - c[0], p[1] - c[1]];
      return E.num(`Dilate P${pt(p)} about ${org ? 'the origin' : `C${pt(c)}`} with scale factor ${kTxt(k)}. Find P′.`, [PF(q, 'P′ =')], org ? `Multiply both coordinates by ${kTxt(k)}: P′ = ${pt(q)}, on the other side of the origin.` : `P − C = ${pt(dv)}. Multiply by ${kTxt(k)}: ${pt(dv.map(x => fx(x * k)))}. Add C: P′ = ${pt(q)}, on the other side of C.`, { visual: gfig({ pts: [[p[0], p[1], 'P'], [c[0], c[1], org ? 'O' : 'C', C.teal]], extra: [q], label: 'a point and a center of dilation' }) }); } },
    d: { t: 'lines map to parallel lines', g: R => { const kind = R.int(0, 4), m = R.pick([1, -1, 2, -2, 3, -3, 1, -1]), k = R.pick([2, 3, -1, -2, 2]);
      if (kind >= 3) { // proof by slopes that the image line is parallel
        let x1, x2, b0; do { x1 = R.int(-3, 3); x2 = x1 + nz(R, -3, 3); b0 = R.int(-3, 3); } while (Math.abs(x2) > 4 || (x1 === 0 && b0 === 0));
        const Pp = [x1, m * x1 + b0], Qp = [x2, m * x2 + b0], P2 = Pp.map(v => fx(k * v)), Q2 = Qp.map(v => fx(k * v)), df = (u, v) => `${sg(u)} − ${v < 0 ? `(${sg(v)})` : v}`, kv = v => k === -1 ? `−${v}` : `${sg(k)}${v}`;
        const L = [`Line ℓ passes through P${pt(Pp)} and Q${pt(Qp)}. A dilation about the origin with scale factor ${sg(k)} maps (x, y) to (${kv('x')}, ${kv('y')}) (given).`, `slope of PQ = (${df(Qp[1], Pp[1])}) ÷ (${df(Qp[0], Pp[0])}) = ${sg(m)}`, `P′ = ${pt(P2)} and Q′ = ${pt(Q2)}`,
          `slope of P′Q′ = (${df(Q2[1], P2[1])}) ÷ (${df(Q2[0], P2[0])}) = ${sg(m)}`, 'The slopes are equal, so the image line is parallel to ℓ (or is ℓ itself).'];
        const why = `Multiply both coordinates by ${sg(k)}: P′${pt(P2)}, Q′${pt(Q2)}. Both differences in the slope are multiplied by ${sg(k)}, which cancels, so the slope stays ${sg(m)}.`;
        if (kind === 3) return K.orderQ(R, 'Show that the dilation maps ℓ to a parallel line: put the steps in order.', L, [[], [], [0], [2], [1, 3]], `${why} The slope of PQ can be found at any point before the last line.`, { fixed: 1 });
        const tr2 = (X, Y) => `P′ = ${pt(X)} and Q′ = ${pt(Y)}`, j = R.pick([2, 4]);
        const ok = j === 2 ? tr2(P2, Q2) : L[4], cands = j === 2 ? [tr2([x1 + k, Pp[1] + k], [x2 + k, Qp[1] + k]), tr2([k * x1, Pp[1]], [k * x2, Qp[1]]), tr2([x1, k * Pp[1]], [x2, k * Qp[1]]), tr2([fx(-k * x1), fx(-k * Pp[1])], [fx(-k * x2), fx(-k * Qp[1])])]
          : [`The slope is multiplied by ${sg(k)}, so the image line is ${Math.abs(k) > 1 ? 'steeper than' : 'reflected from'} ℓ.`, 'The slopes are equal, so the image line is perpendicular to ℓ.', 'The image line passes through the origin, so it is ℓ itself.'];
        if (j === 2) L[3] = `slope of P′Q′ = ${sg(m)}`;   // don't give the hidden coordinates away
        return E.choice(R, `This proof shows that the dilation maps ℓ to a parallel line. Which statement belongs in line ${j + 1}?${numbered(L.map((l, i) => i === j ? '<b>?</b>' : l))}`, ok, uniq3(ok, cands), why); }
      if (kind === 0) { const b = nz(R, -5, 5); return E.num(`The line ${lineTxt(m, b)} is dilated about the origin with scale factor ${sg(k)}. Find the equation of the image line.`, [{ eqn: lineEq(m, k * b) }], `The image is parallel, so the slope stays ${sg(m)}. The y-intercept (0, ${b}) moves to (0, ${k * b}). So the image is ${lineTxt(m, k * b)}.`); }
      if (kind === 1) { const on = R.bool(0.25); let c, b; do { c = [R.int(-3, 3), R.int(-3, 3)]; b = R.int(-5, 5); } while (on !== (c[1] === m * c[0] + b) || eqP(c, [0, 0]));
        const B = c[1] - m * c[0] + k * (m * c[0] + b - c[1]), P0 = [0, b], P1 = ap(dil(k, c), P0);
        return E.num(`The line ${lineTxt(m, b)} is dilated about C${pt(c)} with scale factor ${sg(k)}. Find the equation of the image line.`, [{ eqn: lineEq(m, B) }], on ? `C is on the line (${c[1]} = ${sg(m)}·${sg(c[0]).replace('−', '(−') + (c[0] < 0 ? ')' : '')}${b ? plus(b) : ''}), and a line through the center maps onto itself: ${lineTxt(m, b)}.` : `The image is parallel, slope ${sg(m)}. Dilate one point: (0, ${b}) → ${pt(P1)}. The line with slope ${sg(m)} through ${pt(P1)} is ${lineTxt(m, B)}.`); }
      const two = R.bool(); let A, Bp; do { A = [R.int(-5, 5), R.int(-5, 5)]; Bp = [A[0] + nz(R, -3, 3), 0]; Bp[1] = A[1] + m * (Bp[0] - A[0]); } while (!inBox([Bp], 9));
      return E.num(`The line through A${pt(A)} and B${pt(Bp)} is dilated about ${two ? 'the origin' : 'the point (1, 2)'} with scale factor ${sg(k)}. What is the slope of the image line?`, [{ label: 'slope =', ans: m }], `A dilation sends every line to a parallel line, so the slope is unchanged: (${Bp[1]} − ${sg(A[1]).replace('−', '(−') + (A[1] < 0 ? ')' : '')}) ÷ (${Bp[0]} − ${sg(A[0]).replace('−', '(−') + (A[0] < 0 ? ')' : '')}) = ${sg(m)}. (It is not ${sg(k)} × ${sg(m)}.)`); } },
    e: { t: 'find the center and the factor', g: R => { const k = R.pick([2, 3, -1, -2, 0.5, -0.5, 2]); let c, A, B, A2, B2;
      do { c = [R.int(-4, 4), R.int(-4, 4)]; A = [R.int(-6, 6), R.int(-6, 6)]; B = [R.int(-6, 6), R.int(-6, 6)]; A2 = ap(dil(k, c), A); B2 = ap(dil(k, c), B); }
      while ([A2, B2].flat().some(x => !Number.isInteger(x)) || !inBox([A2, B2], 9) || eqP(A, c) || eqP(B, c) || d2(A, B) < 5 || Math.abs((A[0] - c[0]) * (B[1] - c[1]) - (A[1] - c[1]) * (B[0] - c[0])) < 1e-9);
      return E.num(`A dilation maps A${pt(A)} to A′${pt(A2)} and B${pt(B)} to B′${pt(B2)}. Find its center and scale factor.`, [PF(c, 'center ='), { label: 'k =', ans: k }],
        `The center lies on line AA′ and on line BB′; they cross at ${pt(c)}. Then k = A′B′ ÷ AB with direction: A′B′ = ${pt([B2[0] - A2[0], B2[1] - A2[1]])} is ${kTxt(k)} × AB = ${kTxt(k)} × ${pt([B[0] - A[0], B[1] - A[1]])}${k < 0 ? ', reversed, so k is negative' : ''}.`,
        { visual: gfig({ polys: [{ p: [A, B], names: ['A', 'B'] }, { p: [A2, B2], names: ['A′', 'B′'] }], label: 'a segment and its image under a dilation' }) }); } },
    f: { t: 'two dilations make one', g: R => { const pr = R.pick([[2, 3], [3, 2], [2, -1], [-1, 2], [2, 2], [3, -1], [2, 0.5], [0.5, 2], [-2, -0.5], [-1, -1]]), [k1, k2] = pr; let A, B;
      if (Math.abs(k1 * k2 - 1) < 1e-9) { const p = [R.int(-4, 4), R.int(-4, 4)]; let q; do { A = [R.int(-4, 4), R.int(-4, 4)]; B = [R.int(-4, 4), R.int(-4, 4)]; q = ap(cmp(dil(k2, B), dil(k1, A)), p); } while (eqP(A, B) || q.some(x => !Number.isInteger(x)));
        const F = cmp(dil(k2, B), dil(k1, A)), v = F.t;
        return E.num(`P${pt(p)} is dilated by factor ${kTxt(k1)} about A${pt(A)}, then by factor ${kTxt(k2)} about B${pt(B)}. Where does P end up?`, [PF(q, 'final =')], `The factors multiply to ${kTxt(k1)} × ${kTxt(k2)} = 1, so the result is a translation. Track the origin: it ends at ${pt(v)}, so the vector is ${vec(v)} and P ends at ${pt(q)}.`); }
      let c; do { A = [R.int(-4, 4), R.int(-4, 4)]; B = [R.int(-4, 4), R.int(-4, 4)]; const kk = k1 * k2; c = [0, 1].map(i => fx((k2 * (1 - k1) * A[i] + (1 - k2) * B[i]) / (1 - kk))); } while (eqP(A, B) || c.some(x => !Number.isInteger(x)));
      const F = cmp(dil(k2, B), dil(k1, A)); if (!eqP(ap(F, c), c)) throw new Error('V.13.08.f center');
      return E.num(`Dilate by factor ${kTxt(k1)} about A${pt(A)}, then by factor ${kTxt(k2)} about B${pt(B)}. The result is a single dilation. Find its center and scale factor.`, [PF(c, 'center ='), { label: 'k =', ans: fx(k1 * k2) }],
        `Lengths are multiplied by ${kTxt(k1)} and then ${kTxt(k2)}, so k = ${kTxt(fx(k1 * k2))}. The center is the point that does not move: ${pt(c)} → ${pt(ap(dil(k1, A), c))} → ${pt(c)}.`); } },
  });

  /* ================= V.13.09 Congruence by rigid motions ================= */
  const SEQM = [D.rx, D.ry, D.r90, D.r180, D.r270];
  // △ABC → △A′B′C′ by M then a translation; returns the picture and the wrong sequences that still send A to A′
  const seqPair = (R, scale = 1) => { for (;;) { const T = gtri(R, -3, 3).map(p => p.map(x => x * scale)), Mv = R.pick(SEQM), v = [R.int(-5, 5), R.int(-5, 5)], F = cmp(tr(v), AF(Mv.m)), T2 = T.map(p => ap(F, p));
      if (!inBox(T2, 9) || isId(F) || (!v[0] && !v[1]) || T2.some(p => T.some(q => eqP(p, q)))) continue; return { T, Mv, v, F, T2 }; } };
  const SAS_P = [['Translate △ABC so that A lands on D.', ''], ['Rotate about D so that ray AB lies along ray DE.', ''], ['B lands on E', 'AB = DE'], ['If C and F are on opposite sides of DE, reflect in line DE.', ''], ['Ray AC now lies along ray DF', '∠A = ∠D'], ['C lands on F', 'AC = DF']];
  const ASA_P = [['Translate △ABC so that A lands on D.', ''], ['Rotate about D so that ray AB lies along ray DE.', ''], ['B lands on E', 'AB = DE'], ['If C and F are on opposite sides of DE, reflect in line DE.', ''], ['Ray AC now lies along ray DF', '∠A = ∠D'], ['Ray BC now lies along ray EF', '∠B = ∠E'], ['C lands on F', 'C and F are both where those two rays meet']];
  const SSS_P = [['Translate △ABC so that A lands on D.', ''], ['Rotate about D so that ray AB lies along ray DE.', ''], ['B lands on E', 'AB = DE'], ['If C and F are on opposite sides of DE, reflect in line DE.', ''], ['C lands on F', 'only one point on that side of DE is AC from D and BC from E, and F is that point']];
  const PROOFS = { SAS: { st: SAS_P, giv: 'AB = DE, AC = DF and ∠A = ∠D', deps: [[], [0], [1], [2], [3], [4]] }, ASA: { st: ASA_P, giv: '∠A = ∠D, AB = DE and ∠B = ∠E', deps: [[], [0], [1], [2], [3], [3], [4, 5]] }, SSS: { st: SSS_P, giv: 'AB = DE, BC = EF and AC = DF', deps: [[], [0], [1], [2], [3]] } };
  const REASONS = ['AB = DE', 'AC = DF', 'BC = EF', '∠A = ∠D', '∠B = ∠E', '∠C = ∠F'];
  // K.rnF renames the letters A–F; keep criterion names like AA, ASA, SAS, AAA intact
  const rnSafe = map => { const f = K.rnF(map); return s => f(s.replace(/\b(AAA|ASA|SAS|SSS|AA)\b/g, m => `§${['AAA', 'ASA', 'SAS', 'SSS', 'AA'].indexOf(m)}§`)).replace(/§(\d)§/g, (m, i) => ['AAA', 'ASA', 'SAS', 'SSS', 'AA'][i]); };
  S('V.13.09', 'Congruence by rigid motions', {
    a: { t: 'the definition', g: R => { if (R.bool(0.25)) return E.choice(R, 'What does it mean for two figures to be congruent?', 'Some sequence of rigid motions maps one figure onto the other.', ['Some dilation maps one figure onto the other.', 'The two figures have the same area.', 'The two figures have the same angles.'], 'Congruent means a sequence of rigid motions (translations, reflections, rotations) maps one exactly onto the other. Equal area or equal angles is not enough.');
      const truth = R.bool(), a = R.int(2, 6), b = R.int(7, 12), k = R.pick([2, 3]);
      const T = [['A triangle and its mirror image are congruent.', 'A reflection is a rigid motion, so it maps the triangle onto its mirror image.'], ['If a rotation maps figure F onto figure G, then F and G are congruent.', 'A rotation is a rigid motion.'], ['If a translation followed by a reflection maps F onto G, then F and G are congruent.', 'Any sequence of rigid motions shows congruence.'], ['Congruent figures always have the same area.', 'Rigid motions keep every length, so area stays the same.'], ['If F and G are congruent, some sequence of rigid motions maps G onto F.', 'Undo the moves that map F onto G, in reverse order.']];
      const F = [[`A triangle and its dilation with scale factor ${k} are congruent.`, `The dilation multiplies lengths by ${k}, so the figures are similar but not congruent.`], [`A ${a} by ${b} rectangle and a ${a + 1} by ${b - 1} rectangle are congruent, since both have perimeter ${2 * (a + b)}.`, 'Equal perimeters are not enough: no rigid motion maps one onto the other, because the side lengths differ.'], ['A sequence of moves showing congruence may not use a reflection.', 'Reflections are rigid motions, so a sequence may use them; mirror images are congruent.'], ['Any two figures with the same area are congruent.', 'A 2 by 8 rectangle and a 4 by 4 square both have area 16 but are not congruent.'], [`If a dilation with scale factor ${k} maps F onto G, then F and G are congruent.`, 'A dilation is not a rigid motion unless the factor is 1 or −1.']];
      const [st, why] = R.pick(truth ? T : F); return E.tf(`True or false? ${st}`, truth, why); } },
    b: { t: 'find a sequence', g: R => { const { T, Mv, v, T2 } = seqPair(R), L = K.trio(R), right = `${Mv.sh}, then translate by ${vec(v)}`;
      const wrong = SEQM.filter(m => m !== Mv).map(m => { const w = [T2[0][0] - mv(m.m, T[0])[0], T2[0][1] - mv(m.m, T[0])[1]]; return `${m.sh}${!w[0] && !w[1] ? '' : `, then translate by ${vec(w)}`}`; });
      const swF = cmp(AF(Mv.m), tr(v)), sw = T.every((p, i) => eqP(ap(swF, p), T2[i])) ? [] : [`translate by ${vec(v)}, then ${Mv.sh}`];
      return E.choice(R, `Which sequence of rigid motions maps △${L.join('')} onto △${primes(L).join('')}?`, right, R.shuffle(sw.concat(R.sample(wrong, 3))).slice(0, 3), `${Mv.sh[0].toUpperCase() + Mv.sh.slice(1)} sends ${L[0]}${pt(T[0])} to ${pt(mv(Mv.m, T[0]))}, ${L[1]} to ${pt(mv(Mv.m, T[1]))} and ${L[2]} to ${pt(mv(Mv.m, T[2]))}; then ${vec(v)} moves them onto ${primes(L).join(', ')}. The other choices may get one vertex right but miss the others.`, { visual: gfig({ polys: [{ p: T, names: L }, { p: T2, names: primes(L) }], label: 'two congruent triangles on a grid' }) }); } },
    c: { t: 'justify SAS, ASA, SSS', g: R => { const post = R.pick(['SAS', 'ASA', 'SSS']), P = PROOFS[post], L = K.lets(R, 6), map = {}; 'ABCDEF'.split('').forEach((c, i) => map[c] = L[i]); const rn = rnSafe(map);
      const lines = P.st.map(([s, r]) => rn(r ? `${s}, because ${r}.` : s)), giv = rn(P.giv), kind = R.int(0, 2), tri = `△${L.slice(0, 3).join('')} ≅ △${L.slice(3).join('')}`;
      if (kind === 0) return K.orderQ(R, `Given ${giv}. Put the steps that move △${L.slice(0, 3).join('')} onto △${L.slice(3).join('')} in order (this proves ${post}).`, [`Given ${giv}.`, ...lines], [[], ...P.deps.map(d => d.map(x => x + 1).concat(d.length ? [] : [0]))], `First place one vertex, then line up one side, then flip if needed, and only then use the remaining given parts.${post === 'ASA' ? ' The two ray steps may come in either order.' : ''}`, { fixed: 1 });
      if (kind === 1) { const idx = P.st.map((s, i) => i).filter(i => REASONS.includes(P.st[i][1])), i = R.pick(idx), rs = P.st[i][1];
        const wrong = R.sample(REASONS.filter(x => x !== rs), 3).map(rn);
        return E.choice(R, `Proving ${post} with rigid motions. Given ${giv}. In the step "${rn(P.st[i][0])}", what is the reason?`, rn(rs), wrong, `${rn(P.st[i][0])} because ${rn(rs)}: ${/=/.test(rs) && rs.includes('∠') ? 'the angles match, so the rays line up' : 'the lengths match, so the endpoints land together'}.`); }
      const lastR = rn(P.st[P.st.length - 1][1]);
      return E.choiceFixed(`A proof moves △${L.slice(0, 3).join('')} onto △${L.slice(3).join('')} and ends: "${rn(P.st[P.st.length - 1][0])}, because ${lastR}." Which congruence criterion is it proving?`, ['SAS', 'ASA', 'SSS'], ['SAS', 'ASA', 'SSS'].indexOf(post), post === 'SAS' ? `The last step uses a side (${rn('AC = DF')}) after an angle placed the ray, with the first side ${rn('AB = DE')}: two sides and the angle between them, SAS.` : post === 'ASA' ? rn('C is found where two rays meet, each placed by an angle at the ends of the matched side: ASA.') : rn(`C is pinned down by its two distances from the matched side's endpoints: three pairs of sides, SSS.`)); } },
    d: { t: 'prove congruence this way', g: R => { const kind = R.int(0, 2), L = K.lets(R, 6), A = L.slice(0, 3), B = L.slice(3);
      if (kind === 0) { const { T, Mv, v, T2 } = seqPair(R);
        return E.num(`△${A.join('')} is ${Mv.sh.replace(/^reflect/, 'reflected').replace(/^rotate/, 'rotated')}, then translated by ⟨a, b⟩, landing on △${B.join('')}. Find a and b.`, VF(v), `${Mv.sh[0].toUpperCase() + Mv.sh.slice(1)}: ${A[0]}${pt(T[0])} → ${pt(mv(Mv.m, T[0]))}. It must end at ${B[0]}${pt(T2[0])}, so the translation is ${pt(T2[0])} − ${pt(mv(Mv.m, T[0]))} = ${vec(v)}. Check another vertex to be sure.`, { visual: gfig({ polys: [{ p: T, names: A }, { p: T2, names: B }], label: 'two congruent triangles on a grid' }) }); }
      if (kind === 1) { const { T, Mv, v, T2 } = seqPair(R), i = R.int(0, 2);
        return E.num(`The sequence "${Mv.sh}, then translate by ${vec(v)}" maps △${A.join('')} onto △${B.join('')}, with ${triTxt(A, T)}. Find ${B[i]}.`, [PF(T2[i], `${B[i]} =`)], `${A[i]}${pt(T[i])} → ${pt(mv(Mv.m, T[i]))} → ${pt(T2[i])}. The letters match in order, so this is ${B[i]}.`); }
      const yes = R.bool(); let T, T2;
      for (;;) { const s = seqPair(R); T = s.T; T2 = s.T2.map(p => p.slice()); if (!yes) { const j = R.int(0, 2); T2[j][R.int(0, 1)] += R.pick([-1, 1]); }
        const s1 = [d2(T[0], T[1]), d2(T[1], T[2]), d2(T[2], T[0])], s2 = [d2(T2[0], T2[1]), d2(T2[1], T2[2]), d2(T2[2], T2[0])]; if (yes || s1.join() !== s2.join()) break; }
      const s1 = [d2(T[0], T[1]), d2(T[1], T[2]), d2(T[2], T[0])], s2 = [d2(T2[0], T2[1]), d2(T2[1], T2[2]), d2(T2[2], T2[0])], nm = (X, i, j) => X[i] + X[j];
      return yn(`△${A.join('')} has ${triTxt(A, T)}. △${B.join('')} has ${triTxt(B, T2)}. Can a sequence of rigid motions map △${A.join('')} onto △${B.join('')} (${A[0]}→${B[0]}, ${A[1]}→${B[1]}, ${A[2]}→${B[2]})?`, yes,
        `Squared sides: ${[[0, 1], [1, 2], [2, 0]].map(([i, j], k) => `${nm(A, i, j)}² = ${s1[k]}, ${nm(B, i, j)}² = ${s2[k]}`).join('; ')}. ${yes ? 'All three pairs match, so by SSS the triangles are congruent and a rigid motion sequence exists.' : 'A pair differs, but rigid motions keep every length, so no such sequence exists.'}`); } },
  });

  /* ================= V.13.10 Similarity by transformations ================= */
  S('V.13.10', 'Similarity by transformations', {
    a: { t: 'rigid motion plus dilation', g: R => { const kind = R.int(0, 2), k = R.pick([2, 3, 1.5, 0.5, 2.5, 4]), mvv = R.pick(['rotated 90°', 'reflected in a line', 'translated', 'rotated 180°']);
      if (kind === 0) { const s = [R.int(2, 9), R.int(2, 9), R.int(2, 9)].sort((x, y) => x - y); if (s[2] >= s[0] + s[1]) s[2] = s[0] + s[1] - 1; const which = R.int(0, 2);
        return E.num(`A triangle with sides ${s.join(', ')} is dilated with scale factor ${kTxt(k)} and then ${mvv}. How long is the image of the side of length ${s[which]}?`, [{ label: 'length =', ans: fx(k * s[which]) }], `The dilation multiplies every length by ${kTxt(k)}, and the rigid motion changes nothing: ${kTxt(k)} × ${s[which]} = ${fx(k * s[which])}.`); }
      if (kind === 1) { const ang = R.int(25, 120); return E.num(`A triangle has an angle of ${ang}°. It is dilated with scale factor ${kTxt(k)} and then ${mvv}. What is the matching angle of the image?`, [{ label: 'angle =', ans: ang }], `Dilations and rigid motions both keep angle measures, so the angle is still ${ang}°.`); }
      const truth = R.bool(), T = [['Every two congruent figures are similar.', 'Use scale factor 1 with the same rigid motions.'], ['A dilation followed by a reflection gives a figure similar to the original.', 'That is exactly the definition of similar.'], ['Any two circles are similar.', 'Translate one center onto the other, then dilate by the ratio of the radii.'], ['Any two squares are similar.', 'Line one up with the other, then dilate by the ratio of their sides.'], ['Similar figures have equal corresponding angles.', 'Dilations and rigid motions both keep angles.']];
      const F = [['Every two similar figures are congruent.', 'A dilation with factor 2 gives a similar figure that is twice as big, so not congruent.'], ['A dilation changes the angles of a figure.', 'Dilations keep every angle; only lengths change.'], ['Any two rectangles are similar.', 'A 1 by 2 and a 1 by 5 rectangle are not: no single scale factor works for both sides.'], ['Any two isosceles triangles are similar.', 'Their angles can differ, for example 40°, 70°, 70° and 100°, 40°, 40°.'], [`If △ABC is dilated by ${kTxt(k)}, each side of the image equals the matching side of △ABC.`, `Each side is multiplied by ${kTxt(k)}, not kept equal.`]];
      const [st, why] = R.pick(truth ? T : F); return E.tf(`True or false? ${st}`, truth, why); } },
    b: { t: 'find a sequence', g: R => { for (;;) { const half = R.bool(0.3), k = half ? 0.5 : R.pick([2, 3, 2]), T = gtri(R, -3, 3).map(p => half ? p.map(x => 2 * x) : p);
        if (!half && T.some(p => p.some(x => Math.abs(x) > 2)) && k === 3) continue;
        const Mv = R.pick([D.id, D.id, D.rx, D.ry, D.r180, D.r90]), v = [R.int(-4, 4), R.int(-4, 4)], F = cmp(tr(v), cmp(AF(Mv.m), dil(k, [0, 0]))), T2 = T.map(p => ap(F, p));
        if (!inBox(T2, 10) || !inBox(T, 10) || T2.some(p => T.some(q => eqP(p, q)))) continue;
        const txt = (kk, m, w) => { const parts = [`dilate by ${kTxt(kk)} about the origin`].concat(m === D.id ? [] : [`then ${m.sh}`], !w[0] && !w[1] ? [] : [`then translate by ${vec(w)}`]); return parts.join(', '); }, fit = (kk, m) => { const z = mv(m.m, T[0].map(x => x * kk)); return [fx(T2[0][0] - z[0]), fx(T2[0][1] - z[1])]; };
        const cands = []; [[k === 0.5 ? 2 : 0.5, Mv], [k, R.pick([D.rx, D.ry, D.r180, D.r90, D.id].filter(m => m !== Mv))], [k === 3 ? 2 : 3, Mv]].forEach(([kk, m]) => { const w = fit(kk, m), G2 = cmp(tr(w), cmp(AF(m.m), dil(kk, [0, 0]))); if (!T.every((p, i) => eqP(ap(G2, p), T2[i])) && w.every(Number.isInteger)) cands.push(txt(kk, m, w)); });
        const sw = cmp(AF(Mv.m), cmp(dil(k, [0, 0]), tr(v))); if (!T.every((p, i) => eqP(ap(sw, p), T2[i]))) cands.push(`translate by ${vec(v)}, then dilate by ${kTxt(k)} about the origin${Mv === D.id ? '' : `, then ${Mv.sh}`}`);
        if (cands.length < 3) continue; const L = K.trio(R);
        return E.choice(R, `Which sequence maps △${L.join('')} onto △${primes(L).join('')}?`, txt(k, Mv, v), R.sample(cands, 3), `${primes(L)[0]}${primes(L)[1]} is ${kTxt(k)} times as long as ${L[0]}${L[1]}, so the factor is ${kTxt(k)}. Dilating sends ${L[0]}${pt(T[0])} to ${pt(T[0].map(x => fx(x * k)))}${Mv === D.id ? '' : `, ${Mv.sh} gives ${pt(mv(Mv.m, T[0].map(x => fx(x * k))))}`}${!v[0] && !v[1] ? ', which is already' : `, and ${vec(v)} brings it to`} ${pt(T2[0])}; the other vertices follow the same way.`, { visual: gfig({ polys: [{ p: T, names: L }, { p: T2, names: primes(L) }], label: 'two similar triangles on a grid' }) }); } } },
    c: { t: 'justify AA', g: R => { const L = K.lets(R, 6), map = {}; 'ABCDEF'.split('').forEach((c, i) => map[c] = L[i]); const rn = rnSafe(map), kind = R.int(0, 3);
      if (kind === 0) { const a = R.pick([2, 4, 5, 8, 10]), k = R.pick([1.5, 2, 2.5, 3, 0.5, 4, 1.25].filter(x => Number.isInteger(x * a * 100))), b = fx(a * k);
        return E.num(rn(`In △ABC and △DEF, ∠A = ∠D and ∠B = ∠E. AB = ${a} and DE = ${b}. To prove similarity, △ABC is first dilated so that the image of AB matches DE. What scale factor is used?`), [{ label: 'k =', ans: k }], rn(`k = DE ÷ AB = ${b} ÷ ${a} = ${k}.`)); }
      if (kind === 1) return E.choice(R, rn('To prove AA, △ABC is dilated to △A′B′C′ with A′B′ = DE. Given ∠A = ∠D and ∠B = ∠E, why is △A′B′C′ ≅ △DEF?'), 'ASA', ['SAS', 'SSS', 'AAA'], rn('The dilation keeps angles, so ∠A′ = ∠D and ∠B′ = ∠E, and the side between them matches: A′B′ = DE. Angle, side, angle: ASA.'));
      if (kind === 2) return E.choice(R, rn('In the AA proof, △ABC is dilated to △A′B′C′. Why is ∠A′ = ∠A?'), 'Dilations keep angle measures.', ['Dilations keep lengths.', 'Vertical angles are equal.', 'The angles of a triangle add to 180°.'], 'A dilation changes size but not shape: every angle stays the same.');
      const lines = [rn('Given ∠A = ∠D and ∠B = ∠E.'), rn('Dilate △ABC by k = DE ÷ AB to get △A′B′C′.'), rn('A′B′ = DE.'), rn('∠A′ = ∠D and ∠B′ = ∠E, since dilations keep angles.'), rn('△A′B′C′ ≅ △DEF by ASA.'), rn('Rigid motions map △A′B′C′ onto △DEF, so a dilation then rigid motions map △ABC onto △DEF: △ABC ~ △DEF.')];
      return K.orderQ(R, rn('Prove △ABC ~ △DEF using transformations. Put the steps in order.'), lines, [[], [0], [1], [1], [2, 3], [4]], 'Dilate first so one side matches; the matched side and the two kept angles give ASA; then the congruence supplies the rigid motions. The side step and the angle step may swap.', { fixed: 1 }); } },
    d: { t: 'prove similarity this way', g: R => { const kind = R.int(0, 2), L = K.lets(R, 6), A = L.slice(0, 3), B = L.slice(3);
      if (kind === 2) { const T = gtri(R, -3, 3), k = R.pick([2, 3, -2, -1]), Mv = R.pick([D.rx, D.ry, D.r90, D.r180]), i = R.int(0, 2), q1 = T[i].map(x => x * k), q = mv(Mv.m, q1);
        return E.num(`△${A.join('')} has ${triTxt(A, T)}. It is dilated about the origin with scale factor ${sg(k)}, then ${Mv.sh.replace(/^reflect/, 'reflected').replace(/^rotate/, 'rotated')}, giving △${B.join('')}. Find ${B[i]}.`, [PF(q, `${B[i]} =`)], `Dilate: ${pt(T[i])} → ${pt(q1)}. Then use (x, y) → ${Mv.r}: → ${pt(q)}.`); }
      for (;;) { const T = gtri(R, -3, 3), k = R.pick([2, 3]), Mv = R.pick([D.id, D.rx, D.ry, D.r90]), v = [R.int(-3, 3), R.int(-3, 3)], F = cmp(tr(v), cmp(AF(Mv.m), dil(k, [0, 0]))); let T2 = T.map(p => ap(F, p));
        if (!inBox(T2, 10) || T2.some(p => T.some(q => eqP(p, q)))) continue; const s1 = [d2(T[0], T[1]), d2(T[1], T[2]), d2(T[2], T[0])];
        if (kind === 0) return E.num(`△${A.join('')} has ${triTxt(A, T)} and △${B.join('')} has ${triTxt(B, T2)}. A dilation and rigid motions map △${A.join('')} onto △${B.join('')}. What is the scale factor?`, [{ label: 'k =', ans: k }], `${A[0]}${A[1]} = ${sq(s1[0])} and ${B[0]}${B[1]} = ${sq(d2(T2[0], T2[1]))}. The ratio is ${k}; the other sides give the same ratio.`, { visual: gfig({ polys: [{ p: T, names: A }, { p: T2, names: B }], label: 'two triangles on a grid' }) });
        const yes = R.bool(); if (!yes) { T2 = T2.map(p => p.slice()); T2[R.int(0, 2)][R.int(0, 1)] += R.pick([-1, 1]); }
        const s2 = [d2(T2[0], T2[1]), d2(T2[1], T2[2]), d2(T2[2], T2[0])], ok = s2.every((x, j) => x === k * k * s1[j]); if (ok !== yes) continue;
        return yn(`△${A.join('')} has ${triTxt(A, T)}. △${B.join('')} has ${triTxt(B, T2)}. Is △${A.join('')} ~ △${B.join('')} (${A[0]}→${B[0]}, ${A[1]}→${B[1]}, ${A[2]}→${B[2]})?`, yes, `Squared sides: ${s1.join(', ')} and ${s2.join(', ')}. ${yes ? `Each ratio is ${k * k}, so every side is ${k} times as long: SSS similarity, so a dilation by ${k} and rigid motions map one onto the other.` : `The ratios ${s2.map((x, j) => E.fracStr(x, s1[j])).join(', ')} are not all equal, so no single scale factor works.`}`); } } },
  });

  /* ================= V.13.11 Transformation matrices ================= */
  const mn = v => v < 0 ? `<mrow><mo>−</mo>${mn(-v)}</mrow>` : Number.isInteger(v) ? `<mn>${v}</mn>` : `<mfrac><mn>${E.fracStr(Math.round(v * 6), 6).split('/')[0]}</mn><mn>${E.fracStr(Math.round(v * 6), 6).split('/')[1]}</mn></mfrac>`;
  const mat = rows => `<mrow><mo>[</mo><mtable>${rows.map(r => `<mtr>${r.map(v => `<mtd>${mn(v)}</mtd>`).join('')}</mtr>`).join('')}</mtable><mo>]</mo></mrow>`;
  const MX = m => `<math>${mat([[m[0], m[1]], [m[2], m[3]]])}</math>`, CV = p => `<math>${mat([[p[0]], [p[1]]])}</math>`, RV = p => `<math>${mat([[p[0], p[1]]])}</math>`;
  const mtxt = m => `[${m[0]}, ${m[1]}; ${m[2]}, ${m[3]}]`.replace(/-/g, '−');
  const DM = D4.slice(0, 7);
  S('V.13.11', 'Transformation matrices', {
    a: { t: 'points as vectors', g: R => { const p = [nz(R, -7, 7), nz(R, -7, 7)];
      if (R.bool(0.3)) { const w = Math.abs(p[0]) === Math.abs(p[1]) ? [p[0], -p[1]] : [p[1], p[0]]; return E.choice(R, `Which column vector represents the point ${pt(p)}?`, CV(p), [RV(p), CV(w), CV([-p[0], -p[1]])], `A point (x, y) becomes the column vector with x on top and y below: ${pt(p)} → x = ${p[0]}, y = ${p[1]}.`); }
      let m; do m = [R.int(-3, 3), R.int(-3, 3), R.int(-3, 3), R.int(-3, 3)]; while (m.filter(x => x).length < 2 || m.every(x => Math.abs(x) === 1 || !x));
      const q = mv(m, p);
      return E.num(`M = ${MX(m)}. Find the image of the point ${pt(p)} under M (multiply M by the column vector).`, [PF(q, 'image =')], `Row 1: ${sg(m[0])}·${sg(p[0])} + ${m[1] < 0 ? `(${sg(m[1])})` : m[1]}·${sg(p[1])} = ${q[0]}. Row 2: ${sg(m[2])}·${sg(p[0])} + ${m[3] < 0 ? `(${sg(m[3])})` : m[3]}·${sg(p[1])} = ${q[1]}. So the image is ${pt(q)}.`.replace(/(\d)·−(\d+)/g, '$1·(−$2)')); } },
    b: { t: 'reflection and rotation matrices', g: R => { const kind = R.int(0, 2), d = R.pick(DM);
      if (kind === 0) return E.choice(R, `Which matrix gives ${d.n}?`, MX(d.m), R.sample(DM.filter(x => x !== d), 3).map(x => MX(x.m)), `${d.n[0].toUpperCase() + d.n.slice(1)} sends (x, y) to ${d.r}. Its columns are the images of (1, 0) and (0, 1): ${pt([d.m[0], d.m[2]])} and ${pt([d.m[1], d.m[3]])}.`);
      if (kind === 1) return E.choice(R, `What transformation does the matrix ${MX(d.m)} give?`, d.n, R.sample(DM.filter(x => x !== d), 3).map(x => x.n), `It sends (1, 0) to ${pt([d.m[0], d.m[2]])} and (0, 1) to ${pt([d.m[1], d.m[3]])}, so (x, y) → ${d.r}: ${d.n}.`);
      let p; do p = [nz(R, -7, 7), nz(R, -7, 7)]; while (Math.abs(p[0]) === Math.abs(p[1])); const q = mv(d.m, p);
      return E.num(`Use the matrix for ${d.n} to find the image of ${pt(p)}.`, [PF(q, 'image =')], `The matrix is ${mtxt(d.m)}, which sends (x, y) to ${d.r}: ${pt(p)} → ${pt(q)}.`); } },
    c: { t: 'dilation matrices', g: R => { const kind = R.int(0, 2), k = R.pick([2, 3, 4, -2, 0.5, -1, 5]);
      if (kind === 0) { let p; do p = [nz(R, -6, 6), nz(R, -6, 6)]; while (!Number.isInteger(p[0] * k) || !Number.isInteger(p[1] * k)); const m = [k, 0, 0, k], q = mv(m, p);
        return E.num(`Find the image of ${pt(p)} under the matrix ${MX(m)}.`, [PF(q, 'image =')], `This matrix multiplies both coordinates by ${kTxt(k)}: a dilation about the origin with factor ${kTxt(k)}. ${pt(p)} → ${pt(q)}.`); }
      if (kind === 1) return E.choice(R, `Which matrix gives a dilation about the origin with scale factor ${kTxt(k)}?`, MX([k, 0, 0, k]), [MX([k, 0, 0, 1]), MX([0, k, k, 0]), MX([1, 0, 0, k])], `Both coordinates must be multiplied by ${kTxt(k)}, so ${kTxt(k)} goes on the main diagonal and 0 elsewhere.`);
      const kk = R.pick([2, 3, 4, 5, -2, -3]);
      return E.num(`A shape has area 6. What is the area of its image under ${MX([kk, 0, 0, kk])}?`, [{ label: 'area =', ans: 6 * kk * kk }], `The matrix dilates by ${sg(kk)}, so lengths are multiplied by ${Math.abs(kk)} and areas by ${Math.abs(kk)}² = ${kk * kk}: 6 × ${kk * kk} = ${6 * kk * kk}.`); } },
    d: { t: 'compose by multiplying', g: R => { let a, b; do [a, b] = R.sample(DM, 2); while (mm(b.m, a.m).join() === mm(a.m, b.m).join());
      const BA = mm(b.m, a.m), AB = mm(a.m, b.m), kind = R.int(0, 2), h = byM(BA);
      if (kind === 0) return E.choice(R, `A = ${MX(a.m)} and B = ${MX(b.m)}. Which matrix does A first, then B?`, MX(BA), [MX(AB), MX(a.m.map((x, i) => x + b.m[i])), MX(R.pick(DM.filter(d => d.m.join() !== BA.join() && d.m.join() !== AB.join())).m)], `Doing A first, then B, means B(Av) = (BA)v, so the matrix is BA = ${mtxt(BA)}. (AB = ${mtxt(AB)} is the other order.)`);
      let p; do p = [nz(R, -6, 6), nz(R, -6, 6)]; while (Math.abs(p[0]) === Math.abs(p[1]));
      if (kind === 1) { const q1 = mv(a.m, p), q = mv(b.m, q1); return E.num(`A = ${MX(a.m)} and B = ${MX(b.m)}. Find (BA)·${CV(p)}, written as a point.`, [PF(q, 'image =')], `BA means A first: A sends ${pt(p)} to ${pt(q1)}, then B sends that to ${pt(q)}. (AB would give ${pt(mv(AB, p))}.)`); }
      return E.choice(R, `A is the matrix for ${a.n} and B is the matrix for ${b.n}. What single transformation does BA give?`, h.n, [byM(AB).n, ...R.sample(DM.filter(d => d !== h && d !== byM(AB)), 2).map(d => d.n)], `BA does A first, then B: (x, y) → ${symT(a.m)} → ${symT(b.m, ...sym(a.m, 'x', 'y'))}, which is ${h.n}. BA = ${mtxt(BA)}.`); } },
  });

  /* ================= V.13.12 Tessellations ================= */
  const ia = n => 180 * (n - 2) / n;
  const PNAME = { 3: 'triangle', 4: 'square', 5: 'pentagon', 6: 'hexagon', 7: 'heptagon', 8: 'octagon', 9: 'nonagon', 10: 'decagon', 12: 'dodecagon', 15: '15-gon', 18: '18-gon', 20: '20-gon', 24: '24-gon', 42: '42-gon' };
  const RP = n => n === 3 ? 'equilateral triangle' : n === 4 ? 'square' : `regular ${PNAME[n]}`;
  const listP = ns => { const cnt = {}; ns.forEach(n => cnt[n] = (cnt[n] || 0) + 1); const parts = Object.keys(cnt).map(Number).map(n => cnt[n] === 1 ? `one ${RP(n)}` : `${cnt[n]} ${RP(n)}s`); return parts.length < 2 ? parts.join('') : parts.slice(0, -1).join(', ') + ' and ' + parts[parts.length - 1]; };
  const angSum = ns => ns.map(n => `${fx(ia(n))}°`).join(' + ');
  const tessFig = n => { const W = 240, H = 170, s = 34; let b = '';
    const poly = pts => `<polygon points="${pts.map(p => r2(p[0]) + ',' + r2(p[1])).join(' ')}" fill="${C.blue}" fill-opacity="0.12" stroke="${C.ink}" stroke-width="1.6"/>`;
    if (n === 4) for (let x = -s; x < W + s; x += s) for (let y = -s; y < H + s; y += s) b += poly([[x, y], [x + s, y], [x + s, y + s], [x, y + s]]);
    if (n === 3) { const h = s * Math.sqrt(3) / 2; for (let j = -1; j * h < H + h; j++) for (let i = -2; i * s < W + s; i++) { const x = i * s + (j % 2 ? s / 2 : 0), y = j * h; b += poly([[x, y + h], [x + s, y + h], [x + s / 2, y]]) + poly([[x + s / 2, y], [x + 1.5 * s, y], [x + s, y + h]]); } }
    if (n === 6) { const r = s * 0.62, w = r * Math.sqrt(3); for (let j = -1; j * 1.5 * r < H + r; j++) for (let i = -1; i * w < W + w; i++) { const cx = i * w + (j % 2 ? w / 2 : 0), cy = j * 1.5 * r; b += poly([...Array(6).keys()].map(k => [cx + r * Math.cos((60 * k + 30) * Math.PI / 180), cy + r * Math.sin((60 * k + 30) * Math.PI / 180)])); } }
    return V.svg(W, H, `<defs><clipPath id="ts${n}"><rect x="0" y="0" width="${W}" height="${H}" rx="8"/></clipPath></defs><g clip-path="url(#ts${n})">${b}</g>`, 'a tessellation of regular polygons'); };
  const SEMI = [[3, 3, 3, 3, 6], [3, 3, 3, 4, 4], [3, 3, 4, 3, 4], [3, 4, 6, 4], [3, 6, 3, 6], [3, 12, 12], [4, 6, 12], [4, 8, 8]];
  const BADV = [[4, 6, 8], [3, 8, 8], [4, 4, 6], [3, 6, 6], [6, 6, 8], [3, 3, 3, 3, 4], [5, 5, 6], [4, 10, 10], [3, 4, 4, 4], [4, 4, 8], [3, 3, 8, 8]];
  const YESV = [[3, 3, 3, 3, 3, 3], [4, 4, 4, 4], [6, 6, 6], [3, 12, 12], [4, 8, 8], [4, 6, 12], [3, 3, 4, 12], [3, 4, 4, 6], [3, 3, 6, 6], [3, 3, 3, 4, 4], [3, 3, 3, 3, 6], [5, 5, 10], [3, 8, 24], [3, 9, 18], [3, 10, 15], [4, 5, 20]];
  const NOV = [[5, 5, 5], [5, 5, 5, 5], [4, 6, 8], [3, 8, 8], [4, 4, 6], [3, 6, 6], [6, 6, 8], [3, 3, 3, 3, 4], [5, 5, 6], [8, 8, 8], [4, 10, 10], [3, 4, 5, 6], [5, 6, 6], [3, 3, 3, 5]];
  const sum = ns => fx(ns.reduce((s, n) => s + ia(n), 0));
  S('V.13.12', 'Tessellations', {
    a: { t: 'regular tessellations', g: R => { const kind = R.int(0, 1);
      if (kind === 0 && R.bool(0.45)) { const yes = R.bool(), n = R.pick(yes ? [3, 4, 6] : [5, 8, 9, 10, 12, 15, 18, 20]), A = ia(n);
        return yn(`Each angle of a regular polygon is ${A}°. Can copies of it alone tessellate the plane?`, yes, yes ? `Yes: 360 ÷ ${A} = ${360 / A}, a whole number, so ${360 / A} copies fit exactly around each vertex.` : `No: 360 ÷ ${A} is not a whole number, so ${Math.floor(360 / A)} copies leave a gap at a vertex and ${Math.floor(360 / A) + 1} overlap.`); }
      if (kind === 0) { const yes = R.bool(), n = R.pick(yes ? [3, 4, 6] : [5, 8, 9, 10, 12]);
        return yn(`Can ${RP(n)}s alone tessellate the plane (cover it with no gaps or overlaps)?`, yes, yes ? `Yes: each angle is ${ia(n)}°, and 360 ÷ ${ia(n)} = ${360 / ia(n)}, a whole number, so ${360 / ia(n)} fit exactly around each vertex.` : `No: each angle is ${fx(ia(n))}°, and 360 ÷ ${fx(ia(n))} is not a whole number (${Math.floor(360 / ia(n))} leave a gap, ${Math.floor(360 / ia(n)) + 1} overlap).`); }
      const n = R.pick([3, 4, 6]), pic = R.bool();
      return E.num(pic ? `This tessellation uses ${RP(n)}s. How many meet at each vertex?` : `In the regular tessellation by ${RP(n)}s, how many ${PNAME[n]}s meet at each vertex?`, [{ label: 'number =', ans: 360 / ia(n) }], `Each angle is ${ia(n)}°, and the angles at a vertex fill 360°: 360 ÷ ${ia(n)} = ${360 / ia(n)}.`, pic ? { visual: tessFig(n) } : {}); } },
    b: { t: 'semi-regular ones', g: R => { const kind = R.int(0, 2);
      if (kind === 0) { const cfg = R.pick(SEMI), types = [...new Set(cfg)], t = R.pick(types.filter(x => x !== 3 || types.length === 1 || cfg.filter(y => y === 3).length < cfg.length)), c = cfg.filter(x => x === t).length, rest = cfg.filter(x => x !== t);
        const a = (360 - sum(rest)) / c, n = Math.round(360 / (180 - a));
        return E.num(`At each vertex of a semi-regular tessellation, ${listP(rest)} meet, together with ${c === 1 ? 'one more regular polygon' : `${c} more regular polygons of one kind`}. How many sides does ${c === 1 ? 'it' : 'each'} have?`, [{ label: 'sides =', ans: n }], `The others use ${angSum(rest)} = ${sum(rest)}°, leaving ${360 - sum(rest)}°${c > 1 ? ` for ${c}, so ${fx(a)}° each` : ''}. A regular polygon with ${fx(a)}° angles has 360 ÷ (180 − ${fx(a)}) = ${n} sides.`); }
      if (kind === 1) { const good = R.pick(SEMI), bad = R.sample(BADV, 3), d = c => c.join('.');
        return E.choice(R, 'Which vertex type (polygons listed by number of sides) can appear in a tessellation by regular polygons?', d(good), bad.map(d), `${d(good)}: ${angSum(good)} = 360°. The others miss: ${bad.map(c => `${d(c)} gives ${sum(c)}°`).join(', ')}.`); }
      const cfg = R.pick(SEMI);
      return E.num(`In the semi-regular tessellation with vertex type ${cfg.join('.')}, how many polygons meet at each vertex?`, [{ label: 'number =', ans: cfg.length }], `Each number in ${cfg.join('.')} is one polygon (by its number of sides), going around the vertex: ${cfg.length} polygons. Check: ${angSum(cfg)} = 360°.`); } },
    c: { t: 'angle sum test at a vertex', g: R => { const kind = R.int(0, 2);
      if (kind === 0) { const yes = R.bool(), cfg = R.pick(yes ? YESV : NOV).slice().sort((a, b) => a - b);
        return yn(`Can ${listP(cfg)} fit exactly around a point, with no gap or overlap?`, yes, `The angles add to ${angSum(cfg)} = ${sum(cfg)}°. ${yes ? 'That is exactly 360°, so they fit.' : `That is ${sum(cfg) < 360 ? 'less' : 'more'} than 360°, so ${sum(cfg) < 360 ? 'there is a gap' : 'they overlap'}.`}`); }
      if (kind === 1) { const cfg = R.pick([[5, 5, 5], [8, 8], [4, 4, 4], [6, 6], [3, 3, 3, 3, 3], [5, 5], [10, 10], [4, 8], [6, 8], [3, 3, 8], [3, 4, 5], [5, 6], [4, 5, 6]]);
        return E.num(`${listP(cfg)[0].toUpperCase() + listP(cfg).slice(1)} are placed around a point without overlapping. What angle is left as a gap?`, [{ label: 'gap =', ans: fx(360 - sum(cfg)) }], `${angSum(cfg)} = ${sum(cfg)}°, so the gap is 360° − ${sum(cfg)}° = ${fx(360 - sum(cfg))}°.`); }
      const cfg = R.pick([[8, 8, 4], [12, 12, 3], [6, 6, 6], [10, 10, 5], [5, 5, 10], [4, 4, 4, 4], [6, 12, 4], [3, 3, 4, 12], [3, 3, 3, 3, 6], [3, 3, 6, 6], [4, 6, 12], [3, 8, 24], [4, 5, 20]]), last = cfg[cfg.length - 1], rest = cfg.slice(0, -1);
      return E.num(`${listP(rest)[0].toUpperCase() + listP(rest).slice(1)} and one more regular polygon fit exactly around a point. How many sides does it have?`, [{ label: 'sides =', ans: last }], `${angSum(rest)} = ${sum(rest)}°, leaving ${fx(360 - sum(rest))}°. A regular polygon with ${fx(ia(last))}° angles has 360 ÷ (180 − ${fx(ia(last))}) = ${last} sides.`); } },
    d: { t: 'Escher-style tiles', g: R => { const kind = R.int(0, 2), s = R.int(4, 9), a = R.int(2, 6);
      if (kind === 0) { const sh = R.pick(['square', 'rectangle']), w = sh === 'square' ? s : s + R.int(2, 4), A = s * w;
        return E.num(`${sh !== 'square' && (w === 8 || w === 11 || w === 18) ? 'An' : 'A'} ${sh === 'square' ? `square tile with sides of ${s} cm` : `${w} cm by ${s} cm rectangular tile`} has a piece of area ${a} cm² cut from its top edge, and the piece is slid down and stuck onto the bottom edge. What is the area of the new tile?`, [{ label: 'area =', ans: A }], `Nothing is lost: the ${a} cm² removed is added back, so the area stays ${sh === 'square' ? `${s}²` : `${w} × ${s}`} = ${A} cm². That is why the new tiles still fill the plane.`); }
      if (kind === 1) { const t = R.int(0, 2), vis = escherFig(t), D3 = ['a translation', 'a rotation of 90° about a corner', 'a rotation of 180° about the midpoint of a side'];
        return E.choice(R, 'A square tile was changed by cutting a piece from one edge and moving it, as shown. Which transformation moved the piece?', D3[t], D3.filter((_, i) => i !== t).concat('a reflection in a side'), ['The bump on the top is the notch from the bottom slid straight up: a translation. Tiles like this fill the plane by translations.', 'The notch on the bottom edge is turned 90° about the bottom-right corner to make the bump on the right edge.', 'Half of the bottom edge is cut and turned 180° about the middle of that edge, so the edge fits against a copy of itself turned around.'][t], { visual: vis }); }
      const opts = ['a regular pentagon', 'a square', 'a parallelogram', 'a regular hexagon'];
      return E.choice(R, 'An Escher-style tile is made by changing the sides of a polygon that already tiles the plane. Which polygon could NOT be the starting shape?', opts[0], opts.slice(1), 'Regular pentagons do not tile: three corners make 324°, four make 432°. Squares, parallelograms and regular hexagons all tile, so they can be cut and reshaped.'); } },
  });
  // a square tile whose edge has been reshaped: 0 notch slid to the opposite side, 1 turned about a corner, 2 half-edge turned about its midpoint
  const escherFig = t => { const s = 4, m = 1.4, h = 0.9; let P;
    if (t === 0) P = [[0, 0], [m - 0.6, 0], [m, h], [m + 0.6, 0], [s, 0], [s, s], [m + 0.6, s], [m, s + h], [m - 0.6, s], [0, s]];
    else if (t === 1) P = [[0, 0], [2.2, 0], [2.6 + 0.2, h], [3.2, 0], [s, 0], [s, s - 3.2], [s + h, s - 2.8], [s, s - 2.2], [s, s], [0, s]];
    else P = [[0, 0], [0.6, 0], [1, h], [1.4, 0], [2, 0], [2.6, 0], [3, -h], [3.4, 0], [s, 0], [s, s], [0, s]];
    const Q = {}; P.forEach((p, i) => Q['_' + i] = p); const ks = Object.keys(Q);
    return K.fig({ pts: Q, segs: ks.map((k, i) => [k, ks[(i + 1) % ks.length]]), polys: [[...ks, { fill: C.teal, opacity: 0.2 }]], w: 190, label: 'a reshaped square tile' }); };
})(typeof window !== 'undefined' ? window : globalThis);
