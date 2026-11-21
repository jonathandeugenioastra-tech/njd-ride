/* NJ.D' RIDE – Libreria PRO: ricambi custom modellati dall'autore sulle misure del catalogo.
   © 2026 dott. Jonathan D'Eugenio – Tutti i diritti riservati (L. 633/1941).
   Unità: metri. Assi: +x avanti, +y alto, z laterale. Nessun logo o disegno protetto: tipologie generiche.
   Ogni ricambio è ricostruibile con opzioni (misure, stile, colori, finiture). */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const IN = 0.0254, PI = Math.PI;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const fract = x => x - Math.floor(x);
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

/* ======================= TEXTURE PROCEDURALI (generate una volta) ======================= */
const TX = {};
function tex(key, size, fill, srgb = false) {
  if (TX[key]) return TX[key];
  const c = document.createElement('canvas'); c.width = c.height = size; const g = c.getContext('2d'); fill(g, size);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return (TX[key] = t);
}
function toNormal(g, w, H, str) {
  const id = g.createImageData(w, w), d = id.data;
  for (let y = 0; y < w; y++) for (let x = 0; x < w; x++) {
    const dx = (H[y * w + (x + 1) % w] - H[y * w + (x - 1 + w) % w]) * str, dy = (H[((y + 1) % w) * w + x] - H[((y - 1 + w) % w) * w + x]) * str;
    const l = Math.hypot(dx, dy, 1), i = (y * w + x) * 4;
    d[i] = (-dx / l * .5 + .5) * 255; d[i + 1] = (dy / l * .5 + .5) * 255; d[i + 2] = (1 / l * .5 + .5) * 255; d[i + 3] = 255;
  }
  g.putImageData(id, 0, 0);
}
function worley(w, G, seed) {
  const r = rng(seed), P = new Float32Array(G * G * 2); for (let i = 0; i < P.length; i++) P[i] = r();
  const H = new Float32Array(w * w), cs = w / G;
  for (let y = 0; y < w; y++) { const gy = Math.floor(y / cs); for (let x = 0; x < w; x++) { const gx = Math.floor(x / cs); let f1 = 1e9, f2 = 1e9;
    for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { const cx = (gx + i + G) % G, cy = (gy + j + G) % G, k = (cy * G + cx) * 2; const dx = (gx + i + P[k]) * cs - x, dy = (gy + j + P[k + 1]) * cs - y, dd = dx * dx + dy * dy; if (dd < f1) { f2 = f1; f1 = dd; } else if (dd < f2) f2 = dd; }
    H[y * w + x] = (Math.sqrt(f2) - Math.sqrt(f1)) / cs; } }
  return H;
}
function blur(H, w, rx, ry) { const T = new Float32Array(w * w);
  if (rx) for (let y = 0; y < w; y++) { let s = 0; for (let k = -rx; k <= rx; k++) s += H[y * w + (k + w) % w]; for (let x = 0; x < w; x++) { T[y * w + x] = s / (2 * rx + 1); s += H[y * w + (x + rx + 1) % w] - H[y * w + (x - rx + w) % w]; } } else T.set(H);
  if (ry) { const U = new Float32Array(w * w); for (let x = 0; x < w; x++) { let s = 0; for (let k = -ry; k <= ry; k++) s += T[((k + w) % w) * w + x]; for (let y = 0; y < w; y++) { U[y * w + x] = s / (2 * ry + 1); s += T[((y + ry + 1) % w) * w + x] - T[((y - ry + w) % w) * w + x]; } } return U; }
  return T; }
const T = {
  croc: () => tex('croc', 512, (g, w) => { const A = worley(w, 9, 21), B = worley(w, 30, 23); const H = new Float32Array(w * w); for (let i = 0; i < w * w; i++) H[i] = sstep(0, .2, A[i]) * .85 + sstep(0, .25, B[i]) * .25; toNormal(g, w, blur(H, w, 1, 1), 3.4); }),
  tooledH: () => { if (TX.__tooledH) return TX.__tooledH; const w = 512, c = document.createElement('canvas'); c.width = c.height = w; const g = c.getContext('2d'); g.fillStyle = '#000'; g.fillRect(0, 0, w, w); g.strokeStyle = '#fff'; g.lineCap = 'round'; const r = rng(41);
    // volute floreali incise (stile western): spirali, foglie e tagli a «pennello»
    for (let k = 0; k < 26; k++) { const cx = r() * w, cy = r() * w, R = 18 + r() * 34, dir = r() < .5 ? 1 : -1; g.lineWidth = 3.2; g.beginPath(); for (let t = 0; t < 4.6 * Math.PI; t += .08) { const rr = R * (1 - t / (5 * Math.PI)), x = cx + Math.cos(dir * t) * rr, y = cy + Math.sin(dir * t) * rr; t ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
      for (let j = 0; j < 5; j++) { const a = r() * 2 * Math.PI, l = R * (1.1 + r() * .9); g.lineWidth = 2.4; g.beginPath(); g.moveTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); g.quadraticCurveTo(cx + Math.cos(a + .5) * l, cy + Math.sin(a + .5) * l, cx + Math.cos(a + .2) * l * 1.3, cy + Math.sin(a + .2) * l * 1.3); g.stroke(); } }
    const d = g.getImageData(0, 0, w, w).data, H = new Float32Array(w * w); for (let i = 0; i < w * w; i++) H[i] = d[i * 4] / 255; return (TX.__tooledH = { H: blur(H, w, 1, 1), w }); },
  tooled: () => tex('tooled', 512, (g, w) => { const { H } = T.tooledH(); const I = new Float32Array(w * w); for (let i = 0; i < w * w; i++) I[i] = -H[i]; toNormal(g, w, I, 5); }),
  tooledMap: () => tex('tooledMap', 512, (g, w) => { const { H } = T.tooledH(), id = g.createImageData(w, w), d = id.data; const r = rng(43); for (let i = 0; i < w * w; i++) { const v = 1 - .62 * Math.min(1, H[i] * 1.6) - r() * .05; d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = v * 255; d[i * 4 + 3] = 255; } g.putImageData(id, 0, 0); }, true),
  leather: () => tex('leather', 512, (g, w) => { const A = worley(w, 26, 7), B = worley(w, 52, 11), r = rng(3); const H = new Float32Array(w * w); for (let i = 0; i < w * w; i++) H[i] = sstep(0, .32, A[i]) * .75 + sstep(0, .3, B[i]) * .3 + r() * .05; toNormal(g, w, H, 2.2); }),
  suede: () => tex('suede', 256, (g, w) => { const r = rng(5); let H = new Float32Array(w * w); for (let i = 0; i < w * w; i++) H[i] = r(); H = blur(H, w, 1, 1); toNormal(g, w, H, 3); }),
  brushed: () => tex('brushed', 512, (g, w) => { const r = rng(9); let H = new Float32Array(w * w); for (let i = 0; i < w * w; i++) H[i] = r(); H = blur(H, w, 40, 0); toNormal(g, w, H, 9); }),
  flake: () => tex('flake', 256, (g, w) => { const r = rng(13), id = g.createImageData(w, w), d = id.data; for (let i = 0; i < w * w; i++) { const nx = (r() - .5) * 1.2, ny = (r() - .5) * 1.2, l = Math.hypot(nx, ny, 1); d[i * 4] = (nx / l * .5 + .5) * 255; d[i * 4 + 1] = (ny / l * .5 + .5) * 255; d[i * 4 + 2] = (1 / l * .5 + .5) * 255; d[i * 4 + 3] = 255; } g.putImageData(id, 0, 0); }),
  peel: () => tex('peel', 256, (g, w) => { const r = rng(17); let H = new Float32Array(w * w); for (let i = 0; i < w * w; i++) H[i] = r(); H = blur(blur(H, w, 3, 3), w, 2, 2); toNormal(g, w, H, 14); }),
  knurl: () => tex('knurl', 256, (g, w) => { const H = new Float32Array(w * w), p = w / 16; for (let y = 0; y < w; y++) for (let x = 0; x < w; x++) H[y * w + x] = Math.pow(Math.abs(Math.sin(PI * (x + y) / p)) * Math.abs(Math.sin(PI * (x - y) / p)), .5); toNormal(g, w, H, 2.4); }),
  prism: () => tex('prism', 256, (g, w) => { const H = new Float32Array(w * w), c = w / 8; for (let y = 0; y < w; y++) for (let x = 0; x < w; x++) { const u = fract(x / c) - .5, v = fract(y / c) - .5; H[y * w + x] = 1 - 2 * Math.max(Math.abs(u), Math.abs(v)); } toNormal(g, w, H, 1.3); }),
  lamp: () => tex('lamp', 1024, (g, w) => { const H = new Float32Array(w * w); for (let y = 0; y < w; y++) for (let x = 0; x < w; x++) { const u = x / w - .5, v = y / w - .5, r = Math.hypot(u, v); H[y * w + x] = r < .2 ? .5 + .5 * Math.sin(r * 260) : (Math.abs(Math.sin(u * 90)) * .7 + Math.abs(Math.sin(v * 18)) * .3); } toNormal(g, w, H, 2.2); }),
  wrap: () => tex('wrap', 256, (g, w) => { const H = new Float32Array(w * w); for (let y = 0; y < w; y++) for (let x = 0; x < w; x++) H[y * w + x] = Math.pow(Math.abs(Math.sin(PI * (x * 2 + y) / (w / 4))), .4); toNormal(g, w, H, 2); }),
  thread: () => tex('thr', 128, (g, w) => { const H = new Float32Array(w * w); for (let y = 0; y < w; y++) for (let x = 0; x < w; x++) H[y * w + x] = Math.abs(Math.sin(PI * (y + x * .15) / (w / 8))); toNormal(g, w, H, 3); }),
  mottle: () => tex('mottle', 512, (g, w) => { const r = rng(21); let H = new Float32Array(w * w); for (let i = 0; i < w * w; i++) H[i] = r(); H = blur(blur(H, w, 12, 12), w, 8, 8); const id = g.createImageData(w, w), d = id.data; let mn = 1, mx = 0; for (const v of H) { mn = Math.min(mn, v); mx = Math.max(mx, v); } for (let i = 0; i < w * w; i++) { const v = 150 + (H[i] - mn) / (mx - mn) * 105; d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = v; d[i * 4 + 3] = 255; } g.putImageData(id, 0, 0); }, true),
  plate: () => tex('plate', 512, (g, w) => { g.fillStyle = '#f4f4f0'; g.fillRect(0, 0, w, w); g.strokeStyle = '#111'; g.lineWidth = 10; g.strokeRect(14, 14, w - 28, w - 28); g.fillStyle = '#121212'; g.textAlign = 'center'; g.font = 'bold 150px Arial, Helvetica, sans-serif'; g.fillText('CG 3D', w / 2, w * .44); g.font = 'bold 170px Arial, Helvetica, sans-serif'; g.fillText('2026', w / 2, w * .82); }, true)
};

/* ======================= MATERIALI E FINITURE ======================= */
export const FIN_METAL = [['chrome', 'Cromato'], ['blackchrome', 'Black chrome'], ['gloss', 'Nero lucido'], ['satin', 'Nero satinato'], ['wrinkle', 'Nero goffrato'], ['brushed', 'Alluminio spazzolato'], ['polished', 'Alluminio lucidato'], ['contrast', 'Nero con fresature a vista'], ['gold', 'Oro anodizzato'], ['brass', 'Ottone'], ['copper', 'Rame'], ['raw', 'Acciaio grezzo'], ['paint', 'Verniciato a colore']];
export const LEATHER_COL = [['nero', 'Nero'], ['marrone', 'Marrone'], ['cuoio', 'Cuoio naturale'], ['testa', 'Testa di moro'], ['bordeaux', 'Bordeaux'], ['grigio', 'Grigio antracite'], ['crema', 'Crema'], ['rosso', 'Rosso'], ['tan', 'Tabacco'], ['bianco', 'Bianco'], ['ardesia', 'Blu ardesia']];
export const LEATHER_TYPE = [['liscia', 'Pelle liscia'], ['invecchiata', 'Pelle invecchiata'], ['scamosciata', 'Scamosciata'], ['lucida', 'Pelle lucida (verniciata)'], ['cocco', 'Stampa cocco'], ['incisa', 'Cuoio inciso a mano']];
export const THREAD_COL = [['beige', 'Beige'], ['tinta', 'In tinta'], ['bianco', 'Bianco'], ['rosso', 'Rosso'], ['arancio', 'Arancio'], ['nero', 'Nero'], ['grigio', 'Grigio']];
export const LENS_COL = [['ambra', 'Ambra'], ['fume', 'Fumé'], ['chiara', 'Trasparente'], ['rossa', 'Rossa']];
export const PAINT_TYPE = [['lucido', 'Lucido'], ['metallizzato', 'Metallizzato'], ['candy', 'Candy'], ['perlato', 'Perlato'], ['flake', 'Metal flake'], ['satinato', 'Satinato'], ['opaco', 'Opaco']];
const LCOL = { nero: 0x151110, marrone: 0x4c2816, cuoio: 0x8b5a30, testa: 0x2f1b11, bordeaux: 0x4b1217, grigio: 0x3d3e42, crema: 0xcfc4ad, rosso: 0x86101a, tan: 0xa36a38, bianco: 0xe4e0d8, ardesia: 0x2a3038 };
export const LCOLS = LCOL;
export const TCOLS = { beige: 0xcbb589, bianco: 0xeeeeea, rosso: 0xaa1a1d, arancio: 0xd8781f, nero: 0x111111, grigio: 0x8d9096 };
const TCOL = TCOLS;

