/* NJ.D' RIDE – montaggio automatico dei ricambi reali al posto giusto e punti di aggancio (calamita) come nei programmi CAD.
   © 2026 dott. Jonathan D'Eugenio – Tutti i diritti riservati. */
import * as THREE from 'three';
import * as ST from './stock.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const AX = { x: V(1, 0, 0), y: V(0, 1, 0), z: V(0, 0, 1) };

/* Ricambi reali: verso nel sistema della moto (X avanti, Y su, Z lato destro) e posto in cui si montano.
   r = rotazioni [asse, gradi] applicate in ordine · m = specchiatura · ruota = asse del mozzo misurato sulla geometria
   posto = dove si monta (il pezzo di serie di quel posto si nasconde) · pos = ruota anteriore / posteriore */
export const RICAMBI = {
  forcella_springer: { r: [['y', 180]], posto: 'forcella' },
  forcella_custom: { r: [['y', 180]], posto: 'forcella' },
  ammortizzatore: { posto: 'ammortizzatore' },
  ammortizzatore_foto: { r: [['z', 90]], posto: 'ammortizzatore' },
  ammortizzatore_serbatoio: { posto: 'esposizione' },
  sella_corbin: { r: [['y', 180]], posto: 'sella' },
  sella_breakout: { r: [['y', 180]], posto: 'sella' },
  sella_codino_cafe: { posto: 'sella' },
  sella_biposto: { posto: 'sella' },
  sella_scout_biposto: { r: [['y', 180]], posto: 'sella' },
  serbatoio_breakout: { r: [['y', 180]], posto: 'serbatoio' },
  serbatoio_cafe: { posto: 'serbatoio' },
  serbatoio_scan: { r: [['y', 90]], posto: 'serbatoio' },
  serbatoio_cafe_classico: { posto: 'serbatoio' },
  serbatoio_olio: { posto: 'olio' },
  scarico_harley: { r: [['y', -26]], m: 'x', posto: 'scarico' },
  scarico_shotgun: { r: [['y', 180]], posto: 'scarico' },
  scarico_sc_project: { r: [['y', -90]], posto: 'silenziatore' },
  silenziatore_tondo: { posto: 'silenziatore' },
  scarico_completo: { r: [['y', -90]], posto: 'silenziatore' },
  ruota_ant_21: { ruota: 1, posto: 'ruota', pos: 'ant' },
  ruota_post_240: { ruota: 1, posto: 'ruota', pos: 'post' },
  ruota_lega: { ruota: 1, posto: 'ruota' },
  ruota_raggi: { ruota: 'z', esploso: 1, posto: 'ruota' },
  ruota_completa: { ruota: 1, posto: 'ruota' },
  cerchio_lega: { ruota: 1, posto: 'cerchio' },
  cerchio_semplice: { ruota: 1, posto: 'cerchio' },
  gomma_larga: { ruota: 1, posto: 'gomma', pos: 'post' },
  disco_freno: { ruota: 1, posto: 'disco', pos: 'ant' },
  ruote_coppia: { posto: 'esposizione' },
  gomme_tkc80: { posto: 'esposizione' },
  gomme_mt60: { posto: 'esposizione' },
  pinza_brembo: { posto: 'pinza' },
  pinza_moto: { posto: 'pinza' },
  faro_vintage: { r: [['y', 90]], posto: 'faro' },
  faro_breakout: { r: [['y', 180]], posto: 'faro' },
  faro_tondo: { r: [['y', 90]], posto: 'mascherina' },
  faro_vface: { posto: 'mascherina' },
  frecce_stop_breakout: { r: [['y', 180]], posto: 'frecce_post' },
  specchio_sx: { r: [['y', 180]], posto: 'specchietto' },
  specchio_dx: { r: [['y', 180]], posto: 'specchietto' },
  targa: { posto: 'targa' },
  pedane_avanzate: { r: [['y', 180]], posto: 'pedane' },
  parafango_ant: { r: [['y', 90]], posto: 'parafango_ant' },
  parafango_ant_cafe: { posto: 'parafango_ant' },
  parafanghi_set: { posto: 'parafanghi', coppia: 1 },
  carena_club: { posto: 'carena' },
  carena_batwing: { posto: 'carena', faro: 1 },
  spoiler_chin: { posto: 'spoiler' },
  semimanubri_cafe: { posto: 'manubrio', clipon: 1 },
  manubrio_completo: { r: [['y', 90]], posto: 'manubrio' },
  blocchetto_comandi: { r: [['y', -90]], posto: 'blocchetto' },
  paramotore_touring: { posto: 'paramotore' },
  motore_vtwin: { posto: 'motore' },
  motore_buell_1125: { posto: 'motore' },
  motore_moto: { posto: 'motore' },
};
export const NOMI_POSTO = { forcella: 'forcella', ammortizzatore: 'ammortizzatori', sella: 'sella', serbatoio: 'serbatoio', olio: 'serbatoio dell\'olio', scarico: 'scarico',
  silenziatore: 'silenziatore', ruota: 'ruota', cerchio: 'cerchio', gomma: 'pneumatico', disco: 'disco freno', pinza: 'pinza freno', faro: 'faro', mascherina: 'mascherina del faro',
  frecce_post: 'frecce posteriori', specchietto: 'specchietto', targa: 'portatarga', pedane: 'comandi avanzati', parafango_ant: 'parafango anteriore', parafango_post: 'parafango posteriore',
  parafanghi: 'parafanghi', carena: 'carena', spoiler: 'spoiler', manubrio: 'manubrio', blocchetto: 'blocchetto comandi', paramotore: 'paramotore', motore: 'motore', esposizione: 'esposizione' };
