/* NJ.D' RIDE – Libreria PRO (2): scarichi, manopole, pedane, cavalletti, coperchi motore, tappi, fanalini.
   © 2026 dott. Jonathan D'Eugenio – Tutti i diritti riservati (L. 633/1941). Tipologie generiche, nessun logo. */
import * as THREE from 'three';
import { H, registerPro, FIN_METAL, LENS_COL } from './pro.js';
import { buildPortExhaust } from './scarichi.js';
const { mesh, lathe, bentPath, tubeAlong, closedSpline, hexPrism, capScrew, buttonScrew, threadedRod, shapeFrom, roundRect, roundRectPts, extrudeShape, smoothClosed, metal, leather, lens, rubber, darkMat, T, V3, IN, PI, sstep, clamp, sel, num, col, YN, RoundedBoxGeometry } = H;

/* ---------- texture locali ---------- */
const TX = {};
function htex(key, size, fn, str = 2, srgbFill = null) {
  if (TX[key]) return TX[key]; const c = document.createElement('canvas'); c.width = c.height = size; const g = c.getContext('2d');
  const Hh = new Float32Array(size * size); for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) Hh[y * size + x] = fn(x / size, y / size);
  const id = g.createImageData(size, size), d = id.data;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) { const dx = (Hh[y * size + (x + 1) % size] - Hh[y * size + (x - 1 + size) % size]) * str, dy = (Hh[((y + 1) % size) * size + x] - Hh[((y - 1 + size) % size) * size + x]) * str; const l = Math.hypot(dx, dy, 1), i = (y * size + x) * 4; d[i] = (-dx / l * .5 + .5) * 255; d[i + 1] = (dy / l * .5 + .5) * 255; d[i + 2] = (1 / l * .5 + .5) * 255; d[i + 3] = 255; }
  g.putImageData(id, 0, 0); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return (TX[key] = t);
}
const wrapN = () => htex('hw', 256, (u, v) => { const b = (u * 6 + v * 1) % 1; return Math.pow(Math.sin(PI * b), .35) + .15 * Math.sin(u * 2 * PI * 60); }, 3);
const ribN = () => htex('rib', 128, (u, v) => Math.pow(Math.abs(Math.sin(PI * v * 8)), .5), 3);
function heatWrap(c) { const col = { nera: 0x1c1c1c, titanio: 0x6e6658, sabbia: 0xb7a37e }[c] ?? 0x1c1c1c; const m = new THREE.MeshPhysicalMaterial({ name: 'Fascia termica', color: col, roughness: .92, sheen: .7, sheenColor: new THREE.Color(col).multiplyScalar(1.6), normalMap: wrapN().clone(), normalScale: new THREE.Vector2(1.2, 1.2) }); m.normalMap.needsUpdate = true; return m; }
function pipeMat(f) { const m = f === 'titanio' ? Object.assign(metal('polished', 'Scarico'), { iridescence: 1, iridescenceIOR: 2.2, iridescenceThicknessRange: [250, 900], color: new THREE.Color(0xc8c2d6) }) : f === 'ceramico' ? Object.assign(metal('satin', 'Scarico'), { metalness: .2, roughness: .6, clearcoat: 0 }) : metal(f, 'Scarico'); m.name = 'Scarico'; m.side = THREE.DoubleSide; return m; }

/* tubo con taglio del terminale: slash / dritto / fishtail */
function pipeTube(pts, r, mat, tip, seg = 400) {
  const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal'); const g = new THREE.TubeGeometry(curve, seg, r, 40, false);
  const P = curve.getPointAt(1), t = curve.getTangentAt(1).normalize(), up = V3(0, 1, 0), side = t.clone().cross(up).normalize(), vup = side.clone().cross(t).normalize();
  const pos = g.attributes.position, v = new THREE.Vector3();
  if (tip === 'slash') { const n = t.clone().addScaledVector(vup, -Math.tan(35 * PI / 180)).normalize(); for (let i = 0; i < pos.count; i++) { v.fromBufferAttribute(pos, i); const d = v.clone().sub(P).dot(n); if (d > -r * 1.2) { const back = (d + r * .75) / t.dot(n); if (back > 0) { v.addScaledVector(t, -back); pos.setXYZ(i, v.x, v.y, v.z); } } } }
  if (tip === 'fishtail') { const L = .14; for (let i = 0; i < pos.count; i++) { v.fromBufferAttribute(pos, i); const s = v.clone().sub(P).dot(t) + L; if (s > 0) { const u = clamp(s / L, 0, 1), axis = P.clone().addScaledVector(t, s - L), rel = v.clone().sub(axis); const a = rel.dot(vup), b = rel.dot(side); const q = axis.clone().addScaledVector(vup, a * (1 + .95 * u * u)).addScaledVector(side, b * (1 - .55 * u)); pos.setXYZ(i, q.x, q.y, q.z); } } }
  g.computeVertexNormals(); const G = new THREE.Group(); G.add(mesh(g, mat));
  const inner = new THREE.TubeGeometry(curve, 30, r * .86, 24, false); const im = mesh(inner, darkMat('Interno scarico'), false); im.scale.setScalar(1); G.add(im);
  return { G, curve };
}
function splitPts(curve, f, n = 220) { const P = curve.getSpacedPoints(n), k = Math.round(n * f); return [P.slice(0, k + 1), P.slice(k)]; }

