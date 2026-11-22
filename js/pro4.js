/* NJ.D' RIDE – Libreria PRO (4): ciclistica – cerchi e pneumatici, parafanghi, ammortizzatori, paramotore, strumenti, parabrezza, portapacchi, soffietti, griglie faro.
   © 2026 dott. Jonathan D'Eugenio – Tutti i diritti riservati (L. 633/1941). Tipologie generiche, nessun logo né disegno protetto. */
import * as THREE from 'three';
import { H, registerPro, PRO_DEFS, FIN_METAL, PAINT_TYPE } from './pro.js';
import { shell, patch, orient, gauge, screenMat, SCREEN_COL } from './pro3.js';
const { mesh, lathe, bentPath, tubeAlong, hexPrism, capScrew, buttonScrew, shapeFrom, roundRect, extrudeShape, smoothClosed, metal, lens, paint, rubber, darkMat, T, V3, IN, PI, sstep, clamp, sel, num, col, YN, RoundedBoxGeometry } = H;
const PAINT_DEF = '#111111';

/* ---------- battistrada: rilievo procedurale per disegno (mappa delle normali + ombra nei solchi + micro-rugosità della mescola) ---------- */
const TT = {};
const smt = (e0, e1, x) => { const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };
const tri = u => 1 - 4 * Math.abs((((u % 1) + 1) % 1) - .5);                 // onda triangolare in [-1, 1]
const gro = (d, w) => smt(w * .55, w, Math.abs(d));                             // solco: 0 dentro, 1 fuori, bordo morbido
const fr = x => x - Math.floor(x);
/* rilievo: u = posizione lungo la circonferenza (un passo del disegno), s = posizione trasversale (-1 spalla sinistra … +1 spalla destra) */
const PATTERN = {
  coste: (u, s) => Math.min(gro(s, .03), gro(s - .38, .04), gro(s + .38, .04), gro(s - .74, .04), gro(s + .74, .04)),
  coste_zigzag: (u, s) => { let h = 1; for (const [g, a] of [[0, .05], [.36, .06], [-.36, .06], [.72, .05], [-.72, .05]]) h = Math.min(h, gro(s - g - a * tri(u * 6 + (g > 0 ? .25 : g < 0 ? .75 : 0)), .035)); return h; },
  blocchi: (u, s) => { const a = Math.abs(s); let h = gro(s - .05 * tri(u * 6), .04);
    if (a > .14) { const uu = fr(u * 6 + (a > .55 ? .5 : 0) + (s < 0 ? .25 : 0)); h = Math.min(h, gro(uu - .5, .09), gro(a - .55, .035)); } return h; },
  touring: (u, s) => { const a = Math.abs(s); if (a < .1) return gro(s, .025); return gro(fr(u * 5 - Math.sign(s) * .45 * a + (s < 0 ? .5 : 0)) - .5, .045 + .02 * a); },
  onde: (u, s) => Math.min(gro(s - .32 - .1 * Math.sin(u * 2 * PI * 4), .045), gro(s + .32 + .1 * Math.sin(u * 2 * PI * 4 + PI), .045), gro(Math.abs(s) - .7 - .07 * Math.sin(u * 2 * PI * 8), .035)),
  piume: (u, s) => { const a = Math.abs(s); if (a < .06) return 1; const sg = Math.sign(s); let h = gro(fr(u * 5 - sg * (.18 * a + .55 * a * a)) - .5, .035 + .03 * a);
    if (a > .25 && a < .8) h = Math.min(h, Math.max(gro(fr(u * 10 - sg * .3 * a + .25) - .5, .02), smt(.26, .3, Math.abs(a - .52)))); return h; },
  slick: (u, s) => gro(s, .008),
  tassellato: (u, s) => { const a = Math.abs(s), ku = fr(u * 4), kv = fr(a * 2.2 + (Math.floor(fr(u) * 4) % 2 ? .25 : 0)); return ku > .18 && ku < .82 && kv > .15 && kv < .85 ? 1 : 0; }
};
PATTERN.stradale = PATTERN.touring;
/* v0, v1: tratto del profilo coperto dal battistrada (0 = tallone sinistro, 1 = tallone destro) */
function treadTex(kind, v0 = .3, v1 = .7) {
  const key = kind + '|' + Math.round(v0 * 400) + '|' + Math.round(v1 * 400); if (TT[key]) return TT[key];
  const W = 256, HH = 512, Hf = new Float32Array(W * HH), pat = PATTERN[kind] || PATTERN.touring; let seed = 1234567;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let y = 0; y < HH; y++) { const v = 1 - (y + .5) / HH, inT = v > v0 && v < v1, s = inT ? (v - v0) / (v1 - v0) * 2 - 1 : 0, edge = inT ? smt(0, .02, Math.min(v - v0, v1 - v)) : 0;
    const ring = Math.min(gro(v - .05, .004), gro(v - .95, .004));            // linea di centraggio stampata vicino al cerchio
    for (let x = 0; x < W; x++) { const u = (x + .5) / W; let h = inT ? 1 - edge * (1 - pat(u, s)) : .92 + .08 * ring;
      Hf[y * W + x] = h + (rnd() - .5) * (inT ? .06 : .03); } }
  const cN = document.createElement('canvas'), cA = document.createElement('canvas'); cN.width = cA.width = W; cN.height = cA.height = HH;
  const gN = cN.getContext('2d'), gA = cA.getContext('2d'), iN = gN.createImageData(W, HH), iA = gA.createImageData(W, HH), K = kind === 'tassellato' ? 4.5 : 2.8;
  for (let y = 0; y < HH; y++) for (let x = 0; x < W; x++) { const i = y * W + x, o = i * 4;
    const dx = (Hf[y * W + (x + 1) % W] - Hf[y * W + (x - 1 + W) % W]) * K, dy = (Hf[Math.min(HH - 1, y + 1) * W + x] - Hf[Math.max(0, y - 1) * W + x]) * K, l = Math.hypot(dx, dy, 1);
    iN.data[o] = (-dx / l * .5 + .5) * 255; iN.data[o + 1] = (dy / l * .5 + .5) * 255; iN.data[o + 2] = (1 / l * .5 + .5) * 255; iN.data[o + 3] = 255;
    const a = 140 + 115 * Math.max(0, Math.min(1, Hf[i])); iA.data[o] = iA.data[o + 1] = iA.data[o + 2] = a; iA.data[o + 3] = 255; }
  gN.putImageData(iN, 0, 0); gA.putImageData(iA, 0, 0);
  const n = new THREE.CanvasTexture(cN), al = new THREE.CanvasTexture(cA); al.colorSpace = THREE.SRGBColorSpace;
  for (const t of [n, al]) { t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.ClampToEdgeWrapping; t.anisotropy = 8; }
  return (TT[key] = { n, al });
}

