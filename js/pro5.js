/* NJ.D' RIDE – Libreria PRO (5): selle ricalcate dalle foto di riferimento dell'autore (profilo laterale, pianta, trapuntatura,
   pelli e cuciture). Tipologie senza marchi né loghi. © 2026 dott. Jonathan D'Eugenio – Tutti i diritti riservati (L. 633/1941). */
import * as THREE from 'three';
import { H, registerPro, LEATHER_COL, LEATHER_TYPE, THREAD_COL, LCOLS, TCOLS } from './pro.js';
import { seatPad, QUILT } from './pro3.js';
const { mesh, tubeAlong, smoothClosed, metal, leather, V3, PI, sstep, sel } = H;

const gauss = (x, c, w) => Math.exp(-Math.pow((x - c) / w, 2));
const mirror = half => smoothClosed([...half, ...half.slice(1, -1).reverse().map(p => [p[0], -p[1]])], 340);
const shrink = (pts, k, c = new THREE.Vector2(0, 0)) => pts.map(p => c.clone().lerp(p, k));

/* piante (metà destra, dal naso alla coda, metri) misurate sulle foto e riportate alle larghezze reali per modello */
const PL = {
  classica: [[.24, 0], [.235, .03], [.2, .05], [.12, .06], [.04, .09], [-.04, .15], [-.1, .175], [-.16, .17], [-.2, .13], [-.225, .06], [-.23, 0]],
  bobber: [[.24, 0], [.235, .03], [.19, .055], [.1, .07], [.02, .11], [-.07, .15], [-.14, .16], [-.2, .15], [-.23, .1], [-.24, 0]],
  molle: [[.2, 0], [.195, .03], [.15, .05], [.06, .09], [-.05, .15], [-.13, .17], [-.17, .15], [-.19, .09], [-.2, 0]],
  sportster: [[.3, 0], [.29, .03], [.23, .05], [.13, .06], [.03, .1], [-.06, .15], [-.14, .17], [-.2, .15], [-.24, .1], [-.25, 0]],
  king: [[.32, 0], [.31, .04], [.24, .07], [.14, .09], [.05, .15], [-.04, .165], [-.12, .15], [-.2, .13], [-.3, .135], [-.37, .11], [-.39, 0]],
  touring: [[.33, 0], [.32, .05], [.25, .08], [.14, .1], [.04, .18], [-.06, .2], [-.14, .17], [-.2, .12], [-.26, .15], [-.36, .15], [-.42, .1], [-.44, 0]],
  lunga: [[.36, 0], [.35, .04], [.28, .07], [.16, .09], [.05, .15], [-.05, .17], [-.15, .16], [-.25, .15], [-.33, .14], [-.38, .1], [-.4, 0]],
  biposto: [[.34, 0], [.33, .04], [.26, .065], [.15, .085], [.05, .145], [-.05, .165], [-.13, .15], [-.2, .12], [-.27, .13], [-.35, .12], [-.39, .08], [-.4, 0]],
  cafe: [[.3, 0], [.295, .05], [.26, .09], [.15, .1], [0, .105], [-.15, .11], [-.24, .105], [-.27, .07], [-.28, 0]],
  scrambler: [[.33, 0], [.325, .06], [.29, .095], [.15, .1], [0, .105], [-.15, .11], [-.28, .11], [-.31, .08], [-.32, 0]],
  schienale: [[.24, 0], [.235, .05], [.2, .09], [.1, .1], [0, .095], [-.1, .085], [-.2, .08], [-.235, .06], [-.24, 0]]
};
/* profili laterali (altezza aggiunta lungo x) */
const CR = {
  classica: x => .055 * sstep(-.08, -.2, x) + .02 * sstep(.08, .22, x) - .01 * gauss(x, -.01, .1),
  bobber: x => .125 * sstep(-.09, -.235, x) + .012 * sstep(.1, .24, x) - .008 * gauss(x, -.02, .09),
  inciso: x => .05 * sstep(-.1, -.22, x) + .014 * sstep(.1, .24, x) - .008 * gauss(x, -.02, .09),
  molle: x => .02 * sstep(-.08, -.18, x) + .01 * sstep(.08, .2, x) - .006 * gauss(x, 0, .08),
  sportster: x => .045 * sstep(-.08, -.2, x) + .012 * sstep(.1, .28, x) - .008 * gauss(x, .0, .1),
  king: x => -.012 * gauss(x, 0, .12) + .065 * sstep(-.1, -.24, x) + .1 * sstep(-.3, -.385, x) + .012 * sstep(.15, .3, x),
  touring: x => -.015 * gauss(x, 0, .13) + .05 * sstep(-.15, -.24, x) + .015 * sstep(.15, .3, x),
  lunga: x => .015 * sstep(.15, .33, x) + .08 * sstep(-.25, -.37, x) - .012 * gauss(x, 0, .12),
  biposto: x => .015 * sstep(.15, .32, x) + .055 * sstep(-.12, -.24, x) - .014 * gauss(x, 0, .12),
  biposto_alto: x => .015 * sstep(.15, .32, x) + .045 * sstep(-.12, -.22, x) + .05 * sstep(-.28, -.38, x) - .014 * gauss(x, 0, .12),
  cafe: x => .04 * sstep(-.17, -.26, x) - .006 * gauss(x, -.02, .1),
  piatta: x => -.004 * gauss(x, 0, .15),
  trasversali: x => .02 * sstep(.15, .32, x) + .03 * sstep(-.18, -.36, x) - .01 * gauss(x, 0, .12)
};