/* preposizione articolata giusta per ogni posto («al posto della forcella», «dello scarico», «degli ammortizzatori») */
export const DEL_POSTO = { forcella: 'della', ammortizzatore: 'degli', sella: 'della', serbatoio: 'del', olio: 'del', scarico: 'dello', silenziatore: 'del', ruota: 'della',
  cerchio: 'del', gomma: 'dello', disco: 'del', pinza: 'della', faro: 'del', mascherina: 'della', frecce_post: 'delle', specchietto: 'dello', targa: 'del', pedane: 'dei',
  parafango_ant: 'del', parafango_post: 'del', parafanghi: 'dei', carena: 'della', spoiler: 'dello', manubrio: 'del', blocchetto: 'del', paramotore: 'del', motore: 'del' };

/* ---------- autovettori di una matrice 3×3 simmetrica (Jacobi): colonne di V, valori in ordine crescente ---------- */
function autovettori(C) {
  const a = C.map(r => r.slice()), Vm = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  for (let sw = 0; sw < 60; sw++) { let off = Math.abs(a[0][1]) + Math.abs(a[0][2]) + Math.abs(a[1][2]); if (off < 1e-14) break;
    for (const [p, q] of [[0, 1], [0, 2], [1, 2]]) { if (Math.abs(a[p][q]) < 1e-18) continue; const th = (a[q][q] - a[p][p]) / (2 * a[p][q]), t = Math.sign(th || 1) / (Math.abs(th) + Math.sqrt(th * th + 1)), c = 1 / Math.sqrt(t * t + 1), s = t * c;
      for (let k = 0; k < 3; k++) { const akp = a[k][p], akq = a[k][q]; a[k][p] = c * akp - s * akq; a[k][q] = s * akp + c * akq; }
      for (let k = 0; k < 3; k++) { const apk = a[p][k], aqk = a[q][k]; a[p][k] = c * apk - s * aqk; a[q][k] = s * apk + c * aqk; }
      for (let k = 0; k < 3; k++) { const vkp = Vm[k][p], vkq = Vm[k][q]; Vm[k][p] = c * vkp - s * vkq; Vm[k][q] = s * vkp + c * vkq; } } }
  return [0, 1, 2].map(i => ({ val: a[i][i], vec: V(Vm[0][i], Vm[1][i], Vm[2][i]).normalize() })).sort((x, y) => x.val - y.val);
}
/* punti (mondo) di un oggetto, al massimo n */
function punti(obj, n = 24000) { obj.updateMatrixWorld(true); const out = [], v = V(); let tot = 0; obj.traverse(m => { if (m.isMesh && m.geometry && m.geometry.attributes.position) tot += m.geometry.attributes.position.count; });
  const st = Math.max(1, Math.floor(tot / n)); obj.traverse(m => { if (!m.isMesh || !m.geometry || !m.geometry.attributes.position) return; const p = m.geometry.attributes.position;
    for (let i = 0; i < p.count; i += st) { v.fromBufferAttribute(p, i).applyMatrix4(m.matrixWorld); out.push(v.x, v.y, v.z); } }); return out; }
function pca(P) { const n = P.length / 3; if (n < 4) return null; let cx = 0, cy = 0, cz = 0; for (let i = 0; i < P.length; i += 3) { cx += P[i]; cy += P[i + 1]; cz += P[i + 2]; } cx /= n; cy /= n; cz /= n;
  const C = [[0, 0, 0], [0, 0, 0], [0, 0, 0]]; for (let i = 0; i < P.length; i += 3) { const d = [P[i] - cx, P[i + 1] - cy, P[i + 2] - cz]; for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) C[a][b] += d[a] * d[b]; }
  for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) C[a][b] /= n; return { c: V(cx, cy, cz), e: autovettori(C) }; }
/* estensione dei punti lungo una direzione */
function estensione(P, c, d) { let lo = 1e9, hi = -1e9; for (let i = 0; i < P.length; i += 3) { const t = (P[i] - c.x) * d.x + (P[i + 1] - c.y) * d.y + (P[i + 2] - c.z) * d.z; if (t < lo) lo = t; if (t > hi) hi = t; } return [lo, hi]; }

/* ---------- 1. verso giusto: il ricambio entra nel sistema della moto, con l'origine al centro del suo ingombro ---------- */
export function orienta(id, sc) {
  const meta = RICAMBI[id] || {}, G = new THREE.Group(), I = new THREE.Group(); I.name = 'orientamento'; I.add(sc); G.add(I);
  if (meta.r) for (const [a, d] of meta.r) I.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(AX[a], d * Math.PI / 180));
  if (meta.m) I.scale[meta.m] *= -1;
  if (meta.esploso) { // modello «esploso» (pezzi distanziati lungo l'asse): si ricompatta sul cerchio
    I.updateMatrixWorld(true); let big = null, bn = -1; sc.traverse(m => { if (m.isMesh) { const n = m.geometry.attributes.position.count; if (n > bn) { bn = n; big = m; } } });
    if (big) { const zc = new THREE.Box3().setFromObject(big, true).getCenter(V()).z; sc.traverse(m => { if (!m.isMesh || m === big) return; const b = new THREE.Box3().setFromObject(m, true), d = zc - b.getCenter(V()).z;
      const inv = new THREE.Matrix4().copy(m.parent.matrixWorld).invert(), w = V(0, 0, d).applyMatrix4(new THREE.Matrix4().extractRotation(inv)); m.position.add(w); m.updateMatrixWorld(true); }); } }
  if (meta.ruota) { // asse del mozzo lungo Z (le ruote prese da moto inclinate o sterzate tornano dritte)
    I.updateMatrixWorld(true); let ax = meta.ruota === 'z' ? V(0, 0, 1) : null;
    if (!ax) { const R = pca(punti(I)); if (R) ax = R.e[0].vec.clone(); }
    if (ax) { if (ax.z < 0) ax.negate(); I.quaternion.premultiply(new THREE.Quaternion().setFromUnitVectors(ax, V(0, 0, 1))); } }
  I.updateMatrixWorld(true); const b = new THREE.Box3().setFromObject(I, true); if (!b.isEmpty()) { const c0 = b.getCenter(V()); G.userData.centro0 = c0.toArray(); I.position.sub(c0); }
  G.userData.orientato = id; return G;
}