/* ---------- sezione reale del pneumatico ---------- */
/* Rr raggio della sede del tallone, Wt larghezza di sezione, Ht altezza di sezione, Wr larghezza del cerchio (metri).
   Tallone → fianco (curva a S fino alla larghezza massima) → corona a superellisse (più piatta sulle gomme larghe e ribassate). */
export function tyreSection(Rr, Wt, Ht, Wr, disegno, off = 0) {
  const ser = Ht / Wt, slick = disegno === 'slick';
  const e1 = slick ? .32 : ser >= .85 ? .78 : ser >= .65 ? .68 : ser >= .5 ? .6 : .5, e2 = slick ? .55 : .75;
  const hm = (ser >= .85 ? .5 : ser >= .6 ? .42 : .36) * Ht, rc = Rr + hm, bead = Math.max(.02, Math.min(Wr / 2 - .004, Wt / 2 - .006));
  const tw = (slick ? .97 : ser >= .85 ? .8 : .88) * Wt / 2;
  const bz = (p0, p1, p2, p3, t) => { const a = 1 - t; return a * a * a * p0 + 3 * a * a * t * p1 + 3 * a * t * t * p2 + t * t * t * p3; };
  const side = sg => { const L = []; for (let i = 0; i <= 16; i++) { const t = i / 16; L.push([bz(Rr, Rr + hm * .5, rc - hm * .45, rc, t), sg * bz(bead, bead, Wt / 2, Wt / 2, t)]); } return L; };
  const P = [[Rr - .004, -bead - .002], ...side(-1)];
  const NC = 64; for (let i = 1; i < NC; i++) { const a = -PI / 2 + PI * i / NC, c = Math.cos(a), sn = Math.sin(a); P.push([rc + (Ht - hm) * Math.pow(c, e1), Math.sign(sn) * Math.pow(Math.abs(sn), e2) * Wt / 2]); }
  P.push(...side(1).reverse(), [Rr - .004, bead + .002]);
  const V = [0]; for (let i = 1; i < P.length; i++) V.push(V[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1])); const Lt = V[V.length - 1]; for (let i = 0; i < V.length; i++) V[i] /= Lt;
  let t0 = -1, t1 = -1; for (let i = 18; i < P.length - 18; i++) if (Math.abs(P[i][1]) <= tw) { if (t0 < 0) t0 = i; t1 = i; }
  P.forEach(p => p[1] += off);
  return { P, V, v0: V[Math.max(0, t0)], v1: V[Math.max(0, t1)], Rt: Rr + Ht, tw };
}
/* lathe di un tratto del profilo, con la coordinata v della texture presa dalla lunghezza d'arco dell'intero profilo */
function latheV(P, V, j0, j1, seg) {
  const pts = []; for (let j = j0; j <= j1; j++) pts.push(new THREE.Vector2(Math.max(0, P[j][0]), P[j][1]));
  const g = new THREE.LatheGeometry(pts, seg), uv = g.attributes.uv, n = j1 - j0 + 1; for (let i = 0; i < uv.count; i++) uv.setY(i, V[j0 + (i % n)]); return g;
}
const TYRE_DIS = [['touring', 'Touring (scanalature diagonali)'], ['onde', 'Onde'], ['piume', 'Piume / spirale'], ['coste', 'Coste longitudinali'], ['coste_zigzag', 'Coste a zig-zag (anni \'40-\'50)'], ['blocchi', 'Blocchetti universali'], ['slick', 'Quasi liscio (drag)'], ['tassellato', 'Tassellato']];
/* misura del pneumatico: «130/60B21», «240/40VR18», «MH90-21», «5.00-16» → larghezza e altezza di sezione (mm) e cerchio (pollici) */
const ALFA = { MH90: [80, 90], MJ90: [90, 90], MM90: [100, 90], MN90: [110, 90], MP90: [120, 90], MR90: [130, 90], MT90: [130, 90], MU90: [140, 90], MV85: [150, 85], MU85: [140, 90] };
function misura(str) { if (!str) return null; const s = String(str).toUpperCase(); let m;
  if ((m = s.match(/^(\d{2,3})\/(\d{2})\s*(?:ZR|VR|R|B|-)?\s*-?(\d{2})/))) return { w: +m[1], h: +m[1] * +m[2] / 100, rim: +m[3] };
  if ((m = s.match(/^(M[A-Z])(\d{2})\s*(?:B|R)?-?(\d{2})/))) { const e = ALFA[m[1] + m[2]] || [130, 90]; return { w: e[0], h: e[0] * e[1] / 100, rim: +m[3] }; }
  if ((m = s.match(/^(\d\.\d{2})-(\d{2})/))) { const w = +m[1] * 25.4; return { w, h: w, rim: +m[2] }; }
  return null; }