/* ====================================== SCARICHI ====================================== */
function buildExhaust(o) {
  if (o.__exh) return buildPortExhaust(o, o.__exh);   // montaggio sulle luci di scarico misurate della moto
  const G = new THREE.Group(), r = (o.diametro === '2' ? 2 : 1.75) * IN / 2, pm = pipeMat(o.finitura), wm = o.fascia !== 'no' ? heatWrap(o.fascia) : null;
  const L = o.lunghezza === 'corto' ? .8 : o.lunghezza === 'lungo' ? 1.08 : .95;
  const A = [V3(0, 0, 0), V3(.035, -.05, .022), V3(.025, -.17, .062), V3(-.08, -.27, .084)];
  const B = [V3(-.16, .03, 0), V3(-.2, -.035, .035), V3(-.255, -.12, .07), V3(-.34, -.165, .088)];
  const flange = (p, dir) => { const f = mesh(lathe([[r * .98, -.004], [r * 1.55, -.004], [r * 1.6, 0], [r * 1.55, .004], [r * .98, .004]], 48, .0008), metal('chrome', 'Flange')); f.quaternion.setFromUnitVectors(V3(0, 1, 0), dir); f.position.copy(p); G.add(f); };
  const pipe = (pts, tip) => { const tot = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
    if (wm) { const [a, b] = splitPts(tot, .42); const w = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(a, false, 'centripetal'), 160, r * 1.06, 32, false); const wmm = wm.clone(); wmm.normalMap = wm.normalMap; wmm.normalMap.repeat.set(tot.getLength() * .42 / .028, 1); G.add(mesh(w, wmm)); }
    const res = pipeTube(pts, r, pm, tip); G.add(res.G); flange(pts[0], tot.getTangentAt(0)); return res.curve; };
  const tip = o.terminale;
  if (o.tipo === '2in1' || o.tipo === 'megafono') {
    const C = V3(-.36, -.255, .095), M0 = V3(-.47, -.245, .1), M1 = V3(-L, -.215, .104);
    pipe([A[0], A[1], A[2], V3(-.07, -.258, .08), V3(-.22, -.263, .092), C], 'dritto'); pipe([B[0], B[1], V3(-.25, -.13, .07), V3(-.3, -.2, .09), C.clone().add(V3(.015, .008, 0))], 'dritto');
    const coll = mesh(lathe([[r * 1.1, 0], [r * 1.45, .03], [r * 1.5, .06], [r * 1.25, .11]], 64, .002), pm); coll.quaternion.setFromUnitVectors(V3(0, 1, 0), M0.clone().sub(C).normalize().negate()); coll.position.copy(M0); G.add(coll);
    const dir = M1.clone().sub(M0).normalize(), len = M1.distanceTo(M0); const mu = new THREE.Group();
    if (o.tipo === 'megafono') mu.add(mesh(lathe([[r * 1.25, 0], [r * 1.3, .04], [r * 2.6, len - .02], [r * 2.75, len], [r * 2.55, len + .004]], 96, .003), pm));
    else { mu.add(mesh(lathe([[r * 1.2, 0], [r * 2.25, .05], [r * 2.4, .08], [r * 2.4, len - .05], [r * 2.3, len - .02], [r * 1.6, len]], 96, .004), pm)); }
    const cap = mesh(new THREE.CircleGeometry(o.tipo === 'megafono' ? r * 2.5 : r * 1.55, 64), darkMat('Interno scarico')); cap.rotation.x = -PI / 2; cap.position.y = len - .006; mu.add(cap);
    const baf = mesh(lathe([[r * .5, 0], [r * .7, 0], [r * .7, .02], [r * .5, .02]], 32, .0005), metal('chrome', 'Db-killer')); baf.position.y = len - .03; mu.add(baf);
    mu.quaternion.setFromUnitVectors(V3(0, 1, 0), dir); mu.position.copy(M0); G.add(mu);
    const br = mesh(new RoundedBoxGeometry(.05, .006, .03, 2, .002), metal('satin', 'Staffe')); br.position.copy(M0.clone().lerp(M1, .55)).add(V3(0, .055, -.02)); G.add(br);
  } else {
    const dy = o.tipo === 'sfalsati' ? .085 : o.tipo === 'drag' ? .075 : .09, endF = V3(-L, o.tipo === 'drag' ? -.2 : -.235, .1), endR = V3(o.tipo === 'sfalsati' ? -L + .16 : -L, endF.y + dy, .102);
    const extra = o.tipo === 'turnout' ? [p => V3(p.x - .06, p.y - .035, p.z + .045)] : [];
    const fp = [...A, V3(-.3, -.255 + (o.tipo === 'drag' ? .03 : 0), .096), endF]; const rp = [...B, V3(-.45, endF.y + dy, .099), endR];
    if (o.tipo === 'turnout') { fp.push(extra[0](endF)); rp.push(extra[0](endR)); }
    const tp = o.tipo === 'turnout' ? 'dritto' : tip;
    const c1 = pipe(fp, tp), c2 = pipe(rp, tp);
    for (const x of [-.52, -.78]) if (x > -L + .1) { const a = c1.getPointAt(clamp((x - (-.08)) / (endF.x + .08) * .9 + .08, 0, 1)), b = c2.getPointAt(clamp((x + .34) / (endR.x + .34) * .92 + .05, 0, 1));
      const br = mesh(tubeAlong(new THREE.LineCurve3(a.clone().add(V3(0, 0, -r * .9)), b.clone().add(V3(0, 0, -r * .9))), .005, 8, 12), metal('satin', 'Staffe')); G.add(br); }
  }
  if (o.paracalore === 'si') { const hs = new THREE.Group(); const g = new THREE.CylinderGeometry(r * 1.45, r * 1.45, .26, 48, 1, true, -PI * .1, PI * 1.2); const sh = mesh(g, metal('chrome', 'Paracalore')); sh.material.side = THREE.DoubleSide; hs.add(sh);
    hs.position.set(-.05, -.22, .075); hs.rotation.z = PI / 2 + .25; hs.rotation.x = 0; G.add(hs); }
  return G;
}
registerPro('scarico', { n: 'Scarico completo', cat: 'Scarichi', type: 'exhaust', b: 'Vance & Hines, Freedom, Cobra, 2 Bros, RSD', p: 65, build: buildExhaust,
  opts: [sel('tipo', 'Tipo', [['shotgun', 'Shotgun (paralleli)'], ['sfalsati', 'Staggered (sfalsati)'], ['drag', 'Drag pipes'], ['turnout', 'Turnout'], ['2in1', '2 in 1 con silenziatore (Pro Pipe)'], ['megafono', '2 in 1 megafono'], ['alto', '2 in 1 alto (special titanio)'], ['incrociati', 'Collettori corti incrociati (stile Thunderbike)'], ['spaghetti', 'Collettori a spicchi in titanio verso terra'], ['slipon', 'Slip-on neri sovrapposti'], ['2in2', '2 in 2 Big Radius'], ['fishtail', 'Fishtail vintage']], 'shotgun'), sel('terminale', 'Terminale', [['slash', 'Slash cut'], ['dritto', 'Dritto'], ['fishtail', 'Fishtail']], 'slash'), sel('finitura', 'Finitura', [['chrome', 'Cromato'], ['blackchrome', 'Black chrome'], ['ceramico', 'Nero ceramico'], ['titanio', 'Titanio bruciato'], ['brushed', 'Inox spazzolato']], 'chrome'), sel('fascia', 'Fascia termica', [['no', 'No'], ['nera', 'Nera'], ['titanio', 'Titanio'], ['sabbia', 'Sabbia']], 'no'), sel('paracalore', 'Paracalore', YN, 'no'), sel('diametro', 'Diametro', [['1.75', '1¾"'], ['2', '2"']], '1.75'), sel('lunghezza', 'Lunghezza', [['corto', 'Corto'], ['standard', 'Standard'], ['lungo', 'Lungo']], 'standard')] });

