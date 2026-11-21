/* NJ.D' RIDE – riconoscimento dei pezzi di serie sul modello 3D (indice delle isole geometriche, calcolato una volta per moto).
   © 2026 dott. Jonathan D'Eugenio – Tutti i diritti riservati (L. 633/1941). */
import * as THREE from 'three';

/* isole: componenti connesse di triangoli dentro una mesh (pezzi fisicamente separati) */
export function islands(mesh) {
  if (mesh.userData.isl) return mesh.userData.isl; let g = mesh.geometry;
  if (mesh.userData.zone) { if (g.index) { g = g.toNonIndexed(); mesh.geometry.dispose(); mesh.geometry = g; } return mesh.userData.isl = new Int32Array(g.attributes.position.count / 3); }
  if (g.index) { g = g.toNonIndexed(); mesh.geometry.dispose(); mesh.geometry = g; }
  const p = g.attributes.position.array, nT = p.length / 9, par = new Int32Array(nT); for (let i = 0; i < nT; i++) par[i] = i;
  const f = i => { while (par[i] !== i) { par[i] = par[par[i]]; i = par[i]; } return i; }, map = new Map();
  for (let v = 0; v < p.length / 3; v++) { const k = (Math.round(p[v * 3] * 4000) * 73856093) ^ (Math.round(p[v * 3 + 1] * 4000) * 19349663) ^ (Math.round(p[v * 3 + 2] * 4000) * 83492791), t = (v / 3) | 0, o = map.get(k);
    if (o === undefined) map.set(k, t); else { const a = f(o), b = f(t); if (a !== b) par[a] = b; } }
  const r = new Int32Array(nT); for (let i = 0; i < nT; i++) r[i] = f(i); return mesh.userData.isl = r;
}
function matInfo(m) { const c = m.color || new THREE.Color(1, 1, 1), hsl = {}; c.getHSL(hsl);
  return { name: m.name || '', met: m.metalness ?? 0, rough: m.roughness ?? .5, lum: hsl.l, hue: hsl.h * 360, sat: hsl.s, transp: !!m.transparent && (m.opacity ?? 1) < .95 }; }