/* =============================== CERCHI E PNEUMATICI =============================== */
/* tutte le misure in metri, poi la ruota si scala con __k (unità del modello per metro) per avere le proporzioni reali della moto */
const RIM_R = { '16': .2032, '17': .2159, '18': .2286, '19': .2413, '21': .2667, '23': .2921 };
function buildWheel(o) {
  const G = new THREE.Group(), A = new THREE.Group(); A.rotation.x = PI / 2; G.add(A); // asse ruota = z
  const k = +o.__k || 1, T = misura(o.misura), rimIn = T ? T.rim : +o.diametro || 18;
  const Rr = o.__Rr ? o.__Rr / k : (RIM_R[String(rimIn)] || rimIn * .0127);
  let Wt, Ht; if (T) { Wt = T.w / 1000; Ht = T.h / 1000; } else { Wt = (+o.gomma || 130) / 1000; Ht = Math.min(.13, Wt * (Wt > .16 ? .55 : Wt > .12 ? .7 : .9)); }
  if (o.__Rt) Ht = Math.max(.03, o.__Rt / k - Rr);
  const can = +o.canale || (T ? (T.w <= 100 ? 2.15 : T.w <= 130 ? 3 : T.w <= 150 ? 3.5 : T.w <= 180 ? 5 : T.w <= 200 ? 6 : T.w <= 260 ? 8.5 : 10.5) : 0);
  const Wr = can ? can * .0254 + .014 : Math.max(.065, Wt * .72), off = (+o.offset || 0) / 1000, dis = o.disegno || (o.battistrada === 'tassellato' ? 'tassellato' : 'touring');
  const onlyRim = o.parte === 'cerchio', onlyTyre = o.parte === 'gomma'; // scelta singola: solo cerchio o solo pneumatico
  G.userData.Rr = Rr * k; G.userData.Rt = (Rr + Ht) * k; G.userData.pivotL = new THREE.Vector3(); G.userData.dim = { rimIn, canale: can || null, Wt: Math.round(Wt * 1000), Ht: Math.round(Ht * 1000), offset: Math.round(off * 1000), D: Math.round((Rr + Ht) * 2000) };
  if (!onlyRim) {
    const S = tyreSection(Rr, Wt, Ht, Wr, dis, off), tex = treadTex(dis, S.v0, S.v1), N = Math.max(8, Math.round(2 * PI * S.Rt / .11));
    const nm = tex.n.clone(), am = tex.al.clone(); for (const t of [nm, am]) { t.repeat.set(N, 1); t.needsUpdate = true; }
    const tm = new THREE.MeshPhysicalMaterial({ name: 'Pneumatico', color: 0x18181a, map: am, roughness: .84, normalMap: nm, normalScale: new THREE.Vector2(dis === 'tassellato' ? 2 : 1.2, dis === 'tassellato' ? 2 : 1.2), sheen: .35, sheenRoughness: .85, sheenColor: new THREE.Color(0x2b2b2b) });
    const seg = 192, P = S.P, V = S.V, last = P.length - 1;
    // fascia bianca: larghezza in mm lungo il fianco, a partire da poco sopra il bordo del cerchio
    const fw = o.fianco === 'bianco' ? Math.min(+o.fascia || (Ht > .1 ? 45 : 25), Ht * 550) / 1000 : 0;
    if (fw) { const r0 = Rr + Math.max(.012, Ht * .12), r1 = r0 + fw; let a = 1, b = 1; while (a < last / 2 && P[a][0] < r0) a++; b = a; while (b < last / 2 && P[b][0] < r1) b++;
      const wm = new THREE.MeshPhysicalMaterial({ name: 'Fascia bianca', color: 0xf0ede4, roughness: .6, sheen: .2, sheenRoughness: .9, sheenColor: new THREE.Color(0xffffff) });
      for (const [j0, j1, m] of [[0, a, tm], [a, b, wm], [b, last - b, tm], [last - b, last - a, wm], [last - a, last, tm]]) A.add(mesh(latheV(P, V, j0, j1, seg), m)); }
    else A.add(mesh(latheV(P, V, 0, last, seg), tm));
  }
  if (onlyTyre) return G.scale.setScalar(k), G;
  // cerchio (canale Wr, sposta con l'offset)
  const rm = metal(o.finitura, 'Cerchio');
  A.add(mesh(lathe([[Rr - .016, -Wr / 2 + .004], [Rr - .004, -Wr / 2], [Rr + .007, -Wr / 2 - .003], [Rr + .009, -Wr / 2 + .002], [Rr - .002, -Wr / 2 + .008], [Rr - .012, -Wr / 4], [Rr - .015, 0], [Rr - .012, Wr / 4], [Rr - .002, Wr / 2 - .008], [Rr + .009, Wr / 2 - .002], [Rr + .007, Wr / 2 + .003], [Rr - .004, Wr / 2], [Rr - .016, Wr / 2 - .004], [Rr - .02, 0], [Rr - .016, -Wr / 2 + .004]].map(p => [p[0], p[1] + off]), 180, .001), rm));
  // mozzo (resta sull'asse)
  const hm = metal(o.mozzo || o.finitura, 'Mozzo'), hw = .13;
  A.add(mesh(lathe([[.012, -hw / 2], [.03, -hw / 2], [.034, -hw / 2 + .006], [.04, -hw / 2 + .012], [.075, -hw / 2 + .016], [.077, -hw / 2 + .024], [.042, -hw / 2 + .03], [.036, 0], [.042, hw / 2 - .03], [.077, hw / 2 - .024], [.075, hw / 2 - .016], [.04, hw / 2 - .012], [.034, hw / 2 - .006], [.03, hw / 2], [.012, hw / 2]], 96, .0015), hm));
  const ax = mesh(lathe([[0, -hw / 2 - .012], [.012, -hw / 2 - .012], [.012, hw / 2 + .012], [0, hw / 2 + .012]], 32, .001), metal('chrome', 'Perno ruota')); A.add(ax);
  for (const s of [1, -1]) { const nt = mesh(hexPrism(.03, .012, .011), metal('chrome', 'Dado perno')); nt.position.y = s * (hw / 2 + .012); A.add(nt); }
  const t = o.tipo;
  if (t === 'raggi') {
    const sm = metal(o.finitura_raggi || 'chrome', 'Raggi'), nm = metal('chrome', 'Nippli'), n = 40, cyl = new THREE.CylinderGeometry(.0019, .0019, 1, 6, 1, true), nip = new THREE.CylinderGeometry(.0034, .0034, .014, 8);
    const IS = new THREE.InstancedMesh(cyl, sm, n), IN2 = new THREE.InstancedMesh(nip, nm, n), M = new THREE.Matrix4(), q = new THREE.Quaternion();
    for (let k2 = 0; k2 < n; k2++) { const s = k2 % 2 ? 1 : -1, ar = k2 * 2 * PI / n, dir = (Math.floor(k2 / 2) % 2) ? 1 : -1, ah = ar + dir * .92;
      const pr = V3(Math.cos(ar) * (Rr - .016), s * .006 + off, Math.sin(ar) * (Rr - .016)), ph = V3(Math.cos(ah) * .07, s * (hw / 2 - .02), Math.sin(ah) * .07), d = pr.clone().sub(ph), L = d.length();
      q.setFromUnitVectors(V3(0, 1, 0), d.normalize()); M.compose(ph.clone().lerp(pr, .5), q, V3(1, L, 1)); IS.setMatrixAt(k2, M); M.compose(pr.clone().addScaledVector(d, -.005), q, V3(1, 1, 1)); IN2.setMatrixAt(k2, M); }
    IS.castShadow = true; A.add(IS); A.add(IN2);
  } else if (t === 'lenticolare') {
    const dm = metal(o.finitura, 'Lenticolare'); for (const s of [1, -1]) A.add(mesh(lathe([[.04, s * .03], [.1, s * .026 + off * .3], [Rr * .7, s * .018 + off * .7], [Rr - .018, s * .006 + off]].sort((a, b) => s * (a[1] - b[1])), 160, .002), dm));
  } else {
    const ns = t === 'razze9' ? 9 : t === 'razze3' ? 3 : 5, Ro = Rr - .016, Ri = .06, sh = new THREE.Shape(); sh.absarc(0, 0, Ro, 0, 2 * PI, false);
    const hole = new THREE.Path(); hole.absarc(0, 0, .03, 0, 2 * PI, true); sh.holes.push(hole);
    const spw = ns === 9 ? .1 : ns === 3 ? .32 : .2;
    for (let k2 = 0; k2 < ns; k2++) { const a0 = k2 * 2 * PI / ns + spw * .5 + .02, a1 = (k2 + 1) * 2 * PI / ns - spw * .5 - .02, p = new THREE.Path(), r1 = Ro - .016, r0 = Ri + .02;
      p.moveTo(Math.cos(a0) * r0, Math.sin(a0) * r0); p.absarc(0, 0, r1, a0 + .015, a1 - .015, false); p.lineTo(Math.cos(a1) * r0, Math.sin(a1) * r0); p.absarc(0, 0, r0, a1, a0, true); sh.holes.push(p); }
    const cg = extrudeShape(sh, .035, .006, 4, 96); cg.translate(0, 0, -.0175); cg.rotateX(PI / 2); cg.translate(0, off, 0); const cm = metal(o.finitura, 'Cerchio in lega'); A.add(mesh(cg, o.finitura === 'contrast' ? [cm, metal('bright', 'Fresature')] : cm));
  }
  if (o.disco !== 'no') { const dsk = new THREE.Group(), r0 = .085, r1 = Rr > .25 ? .16 : .145;
    dsk.add(mesh(lathe([[r0, -.0025], [r1, -.0025], [r1 + .0005, 0], [r1, .0025], [r0, .0025]], 128, .0004), metal('brushed', 'Disco freno')));
    const hm2 = new THREE.InstancedMesh(new THREE.CylinderGeometry(.0032, .0032, .0056, 12), darkMat('Fori disco'), 36), M = new THREE.Matrix4(); for (let k2 = 0; k2 < 36; k2++) { const a = k2 * 2 * PI / 36, rr = r0 + .018 + (k2 % 3) * .012 + (r1 - r0 - .06) * .5; M.makeTranslation(Math.cos(a) * rr, 0, Math.sin(a) * rr); hm2.setMatrixAt(k2, M); } dsk.add(hm2);
    const car = mesh(new RoundedBoxGeometry(.075, .04, .05, 4, .012), metal(o.pinza || 'gloss', 'Pinza freno')); car.position.set(Math.cos(-2.3) * (r1 - .012), .026, Math.sin(-2.3) * (r1 - .012)); car.rotation.y = 2.3 + PI / 2; dsk.add(car);
    dsk.position.y = hw / 2 - .006; A.add(dsk); }
  G.scale.setScalar(k); return G;
}
registerPro('cerchio', { n: 'Ruota completa (cerchio + pneumatico)', cat: 'Ruote', type: 'wheel', b: 'Performance Machine, RC Components, Excel, Borrani style', p: 563, build: buildWheel,
  opts: [sel('tipo', 'Cerchio', [['raggi', 'A raggi (40)'], ['razze5', 'In lega 5 razze'], ['razze9', 'In lega 9 razze'], ['razze3', 'In lega 3 razze'], ['lenticolare', 'Lenticolare']], 'raggi'), sel('diametro', 'Diametro', [['16', '16"'], ['17', '17"'], ['18', '18"'], ['19', '19"'], ['21', '21"'], ['23', '23"']], '18'),
    sel('gomma', 'Larghezza pneumatico', [['90', '90 mm'], ['100', '100 mm'], ['130', '130 mm'], ['150', '150 mm'], ['180', '180 mm'], ['200', '200 mm'], ['240', '240 mm'], ['260', '260 mm'], ['300', '300 mm']], '130'),
    sel('disegno', 'Disegno battistrada', TYRE_DIS, 'touring'), sel('fianco', 'Fianco', [['nero', 'Nero'], ['bianco', 'Fascia bianca']], 'nero'),
    sel('canale', 'Canale cerchio', [['', 'Automatico'], ['2.15', '2,15"'], ['2.5', '2,5"'], ['3', '3,0"'], ['3.5', '3,5"'], ['4.5', '4,5"'], ['5.5', '5,5"'], ['6', '6,0"'], ['8', '8,0"'], ['8.5', '8,5"'], ['10.5', '10,5"']], ''),
    sel('offset', 'Offset cerchio sul mozzo', [['0', 'Centrato'], ['-10', '10 mm a sinistra'], ['10', '10 mm a destra'], ['-20', '20 mm a sinistra'], ['20', '20 mm a destra']], '0'),
    sel('finitura', 'Finitura cerchio', FIN_METAL, 'chrome'), sel('finitura_raggi', 'Raggi', FIN_METAL, 'chrome'), sel('mozzo', 'Mozzo', FIN_METAL, 'chrome'), sel('disco', 'Disco freno', YN, 'si'), sel('pinza', 'Pinza', FIN_METAL, 'gloss')] });

