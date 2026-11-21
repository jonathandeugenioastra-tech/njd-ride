/* NJ.D' RIDE – Catalogo accessori: oltre 2.000 articoli con codice, generati dalle tipologie PRO (tutte modificabili)
   e dai ricambi 3D reali con licenza CC BY. © 2026 dott. Jonathan D'Eugenio – Tutti i diritti riservati (L. 633/1941). */
import { PRO_DEFS } from './pro.js';
import './pro2.js'; import './pro3.js'; import './pro4.js'; import './pro5.js';
import { PARTS } from './parts.js';

export const COLORI = [['#0e0e10', 'Nero lucido'], ['#8c0f14', 'Rosso racing'], ['#1d3b6e', 'Blu oceano'], ['#0f3d26', 'Verde inglese'], ['#e8e6df', 'Bianco perla'],
  ['#d9cfb2', 'Crema vintage'], ['#3a3d42', 'Grigio canna di fucile'], ['#c8501a', 'Arancio'], ['#d9a400', 'Giallo'], ['#a9adb3', 'Argento']];
const C10 = COLORI.map(c => c[0]), C6 = C10.slice(0, 6);
const F6 = ['chrome', 'blackchrome', 'gloss', 'satin', 'brushed', 'contrast'], F4 = ['chrome', 'gloss', 'satin', 'brushed'], F5 = ['chrome', 'blackchrome', 'gloss', 'satin', 'brushed'];
const PELLI = ['nero', 'marrone', 'cuoio', 'testa', 'bordeaux', 'grigio', 'crema'], P5 = ['nero', 'marrone', 'cuoio', 'testa', 'bordeaux'];