/* ---------- 2. geometria della moto e pezzi di serie di ogni posto ---------- */
export function geoMoto(ctx) {
  const M = ctx.getModel(); if (!M) return null; M.updateMatrixWorld(true); const idx = ST.buildIndex(M); const { B, g, H, W } = idx;
  const fx = W.front ? W.front.c.x : B.max.x - .35, rx = W.rear ? W.rear.c.x : B.min.x + .35, wb = fx - rx, mid = (fx + rx) / 2;
  const catDi = new Map(); for (const p of ctx.getParts().values()) for (const [o] of p.meshes) catDi.set(o, p.cat);
  return { M, idx, B, g, H, W, fx, rx, wb, mid, catDi, R: W.front ? W.front.R : .32 };
}
const ruoloDi = I => (I.mesh.material && !Array.isArray(I.mesh.material) && I.mesh.material.userData && I.mesh.material.userData.ruolo) || '';
const VERN_CAT = 'Carrozzeria e verniciatura';
/* il blocco principale di un insieme di isole: la più grande e quelle che le stanno addosso */
function principale(c, marg = .03) { if (!c.length) return []; const big = c.reduce((a, b) => (b.s.x * b.s.y * b.s.z > a.s.x * a.s.y * a.s.z ? b : a)); const z = big.box.clone().expandByScalar(marg);
  let out = [big], add = true; while (add) { add = false; for (const I of c) if (!out.includes(I) && out.some(J => J.box.clone().expandByScalar(marg).intersectsBox(I.box))) { out.push(I); add = true; } } return out; }
/* minuteria dentro l'ingombro (tappi, fregi, bulloni): sparisce con il pezzo */
function conMinuteria(G, L, max = .12) { if (!L.length) return L; const bb = new THREE.Box3(); L.forEach(I => bb.union(I.box)); const z = bb.clone().expandByScalar(.01);
  const W = G.W, ruota = new Set([...(W.front ? W.front.isl : []), ...(W.rear ? W.rear.isl : [])]);
  // solo i pezzetti appoggiati sulla superficie del pezzo (tappi, fregi, viti): centro a meno di 2 cm da un suo punto
  const cell = .02, H = new Set(), P = puntiIsole(L, 9000), key = (x, y, z2) => Math.floor(x / cell) + ',' + Math.floor(y / cell) + ',' + Math.floor(z2 / cell);
  for (let i = 0; i < P.length; i += 3) H.add(key(P[i], P[i + 1], P[i + 2]));
  const vicino = c => { const i0 = Math.floor(c.x / cell), j0 = Math.floor(c.y / cell), k0 = Math.floor(c.z / cell); for (let i = i0 - 1; i <= i0 + 1; i++) for (let j = j0 - 1; j <= j0 + 1; j++) for (let k = k0 - 1; k <= k0 + 1; k++) if (H.has(i + ',' + j + ',' + k)) return true; return false; };
  return L.concat(G.idx.isl.filter(I => !L.includes(I) && !ruota.has(I) && I.mesh.visible && !I.mesh.userData.vuoto && I.s.length() < max && ST.inside(I.box, z, .004) && vicino(I.c))); }