/* =============================== PARAFANGHI =============================== */
const FEND = { // [phi0, phi1] gradi (0 = avanti, 90 = alto), valance, n
  posteriore: { bobber: [78, 172, .03], ribbed: [78, 172, .03], cafe: [85, 150, .02], vintage: [58, 222, .085], mini: [92, 140, .015], tracker: [95, 160, .01] },
  anteriore: { bobber: [42, 118, .025], ribbed: [42, 118, .025], cafe: [55, 112, .02], vintage: [5, 140, .08], mini: [60, 108, .015], tracker: [60, 120, .01] }
};
function buildFender(o) {
  const G = new THREE.Group(), pos = o.posizione === 'anteriore' ? 'anteriore' : 'posteriore', [p0, p1, val] = FEND[pos][o.stile] || FEND[pos].bobber;
  const R = (RIM_R[o.diametro] || .2286) + (o.diametro === '21' || o.diametro === '23' ? .085 : .105) + .025, W = { stretta: .12, media: .16, larga: .21, extra: .26 }[o.larghezza] || .16, n = o.stile === 'tracker' ? 3 : 2.4, crown = .02 + W * .06;
  const rib = o.stile === 'ribbed' ? .006 : 0, tip = o.stile === 'tracker' || o.stile === 'cafe';
  const fn = (u, v) => { const ph = (p0 + (p1 - p0) * u) * PI / 180, th = v * PI, sn = Math.sin(th), cs = Math.cos(th);
    let rad = R - val + (val + crown) * Math.pow(Math.max(0, sn), 2 / n) + rib * Math.exp(-Math.pow((th - PI / 2) / .06, 2));
    if (tip) rad += .012 * sstep(.7, 1, pos === 'anteriore' ? 1 - u : u);
    const z = W / 2 * Math.sign(cs) * Math.pow(Math.abs(cs), 2 / n); return V3(Math.cos(ph) * rad, Math.sin(ph) * rad, z); };
  const S = shell(fn, 120, 60, { thick: .0025 }); const pm = paint(o.colore, o.vernice, 'Vernice parafango'), im = o.interno === 'tinta' ? pm : new THREE.MeshPhysicalMaterial({ name: 'Interno parafango', color: 0x111111, roughness: .7 });
  G.add(mesh(S.geo, [pm, im]));
  const sm = metal(o.finitura, 'Staffe parafango');
  if (pos === 'anteriore') { for (const s of [1, -1]) { const a = fn(.62, s > 0 ? 0 : 1), b = V3(0, 0, s * (W / 2 + .03)); const st = mesh(tubeAlong(bentPath([a.clone().add(V3(0, 0, s * .004)), a.clone().lerp(b, .5).add(V3(.02, 0, s * .018)), b], .04), .0055, 60, 12), sm); G.add(st);
      const tab = mesh(new RoundedBoxGeometry(.04, .03, .008, 2, .003), sm); tab.position.copy(b); G.add(tab); } }
  else if (o.montanti !== 'no') for (const s of [1, -1]) { const a = fn(.18, s > 0 ? 0 : 1), m2 = fn(.62, s > 0 ? 0 : 1), b = V3(-.02, .015, s * (W / 2 + .035));
    const st = mesh(tubeAlong(bentPath([a.clone().add(V3(0, 0, s * .006)), b.clone().add(V3(.04, .1, 0)), b, m2.clone().add(V3(0, 0, s * .006))].map((p, i) => i === 2 ? p : p), .05), .0068, 120, 14), sm); G.add(st); }
  if (pos === 'posteriore' && o.luce === 'si') { const e = fn(1, .5), tn = fn(.99, .5).sub(e).normalize(); const tl = PRO_DEFS.fanalino.build({ stile: 'mini', finitura: o.finitura === 'paint' ? 'gloss' : o.finitura, lente: 'rossa' }); tl.position.copy(fn(.9, .5)).add(V3(-.01, .0, 0)); tl.scale.setScalar(.85); G.add(tl);
    const lp = mesh(new RoundedBoxGeometry(.006, .012, .05, 2, .002), new THREE.MeshPhysicalMaterial({ name: 'Luce targa', color: 0xffffff, emissive: 0xffffff, emissiveIntensity: .6 })); lp.position.copy(e).add(V3(.004, .004, 0)); G.add(lp); }
  return G;
}
registerPro('parafango', { n: 'Parafango', cat: 'Parafanghi', type: 'fender', b: 'Kustom Tech, Lowbrow, Biltwell, Kraftwerk', p: 1229, build: buildFender,
  opts: [sel('posizione', 'Posizione', [['posteriore', 'Posteriore'], ['anteriore', 'Anteriore']], 'posteriore'), sel('stile', 'Stile', [['bobber', 'Bobber liscio'], ['ribbed', 'Bobber nervato (ribbed)'], ['cafe', 'Café corto'], ['vintage', 'Vintage avvolgente'], ['mini', 'Mini'], ['tracker', 'Tracker']], 'bobber'),
    sel('diametro', 'Ruota', [['16', '16"'], ['17', '17"'], ['18', '18"'], ['19', '19"'], ['21', '21"'], ['23', '23"']], '16'), sel('larghezza', 'Larghezza', [['stretta', 'Stretta (≤110)'], ['media', 'Media (130-150)'], ['larga', 'Larga (180-200)'], ['extra', 'Extra (240)']], 'media'),
    col('colore', 'Colore', PAINT_DEF), sel('vernice', 'Vernice', PAINT_TYPE, 'lucido'), sel('interno', 'Interno', [['nero', 'Nero'], ['tinta', 'In tinta']], 'nero'), sel('finitura', 'Staffe', FIN_METAL, 'gloss'), sel('montanti', 'Montanti posteriori', YN, 'si'), sel('luce', 'Fanalino integrato (post.)', YN, 'no')] });

