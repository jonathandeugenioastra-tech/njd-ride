/* NJ.D' RIDE – Libreria PRO (3): café racer – carene e cupolini, codini, selle café, semimanubri, pedane arretrate, puntali, tabelle portanumero.
   © 2026 dott. Jonathan D'Eugenio – Tutti i diritti riservati (L. 633/1941). Tipologie generiche, nessun logo né disegno protetto. */
import * as THREE from 'three';
import { H, registerPro, PRO_DEFS, FIN_METAL, LEATHER_COL, LEATHER_TYPE, THREAD_COL, PAINT_TYPE } from './pro.js';
const { mesh, lathe, bentPath, tubeAlong, closedSpline, hexPrism, capScrew, buttonScrew, threadedRod, stitches, cushion, shapeFrom, roundRect, roundRectPts, extrudeShape, smoothClosed, metal, leather, threadMat, lens, paint, rubber, darkMat, T, V3, IN, PI, sstep, clamp, sel, num, col, YN, RoundedBoxGeometry } = H;

/* ===================== guscio parametrico con spessore e bordo rullato ===================== */
export function shell(fn, NU, NV, o = {}) {
  const th = o.thick ?? .003, cV = !!o.closeV, K = o.rimSeg ?? 6, W = NV + 1, N = (NU + 1) * W, P = new Array(N);
  for (let i = 0; i <= NU; i++) for (let j = 0; j <= NV; j++) P[i * W + j] = fn(i / NU, j / NV);
  if (cV) for (let i = 0; i <= NU; i++) P[i * W + NV] = P[i * W].clone();
  const du = (i, j) => P[Math.min(NU, i + 1) * W + j].clone().sub(P[Math.max(0, i - 1) * W + j]);
  const dv = (i, j) => { if (cV) { const jp = j >= NV ? 1 : j + 1, jm = j <= 0 ? NV - 1 : j - 1; return P[i * W + jp].clone().sub(P[i * W + jm]); } return P[i * W + Math.min(NV, j + 1)].clone().sub(P[i * W + Math.max(0, j - 1)]); };
  const cen = new THREE.Vector3(); P.forEach(p => cen.add(p)); cen.divideScalar(N);
  let vote = 0; for (let k = 0; k < N; k += 3) { const i = Math.floor(k / W), j = k % W, n = du(i, j).cross(dv(i, j)); vote += Math.sign(n.dot(P[k].clone().sub(cen))); }
  const flip = o.flip ?? (vote < 0), Nn = new Array(N);
  for (let i = 0; i <= NU; i++) for (let j = 0; j <= NV; j++) { let n = du(i, j).cross(dv(i, j)); if (n.lengthSq() < 1e-16) { const ii = i === 0 ? 1 : i === NU ? NU - 1 : i; n = du(ii, j).cross(dv(ii, j)); } if (flip) n.negate(); if (n.lengthSq() < 1e-18) n.set(0, 1, 0); Nn[i * W + j] = n.normalize(); }
  let Lu = 0, Lv = 0; for (let j = 0; j <= NV; j += Math.max(1, NV >> 3)) { let s = 0; for (let i = 1; i <= NU; i++) s += P[i * W + j].distanceTo(P[(i - 1) * W + j]); Lu = Math.max(Lu, s); }
  for (let i = 0; i <= NU; i += Math.max(1, NU >> 3)) { let s = 0; for (let j = 1; j <= NV; j++) s += P[i * W + j].distanceTo(P[i * W + j - 1]); Lv = Math.max(Lv, s); }
  const pos = [], nor = [], uv = [], iA = [], iB = [];
  const add = (p, n, a, b) => { pos.push(p.x, p.y, p.z); nor.push(n.x, n.y, n.z); uv.push(a, b); return pos.length / 3 - 1; };
  const quad = (arr, a, b, c, d, f) => f ? arr.push(a, c, b, c, d, b) : arr.push(a, b, c, c, b, d);
  for (let k = 0; k < N; k++) add(P[k], Nn[k], Math.floor(k / W) / NU * Lu, (k % W) / NV * Lv);
  for (let i = 0; i < NU; i++) for (let j = 0; j < NV; j++) { const a = i * W + j; quad(iA, a, a + W, a + 1, a + W + 1, flip); }
  const b2 = N; for (let k = 0; k < N; k++) add(P[k].clone().addScaledVector(Nn[k], -th), Nn[k].clone().negate(), Math.floor(k / W) / NU * Lu, (k % W) / NV * Lv);
  for (let i = 0; i < NU; i++) for (let j = 0; j < NV; j++) { const a = b2 + i * W + j; quad(iB, a, a + W, a + 1, a + W + 1, !flip); }
  const edges = [];
  if (!o.closeU) { edges.push({ ks: Array.from({ length: W }, (_, j) => j), d: (i, j) => du(i, j).negate() }); edges.push({ ks: Array.from({ length: W }, (_, j) => NU * W + j), d: (i, j) => du(i, j) }); }
  if (!cV) { edges.push({ ks: Array.from({ length: NU + 1 }, (_, i) => i * W), d: (i, j) => dv(i, j).negate() }); edges.push({ ks: Array.from({ length: NU + 1 }, (_, i) => i * W + NV), d: (i, j) => dv(i, j) }); }
  const pv = k => V3(pos[k * 3], pos[k * 3 + 1], pos[k * 3 + 2]), nv = k => V3(nor[k * 3], nor[k * 3 + 1], nor[k * 3 + 2]);
  for (const E of edges) {
    const start = pos.length / 3, M = E.ks.length;
    E.ks.forEach((k, m) => { const i = Math.floor(k / W), j = k % W, n = Nn[k], e = E.d(i, j); e.addScaledVector(n, -e.dot(n)); if (e.lengthSq() < 1e-16) e.set(0, -1, 0); e.normalize();
      for (let s = 0; s <= K; s++) { const f = s / K * PI, nn = n.clone().multiplyScalar(Math.cos(f)).addScaledVector(e, Math.sin(f)); add(P[k].clone().addScaledVector(n, -th / 2).addScaledVector(nn, th / 2), nn, m * .004, s / K * .01); } });
    let rev = false; for (let m = Math.floor(M / 2); m < M - 1; m++) { const a = start + m * (K + 1) + 2, tn = pv(a + K + 1).sub(pv(a)).cross(pv(a + 1).sub(pv(a))); if (tn.lengthSq() > 1e-18) { rev = tn.dot(nv(a + 1)) < 0; break; } }
    for (let m = 0; m < M - 1; m++) for (let s = 0; s < K; s++) { const a = start + m * (K + 1) + s; quad(iA, a, a + K + 1, a + 1, a + K + 2, rev); }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(iA.concat(iB)); g.addGroup(0, iA.length, 0); g.addGroup(iA.length, iB.length, 1);
  const at = (u, v) => fn(clamp(u, 0, 1), clamp(v, 0, 1));
  const nAt = (u, v) => { const e = 1.5e-3, pu = at(u + e, v).sub(at(u - e, v)), pq = at(u, v + e).sub(at(u, v - e)), n = pu.cross(pq); if (flip) n.negate(); return n.lengthSq() < 1e-20 ? V3(0, 1, 0) : n.normalize(); };
  return { geo: g, at, nAt, flip, P, Nn, NU, NV, W };
}
/* toppa che segue il guscio (strisce, decalcomanie) */
export function patch(S, u0, u1, v0, v1, nu, nv, off, uvMap) {
  const pos = [], nor = [], uv = [], idx = [], Wn = nv + 1;
  for (let i = 0; i <= nu; i++) for (let j = 0; j <= nv; j++) { const u = u0 + (u1 - u0) * i / nu, v = v0 + (v1 - v0) * j / nv, n = S.nAt(u, v), p = S.at(u, v).addScaledVector(n, off); pos.push(p.x, p.y, p.z); nor.push(n.x, n.y, n.z);
    if (uvMap) { const d = p.clone().sub(uvMap.c); uv.push(d.dot(uvMap.t1) / uvMap.size + .5, d.dot(uvMap.t2) / uvMap.size + .5); } else uv.push(i / nu, j / nv); }
  for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) { const a = i * Wn + j; S.flip ? idx.push(a, a + 1, a + Wn, a + 1, a + Wn + 1, a + Wn) : idx.push(a, a + Wn, a + 1, a + 1, a + Wn, a + Wn + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); return g;
}
/* ===================== guscio RIFILATO: superficie parametrica tagliata dai contorni ricalcati dalle foto =====================
   sd(p,u,v) = distanza con segno dal contorno (negativa = materiale). Il taglio passa esattamente sul contorno (regula falsi),
   poi spessore, bordo arrotondato e anelli di bordo (per guarnizioni, viti, profili). */
export function smoothClosedPts(pts, n = 420) { if (pts.length < 4) return pts; const c = new THREE.CatmullRomCurve3(pts.map(p => V3(p[0], p[1], 0)), true, 'centripetal'); return c.getSpacedPoints(n).slice(0, n).map(p => [p.x, p.y]); }
export function smoothOpenPts(pts, n = 200) { if (pts.length < 3) return pts; const c = new THREE.CatmullRomCurve3(pts.map(p => V3(p[0], p[1], 0)), false, 'centripetal'); return c.getSpacedPoints(n).map(p => [p.x, p.y]); }
export function polySD(pts) {
  const n = pts.length, X = pts.map(p => p[0]), Y = pts.map(p => p[1]); let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  for (const p of pts) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
  return (x, y) => { const bx = Math.max(x0 - x, 0, x - x1), by = Math.max(y0 - y, 0, y - y1); if (bx > .15 || by > .15) return Math.hypot(bx, by);
    let ins = false, d2 = 1e18;
    for (let i = 0, j = n - 1; i < n; j = i++) { const xi = X[i], yi = Y[i], xj = X[j], yj = Y[j];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) ins = !ins;
      const ex = xj - xi, ey = yj - yi, L = ex * ex + ey * ey; let t = L > 0 ? ((x - xi) * ex + (y - yi) * ey) / L : 0; t = t < 0 ? 0 : t > 1 ? 1 : t;
      const dx = x - xi - t * ex, dy = y - yi - t * ey, dd = dx * dx + dy * dy; if (dd < d2) d2 = dd; }
    return ins ? -Math.sqrt(d2) : Math.sqrt(d2); };
}
export function polyDist(pts) { const n = pts.length; return (x, y) => { let d2 = 1e18; for (let i = 0; i < n - 1; i++) { const a = pts[i], b = pts[i + 1], ex = b[0] - a[0], ey = b[1] - a[1], L = ex * ex + ey * ey; let t = L > 0 ? ((x - a[0]) * ex + (y - a[1]) * ey) / L : 0; t = clamp(t, 0, 1); const dx = x - a[0] - t * ex, dy = y - a[1] - t * ey; d2 = Math.min(d2, dx * dx + dy * dy); } return Math.sqrt(d2); }; }
export function trimSkin(fn, NU, NV, sd, o = {}) {
  const th = o.thick ?? .0035, K = o.rimK ?? 5, cV = o.closeV ?? true, off = o.off ?? 0, single = !!o.single, W = NV + 1;
  const wrap = t => cV ? ((t % 1) + 1) % 1 : clamp(t, 0, 1), id = (i, j) => i * W + (cV && j === NV ? 0 : j);
  const nRaw = (u, v) => { const e = 7e-4; return fn(Math.min(1, u + e), v).sub(fn(Math.max(0, u - e), v)).cross(fn(u, wrap(v + e)).sub(fn(u, wrap(v - e)))); };
  const G = new Array((NU + 1) * W), Dg = new Float64Array((NU + 1) * W);
  for (let i = 0; i <= NU; i++) for (let j = 0; j < (cV ? NV : W); j++) { const k = i * W + j, u = i / NU, v = j / NV, p = fn(u, v); G[k] = p; let d = sd(p, u, v); if (Math.abs(d) < 1e-9) d = 1e-9; Dg[k] = d; }
  if (cV) for (let i = 0; i <= NU; i++) { G[i * W + NV] = G[i * W]; Dg[i * W + NV] = Dg[i * W]; }
  const cen = V3(0, 0, 0); let cn = 0; for (let k = 0; k < G.length; k += 7) { cen.add(G[k]); cn++; } cen.divideScalar(cn);
  let vote = 0; for (let i = 1; i < NU; i += 3) for (let j = 0; j < NV; j += 5) vote += Math.sign(nRaw(i / NU, j / NV).dot(G[i * W + j].clone().sub(cen)));
  const flip = o.flip ?? (vote < 0);
  const nAt = (u, v) => { let n = nRaw(u, v); if (n.lengthSq() < 1e-22) n = nRaw(clamp(u + (u < .5 ? .004 : -.004), 0, 1), v); if (flip) n.negate(); return n.lengthSq() < 1e-22 ? V3(0, 1, 0) : n.normalize(); };
  const pos = [], nor = [], uvs = [], PU = [], tri = [];
  const emit = (u, v) => { const n = nAt(u, v), p = fn(u, v).addScaledVector(n, off); pos.push(p.x, p.y, p.z); nor.push(n.x, n.y, n.z); uvs.push(u, v); PU.push([u, v]); return pos.length / 3 - 1; };
  const gmap = new Map(), emap = new Map();
  const gv = (i, j) => { const k = id(i, j); let r = gmap.get(k); if (r === undefined) { r = emit(i / NU, j / NV >= 1 && cV ? 0 : j / NV); gmap.set(k, r); } return r; };
  const ev = (i1, j1, i2, j2) => { const ka = id(i1, j1), kb = id(i2, j2), key = ka < kb ? ka * 4e6 + kb : kb * 4e6 + ka; let r = emap.get(key); if (r !== undefined) return r;
    let ta = 0, tb = 1, da = Dg[i1 * W + j1], db = Dg[i2 * W + j2], t = da / (da - db), u, v;
    for (let it = 0; it < 4; it++) { u = (i1 + (i2 - i1) * t) / NU; v = (j1 + (j2 - j1) * t) / NV; const d = sd(fn(u, wrap(v)), u, wrap(v)); if (Math.abs(d) < 2e-5) break; if ((d > 0) === (da > 0)) { ta = t; da = d; } else { tb = t; db = d; } t = ta + (tb - ta) * da / (da - db); }
    u = (i1 + (i2 - i1) * t) / NU; v = wrap((j1 + (j2 - j1) * t) / NV); r = emit(u, v); emap.set(key, r); return r; };
  const clipTri = C => { const out = []; for (let a = 0; a < 3; a++) { const A = C[a], B = C[(a + 1) % 3], ai = Dg[A[0] * W + A[1]] <= 0, bi = Dg[B[0] * W + B[1]] <= 0;
      if (ai) out.push(gv(A[0], A[1])); if (ai !== bi) out.push(ev(A[0], A[1], B[0], B[1])); }
    for (let m = 1; m + 1 < out.length; m++) tri.push(out[0], out[m], out[m + 1]); };
  for (let i = 0; i < NU; i++) for (let j = 0; j < NV; j++) { const a = [i, j], b = [i + 1, j], c = [i, j + 1], d = [i + 1, j + 1];
    if (Dg[i * W + j] > 0 && Dg[(i + 1) * W + j] > 0 && Dg[i * W + j + 1] > 0 && Dg[(i + 1) * W + j + 1] > 0) continue;
    if (!flip) { clipTri([a, b, c]); clipTri([c, b, d]); } else { clipTri([a, c, b]); clipTri([c, d, b]); } }
  // bordi liberi
  const ecount = new Map(); for (let f = 0; f < tri.length; f += 3) for (let e = 0; e < 3; e++) { const a = tri[f + e], b = tri[f + (e + 1) % 3], key = a < b ? a * 4e6 + b : b * 4e6 + a, r = ecount.get(key); if (r) r.c++; else ecount.set(key, { c: 1, a, b }); }
  const bnd = []; for (const r of ecount.values()) if (r.c === 1) bnd.push([r.a, r.b]);
  const P = k => V3(pos[k * 3], pos[k * 3 + 1], pos[k * 3 + 2]), Nn = k => V3(nor[k * 3], nor[k * 3 + 1], nor[k * 3 + 2]);
  const tv = new Map(); for (const [a, b] of bnd) { const e = P(b).sub(P(a)); for (const k of [a, b]) { const t = e.clone().cross(Nn(k)); const s = tv.get(k); if (s) s.add(t); else tv.set(k, t); } }
  for (const [k, t] of tv) { const n = Nn(k); t.addScaledVector(n, -t.dot(n)); if (t.lengthSq() < 1e-20) t.set(0, -1, 0); t.normalize(); }
  const nOuter = pos.length / 3, iA = tri.slice(), iB = [];
  if (!single) {
    for (let k = 0; k < nOuter; k++) { const p = P(k), n = Nn(k); pos.push(p.x - n.x * th, p.y - n.y * th, p.z - n.z * th); nor.push(-n.x, -n.y, -n.z); uvs.push(uvs[k * 2], uvs[k * 2 + 1]); }
    for (let f = 0; f < tri.length; f += 3) iB.push(tri[f] + nOuter, tri[f + 2] + nOuter, tri[f + 1] + nOuter);
    const ring = new Map(); for (const [k, t] of tv) { const p = P(k), n = Nn(k), st = pos.length / 3;
      for (let s2 = 0; s2 <= K; s2++) { const f = s2 / K * PI, q = p.clone().addScaledVector(n, -th / 2 * (1 - Math.cos(f))).addScaledVector(t, th / 2 * Math.sin(f)), nn = n.clone().multiplyScalar(Math.cos(f)).addScaledVector(t, Math.sin(f)).normalize();
        pos.push(q.x, q.y, q.z); nor.push(nn.x, nn.y, nn.z); uvs.push(uvs[k * 2], uvs[k * 2 + 1]); } ring.set(k, st); }
    for (const [a, b] of bnd) { const ra = ring.get(a), rb = ring.get(b); for (let s2 = 0; s2 < K; s2++) iA.push(ra + s2, ra + s2 + 1, rb + s2, rb + s2, ra + s2 + 1, rb + s2 + 1); }
  }
  // anelli di bordo ordinati
  const nx = new Map(); for (const [a, b] of bnd) nx.set(a, b); const seen = new Set(), loops = [];
  for (const [a] of bnd) { if (seen.has(a)) continue; const L = []; let k = a, g = 0; while (k !== undefined && !seen.has(k) && g++ < 1e6) { seen.add(k); L.push({ k, p: P(k), n: Nn(k), t: tv.get(k), u: PU[k][0], v: PU[k][1] }); k = nx.get(k); } if (L.length > 8) loops.push(L); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(iA.concat(iB)); g.addGroup(0, iA.length, 0); if (iB.length) g.addGroup(iA.length, iB.length, 1);
  return { geo: g, at: (u, v) => fn(u, v), nAt, flip, loops };
}
/* tratto di bordo che segue una linea del contorno (es. giunzione guscio/plexi): sequenza continua più lunga entro tol */
export function edgeRun(loops, test) { let best = [];
  for (const L of loops) { const ok = L.map(test), n = L.length; let s0 = ok.indexOf(false); if (s0 < 0) { if (L.length > best.length) best = L.slice(); continue; }
    let cur = []; for (let m = 1; m <= n; m++) { const i = (s0 + m) % n; if (ok[i]) cur.push(L[i]); else { if (cur.length > best.length) best = cur; cur = []; } } if (cur.length > best.length) best = cur; }
  return best; }
/* nastro (profilo cromato / guarnizione) lungo una sequenza di punti del bordo */
export function ribbonAlong(run, w, h, lift, mat) { if (run.length < 3) return null;
  const pts = run.map(r => r.p.clone().addScaledVector(r.n, lift)), cr = new THREE.CatmullRomCurve3(pts, false, 'centripetal'), M = Math.max(24, run.length * 2), A = 7, pos = [], nor = [], idx = [];
  const near = q => { let b = run[0], d = 1e9; for (const r of run) { const dd = r.p.distanceToSquared(q); if (dd < d) { d = dd; b = r; } } return b; };
  for (let i = 0; i <= M; i++) { const c = cr.getPointAt(i / M), tg = cr.getTangentAt(i / M), r = near(c), n = r.n.clone(), s = tg.clone().cross(n).normalize();
    for (let a = 0; a <= A; a++) { const q = -1 + 2 * a / A, hz = h * Math.sqrt(Math.max(0, 1 - q * q)), p = c.clone().addScaledVector(s, q * w / 2).addScaledVector(n, hz), nn = n.clone().multiplyScalar(Math.sqrt(Math.max(.05, 1 - q * q))).addScaledVector(s, q * .9).normalize();
      pos.push(p.x, p.y, p.z); nor.push(nn.x, nn.y, nn.z); } }
  for (let i = 0; i < M; i++) for (let a = 0; a < A; a++) { const k = i * (A + 1) + a; idx.push(k, k + A + 1, k + 1, k + 1, k + A + 1, k + A + 2); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setIndex(idx);
  const m = mesh(g, mat); m.material.side = THREE.DoubleSide; return { m, curve: cr };
}
/* interpolazione monotona (Fritsch–Carlson) su tabella [[x,y],...] con x decrescenti o crescenti */
export function mono(tab) { const T2 = tab[0][0] > tab[tab.length - 1][0] ? tab.slice().reverse() : tab.slice(), n = T2.length, X = T2.map(p => p[0]), Y = T2.map(p => p[1]), d = [], m = new Array(n).fill(0);
  for (let i = 0; i < n - 1; i++) d.push((Y[i + 1] - Y[i]) / (X[i + 1] - X[i]));
  m[0] = d[0]; m[n - 1] = d[n - 2]; for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  for (let i = 0; i < n - 1; i++) { if (d[i] === 0) { m[i] = m[i + 1] = 0; continue; } const a = m[i] / d[i], b = m[i + 1] / d[i], h = a * a + b * b; if (h > 9) { const t = 3 / Math.sqrt(h); m[i] = t * a * d[i]; m[i + 1] = t * b * d[i]; } }
  return x => { if (x <= X[0]) return Y[0] + m[0] * (x - X[0]) * 0; if (x >= X[n - 1]) return Y[n - 1]; let i = 0; while (x > X[i + 1]) i++; const h = X[i + 1] - X[i], t = (x - X[i]) / h, t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * Y[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * Y[i + 1] + (t3 - t2) * h * m[i + 1]; };
}
export function orient(obj, n, up = V3(0, 1, 0)) { const Y = n.clone().normalize(), Z = up.clone().addScaledVector(Y, -up.dot(Y)).normalize().negate(), X = Y.clone().cross(Z).normalize(); obj.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(X, Y, Z)); return obj; }

/* ===================== materiali e texture comuni ===================== */
export const SCREEN_COL = [['fume', 'Fumé'], ['chiaro', 'Trasparente'], ['scuro', 'Scuro'], ['ambra', 'Ambra'], ['blu', 'Blu iridescente']];
export function screenMat(t) {
  const c = { fume: 0x8a847a, chiaro: 0xf3f7f9, scuro: 0x2a2c30, ambra: 0xc0782a, blu: 0x4a6a9c }[t] ?? 0x8a847a;
  const m = new THREE.MeshPhysicalMaterial({ name: 'Parabrezza', color: c, roughness: .025, metalness: 0, transmission: t === 'scuro' ? .5 : .94, thickness: .003, ior: 1.49, specularIntensity: 1, clearcoat: 1, clearcoatRoughness: .02 });
  if (t === 'blu') Object.assign(m, { iridescence: 1, iridescenceIOR: 1.8, iridescenceThicknessRange: [300, 700] }); return m;
}
const fiber = () => new THREE.MeshPhysicalMaterial({ name: 'Interno', color: 0x141414, roughness: .78, normalMap: T.peel(), normalScale: new THREE.Vector2(.25, .25) });
const TXC = {};
function glyphTex(str) { const key = 'g' + str; if (TXC[key]) return TXC[key]; const c = document.createElement('canvas'); c.width = c.height = 512; const g = c.getContext('2d');
  g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `700 ${str.length > 1 ? 330 : 380}px "Barlow Condensed", Impact, "Arial Narrow", sans-serif`; g.fillText(str, 256, 284);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return (TXC[key] = t); }
function discTex() { if (TXC.disc) return TXC.disc; const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'); g.fillStyle = '#fff'; g.beginPath(); g.arc(128, 128, 124, 0, 2 * PI); g.fill(); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return (TXC.disc = t); }
const decalMat = (name, color, map) => new THREE.MeshPhysicalMaterial({ name, color, map, alphaTest: .5, roughness: .3, clearcoat: .6, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
const DIALTX = {};
function dialTex(kind, bg) {
  const key = kind + bg; if (DIALTX[key]) return DIALTX[key];
  const c = document.createElement('canvas'); c.width = c.height = 512; const g = c.getContext('2d');
  const [b, f] = { nero: ['#0b0b0c', '#f1f1f1'], bianco: ['#f3f1ea', '#141414'], crema: ['#e8dcc0', '#1d1a14'] }[bg] || ['#0b0b0c', '#f1f1f1'];
  g.fillStyle = b; g.fillRect(0, 0, 512, 512);
  const max = kind === 'giri' ? 8 : 160, step = kind === 'giri' ? 1 : 20, a0 = PI * .75, a1 = PI * 2.25, nMinor = kind === 'giri' ? 40 : 80, per = nMinor / (max / step);
  if (kind === 'giri') { g.strokeStyle = '#c3151b'; g.lineWidth = 18; g.beginPath(); g.arc(256, 256, 222, a0 + (a1 - a0) * .8, a1); g.stroke(); }
  g.strokeStyle = f; g.fillStyle = f; g.lineCap = 'round';
  for (let i = 0; i <= nMinor; i++) { const a = a0 + (a1 - a0) * i / nMinor, mj = i % per === 0; g.lineWidth = mj ? 9 : 3.5; g.beginPath(); g.moveTo(256 + Math.cos(a) * (mj ? 192 : 210), 256 + Math.sin(a) * (mj ? 192 : 210)); g.lineTo(256 + Math.cos(a) * 232, 256 + Math.sin(a) * 232); g.stroke(); }
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '600 48px "Barlow Condensed", "Arial Narrow", sans-serif';
  for (let v = 0; v <= max; v += step) { const a = a0 + (a1 - a0) * v / max; g.fillText(String(v), 256 + Math.cos(a) * 152, 256 + Math.sin(a) * 152); }
  g.font = '500 30px "Barlow Condensed", "Arial Narrow", sans-serif'; g.fillText(kind === 'giri' ? 'x1000 giri/min' : 'km/h', 256, 352);
  if (kind !== 'giri') { g.fillStyle = b; g.strokeStyle = f; g.lineWidth = 3; g.fillRect(206, 380, 100, 34); g.strokeRect(206, 380, 100, 34); g.fillStyle = f; g.font = '500 26px monospace'; g.fillText('012345', 256, 398); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return (DIALTX[key] = t);
}
/* strumento rotondo: asse +y verso chi guarda, alto quadrante = -z locale */
export function gauge(r, kind = 'kmh', bg = 'nero', bezel = 'chrome', body = 'gloss') {
  const g = new THREE.Group();
  g.add(mesh(lathe([[0, -.034], [r * .9, -.034], [r * 1.06, -.03], [r * 1.12, -.02], [r * 1.13, -.004], [r * 1.12, 0]], 96, .002), metal(body, 'Corpo strumento')));
  g.add(mesh(lathe([[r * .985, -.002], [r * 1.15, -.002], [r * 1.17, .003], [r * 1.13, .0085], [r * 1.0, .0072]], 96, .0008), metal(bezel, 'Ghiera strumento')));
  const dial = new THREE.CircleGeometry(r, 96); dial.rotateX(-PI / 2); g.add(mesh(dial, new THREE.MeshPhysicalMaterial({ name: 'Quadrante', map: dialTex(kind, bg), roughness: .55 })));
  const nd = new THREE.Group(), red = new THREE.MeshPhysicalMaterial({ name: 'Lancetta', color: 0xd51a10, emissive: 0x500000, roughness: .4 });
  const ng = new THREE.BoxGeometry(r * .82, .0012, r * .028); ng.translate(r * .3, 0, 0); nd.add(mesh(ng, red)); nd.position.y = .0016; nd.rotation.y = -(PI * .75 + PI * 1.5 * .32) ; g.add(nd);
  const hub = mesh(new THREE.CylinderGeometry(r * .09, r * .1, .003, 32), metal('gloss', 'Mozzo lancetta')); hub.position.y = .002; g.add(hub);
  const gl = new THREE.SphereGeometry(r * 3, 96, 8, 0, 2 * PI, 0, Math.asin(1 / 3)); gl.translate(0, -r * 3 * Math.cos(Math.asin(1 / 3)) + .006, 0);
  g.add(mesh(gl, new THREE.MeshPhysicalMaterial({ name: 'Vetro strumento', color: 0xffffff, roughness: 0, transmission: 1, thickness: .001, ior: 1.5 })));
  return g;
}

/* =============================== CARENE, CUPOLINI E FLYSCREEN ===============================
   Tutte le misure derivano dal diametro del faro D (5¾" = 146 mm, 7" = 178 mm), come nei prodotti reali:
   flyscreen 250-280 × 230-320 mm (lastra 4 mm) · cupolino café ≈ 2,3 D di larghezza, profondo quasi quanto largo, aperto sotto
   mezza carena 390-430 mm con anello completo e incavi semimanubri · club style sfaccettata 480 × 440 × 330 mm
   batwing 900-1000 × 430 × 170-290 mm (forcella) · shark nose 880 × 440 × 390 mm a doppio faro (telaio). */
const lensR = o => ({ '5.75': .073, '7': .0889 }[o.faro_d] || .0889);
function fairingFn(c) {
  const g0 = c.cut || 0;
  return (u, v) => {
    const th = g0 ? (-PI / 2 + g0) + v * (2 * PI - 2 * g0) : v * 2 * PI, cs = Math.cos(th), sn = Math.sin(th), B = sn >= 0 ? c.Bu : c.Bd, nn = sn >= 0 ? c.n : c.nd;
    let rmax = 1 / Math.pow(Math.pow(Math.abs(cs) / c.A, nn) + Math.pow(Math.abs(sn) / B, nn), 1 / nn);
    const dth = ((th - 1.5 * PI) % (2 * PI) + 3 * PI) % (2 * PI) - PI, gss = Math.exp(-Math.pow(dth / .42, 2));
    if (c.legs) rmax *= 1 - c.legs * gss; rmax = Math.max(rmax, c.R0 + .014);
    let E = sn >= 0 ? c.Eside + (c.Etop - c.Eside) * Math.pow(sn, c.pt ?? 2) : c.Eside + (c.Elow - c.Eside) * Math.pow(-sn, c.pe ?? 2); if (c.legs) E *= 1 - (c.legsE ?? 1) * gss;
    if (c.notch) { const d1 = th - c.thn, d2 = ((th - (PI - c.thn)) % (2 * PI) + 3 * PI) % (2 * PI) - PI; E -= c.notch * (Math.exp(-Math.pow(d1 / c.wn, 2)) + Math.exp(-Math.pow(d2 / c.wn, 2))); E = Math.max(E, .02); }
    const a = c.D, b = rmax - c.R0, Lq = PI / 2 * Math.sqrt((a * a + b * b) / 2), s = u * (Lq + E);
    let x, r; if (s <= Lq) { const t = s / Lq * PI / 2; r = c.R0 + b * Math.sin(t); x = -a * (1 - Math.cos(t)); } else { const e = s - Lq; r = rmax * (1 + (c.flare || 0) * e / Math.max(1e-6, E)); x = -a - e; }
    let z = r * cs, y = r * sn; const fl = clamp((r - c.R0) / Math.max(1e-6, rmax - c.R0), 0, 1);
    x -= (c.sweep || 0) * Math.pow(z / c.A, 2); y -= (c.droop || 0) * Math.pow(z / c.A, 2) * fl;
    if (c.rake) x += c.rake * Math.pow(Math.max(0, y) / c.Bu, 2) * fl;
    if (c.vtop && y > 0) y += c.vtop * (y / c.Bu) * Math.max(0, 1 - Math.abs(z) / c.A) * fl;
    return V3(x, y, z);
  };
}
const th2v = (c, th) => c.cut ? (th - (-PI / 2 + c.cut)) / (2 * PI - 2 * c.cut) : (((th % (2 * PI)) + 2 * PI) % (2 * PI)) / (2 * PI);
/* parabrezza che prosegue il guscio (tangente) con gradino visibile, guarnizione e viti */
function screenOn(S, c, o, G, cfg) {
  const base = a => { const th = cfg.v1 !== undefined ? a : cfg.th1 + (cfg.th2 - cfg.th1) * a, v = cfg.v1 !== undefined ? cfg.v1 + (cfg.v2 - cfg.v1) * a : th2v(c, th), u = cfg.uAt(th), n = S.nAt(u, v), t = S.at(Math.min(1, u + .012), v).sub(S.at(Math.max(0, u - .012), v)).normalize(); return { p: S.at(u, v).addScaledVector(n, .0042), n, t }; };
  const prof = cfg.prof || (q => .42 + .58 * Math.sqrt(Math.max(0, 1 - Math.pow(Math.abs(q), 2.4))));
  const fn = (h, a) => { const b = base(a), Hs = cfg.Hc * prof(2 * a - 1), up = V3(-Math.sin(cfg.lean), Math.cos(cfg.lean), b.n.z * .18).normalize(), P1 = b.p.clone().addScaledVector(b.t, cfg.tan), P2 = P1.clone().addScaledVector(up, Hs);
    return b.p.clone().multiplyScalar((1 - h) * (1 - h)).addScaledVector(P1, 2 * h * (1 - h)).addScaledVector(P2, h * h); };
  const SS = shell(fn, 30, 72, { thick: .004, rimSeg: 5 }); const sm = screenMat(o.parabrezza); G.add(mesh(SS.geo, [sm, sm], false));
  const trim = []; for (let i = 0; i <= 90; i++) { const b = base(i / 90); trim.push(b.p.addScaledVector(b.n, -.0016)); } G.add(mesh(tubeAlong(new THREE.CatmullRomCurve3(trim), .0026, 180, 8), rubber('Guarnizione parabrezza')));
  const vm = metal(o.viteria || 'satin', 'Viteria parabrezza');
  for (const a of cfg.screws || [.06, .28, .5, .72, .94]) { const b = base(a), q = b.p.clone().addScaledVector(b.t, .014).addScaledVector(b.n, .0042);
    const wsh = mesh(lathe([[.0028, 0], [.0062, 0], [.0062, .0012], [.0028, .0012]], 24, .0003), rubber('Gommini')); orient(wsh, b.n); wsh.position.copy(q); G.add(wsh);
    const sc = buttonScrew(.0055, vm, darkMat()); orient(sc, b.n); sc.position.copy(q).addScaledVector(b.n, .0012); G.add(sc); }
  return SS;
}
function headlightIn(o, G, R, x = 0, att = 'laterale') { if (o.faro === 'no') return null; const hl = PRO_DEFS.faro.build({ diametro: o.faro_d, stile: o.faro, finitura: 'gloss', ghiera: o.ghiera, visiera: 'no', calotta: 'si', attacco: att }); hl.position.x = x - R * .124 - .006; G.add(hl); return hl; }
function gasket(G, R, R0, x = 0) { const gk = mesh(lathe([[R * 1.1, -.012], [R0 + .002, -.012], [R0 + .003, -.002], [R0 - .002, .001], [R * 1.1, 0], [R * 1.1, -.012]], 128, .0008), rubber('Guarnizione faro')); gk.rotation.z = -PI / 2; gk.position.x = x; G.add(gk); }
function earBrackets(G, S, c, R, uv) { // staffe piatte dal guscio alle orecchie del faro (visibili da sotto)
  const bm = metal('wrinkle', 'Staffe cupolino');
  for (const s of [1, -1]) { const v = th2v(c, s > 0 ? uv[1] : PI - uv[1]), p = S.at(uv[0], v).addScaledVector(S.nAt(uv[0], v), -.008), e = V3(-.45 * R, 0, s * (R + .022));
    G.add(mesh(new THREE.ExtrudeGeometry(roundRect(.003, .02, .001), { steps: 40, bevelEnabled: false, extrudePath: bentPath([p, V3(p.x, (p.y + e.y) / 2, (p.z + e.z) / 2 + s * .01), e], .015) }), bm));
    const nt = mesh(hexPrism(.013, .006, 0), metal('chrome', 'Viteria')); nt.rotation.x = s * PI / 2; nt.position.copy(e).add(V3(0, 0, s * .005)); G.add(nt); } }

/* --- flyscreen / mascherina: lastra singola con incavo a U sopra la ghiera del faro --- */
function buildFlyscreen(o, G, R) {
  const Rg = R * 1.128, Rn = Rg + .004, dims = { basso: [.25, .23, .2], classico: [.275, .275, .24], alto: [.28, .32, .28] }[o.forma_fly] || [.275, .275, .24];
  const alu = o.materiale === 'alluminio', [W, Ht, hn] = alu ? (o.forma_fly === 'basso' ? [.22, .14, .11] : [.26, .2, .17]) : dims, nd = Ht - hn, Wt = W * (o.forma_fly === 'basso' ? .62 : .8);
  const phi0 = Math.asin(clamp(1 - nd / Rn, -1, 1)), sn = Rn * Math.cos(phi0);
  const bot = [[-W / 2, -nd], [-sn - .002, -nd]]; for (let i = 0; i <= 40; i++) { const f = PI - phi0 - (PI - 2 * phi0) * i / 40; bot.push([Rn * Math.cos(f), -Rn + Rn * Math.sin(f)]); } bot.push([sn + .002, -nd], [W / 2, -nd]);
  const topC = new THREE.CatmullRomCurve3([[-W / 2, -nd], [-W / 2 * .985, hn * .3], [-Wt / 2, hn * .8], [-Wt / 2 * .55, hn * .975], [0, hn], [Wt / 2 * .55, hn * .975], [Wt / 2, hn * .8], [W / 2 * .985, hn * .3], [W / 2, -nd]].map(p => V3(p[0], p[1], 0)), false, 'centripetal');
  const botC = new THREE.CurvePath(); for (let i = 1; i < bot.length; i++) botC.add(new THREE.LineCurve3(V3(bot[i - 1][0], bot[i - 1][1], 0), V3(bot[i][0], bot[i][1], 0)));
  const Rc = alu ? .5 : .26, tau = (alu ? 12 : 24) * PI / 180, y0 = Rg + .005, x0 = -.012;
  const map = (s, h) => { const X = Rc * (Math.cos(s / Rc) - 1), Z = Rc * Math.sin(s / Rc); return V3(x0 + X * Math.cos(tau) - h * Math.sin(tau), y0 + X * Math.sin(tau) + h * Math.cos(tau), Z); };
  const fn = (u, v) => { const b = botC.getPointAt(v), t = topC.getPointAt(v); return map(b.x + (t.x - b.x) * u, b.y + (t.y - b.y) * u); };
  const mat = alu ? metal(o.finitura_alu || 'brushed', 'Mascherina alluminio') : screenMat(o.parabrezza === 'no' ? 'fume' : o.parabrezza);
  const S = shell(fn, 34, 120, { thick: alu ? .002 : .004, rimSeg: 5 }); G.add(mesh(S.geo, [mat, mat], !alu ? false : true));
  const bm = metal('wrinkle', 'Staffe flyscreen'), vm = metal('chrome', 'Viteria');
  for (const s of [1, -1]) { const zs = s * (R + .02), sv = Rc * Math.asin(clamp(zs / Rc, -1, 1)), a = map(sv, .03), nrm = map(sv, .031).sub(a).normalize(), back = V3(-Math.cos(tau), -Math.sin(tau), 0), e = V3(-.45 * R, 0, s * (R + .022));
    const p0 = a.clone().addScaledVector(back, .0045);
    G.add(mesh(new THREE.ExtrudeGeometry(roundRect(.0032, .02, .001), { steps: 50, bevelEnabled: false, extrudePath: bentPath([p0.clone().add(V3(0, .025, 0)), p0, p0.clone().add(V3(-.025, -.02, 0)), V3(e.x + .012, e.y + .03, e.z), e], .012) }), bm));
    for (const hh of [.03, .055]) { const q = map(sv, hh), fw = V3(Math.cos(tau), Math.sin(tau), 0); const g = mesh(lathe([[.0028, 0], [.0065, 0], [.0065, .0014], [.0028, .0014]], 24, .0003), rubber('Gommini')); orient(g, fw); g.position.copy(q).addScaledVector(fw, alu ? .001 : .002); G.add(g);
      const sc = buttonScrew(.0055, vm, darkMat()); orient(sc, fw); sc.position.copy(q).addScaledVector(fw, alu ? .0024 : .0034); G.add(sc); }
    const nt = mesh(hexPrism(.013, .006, 0), vm); nt.rotation.x = s * PI / 2; nt.position.copy(e).add(V3(0, 0, s * .005)); G.add(nt); }
  headlightIn(o, G, R, 0, 'laterale');
}

/* --- cupolino café / bikini: superficie a sezioni (loft) come in un progetto CAD ---
   sezioni trasversali a profondità crescente: anello attorno al faro → faccia inclinata → fianchi; guscio aperto sotto,
   bordo inferiore che sale in diagonale verso il retro, faro basso, plexi separato sul bordo superiore. */
function loftFn(secs, NV = 160) {
  const S = secs.map(s => { const full = [...s.half, ...s.half.slice(0, -1).reverse().map(p => [-p[0], p[1], p[2] || 0])];
    const crv = new THREE.CatmullRomCurve3(full.map(p => V3(s.x + (p[2] || 0), p[1], p[0])), false, 'centripetal'); return crv.getSpacedPoints(NV); });
  const n = S.length;
  const evalJ = (u, j) => { const f = clamp(u, 0, 1) * (n - 1), i = Math.min(n - 2, Math.floor(f)), t = f - i, P = k => S[clamp(k, 0, n - 1)][j];
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2), t2 = t * t, t3 = t2 * t;
    return V3(0, 0, 0).addScaledVector(p0, -.5 * t3 + t2 - .5 * t).addScaledVector(p1, 1.5 * t3 - 2.5 * t2 + 1).addScaledVector(p2, -1.5 * t3 + 2 * t2 + .5 * t).addScaledVector(p3, .5 * t3 - .5 * t2); };
  return (u, v) => { const jf = clamp(v, 0, 1) * NV, j0 = Math.min(NV - 1, Math.floor(jf)), fr = jf - j0; return evalJ(u, j0).lerp(evalJ(u, j0 + 1), fr); };
}
const arcHalf = (r, a0, sy = 1, n = 7, dx = 0) => Array.from({ length: n }, (_, k) => { const a = a0 + (PI / 2 - a0) * k / (n - 1); return [r * Math.cos(a), r * Math.sin(a) * sy, dx]; });
function cafeSections(R, forma) {
  const k = R / .0889, Rg = R * 1.128, R0 = Rg + .007, sq = forma === 'squadrata', dr = forma === 'goccia';
  const K = p => [p[0] * k, p[1] * k, (p[2] || 0) * k];
  const sec = [{ x: 0, half: arcHalf(R0, -.42) }, { x: -.012 * k, half: arcHalf(R0 + .012 * k, -.4, 1.02) }, { x: -.034 * k, half: arcHalf(R0 + .032 * k, -.36, 1.05) }];
  if (sq) sec.push({ x: -.08 * k, half: [[.158, -.032], [.172, .03], [.17, .11], [.14, .165], [.075, .19], [0, .196]].map(K) }, { x: -.15 * k, half: [[.172, .004], [.188, .066], [.186, .15], [.152, .2], [.08, .222], [0, .228]].map(K) }, { x: -.23 * k, half: [[.178, .052], [.194, .1], [.192, .178], [.158, .222], [.085, .238], [0, .243, .025]].map(K) });
  else if (dr) sec.push({ x: -.08 * k, half: [[.145, -.06], [.168, .01], [.16, .1], [.118, .158], [.058, .19], [0, .205]].map(K) }, { x: -.15 * k, half: [[.16, -.03], [.182, .05], [.172, .14], [.125, .195], [.06, .226], [0, .24]].map(K) }, { x: -.23 * k, half: [[.166, .03], [.188, .09], [.176, .17], [.128, .218], [.062, .244], [0, .256, .025]].map(K) });
  else sec.push({ x: -.08 * k, half: [[.152, -.04], [.172, .03], [.162, .115], [.122, .168], [.062, .19], [0, .196]].map(K) }, { x: -.15 * k, half: [[.168, -.004], [.188, .07], [.176, .155], [.13, .205], [.066, .224], [0, .229]].map(K) }, { x: -.23 * k, half: [[.174, .048], [.194, .105], [.18, .18], [.134, .222], [.068, .24], [0, .245, .025]].map(K) });
  return sec;
}
function buildCafe(o, G, R, P = {}) {
  // cupolino café: muso ARROTONDATO (contorno ovale, faccia bombata, raccordo ampio), faro dietro una copertura
  // trasparente o fumé a cupola con cornice, fianchi con taglio concavo dietro in basso, cupola in plexi avvitata sopra.
  const k = R / .0889, Rg = R * 1.128, R0 = Rg + .007, ov = o.forma === 'ovale' && !P.big, dr = o.forma === 'goccia' && !P.big;
  const yt = (P.yt ?? .145) * k, hw = (P.hw ?? (ov ? .195 : .178)) * k, yb = (P.yb ?? (dr ? -.17 : -.145)) * k, Rs = (P.Rs ?? .16) * k, rf = (P.rf ?? .06) * k;
  const half = []; for (let i = 0; i <= 24; i++) { const a = -PI / 2 + PI * i / 24, ca = Math.cos(a), sa = Math.sin(a), lowN = dr ? 1.45 : 2.3, nn = sa < 0 ? lowN : 2.3;
    half.push([hw * Math.pow(Math.abs(ca), 2 / nn), (sa < 0 ? -yb : yt) * Math.sign(sa) * Math.pow(Math.abs(sa), 2 / nn)]); }
  half[0] = [0, yb]; half[24] = [0, yt];
  // profilo laterale a «C»: braccio superiore lungo, incavo semicircolare a metà fianco, mascella inferiore che rientra a punta
  const psiTop = P.psiTop ?? 44, Earm = (P.Earm ?? .25) * k, Ec = (P.Ec ?? .07) * k, psiC = P.psiC ?? 103, wC = P.wC ?? 24, Ejaw = (P.Ejaw ?? .2) * k, Ebot = (P.Ebot ?? .06) * k;
  const c = { R0, rho: starTable(mirrorPoly(half)), rf, draft: 0, uF: .52, uR: .66,
    face: (z, y, r) => -Math.max(0, r * r - R0 * R0) / (2 * Rs),
    E: (th) => { const deg = Math.abs(angTo(th, PI / 2)) * 180 / PI; if (deg < psiTop) return .004;
      let E; if (deg < psiC - wC) E = Earm * sstep(psiTop, psiTop + 7, deg) + .004;
      else if (deg <= psiC + wC) { const q = (deg - psiC) / wC, base = deg < psiC ? Earm : Ejaw; E = base - (base - Ec) * Math.sqrt(Math.max(0, 1 - q * q)); }
      else { const t = clamp((deg - psiC - wC) / (180 - psiC - wC), 0, 1); E = Ejaw + (Ebot - Ejaw) * Math.pow(t, 1.8); }
      return Math.max(.008, E); } };
  const S = shell(faceFairingFn(c), 110, 240, { thick: .0035, closeV: true }); const pm = paint(o.colore, o.vernice, 'Vernice carena'), im = o.interno === 'tinta' ? pm : fiber(); if (im !== pm) im.name = 'Interno carena';
  G.add(mesh(S.geo, [pm, im])); headlightIn(o, G, R, -.014, P.big ? 'inferiore' : 'laterale');
  { // copertura del faro: cupola trasparente o fumé a filo del muso, cornice in gomma
    const Rl = R0 + .003, sag = .046 * k, pr = []; for (let i = 0; i <= 24; i++) { const r = Rl * i / 24; pr.push([r, sag * (1 - Math.pow(r / Rl, 2)) + .002]); }
    pr.push([Rl, -.002]); for (let i = 24; i >= 0; i--) { const r = (Rl - .001) * i / 24; pr.push([r, sag * (1 - Math.pow(r / Rl, 2)) - .001]); }
    if (o.coprifaro !== 'no') { const lm = screenMat(o.coprifaro === 'fume' ? 'fume' : 'chiaro'); lm.name = 'Copertura faro'; const lc = mesh(new THREE.LatheGeometry(pr.map(p => new THREE.Vector2(p[0], p[1])), 128), lm, false); lc.rotation.z = -PI / 2; G.add(lc); }
    const bz = mesh(new THREE.TorusGeometry(Rl + .001, .0042, 12, 160), o.ghiera && o.ghiera !== 'gloss' ? metal(o.ghiera, 'Cornice copertura') : rubber('Cornice copertura')); bz.rotation.y = PI / 2; bz.position.x = .0015; G.add(bz);
    const vb = metal(o.viteria || 'satin', 'Viteria cornice'); for (let i = 0; i < 8; i++) { const a2 = i / 8 * 2 * PI + PI / 8, sc = buttonScrew(.005, vb, darkMat()); orient(sc, V3(1, 0, 0)); sc.position.set(.004, Math.sin(a2) * (Rl + .009), Math.cos(a2) * (Rl + .009)); G.add(sc); } }
  if (o.parabrezza !== 'no') { // cupola: quarto di superellissoide, base a U che abbraccia il bordo superiore
    const H = o.altezza / 100 * (P.scrK ?? 1), n = 3.2, ax = (P.scrAx ?? .26) * k, az = hw + .005, xTop = c.face(0, yt, yt) - rf * .55, xc = -ax, y0 = yt - .022 * k, sp = (a, e) => Math.sign(a) * Math.pow(Math.abs(a), e);
    const fn = (u, v) => { const lam = (v - .5) * PI, ph = u * PI / 2, cx = sp(Math.cos(lam), 2 / n), cz = sp(Math.sin(lam), 2 / n);
      return V3(xc + ax * cx * Math.cos(ph) + xTop, y0 + H * Math.pow(Math.sin(ph), .9), az * cz * Math.cos(ph)); };
    const SS = shell(fn, 30, 90, { thick: .004, rimSeg: 5 }); const sm = screenMat(o.parabrezza); G.add(mesh(SS.geo, [sm, sm], false));
    const base = []; for (let i = 0; i <= 90; i++) base.push(fn(0, i / 90).add(V3(0, .001, 0))); G.add(mesh(tubeAlong(new THREE.CatmullRomCurve3(base), .0028, 180, 8), rubber('Guarnizione parabrezza')));
    const vm = metal(o.viteria || 'satin', 'Viteria parabrezza');
    for (const v of [.04, .2, .36, .5, .64, .8, .96]) { const p = fn(.06, v), nn = SS.nAt(.06, v); const w = mesh(lathe([[.0028, 0], [.0062, 0], [.0062, .0012], [.0028, .0012]], 24, .0003), rubber('Gommini')); orient(w, nn); w.position.copy(p).addScaledVector(nn, .004); G.add(w);
      const scw = buttonScrew(.0055, vm, darkMat()); orient(scw, nn); scw.position.copy(p).addScaledVector(nn, .0052); G.add(scw); } }
  if (o.striscia !== 'no') G.add(stripeOn(S, o, .02, .5, .25, .016, 60));
  const bm = metal('wrinkle', 'Staffe cupolino');
  for (const s2 of [1, -1]) { const v = s2 > 0 ? .02 : .48, p = S.at(.8, v).addScaledVector(S.nAt(.8, v), -.008), e = V3(-.45 * R, 0, s2 * (R + .022));
    G.add(mesh(new THREE.ExtrudeGeometry(roundRect(.003, .02, .001), { steps: 40, bevelEnabled: false, extrudePath: bentPath([p, V3((p.x + e.x) / 2, (p.y + e.y) / 2, (p.z + e.z) / 2 + s2 * .004), e], .012) }), bm));
    const nt = mesh(hexPrism(.013, .006, 0), metal('chrome', 'Viteria')); nt.rotation.x = s2 * PI / 2; nt.position.copy(e).add(V3(0, 0, s2 * .005)); G.add(nt); }
  return S;
}

/* --- cupolino café RICALCATO dalle foto: guscio a sezioni (loft) intorno al faro, contorni laterali presi dalle foto ---
   unità = raggio dell'apertura faro R0 (scala con il faro 5¾" / 7"); x avanti, y su, origine al centro del faro.
   W/T/B: semilarghezza, sommità (plexi) e fondo lungo x · Dt/Ds/Db: profondità del muso sopra/ai lati/sotto il faro
   A: sagoma laterale del guscio (braccio, incavo a «C», mascella, fondo) · Bs: sagoma laterale del plexi · J: linea di giunzione. */
export const CAFE_PROF = {
  // foto 1 — contorni ricalcati per proiezione dalla foto sulla superficie (lato destro), giunzione con profilo cromato e 5 viti
  tonda: { W: [[.26, 2.1], [-.7, 1.92], [-1.94, 1.82], [-4.6, 1.86]], T: [[.26, 2.52], [-1.14, 2.8], [-2.3, 2.76], [-3.1, 2.68], [-4.6, 2.5]], B: [[.26, -.9], [-.7, -1.3], [-1.3, -1.45], [-4.6, -1.55]],
    nU: 2.8, nL: 2.4, Dt: 1.11, Ds: .21, Db: .94, q: 1.85, L: 4.6, gap: [.5, -.79], strip: 1, screws: 5,
    A: [[.8, 1.79], [-.05, 1.79], [-.6, 1.775], [-1.3, 1.72], [-2.3, 1.69], [-3.21, 1.667], [-3.6, 1.6], [-3.66, 1.45], [-3.59, 1.356], [-3.28, 1.228], [-3.067, 1.164], [-1.725, .925], [-1.52, .869], [-1.387, .797],
      [-1.3, .708], [-1.246, .587], [-1.232, .44], [-1.289, .214], [-1.417, .007], [-1.608, -.155], [-1.873, -.295], [-2.098, -.346], [-2.355, -.346], [-2.906, -.253], [-3.662, -.092], [-3.8, -.09], [-3.88, -.16],
      [-3.88, -.29], [-3.822, -.403], [-3.737, -.495], [-3.608, -.568], [-3.38, -.644], [-1.975, -.93], [-.985, -1.197], [-.633, -1.249], [-.18, -1.27], [.2, -1.45], [.8, -1.45]],
    J: [[.8, 1.79], [-.6, 1.775], [-2.3, 1.69], [-3.25, 1.665]],
    Bs: [[.8, 1.72], [-.6, 1.705], [-2.3, 1.62], [-3.3, 1.6], [-3.32, 2.0], [-3.2, 2.45], [-2.8, 2.8], [-1.5, 3.0], [.8, 3.1]] },
  // foto 3/4 — maschera bassa con incavo a «C» ricalcato, plexi a bolla fino alla cornice del faro, viti nere sulla giunzione
  ovale: { W: [[0.3, 1.81], [-0.8, 1.8], [-2.5, 1.84], [-4.1, 1.8]], T: [[0.3, 2.25], [-1.5, 2.78], [-3, 2.3], [-3.8, 1.9], [-4.1, 1.85]], B: [[0.3, -1.02], [-0.6, -1.28], [-1.3, -1.36], [-4.1, -1.4]],
    nU: 2.6, nL: 2.2, Dt: 2.6, Ds: 0.8, Db: 0.55, q: 1.8, L: 4.1, gap: [.5, -1.3], strip: 0, screws: 6,
    A: [[.8, .95], [-.005, .945], [-.234, .911], [-3.166, 1.032], [-3.256, 1.011], [-3.26, .964], [-3.195, .837], [-3.151, .785], [-3.088, .753], [-1.497, .505], [-1.29, .418], [-1.124, .268], [-1.03, .11],
      [-.994, -.039], [-1.014, -.184], [-1.085, -.301], [-1.192, -.384], [-1.306, -.428], [-1.764, -.445], [-1.816, -.475], [-1.804, -.527], [-1.707, -.663], [-1.474, -.92], [-1.453, -1.032], [-1.481, -1.212],
      [-1.0, -1.19], [-.579, -1.15], [-.314, -1.093], [.1, -1.3], [.8, -1.3]],
    J: [[.8, .95], [-.234, .911], [-3.17, 1.032]],
    Bs: [[.8, .88], [-.234, .84], [-3.25, .96], [-3.5, 1.5], [-3.42, 2.05], [-2.8, 2.45], [-1.5, 2.7], [.8, 2.85]] }
};
// foto 2 — mezza carena café lunga: braccio lungo con plexi, grande incavo, mascella che corre verso il motore
CAFE_PROF.lunga = { W: [[.26, 1.86], [-.7, 1.92], [-2, 1.9], [-11, 1.85]], T: [[.26, 2.6], [-2, 2.7], [-6, 2.5], [-11, 2.3]], B: [[.26, -1.4], [-1.5, -1.7], [-11, -1.75]],
  nU: 2.6, nL: 2.4, Dt: .9, Ds: .45, Db: .6, q: 2, L: 11, gap: [.5, -.9], strip: 0, screws: 6,
  A: [[.8, 2.4], [-11, 2.4], [-11, -1.8], [.8, -1.8]], J: [[.8, 2.4], [-11, 2.4]], Bs: [[.8, 2.33], [-8, 2.3], [-8.2, 2.6], [.8, 2.9]] };
CAFE_PROF.goccia = CAFE_PROF.tonda;
function cafeLoft(P, s) {
  const Wf = mono(P.W), Tf = mono(P.T), Bf = mono(P.B), nU = P.nU ?? 2.3, nL = P.nL ?? 2, q = P.q ?? 2, uN = P.uN ?? .36, L = P.L;
  const rsec = (cs, sn, x) => { const w = Wf(x); if (sn >= 0) { const t = Tf(x); return Math.pow(Math.pow(Math.abs(cs) / w, nU) + Math.pow(sn / t, nU), -1 / nU); } const b = -Bf(x); return Math.pow(Math.pow(Math.abs(cs) / w, nL) + Math.pow(-sn / b, nL), -1 / nL); };
  const Dof = sn => sn >= 0 ? P.Ds + (P.Dt - P.Ds) * sn * sn : P.Ds + (P.Db - P.Ds) * sn * sn;
  const op = P.op ?? 1, rx = P.rimx, xr = sn => !rx ? 0 : sn >= 0 ? rx[1] + (rx[0] - rx[1]) * sn * sn : rx[1] + (rx[2] - rx[1]) * sn * sn;
  return { fn: (u, v) => { const th = v * 2 * PI, cs = Math.cos(th), sn = Math.sin(th), D = Dof(sn), o0 = xr(sn); let x, r;
      if (u <= uN) { const f = u / uN * PI / 2; x = o0 - D * (1 - Math.pow(Math.cos(f), 2 / q)); r = op + (rsec(cs, sn, o0 - D) - op) * Math.pow(Math.sin(f), 2 / q); }
      else { const e = (u - uN) / (1 - uN); x = o0 * (1 - e) - D - e * (L - D); r = rsec(cs, sn, x); }
      return V3(x * s, r * sn * s, r * cs * s); },
    uAtX: (x, th) => { const D = Dof(Math.sin(th)); return x >= -D ? uN : uN + (-x - D) / (L - D) * (1 - uN); } };
}
export function cafeProf(o) { let P = CAFE_PROF[o.forma] || CAFE_PROF.tonda;
  { const q = { ...P, ...(o._p || {}) }, kx = q.kx ?? 1, ky = q.ky ?? 1, kz = q.kz ?? 1, X = t => t.map(p => [p[0] * kx, p[1] * ky]);
    P = { ...q, W: q.W.map(p => [p[0] * kx, p[1] * kz]), T: X(q.T), B: X(q.B), A: X(q.A), Bs: X(q.Bs), J: X(q.J), L: q.L * kx, Dt: q.Dt * kx, Ds: q.Ds * kx, Db: q.Db * kx, gap: [q.gap[0], q.gap[1] * kx] }; }
  return P; }
export function cafeSkin(o) { const R = lensR(o), s = R * 1.128 + .007; return { fn: cafeLoft(cafeProf(o), s).fn, s }; }
function buildCafeT(o, G, R) { const P = cafeProf(o);
  const s = R * 1.128 + .007, SK = cafeLoft(P, s), sdA = polySD(smoothClosedPts(P.A)), sdB = polySD(smoothClosedPts(P.Bs)), Jd = polyDist(P.J.length > 2 ? smoothOpenPts(P.J) : P.J), ga = P.gap[0], gx = P.gap[1];
  const shellSD = p => { const x = p.x / s, y = p.y / s, z = p.z / s, r = Math.hypot(y, z), th = Math.atan2(y, z); return Math.max(sdA(x, y), -Math.max((Math.abs(angTo(th, 1.5 * PI)) - ga) * r, x - gx)); };
  const S = trimSkin(SK.fn, P.NU ?? 160, P.NV ?? 320, shellSD, { thick: .0035 });
  const pm = paint(o.colore, o.vernice, 'Vernice carena'), im = o.interno === 'tinta' ? pm : fiber(); if (im !== pm) im.name = 'Interno carena';
  G.add(mesh(S.geo, [pm, im])); headlightIn(o, G, R, -.014, 'laterale');
  { // copertura del faro a cupola + cornice avvitata
    const Rl = s + .003, sag = .046 * R / .0889, pr = []; for (let i = 0; i <= 24; i++) { const r = Rl * i / 24; pr.push([r, sag * (1 - Math.pow(r / Rl, 2)) + .002]); }
    pr.push([Rl, -.002]); for (let i = 24; i >= 0; i--) { const r = (Rl - .001) * i / 24; pr.push([r, sag * (1 - Math.pow(r / Rl, 2)) - .001]); }
    if (o.coprifaro !== 'no') { const lm = screenMat(o.coprifaro === 'fume' ? 'fume' : 'chiaro'); lm.name = 'Copertura faro'; const lc = mesh(new THREE.LatheGeometry(pr.map(p => new THREE.Vector2(p[0], p[1])), 128), lm, false); lc.rotation.z = -PI / 2; G.add(lc); }
    const bz = mesh(new THREE.TorusGeometry(Rl + .001, .0042, 12, 160), o.ghiera && o.ghiera !== 'gloss' ? metal(o.ghiera, 'Cornice copertura') : rubber('Cornice copertura')); bz.rotation.y = PI / 2; bz.position.x = .0015; G.add(bz);
    const vb = metal(o.viteria || 'satin', 'Viteria cornice'); for (let i = 0; i < 8; i++) { const a2 = i / 8 * 2 * PI + PI / 8, sc = buttonScrew(.005, vb, darkMat()); orient(sc, V3(1, 0, 0)); sc.position.set(.004, Math.sin(a2) * (Rl + .009), Math.cos(a2) * (Rl + .009)); G.add(sc); } }
  const offS = .0032, thS = .004;
  if (o.parabrezza !== 'no') { const SS = trimSkin(SK.fn, 120, 280, p => sdB(p.x / s, p.y / s), { thick: thS, off: offS, rimK: 4 }); const sm = screenMat(o.parabrezza); G.add(mesh(SS.geo, [sm, sm], false)); }
  // giunzione guscio/plexi: profilo e viti seguono il bordo reale del guscio
  const run = edgeRun(S.loops, r => r.t && Jd(r.p.x / s, r.p.y / s) < .025 && r.t.y > .2);
  if (run.length > 6) { run.sort((a, b) => Math.atan2(a.p.z, -a.p.x) - Math.atan2(b.p.z, -b.p.x));
    const vm = metal(o.viteria || 'satin', 'Viteria parabrezza'), lift = o.parabrezza !== 'no' ? offS + thS : .0004;
    if (P.strip && o.parabrezza !== 'no') { const rr = run.map(r => ({ p: r.p.clone().addScaledVector(r.t, -.0045), n: r.n })); const rb = ribbonAlong(rr, .011, .0016, lift + .0002, metal(o.viteria === 'gloss' ? 'chrome' : (o.viteria || 'chrome'), 'Profilo plexi')); if (rb) G.add(rb.m); }
    const cum = [0]; for (let i = 1; i < run.length; i++) cum.push(cum[i - 1] + run[i].p.distanceTo(run[i - 1].p)); const Ltot = cum[cum.length - 1], ns = P.screws || 5;
    for (let m = 0; m < ns; m++) { const target = Ltot * (.04 + .92 * m / (ns - 1)); let i = cum.findIndex(c => c >= target); if (i < 0) i = run.length - 1; const r = run[i], q = r.p.clone().addScaledVector(r.t, -.0065).addScaledVector(r.n, lift + (P.strip ? .0016 : 0));
      if (!P.strip) { const w = mesh(lathe([[.0028, 0], [.0062, 0], [.0062, .0012], [.0028, .0012]], 24, .0003), rubber('Gommini')); orient(w, r.n); w.position.copy(q); G.add(w); }
      const sc = buttonScrew(.0055, vm, darkMat()); orient(sc, r.n); sc.position.copy(q).addScaledVector(r.n, P.strip ? 0 : .0012); G.add(sc); } }
  const bm = metal('wrinkle', 'Staffe cupolino');
  for (const s2 of [1, -1]) { const th = s2 > 0 ? 0 : PI, u = SK.uAtX(-.88, th), v = th / (2 * PI), p = S.at(u, v).addScaledVector(S.nAt(u, v), -.008), e = V3(-.45 * R, 0, s2 * (R + .022));
    G.add(mesh(new THREE.ExtrudeGeometry(roundRect(.003, .02, .001), { steps: 40, bevelEnabled: false, extrudePath: bentPath([p, V3((p.x + e.x) / 2, (p.y + e.y) / 2, (p.z + e.z) / 2 + s2 * .004), e], .012) }), bm));
    const nt = mesh(hexPrism(.013, .006, 0), metal('chrome', 'Viteria')); nt.rotation.x = s2 * PI / 2; nt.position.copy(e).add(V3(0, 0, s2 * .005)); G.add(nt); }
  return S;
}

/* ===================== carene grandi RICALCATE dalle foto: contorno frontale + superficie + pareti + aperture ===================== */
const sdRBox = (z, y, cz, cy, hw, hh, rc) => { const qx = Math.abs(z - cz) - hw + rc, qy = Math.abs(y - cy) - hh + rc; return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - rc; };
function faceSkin(c) { // c: yc (centro stella), rho(th), face(z,y)→x, rf, E(th), draft, roll (arrotondamento progressivo verso il bordo)
  const uF = c.uF ?? .62, uR = c.uR ?? .72, r0 = .002, roll = c.roll || 0, t0 = c.t0 ?? .72;
  return (u, v) => { const th = v * 2 * PI, cs = Math.cos(th), sn = Math.sin(th), Rm = c.rho(th), rf = Math.min(c.rf, Rm * .35), Ri = Rm - rf, xf = rr => c.face(rr * cs, c.yc + rr * sn) - roll * Math.pow(Math.max(0, (rr / Ri - t0) / (1 - t0)), 2); let r, x;
    if (u <= uF) { r = r0 + (Ri - r0) * (u / uF); x = xf(r); }
    else if (u <= uR) { const f = (u - uF) / (uR - uF) * PI / 2; r = Ri + rf * Math.sin(f); x = xf(Ri) - rf * (1 - Math.cos(f)); }
    else { const e = (u - uR) / (1 - uR) * c.E(th); r = Rm + (c.draft || 0) * e; x = xf(Ri) - rf - e; }
    return V3(x, c.yc + r * sn, r * cs); };
}
const mirrorHalf = half => smoothClosedPts([...half, ...half.slice(1, -1).reverse().map(p => [-p[0], p[1]])], 600);
function sheetOn(fnZY, poly, mat, G, o = {}) { // lastra sottile (deflettori, pannelli) con contorno frontale poly [[z,y],...]
  const zs = poly.map(p => p[0]), ys = poly.map(p => p[1]), z0 = Math.min(...zs) - .01, z1 = Math.max(...zs) + .01, y0 = Math.min(...ys) - .01, y1 = Math.max(...ys) + .01, sd = polySD(poly);
  const S = trimSkin((u, v) => { const z = z0 + (z1 - z0) * v, y = y0 + (y1 - y0) * u; return V3(fnZY(z, y), y, z); }, o.nu ?? 60, o.nv ?? 60, p => sd(p.z, p.y), { thick: o.thick ?? .003, closeV: false, flip: o.flip, rimK: 3 });
  G.add(mesh(S.geo, [mat, o.mat2 || mat], o.shadow ?? false)); return S;
}
/* batwing touring (forcella) — contorno ricalcato dalla foto frontale (mm dal centro faro), finestra faro squadrata, presa d'aria,
   fari supplementari 4", deflettori inferiori fumé, plexi con profilo e carenatura interna con strumenti. */
const BAT_HALF = [[0, .33], [.151, .33], [.298, .327], [.33, .31], [.378, .299], [.42, .288], [.458, .276], [.48, .265], [.503, .246], [.517, .228], [.526, .208], [.531, .183], [.533, .15], [.532, .124], [.527, .1],
  [.46, .087], [.405, .075], [.363, .055], [.338, .03], [.33, 0], [.33, -.04], [.331, -.089], [.337, -.144], [.335, -.185], [.3, -.205], [.2, -.212], [0, -.215]]; // ricalco proiettivo dalla foto frontale (m)
// superficie batwing: curvatura in pianta, due lobi bombati (le «ali»), avvallamento centrale sopra il faro, gondola del faro sporgente, gonna inferiore arretrata
export const BAT_FACE = { a: .8, lobe: .075, ly: .19, lw: .11, valley: .45, pod: .065, skirt: .07, top: .48 };
export function batFace(k = 1, F = BAT_FACE) { return (z, y) => { const zk = z / k, yk = y / k; return k * (-F.a * zk * zk + F.lobe * gss((yk - F.ly) / F.lw, 1) * (1 - F.valley * gss(zk / .13, 1)) + F.pod * gss(Math.hypot(zk, yk + .01) / .17, 1)
    - F.skirt * sstep(.08, -.06, yk) * sstep(.1, .24, Math.abs(zk)) - F.top * Math.max(0, yk - .22) ** 2); }; }
export function batSkin(o) { const f = batFace(1, { ...BAT_FACE, ...(o._f || {}) }); return { fn: faceSkin({ yc: .1, rho: () => .75, face: f, rf: .01, E: () => .05, uF: .97, uR: .985 }), s: 1 }; }
/* batwing: superficie con parametri geometrici adattati sulle foto prodotto (fronte + tre quarti) */
export const BAT2 = {"a2":0.75407,"a4":0.75628,"lean":0.60135,"yl":0.08608,"top":1.19335,"yt":0.01836,"lobe":0.06466,"ly":0.19234,"lw":0.07428,"valley":0.39424,"vw":0.11398,"hood":-0.01535,"hx":0.141,"hy":0.1555,"hy0":-0.03,"rc":0.04,"hb":0.00876,"skirt":0.02093,"sy0":-0.0001,"sy1":0.03168,"sz0":0.16417,"sz1":0.17986,"rw":0.02502,"rd":0.03385,"rp":2.23699,"or":0.114,"oy":0.0,"vb":0.00299,"vby":0.18845,"vbw":0.05486,"vbz":0.0646,"td":0.01072,"tk":0.98547,"vd":0.0189,"va":0.27552,"rwt":0.02716,"rdt":0.03213,"rtck":{"tx":[-0.62,-0.62,-0.62,-0.62,-0.4,-0.3,-0.2,-0.1,0.0,0.1,0.2,0.3,0.4,0.62,0.62,0.62,0.62],"ty":[-0.32,-0.32,-0.32,-0.32,-0.1,0.0,0.1,0.2,0.3,0.5,0.5,0.5,0.5],"c":[-0.008934,-0.012288,0.002982,0.005365,-0.002983,-0.001712,0.002092,-0.019624,-0.008241,-0.010171,-0.038057,0.020463,0.010978,0.023983,0.014419,-0.030534,-0.015037,-0.0061,0.00345,0.001125,-0.011602,0.002585,-0.026242,0.011494,-0.001009,-0.007036,-0.009797,-0.006493,0.009208,-0.017048,-0.036132,-0.033187,-0.015849,-0.02488,-0.031564,-0.005222,0.005954,-0.009794,0.043651,0.011305,-0.004589,-0.002081,-0.036096,-0.006882,0.003398,-0.014564,-0.017273,0.028132,0.017767,0.009025,-0.03626,-0.010547,-0.029413,-0.004126,-0.0012,-0.039795,0.04944,0.000532,0.004099,-0.013177,-0.010243,-0.0001,-0.013252,-0.014564,-0.017273,0.028132,0.017767,0.009025,-0.03626,-0.010547,-0.029413,-0.004126,0.005954,-0.009794,0.043651,0.011305,-0.004589,-0.002081,-0.036096,-0.006882,0.003398,-0.006493,0.009208,-0.017048,-0.036132,-0.033187,-0.015849,-0.02488,-0.031564,-0.005222,0.00345,0.001125,-0.011602,0.002585,-0.026242,0.011494,-0.001009,-0.007036,-0.009797,-0.010171,-0.038057,0.020463,0.010978,0.023983,0.014419,-0.030534,-0.015037,-0.0061,-0.008934,-0.012288,0.002982,0.005365,-0.002983,-0.001712,0.002092,-0.019624,-0.008241],"full":1}};
export const BAT2_K = 0.87407; // scala: larghezza reale 965 mm
export let BAT2_ACC = {"WS":{"z":[-0.3721,-0.3514,-0.3307,-0.3101,-0.2894,-0.2687,-0.2481,-0.2274,-0.2067,-0.186,-0.1654,-0.1447,-0.124,-0.1034,-0.0827,-0.062,-0.0413,-0.0207,0.0,0.0207,0.0413,0.062,0.0827,0.1034,0.124,0.1447,0.1654,0.186,0.2067,0.2274,0.2481,0.2687,0.2894,0.3101,0.3307,0.3514,0.3721],"x":[-0.3331,-0.3327,-0.3474,-0.3636,-0.3564,-0.3525,-0.348,-0.3428,-0.3389,-0.3346,-0.3301,-0.3252,-0.3204,-0.3171,-0.3129,-0.3091,-0.306,-0.3036,-0.3029,-0.3035,-0.306,-0.3091,-0.3128,-0.317,-0.3203,-0.3251,-0.3299,-0.3339,-0.3387,-0.3425,-0.3478,-0.3533,-0.356,-0.3629,-0.3495,-0.3333,-0.3328],"y":[0.2845,0.2901,0.3033,0.322,0.325,0.3282,0.3317,0.334,0.3362,0.3379,0.34,0.3407,0.3407,0.3422,0.3422,0.3422,0.3422,0.3422,0.3422,0.3422,0.3422,0.3422,0.3422,0.3422,0.3407,0.3407,0.34,0.3378,0.3362,0.334,0.3318,0.3286,0.325,0.322,0.3042,0.2905,0.2845],"ux":[-0.8868,-0.8865,-0.8821,-0.8695,-0.8644,-0.8614,-0.8573,-0.8538,-0.8497,-0.8453,-0.8393,-0.835,-0.8309,-0.8249,-0.821,-0.8175,-0.8147,-0.8125,-0.812,-0.8125,-0.8146,-0.8175,-0.8209,-0.8248,-0.8308,-0.8349,-0.8393,-0.8455,-0.8496,-0.8538,-0.8572,-0.8609,-0.8644,-0.8691,-0.8818,-0.8865,-0.8868],"uy":[0.4621,0.4627,0.4711,0.4939,0.5027,0.508,0.5148,0.5205,0.5273,0.5342,0.5436,0.5503,0.5564,0.5652,0.5709,0.5759,0.5799,0.5829,0.5837,0.5829,0.58,0.576,0.571,0.5654,0.5565,0.5504,0.5437,0.534,0.5274,0.5206,0.5149,0.5087,0.5027,0.4946,0.4716,0.4628,0.4621],"h":[0.142,0.1446,0.148,0.1545,0.178,0.2009,0.2094,0.2142,0.2173,0.218,0.2195,0.2208,0.2226,0.2222,0.222,0.2229,0.223,0.223,0.222,0.223,0.223,0.2229,0.222,0.2222,0.2226,0.2208,0.2195,0.218,0.2173,0.2142,0.2094,0.2009,0.178,0.1545,0.148,0.1446,0.142],"zt":0.3127},"AUX":{"x":0.0074,"y":0.0385,"z":0.2344},"HL":{"x":0.0109,"y":0.023,"z":0.006},"DEFL":[[0.4988,0.1205],[0.5,0.11],[0.5062,0.1007],[0.5124,0.0942],[0.5169,0.0853],[0.5139,0.0722],[0.5081,0.0588],[0.5028,0.0452],[0.4961,0.0324],[0.4881,0.0205],[0.4779,0.0105],[0.4659,0.0027],[0.4527,-0.0031],[0.4389,-0.0076],[0.4248,-0.0112],[0.4106,-0.0149],[0.3968,-0.0194],[0.3839,-0.026],[0.3718,-0.0342],[0.3603,-0.0433],[0.3483,-0.05],[0.3351,-0.054],[0.3236,-0.0613],[0.3166,-0.0671],[0.3103,-0.0738],[0.3034,-0.0783],[0.2984,-0.0693],[0.2931,-0.0649],[0.2944,-0.0653],[0.2914,-0.0665],[0.2889,-0.0659],[0.2904,-0.0522],[0.2922,-0.0385],[0.294,-0.0247],[0.3001,-0.0126],[0.3068,-0.001],[0.3077,0.0129],[0.3071,0.0265],[0.3044,0.0405],[0.3019,0.0549],[0.301,0.0682],[0.304,0.0792],[0.3078,0.0878],[0.3115,0.0954],[0.3153,0.1029],[0.3244,0.1103],[0.3377,0.1132],[0.3523,0.1147],[0.367,0.1153],[0.3816,0.1154],[0.3963,0.1155],[0.411,0.1156],[0.4257,0.1156],[0.4404,0.1155],[0.4551,0.1152],[0.4698,0.1148],[0.4843,0.113],[0.4988,0.1107],[0.5132,0.1082],[0.5111,0.1128]]}; // accessori ricalcati dalla foto installata
export let BAT2_OUT = [[0.1195,0.3535],[0.1269,0.3527],[0.1346,0.3527],[0.1422,0.3527],[0.1498,0.3527],[0.1573,0.352],[0.1649,0.352],[0.1723,0.3513],[0.18,0.3513],[0.1872,0.3498],[0.1947,0.349],[0.2023,0.3489],[0.2096,0.3475],[0.2172,0.3474],[0.2246,0.346],[0.2321,0.3453],[0.2395,0.3445],[0.2468,0.3431],[0.2544,0.343],[0.2617,0.3415],[0.2691,0.3401],[0.2765,0.3391],[0.284,0.3385],[0.2913,0.337],[0.2986,0.3355],[0.306,0.3343],[0.3132,0.3324],[0.3191,0.3278],[0.3231,0.3213],[0.3274,0.3151],[0.3331,0.3102],[0.3397,0.3064],[0.3462,0.3031],[0.3533,0.3007],[0.3607,0.2989],[0.3674,0.2965],[0.3747,0.295],[0.3821,0.2935],[0.3895,0.2927],[0.397,0.292],[0.4043,0.2905],[0.4117,0.2887],[0.419,0.287],[0.4264,0.286],[0.4336,0.2845],[0.4409,0.283],[0.4478,0.2809],[0.455,0.2793],[0.4619,0.2775],[0.4689,0.2748],[0.4757,0.2722],[0.4828,0.2701],[0.4895,0.2673],[0.496,0.2635],[0.5024,0.2601],[0.5083,0.2558],[0.5141,0.251],[0.5197,0.2458],[0.5251,0.2404],[0.5305,0.235],[0.5354,0.2293],[0.5395,0.223],[0.5437,0.2167],[0.5469,0.2098],[0.5485,0.2024],[0.5498,0.195],[0.5488,0.1876],[0.5472,0.1802],[0.5489,0.1731],[0.5515,0.1662],[0.5523,0.1587],[0.552,0.1511],[0.5507,0.1437],[0.5522,0.1364],[0.5514,0.1292],[0.548,0.1225],[0.5429,0.1169],[0.5374,0.1116],[0.5314,0.107],[0.5247,0.1038],[0.5176,0.1014],[0.5106,0.0985],[0.5034,0.0965],[0.4961,0.0948],[0.4888,0.093],[0.4816,0.0907],[0.4743,0.0887],[0.4671,0.0869],[0.4598,0.0849],[0.4525,0.0825],[0.4453,0.0801],[0.4383,0.0772],[0.4314,0.074],[0.4244,0.0713],[0.4173,0.0689],[0.4104,0.0659],[0.4039,0.0621],[0.3979,0.0574],[0.3917,0.0542],[0.3859,0.0492],[0.3802,0.0442],[0.3749,0.0389],[0.3699,0.0331],[0.3649,0.0274],[0.3604,0.0214],[0.3559,0.0154],[0.3523,0.0091],[0.3483,0.0026],[0.3452,-0.0043],[0.3425,-0.0114],[0.3417,-0.0188],[0.342,-0.0262],[0.3395,-0.033],[0.337,-0.0401],[0.3355,-0.0473],[0.3333,-0.0542],[0.3303,-0.0608],[0.3275,-0.0675],[0.3237,-0.0738],[0.3188,-0.0795],[0.3134,-0.0849],[0.3069,-0.0883],[0.3004,-0.092],[0.2941,-0.095],[0.2867,-0.0967],[0.2792,-0.0978],[0.2717,-0.0989],[0.2642,-0.1003],[0.2566,-0.1003],[0.2491,-0.1008],[0.2416,-0.1018],[0.234,-0.1012],[0.2264,-0.101],[0.2189,-0.1018],[0.2113,-0.1018],[0.2036,-0.1018],[0.196,-0.1018],[0.1884,-0.1018],[0.1809,-0.101],[0.1743,-0.0973],[0.167,-0.0958],[0.1594,-0.0959],[0.1519,-0.096],[0.1445,-0.096],[0.1377,-0.0936],[0.1305,-0.0956],[0.123,-0.095],[0.1157,-0.0965],[0.1092,-0.1001],[0.103,-0.1045],[0.0971,-0.1092],[0.0913,-0.1141],[0.085,-0.1182],[0.0792,-0.1229],[0.0728,-0.1269],[0.0661,-0.1303],[0.0596,-0.1339],[0.0536,-0.1385],[0.0467,-0.1415],[0.0398,-0.1438],[0.0326,-0.1452],[0.0253,-0.1467],[0.0179,-0.146],[0.0104,-0.1452],[0.0028,-0.1452],[-0.0048,-0.1452],[-0.0125,-0.1452],[-0.0197,-0.1466],[-0.0272,-0.1461],[-0.0345,-0.1448],[-0.0417,-0.143],[-0.0485,-0.1407],[-0.0552,-0.1371],[-0.0612,-0.1325],[-0.0679,-0.1293],[-0.0746,-0.1259],[-0.0809,-0.1218],[-0.0866,-0.1168],[-0.0928,-0.1126],[-0.0985,-0.1076],[-0.1046,-0.103],[-0.1107,-0.0985],[-0.1176,-0.0958],[-0.125,-0.095],[-0.1325,-0.095],[-0.1394,-0.0947],[-0.1464,-0.0965],[-0.1539,-0.0965],[-0.1614,-0.0958],[-0.169,-0.0958],[-0.176,-0.0984],[-0.1828,-0.1014],[-0.1904,-0.1018],[-0.1981,-0.1018],[-0.2057,-0.1018],[-0.2133,-0.1018],[-0.2209,-0.1017],[-0.2285,-0.101],[-0.236,-0.1017],[-0.2436,-0.1017],[-0.251,-0.1003],[-0.2586,-0.1003],[-0.2663,-0.1002],[-0.2737,-0.0988],[-0.2811,-0.0973],[-0.2886,-0.0961],[-0.2956,-0.0939],[-0.3023,-0.0911],[-0.3087,-0.0876],[-0.3147,-0.0831],[-0.3201,-0.0777],[-0.3245,-0.0717],[-0.3281,-0.0652],[-0.3312,-0.0589],[-0.3337,-0.052],[-0.3353,-0.0449],[-0.3374,-0.0377],[-0.3401,-0.0308],[-0.3417,-0.0238],[-0.3416,-0.0164],[-0.3431,-0.0091],[-0.3455,-0.0019],[-0.349,0.0049],[-0.3529,0.0113],[-0.3568,0.0175],[-0.3613,0.0235],[-0.3658,0.0295],[-0.3708,0.0352],[-0.3761,0.0406],[-0.3815,0.046],[-0.3876,0.0506],[-0.3933,0.055],[-0.3992,0.0592],[-0.4055,0.0635],[-0.4122,0.067],[-0.4192,0.0696],[-0.4262,0.0722],[-0.4333,0.0749],[-0.4401,0.0783],[-0.4472,0.0809],[-0.4544,0.0833],[-0.4617,0.0857],[-0.4691,0.0873],[-0.4763,0.0892],[-0.4835,0.0914],[-0.4908,0.0932],[-0.498,0.0953],[-0.5054,0.097],[-0.5124,0.0995],[-0.5194,0.1022],[-0.5266,0.1045],[-0.533,0.1084],[-0.5388,0.1133],[-0.5442,0.1187],[-0.549,0.1246],[-0.5518,0.1316],[-0.5511,0.1388],[-0.5508,0.1461],[-0.5517,0.1536],[-0.5517,0.1612],[-0.551,0.1688],[-0.5479,0.1754],[-0.5473,0.1827],[-0.5487,0.19],[-0.5488,0.1975],[-0.5475,0.2049],[-0.5456,0.2122],[-0.5418,0.2188],[-0.5373,0.2248],[-0.5331,0.2311],[-0.5282,0.2368],[-0.5228,0.2422],[-0.5174,0.2476],[-0.5117,0.2526],[-0.5059,0.2575],[-0.4997,0.2608],[-0.4932,0.2647],[-0.4869,0.2684],[-0.48,0.271],[-0.4729,0.2733],[-0.4662,0.2759],[-0.459,0.2777],[-0.4521,0.2799],[-0.4449,0.2815],[-0.4379,0.2833],[-0.4306,0.2847],[-0.4233,0.286],[-0.4161,0.2875],[-0.4087,0.289],[-0.4013,0.2905],[-0.3939,0.292],[-0.3867,0.2935],[-0.3792,0.2943],[-0.3718,0.2954],[-0.365,0.298],[-0.3578,0.2995],[-0.3506,0.3018],[-0.3435,0.3043],[-0.3369,0.3075],[-0.3308,0.312],[-0.3254,0.3171],[-0.3214,0.3236],[-0.3169,0.3296],[-0.3104,0.3335],[-0.3031,0.3352],[-0.2956,0.3357],[-0.2883,0.337],[-0.281,0.3385],[-0.2736,0.34],[-0.2662,0.341],[-0.2586,0.3415],[-0.2514,0.343],[-0.2439,0.3438],[-0.2366,0.345],[-0.2292,0.346],[-0.2216,0.3463],[-0.2142,0.3475],[-0.2067,0.3483],[-0.1993,0.349],[-0.1916,0.349],[-0.1843,0.3501],[-0.1769,0.3513],[-0.1693,0.3513],[-0.1619,0.352],[-0.1542,0.352],[-0.1468,0.3527],[-0.1392,0.3527],[-0.1315,0.3527],[-0.1239,0.3527],[-0.1165,0.3535],[-0.109,0.3543],[-0.1014,0.3543],[-0.0938,0.3543],[-0.0862,0.3543],[-0.0785,0.3543],[-0.0709,0.3543],[-0.0633,0.3543],[-0.0557,0.3543],[-0.048,0.3543],[-0.0404,0.3543],[-0.0328,0.3543],[-0.0252,0.3543],[-0.0175,0.3543],[-0.0099,0.3543],[-0.0023,0.3543],[0.0053,0.3543],[0.013,0.3543],[0.0206,0.3543],[0.0282,0.3543],[0.0358,0.3543],[0.0434,0.3543],[0.0511,0.3543],[0.0587,0.3543],[0.0663,0.3543],[0.0739,0.3543],[0.0816,0.3543],[0.0892,0.3543],[0.0968,0.3543],[0.1044,0.3543],[0.1121,0.3543]], BAT2_VENT = [[0.0475,0.3085],[0.0528,0.3078],[0.0583,0.3078],[0.0638,0.3078],[0.0691,0.307],[0.0746,0.307],[0.0801,0.307],[0.0855,0.307],[0.091,0.307],[0.0963,0.3062],[0.1017,0.3055],[0.1071,0.3055],[0.1126,0.3055],[0.1181,0.3055],[0.1234,0.3048],[0.1287,0.304],[0.1341,0.3035],[0.1394,0.3029],[0.1443,0.3014],[0.149,0.2985],[0.1524,0.2944],[0.154,0.2894],[0.153,0.2842],[0.1502,0.2799],[0.1467,0.2757],[0.1422,0.2726],[0.1373,0.2702],[0.1324,0.268],[0.1275,0.2665],[0.1224,0.265],[0.117,0.2655],[0.1116,0.2657],[0.1061,0.2657],[0.1006,0.2657],[0.0951,0.2657],[0.0896,0.2657],[0.0841,0.2657],[0.0788,0.2665],[0.0733,0.2665],[0.0679,0.2665],[0.0625,0.2658],[0.0571,0.2657],[0.0516,0.2657],[0.0461,0.2657],[0.0406,0.2657],[0.0351,0.2657],[0.0296,0.2657],[0.0241,0.2657],[0.0187,0.2657],[0.0132,0.2657],[0.0077,0.2657],[0.0022,0.2657],[-0.0033,0.2657],[-0.0088,0.2657],[-0.0143,0.2657],[-0.0197,0.2657],[-0.0252,0.2657],[-0.0307,0.2657],[-0.0362,0.2657],[-0.0417,0.2657],[-0.0472,0.2657],[-0.0527,0.2657],[-0.0581,0.2657],[-0.0635,0.2665],[-0.0689,0.2665],[-0.0744,0.2665],[-0.0799,0.2665],[-0.0852,0.2657],[-0.0907,0.2657],[-0.0962,0.2657],[-0.1017,0.2657],[-0.1072,0.2657],[-0.1127,0.2657],[-0.118,0.265],[-0.1235,0.265],[-0.1286,0.2665],[-0.1333,0.2684],[-0.1383,0.2709],[-0.1432,0.2733],[-0.1473,0.2768],[-0.1508,0.281],[-0.1527,0.2857],[-0.1533,0.2909],[-0.1508,0.2955],[-0.1473,0.2996],[-0.1423,0.3018],[-0.1374,0.3032],[-0.1321,0.304],[-0.1266,0.304],[-0.1213,0.3048],[-0.116,0.3055],[-0.1105,0.3055],[-0.1051,0.3055],[-0.0996,0.3055],[-0.0943,0.3066],[-0.0889,0.307],[-0.0835,0.307],[-0.078,0.307],[-0.0725,0.307],[-0.067,0.307],[-0.0617,0.3078],[-0.0562,0.3078],[-0.0507,0.3078],[-0.0454,0.3085],[-0.0399,0.3085],[-0.0344,0.3085],[-0.029,0.3085],[-0.0235,0.3085],[-0.018,0.3085],[-0.0125,0.3085],[-0.0072,0.3092],[-0.0017,0.3092],[0.0038,0.3092],[0.0093,0.3092],[0.0146,0.3085],[0.0201,0.3085],[0.0256,0.3085],[0.031,0.3085],[0.0365,0.3085],[0.042,0.3085]];
export function batFace2(F) { return (z, y) => { const az = Math.abs(z), dR = sdRBox(z, y, 0, F.hy0, F.hx, F.hy, F.rc);
  const sw = F.sw ?? .015, xl = (y - F.yl) / sw, spl = sw * (xl > 30 ? xl : Math.log1p(Math.exp(xl)));
  return -F.a2 * z * z - F.a4 * z ** 4 - F.lean * spl - F.top * Math.max(0, y - F.yt) ** 2 + F.lobe * gss((y - F.ly) / F.lw, 1) * (1 - F.valley * gss(z / F.vw, 1))
    - F.hood * (1 - sstep(-F.hb, F.hb, dR)) - F.skirt * sstep(F.sy0, -F.sy1, y) * sstep(F.sz0, F.sz1, az) + (F.vb || 0) * gss((y - (F.vby ?? .27)) / (F.vbw ?? .06), 1) * gss(z / (F.vbz ?? .12), 1); }; }
export const BAT2_HALF = [[0, .265], [.15, .265], [.28, .26], [.33, .245], [.38, .232], [.42, .222], [.45, .21], [.468, .195], [.48, .175], [.483, .155], [.482, .12], [.478, .1], [.47, .085], [.42, .07], [.37, .055], [.33, .035], [.305, .01], [.29, -.03], [.27, -.08], [.22, -.115], [.13, -.135], [0, -.14]];
export function sdGrid(poly, pad = .04, nx = 520, ny = 260) { // distanza con segno dal contorno, precalcolata su griglia (interp. bilineare)
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; for (const p of poly) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
  x0 -= pad; x1 += pad; y0 -= pad; y1 += pad; const sd = polySD(poly), G = new Float32Array((nx + 1) * (ny + 1));
  for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) G[j * (nx + 1) + i] = sd(x0 + (x1 - x0) * i / nx, y0 + (y1 - y0) * j / ny);
  return (x, y) => { const fx = (x - x0) / (x1 - x0) * nx, fy = (y - y0) / (y1 - y0) * ny; if (fx < 0 || fy < 0 || fx > nx || fy > ny) return sd(x, y);
    const i = Math.min(nx - 1, Math.floor(fx)), j = Math.min(ny - 1, Math.floor(fy)), a = fx - i, b = fy - j, k = j * (nx + 1) + i;
    return (G[k] * (1 - a) + G[k + 1] * a) * (1 - b) + (G[k + nx + 1] * (1 - a) + G[k + nx + 2] * a) * b; }; }
export function bspl(T) { // spline bicubica tensoriale (nodi e coefficienti come scipy RectBivariateSpline)
  const { tx, ty, c, kx = 3, ky = 3 } = T, nyc = ty.length - ky - 1;
  const span = (t, k, x) => { const n = t.length - k - 1; if (x >= t[n]) return n - 1; if (x <= t[k]) return k; let lo = k, hi = n, m = (lo + hi) >> 1; while (x < t[m] || x >= t[m + 1]) { if (x < t[m]) hi = m; else lo = m; m = (lo + hi) >> 1; } return m; };
  const basis = (sp, x, k, t) => { const N = [1], L = [], Rr = []; for (let j = 1; j <= k; j++) { L[j] = x - t[sp + 1 - j]; Rr[j] = t[sp + j] - x; let sv = 0; for (let r = 0; r < j; r++) { const tmp = N[r] / (Rr[r + 1] + L[j - r]); N[r] = sv + Rr[r + 1] * tmp; sv = L[j - r] * tmp; } N[j] = sv; } return N; };
  return (x, y) => { x = clamp(x, tx[kx], tx[tx.length - kx - 1]); y = clamp(y, ty[ky], ty[ty.length - ky - 1]); const sx = span(tx, kx, x), sy = span(ty, ky, y), Nx = basis(sx, x, kx, tx), Ny = basis(sy, y, ky, ty); let v = 0;
    for (let a = 0; a <= kx; a++) for (let b = 0; b <= ky; b++) v += Nx[a] * Ny[b] * c[(sx - kx + a) * nyc + (sy - ky + b)]; return v; }; }
export function batShell2(o) { // superficie esterna: funzione di forma + bordo arrotondato che rientra verso il contorno ricalcato
  const F = { ...BAT2, ...(o._f2 || {}) }, out = o._out2 || BAT2_OUT, fb = batFace2(F), rs = F.rtck ? bspl(F.rtck) : null, f0 = rs ? (z, y) => fb(z, y) + rs(F.rtck.full ? z : Math.abs(z), y) : fb, sdo = out ? sdGrid(out) : null, rw = F.rw ?? .03, rd = F.rd ?? .016, rp = F.rp ?? 2.2;
  const face = sdo ? (z, y) => { const d = -sdo(z, y), tt = sstep(F.rz0 ?? .3, F.rz1 ?? .48, Math.abs(z)), rwE = rw + ((F.rwt ?? rw) - rw) * tt, rdE = rd + ((F.rdt ?? rd) - rd) * tt; let x = f0(z, y); if (d < rwE) x -= rdE * Math.pow(Math.min(1, 1 - Math.max(d, 0) / rwE), rp); return x; } : f0;
  const fn = faceSkin({ yc: .08, rho: () => .75, face, rf: .01, E: () => .05, uF: .97, uR: .985 });
  const vent = o._vent2 || BAT2_VENT, sdv = vent ? polySD(vent) : null;
  const hole = (z, y) => Math.min(Math.hypot(z, y - (F.oy || 0)) - (F.or || .114), sdv ? sdv(z, y) : 1);
  return { fn, face, F, sdo, hole, sd: (p, u) => Math.max(sdo ? sdo(p.z, p.y) : -1, -hole(p.z, p.y)) };
}
export function batSkin2(o) { return { fn: batShell2(o).fn, s: 1 }; }
function buildBatShell(o, G) { // guscio esterno (modalità adattamento): apertura faro Ø228, presa d'aria
  const B = batShell2(o), S = trimSkin(B.fn, o._nu || 200, o._nv || 440, B.sd, { thick: .004 });
  const pm = paint(o.colore || '#111111', o.vernice, 'Vernice carena'), im = fiber(); im.name = 'Interno carena'; G.add(mesh(S.geo, [pm, im])); return { S, B };
}
function buildBatwingT(o, G, R) {
  if (o._fit) { buildBatShell(o, G); return; }
  /* guscio ricalcato dalle foto prodotto (fronte + due tre quarti), unità di adattamento × BAT2_K = metri reali (larghezza 965 mm) */
  const K = BAT2_K * (o.misura === 'sport' ? .9 : 1), B = batShell2(o), F = B.F, oy = F.oy || 0, orr = F.or || .114;
  const gs = new THREE.Group(); gs.scale.setScalar(K); gs.name = 'Guscio carena'; G.add(gs);
  const S = trimSkin(B.fn, 240, 520, B.sd, { thick: .0045 / K });
  const pm = paint(o.colore, o.vernice, 'Vernice carena'), im = fiber(); im.name = 'Interno carena'; gs.add(mesh(S.geo, [pm, im]));
  const fw = (z, y) => K * B.face(z / K, y / K);                                   // superficie in metri
  const nrm = (z, y) => { const e = .002, dz = (fw(z + e, y) - fw(z - e, y)) / (2 * e), dy = (fw(z, y + e) - fw(z, y - e)) / (2 * e); return V3(1, -dy, -dz).normalize(); };
  const on = (z, y, lift = 0) => { const n = nrm(z, y); return { p: V3(fw(z, y), y, z).addScaledVector(n, lift), n }; };
  const dm = paint(o.colore_cornice === 'carena' ? o.colore : '#0b0b0c', 'lucido', 'Cornice faro');
  // cornice faro: zona incassata attorno all'apertura (stessa sagoma del gradino ricalcato)
  if (o.cornice !== 'no') { const sdP = (z, y) => sdRBox(z, y, 0, F.hy0, F.hx, F.hy, F.rc) - F.hb * .25, z0 = -F.hx - .03, z1 = F.hx + .03, y0 = F.hy0 - F.hy - .03, y1 = F.hy0 + F.hy + .03;
    const SP = trimSkin((u, v) => { const z = z0 + (z1 - z0) * v, y = y0 + (y1 - y0) * u; return V3(B.face(z, y) + .0011, y, z); }, 90, 130,
      p => Math.max(sdP(p.z, p.y), -(Math.hypot(p.z, p.y - oy) - orr), B.sdo ? B.sdo(p.z, p.y) + .002 : -1), { thick: .0025, closeV: false, rimK: 3 });
    gs.add(mesh(SP.geo, [dm, dm])); }
  // tunnel dietro l'apertura (nasconde l'interno) e faro 7"
  const xo = fw(0, K * oy), Ro = K * orr;
  { const tn = mesh(lathe([[Ro + .002, 0], [Ro - .004, -.006], [Ro - .006, -.05], [R * 1.02, -.06]], 96, .001), darkMat('Tunnel faro')); tn.rotation.z = -PI / 2; tn.position.set(xo - .004, K * oy, 0); G.add(tn); }
  const HL = BAT2_ACC ? BAT2_ACC.HL : { x: B.face(0, oy) / 1 - .015, y: oy, z: 0 };
  if (o.faro !== 'no') { const hl = PRO_DEFS.faro.build({ diametro: o.faro_d || '7', stile: o.faro || 'led', finitura: 'gloss', ghiera: o.ghiera, visiera: 'no', calotta: 'si', attacco: 'inferiore' }); hl.position.set(K * HL.x - R * .124, K * HL.y, 0); G.add(hl); }
  // presa d'aria: cornice nera rialzata, condotto interno, divisorio centrale e aletta orizzontale
  if (BAT2_VENT || o._vent2) { const V = (o._vent2 || BAT2_VENT).map(p => [p[0] * K, p[1] * K]), n = V.length, cz = V.reduce((a, p) => a + p[0], 0) / n, cy = V.reduce((a, p) => a + p[1], 0) / n;
    const off = V.map((p, i) => { const a = V[(i + n - 1) % n], b = V[(i + 1) % n], tx = b[0] - a[0], ty = b[1] - a[1], L = Math.hypot(tx, ty) || 1; let nx = ty / L, ny = -tx / L; if ((p[0] - cz) * nx + (p[1] - cy) * ny < 0) { nx = -nx; ny = -ny; } return [p[0] + nx * .006, p[1] + ny * .006]; });
    const run = [...off, off[0]].map(p => on(p[0], p[1], .0005)), vm = paint('#0c0c0d', 'satinato', 'Cornice presa d\'aria'), rb = ribbonAlong(run, .013, .0035, .0006, vm); if (rb) G.add(rb.m);
    const zs = V.map(p => p[0]), ys = V.map(p => p[1]), zmn = Math.min(...zs), zmx = Math.max(...zs), ymn = Math.min(...ys), ymx = Math.max(...ys), sdV = polySD(V);
    const duct = trimSkin((u, v) => { const z = zmn - .01 + (zmx - zmn + .02) * v, y = ymn - .01 + (ymx - ymn + .02) * u; return V3(fw(z, y) - .03, y, z); }, 30, 80, p => sdV(p.z, p.y) - .002, { thick: .002, closeV: false });
    G.add(mesh(duct.geo, [darkMat('Condotto presa'), darkMat('Condotto presa')]));
    const dv = mesh(new RoundedBoxGeometry(.03, ymx - ymn, .006, 2, .002), vm); dv.position.set(fw(0, cy) - .016, cy, 0); G.add(dv);
    const fin = mesh(new RoundedBoxGeometry(.026, .004, zmx - zmn - .02, 2, .0015), vm); fin.position.set(fw(0, cy) - .014, cy, 0); fin.rotation.z = -.3; G.add(fin); }
  // parabrezza: base sul bordo superiore, inclinazione della superficie del cupolino, profilo ricalcato dalla foto installata
  if (o.parabrezza !== 'no' && BAT2_ACC) { const W_ = BAT2_ACC.WS, n = W_.z.length, hc = W_.h[(n - 1) >> 1] || .14, hs = (o.altezza || 13) / 100 / (hc * K);
    const at = (arr, a) => { const f = a * (n - 1), i = Math.min(n - 2, Math.floor(f)), t = f - i; return arr[i] * (1 - t) + arr[i + 1] * t; };
    const fn = (h, a) => { const hh = h * Math.max(.004, at(W_.h, a)) * hs, ux = at(W_.ux, a), uy = at(W_.uy, a);
      return V3(K * (at(W_.x, a) + hh * ux), K * (at(W_.y, a) + hh * uy), K * at(W_.z, a)); };
    const SS = shell(fn, 30, 90, { thick: .004, rimSeg: 5 }), sm = screenMat(o.parabrezza); G.add(mesh(SS.geo, [sm, sm], false));
    // listello nero sul bordo, con viti
    const zt = W_.zt || .29, tr = []; for (let i = 0; i <= 60; i++) { const z = -zt + 2 * zt * i / 60, a = (z - W_.z[0]) / (W_.z[n - 1] - W_.z[0]); tr.push(on(K * z, K * (at(W_.y, a) + .006), .001)); }
    const rb = ribbonAlong(tr, .022, .0045, .0008, dm); if (rb) G.add(rb.m);
    const vm2 = metal(o.viteria || 'satin', 'Viteria parabrezza'); for (const f of [.04, .5, .96]) { const r = tr[Math.round(f * 60)], sc = buttonScrew(.005, vm2, darkMat()); orient(sc, r.n); sc.position.copy(r.p).addScaledVector(r.n, .0048); G.add(sc); } }
  // fari supplementari 4.5": posizione ricalcata dalla foto installata, staffe verso la forcella; deflettori fumé con contorno ricalcato
  const AX = BAT2_ACC ? BAT2_ACC.AUX : { x: .0, y: .04, z: .23 };
  if (o.supplementari !== 'no') for (const s2 of [1, -1]) { const z = s2 * K * AX.z, y = K * AX.y, x = K * AX.x, aux = PRO_DEFS.faro.build({ diametro: '4.5', stile: o.faro === 'vintage' ? 'vintage' : 'led', finitura: 'gloss', ghiera: 'blackchrome', visiera: 'no', calotta: 'si', attacco: 'inferiore' }); aux.position.set(x + .02, y, z); G.add(aux);
    G.add(mesh(tubeAlong(bentPath([V3(x - .02, y - .06, z), V3(x - .05, y - .12, z * .96), V3(x - .12, y - .17, z * .78)], .04), .009, 40, 10), metal('wrinkle', 'Staffe fari'))); }
  if (o.deflettori !== 'no' && BAT2_ACC) { const sm = screenMat('fume'); sm.name = 'Deflettori'; const D = BAT2_ACC.DEFL.map(p => [p[0] * K, p[1] * K]);
    for (const s2 of [1, -1]) sheetOn((z, y) => fw(z, y) + .02 * K, D.map(p => [s2 * p[0], p[1]]), sm, G, { thick: .003 }); }
  // carenatura interna lato pilota: pannello scuro con strumenti e casse
  { const out = (o._out2 || BAT2_OUT); if (out) { const sdo = B.sdo, pts = []; for (let i = 0; i < out.length; i += 3) { const p = out[i], d = Math.hypot(p[0], p[1] - .06) || 1, s = Math.max(.2, 1 - .05 / d); pts.push([p[0] * s * K, (.06 + (p[1] - .06) * s) * K]); }
      const back = (z, y) => fw(z, y) - .1 - .25 * (z * z), pmI = new THREE.MeshPhysicalMaterial({ name: 'Carenatura interna', color: 0x161616, roughness: .82, normalMap: T.peel(), normalScale: new THREE.Vector2(.3, .3) });
      sheetOn(back, pts, pmI, G, { nu: 50, nv: 90, thick: .004, shadow: true, flip: true });
      for (const s2 of [1, -1]) { const g = gauge(.042, s2 > 0 ? 'kmh' : 'giri', o.quadranti || 'nero', 'chrome', 'gloss'), y = .2, z = s2 * .075; orient(g, V3(-1, .35, 0)); g.position.set(back(z, y) - .008, y, z); G.add(g);
        const sp = mesh(lathe([[0, 0], [.05, 0], [.055, .004], [.052, .008], [0, .006]], 48, .001), metal('blackchrome', 'Griglia casse')); orient(sp, V3(-1, .2, 0)); const zz = s2 * .28; sp.position.set(back(zz, .12) - .006, .12, zz); G.add(sp); } } }
  if (o.striscia !== 'no') { const w = (o.striscia === 'doppia' ? .06 : .03) / K, st = trimSkin(B.fn, 120, 300, (p, u) => Math.max(Math.abs(p.z) - w, o.striscia === 'doppia' ? .015 / K - Math.abs(p.z) : -1, B.sd(p, u)), { single: true, off: .0006 / K });
    gs.add(mesh(st.geo, paint(o.colore_striscia || '#f2f2ee', 'lucido', 'Strisce'), false)); }
  return S;
}
/* carena a telaio «shark» (tipo touring 2024): muso largo con sopracciglio sporgente, gruppo ottico LED orizzontale
   esagonale con luci diurne a lama, presa d'aria sotto il plexi, fianchi profondi rifilati dal profilo laterale. */
const SHARK_HALF = [[0, .21], [.15, .215], [.25, .21], [.32, .19], [.38, .15], [.42, .105], [.44, .062], [.437, 0], [.41, -.06], [.36, -.11], [.28, -.145], [.15, -.16], [0, -.165]];
export const SHARK_FACE = { a: .9, brow: .06, by: .078, lean: .6, low: .9 };
export function sharkFace(F = SHARK_FACE) { return (z, y) => -F.a * z * z + F.brow * sstep(F.by - .012, F.by + .006, y) * (1 - .5 * sstep(.32, .44, Math.abs(z))) - F.lean * Math.max(0, y - F.by - .015) * (1 - .25 * sstep(.2, .4, Math.abs(z))) - F.low * Math.max(0, -y - .06) ** 2 - .015 * sstep(-.02, -.1, y); }
const SHARK_SIDE = [[.3, .4], [-.2, .3], [-.38, .22], [-.48, .12], [-.52, .0], [-.48, -.1], [-.36, -.17], [-.15, -.2], [.3, -.25]];
function buildSharkT(o, G) {
  const half = o._half || SHARK_HALF, yc = .02, outline = mirrorHalf(half), rho = starTable(outline.map(p => new THREE.Vector2(p[0], p[1] - yc))), face = sharkFace({ ...SHARK_FACE, ...(o._f || {}) });
  const c = { yc, rho, face, rf: .03, roll: .035, t0: .76, E: () => .6, draft: -.04 }, fn = faceSkin(c), sdS = polySD(smoothClosedPts(o._side || SHARK_SIDE));
  const hx = .195, hy = .07, hole = (z, y) => Math.min(sdRBox(z, y, 0, 0, hx, hy, .03), sdRBox(z, y, 0, .185, .14, .016, .014));
  const S = trimSkin(fn, 200, 460, (p, u) => Math.max(sdS(p.x, p.y), u < .64 ? -hole(p.z, p.y) : -1), { thick: .004 });
  const pm = paint(o.colore, o.vernice, 'Vernice carena'), im = fiber(); im.name = 'Interno carena'; G.add(mesh(S.geo, [pm, im]));
  // gruppo ottico LED: cornice esagonale, due proiettori, lame diurne verso l'esterno
  const x0 = face(0, 0) - .035, hm = darkMat('Corpo gruppo ottico'), hexS = new THREE.Shape(); { const P = [[-.2, .02], [-.16, .07], [.16, .07], [.2, .02], [.17, -.06], [.1, -.075], [-.1, -.075], [-.17, -.06]]; hexS.moveTo(P[0][0], P[0][1]); for (const q of P.slice(1)) hexS.lineTo(q[0], q[1]); hexS.closePath(); }
  const body = mesh(new THREE.ExtrudeGeometry(hexS, { depth: .06, bevelEnabled: true, bevelSize: .006, bevelThickness: .006, bevelSegments: 3 }), hm); body.rotation.y = PI / 2; body.position.set(x0 - .06, 0, 0); G.add(body);
  const lensM = new THREE.MeshPhysicalMaterial({ name: 'Vetro gruppo ottico', color: 0xffffff, roughness: .02, transmission: 1, thickness: .003, ior: 1.49, clearcoat: 1 });
  const lg = mesh(new THREE.ExtrudeGeometry(hexS, { depth: .004, bevelEnabled: true, bevelSize: .003, bevelThickness: .003, bevelSegments: 2 }), lensM, false); lg.rotation.y = PI / 2; lg.position.set(x0 + .004, 0, 0); G.add(lg);
  for (const s2 of [1, -1]) { const pj = new THREE.Group(), cm = metal('chrome', 'Parabole LED'); pj.add(mesh(lathe([[0, -.03], [.045, -.03], [.052, -.01], [.05, 0], [0, 0]], 48, .001), cm)); pj.add(mesh(new THREE.SphereGeometry(.024, 32, 16), new THREE.MeshPhysicalMaterial({ name: 'Lente proiettore', color: 0xdfe8ff, roughness: .05, transmission: .7, thickness: .02, ior: 1.5 })));
    orient(pj, V3(1, 0, 0)); pj.position.set(x0, -.005, s2 * .085); G.add(pj);
    const drl = mesh(new RoundedBoxGeometry(.012, .012, .2, 2, .004), new THREE.MeshPhysicalMaterial({ name: 'Luce diurna', color: 0xffffff, emissive: 0xfff6e8, emissiveIntensity: 1.2, roughness: .3 })); const zz = s2 * .27; drl.position.set(face(zz, .045) - .012, .045, zz); drl.rotation.y = s2 * .5; drl.rotation.x = s2 * -.18; G.add(drl); }
  // presa d'aria sotto il plexi
  { const yv = .185, xv = face(0, yv); const box = mesh(new RoundedBoxGeometry(.06, .036, .28, 3, .012), darkMat('Presa d\'aria')); box.position.set(xv - .035, yv, 0); G.add(box); }
  if (o.parabrezza !== 'no') screenOn(S, { cut: 0 }, o, G, { th1: .62, th2: PI - .62, uAt: () => .67, Hc: o.altezza / 100 * 1.05, lean: .5, tan: .01, prof: q => Math.pow(Math.max(0, 1 - Math.pow(Math.abs(q), 3.5)), .5) * (.8 + .2 * Math.abs(q) ** 2), screws: [.08, .5, .92] });
  innerPanel(G, { ...c, E: () => .3 }, o, 1);
  if (o.striscia !== 'no') { const st = trimSkin(fn, 120, 300, (p, u) => Math.max(Math.abs(p.z) - .035, u > .72 ? 1 : -1, -hole(p.z, p.y), p.y < .09 ? 1 : -1), { single: true, off: .0006 }); G.add(mesh(st.geo, paint(o.colore_striscia || '#f2f2ee', 'lucido', 'Strisce'), false)); }
  return S;
}

/* carena a telaio sportiva «club/ST»: muso con sopracciglio, faro 7" incassato in una tasca, due feritoie laterali,
   fascia superiore in rilievo, telaietto nero e plexi fumé alto ai lati. Contorni ricalcati dalla foto laterale (unità R0). */
export const ST_PROF = { W: [[.3, 2.0], [-1, 2.45], [-3, 2.55], [-5.6, 2.5]], T: [[.3, 2.3], [-1, 2.6], [-2.7, 2.85], [-4, 2.5], [-5.6, 1.9]], B: [[.3, -1.3], [-1, -1.75], [-3, -1.65], [-5.6, -1.65]],
  nU: 2.6, nL: 2.4, Dt: .25, Ds: .45, Db: .5, q: 2.2, L: 5.6, op: 1.32, gap: [.55, -1.3], rimx: [0, -.45, -.8],
  A: [[.9, 2.4], [-.767, 2.381], [-2.728, 2.447], [-2.901, 2.439], [-3.08, 2.409], [-3.604, 2.262], [-4.384, 1.966], [-4.698, 1.809], [-5.066, 1.566], [-5.161, 1.446], [-5.209, 1.302], [-5.219, .971], [-5.166, .529],
    [-5.039, .089], [-4.968, -.066], [-4.84, -.272], [-4.539, -.684], [-4.246, -1.046], [-4.032, -1.25], [-3.95, -1.294], [-3.77, -1.327], [-3.677, -1.32], [-3.398, -1.258], [-3.133, -1.242], [-2.535, -1.294],
    [-1.561, -1.446], [-1.469, -1.449], [-1.287, -1.423], [-1.205, -1.386], [-1.131, -1.33], [-1.011, -1.196], [-.893, -.947], [-.6, -.5], [.9, -.5]],
  frame: 2.32, vents: [[-1.18, 0, .085, .62], [-.98, -.04, .06, .5]], pod: [1.05, .32, .05],
  S: { W: [[0, 1.9], [-1.2, 2.0], [-2.9, 2.05]], T: [[.0, 2.3], [-.29, 2.47], [-.81, 3.16], [-1.25, 3.68], [-1.69, 4.26], [-2.06, 4.85], [-2.3, 5.25], [-2.9, 5.3]], B: [[0, -1], [-2.9, -1]], nU: 2.4, nL: 2, Dt: .05, Ds: .05, Db: .05, q: 2, L: 2.9 },
  Bs: [[.3, 2.25], [-2.75, 2.45], [-2.72, 2.6], [-2.65, 3.24], [-2.5, 3.82], [-2.38, 4.41], [-2.3, 5.3], [-2.15, 5.3], [-1.6, 4.4], [.4, 2.5]] };
export function stSkin(o) { const R = lensR(o), s = R * 1.128 + .007, P = { ...ST_PROF, ...(o._p || {}) }; return { fn: cafeLoft(o._screen ? { ...P.S, op: 1 } : P, s).fn, s }; }
function buildClubT(o, G, R) {
  const P = { ...ST_PROF, ...(o._p || {}) }, s = R * 1.128 + .007, SK = cafeLoft(P, s), fn = SK.fn, sdA = polySD(smoothClosedPts(P.A)), ga = P.gap[0], gx = P.gap[1];
  const ventSD = (x, y) => Math.min(...P.vents.map(v => sdRBox(x, y, v[0], v[1], v[2], v[3], v[2] * .95)));
  const shellSD = p => { const x = p.x / s, y = p.y / s, z = p.z / s, r = Math.hypot(y, z), th = Math.atan2(y, z); let d = Math.max(sdA(x, y), -Math.max((Math.abs(angTo(th, 1.5 * PI)) - ga) * r, x - gx));
    if (Math.abs(z) > 1.6) d = Math.max(d, -ventSD(x, y)); return d; };
  const S = trimSkin(fn, 170, 340, shellSD, { thick: .004 });
  const pm = paint(o.colore, o.vernice, 'Vernice carena'), im = fiber(); im.name = 'Interno carena'; G.add(mesh(S.geo, [pm, im]));
  // telaietto nero superiore (fascia sopra la linea frame)
  const fr = trimSkin(fn, 120, 300, p => Math.max(sdA(p.x / s, p.y / s), P.frame - p.y / s), { thick: .003, off: .0025 }); G.add(mesh(fr.geo, [darkMat('Telaietto plexi'), darkMat('Telaietto plexi')]));
  // fascia superiore in rilievo con filetto
  for (const [y0, h, off, x1] of [[P.pod[0], P.pod[1], .007, -.9], [-1.18, .2, .005, -1.2]]) { const pd = trimSkin(fn, 160, 340, p => { const x = p.x / s, y = p.y / s; return Math.max(sdA(x, y) + .06, Math.abs(y - y0) - h, x - x1, Math.abs(p.z / s) < 1.4 ? 1 : -1); }, { thick: off, off, rimK: 6 }); G.add(mesh(pd.geo, [pm, pm])); } // fasce in rilievo con gradino
  // tasca del faro: tunnel dall'apertura al faro incassato
  const op = P.op * s, xr = -.35 * s; { // tasca: superficie dal bordo dell'apertura (inclinato) all'anello del faro incassato
    const NT = 96, pos = [], idx = []; for (let i = 0; i <= NT; i++) { const v = i / NT, th = v * 2 * PI, a = fn(0, v), b = V3(xr + .004, R * 1.13 * Math.sin(th), R * 1.13 * Math.cos(th)); for (let k = 0; k <= 6; k++) { const t = k / 6, q = a.clone().lerp(b, t); q.x += Math.sin(t * PI) * -.004; pos.push(q.x, q.y, q.z); } }
    for (let i = 0; i < NT; i++) for (let k = 0; k < 6; k++) { const a0 = i * 7 + k; idx.push(a0, a0 + 7, a0 + 1, a0 + 1, a0 + 7, a0 + 8); }
    const tg = new THREE.BufferGeometry(); tg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); tg.setIndex(idx); tg.computeVertexNormals(); const tm = darkMat('Tasca faro'); tm.side = THREE.DoubleSide; G.add(mesh(tg, tm)); }
  const hl = PRO_DEFS.faro.build({ diametro: o.faro_d || '7', stile: o.faro === 'no' ? 'led' : o.faro, finitura: 'gloss', ghiera: o.ghiera, visiera: 'no', calotta: 'si', attacco: 'laterale' }); hl.position.x = xr - R * .124; G.add(hl);
  // feritoie: lamelle scure arretrate
  for (const s2 of [1, -1]) for (const v of P.vents) { const u = SK.uAtX(v[0], s2 > 0 ? 0 : PI), n = S.nAt(u, s2 > 0 ? 0 : .5), q = S.at(u, s2 > 0 ? 0 : .5); const box = mesh(new RoundedBoxGeometry(v[2] * 2 * s, v[3] * 2 * s, .03, 2, .006), darkMat('Feritoie')); box.position.copy(q).addScaledVector(n, -.018); box.position.y = v[1] * s; box.lookAt(box.position.clone().add(n)); G.add(box); }
  // plexi: guscio dedicato, tagliato sul contorno laterale ricalcato
  if (o.parabrezza !== 'no') { const PS = { ...P.S, op: 1 }, SS = cafeLoft(PS, s), sdB = polySD(smoothClosedPts(P.Bs)); const sh = trimSkin(SS.fn, 120, 260, p => Math.max(sdB(p.x / s, p.y / s), P.frame + .1 - p.y / s), { thick: .004, off: .006, rimK: 4 }); const sm = screenMat(o.parabrezza); G.add(mesh(sh.geo, [sm, sm], false)); }
  if (o.striscia !== 'no') { const [y0, h] = P.pod, fm = paint(o.colore_striscia || '#d9b36a', 'lucido', 'Filetti'); // filetti che contornano la fascia in rilievo e il pannello inferiore
    for (const yl of [y0 + h - .07, y0 - h + .07, -.35, -1.05]) { const st = trimSkin(fn, 140, 300, p => { const x = p.x / s, y = p.y / s; return Math.max(sdA(x, y) + .12, Math.abs(y - yl) - .018, x > -1.5 ? 1 : -1, Math.abs(p.z / s) < 1.4 ? 1 : -1); }, { single: true, off: .0045 }); G.add(mesh(st.geo, fm, false)); } }
  innerPanel(G, { yc: .05, rho: th => 2.2 * s * (Math.abs(Math.sin(th)) > .7 ? .85 : 1), face: () => -2.2 * s, rf: .01, E: () => .2 }, o, 1);
  return S;
}

/* carenatura interna (lato pilota): pannello goffrato con due strumenti e casse audio */
function innerPanel(G, c, o, k = 1) {
  const pts = []; for (let i = 0; i < 160; i++) { const th = i / 160 * 2 * PI, r = c.rho(th) - .035 * k; pts.push([r * Math.cos(th), c.yc + r * Math.sin(th)]); }
  const back = (z, y) => { const th = Math.atan2(y - c.yc, z); return c.face(z, y) - c.rf - c.E(th) + .02; };
  const pm = new THREE.MeshPhysicalMaterial({ name: 'Carenatura interna', color: 0x161616, roughness: .82, normalMap: T.peel(), normalScale: new THREE.Vector2(.3, .3) });
  sheetOn(back, pts, pm, G, { nu: 50, nv: 90, thick: .004, shadow: true });
  for (const s2 of [1, -1]) { const g = gauge(.042 * k, s2 > 0 ? 'kmh' : 'giri', o.quadranti || 'nero', 'chrome', 'gloss'), y = .2 * k, z = s2 * .075 * k; orient(g, V3(-1, .35, 0)); g.position.set(back(z, y) - .008, y, z); G.add(g);
    const sp = mesh(lathe([[0, 0], [.05 * k, 0], [.055 * k, .004], [.052 * k, .008], [0, .006]], 48, .001), metal('blackchrome', 'Griglia casse')); orient(sp, V3(-1, .2, 0)); const zz = s2 * .29 * k; sp.position.set(back(zz, .12 * k) - .006, .12 * k, zz); G.add(sp); }
}

/* --- mezza carena racing: anello completo, fianchi alle mani con incavi semimanubri, bolla, telaietto a ragno --- */
function buildRace(o, G, R, full) {
  const Rg = R * 1.128;
  const c = full ? { R0: Rg + .007, A: 2.5 * R, Bu: Rg + .035, Bd: .6, n: 2.2, nd: 2.1, D: .13, Eside: .36, Etop: .03, Elow: .44, pe: 1, legs: .74, legsE: .92, notch: .09, thn: .1, wn: .15 }
    : { R0: Rg + .007, A: 2.4 * R, Bu: Rg + .035, Bd: 2.45 * R, n: 2.2, nd: 2.0, D: .13, Eside: .3, Etop: .03, Elow: .02, pe: 1, legs: .42, legsE: .6, notch: .09, thn: .1, wn: .15 };
  const S = shell(fairingFn(c), 100, 170, { thick: .0035, closeV: true }); const pm = paint(o.colore, o.vernice, 'Vernice carena'), im = o.interno === 'tinta' ? pm : fiber(); if (im !== pm) im.name = 'Interno carena';
  G.add(mesh(S.geo, [pm, im])); gasket(G, R, c.R0); headlightIn(o, G, R, 0, 'inferiore');
  if (o.parabrezza !== 'no') screenOn(S, c, o, G, { th1: .55, th2: PI - .55, uAt: th => .3, Hc: o.altezza / 100, lean: .98, tan: .07, screws: [.04, .2, .36, .5, .64, .8, .96] });
  if (o.striscia !== 'no') G.add(stripeOn(S, o, .015, .985, .25, .018, 90));
  if (o.numero_gara === 'si') { roundel(S, .72, (2 * PI - .2) / (2 * PI), 1, .17, o, G); roundel(S, .72, (PI + .2) / (2 * PI), -1, .17, o, G); }
  const tm = metal('wrinkle', 'Telaietto carena'), hub = V3(-.34, .04, 0);
  for (const s of [1, -1]) { const v = s > 0 ? .02 : .48, p = S.at(.62, v).addScaledVector(S.nAt(.62, v), -.012); G.add(mesh(tubeAlong(bentPath([p, V3(p.x - .05, p.y + .01, p.z * .7), hub.clone().add(V3(0, 0, s * .03))], .05), .0065, 80, 12), tm));
    const tab = mesh(new RoundedBoxGeometry(.03, .022, .008, 2, .003), tm); orient(tab, V3(0, 0, s)); tab.position.copy(p); G.add(tab); }
  const hb = mesh(new RoundedBoxGeometry(.05, .04, .08, 3, .008), tm); hb.position.copy(hub); G.add(hb);
  if (full) { const bp = PRO_DEFS.puntale.build({ colore: o.colore, vernice: o.vernice, interno: o.interno, striscia: o.striscia, colore_striscia: o.colore_striscia, sfiati: 'si' }); bp.position.set(-.38, -.5, 0); G.add(bp); }
  return S;
}

/* --- carene "a faccia": contorno frontale 2D (stellato rispetto al faro) + superficie frontale + raccordo + fianchi --- */
function starTable(poly, N = 720) {
  const rho = new Float32Array(N);
  for (let k = 0; k < N; k++) { const a = k / N * 2 * PI, dx = Math.cos(a), dy = Math.sin(a); let best = 1e9;
    for (let i = 0; i < poly.length; i++) { const p = poly[i], q = poly[(i + 1) % poly.length], ex = q.x - p.x, ey = q.y - p.y, den = dx * ey - dy * ex; if (Math.abs(den) < 1e-12) continue;
      const t = (p.x * ey - p.y * ex) / den, s = (p.x * dy - p.y * dx) / den; if (t > 0 && s >= -1e-9 && s <= 1 + 1e-9 && t < best) best = t; }
    rho[k] = best; }
  return a => { const f = ((a % (2 * PI)) + 2 * PI) % (2 * PI) / (2 * PI) * N, i = Math.floor(f) % N, t = f - Math.floor(f); return rho[i] * (1 - t) + rho[(i + 1) % N] * t; };
}
function faceFairingFn(c) {
  const uF = c.uF ?? .56, uR = c.uR ?? .68;
  return (u, v) => { const th = v * 2 * PI, cs = Math.cos(th), sn = Math.sin(th), R = c.rho(th), rf = Math.min(c.rf, (R - c.R0) * .4), E = Math.max(.008, c.E(th, cs, sn)), xf = rr => c.face(rr * cs, rr * sn, rr);
    let r, x; const r0 = R - rf;
    if (u <= uF) { r = c.R0 + (r0 - c.R0) * (u / uF); x = xf(r); }
    else if (u <= uR) { const f = (u - uF) / (uR - uF) * PI / 2; r = r0 + rf * Math.sin(f); x = xf(r0) - rf * (1 - Math.cos(f)); }
    else { const e = (u - uR) / (1 - uR) * E; r = R + (c.draft || 0) * e; x = xf(r0) - rf - e; }
    return V3(x, r * sn, r * cs); };
}
const mirrorPoly = half => { const P = half.map(p => new THREE.Vector2(p[0], p[1])); const L = half.slice(1, -1).reverse().map(p => new THREE.Vector2(-p[0], p[1])); return smoothClosed([...P, ...L].map(p => [p.x, p.y]), 400); };
const gss = (x, w) => Math.exp(-Math.pow(x / w, 2)), angTo = (th, t0) => ((th - t0) % (2 * PI) + 3 * PI) % (2 * PI) - PI;
function faceShell(o, G, c, NU = 110, NV = 220) { const S = shell(faceFairingFn(c), NU, NV, { thick: .0035, closeV: true }); const pm = paint(o.colore, o.vernice, 'Vernice carena'), im = o.interno === 'tinta' ? pm : fiber(); if (im !== pm) im.name = 'Interno carena'; G.add(mesh(S.geo, [pm, im])); return { S, pm }; }

/* club style / quarter: faccia quasi piana inclinata, spigoli netti, lente coprifaro piatta, fondo aperto */
function buildClub(o, G, R) {
  const k = R / .0889, Rg = R * 1.128, tilt = 15 * PI / 180;
  const half = [[0, -.15], [.21, -.15], [.24, -.135], [.215, .06], [.17, .135], [.09, .15], [0, .152]].map(p => [p[0] * k, p[1] * k]);
  const c = { R0: Rg + .016, rho: starTable(mirrorPoly(half)), rf: .011, draft: -.06, uF: .58, uR: .66,
    face: (z, y) => -Math.tan(tilt) * y - .02 * z * z,
    E: (th, cs, sn) => { const bot = gss(angTo(th, 1.5 * PI), .6); return (sn > 0 ? .3 - .17 * Math.pow(sn, 3) : .3 - .19 * Math.pow(-sn, 1.5)) * k * (1 - .97 * bot); } };
  const { S, pm } = faceShell(o, G, c);
  const lensM = new THREE.MeshPhysicalMaterial({ name: 'Lente coprifaro', color: 0xffffff, roughness: .02, transmission: 1, thickness: .003, ior: 1.49, clearcoat: 1 });
  const lc = mesh(new THREE.CylinderGeometry(Rg + .022, Rg + .022, .003, 96), lensM, false); lc.rotation.z = PI / 2 - tilt * 0; lc.position.x = .004; G.add(lc);
  const ring = mesh(new THREE.TorusGeometry(Rg + .022, .0034, 10, 128), rubber('Bordino lente')); ring.rotation.y = PI / 2; ring.position.x = .004; G.add(ring);
  headlightIn(o, G, R, -.008);
  if (o.parabrezza !== 'no') screenOn(S, c, o, G, { th1: .62, th2: PI - .62, uAt: th => .5, Hc: o.altezza / 100, lean: .5, tan: .03, prof: q => .62 + .38 * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(q), 3)), .5), screws: [.08, .36, .64, .92] });
  if (o.striscia !== 'no') G.add(stripeOn(S, o, .02, .9, .25, .016, 90));
  const bm = metal('wrinkle', 'Staffe carena');
  for (const s of [1, -1]) { const p = S.at(.8, s > 0 ? .97 : .53).addScaledVector(S.nAt(.8, s > 0 ? .97 : .53), -.01); G.add(mesh(new THREE.ExtrudeGeometry(roundRect(.004, .025, .0012), { steps: 30, bevelEnabled: false, extrudePath: bentPath([p, V3(p.x - .02, p.y - .04, p.z * .8), V3(p.x - .06, p.y - .06, s * .12)], .02) }), bm)); }
  return S;
}
/* batwing touring (forcella): ala larga 930 mm, V superiore, gondola faro, carenatura interna */
function buildBatwing(o, G, R) {
  const Rg = R * 1.128, half = [[0, -.118], [.1, -.13], [.19, -.18], [.31, -.235], [.42, -.215], [.47, -.12], [.475, -.01], [.44, .085], [.32, .13], [.17, .17], [0, .215]];
  const c = { R0: Rg + .007, rho: starTable(mirrorPoly(half)), rf: .028, draft: -.02, uF: .58, uR: .7,
    face: (z, y, r) => -z * z / 1.5 - .12 * y - .3 * y * y + .045 * gss(r - Rg - .007, .07),
    E: (th, cs, sn) => (.12 + .06 * cs * cs) * (1 - .88 * gss(angTo(th, 1.5 * PI), .42)) };
  const { S } = faceShell(o, G, c, 120, 260); gasket(G, R, c.R0, .045); headlightIn(o, G, R, .045, 'inferiore');
  if (o.parabrezza !== 'no') screenOn(S, c, o, G, { th1: .5, th2: PI - .5, uAt: th => .52, Hc: o.altezza / 100, lean: .32, tan: .02, prof: q => .45 + .55 * Math.pow(Math.max(0, 1 - q * q), .8), screws: [.05, .2, .35, .5, .65, .8, .95] });
  if (o.striscia !== 'no') G.add(stripeOn(S, o, .02, .55, .25, .012, 90));
  innerFairing(S, G, o); return S;
}
/* shark nose (telaio): muso a cuneo, due fari 5¾" incassati, presa d'aria sotto il plexi */
function buildShark(o, G) {
  const half = [[0, -.2], [.12, -.205], [.27, -.215], [.4, -.17], [.445, -.06], [.43, .05], [.33, .125], [.17, .165], [0, .19]];
  const face = (z, y) => -z * z / 1.15 - .62 * Math.max(0, y) - .18 * Math.max(0, -y) - .4 * y * y;
  const c = { R0: .008, rho: starTable(mirrorPoly(half)), rf: .03, draft: -.03, uF: .6, uR: .7, face, E: (th, cs, sn) => (.15 + .06 * cs * cs) * (1 - .8 * gss(angTo(th, 1.5 * PI), .4)) };
  const { S, pm } = faceShell(o, G, c, 120, 260); const R2 = .073;
  for (const s of [1, -1]) { const z = s * .12, y = -.05, e = .002, n = V3(1, -(face(z, y + e) - face(z, y - e)) / (2 * e), -(face(z + e, y) - face(z - e, y)) / (2 * e)).normalize(), p = V3(face(z, y), y, z);
    const pod = new THREE.Group(); pod.add(mesh(lathe([[R2 * 1.32, -.06], [R2 * 1.36, -.01], [R2 * 1.24, .006], [R2 * 1.15, .0]], 96, .003), pm)); pod.add(mesh(lathe([[0, -.06], [R2 * 1.3, -.06], [R2 * 1.14, -.004], [0, -.004]], 64, .001), darkMat('Incasso faro')));
    orient(pod, n); pod.position.copy(p).addScaledVector(n, -.012); G.add(pod);
    const hl = PRO_DEFS.faro.build({ diametro: '5.75', stile: o.faro === 'no' ? 'vintage' : o.faro, finitura: 'gloss', ghiera: o.ghiera, visiera: 'no', calotta: 'si', attacco: 'inferiore' }); hl.quaternion.setFromUnitVectors(V3(1, 0, 0), n); hl.position.copy(p).addScaledVector(n, -.016 - R2 * .124); G.add(hl); }
  const y0 = .1, ip = V3(face(0, y0), y0, 0), inN = V3(1, -(face(0, y0 + .002) - face(0, y0 - .002)) / .004, 0).normalize();
  const intake = mesh(new RoundedBoxGeometry(.012, .02, .15, 3, .006), darkMat('Presa d\'aria')); orient(intake, inN, V3(1, 0, 0)); intake.position.copy(ip).addScaledVector(inN, .001); G.add(intake);
  if (o.parabrezza !== 'no') screenOn(S, c, o, G, { th1: .55, th2: PI - .55, uAt: th => .54, Hc: o.altezza / 100, lean: .62, tan: .04, prof: q => .55 + .45 * Math.pow(Math.max(0, 1 - q * q), .6) });
  if (o.striscia !== 'no') G.add(stripeOn(S, o, .03, .55, .25, .012, 90));
  innerFairing(S, G, o); return S;
}
function buildFairing(o) {
  const G = new THREE.Group(), R = lensR(o);
  if (o.tipo === 'flyscreen') buildFlyscreen(o, G, R);
  else if (o.tipo === 'mezza') buildCafeT({ ...o, forma: 'lunga' }, G, R);
  else if (o.tipo === 'integrale') { buildCafe(o, G, R, { big: 1, hw: .225, yt: .15, yb: -.42, Rs: .24, rf: .07, psiTop: 40, Earm: .42, Ec: .12, psiC: 96, wC: 20, Ejaw: .56, Ebot: .2, scrK: 1.25, scrAx: .38 });
    const bp = PRO_DEFS.puntale.build({ colore: o.colore, vernice: o.vernice, interno: o.interno, striscia: o.striscia, colore_striscia: o.colore_striscia, sfiati: 'si' }); bp.position.set(-.3, -.44 * R / .0889 + .02, 0); G.add(bp); }
  else if (o.tipo === 'club') buildClubT(o, G, R);
  else if (o.tipo === 'batwing') buildBatwingT(o, G, R);
  else if (o.tipo === 'shark') buildSharkT(o, G);
  else buildCafeT(o, G, R);
  G.userData.attacco = ['shark', 'integrale'].includes(o.tipo) ? 'telaio' : 'forcella';
  return G;
}
const PAINT_DEF = '#8c0f14';
registerPro('carena', { n: 'Cupolino / carena', cat: 'Carene', type: 'fairing', b: 'Dart, Puig, Memphis Shades, Highway Hawk, Kustom Tech, Saddlemen', p: 1049, build: buildFairing,
  opts: [sel('tipo', 'Modello', [['cupolino', 'Cupolino café / bikini'], ['flyscreen', 'Flyscreen (solo plexi)'], ['club', 'Club / ST a telaio con feritoie'], ['mezza', 'Mezza carena racing'], ['integrale', 'Carena integrale con puntale'], ['batwing', 'Batwing touring'], ['shark', 'Shark nose a telaio con gruppo ottico LED']], 'cupolino'),
    sel('forma', 'Forma cupolino', [['tonda', 'Tonda'], ['ovale', 'Ovale larga'], ['goccia', 'A goccia']], 'tonda'), sel('coprifaro', 'Copertura faro', [['chiaro', 'Trasparente'], ['fume', 'Fumé'], ['no', 'Senza copertura']], 'chiaro'), sel('forma_fly', 'Forma flyscreen', [['basso', 'Basso a punta (250×230)'], ['classico', 'Classico (275×275)'], ['alto', 'Alto (280×320)']], 'classico'),
    sel('materiale', 'Materiale flyscreen', [['policarbonato', 'Policarbonato 4 mm'], ['alluminio', 'Alluminio 2 mm (mascherina)']], 'policarbonato'), sel('finitura_alu', 'Finitura alluminio', FIN_METAL, 'brushed'),
    col('colore', 'Colore', PAINT_DEF), sel('vernice', 'Vernice', PAINT_TYPE, 'lucido'), sel('interno', 'Interno', [['nero', 'Nero goffrato'], ['tinta', 'In tinta']], 'nero'),
    sel('parabrezza', 'Plexi', [...SCREEN_COL, ['no', 'Senza']], 'fume'), num('altezza', 'Altezza plexi', 4, 45, 1, 13, 'cm'), sel('viteria', 'Viti plexi', FIN_METAL, 'satin'),
    sel('faro', 'Faro', [['vintage', 'Vintage a parabola'], ['led', 'LED con anello'], ['no', 'Senza faro']], 'vintage'), sel('faro_d', 'Diametro faro', [['5.75', '5¾" (Sportster, Dyna)'], ['7', '7" (Road King, Electra, Heritage)']], '7'), sel('ghiera', 'Ghiera faro', FIN_METAL, 'chrome'),
    sel('striscia', 'Strisce racing', [['no', 'Nessuna'], ['centrale', 'Centrale'], ['doppia', 'Doppia']], 'no'), col('colore_striscia', 'Colore strisce', '#f2f2ee'),
    sel('numero_gara', 'Tabelle numero (mezza/integrale)', YN, 'no'), num('numero', 'Numero di gara', 0, 99, 1, 7), col('colore_tabella', 'Colore tabella', '#f2f2ee'), col('colore_numero', 'Colore numero', '#111111'),
    sel('quadranti', 'Quadranti (batwing/shark)', [['nero', 'Neri'], ['bianco', 'Bianchi'], ['crema', 'Crema']], 'nero'),
    sel('misura', 'Misura batwing', [['touring', 'Touring (ala larga)'], ['sport', 'Sport compatta']], 'touring'), sel('supplementari', 'Fari supplementari 4"', YN, 'si'), sel('deflettori', 'Deflettori inferiori', YN, 'si')] });