export function metal(fin, slot, color = '#8a1010') {
  const m = new THREE.MeshPhysicalMaterial({ name: slot, color: 0xffffff, metalness: 1, roughness: .05 });
  const set = o => Object.assign(m, o);
  switch (fin) {
    case 'chrome': set({ color: new THREE.Color(0xf6f7f9), roughness: .028, envMapIntensity: 1.25 }); break;
    case 'blackchrome': set({ color: new THREE.Color(0x3b3e44), roughness: .06 }); break;
    case 'gloss': set({ color: new THREE.Color(0x0b0b0c), metalness: 0, roughness: .32, clearcoat: 1, clearcoatRoughness: .025 }); break;
    case 'satin': set({ color: new THREE.Color(0x141416), metalness: .35, roughness: .48, clearcoat: .35, clearcoatRoughness: .35, normalMap: T.peel(), normalScale: new THREE.Vector2(.08, .08) }); break;
    case 'wrinkle': set({ color: new THREE.Color(0x0e0e0f), metalness: .05, roughness: .82, normalMap: T.peel(), normalScale: new THREE.Vector2(.9, .9) }); break;
    case 'brushed': set({ color: new THREE.Color(0xc9ccd2), roughness: .2, anisotropy: .75, normalMap: T.brushed(), normalScale: new THREE.Vector2(.12, .12) }); break;
    case 'polished': set({ color: new THREE.Color(0xe9ebef), roughness: .06 }); break;
    case 'contrast': set({ color: new THREE.Color(0x151517), metalness: .6, roughness: .33, clearcoat: .4, clearcoatRoughness: .2 }); break;
    case 'gold': set({ color: new THREE.Color(0xdcab4c), roughness: .17, anisotropy: .4 }); break;
    case 'brass': set({ color: new THREE.Color(0xcda64e), roughness: .12 }); break;
    case 'copper': set({ color: new THREE.Color(0xc77a4e), roughness: .15 }); break;
    case 'raw': set({ color: new THREE.Color(0x8d9095), roughness: .36, normalMap: T.peel(), normalScale: new THREE.Vector2(.15, .15) }); break;
    case 'paint': set({ color: new THREE.Color(color), metalness: .25, roughness: .3, clearcoat: 1, clearcoatRoughness: .03 }); break;
    case 'bright': set({ color: new THREE.Color(0xdfe2e7), roughness: .1 }); break;
    default: set({ color: new THREE.Color(0xf6f7f9), roughness: .03 });
  }
  m.userData.fin = fin; return m;
}
export function leather(col = 'nero', type = 'liscia', slot = 'Pelle', scale = 14) {
  const c = new THREE.Color(LCOL[col] ?? LCOL.nero);
  if (type === 'lucida' || type === 'cocco' || type === 'incisa') { // pelli speciali: lucida verniciata, stampa cocco, cuoio inciso con patina scura nei solchi
    const m = new THREE.MeshPhysicalMaterial({ name: slot, color: c, metalness: 0, roughness: type === 'lucida' ? .2 : type === 'cocco' ? .42 : .58, clearcoat: type === 'lucida' ? 1 : type === 'cocco' ? .45 : .12, clearcoatRoughness: type === 'lucida' ? .08 : .3, sheen: .25, sheenRoughness: .5, sheenColor: c.clone().lerp(new THREE.Color(0xffffff), .1) });
    m.normalMap = (type === 'cocco' ? T.croc() : type === 'incisa' ? T.tooled() : T.leather()).clone(); m.normalMap.needsUpdate = true; const rp = type === 'cocco' ? scale * .45 : type === 'incisa' ? scale * .35 : scale; m.normalMap.repeat.set(rp, rp); m.normalScale = new THREE.Vector2(type === 'lucida' ? .25 : .9, type === 'lucida' ? .25 : .9);
    if (type === 'incisa') { m.map = T.tooledMap().clone(); m.map.needsUpdate = true; m.map.repeat.set(rp, rp); }
    m.userData.leather = [col, type]; return m; }
  if (type === 'scamosciata') c.multiplyScalar(.75);
  const m = new THREE.MeshPhysicalMaterial({ name: slot, color: c, metalness: 0, roughness: type === 'scamosciata' ? .95 : type === 'invecchiata' ? .66 : .5,
    sheen: type === 'scamosciata' ? .9 : .3, sheenRoughness: type === 'scamosciata' ? .85 : .5, sheenColor: c.clone().lerp(new THREE.Color(0xffffff), .12),
    clearcoat: type === 'liscia' ? .18 : 0, clearcoatRoughness: .5 });
  m.normalMap = (type === 'scamosciata' ? T.suede() : T.leather()).clone(); m.normalMap.needsUpdate = true; m.normalMap.repeat.set(scale, scale); m.normalScale = new THREE.Vector2(type === 'scamosciata' ? .5 : .62, type === 'scamosciata' ? .5 : .62);
  if (type === 'invecchiata') { m.map = T.mottle().clone(); m.map.needsUpdate = true; m.map.repeat.set(scale / 6, scale / 6); }
  m.userData.leather = [col, type]; return m;
}
export function threadMat(col, leatherCol) {
  const c = col === 'tinta' ? new THREE.Color(LCOL[leatherCol] ?? 0x222222).multiplyScalar(.8) : new THREE.Color(TCOL[col] ?? TCOL.beige);
  return new THREE.MeshPhysicalMaterial({ name: 'Cuciture', color: c, roughness: .75, sheen: .6, sheenColor: c, normalMap: T.thread(), normalScale: new THREE.Vector2(.6, .6) });
}
export function lens(col = 'ambra', slot = 'Lente', prism = true) {
  const tint = { ambra: 0xff8c10, fume: 0x2a2a2e, chiara: 0xffffff, rossa: 0xd0101a }[col] ?? 0xffffff;
  const m = new THREE.MeshPhysicalMaterial({ name: slot, color: tint, metalness: 0, roughness: .04, transmission: col === 'fume' ? .75 : .92, thickness: .003, ior: 1.5, attenuationColor: new THREE.Color(tint), attenuationDistance: .02 });
  if (prism) { m.normalMap = T.prism(); m.normalScale = new THREE.Vector2(.55, .55); }
  return m;
}
export function paint(color = '#7e0b12', type = 'lucido', slot = 'Vernice') {
  const m = new THREE.MeshPhysicalMaterial({ name: slot, color: new THREE.Color(color), metalness: .1, roughness: .3, clearcoat: 1, clearcoatRoughness: .02 });
  const fl = (s, r) => { m.normalMap = T.flake().clone(); m.normalMap.needsUpdate = true; m.normalMap.repeat.set(r, r); m.normalScale = new THREE.Vector2(s, s); };
  switch (type) {
    case 'metallizzato': m.metalness = .6; m.roughness = .32; fl(.1, 60); break;
    case 'candy': m.metalness = .85; m.roughness = .18; fl(.07, 60); break;
    case 'perlato': m.metalness = .3; m.iridescence = 1; m.iridescenceIOR = 1.45; m.iridescenceThicknessRange = [200, 520]; break;
    case 'flake': m.metalness = .8; m.roughness = .34; fl(.45, 30); break;
    case 'satinato': m.clearcoat = .3; m.clearcoatRoughness = .45; m.roughness = .5; break;
    case 'opaco': m.clearcoat = 0; m.roughness = .85; m.metalness = .05; break;
  }
  return m;
}
const rubber = (slot = 'Gomma', col = 0x121213) => new THREE.MeshPhysicalMaterial({ name: slot, color: col, roughness: .88, metalness: 0, normalMap: T.peel(), normalScale: new THREE.Vector2(.3, .3) });
const darkMat = (slot = 'Interno') => new THREE.MeshPhysicalMaterial({ name: slot, color: 0x050505, roughness: .6 });