/* =============================== AMMORTIZZATORI =============================== */
function shock(o, L) {
  const G = new THREE.Group(), bm = metal(o.corpo, 'Corpo ammortizzatore'), cm = metal('chrome', 'Stelo'), spm = o.colore_molla === 'cromata' ? metal('chrome', 'Molla') : paint(o.colore_molla, 'lucido', 'Molla'), dk = darkMat();
  const eye = (y, up) => { const e = new THREE.Group(); e.add(mesh(lathe([[.006, -.012], [.017, -.012], [.018, -.01], [.018, .01], [.017, .012], [.006, .012]], 40, .001), bm)); const bu = mesh(lathe([[.0055, -.0125], [.0085, -.0125], [.0085, .0125], [.0055, .0125]], 24, .0005), rubber('Silent block')); e.add(bu); e.rotation.x = PI / 2; e.position.y = y; G.add(e);
    const st = mesh(lathe([[0, 0], [.011, 0], [.012, .004], [.012, .02], [0, .02]], 32, .001), bm); st.position.y = up ? y - .032 : y + .012; G.add(st); };
  eye(0, false); eye(L, true);
  const bodyL = L * .48, rb = o.tipo === 'piggyback' ? .024 : .021;
  G.add(mesh(lathe([[0, .03], [rb * .8, .03], [rb, .036], [rb, .03 + bodyL], [rb * .9, .036 + bodyL], [.008, .04 + bodyL]], 64, .0015), bm));
  const rod = mesh(new THREE.CylinderGeometry(.0072, .0072, L * .42, 24), cm); rod.position.y = .04 + bodyL + L * .2; G.add(rod);
  const top = mesh(lathe([[0, L - .052], [.02, L - .052], [.026, L - .047], [.026, L - .036], [.016, L - .032], [0, L - .03]], 64, .001), bm); G.add(top);
  const y0 = .045 + bodyL * .35, y1 = L - .052, turns = 8, rc = .031, rw = .0058;
  const seat = mesh(lathe([[rb + .001, y0 - .008], [.04, y0 - .008], [.041, y0 - .004], [.04, y0], [rb + .001, y0]], 64, .0008), metal('brushed', 'Ghiera precarico')); G.add(seat);
  for (let k = 0; k < 6; k++) { const nt = mesh(new THREE.BoxGeometry(.004, .006, .004), dk); const a = k * PI / 3; nt.position.set(Math.cos(a) * .041, y0 - .004, Math.sin(a) * .041); G.add(nt); }
  if (o.tipo === 'coperto') { G.add(mesh(lathe([[.028, L * .38], [.04, L * .38], [.043, L * .4], [.043, L - .06], [.03, L - .045]], 64, .0015), metal(o.finitura_cover || 'chrome', 'Copertura molla')));
    G.add(mesh(lathe([[.026, .03], [.038, .035], [.038, L * .3], [.028, L * .32]], 64, .0015), metal(o.finitura_cover || 'chrome', 'Copertura inferiore'))); }
  else { const pts = []; const seg = turns * 36; for (let i = 0; i <= seg; i++) { const t = i / seg, a = t * turns * 2 * PI; let y = y0 + rw + (y1 - y0 - 2 * rw) * t; if (t < .06) y = y0 + rw + (y1 - y0) * .06 * sstep(0, .06, t) * .4; if (t > .94) y = y1 - rw - (y1 - y0) * .06 * sstep(1, .94, t) * .4; pts.push(V3(Math.cos(a) * rc, y, Math.sin(a) * rc)); }
    G.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), seg * 2, rw, 10), spm)); }
  if (o.tipo === 'piggyback') { const rv = new THREE.Group(); rv.add(mesh(lathe([[0, 0], [.017, 0], [.019, .004], [.019, .1], [.017, .104], [0, .104]], 48, .0012), bm)); rv.add(mesh(lathe([[0, .104], [.013, .104], [.013, .112], [0, .114]], 32, .001), metal('gold', 'Regolatore'))); rv.position.set(-.05, L - .17, 0); G.add(rv);
    const br = mesh(new RoundedBoxGeometry(.04, .022, .02, 2, .005), bm); br.position.set(-.028, L - .07, 0); G.add(br); }
  const adj = mesh(lathe([[0, 0], [.009, 0], [.009, .006], [0, .007]], 24, .001), metal('gold', 'Regolatore')); adj.rotation.z = PI / 2; adj.position.set(.024, .05, 0); G.add(adj);
  return G;
}
function buildShocks(o) {
  const G = new THREE.Group(), L = o.lunghezza * IN, inc = o.inclinazione * PI / 180;
  for (const s of [1, -1]) { const sh = shock(o, L); sh.rotation.z = -inc; sh.position.z = s * o.interasse / 2; G.add(sh); }
  return G;
}
registerPro('ammortizzatori', { n: 'Ammortizzatori posteriori (coppia)', cat: 'Sospensioni', type: 'shock', b: 'Öhlins, Progressive, YSS, Legend, Fox', p: 735, build: buildShocks,
  opts: [num('lunghezza', 'Interasse (pollici)', 10, 14, .5, 12, '"'), sel('tipo', 'Tipo', [['molla', 'Molla a vista'], ['piggyback', 'Con serbatoio piggyback'], ['coperto', 'Coperto stile touring']], 'molla'), col('colore_molla', 'Colore molla', '#b5121b'), sel('corpo', 'Corpo', FIN_METAL, 'gloss'), sel('finitura_cover', 'Copertura (touring)', FIN_METAL, 'chrome'),
    num('interasse', 'Distanza tra i due', .2, .34, .01, .27, 'm'), num('inclinazione', 'Inclinazione', 0, 35, 1, 18, '°')] });

