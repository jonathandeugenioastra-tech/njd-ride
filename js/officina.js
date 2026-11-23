/* NJ.D' RIDE – officina 3D: pezzi singoli, maniglie, accessori, costruttore scarichi, consulente meccanico.
   © 2026 dott. Jonathan D'Eugenio – Tutti i diritti riservati. */
import * as THREE from 'three';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import * as ACC from './acc.js';
import { TIPI, guessType, adviceHTML as advBase } from './kb.js';
import { techHTML, KB2TORQ } from './techdb.js';
import { marketFor, MARKET_URL } from './market.js';
import { PARTS, PART_CATS } from './parts.js';
import { PRO_DEFS, PRO_IDS, buildPro, metal as pMetal, paint as pPaint, leather as pLeather, FIN_METAL } from './pro.js';
import './pro2.js'; import './pro3.js'; import './pro4.js'; import './pro5.js';
import { CATALOG, CAT_CATS, searchCatalog } from './catalog.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import * as ST from './stock.js';
import * as AG from './aggancio.js';
function adviceHTML(k,az){let h=advBase(k,az);const d=window.__techFor&&window.__techFor();const f=KB2TORQ[k];
 if(d&&f){const t=techHTML(d,f);if(/<table/.test(t))h+='<div class="h">Coppie e dati ufficiali per questo modello</div>'+t.replace(/<div class="tfam">[\s\S]*?<\/div><div class="note">[\s\S]*?<\/div>/,'');}
 const m=marketFor(k);if(m.length)h+='<div class="h">Sul mercato</div>'+m.map(x=>`<p>${x[2]} · <a href="${MARKET_URL}${x[1]}" target="_blank" rel="noopener">catalogo p. ${x[1]}</a></p>`).join('');return h;}