function stripeOn(S, o, uA, uB, vc, half, nu = 80) {
  const sm = paint(o.colore_striscia, 'lucido', 'Striscia'), G = new THREE.Group(), bands = o.striscia === 'doppia' ? [[vc - half * 2.4, vc - half * .9], [vc + half * .9, vc + half * 2.4]] : [[vc - half, vc + half]];
  for (const [a, b] of bands) G.add(mesh(patch(S, uA, uB, a, b, nu, 6, .0007), sm, false)); return G;
}
function roundel(S, u, v, side, size, o, G) {
  const c = S.at(u, v), n = S.nAt(u, v), t2 = V3(0, 1, 0).addScaledVector(n, -n.y).normalize(), t1 = V3(side, 0, 0).addScaledVector(n, -n.x * side).normalize();
  const span = (du, dv) => [u - du, u + du, v - dv, v + dv];
  const [a, b, cc, d] = span(.2, .075);
  G.add(mesh(patch(S, a, b, cc, d, 28, 28, .0008, { c, t1, t2, size }), decalMat('Tabella numero', new THREE.Color(o.colore_tabella || '#f2f2ee'), discTex()), false));
  G.add(mesh(patch(S, a, b, cc, d, 28, 28, .0013, { c, t1, t2, size: size * .9 }), decalMat('Numero', new THREE.Color(o.colore_numero || '#111111'), glyphTex(String(Math.round(o.numero ?? 7)))), false));
}

