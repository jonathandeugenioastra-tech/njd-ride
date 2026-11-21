/* NJ.D' RIDE – Scarichi montati sulle luci di scarico reali del motore (misure ufficiali: collettori 1-3/4" = 44,45 mm,
   silenziatori 2-1/8" = 54 mm, 3" = 76 mm, megafono 4-1/2" = 114 mm, paracalore 2-1/2" = 63,5 mm). Tipologie ricavate dalle foto
   di riferimento dell'autore: shotgun, staggered corti, drag pipes, 2 in 1 Pro Pipe, 2 in 1 alto in titanio, 2 in 2 Big Radius, fishtail.
   © 2026 dott. Jonathan D'Eugenio – Tutti i diritti riservati (L. 633/1941). Nessun logo riprodotto. */
import * as THREE from 'three';
import { H } from './pro.js';
const { mesh, lathe, metal, darkMat, V3, PI, clamp } = H;
const MM = .001;

/* ---------- materiali fotorealistici ---------- */
const NOISE = {};
function ntex(key, fn, size = 256, str = 2) { if (NOISE[key]) return NOISE[key]; const c = document.createElement('canvas'); c.width = c.height = size; const g = c.getContext('2d'); const Hh = new Float32Array(size * size);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) Hh[y * size + x] = fn(x / size, y / size);
  const id = g.createImageData(size, size), d = id.data; for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) { const a = (Hh[y * size + (x + 1) % size] - Hh[y * size + (x - 1 + size) % size]) * str, b = (Hh[((y + 1) % size) * size + x] - Hh[((y - 1 + size) % size) * size + x]) * str, l = Math.hypot(a, b, 1), i = (y * size + x) * 4; d[i] = (-a / l * .5 + .5) * 255; d[i + 1] = (b / l * .5 + .5) * 255; d[i + 2] = (1 / l * .5 + .5) * 255; d[i + 3] = 255; }
  g.putImageData(id, 0, 0); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return NOISE[key] = t; }
const wrapTex = () => ntex('wrapX', (u, v) => { const b = (u * 8 + v * 1.0) % 1; return Math.pow(Math.sin(PI * b), .35) + .12 * Math.sin(u * 2 * PI * 64) * Math.sin(v * 2 * PI * 3); }, 256, 3);
const perfTex = () => ntex('perf', (u, v) => { const a = (u * 14) % 1 - .5, b = (v * 14 + (Math.floor(u * 14) % 2) * .5) % 1 - .5; return Math.hypot(a, b) < .28 ? -1 : 0; }, 256, 4);
function pipeMaterial(fin) {
  fin = { ceramico: 'nero', brushed: 'inox' }[fin] || fin; let m;
  switch (fin) {
    case 'nero': m = new THREE.MeshPhysicalMaterial({ color: 0x101012, metalness: .25, roughness: .62, clearcoat: .15, clearcoatRoughness: .5 }); break;           // ceramico nero opaco
    case 'nero_lucido': m = new THREE.MeshPhysicalMaterial({ color: 0x0b0b0c, metalness: .3, roughness: .28, clearcoat: 1, clearcoatRoughness: .05 }); break;
    case 'titanio': m = new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 1, roughness: .16, vertexColors: true, iridescence: .55, iridescenceIOR: 2.0, iridescenceThicknessRange: [300, 820], anisotropy: .5 }); break;
    case 'inox': m = metal('brushed', 'Scarico'); break;
    case 'blackchrome': m = metal('blackchrome', 'Scarico'); break;
    case 'ottone': m = new THREE.MeshPhysicalMaterial({ color: 0xc9a25a, metalness: 1, roughness: .2, anisotropy: .4 }); break;
    default: m = metal('chrome', 'Scarico');
  }
  m.name = 'Scarico'; m.side = THREE.DoubleSide; return m;
}
/* colore termico del titanio lungo il tubo: paglierino vicino alla testa, poi viola, blu e grigio */
const HEAT = [[0, [.78, .74, .70]], [.05, [.92, .78, .45]], [.12, [.78, .45, .55]], [.2, [.38, .42, .85]], [.32, [.55, .68, .9]], [.5, [.74, .74, .76]], [1, [.78, .78, .8]]];
function heatCol(u) { for (let i = 1; i < HEAT.length; i++) if (u <= HEAT[i][0]) { const [a, A] = HEAT[i - 1], [b, B] = HEAT[i], f = (u - a) / (b - a); return A.map((x, k) => x + (B[k] - x) * f); } return HEAT[HEAT.length - 1][1]; }
function heatWrapMat(c) { const col = { nera: 0x1a1a1a, titanio: 0x6e6658, sabbia: 0xb7a37e }[c] ?? 0x1a1a1a; const t = wrapTex().clone(); t.needsUpdate = true;
  return new THREE.MeshPhysicalMaterial({ name: 'Fascia termica', color: col, roughness: .93, sheen: .8, sheenRoughness: .7, sheenColor: new THREE.Color(col).multiplyScalar(1.8), normalMap: t, normalScale: new THREE.Vector2(1.3, 1.3) }); }

