/* NJ.D' RIDE – libreria accessori parametrici ad alta risoluzione (misure in metri).
   © 2026 dott. Jonathan D'Eugenio – Tutti i diritti riservati. */
import * as THREE from 'three';
const V=(x,y,z=0)=>new THREE.Vector3(x,y,z),V2=(x,y)=>new THREE.Vector2(x,y);
const SEG=96;
/* ---------- materiali ---------- */
export const M={
 chrome:()=>new THREE.MeshPhysicalMaterial({name:'Cromato',color:0xf2f3f5,metalness:1,roughness:.04}),
 blackchrome:()=>new THREE.MeshPhysicalMaterial({name:'Black chrome',color:0x2a2c31,metalness:1,roughness:.08}),
 alu:()=>new THREE.MeshPhysicalMaterial({name:'Alluminio spazzolato',color:0xc9cbcf,metalness:1,roughness:.28}),
 black:()=>new THREE.MeshPhysicalMaterial({name:'Nero lucido',color:0x0b0b0c,metalness:.1,roughness:.25,clearcoat:1,clearcoatRoughness:.04}),
 satin:()=>new THREE.MeshPhysicalMaterial({name:'Nero satinato',color:0x161618,metalness:.3,roughness:.5}),
 rubber:()=>new THREE.MeshPhysicalMaterial({name:'Gomma',color:0x141414,metalness:0,roughness:.88}),
 white:()=>new THREE.MeshPhysicalMaterial({name:'Fascia bianca',color:0xefece4,metalness:0,roughness:.6}),
 mirror:()=>new THREE.MeshPhysicalMaterial({name:'Vetro specchio',color:0xe9ecef,metalness:1,roughness:.015}),
 lens:()=>new THREE.MeshPhysicalMaterial({name:'Lente faro',color:0xffffff,metalness:0,roughness:.02,transmission:.92,thickness:.004,ior:1.5,transparent:true}),
 reflector:()=>new THREE.MeshPhysicalMaterial({name:'Parabola',color:0xffffff,metalness:1,roughness:.12,emissive:0xfff3d8,emissiveIntensity:.35}),
 led:()=>new THREE.MeshPhysicalMaterial({name:'LED',color:0xffffff,emissive:0xf4f8ff,emissiveIntensity:2.4}),
 amber:()=>new THREE.MeshPhysicalMaterial({name:'Lente ambra',color:0xff9a10,emissive:0xff8a00,emissiveIntensity:.9,roughness:.15,transmission:.3,transparent:true}),
 red:()=>new THREE.MeshPhysicalMaterial({name:'Lente rossa',color:0xd1100c,emissive:0x9a0000,emissiveIntensity:.6,roughness:.15}),
 gold:()=>new THREE.MeshPhysicalMaterial({name:'Anodizzato oro',color:0xd4a23c,metalness:1,roughness:.22}),
 yellow:()=>new THREE.MeshPhysicalMaterial({name:'Molla gialla',color:0xf2c40f,metalness:.3,roughness:.35,clearcoat:1}),
 red2:()=>new THREE.MeshPhysicalMaterial({name:'Molla rossa',color:0xb3121a,metalness:.3,roughness:.35,clearcoat:1}),
 leather:(c=0x3b2416)=>new THREE.MeshPhysicalMaterial({name:'Cuoio',color:c,metalness:0,roughness:.55,sheen:.4,clearcoat:.15}),
 paint:(c=0x7e0b12)=>new THREE.MeshPhysicalMaterial({name:'Verniciato',color:c,metalness:.6,roughness:.25,clearcoat:1,clearcoatRoughness:.02})
};
const mesh=(g,m,name)=>{const o=new THREE.Mesh(g,m);o.name=name||m.name;o.castShadow=o.receiveShadow=true;return o;};
const lathe=(pts,seg=SEG)=>new THREE.LatheGeometry(pts.map(p=>V2(p[0],p[1])),seg);
const cyl=(a,b,r1,r2,m,seg=48,name)=>{const L=a.distanceTo(b);const o=mesh(new THREE.CylinderGeometry(r2??r1,r1,L,seg,1),m,name);o.position.copy(a).lerp(b,.5);o.quaternion.setFromUnitVectors(V(0,1,0),b.clone().sub(a).normalize());return o;};
const tube=(pts,r,m,seg=200,name)=>mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts,false,'centripetal'),seg,r,24,false),m,name);
class Helix extends THREE.Curve{constructor(r,l,t){super();Object.assign(this,{r,l,t});}getPoint(u,o=new THREE.Vector3()){const a=u*Math.PI*2*this.t;return o.set(Math.cos(a)*this.r,u*this.l-this.l/2,Math.sin(a)*this.r);}}
const spring=(r,l,turns,w,m)=>mesh(new THREE.TubeGeometry(new Helix(r,l,turns),turns*48,w,12,false),m,'Molla');
/* ---------- texture battistrada ---------- */
const treadCache={};
function tread(kind){if(treadCache[kind])return treadCache[kind];const W=4096,H=512,c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d');
 g.fillStyle='#808080';g.fillRect(0,0,W,H);g.fillStyle='#000';
 if(kind==='vintage'){for(const y of [.36,.44,.5,.56,.64])g.fillRect(0,H*y-5,W,10);for(let i=0;i<120;i++){const x=i*W/120;for(const yy of [.28,.72]){g.save();g.translate(x,H*yy);g.rotate(Math.PI/4);g.fillRect(-9,-9,18,18);g.restore();}}}
 else if(kind==='knobby'){for(let i=0;i<90;i++){const x=i*W/90;g.fillStyle='#fff';g.fillRect(x+6,H*.22,26,H*.14);g.fillRect(x+24,H*.43,26,H*.14);g.fillRect(x+6,H*.64,26,H*.14);}}
 else if(kind==='road'){for(let i=0;i<140;i++){const x=i*W/140;g.save();g.translate(x,H*.5);g.rotate(.55);g.fillRect(-3,-H*.22,6,H*.2);g.restore();g.save();g.translate(x+W/280,H*.5);g.rotate(-.55);g.fillRect(-3,H*.02,6,H*.2);g.restore();}g.fillRect(0,H*.495,W,8);}
 else if(kind==='firestone'){for(const y of [.3,.38,.46,.54,.62,.7])g.fillRect(0,H*y-6,W,12);}
 g.fillStyle='#808080';g.fillRect(0,0,W,H*.17);g.fillRect(0,H*.83,W,H*.17);
 const t=new THREE.CanvasTexture(c);t.wrapS=THREE.RepeatWrapping;t.anisotropy=16;return treadCache[kind]=t;}