/* =============================== PUNTALE (BELLY PAN) =============================== */
function buildBelly(o) {
  const G = new THREE.Group(), L = .5, W = .2, Dp = .17, n = 2.4;
  const fn = (u, v) => { const th = v * PI, cs = Math.cos(th), sn = Math.sin(th);
    const w = W * Math.pow(Math.sin(PI / 2 * Math.min(1, .05 + u / .38)), .7) * (1 - .22 * u * u), d = Dp * Math.pow(Math.sin(PI / 2 * Math.min(1, .05 + u / .45)), .6) * (1 - .38 * u);
    return V3(-u * L, -d * Math.pow(Math.max(0, sn), 2 / n) + .05 * u * u, w * Math.sign(cs) * Math.pow(Math.abs(cs), 2 / n)); };
  const S = shell(fn, 70, 90, { thick: .003 }); const pm = paint(o.colore, o.vernice, 'Vernice puntale'), im = o.interno === 'tinta' ? pm : fiber();
  G.add(mesh(S.geo, [pm, im]));
  if (o.sfiati === 'si') for (const s of [1, -1]) for (let k = 0; k < 4; k++) { const u = .42 + k * .07, v = s > 0 ? .2 : .8, p = S.at(u, v), nn = S.nAt(u, v); const sl = mesh(new RoundedBoxGeometry(.05, .002, .01, 2, .0009), darkMat('Sfiati')); orient(sl, nn, V3(0, 0, -s)); sl.position.copy(p).addScaledVector(nn, .0005); G.add(sl); }
  if (o.striscia !== 'no') G.add(stripeOn(S, o, .02, .98, .5, .022, 60));
  for (const s of [1, -1]) { const p = S.at(.6, s > 0 ? .02 : .98), sc = buttonScrew(.006, metal('chrome', 'Viteria'), darkMat()); orient(sc, V3(0, 0, s)); sc.position.copy(p).add(V3(0, -.012, 0)); G.add(sc); }
  return G;
}
registerPro('puntale', { n: 'Puntale motore (belly pan)', cat: 'Carene', type: 'fairing', b: 'Dart, Motone, Kustom Tech', p: 1049, build: buildBelly,
  opts: [col('colore', 'Colore', PAINT_DEF), sel('vernice', 'Vernice', PAINT_TYPE, 'lucido'), sel('interno', 'Interno', [['nero', 'Nero (vetroresina)'], ['tinta', 'In tinta']], 'nero'), sel('sfiati', 'Feritoie di sfiato', YN, 'si'), sel('striscia', 'Striscia', [['no', 'Nessuna'], ['centrale', 'Centrale'], ['doppia', 'Doppia']], 'no'), col('colore_striscia', 'Colore striscia', '#f2f2ee')] });