export function isoleDi(posto, G, opz = {}) {
  const { idx, W, g, H, fx, rx, wb, mid, catDi } = G; const isl = idx.isl.filter(I => I.mesh.visible && !I.mesh.userData.vuoto && !I.mesh.userData.acc && !I.mesh.userData.accPart);
  const inRuota = new Set([...(W.front ? W.front.isl : []), ...(W.rear ? W.rear.isl : [])]), cat = I => catDi.get(I.mesh) || '';
  const ruoli = (...r) => isl.filter(I => r.includes(ruoloDi(I)));
  switch (posto) {
    case 'serbatoio': { let c = ruoli('serbatoio'); if (!c.length) c = isl.filter(I => !inRuota.has(I) && cat(I) === VERN_CAT && I.c.x > rx + .36 * wb && I.c.x < fx - .08 * wb && I.c.y > g + .5 * H && Math.abs(I.c.z) < .16 && I.s.x > .1 && I.s.x < .8);
      return conMinuteria(G, principale(c)); }
    case 'sella': { let c = ruoli('sella'); if (!c.length) c = ST.detect(idx, 'sella'); return principale(c.filter(I => I.mesh.visible)); }
    case 'parafango_ant': case 'parafango_post': { const w = posto === 'parafango_ant' ? W.front : W.rear; let c = ruoli(posto);
      if (!c.length && w) c = isl.filter(I => !inRuota.has(I) && (cat(I) === VERN_CAT || cat(I) === 'Cromature') && Math.abs(I.c.x - w.c.x) < 1.3 * w.R && I.box.max.y > w.c.y + .6 * w.R && I.c.y > w.c.y - .1 * w.R && Math.abs(I.c.z - w.c.z) < .14 && I.s.x > .3 * w.R && I.s.x < 2.6 * w.R && I.s.z < .45);
      return principale(c); }
    case 'faro': case 'mascherina': { let c = ST.detect(idx, 'faro'); if (!c.length) c = ruoli('faro', 'vetro').filter(I => I.c.x > mid && I.c.y > g + .45 * H); return c.filter(I => I.mesh.visible); }
    case 'carena': { const c = ruoli('carena').filter(I => I.c.x > mid + .15 * wb && I.c.y > g + .45 * H); return principale(c); }
    case 'forcella': { let c = ruoli('forcella', 'piastre'); if (!c.length) c = isl.filter(I => cat(I) === 'Forcella e sterzo' && !/grip|manopol|handlebar|manubri/i.test(I.mesh.material.name || ''));
      c = c.filter(I => !inRuota.has(I) && I.c.x > mid + .12 * wb && I.c.x < fx + .25 && I.c.y < g + .85 * H && I.s.z < .42);
      if (!c.length && W.front) { // steli riconosciuti dalla forma: lunghi, dal perno della ruota in su, a lato della ruota (e il loro gemello)
        const a = W.front.c; c = isl.filter(I => !inRuota.has(I) && I.box.min.y < a.y + .16 && I.box.max.y > a.y + .3 && I.c.x > a.x - .45 && I.c.x < a.x + .18 && I.s.x < .36 && I.s.z < .14 && Math.abs(I.c.z - a.z) > .03 && Math.abs(I.c.z - a.z) < .2);
        c = c.filter(I => c.some(J => J !== I && (Math.abs(J.c.z + I.c.z) < .05 || Math.abs(J.c.z + I.c.z - 2 * a.z) < .05) && Math.abs(J.c.y - I.c.y) < .06));
        // steli superiori (tubi) sopra i foderi, sullo stesso lato
        c = c.concat(isl.filter(J => !c.includes(J) && !inRuota.has(J) && J.s.z < .09 && c.some(I => Math.abs(J.c.z - I.c.z) < .02 && J.box.min.y > I.box.min.y + .1 && J.box.min.y < I.box.max.y + .06 && J.c.x < I.c.x + .05 && J.s.length() > .1))); }
      return c; }
    case 'motore': { let c = ruoli('cilindri', 'basamento', 'coperchi', 'filtro'); if (!c.length) c = isl.filter(I => cat(I) === 'Motore');
      return c.filter(I => !inRuota.has(I) && I.c.x > rx + .22 * wb && I.c.x < fx - .12 * wb && I.c.y < g + .7 * H); }
    case 'ammortizzatore': { let c = ruoli('ammortizzatori'); if (!c.length) c = isl.filter(I => cat(I) === 'Sospensioni');
      c = c.filter(I => !inRuota.has(I) && I.c.x < mid + .1 * wb && I.s.length() > .05);
      const gem = isl.filter(J => !c.includes(J) && !inRuota.has(J) && c.some(I => Math.abs(J.c.z + I.c.z) < .03 && Math.abs(J.c.x - I.c.x) < .03 && Math.abs(J.c.y - I.c.y) < .03 && Math.abs(J.s.length() - I.s.length()) < .03 && Math.abs(I.c.z) > .03));
      return c.concat(gem); }
    case 'scarico': { let c = ruoli('scarico'); if (!c.length) c = ST.detect(idx, 'scarico'); return c.filter(I => I.mesh.visible); }
    case 'silenziatore': { const all = isoleDi('scarico', G); if (!all.length) return []; const lunghi = all.filter(I => I.s.x > .22 && I.c.x < mid + .1 * wb);
      if (!lunghi.length) return []; const side = Math.sign(lunghi.reduce((a, I) => a + I.c.z * I.n, 0)) || 1, ms = lunghi.filter(I => Math.sign(I.c.z) === side);
      const post = ms.reduce((a, b) => (b.box.min.x < a.box.min.x ? b : a)); return principale(all.filter(I => Math.sign(I.c.z) === side && I.box.min.x < post.box.max.x - .02 && I.c.x < post.box.max.x), .02); }
    default: return [];
  }
}
const boxDi = L => { const b = new THREE.Box3(); L.forEach(I => b.union(I.box)); return b; };
function puntiIsole(L, n = 6000) { const out = [], v = V(); let tot = 0; L.forEach(I => tot += I.n || 0); const st = Math.max(1, Math.floor(tot / n));
  for (const I of L) { const m = I.mesh, p = m.geometry.attributes.position, isl = ST.islands(m); m.updateMatrixWorld(true);
    for (let t = 0; t < isl.length; t += st) if (isl[t] === I.id) { v.fromBufferAttribute(p, t * 3).applyMatrix4(m.matrixWorld); out.push(v.x, v.y, v.z); } } return out; }