/* ====================================== MANOPOLE ====================================== */
const RUBCOL = [['nero', 'Nero'], ['marrone', 'Marrone'], ['bianco', 'Bianco crema'], ['rosso', 'Rosso']];
const RC = { nero: 0x121213, marrone: 0x3a2618, bianco: 0xd8d0bd, rosso: 0x7a1414 };
function buildGrip(o) {
  const G = new THREE.Group(), Y = new THREE.Group(); G.add(Y); Y.rotation.x = (o.lato === 'sinistro' ? -1 : 1) * PI / 2; // asse lungo z: fuori = +z per il destro, -z per il sinistro
  const rb = .0127, rm = new THREE.MeshPhysicalMaterial({ name: 'Manopola', color: RC[o.colore] ?? RC.nero, roughness: .82, normalMap: T.peel(), normalScale: new THREE.Vector2(.3, .3) });
  const fin = metal(o.finitura, 'Inserti metallici'); let prof = [], ext = [];
  const L = o.stile === 'vintage' ? .135 : .125;
  if (o.stile === 'rigata' || o.stile === 'chunky') { const R0 = o.stile === 'chunky' ? .0205 : .0172; prof = [[rb + .0004, 0], [R0 + .004, .0015], [R0 + .004, .009], [R0, .012]]; for (let y = .014; y < L - .008; y += .0042) prof.push([R0, y], [R0 + .0011, y + .0012], [R0 + .0011, y + .0026], [R0, y + .0038]); prof.push([R0 + .0004, L - .004], [R0 - .0008, L], [rb + .0004, L]); }
  else if (o.stile === 'barile') { for (let i = 0; i <= 30; i++) { const t = i / 30, y = t * L; prof.push([.0168 + .0045 * Math.sin(PI * t) + (i % 3 === 0 ? -.0005 : 0), y]); } prof.unshift([rb + .0004, 0]); prof.push([rb + .0004, L]); }
  else if (o.stile === 'vintage') { prof = [[rb + .0004, 0], [.0175, .002]]; for (let y = .006; y < L - .006; y += .003) prof.push([.0168, y], [.0172, y + .0015]); prof.push([.0172, L - .002], [rb + .0004, L]); }
  else prof = [[rb + .0004, 0], [.0185, .0015], [.0185, L - .0015], [rb + .0004, L]];
  let gm = rm;
  if (o.stile === 'diamante') { gm = rm.clone(); gm.normalMap = T.knurl(); gm.normalMap.repeat.set(1, 3); gm.normalScale = new THREE.Vector2(1.1, 1.1); }
  if (o.stile === 'pelle') { gm = leather(o.colore === 'bianco' ? 'crema' : o.colore === 'rosso' ? 'bordeaux' : o.colore === 'marrone' ? 'marrone' : 'nero', 'liscia', 'Manopola', 30); gm.normalMap = htex('wrapg', 256, (u, v) => Math.pow(Math.abs(Math.sin(PI * (u * 2 + v) * 4)), .4), 2); gm.normalMap.repeat.set(2, 5); gm.normalScale = new THREE.Vector2(.8, .8); }
  if (o.stile === 'billet') { gm = fin; prof = [[rb + .0004, 0], [.019, .001], [.019, L - .001], [rb + .0004, L]]; }
  Y.add(mesh(lathe(prof, 64, .0004), gm));
  if (o.stile === 'billet') for (const y of [.028, .062, .096]) { const ri = mesh(new THREE.TorusGeometry(.0193, .0029, 12, 64), rm); ri.rotation.x = PI / 2; ri.position.y = y; Y.add(ri); }
  if (o.stile === 'chunky') for (const y of [0, L - .004]) { const ri = mesh(lathe([[.0215, 0], [.0235, .0005], [.0235, .0035], [.0215, .004]], 64, .0004), fin); ri.position.y = y; Y.add(ri); }
  Y.add(mesh(lathe([[0, L], [.0172, L], [.018, L + .004], [.0165, L + .007], [.011, L + .008], [0, L + .008]], 48, .0006), fin));
  return G;
}
registerPro('manopola', { n: 'Manopola (singola)', cat: 'Manubri', type: 'bars', b: 'Biltwell, Kustom Tech, Performance Machine, Burly', p: 873, build: buildGrip,
  opts: [sel('stile', 'Modello', [['rigata', 'Rigata'], ['diamante', 'Zigrinata a diamante'], ['billet', 'Billet con anelli'], ['pelle', 'Pelle intrecciata'], ['chunky', 'Chunky Ø 41'], ['barile', 'A barile'], ['vintage', 'Vintage a righe sottili']], 'rigata'), sel('colore', 'Colore gomma', RUBCOL, 'nero'), sel('finitura', 'Parti metalliche', FIN_METAL, 'chrome'), sel('lato', 'Lato', [['sinistro', 'Sinistro'], ['destro', 'Destro (acceleratore)']], 'sinistro')] });