/* =============================== IMBOTTITURA SELLA (comune) =============================== */
function hexCenter(x, y, R) { const qf = (Math.sqrt(3) / 3 * x - y / 3) / R, rf = (2 / 3 * y) / R; let rx = Math.round(qf), rz = Math.round(rf); const ry = Math.round(-qf - rf); const dx = Math.abs(rx - qf), dz = Math.abs(rz - rf), dy = Math.abs(ry + qf + rf); if (dx > dy && dx > dz) rx = -ry - rz; else if (dy <= dz) rz = -rx - ry; return [R * Math.sqrt(3) * (rx + rz / 2), R * 1.5 * rz]; }
function hexDist(x, y, R) { const [cx, cy] = hexCenter(x, y, R), dx = x - cx, dy = y - cy; return Math.max(Math.abs(dx), Math.abs(dx * .5 + dy * .8660254), Math.abs(-dx * .5 + dy * .8660254)); }
export const QUILT = [['righe', 'Tuck & roll longitudinale'], ['trasversali', 'Righe trasversali'], ['rombi', 'A rombi (diamond)'], ['esagoni', 'A nido d\'ape'], ['liscia', 'Liscia']];
export function seatPad(o, outline, c, cfg) {
  const G = new THREE.Group(), Z = new THREE.Group(); Z.rotation.x = -PI / 2; G.add(Z);
  const q = o.trapuntatura || 'righe', A = (q === 'liscia' || q === 'contorni') ? 0 : (cfg.amp ?? .0052), panel = cfg.panel ?? .8, cell = cfg.cell ?? .042, rt2 = Math.SQRT2, hr = cell * .6;
  const puff = (x, y) => { if (q === 'righe') return Math.pow(Math.abs(Math.sin(PI * y / (cell * .72))), .55); if (q === 'trasversali') return Math.pow(Math.abs(Math.sin(PI * x / (cell * .9))), .55);
    if (q === 'esagoni') return Math.pow(Math.max(0, 1 - Math.pow(hexDist(x, y, hr) / (hr * .866), 2.4)), .5);
    const a = (x + y) / (rt2 * cell), b = (x - y) / (rt2 * cell); return Math.pow(Math.abs(Math.sin(PI * a) * Math.sin(PI * b)), .62); };
  const dome = cfg.dome ?? .016, zB = cfg.zBot || (() => 0);
  const zTop = (x, y, s) => { let z = zB(x, y) + cfg.h - dome + (cfg.crown ? cfg.crown(x, y) : 0) + dome * (1 - s * s); if (A) { const m = 1 - sstep(panel - .05, panel - .005, s); z += A * puff(x, y) * m - .0019 * Math.exp(-Math.pow((s - panel) / .013, 2)); } return z; };
  const C = cushion(outline, c, { rho: cfg.rho ?? .02, zTop, bottom: cfg.zBot ? (x, y) => cfg.zBot(x, y) + .011 : .011, bulge: cfg.bulge ?? .0018, Ns: cfg.Ns ?? 72, Nr: 14, Nd: 8, tuck: .006 });
  Z.add(mesh(C.geo, leather(o.pelle, o.tipo_pelle || 'liscia', cfg.slot || 'Pelle sella', 15)));
  const tm = threadMat(o.cuciture, o.pelle), bx = cfg.bx ?? .4, by = cfg.by ?? .2;
  if (A) {
    Z.add(stitches(C.ring(panel + .028), tm)); const lines = [];
    if (q === 'righe') for (let y0 = -Math.floor(by / (cell * .72)) * cell * .72; y0 <= by; y0 += cell * .72) { const L = []; for (let x = -bx; x <= bx; x += .002) L.push([x, y0]); lines.push(L); }
    else if (q === 'trasversali') for (let x0 = -Math.floor(bx / (cell * .9)) * cell * .9; x0 <= bx; x0 += cell * .9) { const L = []; for (let y = -by; y <= by; y += .002) L.push([x0, y]); lines.push(L); }
    else if (q === 'esagoni') { const sx = hr * Math.sqrt(3), sy = hr * 1.5; for (let r = -Math.ceil(by / sy) - 1; r <= Math.ceil(by / sy) + 1; r++) for (let qq = -Math.ceil(bx / sx) - 2; qq <= Math.ceil(bx / sx) + 2; qq++) { const cx = sx * (qq + r / 2), cy = sy * r; if (Math.abs(cx) > bx + sx || Math.abs(cy) > by + sy) continue;
      for (let k = 0; k < 3; k++) { const a0 = PI / 6 + k * PI / 3, a1 = a0 + PI / 3, L = []; for (let t = 0; t <= 1.0001; t += .002 / hr) L.push([cx + hr * ((1 - t) * Math.cos(a0) + t * Math.cos(a1)), cy + hr * ((1 - t) * Math.sin(a0) + t * Math.sin(a1))]); lines.push(L); } } }
    else for (let kk = -20; kk <= 20; kk++) for (const fam of [1, -1]) { const L = [], a = kk * cell * rt2; for (let t = -bx * 2; t <= bx * 2; t += .002) { const x = (a + t) / 2, y = fam > 0 ? (a - t) / 2 : (t - a) / 2; if (Math.abs(x) <= bx && Math.abs(y) <= by) L.push([x, y]); } if (L.length > 3) lines.push(L); }
    for (const L of lines) { let seg = []; const flush = () => { if (seg.length > 3) Z.add(stitches(seg, tm)); seg = []; }; for (const [x, y] of L) { if (C.sAt(x, y) < panel - .02) seg.push({ p: C.top(x, y), n: C.nTop(x, y) }); else flush(); } flush(); }
  }
  if (q === 'contorni') for (const r of (cfg.rings || [.42, .56, .7])) Z.add(stitches(C.ring(r), tm)); // cuciture a contorno (selle touring)
  Z.add(stitches(C.ring(.965), tm));
  if ((o.piping || 'tinta') !== 'no') { const pm = o.piping === 'contrasto' ? leather(o.pelle === 'nero' ? 'cuoio' : 'nero', 'liscia', 'Cordoncino', 30) : o.piping !== 'tinta' ? leather(o.piping, 'liscia', 'Cordoncino', 30) : leather(o.pelle, o.tipo_pelle || 'liscia', 'Cordoncino', 30); const pr = .0031; Z.add(mesh(closedSpline(C.rollRing(PI / 4).slice(0, -1).map(s => s.p.clone().addScaledVector(s.n, pr * .55)), 600, pr, 12), pm)); }
  if (!cfg.zBot) { const pa = mesh(extrudeShape(shapeFrom(outline.map(p => c.clone().lerp(p, .985))), .007, .0018, 3, 64), metal(o.fondo || 'wrinkle', 'Fondo sella')); pa.position.z = .004; Z.add(pa); }
  return G;
}
const outlineTrap = (len, wF, wR, rF, rR) => { // x: davanti +len/2, dietro -len/2 ; y laterale
  const hl = len / 2, P = [[hl, 0], [hl - rF * .1, wF / 2 * .7], [hl - rF * .55, wF / 2], [0, (wF + wR) / 4 * 1.02], [-hl + rR * .55, wR / 2], [-hl + rR * .1, wR / 2 * .72], [-hl, 0]];
  return smoothClosed([...P, ...P.slice(1, -1).reverse().map(p => [p[0], -p[1]])], 300); };