function meshIslands(mesh, out) {
  if (Array.isArray(mesh.material) || !mesh.geometry.attributes.position) return;
  if (mesh.userData.zone) { islands(mesh); if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox(); const box = mesh.geometry.boundingBox.clone().applyMatrix4(mesh.matrixWorld);
    out.push({ mesh, id: 0, box, n: mesh.geometry.attributes.position.count / 3, c: box.getCenter(new THREE.Vector3()), s: box.getSize(new THREE.Vector3()), mat: matInfo(mesh.material) }); return; }
  const isl = islands(mesh), p = mesh.geometry.attributes.position, M = new Map(), v = new THREE.Vector3(), mw = mesh.matrixWorld;
  for (let t = 0; t < isl.length; t++) { const id = isl[t]; let b = M.get(id); if (!b) { b = { mesh, id, box: new THREE.Box3(), n: 0 }; M.set(id, b); } b.n++;
    for (let k = 0; k < 3; k++) { v.fromBufferAttribute(p, t * 3 + k).applyMatrix4(mw); b.box.expandByPoint(v); } }
  const mi = matInfo(mesh.material);
  for (const b of M.values()) { b.c = b.box.getCenter(new THREE.Vector3()); b.s = b.box.getSize(new THREE.Vector3()); b.mat = mi; out.push(b); }
}
/* indice delle isole: calcolato a pezzi per non bloccare l'interfaccia */
export function buildIndex(model, cb) {
  if (model.userData.__idx) { cb && cb(model.userData.__idx); return model.userData.__idx; }
  model.updateMatrixWorld(true); const meshes = []; model.traverse(o => { if (o.isMesh && !o.userData.acc && !o.userData.accPart && o.visible) meshes.push(o); });
  const out = []; let i = 0;
  const finish = () => { const idx = analyse(model, out); model.userData.__idx = idx; cb && cb(idx); return idx; };
  if (!cb) { meshes.forEach(m => meshIslands(m, out)); return finish(); }
  const step = () => { const t0 = performance.now(); while (i < meshes.length && performance.now() - t0 < 30) meshIslands(meshes[i++], out); if (i < meshes.length) setTimeout(step, 0); else finish(); };
  step(); return null;
}
const inside = (b, B, tol = .012) => b.min.x >= B.min.x - tol && b.max.x <= B.max.x + tol && b.min.y >= B.min.y - tol && b.max.y <= B.max.y + tol && b.min.z >= B.min.z - tol && b.max.z <= B.max.z + tol;
function analyse(model, isl) {
  const B = new THREE.Box3(); isl.forEach(I => B.union(I.box)); const S = B.getSize(new THREE.Vector3()), g = B.min.y, H = S.y, L = S.x;
  /* ruote: pneumatici = isole grandi, tonde, appoggiate a terra */
  const tires = isl.filter(I => I.box.min.y < g + .04 && I.s.y > .3 * H && I.s.y < .75 * H && Math.abs(I.s.x - I.s.y) < .3 * I.s.y && I.s.z < .4 && I.s.z > .05);
  let front = null, rear = null; for (const t of tires) { if (!front || t.c.x > front.c.x) front = t; if (!rear || t.c.x < rear.c.x) rear = t; }
  const wheel = t => { if (!t) return null; const R = Math.max(t.s.x, t.s.y) / 2, c = new THREE.Vector3(t.c.x, g + R, t.c.z), V = new THREE.Box3(new THREE.Vector3(c.x - R, g - .01, c.z - .22), new THREE.Vector3(c.x + R, g + 2 * R, c.z + .22));
    // solo ciò che sta tutto dentro il cerchio della ruota (gomma, cerchio, raggi, disco, mozzo): forcella, forcellone e parafango restano
    // pezzi della ruota: centrati sull'asse (gomma, cerchio, disco, mozzo, puleggia) oppure piccoli e tutti dentro il cerchio (raggi, bulloni)
    const corner = I => { let m = 0; for (const x of [I.box.min.x, I.box.max.x]) for (const y of [I.box.min.y, I.box.max.y]) m = Math.max(m, Math.hypot(x - c.x, y - c.y)); return m; };
    const inR = I => { const ext = Math.max(Math.abs(I.box.min.x - c.x), Math.abs(I.box.max.x - c.x), Math.abs(I.box.min.y - c.y), Math.abs(I.box.max.y - c.y)); if (ext > R * 1.04) return false;
      if (Math.abs(I.c.x - c.x) < .2 * R && Math.abs(I.c.y - c.y) < .2 * R) return true; return I.s.length() < .6 * R && corner(I) < R * .97 && Math.abs(I.c.z - c.z) < .12; };
    return { c, R, V, isl: isl.filter(I => inside(I.box, V, .005) && inR(I) && I.s.length() > .01) }; };
  const W = { front: front && rear && front !== rear ? wheel(front) : null, rear: front && rear && front !== rear ? wheel(rear) : null };
  for (const [k, z] of [['front', 'ruota_ant'], ['rear', 'ruota_post']]) { if (W[k]) continue; const zi = isl.filter(I => I.mesh.userData.zone === z); if (!zi.length) continue; const b = new THREE.Box3(); zi.forEach(I => b.union(I.box));
    const c = b.getCenter(new THREE.Vector3()), R = Math.max(b.max.x - b.min.x, b.max.y - b.min.y) / 2; W[k] = { c, R, V: b, isl: zi }; }
  // modelli in un pezzo unico (scansioni, IA): ruote trovate sui vertici — punti d'appoggio a terra e cerchio del pneumatico per votazione
  if ((!W.front || !W.rear) && !model.userData.__W) { const P = [], v = new THREE.Vector3(); model.traverse(o => { if (!o.isMesh || !o.visible) return; const p = o.geometry.attributes.position, st = Math.max(1, Math.floor(p.count / 60000)); o.updateWorldMatrix(true, false);
      for (let i = 0; i < p.count; i += st) { v.fromBufferAttribute(p, i).applyMatrix4(o.matrixWorld); P.push(v.x, v.y, v.z); } });
    // punto più basso nella parte anteriore e in quella posteriore (il cavalletto in mezzo non conta)
    const region = (x0, x1) => { let ym = Infinity; for (let i = 0; i < P.length; i += 3) if (P[i] > x0 && P[i] < x1 && P[i + 1] < ym) ym = P[i + 1]; let x = 0, z = 0, n = 0;
      for (let i = 0; i < P.length; i += 3) if (P[i] > x0 && P[i] < x1 && P[i + 1] < ym + .012) { x += P[i]; z += P[i + 2]; n++; } return n ? [x / n, ym, z / n] : null; };
    const fit = q => { if (!q) return null; const [cx, gy, cz] = q; let best = .3, bs = -1; for (let R = .24; R <= .4; R += .004) { const bins = new Uint8Array(48); let s = 0; const cy = gy + R; for (let i = 0; i < P.length; i += 3) { if (Math.abs(P[i + 2] - cz) > .07) continue; const dx = P[i] - cx, dy = P[i + 1] - cy, d = Math.hypot(dx, dy); if (Math.abs(d - R) < .007) { bins[Math.floor((Math.atan2(dy, dx) + Math.PI) / (2 * Math.PI) * 47.999)] = 1; s++; } } const sc = bins.reduce((a, b) => a + b, 0) * 1e6 + s; if (sc > bs) { bs = sc; best = R; } }
      const c = new THREE.Vector3(cx, gy + best, cz); return { c, R: best, V: new THREE.Box3(new THREE.Vector3(cx - best, gy - .01, cz - .22), new THREE.Vector3(cx + best, gy + 2 * best, cz + .22)), isl: [] }; };
    const r0 = fit(region(B.min.x, B.min.x + .35 * L)), f0 = fit(region(B.max.x - .35 * L, B.max.x));
    if (r0 && f0 && f0.c.x - r0.c.x > .45 * L) { W.rear = W.rear || r0; W.front = W.front || f0; } }
  // la geometria delle ruote resta quella della moto di serie anche quando gomme e cerchi sono nascosti o sostituiti
  if (model.userData.__W && (!W.front || !W.rear)) { W.front = W.front || { ...model.userData.__W.front, isl: [] }; W.rear = W.rear || { ...model.userData.__W.rear, isl: [] }; }
  else if (W.front && W.rear && !model.userData.__W) model.userData.__W = { front: { c: W.front.c.clone(), R: W.front.R, V: W.front.V.clone() }, rear: { c: W.rear.c.clone(), R: W.rear.R, V: W.rear.V.clone() } };
  return { model, isl, B, S, g, H, L, W };
}

