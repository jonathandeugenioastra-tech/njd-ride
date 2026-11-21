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
function adviceHTML(k,az){let h=advBase(k,az);const d=window.__techFor&&window.__techFor();const f=KB2TORQ[k];
 if(d&&f){const t=techHTML(d,f);if(/<table/.test(t))h+='<div class="h">Coppie e dati ufficiali per questo modello</div>'+t.replace(/<div class="tfam">[\s\S]*?<\/div><div class="note">[\s\S]*?<\/div>/,'');}
 const m=marketFor(k);if(m.length)h+='<div class="h">Sul mercato</div>'+m.map(x=>`<p>${x[2]} · <a href="${MARKET_URL}${x[1]}" target="_blank" rel="noopener">catalogo p. ${x[1]}</a></p>`).join('');return h;}

export function initOfficina(ctx){
 const {scene,camera,renderer,controls,invalidate,$}=ctx;
 const tc=new TransformControls(camera,renderer.domElement);tc.setSize(.85);scene.add(tc);
 tc.addEventListener('dragging-changed',e=>{controls.enabled=!e.value;if(e.value&&sel)pushUndo(sel);if(!e.value&&sel){advise(sel,'modificato');if(sel.userData.handleOf)rebuildPipe(sel.userData.handleOf);}});
 tc.addEventListener('objectChange',()=>{if(sel&&sel.userData.handleOf)rebuildPipe(sel.userData.handleOf,true);invalidate();syncScale();});
 tc.addEventListener('change',invalidate);
 let sel=null,undo=[],added=[],mode='piece',placing=null,building=null;
 const typeSel=$('eType');typeSel.innerHTML=Object.entries(TIPI).map(([k,t])=>`<option value="${k}">${t.n}</option>`).join('');

 /* ---------- isole: pezzi fisicamente separati dentro una mesh ---------- */
 function islands(mesh){if(mesh.userData.isl)return mesh.userData.isl;let g=mesh.geometry;if(mesh.userData.zone){if(g.index){g=g.toNonIndexed();mesh.geometry.dispose();mesh.geometry=g;}return mesh.userData.isl=new Int32Array(g.attributes.position.count/3);}if(g.index){g=g.toNonIndexed();mesh.geometry.dispose();mesh.geometry=g;}
  const p=g.attributes.position.array,nT=p.length/9,par=new Int32Array(nT);for(let i=0;i<nT;i++)par[i]=i;
  const f=i=>{while(par[i]!==i){par[i]=par[par[i]];i=par[i];}return i;};const map=new Map();
  for(let v=0;v<p.length/3;v++){const k=(Math.round(p[v*3]*4000)*73856093)^(Math.round(p[v*3+1]*4000)*19349663)^(Math.round(p[v*3+2]*4000)*83492791);const t=(v/3)|0;const o=map.get(k);if(o===undefined)map.set(k,t);else{const a=f(o),b=f(t);if(a!==b)par[a]=b;}}
  const r=new Int32Array(nT);for(let i=0;i<nT;i++)r[i]=f(i);return mesh.userData.isl=r;}
 function subGeo(g,keep){const out=new THREE.BufferGeometry();const nT=keep.length;
  for(const [n,a] of Object.entries(g.attributes)){const s=a.itemSize,arr=new a.array.constructor(nT*3*s);let o=0;for(const t of keep){arr.set(a.array.subarray(t*3*s,(t*3+3)*s),o);o+=3*s;}out.setAttribute(n,new THREE.BufferAttribute(arr,s,a.normalized));}
  return out;}
 function extract(mesh,tri){if(Array.isArray(mesh.material))return mesh;const isl=islands(mesh);const root=isl[tri];const keep=[],rest=[];for(let i=0;i<isl.length;i++)(isl[i]===root?keep:rest).push(i);
  if(rest.length===0||keep.length/isl.length>.95)return mesh;
  const g=mesh.geometry;const ng=subGeo(g,keep),rg=subGeo(g,rest);mesh.geometry=rg;mesh.userData.isl=null;g.dispose();
  ng.computeBoundingBox();const c=ng.boundingBox.getCenter(new THREE.Vector3());ng.translate(-c.x,-c.y,-c.z);
  const m=new THREE.Mesh(ng,mesh.material);m.castShadow=m.receiveShadow=true;m.position.copy(mesh.position).add(c.clone().multiply(mesh.scale).applyQuaternion(mesh.quaternion));m.quaternion.copy(mesh.quaternion);m.scale.copy(mesh.scale);
  m.userData.piece=true;m.userData.origin={p:m.position.clone(),q:m.quaternion.clone(),s:m.scale.clone()};m.name=(mesh.material.name||'pezzo');mesh.parent.add(m);ctx.registerMesh(m);return m;}

 /* ---------- selezione ---------- */
 function select(o){sel=o;if(o){tc.attach(o);tc.setMode($('eMode').value);if(!o.userData.origin)o.userData.origin={p:o.position.clone(),q:o.quaternion.clone(),s:o.scale.clone()};
   const nm=o.userData.accName||ctx.nice(o.material&&!Array.isArray(o.material)?o.material.name:o.name||'pezzo');$('eName').textContent=nm;
   const k=o.userData.kbType||guessType((o.material&&o.material.name||'')+' '+(o.name||''),ctx.catOfMesh(o));o.userData.kbType=k;typeSel.value=k;$('eAdv').innerHTML=adviceHTML(k,'info');syncScale();}
  else{tc.detach();$('eName').textContent='Clicca un pezzo sulla moto';}renderOpts(o);renderMats(o);invalidate();}
 function syncScale(){if(!sel)return;for(const a of ['x','y','z']){$('es'+a).value=Math.abs(sel.scale[a]/(sel.userData.origin?sel.userData.origin.s[a]:1));$('os'+a).textContent=Math.round($('es'+a).value*100)+'%';}}
 for(const a of ['x','y','z'])$('es'+a).oninput=e=>{if(!sel)return;if(!e.target._u){pushUndo(sel);e.target._u=1;setTimeout(()=>e.target._u=0,600);}const s0=sel.userData.origin.s;const sg=b=>Math.sign(sel.scale[b]/s0[b])||1;sel.scale[a]=s0[a]*(+e.target.value)*sg(a);
   if($('eLock').checked){for(const b of ['x','y','z'])if(b!==a)sel.scale[b]=s0[b]*(+e.target.value)*sg(b);}syncScale();invalidate();};
 $('eMode').onchange=()=>tc.setMode($('eMode').value);
 typeSel.onchange=()=>{if(sel){sel.userData.kbType=typeSel.value;$('eAdv').innerHTML=adviceHTML(typeSel.value,'info');}};
 function advise(o,az){const k=o.userData.kbType||'generic';$('eAdv').innerHTML=adviceHTML(k,az);ctx.toast(`${az==='rimosso'?'Rimosso':az==='aggiunto'?'Aggiunto':'Modificato'}: ${TIPI[k].n} — consigli nella scheda Officina 3D`);}
 function pushUndo(o){undo.push({o,p:o.position.clone(),q:o.quaternion.clone(),s:o.scale.clone(),v:o.visible,par:o.parent});if(undo.length>200)undo.shift();}
 $('eDel').onclick=()=>{if(!sel)return;pushUndo(sel);sel.visible=false;advise(sel,'rimosso');tc.detach();sel=null;invalidate();};
 $('eDup').onclick=()=>{if(!sel)return;const c=sel.clone();c.userData={...sel.userData,origin:null};c.position.z=-c.position.z;c.scale.z*=sel.position.z===0?1:1;sel.parent.add(c);if(!c.userData.acc)ctx.registerMesh(c);undo.push({o:c,v:false,p:c.position.clone(),q:c.quaternion.clone(),s:c.scale.clone(),par:null,added:1});select(c);};
 $('eReset').onclick=()=>{if(!sel||!sel.userData.origin)return;pushUndo(sel);const o=sel.userData.origin;sel.position.copy(o.p);sel.quaternion.copy(o.q);sel.scale.copy(o.s);sel.visible=true;syncScale();invalidate();};
 $('eUndo').onclick=()=>{const u=undo.pop();if(!u)return;if(u.swap){swapObj(u.swap[0],u.swap[1]);select(u.swap[1]);return;}if(u.added){u.o.parent&&u.o.parent.remove(u.o);if(sel===u.o)select(null);invalidate();return;}u.o.position.copy(u.p);u.o.quaternion.copy(u.q);u.o.scale.copy(u.s);u.o.visible=u.v;if(sel===u.o)syncScale();invalidate();};
 $('eShowAll').onclick=()=>{ctx.getModel()&&ctx.getModel().traverse(o=>{if(o.isMesh)o.visible=true;});added.forEach(a=>a.visible=true);invalidate();};
 $('eMirror').onclick=()=>$('eDup').click();
 $('eSelMode').onchange=e=>mode=e.target.value;

 /* ---------- accessori ---------- */
 const lib=$('accLib');ACC.CATALOG.forEach(([cat,items])=>{const h=document.createElement('div');h.className='group';h.textContent=cat;lib.appendChild(h);const w=document.createElement('div');w.className='chips';
  items.forEach(([n,fn])=>{const b=document.createElement('button');b.className='chip';b.textContent=n;b.onclick=()=>{placing={n,fn,cat};$('placeHint').style.display='block';$('placeHint').textContent='Clicca sulla moto dove montare: '+n+' · Esc per annullare';};w.appendChild(b);});lib.appendChild(w);});
 function placeAt(hit){const o=placing.fn();o.userData.acc=true;o.userData.accName=placing.n;o.userData.kbType=o.userData.type||'generic';
  const p=hit.point.clone();o.position.copy(p);if(o.userData.type==='tire'){o.position.y=Math.max(p.y,o.userData.R);}
  if(placing.cat==='Carter e coperchi'){const n=hit.face.normal.clone().transformDirection(hit.object.matrixWorld);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),n);o.position.addScaledVector(n,.003);}
  else if(p.z<0&&['Specchietti','Frecce'].includes(placing.cat)){o.scale.z=-1;}
  o.traverse(c=>{if(c.isMesh){c.userData.accPart=o;}});o.addEventListener('ready',()=>{o.traverse(c=>{if(c.isMesh)c.userData.accPart=o;});invalidate();});scene.add(o);added.push(o);undo.push({o,added:1});select(o);advise(o,'aggiunto');
  placing=null;$('placeHint').style.display='none';invalidate();}
 /* ---------- ricambi 3D reali ---------- */
 {const box=$('realLib'),flt=$('realCat');if(box){let cat='';
  const draw=()=>{box.innerHTML='';PARTS.filter(p=>!cat||p[2]===cat).forEach(([id,n,c,kb,au,u,mis])=>{const d=document.createElement('button');d.className='rp';d.title=n+' – modello di '+au+' (CC BY 4.0)';
    d.innerHTML=`<img src="parts/thumbs/${id}.webp" alt="" loading="lazy"><b>${n}</b><span>${c} · ${mis}</span>`;
    d.onclick=async()=>{ctx.toast('Carico «'+n+'»…');let g;try{g=await ctx.loadPart(id);}catch(e){ctx.toast('Impossibile caricare il ricambio');return;}
      placing={n,cat:'Ricambi reali',fn:()=>{const o=new THREE.Group();const c2=g.clone(true);c2.traverse(x=>{if(x.isMesh){x.castShadow=x.receiveShadow=true;x.material=Array.isArray(x.material)?x.material.map(m=>m.clone()):x.material.clone();}});o.add(c2);o.name=n;o.userData={type:kb,real:id};return o;}};
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
  const place=it=>{if(it.real){ctx.toast('Carico «'+it.n+'»…');ctx.loadPart(it.real).then(g=>{placing={n:it.n,cat:'Ricambi reali',fn:()=>{const o=new THREE.Group();const c2=g.clone(true);c2.traverse(x=>{if(x.isMesh){x.castShadow=x.receiveShadow=true;x.material=Array.isArray(x.material)?x.material.map(m=>m.clone()):x.material.clone();}});o.add(c2);o.name=it.n;o.userData={type:it.t,real:it.real};return o;}};
      $('placeHint').style.display='block';$('placeHint').textContent='Clicca sulla moto dove montare: '+it.n+' · Esc per annullare';}).catch(()=>ctx.toast('Impossibile caricare il ricambio'));return;}
    placing={n:it.n,cat:it.cat,fn:()=>{const o=buildPro(it.id,it.o);o.userData.code=it.k;return o;}};$('placeHint').style.display='block';$('placeHint').textContent='Clicca sulla moto dove montare: '+it.k+' · '+it.n+' · poi in Officina regoli misure, colori e finiture · Esc per annullare';};
  window.__cgPlace=place;const draw=()=>{list=searchCatalog(q.value,cat);const np=Math.max(1,Math.ceil(list.length/PER));page=Math.min(page,np-1);cnt.textContent=list.length+' articoli'+(list.length>PER?' · pagina '+(page+1)+' di '+np:'');box.innerHTML='';
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
    b.onclick=()=>{placing={n:d.n,cat:'Ricambi PRO',fn:()=>buildPro(id)};$('placeHint').style.display='block';$('placeHint').textContent='Clicca sulla moto dove montare: '+d.n+' · poi in Officina scegli misure, colori e finiture · Esc per annullare';};box.appendChild(b);});};
  flt.innerHTML='<button class="chip on" data-c="">Tutti</button>'+cats.map(c=>`<button class="chip" data-c="${c}">${c}</button>`).join('');
  flt.onclick=e=>{const b=e.target.closest('button');if(!b)return;cat=b.dataset.c;flt.querySelectorAll('.chip').forEach(x=>x.classList.toggle('on',x===b));draw();};draw();}}
 function rebuildPro(o,opts){const n=buildPro(o.userData.pro,opts);n.position.copy(o.position);n.quaternion.copy(o.quaternion);n.scale.copy(o.scale);
  Object.assign(n.userData,{acc:true,accName:o.userData.accName,kbType:o.userData.kbType||n.userData.type,origin:o.userData.origin,slotOv:{...(o.userData.slotOv||{})}});
  n.traverse(c=>{if(c.isMesh){c.userData.accPart=n;}});swapObj(o,n);undo.push({swap:[n,o]});applySlots(n);select(n);}
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
  for(const p of ctx.getParts().values())if(p.cat==='Pneumatici')p.meshes.forEach(([o])=>tires.push(o));if(!tires.length){ctx.toast('Non trovo le gomme in questo modello');return;}
  const box=new THREE.Box3();tires.forEach(o=>box.expandByObject(o));const s=box.getSize(new THREE.Vector3()),c=box.getCenter(new THREE.Vector3());
  const R=s.y/2,len=s.x;const centers=[new THREE.Vector3(box.min.x+R,R+box.min.y,c.z),new THREE.Vector3(box.max.x-R,R+box.min.y,c.z)];
  tires.forEach(o=>{pushUndo(o);o.visible=false;});
  centers.forEach((cc,i)=>{const t=ACC.tire({kind,whitewall:ww,rimIn:16,width:i===0?.16:.13,aspect:.75});const k=R/t.userData.R;t.scale.setScalar(k);t.position.copy(cc);t.userData.acc=true;t.userData.accName='Pneumatico '+(i===0?'posteriore':'anteriore');t.userData.kbType='tire';t.traverse(c=>{if(c.isMesh)c.userData.accPart=t;});scene.add(t);added.push(t);undo.push({o:t,added:1});});
  advise({userData:{kbType:'tire'}},'modificato');invalidate();};

 $('accWheels').onclick=()=>{const m=ctx.getModel();if(!m)return;const hideCats=['Pneumatici','Cerchi'];const hid=[],tires=[];
  for(const p of ctx.getParts().values()){if(p.cat==='Pneumatici')p.meshes.forEach(([o])=>tires.push(o));if(hideCats.includes(p.cat)||/spoke|raggi/i.test(p.name))p.meshes.forEach(([o])=>hid.push(o));}
  if(!tires.length){ctx.toast('Non trovo le ruote in questo modello');return;}
  const box=new THREE.Box3();tires.forEach(o=>box.expandByObject(o));const sz=box.getSize(new THREE.Vector3()),c=box.getCenter(new THREE.Vector3());const R=sz.y/2;
  hid.forEach(o=>{pushUndo(o);o.visible=false;});
  [[box.min.x+R,.17],[box.max.x-R,.12]].forEach(([x,w],i)=>{const wh=ACC.wheel({style:$('whStyle').value,finish:$('whFin').value,whitewall:$('whWW').checked,tireKind:$('whWW').checked?'firestone':'road',width:w,rimIn:i?18:17});
   wh.scale.setScalar(R/wh.userData.R);wh.position.set(x,R+box.min.y,c.z);wh.userData.acc=true;wh.userData.accName='Ruota '+(i?'anteriore':'posteriore');wh.userData.kbType='wheel';
   const tag=()=>wh.traverse(q=>{if(q.isMesh)q.userData.accPart=wh;});tag();wh.addEventListener('ready',()=>{tag();invalidate();});scene.add(wh);added.push(wh);undo.push({o:wh,added:1});});
  advise({userData:{kbType:'wheel'}},'modificato');invalidate();};
 /* ---------- costruttore scarico ---------- */
 const pipes=[];
 $('pStart').onclick=()=>{building={pts:[]};$('placeHint').style.display='block';$('placeHint').textContent='Clicca sulla testata (uscita scarico), poi i punti del percorso; «Termina» per creare il silenziatore · Esc annulla';};
 $('pEnd').onclick=()=>{if(!building||building.pts.length<2){ctx.toast('Servono almeno due punti');return;}const P={pts:building.pts.map(p=>p.clone()),handles:[]};building=null;$('placeHint').style.display='none';makePipe(P);pipes.push(P);};
 function opts(){return {r:+$('pR').value/1000,mufR:+$('pMR').value/1000,mufLen:+$('pML').value/1000,tip:$('pTip').value,mat:$('pMat').value,muffler:$('pMuf').checked};}
 function makePipe(P){if(P.obj){scene.remove(P.obj);P.obj.traverse(c=>c.geometry&&c.geometry.dispose());}
  const o=ACC.pipe({pts:P.pts,...opts()});o.userData={acc:true,accName:'Scarico custom',kbType:'exhaust',pipe:P};o.traverse(c=>{if(c.isMesh)c.userData.accPart=o;});scene.add(o);P.obj=o;if(!added.includes(o))added.push(o);
  if(!P.handles.length)P.pts.forEach((p,i)=>{const h=new THREE.Mesh(new THREE.SphereGeometry(.012,16,12),new THREE.MeshBasicMaterial({color:0xe3a63b,depthTest:false}));h.renderOrder=9;h.position.copy(p);h.userData={handleOf:P,idx:i};h.visible=$('pHandles').checked;scene.add(h);P.handles.push(h);});
  invalidate();}
 function rebuildPipe(P,live){P.handles.forEach((h,i)=>P.pts[i].copy(h.position));if(live&&P._t)return;P._t=setTimeout(()=>{P._t=null;makePipe(P);},live?60:0);}
 $('pHandles').onchange=()=>{pipes.forEach(P=>P.handles.forEach(h=>h.visible=$('pHandles').checked));invalidate();};
 for(const id of ['pR','pMR','pML','pTip','pMat','pMuf'])$(id).oninput=$(id).onchange=()=>{const P=sel&&sel.userData.pipe||pipes[pipes.length-1];if(P)makePipe(P);};
 const dots=[];
 function addPoint(hit){const n=hit.face?hit.face.normal.clone().transformDirection(hit.object.matrixWorld):new THREE.Vector3(0,0,1);const p=hit.point.clone().addScaledVector(n,+$('pR').value/1000+.012);building.pts.push(p);
  const d=new THREE.Mesh(new THREE.SphereGeometry(.01,12,8),new THREE.MeshBasicMaterial({color:0xe3a63b,depthTest:false}));d.renderOrder=9;d.position.copy(p);scene.add(d);dots.push(d);setTimeout(()=>{scene.remove(d);invalidate();},8000);invalidate();}

 /* ---------- clic sulla scena ---------- */
 function handleClick(hit,active){
  if(placing){if(hit)placeAt(hit);return true;}
  if(building){if(hit)addPoint(hit);return true;}
  if(active!=='edit'&&active!=='acc')return false;
  if(!hit){select(null);return true;}
  const o=hit.object;if(o.userData.handleOf){select(o);return true;}if(o.userData.accPart){select(o.userData.accPart);return true;}
  if(mode==='piece'){select(extract(o,hit.faceIndex));}else select(o);return true;}
 addEventListener('keydown',e=>{if(e.key==='Escape'){placing=null;building=null;$('placeHint').style.display='none';}
  if(document.activeElement&&/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName))return;
  if(e.key==='Delete'&&sel)$('eDel').click();if((e.ctrlKey||e.metaKey)&&e.key==='z')$('eUndo').click();if(e.key==='g')$('eMode').value='translate',tc.setMode('translate');if(e.key==='r')$('eMode').value='rotate',tc.setMode('rotate');if(e.key==='s')$('eMode').value='scale',tc.setMode('scale');});

 /* ---------- rotazioni esatte e capovolgimento attorno al centro del pezzo, sui suoi assi ---------- */
 const AX={x:new THREE.Vector3(1,0,0),y:new THREE.Vector3(0,1,0),z:new THREE.Vector3(0,0,1)};
 function centerOf(o){const b=new THREE.Box3().setFromObject(o);return b.isEmpty()?o.getWorldPosition(new THREE.Vector3()):b.getCenter(new THREE.Vector3());}
 function keepCenter(o,c0){o.updateMatrixWorld(true);const c1=centerOf(o);const d=c0.sub(c1);if(o.parent){const inv=new THREE.Matrix4().copy(o.parent.matrixWorld).invert();const p0=o.position.clone().applyMatrix4(o.parent.matrixWorld);p0.add(d);o.position.copy(p0.applyMatrix4(inv));}else o.position.add(d);o.updateMatrixWorld(true);}
 function exactRotate(axis,deg){if(!sel){ctx.toast('Seleziona prima un pezzo');return;}if(!deg)return;pushUndo(sel);const c0=centerOf(sel);
  const sp=$('eAxSpace')?$('eAxSpace').value:'own';
  if(sp==='own')sel.rotateOnAxis(AX[axis],deg*Math.PI/180);
  else{const q=new THREE.Quaternion().setFromAxisAngle(AX[axis],deg*Math.PI/180);const pq=sel.parent?sel.parent.getWorldQuaternion(new THREE.Quaternion()):new THREE.Quaternion();
   const wq=sel.getWorldQuaternion(new THREE.Quaternion());const nw=q.multiply(wq);sel.quaternion.copy(pq.invert().multiply(nw));}
  keepCenter(sel,c0);advise(sel,'ruotato di '+deg+'°');syncScale();invalidate();ctx.toast('Pezzo ruotato di '+deg+'° sull\'asse '+({x:'longitudinale',y:'verticale',z:'trasversale'})[axis]);}
 function flip(axis){if(!sel){ctx.toast('Seleziona prima un pezzo');return;}pushUndo(sel);const c0=centerOf(sel);sel.scale[axis]*=-1;keepCenter(sel,c0);advise(sel,'capovolto');syncScale();invalidate();
  ctx.toast(({z:'Pezzo specchiato orizzontalmente (destra ↔ sinistra)',y:'Pezzo capovolto verticalmente (sopra ↔ sotto)',x:'Pezzo specchiato avanti ↔ indietro'})[axis]);}
 document.querySelectorAll('[data-rot]').forEach(b=>b.onclick=()=>exactRotate($('eAxis').value,+b.dataset.rot));
 document.querySelectorAll('[data-flip]').forEach(b=>b.onclick=()=>flip(b.dataset.flip));
 $('eRotDeg')&&($('eRotGo').onclick=()=>exactRotate($('eAxis').value,+$('eRotDeg').value||0));
 const snapSet=()=>{const v=+$('eSnap').value;tc.setRotationSnap(v?v*Math.PI/180:null);tc.setTranslationSnap(v?0.005:null);};$('eSnap').onchange=snapSet;snapSet();
 /* ---------- vernice del singolo pezzo ---------- */
 $('ePFin').innerHTML=ctx.FIN.filter(f=>f[0]!=='orig').map(([v,l])=>`<option value="${v}">${l}</option>`).join('');
 $('ePApply').onclick=()=>{if(!sel){ctx.toast('Seleziona prima un pezzo');return;}const col=$('ePColor').value,f=$('ePFin').value;
  const paint=(m0)=>{const m=new THREE.MeshPhysicalMaterial({name:(m0.name||'pezzo')+' (custom)',color:new THREE.Color(col),normalMap:m0.normalMap||null,side:m0.side,transparent:m0.transparent,opacity:m0.opacity});Object.assign(m,ctx.finishParams(f));return m;};
  if(sel.isMesh){if(!Array.isArray(sel.material)){sel.material=paint(sel.material);}}
  else sel.traverse(c=>{if(c.isMesh&&!/Lente|LED|Gomma|Vetro|Parabola|Fascia|Policarbonato/.test(c.material.name||''))c.material=paint(c.material);});
  invalidate();};
 /* ---------- copia / incolla tra moto ---------- */
 const clip=[];
 $('eCopy').onclick=()=>{if(!sel){ctx.toast('Seleziona prima un pezzo');return;}let o;if(sel.isMesh){const gc=sel.geometry.clone();gc.computeBoundingBox();const cc=gc.boundingBox.getCenter(new THREE.Vector3());gc.translate(-cc.x,-cc.y,-cc.z);const m=new THREE.Mesh(gc,Array.isArray(sel.material)?sel.material.map(x=>x.clone()):sel.material.clone());
   const wp=new THREE.Vector3(),wq=new THREE.Quaternion(),ws=new THREE.Vector3();sel.matrixWorld.decompose(wp,wq,ws);m.quaternion.copy(wq);m.scale.copy(ws);o=new THREE.Group();o.add(m);}
  else o=sel.clone(true);const nm=$('eName').textContent;clip.push({n:nm,o,kb:sel.userData.kbType||'generic'});$('eClipN').textContent=clip.length+' pezzi negli appunti';
  const L=$('clipLib');L.innerHTML='';clip.forEach((c,i)=>{const b=document.createElement('button');b.className='chip';b.textContent=c.n;b.onclick=()=>{placing={n:c.n,cat:'Copiati',fn:()=>{const g=c.o.clone(true);g.traverse(x=>{if(x.isMesh){x.castShadow=x.receiveShadow=true;}});g.userData={type:c.kb};return g;}};$('placeHint').style.display='block';$('placeHint').textContent='Clicca sulla moto dove montare: '+c.n+' · Esc per annullare';};L.appendChild(b);});
  ctx.toast('Copiato negli appunti: '+nm);};
 return {handleClick,thumbOf,placeItem:it=>window.__cgPlace&&window.__cgPlace(it),edit:o=>{select(o);},reset(){select(null);added.forEach(a=>scene.remove(a));added=[];pipes.length=0;undo=[];},isBusy:()=>!!(placing||building),tc};
}