/* ======================= GEOMETRIA DI BASE ======================= */
const mesh = (g, m, cast = true) => { const o = new THREE.Mesh(g, m); o.castShadow = cast; o.receiveShadow = true; return o; };
function fillet(pts, r = .0006, n = 4) {
  const out = [pts[0]];
  for (let i = 1; i < pts.length - 1; i++) {
    const p = pts[i], a = pts[i - 1], b = pts[i + 1];
    const da = Math.hypot(a[0] - p[0], a[1] - p[1]), db = Math.hypot(b[0] - p[0], b[1] - p[1]); const d = Math.min(r, da / 2, db / 2);
    if (d < 1e-6) { out.push(p); continue; }
    const pa = [p[0] + (a[0] - p[0]) / da * d, p[1] + (a[1] - p[1]) / da * d], pb = [p[0] + (b[0] - p[0]) / db * d, p[1] + (b[1] - p[1]) / db * d];
    for (let k = 0; k <= n; k++) { const t = k / n, u = 1 - t; out.push([u * u * pa[0] + 2 * u * t * p[0] + t * t * pb[0], u * u * pa[1] + 2 * u * t * p[1] + t * t * pb[1]]); }
  }
  out.push(pts[pts.length - 1]); return out;
}
const lathe = (pts, seg = 96, r = .0006, phiS = 0, phiL = 2 * PI) => new THREE.LatheGeometry(fillet(pts, r).map(p => new THREE.Vector2(Math.max(0, p[0]), p[1])), seg, phiS, phiL);
function bentPath(P, R) {
  const cp = new THREE.CurvePath(); let prev = P[0].clone();
  for (let i = 1; i < P.length - 1; i++) {
    const a = P[i - 1], p = P[i], b = P[i + 1]; const ra = Array.isArray(R) ? R[i] : R;
    const da = p.distanceTo(a), db = p.distanceTo(b), d = Math.min(ra, da * .45, db * .45);
    const pa = p.clone().add(a.clone().sub(p).normalize().multiplyScalar(d)), pb = p.clone().add(b.clone().sub(p).normalize().multiplyScalar(d));
    if (prev.distanceTo(pa) > 1e-5) cp.add(new THREE.LineCurve3(prev, pa)); cp.add(new THREE.QuadraticBezierCurve3(pa, p.clone(), pb)); prev = pb;
  }
  cp.add(new THREE.LineCurve3(prev, P[P.length - 1].clone())); return cp;
}
const tubeAlong = (curve, r, seg = 300, rad = 32, closed = false) => new THREE.TubeGeometry(curve, seg, r, rad, closed);
const dedupe = (pts, e = 1e-6) => pts.filter((p, i, a) => !i || p.distanceTo(a[i - 1]) > e);
const closedSpline = (pts, seg, r, rad = 16) => { let q = dedupe(pts); if (q.length > 2 && q[0].distanceTo(q[q.length - 1]) < 1e-6) q.pop(); return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(q, true, 'centripetal'), seg, r, rad, true); };
function hexPrism(af, h, hole = 0, bev = .0004) {
  const R = af / Math.sqrt(3), s = new THREE.Shape();
  for (let k = 0; k < 6; k++) { const a = k * PI / 3 + PI / 6, x = R * Math.cos(a), y = R * Math.sin(a); k ? s.lineTo(x, y) : s.moveTo(x, y); } s.closePath();
  if (hole) { const p = new THREE.Path(); p.absarc(0, 0, hole, 0, 2 * PI, true); s.holes.push(p); }
  const g = new THREE.ExtrudeGeometry(s, { depth: Math.max(.0002, h - 2 * bev), bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelSegments: 2, curveSegments: 24 });
  g.translate(0, 0, -(h - 2 * bev) / 2); g.rotateX(-PI / 2); return g;
}
function capScrew(d, m, dark) {
  const g = new THREE.Group(), r = d / 2, h = d * .8;
  g.add(mesh(lathe([[0, 0], [r, 0], [r, h * .82], [r * .9, h], [0, h]], 32, d * .06), m, false));
  const hx = mesh(hexPrism(d * .45, .0003, 0, .00005), dark, false); hx.position.y = h + .00005; g.add(hx); return g;
}
function buttonScrew(d, m, dark) {
  const g = new THREE.Group(), r = d * .95;
  g.add(mesh(lathe([[0, 0], [r, 0], [r * .96, d * .12], [r * .7, d * .32], [0, d * .38]], 32, d * .05), m, false));
  const hx = mesh(hexPrism(d * .38, .0003, 0, .00005), dark, false); hx.position.y = d * .385; g.add(hx); return g;
}
function threadedRod(r, len, pitch, m) {
  const g = new THREE.Group(); g.add(mesh(new THREE.CylinderGeometry(r * .92, r * .92, len, 24), m, false));
  const turns = len / pitch, pts = []; for (let i = 0; i <= turns * 24; i++) { const a = i / 24 * 2 * PI; pts.push(V3(Math.cos(a) * r * .93, -len / 2 + i / 24 * pitch, Math.sin(a) * r * .93)); }
  g.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), Math.round(turns * 24), r * .1, 6), m, false)); return g;
}
const STITCH_GEO = new THREE.CapsuleGeometry(.00058, .0029, 2, 6);
function stitches(samples, mat, pitch = .0047) {
  const pos = [], tan = [], nor = []; let acc = pitch;
  for (let i = 1; i < samples.length; i++) {
    const a = samples[i - 1], b = samples[i]; const seg = a.p.distanceTo(b.p); if (seg < 1e-7) continue;
    while (acc <= seg) { const t = acc / seg; pos.push(a.p.clone().lerp(b.p, t)); tan.push(b.p.clone().sub(a.p).normalize()); nor.push(a.n.clone().lerp(b.n, t).normalize()); acc += pitch; }
    acc -= seg;
  }
  const im = new THREE.InstancedMesh(STITCH_GEO, mat, Math.max(1, pos.length)); const q = new THREE.Quaternion(), M = new THREE.Matrix4(), up = V3(0, 1, 0), S = V3(1, 1, 1);
  pos.forEach((p, i) => { q.setFromUnitVectors(up, tan[i]); M.compose(p.clone().addScaledVector(nor[i], .00028), q, S); im.setMatrixAt(i, M); });
  if (!pos.length) im.count = 0;
  im.castShadow = false; im.receiveShadow = true; im.name = 'Cuciture'; return im;
}
function ribbon(samples, w, t, mat, tip = 0) {
  const P = [], I = [], UV = []; let L = 0;
  samples.forEach((s, k) => {
    const tg = (k < samples.length - 1 ? samples[k + 1].p.clone().sub(s.p) : s.p.clone().sub(samples[k - 1].p)).normalize();
    const side = tg.clone().cross(s.n).normalize(); if (k) L += s.p.distanceTo(samples[k - 1].p);
    let ww = w; if (tip && k === samples.length - 1) ww = w * .15; else if (tip && k === samples.length - 2) ww = w * .8;
    const top = s.p.clone().addScaledVector(s.n, t), bot = s.p.clone();
    for (const [p, sg] of [[top, 1], [top, -1], [bot, -1], [bot, 1]]) { const q = p.clone().addScaledVector(side, sg * ww / 2); P.push(q.x, q.y, q.z); UV.push(L, sg * ww / 2); }
  });
  const n = samples.length;
  for (let k = 0; k < n - 1; k++) for (let e = 0; e < 4; e++) { const a = k * 4 + e, b = k * 4 + (e + 1) % 4, c = a + 4, d = b + 4; I.push(a, c, b, b, c, d); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); g.setIndex(I); g.computeVertexNormals();
  return mesh(g, mat);
}
/* superficie imbottita: pianta 2D chiusa (CCW) + cupola + bordo arrotondato + fianco */
function cushion(outline, c, o) {
  const N = outline.length, rho = o.rho, Ns = o.Ns || 60, Nr = o.Nr || 12, Nd = o.Nd || 8, tuck = o.tuck ?? .004;
  const botAt = typeof o.bottom === 'function' ? o.bottom : () => o.bottom; // fondo piano o sagomato sulla base della moto
  const out = [], inn = [], nrm = [];
  for (let i = 0; i < N; i++) {
    const a = outline[(i - 1 + N) % N], b = outline[(i + 1) % N], t = b.clone().sub(a).normalize(), n = new THREE.Vector2(t.y, -t.x);
    out.push(outline[i]); nrm.push(n); inn.push(outline[i].clone().addScaledVector(n, -rho));
  }
  const rows = [];
  for (let j = 0; j <= Ns; j++) { const s = .004 + .996 * j / Ns; rows.push(i => { const p = c.clone().lerp(inn[i], s); return [p.x, p.y, o.zTop(p.x, p.y, s)]; }); }
  const zE = inn.map(p => o.zTop(p.x, p.y, 1));
  for (let j = 1; j <= Nr; j++) { const f = j / Nr * PI / 2; rows.push(i => { const p = inn[i].clone().addScaledVector(nrm[i], rho * Math.sin(f)); return [p.x, p.y, zE[i] - rho * (1 - Math.cos(f))]; }); }
  for (let j = 1; j <= Nd; j++) { const q = j / Nd; rows.push(i => { const p = out[i].clone().addScaledVector(nrm[i], (o.bulge || 0) * Math.sin(PI * q)); return [p.x, p.y, (zE[i] - rho) * (1 - q) + botAt(p.x, p.y) * q]; }); }
  if (tuck) for (let j = 1; j <= 3; j++) { const q = j / 3; rows.push(i => { const p = out[i].clone().addScaledVector(nrm[i], -tuck * Math.sin(q * PI / 2)); return [p.x, p.y, botAt(p.x, p.y) - tuck * .6 * (1 - Math.cos(q * PI / 2))]; }); }
  const R = rows.length, P = new Float32Array(R * (N + 1) * 3), UV = new Float32Array(R * (N + 1) * 2);
  const arc = [0]; for (let i = 1; i <= N; i++) arc.push(arc[i - 1] + out[i % N].distanceTo(out[i - 1]));
  for (let j = 0; j < R; j++) for (let i = 0; i <= N; i++) { const v = rows[j](i % N), k = j * (N + 1) + i; P.set(v, k * 3);
    if (j <= Ns + Nr / 2) { UV[k * 2] = v[0]; UV[k * 2 + 1] = v[1]; } else { UV[k * 2] = arc[i] + 7; UV[k * 2 + 1] = v[2] + 7; } }
  const I = [], groups = o.matIndex ? [[], []] : null;
  for (let j = 0; j < R - 1; j++) for (let i = 0; i < N; i++) { const a = j * (N + 1) + i, b = a + N + 1, cc = a + 1, d = b + 1; const tri = [a, b, cc, b, d, cc];
    if (groups) groups[o.matIndex(j, i, Ns) ? 1 : 0].push(...tri); else I.push(...tri); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.BufferAttribute(UV, 2));
  if (groups) { g.setIndex([...groups[0], ...groups[1]]); g.addGroup(0, groups[0].length, 0); g.addGroup(groups[0].length, groups[1].length, 1); } else g.setIndex(I);
  g.computeVertexNormals();
  const nA = g.attributes.normal; for (let j = 0; j < R; j++) { const a = j * (N + 1), b = a + N; const x = nA.getX(a) + nA.getX(b), y = nA.getY(a) + nA.getY(b), z = nA.getZ(a) + nA.getZ(b), l = Math.hypot(x, y, z) || 1; nA.setXYZ(a, x / l, y / l, z / l); nA.setXYZ(b, x / l, y / l, z / l); }
  const tbl = inn.map(p => [((Math.atan2(p.y - c.y, p.x - c.x) % (2 * PI)) + 2 * PI) % (2 * PI), p.distanceTo(c)]).sort((u, v) => u[0] - v[0]);
  const ang = tbl.map(t => t[0]), rad = tbl.map(t => t[1]);
  const sAt = (x, y) => { const a = ((Math.atan2(y - c.y, x - c.x) % (2 * PI)) + 2 * PI) % (2 * PI); const d = Math.hypot(x - c.x, y - c.y);
    if (a < ang[0] || a >= ang[N - 1]) { const a0 = ang[N - 1], a1 = ang[0] + 2 * PI, aa = a < ang[0] ? a + 2 * PI : a, t = (aa - a0) / (a1 - a0); return d / (rad[N - 1] * (1 - t) + rad[0] * t); }
    let lo = 0, hi = N - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (ang[m] <= a) lo = m; else hi = m; } const t = (a - ang[lo]) / Math.max(1e-9, ang[hi] - ang[lo]); return d / (rad[lo] * (1 - t) + rad[hi] * t); };
  const top = (x, y) => { const s = sAt(x, y); return V3(x, y, o.zTop(x, y, s)); };
  const nTop = (x, y) => { const e = .0008; const zx = top(x + e, y).z - top(x - e, y).z, zy = top(x, y + e).z - top(x, y - e).z; return V3(-zx / (2 * e), -zy / (2 * e), 1).normalize(); };
  const ring = s => { const L = []; for (let i = 0; i <= N; i++) { const p = c.clone().lerp(inn[i % N], s); L.push({ p: V3(p.x, p.y, o.zTop(p.x, p.y, s)), n: nTop(p.x, p.y) }); } return L; };
  const rollRing = f => { const L = []; for (let i = 0; i <= N; i++) { const k = i % N, p = inn[k].clone().addScaledVector(nrm[k], rho * Math.sin(f)); L.push({ p: V3(p.x, p.y, zE[k] - rho * (1 - Math.cos(f))), n: V3(nrm[k].x * Math.sin(f), nrm[k].y * Math.sin(f), Math.cos(f)) }); } return L; };
  return { geo: g, sAt, top, nTop, ring, rollRing, inn, out, nrm, zE };
}
function shapeFrom(pts) { const s = new THREE.Shape(); pts.forEach((p, i) => i ? s.lineTo(p.x, p.y) : s.moveTo(p.x, p.y)); s.closePath(); return s; }
function roundRect(w, h, r) { const s = new THREE.Shape(), x = -w / 2, y = -h / 2; s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h); s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s; }
function roundRectPts(w, h, r, n = 10) { const P = [], cs = [[w / 2 - r, h / 2 - r, 0], [-w / 2 + r, h / 2 - r, PI / 2], [-w / 2 + r, -h / 2 + r, PI], [w / 2 - r, -h / 2 + r, 1.5 * PI]]; for (const [cx, cy, a0] of cs) for (let k = 0; k <= n; k++) { const a = a0 + k / n * PI / 2; P.push(new THREE.Vector2(cx + r * Math.cos(a), cy + r * Math.sin(a))); } return P; }
const extrudeShape = (s, depth, bev = .001, segs = 3, curve = 48) => new THREE.ExtrudeGeometry(s, { depth: Math.max(.0001, depth - 2 * bev), bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelSegments: segs, curveSegments: curve }).translate(0, 0, bev);
function smoothClosed(ctrl, n) { const c = new THREE.CatmullRomCurve3(ctrl.map(p => V3(p[0], p[1], 0)), true, 'centripetal'); return c.getSpacedPoints(n).slice(0, n).map(p => new THREE.Vector2(p.x, p.y)); }
const mirrorHalf = half => [...half, ...half.slice(1, -1).reverse().map(p => [p[0], -p[1]])];