/* ---------- pezzi di serie per postazione ---------- */
const metalLike = m => m.met > .55 || /chrome|cromo|silver|steel|metal|alu|nise|med__/i.test(m.name);
const glassLike = m => m.transp || /glass|vetro|lens|miror|mirror/i.test(m.name);
export function detect(idx, slot, extra = {}) {
  const { isl, B, H, g, W } = idx; const fx = W.front ? W.front.c.x : B.max.x - .35, rx = W.rear ? W.rear.c.x : B.min.x + .35, mid = (fx + rx) / 2, wb = fx - rx;
  const byName = re => isl.filter(I => re.test(I.mat.name));
  const zoned = z => isl.filter(I => z.includes(I.mesh.userData.zone)); const ZS = { ruote: ['ruota_ant', 'ruota_post'], sella: ['sella'], scarico: ['scarico'] };
  if (ZS[slot]) { const zz = zoned(ZS[slot]); if (zz.length) return zz; }
  switch (slot) {
    case 'faro': case 'frecce': case 'specchietti': if (idx.model.userData.scan) return []; break;
  }
  switch (slot) {
    case 'ruote': return W.front && W.rear ? [...W.front.isl, ...W.rear.isl] : [];
    case 'sella': {
      // pelle: opaca, non metallica, sopra metà altezza, tra ruota posteriore e serbatoio
      let c = byName(/seat|sella|saddle|leather|pelle/i);
      if (!c.length) c = seatByRay(idx, rx, mid);
      if (!c.length) { // la superficie simmetrica più alta dietro al serbatoio
        const k = isl.filter(I => !glassLike(I.mat) && !/chrome|cromo|silver|nise|med__/i.test(I.mat.name) && Math.abs(I.c.z) < .05 && I.c.x > rx + .2 && I.c.x < mid - .15 && I.box.max.y > g + .5 * H && I.box.max.y < g + .82 * H && I.s.x > .25 && I.s.x < .65 && I.s.z > .18 && I.s.z < .42 && I.s.y < .25);
        if (k.length) { const top = k.reduce((a, b) => b.box.max.y > a.box.max.y ? b : a); c = [top];
          // cuscino e imbottitura sopra la base, nello stesso ingombro
          c.push(...isl.filter(I => I !== top && !glassLike(I.mat) && !/chrome|cromo|silver|nise|med__/i.test(I.mat.name) && Math.abs(I.c.z) < .06 && I.box.min.x > top.box.min.x - .06 && I.box.max.x < top.box.max.x + .06 && I.box.min.y > top.box.min.y - .02 && I.box.max.y < top.box.max.y + .18 && I.s.z > .12 && I.s.x > .15 && I.s.x < .7)); } }
      if (!c.length) return [];
      // tieni l'isola principale e quelle che le stanno sopra o attaccate (cuscino passeggero)
      const main = c.reduce((a, b) => (b.s.x * b.s.z > a.s.x * a.s.z ? b : a)); const zone = main.box.clone().expandByScalar(.05);
      return c.filter(I => zone.intersectsBox(I.box) && I.s.length() < 1.1);
    }
    case 'scarico': {
      let c = byName(/muffler|exhaust|scarico|silenc|pipe(?!line)/i);
      const inWheel = new Set([...(W.front ? W.front.isl : []), ...(W.rear ? W.rear.isl : [])]);
      const base = I => !glassLike(I.mat) && !inWheel.has(I) && I.c.y < g + .3 * H && I.box.max.y < g + .45 * H && I.c.y > g + .05 && Math.abs(I.c.z) > .12 && I.s.x > .25 && I.s.x < .95 && I.s.y < .2 && I.s.z < .2 && I.box.min.x < mid;
      if (!c.length) c = isl.filter(I => base(I) && metalLike(I.mat));
      if (!c.length) c = isl.filter(I => base(I) && I.mat.lum < .2);
      if (!c.length && new Set(isl.map(I => I.mat.name)).size < 3) c = isl.filter(I => base(I) || (!inWheel.has(I) && I.c.y < g + .3 * H && I.c.y > g + .05 && Math.abs(I.c.z) > .12 && I.s.x > .9 && I.s.x < 1.3 && I.s.y < .35 && I.s.z < .2));
      if (!c.length) return [];
      // silenziatori = pezzi lunghi; se hanno il gemello speculare l'impianto è doppio (due lati)
      const seeds = c.filter(I => I.s.x >= .3), S0 = seeds.length ? seeds : c;
      const twin = I => isl.some(J => J !== I && J.n === I.n && Math.abs(J.c.z + I.c.z) < .02 && Math.abs(J.c.x - I.c.x) < .02 && Math.abs(J.c.y - I.c.y) < .02);
      let out; if (S0.some(twin)) out = S0.filter(I => twin(I) || Math.abs(I.c.z) < .06);
      else { const side = Math.sign(S0.reduce((a, I) => a + I.c.z * I.n, 0)) || 1; out = S0.filter(I => Math.sign(I.c.z) === side || Math.abs(I.c.z) < .06); }
      // terminali, fascette e protezioni dello stesso materiale attaccati ai silenziatori
      const mats = new Set(out.map(I => I.mat.name)), boxes = out.map(I => I.box.clone().expandByScalar(.015));
      const add = isl.filter(I => !out.includes(I) && mats.has(I.mat.name) && !inWheel.has(I) && boxes.some(b => inside(I.box, b, .03)) && I.s.length() < .5 && I.s.y < .15 && I.box.max.y < g + .38 * H && Math.abs(I.c.z) > .08);
      return out.concat(add);
    }
    case 'specchietti': {
      const glass = byName(/miror|mirror|specch/i); if (!glass.length) return [];
      const out = [...glass]; for (const gI of glass) for (const I of isl) if (!out.includes(I) && I.s.length() < .35 && I.box.distanceToPoint(gI.c) < .16 && I.c.y > gI.c.y - .28 && I.c.y < gI.c.y + .05 && Math.abs(I.c.z) > .12) out.push(I);
      return out;
    }
    case 'faro': {
      // gruppo ottico anteriore: isole tonde davanti al cannotto, a metà altezza alta, centrate
      const c = isl.filter(I => I.c.x > fx - .38 && I.c.x < fx + .05 && Math.abs(I.c.z) < .06 && I.c.y > g + .45 * H && I.c.y < g + .8 * H && I.s.z > .1 && I.s.z < .3 && I.s.y > .1 && I.s.y < .3 && Math.abs(I.s.y - I.s.z) < .06 && I.s.x < .25 && !(I.mat.transp && I.s.x > .1));
      if (!c.length) return [];
      const lamp = c.reduce((a, b) => (b.c.x > a.c.x ? b : a)), zone = new THREE.Box3().setFromCenterAndSize(lamp.c, new THREE.Vector3(.3, Math.max(lamp.s.y, lamp.s.z) + .04, Math.max(lamp.s.y, lamp.s.z) + .04));
      return isl.filter(I => inside(I.box, zone, .01));
    }
    case 'frecce': return isl.filter(I => I.s.length() < .14 && I.mat.sat > .45 && I.mat.hue > 18 && I.mat.hue < 50 && I.mat.lum > .25);
    default: return [];
  }
}
export { inside };