/* =============================== PARAMOTORE =============================== */
function buildGuard(o) {
  const G = new THREE.Group(), fm = metal(o.finitura, 'Paramotore'), f = o.forma;
  let half, R;
  if (f === 'chubby') { half = [V3(.02, .04, 0), V3(.06, .04, .1), V3(.09, .02, .27), V3(.06, -.15, .35), V3(-.02, -.27, .26), V3(-.08, -.29, .1), V3(-.11, -.29, .06)]; R = .09; }
  else if (f === 'sport') { half = [V3(.02, .02, 0), V3(.05, .02, .1), V3(.06, -.02, .2), V3(.03, -.12, .23), V3(-.03, -.2, .16), V3(-.08, -.22, .07), V3(-.1, -.22, .06)]; R = .06; }
  else if (f === 'diamante') { half = [V3(.02, .03, 0), V3(.05, .03, .12), V3(.07, -.06, .3), V3(-.01, -.26, .2), V3(-.08, -.28, .08), V3(-.11, -.28, .06)]; R = .02; }
  else { half = [V3(.02, .03, 0), V3(.06, .03, .09), V3(.08, .06, .2), V3(.07, -.04, .31), V3(.01, -.2, .28), V3(-.07, -.28, .12), V3(-.11, -.28, .06)]; R = .07; }
  const P = [...half.slice().reverse().map(p => V3(p.x, p.y, -p.z)), ...half.slice(1)];
  G.add(mesh(tubeAlong(bentPath(P, R), .0159, 600, 28), fm));
  const cl = mesh(new RoundedBoxGeometry(.045, .05, .07, 3, .008), fm); cl.position.set(-.005, .03, 0); G.add(cl);
  for (const s of [1, -1]) { const sc = capScrew(.008, metal('chrome', 'Viteria'), darkMat()); sc.rotation.z = PI / 2; sc.position.set(.02, .03, s * .022); G.add(sc);
    const mt = mesh(new RoundedBoxGeometry(.04, .03, .03, 2, .006), fm); mt.position.copy(half[half.length - 1]).setZ(s * .06); G.add(mt); }
  if (o.pedane === 'si') for (const s of [1, -1]) { const p = half[f === 'diamante' ? 2 : 3].clone(); p.z *= s; const peg = PRO_DEFS.pedana.build({ tipo: o.tipo_pedane || 'gomma', finitura: o.finitura, lato: s > 0 ? 'destro' : 'sinistro' }); peg.position.copy(p).add(V3(.02, 0, s * .012)); G.add(peg); }
  return G;
}
registerPro('paramotore', { n: 'Paramotore', cat: 'Telaio', type: 'frame', b: 'Kuryakyn, Lindby, Kustom Tech, Highway Hawk', p: 1105, build: buildGuard,
  opts: [sel('forma', 'Forma', [['baffo', 'A baffo (mustache)'], ['chubby', 'Chubby'], ['sport', 'Sport compatto'], ['diamante', 'Diamante']], 'baffo'), sel('finitura', 'Finitura', FIN_METAL, 'chrome'), sel('pedane', 'Pedane autostradali', YN, 'no'), sel('tipo_pedane', 'Tipo pedane', [['gomma', 'Gomma'], ['diamante', 'Billet zigrinate'], ['barile', 'A barile']], 'gomma')] });

