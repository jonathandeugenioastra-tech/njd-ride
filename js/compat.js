/* NJ.D' RIDE – Stato della configurazione e motore di compatibilità ingegneristica.
   © 2026 dott. Jonathan D'Eugenio – Tutti i diritti riservati (L. 633/1941).
   Lo stato tiene slot separati e indipendenti (ruota anteriore e posteriore: cerchio, gomma, disco; manubrio, sella, scarico…).
   Il motore ricalcola a ogni modifica: quote geometriche (diametri, avancorsa, inclinazione, altezza sella, luce a terra) e
   adeguamenti meccanici necessari al montaggio reale, ciascuno con la sua motivazione tecnica.
   Formule: avancorsa t = (R·sinθ − d)/cosθ; variazione d'inclinazione Δθ ≈ (ΔR_ant − ΔR_post)/interasse;
   altezza sella Δh ≈ ΔR_post·x/L + ΔR_ant·(1 − x/L) con x/L ≈ 0,65; diametro gomma = cerchio·25,4 + 2·larghezza·serie/100. */
import { SPEC, FAM, LIVELLO } from './motodb.js';
import { parseMisura, canaleConsigliato, COSTR } from './gommedb.js';

/* ------------------------------ STATO ------------------------------ */
const VUOTO = () => ({ cerchio: null, gomma: null, disco: null });
const TIPO_C = { raggi: 'a raggi', razze5: 'in lega a 5 razze', razze9: 'in lega a 9 razze', razze3: 'in lega a 3 razze', lenticolare: 'lenticolare' };
function statoVuoto(moto) {
  return { moto: moto || null, ruotaAnt: VUOTO(), ruotaPost: VUOTO(), manubrio: null, sella: null, scarico: null, filtro: null, comandi: null,
    sospAnt: null, sospPost: null, parafangoAnt: null, parafangoPost: null, faro: null, frecce: null, carena: null, serbatoio: null, borse: null,
    codino: null, strumenti: null, specchietti: null, altri: [] };
}
const subs = new Set();
let STATO = statoVuoto(null), ULTIMO = null;
export const STORE = {
  get: () => STATO,
  esito: () => ULTIMO || (ULTIMO = valuta(STATO)),
  subscribe(fn) { subs.add(fn); return () => subs.delete(fn); },
  reset(moto) { STATO = statoVuoto(moto); ULTIMO = null; subs.forEach(f => f(STATO)); },
  /* lo stato si ricostruisce dalla configurazione montata in 3D: ogni voce va nel suo slot, le ruote per posizione e componente */
  sync(config, moto) {
    const S = statoVuoto(moto);
    for (const e of config) { if (e.kitOf || !e.it) continue; const it = e.it, o = it.o || {}, base = { id: it.id || null, nome: (e.n || it.n || '').split(' · ')[0], codice: e.k || '', o };
      switch (e.slot) {
        case 'ruote': { const pos = (e.wh && e.wh.pos) || 'ant', parte = (e.wh && e.wh.parte) || 'completa', R = pos === 'ant' ? S.ruotaAnt : S.ruotaPost;
          if (parte !== 'gomma') { R.cerchio = { ...base, nome: 'Cerchio ' + (TIPO_C[o.tipo] || ''), d: +o.diametro || null, canale: o.canale ? +o.canale : null, tipo: o.tipo || '', finitura: o.finitura || '' }; if (o.disco !== 'no') R.disco = { ...base, nome: 'Disco freno ' + (pos === 'ant' ? 'anteriore' : 'posteriore') }; }
          if (parte !== 'cerchio') R.gomma = { ...base, misura: o.misura || null, linea: o.linea || null, larghezza: +o.gomma || null, serie: o.serie ? +o.serie : null, fascia: o.fianco === 'bianco', d: +o.diametro || null };
          break; }
        case 'manubrio': S.manubrio = { ...base, altezza: +o.altezza || null }; break;
        case 'sella': S.sella = base; break;
        case 'scarico': S.scarico = { ...base, omologato: o.omologato === 'si' }; break;
        case 'motore': if (/filtro/.test(it.id || '') || /filtro|aria/i.test(base.nome)) S.filtro = base; else S.altri.push({ ...base, slot: e.slot }); break;
        case 'comandi': S.comandi = { ...base, tipo: /arretrat/.test(it.id || base.nome) ? 'arretrati' : 'avanzati' }; break;
        case 'sospensioni': { const d = o.delta != null ? +o.delta : (/abbass|lower|corti/i.test(base.nome + JSON.stringify(o)) ? -25 : 0); if (/forcella|anterior/i.test(base.nome)) S.sospAnt = { ...base, delta: d }; else S.sospPost = { ...base, delta: d }; break; }
        case 'parafanghi': if ((o.posizione || '') === 'anteriore') S.parafangoAnt = base; else S.parafangoPost = base; break;
        default: if (S[e.slot] !== undefined && !Array.isArray(S[e.slot])) S[e.slot] = base; else S.altri.push({ ...base, slot: e.slot });
      }
    }
    STATO = S; ULTIMO = valuta(S); subs.forEach(f => f(STATO)); return ULTIMO;
  }
};