/* sella vista dall'alto: raggi verticali tra ruota posteriore e serbatoio; se l'isola colpita è troppo grande (sella fusa con fianchetti o parafango) si ritaglia solo la parte superiore */
function seatByRay(idx, rx, mid) {
  const { model, isl, g, H } = idx, rc = new THREE.Raycaster(), hits = []; const meshes = []; model.traverse(o => { if (o.isMesh && o.visible && !o.userData.acc && !o.userData.accPart) meshes.push(o); });
  for (let x = rx + .25; x <= mid - .12; x += .06) { rc.set(new THREE.Vector3(x, g + 3 * H, 0), new THREE.Vector3(0, -1, 0)); const h = rc.intersectObjects(meshes, false)[0]; if (!h || Array.isArray(h.object.material)) continue;
    if (h.point.y < g + .45 * H || h.point.y > g + .85 * H || glassLike(matInfo(h.object.material))) continue; const id = islands(h.object)[h.faceIndex], I = isl.find(J => J.mesh === h.object && J.id === id); if (!I || I.c.x > mid || I.mesh.userData.zone) continue; hits.push({ x, y: h.point.y, I }); }
  if (hits.length < 2) return []; const cnt = new Map(); hits.forEach(h => cnt.set(h.I, (cnt.get(h.I) || 0) + 1)); const main = [...cnt.entries()].sort((a, b) => b[1] - a[1])[0][0];
  if (main.s.x < .75 && main.s.y < .3 && main.s.z < .45) return [main];
  // ritaglio: triangoli dell'isola sopra la base della sella
  const hs = hits.filter(h => h.I === main), y0 = Math.min(...hs.map(h => h.y)) - .1, x0 = Math.min(...hs.map(h => h.x)) - .14, x1 = Math.max(...hs.map(h => h.x)) + .14;
  const m = main.mesh, a = islands(m), p = m.geometry.attributes.position, v = new THREE.Vector3(); let nid = 0; for (let t = 0; t < a.length; t++) nid = Math.max(nid, a[t]); nid++; let n = 0; const box = new THREE.Box3();
  for (let t = 0; t < a.length; t++) { if (a[t] !== main.id) continue; let cx = 0, cy = 0, cz = 0; for (let k = 0; k < 3; k++) { v.fromBufferAttribute(p, t * 3 + k).applyMatrix4(m.matrixWorld); cx += v.x; cy += v.y; cz += v.z; } cx /= 3; cy /= 3; cz /= 3;
    if (cy > y0 && cx > x0 && cx < x1 && Math.abs(cz) < .25) { a[t] = nid; n++; box.expandByPoint(new THREE.Vector3(cx, cy, cz)); } }
  if (n < 20) return []; idx.model.userData.__idx = null; return [{ mesh: m, id: nid, box, n, c: box.getCenter(new THREE.Vector3()), s: box.getSize(new THREE.Vector3()), mat: main.mat }];
}