/* =============================== STRUMENTAZIONE =============================== */
function buildGauges(o) {
  const G = new THREE.Group(), nrm = V3(-1, .9, 0).normalize(), bm = metal(o.supporto, 'Staffa strumenti');
  const add = (r, kind, z) => { const g = gauge(r, kind, o.quadrante, o.ghiera, o.corpo || 'gloss'); orient(g, nrm); g.position.set(0, .05, z); G.add(g); return g; };
  if (o.tipo === 'doppio') { add(.04, 'kmh', -.046); add(.04, 'giri', .046); const br = mesh(new RoundedBoxGeometry(.03, .006, .2, 2, .002), bm); br.position.set(.012, .022, 0); br.rotation.z = -.4; G.add(br); }
  else if (o.tipo === 'digitale') { const b = mesh(new RoundedBoxGeometry(.11, .03, .075, 4, .008), metal(o.corpo || 'gloss', 'Corpo strumento')); const sc = new THREE.Mesh(new THREE.PlaneGeometry(.085, .05), new THREE.MeshPhysicalMaterial({ name: 'Display', color: 0x0a0d10, emissive: 0x3aa0ff, emissiveIntensity: .25, roughness: .1, clearcoat: 1 }));
    const d = new THREE.Group(); d.add(b); sc.rotation.x = -PI / 2; sc.position.y = .0151; d.add(sc); orient(d, nrm); d.position.set(0, .05, 0); G.add(d); }
  else add(o.tipo === 'mini' ? .024 : o.tipo === 'contagiri' ? .04 : .042, o.tipo === 'contagiri' ? 'giri' : 'kmh', 0);
  const st = mesh(tubeAlong(bentPath([V3(.035, -.03, 0), V3(.03, .0, 0), V3(.012, .03, 0)], .02), .006, 30, 12), bm); G.add(st);
  const cl = mesh(lathe([[.0135, -.012], [.02, -.012], [.021, -.01], [.021, .01], [.02, .012], [.0135, .012]], 40, .001), bm); cl.rotation.x = PI / 2; cl.position.set(.035, -.045, 0); G.add(cl);
  return G;
}
registerPro('strumento', { n: 'Strumentazione', cat: 'Strumenti', type: 'gauge', b: 'Motogadget, Daytona, Koso, Dakota Digital', p: 279, build: buildGauges,
  opts: [sel('tipo', 'Strumento', [['contachilometri', 'Tachimetro 80 mm'], ['contagiri', 'Contagiri 80 mm'], ['doppio', 'Doppio (tachimetro + contagiri)'], ['mini', 'Mini 48 mm'], ['digitale', 'Digitale LCD']], 'contachilometri'), sel('quadrante', 'Quadrante', [['nero', 'Nero'], ['bianco', 'Bianco'], ['crema', 'Crema vintage']], 'nero'),
    sel('ghiera', 'Ghiera', FIN_METAL, 'chrome'), sel('corpo', 'Corpo', FIN_METAL, 'gloss'), sel('supporto', 'Staffa', FIN_METAL, 'gloss')] });

/* =============================== PARABREZZA =============================== */
function buildShield(o) {
  const G = new THREE.Group(), Hh = o.altezza / 100, W = o.tipo === 'sport' ? .3 : o.tipo === 'touring' ? .58 : .48, Rc = o.tipo === 'sport' ? .25 : .45, lean = (o.tipo === 'sport' ? 30 : 16) * PI / 180, notch = o.tipo === 'custom' ? .09 : o.tipo === 'touring' ? .06 : 0;
  const fn = (u, v) => { const q = 2 * v - 1, top = Hh * (o.tipo === 'custom' ? (.62 + .38 * Math.pow(Math.max(0, 1 - q * q), .5)) : (.55 + .45 * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(q), 2.6)), .5))), bot = notch * Math.exp(-Math.pow(q / .3, 2)) + .015 * q * q, h = bot + (top - bot) * u, s = q * W / 2;
    return V3(-(Rc - Rc * Math.cos(s / Rc)) - Math.sin(lean) * h - .02 * u * u, h, Rc * Math.sin(s / Rc)); };
  const S = shell(fn, 40, 70, { thick: .0045, rimSeg: 4 }); const sm = screenMat(o.tinta); G.add(mesh(S.geo, [sm, sm], false));
  const bm = metal(o.attacchi, 'Attacchi parabrezza'), half = o.interasse / 2;
  for (const s of [1, -1]) for (const [yy, v] of [[.02, s > 0 ? .7 : .3], [.11, s > 0 ? .74 : .26]]) {
    const cl = mesh(lathe([[.0215, -.012], [.029, -.012], [.03, -.01], [.03, .01], [.029, .012], [.0215, .012]], 40, .001), bm); cl.position.set(-.07, yy - .06, s * half); G.add(cl);
    const pt = S.at(Math.min(1, yy / Hh * .9), v), a = V3(-.07 + .028, yy - .06, s * half), bar = mesh(tubeAlong(new THREE.LineCurve3(a, pt.clone().add(V3(-.006, 0, 0))), .0042, 4, 12), bm); G.add(bar);
    const sc = buttonScrew(.0065, metal('chrome', 'Viteria'), darkMat()); orient(sc, S.nAt(Math.min(1, yy / Hh * .9), v)); sc.position.copy(pt).addScaledVector(S.nAt(Math.min(1, yy / Hh * .9), v), .0045); G.add(sc); }
  return G;
}
registerPro('parabrezza', { n: 'Parabrezza', cat: 'Carene', type: 'fairing', b: 'Memphis Shades, National Cycle, Puig, Klock Werks', p: 1049, build: buildShield,
  opts: [sel('tipo', 'Modello', [['touring', 'Touring alto'], ['medio', 'Medio'], ['sport', 'Sport / flyscreen'], ['custom', 'Custom sagomato']], 'medio'), num('altezza', 'Altezza', 15, 75, 1, 45, 'cm'), sel('tinta', 'Tinta', SCREEN_COL, 'chiaro'), sel('attacchi', 'Attacchi', FIN_METAL, 'chrome'), num('interasse', 'Interasse steli', .17, .28, .005, .22, 'm')] });

/* =============================== PORTAPACCHI =============================== */
function buildRack(o) {
  const G = new THREE.Group(), fm = metal(o.finitura, 'Portapacchi'), t = o.tipo, [L, W] = t === 'touring' ? [.36, .26] : t === 'solo' ? [.22, .17] : [.3, .2];
  const out = bentPath([V3(L / 2, 0, -W / 2), V3(L / 2, 0, W / 2), V3(-L / 2, 0, W / 2), V3(-L / 2, 0, -W / 2), V3(L / 2, 0, -W / 2), V3(L / 2, 0, 0)], .04);
  G.add(mesh(tubeAlong(out, .0085, 400, 18), fm));
  const nb = t === 'touring' ? 5 : 3; for (let k = 1; k <= nb; k++) { const x = L / 2 - k * L / (nb + 1), cb = mesh(new THREE.CylinderGeometry(.0058, .0058, W, 18), fm); cb.rotation.x = PI / 2; cb.position.set(x, -.002, 0); G.add(cb); }
  if (t === 'touring') { const rail = mesh(tubeAlong(bentPath([V3(-L / 2, 0, -W / 2), V3(-L / 2 - .02, .05, -W / 2 + .03), V3(-L / 2 - .02, .05, W / 2 - .03), V3(-L / 2, 0, W / 2)], .03), .0075, 200, 16), fm); G.add(rail); }
  for (const s of [1, -1]) { const leg = mesh(tubeAlong(bentPath([V3(L * .3, 0, s * W / 2), V3(L * .38, -.06, s * (W / 2 + .01)), V3(L * .5, -.1, s * (W / 2 + .01))], .03), .0075, 60, 14), fm); G.add(leg);
    const tab = mesh(new RoundedBoxGeometry(.035, .028, .007, 2, .003), fm); tab.position.set(L * .5, -.1, s * (W / 2 + .01)); G.add(tab); const sc = buttonScrew(.006, metal('chrome', 'Viteria'), darkMat()); orient(sc, V3(0, 0, s)); sc.position.set(L * .5, -.1, s * (W / 2 + .015)); G.add(sc); }
  return G;
}
registerPro('portapacchi', { n: 'Portapacchi posteriore', cat: 'Borse', type: 'rack', b: 'Motone, Kustom Tech, Cobra, SW-Motech', p: 1333, build: buildRack,
  opts: [sel('tipo', 'Modello', [['codino', 'Piatto per codino / scrambler'], ['solo', 'Mini sul parafango (solo)'], ['touring', 'Touring con ringhiera']], 'codino'), sel('finitura', 'Finitura', FIN_METAL, 'gloss')] });