/* ------------------------------ MOTORE ------------------------------ */
const rad = d => d * Math.PI / 180, deg = r => r * 180 / Math.PI, mm = v => v == null || isNaN(v) ? null : Math.round(v);
const XL = .65; // posizione della sella lungo l'interasse (dall'asse anteriore) per un cruiser
function diamDi(gomma, cerchioD, fallback) {
  if (gomma && gomma.misura) { const p = parseMisura(gomma.misura); if (p) return { D: p.diam, p }; }
  if (gomma && gomma.larghezza && (gomma.d || cerchioD)) { const w = gomma.larghezza, ser = gomma.serie || (w > 160 ? 55 : w > 120 ? 70 : 90), d = gomma.d || cerchioD; return { D: Math.round(d * 25.4 + 2 * w * ser / 100), p: { w, serie: ser, cerchio: d, costr: '?' }, stimata: true }; }
  if (cerchioD && fallback && fallback.p) { const w = fallback.p.w, ser = fallback.p.serie; return { D: Math.round(cerchioD * 25.4 + 2 * w * ser / 100), p: { ...fallback.p, cerchio: cerchioD }, stimata: true }; }
  return fallback || null;
}
function avancorsa(R, thetaDeg, d) { const t = rad(thetaDeg); return (R * Math.sin(t) - d) / Math.cos(t); }