/* ---------- 3. adattamento: verso, misura e posizione presi dal pezzo di serie che si sostituisce ---------- */
// restituisce { mat: Matrix4 da applicare al gruppo orientato, nascondi: [isole], nota, lato } oppure null
export function adatta(id, G0, ctx, opz = {}) {
  const meta = RICAMBI[id] || {}, posto = opz.posto || meta.posto, G = geoMoto(ctx); if (!G || !posto) return null;
  G0.updateMatrixWorld(true); const P = new THREE.Box3().setFromObject(G0, true), Ps = P.getSize(V()), Pc = P.getCenter(V());
  const out = { posto, nascondi: [], nota: '' }; let s = 1; const pos = V(), q = new THREE.Quaternion();
  const lim = (x, a, b) => Math.max(a, Math.min(b, x));
  /* allineamento a un ingombro: ax = 'min' | 'max' | 'c' per ogni asse */
  const suBox = (T, al, scala) => { const Ts = T.getSize(V()), Tc = T.getCenter(V()); if (scala) s = lim(scala, .7, 1.4);
    const Pm = P.min.clone().sub(Pc).multiplyScalar(s), PM = P.max.clone().sub(Pc).multiplyScalar(s); // ingombro del ricambio scalato, attorno all'origine
    for (const a of ['x', 'y', 'z']) { const k = al[a] || 'c'; pos[a] = k === 'min' ? T.min[a] - Pm[a] : k === 'max' ? T.max[a] - PM[a] : typeof k === 'number' ? k : Tc[a]; } };
  const { W, g, H, fx, rx, wb, mid, B } = G, Rf = W.front ? W.front.R : .32;
  switch (posto) {
    case 'serbatoio': { const L = isoleDi('serbatoio', G); if (L.length) { const T = boxDi(L); suBox(T, { x: 'max', y: 'min', z: 'c' }, T.getSize(V()).x / Ps.x); out.nascondi = L; }
      else { s = 1; pos.set(fx - .16 * wb - Ps.x / 2, g + .62 * H + Ps.y / 2, 0); out.nota = 'serbatoio di serie non riconosciuto: posizione di partenza sopra il motore'; } break; }
    case 'sella': { const L = isoleDi('sella', G); if (L.length) { const T = boxDi(L); suBox(T, { x: 'max', y: 'min', z: 'c' }, T.getSize(V()).z / Ps.z); out.nascondi = L; }
      else { pos.set(mid - .05 * wb, g + .55 * H + Ps.y / 2, 0); out.nota = 'sella di serie non riconosciuta'; } break; }
    case 'parafango_ant': case 'parafango_post': { const w = posto === 'parafango_ant' ? W.front : W.rear, L = isoleDi(posto, G);
      if (L.length) { const T = boxDi(L); suBox(T, { x: 'c', y: 'max', z: 'c' }, T.getSize(V()).x / Ps.x); if (w) pos.z = w.c.z; out.nascondi = L; }
      else if (w) { pos.set(w.c.x, w.c.y + w.R + .025 - Ps.y / 2, w.c.z); } break; }
    case 'parafanghi': return null; // gestito a pezzi (anteriore e posteriore)
    case 'faro': { const L = isoleDi('faro', G); if (L.length) { const T = boxDi(L); suBox(T, { x: 'max', y: 'c', z: 'c' }, T.getSize(V()).y / Ps.y); out.nascondi = L; }
      else { pos.set(fx - .1 * wb, g + .66 * H, 0); } break; }
    case 'mascherina': { const L = isoleDi('faro', G); if (L.length) { const T = boxDi(L), Tc = T.getCenter(V()); s = lim(Math.max(T.getSize(V()).y, T.getSize(V()).z) * 1.25 / Math.max(Ps.y, Ps.z), .7, 1.4);
        pos.set(T.max.x + .015 - Ps.x * s / 2, Tc.y, 0); out.nascondi = L; } else pos.set(fx - .08 * wb, g + .66 * H, 0); break; }
    case 'carena': { const F = isoleDi('faro', G), C = isoleDi('carena', G); const T = F.length ? boxDi(F) : null; if (C.length) out.nascondi = C;
      if (T) { const Tc = T.getCenter(V()); s = 1; pos.set(T.max.x + .03 - Ps.x / 2, Tc.y + (meta.faro ? .22 : .16) * Ps.y, 0); if (meta.faro) out.nascondi = out.nascondi.concat(F); }
      else pos.set(fx - .12 * wb, g + .72 * H, 0); break; }
    case 'forcella': { const L = isoleDi('forcella', G), A = ctx.asseRuota ? ctx.asseRuota('ant') : null, ax0 = A && A.ok ? A.c : (W.front ? W.front.c : null); if (!ax0) return null;
      // asse della forcella di serie (inclinazione di sterzo) e lunghezza
      let dir = V(-Math.sin(28 * Math.PI / 180), Math.cos(28 * Math.PI / 180), 0), Ls = .78;
      if (L.length) { const PP = puntiIsole(L), R = pca(PP); if (R) { const d = R.e[2].vec.clone(); if (d.y < 0) d.negate(); d.z = 0; if (d.lengthSq() > .1) { d.normalize(); if (d.y > .5) { dir = d; const [lo, hi] = estensione(PP, ax0, dir); Ls = Math.max(.35, hi - Math.max(lo, -.06)); } } }
        out.nascondi = L; }
      // asse del ricambio (già col verso giusto): direzione più lunga, alto = verso +Y
      const PR = punti(G0), R2 = pca(PR); let d2 = R2 ? R2.e[2].vec.clone() : V(0, 1, 0); if (d2.y < 0) d2.negate(); d2.z = 0; d2.normalize();
      q.setFromUnitVectors(d2, dir); const [lo2, hi2] = estensione(PR, Pc, d2); s = lim(Ls / (hi2 - lo2), .7, 1.4);
      // il piedino (estremo basso del ricambio) va sul perno della ruota
      const piede = Pc.clone().addScaledVector(d2, lo2 + .03 * (hi2 - lo2)).sub(Pc).multiplyScalar(s).applyQuaternion(q);
      pos.copy(ax0).sub(piede); pos.z = ax0.z; break; }
    case 'motore': { const L = isoleDi('motore', G); if (L.length) { const T = boxDi(L); suBox(T, { x: 'c', y: 'min', z: 'c' }, T.getSize(V()).y / Ps.y); out.nascondi = L; }
      else pos.set(mid, g + .12 + Ps.y / 2, 0); break; }
    case 'ammortizzatore': { const L = isoleDi('ammortizzatore', G); const lati = [1, -1].map(sg => L.filter(I => Math.sign(I.c.z) === sg)).filter(x => x.length);
      if (!lati.length) { pos.set(rx + .3 * wb, g + .45 * H, .16); break; }
      const PR = punti(G0), R2 = pca(PR); let d2 = R2 ? R2.e[2].vec.clone() : V(0, 1, 0); if (d2.y < 0) d2.negate(); const [lo2, hi2] = estensione(PR, Pc, d2);
      const fai = Lm => { const PP = puntiIsole(Lm), R = pca(PP), T = boxDi(Lm); let d = R ? R.e[2].vec.clone() : V(0, 1, 0); if (d.y < 0) d.negate(); d.z = 0; d.normalize(); if (d.y < .5) d = V(0, 1, 0);
        const [lo, hi] = R ? estensione(PP, R.c, d) : [-.17, .17]; return { c: R ? R.c.clone().addScaledVector(d, (lo + hi) / 2) : T.getCenter(V()), dir: d, Ls: hi - lo }; };
      const S = lati.map(fai); q.setFromUnitVectors(d2, S[0].dir); s = lim(S[0].Ls / (hi2 - lo2), .7, 1.4); pos.copy(S[0].c); out.copie = S.slice(1).map(x => x.c); out.nascondi = L; break; }
    case 'scarico': case 'silenziatore': { const L = isoleDi(posto, G); if (!L.length) { pos.set(rx + .1 * wb + Ps.x / 2, g + .2, .2); out.nota = 'scarico di serie non riconosciuto'; break; }
      // si allinea il silenziatore (metà posteriore) a quello di serie: stessa quota, stesso lato, all'esterno dei collettori
      const T = boxDi(L), side = Math.sign(T.getCenter(V()).z) || 1; out.lato = side; s = lim(T.getSize(V()).x / Ps.x, .7, 1.4);
      const SP = puntiIsole(L), sx = (T.min.x + T.max.x) / 2; let zS = 0, yS = 0, nS = 0; for (let i = 0; i < SP.length; i += 3) if (SP[i] < sx) { yS += SP[i + 1]; zS += SP[i + 2]; nS++; } if (!nS) { yS = T.getCenter(V()).y; zS = T.getCenter(V()).z; nS = 1; }
      const PR = punti(G0); let zM = 0, yM = 0, nM = 0, zH = 0, nH = 0; for (let i = 0; i < PR.length; i += 3) { if (PR[i] < Pc.x) { yM += PR[i + 1]; zM += PR[i + 2]; nM++; } else { zH += PR[i + 2]; nH++; } }
      yM /= (nM || 1); zM /= (nM || 1); zH /= (nH || 1); if (posto === 'scarico' && (zM - zH) * side < -.01) { out.specchia = 'z'; zM = -zM; zH = -zH; }
      if (posto === 'scarico') { // impianto completo: lunghezza e altezza di quello di serie (dalle teste al terminale), il lato esterno al suo posto
        const Ts = T.getSize(V()), sx = lim(Ts.x / Ps.x, .7, 1.4), sy = lim(Ts.y / Ps.y, .7, 1.4), sz = Math.sqrt(sx * sy); out.scalaXYZ = [sx, sy, sz];
        pos.set(T.min.x - (P.min.x - Pc.x) * sx, T.min.y - (P.min.y - Pc.y) * sy, zS / nS - (zM - Pc.z) * sz); out.nascondi = L; break; }
      pos.set(T.min.x - (P.min.x - Pc.x) * s, yS / nS - (yM - Pc.y) * s, zS / nS - (zM - Pc.z) * s); out.nascondi = L; break; }
    case 'ruota': case 'cerchio': case 'gomma': case 'disco': { const k = opz.pos || meta.pos || 'ant', A = ctx.asseRuota ? ctx.asseRuota(k) : null, w = k === 'ant' ? W.front : W.rear;
      const c = A && A.ok ? A.c : w ? w.c : null; if (!c) return null; const n = A && A.ok && A.n ? A.n.clone() : V(0, 0, 1); q.setFromUnitVectors(V(0, 0, 1), n);
      const Rr = A && A.ok ? A.R : w ? w.R : .32, WR = ctx.wheelRoles ? ctx.wheelRoles() : null, rim = WR && WR.rim && WR.rim[k] ? WR.rim[k] : .7 * Rr; const Rp = Math.max(Ps.x, Ps.y) / 2;
      if (posto === 'ruota' || posto === 'gomma') s = Rr / Rp; else if (posto === 'cerchio') s = rim / Rp; else s = 1; s = Math.max(.3, Math.min(3, s));
      pos.copy(c); if (posto === 'disco') pos.addScaledVector(n, .075); out.ruota = k;
      if (WR) out.nascondiMesh = posto === 'ruota' ? [...(WR[k + 'T'] || []), ...(WR[k + 'R'] || [])] : posto === 'gomma' ? WR[k + 'T'] || [] : posto === 'cerchio' ? WR[k + 'R'] || [] : []; break; }
    case 'manubrio': { const fb = ctx.findBars ? ctx.findBars() : null; if (fb) { s = 1; if (meta.clipon) pos.set(fb.clamp.x - .02, fb.clamp.y - .07, 0); else pos.set(fb.clamp.x - Ps.x * .1, fb.clamp.y - P.min.y + Pc.y - .005, 0);
        out.nascondi = [...fb.bars, ...fb.ctrl.L, ...fb.ctrl.R, ...fb.cables, ...fb.att, ...ST.detect(G.idx, 'specchietti')]; out.nota = 'specchietti e comandi di serie tolti con il manubrio: rimontali dal catalogo'; } else pos.set(fx - .22 * wb, g + .82 * H, 0); break; }
    case 'specchietto': { const fb = ctx.findBars ? ctx.findBars() : null, side = Math.sign((G0.userData.centro0 || [0, 0, 1])[2]) || 1;
      if (fb) { const e = side > 0 ? (fb.eR.z > 0 ? fb.eR : fb.eL) : (fb.eL.z < 0 ? fb.eL : fb.eR); pos.set(e.x - Ps.x * .1, e.y + Ps.y * .25, e.z - side * (Ps.z / 2 - .02)); out.nascondi = (side > 0 ? (fb.eR.z > 0 ? fb.ctrl.R : fb.ctrl.L) : (fb.eL.z < 0 ? fb.ctrl.L : fb.ctrl.R)); }
      else pos.set(fx - .25 * wb, g + .85 * H, side * .3); break; }
    case 'blocchetto': { const fb = ctx.findBars ? ctx.findBars() : null; if (fb) { const e = fb.eL.z < 0 ? fb.eL : fb.eR; pos.set(e.x, e.y + .01, e.z + .17); } else pos.set(fx - .25 * wb, g + .85 * H, -.25); break; }
    case 'olio': { const Ls = isoleDi('sella', G), T = Ls.length ? boxDi(Ls) : null; pos.set(T ? T.getCenter(V()).x - .04 : mid - .12 * wb, T ? T.min.y - .03 - Ps.y / 2 : g + .45 * H, .1 + Ps.z / 2); break; }
    case 'pinza': { const A = ctx.asseRuota ? ctx.asseRuota('ant') : null, c = A && A.ok ? A.c : W.front ? W.front.c : V(fx, g + .32, 0); pos.set(c.x - .13, c.y + .07, c.z + .1); break; }
    case 'frecce_post': { const w = W.rear; pos.set(w ? w.c.x - w.R - .02 + Ps.x / 2 - .08 : rx - .3, w ? w.c.y + .12 : g + .45, 0); break; }
    case 'targa': { const w = W.rear; pos.set(w ? w.c.x - .02 : rx, w ? w.c.y + .04 : g + .35, w ? w.c.z - .19 : -.19); break; }
    case 'pedane': { pos.set(fx - Rf - .16, g + .3, 0); break; }
    case 'paramotore': case 'spoiler': { const L = isoleDi('motore', G), T = L.length ? boxDi(L) : null;
      if (posto === 'paramotore') pos.set(T ? T.max.x + .05 - Ps.x / 2 : mid + .2 * wb, T ? T.getCenter(V()).y + .04 : g + .4 * H, 0);
      else pos.set(T ? T.max.x + .06 - Ps.x / 2 : mid + .22 * wb, g + .07 + Ps.y / 2, 0); break; }
    case 'esposizione': default: { pos.set(mid, g + Ps.y / 2, B.max.z + .32 + Ps.z / 2); out.nota = 'set da esposizione: messo accanto alla moto, scegli e sposta il pezzo che ti serve'; break; }
  }
  out.mat = new THREE.Matrix4().compose(pos, q, out.scalaXYZ ? V(...out.scalaXYZ) : V(s, s, s)); out.scala = s; return out;
}

