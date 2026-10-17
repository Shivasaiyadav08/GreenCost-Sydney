/* GreenCost landing 3D scene (embedded).
   Taken from greencost-3d-scene.html so the live "Your building" panel can
   embed just the interactive stage. It renders into #stage and reads/writes the
   hidden control nodes in greencost-3d-embed.html, so the model keeps its
   orbit, zoom, day/night, rain and label behaviour without showing a second set
   of controls. three.js (r128) is loaded before this file. */(function(){
var stage=document.getElementById('stage');
var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var state={rain:false,type:'house',storeys:2,solar:true,night:false,spin:!reduce,labels:true};
var renderer,scene,camera,house,root,sun,hemi,winMats=[],zoom=1,baseRad=22;
try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});}catch(e){
  stage.insertAdjacentHTML('beforeend','<p style="padding:24px;color:#555">3D preview is not supported on this device.</p>');return;}
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
stage.insertBefore(renderer.domElement,stage.firstChild);
scene=new THREE.Scene();
camera=new THREE.PerspectiveCamera(36,1,0.1,120);
root=new THREE.Group();scene.add(root);

hemi=new THREE.HemisphereLight(0xffffff,0xb7c4a8,0.85);scene.add(hemi);
sun=new THREE.DirectionalLight(0xfff1d6,1.15);sun.position.set(9,14,8);sun.castShadow=true;
sun.shadow.mapSize.set(2048,2048);sun.shadow.bias=-0.0004;
var sc=sun.shadow.camera;sc.left=-13;sc.right=13;sc.top=13;sc.bottom=-13;sc.near=1;sc.far=50;
scene.add(sun);

// ---------- textures ----------
function canvasTex(w,h,draw){var c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);
  var t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;return t;}
var woodTex=canvasTex(256,256,function(g,w,h){
  for(var i=0;i<16;i++){var l=48+Math.floor(((i*37)%17)-8);g.fillStyle='hsl(28,'+(42+(i%3)*4)+'%,'+l+'%)';g.fillRect(i*16,0,16,h);
    g.fillStyle='rgba(40,22,10,.45)';g.fillRect(i*16,0,1.5,h);}
});woodTex.repeat.set(2,1);
var cellTex=canvasTex(64,64,function(g,w,h){g.fillStyle='#16284a';g.fillRect(0,0,w,h);
  g.strokeStyle='rgba(190,210,245,.7)';g.lineWidth=3;g.strokeRect(1.5,1.5,w-3,h-3);
  g.strokeStyle='rgba(190,210,245,.18)';g.lineWidth=1;g.beginPath();g.moveTo(w/2,0);g.lineTo(w/2,h);g.stroke();});
cellTex.repeat.set(3,5);
var ribTex=canvasTex(64,32,function(g,w,h){g.fillStyle='#7ea6b3';g.fillRect(0,0,w,h);g.fillStyle='rgba(20,50,60,.35)';g.fillRect(0,h-4,w,4);});
ribTex.repeat.set(1,9);

var M={
  render:new THREE.MeshStandardMaterial({color:0xf5f2eb,roughness:.95}),
  dark:new THREE.MeshStandardMaterial({color:0x2a3532,roughness:.6}),
  alu:new THREE.MeshStandardMaterial({color:0xc9ced1,roughness:.4,metalness:.6}),
  wood:new THREE.MeshStandardMaterial({map:woodTex,roughness:.85}),
  glass:new THREE.MeshStandardMaterial({color:0x86b9d1,roughness:.08,metalness:.35,transparent:true,opacity:.82,emissive:0x000000}),
  rail:new THREE.MeshStandardMaterial({color:0xb9d9e6,roughness:.05,transparent:true,opacity:.35}),
  grass:new THREE.MeshStandardMaterial({color:0x9bbd8b,roughness:1}),
  lawn:new THREE.MeshStandardMaterial({color:0xb4d3a0,roughness:1}),
  soil:new THREE.MeshStandardMaterial({color:0x8b7a64,roughness:1}),
  path:new THREE.MeshStandardMaterial({color:0xddd8cb,roughness:1}),
  leaf:new THREE.MeshStandardMaterial({color:0x4b8757,roughness:.9,flatShading:true}),
  leaf2:new THREE.MeshStandardMaterial({color:0x6aa56f,roughness:.9,flatShading:true}),
  jac:new THREE.MeshStandardMaterial({color:0xa99ae0,roughness:.9,flatShading:true}),
  trunk:new THREE.MeshStandardMaterial({color:0x6b4a32,roughness:1}),
  tank:new THREE.MeshStandardMaterial({map:ribTex,roughness:.5,metalness:.4}),
  solar:new THREE.MeshStandardMaterial({map:cellTex,roughness:.2,metalness:.55})
};