/* ====================================== PEDANE E POGGIAPIEDI ====================================== */
function buildPeg(o) {
  const G = new THREE.Group(), M = new THREE.Group(); G.add(M); if (o.lato === 'sinistro') M.scale.z = -1;
  const fm = metal(o.finitura, 'Poggiapiedi'), rm = rubber('Gomma');
  const clev = mesh(new RoundedBoxGeometry(.03, .026, .03, 3, .004), fm); clev.position.set(0, 0, .012); M.add(clev);
  const pin = mesh(new THREE.CylinderGeometry(.0042, .0042, .034, 20), metal('chrome', 'Perno')); pin.position.set(0, 0, .012); M.add(pin);
  if (o.tipo === 'pedana' || o.tipo === 'mini pedana') { const w = o.tipo === 'pedana' ? .3 : .17, d = o.tipo === 'pedana' ? .11 : .085;
    const plate = mesh(extrudeShape(roundRect(w, d, .03), .012, .003), fm); plate.rotation.x = -PI / 2; plate.position.set(-.02, .006, .035 + d / 2); M.add(plate);
    const pad = new RoundedBoxGeometry(w - .03, .014, d - .025, 3, .005); const pp = mesh(pad, rm.clone()); pp.material.normalMap = ribN(); pp.material.normalMap.repeat.set(1, 10); pp.material.normalScale = new THREE.Vector2(1, 1); pp.position.set(-.02, .02, .035 + d / 2); M.add(pp);
    for (const x of [-w * .4, w * .4]) for (const z of [.035 + .012, .035 + d - .012]) { const s = buttonScrew(.005, metal('chrome', 'Viteria'), darkMat()); s.position.set(-.02 + x, .0125, z); M.add(s); } }
  else { const Lp = .1, R = .0155; const Y = new THREE.Group(); Y.rotation.x = PI / 2; Y.position.set(0, 0, .028); M.add(Y);
    if (o.tipo === 'gomma') { const prof = [[.006, 0], [R, 0]]; for (let y = .004; y < Lp - .01; y += .006) prof.push([R, y], [R + .002, y + .0015], [R + .002, y + .0045], [R, y + .006]); prof.push([R, Lp - .008], [0, Lp - .008]); Y.add(mesh(lathe(prof, 48, .0005), rm)); Y.add(mesh(lathe([[0, Lp - .008], [R + .0005, Lp - .008], [R + .0005, Lp - .004], [R - .002, Lp], [0, Lp]], 48, .0008), fm)); }
    else if (o.tipo === 'diamante') { const dm = fm.clone(); dm.normalMap = T.knurl(); dm.normalMap.repeat.set(3, 2); dm.normalScale = new THREE.Vector2(1, 1); Y.add(mesh(lathe([[.006, 0], [R, 0], [R, Lp - .006], [R - .003, Lp], [0, Lp]], 64, .001), dm)); }
    else if (o.tipo === 'spike') { Y.add(mesh(lathe([[.006, 0], [R * .85, 0], [R * .85, Lp], [0, Lp]], 48, .001), fm)); for (let k = 0; k < 4; k++) { const y = .015 + k * .022; const ring = mesh(lathe([[R * .85, y], [R + .002, y + .002], [R + .002, y + .008], [R * .85, y + .01]], 48, .0005), rm); Y.add(ring); for (let a = 0; a < 8; a++) { const sp = mesh(new THREE.ConeGeometry(.0028, .009, 12), fm); const ang = a / 8 * 2 * PI + k * .4; sp.position.set(Math.cos(ang) * (R + .005), y + .005, Math.sin(ang) * (R + .005)); sp.quaternion.setFromUnitVectors(V3(0, 1, 0), V3(Math.cos(ang), 0, Math.sin(ang))); Y.add(sp); } } }
    else { const prof = [[.006, 0], [.017, 0]]; for (let i = 1; i <= 20; i++) { const t = i / 20; prof.push([.017 + .006 * Math.sin(PI * t), t * Lp]); } prof.push([0, Lp]); Y.add(mesh(lathe(prof, 64, .001), rm)); Y.add(mesh(lathe([[0, Lp], [.016, Lp], [.016, Lp + .004], [0, Lp + .005]], 48, .0008), fm)); }
  }
  return G;
}
registerPro('pedana', { n: 'Poggiapiedi / pedana', cat: 'Comandi', type: 'frame', b: 'Kustom Tech, Performance Machine, Burly, Pingel', p: 999, build: buildPeg,
  opts: [sel('tipo', 'Modello', [['gomma', 'Piolo in gomma'], ['diamante', 'Billet zigrinato'], ['spike', 'Spike'], ['barile', 'A barile'], ['mini pedana', 'Mini pedana'], ['pedana', 'Pedana (floorboard)']], 'gomma'), sel('finitura', 'Finitura', FIN_METAL, 'chrome'), sel('lato', 'Lato', [['destro', 'Destro'], ['sinistro', 'Sinistro']], 'destro')] });