/* ---------- 4. calamita: punti di aggancio mentre si sposta un pezzo (centri, facce, spigoli, assi ruota, mezzeria, terra) ---------- */
export function creaCalamita(ctx) {
  const { scene, camera, renderer, invalidate } = ctx; let attiva = true, T = null, snap = null, nascT = null;
  const view = renderer.domElement.parentElement; const lab = document.createElement('div'); lab.className = 'snapLab'; lab.style.display = 'none'; view.appendChild(lab);
  const mk = new THREE.Group(); mk.renderOrder = 999; mk.visible = false; const mm = new THREE.MeshBasicMaterial({ color: 0x35e0ff, depthTest: false, transparent: true, opacity: .95 });
  const ring = new THREE.Mesh(new THREE.RingGeometry(.9, 1.25, 28), mm); const dot = new THREE.Mesh(new THREE.CircleGeometry(.32, 16), mm); [ring, dot].forEach(m => { m.renderOrder = 999; mk.add(m); }); scene.add(mk);
  const pr = new THREE.Vector3(), rect = () => renderer.domElement.getBoundingClientRect();
  const schermo = (p, R) => { pr.copy(p).project(camera); return [(pr.x + 1) / 2 * R.width, (1 - pr.y) / 2 * R.height, pr.z]; };
  function puntiBox(b, nome, L) { const c = b.getCenter(V()); L.push([c, 'Centro · ' + nome]);
    for (const [a, n1, n2] of [['x', 'davanti', 'dietro'], ['y', 'sopra', 'sotto'], ['z', 'destra', 'sinistra']]) { const p1 = c.clone(), p2 = c.clone(); p1[a] = b.max[a]; p2[a] = b.min[a]; L.push([p1, 'Faccia ' + n1 + ' · ' + nome], [p2, 'Faccia ' + n2 + ' · ' + nome]); } }
  const dentro = (o, x) => { for (let p = x; p; p = p.parent) if (p === o) return true; return false; };
  function inizio(o) { if (!attiva || !o) { T = null; return; } const M = ctx.getModel(); if (!M) { T = null; return; } const L = [], R = rect();
    try { const idx = ST.buildIndex(M); for (const I of idx.isl) { if (!I.mesh.visible || I.mesh.userData.vuoto || dentro(o, I.mesh) || I.s.length() < .012) continue; const nm = ctx.nomeDi ? ctx.nomeDi(I.mesh) : 'pezzo';
        if (I.s.length() < .08) L.push([I.c.clone(), 'Centro · ' + nm]); else puntiBox(I.box, nm, L); }
      for (const k of ['ant', 'post']) { const A = ctx.asseRuota ? ctx.asseRuota(k) : null; if (A && A.ok) L.push([A.c.clone(), 'Asse ruota ' + (k === 'ant' ? 'anteriore' : 'posteriore')]); } } catch (e) { console.warn('calamita', e); }
    scene.children.forEach(a => { if (!a.userData || !a.userData.acc || a === o || dentro(a, o) || !a.visible) return; const b = new THREE.Box3().setFromObject(a); if (!b.isEmpty()) puntiBox(b, a.userData.accName || 'accessorio', L); });
    // coordinate a schermo una volta sola: durante il trascinamento la vista non si muove
    T = { L: L.map(([p, n]) => { const s = schermo(p, R); return { p, n, x: s[0], y: s[1], z: s[2] }; }).filter(t => t.z < 1), R }; snap = null; loc = null; }
  let loc = null; // ingombro esatto del pezzo nel suo sistema: i suoi punti seguono lo spostamento senza ricalcoli
  function boxLocale(o) { o.updateMatrixWorld(true); const inv = new THREE.Matrix4().copy(o.matrixWorld).invert(), M4 = new THREE.Matrix4(), b = new THREE.Box3(), v = V(); let n = 0;
    o.traverse(m => { if (!m.isMesh || !m.geometry || !m.geometry.attributes.position) return; const p = m.geometry.attributes.position; M4.multiplyMatrices(inv, m.matrixWorld); const st = Math.max(1, Math.floor(p.count / 40000));
      for (let i = 0; i < p.count; i += st) { b.expandByPoint(v.fromBufferAttribute(p, i).applyMatrix4(M4)); n++; } }); return n ? b : null; }
  function propri(o) { o.updateMatrixWorld(true); if (!loc || loc.o !== o) loc = { o, b: boxLocale(o) }; if (!loc.b) return []; const b = loc.b, c = b.getCenter(V()), out = [c.clone()];
    for (const a of ['x', 'y', 'z']) { const p1 = c.clone(), p2 = c.clone(); p1[a] = b.max[a]; p2[a] = b.min[a]; out.push(p1, p2); }
    const W = out.map(p => p.applyMatrix4(o.matrixWorld)); if (o.userData.pivotL) W.unshift(o.localToWorld(o.userData.pivotL.clone())); return W; }
  function muovi(o) { if (!T || !attiva || !o) return; const tol = matchMedia('(pointer:coarse)').matches ? 26 : 15; const R = T.R; let best = null;
    for (const p of propri(o)) { const sp = schermo(p, R); for (const t of T.L) { const d = Math.hypot(t.x - sp[0], t.y - sp[1]); if (d < tol && (!best || d < best.d) && t.p.distanceTo(p) < .35) best = { d, t, p }; } }
    // mezzeria della moto e appoggio a terra (solo su quell'asse)
    const b = new THREE.Box3().setFromObject(o), c = b.getCenter(V()); const M = ctx.getModel(), g = M ? new THREE.Box3().setFromObject(M).min.y : 0; let dz = null, dy = null;
    if (!best && Math.abs(c.z) < .012) dz = -c.z; if (!best && Math.abs(b.min.y - g) < .01) dy = g - b.min.y;
    if (best) { const d = best.t.p.clone().sub(best.p); spostaMondo(o, d); snap = best.t; mostra(best.t.p, best.t.n); }
    else if (dz !== null || dy !== null) { spostaMondo(o, V(0, dy || 0, dz || 0)); const p = c.clone(); if (dz !== null) p.z = 0; if (dy !== null) p.y = g; snap = { p, n: dz !== null ? 'Mezzeria della moto' : 'Appoggio a terra' }; mostra(p, snap.n); }
    else { snap = null; nascondi(); } }
  function spostaMondo(o, d) { const par = o.parent; if (!par) { o.position.add(d); return; } par.updateMatrixWorld(true); const a = par.worldToLocal(V(0, 0, 0)), b2 = par.worldToLocal(d.clone()); o.position.add(b2.sub(a)); o.updateMatrixWorld(true); }
  function mostra(p, n) { clearTimeout(nascT); mk.position.copy(p); const dist = camera.position.distanceTo(p); mk.scale.setScalar(dist * .011); mk.quaternion.copy(camera.quaternion); mk.visible = true;
    const R = rect(), s = schermo(p, R); lab.textContent = n; lab.style.left = Math.round(s[0] + 14) + 'px'; lab.style.top = Math.round(s[1] - 30) + 'px'; lab.style.display = 'block'; invalidate(); }
  function nascondi() { mk.visible = false; lab.style.display = 'none'; invalidate(); }
  function fine() { const s = snap; T = null; snap = null; nascT = setTimeout(nascondi, s ? 1300 : 0); return s; }
  return { inizio, muovi, fine, get attiva() { return attiva; }, set attiva(v) { attiva = !!v; if (!v) nascondi(); }, nascondi };
}