/* ====================================== 1. SELLA SOLO BOBBER ====================================== */
function buildSeat(o) {
  const G = new THREE.Group(), Z = new THREE.Group(); Z.rotation.x = -PI / 2; G.add(Z);
  const k = { S: .9, M: 1, L: 1.1 }[o.misura] || 1;
  const half = [[.190, 0], [.186, .022], [.166, .035], [.122, .046], [.072, .061], [.022, .088], [-.030, .117], [-.080, .137], [-.125, .146], [-.161, .141], [-.184, .121], [-.196, .085], [-.201, .040], [-.202, 0]].map(p => [p[0] * k, p[1] * k]);
  const outline = smoothClosed(mirrorHalf(half), 300);
  const c = new THREE.Vector2(-.045 * k, 0), panel = .8, A = o.trapuntatura === 'liscia' ? 0 : .0058;
  const cell = .046 * k, rt2 = Math.SQRT2;
  const zTop = (x, y, s) => {
    let z = .052 + .032 * sstep(-.05 * k, -.205 * k, x) + .007 * sstep(.08 * k, .19 * k, x) - .011 * Math.exp(-Math.pow((x + .02 * k) / (.09 * k), 2)) + .016 * (1 - s * s);
    if (A) { const m = 1 - sstep(panel - .05, panel - .005, s); let puff;
      if (o.trapuntatura === 'righe') puff = Math.pow(Math.abs(Math.sin(PI * y / (cell * .72))), .55);
      else { const u = (x + y) / (rt2 * cell), v = (x - y) / (rt2 * cell); puff = Math.pow(Math.abs(Math.sin(PI * u) * Math.sin(PI * v)), .62); }
      z += A * puff * m - .0019 * Math.exp(-Math.pow((s - panel) / .013, 2)); }
    return z;
  };
  const C = cushion(outline, c, { rho: .021 * k, zTop, bottom: .011, bulge: .0018, Ns: 74, Nr: 14, Nd: 8, tuck: .006 });
  Z.add(mesh(C.geo, leather(o.pelle, o.tipo, 'Pelle', 15)));
  const tm = threadMat(o.cuciture, o.pelle);
  if (A) {
    Z.add(stitches(C.ring(panel + .028), tm));
    const lines = [];
    if (o.trapuntatura === 'righe') { for (let y0 = -.26 * k; y0 <= .26 * k; y0 += cell * .72) { const L = []; for (let x = -.22 * k; x <= .21 * k; x += .002) L.push([x, y0]); lines.push(L); } }
    else for (let kk = -14; kk <= 14; kk++) for (const fam of [1, -1]) { const L = []; const a = kk * cell * rt2; for (let t = -.4; t <= .4; t += .002) { const x = (a + t) / 2, y = fam > 0 ? (a - t) / 2 : (t - a) / 2; L.push([x, y]); } lines.push(L); }
    for (const L of lines) { let seg = []; const flush = () => { if (seg.length > 3) Z.add(stitches(seg, tm)); seg = []; };
      for (const [x, y] of L) { const s = C.sAt(x, y); if (s < panel - .02) seg.push({ p: C.top(x, y), n: C.nTop(x, y) }); else flush(); } flush(); }
  }
  Z.add(stitches(C.ring(.965), tm));
  if (o.piping !== 'no') { const pm = o.piping === 'contrasto' ? leather(o.pelle === 'nero' ? 'cuoio' : 'nero', 'liscia', 'Cordoncino', 30) : leather(o.pelle, o.tipo, 'Cordoncino', 30);
    const pr = .0031, f = PI / 4; const R2 = C.rollRing(f).slice(0, -1).map(s => s.p.clone().addScaledVector(s.n, pr * .55)); Z.add(mesh(closedSpline(R2, 600, pr, 12), pm)); }
  const pa = mesh(extrudeShape(shapeFrom(outline.map(p => c.clone().lerp(p, .985))), .007, .0018, 3, 64), metal(o.scocca || 'wrinkle', 'Fondo sella')); pa.position.z = .004; Z.add(pa);
  if (o.molle !== 'no') { const sm = metal(o.finitura_molle || 'chrome', 'Molle');
    for (const sy of [1, -1]) { const pts = []; const turns = 6.5, H = .078; for (let i = 0; i <= turns * 40; i++) { const t = i / (turns * 40), a = t * turns * 2 * PI, r = .0155 + .0065 * Math.sin(PI * t); pts.push(V3(Math.cos(a) * r, Math.sin(a) * r, -t * H)); }
      const sp = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 700, .0029, 10), sm); sp.position.set(-.135 * k, sy * .078 * k, .004); Z.add(sp);
      for (const zz of [.002, -.082]) { const cup = mesh(lathe([[0, -.002], [.019, -.002], [.021, 0], [.019, .002], [0, .002]], 40, .0006), sm); cup.rotation.x = PI / 2; cup.position.set(-.135 * k, sy * .078 * k, zz); Z.add(cup); } } }
  const tab = mesh(extrudeShape(roundRect(.036, .028, .006), .004, .001), metal('satin', 'Staffa')); tab.position.set(.185 * k, 0, 0); Z.add(tab);
  const bolt = capScrew(.008, metal('chrome', 'Viteria'), darkMat()); bolt.rotation.x = PI / 2; bolt.position.set(.193 * k, 0, .006); Z.add(bolt);
  return G;
}

/* ====================================== 2. BORSA LATERALE IN CUOIO ====================================== */
function buildBag(o) {
  const G = new THREE.Group();
  const L = o.lunghezza, H = o.altezza, D = o.profondita, rr = .028, b = .011;
  const lm = leather(o.pelle, o.tipo, 'Pelle', 14), tm = threadMat(o.cuciture, o.pelle), hw = metal(o.ferramenta, 'Fibbie');
  const bodyG = new RoundedBoxGeometry(L, H, D, 8, rr); const pos = bodyG.attributes.position, nor0 = bodyG.attributes.normal, uv = bodyG.attributes.uv;
  const bulge = (x, y) => b * (1 - Math.pow(Math.min(1, Math.abs(x) / (L / 2)), 4)) * (1 - Math.pow(Math.min(1, Math.abs(y) / (H / 2)), 4));
  for (let i = 0; i < pos.count; i++) { let x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i); const ry = y / (H / 2);
    const fz = Math.max(0, (Math.abs(z) - (D / 2 - rr)) / rr); z += Math.sign(z) * bulge(x, y) * fz;
    const fx = Math.max(0, (Math.abs(x) - (L / 2 - rr)) / rr); x += Math.sign(x) * .0035 * (1 - Math.pow(Math.abs(ry), 4)) * fx;
    z *= 1 - .1 * Math.max(0, -ry); pos.setXYZ(i, x, y, z);
    const nx = Math.abs(nor0.getX(i)), ny = Math.abs(nor0.getY(i)), nz = Math.abs(nor0.getZ(i));
    if (nz >= nx && nz >= ny) uv.setXY(i, x, y); else if (nx >= ny) uv.setXY(i, z + 3, y); else uv.setXY(i, x, z + 5); }
  bodyG.computeVertexNormals(); G.add(mesh(bodyG, lm));
  const frontZ = (x, y) => { const ry = y / (H / 2); let z; const ex = Math.abs(x) - (L / 2 - rr), ey = Math.abs(y) - (H / 2 - rr);
    if (ex <= 0 && ey <= 0) z = D / 2 + bulge(x, y); else { const dx = Math.max(0, ex), dy = Math.max(0, ey); const d = Math.min(rr, Math.hypot(dx, dy)); z = D / 2 - rr + Math.sqrt(Math.max(0, rr * rr - d * d)) + bulge(x, y) * (1 - d / rr); }
    return z * (1 - .1 * Math.max(0, -ry)); };
  const off = rr * (1 - Math.SQRT1_2);
  for (const sg of [1, -1]) { const pts = roundRectPts(L - 2 * off, H - 2 * off, rr * .9, 12).map(p => V3(p.x, p.y, sg * ((D / 2 - off) * (1 - .1 * Math.max(0, -p.y / (H / 2)))) + sg * .0012));
    G.add(mesh(closedSpline(pts, 500, .0032, 10), lm)); }
  const flapLen = H * (o.patta === 'corta' ? .42 : .56), t = .0042, W = L - .01, rc = .045;
  const topLen = D - rr - .016, arcLen = PI / 2 * (rr + t), frontLen = flapLen - rr, S = topLen + arcLen + frontLen;
  const F = (x, v) => {
    if (v <= topLen) { const z = -D / 2 + .016 + v; return { p: V3(x, H / 2 + t, z), n: V3(0, 1, 0) }; }
    if (v <= topLen + arcLen) { const a = (v - topLen) / (rr + t); const zc = frontZ(x, H / 2 - rr) - rr; return { p: V3(x, H / 2 - rr + (rr + t) * Math.cos(a), zc + (rr + t) * Math.sin(a)), n: V3(0, Math.cos(a), Math.sin(a)) }; }
    const y = H / 2 - rr - (v - topLen - arcLen); const z = frontZ(x, y) + t; const e = .002; const dzx = (frontZ(x + e, y) - frontZ(x - e, y)) / (2 * e), dzy = (frontZ(x, y + e) - frontZ(x, y - e)) / (2 * e); return { p: V3(x, y, z), n: V3(-dzx, -dzy, 1).normalize() };
  };
  const vmax = x => { const du = W / 2 - Math.abs(x); return du < rc ? S - (rc - Math.sqrt(Math.max(0, rc * rc - (rc - du) * (rc - du)))) : S; };
  const NU = 120, NV = 110, P = [], I = [], UV = [];
  for (let i = 0; i <= NU; i++) { const x = -W / 2 + W * i / NU, vm = vmax(x); for (let j = 0; j <= NV; j++) { const v = vm * j / NV, f = F(x, v); P.push(f.p.x, f.p.y, f.p.z); UV.push(x, v); } }
  for (let i = 0; i < NU; i++) for (let j = 0; j < NV; j++) { const a = i * (NV + 1) + j, bb = a + NV + 1; I.push(a, a + 1, bb, bb, a + 1, bb + 1); }
  const fg = new THREE.BufferGeometry(); fg.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); fg.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); fg.setIndex(I); fg.computeVertexNormals();
  const flm = lm.clone(); flm.side = THREE.DoubleSide; G.add(mesh(fg, flm));
  const edge = [];
  for (let j = 0; j <= 60; j++) edge.push(F(-W / 2, vmax(-W / 2) * j / 60));
  for (let i = 1; i <= NU; i++) { const x = -W / 2 + W * i / NU; edge.push(F(x, vmax(x))); }
  for (let j = 60; j >= 0; j--) edge.push(F(W / 2, vmax(W / 2) * j / 60));
  G.add(mesh(tubeAlong(new THREE.CatmullRomCurve3(dedupe(edge.map(e => e.p.clone().addScaledVector(e.n, -.0012)), 1e-5)), .0026, 700, 10), lm));
  const ins = .009, st = [];
  for (let j = 0; j <= 60; j++) st.push(F(-W / 2 + ins, (vmax(-W / 2 + ins) - ins) * j / 60));
  for (let i = 1; i < 120; i++) { const x = -W / 2 + ins + (W - 2 * ins) * i / 120; st.push(F(x, vmax(x) - ins)); }
  for (let j = 60; j >= 0; j--) st.push(F(W / 2 - ins, (vmax(W / 2 - ins) - ins) * j / 60));
  G.add(stitches(st, tm));
  const buckle = () => { const g = new THREE.Group(); const fw = .036, fh = .03, r = .0017;
    g.add(mesh(closedSpline(roundRectPts(fw, fh, .007, 8).map(p => V3(p.x, p.y, 0)), 160, r, 10), hw));
    const bar = mesh(new THREE.CylinderGeometry(r * 1.6, r * 1.6, fw, 16), hw); bar.rotation.z = PI / 2; g.add(bar);
    g.add(mesh(tubeAlong(bentPath([V3(0, 0, 0), V3(0, fh * .5, .002), V3(0, fh * .62, -.002)], .004), r * .9, 40, 8), hw)); return g; };
  if (o.stile === 'fibbie') for (const sx of [-1, 1]) { const x0 = sx * L * .27, sw = .028, yb = H / 2 - flapLen - .035;
    const upper = []; for (let j = 0; j <= 80; j++) { const v = .02 + (vmax(x0) - .02) * j / 80; const f = F(x0, v); upper.push({ p: f.p.clone().addScaledVector(f.n, .0005), n: f.n }); }
    for (let j = 1; j <= 24; j++) { const yy = H / 2 - flapLen - j / 24 * ((H / 2 - flapLen) - (yb - .03)); upper.push({ p: V3(x0, yy, frontZ(x0, yy) + .0006), n: V3(0, 0, 1) }); }
    G.add(ribbon(upper, sw, .0032, lm, 1));
    const lower = []; for (let j = 0; j <= 20; j++) { const yy = yb + .006 - j / 20 * .07; lower.push({ p: V3(x0, yy, frontZ(x0, yy) + .0002), n: V3(0, 0, 1) }); } G.add(ribbon(lower, sw, .003, lm));
    const bk = buckle(); bk.position.set(x0, yb + .004, frontZ(x0, yb) + .0055); G.add(bk);
    G.add(ribbon([{ p: V3(x0, yb - .022, frontZ(x0, yb - .022) + .006), n: V3(0, 0, 1) }, { p: V3(x0, yb - .034, frontZ(x0, yb - .034) + .006), n: V3(0, 0, 1) }], sw + .006, .0026, lm));
    for (const yy of [yb - .055, yb - .065]) { const rv = mesh(lathe([[0, 0], [.0036, 0], [.0034, .0012], [0, .0016]], 20, .0004), hw, false); rv.rotation.x = PI / 2; rv.position.set(x0, yy, frontZ(x0, yy) + .003); G.add(rv); }
    for (let h = 0; h < 3; h++) { const yy = yb + .02 + h * .012; const hole = mesh(new THREE.CircleGeometry(.0018, 16), darkMat('Fori')); hole.position.set(x0, yy, frontZ(x0, yy) + .0046); G.add(hole); }
  }
  if (o.borchie === 'si') for (const sx of [-1, 1]) { const x0 = sx * (W / 2 - .045); const f = F(x0, vmax(x0) - .045); const cc = new THREE.Group();
    const cg = lathe([[0, .0065], [.006, .006], [.012, .0045], [.0165, .002], [.0175, 0], [0, 0]], 96, .0008); const pa2 = cg.attributes.position; for (let i = 0; i < pa2.count; i++) { const x = pa2.getX(i), z = pa2.getZ(i), a = Math.atan2(z, x), r = Math.hypot(x, z); const s = 1 + .07 * Math.cos(a * 12) * sstep(.008, .017, r); pa2.setX(i, x * s); pa2.setZ(i, z * s); } cg.computeVertexNormals();
    cc.add(mesh(cg, hw)); const sc = buttonScrew(.005, hw, darkMat()); sc.position.y = .0062; cc.add(sc);
    cc.quaternion.setFromUnitVectors(V3(0, 1, 0), f.n); cc.position.copy(f.p); G.add(cc); }
  return G;
}