/* ---------- geometria ---------- */
function curveOf(pts) { return new THREE.CatmullRomCurve3(pts, false, 'centripetal', .5); }
function tube(curve, r, mat, opt = {}) {
  const L = curve.getLength(), seg = Math.max(24, Math.round(L / .006)), rs = 40; const g = new THREE.TubeGeometry(curve, seg, r, rs, false);
  const pos = g.attributes.position, v = new THREE.Vector3();
  if (opt.tip === 'slash' || opt.tip === 'fishtail' || opt.tip === 'turn') {
    const P = curve.getPointAt(1), t = curve.getTangentAt(1).normalize(), up = V3(0, 1, 0), side = t.clone().cross(up).normalize(), vup = side.clone().cross(t).normalize();
    if (opt.tip === 'slash') { const n = t.clone().addScaledVector(vup, -Math.tan(32 * PI / 180)).normalize(); for (let i = 0; i < pos.count; i++) { v.fromBufferAttribute(pos, i); const d = v.clone().sub(P).dot(n); if (d > -r * 1.2) { const back = (d + r * .78) / t.dot(n); if (back > 0) { v.addScaledVector(t, -back); pos.setXYZ(i, v.x, v.y, v.z); } } } }
    if (opt.tip === 'fishtail') { const FL = r * 6; for (let i = 0; i < pos.count; i++) { v.fromBufferAttribute(pos, i); const s = v.clone().sub(P).dot(t) + FL; if (s > 0) { const u = clamp(s / FL, 0, 1), ax = P.clone().addScaledVector(t, s - FL), rel = v.clone().sub(ax); const a = rel.dot(vup), b = rel.dot(side); const q = ax.clone().addScaledVector(vup, a * (1 + 1.1 * u * u)).addScaledVector(side, b * (1 - .6 * u)); pos.setXYZ(i, q.x, q.y, q.z); } } }
  }
  if (opt.heat) { const col = new Float32Array(pos.count * 3); for (let i = 0; i < pos.count; i++) { const u = Math.floor(i / (rs + 1)) / seg, c = heatCol(clamp(u * (opt.heatScale || 1), 0, 1)); col.set(c, i * 3); } g.setAttribute('color', new THREE.BufferAttribute(col, 3)); }
  g.computeVertexNormals(); const G = new THREE.Group(); G.add(mesh(g, mat));
  if (!opt.noInner) { const tail = []; for (let i = 0; i <= 8; i++) tail.push(curve.getPointAt(.94 + .06 * i / 8)); const ig = new THREE.TubeGeometry(curveOf(tail), 12, r * .9, 24, false); G.add(mesh(ig, darkMat('Interno scarico'), false)); }
  return G;
}
function along(curve, a, b, n = 40) { const P = []; for (let i = 0; i <= n; i++) P.push(curve.getPointAt(a + (b - a) * i / n)); return curveOf(P); }
/* fascetta / flangia orientata */
function ring(p, dir, rIn, rOut, w, mat) { const g = lathe([[rIn, -w / 2], [rOut, -w / 2], [rOut + w * .15, 0], [rOut, w / 2], [rIn, w / 2]], 48, w * .12); const m = mesh(g, mat); m.quaternion.setFromUnitVectors(V3(0, 1, 0), dir.clone().normalize()); m.position.copy(p); return m; }
/* corpo cilindrico/conico lungo un asse (profilo [raggio, distanza]) */
function body(p0, dir, prof, mat, seg = 96) { const g = lathe(prof, seg, .0015); const m = mesh(g, mat); m.quaternion.setFromUnitVectors(V3(0, 1, 0), dir.clone().normalize()); m.position.copy(p0); return m; }
/* paracalore forato a 220° sul lato esterno del tubo */
function shield(curve, a, b, r, outward, mat) {
  const c = along(curve, a, b, 30), L = c.getLength(), seg = Math.max(12, Math.round(L / .008)), rs = 30, R = r * 1.43; const g = new THREE.BufferGeometry(); const P = [], N = [], U = [], I = [];
  const fr = c.computeFrenetFrames(seg, false); for (let i = 0; i <= seg; i++) { const o = c.getPointAt(i / seg), t = fr.tangents[i]; const o2 = outward.clone().sub(t.clone().multiplyScalar(outward.dot(t))).normalize(); const o3 = t.clone().cross(o2);
    for (let j = 0; j <= rs; j++) { const th = (-110 + 220 * j / rs) * PI / 180, n = o2.clone().multiplyScalar(Math.cos(th)).addScaledVector(o3, Math.sin(th)); const e = Math.min(1, Math.min(i, seg - i) / 2); P.push(...o.clone().addScaledVector(n, R * (.96 + .04 * e)).toArray()); N.push(...n.toArray()); U.push(i / seg * L * 18, j / rs * 3); } }
  for (let i = 0; i < seg; i++) for (let j = 0; j < rs; j++) { const a0 = i * (rs + 1) + j, b0 = a0 + rs + 1; I.push(a0, b0, a0 + 1, b0, b0 + 1, a0 + 1); }
  g.setIndex(I); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2));
  const m = mesh(g, mat); m.material.side = THREE.DoubleSide; return m;
}

