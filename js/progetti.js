/* NJ.D' RIDE – progetti: ogni lavoro si salva con un nome dentro il programma (PC e telefono), si riapre quando si vuole,
   si rinomina, si duplica, si esporta o si elimina. Le modifiche del progetto aperto si salvano da sole; il lavoro non salvato
   si recupera alla riapertura. © 2026 dott. Jonathan D'Eugenio – Tutti i diritti riservati. */
import * as THREE from 'three';

const FMT = 1, AUTO = '__auto';
/* ---------- archivio locale (IndexedDB): indice leggero e stato completo separati ---------- */
let dbp = null;
function db() { if (dbp) return dbp; dbp = new Promise((res, rej) => { const r = indexedDB.open('njd-ride', 1);
  r.onupgradeneeded = () => { const d = r.result; if (!d.objectStoreNames.contains('indice')) d.createObjectStore('indice', { keyPath: 'id' }); if (!d.objectStoreNames.contains('stati')) d.createObjectStore('stati', { keyPath: 'id' }); };
  r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); return dbp; }
const req = r => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
async function tx(stores, fn) { const d = await db(); return new Promise((res, rej) => { const t = d.transaction(stores, 'readwrite'); t.oncomplete = () => res(); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error || new Error('scrittura annullata')); fn(t); }); }
export async function elenco() { const d = await db(); const L = await req(d.transaction('indice').objectStore('indice').getAll()); return L.filter(x => x.id !== AUTO).sort((a, b) => b.data - a.data); }
async function scrivi(meta, stato) { await tx(['indice', 'stati'], t => { t.objectStore('indice').put(meta); t.objectStore('stati').put({ id: meta.id, stato }); }); }
async function leggi(id) { const d = await db(); const t = d.transaction(['indice', 'stati']); const [m, s] = await Promise.all([req(t.objectStore('indice').get(id)), req(t.objectStore('stati').get(id))]); return m && s ? { meta: m, stato: s.stato } : null; }
async function cancella(id) { await tx(['indice', 'stati'], t => { t.objectStore('indice').delete(id); t.objectStore('stati').delete(id); }); }
async function aggiornaMeta(id, f) { const d = await db(); const m = await req(d.transaction('indice').objectStore('indice').get(id)); if (!m) return; f(m); await tx(['indice'], t => t.objectStore('indice').put(m)); }

/* ---------- utilità di serializzazione ---------- */
const r6 = x => Math.round(x * 1e6) / 1e6;
const mArr = m => m.elements.map(r6);
function b64(arr) { const u8 = new Uint8Array(arr.buffer, arr.byteOffset, arr.byteLength); let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s); }
function daB64(s, T) { const b = atob(s), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return new T(u.buffer); }
const PROPS = ['metalness', 'roughness', 'clearcoat', 'clearcoatRoughness', 'sheen', 'sheenRoughness', 'transmission', 'thickness', 'ior', 'opacity', 'envMapIntensity', 'emissiveIntensity', 'iridescence', 'specularIntensity', 'alphaTest', 'polygonOffsetFactor'];
const COLS = ['color', 'emissive', 'sheenColor', 'specularColor', 'attenuationColor'];
const MAPS = ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'emissiveMap', 'alphaMap', 'clearcoatNormalMap', 'bumpMap'];
function udPulito(u) { const o = {}; for (const [k, v] of Object.entries(u || {})) { if (k.startsWith('__')) continue; if (v === null || ['string', 'number', 'boolean'].includes(typeof v)) o[k] = v; else if (Array.isArray(v) && v.every(x => typeof x !== 'object')) o[k] = v; } return o; }
function immagineDati(t, max = 2048) { const img = t && t.image; if (!img) return null; try { const w = img.width || (img.data && img.width), h = img.height; if (!w || !h) return null; const k = Math.min(1, max / Math.max(w, h));
    const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w * k)); c.height = Math.max(1, Math.round(h * k)); const g = c.getContext('2d');
    if (img.data && !(img instanceof HTMLCanvasElement)) { const tmp = document.createElement('canvas'); tmp.width = w; tmp.height = h; const d = new Uint8ClampedArray(w * h * 4), src = img.data; for (let i = 0; i < w * h; i++) { d[i * 4] = src[i * 4]; d[i * 4 + 1] = src[i * 4 + 1]; d[i * 4 + 2] = src[i * 4 + 2]; d[i * 4 + 3] = src[i * 4 + 3] ?? 255; } tmp.getContext('2d').putImageData(new ImageData(d, w, h), 0, 0); g.drawImage(tmp, 0, 0, c.width, c.height); }
    else g.drawImage(img, 0, 0, c.width, c.height); return c.toDataURL('image/png'); } catch (e) { return null; } }