/* =============================== CODINI CAFÉ RACER =============================== */
const TAIL = {
  cafe: { L: .42, u1: .16, xf: .05, Hpk: .155, Ht: .095, kick: .012, Wf: .125, Wt: .07, Yb: .035, n: 2.6 },
  ducktail: { L: .44, u1: .15, xf: .05, Hpk: .15, Ht: .118, kick: .065, Wf: .125, Wt: .055, Yb: .055, n: 2.6 },
  tracker: { L: .46, u1: .06, xf: .02, Hpk: .075, Ht: .088, kick: .028, Wf: .12, Wt: .095, Yb: .02, n: 3.2 },
  brat: { L: .24, u1: .1, xf: .02, Hpk: .062, Ht: .058, kick: 0, Wf: .118, Wt: .105, Yb: .01, n: 3.4 }
};
function buildTailSection(o) {
  const G = new THREE.Group(), c = TAIL[o.tipo] || TAIL.cafe;
  const xu = u => u < c.u1 ? -c.xf * u / c.u1 : -c.xf - (c.L - c.xf) * (u - c.u1) / (1 - c.u1);
  const hu = u => { if (u < c.u1) return c.Hpk * Math.sin(PI / 2 * u / c.u1); const q = (u - c.u1) / (1 - c.u1); return c.Hpk + (c.Ht - c.Hpk) * Math.pow(q, 1.6) + c.kick * sstep(.74, 1, u); };
  const wu = u => u < c.u1 ? c.Wf : c.Wf + (c.Wt - c.Wf) * Math.pow((u - c.u1) / (1 - c.u1), 1.3);
  const yb = u => u < c.u1 ? 0 : c.Yb * Math.pow((u - c.u1) / (1 - c.u1), 1.5);
  const fn = (u, v) => { const th = v * PI, cs = Math.cos(th), sn = Math.sin(th), W = wu(u), Hh = Math.max(hu(u), yb(u) + .0005), Y = yb(u); return V3(xu(u), Y + (Hh - Y) * Math.pow(Math.max(0, sn), 2 / c.n), W * Math.sign(cs) * Math.pow(Math.abs(cs), 2 / c.n)); };
  const S = shell(fn, 110, 90, { thick: .0032 });
  const pm = paint(o.colore, o.vernice, 'Vernice codino'), im = o.interno === 'tinta' ? pm : fiber(); G.add(mesh(S.geo, [pm, im]));
  // fondello posteriore incassato
  const sec = []; for (let j = 0; j <= 60; j++) { const p = fn(1, j / 60); sec.push(p); }
  const xe = xu(1), cz = new THREE.Vector2(0, (yb(1) + hu(1)) / 2);
  const capPts = sec.map(p => new THREE.Vector2(-p.z, p.y)).map(p => cz.clone().lerp(p, .955));
  const cap = mesh(extrudeShape(shapeFrom(capPts), .004, .0008, 2, 32), pm); cap.rotation.y = PI / 2; cap.position.x = xe + .0045; G.add(cap);
  if (o.led !== 'no') {
    const lm = lens('rossa', 'Fanale LED'); lm.emissive = new THREE.Color(0x7a0000); lm.emissiveIntensity = .6;
    if (o.tipo === 'brat' || o.tipo === 'tracker') { const bar = mesh(new RoundedBoxGeometry(.008, .014, c.Wt * 1.3, 3, .004), lm); bar.position.set(xe - .001, (yb(1) + hu(1)) / 2, 0); G.add(bar); }
    else { const arc = sec.slice(6, 55).map(p => { const q = new THREE.Vector2(p.z, p.y), cc = new THREE.Vector2(0, cz.y); const r = cc.clone().lerp(q, .8); return V3(xe - .001, r.y, r.x); }); G.add(mesh(tubeAlong(new THREE.CatmullRomCurve3(arc), .0042, 120, 12), lm)); }
  }
  if (o.striscia !== 'no') G.add(stripeOn(S, o, .1, .985, .5, .03, 90));
  if (o.sella !== 'no') {
    let pad;
    if (o.tipo === 'tracker') { pad = seatPad(o, outlineTrap(.7, .2, .22, .1, .08), new THREE.Vector2(0, 0), { h: .062, rho: .018, cell: .04, bx: .36, by: .12 }); pad.position.set(-.04, hu(.3) - .004, 0); }
    else if (o.tipo === 'brat') { pad = seatPad(o, outlineTrap(.54, .21, .23, .07, .05), new THREE.Vector2(0, 0), { h: .07, rho: .019, cell: .042, bx: .29, by: .13 }); pad.position.set(.285, 0, 0); }
    else { pad = seatPad(o, outlineTrap(.36, .17, .24, .12, .06), new THREE.Vector2(-.02, 0), { h: .068, rho: .02, cell: .04, bx: .2, by: .13, crown: (x) => -.006 * Math.exp(-Math.pow((x + .02) / .1, 2)) }); pad.position.set(.18, 0, 0); }
    G.add(pad);
  }
  if (o.numero_gara === 'si') for (const s of [1, -1]) { const nb = numberBoard({ forma: 'tracker', colore_tabella: o.colore_tabella, colore_numero: o.colore_numero, numero: o.numero }, .21, .16); if (s < 0) nb.rotation.y = PI; nb.position.set(o.tipo === 'brat' ? .12 : -.06, -.075, s * (c.Wf + .012)); G.add(nb); }
  // staffe di fissaggio
  for (const s of [1, -1]) { const p = fn(.55, s > 0 ? 0 : 1), sc = buttonScrew(.006, metal('chrome', 'Viteria'), darkMat()); orient(sc, V3(0, 0, s)); sc.position.copy(p).add(V3(0, .018, s * .0012)); G.add(sc); }
  return G;
}
registerPro('codino', { n: 'Codino monoposto café racer', cat: 'Codini', type: 'tail', b: 'Dart, Motone, Kustom Tech, C-Racer', p: 1069, build: buildTailSection,
  opts: [sel('tipo', 'Modello', [['cafe', 'Café racer con gobba'], ['ducktail', 'Ducktail (coda d\'anatra)'], ['tracker', 'Flat tracker'], ['brat', 'Brat corto']], 'cafe'), col('colore', 'Colore', PAINT_DEF), sel('vernice', 'Vernice', PAINT_TYPE, 'lucido'), sel('interno', 'Interno', [['nero', 'Nero (vetroresina)'], ['tinta', 'In tinta']], 'nero'),
    sel('sella', 'Sella integrata', YN, 'si'), sel('trapuntatura', 'Trapuntatura', QUILT, 'righe'), sel('pelle', 'Colore pelle', LEATHER_COL, 'nero'), sel('tipo_pelle', 'Tipo di pelle', LEATHER_TYPE, 'liscia'), sel('cuciture', 'Cuciture', THREAD_COL, 'beige'), sel('piping', 'Cordoncino', [['tinta', 'In tinta'], ['contrasto', 'A contrasto'], ['no', 'Nessuno']], 'tinta'),
    sel('led', 'Fanale LED integrato', YN, 'si'), sel('striscia', 'Strisce racing', [['no', 'Nessuna'], ['centrale', 'Centrale'], ['doppia', 'Doppia']], 'no'), col('colore_striscia', 'Colore strisce', '#f2f2ee'),
    sel('numero_gara', 'Tabelle laterali col numero', YN, 'no'), num('numero', 'Numero di gara', 0, 99, 1, 7), col('colore_tabella', 'Colore tabelle', '#f2f2ee'), col('colore_numero', 'Colore numero', '#111111')] });