/* ====================================== CAVALLETTO LATERALE ====================================== */
function buildKickstand(o) {
  const G = new THREE.Group(), fm = metal(o.finitura, 'Cavalletto');
  const L = { corto: .25, standard: .28, lungo: .31 }[o.lunghezza] || .28;
  const path = bentPath([V3(0, 0, 0), V3(.03, -.06, -.012), V3(.07, -L * .62, -.042), V3(.095, -L, -.07)], [0, .03, .08, 0]);
  G.add(mesh(new THREE.ExtrudeGeometry(roundRect(.012, .02, .0045), { steps: 160, bevelEnabled: false, extrudePath: path }), fm));
  const boss = mesh(lathe([[.006, -.014], [.017, -.014], [.018, -.012], [.018, .012], [.017, .014], [.006, .014]], 48, .001), fm); boss.rotation.x = PI / 2; G.add(boss);
  const bolt = mesh(hexPrism(.017, .008, .0, .0006), metal('chrome', 'Perno')); bolt.rotation.x = PI / 2; bolt.position.z = -.019; G.add(bolt);
  const end = path.getPointAt(1);
  const foot = new THREE.Group();
  if (o.piede === 'goccia') foot.add(mesh(extrudeShape(shapeFrom(smoothClosed([[.035, 0], [.02, .02], [-.02, .022], [-.04, 0], [-.02, -.022], [.02, -.02]], 80)), .008, .002), fm));
  else if (o.piede === 'largo') foot.add(mesh(extrudeShape(roundRect(.075, .045, .015), .008, .002), fm));
  else foot.add(mesh(new THREE.CylinderGeometry(.022, .024, .009, 48), fm));
  if (o.piede !== 'tondo') foot.children[0].rotation.x = -PI / 2;
  foot.position.copy(end).add(V3(0, -.004, 0)); G.add(foot);
  const tang = mesh(tubeAlong(bentPath([V3(.012, -.03, -.008), V3(.03, -.035, -.045), V3(.032, -.028, -.07)], .015), .0055, 40, 12), fm); G.add(tang);
  const sp = []; for (let i = 0; i <= 14 * 18; i++) { const t = i / (14 * 18), a = t * 14 * 2 * PI; sp.push(V3(-.01 - t * .06, -.02 + Math.cos(a) * .004, -.008 + Math.sin(a) * .004)); } G.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(sp), 600, .0011, 6), metal('blackchrome', 'Molla')));
  return G;
}
registerPro('cavalletto', { n: 'Cavalletto laterale', cat: 'Telaio', type: 'frame', b: 'Kustom Tech, Pingel, Joker Machine', p: 1105, build: buildKickstand,
  opts: [sel('lunghezza', 'Lunghezza', [['corto', 'Accorciato (moto ribassate)'], ['standard', 'Standard'], ['lungo', 'Allungato (moto rialzate)']], 'standard'), sel('piede', 'Piede', [['tondo', 'Tondo'], ['goccia', 'A goccia'], ['largo', 'Largo antisprofondamento']], 'tondo'), sel('finitura', 'Finitura', FIN_METAL, 'chrome')] });