export function valuta(S) {
  const spec = SPEC[S.moto] || null, fam = spec ? FAM[spec.fam] || FAM.custom : FAM.custom, A = [], AV = [], Q = [], comp = [];
  let n = 0; const add = (azione, nome, motivo, cat, extra = {}) => { const codice = 'CG-ADJ-' + String(++n).padStart(3, '0'); A.push({ codice, azione, nome, motivo, cat, ...extra }); };
  if (!spec) AV.push('Modello senza scheda tecnica: le quote non si possono ricalcolare, gli adeguamenti restano indicativi.');
  else if (spec.livello !== 'anno') AV.push(`Dati di serie: ${LIVELLO[spec.livello]} (${spec.fonte}).`);
  if (spec && spec.conflitti) spec.conflitti.forEach(c => AV.push('Dato da verificare: ' + c + '.'));

  // ---- componenti scelti dall'utente (lista base della distinta)
  const ruote = [['ant', 'anteriore', S.ruotaAnt], ['post', 'posteriore', S.ruotaPost]];
  for (const [, lab, R] of ruote) {
    if (R.cerchio) comp.push({ gruppo: 'Ruota ' + lab, nome: R.cerchio.nome + (R.cerchio.d ? ` ${R.cerchio.d}"` : '') + (R.cerchio.canale ? ` × ${R.cerchio.canale}"` : ''), codice: R.cerchio.codice });
    if (R.gomma) comp.push({ gruppo: 'Ruota ' + lab, nome: 'Pneumatico ' + (R.gomma.misura || (R.gomma.larghezza ? R.gomma.larghezza + ' mm' : '')) + (R.gomma.linea ? ' — ' + R.gomma.linea : '') + (R.gomma.fascia ? ' (fascia bianca)' : ''), codice: R.gomma.codice });
    if (R.disco) comp.push({ gruppo: 'Ruota ' + lab, nome: R.disco.nome, codice: R.disco.codice });
  }
  for (const k of ['manubrio', 'sella', 'scarico', 'filtro', 'comandi', 'sospAnt', 'sospPost', 'parafangoAnt', 'parafangoPost', 'faro', 'frecce', 'carena', 'serbatoio', 'borse', 'codino', 'strumenti', 'specchietti'])
    if (S[k]) comp.push({ gruppo: GRUPPO[k] || k, nome: S[k].nome, codice: S[k].codice });
  S.altri.forEach(x => comp.push({ gruppo: 'Altro', nome: x.nome, codice: x.codice }));

  // ---- geometria: diametri, avancorsa, inclinazione, altezze
  const stA = spec && spec.gommaAnt ? { D: (parseMisura(spec.gommaAnt) || {}).diam, p: parseMisura(spec.gommaAnt) } : null;
  const stP = spec && spec.gommaPost ? { D: (parseMisura(spec.gommaPost) || {}).diam, p: parseMisura(spec.gommaPost) } : null;
  const cA = S.ruotaAnt.cerchio && S.ruotaAnt.cerchio.d, cP = S.ruotaPost.cerchio && S.ruotaPost.cerchio.d;
  const nA = diamDi(S.ruotaAnt.gomma, cA, stA && cA && stA.p && cA !== stA.p.cerchio ? { p: stA.p } : stA), nP = diamDi(S.ruotaPost.gomma, cP, stP && cP && stP.p && cP !== stP.p.cerchio ? { p: stP.p } : stP);
  const dRa = stA && nA && stA.D && nA.D ? (nA.D - stA.D) / 2 : 0, dRp = stP && nP && stP.D && nP.D ? (nP.D - stP.D) / 2 : 0;
  const susA = S.sospAnt ? +S.sospAnt.delta || 0 : 0, susP = S.sospPost ? +S.sospPost.delta || 0 : 0; // mm all'asse: negativi = abbassata
  const hA = dRa + susA, hP = dRp + susP; // sollevamento totale di ciascun asse
  if (stA && stA.D) Q.push({ k: 'dA', n: 'Diametro esterno ruota anteriore', serie: stA.D, nuovo: nA && nA.D, u: 'mm', nota: spec.gommaAnt + (S.ruotaAnt.gomma && S.ruotaAnt.gomma.misura ? ' → ' + S.ruotaAnt.gomma.misura : '') + (nA && nA.stimata ? ' (stimato)' : '') });
  if (stP && stP.D) Q.push({ k: 'dP', n: 'Diametro esterno ruota posteriore', serie: stP.D, nuovo: nP && nP.D, u: 'mm', nota: spec.gommaPost + (S.ruotaPost.gomma && S.ruotaPost.gomma.misura ? ' → ' + S.ruotaPost.gomma.misura : '') + (nP && nP.stimata ? ' (stimato)' : '') });
  let geo = null;
  if (spec && spec.rake && spec.avancorsa && stA && stA.D) {
    const L = spec.interasse || 1600, R = stA.D / 2, th = spec.rake, d = R * Math.sin(rad(th)) - spec.avancorsa * Math.cos(rad(th));
    const dTh = deg((hA - hP) / L), th2 = th + dTh, t2 = avancorsa(R + dRa, th2, d);
    geo = { d: mm(d), th2, t2 };
    Q.push({ k: 'rake', n: 'Inclinazione cannotto (rake)', serie: th, nuovo: +th2.toFixed(1), u: '°', nota: 'cambia con il sollevamento relativo degli assi' });
    Q.push({ k: 'trail', n: 'Avancorsa', serie: spec.avancorsa, nuovo: mm(t2), u: 'mm', nota: `offset effettivo forcella ≈ ${mm(d)} mm` });
    if (Math.abs(t2 - spec.avancorsa) > 12) add('Da verificare', 'Verifica della stabilità di sterzo', `l'avancorsa passa da ${spec.avancorsa} a ${mm(t2)} mm (${t2 > spec.avancorsa ? '+' : ''}${mm(t2 - spec.avancorsa)} mm): sterzo ${t2 > spec.avancorsa ? 'più lento e stabile' : 'più rapido'}; valuta piastre con offset diverso.`, 'Ciclistica');
  }
  if (spec && spec.sella) { const dh = hP * XL + hA * (1 - XL); Q.push({ k: 'sella', n: 'Altezza sella a vuoto', serie: spec.sella, nuovo: mm(spec.sella + dh), u: 'mm', nota: 'sella di serie; una sella diversa cambia il valore' }); }
  if (spec && spec.luce) { const dl = (hA + hP) / 2; Q.push({ k: 'luce', n: 'Luce a terra', serie: spec.luce, nuovo: mm(spec.luce + dl), u: 'mm', nota: 'punto più basso a metà interasse' }); if (spec.luce + dl < 90) add('Da verificare', 'Luce a terra ridotta', `con ${mm(spec.luce + dl)} mm sotto il telaio aumenta il rischio di strisciare su dossi e rampe.`, 'Ciclistica'); }
  if (spec && spec.interasse) Q.push({ k: 'wb', n: 'Interasse', serie: spec.interasse, nuovo: spec.interasse, u: 'mm', nota: 'invariato salvo forcellone allungato o piastre diverse' });

  // ---- ruota posteriore: larghezza, canale, trasmissione, forcellone, parafango
  const gP = S.ruotaPost.gomma, pP = gP ? (gP.misura ? parseMisura(gP.misura) : (gP.larghezza ? { w: gP.larghezza, cerchio: gP.d || cP } : null)) : null;
  if (pP && pP.w) {
    const W = pP.w, ser = fam.posteriore || {}, Ws = stP && stP.p ? stP.p.w : ser.serie || null;
    add('Rimosso', 'Pneumatico posteriore di serie' + (spec && spec.gommaPost ? ' ' + spec.gommaPost : ''), 'sostituito dal pneumatico scelto.', 'Ruote', { rimosso: true });
    const can = canaleConsigliato(W), canSerie = spec && spec.cerchioPost && spec.cerchioPost.w, canNuovo = S.ruotaPost.cerchio && S.ruotaPost.cerchio.canale ? S.ruotaPost.cerchio.canale : canSerie;
    const nA0 = A.length;
    if (Ws && W > Ws) {
      const extra = W - Ws, fk = spec ? spec.fam : 'custom';
      if (fk === 'dyna') {
        if (W <= (ser.kitSemplice || 180)) add('Aggiunto', 'Kit gomma larga Harley-Davidson P/N 43768-06 (fino a 180)', `consente un ${W} sul cerchio originale da 17" senza modifiche a telaio o trasmissione (esclusi FXDWG, FXDF, FXDSE/2, FXDFSE e FXDB 2009).`, 'Trasmissione');
        else if (W <= (ser.forcellone || 250)) { add('Sostituito', 'Forcellone allargato tipo «Wide-Ass» (fino a 250 su cerchio 8,5")', `oltre 180 il forcellone di serie e la linea della cinghia non lasciano spazio: con il forcellone allargato si arriva a 250 con cinghia di serie.`, 'Telaio'); add('Sostituito', 'Cerchio posteriore 8,5"', `il kit per ${W} lavora su cerchio da 8,5".`, 'Ruote'); }
        else if (W <= (ser.forcelloneMax || 260)) add('Sostituito', 'Forcellone dedicato fino a 260', `per ${W} serve un forcellone specifico (es. modello fino a 260).`, 'Telaio');
        else add('Da verificare', 'Telaio e forcellone su misura', `${W} mm è oltre i kit Dyna documentati (max 260): serve costruzione su misura e probabile conversione a catena.`, 'Telaio');
      } else if (fk === 'softailTC') {
        if (W <= 230) { add('Sostituito', 'Forcellone extra-largo per Softail Twin Cam', `oltre 200 la cinghia di serie non passa: serve il forcellone allargato.`, 'Telaio'); add('Aggiunto', 'Kit offset trasmissione 25 mm', `allinea la cinghia per un ${W} su cerchio 7,5".`, 'Trasmissione'); }
        else if (W <= (ser.offset45 || 280)) { add('Sostituito', 'Forcellone extra-largo (fino a 250 su 8,5"; 280 su Twin Cam con offset)', `per ${W} servono forcellone e spostamento della linea di trasmissione.`, 'Telaio'); add('Aggiunto', 'Kit offset primaria 45 mm', 'albero secondario con offset 25 mm e puleggia con offset 3/4" (19 mm): sposta la cinghia verso l\'esterno per liberare spazio alla gomma.', 'Trasmissione'); }
        else if (W <= (ser.offset55 || 300)) { add('Sostituito', 'Forcellone per 300 (telai Twin Cam 2000-2006)', `per ${W} serve il forcellone del kit «fino a 300».`, 'Telaio'); add('Aggiunto', 'Kit offset primaria 55 mm', 'con 55 mm di offset c\'è spazio per il 300 sui telai Twin Cam 2000-2006.', 'Trasmissione'); }
        else add('Da verificare', 'Telaio su misura', `${W} mm è oltre i kit Softail Twin Cam documentati (max 300).`, 'Telaio');
      } else if (fk === 'softailM8') {
        if (W <= (ser.kitDedicato || 300)) { add('Sostituito', 'Kit gomma larga dedicato Softail M8 (forcellone + offset trasmissione)', `oltre il 240 di serie servono forcellone e spostamento della trasmissione dedicati: misure da verificare sul catalogo del produttore del kit.`, 'Telaio'); }
        else add('Da verificare', 'Telaio su misura', `${W} mm è oltre i kit noti per Softail M8.`, 'Telaio');
      } else if (fk === 'vrod') {
        if (W <= (ser.larga || 240)) add('Sostituito', 'Forcellone e cerchio largo della V-Rod Night Rod Special / Muscle', `la versione larga monta di serie il 240/40R18: con quel forcellone e cerchio il ${W} entra.`, 'Telaio');
        else add('Sostituito', 'Kit forcellone 280-300 per V-Rod', `per ${W} servono forcellone e kit dedicati (da verificare).`, 'Telaio');
      } else if (fk === 'buell') add('Da verificare', 'Modifica del forcellone-serbatoio olio Buell', `sul Buell XB il forcellone fa da serbatoio olio: allargarlo per ${W} mm è una modifica non banale e sconsigliata.`, 'Telaio');
      else if (fk === 'storica') add('Da verificare', 'Lavorazione su misura del telaio rigido', `con ${W} mm verifica la luce tra gomma, catena e foderi del telaio: sulle storiche non esistono kit.`, 'Telaio');
      else add('Sostituito', 'Kit forcellone allargato e offset trasmissione', `il ${W} supera il ${Ws} di serie di ${extra} mm: servono forcellone e spostamento della linea di trasmissione (kit da verificare per ${fam.n}).`, 'Telaio');
      if (extra >= 20) add('Sostituito', 'Parafango posteriore allargato e relativi supporti', `il parafango di serie è disegnato per ${Ws} mm: con ${W} mm serve un parafango più largo.`, 'Carrozzeria');
      add('Aggiunto', 'Distanziali ruota asimmetrici', `centrano la gomma da ${W} mm nel forcellone mantenendo allineate puleggia e disco.`, 'Ruote');
      if (W >= 250 && spec && spec.finale && spec.finale.tipo === 'cinghia') add('Da verificare', 'Conversione da cinghia a catena (opzionale)', 'la catena è più stretta della cinghia e libera spazio laterale per gomme molto larghe.', 'Trasmissione');
    } else if (Ws && W < Ws - 10) add('Da verificare', 'Pneumatico più stretto del cerchio di serie', `un ${W} su cerchio da ${canNuovo || '?'}" può risultare «tirato»: verifica il canale consigliato ${can.min}–${can.max}".`, 'Ruote');
    // il canale si controlla solo se il kit di famiglia non ha già previsto un cerchio posteriore dedicato
    const kitCerchio = A.slice(nA0).some(a => /^Cerchio posteriore/.test(a.nome));
    if (!kitCerchio) {
      if (canNuovo && (canNuovo < can.min - .01 || canNuovo > can.max + .51)) add('Sostituito', `Cerchio posteriore con canale ${can.min}–${can.max}"`, `un ${W} mm richiede un canale di circa ${can.min}–${can.max}" (indicativo, da tabella del produttore); il cerchio montato ha ${canNuovo}".`, 'Ruote');
      else if (!canNuovo && Ws && W > Ws + 15) add('Da verificare', `Canale del cerchio posteriore (${can.min}–${can.max}")`, `canale del cerchio non noto: per un ${W} mm serve circa ${can.min}–${can.max}".`, 'Ruote');
    }
  }
  // ---- ruota anteriore: 21"/23", parafango, ABS
  const gA = S.ruotaAnt.gomma, rimA = cA || (gA && gA.misura ? (parseMisura(gA.misura) || {}).cerchio : null), stRimA = spec && spec.cerchioAnt ? spec.cerchioAnt.d : null;
  if (gA) add('Rimosso', 'Pneumatico anteriore di serie' + (spec && spec.gommaAnt ? ' ' + spec.gommaAnt : ''), 'sostituito dal pneumatico scelto.', 'Ruote', { rimosso: true });
  if (rimA && stRimA && rimA > stRimA) {
    add('Sostituito', `Parafango anteriore per ruota da ${rimA}"`, `la ruota passa da ${stRimA}" a ${rimA}": il pneumatico si alza di ${mm(dRa)} mm e il parafango di serie va sostituito o rialzato.`, 'Carrozzeria');
    add('Aggiunto', 'Distanziali mozzo e perno ruota specifici', `il cerchio da ${rimA}" richiede distanziali propri per centrare disco e pinza.`, 'Ruote');
    if (fam.abs || fam.absOpz) add('Aggiunto', 'Anello encoder ABS e supporto sensore compatibili', 'se la moto ha l\'ABS il nuovo cerchio deve montare un encoder con lo stesso numero di denti dell\'originale.', 'Elettrico');
    if (rimA >= 23 || dRa >= 30) add('Sostituito', 'Piastre forcella maggiorate o con rake integrato (es. +5°)', `con ${rimA}" il raggio cresce di ${mm(dRa)} mm: servono piastre adatte; con le piastre inclinate l'avancorsa diminuisce e va ricalcolata.`, 'Ciclistica');
  } else if (rimA && stRimA && rimA < stRimA) add('Da verificare', `Ruota anteriore più piccola (${rimA}")`, `il raggio diminuisce di ${mm(-dRa)} mm: verifica parafango, luce a terra e avancorsa.`, 'Ciclistica');
  for (const [k, lab, R] of ruote) if (R.cerchio) add('Rimosso', `Cerchio ${lab} di serie` + (spec && spec[k === 'ant' ? 'cerchioAnt' : 'cerchioPost'] ? ` ${spec[k === 'ant' ? 'cerchioAnt' : 'cerchioPost'].d}"` : ''), 'sostituito dal cerchio scelto.', 'Ruote', { rimosso: true });

  // ---- manubrio: ape hanger e semimanubri
  if (S.manubrio) { const id = S.manubrio.id || '', h = S.manubrio.altezza || (id === 'ape_hanger' ? 14 : null), h0 = fam.manubrioSerie || 4;
    add('Rimosso', 'Manubrio di serie', 'sostituito dal manubrio scelto.', 'Comandi', { rimosso: true });
    if (id === 'ape_hanger' && h) { const dl = Math.max(0, h - h0) + 1.5; const lun = `+${dl.toFixed(1)}" (≈ ${Math.round(dl * 25.4)} mm)`;
      if (fam.rbw) add('Aggiunto', 'Prolunga cablaggio acceleratore elettronico', `con acceleratore elettronico non c'è cavo gas: si allunga il cablaggio del comando di ${lun}.`, 'Elettrico');
      else if (fam.rbw === null) add('Aggiunto', `Cavi gas allungati ${lun} (o prolunga cablaggio se ride-by-wire)`, `ape hanger da ${h}" contro circa ${h0}" di serie: allungamento = differenza di altezza + 1-2" di margine; verifica se il modello ha l'acceleratore elettronico.`, 'Comandi');
      else add('Aggiunto', `Cavi gas allungati ${lun}`, `ape hanger da ${h}" contro circa ${h0}" di serie: allungamento = differenza di altezza + 1-2" per l'escursione dello sterzo.`, 'Comandi');
      add('Aggiunto', fam.frizione === 'idraulica' ? `Tubo frizione idraulica allungato ${lun}` : `Cavo frizione allungato ${lun}`, 'il comando frizione deve arrivare alla nuova leva senza tensione a sterzo tutto girato.', 'Comandi');
      add('Aggiunto', `Tubo freno anteriore in treccia allungato ${lun}`, 'la pompa freno sale con il manubrio: il tubo di serie è troppo corto.' + (fam.abs || fam.absOpz ? ' Con ABS spurgo con procedura diagnostica (Digital Technician o equivalente).' : ''), 'Freni');
      add('Aggiunto', fam.can ? 'Prolunghe cablaggio blocchetti (CAN-bus) specifiche per modello' : `Prolunga cablaggio blocchetti elettrici ${lun}`, fam.can ? 'i blocchetti sono in rete CAN-bus: servono prolunghe dedicate, non giunte.' : 'i blocchetti devono raggiungere le nuove estremità.', 'Elettrico');
      add('Da verificare', 'Prova a sterzo tutto a destra e tutto a sinistra', 'con forcella in piena estensione nessun cavo deve tendersi o piegarsi.', 'Comandi');
      if (h >= 12) AV.push(`Manubrio da ${h}": in Italia l'altezza delle manopole e la conformità del manubrio vanno verificate in sede di collaudo (art. 78 CdS).`); }
    if (id === 'semimanubri') add('Aggiunto', 'Tubo freno e cavi accorciati', 'i semimanubri sono più bassi: cavi e tubo di serie risultano troppo lunghi.', 'Comandi'); }
  // ---- scarico e filtro: mappatura e omologazione
  if (S.scarico || S.filtro) {
    if (S.scarico) add('Rimosso', 'Impianto di scarico di serie', 'sostituito dallo scarico scelto.', 'Motore', { rimosso: true });
    if (S.scarico && !S.filtro) add('Aggiunto', 'Filtro aria a flusso libero', 'uno scarico libero va accoppiato a più aria in aspirazione.', 'Motore');
    add('Aggiunto', 'Ricalibrazione centralina (es. Screamin\' Eagle Pro Street Tuner, Dynojet Power Vision)', 'con sonde lambda a circuito chiuso lo scarico/filtro libero smagrisce la miscela: rischio di surriscaldamento senza ricalibrazione.', 'Motore');
    if (S.scarico) add('Da verificare', 'Silenziatore omologato ECE R92 (marchio «e») e aggiornamento della carta di circolazione', 'art. 78 del Codice della Strada: senza omologazione lo scarico è da sola pista.', 'Omologazione');
  }
  // ---- comandi avanzati / pedane arretrate
  if (S.comandi) { add('Aggiunto', 'Leveraggio cambio con asta più lunga o rinvio', 'il pedale si sposta: cambia la geometria del rinvio.', 'Comandi'); add('Aggiunto', 'Tubo freno posteriore in treccia più lungo', 'la pompa freno si sposta con la pedana.' + (fam.abs || fam.absOpz ? ' Con ABS il tubo deve essere compatibile con il modulatore.' : ''), 'Freni');
    add('Aggiunto', 'Pompa o leva freno riposizionata e interruttore stop adeguato', 'lo stop deve accendersi con la nuova leva.', 'Freni'); }
  // ---- sospensioni: abbassamento / rialzo
  for (const [S1, lab] of [[S.sospPost, 'posteriore'], [S.sospAnt, 'anteriore']]) if (S1 && S1.delta) {
    if (S1.delta < 0) { add('Aggiunto', 'Cavalletto laterale accorciato', `abbassando il ${lab} di ${-S1.delta} mm la moto sta più dritta sul cavalletto e rischia di cadere a destra.`, 'Ciclistica'); add('Da verificare', 'Luce a terra e angolo di piega', `l'abbassamento riduce entrambi${spec && spec.piega ? ' (di serie ' + spec.piega + ')' : ''}.`, 'Ciclistica'); }
    else add('Da verificare', 'Cavalletto laterale (moto rialzata)', `rialzando il ${lab} di ${S1.delta} mm la moto si inclina di più sul cavalletto.`, 'Ciclistica'); }
  // ---- selle, codini
  if (S.sella && /molle/i.test(S.sella.nome + JSON.stringify(S.sella.o || {}))) add('Aggiunto', 'Kit montaggio sella a molle', 'staffa anteriore, molle 2-3" con supporti; su Softail M8 e Dyna piastra per spostare batteria/elettronica.', 'Telaio');
  if (S.codino) add('Aggiunto', 'Rilocazione targa e luci posteriori', 'il codino richiede di spostare portatarga, fanalino e frecce.', 'Elettrico');

  return { spec, fam, quote: Q, adeguamenti: A, avvisi: AV, componenti: comp, geo };
}
const GRUPPO = { manubrio: 'Manubrio e comandi', sella: 'Sella', scarico: 'Scarico', filtro: 'Aspirazione', comandi: 'Pedane e comandi', sospAnt: 'Sospensioni', sospPost: 'Sospensioni', parafangoAnt: 'Parafanghi', parafangoPost: 'Parafanghi',
  faro: 'Luci', frecce: 'Luci', carena: 'Carene', serbatoio: 'Serbatoio', borse: 'Borse', codino: 'Codino', strumenti: 'Strumenti', specchietti: 'Specchietti' };