/* famiglie: tipologia PRO, prefisso codice, assi che generano gli articoli, valori fissi (f) e filtro (ok) */
const FAM = [
  /* selle ricalcate dalle 31 foto dell'autore, imbottitura modellata in Blender */
  { id: 'sella_foto', c: 'SFT', ax: { modello: ['classica_frange', 'cuscini_lucidi', 'king_capitonne', 'touring_contorni', 'bobber_righe_alto', 'solo_inciso', 'molle_bicolore', 'touring_onde', 'king_queen_alto', 'solo_bicolore_inciso', 'touring_righe_grigie', 'cafe_vintage', 'long_legs', 'rombi_rossi', 'rombi_doppi', 'sportster_banda', 'cuoio_rombi', 'molle_cocco', 'solo_vintage', 'biposto_trasversali'] } },
  { id: 'sella_solo', c: 'SEL', ax: { trapuntatura: ['rombi', 'righe', 'liscia'], pelle: PELLI, misura: ['S', 'M', 'L'], molle: ['si', 'no'] } },
  { id: 'sella_cafe', c: 'SCF', ax: { tipo: ['cafe', 'brat', 'scrambler', 'gunfighter', 'stretta', 'passeggero'], trapuntatura: ['righe', 'trasversali', 'rombi', 'esagoni', 'liscia'], pelle: P5 } },
  /* codini delle foto: café bianco con sella a rombi (13), café nero con sella a righe (16, 19, 20, 22), café con sella cuoio (22), tracker arancio (17, 18), coprisella opaco (15) */
  { id: 'codino', c: 'CDF', ax: { tipo: ['cafe'], colore: ['#e8e6df'], trapuntatura: ['rombi'], pelle: ['nero'] } },
  { id: 'codino', c: 'CDF', ax: { tipo: ['cafe'], colore: ['#0e0e10'], trapuntatura: ['righe'], pelle: ['nero', 'cuoio'] } },
  { id: 'codino', c: 'CDF', ax: { tipo: ['tracker'], colore: ['#c8501a'], trapuntatura: ['righe'], pelle: ['nero'] } },
  { id: 'codino', c: 'CDF', ax: { tipo: ['cafe'], colore: ['#0e0e10'], vernice: ['opaco'], sella: ['no'], led: ['no'] } },
  { id: 'codino', c: 'COD', ax: { tipo: ['cafe', 'ducktail', 'tracker', 'brat'], colore: C10, trapuntatura: ['righe', 'rombi', 'liscia'] } },
  { id: 'borsa_cuoio', c: 'BOR', ax: { stile: ['fibbie', 'liscia'], pelle: PELLI, patta: ['lunga', 'corta'], borchie: ['si', 'no'] } },
  { id: 'sissy', c: 'SIS', ax: { altezza: [14, 18, 22, 26], stile: ['anello', 'squadrato', 'rastremato'], finitura: F4, schienale: ['si', 'no'] } },
  { id: 'portapacchi', c: 'PPA', ax: { tipo: ['codino', 'solo', 'touring'], finitura: F4 } },
  { id: 'carena', c: 'CAR', ax: { tipo: ['cupolino'], forma: ['tonda', 'ovale', 'goccia'], colore: C10, coprifaro: ['chiaro', 'fume'] } },
  { id: 'carena', c: 'CAR', ax: { tipo: ['mezza', 'integrale', 'club', 'batwing', 'shark'], colore: C10, parabrezza: ['fume', 'chiaro'] } },
  { id: 'carena', c: 'CAR', ax: { tipo: ['flyscreen'], forma_fly: ['basso', 'classico', 'alto'], parabrezza: ['fume', 'chiaro', 'scuro'] } },
  { id: 'carena', c: 'CAR', ax: { tipo: ['flyscreen'], materiale: ['alluminio'], forma_fly: ['basso', 'classico'], finitura_alu: ['brushed', 'polished', 'gloss'] } },
  { id: 'puntale', c: 'PUN', ax: { colore: C10, striscia: ['no', 'centrale'] } },
  { id: 'parabrezza', c: 'PBZ', ax: { tipo: ['touring', 'medio', 'sport', 'custom'], tinta: ['chiaro', 'fume', 'scuro'], attacchi: ['chrome', 'gloss'] } },
  { id: 'tabella', c: 'TAB', ax: { tipo: ['frontale', 'laterali'], forma: ['ovale', 'tracker', 'rettangolare'], colore_tabella: ['#f2f2ee', '#111111', '#d9a400', '#8c0f14', '#1d3b6e'] } },
  { id: 'serbatoio_peanut', c: 'SER', ax: { capacita: ['2.1', '3.3', '4.5'], colore: C10, vernice: ['lucido', 'candy', 'metallizzato'] } },
  { id: 'tappo_serbatoio', c: 'TAP', ax: { stile: ['pop-up', 'a filo', 'zigrinato', 'monza', 'aeronautico', 'sfiato'], finitura: F6 } },
  { id: 'scarico', c: 'SCA', ax: { tipo: ['shotgun', 'sfalsati', 'drag', 'turnout', '2in1', 'megafono'], terminale: ['slash', 'dritto', 'fishtail'], finitura: ['chrome', 'blackchrome', 'ceramico', 'titanio', 'brushed'] }, ok: o => !(o.tipo === 'turnout' && o.terminale !== 'dritto') && !(['2in1', 'megafono'].includes(o.tipo) && o.terminale === 'fishtail') },
  { id: 'scarico', c: 'SCA', ax: { tipo: ['drag', 'shotgun', 'sfalsati'], fascia: ['nera', 'titanio', 'sabbia'], finitura: ['ceramico', 'blackchrome'] } },
  { id: 'scarico', c: 'SCX', ax: { tipo: ['alto', '2in2', 'fishtail', 'incrociati', 'spaghetti', 'slipon'], finitura: ['chrome', 'blackchrome', 'ceramico', 'titanio', 'brushed', 'ottone'] }, ok: o => !(o.tipo === 'fishtail' && ['titanio', 'ceramico'].includes(o.finitura)) },
  { id: 'filtro_aria', c: 'FIL', ax: { forma: ['tondo', 'goccia', 'ovale'], diametro: ['7', '9'], finitura: F6, filtro: ['rosso', 'nero'] } },
  { id: 'coperchio_motore', c: 'COP', ax: { tipo: ['puntine', 'derby'], stile: ['liscio', 'punta', 'raggi', 'forato', 'cerchi'], finitura: F6 } },
  { id: 'ape_hanger', c: 'MAN', ax: { altezza: [8, 10, 12, 14, 16, 18], finitura: F6, diametro: ['1', '1.25'] } },
  { id: 'semimanubri', c: 'SMM', ax: { forcella: ['39', '41', '43', '49'], finitura: F4, manopole: ['gomma', 'pelle'] } },
  { id: 'manopola', c: 'MNP', ax: { stile: ['rigata', 'diamante', 'billet', 'pelle', 'chunky', 'barile', 'vintage'], colore: ['nero', 'marrone', 'bianco', 'rosso'], finitura: ['chrome', 'gloss', 'brushed'] } },
  { id: 'specchietto', c: 'SPE', ax: { forma: ['tondo', 'ovale', 'rettangolare', 'fine manubrio'], misura: ['3', '3.5', '4'], finitura: F6 } },
  { id: 'specchietto', c: 'SPE', ax: { forma: ['fine manubrio'], orientamento: ['basso', 'alto', 'orizzontale'], misura: ['3', '3.5'], finitura: F6 } },
  { id: 'specchietto', c: 'SPE', ax: { forma: ['fine manubrio'], orientamento: ['basso', 'alto', 'orizzontale'], misura: ['3', '3.5', '4'], finitura: F6 } },
  { id: 'specchietto', c: 'SPE', ax: { forma: ['tondo', 'ovale'], stelo: ['corto', 'lungo'], misura: ['3', '4'], finitura: ['chrome', 'blackchrome', 'brushed'] } },
  { id: 'strumento', c: 'STR', ax: { tipo: ['contachilometri', 'contagiri', 'doppio', 'mini', 'digitale'], quadrante: ['nero', 'bianco', 'crema'], ghiera: ['chrome', 'gloss', 'brushed'] } },
  { id: 'faro', c: 'FAR', ax: { diametro: ['4.5', '5.75', '7'], stile: ['vintage', 'led'], finitura: F6, visiera: ['no', 'si'] } },
  { id: 'griglia_faro', c: 'GRF', ax: { tipo: ['croce', 'rete', 'barre'], diametro: ['5.75', '7'], finitura: F4 } },
  { id: 'freccia_bullet', c: 'FRE', ax: { stile: ['proiettile', 'cilindro', 'cono', 'micro'], finitura: F6, lente: ['ambra', 'fume', 'chiaro', 'rossa'] } },
  { id: 'fanalino', c: 'FAN', ax: { stile: ['cat eye', 'lucas', 'beehive', 'barra LED', 'rettangolare', 'mini'], finitura: F4, lente: ['rossa', 'fume'] } },
  { id: 'portatarga', c: 'PTG', ax: { lato: ['sinistro', 'destro'], finitura: F6, braccio: ['corto', 'lungo'] } },
  { id: 'pedana', c: 'PED', ax: { tipo: ['gomma', 'diamante', 'spike', 'barile', 'mini pedana', 'pedana'], finitura: F6 } },
  { id: 'pedane_arretrate', c: 'PDA', ax: { lato: ['destro', 'sinistro'], finitura: F6, piastra: ['forata', 'piena'] } },
  { id: 'cavalletto', c: 'CAV', ax: { lunghezza: ['corto', 'standard', 'lungo'], piede: ['tondo', 'goccia', 'largo'], finitura: F4 } },
  { id: 'paramotore', c: 'PMT', ax: { forma: ['baffo', 'chubby', 'sport', 'diamante'], finitura: F4, pedane: ['no', 'si'] } },
  { id: 'cerchio', c: 'RUO', ax: { tipo: ['raggi', 'razze5', 'razze9', 'razze3', 'lenticolare'], diametro: ['16', '17', '18', '19', '21', '23'], finitura: F4 } },
  { id: 'parafango', c: 'PFA', ax: { posizione: ['posteriore', 'anteriore'], stile: ['bobber', 'ribbed', 'cafe', 'vintage', 'mini', 'tracker'], colore: C6 } },
  { id: 'ammortizzatori', c: 'AMM', ax: { lunghezza: [11, 11.5, 12, 13, 13.5], tipo: ['molla', 'piggyback', 'coperto'], colore_molla: ['#b5121b', '#111111', '#d9a400', '#e8e6df'] } },
  { id: 'soffietti', c: 'SOF', ax: { colore: ['nero', 'marrone', 'bianco'], lunghezza: [14, 18, 22], forcella: ['35', '39', '41', '43'] } }
];