/* ====================================== COPERCHI MOTORE ====================================== */
function buildCover(o) {
  const G = new THREE.Group(), Z = new THREE.Group(); G.add(Z); Z.rotation.x = (o.lato === 'sinistro' ? -1 : 1) * PI / 2; // faccia verso l'esterno
  const R = o.tipo === 'derby' ? .062 : .04, fm = metal(o.finitura, 'Coperchio'), dk = metal('gloss', 'Fondo');
  const ns = o.tipo === 'derby' ? 5 : 2, sr = R * .86;
  const dome = o.stile === 'punta' ? [[0, .02], [R * .3, .016], [R * .7, .011], [R * .95, .006], [R, .002], [R, 0]] : [[0, .011], [R * .6, .0105], [R * .88, .008], [R, .004], [R * 1.01, 0]];
  if (o.stile === 'raggi' || o.stile === 'forato') {
    const s = new THREE.Shape(); s.absarc(0, 0, R, 0, 2 * PI, false);
    if (o.stile === 'raggi') { const n = 6; for (let k = 0; k < n; k++) { const a0 = k / n * 2 * PI + .18, a1 = (k + 1) / n * 2 * PI - .18; const p = new THREE.Path(); p.absarc(0, 0, R * .78, a0, a1, false); p.absarc(0, 0, R * .3, a1, a0, true); p.closePath(); s.holes.push(p); } }
    else { for (let k = 0; k < 10; k++) { const a = k / 10 * 2 * PI, p = new THREE.Path(); p.absarc(Math.cos(a) * R * .6, Math.sin(a) * R * .6, R * .1, 0, 2 * PI, true); s.holes.push(p); } }
    const top = mesh(extrudeShape(s, .006, .0015, 3, 64), fm); top.rotation.x = -PI / 2; top.position.y = .002; Z.add(top);
    const back = mesh(lathe([[0, .002], [R * .96, .002], [R * .96, 0], [0, 0]], 64, .0005), dk); Z.add(back);
  } else Z.add(mesh(lathe(dome, 128, .0015), fm));
  if (o.stile === 'cerchi') for (const k of [.45, .65, .82]) { const g = mesh(new THREE.TorusGeometry(R * k, .0011, 8, 128), metal('bright', 'Fresature')); g.rotation.x = PI / 2; g.position.y = .0102 - .002 * k; Z.add(g); }
  for (let k = 0; k < ns; k++) { const a = k / ns * 2 * PI + PI / 2, sc = capScrew(.006, metal('chrome', 'Viteria'), darkMat()); sc.position.set(Math.cos(a) * sr, o.stile === 'raggi' || o.stile === 'forato' ? .0085 : .005, Math.sin(a) * sr); Z.add(sc); }
  return G;
}
registerPro('coperchio_motore', { n: 'Coperchio motore', cat: 'Motore', type: 'engine', b: 'Kuryakyn, Performance Machine, Arlen Ness', p: 399, build: buildCover,
  opts: [sel('tipo', 'Coperchio', [['puntine', 'Coperchio puntine (accensione)'], ['derby', 'Coperchio frizione (derby)']], 'derby'), sel('stile', 'Disegno', [['liscio', 'Liscio bombato'], ['punta', 'Tornito a punta'], ['raggi', 'A raggi'], ['forato', 'Forato'], ['cerchi', 'Cerchi fresati']], 'liscio'), sel('finitura', 'Finitura', FIN_METAL, 'chrome'), sel('lato', 'Lato', [['sinistro', 'Sinistro (primaria)'], ['destro', 'Destro (accensione)']], 'sinistro')] });