/* ---------- moto da scansione 3D (guscio unico, spezzato in blocchi con lo stesso materiale): la geometria si divide per zone ---------- */
function texLum(mat) { const img = mat.map && mat.map.image; if (!img) return null;
  try { const W = Math.min(1024, img.width), H = Math.min(1024, img.height), cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c2 = cv.getContext('2d'); c2.drawImage(img, 0, 0, W, H); const d = c2.getImageData(0, 0, W, H).data, flip = mat.map.flipY;
    return (u, v) => { u = u - Math.floor(u); v = v - Math.floor(v); const x = Math.min(W - 1, (u * W) | 0), y = Math.min(H - 1, ((flip ? 1 - v : v) * H) | 0), k = (y * W + x) * 4; return (Math.max(d[k], d[k + 1], d[k + 2]) + Math.min(d[k], d[k + 1], d[k + 2])) / 510; }; } catch (e) { return null; } }
export function presplitScan(model) {
  model.updateMatrixWorld(true); const meshes = []; model.traverse(o => { if (o.isMesh && !o.userData.acc && !o.userData.accPart && !Array.isArray(o.material) && o.geometry.attributes.position) meshes.push(o); });
  const nTof = m => m.geometry.index ? m.geometry.index.count / 3 : m.geometry.attributes.position.count / 3; let tot = 0; const byMat = new Map();
  meshes.forEach(m => { const n = nTof(m); tot += n; if (!byMat.has(m.material)) byMat.set(m.material, { ms: [], n: 0 }); const e = byMat.get(m.material); e.ms.push(m); e.n += n; });
  const grp = [...byMat.values()].sort((a, b) => b.n - a.n)[0]; if (!grp || tot < 200000 || grp.n < .6 * tot) return [];
  const mat = grp.ms[0].material, lum = texLum(mat), B = new THREE.Box3().setFromObject(model), S = B.getSize(new THREE.Vector3()), g = B.min.y, H = S.y, zc = (B.min.z + B.max.z) / 2, v = new THREE.Vector3();
  // geometrie in coordinate mondo (Float32, senza indici) e centri dei triangoli
  const parts = grp.ms.map(m => { let gg = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry; const n = gg.attributes.position.count / 3, P = new Float32Array(n * 9), N = gg.attributes.normal ? new Float32Array(n * 9) : null, U = gg.attributes.uv ? new Float32Array(n * 6) : null;
    const nm = new THREE.Matrix3().getNormalMatrix(m.matrixWorld), pa = gg.attributes.position, na = gg.attributes.normal, ua = gg.attributes.uv;
    for (let i = 0; i < n * 3; i++) { v.fromBufferAttribute(pa, i).applyMatrix4(m.matrixWorld); P[i * 3] = v.x; P[i * 3 + 1] = v.y; P[i * 3 + 2] = v.z; if (N) { v.fromBufferAttribute(na, i).applyMatrix3(nm).normalize(); N[i * 3] = v.x; N[i * 3 + 1] = v.y; N[i * 3 + 2] = v.z; } if (U) { U[i * 2] = ua.getX(i); U[i * 2 + 1] = ua.getY(i); } }
    return { m, n, P, N, U }; });
  // profilo inferiore nel piano centrale: punto più basso di ogni ruota e raggio dalla curvatura del battistrada
  const step = .02, prof = new Map();
  for (const q of parts) for (let t = 0; t < q.n; t++) { const o = t * 9, z = (q.P[o + 2] + q.P[o + 5] + q.P[o + 8]) / 3; if (Math.abs(z - zc) > .07) continue; const x = (q.P[o] + q.P[o + 3] + q.P[o + 6]) / 3, y = (q.P[o + 1] + q.P[o + 4] + q.P[o + 7]) / 3, k = Math.round(x / step); if (!prof.has(k) || y < prof.get(k)) prof.set(k, y); }
  const ks = [...prof.keys()].sort((a, b) => a - b), cx = (B.min.x + B.max.x) / 2;
  const wheelAt = side => { const c = ks.filter(k => side > 0 ? k * step > cx + .45 : k * step < cx - .45); if (!c.length) return null; let kb = c[0]; for (const k of c) if (prof.get(k) < prof.get(kb)) kb = k; const yb = prof.get(kb), Rs = [];
    for (const k of ks) { const d = Math.abs(k - kb) * step; if (d < .12 || d > .3) continue; const h = prof.get(k) - yb; if (h > .005) Rs.push((d * d + h * h) / (2 * h)); }
    if (Rs.length < 4) return null; Rs.sort((a, b) => a - b); const R = Math.min(.45, Math.max(.22, Rs[Rs.length >> 1])); return { c: new THREE.Vector3(kb * step, yb + R, zc), R }; };
  const Wf = wheelAt(1), Wr = wheelAt(-1); const fx = Wf ? Wf.c.x : B.max.x - .35, rx = Wr ? Wr.c.x : B.min.x + .35, mid = (fx + rx) / 2;
  const Z = ['telaio', 'ruota_ant', 'ruota_post', 'sella', 'scarico', 'parafango_ant', 'serbatoio', 'cupolino', 'motore'];
  const NAMES = ['Telaio e altri pezzi', 'Ruota anteriore', 'Ruota posteriore', 'Sella', 'Scarico', 'Parafango anteriore', 'Serbatoio', 'Cupolino, faro e manubrio', 'Motore'];
  const zoneOf = (x, y, z, l) => { z -= zc; const dark = l < 0 || l < .28;
    for (const [W, id] of [[Wf, 1], [Wr, 2]]) if (W && Math.hypot(x - W.c.x, y - W.c.y) < W.R * .99 && Math.abs(z) < .085) return id;
    if (Wf) { const d = Math.hypot(x - Wf.c.x, y - Wf.c.y); if (d >= Wf.R * .99 && d < Wf.R * 1.3 && y > Wf.c.y - .05 && Math.abs(z) < .12) return 5; }
    if (y > g + .61 * H && x > rx - .05 && x < mid && Math.abs(z) < .2 && dark) return 3;
    if (x > rx + .02 && x < fx - .3 && y > g + .06 * H && y < g + .36 * H && Math.abs(z) > .13 && dark) return 4;
    if (y > g + .62 * H && x >= fx - .45) return 7;
    if (y > g + .58 * H && x >= mid - .05 && x < fx - .45 && Math.abs(z) < .25) return 6;
    if (y > g + .1 * H && y < g + .6 * H && x > rx + .35 && x < fx - .3) return 8; return 0; };
  const lists = Z.map(() => []); // [part, tri]
  for (const q of parts) for (let t = 0; t < q.n; t++) { const o = t * 9, x = (q.P[o] + q.P[o + 3] + q.P[o + 6]) / 3, y = (q.P[o + 1] + q.P[o + 4] + q.P[o + 7]) / 3, z = (q.P[o + 2] + q.P[o + 5] + q.P[o + 8]) / 3;
    const l = lum && q.U ? lum((q.U[t * 6] + q.U[t * 6 + 2] + q.U[t * 6 + 4]) / 3, (q.U[t * 6 + 1] + q.U[t * 6 + 3] + q.U[t * 6 + 5]) / 3) : -1; lists[zoneOf(x, y, z, l)].push(q, t); }
  // una mesh per zona (geometria in coordinate del modello), al posto dei blocchi della scansione
  const inv = new THREE.Matrix4().copy(model.matrixWorld).invert(), out = [];
  for (let z = 0; z < Z.length; z++) { const L = lists[z], n = L.length / 2; if (!n) continue; const P = new Float32Array(n * 9), N = parts[0].N ? new Float32Array(n * 9) : null, U = parts[0].U ? new Float32Array(n * 6) : null;
    for (let i = 0; i < n; i++) { const q = L[i * 2], t = L[i * 2 + 1]; P.set(q.P.subarray(t * 9, t * 9 + 9), i * 9); if (N && q.N) N.set(q.N.subarray(t * 9, t * 9 + 9), i * 9); if (U && q.U) U.set(q.U.subarray(t * 6, t * 6 + 6), i * 6); }
    const ng = new THREE.BufferGeometry(); ng.setAttribute('position', new THREE.BufferAttribute(P, 3)); if (N) ng.setAttribute('normal', new THREE.BufferAttribute(N, 3)); if (U) ng.setAttribute('uv', new THREE.BufferAttribute(U, 2)); ng.applyMatrix4(inv); if (!N) ng.computeVertexNormals(); ng.computeBoundingBox(); ng.computeBoundingSphere();
    const m = new THREE.Mesh(ng, mat); m.castShadow = m.receiveShadow = true; m.userData.zone = Z[z]; m.name = NAMES[z]; model.add(m); out.push(m); }
  for (const q of parts) { q.m.parent && q.m.parent.remove(q.m); q.m.geometry.dispose(); }
  model.userData.scan = { Wf, Wr }; model.userData.__idx = null; model.updateMatrixWorld(true); return out;
}
