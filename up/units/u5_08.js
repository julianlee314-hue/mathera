/* Era V · Unit V.8 Circles (V.8.01–V.8.17) */
(function (G) {
  const E = G.E5, V = E.V, C = E.C, M = s => E.mx(s);
  const S = (id, name, steps) => E.skill({ id, name, steps });
  const K = E.K, { r2, dist, add, sub, mul, unit, polar, lerp, lets, TW } = K;

  /* ================= small helpers ================= */
  const deg = n => `${n}°`;
  const gcd = (a, b) => E.gcd(Math.abs(a), Math.abs(b));
  // exact n·π/d as typed ASCII
  const piS = (n, d = 1) => { if (d < 0) { n = -n; d = -d; } const g = gcd(n, d) || 1; n /= g; d /= g; if (n === 0) return '0'; const c = n === 1 ? '' : n === -1 ? '-' : String(n); return d === 1 ? `${c}pi` : `${c}pi/${d}`; };
  // simplest √n
  const sqS = n => { const [k, m] = E.surd(1, n); return m === 1 ? String(k) : `${k === 1 ? '' : k}sqrt(${m})`; };
  const isSq = n => Number.isInteger(Math.sqrt(n));
  const P = s => E.pt(s);
  // label text 3x + 5 and angle label (3x + 5)°
  const lin = (a, b, v = 'x') => `${a === 1 ? '' : a}${v}${b ? (b > 0 ? ' + ' + b : ' − ' + -b) : ''}`;
  const linM = (a, b, v = 'x') => `${a === 1 ? '' : a}${v}${b ? (b > 0 ? '+' + b : b) : ''}`;
  const exD = (a, b) => b ? `(${lin(a, b)})°` : `${lin(a, b)}°`;
  const fx = (n, dp = 1) => String(+n.toFixed(dp));
  const PTRIPLES = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [9, 12, 15], [8, 15, 17], [12, 16, 20], [7, 24, 25], [15, 20, 25], [20, 21, 29], [9, 40, 41], [10, 24, 26], [12, 35, 37]];
  // a random turn (and maybe reflection) for points on a circle at the origin
  const turn = R => { const rot = R.int(0, 71) * 5, fl = R.bool() ? -1 : 1; return (t, r = 3) => polar(r, rot + fl * t); };
  const twoCol = (rows, hide) => `<table class="dt"><tr><th>#</th><th>Statement</th><th>Reason</th></tr>${rows.map((r, i) => `<tr><td>${i + 1}</td><td>${r[0]}</td><td>${i === hide ? '<b>?</b>' : r[1]}</td></tr>`).join('')}</table>`;
  const inter = (A, B, Cc, D) => { const d1 = sub(B, A), d2 = sub(D, Cc), den = d1[0] * d2[1] - d1[1] * d2[0]; if (Math.abs(den) < 1e-9) return null; const t = ((Cc[0] - A[0]) * d2[1] - (Cc[1] - A[1]) * d2[0]) / den; return add(A, mul(d1, t)); };
  const ang = (c, p) => Math.atan2(p[1] - c[1], p[0] - c[0]) * 180 / Math.PI;
  const md = x => ((x % 360) + 360) % 360;

  /* ================= the circle figure =================
     K.fig plus circles, highlighted arcs, shaded sectors/segments and extra dots.
     o: {pts, circ:[{c, r, color, dash}], arcs:[{c, r, a, b, big, thru, color, lab}], fills:[{c, r, a, b, big, thru, kind:'sector'|'segment'|'ring', r2, color}],
         dots:[[x,y]], segs, angles, text, arrows, w, label}
     Points on a circle get invisible tangent stubs, so their labels sit off the curve. */
  const cfig = o => {
    const W = o.w || 260, pad = 30, Pt = Object.assign({}, o.pts), segs = (o.segs || []).slice(), at = p => typeof p === 'string' ? Pt[p] : p;
    const cs = (o.circ || []).map(c => Object.assign({}, c, { c: at(c.c) }));
    cs.forEach((c, i) => [[1, 0], [0, 1], [-1, 0], [0, -1]].forEach((d, j) => Pt[`_b${i}_${j}`] = add(c.c, mul(d, c.r))));
    Object.keys(o.pts).forEach(k => { if (k[0] === '_') return; cs.forEach((c, i) => { const p = o.pts[k]; if (Math.abs(dist(p, c.c) - c.r) > 1e-6) return;
      const u = unit(sub(p, c.c)), t = [-u[1], u[0]], e = c.r * 0.15; Pt[`_t${k}${i}a`] = add(p, mul(t, e)); Pt[`_t${k}${i}b`] = sub(p, mul(t, e));
      segs.push([k, `_t${k}${i}a`, { color: 'none' }], [k, `_t${k}${i}b`, { color: 'none' }]); }); });
    // keep every drawn arc inside the picture
    const span0 = (c, a, b, big, thru) => { const ta = ang(c, a), tb = ang(c, b); let s = md(tb - ta), t1 = ta; const flip = thru ? md(ang(c, thru) - ta) > s : big ? s < 180 : s > 180; if (flip) { t1 = tb; s = 360 - s; } return [t1, s]; };
    [...(o.arcs || []), ...(o.fills || [])].forEach((a, i) => { const c = at(a.c), [t1, s] = span0(c, at(a.a), at(a.b), a.big, a.thru && at(a.thru)); for (let j = 0; j <= 12; j++) Pt[`_s${i}_${j}`] = add(c, polar(a.r, t1 + s * j / 12)); });
    const all = Object.values(Pt), xs = all.map(p => p[0]), ys = all.map(p => p[1]), mnx = Math.min(...xs), mxx = Math.max(...xs), mny = Math.min(...ys), mxy = Math.max(...ys);
    const sc = (W - 2 * pad) / Math.max(1e-9, mxx - mnx, mxy - mny), H = Math.round((mxy - mny) * sc + 2 * pad);
    const T = p => [r2(pad + (p[0] - mnx) * sc), r2(H - pad - (p[1] - mny) * sc)];
    // which way round: start angle and ccw span of the chosen arc from a to b
    const span = (c, a, b, big, thru) => { const ta = ang(c, a), tb = ang(c, b); let s = md(tb - ta), t1 = ta;
      const flip = thru ? md(ang(c, thru) - ta) > s : big ? s < 180 : s > 180; if (flip) { t1 = tb; s = 360 - s; } return [t1, s]; };
    const arcPath = (c, r, t1, s, move = true, rev = false) => { const p1 = T(add(c, polar(r, rev ? t1 + s : t1))), p2 = T(add(c, polar(r, rev ? t1 : t1 + s))), rs = r2(r * sc);
      return `${move ? 'M' : 'L'}${p1[0]} ${p1[1]} A${rs} ${rs} 0 ${s > 180 ? 1 : 0} ${rev ? 1 : 0} ${p2[0]} ${p2[1]}`; };
    let extra = '';
    (o.fills || []).forEach(f => { const c = at(f.c), [t1, s] = span(c, at(f.a), at(f.b), f.big, f.thru && at(f.thru)), Tc = T(c); let d;
      if (f.kind === 'segment') d = arcPath(c, f.r, t1, s) + ' Z';
      else if (f.kind === 'ring') d = arcPath(c, f.r, t1, s) + ' ' + arcPath(c, f.r2, t1, s, false, true) + ' Z';
      else d = `M${Tc[0]} ${Tc[1]} ` + arcPath(c, f.r, t1, s, false) + ' Z';
      extra += `<path d="${d}" fill="${f.color || C.blue}" fill-opacity="${f.op ?? 0.25}" stroke="none"/>`; });
    (o.paths || []).forEach(p => { extra += p(T, sc); });
    cs.forEach(c => { const Tc = T(c.c); extra += `<circle cx="${Tc[0]}" cy="${Tc[1]}" r="${r2(c.r * sc)}" fill="none" stroke="${c.color || C.ink}" stroke-width="2" ${c.dash ? 'stroke-dasharray="6 5"' : ''}/>`; });
    const text = (o.text || []).slice();
    (o.arcs || []).forEach(a => { const c = at(a.c), [t1, s] = span(c, at(a.a), at(a.b), a.big, a.thru && at(a.thru)), col = a.color || C.blue;
      extra += `<path d="${arcPath(c, a.r, t1, s)}" fill="none" stroke="${col}" stroke-width="${a.width || 4}" stroke-linecap="round" opacity="0.85"/>`;
      if (a.lab) { const m = (t1 + s / 2) * Math.PI / 180, z = 13.5, hw = TW(a.lab, z) / 2, hh = z * 0.6, off = (9 + hw * Math.abs(Math.cos(m)) + hh * Math.abs(Math.sin(m))) / sc;
        text.push([add(c, polar(a.r + off, t1 + s / 2)), a.lab, { fill: col === C.ink ? C.ink : a.lcol || '#2F6DB0', size: z }]); } });
    (o.dots || []).forEach(p => { const q = T(p); extra += V.dot(q[0], q[1], 2.8, C.ink); });
    const svg = K.fig({ pts: Pt, segs, angles: o.angles, arrows: o.arrows, polys: o.polys, text, w: W, center: o.center, hide: o.hide, label: o.label || 'circle figure' });
    return svg.replace(/(<g transform="translate\([^)]*\)">)/, `$1${extra}`);
  };
  const BLUE = { color: C.blue, width: 3 };

  /* ================= V.8.01 Circle vocabulary ================= */
  const VOC = {
    chord: 'a segment with both endpoints on the circle', secant: 'a line that crosses the circle at two points', tangent: 'a line that touches the circle at exactly one point',
    diameter: 'a chord through the center', radius: 'a segment from the center to a point on the circle',
  };
  const VWRONG = { chord: ['diameter', 'secant', 'radius'], secant: ['chord', 'tangent', 'diameter'], tangent: ['secant', 'chord', 'radius'], diameter: ['radius', 'secant', 'tangent'], radius: ['diameter', 'chord', 'tangent'] };
  const vocFig = (R, kind) => { const tr = turn(R), L = lets(R, 2), pts = { O: [0, 0] }; let segs;
    if (kind === 'chord' || kind === 'secant') { pts[L[0]] = tr(0); pts[L[1]] = tr(R.int(80, 135));
      if (kind === 'chord') segs = [[L[0], L[1], BLUE]]; else { pts._s1 = lerp(pts[L[0]], pts[L[1]], -0.6); pts._s2 = lerp(pts[L[0]], pts[L[1]], 1.6); segs = [['_s1', '_s2', BLUE]]; } }
    else if (kind === 'tangent') { const Tp = tr(0), u = unit(Tp), t = [-u[1], u[0]]; pts[L[0]] = Tp; pts._s1 = add(Tp, mul(t, 2.8)); pts._s2 = sub(Tp, mul(t, 2.8)); segs = [['_s1', '_s2', BLUE]]; }
    else if (kind === 'diameter') { pts[L[0]] = tr(0); pts[L[1]] = tr(180); segs = [[L[0], L[1], BLUE]]; }
    else { pts[L[0]] = tr(0); segs = [['O', L[0], BLUE]]; }
    return cfig({ pts, segs, circ: [{ c: 'O', r: 3 }], label: 'circle with one ' + (kind === 'secant' || kind === 'tangent' ? 'line' : 'segment') + ' in blue' }); };
  S('V.8.01', 'Circle vocabulary', {
    a: { t: 'chord, secant, tangent', g: R => {
      if (R.bool(0.3)) { const ST = [['Every diameter is a chord.', 1, 'A diameter has both endpoints on the circle, so it is a chord (the longest one).'], ['Every chord is a diameter.', 0, 'A chord only needs its endpoints on the circle. Only the chord through the center is a diameter.'],
        ['A secant line contains a chord.', 1, 'The part of a secant between its two crossing points is a chord.'], ['A tangent line can meet the circle at two points.', 0, 'A tangent touches the circle at exactly one point. A line through two points is a secant.'],
        ['A radius is a chord.', 0, 'A radius has only one endpoint on the circle (the other is the center), so it is not a chord.'], ['The longest chord of a circle is a diameter.', 1, 'The chord through the center is the longest one, and that is a diameter.']];
        const [s, t, w] = R.pick(ST); return E.tf(`True or false? ${s}`, !!t, w); }
      const kind = R.pick(['chord', 'secant', 'tangent', 'diameter', 'radius', 'chord', 'secant', 'tangent']);
      if (R.bool(0.3)) return E.choice(R, `What is ${VOC[kind]} called?`, kind[0].toUpperCase() + kind.slice(1), VWRONG[kind].map(w => w[0].toUpperCase() + w.slice(1)), `${kind[0].toUpperCase() + kind.slice(1)}: ${VOC[kind]}.${kind === 'chord' ? ' It does not have to pass through the center.' : ''}`);
      return E.choice(R, `O is the center of the circle. What is the blue ${kind === 'secant' || kind === 'tangent' ? 'line' : 'segment'}?`, kind[0].toUpperCase() + kind.slice(1), VWRONG[kind].map(w => w[0].toUpperCase() + w.slice(1)),
        `It is ${VOC[kind]}, so it is a ${kind}.${kind === 'chord' ? ' It misses the center, so it is not a diameter.' : kind === 'diameter' ? ' (A diameter is also a chord, the one through the center.)' : ''}`, { visual: vocFig(R, kind) }); } },
    b: { t: 'arcs: minor, major, semicircle', g: R => {
      if (R.bool(0.2)) { const k = R.int(0, 2), Q = [['How many letters are used to name a major arc?', 'Three, like arc ACB', ['Two, like arc AB', 'One, like arc A', 'Four, like arc ABCD'], 'A major arc needs a middle letter to show which way round it goes: arc ACB.'],
        ['A minor arc measures…', 'less than 180°', ['exactly 180°', 'more than 180°', 'exactly 90°'], 'A minor arc is smaller than half the circle, so it measures less than 180°.'],
        ['The endpoints of a semicircle are the endpoints of…', 'a diameter', ['a radius', 'a tangent', 'any chord'], 'A semicircle is half a circle; its endpoints are the ends of a diameter.']][k];
        return E.choice(R, Q[0], Q[1], Q[2], Q[3]); }
      const kind = R.int(0, 2), tr = turn(R), L = lets(R, 3), th = kind === 2 ? 180 : R.int(7, 30) * 5, pts = { O: [0, 0] };
      pts[L[0]] = tr(0); pts[L[1]] = tr(th); const onMinor = kind === 0 ? true : kind === 1 ? false : R.bool();
      pts[L[2]] = kind === 2 ? tr(onMinor ? 90 : 270) : tr(onMinor ? th * R.int(35, 65) / 100 : th + (360 - th) * R.int(35, 65) / 100);
      const segs = kind === 2 ? [[L[0], L[1]]] : [['O', L[0]], ['O', L[1]]], vis = cfig({ pts, segs, circ: [{ c: 'O', r: 3 }], angles: kind === 2 ? [] : [[L[0], 'O', L[1], deg(th)]], label: 'circle with three points' });
      const nm = `arc ${L[0]}${L[2]}${L[1]}`, ans = kind === 0 ? 'Minor arc' : kind === 1 ? 'Major arc' : 'Semicircle';
      return E.choiceFixed(`O is the center. Is ${nm} a minor arc, a major arc or a semicircle?`, ['Minor arc', 'Major arc', 'Semicircle'], kind,
        kind === 2 ? `${L[0]}${L[1]} passes through the center, so it is a diameter, and either arc between its ends is a semicircle (180°).` : `${nm} runs from ${L[0]} to ${L[1]} through ${L[2]}. ${onMinor ? `That is the short way round, ${th}°, less than 180°: a minor arc.` : `That is the long way round, 360° − ${th}° = ${360 - th}°, more than 180°: a major arc.`}`, { visual: vis }); } },
    c: { t: 'concentric and congruent circles', g: R => {
      const mode = R.pick([0, 0, 1, 1, 1, 2]);
      if (mode === 1) { const r = R.int(3, 12), L0 = lets(R, 2), yes = R.int(0, 9) % 2 === 0, d = yes ? 2 * r : R.pick([r, 2 * r + 2, r + 2]), L = lets(R, 2);
        return E.choiceFixed(`Circle ${L[0]} has radius ${r} cm. Circle ${L[1]} has diameter ${d} cm. Are the circles congruent?`, ['Yes', 'No'], yes ? 0 : 1,
          `Congruent circles have equal radii. Circle ${L[1]} has radius ${d} ÷ 2 = ${fx(d / 2)} cm, ${yes ? 'the same as' : 'not equal to'} ${r} cm${yes ? ', so yes' : ', so no'}.`); }
      if (mode === 2) { const a = R.int(2, 9), b = a + R.int(2, 9), useD = R.bool();
        return E.num(`Two concentric circles have ${useD ? `diameters ${2 * a} cm and ${2 * b} cm` : `radii ${a} cm and ${b} cm`}. How wide is the ring between them?`, [{ label: 'width =', ans: b - a }],
          `Concentric circles share a center, so the ring's width is the difference of the radii: ${b} − ${a} = ${b - a} cm.${useD ? ` (Halve the diameters first: radii ${a} and ${b}.)` : ''}`); }
      const kind = R.int(0, 2), L = lets(R, 2), r1 = R.int(2, 5), r2v = kind === 1 ? r1 : r1 + R.int(2, 4), th = R.int(0, 71) * 5, pts = {};
      let c1 = [0, 0], c2 = kind === 0 ? [0, 0] : polar(R.int(r1 + r2v - 2, r1 + r2v + 2) * 0.9, th);
      pts[L[0]] = c1; if (kind) pts[L[1]] = c2; pts._p = add(c1, polar(r1, th + 150)); pts._q = add(c2, polar(r2v, kind ? th - 40 : th + 40));
      const segs = [[L[0], '_p', { lab: String(r1) }], [kind ? L[1] : L[0], '_q', { lab: String(r2v) }]];
      const vis = cfig({ pts, segs, circ: [{ c: c1, r: r1 }, { c: c2, r: r2v }], label: 'two circles' });
      const ans = ['Concentric', 'Congruent', 'Neither'][kind];
      return E.choiceFixed(`Describe the two circles${kind ? ` with centers ${L[0]} and ${L[1]}` : ` with center ${L[0]}`}.`, ['Concentric', 'Congruent', 'Neither'], kind,
        kind === 0 ? 'They share one center but have different radii, so they are concentric.' : kind === 1 ? `Their radii are equal (${r1} and ${r2v}), so they are congruent, even though their centers differ.` : `Different centers and different radii (${r1} and ${r2v}): neither concentric nor congruent.`, { visual: vis }); } },
    d: { t: 'name parts in a diagram', g: R => {
      const tr = turn(R), L = lets(R, 7), [A, B, Cn, D, Ee, Tn, X] = L, t0 = 0, pts = { O: [0, 0] };
      pts[A] = tr(t0); pts[B] = tr(t0 + 180); pts[Cn] = tr(t0 + R.int(50, 65)); pts[D] = tr(t0 + R.int(120, 140)); pts[Ee] = tr(t0 + R.int(225, 245));
      const Tp = tr(t0 + R.int(295, 315)), u = unit(Tp), tg = [-u[1], u[0]]; pts[Tn] = Tp; pts[X] = add(Tp, mul(tg, R.bool() ? 2.4 : -2.4)); pts._x2 = sub(Tp, mul(sub(pts[X], Tp), 0.8));
      const segs = [[A, B], [Cn, D], ['O', Ee], ['_x2', X]], vis = cfig({ pts, segs, circ: [{ c: 'O', r: 3 }], label: 'circle with a diameter, a chord, a radius and a tangent line' });
      const opts = { dia: `${A}${B}`, chord: `${Cn}${D}`, rad: `O${Ee}`, tan: `line ${Tn}${X}` }, q = R.int(0, 4);
      if (q === 4) return E.choice(R, 'O is the center. Which point is the point of tangency?', Tn, [X, Ee, Cn], `Line ${Tn}${X} touches the circle only at ${Tn}, so ${Tn} is the point of tangency. ${X} lies outside the circle.`, { visual: vis });
      const ask = ['dia', 'chord', 'rad', 'tan'][q], txt = { dia: 'a diameter', chord: 'a chord that is not a diameter', rad: 'a radius', tan: 'tangent to the circle' }[ask];
      const why = { dia: `${A}${B} has both ends on the circle and passes through O.`, chord: `${Cn}${D} has both ends on the circle but misses O. (${A}${B} is a chord too, but it is a diameter.)`, rad: `O${Ee} joins the center to a point on the circle.`, tan: `Line ${Tn}${X} meets the circle at exactly one point, ${Tn}.` }[ask];
      return E.choice(R, `O is the center. Which one is ${txt}?`, opts[ask], Object.keys(opts).filter(k => k !== ask).map(k => opts[k]), why, { visual: vis }); } },
  });

  /* ================= V.8.02 Central angles & arcs ================= */
  S('V.8.02', 'Central angles & arcs', {
    a: { t: 'arc measure = central angle', g: R => {
      const tr = turn(R), L = lets(R, 3), th = R.int(25, 165), pts = { O: [0, 0] }; pts[L[0]] = tr(0); pts[L[1]] = tr(th); pts[L[2]] = tr(th + (360 - th) * R.int(40, 60) / 100);
      const kind = R.int(0, 2), [a, b, c] = L, ang0 = [[a, 'O', b, kind === 2 ? '?' : deg(th)]];
      const vis = cfig({ pts, segs: [['O', a], ['O', b]], circ: [{ c: 'O', r: 3 }], angles: ang0, arcs: kind === 2 ? [{ c: 'O', r: 3, a, b, lab: deg(th) }] : [], label: 'central angle' });
      if (kind === 0) return E.num(`O is the center. Find the measure of arc ${a}${b}.`, [{ label: `arc ${a}${b} =`, ans: th }], `A minor arc measures the same as its central angle: arc ${a}${b} = ∠${a}O${b} = ${th}°.`, { visual: vis });
      if (kind === 1) return E.num(`O is the center. Find the measure of major arc ${a}${c}${b}.`, [{ label: `arc ${a}${c}${b} =`, ans: 360 - th }], `The whole circle is 360°, so the major arc is 360° − ${th}° = ${360 - th}°.`, { visual: vis });
      return E.num(`O is the center and arc ${a}${b} measures ${th}°. Find ∠${a}O${b}.`, [{ label: `∠${a}O${b} =`, ans: th }], `A central angle equals the arc it cuts off: ${th}°. (That is its measure in degrees, not its length.)`, { visual: vis }); } },
    b: { t: 'arc addition', g: R => {
      const tr = turn(R), L = lets(R, 4), [a, b, c, d] = L, kind = R.int(0, 2), pts = { O: [0, 0] };
      if (kind === 2) { const p = R.int(25, 155); pts[a] = tr(0); pts[b] = tr(180); pts[c] = tr(p); pts[d] = tr(R.int(215, 325));
        const vis = cfig({ pts, segs: [[a, b], ['O', c]], circ: [{ c: 'O', r: 3 }], arcs: [{ c: 'O', r: 3, a, b: c, lab: deg(p) }], label: 'circle with a diameter' });
        return E.num(`${a}${b} is a diameter. Find the measure of arc ${c}${b}.`, [{ label: `arc ${c}${b} =`, ans: 180 - p }], `A diameter cuts off a semicircle, 180°. So arc ${c}${b} = 180° − ${p}° = ${180 - p}°.`, { visual: vis }); }
      let p, q; do { p = R.int(30, 140); q = R.int(30, 140); } while (p + q > 250 || Math.abs(p - q) < 10);
      pts[a] = tr(0); pts[b] = tr(p); pts[c] = tr(p + q); pts[d] = tr(p + q + (360 - p - q) / 2);
      const segs = [['O', a], ['O', b], ['O', c]];
      if (kind === 0) { const vis = cfig({ pts, segs, circ: [{ c: 'O', r: 3 }], angles: [[a, 'O', b, deg(p)], [b, 'O', c, deg(q)]], label: 'two central angles' }), maj = R.bool(0.35);
        if (maj) return E.num(`O is the center. Find the measure of arc ${a}${d}${c}.`, [{ label: `arc ${a}${d}${c} =`, ans: 360 - p - q }], `Arc ${a}${b}${c} = ${p}° + ${q}° = ${p + q}°, so the rest of the circle, arc ${a}${d}${c}, is 360° − ${p + q}° = ${360 - p - q}°.`, { visual: vis });
        return E.num(`O is the center. Find the measure of arc ${a}${b}${c}.`, [{ label: `arc ${a}${b}${c} =`, ans: p + q }], `Adjacent arcs add: arc ${a}${b} + arc ${b}${c} = ${p}° + ${q}° = ${p + q}°.`, { visual: vis }); }
      const vis = cfig({ pts, segs, circ: [{ c: 'O', r: 3 }], angles: [[a, 'O', b, deg(p)], [b, 'O', c, '?']], label: 'two central angles' });
      return E.num(`O is the center and arc ${a}${b}${c} measures ${p + q}°. Find ∠${b}O${c}.`, [{ label: `∠${b}O${c} =`, ans: q }], `Arc addition: ${p}° + ∠${b}O${c} = ${p + q}°, so ∠${b}O${c} = ${q}°.`, { visual: vis }); } },
    c: { t: 'congruent arcs', g: R => {
      const mode = R.pick([0, 0, 1, 1, 2, 3]);
      if (mode === 3) { const ST = [['Two arcs with the same measure are always congruent.', 0, 'They must also be in the same circle or congruent circles. A 60° arc on a coin and on a wheel are not congruent.'],
        ['In one circle, congruent chords cut off congruent arcs.', 1, 'Congruent chords make congruent central angles, so their arcs have equal measures in the same circle.'],
        ['In congruent circles, congruent central angles cut off congruent arcs.', 1, 'Equal central angles give equal arc measures, and in congruent circles that makes the arcs congruent.'],
        ['Arcs in different-sized circles can be congruent if their measures match.', 0, 'Equal measures in circles of different sizes give arcs of different lengths, so they are not congruent.']];
        const [s, t, w] = R.pick(ST); return E.tf(`True or false? ${s}`, !!t, w); }
      if (mode === 2) { const n = R.pick([3, 4, 5, 6, 8, 9, 10, 12]); return E.num(`${n} points divide a circle into ${n} congruent arcs. Find the measure of each arc.`, [{ ans: 360 / n }], `The arcs share 360° equally: 360° ÷ ${n} = ${360 / n}°.`); }
      const tr = turn(R), L = lets(R, 4), [a, b, c, d] = L, th = R.int(40, 110), gap = (360 - 2 * th) / 2, pts = { O: [0, 0] };
      pts[a] = tr(0); pts[b] = tr(th); pts[c] = tr(th + gap); pts[d] = tr(2 * th + gap);
      const maj = R.bool(0.3);
      if (mode === 0) { const vis = cfig({ pts, segs: [[a, b, { ticks: 1 }], [c, d, { ticks: 1 }]], circ: [{ c: 'O', r: 3 }], arcs: [{ c: 'O', r: 3, a, b, lab: deg(th) }], label: 'two congruent chords' });
        return E.num(`Chords ${a}${b} and ${c}${d} are congruent. Find the measure of ${maj ? `the major arc ${c}${d}` : `arc ${c}${d}`}.`, [{ ans: maj ? 360 - th : th }],
          `Congruent chords in one circle cut off congruent arcs, so arc ${c}${d} = ${th}°${maj ? `, and its major arc is 360° − ${th}° = ${360 - th}°` : ''}.`, { visual: vis }); }
      const vis = cfig({ pts, segs: [['O', a], ['O', b], ['O', c], ['O', d]], circ: [{ c: 'O', r: 3 }], angles: [[a, 'O', b, deg(th), { n: 1 }], [c, 'O', d, '', { n: 1 }]], label: 'two equal central angles' });
      return E.num(`∠${a}O${b} and ∠${c}O${d} are marked congruent. Find the measure of ${maj ? `the major arc ${c}${d}` : `arc ${c}${d}`}.`, [{ ans: maj ? 360 - th : th }],
        `Congruent central angles cut off congruent arcs: arc ${c}${d} = ${th}°${maj ? `, so the major arc is 360° − ${th}° = ${360 - th}°` : ''}.`, { visual: vis }); } },
    d: { t: 'solve for x', g: R => {
      const kind = R.int(0, 2), tr = turn(R), L = lets(R, 4), [a, b, c, d] = L, pts = { O: [0, 0] };
      const coef = (th, x) => { let k, m, t = 0; do { k = R.int(1, 5); m = th - k * x; t++; } while ((Math.abs(m) > 60 || m === 0 && t < 3) && t < 40); return [k, m]; };
      if (kind === 0) { let x, th, ex; do { x = R.int(5, 30); th = [R.int(60, 170), R.int(60, 170)]; th.push(360 - th[0] - th[1]); ex = th.map(t => coef(t, x)); } while (th[2] < 60 || th[2] > 170 || ex.some(([k, m]) => Math.abs(m) > 60));
        pts[a] = tr(0); pts[b] = tr(th[0]); pts[c] = tr(th[0] + th[1]);
        const vis = cfig({ pts, segs: [['O', a], ['O', b], ['O', c]], circ: [{ c: 'O', r: 3 }], angles: [[a, 'O', b, exD(...ex[0])], [b, 'O', c, exD(...ex[1])], [c, 'O', a, exD(...ex[2])]], label: 'three central angles' });
        const sk = ex.reduce((s, e) => s + e[0], 0), sm = ex.reduce((s, e) => s + e[1], 0), askArc = R.bool(0.3), j = R.int(0, 2), nm = [`${a}${b}`, `${b}${c}`, `${c}${a}`][j];
        return E.num(askArc ? `O is the center. Find the measure of arc ${nm}.` : 'O is the center. Find x.', [askArc ? { label: `arc ${nm} =`, ans: th[j] } : { label: 'x =', ans: x }],
          `The central angles go all the way round: ${M(`${linM(sk, sm)}=360`)}, so x = ${x}.${askArc ? ` Then arc ${nm} = ${P(linM(...ex[j]).replace('x', '(' + x + ')'))} = ${th[j]}°.` : ''}`, { visual: vis }); }
      if (kind === 1) { let x, p, ex1, ex2; do { x = R.int(5, 30); p = R.int(40, 140); ex1 = coef(p, x); ex2 = coef(180 - p, x); } while (Math.abs(ex1[1]) > 60 || Math.abs(ex2[1]) > 60 || ex1[0] === ex2[0] && ex1[1] === ex2[1]);
        pts[a] = tr(0); pts[b] = tr(180); pts[c] = tr(p);
        const vis = cfig({ pts, segs: [[a, b], ['O', c]], circ: [{ c: 'O', r: 3 }], angles: [[a, 'O', c, exD(...ex1)], [c, 'O', b, exD(...ex2)]], label: 'diameter and a radius' });
        return E.num(`${a}${b} is a diameter. Find x.`, [{ label: 'x =', ans: x }], `The two angles make the semicircle, 180°: ${M(`${linM(ex1[0] + ex2[0], ex1[1] + ex2[1])}=180`)}, so x = ${x}.`, { visual: vis }); }
      let x, th, e1, e2; do { x = R.int(4, 25); th = R.int(40, 110); e1 = coef(th, x); e2 = coef(th, x); } while (e1[0] === e2[0] || Math.abs(e1[1]) > 60 || Math.abs(e2[1]) > 60);
      const gap = (360 - 2 * th) / 2; pts[a] = tr(0); pts[b] = tr(th); pts[c] = tr(th + gap); pts[d] = tr(2 * th + gap);
      const vis = cfig({ pts, segs: [[a, b, { ticks: 1 }], [c, d, { ticks: 1 }]], circ: [{ c: 'O', r: 3 }], arcs: [{ c: 'O', r: 3, a, b, lab: exD(...e1) }, { c: 'O', r: 3, a: c, b: d, lab: exD(...e2) }], label: 'two congruent chords with arcs' });
      const askArc = R.bool(0.35);
      return E.num(askArc ? `Chords ${a}${b} and ${c}${d} are congruent. Find the measure of arc ${a}${b}.` : `Chords ${a}${b} and ${c}${d} are congruent. Find x.`, [askArc ? { label: `arc ${a}${b} =`, ans: th } : { label: 'x =', ans: x }],
        `Congruent chords cut off congruent arcs: ${M(`${linM(...e1)}=${linM(...e2)}`)}, so x = ${x}.${askArc ? ` Arc ${a}${b} = ${th}°.` : ''}`, { visual: vis }); } },
  });

  /* ================= V.8.03 Arc length ================= */
  const NICE = [30, 36, 40, 45, 60, 72, 80, 90, 100, 120, 135, 150, 160, 200, 210, 225, 240, 270, 300];
  const sectFig = (R, th, o = {}) => { const tr = turn(R), L = lets(R, 2), pts = { O: [0, 0] }; pts[L[0]] = tr(0); pts[L[1]] = tr(th);
    const segs = [['O', L[0], { lab: o.rl ?? undefined }], ['O', L[1]]], small = th <= 180;
    return { L, vis: cfig({ pts, segs, circ: [{ c: 'O', r: 3, dash: !!o.dash }], angles: small && o.al !== false ? [[L[0], 'O', L[1], o.al || deg(th)]] : [],
      arcs: o.arc ? [{ c: 'O', r: 3, a: L[0], b: L[1], big: th > 180, lab: o.arcLab || (!small ? o.al || deg(th) : '') }] : [], fills: o.fill ? [{ c: 'O', r: 3, a: L[0], b: L[1], big: th > 180, kind: o.fill }] : [], label: o.label || 'sector' }) }; };
  S('V.8.03', 'Arc length', {
    a: { t: 'fraction of circumference', g: R => {
      const th = R.pick(NICE), g = gcd(th, 360), n = th / g, d = 360 / g;
      if (R.bool(0.35)) return E.num(`What fraction of the circumference is an arc of ${th}°?`, [{ frac: [n, d], form: 'simplest' }], `${th}/360 of the circle, which simplifies to ${n}/${d}.`);
      const k = R.int(1, Math.max(1, Math.floor(60 / d))) * (d < 6 ? R.int(1, 6) : 1), Cc = d * k, u = R.pick(['cm', 'in', 'm']);
      const { L, vis } = sectFig(R, th, { arc: true });
      return E.num(`The circle's circumference is ${Cc} ${u}. Find the length of the blue arc ${L[0]}${L[1]}.`, [{ label: 'arc length =', ans: n * k }], `The arc is ${th}/360 = ${n}/${d} of the circle: ${n}/${d} × ${Cc} = ${n * k} ${u}.`, { visual: vis }); } },
    b: { t: 'formula in degrees', g: R => {
      let th, r; do { th = R.pick(NICE); r = R.int(2, 18); } while (gcd(th * r, 180) < 10);
      const ans = piS(th * r, 180), useD = R.bool(0.3), { vis } = sectFig(R, th, { arc: true, rl: useD ? null : String(r) });
      return E.num(`${useD ? `The circle has diameter ${2 * r}. ` : ''}Find the length of the blue arc. Give an exact answer in terms of π.`, [{ label: 'arc length =', exact: ans, form: 'simplest' }],
        `${useD ? `Radius = ${2 * r} ÷ 2 = ${r}. ` : ''}Arc length = (${th}/360) × 2π(${r}) = ${P(ans)}.`, { visual: vis }); } },
    c: { t: 'find the angle or radius', g: R => {
      let th, r; do { th = R.pick(NICE); r = R.int(2, 15); } while (gcd(th * r, 180) < 12);
      const s = piS(th * r, 180), findR = R.bool();
      if (findR) { const { vis } = sectFig(R, th, { arc: true, arcLab: P(s), rl: 'r' });
        return E.num(`The blue arc has length ${P(s)}. Find the radius r.`, [{ label: 'r =', ans: r }], `(${th}/360) × 2πr = ${P(s)}, so ${P(piS(th, 180))}·r = ${P(s)} and r = ${r}.`, { visual: vis }); }
      const { vis } = sectFig(R, th, { arc: true, arcLab: P(s), rl: String(r), al: 'θ' });
      return E.num(`The blue arc has length ${P(s)} and the radius is ${r}. Find the central angle θ in degrees.`, [{ label: 'θ =', ans: th }], `(θ/360) × 2π(${r}) = ${P(s)}, so θ/360 = ${E.fracStr(th, 360)} and θ = ${th}°.`, { visual: vis }); } },
    d: { t: 'word problems', g: R => {
      const k = R.int(0, 4);
      if (k === 0) { const r = R.int(6, 18), m = R.pick([5, 10, 15, 20, 25, 35, 40, 45, 50]), th = 6 * m, L = th / 360 * 2 * Math.PI * r;
        return E.num(`A clock's minute hand is ${r} cm long. How far does its tip travel in ${m} minutes? Round to 1 decimal place.`, [{ label: 'distance =', ans: L, dp: 1 }], `The hand turns 6° a minute, so ${th}°. Arc = (${th}/360) × 2π(${r}) ≈ ${L.toFixed(1)} cm.`); }
      if (k === 1) { const d = R.pick([25, 30, 32, 35, 36, 40, 45]), n = R.pick([6, 8, 10, 12]), L = Math.PI * d / n;
        return E.num(`A ${d} cm pizza is cut into ${n} equal slices. How long is the crust edge of one slice? Round to 1 decimal place.`, [{ label: 'crust =', ans: L, dp: 1 }], `The whole crust is πd = π × ${d}. One slice gets 1/${n} of it: ${d}π/${n} ≈ ${L.toFixed(1)} cm. (${d} cm is the diameter, so don't double it.)`); }
      if (k === 2) { const r = R.int(40, 120) / 10, th = R.int(20, 70), L = th / 360 * 2 * Math.PI * r;
        return E.num(`A pendulum ${r} m long swings through an angle of ${th}°. How long is the arc its tip travels? Round to 2 decimal places.`, [{ label: 'arc =', ans: L, dp: 2 }], `(${th}/360) × 2π(${r}) ≈ ${L.toFixed(2)} m.`); }
      if (k === 3) { const r = R.int(10, 40), th = R.pick([45, 60, 90, 120, 135, 150, 210, 240]), L = th / 360 * 2 * Math.PI * r;
        return E.num(`A Ferris wheel has radius ${r} m. How far does a seat travel when the wheel turns ${th}°? Round to 1 decimal place.`, [{ label: 'distance =', ans: L, dp: 1 }], `(${th}/360) × 2π(${r}) ≈ ${L.toFixed(1)} m.`); }
      const r = R.int(30, 45), L = Math.PI * r;
      return E.num(`Each curved end of a running track is a semicircle of radius ${r} m. How long is one curved end? Round to 1 decimal place.`, [{ label: 'length =', ans: L, dp: 1 }], `A semicircle is 180/360 = 1/2 of the circumference: πr = π × ${r} ≈ ${L.toFixed(1)} m.`); } },
  });

  /* ================= V.8.04 Sector area ================= */
  const segExact = (th, r) => { const sec = piS(th * r * r, 360), r2v = r * r;   // sector − triangle (½r² sin θ)
    if (th === 90) return [sec, E.fracStr(r2v, 2)];
    if (th === 30 || th === 150) return [sec, E.fracStr(r2v, 4)];
    const g = gcd(r2v, 4), n = r2v / g, d = 4 / g; return [sec, `${n === 1 ? '' : n}sqrt(3)${d === 1 ? '' : '/' + d}`]; };
  const goat = (R) => { const s = R.int(4, 9), L = R.int(2, s); return { s, L }; };
  S('V.8.04', 'Sector area', {
    a: { t: 'fraction of area', g: R => {
      const th = R.pick(NICE), g = gcd(th, 360), n = th / g, d = 360 / g;
      if (R.bool(0.35)) { const k = R.int(2, 9), A = d * k * R.pick([1, 2, 3]), part = A * n / d;
        const { vis } = sectFig(R, th, { fill: 'sector', al: th <= 180 ? 'θ' : false });
        return E.num(`The whole circle has area ${A} cm² and the shaded sector has area ${part} cm². Find the sector's central angle.`, [{ label: 'angle =', ans: th }], `The sector is ${part}/${A} = ${n}/${d} of the circle, so its angle is ${n}/${d} × 360° = ${th}°.`, { visual: vis }); }
      const k = R.int(1, Math.max(1, Math.floor(90 / d))) * (d < 8 ? R.int(2, 8) : 1), A = d * k, { vis } = sectFig(R, th, { fill: 'sector', arcLab: deg(th), arc: th > 180 });
      return E.num(`The whole circle has area ${A} cm². Find the area of the shaded sector.`, [{ label: 'area =', ans: n * k }], `The sector is ${th}/360 = ${n}/${d} of the circle: ${n}/${d} × ${A} = ${n * k} cm².`, { visual: vis }); } },
    b: { t: 'formula', g: R => {
      let th, r; do { th = R.pick(NICE); r = R.int(2, 15); } while (gcd(th * r * r, 360) < 20);
      const ans = piS(th * r * r, 360), useD = R.bool(0.25), { vis } = sectFig(R, th, { fill: 'sector', rl: useD ? null : String(r), arc: th > 180, arcLab: deg(th) });
      return E.num(`${useD ? `The circle has diameter ${2 * r}. ` : ''}Find the area of the shaded sector. Give an exact answer in terms of π.`, [{ label: 'area =', exact: ans, form: 'simplest' }],
        `${useD ? `Radius = ${r}. ` : ''}Area = (${th}/360) × π(${r})² = (${E.fracStr(th, 360)}) × ${r * r}π = ${P(ans)}.`, { visual: vis }); } },
    c: { t: 'segment area', g: R => {
      const th = R.pick([90, 90, 60, 120, 150]), r = th === 90 ? R.int(2, 12) : R.pick([2, 4, 6, 8, 10, 12, 3, 5]);
      const [sec, tri] = segExact(th, r), ans = `${sec}-${tri}`, { vis } = sectFig(R, th, { fill: 'segment', rl: String(r), label: 'circle segment' });
      const triTxt = th === 90 ? `½ × ${r} × ${r} = ${P(tri)}` : `½ × ${r} × ${r} × sin ${th}° = ${P(tri)}`;
      return E.num(`Find the area of the shaded segment, between the chord and the arc. Give an exact answer.`, [{ label: 'area =', exact: ans }],
        `Sector − triangle. Sector = (${th}/360)π(${r})² = ${P(sec)}. Triangle = ${triTxt}. Segment = ${P(ans)}.`, { visual: vis }); } },
    d: { t: 'word problems', g: R => {
      const k = R.int(0, 4);
      if (k === 0) { const r = R.int(5, 20), th = R.pick([60, 75, 90, 120, 135, 150, 180, 210, 240, 270]), A = th / 360 * Math.PI * r * r;
        return E.num(`A lawn sprinkler sprays ${r} m and turns through ${th}°. What area does it water? Round to 1 decimal place.`, [{ label: 'area =', ans: A, dp: 1 }], `(${th}/360) × π(${r})² ≈ ${A.toFixed(1)} m².`); }
      if (k === 1) { const d = R.pick([24, 28, 30, 32, 36, 40]), n = R.pick([6, 8, 10, 12]), A = Math.PI * (d / 2) ** 2 / n;
        return E.num(`A ${d} cm pizza is cut into ${n} equal slices. What is the area of one slice? Round to 1 decimal place.`, [{ label: 'area =', ans: A, dp: 1 }], `Radius ${d / 2} cm, so one slice = π(${d / 2})² ÷ ${n} ≈ ${A.toFixed(1)} cm². (Use the radius, not the ${d} cm diameter.)`); }
      if (k === 2) { const r1 = R.int(8, 20), r2v = r1 + R.int(30, 50), th = R.pick([100, 110, 120, 130, 140, 150]), A = th / 360 * Math.PI * (r2v * r2v - r1 * r1);
        return E.num(`A windshield wiper blade runs from ${r1} cm to ${r2v} cm from its pivot and sweeps ${th}°. What area does it clean? Round to the nearest whole number.`, [{ label: 'area =', ans: A, dp: 0 }], `Big sector − small sector: (${th}/360)π(${r2v}² − ${r1}²) ≈ ${Math.round(A)} cm².`); }
      if (k === 3) { const { s, L } = goat(R), A = 0.75 * Math.PI * L * L;
        return E.num(`A goat is tied with a ${L} m rope to an outside corner of a square shed ${s} m wide. It can't go through the shed. What area can it graze? Round to 1 decimal place.`, [{ label: 'area =', ans: A, dp: 1 }], `The shed blocks a 90° corner, so the goat sweeps 270°: (270/360)π(${L})² ≈ ${A.toFixed(1)} m². (The rope is no longer than the wall, so it never wraps round.)`); }
      const r = R.int(10, 30), th = R.pick([100, 120, 140, 150, 160]), A = th / 360 * Math.PI * r * r;
      return E.num(`A folding fan opens to ${th}° and its ribs are ${r} cm long. What area does the open fan cover? Round to 1 decimal place.`, [{ label: 'area =', ans: A, dp: 1 }], `(${th}/360) × π(${r})² ≈ ${A.toFixed(1)} cm².`); } },
    e: { t: 'work backwards', g: R => {
      const k = R.int(0, 2);
      if (k === 0) { let th, r; do { th = R.pick(NICE); r = R.int(2, 14); } while (gcd(th * r * r, 360) < 20);
        const A = piS(th * r * r, 360), { vis } = sectFig(R, th, { fill: 'sector', rl: 'r', arc: th > 180, arcLab: deg(th) });
        return E.num(`The shaded sector has area ${P(A)}. Find the radius r.`, [{ label: 'r =', ans: r }], `(${th}/360)πr² = ${P(A)}, so r² = ${P(A)} × 360/(${th}π) = ${r * r} and r = ${r}.`, { visual: vis }); }
      if (k === 1) { let th, r; do { th = R.pick(NICE); r = R.int(2, 12); } while (gcd(th * r, 180) < 10 || gcd(th * r * r, 360) < 10);
        const Ls = piS(th * r, 180), A = piS(th * r * r, 360);
        return E.num(`A sector has arc length ${P(Ls)} and area ${P(A)}. Find its radius.`, [{ label: 'r =', ans: r }], `Sector area = ½ × arc length × r (the sector is like a triangle with base the arc and height r). So ${P(A)} = ½ × ${P(Ls)} × r, giving r = ${r}.`); }
      let th, r; do { th = R.pick(NICE); r = R.int(2, 12); } while (gcd(th * r * r, 360) < 10);
      const A = piS(th * r * r, 360), { vis } = sectFig(R, th, { fill: 'sector', rl: String(r), al: th <= 180 ? 'θ' : false });
      return E.num(`The shaded sector has area ${P(A)} and radius ${r}. Find its central angle in degrees.`, [{ label: 'angle =', ans: th }], `θ/360 × π(${r})² = ${P(A)}, so θ/360 = ${E.fracStr(th, 360)} and θ = ${th}°.`, { visual: vis }); } },
    f: { t: 'find the shaded area', g: R => {
      const k = R.int(0, 3), s = R.pick([2, 4, 6, 8, 10, 12]);
      if (k === 0) { const pts = { A: [0, 0], B: [s, 0], Cc: [s, s], D: [0, s] }, Lt = lets(R, 4), nm = { A: Lt[0], B: Lt[1], Cc: Lt[2], D: Lt[3] }, Q = K.renamePts(K.xform(pts, 0, R.bool()), nm);
        const vis = cfig({ pts: Q, segs: [[Lt[0], Lt[1]], [Lt[1], Lt[2]], [Lt[2], Lt[3]], [Lt[3], Lt[0]]], fills: [{ c: Q[Lt[0]], r: s, a: Q[Lt[1]], b: Q[Lt[3]], kind: 'segment', color: C.blue, op: 0.3 }, { c: Q[Lt[2]], r: s, a: Q[Lt[1]], b: Q[Lt[3]], kind: 'segment', color: C.blue, op: 0.3 }],
          arcs: [{ c: Q[Lt[0]], r: s, a: Q[Lt[1]], b: Q[Lt[3]], color: C.ink, width: 2 }, { c: Q[Lt[2]], r: s, a: Q[Lt[1]], b: Q[Lt[3]], color: C.ink, width: 2 }], label: 'two quarter circles in a square' });
        const ans = `${piS(s * s, 2)}-${s * s}`;
        return E.num(`${Lt[0]}${Lt[1]}${Lt[2]}${Lt[3]} is a square of side ${s}. Quarter circles centered at ${Lt[0]} and ${Lt[2]} pass through ${Lt[1]} and ${Lt[3]}. Find the area of the dark lens where they overlap. Give an exact answer.`, [{ label: 'area =', exact: ans }],
          `Each quarter circle minus triangle ${Lt[1]}${Lt[3]}${Lt[0]} (or ${Lt[1]}${Lt[3]}${Lt[2]}) is a segment of area ${P(piS(s * s, 4))} − ${s * s / 2}. The lens is two such segments: ${P(ans)}.`, { visual: vis }); }
      if (k === 1) { let a, b; do { a = R.int(1, 6) * 2; b = R.int(1, 6) * 2; } while (a === b); const Lt = lets(R, 3), pts = {}; pts[Lt[0]] = [0, 0]; pts[Lt[1]] = [a, 0]; pts[Lt[2]] = [a + b, 0];
        const Rr = (a + b) / 2; pts._top = [Rr, Rr]; pts._bot = [Rr, -0.16 * Rr];
        const vis = cfig({ pts, segs: [[Lt[0], Lt[2]]], paths: [(T, sc) => { const p0 = T(pts[Lt[0]]), p1 = T(pts[Lt[1]]), p2 = T(pts[Lt[2]]);
          return `<path d="M${p0[0]} ${p0[1]} A${r2(Rr * sc)} ${r2(Rr * sc)} 0 0 1 ${p2[0]} ${p2[1]} A${r2(b / 2 * sc)} ${r2(b / 2 * sc)} 0 0 0 ${p1[0]} ${p1[1]} A${r2(a / 2 * sc)} ${r2(a / 2 * sc)} 0 0 0 ${p0[0]} ${p0[1]} Z" fill="${C.blue}" fill-opacity="0.28" stroke="${C.ink}" stroke-width="2"/>`; }],
          text: [[[a / 2, -0.12 * Rr], String(a)], [[a + b / 2, -0.12 * Rr], String(b)]], label: 'arbelos', w: 280 });
        return E.num(`Semicircles are drawn on ${Lt[0]}${Lt[1]} = ${a}, ${Lt[1]}${Lt[2]} = ${b} and ${Lt[0]}${Lt[2]}, all on the same side. Find the area of the shaded region inside the big semicircle but outside the two small ones. Give an exact answer.`, [{ label: 'area =', exact: piS(a * b, 4) }],
          `Big − small − small = (π/8)[(${a + b})² − ${a}² − ${b}²] = (π/8)(2 × ${a} × ${b}) = ${P(piS(a * b, 4))}.`, { visual: vis }); }
      if (k === 2) { const r = s, Lt = lets(R, 2), pts = { O: [0, 0] }; pts[Lt[0]] = [r, 0]; pts[Lt[1]] = [0, r]; const Q = K.xform(pts, K.rad(R.int(0, 71) * 5), R.bool());
        const Oc = Q.O, A = Q[Lt[0]], B = Q[Lt[1]], m = K.mid(A, B), out = add(m, mul(unit(sub(m, Oc)), r / Math.SQRT2));
        const vis = cfig({ pts: Object.assign({}, Q, { _m: out }), segs: [['O', Lt[0]], ['O', Lt[1]], [Lt[0], Lt[1], { dash: true }]],
          fills: [{ c: m, r: r / Math.SQRT2, a: A, b: B, thru: out, kind: 'segment', op: 0.3 }, { c: Oc, r, a: A, b: B, kind: 'segment', color: '#FFFFFF', op: 1 }],
          arcs: [{ c: Oc, r, a: A, b: B, color: C.ink, width: 2 }, { c: m, r: r / Math.SQRT2, a: A, b: B, thru: out, color: C.ink, width: 2 }], angles: [[Lt[0], 'O', Lt[1], '', { right: true }]], label: 'lune of Hippocrates' });
        return E.num(`O${Lt[0]}${Lt[1]} is a quarter circle of radius ${r}. A semicircle is drawn outward on chord ${Lt[0]}${Lt[1]}. Find the area of the shaded crescent between the two arcs.`, [{ label: 'area =', ans: r * r / 2 }],
          `${Lt[0]}${Lt[1]} = ${r}√2, so the semicircle has area ½π(${r}/√2)² = ${P(piS(r * r, 4))}, the same as the quarter circle. Crescent = semicircle − (quarter circle − triangle O${Lt[0]}${Lt[1]}) = the triangle = ½ × ${r} × ${r} = ${r * r / 2}. No π at all!`, { visual: vis }); }
      const t = s / 2, Lt = lets(R, 2), pts = { O: [0, 0] }; pts[Lt[0]] = [s, 0]; pts[Lt[1]] = [0, s];
      const Q = K.xform(pts, K.rad(R.int(0, 71) * 5), R.bool()), A = Q[Lt[0]], B = Q[Lt[1]], mA = K.mid(Q.O, A), mB = K.mid(Q.O, B), far = add(mA, sub(mB, Q.O));
      const vis = cfig({ pts: Q, segs: [['O', Lt[0]], ['O', Lt[1]]], fills: [{ c: mA, r: t, a: Q.O, b: far, kind: 'segment', op: 0.32 }, { c: mB, r: t, a: Q.O, b: far, kind: 'segment', op: 0.32 }],
        arcs: [{ c: Q.O, r: s, a: A, b: B, color: C.ink, width: 2 }, { c: mA, r: t, a: Q.O, b: A, thru: add(mA, mul(unit(sub(B, Q.O)), t)), color: C.ink, width: 2 }, { c: mB, r: t, a: Q.O, b: B, thru: add(mB, mul(unit(sub(A, Q.O)), t)), color: C.ink, width: 2 }], label: 'quarter circle with two semicircles' });
      const ans = `${piS(t * t, 2)}-${t * t}`;
      return E.num(`O${Lt[0]}${Lt[1]} is a quarter circle of radius ${s}. Semicircles are drawn inside it on O${Lt[0]} and O${Lt[1]}. Find the area of the shaded lens where the two semicircles overlap. Give an exact answer.`, [{ label: 'area =', exact: ans }],
        `Each semicircle has radius ${t}. The lens is two segments of a 90° arc in a circle of radius ${t}: 2[π(${t})²/4 − ${t}²/2] = ${P(ans)}. (Neat fact: it equals the unshaded part of the quarter circle outside both semicircles.)`, { visual: vis }); } },
  });

  /* ================= V.8.05 Radians ================= */
  const RAD = [[30, 'pi/6'], [45, 'pi/4'], [60, 'pi/3'], [90, 'pi/2'], [120, '2pi/3'], [135, '3pi/4'], [150, '5pi/6'], [180, 'pi'], [210, '7pi/6'], [225, '5pi/4'], [240, '4pi/3'], [270, '3pi/2'], [300, '5pi/3'], [315, '7pi/4'], [330, '11pi/6'], [360, '2pi'], [20, 'pi/9'], [36, 'pi/5'], [72, '2pi/5'], [15, 'pi/12'], [105, '7pi/12'], [40, '2pi/9'], [100, '5pi/9']];
  S('V.8.05', 'Radians', {
    a: { t: 'arc length over radius', g: R => {
      const k = R.int(0, 5);
      if (k === 0) return E.choice(R, 'An arc is exactly as long as the radius. What angle does it make at the center?', '1 radian', ['1°', 'π radians', '60°'], 'That is the definition of one radian: arc length ÷ radius = 1. It is about 57.3°.');
      if (k === 1) return E.choice(R, 'How many radians make a full turn?', '2π', ['π', '360', '180'], 'The whole circumference is 2πr, so the full angle is 2πr ÷ r = 2π radians.');
      let s, r; do { r = R.int(2, 12); s = R.int(1, 40); } while (s === r || Math.abs(Math.round(s / r * 1000) - s / r * 1000) > 1e-6 || s / r > 6.2);
      const { vis } = sectFig(R, s / r * 180 / Math.PI, { arc: true, arcLab: `${s} cm`, rl: `${r} cm`, al: 'θ' });
      return E.num(`The blue arc is ${s} cm long and the radius is ${r} cm. Find the angle θ in radians.`, [{ label: 'θ =', ans: s / r }], `Radians = arc length ÷ radius = ${s} ÷ ${r} = ${+(s / r).toFixed(3)}.`, { visual: vis }); } },
    b: { t: 'convert degrees and radians', g: R => {
      const [d, rr] = R.pick(RAD), k = R.int(0, 4);
      if (k <= 1) return E.num(`Convert ${d}° to radians. Give an exact answer in terms of π.`, [{ exact: rr, form: 'simplest' }], `Multiply by π/180: ${d} × π/180 = ${P(rr)}.`);
      if (k <= 3) return E.num(`Convert ${M(rr)} radians to degrees.`, [{ label: 'degrees =', ans: d }], `π radians = 180°, so replace π by 180°: ${P(rr.replace('pi', '(180)'))} = ${d}°.`);
      const x = R.pick([1, 2, 3, 0.5, 1.5, 2.5, 4, 5]), dd = x * 180 / Math.PI;
      return E.num(`Convert ${x} radians to degrees. Round to 1 decimal place.`, [{ label: 'degrees =', ans: dd, dp: 1 }], `Multiply by 180/π: ${x} × 180/π ≈ ${dd.toFixed(1)}°. (Here there is no π to swap for 180, because π itself is just 3.14159…)`); } },
    c: { t: 's = rθ', g: R => {
      const k = R.int(0, 3);
      if (k === 0) { const r = R.int(2, 15), t = R.int(2, 30) / 10, s = r * t;
        return E.num(`A circle has radius ${r} cm. Find the length of the arc cut off by a central angle of ${t} radians.`, [{ label: 's =', ans: +s.toFixed(3) }], `s = rθ = ${r} × ${t} = ${+s.toFixed(3)} cm.`); }
      if (k === 1) { const [d, rr] = R.pick(RAD.filter(x => x[0] < 360)), den = +((rr.split('/')[1]) || 1); let r = R.int(1, 6) * den; if (r > 36) r = den;
        const ans = piS(r * d, 180);
        return E.num(`Find the arc length for radius ${r} and central angle ${M(rr)}. Give an exact answer in terms of π.`, [{ label: 's =', exact: ans, form: 'simplest' }], `s = rθ = ${r} × ${P(rr)} = ${P(ans)}.`); }
      if (k === 2) { let s, t; do { t = R.int(2, 25) / 10; s = R.int(3, 40); } while (Math.abs(Math.round(s / t * 1000) - s / t * 1000) > 1e-6);
        return E.num(`An arc of length ${s} m has a central angle of ${t} radians. Find the radius.`, [{ label: 'r =', ans: +(s / t).toFixed(3) }], `r = s ÷ θ = ${s} ÷ ${t} = ${+(s / t).toFixed(3)} m.`); }
      const r = R.int(2, 10), m = R.int(1, 5), s = r * m;
      return E.num(`A wheel of radius ${r} cm rolls ${s} cm without slipping. Through what angle does it turn, in radians?`, [{ label: 'θ =', ans: m }], `The distance rolled is the arc length: θ = s ÷ r = ${s} ÷ ${r} = ${m} radians.`); } },
    d: { t: 'sector area ½r²θ', g: R => {
      const k = R.int(0, 2);
      if (k === 0) { const r = R.int(2, 12), t = R.int(2, 30) / 10, A = r * r * t / 2;
        const { vis } = sectFig(R, t * 180 / Math.PI, { fill: 'sector', rl: String(r), al: t * 180 / Math.PI <= 180 ? `${t}` : false, arc: t * 180 / Math.PI > 180, arcLab: `${t} rad` });
        return E.num(`The sector has radius ${r} and central angle ${t} radians. Find its area.`, [{ label: 'area =', ans: +A.toFixed(3) }], `A = ½r²θ = ½ × ${r * r} × ${t} = ${+A.toFixed(3)}.`, { visual: vis }); }
      if (k === 1) { const [d, rr] = R.pick(RAD.filter(x => x[0] < 360)), r = R.int(2, 12), ans = piS(r * r * d, 360);
        return E.num(`Find the area of a sector with radius ${r} and central angle ${M(rr)}. Give an exact answer in terms of π.`, [{ label: 'area =', exact: ans, form: 'simplest' }], `A = ½r²θ = ½ × ${r * r} × ${P(rr)} = ${P(ans)}.`); }
      let r, A, t; do { r = R.int(2, 10); t = R.int(2, 30) / 10; A = r * r * t / 2; } while (Math.abs(Math.round(A * 1000) - A * 1000) > 1e-6);
      return E.num(`A sector of radius ${r} has area ${+A.toFixed(3)}. Find its central angle in radians.`, [{ label: 'θ =', ans: t }], `½ × ${r * r} × θ = ${+A.toFixed(3)}, so θ = ${+A.toFixed(3)} ÷ ${r * r / 2} = ${t}.`); } },
  });

  /* ================= shared: proof questions =================
     lines: [statement, reason, deps, [3 wrong reasons], why]. mode 'order' | 'reason' | 'broken' (needs breaks: [{i, st|rs, why}]) */
  const proof = (R, mode, cfg) => {
    const L = cfg.lines, fixed = cfg.fixed ?? 1, head = cfg.head, vis = cfg.vis ? { visual: cfg.vis } : {};
    if (mode === 'order') return K.orderQ(R, `${head} Put the steps of the proof in order.`, L.map(l => `${l[0]} (${l[1]})`), L.map(l => l[2]), cfg.oexp || `Each step must come after the steps it uses. The proof ends with ${L[L.length - 1][0]}.`, Object.assign({ fixed }, vis));
    if (mode === 'reason') { const cand = L.map((l, i) => i).filter(i => i >= fixed && L[i][3]), k = R.pick(cand), [st, rs, , wr, why] = L[k];
      return E.choice(R, `${head} What is the reason for step ${k + 1}?${twoCol(L.map(l => [l[0], l[1]]), k)}`, rs, wr, `Step ${k + 1}: ${st} because ${why}.`, vis); }
    const b = R.pick(cfg.breaks), rows = L.map((l, i) => i === b.i ? [b.st || l[0], b.rs || l[1]] : [l[0], l[1]]), opts = L.map((l, i) => i).filter(i => i >= fixed);
    return E.choiceFixed(`${head} Exactly one step of this proof is wrong. Which one?${twoCol(rows, -1)}`, opts.map(i => `Step ${i + 1}`), opts.indexOf(b.i), `Step ${b.i + 1} is wrong: ${b.why}.`, vis);
  };

  /* ================= V.8.06 Inscribed angle theorem ================= */
  // inscribed angle: arc AC = m (not containing B); u places B along the other arc
  const inscPts = (R, m, u) => { const tr = turn(R), L = lets(R, 3), pts = { O: [0, 0] }; pts[L[0]] = tr(0); pts[L[2]] = tr(m); pts[L[1]] = tr(m + (360 - m) * (u ?? R.int(30, 70) / 100)); return { L, pts, tr }; };
  const caseFig = (R, kind, L = lets(R, 3)) => { const tr = turn(R), [a, b, c] = L, pts = { O: [0, 0] }; pts[b] = tr(0);
    if (kind === 0) { pts[c] = tr(180); pts[a] = tr(R.pick([1, -1]) * R.int(60, 130)); }
    else if (kind === 1) { pts[a] = tr(180 - R.int(30, 70)); pts[c] = tr(180 + R.int(30, 70)); }
    else { const p = R.int(25, 45), q = p + R.int(40, 70); pts[a] = tr(180 - p); pts[c] = tr(180 - q); }
    return { L, pts, vis: cfig({ pts, segs: [[b, a], [b, c]], circ: [{ c: 'O', r: 3 }], angles: [[a, b, c, '']], label: 'inscribed angle and the center' }) }; };
  const CASE1 = [
    ['O lies on side BC', 'given', []],
    ['OA = OB', 'radii of the same circle', [], ['given', 'vertical angles', 'CPCTC'], 'OA and OB both join the center to the circle'],
    ['∠OAB = ∠OBA', 'base angles of an isosceles triangle', [1], ['vertical angles', 'inscribed angle theorem', 'alternate interior angles'], 'triangle OAB has OA = OB, so its base angles match'],
    ['∠AOC = ∠OAB + ∠OBA', 'exterior angle theorem', [0], ['triangle sum theorem', 'linear pair', 'base angles of an isosceles triangle'], '∠AOC is an exterior angle of triangle OAB, so it equals the two remote interior angles'],
    ['∠AOC = 2∠ABC', 'substitution', [2, 3], ['exterior angle theorem', 'given', 'vertical angles'], 'the two equal base angles are each ∠ABC, so their sum is 2∠ABC'],
    ['∠ABC = ½ arc AC', 'a central angle equals its arc', [4], ['inscribed angle theorem', 'given', 'vertical angles'], 'arc AC has the same measure as the central angle ∠AOC, and ∠ABC is half of it'],
  ];
  S('V.8.06', 'Inscribed angle theorem', {
    a: { t: 'half the intercepted arc', g: R => {
      const m = 2 * R.int(20, 140), k = R.int(0, 2), { L, pts } = inscPts(R, m), [a, b, c] = L;
      if (k === 2) { const vis = cfig({ pts, segs: [[b, a], [b, c], ['O', a], ['O', c]], circ: [{ c: 'O', r: 3 }], angles: [[a, b, c, 'x°'], ...(m < 180 ? [[a, 'O', c, deg(m)]] : [])], arcs: m >= 180 ? [{ c: 'O', r: 3, a, b: c, big: true, lab: deg(m) }] : [], label: 'inscribed and central angle' });
        return E.num(`O is the center. Find x.`, [{ label: 'x =', ans: m / 2 }], `The inscribed angle is half the central angle on the same arc: ${m} ÷ 2 = ${m / 2}.`, { visual: vis }); }
      const back = k === 1, vis = cfig({ pts, segs: [[b, a], [b, c]], circ: [{ c: 'O', r: 3 }], angles: [[a, b, c, back ? deg(m / 2) : 'x°']], arcs: [{ c: 'O', r: 3, a, b: c, thru: undefined, big: m > 180, lab: back ? `x°` : deg(m) }], label: 'inscribed angle and its arc' });
      return back ? E.num(`Find x, the measure of the blue arc.`, [{ label: 'x =', ans: m }], `An inscribed angle is half its intercepted arc, so the arc is double the angle: 2 × ${m / 2} = ${m}.`, { visual: vis })
        : E.num(`Find x.`, [{ label: 'x =', ans: m / 2 }], `An inscribed angle is half the arc it intercepts: ${m} ÷ 2 = ${m / 2}.`, { visual: vis }); } },
    b: { t: 'prove it (three cases)', g: R => {
      const k = R.pick([0, 0, 1, 1, 2, 3]);
      if (k === 0) { const kind = R.int(0, 2), { L, vis } = caseFig(R, kind), [a, b, c] = L;
        return E.choiceFixed(`The proof of the inscribed angle theorem splits into three cases. Where is the center O for ∠${a}${b}${c}?`, ['On a side of the angle', 'Inside the angle', 'Outside the angle'], kind,
          ['O lies on side ' + b + c + ', which is a diameter. This is the base case, proved with one isosceles triangle.', 'O is between the sides. Draw the diameter from ' + b + ' and add two base-case results.', 'O is beyond both sides. Draw the diameter from ' + b + ' and subtract two base-case results.'][kind], { visual: vis }); }
      const L = lets(R, 3), map = { A: L[0], B: L[1], C: L[2] }, rn = K.rnF(map), tr = turn(R), al = R.pick([1, -1]) * R.int(60, 125), pts = { O: [0, 0] }; pts[L[1]] = tr(0); pts[L[2]] = tr(180); pts[L[0]] = tr(al);
      const vis = cfig({ pts, segs: [[L[1], L[0]], [L[1], L[2]], ['O', L[0]]], circ: [{ c: 'O', r: 3 }], label: 'inscribed angle with the center on one side' });
      const lines = CASE1.map(l => [rn(l[0]), l[1], l[2], l[3], l[4] && rn(l[4])]), head = `Case 1: the center O lies on side ${L[1]}${L[2]} of inscribed ∠${L[0]}${L[1]}${L[2]}. Prove: ∠${L[0]}${L[1]}${L[2]} = ½ arc ${L[0]}${L[2]}.`;
      if (k === 1) return proof(R, 'order', { head, lines, vis, oexp: `O${L[0]} = O${L[1]} makes an isosceles triangle, the exterior angle ∠${L[0]}O${L[2]} is the sum of its two equal base angles, so it is 2∠${L[0]}${L[1]}${L[2]}, and the arc equals that central angle.` });
      if (k === 2) return proof(R, 'reason', { head, lines, vis });
      const inside = R.bool();
      return E.choiceFixed(`For the case where O is ${inside ? 'inside' : 'outside'} inscribed ∠${L[0]}${L[1]}${L[2]}, draw the diameter ${L[1]}D. How does the proof finish?`, ['Add two case-1 results', 'Subtract two case-1 results', 'Multiply two case-1 results'], inside ? 0 : 1,
        inside ? `D lies between the sides, so ∠${L[0]}${L[1]}${L[2]} = ∠${L[0]}${L[1]}D + ∠D${L[1]}${L[2]} = ½ arc ${L[0]}D + ½ arc D${L[2]} = ½ arc ${L[0]}${L[2]}.` : `Both sides are on one side of ${L[1]}D, so ∠${L[0]}${L[1]}${L[2]} = ∠D${L[1]}${L[2]} − ∠D${L[1]}${L[0]} = ½ arc D${L[2]} − ½ arc D${L[0]} = ½ arc ${L[0]}${L[2]}.`, { visual: caseFig(R, inside ? 1 : 2, L).vis }); } },
    c: { t: 'same arc, equal angles', g: R => {
      const k = R.int(0, 2), m = 2 * R.int(25, 75), tr = turn(R), L = lets(R, 4), [a, b, c, d] = L, pts = { O: [0, 0] };
      pts[a] = tr(0); pts[c] = tr(m); const u1 = R.int(20, 40) / 100, u2 = R.int(60, 80) / 100; pts[b] = tr(m + (360 - m) * u1); pts[d] = tr(m + (360 - m) * u2);
      const segs = [[b, a], [b, c], [d, a], [d, c]];
      if (k === 0) { const vis = cfig({ pts, segs, circ: [{ c: 'O', r: 3 }], angles: [[a, b, c, deg(m / 2)], [a, d, c, 'x°']], label: 'two inscribed angles on the same arc' });
        return E.num('Find x.', [{ label: 'x =', ans: m / 2 }], `∠${a}${b}${c} and ∠${a}${d}${c} both intercept arc ${a}${c}, so they are equal: x = ${m / 2}.`, { visual: vis }); }
      if (k === 1) { let x, e1, e2, cnt = 0; do { x = R.int(4, 20); const p = R.int(1, 5), q = R.int(1, 5); e1 = [p, m / 2 - p * x]; e2 = [q, m / 2 - q * x]; cnt++; } while ((e1[0] === e2[0] || Math.abs(e1[1]) > 50 || Math.abs(e2[1]) > 50) && cnt < 200);
        if (e1[0] === e2[0]) { e1 = [2, m / 2 - 2 * 5]; e2 = [3, m / 2 - 15]; x = 5; }
        const vis = cfig({ pts, segs, circ: [{ c: 'O', r: 3 }], angles: [[a, b, c, exD(...e1)], [a, d, c, exD(...e2)]], label: 'two inscribed angles on the same arc' });
        return E.num('Find x.', [{ label: 'x =', ans: x }], `Both angles intercept arc ${a}${c}, so ${M(`${linM(...e1)}=${linM(...e2)}`)} and x = ${x}.`, { visual: vis }); }
      // diagonals of a cyclic quadrilateral: which angle equals ∠ABD?
      let arcs; do { arcs = [R.int(50, 120), R.int(50, 120), R.int(50, 120)]; arcs.push(360 - arcs[0] - arcs[1] - arcs[2]); } while (arcs[3] < 50 || arcs[3] > 120 || new Set(arcs).size < 4 || Math.min(...arcs.flatMap((x, i) => arcs.slice(i + 1).map(y => Math.abs(x - y)))) < 8);
      const Q = { O: [0, 0] }; Q[a] = tr(0); Q[b] = tr(arcs[0]); Q[c] = tr(arcs[0] + arcs[1]); Q[d] = tr(arcs[0] + arcs[1] + arcs[2]);
      const vis = cfig({ pts: Q, segs: [[a, b], [b, c], [c, d], [d, a], [a, c], [b, d]], circ: [{ c: 'O', r: 3 }], label: 'cyclic quadrilateral with diagonals' });
      return E.choice(R, `${a}${b}${c}${d} is inscribed in the circle. Which angle must equal ∠${a}${b}${d}?`, `∠${a}${c}${d}`, [`∠${d}${b}${c}`, `∠${b}${a}${c}`, `∠${a}${d}${b}`],
        `∠${a}${b}${d} intercepts arc ${a}${d}. The other angle with its vertex on the circle that intercepts arc ${a}${d} is ∠${a}${c}${d}.`, { visual: vis }); } },
    d: { t: 'solve for x', g: R => {
      const k = R.int(0, 1); let x, m, e1, e2, cnt = 0;
      do { x = R.int(4, 25); m = 2 * R.int(25, 85); const p = R.int(1, 4), q = R.int(1, 6); e1 = [p, m / 2 - p * x]; e2 = [q, m - q * x]; cnt++; } while ((e2[0] === 2 * e1[0] || Math.abs(e1[1]) > 50 || Math.abs(e2[1]) > 60) && cnt < 300);
      const { L, pts } = inscPts(R, m), [a, b, c] = L, askAng = R.bool(0.3);
      if (k === 0) { const vis = cfig({ pts, segs: [[b, a], [b, c]], circ: [{ c: 'O', r: 3 }], angles: [[a, b, c, exD(...e1)]], arcs: [{ c: 'O', r: 3, a, b: c, big: m > 180, lab: exD(...e2) }], label: 'inscribed angle and its arc' });
        return E.num(askAng ? `Find the measure of ∠${a}${b}${c}.` : 'Find x.', [askAng ? { label: `∠${a}${b}${c} =`, ans: m / 2 } : { label: 'x =', ans: x }],
          `The arc is twice the inscribed angle: ${M(`${linM(...e2)}=2(${linM(...e1)})`)}, so x = ${x}.${askAng ? ` ∠${a}${b}${c} = ${m / 2}°.` : ''}`, { visual: vis }); }
      const vis = cfig({ pts, segs: [[b, a], [b, c], ['O', a], ['O', c]], circ: [{ c: 'O', r: 3 }], angles: [[a, b, c, exD(...e1)], ...(m < 180 ? [[a, 'O', c, exD(...e2)]] : [])], arcs: m >= 180 ? [{ c: 'O', r: 3, a, b: c, big: true, lab: exD(...e2) }] : [], label: 'inscribed and central angle' });
      return E.num(askAng ? `O is the center. Find the measure of ∠${a}${b}${c}.` : 'O is the center. Find x.', [askAng ? { label: `∠${a}${b}${c} =`, ans: m / 2 } : { label: 'x =', ans: x }],
        `The central angle is twice the inscribed angle on the same arc: ${M(`${linM(...e2)}=2(${linM(...e1)})`)}, so x = ${x}.${askAng ? ` ∠${a}${b}${c} = ${m / 2}°.` : ''}`, { visual: vis }); } },
    e: { t: 'add an isosceles triangle', g: R => {
      const th = R.int(25, 80), back = R.bool(0.4), { L, pts } = inscPts(R, 2 * th), [a, b, c] = L;
      const vis = cfig({ pts, segs: [[a, b], [b, c], [c, a], ['O', a], ['O', c]], circ: [{ c: 'O', r: 3 }], angles: [[a, b, c, back ? 'x°' : deg(th)], ['O', a, c, back ? deg(90 - th) : 'y°']], label: 'inscribed triangle with two radii' });
      if (back) return E.num(`O is the center. Find x.`, [{ label: 'x =', ans: th }], `Triangle O${a}${c} is isosceles (radii), so ∠${a}O${c} = 180 − 2(${90 - th}) = ${2 * th}°. The inscribed angle is half of that: x = ${th}.`, { visual: vis });
      return E.num(`O is the center. Find y.`, [{ label: 'y =', ans: 90 - th }], `∠${a}O${c} = 2 × ${th} = ${2 * th}° (central vs inscribed). Triangle O${a}${c} is isosceles with O${a} = O${c}, so y = (180 − ${2 * th}) ÷ 2 = ${90 - th}.`, { visual: vis }); } },
    f: { t: 'equally spaced points', g: R => {
      const n = R.pick([9, 10, 12, 15, 18, 20, 24, 30, 36]), st = 180 / n; let i, j, k2; do { [i, j, k2] = R.distinct(0, n - 1, 3).sort((x, y) => x - y); } while (j - i < 2 || k2 - j < 2 || n - k2 + i < 2);
      const order = R.shuffle([i, j, k2]), [p, v, q] = order, inArc = ((q - p + n) % n), steps = ((v - p + n) % n) < inArc ? n - inArc : inArc, ans = steps * st;
      if (n > 12 || R.bool(0.4)) return E.num(`A regular ${n}-gon has vertices P<sub>1</sub>, P<sub>2</sub>, …, P<sub>${n}</sub> in order. Find ∠P<sub>${p + 1}</sub>P<sub>${v + 1}</sub>P<sub>${q + 1}</sub>.`, [{ ans }],
        `The vertices lie on a circle, ${n} equal arcs of ${360 / n}° each. The angle at P${v + 1} intercepts the arc from P${p + 1} to P${q + 1} that avoids P${v + 1}: ${steps} arcs, ${steps * 360 / n}°. Half of that is ${ans}°.`);
      const rot = R.int(0, 71) * 5, L = lets(R, 3), pts = { O: [0, 0] }, dots = []; for (let z = 0; z < n; z++) dots.push(polar(3, rot + z * 360 / n));
      pts[L[0]] = dots[p]; pts[L[1]] = dots[v]; pts[L[2]] = dots[q]; pts._ = [0, 0];
      const vis = cfig({ pts, segs: [[L[1], L[0]], [L[1], L[2]]], circ: [{ c: 'O', r: 3 }], dots, angles: [[L[0], L[1], L[2], '']], hide: ['O'], label: `${n} equally spaced points on a circle` });
      return E.num(`The ${n} dots are equally spaced around the circle. Find ∠${L[0]}${L[1]}${L[2]}.`, [{ ans }], `Each gap is ${360 / n}°. ∠${L[0]}${L[1]}${L[2]} intercepts ${steps} gaps, ${steps * 360 / n}°, so it is half of that: ${ans}°.`, { visual: vis }); } },
  });

  /* ================= V.8.07 Inscribed angle corollaries ================= */
  const cycArcs = R => { let A; do { A = [R.int(25, 65), R.int(25, 65), R.int(25, 65)].map(x => 2 * x); A.push(360 - A[0] - A[1] - A[2]); } while (A[3] < 50 || A[3] > 130); return A; };
  const cycFig = (R, arcs, labs, extra = {}, L = lets(R, 4)) => { const tr = turn(R), pts = { O: [0, 0] }; let t = 0; L.forEach((l, i) => { pts[l] = tr(t); t += arcs[i]; });
    const angs = [0, 1, 2, 3].filter(i => labs[i] !== undefined).map(i => [L[(i + 3) % 4], L[i], L[(i + 1) % 4], labs[i]]);
    return { L, vis: cfig({ pts, segs: [[L[0], L[1]], [L[1], L[2]], [L[2], L[3]], [L[3], L[0]], ...(extra.segs || []).map(([p, q]) => [L[p], L[q]])], circ: [{ c: 'O', r: 3 }], angles: angs, hide: ['O'], label: 'quadrilateral inscribed in a circle' }) }; };
  const quadAng = (arcs, i) => (arcs[(i + 1) % 4] + arcs[(i + 2) % 4]) / 2;  // angle at vertex i
  const SEMI = [['AB is a diameter and C is on the circle', 'given', []],
    ['arc AB (not containing C) measures 180°', 'a diameter cuts off a semicircle', [0], ['inscribed angle theorem', 'tangent ⊥ radius', 'vertical angles'], 'a diameter splits the circle into two 180° arcs'],
    ['∠ACB = ½ · 180°', 'inscribed angle theorem', [1], ['a diameter cuts off a semicircle', 'triangle sum theorem', 'exterior angle theorem'], 'an inscribed angle is half its intercepted arc'],
    ['∠ACB = 90°', 'simplify', [2]]];
  const CYC = [['ABCD is inscribed in a circle', 'given', []],
    ['∠A = ½ arc BCD', 'inscribed angle theorem', [0], ['a central angle equals its arc', 'vertical angles', 'given'], '∠A is inscribed and intercepts arc BCD'],
    ['∠C = ½ arc BAD', 'inscribed angle theorem', [0], ['a central angle equals its arc', 'alternate interior angles', 'given'], '∠C is inscribed and intercepts arc BAD'],
    ['arc BCD + arc BAD = 360°', 'the two arcs make the whole circle', [0], ['inscribed angle theorem', 'a diameter cuts off a semicircle', 'triangle sum theorem'], 'together the two arcs go once round the circle'],
    ['∠A + ∠C = ½(arc BCD + arc BAD)', 'addition property of equality', [1, 2], ['subtraction property of equality', 'vertical angles', 'the two arcs make the whole circle'], 'it adds the two equations above'],
    ['∠A + ∠C = 180°', 'substitution', [3, 4], ['given', 'inscribed angle theorem', 'triangle sum theorem'], 'the arc total, 360°, replaces the sum of the arcs']];
  S('V.8.07', 'Inscribed angle corollaries', {
    a: { t: 'angle in a semicircle is 90°', g: R => {
      const k = R.int(0, 2), tr = turn(R), L = lets(R, 3), [a, b, c] = L, pts = { O: [0, 0] }; pts[a] = tr(0); pts[b] = tr(180);
      if (k === 2) { const [p, q, h] = R.pick(PTRIPLES.slice(0, 8)), sw = R.bool(), al = Math.atan2(sw ? q : p, sw ? p : q); pts[c] = tr(180 - 2 * al * 180 / Math.PI);
        const AC = sw ? p : q, BC = sw ? q : p, askR = R.bool(0.4);
        const vis = cfig({ pts, segs: [[a, b], [a, c, { lab: String(AC) }], [b, c, { lab: String(BC) }]], circ: [{ c: 'O', r: 3 }], label: 'triangle in a semicircle' });
        return E.num(`${a}${b} is a diameter. Find ${askR ? 'the radius of the circle' : `${a}${b}`}.`, [askR ? { label: 'radius =', ans: h / 2 } : { label: `${a}${b} =`, ans: h }],
          `∠${a}${c}${b} = 90° because it is inscribed in a semicircle. Pythagoras: ${a}${b} = √(${AC}² + ${BC}²) = ${h}${askR ? `, so the radius is ${h / 2}` : ''}.`, { visual: vis }); }
      const al = R.int(15, 75); pts[c] = tr(180 - 2 * al);
      if (k === 1) { const vis = cfig({ pts, segs: [[a, b], [a, c], [b, c]], circ: [{ c: 'O', r: 3 }], angles: [[a, c, b, 'x°']], label: 'triangle in a semicircle' });
        return E.num(`${a}${b} is a diameter. Find x.`, [{ label: 'x =', ans: 90 }], `∠${a}${c}${b} intercepts a semicircle (180°), so it is half of that: 90°. This holds wherever ${c} is on the circle.`, { visual: vis }); }
      const vis = cfig({ pts, segs: [[a, b], [a, c], [b, c]], circ: [{ c: 'O', r: 3 }], angles: [[c, a, b, deg(al)], [a, b, c, 'x°']], label: 'triangle in a semicircle' });
      return E.num(`${a}${b} is a diameter. Find x.`, [{ label: 'x =', ans: 90 - al }], `∠${a}${c}${b} = 90° (angle in a semicircle), so x = 180 − 90 − ${al} = ${90 - al}.`, { visual: vis }); } },
    b: { t: 'cyclic quadrilateral opposite angles', g: R => {
      const arcs = cycArcs(R), angs = [0, 1, 2, 3].map(i => quadAng(arcs, i)), i = R.int(0, 3), two = R.bool(0.4);
      if (two) { const labs = { [i]: deg(angs[i]), [(i + 1) % 4]: deg(angs[(i + 1) % 4]), [(i + 2) % 4]: 'x°', [(i + 3) % 4]: 'y°' }, { vis } = cycFig(R, arcs, labs);
        return E.num('The quadrilateral is inscribed in the circle. Find x and y.', [{ label: 'x =', ans: angs[(i + 2) % 4] }, { label: 'y =', ans: angs[(i + 3) % 4] }],
          `Opposite angles add to 180°: x = 180 − ${angs[i]} = ${angs[(i + 2) % 4]} and y = 180 − ${angs[(i + 1) % 4]} = ${angs[(i + 3) % 4]}.`, { visual: vis }); }
      const labs = { [i]: deg(angs[i]), [(i + 2) % 4]: 'x°' }, { vis } = cycFig(R, arcs, labs);
      return E.num('The quadrilateral is inscribed in the circle. Find x.', [{ label: 'x =', ans: 180 - angs[i] }], `Opposite angles of a cyclic quadrilateral are supplementary (not equal): x = 180 − ${angs[i]} = ${180 - angs[i]}.`, { visual: vis }); } },
    c: { t: 'find unknown angles', g: R => {
      const k = R.pick([0, 0, 1, 1, 2, 2, 3]);
      if (k === 3) return E.choice(R, 'Which kind of parallelogram can always be inscribed in a circle?', 'A rectangle', ['A rhombus', 'Any parallelogram', 'None of them'], 'A parallelogram has equal opposite angles. For a cyclic quadrilateral they must also add to 180°, so each is 90°: a rectangle.');
      if (k === 1) { const L = lets(R, 4), yes = R.bool(); let A, B, Cc, D; do { A = R.int(55, 125); B = R.int(55, 125); Cc = yes ? 180 - A : 180 - A + R.pick([-1, 1]) * R.int(4, 20); D = 360 - A - B - Cc; } while (D < 40 || D > 150 || Cc < 40 || (!yes && A + Cc === 180));
        return E.choiceFixed(`Quadrilateral ${L.join('')} has ∠${L[0]} = ${A}°, ∠${L[1]} = ${B}°, ∠${L[2]} = ${Cc}° and ∠${L[3]} = ${D}°. Can it be inscribed in a circle?`, ['Yes', 'No'], yes ? 0 : 1,
          yes ? `Opposite angles add to 180°: ${A} + ${Cc} = 180 and ${B} + ${D} = 180, so yes.` : `Opposite angles must add to 180°, but ∠${L[0]} + ∠${L[2]} = ${A + Cc}°. So no.`); }
      if (k === 2) { const arcs = cycArcs(R), i = R.int(0, 3), [p, q, c2, d2] = [0, 1, 2, 3].map(z => (i + z) % 4);
        const al = arcs[q] / 2, be = arcs[c2] / 2;   // ∠(q)p(c2) = ½ arc q→c2 ; diagonal from p to c2
        const tr = turn(R), L = lets(R, 4), pts = { O: [0, 0] }; let t = 0; L.forEach((l, z) => { pts[l] = tr(t); t += arcs[z]; });
        return E.num(`${L.join('')} is inscribed in a circle. ∠${L[q]}${L[p]}${L[c2]} = ${al}° and ∠${L[c2]}${L[p]}${L[d2]} = ${be}°. Find ∠${L[q]}${L[c2]}${L[d2]}.`, [{ ans: 180 - al - be }],
          `∠${L[q]}${L[p]}${L[d2]} = ${al} + ${be} = ${al + be}°. The opposite angle ∠${L[q]}${L[c2]}${L[d2]} is its supplement: 180 − ${al + be} = ${180 - al - be}°.`,
          { visual: cfig({ pts, segs: [[L[0], L[1]], [L[1], L[2]], [L[2], L[3]], [L[3], L[0]], [L[p], L[c2]]], circ: [{ c: 'O', r: 3 }], angles: [[L[q], L[p], L[c2], deg(al)], [L[c2], L[p], L[d2], deg(be)], [L[q], L[c2], L[d2], '?']], hide: ['O'], label: 'cyclic quadrilateral with a diagonal' }) }); }
      let arcs, x, e1, e2, cnt = 0, i;
      do { arcs = cycArcs(R); i = R.int(0, 3); const A = quadAng(arcs, i); x = R.int(5, 25); const p = R.int(1, 5), q = R.int(1, 5); e1 = [p, A - p * x]; e2 = [q, 180 - A - q * x]; cnt++; } while ((Math.abs(e1[1]) > 50 || Math.abs(e2[1]) > 50) && cnt < 400);
      const { vis } = cycFig(R, arcs, { [i]: exD(...e1), [(i + 2) % 4]: exD(...e2) }), askA = R.bool(0.3);
      return E.num(askA ? 'The quadrilateral is inscribed in the circle. Find the larger of the two marked angles.' : 'The quadrilateral is inscribed in the circle. Find x.', [askA ? { ans: Math.max(quadAng(arcs, i), 180 - quadAng(arcs, i)) } : { label: 'x =', ans: x }],
        `Opposite angles are supplementary: ${M(`${linM(e1[0] + e2[0], e1[1] + e2[1])}=180`)}, so x = ${x}.${askA ? ` The angles are ${quadAng(arcs, i)}° and ${180 - quadAng(arcs, i)}°.` : ''}`, { visual: vis }); } },
    d: { t: 'proofs', g: R => {
      const semi = R.bool(0.4), L = lets(R, 4), map = { A: L[0], B: L[1], C: L[2], D: L[3] }, rn = K.rnF(map), mode = R.pick(['order', 'order', 'reason', 'reason', 'broken']);
      if (semi) { const tr = turn(R), pts = { O: [0, 0] }; pts[L[0]] = tr(0); pts[L[1]] = tr(180); pts[L[2]] = tr(R.int(30, 150));
        const vis = cfig({ pts, segs: [[L[0], L[1]], [L[0], L[2]], [L[1], L[2]]], circ: [{ c: 'O', r: 3 }], label: 'triangle in a semicircle' }), lines = SEMI.map(l => [rn(l[0]), l[1], l[2], l[3], l[4]]);
        const head = `Given: ${rn('AB')} is a diameter and ${rn('C')} is on the circle. Prove: ∠${rn('ACB')} = 90°.`;
        if (mode === 'broken') return proof(R, 'broken', { head, lines, vis, breaks: [{ i: 1, rs: 'inscribed angle theorem', why: 'the 180° comes from the diameter cutting the circle in half; no inscribed angle is involved yet' }, { i: 2, rs: 'a central angle equals its arc', why: `∠${rn('ACB')} has its vertex on the circle, not at the center, so the inscribed angle theorem applies` }] });
        return proof(R, mode === 'order' ? 'order' : 'reason', { head, lines, vis, oexp: 'The diameter gives a 180° arc, the inscribed angle is half of it, and half of 180° is 90°.' }); }
      const { vis } = cycFig(R, cycArcs(R), {}, {}, L);
      const lines = CYC.map(l => [rn(l[0]), l[1], l[2], l[3], l[4] && rn(l[4])]), head = `Given: ${L.join('')} is inscribed in a circle. Prove: ∠${L[0]} + ∠${L[2]} = 180°.`;
      const visR = vis.replace(/aria-label="[^"]*"/, 'aria-label="quadrilateral inscribed in a circle"');
      if (mode === 'broken') return proof(R, 'broken', { head, lines, vis: visR, breaks: [{ i: 1, rs: 'a central angle equals its arc', why: `∠${L[0]} has its vertex on the circle, so it is an inscribed angle: half its arc, by the inscribed angle theorem` }, { i: 5, st: `∠${L[0]} = ∠${L[2]}`, why: 'opposite angles of a cyclic quadrilateral are supplementary, not equal; the arcs give ∠' + L[0] + ' + ∠' + L[2] + ' = ½ · 360° = 180°' }, { i: 3, rs: 'inscribed angle theorem', why: 'the 360° total comes from the two arcs making up the whole circle, not from an inscribed angle' }] });
      return proof(R, mode, { head, lines, vis: visR, oexp: `Each opposite angle is half the arc it intercepts; the two arcs make 360°, so the angles add to half of that, 180°. The two inscribed-angle lines and the arc-sum line can come in any order.` }); } },
  });

  /* ================= V.8.08 Tangent & radius ================= */
  const tanPts = (R, beta, rr = 3) => { const tr = turn(R), L = lets(R, 2), pts = { O: [0, 0] }; pts[L[0]] = tr(0, rr); pts[L[1]] = tr(beta, rr / Math.cos(beta * Math.PI / 180)); return { L, pts }; };
  const TANIND = [['line ℓ is tangent to the circle at T', 'given'], ['Assume OT is not perpendicular to ℓ.', 'assumption'], ['Let F be the foot of the perpendicular from O to ℓ; F is not T.', 'a perpendicular can be dropped to a line'],
    ['OF < OT', 'the perpendicular is the shortest segment from a point to a line'], ['F is inside the circle, so ℓ meets the circle at a second point', 'points closer to O than the radius are inside'], ['This contradicts ℓ being a tangent, so OT ⊥ ℓ.', 'contradiction']];
  const TPROOF = [['PT is tangent to circle O at T', 'given', []],
    ['OT ⊥ PT', 'a tangent is perpendicular to the radius at the point of tangency', [0], ['radii of the same circle', 'inscribed angle theorem', 'converse of the Pythagorean theorem'], 'OT is the radius to the point of tangency'],
    ['∠OTP = 90°', 'definition of perpendicular', [1], ['vertical angles', 'inscribed angle theorem', 'angle in a semicircle'], 'perpendicular lines meet at right angles'],
    ['OP² = OT² + PT²', 'Pythagorean theorem', [2], ['converse of the Pythagorean theorem', 'definition of perpendicular', 'exterior angle theorem'], 'triangle OTP has a right angle at T, with OP as the hypotenuse']];
  S('V.8.08', 'Tangent & radius', {
    a: { t: 'tangent ⊥ radius', g: R => {
      const be = R.int(38, 58), { L, pts } = tanPts(R, be), [t, p] = L, k = R.int(0, 2), segs = [['O', t], [t, p], ['O', p]];
      if (k === 2) { const vis = cfig({ pts, segs, circ: [{ c: 'O', r: 3 }], angles: [['O', t, p, 'x°']], label: 'tangent and radius' });
        return E.num(`${p}${t} is tangent to the circle at ${t}, and O is the center. Find x.`, [{ label: 'x =', ans: 90 }], `A tangent is perpendicular to the radius at the point of tangency, so ∠O${t}${p} = 90°.`, { visual: vis }); }
      const askO = k === 0, vis = cfig({ pts, segs, circ: [{ c: 'O', r: 3 }], angles: [['O', t, p, '', { right: true }], askO ? [t, p, 'O', deg(90 - be)] : [t, 'O', p, deg(be)], askO ? [t, 'O', p, 'x°'] : [t, p, 'O', 'x°']], label: 'tangent and radius' });
      return E.num(`${p}${t} is tangent to the circle at ${t}, and O is the center. Find x.`, [{ label: 'x =', ans: askO ? be : 90 - be }], `∠O${t}${p} = 90° (tangent ⊥ radius), so x = 90 − ${askO ? 90 - be : be} = ${askO ? be : 90 - be}.`, { visual: vis }); } },
    b: { t: 'find lengths with Pythagoras', g: R => {
      const exact = R.bool(0.25); let r, t, h, hs;
      if (exact) { do { r = R.int(2, 9); t = R.int(2, 12); } while (isSq(r * r + t * t)); hs = sqS(r * r + t * t); } else { const [a, b, c] = R.pick(PTRIPLES), sw = R.bool(); r = sw ? a : b; t = sw ? b : a; h = c; hs = String(c); }
      const be = Math.atan2(t, r) * 180 / Math.PI, { L, pts } = tanPts(R, be), [tp, p] = L, ask = exact ? 0 : R.int(0, 2);
      const labs = [[String(r), String(t), '?'], [String(r), '?', String(h)], ['?', String(t), String(h)]][ask];
      const vis = cfig({ pts, segs: [['O', tp, { lab: labs[0] }], [tp, p, { lab: labs[1] }], ['O', p, { lab: labs[2] }]], circ: [{ c: 'O', r: 3 }], angles: [['O', tp, p, '', { right: true }]], label: 'tangent, radius and the line to the center' });
      if (ask === 0) return E.num(`${p}${tp} is tangent at ${tp}. Find O${p}.${exact ? ' Give an exact answer.' : ''}`, [exact ? { label: `O${p} =`, exact: hs, form: 'simplest' } : { label: `O${p} =`, ans: h }], `O${tp} ⊥ ${p}${tp}, and O${p} is the hypotenuse: O${p} = √(${r}² + ${t}²) = ${P(hs)}.`, { visual: vis });
      if (ask === 1) return E.num(`${p}${tp} is tangent at ${tp}. Find ${p}${tp}.`, [{ label: `${p}${tp} =`, ans: t }], `The right angle is at ${tp}, so O${p} is the hypotenuse: ${p}${tp} = √(${h}² − ${r}²) = ${t}.`, { visual: vis });
      return E.num(`${p}${tp} is tangent at ${tp}. Find the radius.`, [{ label: 'radius =', ans: r }], `The right angle is at ${tp}, so O${p} is the hypotenuse: r = √(${h}² − ${t}²) = ${r}.`, { visual: vis }); } },
    c: { t: 'test for tangency', g: R => {
      const yes = R.bool(), [a0, b0, c0] = R.pick(PTRIPLES), sw = R.bool(), a = sw ? a0 : b0, b = sw ? b0 : a0, c = yes ? c0 : c0 + R.pick([-1, 1, 2]);
      const L = lets(R, 2), [t, p] = L, cosT = (a * a + b * b - c * c) / (2 * a * b), th = Math.acos(cosT), sc = 3 / a;
      let pts = { O: [0, 0] }; pts[t] = [3, 0]; pts[p] = add([3, 0], mul([Math.cos(Math.PI - th), Math.sin(Math.PI - th)], b * sc)); pts = K.xform(pts, K.rad(R.int(0, 71) * 5), R.bool());
      const vis = cfig({ pts, segs: [['O', t, { lab: String(a) }], [t, p, { lab: String(b) }], ['O', p, { lab: String(c) }]], circ: [{ c: 'O', r: 3 }], label: 'is the segment tangent?' });
      return E.choiceFixed(`O is the center and O${t} is a radius. Is ${t}${p} tangent to the circle at ${t}?`, ['Yes', 'No'], yes ? 0 : 1,
        `${t}${p} is tangent exactly when ∠O${t}${p} = 90°. Check: ${a}² + ${b}² = ${a * a + b * b}, and ${c}² = ${c * c}. ${yes ? 'They match, so the angle is right and it is tangent.' : 'They differ, so the angle is not 90° and it is not tangent.'}`, { visual: vis }); } },
    d: { t: 'proof', g: R => {
      const L = lets(R, 2), map = { T: L[0], P: L[1] }, rn = K.rnF(map), mode = R.pick(['order', 'order', 'reason', 'reason']);
      const be = R.int(35, 60), { pts } = (() => { const tr = turn(R), q = { O: [0, 0] }; q[L[0]] = tr(0); q[L[1]] = tr(be, 3 / Math.cos(be * Math.PI / 180)); return { pts: q }; })();
      if (mode === 'order' && R.bool()) { const lines = TANIND.map(l => `${rn(l[0])}${l[1] === 'given' || l[1] === 'assumption' || l[1] === 'contradiction' ? '' : ` (${l[1]})`}`);
        return K.orderQ(R, `Indirect proof. Given: line ℓ is tangent to the circle with center O at ${L[0]}. Prove: O${L[0]} ⊥ ℓ. Put the steps in order.`, lines, [[], [0], [1], [2], [3], [4]], 'Assume the opposite, drop the perpendicular, compare it with the radius, and reach a contradiction.'); }
      const vis = cfig({ pts, segs: [['O', L[0]], [L[0], L[1]], ['O', L[1]]], circ: [{ c: 'O', r: 3 }], label: 'tangent and radius' }), lines = TPROOF.map(l => [rn(l[0]), l[1], l[2], l[3], l[4] && rn(l[4])]);
      return proof(R, mode, { head: `Given: ${L[1]}${L[0]} is tangent to circle O at ${L[0]}. Prove: O${L[1]}² = O${L[0]}² + ${L[1]}${L[0]}².`, lines, vis, oexp: 'Tangent ⊥ radius gives the right angle, and the right angle lets you use Pythagoras.' }); } },
  });

  /* ================= V.8.09 Two tangents from a point ================= */
  const twoTan = (R, al) => { const tr = turn(R), L = lets(R, 3), [p, a, b] = L, pts = { O: [0, 0] }; pts[p] = tr(0, 3 / Math.sin(al * Math.PI / 180)); pts[a] = tr(90 - al); pts[b] = tr(-(90 - al)); return { L, pts }; };
  // triangle with incircle from tangent lengths x, y, z at A, B, C
  const inTri = (R, x, y, z, nm) => { const T0 = K.bySides(y + z, z + x, x + y), sc = 1, Q = K.spin(R, { A: T0.A, B: T0.B, C: T0.C }), I = K.incen(Q.A, Q.B, Q.C);
    const tAB = lerp(Q.A, Q.B, x / (x + y)), tBC = lerp(Q.B, Q.C, y / (y + z)), tCA = lerp(Q.C, Q.A, z / (z + x)), r = dist(I, tAB); void sc;
    const pts = {}; pts[nm[0]] = Q.A; pts[nm[1]] = Q.B; pts[nm[2]] = Q.C; pts._ab = tAB; pts._bc = tBC; pts._ca = tCA; pts._I = I; return { pts, I, r, tAB, tBC, tCA }; };
  const PTAN = [['PA and PB are tangent to circle O at A and B', 'given', []],
    ['OA ⊥ PA and OB ⊥ PB', 'a tangent is perpendicular to the radius', [0], ['radii of the same circle', 'vertical angles', 'CPCTC'], 'each radius to a point of tangency is perpendicular to the tangent'],
    ['△OAP and △OBP are right triangles', 'definition of right triangle', [1], ['HL', 'reflexive property', 'given'], 'each has a right angle'],
    ['OA = OB', 'radii of the same circle', [], ['reflexive property', 'given', 'CPCTC'], 'OA and OB are both radii'],
    ['OP = OP', 'reflexive property', [], ['radii of the same circle', 'given', 'CPCTC'], 'every segment is equal to itself'],
    ['△OAP ≅ △OBP', 'HL', [2, 3, 4], ['SSA', 'SAS', 'AAA'], 'they are right triangles with the same hypotenuse OP and equal legs OA and OB'],
    ['PA = PB', 'CPCTC', [5], ['HL', 'radii of the same circle', 'reflexive property'], 'corresponding parts of congruent triangles are equal']];
  S('V.8.09', 'Two tangents from a point', {
    a: { t: 'equal tangent segments', g: R => {
      const al = R.int(20, 38), { L, pts } = twoTan(R, al), [p, a, b] = L, k = R.int(0, 2);
      if (k === 2) { const th = 2 * al, vis = cfig({ pts, segs: [[p, a, { ticks: 1 }], [p, b, { ticks: 1 }], [a, b]], circ: [{ c: 'O', r: 3 }], angles: [[a, p, b, deg(th)], [p, a, b, 'x°']], hide: ['O'], label: 'two tangents from a point' });
        return E.num(`${p}${a} and ${p}${b} are tangent to the circle. Find x.`, [{ label: 'x =', ans: (180 - th) / 2 }], `Tangent segments from ${p} are equal, so triangle ${p}${a}${b} is isosceles: x = (180 − ${th}) ÷ 2 = ${(180 - th) / 2}.`, { visual: vis }); }
      const n = R.int(4, 30), vis = cfig({ pts, segs: [[p, a, { lab: String(n) }], [p, b, { lab: '?' }], ['O', a, { dash: true }], ['O', b, { dash: true }]], circ: [{ c: 'O', r: 3 }], label: 'two tangents from a point' });
      return E.num(`${p}${a} and ${p}${b} are tangent to the circle at ${a} and ${b}. Find ${p}${b}.`, [{ label: `${p}${b} =`, ans: n }], `Two tangent segments from the same outside point are equal: ${p}${b} = ${p}${a} = ${n}.`, { visual: vis }); } },
    b: { t: 'circumscribed polygons', g: R => {
      const k = R.int(0, 2), nm = lets(R, 4);
      if (k === 2) { let sv; do { sv = [R.int(5, 20), R.int(5, 20), R.int(5, 20)]; sv.push(sv[0] + sv[2] - sv[1]); } while (sv[3] < 4 || new Set(sv).size < 3);
        const miss = R.int(0, 3), nmS = [0, 1, 2, 3].map(i => nm[i] + nm[(i + 1) % 4]), known = [0, 1, 2, 3].filter(i => i !== miss);
        return E.num(`A circle is inscribed in quadrilateral ${nm.join('')}, touching all four sides. ${known.map(i => `${nmS[i]} = ${sv[i]}`).join(', ')}. Find ${nmS[miss]}.`, [{ label: `${nmS[miss]} =`, ans: sv[miss] }],
          `Each corner's two tangent pieces are equal, so opposite sides have equal sums: ${nmS[0]} + ${nmS[2]} = ${nmS[1]} + ${nmS[3]}. So ${nmS[miss]} = ${sv[(miss + 1) % 4]} + ${sv[(miss + 3) % 4]} − ${sv[(miss + 2) % 4]} = ${sv[miss]}.`); }
      const x = R.int(2, 9), y = R.int(2, 9), z = R.int(2, 9), { pts } = inTri(R, x, y, z, nm), I = pts._I, rr = dist(I, pts._ab);
      if (k === 0) { const vis = cfig({ pts, segs: [[nm[0], '_ab', { lab: String(x) }], ['_ab', nm[1]], [nm[1], '_bc', { lab: String(y) }], ['_bc', nm[2]], [nm[2], '_ca', { lab: String(z) }], ['_ca', nm[0]]], circ: [{ c: I, r: rr }], dots: [pts._ab, pts._bc, pts._ca], label: 'triangle with an inscribed circle' });
        return E.num(`The circle is inscribed in △${nm.slice(0, 3).join('')}. Find the perimeter of the triangle.`, [{ label: 'perimeter =', ans: 2 * (x + y + z) }], `From each corner the two tangent pieces are equal, so every labeled piece appears twice: 2(${x} + ${y} + ${z}) = ${2 * (x + y + z)}.`, { visual: vis }); }
      const [A, B, Cn] = nm, vis = cfig({ pts, segs: [[A, B, { lab: String(x + y) }], [B, Cn, { lab: String(y + z) }], [Cn, A, { lab: String(z + x) }]], circ: [{ c: I, r: rr }], dots: [pts._ab, pts._bc, pts._ca], label: 'triangle with an inscribed circle' });
      const which = R.int(0, 2), v = [A, B, Cn][which], val = [x, y, z][which], adj = [[A + B, x + y, Cn + A, z + x, B + Cn, y + z], [A + B, x + y, B + Cn, y + z, Cn + A, z + x], [B + Cn, y + z, Cn + A, z + x, A + B, x + y]][which];
      return E.num(`The circle is inscribed in △${A}${B}${Cn}. Find the length of the tangent segment from ${v} to the circle.`, [{ label: 'length =', ans: val }],
        `Call the tangent pieces from ${A}, ${B}, ${Cn} a, b, c. Then a + b = ${x + y}, b + c = ${y + z}, c + a = ${z + x}. The piece from ${v} is (${adj[1]} + ${adj[3]} − ${adj[5]}) ÷ 2 = ${val}.`, { visual: vis }); } },
    c: { t: 'solve for x', g: R => {
      let x, e1, e2; do { x = R.int(2, 15); const p = R.int(1, 6), q = R.int(1, 6), n = R.int(8, 40); e1 = [p, n - p * x]; e2 = [q, n - q * x]; } while (e1[0] === e2[0] || Math.abs(e1[1]) > 30 || Math.abs(e2[1]) > 30);
      const al = R.int(20, 38), { L, pts } = twoTan(R, al), [p, a, b] = L, askL = R.bool(0.35), n = e1[0] * x + e1[1];
      const vis = cfig({ pts, segs: [[p, a, { lab: lin(...e1) }], [p, b, { lab: lin(...e2) }]], circ: [{ c: 'O', r: 3 }], hide: ['O'], label: 'two tangents from a point' });
      return E.num(askL ? `${p}${a} and ${p}${b} are tangent to the circle. Find ${p}${a}.` : `${p}${a} and ${p}${b} are tangent to the circle. Find x.`, [askL ? { label: `${p}${a} =`, ans: n } : { label: 'x =', ans: x }],
        `Tangent segments from one point are equal: ${M(`${linM(...e1)}=${linM(...e2)}`)}, so x = ${x}.${askL ? ` ${p}${a} = ${n}.` : ''}`, { visual: vis }); } },
    d: { t: 'proof', g: R => {
      const L = lets(R, 3), map = { P: L[0], A: L[1], B: L[2] }, rn = K.rnF(map), al = R.int(22, 36), tr = turn(R), pts = { O: [0, 0] };
      pts[L[0]] = tr(0, 3 / Math.sin(al * Math.PI / 180)); pts[L[1]] = tr(90 - al); pts[L[2]] = tr(al - 90);
      const vis = cfig({ pts, segs: [[L[0], L[1]], [L[0], L[2]], ['O', L[1]], ['O', L[2]], ['O', L[0]]], circ: [{ c: 'O', r: 3 }], label: 'two tangents with radii drawn' });
      const lines = PTAN.map(l => [rn(l[0]), l[1], l[2], l[3], l[4] && rn(l[4])]), head = `Given: ${rn('PA')} and ${rn('PB')} are tangent to circle O at ${L[1]} and ${L[2]}. Prove: ${rn('PA = PB')}.`;
      const mode = R.pick(['order', 'order', 'reason', 'reason', 'broken']);
      if (mode === 'broken') return proof(R, 'broken', { head, lines, vis, breaks: [{ i: 5, rs: 'SSA', why: 'SSA is not a congruence test; with right triangles, a hypotenuse and a leg give HL' }, { i: 6, rs: 'HL', why: 'HL proves the triangles congruent; equal parts then follow by CPCTC' }, { i: 3, rs: 'reflexive property', why: rn('OA and OB are different segments; they are equal because both are radii') }] });
      return proof(R, mode, { head, lines, vis, oexp: 'Get the right angles, the equal radii and the shared hypotenuse (those can come in any order), then HL, then CPCTC.' }); } },
    e: { t: 'the inscribed circle of a right triangle', g: R => {
      const [a0, b0, c] = R.pick(PTRIPLES), sw = R.bool(), a = sw ? a0 : b0, b = sw ? b0 : a0, r = (a + b - c) / 2, nm = lets(R, 3);
      const x = b - r, y = r, z = a - r;   // tangent lengths at A (acute), B (right angle), C (acute) with AB = b... build: right angle at B
      const { pts } = inTri(R, x, y, z, nm), I = pts._I, rr = dist(I, pts._ab), askT = R.bool(0.4);
      const vis = cfig({ pts, segs: [[nm[0], nm[1], { lab: String(x + y) }], [nm[1], nm[2], { lab: String(y + z) }], [nm[2], nm[0], { lab: String(c) }]], circ: [{ c: I, r: rr }], angles: [[nm[0], nm[1], nm[2], '', { right: true }]], label: 'right triangle with an inscribed circle' });
      if (askT) return E.num(`The circle is inscribed in right △${nm.join('')}. Find the length of the tangent segment from ${nm[0]}.`, [{ label: 'length =', ans: x }],
        `The radius r = (${x + y} + ${y + z} − ${c}) ÷ 2 = ${r}: from the right-angle corner both tangent pieces equal r (they form a square with two radii). So the piece from ${nm[0]} is ${x + y} − ${r} = ${x}.`, { visual: vis });
      return E.num(`The circle is inscribed in right △${nm.join('')}. Find its radius.`, [{ label: 'r =', ans: r }],
        `Two radii and the two tangent pieces at the right angle form a square, so those pieces are r. The other pieces are ${x + y} − r and ${y + z} − r, and they add to the hypotenuse: ${x + y + y + z} − 2r = ${c}, so r = ${r}.`, { visual: vis }); } },
    f: { t: 'the triangle cut off by a tangent', g: R => {
      const k = R.int(0, 2);
      if (k === 0) { const t = R.int(5, 25), back = R.bool(), al = R.int(22, 32), { L, pts } = twoTan(R, al), [p, a, b] = L, L2 = lets(R, 6).filter(q => !L.includes(q)), [X, Y] = L2;
        const Tm = polar(3, Math.atan2(pts[p][1], pts[p][0]) * 180 / Math.PI + R.int(-12, 12)), u = unit(Tm), tg = [-u[1], u[0]];
        const X0 = inter(Tm, add(Tm, tg), pts[p], pts[a]), Y0 = inter(Tm, add(Tm, tg), pts[p], pts[b]); pts[X] = X0; pts[Y] = Y0; pts._T = Tm;
        const vis = cfig({ pts, segs: [[p, a, back ? {} : { lab: String(t) }], [p, b], [X, Y]], circ: [{ c: 'O', r: 3 }], dots: [Tm], hide: ['O'], label: 'two tangents and a third tangent cutting them' });
        if (back) return E.num(`${p}${a} and ${p}${b} are tangent to the circle, and ${X}${Y} touches it between ${a} and ${b}. The perimeter of △${p}${X}${Y} is ${2 * t}. Find ${p}${a}.`, [{ label: `${p}${a} =`, ans: t }],
          `${X}${Y} splits into the tangent pieces ${X}${a} and ${Y}${b}. So the perimeter is ${p}${X} + ${X}${a} + ${Y}${b} + ${p}${Y} = ${p}${a} + ${p}${b} = 2 × ${p}${a}. So ${p}${a} = ${t}.`, { visual: vis });
        return E.num(`${p}${a} and ${p}${b} are tangent to the circle, and ${X}${Y} touches it between ${a} and ${b}. Find the perimeter of △${p}${X}${Y}.`, [{ label: 'perimeter =', ans: 2 * t }],
          `From ${X}, the tangent pieces to ${a} and to the touching point are equal; the same from ${Y}. So ${X}${Y} = ${X}${a} + ${Y}${b}, and the perimeter is ${p}${a} + ${p}${b} = ${t} + ${t} = ${2 * t}, wherever ${X}${Y} touches.`, { visual: vis }); }
      if (k === 1) { const nm = lets(R, 4), ab = R.int(5, 20), cd = R.int(5, 20), bc = R.int(4, ab + cd - 4);
        return E.num(`A circle is inscribed in quadrilateral ${nm.join('')}. ${nm[0]}${nm[1]} = ${ab}, ${nm[1]}${nm[2]} = ${bc} and ${nm[2]}${nm[3]} = ${cd}. Find the perimeter.`, [{ label: 'perimeter =', ans: 2 * (ab + cd) }],
          `Tangent pieces from each corner are equal, so ${nm[0]}${nm[1]} + ${nm[2]}${nm[3]} = ${nm[1]}${nm[2]} + ${nm[3]}${nm[0]}. The perimeter is twice ${nm[0]}${nm[1]} + ${nm[2]}${nm[3]}: 2 × ${ab + cd} = ${2 * (ab + cd)}. (${nm[1]}${nm[2]} is not even needed.)`); }
      const [a0, b0, c] = R.pick(PTRIPLES), r = (a0 + b0 - c) / 2;
      return E.num(`A circle of radius ${r} is inscribed in a right triangle whose hypotenuse is ${c}. Find the perimeter of the triangle.`, [{ label: 'perimeter =', ans: 2 * c + 2 * r }],
        `At the right angle both tangent pieces equal r = ${r}. The other four pieces pair up to make the hypotenuse twice. Perimeter = 2r + 2 × ${c} = ${2 * r + 2 * c}.`); } },
  });

  /* ================= V.8.10 Chord properties ================= */
  const RDM = [[5, 3, 4], [5, 4, 3], [10, 6, 8], [10, 8, 6], [13, 5, 12], [13, 12, 5], [17, 8, 15], [17, 15, 8], [25, 7, 24], [25, 24, 7], [25, 15, 20], [25, 20, 15], [15, 9, 12], [15, 12, 9], [26, 10, 24], [26, 24, 10], [20, 12, 16], [20, 16, 12]].filter(([r, d]) => d / r <= 0.8);
  const chordPts = (R, r, d, tr, L, k = 3 / r, t0 = 0) => { const Mx = tr(t0, d * k), u = unit(Mx.map(v => v || 1e-9)), pr = [-u[1], u[0]], h = Math.sqrt(r * r - d * d) * k, o = {}; o[L[0]] = add(Mx, mul(pr, h)); o[L[1]] = sub(Mx, mul(pr, h)); o[L[2]] = Mx; return o; };
  const CHBIS = [['OM ⊥ AB', 'given', []],
    ['∠OMA = ∠OMB = 90°', 'definition of perpendicular', [0], ['radii of the same circle', 'vertical angles', 'reflexive property'], 'perpendicular lines meet at right angles'],
    ['OA = OB', 'radii of the same circle', [], ['reflexive property', 'definition of perpendicular', 'CPCTC'], 'OA and OB both join the center to the circle'],
    ['OM = OM', 'reflexive property', [], ['radii of the same circle', 'definition of perpendicular', 'CPCTC'], 'every segment is equal to itself'],
    ['△OMA ≅ △OMB', 'HL', [1, 2, 3], ['SSA', 'SAS', 'AAA'], 'they are right triangles with equal hypotenuses OA and OB and the shared leg OM'],
    ['AM = MB', 'CPCTC', [4], ['HL', 'definition of perpendicular', 'radii of the same circle'], 'corresponding parts of congruent triangles are equal']];
  S('V.8.10', 'Chord properties', {
    a: { t: '⊥ from center bisects a chord', g: R => {
      if (R.bool(0.4)) { const [r, d] = R.pick(RDM), tr = turn(R), L = lets(R, 3), [a, b, mm] = L, pts = Object.assign({ O: [0, 0] }, chordPts(R, r, d, tr, L)), rn = K.rnF({ A: a, B: b, M: mm });
        const vis = cfig({ pts, segs: [[a, b], ['O', mm], ['O', a, { dash: true }], ['O', b, { dash: true }]], circ: [{ c: 'O', r: 3 }], angles: [['O', mm, a, '', { right: true }]], label: 'perpendicular from the center to a chord, with two radii' });
        const lines = CHBIS.map(l => [rn(l[0]), l[1], l[2], l[3], l[4] && rn(l[4])]);
        return proof(R, R.pick(['order', 'order', 'reason', 'broken']), { head: rn('O is the center. Given: OM ⊥ AB. Prove: AM = MB.'), lines, vis, oexp: 'Get the right angles, the equal radii and the shared leg (in any order), then HL, then CPCTC.',
          breaks: [{ i: 4, rs: 'SSA', why: `SSA never proves triangles congruent. These are right triangles with equal hypotenuses O${a} = O${b} and a shared leg O${mm}, so the reason is HL` },
            { i: 2, rs: 'reflexive property', why: rn('OA and OB are different segments; they are equal because both are radii of the circle') },
            { i: 5, rs: 'definition of perpendicular', why: rn('perpendicular lines give right angles, not equal segments; AM = MB comes from the congruent triangles by CPCTC') }] }); }
      const k = R.int(0, 2), [r, d, m] = R.pick(RDM), tr = turn(R), L = lets(R, 3), [a, b, mm] = L, pts = Object.assign({ O: [0, 0] }, chordPts(R, r, d, tr, L));
      const base = { pts, circ: [{ c: 'O', r: 3 }], angles: [['O', mm, a, '', { right: true }]], label: 'perpendicular from the center to a chord' };
      if (k === 2) { let x, e1, e2; do { x = R.int(2, 12); const p = R.int(1, 5), q = R.int(1, 5), n = R.int(5, 30); e1 = [p, n - p * x]; e2 = [q, n - q * x]; } while (e1[0] === e2[0] || Math.abs(e1[1]) > 25 || Math.abs(e2[1]) > 25);
        const vis = cfig(Object.assign(base, { segs: [[a, mm, { lab: lin(...e1) }], [mm, b, { lab: lin(...e2) }], ['O', mm]] }));
        return E.num(`O is the center and O${mm} ⊥ ${a}${b}. Find x.`, [{ label: 'x =', ans: x }], `The perpendicular from the center bisects the chord, so ${a}${mm} = ${mm}${b}: ${M(`${linM(...e1)}=${linM(...e2)}`)}, x = ${x}.`, { visual: vis }); }
      const back = k === 1, vis = cfig(Object.assign(base, { segs: [[a, mm, { lab: back ? String(m) : '?' }], [mm, b], ['O', mm]] }));
      if (back) return E.num(`O is the center and O${mm} ⊥ ${a}${b}. ${a}${mm} = ${m}. Find ${a}${b}.`, [{ label: `${a}${b} =`, ans: 2 * m }], `O${mm} bisects the chord, so ${a}${b} = 2 × ${m} = ${2 * m}.`, { visual: vis });
      return E.num(`O is the center, O${mm} ⊥ ${a}${b} and ${a}${b} = ${2 * m}. Find ${a}${mm}.`, [{ label: `${a}${mm} =`, ans: m }], `A perpendicular from the center bisects the chord: ${a}${mm} = ${2 * m} ÷ 2 = ${m}.`, { visual: vis }); } },
    b: { t: 'equal chords, equal distance', g: R => {
      const k = R.int(0, 2), r = R.pick([5, 10, 15, 20, 25]), opts = RDM.filter(z => z[0] === r), tr = turn(R), L = lets(R, 6), [a, b, m1, c, d, m2] = L;
      if (k === 2) { const [o1, o2] = R.sample(opts, 2).sort((p, q) => p[1] - q[1]), pts = Object.assign({ O: [0, 0] }, chordPts(R, r, o1[1], tr, [a, b, m1], 3 / r, 0), chordPts(R, r, o2[1], tr, [c, d, m2], 3 / r, R.int(150, 210)));
        const vis = cfig({ pts, segs: [[a, b], [c, d], ['O', m1, { dash: true }], ['O', m2, { dash: true }]], circ: [{ c: 'O', r: 3 }], angles: [['O', m1, a, '', { right: true }], ['O', m2, c, '', { right: true }]], label: 'two chords and their distances from the center' });
        return E.choice(R, `In the same circle, ${a}${b} = ${2 * o1[2]} and ${c}${d} = ${2 * o2[2]}. Which chord is closer to the center?`, `${a}${b}`, [`${c}${d}`, 'They are equally far', 'You cannot tell'],
          `The longer chord is closer to the center. Here ${a}${b} is longer, so it is closer (distance ${o1[1]} against ${o2[1]} for radius ${r}).`, { visual: vis }); }
      const [, dd, mm] = R.pick(opts), pts = Object.assign({ O: [0, 0] }, chordPts(R, r, dd, tr, [a, b, m1], 3 / r, 0), chordPts(R, r, dd, tr, [c, d, m2], 3 / r, R.int(130, 230)));
      if (k === 0) { const vis = cfig({ pts, segs: [[a, b, { ticks: 1 }], [c, d, { ticks: 1 }], ['O', m1, { lab: String(dd) }], ['O', m2, { lab: '?' }]], circ: [{ c: 'O', r: 3 }], angles: [['O', m1, a, '', { right: true }], ['O', m2, c, '', { right: true }]], label: 'two congruent chords' });
        return E.num(`Chords ${a}${b} and ${c}${d} are congruent. Find the distance from O to ${c}${d}.`, [{ label: 'distance =', ans: dd }], `Congruent chords are equally far from the center: ${dd}.`, { visual: vis }); }
      const vis = cfig({ pts, segs: [[a, b, { lab: String(2 * mm) }], [c, d, { lab: '?' }], ['O', m1, { ticks: 1 }], ['O', m2, { ticks: 1 }]], circ: [{ c: 'O', r: 3 }], angles: [['O', m1, a, '', { right: true }], ['O', m2, c, '', { right: true }]], label: 'two chords equally far from the center' });
      return E.num(`O${m1} = O${m2}, as marked. Find ${c}${d}.`, [{ label: `${c}${d} =`, ans: 2 * mm }], `Chords that are equally far from the center are congruent: ${c}${d} = ${a}${b} = ${2 * mm}.`, { visual: vis }); } },
    c: { t: 'find chord lengths', g: R => {
      const k = R.int(0, 3), tr = turn(R), L = lets(R, 3), [a, b, mm] = L;
      if (k === 3) { let r, d; do { r = R.int(3, 12); d = R.int(1, r - 1); } while (isSq(r * r - d * d)); const ch = sqS(4 * (r * r - d * d)), pts = Object.assign({ O: [0, 0] }, chordPts(R, r, d, tr, L));
        const vis = cfig({ pts, segs: [[a, b, { lab: '?' }], ['O', mm, { lab: String(d) }], ['O', a, { lab: String(r) }]], circ: [{ c: 'O', r: 3 }], angles: [['O', mm, a, '', { right: true }]], label: 'chord at a distance from the center' });
        return E.num(`The circle has radius ${r} and the chord is ${d} from the center. Find the chord's length. Give an exact answer.`, [{ label: `${a}${b} =`, exact: ch, form: 'simplest' }], `Half the chord is √(${r}² − ${d}²) = ${P(sqS(r * r - d * d))}, so the chord is ${P(ch)}.`, { visual: vis }); }
      const [r, d, m] = R.pick(RDM), pts = Object.assign({ O: [0, 0] }, chordPts(R, r, d, tr, L));
      const lab = [['?', String(d), String(r)], [String(2 * m), String(d), '?'], [String(2 * m), '?', String(r)]][k];
      const vis = cfig({ pts, segs: [[a, b, { lab: lab[0] }], ['O', mm, { lab: lab[1] }], ['O', a, { lab: lab[2] }]], circ: [{ c: 'O', r: 3 }], angles: [['O', mm, a, '', { right: true }]], label: 'chord, distance and radius' });
      if (k === 0) return E.num(`O is the center. Find ${a}${b}.`, [{ label: `${a}${b} =`, ans: 2 * m }], `O${mm} bisects the chord. ${a}${mm} = √(${r}² − ${d}²) = ${m}, so ${a}${b} = ${2 * m}.`, { visual: vis });
      if (k === 1) return E.num(`O is the center. Find the radius.`, [{ label: 'r =', ans: r }], `${a}${mm} = ${2 * m} ÷ 2 = ${m}. Then r = √(${m}² + ${d}²) = ${r}.`, { visual: vis });
      return E.num(`O is the center. Find the distance O${mm}.`, [{ label: `O${mm} =`, ans: d }], `${a}${mm} = ${m} (half the chord), so O${mm} = √(${r}² − ${m}²) = ${d}.`, { visual: vis }); } },
    d: { t: 'find the center', g: R => {
      const k = R.pick([0, 1, 2, 2, 2]);
      if (k === 0) return K.orderQ(R, 'Put the steps for finding the center of a circle in order.', ['Draw two chords that are not parallel.', 'Construct the perpendicular bisector of the first chord.', 'Construct the perpendicular bisector of the second chord.', 'Mark where the two bisectors cross: that is the center.'], [[], [0], [0], [1, 2]],
        'The center lies on the perpendicular bisector of every chord, so two bisectors pin it down. The two bisectors can be drawn in either order.', { fixed: 0 });
      if (k === 1) return E.choice(R, 'Why does the perpendicular bisector of any chord pass through the center?', 'The center is equally far from both ends of the chord', ['The center is the midpoint of every chord', 'Every chord is a diameter', 'Perpendicular lines always meet at the center'],
        'The ends of a chord are both on the circle, so the center is equidistant from them, and the points equidistant from two points form the perpendicular bisector.');
      const [r, d, m] = R.pick(RDM), h = r - d, L = lets(R, 3), [a, b, mm] = L, tr = turn(R), pts = chordPts(R, r, d, tr, L), top = tr(0, 3);
      pts._top = top; pts._O = [0, 0];
      const vis = cfig({ pts, segs: [[a, b, { lab: String(2 * m) }], [mm, '_top', { lab: String(h), dash: true }]], arcs: [{ c: [0, 0], r: 3, a: pts[a], b: pts[b], thru: top, color: C.ink, width: 2.2 }], angles: [['_top', mm, a, '', { right: true }]], hide: ['_O'], label: 'piece of a broken plate' });
      return E.num(`A piece of a round plate has a straight edge ${2 * m} cm long, and the curved edge rises ${h} cm above its midpoint. Find the plate's radius.`, [{ label: 'r =', ans: r }],
        `The center lies on the perpendicular bisector, r − ${h} below the top. Pythagoras: r² = ${m}² + (r − ${h})², so ${2 * h}r = ${m * m + h * h} and r = ${r} cm.`, { visual: vis }); } },
  });

  /* ================= V.8.11 Angles from chords ================= */
  const crossArcs = R => { let A; do { A = [R.int(20, 70), R.int(20, 70), R.int(20, 70)].map(x => 2 * x); A.push(360 - A[0] - A[1] - A[2]); } while (A[3] < 40 || A[3] > 150 || (A[0] + A[2]) / 2 < 35 || (A[0] + A[2]) / 2 > 145); return A; };
  const crossFig = (R, arcs, o) => { const tr = turn(R), L = lets(R, 5), [a, b, c, d, e] = L, pts = { O: [0, 0] }; let t = 0; [a, b, c, d].forEach((l, i) => { pts[l] = tr(t); t += arcs[i]; }); pts[e] = inter(pts[a], pts[c], pts[b], pts[d]);
    return { L, vis: cfig({ pts, segs: [[a, c], [b, d], ...(o.segs || []).map(([p, q]) => [L[p], L[q]])], circ: [{ c: 'O', r: 3 }], hide: ['O'], arcs: (o.arcs || []).map(([i, lab]) => ({ c: 'O', r: 3, a: L[i], b: L[(i + 1) % 4], thru: undefined, big: arcs[i] > 180, lab })), angles: (o.angles || []).map(([p, q, lab]) => [L[p], e, L[q], lab]), label: 'two chords crossing inside a circle' }) }; };
  const CHPROOF = [['Chords AC and BD meet at E inside the circle', 'given', []], ['Draw chord BC', 'two points determine a segment', []],
    ['∠AEB = ∠ACB + ∠DBC', 'exterior angle theorem', [0, 1], ['triangle sum theorem', 'vertical angles', 'inscribed angle theorem'], '∠AEB is an exterior angle of △BEC, so it equals the two remote interior angles'],
    ['∠ACB = ½ arc AB', 'inscribed angle theorem', [1], ['a central angle equals its arc', 'exterior angle theorem', 'vertical angles'], '∠ACB is inscribed and intercepts arc AB'],
    ['∠DBC = ½ arc DC', 'inscribed angle theorem', [1], ['a central angle equals its arc', 'exterior angle theorem', 'vertical angles'], '∠DBC is inscribed and intercepts arc DC'],
    ['∠AEB = ½(arc AB + arc DC)', 'substitution', [2, 3, 4]]];
  S('V.8.11', 'Angles from chords', {
    a: { t: 'chords crossing inside', g: R => {
      const arcs = crossArcs(R), ans = (arcs[0] + arcs[2]) / 2, { L, vis } = crossFig(R, arcs, { arcs: [[0, deg(arcs[0])], [2, deg(arcs[2])]], angles: [[0, 1, 'x°']] });
      return E.num('Two chords cross inside the circle. Find x.', [{ label: 'x =', ans }], `The angle is half the sum of the arcs it and its vertical angle intercept: ½(${arcs[0]} + ${arcs[2]}) = ${ans}. Add, then halve.`, { visual: vis }); } },
    b: { t: 'half the sum of arcs', g: R => {
      const arcs = crossArcs(R), k = R.int(0, 1), a1 = (arcs[0] + arcs[2]) / 2;
      if (k === 0) { const { vis } = crossFig(R, arcs, { arcs: [[0, deg(arcs[0])], [2, deg(arcs[2])]], angles: [[1, 2, 'x°']] });
        return E.num('Two chords cross inside the circle. Find x.', [{ label: 'x =', ans: 180 - a1 }], `The angle between the two blue arcs is ½(${arcs[0]} + ${arcs[2]}) = ${a1}°. x is its neighbor on a straight line: 180 − ${a1} = ${180 - a1}.`, { visual: vis }); }
      const { vis } = crossFig(R, arcs, { arcs: [[0, deg(arcs[0])], [1, deg(arcs[1])], [3, deg(arcs[3])]], angles: [[0, 1, 'x°']] });
      return E.num('Two chords cross inside the circle. Find x.', [{ label: 'x =', ans: a1 }], `The fourth arc is 360 − ${arcs[0]} − ${arcs[1]} − ${arcs[3]} = ${arcs[2]}°. Then x = ½(${arcs[0]} + ${arcs[2]}) = ${a1}.`, { visual: vis }); } },
    c: { t: 'solve for an arc', g: R => {
      const arcs = crossArcs(R), a1 = (arcs[0] + arcs[2]) / 2, k = R.int(0, 2);
      if (k === 2) { let x, e1, e2, cnt = 0; do { x = R.int(4, 25); const p = R.int(1, 5), q = R.int(1, 5); e1 = [p, arcs[0] - p * x]; e2 = [q, arcs[2] - q * x]; cnt++; } while ((Math.abs(e1[1]) > 50 || Math.abs(e2[1]) > 50) && cnt < 300);
        if (Math.abs(e1[1]) > 50 || Math.abs(e2[1]) > 50) { e1 = [0, arcs[0]]; }
        const lab1 = e1[0] ? exD(...e1) : deg(arcs[0]), { vis } = crossFig(R, arcs, { arcs: [[0, lab1], [2, exD(...e2)]], angles: [[0, 1, deg(a1)]] });
        const sk = e1[0] + e2[0], sm = e1[1] + e2[1];
        return E.num('Two chords cross inside the circle. Find x.', [{ label: 'x =', ans: x }], `${a1} = ½(sum of the arcs), so the arcs add to ${2 * a1}: ${M(`${linM(sk, sm)}=${2 * a1}`)}, x = ${x}.`, { visual: vis }); }
      const i = k === 0 ? 2 : 0, j = 2 - i, { L, vis } = crossFig(R, arcs, { arcs: [[j, deg(arcs[j])], [i, 'x°']], angles: [[0, 1, deg(a1)]] });
      return E.num('Two chords cross inside the circle. Find x.', [{ label: 'x =', ans: arcs[i] }], `${a1} = ½(${arcs[j]} + x), so ${arcs[j]} + x = ${2 * a1} and x = ${arcs[i]}.`, { visual: vis }); } },
    d: { t: 'proof', g: R => {
      const arcs = crossArcs(R), L = lets(R, 5), map = { A: L[0], B: L[1], C: L[2], D: L[3], E: L[4] }, rn = K.rnF(map), tr = turn(R), pts = { O: [0, 0] }; let t = 0;
      L.slice(0, 4).forEach((l, i) => { pts[l] = tr(t); t += arcs[i]; }); pts[L[4]] = inter(pts[L[0]], pts[L[2]], pts[L[1]], pts[L[3]]);
      const vis = cfig({ pts, segs: [[L[0], L[2]], [L[1], L[3]], [L[1], L[2], { dash: true }]], circ: [{ c: 'O', r: 3 }], hide: ['O'], label: 'two crossing chords with a segment drawn' });
      const lines = CHPROOF.map(l => [rn(l[0]), l[1], l[2], l[3], l[4] && rn(l[4])]), mode = R.pick(['order', 'order', 'reason', 'reason']);
      return proof(R, mode, { head: `Given: chords ${rn('AC')} and ${rn('BD')} meet at ${L[4]}. Prove: ∠${rn('AEB')} = ½(arc ${rn('AB')} + arc ${rn('DC')}).`, lines, vis, fixed: 1,
        oexp: `Draw ${rn('BC')}. The exterior angle ∠${rn('AEB')} of △${rn('BEC')} is the sum of two inscribed angles, and each inscribed angle is half its arc. The two inscribed-angle lines can come in either order.` }); } },
  });

  /* ================= V.8.12 Angles from secants & tangents ================= */
  // two secants from P: arcs AC = n (near), CD = u, DB = f (far), BA = v
  const secSec = (R, minN = 20) => { for (let t = 0; t < 400; t++) { const n = 2 * R.int(minN / 2, 40), f = n + 2 * R.int(10, 50), u = R.int(40, 120), v = 360 - n - f - u;
      if (v < 40 || v > 140 || f > 220) continue; const tr = turn(R), A = tr(0), Cc = tr(n), D = tr(n + u), B = tr(n + u + f), Pp = inter(A, B, Cc, D);
      if (!Pp || dist(Pp, [0, 0]) > 8.5 || dist(Pp, [0, 0]) < 4.5) continue; return { n, f, u, v, A, B, C: Cc, D, P: Pp }; } return null; };
  const secFig = (R, S2, labs) => { const L = lets(R, 5), [p, a, b, c, d] = L, pts = { O: [0, 0] }; pts[p] = S2.P; pts[a] = S2.A; pts[b] = S2.B; pts[c] = S2.C; pts[d] = S2.D;
    return { L, vis: cfig({ pts, segs: [[p, b], [p, d]], circ: [{ c: 'O', r: 3 }], hide: ['O'], arcs: [{ c: 'O', r: 3, a, b: c, lab: labs.n }, { c: 'O', r: 3, a: d, b, lab: labs.f }, ...(labs.u ? [{ c: 'O', r: 3, a: c, b: d, lab: labs.u, color: C.teal, lcol: '#2E7D72' }] : []), ...(labs.v ? [{ c: 'O', r: 3, a: b, b: a, lab: labs.v, color: C.teal, lcol: '#2E7D72' }] : [])],
      angles: [[a, p, c, labs.p]], label: 'two secants from an outside point' }) }; };
  // tangent at T and secant P-A-B: arcs TA = n, AB = u, BT = f
  const tanSec = R => { for (let t = 0; t < 400; t++) { const n = 2 * R.int(15, 50), f = n + 2 * R.int(10, 50), u = 360 - n - f; if (u < 40 || f > 230) continue;
      const tr = turn(R), T = tr(0), A = tr(n), B = tr(n + u), w = [-T[1], T[0]], Pp = inter(T, add(T, w), A, B); if (!Pp || dist(Pp, [0, 0]) > 8.5 || dist(Pp, [0, 0]) < 4.2) continue; return { n, f, u, T, A, B, P: Pp }; } return null; };
  const twoTanP = (R, m) => { const tr = turn(R), T1 = tr(0), T2 = tr(m), Pp = inter(T1, add(T1, [-T1[1], T1[0]]), T2, add(T2, [-T2[1], T2[0]])); return { T1, T2, P: Pp, mid: tr(m / 2), far: tr(m + (360 - m) / 2) }; };
  const tcFig = (R, m, labs) => { const tr = turn(R), L = lets(R, 3), [t, a, q] = L, pts = { O: [0, 0] }; pts[t] = tr(0); pts[a] = tr(m); const w = [-pts[t][1], pts[t][0]], s = (pts[a][0] - pts[t][0]) * w[0] + (pts[a][1] - pts[t][1]) * w[1] > 0 ? 1 : -1;
    pts[q] = add(pts[t], mul(w, s * 1.5)); pts._q2 = sub(pts[t], mul(w, s * 1.2));
    return { L, vis: cfig({ pts, segs: [['_q2', q], [t, a]], circ: [{ c: 'O', r: 3 }], hide: ['O'], arcs: [{ c: 'O', r: 3, a: t, b: a, lab: labs.arc }], angles: [labs.other ? [a, t, '_q2', labs.ang] : [a, t, q, labs.ang]], label: 'tangent and chord' }) }; };
  S('V.8.12', 'Angles from secants & tangents', {
    a: { t: 'outside the circle', g: R => {
      const S2 = secSec(R), back = R.bool(0.3), ang = (S2.f - S2.n) / 2;
      if (back) { const { L, vis } = secFig(R, S2, { n: deg(S2.n), f: 'x°', p: deg(ang) });
        return E.num(`Two secants meet at ${L[0]} outside the circle. Find x, the far arc.`, [{ label: 'x =', ans: S2.f }], `${ang} = ½(x − ${S2.n}), so x − ${S2.n} = ${2 * ang} and x = ${S2.f}.`, { visual: vis }); }
      const { L, vis } = secFig(R, S2, { n: deg(S2.n), f: deg(S2.f), p: 'x°' });
      return E.num(`Two secants meet at ${L[0]} outside the circle. Find x.`, [{ label: 'x =', ans: ang }], `Vertex outside: half the difference of the arcs, far minus near. x = ½(${S2.f} − ${S2.n}) = ${ang}.`, { visual: vis }); } },
    b: { t: 'half the difference of arcs', g: R => {
      if (R.bool()) { const S2 = tanSec(R), ang = (S2.f - S2.n) / 2, L = lets(R, 4), [p, t, a, b] = L, pts = { O: [0, 0] }; pts[p] = S2.P; pts[t] = S2.T; pts[a] = S2.A; pts[b] = S2.B; const back = R.bool(0.3);
        const vis = cfig({ pts, segs: [[p, t], [p, b]], circ: [{ c: 'O', r: 3 }], hide: ['O'], arcs: [{ c: 'O', r: 3, a: t, b: a, lab: deg(S2.n) }, { c: 'O', r: 3, a: b, b: t, lab: back ? 'x°' : deg(S2.f) }], angles: [[t, p, a, back ? deg(ang) : 'x°']], label: 'tangent and secant from an outside point' });
        return back ? E.num(`${p}${t} is tangent and ${p}${b} is a secant. Find x.`, [{ label: 'x =', ans: S2.f }], `${ang} = ½(x − ${S2.n}), so x = ${2 * ang} + ${S2.n} = ${S2.f}.`, { visual: vis })
          : E.num(`${p}${t} is tangent and ${p}${b} is a secant. Find x.`, [{ label: 'x =', ans: ang }], `x = ½(far arc − near arc) = ½(${S2.f} − ${S2.n}) = ${ang}.`, { visual: vis }); }
      const m = R.int(50, 130), G2 = twoTanP(R, m), L = lets(R, 3), [p, t1, t2] = L, pts = { O: [0, 0] }; pts[p] = G2.P; pts[t1] = G2.T1; pts[t2] = G2.T2; pts._f = G2.far;
      const vis = cfig({ pts, segs: [[p, t1], [p, t2]], circ: [{ c: 'O', r: 3 }], hide: ['O'], arcs: [{ c: 'O', r: 3, a: t1, b: t2, lab: deg(m) }], angles: [[t1, p, t2, 'x°']], label: 'two tangents from an outside point' });
      return E.num(`${p}${t1} and ${p}${t2} are tangent to the circle. Find x.`, [{ label: 'x =', ans: 180 - m }], `The far arc is 360 − ${m} = ${360 - m}°. x = ½(${360 - m} − ${m}) = ${180 - m}.`, { visual: vis }); } },
    c: { t: 'tangent–chord angle', g: R => {
      const m = 2 * R.int(25, 80), k = R.int(0, 2);
      if (k === 0) { const { L, vis } = tcFig(R, m, { arc: deg(m), ang: 'x°' }); return E.num(`Line ${L[2]}${L[0]} is tangent at ${L[0]}. Find x.`, [{ label: 'x =', ans: m / 2 }], `A tangent–chord angle is half the arc inside it: ½ × ${m} = ${m / 2}.`, { visual: vis }); }
      if (k === 1) { const { L, vis } = tcFig(R, m, { arc: 'x°', ang: deg(m / 2) }); return E.num(`Line ${L[2]}${L[0]} is tangent at ${L[0]}. Find x.`, [{ label: 'x =', ans: m }], `The arc is twice the tangent–chord angle: 2 × ${m / 2} = ${m}.`, { visual: vis }); }
      const { L, vis } = tcFig(R, m, { arc: deg(m), ang: 'x°', other: true });
      return E.num(`The line is tangent at ${L[0]}. Find x.`, [{ label: 'x =', ans: 180 - m / 2 }], `This angle opens onto the other arc, 360 − ${m} = ${360 - m}°, so x = ½ × ${360 - m} = ${180 - m / 2}. (Or: 180 − ½ × ${m}.)`, { visual: vis }); } },
    d: { t: 'solve for x', g: R => {
      const coef = (th, x) => { let k, m, t = 0; do { k = R.int(1, 5); m = th - k * x; t++; } while (Math.abs(m) > 50 && t < 50); return [k, m]; };
      if (R.bool()) { let S2, x, e1, e2, cnt = 0; do { S2 = secSec(R, 50); x = R.int(4, 20); e1 = coef(S2.f, x); e2 = coef(S2.n, x); cnt++; } while ((Math.abs(e1[1]) > 50 || Math.abs(e2[1]) > 50 || e1[0] === e2[0]) && cnt < 300);
        const ang = (S2.f - S2.n) / 2, { L, vis } = secFig(R, S2, { n: '', f: exD(...e1), p: deg(ang) });
        return E.num(`Two secants meet at ${L[0]}. The near arc ${L[1]}${L[3]} measures ${exD(...e2)}. Find x.`, [{ label: 'x =', ans: x }], `${ang} = ½[(${lin(...e1)}) − (${lin(...e2)})], so ${M(`${linM(e1[0] - e2[0], e1[1] - e2[1]).replace(/^-1x/, '-x')}=${2 * ang}`)} and x = ${x}.`, { visual: vis }); }
      let m, x, e1, e2, cnt = 0; do { m = 2 * R.int(55, 85); x = R.int(4, 20); e1 = coef(m / 2, x); e2 = coef(m, x); cnt++; } while ((Math.abs(e1[1]) > 50 || Math.abs(e2[1]) > 50 || e2[0] === 2 * e1[0]) && cnt < 300);
      const { L, vis } = tcFig(R, m, { arc: exD(...e2), ang: '' });
      return E.num(`Line ${L[2]}${L[0]} is tangent at ${L[0]}, and ∠${L[1]}${L[0]}${L[2]} = ${exD(...e1)}. Find x.`, [{ label: 'x =', ans: x }], `The arc is twice the tangent–chord angle: ${M(`${linM(...e2)}=2(${linM(...e1)})`)}, so x = ${x}.`, { visual: vis }); } },
    e: { t: 'use the whole circle', g: R => {
      if (R.bool()) { const m = R.int(50, 130), th = 180 - m, G2 = twoTanP(R, m), L = lets(R, 3), [p, t1, t2] = L, pts = { O: [0, 0] }; pts[p] = G2.P; pts[t1] = G2.T1; pts[t2] = G2.T2; const askMaj = R.bool();
        const vis = cfig({ pts, segs: [[p, t1], [p, t2]], circ: [{ c: 'O', r: 3 }], hide: ['O'], arcs: askMaj ? [{ c: 'O', r: 3, a: t1, b: t2, big: true, lab: 'x°' }] : [{ c: 'O', r: 3, a: t1, b: t2, lab: 'x°' }], angles: [[t1, p, t2, deg(th)]], label: 'two tangents from an outside point' });
        return E.num(`${p}${t1} and ${p}${t2} are tangent to the circle. Find x.`, [{ label: 'x =', ans: askMaj ? 360 - m : m }],
          `Let the minor arc be y; the major arc is 360 − y. ${th} = ½[(360 − y) − y] = 180 − y, so y = ${m}.${askMaj ? ` The major arc is x = 360 − ${m} = ${360 - m}.` : ` x = ${m}.`}`, { visual: vis }); }
      const S2 = secSec(R), ang = (S2.f - S2.n) / 2, { L, vis } = secFig(R, S2, { n: deg(S2.n), f: '', u: deg(S2.u), v: deg(S2.v), p: 'x°' });
      return E.num(`Two secants meet at ${L[0]}. Find x.`, [{ label: 'x =', ans: ang }], `The far arc is 360 − ${S2.n} − ${S2.u} − ${S2.v} = ${S2.f}°. Then x = ½(${S2.f} − ${S2.n}) = ${ang}.`, { visual: vis }); } },
    f: { t: 'arcs in a ratio', g: R => {
      let q, sum; do { q = [R.int(1, 7), R.int(1, 7), R.int(1, 7), R.int(1, 7)]; sum = q.reduce((s, v) => s + v, 0); } while (360 % sum || (360 / sum) % 2 || q[1] === q[3] || new Set(q).size < 3);
      const u = 360 / sum, arcs = q.map(v => v * u), L = lets(R, 4), [A, B, Cn, D] = L, inside = R.bool(0.4);
      const pre = `Points ${A}, ${B}, ${Cn}, ${D} lie on a circle in that order and split it into arcs ${A}${B} : ${B}${Cn} : ${Cn}${D} : ${D}${A} = ${q.join(' : ')}.`;
      if (inside) { const ans = (arcs[0] + arcs[2]) / 2; return E.num(`${pre} Chords ${A}${Cn} and ${B}${D} meet at E. Find ∠${A}E${B}.`, [{ ans }], `One part is 360 ÷ ${sum} = ${u}°, so arc ${A}${B} = ${arcs[0]}° and arc ${Cn}${D} = ${arcs[2]}°. Crossing chords: ½(${arcs[0]} + ${arcs[2]}) = ${ans}°.`); }
      const bc = arcs[1], da = arcs[3], ans = Math.abs(da - bc) / 2, nearBC = da > bc, nm = nearBC ? `∠${B}P${Cn}` : `∠${A}P${D}`;
      return E.num(`${pre} Lines ${A}${B} and ${D}${Cn} meet at P. Find ${nm}.`, [{ ans }], `One part is ${u}°: arc ${B}${Cn} = ${bc}° and arc ${D}${A} = ${da}°. These are the arcs between the two lines, so the angle at P is ½(${Math.max(bc, da)} − ${Math.min(bc, da)}) = ${ans}°. P lies beyond ${nearBC ? B + ' and ' + Cn : A + ' and ' + D}, next to the smaller arc.`); } },
  });

  /* ================= V.8.13 Intersecting chord lengths ================= */
  const chordQuad = (R, o = {}) => { for (let t = 0; t < 500; t++) { const a = R.int(2, 12), b = R.int(2, 12), N = a * b, prs = []; for (let c = 2; c * c <= N * 4 && c <= 15; c++) if (N % c === 0 && N / c >= 2 && N / c <= 15) prs.push([c, N / c]);
      const ok = prs.filter(([c, d]) => !((c === a && d === b) || (c === b && d === a)) && c !== d); if (!ok.length || a === b && !o.eq) continue; const [c, d] = R.pick(ok); return [a, b, c, d]; } return [3, 8, 4, 6]; };
  const chordFig = (R, [a, b, c, d], labs) => { const L = lets(R, 5), [P0, A, B, Cn, D] = L, ph = R.int(0, 71) * 5, ps = ph + R.int(50, 130) * (R.bool() ? 1 : -1), pts = {};
    pts[P0] = [0, 0]; pts[A] = polar(a, ph); pts[B] = polar(b, ph + 180); pts[Cn] = polar(c, ps); pts[D] = polar(d, ps + 180); const O2 = K.circum(pts[A], pts[B], pts[Cn]), rr = dist(O2, pts[A]);
    return { L, vis: cfig({ pts, segs: [[P0, A, { lab: labs[0] }], [P0, B, { lab: labs[1] }], [P0, Cn, { lab: labs[2] }], [P0, D, { lab: labs[3] }], ...(labs.extra || []).map(([p, q]) => [L[p], L[q], { dash: true }])], circ: [{ c: O2, r: rr }], label: 'two chords crossing inside a circle' }) }; };
  const CLPROOF = [['Chords AB and CD meet at P', 'given', []],
    ['∠CAB = ∠CDB', 'inscribed angles on the same arc', [0], ['vertical angles', 'alternate interior angles', 'AA similarity'], 'both are inscribed angles that intercept arc CB'],
    ['∠APC = ∠DPB', 'vertical angles', [0], ['inscribed angles on the same arc', 'alternate interior angles', 'reflexive property'], 'they are opposite each other where the chords cross'],
    ['△APC ~ △DPB', 'AA similarity', [1, 2], ['SAS similarity', 'SSS similarity', 'ASA congruence'], 'two pairs of angles are equal'],
    ['PA/PD = PC/PB', 'corresponding sides of similar triangles are proportional', [3], ['vertical angles', 'multiplication property of equality', 'given'], 'PA and PD correspond, as do PC and PB'],
    ['PA · PB = PC · PD', 'multiplication property of equality', [4], ['AA similarity', 'vertical angles', 'addition property of equality'], 'multiplying both sides by PD · PB clears the fractions']];
  S('V.8.13', 'Intersecting chord lengths', {
    a: { t: 'product of parts equal', g: R => {
      const q = chordQuad(R), j = R.int(0, 3), labs = q.map((v, i) => i === j ? 'x' : String(v)), { L, vis } = chordFig(R, q, labs), pr = j < 2 ? [j, 1 - j, 2, 3] : [j, 5 - j, 0, 1];
      return E.num(`Two chords cross inside the circle. Find x.`, [{ label: 'x =', ans: q[j] }], `Product of the parts of one chord = product of the parts of the other: x × ${q[pr[1]]} = ${q[pr[2]]} × ${q[pr[3]]} = ${q[pr[2]] * q[pr[3]]}, so x = ${q[j]}.`, { visual: vis }); } },
    b: { t: 'set up', g: R => {
      let q; do q = chordQuad(R); while (q[0] + q[1] - q[2] === q[3] || q[0] * (q[0] + q[1]) / q[2] - q[2] === q[3]);
      const [a, b, c] = q, { L, vis } = chordFig(R, q, [String(a), String(b), String(c), 'x']);
      return E.choice(R, 'Two chords cross inside the circle. Which equation finds x?', M(`${a}*${b}=${c}x`), [M(`${a}*${c}=${b}x`), M(`${a}(${a}+${b})=${c}(${c}+x)`), M(`${a}+${b}=${c}+x`)],
        `Multiply the two parts of each chord: ${a} × ${b} = ${c} × x (so x = ${q[3]}). Part × whole is the rule for secants from outside, not chords crossing inside.`, { visual: vis }); } },
    c: { t: 'solve', g: R => {
      if (R.bool()) { let x, k, cd; do { x = R.int(2, 9); k = R.int(1, 6); const N = x * (x + k), prs = []; for (let c = 2; c <= 15; c++) if (N % c === 0 && N / c >= 2 && N / c <= 15 && c < N / c && c !== x) prs.push([c, N / c]); cd = prs.length ? R.pick(prs) : null; } while (!cd);
        const { vis } = chordFig(R, [x, x + k, cd[0], cd[1]], ['x', `x + ${k}`, String(cd[0]), String(cd[1])]);
        return E.num('Two chords cross inside the circle. Find x.', [{ label: 'x =', ans: x }], `x(x + ${k}) = ${cd[0]} × ${cd[1]} = ${cd[0] * cd[1]}, so ${M(`x^2+${k === 1 ? '' : k}x-${cd[0] * cd[1]}=0`)} and (x − ${x})(x + ${x + k}) = 0. A length is positive: x = ${x}.`, { visual: vis }); }
      let p, q, cd; do { p = R.int(2, 12); q = R.int(2, 12); const N = p * q, prs = []; for (let c = 2; c <= 15; c++) if (N % c === 0 && N / c >= 2 && N / c <= 15 && c < N / c && !(c === Math.min(p, q))) prs.push([c, N / c]); cd = prs.length ? R.pick(prs) : null; } while (!cd || p === q);
      const Lfull = p + q, { L, vis } = chordFig(R, [p, q, cd[0], cd[1]], ['x', '', String(cd[0]), String(cd[1])].map(s => s || undefined));
      return E.num(`Two chords cross at ${L[0]}. Chord ${L[1]}${L[2]} = ${Lfull}. Find all possible values of x = ${L[0]}${L[1]}.`, [{ label: 'x =', set: [String(p), String(q)] }],
        `x(${Lfull} − x) = ${cd[0]} × ${cd[1]} = ${p * q}, so ${M(`x^2-${Lfull}x+${p * q}=0`)}, (x − ${p})(x − ${q}) = 0. Both work: x = ${Math.min(p, q)} or ${Math.max(p, q)} (P can sit on either side of the middle).`, { visual: vis }); } },
    d: { t: 'proof by similar triangles', g: R => {
      const q = chordQuad(R), vis2 = chordFig(R, q, Object.assign([undefined, undefined, undefined, undefined], { extra: [[1, 3], [4, 2]] }));
      const map2 = { P: vis2.L[0], A: vis2.L[1], B: vis2.L[2], C: vis2.L[3], D: vis2.L[4] }, rn2 = K.rnF(map2);
      const lines = CLPROOF.map(l => [rn2(l[0]), l[1], l[2], l[3], l[4] && rn2(l[4])]), mode = R.pick(['order', 'order', 'reason', 'reason', 'broken']);
      const head = `Given: chords ${rn2('AB')} and ${rn2('CD')} meet at ${map2.P}, with ${rn2('AC')} and ${rn2('BD')} drawn. Prove: ${rn2('PA · PB = PC · PD')}.`;
      if (mode === 'broken') return proof(R, 'broken', { head, lines, vis: vis2.vis, breaks: [{ i: 5, st: rn2('PA · PC = PB · PD'), why: rn2('cross-multiplying PA/PD = PC/PB gives PA · PB = PC · PD') }, { i: 3, rs: 'SSS similarity', why: 'only two pairs of angles are known, so the reason is AA similarity' }, { i: 2, rs: 'inscribed angles on the same arc', why: rn2('∠APC and ∠DPB have their vertex at P inside the circle; they are equal as vertical angles') }] });
      return proof(R, mode, { head, lines, vis: vis2.vis, oexp: 'Two angle pairs (in either order) give AA similarity, similar triangles give a proportion, and cross-multiplying gives the products.' }); } },
  });

  /* ================= V.8.14 Secant & tangent lengths ================= */
  const factorPairs = N => { const o = []; for (let x = 1; x * x < N; x++) if (N % x === 0) o.push([x, N / x]); return o; };
  const secPair = R => { for (let t = 0; t < 500; t++) { const N = R.int(12, 72), fp = factorPairs(N).filter(([x, y]) => x >= 2 && y - x >= 2 && y <= 20); if (fp.length < 2) continue; const [p1, p2] = R.sample(fp, 2); return [p1, p2]; } return [[3, 8], [4, 6]]; };
  const secLenFig = (R, p1, p2, labs) => { const L = lets(R, 5), [P0, A, B, Cn, D] = L, ph = R.int(0, 71) * 5, ps = ph + R.int(36, 52) * (R.bool() ? 1 : -1), pts = {};
    pts[P0] = [0, 0]; pts[A] = polar(p1[0], ph); pts[B] = polar(p1[1], ph); pts[Cn] = polar(p2[0], ps); pts[D] = polar(p2[1], ps); const O2 = K.circum(pts[A], pts[B], pts[Cn]);
    return { L, vis: cfig({ pts, segs: [[P0, A, { lab: labs[0] }], [A, B, { lab: labs[1] }], [P0, Cn, { lab: labs[2] }], [Cn, D, { lab: labs[3] }]], circ: [{ c: O2, r: dist(O2, pts[A]) }], label: 'two secants from an outside point' }) }; };
  const tanLenFig = (R, x, y, t, labs) => { const L = lets(R, 4), [P0, A, B, Tn] = L, ph = R.int(0, 71) * 5, ps = ph + R.int(36, 52) * (R.bool() ? 1 : -1), pts = {};
    pts[P0] = [0, 0]; pts[A] = polar(x, ph); pts[B] = polar(y, ph); pts[Tn] = polar(t, ps); const O2 = K.circum(pts[A], pts[B], pts[Tn]);
    return { L, vis: cfig({ pts, segs: [[P0, A, { lab: labs[0] }], [A, B, { lab: labs[1] }], [P0, Tn, { lab: labs[2] }]], circ: [{ c: O2, r: dist(O2, pts[A]) }], label: 'tangent and secant from an outside point' }) }; };
  const tanTriple = R => { for (let i = 0; i < 300; i++) { const t = R.int(3, 12), fp = factorPairs(t * t).filter(([x, y]) => y - x >= 2 && y <= 3 * t + 2 && x >= 1); if (fp.length) return [t, ...R.pick(fp)]; } return [6, 4, 9]; };
  const SSPROOF = [['Secants PAB and PCD are drawn from P', 'given', []],
    ['∠PBC = ∠PDA', 'inscribed angles on the same arc', [], ['vertical angles', 'reflexive property', 'alternate interior angles'], '∠ABC and ∠ADC both intercept arc AC'],
    ['∠BPC = ∠DPA', 'reflexive property', [], ['vertical angles', 'inscribed angles on the same arc', 'given'], 'both triangles use the same angle at P'],
    ['△PBC ~ △PDA', 'AA similarity', [1, 2], ['SAS similarity', 'SSS similarity', 'ASA congruence'], 'two pairs of angles are equal'],
    ['PB/PD = PC/PA', 'corresponding sides of similar triangles are proportional', [3], ['inscribed angles on the same arc', 'multiplication property of equality', 'given'], 'PB and PD correspond, as do PC and PA'],
    ['PA · PB = PC · PD', 'multiplication property of equality', [4], ['AA similarity', 'reflexive property', 'addition property of equality'], 'multiplying both sides by PD · PA clears the fractions']];
  S('V.8.14', 'Secant & tangent lengths', {
    a: { t: 'secant–secant', g: R => {
      const [p1, p2] = secPair(R), N = p1[0] * p1[1], { L, vis } = secLenFig(R, p1, p2, [String(p1[0]), String(p1[1] - p1[0]), String(p2[0]), 'x']), [P0, A, B, Cn, D] = L;
      return E.num(`Two secants are drawn from ${P0}. Find x.`, [{ label: 'x =', ans: p2[1] - p2[0] }], `Outside part × whole secant: ${p1[0]} × ${p1[1]} = ${p2[0]} × ${P0}${D}, so ${P0}${D} = ${p2[1]} and x = ${p2[1]} − ${p2[0]} = ${p2[1] - p2[0]}. (Not ${p1[0]} × ${p1[1] - p1[0]}: use the whole secant.)`, { visual: vis }); void N; void A; void B; void Cn; } },
    b: { t: 'secant–tangent', g: R => {
      const [t, x, y] = tanTriple(R), askT = R.bool(), { L, vis } = tanLenFig(R, x, y, t, askT ? [String(x), String(y - x), 'x'] : [String(x), 'x', String(t)]), [P0, A, B, Tn] = L;
      if (askT) return E.num(`${P0}${Tn} is tangent to the circle. Find x.`, [{ label: 'x =', ans: t }], `Tangent² = outside part × whole secant: x² = ${x} × ${y} = ${t * t}, so x = ${t}.`, { visual: vis });
      return E.num(`${P0}${Tn} is tangent to the circle. Find x.`, [{ label: 'x =', ans: y - x }], `${t}² = ${x} × ${P0}${B}, so ${P0}${B} = ${t * t} ÷ ${x} = ${y} and x = ${y} − ${x} = ${y - x}.`, { visual: vis }); void A; } },
    c: { t: 'solve', g: R => {
      if (R.bool()) { let t, x, k; do { x = R.int(1, 10); k = R.int(2, 14); t = Math.sqrt(x * (x + k)); } while (!Number.isInteger(t));
        const { L, vis } = tanLenFig(R, x, x + k, t, ['x', String(k), String(t)]), [P0, , , Tn] = L;
        return E.num(`${P0}${Tn} is tangent to the circle. Find x.`, [{ label: 'x =', ans: x }], `${t}² = x(x + ${k}), so ${M(`x^2+${k}x-${t * t}=0`)}, (x − ${x})(x + ${x + k}) = 0, and x = ${x}.`, { visual: vis }); }
      let p1, p2; do [p1, p2] = secPair(R); while (p1[1] - p1[0] < 1);
      const k = p1[1] - p1[0], { L, vis } = secLenFig(R, p1, p2, ['x', String(k), String(p2[0]), String(p2[1] - p2[0])]), N = p2[0] * p2[1];
      return E.num(`Two secants are drawn from ${L[0]}. Find x.`, [{ label: 'x =', ans: p1[0] }], `x(x + ${k}) = ${p2[0]} × ${p2[1]} = ${N}, so ${M(`x^2+${k === 1 ? '' : k}x-${N}=0`)}, (x − ${p1[0]})(x + ${p1[1]}) = 0, and x = ${p1[0]}.`, { visual: vis }); } },
    d: { t: 'power of a point idea', g: R => {
      if (R.bool(0.4)) { let p1, p2; do [p1, p2] = secPair(R); while ([p1, p2].some(q => q[0] / q[1] < 0.22 || q[0] / q[1] > 0.6)); const L = lets(R, 5), [P0, A, B, Cn, D] = L, ph = R.int(0, 71) * 5, ps = ph + R.int(36, 52) * (R.bool() ? 1 : -1), pts = {};
        pts[P0] = [0, 0]; pts[A] = polar(p1[0], ph); pts[B] = polar(p1[1], ph); pts[Cn] = polar(p2[0], ps); pts[D] = polar(p2[1], ps); const O2 = K.circum(pts[A], pts[B], pts[Cn]);
        const vis = cfig({ pts, segs: [[P0, B], [P0, D], [A, D, { dash: true }], [B, Cn, { dash: true }]], circ: [{ c: O2, r: dist(O2, pts[A]) }], label: 'two secants from an outside point, with two chords drawn' });
        const rn = K.rnF({ P: P0, A, B, C: Cn, D }), lines = SSPROOF.map(l => [rn(l[0]), l[1], l[2], l[3], l[4] && rn(l[4])]);
        return proof(R, R.pick(['order', 'order', 'reason', 'broken']), { head: `Given: secants ${P0}${A}${B} and ${P0}${Cn}${D} are drawn from ${P0}, with chords ${A}${D} and ${B}${Cn}. Prove: ${rn('PA · PB = PC · PD')}.`, lines, vis,
          oexp: 'The two angle pairs (in either order) give AA similarity, similar triangles give a proportion, and cross-multiplying gives the products.',
          breaks: [{ i: 3, rs: 'SAS similarity', why: 'no sides are known to be in proportion yet; the two pairs of equal angles give AA similarity' },
            { i: 5, st: rn('PA · PC = PB · PD'), why: rn('cross-multiplying PB/PD = PC/PA gives PA · PB = PC · PD') },
            { i: 2, rs: 'vertical angles', why: rn('no two lines cross at P to make vertical angles; both triangles use the same angle at P (reflexive property)') }] }); }
      const k = R.int(0, 3);
      if (k === 0) { const [p1, p2] = secPair(R), N = p1[0] * p1[1], Lt = lets(R, 5);
        return E.num(`Secant ${Lt[0]}${Lt[1]}${Lt[2]} has ${Lt[0]}${Lt[1]} = ${p1[0]} and ${Lt[0]}${Lt[2]} = ${p1[1]}. Another secant from ${Lt[0]} meets the circle at ${Lt[3]} and ${Lt[4]} with ${Lt[0]}${Lt[3]} = ${p2[0]}. Find ${Lt[0]}${Lt[4]}.`, [{ label: `${Lt[0]}${Lt[4]} =`, ans: p2[1] }],
          `Every line from ${Lt[0]} through the circle gives the same product, the power of ${Lt[0]}: ${p1[0]} × ${p1[1]} = ${N}. So ${Lt[0]}${Lt[4]} = ${N} ÷ ${p2[0]} = ${p2[1]}.`); }
      if (k === 1) { const [a, b, c] = R.pick(PTRIPLES), r = a, d = c;
        return E.num(`Point P is ${d} cm from the center of a circle of radius ${r} cm. How long is a tangent segment from P?`, [{ label: 'tangent =', ans: b }], `Tangent ⊥ radius, so tangent² = ${d}² − ${r}² = ${b * b}. The tangent is ${b} cm. (This d² − r² is the power of P.)`); }
      if (k === 2) { const r = R.int(3, 12), d = r + R.int(1, 10);
        return E.num(`Point P is ${d} from the center of a circle of radius ${r}. A line through P meets the circle at A and B. Find PA · PB.`, [{ label: 'PA · PB =', ans: d * d - r * r }], `Use the line through the center: PA = ${d} − ${r} = ${d - r} and PB = ${d} + ${r} = ${d + r}. Product = ${(d - r) * (d + r)}, and it is the same for every line through P.`); }
      let r, d, x, y; do { r = R.int(5, 13); d = R.int(1, r - 1); const N = r * r - d * d, fp = factorPairs(N).filter(([p, q]) => q < 2 * r && p > 0); if (fp.length) [x, y] = R.pick(fp); else x = null; } while (!x || x === r - d);
      return E.num(`Point P is inside a circle of radius ${r}, ${d} from the center. A chord through P is split so that one part is ${x}. Find the other part.`, [{ label: 'other part =', ans: y }],
        `The diameter through P has parts ${r} − ${d} = ${r - d} and ${r} + ${d} = ${r + d}, product ${r * r - d * d}. Every chord through P has the same product: ${r * r - d * d} ÷ ${x} = ${y}.`); } },
    e: { t: 'secant through the center', g: R => {
      if (R.bool()) { let t, a, r; do { t = R.int(4, 24); a = R.int(1, t - 1); r = (t * t - a * a) / (2 * a); } while (!Number.isInteger(r) || r < 2 || r > 30);
        const L = lets(R, 4), [P0, A, B, Tn] = L, rot = R.int(0, 71) * 5, pts = { O: [0, 0] }, dd = a + r; pts[P0] = polar(dd, rot); pts[A] = polar(r, rot); pts[B] = polar(r, rot + 180); pts[Tn] = polar(r, rot + (R.bool() ? 1 : -1) * Math.acos(r / dd) * 180 / Math.PI);
        const vis = cfig({ pts, segs: [[P0, A, { lab: String(a) }], [A, B], [P0, Tn, { lab: String(t) }], ['O', Tn, { dash: true }]], circ: [{ c: 'O', r }], label: 'tangent and a secant through the center' });
        return E.num(`${P0}${Tn} is tangent and secant ${P0}${A}${B} passes through the center O. Find the radius.`, [{ label: 'r =', ans: r }], `${t}² = ${a} × (${a} + 2r), so ${a} + 2r = ${t * t / a} and r = ${r}.`, { visual: vis }); }
      let r, a; do { r = R.int(2, 12); a = R.int(1, 12); } while (isSq(a * (a + 2 * r)));
      const ex = sqS(a * (a + 2 * r));
      return E.num(`A circle has radius ${r}. Point P is ${a} from the nearest point of the circle. Find the length of a tangent from P. Give an exact answer.`, [{ label: 'tangent =', exact: ex, form: 'simplest' }], `The line from P through the center gives ${a} × (${a} + ${2 * r}) = ${a * (a + 2 * r)} = tangent², so the tangent is ${P(ex)}.`); } },
    f: { t: 'power of a point', g: R => {
      const k = R.int(0, 2);
      if (k === 0) { let a, b; do { a = R.int(2, 9); b = R.int(2, 12); } while (isSq(a * (a + b)) && R.bool(0.7));
        const ex = sqS(a * (a + b));
        return E.num(`Two circles cross at A and B. Point P lies on line AB extended, with PA = ${a} and AB = ${b}. PT is tangent to one circle and PS is tangent to the other. Find PS.${isSq(a * (a + b)) ? '' : ' Give an exact answer.'}`, [{ label: 'PS =', exact: ex, form: 'simplest' }],
          `For either circle, P's tangent² = PA × PB = ${a} × ${a + b} = ${a * (a + b)}. So PT = PS = ${P(ex)}: P has the same power for both circles.`); }
      if (k === 1) { let r, d, x, y; do { r = R.int(6, 20); d = R.int(1, r - 1); const N = r * r - d * d, fp = factorPairs(N).filter(([p, q]) => p >= 2 && q <= 2 * r - 1 && p !== r - d); if (fp.length) [x, y] = R.pick(fp); else x = null; } while (!x);
        const big = R.bool();
        return E.num(`A circle has radius ${r}. P is inside it, ${d} from the center. A chord through P has one part of length ${big ? y : x}. How long is the whole chord?`, [{ label: 'chord =', ans: x + y }],
          `Power of P: the diameter through P gives (${r} − ${d})(${r} + ${d}) = ${r * r - d * d}. So the other part is ${r * r - d * d} ÷ ${big ? y : x} = ${big ? x : y}, and the chord is ${x + y}.`); }
      let r, d; do { r = R.int(3, 15); d = R.int(1, r - 1); } while (R.bool(0.5) && !isSq(r * r - d * d));
      const ex = sqS(4 * (r * r - d * d));
      return E.num(`P is ${d} from the center of a circle of radius ${r}. Find the length of the shortest chord through P.${isSq(r * r - d * d) ? '' : ' Give an exact answer.'}`, [{ label: 'chord =', exact: ex, form: 'simplest' }],
        `Every chord through P has parts with product ${r}² − ${d}² = ${r * r - d * d}. For a fixed product the sum is smallest when the parts are equal, so the shortest chord is bisected at P (it is ⊥ to the radius): 2√${r * r - d * d} = ${P(ex)}.`); } },
  });

  /* ================= V.8.15 Equation of a circle ================= */
  const sq = (v, h) => h === 0 ? `${v}^2` : `(${v}${h > 0 ? '-' : '+'}${Math.abs(h)})^2`;
  const stdEq = (h, k, r2v) => `${sq('x', h)}+${sq('y', k)}=${r2v}`;
  const lineEq = (A, B, Cv) => { const g = gcd(gcd(A, B), Cv) || 1; A /= g; B /= g; Cv /= g; if (A < 0 || (A === 0 && B < 0)) { A = -A; B = -B; Cv = -Cv; }
    const t = (c, v, first) => c === 0 ? '' : (c < 0 ? '-' : first ? '' : '+') + (Math.abs(c) === 1 ? '' : Math.abs(c)) + v; const lhs = (t(A, 'x', true) + t(B, 'y', !A)); return `${lhs}=${Cv}`; };
  const circG = (h, k, r, o = {}) => { let x0 = Math.min(Math.floor(h - r - 1), -1), x1 = Math.max(Math.ceil(h + r + 1), 1), y0 = Math.min(Math.floor(k - r - 1), -1), y1 = Math.max(Math.ceil(k + r + 1), 1);
    const sp = Math.max(x1 - x0, y1 - y0); x1 = x0 + sp; y1 = y0 + sp;
    return V.graph({ x: [x0, x1], y: [y0, y1], w: 300, h: 300, fns: o.fns || [], vlines: o.vlines || [], param: [{ x: t => h + r * Math.cos(t), y: t => k + r * Math.sin(t), t: [0, 2 * Math.PI], color: C.blue }], points: o.points || [[h, k, '']], label: 'circle on a coordinate grid' }); };
  const LAT = r => { const o = []; for (let x = -r; x <= r; x++) { const y = Math.sqrt(r * r - x * x); if (Number.isInteger(y)) { o.push([x, y]); if (y) o.push([x, -y]); } } return o; };
  S('V.8.15', 'Equation of a circle', {
    a: { t: '(x − h)² + (y − k)² = r²', g: R => {
      const h = R.int(-8, 8), k = R.int(-8, 8), r = R.int(1, 12), write = R.bool(0.4);
      if (write) return E.num(`Write the equation of the circle with center (${h}, ${k}) and radius ${r}.`, [{ eqn: stdEq(h, k, r * r) }], `Put h = ${h}, k = ${k}, r = ${r} into (x − h)² + (y − k)² = r²: ${P(stdEq(h, k, r * r))}. Watch the signs, and square the radius.`);
      const sqr = R.bool(0.75), r2v = sqr ? r * r : R.pick([2, 3, 5, 6, 7, 8, 10, 12, 18, 20, 27, 32, 45, 50]);
      return E.num(`Find the center and radius of ${M(stdEq(h, k, r2v))}.${sqr ? '' : ' Give the radius exactly.'}`, [{ label: 'center', point: [String(h), String(k)] }, sqr ? { label: 'radius', ans: r } : { label: 'radius', exact: sqS(r2v), form: 'simplest' }],
        `The signs flip: ${h ? `x ${h > 0 ? '−' : '+'} ${Math.abs(h)} means h = ${h}` : 'x² means h = 0'}, ${k ? `y ${k > 0 ? '−' : '+'} ${Math.abs(k)} means k = ${k}` : 'y² means k = 0'}. And ${r2v} is r², so r = ${P(sqr ? String(r) : sqS(r2v))}.`); } },
    b: { t: 'from Pythagoras', g: R => {
      if (R.bool(0.2)) { const h = R.int(-5, 5), k = R.int(-5, 5); return E.choice(R, `A point (x, y) is on a circle with center (${h}, ${k}) and radius r. Which equation does the Pythagorean theorem give?`, M(stdEq(h, k, 'r^2').replace('=r^2', '=r^2')), [M(`${sq('x', -h)}+${sq('y', -k)}=r^2`), M(`${sq('x', h)}+${sq('y', k)}=r`), M(`(x-${h}+y-${k})^2=r^2`.replace(/--/g, '+'))],
        `The horizontal leg is x − ${h}, the vertical leg is y − ${k}, and the hypotenuse is r: ${P(stdEq(h, k, 'r^2'))}.`); }
      const h = R.int(-6, 6), k = R.int(-6, 6), r = R.pick([5, 10, 13]), kind = R.int(0, 2); let dx, dy;
      if (kind === 1) [dx, dy] = R.pick(LAT(r).filter(p => p[0] && p[1])); else do { dx = R.int(-r - 3, r + 3); dy = R.int(-r - 3, r + 3); } while (kind === 0 ? dx * dx + dy * dy >= r * r || dx * dx + dy * dy < r * r / 3 : dx * dx + dy * dy <= r * r || dx * dx + dy * dy > 2 * r * r);
      const x = h + dx, y = k + dy, d2 = dx * dx + dy * dy;
      return E.choiceFixed(`Is the point (${x}, ${y}) inside, on or outside the circle ${M(stdEq(h, k, r * r))}?`, ['Inside', 'On', 'Outside'], kind,
        `Its squared distance from the center (${h}, ${k}) is ${dx < 0 ? `(${dx})` : dx}² + ${dy < 0 ? `(${dy})` : dy}² = ${d2}, ${d2 < r * r ? 'less than' : d2 === r * r ? 'equal to' : 'more than'} r² = ${r * r}, so it is ${['inside', 'on', 'outside'][kind]}.`); } },
    c: { t: 'write from center and point', g: R => {
      if (R.bool(0.35)) { let x1, y1, x2, y2; do { x1 = R.int(-8, 8); y1 = R.int(-8, 8); x2 = x1 + 2 * R.int(-5, 5); y2 = y1 + 2 * R.int(-5, 5); } while (x1 === x2 && y1 === y2);
        const h = (x1 + x2) / 2, k = (y1 + y2) / 2, r2v = ((x2 - x1) / 2) ** 2 + ((y2 - y1) / 2) ** 2;
        return E.num(`The endpoints of a diameter are (${x1}, ${y1}) and (${x2}, ${y2}). Write the equation of the circle.`, [{ eqn: stdEq(h, k, r2v) }], `The center is the midpoint, (${h}, ${k}). r² = ${(x2 - x1) / 2}² + ${(y2 - y1) / 2}² = ${r2v}. So ${P(stdEq(h, k, r2v))}.`); }
      let h, k, x, y; do { h = R.int(-7, 7); k = R.int(-7, 7); x = R.int(-9, 9); y = R.int(-9, 9); } while (x === h && y === k);
      const r2v = (x - h) ** 2 + (y - k) ** 2;
      return E.num(`A circle has center (${h}, ${k}) and passes through (${x}, ${y}). Write its equation.`, [{ eqn: stdEq(h, k, r2v) }], `r² = (${x} − ${h})² + (${y} − ${k})² = ${r2v}, so ${P(stdEq(h, k, r2v))}.`.replace(/− -/g, '+ ')); } },
    d: { t: 'graph it and find tangent lines', g: R => {
      const h = R.int(-4, 4), k = R.int(-4, 4);
      if (R.bool(0.3)) { const r = R.int(2, 6), vert = R.bool();
        return E.num(`The circle ${M(stdEq(h, k, r * r))} has two ${vert ? 'vertical' : 'horizontal'} tangent lines. Find them.`, [{ label: vert ? 'x =' : 'y =', set: vert ? [String(h - r), String(h + r)] : [String(k - r), String(k + r)] }],
          `The ${vert ? 'leftmost and rightmost' : 'lowest and highest'} points are r = ${r} from the center, so the tangents are ${vert ? `x = ${h} ± ${r}: x = ${h - r} and x = ${h + r}` : `y = ${k} ± ${r}: y = ${k - r} and y = ${k + r}`}.`, { visual: circG(h, k, r) }); }
      const r = R.pick([5, 5, 10, 13]), [dx, dy] = R.pick(LAT(r).filter(p => r === 5 || (p[0] && p[1]))), x0 = h + dx, y0 = k + dy, eq = lineEq(dx, dy, dx * x0 + dy * y0);
      const fns = dy ? [{ f: x => y0 - dx / dy * (x - x0), color: C.red }] : [], vl = dy ? [] : [{ x: x0, dash: false, color: C.red }];
      return E.num(`Find the equation of the tangent line to ${M(stdEq(h, k, r * r))} at (${x0}, ${y0}).`, [{ eqn: eq }],
        `The radius goes from (${h}, ${k}) to (${x0}, ${y0}), direction (${dx}, ${dy}). The tangent is perpendicular to it: ${P(`${dx ? `${dx}(x-${x0})` : ''}${dy ? `${dx ? '+' : ''}${dy}(y-${y0})` : ''}=0`.replace(/--/g, '+').replace(/\+-/g, '-'))}, which is ${P(eq)}.`, { visual: circG(h, k, r, { points: [[h, k, ''], [x0, y0, '']], fns, vlines: vl }) }); } },
  });

  /* ================= V.8.16 General form of a circle ================= */
  const genEq = (D, Ee, F, a = 1) => `${a === 1 ? '' : a}x^2+${a === 1 ? '' : a}y^2${D ? (D > 0 ? '+' : '') + D + 'x' : ''}${Ee ? (Ee > 0 ? '+' : '') + Ee + 'y' : ''}${F ? (F > 0 ? '+' : '') + F : ''}=0`;
  S('V.8.16', 'General form of a circle', {
    a: { t: 'recognize it', g: R => {
      const h = R.int(-5, 5) || 2, k = R.int(-5, 5) || -3, r = R.int(2, 6), D = -2 * h, Ee = -2 * k, F = h * h + k * k - r * r;
      const good = genEq(D, Ee, F), d = R.int(1, 5);
      const bad = [`2x^2+y^2${D > 0 ? '+' : ''}${D}x-${d}=0`, `x^2-y^2${Ee > 0 ? '+' : ''}${Ee}y-${d}=0`, `x^2+y${D > 0 ? '+' : ''}${D}x+${d}=0`, `x^2+xy+y^2-${d + 4}=0`, genEq(D, Ee, h * h + k * k + d)];
      const pick = R.sample(bad, 3);
      return E.choice(R, 'Which equation is a circle?', M(good), pick.map(M), `A circle needs x² and y² with the same coefficient, no xy term, and a positive r² after completing the square. Here (x ${h > 0 ? '−' : '+'} ${Math.abs(h)})² + (y ${k > 0 ? '−' : '+'} ${Math.abs(k)})² = ${r * r}.${pick.includes(bad[4]) ? ` (The one with + ${h * h + k * k + d} gives r² = −${d}: no points at all.)` : ''}`); } },
    b: { t: 'complete the square twice', g: R => {
      const h = R.int(-7, 7) || 3, k = R.int(-7, 7) || -2, r = R.int(1, 10), D = -2 * h, Ee = -2 * k, F = h * h + k * k - r * r;
      if (R.bool(0.3)) { const b = 2 * R.int(1, 9) * (R.bool() ? 1 : -1), v = R.pick(['x', 'y']);
        return E.num(`What number completes the square ${M(`${v}^2${b > 0 ? '+' : ''}${b}${v}+□`)}?`, [{ ans: (b / 2) ** 2 }], `Halve ${b} and square it: (${b / 2})² = ${(b / 2) ** 2}, giving (${v} ${b > 0 ? '+' : '−'} ${Math.abs(b / 2)})².`); }
      return E.num(`Completing the square turns ${M(genEq(D, Ee, F))} into ${M(`${sq('x', h)}+${sq('y', k)}=N`)}. Find N.`, [{ label: 'N =', ans: r * r }],
        `Move ${F} across: x² ${D >= 0 ? '+' : '−'} ${Math.abs(D)}x + y² ${Ee >= 0 ? '+' : '−'} ${Math.abs(Ee)}y = ${-F}. Add ${h * h} and ${k * k} to both sides: N = ${-F} + ${h * h} + ${k * k} = ${r * r}.`); } },
    c: { t: 'read center and radius', g: R => {
      const h = R.int(-7, 7), k = R.int(-7, 7), sqr = R.bool(0.7), r2v = sqr ? R.int(1, 10) ** 2 : R.pick([2, 3, 5, 6, 8, 10, 12, 13, 18, 20]), F = h * h + k * k - r2v, a = R.bool(0.3) ? R.pick([2, 3]) : 1;
      if (!h && !k) return E.num(`Find the radius of ${M(genEq(0, 0, -r2v, a).replace(/(\d+)x\^2/, '$1x^2'))}.${sqr ? '' : ' Give an exact answer.'}`, [sqr ? { label: 'radius', ans: Math.sqrt(r2v) } : { label: 'radius', exact: sqS(r2v), form: 'simplest' }], `${a > 1 ? `Divide by ${a}: ` : ''}x² + y² = ${r2v}, so r = ${P(sqr ? String(Math.sqrt(r2v)) : sqS(r2v))}.`);
      return E.num(`Find the center and radius of ${M(genEq(-2 * h * a, -2 * k * a, F * a, a))}.${sqr ? '' : ' Give the radius exactly.'}`, [{ label: 'center', point: [String(h), String(k)] }, sqr ? { label: 'radius', ans: Math.sqrt(r2v) } : { label: 'radius', exact: sqS(r2v), form: 'simplest' }],
        `${a > 1 ? `Divide by ${a} first. ` : ''}Complete the square: ${P(stdEq(h, k, r2v))}. Center (${h}, ${k}), radius ${P(sqr ? String(Math.sqrt(r2v)) : sqS(r2v))}.`); } },
    d: { t: 'circle through three points', g: R => {
      const h = R.int(-6, 6), k = R.int(-6, 6), r = R.pick([5, 5, 10, 13, 25].filter(z => z < 20 || R.bool(0.3))), pts3 = R.sample(LAT(r), 3).map(([dx, dy]) => [h + dx, k + dy]);
      const D = -2 * h, Ee = -2 * k, F = h * h + k * k - r * r, wantEq = R.bool(0.35), list = pts3.map(p => `(${p[0]}, ${p[1]})`).join(', ');
      if (wantEq) return E.num(`Write the equation of the circle through ${list}.`, [{ eqn: stdEq(h, k, r * r) }],
        `Put each point into x² + y² + Dx + Ey + F = 0 and solve the three equations: D = ${D}, E = ${Ee}, F = ${F}. Completing the square gives ${P(stdEq(h, k, r * r))}.`);
      return E.num(`Find the center and radius of the circle through ${list}.`, [{ label: 'center', point: [String(h), String(k)] }, { label: 'radius', ans: r }],
        `The center is equally far from all three points (it is where the perpendicular bisectors of two chords meet). Solving x² + y² + Dx + Ey + F = 0 for the three points gives D = ${D}, E = ${Ee}, F = ${F}: center (${h}, ${k}), radius ${r}.`); } },
  });

  /* ================= V.8.17 All circles are similar ================= */
  const PICONST = [['Circles P and Q have circumferences C₁, C₂ and diameters d₁, d₂', 'given', []],
    ['A dilation by some factor k maps circle P onto circle Q', 'all circles are similar', [0], ['all circles are congruent', 'every circle has the same radius', 'C = πd'], 'any circle can be dilated onto any other'],
    ['d₂ = k · d₁', 'a dilation multiplies every length by k', [1]],
    ['C₂ = k · C₁', 'a dilation multiplies every length by k', [1]],
    ['C₂ ÷ d₂ = kC₁ ÷ kd₁ = C₁ ÷ d₁', 'substitution', [2, 3], ['all circles are congruent', 'C = πd', 'reflexive property'], 'the two scaled lengths replace C₂ and d₂, and k cancels']];
  S('V.8.17', 'All circles are similar', {
    a: { t: 'by dilation', g: R => {
      const k = R.int(0, 3), L = lets(R, 2); let r1, r2v; do { r1 = R.int(2, 12); r2v = R.int(2, 18); } while (r1 === r2v);
      const g = gcd(r1, r2v), fr = [r2v / g, r1 / g];
      if (k === 0) return E.num(`Circle ${L[0]} has radius ${r1} and circle ${L[1]} has radius ${r2v}. What scale factor dilates circle ${L[0]} onto circle ${L[1]}?`, [{ label: 'k =', frac: fr, form: 'any' }], `Scale factor = new radius ÷ old radius = ${r2v}/${r1}${g > 1 ? ' = ' + E.fracStr(r2v, r1) : ''}.`);
      if (k === 1) return E.num(`Circle ${L[0]} has radius ${r1} and circle ${L[1]} has radius ${r2v}. Find the ratio of their areas, ${L[1]} : ${L[0]}, as a fraction.`, [{ label: 'area ratio =', frac: [fr[0] ** 2, fr[1] ** 2], form: 'any' }], `Lengths scale by ${E.fracStr(r2v, r1)}, so areas scale by its square: ${E.fracStr(r2v * r2v, r1 * r1)}.`);
      if (k === 2) return E.num(`Circle ${L[0]} has circumference ${2 * r1}π. It is dilated by a factor of ${E.fracStr(r2v, r1)}. Find the new circumference. Give an exact answer.`, [{ label: 'C =', exact: piS(2 * r2v), form: 'simplest' }], `Circumference is a length, so it scales by the same factor: ${2 * r1}π × ${E.fracStr(r2v, r1)} = ${P(piS(2 * r2v))}.`);
      return E.choice(R, `Circle ${L[0]} has center (1, 2) and radius ${r1}. Circle ${L[1]} has center (5, −1) and radius ${r2v}. Which pair of moves maps ${L[0]} onto ${L[1]}?`, `Translate by (4, −3), then dilate about (5, −1) by ${E.fracStr(r2v, r1)}`,
        [`Translate by (4, −3), then dilate about (5, −1) by ${E.fracStr(r1, r2v)}`, `Translate by (−4, 3), then dilate about (5, −1) by ${E.fracStr(r2v, r1)}`, `Rotate 90° about the origin only`], `Move the center from (1, 2) to (5, −1): that is (4, −3). Then scale the radius from ${r1} to ${r2v}: factor ${E.fracStr(r2v, r1)}. So any two circles are similar.`); } },
    b: { t: 'why π is constant', g: R => {
      const k = R.pick([0, 1, 2, 3, 3]);
      if (k === 3) { const L = R.sample(K.POOL.filter(x => !'CDK'.includes(x)), 2), rn = K.rnF({ P: L[0], Q: L[1] }), lines = PICONST.map(l => [rn(l[0]), l[1], l[2], l[3], l[4] && rn(l[4])]);
        return proof(R, R.pick(['order', 'order', 'reason']), { head: rn('Circle P has circumference C₁ and diameter d₁; circle Q has circumference C₂ and diameter d₂. Prove: C₂ ÷ d₂ = C₁ ÷ d₁.'), lines,
          oexp: 'Similarity gives the dilation, the dilation scales both lengths by k (in either order), and k cancels in the ratio.' }); }
      if (k === 0) { const ST = [['π = 22/7 exactly.', 0, '22/7 ≈ 3.1429 is only an approximation. π = 3.14159…, and its decimals never end or repeat.'], ['π = 3.14 exactly.', 0, '3.14 is a rounded value. π never ends or repeats.'], ['Circumference ÷ diameter is bigger for bigger circles.', 0, 'All circles are similar, so C and d scale together and C ÷ d is always π.'],
        ['Doubling the radius doubles the circumference.', 1, 'Circumference is a length, and lengths scale by the dilation factor.'], ['Tripling the diameter multiplies the area by 9.', 1, 'Areas scale by the square of the factor: 3² = 9.'], ['π is irrational.', 1, 'π cannot be written as a fraction of whole numbers; its decimals never end or repeat.']];
        const [s, t, w] = R.pick(ST); return E.tf(`True or false? ${s}`, !!t, w); }
      if (k === 1) return E.choice(R, 'Why is circumference ÷ diameter the same for every circle?', 'All circles are similar, so C and d scale by the same factor', ['Every circle has the same radius', 'π was chosen to make it work', 'Big circles are flatter than small ones'], 'A dilation multiplies every length of a circle by k, so C becomes kC and d becomes kd, and kC ÷ kd = C ÷ d. That constant is π.');
      const d = R.int(2, 30), byC = R.bool();
      return byC ? E.num(`A circle has circumference ${d}π. Find its diameter.`, [{ label: 'd =', ans: d }], `C ÷ d = π for every circle, so d = ${d}π ÷ π = ${d}.`) : E.num(`A circle has diameter ${d}. Find its circumference. Give an exact answer.`, [{ label: 'C =', exact: piS(d), form: 'simplest' }], `C = πd = ${P(piS(d))}.`); } },
    c: { t: "Archimedes' polygon squeeze", g: R => {
      const k = R.int(0, 3);
      if (k === 0) { const ins = R.bool(); return ins ? E.choice(R, 'A regular hexagon is inscribed in a circle of radius r. Each side equals r. What does its perimeter tell you about π?', 'π > 3', ['π < 3', 'π = 3', 'π > 4'], 'The perimeter 6r is shorter than the circumference 2πr, so 6r &lt; 2πr and π &gt; 3.')
        : E.choice(R, 'A square is drawn around a circle of radius r, touching it on all four sides. What does its perimeter tell you about π?', 'π < 4', ['π > 4', 'π = 4', 'π < 3'], 'The square has side 2r and perimeter 8r, longer than the circumference 2πr. So 2πr &lt; 8r and π &lt; 4.'); }
      if (k === 3) return E.choice(R, 'As Archimedes used polygons with more and more sides, inside and outside the circle, what happened to his bounds for π?', 'They squeezed closer together, trapping π', ['They moved apart', 'The inside bound became bigger than π', 'They stayed the same'], 'More sides hug the circle more closely, so the inner perimeter grows and the outer one shrinks toward the circumference. With 96 sides he got 3 10/71 < π < 3 1/7.');
      const n = R.pick([5, 6, 8, 10, 12, 16, 20, 24, 36, 48, 96]), inside = k === 1, v = inside ? n * Math.sin(Math.PI / n) : n * Math.tan(Math.PI / n);
      return E.num(`A regular ${n}-gon is drawn ${inside ? 'inside' : 'around'} a circle of diameter 1. Its perimeter is ${inside ? `${n} sin(180°/${n})` : `${n} tan(180°/${n})`}. Find this ${inside ? 'lower' : 'upper'} bound for π to 3 decimal places.`, [{ label: 'π ' + (inside ? '>' : '<'), ans: v, dp: 3 }],
        `${n} × ${inside ? 'sin' : 'tan'}(${fx(180 / n, 2)}°) ≈ ${v.toFixed(3)}. The circumference of the circle is π, which is ${inside ? 'longer than the inside' : 'shorter than the outside'} perimeter.`); } },
    d: { t: 'circumference to area by slicing', g: R => {
      const k = R.int(0, 2), r = R.int(2, 15);
      if (k === 0) { const w = R.bool(); return w ? E.choice(R, 'A circle of radius r is cut into many thin slices, which are laid top-to-tail into a near-rectangle. How wide is it?', 'πr, half the circumference', ['2πr, the whole circumference', 'r, the radius', 'πr²'], 'Half of the slices\' curved edges run along the top and half along the bottom, so each long side is half of 2πr: πr.')
        : E.choice(R, 'A circle of radius r is cut into many thin slices and laid top-to-tail into a near-rectangle. How tall is it?', 'r, the radius', ['2r, the diameter', 'πr', 'πr²'], 'Each slice is a thin sector whose straight sides are radii, so the height of the near-rectangle is r.'); }
      if (k === 1) return E.num(`A circle of radius ${r} is sliced and rearranged into a near-rectangle. How wide is the rectangle? Give an exact answer.`, [{ label: 'width =', exact: piS(r), form: 'simplest' }], `The width is half the circumference: ½ × 2π(${r}) = ${P(piS(r))}.`);
      return E.num(`A circle of radius ${r} is sliced and rearranged into a near-rectangle ${P(piS(r))} wide and ${r} tall. Find the area. Give an exact answer.`, [{ label: 'area =', exact: piS(r * r), form: 'simplest' }], `Area = width × height = ${P(piS(r))} × ${r} = ${P(piS(r * r))}, which is πr².`); } },
  });
})(typeof window !== "undefined" ? window : globalThis);