/* ====================================== TAPPI SERBATOIO ====================================== */
function buildCap(o) {
  const G = new THREE.Group(), cm = metal(o.finitura, 'Tappo');
  const ring = mesh(lathe([[.03, -.003], [.036, -.003], [.037, 0], [.036, .002], [.03, .003]], 96, .0006), cm); G.add(ring);
  if (o.stile === 'pop-up') { G.add(mesh(lathe([[0, 0], [.031, 0], [.033, .004], [.031, .009], [.022, .015], [0, .017]], 96, .0012), cm)); const h = mesh(new THREE.CylinderGeometry(.004, .004, .016, 16), cm); h.rotation.x = PI / 2; h.position.set(-.033, .004, 0); G.add(h); }
  else if (o.stile === 'a filo') { G.add(mesh(lathe([[0, 0], [.029, 0], [.03, .0025], [.028, .003], [0, .003]], 96, .0006), cm)); for (let k = 0; k < 8; k++) { const a = k / 8 * 2 * PI, s = capScrew(.0042, metal('chrome', 'Viteria'), darkMat()); s.position.set(Math.cos(a) * .0333, .002, Math.sin(a) * .0333); G.add(s); } }
  else if (o.stile === 'zigrinato') { const kn = cm.clone(); kn.normalMap = T.knurl(); kn.normalMap.repeat.set(10, 1); kn.normalScale = new THREE.Vector2(1, 1); G.add(mesh(lathe([[0, 0], [.028, 0], [.028, .016], [.025, .02], [0, .021]], 96, .0012), kn)); }
  else if (o.stile === 'monza') { G.add(mesh(lathe([[0, 0], [.03, 0], [.031, .006], [.028, .008], [0, .008]], 96, .001), cm)); const lev = mesh(new RoundedBoxGeometry(.03, .006, .014, 3, .0025), cm); lev.position.set(.018, .011, 0); lev.rotation.z = .12; G.add(lev); const hg = mesh(new THREE.CylinderGeometry(.005, .005, .02, 16), cm); hg.rotation.x = PI / 2; hg.position.set(-.031, .006, 0); G.add(hg); }
  else if (o.stile === 'aeronautico') { G.add(mesh(lathe([[0, 0], [.031, 0], [.031, .007], [.027, .009], [0, .009]], 96, .001), cm)); for (let k = 0; k < 12; k++) { const a = k / 12 * 2 * PI, h = mesh(new THREE.CircleGeometry(.0022, 16), darkMat('Fori')); h.rotation.x = -PI / 2; h.position.set(Math.cos(a) * .022, .0091, Math.sin(a) * .022); G.add(h); } const lv = mesh(tubeAlong(bentPath([V3(-.012, .01, 0), V3(.0, .016, 0), V3(.016, .011, 0)], .006), .003, 30, 10), cm); G.add(lv); }
  else { G.add(mesh(lathe([[0, 0], [.03, 0], [.03, .01], [.026, .013], [0, .014]], 96, .0012), cm)); for (let k = 0; k < 6; k++) { const a = k / 6 * 2 * PI, f = mesh(new RoundedBoxGeometry(.012, .004, .003, 2, .001), cm); f.position.set(Math.cos(a) * .018, .015, Math.sin(a) * .018); f.rotation.y = -a; G.add(f); } }
  return G;
}
registerPro('tappo_serbatoio', { n: 'Tappo serbatoio', cat: 'Serbatoi', type: 'tank', b: 'Kustom Tech, Joker Machine, RSD, Monza', p: 1193, build: buildCap,
  opts: [sel('stile', 'Modello', [['pop-up', 'Pop-up'], ['a filo', 'A filo con viti'], ['zigrinato', 'Zigrinato vintage'], ['monza', 'Monza a leva'], ['aeronautico', 'Aeronautico'], ['sfiato', 'Con alette']], 'pop-up'), sel('finitura', 'Finitura', FIN_METAL, 'chrome')] });