function box(w,h,d,m,x,y,z,sh){var o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=sh!==false;o.receiveShadow=true;return o;}
function ico(r,m,x,y,z){var o=new THREE.Mesh(new THREE.IcosahedronGeometry(r,1),m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;return o;}
function tree(x,z,s,m){var t=new THREE.Group();
  var tr=new THREE.Mesh(new THREE.CylinderGeometry(.09*s,.14*s,1.2*s,7),M.trunk);tr.position.y=.6*s;tr.castShadow=true;t.add(tr);
  t.add(ico(.95*s,m,0,1.8*s,0));t.add(ico(.7*s,m,.55*s,2.3*s,.2*s));t.add(ico(.65*s,m,-.5*s,2.15*s,-.25*s));
  t.position.set(x,0,z);sway.push({o:t,p:x*1.7+z*.9,a:.018,ax:'z'});return t;}
function glaze(g,cx,cy,z,w,h,panes){ // front-facing glazing with frame and mullions
  var gm=M.glass.clone();winMats.push(gm);
  g.add(box(w,h,.05,gm,cx,cy,z+.03,false));
  g.add(box(w+.12,.09,.1,M.dark,cx,cy+h/2,z+.04,false));g.add(box(w+.12,.09,.1,M.dark,cx,cy-h/2,z+.04,false));
  for(var i=0;i<=panes;i++)g.add(box(.07,h,.1,M.dark,cx-w/2+i*w/panes,cy,z+.04,false));
}
function glazeSide(g,x,cy,cz,h,d,panes){
  var gm=M.glass.clone();winMats.push(gm);
  g.add(box(.05,h,d,gm,x+.03,cy,cz,false));
  g.add(box(.1,.09,d+.12,M.dark,x+.04,cy+h/2,cz,false));g.add(box(.1,.09,d+.12,M.dark,x+.04,cy-h/2,cz,false));
  for(var i=0;i<=panes;i++)g.add(box(.1,h,.07,M.dark,x+.04,cy,cz-d/2+i*d/panes,false));
}

function buildHouse(){
  var n=state.storeys,i,j;
  // plinth (diorama base)
  house.add(box(15,.5,13,M.grass,0,-.25,0,false));
  house.add(box(15.3,.4,13.3,M.soil,0,-.7,0,false));
  house.add(box(7.6,.04,3.8,M.lawn,-2.6,.02,4.5,false));
  house.add(box(2.8,.05,5.8,M.path,5.6,.025,3.5,false));
  for(i=0;i<4;i++)house.add(box(1.1,.05,.5,M.path,2.7,.03,3.5+i*.8,false));
  // ground floor
  var GW=8,GD=5.2,GH=2.8,y=.2;
  house.add(box(GW+.4,.2,GD+.4,M.dark,0,.1,0));
  house.add(box(GW,GH,GD,M.render,0,y+GH/2,0));
  glaze(house,-1.2,y+1.2,GD/2,4.6,2.3,4);
  var door=box(1.0,2.2,.08,M.wood,2.7,y+1.1,GD/2+.04,false);house.add(door);
  house.add(box(.05,.25,.1,M.dark,2.3,y+1.1,GD/2+.1,false));
  house.add(box(.9,.05,.8,M.path,-6.4,.03,-1.5,false));
  y+=GH;
  house.add(box(GW+.6,.2,GD+.6,M.dark,0,y+.1,0));y+=.2;
  var roof={x:0,z:0,w:GW,d:GD},ins=[-1.2,2.0,GD/2+.1];
  if(n===1)house.add(box(2.2,.1,1.5,M.dark,2.7,2.95,GD/2+.75));
  // upper floor: timber box cantilevered over entry
  if(n>=2){
    var UW=5.2,UD=6.0,UX=1.4,UZ=.4,UH=2.7;
    house.add(box(UW,UH,UD,M.wood,UX,y+UH/2,UZ));
    glaze(house,UX,y+1.45,UZ+UD/2,3.6,1.5,3);
    glazeSide(house,UX+UW/2,y+1.45,UZ,1.5,2.4,2);
    house.add(box(UW+.02,.12,UD+.02,M.dark,UX,y+.06,UZ));
    y+=UH;house.add(box(UW+.5,.2,UD+.5,M.dark,UX,y+.1,UZ));y+=.2;
    roof={x:UX,z:UZ,w:UW,d:UD};ins=[UX+UW/2-.6,y-1.6,UZ+UD/2+.1];
    // terrace on ground roof with glass balustrade
    house.add(box(2.8,.05,5.0,M.wood,-2.6,3.225,0,false));
    house.add(box(2.8,1.0,.04,M.rail,-2.6,3.7,2.8,false));house.add(box(.04,1.0,5.6,M.rail,-4.2,3.7,0,false));
    house.add(box(2.8,.05,.07,M.dark,-2.6,4.2,2.8,false));house.add(box(.07,.05,5.6,M.dark,-4.2,4.2,0,false));
    house.add(box(1.8,.5,.55,M.dark,-3.2,3.45,-2.2));
    house.add(ico(.42,M.leaf2,-3.6,3.95,-2.2));house.add(ico(.36,M.leaf,-3.0,3.9,-2.2));house.add(ico(.34,M.leaf2,-2.5,3.9,-2.2));
  }
  // top pavilion for 3 storeys
  if(n>=3){
    var TW=3.2,TD=3.6,TX=2.2,TZ=-.6,TH=2.6;
    house.add(box(TW,TH,TD,M.render,TX,y+TH/2,TZ));
    glaze(house,TX,y+1.3,TZ+TD/2,2.4,1.5,3);
    y+=TH;house.add(box(TW+.5,.2,TD+.5,M.dark,TX,y+.1,TZ));y+=.2;
    roof={x:TX,z:TZ,w:TW,d:TD};
  }
  // solar array on the top roof
  var topY=y;
  if(state.solar){
    var cols=Math.max(1,Math.floor((roof.w-.7)/1.15)),rows=Math.max(1,Math.floor((roof.d-1)/1.8));
    var sx=cols*1.15,sz=rows*1.8;
    for(var r=0;r<rows;r++)for(var c=0;c<cols;c++){
      var px=roof.x-sx/2+.575+c*1.15,pz=roof.z-sz/2+.9+r*1.8;
      var fr=box(1.08,.06,1.72,M.alu,px,topY+.2,pz);fr.rotation.x=-.2;house.add(fr);
      var pn=box(1.0,.03,1.64,M.solar,px,topY+.235,pz);pn.rotation.x=-.2;house.add(pn);
    }
  }
  // rainwater tank + downpipe
  var tk=new THREE.Mesh(new THREE.CylinderGeometry(.55,.55,2.4,28),M.tank);tk.position.set(-5.6,1.2,-1.5);tk.castShadow=true;house.add(tk);
  house.add(box(1.2,.12,1.2,M.dark,-5.6,.06,-1.5,false));
  var lid=new THREE.Mesh(new THREE.CylinderGeometry(.58,.58,.1,28),M.dark);lid.position.set(-5.6,2.45,-1.5);house.add(lid);
  var pipe=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,2.9,8),M.alu);pipe.position.set(-4.35,1.65,-1.5);house.add(pipe);
  house.add(box(1.25,.07,.07,M.alu,-4.95,3.1,-1.5,false));
  // garden
  var hm=[M.leaf,M.leaf2];
  for(i=0;i<6;i++)house.add(box(1.25,.8,.6,hm[i%2],-6+i*1.3,.4,6.1));
  house.add(ico(.5,M.leaf2,-3.2,.45,3.3));house.add(ico(.42,M.leaf,-2.4,.4,3.35));house.add(ico(.45,M.leaf2,.7,.45,3.3));
  house.add(tree(-5.6,3.9,1.5,M.jac));house.add(tree(6.3,-4.2,1.35,M.leaf));
  house.add(tree(-6.2,-4.6,1.1,M.leaf2));house.add(tree(6.4,5.2,.9,M.leaf2));
  // pin anchors
  house.userData={solar:[roof.x,topY+1.0,roof.z],ins:ins,tank:[-5.6,2.9,-1.5],has:state.solar,h:topY+.5,roof:roof,topY:topY};
}