/* ogni modello: pianta, profilo, imbottitura, pelle, cuciture, cordoncino ed extra (borchie, frange, molle, pannelli, schienale) */
const SEATS = {
  classica_frange: { n: 'Solo classica con borchie e frange (foto 1)', pl: 'classica', cr: 'classica', h: .07, q: 'liscia', pelle: 'nero', tipo: 'liscia', cuc: 'tinta', pip: 'tinta', borchie: 'chrome', frange: true },
  cuscini_lucidi: { n: 'Scrambler a tre cuscini, pelle lucida (foto 2, 21)', pl: 'scrambler', cr: 'piatta', h: .085, q: 'trasversali', cell: .2, amp: .022, panel: .9, pelle: 'rosso', tipo: 'lucida', cuc: 'nero', pip: 'nero' },
  king_capitonne: { n: 'Biposto king capitonné con schienalino (foto 3)', pl: 'king', cr: 'king', h: .07, q: 'rombi', cell: .07, amp: .009, pelle: 'nero', tipo: 'liscia', cuc: 'tinta', pip: 'tinta' },
  touring_contorni: { n: 'Touring biposto scamosciata, cuciture a contorno rosse (foto 4, 5)', pl: 'touring', cr: 'touring', h: .075, q: 'contorni', rings: [.3, .45, .6, .75], pelle: 'nero', tipo: 'scamosciata', cuc: 'rosso', pip: 'nero', bordo: ['nero', 'liscia'] },
  bobber_righe_alto: { n: 'Bobber solo tuck & roll con schienalino (foto 6)', pl: 'bobber', cr: 'bobber', h: .07, q: 'righe', cell: .05, pelle: 'nero', tipo: 'liscia', cuc: 'tinta', pip: 'tinta' },
  solo_inciso: { n: 'Solo in cuoio inciso con borchie (foto 7, 10)', pl: 'bobber', cr: 'inciso', h: .07, q: 'liscia', pelle: 'cuoio', tipo: 'incisa', cuc: 'beige', pip: 'testa', borchie: 'chrome' },
  molle_bicolore: { n: 'Solo a molle bicolore con banda centrale (foto 8)', pl: 'molle', cr: 'molle', h: .055, q: 'liscia', pelle: 'nero', tipo: 'liscia', cuc: 'bianco', pip: 'tinta', molle: true, pannello: ['tan', 'liscia', .8], banda: 'nero' },
  touring_onde: { n: 'Touring biposto con cuciture a onda e cordoncino argento (foto 9)', pl: 'touring', cr: 'touring', h: .075, q: 'contorni', rings: [.38, .52, .66], pelle: 'nero', tipo: 'liscia', cuc: 'bianco', pip: 'grigio' },
  king_queen_alto: { n: 'Solo con schienale alto trapuntato (foto 11)', pl: 'bobber', cr: 'molle', h: .065, q: 'rombi', cell: .036, amp: .004, pelle: 'ardesia', tipo: 'liscia', cuc: 'tinta', pip: 'tinta', schienale: true },
  solo_bicolore_inciso: { n: 'Solo bicolore con pannello inciso (foto 12)', pl: 'bobber', cr: 'inciso', h: .068, q: 'liscia', pelle: 'nero', tipo: 'liscia', cuc: 'tinta', pip: 'tinta', pannello: ['marrone', 'incisa', .78] },
  touring_righe_grigie: { n: 'Biposto touring tuck & roll (foto 14)', pl: 'touring', cr: 'touring', h: .07, q: 'righe', cell: .05, pelle: 'nero', tipo: 'liscia', cuc: 'grigio', pip: 'tinta' },
  cafe_vintage: { n: 'Café racer in pelle invecchiata con bordo rialzato (foto 23)', pl: 'cafe', cr: 'cafe', h: .07, q: 'righe', cell: .06, amp: .0035, pelle: 'tan', tipo: 'invecchiata', cuc: 'tinta', pip: 'tinta' },
  long_legs: { n: 'Biposto lungo tuck & roll con schienalino (foto 24)', pl: 'lunga', cr: 'lunga', h: .07, q: 'righe', cell: .05, pelle: 'testa', tipo: 'liscia', cuc: 'tinta', pip: 'tinta' },
  rombi_rossi: { n: 'Biposto a rombi, cuciture rosse (foto 25)', pl: 'biposto', cr: 'biposto', h: .07, q: 'rombi', cell: .045, amp: .005, pelle: 'nero', tipo: 'liscia', cuc: 'rosso', pip: 'tinta' },
  rombi_doppi: { n: 'Biposto a rombi con passeggero alto (foto 26)', pl: 'biposto', cr: 'biposto_alto', h: .07, q: 'rombi', cell: .05, amp: .005, pelle: 'nero', tipo: 'liscia', cuc: 'bianco', pip: 'tinta' },
  sportster_banda: { n: 'Biposto Sportster a righe con banda tabacco (foto 27)', pl: 'biposto', cr: 'biposto', h: .068, q: 'righe', cell: .045, pelle: 'nero', tipo: 'liscia', cuc: 'beige', pip: 'tinta', banda_post: 'tan' },
  cuoio_rombi: { n: 'Biposto cuoio a rombi con inserto nero (foto 28)', pl: 'biposto', cr: 'biposto_alto', h: .07, q: 'rombi', cell: .045, amp: .005, pelle: 'tan', tipo: 'liscia', cuc: 'beige', pip: 'tinta', inserto_post: 'nero' },
  molle_cocco: { n: 'Solo a molle in stampa cocco (foto 29)', pl: 'molle', cr: 'molle', h: .055, q: 'liscia', pelle: 'marrone', tipo: 'cocco', cuc: 'beige', pip: 'testa', molle: true },
  solo_vintage: { n: 'Solo Sportster in pelle invecchiata (foto 30)', pl: 'sportster', cr: 'sportster', h: .068, q: 'liscia', pelle: 'marrone', tipo: 'invecchiata', cuc: 'tinta', pip: 'tinta' },
  biposto_trasversali: { n: 'Biposto a righe trasversali (foto 31)', pl: 'lunga', cr: 'trasversali', h: .068, q: 'trasversali', cell: .05, amp: .0055, pelle: 'nero', tipo: 'liscia', cuc: 'tinta', pip: 'tinta' }
};

