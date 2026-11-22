/* NJ.D' RIDE – Banca dati pneumatici (vintage, cruiser/touring, drag) con misure reali e diametri calcolati.
   © 2026 dott. Jonathan D'Eugenio – Tutti i diritti riservati (L. 633/1941).
   Fonti: Coker Tire (Firestone Deluxe Champion), Avon Tyres (Speedmaster MkII, Safety Mileage MkII, Cobra Chrome), Michelin, Metzeler,
   Pirelli, Dunlop, rivenditori specializzati (FortNine, Cycle Gear, JP Cycles, Dennis Kirk). I nomi indicano le linee di prodotto
   come riferimento tecnico: nessun logo né grafica dei produttori viene riprodotto nei modelli 3D.
   Diametro esterno teorico: cerchio × 25,4 + 2 × larghezza × serie / 100 (mm). Misure in pollici: serie ≈ 100%.
   Equivalenze alfanumeriche convenzionali: MH90 ≈ 80/90, MT90 ≈ 130/90, MU85 ≈ 140/90. */

export const CATEGORIE = {
  vintage: { n: 'Vintage / Classic', d: 'diagonali a camera d\'aria, spalla alta, disegni d\'epoca' },
  cruiser: { n: 'Moderni / Cruiser', d: 'cruiser e sport-cruiser, diagonali cinturati e radiali' },
  touring: { n: 'Touring', d: 'carichi elevati e lunga percorrenza' },
  drag: { n: 'Drag / Performance', d: 'posteriori ultra-larghi e anteriori stretti ad alta velocità' }
};

/* disegni del battistrada usati dal generatore 3D */
export const DISEGNI = {
  coste_zigzag: 'coste longitudinali a zig-zag (classico anni \'40-\'50)',
  coste: 'coste longitudinali',
  blocchi: 'blocchetti «trial-universal»',
  touring: 'scanalature diagonali da turismo',
  onde: 'scanalature ondulate',
  piume: 'disegno a piume / spirale',
  slick: 'quasi liscio da accelerazione'
};

/* f = fascia bianca disponibile: larghezza in mm (0 = no, true = sì, larghezza non pubblicata); fasciaLinea = la linea esiste in versione
   a fascia bianca (Firestone Deluxe Champion: riedizioni Coker con fianco nero o bianco, larghezza della fascia secondo la misura);
   pos = 'ant' | 'post' | 'ap' (entrambe); dp = diametro pubblicato dal produttore (mm) quando diverso dal teorico. */