/* ---------- pneumatico completo ---------- */
export function tire({rimIn=16,width=.13,aspect=.8,kind='road',whitewall=false}={}){
 const g=new THREE.Group();g.name='Pneumatico';const rr=rimIn*.0254/2+.012,h=width*aspect,rc=rr+h/2,a=h/2,b=width/2,e=2.4,pts=[];
 for(let i=0;i<=64;i++){const t=-Math.PI*.88+i/64*Math.PI*1.76;const cs=Math.cos(t),sn=Math.sin(t);pts.push([rc+a*Math.sign(cs)*Math.abs(cs)**(2/e),b*Math.sign(sn)*Math.abs(sn)**(2/e)]);}
 const geo=lathe(pts,256);geo.rotateX(Math.PI/2);const m=M.rubber();m.bumpMap=tread(kind);m.bumpScale=kind==='knobby'?8:4;const t=mesh(geo,m,'Pneumatico');g.add(t);
 if(whitewall){for(const z of [-1,1]){const w=mesh(new THREE.RingGeometry(rr+h*.18,rr+h*.62,256,1),M.white(),'Fascia bianca');w.position.z=z*b*.985;if(z<0)w.rotation.y=Math.PI;g.add(w);}}
 g.userData={type:'tire',R:rr+h};return g;}
/* ---------- specchietti ---------- */
export function mirror({style='barend',d=.085}={}){const g=new THREE.Group();g.name='Specchietto';const ch=M.chrome();
 const head=(r,sx=1,sy=1)=>{const h=new THREE.Group();const cup=mesh(lathe([[0,-.022],[r*.6,-.02],[r*.95,-.01],[r,.004],[r*.96,.008]],SEG),ch,'Guscio specchio');cup.rotation.x=Math.PI/2;h.add(cup);
   const gl=mesh(new THREE.CircleGeometry(r*.93,SEG),M.mirror(),'Vetro specchio');gl.position.z=.0075;h.add(gl);h.scale.set(sx,sy,1);return h;};
 if(style==='barend'){const h=head(d/2);h.position.set(0,-.02,.07);g.add(h);g.add(cyl(V(0,0,0),V(0,-.015,.06),.009,.011,ch,32,'Braccio'));g.add(cyl(V(0,0,-.005),V(0,0,.012),.012,.012,ch,32,'Tappo bar-end'));}
 else{const r=style==='rect'?.055:style==='tear'?.05:.045;const sx=style==='rect'?1.45:style==='oval'?1.35:1;const sy=style==='tear'?1.25:1;
   g.add(tube([V(0,0,0),V(0,.06,.01),V(-.01,.16,.04),V(-.015,.22,.06)],.0055,ch,80,'Stelo'));const h=head(r,sx,sy);h.position.set(-.015,.25,.075);h.rotation.y=-Math.PI/2+.25;g.add(h);
   g.add(cyl(V(0,-.01,0),V(0,.015,0),.011,.011,ch,32,'Morsetto'));}
 g.userData={type:'mirror'};return g;}
/* ---------- frecce ---------- */
export function indicator({style='mini',len=.032}={}){const g=new THREE.Group();g.name='Freccia';
 if(style==='mini'){g.add(cyl(V(0,0,0),V(len*.6,0,0),.0055,.0055,M.satin(),32,'Corpo'));const l=mesh(new THREE.SphereGeometry(.0058,32,16,0,Math.PI*2,0,Math.PI/2),M.amber(),'Lente ambra');l.rotation.z=-Math.PI/2;l.position.x=len*.6;g.add(l);g.add(cyl(V(-.012,0,0),V(0,0,0),.0022,.0022,M.satin(),16,'Gambo'));}
 else if(style==='barend'){const r=mesh(new THREE.TorusGeometry(.016,.0035,24,64),M.amber(),'Anello LED ambra');r.rotation.y=Math.PI/2;g.add(r);g.add(cyl(V(-.025,0,0),V(0,0,0),.0145,.016,M.satin(),48,'Corpo bar-end'));}
 else{g.add(mesh(lathe([[0,-.035],[.013,-.03],[.019,-.012],[.02,0]],64).rotateZ(-Math.PI/2),M.chrome(),'Guscio bullet'));const l=mesh(new THREE.SphereGeometry(.0195,48,24,0,Math.PI*2,0,Math.PI/2.6),M.amber(),'Lente ambra');l.rotation.z=-Math.PI/2;g.add(l);g.add(cyl(V(-.06,0,0),V(-.03,0,0),.004,.004,M.chrome(),16,'Gambo'));}
 g.userData={type:'indicator'};return g;}
/* ---------- fari ---------- */
export function headlight({style='vintage7'}={}){const g=new THREE.Group();g.name='Faro';
 const bucket=(R,D,m)=>{const b=mesh(lathe([[0,-D],[R*.55,-D*.93],[R*.9,-D*.55],[R,-D*.08],[R*1.03,0]],SEG),m,'Corpo faro');b.rotation.z=-Math.PI/2;return b;};
 const glass=(R,dome=.012)=>{const l=mesh(new THREE.SphereGeometry(R*1.6,SEG,24,0,Math.PI*2,0,Math.asin(1/1.6)),M.lens(),'Lente');l.rotation.z=-Math.PI/2;l.position.x=-R*1.6*Math.cos(Math.asin(1/1.6))+dome;return l;};
 const refl=(R)=>{const r=mesh(lathe([[0,-R*.55],[R*.5,-R*.35],[R*.95,0]],SEG),M.reflector(),'Parabola');r.rotation.z=-Math.PI/2;r.position.x=-.004;return r;};
 const ring=(R,m)=>{const t=mesh(new THREE.TorusGeometry(R*1.02,.005,24,SEG),m,'Cornice');t.rotation.y=Math.PI/2;return t;};
 if(style==='vintage7'||style==='vintage575'){const R=style==='vintage7'?.089:.073;g.add(bucket(R,.12,M.chrome()),refl(R),glass(R),ring(R,M.chrome()));const bulb=mesh(new THREE.SphereGeometry(.012,24,16),M.led(),'Lampada');bulb.position.x=-.03;g.add(bulb);}
 else if(style==='led'){const R=.089;g.add(bucket(R,.11,M.black()),ring(R,M.black()));const drl=mesh(new THREE.TorusGeometry(R*.86,.006,24,SEG),M.led(),'Anello DRL');drl.rotation.y=Math.PI/2;g.add(drl);
   for(const [y,s] of [[.03,.032],[-.028,.026]]){const p=mesh(new THREE.CylinderGeometry(s,s,.012,64),M.reflector(),'Proiettore LED');p.rotation.z=Math.PI/2;p.position.set(-.004,y,0);g.add(p);const l=mesh(new THREE.CircleGeometry(s*.7,64),M.led(),'Lente LED');l.rotation.y=Math.PI/2;l.position.set(.003,y,0);g.add(l);}g.add(glass(R,.004));}
 else if(style==='bates'){const R=.07;g.add(bucket(R,.13,M.chrome()),refl(R),glass(R),ring(R,M.chrome()));const v=mesh(new THREE.CylinderGeometry(R*1.08,R*1.08,.06,SEG,1,true,-Math.PI/2.2,Math.PI*1.1),M.chrome(),'Visiera');v.material.side=THREE.DoubleSide;v.rotation.z=Math.PI/2;v.position.x=.03;g.add(v);}
 else if(style==='passing'){g.add(cyl(V(0,0,-.2),V(0,0,.2),.009,.009,M.chrome(),32,'Barra'));for(const z of [-.17,.17]){const s=new THREE.Group();const R=.045;s.add(bucket(R,.07,M.chrome()),refl(R),glass(R,.006),ring(R,M.chrome()));s.position.set(.04,.0,z);g.add(s);}}
 else if(style==='quad'){for(const [y,z] of [[.035,-.045],[.035,.045],[-.035,-.045],[-.035,.045]]){const s=new THREE.Group();const R=.036;s.add(bucket(R,.06,M.black()),refl(R),glass(R,.004));s.position.set(0,y,z);g.add(s);}}
 g.userData={type:'headlight'};return g;}