/* testo semplice (per riepilogo e appunti) */
export function riepilogoTesto(E, titolo) {
  const L = [titolo || 'Progetto NJ.D\' RIDE', ''];
  if (E.spec) L.push(`Base: ${E.spec.nome}${E.spec.anno ? ' ' + E.spec.anno : ''} — ${E.fam.n}`, '');
  L.push('COMPONENTI SCELTI'); E.componenti.forEach(c => L.push(`• [${c.gruppo}] ${c.nome}${c.codice ? '  ' + c.codice : ''}`)); if (!E.componenti.length) L.push('• moto di serie');
  L.push('', 'ADEGUAMENTI MECCANICI AUTOMATICI'); E.adeguamenti.forEach(a => L.push(`• ${a.azione}: ${a.nome} (${a.codice}) — ${a.motivo}`)); if (!E.adeguamenti.length) L.push('• nessuno');
  L.push('', 'QUOTE'); E.quote.forEach(q => L.push(`• ${q.n}: ${q.serie} → ${q.nuovo ?? '—'} ${q.u}${q.nota ? ' (' + q.nota + ')' : ''}`));
  if (E.avvisi.length) { L.push('', 'AVVISI'); E.avvisi.forEach(a => L.push('• ' + a)); }
  return L.join('\n');
}
export { COSTR };