const colName = v => (COLORI.find(c => c[0] === v) || [, { '#f2f2ee': 'Bianco', '#111111': 'Nero', '#b5121b': 'Rosso', '#e8e6df': 'Bianco' }[v] || v])[1];
function label(def, k, v) {
  const x = def.opts.find(q => q.k === k); if (!x) return String(v);
  if (x.t === 'col') return colName(v);
  if (x.t === 'num') return (x.u === 'm' ? Math.round(v * 1000) + ' mm' : v + (x.u || ''));
  const e = x.o.find(q => String(q[0]) === String(v)); let t = e ? e[1] : String(v);
  const PRE = { coprifaro: 'copertura faro ', parabrezza: 'plexi ', tinta: 'plexi ', pelle: 'pelle ', misura: 'taglia ', lato: 'lato ', lente: 'lente ', quadrante: 'quadrante ', ghiera: 'ghiera ', attacchi: 'attacchi ', piede: 'piede ', fascia: 'fascia termica ', terminale: 'terminale ', diametro: 'Ø ', forcella: 'per steli Ø ', capacita: '', filtro: 'filtro ', patta: 'patta ', braccio: 'braccio ', piastra: 'piastra ', manopole: 'manopole ', vernice: 'vernice ', striscia: 'striscia ', materiale: '', finitura_alu: '', posizione: '' };
  if (PRE[k] !== undefined && !(x.o.length === 2 && x.o.some(q => q[0] === 'si'))) t = PRE[k] + (PRE[k] ? t.charAt(0).toLowerCase() + t.slice(1) : t);
  if (x.o.length === 2 && x.o.some(q => q[0] === 'si')) return v === 'si' ? 'con ' + x.l.toLowerCase() : 'senza ' + x.l.toLowerCase();
  return t;
}
function* combos(ax) { const ks = Object.keys(ax); const idx = ks.map(() => 0);
  while (true) { const o = {}; ks.forEach((k, i) => o[k] = ax[k][idx[i]]); yield o; let i = ks.length - 1; while (i >= 0) { idx[i]++; if (idx[i] < ax[ks[i]].length) break; idx[i] = 0; i--; } if (i < 0) return; } }

