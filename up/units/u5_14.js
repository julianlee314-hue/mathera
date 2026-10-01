/* Era V · Unit V.14 Solids (V.14.01–V.14.08) */
(function (G) {
  const E = G.E5, V = E.V, C = E.C, M = s => E.mx(s), K = E.K;
  const S = (id, name, steps) => E.skill({ id, name, steps });
  const gcd = E.gcd, P = s => E.pt(s), r2 = K.r2, TW = K.TW, fr = E.fracStr;

  /* ================= number helpers ================= */
  // n·π/d reduced, as a typed value: '36pi', 'pi/2', '196pi/3'
  const piS = (n, d = 1) => { if (d < 0) { n = -n; d = -d; } const g = gcd(Math.abs(n), d) || 1; n /= g; d /= g; if (n === 0) return '0'; const c = n === 1 ? '' : n === -1 ? '-' : String(n); return d === 1 ? `${c}pi` : `${c}pi/${d}`; };
  // a − b·π/d (or a + …) as a typed value
  const minusPi = (a, n, d = 1) => `${a}-${piS(n, d)}`, plusPi = (a, n, d = 1) => `${a}+${piS(n, d)}`;
  // √n simplified: '5', '2sqrt(3)'
  const sq = n => { const [k, m] = E.surd(1, n); return m === 1 ? String(k) : `${k === 1 ? '' : k}sqrt(${m})`; };
  const fx = (x, d = 1) => x.toFixed(d);
  const num = x => String(+x.toFixed(3));
  // a whole number or a fraction field
  const qField = (n, d, label) => { const g = gcd(Math.abs(n), d); return d / g === 1 ? { label, ans: n / g } : { label, frac: [n / g, d / g] }; };
  const TRIP = [[3, 4, 5], [4, 3, 5], [6, 8, 10], [8, 6, 10], [5, 12, 13], [12, 5, 13], [8, 15, 17], [15, 8, 17], [9, 12, 15], [12, 9, 15], [7, 24, 25], [20, 15, 25], [12, 16, 20], [16, 12, 20]];
  // 'an 8', 'an 11', 'an 18', 'an 80…' but 'a 7'
  const an = n => { const t = String(n); return /^8/.test(t) || /^1[18](\D|$)/.test(t) ? 'an' : 'a'; };
  // proof helpers: a two-column table with one reason hidden, numbered lines, three distinct wrong options
  const tbl = (rows, hide) => `<table class="dt"><tr><th>#</th><th>Statement</th><th>Reason</th></tr>${rows.map((r, i) => `<tr><td>${i + 1}</td><td>${r[0]}</td><td>${i === hide ? '<b>?</b>' : r[1]}</td></tr>`).join('')}</table>`;
  const numbered = lines => `<table class="dt">${lines.map((l, i) => `<tr><th>${i + 1}</th><td>${l}</td></tr>`).join('')}</table>`;
  const uniq3 = (ok, cands) => [...new Set(cands.filter(x => x !== ok))].slice(0, 3);
  const triple = (R, max = 30) => { let t; do { const b = R.pick(TRIP), k = R.int(1, 3); t = b.map(x => x * k); } while (t[2] > max); return t; };

  /* ================= 3-D drawing kit =================
     World: x right, y up, z toward the viewer. A view turns the world about the vertical (az) and tips it toward us (el),
     an orthographic (axonometric) projection: horizontal circles become axis-aligned ellipses. */
  const DG = Math.PI / 180;
  const view = (R, o = {}) => { const el = (o.el ?? R.int(17, 25)) * DG, az = (o.az ?? (R.bool() ? 1 : -1) * R.int(20, 36)) * DG; return { ca: Math.cos(az), sa: Math.sin(az), ce: Math.cos(el), se: Math.sin(el) }; };
  const FLAT = { ca: 1, sa: 0, ce: 1, se: 0 };
  const pj = (v, p) => { const x1 = p[0] * v.ca + p[2] * v.sa, z1 = -p[0] * v.sa + p[2] * v.ca; return [x1, p[1] * v.ce - z1 * v.se, z1 * v.ce + p[1] * v.se]; };   // [X, Y up, depth toward us]
  const a3 = (p, q) => [p[0] + q[0], p[1] + q[1], p[2] + q[2]], s3 = (p, q) => [p[0] - q[0], p[1] - q[1], p[2] - q[2]], m3 = (p, k) => [p[0] * k, p[1] * k, p[2] * k];
  const d3 = (p, q) => p[0] * q[0] + p[1] * q[1] + p[2] * q[2], x3 = (p, q) => [p[1] * q[2] - p[2] * q[1], p[2] * q[0] - p[0] * q[2], p[0] * q[1] - p[1] * q[0]];
  const n3 = p => Math.hypot(p[0], p[1], p[2]), u3 = p => m3(p, 1 / (n3(p) || 1)), l3 = (p, q, t) => a3(p, m3(s3(q, p), t));
  const cen = pts => m3(pts.reduce((s, p) => a3(s, p), [0, 0, 0]), 1 / pts.length);
  // a point on the horizontal circle (center c, radius r) at view angle s: s = 0 screen right, sin s > 0 toward the viewer
  const onC = (v, c, r, s) => { const cs = Math.cos(s), sn = Math.sin(s); return [c[0] + r * (cs * v.ca - sn * v.sa), c[1], c[2] + r * (cs * v.sa + sn * v.ca)]; };
  const arcP = (v, c, r, s0, s1, n = 36) => Array.from({ length: n + 1 }, (_, i) => onC(v, c, r, s0 + (s1 - s0) * i / n));
  const arc2 = (c, r, t0, t1, n = 40) => Array.from({ length: n + 1 }, (_, i) => { const t = (t0 + (t1 - t0) * i / n) * DG; return [c[0] + r * Math.cos(t), c[1] + r * Math.sin(t), 0]; });   // flat circle arc (degrees)
  const xv = v => [v.ca, 0, v.sa], uv = v => [v.se * v.sa, v.ce, -v.se * v.ca];   // world directions of screen-right and screen-up
  const TAU = 2 * Math.PI, PI = Math.PI;

  const scene = v => { const sc = { v, L: [], F: [], T: [], D: [], Q: [] };
    sc.ln = (a, b, o = {}) => { sc.L.push({ p: [a, b], o }); return sc; };
    sc.pl = (p, o = {}) => { sc.L.push({ p, o }); return sc; };
    sc.fill = (p, o = {}) => { sc.F.push({ p, o }); return sc; };
    sc.face = (p, o = {}) => { sc.Q.push({ p, o }); return sc; };
    sc.tx = (p, s, o = {}) => { sc.T.push({ p, s, o }); return sc; };
    sc.dot = (p, o = {}) => { sc.D.push({ p, o }); return sc; };
    sc.rt = (c, u, w, k) => sc.pl([a3(c, m3(u, k)), a3(a3(c, m3(u, k)), m3(w, k)), a3(c, m3(w, k))], { w: 1.3 });   // right-angle mark
    return sc; };
  const render = (sc, o = {}) => {
    const v = sc.v, W = o.w || 240, MH = o.h || 200;
    const q2 = p => { const q = pj(v, p); return [q[0], q[1]]; };
    const g = [...sc.L.flatMap(l => l.p), ...sc.F.flatMap(f => f.p), ...sc.Q.flatMap(f => f.p), ...sc.D.map(d => d.p)].map(q2);
    const xs = g.map(p => p[0]), ys = g.map(p => p[1]), mnx = Math.min(...xs), mxx = Math.max(...xs), mny = Math.min(...ys), mxy = Math.max(...ys);
    const k = Math.min(W / Math.max(1e-9, mxx - mnx), MH / Math.max(1e-9, mxy - mny));
    const T = p => { const q = q2(p); return [r2((q[0] - mnx) * k), r2((mxy - q[1]) * k)]; };
    const cx = (mxx - mnx) * k / 2, cy = (mxy - mny) * k / 2, box = [[-4, -4], [(mxx - mnx) * k + 4, (mxy - mny) * k + 4]];
    const pd = (pts, close) => pts.map((p, i) => { const t = T(p); return (i ? 'L' : 'M') + t[0] + ' ' + t[1]; }).join(' ') + (close ? ' Z' : '');
    let body = '';
    sc.Q.forEach(f => { body += `<path d="${pd(f.p, true)}" fill="${f.o.fill || C.faint}" stroke="${C.ink}" stroke-width="1.2" stroke-linejoin="round"/>`; });
    sc.F.forEach(f => { body += `<path d="${pd(f.p, true)}${(f.o.holes || []).map(h => ' ' + pd(h, true)).join('')}" fill="${f.o.color || C.blue}" fill-opacity="${f.o.op ?? 0.3}" fill-rule="evenodd" stroke="none"/>`; });
    sc.L.slice().sort((a, b) => !!b.o.dash - !!a.o.dash).forEach(l => {
      body += `<path d="${pd(l.p, l.o.close)}" fill="none" stroke="${l.o.color || C.ink}" stroke-width="${l.o.w || (l.o.dash ? 1.5 : 2)}"${l.o.dash ? ' stroke-dasharray="5 4"' : ''} stroke-linecap="round" stroke-linejoin="round"/>`; });
    sc.D.forEach(d => { const t = T(d.p); body += V.dot(t[0], t[1], d.o.r || 3.4, d.o.color || C.ink); });
    sc.T.forEach(t => { const z = t.o.size || 14, hw = TW(t.s, z) / 2, hh = z * 0.6, b = T(t.p); let dx, dy;
      if (t.o.dir) { dx = t.o.dir[0]; dy = -t.o.dir[1]; } else { dx = b[0] - cx; dy = b[1] - cy; }
      const L = Math.hypot(dx, dy); if (L < 1e-6) { dx = 0; dy = -1; } else { dx /= L; dy /= L; }
      const off = t.o.at ? 0 : (t.o.off ?? 5) + hw * Math.abs(dx) + hh * Math.abs(dy), x = b[0] + dx * off, y = b[1] + dy * off;
      box.push([x - hw - 2, y - hh - 2], [x + hw + 2, y + hh + 2]);
      body += V.text(r2(x), r2(y), t.s, { size: z, weight: t.o.weight || 600, fill: t.o.color || C.ink }).replace('<text ', '<text paint-order="stroke" stroke="#fff" stroke-width="3.5" stroke-linejoin="round" '); });
    const bx = box.map(b => b[0]), by = box.map(b => b[1]), x0 = Math.min(...bx) - 4, y0 = Math.min(...by) - 4;
    return V.svg(Math.ceil(Math.max(...bx) + 4 - x0), Math.ceil(Math.max(...by) + 4 - y0), `<g transform="translate(${r2(-x0)} ${r2(-y0)})">${body}</g>`, o.label || 'solid');
  };

  /* ----- polyhedra: an edge is dashed when every face that meets it faces away from us ----- */
  const newell = pts => { const n = [0, 0, 0]; pts.forEach((p, i) => { const q = pts[(i + 1) % pts.length]; n[0] += (p[1] - q[1]) * (p[2] + q[2]); n[1] += (p[2] - q[2]) * (p[0] + q[0]); n[2] += (p[0] - q[0]) * (p[1] + q[1]); }); return n; };
  const edgesOf = F => { const m = new Map(); F.forEach(f => f.forEach((i, k) => { const j = f[(k + 1) % f.length]; m.set(Math.min(i, j) + '-' + Math.max(i, j), [i, j]); })); return [...m.values()]; };
  const poly = (sc, VF, o = {}) => { const Vt = VF.V, c = cen(Vt), em = {};
    VF.F.forEach(f => { const fp = f.map(i => Vt[i]); let n = newell(fp); if (d3(n, s3(cen(fp), c)) < 0) n = m3(n, -1); const front = pj(sc.v, n)[2] > -0.02 * n3(n);
      f.forEach((i, k) => { const j = f[(k + 1) % f.length], key = Math.min(i, j) + '-' + Math.max(i, j), e = em[key] = em[key] || { i, j, f: false }; e.f = e.f || front; }); });
    Object.values(em).forEach(e => { if (e.f || !o.noHidden) sc.ln(Vt[e.i], Vt[e.j], { dash: !e.f, color: o.color, w: o.w }); });
    return Vt; };
  // vertical prism over a base polygon [[x,z],…]; the top may slide by sh = [dx, dz]
  const prismVF = (base, h, sh = [0, 0]) => { const n = base.length, Vt = [...base.map(([x, z]) => [x, 0, z]), ...base.map(([x, z]) => [x + sh[0], h, z + sh[1]])], ix = [...Array(n).keys()];
    const F = [ix, ix.map(i => i + n)]; for (let i = 0; i < n; i++) F.push([i, (i + 1) % n, (i + 1) % n + n, i + n]); return { V: Vt, F }; };
  const rectB = (a, b) => [[-a / 2, -b / 2], [a / 2, -b / 2], [a / 2, b / 2], [-a / 2, b / 2]];
  const boxVF = (a, h, b) => prismVF(rectB(a, b), h);
  const regB = (n, r, rot = 0) => Array.from({ length: n }, (_, i) => { const t = (rot + 360 * i / n) * DG; return [r * Math.cos(t), r * Math.sin(t)]; });
  const pyrVF = (base, h, ap = [0, 0]) => { const n = base.length, Vt = [...base.map(([x, z]) => [x, 0, z]), [ap[0], h, ap[1]]], ix = [...Array(n).keys()], F = [ix];
    for (let i = 0; i < n; i++) F.push([i, (i + 1) % n, n]); return { V: Vt, F }; };
  const frusVF = (base, h, t) => prismVF(base, h).V.length && (() => { const n = base.length, Vt = [...base.map(([x, z]) => [x, 0, z]), ...base.map(([x, z]) => [x * t, h, z * t])], ix = [...Array(n).keys()], F = [ix, ix.map(i => i + n)];
    for (let i = 0; i < n; i++) F.push([i, (i + 1) % n, (i + 1) % n + n, i + n]); return { V: Vt, F }; })();
  // a prism lying down: the polygon [[x,y],…] is its end, stretched along z
  const lyingVF = (end, L) => { const n = end.length, Vt = [...end.map(([x, y]) => [x, y, -L / 2]), ...end.map(([x, y]) => [x, y, L / 2])], ix = [...Array(n).keys()], F = [ix, ix.map(i => i + n)];
    for (let i = 0; i < n; i++) F.push([i, (i + 1) % n, (i + 1) % n + n, i + n]); return { V: Vt, F }; };
  const frontIdx = (v, Vt, idx) => idx.reduce((b, i) => pj(v, Vt[i])[2] > pj(v, Vt[b])[2] ? i : b, idx[0]);
  // label the two front bottom edges and one side edge of a box/prism over a 4-gon base (vertices 0–3 bottom, 4–7 top)
  const boxLabs = (sc, Vt, la, lb, lh) => { const f = frontIdx(sc.v, Vt, [0, 1, 2, 3]), j1 = (f + 1) % 4, j2 = (f + 3) % 4;
    [j1, j2].forEach(j => { const alongX = Math.abs(Vt[j][0] - Vt[f][0]) > 1e-9, s = alongX ? la : lb; if (s) sc.tx(l3(Vt[f], Vt[j], 0.5), s); });
    const side = pj(sc.v, Vt[j1])[0] > pj(sc.v, Vt[j2])[0] ? j1 : j2; if (lh) sc.tx(l3(Vt[side], Vt[side + 4], 0.5), lh, { dir: [pj(sc.v, Vt[side])[0] > pj(sc.v, Vt[f])[0] ? 1 : -1, 0] }); };

  /* ----- round solids (axis vertical) ----- */
  const ST = o => o.color ? { color: o.color } : {};
  const ring = (sc, c, r, mode, o = {}) => {   // 'full' solid ellipse, 'half' front solid + back dashed, 'front' front only
    if (mode === 'full') return sc.pl(arcP(sc.v, c, r, 0, TAU, 72), ST(o));
    sc.pl(arcP(sc.v, c, r, 0, PI), ST(o)); if (mode === 'half') sc.pl(arcP(sc.v, c, r, PI, TAU), { ...ST(o), dash: true }); return sc; };
  const cyl = (sc, c, r, h, o = {}) => { const v = sc.v, t = a3(c, [0, h, 0]);
    ring(sc, c, r, o.bottom || 'half', o); ring(sc, t, r, o.top || 'full', o);
    sc.ln(onC(v, c, r, 0), onC(v, t, r, 0), ST(o)); sc.ln(onC(v, c, r, PI), onC(v, t, r, PI), ST(o)); return t; };
  // slanted cylinder: the top center is c + [dx, h, dz]
  const oblCyl = (sc, c, r, h, dx, dz, o = {}) => { const v = sc.v, t = a3(c, [dx, h, dz]), A = pj(v, c), B = pj(v, t), dX = B[0] - A[0], dY = B[1] - A[1], s0 = Math.atan(r * v.se * dX / (r * dY));
    sc.pl(arcP(v, c, r, s0, s0 + PI), ST(o)); sc.pl(arcP(v, c, r, s0 + PI, s0 + TAU), { ...ST(o), dash: true }); ring(sc, t, r, 'full', o);
    sc.ln(onC(v, c, r, s0), onC(v, t, r, s0), ST(o)); sc.ln(onC(v, c, r, s0 + PI), onC(v, t, r, s0 + PI), ST(o)); return { t, s0 }; };
  // cone on base center c; h > 0 points up, h < 0 hangs down. rim: 'auto' | 'half' | 'none'
  const cone = (sc, c, r, h, o = {}) => { const v = sc.v, ap = a3(c, [0, h, 0]), q = -r * v.se / (h * v.ce);
    const s1 = Math.abs(q) < 0.97 ? Math.asin(q) : 0, s2 = PI - s1, rim = o.rim || 'auto';
    if (rim === 'auto') { if (h > 0) { sc.pl(arcP(v, c, r, s1, s2), ST(o)); sc.pl(arcP(v, c, r, s2, s1 + TAU), { ...ST(o), dash: true }); } else ring(sc, c, r, 'full', o); }
    else if (rim !== 'none') ring(sc, c, r, rim, o);
    sc.ln(ap, onC(v, c, r, s1), ST(o)); sc.ln(ap, onC(v, c, r, s2), ST(o)); return { ap, s1, s2 }; };
  const frus = (sc, c, R0, r, h, o = {}) => { const v = sc.v, t = a3(c, [0, h, 0]), H = h * R0 / (R0 - r), q = -R0 * v.se / (H * v.ce), s1 = Math.asin(Math.max(-0.97, q)), s2 = PI - s1;
    sc.pl(arcP(v, c, R0, s1, s2), ST(o)); sc.pl(arcP(v, c, R0, s2, s1 + TAU), { ...ST(o), dash: true }); ring(sc, t, r, o.top || 'full', o);
    sc.ln(onC(v, c, R0, s1), onC(v, t, r, s1), ST(o)); sc.ln(onC(v, c, R0, s2), onC(v, t, r, s2), ST(o)); return { t, s1, s2 }; };
  // outline great circle, t in degrees: 0 = screen right, 90 = top
  const outline = (v, c, r, t0, t1) => { const X = xv(v), U = uv(v); return Array.from({ length: 49 }, (_, i) => { const t = (t0 + (t1 - t0) * i / 48) * DG; return a3(c, a3(m3(X, r * Math.cos(t)), m3(U, r * Math.sin(t)))); }); };
  const sphere = (sc, c, r, o = {}) => { sc.pl(outline(sc.v, c, r, 0, 360), ST(o)); if (o.eq !== false) ring(sc, c, r, 'half', o); };
  const hemi = (sc, c, r, o = {}) => { sc.pl(outline(sc.v, c, r, 0, 180), ST(o)); ring(sc, c, r, o.rim || 'half', o); };
  // helper lines with labels: dashed radius on a base, height with right-angle mark
  const radius = (sc, c, r, lab, o = {}) => { const s = o.s ?? 0.35, p = onC(sc.v, c, r, s); sc.ln(c, p, { dash: !o.solid, color: o.color }); sc.dot(c, { r: 2.6 }); if (lab) sc.tx(l3(c, p, 0.5), lab, { dir: o.dir || [0.25, -1], off: 3 }); return p; };
  const height = (sc, c, top, lab, o = {}) => { sc.ln(c, top, { dash: true }); const k = o.k || n3(s3(top, c)) * 0.09, u = u3(s3(onC(sc.v, c, 1, o.s ?? 0.35), c));
    sc.rt(c, [0, 1, 0], u, k); if (lab) sc.tx(l3(c, top, o.at ?? 0.5), lab, { dir: o.dir || [-1, 0], off: 4 }); };

  /* ----- plane sections of a convex polyhedron ----- */
  const section = (VF, n, d) => { const pts = [], add = p => { if (!pts.some(q => n3(s3(p, q)) < 1e-7)) pts.push(p); };
    edgesOf(VF.F).forEach(([i, j]) => { const p = VF.V[i], q = VF.V[j], fp = d3(n, p) - d, fq = d3(n, q) - d;
      if (Math.abs(fp) < 1e-9) add(p); if (Math.abs(fq) < 1e-9) add(q);
      if (fp * fq < 0 && Math.abs(fp) > 1e-9 && Math.abs(fq) > 1e-9) add(l3(p, q, fp / (fp - fq))); });
    if (pts.length < 3) return null;
    const c = cen(pts), nn = u3(n), u = u3(x3(nn, Math.abs(nn[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0])), w = x3(nn, u), an = p => Math.atan2(d3(s3(p, c), w), d3(s3(p, c), u));
    pts.sort((a, b) => an(a) - an(b));
    return pts.filter((p, i) => { const a = pts[(i + pts.length - 1) % pts.length], b = pts[(i + 1) % pts.length]; return n3(x3(s3(p, a), s3(b, p))) > 1e-7; });
  };
  const classify = pts => { const n = pts.length, sd = pts.map((p, i) => n3(s3(pts[(i + 1) % n], p))), eq = (a, b) => Math.abs(a - b) < 1e-6 * (1 + Math.abs(a));
    const par = (i, j) => n3(x3(u3(s3(pts[(i + 1) % n], pts[i])), u3(s3(pts[(j + 1) % n], pts[j])))) < 1e-6;
    if (n === 3) return eq(sd[0], sd[1]) && eq(sd[1], sd[2]) ? 'eqtri' : eq(sd[0], sd[1]) || eq(sd[1], sd[2]) || eq(sd[0], sd[2]) ? 'isotri' : 'scatri';
    if (n === 4) { const p1 = par(0, 2), p2 = par(1, 3), dA = n3(s3(pts[2], pts[0])), dB = n3(s3(pts[3], pts[1])), all = sd.every(x => eq(x, sd[0]));
      if (p1 && p2) return all ? (eq(dA, dB) ? 'square' : 'rhombus') : (eq(dA, dB) ? 'rect' : 'para');
      return p1 || p2 ? 'trap' : 'quad'; }
    if (n === 5) return 'pent';
    if (n === 6) { const dg = pts.map((p, i) => n3(s3(pts[(i + 2) % n], p))); return sd.every(x => eq(x, sd[0])) && dg.every(x => eq(x, dg[0])) ? 'hexr' : 'hex'; }
    return 'other'; };
  const sides = pts => pts.map((p, i) => n3(s3(pts[(i + 1) % pts.length], p)));
  const NM = { eqtri: 'equilateral triangle', isotri: 'isosceles triangle (not equilateral)', scatri: 'scalene triangle', square: 'square', rect: 'rectangle (not a square)', rhombus: 'rhombus (not a square)',
    para: 'parallelogram (no right angles)', trap: 'trapezoid', quad: 'irregular quadrilateral', pent: 'pentagon', hexr: 'regular hexagon', hex: 'hexagon (not regular)' };
  const NEAR = { eqtri: ['isotri', 'hexr', 'square'], isotri: ['eqtri', 'scatri', 'trap'], scatri: ['isotri', 'eqtri', 'trap'], square: ['rect', 'rhombus', 'eqtri'], rect: ['square', 'rhombus', 'trap'],
    rhombus: ['square', 'rect', 'para'], para: ['rect', 'rhombus', 'trap'], trap: ['rect', 'para', 'pent'], quad: ['trap', 'rect', 'pent'], pent: ['hexr', 'trap', 'hex'], hexr: ['hex', 'pent', 'eqtri'], hex: ['hexr', 'pent', 'rect'] };
  const SIMPLE = { eqtri: 'triangle', isotri: 'triangle', scatri: 'triangle', square: 'square', rect: 'rectangle (not a square)', trap: 'trapezoid', pent: 'pentagon', hexr: 'hexagon', hex: 'hexagon' };
  const SHAPES = ['triangle', 'square', 'rectangle (not a square)', 'trapezoid', 'pentagon', 'hexagon', 'circle'];
  const wrong3 = (R, ans, pool, prefer = []) => { const w = prefer.filter(x => x !== ans && pool.includes(x)), rest = R.shuffle(pool.filter(x => x !== ans && !w.includes(x))); return [...w, ...rest].slice(0, 3); };
  const secStyle = sc => sec => { sc.fill(sec, { color: C.blue, op: 0.32 }); sc.pl(sec, { close: true, color: '#2F6DB0', w: 1.6 }); };

  /* ----- flat (2-D) figures for regions spun about an axis ----- */
  const rot2 = (p, q) => { const x = p[0], y = p[1]; return q === 0 ? [x, y, 0] : q === 1 ? [-y, x, 0] : q === 2 ? [-x, -y, 0] : [y, -x, 0]; };
  // canonical picture: the axis is the line x = 0; q turns the whole picture by q·90°, fl mirrors it
  const flatFig = (R, build, o = {}) => { const q = R.int(0, 3), fl = R.bool(), sc = scene(FLAT), tf = p => rot2([fl ? -p[0] : p[0], p[1]], q), td = d => { const r = rot2([fl ? -d[0] : d[0], d[1]], q); return [r[0], r[1]]; };
    const api = { line: (a, b, op = {}) => sc.ln(tf(a), tf(b), op), path: (pts, op = {}) => sc.pl(pts.map(tf), op), fill: (pts, op = {}) => sc.fill(pts.map(tf), op),
      text: (p, s, op = {}) => sc.tx(tf(p), s, op.dir ? { ...op, dir: td(op.dir) } : op), dot: p => sc.dot(tf(p)), rt: (c, u, w, k) => sc.rt(tf(c), tf(u), tf(w), k) };
    build(api); return render(sc, { w: o.w || 220, h: o.h || 190, label: o.label || 'flat region and axis' }); };
  const axisLine = (api, y0, y1) => { api.line([0, y0], [0, y1], { dash: true, color: C.red, w: 1.8 }); api.text([0, y1], '↻ axis', { dir: [0, 1], color: C.red, size: 13 }); };

  /* ----- unit-cube (voxel) solids, painted back to front ----- */
  const voxFig = (R, cells, k, label) => { const v = view(R, { az: R.pick([-1, 1]) * R.int(28, 40), el: R.int(24, 32) }), sc = scene(v), key = (x, y, z) => x + ',' + y + ',' + z;
    const list = [...cells].map(s => s.split(',').map(Number)).sort((a, b) => pj(v, a.map(t => t + 0.5))[2] - pj(v, b.map(t => t + 0.5))[2]);
    const DIRS = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]], shade = d => d[1] === 1 ? '#EEF2F8' : d[1] === -1 ? '#9FB3D1' : Math.abs(d[0]) ? '#C3D2E8' : '#DCE5F2';
    list.forEach(([x, y, z]) => DIRS.forEach(d => { if (cells.has(key(x + d[0], y + d[1], z + d[2])) || pj(v, d)[2] <= 0) return;
      const ax = d.findIndex(t => t !== 0), o1 = (ax + 1) % 3, o2 = (ax + 2) % 3, base = [x, y, z]; if (d[ax] > 0) base[ax] += 1;
      const c = [[0, 0], [1, 0], [1, 1], [0, 1]].map(([i, j]) => { const p = base.slice(); p[o1] += i; p[o2] += j; return p.map(t => t * k); });
      sc.face(c, { fill: shade(d) }); }));
    return render(sc, { w: 220, h: 200, label }); };

  /* ================= V.14.01 Cross-sections ================= */
  const vertProblem = (sec, H) => { const sd = sides(sec), w = sd.find(x => Math.abs(x - H) > 1e-6) ?? sd[0]; return w; };
  S('V.14.01', 'Cross-sections', {
    a: { t: 'of prisms', g: R => {
      for (let tries = 0; ; tries++) {
        const k = R.int(0, 5), v = view(R); let VF, n, d, desc, solid, why;
        if (k <= 1) { const A = R.int(3, 7), sqb = R.bool(0.4), B = sqb ? A : R.int(2, 6), H = R.int(3, 7); if (!sqb && A === B) continue; VF = boxVF(A, H, B); solid = sqb ? 'box with a square base' : 'rectangular box';
          if (k === 0) { n = [0, 1, 0]; d = H * R.pick([0.35, 0.5, 0.65]); desc = 'parallel to its base'; why = 'parallel'; }
          else { const ax = R.bool(); n = ax ? [1, 0, 0] : [0, 0, 1]; d = (ax ? A : B) * R.pick([-0.2, 0.15, 0.25]); desc = 'perpendicular to its base, parallel to a side face'; why = 'vert'; } }
        else if (k === 2) { const m = R.pick([3, 5, 6]), H = R.int(3, 6); VF = prismVF(regB(m, R.int(20, 30) / 10, R.int(0, 59)), H); solid = `${['', '', '', 'triangular', '', 'pentagonal', 'hexagonal'][m]} prism`;
          if (R.bool(0.6)) { n = [0, 1, 0]; d = H * R.pick([0.4, 0.55]); desc = 'parallel to its base'; why = 'parallel'; }
          else { const ph = R.int(0, 179) * DG; n = [Math.cos(ph), 0, Math.sin(ph)]; d = R.pick([-0.5, 0.4, 0.6]); desc = 'perpendicular to its base'; why = 'vert'; } }
        else if (k === 3 || k === 4) { const b = R.int(3, 6), ht = R.int(2, 5), off = R.int(-10, 10) / 10, L = R.int(5, 8); VF = lyingVF([[-b / 2, 0], [b / 2, 0], [off, ht]], L); solid = 'triangular prism lying on one of its rectangular faces';
          if (k === 3) { n = [0, 0, 1]; d = L * R.pick([-0.25, 0.2, 0.3]); desc = 'parallel to its triangular ends'; why = 'ends'; }
          else { n = [0, 1, 0]; d = ht * R.pick([0.35, 0.5]); desc = 'parallel to the face it rests on'; why = 'flat'; } }
        else { const s = R.int(3, 6); VF = boxVF(s, s, s); solid = 'cube'; const sg = R.bool() ? 1 : -1; n = [1, 0, -sg]; d = 0; desc = 'straight down through two opposite vertical edges'; why = 'diag'; }
        const sec = section(VF, n, d); if (!sec) continue; const nm = SIMPLE[classify(sec)]; if (!nm) continue;
        const sc = scene(v); secStyle(sc)(sec); poly(sc, VF);
        const sd = sides(sec).map(x => r2(x));
        const ex = why === 'parallel' ? `A slice parallel to the base of a prism is a copy of the base, so it is a ${nm}.`
          : why === 'ends' ? `A slice parallel to the ends is a copy of the triangular end: a triangle.`
          : why === 'flat' ? `The slice crosses both triangular ends in parallel segments of equal length and runs the full length of the prism: a rectangle (${num(sd[0])} by ${num(sd[1])}).`
          : why === 'diag' ? `The slice is as tall as the cube's edge (${num(Math.min(...sd))}) and as wide as a face diagonal (${num(Math.max(...sd))}), so it is a rectangle, not a square. A slice of a cube need not be a square.`
          : nm === 'square' ? `A slice perpendicular to the bases of an upright prism runs straight up the sides: a rectangle. Here its width equals the height (${num(sd[0])}), so it is a square.`
          : `A slice perpendicular to the bases of an upright prism runs straight up the sides, so it is a rectangle (${num(sd[0])} by ${num(sd[1])}).`;
        return E.choice(R, `A plane cuts this ${solid} ${desc}. What shape is the shaded cross-section?`, nm, wrong3(R, nm, SHAPES, nm === 'square' ? ['rectangle (not a square)'] : nm.startsWith('rect') ? ['square'] : []), ex, { visual: render(sc, { label: 'prism with a cross-section' }) });
      } } },
    b: { t: 'of pyramids', g: R => {
      const k = R.int(0, 4), v = view(R);
      if (k === 4) { const t = R.pick([[1, 2], [1, 3], [2, 3], [1, 4], [3, 4]]), s = t[1] * R.int(2, 5), H = R.int(4, 9), side = s * (t[1] - t[0]) / t[1], area = R.bool(0.4);
        const VF = pyrVF(rectB(s, s), H), sec = section(VF, [0, 1, 0], H * t[0] / t[1]), sc = scene(v); secStyle(sc)(sec); poly(sc, VF); boxLabs(sc, [...VF.V.slice(0, 4), ...VF.V.slice(0, 4)], String(s), String(s));
        const where = `${t[0]}/${t[1]} of the way up from the base`;
        return E.num(`A square pyramid has base side ${s} cm. A plane parallel to the base cuts it ${where}. Find the ${area ? 'area' : 'side length'} of the square cross-section.`,
          [area ? { label: 'area =', ans: side * side } : { label: 'side =', ans: side }],
          `The slice is a smaller square. It is ${t[1] - t[0]}/${t[1]} of the way down from the apex, so its side is ${t[1] - t[0]}/${t[1]} × ${s} = ${num(side)} cm${area ? `, and its area is ${num(side)}² = ${num(side * side)} cm²` : ''}.`, { visual: render(sc, { label: 'pyramid with a cross-section' }) }); }
      for (;;) {
        const bk = k === 3 ? R.pick(['sq', 'rect']) : R.pick(['sq', 'rect', 'tri', 'hex']), H = R.int(4, 7);
        const base = bk === 'sq' ? rectB(4, 4) : bk === 'rect' ? rectB(R.pick([5, 6]), R.pick([3, 3.5])) : regB(bk === 'tri' ? 3 : 6, 2.6, R.int(0, 59)), VF = pyrVF(base, H);
        const bn = { sq: 'square', rect: 'rectangular', tri: 'triangular', hex: 'hexagonal' }[bk];
        let n, d, desc, ex;
        if (k <= 1) { n = [0, 1, 0]; d = H * R.pick([0.3, 0.45, 0.6]); desc = 'parallel to its base'; }
        else if (k === 2) { const ph = R.int(0, 179) * DG; n = [Math.cos(ph), 0, Math.sin(ph)]; d = 0; desc = 'perpendicular to its base, through the apex'; }
        else { n = [1, 0, 0]; d = (bk === 'sq' ? 2 : base[1][0]) * R.pick([0.3, 0.45, 0.6]); desc = 'perpendicular to its base and parallel to one base edge, missing the apex'; }
        const sec = section(VF, n, d); if (!sec) continue; const cl = classify(sec), nm = SIMPLE[cl]; if (!nm) continue;
        ex = k <= 1 ? `A slice parallel to the base of a pyramid is a smaller copy of the base, so it is a ${nm}.`
          : k === 2 ? 'The plane cuts the base in a segment and passes through the apex, so the slice is a triangle.'
          : 'The plane cuts the base in one segment and two sloping faces lower down; the top and bottom edges are parallel, so it is a trapezoid.';
        const sc = scene(v); secStyle(sc)(sec); poly(sc, VF);
        return E.choice(R, `A plane cuts this ${bn} pyramid ${desc}. What shape is the shaded cross-section?`, nm, wrong3(R, nm, SHAPES, k === 3 ? ['triangle', 'rectangle (not a square)'] : k === 2 ? ['trapezoid'] : []), ex, { visual: render(sc, { label: 'pyramid with a cross-section' }) });
      } } },
    c: { t: 'of cylinders and cones', g: R => {
      const v = view(R), sc = scene(v), cylQ = R.bool(), k = R.int(0, 4);
      if (cylQ) { let r, H; do { r = R.int(2, 6); H = R.int(4, 10); } while (H === 2 * r);
        const fill = secStyle(sc), O = [0, 0, 0];
        if (k === 4) { const thru = R.bool(), ph = R.pick([0.5, 0.7, 2.2, 2.5]), q = R.bool();
          if (thru || q) { const a = onC(v, O, r, ph), b = onC(v, O, r, ph + PI); fill([a, b, a3(b, [0, H, 0]), a3(a, [0, H, 0])]); cyl(sc, O, r, H); radius(sc, [0, H, 0], r, String(r), { solid: true, s: ph + 0.9, dir: [0, 1] }); sc.tx(onC(v, [0, H / 2, 0], r, PI), String(H), { dir: [-1, 0] });
            return E.num(`A cylinder of radius ${r} cm and height ${H} cm is cut by a plane through its axis. Find the area of the cross-section.`, [{ label: 'area =', ans: 2 * r * H }],
              `Through the axis the slice is a rectangle ${2 * r} cm wide (the diameter, not the radius) and ${H} cm tall: ${2 * r} × ${H} = ${2 * r * H} cm².`, { visual: render(sc, { label: 'cylinder cut through its axis' }) }); }
          fill(arcP(v, [0, H * 0.55, 0], r, 0, TAU, 60)); cyl(sc, O, r, H); radius(sc, [0, H, 0], r, String(r), { solid: true, dir: [0, 1] });
          return E.num(`A cylinder of radius ${r} cm is cut by a plane parallel to its base. Find the area of the cross-section. Give an exact answer.`, [{ label: 'area =', exact: piS(r * r) }],
            `A slice parallel to the base is a circle the same size as the base: π(${r})² = ${P(piS(r * r))} cm².`, { visual: render(sc, { label: 'cylinder with a cross-section' }) }); }
        const cut = [['parallel to its base', 'circle', 'A slice parallel to the base is a copy of the base: a circle.'],
          ['through its axis, perpendicular to the base', 'rectangle', 'The plane meets each base in a diameter and runs straight up the sides: a rectangle.'],
          ['at a slant, without touching either base', 'ellipse', 'A slanted slice of a cylinder is an ellipse, not a circle: it is stretched along the slant.'],
          ['perpendicular to its base, but not through the axis', 'rectangle', 'The plane meets each base in a chord and runs straight up the sides: a rectangle.']][k];
        if (k === 0) fill(arcP(v, [0, H * R.pick([0.35, 0.6]), 0], r, 0, TAU, 60));
        else if (k === 1) { const ph = R.pick([0.5, 0.7, 2.3, 2.6]), a = onC(v, O, r, ph), b = onC(v, O, r, ph + PI); fill([a, b, a3(b, [0, H, 0]), a3(a, [0, H, 0])]); }
        else if (k === 2) { const ph = R.int(0, 359) * DG, m = R.pick([0.25, 0.32, 0.4]) * H / r * R.pick([1, -1]), y0 = H * 0.5;
          fill(Array.from({ length: 61 }, (_, i) => { const s = i / 60 * TAU, x = r * Math.cos(s), z = r * Math.sin(s); return [x, y0 + m * (x * Math.cos(ph) + z * Math.sin(ph)), z]; })); }
        else { const ps = R.pick([0.6, 2.4, -0.5]), be = R.pick([0.8, 1.0, 1.2]), a = onC(v, O, r, ps - be), b = onC(v, O, r, ps + be); fill([a, b, a3(b, [0, H, 0]), a3(a, [0, H, 0])]); }
        cyl(sc, O, r, H);
        return E.choice(R, `A plane cuts this cylinder ${cut[0]}. What shape is the shaded cross-section?`, cut[1], wrong3(R, cut[1], ['circle', 'ellipse', 'rectangle', 'triangle', 'trapezoid'], k === 2 ? ['circle'] : k === 0 ? ['ellipse'] : []), cut[2], { visual: render(sc, { label: 'cylinder with a cross-section' }) });
      }
      const r = R.int(2, 6), H = R.int(4, 10), O = [0, 0, 0], fill = secStyle(sc);
      if (k === 4) { if (R.bool()) { const ph = R.pick([0.5, 0.7, 2.3, 2.6]); fill([onC(v, O, r, ph), onC(v, O, r, ph + PI), [0, H, 0]]); const cn = cone(sc, O, r, H); height(sc, O, [0, H, 0], String(H)); radius(sc, O, r, String(r));
          return E.num(`A cone of radius ${r} cm and height ${H} cm is cut by a plane through its apex and the center of its base. Find the area of the cross-section.`, [{ label: 'area =', ans: r * H }],
            `The slice is a triangle with base ${2 * r} cm (a diameter) and height ${H} cm: ½ × ${2 * r} × ${H} = ${r * H} cm².`, { visual: render(sc, { label: 'cone cut through its apex' }) }); }
        const Hh = 2 * R.int(2, 5), rr = 2 * R.int(1, 4); fill(arcP(v, [0, Hh / 2, 0], rr / 2, 0, TAU, 60)); cone(sc, O, rr, Hh); height(sc, O, [0, Hh, 0], String(Hh), { at: 0.78 }); radius(sc, O, rr, String(rr));
        return E.num(`A cone of radius ${rr} cm and height ${Hh} cm is cut by a plane parallel to its base, halfway up. Find the area of the cross-section. Give an exact answer.`, [{ label: 'area =', exact: piS(rr * rr / 4) }],
          `Halfway up, the slice is a circle with half the base radius: ${rr / 2} cm. Area = π(${rr / 2})² = ${P(piS(rr * rr / 4))} cm².`, { visual: render(sc, { label: 'cone with a cross-section' }) }); }
      const kk = k % 3, cut = [['parallel to its base', 'circle', 'A slice parallel to the base of a cone is a smaller circle.'],
        ['through its apex, perpendicular to the base', 'triangle', 'The plane meets the base in a diameter and passes through the apex: a triangle.'],
        ['at a slant, crossing only its curved side', 'ellipse', 'A slanted slice that crosses only the curved side of a cone is an ellipse, not a circle.']][kk];
      if (kk === 0) { const f = R.pick([0.3, 0.5]); fill(arcP(v, [0, H * f, 0], r * (1 - f), 0, TAU, 60)); }
      else if (kk === 1) { const ph = R.pick([0.5, 0.7, 2.3, 2.6]); fill([onC(v, O, r, ph), onC(v, O, r, ph + PI), [0, H, 0]]); }
      else { const ph = R.int(0, 359) * DG, m = R.pick([0.25, 0.35]) * H / r * R.pick([1, -1]), y0 = 0.45 * H;
        fill(Array.from({ length: 61 }, (_, i) => { const s = i / 60 * TAU, c = Math.cos(s - ph), y = (y0 + m * r * c) / (1 + m * r * c / H), rho = r * (1 - y / H); return [rho * Math.cos(s), y, rho * Math.sin(s)]; })); }
      cone(sc, O, r, H);
      return E.choice(R, `A plane cuts this cone ${cut[0]}. What shape is the shaded cross-section?`, cut[1], wrong3(R, cut[1], ['circle', 'ellipse', 'rectangle', 'triangle', 'trapezoid'], kk === 2 ? ['circle'] : kk === 1 ? ['trapezoid'] : ['ellipse']), cut[2], { visual: render(sc, { label: 'cone with a cross-section' }) }); } },
    d: { t: 'of a cube at odd angles', g: R => {
      const VF = boxVF(2, 2, 2), VV = VF.V, ED = edgesOf(VF.F), MID = ED.map(([i, j]) => l3(VV[i], VV[j], 0.5)), ALL = [...VV, ...MID], c0 = [0, 1, 0];
      for (;;) {
        const kind = R.pick(['corner', 'diag3', 'hex', 'opp', 'rand', 'rand', 'rand']); let pts;
        if (kind === 'corner' || kind === 'diag3') { const i = R.int(0, 7), nb = ED.filter(e => e.includes(i)); pts = nb.map(e => kind === 'corner' ? l3(VV[e[0]], VV[e[1]], 0.5) : VV[e[0] === i ? e[1] : e[0]]); }
        else if (kind === 'hex') { const n = [R.pick([1, -1]), 1, R.pick([1, -1])], hx = section(VF, n, d3(n, c0)), o = R.int(0, 1); pts = [hx[o], hx[o + 2], hx[(o + 4) % 6]]; }
        else if (kind === 'opp') { const [i, j] = R.pick(ED), p = VV[i], q = VV[j], p2 = s3(m3(c0, 2), R.bool() ? p : q); pts = R.shuffle([p, q, p2]); }
        else pts = R.sample(ALL, 3);
        const n = x3(s3(pts[1], pts[0]), s3(pts[2], pts[0])); if (n3(n) < 1e-6) continue;
        const d = d3(n, pts[0]), f = VV.map(p => d3(n, p) - d); if (f.every(x => x > -1e-9) || f.every(x => x < 1e-9)) continue;
        const sec = section(VF, n, d); if (!sec) continue; const cl = classify(sec); if (!NM[cl] || cl === 'quad') continue;
        const L = K.trio(R), v = view(R), sc = scene(v); poly(sc, VF);
        pts.forEach((p, i) => { sc.dot(p, { color: C.red, r: 4 }); sc.tx(p, L[i], { color: C.red, size: 15, weight: 700 }); });
        if (R.bool(0.3) && ['diag3', 'opp', 'hex'].includes(kind)) { const s = R.int(2, 10), vis = render(sc, { label: 'cube with three marked points' });
          if (kind === 'diag3') return E.num(`${L.join(', ').replace(/, (?=[^,]*$)/, ' and ')} are the three corners next to one corner of a cube with edge ${s} cm. Find the side length of the triangle cut by the plane through them. Give an exact answer.`, [{ label: 'side =', exact: `${s}sqrt(2)` }],
            `Each side is a face diagonal: √(${s}² + ${s}²) = ${s}√2 cm. All three are equal, so the slice is an equilateral triangle.`, { visual: vis });
          if (kind === 'opp') return E.num(`The cube has edge ${s} cm. A plane passes through ${L[0]}, ${L[1]} and ${L[2]}, which lie on two opposite edges. Find the area of the cross-section. Give an exact answer.`, [{ label: 'area =', exact: `${s * s}sqrt(2)` }],
            `The slice is a rectangle: one pair of sides are cube edges (${s}) and the other pair are face diagonals (${s}√2). Area = ${s} × ${s}√2 = ${P(`${s * s}sqrt(2)`)} cm².`, { visual: vis });
          return E.num(`The cube has edge ${s} cm, and ${L[0]}, ${L[1]}, ${L[2]} are midpoints of edges. The plane through them cuts a regular hexagon. Find its perimeter. Give an exact answer.`, [{ label: 'perimeter =', exact: `${3 * s}sqrt(2)` }],
            `Each side joins midpoints of two edges of one face: √((${s}/2)² + (${s}/2)²) = ${P(`${s}sqrt(2)/2`)}. Six sides: ${P(`${3 * s}sqrt(2)`)} cm.`, { visual: vis }); }
        const sd = sides(sec).map(x => fx(x, 2)), nS = sec.length, why = {
          eqtri: 'all three sides are equal', isotri: 'two sides are equal but the third is different', scatri: 'all three sides are different', square: 'all four sides are equal and the corners are right angles',
          rect: 'opposite sides are parallel, the diagonals are equal (right angles), but the sides are not all equal', rhombus: 'all four sides are equal but the diagonals are not, so no right angles',
          para: 'opposite sides are parallel but there are no right angles', trap: 'exactly one pair of sides is parallel', pent: 'it has five sides', hexr: 'all six sides and all its angles are equal', hex: 'its six sides are not all equal' }[cl];
        return E.choice(R, `${L[0]}, ${L[1]} and ${L[2]} are each a corner of the cube or the midpoint of an edge. A plane passes through all three. What shape is the cross-section?`, NM[cl], NEAR[cl].map(x => NM[x]),
          `The plane crosses ${nS} faces, so the slice has ${nS} sides. Taking the edge as 2, the sides are ${sd.join(', ')}: ${why}. So it is a${/^[aeiou]/.test(NM[cl]) ? 'n' : ''} ${NM[cl]}.`, { visual: render(sc, { label: 'cube with three marked points' }) });
      } } },
  });

  /* ================= V.14.02 Solids of revolution ================= */
  S('V.14.02', 'Solids of revolution', {
    a: { t: 'rotate a rectangle', g: R => {
      let w, h; do { w = R.int(2, 9); h = R.int(2, 9); } while (w === h);
      const mid = R.bool(0.25) && w % 2 === 0, rr = mid ? w / 2 : w, askD = R.bool(0.25);
      const vis = flatFig(R, f => { const x0 = mid ? -w / 2 : 0, pts = [[x0, 0], [x0 + w, 0], [x0 + w, h], [x0, h]]; f.fill(pts, { color: C.amber, op: 0.35 }); f.path(pts, { close: true });
        f.text([x0 + w / 2, 0], String(w), { dir: [0, -1] }); f.text([x0 + w, h / 2], String(h), { dir: [1, 0] }); axisLine(f, -0.25 * h, 1.25 * h); }, { label: 'rectangle and axis' });
      const where = mid ? 'the line through the midpoints of its two sides of length ' + w : `its side of length ${h}`;
      return E.num(`This ${w} by ${h} rectangle is spun around ${where} (the dashed axis). It sweeps out a cylinder. Find the cylinder's ${askD ? 'diameter' : 'radius'} and height.`,
        [askD ? { label: 'diameter =', ans: 2 * rr } : { label: 'radius =', ans: rr }, { label: 'height =', ans: h }],
        `The radius is the distance from the axis to the far side: ${rr}${mid ? ` (half of ${w})` : ''}${askD ? `, so the diameter is ${2 * rr}` : ''}. The side along the axis, ${h}, becomes the height.`, { visual: vis }); } },
    b: { t: 'rotate a triangle', g: R => {
      const k = R.int(0, 4);
      if (k <= 2) { const [a, b, c] = triple(R, 26), askL = k === 2;
        const vis = flatFig(R, f => { const pts = [[0, 0], [0, a], [b, 0]]; f.fill(pts, { color: C.amber, op: 0.35 }); f.path(pts, { close: true }); f.rt([0, 0], [1, 0], [0, 1], Math.min(a, b) * 0.12);
          f.text([b / 2, 0], String(b), { dir: [0, -1] }); if (askL) f.text([0, a / 2], String(a), { dir: [-1, 0] }); else f.text([b / 2, a / 2], String(c), { dir: [1, 1] }); axisLine(f, -0.2 * a, 1.25 * a); }, { label: 'right triangle and axis' });
        if (askL) return E.num(`This right triangle is spun around its leg of length ${a}. Find the slant height of the cone it makes.`, [{ label: 'slant height =', ans: c }],
          `The cone has radius ${b} and height ${a}. The slant height is the hypotenuse: √(${b}² + ${a}²) = ${c}.`, { visual: vis });
        return E.num(`This right triangle is spun around the leg on the dashed axis. Find the radius and height of the cone it makes.`, [{ label: 'radius =', ans: b }, { label: 'height =', ans: a }],
          `The leg on the axis becomes the height. The other leg, ${b}, is the distance from the axis, so it is the radius. The leg on the axis is √(${c}² − ${b}²) = ${a}.`, { visual: vis }); }
      const opts = ['a cone', 'two cones joined at their bases', 'a cylinder', 'a sphere'];
      if (k === 3) { const [a, b, c] = triple(R, 20), X = a * b / c, Y = b * b / c;
        const vis = flatFig(R, f => { const pts = [[0, 0], [X, Y], [0, c]]; f.fill(pts, { color: C.amber, op: 0.35 }); f.path(pts, { close: true }); { const n1 = Math.hypot(X, Y), n2 = Math.hypot(X, c - Y); f.rt([X, Y], [-X / n1, -Y / n1], [-X / n2, (c - Y) / n2], c * 0.07); } f.text([X / 2, Y / 2], String(b), { dir: [1, -1] }); f.text([X / 2, (Y + c) / 2], String(a), { dir: [1, 1] }); axisLine(f, -0.15 * c, 1.15 * c); }, { label: 'triangle spun about its longest side' });
        return E.choice(R, `This right triangle is spun around its hypotenuse (the dashed axis). What solid does it make?`, opts[1], [opts[0], opts[2], opts[3]],
          `The right-angle corner sweeps a circle around the axis, and each leg sweeps a cone. The two cones share that circle as their base.`, { visual: vis }); }
      const w = R.int(2, 6), h = R.int(3, 9);
      const vis = flatFig(R, f => { const pts = [[-w, 0], [w, 0], [0, h]]; f.fill(pts, { color: C.amber, op: 0.35 }); f.path(pts, { close: true }); f.text([0, 0], String(2 * w), { dir: [0.5, -1] }); axisLine(f, -0.2 * h, 1.25 * h); }, { label: 'isosceles triangle and its axis' });
      return E.num(`This isosceles triangle, with base ${2 * w} and height ${h}, is spun around its line of symmetry (the dashed axis). Find the radius of the cone it makes.`, [{ label: 'radius =', ans: w }],
        `Each half of the triangle sweeps the same cone. The radius is the distance from the axis to a base corner: half of ${2 * w} = ${w}.`, { visual: vis }); } },
    c: { t: 'rotate a semicircle', g: R => {
      const k = R.int(0, 3), r = R.int(2, 9), opts = ['a sphere', 'a hemisphere', 'a cylinder', 'a cone', 'a torus (a ring doughnut)'];
      if (k === 0) { const useD = R.bool();
        const vis = flatFig(R, f => { const pts = [...arc2([0, 0], r, -90, 90)]; f.fill(pts, { color: C.amber, op: 0.35 }); f.path(pts, { close: true }); f.text([0, useD ? r / 2 : 0], useD ? String(2 * r) : '', { dir: [-1, 0] }); if (!useD) { f.line([0, 0], [r, 0], { dash: true }); f.text([r / 2, 0], String(r), { dir: [0, 1] }); } axisLine(f, -1.25 * r, 1.25 * r); }, { label: 'semicircle and axis' });
        if (R.bool()) return E.choice(R, `This semicircle is spun around its diameter (the dashed axis). What solid does it make?`, opts[0], [opts[1], opts[4], opts[2]], `Every point of the arc stays the same distance from the center, so a full turn makes a whole sphere, not a hemisphere.`, { visual: vis });
        return E.num(`This semicircle is spun around its diameter (the dashed axis). Find the radius of the sphere it makes.`, [{ label: 'radius =', ans: r }], useD ? `The diameter ${2 * r} lies on the axis, so the sphere's radius is ${2 * r} ÷ 2 = ${r}.` : `The arc is ${r} from the center all the way round, so the sphere has radius ${r}.`, { visual: vis }); }
      if (k === 1) { const vis = flatFig(R, f => { const pts = [[0, 0], ...arc2([0, 0], r, 0, 90)]; f.fill(pts, { color: C.amber, op: 0.35 }); f.path(pts, { close: true }); f.text([r / 2, 0], String(r), { dir: [0, -1] }); axisLine(f, -0.25 * r, 1.3 * r); }, { label: 'quarter circle and axis' });
        return E.choice(R, `This quarter circle is spun around one of its straight edges (the dashed axis). What solid does it make?`, opts[1], [opts[0], opts[3], opts[2]], `The quarter circle is half of a semicircle, and a semicircle spun about its diameter makes a sphere. So this makes half a sphere: a hemisphere of radius ${r}.`, { visual: vis }); }
      if (k === 2) { const d = r + R.int(2, 5), rr = R.int(1, Math.min(3, d - 1));
        const vis = flatFig(R, f => { const pts = arc2([d, 0], rr, 0, 360, 60); f.fill(pts, { color: C.amber, op: 0.35 }); f.path(pts); f.dot([d, 0]); f.line([0, 0], [d, 0], { dash: true }); f.text([d / 2, 0], String(d), { dir: [0, 1] }); axisLine(f, -1.4 * rr - 1, 1.4 * rr + 1); }, { label: 'circle away from the axis' });
        return E.choice(R, `A circle of radius ${rr} whose center is ${d} from the dashed axis is spun around the axis. What solid does it make?`, opts[4], [opts[0], opts[2], opts[1]], `The circle never touches the axis, so it sweeps a ring with a hole through the middle: a torus. Its center travels round a circle of radius ${d}.`, { visual: vis }); }
      const vis = flatFig(R, f => { const pts = [...arc2([0, 0], r, -90, 90)]; f.fill(pts, { color: C.amber, op: 0.35 }); f.path(pts, { close: true }); f.text([0, r / 2], String(2 * r), { dir: [-1, 0] }); axisLine(f, -1.25 * r, 1.25 * r); }, { label: 'semicircle and axis' });
      return E.num(`This semicircle has diameter ${2 * r} on the dashed axis. When it is spun around the axis, what is the diameter of the solid it makes?`, [{ label: 'diameter =', ans: 2 * r }], `It makes a sphere. The diameter on the axis stays put, so the sphere's diameter is ${2 * r} (radius ${r}).`, { visual: vis }); } },
    d: { t: 'find the resulting volume', g: R => {
      const k = R.int(0, 4);
      if (k === 0) { let w, h; do { w = R.int(2, 8); h = R.int(2, 9); } while (w === h);
        const vis = flatFig(R, f => { const pts = [[0, 0], [w, 0], [w, h], [0, h]]; f.fill(pts, { color: C.amber, op: 0.35 }); f.path(pts, { close: true }); f.text([w / 2, 0], String(w), { dir: [0, -1] }); f.text([w, h / 2], String(h), { dir: [1, 0] }); axisLine(f, -0.25 * h, 1.25 * h); }, { label: 'rectangle and axis' });
        return E.num(`This rectangle is spun around its side of length ${h}. Find the volume of the solid. Give an exact answer.`, [{ label: 'volume =', exact: piS(w * w * h) }],
          `It is a cylinder with radius ${w} (the distance from the axis) and height ${h}: π(${w})²(${h}) = ${P(piS(w * w * h))}. Not π(${h})²(${w}): the radius is the side away from the axis.`, { visual: vis }); }
      if (k === 1) { const [a, b] = triple(R, 20);
        const vis = flatFig(R, f => { const pts = [[0, 0], [0, a], [b, 0]]; f.fill(pts, { color: C.amber, op: 0.35 }); f.path(pts, { close: true }); f.rt([0, 0], [1, 0], [0, 1], Math.min(a, b) * 0.12); f.text([b / 2, 0], String(b), { dir: [0, -1] }); f.text([0, a / 2], String(a), { dir: [-1, 0] }); axisLine(f, -0.2 * a, 1.25 * a); }, { label: 'right triangle and axis' });
        return E.num(`This right triangle is spun around its leg of length ${a}. Find the volume of the cone. Give an exact answer.`, [{ label: 'volume =', exact: piS(b * b * a, 3) }],
          `Radius ${b}, height ${a}: V = ⅓π(${b})²(${a}) = ${P(piS(b * b * a, 3))}.`, { visual: vis }); }
      if (k === 2) { const r = R.int(1, 9), half = R.bool(0.35);
        const vis = flatFig(R, f => { const pts = half ? [[0, 0], ...arc2([0, 0], r, 0, 90)] : arc2([0, 0], r, -90, 90); f.fill(pts, { color: C.amber, op: 0.35 }); f.path(pts, { close: true }); f.line([0, 0], [r * Math.cos(0.5), r * Math.sin(0.5)], { dash: true }); f.text([r * Math.cos(0.5) / 2, r * Math.sin(0.5) / 2], String(r), { dir: [0.5, -1] }); axisLine(f, half ? -0.25 * r : -1.25 * r, 1.3 * r); }, { label: half ? 'quarter circle and axis' : 'semicircle and axis' });
        return E.num(`This ${half ? 'quarter circle' : 'semicircle'} of radius ${r} is spun around the dashed axis. Find the volume of the solid. Give an exact answer.`, [{ label: 'volume =', exact: half ? piS(2 * r ** 3, 3) : piS(4 * r ** 3, 3) }],
          half ? `It makes a hemisphere: ½ × ⁴⁄₃π(${r})³ = ${P(piS(2 * r ** 3, 3))}.` : `It makes a sphere of radius ${r}: ⁴⁄₃π(${r})³ = ${P(piS(4 * r ** 3, 3))}.`, { visual: vis }); }
      if (k === 3) { const w = R.int(2, 5), h = R.int(2, 6) * 3, r = R.int(2, 6);
        const vis = flatFig(R, f => { const pts = [[0, 0], [0, h], [r, 0]]; f.fill(pts, { color: C.amber, op: 0.35 }); f.path(pts, { close: true }); f.rt([0, 0], [1, 0], [0, 1], Math.min(h, r) * 0.15); f.text([r / 2, 0], String(r), { dir: [0, -1] }); f.text([0, h / 2], String(h), { dir: [-1, 0] }); axisLine(f, -0.2 * h, 1.2 * h); }, { label: 'right triangle and axis' });
        void w; return E.num(`This right triangle is spun around its leg of length ${h}. Find the volume of the solid. Give an exact answer.`, [{ label: 'volume =', exact: piS(r * r * h, 3) }],
          `A cone with radius ${r} and height ${h}: ⅓π(${r})²(${h}) = ${P(piS(r * r * h, 3))}. (It is a third of the cylinder π(${r})²(${h}), not half.)`, { visual: vis }); }
      const g = R.int(1, 4), w = R.int(1, 4), h = R.int(2, 7);
      const vis = flatFig(R, f => { const pts = [[g, 0], [g + w, 0], [g + w, h], [g, h]]; f.fill(pts, { color: C.amber, op: 0.35 }); f.path(pts, { close: true }); f.line([0, h], [g, h], { dash: true });
        f.text([g / 2, h], String(g), { dir: [0, 1] }); f.text([g + w / 2, 0], String(w), { dir: [0, -1] }); f.text([g + w, h / 2], String(h), { dir: [1, 0] }); axisLine(f, -0.25 * h, 1.3 * h); }, { label: 'rectangle away from the axis' });
      return E.num(`This ${w} by ${h} rectangle sits ${g} away from the dashed axis, with its side of length ${h} parallel to it. It is spun around the axis. Find the volume of the solid. Give an exact answer.`, [{ label: 'volume =', exact: piS(((g + w) ** 2 - g * g) * h) }],
        `It makes a cylinder with a hole: outer radius ${g + w}, inner radius ${g}. V = π(${g + w}² − ${g}²)(${h}) = ${P(piS(((g + w) ** 2 - g * g) * h))}.`, { visual: vis }); } },
  });

  /* ================= V.14.03 Cavalieri's principle ================= */
  // two solids side by side with matching slices at one height
  const pairSlice = (R, kind, a, b, H) => { const v = view(R, { az: R.pick([-1, 1]) * R.int(12, 22) }), sc = scene(v), gap = kind === 'cyl' ? 2.6 * a : 1.9 * Math.max(a, b), y = H * R.pick([0.4, 0.55]);
    const A = [-gap / 2, 0, 0], B = [gap / 2, 0, 0], sl = R.int(6, 10) / 10 * (kind === 'cyl' ? a : a) * R.pick([1, -1]);
    if (kind === 'cyl') { sc.fill(arcP(v, a3(A, [0, y, 0]), a, 0, TAU, 60), { op: 0.35 }); sc.fill(arcP(v, a3(B, [sl * y / H, y, 0]), a, 0, TAU, 60), { op: 0.35 }); cyl(sc, A, a, H); oblCyl(sc, B, a, H, sl, 0); }
    else { const VA = prismVF(rectB(a, b).map(p => [p[0] + A[0], p[1]]), H), VB = prismVF(rectB(a, b).map(p => [p[0] + B[0], p[1]]), H, [sl, 0]);
      sc.fill(section(VA, [0, 1, 0], y), { op: 0.35 }); sc.fill(section(VB, [0, 1, 0], y), { op: 0.35 }); poly(sc, VA); poly(sc, VB); }
    sc.tx(a3(A, [0, H, 0]), 'A', { dir: [0, 1], off: kind === 'cyl' ? a * 0 + 18 : 8, weight: 700 }); sc.tx(a3(B, [sl, H, 0]), 'B', { dir: [0, 1], off: kind === 'cyl' ? 18 : 8, weight: 700 });
    return render(sc, { w: 270, h: 170, label: 'two solids with equal slices' }); };
  const oblBox = (R, a, b, h, dx, labs) => { let v, e, d; do { v = view(R, { az: R.pick([1, -1]) * R.int(14, 30) }); e = pj(v, [dx, h, 0]); d = pj(v, [0, 0, 1]); } while (Math.abs(e[0] * d[1] - e[1] * d[0]) < 0.5 * Math.hypot(e[0], e[1]) * Math.hypot(d[0], d[1])); const sc = scene(v), VF = prismVF(rectB(a, b), h, [dx, 0]); poly(sc, VF); const Vt = VF.V;
    const f = frontIdx(v, Vt, [0, 1, 2, 3]), j = [(f + 1) % 4, (f + 3) % 4], ja = j.find(i => Math.abs(Vt[i][0] - Vt[f][0]) > 1e-9), jb = j.find(i => i !== ja);
    sc.tx(l3(Vt[f], Vt[ja], 0.5), labs.a); sc.tx(l3(Vt[f], Vt[jb], 0.5), labs.b);
    // the front lateral edge on the side the top leans toward, with the perpendicular height dropped from its top end: a right triangle (edge, height, shift)
    const ex = [0, 1, 2, 3].filter(i => Math.sign(Vt[i][0]) === Math.sign(dx)), se = frontIdx(v, Vt, ex), sd = Math.sign(dx), top = Vt[se + 4], foot = [top[0], 0, top[2]];
    sc.ln(Vt[se], foot, { dash: true, color: C.red, w: 1.3 }); sc.ln(top, foot, { dash: true, color: C.red }); sc.rt(foot, [0, 1, 0], [-sd, 0, 0], h * 0.07);
    sc.tx(l3(Vt[se], top, 0.5), labs.L, { dir: [-sd, 0.7] }); sc.tx(l3(top, foot, 0.5), labs.h, { dir: [sd, 0], color: C.red });
    return render(sc, { label: 'slanted prism' }); };
  S('V.14.03', "Cavalieri's principle", {
    a: { t: 'equal slices, equal volumes', g: R => {
      const k = R.int(0, 3);
      if (k === 3) { const T = [['Two solids of the same height whose slices at every level have equal areas must have equal volumes.', true, 'This is exactly Cavalieri’s principle.'],
          ['Pushing a neat stack of coins into a slanted stack leaves its volume unchanged.', true, 'Every coin is the same, so every slice keeps its area: same volume.'],
          ['A slanted cylinder has the same volume as an upright cylinder with the same base and the same perpendicular height.', true, 'Their slices are equal circles at every level.'],
          ['A slanted box has the same volume as an upright box with the same base and the same perpendicular height.', true, 'Every horizontal slice is the same rectangle in both.'],
          ['Two solids with equal volumes must have equal slice areas at every level.', false, 'That is the converse, and it fails: a tall thin box and a short wide box can have equal volumes with very different slices.'],
          ['Slanting a stack of paper increases its volume, because its side gets longer.', false, 'The sheets do not change, so every slice keeps its area: the volume stays the same.'],
          ['Two solids with the same base area always have the same volume.', false, 'They also need the same height and equal slices at every level, like a cone and a cylinder on the same base, which differ.'],
          ['The volume of a slanted prism is its base area times the length of its slanted edge.', false, 'Use the perpendicular height, not the slanted edge, which is longer.']];
        const pool = T.filter(t => t[1] === R.bool()), t = R.pick(pool); return E.tf(t[0], t[1], t[2]); }
      if (k === 0) { let r, H; r = R.int(2, 6); H = R.int(3, 10); const vis = pairSlice(R, 'cyl', r, r, H);
        return E.num(`Solid A is an upright cylinder of radius ${r} cm and height ${H} cm. Solid B is a slanted cylinder of the same height, and at every level its slice has the same area as A's. Find B's volume. Give an exact answer.`, [{ label: 'volume =', exact: piS(r * r * H) }],
          `Equal slices at every level and equal heights give equal volumes: B = A = π(${r})²(${H}) = ${P(piS(r * r * H))} cm³.`, { visual: vis }); }
      if (k === 1) { const a = R.int(2, 6), b = R.int(2, 5), H = R.int(3, 9), vis = pairSlice(R, 'box', a, b, H);
        return E.num(`Box A is ${a} cm by ${b} cm by ${H} cm tall. Solid B has the same height, and every horizontal slice of B is a ${a} by ${b} rectangle. Find B's volume.`, [{ label: 'volume =', ans: a * b * H }],
          `Every slice has area ${a} × ${b} = ${a * b} cm² in both, and the heights match, so B = A = ${a * b} × ${H} = ${a * b * H} cm³.`, { visual: vis }); }
      const n = R.int(10, 40), Ar = R.pick([4, 5, 6, 8]), t = R.pick([2, 3, 4]) / 10;
      return E.num(`A stack of ${n} identical coins, each with face area ${Ar} cm² and thickness ${t} cm, is pushed over into a slanted stack. Find the volume of the slanted stack.`, [{ label: 'volume =', ans: +(n * Ar * t).toFixed(3) }],
        `The coins don't change, so every slice keeps its area: V = ${n} × ${Ar} × ${t} = ${num(n * Ar * t)} cm³, the same as the straight stack.`); } },
    b: { t: 'oblique prisms', g: R => {
      let dx, h, L; do { [dx, h, L] = triple(R, 20); } while (dx > h); const lo = Math.max(2, Math.ceil(h / 3)), a = R.int(lo, lo + 5), b = R.int(lo, lo + 3), dir = R.pick([1, -1]), back = R.bool(0.25);
      const vis = oblBox(R, a, b, h, dir * dx, { a: String(a), b: String(b), L: String(L), h: back ? 'h' : String(h) });
      if (back) return E.num(`This slanted box has ${an(a)} ${a} cm by ${b} cm base and volume ${a * b * h} cm³. Its slanted edges are ${L} cm long. Find its perpendicular height h.`, [{ label: 'h =', ans: h }],
        `V = base area × perpendicular height, so h = ${a * b * h} ÷ (${a} × ${b}) = ${h} cm. The ${L} cm edge is a distraction.`, { visual: vis });
      return E.num(`This slanted box has ${an(a)} ${a} cm by ${b} cm base, slanted edges of ${L} cm and perpendicular height ${h} cm. Find its volume.`, [{ label: 'volume =', ans: a * b * h }],
        `By Cavalieri it equals an upright box with the same base and height: ${a} × ${b} × ${h} = ${a * b * h} cm³. Use the perpendicular height ${h}, not the slanted edge ${L}.`, { visual: vis }); } },
    c: { t: 'oblique cylinders', g: R => {
      let r = R.int(2, 7); const k = R.int(0, 2), v = view(R, { az: 0, el: R.int(16, 22) }), sc = scene(v), dir = R.pick([1, -1]);
      let h, L, sh, txt, ex;
      if (k <= 1) { const t = triple(R, 20); sh = t[0]; h = t[1]; L = t[2]; txt = `slanted side ${L} cm and perpendicular height ${h} cm`; ex = `Use the perpendicular height ${h}, not the slanted side ${L}.`; }
      else { L = 2 * R.int(4, 9); h = L / 2; if (r > L / 3) r = R.int(2, Math.floor(L / 3)); sh = L * Math.cos(PI / 6); txt = `a slanted side of ${L} cm that makes a 30° angle with the base`; ex = `The height is the side opposite 30°: h = ${L} sin 30° = ${h}.`; }
      const { t, s0 } = oblCyl(sc, [0, 0, 0], r, h, dir * sh, 0), sL = dir > 0 ? s0 : s0 + PI, e1 = onC(v, [0, 0, 0], r, sL), e2 = onC(v, t, r, sL), foot = [e2[0], 0, e2[2]];
      // the leading side, the perpendicular height from its top end, and the shift along the base: a right triangle
      sc.ln(e1, foot, { dash: true, color: C.red, w: 1.3 }); sc.ln(e2, foot, { dash: true, color: C.red }); sc.rt(foot, [0, 1, 0], [-dir, 0, 0], Math.min(h, sh) * 0.12);
      if (k <= 1) sc.tx(l3(e2, foot, 0.5), String(h), { dir: [dir, 0], color: C.red });
      sc.ln(t, onC(v, t, r, dir > 0 ? PI : 0)); sc.tx(l3(t, onC(v, t, r, dir > 0 ? PI : 0), 0.5), String(r), { dir: [0, 1] });
      sc.tx(l3(e1, e2, 0.5), String(L), { dir: [-dir, 0.7] });
      if (k === 2) sc.tx(e1, '30°', { dir: [dir, 0.35], off: 14, color: C.red, size: 13 });
      const vis = render(sc, { label: 'slanted cylinder' });
      if (k === 1) return E.num(`A slanted cylinder has radius ${r} cm${k <= 1 ? ',' : ' and'} ${txt}. Find its volume to 1 decimal place.`, [{ label: 'volume ≈', ans: PI * r * r * h, dp: 1 }], `V = πr²h = π(${r})²(${h}) ≈ ${fx(PI * r * r * h)} cm³. ${ex}`, { visual: vis });
      return E.num(`A slanted cylinder has radius ${r} cm${k <= 1 ? ',' : ' and'} ${txt}. Find its volume. Give an exact answer.`, [{ label: 'volume =', exact: piS(r * r * h) }], `${ex} V = π(${r})²(${h}) = ${P(piS(r * r * h))} cm³.`, { visual: vis }); } },
    d: { t: 'sphere from a cylinder minus a cone', g: R => {
      const r = R.int(3, 9), y = R.int(1, r - 1), k = R.int(0, 5), v = view(R, { az: 0, el: R.int(16, 22) }), sc = scene(v), A = [-1.35 * r, 0, 0], B = [1.35 * r, 0, 0];
      sc.fill(arcP(v, a3(A, [0, y, 0]), Math.sqrt(r * r - y * y), 0, TAU, 60), { op: 0.4 }); sc.fill(arcP(v, a3(B, [0, y, 0]), r, 0, TAU, 60), { op: 0.4, holes: [arcP(v, a3(B, [0, y, 0]), y, 0, TAU, 60)] });
      hemi(sc, A, r); cyl(sc, B, r, r); cone(sc, a3(B, [0, r, 0]), r, -r, { rim: 'none', color: C.red });
      radius(sc, A, r, String(r)); sc.tx(onC(v, a3(B, [0, r / 2, 0]), r, 0), String(r), { dir: [1, 0] });
      sc.tx(onC(v, a3(A, [0, y, 0]), Math.sqrt(r * r - y * y), PI), `height ${y}`, { dir: [-1, 0], size: 12, color: '#2F6DB0' });
      const vis = render(sc, { w: 280, h: 160, label: 'hemisphere beside a cylinder with a cone removed' }), lead = `A hemisphere and a cylinder both have radius ${r}; the cylinder has height ${r}, and a cone (apex down) is taken out of it.`;
      if (k >= 4) { // the proof itself: equal slices at every height, then Cavalieri
        const CR = "the cone's radius equals its height", rows = [[`${lead} Both stand on one plane.`, 'given'], [`At height y, the hemisphere's slice is a circle of radius √(${r * r} − y²)`, 'Pythagorean theorem'], [`That slice has area π(${r * r} − y²)`, 'area of a circle'],
          [`At height y, the cone's radius is y, so the ring has area π(${r})² − πy² = π(${r * r} − y²)`, CR], ['The hemisphere and the cylinder-minus-cone have equal volumes', "Cavalieri's principle"], [`Hemisphere = π(${r})²(${r}) − ⅓π(${r})²(${r}) = ${P(piS(2 * r ** 3, 3))}`, 'cylinder minus cone']];
        if (k === 4) return K.orderQ(R, `Put the steps in order to find the volume of a hemisphere of radius ${r}.`, rows.map(q => `${q[0]} <i>(${q[1]})</i>`), [[], [0], [1], [0], [2, 3], [4]],
          `Both slices at height y have area π(${r * r} − y²), so Cavalieri's principle gives equal volumes, and cylinder − cone = ⅔π(${r})³ = ${P(piS(2 * r ** 3, 3))}. The ring line can come before or after the two hemisphere lines.`, { fixed: 1, visual: vis });
        const j = R.pick([1, 3, 4]), W = { 1: ["Cavalieri's principle", 'area of a circle', CR], 3: ['Pythagorean theorem', "Cavalieri's principle", 'the cone is a third of the cylinder'], 4: ['Pythagorean theorem', 'equal heights give equal volumes', 'the cone is a third of the cylinder'] }[j];
        return E.choice(R, `This proof finds the volume of a hemisphere of radius ${r}. What is the missing reason?${tbl(rows, j)}`, rows[j][1], W,
          { 1: `The slice's radius, the height y and the hemisphere's radius ${r} form a right triangle, so the slice's radius is √(${r}² − y²).`, 3: `The cone has radius ${r} and height ${r}, so at every level its radius equals its height above the apex.`, 4: "Solids of equal height whose slices have equal areas at every level have equal volumes: Cavalieri's principle." }[j], { visual: vis }); }
      if (k === 0) return E.num(`${lead} Find the area of the hemisphere's slice at height ${y}. Give an exact answer.`, [{ label: 'area =', exact: piS(r * r - y * y) }],
        `The slice is a circle with radius² = ${r}² − ${y}² = ${r * r - y * y} (Pythagoras), so its area is ${P(piS(r * r - y * y))}.`, { visual: vis });
      if (k === 1) return E.num(`${lead} At height ${y}, the slice of the cylinder-minus-cone is a ring. Find its area. Give an exact answer.`, [{ label: 'area =', exact: piS(r * r - y * y) }],
        `The cone's radius at height ${y} is ${y}, so the ring is π(${r})² − π(${y})² = ${P(piS(r * r - y * y))}, the same as the hemisphere's slice.`, { visual: vis });
      if (k === 2) return E.num(`${lead} Their slices match at every height. Use this to find the hemisphere's volume. Give an exact answer.`, [{ label: 'volume =', exact: piS(2 * r ** 3, 3) }],
        `Cylinder − cone = π(${r})²(${r}) − ⅓π(${r})²(${r}) = ⅔π(${r})³ = ${P(piS(2 * r ** 3, 3))}, so the hemisphere has this volume too.`, { visual: vis });
      return E.num(`${lead} Their slices match at every height. Use this to find the volume of a whole sphere of radius ${r}. Give an exact answer.`, [{ label: 'volume =', exact: piS(4 * r ** 3, 3) }],
        `Hemisphere = cylinder − cone = ⅔π(${r})³. Two hemispheres: ⁴⁄₃π(${r})³ = ${P(piS(4 * r ** 3, 3))}.`, { visual: vis }); } },
  });

  /* ================= V.14.04 Surface area of pyramids & cones ================= */
  const coneFig = (R, r, H, labs, o = {}) => { const v = view(R, { az: 0 }), sc = scene(v), O = [0, 0, 0], cn = cone(sc, O, r, H);
    if (labs.h !== undefined) height(sc, O, [0, H, 0], labs.h); if (labs.r !== undefined) radius(sc, O, r, labs.r);
    if (labs.l !== undefined) { const p = onC(v, O, r, cn.s1); sc.ln(cn.ap, p, { color: '#2F6DB0', w: 2.6 }); sc.tx(l3(cn.ap, p, 0.5), labs.l, { dir: [1, 0.35], color: '#2F6DB0' }); }
    return render(sc, { label: o.label || 'cone' }); };
  const pyrFig = (R, n, a, H, labs) => { const v = view(R, { el: R.int(24, 30) }), sc = scene(v), base = n === 4 ? rectB(a, a) : regB(n, a / (2 * Math.sin(PI / n)), R.int(0, 59)), VF = pyrVF(base, H), Vt = poly(sc, VF), ap = Vt[n];
    const mids = base.map((p, i) => l3([p[0], 0, p[1]], [base[(i + 1) % n][0], 0, base[(i + 1) % n][1]], 0.5)), fi = mids.reduce((b, m, i) => pj(v, m)[2] > pj(v, mids[b])[2] ? i : b, 0), m = mids[fi];
    if (labs.l !== undefined) { sc.ln(ap, m, { color: '#2F6DB0', w: 2.4 }); sc.tx(l3(ap, m, 0.55), labs.l, { dir: [pj(v, m)[0] >= 0 ? 1 : -1, 0.2], color: '#2F6DB0' }); }
    if (labs.h !== undefined) { const O = [0, 0, 0]; sc.ln(O, ap, { dash: true }); sc.rt(O, [0, 1, 0], u3(m), H * 0.08); sc.ln(O, m, { dash: true }); sc.tx(l3(O, ap, 0.5), labs.h, { dir: [pj(v, m)[0] >= 0 ? -1 : 1, 0] }); }
    if (labs.a !== undefined) { const i = fi, j = (fi + 1) % n; sc.tx(l3([base[i][0], 0, base[i][1]], [base[j][0], 0, base[j][1]], pj(v, m)[0] >= 0 ? 0.25 : 0.75), labs.a, { dir: [0, -1] }); }
    return render(sc, { label: `${n === 4 ? 'square' : n === 3 ? 'triangular' : 'hexagonal'} pyramid` }); };
  const NB = { 3: 'equilateral triangle', 4: 'square', 6: 'regular hexagon' };
  S('V.14.04', 'Surface area of pyramids & cones', {
    a: { t: 'slant height', g: R => {
      const k = R.int(0, 4);
      if (k === 4) { let r, H; do { r = R.int(1, 7); H = R.int(2, 9); } while (Number.isInteger(Math.sqrt(r * r + H * H)));
        return E.num(`A cone has radius ${r} cm and height ${H} cm. Find its slant height. Give an exact answer.`, [{ label: 'slant height =', exact: sq(r * r + H * H) }],
          `ℓ² = r² + h² = ${r * r} + ${H * H} = ${r * r + H * H}, so ℓ = ${P(sq(r * r + H * H))} cm.`, { visual: coneFig(R, r, H, { r: String(r), h: String(H), l: 'ℓ' }) }); }
      if (k === 3) { let t; do { t = triple(R, 26); } while (t[0] > 13); const half = t[0], H = t[1], l = t[2];
        return E.num(`A square pyramid has base side ${2 * half} cm and height ${H} cm. Find its slant height (from the apex to the middle of a base edge).`, [{ label: 'slant height =', ans: l }],
          `The height, half the base side (${half}) and the slant height make a right triangle: ℓ = √(${half}² + ${H}²) = ${l} cm.`, { visual: pyrFig(R, 4, 2 * half, H, { a: String(2 * half), h: String(H), l: 'ℓ' }) }); }
      const [r, H, l] = triple(R, 26);
      if (k === 0) return E.num(`A cone has radius ${r} cm and height ${H} cm. Find its slant height.`, [{ label: 'slant height =', ans: l }], `ℓ = √(r² + h²) = √(${r * r} + ${H * H}) = ${l} cm.`, { visual: coneFig(R, r, H, { r: String(r), h: String(H), l: 'ℓ' }) });
      if (k === 1) return E.num(`A cone has radius ${r} cm and slant height ${l} cm. Find its height.`, [{ label: 'height =', ans: H }], `h = √(ℓ² − r²) = √(${l * l} − ${r * r}) = ${H} cm.`, { visual: coneFig(R, r, H, { r: String(r), h: 'h', l: String(l) }) });
      return E.num(`A cone has height ${H} cm and slant height ${l} cm. Find its radius.`, [{ label: 'radius =', ans: r }], `r = √(ℓ² − h²) = √(${l * l} − ${H * H}) = ${r} cm.`, { visual: coneFig(R, r, H, { r: 'r', h: String(H), l: String(l) }) }); } },
    b: { t: 'lateral area', g: R => {
      const k = R.int(0, 4);
      if (k >= 3) { // proof of πrℓ from the cone's net
        const [r, H, l] = triple(R, 26), vis = coneFig(R, r, H, { r: String(r), l: String(l) }), f = P(fr(r, l));
        const L = [`A cone with radius ${r} cm and slant height ${l} cm is cut along a slant edge and laid flat: a sector of a circle of radius ${l} (given).`, `The sector's arc wraps once around the base, so it is 2π(${r}) = ${P(piS(2 * r))} long.`,
          `A full circle of radius ${l} has circumference ${P(piS(2 * l))} and area ${P(piS(l * l))}.`, `So the sector is ${P(piS(2 * r))} ÷ ${P(piS(2 * l))} = ${f} of the full circle.`, `Lateral area = that fraction of ${P(piS(l * l))}, which is ${P(piS(r * l))} = πrℓ.`];
        const why = `The arc is the base's circumference, ${P(piS(2 * r))}, so the sector is ${f} of the circle of radius ${l}: ${f} × ${P(piS(l * l))} = ${P(piS(r * l))}, which is π × ${r} × ${l}.`;
        if (k === 3) return K.orderQ(R, "Put the steps in order to show that the cone's lateral area is πrℓ.", L, [[], [], [], [1, 2], [3]], `${why} The arc line and the full-circle line can come in either order.`, { fixed: 1, visual: vis });
        const j = R.pick([3, 4]), ok = j === 3 ? `So the sector is ${f} of the full circle.` : `Lateral area = ${P(piS(r * l))}`;
        const cands = j === 3 ? [fr(l, r), fr(H, l), fr(r, 2 * l), fr(r * r, l * l)].map(x => `So the sector is ${P(x)} of the full circle.`) : [piS(r * H), piS(2 * r * l), piS(r * r), piS(l * l)].map(x => `Lateral area = ${P(x)}`);
        return E.choice(R, `This proof shows that the cone's lateral area is πrℓ. Which statement belongs in line ${j + 1}?${numbered(L.map((x, i) => i === j ? '<b>?</b>' : x))}`, ok, uniq3(ok, cands), why, { visual: vis }); }
      if (k === 2) { let n, a, l; do { n = R.pick([3, 4, 6]); a = R.int(2, 12); l = R.int(3, 15); } while ((n * a * l) % 2 || l * 2 <= a);
        return E.num(`A pyramid has a ${NB[n]} base with side ${a} cm, and slant height ${l} cm. Find its lateral area (the triangles only).`, [{ label: 'lateral area =', ans: n * a * l / 2 }],
          `Lateral area = ½ × perimeter × ℓ = ½ × ${n * a} × ${l} = ${n * a * l / 2} cm². (${n} triangles, each ½ × ${a} × ${l}.)`, { visual: pyrFig(R, n, a, R.int(3, 6), { a: String(a), l: String(l) }) }); }
      const [r, H, l] = triple(R, 26);
      if (k === 0) return E.num(`A cone has radius ${r} cm and slant height ${l} cm. Find its lateral (curved) area. Give an exact answer.`, [{ label: 'lateral area =', exact: piS(r * l) }], `πrℓ = π × ${r} × ${l} = ${P(piS(r * l))} cm².`, { visual: coneFig(R, r, H, { r: String(r), l: String(l) }) });
      return E.num(`A cone has radius ${r} cm and height ${H} cm. Find its lateral (curved) area. Give an exact answer.`, [{ label: 'lateral area =', exact: piS(r * l) }],
        `First the slant height: ℓ = √(${r}² + ${H}²) = ${l}. Then πrℓ = π × ${r} × ${l} = ${P(piS(r * l))} cm², not π × ${r} × ${H}.`, { visual: coneFig(R, r, H, { r: String(r), h: String(H) }) }); } },
    c: { t: 'total area', g: R => {
      const k = R.int(0, 3);
      if (k >= 2) { let t; do { t = triple(R, 26); } while (t[0] > 12); const half = t[0], H = t[1], l = t[2], s = 2 * half, useH = k === 3;
        return E.num(`A square pyramid has base side ${s} cm and ${useH ? `height ${H}` : `slant height ${l}`} cm. Find its total surface area.`, [{ label: 'total area =', ans: s * s + 2 * s * l }],
          `${useH ? `Slant height = √(${half}² + ${H}²) = ${l}. ` : ''}Base ${s}² = ${s * s}, four triangles 4 × ½ × ${s} × ${l} = ${2 * s * l}. Total ${s * s + 2 * s * l} cm².`, { visual: pyrFig(R, 4, s, H, useH ? { a: String(s), h: String(H) } : { a: String(s), l: String(l) }) }); }
      const [r, H, l] = triple(R, 26), useH = k === 1;
      return E.num(`A solid cone has radius ${r} cm and ${useH ? `height ${H}` : `slant height ${l}`} cm. Find its total surface area. Give an exact answer.`, [{ label: 'total area =', exact: piS(r * r + r * l) }],
        `${useH ? `ℓ = √(${r}² + ${H}²) = ${l}. ` : ''}Base πr² = ${P(piS(r * r))}, curved πrℓ = ${P(piS(r * l))}. Total ${P(piS(r * r + r * l))} cm².`, { visual: coneFig(R, r, H, useH ? { r: String(r), h: String(H) } : { r: String(r), l: String(l) }) }); } },
    d: { t: 'from a net', g: R => {
      const k = R.int(0, 3);
      if (k <= 1) { let l, r; do { l = R.int(4, 15); r = R.int(1, l - 1); } while ((360 * r) % l || 360 * r / l > 300 || 360 * r / l < 60); const th = 360 * r / l, sc = scene(FLAT), O = [0, 0, 0], a0 = 270 - th / 2;
        sc.fill([O, ...arc2(O, l, a0, a0 + th)], { color: C.amber, op: 0.3 }); sc.pl([O, ...arc2(O, l, a0, a0 + th), O]); const Cc = [0, -l - r, 0]; sc.fill(arc2(Cc, r, 0, 360, 60), { color: C.amber, op: 0.3 }); sc.pl(arc2(Cc, r, 0, 360, 60));
        const e = arc2(O, l, a0, a0)[0]; sc.tx(l3(O, e, 0.5), String(l), { dir: [Math.cos((a0 + 90) * DG) * -1, Math.sin((a0 + 90) * DG) * -1] }); sc.tx(arc2(O, Math.min(l * 0.3, 3), 270, 270)[0], `${th}°`, { at: true, color: C.red, size: 13 });
        const askR = k === 0; if (!askR) { sc.ln(Cc, a3(Cc, [r, 0, 0]), { dash: true }); sc.tx(a3(Cc, [r / 2, 0, 0]), String(r), { dir: [0, 1], off: 3 }); }
        const vis = render(sc, { w: 200, h: 220, label: 'net of a cone' });
        if (askR) return E.num(`This is the net of a cone: a sector of radius ${l} cm and angle ${th}°, and a circle. Find the radius of the circle (the cone's base).`, [{ label: 'radius =', ans: r }],
          `The sector's arc wraps around the base: (${th}/360) × 2π(${l}) = 2πr, so r = ${th} × ${l} ÷ 360 = ${r} cm.`, { visual: vis });
        return E.num(`This is the net of a cone: a sector of radius ${l} cm and angle ${th}°, and a circle of radius ${r} cm. Find the cone's total surface area. Give an exact answer.`, [{ label: 'total area =', exact: piS(r * r + r * l) }],
          `Sector = (${th}/360)π(${l})² = ${P(piS(r * l))} (that is πrℓ). Circle = π(${r})² = ${P(piS(r * r))}. Total ${P(piS(r * r + r * l))} cm².`, { visual: vis }); }
      let t; do { t = triple(R, 26); } while (t[0] > 10); const half = t[0], l = t[1], e = t[2], s = 2 * half, useE = k === 3, sc = scene(FLAT);
      const sqp = [[-half, -half, 0], [half, -half, 0], [half, half, 0], [-half, half, 0]]; sc.fill(sqp, { color: C.amber, op: 0.3 }); sc.pl(sqp, { close: true });
      [[0, -1], [1, 0], [0, 1], [-1, 0]].forEach(([dx, dy], i) => { const p = sqp[i], q = sqp[(i + 1) % 4], ap = [dx * (half + l), dy * (half + l), 0]; sc.fill([p, q, ap], { color: C.blue, op: 0.18 }); sc.pl([p, ap, q]); });
      sc.tx([0, half, 0], String(s), { dir: [0, -1], off: 4 });
      if (useE) sc.tx(l3([half, -half, 0], [half + l, 0, 0], 0.5), String(e), { dir: [1, -1] }); else { sc.ln([half, 0, 0], [half + l, 0, 0], { dash: true }); sc.tx([half + l / 2, 0, 0], String(l), { dir: [0, 1], off: 3 }); }
      const vis = render(sc, { w: 220, h: 220, label: 'net of a square pyramid' });
      return E.num(`This net folds into a square pyramid. The square has side ${s} cm${useE ? `, and each triangle has two equal sides of ${e} cm` : `, and each triangle has height ${l} cm`}. Find the pyramid's total surface area.`, [{ label: 'total area =', ans: s * s + 2 * s * l }],
        `${useE ? `Each triangle's height is √(${e}² − ${half}²) = ${l}. ` : ''}Square ${s * s} + four triangles 4 × ½ × ${s} × ${l} = ${2 * s * l}: total ${s * s + 2 * s * l} cm².`, { visual: vis }); } },
  });

  /* ================= V.14.05 Surface area of spheres ================= */
  const sphFig = (R, r, lab, o = {}) => { const v = view(R, { az: 0 }), sc = scene(v), O = [0, 0, 0];
    if (o.hemi) hemi(sc, O, r); else sphere(sc, O, r); radius(sc, O, r, lab, { s: o.hemi ? 0.35 : -0.25, dir: o.hemi ? [0.25, -1] : [0, 1] }); return render(sc, { w: 180, h: 170, label: o.hemi ? 'hemisphere' : 'sphere' }); };
  S('V.14.05', 'Surface area of spheres', {
    a: { t: '4πr²', g: R => {
      const k = R.int(0, 2), r = R.int(1, 12);
      if (k === 2) { const rd = R.int(15, 95) / 10, A = 4 * PI * rd * rd;
        return E.num(`A ball has radius ${rd} cm. Find its surface area to 1 decimal place.`, [{ label: 'area ≈', ans: A, dp: 1 }], `S = 4πr² = 4π(${rd})² ≈ ${fx(A)} cm². (Not 4πr³: area is in square units.)`, { visual: sphFig(R, 1, String(rd)) }); }
      const useD = k === 1;
      return E.num(`A sphere has ${useD ? `diameter ${2 * r}` : `radius ${r}`} cm. Find its surface area. Give an exact answer.`, [{ label: 'area =', exact: piS(4 * r * r) }],
        `${useD ? `r = ${2 * r} ÷ 2 = ${r}. ` : ''}S = 4πr² = 4π(${r})² = ${P(piS(4 * r * r))} cm².`, { visual: sphFig(R, 1, useD ? '' : String(r)) }); } },
    b: { t: 'hemispheres', g: R => {
      const r = R.int(1, 12), k = R.int(0, 3), useD = R.bool(0.3), rt = useD ? `diameter ${2 * r}` : `radius ${r}`, pre = useD ? `r = ${r}. ` : '';
      const vis = sphFig(R, 1, useD ? '' : String(r), { hemi: true });
      if (k <= 1) return E.num(`A solid hemisphere has ${rt} cm. Find its total surface area, including the flat face. Give an exact answer.`, [{ label: 'total area =', exact: piS(3 * r * r) }],
        `${pre}Curved half: ½ × 4π(${r})² = ${P(piS(2 * r * r))}. Flat circle: π(${r})² = ${P(piS(r * r))}. Total 3πr² = ${P(piS(3 * r * r))} cm².`, { visual: vis });
      if (k === 2) return E.num(`A dome is a hemisphere with ${rt} m. Find the area of its curved roof (no floor). Give an exact answer.`, [{ label: 'area =', exact: piS(2 * r * r) }],
        `${pre}Half a sphere: ½ × 4π(${r})² = 2π(${r})² = ${P(piS(2 * r * r))} m².`, { visual: vis });
      const rd = R.int(15, 95) / 10, A = 3 * PI * rd * rd;
      return E.num(`A solid hemisphere has radius ${rd} cm. Find its total surface area, including the flat face, to 1 decimal place.`, [{ label: 'total area ≈', ans: A, dp: 1 }], `3πr² = 3π(${rd})² ≈ ${fx(A)} cm².`, { visual: sphFig(R, 1, String(rd), { hemi: true }) }); } },
    c: { t: 'find r from area', g: R => {
      const r = R.int(1, 12), k = R.int(0, 3);
      if (k <= 1) return E.num(`A sphere has surface area ${P(piS(4 * r * r))} cm². Find its ${k ? 'diameter' : 'radius'}.`, [{ label: k ? 'diameter =' : 'radius =', ans: k ? 2 * r : r }],
        `4πr² = ${P(piS(4 * r * r))}, so r² = ${r * r} and r = ${r} cm${k ? `; the diameter is ${2 * r} cm` : ''}.`, { visual: sphFig(R, 1, 'r') });
      if (k === 2) return E.num(`A solid hemisphere has total surface area ${P(piS(3 * r * r))} cm², including its flat face. Find its radius.`, [{ label: 'radius =', ans: r }],
        `Curved 2πr² + flat πr² = 3πr² = ${P(piS(3 * r * r))}, so r² = ${r * r} and r = ${r} cm.`, { visual: sphFig(R, 1, 'r', { hemi: true }) });
      const A = R.int(20, 200) * 5, rr = Math.sqrt(A / (4 * PI));
      return E.num(`A sphere has surface area ${A} cm². Find its radius to 1 decimal place.`, [{ label: 'radius ≈', ans: rr, dp: 1 }], `r² = ${A} ÷ 4π ≈ ${fx(rr * rr, 2)}, so r ≈ ${fx(rr)} cm.`, { visual: sphFig(R, 1, 'r') }); } },
    d: { t: "Archimedes' cylinder link", g: R => {
      const r = R.int(1, 10), k = R.int(0, 3), v = view(R, { az: 0 }), sc = scene(v), O = [0, 0, 0];
      cyl(sc, O, r, 2 * r); sphere(sc, [0, r, 0], r, { color: '#2F6DB0' }); radius(sc, [0, r, 0], r, String(r), { dir: [0.2, 1] });
      const vis = render(sc, { w: 170, h: 200, label: 'sphere inside a cylinder' }), lead = `A sphere of radius ${r} fits exactly inside a cylinder (radius ${r}, height ${2 * r}).`;
      if (k === 0) return E.num(`${lead} Find the curved area of the cylinder. Give an exact answer.`, [{ label: 'curved area =', exact: piS(4 * r * r) }],
        `2πr × h = 2π(${r}) × ${2 * r} = ${P(piS(4 * r * r))}: exactly the sphere's area 4πr². Archimedes found this.`, { visual: vis });
      if (k === 1) return E.num(`${lead} What fraction of the cylinder's total surface area (with its two ends) is the sphere's area?`, [{ label: 'fraction =', frac: [2, 3] }],
        `Sphere 4π(${r})² = ${P(piS(4 * r * r))}; cylinder 4πr² + 2πr² = ${P(piS(6 * r * r))}. ${P(piS(4 * r * r))} ÷ ${P(piS(6 * r * r))} = 2/3, for any r.`, { visual: vis });
      if (k === 2) return E.num(`${lead} The sphere's surface area is ${P(piS(4 * r * r))}. Find the cylinder's total surface area, with both ends. Give an exact answer.`, [{ label: 'total area =', exact: piS(6 * r * r) }],
        `Curved part = sphere's area = ${P(piS(4 * r * r))}; two ends 2π(${r})² = ${P(piS(2 * r * r))}. Total ${P(piS(6 * r * r))}.`, { visual: vis });
      return E.num(`${lead} What fraction of the cylinder's volume does the sphere fill?`, [{ label: 'fraction =', frac: [2, 3] }],
        `Sphere ⁴⁄₃π(${r})³ = ${P(piS(4 * r ** 3, 3))}; cylinder π(${r})²(${2 * r}) = ${P(piS(2 * r ** 3))}. The ratio is 2/3, like the areas.`, { visual: vis }); } },
  });

  /* ================= V.14.06 Volume of pyramids & cones ================= */
  const frusFig = (R, Rb, rt, H, labs) => { const v = view(R, { az: 0 }), sc = scene(v), O = [0, 0, 0], T = [0, H, 0]; frus(sc, O, Rb, rt, H);
    radius(sc, O, Rb, labs.R); radius(sc, T, rt, labs.r, { solid: true, dir: [0.2, 1] }); height(sc, O, T, labs.h); return render(sc, { label: 'frustum of a cone' }); };
  const cubeOf = s => boxVF(s, s, s);
  S('V.14.06', 'Volume of pyramids & cones', {
    a: { t: 'one third of the prism', g: R => {
      if (R.bool(0.35)) { // proof: six pyramids from the center fill a cube, and each is ⅓ × base × height
        const s = 2 * R.int(1, 5), vol = P(fr(s ** 3, 6)), v2 = view(R), s2 = scene(v2), VF = cubeOf(s), Vt = VF.V, c0 = [0, s / 2, 0];
        poly(s2, VF, { color: C.muted, w: 1.4 }); [0, 1, 2, 3].forEach(i => s2.ln(c0, Vt[i], { color: '#2F6DB0', w: 2.2, dash: pj(v2, Vt[i])[2] < pj(v2, c0)[2] - 1e-9 })); s2.dot(c0, { r: 3 });
        const pvis = render(s2, { label: 'pyramid from the center of a cube' });
        const L = [`Segments from the center of a cube of edge ${s} to its 8 corners split it into 6 identical square pyramids, one on each face (given).`, `Each pyramid has base area ${s}² = ${s * s} and height ${s / 2}, half the edge.`,
          `Each pyramid has volume ${s ** 3} ÷ 6 = ${vol}, a sixth of the cube.`, `⅓ × ${s * s} × ${s / 2} = ${vol}`, "So each pyramid's volume is ⅓ × base area × height."];
        if (R.bool()) return K.orderQ(R, 'Put the steps in order to show that a pyramid is one third of base area × height.', L, [[], [], [0], [1], [2, 3]],
          `The 6 pyramids share the cube's ${s ** 3} equally, so each is ${vol}; and ⅓ × ${s * s} × ${s / 2} is also ${vol}. The base-and-height line and the sixth-of-the-cube line can come in either order.`, { fixed: 1, visual: pvis });
        const ok = 'V = ⅓ × base area × height';
        return E.choice(R, `Which conclusion do these lines prove?${numbered(L.slice(0, 4))}`, ok, ['V = ⅙ × base area × height', 'V = ½ × base area × height', 'V = base area × height'],
          `Each pyramid is a sixth of the cube, but its own height is only half the edge: ${vol} = ⅓ × ${s * s} × ${s / 2}. So the pyramid is one third of the prism on the same base with the same height, not one sixth.`, { visual: pvis }); }
      const k = R.int(0, 3), H = R.int(3, 9), r = R.int(2, Math.min(6, H - 1)), v = view(R, { az: 0 }), sc = scene(v), O = [0, 0, 0];
      if (k <= 1) { cyl(sc, O, r, H, { color: C.muted }); cone(sc, O, r, H, { color: '#2F6DB0', rim: 'none' }); }
      const vis = k <= 1 ? render(sc, { w: 170, h: 180, label: 'cone inside a cylinder' }) : '';
      if (k === 0) { const V3 = 3 * R.int(4, 40), toCone = R.bool();
        return E.num(toCone ? `A cylinder and a cone have the same base and the same height. The cylinder holds ${V3} cm³. How much does the cone hold?` : `A cone and a cylinder have the same base and the same height. The cone holds ${V3 / 3} cm³. How much does the cylinder hold?`,
          [{ label: 'volume =', ans: toCone ? V3 / 3 : V3 }], toCone ? `A cone is one third of its cylinder: ${V3} ÷ 3 = ${V3 / 3} cm³ (not half).` : `The cylinder is three times the cone: 3 × ${V3 / 3} = ${V3} cm³.`, { visual: vis }); }
      if (k === 1) return E.num(`A cone and a cylinder have the same radius (${r} cm) and the same height (${H} cm). How many cones full of water does it take to fill the cylinder?`, [{ label: 'cones =', ans: 3 }],
        `V(cone) = ⅓πr²h and V(cylinder) = πr²h, so it takes 3 cones, not 2.`, { visual: vis });
      const B = R.int(4, 30), h = 3 * R.int(1, 6), toP = R.bool(), sb = toP ? Math.sqrt(B) : 4, hb = toP ? h : R.int(3, 7), VF = boxVF(sb, hb, sb), vv = scene(view(R));
      poly(vv, VF, { color: C.muted }); poly(vv, pyrVF(rectB(sb, sb), hb), { color: '#2F6DB0' }); const pvis = render(vv, { w: 170, h: 180, label: 'pyramid inside a prism' });
      return E.num(toP ? `A prism and a pyramid have the same base (area ${B} cm²) and the same height (${h} cm). Find the volume of the pyramid.` : `A pyramid of volume ${B * h / 3} cm³ sits inside a prism with the same base and height. Find the volume of the prism.`,
        [{ label: 'volume =', ans: toP ? B * h / 3 : B * h }], toP ? `Prism = ${B} × ${h} = ${B * h}; the pyramid is a third of it: ${B * h / 3} cm³.` : `The prism is 3 times the pyramid: 3 × ${B * h / 3} = ${B * h} cm³.`, { visual: pvis }); } },
    b: { t: 'apply', g: R => {
      const k = R.int(0, 3);
      if (k === 0) { let s, h; do { s = R.int(2, 12); h = R.int(2, 15); } while ((s * s * h) % 3);
        return E.num(`A square pyramid has base side ${s} cm and height ${h} cm. Find its volume.`, [{ label: 'volume =', ans: s * s * h / 3 }], `V = ⅓Bh = ⅓ × ${s}² × ${h} = ${s * s * h / 3} cm³.`, { visual: pyrFig(R, 4, s, h, { a: String(s), h: String(h) }) }); }
      if (k === 1) { let a, b, h; do { a = R.int(2, 10); b = R.int(2, 10); h = R.int(2, 12); } while ((a * b * h) % 3 || a === b);
        const v = view(R), sc = scene(v), VF = pyrVF(rectB(a, b), h); poly(sc, VF); boxLabs(sc, [...VF.V.slice(0, 4), ...VF.V.slice(0, 4)], String(a), String(b)); sc.ln([0, 0, 0], [0, h, 0], { dash: true }); sc.tx([0, h / 2, 0], String(h), { dir: [1, 0], off: 3 });
        return E.num(`A pyramid has ${an(a)} ${a} cm by ${b} cm rectangular base and height ${h} cm. Find its volume.`, [{ label: 'volume =', ans: a * b * h / 3 }], `V = ⅓ × (${a} × ${b}) × ${h} = ${a * b * h / 3} cm³.`, { visual: render(sc, { label: 'rectangular pyramid' }) }); }
      const r = R.int(1, 9), h = R.int(2, 15);
      if (k === 2) return E.num(`A cone has radius ${r} cm and height ${h} cm. Find its volume. Give an exact answer.`, [{ label: 'volume =', exact: piS(r * r * h, 3) }], `V = ⅓πr²h = ⅓π(${r})²(${h}) = ${P(piS(r * r * h, 3))} cm³.`, { visual: coneFig(R, r, h, { r: String(r), h: String(h) }) });
      const d = 2 * r;
      return E.num(`A cone has diameter ${d} cm and height ${h} cm. Find its volume to 1 decimal place.`, [{ label: 'volume ≈', ans: PI * r * r * h / 3, dp: 1 }], `r = ${r}. V = ⅓π(${r})²(${h}) ≈ ${fx(PI * r * r * h / 3)} cm³.`, { visual: coneFig(R, r, h, { h: String(h) }) }); } },
    c: { t: 'find a missing height', g: R => {
      const k = R.int(0, 2);
      if (k === 0) { const r = R.int(1, 8), h = R.int(2, 15);
        return E.num(`A cone has radius ${r} cm and volume ${P(piS(r * r * h, 3))} cm³. Find its height.`, [{ label: 'height =', ans: h }], `⅓π(${r})²h = ${P(piS(r * r * h, 3))}, so ${P(piS(r * r, 3))}·h = ${P(piS(r * r * h, 3))} and h = ${h} cm.`, { visual: coneFig(R, r, h, { r: String(r), h: 'h' }) }); }
      if (k === 1) { let s, h; do { s = R.int(2, 12); h = R.int(2, 15); } while ((s * s * h) % 3);
        return E.num(`A square pyramid has base side ${s} cm and volume ${s * s * h / 3} cm³. Find its height.`, [{ label: 'height =', ans: h }], `h = 3V ÷ B = 3 × ${s * s * h / 3} ÷ ${s * s} = ${h} cm.`, { visual: pyrFig(R, 4, s, h, { a: String(s), h: 'h' }) }); }
      const r = R.int(1, 8), h = 3 * R.int(1, 5);
      return E.num(`A cone has height ${h} cm and volume ${P(piS(r * r * h, 3))} cm³. Find its radius.`, [{ label: 'radius =', ans: r }], `⅓πr²(${h}) = ${P(piS(r * r * h, 3))}, so r² = ${r * r} and r = ${r} cm.`, { visual: coneFig(R, r, h, { r: 'r', h: String(h) }) }); } },
    d: { t: 'frustums', g: R => {
      const k = R.int(0, 2);
      if (k <= 1) { let Rb, rt, H; do { Rb = R.int(3, 10); rt = R.int(1, Rb - 1); H = R.int(2, 12); } while (Rb - rt < 2);
        const Vn = H * (Rb * Rb + Rb * rt + rt * rt);
        if (k === 1) { const Hb = H * Rb / (Rb - rt); if (!Number.isInteger(Hb)) return E.num(`A frustum of a cone has base radius ${Rb} cm, top radius ${rt} cm and height ${H} cm. Find its volume. Give an exact answer.`, [{ label: 'volume =', exact: piS(Vn, 3) }],
            `V = ⅓πh(R² + Rr + r²) = ⅓π(${H})(${Rb * Rb} + ${Rb * rt} + ${rt * rt}) = ${P(piS(Vn, 3))} cm³.`, { visual: frusFig(R, Rb, rt, H, { R: String(Rb), r: String(rt), h: String(H) }) });
          return E.num(`A cone of radius ${Rb} cm and height ${Hb} cm has its top cut off, ${H} cm above the base, leaving a frustum with top radius ${rt} cm. Find the frustum's volume. Give an exact answer.`, [{ label: 'volume =', exact: piS(Vn, 3) }],
            `Big cone ⅓π(${Rb})²(${Hb}) minus small cone ⅓π(${rt})²(${Hb - H}) = ${P(piS(Rb * Rb * Hb - rt * rt * (Hb - H), 3))} cm³.`, { visual: frusFig(R, Rb, rt, H, { R: String(Rb), r: String(rt), h: String(H) }) }); }
        return E.num(`A frustum of a cone has base radius ${Rb} cm, top radius ${rt} cm and height ${H} cm. Find its volume. Give an exact answer.`, [{ label: 'volume =', exact: piS(Vn, 3) }],
          `V = ⅓πh(R² + Rr + r²) = ⅓π(${H})(${Rb * Rb} + ${Rb * rt} + ${rt * rt}) = ${P(piS(Vn, 3))} cm³.`, { visual: frusFig(R, Rb, rt, H, { R: String(Rb), r: String(rt), h: String(H) }) }); }
      let a, b, h; do { a = R.int(3, 12); b = R.int(1, a - 1); h = R.int(2, 12); } while ((h * (a * a + a * b + b * b)) % 3 || a - b < 2);
      const v = view(R), sc = scene(v), VF = frusVF(rectB(a, a), h, b / a); poly(sc, VF); boxLabs(sc, VF.V, String(a), String(a)); sc.tx(l3(VF.V[4], VF.V[5], 0.5), String(b), { dir: [0, 1] });
      sc.ln([0, 0, 0], [0, h, 0], { dash: true }); sc.tx([0, h / 2, 0], String(h), { dir: [1, 0], off: 3 });
      const Vv = h * (a * a + a * b + b * b) / 3;
      return E.num(`A square frustum has ${an(a)} ${a} cm square base, ${an(b)} ${b} cm square top and height ${h} cm. Find its volume.`, [{ label: 'volume =', ans: Vv }],
        `V = ⅓h(A₁ + √(A₁A₂) + A₂) = ⅓ × ${h} × (${a * a} + ${a * b} + ${b * b}) = ${Vv} cm³.`, { visual: render(sc, { label: 'square frustum' }) }); } },
    e: { t: 'scale the height, cube the volume', g: R => {
      const k = R.int(0, 2), t = R.pick([[1, 2], [1, 3], [2, 3], [3, 4], [1, 4], [2, 5], [3, 5]]), v = view(R, { az: 0 }), sc = scene(v), r = 3, H = 6, O = [0, H, 0];
      const wy = H * t[0] / t[1]; sc.fill(arcP(v, [0, wy, 0], r * t[0] / t[1], 0, TAU, 60), { op: 0.45 });
      const wl = r * t[0] / t[1]; sc.fill([[0, 0, 0], onC(v, [0, wy, 0], wl, 0), ...arcP(v, [0, wy, 0], wl, 0, PI), onC(v, [0, wy, 0], wl, PI)], { op: 0.25 });
      cone(sc, O, r, -H); const vis = render(sc, { w: 170, h: 180, label: 'cone glass partly filled' });
      if (k === 0) return E.num(`A cone-shaped glass (point down) is filled with water to ${t[0]}/${t[1]} of its height. What fraction of the glass is full?`, [{ label: 'fraction =', frac: [t[0] ** 3, t[1] ** 3] }],
        `The water is a smaller cone, similar with scale ${t[0]}/${t[1]}. Volumes scale by the cube: (${t[0]}/${t[1]})³ = ${t[0] ** 3}/${t[1] ** 3}, not ${t[0]}/${t[1]}.`, { visual: vis });
      if (k === 1) { const w = R.int(1, 6), tot = w * t[1] ** 3, wat = w * t[0] ** 3;
        return E.num(`A cone-shaped glass (point down) is filled to ${t[0]}/${t[1]} of its height and holds ${P(piS(wat))} cm³ of water. Find the volume of the whole glass. Give an exact answer.`, [{ label: 'volume =', exact: piS(tot) }],
          `The water cone is the glass scaled by ${t[0]}/${t[1]}, so its volume is (${t[0]}/${t[1]})³ = ${t[0] ** 3}/${t[1] ** 3} of the glass: ${P(piS(wat))} × ${t[1] ** 3}/${t[0] ** 3} = ${P(piS(tot))} cm³.`, { visual: vis }); }
      const q = R.pick([2, 3, 4]), s2 = scene(view(R, { az: 0 })), yc = H * (1 - 1 / q);
      secStyle(s2)(arcP(s2.v, [0, yc, 0], r / q, 0, TAU, 60)); cone(s2, [0, 0, 0], r, H);
      return E.num(`A cone is cut by a plane parallel to its base, 1/${q} of the way down from the apex, into a small cone and a frustum. Find the small cone's volume divided by the frustum's volume.`, [{ label: 'ratio =', frac: [1, q ** 3 - 1] }],
        `The small cone is (1/${q})³ = 1/${q ** 3} of the whole, so the frustum is ${q ** 3 - 1}/${q ** 3}. Small ÷ frustum = 1/${q ** 3 - 1}.`, { visual: render(s2, { w: 170, h: 180, label: 'cone cut parallel to its base' }) }); } },
    f: { t: 'pyramids hiding in a cube', g: R => {
      const k = R.int(0, 4), s = R.int(1, 6) * (k === 2 ? 2 : 1), v = view(R), sc = scene(v), VF = cubeOf(s), cube = s ** 3;
      poly(sc, VF, { color: C.muted, w: 1.4 }); const Vt = VF.V, c = [0, s / 2, 0];
      const field = (n, d) => qField(n, d, 'volume =');
      if (k === 0) { const T = [0, 2, 5, 7].map(i => Vt[i]); poly(sc, { V: T, F: [[0, 1, 2], [0, 1, 3], [0, 2, 3], [1, 2, 3]] }, { color: '#2F6DB0', w: 2.4 });
        return E.num(`Four corners of a cube of edge ${s}, no two on the same edge, are joined to make a regular tetrahedron. Find its volume.`, [field(cube, 3)],
          `Cutting it out leaves 4 corner pyramids, each ⅓ × (½ × ${s} × ${s}) × ${s} = ${P(fr(cube, 6))}. Tetrahedron = ${cube} − 4 × ${P(fr(cube, 6))} = ${P(fr(cube, 3))}.`, { visual: render(sc, { label: 'tetrahedron inside a cube' }) }); }
      if (k === 1) { const fc = [[s / 2, s / 2, 0], [-s / 2, s / 2, 0], [0, s, 0], [0, 0, 0], [0, s / 2, s / 2], [0, s / 2, -s / 2]];
        poly(sc, { V: fc, F: [[0, 2, 4], [0, 4, 3], [0, 3, 5], [0, 5, 2], [1, 2, 4], [1, 4, 3], [1, 3, 5], [1, 5, 2]] }, { color: '#2F6DB0', w: 2.2 });
        return E.num(`The centers of the six faces of a cube of edge ${s} are the corners of an octahedron. Find its volume.`, [field(cube, 6)],
          `It is two square pyramids. The middle square joins four face centers: its diagonals are ${s}, so its area is ${P(fr(s * s, 2))}. Each pyramid has height ${P(fr(s, 2))}: 2 × ⅓ × ${P(fr(s * s, 2))} × ${P(fr(s, 2))} = ${P(fr(cube, 6))}.`, { visual: render(sc, { label: 'octahedron inside a cube' }) }); }
      if (k === 2) { const ED = edgesOf(VF.F), mids = ED.map(([i, j]) => l3(Vt[i], Vt[j], 0.5)); [0, 1, 2, 3, 4, 5, 6, 7].forEach(i => { const m = ED.map((e, ix) => e.includes(i) ? mids[ix] : null).filter(Boolean);
          m.forEach((p, q) => { const p2 = m[(q + 1) % 3], c = l3(p, p2, 0.5), nrm = [Math.abs(Math.abs(c[0]) - s / 2) < 1e-9 ? Math.sign(c[0]) : 0, Math.abs(c[1]) < 1e-9 ? -1 : Math.abs(c[1] - s) < 1e-9 ? 1 : 0, Math.abs(Math.abs(c[2]) - s / 2) < 1e-9 ? Math.sign(c[2]) : 0];
            sc.ln(p, p2, { color: C.red, w: 1.6, dash: pj(v, nrm)[2] <= 0 }); }); });
        return E.num(`Each corner of a cube of edge ${s} is sliced off through the midpoints of the three edges that meet there. Find the volume of what is left.`, [field(5 * cube, 6)],
          `Each corner piece is a pyramid ⅓ × (½ × ${s / 2} × ${s / 2}) × ${s / 2} = ${P(fr(cube, 48))}. Eight of them: ${P(fr(cube, 6))}. Left: ${cube} − ${P(fr(cube, 6))} = ${P(fr(5 * cube, 6))}.`, { visual: render(sc, { label: 'cube with its corners sliced off' }) }); }
      if (k === 3) { const ap = Vt[4]; [0, 1, 2, 3].forEach(i => { if (i !== 0) sc.ln(ap, Vt[i], { color: '#2F6DB0', w: 2.2 }); });
        return E.num(`A pyramid has its apex at one corner of a cube of edge ${s} and its base on the bottom face of the cube, which does not touch that corner. Find its volume.`, [field(cube, 3)],
          `Base ${s}², height ${s}: ⅓ × ${s * s} × ${s} = ${P(fr(cube, 3))}. In fact three such pyramids fit together to make the cube, which is why a pyramid is ⅓Bh.`, { visual: render(sc, { label: 'pyramid inside a cube' }) }); }
      [0, 1, 2, 3].forEach(i => sc.ln(c, Vt[i], { color: '#2F6DB0', w: 2.2, dash: pj(v, Vt[i])[2] < pj(v, c)[2] - 1e-9 })); sc.dot(c, { r: 3 });
      return E.num(`Lines are drawn from the center of a cube of edge ${s} to the four corners of its bottom face, making a pyramid. Find the pyramid's volume.`, [field(cube, 6)],
        `The cube splits into 6 such pyramids, one per face, so each is ${cube} ÷ 6 = ${P(fr(cube, 6))}. (Check: ⅓ × ${s * s} × ${P(fr(s, 2))}.)`, { visual: render(sc, { label: 'pyramid from the center of a cube' }) }); } },
  });

  /* ================= V.14.07 Composite solids ================= */
  // the standard composites, drawn: 'rocket' cylinder+cone, 'silo' cylinder+dome, 'icecream' cone+dome, 'house' box+pyramid
  const compFig = (R, kind, d, labs = {}) => { const v = view(R, ['house', 'cubes', 'cubehole', 'bowl'].includes(kind) ? {} : { az: 0 }), sc = scene(v), O = [0, 0, 0];
    if (kind === 'rocket') { const t = cyl(sc, O, d.r, d.h1, { top: 'half' }); cone(sc, t, d.r, d.h2, { rim: 'none' }); radius(sc, O, d.r, labs.r); sc.tx(onC(v, [0, d.h1 / 2, 0], d.r, PI), labs.h1, { dir: [-1, 0] }); if (labs.h2) { sc.ln(t, [0, d.h1 + d.h2, 0], { dash: true }); sc.tx([0, d.h1 + d.h2 * 0.45, 0], labs.h2, { dir: [-1, 0], off: 4 }); } if (labs.l) sc.tx(l3([0, d.h1 + d.h2, 0], onC(v, t, d.r, 0), 0.5), labs.l, { dir: [1, 0.4] }); }
    else if (kind === 'silo') { const t = cyl(sc, O, d.r, d.h, { top: 'half' }); hemi(sc, t, d.r, { rim: 'none' }); radius(sc, O, d.r, labs.r); sc.tx(onC(v, [0, d.h / 2, 0], d.r, PI), labs.h, { dir: [-1, 0] }); }
    else if (kind === 'capsule') { const t = cyl(sc, O, d.r, d.h, { top: 'half', bottom: 'half' }); hemi(sc, t, d.r, { rim: 'none' }); sc.pl(outline(v, O, d.r, 180, 360)); radius(sc, t, d.r, labs.r, { dir: [0.3, -1] }); sc.tx(onC(v, [0, d.h / 2, 0], d.r, PI), labs.h, { dir: [-1, 0] }); }
    else if (kind === 'icecream') { const top = [0, d.h, 0]; cone(sc, top, d.r, -d.h, { rim: 'half' }); hemi(sc, top, d.r, { rim: 'none' }); radius(sc, top, d.r, labs.r, { dir: [0.3, -1] }); sc.ln(top, O, { dash: true }); sc.tx([0, d.h / 2, 0], labs.h, { dir: [-1, 0], off: 4 }); }
    else if (kind === 'house') { const VF = boxVF(d.s, d.h1, d.s); poly(sc, { V: VF.V, F: VF.F.filter((f, i) => i !== 1) }); const Pv = pyrVF(rectB(d.s, d.s).map(p => p), d.h2), PV = Pv.V.map(p => a3(p, [0, d.h1, 0])); poly(sc, { V: PV, F: Pv.F.slice(1) }); boxLabs(sc, VF.V, labs.s, labs.s, labs.h1); if (labs.h2) { sc.ln([0, d.h1, 0], [0, d.h1 + d.h2, 0], { dash: true }); sc.tx([0, d.h1 + d.h2 / 2, 0], labs.h2, { dir: [1, 0], off: 3 }); } }
    else if (kind === 'cubes') { const A = boxVF(d.a, d.a, d.a), B = boxVF(d.b, d.b, d.b); poly(sc, A); poly(sc, { V: B.V.map(p => a3(p, [0, d.a, 0])), F: B.F.filter((f, i) => i !== 0) }); boxLabs(sc, A.V, String(d.a), '', ''); const BB = B.V.map(p => a3(p, [0, d.a, 0])); boxLabs(sc, BB, String(d.b), '', ''); }
    else if (kind === 'cubehole') { const VF = boxVF(d.s, d.s, d.s); poly(sc, VF); const t = [0, d.s, 0]; ring(sc, t, d.r, 'full'); sc.ln(onC(v, t, d.r, 0), onC(v, O, d.r, 0), { dash: true }); sc.ln(onC(v, t, d.r, PI), onC(v, O, d.r, PI), { dash: true }); sc.pl(arcP(v, O, d.r, 0, TAU, 60), { dash: true }); boxLabs(sc, VF.V, String(d.s), '', ''); radius(sc, t, d.r, labs.r, { solid: true, dir: [0.2, 1] }); }
    else if (kind === 'cylcone') { const t = cyl(sc, O, d.r, d.h); cone(sc, t, d.r, -d.h, { rim: 'none', color: C.red }); radius(sc, t, d.r, labs.r, { solid: true, dir: [0.2, 1] }); sc.tx(onC(v, [0, d.h / 2, 0], d.r, PI), labs.h, { dir: [-1, 0] }); }
    else if (kind === 'bowl') { const VF = boxVF(d.s, d.s, d.s); poly(sc, VF); const t = [0, d.s, 0]; ring(sc, t, d.r, 'full'); sc.pl(outline(v, t, d.r, 180, 360), { dash: true, color: C.red }); boxLabs(sc, VF.V, String(d.s), '', ''); radius(sc, t, d.r, labs.r, { solid: true, dir: [0.2, 1] }); }
    else if (kind === 'pipe') { const t = cyl(sc, O, d.R, d.h); ring(sc, t, d.r, 'full'); sc.ln(t, onC(v, t, d.R, -0.4)); sc.tx(l3(t, onC(v, t, d.R, -0.4), 0.75), labs.R, { dir: [0.3, 1] }); sc.ln(t, onC(v, t, d.r, 2.6)); sc.tx(l3(t, onC(v, t, d.r, 2.6), 0.5), labs.r, { dir: [0, 1] }); sc.tx(onC(v, [0, d.h / 2, 0], d.R, PI), labs.h, { dir: [-1, 0] }); }
    return render(sc, { w: 200, h: 200, label: kind === 'rocket' ? 'cone on a cylinder' : kind === 'silo' ? 'hemisphere on a cylinder' : kind === 'icecream' ? 'hemisphere on a cone' : kind === 'house' ? 'pyramid on a box' : kind === 'capsule' ? 'capsule' : kind === 'cubes' ? 'cube on a cube' : kind === 'pipe' ? 'hollow pipe' : 'solid with a hole' }); };
  const CELL = (x, y, z) => x + ',' + y + ',' + z;
  const voxArea = cells => { let n = 0; cells.forEach(s => { const [x, y, z] = s.split(',').map(Number); [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]].forEach(d => { if (!cells.has(CELL(x + d[0], y + d[1], z + d[2]))) n++; }); }); return n; };
  S('V.14.07', 'Composite solids', {
    a: { t: 'add parts', g: R => {
      const k = R.int(0, 3);
      if (k === 0) { const r = R.int(1, 6), h1 = R.int(3, 12), h2 = R.int(2, 9);
        return E.num(`A cone of height ${h2} sits on a cylinder of height ${h1}. Both have radius ${r} cm. Find the total volume. Give an exact answer.`, [{ label: 'volume =', exact: piS(3 * r * r * h1 + r * r * h2, 3) }],
          `Cylinder π(${r})²(${h1}) = ${P(piS(r * r * h1))}, cone ⅓π(${r})²(${h2}) = ${P(piS(r * r * h2, 3))}. Add: ${P(piS(3 * r * r * h1 + r * r * h2, 3))} cm³.`, { visual: compFig(R, 'rocket', { r, h1, h2 }, { r: String(r), h1: String(h1), h2: String(h2) }) }); }
      if (k === 1) { const r = R.int(1, 6), h = R.int(2, 12);
        return E.num(`A silo is a cylinder of radius ${r} m and height ${h} m with a hemisphere on top. Find its volume. Give an exact answer.`, [{ label: 'volume =', exact: piS(3 * r * r * h + 2 * r ** 3, 3) }],
          `Cylinder π(${r})²(${h}) = ${P(piS(r * r * h))}, hemisphere ⅔π(${r})³ = ${P(piS(2 * r ** 3, 3))}. Total ${P(piS(3 * r * r * h + 2 * r ** 3, 3))} m³.`, { visual: compFig(R, 'silo', { r, h }, { r: String(r), h: String(h) }) }); }
      if (k === 2) { const r = R.int(1, 5), h = R.int(2 * r, 4 * r);
        return E.num(`An ice cream is a cone of radius ${r} cm and height ${h} cm with a hemisphere of ice cream on top. Find its total volume. Give an exact answer.`, [{ label: 'volume =', exact: piS(r * r * (h + 2 * r), 3) }],
          `Cone ⅓π(${r})²(${h}) = ${P(piS(r * r * h, 3))}, hemisphere ⅔π(${r})³ = ${P(piS(2 * r ** 3, 3))}. Total ${P(piS(r * r * (h + 2 * r), 3))} cm³.`, { visual: compFig(R, 'icecream', { r, h }, { r: String(r), h: String(h) }) }); }
      const s = R.int(2, 9), h1 = R.int(2, 9), h2 = 3 * R.int(1, 3);
      return E.num(`A model house is ${an(s)} ${s} by ${s} by ${h1} box with a square pyramid roof of height ${h2}. Find its volume.`, [{ label: 'volume =', ans: s * s * h1 + s * s * h2 / 3 }],
        `Box ${s} × ${s} × ${h1} = ${s * s * h1}; roof ⅓ × ${s * s} × ${h2} = ${s * s * h2 / 3}. Total ${s * s * h1 + s * s * h2 / 3}.`, { visual: compFig(R, 'house', { s, h1, h2 }, { s: String(s), h1: String(h1), h2: String(h2) }) }); } },
    b: { t: 'subtract holes', g: R => {
      const k = R.int(0, 3);
      if (k === 0) { const s = R.int(4, 12), r = R.int(1, Math.floor((s - 1) / 2));
        return E.num(`A cube of edge ${s} cm has a cylindrical hole of radius ${r} cm drilled straight through, from the top face to the bottom face. Find the volume left. Give an exact answer.`, [{ label: 'volume =', exact: minusPi(s ** 3, r * r * s) }],
          `Cube ${s}³ = ${s ** 3}; hole π(${r})²(${s}) = ${P(piS(r * r * s))}. Left: ${P(minusPi(s ** 3, r * r * s))} cm³.`, { visual: compFig(R, 'cubehole', { s, r }, { r: String(r) }) }); }
      if (k === 1) { const r = R.int(2, 8), h = R.int(3, 12);
        return E.num(`A cone with the same base and height is hollowed out of a solid cylinder of radius ${r} cm and height ${h} cm. Find the volume left. Give an exact answer.`, [{ label: 'volume =', exact: piS(2 * r * r * h, 3) }],
          `Cylinder π(${r})²(${h}) minus cone ⅓π(${r})²(${h}) leaves ⅔ of the cylinder: ${P(piS(2 * r * r * h, 3))} cm³.`, { visual: compFig(R, 'cylcone', { r, h }, { r: String(r), h: String(h) }) }); }
      if (k === 2) { const s = R.int(4, 12), r = R.int(1, Math.floor((s - 1) / 2));
        return E.num(`A hemisphere of radius ${r} cm is scooped out of the top of a cube of edge ${s} cm. Find the volume left. Give an exact answer.`, [{ label: 'volume =', exact: minusPi(s ** 3, 2 * r ** 3, 3) }],
          `Cube ${s ** 3}; hemisphere ⅔π(${r})³ = ${P(piS(2 * r ** 3, 3))}. Left: ${P(minusPi(s ** 3, 2 * r ** 3, 3))} cm³.`, { visual: compFig(R, 'bowl', { s, r }, { r: String(r) }) }); }
      const Rr = R.int(3, 9), r = R.int(1, Rr - 1), h = R.int(3, 15);
      return E.num(`A pipe is ${h} cm long, with outer radius ${Rr} cm and inner radius ${r} cm. Find the volume of material in it. Give an exact answer.`, [{ label: 'volume =', exact: piS((Rr * Rr - r * r) * h) }],
        `Outer cylinder − hole: π(${Rr}² − ${r}²)(${h}) = ${P(piS((Rr * Rr - r * r) * h))} cm³. (Not π(${Rr} − ${r})²·${h}.)`, { visual: compFig(R, 'pipe', { R: Rr, r, h }, { R: String(Rr), r: String(r), h: String(h) }) }); } },
    c: { t: 'surface area of composites', g: R => {
      const k = R.int(0, 3);
      if (k === 0) { const r = R.int(1, 6), h = R.int(2, 12);
        return E.num(`A solid silo is a cylinder (radius ${r} m, height ${h} m) with a hemisphere on top. Find its total outside surface area, including the floor. Give an exact answer.`, [{ label: 'area =', exact: piS(3 * r * r + 2 * r * h) }],
          `Floor π(${r})² = ${P(piS(r * r))}, side 2π(${r})(${h}) = ${P(piS(2 * r * h))}, dome 2π(${r})² = ${P(piS(2 * r * r))}. The cylinder's top is hidden. Total ${P(piS(3 * r * r + 2 * r * h))} m².`, { visual: compFig(R, 'silo', { r, h }, { r: String(r), h: String(h) }) }); }
      if (k === 1) { const [r, h2, l] = triple(R, 20), h1 = R.int(2, 12);
        return E.num(`A cone (radius ${r} cm, slant height ${l} cm) sits on a cylinder of the same radius and height ${h1} cm. Find the total surface area of the solid. Give an exact answer.`, [{ label: 'area =', exact: piS(r * r + 2 * r * h1 + r * l) }],
          `Base π(${r})² = ${P(piS(r * r))}, side 2π(${r})(${h1}) = ${P(piS(2 * r * h1))}, cone πrℓ = ${P(piS(r * l))}. The cylinder's top and cone's base are hidden. Total ${P(piS(r * r + 2 * r * h1 + r * l))} cm².`, { visual: compFig(R, 'rocket', { r, h1, h2 }, { r: String(r), h1: String(h1), l: String(l) }) }); }
      if (k === 2) { const a = R.int(3, 9), b = R.int(1, a - 1);
        return E.num(`A cube of edge ${b} cm is glued to the middle of the top of a cube of edge ${a} cm. Find the surface area of the solid.`, [{ label: 'area =', ans: 6 * a * a + 4 * b * b }],
          `Big cube 6 × ${a}² = ${6 * a * a}. The small cube adds 6 × ${b}² but loses its bottom and covers ${b}² of the big top: +4 × ${b}² = ${4 * b * b}. Total ${6 * a * a + 4 * b * b} cm².`, { visual: compFig(R, 'cubes', { a, b }) }); }
      const r = R.int(1, 6), h = R.int(2, 12);
      return E.num(`A capsule is a cylinder (radius ${r} mm, length ${h} mm) with a hemisphere on each end. Find its surface area. Give an exact answer.`, [{ label: 'area =', exact: piS(2 * r * h + 4 * r * r) }],
        `Side 2π(${r})(${h}) = ${P(piS(2 * r * h))}; the two hemispheres make a sphere, 4π(${r})² = ${P(piS(4 * r * r))}. Total ${P(piS(2 * r * h + 4 * r * r))} mm².`, { visual: compFig(R, 'capsule', { r, h }, { r: String(r), h: String(h) }) }); } },
    d: { t: 'real objects', g: R => {
      const k = R.int(0, 4);
      if (k === 0) { const r = R.int(3, 8) / 2, L = R.int(8, 20); const Vv = PI * r * r * L + 4 / 3 * PI * r ** 3;
        return E.num(`A pill is a cylinder ${L} mm long with a hemisphere on each end, all of radius ${r} mm. Find its volume to the nearest mm³.`, [{ label: 'volume ≈', ans: Vv, dp: 0 }],
          `Cylinder π(${r})²(${L}) plus a whole sphere ⁴⁄₃π(${r})³ ≈ ${fx(PI * r * r * L)} + ${fx(4 / 3 * PI * r ** 3)} ≈ ${Math.round(Vv)} mm³.`, { visual: compFig(R, 'capsule', { r: 1, h: L / r }, { r: String(r), h: String(L) }) }); }
      if (k === 1) { const r = R.int(3, 8), h = R.int(10, 25), Vv = PI * r * r * h + 2 / 3 * PI * r ** 3;
        return E.num(`A grain silo is a cylinder of radius ${r} m and height ${h} m topped by a hemisphere. How much grain can it hold? Round to the nearest m³.`, [{ label: 'volume ≈', ans: Vv, dp: 0 }],
          `π(${r})²(${h}) + ⅔π(${r})³ ≈ ${fx(PI * r * r * h)} + ${fx(2 / 3 * PI * r ** 3)} ≈ ${Math.round(Vv)} m³.`, { visual: compFig(R, 'silo', { r: 1, h: h / r }, { r: String(r), h: String(h) }) }); }
      if (k === 2) { const L = R.int(15, 40), W = R.int(6, 15), d1 = R.int(8, 14) / 10, d2 = d1 + R.int(5, 20) / 10, Vv = W * L * (d1 + d2) / 2;
        return E.num(`A pool is ${L} m long and ${W} m wide. Its depth slopes evenly from ${d1} m at one end to ${num(d2)} m at the other. How many cubic meters of water fill it? Round to 1 decimal place.`, [{ label: 'volume ≈', ans: Vv, dp: 1 }],
          `It is a prism whose cross-section is a trapezoid: area ½(${d1} + ${num(d2)}) × ${L} = ${num((d1 + d2) / 2 * L)} m². Times the width ${W}: ${fx(Vv)} m³.`); }
      if (k === 3) { const R0 = R.int(6, 15) / 10, wall = R.int(2, 4) / 10, Lm = R.int(2, 6), r = R0 - wall, Vv = PI * (R0 * R0 - r * r) * Lm * 100 ** 3 / 100 ** 3;
        return E.num(`A concrete pipe is ${Lm} m long, with outer radius ${R0} m and walls ${wall} m thick. Find the volume of concrete to 2 decimal places.`, [{ label: 'volume ≈', ans: Vv, dp: 2 }],
          `Inner radius ${R0} − ${wall} = ${num(r)} m. π(${R0}² − ${num(r)}²)(${Lm}) ≈ ${fx(Vv, 2)} m³.`, { visual: compFig(R, 'pipe', { R: R0, r, h: Lm }, { R: String(R0), r: '', h: String(Lm) }) }); }
      const r = R.int(3, 5) / 10, lc = R.int(14, 19), lt = R.int(15, 25) / 10, Vv = PI * r * r * lc + PI * r * r * lt / 3;
      return E.num(`A sharpened pencil is a cylinder ${lc} cm long with a cone ${lt} cm long at the tip. Its radius is ${r} cm. Find its volume to 2 decimal places.`, [{ label: 'volume ≈', ans: Vv, dp: 2 }],
        `π(${r})²(${lc}) + ⅓π(${r})²(${lt}) ≈ ${fx(PI * r * r * lc, 3)} + ${fx(PI * r * r * lt / 3, 3)} ≈ ${fx(Vv, 2)} cm³.`); } },
    e: { t: 'melt and recast', g: R => {
      const k = R.int(0, 3);
      if (k === 0) { let Rs, r, h, N; do { Rs = R.int(2, 12); r = R.int(1, Rs); h = R.int(1, 2 * Rs); N = 4 * Rs ** 3 / (r * r * h); } while (!Number.isInteger(N) || N < 4 || N > 400 || r === Rs);
        return E.num(`A metal sphere of radius ${Rs} cm is melted down and recast into cones of radius ${r} cm and height ${h} cm, with nothing wasted. How many cones are made?`, [{ label: 'cones =', ans: N }],
          `Sphere ⁴⁄₃π(${Rs})³ ÷ cone ⅓π(${r})²(${h}) = 4 × ${Rs ** 3} ÷ (${r * r} × ${h}) = ${N}.`); }
      if (k === 1) { const r = R.int(1, 4), q = R.int(2, 5), N = q ** 3;
        return E.num(`A lead sphere of radius ${q * r} cm is melted and recast into small spheres of radius ${r} cm. How many small spheres are made?`, [{ label: 'spheres =', ans: N }],
          `The radius shrinks by a factor of ${q}, so each small sphere has 1/${q}³ of the volume: ${N} spheres (not ${q}).`); }
      if (k === 2) { const r = R.int(1, 5), L = R.int(2, 12), Vn = 3 * r * r * L + 4 * r ** 3;
        return E.num(`A capsule is a cylinder with a hemisphere on each end, all of radius ${r} cm. Its volume is ${P(piS(Vn, 3))} cm³. Find the length of the cylinder part.`, [{ label: 'length =', ans: L }],
          `The two ends make a sphere: ⁴⁄₃π(${r})³ = ${P(piS(4 * r ** 3, 3))}. The cylinder holds ${P(piS(Vn, 3))} − ${P(piS(4 * r ** 3, 3))} = ${P(piS(r * r * L))} = π(${r})²L, so L = ${L} cm.`, { visual: compFig(R, 'capsule', { r, h: L }, { r: String(r), h: 'L' }) }); }
      const r = R.int(1, 5), h = R.int(r + 1, 4 * r), Vn = r * r * (h + 2 * r);
      return E.num(`An ice cream is a cone of radius ${r} cm with a hemisphere of the same radius on top. Its total volume is ${P(piS(Vn, 3))} cm³. Find the height of the cone.`, [{ label: 'height =', ans: h }],
        `Hemisphere ⅔π(${r})³ = ${P(piS(2 * r ** 3, 3))}, so the cone is ${P(piS(r * r * h, 3))} = ⅓π(${r})²h, giving h = ${h} cm.`, { visual: compFig(R, 'icecream', { r, h }, { r: String(r), h: 'h' }) }); } },
    f: { t: 'count every face', g: R => {
      const k = R.int(0, 4);
      if (k === 4) { const s = R.int(4, 12), r = R.int(1, Math.floor((s - 1) / 2));
        return E.num(`A cylindrical hole of radius ${r} cm is drilled straight through a cube of edge ${s} cm, from the center of one face to the center of the opposite face. Find the total surface area of the solid, including the inside of the hole. Give an exact answer.`, [{ label: 'area =', exact: plusPi(6 * s * s, 2 * r * s - 2 * r * r) }],
          `The cube had ${6 * s * s}. Two circles are removed (−2π(${r})²) and the hole's wall is added (+2π(${r})(${s})): ${6 * s * s} + ${P(piS(2 * r * s - 2 * r * r))} cm².`, { visual: compFig(R, 'cubehole', { s, r }, { r: String(r) }) }); }
      const all = new Set(); for (let x = 0; x < 3; x++) for (let y = 0; y < 3; y++) for (let z = 0; z < 3; z++) all.add(CELL(x, y, z));
      const cells = new Set(all), e = R.int(1, 3); let what, why;
      if (k === 0) { const T = R.int(1, 3), axes = R.sample([0, 1, 2], T); axes.forEach(a => { for (let i = 0; i < 3; i++) { const p = [1, 1, 1]; p[a] = i; cells.delete(CELL(...p)); } });
        what = T === 1 ? 'A square tunnel, one cube wide, is cut straight through the middle of the big cube, from the center of one face to the center of the opposite face.' : `${T === 2 ? 'Two' : 'Three'} square tunnels, each one cube wide, are cut straight through the middle of the big cube, from face center to opposite face center${T === 3 ? ', one in each direction' : ', in different directions'}.`;
        why = `Outside, ${2 * T} face squares are lost: 54 − ${2 * T} = ${54 - 2 * T}. Inside, the tunnel walls add ${voxArea(cells) - (54 - 2 * T)} squares`; }
      else if (k === 1) { const m = R.int(1, 8), cs = R.sample([0, 2].flatMap(x => [0, 2].flatMap(y => [0, 2].map(z => CELL(x, y, z)))), m); cs.forEach(c => cells.delete(c));
        what = `${m === 1 ? 'One corner cube is' : `${m} of the corner cubes are`} removed.`; why = 'Each corner cube removed takes away 3 outside squares but uncovers 3 new ones, so the area does not change: 54 squares'; }
      else if (k === 2) { const EDG = []; for (let a = 0; a < 3; a++) [0, 2].forEach(u => [0, 2].forEach(w => { const p = [0, 0, 0]; p[a] = 1; p[(a + 1) % 3] = u; p[(a + 2) % 3] = w; EDG.push(CELL(...p)); }));
        const m = R.int(1, 6); R.sample(EDG, m).forEach(c => cells.delete(c)); what = `${m === 1 ? 'One cube from the middle of an edge is' : `${m} cubes, each from the middle of a different edge, are`} removed.`; why = `Each one takes away 2 outside squares and uncovers 4: +2 each, so 54 + ${2 * m} = ${54 + 2 * m} squares`; }
      else { const FC = [[1, 1, 0], [1, 1, 2], [1, 0, 1], [1, 2, 1], [0, 1, 1], [2, 1, 1]].map(p => CELL(...p)), m = R.int(1, 6); R.sample(FC, m).forEach(c => cells.delete(c));
        what = `${m === 1 ? 'The center cube of one face is' : `The center cubes of ${m} faces are`} removed.`; why = `Each one takes away 1 outside square and uncovers 5: +4 each, so 54 + ${4 * m} = ${54 + 4 * m} squares`; }
      const A = voxArea(cells), vis = voxFig(R, cells, 1, 'cube of small cubes with some removed');
      const lead = `A 3 × 3 × 3 cube is built from 27 small cubes of edge ${e} cm. ${what}`;
      return E.num(`${lead} Find the total surface area of the solid that is left, including any inside faces.`, [{ label: 'area =', ans: A * e * e }],
        `Count unit squares: the full cube shows 6 × 9 = 54. ${why}${k === 0 ? `, ${A} in all` : ''}. Each square is ${e * e} cm², so ${A} × ${e * e} = ${A * e * e} cm².`, { visual: vis }); } },
  });

  /* ================= V.14.08 Density & design ================= */
  const MAT = [['aluminum', 2.7], ['iron', 7.9], ['copper', 8.9], ['gold', 19.3], ['lead', 11.3], ['silver', 10.5], ['ice', 0.9], ['oak', 0.7], ['pine', 0.5], ['glass', 2.5]];
  const boxFig = (R, a, b, h, labs) => { const v = view(R), sc = scene(v), VF = boxVF(a, h, b); poly(sc, VF); boxLabs(sc, VF.V, labs[0], labs[1], labs[2]); return render(sc, { w: 200, h: 160, label: 'rectangular block' }); };
  S('V.14.08', 'Density & design', {
    a: { t: 'density = mass / volume', g: R => {
      const k = R.int(0, 3), [mn, d] = R.pick(MAT);
      if (k <= 1) { const a = R.int(2, 10), b = R.int(2, 8), h = R.int(1, 6), Vv = a * b * h, m = Math.round(d * Vv * 10) / 10;
        if (k === 0) return E.num(`A block is ${a} cm by ${b} cm by ${h} cm and has a mass of ${num(m)} g. Find its density in g/cm³.`, [{ label: 'density (g/cm³) =', ans: d }],
          `Volume = ${a} × ${b} × ${h} = ${Vv} cm³. Density = mass ÷ volume = ${num(m)} ÷ ${Vv} = ${d} g/cm³ (that's ${mn}).`, { visual: boxFig(R, a, b, h, [String(a), String(b), String(h)]) });
        return E.num(`A block of ${mn} (density ${d} g/cm³) is ${a} cm by ${b} cm by ${h} cm. Find its mass in grams.`, [{ label: 'mass (g) =', ans: m }],
          `Mass = density × volume = ${d} × ${Vv} = ${num(m)} g.`, { visual: boxFig(R, a, b, h, [String(a), String(b), String(h)]) }); }
      if (k === 2) { const Vv = R.int(5, 60) * 2, m = Math.round(d * Vv * 10) / 10;
        return E.num(`A piece of ${mn} has a mass of ${num(m)} g. Its density is ${d} g/cm³. Find its volume.`, [{ label: 'volume (cm³) =', ans: Vv }], `Volume = mass ÷ density = ${num(m)} ÷ ${d} = ${Vv} cm³.`); }
      const r = R.int(1, 5), m = R.int(20, 400), Vv = 4 / 3 * PI * r ** 3, de = m / Vv;
      return E.num(`A ball of radius ${r} cm has a mass of ${m} g. Find its density in g/cm³, to 2 decimal places.`, [{ label: 'density (g/cm³) ≈', ans: de, dp: 2 }],
        `Volume ⁴⁄₃π(${r})³ ≈ ${fx(Vv, 2)} cm³. Density = ${m} ÷ ${fx(Vv, 2)} ≈ ${fx(de, 2)} g/cm³. (Mass ÷ volume, not volume ÷ mass.)`); } },
    b: { t: 'population density', g: R => {
      const k = R.int(0, 3);
      if (k === 0) { const A = R.int(12, 900), p = R.int(20, 400) * 1000 + R.int(0, 999), de = p / A;
        return E.num(`A city of ${p.toLocaleString('en-US')} people covers ${A} km². Find its population density, to the nearest person per km².`, [{ label: 'people per km² ≈', ans: de, dp: 0 }], `${p.toLocaleString('en-US')} ÷ ${A} ≈ ${Math.round(de)} people per km².`); }
      if (k === 1) { const de = R.int(15, 400) * 10, A = R.int(5, 80);
        return E.num(`A district has ${de.toLocaleString('en-US')} people per km² and an area of ${A} km². About how many people live there?`, [{ label: 'people =', ans: de * A }], `Population = density × area = ${de} × ${A} = ${(de * A).toLocaleString('en-US')}.`); }
      if (k === 2) { const r = R.int(2, 12), p = R.int(5, 300) * 100, de = p / (PI * r * r);
        return E.num(`A round island has radius ${r} km and ${p.toLocaleString('en-US')} people. Find its population density to the nearest person per km².`, [{ label: 'people per km² ≈', ans: de, dp: 0 }], `Area π(${r})² ≈ ${fx(PI * r * r)} km². Density ≈ ${p} ÷ ${fx(PI * r * r)} ≈ ${Math.round(de)} people per km².`); }
      let p1, a1, p2, a2; do { p1 = R.int(10, 90) * 1000; a1 = R.int(5, 40); p2 = R.int(10, 90) * 1000; a2 = R.int(5, 40); } while (Math.abs(p1 / a1 - p2 / a2) / Math.max(p1 / a1, p2 / a2) < 0.08 || (p1 > p2) === (p1 / a1 > p2 / a2));
      const t1 = R.pick(['Ashford', 'Brookvale', 'Cedar Point']), t2 = R.pick(['Dunmore', 'Elm Grove', 'Fairhaven']), d1 = p1 / a1, d2 = p2 / a2;
      return E.choice(R, `${t1} has ${p1.toLocaleString('en-US')} people on ${a1} km². ${t2} has ${p2.toLocaleString('en-US')} people on ${a2} km². Which is more crowded?`, d1 > d2 ? t1 : t2, [d1 > d2 ? t2 : t1, 'They are equally crowded'],
        `Compare people per km²: ${t1} ≈ ${Math.round(d1)}, ${t2} ≈ ${Math.round(d2)}. ${d1 > d2 ? t1 : t2} is more crowded, even though ${p1 > p2 ? t1 : t2} has more people.`); } },
    c: { t: 'minimize material', g: R => {
      const k = R.int(0, 4);
      if (k === 4) return E.choice(R, 'For a fixed volume, which shape has the smallest surface area?', 'a sphere', ['a cube', 'a cylinder twice as tall as it is wide', 'a cone'], 'Of all solids with the same volume, the sphere wraps it in the least surface. That is why bubbles and water drops are round.');
      if (k <= 1) { const n = R.pick([2, 3, 4, 5, 6]), Vv = n ** 3 * R.pick([1, 1, 2]); const tri = []; for (let a = 1; a <= Vv; a++) for (let b = a; a * b <= Vv; b++) if (Vv % (a * b) === 0 && Vv / (a * b) >= b) tri.push([a, b, Vv / (a * b)]);
        const sa = t => 2 * (t[0] * t[1] + t[1] * t[2] + t[0] * t[2]); let pick; do { pick = R.sample(tri, Math.min(4, tri.length)); } while (pick.filter(t => sa(t) === Math.min(...pick.map(sa))).length > 1);
        const best = pick.reduce((b, t) => sa(t) < sa(b) ? t : b), lab = t => `${t[0]} × ${t[1]} × ${t[2]} cm`;
        if (pick.length < 3) return E.num(`A closed box must hold ${Vv} cm³. Find the surface area of a ${lab(best)} box.`, [{ label: 'area =', ans: sa(best) }], `2(${best[0]}·${best[1]} + ${best[1]}·${best[2]} + ${best[0]}·${best[2]}) = ${sa(best)} cm².`);
        return E.choice(R, `Each closed box below holds ${Vv} cm³. Which one uses the least cardboard?`, lab(best), pick.filter(t => t !== best).map(lab),
          `Surface areas: ${pick.map(t => `${lab(t)} → ${sa(t)}`).join('; ')} cm². The most cube-like of these boxes, ${lab(best)}, uses least.`); }
      const Kk = R.pick([144, 72, 108, 256, 400, 432, 192]), cands = [1, 2, 3, 4, 5, 6, 8, 10, 12].filter(r => Kk % (r * r) === 0).map(r => [r, Kk / (r * r)]), sa = ([r, h]) => 2 * r * r + 2 * r * h;
      let pick; do { pick = R.sample(cands, Math.min(4, cands.length)); } while (pick.filter(t => sa(t) === Math.min(...pick.map(sa))).length > 1 || pick.length < 3);
      const best = pick.reduce((b, t) => sa(t) < sa(b) ? t : b), lab = t => `r = ${t[0]} cm, h = ${t[1]} cm`;
      if (k === 3) return E.num(`A can with radius ${best[0]} cm and height ${best[1]} cm is closed at both ends. Find the area of metal it uses. Give an exact answer.`, [{ label: 'area =', exact: piS(sa(best)) }], `2πr² + 2πrh = 2π(${best[0]})² + 2π(${best[0]})(${best[1]}) = ${P(piS(sa(best)))} cm².`, { visual: (() => { const v = view(R, { az: 0 }), sc = scene(v); cyl(sc, [0, 0, 0], best[0], best[1]); radius(sc, [0, best[1], 0], best[0], String(best[0]), { solid: true, dir: [0.2, 1] }); sc.tx(onC(v, [0, best[1] / 2, 0], best[0], PI), String(best[1]), { dir: [-1, 0] }); return render(sc, { w: 160, h: 170, label: 'can' }); })() });
      return E.choice(R, `Each closed can below holds ${P(piS(Kk))} cm³. Which one uses the least metal?`, lab(best), pick.filter(t => t !== best).map(lab),
        `Area = 2πr² + 2πrh: ${pick.map(t => `${lab(t)} → ${P(piS(sa(t)))}`).join('; ')}. The least is ${lab(best)}: not too tall, not too flat.`); } },
    d: { t: 'packaging problems', g: R => {
      const k = R.int(0, 3);
      if (k === 0) { const r = R.int(2, 5), h = R.int(8, 15), nx = R.int(2, 6), ny = R.int(2, 5), nz = R.int(1, 3), L = 2 * r * nx + R.int(0, 2 * r - 1), W = 2 * r * ny + R.int(0, 2 * r - 1), H = h * nz + R.int(0, h - 1);
        return E.num(`Cans of radius ${r} cm and height ${h} cm stand upright in rows in a box ${L} cm long, ${W} cm wide and ${H} cm tall. How many cans fit, stacked in layers?`, [{ label: 'cans =', ans: nx * ny * nz }],
          `Each can needs ${an(2 * r)} ${2 * r} cm square. Along the length ${Math.floor(L / (2 * r))} fit, across ${Math.floor(W / (2 * r))}, and ${Math.floor(H / h)} layer${nz > 1 ? 's' : ''}: ${nx} × ${ny} × ${nz} = ${nx * ny * nz}. Round down: part of a can doesn't count.`); }
      if (k === 1) { const r = R.int(2, 5), v = view(R, { az: 0 }), sc = scene(v); cyl(sc, [0, 0, 0], r, 6 * r); [1, 3, 5].forEach(y => sphere(sc, [0, y * r, 0], r, { color: '#2F6DB0', eq: false })); radius(sc, [0, 6 * r, 0], r, String(r), { solid: true, dir: [0.2, 1] });
        const vis = render(sc, { w: 120, h: 220, label: 'three balls in a tube' });
        if (R.bool()) return E.num(`Three tennis balls of radius ${r} cm fit snugly in a cylindrical tube. Find the empty space in the tube. Give an exact answer.`, [{ label: 'empty =', exact: piS(2 * r ** 3) }],
          `Tube π(${r})²(${6 * r}) = ${P(piS(6 * r ** 3))}; balls 3 × ⁴⁄₃π(${r})³ = ${P(piS(4 * r ** 3))}. Empty: ${P(piS(2 * r ** 3))} cm³.`, { visual: vis });
        return E.num(`Three tennis balls of radius ${r} cm fit snugly in a cylindrical tube. What fraction of the tube do the balls fill?`, [{ label: 'fraction =', frac: [2, 3] }],
          `Balls ${P(piS(4 * r ** 3))} ÷ tube ${P(piS(6 * r ** 3))} = 2/3.`, { visual: vis }); }
      if (k === 2) { const d = R.int(4, 20), cubeQ = R.bool(), pct = cubeQ ? 100 * PI / 6 : 100 * PI / 4;
        return E.num(cubeQ ? `A ball of diameter ${d} cm is packed in a cube-shaped box of edge ${d} cm. What percent of the box does the ball fill? Round to 1 decimal place.` : `A can of diameter ${d} cm and height ${d + 2} cm is packed in a box ${d} cm by ${d} cm by ${d + 2} cm. What percent of the box does the can fill? Round to 1 decimal place.`,
          [{ label: 'percent ≈', ans: pct, dp: 1 }], cubeQ ? `Ball ⁴⁄₃π(${d / 2})³ ÷ box ${d}³ = π/6 ≈ ${fx(pct)}%, whatever the size.` : `Can π(${d / 2})²(${d + 2}) ÷ box ${d} × ${d} × ${d + 2} = π/4 ≈ ${fx(pct)}%, whatever the size.`); }
      const s = R.int(2, 3), a = R.int(3, 9), b = R.int(3, 9), c = R.int(2, 6), L = a * s + R.int(1, 2 * s - 1) / 2, W = b * s + R.int(0, 2 * s - 1) / 2, H = c * s;
      return E.num(`Sugar cubes of edge ${s} cm are packed into a box ${num(L)} cm by ${num(W)} cm by ${H} cm. How many whole cubes fit?`, [{ label: 'cubes =', ans: a * b * c }],
        `${Math.floor(L / s)} along, ${Math.floor(W / s)} across, ${Math.floor(H / s)} up: ${a} × ${b} × ${c} = ${a * b * c}. (Dividing the volumes would overcount when the box isn't a whole number of cubes.)`, { visual: boxFig(R, L, W, H, [num(L), num(W), String(H)]) }); } },
  });
})(typeof window !== 'undefined' ? window : globalThis);