/* =============================== SOFFIETTI FORCELLA =============================== */
function buildGaiters(o) {
  const G = new THREE.Group(), K = new THREE.Group(); G.add(K); K.rotation.z = 29 * PI / 180;
  const rf = o.forcella / 2000, L = o.lunghezza / 100, nF = Math.round(L / .013), rm = new THREE.MeshPhysicalMaterial({ name: 'Soffietti', color: { nero: 0x141414, marrone: 0x3c2414, bianco: 0xd9d4c8 }[o.colore] ?? 0x141414, roughness: .62, sheen: .3 });
  const prof = [[rf + .001, 0], [rf + .004, 0], [rf + .004, .012]]; for (let k = 0; k < nF; k++) { const y = .014 + k * .013; prof.push([rf + .0125, y + .0035], [rf + .0125, y + .0045], [rf + .0045, y + .009], [rf + .0045, y + .0105]); } prof.push([rf + .004, .016 + nF * .013], [rf + .004, .03 + nF * .013], [rf + .001, .03 + nF * .013]);
  for (const s of [1, -1]) { const g = mesh(lathe(prof, 48, .0012), rm); g.position.z = s * o.interasse / 2; K.add(g);
    for (const y of [.006, .022 + nF * .013]) { const cl = mesh(new THREE.TorusGeometry(rf + .0045, .0016, 8, 48), metal('chrome', 'Fascette')); cl.rotation.x = PI / 2; cl.position.set(0, y, s * o.interasse / 2); K.add(cl); } }
  return G;
}
registerPro('soffietti', { n: 'Soffietti forcella (coppia)', cat: 'Sospensioni', type: 'shock', b: 'Biltwell, Emgo, Highsider', p: 735, build: buildGaiters,
  opts: [sel('colore', 'Colore', [['nero', 'Nero'], ['marrone', 'Marrone'], ['bianco', 'Bianco']], 'nero'), num('lunghezza', 'Lunghezza', 12, 26, 1, 18, 'cm'), sel('forcella', 'Ø forcella', [['35', '35 mm'], ['39', '39 mm'], ['41', '41 mm'], ['43', '43 mm']], '39'), num('interasse', 'Interasse steli', .17, .27, .005, .21, 'm')] });

/* =============================== GRIGLIA FARO =============================== */
const GT = {};
function meshTex() { if (GT.m) return GT.m; const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, 256, 256); g.globalCompositeOperation = 'destination-out';
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { g.beginPath(); g.arc(8 + x * 16 + (y % 2) * 8, 8 + y * 16, 5.6, 0, 2 * PI); g.fill(); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return (GT.m = t); }
function buildGrill(o) {
  const G = new THREE.Group(), Y = new THREE.Group(); Y.rotation.z = -PI / 2; G.add(Y);
  const R = ({ '5.75': .073, '7': .0889 }[o.diametro] || .0889) * 1.13, fm = metal(o.finitura, 'Griglia faro');
  Y.add(mesh(lathe([[R - .004, 0], [R + .004, 0], [R + .005, .003], [R + .002, .006], [R - .004, .005]], 128, .0008), fm));
  const dome = y => .03 * (1 - y * y / (R * R));
  if (o.tipo === 'rete') { const d = new THREE.CircleGeometry(R - .002, 96); d.rotateX(-PI / 2); const p = d.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i); p.setY(i, .03 * (1 - (x * x + z * z) / (R * R))); } d.computeVertexNormals(); const m = fm.clone(); m.alphaMap = meshTex(); m.alphaMap.repeat.set(R * 30, R * 30); m.alphaTest = .5; m.side = THREE.DoubleSide; m.name = 'Rete'; Y.add(mesh(d, m)); }
  else { const bars = o.tipo === 'barre' ? [-.5, -.17, .17, .5].map(f => [f, 0]) : [[0, PI / 4], [0, -PI / 4]];
    for (const [f, a] of bars) { const pts = []; for (let i = 0; i <= 40; i++) { const t = -1 + 2 * i / 40, x = t * Math.sqrt(Math.max(0, 1 - f * f)) * (R - .003), z = f * (R - .003); const rx = x * Math.cos(a) - z * Math.sin(a), rz = x * Math.sin(a) + z * Math.cos(a); pts.push(V3(rx, dome(Math.hypot(rx, rz)) * (o.tipo === 'barre' ? .3 : 1) + .004, rz)); }
      Y.add(mesh(new THREE.ExtrudeGeometry(roundRect(.0035, o.tipo === 'barre' ? .006 : .012, .0012), { steps: 60, bevelEnabled: false, extrudePath: new THREE.CatmullRomCurve3(pts) }), fm)); }
    if (o.tipo === 'croce') { const c = mesh(lathe([[0, .036], [.012, .035], [.014, .03], [0, .03]], 32, .001), fm); Y.add(c); } }
  for (const s of [1, -1]) { const tb = mesh(new RoundedBoxGeometry(.014, .006, .02, 2, .002), fm); tb.position.set(0, .002, s * (R + .006)); Y.add(tb); }
  return G;
}
registerPro('griglia_faro', { n: 'Griglia faro', cat: 'Luci', type: 'light', b: 'Highsider, Biltwell, Motone', p: 163, build: buildGrill,
  opts: [sel('tipo', 'Modello', [['croce', 'A croce (X)'], ['rete', 'Rete forata'], ['barre', 'A barre orizzontali']], 'croce'), sel('diametro', 'Faro', [['5.75', '5¾"'], ['7', '7"']], '7'), sel('finitura', 'Finitura', FIN_METAL, 'gloss')] });
