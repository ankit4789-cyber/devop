import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const mount = document.querySelector('#scene');
const openButton = document.querySelector('#openButton');
const opening = document.querySelector('#opening');
const message = document.querySelector('.message');
const musicButton = document.querySelector('#musicButton');
const musicLabel = document.querySelector('#musicLabel');

let opened = false, audio = null, musicOn = false;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(34, 1, .1, 100);
camera.position.set(0, 1.05, 9.2);
const renderer = new THREE.WebGLRenderer({antialias:true, alpha:true, powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
mount.appendChild(renderer.domElement);

scene.add(new THREE.AmbientLight(0xffd8bc, .72));
const key = new THREE.DirectionalLight(0xffe1c2, 3.1); key.position.set(-3,5,5); scene.add(key);
const rim = new THREE.PointLight(0xd99a53, 95, 12); rim.position.set(3,2,1); scene.add(rim);
const redFill = new THREE.PointLight(0x8d1028, 42, 10); redFill.position.set(-3,0,2); scene.add(redFill);
const goldLight = new THREE.PointLight(0xf4c56c, 65, 10); goldLight.position.set(0,2,-2); scene.add(goldLight);

const flower = new THREE.Group(); scene.add(flower);
const bloom = new THREE.Group(); flower.add(bloom);
const goldMat = new THREE.MeshStandardMaterial({color:0xc69a50,metalness:.88,roughness:.23});
const stemMat = new THREE.MeshStandardMaterial({color:0x173e2c,roughness:.68});
const leafMat = new THREE.MeshStandardMaterial({color:0x24563a,roughness:.39,metalness:.08,side:THREE.DoubleSide});
const petalMats = [
 new THREE.MeshPhysicalMaterial({color:0x650817,roughness:.29,metalness:.12,clearcoat:.72,clearcoatRoughness:.2,side:THREE.DoubleSide}),
 new THREE.MeshPhysicalMaterial({color:0x9d1025,roughness:.25,metalness:.1,clearcoat:.85,clearcoatRoughness:.17,side:THREE.DoubleSide}),
 new THREE.MeshPhysicalMaterial({color:0x78091b,roughness:.3,metalness:.16,clearcoat:.8,side:THREE.DoubleSide})
];

function makePetal(length, width, curl, material, goldEdge=false) {
  const g = new THREE.Group();
  const verts=[], uvs=[], indices=[];
  const rows=18, cols=16;
  for(let i=0;i<=rows;i++){
    const t=i/rows;
    for(let j=0;j<=cols;j++){
      const u=j/cols*2-1;
      const w=Math.sin(Math.PI*t*.83)*width*(.22+.78*(1-Math.pow(Math.abs(u),1.65)));
      const x=u*w;
      const y=t*length;
      const z=curl*t*t + .13*Math.pow(u,2)*Math.sin(t*Math.PI) + .035*Math.sin(t*Math.PI*2)*(1-Math.abs(u));
      verts.push(x,y,z); uvs.push(j/cols,t);
    }
  }
  for(let i=0;i<rows;i++)for(let j=0;j<cols;j++){
    const a=i*(cols+1)+j,b=a+cols+1;
    indices.push(a,b,a+1,b,b+1,a+1);
  }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));
  geo.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
  geo.setIndex(indices);geo.computeVertexNormals();
  const mesh=new THREE.Mesh(geo,material);g.add(mesh);
  if(goldEdge){
    const points=[];
    for(let j=0;j<=cols;j++){const u=j/cols*2-1,t=1,w=Math.sin(Math.PI*.83)*width*(.22+.78*(1-Math.pow(Math.abs(u),1.65)));points.push(new THREE.Vector3(u*w,length,curl+.13*u*u));}
    const edgeGeo=new THREE.BufferGeometry().setFromPoints(points);
    const edge=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),48,.008,5,false),goldMat);g.add(edge);
  }
  return g;
}