/* ---------- ammortizzatori ---------- */
export function shock({style='piggy',len=.33}={}){const g=new THREE.Group();g.name='Ammortizzatore';const top=V(0,len/2),bot=V(0,-len/2);
 const eye=(p)=>{const e=mesh(new THREE.TorusGeometry(.014,.007,24,48),M.alu(),'Occhiello');e.position.copy(p);g.add(e);};eye(top);eye(bot);
 if(style==='vintage'){g.add(cyl(bot.clone().add(V(0,.02)),V(0,0),.023,.023,M.satin(),SEG,'Corpo'));g.add(cyl(V(0,-.06),top.clone().add(V(0,-.02)),.036,.036,M.chrome(),SEG,'Copertura molla cromata'));g.add(cyl(V(0,-.08),V(0,-.06),.03,.036,M.chrome(),SEG,'Raccordo'));}
 else if(style==='classic'){g.add(cyl(bot.clone().add(V(0,.02)),V(0,.02),.021,.021,M.chrome(),SEG,'Corpo'));g.add(cyl(V(0,0),top.clone().add(V(0,-.02)),.009,.009,M.chrome(),48,'Stelo'));const s=spring(.03,len*.7,9,.0055,M.chrome());g.add(s);}
 else if(style==='piggy'||style==='remote'){g.add(cyl(bot.clone().add(V(0,.02)),V(0,.03),.023,.023,M.gold(),SEG,'Corpo idraulico'));g.add(cyl(V(0,.03),top.clone().add(V(0,-.02)),.008,.008,M.chrome(),48,'Stelo'));
   const s=spring(.032,len*.62,8,.0065,style==='piggy'?M.yellow():M.red2());s.position.y=.03;g.add(s);
   for(const y of [-len*.3,len*.33]){const r=mesh(new THREE.CylinderGeometry(.04,.04,.012,SEG),M.alu(),'Ghiera precarico');r.position.y=y;g.add(r);}
   if(style==='piggy'){g.add(cyl(V(.045,-len*.38),V(.045,-len*.05),.019,.019,M.gold(),SEG,'Serbatoio gas (piggyback)'));g.add(cyl(V(.02,-len*.36),V(.045,-len*.36),.008,.008,M.alu(),24,'Raccordo serbatoio'));}
   else g.add(tube([V(0,-len*.42),V(.05,-len*.5),V(.12,-len*.4)],.004,M.satin(),60,'Tubo serbatoio remoto'));
   const k=mesh(new THREE.CylinderGeometry(.011,.011,.012,24),M.red2(),'Pomello regolazione');k.position.set(.026,-len*.42,0);k.rotation.z=Math.PI/2;g.add(k);}
 else if(style==='air'){g.add(cyl(bot.clone().add(V(0,.02)),V(0,0),.024,.024,M.satin(),SEG,'Corpo'));g.add(mesh(lathe([[.028,-.0],[.04,.03],[.041,.12],[.03,.15]],SEG),M.rubber(),'Polmone aria').translateY(-.02));g.add(cyl(V(0,.13),top,.012,.012,M.chrome(),48,'Stelo'));}
 g.userData={type:'shock'};return g;}
/* ---------- forcelle ---------- */
export function fork({style='usd',len=.78,track=.2}={}){const g=new THREE.Group();g.name='Forcella';
 for(const z of [-track/2,track/2]){const T=V(0,len/2,z),B=V(0,-len/2,z),mid=V(0,0,z);
  if(style==='usd'){g.add(cyl(V(0,-.02,z),T,.032,.032,M.gold(),SEG,'Fodero superiore (upside-down)'));g.add(cyl(B.clone().add(V(0,.04)),V(0,.0,z),.024,.024,M.chrome(),SEG,'Stelo inferiore'));g.add(cyl(B,B.clone().add(V(0,.07)),.03,.03,M.satin(),SEG,'Piedino'));
    const r=mesh(new THREE.CylinderGeometry(.034,.034,.03,SEG),M.alu(),'Regolazione idraulica');r.position.copy(T);g.add(r);}
  else if(style==='conv'){g.add(cyl(mid,T,.022,.022,M.chrome(),SEG,'Stelo'));g.add(cyl(B,mid.clone().add(V(0,.04)),.034,.031,M.alu(),SEG,'Fodero'));}
  else if(style==='gaiter'){g.add(cyl(mid,T,.022,.022,M.chrome(),SEG,'Stelo'));g.add(cyl(B,mid.clone().add(V(0,-.06)),.034,.031,M.alu(),SEG,'Fodero'));
    const prof=[];for(let i=0;i<=40;i++){const y=i/40*.16;prof.push([.03+.006*Math.abs(Math.sin(i*Math.PI/4)),y]);}const s=mesh(lathe(prof,SEG),M.rubber(),'Soffietto');s.position.copy(mid.clone().add(V(0,-.06)));g.add(s);}
  else if(style==='springer'){g.add(cyl(B,T,.012,.012,M.chrome(),48,'Gamba posteriore'));const f0=V(.05,len/2-.02,z),f1=V(.045,-len/2+.03,z);g.add(cyl(f1,f0.clone().add(V(0,-.2)),.011,.011,M.chrome(),48,'Gamba anteriore'));
    const sp=spring(.02,.17,11,.004,M.chrome());sp.position.set(.05,len/2-.12,z);g.add(sp);g.add(cyl(V(.05,len/2-.21,z),V(.05,len/2-.02,z),.006,.006,M.chrome(),24,'Guida molla'));
    const rk=cyl(B,f1,.014,.014,M.chrome(),32,'Bilanciere');g.add(rk);}
  else if(style==='leaf'){g.add(cyl(B,T,.014,.012,M.black(),48,'Gamba forcella'));for(let k=0;k<5;k++){const L=.26-k*.035;const bl=mesh(new THREE.BoxGeometry(L,.006,.04,32,1,1),M.satin(),'Lamina balestra');
      const p=bl.geometry.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i);p.setY(i,p.getY(i)-x*x*.9);}bl.geometry.computeVertexNormals();bl.position.set(.04,len/2-.08-k*.008,z);g.add(bl);}
    g.add(cyl(V(-.06,-len/2+.02,z),V(.08,len/2-.16,z),.008,.008,M.black(),24,'Biella'));}
 }
 g.userData={type:'fork'};return g;}