function studs(Z, pts, fin, zb = () => 0, from = -1, to = .02) { // borchie cromate a cupola sul fianco, lungo la parte posteriore del bordo
  const sm = metal(fin, 'Borchie'), n = pts.length; let last = null;
  for (let i = 0; i < n; i++) { const p = pts[i], q = pts[(i + 1) % n]; if (p.x > to || p.x < from) continue; if (last && p.distanceTo(last) < .028) continue; last = p;
    const t = new THREE.Vector2(q.x - p.x, q.y - p.y).normalize(), nn = new THREE.Vector2(t.y, -t.x);
    const d = mesh(new THREE.SphereGeometry(.0055, 14, 8, 0, 2 * PI, 0, PI / 2), sm); d.position.set(p.x + nn.x * .0035, p.y + nn.y * .0035, .03 + zb(p.x, p.y)); d.quaternion.setFromUnitVectors(V3(0, 1, 0), V3(nn.x, nn.y, 0)); Z.add(d); }
}
function spring(x, y, h, r, turns, m) { const pts = []; for (let t = 0; t <= turns * 64; t++) { const a = t / 64 * 2 * PI; pts.push(V3(x + Math.cos(a) * r, y + Math.sin(a) * r, -t / (turns * 64) * h)); } return mesh(tubeAlong(new THREE.CatmullRomCurve3(pts), .0028, turns * 48, 8), m); }