export const CATALOG = []; const seen = new Set(), cnt = {};
for (const f of FAM) {
  const def = PRO_DEFS[f.id]; if (!def) continue;
  for (const o of combos(f.ax)) {
    if (f.ok && !f.ok(o)) continue; const key = f.id + JSON.stringify(o); if (seen.has(key)) continue; seen.add(key);
    cnt[f.c] = (cnt[f.c] || 0) + 1; const code = 'CG-' + f.c + '-' + String(cnt[f.c]).padStart(4, '0');
    const typeLabel = o.tipo ? label(def, 'tipo', o.tipo) : def.n;
    const rest = Object.entries(o).filter(([k]) => k !== 'tipo').map(([k, v]) => label(def, k, v));
    const name = (o.tipo ? typeLabel : def.n) + ' · ' + rest.join(' · ');
    CATALOG.push({ k: code, id: f.id, o, n: name, cat: def.cat, t: def.type, b: def.b, p: def.p, s: (name + ' ' + code + ' ' + def.cat + ' ' + def.n + ' ' + def.b).toLowerCase() });
  }
}
PARTS.forEach(([id, n, cat, kb, au, url, mis], i) => { const code = 'CG-R-' + String(i + 1).padStart(4, '0');
  CATALOG.push({ k: code, real: id, n: n + ' (modello reale)', cat, t: kb, au, url, mis, s: (n + ' ' + code + ' ' + cat + ' reale ' + au).toLowerCase() }); });
export const CAT_CATS = [...new Set(CATALOG.map(c => c.cat))].sort((a, b) => a.localeCompare(b, 'it'));
export function searchCatalog(q, cat) {
  const terms = (q || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').split(/\s+/).filter(Boolean);
  return CATALOG.filter(c => (!cat || c.cat === cat) && terms.every(t => c.s.normalize('NFD').replace(/[̀-ͯ]/g, '').includes(t)));
}