/* ====================================== 3. FRECCIA (singola) ====================================== */
function buildIndicator(o) {
  const G = new THREE.Group(), Y = new THREE.Group(); Y.rotation.z = -PI / 2; G.add(Y);
  const fm = metal(o.finitura, 'Corpo'), rm = metal(o.ghiera === 'corpo' ? o.finitura : o.ghiera, 'Ghiera'), sm = metal('chrome', 'Stelo e dado'), lm = lens(o.lente, 'Lente');
  const micro = o.stile === 'micro', R = micro ? .0058 : .0106, k = R / .0106;
  let body;
  if (o.stile === 'cilindro' || micro) body = [[0, -.028 * k], [.006 * k, -.028 * k], [R * .96, -.0275 * k], [R, -.026 * k], [R, -.001], [R * .9, 0]];
  else if (o.stile === 'cono') body = [[0, -.034], [.0032, -.034], [.0042, -.033], [R * .96, -.002], [R * .9, 0]];
  else body = [[0, -.031], [.0035, -.0306], [.0068, -.0292], [.009, -.0262], [.0102, -.0215], [R, -.015], [R, -.001], [R * .9, 0]];
  Y.add(mesh(lathe(body, 96, .0005 * k), fm));
  Y.add(mesh(lathe([[R * .89, -.0006], [R * 1.02, -.0006], [R * 1.06, .0006], [R * 1.06, .0028 * k], [R, .0036 * k], [R * .89, .0039 * k], [R * .86, .0033 * k]], 96, .0004), rm));
  const dome = (o.stile === 'cilindro' || micro) ? [[R * .87, .003 * k], [R * .87, .0046 * k], [R * .8, .0056 * k], [0, .0062 * k]] : [[R * .87, .003], [R * .87, .0055], [R * .8, .009], [R * .63, .0118], [R * .36, .0133], [0, .0138]];
  Y.add(mesh(lathe(dome, 96, .0008 * k), lm));
  Y.add(mesh(lathe([[R * .85, .0026 * k], [R * .4, .0008 * k], [R * .12, .0005 * k]], 64, .0002), metal('chrome', 'Parabola')));
  const led = mesh(new THREE.BoxGeometry(.003 * k, .0008, .003 * k), new THREE.MeshPhysicalMaterial({ name: 'LED', color: 0xffe2a0, emissive: o.lente === 'rossa' ? 0x550000 : 0x553300, roughness: .3 })); led.position.y = .0012 * k; Y.add(led);
  const sr = micro ? .003 : .004, slen = o.stelo === 'lungo' ? .04 : .024, y0 = body[0][1];
  const rod = threadedRod(sr, slen, micro ? .001 : .00125, sm); rod.position.y = y0 - slen / 2; Y.add(rod);
  const wsh = mesh(lathe([[sr * 1.05, 0], [sr * 2.2, 0], [sr * 2.2, .0012], [sr * 1.05, .0012]], 40, .0002), sm, false); wsh.position.y = y0 - .005; Y.add(wsh);
  const nt = mesh(hexPrism(micro ? .01 : .013, micro ? .004 : .0055, sr), sm); nt.position.y = y0 - .009; Y.add(nt);
  Y.add(mesh(tubeAlong(bentPath([V3(0, y0 - slen, 0), V3(0, y0 - slen - .012, 0), V3(0, y0 - slen - .02, .008), V3(0, y0 - slen - .022, .022)], .008), .0019, 60, 12), rubber('Cavo'), false));
  return G;
}

/* ====================================== 4. FARO TONDO ====================================== */
function buildHeadlight(o) {
  const G = new THREE.Group(), Y = new THREE.Group(); Y.rotation.z = -PI / 2; G.add(Y);
  const R = { '4.5': .0572, '5.75': .073, '7': .0889 }[o.diametro] || .073;
  const bm = metal(o.finitura, 'Corpo faro'), rm = metal(o.ghiera, 'Ghiera'), dk = darkMat();
  Y.add(mesh(lathe([[0, -.95 * R], [.35 * R, -.93 * R], [.62 * R, -.86 * R], [.84 * R, -.70 * R], [.98 * R, -.45 * R], [1.06 * R, -.18 * R], [1.08 * R, -.02 * R], [1.08 * R, 0]], 160, .004), bm));
  Y.add(mesh(lathe([[1.03 * R, -.03 * R], [1.105 * R, -.012 * R], [1.128 * R, .02 * R], [1.128 * R, .07 * R], [1.1 * R, .108 * R], [1.0 * R, .124 * R], [.972 * R, .102 * R]], 160, .0012), rm));
  const scr = capScrew(.006, metal('chrome', 'Viteria'), dk); scr.rotation.z = PI / 2; scr.position.set(-1.128 * R - .0002, .045 * R, 0); Y.add(scr);
  const glassR = .985 * R, sag = .1 * R;
  const disc = new THREE.RingGeometry(.0001, glassR, 160, 40); const dp = disc.attributes.position, du = disc.attributes.uv;
  for (let i = 0; i < dp.count; i++) { const x = dp.getX(i), y = dp.getY(i), r = Math.hypot(x, y) / glassR; dp.setZ(i, sag * (1 - r * r)); du.setXY(i, x / (2 * glassR) + .5, y / (2 * glassR) + .5); }
  disc.computeVertexNormals(); disc.rotateX(-PI / 2); disc.translate(0, .055 * R, 0);
  if (o.stile === 'led') { // LED a proiettori (tipo «Daymaker»): parabola sfaccettata cromata, proiettore alto e basso, barra centrale, anello diurno
    Y.add(mesh(disc, new THREE.MeshPhysicalMaterial({ name: 'Vetro', color: 0xffffff, roughness: .01, transmission: 1, thickness: .002, ior: 1.5 })));
    const pr = []; for (let i = 0; i <= 24; i++) { const r = (.06 + .92 * i / 24) * R; pr.push(new THREE.Vector2(r, -.5 * R + r * r / (1.95 * R))); }
    const rg = new THREE.LatheGeometry(pr, 14).toNonIndexed(); rg.computeVertexNormals(); const fm = metal('chrome', 'Parabola').clone(); fm.flatShading = true; fm.roughness = .16; fm.emissive = new THREE.Color(0x2a2e34); fm.name = 'Parabola'; Y.add(mesh(rg, fm, false));
    for (const [xo, rr] of [[-.34 * R, .3 * R], [.4 * R, .19 * R]]) { const pj = new THREE.Group();
      pj.add(mesh(lathe([[0, -.32 * R], [rr * 1.18, -.3 * R], [rr * 1.22, -.05 * R], [rr * 1.12, 0]], 64, .001), dk));
      pj.add(mesh(new THREE.TorusGeometry(rr * 1.12, .018 * R, 10, 64).rotateX(PI / 2), metal('chrome', 'Ghiera proiettore')));
      const ln = mesh(new THREE.SphereGeometry(rr, 48, 24, 0, 2 * PI, 0, PI / 2), new THREE.MeshPhysicalMaterial({ name: 'Lente proiettore', color: 0xe8eeff, roughness: 0, transmission: 1, thickness: .02, ior: 1.6 })); ln.scale.y = .55; pj.add(ln);
      pj.position.set(xo, -.12 * R, 0); Y.add(pj); }
    const bar = mesh(new RoundedBoxGeometry(.06 * R, .05 * R, 1.5 * R, 2, .02 * R), metal('chrome', 'Barra faro')); bar.position.set(.04 * R, -.1 * R, 0); Y.add(bar);
    const halo = mesh(new THREE.TorusGeometry(.93 * R, .022 * R, 12, 160), new THREE.MeshPhysicalMaterial({ name: 'Anello LED', color: 0xffffff, emissive: 0xe8f0ff, emissiveIntensity: .9, roughness: .3 })); halo.rotation.x = PI / 2; halo.position.y = -.02 * R; Y.add(halo);
  } else {
    Y.add(mesh(disc, new THREE.MeshPhysicalMaterial({ name: 'Vetro', color: 0xffffff, roughness: .015, transmission: 1, thickness: .004, ior: 1.52, normalMap: T.lamp(), normalScale: new THREE.Vector2(.35, .35) })));
    const pr = []; for (let i = 0; i <= 30; i++) { const r = (.1 + .88 * i / 30) * R; pr.push([r, -.56 * R + r * r / (2.1 * R)]); } { const pm2 = metal('chrome', 'Parabola').clone(); pm2.roughness = .12; pm2.emissive = new THREE.Color(0x24282e); pm2.name = 'Parabola'; Y.add(mesh(lathe(pr, 160, 0), pm2)); }
    const bulb = mesh(new THREE.SphereGeometry(.12 * R, 32, 16), new THREE.MeshPhysicalMaterial({ name: 'Lampada', color: 0xffffff, roughness: .05, transmission: .9, thickness: .002 })); bulb.position.y = -.3 * R; Y.add(bulb);
    if (o.calotta !== 'no') { const cap = mesh(new THREE.SphereGeometry(.15 * R, 48, 24, 0, 2 * PI, 0, PI / 2), metal('chrome', 'Calotta')); cap.position.y = -.18 * R; Y.add(cap); }
  }
  if (o.visiera === 'si') Y.add(mesh(lathe([[1.135 * R, .02 * R], [1.14 * R, .2 * R], [1.12 * R, .45 * R], [1.09 * R, .55 * R], [1.08 * R, .53 * R], [1.1 * R, .44 * R], [1.115 * R, .2 * R], [1.11 * R, .02 * R]], 120, .0015, 1.5 * PI - 1.25, 2.5), rm));
  if (o.attacco === 'laterale') for (const s of [1, -1]) { const ear = mesh(lathe([[0, 0], [.011, 0], [.011, .012], [.008, .015], [0, .015]], 40, .0012), bm); ear.rotation.x = s * PI / 2; ear.position.set(0, -.45 * R, s * 1.0 * R); Y.add(ear);
    const bt = mesh(hexPrism(.014, .007, 0, .0006), metal('chrome', 'Viteria')); bt.rotation.x = s * PI / 2; bt.position.set(0, -.45 * R, s * (1.0 * R + .019)); Y.add(bt); }
  else { const stud = mesh(lathe([[0, 0], [.012, 0], [.012, .01], [.008, .014], [.008, .03], [0, .03]], 40, .001), bm); stud.rotation.z = PI / 2; stud.position.set(-1.0 * R, -.5 * R, 0); Y.add(stud);
    const nt = mesh(hexPrism(.019, .009, .007), metal('chrome', 'Viteria')); nt.rotation.z = PI / 2; nt.position.set(-1.0 * R - .035, -.5 * R, 0); Y.add(nt); }
  return G;
}

/* ====================================== 5. MANUBRIO APE HANGER ====================================== */
function buildBars(o) {
  const G = new THREE.Group();
  const rise = o.altezza * IN, Wh = o.larghezza * IN / 2, pull = o.arretramento * IN, rb = o.diametro === '1.25' ? .0159 : .0127;
  const bm = metal(o.finitura, 'Manubrio'), cw = 3.5 * IN, z1 = cw / 2 + .05;
  const half = [V3(0, 0, z1), V3(-.012, rise * .9, z1 + .03), V3(-pull * .45 - .03, rise, z1 + .075), V3(-pull - .045, rise - .012, Wh - .16), V3(-pull - .06, rise - .02, Wh)];
  const P = [...half.slice().reverse().map(p => V3(p.x, p.y, -p.z)), ...half];
  const R = [0, .03, .045, .06, .05, .055, .055, .05, .06, .045, .03];
  const path = bentPath(P, R); G.add(mesh(tubeAlong(path, rb, 700, 40), bm));
  for (const s of [1, -1]) { const km = bm.clone(); km.name = 'Zigrinatura'; km.normalMap = T.knurl(); km.normalScale = new THREE.Vector2(.9, .9); const k = mesh(new THREE.CylinderGeometry(rb + .0002, rb + .0002, .032, 48), km); k.rotation.x = PI / 2; k.position.z = s * cw / 2; G.add(k); }
  const gm = o.manopole === 'billet' ? metal(o.finitura_manopole || 'brushed', 'Manopole') : o.manopole === 'pelle' ? leather('nero', 'liscia', 'Manopole', 40) : rubber('Manopole');
  if (o.manopole === 'pelle') { gm.normalMap = T.wrap(); gm.normalMap.repeat.set(2, 6); gm.normalScale = new THREE.Vector2(.8, .8); }
  for (const t of [0, 1]) { const end = path.getPointAt(t), tan = path.getTangentAt(t).multiplyScalar(t ? 1 : -1).normalize();
    const g = new THREE.Group(); let prof;
    if (o.manopole === 'gomma') { prof = [[rb + .0005, 0], [.0205, .0015], [.0205, .009], [.0175, .012]]; for (let y = .014; y < .118; y += .0042) prof.push([.0172, y], [.0183, y + .0012], [.0183, y + .0026], [.0172, y + .0038]); prof.push([.0176, .122], [.0168, .126], [rb + .0005, .126]); }
    else if (o.manopole === 'billet') prof = [[rb + .0005, 0], [.019, .001], [.019, .124], [rb + .0005, .126]];
    else prof = [[rb + .0005, 0], [.0185, .002], [.0185, .124], [rb + .0005, .126]];
    g.add(mesh(lathe(prof, 64, .0004), gm));
    if (o.manopole === 'billet') for (const y of [.028, .063, .098]) { const ri = mesh(new THREE.TorusGeometry(.0192, .0028, 12, 64), rubber('Anelli manopole')); ri.rotation.x = PI / 2; ri.position.y = y; g.add(ri); }
    g.add(mesh(lathe([[0, .126], [.0175, .126], [.018, .13], [.0165, .133], [.012, .134], [0, .134]], 48, .0007), metal(['gloss', 'satin', 'wrinkle'].includes(o.finitura) ? 'gloss' : 'chrome', 'Tappi')));
    g.quaternion.setFromUnitVectors(V3(0, 1, 0), tan); g.position.copy(end).addScaledVector(tan, -.126 + .004); G.add(g); }
  return G;
}