/* ---------- sissy bar ---------- */
export function sissy({h=.5,w=.22,pad=true}={}){const g=new THREE.Group();g.name='Sissy bar';const ch=M.chrome();
 const pts=[V(0,0,-w/2),V(-.02,h*.5,-w/2),V(-.04,h*.9,-w/2*.9),V(-.045,h,0),V(-.04,h*.9,w/2*.9),V(-.02,h*.5,w/2),V(0,0,w/2)];g.add(tube(pts,.0095,ch,260,'Arco sissy bar'));
 for(const z of [-w/2,w/2])g.add(cyl(V(0,0,z),V(.08,-.02,z),.012,.012,ch,32,'Piastra attacco'));
 if(pad){const p=mesh(new THREE.BoxGeometry(.05,.16,w*.8,4,8,8),M.leather(0x120c09),'Schienalino');const q=p.geometry.attributes.position;for(let i=0;i<q.count;i++){const x=q.getX(i);if(x>0)q.setX(i,x+.015*Math.cos(q.getZ(i)/(w*.4)*1.5)*Math.cos(q.getY(i)/.08*1.5));}p.geometry.computeVertexNormals();p.position.set(-.01,h*.62,0);g.add(p);}
 g.userData={type:'sissy'};return g;}
/* ---------- coperchi carter ---------- */
export function cover({style='derby',d=.13}={}){const g=new THREE.Group();g.name='Coperchio carter';const r=d/2;
 if(style==='derby'){g.add(mesh(lathe([[0,.022],[r*.5,.02],[r*.85,.012],[r,0],[r*1.05,-.004]],SEG).rotateX(Math.PI/2),M.chrome(),'Coperchio derby'));for(let i=0;i<5;i++){const a=i/5*Math.PI*2;const v=mesh(new THREE.CylinderGeometry(.0045,.0045,.006,24),M.chrome(),'Vite');v.rotation.x=Math.PI/2;v.position.set(Math.cos(a)*r*.92,Math.sin(a)*r*.92,.006);g.add(v);}}
 else if(style==='ribbed'){g.add(mesh(new THREE.CylinderGeometry(r,r*1.04,.02,SEG).rotateX(Math.PI/2),M.black(),'Coperchio alettato'));for(let i=0;i<7;i++){const f=mesh(new THREE.BoxGeometry(d*.82,.0045,.008),M.alu(),'Aletta lavorata');f.position.set(0,(i-3)*d*.11,.012);const k=Math.sqrt(Math.max(0,1-((i-3)*.22)**2));f.scale.x=k;g.add(f);}}
 else if(style==='points'){g.add(mesh(lathe([[0,.016],[r*.6,.014],[r*.92,.007],[r,0]],SEG).rotateX(Math.PI/2),M.chrome(),'Coperchio puntine'));const l=mesh(new THREE.TorusGeometry(r*.55,.0025,12,SEG),M.black(),'Filetto');l.position.z=.013;g.add(l);}
 else if(style==='vintage'){const s=new THREE.Shape();s.absarc(0,0,r,Math.PI*.5,Math.PI*1.5,false);s.lineTo(r*1.6,-r*.8);s.absarc(r*1.6,0,r*.8,-Math.PI*.5,Math.PI*.5,false);s.lineTo(0,r);
   g.add(mesh(new THREE.ExtrudeGeometry(s,{depth:.012,bevelEnabled:true,bevelSize:.006,bevelThickness:.008,bevelSegments:8,curveSegments:64}),M.chrome(),'Coperchio primaria vintage'));}
 g.userData={type:'engine'};return g;}
/* ---------- borse ---------- */
export function bags({style='hard',L=.5,H=.3,D=.17,track=.42}={}){const g=new THREE.Group();g.name='Borse laterali';
 for(const s of [-1,1]){const sh=new THREE.Shape();const r=.05;
  if(style==='stretched'){sh.moveTo(0,H);sh.lineTo(-L,H*.95);sh.quadraticCurveTo(-L-.1,H*.6,-L-.02,-.05);sh.lineTo(-.02,.02);sh.quadraticCurveTo(0,.05,0,H);}
  else{sh.moveTo(-r,0);sh.lineTo(-L+r,0);sh.quadraticCurveTo(-L,0,-L,r);sh.lineTo(-L,H-r);sh.quadraticCurveTo(-L,H,-L+r,H);sh.lineTo(-r,H);sh.quadraticCurveTo(0,H,0,H-r);sh.lineTo(0,r);sh.quadraticCurveTo(0,0,-r,0);}
  const mat=style==='leather'?M.leather():M.paint();const b=mesh(new THREE.ExtrudeGeometry(sh,{depth:D,bevelEnabled:true,bevelSize:.02,bevelThickness:.025,bevelSegments:8,curveSegments:48}),mat,style==='leather'?'Borsa in cuoio':'Borsa rigida');
  b.position.z=s>0?track/2:-track/2-D;g.add(b);
  if(style==='leather'){for(const x of [-L*.3,-L*.7]){const st=mesh(new THREE.BoxGeometry(.03,H*.75,.004),M.leather(0x1a0f08),'Cinghia');st.position.set(x,H*.55,s>0?track/2+D+.027:-track/2-D-.027);g.add(st);const bk=mesh(new THREE.BoxGeometry(.034,.03,.006),M.chrome(),'Fibbia');bk.position.set(x,H*.32,s>0?track/2+D+.029:-track/2-D-.029);g.add(bk);}}
  else{const lid=mesh(new THREE.BoxGeometry(L*.94,.006,.004),M.satin(),'Linea coperchio');lid.position.set(-L/2,H*.78,s>0?track/2+D+.026:-track/2-D-.026);g.add(lid);}}
 g.userData={type:'bags'};return g;}