/* ---------- costruttore ---------- */
export function buildPortExhaust(o, E) {
  const k = E.k, s = E.side >= 0 ? 1 : -1, zc = (E.front[2] + E.rear[2]) / 2, G = new THREE.Group();
  const F = V3(...E.F), R = V3(...E.R), Fo = V3(...E.Fd).negate(), Ro = V3(...E.Rd).negate();
  const rH = 44.45 / 2 * MM * k * (o.diametro === '2' ? 50.8 / 44.45 : 1), zr = zc + s * Math.max(Math.abs(E.zrun - zc), .17 * k), xA = E.rear[0], yA = E.rear[1], Rw = E.Rw;
  const ylow = Math.max(E.ylow, .15 * k), pm = pipeMaterial(o.finitura), heat = o.finitura === 'titanio';
  const chrome = metal('chrome', 'Flange'), clampM = metal(['nero', 'nero_lucido', 'ceramico', 'blackchrome'].includes(o.finitura) ? 'satin' : 'polished', 'Fascette');
  const wrap = o.fascia && o.fascia !== 'no' ? heatWrapMat(o.fascia) : null;
  const out = V3(0, 0, s);
  const addPipe = (pts, tip, opt = {}) => { const c = curveOf(pts); G.add(tube(c, opt.r || rH, pm, { tip, heat, heatScale: opt.heatScale || 1.6 }));
    if (!opt.noFlange) { G.add(ring(pts[0].clone().addScaledVector(c.getTangentAt(0), .012 * k), c.getTangentAt(0), rH * .98, rH * 1.75, 7.9 * MM * k, chrome)); }
    if (wrap && !opt.noWrap) { const w = tube(along(c, .03, .45), rH * 1.06, wrap, { noInner: true }); const L = c.getLength() * .42; w.children[0].material.normalMap.repeat.set(L / (.03 * k), 1); G.add(w); }
    return c; };
  // collettori: escono dalla luce lungo il suo asse, poi scendono verso il lato scarico
  const f1 = F.clone().addScaledVector(Fo, .055 * k), r1 = R.clone().addScaledVector(Ro, .05 * k);
  const fDown = (yEnd, xEnd) => { const y3 = Math.min(Math.max(yEnd + .1 * k, F.y - .3 * k), F.y - .1 * k), y2 = Math.min(Math.max(F.y - .16 * k, y3 + .05 * k), F.y - .03 * k); // discesa sempre monotona anche con luci basse
    return [F, f1, V3(F.x + .05 * k, y2, zc + (zr - zc) * .55), V3(F.x + .02 * k, y3, zr), V3(F.x - .12 * k, yEnd, zr), V3(xEnd, yEnd, zr)]; };
  const rDown = (yEnd, xEnd) => [R, r1, V3(R.x - .02 * k, R.y - .08 * k, zc + (zr - zc) * .75), V3(R.x - .07 * k, Math.max(yEnd + .07 * k, R.y - .2 * k), zr + s * .01 * k), V3(R.x - .17 * k, yEnd, zr + s * .012 * k), V3(xEnd, yEnd, zr + s * .012 * k)];
  const tip = o.terminale || 'slash', t = o.tipo || 'shotgun';
  const clampAt = (c, u) => { const p = c.getPointAt(u), d = c.getTangentAt(u); G.add(ring(p, d, rH * 1.01, rH * 1.12, 12 * MM * k, clampM)); };
  if (t === 'shotgun' || t === 'drag' || t === 'fishtail') {
    const gap = (t === 'drag' ? 2.15 : 2.45) * rH, yF = ylow, yR = ylow + gap;
    const xEnd = t === 'drag' ? xA + Rw * .55 : t === 'fishtail' ? xA - Rw * .35 : xA - Rw * .15;
    const rise = t === 'shotgun' ? .035 * k : t === 'fishtail' ? .015 * k : 0;
    const cf = addPipe([...fDown(yF, R.x - .25 * k).slice(0, -1), V3(R.x - .3 * k, yF, zr), V3(xEnd, yF + rise, zr)], t === 'fishtail' ? 'fishtail' : tip);
    const cr = addPipe([...rDown(yR, R.x - .3 * k).slice(0, -1), V3(xEnd + (t === 'drag' ? .0 : .01 * k), yR + rise, zr + s * .012 * k)], t === 'fishtail' ? 'fishtail' : tip);
    // staffa di collegamento dei due tubi e fascette
    for (const x of [R.x - .45 * k, xEnd + .18 * k]) if (x > xEnd + .06 * k) { const uf = clamp(1 - (x - xEnd) / (R.x - .3 * k - xEnd) * .25, .6, .97), ur = clamp(1 - (x - xEnd) / (R.x - .3 * k - xEnd) * .25, .6, .97);
      const a = cf.getPointAt(uf), b = cr.getPointAt(ur); const br = new THREE.Mesh(new THREE.BoxGeometry(.024 * k, b.y - a.y, .004 * k), clampM); br.position.set((a.x + b.x) / 2, (a.y + b.y) / 2, zr - s * rH * .7); br.castShadow = true; G.add(br); clampAt(cf, uf); clampAt(cr, ur); }
    if (o.paracalore === 'si') { G.add(shield(cf, .14, .42, rH, out, metal(['ceramico', 'blackchrome'].includes(o.finitura) ? 'satin' : 'chrome', 'Paracalore'))); G.add(shield(cr, .14, .4, rH, out, metal(['ceramico', 'blackchrome'].includes(o.finitura) ? 'satin' : 'chrome', 'Paracalore'))); }
  } else if (t === 'sfalsati') { // Shortshots Staggered: collettori corti con paracalore + silenziatori 2-1/8" tagliati obliqui
    const rM = 54 * MM * k / 2, yF = ylow + .01 * k, yR = yF + 2.5 * rH, xF = R.x - .42 * k, xR = R.x - .3 * k;
    const cf = addPipe([...fDown(yF, R.x - .15 * k).slice(0, -1), V3(xF, yF + .02 * k, zr)], tip, { r: rM });
    const cr = addPipe([...rDown(yR, R.x - .2 * k).slice(0, -1), V3(xR, yR + .025 * k, zr + s * .012 * k)], tip, { r: rM });
    const shM = ['nero', 'nero_lucido', 'ceramico', 'blackchrome'].includes(o.finitura) ? pipeMaterial('nero') : metal('chrome', 'Paracalore');
    G.add(shield(cf, .2, .8, rM, out, shM)); G.add(shield(cr, .22, .78, rM, out, shM));
    clampAt(cf, .5); clampAt(cr, .5);
  } else if (t === '2in1' || t === 'megafono') { // Pro Pipe: collettore di unione sotto il cambio, megafono 4-1/2"
    const yC = ylow + .02 * k, C = V3(R.x - .2 * k, yC, zr + s * .005 * k), rMeg = 114.3 * MM * k / 2;
    addPipe([...fDown(yC, C.x + .06 * k).slice(0, -1), C.clone().add(V3(.02 * k, -.004 * k, 0))], 'dritto', { heatScale: 1.4 });
    addPipe([...rDown(yC + .03 * k, C.x + .05 * k).slice(0, 3), V3(R.x - .1 * k, yC + .06 * k, zr), C.clone().add(V3(.015 * k, .008 * k, 0))], 'dritto', { heatScale: 1.4 });
    const E2 = V3(xA - Rw * .05, yC + .055 * k, zr + s * .008 * k), dir = E2.clone().sub(C).normalize(), L = E2.distanceTo(C);
    const prof = t === 'megafono' ? [[rH * 1.3, 0], [rH * 1.35, .05 * k], [rMeg * .75, L * .55], [rMeg, L - .012 * k], [rMeg * 1.04, L]] : [[rH * 1.3, 0], [rH * 1.42, .045 * k], [rMeg * .62, .17 * k], [rMeg * .62, .22 * k], [rMeg * .8, .26 * k], [rMeg * .8, .34 * k], [rMeg, .4 * k], [rMeg, L - .01 * k], [rMeg * 1.03, L]];
    G.add(body(C, dir, prof, pm)); const cap = mesh(new THREE.CircleGeometry(rMeg * .98, 64), darkMat('Interno scarico')); cap.quaternion.setFromUnitVectors(V3(0, 0, 1), dir.clone().negate()); cap.position.copy(C).addScaledVector(dir, L - .006 * k); G.add(cap);
    const baf = body(C.clone().addScaledVector(dir, L - .02 * k), dir, [[rMeg * .45, 0], [rMeg * .6, 0], [rMeg * .6, .015 * k], [rMeg * .45, .015 * k]], metal('polished', 'Db-killer'), 48); G.add(baf);
    G.add(ring(C.clone().addScaledVector(dir, .03 * k), dir, rH * 1.4, rH * 1.6, 14 * MM * k, clampM));
    const tab = new THREE.Mesh(new THREE.BoxGeometry(.05 * k, .006 * k, .03 * k), clampM); tab.position.copy(C).addScaledVector(dir, L * .62).add(V3(0, rMeg + .004 * k, -s * .01 * k)); G.add(tab);
  } else if (t === 'alto') { // 2 in 1 alto in titanio stile special: collettori sotto il motore, silenziatore conico che sale sotto la sella
    const yC = ylow + .015 * k, C = V3(R.x - .1 * k, yC + .02 * k, zr + s * .01 * k), rS = 76 * MM * k / 2;
    addPipe([...fDown(yC, C.x + .05 * k).slice(0, -1), C.clone().add(V3(.02 * k, 0, 0))], 'dritto', { heatScale: 1.2 });
    addPipe([...rDown(yC + .025 * k, C.x + .04 * k).slice(0, 3), V3(R.x - .06 * k, yC + .07 * k, zr), C.clone().add(V3(.015 * k, .01 * k, 0))], 'dritto', { heatScale: 1.2 });
    const E2 = V3(xA + Rw * .62, yA + Rw * .12, zr + s * .03 * k), mid = V3((C.x + E2.x) / 2 + .02 * k, C.y + .04 * k, zr + s * .02 * k);
    const cc = curveOf([C, mid, E2]); G.add(tube(cc, rH * 1.15, pm, { heat, heatScale: .8, noInner: true }));
    const d = cc.getTangentAt(1), Lm = .27 * k; const sm = o.finitura === 'titanio' ? new THREE.MeshPhysicalMaterial({ name: 'Silenziatore titanio', color: 0x666a71, metalness: 1, roughness: .36, anisotropy: .6 }) : pipeMaterial(o.finitura); G.add(body(E2, d, [[rH * 1.15, 0], [rH * 1.5, .04 * k], [rS, Lm * .7], [rS * 1.18, Lm - .012 * k], [rS * 1.12, Lm]], sm));
    const cap = mesh(new THREE.CircleGeometry(rS * 1.1, 48), darkMat('Interno scarico')); cap.quaternion.setFromUnitVectors(V3(0, 0, 1), d.clone().negate()); cap.position.copy(E2).addScaledVector(d, Lm - .004 * k); G.add(cap);
    const cf = metal('satin', 'Carbonio'); cf.color.set(0x111112); G.add(ring(E2.clone().addScaledVector(d, Lm - .006 * k), d, rS * 1.0, rS * 1.2, 10 * MM * k, cf));
    const br = new THREE.Mesh(new THREE.BoxGeometry(.012 * k, .07 * k, .02 * k), clampM); br.position.copy(E2).addScaledVector(d, Lm * .5).add(V3(0, rS + .02 * k, -s * .015 * k)); G.add(br);
  } else if (t === '2in2') { // Big Radius 2 in 2: curve ampie e silenziatori 3"
    const rM = 76 * MM * k / 2, yF = ylow + .005 * k, yR = yF + 2.3 * rM, xE = xA - Rw * .2;
    const cf = addPipe([...fDown(yF, R.x - .25 * k).slice(0, -1), V3(R.x - .32 * k, yF, zr)], 'dritto', { noWrap: false });
    const cr = addPipe([...rDown(yR, R.x - .32 * k).slice(0, -1), V3(R.x - .36 * k, yR, zr + s * .01 * k)], 'dritto');
    for (const [c, y, xs] of [[cf, yF, R.x - .32 * k], [cr, yR, R.x - .36 * k]]) { const p0 = c.getPointAt(1), dir = V3(-1, .03, 0).normalize(), L = p0.x - xE;
      G.add(body(p0, dir, [[rH * 1.02, 0], [rM, .05 * k], [rM, L - .03 * k], [rM * .9, L - .005 * k], [rM * .62, L]], pm));
      const cap = mesh(new THREE.CircleGeometry(rM * .62, 48), darkMat('Interno scarico')); cap.quaternion.setFromUnitVectors(V3(0, 0, 1), dir.clone().negate()); cap.position.copy(p0).addScaledVector(dir, L - .002 * k); G.add(cap); }
  }
  if (t === 'incrociati') { // collettori corti incrociati stile Thunderbike: i tubi si incrociano sotto il motore e finiscono sovrapposti sotto la sella, terminali obliqui
    const yA1 = ylow + .012 * k, yB1 = yA1 + 2.3 * rH, xE = R.x - .38 * k;
    const cf = addPipe([...fDown(yA1, R.x + .02 * k).slice(0, -1), V3(R.x - .12 * k, yA1 + .02 * k, zr + s * .004 * k), V3(xE, yB1 + .035 * k, zr + s * .006 * k)], 'slash', { heatScale: 1.3 });
    const cr = addPipe([...rDown(yB1, R.x - .08 * k).slice(0, 3), V3(R.x - .1 * k, yB1 + .01 * k, zr + s * .012 * k), V3(xE + .03 * k, yA1 + .015 * k, zr + s * .014 * k)], 'slash', { heatScale: 1.3 });
    clampAt(cf, .82); clampAt(cr, .8);
    const br = new THREE.Mesh(new THREE.BoxGeometry(.03 * k, .07 * k, .004 * k), clampM); br.position.set(xE + .09 * k, (yA1 + yB1) / 2 + .02 * k, zr - s * rH * .8); br.castShadow = true; G.add(br);
  } else if (t === 'spaghetti') { // ricalcato dalle foto 1, 41, 43: collettori a spicchi saldati (pie-cut) in titanio, si incrociano e finiscono affiancati verso terra davanti alle pedane
    const seg = .042 * k, weldM = new THREE.MeshPhysicalMaterial({ name: 'Saldature', color: 0x8a7a68, metalness: 1, roughness: .45 });
    const pieCut = (pts, tipDir) => { const c0 = curveOf(pts), L = c0.getLength(), n = Math.max(4, Math.round(L / seg)), P = []; for (let i = 0; i <= n; i++) P.push(c0.getPointAt(i / n));
      const path = new THREE.CurvePath(); for (let i = 0; i < n; i++) path.add(new THREE.LineCurve3(P[i], P[i + 1]));
      G.add(tube(path, rH, o.finitura === 'titanio' ? new THREE.MeshPhysicalMaterial({ name: 'Titanio spazzolato', color: 0x9c968c, metalness: 1, roughness: .32, anisotropy: .7, iridescence: .35, iridescenceIOR: 1.8 }) : pm, { tip: 'dritto' }));
      const tint = [weldM, new THREE.MeshPhysicalMaterial({ name: 'Saldatura oro', color: 0xb8904c, metalness: 1, roughness: .35 }), new THREE.MeshPhysicalMaterial({ name: 'Saldatura blu', color: 0x4d5c9c, metalness: 1, roughness: .35, iridescence: .6 })];
      for (let i = 1; i < n; i++) { const d = P[i + 1].clone().sub(P[i - 1]).normalize(); G.add(ring(P[i], d, rH * .995, rH * 1.04, 3.2 * MM * k, tint[i % 3])); }
      G.add(ring(P[n].clone().addScaledVector(tipDir, -.006 * k), tipDir, rH * .92, rH * 1.06, 6 * MM * k, metal('brushed', 'Bordo terminale'))); return path; };
    const yT = Math.max(ylow - .03 * k, .1 * k), xF = R.x + .02 * k, xR = xF - 2.35 * rH, down = V3(0, -1, 0);
    // anteriore: esce dalla luce, va indietro sotto i cilindri, scende in verticale
    pieCut([F, f1, V3(F.x - .02 * k, F.y - .1 * k, zr - s * .015 * k), V3(F.x - .12 * k, F.y - .17 * k, zr), V3(xF + .07 * k, F.y - .17 * k, zr + s * .005 * k), V3(xF, F.y - .22 * k, zr + s * .008 * k), V3(xF, yT + .08 * k, zr + s * .008 * k), V3(xF, yT, zr + s * .008 * k)], down);
    // posteriore: scende, passa sopra l'anteriore incrociandolo e si affianca dietro
    pieCut([R, r1, V3(R.x + .03 * k, R.y - .09 * k, zr + s * .03 * k), V3(R.x + .07 * k, F.y - .15 * k, zr + s * .045 * k), V3(xR + .03 * k, F.y - .2 * k, zr + s * .02 * k), V3(xR, F.y - .26 * k, zr + s * .006 * k), V3(xR, yT + .08 * k, zr + s * .004 * k), V3(xR, yT, zr + s * .004 * k)], down);
    const br = new THREE.Mesh(new THREE.BoxGeometry(xF - xR + rH * 2, .012 * k, .004 * k), clampM); br.position.set((xF + xR) / 2, yT + .07 * k, zr - s * rH * .9); G.add(br);
  } else if (t === 'slipon') { // slip-on neri corti sovrapposti stile drag, tagli obliqui
    const rM = 70 * MM * k / 2, yF = ylow + .008 * k, yR = yF + 2.15 * rM, xS = R.x - .3 * k, Ls = .3 * k, sm = pipeMaterial(o.finitura === 'brushed' ? 'brushed' : 'nero');
    const cf = addPipe([...fDown(yF, xS + .02 * k).slice(0, -1), V3(xS, yF, zr)], 'dritto'), cr = addPipe([...rDown(yR, xS + .02 * k).slice(0, -1), V3(xS, yR, zr + s * .01 * k)], 'dritto');
    for (const [c, y] of [[cf, yF], [cr, yR]]) { const p0 = c.getPointAt(1), dir = V3(-1, .06, 0).normalize();
      G.add(body(p0, dir, [[rH * 1.02, 0], [rM, .04 * k], [rM, Ls - .02 * k], [rM * .97, Ls]], sm));
      const cap = mesh(new THREE.CircleGeometry(rM * .95, 48), darkMat('Interno scarico')); cap.quaternion.setFromUnitVectors(V3(0, 0, 1), V3(-1, .35, 0).normalize().negate()); cap.position.copy(p0).addScaledVector(dir, Ls - .004 * k); G.add(cap);
      G.add(ring(p0.clone().addScaledVector(dir, .05 * k), dir, rM * 1.0, rM * 1.06, 10 * MM * k, clampM)); }
  }
  G.userData.portExhaust = true; return G;
}
