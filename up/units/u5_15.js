/* Era V · Unit V.15 Constructions (V.15.01–V.15.09)
   A student can't draw here, so every construction is made auto-checkable: put the steps in order, pick the picture of the next step,
   say what a finished construction makes, spot the wrong step, or work out a length or angle the construction produces.
   Compass arcs are drawn thin and dashed; the constructed line is blue. */
(function (G) {
  const E = G.E5, V = E.V, C = E.C, M = s => E.mx(s);
  const S = (id, name, steps) => E.skill({ id, name, steps });
  const K = E.K, { dist, add, sub, mul, unit, polar, lerp, lets } = K;

  /* ================= small helpers ================= */
  const deg = n => `${n}°`;
  const PT = s => E.pt(s);
  const U = O => (O && O.units === 'imperial' ? 'in' : 'cm');
  // exact k·√n / d, simplified
  const kSqD = (k, n, d = 1) => { let [a, b] = E.surd(k, n); const g = E.gcd(a, d); a /= g; const dd = d / g; const s = b === 1 ? String(a) : `${a === 1 ? '' : a}sqrt(${b})`; return dd === 1 ? s : `${s}/${dd}`; };
  const half = x => String(x / 2);
  const TRIP = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15], [12, 16, 20], [7, 24, 25], [15, 20, 25], [10, 24, 26], [20, 21, 29]];
  const SMALLTRIP = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [9, 12, 15], [8, 15, 17], [12, 16, 20]];
  const pickTrip = (R, list = TRIP) => { const t = R.pick(list); return R.bool() ? t : [t[1], t[0], t[2]]; };
  const twoCol = (rows, hide) => `<table class="dt"><tr><th>#</th><th>Statement</th><th>Reason</th></tr>${rows.map((r, i) => `<tr><td>${i + 1}</td><td>${r[0]}</td><td>${i === hide ? '<b>?</b>' : r[1]}</td></tr>`).join('')}</table>`;
  const numbered = lines => `<table class="dt">${lines.map((l, i) => `<tr><th>${i + 1}</th><td>${l}</td></tr>`).join('')}</table>`;
  const STEPS = n => [...Array(n).keys()].map(i => `Step ${i + 1}`);
  const LINES = n => [...Array(n).keys()].map(i => `Line ${i + 1}`);
  // the last line (the conclusion) may be left out of deps: K.orderQ makes it need everything
  const ordQ = (R, prompt, lines, deps, explain, vis) => K.orderQ(R, prompt, lines, lines.map((_, i) => deps[i] || []), explain, Object.assign({ fixed: 0 }, vis ? { visual: vis } : {}));
  // a whole-figure turn (and maybe reflection), shared by every picture in one question
  const rig = R => { const th = K.rad(R.int(0, 71) * 5), fl = R.bool(); return pts => K.xform(pts, th, fl); };
  // the two crossings of circle (A, ra) and circle (B, rb): [left of A→B, right of A→B], or null
  const cc = (A, ra, B, rb) => { const d = dist(A, B); if (d > ra + rb - 1e-9 || d < Math.abs(ra - rb) + 1e-9) return null;
    const a = (ra * ra - rb * rb + d * d) / (2 * d), h = Math.sqrt(Math.max(0, ra * ra - a * a)), u = unit(sub(B, A)), w = [-u[1], u[0]], m0 = add(A, mul(u, a));
    return [add(m0, mul(w, h)), sub(m0, mul(w, h))]; };
  const MKC = '#7D8490', BLUE = { color: C.blue, width: 2.6 }, THIN = { color: MKC, width: 1.4, dash: true };

  /* ================= the construction figure =================
     K.cfig plus compass marks. marks: [[center, toward, halfSpan°, {r}]] draws a thin dashed arc about the direction of `toward`
     (radius = distance to it unless r is given). Every name is a point in pts, so the whole picture can be turned first.
     Named points that sit on a mark get invisible stubs along it, so their labels stay off the arc. text: [[name|xy, s]]. */
  const draw = (pts, o = {}) => {
    const Pt = Object.assign({}, pts), segs = (o.segs || []).slice(), paths = [];
    (o.marks || []).forEach(([c, p, hs, op = {}], i) => {
      const C0 = Pt[c], P0 = Pt[p], r = op.r || dist(C0, P0), m = K.ang(C0, P0);
      for (let j = 0; j <= 6; j++) Pt[`_k${i}_${j}`] = add(C0, polar(r, m - hs + 2 * hs * j / 6));
      Object.keys(pts).forEach(k => { if (k[0] === '_') return; const q = pts[k]; if (Math.abs(dist(q, C0) - r) > 1e-6 || Math.abs(K.md(K.ang(C0, q) - m + 180) - 180) > hs + 1) return;
        const uu = unit(sub(q, C0)), t = [-uu[1], uu[0]], e = r * 0.22; Pt[`_z${i}${k}a`] = add(q, mul(t, e)); Pt[`_z${i}${k}b`] = sub(q, mul(t, e));
        segs.push([k, `_z${i}${k}a`, { color: 'none' }], [k, `_z${i}${k}b`, { color: 'none' }]); });
      paths.push((T, sc) => { const a = T(add(C0, polar(r, m - hs))), b = T(add(C0, polar(r, m + hs))), rs = Math.round(r * sc * 100) / 100;
        return `<path d="M${a[0]} ${a[1]} A${rs} ${rs} 0 ${hs > 90 ? 1 : 0} 0 ${b[0]} ${b[1]}" fill="none" stroke="${op.color || MKC}" stroke-width="1.5" stroke-dasharray="5 4" stroke-linecap="round"/>`; });
    });
    const text = (o.text || []).map(([p, s, op]) => [typeof p === 'string' ? Pt[p] : p, s, Object.assign({ fill: C.ink, size: 15 }, op || {})]);
    return K.cfig({ pts: Pt, segs, circ: o.circ, paths, angles: o.angles, polys: o.polys, fills: o.fills, text, w: o.w || 270, label: o.label || 'construction', center: o.center, hide: o.hide });
  };
  const show = (tf, F, w) => draw(tf(F.pts), Object.assign({}, F, w ? { w } : {}));

  /* ---------- perpendicular bisector of AB ----------
     o: {stage 1 (arcs from A) | 2 (+ arcs from B) | 3 (+ the line), rb (B's radius), err:'mid'|'par'|'tri'|'pa', M (show midpoint), extra segs} */
  const segFig = (n, L, r, o = {}) => {
    const st = o.stage ?? 3, rb = o.rb ?? r, A = [-L / 2, 0], B = [L / 2, 0], pts = { [n.A]: A, [n.B]: B }, marks = [], segs = [[n.A, n.B]];
    const X = cc(A, r, B, rb), named = X && st >= 2 && o.err !== 'mid' && rb === r, up = named ? n.P : '_b1', dn = named ? n.Q : '_b2';
    const tA = X || [add(A, polar(r, 55)), add(A, polar(r, -55))];
    pts._a1 = tA[0]; pts._a2 = tA[1]; marks.push([n.A, '_a1', 20], [n.A, '_a2', 20]);
    if (st >= 2) {
      if (o.err === 'mid') { pts._c = [0, 0]; pts._m1 = [0, r * 0.7]; pts._m2 = [0, -r * 0.7]; marks.push(['_c', '_m1', 28], ['_c', '_m2', 28]); }
      else { const tB = X || [add(B, polar(rb, 125)), add(B, polar(rb, -125))]; pts[up] = tB[0]; pts[dn] = tB[1]; marks.push([n.B, up, 20], [n.B, dn, 20]); }
    }
    if (st >= 3 && X) { const p = X[0], q = X[1]; let l1, l2;
      if (o.err === 'par') { l1 = add(p, [-L * 0.75, 0]); l2 = add(p, [L * 0.75, 0]); }
      else if (o.err === 'tri') segs.push([up, n.A, BLUE], [up, n.B, BLUE]);
      else if (o.err === 'pa') { l1 = lerp(p, A, -0.3); l2 = lerp(p, A, 1.35); }
      else { l1 = lerp(p, q, -0.3); l2 = lerp(p, q, 1.3); if (o.M) pts[n.M] = [0, 0]; }
      if (l1) { pts._l1 = l1; pts._l2 = l2; segs.push(['_l1', '_l2', BLUE]); } }
    return { pts, marks, segs: segs.concat(o.segs || []), angles: o.angles || [], label: 'perpendicular bisector construction' };
  };

  /* ---------- angle bisector of ∠BAC (A at the origin, sides at 0° and th) ----------
     o: {stage 1 (arc from A) | 2 (+ arc from X) | 3 (+ arc from Y) | 4 (+ the ray), r1, r2, ry, err:'A'|'xy'|'xz'|'off', xy (dashed XY)} */
  const angFig = (n, th, o = {}) => {
    const st = o.stage ?? 4, r1 = o.r1 ?? 2.6, h = th / 2, XY = 2 * r1 * Math.sin(K.rad(h)), r2 = o.r2 ?? Math.max(XY * 0.72, r1 * 0.85), ry = o.ry ?? r2;
    const pts = { [n.A]: [0, 0], [n.B]: polar(5.2, 0), [n.C]: polar(5.2, th) }, segs = [[n.A, n.B], [n.A, n.C]], marks = [];
    const X = polar(r1, 0), Y = polar(r1, th), far = I => I && (dist(I[0], [0, 0]) > dist(I[1], [0, 0]) ? I[0] : I[1]);
    const Zc = far(cc(X, r2, Y, r2)), Zy = far(cc(X, r2, Y, ry));
    if (st >= 1) { pts[n.X] = X; pts[n.Y] = Y; pts._am = polar(r1, h); marks.push([n.A, '_am', h + 12]); }
    if (st >= 2) { pts._xz = Zc; marks.push([n.X, '_xz', ry === r2 ? 18 : 30]); }
    if (st >= 3) {
      if (o.err === 'A') { pts._aa = polar(r1 * 1.75, h); marks.push([n.A, '_aa', h + 8]); }
      else if (ry === r2) { pts[n.Z] = Zc; marks.push([n.Y, n.Z, 18]); }
      else { pts._yz = Zy || add(Y, mul(unit(sub(polar(r1 * 2, h), Y)), ry)); marks.push([n.Y, '_yz', 18]); }
    }
    if (st >= 4) { let a, b;
      if (o.err === 'xy') { a = X; b = Y; } else if (o.err === 'xz') { a = X; b = lerp(X, Zc, 1.9); } else if (o.err === 'off') { a = [0, 0]; b = polar(5.6, th * 0.27); } else { a = [0, 0]; b = mul(unit(Zc), 5.8); }
      pts._r1 = a; pts._r2 = b; segs.push(['_r1', '_r2', BLUE]); }
    if (o.xy) segs.push([n.X, n.Y, THIN]);
    return { pts, marks, segs, angles: o.angles || [], label: 'angle bisector construction' };
  };

  /* ---------- copy ∠BAC onto ray PQ ----------
     n: {A,B,C,P,Q,X,Y}; X′ and Y′ are n.X+'′', n.Y+'′'. o: {stage 0–4, rp (radius at P), cP (center of the 2nd arc: 'P'|'Q'), r3, c3 ('X′'|'P'|'Q'), ray:'ok'|'xy'|'off'|'q'} */
  const copyFig = (n, th, o = {}) => {
    const st = o.stage ?? 4, r1 = o.r1 ?? 2.3, XY = 2 * r1 * Math.sin(K.rad(th / 2)), Pp = [5.5, -5.5], Xp = n.X + '′', Yp = n.Y + '′';
    const pts = { [n.A]: [0, 0], [n.B]: polar(4.2, 0), [n.C]: polar(4.2, th), [n.P]: Pp, [n.Q]: add(Pp, [4.2, 0]) }, segs = [[n.A, n.B], [n.A, n.C], [n.P, n.Q]], marks = [];
    const rp = o.rp ?? r1, c2 = o.cP === 'Q' ? n.Q : n.P, r3 = o.r3 ?? XY;
    if (st >= 1) { pts[n.X] = polar(r1, 0); pts[n.Y] = polar(r1, th); pts._am = polar(r1, th / 2); marks.push([n.A, '_am', th / 2 + 12]); }
    if (st >= 2) { if (c2 === n.P) { pts[Xp] = add(Pp, [rp, 0]); pts._pm = add(Pp, polar(rp, th / 2 + 6)); marks.push([n.P, '_pm', th / 2 + 18]); }
      else { pts._qm = add(pts[n.Q], polar(r1, 180 - th / 2)); marks.push([n.Q, '_qm', th / 2 + 18]); } }
    const Yc = add(Pp, polar(r1, th));
    if (st >= 3) { const c3 = o.c3 || Xp;
      if (c3 === Xp) { const I = cc(Pp, rp, pts[Xp], r3), Yq = I ? I[0] : add(pts[Xp], polar(r3, 100)); if (o.r3 === undefined && rp === r1) pts[Yp] = Yq; else pts._y3 = Yq; marks.push([Xp, o.r3 === undefined && rp === r1 ? Yp : '_y3', 16]); }
      else { const cen = c3 === 'P' ? Pp : pts[n.Q], tg = add(cen, polar(r3, c3 === 'P' ? th + 10 : 150)); pts._y3 = tg; marks.push([c3 === 'P' ? n.P : n.Q, '_y3', 18]); } }
    if (st >= 4) { const ray = o.ray || 'ok'; let a, b;
      if (ray === 'xy') { a = pts[Xp]; b = lerp(pts[Xp], Yc, 2.6); } else if (ray === 'off') { a = Pp; b = add(Pp, polar(4.6, th * 0.55)); } else if (ray === 'q') { a = pts[n.Q]; b = lerp(pts[n.Q], Yc, 1.5); } else { a = Pp; b = add(Pp, polar(4.6, th)); }
      pts._s1 = a; pts._s2 = b; segs.push(['_s1', '_s2', BLUE]); }
    return { pts, marks, segs, angles: o.angles || [], label: 'copying an angle', XY };
  };

  /* ---------- perpendicular to ℓ through P ----------
     on line: P at the origin, A and B at ±a, Q at height from arcs of radius s.  off line: P at (0,d), arc of radius r cuts ℓ at A, B; Q below ℓ from arcs of radius s. */
  const perpFig = (n, o) => {
    const on = o.on, st = o.stage ?? 3, pts = {}, marks = [], segs = [], a = on ? o.a : Math.sqrt(o.r * o.r - o.d * o.d), ext = Math.max(a + 2, 3.2);
    pts._e1 = [-ext, 0]; pts._e2 = [ext, 0]; pts._lt = [ext + 0.1, 0.55]; segs.push(['_e1', '_e2']);
    pts[n.P] = on ? [0, 0] : [0, o.d]; if (st >= 1 || on) { pts[n.A] = [-a, 0]; pts[n.B] = [a, 0]; }
    if (st >= 1) { if (on) marks.push([n.P, n.A, 16], [n.P, n.B, 16]); else marks.push([n.P, n.A, 11], [n.P, n.B, 11]); }
    const s = o.s, qy = Math.sqrt(s * s - a * a) * (on ? 1 : -1);
    if (st >= 2) { pts[n.Q] = [0, qy]; marks.push([n.A, n.Q, 17], [n.B, n.Q, 17]); }
    if (st >= 3) { const top = on ? qy + 1.1 : o.d + 1, bot = on ? -1.4 : qy - 1; pts._p1 = [0, top]; pts._p2 = [0, bot]; segs.push(['_p1', '_p2', BLUE]); if (o.M && !on) pts[n.M] = [0, 0]; }
    return { pts, marks, segs: segs.concat(o.segs || []), angles: o.angles || [], text: [['_lt', 'ℓ', { size: 16 }]], label: 'perpendicular construction' };
  };

  /* ---------- parallel to ℓ through P by copying a corresponding angle ----------
     ℓ is the x-axis, the transversal leaves A at angle th and passes through P. dir: direction of the drawn line through P (0 = correct). */
  const parFig = (n, th, o = {}) => {
    const st = o.stage ?? 2, dP = 3.4, r = 1.3, Pp = polar(dP, th), pts = { [n.A]: [0, 0], [n.P]: Pp }, marks = [], segs = [];
    pts._e1 = [-3.4, 0]; pts._e2 = [4.6, 0]; pts._lt = [4.8, 0.5]; pts._t1 = polar(-1.6, th); pts._t2 = polar(dP + 2, th); segs.push(['_e1', '_e2'], ['_t1', '_t2']);
    if (st >= 1) { pts._x = [r, 0]; pts._y = polar(r, th); pts._am = polar(r, th / 2); marks.push([n.A, '_am', th / 2 + 12]);
      pts._yp = add(Pp, polar(r, th)); pts._xp = add(Pp, [r, 0]); pts._pm = add(Pp, polar(r, th / 2)); marks.push([n.P, '_pm', th / 2 + 12]); marks.push(['_yp', '_xp', 14]); }
    if (st >= 2) { const dir = o.dir ?? 0; pts._n1 = add(Pp, polar(-3.4, dir)); pts._n2 = add(Pp, polar(4.2, dir)); segs.push(['_n1', '_n2', BLUE]); }
    return { pts, marks, segs, angles: o.angles || [], text: [['_lt', 'ℓ', { size: 16 }]], label: 'parallel line construction' };
  };

  /* ---------- stepping the radius around a circle ---------- */
  const hexFig = (H, Oc, r, o = {}) => {
    const k = o.steps ?? 6, pts = { [Oc]: [0, 0] }, marks = [], segs = [], tilt = o.tilt || 0;
    for (let i = 0; i < 6; i++) { const nm = i <= k && (!o.show || o.show.includes(i)) ? H[i] : `_h${i}`; pts[nm] = polar(r, tilt + 60 * i); }
    const nmOf = i => Object.keys(pts).find(q => q === H[i % 6] || q === `_h${i % 6}`);
    for (let i = 1; i <= k; i++) marks.push([nmOf(i - 1), nmOf(i % 6), 16]);
    if (o.join === 'hex') for (let i = 0; i < 6; i++) segs.push([nmOf(i), nmOf(i + 1), BLUE]);
    if (o.join === 'tri') for (let i = 0; i < 6; i += 2) segs.push([nmOf(i), nmOf(i + 2), BLUE]);
    return { pts, marks, segs: segs.concat(o.segs || []), circ: [{ c: Oc, r }], angles: o.angles || [], polys: o.polys, label: 'circle with the radius stepped around it', nmOf };
  };

  /* ---------- square in a circle: diameter AB, perpendicular bisector arcs, diameter CD at angle t ---------- */
  const sqFig = (n, r, o = {}) => {
    const t = o.t ?? 90, pts = { [n.O]: [0, 0], [n.A]: [-r, 0], [n.B]: [r, 0] }, marks = [], segs = [[n.A, n.B]];
    if (o.arcs) { const s = 1.45 * r, X = cc([-r, 0], s, [r, 0], s); pts._p = X[0]; pts._q = X[1]; marks.push([n.A, '_p', 13], [n.A, '_q', 13], [n.B, '_p', 13], [n.B, '_q', 13]); }
    if (o.stage === undefined || o.stage >= 2) { pts[n.C] = polar(r, t); pts[n.D] = polar(r, t + 180); if (o.arcs) { pts._l1 = lerp(pts._p, pts._q, -0.12); pts._l2 = lerp(pts._p, pts._q, 1.12); segs.push(['_l1', '_l2', THIN]); }
      segs.push([n.C, n.D]); if (o.join) segs.push([n.A, n.C, BLUE], [n.C, n.B, BLUE], [n.B, n.D, BLUE], [n.D, n.A, BLUE]); }
    return { pts, marks, segs, circ: [{ c: n.O, r }], angles: o.angles || [], label: 'square construction in a circle' };
  };

  /* ---------- tangents from P: O at the origin, P at (d,0) ---------- */
  const tanFig = (n, r, d, o = {}) => {
    const st = o.stage ?? 3, pts = { [n.O]: [0, 0], [n.P]: [d, 0] }, segs = [[n.O, n.P, { width: 1.8 }]], marks = [], circ = [{ c: n.O, r }], angles = [];
    const c = r / d, s = Math.sqrt(1 - c * c);
    if (st >= 1) { pts[n.M] = [d / 2, 0]; if (o.bis) { const rr = 0.68 * d, X = cc([0, 0], rr, [d, 0], rr); pts._u = X[0]; pts._v = X[1]; marks.push([n.O, '_u', 13], [n.O, '_v', 13], [n.P, '_u', 13], [n.P, '_v', 13]); } }
    if (st >= 2) { circ.push({ c: n.M, r: d / 2, dash: true, color: MKC }); pts[n.T] = [r * c, r * s]; if (!o.one) pts[n.U] = [r * c, -r * s]; }
    if (st >= 3) { pts._t = lerp([d, 0], pts[n.T], 1.3); segs.push([n.P, '_t', BLUE]); if (!o.one) { pts._w = lerp([d, 0], pts[n.U], 1.3); segs.push([n.P, '_w', BLUE]); }
      if (o.radii) { segs.push([n.O, n.T, THIN]); angles.push([n.O, n.T, n.P, '', { right: true }]); if (!o.one) segs.push([n.O, n.U, THIN]); } }
    return { pts, marks, segs: segs.concat(o.segs || []), circ, angles: angles.concat(o.angles || []), label: 'tangents from a point to a circle' };
  };

  /* ================= V.15.01 Copy a segment & an angle ================= */
  const segCopyFig = (n, a, tilt, k) => {
    const y0 = 0.45 * a + 1.6, pts = { [n.A]: [0, y0], [n.C]: [0, 0] }; pts[n.B] = add(pts[n.A], polar(a, tilt));
    const segs = [[n.A, n.B]], marks = []; pts._r = [k * a + 1.5, 0]; segs.push([n.C, '_r']);
    for (let i = 1; i <= k; i++) { pts[n.ds[i - 1]] = [i * a, 0]; marks.push([i === 1 ? n.C : n.ds[i - 2], n.ds[i - 1], 16]); }
    return { pts, segs, marks, label: 'copying a segment with a compass' };
  };
  const CS_T = [['Every point on an arc drawn with center C is the same distance from C.', 'All its points are one radius from the center: that is what lets a compass carry a length.'],
    ['A compass can copy a length without reading any numbers on a ruler.', 'Open it to the length, then move it: the opening carries the length.'],
    ['Two arcs drawn without changing the compass have equal radii.', 'The opening is the radius, so an unchanged opening gives equal radii.'],
    ['To carry the length of segment AB, open the compass from A to B.', 'The compass point goes on one end and the pencil on the other.']];
  const CS_F = [['Points near the ends of a compass arc are farther from its center than the middle of the arc.', 'Every point of the arc is exactly one radius from the center.'],
    ['To copy a segment, you must first measure it with a ruler.', 'A construction never measures: the compass carries the length.'],
    ['After setting the compass to AB, opening it a little wider still copies AB exactly.', 'Any change of the opening changes the radius, so the copy is no longer AB.'],
    ['A copy of segment AB must be drawn parallel to AB.', 'The copy can point any way; only its length must match.']];
  const angWords = (A, B, Cn) => `∠${B}${A}${Cn}`;
  S('V.15.01', 'Copy a segment & an angle', {
    a: { t: 'compass as a length carrier', g: (R, O) => {
      const u = U(O), mode = R.pick([0, 0, 1, 1, 2]);
      if (mode === 2) { const yes = R.bool(), [s, w] = R.pick(yes ? CS_T : CS_F); return E.tf(`True or false? ${s}`, yes, w); }
      const [A, B, Cn, D, Ee, F] = lets(R, 6), a = R.int(3, 9) + (R.bool(0.3) ? 0.5 : 0), k = mode === 0 ? 1 : R.int(2, 3), tf = rig(R);
      const vis = show(tf, segCopyFig({ A, B, C: Cn, ds: [D, Ee, F] }, a, R.int(-15, 25), k));
      if (k === 1) return E.num(`${A}${B} = ${a} ${u}. The compass is opened from ${A} to ${B}. Without changing it, an arc centered at ${Cn} crosses the ray at ${D}. How long is ${Cn}${D}?`, [{ label: `${Cn}${D} =`, ans: a }],
        `${Cn}${D} is a radius of the same compass opening, so ${Cn}${D} = ${A}${B} = ${a} ${u}.`, { visual: vis });
      const ds = [D, Ee, F].slice(0, k), last = ds[k - 1], marks = ds.map((p, i) => `${p} from ${i ? ds[i - 1] : Cn}`).join(', then ');
      return E.num(`${A}${B} = ${a} ${u}. With the compass set to ${A}${B}, arcs along the ray mark ${marks}. How long is ${Cn}${last}?`, [{ label: `${Cn}${last} =`, ans: k * a }],
        `Each arc lays off one more copy of ${A}${B}, so ${Cn}${last} = ${k} × ${a} = ${k * a} ${u}.`, { visual: vis }); } },
    b: { t: 'copy a segment', g: (R, O) => {
      const u = U(O), mode = R.pick([0, 0, 1, 1, 2]), [A, B, Cn, D, P, Q, Rr] = lets(R, 7);
      if (mode === 0) {
        if (R.bool()) return ordQ(R, `Put the steps for copying ${A}${B} onto a ray from ${Cn} in order.`,
          [`Draw a ray from ${Cn}.`, `Put the compass point on ${A} and open it to ${B}.`, `Without changing the width, put the compass point on ${Cn} and draw an arc across the ray.`, `Label the crossing ${D}. Then ${Cn}${D} = ${A}${B}.`],
          [[], [], [0, 1], []], `The ray and the compass setting can come in either order; the arc from ${Cn} needs both, and the crossing gives ${D}.`);
        return ordQ(R, `Put the steps for constructing a segment of length ${A}${B} + ${Cn}${D} in order.`,
          [`Draw a ray from ${P}.`, `Set the compass to ${A}${B}.`, `With center ${P}, draw an arc across the ray at ${Q}.`, `Set the compass to ${Cn}${D}.`, `With center ${Q}, draw an arc across the ray beyond ${Q}, at ${Rr}.`, `Then ${P}${Rr} = ${A}${B} + ${Cn}${D}.`],
          [[], [], [0, 1], [2], [3]], `Use the width ${A}${B} before resetting the compass to ${Cn}${D}; the second copy starts at ${Q} and runs on past it.`);
      }
      if (mode === 1) { let a, b; do { a = R.int(3, 11); b = R.int(2, 9); } while (a <= b + 1); const k = R.int(0, 3);
        const txt = [`From ${P}, copy ${A}${B} along a ray to get ${Q}. Then copy ${Cn}${D} from ${Q}, going on past ${Q}, to get ${Rr}.`,
          `From ${P}, copy ${A}${B} along a ray to get ${Q}. Then copy ${Cn}${D} from ${Q} back toward ${P} to get ${Rr}.`,
          `From ${P}, copy ${A}${B} twice, end to end, along a ray. Then copy ${Cn}${D} back from the far end to get ${Rr}.`,
          `From ${P}, copy ${A}${B} along a ray, then copy ${Cn}${D} twice more beyond it, end to end, to get ${Rr}.`][k];
        const ans = [a + b, a - b, 2 * a - b, a + 2 * b][k], w = [`${a} + ${b}`, `${a} − ${b}`, `2 × ${a} − ${b}`, `${a} + 2 × ${b}`][k];
        return E.num(`${A}${B} = ${a} ${u} and ${Cn}${D} = ${b} ${u}. ${txt} How long is ${P}${Rr}?`, [{ label: `${P}${Rr} =`, ans }], `Copies add going forward and subtract going back: ${P}${Rr} = ${w} = ${ans} ${u}.`); }
      const L0 = [`Draw a ray from ${Cn}.`, `Put the compass point on ${A} and open it to ${B}.`, `Without changing the width, put the compass point on ${Cn} and draw an arc across the ray.`, `Label the crossing ${D}. Then ${Cn}${D} = ${A}${B}.`];
      const W = [[`Measure ${A}${B} with the ruler's markings, then mark the same length from ${Cn}.`, `A construction carries lengths with the compass; it never measures with ruler markings.`],
        [`Put the compass point on ${A} and open it to ${Cn}.`, `The compass must span the segment being copied, from ${A} to ${B}.`],
        [`Open the compass a little wider, put its point on ${Cn} and draw an arc across the ray.`, `Changing the width changes the radius, so ${Cn}${D} would no longer equal ${A}${B}.`],
        [`Label the crossing ${D}. Then ${Cn}${D} is twice ${A}${B}.`, `${Cn}${D} is one radius of the same opening, so it equals ${A}${B}, not twice it.`]];
      const j = R.int(0, 3), L = L0.slice(); L[j] = W[j][0];
      return E.choiceFixed(`Someone copies ${A}${B} onto a ray from ${Cn}. Which step is wrong?${numbered(L)}`, STEPS(4), j, `Step ${j + 1} is wrong. ${W[j][1]}`); } },
    c: { t: 'copy an angle', g: R => {
      const mode = R.pick([0, 0, 1, 2, 2, 3]), [A, B, Cn, P, Q, X, Y] = lets(R, 7), Xp = X + '′', Yp = Y + '′', nm = { A, B, C: Cn, P, Q, X, Y };
      let th; do { th = R.int(30, 125); } while (th > 52 && th < 68);
      const tf = rig(R), aA = angWords(A, B, Cn);
      const STEP = [`Draw ray ${P}${Q}.`, `With center ${A}, draw an arc crossing ${A}${B} at ${X} and ${A}${Cn} at ${Y}.`, `With the same width and center ${P}, draw an arc crossing ${P}${Q} at ${Xp}.`,
        `Set the compass to the length ${X}${Y}.`, `With center ${Xp}, draw an arc crossing the arc centered at ${P}, at ${Yp}.`, `Draw ray ${P}${Yp}. Then ∠${Q}${P}${Yp} = ${aA}.`];
      if (mode === 0) return ordQ(R, `Put the steps for copying ${aA} onto ray ${P}${Q} in order.`, STEP, [[], [], [0, 1], [2], [3]],
        `The ray and the first arc can come in either order. The arc at ${P} must reuse the first width before the compass is reset to ${X}${Y}; then the arc from ${Xp} fixes ${Yp}.`, show(tf, copyFig(nm, th)));
      if (mode === 1) { const j = R.pick([1, 2, 3, 4, 5]), L = STEP.slice();
        const W = { 1: [`With center ${B}, draw an arc crossing ${A}${B} at ${X} and ${A}${Cn} at ${Y}.`, `The first arc must be centered at the vertex ${A}, so it cuts both sides at the same distance from ${A}.`],
          2: [`With a wider compass and center ${P}, draw an arc crossing ${P}${Q} at ${Xp}.`, `The arc at ${P} must use the same width as the arc at ${A}; a different width spoils the copy.`],
          3: [`Set the compass to the length ${A}${B}.`, `The third arc must have radius ${X}${Y}, the distance between the points on the first arc.`],
          4: [`With center ${P}, draw an arc crossing the arc centered at ${P}, at ${Yp}.`, `Two arcs centered at ${P} never cross. The arc must be centered at ${Xp}.`],
          5: [`Draw ray ${Xp}${Yp}. Then ∠${Q}${P}${Yp} = ${aA}.`, `The new side must start at the vertex ${P}, so it is ray ${P}${Yp}.`] };
        L[j] = W[j][0]; return E.choiceFixed(`Someone copies ${aA} onto ray ${P}${Q}. Which step is wrong?${numbered(L)}`, STEPS(6), j, `Step ${j + 1} is wrong. ${W[j][1]}`); }
      if (mode === 2) { const s = R.int(1, 3), base = { stage: s }, opts = { 2: [{}, { rp: 1.4 }, { rp: 3.4 }, { cP: 'Q' }], 3: [{}, { r3: 2.3, c3: Xp }, { r3: 1.7, c3: 'P' }, { r3: 1.9, c3: 'Q' }], 4: [{}, { ray: 'xy' }, { ray: 'off' }, { ray: 'q' }] }[s + 1];
        if (s + 1 === 3) opts[1].r3 = Math.abs(copyFig(nm, th).XY - 2.3) < 0.5 ? 3.3 : 2.3;
        const pics = opts.map(op => show(tf, copyFig(nm, th, Object.assign({}, op, { stage: s + 1 })), 190));
        const why = { 2: `Keep the first width and center the arc at ${P}, so it cuts ${P}${Q} at the same distance ${A}${X}.`, 3: `Set the compass to ${X}${Y} and center the arc at ${Xp}.`, 4: `The new side starts at ${P} and passes through ${Yp}.` }[s + 1];
        return E.choice(R, `This is the copy of ${aA} so far. Which picture shows the next step?`, pics[0], pics.slice(1), why, { visual: show(tf, copyFig(nm, th, base)) }); }
      let a, b; do { a = R.int(30, 100); b = R.int(15, 70); } while (a - b < 12 || a + b > 170); const k = R.int(0, 2);
      const txt = [`Copy ∠1 onto ray ${P}${Q}, then copy ∠2 on the new side, outside the first copy.`, `Copy ∠1 onto ray ${P}${Q}, then copy ∠2 on ray ${P}${Q} too, inside the first copy.`, `Copy ∠1 onto ray ${P}${Q}, then copy ∠1 again on the new side, outside the first copy.`][k];
      const ans = [a + b, a - b, 2 * a][k], w = [`${a}° + ${b}°`, `${a}° − ${b}°`, `${a}° + ${a}°`][k];
      return E.num(`∠1 = ${a}° and ∠2 = ${b}°. ${txt} What angle lies between ray ${P}${Q} and the last side drawn?`, [{ ans }], `Copied angles placed side by side add; one copied inside another leaves the difference: ${w} = ${ans}°.`); } },
    d: { t: 'justify with SSS', g: R => {
      const mode = R.pick([0, 1, 2, 2, 3, 3]), [A, B, Cn, P, Q, X, Y] = lets(R, 7), Xp = X + '′', Yp = Y + '′', nm = { A, B, C: Cn, P, Q, X, Y }, tf = rig(R);
      const t1 = `△${A}${X}${Y}`, t2 = `△${P}${Xp}${Yp}`;
      if (mode === 0) { let th; do { th = R.int(30, 125); } while (th > 52 && th < 68); const vis = show(tf, copyFig(nm, th, { angles: [] }));
        if (R.bool()) return E.choice(R, `In this copy of ∠${A}, ${X}, ${Y}, ${Xp} and ${Yp} are where the arcs cross. Why is ${t1} ≅ ${t2}?`, 'SSS', ['SAS', 'ASA', 'AAS'],
          `${A}${X} = ${P}${Xp} and ${A}${Y} = ${P}${Yp} (same compass width), and ${X}${Y} = ${Xp}${Yp} (compass set to ${X}${Y}): three pairs of sides, so SSS. SAS would need the angle, which is what we want to prove.`, { visual: vis });
        return E.choice(R, `In this copy of ∠${A}, why is ∠${Xp}${P}${Yp} = ∠${X}${A}${Y}?`, `${t1} ≅ ${t2} by SSS, so their matching angles are equal.`,
          [`${t1} ≅ ${t2} by SAS, so their matching angles are equal.`, `Both angles are cut by arcs of the same radius.`, `The two angles are vertical angles.`],
          `The construction makes three pairs of equal sides, so the triangles are congruent by SSS, and corresponding parts are equal. (SAS would assume the angle.)`, { visual: vis }); }
      if (mode === 1) { const first = R.bool(), ok = first ? (R.bool() ? `${A}${X} = ${P}${Xp}` : `${A}${Y} = ${P}${Yp}`) : `${X}${Y} = ${Xp}${Yp}`;
        const wr = first ? [`${X}${Y} = ${Xp}${Yp}`, `${A}${X} = ${X}${Y}`, `${P}${Xp} = ${Xp}${Yp}`] : [`${A}${X} = ${P}${Xp}`, `${A}${X} = ${X}${Y}`, `${P}${Yp} = ${Xp}${Yp}`];
        return E.choice(R, `In copying ∠${A} onto ray ${P}${Q}, which pair of lengths is equal because ${first ? `the arcs at ${A} and at ${P} use the same width` : `the compass is set to ${X}${Y} for the last arc`}?`, ok, wr,
          first ? `The arcs at ${A} and ${P} have one radius, so ${A}${X} = ${A}${Y} = ${P}${Xp} = ${P}${Yp}.` : `The last arc, centered at ${Xp}, has radius ${X}${Y}, so ${Xp}${Yp} = ${X}${Y}.`); }
      if (mode === 2) return ordQ(R, `Put the lines of the proof that the copied angle is correct in order.`,
        [`${A}${X} = ${P}${Xp} <i>(same compass width)</i>`, `${A}${Y} = ${P}${Yp} <i>(same compass width)</i>`, `${X}${Y} = ${Xp}${Yp} <i>(compass set to ${X}${Y})</i>`, `${t1} ≅ ${t2} <i>(SSS)</i>`, `∠${X}${A}${Y} = ∠${Xp}${P}${Yp} <i>(CPCTC)</i>`],
        [[], [], [], [0, 1, 2], [3]], `The three side pairs can come in any order; SSS needs all three, and the equal angles come from the congruent triangles.`);
      const r = R.int(3, 9), s = R.int(2, 2 * r - 2), th = Math.round(2 * K.dg(Math.asin(s / (2 * r)))), vis = show(tf, copyFig(nm, th)), k = R.int(0, 2);
      const ask = [`${P}${Yp}`, `${Xp}${Yp}`, `the perimeter of ${t2}`][k], ans = [r, s, 2 * r + s][k];
      return E.num(`In this copy of ∠${A}, the first arc has radius ${A}${X} = ${r} and ${X}${Y} = ${s}. Find ${ask}.`, [{ ans }],
        [`${P}${Yp} is a radius of the arc at ${P}, which uses the first width: ${r}.`, `${Xp}${Yp} was drawn with the compass set to ${X}${Y}: ${s}.`, `${t2} ≅ ${t1} (SSS), so its perimeter is ${r} + ${r} + ${s} = ${2 * r + s}.`][k], { visual: vis }); } },
  });

  /* ================= V.15.02 Bisect a segment ================= */
  const pbProof = (n, rsn1 = 'same compass width', rsn2 = 'same compass width') => [
    [`${n.P}${n.A} = ${n.P}${n.B}`, rsn1, []], [`${n.Q}${n.A} = ${n.Q}${n.B}`, rsn2, []], [`${n.P}${n.Q} = ${n.P}${n.Q}`, 'shared side', []],
    [`△${n.A}${n.P}${n.Q} ≅ △${n.B}${n.P}${n.Q}`, 'SSS', [0, 1, 2]], [`∠${n.A}${n.P}${n.M} = ∠${n.B}${n.P}${n.M}`, 'CPCTC', [3]],
    [`△${n.A}${n.P}${n.M} ≅ △${n.B}${n.P}${n.M}`, `SAS, with ${n.P}${n.M} shared`, [0, 4]], [`${n.A}${n.M} = ${n.B}${n.M} and ∠${n.A}${n.M}${n.P} = ∠${n.B}${n.M}${n.P} = 90°`, 'CPCTC; equal angles in a linear pair', []]];
  const PBWRONG = { 'same compass width': ['shared side', 'CPCTC', 'vertical angles'], 'shared side': ['same compass width', 'CPCTC', 'vertical angles'], SSS: ['SAS', 'ASA', 'SSA'], CPCTC: ['SSS', 'vertical angles', 'same compass width'],
    'one arc from P': ['equal arcs from A and B', 'shared side', 'CPCTC'], 'equal arcs from A and B': ['one arc from P', 'shared side', 'SSS'] };
  const pbPick = (R, L, head, vis, map = {}) => { const j = R.pick([0, 1, 2, 3, 4, 5].filter(i => L.filter(l => l[1].includes(L[i][1])).length === 1)), cor = L[j][1], key = cor.startsWith('SAS') ? 'SAS' : cor;
    const wr = key === 'SAS' ? ['SSS', 'ASA', 'SSA'] : PBWRONG[map[cor] || cor].map(w => Object.keys(map).find(k => map[k] === w) || w);
    const why = { 0: 'Both points lie on arcs of one radius from the same centers.', 1: 'Both points lie on arcs of one radius from the same centers.', 2: 'A side shared by two triangles equals itself.', 3: 'Three pairs of equal sides make the triangles congruent by SSS.', 4: 'Corresponding parts of congruent triangles are congruent.', 5: 'Two sides and the included angle match (SAS). SSS is not available yet, since the halves of the segment are what we are proving equal.' }[j];
    return E.choice(R, `${head} What is the missing reason?${twoCol(L.map(l => [l[0], l[1]]), j)}`, cor, wr, why, vis ? { visual: vis } : {}); };
  S('V.15.02', 'Bisect a segment', {
    a: { t: 'two arcs', g: (R, O) => {
      const u = U(O), mode = R.pick([0, 0, 0, 1, 2]), [A, B, P, Q] = lets(R, 4);
      if (mode === 0) { const L = R.int(4, 14), yes = R.bool(); let r; do { r = yes ? L / 2 + R.int(1, 5) * 0.5 : L / 2 - R.int(1, 4) * 0.5; } while (r < 1);
        return E.choiceFixed(`${A}${B} = ${L} ${u}. With the compass opened to ${r} ${u}, you draw arcs centered at ${A} and at ${B}. Do the arcs meet?`, ['Yes', 'No'], yes ? 0 : 1,
          yes ? `Half of ${A}${B} is ${L / 2} ${u}. ${r} ${u} is more than that, so each arc reaches past the middle and they cross.` : `Half of ${A}${B} is ${L / 2} ${u}. ${r} ${u} is less than that, so each arc stops short of the middle and they never meet.`); }
      if (mode === 2) { const L = R.int(5, 19); return E.num(`${A}${B} = ${L} ${u}. To bisect it, you draw arcs of equal radius centered at ${A} and ${B}. The radius must be more than what length for the arcs to meet?`, [{ ans: L / 2 }],
        `Each arc has to reach past the midpoint, so the radius must be more than half of ${A}${B}: ${L} ÷ 2 = ${L / 2} ${u}.`); }
      const L = R.int(6, 14), r = Math.round((L / 2 + R.int(1, 5)) * 2) / 2, k = R.int(0, 2), tf = rig(R);
      const vis = show(tf, segFig({ A, B, P, Q }, L, r, { stage: 2, segs: [[A, P, THIN], [B, P, THIN]] }));
      const ask = [`${P}${B}`, `${Q}${A}`, `the perimeter of ${A}${P}${B}${Q}`][k], ans = [r, r, 4 * r][k];
      return E.num(`${A}${B} = ${L} ${u}. Arcs of radius ${r} ${u} centered at ${A} and ${B} cross at ${P} and ${Q}. Find ${ask}.`, [{ ans }],
        k < 2 ? `${ask} is a radius of one of the arcs, so it is ${r} ${u}.` : `All four sides are radii of the same width: 4 × ${r} = ${4 * r} ${u}.`, { visual: vis }); } },
    b: { t: 'draw the bisector', g: (R, O) => {
      const u = U(O), mode = R.pick([0, 1, 2, 2, 3, 3, 4]), [A, B, P, Q, Mn] = lets(R, 5), nm = { A, B, P, Q, M: Mn }, tf = rig(R);
      if (mode === 0) { const L = 2 * R.int(3, 12) + (R.bool(0.3) ? 1 : 0), r = L / 2 + R.int(1, 4), back = R.bool(0.4), vis = show(tf, segFig(nm, L, r, { M: true }));
        if (back) return E.num(`Line ${P}${Q} is constructed from equal arcs centered at ${A} and ${B}. It meets ${A}${B} at ${Mn}, and ${Mn}${B} = ${L / 2} ${u}. Find ${A}${B}.`, [{ label: `${A}${B} =`, ans: L }], `${Mn} is the midpoint, so ${A}${B} = 2 × ${L / 2} = ${L} ${u}.`, { visual: vis });
        return E.num(`Line ${P}${Q} is constructed from equal arcs centered at ${A} and ${B}. It meets ${A}${B} at ${Mn}, and ${A}${B} = ${L} ${u}. Find ${A}${Mn}.`, [{ label: `${A}${Mn} =`, ans: L / 2 }], `The construction finds the midpoint, so ${A}${Mn} = ${L} ÷ 2 = ${L / 2} ${u}.`, { visual: vis }); }
      if (mode === 1) { let x, p, s, q, t; do { x = R.int(2, 9); p = R.int(2, 6); s = R.int(1, 5); q = R.int(-9, 9); t = (p - s) * x + q; } while (p === s || !q || !t || p * x + q <= 0 || Math.abs(t) > 20);
        const lin = (a, b) => E.poly([a, b]), askAB = R.bool(0.35), vis = show(tf, segFig(nm, 6, 4.2, { M: true }));
        return E.num(`Line ${P}${Q} is the constructed bisector of ${A}${B}, meeting it at ${Mn}. ${M(`${A}${Mn}=${lin(p, q)}`)} and ${M(`${Mn}${B}=${lin(s, t)}`)}. Find ${askAB ? A + B : 'x'}.`, [askAB ? { label: `${A}${B} =`, ans: 2 * (p * x + q) } : { label: 'x =', ans: x }],
          `${Mn} is the midpoint, so ${M(`${lin(p, q)}=${lin(s, t)}`)}, giving x = ${x}.${askAB ? ` Each half is ${p * x + q}, so ${A}${B} = ${2 * (p * x + q)}.` : ''}`, { visual: vis }); }
      if (mode === 2) return ordQ(R, `Put the steps for bisecting ${A}${B} in order.`,
        [`Open the compass to more than half of ${A}${B}, and keep that width.`, `With center ${A}, draw arcs above and below ${A}${B}.`, `With center ${B}, draw arcs above and below ${A}${B}.`, `Label the two points where the arcs cross ${P} and ${Q}.`, `Draw line ${P}${Q}. It crosses ${A}${B} at its midpoint ${Mn}.`],
        [[], [0], [0], [1, 2]], `Set the width first; the arcs from ${A} and from ${B} can come in either order. Their crossings give ${P} and ${Q}, and line ${P}${Q} comes last.`);
      if (mode === 3) { const L = 6, r = R.pick([3.8, 4.2, 4.6]), s = R.int(1, 2);
        const opts = s === 1 ? [{}, { rb: (L - r) * 0.6 }, { rb: r * 1.35 }, { err: 'mid' }] : [{}, { err: 'par' }, { err: 'tri' }, { err: 'pa' }];
        const pics = opts.map(op => show(tf, segFig(nm, L, r, Object.assign({ stage: s + 1 }, op)), 190));
        return E.choice(R, `This is the bisection of ${A}${B} so far. Which picture shows the next step?`, pics[0], pics.slice(1),
          s === 1 ? `Keep the same width and draw arcs centered at ${B}; they cross the arcs from ${A} on the line of symmetry.` : `Join the two crossing points: line ${P}${Q} is the perpendicular bisector.`, { visual: show(tf, segFig(nm, L, r, { stage: s })) }); }
      const vis = show(tf, segFig(nm, 6, R.pick([3.8, 4.3, 4.8]), { M: true }));
      return E.choice(R, `What does this construction make?`, `The perpendicular bisector of ${A}${B}`, [`A line parallel to ${A}${B}`, `A copy of segment ${A}${B}`, `A tangent to a circle at ${A}`],
        `Equal arcs from ${A} and ${B} cross at two points equally far from both ends; the line through them is the perpendicular bisector of ${A}${B}.`, { visual: vis }); } },
    c: { t: 'it is also perpendicular', g: (R, O) => {
      const u = U(O), mode = R.pick([0, 1, 1, 2]), [A, B, P, Q, Mn] = lets(R, 5), nm = { A, B, P, Q, M: Mn }, tf = rig(R);
      if (mode === 0) { const al = R.int(30, 68), L = 6, r = (L / 2) / Math.cos(K.rad(al)), askBoth = R.bool(0.4);
        const vis = show(tf, segFig(nm, L, r, { M: true, segs: [[A, P, THIN], [B, P, THIN]], angles: [[B, A, P, deg(al)]] }));
        if (askBoth) return E.num(`${P}${Q} is the constructed perpendicular bisector of ${A}${B}. ∠${P}${A}${B} = ${al}°. Find ∠${A}${P}${B}.`, [{ ans: 180 - 2 * al }],
          `${P}${A} = ${P}${B}, so ∠${P}${B}${A} = ${al}° too, and ∠${A}${P}${B} = 180° − 2 × ${al}° = ${180 - 2 * al}°.`, { visual: vis });
        return E.num(`${P}${Q} is the constructed perpendicular bisector of ${A}${B}, meeting it at ${Mn}. ∠${P}${A}${B} = ${al}°. Find ∠${A}${P}${Mn}.`, [{ ans: 90 - al }],
          `∠${P}${Mn}${A} = 90°, so ∠${A}${P}${Mn} = 180° − 90° − ${al}° = ${90 - al}°.`, { visual: vis }); }
      if (mode === 1) { const [h0, p0, r0] = pickTrip(R, SMALLTRIP), L = 2 * h0, k = R.int(0, 2), vis = show(tf, segFig(nm, L, r0, { M: true, segs: [[A, P, THIN]] }));
        if (k === 2) return E.num(`Arcs centered at ${A} and ${B} cross at ${P} and ${Q}, and ${P}${Q} meets ${A}${B} at ${Mn}. ${P}${Q} = ${2 * p0} ${u} and ${A}${B} = ${L} ${u}. Find the radius of the arcs, ${A}${P}.`, [{ label: `${A}${P} =`, ans: r0 }],
          `${Mn} is the midpoint of both ${A}${B} and ${P}${Q}, and ∠${A}${Mn}${P} = 90°: ${A}${P} = √(${h0}² + ${p0}²) = ${r0} ${u}.`, { visual: vis });
        const askPQ = k === 1;
        return E.num(`${A}${B} = ${L} ${u}. Arcs of radius ${r0} ${u} centered at ${A} and ${B} cross at ${P} and ${Q}, and line ${P}${Q} meets ${A}${B} at ${Mn}. Find ${askPQ ? P + Q : P + Mn}.`, [{ label: `${askPQ ? P + Q : P + Mn} =`, ans: askPQ ? 2 * p0 : p0 }],
          `${P}${Q} ⊥ ${A}${B} at the midpoint, so △${A}${Mn}${P} is right-angled with ${A}${Mn} = ${h0}: ${P}${Mn} = √(${r0}² − ${h0}²) = ${p0}${askPQ ? `, and ${P}${Q} = 2 × ${p0} = ${2 * p0}` : ''} ${u}.`, { visual: vis }); }
      let rr; do { rr = R.int(56, 95) / 100; } while (rr > 0.66 && rr < 0.78); const yes = R.bool(), vis = show(tf, segFig(nm, 6, 6 * rr, { M: true, segs: [[A, P, THIN], [P, B, THIN], [B, Q, THIN], [Q, A, THIN]] }));
      const T = [[`${P}${Q} ⊥ ${A}${B}`, 'The line through the two crossings is the perpendicular bisector.'], [`${Mn} is the midpoint of ${P}${Q}`, `All four sides of ${A}${P}${B}${Q} are equal radii, so it is a rhombus and its diagonals bisect each other.`],
        [`${A}${P}${B}${Q} is a rhombus`, 'Its four sides are all radii of the same width.'], [`${P}${A} = ${Q}${B}`, 'Both are radii of the same width.']];
      const F = [[`${P}${Q} = ${A}${B}`, `The diagonals of rhombus ${A}${P}${B}${Q} are equal only for one special width; here they differ.`], [`∠${A}${P}${B} = 90°`, `That would need ${P}${Mn} = ${A}${Mn}, which only happens for one special width.`],
        [`${Mn} is closer to ${P} than to ${Q}`, `${A}${P}${B}${Q} is a rhombus, so ${Mn} is the midpoint of ${P}${Q}.`], [`${P}${Q} bisects ${A}${B} but is not perpendicular to it`, 'The perpendicular bisector is both: it halves the segment at a right angle.']];
      const [s, w] = R.pick(yes ? T : F);
      return E.tf(`${P}${Q} is constructed from equal arcs centered at ${A} and ${B}. True or false? ${s}.`, yes, w, { visual: vis }); } },
    d: { t: 'justify', g: (R, O) => {
      const u = U(O), mode = R.pick([0, 0, 1, 1, 2]), [A, B, P, Q, Mn, X] = lets(R, 6), nm = { A, B, P, Q, M: Mn }, tf = rig(R), L = pbProof(nm);
      if (mode === 0) return ordQ(R, `${P} and ${Q} are where equal arcs centered at ${A} and ${B} cross, and line ${P}${Q} meets ${A}${B} at ${Mn}. Put the lines of the proof that ${P}${Q} is the perpendicular bisector of ${A}${B} in order.`,
        L.map(l => `${l[0]} <i>(${l[1]})</i>`), L.map(l => l[2]), 'The first three lines can come in any order. SSS gives the equal angles at the top, then SAS on the small triangles gives equal halves and equal right angles.', show(tf, segFig(nm, 6, 4.3, { M: true })));
      if (mode === 1) return pbPick(R, L, `${P} and ${Q} are where equal arcs centered at ${A} and ${B} cross; ${P}${Q} meets ${A}${B} at ${Mn}.`, show(tf, segFig(nm, 6, 4.3, { M: true })));
      const alg = R.bool(), vis = show(tf, (() => { const F = segFig(nm, 6, 4.3); F.pts[X] = [0, -5.2 + R.int(0, 9)]; F.segs.push([X, A, THIN], [X, B, THIN]); return F; })());
      if (!alg) { const d = R.int(4, 19); return E.num(`${X} lies on line ${P}${Q}, the constructed perpendicular bisector of ${A}${B}. ${X}${A} = ${d} ${u}. Find ${X}${B}.`, [{ label: `${X}${B} =`, ans: d }],
        `Every point on the perpendicular bisector is equally far from ${A} and ${B}, so ${X}${B} = ${X}${A} = ${d} ${u}.`, { visual: vis }); }
      let x, p, s, q, t; do { x = R.int(2, 9); p = R.int(2, 6); s = R.int(1, 5); q = R.int(-9, 9); t = (p - s) * x + q; } while (p === s || !q || !t || p * x + q <= 0 || Math.abs(t) > 25);
      return E.num(`${X} lies on line ${P}${Q}, the constructed perpendicular bisector of ${A}${B}. ${M(`${X}${A}=${E.poly([p, q])}`)} and ${M(`${X}${B}=${E.poly([s, t])}`)}. Find x.`, [{ label: 'x =', ans: x }],
        `Points on the perpendicular bisector are equidistant from ${A} and ${B}: ${M(`${E.poly([p, q])}=${E.poly([s, t])}`)}, so x = ${x}.`, { visual: vis }); } },
  });

  /* ================= V.15.03 Bisect an angle ================= */
  const abLines = n => [[`${n.A}${n.X} = ${n.A}${n.Y}`, 'radii of the first arc', []], [`${n.X}${n.Z} = ${n.Y}${n.Z}`, 'arcs of equal radius', []], [`${n.A}${n.Z} = ${n.A}${n.Z}`, 'shared side', []],
    [`△${n.A}${n.X}${n.Z} ≅ △${n.A}${n.Y}${n.Z}`, 'SSS', [0, 1, 2]], [`∠${n.X}${n.A}${n.Z} = ∠${n.Y}${n.A}${n.Z}`, 'CPCTC', [3]]];
  const ABWRONG = { 'radii of the first arc': ['arcs of equal radius', 'shared side', 'CPCTC'], 'arcs of equal radius': ['radii of the first arc', 'shared side', 'vertical angles'], 'shared side': ['radii of the first arc', 'CPCTC', 'vertical angles'], SSS: ['SAS', 'ASA', 'SSA'], CPCTC: ['SSS', 'vertical angles', 'radii of the first arc'] };
  const angPick = R => { let th; do { th = R.int(40, 140); } while (th > 80 && th < 100); return th; };
  S('V.15.03', 'Bisect an angle', {
    a: { t: 'arc on both sides', g: (R, O) => {
      const u = U(O), mode = R.pick([0, 0, 1, 1, 2]), [A, B, Cn, X, Y] = lets(R, 5), nm = { A, B, C: Cn, X, Y }, tf = rig(R);
      if (mode === 0) { const th = R.pick([60, 90, 120]), r = R.int(2, 9), vis = show(tf, angFig(nm, th, { stage: 1, xy: true, angles: [[B, A, Cn, deg(th)]] }));
        const ans = th === 60 ? String(r) : th === 90 ? kSqD(r, 2) : kSqD(r, 3);
        const why = th === 60 ? `△${A}${X}${Y} is isosceles with a 60° apex, so it is equilateral: ${X}${Y} = ${r}.` : th === 90 ? `${A}${X} = ${A}${Y} = ${r} with a right angle between: ${X}${Y} = √(${r}² + ${r}²) = ${PT(ans)}.` : `The altitude from ${A} splits △${A}${X}${Y} into two 30-60-90 triangles, each with half-base ${r}√3/2, so ${X}${Y} = ${PT(ans)}.`;
        return E.num(`An arc of radius ${r} ${u} centered at ${A} crosses the sides of ${angWords(A, B, Cn)} = ${th}° at ${X} and ${Y}. Find the exact length ${X}${Y}.`, [{ label: `${X}${Y} =`, exact: ans }], why, { visual: vis }); }
      if (mode === 1) { const th = 2 * R.int(15, 75), vis = show(tf, angFig(nm, th, { stage: 1, xy: true, angles: [[B, A, Cn, deg(th)]] }));
        return E.num(`An arc centered at ${A} crosses the sides of ${angWords(A, B, Cn)} = ${th}° at ${X} and ${Y}. Find ∠${A}${X}${Y}.`, [{ ans: (180 - th) / 2 }],
          `${A}${X} = ${A}${Y} (radii), so △${A}${X}${Y} is isosceles: ∠${A}${X}${Y} = (180° − ${th}°) ÷ 2 = ${(180 - th) / 2}°.`, { visual: vis }); }
      const r = R.int(2, 12), vis = show(tf, angFig(nm, angPick(R), { stage: 1 })), sum = R.bool();
      return E.num(`An arc centered at ${A} crosses the sides of the angle at ${X} and ${Y}. ${A}${X} = ${r} ${u}. Find ${sum ? `${A}${X} + ${A}${Y}` : A + Y}.`, [{ ans: sum ? 2 * r : r }],
        `${A}${X} and ${A}${Y} are radii of one arc, so ${A}${Y} = ${r} ${u}${sum ? ` and the sum is ${2 * r} ${u}` : ''}.`, { visual: vis }); } },
    b: { t: 'two more arcs', g: (R, O) => {
      const u = U(O), mode = R.pick([0, 0, 1, 2, 2, 3]), [A, B, Cn, X, Y, Z] = lets(R, 6), nm = { A, B, C: Cn, X, Y, Z }, tf = rig(R);
      if (mode === 0) { const th = angPick(R), r1 = R.int(4, 9), XY = 2 * r1 * Math.sin(K.rad(th / 2)), rh = R.bool(); let r2;
        do { r2 = rh ? r1 : R.int(Math.floor(XY / 2) + 1, r1 + 4); } while (!rh && (r2 === r1 || r2 <= XY / 2 + 0.3));
        const vis = show(tf, angFig(nm, th, { r1: 2.6, r2: 2.6 * r2 / r1, segs: [], xy: false, stage: 3 }));
        return E.choiceFixed(`An arc of radius ${r1} ${u} centered at ${A} cuts the sides at ${X} and ${Y}. Arcs of radius ${r2} ${u} centered at ${X} and ${Y} cross at ${Z}. What shape is ${A}${X}${Z}${Y}?`,
          ['A kite that is not a rhombus', 'A rhombus', 'A rectangle'], rh ? 1 : 0,
          rh ? `All four sides equal ${r1}: ${A}${X} = ${A}${Y} = ${X}${Z} = ${Y}${Z}, so it is a rhombus.` : `${A}${X} = ${A}${Y} = ${r1} and ${X}${Z} = ${Y}${Z} = ${r2}: two pairs of equal adjacent sides, so it is a kite, not a rhombus.`, { visual: vis }); }
      if (mode === 1) { const s = R.int(3, 15); return E.num(`The first arc of an angle bisection cuts the sides at ${X} and ${Y}, with ${X}${Y} = ${s} ${u}. Equal arcs from ${X} and ${Y} must meet. Their radius must be more than what?`, [{ ans: s / 2 }],
        `Arcs from ${X} and ${Y} meet only if each reaches past the middle of ${X}${Y}: more than ${s} ÷ 2 = ${s / 2} ${u}.`); }
      if (mode === 2) { const th = angPick(R), XY = 2 * 2.6 * Math.sin(K.rad(th / 2)), r2 = Math.max(XY * 0.62, 1.2), s = R.int(2, 3);
        const opts = s === 2 ? [{}, { ry: r2 * 1.4 }, { err: 'A' }, { ry: Math.max(0.5, (XY - r2) * 0.6) }] : [{}, { err: 'xy' }, { err: 'xz' }, { err: 'off' }];
        if (s === 2 && XY - r2 < 1) opts[3] = { ry: r2 * 0.55 };
        const pics = opts.map(op => show(tf, angFig(nm, th, Object.assign({ r2, stage: s + 1 }, op)), 190));
        return E.choice(R, `This is the bisection of ${angWords(A, B, Cn)} so far. Which picture shows the next step?`, pics[0], pics.slice(1),
          s === 2 ? `Draw an arc centered at ${Y} with the same width as the arc from ${X}, so they cross on the bisector.` : `The bisector is the ray from ${A} through ${Z}, where the second pair of arcs cross.`, { visual: show(tf, angFig(nm, th, { r2, stage: s })) }); }
      const r1 = R.int(3, 9), r2 = R.int(3, 10), per = R.bool(), vis = show(tf, angFig(nm, angPick(R), { stage: 3 }));
      return E.num(`An arc of radius ${r1} ${u} centered at ${A} cuts the sides at ${X} and ${Y}. Arcs centered at ${X} and ${Y} cross at ${Z}, and ${X}${Z} = ${r2} ${u}. Find ${per ? `the perimeter of ${A}${X}${Z}${Y}` : Y + Z}.`, [{ ans: per ? 2 * r1 + 2 * r2 : r2 }],
        per ? `${A}${X} = ${A}${Y} = ${r1} and ${X}${Z} = ${Y}${Z} = ${r2}: 2 × ${r1} + 2 × ${r2} = ${2 * r1 + 2 * r2} ${u}.` : `The arcs from ${X} and ${Y} have the same radius, so ${Y}${Z} = ${X}${Z} = ${r2} ${u}.`, { visual: vis }); } },
    c: { t: 'draw the ray', g: R => {
      const mode = R.pick([0, 0, 1, 2, 2, 3]), [A, B, Cn, X, Y, Z] = lets(R, 6), nm = { A, B, C: Cn, X, Y, Z }, tf = rig(R), aA = angWords(A, B, Cn);
      if (mode === 0) { const th = R.int(20, 80) * 2, back = R.bool(0.4), vis = show(tf, angFig(nm, th));
        if (back) return E.num(`Ray ${A}${Z} is the constructed bisector of ${aA}, and ∠${B}${A}${Z} = ${th / 2}°. Find ${aA}.`, [{ ans: th }], `The bisector splits the angle into two equal parts: ${aA} = 2 × ${th / 2}° = ${th}°.`, { visual: vis });
        return E.num(`Ray ${A}${Z} is the constructed bisector of ${aA} = ${th}°. Find ∠${B}${A}${Z}.`, [{ ans: th / 2 }], `The bisector halves the angle: ${th}° ÷ 2 = ${th / 2}°.`, { visual: vis }); }
      if (mode === 1) { let x, p, s, q, t; do { x = R.int(3, 15); p = R.int(2, 6); s = R.int(1, 5); q = R.int(-12, 12); t = (p - s) * x + q; } while (p === s || !q || !t || p * x + q < 12 || p * x + q > 80 || Math.abs(t) > 30);
        const ex = (a, b) => b ? `(${E.pt(E.poly([a, b]))})°` : `${E.pt(E.poly([a, b]))}°`, th = 2 * (p * x + q), vis = show(tf, angFig(nm, th));
        return E.num(`Ray ${A}${Z} is the constructed bisector of ${aA}. ∠${B}${A}${Z} = ${ex(p, q)} and ∠${Z}${A}${Cn} = ${ex(s, t)}. Find x.`, [{ label: 'x =', ans: x }],
          `The two halves are equal: ${M(`${E.poly([p, q])}=${E.poly([s, t])}`)}, so x = ${x} (and each half is ${p * x + q}°).`, { visual: vis }); }
      if (mode === 2) return ordQ(R, `Put the steps for bisecting ${aA} in order.`,
        [`With center ${A}, draw an arc crossing ${A}${B} at ${X} and ${A}${Cn} at ${Y}.`, `Set the compass to more than half of ${X}${Y}, and keep that width.`, `With center ${X}, draw an arc inside the angle.`, `With center ${Y}, draw an arc inside the angle.`, `Label the crossing of these two arcs ${Z}.`, `Draw ray ${A}${Z}. It bisects ${aA}.`],
        [[], [0], [1], [1], [2, 3]], `${X} and ${Y} come first; after setting the width, the arcs from ${X} and ${Y} can come in either order. Their crossing ${Z} fixes the bisector.`);
      const vis = show(tf, angFig(nm, angPick(R), { stage: 3, xy: true }));
      return E.choice(R, `Which of these bisects ${aA}?`, `ray ${A}${Z}`, [`ray ${X}${Z}`, `segment ${X}${Y}`, `ray ${Y}${Z}`],
        `The bisector starts at the vertex ${A} and goes through ${Z}, where the second pair of arcs cross. ${X} and ${Y} are only where the first arc meets the sides.`, { visual: vis }); } },
    d: { t: 'justify', g: R => {
      const mode = R.pick([0, 0, 1, 1, 2, 3]), [A, B, Cn, X, Y, Z] = lets(R, 6), nm = { A, B, C: Cn, X, Y, Z }, tf = rig(R), L = abLines(nm), vis = () => show(tf, angFig(nm, angPick(R), { segs: [] }));
      const head = `${X} and ${Y} are where an arc centered at ${A} meets the sides, and ${Z} is where equal arcs from ${X} and ${Y} cross.`;
      if (mode === 0) return ordQ(R, `${head} Put the lines of the proof that ray ${A}${Z} bisects ∠${X}${A}${Y} in order.`, L.map(l => `${l[0]} <i>(${l[1]})</i>`), L.map(l => l[2]),
        'The three side pairs can come in any order; SSS needs all three, and CPCTC gives the equal angles at the vertex.', vis());
      if (mode === 1) { const j = R.int(0, 4), cor = L[j][1];
        return E.choice(R, `${head} What is the missing reason?${twoCol(L.map(l => [l[0], l[1]]), j)}`, cor, ABWRONG[cor],
          ['Both points are on the first arc, so they are one radius from its center.', 'The arcs from the two points were drawn with the same width.', 'A side shared by two triangles equals itself.', 'Three pairs of equal sides: SSS. No angle is known yet, so SAS and ASA do not apply.', 'Corresponding parts of congruent triangles are congruent.'][j], { visual: vis() }); }
      if (mode === 2) { const k = R.int(0, 3);
        if (k === 3) { const n = R.int(1, 3); return E.num(`You construct an equilateral triangle, then bisect one of its angles${n > 1 ? `, then bisect one of the new angles${n > 2 ? ', and once more' : ''}` : ''}. What is the smallest angle you have made?`, [{ ans: 60 / 2 ** n }],
          `Each angle of an equilateral triangle is 60°, and each bisection halves it: 60° ÷ ${2 ** n} = ${60 / 2 ** n}°.`); }
        const n = R.int(1, 3); let th; do { th = R.int(10, 44) * 4; } while (th % (2 ** n) || th > 176);
        if (k === 2) return E.num(`You construct a perpendicular, then bisect one of the right angles${n > 1 ? `, then bisect one of the halves` : ''}. What is the smallest angle you have made?`, [{ ans: 90 / 2 ** n }], `A right angle is 90°; ${n} bisection${n > 1 ? 's' : ''} make${n > 1 ? '' : 's'} 90° ÷ ${2 ** n} = ${90 / 2 ** n}°.`);
        return E.num(`∠${B}${A}${Cn} = ${th}°. You bisect it, then bisect one of the halves${n === 3 ? ', then bisect one of those' : ''}. What is the smallest angle you have made?`, [{ ans: th / 2 ** Math.max(2, n) }],
          `Each bisection halves the angle: ${th}° ÷ ${2 ** Math.max(2, n)} = ${th / 2 ** Math.max(2, n)}°.`); }
      const j = R.pick([0, 1, 3, 4]), rows = L.map(l => `${l[0]} (${l[1]})`);
      const W = { 0: [`${A}${X} = ${A}${Y} (arcs of equal radius from ${X} and ${Y})`, `${A}${X} = ${A}${Y} because both are radii of the first arc, centered at ${A}.`], 1: [`${X}${Z} = ${A}${X} (same compass width)`, `The arcs from ${X} and ${Y} can have a different width from the first arc. What is true is ${X}${Z} = ${Y}${Z}.`],
        3: [`△${A}${X}${Z} ≅ △${A}${Y}${Z} (SAS)`, 'No angle is known to be equal yet. The three pairs of sides give SSS.'], 4: [`∠${A}${X}${Z} = ∠${A}${Y}${Z}, so ray ${A}${Z} bisects the angle`, `Those angles sit at ${X} and ${Y}. The bisector needs the angles at ${A}: ∠${X}${A}${Z} = ∠${Y}${A}${Z}.`] };
      rows[j] = W[j][0];
      return E.choiceFixed(`${head} Which line of this proof is wrong?${numbered(rows)}`, LINES(5), j, `Line ${j + 1} is wrong. ${W[j][1]}`); } },
  });

  /* ================= V.15.04 Perpendicular through a point ================= */
  const perpPics = (R, P) => {
    let phi; do { phi = R.int(20, 160); } while (phi > 70 && phi < 110);
    const dirs = [phi + 90, 90, 0], cand = [phi + 60, phi - 60].filter(d => { const m = K.md(d) % 180; return Math.min(m, 180 - m) > 14 && Math.abs(m - 90) > 14; });
    dirs.push(cand.length ? cand[0] : phi + 45);
    return { phi, pics: dirs.map(dd => { const pts = { [P]: [0, 0], _e1: polar(3, phi + 180), _e2: polar(3, phi), _lt: polar(3.4, phi), _b1: polar(2.3, dd), _b2: polar(-2.3, dd) };
      return draw(pts, { segs: [['_e1', '_e2'], ['_b1', '_b2', BLUE]], text: [['_lt', 'ℓ', { size: 16 }]], w: 170, label: 'a line through P' }); }) };
  };
  S('V.15.04', 'Perpendicular through a point', {
    a: { t: 'point on the line', g: (R, O) => {
      const u = U(O), mode = R.pick([0, 1, 1, 2, 3, 3]), [P, A, B, Q] = lets(R, 4), nm = { P, A, B, Q }, tf = rig(R);
      if (mode === 3) { const { pics } = perpPics(R, P);
        return E.choice(R, `${P} is on line ℓ. Which picture shows the line through ${P} perpendicular to ℓ?`, pics[0], pics.slice(1), `Perpendicular means meeting ℓ at 90°, whichever way ℓ runs. A vertical or horizontal line is only perpendicular when ℓ is level or upright.`); }
      if (mode === 0) { const a = R.int(2, 12), k = R.int(0, 1), vis = show(tf, perpFig(nm, { on: true, a: 2, s: 3.2, stage: 1 }));
        return E.num(`${P} is on line ℓ. An arc of radius ${a} ${u} centered at ${P} crosses ℓ at ${A} and ${B}. Find ${k ? P + B : A + B}.`, [{ ans: k ? a : 2 * a }],
          k ? `${P}${B} is a radius of the arc: ${a} ${u}.` : `${P}${A} = ${P}${B} = ${a}, and ${P} is between them: ${A}${B} = ${2 * a} ${u}.`, { visual: vis }); }
      if (mode === 1) { const [a, h, s] = pickTrip(R, SMALLTRIP), vis = show(tf, perpFig(nm, { on: true, a, s, segs: [[A, Q, THIN]] }));
        return E.num(`${P} is on ℓ. An arc centered at ${P} cuts ℓ at ${A} and ${B} with ${P}${A} = ${a} ${u}. Arcs of radius ${s} ${u} centered at ${A} and ${B} cross at ${Q}. Find ${P}${Q}.`, [{ label: `${P}${Q} =`, ans: h }],
          `${P}${Q} ⊥ ℓ, so △${A}${P}${Q} has a right angle at ${P}: ${P}${Q} = √(${s}² − ${a}²) = ${h} ${u}.`, { visual: vis }); }
      const al = R.int(35, 70), a = 2, s = a / Math.cos(K.rad(al)), both = R.bool(0.4), vis = show(tf, perpFig(nm, { on: true, a, s, segs: [[A, Q, THIN], [B, Q, THIN]], angles: [[P, A, Q, deg(al)]] }));
      if (both) return E.num(`${P}${Q} is constructed perpendicular to ℓ at ${P}, with ${Q}${A} = ${Q}${B}. ∠${Q}${A}${P} = ${al}°. Find ∠${A}${Q}${B}.`, [{ ans: 180 - 2 * al }], `△${A}${Q}${B} is isosceles, so ∠${Q}${B}${A} = ${al}° too: ∠${A}${Q}${B} = 180° − ${2 * al}° = ${180 - 2 * al}°.`, { visual: vis });
      return E.num(`${P}${Q} is constructed perpendicular to ℓ at ${P}. ∠${Q}${A}${P} = ${al}°. Find ∠${A}${Q}${P}.`, [{ ans: 90 - al }], `∠${Q}${P}${A} = 90°, so ∠${A}${Q}${P} = 180° − 90° − ${al}° = ${90 - al}°.`, { visual: vis }); } },
    b: { t: 'point off the line', g: (R, O) => {
      const u = U(O), mode = R.pick([0, 0, 1, 2]), [P, A, B, Q, Mn] = lets(R, 5), nm = { P, A, B, Q, M: Mn }, tf = rig(R);
      if (mode === 1) { const d = R.int(3, 12), yes = R.bool(), r = yes ? d + R.int(1, 5) : d - R.int(1, Math.min(3, d - 1));
        return E.choiceFixed(`${P} is ${d} ${u} from line ℓ. With the compass opened to ${r} ${u}, will an arc centered at ${P} cross ℓ at two points?`, ['Yes', 'No'], yes ? 0 : 1,
          yes ? `The radius ${r} is more than the distance ${d}, so the arc reaches past ℓ and crosses it twice.` : `The radius ${r} is less than the distance ${d}, so the arc never reaches ℓ.`); }
      if (mode === 2) { let x1, x2; do { x1 = R.int(-9, 9); x2 = R.int(-9, 9); } while (x2 - x1 < 4 || (x1 + x2) % 2);
        return E.num(`ℓ is the x-axis and ${P} is above it. An arc centered at ${P} crosses ℓ at ${A}(${x1}, 0) and ${B}(${x2}, 0). Where does the perpendicular from ${P} meet ℓ?`, [{ point: [String((x1 + x2) / 2), '0'] }],
          `The perpendicular from ${P} is the perpendicular bisector of ${A}${B}, so it meets ℓ at the midpoint (${(x1 + x2) / 2}, 0).`); }
      const [h0, d0, r0] = pickTrip(R, SMALLTRIP), k = R.int(0, 2), vis = show(tf, perpFig(nm, { on: false, d: d0, r: r0, s: r0 * 1.05, stage: 1, M: true, segs: [[P, A, THIN]] }));
      if (k === 2) return E.num(`An arc of radius ${r0} ${u} centered at ${P} crosses ℓ at ${A} and ${B}, and ${A}${B} = ${2 * h0} ${u}. How far is ${P} from ℓ?`, [{ label: 'distance =', ans: d0 }],
        `The perpendicular from ${P} meets ℓ at the midpoint of ${A}${B}, ${h0} from ${A}: distance = √(${r0}² − ${h0}²) = ${d0} ${u}.`, { visual: show(tf, perpFig(nm, { on: false, d: d0, r: r0, s: r0 * 1.05, stage: 1, segs: [[P, A, THIN]] })) });
      return E.num(`${P} is ${d0} ${u} from ℓ. An arc of radius ${r0} ${u} centered at ${P} crosses ℓ at ${A} and ${B}. ${Mn} is the foot of the perpendicular from ${P} to ℓ. Find ${k ? A + B : A + Mn}.`, [{ ans: k ? 2 * h0 : h0 }],
        `△${P}${Mn}${A} is right-angled at ${Mn}: ${A}${Mn} = √(${r0}² − ${d0}²) = ${h0}${k ? `, and ${Mn} is the midpoint, so ${A}${B} = ${2 * h0}` : ''} ${u}.`, { visual: vis }); } },
    c: { t: 'construct', g: R => {
      const mode = R.pick([0, 0, 1, 1, 2, 2]), [P, A, B, Q] = lets(R, 4), nm = { P, A, B, Q }, tf = rig(R);
      if (mode === 0) return ordQ(R, `${P} is on line ℓ. Put the steps for constructing the perpendicular to ℓ at ${P} in order.`,
        [`With center ${P}, draw an arc crossing ℓ at ${A} and ${B}.`, `Open the compass wider than ${P}${A}, and keep that width.`, `With center ${A}, draw an arc above ℓ.`, `With center ${B}, draw an arc above ℓ.`, `Label the crossing of the two arcs ${Q}.`, `Draw line ${P}${Q}. It is perpendicular to ℓ.`],
        [[], [0], [1], [1], [2, 3]], `First make ${A} and ${B} equally far from ${P}; after widening the compass, the arcs from ${A} and ${B} can come in either order.`, show(tf, perpFig(nm, { on: true, a: 2, s: 3.3 })));
      if (mode === 1) return ordQ(R, `${P} is not on line ℓ. Put the steps for constructing the perpendicular from ${P} to ℓ in order.`,
        [`With center ${P}, draw an arc crossing ℓ at ${A} and ${B}.`, `Set the compass to more than half of ${A}${B}, and keep that width.`, `With center ${A}, draw an arc on the side of ℓ away from ${P}.`, `With center ${B}, draw an arc on the side of ℓ away from ${P}.`, `Label the crossing of the two arcs ${Q}.`, `Draw line ${P}${Q}. It is perpendicular to ℓ.`],
        [[], [0], [1], [1], [2, 3]], `The arc from ${P} makes ${A} and ${B}; after setting the width, the arcs from ${A} and ${B} can come in either order.`, show(tf, perpFig(nm, { on: false, d: 2, r: 3, s: 2.9 })));
      const on = R.bool(), vis = show(tf, on ? perpFig(nm, { on: true, a: R.pick([1.6, 2, 2.4]), s: 3.3 }) : perpFig(nm, { on: false, d: R.pick([1.6, 2, 2.4]), r: 3, s: 2.9 }));
      return E.choice(R, `What does this construction make?`, `The line through ${P} perpendicular to ℓ`, [`The line through ${P} parallel to ℓ`, `A tangent from ${P} to a circle`, `A copy of segment ${P}${A}`],
        `Arcs make ${A} and ${B} equally far from ${P}, and ${Q} equally far from ${A} and ${B}; line ${P}${Q} is the perpendicular bisector of ${A}${B}, so it is perpendicular to ℓ.`, { visual: vis }); } },
    d: { t: 'justify', g: (R, O) => {
      const u = U(O), mode = R.pick([0, 0, 1, 1, 2]), [P, A, B, Q, Mn] = lets(R, 5), nm = { P, A, B, Q, M: Mn }, tf = rig(R);
      if (mode === 0) { const on = R.bool(), vis = show(tf, on ? perpFig(nm, { on: true, a: 2, s: 3.3 }) : perpFig(nm, { on: false, d: 2, r: 3, s: 2.9 }));
        return E.choice(R, `In this construction, why is ${P}${Q} perpendicular to ℓ?`, `${P} and ${Q} are each equally far from ${A} and ${B}, so ${P}${Q} is the perpendicular bisector of ${A}${B}.`,
          [`${P}${Q} is drawn vertically.`, `${Q}${A} = ${P}${A}, so ${P}${Q} meets ℓ at 90°.`, `${A}${B} = ${P}${Q}, so the lines meet at 90°.`],
          `${P}${A} = ${P}${B} (one arc from ${P}) and ${Q}${A} = ${Q}${B} (equal arcs). Two points each equidistant from ${A} and ${B} fix the perpendicular bisector of ${A}${B}, which lies along ${P}${Q}. Vertical has nothing to do with it.`, { visual: vis }); }
      if (mode === 1) { const L = pbProof(nm, `one arc from ${P}`, `equal arcs from ${A} and ${B}`), map = { [`one arc from ${P}`]: 'one arc from P', [`equal arcs from ${A} and ${B}`]: 'equal arcs from A and B' }, vis = show(tf, perpFig(nm, { on: false, d: 2, r: 3, s: 2.9, M: true }));
        const head = `${P} is off ℓ; an arc from ${P} cuts ℓ at ${A} and ${B}; equal arcs from ${A} and ${B} cross at ${Q}; ${P}${Q} meets ℓ at ${Mn}.`;
        if (R.bool()) return ordQ(R, `${head} Put the lines of the proof that ${P}${Q} ⊥ ℓ in order.`, L.map(l => `${l[0]} <i>(${l[1]})</i>`), L.map(l => l[2]), 'The first three lines can come in any order; SSS gives equal angles at the top, and SAS on the small triangles gives equal right angles at the foot.', vis);
        return pbPick(R, L, head, vis, map); }
      const [h0, d0, r0] = pickTrip(R, TRIP), vis = show(tf, perpFig(nm, { on: false, d: d0, r: r0, s: r0, stage: 1, segs: [[P, A, THIN]] }));
      return E.num(`To find how far ${P} is from ℓ, you draw an arc of radius ${r0} ${u} centered at ${P}. It cuts ℓ at ${A} and ${B} with ${A}${B} = ${2 * h0} ${u}. How far is ${P} from ℓ?`, [{ label: 'distance =', ans: d0 }],
        `The perpendicular from ${P} bisects ${A}${B}, making a right triangle with legs ${h0} and the distance, and hypotenuse ${r0}: √(${r0}² − ${h0}²) = ${d0} ${u}.`, { visual: vis }); } },
  });

  /* ================= V.15.05 Parallel through a point ================= */
  const parTheta = R => { let th; do { th = R.int(35, 145); } while (th > 75 && th < 105); return th; };
  const PAR_T = [['If corresponding angles are equal, the lines are parallel.', 'This is the converse of the Corresponding Angles Postulate, which the construction uses.'],
    ['The transversal can be any line through P that crosses ℓ.', 'Any crossing line works; you copy whatever angle it makes.'],
    ['Copying the angle as an alternate interior angle also gives a parallel line.', 'Equal alternate interior angles also prove the lines parallel.'],
    ['Through P there is exactly one line parallel to ℓ.', 'That is the Parallel Postulate, so the construction finds the parallel.']];
  const PAR_F = [['Copying the angle on the other side of the transversal at P still gives a parallel line.', 'On the wrong side the copied angle is not corresponding, and the new line tilts the other way.'],
    ['The transversal must be perpendicular to ℓ.', 'Any line through P that crosses ℓ will do.'],
    ['Equal corresponding angles prove lines parallel only if the transversal is vertical.', 'The direction of the transversal does not matter.'],
    ['Copying any angle at P gives a line parallel to ℓ.', 'It must be the angle the transversal makes with ℓ, in the corresponding position.']];
  S('V.15.05', 'Parallel through a point', {
    a: { t: 'copy a corresponding angle', g: R => {
      const mode = R.pick([0, 0, 1, 1, 2]), [A, P] = lets(R, 2), nm = { A, P }, tf = rig(R);
      if (mode === 2) { const yes = R.bool(), [s, w] = R.pick(yes ? PAR_T : PAR_F); return E.tf(`True or false? ${s.replace(/P/g, P)}`, yes, w.replace(/P/g, P)); }
      let th, dirs; do { th = parTheta(R); dirs = [0, 2 * th, th + 90]; } while (dirs.some((a, i) => dirs.some((b, j) => j > i && Math.min(K.md(a - b) % 180, 180 - K.md(a - b) % 180) < 18)));
      if (mode === 1) { const pics = dirs.map(dd => { const F = parFig(nm, th, { stage: 2, dir: dd }); F.marks = []; F.pts._a0 = [1, 0]; F.pts._ap = polar(1, th); F.pts._q1 = add(F.pts[P], polar(1, th)); F.pts._q2 = add(F.pts[P], polar(1, dd));
          F.angles = [['_a0', A, '_ap', deg(th)], ['_q2', P, '_q1', '']]; return show(tf, F, 190); });
        return E.choice(R, `The transversal ${A}${P} makes ${th}° with ℓ at ${A}. Which picture shows the angle copied at ${P} so that the new line is parallel to ℓ?`, pics[0], pics.slice(1),
          `Copy the ${th}° angle in the corresponding position, on the same side of the transversal and facing the same way. Copied on the other side, the line tilts the other way and is not parallel.`); }
      const adj = R.bool(0.4), F = parFig(nm, th, { stage: 0 }); F.pts._a0 = [1, 0]; F.pts._ap = polar(1, th); F.pts._q1 = add(F.pts[P], polar(1, th)); F.pts._q0 = add(F.pts[P], [1, 0]); F.pts._q9 = add(F.pts[P], [-1, 0]);
      F.angles = [['_a0', A, '_ap', deg(th)]]; F.segs.push(['_q9', '_q0', THIN]);
      const vis = show(tf, F);
      if (adj) return E.num(`To draw the parallel to ℓ through ${P}, you copy the ${th}° angle at ${P} as a corresponding angle (dashed line). What angle does the dashed line make with ray ${P}${A}?`, [{ ans: 180 - th }],
        `The copied angle at ${P} is ${th}°, measured from the transversal beyond ${P}. The angle on the other side of the transversal, toward ${A}, makes a linear pair with it: 180° − ${th}° = ${180 - th}°.`, { visual: vis });
      return E.num(`To draw the parallel to ℓ through ${P}, you copy the marked angle at ${P} as a corresponding angle (dashed line). What size is the copied angle?`, [{ ans: th }],
        `A copy has the same size: ${th}°. Equal corresponding angles make the new line parallel to ℓ.`, { visual: vis }); } },
    b: { t: 'construct', g: R => {
      const mode = R.pick([0, 0, 1, 2]), [A, P, X, Y] = lets(R, 4), Xp = X + '′', Yp = Y + '′', nm = { A, P }, tf = rig(R), th = parTheta(R), vis = show(tf, parFig(nm, th));
      if (mode === 0) return ordQ(R, `Put the steps for constructing the line through ${P} parallel to ℓ in order.`,
        [`Draw a line through ${P} crossing ℓ at ${A}.`, `With center ${A}, draw an arc crossing ℓ at ${X} and line ${A}${P} at ${Y}.`, `With the same width and center ${P}, draw an arc crossing line ${A}${P} beyond ${P}, at ${Yp}.`,
          `Set the compass to the length ${X}${Y}.`, `With center ${Yp}, draw an arc crossing the arc centered at ${P}, at ${Xp}.`, `Draw line ${P}${Xp}. It is parallel to ℓ.`],
        [[], [0], [1], [2], [3]], `This copies the angle at ${A} to ${P} as a corresponding angle: transversal, first arc, same arc at ${P}, then the width ${X}${Y}, then the line.`, vis);
      if (mode === 1) return E.choice(R, `What does this construction make?`, `The line through ${P} parallel to ℓ`, [`The line through ${P} perpendicular to ℓ`, `The bisector of the angle at ${A}`, `A copy of segment ${A}${P}`],
        `The arcs copy the angle the transversal makes at ${A} to ${P}, in the corresponding position, so the blue line is parallel to ℓ.`, { visual: vis });
      return E.num(`The blue line is constructed through ${P} by copying the angle at ${A}. The transversal makes ${th}° with ℓ. What angle does the blue line make with the transversal, measured on the same side as the ${th}° angle?`, [{ ans: th }],
        `The construction copies the corresponding angle exactly, so it is ${th}°.`, { visual: show(tf, (() => { const F = parFig(nm, th); F.pts._a0 = [1, 0]; F.pts._ap = polar(1, th); F.angles = [['_a0', A, '_ap', deg(th)]]; return F; })()) }); } },
    c: { t: 'alternative with two perpendiculars', g: (R, O) => {
      const u = U(O), mode = R.pick([0, 0, 1, 2]), [P, A, B] = lets(R, 3), m = R.pick(['m', 'k', 'p']);
      if (mode === 0) return ordQ(R, `Put the steps for drawing the parallel to ℓ through ${P} with two perpendiculars in order.`,
        [`Construct the line ${m} through ${P} perpendicular to ℓ.`, `With center ${P}, draw an arc crossing ${m} at ${A} and ${B}.`, `Construct the perpendicular bisector of ${A}${B}. It passes through ${P}.`, `That line is perpendicular to ${m}, so it is parallel to ℓ.`],
        [[], [0], [1]], `First the perpendicular to ℓ, then a perpendicular to that one at ${P}: two lines perpendicular to the same line are parallel.`);
      if (mode === 1) return E.choice(R, `Line ${m} is perpendicular to ℓ, and line n is constructed through ${P} perpendicular to ${m}. Why is n parallel to ℓ?`, `Two lines perpendicular to the same line are parallel.`,
        [`Two lines perpendicular to each other are parallel.`, `Same-side interior angles are equal.`, `The two lines have the same length.`], `n and ℓ both make 90° with ${m}, so the corresponding angles are equal and n ∥ ℓ.`);
      const d = R.int(2, 15), k = R.int(0, 1);
      if (k === 0) return E.num(`${P} is ${d} ${u} from ℓ. Line n is constructed through ${P} with two perpendiculars, so n ∥ ℓ. ${A} is another point on n. How far is ${A} from ℓ?`, [{ ans: d }], `Parallel lines stay the same distance apart, so every point of n is ${d} ${u} from ℓ.`);
      return E.num(`Line ${m} crosses ℓ at 90°, and n is constructed through ${P} on ${m}, perpendicular to ${m}. How many right angles do the three lines make in total?`, [{ ans: 8 }], `${m} meets ℓ in 4 right angles and meets n in 4 more: 8 in total.`); } },
    d: { t: 'justify', g: R => {
      const mode = R.pick([0, 1, 1, 2]), [A, P, X, Y] = lets(R, 4), Xp = X + '′', Yp = Y + '′', nm = { A, P }, tf = rig(R), th = parTheta(R);
      if (mode === 0) { const alt = R.bool();
        if (alt) return E.choice(R, `Suppose you copy the angle at ${A} to ${P} as an alternate interior angle: between the two lines, on the other side of the transversal. Which reason shows the new line is parallel to ℓ?`, 'Converse of the Alternate Interior Angles Theorem',
          ['Alternate Interior Angles Theorem', 'Converse of the Corresponding Angles Postulate', 'Vertical Angles Theorem'], 'We know the angles are equal and want to conclude the lines are parallel, so we need a converse, and the angles are alternate interior.');
        return E.choice(R, `The blue line is constructed by copying the angle at ${A} to ${P} as a corresponding angle. Which reason shows it is parallel to ℓ?`, 'Converse of the Corresponding Angles Postulate',
          ['Corresponding Angles Postulate', 'Converse of the Alternate Interior Angles Theorem', 'SSS'], 'We know the corresponding angles are equal and conclude the lines are parallel: that direction is the converse.', { visual: show(tf, parFig(nm, th)) }); }
      if (mode === 1) { const pos = R.int(0, 3), F = parFig(nm, th), Pp = F.pts[P];
        F.pts._a0 = [1, 0]; F.pts._ap = polar(1, th); F.pts._R = add(Pp, [1, 0]); F.pts._L = add(Pp, [-1, 0]); F.pts._U = add(Pp, polar(1, th)); F.pts._D = add(Pp, polar(1, th + 180));
        const pr = [['_R', '_U'], ['_L', '_D'], ['_R', '_D'], ['_L', '_U']][pos], ans = pos < 2 ? th : 180 - th;
        F.angles = [['_a0', A, '_ap', deg(th)], [pr[0], P, pr[1], 'x']];
        const why = [`x is the corresponding angle to ${th}°, so x = ${th}°.`, `x is vertical to the corresponding angle, so x = ${th}°.`, `x and the ${th}° angle are same-side interior angles, so they add to 180°: x = ${180 - th}°.`, `x makes a linear pair with the corresponding angle: x = 180° − ${th}° = ${180 - th}°.`][pos];
        return E.num(`The blue line is constructed through ${P} parallel to ℓ. Find x.`, [{ label: 'x =', ans }], why, { visual: show(tf, F) }); }
      const STEP = [`Draw a line through ${P} crossing ℓ at ${A}.`, `With center ${A}, draw an arc crossing ℓ at ${X} and line ${A}${P} at ${Y}.`, `With the same width and center ${P}, draw an arc crossing line ${A}${P} beyond ${P}, at ${Yp}.`,
        `Set the compass to the length ${X}${Y}.`, `With center ${Yp}, draw an arc crossing the arc centered at ${P}, at ${Xp}, on the same side of line ${A}${P} as ${X}.`, `Draw line ${P}${Xp}. It is parallel to ℓ.`];
      const W = { 2: [`With a smaller width and center ${P}, draw an arc crossing line ${A}${P} beyond ${P}, at ${Yp}.`, `The arc at ${P} must use the same width as the arc at ${A}.`], 3: [`Set the compass to the length ${A}${X}.`, `The last arc must have radius ${X}${Y}, the gap between the two points on the first arc.`],
        4: [`With center ${Yp}, draw an arc crossing the arc centered at ${P}, at ${Xp}, on the opposite side of line ${A}${P} from ${X}.`, `On the wrong side of the transversal the copied angle is not corresponding, so the new line is not parallel.`], 5: [`Draw line ${P}${Yp}. It is parallel to ℓ.`, `Line ${P}${Yp} is just the transversal again; the new line goes through ${Xp}.`] };
      const j = R.pick([2, 3, 4, 5]), L = STEP.slice(); L[j] = W[j][0];
      return E.choiceFixed(`Someone constructs the parallel to ℓ through ${P}. Which step is wrong?${numbered(L)}`, STEPS(6), j, `Step ${j + 1} is wrong. ${W[j][1]}`); } },
  });

  /* ================= V.15.06 Triangle & hexagon in a circle ================= */
  const HEX_T = [['The six steps close up exactly when the compass stays at the radius.', 'Each step is a 60° arc, and 6 × 60° = 360°.'], ['Each step of the radius cuts off a 60° arc.', 'Center and two step points make an equilateral triangle, so the central angle is 60°.'],
    ['The step points divide the circle into six equal arcs.', 'Every step has the same chord, the radius, so every arc is 60°.']];
  const HEX_F = [['If the compass slips a little wider than the radius, the six steps still close up exactly.', 'A wider step cuts off more than 60°, so six steps overshoot the starting point.'], ['Stepping the radius around a circle gives eight points.', 'Each step is 60°, so there are 360° ÷ 60° = 6 points.'],
    ['Each step of the radius cuts off a 45° arc.', 'Center and two step points make an equilateral triangle, so each arc is 60°.']];
  const hexNames = R => { const L = lets(R, 7); return { O: L[6], H: L.slice(0, 6) }; };
  S('V.15.06', 'Triangle & hexagon in a circle', {
    a: { t: 'step the radius around', g: (R, O) => {
      const u = U(O), mode = R.pick([0, 0, 1, 2, 3]), { O: Oc, H } = hexNames(R), tilt = R.int(0, 71) * 5;
      if (mode === 2) { const yes = R.bool(), [s, w] = R.pick(yes ? HEX_T : HEX_F); return E.tf(`True or false? ${s}`, yes, w); }
      if (mode === 1) return ordQ(R, `Put the steps for stepping the radius around a circle in order.`,
        [`Draw a circle with center ${Oc}, and keep the compass at that width.`, `Mark any point ${H[0]} on the circle.`, `With center ${H[0]}, draw an arc crossing the circle at ${H[1]}.`, `With center ${H[1]}, draw an arc crossing the circle at ${H[2]}.`, `Keep stepping around until you land back on ${H[0]}.`],
        [[], [0], [1], [2]], `Each step starts where the last one landed, all with the radius width.`);
      const r = R.int(2, 12), k = R.int(1, 5), vis = draw(K.xform(hexFig(H, Oc, 3, { steps: k, tilt }).pts, 0, false), hexFig(H, Oc, 3, { steps: k, tilt }));
      const q = R.int(0, 2);
      if (q === 0) return E.num(`A circle with center ${Oc} has radius ${r} ${u}. Without changing the compass, you step from ${H[0]} around the circle. How long is the chord ${H[0]}${H[1]}?`, [{ label: `${H[0]}${H[1]} =`, ans: r }], `Each step is one compass width, which is the radius: ${r} ${u}.`, { visual: vis });
      if (q === 1) return E.num(`You step the radius of a circle (${r} ${u}) around it, starting at ${H[0]}. How many steps until you land back on ${H[0]}?`, [{ ans: 6 }], `Each step cuts off 60° (an equilateral triangle with the center), and 360° ÷ 60° = 6.`, { visual: vis });
      return E.num(`A circle with center ${Oc} has radius ${r} ${u}, and ${H[0]}${H[1]} is one step of the radius. Find ∠${H[0]}${Oc}${H[1]}.`, [{ ans: 60 }], `${Oc}${H[0]} = ${Oc}${H[1]} = ${H[0]}${H[1]} = ${r}, so △${Oc}${H[0]}${H[1]} is equilateral and the angle is 60°.`, { visual: vis }); } },
    b: { t: 'regular hexagon', g: (R, O) => {
      const u = U(O), mode = R.pick([0, 1, 2, 2, 3, 4]), { O: Oc, H } = hexNames(R), tilt = R.int(0, 71) * 5, r = R.int(2, 10), F = hexFig(H, Oc, 3, { join: 'hex', tilt }), vis = draw(F.pts, F), hx = H.join('');
      if (mode === 0) { const back = R.bool(0.4);
        if (back) return E.num(`Regular hexagon ${hx} is constructed by stepping the radius around a circle. Its perimeter is ${6 * r} ${u}. Find the radius.`, [{ label: 'r =', ans: r }], `Each side equals the radius, so r = ${6 * r} ÷ 6 = ${r} ${u}.`, { visual: vis });
        return E.num(`Regular hexagon ${hx} is constructed in a circle of radius ${r} ${u}. Find its perimeter.`, [{ ans: 6 * r }], `Each side is one step of the radius: 6 × ${r} = ${6 * r} ${u}.`, { visual: vis }); }
      if (mode === 1) return E.num(`Regular hexagon ${hx} is constructed in a circle with center ${Oc}. Find ∠${H[0]}${H[1]}${H[2]}.`, [{ ans: 120 }], `Each angle of the hexagon is made of two 60° angles of equilateral triangles: 120°.`, { visual: vis });
      if (mode === 2) return E.num(`Regular hexagon ${hx} is constructed in a circle with center ${Oc} and radius ${r} ${u}. Find its exact area.`, [{ label: 'area =', exact: kSqD(3 * r * r, 3, 2) }],
        `It is six equilateral triangles of side ${r}, each of area (√3/4)·${r}²: 6 × √3/4 × ${r * r} = ${PT(kSqD(3 * r * r, 3, 2))}.`, { visual: vis });
      if (mode === 3) { const long = R.bool(); return E.num(`Regular hexagon ${hx} is constructed in a circle of radius ${r} ${u}. Find the exact length of diagonal ${long ? H[0] + H[3] : H[0] + H[2]}.`, [{ exact: long ? String(2 * r) : kSqD(r, 3) }],
        long ? `${H[0]} and ${H[3]} are opposite, so ${H[0]}${H[3]} is a diameter: ${2 * r}.` : `∠${H[0]}${H[1]}${H[2]} = 120° with sides ${r}, so ${H[0]}${H[2]} = ${r}√3 (two 30-60-90 halves).`, { visual: vis }); }
      const tri = R.bool(0.4), F2 = hexFig(H, Oc, 3, { join: tri ? 'tri' : 'hex', tilt });
      return E.choice(R, `The radius is stepped around the circle and some points are joined. What does this construction make?`, tri ? 'An equilateral triangle' : 'A regular hexagon', tri ? ['A regular hexagon', 'A square', 'A right triangle'] : ['An equilateral triangle', 'A square', 'A regular octagon'],
        tri ? 'Joining every other step point skips 120° each time, giving three equal sides: an equilateral triangle.' : 'Joining all six step points gives six equal sides and angles: a regular hexagon.', { visual: draw(F2.pts, F2) }); } },
    c: { t: 'equilateral triangle', g: (R, O) => {
      const u = U(O), mode = R.pick([0, 0, 1, 2, 3, 4]), { O: Oc, H } = hexNames(R), tilt = R.int(0, 71) * 5, r = R.int(2, 10), F = hexFig(H, Oc, 3, { join: 'tri', tilt }), vis = draw(F.pts, F), tn = `△${H[0]}${H[2]}${H[4]}`;
      if (mode === 0) return E.num(`${tn} is constructed by joining every other step of the radius around a circle of radius ${r} ${u}. Find the exact side length.`, [{ exact: kSqD(r, 3) }],
        `Each side spans two 60° steps, a 120° arc. In isosceles △${Oc}${H[0]}${H[2]} with apex 120°: side = ${r}√3.`, { visual: vis });
      if (mode === 1) return E.num(`${tn} is constructed in a circle of radius ${r} ${u} by joining every other step point. Find its exact perimeter.`, [{ exact: kSqD(3 * r, 3) }], `Each side is ${r}√3, so the perimeter is 3 × ${r}√3 = ${PT(kSqD(3 * r, 3))}.`, { visual: vis });
      if (mode === 2) return E.num(`${tn} is constructed in a circle with center ${Oc} and radius ${r} ${u}. Find its exact area.`, [{ label: 'area =', exact: kSqD(3 * r * r, 3, 4) }],
        `It is three triangles like △${Oc}${H[0]}${H[2]}, each ½ · ${r} · ${r} · sin 120° = (√3/4)·${r * r}: total ${PT(kSqD(3 * r * r, 3, 4))}.`, { visual: vis });
      if (mode === 3) { const a = R.bool(); return E.num(a ? `${tn} is constructed by joining every other step point. Find the measure of arc ${H[0]}${H[1]}${H[2]}.` : `${tn} is constructed by joining every other step point around a circle with center ${Oc}. Find ∠${H[0]}${Oc}${H[2]}.`, [{ ans: 120 }],
        `The triangle's side spans two 60° steps: 120°.`, { visual: vis }); }
      const k = R.int(2, 12); return E.num(`An equilateral triangle constructed in a circle has side ${k}√3 ${u}. Find the radius of the circle.`, [{ label: 'r =', ans: k }], `The side of the inscribed equilateral triangle is r√3, so r = ${k}.`, { visual: vis }); } },
    d: { t: 'justify', g: R => {
      const mode = R.pick([0, 0, 1, 1, 2]), { O: Oc, H } = hexNames(R), [A, B] = H, tilt = R.int(0, 71) * 5, F = hexFig(H, Oc, 3, { steps: 1, tilt, show: [0, 1], segs: [[Oc, A, THIN], [Oc, B, THIN], [A, B, THIN]] }), vis = draw(F.pts, F);
      if (mode === 0) return E.choice(R, `${A}${B} is one step of the radius around the circle with center ${Oc}. Why is ∠${A}${Oc}${B} = 60°?`, `${Oc}${A} = ${Oc}${B} = ${A}${B}, so △${Oc}${A}${B} is equilateral.`,
        [`${A}${B} is a diameter of the circle.`, `△${Oc}${A}${B} is isosceles, so every angle is 60°.`, `The arc ${A}${B} is one quarter of the circle.`],
        `${Oc}${A} and ${Oc}${B} are radii, and ${A}${B} is one compass width, also the radius. An equilateral triangle has 60° angles. (Being isosceles alone is not enough.)`, { visual: vis });
      if (mode === 1) return ordQ(R, `Put the lines of the proof that six steps of the radius close up exactly in order.`,
        [`${Oc}${A} = ${Oc}${B} <i>(radii)</i>`, `${A}${B} = ${Oc}${A} <i>(compass not changed)</i>`, `△${Oc}${A}${B} is equilateral`, `∠${A}${Oc}${B} = 60°`, `Six such steps make 6 × 60° = 360°, so the sixth lands on ${A}`],
        [[], [], [0, 1], [2]], 'The two equal-length facts can come in either order; together they make the triangle equilateral, which gives 60°, and six of those make the full turn.', vis);
      const yes = R.bool(), [s, w] = R.pick(yes ? HEX_T : HEX_F); return E.tf(`True or false? ${s}`, yes, w); } },
    e: { t: 'circle theorems on the hexagon', g: R => {
      const { O: Oc, H } = hexNames(R), tilt = R.int(0, 71) * 5;
      if (R.bool(0.3)) { const r = R.int(2, 10), k = R.int(0, 2), ans = [3 * r * r, 30, 150][k];
        const ask = [`Find the area of the 12-gon.`, `Find the central angle of one side of the 12-gon.`, `Find each interior angle of the 12-gon.`][k];
        return E.num(`After stepping the radius around a circle of radius ${r} to get a regular hexagon, you bisect each of the six arcs. The twelve points form a regular 12-gon. ${ask}`, [{ ans }],
          [`It is 12 triangles with two sides ${r} and a 30° angle between: 12 × ½ × ${r}² × sin 30° = 3 × ${r * r} = ${3 * r * r}.`, `Each 60° arc is halved: 30°.`, `Each angle is (12 − 2) × 180° ÷ 12 = 150°.`][k]); }
      let i, j, k; do { [i, j, k] = R.sample([0, 1, 2, 3, 4, 5], 3); } while (false);
      const steps = (() => { const kk = K.md((k - i) * 60) / 60; return K.md((j - i) * 60) / 60 < kk ? 6 - kk : kk; })(), ans = 30 * steps;
      const F = hexFig(H, Oc, 3, { join: 'hex', tilt, segs: [[H[j], H[i], { color: C.red, width: 2.4 }], [H[j], H[k], { color: C.red, width: 2.4 }]] });
      return E.num(`Regular hexagon ${H.join('')} is constructed by stepping the radius around the circle. Find ∠${H[i]}${H[j]}${H[k]}.`, [{ ans }],
        `∠${H[i]}${H[j]}${H[k]} is inscribed and cuts off the arc from ${H[i]} to ${H[k]} away from ${H[j]}: ${steps} step${steps > 1 ? 's' : ''} of 60° = ${60 * steps}°. An inscribed angle is half its arc: ${ans}°.`, { visual: draw(F.pts, F) }); } },
    f: { t: 'the six-pointed star', g: R => {
      const { O: Oc, H } = hexNames(R), tilt = R.int(0, 71) * 5, r = R.int(2, 9), k = R.int(0, 3), F = hexFig(H, Oc, 3, { tilt, steps: 6 });
      F.marks = []; for (let q = 0; q < 6; q++) F.segs.push([F.nmOf(q), F.nmOf(q + 2), BLUE]);
      for (let q = 0; q < 6; q++) F.pts[`_i${q}`] = polar(3 / Math.sqrt(3), tilt + 30 + 60 * q);
      F.polys = [[...[0, 1, 2, 3, 4, 5].flatMap(q => [F.nmOf(q), `_i${q}`]), { fill: C.amber, opacity: 0.25 }]];
      const ask = ['the area of the star', 'the area of the small hexagon in the middle', 'the area of one point of the star (one small triangle)', 'the fraction of the big hexagon covered by the star'][k];
      const fld = [{ exact: kSqD(r * r, 3) }, { exact: kSqD(r * r, 3, 2) }, { exact: kSqD(r * r, 3, 12) }, { frac: [2, 3] }][k];
      const why = [`The star's sides cut each triangle side into thirds, so the middle hexagon has side ${r}/√3 and the star is 12 small equilateral triangles of side ${r}/√3, each (√3/4)(${r * r}/3): 12 × √3·${r * r}/12 = ${PT(kSqD(r * r, 3))}.`,
        `The middle hexagon has side ${r}√3 ÷ 3 = ${r}/√3 (each triangle side is cut into thirds): area 6 × (√3/4) × ${r * r}/3 = ${PT(kSqD(r * r, 3, 2))}.`,
        `Each point is an equilateral triangle of side ${r}/√3 (a third of the big triangle's side ${r}√3): (√3/4) × ${r * r}/3 = ${PT(kSqD(r * r, 3, 12))}.`,
        `The star is 12 small triangles; the big hexagon is those 12 plus 6 more in its notches, 18 in all. 12/18 = 2/3.`][k];
      return E.num(`Two equilateral triangles are constructed in a circle of radius ${r} by joining alternate step points of the radius, making a six-pointed star. Find ${ask}.${k < 3 ? ' Give an exact answer.' : ''}`, [fld], why, { visual: draw(F.pts, F) }); } },
  });

  /* ================= V.15.07 Square in a circle ================= */
  const DIA_T = [['Every diameter passes through the center.', 'A diameter is a chord through the center.'], ['A diameter is the longest chord of a circle.', 'The chord through the center is the longest.'], ['Two diameters of one circle bisect each other.', 'They meet at the center, which is the midpoint of each.'], ['Every diameter is twice as long as a radius.', 'It is two radii laid end to end through the center.']];
  const DIA_F = [['A circle has exactly two diameters.', 'Any line through the center makes a diameter, so there are infinitely many.'], ['Every chord of a circle is a diameter.', 'Only a chord through the center is a diameter; other chords are shorter.'], ['A diameter is half as long as a radius.', 'A diameter is twice the radius.'], ['A radius is a chord of the circle.', 'A chord has both endpoints on the circle; a radius has one end at the center.']];
  const sqNames = R => { const L = lets(R, 5); return { A: L[0], C: L[1], B: L[2], D: L[3], O: L[4] }; };
  S('V.15.07', 'Square in a circle', {
    a: { t: 'draw a diameter', g: (R, O) => {
      const u = U(O), mode = R.pick([0, 0, 1, 2, 2]), n = sqNames(R), tf = rig(R), vis = show(tf, sqFig(n, 3, { stage: 1 }));
      if (mode === 2) { const yes = R.bool(), [s, w] = R.pick(yes ? DIA_T : DIA_F); return E.tf(`True or false? ${s}`, yes, w); }
      if (mode === 0) { const r = R.int(2, 15) + (R.bool(0.2) ? 0.5 : 0), back = R.bool();
        if (back) return E.num(`${n.A}${n.B} is a diameter of the circle with center ${n.O}, and ${n.A}${n.B} = ${2 * r} ${u}. Find ${n.O}${n.A}.`, [{ ans: r }], `${n.O} is the midpoint of the diameter: ${2 * r} ÷ 2 = ${r} ${u}.`, { visual: vis });
        return E.num(`The circle with center ${n.O} has radius ${r} ${u}. A line through ${n.O} meets the circle at ${n.A} and ${n.B}. Find ${n.A}${n.B}.`, [{ ans: 2 * r }], `${n.A}${n.B} passes through the center, so it is a diameter: 2 × ${r} = ${2 * r} ${u}.`, { visual: vis }); }
      let x, p, s, q, t; do { x = R.int(2, 9); p = R.int(2, 6); s = R.int(1, 5); q = R.int(-9, 9); t = (p - s) * x + q; } while (p === s || !q || !t || p * x + q <= 0 || Math.abs(t) > 25);
      return E.num(`${n.A}${n.B} is a diameter of the circle with center ${n.O}. ${M(`${n.O}${n.A}=${E.poly([p, q])}`)} and ${M(`${n.O}${n.B}=${E.poly([s, t])}`)}. Find ${n.A}${n.B}.`, [{ label: `${n.A}${n.B} =`, ans: 2 * (p * x + q) }],
        `Both are radii: ${M(`${E.poly([p, q])}=${E.poly([s, t])}`)}, so x = ${x}, each radius is ${p * x + q}, and ${n.A}${n.B} = ${2 * (p * x + q)}.`, { visual: vis }); } },
    b: { t: 'perpendicular diameter', g: R => {
      const mode = R.pick([0, 0, 1, 2, 3]), n = sqNames(R), tf = rig(R);
      if (mode === 0) return ordQ(R, `Put the steps for constructing two perpendicular diameters in order.`,
        [`Draw a line through ${n.O} meeting the circle at ${n.A} and ${n.B}.`, `Open the compass wider than ${n.O}${n.A}, and keep that width.`, `With center ${n.A}, draw arcs on both sides of ${n.A}${n.B}.`, `With center ${n.B}, draw arcs on both sides of ${n.A}${n.B}.`, `Draw the line through the two crossings; it meets the circle at ${n.C} and ${n.D}.`],
        [[], [0], [1], [1]], `This is the perpendicular bisector of the diameter ${n.A}${n.B}; the arcs from ${n.A} and ${n.B} can come in either order.`, show(tf, sqFig(n, 3, { arcs: true })));
      const vis = show(tf, sqFig(n, 3, { arcs: true }));
      if (mode === 1) { const k = R.int(0, 3), ask = [`arc ${n.A}${n.C}`, `∠${n.A}${n.O}${n.D}`, `arc ${n.A}${n.C}${n.B}`, `∠${n.C}${n.A}${n.B}`][k], ans = [90, 90, 180, 45][k];
        return E.num(`${n.C}${n.D} is constructed as the perpendicular bisector of diameter ${n.A}${n.B}. Find ${ask}.`, [{ ans }],
          [`The diameters are perpendicular, so they cut the circle into four 90° arcs.`, `The diameters meet at 90° at ${n.O}.`, `Arc ${n.A}${n.C}${n.B} is a semicircle: 180°.`, `∠${n.C}${n.A}${n.B} is inscribed and cuts off arc ${n.C}${n.B} = 90°, so it is 45°.`][k], { visual: vis }); }
      if (mode === 2) return E.choice(R, `Why does the perpendicular bisector of diameter ${n.A}${n.B} pass through the center ${n.O}?`, `${n.O} is the midpoint of ${n.A}${n.B}.`, [`${n.O} lies on the circle.`, `${n.O}${n.A} ⊥ ${n.A}${n.B}.`, `The arcs were drawn from ${n.O}.`],
        `The perpendicular bisector passes through the midpoint of ${n.A}${n.B}, and the center is the midpoint of every diameter.`, { visual: vis });
      return E.choice(R, `What does this construction make?`, `A second diameter, perpendicular to ${n.A}${n.B}`, [`A tangent to the circle at ${n.A}`, `A chord parallel to ${n.A}${n.B}`, `The bisector of ∠${n.A}${n.O}${n.B}`],
        `Equal arcs from ${n.A} and ${n.B} give the perpendicular bisector of ${n.A}${n.B}, which passes through ${n.O}: a perpendicular diameter.`, { visual: vis }); } },
    c: { t: 'join the ends', g: (R, O) => {
      const u = U(O), mode = R.pick([0, 0, 1, 2, 3, 4]), n = sqNames(R), tf = rig(R), r = R.int(2, 10), vis = show(tf, sqFig(n, 3, { join: true })), sq = `${n.A}${n.C}${n.B}${n.D}`;
      if (mode === 0) return E.num(`Square ${sq} is constructed in a circle of radius ${r} ${u}. Find the exact side length.`, [{ exact: kSqD(r, 2) }], `Each side joins the ends of two perpendicular radii: √(${r}² + ${r}²) = ${PT(kSqD(r, 2))}.`, { visual: vis });
      if (mode === 1) return E.num(`Square ${sq} is constructed in a circle of radius ${r} ${u}. Find its area.`, [{ label: 'area =', ans: 2 * r * r }], `Its diagonals are diameters, ${2 * r} long: area = ½ × ${2 * r} × ${2 * r} = ${2 * r * r}.`, { visual: vis });
      if (mode === 2) return E.num(`Square ${sq} is constructed in a circle of radius ${r} ${u}. Find its exact perimeter.`, [{ exact: kSqD(4 * r, 2) }], `Each side is ${r}√2, so the perimeter is ${PT(kSqD(4 * r, 2))}.`, { visual: vis });
      if (mode === 3) { const s = R.int(2, 14), irr = R.bool();
        return E.num(`A square constructed in a circle has side ${irr ? `${s}√2` : s} ${u}. Find the exact radius of the circle.`, [{ label: 'r =', exact: irr ? String(s) : kSqD(s, 2, 2) }],
          `The diagonal is the diameter: ${irr ? `${s}√2 × √2 = ${2 * s}` : `${s}√2`}, so r = ${PT(irr ? String(s) : kSqD(s, 2, 2))}.`, { visual: vis }); }
      return E.num(`A square constructed in a circle has area ${2 * r * r} ${u}². Find the radius of the circle.`, [{ label: 'r =', ans: r }], `Area = ½ d² with d the diameter: d² = ${4 * r * r}, d = ${2 * r}, so r = ${r}.`, { visual: vis }); } },
    d: { t: 'justify', g: (R, O) => {
      const u = U(O), mode = R.pick([0, 0, 1, 2, 2, 3, 3]), n = sqNames(R), tf = rig(R);
      if (mode === 3) { const sq4 = `${n.A}${n.C}${n.B}${n.D}`;
        return K.orderQ(R, `Put the lines of the proof that ${sq4} is a square in order.`, [`${n.A}${n.B} and ${n.C}${n.D} are diameters of the circle with center ${n.O}, and ${n.A}${n.B} ⊥ ${n.C}${n.D} <i>(given)</i>`, `${n.O}${n.A} = ${n.O}${n.B} = ${n.O}${n.C} = ${n.O}${n.D} <i>(radii)</i>`,
          `The diagonals ${n.A}${n.B} and ${n.C}${n.D} bisect each other at ${n.O} <i>(line 2)</i>`, `${n.A}${n.B} = ${n.C}${n.D} <i>(both are diameters)</i>`, `${sq4} is a rectangle <i>(diagonals equal and bisecting each other)</i>`, `${sq4} is a square <i>(a rectangle with perpendicular diagonals)</i>`],
          [[], [0], [1], [0], [2, 3], [4]], 'The radii make the diagonals bisect each other; being diameters makes them equal, so it is a rectangle; perpendicular diagonals then make the rectangle a square. The equal-diagonals line can come anywhere after the given.', { fixed: 1, visual: show(tf, sqFig(n, 3, { join: true })) }); }
      if (mode === 0) { const sqr = R.bool(); let t = 90; if (!sqr) do { t = R.int(40, 140); } while (t > 78 && t < 102);
        const vis = show(tf, sqFig(n, 3, { t, join: true, angles: [[n.B, n.O, n.C, deg(t)]] }));
        return E.choiceFixed(`Diameters ${n.A}${n.B} and ${n.C}${n.D} meet at ${t}°, and their ends are joined. What shape is ${n.A}${n.C}${n.B}${n.D}?`, ['A square', 'A rectangle that is not a square', 'A rhombus that is not a square'], sqr ? 0 : 1,
          sqr ? 'Its diagonals are equal (diameters), bisect each other, and are perpendicular: a square.' : `Its diagonals are equal and bisect each other, so it is a rectangle; they are not perpendicular (${t}°), so it is not a square.`, { visual: vis }); }
      if (mode === 1) return E.choice(R, `${n.A}${n.B} and ${n.C}${n.D} are perpendicular diameters. Which reason proves ${n.A}${n.C}${n.B}${n.D} is a square?`, 'Its diagonals are equal, bisect each other, and are perpendicular.',
        ['Its diagonals are perpendicular.', 'Its diagonals bisect each other.', 'Its diagonals are equal and bisect each other.'], 'Equal diagonals that bisect each other make a rectangle; adding perpendicular makes it a square. Fewer facts only give a kite, a parallelogram or a rectangle.', { visual: show(tf, sqFig(n, 3, { join: true })) });
      const t = R.pick([30, 45, 60, 90, 120, 135, 150]), r = R.int(2, 9), s = t === 90 ? 'sq' : t % 90 === 30 || t % 90 === 60 ? (t === 30 || t === 150 ? 'h' : 'r3') : 'r2';
      const ans = s === 'sq' ? String(2 * r * r) : s === 'h' ? String(r * r) : s === 'r3' ? kSqD(r * r, 3) : kSqD(r * r, 2), sn = { 30: '½', 150: '½', 45: '√2/2', 135: '√2/2', 60: '√3/2', 120: '√3/2', 90: '1' }[t];
      const vis = show(tf, sqFig(n, 3, { t, join: true, angles: [[n.B, n.O, n.C, deg(t)]] }));
      return E.num(`Diameters ${n.A}${n.B} and ${n.C}${n.D} of a circle of radius ${r} ${u} meet at ${t}°. Find the exact area of ${n.A}${n.C}${n.B}${n.D}.`, [{ label: 'area =', exact: ans }],
        `The diameters split it into four triangles with two sides ${r}, each ½ × ${r}² × sin ${t}° (sin ${t}° = ${sn}). Total: 2 × ${r * r} × ${sn} = ${PT(ans)}.`, { visual: vis }); } },
  });

  /* ================= V.15.08 Tangent from a point ================= */
  const tnNames = R => { const L = lets(R, 6); return { O: L[0], P: L[1], M: L[2], T: L[3], U: L[4], X: L[5] }; };
  S('V.15.08', 'Tangent from a point', {
    a: { t: 'midpoint to the center', g: (R, O) => {
      const u = U(O), mode = R.pick([0, 0, 1, 2]), n = tnNames(R), tf = rig(R), vis = show(tf, tanFig(n, 2, 5.2, { stage: 1, bis: true }));
      if (mode === 0) { const d = R.int(4, 24); return E.num(`To draw tangents from ${n.P} to a circle with center ${n.O}, you first bisect ${n.O}${n.P} at ${n.M}. ${n.O}${n.P} = ${d} ${u}. Find ${n.O}${n.M}.`, [{ label: `${n.O}${n.M} =`, ans: d / 2 }], `${n.M} is the midpoint: ${d} ÷ 2 = ${d / 2} ${u}.`, { visual: vis }); }
      if (mode === 1) { let a, b, c, d; do { a = R.int(-8, 8); b = R.int(-8, 8); c = R.int(-8, 8); d = R.int(-8, 8); } while ((a + c) % 2 || (b + d) % 2 || Math.hypot(c - a, d - b) < 6);
        return E.num(`The circle has center ${n.O}(${a}, ${b}) and ${n.P} = (${c}, ${d}) is outside it. The tangent construction starts with the midpoint ${n.M} of ${n.O}${n.P}. Find ${n.M}.`, [{ point: [String((a + c) / 2), String((b + d) / 2)] }],
          `Average the coordinates: ((${a} + ${c})/2, (${b} + ${d})/2) = (${(a + c) / 2}, ${(b + d) / 2}).`); }
      let x, p, s, q, t; do { x = R.int(2, 9); p = R.int(2, 6); s = R.int(1, 5); q = R.int(-9, 9); t = (p - s) * x + q; } while (p === s || !q || !t || p * x + q <= 0 || Math.abs(t) > 25);
      return E.num(`${n.M} is the constructed midpoint of ${n.O}${n.P}. ${M(`${n.O}${n.M}=${E.poly([p, q])}`)} and ${M(`${n.M}${n.P}=${E.poly([s, t])}`)}. Find ${n.O}${n.P}.`, [{ label: `${n.O}${n.P} =`, ans: 2 * (p * x + q) }],
        `The halves are equal: ${M(`${E.poly([p, q])}=${E.poly([s, t])}`)}, so x = ${x} and ${n.O}${n.P} = 2 × ${p * x + q} = ${2 * (p * x + q)}.`, { visual: vis }); } },
    b: { t: 'circle on that segment', g: (R, O) => {
      const u = U(O), mode = R.pick([0, 0, 1, 1, 2]), n = tnNames(R), tf = rig(R), vis = show(tf, tanFig(n, 2, 5.2, { stage: 2 }));
      if (mode === 1) { const T = [[`passes through ${n.O}`, `${n.O} is an end of the diameter ${n.O}${n.P}.`], [`passes through ${n.P}`, `${n.P} is an end of the diameter ${n.O}${n.P}.`], [`has its center at the midpoint of ${n.O}${n.P}`, `That is how it was drawn: center ${n.M}, the midpoint.`]];
        const F = [[`always has the same radius as the given circle`, `Its radius is half of ${n.O}${n.P}, which depends on how far ${n.P} is.`], [`is tangent to the given circle`, `It crosses the given circle at two points, ${n.T} and ${n.U}.`], [`has center ${n.O}`, `Its center is ${n.M}, the midpoint of ${n.O}${n.P}.`]];
        const yes = R.bool(), [s, w] = R.pick(yes ? T : F); return E.tf(`The dashed circle is drawn on diameter ${n.O}${n.P}. True or false? It ${s}.`, yes, w, { visual: vis }); }
      const d = R.int(4, 26), r = Math.max(1, Math.floor(d / 2) - R.int(1, 3));
      if (mode === 2) return E.num(`${n.O}${n.P} = ${d} ${u}. The dashed circle on diameter ${n.O}${n.P} crosses the given circle at ${n.T}. Find ${n.M}${n.T}.`, [{ label: `${n.M}${n.T} =`, ans: d / 2 }], `${n.T} is on the dashed circle, whose radius is half of ${n.O}${n.P}: ${d / 2} ${u}.`, { visual: vis });
      return E.num(`The given circle has center ${n.O} and radius ${r} ${u}, and ${n.O}${n.P} = ${d} ${u}. What radius do you use for the circle on diameter ${n.O}${n.P}?`, [{ ans: d / 2 }], `It is centered at the midpoint ${n.M}, so its radius is ${d} ÷ 2 = ${d / 2} ${u}. The given radius ${r} plays no part.`, { visual: vis }); } },
    c: { t: 'draw tangents', g: (R, O) => {
      const u = U(O), mode = R.pick([0, 0, 1, 2, 3]), n = tnNames(R), tf = rig(R);
      if (mode === 0) { const [r0, t0, d0] = R.pick(TRIP), vis = show(tf, tanFig(n, r0, d0, { radii: true, one: true }));
        return E.num(`The circle has center ${n.O} and radius ${r0} ${u}, and ${n.O}${n.P} = ${d0} ${u}. ${n.P}${n.T} is a constructed tangent. Find ${n.P}${n.T}.`, [{ label: `${n.P}${n.T} =`, ans: t0 }],
          `∠${n.O}${n.T}${n.P} = 90°, so ${n.P}${n.T} = √(${d0}² − ${r0}²) = ${t0} ${u}.`, { visual: vis }); }
      if (mode === 1) { const pos = R.int(0, 2), r = R.int(3, 10), d = pos === 0 ? R.int(1, r - 1) : pos === 1 ? r : r + R.int(1, 8);
        const pts = { [n.O]: [0, 0], [n.P]: [d, 0] }, vis = draw(tf(pts), { circ: [{ c: n.O, r }], segs: [[n.O, n.P, THIN]], label: 'a circle and a point' });
        return E.choiceFixed(`The circle has radius ${r} ${u}, and ${n.P} is ${d} ${u} from its center ${n.O}. How many tangents to the circle pass through ${n.P}?`, ['0', '1', '2'], pos,
          ['P is inside the circle, so every line through it crosses the circle twice: no tangents.', 'P is on the circle, so there is exactly one tangent, perpendicular to the radius there.', 'P is outside the circle, so there are two tangents.'][pos].replace(/P/g, n.P), { visual: vis }); }
      if (mode === 2) return ordQ(R, `Put the steps for constructing the tangents from ${n.P} to the circle with center ${n.O} in order.`,
        [`Draw segment ${n.O}${n.P}.`, `Bisect ${n.O}${n.P} to find its midpoint ${n.M}.`, `Draw the circle with center ${n.M} through ${n.O} and ${n.P}.`, `Label where it crosses the given circle ${n.T} and ${n.U}.`, `Draw lines ${n.P}${n.T} and ${n.P}${n.U}: the tangents.`],
        [[], [0], [1], [2]], `Each step needs the one before: segment, midpoint, circle on ${n.O}${n.P}, crossing points, tangents.`, show(tf, tanFig(n, 2, 5.2)));
      const vis = show(tf, tanFig(n, 2, R.pick([4.6, 5.2, 5.8])));
      return E.choice(R, `What does this construction make?`, `The two tangents from ${n.P} to the circle`, [`Two radii of the circle`, `The perpendicular bisector of ${n.O}${n.P}`, `Two chords of the dashed circle that meet at its center`],
        `The circle on diameter ${n.O}${n.P} meets the given circle where ∠${n.O}${n.T}${n.P} = 90°, so ${n.P}${n.T} and ${n.P}${n.U} touch the circle: they are the tangents.`, { visual: vis }); } },
    d: { t: 'justify with the semicircle angle', g: R => {
      const mode = R.pick([0, 0, 1, 2, 3]), n = tnNames(R), tf = rig(R);
      if (mode === 0) { const al = R.int(18, 52), d = 2 / Math.sin(K.rad(al)), vis = show(tf, tanFig(n, 2, d, { radii: true, one: true, angles: [[n.O, n.P, n.T, deg(al)]] }));
        return E.num(`${n.P}${n.T} is a constructed tangent to the circle with center ${n.O}. ∠${n.O}${n.P}${n.T} = ${al}°. Find ∠${n.P}${n.O}${n.T}.`, [{ ans: 90 - al }], `∠${n.O}${n.T}${n.P} = 90° (angle in a semicircle on ${n.O}${n.P}), so ∠${n.P}${n.O}${n.T} = 180° − 90° − ${al}° = ${90 - al}°.`, { visual: vis }); }
      const vis = show(tf, tanFig(n, 2, 5.2, { radii: true }));
      if (mode === 1) return E.choice(R, `${n.T} is on the circle with diameter ${n.O}${n.P}. Why is ∠${n.O}${n.T}${n.P} = 90°?`, 'An angle inscribed in a semicircle is a right angle.',
        ['A tangent is perpendicular to the radius at the point of contact.', 'Base angles of an isosceles triangle are equal.', 'Vertical angles are equal.'], `∠${n.O}${n.T}${n.P} is inscribed in the circle on diameter ${n.O}${n.P}. (Using the tangent-radius fact would assume what we want to prove.)`, { visual: vis });
      if (mode === 2) return E.choice(R, `∠${n.O}${n.T}${n.P} = 90° and ${n.T} is on the circle with center ${n.O}. Why is ${n.P}${n.T} a tangent?`, 'A line perpendicular to a radius at its endpoint on the circle is a tangent.',
        ['A line through a point outside a circle is always a tangent.', 'An angle inscribed in a semicircle is a right angle.', `${n.P}${n.T} = ${n.P}${n.U}, so both lines are tangents.`], `${n.O}${n.T} is a radius and ${n.P}${n.T} ⊥ ${n.O}${n.T} at ${n.T}, so ${n.P}${n.T} touches the circle only at ${n.T}.`, { visual: vis });
      const F = tanFig(n, 2, 5.2, { one: true, radii: true }); F.pts[n.X] = [2, 0];
      return E.choice(R, `Which point is the point where the tangent from ${n.P} touches the circle?`, n.T, [n.X, n.M], `The tangent touches at ${n.T}, where the radius meets it at 90°. ${n.X} is where line ${n.O}${n.P} crosses the circle; a line through ${n.X} toward ${n.P} goes through the center, so it is not tangent.`, { visual: show(tf, F) }); } },
    e: { t: 'both tangents at once', g: (R, O) => {
      const u = U(O), k = R.int(0, 2), n = tnNames(R), tf = rig(R);
      if (k === 1) { const al = R.int(14, 40), d = 2 / Math.sin(K.rad(al)), vis = show(tf, tanFig(n, 2, d, { radii: true, angles: [[n.T, n.P, n.U, deg(2 * al)]] }));
        return E.num(`${n.P}${n.T} and ${n.P}${n.U} are the constructed tangents from ${n.P}, and ∠${n.T}${n.P}${n.U} = ${2 * al}°. Find ∠${n.T}${n.O}${n.U}.`, [{ ans: 180 - 2 * al }],
          `In quadrilateral ${n.O}${n.T}${n.P}${n.U} the angles at ${n.T} and ${n.U} are 90°, so ∠${n.T}${n.O}${n.U} = 360° − 180° − ${2 * al}° = ${180 - 2 * al}°.`, { visual: vis }); }
      const [r0, t0, d0] = R.pick(TRIP), vis = show(tf, tanFig(n, r0, d0, { radii: true, segs: k === 2 ? [[n.T, n.U, { color: C.red, width: 2.2 }]] : [] }));
      if (k === 0) return E.num(`The circle has center ${n.O} and radius ${r0} ${u}, and ${n.O}${n.P} = ${d0} ${u}. ${n.P}${n.T} and ${n.P}${n.U} are the constructed tangents. Find the area of kite ${n.O}${n.T}${n.P}${n.U}.`, [{ label: 'area =', ans: r0 * t0 }],
        `${n.P}${n.T} = √(${d0}² − ${r0}²) = ${t0}. The kite is two right triangles, each ½ × ${r0} × ${t0}: area = ${r0} × ${t0} = ${r0 * t0}.`, { visual: vis });
      const g = E.gcd(2 * r0 * t0, d0);
      return E.num(`The circle has center ${n.O} and radius ${r0} ${u}, and ${n.O}${n.P} = ${d0} ${u}. ${n.P}${n.T} and ${n.P}${n.U} are the constructed tangents. Find the length of chord ${n.T}${n.U}.`, [{ label: `${n.T}${n.U} =`, frac: [2 * r0 * t0 / g, d0 / g] }],
        `${n.P}${n.T} = ${t0}. ${n.O}${n.P} cuts ${n.T}${n.U} at right angles in half; that half is the height of right △${n.O}${n.T}${n.P} onto ${n.O}${n.P}: ${r0} × ${t0} ÷ ${d0}. So ${n.T}${n.U} = 2 × ${r0} × ${t0} ÷ ${d0} = ${E.fracStr(2 * r0 * t0, d0)}.`, { visual: vis }); } },
    f: { t: 'common tangents of two circles', g: (R, O) => {
      const u = U(O), inner = R.bool(), [Aa, B, Tn, Uu] = lets(R, 4);
      let r1, r2, d, t; do { const [p, q, h] = R.pick(TRIP), m = R.bool() ? p : q; t = m === p ? q : p; d = h; r1 = R.int(1, inner ? m - 1 : 12); r2 = inner ? m - r1 : r1 + m; } while (r1 < 1 || r2 < 1 || r1 === r2 || r1 + r2 >= d);
      const big = Math.max(r1, r2), sm = Math.min(r1, r2), sc = 6 / d, ph = Math.acos((inner ? r1 + r2 : big - sm) / d);
      const pts = { [Aa]: [0, 0], [B]: [d * sc, 0] }, R1 = (inner ? r1 : big) * sc, R2 = (inner ? r2 : sm) * sc;
      pts[Tn] = polar(R1, K.dg(ph)); pts[Uu] = inner ? add(pts[B], polar(R2, K.dg(ph) + 180)) : add(pts[B], polar(R2, K.dg(ph)));
      const tf = rig(R), vis = draw(tf(pts), { circ: [{ c: Aa, r: R1 }, { c: B, r: R2 }], segs: [[Aa, B, THIN], [Tn, Uu, BLUE], [Aa, Tn, THIN], [B, Uu, THIN]], angles: [[Aa, Tn, Uu, '', { right: true }], [B, Uu, Tn, '', { right: true }]], label: 'two circles with a common tangent' });
      const ra = inner ? r1 : big, rb = inner ? r2 : sm;
      return E.num(`Circles with centers ${Aa} and ${B} have radii ${ra} and ${rb} ${u}, and ${Aa}${B} = ${d} ${u}. ${Tn}${Uu} is a common tangent that ${inner ? 'crosses between' : 'does not cross between'} the circles. Find ${Tn}${Uu}.`, [{ label: `${Tn}${Uu} =`, ans: t }],
        `Slide ${Tn}${Uu} until it starts at ${Aa}: it becomes a tangent from ${Aa} to a circle around ${B} of radius ${inner ? `${ra} + ${rb} = ${ra + rb}` : `${ra} − ${rb} = ${ra - rb}`}. So ${Tn}${Uu} = √(${d}² − ${inner ? ra + rb : ra - rb}²) = ${t} ${u}.`, { visual: vis }); } },
  });

  /* ================= V.15.09 Inscribed & circumscribed circles ================= */
  const HERON = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15], [13, 14, 15], [5, 5, 6], [10, 10, 12], [6, 25, 29], [11, 13, 20], [9, 10, 17], [12, 16, 20], [7, 15, 20], [10, 17, 21]];
  const heron = (a, b, c) => { const s = (a + b + c) / 2; return { s, K: Math.sqrt(s * (s - a) * (s - b) * (s - c)) }; };
  // a triangle figure with its circumcircle (kind 'out') or incircle (kind 'in')
  const centerFig = (R, T, nm, kind, o = {}) => {
    const pts = K.spin(R, T), P = {}; ['A', 'B', 'C'].forEach(k => P[nm[k]] = pts[k]);
    const A = P[nm.A], B = P[nm.B], Cc = P[nm.C], segs = [[nm.A, nm.B], [nm.B, nm.C], [nm.C, nm.A]], angles = [], circ = [];
    if (kind === 'out') { const Oc = K.circum(A, B, Cc); P[o.c || '_o'] = Oc; circ.push({ c: Oc, r: dist(Oc, A) });
      if (o.lines !== false) [[nm.A, nm.B], [nm.B, nm.C], [nm.C, nm.A]].forEach(([p, q], i) => { const m0 = K.mid(P[p], P[q]); P[`_m${i}`] = m0; P[`_n${i}`] = lerp(m0, Oc, dist(m0, Oc) < 0.3 ? 4 : 1.25); if (dist(m0, Oc) < 0.3) P[`_n${i}`] = add(m0, mul(unit([-(P[q][1] - P[p][1]), P[q][0] - P[p][0]]), 1.5)); segs.push([`_m${i}`, `_n${i}`, THIN]); angles.push([p, `_m${i}`, `_n${i}`, '', { right: true }]); }); }
    else { const I = K.incen(A, B, Cc), Fp = K.foot(I, A, B); P[o.c || '_i'] = I; circ.push({ c: I, r: dist(I, Fp) }); if (o.lines !== false) [nm.A, nm.B, nm.C].forEach(v => segs.push([v, o.c || '_i', THIN])); }
    return draw(P, { segs: segs.concat(o.segs || []), circ, angles: angles.concat(o.angles || []), label: kind === 'out' ? 'triangle with its circumscribed circle' : 'triangle with its inscribed circle' });
  };
  const L5 = [[5, 0], [4, 3], [3, 4], [0, 5], [-3, 4], [-4, 3], [-5, 0], [-4, -3], [-3, -4], [0, -5], [3, -4], [4, -3]];
  S('V.15.09', 'Inscribed & circumscribed circles', {
    a: { t: 'circumcenter construction', g: (R, O) => {
      const u = U(O), mode = R.pick([0, 1, 1, 2, 3, 4, 4, 5]), L = K.trio(R), nm = { A: L[0], B: L[1], C: L[2] }, tn = `△${L.join('')}`;
      if (mode >= 4) { // proof: the meeting point of two perpendicular bisectors is the center of a circle through all three vertices
        const [A, B, Cc] = L, PB = 'perpendicular bisector theorem', vis = centerFig(R, K.randTri(R).t, nm, 'out', { c: 'O' });
        const rows = [[`O is where the perpendicular bisectors of ${A}${B} and ${B}${Cc} meet`, 'given'], [`O${A} = O${B}`, PB], [`O${B} = O${Cc}`, PB], [`O${A} = O${Cc}`, 'transitive property'],
          [`O is on the perpendicular bisector of ${A}${Cc} too`, 'converse of the perpendicular bisector theorem'], [`The circle with center O through ${A} also passes through ${B} and ${Cc}`, 'definition of a circle']];
        if (mode === 4) return ordQ(R, `Put the lines of the proof that the circumscribed circle of ${tn} works in order.`, rows.map(r => `${r[0]} <i>(${r[1]})</i>`), [[], [0], [0], [1, 2], [3]],
          `Each perpendicular bisector gives one pair of equal distances; together they give O${A} = O${B} = O${Cc}. So all three vertices are on one circle about O, and O is on the third bisector as well. The two bisector lines can come in either order.`, vis);
        const j = R.pick([3, 4, 5]), W = { 3: [PB, 'reflexive property', 'CPCTC'], 4: [PB, 'angle bisector theorem', 'transitive property'], 5: [PB, 'angle bisector theorem', 'transitive property'] }[j];
        return E.choice(R, `This proof shows that the perpendicular bisectors of the sides of ${tn} meet at the center of a circle through all three vertices. What is the missing reason?${twoCol(rows, j)}`, rows[j][1], W,
          { 3: `O${A} and O${Cc} both equal O${B}, so they equal each other.`, 4: `O is equally far from ${A} and ${Cc}, and a point equidistant from the ends of a segment lies on its perpendicular bisector: the converse. The theorem itself goes the other way.`, 5: `A circle is every point at one distance from its center, and ${A}, ${B} and ${Cc} are all the same distance from O.` }[j], { visual: vis }); }
      if (mode === 0) { const Q = [[`The circumcenter of ${tn} is where these lines meet:`, 'the perpendicular bisectors of the sides', ['the angle bisectors', 'the medians', 'the altitudes']],
        [`The incenter of ${tn} is where these lines meet:`, 'the angle bisectors', ['the perpendicular bisectors of the sides', 'the medians', 'the altitudes']],
        [`The circumcenter of ${tn} is equally far from…`, 'its three vertices', ['its three sides', 'the midpoints of its altitudes', 'its centroid and its vertices']],
        [`The incenter of ${tn} is equally far from…`, 'its three sides', ['its three vertices', 'the midpoints of its sides', 'its circumcenter and its vertices']]];
        const [p, c, w] = R.pick(Q); return E.choice(R, p, c, w, `Perpendicular bisectors collect points equidistant from the vertices (circumcenter); angle bisectors collect points equidistant from the sides (incenter).`); }
      if (mode === 1) { const k = R.int(0, 2); let A, B, Cc;
        do { if (k === 1) { A = R.int(25, 65); B = 90 - A; Cc = 90; } else if (k === 0) { A = R.int(45, 80); B = R.int(45, 80); Cc = 180 - A - B; } else { Cc = R.int(105, 130); A = R.int(20, 50); B = 180 - A - Cc; } } while (Cc < 30 || B < 18 || (k === 0 && (Cc > 80 || Cc < 40)));
        const T = K.byAngles(B, Cc, 5), vis = centerFig(R, T, nm, 'out');
        return E.choiceFixed(`${tn} has angles ${A}°, ${B}° and ${Cc}°. Where do the perpendicular bisectors of its sides meet?`, ['Inside the triangle', 'On a side of the triangle', 'Outside the triangle'], k,
          ['All three angles are acute, so the circumcenter is inside.', 'It is a right triangle, so the circumcenter is the midpoint of the hypotenuse.', `The ${Cc}° angle is obtuse, so the circumcenter is outside, beyond the longest side.`][k], { visual: vis }); }
      if (mode === 2) { const alg = R.bool(), vis = centerFig(R, K.randTri(R).t, Object.assign({}, nm), 'out', { c: 'O' });
        if (!alg) { const d = R.int(3, 19); return E.num(`O is where the perpendicular bisectors of the sides of ${tn} meet. O${L[0]} = ${d} ${u}. Find O${L[2]}.`, [{ ans: d }], `The circumcenter is equally far from all three vertices, so O${L[2]} = ${d} ${u}.`, { visual: vis }); }
        let x, p, s, q, t; do { x = R.int(2, 9); p = R.int(2, 6); s = R.int(1, 5); q = R.int(-9, 9); t = (p - s) * x + q; } while (p === s || !q || !t || p * x + q <= 0 || Math.abs(t) > 25);
        return E.num(`O is the circumcenter of ${tn}. ${M(`O${L[0]}=${E.poly([p, q])}`)} and ${M(`O${L[1]}=${E.poly([s, t])}`)}. Find the radius of the circumscribed circle.`, [{ ans: p * x + q }], `O is equidistant from the vertices: ${M(`${E.poly([p, q])}=${E.poly([s, t])}`)}, x = ${x}, radius = ${p * x + q}.`, { visual: vis }); }
      const out = R.bool(), vis = centerFig(R, K.randTri(R).t, nm, out ? 'out' : 'in');
      return E.choiceFixed(`Is the circle in this construction the circumscribed circle or the inscribed circle of ${tn}?`, ['Circumscribed circle', 'Inscribed circle'], out ? 0 : 1,
        out ? 'The dashed lines are perpendicular bisectors of the sides, and the circle passes through all three vertices: circumscribed.' : 'The dashed lines are angle bisectors, and the circle touches all three sides from inside: inscribed.', { visual: vis }); } },
    b: { t: 'circumcircle', g: (R, O) => {
      const u = U(O), mode = R.pick([0, 0, 1, 2, 2]), L = K.trio(R), nm = { A: L[0], B: L[1], C: L[2] }, tn = `△${L.join('')}`;
      if (mode === 0) { const [a, b, c] = pickTrip(R), T = K.bySides(a, c, b), vis = centerFig(R, { A: T.A, B: T.B, C: T.C }, nm, 'out'), dia = R.bool(0.35);
        return E.num(`${tn} has sides ${a}, ${b} and ${c} ${u}. Find the ${dia ? 'diameter' : 'radius'} of its circumscribed circle.`, [{ ans: dia ? c : c / 2 }],
          `${a}² + ${b}² = ${c}², so it is a right triangle and the circumcenter is the midpoint of the hypotenuse: ${dia ? `diameter = ${c}` : `radius = ${c} ÷ 2 = ${c / 2}`} ${u}.`, { visual: vis }); }
      if (mode === 1) { const k = R.int(1, 8), s = 3 * k, back = R.bool(0.35), T = K.bySides(5, 5, 5), vis = centerFig(R, T, nm, 'out');
        if (back) return E.num(`The circumscribed circle of an equilateral triangle has radius ${k}√3 ${u}. Find the side of the triangle.`, [{ ans: s }], `For an equilateral triangle R = side ÷ √3, so side = ${k}√3 × √3 = ${s} ${u}.`, { visual: vis });
        return E.num(`Equilateral ${tn} has side ${s} ${u}. Find the exact radius of its circumscribed circle.`, [{ label: 'R =', exact: kSqD(k, 3) }], `The circumcenter is also the centroid, ⅔ of the way down a median of length ${s}√3/2: R = ⅔ × ${s}√3/2 = ${PT(kSqD(k, 3))}.`, { visual: vis }); }
      const sc = R.pick([1, 2]), h = R.int(-4, 4), kk = R.int(-4, 4); let tri; do { tri = R.sample(L5, 3); } while (Math.abs((tri[1][0] - tri[0][0]) * (tri[2][1] - tri[0][1]) - (tri[2][0] - tri[0][0]) * (tri[1][1] - tri[0][1])) < 16);
      const V3 = tri.map(p => [p[0] * sc + h, p[1] * sc + kk]), askR = R.bool(0.3);
      return E.num(`${tn} has vertices ${L[0]}(${V3[0].join(', ')}), ${L[1]}(${V3[1].join(', ')}) and ${L[2]}(${V3[2].join(', ')}). The perpendicular bisectors of its sides meet at the circumcenter. ${askR ? 'Find the radius of the circumscribed circle.' : 'Find the circumcenter.'}`,
        [askR ? { label: 'R =', ans: 5 * sc } : { point: [String(h), String(kk)] }], `The point (${h}, ${kk}) is ${5 * sc} from each vertex (for example, ${L[0]} is ${tri[0][0] * sc} across and ${tri[0][1] * sc} up: √(${(tri[0][0] * sc) ** 2} + ${(tri[0][1] * sc) ** 2}) = ${5 * sc}), so it is the circumcenter${askR ? ` and R = ${5 * sc}` : ''}.`); } },
    c: { t: 'incenter construction', g: (R, O) => {
      const u = U(O), mode = R.pick([0, 1, 1, 2, 3]), L = K.trio(R), nm = { A: L[0], B: L[1], C: L[2] }, tn = `△${L.join('')}`;
      if (mode === 0) { const d = R.int(2, 12), vis = centerFig(R, K.randTri(R).t, nm, 'in', { c: 'I' });
        return E.num(`The angle bisectors of ${tn} meet at I. The distance from I to side ${L[0]}${L[1]} is ${d} ${u}. How far is I from side ${L[1]}${L[2]}?`, [{ ans: d }], `Every point on an angle bisector is equidistant from the angle's sides, so I is ${d} ${u} from all three sides.`, { visual: vis }); }
      if (mode === 1) { const t = K.randTri(R), vis = centerFig(R, t.t, nm, 'in', { c: 'I', angles: [[L[2], L[1], L[0], deg(t.B)]] }), askV = R.bool();
        return E.num(`I is where the angle bisectors of ${tn} meet, and ∠${L[0]}${L[1]}${L[2]} = ${t.B}°. Find ∠I${L[1]}${askV ? L[2] : L[0]}.`, [{ ans: t.B / 2 }], `${L[1]}I bisects ∠${L[1]}, so each half is ${t.B}° ÷ 2 = ${t.B / 2}°.`, { visual: vis }); }
      if (mode === 2) return ordQ(R, `Put the steps for constructing the inscribed circle of ${tn} in order.`,
        [`Bisect ∠${L[0]}.`, `Bisect ∠${L[1]}.`, `Label the point where the two bisectors meet I.`, `Construct the perpendicular from I to ${L[0]}${L[1]}, meeting it at F.`, `Draw the circle with center I through F.`],
        [[], [], [0, 1], [2]], `Either angle can be bisected first; their crossing is I. The radius is the perpendicular distance from I to a side, so drop the perpendicular before drawing the circle.`, centerFig(R, K.randTri(R).t, nm, 'in', { c: 'I' }));
      const out = R.bool(); return E.choice(R, `To find the ${out ? 'circumcenter' : 'incenter'} of ${tn}, which construction do you repeat on two ${out ? 'sides' : 'angles'}?`, out ? 'Perpendicular bisector of a segment' : 'Bisector of an angle',
        out ? ['Bisector of an angle', 'Perpendicular from a vertex to the opposite side', 'Copy of an angle'] : ['Perpendicular bisector of a segment', 'Perpendicular from a vertex to the opposite side', 'Copy of a segment'],
        out ? 'The circumcenter is equally far from the vertices, so it lies on the perpendicular bisectors of the sides.' : 'The incenter is equally far from the sides, so it lies on the angle bisectors. (The perpendicular bisectors would give the circumcenter.)'); } },
    d: { t: 'incircle', g: (R, O) => {
      const u = U(O), mode = R.pick([0, 0, 1, 2]), L = K.trio(R), nm = { A: L[0], B: L[1], C: L[2] }, tn = `△${L.join('')}`;
      if (mode === 0) { const sides = R.shuffle(R.pick(HERON).slice()), [a, b, c] = sides, { s, K: Ar } = heron(a, b, c), r = Ar / s, T = K.bySides(a, b, c), vis = centerFig(R, T, nm, 'in', { lines: false });
        return E.num(`${tn} has sides ${a}, ${b} and ${c} ${u}. Its area is ${Ar} ${u}². Find the radius of its inscribed circle.`, [{ label: 'r =', ans: r }],
          `Area = r × s, where s is half the perimeter: s = ${s}, so r = ${Ar} ÷ ${s} = ${r} ${u}.`, { visual: vis }); }
      if (mode === 1) { const [a, b, c] = pickTrip(R), T = K.bySides(a, c, b), vis = centerFig(R, { A: T.A, B: T.B, C: T.C }, nm, 'in', { lines: false, angles: [[L[0], L[1], L[2], '', { right: true }]] });
        return E.num(`Right ${tn} has legs ${a} and ${b} ${u} and hypotenuse ${c} ${u}. Find the radius of its inscribed circle.`, [{ label: 'r =', ans: (a + b - c) / 2 }],
          `Area = ${a * b / 2} and s = ${(a + b + c) / 2}, so r = ${a * b / 2} ÷ ${(a + b + c) / 2} = ${(a + b - c) / 2} ${u}. (For a right triangle this is (a + b − c)/2.)`, { visual: vis }); }
      const k = R.int(1, 8), s = 6 * k, back = R.bool(0.35), vis = centerFig(R, K.bySides(5, 5, 5), nm, 'in', { lines: false });
      if (back) return E.num(`The inscribed circle of an equilateral triangle has radius ${k}√3 ${u}. Find the side of the triangle.`, [{ ans: s }], `For an equilateral triangle r = side × √3/6, so side = ${k}√3 × 6/√3 = ${s} ${u}.`, { visual: vis });
      return E.num(`Equilateral ${tn} has side ${s} ${u}. Find the exact radius of its inscribed circle.`, [{ label: 'r =', exact: kSqD(k, 3) }], `The incenter is the centroid, ⅓ of the way up a median of length ${s}√3/2: r = ⅓ × ${s}√3/2 = ${PT(kSqD(k, 3))}.`, { visual: vis }); } },
    e: { t: 'angles at the two centers', g: R => {
      const L = K.trio(R), nm = { A: L[0], B: L[1], C: L[2] }, tn = `△${L.join('')}`, k = R.int(0, 2);
      let t; do { t = K.randTri(R); } while (k === 2 && (t.A >= 90 || t.B >= 90 || t.C >= 90));
      if (k === 2) { const vis = centerFig(R, t.t, nm, 'out', { c: 'O', lines: false, segs: [['O', L[1], THIN], ['O', L[2], THIN]] });
        return E.num(`O is the circumcenter of acute ${tn}, and ∠${L[1]}${L[0]}${L[2]} = ${t.A}°. Find ∠${L[1]}O${L[2]}.`, [{ ans: 2 * t.A }], `∠${L[1]}O${L[2]} is the central angle on the same arc as the inscribed angle at ${L[0]}, so it is twice as big: ${2 * t.A}°.`, { visual: vis }); }
      const vis = centerFig(R, t.t, nm, 'in', { c: 'I', lines: false, segs: [['I', L[1], THIN], ['I', L[2], THIN]] });
      if (k === 0 || t.A % 2) return E.num(`I is the incenter of ${tn}. ∠${L[1]} = ${t.B}° and ∠${L[2]} = ${t.C}°. Find ∠${L[1]}I${L[2]}.`, [{ ans: 180 - (t.B + t.C) / 2 }],
        `I${L[1]} and I${L[2]} halve those angles, so ∠${L[1]}I${L[2]} = 180° − ${t.B / 2}° − ${t.C / 2}° = ${180 - (t.B + t.C) / 2}°. (That is 90° + ½∠${L[0]}.)`, { visual: vis });
      return E.num(`I is the incenter of ${tn}, and ∠${L[1]}I${L[2]} = ${90 + t.A / 2}°. Find ∠${L[0]}.`, [{ ans: t.A }],
        `∠${L[1]}I${L[2]} = 180° − ½(∠${L[1]} + ∠${L[2]}) = 180° − ½(180° − ∠${L[0]}) = 90° + ½∠${L[0]}. So ½∠${L[0]} = ${t.A / 2}° and ∠${L[0]} = ${t.A}°.`, { visual: vis }); } },
    f: { t: 'where the incircle touches', g: (R, O) => {
      const u = U(O), [a0, b0, c0] = R.pick(TRIP), r = (a0 + b0 - c0) / 2, m = a0 - r, nn = b0 - r, k = R.int(0, 2), L = K.trio(R), Tn = R.pick(['D', 'E', 'F', 'T'].filter(q => !L.includes(q))), tn = `△${L.join('')}`;
      const T = { A: [0, b0], B: [0, 0], C: [a0, 0] }, nm = { A: L[0], B: L[1], C: L[2] }, P = K.spin(R, T), pts = {}; ['A', 'B', 'C'].forEach(q => pts[nm[q]] = P[q]);
      const I = K.incen(pts[L[0]], pts[L[1]], pts[L[2]]), F = K.foot(I, pts[L[0]], pts[L[2]]); pts[Tn] = F; pts._I = I;
      const vis = draw(pts, { segs: [[L[0], L[1]], [L[1], L[2]], [L[2], L[0]], [L[0], Tn, { lab: String(nn) }], [Tn, L[2], { lab: String(m) }]], circ: [{ c: '_I', r: dist(I, F) }], angles: [[L[0], L[1], L[2], '', { right: true }]], label: 'right triangle with its inscribed circle' });
      const head = `The inscribed circle of right ${tn} (right angle at ${L[1]}) touches the hypotenuse at ${Tn}, with ${L[0]}${Tn} = ${nn} and ${Tn}${L[2]} = ${m} ${u}.`;
      if (k === 1) return E.num(`${head} Find the radius of the inscribed circle.`, [{ label: 'r =', ans: r }],
        `Tangent pieces from a vertex are equal, and from the right angle both are r. So the legs are ${nn} + r and ${m} + r: (${nn} + r)² + (${m} + r)² = ${m + nn}² gives r² + ${m + nn}r − ${m * nn} = 0, so r = ${r}.`, { visual: vis });
      return E.num(`${head} Find the area of ${tn}.`, [{ label: 'area =', ans: m * nn }],
        `With r the inradius, the legs are ${nn} + r and ${m} + r, and Pythagoras gives r² + ${m + nn}r = ${m}·${nn}. Area = ½(${nn} + r)(${m} + r) = ½(${m * nn} + r² + ${m + nn}r) = ½(2 × ${m * nn}) = ${m * nn}. The area is just the product of the two pieces.`, { visual: vis }); } },
  });
})(typeof window !== 'undefined' ? window : globalThis);