function geoDati(g) { const o = {}; for (const k of ['position', 'normal', 'uv']) { const a = g.attributes[k]; if (a) o[k] = [a.itemSize, a.array.constructor.name, b64(a.array)]; } if (g.index) o.index = [g.index.array.constructor.name, b64(g.index.array)]; return o; }
function daGeoDati(o) { const g = new THREE.BufferGeometry(); const T = { Float32Array, Uint16Array, Uint32Array, Int16Array, Int8Array, Uint8Array };
  for (const k of ['position', 'normal', 'uv']) if (o[k]) g.setAttribute(k, new THREE.BufferAttribute(daB64(o[k][2], T[o[k][1]] || Float32Array), o[k][0])); if (o.index) g.setIndex(new THREE.BufferAttribute(daB64(o.index[1], T[o.index[0]] || Uint32Array), 1)); g.computeBoundingBox(); g.computeBoundingSphere(); return g; }

export function initProgetti(ctx) {
  const { scene, camera, controls, toast, $, invalidate } = ctx;
  /* ---------- diario della sessione: chiavi stabili dei pezzi e operazioni che cambiano la geometria ---------- */
  let D = { model: null, ops: [], k2o: new Map(), cont: new Map(), np: 0, nd: 0 }, prontoRes = null, prontoP = new Promise(r => prontoRes = r);
  const MAT0 = new WeakMap(), W0 = new WeakMap(), V0 = new WeakMap(), TEX0 = new Map();
  const chiave = o => o && o.userData ? o.userData.k : null;
  function registra(o, k) { o.userData.k = k; D.k2o.set(k, o); o.updateMatrixWorld(true); W0.set(o, o.matrixWorld.clone()); V0.set(o, o.visible); if (o.isMesh) MAT0.set(o, o.material); }
  function pronto(M) { if (!M || D.model === M) return; D = { model: M, ops: [], k2o: new Map(), cont: new Map(), np: 0, nd: 0 }; TEX0.clear(); let i = 0; M.updateMatrixWorld(true);
    M.traverse(o => { if (o.isMesh) { registra(o, 'm' + (i++)); for (const mt of [].concat(o.material || [])) for (const s of MAPS) if (mt[s] && !TEX0.has(mt[s].uuid)) TEX0.set(mt[s].uuid, { k: o.userData.k, s }); } });
    D.k2o.set('M', M); if (!apertura) { if (corrente) { corrente = null; stato(''); } } prontoRes(M); prontoP = new Promise(r => prontoRes = r); setTimeout(() => offriRipresa(), 600); }
  function diario(tipo, a, b, c, d2) { if (!D.model) return;
    if (tipo === 'split') { const mesh = a, ids = b, out = c, k = chiave(mesh); if (!k || !D.k2o.has(k)) return; let n = D.cont.get(k) || 0; out.forEach(o => registra(o, k + '.' + (++n))); D.cont.set(k, n); D.ops.push({ t: 's', m: k, ids }); }
    else if (tipo === 'perno') { const G = a, objs = b, par = c, ks = objs.map(chiave); if (ks.some(x => !x)) return; const k = 'p' + (++D.np); registra(G, k); D.ops.push({ t: 'p', k, par: chiave(par) || 'M', m: ks }); }
    else if (tipo === 'dup') { const cl = a, src = b, ks = chiave(src); if (!ks || !D.k2o.has(ks)) return; const k = 'd' + (++D.nd); rekey(cl, k); D.ops.push({ t: 'd', k, src: ks }); } }
  /* copia di un pezzo della moto (Duplica sull'altro lato): chiavi nuove per lei e per i pezzi che contiene */
  function rekey(cl, k) { let i = 0; registra(cl, k); cl.traverse(o => { if (o !== cl && (o.isMesh || o.userData.perno)) registra(o, k + '/' + (i++)); }); }
  /* ---------- stato del progetto ---------- */
  let apertura = false;
  function texRef(t, tabTex) { if (!t) return null; if (TEX0.has(t.uuid)) return { o: TEX0.get(t.uuid) }; const noti = window.__texNoti || {}; for (const [n, v] of Object.entries(noti)) if (v === t) return { n };
    if (!tabTex.has(t.uuid)) { const d = immagineDati(t); if (!d) return null; tabTex.set(t.uuid, { id: 't' + tabTex.size, d }); } return { d: tabTex.get(t.uuid).id }; }
  function serMat(m, tabTex) { const o = { t: m.type, n: m.name, side: m.side, tr: m.transparent, dw: m.depthWrite, ud: udPulito(m.userData) };
    for (const k of PROPS) if (typeof m[k] === 'number') o[k] = r6(m[k]); for (const k of COLS) if (m[k] && m[k].isColor) o[k] = m[k].getHex();
    if (m.normalScale) o.ns = [m.normalScale.x, m.normalScale.y]; for (const k of MAPS) if (m[k]) { const r = texRef(m[k], tabTex); if (r) { o[k] = r; if (m[k].repeat) o[k + 'R'] = [m[k].repeat.x, m[k].repeat.y]; } } return o; }
  function creaMat(o, tex) { const C = THREE[o.t] && THREE[o.t].prototype && THREE[o.t].prototype.isMaterial ? THREE[o.t] : THREE.MeshPhysicalMaterial, m = new C({ name: o.n });
    for (const k of PROPS) if (o[k] !== undefined && k in m) m[k] = o[k]; for (const k of COLS) if (o[k] !== undefined && m[k] && m[k].isColor) m[k].setHex(o[k]);
    if (o.ns && m.normalScale) m.normalScale.set(o.ns[0], o.ns[1]); if (o.side !== undefined) m.side = o.side; m.transparent = !!o.tr; if (o.dw !== undefined) m.depthWrite = o.dw; m.userData = { ...(o.ud || {}) };
    for (const k of MAPS) if (o[k]) { const t = tex(o[k], k); if (t) { m[k] = t; if (o[k + 'R'] && t.repeat && !(o[k].n)) t.repeat.set(...o[k + 'R']); } } m.needsUpdate = true; return m; }
  function cattura() {
    const M = ctx.getModel(); if (!M || D.model !== M || !ctx.cur()) return null; M.updateMatrixWorld(true); scene.updateMatrixWorld(true); const tabTex = new Map(), mats = [], matId = new Map();
    const idMat = m => { if (!matId.has(m)) { matId.set(m, mats.length); mats.push(serMat(m, tabTex)); } return matId.get(m); };
    const parti = ctx.getParts(), pDi = new Map(); for (const p of parti.values()) for (const [o] of p.meshes) pDi.set(o, p);
    const pezzi = [];
    for (const [k, o] of D.k2o) { if (k === 'M') continue; let dentro = false; for (let p = o; p; p = p.parent) if (p === M) { dentro = true; break; } if (!dentro) continue;
      const w0 = W0.get(o), mosso = o.userData.perno || !w0 || o.matrixWorld.elements.some((v, i) => Math.abs(v - w0.elements[i]) > 1e-6); const vis = o.visible !== V0.get(o) ? o.visible : undefined; let m;
      if (o.isMesh && !Array.isArray(o.material)) { const P = pDi.get(o), cur = o.material; if (P && cur === P.cur) m = undefined; else if (cur === MAT0.get(o)) m = P && P.cur !== cur ? 'o' : undefined; else m = idMat(cur); }
      if (mosso || vis !== undefined || m !== undefined) pezzi.push({ k, w: mosso ? mArr(o.matrixWorld) : undefined, v: vis, m }); }
    const tinte = [...parti.values()].filter(p => p.cur !== p.orig).map(p => ({ n: p.name, c: p.color, f: p.finish }));
    // accessori: come ricostruirli, dove stanno, colori e finiture
    const accs = [], accIdx = new Map();
    for (const o of scene.children) { if (!o.userData || !o.userData.acc) continue; const r = ricetta(o, tabTex); if (!r) continue; o.updateMatrixWorld(true); accIdx.set(o, accs.length);
      const mm = []; let i = 0; o.traverse(c => { if (c.isMesh) { if (c.material && !Array.isArray(c.material) && c.material.userData && c.material.userData.mod) mm.push([i, idMat(c.material)]); i++; } });
      accs.push({ r, w: mArr(o.matrixWorld), v: o.visible, nome: o.userData.accName, kb: o.userData.kbType, ov: o.userData.slotOv || null, mm }); }
    const voci = ctx.CFG().esporta(o => accIdx.has(o) ? accIdx.get(o) : -1, o => chiave(o));
    const vista = { cam: camera.position.toArray().map(r6), t: controls.target.toArray().map(r6), fov: camera.fov, ...(ctx.ambiente ? ctx.ambiente() : {}) };
    return { v: FMT, moto: ctx.cur() ? ctx.cur().id : null, ops: D.ops.slice(), tinte, nascoste: [...ctx.hidden], pezzi, mats, tex: [...tabTex.values()], accs, voci, decal: ctx.esportaDecal ? ctx.esportaDecal(b64, geoDati, immagineDati) : [], vista };
  }
  function ricetta(o, tabTex) { const u = o.userData;
    if (u.real) return { tipo: 'reale', id: u.real, posto: u.posto || null, it: u.item ? itPulito(u.item) : null };
    if (u.pipe) return { tipo: 'pipe', pts: u.pipe.pts.map(v => v.toArray().map(r6)), opz: u.pipe.opz || null };
    if (u.pro) return { tipo: 'pro', id: u.pro, opts: optsPulite(u.opts), it: u.item ? itPulito(u.item) : null, slot: u.slot || null };
    if (u.ricetta && u.ricetta.tipo !== 'copia') return u.ricetta;
    // qualsiasi altro accessorio (pezzi copiati da altre moto…): la sua geometria viaggia nel progetto
    const parti = []; o.updateMatrixWorld(true); const inv = new THREE.Matrix4().copy(o.matrixWorld).invert();
    o.traverse(c => { if (!c.isMesh || Array.isArray(c.material)) return; const loc = new THREE.Matrix4().multiplyMatrices(inv, c.matrixWorld); parti.push({ g: geoDati(c.geometry), m: serMat(c.material, tabTex), w: mArr(loc) }); });
    return { tipo: 'geometria', parti, type: u.type || 'generic' }; }
  const itPulito = it => { const o = {}; for (const [k, v] of Object.entries(it || {})) if (k !== 's' && !k.startsWith('__')) o[k] = k === 'o' ? optsPulite(v) : v; return o; };
  const optsPulite = op => { if (!op) return null; const o = {}; for (const [k, v] of Object.entries(op)) if (!k.startsWith('__') && (v === null || typeof v !== 'object' || Array.isArray(v))) o[k] = v; return o; };

  /* ---------- riapertura: stessa moto, stessi pezzi separati, stessi spostamenti, colori, accessori ---------- */
  async function applica(st) {
    const M = ctx.getModel(), k2o = k => D.k2o.get(k); const CFG = ctx.CFG(), OF = ctx.OF(); let saltati = 0;
    for (const op of st.ops || []) { try {
      if (op.t === 's') { const m = k2o(op.m); if (!m) { saltati++; continue; } CFG.separaIsole(m, op.ids); }
      else if (op.t === 'd') { const src = k2o(op.src); if (!src || !src.parent) { saltati++; continue; } const cl = src.clone(); cl.userData = { ...src.userData, origin: null }; src.parent.add(cl); cl.traverse(m => { if (m.isMesh) ctx.registraMesh && ctx.registraMesh(m); }); D.nd++; rekey(cl, op.k); D.ops.push({ t: 'd', k: op.k, src: op.src }); }
      else if (op.t === 'p') { const objs = op.m.map(k2o).filter(Boolean); if (objs.length !== op.m.length) { saltati++; continue; } const G = OF.pernoDa(objs, objs.length > 1 ? 'Componente' : 'Pezzo'); if (G && chiave(G) !== op.k) { D.k2o.delete(chiave(G)); registra(G, op.k); } }
    } catch (e) { saltati++; console.warn('ripristino', op, e); } }
    M.userData.__idx = null;
    const parti = ctx.getParts(); for (const t of st.tinte || []) { const p = parti.get(t.n); if (p) try { ctx.repaint(p, t.c, t.f); } catch (e) { console.warn('tinta', t, e); } }
    ctx.hidden.clear(); (st.nascoste || []).forEach(n => ctx.hidden.add(n));
    const texCache = new Map(), tdati = new Map((st.tex || []).map(t => [t.id, t.d]));
    const tex = (r, slot) => { if (r.o) { const o = k2o(r.o.k), m0 = o && MAT0.get(o); return m0 ? (Array.isArray(m0) ? m0[0] : m0)[r.o.s] || null : null; } if (r.n) return (window.__texNoti || {})[r.n] || null;
      if (r.d) { if (!texCache.has(r.d)) { const d = tdati.get(r.d); if (!d) return null; const t = new THREE.TextureLoader().load(d, () => invalidate()); t.wrapS = t.wrapT = THREE.RepeatWrapping; if (slot === 'map' || slot === 'emissiveMap') t.colorSpace = THREE.SRGBColorSpace; texCache.set(r.d, t); } return texCache.get(r.d); } return null; };
    const mats = (st.mats || []).map(o => { try { return creaMat(o, tex); } catch (e) { return null; } });
    const prof = o => { let n = 0; for (let p = o.parent; p; p = p.parent) n++; return n; };
    const L = (st.pezzi || []).map(x => ({ x, o: k2o(x.k) })).filter(y => { if (!y.o) saltati++; return y.o; }).sort((a, b) => prof(a.o) - prof(b.o)); const inv = new THREE.Matrix4(), W = new THREE.Matrix4();
    for (const { x, o } of L) { if (x.w) { W.fromArray(x.w); o.parent.updateMatrixWorld(true); inv.copy(o.parent.matrixWorld).invert(); W.premultiply(inv); W.decompose(o.position, o.quaternion, o.scale); o.updateMatrixWorld(true); }
      if (x.v !== undefined) o.visible = x.v; if (x.m === 'o') o.material = MAT0.get(o); else if (x.m !== undefined && mats[x.m]) o.material = mats[x.m]; }
    // accessori
    const stockDi = []; for (const v of st.voci || []) if (v.obj >= 0) stockDi[v.obj] = (v.stock || []).flatMap(s0 => (s0.ms || []).map(k2o)).filter(Boolean);
    const accObjs = []; for (const [ia, a] of (st.accs || []).entries()) { let o = null; try { o = await ricostruisci(a.r, st, stockDi[ia]); } catch (e) { console.warn('accessorio', a.r, e); } if (!o) { accObjs.push(null); saltati++; continue; }
      W.fromArray(a.w); W.decompose(o.position, o.quaternion, o.scale); o.visible = a.v !== false; o.userData.acc = true; if (a.nome) o.userData.accName = a.nome; if (a.kb) o.userData.kbType = a.kb;
      if (a.ov && Object.keys(a.ov).length) { o.userData.slotOv = a.ov; OF.applicaSlot(o); } let i = 0; const mm = new Map(a.mm || []); o.traverse(c => { if (c.isMesh) { if (mm.has(i) && mats[mm.get(i)]) c.material = mats[mm.get(i)]; i++; c.userData.accPart = o; c.castShadow = c.receiveShadow = true; } });
      scene.add(o); OF.registraAccessorio(o); accObjs.push(o); }
    try { CFG.importa(st.voci || [], i => (i >= 0 ? accObjs[i] : null), k2o); } catch (e) { console.warn('configurazione', e); }
    if (st.decal && ctx.importaDecal) try { ctx.importaDecal(st.decal, daB64, daGeoDati); } catch (e) { console.warn('grafiche', e); }
    if (st.vista) { try { camera.position.fromArray(st.vista.cam); controls.target.fromArray(st.vista.t); if (st.vista.fov) { camera.fov = st.vista.fov; camera.updateProjectionMatrix(); } controls.update(); if (ctx.impostaAmbiente) ctx.impostaAmbiente(st.vista); } catch (e) { } }
    M.userData.__idx = null; ctx.aggiorna && ctx.aggiorna(); invalidate(); return saltati; }
  async function ricostruisci(r, st, stockMs) { const CFG = ctx.CFG(), OF = ctx.OF();
    switch (r.tipo) {
      case 'reale': { const g = await ctx.loadPart(r.id); const it = r.it || { real: r.id, n: r.id, t: 'generic' }; const o = CFG.costruisciReale({ ...it, real: r.id }, g); o.userData.posto = r.posto; o.userData.item = it; o.userData.ricetta = { tipo: 'reale', id: r.id }; return o; }
      case 'pro': { const o = CFG.ricostruisciPro(r.id, r.opts || (r.it && r.it.o) || undefined, r.slot, stockMs); if (r.it) { o.userData.item = r.it; o.userData.code = r.it.k; } if (r.slot) o.userData.slot = r.slot; return o; }
      case 'pipe': { const P = { pts: r.pts.map(a => new THREE.Vector3(...a)), handles: [], opz: r.opz }; return OF.creaPipe(P); }
      case 'acc': { const L = OF.ACCLIB.find(([c]) => c === r.cat); const f = L && L[1].find(([n]) => n === r.n); if (!f) return null; const o = f[1](); o.userData.ricetta = r; return o; }
      case 'gomma': { const o = OF.ACCFN.tire(r.o); o.userData.ricetta = r; o.userData.kbType = 'tire'; return o; }
      case 'ruota': { const o = OF.ACCFN.wheel(r.o); o.userData.ricetta = r; o.userData.kbType = 'wheel'; return o; }
      case 'geometria': { const G = new THREE.Group(); const tabTex = new Map((st.tex || []).map(t => [t.id, t.d])); const tl = new THREE.TextureLoader();
        for (const p of r.parti) { const m = creaMat(p.m, (ref, slot) => { if (ref.n) return (window.__texNoti || {})[ref.n] || null; if (ref.d && tabTex.get(ref.d)) { const t = tl.load(tabTex.get(ref.d), () => invalidate()); if (slot === 'map') t.colorSpace = THREE.SRGBColorSpace; return t; } return null; });
          const mesh = new THREE.Mesh(daGeoDati(p.g), m); new THREE.Matrix4().fromArray(p.w).decompose(mesh.position, mesh.quaternion, mesh.scale); G.add(mesh); }
        G.userData = { type: r.type, ricetta: { tipo: 'copia' } }; return G; }
    } return null; }

  /* ---------- progetto aperto, salvataggi ---------- */
  let corrente = null, sporco = false, tSalva = null, inSalvataggio = false;
  const nuovoId = () => 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  function miniatura() { try { const c = ctx.renderer.domElement; ctx.renderOra && ctx.renderOra(); const W = 320, H = Math.round(W * c.height / c.width) || 180, t = document.createElement('canvas'); t.width = W; t.height = H; t.getContext('2d').drawImage(c, 0, 0, W, H); return t.toDataURL('image/jpeg', .72); } catch (e) { return null; } }
  async function salva(id, nome, quiet) { const st = cattura(); if (!st) { if (!quiet) toast(ctx.getModel() && !ctx.cur() ? 'I progetti si salvano sulle moto del garage (non sui modelli GLB importati)' : 'Attendi: la moto si sta ancora preparando'); return null; } inSalvataggio = true;
    try { const old = id ? await leggi(id).catch(() => null) : null; const meta = { id: id || nuovoId(), nome: nome || (old && old.meta.nome) || nomeDefault(), moto: st.moto, motoNome: ctx.cur() ? ctx.cur().n : 'Modello importato', creato: old ? old.meta.creato : Date.now(), data: Date.now(), miniatura: miniatura() || (old && old.meta.miniatura) || null, pezzi: st.pezzi.length, accessori: st.accs.length };
      await scrivi(meta, st); sporco = false; return meta; }
    catch (e) { console.error('salvataggio progetto', e); if (!quiet) toast('Salvataggio non riuscito: ' + (e && e.message || e)); return null; } finally { inSalvataggio = false; } }
  const nomeDefault = () => (($('cfgNome') && $('cfgNome').value.trim()) || ((ctx.cur() ? ctx.cur().n : 'Moto') + ' custom'));
  function stato(t) { const el = $('pgStato'); if (el) el.textContent = t || (corrente ? 'Progetto aperto: «' + corrente.nome + '» · le modifiche si salvano da sole' : 'Nessun progetto aperto: il lavoro si salva da solo come «lavoro non salvato» e si recupera alla riapertura'); }
  async function salvaAuto() { clearTimeout(tSalva); tSalva = null; if (!sporco || apertura || inSalvataggio || !ctx.getModel() || D.model !== ctx.getModel()) return;
    if (corrente) { const m = await salva(corrente.id, corrente.nome, true); if (m) stato('Progetto «' + m.nome + '» salvato alle ' + new Date(m.data).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })); }
    else { await salva(AUTO, 'Lavoro non salvato', true); } }
  function modificato() { if (apertura || !D.model) return; sporco = true; clearTimeout(tSalva); tSalva = setTimeout(salvaAuto, 4000); }
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && sporco) salvaAuto(); });
  addEventListener('pagehide', () => { if (sporco) salvaAuto(); });
  try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch (e) { }
  async function apri(id) { const r = await leggi(id); if (!r) { toast('Progetto non trovato'); return false; } return apriStato(r.stato, id === AUTO ? null : { id, nome: r.meta.nome }); }
  async function apriStato(st, come) { const m = ctx.MODELS.find(x => x.id === st.moto); if (!m) { toast('La moto di questo progetto non è più nel garage'); return false; }
    if (sporco) await salvaAuto(); apertura = true; const L = $('load'), LT = $('loadT');
    try { const attesa = prontoP; await ctx.loadModel(m); if (D.model !== ctx.getModel()) await Promise.race([attesa, new Promise(r => setTimeout(r, 20000))]); if (D.model !== ctx.getModel()) pronto(ctx.getModel());
      if (L) { L.style.display = 'flex'; LT.textContent = 'Apro il progetto' + (come ? ' «' + come.nome + '»' : '') + '…'; }
      const salt = await applica(st); corrente = come; if (come && $('cfgNome')) $('cfgNome').value = come.nome; sporco = false;
      toast((come ? 'Progetto «' + come.nome + '» aperto' : 'Lavoro non salvato recuperato') + (salt ? ' (' + salt + ' elementi non ricostruiti)' : '')); stato(); return true; }
    catch (e) { console.error('apertura progetto', e); toast('Apertura non riuscita: ' + (e && e.message || e)); return false; }
    finally { apertura = false; if (L) L.style.display = 'none'; invalidate(); } }
  /* ---------- lavoro non salvato della volta prima ---------- */
  let offerta = false;
  async function offriRipresa() { if (offerta || corrente || apertura) return; offerta = true; let r = null; try { r = await leggi(AUTO); } catch (e) { return; } if (!r || !r.stato) return; const st = r.stato;
    if (!((st.ops && st.ops.length) || (st.accs && st.accs.length) || (st.tinte && st.tinte.length) || (st.pezzi && st.pezzi.length))) return;
    const b = document.createElement('div'); b.className = 'pgRipresa'; const quando = new Date(r.meta.data).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    b.innerHTML = `<span>Lavoro non salvato del ${quando} (${r.meta.motoNome || r.meta.moto})</span><button class="btn sm pri" data-a="si">Riprendi</button><button class="btn sm" data-a="salva">Salva come progetto</button><button class="btn sm" data-a="no">Scarta</button>`;
    ($('view') || document.body).appendChild(b);
    b.onclick = async e => { const a = e.target.closest('[data-a]'); if (!a) return; b.remove(); if (a.dataset.a === 'si') await apriStato(st, null);
      else if (a.dataset.a === 'salva') { const nome = (r.meta.motoNome || 'Moto') + ' custom ' + quando; const meta = { ...r.meta, id: nuovoId(), nome, data: Date.now() }; await scrivi(meta, st); await cancella(AUTO); toast('Salvato tra i progetti: «' + nome + '»'); }
      else { await cancella(AUTO); toast('Lavoro non salvato scartato'); } }; }

  /* ---------- finestra «Progetti» ---------- */
  const mod = document.createElement('div'); mod.className = 'modal'; mod.id = 'mProg';
  mod.innerHTML = `<div class="box" style="max-width:780px">
    <div class="row" style="justify-content:space-between"><b style="font-size:15px">Progetti</b><button class="btn sm" data-x>Chiudi</button></div>
    <div class="note" id="pgStato"></div>
    <div class="row" style="flex-wrap:wrap;gap:6px"><input id="pgNome" class="inp" maxlength="80" placeholder="Nome del progetto" style="flex:1;min-width:180px">
      <button class="btn sm pri" id="pgSalva">Salva</button><button class="btn sm" id="pgCome">Salva come nuovo</button></div>
    <div class="row" style="flex-wrap:wrap;gap:6px"><button class="btn sm" id="pgNuovo">Nuovo progetto (moto di serie)</button><button class="btn sm" id="pgImp">Importa un progetto (.njd)</button><input type="file" id="pgFile" accept=".njd,.json,application/json" hidden></div>
    <h3>I tuoi progetti</h3><div id="pgLista" class="pgLista"><div class="note">Caricamento…</div></div>
    <p class="note">I progetti restano dentro il programma (sul PC) o dentro l'app (sul telefono). Per passarli da un dispositivo all'altro usa «Esporta» e poi «Importa».</p></div>`;
  document.body.appendChild(mod);
  mod.addEventListener('click', e => { if (e.target === mod || e.target.closest('[data-x]')) mod.classList.remove('on'); });
  async function disegna() { stato(); $('pgNome').value = corrente ? corrente.nome : nomeDefault(); const box = $('pgLista'); let L = []; try { L = await elenco(); } catch (e) { box.innerHTML = '<div class="note">Archivio non disponibile: ' + (e && e.message || e) + '</div>'; return; }
    if (!L.length) { box.innerHTML = '<div class="note">Ancora nessun progetto salvato: scegli un nome qui sopra e tocca «Salva».</div>'; return; }
    box.innerHTML = ''; for (const p of L) { const d = document.createElement('div'); d.className = 'pgItem' + (corrente && corrente.id === p.id ? ' on' : '');
      const q = new Date(p.data).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      d.innerHTML = `${p.miniatura ? `<img class="pgMini" alt="" src="${p.miniatura}">` : '<div class="pgMini"></div>'}<div class="pgTxt"><b></b><span>${p.motoNome || p.moto} · ${q}${p.accessori ? ' · ' + p.accessori + ' accessori' : ''}</span></div>
        <div class="pgBtn"><button class="btn sm pri" data-a="apri">Apri</button><button class="btn sm" data-a="ren">Rinomina</button><button class="btn sm" data-a="dup">Duplica</button><button class="btn sm" data-a="exp">Esporta</button><button class="btn sm" data-a="del">Elimina</button></div>`;
      d.querySelector('b').textContent = p.nome; d.onclick = e => azione(e, p, d); box.appendChild(d); } }
  async function azione(e, p, d) { const b = e.target.closest('[data-a]'); if (!b) return; const a = b.dataset.a;
    if (a === 'apri') { mod.classList.remove('on'); await apri(p.id); }
    else if (a === 'ren') { const t = d.querySelector('.pgTxt b'); const inp = document.createElement('input'); inp.className = 'inp'; inp.value = p.nome; inp.maxLength = 80; t.replaceWith(inp); inp.focus(); inp.select();
      const fine = async ok => { const n = inp.value.trim(); if (ok && n && n !== p.nome) { await aggiornaMeta(p.id, m => m.nome = n); if (corrente && corrente.id === p.id) { corrente.nome = n; if ($('cfgNome')) $('cfgNome').value = n; } toast('Rinominato: «' + n + '»'); } disegna(); };
      inp.onkeydown = ev => { if (ev.key === 'Enter') fine(true); if (ev.key === 'Escape') fine(false); }; inp.onblur = () => fine(true); }
    else if (a === 'dup') { const r = await leggi(p.id); if (!r) return; const n = p.nome + ' (copia)'; await scrivi({ ...r.meta, id: nuovoId(), nome: n, creato: Date.now(), data: Date.now() }, r.stato); toast('Duplicato: «' + n + '»'); disegna(); }
    else if (a === 'exp') { const r = await leggi(p.id); if (!r) return; const blob = new Blob([JSON.stringify({ njdRide: FMT, meta: { ...r.meta, miniatura: r.meta.miniatura }, stato: r.stato })], { type: 'application/json' });
      const nome = p.nome.replace(/[\\/:*?"<>|]+/g, '_').slice(0, 60) + '.njd'; const es = ctx.salvaFile ? await ctx.salvaFile(blob, nome) : null; toast(es === 'annullato' ? 'Esportazione annullata' : 'Progetto esportato: ' + nome); }
    else if (a === 'del') { if (b.dataset.ok !== '1') { b.dataset.ok = '1'; b.textContent = 'Conferma eliminazione'; b.classList.add('pri'); setTimeout(() => { if (b.isConnected) { b.dataset.ok = ''; b.textContent = 'Elimina'; b.classList.remove('pri'); } }, 4000); return; }
      await cancella(p.id); if (corrente && corrente.id === p.id) { corrente = null; } toast('Progetto eliminato: «' + p.nome + '»'); disegna(); } }
  $('pgSalva').onclick = async () => { const n = $('pgNome').value.trim() || nomeDefault(); const id = corrente ? corrente.id : null; const m = await salva(id, n); if (!m) return; corrente = { id: m.id, nome: m.nome }; if ($('cfgNome')) $('cfgNome').value = m.nome;
    try { await cancella(AUTO); } catch (e) { } toast('Progetto salvato: «' + m.nome + '»'); disegna(); };
  $('pgCome').onclick = async () => { let n = $('pgNome').value.trim() || nomeDefault(); if (corrente && n === corrente.nome) n += ' (2)'; const m = await salva(null, n); if (!m) return; corrente = { id: m.id, nome: m.nome }; if ($('cfgNome')) $('cfgNome').value = m.nome; toast('Nuovo progetto salvato: «' + m.nome + '»'); disegna(); };
  $('pgNuovo').onclick = async () => { if (sporco) await salvaAuto(); mod.classList.remove('on'); const m = ctx.cur(); corrente = null; if ($('cfgNome')) $('cfgNome').value = ''; if (m) await ctx.loadModel(m); toast('Nuovo progetto: moto di serie. Le modifiche si salvano da sole finché non scegli un nome in «Progetti»'); };
  $('pgImp').onclick = () => $('pgFile').click();
  $('pgFile').onchange = async e => { const f = e.target.files[0]; e.target.value = ''; if (!f) return; try { const j = JSON.parse(await f.text()); if (!j || !j.stato || !j.meta) throw new Error('file non valido');
      const meta = { ...j.meta, id: nuovoId(), data: Date.now() }; await scrivi(meta, j.stato); toast('Progetto importato: «' + meta.nome + '»'); disegna(); } catch (er) { toast('Importazione non riuscita: ' + (er && er.message || er)); } };
  function apriFinestra() { mod.classList.add('on'); disegna(); }
  return { pronto, diario, modificato, apriFinestra, salva, apri, elenco, cattura, applica, get corrente() { return corrente; }, attendiPronto: () => prontoP,
    primaDiCambiare: async () => { if (sporco && !apertura) await salvaAuto(); } };
}