function buildPhotoSeat(o) {
  const S = SEATS[o.modello] || SEATS.bobber_righe_alto, pelle = o.pelle === 'foto' ? S.pelle : o.pelle, cuc = o.cuciture === 'foto' ? S.cuc : o.cuciture;
  const base = { trapuntatura: S.q, pelle, tipo_pelle: S.tipo, cuciture: cuc, piping: S.pip, fondo: 'wrinkle' };
  let outline = mirror(PL[S.pl]), crown = CR[S.cr], zBot = null;
  const cfg = { h: S.h + .015, rho: .03, dome: .032, bulge: .007, cell: S.cell ?? .045, amp: S.amp, panel: S.panel ?? .8, bx: .5, by: .22, crown: (x, y) => crown(x, y), rings: S.rings };
  /* adattamento alla moto: pianta e fondo presi dalla sella di serie misurata sul modello (o.__fit), profilo e trapuntatura dalla foto */
  const F = o.__fit, P = PL[S.pl], pxMax = P[0][0], pxMin = P.at(-1)[0], Lp = pxMax - pxMin; const dxF = F ? F.L / 2 - pxMax : 0, mx = px => px + dxF; // posizionamento rigido, misure reali
  if (F) { const zr = F.bot(F.L / 2 - Lp * .35, 0), cr0 = crown; outline = mirror(P.map(q => [q[0] + dxF, q[1]])); crown = (x, y) => cr0(x - dxF, y); zBot = () => zr; cfg.zBot = zBot; cfg.crown = (x, y) => crown(x, y); cfg.bx = F.L / 2 + .02; }
  const W = new THREE.Group(); W.add(seatPad(base, outline, new THREE.Vector2(0, 0), cfg));
  // pannello centrale riportato (bicolore, inciso): stessa curvatura, 3 mm sopra la pelle esterna
  if (S.pannello) { const [pc, pt, k] = S.pannello; const inner = shrink(outline, k, new THREE.Vector2(-.02, 0)); W.add(seatPad({ ...base, pelle: pc, tipo_pelle: pt, trapuntatura: 'liscia', piping: 'no' }, inner, new THREE.Vector2(-.02, 0), { ...cfg, h: cfg.h + .003, rho: .012 })); }
  if (S.banda) { const half = [[.17, 0], [.17, .012], [-.15, .014], [-.19, 0]].map(q => [mx(q[0]), q[1]]); W.add(seatPad({ ...base, pelle: S.banda, trapuntatura: 'liscia', piping: 'no' }, mirror(half), new THREE.Vector2(0, 0), { ...cfg, h: cfg.h + .005, rho: .006 })); }
  if (S.banda_post || S.inserto_post) { const half = (S.banda_post ? [[-.26, 0], [-.26, .025], [-.37, .025], [-.37, 0]] : [[-.25, 0], [-.255, .07], [-.35, .075], [-.37, 0]]).map(q => [mx(q[0]), q[1]]);
    W.add(seatPad({ ...base, pelle: S.banda_post || S.inserto_post, trapuntatura: S.banda_post ? 'liscia' : 'rombi', piping: 'no' }, mirror(half), new THREE.Vector2(mx(-.31), 0), { ...cfg, h: cfg.h + .004, rho: .008, cell: .035, amp: .003 })); }
  const Z = new THREE.Group(); Z.rotation.x = -PI / 2; W.add(Z);
  if (S.borchie) studs(Z, outline, S.borchie, F ? F.bot : undefined);
  if (S.frange) { const lm = leather(pelle, 'liscia', 'Frange', 20); for (const s of [1, -1]) { const p = [], x0 = mx(pxMin) - .004; for (let k = 0; k <= 20; k++) { const t = k / 20; p.push(V3(x0 - .012 * t + .006 * Math.sin(t * 7 + s), s * (.008 + .02 * t), .03 - .13 * t + (F ? F.bot(x0, 0) : 0))); } Z.add(mesh(tubeAlong(new THREE.CatmullRomCurve3(p), .0026, 60, 6), lm)); }
    const cc = mesh(new THREE.CylinderGeometry(.013, .013, .003, 28), metal('chrome', 'Concho')); cc.rotation.z = PI / 2; cc.position.set(mx(pxMin) - .002, 0, .032 + (F ? F.bot(mx(pxMin), 0) : 0)); Z.add(cc); }
  if (S.molle) { const sm = metal('chrome', 'Molle'); for (const s of [1, -1]) Z.add(spring(mx(-.11), s * .085, .075, .02, 7, sm)); const piv = mesh(new THREE.CylinderGeometry(.006, .006, .06, 16), metal('satin', 'Perno sella')); piv.position.set(mx(.17), 0, -.012); Z.add(piv); }
  if (S.schienale) { const back = seatPad({ ...base }, mirror(PL.schienale), new THREE.Vector2(0, 0), { ...cfg, h: .05, crown: () => 0, bx: .3, by: .12 }); back.rotation.z = -PI / 2 + .16; back.position.set(mx(-.235), .27 + (F ? F.bot(mx(-.235), 0) : 0), 0); W.add(back);
    const st = mesh(new THREE.BoxGeometry(.012, .2, .05), metal('chrome', 'Supporto schienale')); st.position.set(mx(-.215), .08 + (F ? F.bot(mx(-.215), 0) : 0), 0); W.add(st); }
  // imbottitura modellata in Blender (pieghe vere, cuciture, cordoncino, occlusione cotta): sostituisce quella procedurale appena caricata
  const key = SEATS[o.modello] ? o.modello : 'bobber_righe_alto';
  if (!S.pannello && !S.banda && !S.banda_post && !S.inserto_post && window.__loadPart) window.__loadPart('sella3d_' + key).then(sc => {
    const pad = W.children[0]; if (!pad || W.userData.glbPad) return; const G = new THREE.Group(); G.name = 'Imbottitura';
    const hwP = x => { for (let i = 0; i < P.length - 1; i++) { const a = P[i], b = P[i + 1]; if (x <= a[0] && x >= b[0]) return a[1] + (b[1] - a[1]) * (a[0] - x) / Math.max(1e-6, a[0] - b[0]); } return 0; };
    const hwPmax = Math.max(...P.map(q => q[1])), Lp = P[0][0] - P.at(-1)[0];
    const mats = { Pelle: leather(pelle, S.tipo, 'Pelle', 14), Cuciture: new THREE.MeshStandardMaterial({ name: 'Cuciture', color: (cuc === 'tinta' ? LCOLS[pelle] : TCOLS[cuc]) ?? 0x222222, roughness: .75 }), Cordoncino: leather(S.pip === 'tinta' ? pelle : S.pip, 'liscia', 'Cordoncino', 30) };
    mats.Pelle.vertexColors = true; mats.Pelle.roughness = Math.max(mats.Pelle.roughness ?? .5, .58); if ('clearcoat' in mats.Pelle) mats.Pelle.clearcoat = Math.min(mats.Pelle.clearcoat || 0, .15); mats.Pelle.needsUpdate = true;
    sc.traverse(m => { if (!m.isMesh) return; const g = m.geometry.clone(); m.updateWorldMatrix(true, false); g.applyMatrix4(m.matrixWorld); const pa = g.attributes.position;
      // nessuna deformazione: la sella resta con le misure reali della foto; si appoggia solo al posto della sella di serie
      // (naso allineato davanti, fondo sul punto di appoggio del pilota). Ingrandire o rimpicciolire si fa a mano in «Sposta / misure».
      if (F) { const xr = F.L / 2 - Lp * .35, zr = F.bot(xr, 0), dx = F.L / 2 - P[0][0];
        for (let i = 0; i < pa.count; i++) pa.setX(i, pa.getX(i) + dx), pa.setY(i, pa.getY(i) + zr); }
      g.computeVertexNormals(); const nm = (m.material && m.material.name || '').split('.')[0]; const mm = new THREE.Mesh(g, mats[nm] || mats.Pelle); mm.castShadow = mm.receiveShadow = true; G.add(mm); });
    W.remove(pad); W.add(G); W.userData.glbPad = true; W.dispatchEvent({ type: 'ready' }); }).catch(e => console.warn('sella3d', e && e.message));
  return W;
}
registerPro('sella_foto', { n: 'Selle dalle foto di riferimento', cat: 'Selle', type: 'seat', b: 'Ricalcate dalle immagini dell\'autore', p: 31, build: buildPhotoSeat,
  opts: [sel('modello', 'Modello', Object.entries(SEATS).map(([k, v]) => [k, v.n]), 'bobber_righe_alto'),
    sel('pelle', 'Colore pelle', [['foto', 'Come in foto'], ...LEATHER_COL], 'foto'), sel('cuciture', 'Cuciture', [['foto', 'Come in foto'], ...THREAD_COL], 'foto')] });
export const PHOTO_SEATS = Object.keys(SEATS);