/* ====================================== FANALINI POSTERIORI ====================================== */
function buildTail(o) {
  const G = new THREE.Group(), Y = new THREE.Group(); Y.rotation.z = PI / 2; G.add(Y); // lente verso -x (indietro)
  const fm = metal(o.finitura, 'Corpo fanale'), lm = lens(o.lente === 'fume' ? 'fume' : 'rossa', 'Lente');
  if (o.stile === 'cat eye') { const sh = shapeFrom(smoothClosed([[.06, 0], [.03, .025], [-.02, .03], [-.065, .012], [-.07, 0], [-.065, -.012], [-.02, -.03], [.03, -.025]], 120));
    const body = mesh(new THREE.ExtrudeGeometry(sh, { depth: .012, bevelEnabled: true, bevelThickness: .008, bevelSize: .004, bevelSegments: 6, curveSegments: 64 }), fm); body.rotation.x = -PI / 2; body.position.y = -.024; Y.add(body);
    const ln = mesh(new THREE.ExtrudeGeometry(shapeFrom(smoothClosed([[.05, 0], [.025, .019], [-.02, .023], [-.056, .009], [-.06, 0], [-.056, -.009], [-.02, -.023], [.025, -.019]], 120)), { depth: .004, bevelEnabled: true, bevelThickness: .004, bevelSize: .002, bevelSegments: 5, curveSegments: 64 }), lm); ln.rotation.x = -PI / 2; ln.position.y = -.004; Y.add(ln); }
  else if (o.stile === 'lucas') { Y.add(mesh(lathe([[0, -.04], [.03, -.038], [.042, -.025], [.045, 0], [.044, .003]], 96, .002), fm)); Y.add(mesh(lathe([[.0415, 0], [.0415, .006], [.035, .015], [.02, .02], [0, .022]], 96, .002), lm));
    const visor = mesh(lathe([[.046, 0], [.047, .02], [.045, .024]], 64, .001, PI * 1.5 - 1.2, 2.4), fm); Y.add(visor); const win = mesh(new RoundedBoxGeometry(.04, .01, .02, 2, .003), lens('chiara', 'Luce targa')); win.position.set(.047, -.012, 0); Y.add(win); }
  else if (o.stile === 'beehive') { const pr = [[0, -.03], [.03, -.03], [.038, -.02], [.04, 0]]; Y.add(mesh(lathe(pr, 96, .002), fm)); const lp = [[.039, 0]]; for (let k = 0; k < 6; k++) { const y = k * .0045; lp.push([.038 - k * .0055, y], [.038 - k * .0055, y + .0035]); } lp.push([0, .029]); Y.add(mesh(lathe(lp, 96, .0008), lm)); }
  else if (o.stile === 'barra LED') { const b = mesh(new RoundedBoxGeometry(.016, .022, .16, 3, .005), fm); b.position.y = -.008; Y.add(b); const ln = mesh(new RoundedBoxGeometry(.006, .014, .15, 2, .003), lm); ln.position.set(0, .004, 0); Y.add(ln); }
  else if (o.stile === 'rettangolare') { const b = mesh(new RoundedBoxGeometry(.06, .03, .1, 4, .008), fm); b.position.y = -.016; Y.add(b); const ln = mesh(new RoundedBoxGeometry(.05, .01, .088, 3, .004), lm); ln.position.y = .002; Y.add(ln); }
  else { Y.add(mesh(lathe([[0, -.02], [.02, -.02], [.024, -.012], [.025, 0]], 64, .0015), fm)); Y.add(mesh(lathe([[.024, 0], [.024, .004], [.016, .012], [0, .015]], 64, .0015), lm)); }
  const stud = threadedRod(.004, .022, .00125, metal('chrome', 'Stelo e dado')); stud.position.y = o.stile === 'barra LED' || o.stile === 'rettangolare' ? -.03 : -.05; Y.add(stud);
  return G;
}
registerPro('fanalino', { n: 'Fanalino posteriore', cat: 'Luci', type: 'light', b: 'Kellermann, Highsider, Lowbrow, Biltwell', p: 163, build: buildTail,
  opts: [sel('stile', 'Modello', [['cat eye', 'Cat eye'], ['lucas', 'Vintage con visiera'], ['beehive', 'Beehive (a nido d\'ape)'], ['barra LED', 'Barra LED'], ['rettangolare', 'Rettangolare'], ['mini', 'Mini tondo']], 'cat eye'), sel('finitura', 'Corpo', FIN_METAL, 'chrome'), sel('lente', 'Lente', [['rossa', 'Rossa'], ['fume', 'Fumé']], 'rossa')] });
