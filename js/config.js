/* NJ.D' RIDE – configuratore grafico: selezione col clic, menu rapido, cronologia annulla/ripristina,
   sostituzione automatica dei pezzi di serie, accessori correlati obbligatori e riepilogo della configurazione.
   © 2026 dott. Jonathan D'Eugenio – Tutti i diritti riservati (L. 633/1941). */
import * as THREE from 'three';
import { OutlinePass } from 'three/addons/postprocessing/OutlinePass.js';
import { buildPro, PRO_DEFS } from './pro.js';
import { CATALOG } from './catalog.js';
import * as ST from './stock.js';
import { EXH, EXH_CUT } from './exhdata.js';

/* ---------- postazioni (slot) dei pezzi sostituibili ---------- */
export const SLOTS = [
  { id: 'manubrio', n: 'Manubrio', ic: '⟟', cats: ['Manubri'], ids: ['ape_hanger', 'semimanubri'] },
  { id: 'sella', n: 'Sella', ic: '◒', cats: ['Selle'], ids: ['sella_foto', 'sella_solo', 'sella_cafe'], pc: ['Sella'] },
  { id: 'scarico', n: 'Scarico', ic: '≋', cats: ['Scarichi'], pc: ['Scarico'] },
  { id: 'ruote', n: 'Ruote', ic: '◎', cats: ['Ruote'], pc: ['Cerchi', 'Pneumatici'] },
  { id: 'specchietti', n: 'Specchietti', ic: '◐', cats: ['Specchietti'], pc: ['Vetri e specchi'] },
  { id: 'faro', n: 'Faro', ic: '◉', cats: ['Luci'], ids: ['faro', 'griglia_faro'] },
  { id: 'frecce', n: 'Frecce e fanalino', ic: '◆', cats: ['Luci'], ids: ['freccia_bullet', 'fanalino', 'portatarga'] },
  { id: 'carena', n: 'Carena e cupolino', ic: '◠', cats: ['Carene'] },
  { id: 'serbatoio', n: 'Serbatoio', ic: '⬮', cats: ['Serbatoi'] },
  { id: 'parafanghi', n: 'Parafanghi', ic: '◡', cats: ['Parafanghi'] },
  { id: 'comandi', n: 'Pedane e comandi', ic: '⊥', cats: ['Comandi'] },
  { id: 'sospensioni', n: 'Sospensioni', ic: '⌇', cats: ['Sospensioni'] },
  { id: 'motore', n: 'Motore e filtro', ic: '⚙', cats: ['Motore', 'Filtri aria'] },
  { id: 'borse', n: 'Borse e schienali', ic: '▭', cats: ['Borse', 'Selle'], ids: ['borsa_cuoio', 'sissy', 'portapacchi'] },
  { id: 'codino', n: 'Codino', ic: '◣', cats: ['Codini'] },
  { id: 'strumenti', n: 'Strumenti', ic: '◷', cats: ['Strumenti'] },
];
const slotById = id => SLOTS.find(s => s.id === id);
export function itemsForSlot(s) {
  return CATALOG.filter(c => s.cats.includes(c.cat) && (!s.ids || !c.id || s.ids.includes(c.id)) && !(s.id === 'borse' && c.cat === 'Selle' && c.id !== 'sissy'));
}
export function slotOfItem(it) {
  if (it.id) { const s = SLOTS.find(s => s.ids && s.ids.includes(it.id)); if (s) return s; }
  return SLOTS.find(s => s.cats.includes(it.cat) && !s.ids) || SLOTS.find(s => s.cats.includes(it.cat));
}

/* ---------- accessori correlati: cosa serve davvero per montare il pezzo ---------- */
const K = (k, n, why, add) => ({ k, n, why, add });
export function kitFor(it) {
  const o = it.o || {}, L = [];
  switch (it.id) {
    case 'semimanubri':
      L.push(K('CG-K-0101', 'Tubo freno anteriore e cavi accorciati', 'i semimanubri sono più bassi e vicini al cannotto: tubo freno, cavo frizione/gas e cablaggi originali risultano troppo lunghi.'));
      L.push(K('CG-K-0102', 'Piastra di sterzo superiore compatibile o distanziali', `i clip-on si serrano sugli steli Ø ${o.forcella || 41} mm sotto la piastra: verifica gioco con serbatoio e finecorsa di sterzo.`));
      L.push(K('CG-PDA', 'Pedane arretrate (rearset) — coppia', 'con i semimanubri la posizione di guida si carica in avanti: le pedane arretrate ne completano l\'ergonomia.', { id: 'pedane_arretrate', both: true }));
      L.push(K('CG-SPE', 'Specchietti fine manubrio (coppia)', 'gli specchietti originali si montano sul manubrio che viene rimosso.', { id: 'specchietto', o: { forma: 'fine manubrio' }, slot: 'specchietti' }));
      break;
    case 'ape_hanger': {
      const h = +o.altezza || 14, d = Math.max(0, h - 10);
      L.push(K('CG-K-0201', `Kit cavi e tubo freno allungati (+${d || 2}")`, `un ape hanger da ${h}" è più alto del manubrio di serie: cavi frizione/gas e tubo freno vanno allungati.`));
      if (h >= 12) L.push(K('CG-K-0202', 'Prolunga cablaggio comandi al manubrio', 'i blocchetti elettrici devono arrivare alle nuove estremità.'));
      if (o.diametro === '1.25') L.push(K('CG-K-0203', 'Cavallotti/riser per tubo 1¼"', 'il diametro fat non entra nei cavallotti da 1".'));
      break; }
    case 'scarico':
      L.push(K('CG-FIL', 'Filtro aria a flusso libero', 'uno scarico libero va accoppiato a più aria in aspirazione.', { id: 'filtro_aria' }));
      L.push(K('CG-K-0301', 'Rimappatura centralina (servizio officina)', 'senza rimappatura la carburazione risulta magra con rischio di surriscaldamento.'));
      L.push(K('CG-K-0302', 'db-killer e certificato di omologazione', 'senza omologazione/db-killer lo scarico non è conforme al Codice della Strada (art. 72/78).'));
      break;
    case 'cerchio':
      if (+o.diametro >= 21) L.push(K('CG-K-0401', 'Parafango anteriore per ruota alta', 'una ruota da ' + o.diametro + '" alza il pneumatico: il parafango di serie va sostituito o rialzato.', { id: 'parafango', o: { posizione: 'anteriore', stile: 'mini' }, slot: 'parafanghi' }));
      L.push(K('CG-K-0402', 'Distanziali, cuscinetti e perno ruota', 'ogni cerchio aftermarket richiede i distanziali specifici per allineare disco e corona/puleggia.'));
      break;
    case 'carena':
      if (o.tipo === 'batwing' || o.tipo === 'shark' || o.tipo === 'club') { L.push(K('CG-K-0501', 'Staffe di montaggio e cablaggio carena', 'la carena si monta su staffe dedicate (forcella o telaio) con cablaggio per faro e frecce.'));
        if (o.supplementari === 'si') L.push(K('CG-K-0502', 'Relè e cablaggio fari supplementari', 'i fari supplementari richiedono interruttore e relè dedicati.')); }
      else L.push(K('CG-K-0503', 'Staffe cupolino per il diametro della forcella', 'il cupolino si fissa con staffe sugli steli o sulle orecchie del faro.'));
      break;
    case 'sella_foto':
      if (/molle/.test(o.modello)) L.push(K('CG-K-0602', 'Kit molle e perno anteriore per sella solo', 'la sella a molle si fissa con perno a cerniera sul telaio e due molle (3" o 4") su staffa posteriore.'));
      if (o.modello === 'king_queen_alto') L.push(K('CG-K-0603', 'Supporto schienale e piastra sotto sella', 'lo schienale alto richiede il supporto in acciaio fissato alla base della sella.'));
      if (/touring|biposto|rombi|long_legs|king_capitonne|banda/.test(o.modello)) L.push(K('CG-K-0604', 'Pedane passeggero e maniglia', 'una sella biposto omologata per il passeggero richiede pedane passeggero.'));
      L.push(K('CG-K-0605', 'Kit fissaggio sella (vite posteriore, linguetta anteriore)', 'ogni sella aftermarket va fissata con la linguetta anteriore e la vite posteriore del modello di moto.'));
      break;
    case 'sella_cafe': case 'codino':
      L.push(K('CG-K-0601', 'Telaietto posteriore accorciato o loop', 'sella café e codino monoposto richiedono il telaietto posteriore accorciato/chiuso.'));
      break;
    case 'pedane_arretrate':
      L.push(K('CG-K-0701', 'Leveraggio cambio e pompa freno posteriore', 'con le pedane arretrate cambiano rinvio del cambio e posizione della pompa freno.'));
      break;
    case 'freccia_bullet':
      L.push(K('CG-K-0801', 'Resistenze o relè per frecce LED', 'le frecce LED assorbono poco: senza resistenze/relè lampeggiano troppo veloci.'));
      break;
    case 'faro':
      L.push(K('CG-K-0901', 'Staffa faro e ghiera per il diametro scelto', `un faro da ${o.diametro || 7}" richiede supporto e ghiera dedicati.`));
      break;
    case 'serbatoio_peanut':
      L.push(K('CG-K-1001', 'Kit staffe serbatoio e rubinetto/pompa', 'il serbatoio peanut non usa gli attacchi originali e serve adattare l\'alimentazione.'));
      break;
    case 'ammortizzatori':
      L.push(K('CG-K-1101', 'Verifica cavalletto laterale e catena/cinghia', 'cambiando lunghezza degli ammortizzatori cambia l\'assetto: controlla cavalletto e tensionamento.'));
      break;
  }
  return L;
}

/* ---------- isole: pezzi fisicamente separati dentro una mesh ---------- */
function islands(mesh) {
  if (mesh.userData.isl) return mesh.userData.isl; let g = mesh.geometry;
  if (mesh.userData.zone) { if (g.index) { g = g.toNonIndexed(); mesh.geometry.dispose(); mesh.geometry = g; } return mesh.userData.isl = new Int32Array(g.attributes.position.count / 3); }
  if (g.index) { g = g.toNonIndexed(); mesh.geometry.dispose(); mesh.geometry = g; }
  const p = g.attributes.position.array, nT = p.length / 9, par = new Int32Array(nT); for (let i = 0; i < nT; i++) par[i] = i;
  const f = i => { while (par[i] !== i) { par[i] = par[par[i]]; i = par[i]; } return i; }, map = new Map();
  for (let v = 0; v < p.length / 3; v++) { const k = (Math.round(p[v * 3] * 4000) * 73856093) ^ (Math.round(p[v * 3 + 1] * 4000) * 19349663) ^ (Math.round(p[v * 3 + 2] * 4000) * 83492791), t = (v / 3) | 0, o = map.get(k);
    if (o === undefined) map.set(k, t); else { const a = f(o), b = f(t); if (a !== b) par[a] = b; } }
  const r = new Int32Array(nT); for (let i = 0; i < nT; i++) r[i] = f(i); return mesh.userData.isl = r;
}
function subGeo(g, keep) { const out = new THREE.BufferGeometry(), nT = keep.length;
  for (const [n, a] of Object.entries(g.attributes)) { const s = a.itemSize, arr = new a.array.constructor(nT * 3 * s); let o = 0; for (const t of keep) { arr.set(a.array.subarray(t * 3 * s, (t * 3 + 3) * s), o); o += 3 * s; } out.setAttribute(n, new THREE.BufferAttribute(arr, s, a.normalized)); }
  return out; }