/* ====================================== 6. SISSY BAR ====================================== */
function sissyPad(o, w = .24, h = .21) {
  // schienale imbottito: stessa tecnica della sella (cupola, bordo arrotondato, cordoncino, cuciture)
  const P = new THREE.Group(), Z = new THREE.Group(); P.add(Z);
  let ctrl;
  if (o.forma_schienale === 'ovale') ctrl = Array.from({ length: 18 }, (_, i) => { const a = i / 18 * 2 * PI; return [Math.cos(a) * w / 2, Math.sin(a) * h / 2]; });
  else if (o.forma_schienale === 'rettangolo') ctrl = roundRectPts(w * .92, h, .045, 3).map(p => [p.x, p.y]);
  else ctrl = [[w / 2, h * .34], [w * .47, h * .47], [w * .3, h * .5], [0, h * .5], [-w * .3, h * .5], [-w * .47, h * .47], [-w / 2, h * .34], [-w * .42, -h * .22], [-w * .33, -h * .45], [-w * .18, -h * .5], [0, -h * .5], [w * .18, -h * .5], [w * .33, -h * .45], [w * .42, -h * .22]];
  const outline = smoothClosed(ctrl, 240), c = new THREE.Vector2(0, 0), panel = .78, A = o.trapuntatura === 'liscia' ? 0 : .0045, cell = .04;
  const zTop = (x, y, s) => { let z = .036 + .016 * (1 - s * s);
    if (A) { const m = 1 - sstep(panel - .06, panel - .01, s); const puff = o.trapuntatura === 'righe' ? Math.pow(Math.abs(Math.sin(PI * x / (cell * .75))), .55) : Math.pow(Math.abs(Math.sin(PI * (x + y) / (Math.SQRT2 * cell)) * Math.sin(PI * (x - y) / (Math.SQRT2 * cell))), .62); z += A * puff * m - .0016 * Math.exp(-Math.pow((s - panel) / .014, 2)); }
    return z; };
  const C = cushion(outline, c, { rho: .016, zTop, bottom: .006, bulge: .0012, Ns: 64, Nr: 12, Nd: 6, tuck: .004 });
  Z.add(mesh(C.geo, leather(o.pelle, o.tipo || 'liscia', 'Schienale', 16)));
  const tm = threadMat(o.cuciture, o.pelle);
  if (A) { Z.add(stitches(C.ring(panel + .03), tm));
    if (o.trapuntatura === 'righe') for (let x0 = -w / 2; x0 <= w / 2; x0 += cell * .75) { let seg = []; for (let y = -h / 2; y <= h / 2; y += .002) { if (C.sAt(x0, y) < panel - .02) seg.push({ p: C.top(x0, y), n: C.nTop(x0, y) }); else { if (seg.length > 3) Z.add(stitches(seg, tm)); seg = []; } } if (seg.length > 3) Z.add(stitches(seg, tm)); }
    else for (let kk = -8; kk <= 8; kk++) for (const fam of [1, -1]) { let seg = []; const a = kk * cell * Math.SQRT2; for (let t = -.3; t <= .3; t += .002) { const x = (a + t) / 2, y = fam > 0 ? (a - t) / 2 : (t - a) / 2; if (C.sAt(x, y) < panel - .02) seg.push({ p: C.top(x, y), n: C.nTop(x, y) }); else { if (seg.length > 3) Z.add(stitches(seg, tm)); seg = []; } } if (seg.length > 3) Z.add(stitches(seg, tm)); } }
  Z.add(stitches(C.ring(.962), tm));
  const pr = .0027; Z.add(mesh(closedSpline(C.rollRing(PI / 4).slice(0, -1).map(q => q.p.clone().addScaledVector(q.n, pr * .55)), 500, pr, 10), leather(o.pelle, o.tipo || 'liscia', 'Cordoncino', 30)));
  const bp = mesh(extrudeShape(shapeFrom(outline.map(p => p.clone().multiplyScalar(.97))), .005, .0015, 2, 64), metal('satin', 'Piastra schienale')); bp.position.z = .001; Z.add(bp);
  P.rotation.y = PI / 2; return P;
}
function buildSissy(o) {
  const G = new THREE.Group(); const h = o.altezza * IN, w = .2, fm = metal(o.finitura, 'Sissy bar');
  const lean = Math.tan(11 * PI / 180), y0 = .05, X = y => -(y - y0) * lean;
  let P, R;
  if (o.stile === 'squadrato') { P = [V3(X(y0), y0, -w / 2), V3(X(h), h, -w / 2), V3(X(h), h, w / 2), V3(X(y0), y0, w / 2)]; R = [0, .045, .045, 0]; }
  else if (o.stile === 'rastremato') { P = [V3(X(y0), y0, -w / 2), V3(X(h * .55), h * .55, -w / 2), V3(X(h * .97), h * .97, -w * .2), V3(X(h), h, 0), V3(X(h * .97), h * .97, w * .2), V3(X(h * .55), h * .55, w / 2), V3(X(y0), y0, w / 2)]; R = [0, .12, .05, .08, .05, .12, 0]; }
  else { const t = h - w / 2; P = [V3(X(y0), y0, -w / 2), V3(X(t), t, -w / 2), V3(X(h), h, -w / 2), V3(X(h), h, w / 2), V3(X(t), t, w / 2), V3(X(y0), y0, w / 2)]; R = [0, .0001, w / 2, w / 2, .0001, 0]; }
  const path = bentPath(P, R);
  if (o.profilo === 'piatto') { const sh = roundRect(.009, .026, .0025); G.add(mesh(new THREE.ExtrudeGeometry(sh, { steps: 400, bevelEnabled: false, extrudePath: path }), fm)); }
  else G.add(mesh(tubeAlong(path, .0111, 700, 32), fm));
  // piastre laterali sagomate con asole di aggancio rapido
  const plateShape = () => { const s = shapeFrom(smoothClosed([[.125, .005], [.1, .03], [.045, .052], [.012, .078], [-.022, .07], [-.052, .04], [-.085, .012], [-.088, -.008], [-.06, -.02], [.0, -.018], [.08, -.016], [.12, -.01]], 160));
    for (const [hx, hy] of [[.09, .005], [-.062, .0]]) { const p = new THREE.Path(); const r = .0075, L = .016; p.absarc(hx, hy, r, PI / 2, 3 * PI / 2, false); p.lineTo(hx + L, hy - r); p.absarc(hx + L, hy, r, -PI / 2, PI / 2, false); p.lineTo(hx, hy + r); s.holes.push(p); } return s; };
  const pg = extrudeShape(plateShape(), .0055, .0016, 3, 64);
  for (const s of [1, -1]) { const g = mesh(pg, fm); g.position.set(X(y0) + .01, 0, s > 0 ? w / 2 - .0024 : -w / 2 - .0031); G.add(g);
    for (const [hx, hy] of [[.098, .005], [-.054, 0]]) { const pin = mesh(lathe([[0, 0], [.0105, 0], [.0105, .0025], [.0085, .0055], [0, .006]], 48, .0008), metal('chrome', 'Perni di aggancio')); pin.rotation.x = s * PI / 2; pin.position.set(X(y0) + .01 + hx, hy, s * (w / 2 + .0032)); G.add(pin); } }
  // saldature dei montanti nelle piastre
  for (const s of [1, -1]) { const wd = mesh(new THREE.TorusGeometry(.0118, .0022, 10, 40), fm); wd.rotation.x = PI / 2; wd.position.set(X(y0), y0 + .004, s * w / 2); G.add(wd); }
  if (o.schienale !== 'no') { const pad = sissyPad(o); const yp = Math.min(h - .12, Math.max(.2, h * .55)); pad.position.set(X(yp) + .014, yp, 0); G.add(pad);
    for (const s of [1, -1]) { const cl = mesh(new RoundedBoxGeometry(.018, .03, .022, 3, .004), metal('satin', 'Morsetti schienale')); cl.position.set(X(yp) + .004, yp, s * w / 2); G.add(cl); const bt = capScrew(.007, metal('chrome', 'Viteria'), darkMat()); bt.rotation.z = PI / 2; bt.position.set(X(yp) - .006, yp, s * w / 2); G.add(bt); } }
  if (o.portapacchi === 'si') { const yr = Math.max(.14, h * .3), xr = X(yr);
    const rp = bentPath([V3(xr - .005, yr, -w / 2 + .012), V3(xr - .22, yr - .01, -w / 2 + .012), V3(xr - .22, yr - .01, w / 2 - .012), V3(xr - .005, yr, w / 2 - .012)], .05);
    G.add(mesh(tubeAlong(rp, .0075, 300, 20), fm));
    for (let k = 1; k <= 3; k++) { const x = xr - .02 - k * .05; const cb = mesh(new THREE.CylinderGeometry(.0055, .0055, w - .024, 20), fm); cb.rotation.x = PI / 2; cb.position.set(x, yr - .006, 0); G.add(cb); } }
  return G;
}

/* ====================================== 7. PORTATARGA LATERALE ====================================== */
function buildPlate(o) {
  const G = new THREE.Group(), M = new THREE.Group(); G.add(M); if (o.lato === 'sinistro') M.scale.z = -1; // geometria base = lato destro (+z)
  const fm = metal(o.finitura, 'Portatarga'), ed = metal(o.finitura === 'contrast' ? 'bright' : o.finitura, 'Fresature');
  const pw = .175, ph = .145, fw = pw + .022, fh = ph + .022;
  const fr = roundRect(fw, fh, .014); fr.holes.push(roundRect(pw - .006, ph - .006, .007));
  const frame = mesh(new THREE.ExtrudeGeometry(fr, { depth: .004, bevelEnabled: true, bevelThickness: .0016, bevelSize: .0016, bevelSegments: 2, curveSegments: 40 }), [fm, ed]); frame.rotation.y = -PI / 2; frame.position.set(-.002, 0, fw / 2); M.add(frame);
  const back = mesh(extrudeShape(roundRect(fw - .004, fh - .004, .013), .003, .0008), fm); back.rotation.y = -PI / 2; back.position.set(.006, 0, fw / 2); M.add(back);
  const pgeo = extrudeShape(roundRect(pw, ph, .008), .0012, .0003); const uvp = pgeo.attributes.uv, pp = pgeo.attributes.position; for (let i = 0; i < uvp.count; i++) uvp.setXY(i, .5 - pp.getX(i) / pw, pp.getY(i) / ph + .5);
  const plate = mesh(pgeo, [new THREE.MeshPhysicalMaterial({ name: 'Targa', color: 0xffffff, map: T.plate(), roughness: .32, clearcoat: .6 }), new THREE.MeshPhysicalMaterial({ name: 'Bordo targa', color: 0xdedede, roughness: .4 })]);
  plate.rotation.y = PI / 2; plate.position.set(-.0035, 0, fw / 2); if (o.lato === 'sinistro') plate.scale.x = -1; M.add(plate);
  for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const sc = buttonScrew(.006, metal('chrome', 'Viteria'), darkMat()); sc.rotation.z = PI / 2; sc.position.set(-.0049, b * (ph / 2 - .012), fw / 2 + a * (pw / 2 - .014)); M.add(sc); }
  const hs = mesh(extrudeShape(roundRect(.075, .022, .007), .024, .0022), fm); hs.rotation.y = -PI / 2; hs.position.set(-.004, fh / 2 + .007, fw / 2); M.add(hs);
  const lw = mesh(new THREE.BoxGeometry(.016, .002, .06), new THREE.MeshPhysicalMaterial({ name: 'Luce targa', color: 0xffffff, emissive: 0xffffff, emissiveIntensity: .7, roughness: .2 })); lw.position.set(-.016, fh / 2 - .0045, fw / 2); M.add(lw);
  if (o.stop === 'si') { const st = mesh(new RoundedBoxGeometry(.004, .012, .066, 2, .0015), lens('rossa', 'Lente stop', true)); st.position.set(-.0285, fh / 2 + .007, fw / 2); M.add(st); }
  const al = o.braccio === 'lungo' ? .2 : .14;
  const path = bentPath([V3(.007, -.035, .025), V3(.05, -.035, .012), V3(al * .7, -.02, -.02), V3(al, -.005, -.045)], .04);
  M.add(mesh(new THREE.ExtrudeGeometry(roundRect(.012, .02, .004), { steps: 160, bevelEnabled: false, extrudePath: path }), fm));
  const boss = mesh(lathe([[.0125, -.012], [.023, -.012], [.024, -.011], [.024, .011], [.023, .012], [.0125, .012]], 64, .0012), fm); boss.rotation.x = PI / 2; boss.position.set(al + .006, -.005, -.052); M.add(boss);
  return G;
}