const S = (m, pos, x = {}) => ({ m, pos, ...x });
export const LINEE = [
  { id: 'fdc', nome: 'Firestone Deluxe Champion (riedizione Coker)', cat: 'vintage', costr: 'diagonale 4 tele, camera d\'aria', disegno: 'coste_zigzag', fonte: 'Coker Tire', fasciaLinea: true,
    misure: [S('5.00-16 71S', 'ap', { dp: 671, sez: 136, canale: 3.0 }), S('3.25-16', 'ap', { f: 38 }), S('3.50-18 56S', 'ap'), S('4.00-18 64P', 'ap'), S('4.50-18', 'ap'), S('3.25-19', 'ap'), S('4.00-19', 'ap')] },
  { id: 'avon_speed', nome: 'Avon Speedmaster MkII', cat: 'vintage', costr: 'diagonale, camera d\'aria', disegno: 'coste', fonte: 'Avon Tyres (lista ufficiale)',
    misure: [S('3.25-17 50S', 'ant'), S('3.50-19 57S', 'ant'), S('3.25-19 54S', 'ant'), S('3.00-19 54S', 'ant'), S('3.00-20 50S', 'ant'), S('3.00-21 57S', 'ant')] },
  { id: 'avon_safety', nome: 'Avon Safety Mileage MkII', cat: 'vintage', costr: 'diagonale, camera d\'aria', disegno: 'blocchi', fonte: 'Avon Tyres, rivenditori',
    misure: [S('4.00-18 64S', 'post'), S('4.00-19 65H', 'post'), S('3.50-19 57S', 'post'), S('5.00-16', 'post'), S('3.25-17 50S', 'post')] },
  { id: 'mich_cruiser', nome: 'Michelin Commander III Cruiser', cat: 'cruiser', costr: 'diagonale cinturata (B) / radiale (R)', disegno: 'touring', fonte: 'Michelin, MC Powersports',
    misure: [S('80/90-21 54H', 'ant'), S('90/90-21 54H', 'ant'), S('100/90B19 57H', 'ant'), S('110/90B19 62H', 'ant'), S('130/90B16 73H', 'ap'), S('140/75R17 67V', 'ant'),
      S('140/90B15 76H', 'post'), S('150/90B15 74H', 'post'), S('170/80B15 77H', 'post'), S('180/70B15 76H', 'post'), S('140/90B16 77H', 'post'), S('150/80B16 77H', 'post'), S('160/70B17 73V', 'post'), S('200/55R17 78V', 'post')] },
  { id: 'mich_touring', nome: 'Michelin Commander III Touring', cat: 'touring', costr: 'diagonale cinturata / radiale', disegno: 'touring', fonte: 'rivenditori (lista forse incompleta)',
    misure: [S('130/90B16 73H', 'ap'), S('130/80B17 65H', 'ant'), S('130/70B18 63H', 'ant'), S('130/60B19 61H', 'ant'), S('120/70B21 62H', 'ant'), S('120/70R19 60V', 'ant'), S('180/65B16 81H', 'post'), S('180/55B18 80H', 'post')] },
  { id: 'metz_cruisetec', nome: 'Metzeler Cruisetec', cat: 'cruiser', costr: 'diagonale cinturata / radiale', disegno: 'touring', fonte: 'Metzeler (catalogo da confermare sul Technical Data Book)',
    misure: [S('130/90B16', 'ant'), S('150/80-16', 'ant'), S('MT90B16', 'ant'), S('100/80-17', 'ant'), S('130/80B17', 'ant'), S('150/80R17', 'ant'), S('160/70R17', 'ant'), S('130/70R18 63H', 'ant'), S('130/70B18 63H', 'ant'),
      S('160/60R18 70V', 'ant'), S('100/90-19', 'ant'), S('110/90-19', 'ant'), S('120/70ZR19', 'ant'), S('130/60B19', 'ant'), S('120/70B21', 'ant'), S('130/60B21 63H', 'ant'), S('MH90-21 54H', 'ant'), S('140/75R15', 'post'), S('200/55R17', 'post')] },
  { id: 'pir_nd', nome: 'Pirelli Night Dragon', cat: 'cruiser', costr: 'diagonale cinturata / radiale', disegno: 'onde', fonte: 'Pirelli, Cycle Gear',
    misure: [S('130/90B16 67H', 'ant'), S('150/80B16 71H', 'ant'), S('130/80B17 65H', 'ant'), S('140/75R17 67V', 'ant'), S('130/70R18 63V', 'ant'), S('100/90-19 57H', 'ant'), S('110/90-19 62H', 'ant'), S('120/70ZR19 60W', 'ant'),
      S('130/60B19 61H', 'ant'), S('120/70B21 68H', 'ant'), S('90/90-21 54H', 'ant'), S('MH90-21', 'ant'), S('130/60B23 65H', 'ant'), S('180/70B15 76H', 'post'), S('180/70R16 77H', 'post'), S('180/60B17 81H', 'post'), S('200/50R18', 'post'), S('240/40VR18 79V', 'post')] },
  { id: 'pir_ndgt', nome: 'Pirelli Night Dragon GT', cat: 'touring', costr: 'diagonale cinturata / radiale, mescola da turismo', disegno: 'onde', fonte: 'Pirelli',
    misure: [S('170/80B15 77H', 'post'), S('130/90B16 73H', 'post'), S('150/80B16 77H', 'post'), S('180/60R16 80H', 'post'), S('180/65B16 81H', 'post'), S('MU85B16 77H', 'post'), S('160/70B17 79V', 'post'), S('200/55R17 78V', 'post'), S('180/55B18 80H', 'post')] },
  { id: 'dun_elite', nome: 'Dunlop American Elite', cat: 'touring', costr: 'diagonale cinturata (B) / radiale', disegno: 'touring', fonte: 'Dunlop, JP Cycles (fasce bianche WWW larga, NW/NWS stretta)',
    misure: [S('100/90-19 57H', 'ant'), S('130/60B19 61H', 'ant'), S('130/60B21 63H', 'ant'), S('130/70B18 63H', 'ant'), S('130/80B17 65H', 'ant', { f: 20 }), S('130/90B16 67H', 'ant', { f: 45 }), S('140/75R17 67V', 'ant'),
      S('MH90-21 54H', 'ant'), S('MT90B16 72H', 'ant', { f: 45 }), S('130/90B16 73H', 'post'), S('140/90-16 77H', 'post', { f: 45 }), S('150/80B16 77H', 'post'), S('160/70B17 73V', 'post'), S('180/55B18 80H', 'post'),
      S('180/65B16 81H', 'post', { f: 45 }), S('200/55R17 78V', 'post'), S('240/40R18 79V', 'post'), S('MT90B16 74H', 'post', { f: 45 }), S('MU85B16 77H', 'post', { f: 45 })] },
  { id: 'avon_cobra', nome: 'Avon Cobra Chrome', cat: 'cruiser', costr: 'diagonale cinturata / radiale', disegno: 'piume', fonte: 'Avon Tyres (tabella fasce bianche), FortNine, Cycle Gear',
    misure: [S('MT90B16 74H', 'ant', { f: true }), S('100/90-19 57V', 'ant', { f: true }), S('MH90-21 56V', 'ant', { f: true }), S('120/70-21 68V', 'ant', { f: true }), S('80/90-21', 'ant'), S('90/90-21', 'ant'), S('130/60B21', 'ant'),
      S('130/60B23', 'ant', { nota: 'Avon copre i 23": misura da confermare' }), S('MT90B16 74H', 'post', { f: true }), S('140/90B16 77H', 'post', { f: true }), S('150/80R16 71V', 'post', { f: true }), S('170/80B15 83H', 'post', { f: true }),
      S('180/65B16 81H', 'post', { f: true }), S('180/55R18 74W', 'post'), S('180/55B18 80H', 'post'), S('150/70B18 76V', 'post', { f: true }), S('140/70B18 73H', 'post'), S('200/55R18 79V', 'post'), S('200/60VR16', 'post'), S('240/50R16', 'post')] },
  { id: 'avon_wide', nome: 'Avon Cobra Chrome — posteriori ultra-larghi', cat: 'drag', costr: 'radiale', disegno: 'piume', fonte: 'Avon Tyres, Chapparal Motorsports',
    misure: [S('240/40R18 79V', 'post'), S('250/40R18 81V', 'post'), S('260/40R18 84V', 'post'), S('280/35R18 84V', 'post'), S('300/35R18 87V', 'post'), S('330/30R17 87V', 'post', { nota: 'risulta non disponibile presso un distributore; nessun 330 da 18" documentato' })] },
  { id: 'anteriori_stretti', nome: 'Anteriori stretti ad alta velocità (chopper/drag)', cat: 'drag', costr: 'diagonale / diagonale cinturata', disegno: 'coste', fonte: 'riepilogo incrociato Michelin, Pirelli, Avon, Dunlop, Metzeler',
    misure: [S('80/90-21', 'ant', { linee: 'Michelin Commander III, Avon Cobra Chrome' }), S('MH90-21', 'ant', { linee: 'Dunlop, Pirelli, Metzeler, Avon' }), S('90/90-21', 'ant', { linee: 'Michelin Commander III, Pirelli Night Dragon, Avon Cobra Chrome' }),
      S('120/70-21', 'ant', { linee: 'Avon (anche fascia bianca), Pirelli, Michelin Touring, Metzeler' }), S('130/60B21', 'ant', { linee: 'Dunlop American Elite, Avon, Metzeler' }), S('130/60B23', 'ant', { linee: 'Pirelli Night Dragon; Avon copre i 23"' })] }
];