/* bounding box (mondo) di ogni isola di una mesh */
function islandBoxes(mesh) {
  const isl = islands(mesh), p = mesh.geometry.attributes.position, M = new Map(), v = new THREE.Vector3(); mesh.updateMatrixWorld(true);
  for (let t = 0; t < isl.length; t++) { const id = isl[t]; let b = M.get(id); if (!b) { b = { box: new THREE.Box3(), n: 0, mesh, id }; M.set(id, b); } b.n++;
    for (let k = 0; k < 3; k++) { v.fromBufferAttribute(p, t * 3 + k).applyMatrix4(mesh.matrixWorld); b.box.expandByPoint(v); } }
  return [...M.values()];
}
/* separa le isole scelte in mesh autonome (stesso materiale), così si possono nascondere o spostare */
function splitIslands(mesh, ids, registerMesh) {
  if (Array.isArray(mesh.material)) return [];
  const isl = islands(mesh), set = new Set(ids), groups = new Map(), rest = [];
  for (let t = 0; t < isl.length; t++) { if (set.has(isl[t])) { let a = groups.get(isl[t]); if (!a) groups.set(isl[t], a = []); a.push(t); } else rest.push(t); }
  if (!groups.size) return []; const g = mesh.geometry, out = [];
  for (const [id, keep] of groups) { const ng = subGeo(g, keep); const m = new THREE.Mesh(ng, mesh.material); m.castShadow = m.receiveShadow = true; m.position.copy(mesh.position); m.quaternion.copy(mesh.quaternion); m.scale.copy(mesh.scale);
    m.userData.piece = true; m.userData.islId = id; m.name = (mesh.material.name || 'pezzo'); mesh.parent.add(m); registerMesh && registerMesh(m); out.push(m); }
  if (rest.length) { mesh.geometry = subGeo(g, rest); } else mesh.visible = false;
  mesh.userData.isl = null; g.dispose(); for (let a = mesh; a; a = a.parent) if (a.userData.__idx) a.userData.__idx = null; return out;
}