/* =============================== SELLE CAFÉ / BRAT / SCRAMBLER =============================== */
function buildCafeSeat(o) {
  const t = o.tipo; let G;
  if (t === 'brat') G = seatPad(o, outlineTrap(.62, .23, .25, .07, .06), new THREE.Vector2(0, 0), { h: .072, rho: .02, cell: .044, bx: .33, by: .14 });
  else if (t === 'scrambler') G = seatPad(o, outlineTrap(.68, .19, .25, .14, .06), new THREE.Vector2(0, 0), { h: .078, rho: .021, cell: .046, bx: .36, by: .14, crown: x => .014 * sstep(.0, -.2, x) - .006 * Math.exp(-Math.pow((x - .08) / .12, 2)) });
  else if (t === 'gunfighter') { const half = [[.2, 0], [.19, .06], [.15, .12], [.07, .148], [-.02, .15], [-.1, .13], [-.16, .085], [-.25, .068], [-.36, .062], [-.4, .04], [-.41, 0]]; G = seatPad(o, smoothClosed([...half, ...half.slice(1, -1).reverse().map(p => [p[0], -p[1]])], 320), new THREE.Vector2(-.03, 0), { h: .07, rho: .021, cell: .044, bx: .44, by: .16, crown: x => .03 * sstep(-.1, -.3, x) - .012 * Math.exp(-Math.pow((x - .03) / .1, 2)) + .006 * sstep(.1, .2, x) }); }
  else if (t === 'passeggero') G = seatPad(o, outlineTrap(.25, .19, .2, .06, .06), new THREE.Vector2(0, 0), { h: .058, rho: .017, cell: .038, bx: .14, by: .11, Ns: 56 });
  else if (t === 'stretta') G = seatPad(o, outlineTrap(.42, .13, .2, .1, .04), new THREE.Vector2(-.02, 0), { h: .055, rho: .016, cell: .036, bx: .22, by: .11, crown: x => .012 * sstep(-.08, -.2, x) });
  else G = seatPad(o, outlineTrap(.42, .17, .26, .12, .06), new THREE.Vector2(-.02, 0), { h: .07, rho: .02, cell: .04, bx: .22, by: .14, crown: x => (o.gobba === 'si' ? .045 * sstep(-.13, -.205, x) : 0) - .006 * Math.exp(-Math.pow((x + .01) / .1, 2)) });
  const W = new THREE.Group(); W.add(G);
  const tab = mesh(extrudeShape(roundRect(.034, .026, .006), .004, .001), metal('satin', 'Staffa')); tab.rotation.x = -PI / 2; tab.position.set(t === 'brat' || t === 'scrambler' ? .325 : t === 'gunfighter' ? .205 : .225, .004, 0); W.add(tab);
  return W;
}
registerPro('sella_cafe', { n: 'Sella café / brat / scrambler', cat: 'Selle', type: 'seat', b: 'Le Pera, Biltwell, Saddlemen, Motone, C-Racer', p: 31, build: buildCafeSeat,
  opts: [sel('tipo', 'Modello', [['cafe', 'Café racer monoposto'], ['brat', 'Brat piatta biposto'], ['scrambler', 'Scrambler lunga'], ['gunfighter', 'Gunfighter con coda'], ['stretta', 'Bobber stretta'], ['passeggero', 'Pad passeggero']], 'cafe'), sel('gobba', 'Bordo rialzato posteriore (café)', YN, 'si'),
    sel('trapuntatura', 'Trapuntatura', QUILT, 'righe'), sel('pelle', 'Colore pelle', LEATHER_COL, 'nero'), sel('tipo_pelle', 'Tipo di pelle', LEATHER_TYPE, 'liscia'), sel('cuciture', 'Cuciture', THREAD_COL, 'beige'), sel('piping', 'Cordoncino', [['tinta', 'In tinta'], ['contrasto', 'A contrasto'], ['no', 'Nessuno']], 'tinta'), sel('fondo', 'Fondo sella', FIN_METAL, 'wrinkle')] });