/* ====================================== 8. SPECCHIETTO ====================================== */
function buildMirror(o) {
  const G = new THREE.Group(), M = new THREE.Group(); G.add(M); if (o.lato === 'sinistro') M.scale.z = -1; // geometria base = lato destro (+z)
  const fm = metal(o.finitura, 'Specchietto'), gm = new THREE.MeshPhysicalMaterial({ name: 'Vetro specchio', color: 0xeef1f4, metalness: 1, roughness: 0 });
  const R = { '3': .038, '4': .05 }[o.misura] || .044;
  const head = new THREE.Group();
  if (o.forma === 'rettangolare') { const w = R * 3, hh = R * 1.45;
    const hg = new THREE.ExtrudeGeometry(roundRect(w, hh, R * .45), { depth: .006, bevelEnabled: true, bevelThickness: .008, bevelSize: .004, bevelSegments: 8, curveSegments: 48 }); hg.translate(0, 0, -.014); head.add(mesh(hg, fm));
    const gl = mesh(new THREE.ShapeGeometry(roundRect(w - .006, hh - .006, R * .4), 32), gm); gl.position.z = .0005; head.add(gl); }
  else { const sx = o.forma === 'ovale' ? 1.38 : 1; const hg = lathe([[0, -.024], [.25 * R, -.0235], [.55 * R, -.019], [.8 * R, -.012], [.96 * R, -.005], [R, 0], [R, .0022], [.965 * R, .0036]], 128, .001); hg.rotateX(PI / 2); hg.scale(sx, 1, 1); head.add(mesh(hg, fm));
    const th = Math.asin(.95 / 4); const cap = new THREE.SphereGeometry(4 * R, 96, 12, 0, 2 * PI, 0, th); cap.rotateX(PI / 2); cap.translate(0, 0, -4 * R * Math.cos(th) + .0026); cap.scale(sx, 1, 1); head.add(mesh(cap, gm)); }
  head.rotation.y = -PI / 2;
  const ball = mesh(new THREE.SphereGeometry(.0075, 32, 16), fm);
  if (o.forma === 'fine manubrio') { const dy = o.orientamento === 'orizzontale' ? -.015 : -.05; if (o.orientamento === 'alto') M.scale.y = -1;
    head.position.set(-.012, dy, .12); M.add(head); ball.position.set(.012, dy, .12); M.add(ball);
    M.add(mesh(tubeAlong(bentPath([V3(0, 0, 0), V3(0, 0, .03), V3(.015, dy * .8, .07), V3(.014, dy, .118)], .02), .0045, 120, 16), fm));
    const plug = mesh(lathe([[0, -.022], [.0105, -.022], [.0115, -.002], [.0125, 0], [.0125, .006], [0, .006]], 48, .0008), fm); plug.rotation.x = PI / 2; M.add(plug);
  } else {
    const Lst = o.stelo === 'lungo' ? .27 : .2; head.position.set(0, Lst, .055); M.add(head); ball.position.set(.026, Lst, .055); M.add(ball);
    M.add(mesh(tubeAlong(bentPath([V3(.03, Lst, .055), V3(.042, Lst - .02, .05), V3(.02, Lst * .45, .02), V3(0, .018, 0)], [0, .05, .08, 0]), .0042, 200, 16), fm));
    M.add(mesh(lathe([[0, 0], [.0085, 0], [.0085, .006], [.006, .012], [.0045, .02], [0, .02]], 48, .0008), fm));
    const hx = mesh(hexPrism(.017, .008, .005), metal('chrome', 'Dado')); hx.position.y = -.004; M.add(hx);
    const st = threadedRod(.005, .02, .00125, metal('chrome', 'Dado')); st.position.y = -.018; M.add(st); }
  return G;
}

/* ====================================== 9. FILTRO ARIA ====================================== */
function buildAir(o) {
  const G = new THREE.Group(), Z = new THREE.Group(); G.add(Z);
  const R = (o.diametro === '9' ? 9 : 7) * IN / 2;
  let outline;
  if (o.forma === 'goccia') outline = smoothClosed([[R, 0], [R * .78, R * .65], [0, R], [-R * .8, R * .76], [-R * 1.45, R * .32], [-R * 1.62, 0], [-R * 1.45, -R * .32], [-R * .8, -R * .76], [0, -R], [R * .78, -R * .65]], 280);
  else if (o.forma === 'ovale') outline = smoothClosed(Array.from({ length: 16 }, (_, i) => { const a = i / 16 * 2 * PI; return [Math.cos(a) * R * 1.32, Math.sin(a) * R]; }), 280);
  else outline = Array.from({ length: 280 }, (_, i) => { const a = i / 280 * 2 * PI; return new THREE.Vector2(Math.cos(a) * R, Math.sin(a) * R); });
  const c = new THREE.Vector2(o.forma === 'goccia' ? -R * .25 : 0, 0), cut = o.fresature === 'si', G3 = [.42, .62, .8];
  const zTop = (x, y, s) => { let z = .011 + .012 * Math.pow(Math.max(0, 1 - s * s), .9) + .003 * (1 - s); if (cut) for (const g of G3) z -= .0012 * sstep(.022, 0, Math.abs(s - g)); return z; };
  const C = cushion(outline, c, { rho: .011, zTop, bottom: 0, bulge: 0, Ns: 70, Nr: 12, Nd: 6, tuck: 0, matIndex: cut ? (j, i, Ns) => { const s = j / Ns; return G3.some(g => Math.abs(s - g) < .012) || (j > Ns + 2 && j < Ns + 8); } : null });
  const cm = metal(o.finitura, 'Coperchio'), em = metal('bright', 'Fresature');
  Z.add(mesh(C.geo, cut ? [cm, em] : cm));
  const bp = mesh(extrudeShape(shapeFrom(outline.map(p => c.clone().lerp(p, .985))), .005, .0015, 2, 64), metal('satin', 'Piastra')); bp.position.z = -.036; Z.add(bp);
  const N = outline.length, fcol = { rosso: 0xa3161b, nero: 0x1a1a1a, blu: 0x1c3a8a, grigio: 0x6a6c70 }[o.filtro] ?? 0xa3161b;
  const fmat = new THREE.MeshPhysicalMaterial({ name: 'Filtro', color: fcol, roughness: .85, sheen: .6, sheenColor: new THREE.Color(fcol).multiplyScalar(1.4), side: THREE.DoubleSide });
  const P = [], I = []; let arc = 0;
  for (let i = 0; i <= N; i++) { const k = i % N, a = outline[(k - 1 + N) % N], b = outline[(k + 1) % N], t = b.clone().sub(a).normalize(), n = new THREE.Vector2(t.y, -t.x); if (i) arc += outline[k].distanceTo(outline[(k - 1 + N) % N]);
    const base = c.clone().lerp(outline[k], .955); const pf = .0035 * Math.abs(Math.sin(arc / .0045 * PI)); const p = base.clone().addScaledVector(n, pf - .002);
    for (const z of [-.031, -.0035]) P.push(p.x, p.y, z); }
  for (let i = 0; i < N; i++) { const a = i * 2, b = a + 2; I.push(a, b, a + 1, b, b + 1, a + 1); }
  const fg = new THREE.BufferGeometry(); fg.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); fg.setIndex(I); fg.computeVertexNormals(); Z.add(mesh(fg, fmat));
  Z.add(mesh(closedSpline(outline.map(p => { const q = c.clone().lerp(p, .97); return V3(q.x, q.y, -.031); }), 400, .0022, 8), metal('satin', 'Piastra')));
  const top = C.top(c.x, c.y), mr = R * .36;
  const med = mesh(lathe([[0, .0075], [mr * .55, .0072], [mr * .92, .0062], [mr, .0045], [mr * 1.03, 0], [0, 0]], 128, .0012), cut ? em : metal(o.finitura === 'contrast' ? 'gloss' : o.finitura, 'Medaglione')); med.rotation.x = PI / 2; med.position.set(c.x, c.y, top.z - .0035); Z.add(med);
  const nut = mesh(lathe([[0, 0], [.009, 0], [.009, .004], [.0068, .007], [0, .0082]], 64, .0009), metal(['chrome', 'contrast'].includes(o.finitura) ? 'chrome' : o.finitura, 'Dado centrale')); nut.rotation.x = PI / 2; nut.position.set(c.x, c.y, top.z + .0035); Z.add(nut);
  return G;
}

/* ====================================== 10. SERBATOIO PEANUT ====================================== */
function buildTank(o) {
  const G = new THREE.Group();
  const [L, W, H] = { '2.1': [.46, .22, .17], '3.3': [.52, .25, .19], '4.5': [.58, .28, .2] }[o.capacita] || [.52, .25, .19];
  const tw = .036, th = .058, n = 2.7;
  const wq = u => W / 2 * Math.pow(Math.sin(PI * Math.pow(clamp(u, 0, 1), .85)), .42) * (1 - .42 * u * u);
  const hq = u => H * Math.pow(Math.sin(PI * Math.pow(clamp(u, 0, 1), .9)), .38) * (1 - .26 * Math.pow(u, 1.5));
  const NU = 170, NS = 140, P = [], I = [], UV = [];
  const sect = (u, t) => { const w = wq(u), h = hq(u), x = (.5 - u) * L; let y, z;
    if (t <= .6) { const a = t / .6 * PI, ca = Math.cos(a), sa = Math.sin(a); y = h * Math.pow(sa, 2 / n); z = w * Math.sign(ca) * Math.pow(Math.abs(ca), 2 / n); }
    else { const q = (t - .6) / .4; z = -w + 2 * w * q; const tww = Math.min(tw, w * .55), thh = Math.min(th, h * .45); y = Math.abs(z) < tww ? thh * Math.pow(1 - Math.pow(z / tww, 2), .55) : 0; }
    return V3(x, y, z); };
  for (let i = 0; i <= NU; i++) { const u = i / NU; for (let j = 0; j <= NS; j++) { const t = j / NS, p = sect(u, t); P.push(p.x, p.y, p.z); UV.push(u * L * 2, t * .7); } }
  for (let i = 0; i < NU; i++) for (let j = 0; j < NS; j++) { const a = i * (NS + 1) + j, b = a + NS + 1; I.push(a, a + 1, b, b, a + 1, b + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); g.setIndex(I); g.computeVertexNormals();
  const pm = paint(o.colore, o.vernice, 'Vernice serbatoio'); pm.side = THREE.DoubleSide; G.add(mesh(g, pm));
  const seam = []; for (let i = 0; i <= 120; i++) seam.push(sect(i / 120, .6)); for (let i = 119; i >= 1; i--) { const p = sect(i / 120, .6); p.z = -p.z; seam.push(p); }
  G.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(seam.filter((p, i, a) => !i || p.distanceTo(a[i - 1]) > 1e-5), true), 500, .0024, 10, true), pm));
  const uc = .3, pc = sect(uc, .3), e = .002; const nrm = sect(uc, .3 + e / 3).sub(sect(uc, .3 - e / 3)).cross(sect(uc + e, .3).sub(sect(uc - e, .3))).normalize(); if (nrm.y < 0) nrm.negate();
  const capG = new THREE.Group(), cm = metal(o.finitura_tappo, 'Tappo');
  if (o.tappo === 'a filo') { capG.add(mesh(lathe([[.026, -.004], [.034, -.004], [.0355, -.001], [.0345, .0022], [.03, .003], [0, .003]], 96, .0006), cm)); for (let k = 0; k < 8; k++) { const a = k / 8 * 2 * PI, sc = capScrew(.0045, metal('chrome', 'Viteria'), darkMat()); sc.position.set(Math.cos(a) * .0305, .0016, Math.sin(a) * .0305); sc.scale.setScalar(.8); capG.add(sc); } }
  else if (o.tappo === 'zigrinato') { const kn = cm.clone(); kn.normalMap = T.knurl(); kn.normalScale = new THREE.Vector2(1, 1); capG.add(mesh(lathe([[0, -.003], [.03, -.003], [.03, .014], [.027, .018], [0, .019]], 96, .0012), kn)); }
  else { capG.add(mesh(lathe([[0, -.003], [.031, -.003], [.033, .002], [.031, .008], [.022, .014], [0, .016]], 96, .0012), cm)); const hinge = mesh(new THREE.CylinderGeometry(.004, .004, .016, 16), cm); hinge.rotation.x = PI / 2; hinge.position.set(-.032, .004, 0); capG.add(hinge); const latch = mesh(new THREE.BoxGeometry(.01, .004, .012), cm); latch.position.set(.033, .006, 0); capG.add(latch); }
  capG.quaternion.setFromUnitVectors(V3(0, 1, 0), nrm); capG.position.copy(pc).addScaledVector(nrm, -.001); G.add(capG);
  if (o.rubinetto !== 'no') { const pk = new THREE.Group(), km = metal('chrome', 'Rubinetto'); pk.add(mesh(new RoundedBoxGeometry(.03, .024, .02, 4, .004), km)); const knob = mesh(lathe([[0, 0], [.009, 0], [.009, .006], [.006, .009], [0, .009]], 32, .001), km); knob.rotation.z = -PI / 2; knob.position.set(.015, 0, 0); pk.add(knob);
    const lev = mesh(new RoundedBoxGeometry(.004, .03, .008, 2, .0015), km); lev.position.set(.026, 0, 0); pk.add(lev); const nip = mesh(new THREE.CylinderGeometry(.004, .004, .025, 16), km); nip.position.y = -.024; pk.add(nip);
    pk.position.set((.5 - .68) * L, -.012, -wq(.68) * .55); G.add(pk); }
  for (const u of [.12, .86]) { const tb = mesh(new RoundedBoxGeometry(.03, .004, .026, 2, .0012), pm); tb.position.set((.5 - u) * L, .002, 0); G.add(tb); }
  return G;
}