M.brand=new THREE.MeshStandardMaterial({color:0x1f6b4a,roughness:.55});
M.concrete=new THREE.MeshStandardMaterial({color:0xe9e7e1,roughness:.95});
function plinth(){house.add(box(15,.5,13,M.grass,0,-.25,0,false));house.add(box(15.3,.4,13.3,M.soil,0,-.7,0,false));}
function parapet(cx,cz,w,d,y){var t=.12,h=.35;
  house.add(box(w,h,t,M.concrete,cx,y+h/2,cz+d/2-t/2));house.add(box(w,h,t,M.concrete,cx,y+h/2,cz-d/2+t/2));
  house.add(box(t,h,d,M.concrete,cx-w/2+t/2,y+h/2,cz));house.add(box(t,h,d,M.concrete,cx+w/2-t/2,y+h/2,cz));}
function addSolar(roof,topY){
  if(!state.solar)return;
  var cols=Math.max(1,Math.floor((roof.w-.7)/1.15)),rows=Math.max(1,Math.floor((roof.d-1)/1.8)),sx=cols*1.15,sz=rows*1.8;
  for(var r=0;r<rows;r++)for(var c=0;c<cols;c++){
    var px=roof.x-sx/2+.575+c*1.15,pz=roof.z-sz/2+.9+r*1.8;
    var fr=box(1.08,.06,1.72,M.alu,px,topY+.2,pz);fr.rotation.x=-.2;house.add(fr);
    var pn=box(1.0,.03,1.64,M.solar,px,topY+.235,pz);pn.rotation.x=-.2;house.add(pn);
  }
}
function addTank(x,z,s){
  var tk=new THREE.Mesh(new THREE.CylinderGeometry(.55*s,.55*s,2.4*s,28),M.tank);tk.position.set(x,1.2*s,z);tk.castShadow=true;house.add(tk);
  house.add(box(1.2*s,.12,1.2*s,M.dark,x,.06,z,false));
  var lid=new THREE.Mesh(new THREE.CylinderGeometry(.58*s,.58*s,.1,28),M.dark);lid.position.set(x,2.45*s,z);house.add(lid);
  addGauge(x,z,s);return [x,2.4*s+.5,z];
}
function hedgeFront(z,from,count){var hm=[M.leaf,M.leaf2];for(var i=0;i<count;i++)house.add(box(1.25,.8,.6,hm[i%2],from+i*1.3,.4,z));}

function buildApartment(){
  var n=state.storeys,AW=8,AD=6,FH=3,i,y=.2,H=n*FH;
  plinth();
  house.add(box(8.6,.04,3.4,M.path,0,.02,4.8,false));
  house.add(box(AW+.4,.2,AD+.4,M.dark,0,.1,0));
  house.add(box(AW,H,AD,M.render,0,y+H/2,0));
  house.add(box(1.6,H-FH,.12,M.wood,-AW/2+1.0,y+FH+(H-FH)/2,AD/2+.05));       // timber accent fin
  glaze(house,-.4,y+1.4,AD/2,5.6,2.6,5);                                       // lobby glazing
  house.add(box(4,.12,1.8,M.dark,-.4,y+2.95,AD/2+.9));house.add(box(3.9,.03,1.7,M.wood,-.4,y+2.88,AD/2+.9));
  for(i=1;i<n;i++){
    var b=y+i*FH;
    house.add(box(AW+.12,.14,AD+.12,M.concrete,0,b,0));
    glaze(house,.9,b+1.5,AD/2,5.2,1.9,4);
    house.add(box(6.2,.14,1.1,M.concrete,.9,b+.07,AD/2+.55));                     // balcony slab
    house.add(box(6.2,.95,.04,M.rail,.9,b+.62,AD/2+1.05,false));house.add(box(6.2,.05,.06,M.dark,.9,b+1.1,AD/2+1.05,false));
    glazeSide(house,AW/2,b+1.5,0,1.7,3.2,2);
  }
  y+=H;house.add(box(AW+.5,.2,AD+.5,M.dark,0,y+.1,0));y+=.2;
  parapet(0,0,AW+.5,AD+.5,y);
  house.add(box(2.2,1.3,2.2,M.render,2.6,y+.65,-1.4));                           // lift overrun
  var roof={x:-1.4,z:0,w:AW-3.4,d:AD-.6};addSolar(roof,y);
  var tk=addTank(-6,-1,1.5);hedgeFront(6.1,-6,6);
  house.add(tree(-6,4.4,1.2,M.leaf));house.add(tree(6.3,4.2,1.1,M.leaf2));house.add(tree(-6.3,-4.6,1.3,M.leaf2));house.add(tree(6.4,-4.4,1.2,M.jac));
  house.userData={solar:[roof.x,y+1.1,roof.z],ins:[2.6,y-1.6,AD/2+1.2],tank:tk,has:state.solar,h:y+.6,roof:roof,topY:y};
}