/* =============================== TABELLE PORTANUMERO =============================== */
function boardShape(forma, w, h) {
  if (forma === 'ovale') return shapeFrom(smoothClosed(Array.from({ length: 24 }, (_, i) => { const a = i / 24 * 2 * PI; return [Math.cos(a) * w / 2, Math.sin(a) * h / 2]; }), 160));
  if (forma === 'tracker') return shapeFrom(smoothClosed([[w / 2, h * .16], [w * .42, h * .42], [0, h / 2], [-w * .42, h * .42], [-w / 2, h * .16], [-w * .36, -h * .3], [0, -h / 2], [w * .36, -h * .3]], 160));
  return roundRect(w, h, Math.min(w, h) * .18);
}
function bendGeo(g, Rb) { if (!Rb) return g; const p = g.attributes.position, n = g.attributes.normal; for (let i = 0; i < p.count; i++) { const x = p.getX(i), f = Math.atan(x / Rb); p.setZ(i, p.getZ(i) - x * x / (2 * Rb)); if (n) { const nx = n.getX(i), nz = n.getZ(i); n.setXYZ(i, nx * Math.cos(f) + nz * Math.sin(f), n.getY(i), -nx * Math.sin(f) + nz * Math.cos(f)); } } p.needsUpdate = true; return g; }
export function numberBoard(o, w, h, Rb = 0) { // faccia +z, testo verso +x
  const g = new THREE.Group(), pm = paint(o.colore_tabella || '#f2f2ee', o.vernice_tabella || 'lucido', 'Tabella');
  g.add(mesh(bendGeo(extrudeShape(boardShape(o.forma, w, h), .004, .0013, 2, 64), Rb), pm));
  const dg = bendGeo(new THREE.PlaneGeometry(Math.min(w, h) * .92, Math.min(w, h) * .92, 24, 4), Rb); dg.translate(0, 0, .0042);
  if ((o.numero_si || 'si') !== 'no') g.add(mesh(dg, decalMat('Numero', new THREE.Color(o.colore_numero || '#111111'), glyphTex(String(Math.round(o.numero ?? 7)))), false));
  return g;
}
function buildBoards(o) {
  const G = new THREE.Group(), fm = metal(o.finitura, 'Staffe tabelle');
  if (o.tipo === 'frontale') { const w = .25, h = .2, nb = numberBoard(o, w, h, .42); nb.rotation.y = PI / 2; G.add(nb);
    for (const s of [1, -1]) { const br = mesh(tubeAlong(bentPath([V3(-.004, .03, s * .07), V3(-.045, .035, s * .075), V3(-.07, .05, s * .085)], .02), .005, 40, 12), fm); G.add(br); const sc = buttonScrew(.006, metal('chrome', 'Viteria'), darkMat()); orient(sc, V3(1, 0, 0)); sc.position.set(.005, .03, s * .07); G.add(sc); } }
  else for (const s of [1, -1]) { const nb = numberBoard(o, .22, .17, 0); if (s < 0) nb.rotation.y = PI; nb.position.z = s * .14; G.add(nb);
    for (const yy of [.05, -.05]) { const sc = buttonScrew(.0055, metal('chrome', 'Viteria'), darkMat()); orient(sc, V3(0, 0, s)); sc.position.set(-.06, yy, s * (.14 + .0045)); G.add(sc); }
    const br = mesh(new RoundedBoxGeometry(.03, .012, .05, 2, .003), fm); br.position.set(-.06, 0, s * .115); G.add(br); }
  return G;
}
registerPro('tabella', { n: 'Tabelle portanumero tracker', cat: 'Carene', type: 'fairing', b: 'Biltwell, Lowbrow, Kustom Tech', p: 1049, build: buildBoards,
  opts: [sel('tipo', 'Posizione', [['frontale', 'Frontale (sulla forcella)'], ['laterali', 'Laterali (coppia)']], 'frontale'), sel('forma', 'Forma', [['ovale', 'Ovale'], ['tracker', 'Ovale tracker'], ['rettangolare', 'Rettangolare']], 'tracker'), col('colore_tabella', 'Colore tabella', '#f2f2ee'), sel('vernice_tabella', 'Vernice', PAINT_TYPE, 'lucido'),
    sel('numero_si', 'Numero', YN, 'si'), num('numero', 'Numero di gara', 0, 99, 1, 7), col('colore_numero', 'Colore numero', '#111111'), sel('finitura', 'Staffe', FIN_METAL, 'gloss')] });