const ALFA = { MH90: [80, 90], MJ90: [90, 90], MM90: [100, 90], MN90: [110, 90], MP90: [120, 90], MR90: [130, 90], MT90: [130, 90], MU90: [140, 90], MV85: [150, 85], MU85: [140, 90] };
/* legge una misura: «130/60B21 63H», «240/40VR18 79V», «MH90-21 54H», «MT90B16», «5.00-16 71S» */
export function parseMisura(str) {
  if (!str) return null; const s = String(str).toUpperCase().replace(/\s+/g, ' ').trim(); let m;
  if ((m = s.match(/^(\d{2,3})\/(\d{2})\s*(ZR|VR|R|B|-)?\s*-?(\d{2})/))) { const w = +m[1], serie = +m[2], costr = m[3] && m[3] !== '-' ? m[3] : 'D', ce = +m[4]; return { w, serie, costr, cerchio: ce, diam: Math.round(ce * 25.4 + 2 * w * serie / 100), alfa: false }; }
  if ((m = s.match(/^(M[A-Z])(\d{2})\s*(B|R)?-?(\d{2})/))) { const eq = ALFA[m[1] + m[2]] || [130, 90], ce = +m[4]; return { w: eq[0], serie: eq[1], costr: m[3] || 'D', cerchio: ce, diam: Math.round(ce * 25.4 + 2 * eq[0] * eq[1] / 100), alfa: true }; }
  if ((m = s.match(/^(\d\.\d{2})-(\d{2})/))) { const inch = +m[1], ce = +m[2], w = Math.round(inch * 25.4); return { w, serie: 100, costr: 'D', cerchio: ce, diam: Math.round(ce * 25.4 + 2 * w), pollici: true }; }
  return null;
}
export const COSTR = { B: 'diagonale cinturata', R: 'radiale', ZR: 'radiale (>240 km/h)', VR: 'radiale (fino a 240 km/h)', D: 'diagonale' };

