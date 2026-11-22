/* NJ.D' RIDE – Esportazione della relazione di progetto in formato Word (.docx), tutta nel dispositivo: nessun server, nessuna libreria esterna.
   Pacchetto OOXML scritto a mano (WordprocessingML) e archivio ZIP generato qui (metodo «store», con CRC-32).
   © 2026 dott. Jonathan D'Eugenio – Tutti i diritti riservati (L. 633/1941). */

/* ------------------------------ ZIP ------------------------------ */
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(u8) { let c = 0xFFFFFFFF; for (let i = 0; i < u8.length; i++) c = CRC[(c ^ u8[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
const enc = new TextEncoder();
function zip(files) {                               // files: [{ name, data: Uint8Array | string }]
  const d = new Date(), dt = ((d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1)) & 0xFFFF, dd = (((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate()) & 0xFFFF;
  const parts = [], cen = []; let off = 0;
  for (const f of files) {
    const name = enc.encode(f.name), data = typeof f.data === 'string' ? enc.encode(f.data) : f.data, crc = crc32(data);
    const h = new DataView(new ArrayBuffer(30)); h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true);
    h.setUint16(10, dt, true); h.setUint16(12, dd, true); h.setUint32(14, crc, true); h.setUint32(18, data.length, true); h.setUint32(22, data.length, true); h.setUint16(26, name.length, true); h.setUint16(28, 0, true);
    parts.push(new Uint8Array(h.buffer), name, data);
    const c = new DataView(new ArrayBuffer(46)); c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint16(10, 0, true);
    c.setUint16(12, dt, true); c.setUint16(14, dd, true); c.setUint32(16, crc, true); c.setUint32(20, data.length, true); c.setUint32(24, data.length, true); c.setUint16(28, name.length, true);
    c.setUint32(42, off, true); cen.push(new Uint8Array(c.buffer), name); off += 30 + name.length + data.length;
  }
  const cs = cen.reduce((a, b) => a + b.length, 0), e = new DataView(new ArrayBuffer(22)); e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, cs, true); e.setUint32(16, off, true);
  return new Blob([...parts, ...cen, new Uint8Array(e.buffer)], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
}

/* ------------------------------ XML di Word ------------------------------ */
const x = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const NS = 'xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"';
const COL = { ink: '15171B', copper: 'B8652E', amber: 'E8A33D', grey: '5F6672', line: 'D5D8DE', head: '1F2328', zebra: 'F4F5F7', ok: '2E8B57', warn: 'B7791F', red: 'B23B2E' };
function run(t, o = {}) {
  const pr = (o.b ? '<w:b/>' : '') + (o.i ? '<w:i/>' : '') + (o.c ? `<w:color w:val="${o.c}"/>` : '') + (o.sz ? `<w:sz w:val="${o.sz}"/><w:szCs w:val="${o.sz}"/>` : '') + (o.caps ? '<w:caps/>' : '') + (o.sp ? `<w:spacing w:val="${o.sp}"/>` : '') + (o.mono ? '<w:rFonts w:ascii="Consolas" w:hAnsi="Consolas" w:cs="Consolas"/>' : '');
  return String(t).split('\n').map((l, k) => (k ? '<w:r><w:br/></w:r>' : '') + `<w:r>${pr ? '<w:rPr>' + pr + '</w:rPr>' : ''}<w:t xml:space="preserve">${x(l)}</w:t></w:r>`).join('');
}
function p(content, o = {}) {
  const pr = (o.st ? `<w:pStyle w:val="${o.st}"/>` : '') + (o.keep ? '<w:keepNext/>' : '') + (o.pb ? '<w:pageBreakBefore/>' : '') + (o.num ? `<w:numPr><w:ilvl w:val="0"/><w:numId w:val="${o.num}"/></w:numPr>` : '')
    + (o.sb != null || o.sa != null ? `<w:spacing${o.sb != null ? ` w:before="${o.sb}"` : ''}${o.sa != null ? ` w:after="${o.sa}"` : ''}/>` : '') + (o.al ? `<w:jc w:val="${o.al}"/>` : '');
  return `<w:p>${pr ? '<w:pPr>' + pr + '</w:pPr>' : ''}${typeof content === 'string' && !content.startsWith('<w:') ? run(content, o.r || {}) : content || ''}</w:p>`;
}
const H1 = (t, o = {}) => p(t, { st: 'Heading1', ...o }), H2 = t => p(t, { st: 'Heading2' });
/* tabella: larghezze in twip (1 cm = 567), intestazione scura, righe alternate */
function table(head, rows, widths, o = {}) {
  const tw = widths.reduce((a, b) => a + b, 0);
  const cell = (c, w, hd, z) => { const val = typeof c === 'object' && c !== null ? c : { t: c };
    return `<w:tc><w:tcPr><w:tcW w:w="${w}" w:type="dxa"/>${hd ? `<w:shd w:val="clear" w:color="auto" w:fill="${COL.head}"/>` : z ? `<w:shd w:val="clear" w:color="auto" w:fill="${COL.zebra}"/>` : ''}<w:tcMar><w:top w:w="60" w:type="dxa"/><w:bottom w:w="60" w:type="dxa"/></w:tcMar></w:tcPr>`
      + `<w:p><w:pPr><w:spacing w:before="0" w:after="0"/>${val.al ? `<w:jc w:val="${val.al}"/>` : ''}</w:pPr>${run(val.t ?? '', hd ? { b: true, c: 'FFFFFF', sz: 18 } : { sz: 18, b: val.b, c: val.c, mono: val.mono })}</w:p></w:tc>`; };
  let s = `<w:tbl><w:tblPr><w:tblW w:w="${tw}" w:type="dxa"/><w:tblBorders>${['top', 'bottom', 'insideH'].map(b => `<w:${b} w:val="single" w:sz="4" w:space="0" w:color="${COL.line}"/>`).join('')}</w:tblBorders><w:tblLayout w:type="fixed"/><w:tblCellMar><w:left w:w="90" w:type="dxa"/><w:right w:w="90" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid>${widths.map(w => `<w:gridCol w:w="${w}"/>`).join('')}</w:tblGrid>`;
  if (head) s += `<w:tr><w:trPr><w:tblHeader/><w:cantSplit/></w:trPr>${head.map((c, i) => cell(c, widths[i], true)).join('')}</w:tr>`;
  rows.forEach((r, k) => { s += `<w:tr><w:trPr><w:cantSplit/></w:trPr>${r.map((c, i) => cell(c, widths[i], false, o.zebra !== false && k % 2 === 1)).join('')}</w:tr>`; });
  return s + '</w:tbl>' + p('', { sa: 120 });
}
/* immagine in linea: larghezza in cm, proporzioni dell'immagine */
function img(rid, n, wcm, w, h, alt) {
  const cx = Math.round(wcm * 360000), cy = Math.round(cx * h / w);
  return `<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${cx}" cy="${cy}"/><wp:docPr id="${n}" name="Render ${n}" descr="${x(alt)}"/><wp:cNvGraphicFramePr><a:graphicFrameLocks noChangeAspect="1"/></wp:cNvGraphicFramePr>`
    + `<a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic><pic:nvPicPr><pic:cNvPr id="${n}" name="render${n}.jpg"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="${rid}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>`
    + `<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>`;
}

const STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:eastAsia="Calibri" w:cs="Calibri"/><w:color w:val="${COL.ink}"/><w:sz w:val="22"/><w:szCs w:val="22"/><w:lang w:val="it-IT"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="120" w:line="276" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>
<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>
<w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:qFormat/><w:pPr><w:spacing w:before="0" w:after="80"/></w:pPr><w:rPr><w:b/><w:color w:val="${COL.ink}"/><w:spacing w:val="20"/><w:sz w:val="64"/><w:szCs w:val="64"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Subtitle"><w:name w:val="Subtitle"/><w:basedOn w:val="Normal"/><w:qFormat/><w:pPr><w:spacing w:after="240"/></w:pPr><w:rPr><w:color w:val="${COL.copper}"/><w:sz w:val="28"/><w:szCs w:val="28"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:keepLines/><w:pBdr><w:bottom w:val="single" w:sz="8" w:space="4" w:color="${COL.amber}"/></w:pBdr><w:spacing w:before="360" w:after="160"/><w:outlineLvl w:val="0"/></w:pPr><w:rPr><w:b/><w:color w:val="${COL.ink}"/><w:sz w:val="34"/><w:szCs w:val="34"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:keepLines/><w:spacing w:before="240" w:after="100"/><w:outlineLvl w:val="1"/></w:pPr><w:rPr><w:b/><w:color w:val="${COL.copper}"/><w:sz w:val="26"/><w:szCs w:val="26"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Caption"><w:name w:val="caption"/><w:basedOn w:val="Normal"/><w:qFormat/><w:pPr><w:spacing w:before="60" w:after="240"/><w:jc w:val="center"/></w:pPr><w:rPr><w:i/><w:color w:val="${COL.grey}"/><w:sz w:val="18"/><w:szCs w:val="18"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Footer"><w:name w:val="footer"/><w:basedOn w:val="Normal"/><w:pPr><w:tabs><w:tab w:val="right" w:pos="9638"/></w:tabs><w:spacing w:after="0"/></w:pPr><w:rPr><w:color w:val="${COL.grey}"/><w:sz w:val="16"/><w:szCs w:val="16"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Nota"><w:name w:val="Nota"/><w:basedOn w:val="Normal"/><w:rPr><w:color w:val="${COL.grey}"/><w:sz w:val="18"/><w:szCs w:val="18"/></w:rPr></w:style>
<w:style w:type="table" w:default="1" w:styleId="TableNormal"><w:name w:val="Normal Table"/><w:tblPr><w:tblInd w:w="0" w:type="dxa"/><w:tblCellMar><w:top w:w="0" w:type="dxa"/><w:left w:w="108" w:type="dxa"/><w:bottom w:w="0" w:type="dxa"/><w:right w:w="108" w:type="dxa"/></w:tblCellMar></w:tblPr></w:style>
</w:styles>`;
const NUMBERING = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:abstractNum w:abstractNumId="0"><w:multiLevelType w:val="singleLevel"/><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%1."/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="425" w:hanging="425"/></w:pPr></w:lvl></w:abstractNum>
<w:abstractNum w:abstractNumId="1"><w:multiLevelType w:val="singleLevel"/><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val="•"/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="425" w:hanging="283"/></w:pPr></w:lvl></w:abstractNum>
<w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num><w:num w:numId="2"><w:abstractNumId w:val="1"/></w:num></w:numbering>`;
const FOOTER = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:p><w:pPr><w:pStyle w:val="Footer"/><w:pBdr><w:top w:val="single" w:sz="4" w:space="4" w:color="${COL.line}"/></w:pBdr></w:pPr><w:r><w:t xml:space="preserve">NJ.D' RIDE · © 2026 dott. Jonathan D'Eugenio – Tutti i diritti riservati</w:t></w:r><w:r><w:tab/><w:t xml:space="preserve">Pagina </w:t></w:r><w:r><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:instrText xml:space="preserve"> PAGE </w:instrText></w:r><w:r><w:fldChar w:fldCharType="separate"/></w:r><w:r><w:t>1</w:t></w:r><w:r><w:fldChar w:fldCharType="end"/></w:r><w:r><w:t xml:space="preserve"> di </w:t></w:r><w:r><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:instrText xml:space="preserve"> NUMPAGES </w:instrText></w:r><w:r><w:fldChar w:fldCharType="separate"/></w:r><w:r><w:t>1</w:t></w:r><w:r><w:fldChar w:fldCharType="end"/></w:r></w:p></w:ftr>`;

/* ------------------------------ note di montaggio ------------------------------ */
function noteMontaggio(S, E) {
  const N = [], has = re => E.adeguamenti.some(a => re.test(a.nome));
  const rA = S.ruotaAnt, rP = S.ruotaPost;
  if (rA.cerchio || rA.gomma || rP.cerchio || rP.gomma) N.push('Ruote: smontare una ruota per volta con la moto su cavalletto da officina e sollevatore; montare i pneumatici rispettando il senso di rotazione indicato sul fianco, equilibrare ogni ruota e serrare perni e pinze alle coppie del manuale d\'officina del modello.');
  if (rA.cerchio) N.push('Ruota anteriore: montare i distanziali del mozzo specifici per il nuovo cerchio, verificare la centratura del disco nella pinza e la distanza tra pneumatico, parafango e piastre a forcella tutta compressa.');
  if (rP.gomma || rP.cerchio) N.push('Ruota posteriore: allineare la ruota con i registri del forcellone, tendere cinghia o catena secondo il manuale, verificare la luce tra pneumatico, cinghia/catena, forcellone e parafango con la sospensione tutta compressa.');
  if (has(/forcellone/i)) N.push('Forcellone: lo smontaggio richiede di scaricare la moto dal retrotreno; serrare il perno del forcellone e i supporti degli ammortizzatori alle coppie del costruttore del kit.');
  if (has(/offset/i)) N.push('Kit offset della trasmissione: montare albero secondario e puleggia del kit seguendo le istruzioni del produttore; verificare l\'allineamento della linea di trasmissione prima di tendere la cinghia.');
  if (S.manubrio) N.push('Manubrio: smontare blocchetti, leve e pompa freno; montare cavi e tubi della lunghezza indicata nella distinta, spurgare l\'impianto frenante (con ABS usare la procedura diagnostica), quindi verificare il funzionamento di tutti i comandi a sterzo tutto girato a destra e a sinistra.');
  if (S.scarico) N.push('Scarico: guarnizioni nuove ai collettori, serraggio progressivo delle flange, controllo delle sonde lambda; eseguire la ricalibrazione della centralina prima dell\'uso su strada.');
  if (S.comandi) N.push('Comandi a pedale: regolare la leva del cambio e del freno posteriore alla posizione di guida, spurgare il freno posteriore e verificare l\'accensione dello stop.');
  if (S.sospAnt || S.sospPost) N.push('Sospensioni: dopo la sostituzione controllare l\'altezza da terra, il cavalletto laterale e le luci a terra in curva.');
  if (S.sella || S.codino || S.faro || S.frecce || S.parafangoAnt || S.parafangoPost) N.push('Carrozzeria e luci: verificare il fissaggio di sella, parafanghi e codino e il funzionamento di luci, frecce, stop e luce targa.');
  N.push('Al termine: prova su strada a bassa velocità, ricontrollo di tutti i serraggi dopo i primi 100 km e rodaggio dei pneumatici nuovi.');
  return N;
}

/* ------------------------------ documento ------------------------------ */
/* dati: { progetto, modello, data, E (esito del motore), S (stato), config: [{k, n}], renders: [{ nome, bytes: Uint8Array, w, h }], versione } */
export function relazioneDocx(d) {
  const E = d.E, S = d.S, sp = E.spec, q = k => E.quote.find(z => z.k === k), Q = (k, fb) => { const z = q(k); return z ? (z.nuovo ?? z.serie) + ' ' + z.u : fb || '—'; };
  const rel = [], media = []; let rid = 10, nimg = 1;
  const addImg = r => { const id = 'rId' + (rid++); rel.push(`<Relationship Id="${id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/render${nimg}.jpg"/>`); media.push({ name: `word/media/render${nimg}.jpg`, data: r.bytes }); return [id, nimg++]; };
  const misA = (S.ruotaAnt.gomma && S.ruotaAnt.gomma.misura) || (sp && sp.gommaAnt) || '—', misP = (S.ruotaPost.gomma && S.ruotaPost.gomma.misura) || (sp && sp.gommaPost) || '—';
  const cerA = (S.ruotaAnt.cerchio && S.ruotaAnt.cerchio.d) || (sp && sp.cerchioAnt && sp.cerchioAnt.d), cerP = (S.ruotaPost.cerchio && S.ruotaPost.cerchio.d) || (sp && sp.cerchioPost && sp.cerchioPost.d);
  let b = '';
  // copertina
  b += p(run('NJ.D\' RIDE', { b: true, c: COL.amber, sz: 22, sp: 40 }), { sa: 0 });
  b += p(d.progetto || 'Progetto custom', { st: 'Title' });
  b += p('Relazione di progetto · Custom Moto 3D Modelling Software', { st: 'Subtitle' });
  const hero = d.renders.find(r => /3\/4 anteriore/.test(r.nome)) || d.renders[0];
  if (hero) { const [id, n] = addImg(hero); b += p(img(id, n, 17, hero.w, hero.h, hero.nome), { al: 'center', sa: 120 }); }
  b += table(null, [[{ t: 'Modello di base', b: true }, d.modello], [{ t: 'Data', b: true }, d.data], [{ t: 'Componenti scelti', b: true }, String(E.componenti.length)], [{ t: 'Adeguamenti meccanici', b: true }, String(E.adeguamenti.length)], [{ t: 'Software', b: true }, 'NJ.D\' RIDE ' + (d.versione || '')]], [3000, 6638], { zebra: false });
  b += p('© 2026 dott. Jonathan D\'Eugenio – Tutti i diritti riservati', { st: 'Nota', al: 'center', sb: 240 });
  // 1. dati di progetto
  b += H1('1. Dati di progetto', { pb: true });
  b += table(['Voce', 'Valore'], [['Nome del progetto', d.progetto || '—'], ['Modello di base', d.modello], ['Famiglia tecnica', E.fam ? E.fam.n : '—'], ['Anno di riferimento dei dati', sp && sp.anno ? String(sp.anno) : '—'],
    ['Affidabilità dei dati di serie', sp ? ({ anno: 'dato ufficiale del modello e dell\'anno', famiglia: 'valore di famiglia', riferimento: 'modello ricondotto al più vicino di serie', stima: 'stima da verificare' })[sp.livello] || sp.livello : 'modello senza scheda'],
    ['Fonte', sp ? sp.fonte : '—'], ['Data della relazione', d.data]], [3600, 6038]);
  // 2. specifiche finali
  b += H1('2. Specifiche finali');
  b += table(['Specifica', 'Di serie', 'Progetto'], [
    ['Interasse', sp && sp.interasse ? sp.interasse + ' mm' : '—', Q('wb')], ['Altezza sella a vuoto', sp && sp.sella ? sp.sella + ' mm' : '—', Q('sella')],
    ['Inclinazione cannotto (rake)', sp && sp.rake ? sp.rake + '°' : '—', Q('rake')], ['Avancorsa', sp && sp.avancorsa ? sp.avancorsa + ' mm' : '—', Q('trail')], ['Luce a terra', sp && sp.luce ? sp.luce + ' mm' : '—', Q('luce')],
    ['Cerchio anteriore', sp && sp.cerchioAnt ? sp.cerchioAnt.d + '"' : '—', cerA ? cerA + '"' : '—'], ['Cerchio posteriore', sp && sp.cerchioPost ? sp.cerchioPost.d + '"' : '—', cerP ? cerP + '"' : '—'],
    ['Pneumatico anteriore', sp ? sp.gommaAnt || '—' : '—', misA], ['Pneumatico posteriore', sp ? sp.gommaPost || '—' : '—', misP],
    ['Diametro esterno ruota anteriore', q('dA') ? q('dA').serie + ' mm' : '—', Q('dA')], ['Diametro esterno ruota posteriore', q('dP') ? q('dP').serie + ' mm' : '—', Q('dP')],
    ['Trasmissione finale', sp && sp.finale ? sp.finale.note : '—', sp && sp.finale ? sp.finale.note : '—']], [4200, 2719, 2719]);
  b += p('Le quote del progetto sono ricalcolate dalla geometria: avancorsa t = (R·sinθ − d)/cosθ; variazione d\'inclinazione Δθ ≈ (ΔR anteriore − ΔR posteriore)/interasse; diametro del pneumatico = cerchio × 25,4 + 2 × larghezza × serie/100.', { st: 'Nota' });
  // 3. render
  b += H1('3. Render del progetto', { pb: true });
  for (const r of d.renders) { const [id, n] = addImg(r); b += p(img(id, n, 16.5, r.w, r.h, r.nome), { al: 'center', sa: 0, keep: true }); b += p(`${r.nome} — ${r.w} × ${r.h} px`, { st: 'Caption' }); }
  // 4. scheda tecnica
  b += H1('4. Scheda tecnica del modello di base', { pb: true });
  if (sp) b += table(['Dato', 'Valore'], [['Modello', sp.nome + (sp.anno ? ' (' + sp.anno + ')' : '')], ['Cilindrata', sp.cc ? sp.cc + ' cm³' : '—'], ['Interasse', sp.interasse ? sp.interasse + ' mm' : '—'], ['Altezza sella', sp.sella ? sp.sella + ' mm a vuoto' + (sp.sellaCarico ? ', ' + sp.sellaCarico + ' mm a carico' : '') : '—'],
    ['Rake / angolo forcella', sp.rake ? sp.rake + '° / ' + (sp.fork || sp.rake) + '°' : '—'], ['Avancorsa', sp.avancorsa ? sp.avancorsa + ' mm' : '—'], ['Luce a terra', sp.luce ? sp.luce + ' mm' : '—'], ['Angolo di piega', sp.piega || '—'],
    ['Steli forcella', sp.steli ? 'Ø ' + sp.steli + ' mm' : '—'], ['Escursione ant./post.', (sp.corsaAnt ?? '—') + ' / ' + (sp.corsaPost ?? '—') + ' mm'], ['Peso', sp.peso ? sp.peso + ' kg' : '—'], ['Fonte', sp.fonte]], [3600, 6038]);
  else b += p('Modello importato senza scheda tecnica: le quote non sono ricalcolabili.');
  if (sp && sp.conflitti && sp.conflitti.length) { b += H2('Dati da verificare'); sp.conflitti.forEach(c => b += p(c, { num: 2, sa: 40 })); }
  // 5. distinta
  b += H1('5. Distinta componenti (BOM)');
  b += E.componenti.length ? table(['Gruppo', 'Componente', 'Codice'], E.componenti.map(c => [c.gruppo, c.nome, { t: c.codice || '—', mono: true }]), [2400, 5238, 2000]) : p('Moto di serie: nessun componente sostituito.');
  if (d.config && d.config.length) { b += H2('Elementi montati nel modello 3D'); b += table(['Codice', 'Descrizione'], d.config.map(c => [{ t: c.k || '—', mono: true }, c.n]), [2200, 7438]); }
  // 6. adeguamenti
  b += H1('6. Log adeguamenti meccanici');
  if (!E.adeguamenti.length) b += p('Nessun adeguamento necessario per i componenti scelti.');
  else { const cats = [...new Set(E.adeguamenti.map(a => a.cat))];
    for (const c of cats) { b += H2(c); b += table(['Azione', 'Componente', 'Codice', 'Motivazione tecnica'], E.adeguamenti.filter(a => a.cat === c).map(a => [{ t: a.azione, b: true, c: ({ 'Aggiunto': COL.ok, 'Sostituito': COL.warn, 'Rimosso': COL.grey, 'Da verificare': COL.red })[a.azione] }, a.nome, { t: a.codice, mono: true }, a.motivo]), [1300, 2900, 1350, 4088]); } }
  // 7. note di montaggio
  b += H1('7. Note di montaggio');
  noteMontaggio(S, E).forEach(n => b += p(n, { num: 1, sa: 80 }));
  if (E.avvisi.length) { b += H2('Avvisi e verifiche'); E.avvisi.forEach(a => b += p(a, { num: 2, sa: 60 })); }
  // 8. riepilogo
  b += H1('8. Riepilogo');
  const dl = k => { const z = q(k); return z && z.nuovo != null && z.serie != null ? z.nuovo - z.serie : null; }, fmt = (v, u) => v == null ? null : (v > 0 ? '+' : '') + (u === '°' ? v.toFixed(1) : Math.round(v)) + ' ' + u;
  const geo = [['altezza sella', fmt(dl('sella'), 'mm')], ['avancorsa', fmt(dl('trail'), 'mm')], ['inclinazione del cannotto', fmt(dl('rake'), '°')], ['luce a terra', fmt(dl('luce'), 'mm')]].filter(z => z[1] && !/^[+-]?0(\.0)? /.test(z[1].replace('+', '')));
  b += p(`Il progetto «${d.progetto || 'senza nome'}» parte da ${d.modello} e comprende ${E.componenti.length} componenti scelti, che richiedono ${E.adeguamenti.filter(a => !a.rimosso).length} adeguamenti meccanici (${E.adeguamenti.filter(a => a.azione === 'Da verificare').length} da verificare in officina). `
    + (geo.length ? 'Effetti sulla geometria: ' + geo.map(z => z[0] + ' ' + z[1]).join(', ') + '. ' : 'La geometria di serie resta invariata. ')
    + `Pneumatici: anteriore ${misA}, posteriore ${misP}.`);
  b += p('Questa relazione è uno strumento di progettazione: misure, compatibilità e adeguamenti vanno confermati sul manuale d\'officina del modello e dal costruttore di ciascun kit. Le modifiche a componenti omologati richiedono il collaudo e l\'aggiornamento della carta di circolazione (art. 78 del Codice della Strada).', { st: 'Nota', sb: 240 });
  const sect = `<w:sectPr><w:footerReference w:type="default" r:id="rId3"/><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="567" w:footer="567" w:gutter="0"/></w:sectPr>`;
  const doc = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:document ${NS}><w:body>${b}${sect}</w:body></w:document>`;
  const now = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
  const files = [
    { name: '[Content_Types].xml', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="jpg" ContentType="image/jpeg"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/><Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>` },
    { name: '_rels/.rels', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>` },
    { name: 'docProps/core.xml', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${x(d.progetto || 'Progetto NJ.D\' RIDE')}</dc:title><dc:subject>Relazione di progetto moto custom</dc:subject><dc:creator>dott. Jonathan D'Eugenio</dc:creator><cp:keywords>NJ.D' RIDE</cp:keywords><dc:language>it-IT</dc:language><dcterms:created xsi:type="dcterms:W3CDTF">${now}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">${now}</dcterms:modified></cp:coreProperties>` },
    { name: 'docProps/app.xml', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>NJ.D' RIDE ${x(d.versione || '')}</Application><Company>dott. Jonathan D'Eugenio</Company></Properties>` },
    { name: 'word/_rels/document.xml.rels', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/>${rel.join('')}</Relationships>` },
    { name: 'word/document.xml', data: doc }, { name: 'word/styles.xml', data: STYLES }, { name: 'word/numbering.xml', data: NUMBERING }, { name: 'word/footer1.xml', data: FOOTER }, ...media
  ];
  return zip(files);
}