/* =============================== SEMIMANUBRI (CLIP-ON) =============================== */
function gripAlong(dir, start, L, gm, fm, styleBillet) {
  const g = new THREE.Group(), rb = .011; let prof = [[rb + .0004, 0], [.0175, .0015]];
  if (styleBillet) prof = [[rb + .0004, 0], [.0175, .001], [.0175, L - .001], [rb + .0004, L]]; else { for (let y = .006; y < L - .006; y += .0042) prof.push([.0168, y], [.0178, y + .0012], [.0178, y + .0026], [.0168, y + .0038]); prof.push([.0172, L - .003], [rb + .0004, L]); }
  g.add(mesh(lathe(prof, 56, .0004), gm)); if (styleBillet) for (const y of [.025, .06, .095]) { const ri = mesh(new THREE.TorusGeometry(.0178, .0026, 10, 56), rubber('Anelli manopole')); ri.rotation.x = PI / 2; ri.position.y = y; g.add(ri); }
  g.add(mesh(lathe([[0, L], [.0168, L], [.019, L + .004], [.019, L + .02], [.017, L + .024], [0, L + .025]], 56, .001), fm));
  g.quaternion.setFromUnitVectors(V3(0, 1, 0), dir); g.position.copy(start); return g;
}
function lever(pts, m) { return mesh(new THREE.ExtrudeGeometry(roundRect(.0062, .014, .0026), { steps: 90, bevelEnabled: false, extrudePath: bentPath(pts, .02) }), m); }
function buildClipons(o) {
  const G = new THREE.Group(), K = new THREE.Group(); G.add(K); const rake = 29 * PI / 180; K.rotation.z = rake;
  const rf = o.forcella / 2000, half = o.interasse / 2, cm = metal(o.finitura, 'Semimanubri'), tm = metal(o.finitura_tubo, 'Tubo manubrio'), rb = .011, Lb = .25;
  const drop = o.inclinazione * PI / 180, sweep = 9 * PI / 180, qInv = new THREE.Quaternion().setFromAxisAngle(V3(0, 0, 1), -rake), fwd = V3(1, 0, 0).applyQuaternion(qInv), upK = V3(0, 1, 0).applyQuaternion(qInv);
  const gm = o.manopole === 'billet' ? metal('brushed', 'Manopole') : o.manopole === 'pelle' ? leather('nero', 'liscia', 'Manopole', 40) : rubber('Manopole');
  for (const s of [1, -1]) {
    const S = new THREE.Group(); S.position.z = s * half; K.add(S);
    S.add(mesh(lathe([[rf + .0002, 0], [rf + .0085, 0], [rf + .0105, .002], [rf + .0105, .043], [rf + .0085, .045], [rf + .0002, .045]], 72, .0008), cm));
    const slot = mesh(new THREE.BoxGeometry(.0035, .046, .006), darkMat('Taglio collare')); slot.position.set(-(rf + .0085), .0225, 0); S.add(slot);
    for (const y of [.011, .034]) { const ear = mesh(new RoundedBoxGeometry(.012, .012, .03, 2, .003), cm); ear.position.set(-(rf + .012), y, 0); S.add(ear); const sc = capScrew(.0055, metal('blackchrome', 'Viteria'), darkMat()); sc.rotation.x = PI / 2; sc.position.set(-(rf + .012), y, .015); S.add(sc); }
    const dir = V3(-Math.sin(sweep), -Math.sin(drop), s * Math.cos(sweep)).normalize().applyQuaternion(qInv), o0 = V3(0, .026, 0);
    const boss = mesh(lathe([[rb + .0003, 0], [rb + .0065, 0], [rb + .0075, .002], [rb + .0075, .03], [rb + .006, .033], [rb + .0003, .033]], 56, .0008), cm); boss.quaternion.setFromUnitVectors(V3(0, 1, 0), dir); boss.position.copy(o0).addScaledVector(dir, rf - .002); S.add(boss);
    const pb = capScrew(.005, metal('blackchrome', 'Viteria'), darkMat()); orient(pb, upK); pb.position.copy(o0).addScaledVector(dir, rf + .016).addScaledVector(upK, rb + .007); S.add(pb);
    const tube = mesh(new THREE.CylinderGeometry(rb, rb, Lb, 40), tm); tube.quaternion.setFromUnitVectors(V3(0, 1, 0), dir); tube.position.copy(o0).addScaledVector(dir, rf + Lb / 2); S.add(tube);
    S.add(gripAlong(dir, o0.clone().addScaledVector(dir, rf + Lb - .128), .125, gm, metal(['gloss', 'satin', 'wrinkle'].includes(o.finitura) ? 'gloss' : 'chrome', 'Contrappesi'), o.manopole === 'billet'));
    if (o.leve === 'si') {
      const lm = metal(o.finitura_leve || 'brushed', 'Leve'), pc = o0.clone().addScaledVector(dir, rf + Lb - .147);
      const perch = mesh(lathe([[rb + .0003, 0], [rb + .007, 0], [rb + .0078, .002], [rb + .0078, .018], [rb + .007, .02], [rb + .0003, .02]], 48, .0008), lm); perch.quaternion.setFromUnitVectors(V3(0, 1, 0), dir); perch.position.copy(pc); S.add(perch);
      const piv = pc.clone().addScaledVector(fwd, .026).addScaledVector(dir, .012).addScaledVector(upK, -.004);
      const hub = mesh(new RoundedBoxGeometry(.02, .016, .024, 3, .004), lm); hub.position.copy(pc.clone().addScaledVector(fwd, .016).addScaledVector(dir, .01)); hub.quaternion.setFromUnitVectors(V3(0, 0, 1), dir); S.add(hub);
      S.add(lever([piv, piv.clone().addScaledVector(dir, .045).addScaledVector(fwd, .016), piv.clone().addScaledVector(dir, .13).addScaledVector(fwd, .014), piv.clone().addScaledVector(dir, .162).addScaledVector(fwd, .006)], lm));
      if (s > 0) { const res = mesh(lathe([[0, 0], [.015, 0], [.016, .003], [.016, .024], [.017, .026], [.017, .031], [0, .032]], 48, .001), lm); res.position.copy(pc.clone().addScaledVector(upK, rb + .006).addScaledVector(dir, .01).addScaledVector(fwd, -.004)); res.quaternion.setFromUnitVectors(V3(0, 1, 0), upK); S.add(res);
        const win = mesh(new THREE.CylinderGeometry(.0161, .0161, .009, 48, 1, true, -PI / 2 - .5, 1), new THREE.MeshPhysicalMaterial({ name: 'Spia livello', color: 0x5a4a20, roughness: .1, transmission: .6 })); win.position.copy(res.position).addScaledVector(upK, .012); win.quaternion.copy(res.quaternion); S.add(win); }
      else { const cab = []; const a = pc.clone().addScaledVector(fwd, .03).addScaledVector(dir, -.004); cab.push(a, a.clone().addScaledVector(dir, -.05).addScaledVector(fwd, .02), a.clone().addScaledVector(dir, -.12).addScaledVector(upK, -.09).addScaledVector(fwd, .03), a.clone().addScaledVector(dir, -.17).addScaledVector(upK, -.2)); S.add(mesh(tubeAlong(new THREE.CatmullRomCurve3(cab), .0032, 80, 10), rubber('Guaina cavo'))); }
    }
  }
  return G;
}
registerPro('semimanubri', { n: 'Semimanubri clip-on (coppia)', cat: 'Manubri', type: 'bars', b: 'Tarozzi, LSL, ABM, Gilles, Rizoma', p: 873, build: buildClipons,
  opts: [sel('forcella', 'Ø forcella', [['39', '39 mm'], ['41', '41 mm'], ['43', '43 mm'], ['49', '49 mm']], '41'), num('interasse', 'Interasse steli', .17, .27, .005, .21, 'm'), num('inclinazione', 'Inclinazione', 0, 16, 1, 8, '°'),
    sel('finitura', 'Collari', FIN_METAL, 'gloss'), sel('finitura_tubo', 'Tubi', FIN_METAL, 'satin'), sel('manopole', 'Manopole', [['gomma', 'Gomma rigata'], ['billet', 'Billet con anelli'], ['pelle', 'Pelle']], 'gomma'), sel('leve', 'Leve freno/frizione', YN, 'si'), sel('finitura_leve', 'Finitura leve', FIN_METAL, 'brushed')] });

/* =============================== PEDANE ARRETRATE (REARSET) =============================== */
function buildRearset(o) {
  const G = new THREE.Group(), M = new THREE.Group(); G.add(M); if (o.lato === 'sinistro') M.scale.z = -1;
  const fm = metal(o.finitura, 'Pedane arretrate'), bm = metal('chrome', 'Viteria'), dk = darkMat(), am = metal(o.finitura_leva || o.finitura, 'Leva');
  const ps = shapeFrom(smoothClosed([[.075, .045], [.03, .05], [-.03, .035], [-.08, .012], [-.092, -.012], [-.07, -.03], [-.01, -.03], [.05, -.03], [.085, -.012], [.09, .02]], 180));
  for (const [hx, hy, r] of [[.065, .025, .0055], [-.07, .002, .0055]]) { const p = new THREE.Path(); p.absarc(hx, hy, r, 0, 2 * PI, true); ps.holes.push(p); }
  if (o.piastra === 'forata') for (const [hx, hy, r] of [[.022, .016, .011], [-.022, .006, .009], [.035, -.012, .007]]) { const p = new THREE.Path(); p.absarc(hx, hy, r, 0, 2 * PI, true); ps.holes.push(p); }
  M.add(mesh(extrudeShape(ps, .007, .0016, 3, 64), fm));
  for (const [hx, hy] of [[.065, .025], [-.07, .002]]) { const sc = capScrew(.008, bm, dk); sc.rotation.x = PI / 2; sc.position.set(hx, hy, .0075); M.add(sc); }
  const pg = new THREE.Group(), kn = fm.clone(); kn.name = 'Piolo'; kn.normalMap = T.knurl(); kn.normalMap.repeat.set(3, 1.5); kn.normalScale = new THREE.Vector2(1, 1);
  if (o.piolo === 'gomma') { const pr = [[.006, 0], [.0125, 0]]; for (let y = .006; y < .062; y += .0055) pr.push([.0125, y], [.0145, y + .0014], [.0145, y + .004], [.0125, y + .0055]); pr.push([.0125, .066], [0, .066]); pg.add(mesh(lathe(pr, 40, .0005), rubber('Gomma piolo'))); }
  else pg.add(mesh(lathe([[.006, 0], [.012, 0], [.0125, .002], [.0125, .064], [.011, .068], [0, .069]], 56, .0008), kn));
  pg.rotation.x = PI / 2; pg.position.set(-.07, -.012, .007); M.add(pg);
  const piv = V3(.055, -.018, .012), boss = mesh(lathe([[.004, 0], [.012, 0], [.0125, .001], [.0125, .012], [.004, .012]], 40, .0008), fm); boss.rotation.x = PI / 2; boss.position.set(piv.x, piv.y, .007); M.add(boss);
  const arm = lever([V3(piv.x, piv.y, .022), V3(piv.x + .05, piv.y - .012, .024), V3(piv.x + .11, piv.y - .02, .026), V3(piv.x + .135, piv.y - .018, .026)], am); M.add(arm);
  const toe = mesh(lathe([[.004, 0], [.0085, 0], [.009, .002], [.009, .04], [.008, .043], [0, .044]], 40, .0008), kn); toe.rotation.x = PI / 2; toe.position.set(piv.x + .135, piv.y - .018, .026); M.add(toe);
  const nut = mesh(hexPrism(.014, .007, 0), bm); nut.rotation.x = PI / 2; nut.position.set(piv.x, piv.y, .03); M.add(nut);
  if (o.lato === 'sinistro') { const up = lever([V3(piv.x, piv.y, .019), V3(piv.x - .005, piv.y + .03, .019), V3(piv.x - .004, piv.y + .045, .019)], am); M.add(up);
    const a = V3(piv.x - .004, piv.y + .045, .015), b = V3(piv.x + .14, piv.y + .07, -.03); const rod = mesh(new THREE.CylinderGeometry(.003, .003, a.distanceTo(b) - .02, 16), bm); rod.quaternion.setFromUnitVectors(V3(0, 1, 0), b.clone().sub(a).normalize()); rod.position.copy(a.clone().lerp(b, .5)); M.add(rod);
    for (const p of [a, b]) { const re = mesh(new THREE.SphereGeometry(.0068, 24, 16), metal('chrome', 'Uniball')); re.position.copy(p); M.add(re); } }
  else { const mc = new THREE.Group(); mc.add(mesh(lathe([[0, 0], [.0105, 0], [.011, .003], [.011, .045], [.0095, .05], [0, .05]], 40, .001), metal('brushed', 'Pompa freno'))); mc.add(mesh(new RoundedBoxGeometry(.03, .01, .022, 2, .003), metal('brushed', 'Pompa freno'))); mc.position.set(.012, -.035, -.016); M.add(mc);
    const a = V3(.012, -.035, -.016), b = V3(piv.x + .03, piv.y - .006, .02); const rod = mesh(new THREE.CylinderGeometry(.0028, .0028, a.distanceTo(b), 12), bm); rod.quaternion.setFromUnitVectors(V3(0, 1, 0), b.clone().sub(a).normalize()); rod.position.copy(a.clone().lerp(b, .5)); M.add(rod);
    const hose = mesh(tubeAlong(new THREE.CatmullRomCurve3([V3(.012, .015, -.016), V3(.02, .05, -.025), V3(.06, .07, -.04), V3(.12, .06, -.05)]), .0035, 60, 10), rubber('Tubo freno')); M.add(hose); }
  return G;
}
registerPro('pedane_arretrate', { n: 'Pedane arretrate (rearset)', cat: 'Comandi', type: 'frame', b: 'Tarozzi, LSL, Gilles, Rizoma', p: 999, build: buildRearset,
  opts: [sel('lato', 'Lato', [['destro', 'Destro (freno)'], ['sinistro', 'Sinistro (cambio)']], 'destro'), sel('finitura', 'Piastre', FIN_METAL, 'contrast'), sel('finitura_leva', 'Leva', FIN_METAL, 'brushed'), sel('piastra', 'Piastra', [['forata', 'Alleggerita forata'], ['piena', 'Piena']], 'forata'), sel('piolo', 'Pioli', [['zigrinato', 'Alluminio zigrinato'], ['gomma', 'Gomma']], 'zigrinato')] });