/* canale consigliato (pollici) per larghezza di sezione: valori indicativi da tabelle dei produttori, da verificare per la singola misura */
const CANALE = [[90, 1.85, 2.15], [100, 2.15, 2.5], [120, 2.5, 3.5], [130, 2.75, 3.5], [140, 3.0, 3.75], [150, 3.5, 4.25], [160, 3.75, 4.5], [170, 4.0, 4.5], [180, 4.5, 5.5], [200, 5.5, 6.5], [240, 7.5, 8.5], [250, 8.0, 8.5], [260, 8.5, 9.0], [280, 9.0, 10.0], [300, 10.0, 10.5], [330, 10.5, 11.0]];
export function canaleConsigliato(w) { let best = CANALE[0]; for (const r of CANALE) if (w >= r[0] - 5) best = r; return { min: best[1], max: best[2] }; }

/* tutte le misure in un elenco piatto, con diametro e dati di linea */
let FLAT = null;
export function tutte() {
  if (FLAT) return FLAT; FLAT = [];
  for (const L of LINEE) for (const x of L.misure) { const p = parseMisura(x.m); if (!p) continue;
    FLAT.push({ id: L.id + '|' + x.m + '|' + x.pos, linea: L.id, nomeLinea: L.nome, cat: L.cat, disegno: L.disegno, costrLinea: L.costr, fonte: L.fonte, misura: x.m, pos: x.pos, fascia: x.f || (L.fasciaLinea ? true : 0), nota: x.nota || '', linee: x.linee || '',
      ...p, diam: x.dp || p.diam, diamTeorico: p.diam, sez: x.sez || null }); }
  return FLAT;
}
/* misure compatibili con un cerchio: stesso diametro e posizione; opzionale filtro per categoria */
export function compatibili(cerchio, pos, cat) {
  return tutte().filter(t => t.cerchio === +cerchio && (t.pos === 'ap' || t.pos === pos) && (!cat || t.cat === cat)).sort((a, b) => a.w - b.w || a.serie - b.serie);
}
export function cercaId(id) { return tutte().find(t => t.id === id) || null; }
export function descrivi(t) { if (!t) return ''; return `${t.misura} · ${t.nomeLinea} · Ø ${t.diam} mm · ${COSTR[t.costr] || t.costr}${t.fascia ? ' · fascia bianca' + (t.fascia === true ? '' : ' ' + t.fascia + ' mm') : ''}`; }