export function initOfficina(ctx){
 const {scene,camera,renderer,controls,invalidate,$}=ctx;
 const tc=new TransformControls(camera,renderer.domElement);tc.setSize(.85);scene.add(tc);
 /* punti di aggancio (calamita) come nei programmi CAD: centri, facce e spigoli dei pezzi, assi ruota, mezzeria, terra */
 const CAL=AG.creaCalamita({scene,camera,renderer,invalidate,getModel:ctx.getModel,asseRuota:ctx.asseRuota,nomeDi:o=>ctx.nice((o.material&&!Array.isArray(o.material)&&o.material.name)||o.name||'pezzo')});
 tc.addEventListener('dragging-changed',e=>{controls.enabled=!e.value;
  if(e.value&&sel){pushUndo(sel);if(tc.mode==='translate')CAL.inizio(tc.object);}
  if(!e.value){const sn=CAL.fine();if(sel){advise(sel,'modificato',sn?'agganciato a: '+sn.n:'');if(sel.userData.handleOf)rebuildPipe(sel.userData.handleOf);}ctx.modificato&&ctx.modificato();}});
 tc.addEventListener('objectChange',()=>{if(tc.dragging&&tc.mode==='translate'&&tc.object)CAL.muovi(tc.object);if(sel&&sel.userData.handleOf)rebuildPipe(sel.userData.handleOf,true);invalidate();syncScale();});
 tc.addEventListener('change',invalidate);
 let sel=null,undo=[],added=[],mode='piece',placing=null,building=null,TOOL='sel',inClick=false;
 /* le maniglie restano agganciate solo a pezzi presenti nella scena: se il pezzo viene sostituito (nuova gomma, nuovo cerchio) o tolto,
    si sganciano da sole invece di generare errori a ogni tocco */
 const inScena=o=>{for(let p=o;p;p=p.parent)if(p===scene)return true;return false;};
 function sgancia(){const o=tc.object;if(!o||inScena(o))return false;tc.detach();if(sel===o){sel=null;$('eName').textContent='Clicca un pezzo sulla moto';const a=$('eAsse');if(a)a.style.display='none';renderOpts(null);renderMats(null);}invalidate();return true;}
 {const pd=tc.pointerDown.bind(tc),ph=tc.pointerHover.bind(tc),pm=tc.pointerMove.bind(tc),um=tc.updateMatrixWorld.bind(tc);
  tc.pointerDown=p=>{if(sgancia())return;return pd(p);};tc.pointerHover=p=>{if(sgancia())return;return ph(p);};tc.pointerMove=p=>{if(sgancia())return;return pm(p);};
  tc.updateMatrixWorld=f=>{if(tc.object&&!inScena(tc.object))sgancia();return um(f);};}
 const typeSel=$('eType');typeSel.innerHTML=Object.entries(TIPI).map(([k,t])=>`<option value="${k}">${t.n}</option>`).join('');

 /* ---------- isole: pezzi fisicamente separati dentro una mesh ---------- */
 const islands=ST.islands; // stesso calcolo esatto delle isole della configurazione (stock.js)
 function subGeo(g,keep){const out=new THREE.BufferGeometry();const nT=keep.length;
  for(const [n,a] of Object.entries(g.attributes)){const s=a.itemSize,arr=new a.array.constructor(nT*3*s);let o=0;for(const t of keep){arr.set(a.array.subarray(t*3*s,(t*3+3)*s),o);o+=3*s;}out.setAttribute(n,new THREE.BufferAttribute(arr,s,a.normalized));}
  return out;}
 function extract(mesh,tri){if(Array.isArray(mesh.material))return mesh;const isl=islands(mesh);const root=isl[tri];const keep=[],rest=[];for(let i=0;i<isl.length;i++)(isl[i]===root?keep:rest).push(i);
  if(rest.length===0||keep.length/isl.length>.95)return mesh;
  const g=mesh.geometry;const ng=subGeo(g,keep),rg=subGeo(g,rest);mesh.geometry=rg;mesh.userData.isl=null;g.dispose();
  ng.computeBoundingBox();const c=ng.boundingBox.getCenter(new THREE.Vector3());ng.translate(-c.x,-c.y,-c.z);
  const m=new THREE.Mesh(ng,mesh.material);m.castShadow=m.receiveShadow=true;m.position.copy(mesh.position).add(c.clone().multiply(mesh.scale).applyQuaternion(mesh.quaternion));m.quaternion.copy(mesh.quaternion);m.scale.copy(mesh.scale);
  m.userData.piece=true;m.userData.origin={p:m.position.clone(),q:m.quaternion.clone(),s:m.scale.clone()};m.name=(mesh.material.name||'pezzo');mesh.parent.add(m);ctx.registerMesh(m);return m;}

 /* ---------- componente intero: il pezzo toccato e quelli montati con lui (stessa regola della configurazione), raccolti in un gruppo
    che le maniglie spostano e ruotano tutto insieme. Mai i pezzi che hanno solo lo stesso materiale (telaio, altri componenti) ---------- */
 function estraiIsole(mesh,ids){ // più isole della stessa mesh in un colpo solo (dopo ogni taglio gli indici delle isole cambiano)
  if(Array.isArray(mesh.material))return [mesh];const isl=islands(mesh),set=new Set(ids),grp=new Map(),rest=[];
  for(let t=0;t<isl.length;t++){if(set.has(isl[t])){let a=grp.get(isl[t]);if(!a)grp.set(isl[t],a=[]);a.push(t);}else rest.push(t);}
  if(!grp.size)return [];if(!rest.length&&grp.size===1)return [mesh];
  const g=mesh.geometry,out=[];
  for(const keep of grp.values()){const ng=subGeo(g,keep);ng.computeBoundingBox();const c=ng.boundingBox.getCenter(new THREE.Vector3());ng.translate(-c.x,-c.y,-c.z);
   const m=new THREE.Mesh(ng,mesh.material);m.castShadow=m.receiveShadow=true;m.position.copy(mesh.position).add(c.clone().multiply(mesh.scale).applyQuaternion(mesh.quaternion));m.quaternion.copy(mesh.quaternion);m.scale.copy(mesh.scale);
   m.userData.piece=true;m.userData.origin={p:m.position.clone(),q:m.quaternion.clone(),s:m.scale.clone()};m.name=(mesh.material.name||'pezzo');mesh.parent.add(m);ctx.registerMesh(m);out.push(m);}
  if(rest.length){mesh.geometry=subGeo(g,rest);}else{mesh.visible=false;mesh.userData.vuoto=true;}
  mesh.userData.isl=null;g.dispose();for(let a=mesh;a;a=a.parent)if(a.userData.__idx)a.userData.__idx=null;return out;}
 function componenteDi(mesh,tri){
  if(mesh.parent&&mesh.parent.userData.comp)return mesh.parent; // già raccolto in un componente
  const M=ctx.getModel();if(!M||Array.isArray(mesh.material))return mesh;
  const id=islands(mesh)[tri];const L=ST.componente(M,mesh,id);const per=new Map();L.forEach(({mesh:m,id:i})=>{if(!per.has(m))per.set(m,[]);per.get(m).push(i);});
  const pcs=[];for(const [m,ids] of per)pcs.push(...estraiIsole(m,ids));
  if(!pcs.length)return extract(mesh,tri);if(pcs.length===1){ctx.toast('Questo pezzo non ha altri pezzi montati con lui: il componente è il pezzo stesso');return pcs[0];}
  const par=pcs[0].parent||scene,box=new THREE.Box3();pcs.forEach(p=>box.expandByObject(p));const c=box.getCenter(new THREE.Vector3());
  par.updateMatrixWorld(true);const G=new THREE.Group();G.name='Componente';G.position.copy(par.worldToLocal(c.clone()));par.add(G);G.updateMatrixWorld(true);
  const inv=new THREE.Matrix4().copy(G.matrixWorld).invert(),mo=new THREE.Matrix4(),mw=new THREE.Matrix4();
  pcs.forEach(p=>{const o=p.userData.origin,pp=p.parent;if(pp)pp.updateMatrixWorld(true);const pw=pp?pp.matrixWorld.clone():new THREE.Matrix4();G.attach(p);
   if(o){mo.compose(o.p,o.q,o.s);mw.multiplyMatrices(pw,mo).premultiply(inv);const P=new THREE.Vector3(),Q=new THREE.Quaternion(),S=new THREE.Vector3();mw.decompose(P,Q,S);p.userData.origin={p:P,q:Q,s:S};}}); // posizione di serie del pezzo, vista dal gruppo
  G.userData.piece=true;G.userData.comp=true;G.userData.accName='Componente intero ('+pcs.length+' pezzi)';G.userData.origin={p:G.position.clone(),q:G.quaternion.clone(),s:G.scale.clone()};
  ctx.toast('Componente intero: '+pcs.length+' pezzi (il pezzo toccato e quelli montati con lui)');return G;}

 /* ---------- selezione ---------- */
 /* ---------- strumenti: Seleziona (senza maniglie) · Sposta · Ruota · Scala. «Fine», Esc o un tocco nel vuoto tornano alla selezione ---------- */
 const VERBO={translate:'spostare',rotate:'ruotare',scale:'ridimensionare'};
 function setTool(t,quiet){if(!['sel','translate','rotate','scale'].includes(t))t='sel';TOOL=t;
  document.querySelectorAll('#tools [data-tool]').forEach(b=>b.classList.toggle('on',b.dataset.tool===t));{const f=$('tFine');if(f)f.style.display=t==='sel'?'none':'';}
  if(t!=='sel'&&$('eMode'))$('eMode').value=t;
  if(t==='sel'){tc.detach();CAL.nascondi();}
  else{const o=need();if(o){tc.attach(o);tc.setMode(t);}else if(!quiet)ctx.toast('Tocca il pezzo o l\'accessorio da '+VERBO[t]);}
  invalidate();}
 /* dalla selezione della configurazione all'oggetto da muovere: un accessorio resta com'è; un pezzo o un componente della moto
    entra in un «perno» (gruppo con l'origine al centro del pezzo), così le maniglie stanno sul pezzo e non lontano */
 function perno(objs,nome){objs=objs.filter(o=>o&&inScena(o));if(!objs.length)return null;const p0=objs[0].parent;
  if(p0&&p0.userData.perno&&objs.every(o=>o.parent===p0)&&p0.children.length===objs.length)return p0;
  const par=objs.every(o=>o.parent===p0)?p0:(ctx.getModel()||scene);const b=new THREE.Box3();objs.forEach(o=>b.expandByObject(o));const c=b.getCenter(new THREE.Vector3());
  par.updateMatrixWorld(true);const G=new THREE.Group();G.name=nome;G.position.copy(par.worldToLocal(c.clone()));par.add(G);G.updateMatrixWorld(true);objs.forEach(o=>G.attach(o));
  G.userData.piece=true;G.userData.perno=true;G.userData.comp=objs.length>1;G.userData.accName=objs.length>1?'Componente intero ('+objs.length+' pezzi)':'Pezzo selezionato';
  G.userData.origin={p:G.position.clone(),q:G.quaternion.clone(),s:G.scale.clone()};if(ctx.diario)try{ctx.diario('perno',G,objs,par);}catch(e){console.warn('diario',e);}return G;}
 function bersaglio(s){if(!s)return null;if(s.kind==='acc')return inScena(s.obj)?s.obj:null;if(s.kind==='piece')return perno([s.obj],'Pezzo');if(s.kind==='comp')return perno(s.objs,'Componente');return null;}
 /* l'oggetto su cui lavorano i comandi dell'officina: quello già scelto, oppure quello selezionato toccando la moto */
 function need(){if(sel&&inScena(sel))return sel;const o=bersaglio(ctx.cfgSel&&ctx.cfgSel());if(o)select(o);return o;}
 /* la configurazione ha cambiato selezione: con Sposta/Ruota/Scala le maniglie passano al nuovo pezzo, con Seleziona nessuna maniglia */
 function adopt(s){if(inClick)return;if(!s){select(null);return;}if(TOOL!=='sel'){const o=bersaglio(s);if(o)select(o);}else{sel=null;tc.detach();$('eName').textContent=s.kind==='part'?'Tocca il pezzo sulla moto':'Pronto: '+(s.kind==='comp'?'componente intero ('+s.objs.length+' pezzi)':s.kind==='acc'?(s.obj.userData.accName||'accessorio'):'pezzo selezionato');}}
 function select(o){sel=o;if(o){if(TOOL!=='sel'){tc.attach(o);tc.setMode(TOOL);}else tc.detach();if(!o.userData.origin)o.userData.origin={p:o.position.clone(),q:o.quaternion.clone(),s:o.scale.clone()};
   const nm=o.userData.accName||ctx.nice(o.material&&!Array.isArray(o.material)?o.material.name:o.name||'pezzo');$('eName').textContent=nm;
   const k=o.userData.kbType||guessType((o.material&&o.material.name||'')+' '+(o.name||''),ctx.catOfMesh(o));o.userData.kbType=k;typeSel.value=k;$('eAdv').innerHTML=adviceHTML(k,'info');syncScale();}
  else{tc.detach();$('eName').textContent='Clicca un pezzo sulla moto';}{const a=$('eAsse');if(a)a.style.display=o&&o.userData.ruota?'':'none';}renderOpts(o);renderMats(o);invalidate();}
 function syncScale(){if(!sel)return;for(const a of ['x','y','z']){$('es'+a).value=Math.abs(sel.scale[a]/(sel.userData.origin?sel.userData.origin.s[a]:1));$('os'+a).textContent=Math.round($('es'+a).value*100)+'%';}}
 for(const a of ['x','y','z'])$('es'+a).oninput=e=>{if(!need())return;if(!e.target._u){pushUndo(sel);e.target._u=1;setTimeout(()=>e.target._u=0,600);}const s0=sel.userData.origin.s;const sg=b=>Math.sign(sel.scale[b]/s0[b])||1;sel.scale[a]=s0[a]*(+e.target.value)*sg(a);
   if($('eLock').checked){for(const b of ['x','y','z'])if(b!==a)sel.scale[b]=s0[b]*(+e.target.value)*sg(b);}syncScale();invalidate();};
 $('eMode').onchange=()=>setTool($('eMode').value);
 typeSel.onchange=()=>{if(sel){sel.userData.kbType=typeSel.value;$('eAdv').innerHTML=adviceHTML(typeSel.value,'info');}};
 function advise(o,az,extra){const k=TIPI[o.userData.kbType]?o.userData.kbType:'generic';$('eAdv').innerHTML=adviceHTML(k,az);ctx.toast(`${az==='rimosso'?'Rimosso':az==='aggiunto'?'Aggiunto':'Modificato'}: ${o.userData.accName&&!o.userData.perno?o.userData.accName:TIPI[k].n}${extra?' — '+extra:''} — consigli nella scheda Officina 3D`);}
 function pushUndo(o){undo.push({o,p:o.position.clone(),q:o.quaternion.clone(),s:o.scale.clone(),v:o.visible,par:o.parent});if(undo.length>200)undo.shift();ctx.modificato&&setTimeout(ctx.modificato,0);}
 $('eDel').onclick=()=>{if(!need())return;pushUndo(sel);sel.visible=false;advise(sel,'rimosso');tc.detach();sel=null;invalidate();};
 $('eDup').onclick=()=>{if(!need())return;const c=sel.clone();c.userData={...sel.userData,origin:null};c.position.z=-c.position.z;c.scale.z*=sel.position.z===0?1:1;sel.parent.add(c);if(!c.userData.acc){ctx.registerMesh(c);c.traverse(m=>{if(m.isMesh&&m!==c)ctx.registerMesh(m);});if(ctx.diario)try{ctx.diario('dup',c,sel);}catch(e){console.warn('diario',e);}}undo.push({o:c,v:false,p:c.position.clone(),q:c.quaternion.clone(),s:c.scale.clone(),par:null,added:1});select(c);};
 function centraAsse(o,silenzio){const A=ctx.asseRuota&&o&&o.userData.ruota?ctx.asseRuota(o.userData.ruota):null;if(!A||!A.c)return false;
  const par=o.parent||scene;par.updateWorldMatrix(true,false);const pl=par.worldToLocal(A.c.clone());const pq=new THREE.Quaternion();par.getWorldQuaternion(pq);
  const qw=A.n?new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1),A.n):new THREE.Quaternion();o.position.copy(pl);o.quaternion.copy(pq.invert().multiply(qw));o.updateMatrixWorld(true);if(sel===o)syncScale();invalidate();if(!silenzio)ctx.toast('Centrato sull\'asse del mozzo '+(o.userData.ruota==='ant'?'anteriore':'posteriore'));return true;}
 {const b=$('eAsse');if(b)b.onclick=()=>{if(!need())return;pushUndo(sel);if(!centraAsse(sel))ctx.toast('Asse della ruota non disponibile per questo modello');};}
 $('eReset').onclick=()=>{if(!need()||!sel.userData.origin)return;pushUndo(sel);const o=sel.userData.origin;sel.position.copy(o.p);sel.quaternion.copy(o.q);sel.scale.copy(o.s);sel.visible=true;syncScale();invalidate();};
 $('eUndo').onclick=()=>{const u=undo.pop();if(!u)return;if(u.swap){swapObj(u.swap[0],u.swap[1]);select(u.swap[1]);return;}if(u.added){u.o.parent&&u.o.parent.remove(u.o);if(sel===u.o)select(null);invalidate();return;}u.o.position.copy(u.p);u.o.quaternion.copy(u.q);u.o.scale.copy(u.s);u.o.visible=u.v;if(sel===u.o)syncScale();invalidate();};
 $('eShowAll').onclick=()=>{ctx.getModel()&&ctx.getModel().traverse(o=>{if(o.isMesh)o.visible=true;});added.forEach(a=>a.visible=true);invalidate();};
 $('eMirror').onclick=()=>$('eDup').click();
 $('eSelMode').onchange=e=>mode=e.target.value;

 /* ---------- accessori ---------- */
 const lib=$('accLib');ACC.CATALOG.forEach(([cat,items])=>{const h=document.createElement('div');h.className='group';h.textContent=cat;lib.appendChild(h);const w=document.createElement('div');w.className='chips';
  items.forEach(([n,fn])=>{const b=document.createElement('button');b.className='chip';b.textContent=n;b.onclick=()=>{placing={n,fn,cat,ric:{tipo:'acc',cat,n}};$('placeHint').style.display='block';$('placeHint').textContent='Clicca sulla moto dove montare: '+n+' · Esc per annullare';};w.appendChild(b);});lib.appendChild(w);});
 function placeAt(hit){const o=placing.fn();o.userData.acc=true;o.userData.accName=placing.n;o.userData.kbType=o.userData.type||'generic';if(placing.ric)o.userData.ricetta=placing.ric;else if(o.userData.real)o.userData.ricetta={tipo:'reale',id:o.userData.real};
  const p=hit.point.clone();o.position.copy(p);if(o.userData.type==='tire'){o.position.y=Math.max(p.y,o.userData.R);}
  if(placing.cat==='Carter e coperchi'){const n=hit.face.normal.clone().transformDirection(hit.object.matrixWorld);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),n);o.position.addScaledVector(n,.003);}
  else if(p.z<0&&['Specchietti','Frecce'].includes(placing.cat)){o.scale.z=-1;}
  o.traverse(c=>{if(c.isMesh){c.userData.accPart=o;}});o.addEventListener('ready',()=>{o.traverse(c=>{if(c.isMesh)c.userData.accPart=o;});invalidate();});scene.add(o);added.push(o);undo.push({o,added:1});select(o);advise(o,'aggiunto');
  placing=null;$('placeHint').style.display='none';invalidate();}
 /* montaggio automatico al posto giusto (default) oppure a mano toccando la moto */
 const auto=()=>!!(window.CFG&&ctx.getModel()&&(!$('accAuto')||$('accAuto').checked));
 /* ---------- ricambi 3D reali ---------- */
 {const box=$('realLib'),flt=$('realCat');if(box){let cat='';
  const draw=()=>{box.innerHTML='';PARTS.filter(p=>!cat||p[2]===cat).forEach(([id,n,c,kb,au,u,mis])=>{const d=document.createElement('button');d.className='rp';d.title=n+' – modello di '+au+' (CC BY 4.0)';
    d.innerHTML=`<img src="parts/thumbs/${id}.webp" alt="" loading="lazy"><b>${n}</b><span>${c} · ${mis}</span>`;
    d.onclick=async()=>{const it=CATALOG.find(c=>c.real===id)||{k:'CG-R',real:id,n,cat:c,t:kb};if(auto()){window.CFG.mount(it);return;}
      ctx.toast('Carico «'+n+'»…');let g;try{g=await ctx.loadPart(id);}catch(e){ctx.toast('Impossibile caricare il ricambio');return;}
      placing={n,cat:'Ricambi reali',fn:()=>{const c2=g.clone(true);c2.traverse(x=>{if(x.isMesh){x.castShadow=x.receiveShadow=true;x.material=Array.isArray(x.material)?x.material.map(m=>m.clone()):x.material.clone();}});const o=AG.orienta(id,c2);o.name=n;o.userData.type=kb;o.userData.real=id;return o;}};
      $('placeHint').style.display='block';$('placeHint').textContent='Clicca sulla moto dove montare: '+n+' · poi regolalo con le maniglie · Esc per annullare';};
    box.appendChild(d);});};
  flt.innerHTML='<button class="chip on" data-c="">Tutti</button>'+PART_CATS.map(c=>`<button class="chip" data-c="${c}">${c}</button>`).join('');
  flt.onclick=e=>{const b=e.target.closest('button');if(!b)return;cat=b.dataset.c;flt.querySelectorAll('.chip').forEach(x=>x.classList.toggle('on',x===b));draw();};draw();}}
 /* ---------- miniature generate al volo (articoli del catalogo e famiglie PRO senza immagine) ---------- */
 const TH={r:null,s:null,c:null,cache:new Map(),q:[],busy:false};
 function thumbOf(key,build,img){if(TH.cache.has(key)){img.src=TH.cache.get(key);return;}TH.q.push({key,build,img});if(!TH.busy)thumbNext();}
 function thumbNext(){const it=TH.q.shift();if(!it){TH.busy=false;return;}TH.busy=true;
  if(!it.img.isConnected){setTimeout(thumbNext,0);return;}
  try{if(!TH.r){TH.r=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});TH.r.setPixelRatio(1);TH.r.setSize(176,176);TH.r.toneMapping=THREE.ACESFilmicToneMapping;TH.r.toneMappingExposure=1.1;
     TH.s=new THREE.Scene();const pm=new THREE.PMREMGenerator(TH.r);TH.s.environment=pm.fromScene(new RoomEnvironment(),.04).texture;const L=new THREE.DirectionalLight(0xffffff,1.4);L.position.set(1,2,1.4);TH.s.add(L);TH.c=new THREE.PerspectiveCamera(26,1,.01,50);}
   const o=it.build();TH.s.add(o);const b=new THREE.Box3().setFromObject(o),C=b.getCenter(new THREE.Vector3()),z=b.getSize(new THREE.Vector3()).length()||1;
   TH.c.position.copy(C).add(new THREE.Vector3(z*1.05,z*.55,z*1.2));TH.c.lookAt(C);TH.r.setClearColor(0x000000,0);TH.r.render(TH.s,TH.c);const u=TH.r.domElement.toDataURL('image/webp',.82);TH.cache.set(it.key,u);it.img.src=u;
   TH.s.remove(o);o.traverse(m=>{if(m.geometry)m.geometry.dispose();});}catch(e){console.error('miniatura',it.key,e&&e.message);}
  setTimeout(thumbNext,16);}
 /* ---------- catalogo accessori: oltre 2.000 articoli con codice ---------- */
 {const box=$('catGrid'),flt=$('catCats'),q=$('catQ'),pg=$('catPager'),cnt=$('catCount');if(box){let cat='',page=0,list=CATALOG;const PER=24;
  /* vernice della carrozzeria della moto (serbatoio per primo): i ricambi verniciati la prendono uguale, finitura compresa */
  const vernMoto=()=>{const ps=[...ctx.getParts().values()].filter(p=>p.cat==='Carrozzeria e verniciatura'&&p.cur&&!p.cur.map&&p.cur.color);if(!ps.length)return null;
    const t=ps.find(p=>(p.cur.userData&&p.cur.userData.ruolo==='serbatoio')||/serbatoio|tank/i.test(p.name))||ps[0];return t.cur;};
  const VERN=/^(serbatoio|parafango_ant|parafango_post|fianchetti|carena)$/;
  const place=(it,mano)=>{if(!mano&&auto()){window.CFG.mount(it);return;}if(it.real){ctx.toast('Carico «'+it.n+'»…');ctx.loadPart(it.real).then(g=>{placing={n:it.n,cat:'Ricambi reali',fn:()=>{const c2=g.clone(true);const vm=vernMoto();c2.traverse(x=>{if(x.isMesh){x.castShadow=x.receiveShadow=true;x.material=Array.isArray(x.material)?x.material.map(m=>m.clone()):x.material.clone();
      if(vm&&!Array.isArray(x.material)&&VERN.test((x.material.userData&&x.material.userData.ruolo)||'')){const m0=x.material,m=vm.clone();m.name=m0.name;m.userData={...m0.userData,colore:'#'+vm.color.getHexString()};x.material=m;}
      if(!Array.isArray(x.material)&&x.material.normalMap&&!x.geometry.attributes.uv&&window.__uvCubo)window.__uvCubo(x);}});const o2=AG.orienta(it.real,c2);o2.name=it.n;o2.userData.type=it.t;o2.userData.real=it.real;return o2;}};
      $('placeHint').style.display='block';$('placeHint').textContent='Clicca sulla moto dove montare: '+it.n+' · Esc per annullare';}).catch(()=>ctx.toast('Impossibile caricare il ricambio'));return;}
    placing={n:it.n,cat:it.cat,fn:()=>{const o=buildPro(it.id,it.o);o.userData.code=it.k;return o;}};$('placeHint').style.display='block';$('placeHint').textContent='Clicca sulla moto dove montare: '+it.k+' · '+it.n+' · poi in Officina regoli misure, colori e finiture · Esc per annullare';};
  window.__cgPlace=it=>place(it,true);const draw=()=>{list=searchCatalog(q.value,cat);const np=Math.max(1,Math.ceil(list.length/PER));page=Math.min(page,np-1);cnt.textContent=list.length+' articoli'+(list.length>PER?' · pagina '+(page+1)+' di '+np:'');box.innerHTML='';
    list.slice(page*PER,(page+1)*PER).forEach(it=>{const b=document.createElement('button');b.className='rp';b.title=it.k+' – '+it.n+(it.b?' · tipologia prodotta da: '+it.b:'')+(it.au?' · modello di '+it.au+' (CC BY 4.0)':'');
      b.innerHTML=`<img alt="" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"><b>${it.n}</b><span>${it.k} · ${it.cat}</span>`;const img=b.querySelector('img');
      if(it.real)img.src='parts/thumbs/'+it.real+'.webp';else thumbOf(it.k,()=>buildPro(it.id,it.o),img);b.onclick=()=>place(it);box.appendChild(b);});
    pg.innerHTML=np>1?`<button class="btn sm" data-p="-1" ${page?'':'disabled'}>‹ Indietro</button><button class="btn sm" data-p="1" ${page<np-1?'':'disabled'}>Avanti ›</button>`:'';};
  pg.onclick=e=>{const b=e.target.closest('button');if(!b)return;page+=+b.dataset.p;draw();box.scrollIntoView({block:'nearest'});};
  let tq=0;q.oninput=()=>{clearTimeout(tq);tq=setTimeout(()=>{page=0;draw();},180);};
  flt.innerHTML='<button class="chip on" data-c="">Tutti</button>'+CAT_CATS.map(c=>`<button class="chip" data-c="${c}">${c}</button>`).join('');
  flt.onclick=e=>{const b=e.target.closest('button');if(!b)return;cat=b.dataset.c;page=0;flt.querySelectorAll('.chip').forEach(x=>x.classList.toggle('on',x===b));draw();};draw();}}
 /* ---------- ricambi PRO (modellati e personalizzabili) ---------- */
 function swapObj(a,b){const par=a.parent||scene;par.add(b);par.remove(a);const i=added.indexOf(a);if(i>=0)added[i]=b;else added.push(b);invalidate();}
 {const box=$('proLib'),flt=$('proCat');if(box){let cat='';const cats=[...new Set(PRO_IDS.map(i=>PRO_DEFS[i].cat))];
  const draw=()=>{box.innerHTML='';PRO_IDS.filter(i=>!cat||PRO_DEFS[i].cat===cat).forEach(id=>{const d=PRO_DEFS[id];const b=document.createElement('button');b.className='rp';b.title=d.n+' – tipologia prodotta da: '+d.b;
    b.innerHTML=`<img src="parts/thumbs/pro_${id}.webp" alt="" loading="lazy"><b>${d.n}</b><span>${d.cat} · personalizzabile · catalogo p. ${d.p}</span>`;
    {const img=b.querySelector('img');img.onerror=()=>{img.onerror=null;thumbOf('pro_'+id,()=>buildPro(id),img);};}
    b.onclick=()=>{if(auto()){window.CFG.mount({k:'PRO-'+id,id,n:d.n,cat:d.cat,t:d.type,b:d.b,p:d.p});return;}placing={n:d.n,cat:'Ricambi PRO',fn:()=>buildPro(id)};$('placeHint').style.display='block';$('placeHint').textContent='Clicca sulla moto dove montare: '+d.n+' · poi in Officina scegli misure, colori e finiture · Esc per annullare';};box.appendChild(b);});};
  flt.innerHTML='<button class="chip on" data-c="">Tutti</button>'+cats.map(c=>`<button class="chip" data-c="${c}">${c}</button>`).join('');
  flt.onclick=e=>{const b=e.target.closest('button');if(!b)return;cat=b.dataset.c;flt.querySelectorAll('.chip').forEach(x=>x.classList.toggle('on',x===b));draw();};draw();}}
 function rebuildPro(o,opts){const n=buildPro(o.userData.pro,opts);n.position.copy(o.position);n.quaternion.copy(o.quaternion);n.scale.copy(o.scale);
  const keep={};for(const x of ['item','slot','code','ruota','parteRuota','R','real'])if(o.userData[x]!==undefined)keep[x]=o.userData[x];
  Object.assign(n.userData,keep,{acc:true,accName:o.userData.accName,kbType:o.userData.kbType||n.userData.type,origin:o.userData.origin,slotOv:{...(o.userData.slotOv||{})}});
  n.traverse(c=>{if(c.isMesh){c.userData.accPart=n;}});swapObj(o,n);undo.push({swap:[n,o]});applySlots(n);ctx.onSwap&&ctx.onSwap(o,n);select(n);}
 function renderOpts(o){const box=$('eOpts');if(!box)return;const wrap=$('eOptsWrap');if(!o||!o.userData.pro){wrap.style.display='none';box.innerHTML='';return;}
  wrap.style.display='';const d=PRO_DEFS[o.userData.pro],cur=o.userData.opts;box.innerHTML='';
  d.opts.forEach(x=>{const row=document.createElement('div');row.className='row';const lb=document.createElement('label');lb.textContent=x.l;row.appendChild(lb);let inp;
   if(x.t==='sel'){inp=document.createElement('select');inp.innerHTML=x.o.map(([v,t])=>`<option value="${v}">${t}</option>`).join('');inp.value=cur[x.k];inp.onchange=()=>rebuildPro(o,{...cur,[x.k]:inp.value});}
   else if(x.t==='num'){inp=document.createElement('input');inp.type='range';inp.min=x.min;inp.max=x.max;inp.step=x.step;inp.value=cur[x.k];const v=document.createElement('b');const fmt=val=>x.u==='m'?Math.round(val*1000)+' mm':val+(x.u||'');v.textContent=fmt(cur[x.k]);inp.oninput=()=>v.textContent=fmt(+inp.value);inp.onchange=()=>rebuildPro(o,{...cur,[x.k]:+inp.value});row.appendChild(inp);row.appendChild(v);box.appendChild(row);return;}
   else if(x.t==='col'){inp=document.createElement('input');inp.type='color';inp.value=cur[x.k];inp.onchange=()=>rebuildPro(o,{...cur,[x.k]:inp.value});}
   row.appendChild(inp);box.appendChild(row);});
  const nt=document.createElement('div');nt.className='note';nt.textContent='Tipologia prodotta da: '+d.b+' · catalogo Zodiac p. '+d.p;box.appendChild(nt);}
 /* ---------- colori e finiture di ogni componente di un accessorio ---------- */
 const SLOT_FIN=[['orig','Originale'],...FIN_METAL.filter(f=>f[0]!=='paint'),['anodizzato','Anodizzato a colore'],['vernice','Vernice lucida a colore'],['metallizzato','Vernice metallizzata'],['candy','Candy'],['perlato','Perlato'],['flake','Metal flake'],['opaco','Vernice opaca'],['pelle','Pelle a colore'],['scamosciata','Scamosciato'],['gomma','Gomma']];
 const SKIP=/^(Interno|Fori|LED|Luce targa|Anello LED)$/;
 function slotsOf(o){const M=new Map();let k=0;o.traverse(m=>{if(!m.isMesh)return;(Array.isArray(m.material)?m.material:[m.material]).forEach(mt=>{let n=mt.name;if(!n||/^(material|mat|Material)[._ ]?\d*$/i.test(n)||/^Object|^lambert|^phong|^initialShadingGroup/i.test(n)){n=mt.userData.slotName||(mt.userData.slotName='Materiale '+(++k));}if(SKIP.test(n))return;if(!M.has(n))M.set(n,mt);});});return M;}
 function makeMat(fin,col,name){let m;
  if(['vernice','metallizzato','candy','perlato','flake','opaco'].includes(fin))m=pPaint(col,fin==='vernice'?'lucido':fin,name);
  else if(fin==='pelle'||fin==='scamosciata'){m=pLeather('nero',fin==='pelle'?'liscia':'scamosciata',name,14);m.color.set(col);m.sheenColor=new THREE.Color(col).lerp(new THREE.Color(0xffffff),.35);}
  else if(fin==='gomma')m=new THREE.MeshPhysicalMaterial({name,color:new THREE.Color(col),roughness:.88});
  else if(fin==='anodizzato'){m=pMetal('brushed',name);m.color.set(col);m.roughness=.24;}
  else m=pMetal(fin,name,col);
  m.name=name;return m;}
 function setSlot(o,name,mat){o.traverse(m=>{if(!m.isMesh)return;const fix=mt=>{const nm=mt.userData.slotName||mt.name;return nm===name?mat:mt;};if(Array.isArray(m.material))m.material=m.material.map(fix);else m.material=fix(m.material);});}
 function applySlots(o){const ov=o.userData.slotOv||{};for(const [n,v] of Object.entries(ov))if(v.fin!=='orig')setSlot(o,n,makeMat(v.fin,v.col,n));}
 function renderMats(o){const box=$('eMats');if(!box)return;const wrap=$('eMatsWrap');if(!o||!o.userData.acc){wrap.style.display='none';box.innerHTML='';return;}
  wrap.style.display='';box.innerHTML='';o.userData.slotOv=o.userData.slotOv||{};o.userData.origMats=o.userData.origMats||{};
  for(const [name,mt] of slotsOf(o)){const ov=o.userData.slotOv[name];const row=document.createElement('div');row.className='row mrow';
   const lb=document.createElement('label');lb.textContent=name;lb.title=name;const ci=document.createElement('input');ci.type='color';ci.value=ov?ov.col:'#'+(mt.color?mt.color.getHexString():'888888');
   const fs=document.createElement('select');fs.innerHTML=SLOT_FIN.map(([v,t])=>`<option value="${v}">${t}</option>`).join('');fs.value=ov?ov.fin:'orig';
   const go=()=>{if(!o.userData.origMats[name])o.userData.origMats[name]=mt;let f=fs.value;if(f==='orig'){setSlot(o,name,o.userData.origMats[name]);delete o.userData.slotOv[name];invalidate();return;}
     o.userData.slotOv[name]={fin:f,col:ci.value};setSlot(o,name,makeMat(f,ci.value,name));invalidate();};
   ci.oninput=()=>{if(fs.value==='orig'||['chrome','blackchrome','gloss','satin','wrinkle','brushed','polished','contrast','gold','brass','copper','raw'].includes(fs.value))fs.value=/Pelle|Cuscino|Cordoncino|Manopole/.test(name)?'pelle':'vernice';go();};fs.onchange=go;
   row.append(lb,ci,fs);box.appendChild(row);}}
 /* sostituzione automatica delle gomme della moto */
 $('accTires').onclick=()=>{const m=ctx.getModel();if(!m)return;const kind=$('tireKind').value;const ww=$('tireWW').checked;const tires=[];
  for(const p of ctx.getParts().values())if(p.cat==='Pneumatici'||(/^Ruota /.test(p.cat)&&/^Pneumatico/.test(p.name)))p.meshes.forEach(([o])=>tires.push(o));if(!tires.length){ctx.toast('Non trovo le gomme in questo modello');return;}
  const box=new THREE.Box3();tires.forEach(o=>box.expandByObject(o));const s=box.getSize(new THREE.Vector3()),c=box.getCenter(new THREE.Vector3());
  const R=s.y/2,len=s.x;const centers=[new THREE.Vector3(box.min.x+R,R+box.min.y,c.z),new THREE.Vector3(box.max.x-R,R+box.min.y,c.z)];
  tires.forEach(o=>{pushUndo(o);o.visible=false;});
  centers.forEach((cc,i)=>{const to={kind,whitewall:ww,rimIn:16,width:i===0?.16:.13,aspect:.75},t=ACC.tire(to);t.userData.ricetta={tipo:'gomma',o:to};const k=R/t.userData.R;t.scale.setScalar(k);t.position.copy(cc);t.userData.acc=true;t.userData.accName='Pneumatico '+(i===0?'posteriore':'anteriore');t.userData.kbType='tire';t.traverse(c=>{if(c.isMesh)c.userData.accPart=t;});scene.add(t);added.push(t);undo.push({o:t,added:1});});
  advise({userData:{kbType:'tire'}},'modificato');invalidate();};

 $('accWheels').onclick=()=>{const m=ctx.getModel();if(!m)return;const hideCats=['Pneumatici','Cerchi'];const hid=[],tires=[];
  for(const p of ctx.getParts().values()){const wr=/^Ruota /.test(p.cat);if(p.cat==='Pneumatici'||(wr&&/^Pneumatico/.test(p.name)))p.meshes.forEach(([o])=>tires.push(o));if(hideCats.includes(p.cat)||wr||/spoke|raggi/i.test(p.name))p.meshes.forEach(([o])=>{if(!o.userData.vuoto)hid.push(o);});}
  if(!tires.length){ctx.toast('Non trovo le ruote in questo modello');return;}
  const box=new THREE.Box3();tires.forEach(o=>box.expandByObject(o));const sz=box.getSize(new THREE.Vector3()),c=box.getCenter(new THREE.Vector3());const R=sz.y/2;
  hid.forEach(o=>{pushUndo(o);o.visible=false;});
  [[box.min.x+R,.17],[box.max.x-R,.12]].forEach(([x,w],i)=>{const wo={style:$('whStyle').value,finish:$('whFin').value,whitewall:$('whWW').checked,tireKind:$('whWW').checked?'firestone':'road',width:w,rimIn:i?18:17},wh=ACC.wheel(wo);wh.userData.ricetta={tipo:'ruota',o:wo};
   wh.scale.setScalar(R/wh.userData.R);wh.position.set(x,R+box.min.y,c.z);wh.userData.acc=true;wh.userData.accName='Ruota '+(i?'anteriore':'posteriore');wh.userData.kbType='wheel';
   const tag=()=>wh.traverse(q=>{if(q.isMesh)q.userData.accPart=wh;});tag();wh.addEventListener('ready',()=>{tag();invalidate();});scene.add(wh);added.push(wh);undo.push({o:wh,added:1});});
  advise({userData:{kbType:'wheel'}},'modificato');invalidate();};
 /* ---------- costruttore scarico ---------- */
 const pipes=[];
 $('pStart').onclick=()=>{building={pts:[]};$('placeHint').style.display='block';$('placeHint').textContent='Clicca sulla testata (uscita scarico), poi i punti del percorso; «Termina» per creare il silenziatore · Esc annulla';};
 $('pEnd').onclick=()=>{if(!building||building.pts.length<2){ctx.toast('Servono almeno due punti');return;}const P={pts:building.pts.map(p=>p.clone()),handles:[]};building=null;$('placeHint').style.display='none';makePipe(P);pipes.push(P);};
 function opts(){return {r:+$('pR').value/1000,mufR:+$('pMR').value/1000,mufLen:+$('pML').value/1000,tip:$('pTip').value,mat:$('pMat').value,muffler:$('pMuf').checked};}
 function makePipe(P){if(P.obj){scene.remove(P.obj);P.obj.traverse(c=>c.geometry&&c.geometry.dispose());}
  if(!P.opz)P.opz=opts();const o=ACC.pipe({pts:P.pts,...P.opz});o.userData={acc:true,accName:'Scarico custom',kbType:'exhaust',pipe:P};o.traverse(c=>{if(c.isMesh)c.userData.accPart=o;});scene.add(o);P.obj=o;if(!added.includes(o))added.push(o);
  if(!P.handles.length)P.pts.forEach((p,i)=>{const h=new THREE.Mesh(new THREE.SphereGeometry(.012,16,12),new THREE.MeshBasicMaterial({color:0xe3a63b,depthTest:false}));h.renderOrder=9;h.position.copy(p);h.userData={handleOf:P,idx:i};h.visible=$('pHandles').checked;scene.add(h);P.handles.push(h);});
  invalidate();}
 function rebuildPipe(P,live){P.handles.forEach((h,i)=>P.pts[i].copy(h.position));if(live&&P._t)return;P._t=setTimeout(()=>{P._t=null;makePipe(P);},live?60:0);}
 $('pHandles').onchange=()=>{pipes.forEach(P=>P.handles.forEach(h=>h.visible=$('pHandles').checked));invalidate();};
 for(const id of ['pR','pMR','pML','pTip','pMat','pMuf'])$(id).oninput=$(id).onchange=()=>{const P=sel&&sel.userData.pipe||pipes[pipes.length-1];if(P){P.opz=opts();makePipe(P);ctx.modificato&&ctx.modificato();}};
 const dots=[];
 function addPoint(hit){const n=hit.face?hit.face.normal.clone().transformDirection(hit.object.matrixWorld):new THREE.Vector3(0,0,1);const p=hit.point.clone().addScaledVector(n,+$('pR').value/1000+.012);building.pts.push(p);
  const d=new THREE.Mesh(new THREE.SphereGeometry(.01,12,8),new THREE.MeshBasicMaterial({color:0xe3a63b,depthTest:false}));d.renderOrder=9;d.position.copy(p);scene.add(d);dots.push(d);setTimeout(()=>{scene.remove(d);invalidate();},8000);invalidate();}

 /* ---------- clic sulla scena ---------- */
 function handleClick(hit,active){
  if(placing){if(hit)placeAt(hit);return true;}
  if(building){if(hit)addPoint(hit);return true;}
  if(TOOL==='sel')return false; // «Seleziona»: tocchi e Gruppo della configurazione, nessuna maniglia
  if(!hit){select(null);ctx.cfgSelect&&ctx.cfgSelect(null);setTool('sel');ctx.toast('Selezione: tocca un pezzo per selezionarlo (Gruppo per il componente intero)');return true;}
  const o=hit.object;if(o.userData.handleOf){select(o);return true;}
  inClick=true;try{
   if(o.userData.accPart){ctx.cfgSelectAcc&&ctx.cfgSelectAcc(o.userData.accPart);select(o.userData.accPart);return true;}
   if(ctx.cfgSelectAt){ctx.cfgSelectAt(hit);if(mode==='mesh'&&ctx.cfgSelectComp)ctx.cfgSelectComp();const t=bersaglio(ctx.cfgSel&&ctx.cfgSel());select(t||extract(o,hit.faceIndex));}
   else if(mode==='piece'){select(extract(o,hit.faceIndex));}else select(componenteDi(o,hit.faceIndex));
  }finally{inClick=false;}return true;}
 addEventListener('keydown',e=>{if(e.key==='Escape'){if(placing||building){placing=null;building=null;$('placeHint').style.display='none';}else if(TOOL!=='sel')setTool('sel');}
  if(document.activeElement&&/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName))return;
  if(e.key==='Delete'&&sel)$('eDel').click();if((e.ctrlKey||e.metaKey)&&e.key==='z')$('eUndo').click();if(e.ctrlKey||e.metaKey||e.altKey)return;
  if(e.key==='g')setTool('translate');if(e.key==='r')setTool('rotate');if(e.key==='s')setTool('scale');if(e.key==='q')setTool('sel');});
 /* barra degli strumenti sulla vista */
 document.querySelectorAll('#tools [data-tool]').forEach(b=>b.onclick=()=>{setTool(b.dataset.tool);if(b.dataset.tool==='sel')ctx.toast('Selezione: tocca un pezzo · «Gruppo» per il componente intero · nessuna maniglia');});
 {const f=$('tFine');if(f){f.style.display='none';f.onclick=()=>{setTool('sel');ctx.toast('Fatto: torni alla selezione dei pezzi, senza maniglie');};}}
 {const c=$('tCal');if(c){c.classList.toggle('on',CAL.attiva);c.onclick=()=>{CAL.attiva=!CAL.attiva;c.classList.toggle('on',CAL.attiva);ctx.toast(CAL.attiva?'Punti di aggancio attivi: trascinando, il pezzo si aggancia a centri, facce, assi ruota e mezzeria':'Punti di aggancio spenti: spostamento libero');};}}
 /* ---------- aggancio rapido ---------- */
 function spostaMondo(o,d){const par=o.parent;if(!par){o.position.add(d);return;}par.updateMatrixWorld(true);const a=par.worldToLocal(new THREE.Vector3()),b=par.worldToLocal(d.clone());o.position.add(b.sub(a));o.updateMatrixWorld(true);}
 const AGG={
  posto:o=>{if(window.CFG&&window.CFG.riaggancia&&window.CFG.riaggancia(o)){ctx.toast('Rimesso al posto giusto: stessa posizione, inclinazione e misura del pezzo di serie');return true;}ctx.toast('Il posto automatico c\'è per i ricambi reali montati dal catalogo; per gli altri usa i punti di aggancio');return false;},
  mezzeria:o=>{const c=new THREE.Box3().setFromObject(o).getCenter(new THREE.Vector3());spostaMondo(o,new THREE.Vector3(0,0,-c.z));ctx.toast('Centrato sulla mezzeria della moto');return true;},
  terra:o=>{const M=ctx.getModel();if(!M)return false;const g=new THREE.Box3().setFromObject(M).min.y,b=new THREE.Box3().setFromObject(o);spostaMondo(o,new THREE.Vector3(0,g-b.min.y,0));ctx.toast('Appoggiato a terra');return true;},
  gira:o=>{const c0=centerOf(o);o.rotateOnWorldAxis(new THREE.Vector3(0,1,0),Math.PI);keepCenter(o,c0);ctx.toast('Verso invertito: davanti ↔ dietro');return true;},
  dritto:o=>{const e=new THREE.Euler().setFromQuaternion(o.getWorldQuaternion(new THREE.Quaternion()));const r=x=>Math.round(x/(Math.PI/2))*(Math.PI/2);const qw=new THREE.Quaternion().setFromEuler(new THREE.Euler(r(e.x),r(e.y),r(e.z)));
   const c0=centerOf(o);const pq=o.parent?o.parent.getWorldQuaternion(new THREE.Quaternion()):new THREE.Quaternion();o.quaternion.copy(pq.invert().multiply(qw));keepCenter(o,c0);ctx.toast('Raddrizzato sugli assi della moto');return true;}};
 document.querySelectorAll('[data-agg]').forEach(b=>b.onclick=()=>{if(!need()){ctx.toast('Seleziona prima un pezzo');return;}pushUndo(sel);if(AGG[b.dataset.agg](sel)){syncScale();invalidate();ctx.modificato&&ctx.modificato();}});

 /* ---------- rotazioni esatte e capovolgimento attorno al centro del pezzo, sui suoi assi ---------- */
 const AX={x:new THREE.Vector3(1,0,0),y:new THREE.Vector3(0,1,0),z:new THREE.Vector3(0,0,1)};
 /* perno di rotazione e scala: asse ruota per i pezzi delle ruote (pivotL, coordinate locali), altrimenti il centro del pezzo */
 function centerOf(o){if(o.userData&&o.userData.pivotL){o.updateMatrixWorld(true);return o.localToWorld(o.userData.pivotL.clone());}const b=new THREE.Box3().setFromObject(o);return b.isEmpty()?o.getWorldPosition(new THREE.Vector3()):b.getCenter(new THREE.Vector3());}
 function keepCenter(o,c0){o.updateMatrixWorld(true);const c1=centerOf(o);const d=c0.sub(c1);if(o.parent){const inv=new THREE.Matrix4().copy(o.parent.matrixWorld).invert();const p0=o.position.clone().applyMatrix4(o.parent.matrixWorld);p0.add(d);o.position.copy(p0.applyMatrix4(inv));}else o.position.add(d);o.updateMatrixWorld(true);}
 function exactRotate(axis,deg){if(!need()){ctx.toast('Seleziona prima un pezzo');return;}if(!deg)return;pushUndo(sel);const c0=centerOf(sel);
  const sp=$('eAxSpace')?$('eAxSpace').value:'own';
  if(sp==='own')sel.rotateOnAxis(AX[axis],deg*Math.PI/180);
  else{const q=new THREE.Quaternion().setFromAxisAngle(AX[axis],deg*Math.PI/180);const pq=sel.parent?sel.parent.getWorldQuaternion(new THREE.Quaternion()):new THREE.Quaternion();
   const wq=sel.getWorldQuaternion(new THREE.Quaternion());const nw=q.multiply(wq);sel.quaternion.copy(pq.invert().multiply(nw));}
  keepCenter(sel,c0);advise(sel,'ruotato di '+deg+'°');syncScale();invalidate();ctx.toast('Pezzo ruotato di '+deg+'° sull\'asse '+({x:'longitudinale',y:'verticale',z:'trasversale'})[axis]);}
 function flip(axis){if(!need()){ctx.toast('Seleziona prima un pezzo');return;}pushUndo(sel);const c0=centerOf(sel);sel.scale[axis]*=-1;keepCenter(sel,c0);advise(sel,'capovolto');syncScale();invalidate();
  ctx.toast(({z:'Pezzo specchiato orizzontalmente (destra ↔ sinistra)',y:'Pezzo capovolto verticalmente (sopra ↔ sotto)',x:'Pezzo specchiato avanti ↔ indietro'})[axis]);}
 document.querySelectorAll('[data-rot]').forEach(b=>b.onclick=()=>exactRotate($('eAxis').value,+b.dataset.rot));
 document.querySelectorAll('[data-flip]').forEach(b=>b.onclick=()=>flip(b.dataset.flip));
 document.querySelectorAll('[data-rx]').forEach(b=>b.onclick=()=>exactRotate(b.dataset.rx,(+b.dataset.dir)*(+$('eStep').value||5)));
 document.querySelectorAll('[data-scl]').forEach(b=>b.onclick=()=>{if(!need()){ctx.toast('Seleziona prima un pezzo');return;}pushUndo(sel);const c0=centerOf(sel);sel.scale.multiplyScalar(+b.dataset.scl);sel.updateMatrixWorld(true);keepCenter(sel,c0);syncScale();ctx.invalidate&&ctx.invalidate();});
 $('eRotDeg')&&($('eRotGo').onclick=()=>exactRotate($('eAxis').value,+$('eRotDeg').value||0));
 const snapSet=()=>{const v=+$('eSnap').value;tc.setRotationSnap(v?v*Math.PI/180:null);tc.setTranslationSnap(v?0.005:null);};$('eSnap').onchange=snapSet;snapSet();
 /* ---------- vernice del singolo pezzo ---------- */
 $('ePFin').innerHTML=ctx.FIN.filter(f=>f[0]!=='orig').map(([v,l])=>`<option value="${v}">${l}</option>`).join('');
 $('ePApply').onclick=()=>{if(!need()){ctx.toast('Seleziona prima un pezzo');return;}const col=$('ePColor').value,f=$('ePFin').value;
  const paint=(m0)=>{const m=new THREE.MeshPhysicalMaterial({name:(m0.name||'pezzo')+' (custom)',color:new THREE.Color(col),normalMap:m0.normalMap||null,side:m0.side,transparent:m0.transparent,opacity:m0.opacity});Object.assign(m,ctx.finishParams(f));m.userData.mod=1;m.userData.fin=f;return m;};
  const uv=c=>{if(c.material&&c.material.normalMap&&window.__uvCubo)window.__uvCubo(c);};
  if(sel.isMesh){if(!Array.isArray(sel.material)){sel.material=paint(sel.material);uv(sel);}}
  else sel.traverse(c=>{if(c.isMesh&&!Array.isArray(c.material)&&!/Lente|LED|Gomma|Vetro|Parabola|Fascia|Policarbonato/.test(c.material.name||'')&&!/^(gomma|vetro|fanale|frecce|manopole|pedane|sella)$/.test((c.material.userData&&c.material.userData.ruolo)||'')){c.material=paint(c.material);uv(c);}});
  invalidate();ctx.modificato&&ctx.modificato();};
 /* ---------- copia / incolla tra moto ---------- */
 const clip=[];
 $('eCopy').onclick=()=>{if(!need()){ctx.toast('Seleziona prima un pezzo');return;}let o;if(sel.isMesh){const gc=sel.geometry.clone();gc.computeBoundingBox();const cc=gc.boundingBox.getCenter(new THREE.Vector3());gc.translate(-cc.x,-cc.y,-cc.z);const m=new THREE.Mesh(gc,Array.isArray(sel.material)?sel.material.map(x=>x.clone()):sel.material.clone());
   const wp=new THREE.Vector3(),wq=new THREE.Quaternion(),ws=new THREE.Vector3();sel.matrixWorld.decompose(wp,wq,ws);m.quaternion.copy(wq);m.scale.copy(ws);o=new THREE.Group();o.add(m);}
  else o=sel.clone(true);const nm=$('eName').textContent;clip.push({n:nm,o,kb:sel.userData.kbType||'generic'});$('eClipN').textContent=clip.length+' pezzi negli appunti';
  const L=$('clipLib');L.innerHTML='';clip.forEach((c,i)=>{const b=document.createElement('button');b.className='chip';b.textContent=c.n;b.onclick=()=>{placing={n:c.n,cat:'Copiati',ric:{tipo:'copia'},fn:()=>{const g=c.o.clone(true);g.traverse(x=>{if(x.isMesh){x.castShadow=x.receiveShadow=true;}});g.userData={type:c.kb};return g;}};$('placeHint').style.display='block';$('placeHint').textContent='Clicca sulla moto dove montare: '+c.n+' · Esc per annullare';};L.appendChild(b);});
  ctx.toast('Copiato negli appunti: '+nm);};
 return {swapSel:o=>{if(o&&inScena(o))select(o);else select(null);},centraAsse,handleClick,thumbOf,placeItem:it=>window.__cgPlace&&window.__cgPlace(it),edit:o=>{select(o);},reset(){select(null);setTool('sel',true);added.forEach(a=>scene.remove(a));added=[];pipes.length=0;undo=[];},isBusy:()=>!!(placing||building),tc,
  setTool,tool:()=>TOOL,adopt,need,bersaglio,calamita:CAL,added:()=>added,pipes:()=>pipes,makePipe:P=>{makePipe(P);pipes.push(P);},
  segnaRicetta:(o,r)=>{o.userData.ricetta=r;},ACCLIB:ACC.CATALOG,ACCFN:{tire:ACC.tire,wheel:ACC.wheel},
  pernoDa:(objs,nome)=>perno(objs,nome),applicaSlot:o=>applySlots(o),
  registraAccessorio:o=>{o.traverse(c=>{if(c.isMesh)c.userData.accPart=o;});if(!added.includes(o))added.push(o);if(o.userData.pipe&&!pipes.includes(o.userData.pipe))pipes.push(o.userData.pipe);},
  creaPipe:P=>{makePipe(P);return P.obj;}};
}