export function initConfig(ctx) {
  const { scene, camera, controls, composer, invalidate, $, parts, toast } = ctx;
  /* contorno di selezione (come nei configuratori professionali) */
  const size = new THREE.Vector2(); ctx.renderer.getSize(size);
  const outline = new OutlinePass(size, scene, camera); Object.assign(outline, { edgeStrength: 4.5, edgeGlow: .35, edgeThickness: 1.6, pulsePeriod: 0 });
  outline.visibleEdgeColor.set(0xf6c66f); outline.hiddenEdgeColor.set(0x8a5a14); composer.insertPass(outline, 1);

  let sel = null; const H = [], R = []; const config = []; let busy = false;
  /* ---------- cronologia unica: annulla / ripristina ---------- */
  function record(label, undo, redo) { H.push({ label, undo, redo }); if (H.length > 300) H.shift(); R.length = 0; syncQ(); }
  function doUndo() { const a = H.pop(); if (!a) { toast('Niente da annullare'); return; } busy = true; try { a.undo(); } finally { busy = false; } R.push(a); toast('Annullato: ' + a.label); afterChange(); }
  function doRedo() { const a = R.pop(); if (!a) { toast('Niente da ripristinare'); return; } busy = true; try { a.redo(); } finally { busy = false; } H.push(a); toast('Ripristinato: ' + a.label); afterChange(); }
  function afterChange() { ctx.refreshParts && ctx.refreshParts(); renderList(); renderPanel(); syncQ(); invalidate(); }

  /* ---------- selezione ---------- */
  let lastHit = null;
  function meshesOf(s) { if (!s) return []; if (s.kind === 'piece') return [s.obj]; if (s.kind === 'part') { const p = parts().get(s.name); return p ? p.meshes.map(m => m[0]).filter(o => o.visible) : []; } return [s.obj]; }
  function nameOf(s) { if (!s) return ''; if (s.kind === 'piece') return s.obj.userData.zone ? s.obj.name : 'Pezzo selezionato'; if (s.kind === 'part') return ctx.nice(s.name); return s.obj.userData.accName || s.obj.name || 'Accessorio'; }
  function catOf(s) { if (!s) return ''; if (s.kind === 'piece') { const p = s.part && parts().get(s.part); return (p ? p.cat + ' · ' : '') + 'solo questo pezzo (tocca «Gruppo» per tutto il materiale ' + ctx.nice(s.part || '') + ')'; } if (s.kind === 'part') { const p = parts().get(s.name); return p ? p.cat : ''; } const it = s.obj.userData.item; return it ? it.cat : (s.obj.userData.accCat || 'Accessorio'); }
  function select(s) { sel = s; outline.selectedObjects = meshesOf(s); renderPanel(); syncQ(); invalidate(); if (s && ctx.onSelect) ctx.onSelect(s); }
  function selectPart(name, hit) { lastHit = hit || null; select({ kind: 'part', name }); }
  /* solo il pezzo toccato (es. logo del serbatoio, fregio, scritta): isola fisicamente separata della mesh */
  function selectPiece() { if (!lastHit || !lastHit.object || Array.isArray(lastHit.object.material)) { toast('Tocca di nuovo il punto preciso del pezzo'); return; } const m = lastHit.object;
    if (m.userData.piece) { select({ kind: 'piece', obj: m, part: sel && sel.name }); return; }
    const isl = islands(m), id = isl[lastHit.faceIndex]; let n = 0; for (let i = 0; i < isl.length; i++) if (isl[i] === id) n++;
    if (n > isl.length * .95) { select({ kind: 'piece', obj: m, part: sel && sel.name }); return; }
    const [pc] = splitIslands(m, [id], ctx.registerMesh); if (!pc) return; pc.userData.origMat = pc.material; select({ kind: 'piece', obj: pc, part: sel && sel.name }); toast('Selezionato solo il pezzo toccato: ora puoi eliminarlo, ricolorarlo o ripristinarlo'); }
  /* clic sulla moto: si seleziona solo il pezzo fisico toccato (non tutti i pezzi con lo stesso materiale) */
  function selectAt(hit, partName) { lastHit = hit; const m = hit.object;
    if (Array.isArray(m.material)) { if (partName) select({ kind: 'part', name: partName }); return; }
    if (m.userData.piece) { select({ kind: 'piece', obj: m, part: partName }); return; }
    const isl = islands(m), id = isl[hit.faceIndex]; let n = 0; for (let i = 0; i < isl.length; i++) if (isl[i] === id) n++;
    if (n > isl.length * .95) { select({ kind: 'piece', obj: m, part: partName }); return; }
    const [pc] = splitIslands(m, [id], ctx.registerMesh); if (!pc) { if (partName) select({ kind: 'part', name: partName }); return; }
    pc.userData.origMat = pc.material; select({ kind: 'piece', obj: pc, part: partName }); }
  function hidePiece(o, hid) { const v0 = o.visible; o.visible = !hid; record((hid ? 'elimina ' : 'mostra ') + 'pezzo singolo', () => o.visible = v0, () => o.visible = !hid); if (hid) select(null); afterChange(); }
  function resetPiece(o) { const v0 = o.visible, m0 = o.material, m1 = o.userData.origMat || m0; o.visible = true; o.material = m1; record('ripristina pezzo singolo', () => { o.visible = v0; o.material = m0; }, () => { o.visible = true; o.material = m1; }); afterChange(); }
  function selectAcc(obj) { select({ kind: 'acc', obj }); }

  /* ---------- operazioni con cronologia ---------- */
  function partState(p) { return { mat: p.cur, color: p.color, finish: p.finish, hid: ctx.hidden.has(p.name) }; }
  function setPartState(p, s) { ctx.setPartMat(p, s.mat); p.color = s.color; p.finish = s.finish; if (s.hid) ctx.hidden.add(p.name); else ctx.hidden.delete(p.name); p.meshes.forEach(([o]) => o.visible = !s.hid); }
  function paintPart(name, color, finish) { const p = parts().get(name); if (!p) return; const a = partState(p); ctx.repaint(p, color, finish); const b = partState(p);
    record('colore ' + ctx.nice(name), () => setPartState(p, a), () => setPartState(p, b)); afterChange(); }
  function paintMany(list, color, finish, label) { const st = list.map(p => [p, partState(p)]); list.forEach(p => ctx.repaint(p, color, finish)); const st2 = list.map(p => [p, partState(p)]);
    record(label, () => st.forEach(([p, s]) => setPartState(p, s)), () => st2.forEach(([p, s]) => setPartState(p, s))); afterChange(); }
  function hidePart(name, hid = true) { const p = parts().get(name); if (!p) return; const a = partState(p); if (hid) ctx.hidden.add(name); else ctx.hidden.delete(name); p.meshes.forEach(([o]) => o.visible = !hid); const b = partState(p);
    record((hid ? 'elimina ' : 'mostra ') + ctx.nice(name), () => setPartState(p, a), () => setPartState(p, b)); if (hid && sel && sel.kind === 'part' && sel.name === name) select(null); afterChange(); }
  function resetPart(name) { const p = parts().get(name); if (!p) return; const a = partState(p); setPartState(p, { mat: p.orig, color: '#' + (p.orig.color ? p.orig.color.getHexString() : '888888'), finish: 'orig', hid: false }); const b = partState(p);
    record('ripristina ' + ctx.nice(name), () => setPartState(p, a), () => setPartState(p, b)); afterChange(); }
  function paintAcc(o, color, finish) { const before = new Map(), after = new Map();
    o.traverse(c => { if (c.isMesh && !/Lente|LED|Gomma|Vetro|Parabola|Fascia|Policarbonato|Plexi|Pneumatico|Battistrada/i.test((Array.isArray(c.material) ? '' : c.material.name) || '')) { before.set(c, c.material);
      const m0 = c.material, m = new THREE.MeshPhysicalMaterial({ name: (m0.name || 'pezzo'), color: new THREE.Color(color), normalMap: m0.normalMap || null, side: m0.side }); Object.assign(m, ctx.finishParams(finish)); c.material = m; after.set(c, m); } });
    record('colore ' + nameOf({ kind: 'acc', obj: o }), () => before.forEach((m, c) => c.material = m), () => after.forEach((m, c) => c.material = m)); afterChange(); }

  /* ---------- riepilogo configurazione ---------- */
  function addEntry(e) { config.push(e); }
  function removeEntry(e) { const i = config.indexOf(e); if (i >= 0) config.splice(i, 1); }
  /* rimuove un accessorio montato (con eventuale ritorno dei pezzi di serie) */
  function removeAcc(o, restoreStock) {
    const e = config.find(x => x.obj === o); const par = o.parent; const stock = e && restoreStock ? e.stock || [] : [];
    const kids = e ? config.filter(x => x.kitOf === e) : [];
    const apply = () => { par && par.remove(o); stock.forEach(s => s.restore()); if (e) removeEntry(e); kids.forEach(k => { if (k.obj && k.obj.parent) k.obj.parent.remove(k.obj); removeEntry(k); }); if (sel && sel.obj === o) select(null); };
    const back = () => { par && par.add(o); stock.forEach(s => s.apply()); if (e) addEntry(e); kids.forEach(k => { if (k.obj && k.objPar) k.objPar.add(k.obj); addEntry(k); }); };
    kids.forEach(k => k.objPar = k.obj && k.obj.parent); apply(); record((restoreStock ? 'ripristina di serie ' : 'elimina ') + (e ? e.n : nameOf({ kind: 'acc', obj: o })), back, apply); afterChange();
  }

  /* ---------- geometria della moto: dove stanno i pezzi di serie ---------- */
  let geoCache = null;
  function bikeGeo() {
    if (geoCache && geoCache.model === ctx.getModel()) return geoCache; const M = ctx.getModel(); if (!M) return null; M.updateMatrixWorld(true);
    const B = new THREE.Box3().setFromObject(M), S = B.getSize(new THREE.Vector3()), byCat = c => { const b = new THREE.Box3(), ms = []; for (const p of parts().values()) if (p.cat === c) p.meshes.forEach(([o]) => { if (o.visible) { b.expandByObject(o); ms.push(o); } }); return { b, ms }; };
    const tires = byCat('Pneumatici'); let wheels = null; const W = ST.buildIndex(M).W;
    if (W.front && W.rear) wheels = { R: (W.front.R + W.rear.R) / 2, rear: W.rear.c.clone(), front: W.front.c.clone(), y0: B.min.y };
    else if (!tires.b.isEmpty()) { const ts = tires.b.getSize(new THREE.Vector3()), c = tires.b.getCenter(new THREE.Vector3()), R = ts.y / 2; wheels = { R, rear: new THREE.Vector3(tires.b.min.x + R, tires.b.min.y + R, c.z), front: new THREE.Vector3(tires.b.max.x - R, tires.b.min.y + R, c.z), y0: tires.b.min.y }; }
    return geoCache = { model: M, B, S, byCat, wheels };
  }
  /* manubrio di serie: l'isola più larga in alto davanti (tubo da una manopola all'altra) e i comandi alle estremità */
  function findBars() {
    const g = bikeGeo(); if (!g) return null; const { B, S } = g; const cands = [];
    ctx.getModel().traverse(o => { if (!o.isMesh || !o.visible || Array.isArray(o.material) || o.userData.acc || o.userData.accPart) return; const n = (o.material.name || '');
      if (/glass|miror|mirror|vetro|body|livery|cover|tank|paint|hpolice|fairing|wind/i.test(n) || (o.material.transparent && (o.material.opacity ?? 1) < .95)) return;
      const b = new THREE.Box3().setFromObject(o); if (b.max.y < B.min.y + .55 * S.y || b.max.x < B.min.x + .45 * S.x) return; cands.push(o); });
    let best = null; const all = []; const okMat = I => !/white|livery|hpolice|paint|fairing|carena|cockpit/i.test(I.mesh.material.name || '');
    const zoneOK = (b, sz) => b.min.y >= B.min.y + .5 * S.y && b.getCenter(new THREE.Vector3()).x >= B.min.x + .5 * S.x && sz.x <= .38;
    for (const m of cands) { if (m.geometry.attributes.position.count > 900000) continue; for (const I of islandBoxes(m)) { all.push(I); const b = I.box, sz = b.getSize(new THREE.Vector3());
      if (!zoneOK(b, sz) || sz.z < .42 * S.z || sz.y > (sz.z > .55 * S.z ? .5 : .3) || I.n > 60000 || !okMat(I)) continue;
      const score = sz.z - sz.y * .3; if (!best || score > best.score) best = { ...I, score, list: [I] }; } }
    // manubrio fuso con altri pezzi cromati nella stessa isola: si ritaglia la parte alta anteriore
    if (!best) { const yc = B.min.y + .72 * S.y; for (const I of all) { if (I.n > 200000 || I.n < 1000 || !okMat(I) || I.mesh.userData.zone) continue; const b = I.box; if (b.max.y < yc + .05 || b.max.z - b.min.z < .42 * S.z) continue;
        const m = I.mesh, a = islands(m), p = m.geometry.attributes.position, v = new THREE.Vector3(); let nid = 0; for (let t = 0; t < a.length; t++) nid = Math.max(nid, a[t]); nid++; let n = 0; const box = new THREE.Box3();
        for (let t = 0; t < a.length; t++) { if (a[t] !== I.id) continue; let cx = 0, cy = 0, cz = 0; for (let k = 0; k < 3; k++) { v.fromBufferAttribute(p, t * 3 + k).applyMatrix4(m.matrixWorld); cx += v.x; cy += v.y; cz += v.z; } cx /= 3; cy /= 3;
          if (cy > yc && cx > B.min.x + .5 * S.x) { a[t] = nid; n++; for (let k = 0; k < 3; k++) box.expandByPoint(v.fromBufferAttribute(p, t * 3 + k).applyMatrix4(m.matrixWorld)); } }
        if (n < 20) continue; const sz = box.getSize(new THREE.Vector3()); if (sz.z < .42 * S.z) continue; const J = { mesh: m, id: nid, box, n }; best = { ...J, score: 0, list: [J] }; all.push(J); break; } }
    // manubrio diviso in più pezzi (metà sinistra, centrale, metà destra): si uniscono i pezzi allineati dello stesso materiale
    if (!best) { const pcs = all.filter(I => { const sz = I.box.getSize(new THREE.Vector3()); return zoneOK(I.box, sz) && sz.z > .1 && sz.z > sz.x && sz.y < .3 && I.n < 60000 && okMat(I); });
      for (const a of pcs) { const grp = pcs.filter(I => I.mesh.material === a.mesh.material && Math.abs(I.box.getCenter(new THREE.Vector3()).x - a.box.getCenter(new THREE.Vector3()).x) < .2 && Math.abs(I.box.getCenter(new THREE.Vector3()).y - a.box.getCenter(new THREE.Vector3()).y) < .25);
        const u = new THREE.Box3(); grp.forEach(I => u.union(I.box)); const sz = u.getSize(new THREE.Vector3()); if (grp.length < 2 || sz.z < .42 * S.z || sz.y > .45) continue;
        const score = sz.z - sz.y * .3; if (!best || score > best.score) best = { ...a, box: u, score, list: grp }; } }
    if (!best) return null;
    // completa il manubrio: tratti dello stesso materiale attaccati ai pezzi trovati (montanti, metà fuse con cavi): si prende solo la parte alta
    const nMat = new Set(all.map(I => I.mesh.material)).size;
    if (nMat >= 3) { const yc = B.min.y + .7 * S.y, mats = new Set(best.list.map(P => P.mesh.material)), U = new THREE.Box3(); best.list.forEach(P => U.union(P.box)); U.expandByScalar(.03); U.min.y = Math.max(U.min.y, yc - .05);
      for (const I of [...all]) { if (best.list.includes(I) || !mats.has(I.mesh.material) || I.mesh.userData.zone || !U.intersectsBox(I.box)) continue; const sz = I.box.getSize(new THREE.Vector3()); if (sz.length() < .15) continue;
        const U2 = U.clone(); U2.min.x -= .15; U2.max.x += .15; U2.min.z -= .05; U2.max.z += .05; U2.min.y = yc - .1; U2.max.y += .05; if (I.box.min.y >= yc - .05) { if (U2.containsBox(I.box)) best.list.push(I); continue; }
        const m = I.mesh, a = islands(m), p = m.geometry.attributes.position, v = new THREE.Vector3(); let nid = 0; for (let t = 0; t < a.length; t++) nid = Math.max(nid, a[t]); nid++; let n = 0; const box = new THREE.Box3();
        for (let t = 0; t < a.length; t++) { if (a[t] !== I.id) continue; let cy = 0, cx = 0; for (let k = 0; k < 3; k++) { v.fromBufferAttribute(p, t * 3 + k).applyMatrix4(m.matrixWorld); cy += v.y; cx += v.x; } if (cy / 3 > yc && cx / 3 > B.min.x + .5 * S.x) { a[t] = nid; n++; for (let k = 0; k < 3; k++) box.expandByPoint(v.fromBufferAttribute(p, t * 3 + k).applyMatrix4(m.matrixWorld)); } }
        if (n >= 8 && U2.containsBox(box)) { const J = { mesh: m, id: nid, box, n }; best.list.push(J); all.push(J); } else if (n) { for (let t = 0; t < a.length; t++) if (a[t] === nid) a[t] = I.id; } } }
    // punto di serraggio (centro) e estremità
    const v = new THREE.Vector3(), lowC = []; let c = new THREE.Vector3(), nc = 0, eL = null, eR = null;
    for (const P of best.list) { const p = P.mesh.geometry.attributes.position, isl = islands(P.mesh);
      for (let t = 0; t < isl.length; t++) if (isl[t] === P.id) for (let k = 0; k < 3; k++) { v.fromBufferAttribute(p, t * 3 + k).applyMatrix4(P.mesh.matrixWorld);
        if (Math.abs(v.z) < .15) lowC.push(v.clone()); if (!eL || v.z > eL.z) eL = v.clone(); if (!eR || v.z < eR.z) eR = v.clone(); } }
    // punto di serraggio = parte più bassa del manubrio vicino al centro (base dei montanti sui riser), non la traversa alta
    if (lowC.length) { const ymin = Math.min(...lowC.map(q => q.y)); lowC.filter(q => q.y < ymin + .02).forEach(q => { c.add(q); nc++; }); }
    if (nc) { c.multiplyScalar(1 / nc); c.z = 0; } else c = best.box.getCenter(new THREE.Vector3());
    // comandi vicini alle estremità (leve, blocchetti, manopole, specchietti): si spostano col manubrio nuovo
    const ctrl = { L: [], R: [] }, cables = [], mir = { L: [], R: [] };
    for (const I of all) { if (best.list.some(P => P === I || (P.mesh === I.mesh && P.id === I.id))) continue; const cc = I.box.getCenter(new THREE.Vector3()), sz = I.box.getSize(new THREE.Vector3());
      if (sz.length() > .45) { // cavi e tubi che partono dai comandi: con un manubrio diverso vanno sostituiti (kit cavi)
        if ([eL, eR].some(e => I.box.distanceToPoint(e) < .12) && Math.min(sz.x, sz.z) < .12 && sz.y > .15 && I.box.min.y > B.min.y + .35 * S.y && !(I.mesh.material.metalness > .6 && sz.y > .5)) cables.push(I); continue; }
      for (const [k, e] of [['L', eL], ['R', eR]]) if (cc.distanceTo(e) < .2 && Math.abs(cc.z) > Math.abs(e.z) - .24) { ctrl[k].push(I); if (I.box.min.y > e.y + .03) mir[k].push(I); } }
    // pezzi fissati al manubrio di serie lontano dalle manopole (frecce, staffe): senza il tubo resterebbero sospesi
    const used = new Set([...ctrl.L, ...ctrl.R, ...cables]), bx = best.list.map(P => P.box.clone().expandByScalar(.015)), att = [];
    if (nMat >= 3) for (const I of all) { if (used.has(I) || best.list.some(P => P === I || (P.mesh === I.mesh && P.id === I.id))) continue; const sz = I.box.getSize(new THREE.Vector3());
      if (sz.length() < .3 && !/glass|miror|mirror|vetro|lens|light|faro/i.test(I.mesh.material.name || '') && bx.some(b => b.intersectsBox(I.box)) && I.box.min.y > Math.max(B.min.y + .55 * S.y, c.y - .14)) att.push(I); }
    // pezzetti dentro l'ingombro del manubrio di serie (lenti, tappi, fascette): senza il tubo resterebbero sospesi
    if (nMat >= 3) { const UB = new THREE.Box3(); best.list.forEach(P => UB.union(P.box)); UB.expandByScalar(.03); for (const I of all) { if (att.includes(I) || used.has(I) || best.list.some(P => P === I || (P.mesh === I.mesh && P.id === I.id))) continue; const sz = I.box.getSize(new THREE.Vector3()), cc = I.box.getCenter(new THREE.Vector3());
      if (sz.length() < .12 && UB.containsPoint(cc) && cc.y > B.min.y + .74 * S.y && !/glass|miror|mirror|vetro/i.test(I.mesh.material.name || '')) att.push(I); } }
    // lenti e lampadine delle frecce agganciate a quei supporti
    for (let pass = 0; pass < 3 && att.length; pass++) { const ab = att.map(I => I.box.clone().expandByScalar(.025)); for (const I of all) { if (att.includes(I) || used.has(I) || best.list.includes(I)) continue; const sz = I.box.getSize(new THREE.Vector3()); if (sz.length() < .2 && !/miror|mirror/i.test(I.mesh.material.name || '') && ab.some(b => b.intersectsBox(I.box))) att.push(I); } }
    return { bar: best, bars: best.list, clamp: c, eL, eR, ctrl, cables, mir, att };
  }

  /* pezzi di serie da nascondere: ritornano un oggetto {apply, restore} */
  /* misura la sella di serie: per ogni punto della pianta la quota del fondo (raggio dal basso) e la larghezza; origine al centro anteriore-inferiore */
  function seatFit(meshes) {
    const B = new THREE.Box3(); meshes.forEach(m => B.expandByObject(m)); const rc = new THREE.Raycaster(), NX = 48, NZ = 28, S = B.getSize(new THREE.Vector3());
    const xs = [], cols = []; let y0 = Infinity, zc = 0, zn = 0;
    const bot = []; for (let i = 0; i < NX; i++) { const x = B.min.x + (i + .5) / NX * S.x, row = []; let zmin = Infinity, zmax = -Infinity;
      for (let j = 0; j < NZ; j++) { const z = B.min.z + (j + .5) / NZ * S.z; rc.set(new THREE.Vector3(x, B.min.y - .3, z), new THREE.Vector3(0, 1, 0)); const h = rc.intersectObjects(meshes, false)[0];
        if (h && h.point.y < B.max.y + .01) { row.push([z, h.point.y]); zmin = Math.min(zmin, z); zmax = Math.max(zmax, z); y0 = Math.min(y0, h.point.y); zc += z; zn++; } }
      xs.push(x); bot.push(row); cols.push(zmin <= zmax ? [zmin, zmax] : null); }
    zc = zn ? zc / zn : 0; const ok = cols.map((c, i) => c ? i : -1).filter(i => i >= 0); if (ok.length < 4) return null;
    const xF = xs[ok.at(-1)] + S.x / NX / 2, xR = xs[ok[0]] - S.x / NX / 2, L = xF - xR, xc = (xF + xR) / 2;
    const hwC = cols.map(c => c ? Math.max(Math.abs(c[0] - zc), Math.abs(c[1] - zc)) + S.z / NZ / 2 : NaN);
    for (let i = 0; i < NX; i++) if (isNaN(hwC[i])) { let d = 1e9, v = 0; for (const k of ok) if (Math.abs(k - i) < d) { d = Math.abs(k - i); v = hwC[k]; } hwC[i] = v; }
    let hws = hwC.slice(); for (let it = 0; it < 3; it++) hws = hws.map((v, i) => (hws[Math.max(0, i - 1)] + 2 * v + hws[Math.min(NX - 1, i + 1)]) / 4);
    const hwAt = x => { const t = Math.max(0, Math.min(NX - 1.001, (x + xc - B.min.x) / S.x * NX - .5)), i = Math.floor(t), f = t - i; return hws[i] * (1 - f) + hws[i + 1] * f; };
    // fondo: mediana per sezione trasversale, buchi riempiti e smussato lungo la sella (superficie continua, niente gradini)
    const med = bot.map(r => { if (!r.length) return NaN; const v = r.map(q => q[1]).sort((a, b) => a - b); return v[v.length >> 1]; });
    for (let i = 0; i < NX; i++) if (isNaN(med[i])) { let d = 1e9, v = NaN; for (const k of ok) if (Math.abs(k - i) < d) { d = Math.abs(k - i); v = med[k]; } med[i] = v; }
    let sm = med.slice(); for (let it = 0; it < 4; it++) sm = sm.map((v, i) => (sm[Math.max(0, i - 1)] + 2 * v + sm[Math.min(NX - 1, i + 1)]) / 4);
    const botAt = (x) => { const t = Math.max(0, Math.min(NX - 1.001, (x + xc - B.min.x) / S.x * NX - .5)), i = Math.floor(t), f = t - i; return sm[i] * (1 - f) + sm[i + 1] * f - y0; };
    let hwMax = 0; for (const k of ok) hwMax = Math.max(hwMax, hwAt(xs[k] - xc));
    return { L, hw: hwAt, hwMax, bot: botAt, origin: new THREE.Vector3(xc, y0, zc) };
  }
  // scarico di serie dei modelli in un pezzo unico: triangoli vicini al percorso dei tubi, sul lato dello scarico
  function cutPieces(C) { const M = ctx.getModel(); if (M.userData.__cut) return M.userData.__cut.filter(o => o.visible || true);
    const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), out = [];
    const dseg = (x, y, P) => { let m = 9; for (let i = 0; i < P.length - 1; i++) { const [x1, y1] = P[i], [x2, y2] = P[i + 1], dx = x2 - x1, dy = y2 - y1, t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy || 1))); m = Math.min(m, Math.hypot(x - x1 - t * dx, y - y1 - t * dy)); } return m; };
    const meshes = []; M.traverse(o => { if (o.isMesh && o.visible && !o.userData.accPart && !Array.isArray(o.material)) meshes.push(o); });
    for (const m of meshes) { const isl = islands(m), p = m.geometry.attributes.position; m.updateMatrixWorld(true); let next = 0; for (let t = 0; t < isl.length; t++) next = Math.max(next, isl[t] + 1); let hit = false;
      for (let t = 0; t < isl.length; t++) { a.fromBufferAttribute(p, t * 3).applyMatrix4(m.matrixWorld); b.fromBufferAttribute(p, t * 3 + 1).applyMatrix4(m.matrixWorld); c.fromBufferAttribute(p, t * 3 + 2).applyMatrix4(m.matrixWorld);
        const x = (a.x + b.x + c.x) / 3, y = (a.y + b.y + c.y) / 3, z = (a.z + b.z + c.z) / 3;
        for (const g of C) if (z * g.side > .02 && g.paths.some(P => dseg(x, y, P) < g.r)) { isl[t] = next; hit = true; break; } }
      if (hit) out.push(...splitIslands(m, [next], ctx.registerMesh)); }
    M.userData.__idx = null; geoCache = null; return (M.userData.__cut = out); }
  function stockPieces(slotId) { const M = ctx.getModel(); if (!M) return [];
    if (slotId === 'scarico' && ctx.cur && ctx.cur() && EXH_CUT[ctx.cur().id]) return cutPieces(EXH_CUT[ctx.cur().id]).filter(o => o.visible); const L = ST.detect(ST.buildIndex(M), slotId); if (!L.length) return [];
    const role = new Map(); L.forEach(I => { if (!role.has(I.mesh)) role.set(I.mesh, new Set()); role.get(I.mesh).add(I.id); }); const pcs = [];
    for (const [m, ids] of role) { if (m.userData.zone || m.userData.piece && ids.size === 1) { pcs.push(m); continue; } const all = new Set(islands(m)); if ([...all].every(i => ids.has(i))) { pcs.push(m); continue; } pcs.push(...splitIslands(m, [...ids], ctx.registerMesh)); }
    M.userData.__idx = null; geoCache = null; return pcs.filter(o => o.visible); }
  function exhStockPieces(E) { const M = ctx.getModel(); if (!M) return []; const idx = ST.buildIndex(M); const role = new Map();
    for (const P of E.parts) { const c0 = new THREE.Vector3(...P.c); let best = null, bd = 1e9;
      for (const I of idx.isl) { if (!I.mat || I.mat.name !== P.m) continue; const d = I.c.distanceTo(c0) + Math.abs(I.s.x - P.s[0]) + Math.abs(I.s.y - P.s[1]) + Math.abs(I.s.z - P.s[2]); if (d < bd) { bd = d; best = I; } }
      if (best && bd < .02) { if (!role.has(best.mesh)) role.set(best.mesh, new Set()); role.get(best.mesh).add(best.id); } }
    const pcs = []; for (const [m, ids] of role) { if (m.userData.zone || m.userData.piece && ids.size === 1) { pcs.push(m); continue; } const all = new Set(islands(m)); if ([...all].every(i => ids.has(i))) { pcs.push(m); continue; } pcs.push(...splitIslands(m, [...ids], ctx.registerMesh)); }
    M.userData.__idx = null; geoCache = null; return pcs.filter(o => o.visible); }
  function hideMeshes(ms, label) { const st = ms.map(o => [o, o.visible]); return { label, apply: () => ms.forEach(o => o.visible = false), restore: () => st.forEach(([o, v]) => o.visible = v) }; }
  function moveMeshes(ms, d) { const st = ms.map(o => [o, o.position.clone()]); return { label: 'comandi spostati', apply: () => st.forEach(([o, p]) => o.position.copy(p).add(d)), restore: () => st.forEach(([o, p]) => o.position.copy(p)) }; }
  function worldToLocalDelta(o, d) { const par = o.parent; if (!par) return d.clone(); const a = par.worldToLocal(new THREE.Vector3(0, 0, 0)), b = par.worldToLocal(d.clone()); return b.sub(a); }

  /* ---------- montaggio automatico al posto del pezzo di serie ---------- */
  function buildItem(it) { const o = buildPro(it.id, it.o); o.userData.code = it.k; return o; }
  function tag(o, it, slot) { o.userData.acc = true; o.userData.accName = it.n; o.userData.item = it; o.userData.slot = slot && slot.id; o.userData.kbType = o.userData.type || 'generic';
    const t = () => o.traverse(c => { if (c.isMesh) { c.userData.accPart = o; c.castShadow = c.receiveShadow = true; } }); t(); o.addEventListener && o.addEventListener('ready', () => { t(); invalidate(); }); return o; }
  /* ---------- ruote: scelta singola (anteriore / posteriore · completa / solo cerchio / solo pneumatico) ---------- */
  let whPos = 'ant', whPart = 'completa';
  const TYRE_RX = /tire|tyre|gomm|pneu|dunlop|michelin|pirelli|metzeler|bridgestone|avon|rubber|battistr/i;
  // divide una sola volta le ruote di serie in 4 gruppi: pneumatico e cerchio (con mozzo, raggi, disco) di ciascuna ruota
  function wheelRoles() { const M = ctx.getModel(); if (!M) return null; if (M.userData.__wr) return M.userData.__wr;
    const idx = ST.buildIndex(M), W = idx.W; if (!W.front || !W.rear) return null; let L = ST.detect(idx, 'ruote'); const viaW = !L.length; if (viaW) L = idx.isl.filter(I => I.box.intersectsBox(W.front.V) || I.box.intersectsBox(W.rear.V)); if (!L.length) return null;
    const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), roleOf = new Map(), rimMax = { ant: [], post: [] };
    const per = new Map(); L.forEach(I => { if (!per.has(I.mesh)) per.set(I.mesh, []); per.get(I.mesh).push(I.id); });
    for (const [m, ids] of per) { const isl = islands(m), p = m.geometry.attributes.position, zone = !!m.userData.zone, want = new Set(ids); m.updateMatrixWorld(true);
      let next = 0; for (let t = 0; t < isl.length; t++) next = Math.max(next, isl[t] + 1);
      const tri = new Map(); // id isola -> [{t, pos, r}]
      for (let t = 0; t < isl.length; t++) { if (!zone && !want.has(isl[t])) continue; a.fromBufferAttribute(p, t * 3).applyMatrix4(m.matrixWorld); b.fromBufferAttribute(p, t * 3 + 1).applyMatrix4(m.matrixWorld); c.fromBufferAttribute(p, t * 3 + 2).applyMatrix4(m.matrixWorld);
        const x = (a.x + b.x + c.x) / 3, y = (a.y + b.y + c.y) / 3, zz = (a.z + b.z + c.z) / 3, F = Math.abs(x - W.front.c.x) < Math.abs(x - W.rear.c.x), Wc = F ? W.front : W.rear, r = Math.abs(zz - Wc.c.z) > .16 ? 9 : Math.hypot(x - Wc.c.x, y - Wc.c.y) / Wc.R;
        if (!tri.has(isl[t])) tri.set(isl[t], []); tri.get(isl[t]).push({ t, pos: F ? 'ant' : 'post', r, R: Wc.R }); }
      const tyreMat = TYRE_RX.test(m.material && m.material.name || '');
      for (const [id, T] of tri) { let sr = 0, mn = 9, mx = 0, nA = 0; T.forEach(q => { sr += q.r; mn = Math.min(mn, q.r); mx = Math.max(mx, q.r); if (q.pos === 'ant') nA++; });
        const mean = sr / T.length, mixed = zone || viaW || (!tyreMat && mn < .7 && mx > .93) || (nA && nA < T.length);
        if (!mixed) { const pos = nA ? 'ant' : 'post', ty = tyreMat || mean >= .84; roleOf.set(m.uuid + ':' + id, [m, id, pos + (ty ? 'T' : 'R')]); if (!ty) T.forEach(q => rimMax[pos].push(q.r * q.R)); continue; }
        // isola mista (zona unica o gomma e cerchio uniti): divisione triangolo per triangolo
        const sub = new Map(); for (const q of T) { if (q.r > 1.08) continue; const role = q.pos + (q.r >= .83 ? 'T' : 'R'); if (!sub.has(role)) sub.set(role, next++); isl[q.t] = sub.get(role); if (role.endsWith('R')) rimMax[q.pos].push(q.r * q.R); }
        for (const q of T) if (q.r > 1.08) isl[q.t] = next; next++;
        for (const [role, nid] of sub) roleOf.set(m.uuid + ':' + nid, [m, nid, role]); } }
    const out = { antT: [], antR: [], postT: [], postR: [], rim: {} }, split = new Map();
    for (const [m, id, role] of roleOf.values()) { if (!split.has(m)) split.set(m, new Map()); split.get(m).set(id, role); }
    for (const [m, ids] of split) for (const pc of splitIslands(m, [...ids.keys()], ctx.registerMesh)) out[ids.get(pc.userData.islId)].push(pc);
    for (const k of ['ant', 'post']) { const A = rimMax[k].sort((x, y) => x - y); out.rim[k] = A.length ? A[Math.floor(A.length * .97)] : null; }
    M.userData.__idx = null; geoCache = null; return (M.userData.__wr = out); }
  // nasconde i pezzi di serie e al ripristino li rimette visibili anche se li aveva nascosti la ruota sostituita
  function hideWheel(ms, label) { return { label, apply: () => ms.forEach(o => o.visible = false), restore: () => ms.forEach(o => o.visible = true) }; }

  async function mount(it, opt = {}) {
    if (it.real) { toast('Ricambio 3D reale: clicca sulla moto dove montarlo'); ctx.placeReal && ctx.placeReal(it); return; }
    const slot = opt.slot ? slotById(opt.slot) : slotOfItem(it), g = bikeGeo(); if (!g) return;
    const objs = [], stock = []; let note = '', det = [], anchor = null, anchorSide = 1, seatFitUsed = null;
    // sostituzione di un accessorio già montato nello stesso slot
    const wSel = slot && slot.id === 'ruote' ? { pos: opt.pos || whPos, parte: opt.parte || whPart } : null;
    const prev = config.filter(e => e.slot === (slot && slot.id) && !e.kitOf && e.obj && (slot.id !== 'parafanghi' || (e.it.o || {}).posizione === (it.o || {}).posizione) && (slot.id !== 'frecce' || e.it.id === it.id)
      && (!wSel || !e.wh || (e.wh.pos === wSel.pos && (wSel.parte === 'completa' || e.wh.parte === 'completa' || e.wh.parte === wSel.parte))));
    const ground = g.B.min.y;
    if (slot && slot.id === 'manubrio') {
      const fb = findBars(); if (fb) {
        const o = tag(buildItem(it), it, slot); o.position.copy(fb.clamp); objs.push(o);
        // nascondi il tubo e le manopole di serie, sposta leve/blocchetti/specchietti sulle nuove estremità
        // ogni mesh si divide una sola volta (gli id delle isole cambiano dopo la divisione)
        const role = new Map(); const add = (I, r) => { if (!role.has(I.mesh)) role.set(I.mesh, new Map()); role.get(I.mesh).set(I.id, r); };
        fb.bars.forEach(I => add(I, 'bar')); fb.ctrl.L.forEach(I => add(I, 'L')); fb.ctrl.R.forEach(I => add(I, 'R')); fb.cables.forEach(I => add(I, 'cab')); fb.att.forEach(I => add(I, 'att'));
        const got = { bar: [], L: [], R: [], cab: [], att: [] }; for (const [m, ids] of role) for (const pc of splitIslands(m, [...ids.keys()], ctx.registerMesh)) got[ids.get(pc.userData.islId)].push(pc);
        stock.push(hideMeshes(got.bar, 'manubrio di serie')); if (got.cab.length) stock.push(hideMeshes(got.cab, 'cavi di serie')); if (got.att.length) { stock.push(hideMeshes(got.att, 'frecce e staffe fissate al manubrio di serie')); note = 'frecce e staffe che erano sul manubrio di serie tolte: rimontale da «Frecce e fanalino»'; }
        o.updateMatrixWorld(true); const nb = new THREE.Box3().setFromObject(o); const nL = new THREE.Vector3(nb.min.x + .02, nb.max.y - .02, nb.max.z - .07), nR = nL.clone(); nR.z = nb.min.z + .07;
        for (const [k, e, n] of [['L', fb.eL, nL], ['R', fb.eR, nR]]) { const pieces = got[k];
          const grips = pieces.filter(pc => { const b = new THREE.Box3().setFromObject(pc), s2 = b.getSize(new THREE.Vector3()); return s2.z > .07 && s2.y < .06 && s2.x < .06; });
          if (grips.length) stock.push(hideMeshes(grips, 'manopole di serie'));
          const mv = pieces.filter(pc => !grips.includes(pc)); if (!mv.length) continue;
          if (it.id === 'ape_hanger') { let e0 = e.clone(); e0.z -= Math.sign(e.z) * .07; if (grips.length) { const gb = new THREE.Box3(); grips.forEach(pc => gb.expandByObject(pc)); e0 = gb.getCenter(new THREE.Vector3()); } const d = n.clone().sub(e0); stock.push(moveMeshes(mv, worldToLocalDelta(mv[0], d))); }
          else stock.push(hideMeshes(mv, 'comandi di serie')); }
        if (it.id === 'semimanubri') { o.position.y -= .06; note = 'semimanubri montati sotto la piastra di sterzo'; }
      } else { const o = tag(buildItem(it), it, slot); const f = g.wheels ? g.wheels.front : g.B.max; o.position.set(f.x - .35, g.B.min.y + .72 * g.S.y, 0); objs.push(o); note = 'manubrio di serie non riconosciuto in questo modello: regola la posizione in Officina'; }
    } else if (slot && slot.id === 'specchietti') {
      let eR, eL; const nb = config.find(e => e.slot === 'manubrio' && e.obj); let fb = null;
      if (nb) { const b = new THREE.Box3().setFromObject(nb.obj); eR = new THREE.Vector3(b.min.x + .03, b.max.y - .02, b.max.z); eL = eR.clone(); eL.z = b.min.z; }
      else { fb = findBars(); if (fb) { eR = fb.eL; eL = fb.eR; } }
      if (eR) { const bar = (it.o || {}).forma === 'fine manubrio';
        for (const [lato, e] of [['destro', eR], ['sinistro', eL]]) { const o = tag(buildItem({ ...it, o: { ...it.o, lato } }), it, slot); o.userData.accName = it.n.split(' · ')[0] + ' — ' + lato;
          o.position.copy(e); if (!bar) { o.position.z -= Math.sign(e.z) * .1; o.position.y += .015; } objs.push(o); }
        const glass = g.byCat('Vetri e specchi').ms; if (glass.length) stock.push(hideMeshes(glass, 'vetri specchietti di serie'));
        // specchietti di serie già spostati sul manubrio nuovo (teste e steli sopra le estremità): spariscono, resta solo la scelta nuova
        if (nb) { const sv = [], seen = new Set(objs); ctx.getModel().traverse(m => { if (!m.isMesh || !m.visible || seen.has(m)) return; const b = new THREE.Box3().setFromObject(m), sz = b.getSize(new THREE.Vector3()), c = b.getCenter(new THREE.Vector3());
            if (sz.length() > .4) return; for (const e of [eR, eL]) if (b.min.y > e.y - .01 && Math.hypot(c.x - e.x, c.z - e.z) < .3 && c.y < e.y + .4) { sv.push(m); break; } });
          if (sv.length) stock.push(hideMeshes(sv, 'specchietti di serie')); }
        if (fb) { const role = new Map(); [...fb.mir.L, ...fb.mir.R].forEach(I => { if (!role.has(I.mesh)) role.set(I.mesh, []); role.get(I.mesh).push(I.id); }); const pcs = []; for (const [m, ids] of role) pcs.push(...splitIslands(m, ids, ctx.registerMesh)); if (pcs.length) stock.push(hideMeshes(pcs, 'specchietti di serie')); }
        note = bar ? 'specchietti montati alle estremità del manubrio' : 'specchietti montati vicino alle manopole';
      } else { const o = tag(buildItem(it), it, slot); o.position.set(g.B.max.x - .5, g.B.min.y + .8 * g.S.y, .3); objs.push(o); note = 'manubrio non riconosciuto: regola la posizione in Officina'; }
    } else if (slot && slot.id === 'ruote' && g.wheels) {
      // una sola ruota e un solo componente per volta: mai entrambe in automatico
      const W = g.wheels, k = wSel.pos, c = k === 'ant' ? W.front : W.rear, WR = wheelRoles(), Rw = (ST.buildIndex(ctx.getModel()).W[k === 'ant' ? 'front' : 'rear'] || {}).R || W.R;
      const rimR = WR && WR.rim[k] ? WR.rim[k] : Rw * .7, o2 = { ...it.o, parte: wSel.parte };
      if (wSel.parte === 'cerchio') o2.__Rr = rimR - .009;                       // cerchio dentro il pneumatico di serie
      if (wSel.parte === 'gomma') { o2.__Rr = rimR - .004; o2.__Rt = Rw * .995; } // pneumatico sul cerchio di serie, stesso diametro esterno
      const it2 = { ...it, o: o2 }, o = tag(buildItem(it2), it2, slot); o.position.copy(c);
      o.userData.R = wSel.parte === 'cerchio' ? rimR : Rw; o.userData.accName = (wSel.parte === 'gomma' ? 'Pneumatico ' + (o2.gomma || 130) + ' mm' + (o2.battistrada === 'tassellato' ? ' tassellato' : ' stradale') : it.n.split(' · ')[0] + (wSel.parte === 'cerchio' ? ' (solo cerchio)' : '')) + (k === 'ant' ? ' — anteriore' : ' — posteriore'); objs.push(o);
      const lab = (k === 'ant' ? 'anteriore' : 'posteriore');
      if (WR) { const ms = wSel.parte === 'cerchio' ? WR[k + 'R'] : wSel.parte === 'gomma' ? WR[k + 'T'] : [...WR[k + 'T'], ...WR[k + 'R']];
        if (ms.length) stock.push(hideWheel(ms, (wSel.parte === 'cerchio' ? 'cerchio, mozzo e disco di serie ' : wSel.parte === 'gomma' ? 'pneumatico di serie ' : 'ruota di serie ') + lab)); }
      else { const t = g.byCat('Pneumatici'), r = g.byCat('Cerchi'); const near = ms => ms.filter(m => { const q = new THREE.Box3().setFromObject(m).getCenter(new THREE.Vector3()); return Math.abs(q.x - c.x) < Math.abs(q.x - (k === 'ant' ? W.rear : W.front).x); });
        const ms = near(wSel.parte === 'cerchio' ? r.ms : wSel.parte === 'gomma' ? t.ms : [...t.ms, ...r.ms]); if (ms.length) stock.push(hideWheel(ms, 'ruota di serie ' + lab)); }
      note = (wSel.parte === 'completa' ? 'ruota ' : wSel.parte === 'cerchio' ? 'solo cerchio ' : 'solo pneumatico ') + lab + ' — l\'altra ruota resta com\'è';
    } else if (slot && slot.id === 'scarico' && it.id === 'scarico' && ctx.cur && ctx.cur() && EXH[ctx.cur().id]) {
      // scarico montato sulle luci di scarico misurate del motore; nasconde esattamente i pezzi dello scarico di serie
      const E = EXH[ctx.cur().id]; const o = tag(buildItem({ ...it, o: { ...it.o, __exh: E } }), it, slot); objs.push(o); anchorSide = E.side;
      if (!prev.length) { const pcs = exhStockPieces(E); if (pcs.length) stock.push(hideMeshes(pcs, 'scarico di serie (collettori, silenziatori, paracalore, staffe)')); }
      note = 'collegato alle luci di scarico del motore';
    } else if (slot && ['sella', 'scarico', 'faro'].includes(slot.id) && (prev.some(e => e.anchor) || (det = stockPieces(slot.id)).length)) {
      // il nuovo pezzo si allinea all'ingombro di quello di serie (o del precedente che sostituisce)
      let b = new THREE.Box3(), side = 1; if (det.length) { det.forEach(m => b.expandByObject(m)); } else b = prev.find(e => e.anchor).anchor.clone();
      if (slot.id === 'scarico') { let zs = 0, n = 0; det.forEach(m => { const c2 = new THREE.Box3().setFromObject(m).getCenter(new THREE.Vector3()); zs += c2.z; n++; }); side = n ? (Math.sign(zs) || 1) : (prev.find(e => e.anchor).side || 1); }
      // sella: misura della sella di serie (pianta e fondo, punto per punto) per costruire la nuova adattata a telaio e parafango
      let fit = null; if (slot.id === 'sella' && it.id === 'sella_foto') fit = det.length ? seatFit(det) : (prev.find(e => e.fit) || {}).fit || null;
      anchor = b.clone(); const o = tag(fit ? buildItem({ ...it, o: { ...it.o, __fit: fit } }) : buildItem(it), it, slot); if (slot.id === 'scarico' && side < 0) o.scale.z = -1; o.updateMatrixWorld(true);
      if (fit) { o.position.copy(fit.origin); objs.push(o); if (det.length) stock.push(hideMeshes(det, 'sella di serie')); anchorSide = side; seatFitUsed = fit; }
      else {
      const nb = new THREE.Box3().setFromObject(o), nc = nb.getCenter(new THREE.Vector3()), c = b.getCenter(new THREE.Vector3());
      if (slot.id === 'sella') o.position.set(c.x - nc.x, b.min.y - nb.min.y, -nc.z);
      else if (slot.id === 'faro') o.position.set(b.max.x - nb.max.x, c.y - nc.y, -nc.z);
      else { const zOut = side > 0 ? Math.max(b.max.z, .16) : Math.min(b.min.z, -.16); o.position.set(b.min.x - nb.min.x, c.y - nc.y, side > 0 ? zOut - nb.max.z : zOut - nb.min.z); }
      objs.push(o); if (det.length) stock.push(hideMeshes(det, slot.n.toLowerCase() + ' di serie')); anchorSide = side; }
    } else if (slot && slot.id !== 'specchietti' && slot.pc && slot.pc.some(c => !g.byCat(c).b.isEmpty())) {
      const ms = slot.pc.flatMap(c => g.byCat(c).ms), b = new THREE.Box3(); ms.forEach(m => b.expandByObject(m)); const c = b.getCenter(new THREE.Vector3());
      if (slot.id === 'specchietti') { for (const s of [1, -1]) { const o = tag(buildItem(it), it, slot); o.position.set(c.x, b.max.y - .05, s * (b.max.z - .03)); if (s < 0) o.scale.z = -1; objs.push(o); } stock.push(hideMeshes(ms, 'specchietti di serie')); }
      else { const o = tag(buildItem(it), it, slot); o.position.set(c.x, slot.id === 'sella' ? b.min.y + .02 : c.y, slot.id === 'scarico' ? (c.z > 0 ? b.min.z : b.max.z) : 0); if (slot.id === 'scarico' && c.z < 0) o.scale.z = -1; objs.push(o); stock.push(hideMeshes(ms, slot.n + ' di serie')); }
    } else {
      // posizione automatica di partenza dalla geometria della moto (poi regolabile in Officina)
      const o = tag(buildItem(it), it, slot); const W = g.wheels, B = g.B, S = g.S; const fx = W ? W.front.x : B.max.x - .35, rx = W ? W.rear.x : B.min.x + .35, R = W ? W.R : .32;
      const pos = { scarico: [(fx + rx) / 2 - .1, ground + .26, -.17], carena: [fx - .3, ground + .66 * S.y, 0], faro: [fx - .18, ground + .62 * S.y, 0], serbatoio: [(fx + rx) / 2 + .15, ground + .66 * S.y, 0], comandi: [(fx + rx) / 2 - .05, ground + .28, .2],
        sospensioni: [rx + .2, ground + .5 * S.y, .16], motore: [(fx + rx) / 2, ground + .42 * S.y, .18], borse: [rx - .1, ground + .55 * S.y, .24], codino: [rx + .25, ground + .62 * S.y, 0], strumenti: [fx - .45, ground + .78 * S.y, 0], frecce: [rx - .25, ground + .45 * S.y, .12] };
      let p = pos[slot ? slot.id : ''] || [(fx + rx) / 2, ground + .6 * S.y, 0];
      if (slot && slot.id === 'parafanghi') { const front = (it.o || {}).posizione === 'anteriore'; const c = front ? (W ? W.front : B.max) : (W ? W.rear : B.min); p = [c.x, (W ? c.y : ground + .3), 0]; }
      if (slot && slot.id === 'frecce' && it.id === 'portatarga') p = [rx - .15, ground + .35, .14];
      o.position.set(...p); objs.push(o); note = 'posizione di partenza automatica: affinala con le maniglie in Officina';
    }
    // il nuovo pezzo prende il posto di quello montato prima nello stesso slot
    const prevObjs = prev.flatMap(e => [e.obj, ...(e.extra || [])]), prevPar = prevObjs.map(o => o.parent);
    const entry = { k: it.k, n: wSel && objs[0] ? objs[0].userData.accName : it.n, cat: it.cat, slot: slot && slot.id, it, obj: objs[0], extra: objs.slice(1), stock, kit: wSel && wSel.parte === 'gomma' ? [] : kitFor(it), anchor, side: anchorSide, fit: seatFitUsed, wh: wSel };
    const pst = wSel ? prev.flatMap(e => e.stock || []) : []; // ruote: i pezzi di serie della ruota sostituita tornano visibili, poi si nascondono solo quelli del nuovo componente
    const apply = () => { prevObjs.forEach(o => o.parent && o.parent.remove(o)); prev.forEach(removeEntry); pst.forEach(s => s.restore()); objs.forEach(o => scene.add(o)); stock.forEach(s => s.apply()); addEntry(entry); };
    const undo = () => { objs.forEach(o => o.parent && o.parent.remove(o)); stock.forEach(s => s.restore()); pst.forEach(s => s.apply()); removeEntry(entry); prevObjs.forEach((o, i) => (prevPar[i] || scene).add(o)); prev.forEach(addEntry); };
    // se c'era un accessorio nello stesso slot i pezzi di serie restano nascosti dai suoi stock
    if (prev.length && !wSel) { entry.stock = prev.flatMap(e => e.stock || []).concat(stock); }
    apply(); record('monta ' + it.n, undo, apply); objs.forEach(o => ctx.addedObj && ctx.addedObj(o));
    selectAcc(objs[0]); focus(objs); afterChange();
    toast((prev.length ? 'Sostituito: ' : stock.length ? 'Montato al posto del pezzo di serie: ' : 'Montato: ') + (wSel ? objs[0].userData.accName : it.n) + (note ? ' — ' + note : '') + (entry.kit.length ? ' · ' + entry.kit.length + ' accessori correlati consigliati' : ''));
    return entry;
  }
  async function addKit(entry, kitItem) {
    if (kitItem.add) { const base = CATALOG.find(c => c.id === kitItem.add.id && (!kitItem.add.o || Object.entries(kitItem.add.o).every(([k, v]) => String(c.o[k]) === String(v)))) || CATALOG.find(c => c.id === kitItem.add.id);
      if (base) { const e = await mount(base, { slot: kitItem.add.slot }); if (e) { e.kitOf = entry; e.why = kitItem.why; } if (kitItem.add.both && e) { const o2 = e.obj.clone(true); o2.position.z = -o2.position.z; o2.scale.z *= -1; tag(o2, base, slotById('comandi')); scene.add(o2); e.extra = [...(e.extra || []), o2]; } return; } }
    const e = { k: kitItem.k, n: kitItem.n, cat: 'Kit di montaggio', kitOf: entry, why: kitItem.why, service: true }; addEntry(e); record('aggiungi ' + kitItem.n, () => removeEntry(e), () => addEntry(e)); afterChange(); toast('Aggiunto alla configurazione: ' + kitItem.n);
  }

  /* ---------- camera: ingrandisci sulla selezione ---------- */
  function focus(objs) { const b = new THREE.Box3(); (Array.isArray(objs) ? objs : [objs]).forEach(o => o && b.expandByObject(o)); if (b.isEmpty()) return;
    const c = b.getCenter(new THREE.Vector3()), r = Math.max(.12, b.getSize(new THREE.Vector3()).length() / 2), dir = camera.position.clone().sub(controls.target).normalize(), d = r / Math.sin(camera.fov * Math.PI / 360) * 1.25;
    ctx.flyTo(c.clone().addScaledVector(dir, Math.max(d, .45)), c); }
  function fitAll() { const M = ctx.getModel(); if (!M) return; const b = new THREE.Box3().setFromObject(M), c = b.getCenter(new THREE.Vector3()), S = b.getSize(new THREE.Vector3());
    const dir = new THREE.Vector3(2.8, 1.1 - c.y, -3.2).normalize(), asp = Math.max(.4, camera.aspect), vf = camera.fov * Math.PI / 360, hf = Math.atan(Math.tan(vf) * asp), d = Math.max(Math.max(S.x, S.z) * .5 / Math.tan(hf), S.y * .62 / Math.tan(vf)) * 1.12; ctx.flyTo(c.clone().addScaledVector(dir, d), c); }

  /* ---------- barra rapida (sotto la vista, mai sopra la moto) ---------- */
  const Q = $('qbar');
  function syncQ() {
    const has = !!sel; $('qName').textContent = has ? nameOf(sel) : (ctx.cur() ? ctx.cur().n : 'Modello importato'); $('qCat').textContent = has ? catOf(sel) : 'Tocca un pezzo della moto per selezionarlo';
    Q.querySelectorAll('[data-q]').forEach(b => { const k = b.dataset.q; b.disabled = (['focus', 'color', 'swap', 'del', 'reset', 'none'].includes(k) && !has) || (k === 'piece' && !(has && sel.kind !== 'acc')) || (k === 'undo' && !H.length) || (k === 'redo' && !R.length); });
    $('qUndo').title = H.length ? 'Annulla: ' + H[H.length - 1].label : 'Niente da annullare'; $('qRedo').title = R.length ? 'Ripristina: ' + R[R.length - 1].label : 'Niente da ripristinare';
  }
  Q.addEventListener('click', e => { const b = e.target.closest('[data-q]'); if (!b || b.disabled) return; const k = b.dataset.q;
    if (k === 'undo') doUndo(); else if (k === 'redo') doRedo(); else if (k === 'none') select(null); else if (k === 'fit') fitAll();
    else if (k === 'focus') focus(meshesOf(sel));
    else if (k === 'color' || k === 'swap') { ctx.openPanel('cfg'); renderPanel(); setTimeout(() => { const t = $(k === 'color' ? 'cfgColor' : 'cfgAlt'); t && t.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 30); }
    else if (k === 'piece') { if (sel && sel.kind === 'piece' && sel.part) select({ kind: 'part', name: sel.part }); else selectPiece(); }
    else if (k === 'del') { if (sel.kind === 'part') hidePart(sel.name, true); else if (sel.kind === 'piece') hidePiece(sel.obj, true); else removeAcc(sel.obj, false); }
    else if (k === 'reset') { if (sel.kind === 'part') resetPart(sel.name); else if (sel.kind === 'piece') resetPiece(sel.obj); else removeAcc(sel.obj, true); }
    else if (k === 'panel') ctx.togglePanel(); });
  addEventListener('keydown', e => { if (document.activeElement && /INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)) return;
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z' && ctx.activeTab() !== 'edit') { e.preventDefault(); doUndo(); }
    else if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) { e.preventDefault(); doRedo(); }
    else if (e.key === 'Escape' && sel) select(null); });

  /* ---------- barra categorie (come nei configuratori dei costruttori) ---------- */
  const CB = $('cbar'); CB.innerHTML = SLOTS.map(s => `<button class="cb" data-s="${s.id}"><i>${s.ic}</i>${s.n}</button>`).join('') + '<button class="cb" data-s="_paint"><i>◍</i>Colore carrozzeria</button>';
  let slotView = null;
  CB.onclick = e => { const b = e.target.closest('[data-s]'); if (!b) return; slotView = b.dataset.s; CB.querySelectorAll('.cb').forEach(x => x.classList.toggle('on', x === b));
    const g = bikeGeo(); const s = slotById(slotView);
    if (s && s.pc && g) { const ms = s.pc.flatMap(c => g.byCat(c).ms); if (ms.length) { outline.selectedObjects = ms; focus(ms); } }
    else if (s && s.id === 'manubrio') { const fb = findBars(); if (fb) { outline.selectedObjects = []; focus(fb.bars.map(I => I.mesh)); } }
    const mounted = config.find(e2 => e2.slot === slotView && e2.obj); if (mounted) selectAcc(mounted.obj); else { sel = null; syncQ(); }
    ctx.openPanel('cfg'); renderPanel(); invalidate(); };

  /* ---------- pannello laterale «Configura» ---------- */
  const SW = ctx.SW;
  function altGrid(list, box) { box.innerHTML = ''; const PER = 18; let page = 0; const draw = () => { box.innerHTML = '';
      list.slice(0, (page + 1) * PER).forEach(it => { const b = document.createElement('button'); b.className = 'rp'; b.title = it.k + ' – ' + it.n;
        b.innerHTML = `<img alt="" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"><b>${it.n.split(' · ')[0]}</b><span>${it.n.split(' · ').slice(1).join(' · ')}</span><span class="code">${it.k}</span>`;
        const img = b.querySelector('img'); if (it.real) img.src = 'parts/thumbs/' + it.real + '.webp'; else ctx.thumbOf(it.k, () => buildPro(it.id, it.o), img);
        b.onclick = () => mount(it); box.appendChild(b); });
      if (list.length > (page + 1) * PER) { const m = document.createElement('button'); m.className = 'btn sm'; m.style.gridColumn = '1/-1'; m.textContent = `Mostra altri (${list.length - (page + 1) * PER})`; m.onclick = () => { page++; draw(); }; box.appendChild(m); } };
    draw(); }
  function renderPanel() {
    const P = $('cfgSel'); if (!P) return; const s = sel; const slot = s && s.kind === 'acc' ? slotById(s.obj.userData.slot) : (slotView && slotById(slotView)) || (s && s.kind === 'part' ? guessSlot(s.name) : guessSlotSel(s));
    let h = '';
    if (s) h += `<div class="sel"><div class="note">${catOf(s)}</div><div class="nm">${nameOf(s)}</div>${s.kind === 'acc' && s.obj.userData.code ? `<div class="note">Codice ${s.obj.userData.code}</div>` : ''}
      <div class="qa"><button class="btn sm" data-a="focus">Ingrandisci</button>${s.kind === 'part' ? '<button class="btn sm" data-a="piece">Solo il pezzo toccato</button>' : s.kind === 'piece' && s.part ? '<button class="btn sm" data-a="piece">Tutto il gruppo (stesso materiale)</button>' : ''}<button class="btn sm" data-a="del">Elimina</button><button class="btn sm" data-a="reset">${s.kind === 'acc' ? 'Torna di serie' : 'Ripristina'}</button>${s.kind === 'acc' ? '<button class="btn sm" data-a="edit">Sposta / misure</button>' : ''}<button class="btn sm" data-a="none">Deseleziona</button></div></div>`;
    else if (slotView === '_paint') h += `<div class="sel"><div class="nm">Colore carrozzeria</div><div class="note">Scegli una tinta: si applica a serbatoio, parafanghi e coperture della moto.</div></div>`;
    else if (slot) h += `<div class="sel"><div class="nm">${slot.n}</div><div class="note">Scegli un'alternativa: viene montata al posto del pezzo di serie. Puoi sempre annullare o tornare di serie.</div></div>`;
    else h += `<div class="sel"><div class="nm">Configura la tua moto</div><div class="note">Tocca un pezzo sulla moto oppure scegli una categoria nella barra sotto la vista.</div></div>`;
    if (s || slotView === '_paint') h += `<h3 id="cfgColor">Colore e finitura</h3><div class="sw" id="cfgSw"></div><div class="row"><input type="color" id="cfgCol" value="#7e0b12"><select id="cfgFin">${ctx.FIN.filter(f => f[0] !== 'orig').map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}</select><button class="btn sm pri" id="cfgApply">Applica</button></div>`;
    if (s && s.kind === 'acc') { const e = config.find(x => x.obj === s.obj || (x.extra || []).includes(s.obj)); if (e && e.kit && e.kit.length) h += `<h3>Da montare insieme</h3>` + e.kit.map((k, i) => `<div class="card warn"><b>${k.n}</b>${k.why}<div class="row"><span class="code">${k.k}</span><button class="btn sm pri" data-kit="${i}">${config.some(x => x.kitOf === e && x.k === k.k) ? 'Aggiunto ✓' : 'Aggiungi alla configurazione'}</button></div></div>`).join(''); }
    if (slot && slot.id === 'ruote') h += `<h3>Quale ruota e cosa cambiare</h3><div class="row" id="whPos">${[['ant', 'Anteriore'], ['post', 'Posteriore']].map(([v, l]) => `<button class="btn sm${whPos === v ? ' pri' : ''}" data-wp="${v}">${l}</button>`).join('')}</div><div class="row" id="whPart">${[['completa', 'Ruota completa'], ['cerchio', 'Solo cerchio'], ['gomma', 'Solo pneumatico']].map(([v, l]) => `<button class="btn sm${whPart === v ? ' pri' : ''}" data-wq="${v}">${l}</button>`).join('')}</div><div class="note">Ogni scelta cambia solo la ruota ${whPos === 'ant' ? 'anteriore' : 'posteriore'}${whPart === 'completa' ? '' : whPart === 'cerchio' ? ', e solo il cerchio (il pneumatico resta)' : ', e solo il pneumatico (il cerchio resta)'}.</div>`;
    if (slot) h += `<h3 id="cfgAlt">Alternative: ${slot.n}</h3><div class="row"><input id="cfgQ" type="search" placeholder="Filtra: cromato, 14&quot;, pelle…" class="inp"></div><div id="cfgAltGrid" class="rgrid"></div>`;
    P.innerHTML = h;
    P.querySelectorAll('[data-a]').forEach(b => b.onclick = () => { const a = b.dataset.a; if (a === 'edit') { ctx.editObj(s.obj); return; } Q.querySelector(`[data-q="${a}"]`).click(); });
    const swb = $('cfgSw'); if (swb) SW.forEach(([n, c, f]) => { const b = document.createElement('button'); b.title = n; b.style.background = `radial-gradient(circle at 35% 30%,#ffffff55,transparent 45%),${c}`; b.onclick = () => { $('cfgCol').value = c; $('cfgFin').value = f; $('cfgApply').click(); }; swb.appendChild(b); });
    const ap = $('cfgApply'); if (ap) ap.onclick = () => { const c = $('cfgCol').value, f = $('cfgFin').value; if (!s) { paintMany(ctx.bodyParts(), c, f, 'colore carrozzeria'); return; } if (s.kind === 'part') paintPart(s.name, c, f); else { if (s.kind === 'piece' && !s.obj.userData.origMat) s.obj.userData.origMat = s.obj.material; paintAcc(s.obj, c, f); } };
    P.querySelectorAll('[data-wp]').forEach(b => b.onclick = () => { whPos = b.dataset.wp; renderPanel(); });
    P.querySelectorAll('[data-wq]').forEach(b => b.onclick = () => { whPart = b.dataset.wq; renderPanel(); });
    P.querySelectorAll('[data-kit]').forEach(b => b.onclick = () => { const e = config.find(x => x.obj === s.obj || (x.extra || []).includes(s.obj)); const k = e.kit[+b.dataset.kit]; if (config.some(x => x.kitOf === e && x.k === k.k)) return; addKit(e, k); });
    if (slot) { const base = itemsForSlot(slot); const g = $('cfgAltGrid'), q = $('cfgQ'); const run = () => { const t = q.value.toLowerCase().split(/\s+/).filter(Boolean); altGrid(base.filter(c => t.every(x => c.s.includes(x))), g); }; let tq; q.oninput = () => { clearTimeout(tq); tq = setTimeout(run, 160); }; run(); }
  }
  function guessSlotSel(s) { return s && s.kind === 'piece' ? guessSlot(s.part) : null; }
  function guessSlot(name) { const p = parts().get(name); if (!p) return null; return SLOTS.find(s => s.pc && s.pc.includes(p.cat)) || (p.cat === 'Carrozzeria e verniciatura' ? null : null); }

  function renderList() {
    const L = $('cfgList'); if (!L) return; if (!config.length) { L.innerHTML = '<div class="note">Moto di serie: nessuna modifica. Ogni pezzo montato compare qui con il suo codice e gli accessori da abbinare.</div>'; $('cfgCount').textContent = ''; return; }
    const main = config.filter(e => !e.kitOf); let h = '';
    for (const e of main) { const kids = config.filter(k => k.kitOf === e), miss = (e.kit || []).filter(k => !kids.some(x => x.k === k.k));
      h += `<div class="ce"><div class="r"><b>${e.n.split(' · ')[0]}</b><span class="code">${e.k}</span></div><div class="note">${e.n.split(' · ').slice(1).join(' · ')}</div>`;
      kids.forEach(k => h += `<div class="ck">↳ ${k.n} <span class="code">${k.k}</span></div>`);
      if (miss.length) h += `<div class="ck warn">⚠ Mancano ${miss.length} accessori correlati: ${miss.map(m => m.n).join(', ')}</div>`;
      h += `<div class="r"><button class="btn sm" data-sel="${config.indexOf(e)}">Seleziona</button><button class="btn sm" data-rm="${config.indexOf(e)}">Rimuovi</button></div></div>`; }
    L.innerHTML = h; $('cfgCount').textContent = config.length + ' voci';
    L.querySelectorAll('[data-sel]').forEach(b => b.onclick = () => { const e = config[+b.dataset.sel]; if (e.obj) { selectAcc(e.obj); focus([e.obj, ...(e.extra || [])]); } });
    L.querySelectorAll('[data-rm]').forEach(b => b.onclick = () => { const e = config[+b.dataset.rm]; if (e.obj) removeAcc(e.obj, true); else { removeEntry(e); record('rimuovi ' + e.n, () => addEntry(e), () => removeEntry(e)); afterChange(); } });
  }
  $('cfgStock').onclick = () => { if (!config.length && !H.length) { toast('La moto è già di serie'); return; } const all = config.filter(e => !e.kitOf && e.obj); all.forEach(e => removeAcc(e.obj, true)); config.filter(e => e.service).forEach(removeEntry); afterChange(); toast('Moto riportata di serie (puoi annullare)'); };
  $('cfgExport').onclick = () => { const t = ['Configurazione NJ.D\' RIDE — ' + (ctx.cur() ? ctx.cur().n : ''), '', ...config.map(e => (e.kitOf ? '   ↳ ' : '• ') + e.k + '  ' + e.n)].join('\n'); const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([t], { type: 'text/plain' })); a.download = 'configurazione.txt'; a.click(); };

  // i trascinamenti con le maniglie dell'officina entrano nella stessa cronologia
  if (ctx.tc) { let st = null; ctx.tc.addEventListener('dragging-changed', e => { const o = ctx.tc.object; if (!o) return; if (e.value) st = { o, p: o.position.clone(), q: o.quaternion.clone(), s: o.scale.clone() };
    else if (st && st.o === o) { const a = st, b = { p: o.position.clone(), q: o.quaternion.clone(), s: o.scale.clone() }; const set = x => { o.position.copy(x.p); o.quaternion.copy(x.q); o.scale.copy(x.s); }; record('sposta ' + (o.userData.accName || 'pezzo'), () => set(a), () => set(b)); st = null; } }); }

  renderList(); renderPanel(); syncQ();
  const toRm = [];
  return { select, selectAt, selectPart, selectAcc, get sel() { return sel; }, paintPart, paintMany, hidePart, resetPart, mount, fitAll, focus, undo: doUndo, redo: doRedo, record, reset() { config.forEach(e => [e.obj, ...(e.extra || [])].forEach(o => o && o.parent && o.parent.remove(o))); scene.traverse(o => { if (o.userData && o.userData.acc && o.parent === scene) toRm.push(o); }); toRm.splice(0).forEach(o => scene.remove(o)); config.length = 0; H.length = 0; R.length = 0; sel = null; slotView = null; geoCache = null; outline.selectedObjects = []; renderList(); renderPanel(); syncQ(); },
    setSize(w, h) { outline.setSize(w, h); }, outline, config, findBars, renderPanel };
}