// A tapered, gently curved stem.
const stemCurve=new THREE.CatmullRomCurve3([new THREE.Vector3(0,-2.5,0),new THREE.Vector3(.06,-1.65,.02),new THREE.Vector3(-.02,-.7,0),new THREE.Vector3(0,.05,0)]);
flower.add(new THREE.Mesh(new THREE.TubeGeometry(stemCurve,40,.055,10,false),stemMat));
function addLeaf(side,height,angle){
  const leaf=new THREE.Group();leaf.position.set(0,height,0);leaf.rotation.y=angle;leaf.rotation.z=side*.45;
  const shape=new THREE.Shape();shape.moveTo(0,0);shape.quadraticCurveTo(side*.42,.42,side*.9,.62);shape.quadraticCurveTo(side*.6,.02,0,0);
  const geo=new THREE.ShapeGeometry(shape,24);const mesh=new THREE.Mesh(geo,leafMat);mesh.rotation.x=-.1;leaf.add(mesh);
  const vein=new THREE.Mesh(new THREE.TubeGeometry(new THREE.LineCurve3(new THREE.Vector3(0,0,.012),new THREE.Vector3(side*.78,.48,.012)),16,.008,5,false),goldMat);leaf.add(vein);
  flower.add(leaf);
}
addLeaf(1,-1.15,.5);addLeaf(-1,-1.8,-.45);addLeaf(1,-.45,1.0);

// Petals are built in nested whorls; bloom is revealed through individual eased rotations.
const petals=[];
const layers=[
 {count:5,r:.10,len:1.18,w:.52,tilt:.16,spread:0.66,offset:0},
 {count:7,r:.19,len:1.34,w:.56,tilt:.34,spread:.92,offset:.28},
 {count:9,r:.27,len:1.42,w:.57,tilt:.50,spread:1.18,offset:.12},
 {count:11,r:.33,len:1.34,w:.54,tilt:.65,spread:1.38,offset:.38}
];
layers.forEach((layer,li)=>{
  for(let i=0;i<layer.count;i++){
    const angle=i/layer.count*Math.PI*2+layer.offset;
    const petal=makePetal(layer.len,layer.w,.17+li*.025,petalMats[(i+li)%3],true);
    petal.position.set(Math.cos(angle)*layer.r, .02+li*.018, Math.sin(angle)*layer.r);
    petal.rotation.y=-angle+Math.PI/2;
    petal.rotation.x=layer.tilt+1.18;
    petal.rotation.z=(i%2?1:-1)*.12;
    petal.userData={angle,finalX:layer.tilt,finalZ:(i%2?1:-1)*.12,delay:.35+li*.38+i*.045,layer:li};
    bloom.add(petal);petals.push(petal);
  }
});
// Inner folded petals create the characteristic rose heart.
for(let i=0;i<5;i++){
  const a=i/5*Math.PI*2;
  const p=makePetal(.88,.38,.13,petalMats[(i+1)%3],true);
  p.position.set(Math.cos(a)*.07,.12,Math.sin(a)*.07);
  p.rotation.y=-a+Math.PI/2;p.rotation.x=1.9;p.rotation.z=.1;
  p.userData={angle:a,finalX:.48,finalZ:.1,delay:.2+i*.16,layer:4};
  bloom.add(p);petals.push(p);
}