/* ======================= CATALOGO PRO (definizioni + opzioni) ======================= */
const sel = (k, l, o, d) => ({ k, l, t: 'sel', o, d });
const num = (k, l, min, max, step, d, u = '') => ({ k, l, t: 'num', min, max, step, d, u });
const col = (k, l, d) => ({ k, l, t: 'col', d });
const YN = [['si', 'Sì'], ['no', 'No']];
export const PRO_DEFS = {
  sella_solo: { n: 'Sella solo bobber', cat: 'Selle', type: 'seat', b: 'Le Pera, Saddlemen, Burly, Biltwell', p: 31, build: buildSeat,
    opts: [sel('trapuntatura', 'Trapuntatura', [['rombi', 'A rombi (diamond)'], ['righe', 'A righe (tuck & roll)'], ['liscia', 'Liscia']], 'rombi'), sel('pelle', 'Colore pelle', LEATHER_COL, 'nero'), sel('tipo', 'Tipo di pelle', LEATHER_TYPE, 'liscia'), sel('cuciture', 'Cuciture', THREAD_COL, 'beige'), sel('piping', 'Cordoncino', [['tinta', 'In tinta'], ['contrasto', 'A contrasto'], ['no', 'Nessuno']], 'tinta'), sel('misura', 'Misura', [['S', 'Small'], ['M', 'Medium'], ['L', 'Large']], 'M'), sel('molle', 'Molle', YN, 'si'), sel('finitura_molle', 'Finitura molle', FIN_METAL, 'chrome'), sel('scocca', 'Fondo sella', FIN_METAL, 'wrinkle')] },
  borsa_cuoio: { n: 'Borsa laterale in cuoio', cat: 'Borse', type: 'bags', b: 'Texas Leather, Saddlemen, Longride', p: 1333, build: buildBag,
    opts: [sel('stile', 'Chiusura', [['fibbie', 'Cinghie con fibbie'], ['liscia', 'Patta liscia']], 'fibbie'), sel('pelle', 'Colore pelle', LEATHER_COL, 'marrone'), sel('tipo', 'Tipo di pelle', LEATHER_TYPE, 'invecchiata'), sel('cuciture', 'Cuciture', THREAD_COL, 'beige'), sel('ferramenta', 'Fibbie e borchie', FIN_METAL, 'chrome'), sel('borchie', 'Borchie (conchos)', YN, 'si'), sel('patta', 'Patta', [['lunga', 'Lunga'], ['corta', 'Corta']], 'lunga'), num('lunghezza', 'Lunghezza', .3, .5, .01, .4, 'm'), num('altezza', 'Altezza', .22, .36, .01, .29, 'm'), num('profondita', 'Profondità', .1, .2, .01, .14, 'm')] },
  freccia_bullet: { n: 'Freccia mini (singola)', cat: 'Luci', type: 'indicator', b: 'Kellermann, Highsider, Motogadget', p: 163, build: buildIndicator,
    opts: [sel('stile', 'Forma', [['proiettile', 'Proiettile'], ['cilindro', 'Cilindro'], ['cono', 'Cono'], ['micro', 'Micro Ø 12 mm']], 'proiettile'), sel('finitura', 'Corpo', FIN_METAL, 'gloss'), sel('ghiera', 'Ghiera', [['corpo', 'Come il corpo'], ...FIN_METAL], 'chrome'), sel('lente', 'Lente', LENS_COL, 'fume'), sel('stelo', 'Stelo M8', [['corto', 'Corto'], ['lungo', 'Lungo']], 'corto')] },
  faro: { n: 'Faro tondo', cat: 'Luci', type: 'headlight', b: 'Bates style, Cyron, Vision X, Highsider', p: 163, build: buildHeadlight,
    opts: [sel('diametro', 'Diametro', [['4.5', '4½"'], ['5.75', '5¾"'], ['7', '7"']], '5.75'), sel('stile', 'Ottica', [['vintage', 'Vintage a parabola'], ['led', 'LED con anello diurno']], 'vintage'), sel('finitura', 'Corpo', FIN_METAL, 'gloss'), sel('ghiera', 'Ghiera', FIN_METAL, 'chrome'), sel('visiera', 'Visiera', YN, 'no'), sel('calotta', 'Calotta lampada', YN, 'si'), sel('attacco', 'Attacco', [['laterale', 'Laterale'], ['inferiore', 'Inferiore']], 'laterale')] },
  ape_hanger: { n: 'Manubrio ape hanger', cat: 'Manubri', type: 'bars', b: 'Burly, Biltwell, Kustom Tech, LA Choppers', p: 873, build: buildBars,
    opts: [num('altezza', 'Altezza (pollici)', 6, 20, 1, 14, '"'), num('larghezza', 'Larghezza (pollici)', 26, 38, 1, 32, '"'), num('arretramento', 'Arretramento (pollici)', 0, 8, .5, 3, '"'), sel('diametro', 'Diametro', [['1', '1"'], ['1.25', '1¼" fat']], '1'), sel('finitura', 'Finitura', FIN_METAL, 'chrome'), sel('manopole', 'Manopole', [['gomma', 'Gomma rigata'], ['billet', 'Billet con anelli'], ['pelle', 'Pelle intrecciata']], 'gomma'), sel('finitura_manopole', 'Finitura manopole billet', FIN_METAL, 'brushed')] },
  sissy: { n: 'Sissy bar', cat: 'Selle', type: 'sissy', b: 'Cobra, Burly, Biltwell, Kustom Tech', p: 31, build: buildSissy,
    opts: [num('altezza', 'Altezza (pollici)', 10, 40, 1, 20, '"'), sel('stile', 'Forma', [['anello', 'Ad anello'], ['squadrato', 'King squadrato'], ['rastremato', 'Rastremato']], 'anello'), sel('profilo', 'Montanti', [['tubo', 'Tubo 7/8"'], ['piatto', 'Piatto d\'acciaio']], 'tubo'), sel('finitura', 'Finitura', FIN_METAL, 'chrome'), sel('schienale', 'Schienale', YN, 'si'), sel('forma_schienale', 'Forma schienale', [['trapezio', 'Trapezio'], ['ovale', 'Ovale'], ['rettangolo', 'Rettangolare']], 'trapezio'), sel('trapuntatura', 'Trapuntatura', [['righe', 'A righe'], ['rombi', 'A rombi'], ['liscia', 'Liscia']], 'righe'), sel('pelle', 'Pelle schienale', LEATHER_COL, 'nero'), sel('cuciture', 'Cuciture', THREAD_COL, 'beige'), sel('portapacchi', 'Portapacchi', YN, 'no')] },
  portatarga: { n: 'Portatarga laterale con luce', cat: 'Luci', type: 'light', b: 'Highsider, DMP, Kustom Tech', p: 163, build: buildPlate,
    opts: [sel('lato', 'Lato', [['sinistro', 'Sinistro'], ['destro', 'Destro']], 'sinistro'), sel('finitura', 'Finitura', FIN_METAL, 'contrast'), sel('stop', 'Stop/posizione LED', YN, 'si'), sel('braccio', 'Braccio', [['corto', 'Corto'], ['lungo', 'Lungo']], 'corto')] },
  specchietto: { n: 'Specchietto (singolo)', cat: 'Specchietti', type: 'mirror', b: 'Highsider, Kellermann, Motogadget, Rizoma', p: 873, build: buildMirror,
    opts: [sel('forma', 'Forma', [['tondo', 'Tondo'], ['ovale', 'Ovale'], ['rettangolare', 'Rettangolare cafe'], ['fine manubrio', 'Fine manubrio']], 'tondo'), sel('misura', 'Diametro', [['3', '3"'], ['3.5', '3½"'], ['4', '4"']], '3.5'), sel('finitura', 'Finitura', FIN_METAL, 'chrome'), sel('stelo', 'Stelo', [['corto', 'Corto'], ['lungo', 'Lungo']], 'corto'), sel('lato', 'Lato', [['sinistro', 'Sinistro'], ['destro', 'Destro']], 'sinistro'), sel('orientamento', 'Orientamento (fine manubrio)', [['basso', 'Verso il basso'], ['alto', 'Verso l\'alto'], ['orizzontale', 'Orizzontale']], 'basso')] },
  filtro_aria: { n: 'Filtro aria', cat: 'Aspirazione', type: 'air', b: 'S&S, RSD, Performance Machine, K&N', p: 315, build: buildAir,
    opts: [sel('forma', 'Forma', [['tondo', 'Tondo'], ['goccia', 'A goccia'], ['ovale', 'Ovale']], 'tondo'), sel('diametro', 'Misura', [['7', '7"'], ['9', '9"']], '7'), sel('finitura', 'Coperchio', FIN_METAL, 'chrome'), sel('fresature', 'Fresature a vista', YN, 'no'), sel('filtro', 'Elemento filtrante', [['rosso', 'Rosso'], ['nero', 'Nero'], ['blu', 'Blu'], ['grigio', 'Grigio']], 'rosso')] },
  serbatoio_peanut: { n: 'Serbatoio peanut', cat: 'Serbatoi', type: 'tank', b: 'serbatoi peanut / Sportster style', p: 1193, build: buildTank,
    opts: [sel('capacita', 'Capacità', [['2.1', '2,1 gal (8 l)'], ['3.3', '3,3 gal (12,5 l)'], ['4.5', '4,5 gal (17 l)']], '3.3'), col('colore', 'Colore', '#7a0c12'), sel('vernice', 'Vernice', PAINT_TYPE, 'candy'), sel('tappo', 'Tappo', [['pop-up', 'Pop-up'], ['a filo', 'A filo con viti'], ['zigrinato', 'Zigrinato vintage']], 'pop-up'), sel('finitura_tappo', 'Finitura tappo', FIN_METAL, 'chrome'), sel('rubinetto', 'Rubinetto', YN, 'si')] }
};
export const PRO_IDS = Object.keys(PRO_DEFS);
export function registerPro(id, def) { PRO_DEFS[id] = def; if (!PRO_IDS.includes(id)) PRO_IDS.push(id); }
export const H = { mesh, lathe, fillet, bentPath, tubeAlong, closedSpline, dedupe, hexPrism, capScrew, buttonScrew, threadedRod, stitches, ribbon, cushion, shapeFrom, roundRect, roundRectPts, extrudeShape, smoothClosed, mirrorHalf, metal, leather, threadMat, lens, paint, rubber, darkMat, T, V3, IN, PI, sstep, clamp, fract, sel, num, col, YN, RoundedBoxGeometry };
export function proDefaults(id) { const o = {}; for (const x of PRO_DEFS[id].opts) o[x.k] = x.d; return o; }
export function buildPro(id, opts = {}) {
  const d = PRO_DEFS[id]; const o = { ...proDefaults(id), ...opts }; const g = d.build(o);
  g.name = d.n; g.userData = { ...g.userData, type: d.type, pro: id, opts: o };
  return g;
}