function buildCommercial(){
  var n=state.storeys,CW=9,CD=6.4,FH=3.4,i,y=.2,H=n*FH;
  plinth();
  house.add(box(15,.05,1.8,M.path,0,.03,5.5,false));
  house.add(box(CW+.4,.2,CD+.4,M.dark,0,.1,0));
  house.add(box(CW,H,CD,M.concrete,0,y+H/2,0));
  glaze(house,0,y+1.4,CD/2,CW-.8,2.6,6);                                       // retail frontage
  house.add(box(CW+.1,.5,.1,M.fascia,0,y+3.15,CD/2+.04,false));
  house.add(box(CW+.6,.1,1.5,M.dark,0,y+2.85,CD/2+.75));                       // awning
  for(i=1;i<n;i++){
    var b=y+i*FH;
    house.add(box(CW+.14,.16,CD+.14,M.dark,0,b,0));
    glaze(house,0,b+1.75,CD/2,CW-.6,1.9,8);
    glazeSide(house,CW/2,b+1.75,0,1.9,CD-1.2,3);
  }
  if(n>1)for(i=0;i<=8;i++)house.add(box(.1,H-FH,.28,M.alu,-CW/2+.3+i*(CW-.6)/8,y+FH+(H-FH)/2,CD/2+.18));
  y+=H;house.add(box(CW+.5,.2,CD+.5,M.dark,0,y+.1,0));y+=.2;
  parapet(0,0,CW+.5,CD+.5,y);
  house.add(box(2.4,1,1.8,M.alu,2.8,y+.5,-1.2));house.add(box(1.1,.7,1.1,M.alu,3.7,y+.35,1.3));   // plant
  var roof={x:-1.6,z:0,w:CW-3.6,d:CD-.6};addSolar(roof,y);
  var tk=addTank(6.3,-1.5,1.4);
  [-5.5,5.5].forEach(function(px){house.add(box(1.3,.35,1.3,M.dark,px,.18,5.6));var t=tree(px,5.6,.85,M.leaf2);t.position.y=.35;house.add(t);});
  house.add(tree(-6.3,-4.6,1.2,M.leaf));house.add(tree(6.4,-4.8,1.1,M.jac));
  house.userData={solar:[roof.x,y+1.1,roof.z],ins:[CW/2-1.3,y-1.8,CD/2+.3],tank:tk,has:state.solar,h:y+.6,roof:roof,topY:y};
}