/* ---------- parabrezza ---------- */
export function screen({h=.45,w=.5,curve=.3,tint=false}={}){const g=new THREE.Group();g.name='Parabrezza';const R=w/(2*Math.sin(curve*1.4));
 const geo=new THREE.CylinderGeometry(R,R,h,96,24,true,Math.PI/2-curve*1.4,curve*2.8);const p=geo.attributes.position;for(let i=0;i<p.count;i++){const y=p.getY(i);const t=(y+h/2)/h;const z=p.getZ(i);p.setZ(i,z-R+t*t*.03);if(t>.85){const k=(t-.85)/.15;p.setX(i,p.getX(i)*(1-k*.12));}}
 geo.computeVertexNormals();const m=M.lens();m.name='Policarbonato';m.color.set(tint?0x30343a:0xffffff);m.transmission=tint?.6:.95;m.side=THREE.DoubleSide;const s=mesh(geo,m,'Parabrezza');s.rotation.y=Math.PI/2;s.position.y=h/2;s.rotation.z=-.18;g.add(s);
 for(const z of [-w*.42,w*.42])g.add(tube([V(.02,-.06,z),V(.03,.05,z),V(.0,.14,z*.97)],.006,M.chrome(),40,'Staffa'));
 g.userData={type:'screen'};return g;}
/* ---------- costruttore scarico ---------- */
export function pipe({pts,r=.022,tip='slash',mufLen=.45,mufR=.045,mat='chrome',muffler=true}){const g=new THREE.Group();g.name='Scarico custom';const m=M[mat]?M[mat]():M.chrome();
 const curve=new THREE.CatmullRomCurve3(pts,false,'centripetal',.5);g.add(mesh(new THREE.TubeGeometry(curve,Math.max(120,pts.length*60),r,32,false),m,'Collettore'));
 if(muffler){const end=pts[pts.length-1],dir=curve.getTangent(1).normalize();const a=end.clone(),b=end.clone().addScaledVector(dir,mufLen);
   const body=new THREE.CylinderGeometry(mufR,mufR*.97,mufLen,64,16,true);if(tip==='slash'){const q=body.attributes.position;for(let i=0;i<q.count;i++){const y=q.getY(i);const t=(y+mufLen/2)/mufLen;q.setY(i,y+t*t*q.getX(i)*-1.1);}body.computeVertexNormals();}
   const bm=mesh(body,m,'Silenziatore');bm.position.copy(a).lerp(b,.5);bm.quaternion.setFromUnitVectors(V(0,1,0),dir);bm.material.side=THREE.DoubleSide;g.add(bm);
   const cap=cyl(a.clone().addScaledVector(dir,-.03),a,r*1.1,mufR,m,64,'Cono di raccordo');g.add(cap);
   const inner=mesh(new THREE.CylinderGeometry(mufR*.8,mufR*.8,mufLen*.98,48,1,true),M.satin(),'Interno terminale');inner.material.side=THREE.BackSide;inner.position.copy(bm.position);inner.quaternion.copy(bm.quaternion);g.add(inner);
   if(tip==='fishtail'){const f=mesh(new THREE.CylinderGeometry(mufR*1.4,mufR,.13,64,1,true),m,'Coda fishtail');f.scale.set(1,1,.42);f.position.copy(b).addScaledVector(dir,.06);f.quaternion.copy(bm.quaternion);f.material.side=THREE.DoubleSide;g.add(f);}
   if(tip==='mega'){const f=mesh(new THREE.CylinderGeometry(mufR*1.3,mufR,.16,64,1,true),m,'Megafono');f.position.copy(b).addScaledVector(dir,.075);f.quaternion.copy(bm.quaternion);f.material.side=THREE.DoubleSide;g.add(f);}
   if(tip==='turnout'){const f=tube([b,b.clone().addScaledVector(dir,.04).add(V(0,0,.0)),b.clone().addScaledVector(dir,.07).add(V(0,-.02,.04))],mufR*.55,m,40,'Terminale turnout');g.add(f);}}
 g.userData={type:'exhaust'};return g;}

/* ---------- cerchi completi ---------- */
const quilt=(()=>{let t=null;return()=>{if(t)return t;const c=document.createElement('canvas');c.width=c.height=512;const g=c.getContext('2d');g.fillStyle='#8080ff';g.fillRect(0,0,512,512);
 g.strokeStyle='rgba(60,60,255,1)';g.lineWidth=10;for(let i=-512;i<1024;i+=96){g.beginPath();g.moveTo(i,0);g.lineTo(i+512,512);g.stroke();g.beginPath();g.moveTo(i+512,0);g.lineTo(i,512);g.stroke();}
 t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(3,3);return t;};})();