// Gold orbital rings.
const orbits=new THREE.Group();scene.add(orbits);
[2.25,2.58,2.88].forEach((r,i)=>{
  const ring=new THREE.Mesh(new THREE.TorusGeometry(r,.009+(i===1?.006:0),8,180),new THREE.MeshStandardMaterial({color:i===1?0xf1ce83:0xb98a48,metalness:.94,roughness:.2,emissive:0x6a3c12,emissiveIntensity:.25}));
  ring.rotation.x=Math.PI/2+(i-1)*.43;ring.rotation.y=(i-1)*.3;orbits.add(ring);
});
const stars=new THREE.Group();scene.add(stars);
const particleCount=850, positions=new Float32Array(particleCount*3), sizes=new Float32Array(particleCount);
for(let i=0;i<particleCount;i++){
  const radius=2.1+Math.random()*4.4,a=Math.random()*Math.PI*2;
  positions[i*3]=Math.cos(a)*radius;positions[i*3+1]=(Math.random()-.5)*6;positions[i*3+2]=Math.sin(a)*radius;
  sizes[i]=Math.random();
}
const pgeo=new THREE.BufferGeometry();pgeo.setAttribute('position',new THREE.BufferAttribute(positions,3));pgeo.setAttribute('aSize',new THREE.BufferAttribute(sizes,1));
const pmat=new THREE.PointsMaterial({color:0xe6bb70,size:.025,transparent:true,opacity:.72,depthWrite:false,blending:THREE.AdditiveBlending});
const dust=new THREE.Points(pgeo,pmat);scene.add(dust);
const starGeo=new THREE.BufferGeometry();const starPos=[];
for(let i=0;i<45;i++){const a=Math.random()*Math.PI*2,r=2.5+Math.random()*3.5;starPos.push(Math.cos(a)*r,(Math.random()-.5)*4,Math.sin(a)*r);}
starGeo.setAttribute('position',new THREE.Float32BufferAttribute(starPos,3));
const starPoints=new THREE.Points(starGeo,new THREE.PointsMaterial({color:0xffe6ae,size:.045,transparent:true,opacity:.8,blending:THREE.AdditiveBlending}));scene.add(starPoints);

let bloomProgress=0, startTime=0;
function ease(t){return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;}
function resize(){const w=mount.clientWidth,h=mount.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
new ResizeObserver(resize).observe(mount);resize();

function animate(now){
  requestAnimationFrame(animate);
  const t=now*.001;
  const elapsed=opened?(now-startTime)*.001:0;
  bloomProgress=opened?Math.min(1,elapsed/5.6):0;
  petals.forEach(p=>{
    const d=p.userData.delay, local=Math.max(0,Math.min(1,(elapsed-d)/2.8)),e=ease(local);
    p.rotation.x=1.9+(p.userData.finalX-1.9)*e;
    p.rotation.z=p.userData.finalZ*e;
    p.position.y=.02+p.userData.layer*.018+Math.sin(t*1.3+p.userData.angle)*.008*e;
  });
  flower.position.y=Math.sin(t*.75)*.075;
  flower.rotation.y=opened?t*.23:Math.sin(t*.2)*.12;
  flower.rotation.x=Math.sin(t*.38)*.035;
  bloom.rotation.y=Math.sin(t*.24)*.045;
  orbits.rotation.y=t*.13;orbits.rotation.x=Math.sin(t*.18)*.12;
  dust.rotation.y=t*.018;dust.rotation.x=Math.sin(t*.1)*.025;
  starPoints.rotation.y=-t*.025;
  camera.position.x=Math.sin(t*.17)*.09;camera.lookAt(0,-.12,0);
  if(opened&&elapsed>7.1)message.classList.add('visible');
  renderer.render(scene,camera);
}
requestAnimationFrame(animate);

// User-provided song. Playback begins only after the visitor taps the opening button.
const song = new Audio('./assets/judaa-hum-ho-gaye.mp3');
song.loop = true;
song.preload = 'auto';
song.volume = 0.78;

async function startMusic(){
  await song.play();
  musicOn = true;
  musicButton.classList.remove('muted');
  musicLabel.textContent = 'MUSIC ON';
  musicButton.setAttribute('aria-label','Turn music off');
}
function stopMusic(){
  song.pause();
  musicOn = false;
  musicButton.classList.add('muted');
  musicLabel.textContent = 'MUSIC OFF';
  musicButton.setAttribute('aria-label','Turn music on');
}
openButton.addEventListener('click',async()=>{
  if(opened)return;opened=true;startTime=performance.now();
  opening.classList.add('gone');musicButton.hidden=false;
  try{await startMusic()}catch(e){musicLabel.textContent='TAP MUSIC';musicButton.classList.add('muted');}
});
musicButton.addEventListener('click',async()=>{
  if(musicOn)stopMusic();
  else{try{await startMusic()}catch(e){musicOn=false;musicLabel.textContent='TAP MUSIC';}}
});