// ================= LIVE WORLD + DETAILS =================
var sway=[],spinners=[],gauge=null,cars=[],walkers=[],birds=[],clouds=[],lampLights=[],rain=null,rainN=420,rainV=[];
M.lamp=new THREE.MeshStandardMaterial({color:0xfff2cf,emissive:0xffd27a,emissiveIntensity:0,roughness:.4});
M.head=new THREE.MeshStandardMaterial({color:0xfff6d8,emissive:0xfff0b0,emissiveIntensity:.2});
M.tail=new THREE.MeshStandardMaterial({color:0xb02020,emissive:0xff2020,emissiveIntensity:.3});
M.road=new THREE.MeshStandardMaterial({color:0x4a4f52,roughness:.9});
M.white=new THREE.MeshStandardMaterial({color:0xf2f2f2,roughness:.8});
M.water=new THREE.MeshBasicMaterial({color:0x4fb2ff});
M.skin=new THREE.MeshStandardMaterial({color:0xe0b08a,roughness:.8});
M.bird=new THREE.MeshStandardMaterial({color:0x333c3a,roughness:.9});
M.binG=new THREE.MeshStandardMaterial({color:0x2f6b3a,roughness:.8});
M.binY=new THREE.MeshStandardMaterial({color:0xd9b32a,roughness:.8});
M.binR=new THREE.MeshStandardMaterial({color:0xb3382c,roughness:.8});
M.cloud=new THREE.MeshStandardMaterial({color:0xffffff,roughness:1,transparent:true,opacity:.7,flatShading:true});
var numTex=canvasTex(64,64,function(g,w,h){g.fillStyle='#2a3532';g.fillRect(0,0,w,h);g.fillStyle='#fff';g.font='bold 40px Georgia,serif';g.textAlign='center';g.textBaseline='middle';g.fillText('24',w/2,h/2+2);});
var fasciaTex=canvasTex(1024,57,function(g,w,h){g.fillStyle='#1d6a4b';g.fillRect(0,0,w,h);g.fillStyle='#fff';g.font='italic 38px Georgia,serif';g.textAlign='center';g.textBaseline='middle';g.fillText('GreenCost & Co.',w/2,h/2+2);});
var openTex=canvasTex(128,64,function(g,w,h){g.fillStyle='#1b2523';g.fillRect(0,0,w,h);g.strokeStyle='#ff7b7b';g.lineWidth=3;g.strokeRect(4,4,w-8,h-8);g.fillStyle='#ff7b7b';g.font='bold 34px Arial,sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText('OPEN',w/2,h/2+2);});
M.fascia=new THREE.MeshStandardMaterial({map:fasciaTex,roughness:.6});
M.open=new THREE.MeshStandardMaterial({map:openTex,emissiveMap:openTex,emissive:0xffffff,emissiveIntensity:.12,roughness:.5});
M.numPlate=new THREE.MeshStandardMaterial({map:numTex,roughness:.6});
M.solar.emissive=new THREE.Color(0x2c5cff);M.solar.emissiveIntensity=.06;

function cyl(rt,rb,h,m,x,y,z,seg){var o=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,seg||12),m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;return o;}
function lampBox(x,y,z){return box(.16,.22,.12,M.lamp,x,y,z,false);}
function bollard(x,z){house.add(cyl(.07,.07,.45,M.dark,x,.22,z,8));house.add(box(.16,.08,.16,M.lamp,x,.5,z,false));}
function bin(x,z,body,lid){house.add(box(.5,.8,.5,body,x,.4,z));house.add(box(.54,.07,.54,lid,x,.83,z));}
function potPlant(x,y,z,s,m){house.add(cyl(.22*s,.17*s,.3*s,M.dark,x,y+.15*s,z,10));house.add(ico(.26*s,m||M.leaf2,x,y+.45*s,z));}
function fan(x,y,z,r,face){var o=new THREE.Group();o.position.set(x,y,z);if(face==='z')o.rotation.x=Math.PI/2;if(face==='x')o.rotation.z=-Math.PI/2;
  var g=new THREE.Group();g.add(box(r*2,.03,.07,M.dark,0,0,0,false));g.add(box(.07,.03,r*2,M.dark,0,0,0,false));g.add(cyl(.05,.05,.06,M.alu,0,0,0,8));
  o.add(g);house.add(o);spinners.push({o:g,s:7});}
function acUnit(x,y,z,face,sc){var s=sc||1;
  if(face==='x'){house.add(box(.4*s,.75*s,.8*s,M.alu,x,y,z));fan(x+.21*s,y,z,.28*s,'x');}
  else{house.add(box(.8*s,.55*s,.35*s,M.alu,x,y,z));fan(x,y,z+.18*s,.2*s,'z');}}
function chair(x,y,z,ry){var g=new THREE.Group();g.add(box(.45,.06,.45,M.wood,0,.42,0));g.add(box(.45,.45,.06,M.wood,0,.67,-.2));
  [[-.19,-.19],[.19,-.19],[-.19,.19],[.19,.19]].forEach(function(q){g.add(box(.04,.4,.04,M.dark,q[0],.2,q[1],false));});g.position.set(x,y,z);g.rotation.y=ry;house.add(g);}
function cafeSet(x,y,z){house.add(cyl(.45,.45,.05,M.wood,x,y+.75,z,16));house.add(cyl(.04,.04,.75,M.dark,x,y+.37,z,8));
  chair(x,y,z+.75,Math.PI);chair(x,y,z-.75,0);
  house.add(cyl(.03,.03,2.3,M.alu,x,y+1.15,z,6));
  var cn=new THREE.Mesh(new THREE.ConeGeometry(1.2,.4,14),M.brand);cn.position.set(x,y+2.4,z);cn.castShadow=true;house.add(cn);}
function bench(x,z,ry){var g=new THREE.Group();g.add(box(1.4,.08,.45,M.wood,0,.45,0));g.add(box(1.4,.35,.06,M.wood,0,.72,-.2));
  g.add(box(.06,.45,.4,M.dark,-.6,.22,0,false));g.add(box(.06,.45,.4,M.dark,.6,.22,0,false));g.position.set(x,0,z);g.rotation.y=ry;house.add(g);}
function bikeRack(x,z){var g=new THREE.Group();
  for(var i=0;i<3;i++){var a=new THREE.Mesh(new THREE.TorusGeometry(.28,.025,6,14,Math.PI),M.alu);a.position.set(0,.02,i*.5-.5);g.add(a);}
  [-.42,.42].forEach(function(dx){var w=new THREE.Mesh(new THREE.TorusGeometry(.26,.03,6,16),M.dark);w.position.set(dx,.28,.5);g.add(w);});
  g.add(box(.9,.04,.04,M.brand,0,.5,.5,false));g.add(box(.2,.04,.1,M.dark,-.25,.7,.5,false));g.add(box(.04,.04,.3,M.dark,.42,.72,.5,false));
  g.position.set(x,0,z);g.rotation.y=Math.PI/2;house.add(g);}
function whirly(x,y,z){house.add(cyl(.12,.15,.15,M.alu,x,y+.07,z,8));
  var t=new THREE.Group();t.position.set(x,y+.3,z);var m=cyl(.22,.22,.28,M.alu,0,0,0,8);m.material=M.alu;t.add(m);house.add(t);spinners.push({o:t,s:3});}
function antenna(x,y,z){house.add(cyl(.025,.025,2,M.alu,x,y+1,z,6));[1.2,1.5,1.8].forEach(function(h,i){house.add(box(.7-i*.12,.025,.025,M.alu,x,y+h,z,false));});}
function flag(x,y,z){house.add(cyl(.03,.03,3,M.alu,x,y+1.5,z,6));var g=new THREE.Group();g.position.set(x,y+2.55,z);g.add(box(.8,.45,.02,M.brand,.4,0,0,false));house.add(g);sway.push({o:g,p:x,a:.45,ax:'y'});}
function addGauge(x,z,s){var zz=z+.6*s;
  house.add(box(.12,1.7*s,.05,M.dark,x,1.25*s,zz,false));
  var f=new THREE.Mesh(new THREE.BoxGeometry(.07,1,.06),M.water);f.geometry.translate(0,.5,0);f.position.set(x,.4*s,zz+.01);house.add(f);
  gauge={m:f,h:1.5*s,cur:.5};}

function detHouse(){
  var n=state.storeys,u=house.userData,r=u.roof;
  house.add(box(.9,.02,.5,M.dark,2.7,.05,2.95,false));
  house.add(lampBox(1.95,2.0,2.68));
  var np=new THREE.Mesh(new THREE.PlaneGeometry(.34,.34),M.numPlate);np.position.set(3.55,1.55,2.62);house.add(np);
  potPlant(3.5,0,3.0,1.2,M.leaf);
  house.add(cyl(.04,.04,1,M.dark,1.7,.5,6.15,6));house.add(box(.4,.3,.22,M.brand,1.7,1.1,6.15));
  bin(4.55,1.2,M.binG,M.binY);bin(5.2,1.2,M.binG,M.binR);
  acUnit(4.25,.58,-1.5,'x');
  bollard(2.0,3.8);bollard(3.4,3.8);bollard(2.0,5.0);bollard(3.4,5.0);
  addGauge(-5.6,-1.5,1);
  if(n>=2)cafeSet(-2.6,3.25,.4);
  whirly(r.x+r.w/2-.4,u.topY,r.z-r.d/2+.2);antenna(r.x-r.w/2+.4,u.topY,r.z-r.d/2+.2);
}
function detApartment(){
  var n=state.storeys,u=house.userData,AD=6,i;
  house.add(box(.18,.3,.06,M.dark,2.9,1.5,3.04,false));house.add(box(.12,.06,.04,M.lamp,2.9,1.58,3.08,false));
  house.add(lampBox(-1.4,3.0,3.9));house.add(lampBox(.6,3.0,3.9));
  bikeRack(3.4,4.6);bin(-5.2,3.0,M.binG,M.binY);bin(-4.6,3.0,M.binR,M.binY);
  for(i=1;i<n;i++){var b=.2+i*3;
    potPlant(3.6,b+.14,AD/2+.9,1,M.leaf2);potPlant(-1.8,b+.14,AD/2+.9,.9,M.leaf);
    if(i%2===0)acUnit(.6,b+.42,3.35,'z');
  }
  whirly(-3.4,u.topY,-2.4);antenna(2.6,u.topY+1.3,-1.4);
  house.add(box(.7,1,.05,M.dark,2.6,u.topY+.5,-.28,false));
}
function detCommercial(){
  var u=house.userData,y=u.topY,CD=6.4;
  var op=new THREE.Mesh(new THREE.PlaneGeometry(.7,.35),M.open);op.position.set(-2.6,1.7,CD/2+.08);house.add(op);
  var a1=box(.6,.9,.04,M.wood,1.8,.5,4.6);a1.rotation.x=.25;var a2=box(.6,.9,.04,M.wood,1.8,.5,4.82);a2.rotation.x=-.25;house.add(a1,a2);
  bench(-2.5,5.6,0);bikeRack(3,5.7);
  house.add(lampBox(-3,2.8,CD/2+.9));house.add(lampBox(3,2.8,CD/2+.9));
  fan(2.8,y+1.03,-1.2,.45,'y');fan(3.7,y+.72,1.3,.3,'y');
  flag(4.1,y,-2.8);antenna(-4.2,y,-2.7);
}

function makeCar(c){var g=new THREE.Group(),bm=new THREE.MeshStandardMaterial({color:c,roughness:.35,metalness:.3});
  g.add(box(1.6,.36,.78,bm,0,.34,0));g.add(box(.85,.3,.68,M.glass,-.1,.67,0,false));g.add(box(.8,.04,.66,bm,-.1,.84,0));
  [[.5,.4],[.5,-.4],[-.5,.4],[-.5,-.4]].forEach(function(q){var w=cyl(.17,.17,.1,M.dark,q[0],.17,q[1],12);w.rotation.x=Math.PI/2;g.add(w);});
  [.26,-.26].forEach(function(z){g.add(box(.04,.1,.16,M.head,.81,.38,z,false));g.add(box(.04,.1,.16,M.tail,-.81,.38,z,false));});
  return g;}
function makeWalker(shirt){var g=new THREE.Group(),sm=new THREE.MeshStandardMaterial({color:shirt,roughness:.8}),legs=[],arms=[];
  [-.09,.09].forEach(function(z){var p=new THREE.Group();p.position.set(0,.8,z);p.add(box(.14,.8,.14,M.dark,0,-.4,0));g.add(p);legs.push(p);});
  g.add(box(.2,.65,.36,sm,0,1.12,0));
  [-.24,.24].forEach(function(z){var p=new THREE.Group();p.position.set(0,1.38,z);p.add(box(.1,.55,.1,sm,0,-.27,0));g.add(p);arms.push(p);});
  g.add(ico(.14,M.skin,0,1.6,0));g.scale.setScalar(.9);return {g:g,legs:legs,arms:arms};}
function makeBird(i){var g=new THREE.Group();g.add(box(.18,.06,.08,M.bird,0,0,0,false));
  var wl=new THREE.Group(),wr=new THREE.Group();wl.add(box(.34,.015,.1,M.bird,.17,0,0,false));wr.add(box(.34,.015,.1,M.bird,-.17,0,0,false));
  wl.position.z=.03;wr.position.z=.03;g.add(wl,wr);return {g:g,wl:wl,wr:wr,a:i*1.7,r:[11,13.5,12,14][i],y:[9,11,10,12][i],w:[.35,-.28,.4,-.22][i],p:i*2.1};}
function makeCloud(x,y,z,s,v){var g=new THREE.Group();
  [[0,0,0,1.6],[1.6,-.2,.3,1.2],[-1.6,-.1,-.2,1.3],[.6,.6,0,1.2],[-.7,.5,.3,1]].forEach(function(q){var o=new THREE.Mesh(new THREE.IcosahedronGeometry(q[3],1),M.cloud);o.position.set(q[0],q[1],q[2]);g.add(o);});
  g.scale.set(s,s*.7,s);g.position.set(x,y,z);return {g:g,v:v};}

function initWorld(){
  var st=new THREE.Group(),i;
  st.add(box(15,.5,.8,M.path,0,-.25,6.9,false));st.add(box(15,.5,2.8,M.road,0,-.27,8.7,false));
  st.add(box(15.3,.4,3.9,M.soil,0,-.7,8.35,false));st.add(box(15,.14,.1,M.concrete,0,-.01,7.3,false));
  for(i=-3;i<=3;i++)st.add(box(.8,.01,.07,M.white,i*2.2,-.015,8.7,false));
  [-5.6,5.6].forEach(function(x){
    st.add(cyl(.05,.07,3.4,M.dark,x,1.7,7.0,8));st.add(box(.08,.08,.8,M.dark,x,3.4,7.4,false));st.add(box(.3,.1,.3,M.lamp,x,3.34,7.8,false));
    var pl=new THREE.PointLight(0xffd9a0,0,12,2);pl.position.set(x,3.1,7.8);st.add(pl);lampLights.push(pl);});
  [[0xf2f2f2,1.0,8.1,-6],[0x1f6b4a,1.0,8.1,2],[0x27406b,-.8,9.3,5],[0xb94a3a,-.8,9.3,-3]].forEach(function(c){
    var g=makeCar(c[0]);g.position.set(c[3],0,c[2]);if(c[1]<0)g.rotation.y=Math.PI;st.add(g);cars.push({g:g,v:c[1],x:c[3]});});
  [[0xd77a3a,.55,6.78,-3],[0x3a6bd7,-.45,7.05,4]].forEach(function(c){
    var w=makeWalker(c[0]);w.g.position.set(c[3],0,c[2]);if(c[1]<0)w.g.rotation.y=Math.PI;st.add(w.g);w.v=c[1];w.x=c[3];w.ph=c[3];walkers.push(w);});
  root.add(st);
  for(i=0;i<4;i++){var b=makeBird(i);scene.add(b.g);birds.push(b);}
  [[-18,7,-10,1.3,.35],[16,5,-16,1.6,.3],[22,8,6,1.2,.4],[-22,5,10,1.4,.32],[0,9,-24,1.7,.28],[8,4,22,1.1,.45]].forEach(function(c){
    var cl=makeCloud(c[0],c[1],c[2],c[3],c[4]);scene.add(cl.g);clouds.push(cl);});
  var pos=new Float32Array(rainN*6);
  for(i=0;i<rainN;i++){var x=(Math.random()-.5)*26,z=Math.random()*24-12,y=Math.random()*20;
    pos.set([x,y,z,x+.08,y-.6,z],i*6);rainV.push(14+Math.random()*6);}
  var rg=new THREE.BufferGeometry();rg.setAttribute('position',new THREE.BufferAttribute(pos,3));
  rain=new THREE.LineSegments(rg,new THREE.LineBasicMaterial({color:0xa9c8e0,transparent:true,opacity:.5}));rain.frustumCulled=false;rain.visible=false;scene.add(rain);
}

function live(t,dt){
  var i;
  M.solar.emissiveIntensity=state.night?0:.06+.05*Math.sin(t*1.4);
  if(gauge){var tg=state.rain?.95:.5+.05*Math.sin(t*.4);gauge.cur+=(tg-gauge.cur)*Math.min(1,dt*(state.rain?.25:.15));gauge.m.scale.y=Math.max(.02,gauge.cur*gauge.h);}
  if(state.rain&&rain){var pa=rain.geometry.attributes.position.array;
    for(i=0;i<rainN;i++){var k=i*6,y=pa[k+1]-rainV[i]*dt;if(y<0)y=20+Math.random()*2;pa[k+1]=y;pa[k+4]=y-.6;}
    rain.geometry.attributes.position.needsUpdate=true;}
  if(reduce)return;
  sway.forEach(function(q){q.o.rotation[q.ax]=Math.sin(t*(q.ax==='y'?2.2:1.3)+q.p)*q.a;});
  spinners.forEach(function(q){q.o.rotation.y+=q.s*dt;});
  clouds.forEach(function(c){c.g.position.x+=c.v*dt;if(c.g.position.x>34)c.g.position.x=-34;});
  cars.forEach(function(c){c.x+=c.v*dt;if(c.v>0&&c.x>9)c.x=-9;if(c.v<0&&c.x<-9)c.x=9;c.g.position.x=c.x;
    c.g.scale.setScalar(Math.max(.001,Math.min(1,(8.6-Math.abs(c.x))/1.4)));});
  walkers.forEach(function(w){w.x+=w.v*dt;if(w.v>0&&w.x>8.8)w.x=-8.8;if(w.v<0&&w.x<-8.8)w.x=8.8;w.g.position.x=w.x;w.ph+=dt*5.5;
    var sw=Math.sin(w.ph)*.5;w.legs[0].rotation.z=sw;w.legs[1].rotation.z=-sw;w.arms[0].rotation.z=-sw*.8;w.arms[1].rotation.z=sw*.8;
    w.g.position.y=Math.abs(Math.sin(w.ph))*.03;
    w.g.scale.setScalar(.9*Math.max(.001,Math.min(1,(8.4-Math.abs(w.x))/1.2)));});
  birds.forEach(function(b){if(!b.g.visible)return;b.a+=b.w*dt;
    b.g.position.set(Math.cos(b.a)*b.r,b.y+Math.sin(t*.7+b.p)*.4,Math.sin(b.a)*b.r);
    b.g.rotation.y=-Math.atan2(Math.cos(b.a)*Math.sign(b.w),-Math.sin(b.a)*Math.sign(b.w));
    var f=Math.sin(t*9+b.p)*.7;b.wl.rotation.z=f;b.wr.rotation.z=-f;});
}

function build(){
  if(house){root.remove(house);house.traverse(function(o){if(o.geometry)o.geometry.dispose();});winMats.forEach(function(m){m.dispose();});}
  house=new THREE.Group();winMats=[];sway=[];spinners=[];gauge=null;
  ({house:buildHouse,apartment:buildApartment,commercial:buildCommercial})[state.type]();
  ({house:detHouse,apartment:detApartment,commercial:detCommercial})[state.type]();
  var h=house.userData.h||7;camTyT=Math.max(3,h*.45);camRfT=1+Math.max(0,h-7)*.05;
  root.add(house);applyTime();
}

function applyTime(){
  var n=state.night,r=state.rain;
  stage.className='stage '+(n?'night':'day')+(r?' rain':'');
  hemi.intensity=(n?.38:.85)*(r?.8:1);hemi.color.set(n?0x6d86b8:0xffffff);
  sun.color.set(n?0x93a9ff:0xfff1d6);sun.intensity=(n?.5:1.15)*(r?.55:1);
  sun.position.set(n?-8:9,n?12:14,n?6:8);
  winMats.forEach(function(m,i){var q=((i*7919)%13)/13,lit=n&&q>.22;
    m.emissive.set(q>.8?0x9cc6ff:0xffc46b);m.emissiveIntensity=lit?(.55+q*.5):0;});
  M.lamp.emissiveIntensity=n?1.5:0;M.open.emissiveIntensity=n?1.2:.12;M.head.emissiveIntensity=n?1.6:.2;M.tail.emissiveIntensity=n?1.2:.3;
  lampLights.forEach(function(l){l.intensity=n?.9:0;});
  M.cloud.color.set(r?0x8e99a6:n?0x40506e:0xffffff);M.cloud.opacity=r?.85:n?.55:.7;
  M.road.color.set(r?0x3a4045:0x4a4f52);M.road.roughness=r?.3:.9;
  if(rain)rain.visible=r;
  birds.forEach(function(b){b.g.visible=!n&&!r&&!reduce;});
}

// ---------- camera orbit ----------
var th=.72,ph=1.0,dragging=false,lx=0,ly=0;
var camTy=3,camTyT=3,camRf=1,camRfT=1;
function cam(){camTy+=(camTyT-camTy)*.08;camRf+=(camRfT-camRf)*.08;var r=baseRad*zoom*camRf;camera.position.set(r*Math.sin(ph)*Math.sin(th),r*Math.cos(ph)+camTy,r*Math.sin(ph)*Math.cos(th));camera.lookAt(0,camTy,1.5);}
stage.addEventListener('pointerdown',function(e){dragging=true;lx=e.clientX;ly=e.clientY;stage.setPointerCapture(e.pointerId);});
stage.addEventListener('pointermove',function(e){if(!dragging)return;th-=(e.clientX-lx)*.008;ph=Math.min(1.35,Math.max(.5,ph-(e.clientY-ly)*.006));lx=e.clientX;ly=e.clientY;});
stage.addEventListener('pointerup',function(){dragging=false;});
stage.addEventListener('pointercancel',function(){dragging=false;});
stage.addEventListener('wheel',function(e){e.preventDefault();zoom=Math.min(1.35,Math.max(.6,zoom+e.deltaY*.001));},{passive:false});
stage.addEventListener('keydown',function(e){if(e.key==='ArrowLeft')th-=.12;if(e.key==='ArrowRight')th+=.12;});

function size(){var w=stage.clientWidth,h=stage.clientHeight,a=w/h;renderer.setSize(w,h,false);camera.aspect=a;
  camera.fov=a<.9?50:a<1.4?42:36;baseRad=a<.9?32:a<1.4?27:24;camera.updateProjectionMatrix();}
new ResizeObserver(size).observe(stage);size();

var pins={solar:document.getElementById('p-solar'),ins:document.getElementById('p-ins'),tank:document.getElementById('p-tank')};
var v=new THREE.Vector3();
function place(el,p,show){
  if(!show||!state.labels){el.style.opacity=0;return;}
  v.set(p[0],p[1],p[2]).applyMatrix4(root.matrixWorld).project(camera);
  el.style.opacity=v.z<1?1:0;
  el.style.left=((v.x+1)/2*stage.clientWidth)+'px';el.style.top=((1-v.y)/2*stage.clientHeight)+'px';
}
var t0=performance.now(),tl=t0;
/* The scene used to redraw at the display's refresh rate for the whole life of
   the document, whether or not anyone could see it. In the landing page that
   is around 8ms of main thread on every frame — even with the panel thousands
   of pixels below the fold — and the page's own scrolling had to compete with
   it. Three rules now apply instead:

   1. While the panel is off screen, or the tab is hidden, nothing is drawn and
      no frame is even scheduled. The parent's scroll and resize wake it again,
      with a slow safety check in case an event is ever missed.
   2. While it is visible and untouched it draws at about 30fps. A slow orbit
      gains nothing from 120fps, and the freed main thread is exactly what the
      page's scrolling was queueing behind.
   3. While the page itself is scrolling the scene holds still and picks up
      again as soon as the gesture stops. Nobody studies the model mid-scroll. */
var IDLE_MS=1000/30,SCROLL_HOLD=160;
var awake=false,lastDraw=0,scrollTimer=0;

function onScreen(){
  try{
    if(document.visibilityState==='hidden')return false;
    var fe=window.frameElement;
    if(!fe)return true;              // standalone page, or a cross-origin parent: never pause
    var win=fe.ownerDocument.defaultView,r=fe.getBoundingClientRect();
    var vh=(win&&win.innerHeight)||0;
    return r.bottom>-160&&r.top<vh+160;
  }catch(e){return true;}
}

function wake(){if(!awake&&onScreen()){awake=true;lastDraw=0;requestAnimationFrame(loop);}}

function onParentScroll(){
  if(scrollTimer)clearTimeout(scrollTimer);
  awake=false;
  scrollTimer=setTimeout(function(){scrollTimer=0;wake();},SCROLL_HOLD);
}

function loop(){
  if(!awake||!onScreen()){awake=false;return;}   // stop the tick; a scroll, resize or timer restarts it
  var now=performance.now();
  if(!dragging&&now-lastDraw<IDLE_MS){requestAnimationFrame(loop);return;}
  lastDraw=now;
  var t=(now-t0)/1000,dt=Math.min(.05,(now-tl)/1000);tl=now;live(t,dt);
  if(state.spin&&!dragging)th+=.0022;
  if(!reduce)root.position.y=Math.sin(t*.9)*.07;
  cam();root.updateMatrixWorld(true);
  var u=house.userData;
  place(pins.solar,u.solar,u.has);place(pins.ins,u.ins,true);place(pins.tank,u.tank,true);
  renderer.render(scene,camera);requestAnimationFrame(loop);
}

initWorld();build();awake=true;loop();

try{
  var pw=window.frameElement&&window.frameElement.ownerDocument.defaultView;
  if(pw){pw.addEventListener('scroll',onParentScroll,{passive:true});pw.addEventListener('resize',wake);}
}catch(e){}
document.addEventListener('visibilitychange',wake);
setInterval(wake,1200);

function press(id,key,after){var b=document.getElementById(id);b.addEventListener('click',function(){state[key]=!state[key];b.setAttribute('aria-pressed',state[key]);if(after)after();});}
press('solar','solar',build);press('night','night',applyTime);press('rain','rain',applyTime);press('spin','spin');press('labels','labels');
var ranges={house:[1,3],apartment:[3,8],commercial:[1,6]},byType={house:2,apartment:5,commercial:3};
var names={house:'Sydney courtyard house.',apartment:'Sydney apartment building.',commercial:'Sydney commercial building.'};
var labelsAria={house:'Sydney courtyard house with timber upper floor',apartment:'Sydney apartment building with balconies',commercial:'Sydney commercial building with retail frontage'};
function setS(n){var r=ranges[state.type];state.storeys=Math.min(r[1],Math.max(r[0],n));byType[state.type]=state.storeys;document.getElementById('sv').textContent=state.storeys;build();}
function setType(t){state.type=t;state.storeys=byType[t];document.getElementById('sv').textContent=state.storeys;
  document.getElementById('bname').textContent=names[t];
  stage.setAttribute('aria-label','Interactive 3D model of a '+labelsAria[t]+', with rooftop solar and rainwater tank');
  Array.prototype.forEach.call(document.querySelectorAll('[data-t]'),function(b){b.setAttribute('aria-pressed',b.getAttribute('data-t')===t);});
  build();}
Array.prototype.forEach.call(document.querySelectorAll('[data-t]'),function(b){b.addEventListener('click',function(){setType(b.getAttribute('data-t'));});});
document.getElementById('sm').onclick=function(){setS(state.storeys-1);};
document.getElementById('sp').onclick=function(){setS(state.storeys+1);};
})();