export function wheel({style='cast9',rimIn=18,width=.13,tireOn=true,tireKind='road',whitewall=false,finish='black'}={}){const g=new THREE.Group();g.name='Ruota completa';
 const rr=rimIn*.0254/2+.012,w=width,mRim=finish==='chrome'?M.chrome():finish==='gold'?M.gold():finish==='alu'?M.alu():M.black();mRim.name='Cerchio';
 const rp=[[rr-.03,-w*.38],[rr-.004,-w*.4],[rr+.013,-w*.43],[rr+.013,-w*.37],[rr,-w*.35],[rr,w*.35],[rr+.013,w*.37],[rr+.013,w*.43],[rr-.004,w*.4],[rr-.03,w*.38]];
 const rim=mesh(lathe(rp,192),mRim,'Canale cerchio');rim.rotation.x=Math.PI/2;g.add(rim);
 const hubW=Math.min(.16,w*.85);const hub=mesh(lathe([[.03,-hubW/2],[.058,-hubW/2],[.06,-hubW*.3],[.05,0],[.06,hubW*.3],[.058,hubW/2],[.03,hubW/2]],96),mRim,'Mozzo');hub.rotation.x=Math.PI/2;g.add(hub);
 const ri=rr-.026;
 const spokeSet=(N,wi,wo,sk,th,curve=0)=>{for(let i=0;i<N;i++){const sh=new THREE.Shape();const P=(r,a)=>[Math.cos(a)*r,Math.sin(a)*r];const a1=wi/2/.055,a2=wo/2/ri;const steps=12;
   const L=[],Rr=[];for(let k=0;k<=steps;k++){const t=k/steps,r=.055+(ri-.055)*t,off=sk*t+curve*Math.sin(t*Math.PI),hw=(a1+(a2-a1)*t)*(.055/r)*(1+(.055/r-1)*0);L.push(P(r,off-hw*(r>0?1:1)*(.055+(ri-.055)*t>0?1:1)));Rr.push(P(r,off+hw));}
   sh.moveTo(...L[0]);L.slice(1).forEach(p=>sh.lineTo(...p));Rr.reverse().forEach(p=>sh.lineTo(...p));sh.closePath();
   const ge=new THREE.ExtrudeGeometry(sh,{depth:th,bevelEnabled:true,bevelThickness:.004,bevelSize:.0035,bevelSegments:4,curveSegments:8});ge.translate(0,0,-th/2);ge.rotateZ(i/N*Math.PI*2);g.add(mesh(ge,mRim,'Razza'));}};
 if(style==='cast5')spokeSet(5,.075,.05,0,.032);
 else if(style==='cast9')spokeSet(9,.03,.024,0,.026);
 else if(style==='turbine')spokeSet(14,.022,.032,.32,.02);
 else if(style==='billet')spokeSet(7,.05,.018,.0,.022,.45);
 else if(style==='disc'){for(const z of [-1,1]){const d=mesh(lathe([[0,.012],[.06,.011],[ri*.7,.006],[ri,0]],192),mRim,'Disco lenticolare');d.rotation.x=z>0?Math.PI/2:-Math.PI/2;d.position.z=z*w*.32;g.add(d);}
   const cap=mesh(new THREE.SphereGeometry(.04,48,24,0,Math.PI*2,0,Math.PI/2.4),M.chrome(),'Coprimozzo');cap.rotation.x=Math.PI/2;cap.position.z=w*.33+.01;g.add(cap);}
 else if(style==='laced'||style==='laced80'||style==='bigspoke'){const N=style==='laced80'?80:style==='bigspoke'?42:40;const R=style==='bigspoke'?.0055:style==='laced80'?.0018:.0023;const mS=style==='bigspoke'?mRim:M.chrome();
   const geos=[];for(let i=0;i<N;i++){const sd=i%2?1:-1;const ah=i/N*Math.PI*2,ar=ah+((i>>1)%2?1:-1)*(style==='laced80'?.35:.55);const a=V(Math.cos(ah)*.05,Math.sin(ah)*.05,sd*hubW*.42),b=V(Math.cos(ar)*(rr-.006),Math.sin(ar)*(rr-.006),sd*.006);
     const L=a.distanceTo(b);const cg=new THREE.CylinderGeometry(R,R,L,10);const o=new THREE.Object3D();o.position.copy(a).lerp(b,.5);o.quaternion.setFromUnitVectors(V(0,1,0),b.clone().sub(a).normalize());o.updateMatrix();cg.applyMatrix4(o.matrix);geos.push(cg);}
   import('three/addons/utils/BufferGeometryUtils.js').then(U=>{g.add(mesh(U.mergeGeometries(geos),mS,'Raggi'));g.dispatchEvent({type:'ready'});});
   for(const z of [-1,1]){const f=mesh(new THREE.CylinderGeometry(.064,.064,.007,64),mRim,'Flangia mozzo');f.rotation.x=Math.PI/2;f.position.z=z*hubW*.42;g.add(f);}}
 let R=rr+.013;if(tireOn){const t=tire({rimIn,width:w+.01,aspect:.62,kind:tireKind,whitewall});g.add(t);R=t.userData.R;}
 g.userData={type:'wheel',R};return g;}
/* ---------- cupolini e carenature ---------- */
export function fairing({style='cafe',color=0x0b0b0c}={}){const g=new THREE.Group();g.name='Cupolino';const paint=M.paint(color);paint.name='Carenatura';
 const shell=(r,ph0,phL,th0,thL,sx,sy,sz,m,name)=>{const ge=new THREE.SphereGeometry(r,128,48,ph0,phL,th0,thL);ge.scale(sx,sy,sz);const o=mesh(ge,m,name);o.material.side=THREE.DoubleSide;return o;};
 const glass=(tint)=>{const m=M.lens();m.name='Cupolino trasparente';m.side=THREE.DoubleSide;if(tint){m.color.set(0x30343a);m.transmission=.55;}return m;};
 const S={cafe:[.2,.36,.4,.6,.7,.95,.15,.14,true],bikini:[.17,.3,.4,.55,.72,.9,.12,.1,true],flyscreen:[.13,.38,.32,.5,.7,.8,.0,.0,true],batwing:[.36,.27,.42,.55,.72,1.02,.13,.15,false],sharknose:[.36,.3,.42,.7,.62,.95,.2,.1,true],clubman:[.3,.28,.55,.6,.85,.75,.16,.14,false]}[style];
 const [r,t0,tl,sx,sy,sz,gt0,gtl,tint]=S;g.add(shell(r,Math.PI/2,Math.PI,Math.PI*t0,Math.PI*tl,sx,sy,sz,paint,'Carenatura'));
 if(gtl>0)g.add(shell(r*.99,Math.PI*.6,Math.PI*.8,Math.PI*gt0,Math.PI*gtl,sx*.98,sy,sz*.96,glass(tint),'Cupolino trasparente'));
 const hl=headlight({style:style==='batwing'||style==='sharknose'?'led':'vintage575'});hl.position.set(r*sx*.78,r*sy*-.05,0);g.add(hl);
 g.userData={type:'screen'};return g;}
/* ---------- selle ---------- */
export function seat({style='solo',color=0x1a110c,quilted=false}={}){const g=new THREE.Group();g.name='Sella';const m=M.leather(color);if(quilted){m.normalMap=quilt();m.normalScale=new THREE.Vector2(1.2,1.2);}m.name='Pelle sella';
 const prof={solo:[[0,.04],[-.08,-.01,-.22,.02],[-.29,.05],[-.3,0],[-.02,0]],stepup:[[0,.05],[-.12,0,-.26,.0],[-.32,.04,-.36,.08],[-.56,.1,-.66,.07],[-.67,0],[-.02,0]],
   gunfighter:[[0,.05],[-.12,-.0,-.3,.02],[-.38,.06,-.5,.05],[-.55,0],[-.02,0]],cafe:[[0,.03],[-.25,.02,-.45,.02],[-.5,.1,-.62,.1],[-.68,.03],[-.68,0],[-.02,0]],bench:[[0,.04],[-.35,.05,-.7,.04],[-.72,0],[-.02,0]],tour:[[0,.06],[-.1,.0,-.24,.0],[-.3,.05,-.34,.12],[-.36,.2],[-.42,.2],[-.44,.09,-.5,.09],[-.7,.1,-.74,.05],[-.75,0],[-.02,0]]}[style];
 const sh=new THREE.Shape();sh.moveTo(...prof[0]);for(let i=1;i<prof.length;i++){const p=prof[i];if(p.length===4)sh.quadraticCurveTo(p[0],p[1],p[2],p[3]);else sh.lineTo(p[0],p[1]);}sh.closePath();
 const wd=style==='solo'?.3:.28,d=wd-.06;const ge=new THREE.ExtrudeGeometry(sh,{depth:d,bevelEnabled:true,bevelThickness:.03,bevelSize:.026,bevelSegments:8,curveSegments:32});ge.translate(0,0,-d/2);
 const P=ge.attributes.position;for(let i=0;i<P.count;i++){const x=P.getX(i);const k=.5+.5*Math.min(1,Math.max(0,-x/.22));P.setZ(i,P.getZ(i)*k);}ge.computeVertexNormals();
 g.add(mesh(ge,m,'Sella'));
 if(style==='solo'){for(const z of [-.06,.06]){const s=spring(.02,.12,7,.0035,M.chrome());s.position.set(-.24,-.07,z);g.add(s);}g.add(cyl(V(-.04,-.01,0),V(-.04,-.08,0),.008,.008,M.chrome(),24,'Perno'));}
 if(style==='cafe'){const cw=mesh(ge.clone(),M.paint(0x7e0b12),'Codino');cw.scale.set(.32,.55,.9);cw.position.set(-.46,.04,0);g.add(cw);}
 g.userData={type:'seat'};return g;}
/* ---------- borse vintage ---------- */
export function softbag({style='bubble',color=0x3b2416}={}){const g=new THREE.Group();g.name='Borsa vintage';const m=M.leather(color);
 if(style==='bubble'){const b=mesh(new THREE.SphereGeometry(.11,96,48),m,'Bubble bag');b.scale.set(1,.85,.55);g.add(b);const f=mesh(new THREE.SphereGeometry(.112,96,24,0,Math.PI*2,0,Math.PI*.42),M.leather(0x1c120b),'Patta');f.scale.set(1,.85,.56);g.add(f);
   for(const x of [-.04,.04]){const st=mesh(new THREE.BoxGeometry(.016,.16,.004),M.leather(0x1c120b),'Cinghia');st.position.set(x,-.01,.062);g.add(st);const bk=mesh(new THREE.BoxGeometry(.02,.016,.006),M.chrome(),'Fibbia');bk.position.set(x,-.04,.065);g.add(bk);}}
 else if(style==='roll'){const b=mesh(new THREE.CylinderGeometry(.06,.06,.3,96,1),m,'Borsa a rullo');b.rotation.x=Math.PI/2;g.add(b);for(const z of [-.155,.155]){const e=mesh(new THREE.CircleGeometry(.06,64),M.leather(0x1c120b),'Fondo');e.position.z=z;if(z<0)e.rotation.y=Math.PI;g.add(e);}
   for(const z of [-.08,.08]){const s=mesh(new THREE.TorusGeometry(.0615,.004,12,96),M.leather(0x1c120b),'Cinghia');s.rotation.x=0;s.position.z=z;g.add(s);}}
 else{const sh=new THREE.Shape();sh.moveTo(0,0);sh.lineTo(-.3,0);sh.quadraticCurveTo(-.34,.0,-.34,.05);sh.lineTo(-.32,.22);sh.lineTo(0,.24);sh.closePath();const b=mesh(new THREE.ExtrudeGeometry(sh,{depth:.1,bevelEnabled:true,bevelSize:.015,bevelThickness:.02,bevelSegments:6,curveSegments:24}),m,'Borsa da forcellone');g.add(b);
   const fl=mesh(new THREE.BoxGeometry(.3,.09,.004),M.leather(0x1c120b),'Patta');fl.position.set(-.16,.19,.122);g.add(fl);}
 g.userData={type:'bags'};return g;}


/* ---------- serbatoi custom ---------- */
export function tank({style='peanut',color=0x7e0b12}={}){const g=new THREE.Group();g.name='Serbatoio';const m=M.paint(color);m.name='Serbatoio verniciato';
 const D={peanut:{L:.42,prof:[[.015,0],[.075,.03],[.105,.11],[.112,.22],[.1,.33],[.065,.4],[.015,.42]],ys:.85,zs:.8},
  fatbob:{L:.56,prof:[[.02,0],[.1,.035],[.145,.13],[.152,.28],[.145,.4],[.11,.5],[.05,.55],[.015,.56]],ys:.72,zs:1.05},
  cafe:{L:.6,prof:[[.02,0],[.09,.03],[.122,.1],[.135,.26],[.133,.42],[.11,.53],[.05,.59],[.015,.6]],ys:.7,zs:1,knee:true},
  teardrop:{L:.5,prof:[[.01,0],[.06,.03],[.1,.12],[.125,.25],[.12,.36],[.085,.45],[.03,.5]],ys:.82,zs:.85},
  mustang:{L:.36,prof:[[.015,0],[.07,.03],[.095,.1],[.1,.18],[.09,.27],[.055,.34],[.012,.36]],ys:.8,zs:.8},
  coffin:null}[style];
 if(style==='coffin'){const sh=new THREE.Shape();sh.moveTo(0,-.06);sh.lineTo(-.48,-.04);sh.lineTo(-.5,.05);sh.lineTo(-.4,.1);sh.lineTo(-.06,.1);sh.lineTo(0,.04);sh.closePath();
  const ge=new THREE.ExtrudeGeometry(sh,{depth:.2,bevelEnabled:true,bevelSize:.02,bevelThickness:.02,bevelSegments:8,curveSegments:24});ge.translate(.25,0,-.1);const P=ge.attributes.position;for(let i=0;i<P.count;i++){const x=P.getX(i);P.setZ(i,P.getZ(i)*(.65+.35*(1-Math.abs(x)/.27)));}ge.computeVertexNormals();g.add(mesh(ge,m,'Serbatoio coffin'));}
 else{const ge=new THREE.LatheGeometry(D.prof.map(p=>V2(p[0],p[1])),192,Math.PI/2);ge.rotateZ(-Math.PI/2);ge.scale(1,D.ys,D.zs);ge.translate(-D.L/2,0,0);
  if(D.knee){const P=ge.attributes.position;for(let i=0;i<P.count;i++){const x=P.getX(i),y=P.getY(i),z=P.getZ(i);const t=(x+D.L/2)/D.L;if(t<.35&&Math.abs(z)>.05&&y<.03){const k=(.35-t)/.35;P.setZ(i,z*(1-.18*k));}}ge.computeVertexNormals();}
  g.add(mesh(ge,m,'Serbatoio'));}
 const cap=cyl(V(.05,.07,0),V(.05,.1,0),.028,.025,M.chrome(),64,'Tappo serbatoio');if(style==='coffin')cap.position.y-=.0;g.add(cap);
 g.add(cyl(V(-.18,-.07,0),V(-.18,-.11,0),.006,.006,M.chrome(),16,'Rubinetto benzina'));
 g.userData={type:'tank'};return g;}

/* ---------- catalogo ---------- */
export const CATALOG=[
 ['Pneumatici',[['Stradale moderno',()=>tire({kind:'road'})],['Vintage a righe',()=>tire({kind:'firestone',aspect:.95})],['Vintage a righe fascia bianca',()=>tire({kind:'firestone',aspect:.95,whitewall:true})],['Vintage diamante',()=>tire({kind:'vintage',aspect:.9})],['Fascia bianca stradale',()=>tire({kind:'road',whitewall:true})],['Tassellato',()=>tire({kind:'knobby',width:.12,aspect:.9})],['Fat 240',()=>tire({rimIn:18,width:.24,aspect:.4,kind:'road'})]]],
 ['Cerchi e ruote',[['Lega 5 razze',()=>wheel({style:'cast5'})],['Lega 9 razze',()=>wheel({style:'cast9'})],['Turbina',()=>wheel({style:'turbine'})],['Billet a lame curve',()=>wheel({style:'billet',finish:'chrome'})],['Lenticolare pieno',()=>wheel({style:'disc'})],['Lenticolare cromato',()=>wheel({style:'disc',finish:'chrome'})],['A raggi 40',()=>wheel({style:'laced',finish:'chrome'})],['A raggi 80',()=>wheel({style:'laced80',finish:'chrome',rimIn:21,width:.09})],['Big spoke',()=>wheel({style:'bigspoke',finish:'black'})],['Raggi vintage fascia bianca',()=>wheel({style:'laced',finish:'chrome',rimIn:16,tireKind:'firestone',whitewall:true})]]],
 ['Serbatoi custom',[['Peanut',()=>tank({style:'peanut'})],['Fat bob',()=>tank({style:'fatbob'})],['Café racer con incavi',()=>tank({style:'cafe',color:0x1d3c9a})],['Goccia vintage',()=>tank({style:'teardrop',color:0x1f3a2a})],['Mustang',()=>tank({style:'mustang',color:0x0b0b0c})],['Coffin chopper',()=>tank({style:'coffin',color:0x4b1460})]]],
 ['Cupolini e carenature',[['Café racer',()=>fairing({style:'cafe'})],['Bikini',()=>fairing({style:'bikini'})],['Flyscreen',()=>fairing({style:'flyscreen'})],['Clubman mezza carena',()=>fairing({style:'clubman'})],['Batwing',()=>fairing({style:'batwing'})],['Sharknose bagger',()=>fairing({style:'sharknose'})]]],
 ['Selle',[['Monoposto molleggiata',()=>seat({style:'solo'})],['Step-up biposto',()=>seat({style:'stepup'})],['Gunfighter',()=>seat({style:'gunfighter'})],['Café con codino',()=>seat({style:'cafe'})],['Panca brat',()=>seat({style:'bench',color:0x5a3a22})],['Touring con schienale',()=>seat({style:'tour'})],['Trapuntata (tuck & roll)',()=>seat({style:'stepup',quilted:true})]]],
 ['Borse vintage',[['Bubble bag',()=>softbag({style:'bubble'})],['Borsa a rullo',()=>softbag({style:'roll'})],['Borsa da forcellone',()=>softbag({style:'swing'})]]],
 ['Specchietti',[['Bar-end tondo',()=>mirror({style:'barend'})],['Tondo su stelo',()=>mirror({style:'round'})],['Goccia vintage',()=>mirror({style:'tear'})],['Rettangolare',()=>mirror({style:'rect'})],['Ovale',()=>mirror({style:'oval'})]]],
 ['Frecce',[['Mini bullet LED',()=>indicator({style:'mini'})],['Bar-end ad anello',()=>indicator({style:'barend'})],['Bullet vintage cromata',()=>indicator({style:'bullet'})]]],
 ['Fari',[['Vintage 7"',()=>headlight({style:'vintage7'})],['Vintage 5¾"',()=>headlight({style:'vintage575'})],['LED con anello DRL',()=>headlight({style:'led'})],['Bates con visiera',()=>headlight({style:'bates'})],['Quadruplo LED',()=>headlight({style:'quad'})],['Fari supplementari (coppia)',()=>headlight({style:'passing'})]]],
 ['Ammortizzatori',[['Vintage carenato cromato',()=>shock({style:'vintage'})],['Classico a molla cromata',()=>shock({style:'classic'})],['Alte prestazioni piggyback',()=>shock({style:'piggy'})],['Serbatoio remoto',()=>shock({style:'remote'})],['Ad aria',()=>shock({style:'air'})]]],
 ['Forcelle',[['Upside-down idraulica regolabile',()=>fork({style:'usd'})],['Tradizionale',()=>fork({style:'conv'})],['Tradizionale con soffietti',()=>fork({style:'gaiter'})],['Springer',()=>fork({style:'springer'})],['A balestra',()=>fork({style:'leaf'})]]],
 ['Sissy bar',[['Corto con schienalino',()=>sissy({h:.36})],['Alto con schienalino',()=>sissy({h:.6})],['Alto senza schienalino',()=>sissy({h:.6,pad:false})]]],
 ['Carter e coperchi',[['Derby cromato',()=>cover({style:'derby'})],['Alettato moderno',()=>cover({style:'ribbed'})],['Puntine vintage',()=>cover({style:'points',d:.09})],['Primaria vintage',()=>cover({style:'vintage',d:.15})]]],
 ['Borse',[['Rigide',()=>bags({style:'hard'})],['Allungate (stretched)',()=>bags({style:'stretched',L:.62})],['In cuoio con cinghie',()=>bags({style:'leather',L:.42,H:.28,D:.13})]]],
 ['Parabrezza',[['Trasparente alto',()=>screen({h:.5})],['Trasparente medio',()=>screen({h:.35})],['Fumé basso',()=>screen({h:.22,tint:true})]]]
];
